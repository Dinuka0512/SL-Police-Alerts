import json
import csv
import os
import sys
import time
import asyncio
import aiohttp
from datetime import datetime

# ============================================
# CONFIG
# ============================================
INPUT_JSON = "accidentsReport.json"
OUTPUT_CSV = "output.csv"
FAILED_CSV = "failed.csv"          # ⭐ Failed records මෙතන
ERROR_LOG = "errors.log"

MAX_DATE = datetime(2030, 12, 31)

CONCURRENT_REQUESTS = 2
DELAY_BETWEEN_REQUESTS = 0.7
MAX_RETRIES = 4
RETRY_DELAY = 3

# NASA POWER API
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# ============================================
# CSV COLUMNS
# ============================================
CSV_COLUMNS = [
    "id", "date", "time", "year", "month", "day", "hour", "day_of_week",
    "district", "city", "latitude", "longitude", "deaths_count",
    "weather_code", "temp_max", "temp_min", "temp_mean",
    "precipitation_sum", "rain_sum", "snowfall_sum",
    "windspeed_max", "windgusts_max", "humidity_mean"
]

ALL_COLUMNS = ["_original_index"] + CSV_COLUMNS

# ============================================
# GLOBAL STATE
# ============================================
weather_cache = {}

error_counter = {
    "timeout": 0, "rate_limit": 0, "http_error": 0,
    "no_data": 0, "exception": 0, "success": 0
}

progress = {"done": 0, "saved": 0, "skipped": 0,
            "weather_ok": 0, "weather_fail": 0}
TOTAL = 0

# ⭐ Failed records (retry සඳහා)
failed_records = []   # list of dicts: {"_original_index": idx, "reason": "..."}
failed_lock = asyncio.Lock()


# ============================================
# HELPERS
# ============================================
def load_processed_ids():
    """output.csv එකේ process වුණු IDs"""
    if not os.path.exists(OUTPUT_CSV):
        return set()
    try:
        with open(OUTPUT_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            ids = set()
            for row in reader:
                try:
                    if "_original_index" in row and row["_original_index"]:
                        ids.add(int(row["_original_index"]))
                except (ValueError, KeyError):
                    pass
            return ids
    except Exception as e:
        print(f"⚠️  Load processed error: {e}")
        return set()


def load_failed_ids():
    """failed.csv එකේ තියෙන IDs (retry සඳහා)"""
    if not os.path.exists(FAILED_CSV):
        return set()
    try:
        with open(FAILED_CSV, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            ids = set()
            for row in reader:
                try:
                    if "_original_index" in row and row["_original_index"]:
                        ids.add(int(row["_original_index"]))
                except (ValueError, KeyError):
                    pass
            return ids
    except Exception as e:
        print(f"⚠️  Load failed error: {e}")
        return set()


def log_error(msg):
    with open(ERROR_LOG, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now().isoformat()} | {msg}\n")


def print_progress():
    pct = (progress["done"] / TOTAL * 100) if TOTAL else 0
    line = (
        f"\r⚡ {progress['done']}/{TOTAL} ({pct:.1f}%) | "
        f"✅ {progress['saved']} | "
        f"❌ {len(failed_records)} | "
        f"🌤️  OK:{progress['weather_ok']} FAIL:{progress['weather_fail']} | "
        f"⏭️  Skip:{progress['skipped']}"
    )
    sys.stdout.write(line)
    sys.stdout.flush()


# ============================================
# WEATHER CODE
# ============================================
def derive_weather_code(precipitation, humidity):
    if precipitation is None or precipitation == "":
        return ""
    try:
        p = float(precipitation)
        if p <= 0.1:
            return 0
        elif p <= 5:
            return 1
        elif p <= 20:
            return 2
        else:
            return 3
    except Exception:
        return ""


# ============================================
# FETCH NASA POWER
# ============================================
async def fetch_weather(session, lat, lon, date_str):
    cache_key = f"{lat}_{lon}_{date_str}"
    if cache_key in weather_cache:
        return weather_cache[cache_key]

    empty = {
        "weather_code": "", "temp_max": "", "temp_min": "", "temp_mean": "",
        "precipitation_sum": "", "rain_sum": "", "snowfall_sum": "",
        "windspeed_max": "", "windgusts_max": "", "humidity_mean": "",
        "_error": ""
    }

    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        empty["_error"] = "bad_date"
        return empty

    start_date = dt.strftime("%Y%m%d")

    params = {
        "parameters": ",".join([
            "T2M", "T2M_MAX", "T2M_MIN",
            "PRECTOTCORR", "WS10M", "RH2M"
        ]),
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start_date,
        "end": start_date,
        "format": "JSON",
        "time-standard": "LST"
    }

    last_error = "unknown"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.get(
                NASA_POWER_URL, params=params,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:

                if response.status == 429:
                    error_counter["rate_limit"] += 1
                    wait = RETRY_DELAY * attempt * 2
                    await asyncio.sleep(wait)
                    last_error = f"429 (attempt {attempt})"
                    continue

                if response.status != 200:
                    error_counter["http_error"] += 1
                    last_error = f"HTTP {response.status}"
                    await asyncio.sleep(RETRY_DELAY * attempt)
                    continue

                data = await response.json()
                properties = data.get("properties", {})
                parameter = properties.get("parameter", {})

                t2m = parameter.get("T2M", {})
                t2m_max = parameter.get("T2M_MAX", {})
                t2m_min = parameter.get("T2M_MIN", {})
                precipitation = parameter.get("PRECTOTCORR", {})
                wind = parameter.get("WS10M", {})
                humidity = parameter.get("RH2M", {})

                def clean(value):
                    if value is None:
                        return ""
                    try:
                        v = float(value)
                        if v <= -900:
                            return ""
                        return v
                    except Exception:
                        return ""

                temp_mean = clean(t2m.get(start_date))
                temp_max = clean(t2m_max.get(start_date))
                temp_min = clean(t2m_min.get(start_date))
                precip = clean(precipitation.get(start_date))
                windspeed = clean(wind.get(start_date))
                humidity_value = clean(humidity.get(start_date))

                # ⭐ No data → mark failed
                if temp_mean == "" and precip == "" and humidity_value == "":
                    error_counter["no_data"] += 1
                    empty["_error"] = "no_data"
                    weather_cache[cache_key] = empty
                    return empty

                weather_code = derive_weather_code(precip, humidity_value)

                result = {
                    "weather_code": weather_code,
                    "temp_max": temp_max,
                    "temp_min": temp_min,
                    "temp_mean": temp_mean,
                    "precipitation_sum": precip,
                    "rain_sum": precip,
                    "snowfall_sum": "",
                    "windspeed_max": windspeed,
                    "windgusts_max": "",
                    "humidity_mean": humidity_value,
                    "_error": ""
                }

                error_counter["success"] += 1
                weather_cache[cache_key] = result
                await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
                return result

        except asyncio.TimeoutError:
            error_counter["timeout"] += 1
            last_error = f"Timeout (attempt {attempt})"
            await asyncio.sleep(RETRY_DELAY * attempt)

        except asyncio.CancelledError:
            raise

        except aiohttp.ClientError as e:
            error_counter["exception"] += 1
            last_error = f"ClientError: {e}"
            await asyncio.sleep(RETRY_DELAY * attempt)

        except Exception as e:
            error_counter["exception"] += 1
            last_error = f"{type(e).__name__}: {e}"
            await asyncio.sleep(RETRY_DELAY * attempt)

    log_error(f"{date_str} | {lat},{lon} | FAILED: {last_error}")
    empty["_error"] = last_error
    weather_cache[cache_key] = empty
    return empty


# ============================================
# PROCESS ONE RECORD
# ============================================
async def process_item(session, idx, item, semaphore,
                       csv_writer, csv_file, lock):
    async with semaphore:

        # ---- Parse date ----
        added = item.get("sinhala_added_date", "")
        dt = None
        try:
            dt = datetime.strptime(added, "%Y-%m-%d %H:%M:%S")
        except Exception:
            try:
                dt = datetime.strptime(added, "%Y-%m-%d %H:%M")
            except Exception:
                async with lock:
                    progress["skipped"] += 1
                    progress["done"] += 1
                    print_progress()
                return

        if dt > MAX_DATE:
            async with lock:
                progress["skipped"] += 1
                progress["done"] += 1
                print_progress()
            return

        date_str = dt.strftime("%Y-%m-%d")
        time_str = dt.strftime("%H:%M:%S")

        city = item.get("city", "")
        district = item.get("District", "")

        try:
            lat = float(item.get("Lattitude", 0))
            lon = float(item.get("lontude", 0))
        except Exception:
            lat, lon = 0.0, 0.0

        deaths = item.get("death_count", 0)

        # ---- Weather ----
        w = await fetch_weather(session, lat, lon, date_str)

        # ---- Check weather ----
        has_weather = w["temp_mean"] != ""

        # ---- Build row ----
        row = {
            "_original_index": idx, "id": idx + 1,
            "date": date_str, "time": time_str,
            "year": dt.year, "month": dt.month, "day": dt.day, "hour": dt.hour,
            "day_of_week": dt.strftime("%A"),
            "district": district, "city": city,
            "latitude": lat, "longitude": lon,
            "deaths_count": deaths,
            **{k: v for k, v in w.items() if k != "_error"}
        }

        async with lock:
            # ⭐ Weather OK → save to output.csv
            if has_weather:
                csv_writer.writerow(row)
                csv_file.flush()
                progress["weather_ok"] += 1
                progress["saved"] += 1

            # ⭐ Weather FAIL → save to failed.csv (retry සඳහා)
            else:
                progress["weather_fail"] += 1
                reason = w.get("_error", "no_data")
                async with failed_lock:
                    failed_records.append({
                        "_original_index": idx,
                        "reason": reason,
                        "lat": lat,
                        "lon": lon,
                        "date": date_str,
                        "city": city
                    })

            progress["done"] += 1
            print_progress()


# ============================================
# SAVE FAILED
# ============================================
def save_failed_csv():
    """Failed records → failed.csv (next run retry සඳහා)"""
    if not failed_records:
        # No failures → delete old failed.csv
        if os.path.exists(FAILED_CSV):
            os.remove(FAILED_CSV)
            print(f"\n🗑️  No failures — removed old {FAILED_CSV}")
        return

    with open(FAILED_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "_original_index", "reason", "lat", "lon", "date", "city"
        ])
        writer.writeheader()
        for r in failed_records:
            writer.writerow(r)

    print(f"\n💾 Saved {len(failed_records)} failed records → {FAILED_CSV}")


# ============================================
# MAIN
# ============================================
async def main():
    global TOTAL

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_all = len(data)
    print(f"📊 Total records in JSON: {total_all}")

    # ⭐ Processed IDs (success)
    processed_ids = load_processed_ids()
    print(f"✅ Already processed (output.csv): {len(processed_ids)}")

    # ⭐ Failed IDs (from previous run)
    failed_ids = load_failed_ids()
    if failed_ids:
        print(f"⚠️  Failed from previous run (failed.csv): {len(failed_ids)}")

    # ⭐ Decide what to process
    # - If failed.csv exists AND has IDs → only retry those
    # - Else → process all not-yet-processed
    if failed_ids:
        # Retry mode
        todo = [(i, item) for i, item in enumerate(data) if i in failed_ids]
        print(f"\n🔁 RETRY MODE — processing {len(todo)} failed records")
    else:
        # Fresh mode
        todo = [(i, item) for i, item in enumerate(data) if i not in processed_ids]
        print(f"\n🚀 FRESH MODE — processing {len(todo)} new records")

    TOTAL = len(todo)

    if not todo:
        print("✅ Nothing to process!")
        return

    # ---- Open output.csv (append) ----
    csv_exists = os.path.exists(OUTPUT_CSV) and len(processed_ids) > 0
    if csv_exists:
        csv_file = open(OUTPUT_CSV, "a", encoding="utf-8-sig", newline="")
        csv_writer = csv.DictWriter(csv_file, fieldnames=ALL_COLUMNS)
        print(f"📝 Appending to {OUTPUT_CSV}")
    else:
        csv_file = open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="")
        csv_writer = csv.DictWriter(csv_file, fieldnames=ALL_COLUMNS)
        csv_writer.writeheader()
        print(f"📝 Creating {OUTPUT_CSV}")

    print("=" * 70 + "\n")

    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    lock = asyncio.Lock()
    connector = aiohttp.TCPConnector(
        limit=CONCURRENT_REQUESTS * 2,
        ttl_dns_cache=300
    )

    try:
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [
                asyncio.create_task(
                    process_item(session, idx, item, semaphore,
                                 csv_writer, csv_file, lock)
                )
                for idx, item in todo
            ]
            await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopped by user — saving progress...")
    finally:
        csv_file.close()
        print()  # newline after counter

    # ⭐ Save failed for next run
    save_failed_csv()

    # ---- Final report ----
    print(f"\n{'='*70}")
    print(f"✅ DONE")
    print(f"   Saved to output.csv:  {progress['saved']}")
    print(f"   Skipped:              {progress['skipped']}")
    print(f"   Weather OK:           {progress['weather_ok']}")
    print(f"   Weather FAIL:         {progress['weather_fail']}")
    print(f"\n📊 Error breakdown:")
    for k, v in error_counter.items():
        print(f"   {k}: {v}")
    print(f"\n📄 Files:")
    print(f"   ✅ {OUTPUT_CSV}    ← success records")
    if failed_records:
        print(f"   ⚠️  {FAILED_CSV}    ← failed records ({len(failed_records)})")
        print(f"   🔁 Next run කරාම මේවා විතරයි retry කරන්නේ!")
    else:
        print(f"   🎉 No failures!")
    print(f"{'='*70}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Stopped.")
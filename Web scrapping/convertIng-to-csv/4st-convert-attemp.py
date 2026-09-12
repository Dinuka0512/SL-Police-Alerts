import csv
import os
import time
import urllib.request
import urllib.parse
import json
from datetime import datetime, date

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_CSV  = "../data/raw/extracted/4th-with-weather.csv"
OUTPUT_CSV = "../data/raw/extracted/4th-with-weather.csv"

# Open-Meteo Archive API - Daily weather variables
DAILY_VARS = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "precipitation_sum",
    "rain_sum",
    "snowfall_sum",
    "windspeed_10m_max",
    "windgusts_10m_max",
    "relative_humidity_2m_mean",
]

# 🆕 deaths_count එකතු කළා (latitude/longitude ට පස්සේ)
FINAL_COLUMNS = [
    'id', 'date', 'time', 'year', 'month', 'day',
    'hour', 'day_of_week', 'district', 'city',
    'latitude', 'longitude',
    'deaths_count',          # 🆕 ← මේක එකතු කළා
    # --- weather columns ---
    'weather_code',
    'temp_max', 'temp_min', 'temp_mean',
    'precipitation_sum', 'rain_sum', 'snowfall_sum',
    'windspeed_max', 'windgusts_max',
    'humidity_mean',
]

WEATHER_KEYS = [
    'weather_code',
    'temp_max', 'temp_min', 'temp_mean',
    'precipitation_sum', 'rain_sum', 'snowfall_sum',
    'windspeed_max', 'windgusts_max',
    'humidity_mean',
]

# Sri Lanka bounding box
SL_LAT_MIN, SL_LAT_MAX = 5.5, 10.0
SL_LON_MIN, SL_LON_MAX = 79.5, 82.0

TODAY = date.today()


# ============================================================
# VALIDATION HELPERS
# ============================================================

def is_valid_number(value):
    if value is None:
        return None
    s = str(value).strip().lower()
    if s in ('', 'nan', 'nun', 'null', 'none', 'n/a', 'na', '-', '--'):
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def is_valid_date(date_str):
    if not date_str:
        return None
    s = str(date_str).strip()
    if s.lower() in ('nan', 'nun', 'null', 'none', 'n/a', ''):
        return None
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def is_valid_coord(lat, lon):
    if lat is None or lon is None:
        return False
    if not (SL_LAT_MIN <= lat <= SL_LAT_MAX):
        return False
    if not (SL_LON_MIN <= lon <= SL_LON_MAX):
        return False
    return True


def has_weather(row):
    """
    Row එකේ දැනටමත් weather data තියෙනවද බලනවා.
    හැම weather key එකක්ම තියෙනවා නම් විතරයි True.
    """
    for k in WEATHER_KEYS:
        val = row.get(k)
        if val is None:
            return False
        s = str(val).strip().lower()
        if s in ('', 'nan', 'nun', 'null', 'none'):
            return False
    return True


# ============================================================
# WEATHER FETCH
# ============================================================

def fetch_weather(lat, lon, date_str):
    params = {
        "latitude":   lat,
        "longitude":  lon,
        "start_date": date_str,
        "end_date":   date_str,
        "daily":      ",".join(DAILY_VARS),
        "timezone":   "Asia/Colombo",
    }

    url = "https://archive-api.open-meteo.com/v1/archive?" + urllib.parse.urlencode(params)

    try:
        with urllib.request.urlopen(url, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        daily = data.get("daily", {})
        return {
            'weather_code':      daily.get("weather_code",              [None])[0],
            'temp_max':          daily.get("temperature_2m_max",        [None])[0],
            'temp_min':          daily.get("temperature_2m_min",        [None])[0],
            'temp_mean':         daily.get("temperature_2m_mean",       [None])[0],
            'precipitation_sum': daily.get("precipitation_sum",         [None])[0],
            'rain_sum':          daily.get("rain_sum",                  [None])[0],
            'snowfall_sum':      daily.get("snowfall_sum",              [None])[0],
            'windspeed_max':     daily.get("windspeed_10m_max",         [None])[0],
            'windgusts_max':     daily.get("windgusts_10m_max",         [None])[0],
            'humidity_mean':     daily.get("relative_humidity_2m_mean", [None])[0],
        }

    except Exception as e:
        print(f"   ⚠️  Weather fetch failed for {date_str} ({lat},{lon}): {e}")
        return {k: None for k in WEATHER_KEYS}


# ============================================================
# CLEANING STEP
# ============================================================

def clean_rows(rows):
    clean = []
    stats = {
        'total':        len(rows),
        'removed_date': 0,
        'removed_future': 0,
        'removed_latlon': 0,
        'removed_coord': 0,
        'kept': 0,
    }

    for row in rows:
        date_str = (row.get('date') or '').strip()

        parsed = is_valid_date(date_str)
        if parsed is None:
            stats['removed_date'] += 1
            continue

        if parsed > TODAY:
            stats['removed_future'] += 1
            continue

        lat = is_valid_number(row.get('latitude'))
        lon = is_valid_number(row.get('longitude'))
        if lat is None or lon is None:
            stats['removed_latlon'] += 1
            continue

        if not is_valid_coord(lat, lon):
            stats['removed_coord'] += 1
            continue

        clean.append(row)
        stats['kept'] += 1

    return clean, stats


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("STEP 4: Weather fetch (RESUME MODE)")
    print("=" * 60)

    if not os.path.exists(INPUT_CSV):
        print(f"❌ ERROR: Input file not found: {INPUT_CSV}")
        return

    # ---- 1. Read input ----
    print(f"Loading: {INPUT_CSV}")
    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"✅ Loaded {len(rows)} records.")
    print(f"📋 Input columns: {list(rows[0].keys()) if rows else 'N/A'}")
    print()

    # ---- 2. CLEAN ----
    print("🧹 Cleaning null / invalid rows...")
    clean, stats = clean_rows(rows)

    print()
    print("=" * 60)
    print("📋 CLEANING REPORT")
    print("=" * 60)
    print(f"Total loaded          : {stats['total']}")
    print(f"❌ Removed - bad date  : {stats['removed_date']}")
    print(f"❌ Removed - future    : {stats['removed_future']}")
    print(f"❌ Removed - NaN lat/lon: {stats['removed_latlon']}")
    print(f"❌ Removed - out of SL : {stats['removed_coord']}")
    print(f"✅ Clean records       : {stats['kept']}")
    print("=" * 60)

    if stats['kept'] == 0:
        print("❌ No valid records left. Exiting.")
        return

    # ---- 3. Weather fetch (SKIP rows with weather) ----
    print()
    print("🌤  Checking weather data...")
    print()

    cache = {}
    fetched = 0
    cache_hits = 0
    skipped = 0
    failed = 0
    total = len(clean)

    for i, row in enumerate(clean, 1):

        # දැනටමත් weather තියෙනවා නම් → SKIP
        if has_weather(row):
            skipped += 1
            continue

        for k in WEATHER_KEYS:
            if k not in row or row[k] is None:
                row[k] = ''

        date_str = (row.get('date') or '').strip()
        lat = float(row['latitude'])
        lon = float(row['longitude'])

        key = (date_str, round(lat, 4), round(lon, 4))

        if key in cache:
            weather = cache[key]
            cache_hits += 1
        else:
            print(f"[{i}/{total}] 🌤  {date_str} @ ({lat}, {lon})")
            weather = fetch_weather(lat, lon, date_str)
            cache[key] = weather
            fetched += 1
            time.sleep(0.3)

        if all(v is None for v in weather.values()):
            failed += 1

        for k, v in weather.items():
            row[k] = '' if v is None else v

    # ---- 4. Write output ----
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FINAL_COLUMNS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(clean)

    # ---- 5. Summary ----
    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Clean records        : {len(clean)}")
    print(f"⏭️  Skipped (had data): {skipped}")
    print(f"🌤  Fetched (new)     : {fetched}")
    print(f"💾 Cache hits         : {cache_hits}")
    print(f"⚠️  Failed fetches    : {failed}")
    print(f"Output file          : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    main()
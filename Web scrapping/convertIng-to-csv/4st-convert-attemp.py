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

INPUT_3RD  = "../data/raw/extracted/3rd-converted.csv"
INPUT_4TH  = "../data/raw/extracted/4th-with-weather.csv"
OUTPUT_CSV = "../data/raw/extracted/4th-with-weather.csv"

# 🆕 Deaths count validation - 3rd එකට match වෙන්න 40
MAX_REASONABLE_DEATHS = 40

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

FINAL_COLUMNS = [
    'id', 'date', 'time', 'year', 'month', 'day',
    'hour', 'day_of_week', 'district', 'city',
    'latitude', 'longitude',
    'deaths_count',
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
    """Row එකේ දැනටමත් weather data තියෙනවද?"""
    for k in WEATHER_KEYS:
        val = row.get(k)
        if val is None:
            return False
        s = str(val).strip().lower()
        if s in ('', 'nan', 'nun', 'null', 'none'):
            return False
    return True


# ============================================================
# DEATHS COUNT VALIDATION (3rd එකට match වෙන්න)
# ============================================================

def validate_deaths_count(value, max_allowed=MAX_REASONABLE_DEATHS):
    """
    Deaths count එක validate කරනවා - 3rd code එකට match වෙන්න.
    
    Rules:
      - None / empty / invalid → 0
      - Negative               → 0
      - > max_allowed (40)     → 1  🆕
      - අනිත් හැම එකක්ම      → එහෙමම
    """
    if value is None:
        return 0
    
    s = str(value).strip().lower()
    if s in ('', 'nan', 'nun', 'null', 'none', 'n/a', 'na', '-'):
        return 0
    
    try:
        n = float(s)
    except (ValueError, TypeError):
        return 0
    
    # Negative → 0
    if n < 0:
        return 0
    
    # 🆕 40ට වැඩි නම් → 1 (3rd එකට match වෙන්න)
    if n > max_allowed:
        return 1
    
    return int(n)


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
# STEP 1: Merge deaths_count from 3rd → 4th (ALWAYS OVERWRITE)
# ============================================================

def load_csv(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader), reader.fieldnames


def merge_deaths_count(rows_4th, rows_3rd):
    """
    3rd එකෙන් id → deaths_count map එකක් හදලා,
    4th rows වලට ALWAYS OVERWRITE කරනවා.
    
    🆕 හැමවෙලේම 3rd එකේ අගයෙන් replace කරනවා - 
    දැනටමත් deaths_count තිබුනත්, 3rd එකේ අලුත් අගය ගන්නවා.
    """
    print("🔗 STEP 1: Merging deaths_count from 3rd → 4th")
    print("-" * 60)

    deaths_by_id = {}
    invalid_in_3rd = 0

    for row in rows_3rd:
        rid = str(row.get('id', '')).strip()
        if not rid:
            continue

        raw = row.get('deaths_count', 0)
        clean = validate_deaths_count(raw)

        # 🆕 3rd එකේ raw value > 40 නම් → log
        try:
            if float(str(raw).strip()) > MAX_REASONABLE_DEATHS:
                invalid_in_3rd += 1
                print(f"   ⚠️  id={rid}: deaths_count={raw} > {MAX_REASONABLE_DEATHS} → 1")
        except (ValueError, TypeError):
            pass

        deaths_by_id[rid] = clean

    print(f"  3rd file deaths_count entries : {len(deaths_by_id)}")
    if invalid_in_3rd:
        print(f"  ⚠️  Invalid (> {MAX_REASONABLE_DEATHS})      : {invalid_in_3rd}")
    print()

    matched = 0
    unmatched = 0

    # 🆕 හැම row එකකම deaths_count ALWAYS overwrite කරන්න
    for row in rows_4th:
        rid = str(row.get('id', '')).strip()

        if rid in deaths_by_id:
            row['deaths_count'] = deaths_by_id[rid]
            matched += 1
        else:
            row['deaths_count'] = 0
            unmatched += 1

    print(f"  ✅ Matched & overwritten : {matched}")
    print(f"  ⚠️  Unmatched (set 0)    : {unmatched}")
    print()

    return rows_4th


# ============================================================
# STEP 2: Fill weather (skip if exists)
# ============================================================

def fill_weather(rows):
    print("🌤  STEP 2: Checking & filling weather data")
    print("-" * 60)

    cache = {}
    fetched = 0
    cache_hits = 0
    skipped = 0
    failed = 0
    total = len(rows)

    for i, row in enumerate(rows, 1):

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

    print()
    print(f"  ⏭️  Skipped (had data): {skipped}")
    print(f"  🌤  Fetched (new)     : {fetched}")
    print(f"  💾 Cache hits         : {cache_hits}")
    print(f"  ⚠️  Failed fetches    : {failed}")
    print()

    return rows


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("STEP 4: Merge deaths_count + Fill weather")
    print(f"        (deaths_count > {MAX_REASONABLE_DEATHS} → 1)")
    print("=" * 60)
    print()

    if not os.path.exists(INPUT_3RD):
        print(f"❌ ERROR: 3rd file not found: {INPUT_3RD}")
        return
    if not os.path.exists(INPUT_4TH):
        print(f"❌ ERROR: 4th file not found: {INPUT_4TH}")
        return

    # ---- 1. Load 3rd ----
    print(f"📂 Loading 3rd: {INPUT_3RD}")
    rows_3rd, cols_3rd = load_csv(INPUT_3RD)
    print(f"  ✅ {len(rows_3rd)} rows")
    print(f"  📋 Columns: {cols_3rd}")
    print()

    # ---- 2. Load 4th ----
    print(f"📂 Loading 4th: {INPUT_4TH}")
    rows_4th, cols_4th = load_csv(INPUT_4TH)
    print(f"  ✅ {len(rows_4th)} rows")
    print(f"  📋 Columns: {cols_4th}")
    print()

    # ---- 3. STEP 1: Merge deaths_count (ALWAYS overwrite) ----
    rows_4th = merge_deaths_count(rows_4th, rows_3rd)

    # ---- 4. Clean invalid rows ----
    print("🧹 Cleaning null / invalid rows...")
    clean, stats = clean_rows(rows_4th)

    print()
    print("📋 CLEANING REPORT")
    print("-" * 60)
    print(f"  Total loaded          : {stats['total']}")
    print(f"  ❌ Removed - bad date  : {stats['removed_date']}")
    print(f"  ❌ Removed - future    : {stats['removed_future']}")
    print(f"  ❌ Removed - NaN lat/lon: {stats['removed_latlon']}")
    print(f"  ❌ Removed - out of SL : {stats['removed_coord']}")
    print(f"  ✅ Clean records       : {stats['kept']}")
    print()

    if stats['kept'] == 0:
        print("❌ No valid records left. Exiting.")
        return

    # ---- 5. STEP 2: Fill weather ----
    clean = fill_weather(clean)

    # ---- 6. Final deaths_count sanity check ----
    print("🔍 STEP 3: Final deaths_count validation")
    print("-" * 60)
    invalid_final = 0
    for row in clean:
        raw = row.get('deaths_count')
        clean_val = validate_deaths_count(raw)
        if str(raw).strip() != str(clean_val):
            invalid_final += 1
        row['deaths_count'] = clean_val

    print(f"  Fixed invalid values : {invalid_final}")
    print()

    # ---- 7. Write output ----
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FINAL_COLUMNS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(clean)

    # ---- 8. Final summary ----
    total_deaths = 0
    for r in clean:
        try:
            total_deaths += int(float(r.get('deaths_count', 0)))
        except (ValueError, TypeError):
            pass

    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Clean records        : {len(clean)}")
    print(f"Total deaths         : {total_deaths}")
    print(f"Max allowed deaths   : {MAX_REASONABLE_DEATHS}")
    print(f"Output file          : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    main()
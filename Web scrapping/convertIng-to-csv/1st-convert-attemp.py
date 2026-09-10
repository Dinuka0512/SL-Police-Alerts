import json
import csv
import os
import re
from datetime import datetime


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_CSV = "../data/raw/extracted/1st-converted.csv"
OUTPUT_CSV = "../data/raw/extracted/2nd-converted.csv"


# ============================================================
# EXTRACT DATE AND TIME
# ============================================================

def extract_date_time(date_string):
    
    if not date_string:
        return None, None, None, None, None, None, None
    
    date_string = str(date_string).strip()
    
    # Format: "2025-12-31 12:29:10"
    match = re.match(
        r"(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})",
        date_string
    )
    
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))
        hour = int(match.group(4))
        minute = int(match.group(5))
        second = int(match.group(6))
        
        date_str = f"{year:04d}-{month:02d}-{day:02d}"
        time_str = f"{hour:02d}:{minute:02d}:{second:02d}"
        
        try:
            dt = datetime(year, month, day)
            day_name = dt.strftime("%A")
        except Exception:
            day_name = ""
        
        return date_str, time_str, year, month, day, hour, day_name
    
    # Format: "2025-12-31"
    match = re.match(r"(\d{4})-(\d{2})-(\d{2})", date_string)
    
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))
        
        date_str = f"{year:04d}-{month:02d}-{day:02d}"
        
        try:
            dt = datetime(year, month, day)
            day_name = dt.strftime("%A")
        except Exception:
            day_name = ""
        
        return date_str, "", year, month, day, None, day_name
    
    return None, None, None, None, None, None, None


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("STEP 1: Convert JSON → CSV (Date & Time)")
    print("=" * 60)

    # Check input file
    if not os.path.exists(INPUT_FILE):
        print(f"❌ ERROR: Input file not found: {INPUT_FILE}")
        print()
        print("Terminal එකේ මේක run කරන්න: dir ..\\data\\raw")
        return

    # Load JSON
    print(f"Loading: {INPUT_FILE}")

    with open(INPUT_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    print(f"✅ Loaded {len(data)} records.")

    # Create output folder
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Output columns
    fieldnames = [
        "id",
        "date",
        "time",
        "year",
        "month",
        "day",
        "hour",
        "day_of_week",
        "title",
        "story",
    ]

    # Write CSV
    print(f"Writing: {OUTPUT_FILE}")

    written = 0
    no_date = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8-sig", newline="") as file:

        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for i, item in enumerate(data, 1):

            if not isinstance(item, dict):
                continue

            date_value = item.get("sinhala_added_date", "")

            date_str, time_str, year, month, day, hour, day_name = \
                extract_date_time(date_value)

            if date_str is None:
                no_date += 1
                continue

            row = {
                "id": item.get("sinhala_art_id", ""),
                "date": date_str,
                "time": time_str or "",
                "year": year or "",
                "month": month or "",
                "day": day or "",
                "hour": hour if hour is not None else "",
                "day_of_week": day_name or "",
                "title": item.get("sinhala_title", ""),
                "story": item.get("sinhala_story", ""),
            }

            writer.writerow(row)
            written += 1

            if i % 5000 == 0:
                print(f"   Processed {i}/{len(data)}")

    # Summary
    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Records written : {written}")
    print(f"No date found   : {no_date}")
    print(f"Output file     : {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
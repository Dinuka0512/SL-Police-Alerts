import json
import csv
import os


# ============================================================
# CONFIGURATION
# ============================================================

# JSON file එකේ path එක
INPUT_FILE = "../data/raw/hirunews_road_accidents_1998_2026.json"

# CSV file එක save වෙන තැන
OUTPUT_FILE = "../data/raw/hirunews_road_accidents.csv"


# ============================================================
# JSON → CSV CONVERTER
# ============================================================

def json_to_csv():

    print()
    print("=" * 50)
    print("JSON → CSV CONVERTER")
    print("=" * 50)
    print(f"Input  : {INPUT_FILE}")
    print(f"Output : {OUTPUT_FILE}")
    print("=" * 50)

    # Check if input file exists
    if not os.path.exists(INPUT_FILE):
        print()
        print(f"❌ ERROR: File not found: {INPUT_FILE}")
        print()
        print("File එකේ නම හරිද කියලා බලන්න.")
        return

    # Load JSON
    print()
    print("⏳ Loading JSON file...")

    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        print(f"❌ ERROR: Invalid JSON: {error}")
        return

    if not isinstance(data, list):
        print("❌ ERROR: JSON is not a list.")
        return

    total = len(data)
    print(f"✅ Loaded {total} records.")

    if total == 0:
        print("⚠️ No records to convert.")
        return

    # Get all field names
    print()
    print("⏳ Collecting field names...")

    all_keys = set()

    for item in data:
        if isinstance(item, dict):
            all_keys.update(item.keys())

    priority_keys = [
        "sinhala_art_id",
        "sinhala_title",
        "sinhala_story",
        "sinhala_added_date",
        "seourltitle",
        "sin_image",
        "art_image",
        "view",
    ]

    other_keys = sorted(all_keys - set(priority_keys))
    fieldnames = [k for k in priority_keys if k in all_keys] + other_keys

    print(f"✅ Found {len(fieldnames)} fields:")
    for key in fieldnames:
        print(f"   - {key}")

    # Write CSV
    print()
    print("⏳ Writing CSV file...")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    written = 0

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8-sig", newline="") as file:

            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames,
                extrasaction="ignore",
                quoting=csv.QUOTE_ALL
            )

            writer.writeheader()

            for i, item in enumerate(data, 1):

                if not isinstance(item, dict):
                    continue

                row = {}
                for key in fieldnames:
                    value = item.get(key, "")
                    if value is None:
                        value = ""
                    row[key] = value

                writer.writerow(row)
                written += 1

                if i % 5000 == 0:
                    print(f"   Written {i}/{total} rows...")

    except Exception as error:
        print(f"❌ ERROR while writing CSV: {error}")
        return

    # Summary
    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)

    print()
    print("=" * 50)
    print("✅ DONE!")
    print("=" * 50)
    print(f"Total rows written : {written}")
    print(f"Output file        : {OUTPUT_FILE}")
    print(f"File size          : {file_size_mb:.2f} MB")
    print("=" * 50)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    json_to_csv()
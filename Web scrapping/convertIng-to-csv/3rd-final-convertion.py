import csv
import os

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_CSV = "../data/raw/extracted/2nd-converted.csv"
OUTPUT_CSV = "../data/raw/extracted/3rd-final.csv"

# ML model එකට ඕන columns
FINAL_COLUMNS = [
    'id',
    'date',
    'time',
    'year',
    'month',
    'day',
    'hour',
    'day_of_week',
    'district',
    'city',
    'latitude',
    'longitude',
]


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("STEP 3: Remove 'title' and 'story' columns")
    print("=" * 60)

    # Input file එක තියෙනවද බලන්න
    if not os.path.exists(INPUT_CSV):
        print(f"❌ ERROR: Input file not found: {INPUT_CSV}")
        return

    # CSV කියවන්න
    print(f"Loading: {INPUT_CSV}")

    rows = []
    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        input_columns = list(reader.fieldnames)
        for row in reader:
            # අලුත් columns විතරක් ගන්න
            new_row = {col: row.get(col, '') for col in FINAL_COLUMNS}
            rows.append(new_row)

    print(f"✅ Loaded {len(rows)} records.")
    print(f"Input columns  : {input_columns}")
    print(f"Output columns : {FINAL_COLUMNS}")

    # Output folder එක හදන්න
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

    # අලුත් CSV එක ලියන්න
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FINAL_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Records written : {len(rows)}")
    print(f"Output file     : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    main()
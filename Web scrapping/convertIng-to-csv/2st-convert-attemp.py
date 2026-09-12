import csv
import os
import re
from collections import Counter

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_CSV = "../data/raw/extracted/2nd-converted.csv"
OUTPUT_CSV = "../data/raw/extracted/3rd-converted.csv"

FINAL_COLUMNS = [
    'id', 'date', 'time', 'year', 'month', 'day', 'hour', 'day_of_week',
    'district', 'city', 'latitude', 'longitude', 'deaths_count',
]

# ============================================================
# සිංහල සංඛ්‍යා වචන → අගය
# ============================================================

SINHALA_NUMBERS = {
    'එකක්': 1, 'එක්': 1, 'එකයි': 1, 'එක් අයෙක්': 1, 'එක් අයකු': 1,
    'දෙකක්': 2, 'දෙදෙනෙකු': 2, 'දෙදෙනා': 2, 'දෙදෙනෙක්': 2, 'දෙදෙනෙකුට': 2, 'දෙදෙනාට': 2,
    'තුනක්': 3, 'තිදෙනෙකු': 3, 'තිදෙනා': 3, 'තිදෙනෙක්': 3, 'තිදෙනෙකුට': 3, 'තිදෙනාට': 3,
    'හතරක්': 4, 'සිව්දෙනෙකු': 4, 'සිව්දෙනා': 4, 'සිව්දෙනෙක්': 4, 'සිව්දෙනෙකුට': 4,
    'පහක්': 5, 'පස්දෙනෙකු': 5, 'පස්දෙනා': 5, 'පස්දෙනෙක්': 5, 'පස්දෙනෙකුට': 5,
    'හයක්': 6, 'හයදෙනෙකු': 6, 'හයදෙනා': 6, 'හයදෙනෙක්': 6, 'හයදෙනෙකුට': 6,
    'හතක්': 7, 'හත්දෙනෙකු': 7, 'හත්දෙනා': 7, 'හත්දෙනෙක්': 7, 'හත්දෙනෙකුට': 7,
    'අටක්': 8, 'අටදෙනෙකු': 8, 'අටදෙනා': 8, 'අටදෙනෙක්': 8, 'අටදෙනෙකුට': 8,
    'නවයක්': 9, 'නවදෙනෙකු': 9, 'නවදෙනා': 9, 'නවදෙනෙක්': 9, 'නවදෙනෙකුට': 9,
    'දහයක්': 10, 'දසදෙනෙකු': 10, 'දසදෙනා': 10, 'දසදෙනෙක්': 10, 'දසදෙනෙකුට': 10,
    'එකොළහක්': 11, 'එකොළොස්දෙනෙකු': 11,
    'දොළහක්': 12, 'දොළොස්දෙනෙකු': 12,
    'දහතුනක්': 13, 'දහතුන්දෙනෙකු': 13, 'දහතුන්දෙනා': 13, 'දහතුන්දෙනෙක්': 13,
    'දහහතරක්': 14, 'දහහතරදෙනෙකු': 14,
    'පහළොවක්': 15, 'පහළොස්දෙනෙකු': 15, 'පහළොස්දෙනා': 15, 'පහළොස්දෙනෙක්': 15,
    'දහසයක්': 16, 'දහසයදෙනෙකු': 16,
    'දහහතක්': 17, 'දහහත්දෙනෙකු': 17,
    'දහඅටක්': 18, 'දහඅටදෙනෙකු': 18,
    'දහනවයක්': 19, 'දහනවදෙනෙකු': 19,
    'විස්සක්': 20, 'විසිදෙනෙකු': 20, 'විසිදෙනෙක්': 20, 'විසිදෙනා': 20,
    'විසිපහක්': 25, 'විසිපස්දෙනෙකු': 25,
    'තිහක්': 30, 'තිස්දෙනෙකු': 30,
    'හතළිහක්': 40, 'හතළිස්දෙනෙකු': 40,
    'පනහක්': 50, 'පනස්දෙනෙකු': 50,
}

DEATH_WORDS = [
    'මියගොස්', 'මියගිය', 'මිය ගිය', 'මියයයි', 'මියයි',
    'මරුට', 'මරු', 'මරණයට පත්', 'මරණය',
    'ජීවිතක්ෂයට පත්', 'ජීවිතක්ෂය',
    'දිවි අහිමි', 'දිවිපිදූ', 'දිවි පිදූ',
    'මළගිය', 'මළ සිරුරු', 'මරණයට',
]

# ============================================================
# ඉවත් කිරීමේ patterns
# ============================================================

AGE_PATTERNS = [
    r'අවුරුදු\s*\d+\s*ක්?',
    r'වයස\s*අවුරුදු\s*\d+\s*ක්?',
    r'වයස\s*\d+\s*ක්?',
    r'අවුරුදු\s*\d+\s*යි',
    r'\d+\s*හැවිරිදි',
    r'හැවිරිදි',
    r'වයසැති',
    r'වයස\s*ඇති',
    r'වයස',
    r'වියේ\s*පසුව',
    r'වියේ\s*පසු',
    r'වියේ',
    r'වයස්වල',
    r'වයසේ',
    r'වයසින්',
    r'අවුරුදු\s*[එදෙතහපස]\S*',
    r'වයස\s*[එදෙතහපස]\S*',
    r'දින\s*[එදෙතහපස]\S*\s*වයස',
    r'දවස්\s*[එදෙතහපස]\S*\s*වයස',
    r'මාස\s*[එදෙතහපස]\S*\s*වයස',
]

MONTH_PATTERNS = [
    r'මාස\s*\d+\s*ක්?',
    r'මාස\s*[එදෙතහපස]\S*',
    r'මාසයක්',
    r'මාසෙක',
    r'මාසයේ',
    r'මාසෙ',
    r'මාස',
]

DAY_PATTERNS = [
    r'දින\s*\d+\s*ක්?',
    r'දවස්\s*\d+\s*ක්?',
    r'දින\s*[එදෙතහපස]\S*',
    r'දවස්\s*[එදෙතහපස]\S*',
    r'දිනක්',
    r'දවසක්',
    r'දිනයේ',
    r'දවසේ',
    r'දිනය',
    r'දවස',
    r'දින',
]

YEAR_PATTERNS = [
    r'අවුරුද්දේ',
    r'අවුරුද්ද',
    r'අවුරුදු',
]

# 🆕 තුවාල/රෝහල් වචන ඉවත් කරන්න (injury counting avoid)
INJURY_PATTERNS = [
    r'තුවාල\s*ලබා',
    r'තුවාල\s*ලැබූ',
    r'තුවාලකරු',
    r'තුවාල',
    r'රෝහල්\s*ගත',
    r'රෝහලට\s*ඇතුළත්',
    r'රෝහලේ',
    r'බරපතල',
    r'සුළු',
    r'ප්‍රතිකාර',
]

# ============================================================
# Helper functions
# ============================================================

def remove_patterns(text, patterns):
    """ලබා දී ඇති patterns text එකෙන් ඉවත් කරන්න"""
    result = text
    for pattern in patterns:
        result = re.sub(pattern, ' ', result, flags=re.IGNORECASE)
    return result


def extract_deaths_count(story):
    """
    Story එකෙන් මරණ ගාන ගන්න - DOUBLE COUNTING නැතුව.
    
    Strategy:
      1. හැම death-related අංකයක්ම හොයන්න (digit + සිංහල වචන)
      2. HIGHEST (max) එක ගන්න - එකම සිද්ධියේ එකම ගාන 
         කිහිප වරක් කියන නිසා sum නොකර max ගන්නවා
      3. 40ට වැඩි නම් → 1 (extraction error fix)
    """
    if not story:
        return 0
    
    # ============================================================
    # පියවර 1: වයස, මාස, දින, අවුරුදු, තුවාල ඉවත් කරන්න
    # ============================================================
    cleaned = story
    cleaned = remove_patterns(cleaned, AGE_PATTERNS)
    cleaned = remove_patterns(cleaned, MONTH_PATTERNS)
    cleaned = remove_patterns(cleaned, DAY_PATTERNS)
    cleaned = remove_patterns(cleaned, YEAR_PATTERNS)
    cleaned = remove_patterns(cleaned, INJURY_PATTERNS)
    
    # ============================================================
    # පියවර 2: Death word තියෙනවද?
    # ============================================================
    has_death = any(w in cleaned for w in DEATH_WORDS)
    if not has_death:
        return 0
    
    # ============================================================
    # පියවර 3: හැම death-related අංකයක්ම candidates list එකට දාන්න
    # ============================================================
    candidates = []
    
    death_pattern = '|'.join(re.escape(w) for w in DEATH_WORDS)
    
    # --- Pattern A: digit + (optional දෙනෙකු etc) + මරණ වචන ---
    # "20 දෙනෙකු මියගොස්", "3ක් මරුට"
    pattern_a = (
        r'(\d+)\s*'
        r'(?:ක්|දෙනෙකු|දෙනෙක්|දෙනා|අයෙක්|අයකු|පුද්ගලයින්|දෙනෙකුට|දෙනාට)?\s*'
        r'(?:' + death_pattern + r')'
    )
    
    for m in re.finditer(pattern_a, cleaned):
        try:
            n = int(m.group(1))
            if 0 < n < 1000:
                candidates.append(n)
        except ValueError:
            pass
    
    # --- Pattern B: මරණ වචන + (optional text) + digit ---
    # "මියගොස් ඇති පුද්ගලයින් 3"
    pattern_b = (
        r'(?:' + death_pattern + r')[\s,]*?'
        r'(?:පුද්ගලයින්|දෙනෙකු|දෙනෙක්|දෙනා|අයෙක්|අයකු)?\s*'
        r'(\d+)'
    )
    
    for m in re.finditer(pattern_b, cleaned):
        try:
            n = int(m.group(1))
            if 0 < n < 1000:
                candidates.append(n)
        except ValueError:
            pass
    
    # --- Pattern C: සිංහල වචන + මරණ වචන ---
    # "දෙදෙනෙකු මියගොස්", "තිදෙනෙකු මරුට"
    sorted_words = sorted(SINHALA_NUMBERS.keys(), key=len, reverse=True)
    
    for word in sorted_words:
        value = SINHALA_NUMBERS[word]
        pattern = re.escape(word) + r'[\s,]*?(?:' + death_pattern + r')'
        
        for m in re.finditer(pattern, cleaned):
            pos = m.start()
            # ඉදිරියෙන් digit එකක් තියෙනවද? (duplicate avoid)
            before_text = cleaned[max(0, pos-10):pos]
            if re.search(r'\d+\s*$', before_text):
                continue
            candidates.append(value)
    
    # ============================================================
    # පියවර 4: හම්බුනේ නැත්නම් → 1
    # ============================================================
    if not candidates:
        return 1
    
    # ============================================================
    # පියවර 5: MAX ගන්න (double counting avoid)
    # ============================================================
    result = max(candidates)
    
    # ============================================================
    # පියවර 6: 🆕 Sanity check - 40ට වැඩි නම් → 1
    # ============================================================
    if result > 40:
        return 1
    
    return result


# ============================================================
# TEST
# ============================================================

def test():
    """Test cases"""
    test_cases = [
        ("බිළිදෙකු ඇතුළු තුන්දෙනෙකු ජීවිතක්ෂයට පත්ව තිබෙනවා. පොලිසිය සඳහන් කළේ, සිද්ධියෙන් එකම පවුලේ මිත්තණිය, ඇයගේ දියණිය සහ ඇගේ දින දහයක් වයසැති බිළිඳා ජීවිතක්ෂයට පත් වී ඇති බවයි.", 3),
        ("අවුරුදු 25ක් වූ පුද්ගලයෙක් මියගොස්", 1),
        ("පුද්ගලයින් 20 දෙනෙකු මියගොස්", 20),
        ("දෙදෙනෙකු මියගොස්", 2),
        ("තිදෙනෙකු මරුට", 3),
        ("මියගොස් ඇත", 1),
        ("මාස 06ක් වූ බිළිඳෙක් මියගොස්", 1),
        ("දින 10ක් රෝහලේ සිට මියගොස්", 1),
        ("එකම පවුලේ මව, දියණිය සහ බිළිඳා මියගොස්", 3),
        ("මියගොස් ඇති පුද්ගලයින් 3", 3),
        ("රිය අනතුරු හතරකින් පොලිස් සැරයන්වරයෙක් ඇතුළු සිව්දෙනෙක් ජීවිතක්ෂයට පත්ව ඇතැයි පොලිසිය පවසනවා. පොලිස් සැරයන්වරයකු මරණයට පත්ව තිබෙනවා.", 4),
        ("මියගිය සංඛ්‍යාව 15 දක්වා ඉහළ ගොස් තිබෙනවා", 15),
        ("පුද්ගලයන් තිදෙනෙක් මියගොස් ඇත", 3),
        ("තුන්දෙනෙකුට මරු කැඳවමින්", 3),
        ("දෙදෙනෙකු මියගොස් අයෙක් මියගිය", 2),
        ("එක් අයෙකු මියගොස්", 1),
        ("දෙදෙනෙකු මිය ගිය බව", 2),
        ("5 දෙනෙකු තුවාල ලබා එක් අයෙකු මියගොස්", 1),
        ("පුද්ගලයින් 500 දෙනෙකු මියගොස්", 1),   # > 40 → 1
        ("50 දෙනෙකු මියගොස්", 1),                  # > 40 → 1
        ("40 දෙනෙකු මියගොස්", 40),                 # = 40 → 40
        ("35 දෙනෙකු මියගොස්", 35),                 # < 40 → 35
    ]
    
    print("=" * 70)
    print("TEST RESULTS")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for story, expected in test_cases:
        result = extract_deaths_count(story)
        status = "✅" if result == expected else "❌"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status} Expected: {expected:>3} | Got: {result:>3}")
        print(f"   Story: {story[:80]}...")
        print()
    
    print("=" * 70)
    print(f"PASSED: {passed} | FAILED: {failed}")
    print("=" * 70)


# ============================================================
# MAIN
# ============================================================

def main():
    print()
    print("=" * 60)
    print("STEP 3: Remove title/story + add deaths_count")
    print("        (Rule: > 40 → 1)")
    print("=" * 60)

    if not os.path.exists(INPUT_CSV):
        print(f"❌ ERROR: Input file not found: {INPUT_CSV}")
        return

    print(f"Loading: {INPUT_CSV}")

    rows = []
    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        input_columns = list(reader.fieldnames)
        for row in reader:
            rows.append(row)

    print(f"✅ Loaded {len(rows)} records.")

    # Deaths count ගණනය කරන්න
    new_rows = []
    for row in rows:
        story = str(row.get('story', ''))
        deaths = extract_deaths_count(story)

        new_row = {col: row.get(col, '') for col in FINAL_COLUMNS if col != 'deaths_count'}
        new_row['deaths_count'] = deaths
        new_rows.append(new_row)

    # Summary statistics
    deaths_counter = Counter(r['deaths_count'] for r in new_rows)
    total_deaths = sum(r['deaths_count'] for r in new_rows)

    print()
    print("=" * 60)
    print("📊 DEATHS DISTRIBUTION")
    print("=" * 60)
    print(f"{'Deaths':<10} {'Accidents':>10}")
    print("-" * 60)
    for deaths, count in sorted(deaths_counter.items()):
        print(f"{deaths:<10} {count:>10}")
    print("-" * 60)
    print(f"{'TOTAL deaths':<10} {total_deaths:>10}")
    print("=" * 60)

    # 🆕 High-death stories print කරන්න (manual check)
    print()
    print("🚨 Stories with > 10 deaths (manual check):")
    print("-" * 60)
    high_count = 0
    for r in new_rows:
        if r['deaths_count'] > 10:
            print(f"  id={r.get('id')}: {r['deaths_count']} deaths")
            high_count += 1
    if high_count == 0:
        print("  ✅ None (all reasonable)")
    print(f"  Total high-death stories: {high_count}")
    print()

    print(f"Input columns  : {input_columns}")
    print(f"Output columns : {FINAL_COLUMNS}")

    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FINAL_COLUMNS)
        writer.writeheader()
        writer.writerows(new_rows)

    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    print(f"Records written : {len(new_rows)}")
    print(f"Total deaths    : {total_deaths}")
    print(f"Output file     : {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == "__main__":
    # test() කරන්න ඕන නම් uncomment කරන්න
    # test()
    main()
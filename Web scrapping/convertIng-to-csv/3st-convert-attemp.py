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
    'පහළොවක්': 15, 'පහළොස්දෙනෙකු': 15,
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

# වයස ඉවත් කිරීමේ patterns
AGE_PATTERNS = [
    r'අවුරුදු\s*\d+\s*ක්?',           # අවුරුදු 25ක්
    r'වයස\s*අවුරුදු\s*\d+\s*ක්?',      # වයස අවුරුදු 17ක
    r'වයස\s*\d+\s*ක්?',                # වයස 30ක්
    r'අවුරුදු\s*\d+\s*යි',             # අවුරුදු 25යි
    r'\d+\s*හැවිරිදි',                  # 43 හැවිරිදි
    r'හැවිරිදි',                       # හැවිරිදි
    r'වයසැති',                         # වයසැති
    r'වයස\s*ඇති',                     # වයස ඇති
    r'වයස',                            # වයස
    r'වියේ\s*පසුව',                    # වියේ පසුව
    r'වියේ\s*පසු',                     # වියේ පසු
    r'වියේ',                           # වියේ
    r'වයස්වල',                        # වයස්වල
    r'වයසේ',                           # වයසේ
    r'වයසින්',                         # වයසින්
    # වචනයෙන් තියෙන වයස
    r'අවුරුදු\s*[එදෙතහපස]\S*',        # අවුරුදු දහයක්
    r'වයස\s*[එදෙතහපස]\S*',            # වයස දහයක්
    # දින/මාස + වයස
    r'දින\s*[එදෙතහපස]\S*\s*වයස',       # දින දහයක් වයස
    r'දවස්\s*[එදෙතහපස]\S*\s*වයස',      # දවස් දහයක් වයස
    r'මාස\s*[එදෙතහපස]\S*\s*වයස',       # මාස දෙකක් වයස
]

# මාස ඉවත් කිරීමේ patterns
MONTH_PATTERNS = [
    r'මාස\s*\d+\s*ක්?',               # මාස 06ක්
    r'මාස\s*[එදෙතහපස]\S*',            # මාස දෙකක්
    r'මාසයක්',                          # මාසයක්
    r'මාසෙක',                           # මාසෙක
    r'මාසයේ',                           # මාසයේ
    r'මාසෙ',                            # මාසෙ
    r'මාස',                             # මාස
]

# දින ඉවත් කිරීමේ patterns
DAY_PATTERNS = [
    r'දින\s*\d+\s*ක්?',                # දින 10ක්
    r'දවස්\s*\d+\s*ක්?',               # දවස් 3ක්
    r'දින\s*[එදෙතහපස]\S*',             # දින දහයක්
    r'දවස්\s*[එදෙතහපස]\S*',            # දවස් දහයක්
    r'දිනක්',                           # දිනක්
    r'දවසක්',                           # දවසක්
    r'දිනයේ',                           # දිනයේ
    r'දවසේ',                           # දවසේ
    r'දිනය',                            # දිනය
    r'දවස',                            # දවස
    r'දින',                             # දින
]

# අවුරුදු ඉවත් කිරීමේ patterns
YEAR_PATTERNS = [
    r'අවුරුද්දේ',                      # අවුරුද්දේ
    r'අවුරුද්ද',                       # අවුරුද්ද
    r'අවුරුදු',                        # අවුරුදු
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
    Story එකෙන් මරණ ගාන ගන්න
    """
    if not story:
        return 0
    
    # ============================================================
    # පියවර 1: වයස, මාස, දින, අවුරුදු ඉවත් කරන්න
    # ============================================================
    cleaned = story
    
    # වයස ඉවත් කරන්න (මේක මුලින්ම කරන්න)
    cleaned = remove_patterns(cleaned, AGE_PATTERNS)
    
    # මාස ඉවත් කරන්න
    cleaned = remove_patterns(cleaned, MONTH_PATTERNS)
    
    # දින ඉවත් කරන්න
    cleaned = remove_patterns(cleaned, DAY_PATTERNS)
    
    # අවුරුදු ඉවත් කරන්න
    cleaned = remove_patterns(cleaned, YEAR_PATTERNS)
    
    # ============================================================
    # පියවර 2: මරණයක් ඇත්තටම සිදුවෙලාද බලන්න
    # ============================================================
    has_death = False
    for word in DEATH_WORDS:
        if word in cleaned:
            has_death = True
            break
    
    if not has_death:
        return 0
    
    # ============================================================
    # පියවර 3: Death වචන වලට ආසන්න අංක හොයන්න
    # ============================================================
    total = 0
    found_number = False
    matched_positions = set()
    
    # Death words escaped
    death_pattern = '|'.join(re.escape(w) for w in DEATH_WORDS)
    
    # ============================================================
    # Pattern A: digit + (optional දෙනෙකු/දෙනා etc) + මරණ වචන
    # "පුද්ගලයින් 20 දෙනෙකු මියගොස්", "3 දෙනෙකු මිය"
    # ============================================================
    pattern_a = r'(\d+)\s*(?:ක්|දෙනෙකු|දෙනෙක්|දෙනා|අයෙක්|අයකු|පුද්ගලයින්|දෙනෙකුට|දෙනාට)?\s*(?:' + death_pattern + r')'
    
    for m in re.finditer(pattern_a, cleaned):
        num_str = m.group(1)
        try:
            n = int(num_str)
            if 0 < n < 1000:
                pos = m.start()
                if pos not in matched_positions:
                    total += n
                    found_number = True
                    matched_positions.add(pos)
        except ValueError:
            pass
    
    # ============================================================
    # Pattern B: මරණ වචන + (optional text) + digit
    # "මියගොස් ඇති පුද්ගලයින් 3", "මියගිය සංඛ්‍යාව 5"
    # ============================================================
    pattern_b = r'(?:' + death_pattern + r')[\s,]*?(?:පුද්ගලයින්|දෙනෙකු|දෙනෙක්|දෙනා|අයෙක්|අයකු)?\s*(\d+)'
    
    for m in re.finditer(pattern_b, cleaned):
        num_str = m.group(1)
        try:
            n = int(num_str)
            if 0 < n < 1000:
                pos = m.start()
                if pos not in matched_positions:
                    total += n
                    found_number = True
                    matched_positions.add(pos)
        except ValueError:
            pass
    
    # ============================================================
    # Pattern C: සිංහල වචන + මරණ වචන
    # "දෙදෙනෙකු මියගොස්", "තිදෙනෙකු මරුට"
    # ============================================================
    # දිගම වචන මුලින්ම check කරන්න
    sorted_words = sorted(SINHALA_NUMBERS.keys(), key=len, reverse=True)
    
    for word in sorted_words:
        value = SINHALA_NUMBERS[word]
        # word + (optional text) + death word
        pattern = re.escape(word) + r'[\s,]*?(?:' + death_pattern + r')'
        
        for m in re.finditer(pattern, cleaned):
            pos = m.start()
            if pos not in matched_positions:
                # මේ word එකට ඉදිරියෙන් digit එකක් තියෙනවද?
                before_text = cleaned[max(0, pos-10):pos]
                if re.search(r'\d+\s*$', before_text):
                    continue
                
                total += value
                found_number = True
                matched_positions.add(pos)
    
    # ============================================================
    # පියවර 4: ගානක් හම්බුනේ නැත්නම් → 1
    # ============================================================
    if not found_number and has_death:
        return 1
    
    return max(0, total)


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
        ("රිය අනතුරු හතරකින් පොලිස් සැරයන්වරයෙක් ඇතුළු සිව්දෙනෙක් ජීවිතක්ෂයට පත්ව ඇතැයි පොලිසිය පවසනවා.", 4),
        ("මියගිය සංඛ්‍යාව 15 දක්වා ඉහළ ගොස් තිබෙනවා", 15),
        ("පුද්ගලයන් තිදෙනෙක් මියගොස් ඇත", 3),
        ("තුන්දෙනෙකුට මරු කැඳවමින්", 3),
        ("මරණයට පත්ව ඇති බව", 1),
        ("එක් අයෙකු මියගොස්", 1),
        ("දෙදෙනෙකු මිය ගිය බව", 2),
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
    # Test කරන්න ඕන නම් මේක uncomment කරන්න
    test()
    # main()
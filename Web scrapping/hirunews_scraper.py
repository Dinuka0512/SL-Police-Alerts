import requests
import json
import time
import os
import re
from datetime import datetime
from collections import Counter


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "https://hirunews.lk/api/fetch_news.php"

START_YEAR = 1998
END_YEAR = 2026

CATEGORY = "General"

OUTPUT_DIR = "data/raw"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "hirunews_road_accidents_1998_2026.json"
)

PROGRESS_FILE = os.path.join(
    OUTPUT_DIR,
    "scraper_progress.json"
)

# Start page — 0 = page 1 ඉඳන්
START_PAGE = 0

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

REQUEST_DELAY = 0.1

MAX_RETRIES = 5


# ============================================================
# ROAD ACCIDENT KEYWORDS (SINHALA)
# ============================================================

ACCIDENT_KEYWORDS = [
    "රිය අනතුර",
    "මාර්ග අනතුර",
    
    "අනතුරක්",
    "අනතුරකින්",
    "අනතුරින්"
]


# ============================================================
# CREATE DIRECTORIES AND FILES
# ============================================================

def setup_directories_and_files():

    if not os.path.exists(OUTPUT_DIR):

        try:
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            print(f"[SETUP] Created directory: {OUTPUT_DIR}")
        except Exception as error:
            print(f"[SETUP] ERROR creating directory: {error}")
            return False
    else:
        print(f"[SETUP] Directory already exists: {OUTPUT_DIR}")

    if not os.path.exists(OUTPUT_FILE):

        try:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
                json.dump([], file, ensure_ascii=False, indent=2)
            print(f"[SETUP] Created empty file: {OUTPUT_FILE}")
        except Exception as error:
            print(f"[SETUP] ERROR creating file: {error}")
            return False
    else:
        print(f"[SETUP] File already exists: {OUTPUT_FILE}")

    return True


# ============================================================
# SAVE PROGRESS
# ============================================================

def save_progress(page):
    try:
        with open(PROGRESS_FILE, "w", encoding="utf-8") as file:
            json.dump({"last_page": page}, file)
    except Exception:
        pass


# ============================================================
# LOAD PROGRESS
# ============================================================

def load_progress():
    if not os.path.exists(PROGRESS_FILE):
        return None

    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data.get("last_page")
    except Exception:
        return None


# ============================================================
# CLEAR PROGRESS
# ============================================================

def clear_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            os.remove(PROGRESS_FILE)
        except Exception:
            pass


# ============================================================
# FETCH API PAGE
# ============================================================

def fetch_page(page):

    params = {
        "page": page,
        "category": CATEGORY
    }

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            print()
            print(f"Fetching page {page} (attempt {attempt}/{MAX_RETRIES})...")

            response = requests.get(
                BASE_URL,
                params=params,
                headers=HEADERS,
                timeout=60
            )

            response.raise_for_status()

            try:
                data = response.json()
            except ValueError:
                print("API did not return valid JSON.")
                print("Response preview:")
                print(response.text[:500])
                return None

            return data

        except requests.RequestException as error:

            print(f"Request error: {error}")

            if attempt < MAX_RETRIES:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print("Maximum retries reached.")
                return None

        except KeyboardInterrupt:
            print()
            print("User interrupted. Stopping safely.")
            return None

        except Exception as error:

            print(f"Unexpected error: {error}")
            return None

    return None


# ============================================================
# EXTRACT NEWS LIST
# ============================================================

def extract_news(data):

    if isinstance(data, list):
        return data

    if isinstance(data, dict):

        possible_keys = ["data", "news", "results", "articles", "items"]

        for key in possible_keys:
            value = data.get(key)
            if isinstance(value, list):
                return value

        for value in data.values():
            if isinstance(value, list):
                return value

    return []


# ============================================================
# CHECK IF NEWS IS ABOUT ROAD ACCIDENT
# ============================================================

def is_road_accident(item):

    text_parts = []

    possible_text_keys = [
        "sinhala_title",
        "sinhala_story",
        "title", "heading", "news_title", "name",
        "description", "summary", "content", "body",
        "details", "news", "text", "post_title",
        "post_content", "excerpt"
    ]

    for key in possible_text_keys:
        value = item.get(key)
        if value:
            text_parts.append(str(value))

    for value in item.values():
        if isinstance(value, str):
            text_parts.append(value)

    combined_text = " ".join(text_parts)

    for keyword in ACCIDENT_KEYWORDS:
        if keyword in combined_text:
            return True

    return False


# ============================================================
# GET DATE
# ============================================================

def get_date_value(item):

    possible_keys = [
        "sinhala_added_date",
        "date",
        "published_date",
        "publish_date",
        "created_at",
        "publishedAt",
        "published",
        "datetime",
        "created",
        "time",
        "news_date",
        "post_date"
    ]

    for key in possible_keys:

        value = item.get(key)

        if value is not None:

            value = str(value).strip()

            if value:
                return value

    return ""


# ============================================================
# GET YEAR
# ============================================================

def get_year(item):

    date_value = get_date_value(item)

    if not date_value:
        return None

    match = re.search(r"(19|20)\d{2}", date_value)

    if match:
        try:
            return int(match.group())
        except ValueError:
            return None

    return None


# ============================================================
# CHECK YEAR
# ============================================================

def is_valid_year(item):

    year = get_year(item)

    if year is not None:
        return (START_YEAR <= year <= END_YEAR)

    return True


# ============================================================
# GET NEWS ID
# ============================================================

def get_news_id(item):

    possible_keys = [
        "sinhala_art_id",
        "id",
        "news_id",
        "newsId",
        "article_id",
        "articleId",
        "url",
        "link",
        "slug"
    ]

    for key in possible_keys:

        value = item.get(key)

        if value is not None:

            value = str(value).strip()

            if value:
                return value

    return json.dumps(item, ensure_ascii=False, sort_keys=True)


# ============================================================
# LOAD EXISTING DATA
# ============================================================

def load_existing_data():

    if not os.path.exists(OUTPUT_FILE):
        print("No existing JSON file found.")
        print("Starting with an empty dataset.")
        return []

    if os.path.getsize(OUTPUT_FILE) == 0:
        print("Existing JSON file is empty.")
        print("Starting with an empty dataset.")
        return []

    try:

        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            print(f"Loaded {len(data)} existing records.")
            return data

        print("Existing JSON is not a list.")
        print("Starting with an empty dataset.")
        return []

    except json.JSONDecodeError as error:

        print()
        print("WARNING: Existing JSON file is corrupted.")
        print(f"JSON error: {error}")

        backup_file = (
            OUTPUT_FILE
            + ".backup_"
            + datetime.now().strftime("%Y%m%d_%H%M%S")
        )

        try:
            os.rename(OUTPUT_FILE, backup_file)
            print(f"Corrupted file backed up to:")
            print(backup_file)
        except Exception as backup_error:
            print(f"Could not create backup: {backup_error}")

        print("Starting with an empty dataset.")
        return []

    except Exception as error:
        print(f"Could not load existing data: {error}")
        return []


# ============================================================
# SAVE DATA
# ============================================================

def save_data(data):

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    temp_file = OUTPUT_FILE + ".tmp"

    try:

        with open(temp_file, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)

        os.replace(temp_file, OUTPUT_FILE)
        return True

    except Exception as error:

        print(f"ERROR while saving data: {error}")

        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass

        return False


# ============================================================
# PRINT YEAR COUNTER
# ============================================================

def print_year_counter(all_news):
    """Print how many accidents per year."""

    print()
    print("==============================================")
    print("ACCIDENTS PER YEAR")
    print("==============================================")

    year_counts = Counter()

    for item in all_news:

        if not isinstance(item, dict):
            continue

        year = get_year(item)

        if year is not None:
            year_counts[year] += 1

    # Show every year from START_YEAR to END_YEAR
    for year in range(START_YEAR, END_YEAR + 1):

        count = year_counts.get(year, 0)

        bar = "█" * min(count, 50)

        print(f"  {year} : {count:5d}  {bar}")

    print("==============================================")
    print(f"  TOTAL : {len(all_news)}")
    print("==============================================")


# ============================================================
# PRINT API STRUCTURE
# ============================================================

def print_api_info(data, news_list, page):

    if page != 1:
        return

    print()
    print("================================")
    print("API RESPONSE INFORMATION")
    print("================================")

    print(f"Response type: {type(data).__name__}")
    print(f"News records in page: {len(news_list)}")

    if news_list:

        first_item = news_list[0]

        if isinstance(first_item, dict):

            print("Available fields:")
            print(list(first_item.keys()))

            print()
            print("First record:")

            print(json.dumps(first_item, ensure_ascii=False, indent=2)[:2000])

    print("================================")


# ============================================================
# DEBUG: PRINT DATES OF ACCIDENT NEWS
# ============================================================

def debug_print_accident_dates(news_list, page):

    print()
    print(f"--- DEBUG: ACCIDENT NEWS DATES (page {page}) ---")

    count = 0

    for item in news_list:

        if not isinstance(item, dict):
            continue

        if is_road_accident(item):

            count += 1

            title = item.get("sinhala_title", "")[:60]
            date_value = get_date_value(item)
            year = get_year(item)

            print(f"  [{count}] Date: '{date_value}' | Year: {year}")
            print(f"       Title: {title}...")

    if count == 0:
        print("  (No accident news on this page)")

    print("--------------------------------------------------")


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("==============================================")
    print("HIRU NEWS - ROAD ACCIDENT SCRAPER (SINHALA)")
    print("==============================================")
    print(f"Target years : {START_YEAR} - {END_YEAR}")
    print(f"Category     : {CATEGORY}")
    print(f"Output       : {OUTPUT_FILE}")
    print(f"Filter       : Sinhala road accident keywords")
    print("==============================================")

    print()
    print("--- SETUP ---")

    setup_ok = setup_directories_and_files()

    if not setup_ok:
        print()
        print("Setup failed. Cannot continue.")
        return

    print()
    print("--- LOADING EXISTING DATA ---")

    all_news = load_existing_data()

    existing_ids = set()

    for item in all_news:
        if isinstance(item, dict):
            existing_ids.add(get_news_id(item))

    print()
    print(f"Existing records: {len(all_news)}")

    # Show existing counter
    if all_news:
        print_year_counter(all_news)

    # --------------------------------------------------------
    # Resume from last page
    # --------------------------------------------------------

    last_page = load_progress()

    if last_page is not None:
        print()
        print(f"Found progress file. Last page was: {last_page}")
        page = last_page + 1
        print(f"Resuming from page: {page}")
    else:
        page = START_PAGE + 1
        print()
        print(f"Starting from page: {page}")

    print()
    print("--- STARTING SCRAPER ---")

    total_added = 0
    total_accidents_found = 0
    consecutive_no_new = 0

    while True:

        data = fetch_page(page)

        if data is None:
            print()
            print("Could not fetch page.")
            print("Stopping scraper safely.")
            print(f"Progress saved at page: {page - 1}")
            break

        news_list = extract_news(data)

        print_api_info(data, news_list, page)

        # DEBUG: Show dates of accident news
        debug_print_accident_dates(news_list, page)

        # API returns empty → no more news
        if not news_list:
            print()
            print(f"No news found on page {page}.")
            print("API has no more news. Scraping completed.")
            clear_progress()
            break

        page_added = 0
        page_skipped = 0
        page_out_of_range = 0
        page_not_accident = 0

        for item in news_list:

            if not isinstance(item, dict):
                continue

            # ROAD ACCIDENT FILTER
            if not is_road_accident(item):
                page_not_accident += 1
                continue

            total_accidents_found += 1

            # YEAR FILTER
            if not is_valid_year(item):
                page_out_of_range += 1
                continue

            news_id = get_news_id(item)

            # DUPLICATE CHECK
            if news_id in existing_ids:
                page_skipped += 1
                continue

            # ADD RECORD
            all_news.append(item)
            existing_ids.add(news_id)
            page_added += 1
            total_added += 1

        saved = save_data(all_news)

        # Save progress
        save_progress(page)

        print()
        print("----------------------------------------------")
        print(f"Page               : {page}")
        print(f"Received           : {len(news_list)}")
        print(f"Not accident       : {page_not_accident}")
        print(f"Added              : {page_added}")
        print(f"Duplicates         : {page_skipped}")
        print(f"Outside year range : {page_out_of_range}")
        print(f"Total records      : {len(all_news)}")
        print(f"Saved              : {'YES' if saved else 'NO'}")
        print("----------------------------------------------")

        # Show counter every 10 pages
        if page % 10 == 0 and all_news:
            print_year_counter(all_news)

        if page_added == 0 and page_skipped == len(news_list):
            consecutive_no_new += 1
        else:
            consecutive_no_new = 0

        if consecutive_no_new >= 10:
            print()
            print("API is returning the same page repeatedly.")
            print("Stopping to avoid an infinite loop.")
            break

        page += 1
        time.sleep(REQUEST_DELAY)

    print()
    print()
    print("==============================================")
    print("SCRAPING COMPLETE")
    print("==============================================")
    print(f"Total accidents found : {total_accidents_found}")
    print(f"New records added     : {total_added}")
    print(f"Total records         : {len(all_news)}")
    print(f"Output file           : {OUTPUT_FILE}")
    print(f"Progress file         : {PROGRESS_FILE}")
    print("==============================================")

    # Final counter
    if all_news:
        print_year_counter(all_news)


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()
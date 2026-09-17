import requests
import json
import time
import os
import re
import hashlib
from datetime import datetime
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed


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

START_PAGE = 0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0 Safari/537.36"
}

# ---- SPEED SETTINGS ----
REQUEST_DELAY = 0.0
BATCH_SIZE = 20
MAX_WORKERS = 15
TIMEOUT = 10
MAX_RETRIES = 3


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

TEXT_KEYS = (
    "sinhala_title",
    "sinhala_story",
    "title", "heading", "news_title", "name",
    "description", "summary", "content", "body",
    "details", "news", "text", "post_title",
    "post_content", "excerpt"
)

DATE_KEYS = (
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
)

ID_KEYS = (
    "sinhala_art_id",
    "art_id",
    "article_id",
    "articleId",
    "news_id",
    "newsId",
    "url",
    "link",
    "slug"
)

YEAR_REGEX = re.compile(r"(19|20)\d{2}")


# ============================================================
# SESSION
# ============================================================

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ============================================================
# SETUP
# ============================================================

def setup_directories_and_files():

    if not os.path.exists(OUTPUT_DIR):
        try:
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            print(f"[SETUP] Created directory: {OUTPUT_DIR}")
        except Exception as error:
            print(f"[SETUP] ERROR: {error}")
            return False

    if not os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
                json.dump([], file, ensure_ascii=False, indent=2)
            print(f"[SETUP] Created empty file: {OUTPUT_FILE}")
        except Exception as error:
            print(f"[SETUP] ERROR: {error}")
            return False

    return True


# ============================================================
# PROGRESS
# ============================================================

def save_progress(page):
    try:
        with open(PROGRESS_FILE, "w", encoding="utf-8") as file:
            json.dump({"last_page": page}, file)
    except Exception:
        pass


def load_progress():
    if not os.path.exists(PROGRESS_FILE):
        return None
    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as file:
            return json.load(file).get("last_page")
    except Exception:
        return None


def clear_progress():
    if os.path.exists(PROGRESS_FILE):
        try:
            os.remove(PROGRESS_FILE)
        except Exception:
            pass


# ============================================================
# FETCH
# ============================================================

def fetch_page(page):

    params = {"page": page, "category": CATEGORY}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = SESSION.get(
                BASE_URL, params=params, timeout=TIMEOUT
            )
            response.raise_for_status()
            try:
                return response.json()
            except ValueError:
                return None
        except requests.RequestException:
            if attempt < MAX_RETRIES:
                time.sleep(min(2 ** (attempt - 1), 3))
            else:
                return None
        except Exception:
            return None

    return None


def fetch_batch(start_page, batch_size, max_workers):

    pages = list(range(start_page, start_page + batch_size))
    results = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_page = {
            executor.submit(fetch_page, p): p for p in pages
        }
        for future in as_completed(future_to_page):
            p = future_to_page[future]
            try:
                results[p] = future.result()
            except Exception:
                results[p] = None

    return {p: results[p] for p in sorted(results)}


# ============================================================
# EXTRACT NEWS
# ============================================================

def extract_news(data):

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in ("data", "news", "results", "articles", "items"):
            value = data.get(key)
            if isinstance(value, list):
                return value
        for value in data.values():
            if isinstance(value, list):
                return value

    return []


# ============================================================
# FILTERS
# ============================================================

def is_road_accident(item):

    parts = []
    for key in TEXT_KEYS:
        value = item.get(key)
        if value:
            parts.append(str(value))

    text = " ".join(parts)

    for keyword in ACCIDENT_KEYWORDS:
        if keyword in text:
            return True

    return False


def get_date_value(item):
    for key in DATE_KEYS:
        value = item.get(key)
        if value is not None:
            value = str(value).strip()
            if value:
                return value
    return ""


def get_year(item):
    date_value = get_date_value(item)
    if not date_value:
        return None
    match = YEAR_REGEX.search(date_value)
    if match:
        try:
            return int(match.group())
        except ValueError:
            return None
    return None


def is_valid_year(item):
    year = get_year(item)
    if year is None:
        return True
    return (START_YEAR <= year <= END_YEAR)


def get_news_id(item):

    for key in ID_KEYS:
        value = item.get(key)
        if value is not None:
            value = str(value).strip()
            if value:
                return f"{key}:{value}"

    title = str(item.get("sinhala_title", "")).strip()
    date = str(item.get("sinhala_added_date", "")).strip()
    story = str(item.get("sinhala_story", ""))[:200]

    combined = f"{title}|{date}|{story}"

    if combined.strip("|"):
        return "hash:" + hashlib.md5(
            combined.encode("utf-8")
        ).hexdigest()

    return "fullhash:" + hashlib.md5(
        json.dumps(item, ensure_ascii=False, sort_keys=True)
        .encode("utf-8")
    ).hexdigest()


# ============================================================
# LOAD EXISTING DATA
# ============================================================

def load_existing_data():

    if not os.path.exists(OUTPUT_FILE):
        print("No existing JSON file found.")
        return []

    if os.path.getsize(OUTPUT_FILE) == 0:
        print("Existing JSON file is empty.")
        return []

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            print(f"Loaded {len(data)} existing records.")
            return data

        print("Existing JSON is not a list.")
        return []

    except json.JSONDecodeError as error:
        print(f"WARNING: JSON corrupted: {error}")
        backup_file = (
            OUTPUT_FILE + ".backup_"
            + datetime.now().strftime("%Y%m%d_%H%M%S")
        )
        try:
            os.rename(OUTPUT_FILE, backup_file)
            print(f"Backed up to: {backup_file}")
        except Exception as e:
            print(f"Backup failed: {e}")
        return []

    except Exception as error:
        print(f"Load failed: {error}")
        return []


# ============================================================
# DIRECT SAVE — කෙලින්ම JSON file එකට
# ============================================================

def save_data(data):

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        return True
    except Exception as error:
        print(f"\n[SAVE ERROR] {error}")
        return False


# ============================================================
# YEAR COUNTER
# ============================================================

def print_year_counter(all_news):

    print()
    print("==============================================")
    print("ACCIDENTS PER YEAR")
    print("==============================================")

    year_counts = Counter()
    for item in all_news:
        if isinstance(item, dict):
            year = get_year(item)
            if year is not None:
                year_counts[year] += 1

    for year in range(START_YEAR, END_YEAR + 1):
        count = year_counts.get(year, 0)
        bar = "█" * min(count, 50)
        print(f"  {year} : {count:5d}  {bar}")

    print("==============================================")
    print(f"  TOTAL : {len(all_news)}")
    print("==============================================")


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("==============================================")
    print("HIRU NEWS - ROAD ACCIDENT SCRAPER")
    print("==============================================")
    print(f"Target years : {START_YEAR} - {END_YEAR}")
    print(f"Output       : {OUTPUT_FILE}")
    print(f"Batch size   : {BATCH_SIZE} pages")
    print(f"Workers      : {MAX_WORKERS} threads")
    print("==============================================")

    if not setup_directories_and_files():
        print("Setup failed. Exiting.")
        return

    all_news = load_existing_data()

    existing_ids = set()
    for item in all_news:
        if isinstance(item, dict):
            existing_ids.add(get_news_id(item))

    print(f"Existing records: {len(all_news)}")
    print(f"Existing unique IDs: {len(existing_ids)}")

    if all_news:
        print_year_counter(all_news)

    last_page = load_progress()

    if last_page is not None:
        page = last_page + 1
        print(f"Resuming from page: {page}")
    else:
        page = START_PAGE + 1
        print(f"Starting from page: {page}")

    print("--- STARTING SCRAPER ---")

    total_added = 0
    total_accidents_found = 0
    stop_reason = "completed"

    try:
        while True:

            batch_results = fetch_batch(page, BATCH_SIZE, MAX_WORKERS)

            if all(v is None for v in batch_results.values()):
                stop_reason = "all fetches failed"
                break

            empty_page_hit = False

            for p in sorted(batch_results.keys()):

                data = batch_results[p]

                if data is None:
                    save_progress(p)
                    continue

                news_list = extract_news(data)

                if not news_list:
                    stop_reason = f"empty page {p}"
                    empty_page_hit = True
                    save_data(all_news)
                    save_progress(p)
                    break

                page_added = 0
                page_skipped = 0
                page_out = 0
                page_not = 0

                for item in news_list:

                    if not isinstance(item, dict):
                        continue

                    if not is_road_accident(item):
                        page_not += 1
                        continue

                    total_accidents_found += 1

                    if not is_valid_year(item):
                        page_out += 1
                        continue

                    news_id = get_news_id(item)

                    if news_id in existing_ids:
                        page_skipped += 1
                        continue

                    all_news.append(item)
                    existing_ids.add(news_id)
                    page_added += 1
                    total_added += 1

                # Direct save every page
                save_data(all_news)
                save_progress(p)

                print(
                    f"\r→ Page {p:<6} | "
                    f"Total: {len(all_news):<7} | "
                    f"+Added: {page_added:<5} | "
                    f"Dup: {page_skipped:<5} | "
                    f"NotAcc: {page_not:<5} | "
                    f"OutYr: {page_out:<5}",
                    end="", flush=True
                )

            last_page_in_batch = max(batch_results.keys())
            save_data(all_news)
            save_progress(last_page_in_batch)

            if empty_page_hit:
                clear_progress()
                break

            page += BATCH_SIZE

            if REQUEST_DELAY > 0:
                time.sleep(REQUEST_DELAY)

    except KeyboardInterrupt:
        stop_reason = "user interrupted (Ctrl+C)"

    finally:
        print()
        print()
        print("Saving final dataset...")
        save_data(all_news)

        print()
        print("==============================================")
        print("SCRAPING COMPLETE")
        print("==============================================")
        print(f"Stop reason           : {stop_reason}")
        print(f"Total accidents found : {total_accidents_found}")
        print(f"New records added     : {total_added}")
        print(f"Total records         : {len(all_news)}")
        print(f"Output file           : {OUTPUT_FILE}")
        print("==============================================")

        if all_news:
            print_year_counter(all_news)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
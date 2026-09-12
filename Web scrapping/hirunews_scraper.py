import requests
import json
import time
import os
import re
import sys
import threading
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

# Start page — 0 = page 1 ඉඳන්
START_PAGE = 0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0 Safari/537.36"
}

# ---- SPEED SETTINGS ----
REQUEST_DELAY = 0.0        # batch අතර delay (seconds)
BATCH_SIZE = 15            # එකවර fetch කරන pages ගණන
MAX_WORKERS = 8            # concurrent threads
TIMEOUT = 15               # per-request timeout
MAX_RETRIES = 4

SAVE_EVERY_N_PAGES = 10    # disk write කරන frequency
COUNTER_EVERY_N_PAGES = 50 # year counter print කරන frequency

# ---- VERBOSE MODE ----
VERBOSE = False            # True කරොත් debug prints එනවා


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

# Pre-computed text keys (avoid rebuilding list each call)
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
    "id",
    "news_id",
    "newsId",
    "article_id",
    "articleId",
    "url",
    "link",
    "slug"
)

# Pre-compiled regex (huge speedup vs re.search each call)
YEAR_REGEX = re.compile(r"(19|20)\d{2}")


# ============================================================
# SESSION (connection reuse)
# ============================================================

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# Thread lock for shared counters / print
PRINT_LOCK = threading.Lock()


# ============================================================
# LOGGING HELPERS
# ============================================================

def log(message):
    """Only print when VERBOSE is on."""
    if VERBOSE:
        with PRINT_LOCK:
            sys.stdout.write("\n" + message + "\n")
            sys.stdout.flush()


def log_important(message):
    """Always print — for milestones."""
    with PRINT_LOCK:
        sys.stdout.write("\n" + message + "\n")
        sys.stdout.flush()


def update_progress(page, total, added, dup, not_acc):
    """Overwrite a single line — no scrollback spam."""
    if VERBOSE:
        return
    line = (
        f"\r→ Page {page:<6} | "
        f"Total: {total:<7} | "
        f"+Added: {added:<5} | "
        f"Dup: {dup:<5} | "
        f"NotAcc: {not_acc:<5}"
    )
    with PRINT_LOCK:
        sys.stdout.write(line)
        sys.stdout.flush()


# ============================================================
# SETUP
# ============================================================

def setup_directories_and_files():

    if not os.path.exists(OUTPUT_DIR):
        try:
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            log(f"[SETUP] Created directory: {OUTPUT_DIR}")
        except Exception as error:
            log(f"[SETUP] ERROR creating directory: {error}")
            return False
    else:
        log(f"[SETUP] Directory already exists: {OUTPUT_DIR}")

    if not os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
                json.dump([], file, ensure_ascii=False, indent=2)
            log(f"[SETUP] Created empty file: {OUTPUT_FILE}")
        except Exception as error:
            log(f"[SETUP] ERROR creating file: {error}")
            return False
    else:
        log(f"[SETUP] File already exists: {OUTPUT_FILE}")

    return True


# ============================================================
# PROGRESS (file)
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
# FETCH API PAGE (single)
# ============================================================

def fetch_page(page):

    params = {
        "page": page,
        "category": CATEGORY
    }

    for attempt in range(1, MAX_RETRIES + 1):

        try:
            response = SESSION.get(
                BASE_URL,
                params=params,
                timeout=TIMEOUT
            )
            response.raise_for_status()

            try:
                return response.json()
            except ValueError:
                log(f"Page {page}: invalid JSON")
                return None

        except requests.RequestException as error:
            log(f"Page {page} attempt {attempt}: {error}")
            if attempt < MAX_RETRIES:
                # exponential backoff: 1s, 2s, 4s
                time.sleep(min(2 ** (attempt - 1), 4))
            else:
                return None

        except Exception as error:
            log(f"Page {page} unexpected: {error}")
            return None

    return None


# ============================================================
# FETCH BATCH (concurrent)
# ============================================================

def fetch_batch(start_page, batch_size, max_workers):
    """Fetch multiple pages concurrently. Returns dict {page: data}."""

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
            except Exception as error:
                log(f"Batch future page {p}: {error}")
                results[p] = None

    # Return in page order
    return {p: results[p] for p in sorted(results)}


# ============================================================
# EXTRACT NEWS LIST
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
    """Fast keyword check."""
    combined = []
    for key in TEXT_KEYS:
        v = item.get(key)
        if v:
            combined.append(str(v))

    text = " ".join(combined)

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
                return value
    # fallback — but expensive; only if no ID found
    return json.dumps(item, ensure_ascii=False, sort_keys=True)


# ============================================================
# LOAD EXISTING DATA
# ============================================================

def load_existing_data():

    if not os.path.exists(OUTPUT_FILE):
        log("No existing JSON file found. Starting empty.")
        return []

    if os.path.getsize(OUTPUT_FILE) == 0:
        log("Existing JSON file is empty. Starting empty.")
        return []

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            log(f"Loaded {len(data)} existing records.")
            return data

        log("Existing JSON not a list. Starting empty.")
        return []

    except json.JSONDecodeError as error:
        log_important(f"WARNING: JSON corrupted: {error}")
        backup_file = (
            OUTPUT_FILE
            + ".backup_"
            + datetime.now().strftime("%Y%m%d_%H%M%S")
        )
        try:
            os.rename(OUTPUT_FILE, backup_file)
            log_important(f"Backed up to: {backup_file}")
        except Exception as e:
            log_important(f"Backup failed: {e}")
        return []

    except Exception as error:
        log(f"Load failed: {error}")
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
        log(f"Save error: {error}")
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass
        return False


# ============================================================
# YEAR COUNTER (INCREMENTAL — no re-loop)
# ============================================================

def build_year_counter(all_news):
    """Build the counter once from existing data."""
    counter = Counter()
    for item in all_news:
        if isinstance(item, dict):
            year = get_year(item)
            if year is not None:
                counter[year] += 1
    return counter


def print_year_counter(year_counts, total):
    log_important("==============================================")
    log_important("ACCIDENTS PER YEAR")
    log_important("==============================================")

    for year in range(START_YEAR, END_YEAR + 1):
        count = year_counts.get(year, 0)
        bar = "█" * min(count, 50)
        log_important(f"  {year} : {count:5d}  {bar}")

    log_important("==============================================")
    log_important(f"  TOTAL : {total}")
    log_important("==============================================")


# ============================================================
# MAIN
# ============================================================

def main():

    log_important("==============================================")
    log_important("HIRU NEWS - ROAD ACCIDENT SCRAPER (FAST MODE)")
    log_important("==============================================")
    log_important(f"Target years : {START_YEAR} - {END_YEAR}")
    log_important(f"Category     : {CATEGORY}")
    log_important(f"Output       : {OUTPUT_FILE}")
    log_important(f"Batch size   : {BATCH_SIZE} pages")
    log_important(f"Workers      : {MAX_WORKERS} threads")
    log_important("==============================================")

    # ---- SETUP ----
    if not setup_directories_and_files():
        log_important("Setup failed. Exiting.")
        return

    # ---- LOAD EXISTING ----
    all_news = load_existing_data()
    existing_ids = set()

    for item in all_news:
        if isinstance(item, dict):
            existing_ids.add(get_news_id(item))

    log_important(f"Existing records: {len(all_news)}")

    # ---- BUILD YEAR COUNTER ONCE ----
    year_counts = build_year_counter(all_news)

    if all_news:
        print_year_counter(year_counts, len(all_news))

    # ---- RESUME ----
    last_page = load_progress()

    if last_page is not None:
        page = last_page + 1
        log_important(f"Resuming from page: {page}")
    else:
        page = START_PAGE + 1
        log_important(f"Starting from page: {page}")

    log_important("--- STARTING SCRAPER ---")

    total_added = 0
    total_accidents_found = 0
    total_dup = 0
    total_not_acc = 0
    total_out_of_range = 0

    stop = False

    while not stop:

        batch_results = fetch_batch(page, BATCH_SIZE, MAX_WORKERS)

        # If every fetch failed → stop
        if all(v is None for v in batch_results.values()):
            log_important("All fetches failed in this batch. Stopping.")
            break

        for p in sorted(batch_results.keys()):

            data = batch_results[p]

            if data is None:
                log(f"Page {p}: fetch failed, skipping.")
                continue

            news_list = extract_news(data)

            # Empty page → API exhausted
            if not news_list:
                log_important(f"Empty page {p}. Reached end of API.")
                stop = True
                break

            page_added = 0
            page_skipped = 0
            page_out = 0
            page_not = 0

            for item in news_list:

                if not isinstance(item, dict):
                    continue

                # Accident filter
                if not is_road_accident(item):
                    page_not += 1
                    continue

                total_accidents_found += 1

                # Year filter
                if not is_valid_year(item):
                    page_out += 1
                    continue

                news_id = get_news_id(item)

                if news_id in existing_ids:
                    page_skipped += 1
                    continue

                # Add
                all_news.append(item)
                existing_ids.add(news_id)
                page_added += 1
                total_added += 1

                # Incremental year counter
                year = get_year(item)
                if year is not None:
                    year_counts[year] += 1

            total_dup += page_skipped
            total_not_acc += page_not
            total_out_of_range += page_out

            # Progress line
            update_progress(
                p, len(all_news),
                page_added, page_skipped, page_not
            )

            # Save periodically
            if p % SAVE_EVERY_N_PAGES == 0:
                saved = save_data(all_news)
                save_progress(p)
                log(f"Saved at page {p} (ok={saved})")

            # Counter print periodically
            if p % COUNTER_EVERY_N_PAGES == 0:
                print_year_counter(year_counts, len(all_news))

        # Next batch
        page += BATCH_SIZE

        if REQUEST_DELAY > 0:
            time.sleep(REQUEST_DELAY)

    # ---- FINAL SAVE ----
    sys.stdout.write("\n")
    log_important("Saving final dataset...")
    save_data(all_news)
    clear_progress()

    log_important("")
    log_important("==============================================")
    log_important("SCRAPING COMPLETE")
    log_important("==============================================")
    log_important(f"Total accidents found : {total_accidents_found}")
    log_important(f"New records added     : {total_added}")
    log_important(f"Duplicates            : {total_dup}")
    log_important(f"Not accidents         : {total_not_acc}")
    log_important(f"Out of year range     : {total_out_of_range}")
    log_important(f"Total records         : {len(all_news)}")
    log_important(f"Output file           : {OUTPUT_FILE}")
    log_important("==============================================")

    if all_news:
        print_year_counter(year_counts, len(all_news))


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.stdout.write("\n\nInterrupted by user. Data saved up to last checkpoint.\n")
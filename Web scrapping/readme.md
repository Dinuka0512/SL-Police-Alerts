# 🚗 Sri Lanka Road Accidents Data 

A data engineering pipeline that scrapes road accident news from **Hiru News**, converts it into structured CSV format, and prepares it for **Machine Learning** analysis.

---

## 📋 Project Overview

This project processes **2,672+ road accident records** scraped from Hiru News (1998–2026) and transforms raw JSON data into a clean, structured dataset ready for ML models.

The pipeline consists of **4 stages**:

1. **Data Collection** — Scrape all accident news from Hiru News → JSON
2. **JSON → CSV Conversion** — Extract date/time and generate structured CSV
3. **Data Enrichment** — Add location data (district, city, latitude, longitude)
4. **Final Preparation** — Remove unstructured text columns for ML readiness

---

## 🗂️ Folder Structure

```
Web scrapping/
│
├── convertIng-to-csv/
│   ├── 1st-convert-attempt.py     # JSON → CSV (date/time extraction)
│   ├── 2st-convert-attemp.py      # Add location (district, city, lat, lon)
│   └── 3rd-remove-story.py        # Remove title & story columns
│
└── data/
    └── raw/
        ├── hirunews_road_accidents_1998_2026.json   # Raw scraped data
        └── extracted/
            ├── 1st-converted.csv    # After stage 1
            ├── 2nd-converted.csv    # After stage 2
            └── 3rd-final.csv        # Final ML-ready dataset
```

---

## 🔄 Workflow

### **Stage 1: Data Collection (Web Scraping)**

- **Source:** [Hiru News](https://www.hirunews.lk) — Sinhala road accident news
- **Period:** 1998 – 2026
- **Total Records:** 2,672
- **Output:** `hirunews_road_accidents_1998_2026.json`

**Fields in raw JSON:**

| Field | Description |
|-------|-------------|
| `sinhala_art_id` | Article ID |
| `sinhala_title` | News title (Sinhala) |
| `sinhala_story` | Full news story (Sinhala) |
| `sinhala_added_date` | Date & time added |
| `sin_image` / `art_image` | Image paths |
| `seourltitle` | SEO-friendly URL slug |
| `view` | View count |

---

### **Stage 2: JSON → CSV Conversion**

**Script:** `1st-convert-attempt.py`

**What it does:**
- Reads the raw JSON file
- Extracts `date`, `time`, `year`, `month`, `day`, `hour`, `day_of_week` from `sinhala_added_date`
- Skips records without a valid date
- Writes structured CSV

**Output Columns:**
```
id, date, time, year, month, day, hour, day_of_week, title, story
```

**Output File:** `1st-converted.csv`

---

### **Stage 3: Data Cleaning & Enrichment**

**Script:** `2st-convert-attemp.py`

**What it does:**
- Reads `1st-converted.csv`
- Scans `title` + `story` for **Sri Lankan city names**
- Adds location columns by matching city → district, latitude, longitude
- If the text mentions a **foreign country** → sets location columns to `Nun`
- If no city is found → leaves location columns empty

**City → Location Mapping:**
- 200+ Sri Lankan cities mapped to:
  - District
  - Latitude
  - Longitude

**Output Columns:**
```
id, date, time, year, month, day, hour, day_of_week,
title, story, district, city, latitude, longitude
```

**Output File:** `2nd-converted.csv`

---

### **Stage 4: Final Preparation for ML**

**Script:** `3rd-remove-story.py`

**What it does:**
- Removes **unstructured text columns** (`title`, `story`)
- Keeps only ML-relevant structured features

**Final Columns:**
```
id, date, time, year, month, day, hour, day_of_week,
district, city, latitude, longitude
```

**Output File:** `3rd-final.csv` ✅

---

## 📊 Final Dataset

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Article ID |
| `date` | string | Date (YYYY-MM-DD) |
| `time` | string | Time (HH:MM:SS) |
| `year` | int | Year |
| `month` | int | Month (1–12) |
| `day` | int | Day of month |
| `hour` | int | Hour (0–23) |
| `day_of_week` | string | Day name (Monday–Sunday) |
| `district` | string | Sri Lankan district or `Nun` |
| `city` | string | City name or `Nun` |
| `latitude` | float | Latitude or `Nun` |
| `longitude` | float | Longitude or `Nun` |

**Total Records:** ~2,600 (after filtering)

```
# Step 1: JSON → CSV
py 1st-convert-attempt.py

# Step 2: Add location data
py 2st-convert-attemp.py

# Step 3: Remove story & title
py 3rd-remove-story.py
```

### Output

The final dataset is saved at:

```
data/raw/extracted/3rd-final.csv
```
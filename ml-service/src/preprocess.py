"""Load raw Kaggle CSVs, clean and engineer features for rent-price prediction.

Source: Kaggle "Vietnam House Rent Dataset" (vanviethieuanh) — three raw CSVs
(dn.csv, hcm.csv, hn.csv), each with only 5 columns: title, price, published,
acreage, address. There is no structured district / bedrooms / furniture /
amenities / condition column, so those are extracted from free-text `title`
and `address` via keyword matching. Coverage is uneven (see reports/ after
running) — furniture and amenity keywords hit ~5-15% of rows, condition
keywords barely appear at all in this dataset.
"""
import re
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"

SOURCES = [("dn.csv", "Đà Nẵng"), ("hcm.csv", "Hồ Chí Minh"), ("hn.csv", "Hà Nội")]

# Canonical amenity keywords -> matches the checkbox list in
# frontend/lib/constants/amenities.ts. Only amenities with a meaningful
# text-match proxy are engineered as model features.
AMENITY_PATTERNS = {
    "Máy lạnh": r"điều hòa|máy lạnh",
    "WiFi": r"wifi|wi-fi",
    "Bãi đỗ xe": r"để xe|đỗ xe|gửi xe|chỗ để xe",
    "Bảo vệ 24/7": r"bảo vệ|an ninh",
    "Camera an ninh": r"camera",
    "Bếp riêng": r"bếp riêng|có bếp",
    "Ban công": r"ban công",
    "Thang máy": r"thang máy",
    "Gác lửng": r"gác lửng|có gác\b",
    "Toilet riêng": r"khép kín|wc riêng|toilet riêng|vệ sinh riêng|vs khép kín",
    "Nóng lạnh": r"nóng lạnh",
}

FURNITURE_FULL = re.compile(r"đầy đủ nội thất|nội thất đầy đủ|full nội thất|full nt\b")
FURNITURE_BASIC = re.compile(r"nội thất cơ bản|có nội thất|sẵn nội thất")
NEWLY_BUILT = re.compile(r"mới xây")
BEDROOMS_RE = re.compile(r"(\d+)\s*(?:phòng ngủ|pn)\b")

DISTRICT_PREFIXES = re.compile(r"^(Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+", re.IGNORECASE)

SEASON_BY_MONTH = {
    1: "đông", 2: "xuân", 3: "xuân", 4: "xuân",
    5: "hạ", 6: "hạ", 7: "hạ",
    8: "thu", 9: "thu", 10: "thu",
    11: "đông", 12: "đông",
}


def load_raw() -> pd.DataFrame:
    frames = []
    for filename, city in SOURCES:
        df = pd.read_csv(RAW_DIR / filename)
        df["city"] = city
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def parse_district(address: str) -> str | None:
    parts = [p.strip() for p in str(address).split(",")]
    if len(parts) < 2:
        return None
    district = parts[-2]
    district = DISTRICT_PREFIXES.sub("", district).strip()
    return district or None


def extract_furniture(title_low: str) -> str:
    if FURNITURE_FULL.search(title_low):
        return "full"
    if FURNITURE_BASIC.search(title_low):
        return "basic"
    return "unknown"


def extract_condition(title_low: str) -> str:
    if NEWLY_BUILT.search(title_low):
        return "newly_built"
    return "unknown"


def extract_bedrooms(title_low: str) -> int:
    match = BEDROOMS_RE.search(title_low)
    if match:
        return min(int(match.group(1)), 10)
    return 1  # phòng trọ postings are almost always a single room


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # --- filter invalid rows ---
    before = len(df)
    df = df[(df["price"] > 0) & (df["acreage"] > 0)]
    # winsorize extreme outliers (data-entry errors) at 1st/99th percentile
    lo, hi = df["price"].quantile([0.01, 0.99])
    df = df[df["price"].between(lo, hi)]
    lo_a, hi_a = df["acreage"].quantile([0.01, 0.99])
    df = df[df["acreage"].between(lo_a, hi_a)]

    df["price_vnd"] = (df["price"] * 1_000_000).round(-3)  # triệu VND -> VND
    df["district"] = df["address"].apply(parse_district)
    df = df.dropna(subset=["district"])

    df["title_low"] = df["title"].str.lower()
    df["furniture"] = df["title_low"].apply(extract_furniture)
    df["condition"] = df["title_low"].apply(extract_condition)
    df["bedrooms"] = df["title_low"].apply(extract_bedrooms)

    for amenity, pattern in AMENITY_PATTERNS.items():
        df[f"amenity__{amenity}"] = df["title_low"].str.contains(pattern, regex=True, na=False)
    amenity_cols = [f"amenity__{a}" for a in AMENITY_PATTERNS]
    df["amenity_count"] = df[amenity_cols].sum(axis=1)

    df["published_dt"] = pd.to_datetime(df["published"], format="%d/%m/%Y", errors="coerce")
    df["season"] = df["published_dt"].dt.month.map(SEASON_BY_MONTH).fillna("xuân")

    feature_cols = [
        "price_vnd", "acreage", "city", "district", "bedrooms",
        "furniture", "condition", "amenity_count", "season",
    ] + amenity_cols
    out = df[feature_cols].rename(columns={"acreage": "area"})

    report_lines = [
        f"raw rows: {before}",
        f"rows after cleaning: {len(out)}",
        f"dropped: {before - len(out)}",
        "",
        "furniture distribution:",
        out["furniture"].value_counts().to_string(),
        "",
        "condition distribution:",
        out["condition"].value_counts().to_string(),
        "",
        "season distribution:",
        out["season"].value_counts().to_string(),
        "",
        "city distribution:",
        out["city"].value_counts().to_string(),
        "",
        f"unique districts: {out['district'].nunique()}",
        "",
        "price_vnd describe:",
        out["price_vnd"].describe().to_string(),
        "",
        "area describe:",
        out["area"].describe().to_string(),
    ]
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "preprocess_report.txt").write_text("\n".join(report_lines), encoding="utf-8")

    return out


def main() -> None:
    raw = load_raw()
    processed = build_features(raw)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    processed.to_csv(PROCESSED_DIR / "dataset.csv", index=False, encoding="utf-8")
    print(f"Saved {len(processed)} rows to {PROCESSED_DIR / 'dataset.csv'}")


if __name__ == "__main__":
    main()

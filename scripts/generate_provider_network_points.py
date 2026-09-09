#!/usr/bin/env python3
"""Generate the public, anonymized provider-network coordinate dataset.

The source workbook is already anonymized. This generator intentionally emits
only longitude, latitude, and a broad facility category. It never publishes
facility names, addresses, phone numbers, emails, or other identifying fields.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Iterable, Sequence

from openpyxl import load_workbook

DEFAULT_SOURCE = Path("Directory/OccuMed_Anonymized_NonExpired_Clinic_Directory.xlsx")
DEFAULT_OUTPUT = Path("public/data/provider-network-points.json")

LATITUDE_NAMES = {
    "lat",
    "latitude",
    "facilitylat",
    "facilitylatitude",
    "providerlat",
    "providerlatitude",
}
LONGITUDE_NAMES = {
    "lon",
    "lng",
    "long",
    "longitude",
    "facilitylon",
    "facilitylng",
    "facilitylongitude",
    "providerlon",
    "providerlng",
    "providerlongitude",
}
CATEGORY_NAMES = {
    "type",
    "category",
    "facilitytype",
    "providertype",
    "providercategory",
    "facilitycategory",
    "specialty",
    "providertypegroup",
}


def normalize_header(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").strip().lower())


def as_float(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        text = str(value).strip().replace(",", "")
        try:
            number = float(text)
        except ValueError:
            return None
    if not math.isfinite(number):
        return None
    return number


def classify(value: object) -> str:
    text = str(value or "").strip().lower()
    if "dental" in text or "dentist" in text:
        return "dental"
    if "pharm" in text or "vaccin" in text or "immun" in text:
        return "pharmacy"
    diagnostic_terms = (
        "lab",
        "diagn",
        "imag",
        "radio",
        "x-ray",
        "xray",
        "cardio",
        "audio",
        "hearing",
        "ultrasound",
        "mri",
        "ct ",
        "scan",
    )
    if any(term in text for term in diagnostic_terms):
        return "diagnostic"
    return "medical"


def locate_header(rows: Sequence[Sequence[object]]) -> tuple[int, int, int, int | None]:
    """Return header-row index and latitude/longitude/category column indexes."""
    for row_index, row in enumerate(rows):
        normalized = [normalize_header(value) for value in row]
        lat_index = next((i for i, name in enumerate(normalized) if name in LATITUDE_NAMES), None)
        lon_index = next((i for i, name in enumerate(normalized) if name in LONGITUDE_NAMES), None)

        # Fall back to contains-based detection for verbose headers such as
        # "Clinic Latitude" and "Clinic Longitude".
        if lat_index is None:
            lat_index = next((i for i, name in enumerate(normalized) if "latitude" in name), None)
        if lon_index is None:
            lon_index = next((i for i, name in enumerate(normalized) if "longitude" in name), None)

        if lat_index is None or lon_index is None:
            continue

        category_index = next((i for i, name in enumerate(normalized) if name in CATEGORY_NAMES), None)
        if category_index is None:
            category_index = next(
                (
                    i
                    for i, name in enumerate(normalized)
                    if any(token in name for token in ("providertype", "facilitytype", "category", "specialty"))
                ),
                None,
            )
        return row_index, lat_index, lon_index, category_index

    raise RuntimeError("Could not locate latitude and longitude columns in the workbook headers.")


def iter_sheet_points(source: Path) -> Iterable[tuple[float, float, str]]:
    workbook = load_workbook(source, read_only=True, data_only=True)
    found_coordinate_sheet = False

    for sheet in workbook.worksheets:
        preview = [tuple(row) for row in sheet.iter_rows(min_row=1, max_row=min(sheet.max_row, 30), values_only=True)]
        try:
            header_row, lat_index, lon_index, category_index = locate_header(preview)
        except RuntimeError:
            continue

        found_coordinate_sheet = True
        for row in sheet.iter_rows(min_row=header_row + 2, values_only=True):
            if lat_index >= len(row) or lon_index >= len(row):
                continue
            lat = as_float(row[lat_index])
            lon = as_float(row[lon_index])
            if lat is None or lon is None:
                yield (math.nan, math.nan, "invalid")
                continue
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                yield (math.nan, math.nan, "invalid")
                continue
            category_value = row[category_index] if category_index is not None and category_index < len(row) else None
            yield (round(lon, 5), round(lat, 5), classify(category_value))

    if not found_coordinate_sheet:
        raise RuntimeError("No worksheet with latitude/longitude columns was found.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    if not args.source.exists():
        raise SystemExit(f"Source workbook not found: {args.source}")

    points: list[list[object]] = []
    invalid = 0
    category_counts = {"medical": 0, "dental": 0, "diagnostic": 0, "pharmacy": 0}

    for lon, lat, category in iter_sheet_points(args.source):
        if not math.isfinite(lon) or not math.isfinite(lat):
            invalid += 1
            continue
        points.append([lon, lat, category])
        category_counts[category] = category_counts.get(category, 0) + 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": args.source.as_posix(),
        "validCoordinates": len(points),
        "invalidCoordinates": invalid,
        "categoryCounts": category_counts,
        "points": points,
    }
    args.output.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")

    print(f"Generated {len(points):,} valid anonymized coordinates; skipped {invalid:,} rows without usable coordinates.")
    print("Category counts:", category_counts)
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")

    if len(points) < 1000:
        raise SystemExit("Refusing to publish: generated coordinate count is implausibly low.")


if __name__ == "__main__":
    main()

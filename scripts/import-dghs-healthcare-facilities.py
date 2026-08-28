#!/usr/bin/env python3
"""Import hospital & diagnostic center data from DGHS Facility Registry."""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "dghs-healthcare-facilities.json"
BASE = "https://hrm.dghs.gov.bd/public/facility-registry/reports/organization-list"

COLUMNS = (
    "id,name,name_bn,code,email_1,facility_agency_name,facility_type_name,"
    "division_name,district_name,city_corporation_name,upazila_name,"
    "paurasava_name,union_name,is_private"
)
ALIAS = (
    "Id,Name,Name (Bangla),Code,Email,Agency,Type,Division,District,"
    "City Corporation,Upazila,Paurasava,Union,Private"
)

HOSPITAL_HINTS = ("hospital", "health complex", "trauma center", "medical college")
DIAGNOSTIC_HINTS = ("diagnostic", "pathology", "imaging centre", "imaging center")


def is_healthcare(type_name: str) -> bool:
    t = (type_name or "").lower()
    if any(h in t for h in DIAGNOSTIC_HINTS):
        return True
    if any(h in t for h in HOSPITAL_HINTS):
        return True
    return False


def category(type_name: str) -> str:
    t = (type_name or "").lower()
    if any(h in t for h in DIAGNOSTIC_HINTS):
        return "diagnostic"
    return "hospital"


def compose_address(row: dict[str, str]) -> str:
    parts = [
        row.get("Union", "").strip(),
        row.get("Paurasava", "").strip(),
        row.get("Upazila", "").strip(),
        row.get("City Corporation", "").strip(),
        row.get("District", "").strip(),
        row.get("Division", "").strip(),
    ]
    seen: set[str] = set()
    ordered: list[str] = []
    for p in parts:
        if p and p not in seen:
            seen.add(p)
            ordered.append(p)
    return ", ".join(ordered)


def fetch_page(page: int) -> list[dict[str, str]]:
    params = {
        "submit": "Run",
        "is_active": "1",
        "columns_csv": COLUMNS,
        "alias_columns_csv": ALIAS,
        "ret": "csv",
        "page": str(page),
    }
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "BloodLinkBD-Import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def total_pages() -> int:
    url = BASE + "?submit=Run&is_active=1&page=1"
    req = urllib.request.Request(url, headers={"User-Agent": "BloodLinkBD-Import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    m = re.search(r"Total\s+(\d+)\s+items", html)
    if not m:
        return 800
    total = int(m.group(1))
    return (total + 49) // 50


def normalize_row(row: dict[str, str]) -> dict:
    type_name = (row.get("Type") or "").strip()
    private_raw = (row.get("Private") or "0").strip()
    return {
        "dghsId": (row.get("Id") or "").strip(),
        "code": (row.get("Code") or "").strip(),
        "name": (row.get("Name") or "").strip(),
        "nameBn": (row.get("Name (Bangla)") or "").strip(),
        "email": (row.get("Email") or "").strip(),
        "phone": "",
        "type": type_name,
        "category": category(type_name),
        "agency": (row.get("Agency") or "").strip(),
        "division": (row.get("Division") or "").strip(),
        "district": (row.get("District") or "").strip(),
        "upazila": (row.get("Upazila") or "").strip(),
        "cityCorporation": (row.get("City Corporation") or "").strip(),
        "union": (row.get("Union") or "").strip(),
        "paurasava": (row.get("Paurasava") or "").strip(),
        "isPrivate": private_raw in ("1", "true", "True", "yes"),
        "address": compose_address(row),
    }


def main() -> int:
    pages = total_pages()
    print(f"DGHS pages to fetch: {pages}", flush=True)
    facilities: list[dict] = []
    seen_ids: set[str] = set()
    errors = 0

    def work(page: int) -> tuple[int, list[dict]]:
        rows = fetch_page(page)
        out = []
        for row in rows:
            type_name = (row.get("Type") or "").strip()
            if not is_healthcare(type_name):
                continue
            item = normalize_row(row)
            if item["dghsId"]:
                out.append(item)
        return page, out

    workers = 8
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(work, p): p for p in range(1, pages + 1)}
        done = 0
        for fut in as_completed(futures):
            done += 1
            try:
                page, batch = fut.result()
                for item in batch:
                    if item["dghsId"] in seen_ids:
                        continue
                    seen_ids.add(item["dghsId"])
                    facilities.append(item)
            except Exception as exc:  # noqa: BLE001
                errors += 1
                print(f"page error: {exc}", file=sys.stderr, flush=True)
            if done % 50 == 0 or done == pages:
                print(
                    f"progress {done}/{pages} · healthcare={len(facilities)} · errors={errors}",
                    flush=True,
                )
            time.sleep(0.02)

    facilities.sort(key=lambda x: (x["district"].lower(), x["name"].lower()))

    hospitals = sum(1 for f in facilities if f["category"] == "hospital")
    diagnostics = sum(1 for f in facilities if f["category"] == "diagnostic")

    payload = {
        "source": "DGHS Facility Registry (hrm.dghs.gov.bd)",
        "sourceUrl": "https://hrm.dghs.gov.bd/public/facility-registry",
        "importedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(facilities),
        "hospitals": hospitals,
        "diagnostics": diagnostics,
        "facilities": facilities,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {OUT} ({OUT.stat().st_size} bytes)", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

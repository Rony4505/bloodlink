#!/usr/bin/env python3
"""Create a BloodLink BD laptop backup pack (docs + data + restore guide)."""

from __future__ import annotations

import json
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path("/opt/cursor/artifacts/bloodlink-laptop-backup")
STAMP = datetime.now(timezone.utc).strftime("%Y-%m-%d")

DOC_FILES = [
    "README.md",
    "DEPLOY.md",
    "GOOGLE_AND_DOMAIN.md",
    "SMARTCRAFT_DEPLOY.md",
    "MUDI_POS.md",
    "CRICKET_LIVE.md",
    "railway.toml",
    "railway.smartcraft.toml",
    ".github/workflows/bloodlink-daily-cron.yml",
]

DATA_PATHS = [
    "data/bloodlink.json",
    "data/bloodlink.bak.json",
    "data/backups",
    "data/dghs",
    "src/data/dghs-healthcare-facilities.json",
]

SCRIPT_PATHS = [
    "scripts/create-bloodlink-laptop-backup.py",
    "scripts/export-live-postgres-backup.mjs",
    "scripts/import-dghs-healthcare-facilities.py",
]

RESTORE_GUIDE_BN = """# BloodLink BD — Laptop Backup & Restore Guide (বাংলা)

## এই ZIP-এ কী আছে?

1. **documents/** — Deploy, Railway, domain গাইড
2. **data/** — Dev/local database copy + DGHS hospital data
3. **scripts/** — Live backup export স্ক্রিপ্ট
4. **IMPORTANT-LIVE-BACKUP.txt** — Live site থেকে backup নেওয়ার পদ্ধতি

---

## ⚠️ সবচেয়ে গুরুত্বপূর্ণ: Live website data

আপনার **আসল donor/volunteer/post data** Railway **Postgres**-এ আছে (bloodlinkbd.org)।
এই ZIP-এ local/dev copy থাকতে পারে — **live ১৮+ donor data admin থেকে আলাদা ডাউনলোড করুন।**

### Live backup ডাউনলোড (প্রতি সপ্তাহে করুন)

1. ব্রাউজারে খুলুন: https://bloodlinkbd.org/bloodlinkbd.admin.rony4505
2. Admin login করুন
3. **Settings (⚙️)** → **Backup & restore** / **ব্যাকআপ ও রিস্টোর**
4. **"Download backup now"** / **"এখনই ব্যাকআপ ডাউনলোড"** ক্লিক
5. ফাইল save করুন: `bloodlink-backup-YYYY-MM-DD.json`
6. Laptop-এ folder: `BloodLink-Backups/` — তারিখ অনুযায়ী রাখুন

**Google Drive / USB / external HDD**-তেও copy রাখুন।

---

## Website problem হলে restore

1. Admin panel → Settings → Backup & restore
2. আগে saved `bloodlink-backup-*.json` file বেছে নিন
3. **Restore backup** ক্লিক
4. Confirm করুন — live data backup দিয়ে replace হবে

---

## Railway Postgres সরাসরি backup (advanced)

Railway → Postgres service → **DATABASE_PUBLIC_URL** copy করুন, তারপর:

```bash
cd bloodlink
export DATABASE_PUBLIC_URL="postgresql://..."
node scripts/export-live-postgres-backup.mjs
```

Output: `bloodlink-live-backup-YYYY-MM-DD.json`

---

## কোন file কী?

| File | বিবরণ |
|------|--------|
| `bloodlink-backup-*.json` | **সব কিছু** — donors, posts, volunteers, admin settings, notifications |
| `dghs-healthcare-facilities.json` | Hospital/diagnostic list (public import data) |
| `DEPLOY.md` | Railway redeploy guide |

---

## Backup schedule (সুপারিশ)

- **সাপ্তাহিক:** Admin panel → Download backup
- **মাসিক:** ZIP + live JSON → Google Drive
- **বড় change এর আগে:** Extra backup

BloodLink BD — backup রাখলে data হারানোর ভয় থাকে না।
"""

RESTORE_GUIDE_EN = """# BloodLink BD — Laptop Backup & Restore Guide

See RESTORE-GUIDE-BN.md for Bengali instructions.

## Critical: download LIVE backup from admin

Production data (donors, volunteers, blood posts) lives in Railway Postgres.

1. Open https://bloodlinkbd.org/bloodlinkbd.admin.rony4505
2. Settings → Backup & restore → Download backup now
3. Save `bloodlink-backup-YYYY-MM-DD.json` on your laptop weekly

## Restore after incident

Admin → Settings → Backup & restore → upload your JSON → Restore backup
"""


def copy_if_exists(src: Path, dest: Path) -> bool:
    if not src.exists():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
    else:
        shutil.copy2(src, dest)
    return True


def donor_count(path: Path) -> int | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        donors = data.get("donors")
        return len(donors) if isinstance(donors, list) else None
    except Exception:
        return None


def main() -> None:
    pack_root = OUT_DIR / f"bloodlink-laptop-backup-{STAMP}"
    if pack_root.exists():
        shutil.rmtree(pack_root)
    pack_root.mkdir(parents=True)

    manifest: dict = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "site": "https://bloodlinkbd.org",
        "adminUrl": "https://bloodlinkbd.org/bloodlinkbd.admin.rony4505",
        "included": [],
        "missing": [],
        "notes": [
            "This pack includes repo docs and local/dev data.",
            "Download LIVE backup from Admin → Settings → Backup & restore.",
        ],
    }

    for rel in DOC_FILES:
        src = ROOT / rel
        dest = pack_root / "documents" / rel
        if copy_if_exists(src, dest):
            manifest["included"].append(rel)
        else:
            manifest["missing"].append(rel)

    for rel in DATA_PATHS:
        src = ROOT / rel
        dest = pack_root / "data" / rel
        if copy_if_exists(src, dest):
            manifest["included"].append(rel)
            if rel.endswith("bloodlink.json"):
                count = donor_count(src)
                if count is not None:
                    manifest["localDonorCount"] = count

    for rel in SCRIPT_PATHS:
        src = ROOT / rel
        dest = pack_root / "scripts" / Path(rel).name
        if copy_if_exists(src, dest):
            manifest["included"].append(rel)

    (pack_root / "RESTORE-GUIDE-BN.md").write_text(RESTORE_GUIDE_BN, encoding="utf-8")
    (pack_root / "RESTORE-GUIDE-EN.md").write_text(RESTORE_GUIDE_EN, encoding="utf-8")
    (pack_root / "IMPORTANT-LIVE-BACKUP.txt").write_text(
        "LIVE DATA: Admin → Settings → Backup & restore → Download backup now\n"
        "URL: https://bloodlinkbd.org/bloodlinkbd.admin.rony4505\n"
        "Save bloodlink-backup-YYYY-MM-DD.json on your laptop every week.\n",
        encoding="utf-8",
    )

    manifest_path = pack_root / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    zip_path = OUT_DIR / f"bloodlink-laptop-backup-{STAMP}.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(pack_root.rglob("*")):
            if file.is_file():
                zf.write(file, file.relative_to(pack_root.parent))

    print(f"Pack folder: {pack_root}")
    print(f"Zip file:    {zip_path}")
    print(f"Zip size:    {zip_path.stat().st_size / 1024 / 1024:.2f} MB")
    if "localDonorCount" in manifest:
        print(f"Local donors in pack: {manifest['localDonorCount']} (dev copy — not live)")


if __name__ == "__main__":
    main()

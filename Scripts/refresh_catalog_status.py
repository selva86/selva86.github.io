#!/usr/bin/env python3
"""
Refresh annotations in Plans/exercises-hub-catalog.md from exercise-hub-status.json.

Append a status annotation to each catalog table row, in the trailing column or
appended after the row, based on the runtime tracker. Idempotent: re-running
overwrites prior annotations, doesn't double them.

Annotation format:
  - status=done          -> appends "  (DONE YYYY-MM-DD)"
  - status=manual_review -> appends "  (MANUAL REVIEW)"
  - status=quality_failed-> appends "  (QUALITY FAIL)"
  - status=pending       -> no annotation
  - status=published_pre_pipeline -> appends "  (legacy)"

Usage:
  python Scripts/refresh_catalog_status.py
  python Scripts/refresh_catalog_status.py --dry-run
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "Plans" / "exercises-hub-catalog.md"
STATUS = ROOT / "exercise-hub-status.json"


STATUS_TAG = {
    "done": "DONE {date}",
    "manual_review": "MANUAL REVIEW",
    "quality_failed": "QUALITY FAIL",
    "write_failed": "WRITE FAIL",
    "publish_failed": "PUBLISH FAIL",
    "published_pre_pipeline": "legacy",
}


def annotate(row: str, hub: dict) -> str:
    """Replace existing annotation in row with current status."""
    status = hub.get("status", "pending")
    if status == "pending":
        # Strip any prior annotation
        return re.sub(r"\s*\((DONE|MANUAL REVIEW|QUALITY FAIL|WRITE FAIL|PUBLISH FAIL|legacy)[^)]*\)\s*\|?\s*$", " |", row).rstrip()
    tag = STATUS_TAG.get(status, status.upper()).format(
        date=hub.get("date_published", hub.get("added", "?"))
    )
    new_annot = f" ({tag})"
    # If row ends with ` |`, insert before; else append
    # Strip old annotation first
    stripped = re.sub(r"\s*\((DONE|MANUAL REVIEW|QUALITY FAIL|WRITE FAIL|PUBLISH FAIL|legacy)[^)]*\)", "", row)
    # Insert before trailing | (if present)
    if stripped.rstrip().endswith("|"):
        return re.sub(r"\s*\|\s*$", f"{new_annot} |", stripped.rstrip()) + "\n" if stripped.endswith("\n") else \
               re.sub(r"\s*\|\s*$", f"{new_annot} |", stripped.rstrip())
    return stripped.rstrip() + new_annot


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not CATALOG.exists() or not STATUS.exists():
        print(f"Missing files. Catalog: {CATALOG.exists()}, Status: {STATUS.exists()}",
              file=sys.stderr)
        sys.exit(1)

    status = json.loads(STATUS.read_text(encoding="utf-8"))
    hubs = status.get("hubs", {})

    catalog_text = CATALOG.read_text(encoding="utf-8")
    lines = catalog_text.splitlines(keepends=True)

    out = []
    updated = 0
    for line in lines:
        m = re.match(r"^\|\s*\d+\s*\|\s*([\w.\-]+)\s*\|", line)
        if not m:
            out.append(line)
            continue
        slug = m.group(1).strip()
        if slug not in hubs:
            out.append(line)
            continue
        new_line = annotate(line.rstrip("\n"), hubs[slug])
        if not new_line.endswith("\n"):
            new_line += "\n"
        if new_line != line:
            updated += 1
        out.append(new_line)

    print(f"Catalog rows annotated: {updated}")
    if args.dry_run:
        print("(dry-run: catalog not written)")
        return
    CATALOG.write_text("".join(out), encoding="utf-8")
    print(f"Wrote {CATALOG}")


if __name__ == "__main__":
    main()

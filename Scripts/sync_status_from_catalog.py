#!/usr/bin/env python3
"""
Parse Plans/exercises-hub-catalog.md and merge entries into exercise-hub-status.json.

- Additive: new catalog entries get status='pending'.
- Existing entries keep their status; only tier/keyword/fr_parent may update.
- Removed catalog entries are flagged not_in_catalog=true (kept, not deleted).

Catalog rows are parsed from the per-tier markdown tables. Each row produces
one entry with slug, target keyword, tier, and inferred fr_parent if available.

Usage:
  python Scripts/sync_status_from_catalog.py
  python Scripts/sync_status_from_catalog.py --dry-run
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent  # selva86.github.io/
PROJECT_ROOT = ROOT.parent                     # D:\09_rstatisticsco
CATALOG = PROJECT_ROOT / "selva86.github.io" / "Plans" / "exercises-hub-catalog.md"
STATUS = PROJECT_ROOT / "selva86.github.io" / "exercise-hub-status.json"
POSTS_DIR = ROOT / "posts"

TIER_HEADER_RE = re.compile(r"^##\s+Tier\s+(\d+)", re.IGNORECASE)
# Accepts 3-column (# | slug | keyword) and 4-column (# | slug | keyword | rationale) rows
ROW_RE = re.compile(r"^\|\s*(\d+|\-)\s*\|\s*([\w.\-]+)\s*\|\s*([^|]+?)\s*\|(?:\s*(.+?)\s*\|)?")


def parse_catalog(text: str) -> list[dict]:
    """Walk tier sections; for each, extract slug/keyword/rationale rows."""
    out = []
    current_tier = None
    for line in text.splitlines():
        m_tier = TIER_HEADER_RE.match(line)
        if m_tier:
            current_tier = int(m_tier.group(1))
            continue
        if current_tier is None:
            continue
        m_row = ROW_RE.match(line)
        if not m_row:
            continue
        slug = m_row.group(2).strip()
        keyword = m_row.group(3).strip()
        rationale = (m_row.group(4) or "").strip()
        if slug in ("Hub slug", "---", ""):
            continue
        out.append({
            "slug": slug,
            "target_keyword": keyword,
            "rationale": rationale,
            "tier": current_tier,
        })
    return out


def load_status() -> dict:
    if STATUS.exists():
        try:
            return json.loads(STATUS.read_text(encoding="utf-8"))
        except Exception:
            return {"hubs": {}}
    return {"hubs": {}}


def find_existing_md(slug: str) -> Path | None:
    candidates = [
        POSTS_DIR / f"{slug}.md",
        POSTS_DIR / f"{slug}-in-R.md",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def merge(catalog_entries: list[dict], status: dict, dry_run: bool) -> dict:
    hubs = status.setdefault("hubs", {})
    seen = set()
    added = []
    updated = []
    for e in catalog_entries:
        slug = e["slug"]
        seen.add(slug)
        if slug in hubs:
            # Update metadata fields only, never status
            row = hubs[slug]
            changed = False
            for f in ("target_keyword", "tier", "rationale"):
                if row.get(f) != e[f]:
                    row[f] = e[f]
                    changed = True
            if changed:
                updated.append(slug)
            continue
        # New entry — check disk for existing markdown
        md_path = find_existing_md(slug)
        if md_path:
            initial_status = "published_pre_pipeline"
        else:
            initial_status = "pending"
        hubs[slug] = {
            "slug": slug,
            "target_keyword": e["target_keyword"],
            "rationale": e["rationale"],
            "tier": e["tier"],
            "status": initial_status,
            "retry_count": 0,
            "added": datetime.now().strftime("%Y-%m-%d"),
        }
        if md_path:
            hubs[slug]["md_path"] = str(md_path.relative_to(ROOT))
        added.append(slug)

    # Mark orphans
    orphans = []
    for slug, row in hubs.items():
        if slug not in seen:
            if not row.get("not_in_catalog"):
                row["not_in_catalog"] = True
                orphans.append(slug)
        else:
            if row.get("not_in_catalog"):
                row.pop("not_in_catalog", None)

    status["last_synced"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    status["catalog_total"] = len(seen)

    print(f"Catalog entries: {len(catalog_entries)}")
    print(f"  Added new:        {len(added)}")
    print(f"  Updated metadata: {len(updated)}")
    print(f"  Orphans flagged:  {len(orphans)}")
    print(f"  Total in status:  {len(hubs)}")
    if added:
        print(f"  Sample additions: {added[:5]}")
    if not dry_run:
        STATUS.write_text(json.dumps(status, indent=2), encoding="utf-8")
        print(f"Wrote {STATUS}")
    else:
        print("(dry-run: status.json not written)")
    return status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not CATALOG.exists():
        print(f"Catalog not found: {CATALOG}", file=sys.stderr)
        sys.exit(2)
    catalog_entries = parse_catalog(CATALOG.read_text(encoding="utf-8"))
    if not catalog_entries:
        print("No catalog entries parsed; check table format", file=sys.stderr)
        sys.exit(2)
    status = load_status()
    merge(catalog_entries, status, args.dry_run)


if __name__ == "__main__":
    main()

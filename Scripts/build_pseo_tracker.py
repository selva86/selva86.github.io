#!/usr/bin/env python3
"""
build_pseo_tracker.py - Generate pseo-status.json from authoritative sources.

Reads:
  Plans/PSEO/categories/01-function-deep.md ... 14-ml-metrics.md (planned slugs)
  _posts/<slug>.html                                              (frontmatter for title)
  <slug>.html at site root                                        (published flag)
  posts/<slug>.md mtime                                           (update_date)

Writes:
  pseo-status.json (at repo root) - flat array, one entry per planned slug.

Schema:
  [
    {
      "slug":         str,
      "title":        str,   # SEO title from frontmatter; "" if not started
      "url":          str,   # https://r-statistics.co/<slug>.html; "" if not published
      "published_date":     str,   # YYYY-MM-DD; "" if not published
      "update_date":  str,   # YYYY-MM-DD; "" if not started
      "category":     str,   # function-deep, error-message, ...
      "type":         str    # subcategory: dplyr-functions, ggplot2-functions, ...
    },
    ...
  ]

Modes:
  default          full rebuild from scan
  --update <slug>  refresh ONE slug in place (called by publish flow)
  --json           print rebuilt tracker to stdout (no write)

Usage:
  python Scripts/build_pseo_tracker.py
  python Scripts/build_pseo_tracker.py --update dplyr-select-in-R
"""

import argparse
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATEGORIES_DIR = PROJECT_ROOT / "Plans" / "PSEO" / "categories"
POSTS_DIR = PROJECT_ROOT / "posts"
FRAGMENTS_DIR = PROJECT_ROOT / "_posts"
TRACKER_PATH = PROJECT_ROOT / "pseo-status.json"
SITE_BASE = "https://r-statistics.co/"

CATEGORY_FILENAME_RE = re.compile(r"^\d+-([a-z\-]+)\.md$")
SUBCLUSTER_HEADER_RE = re.compile(r"^##\s+\d+\.\d+\s+(.+?)\s*(?:\(\d+\))?\s*$")
SLUG_LINE_RE = re.compile(r"^-\s+([A-Za-z][\w\-]*)\s*$")
FRONTMATTER_RE = re.compile(r"^---\s*$\n(.+?)\n^---\s*$", re.MULTILINE | re.DOTALL)
TITLE_RE = re.compile(r'^title:\s*"?(.+?)"?\s*$', re.MULTILINE)
DATE_RE = re.compile(r'^date:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$', re.MULTILINE)


def slugify(s):
    return re.sub(r"[^A-Za-z0-9\-]", "", s.lower().replace(" ", "-"))


def parse_appendix(path):
    """Yield (slug, subcategory) pairs from one appendix file."""
    current_sub = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = SUBCLUSTER_HEADER_RE.match(raw)
        if m:
            current_sub = slugify(m.group(1))
            continue
        m = SLUG_LINE_RE.match(raw)
        if m and current_sub:
            yield m.group(1), current_sub


def collect_planned():
    """Walk all category appendix files, return list of dicts with slug/category/type."""
    planned = []
    if not CATEGORIES_DIR.exists():
        return planned
    for path in sorted(CATEGORIES_DIR.glob("*.md")):
        m = CATEGORY_FILENAME_RE.match(path.name)
        if not m:
            continue
        category = m.group(1)
        for slug, subcategory in parse_appendix(path):
            planned.append(
                {"slug": slug, "category": category, "type": subcategory}
            )
    return planned


def read_post_metadata(slug):
    """Return (title, published_date) by reading posts/<slug>.md frontmatter (md is the SoT for date).

    Falls back to _posts/<slug>.html for title if the markdown is missing.
    """
    title = ""
    pub = ""
    md = POSTS_DIR / f"{slug}.md"
    if md.exists():
        text = md.read_text(encoding="utf-8", errors="replace")
        m = FRONTMATTER_RE.search(text)
        if m:
            fm = m.group(1)
            tm = TITLE_RE.search(fm)
            dm = DATE_RE.search(fm)
            title = tm.group(1).strip() if tm else ""
            pub = dm.group(1) if dm else ""
    if not title:
        frag = FRAGMENTS_DIR / f"{slug}.html"
        if frag.exists():
            text = frag.read_text(encoding="utf-8", errors="replace")
            m = FRONTMATTER_RE.search(text)
            if m:
                tm = TITLE_RE.search(m.group(1))
                title = tm.group(1).strip() if tm else ""
    return title, pub


def md_mtime(slug):
    """Return YYYY-MM-DD of last modification to posts/<slug>.md, or ""."""
    md = POSTS_DIR / f"{slug}.md"
    if not md.exists():
        return ""
    return date.fromtimestamp(md.stat().st_mtime).isoformat()


def is_published(slug):
    return (PROJECT_ROOT / f"{slug}.html").exists()


def build_entry(planned_row):
    slug = planned_row["slug"]
    title, published_date = read_post_metadata(slug)
    published = is_published(slug)
    update_date = md_mtime(slug)
    return {
        "slug": slug,
        "title": title if published else "",
        "url": (SITE_BASE + slug + ".html") if published else "",
        "published_date": published_date if published else "",
        "update_date": update_date,
        "category": planned_row["category"],
        "type": planned_row["type"],
    }


def rebuild():
    entries = [build_entry(p) for p in collect_planned()]
    return entries


def update_one(slug):
    """Refresh the single matching entry in pseo-status.json."""
    if not TRACKER_PATH.exists():
        print(f"tracker not found at {TRACKER_PATH}; run without --update first")
        return 1
    data = json.loads(TRACKER_PATH.read_text(encoding="utf-8"))
    found = False
    for i, row in enumerate(data):
        if row.get("slug") == slug:
            data[i] = build_entry(
                {"slug": slug, "category": row.get("category", ""), "type": row.get("type", "")}
            )
            found = True
            break
    if not found:
        # Not in tracker yet (e.g., new slug not in appendix); skip
        print(f"slug '{slug}' not in tracker - add to Plans/PSEO/categories first")
        return 1
    TRACKER_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"updated {slug}")
    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--update", metavar="SLUG", help="refresh one slug in place")
    p.add_argument("--json", action="store_true", help="print to stdout, do not write file")
    args = p.parse_args()

    if args.update:
        return update_one(args.update)

    entries = rebuild()
    payload = json.dumps(entries, indent=2, ensure_ascii=False) + "\n"
    if args.json:
        print(payload)
        return 0
    TRACKER_PATH.write_text(payload, encoding="utf-8")
    pub_count = sum(1 for e in entries if e["url"])
    drafted = sum(1 for e in entries if e["update_date"] and not e["url"])
    not_started = len(entries) - pub_count - drafted
    print(f"wrote {TRACKER_PATH.relative_to(PROJECT_ROOT)}")
    print(f"  total planned:  {len(entries)}")
    print(f"  published:      {pub_count}")
    print(f"  drafted:        {drafted}")
    print(f"  not started:    {not_started}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

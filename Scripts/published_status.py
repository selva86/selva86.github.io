#!/usr/bin/env python3
"""
Generate a published-content dashboard from all 3 trackers.

Reads:
  - pseo-status.json (PSEO posts; canonical tracker)
  - curriculum-status.json (Core/FR/EX posts; gitignored)
  - Plans/PSEO/asset-tracker.json (calculators, cheatsheets, interview-questions)

Writes:
  - Plans/PSEO/published-status.md (committed dashboard, regenerable)
  - Plans/PSEO/published-status.json (machine-readable mirror, optional)

Each entry includes:
  - slug, title, url
  - category_id, subcategory_id (for PSEO/asset)
  - published_date
  - last_modified (from file mtime)
  - word_count (computed from posts/<slug>.md when present)

Usage:
  python Scripts/published_status.py            # write dashboard
  python Scripts/published_status.py --json     # also write JSON mirror
  python Scripts/published_status.py --quiet    # no stdout
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent  # selva86.github.io/
PSEO_JSON = ROOT / "pseo-status.json"
CURRICULUM_JSON = ROOT / "curriculum-status.json"
ASSET_JSON = ROOT / "Plans" / "PSEO" / "asset-tracker.json"
OUT_MD = ROOT / "Plans" / "PSEO" / "published-status.md"
OUT_JSON = ROOT / "Plans" / "PSEO" / "published-status.json"


def _load(path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _file_mtime(slug):
    """Get last_modified from the markdown file mtime if available."""
    md = ROOT / "posts" / f"{slug}.md"
    if md.exists():
        ts = os.path.getmtime(md)
        return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec="seconds")
    html = ROOT / f"{slug}.html"
    if html.exists():
        ts = os.path.getmtime(html)
        return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec="seconds")
    return None


def _word_count_for(slug):
    """Compute word count from posts/<slug>.md if it exists. Strips frontmatter
    and fenced code blocks before counting. Returns int or None."""
    md = ROOT / "posts" / f"{slug}.md"
    if not md.exists():
        return None
    text = md.read_text(encoding="utf-8", errors="replace")
    import re
    body = re.sub(r"^---.*?---", "", text, count=1, flags=re.DOTALL)
    body = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
    return len(body.split())


def collect_pseo():
    """Iterate the flat pseo-status.json. Treat entries with non-empty `url`
    as published. Map pseo-status fields: category -> category_id,
    type -> subcategory_id. last_modified comes from file mtime; word_count
    is computed from the markdown body."""
    rows = []
    data = _load(PSEO_JSON)
    if not data:
        return rows
    for entry in data:
        if not entry.get("url"):
            continue
        slug = entry.get("slug")
        rows.append({
            "type": "PSEO",
            "slug": slug,
            "title": entry.get("title", ""),
            "url": entry.get("url"),
            "category_id": entry.get("category"),
            "subcategory_id": entry.get("type"),
            "series_id": None,
            "published_date": entry.get("published_date"),
            "last_modified": _file_mtime(slug),
            "last_reviewed": None,
            "word_count": _word_count_for(slug),
            "traffic_30d": None,
        })
    return rows


def collect_curriculum():
    rows = []
    data = _load(CURRICULUM_JSON)
    if not data:
        return rows
    for path_key, path_obj in data.get("paths", {}).items():
        for sub_key, sub_obj in path_obj.get("sub_paths", {}).items():
            for post in sub_obj.get("posts", []):
                if post.get("status") != "published":
                    continue
                slug = post.get("slug")
                rows.append({
                    "type": post.get("type", "C"),
                    "slug": slug,
                    "title": post.get("ctr_title") or post.get("title", ""),
                    "url": post.get("url") or (f"https://r-statistics.co/{slug}.html" if slug else None),
                    "category_id": "core" if post.get("type") == "C" else (post.get("type") or "C").lower(),
                    "subcategory_id": sub_key,
                    "series_id": path_key,
                    "published_date": post.get("date"),
                    "last_modified": _file_mtime(slug) if slug else None,
                    "last_reviewed": post.get("last_reviewed"),
                    "word_count": post.get("word_count"),
                    "traffic_30d": post.get("traffic_30d"),
                })
    return rows


def collect_assets():
    rows = []
    data = _load(ASSET_JSON)
    if not data:
        return rows
    # calculators (live + net_new)
    for entry in data.get("calculators", {}).get("live_existing", []):
        if entry.get("status") != "published":
            continue
        slug = entry.get("slug")
        rows.append({
            "type": "calculator",
            "slug": slug,
            "title": entry.get("title", ""),
            "url": f"https://r-statistics.co/tools/{slug}.html",
            "category_id": "calculator",
            "subcategory_id": entry.get("subcategory_id"),
            "series_id": None,
            "published_date": entry.get("published_date"),
            "last_modified": _file_mtime(slug),
            "last_reviewed": entry.get("last_reviewed"),
            "word_count": None,
            "traffic_30d": entry.get("traffic_30d"),
        })
    for entry in data.get("calculators", {}).get("net_new", []):
        if entry.get("status") != "published":
            continue
        slug = entry.get("slug")
        rows.append({
            "type": "calculator",
            "slug": slug,
            "title": entry.get("title", ""),
            "url": f"https://r-statistics.co/tools/{slug}.html",
            "category_id": "calculator",
            "subcategory_id": entry.get("subcategory_id"),
            "series_id": None,
            "published_date": entry.get("published_date"),
            "last_modified": _file_mtime(slug),
            "last_reviewed": entry.get("last_reviewed"),
            "word_count": None,
            "traffic_30d": entry.get("traffic_30d"),
        })
    # cheatsheets
    for group in ("live_existing", "net_new"):
        for entry in data.get("cheatsheets", {}).get(group, []):
            if entry.get("status") != "published":
                continue
            slug = entry.get("slug")
            rows.append({
                "type": "cheatsheet",
                "slug": slug,
                "title": entry.get("title", ""),
                "url": f"https://r-statistics.co/{slug}.html",
                "category_id": "cheatsheet",
                "subcategory_id": entry.get("subcategory_id"),
                "series_id": None,
                "published_date": entry.get("published_date"),
                "last_modified": _file_mtime(slug),
                "last_reviewed": entry.get("last_reviewed"),
                "word_count": None,
                "traffic_30d": entry.get("traffic_30d"),
            })
    # interview-questions (5 sub-buckets)
    iq = data.get("interview_questions", {})
    for bucket in ("by_role_level", "by_topic", "by_format", "specials", "bait_pages"):
        for entry in iq.get(bucket, []):
            if entry.get("status") != "published":
                continue
            slug = entry.get("slug")
            rows.append({
                "type": "interview-question",
                "slug": slug,
                "title": entry.get("title", ""),
                "url": f"https://r-statistics.co/{slug}.html",
                "category_id": "interview-question",
                "subcategory_id": entry.get("subcategory_id"),
                "series_id": bucket,
                "published_date": entry.get("published_date"),
                "last_modified": _file_mtime(slug),
                "last_reviewed": entry.get("last_reviewed"),
                "word_count": entry.get("questions_count"),
                "traffic_30d": entry.get("traffic_30d"),
            })
    return rows


def render_markdown(rows):
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    by_type = {}
    for r in rows:
        by_type.setdefault(r["type"], []).append(r)

    lines = []
    lines.append("# Published Content Dashboard")
    lines.append("")
    lines.append(f"**Generated:** {now}")
    lines.append(f"**Total published:** {len(rows)}")
    lines.append("")
    lines.append("Auto-generated by `Scripts/published_status.py`. Do not edit by hand.")
    lines.append("")
    lines.append("## Summary by type")
    lines.append("")
    lines.append("| Type | Published |")
    lines.append("|---|---|")
    for t in sorted(by_type.keys()):
        lines.append(f"| {t} | {len(by_type[t])} |")
    lines.append("")

    for t in sorted(by_type.keys()):
        type_rows = sorted(
            by_type[t],
            key=lambda r: (r.get("published_date") or "", r.get("slug") or "")
        )
        lines.append(f"## {t} ({len(type_rows)})")
        lines.append("")
        lines.append("| Slug | Title | Published | Last modified | Last reviewed | Words | URL |")
        lines.append("|---|---|---|---|---|---|---|")
        for r in type_rows:
            published = (r.get("published_date") or "")[:10]
            modified = (r.get("last_modified") or "")[:19].replace("T", " ")
            reviewed = (r.get("last_reviewed") or "-")[:10]
            words = r.get("word_count") if r.get("word_count") is not None else "-"
            slug_link = f"`{r['slug']}`"
            url_short = r["url"].replace("https://r-statistics.co", "") if r.get("url") else "-"
            lines.append(
                f"| {slug_link} | {r.get('title', '')[:60]} | {published} | {modified} | {reviewed} | {words} | [{url_short}]({r.get('url') or '#'}) |"
            )
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Source files")
    lines.append("")
    lines.append("- `pseo-status.json` (PSEO)")
    lines.append("- `curriculum-status.json` (Core, FR, EX) [gitignored]")
    lines.append("- `Plans/PSEO/asset-tracker.json` (calculators, cheatsheets, interview-questions)")
    lines.append("")
    lines.append("Regenerate with: `python Scripts/published_status.py`")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="also write JSON mirror")
    ap.add_argument("--quiet", action="store_true", help="no stdout")
    args = ap.parse_args()

    rows = collect_pseo() + collect_curriculum() + collect_assets()
    md = render_markdown(rows)
    OUT_MD.write_text(md, encoding="utf-8")
    if args.json:
        OUT_JSON.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    if not args.quiet:
        print(f"Wrote {OUT_MD} ({len(rows)} published entries)")
        if args.json:
            print(f"Wrote {OUT_JSON}")


if __name__ == "__main__":
    main()

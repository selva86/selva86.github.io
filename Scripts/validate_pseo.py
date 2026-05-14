#!/usr/bin/env python3
"""
validate_pseo.py - Pre-write demand validation for PSEO topics.

Two gates:
  1. Slug-registry     ensure candidate slug is not already taken
  2. Competitor scan   top organic results via SerpAPI (skipped if no API key)

Usage:
  python Scripts/validate_pseo.py "stringr str_extract"
  python Scripts/validate_pseo.py "stringr str_extract" --slug stringr-str_extract-in-R
  python Scripts/validate_pseo.py "stringr str_extract" --json

Env:
  SERPAPI_KEY  optional; if set, gate 2 runs, otherwise it is skipped.

Exit codes:
  0  PASS or WARN  proceed (WARN means caveats noted)
  1  FAIL          do not write
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PSEO_JSON = PROJECT_ROOT / "www" / "programmatic-seo.json"

USER_AGENT = "Mozilla/5.0 (validate_pseo)"


def load_env_file():
    """Load KEY=VALUE pairs from .env files into os.environ (without overriding).

    Searches selva86.github.io/.env then the parent dir's .env (project root,
    where shared secrets live since it sits outside the git repo).
    """
    candidates = [PROJECT_ROOT / ".env", PROJECT_ROOT.parent / ".env"]
    for path in candidates:
        if not path.exists():
            continue
        try:
            for raw in path.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
        except OSError:
            continue


load_env_file()


def derive_slug(topic):
    """Derive canonical slug from topic. Matches PSEO post naming convention."""
    slug = topic.strip()
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"[^A-Za-z0-9_\-]", "", slug)
    if not (slug.endswith("-in-R") or slug.endswith("-R")):
        slug = slug + "-in-R"
    return slug


def check_slug_registry(slug):
    if not PSEO_JSON.exists():
        return ("WARN", f"{PSEO_JSON.name} not found - cannot dedupe")
    try:
        data = json.loads(PSEO_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return ("WARN", f"{PSEO_JSON.name} unparsable: {e}")
    registry = data.get("slug_registry", [])
    if slug in registry:
        return ("FAIL", f"slug '{slug}' already in slug_registry")
    html_path = PROJECT_ROOT / f"{slug}.html"
    if html_path.exists():
        return ("FAIL", f"{slug}.html already exists at site root")
    md_path = PROJECT_ROOT / "posts" / f"{slug}.md"
    if md_path.exists():
        return ("FAIL", f"posts/{slug}.md already exists (drafted)")
    return ("PASS", f"slug '{slug}' is new")


def fetch_serp(query, api_key, timeout=20):
    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(
        {"q": query, "engine": "google", "num": 5, "api_key": api_key}
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def gate_competitors(topic, api_key):
    if not api_key:
        return ("SKIP", "SERPAPI_KEY not set - skipping competitor scan", [])
    try:
        result = fetch_serp(topic + " in R", api_key)
    except Exception as e:
        return ("WARN", f"SerpAPI request failed: {e}", [])
    organic = result.get("organic_results") or []
    rows = []
    for r in organic[:5]:
        rows.append(
            {
                "position": r.get("position"),
                "title": r.get("title", "")[:120],
                "link": r.get("link", ""),
                "snippet": (r.get("snippet") or "")[:160],
            }
        )
    if not rows:
        return ("WARN", "no organic results returned", [])
    return ("PASS", f"{len(rows)} top organic results", rows)


def overall_status(statuses):
    effective = [s for s in statuses if s != "SKIP"]
    if any(s == "FAIL" for s in effective):
        return "FAIL"
    if any(s == "WARN" for s in effective):
        return "WARN"
    return "PASS"


def render_text(report):
    out = []
    bar = "=" * 60
    out.append(bar)
    out.append(f"Validation: {report['topic']}")
    out.append(bar)
    out.append("")

    sl = report["slug"]
    out.append(f"[1/2] Slug-registry dedupe          {sl['status']}")
    out.append(f"      candidate slug: {sl['candidate']}")
    out.append(f"      {sl['message']}")
    out.append("")

    c = report["competitors"]
    out.append(f"[2/2] Competitor scan               {c['status']}")
    out.append(f"      {c['message']}")
    for r in c["results"]:
        out.append(f"        {r['position']}. {r['title']}")
        out.append(f"           {r['link']}")
        if r.get("snippet"):
            out.append(f"           {r['snippet']}")
    out.append("")

    out.append("-" * 60)
    out.append(f"OVERALL: {report['overall']}")
    out.append("-" * 60)
    return "\n".join(out)


def main():
    p = argparse.ArgumentParser(
        description="PSEO topic validation: demand + dedupe + competitors"
    )
    p.add_argument("topic", help="topic or keyword (e.g. 'stringr str_extract')")
    p.add_argument("--slug", help="override derived slug")
    p.add_argument("--json", action="store_true", help="emit JSON instead of text")
    args = p.parse_args()

    slug = args.slug or derive_slug(args.topic)
    api_key = os.environ.get("SERPAPI_KEY", "").strip()

    slug_status, slug_msg = check_slug_registry(slug)
    comp_status, comp_msg, comp_rows = gate_competitors(args.topic, api_key)

    report = {
        "topic": args.topic,
        "slug": {"status": slug_status, "candidate": slug, "message": slug_msg},
        "competitors": {"status": comp_status, "message": comp_msg, "results": comp_rows},
        "overall": overall_status([slug_status, comp_status]),
    }

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(render_text(report))

    sys.exit(0 if report["overall"] in ("PASS", "WARN") else 1)


if __name__ == "__main__":
    main()

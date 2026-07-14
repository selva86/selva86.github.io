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
    """Filesystem-based dedupe: a slug is "taken" if either the built page
    or the markdown draft already exists. The legacy slug_registry in
    www/programmatic-seo.json is no longer consulted (consolidated)."""
    html_path = PROJECT_ROOT / f"{slug}.html"
    if html_path.exists():
        return ("FAIL", f"{slug}.html already exists at site root")
    md_path = PROJECT_ROOT / "posts" / f"{slug}.md"
    if md_path.exists():
        return ("FAIL", f"posts/{slug}.md already exists (drafted)")
    collided = _normalized_collision(slug)
    if collided:
        return ("FAIL", f"same-topic collision: {collided} already covers this "
                        f"(normalized-token match; see pseo-error-slug-collisions)")
    return ("PASS", f"slug '{slug}' is new")


_STOPWORDS = {"in", "r", "error", "the", "a", "an", "to", "of", "x", "with", "is", "for"}


def _norm_tokens(name):
    words = re.sub(r"[^a-z0-9]+", " ", name.lower()).split()
    return frozenset(w for w in words if w not in _STOPWORDS)


def _normalized_collision(slug):
    """Same-topic/different-slug dedupe: token-set match between the candidate
    slug and every published root page (catches Error-foo-in-R vs
    R-Error-Foo.html, which the exact-filename check misses)."""
    target = _norm_tokens(slug)
    if len(target) < 2:
        return None
    for f in PROJECT_ROOT.glob("*.html"):
        base = f.stem
        if base == slug:
            continue
        other = _norm_tokens(base)
        if other and len(other) >= 2 and (other == target or other <= target):
            return base + ".html"
    return None


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
        # ensure_ascii=True (default): escape non-ASCII as \uXXXX so stdout is
        # pure ASCII. The batch orchestrator captures this via subprocess on a
        # Windows cp1252 console; raw non-ASCII from SerpAPI titles/snippets
        # would otherwise raise UnicodeEncodeError and crash the validator.
        print(json.dumps(report, indent=2))
    else:
        print(render_text(report))

    sys.exit(0 if report["overall"] in ("PASS", "WARN") else 1)


if __name__ == "__main__":
    main()

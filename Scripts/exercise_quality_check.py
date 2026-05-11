#!/usr/bin/env python3
"""
Exercise hub quality gate.

Reads an exercise hub markdown post and runs deterministic checks against the
format spec in `.claude/skills/write-exercise-hub/format-spec.md`. Exit code 0
if all checks pass, 1 if any fail.

Usage:
  python Scripts/exercise_quality_check.py posts/<slug>.md
  python Scripts/exercise_quality_check.py posts/<slug>.md --tier 1
  python Scripts/exercise_quality_check.py --all
  python Scripts/exercise_quality_check.py --json posts/<slug>.md
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent  # selva86.github.io/
POSTS_DIR = ROOT / "posts"
PROJECT_ROOT = ROOT.parent
EXEMPTIONS_FILE = PROJECT_ROOT / "Scripts" / "quality_exemptions.json"
if not EXEMPTIONS_FILE.exists():
    EXEMPTIONS_FILE = ROOT / "Scripts" / "quality_exemptions.json"

REQUIRED_FRONTMATTER = [
    "title", "slug", "description", "keywords", "mathjax", "webr", "date",
    "post_type", "sidebar_title", "fr_parent", "auto_link_terms",
    "target_keyword", "difficulty"
]

# Allowed built-in datasets (others trigger a warning)
ALLOWED_DATASETS = {
    "mtcars", "iris", "diamonds", "economics", "faithful", "ChickWeight",
    "airquality", "sleepstudy", "lung", "txhousing", "mpg", "AirPassengers",
    "USArrests", "Titanic", "Orange", "ToothGrowth", "PlantGrowth", "warpbreaks",
    "Loblolly", "trees", "Nile", "EuStockMarkets", "co2", "WWWusage",
}

TIER_MIN_EXERCISES = {1: 45, 2: 25, 3: 15}

# Tier inference from sidebar_order range (set by write skill) — fallback
def infer_tier(fm):
    try:
        order = int(fm.get("sidebar_order", "999"))
        if order < 110:
            return 1
        if order < 140:
            return 2
        return 3
    except Exception:
        return 2


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm_text = parts[1]
    body = parts[2]
    fm = {}
    for line in fm_text.splitlines():
        m = re.match(r'^([\w_]+):\s*(.*)$', line.strip())
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val.startswith('"') and val.endswith('"'):
                val = val[1:-1]
            fm[key] = val
    return fm, body


def load_exemptions(slug: str) -> set[str]:
    if not EXEMPTIONS_FILE.exists():
        return set()
    try:
        data = json.loads(EXEMPTIONS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return set()
    return set(data.get(slug, []))


def extract_exercises(body: str) -> list[dict]:
    """Return list of exercise blocks. Accepts several heading conventions:
      ### Exercise N.M: <title>
      ### Exercise N: <title>
      ### Problem N: <title>
      ## Exercise N: <title>     (h2-style, in some older hubs)
      ### Question N.M: <title>  (interview-style)
    """
    pattern = re.compile(
        r"^(#{2,3})\s+(?:Exercise|Problem|Question)\s+",
        re.MULTILINE,
    )
    matches = list(pattern.finditer(body))
    if not matches:
        return []
    out = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        # Trim trailing "## What to do next" section if it falls inside this slice
        chunk_full = body[start:end]
        cut = re.search(r"^##\s+What to do next", chunk_full, re.MULTILINE)
        chunk = chunk_full[: cut.start()] if cut else chunk_full
        first_line = chunk.splitlines()[0]
        title = re.sub(r"^#+\s+(?:Exercise|Problem|Question)\s+", "", first_line).strip()
        out.append({"raw": chunk, "title": title})
    return out


# ---------------- Checks ----------------

def check_frontmatter_complete(fm, body, ctx):
    missing = [k for k in REQUIRED_FRONTMATTER if not fm.get(k)]
    if missing:
        return False, f"missing fields: {missing}"
    return True, f"{len(REQUIRED_FRONTMATTER)} required fields present"


def check_post_type(fm, body, ctx):
    if fm.get("post_type") != "EX":
        return False, f"post_type='{fm.get('post_type')}' (expected 'EX')"
    return True, "post_type=EX"


def check_lead_paragraph(fm, body, ctx):
    m = re.search(r'<p class="lead">(.+?)</p>', body, re.DOTALL)
    if not m:
        return False, "no <p class=\"lead\"> found"
    words = len(m.group(1).split())
    if not 15 <= words <= 80:
        return False, f"lead has {words} words (expected 15-80)"
    return True, f"lead paragraph ({words} words)"


def check_no_breakup_table(fm, body, ctx):
    """Section breakup table near top is forbidden per user feedback."""
    head = body[:3000]
    if re.search(r"\|\s*Section\s*\|.*Topic.*\|", head, re.IGNORECASE):
        return False, "section breakup table detected near top"
    return True, "no section breakup table"


def check_setup_block(fm, body, ctx):
    if re.search(r"```r\s+title=\"Run this once[^\"]*\"\s*\n.*?library\(", body, re.DOTALL):
        return True, "setup library() block present"
    if "library(" in body[:2000]:
        return True, "library() call present in opening section"
    return False, "no setup library() block found"


def check_exercise_count(fm, body, ctx):
    exercises = ctx["exercises"]
    tier = ctx["tier"]
    min_count = TIER_MIN_EXERCISES.get(tier, 25)
    if len(exercises) < min_count:
        return False, f"{len(exercises)} exercises (tier {tier} requires >= {min_count})"
    return True, f"{len(exercises)} exercises (tier {tier} >= {min_count})"


def check_exercise_titles(fm, body, ctx):
    bad = []
    for i, ex in enumerate(ctx["exercises"], 1):
        title = ex["title"]
        # Pattern: "N.M: <descriptive>" or "N: <descriptive>"
        m = re.match(r"^(\d+(?:\.\d+)?)[:\s]+(.+)$", title)
        if not m or len(m.group(2).strip()) < 8:
            bad.append(f"#{i}: '{title}'")
    if bad:
        return False, f"weak/missing titles: {bad[:3]}{'...' if len(bad)>3 else ''}"
    return True, f"all {len(ctx['exercises'])} exercise titles descriptive"


SCENARIO_RE = re.compile(r"\*\*Scenario:\*\*\s*(.+?)(?:\n\n|\*\*Difficulty)", re.DOTALL)
DIFFICULTY_RE = re.compile(r"\*\*Difficulty:\*\*\s*(\w+)")


def parse_difficulty(text):
    m = DIFFICULTY_RE.search(text)
    return m.group(1) if m else None


def check_scenarios(fm, body, ctx):
    """Each non-Beginner exercise needs Scenario >= 12 words."""
    if "scenario_required" in ctx["exempt"]:
        return True, "skipped (exempt)"
    weak = []
    missing = []
    for i, ex in enumerate(ctx["exercises"], 1):
        diff = parse_difficulty(ex["raw"]) or ""
        if diff.lower() == "beginner":
            continue
        sm = SCENARIO_RE.search(ex["raw"])
        if not sm:
            missing.append(i)
            continue
        n = len(sm.group(1).split())
        if n < 12:
            weak.append((i, n))
    if missing or weak:
        msg_parts = []
        if missing:
            msg_parts.append(f"missing scenario in {len(missing)} non-Beginner: {missing[:5]}")
        if weak:
            msg_parts.append(f"weak (<12 words) in {len(weak)}: {weak[:3]}")
        return False, "; ".join(msg_parts)
    return True, "all non-Beginner exercises have scenarios >= 12 words"


def check_difficulty_markers(fm, body, ctx):
    missing = []
    for i, ex in enumerate(ctx["exercises"], 1):
        if not DIFFICULTY_RE.search(ex["raw"]):
            missing.append(i)
    if missing:
        return False, f"missing **Difficulty:** in: {missing[:5]}"
    return True, "all exercises have Difficulty markers"


def check_difficulty_mix(fm, body, ctx):
    if "difficulty_mix" in ctx["exempt"]:
        return True, "skipped (exempt)"
    diffs = [parse_difficulty(e["raw"]) or "" for e in ctx["exercises"]]
    total = len(diffs) or 1
    inter_adv = sum(1 for d in diffs if d.lower() in ("intermediate", "advanced"))
    pct = inter_adv / total
    if pct < 0.5:
        return False, f"only {int(pct*100)}% Intermediate/Advanced (need >= 50%)"
    return True, f"{int(pct*100)}% Intermediate/Advanced"


def check_solution_blocks(fm, body, ctx):
    missing = []
    for i, ex in enumerate(ctx["exercises"], 1):
        if "<details>" not in ex["raw"] or "</details>" not in ex["raw"]:
            missing.append(i)
            continue
        # solution code block inside details
        details_block = re.search(r"<details>(.*?)</details>", ex["raw"], re.DOTALL)
        if not details_block or "```" not in details_block.group(1):
            missing.append(i)
    if missing:
        return False, f"missing solution in: {missing[:5]}"
    return True, "all exercises have <details> solution blocks"


def check_explanations(fm, body, ctx):
    """Solutions need real explanations. Threshold: at least 15 words, with up
    to 10% tolerance for terse cases on simple exercises."""
    if "explanation_required" in ctx["exempt"]:
        return True, "skipped (exempt)"
    weak = []
    total = len(ctx["exercises"]) or 1
    for i, ex in enumerate(ctx["exercises"], 1):
        details_block = re.search(r"<details>(.*?)</details>", ex["raw"], re.DOTALL)
        if not details_block:
            continue
        inside = details_block.group(1)
        prose = re.sub(r"```.*?```", "", inside, flags=re.DOTALL)
        prose = re.sub(r"<[^>]+>", "", prose)
        words = len(prose.split())
        if words < 15:
            weak.append((i, words))
    tolerance = max(2, total // 10)  # 10% tolerance, min 2
    if len(weak) > tolerance:
        return False, f"explanations < 15 words in {len(weak)}/{total} (tolerance {tolerance}): {weak[:3]}"
    if weak:
        return True, f"{len(weak)} terse explanations within tolerance"
    return True, f"all {total} explanations >= 15 words"


def check_no_em_dash(fm, body, ctx):
    """Per project rule (MEMORY.md): no em-dashes anywhere."""
    matches = re.findall(r"—", body)
    if matches:
        return False, f"{len(matches)} em-dash chars present"
    return True, "no em-dashes"


def check_no_webr_mention(fm, body, ctx):
    """Per MEMORY.md: never expose WebR in public-facing content."""
    pattern = re.compile(r"\bWebR\b|WebAssembly", re.IGNORECASE)
    matches = pattern.findall(body)
    if matches:
        return False, f"WebR/WebAssembly mentioned {len(matches)}x in body"
    return True, "no WebR mentions"


_CORE_R = {
    "base", "utils", "stats", "grDevices", "graphics",
    "methods", "datasets", "tools", "compiler", "parallel",
    "splines", "tcltk", "grid",
}


def check_libraries_loaded(fm, body, ctx):
    blocks = re.findall(r"```r[^\n]*\n(.*?)\n```", body, re.DOTALL)
    if not blocks:
        return True, "no R blocks"
    full = "\n".join(blocks)
    used = set(re.findall(r"\b([a-z][a-z0-9_.]*)::", full))
    loaded = set(re.findall(r"library\(([a-zA-Z0-9_.]+)\)", full))
    missing = sorted(used - loaded - _CORE_R - {"table"})
    if missing:
        return False, f"namespaced calls without library(): {missing}"
    return True, "all namespaced packages loaded"


def check_what_to_do_next(fm, body, ctx):
    if re.search(r"^##\s+What to do next", body, re.MULTILINE):
        return True, "closing section present"
    return False, "no '## What to do next' closing section"


CHECKS = [
    ("01 frontmatter_complete",   check_frontmatter_complete),
    ("02 post_type_EX",           check_post_type),
    ("03 lead_paragraph",         check_lead_paragraph),
    ("04 no_breakup_table",       check_no_breakup_table),
    ("05 setup_block",            check_setup_block),
    ("06 exercise_count",         check_exercise_count),
    ("07 exercise_titles",        check_exercise_titles),
    ("08 scenarios",              check_scenarios),
    ("09 difficulty_markers",     check_difficulty_markers),
    ("10 difficulty_mix",         check_difficulty_mix),
    ("11 solution_blocks",        check_solution_blocks),
    ("12 explanations",           check_explanations),
    ("13 no_em_dash",             check_no_em_dash),
    ("14 no_webr_mention",        check_no_webr_mention),
    ("15 libraries_loaded",       check_libraries_loaded),
    ("16 what_to_do_next",        check_what_to_do_next),
]


def run_checks(file_path: Path, tier: int | None = None) -> tuple[bool, list, dict]:
    text = file_path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)
    slug = fm.get("slug", file_path.stem)
    if tier is None:
        tier = infer_tier(fm)
    ctx = {
        "exercises": extract_exercises(body),
        "tier": tier,
        "exempt": load_exemptions(slug),
        "slug": slug,
    }
    results = []
    for name, fn in CHECKS:
        try:
            ok, msg = fn(fm, body, ctx)
        except Exception as e:
            ok, msg = False, f"check error: {e}"
        results.append((name, ok, msg))
    all_ok = all(r[1] for r in results)
    return all_ok, results, ctx


def render_text(file_path: Path, results: list, ctx: dict, all_ok: bool) -> str:
    lines = [f"\nQuality check: {file_path.name} (tier {ctx['tier']}, {len(ctx['exercises'])} exercises)"]
    lines.append("-" * 70)
    for name, ok, msg in results:
        marker = "PASS" if ok else "FAIL"
        lines.append(f"  [{marker}] {name:<28} {msg}")
    lines.append("-" * 70)
    passed = sum(1 for r in results if r[1])
    lines.append(f"  Overall: {'PASS' if all_ok else 'FAIL'} ({passed}/{len(results)})")
    return "\n".join(lines)


def render_json(file_path: Path, results: list, ctx: dict, all_ok: bool) -> str:
    return json.dumps({
        "file": str(file_path),
        "slug": ctx["slug"],
        "tier": ctx["tier"],
        "exercises_found": len(ctx["exercises"]),
        "overall_pass": all_ok,
        "checks": [{"name": n, "pass": ok, "message": m} for n, ok, m in results],
        "fail_reasons": [m for n, ok, m in results if not ok],
    }, indent=2)


def main():
    ap = argparse.ArgumentParser(description="Exercise hub quality gate")
    ap.add_argument("path", nargs="?", help="path to exercise markdown")
    ap.add_argument("--all", action="store_true", help="run on every EX post in posts/")
    ap.add_argument("--tier", type=int, choices=[1, 2, 3], help="override tier (else inferred)")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    if args.all:
        files = []
        for f in sorted(POSTS_DIR.glob("*.md")):
            text = f.read_text(encoding="utf-8")
            fm, _ = parse_frontmatter(text)
            if fm.get("post_type") == "EX":
                files.append(f)
    elif args.path:
        files = [Path(args.path)]
        if not files[0].exists():
            print(f"File not found: {args.path}", file=sys.stderr)
            sys.exit(2)
    else:
        ap.error("provide a path or --all")

    overall_ok = True
    for f in files:
        all_ok, results, ctx = run_checks(f, args.tier)
        if not all_ok:
            overall_ok = False
        if args.json:
            print(render_json(f, results, ctx, all_ok))
        else:
            print(render_text(f, results, ctx, all_ok))

    sys.exit(0 if overall_ok else 1)


if __name__ == "__main__":
    main()

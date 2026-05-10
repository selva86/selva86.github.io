#!/usr/bin/env python3
"""
PSEO post quality gate.

Reads a PSEO markdown post and runs deterministic checks defined in
_build/pseo-formatting.md. Exit code 0 if all pass, 1 if any fail.

Usage:
  python Scripts/pseo_quality_check.py posts/<slug>.md
  python Scripts/pseo_quality_check.py --all
  python Scripts/pseo_quality_check.py --json posts/<slug>.md   # machine output
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parent.parent  # selva86.github.io/
POSTS_DIR = ROOT / "posts"
LINKS_JSON = ROOT / "www" / "links.json"

REQUIRED_FRONTMATTER = [
    "title", "slug", "description", "keywords", "mathjax", "webr", "date",
    "post_type", "category_id", "subcategory_id", "fr_parent",
    "auto_link_terms", "target_keyword", "sibling_block_enabled", "difficulty"
]

CALLOUT_TYPES = ("[TIP]", "[WARNING]", "[NOTE]", "[KEY INSIGHT]")


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


def prose_word_count(body: str) -> int:
    no_code = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
    no_inline = re.sub(r"`[^`]+`", "", no_code)
    no_html = re.sub(r"<[^>]+>", "", no_inline)
    return len(no_html.split())


def check_word_count(fm, body):
    n = prose_word_count(body)
    if 800 <= n <= 1500:
        return True, f"{n} (within 800-1500)"
    return False, f"{n} (outside 800-1500)"


def check_code_blocks(fm, body):
    blocks = re.findall(r"```r(?:\s+title=\"[^\"]+\")?\s*\n", body)
    titles = re.findall(r"```r\s+title=\"[^\"]+\"", body)
    if len(blocks) < 1:
        return False, "0 R code blocks (need >=1)"
    if len(titles) < len(blocks):
        return False, f"{len(blocks)} blocks, only {len(titles)} have title= attribute"
    return True, f"{len(blocks)} R code blocks, all titled"


def check_visual(fm, body):
    has_table = bool(re.search(r"^\|.+\|.+\|", body, re.MULTILINE))
    has_image = bool(re.search(r"!\[[^\]]*\]\([^)]+\)", body))
    has_mermaid = "```mermaid" in body
    if has_table or has_image or has_mermaid:
        bits = []
        if has_table: bits.append("table")
        if has_image: bits.append("image")
        if has_mermaid: bits.append("mermaid")
        return True, ", ".join(bits)
    return False, "no table/image/mermaid found"


def check_internal_links(fm, body):
    terms = (fm.get("auto_link_terms") or "").split("|")
    terms = [t.strip() for t in terms if t.strip()]
    if len(terms) >= 5:
        return True, f"{len(terms)} auto_link_terms registered"
    return False, f"{len(terms)} terms (need >=5)"


def check_faq(fm, body):
    has_faq_heading = bool(re.search(r"^##\s+FAQ", body, re.MULTILINE))
    if not has_faq_heading:
        return False, "no '## FAQ' section found"
    faq_block = body.split("## FAQ", 1)[1] if "## FAQ" in body else ""
    questions = re.findall(r"\*\*[^*]+\?\*\*", faq_block)
    if len(questions) >= 3:
        return True, f"FAQ with {len(questions)} questions"
    return False, f"FAQ has only {len(questions)} questions (need >=3)"


def check_em_dash(fm, body):
    count = body.count("—")
    if count == 0:
        return True, "0 em-dashes"
    return False, f"{count} em-dashes found (must be 0)"


def check_frontmatter_complete(fm, body):
    missing = [f for f in REQUIRED_FRONTMATTER if f not in fm]
    if not missing:
        return True, "all 16 fields present"
    return False, f"missing: {', '.join(missing)}"


def check_title_length(fm, body):
    title = fm.get("title", "")
    n = len(title)
    if n <= 60:
        return True, f"{n} chars"
    return False, f"{n} chars (must be <=60)"


def check_meta_length(fm, body):
    desc = fm.get("description", "")
    n = len(desc)
    if 150 <= n <= 160:
        return True, f"{n} chars"
    return False, f"{n} chars (need 150-160)"


def check_parent_exists(fm, body):
    parent = fm.get("fr_parent", "")
    if not parent:
        return False, "fr_parent missing"
    p = ROOT / parent
    if p.exists():
        return True, f"{parent} resolves"
    return False, f"{parent} not found at site root"


def check_slug_match(fm, body, file_path):
    fm_slug = fm.get("slug", "")
    file_slug = Path(file_path).stem
    if fm_slug == file_slug:
        return True, f"{fm_slug}"
    return False, f"frontmatter={fm_slug} vs filename={file_slug}"


def check_callouts(fm, body):
    count = sum(body.count(c) for c in CALLOUT_TYPES)
    n_words = prose_word_count(body)
    target_min = max(2, n_words // 600)
    target_max = max(4, n_words // 300)
    if target_min <= count <= target_max:
        return True, f"{count} callouts (target {target_min}-{target_max} for {n_words}w)"
    if count == 0:
        return False, f"0 callouts (need >=2 per pseo-formatting.md rule 3)"
    if count < target_min:
        return False, f"{count} callouts (need >={target_min} for {n_words}w)"
    return False, f"{count} callouts (over {target_max} max for {n_words}w; risk of overuse)"


def check_bold_leads(fm, body):
    """Check H2 sections have a bolded lead. H3 numbered example sub-sections (e.g. '### 1.', '### 2.') are exempt."""
    sections = re.split(r"^(#{2,3}\s+.*)$", body, flags=re.MULTILINE)
    failures = []
    for i in range(1, len(sections), 2):
        heading = sections[i].strip()
        content = sections[i + 1] if i + 1 < len(sections) else ""
        # Skip tail sections (FAQ, Related, Pitfalls) and example sub-sections
        if heading.startswith("## FAQ"):
            continue
        if heading.startswith("## Related") or heading.startswith("## Common pitfalls"):
            continue
        # Skip numbered H3 example sub-sections like "### 1. Pick columns by name"
        if re.match(r"^###\s+\d+\.", heading):
            continue
        first_para = ""
        for para in content.split("\n\n"):
            para = para.strip()
            if not para:
                continue
            if para.startswith("```") or para.startswith("|") or para.startswith("[") or para.startswith("- ") or para.startswith("1. "):
                continue
            first_para = para
            break
        if first_para and not first_para.startswith("**"):
            failures.append(heading[:60])
    if not failures:
        return True, "all H2 openers have bold leads"
    return False, f"{len(failures)} sections lack bold lead: {', '.join(failures[:3])}"


def check_no_nested_deep(fm, body):
    for line in body.splitlines():
        m = re.match(r"^(\s+)[\-\*]\s", line)
        if m and len(m.group(1)) > 4:
            return False, f"line indented > 4 spaces: {line.strip()[:50]}"
    return True, "no >1-level nesting"


def check_quick_answer(fm, body):
    """function-deep PSEO must have a [QUICK ANSWER] block. Other categories: optional."""
    cat = (fm.get("category_id") or "").strip()
    has_qa = "[QUICK ANSWER]" in body
    if cat == "function-deep":
        if has_qa:
            return True, "[QUICK ANSWER] present"
        return False, "function-deep PSEO must have a [QUICK ANSWER] block"
    if cat in ("cookbook-recipe", "chart-type"):
        if has_qa:
            return True, "[QUICK ANSWER] present (recommended)"
        return True, "no [QUICK ANSWER] (optional for this category)"
    return True, "n/a for this category"


def check_decision_tree(fm, body):
    """Decision tree is recommended for function-deep PSEO with branching usage."""
    cat = (fm.get("category_id") or "").strip()
    has_dt = re.search(r"\[DECISION TREE:", body) is not None
    if cat == "function-deep":
        if has_dt:
            return True, "[DECISION TREE] present"
        return True, "no [DECISION TREE] (recommended but not required)"
    return True, "n/a for this category"


def check_tryit_exercise(fm, body):
    """function-deep PSEO must have ## Try it yourself H2 + **Try it:** block + collapsible solution."""
    cat = (fm.get("category_id") or "").strip()
    has_h2 = bool(re.search(r"^##\s+Try it yourself\s*$", body, re.MULTILINE))
    has_prompt = "**Try it:**" in body
    has_details = "<details>" in body and "Click to reveal solution" in body
    if cat == "function-deep":
        if has_h2 and has_prompt and has_details:
            return True, "Try it section + prompt + collapsible solution present"
        missing = []
        if not has_h2: missing.append("## Try it yourself H2")
        if not has_prompt: missing.append("**Try it:** prompt")
        if not has_details: missing.append("collapsible solution")
        return False, f"missing: {', '.join(missing)}"
    return True, "n/a for this category"


def check_auto_link_safety(fm, body):
    """Lightweight check: warn if any auto_link_term is a 2-3 letter all-caps abbrev with case_sensitive=false."""
    case_sensitive = (fm.get("auto_link_case_sensitive", "false").lower() == "true")
    terms = (fm.get("auto_link_terms") or "").split("|")
    risky = [t for t in terms if t.strip() and re.match(r"^[A-Z]{2,4}$", t.strip())]
    if risky and not case_sensitive:
        return False, f"all-caps abbrev terms with case_sensitive=false: {risky}"
    return True, "safe"


CHECKS = [
    ("01 word_count",            check_word_count),
    ("02 code_blocks",           check_code_blocks),
    ("03 visual_present",        check_visual),
    ("04 internal_link_terms",   check_internal_links),
    ("05 faq_section",           check_faq),
    ("06 em_dash_clean",         check_em_dash),
    ("07 frontmatter_complete",  check_frontmatter_complete),
    ("08 title_length",          check_title_length),
    ("09 meta_length",           check_meta_length),
    ("10 parent_exists",         check_parent_exists),
    ("11 slug_match",            None),
    ("12 callouts_present",      check_callouts),
    ("13 bold_leads",            check_bold_leads),
    ("14 no_deep_nesting",       check_no_nested_deep),
    ("15 auto_link_safety",      check_auto_link_safety),
    ("16 quick_answer_block",    check_quick_answer),
    ("17 decision_tree_block",   check_decision_tree),
    ("18 tryit_exercise",        check_tryit_exercise),
]


def run_checks(file_path: Path) -> tuple[bool, list]:
    text = file_path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)
    results = []
    for name, fn in CHECKS:
        if fn is None:
            ok, msg = check_slug_match(fm, body, file_path)
        else:
            try:
                ok, msg = fn(fm, body)
            except Exception as e:
                ok, msg = False, f"check error: {e}"
        results.append((name, ok, msg))
    all_ok = all(r[1] for r in results)
    return all_ok, results


def render_text(file_path: Path, results: list, all_ok: bool) -> str:
    lines = [f"\nQuality check: {file_path.name}"]
    lines.append("-" * 60)
    for name, ok, msg in results:
        marker = "PASS" if ok else "FAIL"
        lines.append(f"  [{marker}] {name:<28} {msg}")
    lines.append("-" * 60)
    lines.append(f"  Overall: {'PASS' if all_ok else 'FAIL'} ({sum(1 for r in results if r[1])}/{len(results)})")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", help="path to a PSEO markdown file")
    ap.add_argument("--all", action="store_true", help="run on every PSEO post in posts/")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    if args.all:
        files = []
        for f in sorted(POSTS_DIR.glob("*.md")):
            text = f.read_text(encoding="utf-8")
            fm, _ = parse_frontmatter(text)
            if fm.get("post_type") == "PSEO":
                files.append(f)
    elif args.path:
        files = [Path(args.path)]
    else:
        ap.error("provide a path or --all")

    overall_ok = True
    json_out = []
    for f in files:
        ok, results = run_checks(f)
        if not ok:
            overall_ok = False
        if args.json:
            json_out.append({
                "file": str(f),
                "ok": ok,
                "results": [{"check": n, "ok": o, "message": m} for n, o, m in results]
            })
        else:
            print(render_text(f, results, ok))

    if args.json:
        print(json.dumps(json_out, indent=2, ensure_ascii=False))

    sys.exit(0 if overall_ok else 1)


if __name__ == "__main__":
    main()

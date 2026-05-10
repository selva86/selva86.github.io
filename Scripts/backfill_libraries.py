#!/usr/bin/env python3
"""
backfill_libraries.py - Ensure every pkg::fn() call has a matching library(pkg).

Scans posts/<slug>.md and _posts/<slug>.html. For each R code block, finds
namespaced calls like tidyr::pivot_longer and verifies a library(tidyr) exists
somewhere in the post. If missing, injects library(pkg) right after the first
existing library() call (or at the top of the first code block if none).

Usage:
  python Scripts/backfill_libraries.py             # fix all posts
  python Scripts/backfill_libraries.py --dry-run   # report only
  python Scripts/backfill_libraries.py --post slug # one slug
"""

import argparse
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = PROJECT_ROOT / "posts"
FRAGMENTS_DIR = PROJECT_ROOT / "_posts"

# Core R packages that don't need library() in WebR
CORE_R = {
    "base", "utils", "stats", "grDevices", "graphics",
    "methods", "datasets", "tools", "compiler", "parallel",
    "splines", "tcltk", "grid",
}

# Things that look like pkg:: but aren't real packages we should auto-inject
SKIP_NAMESPACES = CORE_R | {"table"}  # data.table::table edge case, etc.

CODE_BLOCK_RE = re.compile(r"```r[^\n]*\n(.*?)\n```", re.DOTALL)
NAMESPACE_RE = re.compile(r"\b([a-z][a-z0-9_.]*)::")
LIBRARY_RE = re.compile(r"library\(([a-zA-Z0-9_.]+)\)")


def find_namespaced_pkgs(text):
    """All pkg:: calls in R code blocks, excluding core R."""
    pkgs = set()
    for block in CODE_BLOCK_RE.findall(text):
        for m in NAMESPACE_RE.findall(block):
            if m not in SKIP_NAMESPACES:
                pkgs.add(m)
    return pkgs


def find_loaded_pkgs(text):
    """All library() calls in R code blocks."""
    loaded = set()
    for block in CODE_BLOCK_RE.findall(text):
        for m in LIBRARY_RE.findall(block):
            loaded.add(m)
    return loaded


def inject_libraries(text, missing_pkgs):
    """Inject library(pkg) calls into the first R code block.

    Strategy: find the first ```r block. If it already has library() calls,
    insert new ones right after the last one. Otherwise insert at the top.
    """
    if not missing_pkgs:
        return text

    inj = "\n".join(f"library({p})" for p in sorted(missing_pkgs))

    # Find the first ```r block
    m = re.search(r"(```r[^\n]*\n)(.*?)(\n```)", text, re.DOTALL)
    if not m:
        return text  # no code block to inject into

    head, body, tail = m.group(1), m.group(2), m.group(3)

    # If body already has library() calls, insert after the last one
    lib_matches = list(re.finditer(r"^library\([^)]+\)\s*$", body, re.MULTILINE))
    if lib_matches:
        last = lib_matches[-1]
        new_body = body[: last.end()] + "\n" + inj + body[last.end():]
    else:
        # No library() yet; prepend
        new_body = inj + "\n" + body

    return text[: m.start()] + head + new_body + tail + text[m.end():]


def fix_post(md_path, dry_run=False):
    """Returns (changed: bool, missing_pkgs: list)."""
    text = md_path.read_text(encoding="utf-8")
    used = find_namespaced_pkgs(text)
    loaded = find_loaded_pkgs(text)
    missing = used - loaded

    if not missing:
        return False, []

    if dry_run:
        return True, sorted(missing)

    new_text = inject_libraries(text, missing)
    if new_text != text:
        md_path.write_text(new_text, encoding="utf-8")
        return True, sorted(missing)
    return False, []


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--post", help="single slug to fix")
    args = p.parse_args()

    if args.post:
        targets = [POSTS_DIR / f"{args.post}.md"]
    else:
        targets = sorted(POSTS_DIR.glob("*.md"))

    fixed = 0
    for path in targets:
        if not path.exists():
            print(f"  skip (no file): {path.name}")
            continue
        changed, missing = fix_post(path, dry_run=args.dry_run)
        if changed:
            fixed += 1
            verb = "would inject" if args.dry_run else "injected"
            print(f"  {path.name}: {verb} library({', '.join(missing)})")

    summary = "Would fix" if args.dry_run else "Fixed"
    print(f"\n{summary} {fixed} post(s) of {len(targets)} scanned")


if __name__ == "__main__":
    main()

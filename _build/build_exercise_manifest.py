#!/usr/bin/env python3
"""
Scan _posts/*.html for sections with class="exercise" and emit a manifest
keyed by hub_slug → exercise_id → difficulty.

Output: functions/_data/exercise-manifest.json (bundled into CF Pages Functions)

Server uses the manifest to:
  - Validate (hub_slug, exercise_id) on every /api/exercise/.../attempt
  - Look up difficulty so XP can't be inflated by a tampered client

Run via build_with_pagefind.py (CI), or directly:
  python _build/build_exercise_manifest.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = REPO_ROOT / "_posts"
# Interactive lesson fragments live in a parallel source dir. Their gradable
# steps emit the same <section class="exercise"> contract, so they must be
# scanned too or every lesson quiz/try-it POST is rejected (hub unknown).
LESSONS_DIR = REPO_ROOT / "_lessons"
OUT_PATH = REPO_ROOT / "functions" / "_data" / "exercise-manifest.json"

# Same map as www/exercise-hub.js XP_BY_DIFF — duplicated server-side as the
# defensive SSOT (a tampered client cannot inflate XP). If you ever change
# the values here, also change them in www/exercise-hub.js and vice versa.
XP_BY_DIFF = {"beginner": 10, "intermediate": 25, "advanced": 50}

# Tolerate either single or double quotes in the source HTML.
SECTION_RE = re.compile(
    r'<section\s+[^>]*\bclass=["\']exercise["\'][^>]*>',
    re.IGNORECASE,
)
ATTR_ID_RE = re.compile(r'\bdata-exercise-id=["\']([^"\']+)["\']', re.IGNORECASE)
ATTR_DIFF_RE = re.compile(r'\bdata-difficulty=["\']([^"\']+)["\']', re.IGNORECASE)

# Hard limits — same as server-side validation will enforce.
MAX_EXERCISE_ID_LEN = 64
ALLOWED_DIFFICULTIES = set(XP_BY_DIFF.keys())


def hub_slug_from_path(post_path: Path) -> str:
    """`_posts/foo.html` -> `foo`."""
    return post_path.stem


def extract_exercises(html: str) -> list[tuple[str, str]]:
    """Return list of (exercise_id, normalized_difficulty) from one HTML fragment.

    Silently drops sections with missing or oversized exercise_id; defaults
    unknown / empty difficulty to 'beginner' to match exercise-hub.js
    xpWeight() fallback.
    """
    out: list[tuple[str, str]] = []
    for match in SECTION_RE.finditer(html):
        tag = match.group(0)
        id_m = ATTR_ID_RE.search(tag)
        if not id_m:
            continue
        exercise_id = id_m.group(1).strip()
        if not exercise_id or len(exercise_id) > MAX_EXERCISE_ID_LEN:
            continue
        diff_m = ATTR_DIFF_RE.search(tag)
        difficulty = (diff_m.group(1) if diff_m else "").strip().lower()
        if difficulty not in ALLOWED_DIFFICULTIES:
            # Mirror exercise-hub.js xpWeight() default behaviour.
            difficulty = "beginner"
        out.append((exercise_id, difficulty))
    return out


def build_manifest() -> dict:
    if not POSTS_DIR.is_dir():
        raise SystemExit(f"_posts directory not found at {POSTS_DIR}")

    hubs: dict[str, dict[str, str]] = {}
    # Hubs sourced from _lessons/. The practice meter must NEVER count lesson
    # attempts (Plans/free-user-onboarding-plan.md s4 rule 1): lesson gated
    # checks post to the same attempt endpoint as practice hubs, so without
    # this set the meter would gate the free tracks and the DA pass.
    lesson_hubs: set[str] = set()
    counts = {"hubs": 0, "exercises": 0, "skipped_dup_ids": 0}
    scan_paths = sorted(POSTS_DIR.glob("*.html"))
    if LESSONS_DIR.is_dir():
        lesson_paths = sorted(LESSONS_DIR.glob("*.html"))
        lesson_hubs = {p.stem for p in lesson_paths}
        scan_paths += lesson_paths
    for post_path in scan_paths:
        try:
            html = post_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            html = post_path.read_text(encoding="utf-8", errors="replace")
        exercises = extract_exercises(html)
        if not exercises:
            continue
        hub_slug = hub_slug_from_path(post_path)
        per_hub: dict[str, str] = {}
        for ex_id, diff in exercises:
            if ex_id in per_hub:
                counts["skipped_dup_ids"] += 1
                # Keep the first occurrence; ignore later duplicates so the
                # server picks the same difficulty the page renders first.
                continue
            per_hub[ex_id] = diff
        if per_hub:
            hubs[hub_slug] = per_hub
            counts["hubs"] += 1
            counts["exercises"] += len(per_hub)

    return {
        "version": 1,
        "xp_by_difficulty": XP_BY_DIFF,
        "hubs": hubs,
        # Only slugs that actually carry exercises AND came from _lessons/.
        "lesson_hubs": sorted(h for h in lesson_hubs if h in hubs),
        "_meta": counts,
    }


def main() -> int:
    manifest = build_manifest()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    meta = manifest["_meta"]
    size_kb = OUT_PATH.stat().st_size / 1024
    print(
        f"[exercise-manifest] {meta['hubs']} hubs, {meta['exercises']} exercises, "
        f"{meta['skipped_dup_ids']} dup ids skipped, "
        f"{size_kb:.1f} KB -> {OUT_PATH.relative_to(REPO_ROOT)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

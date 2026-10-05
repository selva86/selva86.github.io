#!/usr/bin/env python3
"""
Build the runtime certificate manifest (functions/_data/tracks.json).

One certificate per roadmap track (owner decision 2026-10-05). Inputs:
  - _build/tracks-source.json              hand-authored: names, codes, open/free
  - courses.json                           the lesson catalog (roadmap.track per course)
  - functions/_data/exercise-manifest.json graded checks per lesson slug (build-time)

For each track, every published lesson (built != false) of its roadmap track
becomes a "hub" whose total is the number of graded checks in that lesson.
Eligibility at runtime = solved checks / total checks >= threshold.

Runs in the Cloudflare build right after build_exercise_manifest.py
(_build/build_with_pagefind.py), so a newly published lesson raises its
track's total on the next deploy with no manual step.

Fails the build (non-zero exit) on an unknown roadmap track, or an open
track with no graded checks, so a broken certificate never ships.

  python _build/build_tracks_manifest.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = REPO_ROOT / "_build" / "tracks-source.json"
CATALOG_PATH = REPO_ROOT / "courses.json"
EX_MANIFEST_PATH = REPO_ROOT / "functions" / "_data" / "exercise-manifest.json"
OUT_PATH = REPO_ROOT / "functions" / "_data" / "tracks.json"

# Certificate palette (2026-10 design): deep green + brand green.
COLOR_PRIMARY = "#0F3F2A"
COLOR_ACCENT = "#1F6B4A"


def lessons_by_track(catalog: dict) -> dict[str, list[dict]]:
    """Published lessons per roadmap track, in roadmap order (section, course, lesson)."""
    courses = catalog.get("courses", catalog) if isinstance(catalog, dict) else catalog
    rows: dict[str, list[tuple]] = {}
    for ci, c in enumerate(courses):
        rm = c.get("roadmap") or {}
        track = rm.get("track")
        if not track:
            continue
        for li, lesson in enumerate(c.get("lessons", [])):
            if lesson.get("built") is False or not lesson.get("slug"):
                continue
            key = (int(rm.get("section") or 0), ci, int(lesson.get("order") or li))
            rows.setdefault(track, []).append((key, int(rm.get("section") or 0), lesson))
    return {t: [{"section": s, **l} for _, s, l in sorted(v, key=lambda r: r[0])] for t, v in rows.items()}


def main() -> int:
    for p in (SRC_PATH, CATALOG_PATH, EX_MANIFEST_PATH):
        if not p.is_file():
            print(f"[tracks-manifest] missing input: {p}", file=sys.stderr)
            return 1

    src = json.loads(SRC_PATH.read_text(encoding="utf-8"))
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    ex_hubs = json.loads(EX_MANIFEST_PATH.read_text(encoding="utf-8")).get("hubs", {})
    by_track = lessons_by_track(catalog)

    threshold_default = float(src.get("threshold_default", 0.8))
    xp_award = int(src.get("xp_award", 200))

    errors: list[str] = []
    out_tracks = []
    for t in src.get("tracks", []):
        tid, rt = t["id"], t.get("roadmap_track")
        if rt not in by_track and t.get("open"):
            errors.append(f"track '{tid}': open, but roadmap track '{rt}' has no published lessons")
            continue
        lessons = by_track.get(rt, [])
        hubs, total = [], 0
        for lesson in lessons:
            n = len(ex_hubs.get(lesson["slug"], {}))
            if not n:
                continue  # a lesson with no graded checks adds nothing to the bar
            hubs.append({"slug": lesson["slug"], "url": "/" + lesson["slug"] + ".html", "total": n})
            total += n
        if t.get("open") and not total:
            errors.append(f"track '{tid}': open, but its lessons carry no graded checks")
            continue
        out_tracks.append({
            "id": tid,
            "roadmap_track": rt,
            "roadmap_url": t.get("roadmap_url", "/roadmap/"),
            "name": t["name"],
            "code": t["code"],
            "mastery": t["mastery"],
            "free": bool(t.get("free", False)),
            "open": bool(t.get("open", False)),
            "tagline": t.get("tagline", ""),
            "description": t.get("description", ""),
            "color_primary": COLOR_PRIMARY,
            "color_accent": COLOR_ACCENT,
            "icon": t["code"],
            "skills": t.get("skills", []),
            "threshold": float(t.get("threshold", threshold_default)),
            "xp_award": int(t.get("xp_award", xp_award)),
            "lessons": len(lessons),
            "sections": len({l["section"] for l in lessons}),
            "total_exercises": total,
            "hubs": hubs,
        })

    if errors:
        for e in errors:
            print(f"[tracks-manifest] ERROR {e}", file=sys.stderr)
        return 2

    out = {
        "version": 2,
        "issuer": src.get("issuer", {}),
        "threshold_default": threshold_default,
        "xp_award": xp_award,
        "tracks": out_tracks,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    summary = ", ".join(f"{t['id']} {t['lessons']}L/{t['total_exercises']}c{'' if t['open'] else ' closed'}" for t in out_tracks)
    print(f"[tracks-manifest] {len(out_tracks)} certificates: {summary} -> {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

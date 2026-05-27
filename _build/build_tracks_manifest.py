#!/usr/bin/env python3
"""
Combine the hand-authored tracks-source.json with the build-time exercise
manifest (functions/_data/exercise-manifest.json) to produce the runtime
tracks manifest at functions/_data/tracks.json.

For each track:
  - Validate every listed hub_slug exists in the exercise manifest.
  - Resolve the total exercise count per hub so the runtime can compute
    eligibility percentages without re-scanning the exercise manifest.
  - Carry through display fields (name, tagline, colors, skills, etc.).

Fails the build (non-zero exit) if any track references an unknown hub
so missing-hub typos are caught at build time, not at user mint time.

Run after build_exercise_manifest.py, or directly:
  python _build/build_tracks_manifest.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = REPO_ROOT / "_build" / "tracks-source.json"
EX_MANIFEST_PATH = REPO_ROOT / "functions" / "_data" / "exercise-manifest.json"
OUT_PATH = REPO_ROOT / "functions" / "_data" / "tracks.json"


def slug_from_url_filename(name: str) -> str:
    """`dplyr-Exercises-in-R.html` -> `dplyr-Exercises-in-R`."""
    return name[:-5] if name.endswith(".html") else name


def main() -> int:
    if not SRC_PATH.is_file():
        print(f"[tracks-manifest] source missing: {SRC_PATH}", file=sys.stderr)
        return 1
    if not EX_MANIFEST_PATH.is_file():
        print(
            f"[tracks-manifest] exercise manifest missing: {EX_MANIFEST_PATH}\n"
            "  Run python _build/build_exercise_manifest.py first.",
            file=sys.stderr,
        )
        return 1

    src = json.loads(SRC_PATH.read_text(encoding="utf-8"))
    ex_manifest = json.loads(EX_MANIFEST_PATH.read_text(encoding="utf-8"))
    ex_hubs = ex_manifest.get("hubs", {})

    threshold_default = float(src.get("threshold_default", 0.8))
    xp_award = int(src.get("xp_award", 200))

    errors: list[str] = []
    out_tracks = []
    for t in src.get("tracks", []):
        track_id = t["id"]
        track_hubs = []
        total_exercises = 0
        for hub_filename in t.get("hubs", []):
            slug = slug_from_url_filename(hub_filename)
            if slug not in ex_hubs:
                errors.append(f"track '{track_id}': unknown hub '{slug}'")
                continue
            exercises = list(ex_hubs[slug].keys())
            total_exercises += len(exercises)
            track_hubs.append({
                "slug": slug,
                "url": "/" + hub_filename,
                "total": len(exercises),
            })
        if not track_hubs:
            errors.append(f"track '{track_id}': no resolvable hubs")
            continue
        out_tracks.append({
            "id": track_id,
            "name": t["name"],
            "tagline": t.get("tagline", ""),
            "description": t.get("description", ""),
            "color_primary": t.get("color_primary", "#1c2c4f"),
            "color_accent": t.get("color_accent", "#2056d2"),
            "icon": t.get("icon", "R"),
            "skills": t.get("skills", []),
            "threshold": float(t.get("threshold", threshold_default)),
            "xp_award": int(t.get("xp_award", xp_award)),
            "total_exercises": total_exercises,
            "hubs": track_hubs,
        })

    if errors:
        for e in errors:
            print(f"[tracks-manifest] ERROR {e}", file=sys.stderr)
        return 2

    out = {
        "version": 1,
        "issuer": src.get("issuer", {}),
        "threshold_default": threshold_default,
        "xp_award": xp_award,
        "tracks": out_tracks,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(out, ensure_ascii=False, indent=2, sort_keys=False),
        encoding="utf-8",
    )
    size_kb = OUT_PATH.stat().st_size / 1024
    print(
        f"[tracks-manifest] {len(out_tracks)} tracks, "
        f"{sum(t['total_exercises'] for t in out_tracks)} qualifying exercises, "
        f"{size_kb:.1f} KB -> {OUT_PATH.relative_to(REPO_ROOT)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

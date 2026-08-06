#!/usr/bin/env python3
"""Wraps the existing _build/build.py and appends a Pagefind index pass.
Used by CF Pages as the build command (see package.json scripts.build).

Pagefind indexes every HTML at site root + tools/, produces /pagefind/*.js
that the search bar loads at runtime. Re-indexes on every deploy. No server.

Local install: `npm install -g pagefind` OR `npx pagefind --site .`
CF Pages: pagefind is listed in devDependencies so CI installs it during build.
"""
from __future__ import annotations
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(cmd: list[str], cwd: Path = ROOT) -> None:
    print(f"+ {' '.join(cmd)}", flush=True)
    r = subprocess.run(cmd, cwd=str(cwd))
    if r.returncode != 0:
        sys.exit(r.returncode)

def run_advisory(cmd: list[str], cwd: Path = ROOT) -> None:
    """Run a check that must NOT fail the deploy (logs only). Used for the lesson
    quality gate in CI: one bad lesson must never block all ~1,300 pages. The
    HARD gate lives at publish time (/publish-lesson, batch_lessons.py)."""
    print(f"+ (advisory) {' '.join(cmd)}", flush=True)
    try:
        r = subprocess.run(cmd, cwd=str(cwd))
        if r.returncode != 0:
            print(f"  WARNING: advisory check exited {r.returncode}; build continues.", flush=True)
    except Exception as e:
        print(f"  WARNING: advisory check could not run ({e}); build continues.", flush=True)

def main() -> None:
    # 1. Existing static build (HTML pages, sitemap, feed)
    run([sys.executable, "_build/build.py"])

    # 1b. Exercise + lesson grading manifest. Authorizes every (hub, exercise_id)
    # pair for /api/exercise/.../attempt; scans _posts/ AND _lessons/. Runs BEFORE
    # gen_sections (which reads the manifest to build the Exercises landing) and on
    # every deploy, or newly published lesson/exercise step ids get rejected.
    run([sys.executable, "_build/build_exercise_manifest.py"])

    # 1c. v3 standalone section pages (certification/tools/tutorials/exercises/roadmap/topic)
    run([sys.executable, "_build/gen_sections.py"])

    # 1c2. Refresh the public course catalog (/courses.json) from built lessons,
    # so the player rail + catalog stay in sync on every deploy.
    run([sys.executable, "Scripts/build_lessons_tracker.py"])

    # 1c3. Handbook indexes. Runs AFTER build.py so chapter pages exist on disk:
    # the generator links a chapter only when its page is actually present in this
    # checkout and renders it "Soon" otherwise. Regenerating on every deploy is
    # what makes a chapter's link appear the moment it ships, with no second file
    # to update by hand and no window where the index links a page that 404s.
    run([sys.executable, "_build/gen_handbook_index.py", "--tracked"])

    # 1d. Lesson quality gate (ADVISORY): logs blank-slide / R6 failures but never
    # fails the deploy. The HARD, blocking gate runs at publish time.
    run_advisory([sys.executable, "Scripts/lesson_quality_check.py", "--all"])

    # 2. Refresh tools sitemap (mtimes change after content edits)
    run([sys.executable, "Scripts/build_tools_sitemap.py"])

    # 3. Pagefind index
    # --site . indexes the entire root directory.
    # --output-path pagefind keeps the index folder predictable.
    # Use npx so it works whether pagefind is installed globally or via package.json.
    run(["npx", "--yes", "pagefind", "--site", ".", "--output-path", "pagefind"])

    print("Build OK.", flush=True)

if __name__ == "__main__":
    main()

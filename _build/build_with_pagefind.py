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

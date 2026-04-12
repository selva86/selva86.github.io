#!/usr/bin/env python3
"""
Orchestrate sequential post writing via claude CLI.
Each post gets a fresh session. Quality gates run before publishing.

Usage:
    python Scripts/orchestrate.py              # run full queue
    python Scripts/orchestrate.py --one        # process one post and stop
    python Scripts/orchestrate.py --dry-run    # print what would run
    python Scripts/orchestrate.py --start-from 4.3.7
    python Scripts/orchestrate.py --retry-failed
"""

import json
import os
import sys
import glob
import subprocess
import shutil
import tempfile
import time
import platform
from pathlib import Path
from datetime import datetime

# --- Configuration ---
REPO_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = REPO_ROOT.parent  # D:/09_rstatisticsco — where .claude/ lives
QUEUE_FILE = REPO_ROOT / "post_queue.json"
LOG_FILE = REPO_ROOT / "Scripts" / "orchestrate.log"
LOCK_FILE = REPO_ROOT / "Scripts" / "orchestrate.lock"
SESSION_TIMEOUT = 900  # 15 minutes per post


# --- Logging ---
def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


# --- Lock file ---
def acquire_lock():
    if LOCK_FILE.exists():
        pid = LOCK_FILE.read_text().strip()
        log(f"ERROR: Lock file exists (PID {pid}). Another instance running?")
        log(f"If stale, delete {LOCK_FILE} and retry.")
        sys.exit(1)
    LOCK_FILE.write_text(str(os.getpid()))


def release_lock():
    if LOCK_FILE.exists():
        LOCK_FILE.unlink()


# --- Queue I/O (atomic write) ---
def read_queue():
    with open(QUEUE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def write_queue(queue):
    tmp = QUEUE_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)
    tmp.replace(QUEUE_FILE)


# --- Git state check ---
def check_git_clean():
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.stdout.strip():
        log("ERROR: Git working tree is dirty. Commit or stash before running.")
        log(result.stdout.strip())
        return False
    return True


# --- Find claude CLI ---
def find_claude():
    claude = shutil.which("claude")
    if claude:
        return claude
    if platform.system() == "Windows":
        for fallback in ["claude.cmd", "claude.exe"]:
            found = shutil.which(fallback)
            if found:
                return found
    log("ERROR: 'claude' CLI not found in PATH.")
    sys.exit(1)


# --- Quality gate ---
def quality_gate(entry):
    slug = entry["slug"]
    post_type = entry["type"]
    errors = []

    # Gate 1: Plan file exists and is substantial
    plan_path = REPO_ROOT / "post_plans" / f"{slug}_plan.md"
    if not plan_path.exists():
        errors.append(f"Plan file missing: post_plans/{slug}_plan.md")
    elif plan_path.stat().st_size < 500:
        errors.append(
            f"Plan file too small ({plan_path.stat().st_size} bytes): "
            f"post_plans/{slug}_plan.md"
        )

    # Gate 2: Diagrams (C posts only — at least 1 .webp referenced in markdown)
    if post_type == "C":
        diagram_pattern = str(REPO_ROOT / "screenshots" / f"{slug}-*.webp")
        diagram_files = glob.glob(diagram_pattern)
        if len(diagram_files) == 0:
            errors.append(f"No diagrams found: screenshots/{slug}-*.webp")
        else:
            md_path = REPO_ROOT / "posts" / f"{slug}.md"
            if md_path.exists():
                md_text = md_path.read_text(encoding="utf-8")
                any_referenced = False
                for df in diagram_files:
                    fname = os.path.basename(df)
                    if fname in md_text:
                        any_referenced = True
                        break
                if not any_referenced:
                    errors.append(
                        f"Diagrams exist in screenshots/ but none referenced "
                        f"in posts/{slug}.md"
                    )
            else:
                errors.append(f"Markdown file missing: posts/{slug}.md")

    # Gate 3: Core build artifacts exist (catches crashed sessions)
    if not (REPO_ROOT / "posts" / f"{slug}.md").exists():
        errors.append(f"Markdown missing: posts/{slug}.md")
    if not (REPO_ROOT / "_posts" / f"{slug}.html").exists():
        errors.append(f"HTML fragment missing: _posts/{slug}.html")
    if not (REPO_ROOT / f"{slug}.html").exists():
        errors.append(f"Built page missing: {slug}.html")

    return errors


# --- Publish (runs only after quality gate passes) ---
def publish(entry):
    slug = entry["slug"]
    post_id = entry["id"]
    title = entry["title"]

    # sync_registries
    result = subprocess.run(
        ["python", "_build/sync_registries.py", f"posts/{slug}.md"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.returncode != 0:
        return f"sync_registries failed: {result.stderr.strip()}"
    log(f"  sync_registries: {result.stdout.strip()}")

    # git add
    result = subprocess.run(
        ["git", "add", "-A", "posts/", "_posts/", "post_plans/",
         "screenshots/", "sitemap.xml", "feed.xml", "www/"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    # Also add any built .html files at root
    subprocess.run(
        ["git", "add", f"{slug}.html"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )

    # git commit
    result = subprocess.run(
        ["git", "commit", "-m", f"Publish {post_id}: {title}"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.returncode != 0:
        # Check if "nothing to commit"
        if "nothing to commit" in result.stdout:
            log("  Nothing new to commit (already committed by dry-run?)")
        else:
            return f"git commit failed: {result.stderr.strip()}"
    else:
        log(f"  commit: {result.stdout.strip().splitlines()[-1]}")

    # git push
    result = subprocess.run(
        ["git", "push"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.returncode != 0:
        return f"git push failed: {result.stderr.strip()}"
    log(f"  push: done")

    return None  # success


# --- Main loop ---
def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Orchestrate post writing pipeline"
    )
    parser.add_argument(
        "--one", action="store_true",
        help="Process one post and stop"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would run without executing"
    )
    parser.add_argument(
        "--start-from", type=str,
        help="Skip to this post ID"
    )
    parser.add_argument(
        "--retry-failed", action="store_true",
        help="Retry posts that failed quality gate"
    )
    parser.add_argument(
        "--post", type=str,
        help="Process a specific post ID only (e.g. --post 4.3.1)"
    )
    args = parser.parse_args()

    claude = find_claude()
    queue = read_queue()

    if not args.dry_run:
        acquire_lock()
        if not check_git_clean():
            release_lock()
            sys.exit(1)

    try:
        started = False if args.start_from else True

        for entry in queue:
            # --post: only process this specific ID
            if args.post:
                if entry["id"] != args.post:
                    continue
                # Reset so it runs even if previously done
                entry["done"] = False
                entry["attempts"] = 0
                entry["last_error"] = None

            # --start-from: skip until we find the target ID
            if args.start_from and not started:
                if entry["id"] == args.start_from:
                    started = True
                else:
                    continue

            # --retry-failed: reset failed entries
            if args.retry_failed:
                if not (entry.get("done") and not entry.get("quality_passed", True)):
                    continue
                entry["done"] = False
                entry["attempts"] = 0
                entry["last_error"] = None

            if entry["done"]:
                continue

            slug = entry["slug"]
            post_id = entry["id"]
            post_type = entry["type"]
            title = entry["title"]

            log(f"{'='*60}")
            log(f"Starting {post_id}: {title}")
            log(f"  Type: {post_type}, Slug: {slug}, Attempt: {entry['attempts'] + 1}")

            # Build prompt
            rewrite_note = (
                "Do a complete rewrite even if already published. "
                "Ignore existing content. "
            ) if entry.get("rewrite") else ""

            prompt = (
                f"/write-and-publish-v2 {post_id} | {post_type} | {title}. "
                f"{rewrite_note}"
                f"Keep title and slug as in curriculum. --dry-run"
            )

            if args.dry_run:
                log(f"  DRY RUN: claude -p \"{prompt}\" --dangerously-skip-permissions")
                if args.one or args.post:
                    break
                continue

            # Check git is clean before each post
            if not check_git_clean():
                log("  Skipping — git is dirty. Clean up and retry.")
                break

            # Run claude
            log(f"  Running claude session...")
            t0 = time.time()
            try:
                result = subprocess.run(
                    [claude, "-p", prompt, "--dangerously-skip-permissions"],
                    cwd=str(PROJECT_ROOT),
                    timeout=SESSION_TIMEOUT
                )
                exit_code = result.returncode
            except subprocess.TimeoutExpired:
                exit_code = -1
                log(f"  TIMEOUT after {SESSION_TIMEOUT}s")

            elapsed = int(time.time() - t0)
            log(f"  claude exited with code {exit_code} in {elapsed}s")

            if exit_code != 0:
                entry["attempts"] += 1
                entry["last_error"] = f"claude exited with code {exit_code}"
                if entry["attempts"] >= 2:
                    entry["done"] = True
                    entry["quality_passed"] = False
                    log(f"  FAILED (max attempts): {post_id}")
                else:
                    log(f"  Will retry on next run")
                write_queue(queue)
                if args.one or args.post:
                    break
                continue

            # Quality gate
            errors = quality_gate(entry)
            if errors:
                entry["attempts"] += 1
                entry["last_error"] = "; ".join(errors)
                log(f"  QUALITY GATE FAILED:")
                for e in errors:
                    log(f"    - {e}")
                if entry["attempts"] >= 2:
                    entry["done"] = True
                    entry["quality_passed"] = False
                    log(f"  SKIPPING (max attempts): {post_id}")
                else:
                    log(f"  Will retry on next run")
                write_queue(queue)
                if args.one or args.post:
                    break
                continue

            # Publish
            log(f"  Quality gate PASSED. Publishing...")
            pub_error = publish(entry)
            if pub_error:
                entry["attempts"] += 1
                entry["last_error"] = pub_error
                log(f"  PUBLISH FAILED: {pub_error}")
                if entry["attempts"] >= 2:
                    entry["done"] = True
                    entry["quality_passed"] = False
                write_queue(queue)
                if args.one or args.post:
                    break
                continue

            # Success
            entry["done"] = True
            entry["quality_passed"] = True
            entry["last_error"] = None
            write_queue(queue)
            log(f"  SUCCESS: https://r-statistics.co/{slug}.html")

            if args.one or args.post:
                break

    except KeyboardInterrupt:
        log("Interrupted by user. Progress saved.")

    finally:
        if not args.dry_run:
            release_lock()

    # Summary
    done = sum(1 for e in queue if e.get("done"))
    passed = sum(1 for e in queue if e.get("quality_passed"))
    failed = sum(
        1 for e in queue
        if e.get("done") and not e.get("quality_passed", True)
    )
    remaining = sum(1 for e in queue if not e.get("done"))
    log(f"{'='*60}")
    log(
        f"Summary: {done} done ({passed} passed, {failed} failed), "
        f"{remaining} remaining"
    )


if __name__ == "__main__":
    main()

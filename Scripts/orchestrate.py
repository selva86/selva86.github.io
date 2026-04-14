#!/usr/bin/env python3
"""
Orchestrate sequential post writing via claude CLI.
Each post gets a fresh session. Quality gates run before publishing.

Usage:
    python Scripts/orchestrate.py              # run full queue
    python Scripts/orchestrate.py --one        # process one post and stop
    python Scripts/orchestrate.py --count 5    # process 5 posts and stop
    python Scripts/orchestrate.py --dry-run    # print what would run
    python Scripts/orchestrate.py --start-from 4.3.7
    python Scripts/orchestrate.py --start-from 4.3.7 --count 3
    python Scripts/orchestrate.py --retry-failed
    python Scripts/orchestrate.py --post 4.3.1
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
SESSION_TIMEOUT = 3000  # 50 minutes per post
MAX_ATTEMPTS = 2


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


# --- Git helpers ---
def revert_churn_screenshots():
    """Revert tracked-but-modified screenshot webps (non-deterministic mermaid
    regeneration produces binary-different but content-equivalent files).
    The current post's fresh diagrams are staged via publish(), so reverting
    unstaged modifications is safe."""
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    reverted = []
    for line in result.stdout.splitlines():
        # Only unstaged modifications (" M " prefix), only webp screenshots
        if line.startswith(" M ") and line.endswith(".webp") and "screenshots/" in line:
            fpath = line[3:].strip()
            subprocess.run(
                ["git", "checkout", "--", fpath],
                capture_output=True, text=True, cwd=REPO_ROOT
            )
            reverted.append(fpath)
    if reverted:
        log(f"  Reverted {len(reverted)} churn webp(s): {', '.join(reverted)}")


def cleanup_orphan_mermaid_tmps():
    """Remove mermaid temp files that get left behind between sessions."""
    for tmp in glob.glob(str(REPO_ROOT / "_build" / "mermaid" / "tmp*")):
        try:
            os.remove(tmp)
        except OSError:
            pass


def check_git_clean():
    revert_churn_screenshots()
    cleanup_orphan_mermaid_tmps()
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if not result.stdout.strip():
        return True

    # Light cleanup didn't suffice — fall back to the full reset used for
    # failed sessions. Protects against leftover phantom files, mermaid
    # render churn, and any other untracked state in known write dirs.
    log("  Tree dirty — running cleanup_failed_session fallback:")
    log(result.stdout.strip())
    cleanup_failed_session()

    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.stdout.strip():
        log("ERROR: Git working tree still dirty after cleanup. Aborting.")
        log(result.stdout.strip())
        return False
    return True


def git_clean_untracked():
    """Remove untracked files left by a failed/timed-out session."""
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    untracked = []
    for line in result.stdout.strip().splitlines():
        if line.startswith("?? "):
            fpath = line[3:].strip().strip('"')
            untracked.append(fpath)
    if not untracked:
        return
    log(f"  Cleaning {len(untracked)} untracked file(s) from failed session:")
    for f in untracked:
        full = REPO_ROOT / f
        if full.exists():
            full.unlink()
            log(f"    removed: {f}")


def git_checkout_modified():
    """Revert modified files left by a failed/timed-out session."""
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    modified = []
    for line in result.stdout.strip().splitlines():
        if line.startswith(" M ") or line.startswith("M  "):
            fpath = line[3:].strip().strip('"')
            modified.append(fpath)
    if not modified:
        return
    log(f"  Reverting {len(modified)} modified file(s) from failed session:")
    for f in modified:
        subprocess.run(
            ["git", "checkout", "--", f],
            capture_output=True, text=True, cwd=REPO_ROOT
        )
        log(f"    reverted: {f}")


def cleanup_failed_session():
    """Clean up all traces of a failed/timed-out claude session.

    Uses `git reset --hard HEAD` to revert any tracked-file changes
    (staged or unstaged, modified or deleted) followed by a scoped
    `git clean -fd` to remove untracked files from known write locations.
    Robust against any porcelain status code, unlike per-pattern line
    matching which missed edge cases (staged mods, deletions, MM)."""
    subprocess.run(
        ["git", "reset", "--hard", "HEAD"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    clean_dirs = [
        "posts",
        "_posts",
        "post_plans",
        "screenshots",
        "_build/mermaid",
        "www",
    ]
    subprocess.run(
        ["git", "clean", "-fd"] + clean_dirs,
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    # Remove stray root-level untracked .html files from a crashed build.
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    for line in status.stdout.splitlines():
        if line.startswith("?? "):
            path = line[3:].strip().strip('"')
            if "/" not in path and path.endswith(".html"):
                full = REPO_ROOT / path
                if full.exists():
                    full.unlink()
    log("  cleanup_failed_session: tree reset to HEAD, untracked cleaned")


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

    # git add — specific paths only (no -A to avoid stale temp files)
    add_paths = [
        f"posts/{slug}.md",
        f"_posts/{slug}.html",
        f"{slug}.html",
        f"post_plans/{slug}_plan.md",
        "sitemap.xml",
        "feed.xml",
        "www/sidebar.json",
        "www/links.json",
    ]
    # Add diagram files
    for webp in glob.glob(str(REPO_ROOT / "screenshots" / f"{slug}-*.webp")):
        add_paths.append(f"screenshots/{os.path.basename(webp)}")
    # Add mermaid source files
    for mmd in glob.glob(str(REPO_ROOT / "_build" / "mermaid" / f"{slug}-*.mmd")):
        add_paths.append(f"_build/mermaid/{os.path.basename(mmd)}")
    # Add any FR parent fragments that were refreshed
    result = subprocess.run(
        ["git", "diff", "--name-only"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    for line in result.stdout.strip().splitlines():
        if line.startswith("_posts/") and line != f"_posts/{slug}.html":
            add_paths.append(line)

    # Also capture publish side effects that aren't explicitly listed:
    #   - root-level .html files auto-refreshed by sync_registries
    #     (Related Tutorials, date bumps on sibling posts)
    #   - OG images generated for the current post
    #   - www/ assets created by the write/publish pipeline
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    for line in status.stdout.splitlines():
        path = line[3:].strip().strip('"')
        if not path:
            continue
        is_root_html = "/" not in path and path.endswith(".html")
        is_og_image = path.startswith("screenshots/og/")
        is_www_asset = (
            path.startswith("www/")
            and not path.startswith("www/bootstrap")
            and not path.startswith("www/navigation")
        )
        if is_root_html or is_og_image or is_www_asset:
            add_paths.append(path)

    subprocess.run(
        ["git", "add"] + add_paths,
        capture_output=True, text=True, cwd=REPO_ROOT
    )

    # git commit
    result = subprocess.run(
        ["git", "commit", "-m", f"Publish {post_id}: {title}"],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    if result.returncode != 0:
        if "nothing to commit" in result.stdout:
            log("  Nothing new to commit (already committed?)")
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
        "--count", type=int, default=0,
        help="Process N posts and stop (e.g. --count 5)"
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

    # --one is shorthand for --count 1
    if args.one:
        args.count = 1

    claude = find_claude()
    queue = read_queue()

    if not args.dry_run:
        acquire_lock()
        if not check_git_clean():
            release_lock()
            sys.exit(1)

    try:
        started = False if args.start_from else True
        processed = 0

        def should_stop():
            return args.post or (args.count and processed >= args.count)

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
                processed += 1
                if should_stop():
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
                cleanup_failed_session()
                if entry["attempts"] >= MAX_ATTEMPTS:
                    entry["done"] = True
                    entry["quality_passed"] = False
                    log(f"  FAILED (max attempts): {post_id}")
                else:
                    log(f"  Will retry on next run")
                write_queue(queue)
                processed += 1
                if should_stop():
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
                cleanup_failed_session()
                if entry["attempts"] >= MAX_ATTEMPTS:
                    entry["done"] = True
                    entry["quality_passed"] = False
                    log(f"  SKIPPING (max attempts): {post_id}")
                else:
                    log(f"  Will retry on next run")
                write_queue(queue)
                processed += 1
                if should_stop():
                    break
                continue

            # Publish
            log(f"  Quality gate PASSED. Publishing...")
            pub_error = publish(entry)
            if pub_error:
                entry["attempts"] += 1
                entry["last_error"] = pub_error
                log(f"  PUBLISH FAILED: {pub_error}")
                if entry["attempts"] >= MAX_ATTEMPTS:
                    entry["done"] = True
                    entry["quality_passed"] = False
                write_queue(queue)
                processed += 1
                if should_stop():
                    break
                continue

            # Success
            entry["done"] = True
            entry["quality_passed"] = True
            entry["last_error"] = None
            write_queue(queue)
            log(f"  SUCCESS: https://r-statistics.co/{slug}.html")

            processed += 1
            if should_stop():
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

#!/usr/bin/env python3
"""
Batch orchestrator for exercise hubs.

Each hub is produced in a fresh Claude CLI subprocess (clean context), then
quality-gated, then published in another fresh subprocess. State is tracked in
exercise-hub-status.json so runs are resumable.

Usage:
  python Scripts/batch_exercise_hubs.py                # process all pending
  python Scripts/batch_exercise_hubs.py --max 5        # cap to 5 hubs
  python Scripts/batch_exercise_hubs.py --hub <slug>   # one specific hub
  python Scripts/batch_exercise_hubs.py --audit-only   # gate every EX post, no spawns
  python Scripts/batch_exercise_hubs.py --regenerate   # re-process failing hubs
  python Scripts/batch_exercise_hubs.py --dry-run      # show plan, no spawns
  python Scripts/batch_exercise_hubs.py --no-publish   # write only, skip publish
"""
from __future__ import annotations
import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

REPO_ROOT = Path(__file__).resolve().parent.parent       # selva86.github.io/
PROJECT_ROOT = REPO_ROOT.parent                          # D:/09_rstatisticsco
STATUS_FILE = REPO_ROOT / "exercise-hub-status.json"
POSTS_DIR = REPO_ROOT / "posts"
FAILED_DIR = POSTS_DIR / "_failed"
LOG_FILE = REPO_ROOT / "Scripts" / "batch_exercise.log"
LOCK_FILE = REPO_ROOT / "Scripts" / "batch_exercise.lock"

WRITE_TIMEOUT = 2400    # 40 min per write
PUBLISH_TIMEOUT = 600   # 10 min per publish (sync_registries skipped via --skip-sync-registries)
MAX_ATTEMPTS = 2


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def acquire_lock():
    if LOCK_FILE.exists():
        pid = LOCK_FILE.read_text().strip()
        log(f"ERROR: lock held by PID {pid}. If stale, delete {LOCK_FILE}.")
        sys.exit(1)
    LOCK_FILE.write_text(str(os.getpid()))


def release_lock():
    if LOCK_FILE.exists():
        LOCK_FILE.unlink()


def read_status() -> dict:
    if not STATUS_FILE.exists():
        log(f"ERROR: {STATUS_FILE} not found. Run sync_status_from_catalog.py first.")
        sys.exit(1)
    return json.loads(STATUS_FILE.read_text(encoding="utf-8"))


def write_status(status: dict):
    tmp = STATUS_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(status, indent=2), encoding="utf-8")
    tmp.replace(STATUS_FILE)


def find_claude() -> str:
    claude = shutil.which("claude")
    if claude:
        return claude
    if platform.system() == "Windows":
        for fallback in ["claude.cmd", "claude.exe"]:
            found = shutil.which(fallback)
            if found:
                return found
    log("ERROR: 'claude' CLI not found in PATH")
    sys.exit(1)


def reset_in_progress(status: dict):
    """On startup, any in_progress entries from a prior interrupted run revert to pending."""
    n = 0
    for slug, row in status["hubs"].items():
        if row.get("status") == "in_progress":
            row["status"] = "pending"
            n += 1
    if n:
        log(f"Reset {n} in_progress entries -> pending (interrupted run)")
        write_status(status)


def pending_hubs(status: dict, regenerate: bool) -> list[dict]:
    """Return ordered list of hubs to process."""
    rows = list(status["hubs"].values())
    rows.sort(key=lambda r: (r.get("tier", 99), r["slug"]))
    out = []
    for r in rows:
        s = r.get("status")
        if s == "pending":
            out.append(r)
        elif regenerate and s in ("quality_failed", "manual_review", "publish_failed",
                                  "published_pre_pipeline"):
            out.append(r)
    return out


def quality_check(slug: str, tier: int) -> tuple[bool, str]:
    md_path = POSTS_DIR / f"{slug}.md"
    if not md_path.exists():
        return False, "markdown file not written"
    cmd = [sys.executable, str(REPO_ROOT / "Scripts" / "exercise_quality_check.py"),
           str(md_path), "--tier", str(tier)]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT))
    output = result.stdout + result.stderr
    return result.returncode == 0, output


def move_to_failed(slug: str):
    src = POSTS_DIR / f"{slug}.md"
    if not src.exists():
        return
    FAILED_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    dst = FAILED_DIR / f"{slug}.{ts}.md"
    src.rename(dst)
    log(f"  Moved failed draft -> {dst.relative_to(REPO_ROOT)}")


def check_git_clean() -> bool:
    """Check that no TRACKED files have unstaged/staged changes.

    Untracked files (?? prefix) are ignored — they don't interfere with
    md2html, build, commit, push. Only flag modified/staged tracked files.
    """
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, cwd=str(REPO_ROOT)
    )
    dirty = []
    for line in result.stdout.splitlines():
        if line.startswith("?? "):
            continue   # untracked: harmless
        path = line[3:].strip()
        if path in ("exercise-hub-status.json", "Scripts/batch_exercise.log"):
            continue
        if path.startswith("posts/_failed/"):
            continue
        dirty.append(line)
    return len(dirty) == 0


def run_write_skill(claude: str, slug: str, regenerate: bool, dry_run: bool) -> int:
    args_str = slug
    if regenerate:
        args_str += " --regenerate"
    prompt = f"/write-exercise-hub {args_str}"
    if dry_run:
        log(f"  DRY-RUN write: claude -p \"{prompt}\"")
        return 0
    log(f"  Spawning write: {prompt}")
    try:
        result = subprocess.run(
            [claude, "-p", prompt, "--dangerously-skip-permissions"],
            cwd=str(PROJECT_ROOT), timeout=WRITE_TIMEOUT
        )
        return result.returncode
    except subprocess.TimeoutExpired:
        log(f"  TIMEOUT after {WRITE_TIMEOUT}s")
        return -1


def run_publish_skill(claude: str, slug: str, dry_run: bool,
                      skip_sync_registries: bool = False) -> int:
    args_str = slug
    if skip_sync_registries:
        args_str += " --skip-sync-registries"
    prompt = f"/publish-post {args_str}"
    if dry_run:
        log(f"  DRY-RUN publish: claude -p \"{prompt}\"")
        return 0
    log(f"  Spawning publish: {prompt}")
    try:
        result = subprocess.run(
            [claude, "-p", prompt, "--dangerously-skip-permissions"],
            cwd=str(PROJECT_ROOT), timeout=PUBLISH_TIMEOUT
        )
        return result.returncode
    except subprocess.TimeoutExpired:
        log(f"  TIMEOUT after {PUBLISH_TIMEOUT}s")
        return -1


def run_final_sync_registries():
    """Run sync_registries.py once at the end of a batch. Returns exit code."""
    log("Running final sync_registries.py (catch-up after skip-sync batch)")
    t0 = time.time()
    result = subprocess.run(
        [sys.executable, str(REPO_ROOT / "_build" / "sync_registries.py")],
        cwd=str(REPO_ROOT), timeout=1800
    )
    elapsed = int(time.time() - t0)
    log(f"  sync_registries exit={result.returncode} ({elapsed}s)")
    if result.returncode == 0:
        # Commit and push any drift the sync produced
        subprocess.run(["git", "add", "-u"], capture_output=True, cwd=str(REPO_ROOT))
        cm = subprocess.run(
            ["git", "commit", "-m", "Final sync_registries pass after batch regeneration"],
            capture_output=True, cwd=str(REPO_ROOT)
        )
        if cm.returncode == 0:
            subprocess.run(["git", "push", "origin", "master"], capture_output=True, cwd=str(REPO_ROOT))
            log(f"  Final sync committed and pushed")
    return result.returncode


def audit_only():
    """Run quality gate on every EX post; produce a report grouped by fail reason."""
    cmd = [sys.executable, str(REPO_ROOT / "Scripts" / "exercise_quality_check.py"),
           "--all", "--json"]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT))
    # Output is one JSON object per file, concatenated. Split on closing brace + newline.
    raw = result.stdout.strip()
    docs = []
    depth = 0
    buf = []
    for ch in raw:
        buf.append(ch)
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    docs.append(json.loads("".join(buf).strip()))
                except Exception:
                    pass
                buf = []
    passed = [d for d in docs if d.get("overall_pass")]
    failed = [d for d in docs if not d.get("overall_pass")]
    log(f"Audit: {len(passed)} pass, {len(failed)} fail (of {len(docs)} EX posts)")
    log("")
    log("Hubs passing the quality gate:")
    for d in passed:
        log(f"  PASS  {d['slug']:<40} tier {d['tier']:<2}  ex={d['exercises_found']}")
    log("")
    log("Hubs failing the quality gate (will be regenerated with --regenerate):")
    for d in sorted(failed, key=lambda x: (x["tier"], x["slug"])):
        fails = [c["name"] for c in d["checks"] if not c["pass"]]
        log(f"  FAIL  {d['slug']:<40} tier {d['tier']:<2}  ex={d['exercises_found']:<3} {fails[:3]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=None, help="cap number of hubs processed")
    ap.add_argument("--hub", type=str, default=None, help="single hub slug")
    ap.add_argument("--audit-only", action="store_true", help="quality-check only, no spawns")
    ap.add_argument("--regenerate", action="store_true",
                    help="re-process failed/pre-pipeline hubs")
    ap.add_argument("--dry-run", action="store_true", help="show plan, no spawns")
    ap.add_argument("--no-publish", action="store_true",
                    help="run write only; skip publish step")
    args = ap.parse_args()

    if args.audit_only:
        audit_only()
        return

    acquire_lock()
    try:
        status = read_status()
        reset_in_progress(status)

        if args.hub:
            if args.hub not in status["hubs"]:
                log(f"ERROR: hub '{args.hub}' not in status.json")
                sys.exit(1)
            queue = [status["hubs"][args.hub]]
        else:
            queue = pending_hubs(status, args.regenerate)

        log(f"Queue size: {len(queue)} hubs to process")
        if args.max:
            queue = queue[: args.max]
            log(f"Capped to {len(queue)} (--max {args.max})")

        if args.dry_run:
            for h in queue:
                log(f"  WOULD PROCESS: {h['slug']:<40} tier {h.get('tier','?')}  status={h.get('status')}")
            return

        claude = find_claude()

        for i, hub in enumerate(queue, 1):
            slug = hub["slug"]
            tier = hub.get("tier", 2)
            log("=" * 70)
            log(f"[{i}/{len(queue)}] {slug} (tier {tier}, attempt {hub.get('retry_count', 0) + 1})")

            if not check_git_clean():
                log("  Skipping batch: git is dirty. Resolve and re-run.")
                break

            hub["status"] = "in_progress"
            hub["last_started"] = datetime.now().strftime("%Y-%m-%d %H:%M")
            write_status(status)

            # 1. Write
            t0 = time.time()
            exit_code = run_write_skill(claude, slug, args.regenerate, args.dry_run)
            elapsed = int(time.time() - t0)
            log(f"  Write exit={exit_code} ({elapsed}s)")

            if exit_code != 0:
                hub["status"] = "write_failed"
                hub["last_error"] = f"write skill exit {exit_code}"
                hub["retry_count"] = hub.get("retry_count", 0) + 1
                write_status(status)
                continue

            # 2. Quality gate
            ok, gate_output = quality_check(slug, tier)
            log(f"  Quality gate: {'PASS' if ok else 'FAIL'}")
            if not ok:
                # tail of gate output for triage
                tail = "\n".join(gate_output.splitlines()[-20:])
                log("  Gate output (tail):\n" + tail)
                hub["retry_count"] = hub.get("retry_count", 0) + 1
                if hub["retry_count"] < MAX_ATTEMPTS:
                    hub["status"] = "pending"
                    hub["last_error"] = "quality gate failed, will retry"
                    move_to_failed(slug)
                else:
                    hub["status"] = "manual_review"
                    hub["last_error"] = "quality gate failed twice"
                    move_to_failed(slug)
                write_status(status)
                # Critical: clean any half-written tracked files left by the
                # failed write subprocess so the NEXT iteration's git-clean
                # check doesn't abort the whole batch.
                subprocess.run(["git", "checkout", "--", "."],
                               capture_output=True, cwd=str(REPO_ROOT))
                log("  Reset tracked changes after gate failure")
                continue

            # 3. Publish (optional)
            if args.no_publish:
                hub["status"] = "written_unpublished"
                hub["written"] = datetime.now().strftime("%Y-%m-%d")
                write_status(status)
                continue

            t0 = time.time()
            pub_exit = run_publish_skill(claude, slug, args.dry_run,
                                          skip_sync_registries=True)
            elapsed = int(time.time() - t0)
            log(f"  Publish exit={pub_exit} ({elapsed}s)")

            if pub_exit != 0:
                hub["status"] = "publish_failed"
                hub["last_error"] = f"publish skill exit {pub_exit}"
                hub["retry_count"] = hub.get("retry_count", 0) + 1
                write_status(status)
                continue

            # 4. Verify HTML exists
            root_html = REPO_ROOT / f"{slug}.html"
            if not root_html.exists():
                hub["status"] = "publish_failed"
                hub["last_error"] = "publish completed but no root HTML found"
                write_status(status)
                continue

            hub["status"] = "done"
            hub["date_published"] = datetime.now().strftime("%Y-%m-%d")
            hub["retry_count"] = 0
            hub.pop("last_error", None)
            write_status(status)
            log(f"  DONE: {slug}")

            # Mop up post-publish auto-link drift so the next iteration's
            # check_git_clean() doesn't abort.
            drift = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True, text=True, cwd=str(REPO_ROOT)
            )
            tracked_dirty = [
                ln for ln in drift.stdout.splitlines()
                if ln and not ln.startswith("?? ")
            ]
            if tracked_dirty:
                log(f"  Post-publish drift: {len(tracked_dirty)} tracked files modified; mopping up")
                subprocess.run(["git", "add", "-u"],
                               capture_output=True, cwd=str(REPO_ROOT))
                subprocess.run(
                    ["git", "commit", "-m", f"Post-publish auto-link drift after {slug}"],
                    capture_output=True, cwd=str(REPO_ROOT)
                )
                subprocess.run(
                    ["git", "push", "origin", "master"],
                    capture_output=True, cwd=str(REPO_ROOT)
                )
                log(f"  Drift committed and pushed")

        # End-of-batch: run sync_registries once to catch up auto-links and FR blocks
        # across the whole site, then commit + push the drift.
        if not args.dry_run and not args.audit_only:
            try:
                run_final_sync_registries()
            except Exception as e:
                log(f"  Final sync_registries failed: {e}")
    finally:
        release_lock()


if __name__ == "__main__":
    main()

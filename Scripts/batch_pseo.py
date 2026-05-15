#!/usr/bin/env python3
"""
Batch orchestrator for programmatic-SEO (PSEO) posts.

Each post is produced in a fresh Claude CLI subprocess via the /write-pseo-v2
skill (11-pass SERP-informed write), quality-gated, then published in another
fresh subprocess. State is tracked in pseo-status.json so runs are resumable.

Usage:
  python Scripts/batch_pseo.py                 # process all pending (sync every 10)
  python Scripts/batch_pseo.py --max 5         # cap to 5 posts
  python Scripts/batch_pseo.py --slug <slug>   # one specific slug
  python Scripts/batch_pseo.py --category function-deep
  python Scripts/batch_pseo.py --regenerate    # re-process failures + manual_review
  python Scripts/batch_pseo.py --skip-validator    # bypass validate_pseo.py
  python Scripts/batch_pseo.py --no-publish    # write only
  python Scripts/batch_pseo.py --audit-only    # gate every PSEO post, no spawns
  python Scripts/batch_pseo.py --dry-run       # show plan, no spawns
  python Scripts/batch_pseo.py --sync-every 1  # sync_registries per post (slowest, safest)
  python Scripts/batch_pseo.py --sync-every 0  # skip final sync (run manually after)
"""
from __future__ import annotations
import argparse
import json
import os
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

REPO_ROOT = Path(__file__).resolve().parent.parent          # selva86.github.io/
PROJECT_ROOT = REPO_ROOT.parent                             # D:/09_rstatisticsco
STATUS_FILE = REPO_ROOT / "pseo-status.json"
POSTS_DIR = REPO_ROOT / "posts"
LOG_FILE = REPO_ROOT / "Scripts" / "batch_pseo.log"
LOCK_FILE = REPO_ROOT / "Scripts" / "batch_pseo.lock"
QUALITY_GATE = REPO_ROOT / "Scripts" / "pseo_quality_check.py"
VALIDATOR = REPO_ROOT / "Scripts" / "validate_pseo.py"
SYNC_REGISTRIES = REPO_ROOT / "_build" / "sync_registries.py"

WRITE_TIMEOUT = 1500    # 25 min per write (target 7-8 min, but generous)
PUBLISH_TIMEOUT = 600   # 10 min per publish
SYNC_TIMEOUT = 1800     # 30 min for the final sync_registries
MAX_ATTEMPTS = 2

TERMINAL_STATES = {"done", "demand_failed", "manual_review"}


# --------------------------------------------------------------------------
# Logging / lock
# --------------------------------------------------------------------------
def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def acquire_lock():
    if LOCK_FILE.exists():
        log(f"ERROR: lockfile exists at {LOCK_FILE}; another batch may be running.")
        log("       Remove it manually if you are sure no batch is active.")
        sys.exit(2)
    LOCK_FILE.write_text(str(os.getpid()))


def ensure_sitemap_skeleton():
    """build.py's update_sitemap() is additive — it appends to <urlset>.
    If sitemap.xml is missing or empty, bootstrap a minimal skeleton so the
    publish step's appends actually land."""
    sitemap = REPO_ROOT / "sitemap.xml"
    if sitemap.exists() and sitemap.stat().st_size > 200:
        return
    log(f"Bootstrapping empty sitemap.xml at {sitemap}")
    sitemap.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '</urlset>\n',
        encoding="utf-8",
    )


def release_lock():
    try:
        LOCK_FILE.unlink()
    except FileNotFoundError:
        pass


# --------------------------------------------------------------------------
# Status file
# --------------------------------------------------------------------------
def read_status() -> list[dict]:
    with open(STATUS_FILE, encoding="utf-8") as f:
        return json.load(f)


def write_status(status: list[dict]):
    tmp = STATUS_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)
    tmp.replace(STATUS_FILE)


def derived_status(entry: dict) -> str:
    """Return a working status for an entry. Adds defaults if missing."""
    s = entry.get("status")
    if s in ("done", "in_progress", "pending", "demand_failed", "quality_failed",
             "publish_failed", "manual_review"):
        return s
    if entry.get("published_date"):
        return "done"
    return "pending"


def normalize_entries(status: list[dict]):
    """Ensure every entry has a `status` field. Migrates legacy entries."""
    for e in status:
        e["status"] = derived_status(e)
        e.setdefault("retry_count", 0)


def reset_in_progress(status: list[dict]):
    """If a prior run died mid-process, reset in_progress back to pending."""
    for e in status:
        if e.get("status") == "in_progress":
            e["status"] = "pending"
            e["last_error"] = "reset after orchestrator interrupt"
    write_status(status)


def pending_entries(status: list[dict], regenerate: bool,
                    category: str | None) -> list[dict]:
    """Entries that need processing."""
    out = []
    for e in status:
        s = e.get("status", "pending")
        ok = (s == "pending")
        if regenerate and s in ("quality_failed", "publish_failed", "manual_review"):
            if e.get("retry_count", 0) < MAX_ATTEMPTS:
                ok = True
        if ok and category and e.get("category") != category:
            ok = False
        if ok:
            out.append(e)
    return out


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def find_claude() -> str:
    """Locate the claude CLI binary."""
    claude = shutil.which("claude")
    if not claude:
        log("ERROR: 'claude' CLI not found in PATH.")
        sys.exit(2)
    return claude


def check_git_clean() -> bool:
    """A dirty tree blocks publish. Skip the batch run if untracked content
    might be lost. Allow batch's own log and the status file to be dirty."""
    result = subprocess.run(
        ["git", "status", "--porcelain"], capture_output=True, text=True,
        cwd=str(REPO_ROOT)
    )
    dirty = []
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip()
        if path in (
            "pseo-status.json",
            "Scripts/batch_pseo.log",
            "Scripts/batch_pseo.run.log",
            "Scripts/batch_pseo.lock",
            "Scripts/pseo-failures.log",
        ):
            continue
        if path.startswith("posts/_failed/"):
            continue
        dirty.append(line)
    return len(dirty) == 0


def file_exists(slug: str) -> tuple[bool, bool, bool]:
    """Return (md_exists, fragment_exists, page_exists) for a slug."""
    return (
        (POSTS_DIR / f"{slug}.md").exists(),
        (REPO_ROOT / "_posts" / f"{slug}.html").exists(),
        (REPO_ROOT / f"{slug}.html").exists(),
    )


# --------------------------------------------------------------------------
# Pipeline steps
# --------------------------------------------------------------------------
def run_validator(slug: str, target_keyword: str, dry_run: bool) -> tuple[str, str]:
    """Run validate_pseo.py for demand check. Returns (verdict, reason).

    verdict ∈ {"PASS", "WARN", "FAIL", "SKIPPED"}
    """
    if dry_run:
        return ("PASS", "dry-run skipped")
    if not VALIDATOR.exists():
        return ("SKIPPED", "validator script missing")
    cmd = [sys.executable, str(VALIDATOR), target_keyword or slug,
           "--slug", slug, "--json"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace",
                           cwd=str(REPO_ROOT), timeout=120)
    except subprocess.TimeoutExpired:
        return ("WARN", "validator timeout (proceeding)")
    raw = (r.stdout or "").strip()
    # validate_pseo.py emits a multi-line JSON blob; parse the whole thing
    try:
        data = json.loads(raw) if raw else {}
    except Exception:
        data = {}

    # Real validator output always carries an "overall" key, plus per-gate
    # sub-dicts "slug" and "competitors" each with a "status"/"message".
    if isinstance(data, dict) and "overall" in data:
        verdict = data["overall"]
        bits = []
        for name in ("slug", "competitors"):
            gate = data.get(name)
            if isinstance(gate, dict) and gate.get("status") in ("WARN", "FAIL"):
                bits.append(f"{name}={gate['status']}: {gate.get('message', '')}")
        return (verdict, "; ".join(bits) or "ok")

    # No parseable "overall". A clean exit means stdout was merely unexpected;
    # a non-zero exit means validate_pseo.py crashed (uncaught exception, no
    # JSON). A crash is NOT a demand FAIL -- return WARN so the slot proceeds
    # to write rather than being terminally marked demand_failed.
    if r.returncode == 0:
        return ("PASS", "ok")
    stderr_tail = (r.stderr or "").strip()[-200:]
    return ("WARN",
            f"validator crashed (exit {r.returncode}); stderr: {stderr_tail}")


def run_write_skill(claude: str, slug: str, regenerate: bool, dry_run: bool) -> int:
    """Spawn /write-pseo-v2 in a fresh Claude CLI subprocess."""
    args_str = slug
    if regenerate:
        args_str += " --regenerate"
    prompt = f"/write-pseo-v2 {args_str}"
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


def run_quality_gate(slug: str) -> tuple[bool, str]:
    """Run pseo_quality_check.py against posts/<slug>.md. Returns (pass, summary)."""
    md_path = POSTS_DIR / f"{slug}.md"
    if not md_path.exists():
        return (False, f"md missing at {md_path}")
    cmd = [sys.executable, str(QUALITY_GATE), str(md_path)]
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT))
    out = r.stdout + r.stderr
    overall = ""
    for line in out.splitlines():
        if "Overall:" in line:
            overall = line.strip()
            break
    return (r.returncode == 0, overall or out[-200:])


def run_publish_skill(claude: str, slug: str, dry_run: bool,
                      skip_sync_registries: bool = True) -> int:
    """Spawn /publish-post in a fresh Claude CLI subprocess."""
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


def reconcile_publish_false_positive(slug: str) -> bool:
    """If the publish skill exited non-zero, the file is often still live.
    Returns True if the published page is verifiably present AND the gate
    passes - treating it as effectively done."""
    _, _, page_exists = file_exists(slug)
    if not page_exists:
        return False
    ok, _ = run_quality_gate(slug)
    return ok


def run_sync_registries(label="final"):
    """Run sync_registries.py once. `label` distinguishes mid-batch from final
    sync passes in log output and commit messages."""
    log(f"Running {label} sync_registries.py")
    t0 = time.time()
    try:
        result = subprocess.run(
            [sys.executable, str(SYNC_REGISTRIES)],
            cwd=str(REPO_ROOT), timeout=SYNC_TIMEOUT
        )
        elapsed = int(time.time() - t0)
        log(f"  sync_registries exit={result.returncode} ({elapsed}s)")
        if result.returncode == 0:
            subprocess.run(["git", "add", "-u"], capture_output=True, cwd=str(REPO_ROOT))
            cm = subprocess.run(
                ["git", "commit", "-m", f"{label.capitalize()} sync_registries pass after PSEO batch"],
                capture_output=True, cwd=str(REPO_ROOT)
            )
            if cm.returncode == 0:
                subprocess.run(["git", "push", "origin", "master"],
                               capture_output=True, cwd=str(REPO_ROOT))
                log(f"  {label.capitalize()} sync committed and pushed")
    except subprocess.TimeoutExpired:
        log(f"  sync_registries timed out after {SYNC_TIMEOUT}s")


def run_final_sync_registries():
    """Backwards-compatible alias for run_sync_registries('final')."""
    run_sync_registries("final")


def audit_only():
    """Gate every PSEO post. Report pass/fail summary."""
    cmd = [sys.executable, str(QUALITY_GATE), "--all"]
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT))
    pass_n = r.stdout.count("Overall: PASS")
    fail_n = r.stdout.count("Overall: FAIL")
    log(f"Audit: {pass_n} pass, {fail_n} fail")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=None, help="cap number of posts processed")
    ap.add_argument("--slug", type=str, default=None, help="single slug")
    ap.add_argument("--category", type=str, default=None, help="filter by category id")
    ap.add_argument("--audit-only", action="store_true", help="quality-check only, no spawns")
    ap.add_argument("--regenerate", action="store_true",
                    help="re-process failed/manual_review entries (up to MAX_ATTEMPTS)")
    ap.add_argument("--skip-validator", action="store_true",
                    help="skip validate_pseo.py pre-flight")
    ap.add_argument("--dry-run", action="store_true", help="show plan, no spawns")
    ap.add_argument("--no-publish", action="store_true",
                    help="run write+gate only; skip publish")
    ap.add_argument("--sync-every", type=int, default=10,
                    help="run sync_registries.py every N successful posts "
                         "(default 10). Use 0 to skip the final sync entirely "
                         "(no mid-batch syncs either). Use 1 to sync per post "
                         "(slowest but maximum cross-post visibility).")
    args = ap.parse_args()
    if args.sync_every < 0:
        log("ERROR: --sync-every must be >= 0")
        sys.exit(2)

    if args.audit_only:
        audit_only()
        return

    acquire_lock()
    try:
        ensure_sitemap_skeleton()
        status = read_status()
        normalize_entries(status)
        reset_in_progress(status)
        write_status(status)

        if args.slug:
            entry = next((e for e in status if e.get("slug") == args.slug), None)
            if not entry:
                log(f"ERROR: slug '{args.slug}' not in {STATUS_FILE.name}")
                sys.exit(1)
            queue = [entry]
        else:
            queue = pending_entries(status, args.regenerate, args.category)

        log(f"Queue size: {len(queue)} posts to process")
        if args.max:
            queue = queue[: args.max]
            log(f"Capped to {len(queue)} (--max {args.max})")

        if args.dry_run:
            for e in queue:
                log(f"  WOULD PROCESS: {e['slug']:<60} category={e.get('category','?')} "
                    f"status={e.get('status','pending')}")
            return

        claude = find_claude()
        done_in_batch = 0  # successful posts since last sync, for --sync-every

        for i, entry in enumerate(queue, 1):
            slug = entry["slug"]
            log("=" * 78)
            log(f"[{i}/{len(queue)}] {slug} (category={entry.get('category','?')}, "
                f"attempt {entry.get('retry_count', 0) + 1})")

            if not check_git_clean():
                # Mid-batch dirty tree usually means a prior slot's failed write
                # left unexpected files. Stash and continue so one bad slot
                # doesn't kill the rest; user can `git stash list` to inspect.
                dirty = subprocess.run(
                    ["git", "status", "--porcelain"], capture_output=True,
                    text=True, cwd=str(REPO_ROOT)
                ).stdout.strip()
                stash_msg = f"batch_pseo auto-stash before slot {i} ({slug})"
                r = subprocess.run(
                    ["git", "stash", "push", "-u", "-m", stash_msg],
                    capture_output=True, text=True, cwd=str(REPO_ROOT)
                )
                if r.returncode != 0 or not check_git_clean():
                    log(f"  Auto-stash failed (rc={r.returncode}); aborting batch.")
                    log(f"  Dirty paths:\n{dirty}")
                    if r.stderr.strip():
                        log(f"  git stash stderr: {r.stderr.strip()}")
                    break
                log(f"  Tree dirty before slot {i}; auto-stashed: {stash_msg}")
                log(f"  Stashed paths:\n{dirty}")

            entry["status"] = "in_progress"
            entry["last_started"] = datetime.now().strftime("%Y-%m-%d %H:%M")
            write_status(status)

            # 1. Pre-flight: demand validator
            if not args.skip_validator:
                target = entry.get("title") or slug.replace("-", " ")
                verdict, reason = run_validator(slug, target, args.dry_run)
                log(f"  Validator: {verdict}  ({reason[:120]})")
                if verdict == "FAIL":
                    entry["status"] = "demand_failed"
                    entry["last_error"] = f"validator FAIL: {reason}"
                    write_status(status)
                    continue

            # 2. Write
            t0 = time.time()
            wc = run_write_skill(claude, slug, args.regenerate, args.dry_run)
            elapsed = int(time.time() - t0)
            log(f"  Write exit={wc} ({elapsed}s)")
            if wc != 0:
                entry["retry_count"] = entry.get("retry_count", 0) + 1
                entry["status"] = "pending" if entry["retry_count"] < MAX_ATTEMPTS else "manual_review"
                entry["last_error"] = f"write skill exit {wc}"
                write_status(status)
                continue

            # 3. Quality gate
            ok, summary = run_quality_gate(slug)
            log(f"  Gate: {'PASS' if ok else 'FAIL'}  ({summary})")
            if not ok:
                entry["retry_count"] = entry.get("retry_count", 0) + 1
                if entry["retry_count"] < MAX_ATTEMPTS:
                    entry["status"] = "pending"
                    entry["last_error"] = f"quality gate failed: {summary}"
                else:
                    entry["status"] = "quality_failed"
                    entry["last_error"] = f"quality gate failed twice: {summary}"
                write_status(status)
                continue

            if args.no_publish:
                entry["status"] = "pending"
                entry["last_error"] = ""
                write_status(status)
                log("  Skipping publish (--no-publish)")
                continue

            # 4. Publish
            t0 = time.time()
            pc = run_publish_skill(claude, slug, args.dry_run,
                                    skip_sync_registries=True)
            elapsed = int(time.time() - t0)
            log(f"  Publish exit={pc} ({elapsed}s)")
            if pc != 0:
                if reconcile_publish_false_positive(slug):
                    log("  Publish exit was non-zero but page is live + gate PASSes."
                        " Auto-reconciling to done.")
                    entry["status"] = "done"
                    entry["published_date"] = datetime.now().strftime("%Y-%m-%d")
                    entry["last_error"] = (
                        f"publish skill exit {pc} (false positive: file shipped, "
                        f"gate PASS)"
                    )
                    entry["url"] = f"https://r-statistics.co/{slug}.html"
                    write_status(status)
                    continue
                entry["retry_count"] = entry.get("retry_count", 0) + 1
                entry["status"] = "publish_failed"
                entry["last_error"] = f"publish skill exit {pc}"
                write_status(status)
                continue

            # 5. DONE
            entry["status"] = "done"
            entry["published_date"] = datetime.now().strftime("%Y-%m-%d")
            entry["url"] = f"https://r-statistics.co/{slug}.html"
            entry["last_error"] = ""
            write_status(status)
            log(f"  DONE: {slug}")
            done_in_batch += 1
            if args.sync_every > 0 and done_in_batch % args.sync_every == 0:
                run_sync_registries(f"mid-batch ({done_in_batch}/{len(queue)})")

        if args.sync_every == 0:
            log("Skipping final sync_registries (--sync-every 0).")
            log("Run `python _build/sync_registries.py` manually to catch up.")
        else:
            run_sync_registries("final")
    finally:
        release_lock()


if __name__ == "__main__":
    main()

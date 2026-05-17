#!/usr/bin/env python3
"""
Batch orchestrator for backfilling [HINTS] blocks into exercise hubs.

~124 exercise hubs (post_type: EX) have exercises with no [HINTS] block. Each
exercise needs a 2-line [HINTS] block per section 5 of the exercise-hub
contract. This orchestrator backfills them one hub per spawned Claude CLI
subprocess: a fresh `claude -p` process adds the missing blocks to one hub's
markdown, then md2html regenerates the fragment and the validator confirms no
`missing .exercise-hints` warnings remain.

State is implicit: re-scanning posts/*.md for exercises lacking a [HINTS] block
makes every run resumable - a hub with all hints already in place is skipped.
Lock at Scripts/batch_hints.lock.

Usage:
  python Scripts/batch_hints.py                # process every hub missing hints
  python Scripts/batch_hints.py --max 5        # cap to 5 hubs
  python Scripts/batch_hints.py --slug <slug>  # one specific hub
  python Scripts/batch_hints.py --dry-run      # show plan, no spawns
"""
from __future__ import annotations
import argparse
import os
import re
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
POSTS_DIR = REPO_ROOT / "posts"
FRAGMENTS_DIR = REPO_ROOT / "_posts"
LOG_FILE = REPO_ROOT / "Scripts" / "batch_hints.log"
LOCK_FILE = REPO_ROOT / "Scripts" / "batch_hints.lock"
MD2HTML = REPO_ROOT / "_build" / "md2html.py"
VALIDATOR = REPO_ROOT / "Scripts" / "validate_exercise_hub.py"

WRITE_TIMEOUT = 1200    # 20 min per hub hint backfill
MD2HTML_TIMEOUT = 120
VALIDATE_TIMEOUT = 120

# Markdown patterns
EXERCISE_RE = re.compile(r'^### Exercise\b', re.MULTILINE)
HINTS_RE = re.compile(r'^\[HINTS\]\s*$', re.MULTILINE)
EX_FRONTMATTER_RE = re.compile(r'^post_type:\s*"?EX"?\s*$', re.MULTILINE)


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


def release_lock():
    try:
        LOCK_FILE.unlink()
    except FileNotFoundError:
        pass


# --------------------------------------------------------------------------
# Hub scanning  (re-scan = resumability: a fully-hinted hub drops out)
# --------------------------------------------------------------------------
def split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter, body). frontmatter is empty if none present."""
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m:
        return "", text
    return m.group(1), text[m.end():]


def count_missing_hints(md_path: Path) -> tuple[int, int]:
    """Return (n_exercises, n_missing_hints) for one hub markdown file.

    An exercise is counted as missing hints if its body - the span from its
    `### Exercise` heading to the next heading (or EOF) - contains no `[HINTS]`
    line.
    """
    text = md_path.read_text(encoding="utf-8")
    _, body = split_frontmatter(text)
    # Span each exercise heading to the next ### / ## heading or EOF.
    heading_iter = list(re.finditer(r'^#{2,3} ', body, re.MULTILINE))
    starts = [m.start() for m in EXERCISE_RE.finditer(body)]
    n_ex = len(starts)
    missing = 0
    for s in starts:
        # find the next heading boundary strictly after s
        end = len(body)
        for h in heading_iter:
            if h.start() > s:
                end = h.start()
                break
        chunk = body[s:end]
        if not HINTS_RE.search(chunk):
            missing += 1
    return n_ex, missing


def is_ex_hub(md_path: Path) -> bool:
    """True when the hub markdown frontmatter declares post_type EX."""
    fm, _ = split_frontmatter(md_path.read_text(encoding="utf-8"))
    return EX_FRONTMATTER_RE.search(fm) is not None


def scan_hubs() -> list[dict]:
    """Scan posts/*.md for EX hubs that have at least one exercise lacking a
    [HINTS] block. Returns a sorted list of {slug, path, exercises, missing}."""
    out = []
    for md_path in sorted(POSTS_DIR.glob("*.md")):
        if not is_ex_hub(md_path):
            continue
        n_ex, missing = count_missing_hints(md_path)
        if missing > 0:
            out.append({
                "slug": md_path.stem,
                "path": md_path,
                "exercises": n_ex,
                "missing": missing,
            })
    return out


# --------------------------------------------------------------------------
# Per-hub prompt
# --------------------------------------------------------------------------
def build_prompt(slug: str) -> str:
    """The prompt passed to each spawned `claude` process for one hub."""
    return (
        f"In the file posts/{slug}.md, every exercise is a `### Exercise N.M:` "
        f"heading. For EACH exercise that does NOT already have a `[HINTS]` "
        f"block, add one. A `[HINTS]` block is the literal line `[HINTS]` "
        f"followed by EXACTLY 2 lines, then a blank line. Line 1 = a conceptual "
        f"nudge that names NO function. Line 2 = a near-solution hint that names "
        f"the function/arguments but not the full pipeline. Base both hints on "
        f"that exercise's `**Task:**` text and its solution code. Place the "
        f"`[HINTS]` block immediately after the exercise's `**Difficulty:**` "
        f"line, before its Your-turn code fence. Do NOT modify exercises that "
        f"already have a `[HINTS]` block. Edit the file in place. Use a regular "
        f"hyphen, never an em dash."
    )


# --------------------------------------------------------------------------
# Pipeline steps
# --------------------------------------------------------------------------
def find_claude() -> str:
    """Locate the claude CLI binary."""
    claude = shutil.which("claude")
    if not claude:
        log("ERROR: 'claude' CLI not found in PATH.")
        sys.exit(2)
    return claude


def run_write_skill(claude: str, slug: str) -> int:
    """Spawn a fresh Claude CLI subprocess to add [HINTS] blocks to one hub."""
    prompt = build_prompt(slug)
    log(f"  Spawning hint backfill for {slug}")
    try:
        result = subprocess.run(
            [claude, "-p", prompt, "--dangerously-skip-permissions"],
            cwd=str(PROJECT_ROOT), timeout=WRITE_TIMEOUT
        )
        return result.returncode
    except subprocess.TimeoutExpired:
        log(f"  TIMEOUT after {WRITE_TIMEOUT}s")
        return -1


def run_md2html(slug: str) -> tuple[bool, str]:
    """Regenerate the fragment from the hub markdown. Returns (ok, tail)."""
    md_path = POSTS_DIR / f"{slug}.md"
    cmd = [sys.executable, str(MD2HTML), str(md_path)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace",
                           cwd=str(REPO_ROOT), timeout=MD2HTML_TIMEOUT)
    except subprocess.TimeoutExpired:
        return (False, "md2html timeout")
    tail = ((r.stdout or "") + (r.stderr or "")).strip()[-300:]
    return (r.returncode == 0, tail)


def run_validator(slug: str) -> tuple[bool, list[str]]:
    """Run validate_exercise_hub.py against the hub fragment.

    SUCCESS = the validator reports NO `missing .exercise-hints` lines for this
    hub. Unrelated webr-container errors (12 webr:false hubs) are OUT OF SCOPE
    and are ignored here - only hint warnings/errors matter.

    Returns (hints_ok, hint_messages).
    """
    frag = FRAGMENTS_DIR / f"{slug}.html"
    if not frag.exists():
        return (False, [f"fragment missing at {frag}"])
    cmd = [sys.executable, str(VALIDATOR), str(frag), "--show-warnings"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace",
                           cwd=str(REPO_ROOT), timeout=VALIDATE_TIMEOUT)
    except subprocess.TimeoutExpired:
        return (False, ["validator timeout"])
    out = (r.stdout or "") + (r.stderr or "")
    hint_msgs = [ln.strip() for ln in out.splitlines()
                 if "exercise-hints" in ln]
    hints_ok = len(hint_msgs) == 0
    return (hints_ok, hint_msgs)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=None,
                    help="cap number of hubs processed")
    ap.add_argument("--slug", type=str, default=None,
                    help="single hub slug (e.g. R-Vectors-Exercises)")
    ap.add_argument("--dry-run", action="store_true",
                    help="show plan, no spawns")
    args = ap.parse_args()

    log("=" * 78)
    log("batch_hints: scanning posts/*.md for EX hubs missing [HINTS] blocks")
    hubs = scan_hubs()
    log(f"Found {len(hubs)} hub(s) with at least one hint-less exercise")

    if args.slug:
        hubs = [h for h in hubs if h["slug"] == args.slug]
        if not hubs:
            log(f"ERROR: slug '{args.slug}' is not an EX hub missing hints "
                f"(already complete, or not found in posts/).")
            sys.exit(1)

    if args.max:
        hubs = hubs[: args.max]
        log(f"Capped to {len(hubs)} hub(s) (--max {args.max})")

    if args.dry_run:
        for h in hubs:
            log(f"  WOULD PROCESS: {h['slug']:<45} "
                f"exercises={h['exercises']:>3}  missing_hints={h['missing']:>3}")
        log(f"Dry run complete: {len(hubs)} hub(s) would be processed.")
        return

    if not hubs:
        log("Nothing to do - every EX hub already has its [HINTS] blocks.")
        return

    acquire_lock()
    succeeded, failed = [], []
    try:
        claude = find_claude()
        for i, h in enumerate(hubs, 1):
            slug = h["slug"]
            log("=" * 78)
            log(f"[{i}/{len(hubs)}] {slug}  "
                f"(exercises={h['exercises']}, missing_hints={h['missing']})")

            # 1. Write - spawn a fresh claude process to add the blocks
            t0 = time.time()
            wc = run_write_skill(claude, slug)
            log(f"  Write exit={wc} ({int(time.time() - t0)}s)")
            if wc != 0:
                log(f"  FAIL: write skill exited {wc}")
                failed.append((slug, f"write exit {wc}"))
                continue

            # 2. Regenerate the fragment
            md_ok, md_tail = run_md2html(slug)
            log(f"  md2html: {'ok' if md_ok else 'FAIL'}")
            if not md_ok:
                log(f"  md2html output tail: {md_tail}")
                failed.append((slug, "md2html failed"))
                continue

            # 3. Validate - success iff no `missing .exercise-hints` messages
            hints_ok, hint_msgs = run_validator(slug)
            if hints_ok:
                log(f"  Validator: HINTS OK (no missing .exercise-hints)")
                succeeded.append(slug)
                log(f"  DONE: {slug}")
            else:
                log(f"  Validator: HINT PROBLEMS REMAIN ({len(hint_msgs)}):")
                for m in hint_msgs[:10]:
                    log(f"    {m}")
                failed.append((slug, f"{len(hint_msgs)} hint message(s) remain"))
    finally:
        release_lock()

    log("=" * 78)
    log(f"Batch complete: {len(succeeded)} succeeded, {len(failed)} failed")
    if succeeded:
        log(f"  Succeeded: {', '.join(succeeded)}")
    if failed:
        for slug, reason in failed:
            log(f"  FAILED: {slug} - {reason}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

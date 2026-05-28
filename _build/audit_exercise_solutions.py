#!/usr/bin/env python3
"""
Audit every exercise's authored 'Expected result' block against the actual
output produced by running the canonical solution code through R.

Architecture:
  - One R session per HUB (not per exercise). Exercises within a hub depend
    on state from prior exercises (e.g., ex-2-1 uses `prices` that ex-1-3
    defined). The live page uses one persistent WebR session per hub, so
    the audit must mirror that.
  - Per-exercise output captured via printed markers ('===MARKER...===').
  - Uses parse() + withVisible() + eval() to mimic the R REPL's auto-print
    behavior so the captured output matches what WebR shows the learner.
  - options(warn=1) so warnings print inline with the result, the same
    place WebR surfaces them.

Usage:
  python _build/audit_exercise_solutions.py                       # dry run, report only
  python _build/audit_exercise_solutions.py --hub R-Vectors-Exercises
  python _build/audit_exercise_solutions.py --apply               # rewrite expected blocks in _posts/
  python _build/audit_exercise_solutions.py --rscript "C:/.../Rscript.exe"
  python _build/audit_exercise_solutions.py --workers 4           # hubs run in parallel

What --apply does:
  - For each exercise where actual_normalized != expected_normalized AND
    R did not throw an error, rewrites the .exercise-expected pre code
    contents to the raw actual output.
  - Backs up the file as <name>.html.bak before the first rewrite per file.
  - Leaves solution code, starter, hints, titles untouched.

Library setup:
  Some hubs use library(dplyr), library(ggplot2), etc. The audit runs against
  whatever R you point at, so install required packages first:
    Rscript -e 'install.packages(c("dplyr","tidyr","stringr","lubridate","purrr","ggplot2","tibble","forcats","readr","broom","data.table","plotly","leaflet","gt","tidymodels","caret","randomForest","xgboost","cluster","forecast"), repos="https://cloud.r-project.org")'
  Exercises whose libraries aren't installed will show R errors in the report.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

try:
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    print("[FATAL] BeautifulSoup4 not installed. Run: pip install beautifulsoup4", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = REPO_ROOT / "_posts"
REPORT_PATH = REPO_ROOT / "_build" / "exercise-audit-report.md"

RSCRIPT_GUESS_PATHS = [
    "C:/Program Files/R/R-4.6.0/bin/Rscript.exe",
    "C:/Program Files/R/R-4.5.0/bin/Rscript.exe",
    "C:/Program Files/R/R-4.4.0/bin/Rscript.exe",
    "C:/Program Files/R/R-4.3.0/bin/Rscript.exe",
]


def find_rscript(explicit: Optional[str]) -> str:
    if explicit:
        if not os.path.isfile(explicit):
            sys.exit(f"[FATAL] --rscript path not found: {explicit}")
        return explicit
    on_path = shutil.which("Rscript") or shutil.which("Rscript.exe")
    if on_path:
        return on_path
    for p in RSCRIPT_GUESS_PATHS:
        if os.path.isfile(p):
            return p
    parent = Path("C:/Program Files/R")
    if parent.is_dir():
        for sub in sorted(parent.iterdir(), reverse=True):
            cand = sub / "bin" / "Rscript.exe"
            if cand.is_file():
                return str(cand)
    sys.exit("[FATAL] Could not locate Rscript. Pass --rscript or add R to PATH.")


# Mirror of www/exercise-hub.js normalizeOutput().
_TIBBLE_TIMES = re.compile(r"×")
_UNI_ELLIPSIS = re.compile(r"…")
_NBSP = re.compile(r" ")
_LINE_PROMPT = re.compile(r"^\s*#>\s?")
_WS = re.compile(r"\s+")


def normalize_output(text: str) -> str:
    text = _TIBBLE_TIMES.sub("x", text or "")
    text = _UNI_ELLIPSIS.sub("...", text)
    text = _NBSP.sub(" ", text)
    out_lines = []
    for line in text.split("\n"):
        line = _LINE_PROMPT.sub("", line)
        line = _WS.sub(" ", line).strip()
        if line:
            out_lines.append(line)
    return "\n".join(out_lines)


def strip_decorative_output(code: str) -> str:
    lines = code.rstrip().split("\n")
    while lines and (not lines[-1].strip() or lines[-1].lstrip().startswith("#>")):
        lines.pop()
    return "\n".join(lines)


@dataclass
class Exercise:
    hub_slug: str
    file_path: Path
    exercise_id: str
    grade_mode: str
    solution_code: str
    starter_code: str
    expected_text: str
    expected_normalized: str


@dataclass
class HubAudit:
    hub_slug: str
    file_path: Path
    exercises: list[Exercise] = field(default_factory=list)
    # Filled by run_hub:
    actuals: dict[str, str] = field(default_factory=dict)        # exercise_id -> raw actual
    errors: dict[str, str] = field(default_factory=dict)         # exercise_id -> R error text
    hub_error: str = ""                                           # script-level failure
    runtime_ms: int = 0


def html_text_of(node) -> str:
    if node is None:
        return ""
    return html.unescape(node.get_text())


def extract_hub(path: Path) -> HubAudit:
    hub = HubAudit(hub_slug=path.stem, file_path=path)
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    for sec in soup.select("section.exercise"):
        ex_id = sec.get("data-exercise-id") or ""
        mode = sec.get("data-grade-mode") or ""
        if not ex_id or mode != "output-compare":
            continue
        details = sec.select_one("details.exercise-solution")
        if not details:
            continue
        sol_editor = details.select_one(".webr-container .webr-editor")
        if not sol_editor:
            continue
        sol_code = strip_decorative_output(html_text_of(sol_editor))
        if not sol_code.strip():
            continue
        # Starter code (outside the details). We don't currently use it
        # because the solution typically REPLACES the starter and includes
        # any setup code. Captured for future use if needed.
        starter_editor = None
        for div in sec.select(".webr-container"):
            # Skip the one inside .exercise-solution
            if div.find_parent("details"):
                continue
            starter_editor = div.select_one(".webr-editor")
            break
        starter_code = strip_decorative_output(html_text_of(starter_editor)) if starter_editor else ""
        # Expected
        exp_block = sec.select_one(".exercise-expected pre code")
        if not exp_block:
            continue
        expected_text = html_text_of(exp_block)
        hub.exercises.append(Exercise(
            hub_slug=hub.hub_slug,
            file_path=path,
            exercise_id=ex_id,
            grade_mode=mode,
            solution_code=sol_code,
            starter_code=starter_code,
            expected_text=expected_text,
            expected_normalized=normalize_output(expected_text),
        ))
    return hub


# Per-exercise output markers. Picked to be unlikely-in-real-output strings.
MARK_START = "##__RSCAUDIT_START__:{id}__##"
MARK_END = "##__RSCAUDIT_END__:{id}__##"


def build_hub_r_script(hub: HubAudit) -> str:
    """Generate a single R script that runs every exercise's solution in
    order within ONE R session, emitting per-exercise markers so Python can
    slice the output back into per-exercise chunks."""
    parts: list[str] = [
        "options(warn = 1)  # print warnings as they occur, not deferred",
        "options(useFancyQuotes = FALSE)",
        "options(width = 80)",
        "options(digits = 7)",
        "",
        "run_one <- function(code_string, mark_start, mark_end) {",
        "  cat(mark_start, '\\n', sep='')",
        "  out <- tryCatch({",
        "    exprs <- parse(text = code_string)",
        "    for (e in exprs) {",
        "      v <- withVisible(eval(e, envir = .GlobalEnv))",
        "      if (v$visible) print(v$value)",
        "    }",
        "    NULL",
        "  }, error = function(e) {",
        "    cat('##__RSCAUDIT_ERROR__:', conditionMessage(e), sep='')",
        "    NULL",
        "  })",
        "  cat('\\n', mark_end, '\\n', sep='')",
        "}",
        "",
    ]
    for ex in hub.exercises:
        # Inline the solution code as an R string literal; escape backslashes
        # and double quotes. Triple-quoted not supported in R, so use single
        # quotes and escape via a helper.
        encoded = ex.solution_code.replace("\\", "\\\\").replace("'", "\\'")
        ms = MARK_START.format(id=ex.exercise_id)
        me = MARK_END.format(id=ex.exercise_id)
        parts.append(f"run_one('{encoded}', '{ms}', '{me}')")
    return "\n".join(parts) + "\n"


# Regex that captures a per-exercise output block from the combined R stdout.
def make_block_re(ex_id: str) -> re.Pattern[str]:
    ms = re.escape(MARK_START.format(id=ex_id))
    me = re.escape(MARK_END.format(id=ex_id))
    return re.compile(rf"{ms}\s*\n(.*?)\n?{me}", re.DOTALL)


_ERR_RE = re.compile(r"##__RSCAUDIT_ERROR__:(.*?)(?=##__RSCAUDIT_END__|$)", re.DOTALL)


def run_hub(hub: HubAudit, rscript: str, tmpdir: Path, timeout: int = 120) -> HubAudit:
    if not hub.exercises:
        return hub
    t0 = time.perf_counter()
    script_path = tmpdir / f"{hub.hub_slug}.R"
    script_path.write_text(build_hub_r_script(hub), encoding="utf-8")
    try:
        proc = subprocess.run(
            [rscript, "--vanilla", str(script_path)],
            capture_output=True, text=True, timeout=timeout,
            encoding="utf-8", errors="replace",
        )
    except subprocess.TimeoutExpired:
        hub.hub_error = f"TIMEOUT (>{timeout}s)"
        hub.runtime_ms = int((time.perf_counter() - t0) * 1000)
        return hub
    except Exception as e:
        hub.hub_error = f"LAUNCH_FAILED: {e}"
        hub.runtime_ms = int((time.perf_counter() - t0) * 1000)
        return hub
    hub.runtime_ms = int((time.perf_counter() - t0) * 1000)

    # We capture both streams. R's warnings go to stderr by default; with
    # options(warn=1) they print immediately, so concatenating gives a
    # reasonable approximation of WebR's interleaved output, even though
    # stderr is appended at the end of the per-marker chunk. Acceptable.
    combined = proc.stdout or ""
    if proc.stderr:
        # Append stderr at the very end with a header so it shows up in
        # the report but doesn't pollute the per-exercise capture.
        # (Most exercises don't emit stderr; when they do, it's usually
        # warnings about non-fatal R behaviour.)
        hub.hub_error = (proc.stderr.strip() or "")[:600] if proc.returncode != 0 else ""

    # Slice the combined output by exercise markers.
    for ex in hub.exercises:
        m = make_block_re(ex.exercise_id).search(combined)
        if not m:
            hub.errors[ex.exercise_id] = "no output captured (marker not found)"
            continue
        chunk = m.group(1).rstrip()
        # Detect intra-chunk R error
        err_m = _ERR_RE.search(chunk)
        if err_m:
            hub.errors[ex.exercise_id] = err_m.group(1).strip()
            hub.actuals[ex.exercise_id] = ""
        else:
            hub.actuals[ex.exercise_id] = chunk
    return hub


def apply_fixes_to_file(file_path: Path, hub: HubAudit) -> int:
    """Rewrite .exercise-expected blocks for exercises that mismatched but
    did NOT error. Returns count of rewrites."""
    candidates: list[tuple[str, str]] = []
    for ex in hub.exercises:
        if ex.exercise_id in hub.errors:
            continue
        actual = hub.actuals.get(ex.exercise_id, "")
        if not actual.strip():
            continue
        if normalize_output(actual) == ex.expected_normalized:
            continue
        candidates.append((ex.exercise_id, actual))
    if not candidates:
        return 0
    bak = file_path.with_suffix(file_path.suffix + ".bak")
    if not bak.exists():
        shutil.copy2(file_path, bak)
    text = file_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")
    by_id = dict(candidates)
    rewritten = 0
    for sec in soup.select("section.exercise"):
        eid = sec.get("data-exercise-id") or ""
        actual = by_id.get(eid)
        if actual is None:
            continue
        exp_code = sec.select_one(".exercise-expected pre code")
        if not exp_code:
            continue
        for child in list(exp_code.children):
            child.extract()
        exp_code.append(NavigableString(actual.rstrip() + "\n"))
        rewritten += 1
    if rewritten:
        file_path.write_text(str(soup), encoding="utf-8")
    return rewritten


def write_report(hubs: list[HubAudit]) -> tuple[int, int, int]:
    matched = mismatched = errored = 0
    for hub in hubs:
        for ex in hub.exercises:
            if ex.exercise_id in hub.errors:
                errored += 1
            elif normalize_output(hub.actuals.get(ex.exercise_id, "")) == ex.expected_normalized:
                matched += 1
            else:
                mismatched += 1

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("w", encoding="utf-8") as fh:
        fh.write("# Exercise solution audit\n\n")
        fh.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n\n")
        fh.write(f"- Hubs scanned: {len(hubs)}\n")
        fh.write(f"- Total output-compare exercises: {matched + mismatched + errored}\n")
        fh.write(f"- Matched: {matched}\n")
        fh.write(f"- Mismatched: {mismatched}\n")
        fh.write(f"- R errors: {errored}\n\n")

        # Errors first
        for hub in hubs:
            for ex in hub.exercises:
                if ex.exercise_id not in hub.errors:
                    continue
                fh.write(f"## ERROR  {hub.hub_slug} / {ex.exercise_id}\n\n")
                fh.write("```\n" + hub.errors[ex.exercise_id][:1500] + "\n```\n\n")

        # Mismatches
        for hub in hubs:
            file_mismatch = [
                ex for ex in hub.exercises
                if ex.exercise_id not in hub.errors
                and normalize_output(hub.actuals.get(ex.exercise_id, "")) != ex.expected_normalized
            ]
            if not file_mismatch:
                continue
            fh.write(f"## {hub.hub_slug}\n\n")
            for ex in file_mismatch:
                fh.write(f"### `{ex.exercise_id}`\n\n")
                fh.write("**Authored expected:**\n\n```\n")
                fh.write(ex.expected_text.rstrip() + "\n")
                fh.write("```\n\n**Actual output of solution:**\n\n```\n")
                fh.write(hub.actuals[ex.exercise_id].rstrip() + "\n")
                fh.write("```\n\n---\n\n")
    return matched, mismatched, errored


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--hub", help="Restrict to one hub (slug, no .html)")
    p.add_argument("--apply", action="store_true",
                   help="Rewrite _posts/*.html with corrected expected blocks")
    p.add_argument("--rscript", help="Path to Rscript.exe")
    p.add_argument("--workers", type=int, default=min(4, (os.cpu_count() or 4)),
                   help="Parallel R processes (one per hub)")
    p.add_argument("--timeout", type=int, default=120, help="Per-hub timeout (sec)")
    args = p.parse_args()

    rscript = find_rscript(args.rscript)
    print(f"[audit] using Rscript: {rscript}")

    files = sorted(POSTS_DIR.glob("*.html"))
    if args.hub:
        target = POSTS_DIR / f"{args.hub}.html"
        if not target.is_file():
            sys.exit(f"[FATAL] hub not found: {target}")
        files = [target]

    hubs = [extract_hub(f) for f in files]
    hubs = [h for h in hubs if h.exercises]
    print(f"[audit] {len(hubs)} hubs with output-compare exercises, "
          f"{sum(len(h.exercises) for h in hubs)} exercises total")
    if not hubs:
        return 0

    t_start = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="rsc-audit-") as td:
        tmpdir = Path(td)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(run_hub, h, rscript, tmpdir, args.timeout): h for h in hubs}
            done = 0
            for fut in concurrent.futures.as_completed(futures):
                fut.result()  # mutates h in place
                done += 1
                if done % 5 == 0 or done == len(hubs):
                    elapsed = time.perf_counter() - t_start
                    rate = done / elapsed if elapsed else 0
                    eta = (len(hubs) - done) / rate if rate else 0
                    print(f"[audit] {done}/{len(hubs)} hubs  ({rate:.1f}/s  ETA {eta:.0f}s)")

    matched, mismatched, errored = write_report(hubs)
    print()
    print(f"[audit] matched:    {matched}")
    print(f"[audit] mismatched: {mismatched}")
    print(f"[audit] R errors:   {errored}")
    print(f"[audit] report -> {REPORT_PATH}")

    if args.apply:
        if not mismatched:
            print("[audit] --apply set but nothing to fix.")
        else:
            print("[audit] applying fixes...")
            total = 0
            for hub in hubs:
                n = apply_fixes_to_file(hub.file_path, hub)
                if n:
                    print(f"  rewrote {n} expected blocks in {hub.file_path.name}")
                    total += n
            print(f"[audit] applied {total} fixes (.bak files written)")
            print("[audit] re-run without --apply to verify.")

    return 1 if (mismatched or errored) else 0


if __name__ == "__main__":
    sys.exit(main())

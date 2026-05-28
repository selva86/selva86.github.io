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
import json
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
VERIFY_CACHE_PATH = REPO_ROOT / "_build" / ".audit-verify-cache.json"

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
    task_text: str
    expected_text: str
    expected_normalized: str


@dataclass
class Verdict:
    """Result of LLM correctness check on a (task, solution, actual) triple."""
    correct: bool
    confidence: str            # 'high' | 'medium' | 'low'
    reasoning: str
    cached: bool = False


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
        task_node = sec.select_one(".exercise-task")
        task_text = html_text_of(task_node).strip() if task_node else ""
        hub.exercises.append(Exercise(
            hub_slug=hub.hub_slug,
            file_path=path,
            exercise_id=ex_id,
            grade_mode=mode,
            solution_code=sol_code,
            starter_code=starter_code,
            task_text=task_text,
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


# ===== Optional LLM-based correctness verification =====
#
# Auto-fix is dangerous if the canonical solution itself is wrong: we would
# propagate the wrong output as the new 'correct' expected. Pre-flight
# safety: ask Claude to judge each mismatched exercise's solution against
# the task statement + actual output. Only mismatches with verdict.correct=
# true AND confidence != 'low' are auto-fixed; the rest are flagged
# REVIEW: in the report.
#
# Cache on disk so re-runs (after fixing prompts, re-running tests) don't
# re-pay for the same triples. Cache key = sha256 of (task + solution +
# actual). Invalidates automatically if any of those three change.

_VERIFY_SYSTEM = (
    "You are auditing R programming exercise solutions for an educational "
    "site. For each exercise you receive the task statement, the canonical "
    "solution R code, and the actual R output when that code is run. Your "
    "job is to decide whether the actual output correctly answers the task. "
    "Reply with strict JSON only, matching the schema "
    '{"correct": bool, "confidence": "high"|"medium"|"low", "reasoning": str}. '
    "Set confidence=low if the task is ambiguous, the solution is partially "
    "wrong, or the output is suspicious. Keep reasoning to ONE short sentence."
)


def _verify_cache_key(task: str, solution: str, actual: str) -> str:
    import hashlib
    h = hashlib.sha256()
    h.update(b"v1\n")  # cache version; bump to invalidate on prompt changes
    h.update(task.encode("utf-8")); h.update(b"\n---\n")
    h.update(solution.encode("utf-8")); h.update(b"\n---\n")
    h.update(actual.encode("utf-8"))
    return h.hexdigest()


def load_verify_cache() -> dict[str, dict]:
    if not VERIFY_CACHE_PATH.is_file():
        return {}
    try:
        return json.loads(VERIFY_CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_verify_cache(cache: dict[str, dict]) -> None:
    VERIFY_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    VERIFY_CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def verify_one(ex: Exercise, actual: str, client, model: str,
               cache: dict[str, dict]) -> Verdict:
    key = _verify_cache_key(ex.task_text, ex.solution_code, actual)
    if key in cache:
        c = cache[key]
        return Verdict(
            correct=bool(c.get("correct", False)),
            confidence=str(c.get("confidence", "low")),
            reasoning=str(c.get("reasoning", "")),
            cached=True,
        )
    user_msg = (
        f"TASK STATEMENT:\n{ex.task_text}\n\n"
        f"CANONICAL SOLUTION (R):\n```r\n{ex.solution_code}\n```\n\n"
        f"ACTUAL R OUTPUT when this solution runs:\n```\n{actual}\n```\n\n"
        f"Does the actual output correctly answer the task? Reply with strict JSON only."
    )
    try:
        resp = client.messages.create(
            model=model,
            max_tokens=300,
            system=_VERIFY_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = "".join(b.text for b in resp.content if hasattr(b, "text")).strip()
    except Exception as e:
        return Verdict(correct=False, confidence="low",
                       reasoning=f"API error: {type(e).__name__}: {e}")
    # Strip code fences if the model wrapped the JSON.
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        parsed = json.loads(raw)
    except Exception:
        return Verdict(correct=False, confidence="low",
                       reasoning=f"Unparseable LLM reply: {raw[:120]}")
    verdict = Verdict(
        correct=bool(parsed.get("correct", False)),
        confidence=str(parsed.get("confidence", "low")).lower(),
        reasoning=str(parsed.get("reasoning", "")).strip(),
    )
    cache[key] = {"correct": verdict.correct,
                  "confidence": verdict.confidence,
                  "reasoning": verdict.reasoning}
    return verdict


def run_verification(hubs: list[HubAudit], model: str, workers: int) -> dict[str, Verdict]:
    """Verify every mismatched exercise. Returns {exercise_id: Verdict}.
    Skips exercises that matched or errored."""
    try:
        import anthropic
    except ImportError:
        sys.exit("[FATAL] --verify needs the anthropic package. Run: pip install anthropic")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("[FATAL] ANTHROPIC_API_KEY not set. Export it before --verify.")
    client = anthropic.Anthropic(api_key=api_key)

    cache = load_verify_cache()
    cache_size_start = len(cache)

    # Collect work items.
    work: list[Exercise] = []
    actuals: dict[str, str] = {}
    for hub in hubs:
        for ex in hub.exercises:
            if ex.exercise_id in hub.errors:
                continue
            actual = hub.actuals.get(ex.exercise_id, "")
            if not actual.strip():
                continue
            if normalize_output(actual) == ex.expected_normalized:
                continue  # match — no need to verify
            work.append(ex)
            actuals[ex.exercise_id] = actual

    if not work:
        return {}

    print(f"[verify] {len(work)} mismatched exercises to verify "
          f"({sum(1 for ex in work if _verify_cache_key(ex.task_text, ex.solution_code, actuals[ex.exercise_id]) in cache)} cached, "
          f"{len(work) - sum(1 for ex in work if _verify_cache_key(ex.task_text, ex.solution_code, actuals[ex.exercise_id]) in cache)} fresh)")

    verdicts: dict[str, Verdict] = {}
    t0 = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(verify_one, ex, actuals[ex.exercise_id], client, model, cache): ex
            for ex in work
        }
        done = 0
        for fut in concurrent.futures.as_completed(futures):
            ex = futures[fut]
            v = fut.result()
            verdicts[ex.exercise_id] = v
            done += 1
            if done % 25 == 0 or done == len(work):
                elapsed = time.perf_counter() - t0
                rate = done / elapsed if elapsed else 0
                eta = (len(work) - done) / rate if rate else 0
                print(f"[verify] {done}/{len(work)}  ({rate:.1f}/s  ETA {eta:.0f}s)")

    # Persist any new entries.
    if len(cache) > cache_size_start:
        save_verify_cache(cache)
        print(f"[verify] cached {len(cache) - cache_size_start} new verdicts -> {VERIFY_CACHE_PATH}")
    return verdicts


def apply_fixes_to_file(file_path: Path, hub: HubAudit,
                        verdicts: Optional[dict[str, Verdict]] = None) -> tuple[int, int]:
    """Rewrite .exercise-expected blocks for exercises that mismatched, did
    NOT error, AND (if verdicts supplied) passed the correctness check with
    confidence != 'low'. Returns (rewritten_count, skipped_for_review_count).
    """
    candidates: list[tuple[str, str]] = []
    skipped_review = 0
    for ex in hub.exercises:
        if ex.exercise_id in hub.errors:
            continue
        actual = hub.actuals.get(ex.exercise_id, "")
        if not actual.strip():
            continue
        if normalize_output(actual) == ex.expected_normalized:
            continue
        if verdicts is not None:
            v = verdicts.get(ex.exercise_id)
            if not v or not v.correct or v.confidence == "low":
                skipped_review += 1
                continue
        candidates.append((ex.exercise_id, actual))
    if not candidates:
        return 0, skipped_review
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
    return rewritten, skipped_review


def write_report(hubs: list[HubAudit],
                 verdicts: Optional[dict[str, Verdict]] = None) -> tuple[int, int, int]:
    matched = mismatched = errored = 0
    for hub in hubs:
        for ex in hub.exercises:
            if ex.exercise_id in hub.errors:
                errored += 1
            elif normalize_output(hub.actuals.get(ex.exercise_id, "")) == ex.expected_normalized:
                matched += 1
            else:
                mismatched += 1

    safe_to_fix = needs_review = 0
    if verdicts is not None:
        for hub in hubs:
            for ex in hub.exercises:
                if ex.exercise_id in hub.errors:
                    continue
                actual = hub.actuals.get(ex.exercise_id, "")
                if not actual.strip() or normalize_output(actual) == ex.expected_normalized:
                    continue
                v = verdicts.get(ex.exercise_id)
                if v and v.correct and v.confidence != "low":
                    safe_to_fix += 1
                else:
                    needs_review += 1

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REPORT_PATH.open("w", encoding="utf-8") as fh:
        fh.write("# Exercise solution audit\n\n")
        fh.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n\n")
        fh.write(f"- Hubs scanned: {len(hubs)}\n")
        fh.write(f"- Total output-compare exercises: {matched + mismatched + errored}\n")
        fh.write(f"- Matched: {matched}\n")
        fh.write(f"- Mismatched: {mismatched}\n")
        fh.write(f"- R errors: {errored}\n")
        if verdicts is not None:
            fh.write(f"- Verified safe to auto-fix: {safe_to_fix}\n")
            fh.write(f"- Needs manual review (verdict said solution wrong / low confidence): {needs_review}\n")
        fh.write("\n")

        # Errors first
        for hub in hubs:
            for ex in hub.exercises:
                if ex.exercise_id not in hub.errors:
                    continue
                fh.write(f"## ERROR  {hub.hub_slug} / {ex.exercise_id}\n\n")
                fh.write("```\n" + hub.errors[ex.exercise_id][:1500] + "\n```\n\n")

        # Manual-review block (if verifying): solutions Claude flagged.
        if verdicts is not None:
            review_items: list[tuple[HubAudit, Exercise, Verdict]] = []
            for hub in hubs:
                for ex in hub.exercises:
                    if ex.exercise_id in hub.errors:
                        continue
                    actual = hub.actuals.get(ex.exercise_id, "")
                    if not actual.strip() or normalize_output(actual) == ex.expected_normalized:
                        continue
                    v = verdicts.get(ex.exercise_id)
                    if v and v.correct and v.confidence != "low":
                        continue
                    review_items.append((hub, ex, v))
            if review_items:
                fh.write("## MANUAL REVIEW (auto-fix skipped these)\n\n")
                fh.write("Claude judged these solutions as wrong or low-confidence. "
                         "Fix the SOLUTION code (not the expected) for any that are "
                         "genuinely buggy, then re-run the audit.\n\n")
                for hub, ex, v in review_items:
                    verdict_label = "unknown" if not v else (
                        f"{'WRONG' if not v.correct else 'CORRECT'} (confidence: {v.confidence})"
                    )
                    fh.write(f"### `{ex.exercise_id}` — verdict: {verdict_label}\n\n")
                    if v:
                        fh.write(f"_Reasoning:_ {v.reasoning}\n\n")
                    fh.write(f"**Task:** {ex.task_text}\n\n")
                    fh.write("**Solution:**\n\n```r\n" + ex.solution_code.rstrip() + "\n```\n\n")
                    fh.write("**Authored expected:**\n\n```\n" + ex.expected_text.rstrip() + "\n```\n\n")
                    fh.write("**Actual:**\n\n```\n" + hub.actuals[ex.exercise_id].rstrip() + "\n```\n\n---\n\n")

        # Safe-to-fix (or all mismatches if no verification)
        section_header = "## Safe to auto-fix (--apply will rewrite these)" if verdicts else "## Mismatches (--apply will rewrite these)"
        per_hub: dict[str, list[tuple[Exercise, Optional[Verdict]]]] = {}
        for hub in hubs:
            for ex in hub.exercises:
                if ex.exercise_id in hub.errors:
                    continue
                actual = hub.actuals.get(ex.exercise_id, "")
                if not actual.strip() or normalize_output(actual) == ex.expected_normalized:
                    continue
                v = verdicts.get(ex.exercise_id) if verdicts else None
                # If verifying, only include verdicts that passed.
                if verdicts is not None and (not v or not v.correct or v.confidence == "low"):
                    continue
                per_hub.setdefault(hub.hub_slug, []).append((ex, v))
        if per_hub:
            fh.write(section_header + "\n\n")
            for hub_slug in sorted(per_hub):
                fh.write(f"### {hub_slug}\n\n")
                for ex, v in per_hub[hub_slug]:
                    verdict_note = f" — _verified: {v.reasoning}_" if v else ""
                    fh.write(f"#### `{ex.exercise_id}`{verdict_note}\n\n")
                    fh.write("**Authored expected:**\n\n```\n")
                    fh.write(ex.expected_text.rstrip() + "\n")
                    fh.write("```\n\n**Actual output of solution:**\n\n```\n")
                    # Find the right hub for actuals lookup
                    for h in hubs:
                        if h.hub_slug == hub_slug:
                            fh.write(h.actuals[ex.exercise_id].rstrip() + "\n")
                            break
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
    p.add_argument("--verify", action="store_true",
                   help="Use Claude to verify each mismatched solution actually "
                        "answers the task. Auto-fix skips exercises Claude marks wrong "
                        "or low-confidence. Needs ANTHROPIC_API_KEY in env.")
    p.add_argument("--verify-model", default="claude-haiku-4-5-20251001",
                   help="Anthropic model id for --verify (default: Haiku 4.5)")
    p.add_argument("--verify-workers", type=int, default=10,
                   help="Concurrent LLM verification calls")
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

    verdicts: Optional[dict[str, Verdict]] = None
    if args.verify:
        verdicts = run_verification(hubs, args.verify_model, args.verify_workers)

    matched, mismatched, errored = write_report(hubs, verdicts)
    print()
    print(f"[audit] matched:    {matched}")
    print(f"[audit] mismatched: {mismatched}")
    print(f"[audit] R errors:   {errored}")
    if verdicts is not None:
        safe = sum(1 for v in verdicts.values() if v.correct and v.confidence != "low")
        review = len(verdicts) - safe
        print(f"[audit] verified safe to auto-fix: {safe}")
        print(f"[audit] flagged for manual review:  {review}")
    print(f"[audit] report -> {REPORT_PATH}")

    if args.apply:
        if not mismatched:
            print("[audit] --apply set but nothing to fix.")
        else:
            print("[audit] applying fixes...")
            total_fixed = 0
            total_skipped = 0
            for hub in hubs:
                n_fixed, n_skipped = apply_fixes_to_file(hub.file_path, hub, verdicts)
                if n_fixed:
                    print(f"  rewrote {n_fixed} expected blocks in {hub.file_path.name}")
                    total_fixed += n_fixed
                total_skipped += n_skipped
            print(f"[audit] applied {total_fixed} fixes (.bak files written)")
            if total_skipped:
                print(f"[audit] {total_skipped} skipped for manual review (see report)")
            print("[audit] re-run without --apply to verify.")

    return 1 if (mismatched or errored) else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Closed-loop exercise repair tool.

Pipeline for each broken exercise (R error OR output mismatch):
  1. Build context: task statement + hub setup + ALL prior exercise solutions
     in the hub + current solution + authored expected + error/actual.
  2. Ask Claude (Haiku 4.5) to propose a fix using one of three strategies
     (tried in order, first verified wins):

       Strategy 1 (FIX_SOLUTION):
         Most cases. LLM rewrites the exercise's R solution code so its
         output matches the authored expected.

       Strategy 2 (FIX_EXPECTED):
         For mismatches where the LLM judges the current solution to be
         correct per the task. We rewrite the authored expected to the
         actual output the solution produces.

       Strategy 3 (FIX_PRIOR_DEPENDENCY):
         For 'object not found' errors. LLM identifies which earlier
         exercise's solution was supposed to define the missing variable
         and proposes a patch to that earlier solution.

  3. Verification is mechanical (NOT LLM): apply the proposal in-memory,
     re-run the hub through R, compare normalized output to the (possibly
     proposal-updated) expected. If they match, the proposal is verified.

  4. Verified proposals are written to _posts/*.html and the file gets a
     .bak backup. Unverified proposals are logged and the next strategy
     is tried. Exercises that survive all three strategies are surfaced in
     a final 'manual_review' section.

Cost: ~$1-3 for full 280-exercise sweep with claude-haiku-4-5.
Time: ~15-30 min wall clock at default concurrency.

Usage:
  python _build/repair_exercise_solutions.py --rscript "<path>" \\
      [--hub <slug>] [--max-attempts 3] [--workers 4] [--limit N]

Requires ANTHROPIC_API_KEY in env.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

try:
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    sys.exit("[FATAL] pip install beautifulsoup4")
try:
    import anthropic
except ImportError:
    sys.exit("[FATAL] pip install anthropic")

# Reuse extraction + normalization + R-runner from the audit tool.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_exercise_solutions import (
    REPO_ROOT, POSTS_DIR, find_rscript,
    extract_hub, run_hub, HubAudit, Exercise,
    normalize_output, strip_decorative_output, html_text_of,
    MARK_START, MARK_END, build_hub_r_script,
)

REPAIR_REPORT_PATH = REPO_ROOT / "_build" / "exercise-repair-report.md"
DEFAULT_MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are repairing R programming exercises for an educational site. Each "
    "exercise has a Task statement, a canonical Solution (R code), and an "
    "Expected Result block. The site grades learners by running their code "
    "and comparing the printed output (whitespace-normalised) to the "
    "Expected. Right now, the Solution either errors or its output doesn't "
    "match Expected, so no learner can pass.\n\n"
    "Reply STRICT JSON only, matching the schema documented in each prompt. "
    "Never include markdown fences around the JSON. Be terse in 'reasoning'."
)


@dataclass
class RepairProposal:
    strategy: str                      # 'FIX_SOLUTION' | 'FIX_EXPECTED' | 'FIX_PRIOR_DEPENDENCY'
    new_solution: Optional[str] = None # set for FIX_SOLUTION / FIX_PRIOR_DEPENDENCY
    new_expected: Optional[str] = None # set for FIX_EXPECTED
    target_exercise_id: Optional[str] = None  # for FIX_PRIOR_DEPENDENCY
    reasoning: str = ""


@dataclass
class RepairOutcome:
    exercise_id: str
    hub_slug: str
    succeeded: bool
    strategy_used: str = ""
    attempts: int = 0
    error: str = ""
    proposal: Optional[RepairProposal] = None


def short(s: str, n: int = 1500) -> str:
    """Truncate context strings to keep prompts under control."""
    if not s:
        return ""
    return s if len(s) <= n else s[:n] + "\n...[truncated]"


def parse_json_strict(raw: str) -> dict:
    """Parse JSON, tolerating accidental code-fences from the model."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def llm_propose_fix_solution(
    client, model: str, ex: Exercise, hub_setup: str,
    prior_solutions_block: str, error: str, actual: str,
) -> Optional[RepairProposal]:
    """Strategy 1: ask the LLM to rewrite the solution code."""
    prompt = (
        f"TASK STATEMENT:\n{ex.task_text}\n\n"
        f"HUB SETUP CODE (already run before this exercise; do NOT include in your fix):\n"
        f"```r\n{short(hub_setup)}\n```\n\n"
        f"EARLIER SOLUTIONS IN THIS HUB (already run; their definitions are in scope):\n"
        f"```r\n{short(prior_solutions_block, 3000)}\n```\n\n"
        f"CURRENT SOLUTION (broken):\n```r\n{ex.solution_code}\n```\n\n"
        f"AUTHORED EXPECTED OUTPUT (this is what we want the solution to produce):\n"
        f"```\n{short(ex.expected_text)}\n```\n\n"
        f"FAILURE: {error or 'Output does not match expected. Actual output:'}\n"
        f"```\n{short(actual)}\n```\n\n"
        f"Write a corrected R solution that, when run after the setup and earlier "
        f"solutions, produces output matching the AUTHORED EXPECTED above. The "
        f"solution should be self-contained R code; do NOT include library() "
        f"calls already in the setup. Keep variable naming consistent with the "
        f"task. Return strict JSON:\n"
        '{"new_solution": "<R code>", "reasoning": "<one sentence>"}\n'
    )
    try:
        resp = client.messages.create(
            model=model, max_tokens=2000, system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = "".join(b.text for b in resp.content if hasattr(b, "text"))
        parsed = parse_json_strict(raw)
        return RepairProposal(
            strategy="FIX_SOLUTION",
            new_solution=parsed.get("new_solution", "").strip(),
            reasoning=parsed.get("reasoning", "")[:300],
        )
    except Exception as e:
        return None


def llm_propose_fix_expected(
    client, model: str, ex: Exercise, hub_setup: str,
    prior_solutions_block: str, actual: str,
) -> Optional[RepairProposal]:
    """Strategy 2: ask the LLM whether the solution is correct (and we should
    accept its actual output as the new expected)."""
    prompt = (
        f"TASK STATEMENT:\n{ex.task_text}\n\n"
        f"CANONICAL SOLUTION (R):\n```r\n{ex.solution_code}\n```\n\n"
        f"ACTUAL R OUTPUT when this solution runs (after setup + earlier solutions):\n"
        f"```\n{short(actual)}\n```\n\n"
        f"AUTHORED EXPECTED (currently doesn't match actual):\n"
        f"```\n{short(ex.expected_text)}\n```\n\n"
        f"Does the SOLUTION CODE correctly answer the TASK? If yes, the authored "
        f"expected was wrong (probably a hand-written narrative) and we should "
        f"replace it with the actual output. Return strict JSON:\n"
        '{"solution_is_correct": bool, "reasoning": "<one sentence>"}\n'
    )
    try:
        resp = client.messages.create(
            model=model, max_tokens=400, system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = "".join(b.text for b in resp.content if hasattr(b, "text"))
        parsed = parse_json_strict(raw)
        if not parsed.get("solution_is_correct", False):
            return None
        return RepairProposal(
            strategy="FIX_EXPECTED",
            new_expected=actual.rstrip() + "\n",
            reasoning=parsed.get("reasoning", "")[:300],
        )
    except Exception:
        return None


def verify_hub_after_patch(
    hub: HubAudit, ex_id: str,
    new_solution: Optional[str], new_expected: Optional[str],
    target_ex_id: Optional[str],
    rscript: str, tmpdir: Path,
    pre_patch_status: Optional[dict[str, str]] = None,
) -> tuple[bool, str]:
    """Apply the proposal in-memory (a shallow patched copy of the hub),
    re-run via R, check (a) the target exercise's output matches the
    (proposal-updated) expected AND (b) no exercise that was MATCHED before
    the patch is now broken (cascade regression). Returns (verified,
    actual_output_after_patch).

    pre_patch_status maps exercise_id -> 'matched' | 'mismatched' | 'errored'.
    When supplied, the patch is rejected if ANY previously-matched exercise
    becomes mismatched or errored after the patch — catches LLM fixes that
    silently break downstream exercises in the same chained R session.
    """
    # Build a shallow copy of the hub with the patch applied.
    patched = HubAudit(
        hub_slug=hub.hub_slug,
        file_path=hub.file_path,
        setup_code=hub.setup_code,
    )
    for ex in hub.exercises:
        if ex.exercise_id == ex_id and new_solution is not None:
            patched.exercises.append(Exercise(
                hub_slug=ex.hub_slug, file_path=ex.file_path,
                exercise_id=ex.exercise_id, grade_mode=ex.grade_mode,
                solution_code=new_solution.strip(),
                starter_code=ex.starter_code,
                task_text=ex.task_text,
                expected_text=new_expected if new_expected is not None else ex.expected_text,
                expected_normalized=normalize_output(new_expected) if new_expected is not None else ex.expected_normalized,
            ))
        elif ex.exercise_id == ex_id and new_expected is not None:
            patched.exercises.append(Exercise(
                hub_slug=ex.hub_slug, file_path=ex.file_path,
                exercise_id=ex.exercise_id, grade_mode=ex.grade_mode,
                solution_code=ex.solution_code,
                starter_code=ex.starter_code,
                task_text=ex.task_text,
                expected_text=new_expected,
                expected_normalized=normalize_output(new_expected),
            ))
        elif ex.exercise_id == target_ex_id and new_solution is not None:
            # FIX_PRIOR_DEPENDENCY: replace the EARLIER exercise's solution
            patched.exercises.append(Exercise(
                hub_slug=ex.hub_slug, file_path=ex.file_path,
                exercise_id=ex.exercise_id, grade_mode=ex.grade_mode,
                solution_code=new_solution.strip(),
                starter_code=ex.starter_code,
                task_text=ex.task_text,
                expected_text=ex.expected_text,
                expected_normalized=ex.expected_normalized,
            ))
        else:
            patched.exercises.append(ex)
    # Run the patched hub.
    run_hub(patched, rscript, tmpdir, timeout=180)
    actual = patched.actuals.get(ex_id, "")
    if ex_id in patched.errors:
        return False, ""
    target_ex = next((e for e in patched.exercises if e.exercise_id == ex_id), None)
    if not target_ex:
        return False, actual
    target_ok = normalize_output(actual) == target_ex.expected_normalized
    if not target_ok:
        return False, actual

    # Cascade-regression check: if any other exercise in the hub that was
    # previously MATCHED is now mismatched or errored, the patch is rejected.
    # Solution-rewrite patches can mutate variables that later exercises
    # depend on; without this check, LLM 'fixes' silently break downstream
    # exercises that were working before.
    if pre_patch_status:
        for other_ex in patched.exercises:
            if other_ex.exercise_id == ex_id:
                continue
            prior = pre_patch_status.get(other_ex.exercise_id)
            if prior != "matched":
                continue  # only protect things that were working
            if other_ex.exercise_id in patched.errors:
                return False, actual
            other_actual = patched.actuals.get(other_ex.exercise_id, "")
            if normalize_output(other_actual) != other_ex.expected_normalized:
                return False, actual
    return True, actual


def attempt_repair(
    ex: Exercise, hub: HubAudit, error: str, actual: str,
    client, model: str, rscript: str, tmpdir: Path,
    max_attempts: int = 3,
    pre_patch_status: Optional[dict[str, str]] = None,
) -> RepairOutcome:
    """Run the strategies in order until one verifies."""
    # Build the prior-solutions block once: every earlier exercise's solution
    # in the hub, in document order.
    prior_blocks: list[str] = []
    for prior in hub.exercises:
        if prior.exercise_id == ex.exercise_id:
            break
        prior_blocks.append(f"# {prior.exercise_id}\n{prior.solution_code}")
    prior_block_text = "\n\n".join(prior_blocks)

    outcome = RepairOutcome(exercise_id=ex.exercise_id, hub_slug=hub.hub_slug,
                            succeeded=False)
    attempts = 0

    # ---- Strategy 1: fix the solution code ----
    if attempts < max_attempts:
        attempts += 1
        p = llm_propose_fix_solution(client, model, ex, hub.setup_code,
                                     prior_block_text, error, actual)
        if p and p.new_solution:
            ok, _ = verify_hub_after_patch(
                hub, ex.exercise_id, p.new_solution, None, None, rscript, tmpdir,
                pre_patch_status=pre_patch_status)
            if ok:
                outcome.succeeded = True
                outcome.strategy_used = "FIX_SOLUTION"
                outcome.proposal = p
                outcome.attempts = attempts
                return outcome

    # ---- Strategy 2: accept the actual as the new expected (mismatch only) ----
    # Only meaningful if the exercise produced SOME output (not a hard error).
    if not error and actual.strip() and attempts < max_attempts:
        attempts += 1
        p = llm_propose_fix_expected(client, model, ex, hub.setup_code,
                                     prior_block_text, actual)
        if p and p.new_expected:
            # No need to re-run R; we already have actual. Verify trivially.
            outcome.succeeded = True
            outcome.strategy_used = "FIX_EXPECTED"
            outcome.proposal = p
            outcome.attempts = attempts
            return outcome

    # ---- Strategy 3: retry FIX_SOLUTION with an explicit nudge for variable-not-found ----
    if 'not found' in (error or '').lower() and attempts < max_attempts:
        attempts += 1
        # Same prompt, with a hint to inspect prior solutions.
        nudge_ex = Exercise(
            hub_slug=ex.hub_slug, file_path=ex.file_path,
            exercise_id=ex.exercise_id, grade_mode=ex.grade_mode,
            solution_code=ex.solution_code, starter_code=ex.starter_code,
            task_text=(ex.task_text +
                       "\n\nNOTE: The error is 'object not found'. Look at "
                       "earlier solutions to see what variable names actually "
                       "exist. Adjust your solution to use the right names, OR "
                       "compute the missing data from scratch from the task hints."),
            expected_text=ex.expected_text,
            expected_normalized=ex.expected_normalized,
        )
        p = llm_propose_fix_solution(client, model, nudge_ex, hub.setup_code,
                                     prior_block_text, error, actual)
        if p and p.new_solution:
            ok, _ = verify_hub_after_patch(
                hub, ex.exercise_id, p.new_solution, None, None, rscript, tmpdir,
                pre_patch_status=pre_patch_status)
            if ok:
                outcome.succeeded = True
                outcome.strategy_used = "FIX_SOLUTION_NUDGED"
                outcome.proposal = p
                outcome.attempts = attempts
                return outcome

    outcome.attempts = attempts
    outcome.error = "all strategies failed verification"
    return outcome


def apply_outcome_to_file(file_path: Path, outcomes: list[RepairOutcome]) -> int:
    """Apply every successful outcome's proposal to the source HTML.
    Backs up the file as .bak before first write. Returns count applied."""
    successes = [o for o in outcomes if o.succeeded and o.proposal]
    if not successes:
        return 0
    bak = file_path.with_suffix(file_path.suffix + ".bak")
    if not bak.exists():
        shutil.copy2(file_path, bak)
    text = file_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")
    applied = 0
    for o in successes:
        # Find the target exercise (or target_exercise_id for FIX_PRIOR_DEPENDENCY)
        target_id = o.proposal.target_exercise_id or o.exercise_id
        for sec in soup.select("section.exercise"):
            if sec.get("data-exercise-id") != target_id:
                continue
            if o.proposal.new_solution is not None:
                # Replace the solution editor's text contents
                details = sec.select_one("details.exercise-solution")
                if details:
                    editor = details.select_one(".webr-container .webr-editor")
                    if editor:
                        for c in list(editor.children):
                            c.extract()
                        editor.append(NavigableString(o.proposal.new_solution.strip() + "\n"))
                        applied += 1
            if o.proposal.new_expected is not None:
                exp_code = sec.select_one(".exercise-expected pre code")
                if exp_code:
                    for c in list(exp_code.children):
                        c.extract()
                    exp_code.append(NavigableString(o.proposal.new_expected.rstrip() + "\n"))
                    applied += 1
            break
    if applied:
        file_path.write_text(str(soup), encoding="utf-8")
    return applied


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--rscript", required=True)
    p.add_argument("--hub", help="Restrict to one hub")
    p.add_argument("--max-attempts", type=int, default=3)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--limit", type=int, help="Stop after N exercises")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--dry-run", action="store_true",
                   help="Compute fixes, write report, but DON'T touch _posts/")
    args = p.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("[FATAL] ANTHROPIC_API_KEY not set")
    rscript = find_rscript(args.rscript)
    client = anthropic.Anthropic()

    # Phase 1: audit so we know what's broken.
    files = sorted(POSTS_DIR.glob("*.html"))
    if args.hub:
        target = POSTS_DIR / f"{args.hub}.html"
        if not target.is_file():
            sys.exit(f"[FATAL] hub not found: {target}")
        files = [target]

    hubs = [extract_hub(f) for f in files]
    hubs = [h for h in hubs if h.exercises]
    print(f"[repair] {len(hubs)} hubs to audit + repair")

    with tempfile.TemporaryDirectory(prefix="rsc-repair-") as td:
        tmpdir = Path(td)
        # Run initial audit (in parallel)
        print("[repair] phase 1: initial audit...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            for fut in concurrent.futures.as_completed(
                {pool.submit(run_hub, h, rscript, tmpdir, 180): h for h in hubs}
            ):
                fut.result()

        # Collect broken exercises (errors + mismatches) + snapshot the
        # pre-patch status of EVERY exercise so the cascade-regression
        # check in verify_hub_after_patch can reject patches that silently
        # break a previously-matched downstream exercise.
        broken: list[tuple[Exercise, HubAudit, str, str]] = []
        pre_status_by_hub: dict[str, dict[str, str]] = {}
        for hub in hubs:
            pre_status_by_hub[hub.hub_slug] = {}
            for ex in hub.exercises:
                if ex.exercise_id in hub.errors:
                    pre_status_by_hub[hub.hub_slug][ex.exercise_id] = "errored"
                    broken.append((ex, hub, hub.errors[ex.exercise_id], ""))
                else:
                    actual = hub.actuals.get(ex.exercise_id, "")
                    if normalize_output(actual) != ex.expected_normalized:
                        pre_status_by_hub[hub.hub_slug][ex.exercise_id] = "mismatched"
                        broken.append((ex, hub, "", actual))
                    else:
                        pre_status_by_hub[hub.hub_slug][ex.exercise_id] = "matched"
        if args.limit:
            broken = broken[:args.limit]
        print(f"[repair] {len(broken)} broken exercises to attempt repair")
        if not broken:
            return 0

        # Phase 2: attempt repair on each (sequential per hub to avoid
        # in-place patch races; parallel across hubs).
        outcomes: list[RepairOutcome] = []
        from collections import defaultdict
        by_hub: dict[str, list[tuple[Exercise, HubAudit, str, str]]] = defaultdict(list)
        for tup in broken:
            by_hub[tup[1].hub_slug].append(tup)

        def repair_hub_seq(items):
            local: list[RepairOutcome] = []
            for ex, hub, err, act in items:
                try:
                    o = attempt_repair(
                        ex, hub, err, act, client, args.model,
                        rscript, tmpdir, args.max_attempts,
                        pre_patch_status=pre_status_by_hub.get(hub.hub_slug),
                    )
                except Exception as e:
                    o = RepairOutcome(exercise_id=ex.exercise_id,
                                      hub_slug=hub.hub_slug, succeeded=False,
                                      error=f"exception: {type(e).__name__}: {e}")
                local.append(o)
            return local

        print(f"[repair] phase 2: per-exercise repair (Haiku 4.5, "
              f"{args.workers} hubs in parallel)...")
        t0 = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            futs = {pool.submit(repair_hub_seq, items): hub_slug
                    for hub_slug, items in by_hub.items()}
            done = 0
            for fut in concurrent.futures.as_completed(futs):
                outcomes.extend(fut.result())
                done += 1
                elapsed = time.perf_counter() - t0
                pct = done / len(by_hub) * 100
                print(f"[repair]   hub {done}/{len(by_hub)} done "
                      f"({pct:.0f}% wall {elapsed:.0f}s)")

        # Summary
        wins = [o for o in outcomes if o.succeeded]
        losses = [o for o in outcomes if not o.succeeded]
        by_strategy = {}
        for o in wins:
            by_strategy[o.strategy_used] = by_strategy.get(o.strategy_used, 0) + 1
        print()
        print(f"[repair] attempted: {len(outcomes)}")
        print(f"[repair] succeeded: {len(wins)}  (strategies: {by_strategy})")
        print(f"[repair] failed:    {len(losses)}")

        # Phase 3: write report + (unless dry-run) apply
        REPAIR_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with REPAIR_REPORT_PATH.open("w", encoding="utf-8") as fh:
            fh.write("# Exercise repair report\n\n")
            fh.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n\n")
            fh.write(f"- Total broken: {len(outcomes)}\n")
            fh.write(f"- Repaired: {len(wins)}\n")
            fh.write(f"- Failed: {len(losses)}\n")
            for s, n in by_strategy.items():
                fh.write(f"  - {s}: {n}\n")
            fh.write("\n")
            if losses:
                fh.write("## Failed (manual review required)\n\n")
                for o in losses[:200]:
                    fh.write(f"- `{o.exercise_id}` ({o.hub_slug}): {o.error}\n")
                fh.write("\n")
            if wins:
                fh.write("## Repaired (auto-applied)\n\n")
                for o in wins:
                    fh.write(f"- `{o.exercise_id}` via {o.strategy_used}: "
                             f"{(o.proposal.reasoning or '')[:200]}\n")
        print(f"[repair] report -> {REPAIR_REPORT_PATH}")

        if args.dry_run:
            print("[repair] --dry-run: no files modified.")
            return 0

        # Apply per file
        from collections import defaultdict
        by_file: dict[Path, list[RepairOutcome]] = defaultdict(list)
        for o in wins:
            by_file[next(h for h in hubs if h.hub_slug == o.hub_slug).file_path].append(o)
        total_applied = 0
        for fp, outs in by_file.items():
            n = apply_outcome_to_file(fp, outs)
            if n:
                total_applied += n
                print(f"  applied {n} fixes to {fp.name}")
        print(f"[repair] applied {total_applied} edits across {len(by_file)} files (.bak written)")
        return 0 if not losses else 1


if __name__ == "__main__":
    sys.exit(main())

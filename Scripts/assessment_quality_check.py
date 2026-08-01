"""Quality gate for one assessment question bank.

Structural checks plus the two that actually matter:
  - every R block in an `output` question is EXECUTED against local R and its
    printed output must match what the question claims (same rule as the
    tutorial gate: a fabricated `#>` is a failure, not a warning),
  - every question's chapter reference must belong to THIS section, which is
    what stops a bank from testing material the reader has not met yet.

    python Scripts/assessment_quality_check.py ts-1
    python Scripts/assessment_quality_check.py ts-1 --skip-execution
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK_DIR = os.path.join(REPO_ROOT, '_assessments')
META_PATH = os.path.join(REPO_ROOT, 'functions', '_data', 'assessments.json')

RSCRIPT = r"C:\Program Files\R\R-4.6.0\bin\Rscript.exe"
MIN_QUESTIONS = 30
BANNED_OPTION_TEXT = ('all of the above', 'none of the above', 'both a and b',
                      'a and b', 'all of these', 'none of these')

fails, warns = [], []


def fail(msg):
    fails.append(msg)
    print(f' [FAIL] {msg}')


def warn(msg):
    warns.append(msg)
    print(f' [warn] {msg}')


def ok(msg):
    print(f' [ok]   {msg}')


def check_structure(aid, bank, meta):
    qs = bank.get('questions') or []
    if len(qs) < MIN_QUESTIONS:
        fail(f'{len(qs)} questions, need at least {MIN_QUESTIONS} '
             f'(12 are served per attempt; a thin pool means retakes repeat)')
    else:
        ok(f'{len(qs)} questions in the pool')

    section_slugs = set(meta.get('chapter_slugs') or [])
    kinds = {}
    difficulties = {}
    prompts = set()

    for i, q in enumerate(qs, start=1):
        w = f'q{i}'
        kinds[q.get('kind')] = kinds.get(q.get('kind'), 0) + 1
        difficulties[q.get('difficulty')] = difficulties.get(q.get('difficulty'), 0) + 1

        p = (q.get('prompt') or '').strip()
        if len(p) < 25:
            fail(f'{w}: prompt too short to be a real question')
        if p.lower() in prompts:
            fail(f'{w}: duplicate prompt')
        prompts.add(p.lower())

        opts = q.get('options') or []
        keys = [o.get('key') for o in opts]
        texts = [str(o.get('text', '')).strip() for o in opts]
        if len(opts) < 3:
            fail(f'{w}: {len(opts)} options, need at least 3')
        if len(set(keys)) != len(keys):
            fail(f'{w}: duplicate option keys')
        if len(set(t.lower() for t in texts)) != len(texts):
            fail(f'{w}: two options say the same thing')
        for t in texts:
            for bad in BANNED_OPTION_TEXT:
                if t.lower().strip().rstrip('.') == bad:
                    fail(f'{w}: lazy option "{t}"')

        ans = q.get('answer') or []
        if not ans:
            fail(f'{w}: no answer key')
        if any(a not in keys for a in ans):
            fail(f'{w}: answer key is not one of the options')
        if q.get('kind') == 'single' and len(ans) != 1:
            fail(f'{w}: single-answer question with {len(ans)} answers')
        if q.get('kind') == 'multi' and len(ans) < 2:
            fail(f'{w}: multi question needs at least 2 correct options')
        if q.get('kind') == 'multi' and len(ans) >= len(opts):
            fail(f'{w}: every option marked correct')
        if q.get('kind') == 'output' and not (q.get('code') or '').strip():
            fail(f'{w}: output question with no code block')

        # Distractor sanity: the correct option should not be the longest by a
        # mile, which is the classic tell that gives the answer away.
        if len(ans) == 1 and len(texts) >= 3:
            correct = next((t for k, t in zip(keys, texts) if k == ans[0]), '')
            others = [t for k, t in zip(keys, texts) if k != ans[0]]
            if others and len(correct) > 2.0 * max(len(t) for t in others):
                warn(f'{w}: correct option is far longer than every distractor')

        slug = q.get('chapter_slug') or ''
        if not slug:
            fail(f'{w}: no chapter_slug')
        elif not os.path.exists(os.path.join(REPO_ROOT, slug + '.html')):
            fail(f'{w}: chapter {slug}.html does not exist')
        elif section_slugs and slug not in section_slugs:
            fail(f'{w}: chapter {slug} is not in this section '
                 f'(scope leak: the reader has not met it here)')

    if kinds:
        ok('kinds: ' + ', '.join(f'{k}={v}' for k, v in sorted(kinds.items(), key=lambda x: str(x[0]))))
    if kinds.get('output', 0) < 3:
        warn(f'only {kinds.get("output", 0)} read-the-output questions; these are the differentiator')
    if kinds.get('multi', 0) < 2:
        warn(f'only {kinds.get("multi", 0)} multi-select questions')
    hard = difficulties.get('hard', 0)
    if hard < len(qs) * 0.25:
        warn(f'only {hard} of {len(qs)} marked hard; the brief asks for intermediate to hard')
    else:
        ok(f'{hard} of {len(qs)} questions marked hard')


def check_execution(aid, bank):
    """Run every output question's code and compare against its stated output.

    Blocks are run in ONE session, in order, exactly like the tutorial gate,
    so later blocks may rely on earlier objects.
    """
    qs = [q for q in (bank.get('questions') or []) if q.get('kind') == 'output']
    if not qs:
        warn('no output questions to execute')
        return
    if not os.path.exists(RSCRIPT):
        warn(f'Rscript not found at {RSCRIPT}; execution check skipped')
        return

    # Strip the claimed output (`#>` lines) to get runnable code, and keep the
    # claim for comparison.
    script, claims = [], []
    for i, q in enumerate(qs, start=1):
        code_lines, claimed = [], []
        for line in (q.get('code') or '').splitlines():
            if line.lstrip().startswith('#>'):
                claimed.append(line.lstrip()[2:].strip())
            else:
                code_lines.append(line)
        script.append(f'cat("<<<Q{i}>>>\\n")')
        script.extend(code_lines)
        claims.append((i, '\n'.join(claimed).strip()))

    with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False,
                                     encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(script) + '\n')
        path = f.name
    try:
        r = subprocess.run([RSCRIPT, path], capture_output=True, text=True,
                           timeout=300, encoding='utf-8', errors='replace')
    except subprocess.TimeoutExpired:
        fail('R execution timed out')
        return
    finally:
        os.unlink(path)

    out = (r.stdout or '')
    if 'Error' in (r.stderr or '') and '<<<Q' not in out:
        fail('R execution failed: ' + (r.stderr or '')[:200])
        return

    blocks = {}
    cur = None
    for line in out.splitlines():
        m = re.match(r'<<<Q(\d+)>>>', line.strip())
        if m:
            cur = int(m.group(1))
            blocks[cur] = []
        elif cur is not None:
            blocks[cur].append(line)

    def norm(s):
        return '\n'.join(l.rstrip() for l in s.strip().splitlines() if l.strip())

    matched = 0
    for i, claimed in claims:
        actual = norm('\n'.join(blocks.get(i, [])))
        if not claimed:
            warn(f'output q{i}: no #> output stated in the code block')
            continue
        if norm(claimed) != actual:
            fail(f'output q{i}: stated output does not match real R\n'
                 f'        claimed: {norm(claimed)[:160]!r}\n'
                 f'        actual:  {actual[:160]!r}')
        else:
            matched += 1
    if matched:
        ok(f'{matched} output question(s) verified against real R 4.6.0')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('assessment_id')
    ap.add_argument('--skip-execution', action='store_true')
    a = ap.parse_args()

    aid = a.assessment_id
    path = os.path.join(BANK_DIR, f'{aid}.json')
    if not os.path.exists(path):
        print(f'=== GATE FAILED: no bank at {path} ===')
        return 1
    bank = json.load(open(path, encoding='utf-8'))
    metas = json.load(open(META_PATH, encoding='utf-8'))
    meta = metas.get(aid) or {}

    n = len(bank.get('questions') or [])
    print(f'=== assessment_quality_check: {aid} ({meta.get("title", "?")}, {n} questions) ===')
    check_structure(aid, bank, meta)
    if not a.skip_execution:
        check_execution(aid, bank)

    print(f'=== GATE {"FAILED" if fails else "PASSED"}: {len(fails)} FAIL, {len(warns)} warn ===')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())

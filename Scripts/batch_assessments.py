"""Batch orchestrator for section assessment banks.

One FRESH `claude -p` subprocess per section, so no context bleeds between
banks. Per section: write the bank -> run the gate -> seed it to D1. State in
assessments-status.json makes the run resumable.

    python Scripts/batch_assessments.py --all
    python Scripts/batch_assessments.py --id ts-2 --id ts-3
    python Scripts/batch_assessments.py --book time-series
    python Scripts/batch_assessments.py --regenerate      # retry failed/gate_failed
    python Scripts/batch_assessments.py --dry-run
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(REPO_ROOT)
META_PATH = os.path.join(REPO_ROOT, 'functions', '_data', 'assessments.json')
BANK_DIR = os.path.join(REPO_ROOT, '_assessments')
STATUS_PATH = os.path.join(REPO_ROOT, 'assessments-status.json')
LOCK_PATH = os.path.join(REPO_ROOT, 'Scripts', 'batch_assessments.lock')
SKILL_PATH = os.path.join(PROJECT_ROOT, '.claude', 'skills', 'write-assessment', 'SKILL.md')

# Model pinned explicitly. Never inherit the CLI default: it changes without
# notice and leaves no record of who authored the content.
BATCH_MODEL = 'claude-opus-5'
BATCH_EFFORT = 'xhigh'
WRITE_TIMEOUT = 3600


def log(msg):
    print(f'[{datetime.now():%H:%M:%S}] {msg}', flush=True)


def load_status():
    if os.path.exists(STATUS_PATH):
        return json.load(open(STATUS_PATH, encoding='utf-8'))
    return {}


def save_status(st):
    with open(STATUS_PATH, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(st, f, indent=1, ensure_ascii=False)
        f.write('\n')


def inline_skill_prompt(aid, meta):
    """CLI 2.1.207+ does not resolve slash commands in `claude -p`, so the
    skill body is inlined as the prompt (same pattern as batch_pseo)."""
    body = open(SKILL_PATH, encoding='utf-8').read()
    # Strip the YAML frontmatter. Left in, the prompt starts with '---' and the
    # CLI parses it as an option: "error: unknown option '---".
    if body.lstrip().startswith('---'):
        parts = body.lstrip().split('---', 2)
        if len(parts) == 3:
            body = parts[2].lstrip()
    chapters = '\n'.join(f'  - {s}' for s in meta.get('chapter_slugs', []))
    return (
        f'{body}\n\n---\n\n'
        f'## This run\n\n'
        f'Write the question bank for assessment id `{aid}`.\n\n'
        f'- Section title: {meta["title"]}\n'
        f'- Book: {meta["book_title"]}, Part {meta["section"]}\n'
        f'- Chapters IN SCOPE (the only pages you may draw on, and the only '
        f'valid chapter_slug values):\n{chapters}\n\n'
        f'Write exactly 30 questions to `_assessments/{aid}.json` and stop. '
        f'Do not run the gate, do not seed, do not commit: the orchestrator '
        f'owns those steps.'
    )


def run_write(aid, meta, claude, dry):
    prompt = inline_skill_prompt(aid, meta)
    if dry:
        log(f'  DRY-RUN write: {aid}')
        return 0
    log(f'+ write-assessment {aid}  (--model {BATCH_MODEL} --effort {BATCH_EFFORT})')
    try:
        r = subprocess.run(
            [claude, '-p', prompt, '--dangerously-skip-permissions',
             '--model', BATCH_MODEL, '--effort', BATCH_EFFORT],
            cwd=REPO_ROOT, timeout=WRITE_TIMEOUT)
        return r.returncode
    except subprocess.TimeoutExpired:
        log(f'  TIMEOUT after {WRITE_TIMEOUT}s')
        return -1


def run_gate(aid):
    r = subprocess.run(
        [sys.executable, os.path.join('Scripts', 'assessment_quality_check.py'), aid],
        cwd=REPO_ROOT, capture_output=True, text=True,
        encoding='utf-8', errors='replace', timeout=900)
    out = (r.stdout or '') + (r.stderr or '')
    for line in out.splitlines():
        if '[FAIL]' in line or 'GATE' in line:
            log('    ' + line.strip())
    return r.returncode == 0


def run_seed(aid, dry):
    if dry:
        return True
    r = subprocess.run(
        [sys.executable, os.path.join('Scripts', 'seed_assessments.py'), aid, '--env', 'both'],
        cwd=REPO_ROOT, capture_output=True, text=True,
        encoding='utf-8', errors='replace', timeout=900)
    okd = r.returncode == 0
    log('    seed: ' + ('ok' if okd else 'FAILED'))
    if not okd:
        log('    ' + ((r.stdout or '') + (r.stderr or ''))[-400:])
    return okd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--id', action='append', dest='ids')
    ap.add_argument('--book', help='time-series | statistics')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--regenerate', action='store_true',
                    help='retry ids in failed / gate_failed state')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--claude', default='claude')
    a = ap.parse_args()

    if os.path.exists(LOCK_PATH) and not a.dry_run:
        log(f'lock present at {LOCK_PATH}; another batch is running'); return 1

    metas = json.load(open(META_PATH, encoding='utf-8'))
    st = load_status()

    if a.ids:
        targets = [i for i in a.ids if i in metas]
    elif a.regenerate:
        targets = [i for i in sorted(metas) if st.get(i, {}).get('status') in ('failed', 'gate_failed')]
    else:
        targets = sorted(metas)
        if a.book:
            targets = [i for i in targets if metas[i]['book'] == a.book]
        if not a.all and not a.book:
            log('specify --all, --book, --id or --regenerate'); return 1
        targets = [i for i in targets if st.get(i, {}).get('status') != 'done']

    if a.max:
        targets = targets[:a.max]
    if not targets:
        log('nothing to do'); return 0

    claude = shutil.which(a.claude)
    if not claude and not a.dry_run:
        log(f"'{a.claude}' not found in PATH"); return 1

    log(f'ASSESSMENT BATCH ({BATCH_MODEL}/{BATCH_EFFORT}). Targets ({len(targets)}): ' + ', '.join(targets))
    if not a.dry_run:
        os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)
        open(LOCK_PATH, 'w').write(str(os.getpid()))

    done = 0
    try:
        for n, aid in enumerate(targets, start=1):
            meta = metas[aid]
            log(f'[{n}/{len(targets)}] {aid}  {meta["title"]}')
            st.setdefault(aid, {})
            st[aid].update(status='writing', started=datetime.now().isoformat(timespec='minutes'))
            save_status(st)

            rc = run_write(aid, meta, claude, a.dry_run)
            if rc != 0 or (not a.dry_run and not os.path.exists(os.path.join(BANK_DIR, f'{aid}.json'))):
                log(f'  write failed: {aid}')
                st[aid]['status'] = 'failed'; save_status(st); continue

            if a.dry_run:
                log(f'  DRY-RUN would gate + seed {aid}'); continue

            if not run_gate(aid):
                log(f'  GATE FAILED: {aid}')
                st[aid]['status'] = 'gate_failed'; save_status(st); continue

            if not run_seed(aid, a.dry_run):
                st[aid]['status'] = 'seed_failed'; save_status(st); continue

            bank = json.load(open(os.path.join(BANK_DIR, f'{aid}.json'), encoding='utf-8'))
            st[aid].update(status='done', questions=len(bank['questions']),
                           finished=datetime.now().isoformat(timespec='minutes'))
            save_status(st)
            done += 1
            log(f'  SEEDED {aid} ({len(bank["questions"])} questions)')
    finally:
        if os.path.exists(LOCK_PATH):
            os.unlink(LOCK_PATH)

    log(f'Batch complete: {done} bank(s) seeded.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

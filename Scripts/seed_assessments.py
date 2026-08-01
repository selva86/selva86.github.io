"""Seed a question bank from _assessments/<id>.json into D1.

Banks are authored as JSON in _assessments/ (versioned, reviewable) and pushed
into the assessment_questions table. The browser never sees these files: the
API serves questions with answers stripped.

    python Scripts/seed_assessments.py ts-1 [--env prod|dev|both]
    python Scripts/seed_assessments.py --all --env both
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import time

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK_DIR = os.path.join(REPO_ROOT, '_assessments')
DBS = {'dev': 'r-stats-dev', 'prod': 'r-stats-prod'}


def sql_str(v):
    if v is None:
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"


def bank_to_sql(aid, bank):
    now = int(time.time())
    lines = [f"DELETE FROM assessment_questions WHERE assessment_id = {sql_str(aid)};"]
    for i, q in enumerate(bank['questions'], start=1):
        qid = f"{aid}:{i:02d}"
        lines.append(
            "INSERT INTO assessment_questions "
            "(id, assessment_id, kind, prompt, code, options_json, answer_json, why, "
            "chapter_slug, chapter_title, difficulty, active, created_at) VALUES ("
            f"{sql_str(qid)}, {sql_str(aid)}, {sql_str(q['kind'])}, {sql_str(q['prompt'])}, "
            f"{sql_str(q.get('code'))}, {sql_str(json.dumps(q['options'], ensure_ascii=False))}, "
            f"{sql_str(json.dumps(q['answer'], ensure_ascii=False))}, {sql_str(q.get('why'))}, "
            f"{sql_str(q['chapter_slug'])}, {sql_str(q['chapter_title'])}, "
            f"{sql_str(q.get('difficulty', 'intermediate'))}, 1, {now});"
        )
    return '\n'.join(lines) + '\n'


def validate(aid, bank):
    """Cheap structural checks. The real gate is assessment_quality_check.py."""
    errs = []
    qs = bank.get('questions') or []
    if len(qs) < 12:
        errs.append(f'{aid}: only {len(qs)} questions, need at least 12')
    for i, q in enumerate(qs, start=1):
        where = f'{aid} q{i}'
        if q.get('kind') not in ('single', 'multi', 'output'):
            errs.append(f'{where}: bad kind {q.get("kind")!r}')
        opts = q.get('options') or []
        keys = [o.get('key') for o in opts]
        if len(opts) < 3:
            errs.append(f'{where}: {len(opts)} options, need at least 3')
        if len(set(keys)) != len(keys):
            errs.append(f'{where}: duplicate option keys')
        texts = [str(o.get('text', '')).strip().lower() for o in opts]
        if len(set(texts)) != len(texts):
            errs.append(f'{where}: duplicate option text')
        ans = q.get('answer') or []
        if not ans:
            errs.append(f'{where}: no answer')
        if any(a not in keys for a in ans):
            errs.append(f'{where}: answer key not among options')
        if q.get('kind') == 'single' and len(ans) != 1:
            errs.append(f'{where}: single-answer question with {len(ans)} answers')
        if q.get('kind') == 'multi' and len(ans) < 2:
            errs.append(f'{where}: multi question needs at least 2 answers')
        if q.get('kind') == 'output' and not q.get('code'):
            errs.append(f'{where}: output question with no code block')
        for bad in ('all of the above', 'none of the above', 'both a and b'):
            if any(bad in t for t in texts):
                errs.append(f'{where}: contains "{bad}"')
        if not q.get('chapter_slug'):
            errs.append(f'{where}: no chapter_slug')
        elif not os.path.exists(os.path.join(REPO_ROOT, q['chapter_slug'] + '.html')):
            errs.append(f'{where}: chapter {q["chapter_slug"]}.html does not exist')
    return errs


def push(sql_text, env):
    tmp = os.path.join(REPO_ROOT, '_build', 'migrations', f'_seed_tmp_{env}.sql')
    with open(tmp, 'w', encoding='utf-8', newline='\n') as f:
        f.write(sql_text)
    cmd = f'npx wrangler d1 execute {DBS[env]} --remote --file "{tmp}" --yes'
    # encoding must be explicit: wrangler emits unicode and Windows defaults
    # to cp1252, which crashes the reader thread mid-seed.
    r = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True,
                       shell=True, encoding='utf-8', errors='replace')
    os.unlink(tmp)
    if r.returncode != 0:
        print((r.stdout or '')[-1500:])
        print((r.stderr or '')[-1500:])
    return r.returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--env', default='dev', choices=['dev', 'prod', 'both'])
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    if a.all:
        paths = sorted(glob.glob(os.path.join(BANK_DIR, '*.json')))
    else:
        paths = [os.path.join(BANK_DIR, f'{i}.json') for i in a.ids]
    if not paths:
        print('nothing to seed'); return 1

    all_sql, errors, n = [], [], 0
    for p in paths:
        aid = os.path.basename(p)[:-5]
        if not os.path.exists(p):
            errors.append(f'{aid}: no bank file'); continue
        bank = json.load(open(p, encoding='utf-8'))
        e = validate(aid, bank)
        if e:
            errors.extend(e); continue
        all_sql.append(bank_to_sql(aid, bank))
        n += 1
        print(f'  ok {aid}: {len(bank["questions"])} questions')

    if errors:
        print('\nVALIDATION FAILED')
        for e in errors[:30]:
            print('  ' + e)
        return 1
    if a.dry_run:
        print(f'dry run: {n} bank(s) would be seeded'); return 0

    envs = ['dev', 'prod'] if a.env == 'both' else [a.env]
    sql = '\n'.join(all_sql)
    for env in envs:
        ok = push(sql, env)
        print(f'{"SEEDED" if ok else "FAILED"} {n} bank(s) -> {DBS[env]}')
        if not ok:
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())

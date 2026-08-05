#!/usr/bin/env python
"""Batch orchestrator for The Publishing Handbook.

    /write-handbook-chapter -> handbook_quality_check.py
                            -> /check-handbook-chapter -> /publish-tut
      (writer)                 (deterministic gate)
                                    (fresh-eyes judge)     (mechanical publisher)

The judge phase exists because the gate is deliberately mechanical and carries
no prose rules: the six regex "phrase families" it used to warn on were removed
2026-08-06 after they fired on sentences the authoring contract itself endorses.
A tic and a legitimate summary differ semantically, not lexically, so the call
needs a reader. `/check-handbook-chapter` is that reader, in a FRESH subprocess
(never the author's context), with bounded prose-only fix authority.

Handbook chapters are NOT in curriculum-status.json (they carry
curriculum_id: null), so batch_tutorials_v2.py cannot drive them. This script
drives from handbook-status.json instead, which is seeded from
Plans/publishing-handbook-plan.md.

One fresh `claude -p` per chapter, same as every other factory here: clean
context per chapter is what stops quality decaying across a long run.

Reuses batch_tutorials.py for the lock, the skill inliner, the spawn helpers and
the model policy. Importing it does not run its main().

Usage
-----
    python Scripts/batch_handbook.py --chapter 34
    python Scripts/batch_handbook.py --part 12 --max 6
    python Scripts/batch_handbook.py --pending --max 6
    python Scripts/batch_handbook.py --regenerate      # retry failed/manual_review
    python Scripts/batch_handbook.py --chapter 35 --skip-judge   # rerun, gate only
    python Scripts/batch_handbook.py --dry-run
"""
import os, sys, json, argparse, subprocess, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import batch_tutorials as bt

ROOT = bt.ROOT
WRITER = 'write-handbook-chapter'
STATUS = os.path.join(ROOT, 'handbook-status.json')
# Handbook chapters use a fixed section template and never carry FAQ / Summary /
# References or a post_plans/ plan file, so tutorial_quality_check.py fails good
# chapters for purely structural reasons. handbook_quality_check.py enforces the
# template from .claude/skills/write-handbook-chapter/SKILL.md and reuses the
# same R execution check.
GATE = os.path.join(ROOT, 'Scripts', 'handbook_quality_check.py')
JUDGE = 'check-handbook-chapter'
REVIEW_LOG = os.path.join(ROOT, 'Scripts', 'handbook-review.log')


# ---------------------------------------------------------------- state

def load_status():
    if not os.path.exists(STATUS):
        sys.exit('handbook-status.json not found. Seed it first:\n'
                 '  python Scripts/build_handbook_tracker.py')
    with open(STATUS, encoding='utf-8') as f:
        return json.load(f)


def save_status(rows):
    tmp = STATUS + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    os.replace(tmp, STATUS)


def set_state(rows, num, **kw):
    for r in rows:
        if r['chapter'] == num:
            r.update(kw)
            r['updated'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
            break
    save_status(rows)


# ---------------------------------------------------------------- phases

def write_chapter(row, cli, timeout):
    """Spawn one worker with the handbook skill inlined. Argument is the chapter
    number; the skill resolves title and part from the plan itself."""
    arg = str(row['chapter'])
    prompt = bt.compose_prompt(WRITER, arg)
    print('+ [%s] %s ch%s | %s  (--model %s --effort %s)'
          % (datetime.datetime.now().strftime('%H:%M'), WRITER, row['chapter'],
             row['title'], bt.BATCH_MODEL, bt.BATCH_EFFORT), flush=True)
    try:
        proc = subprocess.Popen(
            [cli, '-p', '--dangerously-skip-permissions',
             '--model', bt.BATCH_MODEL, '--effort', bt.BATCH_EFFORT,
             '--settings', bt.WRITER_SETTINGS],
            stdin=subprocess.PIPE, cwd=bt.PROJECT_ROOT, text=True, encoding='utf-8')
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127
    try:
        proc.communicate(input=prompt, timeout=timeout or None)
        return proc.returncode
    except subprocess.TimeoutExpired:
        print('  TIMEOUT: ch%s produced nothing in %ss - killing worker.'
              % (row['chapter'], timeout), flush=True)
        bt._kill_tree(proc.pid)
        try:
            proc.communicate(timeout=20)
        except Exception:
            pass
        return 124


def find_slug(row):
    """The skill derives its own slug. Locate what it actually wrote."""
    if row.get('slug'):
        p = os.path.join(ROOT, 'posts', row['slug'] + '.md')
        if os.path.exists(p):
            return row['slug']
    # fall back to newest posts/*.md touched in the last 20 minutes
    import glob, time
    cutoff = time.time() - 1200
    cands = [(os.path.getmtime(p), p) for p in glob.glob(os.path.join(ROOT, 'posts', '*.md'))
             if os.path.getmtime(p) > cutoff]
    if not cands:
        return None
    return os.path.splitext(os.path.basename(max(cands)[1]))[0]


def run_gate(slug):
    # The gate resolves its argument with os.path.exists, so it needs the path
    # to the markdown, not a bare slug. Passing the slug fails "file not found"
    # even when the chapter was written correctly.
    target = os.path.join('posts', slug + '.md')
    r = subprocess.run([sys.executable, GATE, target], cwd=ROOT,
                       text=True, encoding='utf-8', errors='replace',
                       capture_output=True)
    sys.stdout.write(r.stdout or '')
    sys.stderr.write(r.stderr or '')
    return r.returncode


def judge(slug, cli, timeout):
    """Fresh-eyes prose review. Spawned exactly like the writer (fresh context,
    same model + settings), at lower effort: judging one 1,500-word chapter is a
    smaller job than writing it.

    Returns (rc, blocked). `blocked` is the belt-and-braces signal: the skill is
    told to exit non-zero on NEEDS REWRITE, but `claude -p` does not reliably
    propagate an agent's intended exit status, so a line appended to
    Scripts/handbook-review.log naming this slug counts as a block too."""
    before = os.path.getsize(REVIEW_LOG) if os.path.exists(REVIEW_LOG) else 0
    prompt = bt.compose_prompt(JUDGE, slug)
    print('+ [%s] %s %s  (--model %s --effort high)'
          % (datetime.datetime.now().strftime('%H:%M'), JUDGE, slug, bt.BATCH_MODEL),
          flush=True)
    try:
        proc = subprocess.Popen(
            [cli, '-p', '--dangerously-skip-permissions',
             '--model', bt.BATCH_MODEL, '--effort', 'high',
             '--settings', bt.WRITER_SETTINGS],
            stdin=subprocess.PIPE, cwd=bt.PROJECT_ROOT, text=True, encoding='utf-8')
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127, False
    try:
        proc.communicate(input=prompt, timeout=timeout or None)
        rc = proc.returncode
    except subprocess.TimeoutExpired:
        print('  TIMEOUT: judge for %s produced nothing in %ss - killing worker.'
              % (slug, timeout), flush=True)
        bt._kill_tree(proc.pid)
        try:
            proc.communicate(timeout=20)
        except Exception:
            pass
        rc = 124
    blocked = False
    if os.path.exists(REVIEW_LOG) and os.path.getsize(REVIEW_LOG) > before:
        with open(REVIEW_LOG, encoding='utf-8', errors='replace') as f:
            f.seek(before)
            tail = f.read()
        if slug in tail:
            blocked = True
            print('  judge logged a blocking review:\n    %s' % tail.strip()[:400])
    return rc, blocked


def publish(slug, cli, timeout):
    prompt = bt.compose_prompt('publish-tut', slug)
    proc = subprocess.Popen(
        [cli, '-p', '--dangerously-skip-permissions',
         '--model', bt.BATCH_MODEL, '--effort', 'medium',
         '--settings', bt.WRITER_SETTINGS],
        stdin=subprocess.PIPE, cwd=bt.PROJECT_ROOT, text=True, encoding='utf-8')
    try:
        proc.communicate(input=prompt, timeout=timeout or None)
        return proc.returncode
    except subprocess.TimeoutExpired:
        bt._kill_tree(proc.pid)
        return 124


# ---------------------------------------------------------------- driver

def select(rows, args):
    out = []
    for r in rows:
        if args.chapter and r['chapter'] not in args.chapter:
            continue
        if args.part and r['part'] != args.part:
            continue
        st = r.get('status', 'pending')
        if args.regenerate:
            if st not in ('quality_failed', 'manual_review', 'failed'):
                continue
        elif st == 'published':
            continue
        out.append(r)
    if args.max:
        out = out[:args.max]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--chapter', type=int, action='append',
                    help='chapter number; repeatable')
    ap.add_argument('--part', type=int, help='handbook part filter')
    ap.add_argument('--pending', action='store_true', help='all not-yet-published')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--regenerate', action='store_true',
                    help='retry quality_failed / manual_review / failed')
    ap.add_argument('--skip-judge', action='store_true',
                    help='skip the /check-handbook-chapter reviewer pass. For '
                         'reruns of a chapter already judged, or when only the '
                         'deterministic gate is being retested.')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--claude', default='claude')
    ap.add_argument('--timeout', type=int, default=1800)
    ap.add_argument('--sync-every', type=int, default=5)
    args = ap.parse_args()

    rows = load_status()
    todo = select(rows, args)
    if not todo:
        print('Nothing to do.')
        return 0

    print('Publishing Handbook batch: %d chapter(s)' % len(todo))
    if args.dry_run:
        for r in todo:
            print('  would: ch%-3s part %-2s  %s  [%s]'
                  % (r['chapter'], r['part'], r['title'], r.get('status', 'pending')))
        return 0

    # Same lock file as batch_tutorials, deliberately: both spawn workers and
    # both touch the shared registries, so they must never run concurrently.
    if os.path.exists(bt.LOCK):
        print('WARNING: clearing a stale lock (%s) from an interrupted run.' % bt.LOCK)
        try:
            os.remove(bt.LOCK)
        except OSError:
            pass
    open(bt.LOCK, 'w').close()

    ok = fail = 0
    try:
        for i, row in enumerate(todo, 1):
            n = row['chapter']
            print('\n=== [%d/%d] chapter %s: %s ===' % (i, len(todo), n, row['title']))

            # 'written' = the markdown is already on disk and good enough to
            # gate; 'reviewing' = it also already passed the gate and the run
            # died inside the judge. Re-running the writer would throw either
            # away, so resume at the gate instead.
            already = (row.get('status') in ('written', 'reviewing') and row.get('slug') and
                       os.path.exists(os.path.join(ROOT, 'posts', row['slug'] + '.md')))
            if already:
                slug = row['slug']
                print('  already written (%s) - skipping the writer, resuming at the gate' % slug)
            else:
                set_state(rows, n, status='writing')

                rc = write_chapter(row, args.claude, args.timeout)
                if rc != 0:
                    print('  write failed (rc=%s)' % rc)
                    set_state(rows, n, status='failed')
                    fail += 1
                    continue

                slug = find_slug(row)
                if not slug:
                    print('  write produced no markdown')
                    set_state(rows, n, status='failed')
                    fail += 1
                    continue
                set_state(rows, n, slug=slug)

            bt_changed = 0
            try:
                import batch_tutorials_v2 as v2
                bt_changed = v2.sanitize_md(slug)
            except Exception as e:
                print('  sanitize skipped: %s' % e)
            if bt_changed:
                print('  sanitized %d line(s)' % bt_changed)

            if run_gate(slug) != 0:
                print('  GATE FAILED -> manual_review')
                set_state(rows, n, status='quality_failed')
                fail += 1
                continue

            if not args.skip_judge:
                set_state(rows, n, status='reviewing')
                rc, blocked = judge(slug, args.claude, args.timeout)
                if rc != 0 or blocked:
                    print('  JUDGE flagged the chapter (rc=%s%s) -> manual_review, '
                          'not publishing (see Scripts/handbook-review.log)'
                          % (rc, ', review log' if blocked else ''))
                    set_state(rows, n, status='manual_review')
                    fail += 1
                    continue

            if publish(slug, args.claude, args.timeout) != 0:
                print('  publish failed')
                set_state(rows, n, status='manual_review')
                fail += 1
                continue

            set_state(rows, n, status='published',
                      url='https://r-statistics.co/%s.html' % slug)
            ok += 1
            print('  PUBLISHED-PUSHED %s' % slug)

            if args.sync_every and ok % args.sync_every == 0:
                subprocess.run([sys.executable,
                                os.path.join(ROOT, '_build', 'sync_registries.py')],
                               cwd=ROOT)
    finally:
        try:
            os.remove(bt.LOCK)
        except OSError:
            pass

    print('\nBatch complete: %d published, %d failed' % (ok, fail))
    return 0 if fail == 0 else 1


if __name__ == '__main__':
    sys.exit(main())

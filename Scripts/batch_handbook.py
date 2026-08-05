#!/usr/bin/env python
"""Batch orchestrator for The Publishing Handbook.

    /write-handbook-chapter  ->  tutorial_quality_check.py  ->  /publish-tut

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
    python Scripts/batch_handbook.py --dry-run
"""
import os, sys, json, argparse, subprocess, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import batch_tutorials as bt

ROOT = bt.ROOT
WRITER = 'write-handbook-chapter'
STATUS = os.path.join(ROOT, 'handbook-status.json')
GATE = os.path.join(ROOT, 'Scripts', 'tutorial_quality_check.py')


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
    r = subprocess.run([sys.executable, GATE, slug], cwd=ROOT,
                       text=True, encoding='utf-8', errors='replace',
                       capture_output=True)
    sys.stdout.write(r.stdout or '')
    sys.stderr.write(r.stderr or '')
    return r.returncode


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

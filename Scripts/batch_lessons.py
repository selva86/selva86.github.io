#!/usr/bin/env python3
"""Batch orchestrator for interactive lessons - one FRESH `claude -p` subprocess
per lesson (clean context each = the scaling fix), mirroring Scripts/batch_pseo.py.

Per lesson: /write-lesson -> verify the md exists -> /publish-lesson --skip-sync
-> record status in lessons-status.json (resumable). A periodic catalog/manifest
sync avoids one giant end-of-batch sync. A lock file prevents concurrent runs.

The Python orchestrator is the SCALER (fresh process per lesson); the SKILLS are
the per-lesson workers. The skills/gate are the quality lever.

Usage:
  python Scripts/batch_lessons.py --slug RF-Course-Lesson-2     # one lesson
  python Scripts/batch_lessons.py --course random-forest        # a course's lessons
  python Scripts/batch_lessons.py --max 20                      # pending in tracker, capped
  python Scripts/batch_lessons.py --regenerate                  # also retry failed
  python Scripts/batch_lessons.py --dry-run                     # plan only, no spawns
Flags: --sync-every N (default 5), --claude <cli path>.

lessons-status.json is gitignored (resumable state) and blocked by the middleware.
"""
import os, sys, json, argparse, subprocess

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
# The skills use "selva86.github.io/..." paths, so a spawned claude must run from
# the PROJECT ROOT (one level above the repo), like the other batch drivers.
PROJECT_ROOT = os.path.dirname(ROOT)
STATUS = os.path.join(ROOT, 'lessons-status.json')
LOCK = os.path.join(ROOT, 'Scripts', 'batch_lessons.lock')
COURSES = os.path.join(ROOT, 'courses.json')
FAILLOG = os.path.join(ROOT, 'Scripts', 'lesson-failures.log')


def load_json(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def save_status(s):
    with open(STATUS, 'w', encoding='utf-8') as f:
        json.dump(s, f, indent=2)


def resolve_targets(args):
    """Ordered list of lesson slugs to build."""
    if args.slug:
        return args.slug
    if args.course:
        for c in load_json(COURSES, {}).get('courses', []):
            if c.get('course_id') == args.course:
                return [l['slug'] for l in sorted(c.get('lessons', []), key=lambda x: x.get('order', 0))]
        print('Course "%s" not in courses.json.' % args.course)
        return []
    st = load_json(STATUS, {})
    want = {'pending'} | ({'failed', 'publish_failed'} if args.regenerate else set())
    return [slug for slug, v in st.items() if v.get('status', 'pending') in want]


def run_claude(cli, prompt):
    print('+ %s -p "%s"  (cwd=%s)' % (cli, prompt, PROJECT_ROOT), flush=True)
    try:
        return subprocess.run([cli, '-p', prompt, '--dangerously-skip-permissions'], cwd=PROJECT_ROOT).returncode
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127


def sync():
    subprocess.run([sys.executable, os.path.join('Scripts', 'build_lessons_tracker.py')], cwd=ROOT)
    subprocess.run([sys.executable, os.path.join('_build', 'build_exercise_manifest.py')], cwd=ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', action='append', help='lesson slug; repeatable to build several in ONE run (no chaining)')
    ap.add_argument('--course')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--regenerate', action='store_true')
    ap.add_argument('--sync-every', type=int, default=5)
    ap.add_argument('--claude', default='claude')
    args = ap.parse_args()

    targets = resolve_targets(args)
    if args.max and len(targets) > args.max:
        targets = targets[:args.max]
    if not targets:
        print('No target lessons. Pass --slug <s>, --course <id>, or populate lessons-status.json (pending).')
        return 0

    print('Targets (%d): %s' % (len(targets), ', '.join(targets)))
    if args.dry_run:
        for s in targets:
            print('  would: /write-lesson %s   then   /publish-lesson %s --skip-sync' % (s, s))
        print('Dry run: no subprocesses spawned, no state changed.')
        return 0

    if os.path.exists(LOCK):
        # A prior run killed by a timeout/SIGTERM cannot reach its finally clause,
        # so it leaves a stale lock that would block the next run forever. Treat an
        # existing lock as stale and clear it (this factory runs sequentially).
        print('WARNING: clearing a stale lock (%s) left by a previous interrupted run.' % LOCK)
        try:
            os.remove(LOCK)
        except OSError:
            pass
    open(LOCK, 'w').close()
    st = load_json(STATUS, {})
    done = 0
    try:
        for i, slug in enumerate(targets, 1):
            if st.get(slug, {}).get('status') == 'done' and not args.regenerate:
                print('[%d/%d] %s already done, skip' % (i, len(targets), slug))
                continue
            print('[%d/%d] %s' % (i, len(targets), slug))
            st[slug] = {'course_id': args.course or st.get(slug, {}).get('course_id', ''), 'status': 'writing'}
            save_status(st)

            if run_claude(args.claude, '/write-lesson ' + slug) != 0 or not os.path.exists(os.path.join(ROOT, 'lessons', slug + '.md')):
                st[slug]['status'] = 'failed'
                save_status(st)
                print('  write failed: %s (see %s)' % (slug, os.path.relpath(FAILLOG, ROOT)))
                continue

            st[slug]['status'] = 'publishing'
            save_status(st)
            if run_claude(args.claude, '/publish-lesson %s --skip-sync' % slug) != 0:
                st[slug]['status'] = 'publish_failed'
                save_status(st)
                print('  publish failed: %s' % slug)
                continue

            st[slug]['status'] = 'done'
            save_status(st)
            done += 1
            if args.sync_every and done % args.sync_every == 0:
                sync()
        sync()
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass
    print('Batch complete: %d built.' % done)
    return 0


if __name__ == '__main__':
    sys.exit(main())

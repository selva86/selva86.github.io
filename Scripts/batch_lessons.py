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


def _kill_tree(pid):
    """Kill a process AND every descendant: the spawned claude plus its
    interactive-R verifier (node), any MCP servers, and child claudes. A bare
    kill of the parent would orphan those children, which is exactly what hung
    a prior run. Best-effort and idempotent."""
    if os.name == 'nt':
        subprocess.run(['taskkill', '/T', '/F', '/PID', str(pid)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        import signal
        try:
            os.killpg(os.getpgid(pid), signal.SIGKILL)
        except Exception:
            try:
                os.kill(pid, signal.SIGKILL)
            except Exception:
                pass


# The batch runs each lesson subprocess on an EXPLICIT model + effort, decoupled from
# the CLI default, so the owner can set their interactive default to anything (e.g. Fable)
# without changing what the batch uses. Opus 4.8 + xhigh effort chosen 2026-07-03 for the
# dense DS-Advanced material (the Fable default hit its quota mid-§18). Edit here to change.
BATCH_MODEL = 'claude-opus-4-8'   # pinned to Opus 4.8 explicitly (NOT the 'opus' alias, NOT Fable)
BATCH_EFFORT = 'xhigh'            # low | medium | high | xhigh | max

# The user-global ~/.claude/CLAUDE.md is an SEO/article-writing persona ("be concise",
# "length follows intent, not a quota", "world-class expert level"). Loaded into a lesson
# writer it fights the beginner-first teaching contract and produces rushed, dense lessons.
# So we EXCLUDE only that one file from every spawned writer/checker/publisher via the
# `claudeMdExcludes` setting (proven: it drops the global file, keeps the project CLAUDE.md
# and MEMORY.md, and does NOT touch auth). The lesson pipeline is driven by the skill +
# _build/lesson-pedagogy.md, which are self-contained.
_GLOBAL_CLAUDE_MD = os.path.expanduser('~/.claude/CLAUDE.md').replace('\\', '/')
WRITER_SETTINGS = json.dumps({'claudeMdExcludes': [_GLOBAL_CLAUDE_MD]})


def run_claude(cli, prompt, timeout=None):
    print('+ %s -p "%s"  (--model %s --effort %s, no-global-CLAUDE.md, cwd=%s)' % (cli, prompt, BATCH_MODEL, BATCH_EFFORT, PROJECT_ROOT), flush=True)
    try:
        proc = subprocess.Popen([cli, '-p', prompt, '--dangerously-skip-permissions',
                                 '--model', BATCH_MODEL, '--effort', BATCH_EFFORT,
                                 '--settings', WRITER_SETTINGS], cwd=PROJECT_ROOT)
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127
    try:
        return proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        # Self-heal: a step that produces nothing within the budget is treated as
        # hung. Tree-kill it (and its verifier children) and return non-zero so the
        # caller marks the lesson failed and moves on instead of blocking forever.
        print('  TIMEOUT: "%s" produced no result in %ss - killing the hung worker '
              '(and its verifier children) and moving on.' % (prompt, timeout), flush=True)
        _kill_tree(proc.pid)
        try:
            proc.wait(timeout=20)
        except Exception:
            pass
        return 124


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
    ap.add_argument('--timeout', type=int, default=1800,
                    help='per-step (write/check/publish) seconds before a worker is treated as '
                         'hung: tree-kill it, mark the lesson failed, and continue. 0 disables.')
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

            if run_claude(args.claude, '/write-lesson ' + slug, args.timeout or None) != 0 or not os.path.exists(os.path.join(ROOT, 'lessons', slug + '.md')):
                st[slug]['status'] = 'failed'
                save_status(st)
                print('  write failed: %s (see %s)' % (slug, os.path.relpath(FAILLOG, ROOT)))
                continue

            st[slug]['status'] = 'reviewing'
            save_status(st)
            if run_claude(args.claude, '/check-lesson ' + slug, args.timeout or None) != 0:
                st[slug]['status'] = 'manual_review'
                save_status(st)
                print('  review flagged manual_review: %s (see Scripts/lesson-review.log)' % slug)
                continue

            st[slug]['status'] = 'publishing'
            save_status(st)
            if run_claude(args.claude, '/publish-lesson %s --skip-sync' % slug, args.timeout or None) != 0:
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

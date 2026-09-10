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

from verify_state import verify_published   # artifact check, not exit-code trust

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
    want = {'pending', 'planned'} | ({'failed', 'publish_failed'} if args.regenerate else set())
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
BATCH_MODEL = 'claude-sonnet-5'   # Sonnet 5 by owner decision 2026-09-09 (preferred over Opus on 27 windowed rebuilds); override: edit here
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



# Stage briefs. Each fresh session gets an explicit working-directory line and
# repo-prefixed paths: the bare `/write-lesson <slug> --build` form resolved
# post_plans/ against the project root in ~50% of sessions and exited on
# "no plan file" (2026-09-10, Tidy-Temporal-Data-with-tsibble). Mirrors the
# inline briefs batch_windowed.py has used for every clean build.
_WD = ("Work from the project root; the repo is selva86.github.io/ and every "
       "repo path (lessons/, post_plans/, _build/, Scripts/, www/, Plans/) lives "
       "under selva86.github.io/. ")

def plan_prompt(slug):
    return ("Follow the skill at .claude/skills/write-lesson/SKILL.md in --plan-only mode "
            "for the lesson `%s`. " % slug + _WD +
            "The lesson's course arc is its entry in selva86.github.io/Plans/lessons-curriculum.md; "
            "derive its metadata per selva86.github.io/_build/lessons-derive.md. Produce ONLY "
            "selva86.github.io/post_plans/%s_lesson-plan.md. Do not write lesson prose. Do not run "
            "gates. Do not touch git." % slug)

def plan_check_prompt(slug):
    return ("Follow the skill at .claude/skills/check-lesson-plan/SKILL.md for the plan "
            "selva86.github.io/post_plans/%s_lesson-plan.md. " % slug + _WD +
            "Fix flow directly in the plan, then set `status: approved`. Do not approve an "
            "unfixable plan. Do not write lesson prose. Do not touch git.")

def build_prompt(slug):
    return ("Follow the skill at .claude/skills/write-lesson/SKILL.md in --build mode for the "
            "lesson `%s`. " % slug + _WD +
            "The plan at selva86.github.io/post_plans/%s_lesson-plan.md is stamped approved: build "
            "strictly from it (floor, not ceiling; never reorder or re-plan). Write "
            "selva86.github.io/lessons/%s.md, run both gates until green, and finish with the short "
            "summary the skill asks for. Do not publish, build the site, or touch git." % (slug, slug))

def check_prompt(slug):
    return ("Follow the skill at .claude/skills/check-lesson/SKILL.md for the lesson "
            "selva86.github.io/lessons/%s.md (its approved plan is at "
            "selva86.github.io/post_plans/%s_lesson-plan.md). " % (slug, slug) + _WD +
            "Apply bounded fixes, re-run both gates, and give the verdict the skill defines. "
            "Do not publish, build the site, or touch git.")

def publish_prompt(slug):
    return ("Follow the skill at .claude/skills/publish-lesson/SKILL.md for the lesson `%s` "
            "with --skip-sync. " % slug + _WD +
            "Commit to the CURRENT working branch and push that branch; never switch branches "
            "and never push to master.")

def run_claude(cli, prompt, timeout=None):
    print('+ %s -p "%s..."  (--model %s --effort %s, no-global-CLAUDE.md, cwd=%s)' % (cli, prompt[:90], BATCH_MODEL, BATCH_EFFORT, PROJECT_ROOT), flush=True)
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
    ap.add_argument('--plan-only', dest='plan_only', action='store_true',
                    help='write + review plans only; build later against the approved plans')
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

            # Three fresh sessions per lesson: plan -> plan review -> build.
            # The plan is a contract (status: approved) the builder may deepen
            # but never reorder; the flow gate runs while fixes are cheap.
            plan_path = os.path.join(ROOT, 'post_plans', slug + '_lesson-plan.md')
            approved_already = os.path.exists(plan_path) and 'status: approved' in open(plan_path, encoding='utf-8').read()
            if approved_already:
                print('  approved plan exists, skipping planner + plan review: %s' % slug)
            if not approved_already and (run_claude(args.claude, plan_prompt(slug), args.timeout or None) != 0 or not os.path.exists(plan_path)):
                st[slug]['status'] = 'plan_failed'
                save_status(st)
                print('  plan failed: %s (see %s)' % (slug, os.path.relpath(FAILLOG, ROOT)))
                continue
            if not approved_already and (run_claude(args.claude, plan_check_prompt(slug), args.timeout or None) != 0 or 'status: approved' not in open(plan_path, encoding='utf-8').read()):
                st[slug]['status'] = 'plan_review_failed'
                save_status(st)
                print('  plan review failed: %s' % slug)
                continue
            if args.plan_only:
                st[slug]['status'] = 'planned'
                save_status(st)
                print('  plan approved (plan-only): %s' % slug)
                continue
            if run_claude(args.claude, build_prompt(slug), args.timeout or None) != 0 or not os.path.exists(os.path.join(ROOT, 'lessons', slug + '.md')):
                st[slug]['status'] = 'failed'
                save_status(st)
                print('  write failed: %s (see %s)' % (slug, os.path.relpath(FAILLOG, ROOT)))
                continue

            st[slug]['status'] = 'reviewing'
            save_status(st)
            if run_claude(args.claude, check_prompt(slug), args.timeout or None) != 0:
                st[slug]['status'] = 'manual_review'
                save_status(st)
                print('  review flagged manual_review: %s (see Scripts/lesson-review.log)' % slug)
                continue

            st[slug]['status'] = 'publishing'
            save_status(st)
            if run_claude(args.claude, publish_prompt(slug), args.timeout or None) != 0:
                st[slug]['status'] = 'publish_failed'
                save_status(st)
                print('  publish failed: %s' % slug)
                continue

            # The exit code above proves nothing: `claude -p` exits 0 whether or
            # not the publisher finished. Check the artifacts before recording
            # done, or the tracker ends up claiming lessons the site never got.
            ok, why = verify_published(slug, fragment_dirs=('_lessons', '_posts'))
            if not ok:
                st[slug]['status'] = 'publish_failed'
                st[slug]['last_error'] = 'publish exited 0 but ' + why
                save_status(st)
                print('  publish UNVERIFIED: %s (%s) - marked publish_failed' % (slug, why))
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

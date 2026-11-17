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
  python Scripts/batch_lessons.py --resume                      # finish all not-done
  python Scripts/batch_lessons.py --regenerate                  # rebuild failed from scratch
  python Scripts/batch_lessons.py --dry-run                     # plan only, no spawns
Flags: --sync-every N (default 5), --claude <cli path>.

--resume is the flag to reach for after a halt. It resumes each lesson at the
stage that died, reusing the approved plan, the gated draft and the passed
review, so a relaunch costs only the work that is actually missing. That is
what makes repeated relaunching a safe recovery instead of a gamble; see
.claude/skills/ship-lessons/SKILL.md for the supervisor loop built on it.

lessons-status.json is gitignored (resumable state) and blocked by the middleware.
"""
import os, sys, json, time, shutil, argparse, subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verify_state import verify_published, ProcessStartFailure  # artifact check, not exit-code trust
import batch_tutorials as bt                # shared effective_timeout

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
# The skills use "selva86.github.io/..." paths, so a spawned claude must run from
# the PROJECT ROOT (one level above the repo), like the other batch drivers.
PROJECT_ROOT = os.path.dirname(ROOT)
STATUS = os.path.join(ROOT, 'lessons-status.json')
LOCK = os.path.join(ROOT, 'Scripts', 'batch_lessons.lock')
COURSES = os.path.join(ROOT, 'courses.json')


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
    # plan_failed and plan_review_failed belong here too. Without them a crashed
    # plan pass leaves entries no invocation can reach: a bare run sees only
    # pending/planned, --regenerate saw only failed/publish_failed, and the slugs
    # had to be retyped by hand (2026-11-14 out of memory, 2026-11-15 DNS drop).
    # 'writing', 'reviewing' and 'publishing' are in-flight labels. They can
    # only still be set if the run died mid-stage, and they used to appear in
    # NO resume set, which stranded the lesson permanently (Maximum-Likelihood
    # at 'writing' after the 2026-11-15 hang; Deep-Learning-DeepAR at
    # 'publishing'). manual_review stays out on purpose: it is a request for a
    # human, not a crash.
    # --resume selects the same wide set as --regenerate, but the stages then
    # resume rather than rebuild (see the cheap-resume block in main). That
    # split is the point: --regenerate means "do it again", --resume means
    # "finish what you started".
    want = {'pending', 'planned'} | ({'failed', 'publish_failed',
                                      'plan_failed', 'plan_review_failed',
                                      'writing', 'reviewing', 'publishing'}
                                     if (args.regenerate
                                         or getattr(args, 'resume', False)) else set())
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
# ABSOLUTE, not repo-prefixed. The relative form was itself a fix for workers
# resolving post_plans/ against the wrong directory, but it only moved the
# problem: with more than one worktree on disk "selva86.github.io/" names
# several trees on several branches, and a worker resolving it to the canonical
# one writes a finished plan into a tree this driver is not watching. The driver
# then reports a failure for work that was done (2026-09-25,
# Forecasting-Volatility-and-Value-at-Risk). An absolute path has one reading.
ROOTP = ROOT.replace(chr(92), "/")

_WD = ("Work from {root}, which is THE repo for this run. Every repo path "
       "(lessons/, post_plans/, _build/, Scripts/, www/, Plans/) is under that "
       "exact directory. Other checkouts of this repo exist on this machine on "
       "other branches; never read or write any of them, even if a path looks "
       "familiar. ").format(root=ROOTP)

def curriculum_title(slug):
    """The owner-approved catalog title from the slug's curriculum line
    (`N. <slug> - title: "<title>" - <focus> ...`), or '' when none is set.
    Passed to every writing and reviewing stage, the way batch_windowed.py
    passes the brief's title, so no stage invents or 'improves' it."""
    import re
    try:
        with open(os.path.join(ROOT, 'Plans', 'lessons-curriculum.md'), encoding='utf-8') as f:
            for line in f:
                m = re.match(r'\s*\d+\.\s+' + re.escape(slug) + r'\s+-\s+title:\s+"([^"]+)"', line)
                if m:
                    return m.group(1)
    except OSError:
        pass
    return ''

def _title_rule(slug):
    t = curriculum_title(slug)
    return ('The catalog title is fixed by the owner: "%s". Use it verbatim as the text '
            'after the colon in the frontmatter `title` and as the cover step H2; never '
            'retitle it. ' % t) if t else ''

def plan_prompt(slug):
    return ("Follow the skill at .claude/skills/write-lesson/SKILL.md in --plan-only mode "
            "for the lesson `{slug}`. " + _WD + _title_rule(slug) +
            "The lesson's course arc is its entry in {root}/Plans/lessons-curriculum.md; "
            "derive its metadata per {root}/_build/lessons-derive.md. Produce ONLY "
            "{root}/post_plans/{slug}_lesson-plan.md. Do not write lesson prose. Do not run "
            "gates. Do not touch git.").format(slug=slug, root=ROOTP)

def plan_check_prompt(slug):
    return ("Follow the skill at .claude/skills/check-lesson-plan/SKILL.md for the plan "
            "{root}/post_plans/{slug}_lesson-plan.md. " + _WD + _title_rule(slug) +
            "Fix flow directly in the plan, then set `status: approved`. Do not approve an "
            "unfixable plan. Do not write lesson prose. Do not touch git."
            ).format(slug=slug, root=ROOTP)

def build_prompt(slug):
    return ("Follow the skill at .claude/skills/write-lesson/SKILL.md in --build mode for the "
            "lesson `{slug}`. " + _WD + _title_rule(slug) +
            "The plan at {root}/post_plans/{slug}_lesson-plan.md is stamped approved: build "
            "strictly from it (floor, not ceiling; never reorder or re-plan). Write "
            "{root}/lessons/{slug}.md, run both gates until green, and finish with the short "
            "summary the skill asks for. Do not publish, build the site, or touch git."
            ).format(slug=slug, root=ROOTP)

def check_prompt(slug):
    return ("Follow the skill at .claude/skills/check-lesson/SKILL.md for the lesson "
            "{root}/lessons/{slug}.md (its approved plan is at "
            "{root}/post_plans/{slug}_lesson-plan.md). " + _WD + _title_rule(slug) +
            "Apply bounded fixes, re-run both gates, and give the verdict the skill defines. "
            "Do not publish, build the site, or touch git.").format(slug=slug, root=ROOTP)

def publish_prompt(slug):
    return ("Follow the skill at .claude/skills/publish-lesson/SKILL.md for the lesson `%s` "
            "with --skip-sync. " % slug + _WD +
            "Build only this page, in the foreground: `python _build/build.py --only %s` "
            "(a full build outlasts the shell timeout). This session is non-interactive: never "
            "run a command in the background or wait for a notification, because none arrives "
            "and the publish is lost (2026-10-04: five lessons built but never committed). "
            "Stage `screenshots/og/%s.png` with the page if it exists. "
            "Commit to the CURRENT working branch and push that branch; never switch branches "
            "and never push to master." % (slug, slug))

def _sibling_worktrees():
    """Every other checkout of this repo, so a misfiled artifact can be found."""
    try:
        out = subprocess.run(['git', '-C', ROOT, 'worktree', 'list', '--porcelain'],
                             capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return []
    paths = [ln.split(' ', 1)[1].strip() for ln in out.splitlines() if ln.startswith('worktree ')]
    here = os.path.normcase(os.path.normpath(ROOT))
    return [p for p in paths if os.path.normcase(os.path.normpath(p)) != here]


def rescue_misfiled(relpath):
    """Look for an artifact this run produced in a sibling worktree, and bring it home.

    A worker that resolves a repo path to the wrong checkout still did the work;
    only the destination was wrong. Treating that as a failure throws away a
    finished plan or lesson, so look before concluding. An existing local copy is
    never overwritten: the local one may already carry reviewer edits."""
    dst = os.path.join(ROOT, relpath)
    if os.path.exists(dst):
        return None
    for wt in _sibling_worktrees():
        src = os.path.join(wt, relpath)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(src, dst)
            print('  RESCUED %s from %s (a worker wrote to the wrong worktree)'
                  % (relpath, wt), flush=True)
            return src
    return None


# One definition of the per-stage budget for the whole factory family.
# batch_tutorials.effective_timeout explains why 0 and None mean "use the
# default" rather than "wait forever"; that distinction is what cost eighteen
# hours on 2026-11-15, and it must never be able to drift between the four
# drivers that each spawn unattended workers.
effective_timeout = bt.effective_timeout


def _watchdog(proc, deadline_sec, label):
    """Independent backstop: tree-kill a worker that outlives its budget.

    proc.wait(timeout=) is the primary mechanism and it works. This fires only
    if that path somehow does not, so it is armed well past the budget and
    no-ops when the process has already exited. Daemon thread: it can never
    hold the driver open.
    """
    import threading

    def _bark():
        if proc.poll() is None:
            print('  WATCHDOG: %s outlived its %ds budget by 120s and proc.wait '
                  'did not fire. Tree-killing it so the queue advances.'
                  % (label, deadline_sec), flush=True)
            _kill_tree(proc.pid)

    t = threading.Timer(deadline_sec + 120, _bark)
    t.daemon = True
    t.start()
    return t


def run_claude(cli, prompt, timeout=None, label='stage'):
    timeout = effective_timeout(timeout)
    print('+ %s -p "%s..."  (--model %s --effort %s, timeout %ds, no-global-CLAUDE.md, cwd=%s)' % (cli, prompt[:90], BATCH_MODEL, BATCH_EFFORT, timeout, PROJECT_ROOT), flush=True)
    try:
        proc = subprocess.Popen([cli, '-p', prompt, '--dangerously-skip-permissions',
                                 '--model', BATCH_MODEL, '--effort', BATCH_EFFORT,
                                 '--settings', WRITER_SETTINGS], cwd=PROJECT_ROOT)
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127
    guard = _watchdog(proc, timeout, label)
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
    finally:
        guard.cancel()


# A worker that exits non-zero this fast cannot have done any work, so the
# cause is the environment and not the lesson. Real content failures take
# minutes. The wall clock separates the two without parsing worker output,
# which run_claude deliberately streams rather than captures.
FAST_FAIL_SEC = 90
NET_BACKOFF = (30, 90, 180)   # one entry per extra attempt

# Windows NTSTATUS failure codes start at 0xC0000000. A code in that range is
# not an exit status the program chose: the process never ran. The one this
# box produces is 0xC0000142 STATUS_DLL_INIT_FAILED, when it is out of memory
# or handles. It comes back in zero seconds with both streams empty, which is
# indistinguishable from a fast API error unless you look at the code.
NTSTATUS_FLOOR = 0xC0000000


# ---- Machine health: the condition that killed runs 5 and 6 ----
#
# Two guards, because the failure has two shapes and only one of them is
# recoverable by waiting.
#
# BEFORE a stage: if the box is ALREADY short of memory, launching a fresh
# ~1 GB claude is the thing that pushes it over the edge. Wait for headroom
# instead of spending the launch. This is the preventive half, and it is the
# one that actually stops the failure happening.
#
# AFTER a refused launch: the condition is usually transient, clearing when
# whatever held the memory lets go, so wait and retry the SAME stage rather
# than abandoning the queue. This is the recovery half. It is deliberately
# bounded, because a leaked process tree never releases anything (2026-11-16:
# the harness reaped the driver's shell, the process tree survived and kept
# holding memory, so nothing was ever coming back). In that case waiting only
# delays an abort that is still the right answer.
MIN_FREE_MB = 2200          # rough headroom one fresh `claude -p` needs
HEADROOM_WAIT_TOTAL = 900   # seconds to wait for memory BEFORE a stage
STARTUP_WAIT_TOTAL = 900    # seconds to wait AFTER a refused launch
WAIT_STEP = 60
MAX_STARTUP_WAITS = 3       # per stage, so at most 45 min before giving up


def free_mb():
    """Physical memory available, in MB. None when it cannot be read.

    Advisory only. Every caller must behave sensibly when this returns None,
    because a memory probe that fails must never be able to stall the queue."""
    try:
        import ctypes

        class _MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [('dwLength', ctypes.c_ulong),
                        ('dwMemoryLoad', ctypes.c_ulong),
                        ('ullTotalPhys', ctypes.c_ulonglong),
                        ('ullAvailPhys', ctypes.c_ulonglong),
                        ('ullTotalPageFile', ctypes.c_ulonglong),
                        ('ullAvailPageFile', ctypes.c_ulonglong),
                        ('ullTotalVirtual', ctypes.c_ulonglong),
                        ('ullAvailVirtual', ctypes.c_ulonglong),
                        ('ullAvailExtendedVirtual', ctypes.c_ulonglong)]

        m = _MEMORYSTATUSEX()
        m.dwLength = ctypes.sizeof(_MEMORYSTATUSEX)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m)):
            return None
        return int(m.ullAvailPhys / (1024 * 1024))
    except Exception:
        return None


def can_start_processes():
    """Probe: will the OS still give us a process? The cheapest possible test.

    A non-zero exit WITH output means python started and objected, which means
    a healthy machine. A non-zero exit with NO output is the condition itself.
    An empty error message is the signal, the same inversion Scripts/
    verify_state.py keys on."""
    try:
        r = subprocess.run([sys.executable, '-c', 'pass'],
                           capture_output=True, text=True, timeout=60)
    except Exception:
        return False
    return r.returncode == 0 or bool(((r.stdout or '') + (r.stderr or '')).strip())


def wait_for_headroom(label):
    """Wait until there is memory for a fresh worker. Never raises, and always
    returns: free_mb is advisory, so a wrong threshold must not be able to
    block the run by itself. Worst case this costs 15 minutes and proceeds."""
    mb = free_mb()
    if mb is None or mb >= MIN_FREE_MB:
        return
    print('  %s: only %d MB free, want %d. Waiting up to %ds for headroom.'
          % (label, mb, MIN_FREE_MB, HEADROOM_WAIT_TOTAL), flush=True)
    waited = 0
    while waited < HEADROOM_WAIT_TOTAL:
        time.sleep(WAIT_STEP)
        waited += WAIT_STEP
        mb = free_mb()
        if mb is None or mb >= MIN_FREE_MB:
            print('  %s MB free after %ds; starting %s.' % (mb, waited, label), flush=True)
            return
    print('  still %s MB free after %ds. Starting %s anyway; the launch guard '
          'below catches it if Windows refuses.' % (mb, waited, label), flush=True)


def wait_for_process_startup(label):
    """Poll until the machine can start processes again. True = recovered."""
    print('  %s could not be STARTED by Windows (out of memory or handles). '
          'Waiting up to %ds for the box to recover.'
          % (label, STARTUP_WAIT_TOTAL), flush=True)
    waited = 0
    while waited < STARTUP_WAIT_TOTAL:
        time.sleep(WAIT_STEP)
        waited += WAIT_STEP
        if can_start_processes():
            print('  recovered after %ds (%s MB free); resuming %s.'
                  % (waited, free_mb(), label), flush=True)
            return True
        print('  still cannot start a process (%ds of %ds, %s MB free).'
              % (waited, STARTUP_WAIT_TOTAL, free_mb()), flush=True)
    return False


def run_claude_resilient(cli, prompt, timeout, label):
    """run_claude, but a FAST non-zero exit is retried with a backoff.

    2026-11-15: a DNS drop returned `API Error: Can't reach the API server
    (ENOTFOUND)` and burned seventeen queued lessons in about fifty seconds,
    roughly three seconds each, every one marked plan_failed. Nothing retried,
    because run_stage only retries after a timeout or an autofix, and the plan
    stages did not go through run_stage at all.

    2026-11-16: the opposite mistake cost a whole run. The machine ran out of
    memory and Windows could no longer start ANY process, so this retried a
    failure that could never succeed: seven lessons times four attempts, with
    backoff, learning nothing. A transient API error is worth waiting out; a
    process that cannot start is not, because nothing else will start either
    until the machine recovers.

    2026-11-17: aborting on the spot was too blunt. The condition is usually
    transient, so a refused launch now WAITS for the box and retries the same
    stage, and every launch waits for memory headroom first, which is the half
    that stops it happening at all. The abort survives for the case waiting
    cannot fix: a leaked process tree that never gives the memory back."""
    rc = 1
    attempt = 0
    startup_waits = 0
    while True:
        wait_for_headroom(label)
        started = time.monotonic()
        rc = run_claude(cli, prompt, timeout, label)
        elapsed = time.monotonic() - started
        if rc >= NTSTATUS_FLOOR:
            # Not an exit status the program chose: the process never ran. So
            # do not spend an API attempt on it, and do not throw the queue
            # away either. Wait for the machine, then retry this same stage.
            startup_waits += 1
            if startup_waits <= MAX_STARTUP_WAITS and wait_for_process_startup(label):
                continue
            raise ProcessStartFailure(
                '%s exited %d (0x%08X) after %.0fs and the machine did not recover '
                'after %d wait(s) of %ds: Windows cannot start processes. This is '
                'machine-wide, so every later stage would fail the same way.'
                % (label, rc, rc, elapsed, startup_waits, STARTUP_WAIT_TOTAL))
        if rc == 0 or elapsed >= FAST_FAIL_SEC or attempt == len(NET_BACKOFF):
            return rc
        wait = NET_BACKOFF[attempt]
        print('  %s exited %d after %.0fs, too fast to be real work. Treating it '
              'as a transient API failure and retrying in %ds (attempt %d of %d).'
              % (label, rc, elapsed, wait, attempt + 2, len(NET_BACKOFF) + 1), flush=True)
        time.sleep(wait)
        attempt += 1


CATALOG_FILES = ['courses.json', 'functions/_data/pro-lessons.json',
                 'functions/_data/exercise-manifest.json']

def sync():
    """Refresh the catalog, the Pro list and the grading manifest, then COMMIT
    and push them. Publishing runs with --skip-sync, so this is the only place
    they reach git: before 2026-10-03 sync() regenerated them without
    committing, and 22 Forecaster lessons went live with no catalog entry, no
    Pro gating and no grading."""
    subprocess.run([sys.executable, os.path.join('Scripts', 'build_lessons_tracker.py')], cwd=ROOT)
    subprocess.run([sys.executable, os.path.join('_build', 'build_exercise_manifest.py')], cwd=ROOT)
    # Course landings list later lessons as "coming soon" until this links them.
    r = subprocess.run([sys.executable, os.path.join('Scripts', 'refresh_course_landings.py'), '--build'],
                       cwd=ROOT, capture_output=True, text=True)
    landings = [l[len('refreshed: '):] for l in (r.stdout or '').splitlines() if l.startswith('refreshed: ')]
    files = CATALOG_FILES + [p for lp in landings for p in
                             ('posts/%s.md' % lp, '_posts/%s.html' % lp, '%s.html' % lp)]
    if subprocess.run(['git', 'diff', '--quiet', '--'] + files, cwd=ROOT).returncode == 0:
        return
    subprocess.run(['git', 'add', '--'] + files, cwd=ROOT)
    r = subprocess.run(['git', 'commit', '-m', 'Lesson catalog sync: courses.json, pro-lessons.json, grading manifest'
                        + (', course landings' if landings else ''),
                        '--'] + files, cwd=ROOT, capture_output=True, text=True)
    if r.returncode == 0:
        subprocess.run(['git', 'push', 'origin', 'HEAD'], cwd=ROOT)
        print('  catalog sync committed and pushed', flush=True)
    else:
        print('  catalog sync commit FAILED: %s' % (r.stderr or r.stdout).strip()[-300:], flush=True)


# ---- Remediation: catch, fix, re-check, then advance ----
#
# A stage that fails is not the end of the lesson. The runner applies the
# deterministic fixers in Scripts/lesson_autofix.py, re-runs the hard gate,
# and retries the failed stage ONCE. A stage that timed out is retried once
# with double the budget. Only after that does the lesson get a failed status
# (owner rule 2026-09-16: catch, fix, then advance; never skip past a fixable
# fault). Everything here is mechanical; judgment fixes stay with the skills.

def autofix(slug):
    """Run the fixers; return the list of applied fixes (empty = nothing to fix)."""
    r = subprocess.run([sys.executable, os.path.join('Scripts', 'lesson_autofix.py'), slug],
                       cwd=ROOT, capture_output=True, text=True)
    fixes = [l[len('fixed: '):] for l in (r.stdout or '').splitlines() if l.startswith('fixed: ')]
    for f in fixes:
        print('  autofix: ' + f, flush=True)
    return fixes


def gate_ok(slug, label='after remediation'):
    """Re-run the deterministic lesson gate; True when it passes."""
    path = os.path.join(ROOT, 'lessons', slug + '.md')
    r = subprocess.run([sys.executable, os.path.join('Scripts', 'lesson_quality_check.py'), path],
                       cwd=ROOT, capture_output=True, text=True)
    ok = r.returncode == 0
    print('  gate %s: %s' % (label, 'PASS' if ok else 'FAIL'), flush=True)
    if not ok:
        for l in (r.stdout or '').splitlines()[-6:]:
            print('    ' + l)
    return ok


def run_stage(cli, slug, name, prompt, timeout, verify):
    """Run one stage with remediation.

    verify() -> (ok, why). Sequence: run -> verify; on failure: autofix + gate,
    and retry once (with 2x budget if the first attempt timed out). Returns
    (ok, why). The caller decides the status label."""
    rc = run_claude_resilient(cli, prompt, timeout, name)
    ok, why = verify() if rc == 0 else (False, '%s exited %d' % (name, rc))
    if ok:
        return True, ''
    print('  %s failed (%s); remediating' % (name, why), flush=True)
    fixes = autofix(slug) if os.path.exists(os.path.join(ROOT, 'lessons', slug + '.md')) else []
    gate = gate_ok(slug) if fixes else None
    if rc == 124 or fixes:
        retry_timeout = (timeout * 2) if (rc == 124 and timeout) else timeout
        print('  retrying %s once (%s)' % (name, 'after fixes' if fixes else 'longer budget'), flush=True)
        rc = run_claude_resilient(cli, prompt, retry_timeout, name)
        ok, why = verify() if rc == 0 else (False, '%s exited %d on retry' % (name, rc))
        if ok:
            return True, ''
    return False, why


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', action='append', help='lesson slug; repeatable to build several in ONE run (no chaining)')
    ap.add_argument('--course')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--regenerate', action='store_true',
                    help='rebuild from scratch: target failed lessons AND re-run every '
                         'stage, discarding the plan and draft already on disk')
    ap.add_argument('--resume', action='store_true',
                    help='target every lesson that is not done (failed and in-flight ones '
                         'included) and resume each at the stage it died, reusing the '
                         'approved plan, the gated draft and the passed review. This is '
                         'the flag a supervisor loop should use.')
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
            if args.plan_only:
                print('  would: /write-lesson %s --plan-only   then   /check-lesson-plan' % s)
            else:
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
            prior = st.get(slug, {}).get('status', 'pending')
            _course = args.course or st.get(slug, {}).get('course_id', '')

            # ---- Cheap resume (2026-11-17) ----
            #
            # Every stage already checkpointed to disk, but a relaunch re-ran
            # all of them anyway: a lesson sitting at publish_failed was
            # re-planned, REBUILT (a second unreviewed draft overwriting a good
            # one) and re-published. That made "just run it again" a gamble
            # instead of a recovery, which is why halts needed hand-repair.
            #
            # The two checks below make a relaunch cost only the stages that
            # are genuinely missing. Combined with the plan check further down,
            # a rerun now resumes at the exact stage that failed. This is what
            # makes the supervisor loop in .claude/skills/ship-lessons safe.
            #
            # --regenerate still forces the whole lesson to be rebuilt.
            if not args.regenerate:
                # Ask git, not the status file. The status file is written by a
                # driver that may have been killed; git is what production
                # serves. This also surfaces a sick machine BEFORE a launch is
                # spent, because verify_published raises on a silent git.
                pub_ok, _pub_why = verify_published(slug, fragment_dirs=('_lessons', '_posts'))
                if pub_ok:
                    print('  already published and committed; recording done without '
                          'spending a worker: %s' % slug)
                    st[slug] = {'course_id': _course, 'status': 'done'}
                    save_status(st)
                    done += 1
                    continue

            st[slug] = {'course_id': _course, 'status': 'writing'}
            save_status(st)

            # Three fresh sessions per lesson: plan -> plan review -> build.
            # The plan is a contract (status: approved) the builder may deepen
            # but never reorder; the flow gate runs while fixes are cheap.
            plan_path = os.path.join(ROOT, 'post_plans', slug + '_lesson-plan.md')
            approved_already = os.path.exists(plan_path) and 'status: approved' in open(plan_path, encoding='utf-8').read()
            if approved_already:
                print('  approved plan exists, skipping planner + plan review: %s' % slug)
            _plan_rel = os.path.join('post_plans', slug + '_lesson-plan.md')
            _rc = 0 if approved_already else run_claude_resilient(
                args.claude, plan_prompt(slug), effective_timeout(args.timeout), 'plan')
            if not approved_already:
                rescue_misfiled(_plan_rel)
            if not approved_already and (_rc != 0 or not os.path.exists(plan_path)):
                st[slug]['status'] = 'plan_failed'
                st[slug]['last_error'] = ('planner exited %d' % _rc if _rc != 0
                                          else 'planner exited 0 but wrote no plan file')
                save_status(st)
                print('  plan failed: %s (%s; see lessons-status.json)'
                      % (slug, st[slug]['last_error']))
                continue
            if not approved_already and (run_claude_resilient(
                    args.claude, plan_check_prompt(slug), effective_timeout(args.timeout),
                    'plan review') != 0 or 'status: approved' not in open(plan_path, encoding='utf-8').read()):
                st[slug]['status'] = 'plan_review_failed'
                st[slug]['last_error'] = 'plan review did not stamp status: approved'
                save_status(st)
                print('  plan review failed: %s (see lessons-status.json)' % slug)
                continue
            if args.plan_only:
                st[slug]['status'] = 'planned'
                save_status(st)
                print('  plan approved (plan-only): %s' % slug)
                continue
            _md = os.path.join(ROOT, 'lessons', slug + '.md')
            rescue_misfiled(os.path.join('lessons', slug + '.md'))
            # A draft that exists AND passes the hard gate is not rebuilt. The
            # gate is the condition, not mere existence: a half-written file
            # left by a killed worker fails it and is correctly rebuilt.
            draft_ready = (not args.regenerate) and os.path.exists(_md) \
                and gate_ok(slug, 'on the existing draft')
            if draft_ready:
                print('  gated draft already written, skipping the build: %s' % slug)
                ok, why = True, ''
            else:
                ok, why = run_stage(args.claude, slug, 'build', build_prompt(slug), effective_timeout(args.timeout),
                                    lambda: (os.path.exists(_md), 'no lesson markdown written'))
            if not ok:
                st[slug]['status'] = 'failed'
                st[slug]['last_error'] = why
                save_status(st)
                print('  write failed: %s (%s; see lessons-status.json)' % (slug, why))
                continue

            st[slug]['status'] = 'reviewing'
            save_status(st)
            # A lesson that already got past review and died in the publisher
            # does not need reviewing again. Only these two statuses prove the
            # review passed, and the draft must still be the gated one.
            if draft_ready and prior in ('publishing', 'publish_failed'):
                print('  review already passed before the publish failed, skipping it: %s' % slug)
            elif run_claude_resilient(args.claude, check_prompt(slug),
                                      effective_timeout(args.timeout), 'lesson review') != 0:
                st[slug]['status'] = 'manual_review'
                save_status(st)
                print('  review flagged manual_review: %s (see Scripts/lesson-review.log)' % slug)
                continue

            st[slug]['status'] = 'publishing'
            save_status(st)
            # The exit code proves nothing: `claude -p` exits 0 whether or not the
            # publisher finished. run_stage verifies the artifacts, and on a miss
            # applies the fixers, re-gates and retries the publish once.
            ok, why = run_stage(args.claude, slug, 'publish', publish_prompt(slug), effective_timeout(args.timeout),
                                lambda: verify_published(slug, fragment_dirs=('_lessons', '_posts')))
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
    except ProcessStartFailure as e:
        # Deliberately do not rewrite lessons-status.json here. Lessons never
        # attempted keep the status they had, and the one that was running
        # stays at its last real stage. That is the honest record: we cannot
        # tell what it managed to finish, and a worker often outlives the
        # driver, so the status file is the wrong place to look afterwards.
        print('\nABORTING THE RUN: %s' % e, flush=True)
        print('  %d lesson(s) completed before this. The rest were not attempted.'
              % done, flush=True)
        print('  The catalog was NOT synced. When the machine is healthy again:',
              flush=True)
        print('    python Scripts/build_lessons_tracker.py', flush=True)
        print('    python _build/build_exercise_manifest.py', flush=True)
        print('    python Scripts/refresh_course_landings.py --build', flush=True)
        print('  Check what really landed with git log, not lessons-status.json.',
              flush=True)
        return 86
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass
    print('Batch complete: %d built.' % done)
    return 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Batch orchestrator for core tutorial posts - one FRESH `claude -p` subprocess
per PHASE per post (clean context each = the scaling AND quality lever), mirroring
Scripts/batch_lessons.py.

Per post: /write-tut <id>  ->  /verify-tut <slug>  ->  /publish-tut <slug>
          (writer)            (fresh-eyes reviewer)    (mechanical publisher)

Targets come from curriculum-status.json (the canonical Core/FR/EX tracker):
entries with status "not_started", filtered by --path / --id / --max. The publish
phase records status "published" back into the same file. Pipeline state between
phases lives in a gitignored sidecar (tutorials-status.json) so runs are resumable.
A lock file prevents concurrent runs; this factory is strictly SEQUENTIAL (project
rule: no parallel writers).

Usage:
  python Scripts/batch_tutorials.py --id 3.8.1                    # one post
  python Scripts/batch_tutorials.py --id 3.8.1 --id 3.8.2         # a specific list
  python Scripts/batch_tutorials.py --path /time-series/ --max 45 # a curriculum path
  python Scripts/batch_tutorials.py --regenerate                  # retry failed/manual_review
  python Scripts/batch_tutorials.py --id 3.8.4 --rewrite          # redo a PUBLISHED post in place
  python Scripts/batch_tutorials.py --dry-run                     # plan only, no spawns
Flags: --sync-every N (default 5; 0 = only the final sync), --claude <cli path>,
       --timeout <sec per phase, default 1800>.

DEVIATION from batch_lessons.py, deliberate: instead of passing "/skill args" as
the -p prompt (broken on some CLI builds since 2.1.207, which silently drops the
skill and free-chats), each phase INLINES the skill's SKILL.md into the prompt with
the argument substituted. Robust on every CLI version; same skills, same content.
"""
import os, sys, json, argparse, subprocess, datetime, time, urllib.request

# Packages pre-warmed once at batch start with --prewarm-r, so writers and the gate
# never stall on a mid-post CRAN install. Common tutorial set; anything missing still
# installs lazily. Kept to CRAN packages that install without a build toolchain.
PREWARM_PACKAGES = [
    'forecast', 'tseries', 'zoo', 'xts', 'TTR', 'urca', 'lmtest', 'seasonal',
    'quantmod', 'dplyr', 'tidyr', 'ggplot2', 'broom', 'car', 'sandwich',
]

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PROJECT_ROOT = os.path.dirname(ROOT)          # skills use selva86.github.io/... paths
SKILLS = os.path.join(PROJECT_ROOT, '.claude', 'skills')
CURRICULUM = os.path.join(ROOT, 'curriculum-status.json')
STATE = os.path.join(ROOT, 'tutorials-status.json')   # gitignored sidecar
LOCK = os.path.join(ROOT, 'Scripts', 'batch_tutorials.lock')
FAILLOG = os.path.join(ROOT, 'Scripts', 'tutorial-failures.log')

# Same model policy as the lesson factory: pinned explicitly, decoupled from the
# owner's interactive CLI default. The user-global ~/.claude/CLAUDE.md (an SEO
# persona: "be concise") fights the beginner-first teaching contract, so exclude
# it from every spawned phase; the project CLAUDE.md + skill + tutorial-pedagogy.md
# are the writer's whole context.
BATCH_MODEL = 'claude-opus-4-8'
BATCH_EFFORT = 'xhigh'
_GLOBAL_CLAUDE_MD = os.path.expanduser('~/.claude/CLAUDE.md').replace('\\', '/')
WRITER_SETTINGS = json.dumps({'claudeMdExcludes': [_GLOBAL_CLAUDE_MD]})


def load_json(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def save_state(s):
    with open(STATE, 'w', encoding='utf-8') as f:
        json.dump(s, f, indent=2)


def curriculum_entries():
    """Yield (path_key, entry_dict) for every post entry, in file order."""
    cur = load_json(CURRICULUM, {})
    for pk, p in cur.get('paths', {}).items():
        for sk, s in p.get('sub_paths', {}).items():
            for e in s.get('posts', []):
                yield pk, e


def entry_by_id(cid):
    for _, e in curriculum_entries():
        if e.get('id') == cid:
            return e
    return None


def resolve_targets(args, state):
    """Ordered list of curriculum ids to build."""
    if args.id:
        return args.id
    retry = {'failed', 'manual_review', 'publish_failed'}
    out = []
    for pk, e in curriculum_entries():
        if args.path and pk != args.path:
            continue
        cid = e.get('id')
        st = state.get(cid, {}).get('status')
        if e.get('status') == 'not_started' and st not in ('done',):
            if st in retry and not args.regenerate:
                continue
            out.append(cid)
    return out


def compose_prompt(skill, argument):
    """Inline the SKILL.md with $ARGUMENTS substituted (see module docstring)."""
    path = os.path.join(SKILLS, skill, 'SKILL.md')
    text = open(path, encoding='utf-8').read()
    body = text.split('---', 2)[2] if text.startswith('---') else text
    body = body.replace('$ARGUMENTS', argument)
    return ('You are a non-interactive worker for r-statistics.co (project root %s). '
            'Execute the following skill exactly, for the given argument, end to end. '
            'Never wait for user input.\n\n=== SKILL: /%s ===\n%s\n\nARGUMENT: %s'
            % (PROJECT_ROOT, skill, body, argument))


def _kill_tree(pid):
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


def run_phase(cli, skill, argument, timeout):
    print('+ [%s] %s %s  (--model %s --effort %s)' %
          (datetime.datetime.now().strftime('%H:%M'), skill, argument, BATCH_MODEL, BATCH_EFFORT),
          flush=True)
    try:
        proc = subprocess.Popen([cli, '-p', compose_prompt(skill, argument),
                                 '--dangerously-skip-permissions',
                                 '--model', BATCH_MODEL, '--effort', BATCH_EFFORT,
                                 '--settings', WRITER_SETTINGS], cwd=PROJECT_ROOT)
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127
    try:
        return proc.wait(timeout=timeout or None)
    except subprocess.TimeoutExpired:
        print('  TIMEOUT: %s %s produced no result in %ss - killing the hung worker.'
              % (skill, argument, timeout), flush=True)
        _kill_tree(proc.pid)
        try:
            proc.wait(timeout=20)
        except Exception:
            pass
        return 124


def sync():
    subprocess.run([sys.executable, os.path.join('_build', 'sync_registries.py')], cwd=ROOT)


def find_rscript():
    import glob
    cand = os.environ.get('RSCRIPT')
    if cand and os.path.exists(cand):
        return cand
    for pat in (r'C:/Program Files/R/R-*/bin/Rscript.exe',
                r'C:/Program Files/R/R-*/bin/x64/Rscript.exe'):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    from shutil import which
    return which('Rscript')


def prewarm_r():
    """Install the common tutorial package set once, before the batch, so no post
    stalls on a mid-write CRAN install. Skips packages already present."""
    rs = find_rscript()
    if not rs:
        print('  --prewarm-r: Rscript not found, skipping (packages install lazily).')
        return
    pkgs = ','.join('"%s"' % p for p in PREWARM_PACKAGES)
    expr = ('p <- c(%s); m <- p[!(p %%in%% rownames(installed.packages()))]; '
            'if (length(m)) install.packages(m, repos="https://cloud.r-project.org", quiet=TRUE) '
            'else cat("all present\\n")') % pkgs
    print('  --prewarm-r: ensuring %d common packages are installed...' % len(PREWARM_PACKAGES), flush=True)
    subprocess.run([rs, '-e', expr], cwd=ROOT)


def _prod_live(slug, timeout=15):
    """True if the post's canonical page is actually served on prod (200 + the
    page's own canonical URL present, so a 404 fallback does not count)."""
    url = 'https://r-statistics.co/%s.html?v=%d' % (slug, int(time.time()))
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'batch-tut-verify'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if getattr(r, 'status', r.getcode()) != 200:
                return False
            body = r.read(300000).decode('utf-8', 'replace')
            return ('%s.html' % slug) in body
    except Exception:
        return False


def poll_prod_all(slugs, rounds=20, gap=20):
    """Batch prod verification: poll all pushed slugs once at the end (CF deploys the
    whole site in one build, so once one is live they generally all are). Shared
    budget instead of a per-post 20-min wait."""
    if not slugs:
        return
    print('\nProd verification (%d post(s)):' % len(slugs), flush=True)
    pending = list(dict.fromkeys(slugs))
    for _ in range(rounds):
        pending = [s for s in pending if not _live_and_report(s)]
        if not pending:
            break
        time.sleep(gap)
    for s in pending:
        print('  PENDING   https://r-statistics.co/%s.html  (pushed; deploy not live yet)' % s, flush=True)


def _live_and_report(slug):
    if _prod_live(slug):
        print('  LIVE      https://r-statistics.co/%s.html' % slug, flush=True)
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--id', action='append', help='curriculum id (e.g. 3.8.1); repeatable')
    ap.add_argument('--path', help='curriculum path filter (e.g. /time-series/)')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--regenerate', action='store_true')
    ap.add_argument('--rewrite', action='store_true',
                    help='rewrite an ALREADY-PUBLISHED post in place (same slug/url). '
                         'Bypasses the published-skip guard and tells write-tut to '
                         'overwrite the existing markdown instead of refusing the slug. '
                         'Use with explicit --id.')
    ap.add_argument('--sync-every', type=int, default=5)
    ap.add_argument('--prewarm-r', action='store_true',
                    help='install the common tutorial R packages once before the '
                         'batch so no post stalls on a mid-write CRAN install')
    ap.add_argument('--claude', default='claude')
    ap.add_argument('--timeout', type=int, default=1800,
                    help='per-phase seconds before a worker is treated as hung (0 disables)')
    args = ap.parse_args()

    state = load_json(STATE, {})
    targets = resolve_targets(args, state)
    if args.max and len(targets) > args.max:
        targets = targets[:args.max]
    if not targets:
        print('No targets. Pass --id or --path, or all matching entries are already handled.')
        return 0

    print('Targets (%d): %s' % (len(targets), ', '.join(targets)))
    if args.dry_run:
        for cid in targets:
            e = entry_by_id(cid) or {}
            print('  would: write-tut %s -> verify-tut -> publish-tut   (%s)'
                  % (cid, e.get('ctr_title', '?')))
        print('Dry run: no subprocesses spawned, no state changed.')
        return 0

    if os.path.exists(LOCK):
        print('WARNING: clearing a stale lock (%s) left by a previous interrupted run.' % LOCK)
        try:
            os.remove(LOCK)
        except OSError:
            pass
    open(LOCK, 'w').close()

    if args.prewarm_r:
        prewarm_r()

    done = 0
    done_slugs = []
    try:
        for i, cid in enumerate(targets, 1):
            e = entry_by_id(cid)
            if not e:
                print('[%d/%d] %s not found in curriculum-status.json, skip' % (i, len(targets), cid))
                continue
            if not args.rewrite and (e.get('status') == 'published'
                                     or state.get(cid, {}).get('status') == 'done'):
                print('[%d/%d] %s already published, skip (pass --rewrite to redo it)'
                      % (i, len(targets), cid))
                continue
            tag = ' [REWRITE]' if args.rewrite else ''
            print('[%d/%d] %s  %s%s' % (i, len(targets), cid, e.get('ctr_title', ''), tag))
            state[cid] = {'status': 'writing', 'started': datetime.datetime.now().isoformat(timespec='minutes')}
            save_state(state)

            # Phase 1: write. The writer records the slug into curriculum-status.json.
            # In --rewrite mode it overwrites the existing markdown for the same slug.
            write_arg = cid + (' --rewrite' if args.rewrite else '')
            rc = run_phase(args.claude, 'write-tut', write_arg, args.timeout)
            e = entry_by_id(cid) or {}
            slug = e.get('slug')
            md = os.path.join(ROOT, 'posts', '%s.md' % slug) if slug else None
            if rc != 0 or not slug or not os.path.exists(md):
                state[cid]['status'] = 'failed'
                save_state(state)
                print('  write failed: %s (see %s)' % (cid, os.path.relpath(FAILLOG, ROOT)))
                continue
            state[cid].update(status='reviewing', slug=slug)
            save_state(state)

            # Phase 2: fresh-eyes review (a different subprocess = a different agent).
            if run_phase(args.claude, 'verify-tut', slug, args.timeout) != 0:
                state[cid]['status'] = 'manual_review'
                save_state(state)
                print('  review flagged manual_review: %s (see Scripts/tutorial-review.log)' % slug)
                continue

            # Phase 3: publish. --skip-sync-registries (we sync periodically) and
            # --no-prod-poll (the slow Cloudflare deploy-wait is verified once, for
            # all posts, at the end - not on the per-post critical path).
            state[cid]['status'] = 'publishing'
            save_state(state)
            if run_phase(args.claude, 'publish-tut',
                         slug + ' --skip-sync-registries --no-prod-poll', args.timeout) != 0:
                state[cid]['status'] = 'publish_failed'
                save_state(state)
                print('  publish failed: %s' % slug)
                continue

            state[cid]['status'] = 'done'
            save_state(state)
            done += 1
            done_slugs.append(slug)
            if args.sync_every and done % args.sync_every == 0:
                sync()
        if args.sync_every != 0:
            sync()
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass
    # Verify every pushed post actually serves on prod, once, at the end.
    poll_prod_all(done_slugs)
    print('Batch complete: %d published.' % done)
    return 0


if __name__ == '__main__':
    sys.exit(main())

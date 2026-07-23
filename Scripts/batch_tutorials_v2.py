#!/usr/bin/env python3
"""HYBRID tutorial factory (v2): the WARM v4 writer + the fact-checking safety net.

Same 3-phase, fresh-session-per-phase architecture as Scripts/batch_tutorials.py,
but the WRITE phase drives the owner-tuned beginner-first writer instead of the
lesson-pedagogy writer:

  /write-post-interactive-v4  ->  /verify-tut  ->  /publish-tut
     (warm, comprehension-first)   (fresh-eyes review +   (mechanical publisher)
                                     code re-execution gate)

Why this file exists (see the batch_tutorials.py comparison):
  - orchestrate.py used the v4 writer (the voice the owner likes) but its gate was
    STRUCTURAL only - it never re-ran the code or fact-checked a claim.
  - batch_tutorials.py has the strong gate + independent verify, but writes in the
    formal lesson-pedagogy voice.
  This v2 keeps the v4 voice AND the strong gate: the best of both.

The bridge (v4's output contract differs from the gate's, so the orchestrator
reconciles it WITHOUT editing the v4 skill):
  1. v4 writes "expected" #> outputs, not locally executed ones -> the write prompt
     is augmented to REQUIRE real Rscript-captured outputs (the gate re-executes and
     would otherwise fail every mismatch).
  2. v4 uses em dashes; the gate bans them -> sanitize_md() strips them post-write.
  3. v4 writes a body '# Title' H1; the gate forbids a body H1 (build.py injects it)
     -> the prompt tells v4 to omit it, and sanitize_md() drops it as a backstop.
  4. slug must not change on a rewrite -> pinned to the curriculum slug in the prompt.
Anything the bridge misses (a fabricated number, a static-vs-live package mistake)
is caught downstream by verify-tut + the deterministic gate, which is the point.

Usage (identical flags to batch_tutorials.py):
  python Scripts/batch_tutorials_v2.py --id 3.8.4 --rewrite      # redo a published post, v4 voice
  python Scripts/batch_tutorials_v2.py --id 3.8.10 --id 3.8.11   # new posts
  python Scripts/batch_tutorials_v2.py --path /time-series/ --max 12
Flags: --rewrite, --regenerate, --prewarm-r, --sync-every N, --dry-run,
       --claude <path>, --timeout <sec>.
"""
import os, re, sys, glob, json, argparse, subprocess, datetime, time, urllib.request

# Reuse ALL shared machinery from batch_tutorials.py (no duplication): the lock,
# state sidecar, curriculum readers, model policy, run_phase spawn, prewarm_r,
# poll_prod_all, sync. Importing the module does NOT run its main() (guarded by
# __main__), and it shares the SAME lock file so v1 and v2 can never run at once.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import batch_tutorials as bt

ROOT = bt.ROOT
V4_WRITER = 'write-post-interactive-v4'


def compose_v4_prompt(cid, entry, rewrite, slug):
    """Inline the v4 SKILL.md for the curriculum-entry argument, then append the
    HYBRID OVERRIDES that reconcile v4's output with the gate. Overrides win on
    conflict."""
    ptype = entry.get('type', 'C')
    title = entry.get('ctr_title') or entry.get('title') or ''
    v4_arg = '%s | %s | %s' % (cid, ptype, title)

    rscript = bt.find_rscript() or 'Rscript'
    overrides = (
        "\n\n=== HYBRID OVERRIDES (this orchestrator; take precedence over the skill "
        "on any conflict) ===\n"
        "You are writing for the r-statistics.co tutorial FACTORY, which runs a "
        "deterministic quality gate and a fresh-eyes review after you. Obey ALL of:\n"
        "1. REAL OUTPUTS ONLY. Every `#>` output line must be the ACTUAL printed "
        "result of running the code, captured by executing it with local Rscript "
        "(`%s`; install.packages() to the user library if a package is missing; "
        "set.seed() before any randomness). Do NOT write 'expected' or estimated "
        "outputs - the gate re-executes every block and fails on any mismatch.\n"
        "2. NO body H1. Do NOT write a top-level `# Title` line; the build injects "
        "the page H1 from the title. Start the body with the `<p class=\"lead\">` "
        "paragraph, then the first `## ` question heading.\n"
        "3. NO em dashes anywhere (prose, code comments, frontmatter). Use a hyphen, "
        "colon, or comma. The gate bans the character.\n"
        "4. Never write 'WebR' or name the browser R engine in reader-facing prose; "
        "say 'interactive code' or 'runs in your browser'.\n"
        "5. PACKAGE FENCING: `Scripts/webr-package-compat.json` is the authority. A "
        "```r block may only library() packages whose status is `runnable` (plus "
        "base R). Any other package goes in a ```r-static block (framed 'run this "
        "locally'), still with REAL `#>` output captured from a local run - NOT in a "
        "regular ```r block with a note.\n"
        "6. SLUG IS FIXED: use the slug `%s` exactly; write to `posts/%s.md`; do not "
        "change the slug or the URL. Also set this slug in the post's frontmatter.\n"
        "7. Write the finished markdown to `selva86.github.io/posts/%s.md` and the "
        "plan to `selva86.github.io/post_plans/%s_plan.md`. Do NOT run md2html, "
        "build, or git - `/verify-tut` and `/publish-tut` own the pipeline.\n"
        % (rscript, slug, slug, slug, slug)
    )
    if rewrite:
        overrides += (
            "8. REWRITE FROM SCRATCH: a post already exists at this slug and its body "
            "has been cleared. Ignore any prior content entirely and write a fresh, "
            "genuinely new treatment - do not reconstruct the old structure or "
            "headings from memory. Keep the slug and title.\n"
        )

    # Optional per-chapter brief: Scripts/briefs/<cid>.md carries chapter-specific
    # requirements (e.g. the industry-grade case-study spec) appended as the final,
    # highest-precedence override block.
    brief_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'briefs', '%s.md' % cid)
    if os.path.exists(brief_path):
        with open(brief_path, encoding='utf-8') as f:
            overrides += ("\n=== CHAPTER BRIEF (mandatory requirements for this specific "
                          "chapter; highest precedence, wins over everything above) ===\n"
                          + f.read().strip() + "\n")

    # Reuse bt.compose_prompt to inline the skill body + ARGUMENT, then bolt on the
    # overrides so they are the last thing the model reads.
    base = bt.compose_prompt(V4_WRITER, v4_arg)
    return base + overrides


def run_write_v4(cli, cid, entry, rewrite, slug, timeout):
    """Spawn the v4 writer with the composed hybrid prompt.

    The inlined v4 SKILL.md (679 lines) plus overrides is ~40k chars, which exceeds
    the Windows command-line limit (~32,767). So the prompt is piped via STDIN
    (`claude -p` reads stdin when given no positional prompt) instead of passed as a
    `-p <arg>`. stdout/stderr inherit so the worker's output still reaches the log."""
    print('+ [%s] %s %s | %s  (--model %s --effort %s)  [HYBRID, stdin]' %
          (datetime.datetime.now().strftime('%H:%M'), V4_WRITER, cid,
           entry.get('type', 'C'), bt.BATCH_MODEL, bt.BATCH_EFFORT), flush=True)
    prompt = compose_v4_prompt(cid, entry, rewrite, slug)
    try:
        proc = subprocess.Popen([cli, '-p', '--dangerously-skip-permissions',
                                 '--model', bt.BATCH_MODEL, '--effort', bt.BATCH_EFFORT,
                                 '--settings', bt.WRITER_SETTINGS],
                                stdin=subprocess.PIPE, cwd=bt.PROJECT_ROOT,
                                text=True, encoding='utf-8')
    except FileNotFoundError:
        print('  ERROR: claude CLI not found (%s). Pass --claude <path>.' % cli)
        return 127
    try:
        proc.communicate(input=prompt, timeout=timeout or None)
        return proc.returncode
    except subprocess.TimeoutExpired:
        print('  TIMEOUT: %s produced no result in %ss - killing the hung worker.'
              % (V4_WRITER, timeout), flush=True)
        bt._kill_tree(proc.pid)
        try:
            proc.communicate(timeout=20)
        except Exception:
            pass
        return 124


def sanitize_md(slug):
    """Deterministic bridge fixes on the v4 markdown before the gate sees it:
    strip em/en dashes and drop a leading body H1 (both gate-fatal), OUTSIDE code
    fences. Returns the number of lines changed."""
    p = os.path.join(ROOT, 'posts', slug + '.md')
    if not os.path.exists(p):
        return 0
    # Normalize line endings first: the Write tool emits CRLF on Windows, and a
    # stray \r inside a code block kills the in-browser R parser even though the
    # local Rscript gate passes it (caught live on FR-adva-7, 2026-07-22).
    raw = open(p, 'rb').read()
    if b'\r' in raw:
        open(p, 'wb').write(raw.replace(b'\r\n', b'\n').replace(b'\r', b'\n'))
    lines = open(p, encoding='utf-8').read().split('\n')
    out, in_code, changed = [], False, 0
    for ln in lines:
        if ln.lstrip().startswith('```'):
            in_code = not in_code
            out.append(ln)
            continue
        if in_code:
            out.append(ln)
            continue
        # drop a body H1 ('# Foo', not '## Foo'); the gate forbids it
        if re.match(r'^#\s+\S', ln) and not ln.startswith('##'):
            changed += 1
            continue
        new = (ln.replace(' — ', ' - ').replace('—', ' - ')
                 .replace(' – ', ' - ').replace('–', '-'))
        if new != ln:
            changed += 1
        out.append(new)
    if changed:
        open(p, 'w', encoding='utf-8', newline='').write('\n'.join(out))
        print('  sanitize: %d line(s) fixed (em-dash / body-H1)' % changed, flush=True)
    return changed


def resolve_slug(cid, known_slug):
    """Find the slug of the just-written post. Rewrite pins it; for a new post read
    it from the curriculum (if v4 recorded it) or the most-recently-written md."""
    e = bt.entry_by_id(cid) or {}
    slug = e.get('slug') or known_slug
    if slug and os.path.exists(os.path.join(ROOT, 'posts', slug + '.md')):
        return slug
    posts = glob.glob(os.path.join(ROOT, 'posts', '*.md'))
    if posts:
        newest = max(posts, key=os.path.getmtime)
        txt = open(newest, encoding='utf-8', errors='replace').read()
        m = re.search(r'^slug:\s*"?([^"\n]+)"?', txt, re.M)
        if m:
            return m.group(1).strip()
    return slug


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--id', action='append', help='curriculum id (e.g. 3.8.4); repeatable')
    ap.add_argument('--path', help='curriculum path filter (e.g. /time-series/)')
    ap.add_argument('--max', type=int, default=0)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--regenerate', action='store_true')
    ap.add_argument('--rewrite', action='store_true',
                    help='rewrite an already-published post in place (same slug/url)')
    ap.add_argument('--sync-every', type=int, default=5)
    ap.add_argument('--prewarm-r', action='store_true')
    ap.add_argument('--claude', default='claude')
    ap.add_argument('--timeout', type=int, default=1800)
    args = ap.parse_args()

    state = bt.load_json(bt.STATE, {})
    targets = bt.resolve_targets(args, state)
    if args.max and len(targets) > args.max:
        targets = targets[:args.max]
    if not targets:
        print('No targets. Pass --id or --path, or all matching entries are already handled.')
        return 0

    print('HYBRID v2 (v4 writer + verify-tut + gate). Targets (%d): %s'
          % (len(targets), ', '.join(targets)))
    if args.dry_run:
        for cid in targets:
            e = bt.entry_by_id(cid) or {}
            print('  would: write-post-interactive-v4 %s | %s -> verify-tut -> publish-tut   (%s)'
                  % (cid, e.get('type', 'C'), e.get('ctr_title', '?')))
        print('Dry run: no subprocesses spawned, no state changed.')
        return 0

    if os.path.exists(bt.LOCK):
        print('WARNING: clearing a stale lock (%s).' % bt.LOCK)
        try:
            os.remove(bt.LOCK)
        except OSError:
            pass
    open(bt.LOCK, 'w').close()

    if args.prewarm_r:
        bt.prewarm_r()

    done, done_slugs = 0, []
    try:
        for i, cid in enumerate(targets, 1):
            e = bt.entry_by_id(cid)
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
            state[cid] = {'status': 'writing',
                          'started': datetime.datetime.now().isoformat(timespec='minutes'),
                          'writer': V4_WRITER}
            bt.save_state(state)

            # Phase 1: WRITE with the v4 warm writer (+ hybrid overrides).
            known_slug = e.get('slug')
            rc = run_write_v4(args.claude, cid, e, args.rewrite, known_slug, args.timeout)
            slug = resolve_slug(cid, known_slug)
            md = os.path.join(ROOT, 'posts', '%s.md' % slug) if slug else None
            if rc != 0 or not slug or not md or not os.path.exists(md):
                state[cid]['status'] = 'failed'
                bt.save_state(state)
                print('  write failed: %s' % cid)
                continue

            # Bridge: strip em-dashes + any body H1 so the gate can pass.
            sanitize_md(slug)

            state[cid].update(status='reviewing', slug=slug)
            bt.save_state(state)

            # Phase 2: fresh-eyes review + code re-execution gate (the safety net
            # v4/orchestrate.py never had). Unchanged skill.
            if bt.run_phase(args.claude, 'verify-tut', slug, args.timeout) != 0:
                state[cid]['status'] = 'manual_review'
                bt.save_state(state)
                print('  review flagged manual_review: %s (see Scripts/tutorial-review.log)' % slug)
                continue

            # Phase 3: publish (skip periodic sync; verify prod once at the end).
            state[cid]['status'] = 'publishing'
            bt.save_state(state)
            if bt.run_phase(args.claude, 'publish-tut',
                            slug + ' --skip-sync-registries --no-prod-poll', args.timeout) != 0:
                state[cid]['status'] = 'publish_failed'
                bt.save_state(state)
                print('  publish failed: %s' % slug)
                continue

            state[cid]['status'] = 'done'
            bt.save_state(state)
            done += 1
            done_slugs.append(slug)
            if args.sync_every and done % args.sync_every == 0:
                bt.sync()
        if args.sync_every != 0:
            bt.sync()
    finally:
        try:
            os.remove(bt.LOCK)
        except OSError:
            pass
    bt.poll_prod_all(done_slugs)
    print('Batch complete (hybrid v2): %d published.' % done)
    return 0


if __name__ == '__main__':
    sys.exit(main())

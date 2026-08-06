#!/usr/bin/env python3
"""Deterministic quality gate for tutorial posts (the tutorial-factory analogue of
lesson_quality_check.py). Enforces the automatable half of _build/tutorial-pedagogy.md:

  frontmatter completeness/lengths, plan artifact, structure (H2s, FAQ, Summary,
  References), T1 first-code payoff, T5 block counts, T7 real execution (every
  runnable block runs via local Rscript and every claimed `#>` line matches actual
  output), T8 package fencing against Scripts/webr-package-compat.json, T6 rendered
  diagram for [C] posts, banned strings (em dash, WebR, AI-tell phrases), and
  reference-link resolution.

Usage:
  python Scripts/tutorial_quality_check.py posts/<slug>.md [--skip-links] [--skip-execution]

Exit 0 = publishable. Exit 1 = at least one FAIL (report lists every finding).
Judgment-layer checks (no leaps, grounding, depth ladder) live in /verify-tut.
"""
import os, re, sys, json, glob, argparse, subprocess, tempfile, urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
REGISTRY = os.path.join(ROOT, 'Scripts', 'webr-package-compat.json')

AI_TELLS = ["delve", "seamless", "in today's", "it's important to note", "in conclusion",
            "moreover,", "furthermore,", "unlock", "ever-evolving", "the landscape of",
            "dive into", "game-changer", "elevate your"]

findings = []
def fail(msg): findings.append(('FAIL', msg))
def warn(msg): findings.append(('WARN', msg))
def ok(msg):   findings.append(('PASS', msg))


def parse_frontmatter(text):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.S)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        km = re.match(r'^(\w[\w_]*):\s*(.*)$', line)
        if km:
            fm[km.group(1)] = km.group(2).strip().strip('"').strip("'")
    return fm, text[m.end():]


def parse_blocks(body):
    """Ordered list of (kind, code, start_offset). kind in {'r','r-static'}.

    The fence may carry an info string (e.g. ```r title="..."), which md2html
    renders as the code-box label; it must not hide the block from this gate.
    The [ \t]+ before the info string keeps ```ruby etc. from matching as 'r'.
    """
    out = []
    for m in re.finditer(r'^```(r|r-static)(?:[ \t]+[^\n]*)?\n(.*?)^```\s*$', body, re.S | re.M):
        out.append((m.group(1), m.group(2), m.start()))
    return out


def strip_code(body):
    """Body with fenced code removed, for prose-only structural checks."""
    return re.sub(r'^```.*?^```[ \t]*$', '', body, flags=re.S | re.M)


def find_rscript():
    from shutil import which
    p = which('Rscript')
    if p:
        return p
    hits = sorted(glob.glob(r'C:/Program Files/R/R-*/bin/Rscript.exe'))
    return hits[-1] if hits else None


def run_chain(rscript, blocks, label):
    """Execute blocks in order in ONE session; return {i: actual_output_lines} or None on error.
    Auto-installs missing CRAN packages to the user library (one retry)."""
    lines = ['options(width = 100)', 'Sys.setenv(LANGUAGE = "en")']
    for i, (_, code, _) in enumerate(blocks):
        lines.append('cat("\\n###BLOCK%d###\\n")' % i)
        lines.append('\n'.join(l for l in code.splitlines() if not l.lstrip().startswith('#>')))
    script = '\n'.join(lines)
    for attempt in (1, 2):
        with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as f:
            f.write(script)
            path = f.name
        try:
            # cwd = a scratch dir so plot() side effects (Rplots.pdf) never
            # land in the repo root.
            r = subprocess.run([rscript, '--vanilla', path], capture_output=True, text=True,
                               timeout=600, encoding='utf-8', errors='replace',
                               cwd=tempfile.gettempdir())
        finally:
            try: os.unlink(path)
            except OSError: pass
        if r.returncode == 0:
            outs, cur = {}, None
            for line in r.stdout.splitlines():
                bm = re.match(r'###BLOCK(\d+)###', line.strip())
                if bm:
                    cur = int(bm.group(1)); outs[cur] = []
                elif cur is not None:
                    outs[cur].append(line)
            return outs
        missing = re.findall(r"there is no package called '([^']+)'", r.stderr)
        if attempt == 1 and missing:
            print('  [gate] installing missing package(s): %s' % ', '.join(set(missing)))
            inst = 'install.packages(c(%s), repos="https://cloud.r-project.org", quiet=TRUE)' % \
                   ', '.join('"%s"' % p for p in set(missing))
            subprocess.run([rscript, '-e', inst], capture_output=True, timeout=900)
            continue
        fail('%s execution error:\n%s' % (label, r.stderr.strip()[-1500:]))
        return None
    return None


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('post')
    ap.add_argument('--skip-links', action='store_true')
    ap.add_argument('--skip-execution', action='store_true')
    args = ap.parse_args()

    path = args.post if os.path.exists(args.post) else os.path.join(ROOT, args.post)
    if not os.path.exists(path):
        print('FAIL: file not found: %s' % args.post); return 1
    text = open(path, encoding='utf-8').read()
    fm, body = parse_frontmatter(text)
    slug = os.path.splitext(os.path.basename(path))[0]
    ptype = fm.get('post_type', '')

    # 1. frontmatter
    req = ['title', 'slug', 'description', 'keywords', 'date', 'post_type']
    if ptype == 'C': req += ['sidebar_section', 'sidebar_title', 'curriculum_id']
    if ptype in ('FR', 'EX', 'PSEO'): req += ['fr_parent']
    missing = [k for k in req if not fm.get(k)]
    fail('frontmatter missing: %s' % ', '.join(missing)) if missing else ok('frontmatter complete')
    if fm.get('slug') and fm['slug'] != slug:
        fail('frontmatter slug "%s" != filename stem "%s"' % (fm['slug'], slug))
    t = fm.get('title', '')
    if len(t) > 80: fail('title %d chars (hard ceiling 80)' % len(t))
    elif len(t) > 65: warn('title %d chars (>65 risks SERP mangling)' % len(t))
    d = fm.get('description', '')
    if d and not (120 <= len(d) <= 170): warn('meta description %d chars (aim 140-160)' % len(d))
    if fm.get('webr', 'true').lower() != 'true' and ptype == 'C':
        fail('webr must be true for core tutorials')
    terms = [x for x in fm.get('auto_link_terms', '').split('|') if x.strip()]
    if len(terms) < 5: fail('auto_link_terms has %d terms (need >=5, aim 10-15)' % len(terms))
    elif len(terms) < 10: warn('auto_link_terms has %d terms (aim 10-15)' % len(terms))

    # 2. plan artifact
    plan = os.path.join(ROOT, 'post_plans', slug + '_plan.md')
    ok('plan artifact exists') if os.path.exists(plan) else fail('missing post_plans/%s_plan.md' % slug)

    # 3. structure  (prose only: an R comment like "# fit the model" is not an H1)
    prose = strip_code(body)
    h1s = re.findall(r'^# .+$', prose, re.M)
    if h1s: fail('body contains an H1 (%d found); the page H1 comes from the title' % len(h1s))
    h2s = re.findall(r'^## +(.+)$', prose, re.M)
    if not (3 <= len(h2s) <= 14): fail('%d H2 sections (want 3-14)' % len(h2s))
    else: ok('%d H2 sections' % len(h2s))
    joined = ' | '.join(h2s).lower()
    for want, label in [('faq', 'FAQ'), ('summary', 'Summary'), ('reference', 'References')]:
        if want == 'faq' and ('faq' in joined or 'frequently asked' in joined): ok('FAQ section present'); continue
        if want in joined: ok('%s section present' % label)
        else: fail('missing %s H2 section' % label)

    # 3b. reviewer-sourced structural lints (2026-07-17 factory review)
    for am in re.finditer(r'!\[([^\]]*)\]\(', body):
        if '"' in am.group(1):
            fail('image alt text contains a double quote (breaks the alt attribute): %s'
                 % am.group(1)[:80])
    first_el = next((l for l in prose.splitlines() if l.strip()), '')
    # `<p class="lead">` IS the lead paragraph: build.py anchors the byline to it and the
    # JSON-LD speakable selector targets it, so it is the required opening, not a violation.
    # Any other markup (heading, image, callout, table, bare div) still is one.
    if not re.match(r'<p class="lead"', first_el) and first_el.startswith(('#', '!', '>', '|', '<')):
        fail('body must open with the lead paragraph (plain text answering the title), '
             'not a heading/image/callout')
    triads = re.findall(r'\b(\w[\w() ]{2,30}), (\w[\w() ]{2,30}), (?:and |or )\w[\w() ]{2,30}[.!]',
                        prose)
    if len(triads) > 2:
        warn('%d rhythm-of-three sentence patterns (cap is ~1 per post; vary the shapes)'
             % len(triads))

    # 4. banned strings
    for ch, name in [('—', 'em dash'), ('�', 'broken replacement character')]:
        n = text.count(ch)
        if n: fail('%d %s character(s) present' % (n, name))
    if '–' in body: warn('en dash present (prefer hyphen or "to")')
    if re.search(r'\bWebR\b', body): fail('body names WebR (say "interactive code")')
    low = body.lower()
    hits = sorted({p for p in AI_TELLS if p in low})
    if hits: fail('AI-tell phrases present: %s' % ', '.join(hits))
    else: ok('no AI-tell phrases')

    # 4b. T17 prose flow (_build/prose-voice.md P2). WARN only, and deliberately so:
    # these are corpus-relative style metrics, not correctness. They point a human at
    # the flattest passage; the reorder test in /verify-tut decides whether it is
    # actually wrong. Never block a publish on them.
    #
    # T16 (the cold open / cargo test) has NO check here on purpose. It used to be a
    # substring FAIL on "this guide", "this post", "you will learn" and friends. That
    # was wrong: 1008 such sentences exist across 459 published posts and almost all
    # are innocent ("This guide covers arrows, shaded highlights, and labels"), while
    # the real defect ("This guide keeps a promise the title makes") contains the same
    # substrings. The discriminator is whether a fact about the SUBJECT survives once
    # the article-naming phrase is crossed out, and no regex can evaluate that.
    # T16 is enforced by /verify-tut (judgment layer). See _build/prose-voice.md P1.
    try:
        sys.path.insert(0, os.path.join(ROOT, 'Scripts'))
        from prose_flow_check import analyse as _flow
        fl = _flow(text)
    except Exception:
        fl = None
    if not fl:
        warn('T17 flow: too little prose to measure')
    else:
        bad = []
        if fl['sub_100w'] < 1.2:
            bad.append('sub_100w %.2f < 1.2 (few subordinating connectives)' % fl['sub_100w'])
        if fl['cv'] < 0.48:
            bad.append('cv %.2f < 0.48 (sentence length too uniform)' % fl['cv'])
        if fl['max_flat_run'] > 3:
            bad.append('%d adjacent short subject-opening connective-free sentences'
                       % fl['max_flat_run'])
        if bad:
            warn('T17 flow (prose-voice.md P2, advisory): %s' % '; '.join(bad))
            if fl['worst_run']:
                warn('T17 flattest passage: "%s"' % fl['worst_run'][:220])
        else:
            ok('T17 flow: connectives, varied length, no long flat run')

    # 5. mathjax coherence
    has_math = ('\\(' in body) or ('$$' in body)
    fm_math = fm.get('mathjax', 'false').lower() == 'true'
    if has_math and not fm_math: fail('formulas present but mathjax frontmatter not true')
    if fm_math and not has_math: warn('mathjax true but no formulas found')

    # 6. code blocks
    blocks = parse_blocks(body)
    live = [(i, b) for i, b in enumerate(blocks) if b[0] == 'r']
    static = [(i, b) for i, b in enumerate(blocks) if b[0] == 'r-static']
    need = 8 if ptype == 'C' else 5
    if len(live) < need: fail('%d runnable blocks (need >=%d for %s)' % (len(live), need, ptype or '?'))
    else: ok('%d runnable + %d static blocks' % (len(live), len(static)))

    # T1: first live block inside the FIRST H2 section, with output
    h2_pos = [m.start() for m in re.finditer(r'^## ', body, re.M)]
    if live and h2_pos:
        first = live[0][1]
        sec_end = h2_pos[1] if len(h2_pos) > 1 else len(body)
        if not (h2_pos[0] < first[2] < sec_end):
            fail('T1: first runnable block is not inside the first H2 section')
        elif '#>' not in first[1]:
            fail('T1: first runnable block shows no `#>` output (must deliver the payoff)')
        else:
            ok('T1 first-code payoff in section 1')

    # 7. package fencing (T8)
    # Registry schema: {"base_always_runnable": [...], "packages": {"<pkg>": {"status": ...}}}
    # The per-package statuses live under "packages"; reading the top level yields
    # nothing runnable and would wrongly reject every live library() call.
    reg_raw = json.load(open(REGISTRY, encoding='utf-8'))
    if isinstance(reg_raw, dict):
        pkgs_reg = reg_raw.get('packages', reg_raw)
        base_ok = set(reg_raw.get('base_always_runnable', []))
    else:
        pkgs_reg = {e['package']: e for e in reg_raw}
        base_ok = set()
    runnable = {k for k, v in pkgs_reg.items()
                if (v.get('status') if isinstance(v, dict) else v) == 'runnable'}
    base_ok |= {'stats', 'utils', 'graphics', 'grDevices', 'base', 'methods', 'datasets'}
    for idx, (kind, code, _) in live:
        pkgs = set(re.findall(r'(?:library|require)\(([A-Za-z0-9.]+)\)', code))
        bad = pkgs - runnable - base_ok
        if bad:
            fail('block %d is ```r but uses non-runnable package(s) %s (move to ```r-static)'
                 % (idx + 1, ', '.join(sorted(bad))))

    # 8. execution (T5/T7): live-only chain must run (browser session), full chain
    #    must run AND reproduce every claimed #> line.
    if not args.skip_execution and blocks:
        rscript = find_rscript()
        if not rscript:
            fail('Rscript not found (install R or pass --skip-execution consciously)')
        else:
            live_blocks = [b for _, b in live]
            # The live-only chain proves the browser session (live blocks alone, in
            # order) runs standalone - it catches a live block that secretly needs
            # an object made only in a static block. That check is only meaningful
            # when the post HAS static blocks; if every block is live, the full
            # chain below IS the live-only chain, so running R twice is wasted work
            # (the common case). Skip the redundant run on all-live posts.
            if static and live_blocks and run_chain(rscript, live_blocks, 'live-only chain') is None:
                pass  # fail already recorded
            outs = run_chain(rscript, blocks, 'full chain')
            if outs is not None:
                mism = 0
                for i, (kind, code, _) in enumerate(blocks):
                    claimed = [norm(l.lstrip()[2:]) for l in code.splitlines()
                               if l.lstrip().startswith('#>')]
                    actual = norm(' '.join(outs.get(i, [])))
                    for c in claimed:
                        if c and c not in actual:
                            mism += 1
                            if mism <= 8:
                                fail('block %d claimed output not produced: "%s"' % (i + 1, c[:110]))
                if mism > 8: fail('...and %d more output mismatches' % (mism - 8))
                if not mism: ok('all code executed; every `#>` line matches real output')

    # 9. diagram (T6, [C] only)
    if ptype == 'C':
        figs = re.findall(r'!\[[^\]]*\]\((screenshots/%s-[^)]+\.webp)\)' % re.escape(slug), body)
        if not figs:
            fail('[C] post has no rendered diagram reference (screenshots/%s-*.webp)' % slug)
        else:
            missing_f = [f for f in figs if not os.path.exists(os.path.join(ROOT, f))]
            fail('diagram file(s) missing: %s' % ', '.join(missing_f)) if missing_f \
                else ok('%d diagram(s) referenced and present' % len(figs))

    # 9b. EVERY referenced image exists on disk, any extension (png plot
    # figures included - a reference to a file that never ships renders a
    # blank on prod; see Visualizing-Uncertainty 2026-07-25)
    all_imgs = re.findall(r'!\[[^\]]*\]\((screenshots/[^)]+)\)', body)
    if all_imgs:
        gone = sorted(set(f for f in all_imgs if not os.path.exists(os.path.join(ROOT, f))))
        if gone:
            fail('referenced image(s) not on disk: %s' % ', '.join(gone))
        else:
            ok('%d referenced image(s) all present on disk' % len(set(all_imgs)))

    # 10. references resolve
    refm = re.search(r'^## +.*Reference.*$', body, re.M)
    if refm:
        refsec = body[refm.end():]
        nxt = re.search(r'^## ', refsec, re.M)
        if nxt: refsec = refsec[:nxt.start()]
        urls = re.findall(r'https?://[^\s\)\]>"]+', refsec)
        if not (5 <= len(urls) <= 10):
            (fail if len(urls) < 5 else warn)('%d reference links (want 5-10)' % len(urls))
        if not args.skip_links:
            def _curl_ok(u):
                # Cloudflare-fronted sites block urllib's TLS fingerprint while
                # serving 200 to real clients; curl passes. Fallback, not first
                # resort, so the cheap path still covers most links.
                try:
                    r = subprocess.run(['curl', '-sIL', '-o', os.devnull, '-w', '%{http_code}',
                                        '--max-time', '15', u],
                                       capture_output=True, text=True, timeout=25)
                    code = int((r.stdout or '0').strip()[-3:] or 0)
                    return 200 <= code < 400
                except Exception:
                    return False
            dead = []
            for u in urls[:10]:
                try:
                    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=12) as resp:
                        if resp.status >= 400 and not _curl_ok(u): dead.append(u)
                except Exception:
                    if not _curl_ok(u): dead.append(u)
            if dead: fail('reference link(s) not resolving (urllib and curl): %s' % ', '.join(dead))
            else: ok('all reference links resolve')

    # 11. internal links (info)
    internal = re.findall(r'\]\((?:https?://r-statistics\.co)?/?[A-Za-z0-9-]+\.html', body)
    if len(internal) < 2: warn('only %d internal links (aim for 2+)' % len(internal))

    wc = len(re.sub(r'```.*?```', '', body, flags=re.S).split())
    print('\n=== tutorial_quality_check: %s (%s, %d words, %d live / %d static blocks) ===' %
          (slug, ptype or '?', wc, len(live), len(static)))
    fails = 0
    for level, msg in findings:
        print(' %s %s' % ({'FAIL': '[FAIL]', 'WARN': '[warn]', 'PASS': '[ok]  '}[level], msg))
        fails += level == 'FAIL'
    print('=== %s: %d FAIL, %d warn ===' % ('GATE FAILED' if fails else 'GATE PASSED',
          fails, sum(1 for l, _ in findings if l == 'WARN')))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())

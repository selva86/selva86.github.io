#!/usr/bin/env python3
"""Deterministic quality gate for Publishing Handbook chapters.

Handbook chapters are NOT tutorials. They use a fixed section template (seven
sections for objection chapters, five for decision chapters), never teach the
method. There is no word limit. `Scripts/tutorial_quality_check.py`
enforces FAQ / Summary / References sections, a post_plans/ plan artifact and a
first-code-block-in-section-1 payoff, all of which are correct for tutorials and
wrong here, so a good chapter fails that gate for purely structural reasons.

This gate enforces the MECHANICAL half of the authoring contract in
`.claude/skills/write-handbook-chapter/SKILL.md`:

  fixed section template (names + order), the three mandatory outcomes, three
  response-letter blockquotes, two-plus reviewer phrasings, the
  band, frontmatter completeness, zero em-dashes, and the R execution check:
  every ```r block runs concatenated in ONE Rscript session and every claimed
  `#>` line must match what R actually printed.

Everything here is decidable by a script, and nearly everything FAILs.

NO PROSE RULES LIVE HERE ANY MORE, on purpose. This gate used to carry six
regex "phrase families" (conclusion signposting, significance announcement,
stagey aside, prescriptive formula, AI vocabulary, slogan register) as warnings.
They were removed 2026-08-06 because pattern matching provably cannot do that
job: the significance-announcement family warned on "that is usually the whole
answer", which is verbatim the sentence the authoring skill holds up as the GOOD
rewrite of a commentary tic, and the prescriptive-formula family warned on "The
mistake would be to transform the outcome on the strength of the p-value alone",
which is the chapter doing exactly what it is for. The difference between a tic
and a legitimate summary is semantic, not lexical. A warning list that fires on
good sentences trains people to ignore warnings.

That judgment moved to `/check-handbook-chapter`, an LLM reviewer pass the batch
orchestrator runs between this gate and publish.

Deliberately absent (tutorial rules that must not leak in): FAQ / Summary /
References sections, a post_plans/ plan file, first-code-block position.

Usage:
  python Scripts/handbook_quality_check.py posts/<slug>.md [--skip-execution]

Exit 0 = publishable. Exit 1 = at least one FAIL (report lists every finding).
"""
import os, re, sys, glob, argparse, subprocess, tempfile

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# Parts whose chapters answer a reviewer objection and therefore use the seven
# part template. Everything else is a decision chapter (five part variant).
OBJECTION_PARTS = {9}

OBJECTION_SECTIONS = [
    'What the reviewer wrote',
    'What they actually mean',
    'Why they are asking',
    'How to check it',
    'What to do about it',
    'How to word your response',
    'Practice',
]

DECISION_SECTIONS = [
    'The decision you are making',
    'What the options are',
    'How to decide',
    'What reviewers will ask about this later',
    'How to report it',
]

OUTCOMES = ['You are fine', 'It is fixable', 'It is a real problem']


REQUIRED_FM = ['title', 'slug', 'description', 'keywords', 'post_type', 'fr_parent',
               'handbook', 'handbook_part', 'handbook_chapter', 'auto_link_terms',
               'difficulty']

findings = []
def fail(msg): findings.append(('FAIL', msg))
def warn(msg): findings.append(('WARN', msg))
def ok(msg):   findings.append(('PASS', msg))


# ------------------------------------------------------------------ parsing
# (frontmatter / block / execution machinery mirrors tutorial_quality_check.py
#  on purpose: the R execution check is the part that is already correct.)

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

    The fence may carry an info string (e.g. ```r title="..."); the [ \t]+ before
    it keeps ```ruby etc. from matching as 'r'.
    """
    out = []
    for m in re.finditer(r'^```(r|r-static)(?:[ \t]+[^\n]*)?\n(.*?)^```\s*$', body, re.S | re.M):
        out.append((m.group(1), m.group(2), m.start()))
    return out


def strip_code(body):
    """Body with fenced code removed, for prose-only structural checks."""
    return re.sub(r'^```.*?^```[ \t]*$', '', body, flags=re.S | re.M)


def split_sections(prose):
    """[(heading, section_text)] in document order, from code-stripped prose."""
    parts = re.split(r'^## +(.+?)\s*$', prose, flags=re.M)
    out = []
    for i in range(1, len(parts), 2):
        out.append((parts[i].strip(), parts[i + 1]))
    return out


def section_text(sections, name):
    for h, t in sections:
        if h.lower() == name.lower():
            return t
    return None


def count_blockquotes(text):
    """Blockquote paragraphs = runs of consecutive lines starting with '>'."""
    n, inq = 0, False
    for line in text.splitlines():
        if line.lstrip().startswith('>'):
            if not inq:
                n += 1
            inq = True
        elif not line.strip():
            inq = False
        else:
            inq = False
    return n


def find_rscript():
    from shutil import which
    p = which('Rscript')
    if p:
        return p
    hits = sorted(glob.glob(r'C:/Program Files/R/R-*/bin/Rscript.exe'))
    return hits[-1] if hits else None


def run_chain(rscript, blocks, label):
    """Execute blocks in order in ONE session; return {i: actual_output_lines}
    or None on error. Auto-installs missing CRAN packages (one retry)."""
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
            # cwd = a scratch dir so plot() side effects (Rplots.pdf) never land
            # in the repo root.
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


# ------------------------------------------------------------------ checks

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('post')
    ap.add_argument('--skip-execution', action='store_true')
    args = ap.parse_args()

    path = args.post if os.path.exists(args.post) else os.path.join(ROOT, args.post)
    if not os.path.exists(path):
        print('FAIL: file not found: %s' % args.post); return 1
    text = open(path, encoding='utf-8').read()
    fm, body = parse_frontmatter(text)
    slug = os.path.splitext(os.path.basename(path))[0]
    prose = strip_code(body)
    sections = split_sections(prose)
    headings = [h for h, _ in sections]

    # 1. frontmatter
    missing = [k for k in REQUIRED_FM if not fm.get(k)]
    fail('frontmatter missing: %s' % ', '.join(missing)) if missing else ok('frontmatter complete')
    if fm.get('slug') and fm['slug'] != slug:
        fail('frontmatter slug "%s" != filename stem "%s"' % (fm['slug'], slug))
    terms = [x for x in fm.get('auto_link_terms', '').split('|') if x.strip()]
    if len(terms) < 3:
        fail('auto_link_terms has %d term(s) (need >=3)' % len(terms))
    elif len(terms) < 5:
        warn('auto_link_terms has %d terms (the skill asks for 5 or more)' % len(terms))
    else:
        ok('auto_link_terms has %d terms' % len(terms))

    t = fm.get('title', '')
    if len(t) > 60: fail('title %d chars (ceiling 60)' % len(t))
    else: ok('title %d chars' % len(t))
    d = fm.get('description', '')
    if not (150 <= len(d) <= 160): fail('meta description %d chars (must be 150-160)' % len(d))
    else: ok('meta description %d chars' % len(d))

    # 2. chapter kind + section template
    try:
        part = int(str(fm.get('handbook_part', '')).strip())
    except ValueError:
        part = None
        fail('handbook_part is not a number: %r' % fm.get('handbook_part'))
    objection = part in OBJECTION_PARTS
    want = OBJECTION_SECTIONS if objection else DECISION_SECTIONS
    kind = 'objection' if objection else 'decision'

    if [h.lower() for h in headings] == [w.lower() for w in want]:
        ok('%s template: all %d sections, correct names, correct order' % (kind, len(want)))
    else:
        fail('%s template violated. Expected exactly:\n     %s\n   Got:\n     %s'
             % (kind, ' | '.join(want), ' | '.join(headings) or '(no H2 sections)'))

    h1s = re.findall(r'^# .+$', prose, re.M)
    if h1s: fail('body contains an H1 (%d found); the page H1 comes from the title' % len(h1s))

    # 3-5. section-level contract (objection chapters only: the decision variant
    #      has no equivalent sections)
    if objection:
        sec = section_text(sections, 'What to do about it')
        if sec is None:
            fail('cannot check the three outcomes: "What to do about it" is missing')
        else:
            h3s = [x.strip().lower() for x in re.findall(r'^### +(.+?)\s*$', sec, re.M)]
            absent = [o for o in OUTCOMES if o.lower() not in h3s]
            if absent:
                fail('"What to do about it" is missing outcome heading(s): %s' % ', '.join(absent))
            else:
                ok('all three outcomes present (You are fine / It is fixable / It is a real problem)')

        sec = section_text(sections, 'How to word your response')
        if sec is None:
            fail('cannot check response wording: "How to word your response" is missing')
        else:
            n = count_blockquotes(sec)
            if n < 3: fail('"How to word your response" has %d blockquote paragraph(s) (need >=3)' % n)
            else: ok('"How to word your response" has %d blockquote response(s)' % n)

        sec = section_text(sections, 'What the reviewer wrote')
        if sec is None:
            fail('cannot check reviewer phrasings: "What the reviewer wrote" is missing')
        else:
            n = count_blockquotes(sec)
            if n < 2: fail('"What the reviewer wrote" has %d blockquote(s) (need >=2)' % n)
            else: ok('"What the reviewer wrote" has %d reviewer phrasing(s)' % n)

    # 6. length: REPORTED, NEVER GATED.
    #
    # There is deliberately no word limit. Length is not a quality signal, and a
    # ceiling blocks good work for the wrong reason: a 2,243-word hub page that
    # was exactly the right length for its job failed this check purely on size.
    # If a chapter is too long the real defect is that it teaches a method it
    # should link to, and the judge catches that by reading the prose. A number
    # cannot tell the difference between thorough and padded.
    wc = len(re.sub(r'```.*?```', '', body, flags=re.S).split())
    ok('%d words' % wc)

    # 7. em-dashes
    for ch, name in [('\u2014', 'em dash'), ('\ufffd', 'broken replacement character')]:
        n = text.count(ch)
        if n: fail('%d %s character(s) present' % (n, name))
    if '\u2014' not in text: ok('no em-dashes')
    if '\u2013' in body: warn('en dash present (prefer hyphen or "to")')

    # 8. (was: six regex prose families, WARN only. Removed 2026-08-06 - see the
    #    module docstring. Prose is judged by /check-handbook-chapter, which runs
    #    after this gate and before publish.)

    # 9. WebR is a hard rule, not a style preference: it is never named in
    #    public-facing copy.
    if re.search(r'\bWebR\b', body): fail('body names WebR (say "interactive code")')

    # 10. mathjax coherence (cheap, catches a rendering bug not a tutorial rule)
    has_math = ('\\(' in body) or ('$$' in body)
    fm_math = fm.get('mathjax', 'false').lower() == 'true'
    if has_math and not fm_math: fail('formulas present but mathjax frontmatter not true')

    # 11. R execution: every ```r block runs concatenated in ONE session and
    #     every claimed `#>` line must match what R actually printed.
    blocks = parse_blocks(body)
    live = [b for b in blocks if b[0] == 'r']
    if not args.skip_execution and blocks:
        rscript = find_rscript()
        if not rscript:
            fail('Rscript not found (install R or pass --skip-execution consciously)')
        else:
            outs = run_chain(rscript, blocks, 'full chain')
            if outs is not None:
                mism = 0
                for i, (kind_, code, _) in enumerate(blocks):
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

    print('\n=== handbook_quality_check: %s (ch %s, part %s, %s, %d words, %d block(s)) ==='
          % (slug, fm.get('handbook_chapter', '?'), fm.get('handbook_part', '?'),
             kind, wc, len(live)))
    fails = 0
    for level, msg in findings:
        print(' %s %s' % ({'FAIL': '[FAIL]', 'WARN': '[warn]', 'PASS': '[ok]  '}[level], msg))
        fails += level == 'FAIL'
    print('=== %s: %d FAIL, %d warn ===' % ('GATE FAILED' if fails else 'GATE PASSED',
          fails, sum(1 for l, _ in findings if l == 'WARN')))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())

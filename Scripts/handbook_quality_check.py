#!/usr/bin/env python3
"""Deterministic quality gate for Publishing Handbook chapters.

Handbook chapters are NOT tutorials. They use a fixed section template (seven
sections for objection chapters, five for decision chapters), never teach the
method, and are capped at 1,800 words. `Scripts/tutorial_quality_check.py`
enforces FAQ / Summary / References sections, a post_plans/ plan artifact and a
first-code-block-in-section-1 payoff, all of which are correct for tutorials and
wrong here, so a good chapter fails that gate for purely structural reasons.

This gate enforces the authoring contract in
`.claude/skills/write-handbook-chapter/SKILL.md`:

  fixed section template (names + order), the three mandatory outcomes, three
  response-letter blockquotes, two-plus reviewer phrasings, the 1,200-1,800 word
  band, frontmatter completeness, zero em-dashes, the prose-family probes
  (warn only, for a human to judge), and the R execution check: every ```r block
  runs concatenated in ONE Rscript session and every claimed `#>` line must
  match what R actually printed.

Two severities, and the split is deliberate:

  FAIL  only for the unambiguous and mechanical: em-dashes, frontmatter
        problems, missing/misnamed/misordered sections, missing outcomes,
        missing response blockquotes, word count out of band, a body H1, a
        WebR mention, and R output that does not match a real run.
  WARN  for everything prose-stylistic. The prose families below match a
        rhetorical MOVE, not a literal string, so they are broad by design and
        false positives are expected. The gate surfaces candidates; a human
        adjudicates. No prose rule can ever fail a chapter.

Deliberately absent (tutorial rules that must not leak in): FAQ / Summary /
References sections, a post_plans/ plan file, first-code-block position.

Usage:
  python Scripts/handbook_quality_check.py posts/<slug>.md [--skip-execution]

Exit 0 = publishable. Exit 1 = at least one FAIL (report lists every finding).
"""
import os, re, sys, glob, argparse, subprocess, tempfile
from collections import Counter

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

WORDS_MIN, WORDS_MAX = 1200, 1800

REQUIRED_FM = ['title', 'slug', 'description', 'keywords', 'post_type', 'fr_parent',
               'handbook', 'handbook_part', 'handbook_chapter', 'auto_link_terms',
               'difficulty']

# ------------------------------------------------------------------ prose families
#
# Detection is by FAMILY, not by literal. Each family is one rhetorical move,
# expressed as a list of loose regexes:
#
#   * case-insensitive,
#   * `\s+` between words so a line break never defeats a phrase,
#   * `\b` boundaries so a phrase buried in a longer word is not a hit,
#   * optional intervening words where the move tolerates them
#     ("that is usually the whole answer" is the same tic as "that is the key"),
#   * typographic and straight apostrophes both accepted.
#
# Everything here WARNs. Broad matching means innocent prose will sometimes
# match, and that is the intended trade: a missed tic ships, a false positive
# costs one glance.

APO = r"['\u2019]"

# "that is" / "this was" / "which's" / "it is" - the head of most significance
# announcements, in every contraction and tense the tic actually appears in.
DEM = r'\b(?:that|this|it|which)(?:' + APO + r's|\s+is|\s+was|\s+really\s+is)'

# Start of a sentence: line start (blockquote marker allowed) or after . ! ?
SENT = r'(?:^\s*>?\s*|[.!?][\'")]?\s+)'


def ph(phrase):
    """A plain phrase -> a whitespace-tolerant, word-anchored regex.

    Hyphens match a hyphen or a space; apostrophes match either quote glyph."""
    core = r'\s+'.join(re.escape(w) for w in phrase.split())
    core = core.replace(r'\-', r'[-\s]').replace("-", r'[-\s]')
    core = core.replace(r"\'", APO).replace("'", APO)
    left = r'\b' if phrase[0].isalnum() else ''
    right = r'\b' if phrase[-1].isalnum() else ''
    return left + core + right


FAMILIES = [
    # ---------------------------------------------------------- 1
    ('conclusion signposting', [
        # Anchored to a sentence opener or the comma form, because a handbook
        # about defending analyses talks about conclusions constantly: "no
        # change in conclusion", "enough evidence to conclude that the means
        # differ" and "the main conclusions are unchanged" are ordinary prose
        # here. The tic is the signpost, not the noun.
        SENT + r'in\s+conclusion\b',
        r'\bin\s+conclusion\s*,',
        SENT + r'to\s+conclude\b(?!\s+that\b)',
        r'\bto\s+conclude\s*,',
        r'\bin\s+(?:brief\s+|short\s+)?summary\b',
        ph('to summarise'), ph('to summarize'),
        ph('to sum up'), ph('summing up'),
        ph('all in all'),
        ph('in closing'),
        ph('in the final analysis'),
        r'\bultimately\b',
        ph('at the end of the day'),
        r'\bthe\s+bottom\s+line\b',
        ph('to wrap up'), ph('to wrap this up'),
        r'\bin\s+the\s+end\b',
    ]),

    # ---------------------------------------------------------- 2
    # The commentary tic, and the highest-value family here: a sentence that
    # announces the significance of what was just said instead of continuing to
    # explain it.
    ('significance announcement', [
        # "that is the single/real/whole/key <noun>", with up to two hedging
        # words in front of "the" and the adjective doing the flagging.
        DEM + r'\s+(?:\w+\s+){0,2}the\s+(?:single|real|whole|entire|key|crucial|'
              r'central|critical|important|essential|main|core|only|first|second|'
              r'third|biggest|hardest)\s+\w+',
        # "that is the point/crux/takeaway", with intervening words either side.
        DEM + r'\s+(?:\w+\s+){0,2}the\s+(?:\w+\s+){0,2}'
              r'(?:key|point|crux|heart|essence|takeaway|upshot|moral|lesson)\b',
        DEM + r'\s+(?:exactly|precisely|just)\s+why\b',
        DEM + r'\s+what\s+makes\b',
        DEM + r'\s+why\s+(?:it|this|that)\s+matters\b',
        ph('therein lies'),
        r'\bthe\s+(?:important|crucial|key|essential|whole)\s+(?:thing|point|part)\b',
        r'\bwhat\s+(?:really\s+)?matters\s+(?:here\s+)?is\b',
        # "that is collinearity in one picture"
        r'\bin\s+(?:one|a\s+single)\s+(?:picture|sentence|line|number|word|graph|plot|table)\b',
        r'\bin\s+a\s+nutshell\b',
        r'\bthat\s+single\s+\w+\b',
        r'\bthe\s+(?:whole|entire)\s+(?:answer|story|game)\b',
        r'\bwhich\s+is\s+(?:exactly\s+|precisely\s+)?the\s+(?:whole\s+)?point\b',
    ]),

    # ---------------------------------------------------------- 3
    ('stagey aside', [
        r'\bnote\s+what\b',
        r'\bnotice\s+(?:what|how|that)\b',
        r'\blook\s+at\s+(?:what|how)\b',
        r'\bobserve\s+that\b',
        r'\bconsider\s+this\b',
        r'\bhere(?:' + APO + r's|\s+is)\s+the\s+thing\b',
        r'\bthe\s+thing\s+is\b',
        r'\bwatch\s+what\s+happens\b',
        r'\bask\s+yourself\b',
    ]),

    # ---------------------------------------------------------- 4
    ('prescriptive formula', [
        r'\bthe\s+mistake\s+(?:to\s+avoid|here|would\s+be|is)\b',
        r'\bthe\s+wrong\s+(?:move|answer|response)\b',
        r'\bthe\s+(?:key\s+)?take[-\s]?away\b',
        r'\bremember\s+that\b',
        r'\b(?:keep|bear)\s+(?:this\s+)?in\s+mind\b',
        r'\bworth\s+(?:noting|remembering|bearing\s+in\s+mind)\b',
        r'\b(?:it\s+is|it' + APO + r's)\s+important\s+to\s+'
        r'(?:note|remember|understand|realise|realize)\b',
        r'\bnote\s+that\b',
        r'\bthe\s+rule\s+of\s+thumb\s+(?:here\s+)?is\b',
        r'\balways\s+remember\b',
    ]),

    # ---------------------------------------------------------- 5
    # "robust" and "leverage" are load-bearing statistical words in this
    # handbook ("robust to non-normality", "high-leverage point"), so both are
    # matched only in their filler constructions. See the header note.
    ('AI vocabulary', [
        r'\bdelv(?:e|es|ed|ing)\b',
        r'\bunlock(?:s|ed|ing)?\b',
        r'\bnavigat\w*\s+(?:the\s+|this\s+)?(?:complex\s+|ever[-\s]?changing\s+)?'
        r'(?:landscape|world|waters|maze|terrain)\b',
        r'\bever[-\s]?(?:evolving|changing|growing)\b',
        r'\bin\s+today' + APO + r's\b',
        r'\bin\s+the\s+(?:modern|current)\s+(?:era|landscape|world)\b',
        r'\bleverag(?:e|es|ed|ing)\s+(?:the|this|these|our|your|their|its|a|an)\b',
        r'\brobust\s+(?:and\s+\w+\s+)?(?:solution|framework|approach|methodolog|'
        r'system|platform|tool|toolkit|workflow|pipeline|foundation|process|'
        r'strategy|insight)\w*\b',
        r'\bseamless(?:ly)?\b',
        r'\bharness(?:ing|es)?\s+the\s+power\b',
        r'\bgame[-\s]?chang(?:er|ing)\b',
        r'\b(?:deep\s+dive|dive\s+deep(?:er)?|diving\s+deep)\b',
        r'\bcutting[-\s]edge\b',
        r'\bpowerful\s+(?:tool|technique|approach|framework)\b',
        r'\bthe\s+world\s+of\b',
        r'\bembark\b',
        r'\btapestry\b',
    ]),
]

FAMILY_RX = [(name, [re.compile(p, re.I | re.M) for p in pats])
             for name, pats in FAMILIES]

# Slogan register: a standalone short paragraph that is a rhetorical beat rather
# than an explanation. The only family that is not a phrase list.
#
# Brevity alone is NOT the test. Tried that first and it flagged every ordinary
# short sentence ("We noted the departure in the supplement."), which is exactly
# the noise this family is worth dropping over. So a paragraph must be short,
# standalone, free of anything concrete (no number, code span, link or markup),
# AND carry one of the shapes below: a rhythm-of-three triad, an aphoristic
# reversal, a clipped imperative closer, or so few words that it can only be a
# beat.
SLOGAN_MAX_WORDS = 11
SLOGAN_BEAT_WORDS = 5           # a paragraph this short is a beat, not a point
SLOGAN_SHAPES = [
    r'^\w+(?:\s+\w+){0,2},\s+\w+(?:\s+\w+){0,2}\s+and\s+\w+',        # triad
    r'\b(?:never|not|nothing)\b[^.]{0,45}\b(?:just|only|merely|simply)\b',  # reversal
    r'\band\s+(?:stop|move\s+on|be\s+done|nothing\s+more)\b',         # clipped closer
    r'\bthat\s+is\s+(?:all|it)\b',
]
SLOGAN_RX = [re.compile(p, re.I) for p in SLOGAN_SHAPES]

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


def _blank(m):
    """Same span, same length, no content: keeps every offset and line number."""
    return re.sub(r'[^\n]', ' ', m.group(0))


def blank_fences(body):
    """Body with fenced code blanked out. Frontmatter is already gone."""
    return re.sub(r'^```.*?^```[ \t]*$', _blank, body, flags=re.S | re.M)


def blank_code(body):
    """Fenced code AND inline `code` spans blanked out.

    Blockquotes are left alone on purpose: a reviewer quote or a response letter
    is prose the author wrote, so it gets scanned. Hits inside one are reported
    separately, because reviewer voice legitimately sounds different.
    """
    return re.sub(r'`[^`\n]*`', _blank, blank_fences(body))


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


# ------------------------------------------------------------------ family scan

def _paragraphs(text):
    """[(first_line_index, [lines])] for each blank-line-separated block."""
    lines = text.split('\n')
    out, i = [], 0
    while i < len(lines):
        if not lines[i].strip():
            i += 1
            continue
        j = i
        while j < len(lines) and lines[j].strip():
            j += 1
        out.append((i, lines[i:j]))
        i = j
    return out


def scan_families(body, line_offset):
    """[(family, file_line, matched_phrase, source_line, in_blockquote)].

    One hit per family per line: several patterns in a family routinely match
    overlapping spans of the same sentence, and repeating the line teaches the
    reader nothing."""
    scan = blank_code(body)
    src = body.split('\n')
    seen, hits = set(), []
    for name, pats in FAMILY_RX:
        for rx in pats:
            for m in rx.finditer(scan):
                idx = scan.count('\n', 0, m.start())
                if (name, idx) in seen:
                    continue
                seen.add((name, idx))
                line = src[idx] if idx < len(src) else ''
                hits.append((name, idx + 1 + line_offset, norm(m.group(0)),
                             norm(line), line.lstrip().startswith('>')))
    hits += scan_slogans(body, line_offset)
    hits.sort(key=lambda h: (h[1], h[0]))
    return hits


def scan_slogans(body, line_offset):
    """Slogan register: a standalone paragraph that is one short sentence with
    nothing concrete in it and a slogan's shape. Best-effort by construction -
    slogan is a register, not a string - so it is tuned to stay quiet on
    ordinary explanatory prose: anything with a number, a code span, a link,
    markup, or a second sentence is specific enough to be left alone."""
    hits = []
    for start, lines in _paragraphs(blank_fences(body)):
        t = norm(' '.join(l.strip() for l in lines))
        if not t or t[0] in '#>-*|<!' or re.match(r'^\d+[.)]', t):
            continue
        if any(x in t for x in ('`', '](', '<', '|', '=', '#>')):
            continue
        if re.search(r'\d', t):
            continue
        if len(re.split(r'(?<=[.!?])\s+', t)) != 1:
            continue
        if not t.endswith(('.', '!')):          # a question is the template's, not a slogan
            continue
        n = len(t.split())
        if n > SLOGAN_MAX_WORDS or n < 2:
            continue
        if n > SLOGAN_BEAT_WORDS and not any(rx.search(t) for rx in SLOGAN_RX):
            continue
        line = lines[0].strip()
        hits.append(('slogan register', start + 1 + line_offset, t[:60],
                     norm(line), False))
    return hits


def report_families(hits):
    """One summary line, then one warn per hit so a human can judge each."""
    if not hits:
        ok('no prose-family candidates matched')
        return
    counts = Counter(h[0] for h in hits)
    quoted = sum(1 for h in hits if h[4])
    warn('prose families: %d candidate(s) [%s]%s'
         % (len(hits),
            ', '.join('%s %d' % (k, v) for k, v in sorted(counts.items())),
            ' (%d inside a blockquote, where reviewer/response voice '
            'legitimately differs)' % quoted if quoted else ''))
    for name, ln, phrase, line, inq in hits:
        warn('  %-26s line %-4d "%s"%s\n          %s'
             % (name, ln, phrase[:60], '  [blockquote]' if inq else '', line[:150]))


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
    # body is a suffix of text, so this counts the frontmatter's lines exactly.
    fm_lines = text[:len(text) - len(body)].count('\n')
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

    # 6. length (hard rule in the skill: longer means the method is being taught)
    wc = len(re.sub(r'```.*?```', '', body, flags=re.S).split())
    if wc < WORDS_MIN: fail('%d words (must be %d-%d; a section was shortchanged)'
                            % (wc, WORDS_MIN, WORDS_MAX))
    elif wc > WORDS_MAX: fail('%d words (must be %d-%d; link the method instead of teaching it)'
                              % (wc, WORDS_MIN, WORDS_MAX))
    else: ok('%d words (in the %d-%d band)' % (wc, WORDS_MIN, WORDS_MAX))

    # 7. em-dashes
    for ch, name in [('\u2014', 'em dash'), ('\ufffd', 'broken replacement character')]:
        n = text.count(ch)
        if n: fail('%d %s character(s) present' % (n, name))
    if '\u2014' not in text: ok('no em-dashes')
    if '\u2013' in body: warn('en dash present (prefer hyphen or "to")')

    # 8. prose families (WARN only; a human judges each hit). Code fences and
    #    inline code are blanked first, so R never trips a family; blockquotes
    #    are scanned but flagged, because reviewer voice sounds different.
    report_families(scan_families(body, fm_lines))

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

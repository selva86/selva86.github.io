#!/usr/bin/env python3
"""Measure prose FLOW in site content: does it read like connected speech, or like
a list of true statements?

The defect this detects (see _build/prose-voice.md, the P-rules):

    "You measure the IQ of 30 people and get an average of 103. A colleague
     repeats the same study with 30 different people and gets 98."

Two adjacent facts, both short, both opening on their subject, with nothing
between them saying how one bears on the other. Every sentence stands alone, so
the paragraph could be shuffled without loss. Human prose is an argument: each
sentence needs the one before it.

Three axes, all computed on body prose only (code, tables, lists, headings,
figures, callouts and <details> blocks are excluded):

  flat_pct   share of sentences that are SHORT (<= 14 words) AND open on their
             subject AND contain no subordinating connective. High = choppy.
  sub_100w   subordinating connectives per 100 words (because / so that /
             whereas / which means / even though / once / until / rather than ...).
             Low = choppy. Coordination ("and", "but") is deliberately NOT counted:
             it joins facts without saying how they bear on each other.
  cv         coefficient of variation of sentence length (sd / mean). Generated
             prose clusters around one length; human prose varies hard. Low = choppy.

CHOP is the mean of the three corpus percentile ranks (0-100, higher = choppier).
It is a RANKING aid for human spot-checks, not a pass/fail verdict: prose quality
is a judgment call and this script only points at where to look.

Usage:
  python Scripts/prose_flow_check.py posts/<slug>.md      # one file, verbose
  python Scripts/prose_flow_check.py --all                # rank the whole corpus
  python Scripts/prose_flow_check.py --all --worst 20     # worst N only
  python Scripts/prose_flow_check.py --all --json out.json
  python Scripts/prose_flow_check.py --all --dirs posts lessons
"""
import os, re, sys, glob, json, math, argparse, statistics

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# --- Tier A: SUBORDINATING / logical connectives. These say how one clause bears
# on another. Their absence is the defect. Coordination (and/but/or) is excluded
# on purpose: it chains facts without subordinating one to the other.
SUBORDINATORS = [
    r'\bbecause\b', r'\bsince\b', r'\balthough\b', r'\bthough\b',
    r'\beven though\b', r'\beven if\b', r'\bwhereas\b', r'\bwhile\b',
    r'\bunless\b', r'\buntil\b', r'\bonce\b', r'\bso that\b',
    r'\bin order to\b', r'\bgiven that\b', r'\bprovided that\b',
    r'\brather than\b', r'\binstead of\b', r'\bas long as\b',
    r'\bas soon as\b', r'\bwhich means\b', r'\bwhich is why\b',
    r'\bthat is why\b', r'\bwhich\b', r'\bwhose\b', r'\bwhom\b',
    r'\bwhether\b', r'\bdespite\b', r'\bin spite of\b', r'\bso long as\b',
    r',\s*so\b',            # causal "so", not sentence-initial discourse "So"
    r',\s*which\b',
    r'\btherefore\b', r'\bhence\b', r'\bthus\b',
]
SUB_RE = re.compile('|'.join(SUBORDINATORS), re.I)

# Words that, sentence-initially, mean the sentence does NOT open on its subject.
FRONTERS = {
    # subordinators
    'because', 'since', 'although', 'though', 'when', 'whenever', 'while',
    'if', 'unless', 'until', 'once', 'after', 'before', 'as', 'whereas',
    'given', 'provided', 'rather', 'instead', 'whether', 'despite',
    # conjunctive adverbs / discourse
    'but', 'so', 'yet', 'however', 'therefore', 'hence', 'thus', 'still',
    'now', 'then', 'also', 'again', 'even', 'not', 'nor', 'and',
    'first', 'second', 'third', 'next', 'finally', 'meanwhile', 'later',
    'here', 'there', 'together', 'either', 'both', 'most', 'many', 'some',
    # prepositions (fronted adverbial)
    'in', 'on', 'at', 'by', 'for', 'with', 'without', 'from', 'to', 'under',
    'over', 'during', 'through', 'across', 'between', 'among', 'against',
    'behind', 'beyond', 'inside', 'outside', 'above', 'below', 'unlike',
    'like', 'about', 'along', 'toward', 'towards', 'per', 'via', 'upon',
    # imperatives / second-person openers that front an action, not a subject
    'let', 'notice', 'run', 'try', 'compare', 'look', 'start', 'think',
    'suppose', 'imagine', 'consider', 'note', 'watch', 'read', 'see', 'take',
    'put', 'call', 'add', 'set', 'pick', 'keep', 'remember', 'picture',
}

ABBREV = [('e.g.', 'eg'), ('i.e.', 'ie'), ('et al.', 'etal'), ('vs.', 'vs'),
          ('Dr.', 'Dr'), ('Fig.', 'Fig'), ('approx.', 'approx'),
          ('Inc.', 'Inc'), ('cf.', 'cf'), ('etc.', 'etc'), ('No.', 'No'),
          ('St.', 'St'), ('Mr.', 'Mr'), ('Ms.', 'Ms'), ('Prof.', 'Prof')]

SHORT_WORDS = 14      # a sentence at or under this is "short"
FLAT_RUN_MIN = 3      # a run of this many flat sentences is worth flagging


def strip_frontmatter(text):
    m = re.match(r'^---\s*\n.*?\n---\s*\n', text, re.S)
    return text[m.end():] if m else text


def extract_prose(md):
    """Return body prose only: teaching paragraphs and the <p class="lead">.

    Removed: fenced code, <details> blocks, headings, tables, bullet/numbered
    lists, images + figure captions, blockquotes, [CALLOUT] bodies, step fences.
    Those are legitimately terse or non-prose; measuring them would just add noise.
    """
    md = strip_frontmatter(md)
    md = re.sub(r'^```.*?^```', '\n', md, flags=re.S | re.M)      # fenced code
    md = re.sub(r'<details>.*?</details>', '\n', md, flags=re.S | re.I)
    md = re.sub(r'^===\s*step\s*===.*$', '', md, flags=re.M)       # lesson fences
    md = re.sub(r'^::.*$', '', md, flags=re.M)                     # lesson directives

    keep = []
    skip_callout = False
    for line in md.splitlines():
        s = line.strip()
        if not s:
            skip_callout = False
            keep.append('')
            continue
        # [KEY INSIGHT] / [TIP] / [NOTE] marker: drop the marker AND its body
        if re.match(r'^\[[A-Z][A-Z \-]+\]$', s):
            skip_callout = True
            continue
        if skip_callout:
            continue
        if s.startswith(('#', '|', '>', '!', '<div', '</div', '<table', '</table',
                         '<img', '<a ', '---', '***', '___')):
            continue
        if re.match(r'^([-*+]\s|\d+[.)]\s)', s):        # list item
            continue
        if re.match(r'^\*Figure\b', s, re.I):           # figure caption
            continue
        if re.match(r'^\*\*(Try it|Your turn|Exercise)', s, re.I):
            continue
        keep.append(s)

    txt = '\n'.join(keep)
    txt = re.sub(r'<p class="lead">(.*?)</p>', r'\1', txt, flags=re.S | re.I)
    txt = re.sub(r'<[^>]+>', ' ', txt)                   # remaining inline HTML
    txt = re.sub(r'`[^`]*`', ' CODE ', txt)              # inline code -> one token
    txt = re.sub(r'\$\$.*?\$\$', ' MATH ', txt, flags=re.S)
    txt = re.sub(r'\\\(.*?\\\)', ' MATH ', txt, flags=re.S)
    txt = re.sub(r'\$[^$\n]+\$', ' MATH ', txt)
    txt = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', txt)      # images
    txt = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', txt)   # links -> anchor text
    txt = re.sub(r'[*_]{1,3}', '', txt)                  # bold / italic markers
    txt = re.sub(r'&[a-z]+;', ' ', txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    return txt


def split_sentences(prose):
    for a, b in ABBREV:
        prose = prose.replace(a, b)
    # paragraph-aware: never let a sentence straddle a blank line
    out = []
    for para in re.split(r'\n\s*\n', prose):
        para = ' '.join(para.split())
        if not para:
            continue
        for s in re.split(r'(?<=[.!?])\s+(?=[A-Z"\'(\[])', para):
            s = s.strip()
            if len(s.split()) >= 3:      # fragments are not sentences
                out.append(s)
    return out


def words(s):
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-]*", s)


def is_subject_opening(s):
    """True when the sentence starts straight on its subject (no fronted clause,
    adverbial, connective or imperative). Heuristic, no POS tagger."""
    if s.rstrip().endswith('?'):
        return False
    w = words(s)
    if not w:
        return False
    if w[0].lower() in FRONTERS:
        return False
    # a fronted adverbial/clause: a comma inside the first 5 words, where the
    # material before it is short and not a coordinated clause
    head = ' '.join(s.split()[:6])
    m = re.search(r',', head)
    if m:
        before = words(head[:m.start()])
        if len(before) <= 5 and not re.search(r'\b(and|but|or|so)\s*$', head[:m.start()], re.I):
            return False
    return True


def analyse(md_text):
    prose = extract_prose(md_text)
    sents = split_sentences(prose)
    if len(sents) < 15:
        return None
    lens = [len(words(s)) for s in sents]
    n_words = sum(lens)
    mean_len = statistics.mean(lens)
    sd_len = statistics.pstdev(lens)
    cv = sd_len / mean_len if mean_len else 0.0

    flat = []
    for s, L in zip(sents, lens):
        flat.append(L <= SHORT_WORDS and is_subject_opening(s) and not SUB_RE.search(s))

    run = best = 0
    best_at = 0
    for i, f in enumerate(flat):
        run = run + 1 if f else 0
        if run > best:
            best, best_at = run, i - run + 1

    n_sub = len(SUB_RE.findall(prose))
    return {
        'n_sent': len(sents),
        'n_words': n_words,
        'mean_len': round(mean_len, 1),
        'sd_len': round(sd_len, 1),
        'cv': round(cv, 3),
        'short_pct': round(100.0 * sum(1 for L in lens if L <= SHORT_WORDS) / len(lens), 1),
        'subj_open_pct': round(100.0 * sum(1 for s in sents if is_subject_opening(s)) / len(sents), 1),
        'flat_pct': round(100.0 * sum(flat) / len(flat), 1),
        'sub_100w': round(100.0 * n_sub / n_words, 2) if n_words else 0.0,
        'max_flat_run': best,
        'worst_run': ' '.join(sents[best_at:best_at + best]) if best >= FLAT_RUN_MIN else '',
    }


def pct_rank(value, sorted_vals, higher_is_worse):
    """Percentile rank of value in the corpus, oriented so 100 = worst."""
    n = len(sorted_vals)
    if n < 2:
        return 50.0
    below = sum(1 for v in sorted_vals if v < value)
    p = 100.0 * below / (n - 1)
    return p if higher_is_worse else 100.0 - p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('path', nargs='?')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--dirs', nargs='*', default=['posts', 'lessons'])
    ap.add_argument('--worst', type=int, default=0)
    ap.add_argument('--json')
    args = ap.parse_args()

    if args.path and not args.all:
        with open(os.path.join(ROOT, args.path) if not os.path.isabs(args.path) else args.path,
                  encoding='utf-8') as fh:
            r = analyse(fh.read())
        if not r:
            print('too little prose to measure')
            return 0
        print(json.dumps(r, indent=2))
        return 0

    rows = []
    for d in args.dirs:
        for p in sorted(glob.glob(os.path.join(ROOT, d, '*.md'))):
            try:
                with open(p, encoding='utf-8') as fh:
                    r = analyse(fh.read())
            except Exception:
                continue
            if r:
                r['slug'] = os.path.splitext(os.path.basename(p))[0]
                r['dir'] = d
                rows.append(r)

    flats = sorted(r['flat_pct'] for r in rows)
    subs = sorted(r['sub_100w'] for r in rows)
    cvs = sorted(r['cv'] for r in rows)
    for r in rows:
        r['chop'] = round((pct_rank(r['flat_pct'], flats, True) +
                           pct_rank(r['sub_100w'], subs, False) +
                           pct_rank(r['cv'], cvs, False)) / 3.0, 1)
    rows.sort(key=lambda r: -r['chop'])

    def q(vals, p):
        v = sorted(vals)
        return round(v[min(len(v) - 1, int(p / 100.0 * len(v)))], 3)

    print('corpus: %d files (%s)' % (len(rows), ', '.join(args.dirs)))
    print('%-12s %8s %8s %8s %8s %8s' % ('metric', 'p10', 'p25', 'median', 'p75', 'p90'))
    for name, vals in (('flat_pct', flats), ('sub_100w', subs), ('cv', cvs),
                       ('mean_len', [r['mean_len'] for r in rows]),
                       ('subj_open%', [r['subj_open_pct'] for r in rows])):
        print('%-12s %8s %8s %8s %8s %8s' % (name, q(vals, 10), q(vals, 25),
                                             q(vals, 50), q(vals, 75), q(vals, 90)))
    print()
    print('%-5s %-52s %6s %6s %6s %6s %5s' %
          ('CHOP', 'slug', 'flat%', 'sub', 'cv', 'meanL', 'run'))
    for r in (rows[:args.worst] if args.worst else rows):
        print('%-5s %-52s %6s %6s %6s %6s %5s' %
              (r['chop'], r['slug'][:52], r['flat_pct'], r['sub_100w'],
               r['cv'], r['mean_len'], r['max_flat_run']))

    if args.json:
        with open(args.json, 'w', encoding='utf-8') as fh:
            json.dump(rows, fh, indent=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())

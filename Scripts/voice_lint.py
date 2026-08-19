#!/usr/bin/env python3
"""voice_lint.py - deterministic voice tells for lesson prose (owner voice pack).

Used two ways:
  1. imported by lesson_quality_check.py:  lint_steps(steps) -> [(sev, msg), ...]
     HARD tells FAIL the gate (dashes, WebR, cross-part references, meta-narration,
     step-number references); heuristic tells WARN with the sentences listed.
  2. standalone, to feed the voice pass:  python Scripts/voice_lint.py lessons/<slug>.md
     prints every flagged sentence with its step number, one per line.

Only PROSE is examined: code fences, :: directives, headings, tables, list items
(objectives, quiz options) and callout markers are skipped. Rules come from
Plans/01_email_and_nurture/owner-voice-pack.md; keep the two in step.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), '_build'))

# --- hard tells (FAIL) ------------------------------------------------------
DASH_RE = re.compile('[—–]')
WEBR_RE = re.compile(r'\bwebr\b', re.I)
XPART_RE = re.compile(r'\bpart\s+\d+\b|\b(previous|earlier|next)\s+(lesson|part)s?\b|\blast lesson\b|\bmissed the earlier\b', re.I)
META_RE = re.compile(r"(?:^|[.!?]\s+)this (part|lesson) (is|does|covers|takes|has|will)\b|\brest of (this lesson|this part|today|the lesson)\b|\btoday is about\b", re.I)
META_SOFT_RE = re.compile(r"\bthis (part|lesson|step) (is|does|covers|comes|goes|takes|has|will)\b|\bin this (lesson|part)\b", re.I)
STEPREF_RE = re.compile(r'\bsteps?\s+\d+\b', re.I)

# --- heuristic tells (WARN) -------------------------------------------------
WRITERLY = re.compile(r"\b(honest(ly)?|quiet(ly)?|cheeky|cheekily|embarrassingly|flinch(ing|es|ed)?|sails? through|elegant(ly)?|beautiful(ly)?|delightful(ly)?|gently|neat(ly)?|whisper(s|ed)?|dutifully|obligingly|handsomely)\b", re.I)
PERSON = re.compile(r'\bthe word "?[\w-]+"? (sits|sat|tells|says|told|refuses|walked)\b|\b(number|p-value|test|model|statistic|formula|interval)\b[^.]{0,40}\b(walked away|has no idea|does not care|never asked|was never built|is not interested)\b', re.I)

# a small lexicon of common verbs; a "sentence" with none of these (or an -ed/-ing/-s
# form of them) and 2..8 words is called a fragment. Heuristic on purpose: it WARNS
# and lists, the voice pass judges each one.
_VERBS = """be is are was were am been being have has had having do does did doing done go goes went gone going
get gets got gotten getting give gives gave given take takes took taken make makes made see sees saw seen look
looks looked run runs ran press pressed try tries tried ask asks asked say says said tell tells told know knows
knew think thinks thought want wants wanted need needs needed use uses used put puts keep keeps kept let lets
come comes came call calls called find finds found mean means meant show shows showed shown lose loses lost win
wins won buy buys bought sell sells sold pay pays paid record records recorded split saw turn turns turned hold
holds held carry carries carried pour pours poured taste tastes tasted count counts counted sit sits sat stand
stands stood happen happens happened change changes changed move moves moved read reads reading write writes
wrote written start starts started stop stops stopped end ends ended begin begins began work works worked play
plays played live lives lived believe believes believed feel feels felt seem seems seemed become becomes became
leave leaves left bring brings brought build builds built fit fits fitted fits pick picks picked add adds added
drop drops dropped fall falls fell rise rises rose grow grows grew answer answers answered ask matter matters
mattered fill fills filled land lands landed manage manages managed miss misses missed pass passes passed fail
fails failed test tests tested check checks checked measure measures measured compare compares compared divide
divides divided multiply multiplied subtract compute computes computed report reports reported decide decides
decided expect expects expected imagine imagine picture suppose consider remember forget wonder learn learns
learned teach explain explains explained sound sounds sounded appear appears appeared stay stays stayed cost
costs open opens opened close closes closed set sets cut cuts hit hits shows watch watches watched wait waits
waited spend spends spent lie lies lay lays lean leans leaned wobble wobbles wobbled shrink shrinks shrank
climb climbs climbed drift drifts drifted echo echoes echoed depend depends depended cover covers covered
arrive arrives arrived point points pointed exist exists existed produce produces produced hide hides hid
travel travels travelled hurry hurried skip skips skipped clear clears cleared cancel cancels cancelled
sharpen sharpens sharpened move settle settles settled treat treats treated behave behaves behaved differ
differs differed vary varies varied represent represents describe describes described draw draws drew
plot plots plotted print prints printed return returns returned store stores stored load loads loaded
tie ties tied stick sticks stuck throw throws threw guess guesses guessed freeze freezes froze shop shops
derive derived rounded dropped choose chooses chose sit""".split()
VERBS = set(_VERBS)
_AUX = {'is','are','was','were','be','been','am','has','have','had','do','does','did','can','could','will','would','should','may','might','must','shall'}

def _has_verb(words):
    for w in words:
        lw = w.lower().strip("'")
        if lw in VERBS or lw in _AUX:
            return True
        # crude morphology: walked/walking/walks -> walk
        for suf in ('ing', 'ed', 'es', 's'):
            if lw.endswith(suf) and len(lw) > len(suf) + 2:
                stem = lw[:-len(suf)]
                if stem in VERBS or stem + 'e' in VERBS:
                    return True
        if lw.endswith("n't") or lw.endswith("'s") or lw.endswith("'re") or lw.endswith("'ll") or lw.endswith("'ve"):
            return True
    return False


def prose_lines(step_md):
    """Prose lines of one step: no code, directives, headings, tables, list items,
    callout markers, blank lines."""
    md = re.sub(r'```.*?```', ' ', step_md, flags=re.S)
    out = []
    for l in md.split('\n'):
        t = l.strip()
        if not t or t.startswith(('::', '#', '|', '- ', '* ', '[', '>', '1.', '2.', '3.', '4.', '5.', '<')):
            continue
        out.append(t)
    return out


def sentences(text):
    text = re.sub(r'\*\*|__|`[^`]*`', ' ', text)
    text = re.sub(r'\\\((.*?)\\\)', ' MATH ', text)   # inline mathjax
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z"\'(])', text)
    return [p.strip() for p in parts if p.strip()]


def is_fragment(sent):
    if not sent.endswith('.'):
        return False
    if 'MATH' in sent or re.search(r'\d+\.\d', sent):
        return False
    words = re.findall(r"[A-Za-z][A-Za-z']*", sent)
    if not (2 <= len(words) <= 8):
        return False
    return not _has_verb(words)


def lint_steps(steps, whole_text=None):
    """steps: list of (type, md) from md2lesson.split_steps. Returns [(sev, msg)]."""
    issues = []
    n = len(steps)
    frags, writerly, person, narr = [], [], [], []
    for i, (typ, md) in enumerate(steps, 1):
        last = (i == n)
        pl = prose_lines(md)
        text = ' '.join(pl)
        if WEBR_RE.search(text):
            issues.append(('FAIL', 'step %d: names WebR in prose (say "interactive R" / "runs in the browser")' % i))
        if not last and XPART_RE.search(text):
            m = XPART_RE.search(text)
            issues.append(('FAIL', 'step %d: refers to another part or lesson (%r); the only allowed mention is one sentence in the final step' % (i, m.group(0))))
        m = META_RE.search(text)
        if m:
            issues.append(('FAIL', 'step %d: narrates the lesson instead of teaching (%r)' % (i, m.group(0))))
        m = STEPREF_RE.search(text)
        if m:
            issues.append(('FAIL', 'step %d: refers to a step number (%r); teach in place, never point at steps' % (i, m.group(0))))
        for line in pl:
            for s in sentences(line):
                if is_fragment(s):
                    frags.append((i, s))
                if WRITERLY.search(s):
                    writerly.append((i, s))
                if PERSON.search(s):
                    person.append((i, s))
                if META_SOFT_RE.search(s) and not META_RE.search(s):
                    narr.append((i, s))
    if whole_text is not None and DASH_RE.search(whole_text):
        issues.append(('FAIL', 'em/en dash present (%d); use a comma, a full stop, or "to"' % len(DASH_RE.findall(whole_text))))
    def listing(items, k=6):
        return '; '.join('step %d: "%s"' % (i, s[:90]) for i, s in items[:k]) + (' ...' if len(items) > k else '')
    if frags:
        issues.append(('WARN', 'voice: %d fragment-like sentence(s) (no verb, 2-8 words), write full spoken sentences: %s' % (len(frags), listing(frags))))
    if writerly:
        issues.append(('WARN', 'voice: %d writerly flourish(es): %s' % (len(writerly), listing(writerly))))
    if person:
        issues.append(('WARN', 'voice: %d personification(s): %s' % (len(person), listing(person))))
    if narr:
        issues.append(('WARN', 'voice: %d sentence(s) about the lesson instead of the topic: %s' % (len(narr), listing(narr))))
    return issues


def flagged_sentences(steps):
    """Full list for the voice pass: [(category, step, sentence)]."""
    out = []
    n = len(steps)
    for i, (typ, md) in enumerate(steps, 1):
        for line in prose_lines(md):
            for s in sentences(line):
                if is_fragment(s): out.append(('fragment', i, s))
                if WRITERLY.search(s): out.append(('flourish', i, s))
                if PERSON.search(s): out.append(('personification', i, s))
                if META_RE.search(s) or META_SOFT_RE.search(s): out.append(('narration', i, s))
                if STEPREF_RE.search(s): out.append(('step-reference', i, s))
                if i != n and XPART_RE.search(s): out.append(('cross-part', i, s))
    return out


def main():
    from md2lesson import split_steps
    from md2html import parse_frontmatter
    if len(sys.argv) < 2:
        print('usage: voice_lint.py lessons/<slug>.md'); return 2
    p = sys.argv[1]
    src = io.open(p, encoding='utf-8').read()
    fm, body = parse_frontmatter(src)
    steps = split_steps(body)
    for cat, i, s in flagged_sentences(steps):
        print('%-16s step %2d: %s' % (cat, i, s))
    return 0


if __name__ == '__main__':
    sys.exit(main())

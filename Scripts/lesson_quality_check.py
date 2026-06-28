#!/usr/bin/env python3
"""Deterministic quality gate for interactive lessons - the no-blank-slide net.

Enforces the checkable parts of _build/lesson-pedagogy.md, in particular R6
(show, don't tell): a teaching step that is BARE PROSE (only paragraphs - no
code, list, table, formula, callout, widget or image) and that talks about a
visualizable thing (the lexicon below, mirroring _build/lesson-visual-catalog.md)
must carry a visual, unless it is explicitly marked `::prose-only <reason>`.

Targeting bare-prose steps (not every step that merely mentions a lexicon word)
keeps the gate quiet in a course that is ABOUT trees while still catching the
exact failure mode that started this: a teaching step rendered as a wall of text.

This is the DETERMINISTIC layer. The LLM judge + human review (see the plan)
catch what a keyword net cannot. Use as a HARD gate at publish time; ADVISORY
in the site build (one bad lesson must not block the whole deploy).

Usage:
  python Scripts/lesson_quality_check.py lessons/<slug>.md   # one lesson
  python Scripts/lesson_quality_check.py --all               # every lesson
Exit 0 = pass, 1 = at least one FAIL, 2 = usage error.
"""
import sys, os, re, glob

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(ROOT, '_build'))
from md2lesson import split_steps          # reuse the exact step splitter
from md2html import parse_frontmatter

WIDGETS_DIR = os.path.join(ROOT, 'www', 'lesson-widgets')
REQUIRED_FM = ['title', 'description', 'post_type', 'curriculum_id', 'course_id',
               'course_title', 'course_lesson', 'course_total', 'course_landing']

# R6 visualizable lexicon (mirrors _build/lesson-visual-catalog.md).
LEXICON = ['tree', 'split', 'node', 'leaf', 'branch', 'boundary', 'region', 'distribution',
           'curve', 'histogram', 'sample', 'resample', 'bootstrap', 'correlation', 'matrix',
           'network', 'graph', 'architecture', 'pipeline', 'importance', 'ranking', 'gradient',
           'surface', 'projection', 'cluster', 'timeline', 'scatter', 'heatmap', 'flowchart',
           'hypothesis', 'significance', 'agent', 'token',
           # data-analyst track (wrangling + viz): strongly-visual terms only
           'table', 'join', 'pivot', 'reshape', 'tidy', 'chart', 'plot', 'ggplot',
           'facet', 'boxplot', 'dashboard']


def strip_code(md):
    return re.sub(r'```.*?```', ' ', md, flags=re.S)


def heading_of(md):
    m = re.search(r'^\s*#{1,4}\s+(.+)$', md, flags=re.M)
    return (m.group(1).strip() if m else '')


def has_visual(md):
    """A real visual: a widget, an inline <svg>/<img>, or an image."""
    if re.search(r'^\s*::widget\b', md, flags=re.M):
        return True
    if re.search(r'<(img|svg)\b', md, flags=re.I):
        return True
    if re.search(r'!\[[^\]]*\]\([^)]+\)', md):
        return True
    return False


def has_enrichment(md):
    """Anything beyond plain paragraphs/headings: the step is not 'bare prose'."""
    if has_visual(md):
        return True
    if '```' in md:                                   # code block
        return True
    if '\\(' in md or '\\[' in md:                    # MathJax
        return True
    if re.search(r'^\s*\[[A-Z][A-Z /]+\]\s*$', md, flags=re.M):   # callout marker e.g. [KEY INSIGHT]
        return True
    if re.search(r'^\s*([-*]|\d+\.)\s+\S', md, flags=re.M):       # markdown list
        return True
    if re.search(r'^\s*\|.*\|\s*$', md, flags=re.M):             # table row
        return True
    if '<details' in md:
        return True
    return False


def prose_only_reason(md):
    m = re.search(r'^\s*::prose-only\b(.*)$', md, flags=re.M)
    return None if not m else (m.group(1) or '').strip()


def lexicon_hits(md):
    low = strip_code(md).lower()
    return sorted({w for w in LEXICON if re.search(r'\b' + re.escape(w), low)})


def check_lesson(path):
    issues = []   # (severity, message), severity in {FAIL, WARN}

    def fail(m): issues.append(('FAIL', m))
    def warn(m): issues.append(('WARN', m))

    with open(path, encoding='utf-8') as f:
        raw = f.read()
    fm, body = parse_frontmatter(raw)
    slug = os.path.splitext(os.path.basename(path))[0]

    for k in REQUIRED_FM:
        if not str(fm.get(k, '')).strip():
            fail('missing frontmatter: ' + k)
    if str(fm.get('post_type', '')).strip().upper() != 'LESSON':
        fail('post_type must be LESSON')

    steps = split_steps(body)
    if not steps:
        fail('no steps found')
        return issues, slug
    types = [t for t, _ in steps]

    # R13 one-sitting length: target 7-12 steps, ceiling 12. Advisory only (one bad
    # lesson must not block the deploy), but anything over 12 should almost always split.
    if len(steps) > 12:
        warn('%d steps: over the one-sitting ceiling of 12 (target 7-12). Split at a natural '
             'seam into a multi-lesson course unless this is a genuinely indivisible arc (R13).' % len(steps))

    # R1 - cover carries a real visual.
    cov_type, cov_md = steps[0]
    if cov_type != 'cover':
        warn('first step is "%s", expected cover' % cov_type)
    if not has_visual(cov_md):
        fail('cover (step 1) has no visual (R1): needs a ::widget, <img>/<svg>, or image')

    # Title match: the cover H2 must equal the catalog title (the roadmap-visible name) - the
    # LESSON_CATALOG_TITLE override if present, else the colon-tail of `title`. Keeps
    # roadmap row == cover heading == player chrome (the player derives its title from the H2).
    try:
        from build_lessons_tracker import LESSON_CATALOG_TITLE as _CAT, short_title as _short
        cat_title = _CAT.get(slug) or _short(fm.get('title'), fm.get('course_title'))
    except Exception:
        _ft = str(fm.get('title') or '').strip()
        cat_title = _ft.split(':', 1)[1].strip() if ':' in _ft else _ft
    cov_head = heading_of(cov_md)
    if cat_title and cov_head and cov_head != cat_title:
        fail('cover H2 %r != catalog title %r - the lesson page title must match the roadmap row '
             '(set the cover heading to the catalog name; put any hook in the body).' % (cov_head, cat_title))

    # catalog_blurb: required, outcome-focused, no function/method names (it is the roadmap subtitle).
    blurb = str(fm.get('catalog_blurb', '') or '').strip()
    if not blurb:
        fail('missing catalog_blurb (the one-line, outcome-focused roadmap subtitle).')
    else:
        mcall = re.search(r'[A-Za-z_][\w.]*\(', blurb)
        if mcall:
            fail('catalog_blurb names a function (%r) - describe the OUTCOME, not the API.' % mcall.group(0))
        elif re.search(r'\b[a-z]+_[a-z][a-z_]*\b', blurb):
            warn('catalog_blurb looks like it names a function (snake_case) - keep it outcome-focused.')
        if len(blurb.split()) > 14:
            warn('catalog_blurb is %d words (aim for <= ~12, outcome-focused).' % len(blurb.split()))

    # R6 - no bare-prose teaching step about a visualizable thing.
    refs_links = None
    for n, (t, md) in enumerate(steps, 1):
        head = heading_of(md)
        if 'reference' in head.lower():
            refs_links = re.findall(r'\[[^\]]+\]\((https?://[^)]+)\)', md)
            continue
        if t not in ('concept', 'widget'):
            continue
        if has_enrichment(md):
            continue
        po = prose_only_reason(md)
        if po is not None:
            if not po:
                fail('step %d "%s": ::prose-only needs a reason' % (n, head))
            continue
        hits = lexicon_hits(md)
        if hits:
            fail('step %d "%s": bare prose about a visualizable idea (%s) - add a visual '
                 'or mark ::prose-only <reason> (R6)' % (n, head, ', '.join(hits[:4])))

    # R5 - practice cadence.
    if 'quiz' not in types:
        fail('no quiz step (R5: >=1 quiz)')
    if 'tryit' not in types:
        fail('no try-it step (R5: >=1 try-it)')

    # R9 - references.
    if refs_links is None:
        fail('no References step (R9: 3-5 references)')
    elif len(refs_links) < 3:
        fail('only %d references (R9: >=3)' % len(refs_links))
    elif len(refs_links) > 5:
        warn('%d references (R9 suggests 3-5)' % len(refs_links))

    # Widget types must exist in the library.
    for n, (t, md) in enumerate(steps, 1):
        for m in re.finditer(r'^\s*::widget\s+([A-Za-z0-9_-]+)', md, flags=re.M):
            wt = m.group(1)
            if not os.path.exists(os.path.join(WIDGETS_DIR, wt + '.js')):
                fail('step %d: ::widget "%s" has no www/lesson-widgets/%s.js' % (n, wt, wt))

    # ::widget config lives in a single-quoted HTML attribute, so an apostrophe /
    # single quote breaks it (md2lesson rejects it at publish). Catch it earlier here.
    for m in re.finditer(r'^\s*::widget\b.*$', body, flags=re.M):
        if "'" in m.group(0):
            fail("a ::widget config contains a single quote (apostrophe): %r - reword it "
                 "(the config sits in a single-quoted HTML attribute)." % m.group(0).strip()[:70])

    # No hand-authored visuals: every visual must be a ::widget from the catalog
    # (tested, interactive, consistent) or a real <img>. Inline <svg> in the source
    # is bespoke widget-faking - the exact thing the library exists to prevent.
    if re.search(r'<svg\b', strip_code(body), flags=re.I):
        fail('hand-authored inline <svg> in source: every visual must be a ::widget from the catalog '
             '(or a real <img>). If no widget fits, flag NEEDS-WIDGET - do not hand-draw an SVG '
             '(it is untested, static, and inconsistent).')
    # The widget library must actually be used: a real lesson teaches with interactive
    # widgets, not prose + formulas alone (which slip past the bare-prose R6 check).
    n_widgets = len(re.findall(r'^\s*::widget\b', body, flags=re.M))
    n_teach = sum(1 for t, _ in steps if t in ('concept', 'widget'))
    if n_widgets == 0 and n_teach >= 3:
        fail('no ::widget used across %d teaching steps: select widgets from '
             '_build/lesson-visual-catalog.md (show, do not just tell - R6).' % n_teach)

    # MathJax flag must be set when formulas are present.
    if ('\\(' in body or '\\[' in body) and str(fm.get('mathjax', '')).strip().lower() not in ('true', '1', 'yes'):
        fail('body has MathJax (\\( or \\[) but frontmatter mathjax is not true')

    # Runnable code: each lesson runs in its OWN WebR session, so every code block
    # must be self-contained. Catch the two ways that breaks (the 'train not found'
    # class): (a) a model/transform uses data never created in THIS lesson; (b) a
    # read of an external file that does not exist in WebR's virtual filesystem.
    rcode = '\n'.join(re.findall(r'```r(?!-static)\b(.*?)```', body, flags=re.S))  # runnable only; r-static is illustrative
    if rcode.strip():
        assigned = set(re.findall(r'(?m)^\s*([A-Za-z.][\w.]+)\s*(?:<-|=)(?![=])', rcode))
        BUILTIN = {'mtcars', 'iris', 'airquality', 'sleep', 'ToothGrowth', 'mpg', 'diamonds',
                   'economics', 'PlantGrowth', 'ChickWeight', 'USArrests', 'faithful', 'quakes',
                   'trees', 'women', 'cars', 'pressure', 'InsectSprays', 'warpbreaks', 'CO2',
                   'Orange', 'npk', 'esoph', 'infert', 'swiss', 'attitude', 'rivers',
                   'AirPassengers', 'co2', 'Nile', 'volcano'}
        uses = re.findall(r'\bdata\s*=\s*([A-Za-z.][\w.]+)', rcode)              # model/transform data arg
        uses += re.findall(r'(?m)(?:^|[\s(])([A-Za-z.][\w.]+)\s*(?:%>%|\|>)', rcode)  # a bare data frame piped
        for nm in uses:
            if nm not in assigned and nm not in BUILTIN:
                fail("runnable code: uses data object `%s` which is never created in this lesson "
                     "(each lesson runs in its own WebR session - build all data inline)." % nm)
                break
        written = set(re.findall(r'(?:writeLines|write_csv|write\.csv|cat|saveRDS)\s*\([^;\n]*?["\']([\w./-]+\.\w+)["\']', rcode))
        for m in re.finditer(r'(?:read_csv|read\.csv|read_tsv|read_delim|read_table|fread|read_excel|readRDS|readLines|load)\s*\(\s*["\']([\w./-]+)["\']', rcode):
            path = m.group(1)
            if path not in written:
                fail("runnable code: reads external file '%s' not written earlier in this lesson "
                     "(WebR has no real filesystem - write the example file in-session first, or build data inline)." % path)
                break
        # Package compatibility is EVIDENCE-BASED, read from Scripts/webr-package-compat.json
        # whose every entry came from actually running the package in WebR - never a guess
        # (data.table runs single-threaded, duckdb runs, plotly builds, only ranger errors).
        # This is the fast pre-filter; verify_lesson_webr.mjs runs the real code as ground truth.
        import json as _json
        compat = {}
        try:
            with open(os.path.join(ROOT, 'Scripts', 'webr-package-compat.json'), encoding='utf-8') as _f:
                compat = _json.load(_f).get('packages', {})
        except Exception:
            pass
        for m in re.finditer(r'(?:library|require)\s*\(\s*["\']?([A-Za-z0-9.]+)', rcode):
            ent = compat.get(m.group(1)) or {}
            ev = (ent.get('evidence') or '')[:90]
            if ent.get('status') == 'incompatible':
                fail("runnable code: library(%s) ERRORS in WebR (%s). Switch package or use a "
                     "```r-static illustrative block." % (m.group(1), ev)); break
            if ent.get('status') == 'illustrative':
                fail("runnable code: library(%s) cannot run its core use in WebR (%s). Use a "
                     "```r-static illustrative block." % (m.group(1), ev)); break
            if ent.get('status') == 'runnable_no_visual':
                warn("library(%s) runs but its rich output does not render in WebR (%s) - show the "
                     "text form, or pair a static image." % (m.group(1), ev))

    # Code that is needlessly STATIC: a ```r-static block whose every package is
    # `runnable` in WebR (and which reads no external file) should be a LIVE ```r
    # block so readers can run it. This catches ggplot2/dplyr/etc. snippets parked
    # as static. Advisory (WARN): some r-static is legitimately display-only.
    static_blocks = re.findall(r'```r-static\b(.*?)```', body, flags=re.S)
    if static_blocks:
        import json as _json2
        compat2 = {}
        try:
            with open(os.path.join(ROOT, 'Scripts', 'webr-package-compat.json'), encoding='utf-8') as _f:
                compat2 = _json2.load(_f).get('packages', {})
        except Exception:
            pass
        BUILTIN_DATA = {'mtcars', 'iris', 'airquality', 'sleep', 'ToothGrowth', 'mpg', 'diamonds',
                        'economics', 'PlantGrowth', 'ChickWeight', 'USArrests', 'faithful', 'quakes',
                        'trees', 'women', 'cars', 'pressure', 'InsectSprays', 'warpbreaks', 'CO2',
                        'Orange', 'npk', 'esoph', 'infert', 'swiss', 'attitude', 'rivers',
                        'AirPassengers', 'co2', 'Nile', 'volcano'}
        # External input (any source, not just CSV) or document/file generation -> the block
        # is legitimately static (cannot run in a browser session); do NOT flag those.
        EXT_IO = re.compile(r'(?:read_csv|read\.csv|read_tsv|read_delim|read_table|fread|read_excel|'
                            r'read_parquet|read_feather|open_dataset|read_json|fromJSON|readRDS|readLines|'
                            r'\bload\s*\(|dbConnect|dbGetQuery|\btbl\s*\(|url\s*\(|download\.file)')
        DOC_GEN = re.compile(r'(?:create_report|\brender\s*\(|rmarkdown::|\bknit|saveWidget|save_html|ggsave|webshot)')
        for blk in static_blocks:
            pkgs = re.findall(r'(?:library|require)\s*\(\s*["\']?([A-Za-z0-9.]+)', blk)
            if not pkgs:
                continue
            statuses = [(compat2.get(p) or {}).get('status') for p in pkgs]
            if not (statuses and all(s == 'runnable' for s in statuses)):
                continue
            if EXT_IO.search(blk) or DOC_GEN.search(blk):
                continue
            # Uses a data object it never builds in THIS block and that is not a builtin
            # (depends on earlier page state - a forward-preview etc.) -> not safely convertible.
            assigned = set(re.findall(r'(?m)^\s*([A-Za-z.][\w.]+)\s*(?:<-|=)(?![=])', blk))
            used = (set(re.findall(r'(?m)(?:^|[\s(])([A-Za-z.][\w.]+)\s*(?:%>%|\|>)', blk))
                    | set(re.findall(r'\bdata\s*=\s*([A-Za-z.][\w.]+)', blk))
                    | set(re.findall(r'\bggplot\s*\(\s*([A-Za-z.][\w.]+)', blk)))
            if [o for o in used if o not in assigned and o not in BUILTIN_DATA]:
                continue
            warn("r-static block looks runnable (only WebR-runnable packages, self-contained, no "
                 "file/DB/doc I/O: %s) - consider a live ```r block so readers can run it."
                 % ', '.join(sorted(set(pkgs))))

    return issues, slug


def main():
    args = [a for a in sys.argv[1:] if a]
    paths = []
    if '--all' in args:
        paths = sorted(glob.glob(os.path.join(ROOT, 'lessons', '*.md')))
    else:
        for a in args:
            if a.startswith('--'):
                continue
            paths.append(a if os.path.isabs(a) else os.path.join(ROOT, a))
    if not paths:
        print('usage: lesson_quality_check.py <lessons/slug.md> | --all')
        return 2

    any_fail = False
    for p in paths:
        if not os.path.exists(p):
            print('FAIL  %s: not found' % p)
            any_fail = True
            continue
        issues, slug = check_lesson(p)
        fails = [i for i in issues if i[0] == 'FAIL']
        warns = [i for i in issues if i[0] == 'WARN']
        status = 'FAIL' if fails else 'PASS'
        print('%s  %s  (%d fail, %d warn)' % (status, slug, len(fails), len(warns)))
        for sev, msg in issues:
            print('      [%s] %s' % (sev, msg))
        if fails:
            any_fail = True
    return 1 if any_fail else 0


if __name__ == '__main__':
    sys.exit(main())

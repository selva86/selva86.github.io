#!/usr/bin/env python3
"""Convert an interactive lesson markdown file to a _lessons/ HTML fragment.

Usage: python _build/md2lesson.py lessons/<Slug>.md [--force]

Lessons are a parallel content type to posts. This converter is deliberately
separate from md2html.py so a lesson-parser bug can never break the ~1,300-page
post build. It REUSES md2html's leaf renderer (convert) for ordinary markdown
inside a step, and adds the step-splitter + `::` directive parser that emit the
DOM defined in _build/lesson-contract.md.

Pipeline: lessons/<slug>.md -> _lessons/<slug>.html -> (build.py) -> /<slug>.html
"""
import sys, os, re, json, html

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2html import convert as _md_convert, parse_frontmatter, escape_html, md_inline
from sanitize_dashes import sanitize_html_fragment as _sanitize_dashes

_GEN_MARKER = '<!-- md2html:generated -->'
_DIFF_DEFAULT = 'beginner'


# ---------------------------------------------------------------------------
# Prose rendering: reuse md2html.convert() and unwrap its fragment shell so we
# get identical handling of headings / paragraphs / callouts / ```r blocks /
# lists / tables / <details> with zero duplication.
# ---------------------------------------------------------------------------
def render_prose(chunk, slug='lesson'):
    chunk = (chunk or '').strip()
    if not chunk:
        return ''
    full = _md_convert(chunk, slug=slug)
    idx = full.find(_GEN_MARKER)
    body = full[idx + len(_GEN_MARKER):] if idx != -1 else full
    body = body.replace('{% endraw %}', '').strip()
    return body


# ---------------------------------------------------------------------------
# Step splitting: `=== step === <type>` fences, ignoring fences inside ``` code.
# ---------------------------------------------------------------------------
_STEP_RE = re.compile(r'^===\s*step\s*===\s*([A-Za-z]+)\s*$')

def split_steps(body):
    steps = []
    cur_type, cur = None, []
    in_fence = False
    for ln in body.split('\n'):
        s = ln.strip()
        m = _STEP_RE.match(s) if not in_fence else None
        if m:
            if cur_type is not None:
                steps.append((cur_type, '\n'.join(cur).strip()))
            cur_type, cur = m.group(1).lower(), []
            continue
        if s.startswith('```'):
            in_fence = not in_fence
        if cur_type is not None:
            cur.append(ln)
    if cur_type is not None:
        steps.append((cur_type, '\n'.join(cur).strip()))
    return steps


# ---------------------------------------------------------------------------
# Small extractors
# ---------------------------------------------------------------------------
def _pop_eyebrow(lines):
    """Remove the first ::eyebrow line; return (eyebrow_text_or_None, lines)."""
    out, eyebrow = [], None
    for ln in lines:
        if eyebrow is None and ln.strip().startswith('::eyebrow'):
            eyebrow = ln.strip()[len('::eyebrow'):].strip()
            continue
        out.append(ln)
    return eyebrow, out

def _extract_code_block(lines, start):
    """From lines[start] (a ``` fence), return (code, lang, end_index_after_close)."""
    fence = lines[start].strip()
    lang = fence[3:].strip().split()[0] if len(fence) > 3 else ''
    code, j = [], start + 1
    while j < len(lines) and not lines[j].strip().startswith('```'):
        code.append(lines[j]); j += 1
    return '\n'.join(code), lang, (j + 1 if j < len(lines) else j)

def _first_code_index(lines):
    for k, ln in enumerate(lines):
        if ln.strip().startswith('```'):
            return k
    return -1

def _parse_directive_json(line, name):
    """Parse the JSON object after `::name `. Raises on malformed JSON."""
    raw = line.strip()[len('::' + name):].strip()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"::{name} has invalid JSON: {raw!r} ({e})")


# ---------------------------------------------------------------------------
# Interactive block builders
# ---------------------------------------------------------------------------
def _difficulty(cfg):
    d = str(cfg.get('difficulty', _DIFF_DEFAULT)).strip().lower()
    return d if d in ('beginner', 'intermediate', 'advanced') else _DIFF_DEFAULT

def _exercise_open(slug, n, diff):
    return (f'<section class="exercise" data-exercise-id="{slug}-step{n}" '
            f'data-grade-mode="self-check" data-difficulty="{diff}">')

def build_widget(line):
    rest = line.strip()[len('::widget'):].strip()
    parts = rest.split(None, 1)
    if not parts:
        raise ValueError("::widget needs a type")
    wtype = parts[0]
    cfg_raw = parts[1].strip() if len(parts) > 1 else '{}'
    try:
        cfg = json.loads(cfg_raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"::widget {wtype} has invalid JSON config: {cfg_raw!r} ({e})")
    cfg_json = json.dumps(cfg, separators=(',', ':'))
    if "'" in cfg_json:
        raise ValueError(f"::widget {wtype} config contains a single quote; not allowed (attribute is single-quoted)")
    return (
        f'<div class="lesson-widget" data-widget-type="{html.escape(wtype)}" '
        f"data-widget-config='{cfg_json}'>"
        f'<noscript><p class="lesson-widget-fallback">Interactive widget. '
        f'Enable JavaScript to explore it.</p></noscript>'
        f'</div>'
    )

def build_quiz(slug, n, quiz_line, option_lines):
    cfg = _parse_directive_json(quiz_line, 'quiz')
    correct = int(cfg.get('correct', 1))
    diff = _difficulty(cfg)
    opts, ok_fb, no_fb = [], '', ''
    for ln in option_lines:
        mo = re.match(r'^-\s+(.*)$', ln.strip())
        if not mo:
            continue
        text = mo.group(1)
        m2 = re.search(r'\s::(ok|no)\b\s*(.*)$', text)
        if m2:
            kind, fb = m2.group(1), m2.group(2).strip()
            text = text[:m2.start()].strip()
            if kind == 'ok':
                ok_fb = fb
            else:
                no_fb = fb
        opts.append(text)
    btns = []
    for i, text in enumerate(opts, start=1):
        letter = chr(64 + i)
        btns.append(
            f'<button type="button" class="lesson-opt" data-i="{i}">'
            f'<span class="lesson-opt-mk">{letter}</span>'
            f'<span class="lesson-opt-tx">{md_inline(text)}</span></button>'
        )
    fb = (f'<div class="lesson-qfb lesson-qfb-ok">{md_inline(ok_fb)}</div>'
          f'<div class="lesson-qfb lesson-qfb-no">{md_inline(no_fb)}</div>')
    inner = (f'<div class="lesson-quiz" data-correct="{correct}">'
             + '\n'.join(btns) + '\n' + fb + '</div>')
    return _exercise_open(slug, n, diff) + '\n' + inner + '\n</section>', bool(cfg.get('gate'))

def build_tryit(slug, n, starter_code, check_line, solution_code):
    cfg = _parse_directive_json(check_line, 'check')
    diff = _difficulty(cfg)
    regex = html.escape(str(cfg.get('regex', '')), quote=True)
    ok = md_inline(str(cfg.get('ok', 'Correct.')))
    no = md_inline(str(cfg.get('no', 'Not yet, try again.')))
    sol = ''
    if solution_code is not None:
        sol = ('<details class="lesson-tryit-sol"><summary>Show answer</summary>'
               f'<pre><code class="language-r">{escape_html(solution_code)}</code></pre></details>')
    inner = (
        f'<div class="lesson-tryit" data-check-regex="{regex}">'
        f'<textarea class="lesson-tryit-input" spellcheck="false">{escape_html(starter_code)}</textarea>'
        f'<div class="lesson-tryit-actions">'
        f'<button type="button" class="lesson-tryit-check">Check</button>'
        f'<span class="lesson-tryit-fb lesson-tryit-ok">{ok}</span>'
        f'<span class="lesson-tryit-fb lesson-tryit-no">{no}</span>'
        f'</div>{sol}</div>'
    )
    return _exercise_open(slug, n, diff) + '\n' + inner + '\n</section>', bool(cfg.get('gate'))


# ---------------------------------------------------------------------------
# Per-step assembly
# ---------------------------------------------------------------------------
def parse_step(stype, smd, slug, n):
    eyebrow, lines = _pop_eyebrow(smd.split('\n'))
    interactive, gated = '', False

    if stype == 'quiz':
        qi = next((k for k, ln in enumerate(lines) if ln.strip().startswith('::quiz')), -1)
        if qi == -1:
            prose_md = '\n'.join(lines)
        else:
            prose_md = '\n'.join(lines[:qi])
            opt_lines = [ln for ln in lines[qi + 1:] if ln.strip().startswith('- ')]
            interactive, gated = build_quiz(slug, n, lines[qi], opt_lines)

    elif stype == 'tryit':
        ci = _first_code_index(lines)
        starter, after = '', lines
        if ci != -1:
            starter, _lang, end = _extract_code_block(lines, ci)
            prose_md = '\n'.join(lines[:ci])
            after = lines[end:]
        else:
            prose_md = '\n'.join(lines)
        check_line = next((ln for ln in after if ln.strip().startswith('::check')), '::check {}')
        sol_code = None
        si = next((k for k, ln in enumerate(after) if ln.strip().startswith('::solution')), -1)
        if si != -1:
            sci = _first_code_index(after[si + 1:])
            if sci != -1:
                sol_code, _l, _e = _extract_code_block(after[si + 1:], sci)
        interactive, gated = build_tryit(slug, n, starter, check_line, sol_code)

    else:  # cover | concept | widget | complete: prose + an optional ::widget
        wi = next((k for k, ln in enumerate(lines) if ln.strip().startswith('::widget')), -1)
        if wi == -1:
            prose_md = '\n'.join(lines)
        else:
            prose_md = '\n'.join(lines[:wi] + lines[wi + 1:])
            interactive = build_widget(lines[wi])

    prose_html = render_prose(prose_md, slug)
    eyebrow_html = (f'<div class="lesson-step-eyebrow">{md_inline(eyebrow)}</div>'
                    if eyebrow else '')
    gate_attr = ' data-gate="1"' if gated else ''
    body = '\n'.join(p for p in (eyebrow_html, prose_html, interactive) if p)
    return (f'<section class="lesson-step" data-step="{n}" data-step-type="{stype}"{gate_attr}>\n'
            f'{body}\n</section>')


# ---------------------------------------------------------------------------
# Whole-file conversion
# ---------------------------------------------------------------------------
_FM_KEYS = ['title', 'description', 'keywords', 'mathjax', 'webr', 'curriculum_id',
            'post_type', 'course_id', 'course_title', 'course_lesson', 'course_total',
            'course_landing', 'course_next', 'course_prev', 'lesson_access']

def convert_lesson(md_text, slug):
    fm, body = parse_frontmatter(md_text)
    steps = split_steps(body)
    if not steps:
        raise ValueError("No steps found. A lesson body needs at least one '=== step === <type>' fence.")
    blocks = [parse_step(st, sm, slug, i) for i, (st, sm) in enumerate(steps, start=1)]

    fm_out = ['---']
    for key in _FM_KEYS:
        if key in fm:
            val = fm[key]
            if isinstance(val, bool):
                fm_out.append(f'{key}: {"true" if val else "false"}')
            else:
                fm_out.append(f'{key}: "{val}"')
    fm_out.append('---')
    fm_out.append('{% raw %}')
    fm_out.append('<!-- md2lesson:generated -->')

    rendered = '\n'.join(fm_out) + '\n\n' + '\n\n'.join(blocks) + '\n\n{% endraw %}'
    return _sanitize_dashes(rendered)


def main():
    if len(sys.argv) < 2:
        print("Usage: python _build/md2lesson.py lessons/<Slug>.md [--force]")
        return 1
    src = sys.argv[1]
    force = '--force' in sys.argv
    with open(src, 'r', encoding='utf-8') as f:
        md = f.read()

    basename = os.path.splitext(os.path.basename(src))[0]
    repo_root = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(src)), '..'))

    # Cross-dir slug collision guard: lessons share the root + grading-hub
    # namespace with posts, so a duplicate stem would clobber a page and merge
    # grading hubs. Abort loudly.
    out_dir = os.path.join(repo_root, '_lessons')
    outpath = os.path.join(out_dir, basename + '.html')
    clashes = []
    if os.path.exists(os.path.join(repo_root, 'posts', basename + '.md')):
        clashes.append(f'posts/{basename}.md')
    if os.path.exists(os.path.join(repo_root, '_posts', basename + '.html')):
        clashes.append(f'_posts/{basename}.html')
    root_html = os.path.join(repo_root, basename + '.html')
    if os.path.exists(root_html) and not os.path.exists(outpath):
        clashes.append(f'{basename}.html (existing root page)')
    if clashes:
        print(f"ERROR: lesson slug '{basename}' collides with: {', '.join(clashes)}")
        print("  Rename the lesson (use a course prefix, e.g. RF-Course-Lesson-1).")
        return 1

    # Direct-edit guard.
    if os.path.exists(outpath) and not force:
        with open(outpath, 'r', encoding='utf-8') as fp:
            head = fp.read(2000)
        if '<!-- md2lesson:generated -->' not in head:
            print(f"ERROR: _lessons/{basename}.html lacks the md2lesson marker - direct edits would be lost.")
            print("  Pass --force to overwrite.")
            return 1

    result = convert_lesson(md, basename)
    os.makedirs(out_dir, exist_ok=True)
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"Converted: {os.path.relpath(outpath, repo_root)}  ({len(split_steps(parse_frontmatter(md)[1]))} steps)")
    return 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Convert a markdown post to _posts HTML fragment for r-statistics.co.
Usage: python _build/md2html.py posts/Slug-Name.md
"""
import sys, re, html

def parse_frontmatter(text):
    """Extract YAML frontmatter and body."""
    if not text.startswith('---'):
        return {}, text
    end = text.index('---', 3)
    fm_text = text[3:end].strip()
    body = text[end+3:].strip()
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            val = val.strip().strip('"').strip("'")
            if val.lower() == 'true': val = True
            elif val.lower() == 'false': val = False
            fm[key.strip()] = val
    return fm, body

def escape_html(text):
    """Escape HTML entities in code blocks."""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

_TITLE_RE = re.compile(r'title\s*=\s*"([^"]+)"')
def extract_block_title(info_str):
    """Pull a title="..." out of a fenced-code info string. Returns attribute fragment or ''."""
    if not info_str:
        return ''
    m = _TITLE_RE.search(info_str)
    if not m:
        return ''
    return f' data-block-title="{html.escape(m.group(1))}"'

def md_inline(text):
    """Convert inline markdown: bold, italic, code, links."""
    # Code first (to avoid processing inside code)
    parts = []
    i = 0
    in_code = False
    tokens = re.split(r'(`[^`]+`)', text)
    result = []
    for token in tokens:
        if token.startswith('`') and token.endswith('`') and len(token) > 1:
            result.append('<code>' + html.escape(token[1:-1]) + '</code>')
        else:
            # Bold
            token = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', token)
            # Italic
            token = re.sub(r'\*(.+?)\*', r'<em>\1</em>', token)
            # Images (must come before links — ![alt](src) vs [text](url))
            token = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1" class="img-responsive" loading="lazy" />', token)
            # Links
            token = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', token)
            result.append(token)
    return ''.join(result)

def convert_table(lines):
    """Convert markdown table lines to HTML table."""
    out = ['<table class="table table-striped">', '<thead>', '<tr>']
    headers = [c.strip() for c in lines[0].strip('|').split('|')]
    for h in headers:
        out.append(f'<th>{md_inline(h)}</th>')
    out.extend(['</tr>', '</thead>', '<tbody>'])
    for line in lines[2:]:  # Skip separator line
        out.append('<tr>')
        cells = [c.strip() for c in line.strip('|').split('|')]
        for c in cells:
            out.append(f'<td>{md_inline(c)}</td>')
        out.append('</tr>')
    out.extend(['</tbody>', '</table>'])
    return '\n'.join(out)

def convert(md_text):
    fm, body = parse_frontmatter(md_text)
    lines = body.split('\n')

    # Auto-fix callout patterns so the parser's [TIP]-on-own-line rule matches.
    # Handles three legacy shapes: inline "[TIP] body", blockquote "> [TIP]"
    # followed by "> body" lines, and inline blockquote "> [TIP] body".
    fixed_lines = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        stripped = ln.lstrip()
        # Inline: [TIP] body...
        m = re.match(r'^(\[(?:TIP|NOTE|WARNING|KEY INSIGHT)\])\s+(\S.*)$', ln)
        if m:
            print(f"  WARN: auto-fixed inline callout at line {i+1}: {m.group(1)} ...")
            fixed_lines.append(m.group(1))
            fixed_lines.append(m.group(2))
            i += 1
            continue
        # Blockquote: > [TIP] (label alone) followed by > body lines.
        # Also handles the bolded form `> **[TIP]** body` produced by the
        # LLM /publish-post path — strip the asterisks before matching.
        bq = re.match(r'^>\s*(?:\*\*)?\s*(\[(?:TIP|NOTE|WARNING|KEY INSIGHT)\])\s*(?:\*\*)?\s*(.*)$', ln)
        if bq:
            print(f"  WARN: auto-fixed blockquote callout at line {i+1}: {bq.group(1)} ...")
            fixed_lines.append(bq.group(1))
            rest = bq.group(2).strip()
            body_parts = [rest] if rest else []
            i += 1
            while i < len(lines) and lines[i].lstrip().startswith('>'):
                cont = re.sub(r'^>\s?', '', lines[i].lstrip())
                body_parts.append(cont)
                i += 1
            if body_parts:
                fixed_lines.append(' '.join(p.strip() for p in body_parts if p.strip()))
            continue
        fixed_lines.append(ln)
        i += 1
    lines = fixed_lines

    out = []
    i = 0
    webr_enabled = str(fm.get('webr', 'true')).lower() == 'true'

    while i < len(lines):
        line = lines[i]

        # Blank line
        if line.strip() == '':
            i += 1
            continue

        # Try It practice block: wraps "**Try it:** ..." prompt + next r-code-block
        # + next <details> block in <section class="tryit-block">.
        # Details handling below duplicates the main <details> consumer (lines ~108-148) —
        # keep the two in sync if that handler changes.
        if line.strip().startswith('**Try it:**'):
            # 1. Consume prompt paragraph until blank line
            prompt_lines = [line.strip()]
            i += 1
            while i < len(lines) and lines[i].strip() != '':
                prompt_lines.append(lines[i].strip())
                i += 1
            prompt_html = f'<p>{md_inline(" ".join(prompt_lines))}</p>'

            # 2. Skip blanks, consume next r code block (graceful if missing)
            while i < len(lines) and lines[i].strip() == '':
                i += 1
            code_html = ''
            if i < len(lines) and lines[i].strip().startswith('```r'):
                tryit_info = lines[i].strip()[3:].strip()
                tryit_lang = tryit_info.split()[0] if tryit_info else ''
                tryit_title_attr = extract_block_title(tryit_info)
                i += 1
                code_lines = []
                while i < len(lines) and not lines[i].strip().startswith('```'):
                    code_lines.append(lines[i])
                    i += 1
                if i < len(lines):
                    i += 1  # skip closing ```
                ecode = escape_html('\n'.join(code_lines))
                if webr_enabled and tryit_lang == 'r':
                    code_html = (
                        f'<div class="webr-container"{tryit_title_attr}>\n'
                        '  <div class="webr-code-block">\n'
                        f'    <div class="webr-editor" data-language="r">{ecode}</div>\n'
                        '    <div class="webr-buttons">\n'
                        '      <button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>\n'
                        '      <button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>\n'
                        '    </div>\n'
                        '    <pre class="webr-output"></pre>\n'
                        '  </div>\n'
                        '  <div class="webr-plot-output"></div>\n'
                        '</div>'
                    )
                else:
                    code_html = f'<pre><code class="language-r">{ecode}</code></pre>'

            # 3. Skip blanks, consume next <details> block (graceful if missing)
            while i < len(lines) and lines[i].strip() == '':
                i += 1
            details_html = ''
            if i < len(lines) and '<details>' in lines[i]:
                details_block = [lines[i]]
                i += 1
                while i < len(lines):
                    cur_line = lines[i]
                    if '</details>' in cur_line:
                        details_block.append(cur_line)
                        i += 1
                        break
                    if cur_line.strip().startswith('```r'):
                        d_info = cur_line.strip()[3:].strip()
                        d_lang = d_info.split()[0] if d_info else ''
                        d_title_attr = extract_block_title(d_info)
                        i += 1
                        dcode_lines = []
                        while i < len(lines) and not lines[i].strip().startswith('```'):
                            dcode_lines.append(lines[i])
                            i += 1
                        if i < len(lines):
                            i += 1
                        dcode = escape_html('\n'.join(dcode_lines))
                        if webr_enabled and d_lang == 'r':
                            details_block.append(f'<div class="webr-container"{d_title_attr}>')
                            details_block.append('  <div class="webr-code-block">')
                            details_block.append(f'    <div class="webr-editor" data-language="r">{dcode}</div>')
                            details_block.append('    <div class="webr-buttons">')
                            details_block.append('      <button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>')
                            details_block.append('      <button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>')
                            details_block.append('    </div>')
                            details_block.append('    <pre class="webr-output"></pre>')
                            details_block.append('  </div>')
                            details_block.append('  <div class="webr-plot-output"></div>')
                            details_block.append('</div>')
                        else:
                            details_block.append(f'<pre><code class="language-r">{dcode}</code></pre>')
                        continue
                    stripped = cur_line.strip()
                    if stripped and not stripped.startswith('<') and not stripped.startswith('```'):
                        details_block.append(f'<p>{md_inline(stripped)}</p>')
                    else:
                        details_block.append(cur_line)
                    i += 1
                details_html = '\n'.join(details_block)

            # Always wrap in tryit-block, even when code/details are absent (prose-only prompts
            # like "Try it: change this value and see what happens" still count as practice).
            pieces = [prompt_html]
            if code_html:
                pieces.append(code_html)
            if details_html:
                pieces.append(details_html)
            out.append('<section class="tryit-block">\n' + '\n'.join(pieces) + '\n</section>')
            continue

        # Callout boxes: [TIP], [WARNING], [NOTE], [KEY INSIGHT]
        callout_match = re.match(r'^\[(TIP|WARNING|NOTE|KEY INSIGHT)\]\s*$', line.strip())
        if callout_match:
            callout_type = callout_match.group(1)
            css_class = {
                'TIP': 'callout-tip',
                'WARNING': 'callout-warning',
                'NOTE': 'callout-note',
                'KEY INSIGHT': 'callout-insight',
            }[callout_type]
            label = 'Key Insight' if callout_type == 'KEY INSIGHT' else callout_type.capitalize()
            i += 1
            body_lines = []
            while i < len(lines) and lines[i].strip() != '':
                body_lines.append(lines[i].strip())
                i += 1
            body_text = md_inline(' '.join(body_lines))
            out.append(f'<div class="callout {css_class}"><div class="callout-label">{label}</div><div class="callout-body">{body_text}</div></div>')
            continue

        # HTML passthrough (for <p class="lead">, <details>, etc.)
        if line.strip().startswith('<') and not line.strip().startswith('<code') and not line.strip().startswith('<strong') and not line.strip().startswith('<em') and not line.strip().startswith('<a '):
            # Single-line HTML wrapper with inline content (e.g. <p class="lead">...**bold**...</p>)
            # Run md_inline on inner text so bold/italic/code markdown renders.
            stripped_line = line.strip()
            single_line_match = re.match(r'^(<[a-zA-Z][^>]*>)(.*)(</[a-zA-Z]+>)\s*$', stripped_line)
            if single_line_match and '<details' not in stripped_line:
                open_tag, inner, close_tag = single_line_match.groups()
                out.append(f'{open_tag}{md_inline(inner)}{close_tag}')
                i += 1
                continue
            # Collect contiguous HTML lines
            html_block = [line]
            i += 1
            # For <details>, collect until </details>
            if '<details>' in line:
                while i < len(lines):
                    cur_line = lines[i]
                    if '</details>' in cur_line:
                        html_block.append(cur_line)
                        i += 1
                        break
                    # Check for code block inside details
                    if cur_line.strip().startswith('```r'):
                        det_info = cur_line.strip()[3:].strip()
                        det_lang = det_info.split()[0] if det_info else ''
                        det_title_attr = extract_block_title(det_info)
                        i += 1
                        code_lines = []
                        while i < len(lines) and not lines[i].strip().startswith('```'):
                            code_lines.append(lines[i])
                            i += 1
                        if i < len(lines):
                            i += 1  # skip closing ```
                        code = escape_html('\n'.join(code_lines))
                        if webr_enabled and det_lang == 'r':
                            html_block.append(f'<div class="webr-container"{det_title_attr}>')
                            html_block.append(f'  <div class="webr-code-block">')
                            html_block.append(f'    <div class="webr-editor" data-language="r">{code}</div>')
                            html_block.append(f'    <div class="webr-buttons">')
                            html_block.append(f'      <button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>')
                            html_block.append(f'      <button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>')
                            html_block.append(f'    </div>')
                            html_block.append(f'    <pre class="webr-output"></pre>')
                            html_block.append(f'  </div>')
                            html_block.append(f'  <div class="webr-plot-output"></div>')
                            html_block.append(f'</div>')
                        else:
                            html_block.append(f'<pre><code class="language-r">{code}</code></pre>')
                        continue
                    # Process inline markdown on text lines inside details
                    # (bold, italic, code, links, images)
                    stripped = cur_line.strip()
                    if stripped and not stripped.startswith('<') and not stripped.startswith('```'):
                        html_block.append(f'<p>{md_inline(stripped)}</p>')
                    else:
                        html_block.append(cur_line)
                    i += 1
                out.append('\n'.join(html_block))
            else:
                out.append(line)
            continue

        # Fenced code block
        if line.strip().startswith('```'):
            info = line.strip()[3:].strip()
            lang = info.split()[0] if info else ''
            top_title_attr = extract_block_title(info)
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines):
                i += 1  # skip closing ```
            code = '\n'.join(code_lines)

            if lang == 'r' and webr_enabled:  # r-static falls through to static block below
                ecode = escape_html(code)
                out.append(f'<div class="webr-container"{top_title_attr}>')
                out.append(f'  <div class="webr-code-block">')
                out.append(f'    <div class="webr-editor" data-language="r">{ecode}</div>')
                out.append(f'    <div class="webr-buttons">')
                out.append(f'      <button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>')
                out.append(f'      <button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>')
                out.append(f'    </div>')
                out.append(f'    <pre class="webr-output"></pre>')
                out.append(f'  </div>')
                out.append(f'  <div class="webr-plot-output"></div>')
                out.append(f'</div>')
            elif lang == 'r' or lang == 'r-static':
                ecode = escape_html(code)
                out.append(f'<pre><code class="language-r">{ecode}</code></pre>')
            elif lang == 'mermaid':
                # Mermaid diagrams should be pre-rendered to .webp via render_mermaid.py
                # Show as static code block if found inline (fallback)
                ecode = escape_html(code)
                out.append(f'<pre><code class="language-mermaid">{ecode}</code></pre>')
            else:
                ecode = escape_html(code)
                out.append(f'<pre><code>{ecode}</code></pre>')
            continue

        # H1
        if line.startswith('# ') and not line.startswith('## '):
            out.append(f'<h1>{md_inline(line[2:].strip())}</h1>')
            # Tutorial metadata strip. Emitted only when at least one field is
            # present in frontmatter. engagement.js populates the visible text.
            _meta_attrs = []
            _diff = fm.get('difficulty')
            _time = fm.get('time_estimate_min')
            _exc = fm.get('exercise_count')
            _xp_each = fm.get('xp_per_exercise')
            if _diff:
                _meta_attrs.append(f'data-difficulty="{html.escape(str(_diff))}"')
            if _time:
                _meta_attrs.append(f'data-time="{html.escape(str(_time))}"')
            if _exc:
                _meta_attrs.append(f'data-exercises="{html.escape(str(_exc))}"')
                try:
                    _xp_total = int(_exc) * int(_xp_each or 15)
                    _meta_attrs.append(f'data-xp="{_xp_total}"')
                except (TypeError, ValueError):
                    pass
            if _meta_attrs:
                out.append(f'<div class="engagement-header" {" ".join(_meta_attrs)}></div>')
            i += 1
            continue

        # H2
        if line.startswith('## '):
            out.append(f'<h2>{md_inline(line[3:].strip())}</h2>')
            i += 1
            continue

        # H3 -> h4 (site convention)
        if line.startswith('### '):
            out.append(f'<h4>{md_inline(line[4:].strip())}</h4>')
            i += 1
            continue

        # H4 -> h5
        if line.startswith('#### '):
            out.append(f'<h5>{md_inline(line[5:].strip())}</h5>')
            i += 1
            continue

        # Table
        if '|' in line and i + 1 < len(lines) and re.match(r'^\s*\|[\s\-:|]+\|\s*$', lines[i + 1]):
            table_lines = []
            while i < len(lines) and '|' in lines[i]:
                table_lines.append(lines[i])
                i += 1
            out.append(convert_table(table_lines))
            continue

        # Blockquote
        if line.startswith('> '):
            bq_lines = []
            while i < len(lines) and lines[i].startswith('> '):
                bq_lines.append(lines[i][2:])
                i += 1
            text = md_inline(' '.join(bq_lines))
            out.append(f'<blockquote><p>{text}</p></blockquote>')
            continue

        # Unordered list
        if re.match(r'^[\-\*]\s', line.strip()):
            items = []
            while i < len(lines) and re.match(r'^[\-\*]\s', lines[i].strip()):
                items.append(md_inline(lines[i].strip()[2:]))
                i += 1
            out.append('<ul>')
            for item in items:
                out.append(f'<li>{item}</li>')
            out.append('</ul>')
            continue

        # Ordered list
        if re.match(r'^\d+\.\s', line.strip()):
            items = []
            while i < len(lines) and re.match(r'^\d+\.\s', lines[i].strip()):
                items.append(md_inline(re.sub(r'^\d+\.\s', '', lines[i].strip())))
                i += 1
            out.append('<ol>')
            for item in items:
                out.append(f'<li>{item}</li>')
            out.append('</ol>')
            continue

        # Horizontal rule
        if re.match(r'^---+$', line.strip()):
            out.append('<hr>')
            i += 1
            continue

        # Block-level image: a line that is only ![alt](src)
        if re.match(r'^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$', line):
            m = re.match(r'^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$', line)
            alt = m.group(1)
            src = m.group(2)
            out.append(f'<p><img src="{src}" alt="{alt}" class="img-responsive" loading="lazy" /></p>')
            i += 1
            continue

        # Regular paragraph
        para_lines = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith('#') and not lines[i].startswith('```') and not lines[i].startswith('>') and not lines[i].startswith('|') and not re.match(r'^[\-\*]\s', lines[i].strip()) and not re.match(r'^\d+\.\s', lines[i].strip()) and not lines[i].strip().startswith('<'):
            para_lines.append(lines[i])
            i += 1
        if para_lines:
            text = md_inline(' '.join(l.strip() for l in para_lines))
            out.append(f'<p>{text}</p>')

    # Build frontmatter for _posts
    fm_out = ['---']
    for key in ['title', 'description', 'keywords', 'mathjax', 'webr', 'curriculum_id', 'post_type', 'auto_link_terms', 'auto_link_case_sensitive', 'sidebar_section', 'sidebar_title', 'sidebar_order', 'fr_parent']:
        if key in fm:
            val = fm[key]
            if isinstance(val, bool):
                fm_out.append(f'{key}: {"true" if val else "false"}')
            else:
                fm_out.append(f'{key}: "{val}"')
    fm_out.append('---')
    fm_out.append('{% raw %}')
    fm_out.append('<!-- md2html:generated -->')

    rendered = '\n'.join(fm_out) + '\n\n' + '\n\n'.join(out) + '\n\n{% endraw %}'

    # Sanity check: any surviving raw callout token means a callout didn't render.
    # Abort the build — publishing a broken callout is worse than failing loudly.
    stray = re.findall(r'\[(?:TIP|NOTE|WARNING|KEY INSIGHT)\]', rendered)
    if stray:
        # Allow literal tokens inside <pre>/<code> blocks (documentation of the syntax).
        rendered_no_code = re.sub(r'<pre[^>]*>.*?</pre>', '', rendered, flags=re.DOTALL)
        rendered_no_code = re.sub(r'<code[^>]*>.*?</code>', '', rendered_no_code, flags=re.DOTALL)
        real_stray = re.findall(r'\[(?:TIP|NOTE|WARNING|KEY INSIGHT)\]', rendered_no_code)
        if real_stray:
            raise ValueError(
                f"md2html sanity check FAILED: {len(real_stray)} unrendered callout token(s) "
                f"found in output ({', '.join(sorted(set(real_stray)))}). "
                f"Fix the markdown — callouts must be [TYPE] on its own line followed by the body."
            )

    return rendered

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python md2html.py <markdown-file> [--skip-links]")
        sys.exit(1)

    skip_links = '--skip-links' in sys.argv

    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        md = f.read()

    result = convert(md)

    # Determine output path
    import os
    basename = os.path.splitext(os.path.basename(sys.argv[1]))[0]
    repo_root = os.path.normpath(os.path.join(os.path.dirname(sys.argv[1]), '..'))
    outpath = os.path.join(repo_root, '_posts', basename + '.html')
    outpath = os.path.normpath(outpath)

    # Slug collision guard: if a legacy root <slug>.html exists with no
    # _posts/<slug>.html backing it, publishing would silently overwrite
    # the legacy page. Abort so the author can rename the slug.
    legacy_root = os.path.join(repo_root, basename + '.html')
    if os.path.exists(legacy_root) and not os.path.exists(outpath):
        print(f"ERROR: slug collision — '{basename}.html' exists as a legacy root page with no _posts/ fragment.")
        print(f"  Rename the slug or migrate the legacy page to _posts/ first.")
        sys.exit(1)

    # Direct-edit guard: fragments generated by md2html carry a marker
    # comment. If an existing fragment lacks it, a human edited it directly
    # and re-generating would clobber those edits. Pass --force to override.
    force = '--force' in sys.argv
    if os.path.exists(outpath) and not force:
        with open(outpath, 'r', encoding='utf-8') as fp:
            existing = fp.read(2000)
        if '<!-- md2html:generated -->' not in existing:
            print(f"ERROR: _posts/{basename}.html has no 'md2html:generated' marker — direct edits would be lost.")
            print(f"  Pass --force to overwrite, or sync edits into posts/{basename}.md first.")
            sys.exit(1)

    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"Converted: {outpath}")

    # Inject auto-links from links.json registry into the fragment
    # (makes _posts/*.html the source of truth for auto-links, so subsequent
    #  builds preserve them)
    if not skip_links:
        try:
            from link_injector import inject_links_for_fragment, inject_fr_for_fragment
            self_url = basename + '.html'
            added = inject_links_for_fragment(outpath, self_url, verbose=False)
            if added > 0:
                print(f"Injected {added} auto-links")
            if inject_fr_for_fragment(outpath):
                print("Injected Further Reading section")
        except Exception as e:
            print(f"WARNING: auto-link injection failed: {e}")
            print("  (fragment written without auto-links; run link_injector.py manually)")

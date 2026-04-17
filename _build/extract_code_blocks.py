"""Read-only scanner: walk posts/*.md (+ _posts/*.html for legacy-only posts)
and emit _build/code_blocks.json with per-block context needed to generate
one-line titles.

Block record (per R fence, in post order):
  { "index", "line", "h2_above", "prose_above",
    "code", "existing_title", "is_tryit_starter",
    "is_solution" }

Posts with `webr: false` in frontmatter are included with an empty blocks[]
so downstream tools can see they were considered and skipped.
"""
import html
import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(REPO_ROOT, 'posts')
FRAGMENTS_DIR = os.path.join(REPO_ROOT, '_posts')
OUT_PATH = os.path.join(REPO_ROOT, '_build', 'code_blocks.json')

_TITLE_RE = re.compile(r'title\s*=\s*"([^"]+)"')
_FENCE_RE = re.compile(r'^```([A-Za-z0-9_-]*)\s*(.*)$')


def parse_frontmatter(text):
    if not text.startswith('---'):
        return {}, text
    try:
        end = text.index('---', 3)
    except ValueError:
        return {}, text
    fm_text = text[3:end].strip()
    body = text[end + 3:].lstrip('\n')
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            val = val.strip().strip('"').strip("'")
            if val.lower() == 'true':
                val = True
            elif val.lower() == 'false':
                val = False
            fm[key.strip()] = val
    return fm, body


def extract_from_markdown(md_path):
    slug = os.path.splitext(os.path.basename(md_path))[0]
    with open(md_path, encoding='utf-8') as f:
        text = f.read()
    fm, body = parse_frontmatter(text)
    post_title = fm.get('title', slug)
    webr_enabled = bool(fm.get('webr', False))

    entry = {
        'post_title': post_title,
        'source': 'markdown',
        'source_path': os.path.relpath(md_path, REPO_ROOT).replace('\\', '/'),
        'webr_enabled': webr_enabled,
        'blocks': [],
    }
    if not webr_enabled:
        return slug, entry

    lines = body.split('\n')
    body_line_offset = text.count('\n', 0, text.index(body))

    current_h2 = ''
    recent_prose = []
    in_details = False
    pending_tryit = False
    block_index = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith('## ') and not stripped.startswith('### '):
            current_h2 = stripped[3:].strip()
            recent_prose = []
            pending_tryit = False
            i += 1
            continue
        if stripped.startswith('<details'):
            in_details = True
            i += 1
            continue
        if stripped.startswith('</details>'):
            in_details = False
            i += 1
            continue
        if stripped.startswith('**Try it:**') or stripped.startswith('**Try it:'):
            pending_tryit = True
            recent_prose.append(re.sub(r'\*+', '', stripped))
            i += 1
            continue

        m = _FENCE_RE.match(stripped)
        if m:
            lang = m.group(1)
            info = m.group(2) or ''
            start_line = body_line_offset + i
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines):
                i += 1
            if lang == 'r':
                title_match = _TITLE_RE.search(info)
                existing_title = title_match.group(1) if title_match else None
                entry['blocks'].append({
                    'index': block_index,
                    'line': start_line + 1,
                    'h2_above': current_h2,
                    'prose_above': ' '.join(recent_prose[-3:]).strip(),
                    'code': '\n'.join(code_lines),
                    'existing_title': existing_title,
                    'is_tryit_starter': pending_tryit and not in_details,
                    'is_solution': in_details,
                    'fence_info': info.strip(),
                })
                block_index += 1
            recent_prose = []
            if pending_tryit and not in_details:
                pending_tryit = False
            continue

        if stripped and not stripped.startswith('#') and not stripped.startswith('!['):
            clean = re.sub(r'[*_`]', '', stripped)
            clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)
            if clean:
                recent_prose.append(clean)
                if len(recent_prose) > 5:
                    recent_prose = recent_prose[-5:]
        elif not stripped:
            pass

        i += 1

    return slug, entry


def extract_from_fragment(html_path):
    """Legacy path: parse the _posts/*.html fragment directly when no markdown source exists."""
    slug = os.path.splitext(os.path.basename(html_path))[0]
    with open(html_path, encoding='utf-8') as f:
        text = f.read()

    fm, body = parse_frontmatter(text)
    post_title = fm.get('title', slug)

    entry = {
        'post_title': post_title,
        'source': 'fragment',
        'source_path': os.path.relpath(html_path, REPO_ROOT).replace('\\', '/'),
        'webr_enabled': True,
        'blocks': [],
    }

    container_re = re.compile(
        r'<div class="webr-container"([^>]*)>.*?'
        r'<span class="webr-header-label">([^<]*)</span>.*?'
        r'<div class="webr-editor" data-language="r">(.*?)</div>',
        re.DOTALL,
    )
    h2_re = re.compile(r'<h2[^>]*>(.*?)</h2>', re.DOTALL)

    current_h2 = ''
    cursor = 0
    block_index = 0
    for m in container_re.finditer(body):
        h2s = [h2_re.findall(body[cursor:m.start()])]
        if h2s and h2s[-1]:
            current_h2 = re.sub(r'<[^>]+>', '', h2s[-1][-1]).strip()

        attrs = m.group(1) or ''
        label_text = (m.group(2) or '').strip()
        ecode = m.group(3) or ''

        title_attr_match = re.search(r'data-block-title="([^"]*)"', attrs)
        existing_title = title_attr_match.group(1) if title_attr_match else None

        prose_slice = body[cursor:m.start()]
        prose_above = re.sub(r'<[^>]+>', ' ', prose_slice)
        prose_above = re.sub(r'\s+', ' ', prose_above).strip()[-400:]

        code = html.unescape(ecode)
        code = re.sub(r'<[^>]+>', '', code)

        entry['blocks'].append({
            'index': block_index,
            'line': None,
            'h2_above': current_h2,
            'prose_above': prose_above,
            'code': code,
            'existing_title': existing_title if existing_title and existing_title != label_text else (label_text if label_text and label_text != 'Interactive R' else None),
            'is_tryit_starter': False,
            'is_solution': False,
            'fence_info': '',
        })
        block_index += 1
        cursor = m.end()

    return slug, entry


def main():
    out = {}

    seen = set()
    for name in sorted(os.listdir(POSTS_DIR)):
        if not name.endswith('.md'):
            continue
        slug, entry = extract_from_markdown(os.path.join(POSTS_DIR, name))
        out[slug] = entry
        seen.add(slug)

    for name in sorted(os.listdir(FRAGMENTS_DIR)):
        if not name.endswith('.html'):
            continue
        slug = os.path.splitext(name)[0]
        if slug in seen:
            continue
        _, entry = extract_from_fragment(os.path.join(FRAGMENTS_DIR, name))
        out[slug] = entry

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    total_posts = len(out)
    webr_posts = sum(1 for e in out.values() if e['webr_enabled'])
    total_blocks = sum(len(e['blocks']) for e in out.values())
    untitled = sum(
        1 for e in out.values() for b in e['blocks']
        if not b['existing_title']
    )
    print(f'Scanned {total_posts} posts ({webr_posts} with webr).')
    print(f'Found {total_blocks} R code blocks; {untitled} need titles.')
    print(f'Wrote: {os.path.relpath(OUT_PATH, REPO_ROOT)}')


if __name__ == '__main__':
    sys.exit(main() or 0)

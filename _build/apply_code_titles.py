"""Deterministic applier: read _build/code_titles.json and patch the
source files so every R fence carries a `title="..."` attribute.

Primary path: rewrite the matching fence line in posts/<slug>.md.
Fallback path (when markdown has no block at the expected index, or
the post is fragment-only): regex-patch _posts/<slug>.html to add
`data-block-title="..."` + replace the "Interactive R" label.

Idempotent: skips blocks that already have a non-default title.
Atomic: writes to tempfile + os.replace.

CLI:
  python _build/apply_code_titles.py --dry-run
  python _build/apply_code_titles.py --dry-run --slug R-Functions
  python _build/apply_code_titles.py --slug R-Functions
  python _build/apply_code_titles.py
"""
import argparse
import html
import json
import os
import re
import sys
import tempfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(REPO_ROOT, 'posts')
FRAGMENTS_DIR = os.path.join(REPO_ROOT, '_posts')
BLOCKS_PATH = os.path.join(REPO_ROOT, '_build', 'code_blocks.json')
TITLES_PATH = os.path.join(REPO_ROOT, '_build', 'code_titles.json')

_TITLE_RE = re.compile(r'title\s*=\s*"([^"]+)"')
_FENCE_RE = re.compile(r'^(\s*)```([A-Za-z0-9_-]*)\s*(.*)$')

_EM_DASH_MAP = {'\u2014': ' - ', '\u2013': ' - ', '\u2012': ' - ',
                '\u2018': "'", '\u2019': "'", '\u201C': '', '\u201D': ''}


def sanitize_title(raw):
    """Normalize a generated title: strip markup, quotes, em-dashes; cap 8 words."""
    if not raw:
        return None
    t = raw.strip()
    for bad, good in _EM_DASH_MAP.items():
        t = t.replace(bad, good)
    t = t.replace('"', '').replace('`', '')
    t = re.sub(r'[<>*_]', '', t)
    t = t.strip().strip('.').strip(':').strip()
    t = re.sub(r'\s+', ' ', t)
    words = t.split()
    if len(words) > 8:
        words = words[:8]
    if not words:
        return None
    return ' '.join(words)


def patch_markdown(md_path, block_line, new_title, fence_info_expected):
    """Rewrite the fence line at block_line (1-indexed) to include title=\"...\".
    Returns (ok, before_line, after_line) tuple or (False, err, '')."""
    with open(md_path, encoding='utf-8') as f:
        lines = f.readlines()
    idx = block_line - 1
    if idx < 0 or idx >= len(lines):
        return False, f'line {block_line} out of range', ''
    line = lines[idx]
    m = _FENCE_RE.match(line.rstrip('\n'))
    if not m:
        return False, f'no fence at line {block_line}', ''
    indent, lang, info = m.group(1), m.group(2), m.group(3)
    if lang != 'r':
        return False, f'fence lang is "{lang}", expected "r"', ''
    if _TITLE_RE.search(info or ''):
        return False, 'title already present', line.rstrip('\n')
    new_info = (info + ' ' if info else '') + f'title="{new_title}"'
    new_line = f'{indent}```{lang} {new_info.strip()}\n'
    before = line.rstrip('\n')
    lines[idx] = new_line
    return True, before, new_line.rstrip('\n')


def write_atomic(path, lines):
    dir_ = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=dir_, prefix='.apply_', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='') as f:
            f.writelines(lines)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def patch_fragment(html_path, block_idx, new_title):
    """Patch the Nth <div class=\"webr-container\"> in _posts/<slug>.html:
    add data-block-title and replace the label text. Returns (ok, msg)."""
    with open(html_path, encoding='utf-8') as f:
        body = f.read()

    container_iter = list(re.finditer(r'<div class="webr-container"([^>]*)>', body))
    if block_idx >= len(container_iter):
        return False, f'only {len(container_iter)} containers, need index {block_idx}'
    m = container_iter[block_idx]
    attrs = m.group(1) or ''
    if re.search(r'data-block-title="([^"]*)"', attrs):
        existing = re.search(r'data-block-title="([^"]*)"', attrs).group(1)
        if existing and existing != 'Interactive R':
            return False, 'fragment already has a non-default title'
        new_attrs = re.sub(r' data-block-title="[^"]*"', f' data-block-title="{html.escape(new_title)}"', attrs)
    else:
        new_attrs = attrs + f' data-block-title="{html.escape(new_title)}"'
    replacement = f'<div class="webr-container"{new_attrs}>'
    new_body = body[:m.start()] + replacement + body[m.end():]

    container_start = m.start()
    next_container = re.search(r'<div class="webr-container"', new_body[m.start() + len(replacement):])
    scope_end = (m.start() + len(replacement) + next_container.start()) if next_container else len(new_body)
    scope = new_body[container_start:scope_end]
    new_scope, n = re.subn(
        r'(<span class="webr-header-label">)[^<]*(</span>)',
        lambda mm: mm.group(1) + html.escape(new_title) + mm.group(2),
        scope,
        count=1,
    )
    if n == 0:
        return False, 'could not find webr-header-label span'
    new_body = new_body[:container_start] + new_scope + new_body[scope_end:]
    return True, new_body


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--slug', help='Limit to one post')
    args = parser.parse_args()

    if not os.path.exists(TITLES_PATH):
        print(f'ERROR: {TITLES_PATH} not found. Generate titles first.', file=sys.stderr)
        return 1
    with open(TITLES_PATH, encoding='utf-8') as f:
        titles = json.load(f)
    with open(BLOCKS_PATH, encoding='utf-8') as f:
        blocks = json.load(f)

    patched_md = []
    patched_frag = []
    skipped = []
    errors = []

    for slug, per_block in titles.items():
        if args.slug and slug != args.slug:
            continue
        if slug not in blocks:
            errors.append((slug, None, 'slug not in code_blocks.json'))
            continue
        entry = blocks[slug]
        source = entry['source']
        source_path = os.path.join(REPO_ROOT, entry['source_path'].replace('/', os.sep))

        if source == 'markdown':
            with open(source_path, encoding='utf-8') as f:
                lines = f.readlines()
            patched_in_this_file = False
            for idx_str, raw_title in sorted(per_block.items(), key=lambda kv: int(kv[0])):
                idx = int(idx_str)
                title = sanitize_title(raw_title)
                if not title:
                    errors.append((slug, idx, f'empty/invalid title: {raw_title!r}'))
                    continue
                if idx >= len(entry['blocks']):
                    errors.append((slug, idx, 'block index out of range'))
                    continue
                block = entry['blocks'][idx]
                if block.get('existing_title') and block['existing_title'] != 'Interactive R':
                    skipped.append((slug, idx, 'existing title'))
                    continue
                line_no = block['line']
                if not line_no:
                    errors.append((slug, idx, 'markdown block has no line'))
                    continue
                line_idx = line_no - 1
                if line_idx >= len(lines):
                    errors.append((slug, idx, f'line {line_no} out of range'))
                    continue
                line = lines[line_idx]
                m = _FENCE_RE.match(line.rstrip('\n'))
                if not m:
                    errors.append((slug, idx, f'no fence at line {line_no}'))
                    continue
                indent, lang, info = m.group(1), m.group(2), m.group(3)
                if lang != 'r':
                    errors.append((slug, idx, f'lang is {lang!r}, not r'))
                    continue
                if _TITLE_RE.search(info or ''):
                    skipped.append((slug, idx, 'fence already has title'))
                    continue
                new_info = (info + ' ' if info else '') + f'title="{title}"'
                new_line = f'{indent}```{lang} {new_info.strip()}\n'
                if args.dry_run:
                    patched_md.append((slug, idx, line.rstrip('\n'), new_line.rstrip('\n')))
                else:
                    lines[line_idx] = new_line
                    patched_md.append((slug, idx, line.rstrip('\n'), new_line.rstrip('\n')))
                    patched_in_this_file = True
            if patched_in_this_file and not args.dry_run:
                write_atomic(source_path, lines)
        else:
            with open(source_path, encoding='utf-8') as f:
                body = f.read()
            original_body = body
            for idx_str, raw_title in sorted(per_block.items(), key=lambda kv: int(kv[0])):
                idx = int(idx_str)
                title = sanitize_title(raw_title)
                if not title:
                    errors.append((slug, idx, f'empty/invalid title: {raw_title!r}'))
                    continue
                tmp_body = body
                ok, result = patch_fragment_in_memory(tmp_body, idx, title)
                if not ok:
                    errors.append((slug, idx, result))
                    continue
                patched_frag.append((slug, idx, title))
                body = result
            if body != original_body and not args.dry_run:
                write_atomic(source_path, body)

    summary = f"""
=== apply_code_titles {'DRY-RUN' if args.dry_run else 'APPLY'} summary ===
Markdown patches: {len(patched_md)}
Fragment patches: {len(patched_frag)}
Skipped (already titled): {len(skipped)}
Errors: {len(errors)}
"""
    print(summary)
    if args.dry_run and patched_md:
        print('--- First 10 markdown patches ---')
        for slug, idx, before, after in patched_md[:10]:
            print(f'[{slug}#{idx}]')
            print(f'  - {before}')
            print(f'  + {after}')
    if errors:
        print('\n--- Errors (first 20) ---')
        for slug, idx, msg in errors[:20]:
            print(f'  {slug}#{idx}: {msg}')

    changed_slugs = sorted({slug for slug, *_ in patched_md} | {slug for slug, *_ in patched_frag})
    if not args.dry_run and changed_slugs:
        list_path = os.path.join(REPO_ROOT, '_build', '.changed_slugs.txt')
        with open(list_path, 'w', encoding='utf-8') as f:
            for s in changed_slugs:
                f.write(s + '\n')
        print(f'\nChanged slugs written to {os.path.relpath(list_path, REPO_ROOT)} ({len(changed_slugs)} posts)')
    return 0


def patch_fragment_in_memory(body, block_idx, new_title):
    """Same as patch_fragment but operates on an in-memory string so we can
    chain multiple patches per file."""
    container_iter = list(re.finditer(r'<div class="webr-container"([^>]*)>', body))
    if block_idx >= len(container_iter):
        return False, f'only {len(container_iter)} containers, need index {block_idx}'
    m = container_iter[block_idx]
    attrs = m.group(1) or ''
    existing_attr = re.search(r'data-block-title="([^"]*)"', attrs)
    if existing_attr and existing_attr.group(1) and existing_attr.group(1) != 'Interactive R':
        return False, 'fragment already has a non-default title'
    if existing_attr:
        new_attrs = re.sub(r' data-block-title="[^"]*"', f' data-block-title="{html.escape(new_title)}"', attrs)
    else:
        new_attrs = attrs + f' data-block-title="{html.escape(new_title)}"'
    replacement = f'<div class="webr-container"{new_attrs}>'
    new_body = body[:m.start()] + replacement + body[m.end():]
    container_start = m.start()
    next_container = re.search(r'<div class="webr-container"', new_body[container_start + len(replacement):])
    scope_end = (container_start + len(replacement) + next_container.start()) if next_container else len(new_body)
    scope = new_body[container_start:scope_end]
    new_scope, n = re.subn(
        r'(<span class="webr-header-label">)[^<]*(</span>)',
        lambda mm: mm.group(1) + html.escape(new_title) + mm.group(2),
        scope,
        count=1,
    )
    if n == 0:
        return False, 'could not find webr-header-label span'
    return True, new_body[:container_start] + new_scope + new_body[scope_end:]


if __name__ == '__main__':
    sys.exit(main() or 0)

"""Stage a batch of slugs for in-session title generation.

Given a list of slugs on the command line, write a compact per-block context
JSON into Plans/codeblocktitles/_staging/batch.json that Claude can read
without loading the full 78k-line code_blocks.json.

Each staged block carries: {index, h2_above, prose_above (200 chars),
code (400 chars), is_tryit_starter, is_solution, fence_info}.

Usage (from repo root selva86.github.io/):
  python Plans/codeblocktitles/_stage_batch.py R-Functions Pie-Donut-Chart-in-R
"""
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLOCKS_PATH = os.path.join(REPO_ROOT, '_build', 'code_blocks.json')
TITLES_PATH = os.path.join(REPO_ROOT, '_build', 'code_titles.json')
STAGING_DIR = os.path.join(REPO_ROOT, 'Plans', 'codeblocktitles', '_staging')


def truncate(text, n):
    if not text:
        return ''
    text = text.replace('\r\n', '\n').strip()
    if len(text) <= n:
        return text
    return text[:n].rstrip() + '...'


def main():
    slugs = sys.argv[1:]
    if not slugs:
        print('Usage: python _stage_batch.py SLUG1 SLUG2 ...', file=sys.stderr)
        return 1

    with open(BLOCKS_PATH, encoding='utf-8') as f:
        blocks = json.load(f)
    with open(TITLES_PATH, encoding='utf-8') as f:
        titles = json.load(f)

    os.makedirs(STAGING_DIR, exist_ok=True)
    out = {}
    for slug in slugs:
        if slug not in blocks:
            print(f'WARN: {slug} not in code_blocks.json, skipping', file=sys.stderr)
            continue
        already = titles.get(slug, {})
        entry = blocks[slug]
        staged = []
        for i, b in enumerate(entry['blocks']):
            if str(i) in already:
                continue
            existing = b.get('existing_title')
            if existing and existing != 'Interactive R':
                continue
            staged.append({
                'index': i,
                'h2_above': b.get('h2_above', ''),
                'prose_above': truncate(b.get('prose_above', ''), 200),
                'code': truncate(b.get('code', ''), 400),
                'is_tryit_starter': b.get('is_tryit_starter', False),
                'is_solution': b.get('is_solution', False),
                'fence_info': b.get('fence_info', ''),
            })
        if staged:
            out[slug] = {
                'post_title': entry.get('post_title', slug),
                'blocks': staged,
            }
        else:
            print(f'NOTE: {slug} has no blocks needing titles (all titled or have existing titles)')

    out_path = os.path.join(STAGING_DIR, 'batch.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    total = sum(len(v['blocks']) for v in out.values())
    print(f'Staged {len(out)} posts, {total} blocks -> {os.path.relpath(out_path, REPO_ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)

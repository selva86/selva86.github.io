"""Merge a patch dict into _build/code_titles.json.

Refuses to overwrite an existing (slug, block_idx) → title unless --force.
Also appends a one-line entry to Plans/codeblocktitles/batch_log.md.

Usage (from repo root):
  python Plans/codeblocktitles/_merge.py Plans/codeblocktitles/_staging/patch.json
  python Plans/codeblocktitles/_merge.py patch.json --force
"""
import argparse
import datetime as dt
import json
import os
import sys
import tempfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TITLES_PATH = os.path.join(REPO_ROOT, '_build', 'code_titles.json')
LOG_PATH = os.path.join(REPO_ROOT, 'Plans', 'codeblocktitles', 'batch_log.md')


def write_atomic(path, text):
    dir_ = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=dir_, prefix='.merge_', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('patch', help='Path to JSON patch file')
    ap.add_argument('--force', action='store_true', help='Allow overwriting existing titles')
    ap.add_argument('--note', default='', help='Short note for batch_log.md')
    args = ap.parse_args()

    with open(args.patch, encoding='utf-8') as f:
        patch = json.load(f)
    with open(TITLES_PATH, encoding='utf-8') as f:
        titles = json.load(f)

    added_slugs = 0
    added_blocks = 0
    updated_blocks = 0
    conflicts = []

    for slug, per_block in patch.items():
        if slug not in titles:
            titles[slug] = {}
            added_slugs += 1
        for idx, title in per_block.items():
            idx = str(idx)
            title = (title or '').strip()
            if not title:
                continue
            if idx in titles[slug] and titles[slug][idx] != title:
                if args.force:
                    titles[slug][idx] = title
                    updated_blocks += 1
                else:
                    conflicts.append((slug, idx, titles[slug][idx], title))
            elif idx not in titles[slug]:
                titles[slug][idx] = title
                added_blocks += 1

    if conflicts and not args.force:
        print(f'REFUSING: {len(conflicts)} conflicts (use --force to overwrite)', file=sys.stderr)
        for slug, idx, old, new in conflicts[:10]:
            print(f'  {slug}#{idx}: existing={old!r} new={new!r}', file=sys.stderr)
        return 1

    # Write code_titles.json atomically
    write_atomic(TITLES_PATH, json.dumps(titles, indent=2, ensure_ascii=False) + '\n')

    # Compute cumulative
    total_posts = len(titles)
    total_blocks = sum(len(v) for v in titles.values())
    now = dt.datetime.now().isoformat(timespec='seconds')

    line = f'{now} | +{added_slugs} posts, +{added_blocks} blocks'
    if updated_blocks:
        line += f', ~{updated_blocks} overwritten'
    line += f' | cumulative {total_posts} posts, {total_blocks} blocks'
    if args.note:
        line += f' | {args.note}'
    line += '\n'

    if not os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'w', encoding='utf-8') as f:
            f.write('# Batch log\n\n')
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(line)

    print(f'Merged: +{added_slugs} posts, +{added_blocks} blocks' + (f', ~{updated_blocks} overwritten' if updated_blocks else ''))
    print(f'Cumulative: {total_posts} posts titled, {total_blocks} blocks titled')
    print(f'Wrote {os.path.relpath(TITLES_PATH, REPO_ROOT)}')
    print(f'Logged to {os.path.relpath(LOG_PATH, REPO_ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)

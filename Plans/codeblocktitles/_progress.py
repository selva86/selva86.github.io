"""Print authoritative progress by reading code_blocks.json + code_titles.json.

Usage:
  python Plans/codeblocktitles/_progress.py            # print only
  python Plans/codeblocktitles/_progress.py --save     # print + rewrite progress.json

Run from the repo root (selva86.github.io/).
"""
import argparse
import datetime as dt
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLOCKS_PATH = os.path.join(REPO_ROOT, '_build', 'code_blocks.json')
TITLES_PATH = os.path.join(REPO_ROOT, '_build', 'code_titles.json')
PROGRESS_PATH = os.path.join(REPO_ROOT, 'Plans', 'codeblocktitles', 'progress.json')
BATCH_ORDER_PATH = os.path.join(REPO_ROOT, 'Plans', 'codeblocktitles', 'batch_order.json')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--save', action='store_true', help='Rewrite progress.json from the authoritative state')
    args = ap.parse_args()

    with open(BLOCKS_PATH, encoding='utf-8') as f:
        blocks = json.load(f)
    with open(TITLES_PATH, encoding='utf-8') as f:
        titles = json.load(f)
    with open(BATCH_ORDER_PATH, encoding='utf-8') as f:
        order = json.load(f)

    total_posts = len(blocks)
    total_blocks = sum(len(e['blocks']) for e in blocks.values())
    done_slugs = set(titles)
    done_blocks = sum(len(v) for v in titles.values())
    zero_skip = set(order['zero_block_skip'])

    # "Need" = slugs with at least one block
    need = {s for s, e in blocks.items() if e['blocks']}
    remaining = sorted(need - done_slugs, key=lambda s: len(blocks[s]['blocks']))

    print(f'Posts total: {total_posts} ({len(need)} have blocks, {len(zero_skip)} zero-block skip)')
    print(f'Posts titled: {len(done_slugs)}  |  remaining: {len(remaining)}')
    print(f'Blocks total: {total_blocks}  |  titled: {done_blocks}  |  remaining: {total_blocks - done_blocks}')
    if remaining:
        print(f'Next 10 slugs (smallest first):')
        for s in remaining[:10]:
            print(f'  {len(blocks[s]["blocks"]):3d} blocks  {s}')

    if args.save:
        now = dt.datetime.now().isoformat(timespec='seconds')
        state = {
            'last_updated': now,
            'posts_total_with_blocks': len(need),
            'posts_titled': len(done_slugs),
            'posts_remaining': len(remaining),
            'blocks_total': total_blocks,
            'blocks_titled': done_blocks,
            'blocks_remaining': total_blocks - done_blocks,
            'zero_block_skip': sorted(zero_skip),
            'next_up': [{'slug': s, 'blocks': len(blocks[s]['blocks'])} for s in remaining[:20]],
            'done_slugs': sorted(done_slugs),
        }
        existing_notes = {}
        if os.path.exists(PROGRESS_PATH):
            with open(PROGRESS_PATH, encoding='utf-8') as f:
                existing = json.load(f)
                state['last_notes'] = existing.get('last_notes', '')
        with open(PROGRESS_PATH, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2)
        print(f'Wrote {os.path.relpath(PROGRESS_PATH, REPO_ROOT)}')


if __name__ == '__main__':
    sys.exit(main() or 0)

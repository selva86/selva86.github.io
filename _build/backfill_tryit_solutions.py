"""
Find **Try it:** blocks in posts/*.md that lack a <details> reveal,
print them with file + line so an LLM pass (or you) can add solutions.

Usage:
  python _build/backfill_tryit_solutions.py            # list orphans
  python _build/backfill_tryit_solutions.py --count    # just counts per file
"""
import glob
import os
import re
import sys

TRYIT_RE = re.compile(
    r'(\*\*Try it:\*\*[^\n]*\n+'           # prompt line
    r'```[a-zA-Z0-9_+-]*\n[\s\S]*?\n```)'  # code fence
    r'([\s\S]{0,400})',                    # lookahead window
)


def has_details(window):
    cut = len(window)
    for stop in (r'\n##\s', r'\*\*Try it:\*\*'):
        m = re.search(stop, window)
        if m and m.start() < cut:
            cut = m.start()
    return '<details>' in window[:cut]


def scan():
    orphans = []
    for path in sorted(glob.glob('posts/*.md')):
        with open(path, encoding='utf-8') as f:
            text = f.read()
        for m in TRYIT_RE.finditer(text):
            block, window = m.group(1), m.group(2)
            if has_details(window):
                continue
            line_no = text[: m.start()].count('\n') + 1
            orphans.append((path, line_no, block))
    return orphans


if __name__ == '__main__':
    orphans = scan()
    if '--count' in sys.argv:
        by_file = {}
        for p, _, _ in orphans:
            by_file[p] = by_file.get(p, 0) + 1
        for p, n in sorted(by_file.items(), key=lambda x: -x[1]):
            print(f'{n:3d}  {os.path.basename(p)}')
        print(f'TOTAL: {len(orphans)} orphan tryit-blocks in {len(by_file)} files')
    else:
        for path, line, block in orphans:
            print(f'\n=== {path}:{line} ===')
            print(block)

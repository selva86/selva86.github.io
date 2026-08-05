#!/usr/bin/env python
"""Seed / rebuild handbook-status.json from Plans/publishing-handbook-plan.md.

The plan is the single source of truth for the chapter list. This parses its
"### Part N - Title" headings and the numbered chapter lines under them, and
writes a resumable tracker that batch_handbook.py drives from.

Rebuilding is safe: existing status, slug and url are preserved by chapter
number, so a rebuild after editing the plan never loses published state.

Usage
-----
    python Scripts/build_handbook_tracker.py
    python Scripts/build_handbook_tracker.py --json      # print, do not write
"""
import os, re, sys, json, argparse

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PLAN = os.path.join(ROOT, 'Plans', 'publishing-handbook-plan.md')
STATUS = os.path.join(ROOT, 'handbook-status.json')

# "### Part 1 - Before you collect anything"  (any dash variant)
PART_RE = re.compile(r'^###\s+Part\s+(\d+)\s*[-–—]\s*(.+?)\s*$')
# "12. Selection bias / non-response not discussed"
CHAP_RE = re.compile(r'^(\d+)\.\s+(.+?)\s*$')


def parse_plan():
    if not os.path.exists(PLAN):
        sys.exit('Plan not found: %s' % PLAN)
    rows, part, part_title, in_curriculum = [], None, '', False
    for line in open(PLAN, encoding='utf-8'):
        line = line.rstrip('\n')
        # only read chapter numbers inside the curriculum section
        if line.startswith('## Part C'):
            in_curriculum = True
            continue
        if in_curriculum and line.startswith('## ') and not line.startswith('## Part C'):
            in_curriculum = False
        if not in_curriculum:
            continue
        m = PART_RE.match(line)
        if m:
            part, part_title = int(m.group(1)), m.group(2)
            continue
        if part is None:
            continue
        m = CHAP_RE.match(line)
        if m:
            num, title = int(m.group(1)), m.group(2)
            # skip prose lines that merely start with a number
            if len(title) < 8 or title.endswith(':'):
                continue
            rows.append({'chapter': num, 'part': part, 'part_title': part_title,
                         'title': title, 'slug': None, 'status': 'pending',
                         'url': None, 'updated': None})
    return rows


def merge_existing(rows):
    """Preserve status/slug/url across a rebuild, keyed on chapter number."""
    if not os.path.exists(STATUS):
        return rows
    try:
        old = {r['chapter']: r for r in json.load(open(STATUS, encoding='utf-8'))}
    except Exception:
        return rows
    for r in rows:
        prev = old.get(r['chapter'])
        if prev:
            for k in ('slug', 'status', 'url', 'updated'):
                if prev.get(k):
                    r[k] = prev[k]
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', action='store_true', help='print without writing')
    args = ap.parse_args()

    rows = merge_existing(parse_plan())
    if not rows:
        sys.exit('Parsed 0 chapters. Check the plan formatting under "## Part C".')

    # sanity: chapter numbers should be unique
    seen, dupes = set(), []
    for r in rows:
        if r['chapter'] in seen:
            dupes.append(r['chapter'])
        seen.add(r['chapter'])
    if dupes:
        print('WARNING: duplicate chapter numbers in the plan: %s' % sorted(set(dupes)))

    rows.sort(key=lambda r: r['chapter'])

    if args.json:
        print(json.dumps(rows, indent=2, ensure_ascii=False))
        return 0

    with open(STATUS, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)

    parts = {}
    for r in rows:
        parts.setdefault(r['part'], []).append(r)
    print('Wrote %s' % os.path.relpath(STATUS, ROOT))
    print('  %d chapters across %d parts' % (len(rows), len(parts)))
    for p in sorted(parts):
        done = sum(1 for r in parts[p] if r['status'] == 'published')
        print('    Part %-2d  %-40s %2d chapters  (%d published)'
              % (p, parts[p][0]['part_title'][:40], len(parts[p]), done))
    return 0


if __name__ == '__main__':
    sys.exit(main())

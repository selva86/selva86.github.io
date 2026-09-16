#!/usr/bin/env python3
"""Deterministic, bounded fixes for lesson markdown that would otherwise stop
the factory between stages.

The batch runner (Scripts/batch_lessons.py) calls this when a stage fails or a
publish cannot be verified, then re-runs the gate and retries the stage once.
Every fixer is small, mechanical and safe to apply blind; anything needing
judgment stays with the reviewer skill. Add a fixer by appending to FIXERS.

Usage:
    python Scripts/lesson_autofix.py <slug-or-path> [--dry-run]
Prints one line per applied fix; exit 0 = ran (fixed or nothing to fix),
exit 2 = file not found.
"""
import io
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def fold_stray_output_lines(lines):
    """Move `#>` output lines that sit right after a closing ``` fence back
    inside that fence. Outside a fence a line starting with `#` is neither a
    heading nor prose, and the shared markdown converter treated it as
    unparseable (it looped forever before the guard in md2html.py). Inside
    the fence it is just a comment the browser R session ignores."""
    out, i, moved = [], 0, 0
    while i < len(lines):
        if lines[i].strip() == '```' and i + 1 < len(lines) and lines[i + 1].startswith('#>'):
            j = i + 1
            blk = []
            while j < len(lines) and lines[j].startswith('#>'):
                blk.append(lines[j])
                j += 1
            # Only fold when this ``` closes a fence (odd count of fences so far).
            opened = sum(1 for l in out if l.startswith('```')) % 2 == 1
            if opened:
                out.extend(blk)
                out.append(lines[i])
                moved += len(blk)
                i = j
                continue
        out.append(lines[i])
        i += 1
    return out, ('moved %d output line(s) inside their code fence' % moved) if moved else None


FIXERS = [fold_stray_output_lines]


def autofix(path, dry_run=False):
    with io.open(path, encoding='utf-8') as f:
        text = f.read()
    lines = text.split('\n')
    applied = []
    for fx in FIXERS:
        lines, note = fx(lines)
        if note:
            applied.append('%s: %s' % (fx.__name__, note))
    if applied and not dry_run:
        with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(lines))
    return applied


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    target = argv[0]
    dry = '--dry-run' in argv
    path = target if os.path.exists(target) else os.path.join(ROOT, 'lessons', target + '.md')
    if not os.path.exists(path):
        print('lesson not found: %s' % path)
        return 2
    applied = autofix(path, dry_run=dry)
    for a in applied:
        print(('would fix: ' if dry else 'fixed: ') + a)
    if not applied:
        print('no-op: nothing to fix in %s' % os.path.relpath(path, ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

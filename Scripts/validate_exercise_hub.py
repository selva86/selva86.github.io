#!/usr/bin/env python3
"""Validate exercise-hub contract compliance in _posts/*.html EX fragments.

Enforces section 7 of _build/exercise-hub-contract.md. Structural problems are
ERRORS (block publish); a missing/short hints block is a WARNING until the T8
hint backfill lands, then run with --strict-hints to make it an error too.

Usage:
  python Scripts/validate_exercise_hub.py _posts/dplyr-Exercises-in-R.html
  python Scripts/validate_exercise_hub.py --all
  python Scripts/validate_exercise_hub.py --all --strict-hints
  python Scripts/validate_exercise_hub.py --all --show-warnings

Exit code is non-zero if any ERROR is found.
"""
import sys
import os
import re
import glob

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(REPO_ROOT, '_posts')

GRADE_MODES = {'output-compare', 'self-check', 'assertion'}
DIFFICULTIES = {'beginner', 'intermediate', 'advanced'}

SECTION_RE = re.compile(r'<section class="exercise"([^>]*)>(.*?)</section>', re.DOTALL)


def is_ex_fragment(html):
    """True when the fragment frontmatter declares post_type EX."""
    m = re.match(r'^---\s*\n(.*?)\n---', html, re.DOTALL)
    if not m:
        return False
    return re.search(r'^post_type:\s*"?EX"?\s*$', m.group(1), re.MULTILINE) is not None


def validate_fragment(path, strict_hints=False):
    """Return (errors, warnings) for one fragment."""
    errors, warnings = [], []
    html = open(path, 'r', encoding='utf-8').read()
    # webr:false hubs are intentionally non-interactive (API, Shiny, SQL, ...);
    # md2html renders their code as static <pre>, so the webr-container checks
    # below do not apply - the engagement layer runs them grading-less.
    _fm = re.match(r'^---\s*\n(.*?)\n---', html, re.DOTALL)
    static_hub = bool(_fm and re.search(r'^webr:\s*false\s*$', _fm.group(1),
                                        re.MULTILINE))
    sections = SECTION_RE.findall(html)
    if not sections:
        errors.append('no <section class="exercise"> found (not migrated?)')
        return errors, warnings

    seen_ids = set()
    for attrs, body in sections:
        def attr(name):
            m = re.search(r'%s="([^"]*)"' % name, attrs)
            return m.group(1) if m else None

        ex_id = attr('data-exercise-id')
        grade_mode = attr('data-grade-mode')
        difficulty = attr('data-difficulty')
        label = ex_id or '(exercise with no id)'

        if not ex_id:
            errors.append('an exercise has no data-exercise-id')
        elif ex_id in seen_ids:
            errors.append('duplicate data-exercise-id: %s' % ex_id)
        else:
            seen_ids.add(ex_id)

        if grade_mode not in GRADE_MODES:
            errors.append('%s: invalid data-grade-mode %r' % (label, grade_mode))
        if difficulty not in DIFFICULTIES:
            errors.append('%s: invalid data-difficulty %r' % (label, difficulty))

        if body.count('class="exercise-task"') != 1:
            errors.append('%s: needs exactly one .exercise-task' % label)

        expected = re.search(r'<div class="exercise-expected">(.*?)</div>', body, re.DOTALL)
        if not expected:
            errors.append('%s: missing .exercise-expected block' % label)
        else:
            code = re.search(r'<pre><code>(.*?)</code></pre>', expected.group(1), re.DOTALL)
            if not code or not code.group(1).strip():
                errors.append('%s: .exercise-expected has no non-empty <pre><code>' % label)

        # Your-turn block = a webr-container that is NOT inside the solution.
        body_no_solution = re.sub(r'<details.*?</details>', '', body, flags=re.DOTALL)
        if 'class="webr-container"' not in body_no_solution and not static_hub:
            errors.append('%s: missing the Your-turn webr-container' % label)

        # Hints — required in the end state, WARN until the backfill.
        hints = re.search(r'<div class="exercise-hints"[^>]*>(.*?)</div>', body, re.DOTALL)
        bucket = errors if strict_hints else warnings
        if not hints:
            bucket.append('%s: missing .exercise-hints block' % label)
        else:
            paras = [p for p in re.findall(r'<p>(.*?)</p>', hints.group(1), re.DOTALL)
                     if p.strip()]
            if len(paras) != 2:
                bucket.append('%s: .exercise-hints needs exactly 2 non-empty <p> '
                              '(found %d)' % (label, len(paras)))

        # Solution <details> is optional; if present it must be well-formed.
        solution = re.search(r'<details class="exercise-solution">(.*?)</details>',
                             body, re.DOTALL)
        if solution:
            if '<summary' not in solution.group(1):
                errors.append('%s: solution <details> has no <summary>' % label)
            if 'class="webr-container"' not in solution.group(1) and not static_hub:
                errors.append('%s: solution <details> has no webr-container' % label)

    return errors, warnings


def main():
    args = sys.argv[1:]
    strict_hints = '--strict-hints' in args
    show_warnings = '--show-warnings' in args
    args = [a for a in args if a not in ('--strict-hints', '--show-warnings')]

    if '--all' in args:
        paths = sorted(glob.glob(os.path.join(POSTS_DIR, '*.html')))
    elif args:
        paths = args
    else:
        print(__doc__)
        sys.exit(1)

    single = len(paths) == 1
    checked = total_err = total_warn = 0
    failed = []

    for path in paths:
        try:
            html = open(path, 'r', encoding='utf-8').read()
        except OSError:
            print('cannot read %s' % path)
            continue
        if not is_ex_fragment(html):
            if single:
                print('%s is not an EX fragment - nothing to validate'
                      % os.path.basename(path))
            continue

        checked += 1
        errors, warnings = validate_fragment(path, strict_hints)
        name = os.path.basename(path)
        total_err += len(errors)
        total_warn += len(warnings)

        if errors:
            failed.append(name)
            print('FAIL  %s' % name)
            for e in errors:
                print('      ERROR  %s' % e)
        elif warnings:
            print('ok    %s  (%d warning%s)'
                  % (name, len(warnings), '' if len(warnings) == 1 else 's'))
        else:
            print('ok    %s' % name)

        if warnings and (show_warnings or single):
            for w in warnings:
                print('      warn   %s' % w)

    print('---')
    print('Checked %d EX hub(s): %d error(s), %d warning(s)'
          % (checked, total_err, total_warn))
    if total_warn and not show_warnings and not single:
        print('(warnings are mostly missing hints - expected until the T8 backfill; '
              'rerun with --show-warnings for detail)')
    if failed:
        print('Failed: %s' % ', '.join(failed))
    sys.exit(1 if total_err else 0)


if __name__ == '__main__':
    main()

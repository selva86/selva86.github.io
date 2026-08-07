#!/usr/bin/env python3
"""Reconcile every content tracker against what is actually on disk and in git.

WHY THIS EXISTS
---------------
`claude -p` does not reliably propagate a subagent's intended exit status: a
worker can fail to publish and the CLI still exits 0. Every batch orchestrator
that recorded "published" from an exit code alone could therefore mark work
complete that never landed, which is worse than recording nothing - the tracker
looks finished and the pages are silently missing.

`Scripts/batch_handbook.py::verify_published` is the fix pattern: check the
artifacts, not the status. This script applies that same check retroactively to
every tracker, so the owner can see whether past batches under-published.

A row claiming published is OK only when all three hold:

  1. the source fragment exists (`_posts/<slug>.html`, or `_lessons/<slug>.html`
     for interactive lessons),
  2. the built page exists at `<slug>.html`,
  3. that built page is committed to HEAD.

Point 3 asks HEAD, not the index. `git ls-files` reads the INDEX, so a merely
staged file passes as committed - the same class of bug as trusting an exit
code: it reports success for work that has not landed.

VERDICTS
--------
Failures are not all the same thing, and collapsing them hides the interesting
ones. Every row lands in exactly one bucket:

  ok            fragment + built page + committed. Nothing to do.
  UNBACKED      the page is missing from disk, or exists but is not in HEAD.
                This is the real under-publish: the tracker claims a page the
                site does not have.
  ORPHANED      the page is live and committed, but no source fragment exists.
                It shipped; it just cannot be rebuilt or edited through the
                pipeline any more. Usually lost source, not a failed publish.
  CASE-MISMATCH the page is committed under different letter-casing than the
                tracker's slug. Harmless on Windows (core.ignorecase), broken
                in production: the tracker's URL 404s on a case-sensitive host.

Duplicate rows claiming the same slug are counted and reported separately -
they inflate every "how many are published" count computed from these files.

READ-ONLY BY CONSTRUCTION
-------------------------
This script reports. It never writes a tracker, never touches the filesystem,
never runs a build, and never re-publishes. Repair is the owner's call.

Usage:
  python Scripts/verify_state.py                 # human-readable report
  python Scripts/verify_state.py --json          # machine-readable
  python Scripts/verify_state.py --all           # list every flagged row
  python Scripts/verify_state.py --tracker pseo  # one tracker

Exit code: 0 when nothing is UNBACKED, 1 otherwise. ORPHANED and CASE-MISMATCH
are reported but do not fail the run: those pages are live.
"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# How many flagged rows to print per tracker before truncating (--all lifts it).
PREVIEW = 25

OK, UNBACKED, ORPHANED, CASE = 'ok', 'unbacked', 'orphaned', 'case_mismatch'


# ---------------------------------------------------------------------------
# git
# ---------------------------------------------------------------------------
def head_files():
    """Every path committed to HEAD, as a set. One `git ls-tree` beats thousands
    of `git cat-file -e` calls and answers the identical question."""
    r = subprocess.run(['git', 'ls-tree', '-r', '--name-only', 'HEAD'],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    return set(r.stdout.splitlines())


def head_sha():
    r = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'],
                       cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else '?'


# ---------------------------------------------------------------------------
# the check (mirrors batch_handbook.verify_published, with the buckets above)
# ---------------------------------------------------------------------------
def check_slug(slug, committed, lower_committed, fragment_dirs):
    """Return (verdict, reason)."""
    if not slug:
        return UNBACKED, 'row claims published but carries no slug'

    page = slug + '.html'
    on_disk = os.path.exists(os.path.join(ROOT, page))
    frag = next((d for d in fragment_dirs
                 if os.path.exists(os.path.join(ROOT, d, slug + '.html'))), None)

    if not on_disk:
        return UNBACKED, 'no built page at %s' % page

    if committed is not None and page not in committed:
        # Windows resolves paths case-insensitively, so the file opens fine here
        # while git stores - and the CDN serves - a different name. Separate that
        # from a genuinely uncommitted page: the causes and the fixes differ.
        actual = lower_committed.get(page.lower())
        if actual:
            return CASE, 'committed as %s; the tracker slug casing differs, so its URL 404s in production' % actual
        return UNBACKED, '%s exists but is not committed to HEAD' % page

    if frag is None:
        return ORPHANED, 'page is live and committed but has no source at %s' % (
            ' or '.join('%s/%s.html' % (d, slug) for d in fragment_dirs))

    return OK, 'fragment + page + committed'


def verify_published(slug, fragment_dirs=('_posts',)):
    """Single-slug version for batch orchestrators. Returns (ok, reason).

    Call this after a publish phase, BEFORE recording success. The publish
    subprocess's exit code proves nothing - `claude -p` exits 0 whether or not
    the skill completed its work - so ask the filesystem and git instead.

    Only a clean pass returns True. A page committed under different casing
    fails too: the publish half-happened and the tracker's URL would 404.

    Cheap on the happy path (one `git cat-file`); the whole-tree read that
    detects a casing mismatch runs only when something already went wrong.
    """
    if not slug:
        return False, 'no slug'
    page = slug + '.html'
    if not any(os.path.exists(os.path.join(ROOT, d, slug + '.html')) for d in fragment_dirs):
        return False, 'no fragment at %s' % ' or '.join(
            '%s/%s.html' % (d, slug) for d in fragment_dirs)
    if not os.path.exists(os.path.join(ROOT, page)):
        return False, 'no built page at %s' % page
    # HEAD, not the index: `git ls-files` reads the INDEX, so a merely staged
    # file passes as committed, and an uncommitted page never reaches the site.
    r = subprocess.run(['git', 'cat-file', '-e', 'HEAD:' + page],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        committed = head_files() or set()
        actual = {p.lower(): p for p in committed}.get(page.lower())
        if actual:
            return False, 'committed as %s, not %s (casing mismatch)' % (actual, page)
        return False, '%s exists but is not committed to HEAD' % page
    return True, 'fragment + page + committed'


# ---------------------------------------------------------------------------
# tracker readers - each yields (slug, label) for rows CLAIMING published
# ---------------------------------------------------------------------------
def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def rows_pseo(data):
    """pseo-status.json: flat array. A row with a `url` claims published."""
    for e in data:
        if e.get('url') or e.get('status') == 'done':
            yield e.get('slug'), e.get('title') or ''


def rows_curriculum(data):
    """curriculum-status.json: paths -> sub_paths -> posts[], status field."""
    for path in data.get('paths', {}).values():
        for sub in path.get('sub_paths', {}).values():
            for post in sub.get('posts', []):
                if post.get('status') == 'published':
                    yield post.get('slug'), '%s %s' % (
                        post.get('id', '?'),
                        post.get('ctr_title') or post.get('seo_title') or '')


def rows_lessons(data):
    """lessons-status.json: {slug: {course_id, status}}. `done` claims published."""
    for slug, v in data.items():
        if v.get('status') == 'done':
            yield slug, v.get('course_id') or ''


def rows_handbook(data):
    """handbook-status.json: flat array of chapters."""
    for e in data:
        if e.get('status') == 'published':
            yield e.get('slug'), 'ch %s %s' % (e.get('chapter', '?'), e.get('title') or '')


TRACKERS = [
    # name, filename, row reader, fragment dirs, what "published" means in that file
    ('pseo', 'pseo-status.json', rows_pseo, ['_posts'], 'row has a url'),
    ('curriculum', 'curriculum-status.json', rows_curriculum, ['_posts'], 'status == published'),
    ('lessons', 'lessons-status.json', rows_lessons, ['_lessons', '_posts'], 'status == done'),
    ('handbook', 'handbook-status.json', rows_handbook, ['_posts'], 'status == published'),
]


# ---------------------------------------------------------------------------
def audit(name, filename, reader, frag_dirs, claim, committed, lower_committed):
    result = {'tracker': name, 'file': filename, 'claim': claim, 'present': False,
              'rows': 0, 'slugs': 0, 'ok': 0,
              'unbacked': [], 'orphaned': [], 'case_mismatch': [], 'duplicates': []}
    path = os.path.join(ROOT, filename)
    if not os.path.exists(path):
        result['error'] = 'not present (gitignored trackers are absent on a fresh clone)'
        return result
    try:
        data = load(path)
    except Exception as exc:
        # A batch may be mid-write. Say so rather than reporting a false zero.
        result['error'] = 'unreadable (%s) - a batch may be writing it right now' % exc
        return result

    result['present'] = True
    seen = {}
    for slug, label in reader(data):
        result['rows'] += 1
        key = slug or ('<no slug>:' + str(label))
        if key in seen:
            # Two rows claiming one slug. If their titles differ, this is not a
            # harmless copy: one planned post is wearing another's slug and URL,
            # so it reads as published while its own page may never have been
            # written. Surface both titles - that is the actionable part.
            result['duplicates'].append({'slug': slug, 'label': label,
                                         'first_label': seen[key],
                                         'collision': label != seen[key]})
            continue
        seen[key] = label
        result['slugs'] += 1
        verdict, reason = check_slug(slug, committed, lower_committed, frag_dirs)
        if verdict == OK:
            result['ok'] += 1
        else:
            result[verdict].append({'slug': slug, 'label': label, 'reason': reason})
    return result


BUCKETS = [('unbacked', 'UNBACKED'), ('orphaned', 'ORPHANED'),
           ('case_mismatch', 'CASE-MISMATCH'), ('duplicates', 'DUPLICATE ROWS')]


def main():
    ap = argparse.ArgumentParser(
        description='Reconcile content trackers against disk and git. Read-only.')
    ap.add_argument('--json', action='store_true', help='machine-readable output')
    ap.add_argument('--all', action='store_true',
                    help='list every flagged row (default: first %d per bucket)' % PREVIEW)
    ap.add_argument('--tracker', action='append',
                    help='limit to one tracker (%s); repeatable'
                         % ', '.join(t[0] for t in TRACKERS))
    args = ap.parse_args()

    committed = head_files()
    lower_committed = ({p.lower(): p for p in committed} if committed else {})
    wanted = set(args.tracker or [t[0] for t in TRACKERS])
    results = [audit(n, f, r, d, c, committed, lower_committed)
               for (n, f, r, d, c) in TRACKERS if n in wanted]

    total_unbacked = sum(len(r['unbacked']) for r in results)

    if args.json:
        print(json.dumps({'head': head_sha(),
                          'head_readable': committed is not None,
                          'trackers': results,
                          'total_unbacked': total_unbacked}, indent=2))
        return 1 if total_unbacked else 0

    print('Tracker reconciliation against disk + HEAD (%s)' % head_sha())
    if committed is None:
        print('WARNING: could not read HEAD; the commit check was SKIPPED.')
    print('A row is OK only if fragment + built page exist AND the page is in HEAD.')
    print()
    print('%-12s %7s %7s %7s %9s %9s %6s %5s   %s'
          % ('TRACKER', 'ROWS', 'SLUGS', 'OK', 'UNBACKED', 'ORPHANED', 'CASE', 'DUPES',
             'CLAIM MEANS'))
    for r in results:
        if not r['present']:
            print('%-12s %7s %7s %7s %9s %9s %6s %5s   %s'
                  % (r['tracker'], '-', '-', '-', '-', '-', '-', '-', r['error']))
            continue
        print('%-12s %7d %7d %7d %9d %9d %6d %5d   %s'
              % (r['tracker'], r['rows'], r['slugs'], r['ok'], len(r['unbacked']),
                 len(r['orphaned']), len(r['case_mismatch']), len(r['duplicates']),
                 r['claim']))

    for r in results:
        for key, heading in BUCKETS:
            if not r.get(key):
                continue
            print()
            print('%s - %s (%d):' % (r['tracker'], heading, len(r[key])))
            shown = r[key] if args.all else r[key][:PREVIEW]
            for b in shown:
                if b.get('reason'):
                    print('  %-46s %s' % (b['slug'] or '<no slug>', b['reason']))
                elif b.get('collision'):
                    print('  %s' % (b['slug'] or '<no slug>'))
                    print('      slug held by: %s' % b.get('first_label', ''))
                    print('      also claimed by: %s   <- this row has no slug of its own'
                          % b.get('label', ''))
                else:
                    print('  %-46s repeated row (same title)' % (b['slug'] or '<no slug>'))
            if len(r[key]) > len(shown):
                print('  ... and %d more (pass --all)' % (len(r[key]) - len(shown)))

    print()
    if total_unbacked:
        print('%d row(s) claim published with no page on the site.' % total_unbacked)
    else:
        print('No under-publishes: every claimed page exists on disk and in HEAD.')
    print('This script never repairs anything. Decide per row whether to '
          'republish or to correct the tracker.')
    return 1 if total_unbacked else 0


if __name__ == '__main__':
    sys.exit(main())

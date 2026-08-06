#!/usr/bin/env python
"""Generate a handbook index page at tutorials/<key>.html from www/curricula.json.

The three original handbook indexes (statistics, time-series, ggplot2) were
hand-maintained 40-54 KB HTML files with no generator, so adding a fourth book
meant hand-authoring another one. This turns a handbook index into a config
entry: add a book to curricula.json, run this, get a page.

Reuses gen_sections.render_page so the masthead, footer, scripts, auth slots and
JSON-LD stay identical to every other generated section page. Only the body is
handbook-specific.

Chapters whose target file does not exist on disk are rendered as plain text
rather than links, so a partially-written handbook never ships a dead link.

Usage
-----
    python _build/gen_handbook_index.py publishing
    python _build/gen_handbook_index.py --all
    python _build/gen_handbook_index.py publishing --dry-run
"""
import os, sys, json, argparse, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
import gen_sections as gs

CURRICULA = os.path.join(ROOT, 'www', 'curricula.json')


def load_books():
    with open(CURRICULA, encoding='utf-8') as f:
        return json.load(f).get('books', [])


def chapter_exists(href):
    """href is site-absolute, e.g. /Reviewer-Says-X.html"""
    return bool(href) and os.path.exists(os.path.join(ROOT, href.lstrip('/')))


RENAMES = os.path.join(ROOT, 'functions', '_data', 'renamed-pages.json')


def load_old_slugs():
    """Map new slug -> old slug from the rename registry.

    A chapter can be live under its OLD slug while the tracker already carries
    the new one: chapters are renamed on the branch before the rename lands on
    master. Without this the index would call a page that is serving fine
    "Soon". Resolving against the rename map keeps the index honest about what a
    reader can actually click.
    """
    try:
        with open(RENAMES, encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    mapping = data if isinstance(data, dict) else data.get('redirects', {})
    out = {}
    for old, new in mapping.items():
        if isinstance(new, str):
            out.setdefault(new.strip('/'), old.strip('/'))
    return out


def resolve_href(slug, old_slugs):
    """Return the href a reader can actually follow, or '' if not live yet.

    Checks the current slug first, then the pre-rename slug. Existence is read
    off disk, never off a status field, so the index reflects what shipped in
    this checkout rather than what a tracker claims.
    """
    if not slug:
        return ''
    if chapter_exists('/%s.html' % slug):
        return '/%s.html' % slug
    old = old_slugs.get(slug)
    if old and chapter_exists('/%s.html' % old):
        return '/%s.html' % old
    return ''


def parts_from_tracker(tracker_name):
    """Build the parts/chapters structure from a <name>-status.json tracker.

    Preferred over listing chapters in curricula.json: the tracker is already
    written by the batch on every publish, so there is no second file to keep in
    sync and no way for the index to drift from what actually shipped. With this,
    curricula.json only carries the book's identity (key, title, tagline, pro).
    """
    path = os.path.join(ROOT, tracker_name)
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as f:
        rows = json.load(f)
    buckets = {}
    for r in sorted(rows, key=lambda x: x.get('chapter', 0)):
        p = r.get('part')
        buckets.setdefault(p, {'title': r.get('part_title', ''), 'chapters': []})
        slug = r.get('slug')
        buckets[p]['chapters'].append({
            'title': r.get('title', ''),
            'slug': slug or '',
            'href': ('/%s.html' % slug) if slug else '',
        })
    return [buckets[p] for p in sorted(buckets)]


def live_href(chapter, old_slugs):
    """The href to link, or '' when the chapter is not readable yet."""
    href = chapter.get('href', '')
    if chapter_exists(href):
        return href
    slug = chapter.get('slug')
    if not slug and href.endswith('.html'):
        slug = href.strip('/')[:-len('.html')]
    return resolve_href(slug, old_slugs) if slug else ''


def render_body(book):
    e = html.escape
    parts = book.get('parts', [])
    if book.get('tracker'):
        from_tracker = parts_from_tracker(book['tracker'])
        if from_tracker:
            parts = from_tracker
    old_slugs = load_old_slugs()
    for part in parts:
        for c in part.get('chapters', []):
            c['_live'] = live_href(c, old_slugs)
    total = sum(len(p.get('chapters', [])) for p in parts)
    built = sum(1 for p in parts for c in p.get('chapters', []) if c.get('_live'))

    out = []
    out.append('<header class="hb-hero">')
    out.append('  <h1>%s</h1>' % e(book['title']))
    if book.get('tagline'):
        out.append('  <p class="hb-tagline">%s</p>' % e(book['tagline']))
    pro = book.get('pro') or {}
    if pro.get('href') and pro.get('label'):
        out.append('  <p class="hb-pro">')
        out.append('    <a class="hb-pro-link" href="%s">%s</a>' %
                   (e(pro['href']), e(pro['label'])))
        if pro.get('blurb'):
            out.append('    <span class="hb-pro-blurb">%s</span>' % e(pro['blurb']))
        out.append('  </p>')
    out.append('</header>')

    out.append('<div class="hb-parts">')
    for i, part in enumerate(parts, 1):
        chapters = part.get('chapters', [])
        if not chapters:
            continue
        out.append('  <section class="hb-part">')
        out.append('    <h2 class="hb-part-title">'
                   '<span class="hb-part-num">Part %d</span> %s</h2>'
                   % (i, e(part.get('title', ''))))
        out.append('    <ol class="hb-chapters">')
        for c in chapters:
            title, href = c.get('title', ''), c.get('_live', '')
            if href:
                out.append('      <li><a href="%s">%s</a></li>' % (e(href), e(title)))
            else:
                out.append('      <li class="hb-unbuilt"><span>%s</span>'
                           '<span class="hb-soon">Soon</span></li>' % e(title))
        out.append('    </ol>')
        out.append('  </section>')
    out.append('</div>')

    if built < total:
        out.append('<p class="hb-progress">%d of %d chapters published. '
                   'The rest are being written.</p>' % (built, total))
    return '\n'.join(out), built, total, len(parts)


CSS = """
.hb-hero{margin:0 0 2.2rem}
.hb-hero h1{margin:0 0 .5rem;font-size:2.1rem;line-height:1.15}
.hb-tagline{font-size:1.12rem;color:var(--muted,#5a6472);margin:0 0 1rem;max-width:44em}
.hb-pro{margin:0;display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline}
.hb-pro-link{font-weight:600}
.hb-pro-blurb{color:var(--muted,#5a6472);font-size:.95rem}
.hb-part{margin:0 0 2rem}
.hb-part-title{font-size:1.16rem;margin:0 0 .6rem;padding-bottom:.35rem;
  border-bottom:1px solid var(--rule,#e3e7ec)}
.hb-part-num{display:inline-block;margin-right:.5rem;font-size:.78rem;
  letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#5a6472);
  font-weight:600;vertical-align:.12em}
.hb-chapters{margin:0;padding-left:1.4rem}
.hb-chapters li{margin:.3rem 0;line-height:1.45}
.hb-unbuilt>span:first-child{color:var(--muted,#8a94a2)}
.hb-soon{display:inline-block;margin-left:.5rem;padding:0 .4rem;border-radius:999px;
  border:1px solid var(--rule,#e3e7ec);color:var(--muted,#8a94a2);
  font-size:.66rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
  line-height:1.55;vertical-align:.08em;white-space:nowrap}
.hb-progress{margin-top:2rem;color:var(--muted,#5a6472);font-size:.95rem}
@media (max-width:640px){.hb-hero h1{font-size:1.7rem}}
""".strip()


def build_book(book, dry_run=False):
    key = book['key']
    out_rel = 'tutorials/%s.html' % key
    canonical = gs.SITE + '/tutorials/%s.html' % key
    body, built, total, nparts = render_body(book)

    desc = book.get('tagline') or book['title']
    desc = ('%s %s The complete curriculum in R, %d chapters across %d parts. '
            'Free and runnable in your browser.'
            % (book['title'] + '.', desc, total, nparts))
    desc = desc[:300]

    collection = {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        'name': book['title'], 'url': canonical,
        'description': book.get('tagline', ''),
    }
    breadcrumb = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': gs.SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Tutorials',
             'item': gs.SITE + '/tutorials/'},
            {'@type': 'ListItem', 'position': 3, 'name': book.get('short') or book['title'],
             'item': canonical}]}

    if dry_run:
        print('  would write %s  (%d/%d chapters linked)' % (out_rel, built, total))
        return built, total

    gs.render_page(
        out_rel, canonical,
        '%s · r-statistics.co' % book['title'],
        desc, body,
        page_css=CSS, sprite='', active='tutorials',
        jsonld=[collection, breadcrumb],
        keywords=book.get('keywords', ''))
    print('  wrote %s  (%d/%d chapters linked)' % (out_rel, built, total))
    return built, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('key', nargs='?', help='book key from curricula.json')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--tracked', action='store_true',
                    help='only books with a "tracker" field. These derive their '
                         'chapter list from a status file, so regenerating them is '
                         'safe and idempotent. The hand-curated indexes (statistics, '
                         'time-series, ggplot2) carry prose this generator does not '
                         'reproduce, so they are never rewritten automatically.')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--list', action='store_true')
    args = ap.parse_args()

    books = load_books()
    if args.list:
        for b in books:
            n = sum(len(p.get('chapters', [])) for p in b.get('parts', []))
            print('  %-14s %-42s %3d chapters' % (b['key'], b['title'], n))
        return 0

    if args.tracked:
        targets = [b for b in books if b.get('tracker')]
        if not targets:
            print('No books declare a tracker; nothing to regenerate.')
            return 0
    elif args.all:
        targets = books
    elif args.key:
        targets = [b for b in books if b['key'] == args.key]
        if not targets:
            sys.exit('No book with key %r. Known: %s'
                     % (args.key, ', '.join(b['key'] for b in books)))
    else:
        sys.exit('Pass a book key, --all, or --list.')

    for b in targets:
        build_book(b, dry_run=args.dry_run)
    return 0


if __name__ == '__main__':
    sys.exit(main())

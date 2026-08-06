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


def load_hero_art(key):
    """Optional per-book SVG at _build/hero-art/<key>.svg. Missing art is fine:
    the hero simply collapses to a single column."""
    p = os.path.join(HERE, 'hero-art', '%s.svg' % key)
    if not os.path.exists(p):
        return ''
    with open(p, encoding='utf-8') as f:
        return f.read().strip()


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
    parts = [p for p in parts if p.get('chapters')]
    total = sum(len(p['chapters']) for p in parts)
    built = sum(1 for p in parts for c in p['chapters'] if c.get('_live'))
    first_live = next((c['_live'] for p in parts for c in p['chapters']
                       if c.get('_live')), '')

    scope = book.get('scope') or (book['key'].replace('-', '') + 'book')
    out = ['<div class="%s">' % e(scope)]

    # ---- hero ----------------------------------------------------------
    art = load_hero_art(book['key'])
    out.append('<header class="hero">')
    out.append('  <div>')
    out.append('    <div class="crumb"><a href="/tutorials/">Tutorials</a> / Books / %s</div>'
               % e(book.get('short') or book['title']))
    out.append('    <h1>%s</h1>' % e(book['title']))
    if book.get('tagline'):
        out.append('    <p class="lede">%s</p>' % e(book['tagline']))
    # Counts are derived, never asserted: "published" is what exists on disk.
    out.append('    <p class="meta"><b>%d</b> of <b>%d</b> chapters published, '
               'across <b>%d</b> parts. Every chapter runs R in your browser.</p>'
               % (built, total, len(parts)))
    if first_live:
        out.append('    <div class="cta-row">')
        out.append('      <a class="cta" href="%s">Start reading &rarr;</a>' % e(first_live))
        out.append('      <a class="cta2" href="/tutorials/">All books</a>')
        out.append('    </div>')
    out.append('  </div>')
    if art:
        out.append('  <div>%s</div>' % art)
    out.append('</header>')

    # ---- parts + rail --------------------------------------------------
    out.append('<div class="grid">')
    out.append('<main>')
    n = 0
    for i, part in enumerate(parts, 1):
        out.append('<section class="part" id="part-%d">' % i)
        out.append('  <div class="part-h"><span class="part-n">Part %d</span>'
                   '<h2>%s</h2></div>' % (i, e(part.get('title', ''))))
        out.append('  <div class="chs">')
        for c in part['chapters']:
            n += 1
            title, href = c.get('title', ''), c.get('_live', '')
            if href:
                out.append('    <a class="ch" href="%s"><span class="ch-n">%d</span>'
                           '<span class="ch-t">%s</span>'
                           '<span class="ch-go">&rarr;</span></a>'
                           % (e(href), n, e(title)))
            else:
                out.append('    <div class="ch ch-soon"><span class="ch-n">%d</span>'
                           '<span class="ch-t">%s</span>'
                           '<span class="ch-chip">Soon</span></div>' % (n, e(title)))
        out.append('  </div>')
        out.append('</section>')
    out.append('</main>')

    out.append('<aside class="rail">')
    pro = book.get('pro') or {}
    if pro.get('href') and pro.get('label'):
        out.append('  <div class="card pro">')
        out.append('    <h3>Prefer it guided?</h3>')
        if pro.get('blurb'):
            out.append('    <p>%s</p>' % e(pro['blurb']))
        out.append('    <a href="%s">%s &rarr;</a>' % (e(pro['href']), e(pro['label'])))
        out.append('  </div>')
    out.append('  <div class="card">')
    out.append('    <h3>The parts</h3>')
    out.append('    <p class="hub-sub">%d parts, %d chapters.</p>' % (len(parts), total))
    for i, part in enumerate(parts, 1):
        done = sum(1 for c in part['chapters'] if c.get('_live'))
        out.append('    <a class="hub" href="#part-%d"><span class="hub-t">%s</span>'
                   '<span class="hub-n">%d/%d</span></a>'
                   % (i, e(part.get('title', '')), done, len(part['chapters'])))
    out.append('  </div>')
    out.append('</aside>')
    out.append('</div>')
    out.append('</div>')

    return '\n'.join(out), built, total, len(parts)


# Deliberately mirrors the hand-built book indexes (tsbook / stbook / ggbook) so a
# generated book is indistinguishable from them. Only the scope class and the two
# accent colours change per book, which is why this is a template rather than a
# constant. Keep any edit here in step with those three pages.
CSS_TEMPLATE = """
.{s} {{ font-family: Inter, 'IBM Plex Sans', -apple-system, sans-serif; color: #41454d; }}
.{s} a {{ text-decoration: none; }}
.{s} .hero {{ display: grid; grid-template-columns: 1.05fr .95fr; gap: 40px; align-items: center; padding: 46px 0 38px; border-bottom: 1px solid #e7e4da; }}
.{s} .crumb {{ font-size: 13px; color: #6b7280; margin-bottom: 16px; }}
.{s} .crumb a {{ color: #6b7280; }} .{s} .crumb a:hover {{ color: #16181d; }}
.{s} h1 {{ font-family: 'Inter Tight', Inter, sans-serif; font-weight: 800; font-size: 42px; line-height: 1.08; letter-spacing: -.022em; color: #16181d; margin: 0; }}
.{s} .lede {{ font-size: 17px; line-height: 1.6; color: #41454d; max-width: 54ch; margin: 16px 0 6px; }}
.{s} .meta {{ font-size: 13.5px; color: #6b7280; margin: 12px 0 24px; }}
.{s} .meta b {{ color: #16181d; font-weight: 600; }}
.{s} .cta-row {{ display: flex; gap: 12px; flex-wrap: wrap; }}
.{s} .cta {{ background: {a}; color: #fff !important; font-weight: 600; font-size: 15px; border-radius: 11px; padding: 13px 24px; }}
.{s} .cta:hover {{ background: {ad}; }}
.{s} .cta2 {{ border: 1px solid #e2ded2; background: #fff; color: #16181d !important; font-weight: 600; font-size: 14.5px; border-radius: 11px; padding: 12px 20px; }}
.{s} .cta2:hover {{ border-color: #cfc9b8; }}
.{s} .hero-art {{ width: 100%; height: auto; }}
.{s} .grid {{ display: grid; grid-template-columns: 1fr 300px; gap: 44px; padding: 40px 0 70px; }}
.{s} .part {{ margin: 0 0 32px; scroll-margin-top: 86px; }}
.{s} .part-h {{ display: flex; align-items: baseline; gap: 14px; margin-bottom: 11px; }}
.{s} .part-n {{ font-size: 12.5px; font-weight: 600; color: #6b7280; white-space: nowrap; }}
.{s} .part-h h2 {{ font-family: 'Inter Tight', Inter, sans-serif; font-weight: 700; font-size: 21px; letter-spacing: -.012em; color: #16181d; margin: 0; border: 0; padding: 0; }}
.{s} .chs {{ background: #fff; border: 1px solid #e7e4da; border-radius: 14px; overflow: hidden; }}
.{s} .ch {{ display: flex; align-items: center; gap: 14px; padding: 11px 16px; border-top: 1px solid #f1eee5; font-size: 14.5px; }}
.{s} .chs > :first-child {{ border-top: 0; }}
.{s} a.ch:hover {{ background: #f7f6f1; }}
.{s} a.ch:hover .ch-go {{ opacity: 1; transform: none; }}
.{s} .ch-n {{ min-width: 26px; text-align: right; font-size: 12.5px; color: #b3ac97; }}
.{s} .ch-t {{ color: #16181d; font-weight: 500; }}
.{s} a.ch:hover .ch-t {{ color: {ad}; }}
.{s} .ch-go {{ margin-left: auto; color: {a}; opacity: 0; transform: translateX(-4px); transition: .15s; }}
.{s} .ch-soon .ch-t {{ color: #9aa0aa; font-weight: 450; }}
.{s} .ch-chip {{ margin-left: auto; font-size: 11.5px; font-weight: 600; color: #6b7280; background: #f2f3f5; border: 1px solid #e5e7ea; border-radius: 999px; padding: 2px 10px; white-space: nowrap; }}
.{s} .rail {{ position: sticky; top: 76px; align-self: start; display: flex; flex-direction: column; gap: 18px; }}
.{s} .card {{ background: #fff; border: 1px solid #e7e4da; border-radius: 14px; padding: 20px; }}
.{s} .card h3 {{ font-family: 'Inter Tight', Inter, sans-serif; font-weight: 700; font-size: 16.5px; color: #16181d; margin: 0 0 8px; }}
.{s} .card p {{ font-size: 13.5px; color: #6b7280; line-height: 1.55; margin: 0; }}
.{s} .hub-sub {{ margin: 0 0 8px !important; }}
.{s} .hub {{ display: flex; align-items: center; gap: 10px; padding: 8px; margin: 0 -8px; border-radius: 9px; }}
.{s} .hub:hover {{ background: #f6f4ec; }}
.{s} .hub-t {{ font-weight: 600; font-size: 13.5px; color: #16181d; line-height: 1.35; }}
.{s} .hub-n {{ margin-left: auto; font-size: 11.5px; font-weight: 600; color: {ad}; background: {ab}; border-radius: 999px; padding: 2px 9px; flex: none; }}
.{s} .card.pro {{ background: #0c0e12; border: 0; }}
.{s} .card.pro h3 {{ color: #fff; }}
.{s} .card.pro p {{ color: #9aa1ab; }}
.{s} .card.pro a {{ display: inline-block; margin-top: 12px; background: #e8cd8e; color: #171204 !important; font-weight: 700; font-size: 13.5px; border-radius: 9px; padding: 10px 16px; }}
.{s} .card.pro a:hover {{ background: #f0d89e; }}
@media (max-width: 900px) {{ .{s} .hero {{ grid-template-columns: 1fr; }} .{s} h1 {{ font-size: 32px; }} .{s} .grid {{ grid-template-columns: 1fr; }} .{s} .rail {{ position: static; }} }}
""".strip()


def book_css(book):
    scope = book.get('scope') or (book['key'].replace('-', '') + 'book')
    return CSS_TEMPLATE.format(
        s=scope,
        a=book.get('accent', '#1f7a55'),
        ad=book.get('accent_dark', '#17603f'),
        ab=book.get('accent_bg', '#eaf4ee'))


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
        page_css=book_css(book), sprite='', active='tutorials',
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

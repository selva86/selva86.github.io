#!/usr/bin/env python3
"""Auto-link injection for a single HTML fragment.

Thin wrapper around auto_link.py's core functions. Used by md2html.py
and sync_registries.py to inject auto-links at the fragment level
(so _posts/*.html fragments become the source of truth for auto-links).

Usage:
    from link_injector import inject_links_for_fragment, find_affected_fragments

    inject_links_for_fragment('_posts/R-Vectors.html', 'R-Vectors.html')

    affected = find_affected_fragments('_posts/', {'R vectors', 'c() function'})
"""

import json
import os
import re
from html import escape as html_escape

# Import from auto_link (same directory)
from auto_link import (
    load_links,
    build_skip_set,
    term_already_linked,
    inject_link_for_term,
    count_existing_auto_links,
)


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
POSTS_DIR = os.path.join(ROOT_DIR, '_posts')
LINKS_JSON = os.path.join(ROOT_DIR, 'www', 'links.json')


def strip_frontmatter(text):
    """Return (frontmatter_str, body) split. frontmatter_str includes delimiters."""
    m = re.match(r'^(---\s*\n.*?\n---\s*\n)(.*)$', text, re.DOTALL)
    if m:
        return m.group(1), m.group(2)
    return '', text


def has_manual_fr_marker(path):
    """True if the file at `path` opts out of auto FR refresh.

    Two opt-out mechanisms:
      1. frontmatter field `fr_manual: true` (fragments only)
      2. literal HTML comment `<!-- fr-manual -->` anywhere in the body
    """
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            text = f.read()
    except Exception:
        return False
    if '<!-- fr-manual -->' in text:
        return True
    fm, _ = strip_frontmatter(text)
    if fm and re.search(r'^\s*fr_manual:\s*true\s*$', fm, re.MULTILINE | re.IGNORECASE):
        return True
    return False


def inject_links_for_fragment(fragment_path, self_url, links_data=None, verbose=False, dry_run=False):
    """
    Read a _posts/*.html fragment, inject auto-links into its body
    (preserving frontmatter), write back.

    Args:
        fragment_path: path to _posts/<slug>.html
        self_url: the URL this fragment will become (e.g., 'R-Vectors.html')
                  used to prevent self-linking
        links_data: optional pre-loaded links.json content
        verbose: print debug info
        dry_run: if True, compute links but don't write file

    Returns:
        int: number of links added (or would be added in dry-run mode)
    """
    if links_data is None:
        links_data = load_links()

    config = links_data['config']
    max_links = config['max_links_per_page']
    skip_tags = config['skip_tags']
    skip_classes = config['skip_classes']

    # Read fragment
    try:
        with open(fragment_path, 'r', encoding='utf-8', errors='replace') as f:
            text = f.read()
    except Exception as e:
        if verbose:
            print(f"  SKIP {fragment_path}: cannot read ({e})")
        return 0

    # Split frontmatter from body
    frontmatter, body = strip_frontmatter(text)

    # Count existing auto-links in body (we modify body, not frontmatter)
    existing_count = count_existing_auto_links(body)
    if existing_count >= max_links:
        return 0

    # Build term entries (published only, sorted longest-first)
    published_links = [al for al in links_data['auto_links'] if al.get('status') == 'published']
    term_entries = []
    for al in published_links:
        for term in al['terms']:
            term_entries.append({
                'term': term,
                'url': al['url'],
                'title': al['title'],
                'case_sensitive': al.get('case_sensitive', False),
                'max_per_page': al.get('max_per_page', 1),
            })
    term_entries.sort(key=lambda x: len(x['term']), reverse=True)

    # Build skip ranges for the body
    skip_ranges = build_skip_set(body, skip_tags, skip_classes)

    links_added = 0
    # Initialize url_counts by scanning existing auto-links
    # This makes the function idempotent — re-running won't violate max_per_page
    url_counts = {}
    for m in re.finditer(r'<a\s+class="auto-link"\s+href="([^"]+)"', body):
        existing_url = m.group(1)
        url_counts[existing_url] = url_counts.get(existing_url, 0) + 1

    for entry in term_entries:
        if existing_count + links_added >= max_links:
            break

        url = entry['url']
        term = entry['term']

        # Don't self-link
        if url == self_url:
            continue

        # Check max_per_page for this URL
        if url_counts.get(url, 0) >= entry['max_per_page']:
            continue

        # Check if term is already linked anywhere in body
        if term_already_linked(body, term, entry['case_sensitive']):
            continue

        body, was_modified = inject_link_for_term(
            body, term, url, entry['title'],
            entry['case_sensitive'], skip_ranges
        )

        if was_modified:
            links_added += 1
            url_counts[url] = url_counts.get(url, 0) + 1
            # Rebuild skip ranges since body changed
            skip_ranges = build_skip_set(body, skip_tags, skip_classes)

    if links_added > 0 and not dry_run:
        # Write back fragment (frontmatter + modified body)
        with open(fragment_path, 'w', encoding='utf-8', newline='') as f:
            f.write(frontmatter + body)
        if verbose:
            print(f"  {os.path.basename(fragment_path)}: injected {links_added} auto-links")
    elif links_added > 0 and dry_run and verbose:
        print(f"  {os.path.basename(fragment_path)}: would inject {links_added} auto-links (dry-run)")

    return links_added


def find_affected_fragments(posts_dir, terms_set, case_insensitive=True):
    """
    Find _posts/*.html fragments whose body contains any term in terms_set.
    Returns list of fragment paths.

    Used after a registry change to identify which fragments need re-injection.
    """
    import glob
    if not terms_set:
        return []

    affected = []
    flags = re.IGNORECASE if case_insensitive else 0

    for fragment in glob.glob(os.path.join(posts_dir, '*.html')):
        try:
            with open(fragment, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception:
            continue
        # Strip frontmatter for the search
        _, body = strip_frontmatter(content)

        for term in terms_set:
            # Word-boundary match
            pattern = r'\b' + re.escape(term) + r'\b' if '(' not in term else re.escape(term)
            if re.search(pattern, body, flags):
                affected.append(fragment)
                break

    return affected


def strip_all_links_from_fragment(fragment_path):
    """Remove all auto-links from a fragment (for --reprocess scenarios)."""
    with open(fragment_path, 'r', encoding='utf-8') as f:
        text = f.read()
    frontmatter, body = strip_frontmatter(text)
    pattern = r'<a\s+class="auto-link"[^>]*>(.*?)</a>'
    new_body = re.sub(pattern, r'\1', body, flags=re.DOTALL)
    if new_body != body:
        with open(fragment_path, 'w', encoding='utf-8', newline='') as f:
            f.write(frontmatter + new_body)
        return True
    return False


def _strip_fr_from_text(text):
    """Remove any existing FR block from a string."""
    return re.sub(
        r'\s*<div id="auto-further-reading">.*?</ul>\s*</div>\s*',
        '\n',
        text,
        flags=re.DOTALL,
    )


def inject_fr_for_fragment(fragment_path, links_data=None, dry_run=False):
    """Inject/refresh the Further Reading section in a fragment.

    The FR block is appended to the end of the fragment body. If one
    already exists, it is stripped and rebuilt so the list stays in sync
    with the registry. Only published children are included. Returns
    True if the file was modified.
    """
    if links_data is None:
        links_data = load_links()

    fr_map = links_data.get('further_reading', {})
    parent_url = os.path.basename(fragment_path)
    items = fr_map.get(parent_url, [])
    published = [it for it in items if it.get('status') == 'published']

    with open(fragment_path, 'r', encoding='utf-8') as f:
        text = f.read()
    frontmatter, body = strip_frontmatter(text)

    # Strip any existing FR block
    new_body = _strip_fr_from_text(body)

    if published:
        # Build and append FR block (HTML-escaped titles/urls)
        lis = '\n'.join(
            f'<li><a href="{html_escape(it["url"], quote=True)}">'
            f'{html_escape(it["title"])}</a></li>'
            for it in published
        )
        fr_block = (
            '\n\n<div id="auto-further-reading">\n'
            '<h2>Further Reading</h2>\n'
            '<ul class="further-reading-list">\n'
            f'{lis}\n'
            '</ul>\n'
            '</div>\n'
        )
        new_body = new_body.rstrip() + fr_block

    if new_body == body:
        return False

    if not dry_run:
        with open(fragment_path, 'w', encoding='utf-8', newline='') as f:
            f.write(frontmatter + new_body)
    return True


def bulk_migrate_all_fragments(posts_dir=None, dry_run=False, verbose=True):
    """One-time migration: inject auto-links from links.json into every
    fragment in _posts/. Idempotent — re-runnable without creating duplicates.

    Returns (fragments_modified, total_links_added).
    """
    import glob
    if posts_dir is None:
        posts_dir = POSTS_DIR

    links_data = load_links()
    fragments = sorted(glob.glob(os.path.join(posts_dir, '*.html')))
    fragments_modified = 0
    total_added = 0
    fr_modified = 0

    for frag_path in fragments:
        self_url = os.path.basename(frag_path)
        added = inject_links_for_fragment(
            frag_path, self_url,
            links_data=links_data,
            verbose=False,
            dry_run=dry_run,
        )
        if added > 0:
            fragments_modified += 1
            total_added += added
            if verbose:
                print(f"  {self_url}: {added} links")

        # Refresh FR block from registry
        if inject_fr_for_fragment(frag_path, links_data=links_data, dry_run=dry_run):
            fr_modified += 1

    if verbose:
        print(f"  FR sections written: {fr_modified}")
    return fragments_modified, total_added


# ---------------------------------------------------------------------------
# CLI for manual testing
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python link_injector.py <fragment_path> [self_url] [--dry-run]")
        print("       python link_injector.py --strip <fragment_path>")
        print("       python link_injector.py --bulk-migrate [--dry-run]")
        sys.exit(1)

    if sys.argv[1] == '--bulk-migrate':
        dry_run = '--dry-run' in sys.argv
        print(f"Bulk-migrating auto-links into all fragments{' (dry-run)' if dry_run else ''}...")
        n_frags, n_links = bulk_migrate_all_fragments(dry_run=dry_run)
        verb = "Would modify" if dry_run else "Modified"
        print(f"\n{verb} {n_frags} fragments, {'would add' if dry_run else 'added'} {n_links} total links.")
        sys.exit(0)

    if sys.argv[1] == '--strip':
        fragment_path = sys.argv[2]
        if strip_all_links_from_fragment(fragment_path):
            print(f"Stripped auto-links from {fragment_path}")
        else:
            print(f"No auto-links in {fragment_path}")
        sys.exit(0)

    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry_run = '--dry-run' in sys.argv

    fragment_path = args[0]
    if len(args) > 1:
        self_url = args[1]
    else:
        # Derive from filename
        self_url = os.path.basename(fragment_path)

    added = inject_links_for_fragment(fragment_path, self_url, verbose=True, dry_run=dry_run)
    verb = "Would add" if dry_run else "Added"
    print(f"{verb} {added} auto-links to {fragment_path}")

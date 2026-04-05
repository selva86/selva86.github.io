#!/usr/bin/env python3
"""Sync all registries from _posts/ front matter.

Reads all _posts/*.html front matter and updates:
- www/sidebar.json (for post_type=C)
- www/links.json auto_links (for all posts with auto_link_terms)
- www/links.json further_reading (for post_type=FR/PSEO with fr_parent)
- curriculum-status.json (for posts with curriculum_id)

Usage:
    python _build/sync_registries.py           # Sync all
    python _build/sync_registries.py --dry-run  # Preview only
"""

import json, os, re, sys, datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
POSTS_DIR = os.path.join(REPO_ROOT, '_posts')
SIDEBAR_PATH = os.path.join(REPO_ROOT, 'www', 'sidebar.json')
LINKS_PATH = os.path.join(REPO_ROOT, 'www', 'links.json')
CURRICULUM_PATH = os.path.join(REPO_ROOT, 'curriculum-status.json')
PSEO_PATH = os.path.join(REPO_ROOT, 'www', 'programmatic-seo.json')


def parse_front_matter(filepath):
    """Parse front matter from _posts/ HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not match:
        return {}
    meta = {}
    for line in match.group(1).strip().split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            v = val.strip()
            # Remove YAML quotes
            if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                v = v[1:-1]
            meta[key.strip()] = v
    return meta


def sync_sidebar(posts, dry_run=False):
    """Add missing [C] posts to sidebar.json (per sidebar_section) and
    missing [EX] posts to the Practice Exercises section."""
    with open(SIDEBAR_PATH, 'r', encoding='utf-8') as f:
        sidebar = json.load(f)

    # Index existing entries by href
    existing = set()
    section_map = {}
    for section in sidebar:
        for item in section.get('items', []):
            existing.add(item['href'])
        section_map[section['title']] = section

    added = 0
    for post in posts:
        if post.get('post_type') != 'C':
            continue
        filename = post['filename']
        if filename in existing:
            continue
        section_name = post.get('sidebar_section', '')
        if not section_name:
            continue
        if section_name not in section_map:
            print(f'  WARN: sidebar section "{section_name}" not found, skipping {filename}')
            continue

        entry = {
            'href': filename,
            'text': post.get('sidebar_title', post.get('title', filename))
        }
        section_map[section_name]['items'].append(entry)
        existing.add(filename)
        added += 1

    # Add [EX] posts to the Practice Exercises section (appended in order found)
    EX_SECTION_NAME = 'Practice Exercises'
    ex_section = section_map.get(EX_SECTION_NAME)
    for post in posts:
        if post.get('post_type') != 'EX':
            continue
        filename = post['filename']
        if filename in existing:
            continue
        if ex_section is None:
            print(f'  WARN: "{EX_SECTION_NAME}" section not found, skipping {filename}')
            continue
        entry = {
            'href': filename,
            'text': post.get('sidebar_title', post.get('title', filename)),
        }
        ex_section['items'].append(entry)
        existing.add(filename)
        added += 1

    # Sort each section by sidebar_order where available
    for post in posts:
        if post.get('post_type') != 'C' or not post.get('sidebar_order'):
            continue
        section_name = post.get('sidebar_section', '')
        if section_name not in section_map:
            continue
        section = section_map[section_name]
        # Build order map from posts
        order_map = {}
        for p in posts:
            if p.get('sidebar_section') == section_name and p.get('sidebar_order'):
                try:
                    order_map[p['filename']] = int(p['sidebar_order'])
                except ValueError:
                    pass
        # Sort items: ordered items first (by order), then unordered items (preserve position)
        ordered = [i for i in section['items'] if i['href'] in order_map]
        unordered = [i for i in section['items'] if i['href'] not in order_map]
        ordered.sort(key=lambda i: order_map.get(i['href'], 999))
        section['items'] = ordered + unordered

    if not dry_run and added > 0:
        with open(SIDEBAR_PATH, 'w', encoding='utf-8') as f:
            json.dump(sidebar, f, indent=2, ensure_ascii=False)
            f.write('\n')

    return added


def sync_links_auto(posts, dry_run=False):
    """Add new auto_link entries AND merge terms into existing entries.

    Returns (added, updated, new_terms_set) where new_terms_set contains
    all terms that were newly added to the registry (for affected-fragment
    re-linking).
    """
    with open(LINKS_PATH, 'r', encoding='utf-8') as f:
        links = json.load(f)

    # Index existing entries by URL for lookup + mutation
    existing_index = {entry['url']: entry for entry in links['auto_links']}
    added = 0
    updated = 0
    new_terms_set = set()  # terms newly introduced to the registry (published only)

    for post in posts:
        terms_str = post.get('auto_link_terms', '')
        if not terms_str:
            continue
        filename = post['filename']

        new_terms = [t.strip() for t in terms_str.split('|') if t.strip()]
        if not new_terms:
            continue

        # Detect pipe-split corruption: a term with unbalanced parens
        # probably means a literal "|" inside what should have been one term.
        for t in new_terms:
            if t.count('(') != t.count(')'):
                print(f'  WARN: {filename} term "{t}" has unbalanced parens — possible "|" inside a term corrupted the split')

        if filename in existing_index:
            # MERGE: union existing terms with new ones (case-insensitive dedup)
            entry = existing_index[filename]
            existing_terms = entry['terms']
            existing_lc = {t.lower() for t in existing_terms}
            added_terms = [t for t in new_terms if t.lower() not in existing_lc]
            if added_terms:
                entry['terms'] = existing_terms + added_terms
                updated += 1
                if entry.get('status') == 'published':
                    new_terms_set.update(added_terms)
            continue

        # ADD new entry
        case_sensitive = post.get('auto_link_case_sensitive', 'false').lower() == 'true'
        links['auto_links'].append({
            'url': filename,
            'title': post.get('title', filename),
            'terms': new_terms,
            'case_sensitive': case_sensitive,
            'max_per_page': 1,
            'status': 'published'
        })
        existing_index[filename] = links['auto_links'][-1]
        added += 1
        new_terms_set.update(new_terms)

    # Also sync PSEO reserved terms
    if os.path.exists(PSEO_PATH):
        with open(PSEO_PATH, 'r', encoding='utf-8') as f:
            pseo = json.load(f)
        for series in pseo.get('series', []):
            for p in series.get('posts', []):
                # Check if already in links
                terms = p.get('auto_link_terms', [])
                url = p.get('url') or (p.get('id', '').replace('pseo-', '') + '.html')
                if url in existing_index:
                    continue
                if not terms:
                    continue
                status = p.get('status', 'not_published')
                links['auto_links'].append({
                    'url': url,
                    'title': p.get('title', ''),
                    'terms': terms,
                    'case_sensitive': p.get('case_sensitive', True),
                    'max_per_page': 1,
                    'status': status
                })
                existing_index[url] = links['auto_links'][-1]
                added += 1
                if status == 'published':
                    new_terms_set.update(terms)

    if not dry_run and (added > 0 or updated > 0):
        with open(LINKS_PATH, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
            f.write('\n')

    return added, updated, new_terms_set, links


def reinject_affected_fragments(new_terms_set, links_data=None, dry_run=False, verbose=False):
    """After registry changes, re-run link injection on _posts fragments
    that mention any of the newly-added terms. Returns count of fragments
    that gained new links.

    Only scans fragments whose body contains at least one new term
    (keeps the scope small). Injection is idempotent — fragments already
    at max_per_page for a URL won't gain duplicates.
    """
    if not new_terms_set:
        return 0

    # Import here to avoid circular import at module load
    from link_injector import find_affected_fragments, inject_links_for_fragment
    from auto_link import load_links

    affected = find_affected_fragments(POSTS_DIR, new_terms_set, case_insensitive=True)
    if not affected:
        return 0

    # Use the passed in-memory links_data (reflects pending changes),
    # or fall back to loading from disk (if called standalone).
    if links_data is None:
        links_data = load_links()

    re_injected = 0
    for frag_path in affected:
        self_url = os.path.basename(frag_path)
        added = inject_links_for_fragment(
            frag_path, self_url,
            links_data=links_data,
            verbose=verbose,
            dry_run=dry_run,
        )
        if added > 0:
            re_injected += 1

    return re_injected


def sync_links_fr(posts, dry_run=False):
    """Add/update further_reading entries for FR/PSEO posts."""
    with open(LINKS_PATH, 'r', encoding='utf-8') as f:
        links = json.load(f)

    if 'further_reading' not in links:
        links['further_reading'] = {}

    added = 0
    for post in posts:
        post_type = post.get('post_type', '')
        if post_type not in ('FR', 'PSEO'):
            continue
        fr_parent_str = post.get('fr_parent', '')
        if not fr_parent_str:
            continue

        parents = [p.strip() for p in fr_parent_str.split('|') if p.strip()]
        filename = post['filename']
        curriculum_id = post.get('curriculum_id', '')

        for parent in parents:
            # Verify fr_parent target exists as fragment or legacy root
            parent_frag = os.path.join(POSTS_DIR, parent)
            parent_root = os.path.join(REPO_ROOT, parent)
            if not os.path.exists(parent_frag) and not os.path.exists(parent_root):
                print(f'  WARN: {filename} fr_parent "{parent}" not found (no fragment or legacy root) — FR link will be dangling')

            if parent not in links['further_reading']:
                links['further_reading'][parent] = []

            # Check if already exists
            fr_list = links['further_reading'][parent]
            found = False
            for entry in fr_list:
                if entry.get('url') == filename or entry.get('curriculum_id') == curriculum_id:
                    # Update existing entry
                    entry['url'] = filename
                    entry['status'] = 'published'
                    entry['title'] = post.get('title', filename)
                    found = True
                    break

            if not found:
                fr_list.append({
                    'curriculum_id': curriculum_id or post.get('filename', ''),
                    'url': filename,
                    'title': post.get('title', filename),
                    'status': 'published'
                })
                added += 1

    if not dry_run and added > 0:
        with open(LINKS_PATH, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
            f.write('\n')

    return added


def sync_curriculum(posts, dry_run=False):
    """Mark published posts in curriculum-status.json."""
    if not os.path.exists(CURRICULUM_PATH):
        return 0

    with open(CURRICULUM_PATH, 'r', encoding='utf-8') as f:
        curriculum = json.load(f)

    today = datetime.date.today().isoformat()
    updated = 0

    # Build lookup of curriculum_id -> post data
    post_by_id = {}
    for post in posts:
        cid = post.get('curriculum_id')
        if cid and cid != 'None' and cid != 'null':
            post_by_id[cid] = post

    for path, pdata in curriculum.get('paths', {}).items():
        for sp, spdata in pdata.get('sub_paths', {}).items():
            for entry in spdata.get('posts', []):
                eid = entry.get('id', '')
                if eid in post_by_id and entry.get('status') != 'published':
                    post = post_by_id[eid]
                    entry['status'] = 'published'
                    entry['slug'] = post['filename'].replace('.html', '')
                    entry['url'] = '/' + post['filename']
                    entry['published_date'] = post.get('published_date', today)
                    entry['in_sidebar'] = post.get('post_type') == 'C'
                    updated += 1

    if not dry_run and updated > 0:
        with open(CURRICULUM_PATH, 'w', encoding='utf-8') as f:
            json.dump(curriculum, f, indent=2, ensure_ascii=False)
            f.write('\n')

    return updated


def main():
    dry_run = '--dry-run' in sys.argv

    if not os.path.exists(POSTS_DIR):
        print('No _posts/ directory found.')
        return

    # Read all _posts/ front matter
    posts = []
    for f in sorted(os.listdir(POSTS_DIR)):
        if f.endswith('.html'):
            meta = parse_front_matter(os.path.join(POSTS_DIR, f))
            meta['filename'] = f
            posts.append(meta)

    print(f'Found {len(posts)} posts in _posts/')

    # Validate required frontmatter fields by post_type (warn on missing)
    required = {
        'C': ['title', 'sidebar_section'],
        'EX': ['title', 'sidebar_title', 'fr_parent'],
        'FR': ['title', 'fr_parent'],
        'PSEO': ['title', 'fr_parent'],
    }
    warnings = 0
    for post in posts:
        pt = post.get('post_type')
        if pt not in required:
            continue
        missing = [f for f in required[pt] if not post.get(f)]
        if missing:
            print(f'  WARN: {post["filename"]} [{pt}] missing: {", ".join(missing)}')
            warnings += 1
    if warnings:
        print(f'  ({warnings} posts have missing required fields — registry sync may be incomplete)')
    print()

    sidebar_added = sync_sidebar(posts, dry_run)
    auto_added, auto_updated, new_terms_set, links_data = sync_links_auto(posts, dry_run)
    fr_added = sync_links_fr(posts, dry_run)
    curriculum_updated = sync_curriculum(posts, dry_run)

    # Re-inject auto-links into affected fragments whenever new terms
    # were introduced (new entries or merged terms). This keeps _posts/
    # fragments as the source of truth for links.
    re_injected = reinject_affected_fragments(new_terms_set, links_data=links_data, dry_run=dry_run)

    print(f'\nSummary:')
    print(f'  Sidebar:    {sidebar_added} entries added')
    print(f'  Auto-links: {auto_added} added, {auto_updated} merged')
    print(f'  Further Reading: {fr_added} entries added/updated')
    print(f'  Curriculum: {curriculum_updated} posts marked published')
    print(f'  Re-linked fragments: {re_injected}')

    if dry_run:
        print('\n(Dry run — no files modified)')
    else:
        total = sidebar_added + auto_added + auto_updated + fr_added + curriculum_updated + re_injected
        if total == 0:
            print('\nAll registries already in sync.')
        else:
            print(f'\n{total} total changes made.')


if __name__ == '__main__':
    main()

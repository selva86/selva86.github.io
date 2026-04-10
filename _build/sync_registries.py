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
PENDING_REFRESH_PATH = os.path.join(SCRIPT_DIR, '.fr_refresh_pending.json')


def _load_pending_parents():
    """Load any parents left unrefreshed by a prior crashed sync run."""
    if not os.path.exists(PENDING_REFRESH_PATH):
        return set()
    try:
        with open(PENDING_REFRESH_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return set(data)
    except Exception:
        pass
    return set()


def _write_pending_parents(parents):
    try:
        with open(PENDING_REFRESH_PATH, 'w', encoding='utf-8') as f:
            json.dump(sorted(parents), f, indent=2)
            f.write('\n')
    except Exception as e:
        print(f'  WARN: could not write pending-refresh state: {e}')


def _clear_pending_parents():
    if os.path.exists(PENDING_REFRESH_PATH):
        try:
            os.remove(PENDING_REFRESH_PATH)
        except Exception:
            pass


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
            if item.get('divider'):
                continue
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
        ordered = [i for i in section['items'] if not i.get('divider') and i['href'] in order_map]
        unordered = [i for i in section['items'] if i.get('divider') or i['href'] not in order_map]
        ordered.sort(key=lambda i: order_map.get(i['href'], 999))
        section['items'] = ordered + unordered

    if not dry_run and added > 0:
        with open(SIDEBAR_PATH, 'w', encoding='utf-8') as f:
            json.dump(sidebar, f, indent=2, ensure_ascii=False)
            f.write('\n')

    return added


def sync_links_auto(posts, links_data, dry_run=False):
    """Add new auto_link entries AND merge terms into existing entries.

    Mutates `links_data` in place. Returns (added, updated, new_terms_set)
    where new_terms_set contains all terms that were newly added to the
    registry (for affected-fragment re-linking).
    """
    links = links_data

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

    return added, updated, new_terms_set


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


def sync_links_fr(posts, links_data, dry_run=False):
    """Add/update further_reading entries for FR/PSEO posts.

    Mutates `links_data` in place. Returns (added, affected_parents) where
    affected_parents contains every parent whose entry for this child was
    newly added or whose observable fields (url/status/title) changed —
    these are the parents whose HTML FR block must be regenerated.
    """
    links = links_data
    fr = links.setdefault('further_reading', {})

    added = 0
    affected_parents = set()

    for post in posts:
        post_type = post.get('post_type', '')
        if post_type not in ('FR', 'EX', 'PSEO'):
            continue
        fr_parent_str = post.get('fr_parent', '')
        if not fr_parent_str:
            continue

        parents = [p.strip() for p in fr_parent_str.split('|') if p.strip()]
        filename = post['filename']
        curriculum_id = post.get('curriculum_id', '')
        new_title = post.get('title', filename)

        for parent in parents:
            # Verify fr_parent target exists as fragment or legacy root.
            # Orphaned parents (neither present) are skipped entirely —
            # don't pollute the registry, don't schedule a refresh.
            parent_frag = os.path.join(POSTS_DIR, parent)
            parent_root = os.path.join(REPO_ROOT, parent)
            if not os.path.exists(parent_frag) and not os.path.exists(parent_root):
                print(f'  WARN: {filename} fr_parent "{parent}" not found — orphaned FR, skipping')
                continue

            fr_list = fr.setdefault(parent, [])

            # Find existing entry: prefer url match, fall back to curriculum_id
            existing = None
            for entry in fr_list:
                if entry.get('url') == filename:
                    existing = entry
                    break
            if existing is None and curriculum_id:
                for entry in fr_list:
                    if entry.get('curriculum_id') == curriculum_id:
                        existing = entry
                        break

            if existing is None:
                fr_list.append({
                    'curriculum_id': curriculum_id or filename,
                    'url': filename,
                    'title': new_title,
                    'status': 'published',
                })
                added += 1
                affected_parents.add(parent)
                continue

            # Update path: capture pre-values, mutate, compare
            before = (
                existing.get('url'),
                existing.get('status'),
                existing.get('title'),
            )
            existing['url'] = filename
            existing['status'] = 'published'
            existing['title'] = new_title
            after = (existing['url'], existing['status'], existing['title'])
            if before != after:
                affected_parents.add(parent)

    return added, affected_parents


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


def refresh_fr_parent_fragments(affected_parents, links_data, dry_run=False):
    """Refresh Further Reading blocks on every affected parent.

    Fragment parents get `inject_fr_for_fragment` (strip + rebuild).
    Legacy root-only parents get `refresh_fr_section_in_root`.
    Parents with a manual-curation marker are skipped.

    Returns (frag_count, legacy_count, skipped_manual, errors).
    `errors` is a list of (parent, message) tuples.
    """
    from link_injector import inject_fr_for_fragment, has_manual_fr_marker

    frag_count = 0
    legacy_parents = []
    skipped_manual = 0
    errors = []

    for parent in sorted(affected_parents):
        frag_path = os.path.join(POSTS_DIR, parent)
        root_path = os.path.join(REPO_ROOT, parent)

        if os.path.exists(frag_path):
            try:
                if has_manual_fr_marker(frag_path):
                    skipped_manual += 1
                    print(f'  SKIP {parent}: fr_manual marker present')
                    continue
                if inject_fr_for_fragment(frag_path, links_data=links_data, dry_run=dry_run):
                    frag_count += 1
            except Exception as e:
                errors.append((parent, str(e)))
                print(f'  ERROR refreshing fragment {parent}: {e}')
            continue

        if os.path.exists(root_path):
            legacy_parents.append(parent)
            continue

        print(f'  WARN: FR parent "{parent}" has no fragment and no root HTML')

    # Legacy root-only parents
    legacy_count = 0
    if legacy_parents:
        from auto_link import refresh_fr_section_in_root
        for parent in legacy_parents:
            root_path = os.path.join(REPO_ROOT, parent)
            try:
                if has_manual_fr_marker(root_path):
                    skipped_manual += 1
                    print(f'  SKIP {parent}: fr_manual marker present (legacy)')
                    continue
                result = refresh_fr_section_in_root(root_path, links_data, dry_run=dry_run)
                if result == 'ok':
                    legacy_count += 1
                elif result == 'no-insertion-point':
                    print(f'  WARN: {parent}: could not locate FR insertion point — skipped')
                # 'unchanged' is silent
            except Exception as e:
                errors.append((parent, str(e)))
                print(f'  ERROR refreshing legacy root {parent}: {e}')

    return frag_count, legacy_count, skipped_manual, errors


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    force_refresh_all = '--refresh-all-fr' in args

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

    # Single load of links.json — both sync functions mutate in place
    with open(LINKS_PATH, 'r', encoding='utf-8') as f:
        links_data = json.load(f)

    sidebar_added = sync_sidebar(posts, dry_run)
    auto_added, auto_updated, new_terms_set = sync_links_auto(posts, links_data, dry_run)
    fr_added, affected_parents = sync_links_fr(posts, links_data, dry_run)
    curriculum_updated = sync_curriculum(posts, dry_run)

    # Resume any parents left unrefreshed by a prior crashed run
    pending = _load_pending_parents()
    if pending:
        print(f'  Resuming {len(pending)} parent(s) from prior incomplete sync')
        affected_parents |= pending

    # Force-refresh every registered parent (one-time backfill tool)
    if force_refresh_all:
        all_parents = set(links_data.get('further_reading', {}).keys())
        affected_parents |= all_parents
        print(f'  --refresh-all-fr: scheduling {len(all_parents)} registered parent(s)')

    # Persist links.json FIRST so fragment refresh operates on a stable state
    links_changed = bool(auto_added or auto_updated or fr_added)
    if not dry_run and links_changed:
        with open(LINKS_PATH, 'w', encoding='utf-8') as f:
            json.dump(links_data, f, indent=2, ensure_ascii=False)
            f.write('\n')

    # Record pending state BEFORE refresh starts so a crash can resume
    if not dry_run and affected_parents:
        _write_pending_parents(affected_parents)

    # Refresh FR blocks on affected parents
    frag_count, legacy_count, skipped_manual, errors = refresh_fr_parent_fragments(
        affected_parents, links_data, dry_run=dry_run
    )

    # Re-inject auto-links into affected fragments whenever new terms
    # were introduced (new entries or merged terms).
    re_injected = reinject_affected_fragments(
        new_terms_set, links_data=links_data, dry_run=dry_run
    )

    # Clear pending state only on clean completion
    if not dry_run and not errors:
        _clear_pending_parents()

    print(f'\nSummary:')
    print(f'  Sidebar:             {sidebar_added} entries added')
    print(f'  Auto-links:          {auto_added} added, {auto_updated} merged')
    print(f'  FR registry:         {fr_added} entries added/updated')
    print(f'  FR fragments:        {frag_count} refreshed')
    print(f'  FR legacy roots:     {legacy_count} refreshed')
    print(f'  FR manual-skipped:   {skipped_manual}')
    print(f'  Re-linked fragments: {re_injected}')
    print(f'  Curriculum:          {curriculum_updated} posts marked published')

    if errors:
        print(f'\n  ERRORS: {len(errors)} parent(s) failed to refresh — pending state retained for retry')
        for parent, msg in errors:
            print(f'    {parent}: {msg}')

    if dry_run:
        print('\n(Dry run — no files modified)')
    elif errors:
        sys.exit(2)
    else:
        total = (sidebar_added + auto_added + auto_updated + fr_added
                 + curriculum_updated + frag_count + legacy_count + re_injected)
        if total == 0:
            print('\nAll registries already in sync.')
        else:
            print(f'\n{total} total changes made.')


if __name__ == '__main__':
    main()

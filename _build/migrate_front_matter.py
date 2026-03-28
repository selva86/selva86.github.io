#!/usr/bin/env python3
"""
One-time migration script: adds new front matter fields to all _posts/*.html files.

New fields added (after existing fields, before closing ---):
  curriculum_id, post_type, auto_link_terms, auto_link_case_sensitive,
  sidebar_section, sidebar_title, sidebar_order

Values are derived from:
  - www/sidebar.json       -> sidebar_section, sidebar_title, sidebar_order
  - www/links.json         -> auto_link_terms, auto_link_case_sensitive
  - curriculum-status.json -> curriculum_id
"""

import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(REPO_ROOT, '_posts')
SIDEBAR_PATH = os.path.join(REPO_ROOT, 'www', 'sidebar.json')
LINKS_PATH = os.path.join(REPO_ROOT, 'www', 'links.json')
CURRICULUM_PATH = os.path.join(REPO_ROOT, 'curriculum-status.json')


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def build_sidebar_map(sidebar):
    """Map filename -> {section, title, order}."""
    mapping = {}
    for section in sidebar:
        section_title = section['title']
        for idx, item in enumerate(section['items'], start=1):
            href = item['href']
            mapping[href] = {
                'section': section_title,
                'title': item['text'],
                'order': idx,
            }
    return mapping


def build_auto_links_map(links):
    """Map filename -> {terms: [...], case_sensitive: bool}."""
    mapping = {}
    for entry in links.get('auto_links', []):
        url = entry['url']
        mapping[url] = {
            'terms': entry.get('terms', []),
            'case_sensitive': entry.get('case_sensitive', False),
        }
    return mapping


def build_curriculum_map(curriculum):
    """Map slug -> curriculum_id for published posts."""
    mapping = {}
    for path_key, path_data in curriculum.get('paths', {}).items():
        for sp_key, sp_data in path_data.get('sub_paths', {}).items():
            for post in sp_data.get('posts', []):
                slug = post.get('slug')
                if slug and post.get('status') == 'published':
                    mapping[slug] = post['id']
    return mapping


def parse_front_matter(filepath):
    """Return (front_matter_lines, body) where front_matter_lines excludes the --- delimiters."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    if not content.startswith('---'):
        return None, content

    # Find the closing ---
    end = content.index('---', 3)
    fm_block = content[3:end].strip()
    body = content[end + 3:]  # after closing ---

    lines = fm_block.split('\n')
    return lines, body


def has_field(lines, field_name):
    """Check if front matter already has a given field."""
    for line in lines:
        if line.startswith(field_name + ':'):
            return True
    return False


def migrate_file(filepath, sidebar_map, auto_links_map, curriculum_map):
    """Add new front matter fields to a single _posts file. Returns True if modified."""
    filename = os.path.basename(filepath)
    fm_lines, body = parse_front_matter(filepath)

    if fm_lines is None:
        print(f'  SKIP {filename}: no front matter found')
        return False

    # Check if already migrated
    if has_field(fm_lines, 'post_type'):
        print(f'  SKIP {filename}: already migrated')
        return False

    # Determine values
    slug = filename.replace('.html', '')

    # curriculum_id
    curriculum_id = curriculum_map.get(slug)

    # post_type — all current posts are Core
    post_type = 'C'

    # auto_link_terms and case_sensitive
    auto_info = auto_links_map.get(filename, {})
    auto_terms = auto_info.get('terms', [])
    case_sensitive = auto_info.get('case_sensitive', False)

    # sidebar info
    sidebar_info = sidebar_map.get(filename, {})
    sidebar_section = sidebar_info.get('section', '')
    sidebar_title = sidebar_info.get('title', '')
    sidebar_order = sidebar_info.get('order', '')

    # Build new fields
    new_fields = []
    new_fields.append(f'curriculum_id: {curriculum_id if curriculum_id else "null"}')
    new_fields.append(f'post_type: {post_type}')
    if auto_terms:
        new_fields.append(f'auto_link_terms: {"|".join(auto_terms)}')
    else:
        new_fields.append('auto_link_terms:')
    new_fields.append(f'auto_link_case_sensitive: {"true" if case_sensitive else "false"}')
    if sidebar_section:
        new_fields.append(f'sidebar_section: {sidebar_section}')
    else:
        new_fields.append('sidebar_section:')
    if sidebar_title:
        new_fields.append(f'sidebar_title: {sidebar_title}')
    else:
        new_fields.append('sidebar_title:')
    if sidebar_order:
        new_fields.append(f'sidebar_order: {sidebar_order}')
    else:
        new_fields.append('sidebar_order:')

    # Reconstruct front matter
    all_lines = fm_lines + new_fields
    new_content = '---\n' + '\n'.join(all_lines) + '\n---' + body

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f'  OK   {filename}: curriculum_id={curriculum_id}, sidebar={sidebar_section}/{sidebar_order}')
    return True


def main():
    print('Loading registries...')
    sidebar = load_json(SIDEBAR_PATH)
    links = load_json(LINKS_PATH)
    curriculum = load_json(CURRICULUM_PATH)

    sidebar_map = build_sidebar_map(sidebar)
    auto_links_map = build_auto_links_map(links)
    curriculum_map = build_curriculum_map(curriculum)

    print(f'  Sidebar entries: {len(sidebar_map)}')
    print(f'  Auto-link entries: {len(auto_links_map)}')
    print(f'  Curriculum published: {len(curriculum_map)}')

    # Process all _posts
    files = sorted(f for f in os.listdir(POSTS_DIR) if f.endswith('.html'))
    print(f'\nMigrating {len(files)} _posts files...\n')

    modified = 0
    for f in files:
        path = os.path.join(POSTS_DIR, f)
        if migrate_file(path, sidebar_map, auto_links_map, curriculum_map):
            modified += 1

    print(f'\nDone: {modified}/{len(files)} files modified')


if __name__ == '__main__':
    main()

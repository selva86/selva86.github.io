#!/usr/bin/env python3
"""Fix SEO issues in legacy HTML pages (those not managed by build.py).

Usage:
    python _build/fix_legacy_seo.py --dry-run   # Preview changes
    python _build/fix_legacy_seo.py              # Apply changes
"""

import json
import os
import re
import sys
import shutil

# Files managed by build.py (skip these)
SKIP_FILES = {'temp.html'}

# New posts built from _posts/ — detect by checking if _posts/<name> exists
POSTS_DIR = '_posts'

# Root directory
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DRY_RUN = '--dry-run' in sys.argv

# Load custom descriptions if available
DESCRIPTIONS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'legacy-descriptions.json')
CUSTOM_DESCRIPTIONS = {}
if os.path.exists(DESCRIPTIONS_PATH):
    with open(DESCRIPTIONS_PATH, 'r', encoding='utf-8') as f:
        CUSTOM_DESCRIPTIONS = json.load(f)


def get_legacy_files():
    """Return list of legacy HTML files in root (not managed by build.py)."""
    post_names = set()
    posts_dir = os.path.join(ROOT, POSTS_DIR)
    if os.path.isdir(posts_dir):
        for f in os.listdir(posts_dir):
            if f.endswith('.html'):
                post_names.add(f)

    legacy = []
    for f in sorted(os.listdir(ROOT)):
        if not f.endswith('.html'):
            continue
        if f in SKIP_FILES or f in post_names:
            continue
        legacy.append(f)
    return legacy


def extract_title(html):
    """Extract <title> content."""
    m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    return m.group(1).strip() if m else ''


def extract_description(html):
    """Extract meta description content."""
    m = re.search(r'<meta\s+name="Description"\s+content="([^"]*)"', html, re.IGNORECASE)
    return m.group(1).strip() if m else ''


def fix_html(filename, html):
    """Apply SEO fixes. Returns (modified_html, list_of_changes)."""
    changes = []
    out = html

    # 1. <html> -> <html lang="en">
    if '<html lang=' not in out:
        out = out.replace('<html>', '<html lang="en">', 1)
        if '<html lang="en">' in out:
            changes.append('Added lang="en"')

    # 2. Fix http:// -> https:// for known patterns
    replacements = [
        ("http://fonts.googleapis.com/", "https://fonts.googleapis.com/"),
        ("http://google.com/search", "https://google.com/search"),
        ("http://r-statistics.co", "https://r-statistics.co"),
        ("http://creativecommons.org/", "https://creativecommons.org/"),
    ]
    for old, new in replacements:
        if old in out:
            count = out.count(old)
            out = out.replace(old, new)
            changes.append(f'Fixed {old} -> {new} ({count}x)')

    # 3. Add canonical tag after viewport meta (skip if already present)
    if 'rel="canonical"' not in out:
        canonical = f'    <link rel="canonical" href="https://r-statistics.co/{filename}">'
        # Insert after the favicon link line
        out = out.replace(
            '<link rel="shortcut icon" href="/screenshots/iconb-64.png" type="image/x-icon" />',
            '<link rel="shortcut icon" href="/screenshots/iconb-64.png" type="image/x-icon" />\n' + canonical,
            1
        )
        if 'rel="canonical"' in out:
            changes.append('Added canonical tag')

    # 4. Update CSS version v=4 -> v=8
    if 'css/main.css?v=4' in out:
        out = out.replace('css/main.css?v=4', 'css/main.css?v=8')
        changes.append('Bumped CSS version v=4 -> v=8')

    # 5. Add OG tags after meta description (skip if already present)
    if 'og:title' not in out:
        title = extract_title(out)
        desc = extract_description(out)
        title_escaped = title.replace('"', '&quot;')
        desc_escaped = desc.replace('"', '&quot;')

        og_block = f'''    <!-- Open Graph -->
    <meta property="og:title" content="{title_escaped}">
    <meta property="og:description" content="{desc_escaped}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://r-statistics.co/{filename}">
    <meta property="og:site_name" content="r-statistics.co">
    <meta property="og:image" content="https://r-statistics.co/screenshots/iconb-64.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{title_escaped}">
    <meta name="twitter:description" content="{desc_escaped}">'''

        # Insert after the Robots meta tag
        anchor = '<meta name="Robots" content="index, follow">'
        if anchor in out:
            out = out.replace(anchor, anchor + '\n' + og_block, 1)
            changes.append('Added OG + Twitter Card tags')

    # 6. Add JSON-LD Article structured data (skip if already present)
    if 'application/ld+json' not in out and filename not in ('404.html', 'index.html'):
        title = extract_title(out)
        desc = extract_description(out)
        title_json = title.replace('\\', '\\\\').replace('"', '\\"')
        desc_json = desc.replace('\\', '\\\\').replace('"', '\\"')

        jsonld = f'''    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "{title_json}",
      "description": "{desc_json}",
      "author": {{"@type": "Person", "name": "Selva Prabhakaran"}},
      "publisher": {{"@type": "Organization", "name": "r-statistics.co"}},
      "url": "https://r-statistics.co/{filename}"
    }}
    </script>'''

        # Insert before </head>
        out = out.replace('</head>', jsonld + '\n  </head>', 1)
        if 'application/ld+json' in out:
            changes.append('Added JSON-LD Article schema')

    # For index.html, add WebSite schema instead of Article
    if 'application/ld+json' not in out and filename == 'index.html':
        jsonld_site = '''    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "r-statistics.co",
      "url": "https://r-statistics.co/",
      "description": "R programming tutorials for advanced statistics, machine learning, and data visualization.",
      "author": {"@type": "Person", "name": "Selva Prabhakaran"}
    }
    </script>'''
        out = out.replace('</head>', jsonld_site + '\n  </head>', 1)
        if 'application/ld+json' in out:
            changes.append('Added JSON-LD WebSite schema')

    # 8. Update meta description + OG/Twitter descriptions from legacy-descriptions.json
    if filename in CUSTOM_DESCRIPTIONS:
        new_desc = CUSTOM_DESCRIPTIONS[filename]
        old_desc = extract_description(out)
        if old_desc and old_desc != new_desc:
            # Update meta Description
            out = out.replace(
                f'<meta name="Description" content="{old_desc}">',
                f'<meta name="Description" content="{new_desc}">'
            )
            # Update OG description
            old_escaped = old_desc.replace('"', '&quot;')
            new_escaped = new_desc.replace('"', '&quot;')
            out = out.replace(
                f'<meta property="og:description" content="{old_escaped}">',
                f'<meta property="og:description" content="{new_escaped}">'
            )
            # Update Twitter description
            out = out.replace(
                f'<meta name="twitter:description" content="{old_escaped}">',
                f'<meta name="twitter:description" content="{new_escaped}">'
            )
            changes.append(f'Updated meta description to unique text')

    return out, changes


def main():
    os.chdir(ROOT)
    files = get_legacy_files()
    print(f"Found {len(files)} legacy HTML files\n")

    total_changes = 0
    for fname in files:
        filepath = os.path.join(ROOT, fname)
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        modified, changes = fix_html(fname, original)

        if not changes:
            continue

        total_changes += len(changes)
        print(f"  {fname}:")
        for c in changes:
            print(f"    + {c}")

        if not DRY_RUN and modified != original:
            # Backup
            backup_dir = os.path.join(ROOT, '_backup')
            os.makedirs(backup_dir, exist_ok=True)
            shutil.copy2(filepath, os.path.join(backup_dir, fname))
            # Write
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified)

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Total: {total_changes} changes across {len(files)} files")


if __name__ == '__main__':
    main()

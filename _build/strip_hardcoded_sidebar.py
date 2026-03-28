#!/usr/bin/env python3
"""Replace hardcoded sidebar content with empty #sidebar-nav container (toc.js loads it dynamically)."""

import glob
import re

files = glob.glob('*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if 'id="sidebar-nav"' not in content:
        continue

    # Skip if already stripped (contains the "Loaded dynamically" comment)
    if 'Loaded dynamically' in content:
        continue

    original = content

    # Match the entire sidebar-nav div contents and replace with empty container
    pattern = r'(<div id="sidebar-nav">)\s*<ul class="sidebar-menu.*?</div>\s*(</div>)'
    replacement = r'\1\n            <!-- Loaded dynamically from www/sidebar.json by toc.js -->\n          \2'

    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        updated += 1

print(f'Stripped hardcoded sidebar from {updated} files.')

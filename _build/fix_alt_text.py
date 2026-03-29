#!/usr/bin/env python3
"""Add alt text to images missing it in HTML files.

Generates descriptive alt text from image filenames.

Usage:
    python _build/fix_alt_text.py --dry-run   # Preview
    python _build/fix_alt_text.py              # Apply
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY_RUN = '--dry-run' in sys.argv


def filename_to_alt(src, page_title=''):
    """Convert image filename to descriptive alt text."""
    # Extract just the filename without extension
    basename = os.path.splitext(os.path.basename(src))[0]

    # Special case: ggplot2 cheatsheet images (gg_cs_N)
    if re.match(r'gg_cs_\d+', basename):
        return f"ggplot2 cheatsheet example plot {basename.split('_')[-1]}"

    # Replace hyphens, underscores with spaces
    text = basename.replace('-', ' ').replace('_', ' ')

    # Clean up common prefixes
    text = re.sub(r'^(screenshots?|figures?|images?)\s+', '', text, flags=re.IGNORECASE)

    # Remove trailing numbers that are just indices (e.g., "plot 1")
    # but keep meaningful numbers
    text = re.sub(r'\s+\d+$', '', text)

    # Title case
    text = text.strip().title()

    # Add "in R" context if the page title mentions R and alt doesn't
    if not text:
        text = f"Illustration from {page_title}" if page_title else "Tutorial illustration"

    return text


def fix_file(filepath):
    """Add alt text to images missing it. Returns (new_content, count)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get page title for context
    title_match = re.search(r'<title>(.*?)</title>', content)
    page_title = title_match.group(1).strip() if title_match else ''

    count = 0

    def add_alt(match):
        nonlocal count
        tag = match.group(0)
        if 'alt=' in tag.lower():
            return tag  # Already has alt

        # Extract src
        src_match = re.search(r"src=['\"]([^'\"]+)['\"]", tag)
        if not src_match:
            return tag
        src = src_match.group(1)

        alt_text = filename_to_alt(src, page_title)
        # Insert alt before the closing />  or >
        if tag.endswith('/>'):
            new_tag = tag[:-2].rstrip() + f' alt="{alt_text}" />'
        elif tag.endswith('>'):
            new_tag = tag[:-1].rstrip() + f' alt="{alt_text}">'
        else:
            return tag

        count += 1
        return new_tag

    new_content = re.sub(r'<img\s[^>]*?/?>', add_alt, content)
    return new_content, count


def main():
    os.chdir(ROOT)
    total = 0

    for f in sorted(os.listdir('.')):
        if not f.endswith('.html') or f == 'temp.html':
            continue
        filepath = os.path.join(ROOT, f)
        new_content, count = fix_file(filepath)

        if count == 0:
            continue

        total += count
        print(f"  {f}: +{count} alt texts")

        if not DRY_RUN:
            with open(filepath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Added alt text to {total} images")


if __name__ == '__main__':
    main()

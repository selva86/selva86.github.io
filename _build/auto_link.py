#!/usr/bin/env python3
"""
Auto-linking engine for r-statistics.co

Scans HTML tutorial pages and injects:
1. Internal links for registered terms (from links.json)
2. "Further Reading" sections for core posts

Usage:
    python _build/auto_link.py                    # Additive mode (default)
    python _build/auto_link.py --reprocess        # Strip all auto-links, redo from scratch
    python _build/auto_link.py --cleanup URL      # Remove auto-links to a specific URL
"""

import json
import os
import re
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
LINKS_JSON = os.path.join(ROOT_DIR, "www", "links.json")

SKIP_FILES = {"404.html", "index.html", "temp.html"}

# Subdirectories to ignore (only process root-level HTML)
SKIP_DIRS = {"_posts", "_build", "www", "css", "about", "codes", "datasets",
             "figures", "screenshots", "r", "posts", ".git", "Plan",
             "bootstrap-3.3.5", ".claude"}


# ---------------------------------------------------------------------------
# Load configuration
# ---------------------------------------------------------------------------

def load_links():
    with open(LINKS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Stripping helpers (for --reprocess and --cleanup)
# ---------------------------------------------------------------------------

def strip_all_auto_links(html):
    """Remove all <a class="auto-link" ...>TEXT</a> -> TEXT"""
    pattern = r'<a\s+class="auto-link"[^>]*>(.*?)</a>'
    return re.sub(pattern, r'\1', html, flags=re.DOTALL)


def strip_further_reading(html):
    """Remove <div id="auto-further-reading">...</div>"""
    pattern = r'<div id="auto-further-reading">.*?</div>\s*</div>'
    return re.sub(pattern, '', html, flags=re.DOTALL)


def strip_auto_links_to_url(html, target_url):
    """Remove auto-links pointing to a specific URL"""
    pattern = r'<a\s+class="auto-link"\s+href="' + re.escape(target_url) + r'"[^>]*>(.*?)</a>'
    return re.sub(pattern, r'\1', html, flags=re.DOTALL)


# ---------------------------------------------------------------------------
# HTML-aware text replacement
# ---------------------------------------------------------------------------

def find_tag_regions(html):
    """
    Returns a list of (start, end, is_tag) tuples covering the entire HTML.
    is_tag=True for HTML tags, False for text nodes.
    """
    regions = []
    pos = 0
    for m in re.finditer(r'<[^>]+>', html):
        if m.start() > pos:
            regions.append((pos, m.start(), False))  # text node
        regions.append((m.start(), m.end(), True))    # tag
        pos = m.end()
    if pos < len(html):
        regions.append((pos, len(html), False))
    return regions


def build_skip_set(html, skip_tags, skip_classes):
    """
    Find character ranges that should NOT be modified.
    Returns a set of (start, end) tuples for regions inside skip_tags or skip_classes.
    """
    skip_ranges = []

    # Find all tags and their nesting to identify skip regions
    # We use a simplified approach: find opening tags of skip types and their matching closings
    for tag in skip_tags:
        # Match opening and closing tags (handles self-closing too)
        # For void elements like <br>, <img>, <hr> - skip
        pattern = r'<' + tag + r'[\s>]'
        for m in re.finditer(pattern, html, re.IGNORECASE):
            # Find the matching closing tag
            open_pos = m.start()
            close_pattern = r'</' + tag + r'\s*>'
            close_match = re.search(close_pattern, html[open_pos:], re.IGNORECASE)
            if close_match:
                end_pos = open_pos + close_match.end()
                skip_ranges.append((open_pos, end_pos))

    # Find elements with skip classes
    for cls in skip_classes:
        pattern = r'<(\w+)[^>]*class="[^"]*\b' + re.escape(cls) + r'\b[^"]*"[^>]*>'
        for m in re.finditer(pattern, html, re.IGNORECASE):
            tag_name = m.group(1)
            open_pos = m.start()
            close_pattern = r'</' + tag_name + r'\s*>'
            # Find the matching close - need to handle nesting
            depth = 1
            search_pos = m.end()
            while depth > 0 and search_pos < len(html):
                next_open = re.search(r'<' + tag_name + r'[\s>]', html[search_pos:], re.IGNORECASE)
                next_close = re.search(r'</' + tag_name + r'\s*>', html[search_pos:], re.IGNORECASE)
                if next_close is None:
                    break
                if next_open and next_open.start() < next_close.start():
                    depth += 1
                    search_pos += next_open.end()
                else:
                    depth -= 1
                    if depth == 0:
                        end_pos = search_pos + next_close.end()
                        skip_ranges.append((open_pos, end_pos))
                    else:
                        search_pos += next_close.end()

    return skip_ranges


def is_in_skip_range(pos, length, skip_ranges):
    """Check if a position falls within any skip range."""
    end = pos + length
    for sr_start, sr_end in skip_ranges:
        if pos >= sr_start and end <= sr_end:
            return True
    return False


def is_inside_tag(html, pos):
    """Check if position is inside an HTML tag (between < and >)."""
    # Look backwards for < or >
    i = pos - 1
    while i >= 0:
        if html[i] == '>':
            return False
        if html[i] == '<':
            return True
        i -= 1
    return False


def term_already_linked(html, term, case_sensitive):
    """Check if this term already appears inside any <a> tag on the page."""
    flags = 0 if case_sensitive else re.IGNORECASE
    # Find all <a ...>...</a> content
    for m in re.finditer(r'<a\s[^>]*>.*?</a>', html, re.DOTALL | flags):
        link_text = m.group()
        if re.search(re.escape(term), link_text, flags):
            return True
    return False


def make_term_pattern(term, case_sensitive):
    """Build a regex pattern for a term."""
    escaped = re.escape(term)
    if '(' in term or ')' in term:
        # Function-style terms like select() - use lookbehind/ahead for non-word
        pattern = r'(?<![a-zA-Z0-9_.])' + escaped + r'(?![a-zA-Z0-9_])'
    else:
        pattern = r'\b' + escaped + r'\b'
    flags = 0 if case_sensitive else re.IGNORECASE
    return pattern, flags


def inject_link_for_term(html, term, url, title, case_sensitive, skip_ranges):
    """
    Find the first occurrence of term in valid text (not inside skip regions or tags)
    and wrap it with an auto-link.
    Returns (modified_html, was_modified).
    """
    pattern, flags = make_term_pattern(term, case_sensitive)

    for m in re.finditer(pattern, html, flags):
        pos = m.start()
        length = m.end() - m.start()

        # Skip if inside an HTML tag
        if is_inside_tag(html, pos):
            continue

        # Skip if in a skip range
        if is_in_skip_range(pos, length, skip_ranges):
            continue

        # Found a valid match - replace it
        matched_text = m.group()
        replacement = '<a class="auto-link" href="{}" title="{}">{}</a>'.format(
            url, title.replace('"', '&quot;'), matched_text
        )
        new_html = html[:m.start()] + replacement + html[m.end():]
        return new_html, True

    return html, False


# ---------------------------------------------------------------------------
# Further Reading section
# ---------------------------------------------------------------------------

FURTHER_READING_TEMPLATE = """<div id="auto-further-reading">
<h2>Further Reading</h2>
<ul class="further-reading-list">
{}
</ul>
</div>"""


def build_further_reading_html(items):
    """Build the Further Reading HTML block."""
    li_items = []
    for item in items:
        li_items.append('<li><a href="{}">{}</a></li>'.format(
            item["url"], item["title"]
        ))
    return FURTHER_READING_TEMPLATE.format("\n".join(li_items))


def inject_further_reading(html, items):
    """
    Insert Further Reading section before the closing </div> of #content.
    Returns (modified_html, was_injected).
    """
    if not items:
        return html, False

    # Check if already present
    if 'id="auto-further-reading"' in html:
        return html, False

    fr_html = build_further_reading_html(items)

    # Find the #content div and its closing </div>
    content_match = re.search(r'<div\s+id="content"[^>]*>', html)
    if not content_match:
        # Try alternate pattern (class before id)
        content_match = re.search(r'<div[^>]*id="content"[^>]*>', html)
    if not content_match:
        return html, False

    # Find the closing </div> for #content
    # Strategy: look for the pattern of </div> followed by toc-sidebar or col-sm-2
    # Based on file structure analysis, #content closes right before toc-sidebar
    toc_pattern = re.search(
        r'([ \t]*</div>\s*\n?\s*(?:<div[^>]*id="toc-sidebar"|<div[^>]*class="col-sm-2[^"]*"[^>]*id="toc-sidebar"))',
        html[content_match.end():]
    )

    if toc_pattern:
        insert_pos = content_match.end() + toc_pattern.start()
        # Insert FR section before the closing </div>
        new_html = html[:insert_pos] + "\n" + fr_html + "\n" + html[insert_pos:]
        return new_html, True

    # Fallback: look for </div> that precedes toc-sidebar
    pattern2 = re.search(r'</div>\s*\n\s*<div[^>]*id="toc-sidebar"', html[content_match.end():])
    if pattern2:
        insert_pos = content_match.end() + pattern2.start()
        new_html = html[:insert_pos] + "\n" + fr_html + "\n" + html[insert_pos:]
        return new_html, True

    return html, False


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def count_existing_auto_links(html):
    """Count existing auto-link anchors in the HTML."""
    return len(re.findall(r'<a\s+class="auto-link"', html))


def get_html_files(root_dir):
    """Get all HTML files in the root directory (not subdirs)."""
    files = []
    for fname in os.listdir(root_dir):
        if not fname.endswith('.html'):
            continue
        if fname in SKIP_FILES:
            continue
        fpath = os.path.join(root_dir, fname)
        if os.path.isfile(fpath):
            files.append((fname, fpath))
    return sorted(files)


def process_additive(links_data):
    """Additive mode: add new links only, never touch existing."""
    config = links_data["config"]
    max_links = config["max_links_per_page"]
    skip_tags = config["skip_tags"]
    skip_classes = config["skip_classes"]

    # Filter to published auto_links only
    published_links = [al for al in links_data["auto_links"] if al.get("status") == "published"]

    # Build term list sorted by length (longest first)
    term_entries = []
    for al in published_links:
        for term in al["terms"]:
            term_entries.append({
                "term": term,
                "url": al["url"],
                "title": al["title"],
                "case_sensitive": al.get("case_sensitive", False),
                "max_per_page": al.get("max_per_page", 1),
            })
    term_entries.sort(key=lambda x: len(x["term"]), reverse=True)

    further_reading = links_data.get("further_reading", {})

    files = get_html_files(ROOT_DIR)
    total_files_modified = 0
    total_links_added = 0
    total_fr_added = 0

    for fname, fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
        except Exception as e:
            print(f"  SKIP {fname}: cannot read ({e})")
            continue

        original_html = html
        links_added = 0

        # Count existing auto-links
        existing_count = count_existing_auto_links(html)
        if existing_count >= max_links:
            continue

        # Build skip ranges
        skip_ranges = build_skip_set(html, skip_tags, skip_classes)

        # Track how many links added per URL (for max_per_page)
        url_counts = {}

        for entry in term_entries:
            if existing_count + links_added >= max_links:
                break

            url = entry["url"]
            term = entry["term"]

            # Don't self-link
            if url == fname:
                continue

            # Check max_per_page for this URL
            if url_counts.get(url, 0) >= entry["max_per_page"]:
                continue

            # Check if term is already linked anywhere on page
            if term_already_linked(html, term, entry["case_sensitive"]):
                continue

            html, was_modified = inject_link_for_term(
                html, term, url, entry["title"],
                entry["case_sensitive"], skip_ranges
            )

            if was_modified:
                links_added += 1
                url_counts[url] = url_counts.get(url, 0) + 1
                # Rebuild skip ranges since HTML changed
                skip_ranges = build_skip_set(html, skip_tags, skip_classes)

        # Further Reading
        fr_injected = False
        if fname in further_reading:
            fr_items = [item for item in further_reading[fname]
                        if item.get("status") == "published"]
            if fr_items:
                html, fr_injected = inject_further_reading(html, fr_items)

        if html != original_html:
            try:
                with open(fpath, "w", encoding="utf-8", newline='') as f:
                    f.write(html)
                total_files_modified += 1
                total_links_added += links_added
                if fr_injected:
                    total_fr_added += 1
                details = []
                if links_added:
                    details.append(f"{links_added} links")
                if fr_injected:
                    details.append("FR section")
                print(f"  {fname}: {', '.join(details)}")
            except Exception as e:
                print(f"  ERROR {fname}: cannot write ({e})")

    return total_files_modified, total_links_added, total_fr_added


def process_reprocess(links_data):
    """Strip all auto-links and further reading, then redo."""
    files = get_html_files(ROOT_DIR)
    stripped = 0
    for fname, fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
        except Exception:
            continue

        new_html = strip_all_auto_links(html)
        new_html = strip_further_reading(new_html)

        if new_html != html:
            with open(fpath, "w", encoding="utf-8", newline='') as f:
                f.write(new_html)
            stripped += 1

    print(f"Stripped auto-links from {stripped} files.")
    print("Re-running additive mode...")
    return process_additive(links_data)


def process_cleanup(links_data, target_url):
    """Remove all auto-links pointing to a specific URL."""
    files = get_html_files(ROOT_DIR)
    cleaned = 0
    for fname, fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
        except Exception:
            continue

        new_html = strip_auto_links_to_url(html, target_url)
        if new_html != html:
            with open(fpath, "w", encoding="utf-8", newline='') as f:
                f.write(new_html)
            cleaned += 1
            print(f"  {fname}: removed links to {target_url}")

    return cleaned


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    if not os.path.exists(LINKS_JSON):
        print(f"ERROR: {LINKS_JSON} not found")
        sys.exit(1)

    links_data = load_links()

    args = sys.argv[1:]

    if "--reprocess" in args:
        print("=== Auto-Link: REPROCESS mode ===")
        files_mod, links_add, fr_add = process_reprocess(links_data)
    elif "--cleanup" in args:
        idx = args.index("--cleanup")
        if idx + 1 >= len(args):
            print("ERROR: --cleanup requires a URL argument")
            sys.exit(1)
        target_url = args[idx + 1]
        print(f"=== Auto-Link: CLEANUP mode (target: {target_url}) ===")
        cleaned = process_cleanup(links_data, target_url)
        print(f"\nSummary: cleaned {cleaned} files")
        return
    else:
        print("=== Auto-Link: ADDITIVE mode ===")
        files_mod, links_add, fr_add = process_additive(links_data)

    print(f"\n{'='*40}")
    print(f"Summary:")
    print(f"  Files modified: {files_mod}")
    print(f"  Links added:    {links_add}")
    print(f"  FR sections:    {fr_add}")
    print(f"{'='*40}")


if __name__ == "__main__":
    main()

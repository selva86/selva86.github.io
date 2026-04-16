#!/usr/bin/env python3
"""Build script for r-statistics.co - generates full HTML pages from content fragments.

Supports two source formats:
  - _posts/*.html  — HTML fragments with YAML-like front matter (original format)
  - _posts/*.html with webr: true — pages with interactive WebR code blocks
"""

import os
import re
import json
import sys
import random
import textwrap
import datetime
import html as html_module

# Paths relative to repo root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TEMPLATE_PATH = os.path.join(SCRIPT_DIR, "template.html")
POSTS_DIR = os.path.join(REPO_ROOT, "_posts")
SITEMAP_PATH = os.path.join(REPO_ROOT, "sitemap.xml")
SIDEBAR_PATH = os.path.join(REPO_ROOT, "www", "sidebar.json")
OG_DIR = os.path.join(REPO_ROOT, "screenshots", "og")


def generate_og_image(title, slug_no_ext, force=False):
    """Generate a branded 1200x630 OG image with the post title."""
    os.makedirs(OG_DIR, exist_ok=True)
    out_path = os.path.join(OG_DIR, f"{slug_no_ext}.png")
    if not force and os.path.exists(out_path):
        return  # Skip existing

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return  # Pillow not available, skip silently

    img = Image.new('RGB', (1200, 630), '#1a1a2e')
    draw = ImageDraw.Draw(img)

    # Blue accent bar at top
    draw.rectangle([0, 0, 1200, 6], fill='#3F73D8')

    # Load fonts
    try:
        title_font = ImageFont.truetype('arial.ttf', 46)
        site_font = ImageFont.truetype('arial.ttf', 22)
        badge_font = ImageFont.truetype('arial.ttf', 36)
    except (OSError, IOError):
        title_font = ImageFont.load_default()
        site_font = ImageFont.load_default()
        badge_font = ImageFont.load_default()

    # Word-wrap title (max 3 lines)
    lines = textwrap.wrap(title, width=38)[:3]
    if len(textwrap.wrap(title, width=38)) > 3:
        lines[2] = lines[2][:35] + '...'

    y = 180
    for line in lines:
        draw.text((80, y), line, fill='#ffffff', font=title_font)
        y += 60

    # Site name at bottom
    draw.text((80, 540), 'r-statistics.co', fill='#64748b', font=site_font)

    # R badge
    draw.rounded_rectangle([1060, 530, 1140, 585], radius=10, fill='#3F73D8')
    draw.text((1085, 538), 'R', fill='#ffffff', font=badge_font)

    img.save(out_path, 'PNG', optimize=True)
    return out_path


def load_sidebar_map():
    """Load sidebar.json and build a slug -> section_title lookup."""
    if not os.path.exists(SIDEBAR_PATH):
        return {}
    with open(SIDEBAR_PATH, 'r', encoding='utf-8') as f:
        sections = json.load(f)
    mapping = {}
    for section in sections:
        title = section.get('title', '')
        for item in section.get('items', []):
            if item.get('divider'):
                continue
            mapping[item['href']] = title
    return mapping


def load_prev_next_map():
    """Build a slug -> (prev, next) map from sidebar.json linear order.

    Each value is a tuple ((prev_href, prev_text) | None, (next_href, next_text) | None).
    Traversal is continuous across sections and learning paths — last item of one
    section links to first item of the next.
    """
    if not os.path.exists(SIDEBAR_PATH):
        return {}
    with open(SIDEBAR_PATH, 'r', encoding='utf-8') as f:
        sections = json.load(f)
    flat = []
    for section in sections:
        for item in section.get('items', []):
            if item.get('divider'):
                continue
            flat.append((item['href'], item.get('text', '')))
    mapping = {}
    for i, (href, text) in enumerate(flat):
        prev_item = flat[i - 1] if i > 0 else None
        next_item = flat[i + 1] if i + 1 < len(flat) else None
        mapping[href] = (prev_item, next_item)
    return mapping


def render_prev_next(slug, prev_next_map):
    """Render the prev/next navigation HTML for a given slug.

    Returns '' if the slug is not in the map or has neither neighbor.
    """
    entry = prev_next_map.get(slug)
    if not entry:
        return ''
    prev_item, next_item = entry
    if not prev_item and not next_item:
        return ''

    def esc(s):
        return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

    parts = ['<nav class="prev-next-nav" aria-label="Post navigation">']
    if prev_item:
        parts.append(
            '<a class="pn-link pn-prev" href="{href}">'
            '<span class="pn-label">&larr; Previous</span>'
            '<span class="pn-title">{text}</span>'
            '</a>'.format(href=prev_item[0], text=esc(prev_item[1]))
        )
    else:
        parts.append('<span class="pn-link pn-placeholder"></span>')
    if next_item:
        parts.append(
            '<a class="pn-link pn-next" href="{href}">'
            '<span class="pn-label">Next &rarr;</span>'
            '<span class="pn-title">{text}</span>'
            '</a>'.format(href=next_item[0], text=esc(next_item[1]))
        )
    else:
        parts.append('<span class="pn-link pn-placeholder"></span>')
    parts.append('</nav>')
    return '\n'.join(parts)


CURRICULUM_STATUS_PATH = os.path.join(REPO_ROOT, "curriculum-status.json")
MARKDOWN_POSTS_DIR = os.path.join(REPO_ROOT, "posts")


def load_curriculum_siblings():
    """Read curriculum-status.json and return sibling mappings.

    Returns (slug_to_subpath, subpath_to_slugs) where:
      - slug_to_subpath: "R-Syntax-101.html" -> "/learn-r/fundamentals/"
      - subpath_to_slugs: sub_path_key -> [list of published sibling hrefs]

    Returns ({}, {}) if curriculum-status.json is missing (it's gitignored,
    so this is a normal case on fresh checkouts).
    """
    if not os.path.exists(CURRICULUM_STATUS_PATH):
        return {}, {}
    try:
        with open(CURRICULUM_STATUS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}, {}
    slug_to_subpath = {}
    subpath_to_slugs = {}
    for _, path_data in data.get('paths', {}).items():
        for spk, sp in path_data.get('sub_paths', {}).items():
            slugs = []
            for post in sp.get('posts', []):
                if post.get('status') != 'published':
                    continue
                slug = post.get('slug')
                if not slug:
                    continue
                href = slug + '.html'
                slug_to_subpath[href] = spk
                slugs.append(href)
            if slugs:
                subpath_to_slugs[spk] = slugs
    return slug_to_subpath, subpath_to_slugs


_WORD_RE = re.compile(r"\b[\w']+\b")
_FENCED_CODE_RE = re.compile(r"```.*?```", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`[^`]*`")
_FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n", re.DOTALL)


def compute_reading_time(slug_href):
    """Compute reading time in minutes for a post's markdown source.

    Uses 250 wpm prose-only (strips fenced code blocks and inline code).
    Floors to integer, minimum 1 minute. Returns 0 if markdown is missing
    (caller should skip showing reading time).
    """
    slug_no_ext = slug_href[:-5] if slug_href.endswith('.html') else slug_href
    md_path = os.path.join(MARKDOWN_POSTS_DIR, slug_no_ext + '.md')
    if not os.path.exists(md_path):
        return 0
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except OSError:
        return 0
    text = _FRONTMATTER_RE.sub('', text, count=1)
    text = _FENCED_CODE_RE.sub(' ', text)
    text = _INLINE_CODE_RE.sub(' ', text)
    words = len(_WORD_RE.findall(text))
    if words == 0:
        return 0
    minutes = words // 250
    return max(1, minutes)


def load_post_titles():
    """Scan _posts/*.html fragments and return slug -> title map from frontmatter."""
    titles = {}
    if not os.path.exists(POSTS_DIR):
        return titles
    for fname in os.listdir(POSTS_DIR):
        if not fname.endswith('.html'):
            continue
        path = os.path.join(POSTS_DIR, fname)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                head = f.read(2000)
        except OSError:
            continue
        m = re.search(r"^title:\s*(.+)$", head, re.MULTILINE)
        if m:
            titles[fname] = m.group(1).strip().strip('"').strip("'")
    return titles


def render_related_tutorials(
    slug, meta, slug_to_subpath, subpath_to_slugs,
    sidebar_map, post_titles, reading_time_cache
):
    """Render the Related Tutorials grid for a given slug.

    Pool resolution:
      - Core posts: siblings from the same curriculum sub_path.
      - FR/EX posts: if fr_parent is set in frontmatter, use the parent's
        sub_path as the sibling pool (so FR posts get related content from
        the same topic cluster as their parent).

    Returns '' if no related posts can be found.
    """
    if not slug_to_subpath:
        return ''

    subpath = None
    fr_parent = meta.get('fr_parent', '').strip() if meta else ''
    if fr_parent:
        subpath = slug_to_subpath.get(fr_parent)
    if not subpath:
        subpath = slug_to_subpath.get(slug)
    if not subpath:
        return ''

    pool = [s for s in subpath_to_slugs.get(subpath, []) if s != slug]
    if fr_parent and fr_parent in pool:
        # Keep the parent in the pool — it's a legitimate related post.
        pass
    if not pool:
        return ''

    sample = random.sample(pool, min(4, len(pool)))

    def esc(s):
        return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    cards = []
    for href in sample:
        title = post_titles.get(href, href[:-5].replace('-', ' '))
        section = sidebar_map.get(href, '')
        if href not in reading_time_cache:
            reading_time_cache[href] = compute_reading_time(href)
        minutes = reading_time_cache[href]
        sub_bits = []
        if section:
            sub_bits.append(esc(section))
        if minutes:
            sub_bits.append(f"{minutes} min read")
        sub_label = ' &middot; '.join(sub_bits)
        cards.append(
            '<a class="rt-card" href="{href}">'
            '<span class="rt-title">{title}</span>'
            '<span class="rt-meta">{meta}</span>'
            '</a>'.format(href=href, title=esc(title), meta=sub_label)
        )

    return (
        '<section class="related-tutorials" aria-label="Related tutorials">'
        '<h2 class="rt-heading">Related Tutorials</h2>'
        '<div class="rt-grid">' + ''.join(cards) + '</div>'
        '</section>'
    )

MATHJAX_BLOCK = """
  <script type="text/x-mathjax-config">
    MathJax.Hub.Config({
      tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}
    });
  </script>
  <script type="text/javascript"
    src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
  </script>
"""

WEBR_HEAD_BLOCK = """
    <!-- WebR Interactive R Code -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
    <style>
      /* --- Loading banner: compact, collapses when ready --- */
      .webr-loading-banner {
        padding: 8px 16px;
        background: #f0f4ff;
        color: #3b5998;
        text-align: center;
        margin: 0 0 8px 0;
        border-radius: 6px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border: 1px solid #c7d2fe;
        transition: all 0.4s ease;
        overflow: hidden;
        max-height: 50px;
      }
      .webr-loading-banner.ready {
        background: #ecfdf5;
        color: #166534;
        border-color: #86efac;
      }
      .webr-loading-banner.hidden {
        max-height: 0;
        padding: 0 16px;
        margin: 0;
        border-color: transparent;
        opacity: 0;
      }

      /* --- Run All bar (subtle with background) --- */
      .webr-runall-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        padding: 7px 14px;
        margin: 0 0 18px 0;
        background: #f8fafb;
        border: 1px solid #edf0f3;
        border-radius: 8px;
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .webr-runall-bar.visible { opacity: 1; transform: translateY(0); }
      .webr-runall-label {
        font-size: 11px;
        color: #9ca3af;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .webr-runall-label::before {
        content: '';
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #2da44e;
        flex-shrink: 0;
      }
      .webr-runall-btn {
        background: none;
        color: #3f73d8;
        border: 1px solid #d0d7de;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 400;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.15s ease;
      }
      .webr-runall-btn:hover { background: #f6f8fa; border-color: #3f73d8; }
      .webr-runall-btn:disabled { color: #a5b4d4; cursor: wait; }
      .webr-runall-btn.running { color: #d29922; border-color: #d29922; animation: pulse-run 1.5s ease-in-out infinite; }

      /* --- Code block container (dark theme, pythoncompiler.io style) --- */
      .webr-container {
        position: relative;
        margin: 22px 0;
        border: 0.8px solid rgba(51, 65, 85, 0.5);
        border-radius: 8px;
        overflow: hidden;
        background: #0d1117;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        transition: box-shadow 150ms ease-out, border-color 150ms ease-out;
      }
      .webr-container:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        border-color: rgba(51, 65, 85, 0.8);
      }
      .webr-container:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3);
      }
      @keyframes webrIntroPulse {
        0%, 100% { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); }
        50%      { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(5, 150, 105, 0.25); }
      }
      .webr-container:first-of-type { animation: webrIntroPulse 2s ease-out 1; }

      /* --- Code block header bar (sticky, dark theme) --- */
      .webr-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 12px;
        min-height: 36px;
        background: rgba(30, 41, 59, 0.8);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        border-bottom: 0.8px solid rgba(51, 65, 85, 0.5);
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .webr-header-left  { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .webr-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .webr-header-label {
        font-size: 12px; font-weight: 500; color: #94a3b8; letter-spacing: 0.02em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .webr-header-badge {
        background: #1e3a8a; color: #93c5fd; padding: 2px 7px;
        border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
        flex-shrink: 0;
      }

      /* --- Run button shortcut hint --- */
      .webr-run-shortcut {
        font-size: 10px; opacity: 0.6; margin-left: 3px; font-weight: 400;
        font-variant-numeric: tabular-nums;
      }

      /* --- Bottom button bar: KILLED. DOM nodes stay in place (md2html contract),
             CSS hides them. Copy + Run live in the header now. --- */
      .webr-buttons { display: none !important; }
      .webr-buttons-left, .webr-buttons-right { display: none !important; }
      .webr-reset-btn { display: none !important; }

      /* --- Keyboard hint --- */
      .webr-kbd-hint {
        font-size: 10px;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .webr-kbd-hint kbd {
        background: #334155;
        border: 1px solid #475569;
        border-radius: 3px;
        padding: 1px 4px;
        font-size: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 1px 0 rgba(0,0,0,0.15);
        color: #94a3b8;
      }
      /* --- Copy button (promoted to header, icon-only 28x28 ghost, no border) --- */
      .webr-copy-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        color: #94a3b8;
        border-radius: 5px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease, color 120ms ease;
      }
      .webr-copy-btn:hover  { background: #334155; color: #e2e8f0; }
      .webr-copy-btn:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
      .webr-copy-btn.copied { color: #4ade80; }

      /* --- Pre-CodeMirror: reserve space to prevent CLS (dark theme) --- */
      .webr-editor {
        position: relative;
        min-height: 80px;
        font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', ui-monospace, monospace;
        font-variant-ligatures: contextual;
        font-feature-settings: 'calt' 1;
        font-size: 14px;
        line-height: 1.4;
        padding: 8px 12px 8px 52px;
        background: #020617;
        white-space: pre;
        overflow: hidden;
        color: #e3e8ef;
      }
      /* Right-edge scroll affordance — toggled by JS when editor overflows */
      .webr-editor::after {
        content: '';
        position: absolute;
        right: 0; top: 0; bottom: 0;
        width: 24px;
        background: linear-gradient(to right, rgba(2,6,23,0), rgba(2,6,23,1));
        pointer-events: none;
        opacity: 0;
        transition: opacity 150ms ease;
      }
      .webr-editor.has-overflow::after { opacity: 1; }
      /* After CodeMirror initializes, it replaces the content — reset padding */
      .webr-editor .CodeMirror {
        height: auto;
        min-height: 48px;
        font-size: 14px;
        font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', ui-monospace, monospace;
        font-variant-ligatures: contextual;
        font-feature-settings: 'calt' 1;
        line-height: 1.4;
        background: #020617;
        color: #e3e8ef;
        padding: 4px 0;
      }
      .webr-editor.cm-initialized { padding: 0; min-height: auto; }
      /* Prevent CodeMirror's internal scroll container from capturing wheel events —
         editors are fully expanded (viewportMargin: Infinity) so never need their own scrollbar */
      .webr-editor .CodeMirror-scroll { overflow: hidden !important; }
      .webr-editor .CodeMirror-gutters {
        background: #020617;
        border-right: none;
        padding-right: 8px;
      }
      .webr-editor .CodeMirror-linenumber {
        color: #6e7681;
        font-size: 13px;
        padding: 0 8px 0 12px;
        min-width: 20px;
      }
      .webr-editor .CodeMirror-cursor { border-left-color: #60a5fa; border-left-width: 2px; }
      .webr-editor .CodeMirror-selected { background: #334155 !important; }
      .webr-editor .CodeMirror-activeline-background { background: linear-gradient(to right, transparent 0 18px, #1e3a5f 18px); }
      .webr-editor .CodeMirror-matchingbracket { color: #60a5fa !important; font-weight: 700; background: #1e3a5f; border-radius: 2px; }

      /* --- R syntax colors (dark theme) --- */
      .webr-editor .cm-keyword { color: #f87171; font-weight: 500; }
      .webr-editor .cm-atom { color: #c084fc; }
      .webr-editor .cm-number { color: #60a5fa; }
      .webr-editor .cm-def { color: #c084fc; }
      .webr-editor .cm-variable { color: #e2e8f0; }
      .webr-editor .cm-variable-2 { color: #fb923c; }
      .webr-editor .cm-variable-3 { color: #60a5fa; }
      .webr-editor .cm-property { color: #60a5fa; }
      .webr-editor .cm-operator { color: #f87171; }
      .webr-editor .cm-comment { color: #64748b; font-style: italic; }
      .webr-editor .cm-string { color: #86efac; }
      .webr-editor .cm-string-2 { color: #86efac; }
      .webr-editor .cm-builtin { color: #c084fc; font-weight: 500; }
      .webr-editor .cm-function-call { color: #c4b5fd; }

      /* --- Run button (green, pythoncompiler.io style) --- */
      .webr-run-btn {
        min-height: 26px;
        padding: 4px 10px;
        background: #059669;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        transition: transform 120ms cubic-bezier(.4,0,.2,1),
                    background 120ms ease,
                    box-shadow 120ms ease;
      }
      .webr-run-btn:hover  { background: #047857; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
      .webr-run-btn:active { background: #065f46; transform: translateY(0); box-shadow: none; }
      .webr-run-btn:disabled { background: #065f46; color: rgba(255,255,255,0.5); cursor: wait; transform: none; box-shadow: none; }
      .webr-run-btn:focus-visible { outline: 2px solid #34d399; outline-offset: 2px; }
      .webr-run-btn.running { background: #d29922; animation: pulse-run 1.5s ease-in-out infinite; }
      @keyframes pulse-run { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

      /* First unrun code block subtly pulses to pull the first click. */
      .webr-container.engagement-unrun-first .webr-run-btn {
        animation: webrRunInvite 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      @keyframes webrRunInvite {
        0%, 100% { box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 0 0 0 rgba(5, 150, 105, 0.35); }
        50%      { box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 0 0 6px rgba(5, 150, 105, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .webr-container.engagement-unrun-first .webr-run-btn { animation: none; }
      }

      /* --- Output panel (dark theme, pythoncompiler.io style) --- */
      .webr-output {
        display: block;
        min-height: 0;
        margin: 0;
        padding: 0 16px 0 16px;
        background: #020617;
        color: #edeef3;
        font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.55;
        max-height: 400px;
        overflow-y: auto;
        white-space: pre-wrap;
        border-top: none;
        border-left: 3px solid transparent;
        transition: min-height 180ms ease-out, padding 180ms ease-out,
                    border-top-color 180ms ease-out,
                    opacity 150ms ease-out, border-left-color 150ms ease-out;
      }
      .webr-output::-webkit-scrollbar { width: 8px; }
      .webr-output::-webkit-scrollbar-track { background: #020617; }
      .webr-output::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      .webr-output.has-content,
      .webr-output.has-message,
      .webr-output.has-error {
        min-height: 44px;
        padding: 28px 16px 12px 16px;
        border-top: 0.8px solid rgba(51, 65, 85, 0.5);
      }
      /* OUTPUT label */
      .webr-output.has-content::before,
      .webr-output.has-message::before,
      .webr-output.has-error::before {
        content: 'OUTPUT';
        display: block;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: #64748b;
        margin-bottom: 8px;
        margin-top: -16px;
      }
      .webr-output.has-content { border-left-color: #60a5fa; }
      .webr-output.has-message { border-left-color: #64748b; }
      .webr-output.has-error   { color: #f87171; border-left-color: #f87171; }
      .webr-output.is-loading  { opacity: 0.65; }

      /* --- Responsive: compact header on mobile --- */
      @media (max-width: 640px) {
        .webr-header { padding: 7px 10px; min-height: 40px; gap: 8px; }
        .webr-header-label { display: none; }
        .webr-run-btn { min-width: 80px; padding: 5px 10px; }
        .webr-run-shortcut { display: none; }
      }

      /* --- A11y: honor reduced motion --- */
      @media (prefers-reduced-motion: reduce) {
        .webr-container,
        .webr-container:first-of-type,
        .webr-run-btn,
        .webr-copy-btn,
        .webr-output,
        .webr-editor::after {
          animation: none !important;
          transition: none !important;
        }
        .webr-run-btn:hover { transform: none; }
      }

      /* --- Print: disable sticky header + animations --- */
      @media print {
        .webr-container:first-of-type { animation: none; }
        .webr-header { position: static; -webkit-backdrop-filter: none; backdrop-filter: none; }
      }

      /* --- Plot output --- */
      .webr-plot-output { text-align: center; padding: 16px; background: #0d1117; display: none; border-top: 0.8px solid rgba(51, 65, 85, 0.5); }
      .webr-plot-output.has-content { display: block; }
      .webr-plot-output img, .webr-plot-output canvas { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

      .mermaid { margin: 15px 0; text-align: center; }

      /* ===== DARK MODE — Non-code-box WebR components only ===== */
      /* Code boxes are already dark-themed in base styles.
         Only loading banner and Run All bar need dark mode overrides. */

      /* Loading banner */
      html.dark .webr-loading-banner { background: #1e293b; color: #94a3b8; border-color: #334155; }
      html.dark .webr-loading-banner.ready { background: #1e293b; color: #4ade80; border-color: #334155; }

      /* Run All bar */
      html.dark .webr-runall-bar { background: #1e293b; border-color: #334155; }
      html.dark .webr-runall-label { color: #94a3b8; }
      html.dark .webr-runall-label::before { background: #4ade80; }
      html.dark .webr-runall-btn { color: #94a3b8; border-color: #475569; }
      html.dark .webr-runall-btn:hover { background: #334155; color: #e2e8f0; border-color: #3b82f6; }

      /* --- First-run hint message --- */
      .webr-first-run-hint {
        padding: 6px 12px;
        font-size: 12px;
        color: #94a3b8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: rgba(30, 41, 59, 0.6);
        border-top: 0.8px solid rgba(51, 65, 85, 0.3);
        text-align: center;
        animation: webrHintFadeIn 300ms ease-out;
      }
      @keyframes webrHintFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
"""

WEBR_BODY_BLOCK = """
  <!-- WebR Engine — CodeMirror deferred to avoid blocking -->
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/r/r.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/mode/overlay.min.js"></script>
  <script type="module">
    let WebR = null;
    let webR = null;
    let webRReady = false;
    let webRLoading = false;
    let shelter = null;
    const editors = [];
    let pendingRunBtn = null;

    // Lightweight overlay on top of the stock R mode: highlight function-call
    // sites (any identifier immediately followed by `(`). Skips R reserved
    // words so `function(`, `if(`, `for(`, etc. keep their keyword color.
    const R_RESERVED_CALL = /^(function|if|for|while|repeat|switch|return)$/;
    if (typeof CodeMirror !== 'undefined'
        && CodeMirror.defineMode
        && typeof CodeMirror.overlayMode === 'function') {
      CodeMirror.defineMode('r-plus', function(cfg) {
        return CodeMirror.overlayMode(CodeMirror.getMode(cfg, 'r'), {
          token: function(stream) {
            const m = stream.match(/[A-Za-z_.][\\w.]*(?=\\s*\\()/);
            if (m) {
              if (R_RESERVED_CALL.test(m[0])) return null;
              return 'function-call';
            }
            stream.next();
            return null;
          }
        });
      });
    }

    const banner = document.querySelector('.webr-loading-banner');

    async function loadAndInitWebR() {
      if (webRReady) return true;
      if (webRLoading) return false;
      webRLoading = true;

      // Show loading banner
      if (banner) {
        banner.textContent = '\\u23f3 Loading R environment (first run only)...';
        banner.classList.remove('hidden', 'ready');
        banner.style.maxHeight = '50px';
        banner.style.padding = '8px 16px';
        banner.style.margin = '0 0 8px 0';
        banner.style.opacity = '1';
      }

      try {
        // Dynamically import WebR only when needed
        const mod = await import('https://webr.r-wasm.org/latest/webr.mjs');
        WebR = mod.WebR;
        webR = new WebR();
        await webR.init();
        shelter = await new webR.Shelter();
        webRReady = true;

        if (banner) {
          banner.textContent = '\\u2705 R environment ready! Click Run or press Ctrl+Enter.';
          banner.classList.add('ready');
          setTimeout(() => { banner.classList.add('hidden'); }, 2500);
        }
        document.querySelectorAll('.webr-run-btn').forEach(btn => {
          btn.disabled = false;
          setRunBtnText(btn, '\\u25b6 Run');
        });
        // Inject Run All bar at the top of content
        const contentEl = document.getElementById('content');
        const firstH1 = contentEl.querySelector('h1');
        const runAllBar = document.createElement('div');
        runAllBar.className = 'webr-runall-bar';
        runAllBar.innerHTML = '<span class="webr-runall-label">R environment ready</span><button class="webr-runall-btn" onclick="runAllWebR(this)">\\u25b6 Run All Code Blocks</button>';
        if (firstH1 && firstH1.nextSibling) {
          firstH1.parentNode.insertBefore(runAllBar, firstH1.nextSibling);
        } else {
          contentEl.insertBefore(runAllBar, contentEl.firstChild);
        }
        requestAnimationFrame(() => { runAllBar.classList.add('visible'); });
        // Track WebR ready in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_ready', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_count: document.querySelectorAll('.webr-container').length
          });
        }
        return true;
      } catch(e) {
        webRLoading = false;
        if (banner) { banner.textContent = 'Failed to load R: ' + e.message; banner.style.background = '#fee2e2'; banner.style.color = '#991b1b'; }
        return false;
      }
    }

    // Hide the loading banner on initial page load (no auto-download)
    if (banner) {
      banner.textContent = '\\u25b6 Click Run on any code block to start the R environment';
      banner.style.background = '#f8fafb';
      banner.style.color = '#656d76';
      banner.style.borderColor = '#e1e4e8';
    }

    // Defensive ad scrub: third-party ad platforms (Ezoic/AdSense) can inject
    // iframes, <ins> slots, or wrappers into content-shaped divs. Remove anything
    // that lands inside a .webr-container — we never create iframes/<ins> ourselves.
    (function () {
      const AD_TAGS = { INS: 1, IFRAME: 1 };
      const AD_PATTERN = /ezoic|ezojs|ezmob|adsbygoogle|google_ads|pagead|dfp-ad|gpt-ad/i;
      function isAdNode(n) {
        if (!n || n.nodeType !== 1) return false;
        if (AD_TAGS[n.tagName]) return true;
        const cls = (typeof n.className === 'string') ? n.className : '';
        if (AD_PATTERN.test(cls)) return true;
        if (n.id && AD_PATTERN.test(n.id)) return true;
        return false;
      }
      function scrub(root) {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('.webr-container ins, .webr-container iframe').forEach(el => {
          try { el.remove(); } catch (e) {}
        });
        root.querySelectorAll('.webr-container [class*="ezoic"], .webr-container [id*="ezoic"], .webr-container [class*="adsbygoogle"]').forEach(el => {
          try { el.remove(); } catch (e) {}
        });
      }
      scrub(document);
      const adObs = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const added = mutations[i].addedNodes;
          for (let j = 0; j < added.length; j++) {
            const node = added[j];
            if (node.nodeType !== 1) continue;
            const container = node.closest && node.closest('.webr-container');
            if (container) {
              if (isAdNode(node)) {
                try { node.remove(); } catch (e) {}
                continue;
              }
              if (node.querySelectorAll) {
                node.querySelectorAll('ins, iframe, [class*="ezoic"], [id*="ezoic"], [class*="adsbygoogle"]').forEach(el => {
                  try { el.remove(); } catch (e) {}
                });
              }
            }
          }
        }
      });
      adObs.observe(document.documentElement, { childList: true, subtree: true });
    })();

    // Smart preload: start downloading WebR when user scrolls near the first code block
    // This way WebR is often ready by the time they actually click Run
    const firstBlock = document.querySelector('.webr-container');
    if (firstBlock && 'IntersectionObserver' in window) {
      const preloadObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !webRReady && !webRLoading) {
          loadAndInitWebR();
          preloadObserver.disconnect();
        }
      }, { rootMargin: '200px' });  // Start loading 200px before block enters viewport
      preloadObserver.observe(firstBlock);
    }

    // Build sticky header for each code block: [badge + label | copy + run]
    // Moves the existing Run button from .webr-buttons into the header so
    // event listeners and inner shortcut span are preserved. Bottom bar is
    // left in DOM but hidden via CSS (display: none) — preserves fragment
    // contract and keeps rollback trivial.
    const copyIcon  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    const _allContainers = document.querySelectorAll('.webr-container');
    if (_allContainers[0]) _allContainers[0].classList.add('engagement-unrun-first');

    // Delegated: first click on any .webr-run-btn clears the invitation pulse
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('.webr-run-btn') : null;
      if (!btn) return;
      document.querySelectorAll('.webr-container.engagement-unrun-first')
        .forEach(el => el.classList.remove('engagement-unrun-first'));
    }, true);

    _allContainers.forEach(container => {
      const codeBlock = container.querySelector('.webr-code-block');
      if (!codeBlock) return;
      if (codeBlock.querySelector('.webr-header')) return; // idempotent

      const header = document.createElement('div');
      header.className = 'webr-header';

      const left = document.createElement('div');
      left.className = 'webr-header-left';
      const _titleText = container.getAttribute('data-block-title') || 'Interactive R';
      const _titleEsc = _titleText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      left.innerHTML = '<span class="webr-header-badge">R</span>'
        + '<span class="webr-header-label">' + _titleEsc + '</span>';

      const right = document.createElement('div');
      right.className = 'webr-header-right';

      // Copy button — icon only, ghost
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'webr-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.title = 'Copy code';
      copyBtn.innerHTML = copyIcon;
      copyBtn.onclick = function() {
        const c = this.closest('.webr-container');
        const editorEl = c.querySelector('.webr-editor');
        const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
        const code = editors[idx] ? editors[idx].cm.getValue() : editorEl.textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.innerHTML = checkIcon;
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.innerHTML = copyIcon; copyBtn.classList.remove('copied'); }, 1500);
        });
      };
      right.appendChild(copyBtn);

      // Move the existing Run button from the bottom bar to the header.
      // This preserves its onclick binding and inner shortcut span.
      const runBtn = codeBlock.querySelector('.webr-buttons .webr-run-btn');
      if (runBtn) {
        runBtn.innerHTML = '\\u25b6 Run <span class="webr-run-shortcut">Ctrl+Enter</span>';
        right.appendChild(runBtn);
      }

      header.appendChild(left);
      header.appendChild(right);
      codeBlock.prepend(header);

      // Output panel: announce new results to screen readers (polite, atomic)
      // and make it programmatically focusable without entering tab order.
      const outputEl = codeBlock.querySelector('.webr-output');
      if (outputEl) {
        outputEl.setAttribute('aria-live', 'polite');
        outputEl.setAttribute('aria-atomic', 'false');
        outputEl.setAttribute('tabindex', '-1');
      }

      // Horizontal overflow affordance — toggle .has-overflow when the
      // editor's scroll width exceeds its client width. Debounced via RO.
      const editorEl = codeBlock.querySelector('.webr-editor');
      if (editorEl && 'ResizeObserver' in window) {
        const checkOverflow = () => {
          const target = editorEl.querySelector('.CodeMirror-scroll') || editorEl;
          const overflow = target.scrollWidth > target.clientWidth + 1;
          editorEl.classList.toggle('has-overflow', overflow);
        };
        new ResizeObserver(checkOverflow).observe(editorEl);
      }
    });

    // Initialize CodeMirror editor for a single element
    function initEditor(el) {
      if (el.dataset.cmInit) return; // already initialized
      el.dataset.cmInit = '1';
      const code = el.textContent;
      el.textContent = '';
      let cm;
      try {
        cm = CodeMirror(el, {
          value: code,
          mode: (CodeMirror.modes && CodeMirror.modes['r-plus']) ? 'r-plus' : 'r',
          lineNumbers: true,
          viewportMargin: Infinity,
          tabSize: 2,
          theme: 'default',
          matchBrackets: true,
          autoCloseBrackets: true,
          styleActiveLine: true,
          extraKeys: {
            'Ctrl-Enter': function(cm) {
              const container = cm.getWrapperElement().closest('.webr-container');
              const btn = container.querySelector('.webr-run-btn');
              if (btn && !btn.disabled) btn.click();
            },
            'Shift-Enter': function(cm) {
              const container = cm.getWrapperElement().closest('.webr-container');
              const btn = container.querySelector('.webr-run-btn');
              if (btn && !btn.disabled) btn.click();
            }
          }
        });
      } catch (e) {
        console.error('WebR editor init failed:', e);
        // Recover: restore the original code text and allow a retry later.
        el.innerHTML = '';
        el.textContent = code;
        delete el.dataset.cmInit;
        return;
      }
      el.classList.add('cm-initialized');
      const domIdx = [...document.querySelectorAll('.webr-editor')].indexOf(el);
      editors[domIdx] = { cm, originalCode: code, el };
    }

    // Yielding init: queue editors and init one at a time, yielding between each
    const initQueue = [];
    function processInitQueue() {
      if (initQueue.length === 0) return;
      const el = initQueue.shift();
      initEditor(el);
      // Yield to main thread before next editor
      if (initQueue.length > 0) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => processInitQueue(), { timeout: 500 });
        } else {
          setTimeout(processInitQueue, 0);
        }
      }
    }

    // Hybrid init: eagerly queue near-viewport editors, lazily observe the rest.
    // Guards against IO-never-fires edge cases (hidden tabs, pre-paint observe,
    // layout shifts from late-arriving content) that left editors dead on load.
    const allEditors = document.querySelectorAll('.webr-editor');
    const _eagerMargin = Math.max(window.innerHeight || 0, 800);
    const _lazyEditors = [];
    allEditors.forEach(el => {
      const r = el.getBoundingClientRect();
      const _inRange = (r.top - _eagerMargin) < (window.innerHeight || 0) && (r.bottom + _eagerMargin) > 0;
      if (_inRange) initQueue.push(el);
      else _lazyEditors.push(el);
    });
    if (initQueue.length > 0) processInitQueue();

    if ('IntersectionObserver' in window && _lazyEditors.length > 0) {
      const editorObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            initQueue.push(entry.target);
            editorObserver.unobserve(entry.target);
          }
        });
        if (initQueue.length > 0) processInitQueue();
      }, { rootMargin: '500px' });
      _lazyEditors.forEach(el => editorObserver.observe(el));
    } else {
      _lazyEditors.forEach(el => initQueue.push(el));
      processInitQueue();
    }

    // Scroll/resize safety net: if anything is visible but uninitialized, init it.
    // Covers cases where IO fails to fire (layout shifts, hidden-tab throttling).
    let _scrollInitTimer = 0;
    function _sweepVisibleUninit() {
      const vh = window.innerHeight || 0;
      let queued = 0;
      document.querySelectorAll('.webr-editor:not(.cm-initialized)').forEach(el => {
        if (el.dataset.cmInit) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh + 500 && r.bottom > -500) {
          initQueue.push(el);
          queued++;
        }
      });
      if (queued > 0) processInitQueue();
    }
    window.addEventListener('scroll', () => {
      if (_scrollInitTimer) return;
      _scrollInitTimer = setTimeout(() => { _scrollInitTimer = 0; _sweepVisibleUninit(); }, 200);
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (_scrollInitTimer) return;
      _scrollInitTimer = setTimeout(() => { _scrollInitTimer = 0; _sweepVisibleUninit(); }, 200);
    }, { passive: true });
    // One delayed sweep after page settles (catches post-load layout shifts).
    setTimeout(_sweepVisibleUninit, 600);
    setTimeout(_sweepVisibleUninit, 2000);

    // Track which packages are already installed in this WebR session
    const installedPkgs = new Set(['base', 'stats', 'graphics', 'grDevices', 'utils', 'datasets', 'methods']);

    // Auto-install packages needed by the code
    async function ensurePackages(code) {
      // Find library() and require() calls
      const libRegex = /(?:library|require)\\s*\\(\\s*[\"']?([a-zA-Z0-9.]+)[\"']?\\s*\\)/g;
      const needed = [];
      let match;
      while ((match = libRegex.exec(code)) !== null) {
        const pkg = match[1];
        if (!installedPkgs.has(pkg)) needed.push(pkg);
      }
      // Also intercept install.packages() calls
      const installRegex = /install\\.packages\\s*\\(\\s*[\"']([a-zA-Z0-9.]+)[\"']\\s*\\)/g;
      while ((match = installRegex.exec(code)) !== null) {
        const pkg = match[1];
        if (!installedPkgs.has(pkg)) needed.push(pkg);
      }
      if (needed.length > 0) {
        for (const pkg of needed) {
          try {
            await webR.installPackages([pkg], { quiet: true });
            installedPkgs.add(pkg);
          } catch(e) {
            console.warn('Failed to install ' + pkg + ':', e.message);
          }
        }
      }
      // Replace install.packages() with a no-op message (already installed above)
      return code.replace(/install\\.packages\\s*\\([^)]+\\)/g,
        'cat("Package already installed via WebR.\\\\n")');
    }

    // Run R code using shelter.captureR for proper output capture
    // Helper: set Run button text while preserving Ctrl+Enter shortcut hint
    function setRunBtnText(btn, text) {
      const shortcut = '<span class="webr-run-shortcut">Ctrl+Enter</span>';
      btn.innerHTML = text + ' ' + shortcut;
    }

    let _firstRunDone = false;

    window.runWebR = async function(btn) {
      // Lazy-load WebR on first run
      if (!webRReady) {
        // Show first-run hint message
        if (!_firstRunDone) {
          _firstRunDone = true;
          const container = btn.closest('.webr-container');
          const outputEl = container.querySelector('.webr-output');
          if (outputEl) {
            const hint = document.createElement('div');
            hint.className = 'webr-first-run-hint';
            hint.textContent = '\\u23f3 First run takes a few extra seconds while the R environment loads...';
            outputEl.parentNode.insertBefore(hint, outputEl);
            // Remove hint after WebR is ready (or after 15s max)
            const removeHint = () => { if (hint.parentNode) hint.remove(); };
            setTimeout(removeHint, 15000);
            const _checkReady = setInterval(() => { if (webRReady) { clearInterval(_checkReady); setTimeout(removeHint, 1500); } }, 300);
          }
        }
        if (webRLoading) {
          // Already loading — queue this button to auto-run when ready
          pendingRunBtn = btn;
          btn.disabled = true;
          setRunBtnText(btn, 'Loading R...');
          btn.classList.add('running');
          // Wait for loading to finish
          while (webRLoading && !webRReady) {
            await new Promise(r => setTimeout(r, 200));
          }
          if (!webRReady) { btn.disabled = false; setRunBtnText(btn, '\\u25b6 Run'); btn.classList.remove('running'); return; }
        } else {
          btn.disabled = true;
          setRunBtnText(btn, 'Loading R...');
          btn.classList.add('running');
          const ok = await loadAndInitWebR();
          if (!ok) { btn.disabled = false; setRunBtnText(btn, '\\u25b6 Run'); btn.classList.remove('running'); return; }
        }
      }
      if (!shelter) return;
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      // Ensure the editor for this block is initialized even if the user
      // clicked Run before the lazy IntersectionObserver fired.
      if (!editorEl.dataset.cmInit) initEditor(editorEl);
      const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
      let code = editors[idx].cm.getValue();

      btn.disabled = true;
      setRunBtnText(btn, 'Installing packages...');
      btn.classList.add('running');
      // Clear output but keep panel visible — :empty::before shows placeholder.
      // IMPORTANT: use textContent = '' (no whitespace) so :empty pseudo matches.
      outputEl.textContent = '';
      outputEl.classList.remove('has-content', 'has-error', 'has-message');
      outputEl.classList.add('is-loading');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }

      try {
        // Auto-install any needed packages before running
        code = await ensurePackages(code);
        setRunBtnText(btn, 'Running...');

        // Use shelter.captureR to properly capture stdout/stderr
        const result = await shelter.captureR(code, {
          withAutoprint: true,
          captureStreams: true,
          captureConditions: true,
          captureGraphics: { width: 700, height: 500 }
        });

        // Collect text output
        let output = '';
        if (result.output) {
          for (const line of result.output) {
            if (line.type === 'stdout' || line.type === 'stderr') {
              output += line.data.endsWith('\\n') ? line.data : line.data + '\\n';
            }
          }
        }

        // Show plot images if any
        if (result.images && result.images.length > 0 && plotEl) {
          plotEl.innerHTML = '';
          for (const img of result.images) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            plotEl.appendChild(canvas);
          }
          plotEl.classList.add('has-content');
        }

        if (output.trim()) {
          outputEl.textContent = output.trimEnd();
          outputEl.classList.add('has-content');
        } else if (!result.images || result.images.length === 0) {
          // If no text output and no plots, show the result value
          try {
            const val = await result.result.toString();
            if (val && val.trim()) {
              outputEl.textContent = val.trimEnd();
              outputEl.classList.add('has-content');
            }
          } catch(e) { /* no printable result */ }
        }

        // Purge shelter to free memory (variables persist in R global env)
        shelter.purge();
        shelter = await new webR.Shelter();

        // Track successful code run in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_code_run', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_index: idx,
            has_plot: !!(result.images && result.images.length > 0)
          });
        }

      } catch (err) {
        outputEl.textContent = 'Error: ' + err.message;
        outputEl.classList.add('has-error');
        // Track code error in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_code_error', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_index: idx,
            error_message: err.message.substring(0, 100)
          });
        }
      }

      // Fade-in effect on the output panel and focus it for screen readers.
      outputEl.classList.remove('is-loading');
      if (outputEl.textContent.length > 0) {
        outputEl.style.opacity = '0';
        requestAnimationFrame(() => { outputEl.style.opacity = '1'; });
        try { outputEl.focus({ preventScroll: true }); } catch(e) {}
      }

      btn.disabled = false;
      setRunBtnText(btn, '\\u25b6 Run');
      btn.classList.remove('running');
    };

    // Reset code to original (Reset button is hidden in PR A; kept for
    // fragment-contract + potential direct invocation).
    window.resetWebR = function(btn) {
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      if (!editorEl.dataset.cmInit) initEditor(editorEl);
      const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
      editors[idx].cm.setValue(editors[idx].originalCode);
      outputEl.textContent = '';
      outputEl.classList.remove('has-content', 'has-error', 'has-message', 'is-loading');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }
    };

    // Run all code blocks sequentially
    window.runAllWebR = async function(btn) {
      // Lazy-load WebR if not yet loaded
      if (!webRReady) {
        btn.disabled = true;
        btn.textContent = 'Loading R...';
        btn.classList.add('running');
        const ok = await loadAndInitWebR();
        if (!ok) { btn.disabled = false; btn.textContent = '\\u25b6 Run All Code Blocks'; btn.classList.remove('running'); return; }
      }
      // Track Run All in GA4
      if (typeof gtag === 'function') {
        gtag('event', 'webr_run_all', {
          event_category: 'WebR',
          event_label: document.title,
          code_block_count: document.querySelectorAll('.webr-container').length
        });
      }
      const allRunBtns = [...document.querySelectorAll('.webr-run-btn')];
      const total = allRunBtns.length;
      btn.disabled = true;

      for (let i = 0; i < total; i++) {
        btn.textContent = 'Running ' + (i + 1) + '/' + total + '...';
        btn.classList.add('running');
        const runBtn = allRunBtns[i];
        // Scroll the block into view
        runBtn.closest('.webr-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        await window.runWebR(runBtn);
      }

      btn.textContent = '\\u2705 All Done!';
      btn.classList.remove('running');
      setTimeout(() => {
        btn.textContent = '\\u25b6 Run All';
        btn.disabled = false;
      }, 2000);
    };
  </script>
  <!-- Mermaid for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad: true, theme: 'default'});</script>
"""

ENGAGEMENT_HEAD_BLOCK = '    <link rel="stylesheet" href="www/engagement.css?v=2">'
ENGAGEMENT_BODY_BLOCK = '    <script defer src="www/engagement.js?v=3"></script>'

DEFAULT_DESCRIPTION = "R Language Tutorials for Advanced Statistics"
DEFAULT_KEYWORDS = "R, Tutorial, Machine learning, Statistics, Data Mining, Analytics, Data science, Linear Regression, Logistic Regression, Time series, Forecasting"


def parse_front_matter(text):
    """Parse YAML-like front matter between --- delimiters. Returns (metadata_dict, content)."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not match:
        raise ValueError("No front matter found. Posts must start with ---")
    meta_text = match.group(1)
    content = text[match.end():]
    meta = {}
    for line in meta_text.strip().split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            v = val.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                v = v[1:-1]
            meta[key.strip()] = v
    return meta, content


def extract_faq_items(html_content):
    """Extract FAQ question-answer pairs from HTML content.

    Looks for patterns like:
    <h3>Question text?</h3> followed by <p>Answer text</p>
    within an FAQ section (after ## FAQ heading).
    """
    # Find FAQ section
    faq_match = re.search(r'<h2[^>]*>.*?FAQ.*?</h2>(.*?)(?=<h2|$)', html_content, re.DOTALL | re.IGNORECASE)
    if not faq_match:
        return []

    faq_html = faq_match.group(1)
    items = []

    # Match h3/h4 questions followed by paragraph answers
    pattern = re.compile(r'<h[34][^>]*>(.*?)</h[34]>\s*<p>(.*?)</p>', re.DOTALL)
    for m in pattern.finditer(faq_html):
        question = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        answer = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if question and answer:
            items.append((question, answer))

    return items[:10]  # Cap at 10 FAQ items


PROTECT_RE = re.compile(
    r'(<pre[\s\S]*?</pre>'
    r'|<div class="webr-editor"[\s\S]*?</div>'
    r'|<div class="mermaid"[\s\S]*?</div>'
    r'|<script[\s\S]*?</script>'
    r'|<style[\s\S]*?</style>)',
    re.IGNORECASE,
)

CALLOUT_RE = re.compile(
    r'<blockquote>\s*<p>\s*<strong>\[(TIP|NOTE|WARNING|KEY INSIGHT)\]</strong>\s*'
    r'([\s\S]*?)</blockquote>',
    re.IGNORECASE,
)
CALLOUT_CLASS = {'TIP': 'callout-tip', 'NOTE': 'callout-note',
                 'WARNING': 'callout-warning', 'KEY INSIGHT': 'callout-insight'}
CALLOUT_LABEL = {'TIP': 'Tip', 'NOTE': 'Note',
                 'WARNING': 'Warning', 'KEY INSIGHT': 'Key Insight'}


def _heal_bold_italic(seg):
    # Triple-star first so ***x*** → <strong><em>x</em></strong>
    seg = re.sub(r'\*\*\*([^\n*]+?)\*\*\*',
                 r'<strong><em>\1</em></strong>', seg)
    # Bold: single-line, first inner char must be non-star, inner may
    # contain inline tags (<code>, <a>, etc.) but not another **.
    seg = re.sub(r'\*\*([^\n*](?:(?!\*\*)[^\n])*?)\*\*',
                 r'<strong>\1</strong>', seg)
    # Italic: strict shape — first inner char letter, not touching
    # words/stars on either side, non-space ender. Keeps math like
    # *2*3*, glob *.csv, pointer *ptr from matching.
    seg = re.sub(r'(?<![*\w])\*([A-Za-z][^\n*]*?\S)\*(?!\w|\*)',
                 r'<em>\1</em>', seg)
    return seg


def heal_inline_md(body):
    parts = PROTECT_RE.split(body)
    for i in range(0, len(parts), 2):
        seg = parts[i]
        if seg is None or '*' not in seg:
            continue
        parts[i] = _heal_bold_italic(seg)
    return ''.join(p for p in parts if p is not None)


def heal_callouts(body):
    def sub(m):
        kind = m.group(1).upper()
        inner_body = m.group(2).strip()
        inner_body = re.sub(r'</p>\s*$', '', inner_body)
        return (f'<div class="callout {CALLOUT_CLASS[kind]}">'
                f'<div class="callout-label">{CALLOUT_LABEL[kind]}</div>'
                f'<div class="callout-body"><p>{inner_body}</p></div></div>')
    return CALLOUT_RE.sub(sub, body)


def heal_fragment(body):
    return heal_inline_md(heal_callouts(body))


def build_post(
    template, post_path, sidebar_map=None, prev_next_map=None,
    slug_to_subpath=None, subpath_to_slugs=None,
    post_titles=None, reading_time_cache=None,
):
    """Build a single post from its source file."""
    with open(post_path, 'r', encoding='utf-8') as f:
        raw = f.read()

    meta, content = parse_front_matter(raw)

    content = re.sub(r'^\s*\{%\s*raw\s*%\}\s*\n?', '', content)
    content = re.sub(r'\n?\s*\{%\s*endraw\s*%\}\s*$', '', content)

    healed = heal_fragment(content)
    if healed != content:
        fm_match = re.match(r'^---\s*\n.*?\n---\s*\n', raw, re.DOTALL)
        if fm_match:
            with open(post_path, 'w', encoding='utf-8') as f:
                f.write(raw[:fm_match.end()] + healed)
            print(f'  healed: {os.path.basename(post_path)}')
        content = healed

    title = meta.get('title', 'Untitled')
    mathjax = meta.get('mathjax', 'true').lower() != 'false'
    webr = meta.get('webr', 'false').lower() == 'true'
    description = meta.get('description', DEFAULT_DESCRIPTION)
    keywords = meta.get('keywords', DEFAULT_KEYWORDS)

    slug = os.path.basename(post_path)
    slug_no_ext = slug.rsplit('.', 1)[0] if '.' in slug else slug
    title_json = title.replace('\\', '\\\\').replace('"', '\\"')
    description_json = description.replace('\\', '\\\\').replace('"', '\\"')

    # Generate per-post OG image
    force_og = '--force-og' in sys.argv
    generate_og_image(title, slug_no_ext, force=force_og)

    # Date handling — use file mtime for dateModified (not today's date)
    file_mtime = datetime.date.fromtimestamp(os.path.getmtime(post_path)).isoformat()
    date_published = meta.get('date', file_mtime)
    date_modified = file_mtime

    # Determine sidebar section for breadcrumbs
    section_title = ''
    if sidebar_map:
        section_title = sidebar_map.get(slug, '')
    if not section_title:
        section_title = meta.get('sidebar_section', '')

    # Build visible breadcrumb HTML and BreadcrumbList JSON-LD
    breadcrumb_html = ''
    breadcrumb_jsonld = ''
    if section_title:
        breadcrumb_html = (
            '<nav class="breadcrumb-nav" aria-label="Breadcrumb">'
            '<a href="/">Home</a> <span class="breadcrumb-sep">&rsaquo;</span> '
            f'<span>{section_title}</span> <span class="breadcrumb-sep">&rsaquo;</span> '
            f'<span class="breadcrumb-current">{title}</span>'
            '</nav>'
        )
        section_json = section_title.replace('\\', '\\\\').replace('"', '\\"')
        breadcrumb_jsonld = f'''    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://r-statistics.co/"}},
        {{"@type": "ListItem", "position": 2, "name": "{section_json}", "item": "https://r-statistics.co/"}},
        {{"@type": "ListItem", "position": 3, "name": "{title_json}", "item": "https://r-statistics.co/{slug}"}}
      ]
    }}
    </script>'''
    else:
        # Minimal 2-level breadcrumb for pages not in sidebar
        breadcrumb_html = (
            '<nav class="breadcrumb-nav" aria-label="Breadcrumb">'
            '<a href="/">Home</a> <span class="breadcrumb-sep">&rsaquo;</span> '
            f'<span class="breadcrumb-current">{title}</span>'
            '</nav>'
        )
        breadcrumb_jsonld = f'''    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://r-statistics.co/"}},
        {{"@type": "ListItem", "position": 2, "name": "{title_json}", "item": "https://r-statistics.co/{slug}"}}
      ]
    }}
    </script>'''

    # Extract FAQ section for FAQPage schema
    faqpage_jsonld = ''
    faq_items = extract_faq_items(content)
    if faq_items:
        faq_entries = ',\n      '.join([
            '{{"@type": "Question", "name": "{q}", "acceptedAnswer": {{"@type": "Answer", "text": "{a}"}}}}'.format(
                q=q.replace('\\', '\\\\').replace('"', '\\"'),
                a=a.replace('\\', '\\\\').replace('"', '\\"')
            ) for q, a in faq_items
        ])
        faqpage_jsonld = f'''    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
      {faq_entries}
      ]
    }}
    </script>'''

    # Prepend breadcrumb to content, append related tutorials + prev/next nav
    prev_next_html = render_prev_next(slug, prev_next_map) if prev_next_map else ''
    related_html = ''
    if slug_to_subpath is not None:
        related_html = render_related_tutorials(
            slug, meta, slug_to_subpath, subpath_to_slugs or {},
            sidebar_map or {}, post_titles or {}, reading_time_cache or {},
        )
    content_with_breadcrumb = breadcrumb_html + '\n' + content
    if related_html:
        content_with_breadcrumb = content_with_breadcrumb + '\n' + related_html
    if prev_next_html:
        content_with_breadcrumb = content_with_breadcrumb + '\n' + prev_next_html

    page_html = template
    page_html = page_html.replace('{{TITLE}}', title)
    page_html = page_html.replace('{{TITLE_JSON}}', title_json)
    page_html = page_html.replace('{{DESCRIPTION}}', description)
    page_html = page_html.replace('{{DESCRIPTION_JSON}}', description_json)
    page_html = page_html.replace('{{KEYWORDS}}', keywords)
    page_html = page_html.replace('{{SLUG}}', slug)
    page_html = page_html.replace('{{SLUG_NO_EXT}}', slug_no_ext)
    page_html = page_html.replace('{{DATE_PUBLISHED}}', date_published)
    page_html = page_html.replace('{{DATE_MODIFIED}}', date_modified)
    page_html = page_html.replace('{{BREADCRUMB_JSONLD}}', breadcrumb_jsonld)
    page_html = page_html.replace('{{FAQPAGE_JSONLD}}', faqpage_jsonld)
    page_html = page_html.replace('{{CONTENT}}', content_with_breadcrumb)
    page_html = page_html.replace('{{MATHJAX}}', MATHJAX_BLOCK if mathjax else '')
    page_html = page_html.replace('{{WEBR_HEAD}}', WEBR_HEAD_BLOCK if webr else '')
    page_html = page_html.replace('{{WEBR_BODY}}', WEBR_BODY_BLOCK if webr else '')
    page_html = page_html.replace('{{ENGAGEMENT_HEAD}}', ENGAGEMENT_HEAD_BLOCK if webr else '')
    page_html = page_html.replace('{{ENGAGEMENT_BODY}}', ENGAGEMENT_BODY_BLOCK if webr else '')

    return page_html


def update_sitemap(filenames):
    """Add or update entries in sitemap.xml with per-file modification dates."""
    if not os.path.exists(SITEMAP_PATH):
        return

    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        sitemap = f.read()

    added = []
    updated = []

    for fname in filenames:
        url = f"https://r-statistics.co/{fname}"
        post_path = os.path.join(POSTS_DIR, fname)
        if os.path.exists(post_path):
            file_date = datetime.date.fromtimestamp(os.path.getmtime(post_path)).isoformat()
        else:
            file_date = datetime.date.today().isoformat()

        if url not in sitemap:
            entry = f"""  <url>
    <loc>{url}</loc>
    <changefreq>monthly</changefreq>
    <lastmod>{file_date}</lastmod>
    <priority>0.8</priority>
  </url>
"""
            sitemap = sitemap.replace('</urlset>', entry + '</urlset>')
            added.append(fname)
        else:
            # Update existing lastmod
            pattern = re.compile(
                r'(<loc>' + re.escape(url) + r'</loc>\s*\n\s*<changefreq>\w+</changefreq>\s*\n\s*<lastmod>)\d{4}-\d{2}-\d{2}(</lastmod>)'
            )
            new_sitemap = pattern.sub(r'\g<1>' + file_date + r'\2', sitemap)
            if new_sitemap != sitemap:
                sitemap = new_sitemap
                updated.append(fname)

    if added or updated:
        with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
            f.write(sitemap)
        for fname in added:
            print(f"  Sitemap: added {fname}")
        if updated:
            print(f"  Sitemap: updated lastmod for {len(updated)} entries")


def generate_feed(post_files):
    """Generate an Atom feed from all posts."""
    feed_path = os.path.join(REPO_ROOT, 'feed.xml')
    today = datetime.date.today().isoformat() + 'T00:00:00Z'

    entries = []
    for post_file in sorted(post_files, reverse=True):
        post_path = os.path.join(POSTS_DIR, post_file)
        with open(post_path, 'r', encoding='utf-8') as f:
            raw = f.read()
        meta, _ = parse_front_matter(raw)
        title = meta.get('title', 'Untitled')
        desc = meta.get('description', '')
        date = meta.get('date', datetime.date.today().isoformat())
        # Escape XML
        title_xml = title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        desc_xml = desc.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        url = f'https://r-statistics.co/{post_file}'
        entries.append(f"""  <entry>
    <title>{title_xml}</title>
    <link href="{url}"/>
    <id>{url}</id>
    <updated>{date}T00:00:00Z</updated>
    <summary>{desc_xml}</summary>
    <author><name>Selva Prabhakaran</name></author>
  </entry>""")

    feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>r-statistics.co</title>
  <subtitle>R programming tutorials for advanced statistics, machine learning, and data visualization</subtitle>
  <link href="https://r-statistics.co/"/>
  <link href="https://r-statistics.co/feed.xml" rel="self" type="application/atom+xml"/>
  <id>https://r-statistics.co/</id>
  <updated>{today}</updated>
  <author><name>Selva Prabhakaran</name></author>
{chr(10).join(entries)}
</feed>
"""
    with open(feed_path, 'w', encoding='utf-8') as f:
        f.write(feed)
    print(f"  Feed: {len(entries)} entries written to feed.xml")


def _mtime_or_zero(path):
    """Return file mtime or 0 if the file doesn't exist."""
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0


def main():
    # Flags:
    #   --full           Rebuild every page regardless of mtimes
    #   --only <name>    Rebuild only the given fragment (slug or filename)
    force_full = '--full' in sys.argv
    only_target = None
    if '--only' in sys.argv:
        idx = sys.argv.index('--only')
        if idx + 1 < len(sys.argv):
            only_target = sys.argv[idx + 1]
            # Normalize: accept slug, slug.html, or _posts/slug.html
            only_target = os.path.basename(only_target)
            if not only_target.endswith('.html'):
                only_target += '.html'

    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    if not os.path.exists(POSTS_DIR):
        print("No _posts/ directory found.")
        return

    post_files = [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')]
    if not post_files:
        print("No posts found in _posts/")
        return

    sidebar_map = load_sidebar_map()
    prev_next_map = load_prev_next_map()
    slug_to_subpath, subpath_to_slugs = load_curriculum_siblings()
    post_titles = load_post_titles()
    reading_time_cache = {}

    # "Global" dependencies — when any of these changes, every page must rebuild
    # because the change affects every output. sidebar.json feeds into every
    # page's nav; template.html is embedded in every page; build.py changes
    # mean the generation logic itself changed.
    global_deps_mtime = max(
        _mtime_or_zero(TEMPLATE_PATH),
        _mtime_or_zero(SIDEBAR_PATH),
        _mtime_or_zero(os.path.abspath(__file__)),
    )

    if only_target:
        if only_target not in post_files:
            print(f"ERROR: --only target '{only_target}' not found in _posts/")
            sys.exit(1)
        targets = [only_target]
    else:
        targets = sorted(post_files)

    built = []
    skipped = 0
    for post_file in targets:
        post_path = os.path.join(POSTS_DIR, post_file)
        output_path = os.path.join(REPO_ROOT, post_file)

        # Decide whether to rebuild
        needs_build = force_full or only_target is not None
        if not needs_build:
            out_mtime = _mtime_or_zero(output_path)
            if out_mtime == 0:
                needs_build = True  # output missing
            else:
                frag_mtime = _mtime_or_zero(post_path)
                if frag_mtime > out_mtime or global_deps_mtime > out_mtime:
                    needs_build = True

        if not needs_build:
            skipped += 1
            continue

        page_html = build_post(
            template, post_path, sidebar_map, prev_next_map,
            slug_to_subpath, subpath_to_slugs, post_titles, reading_time_cache,
        )
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_html)
        print(f"Built: {post_file}")
        built.append(post_file)

    # Post-build sanity check: re-run the healer across all fragments and
    # warn on any residual drift. The healer is idempotent, so a clean
    # build should emit zero warnings.
    leftover = 0
    for p in sorted(post_files):
        with open(p, encoding='utf-8') as f:
            body = f.read()
        if heal_fragment(body) != body:
            leftover += 1
            print(f'  WARN leftover drift: {os.path.basename(p)}')
    if leftover:
        print(f'  WARN: {leftover} fragment(s) still drift after heal')

    # Sitemap and feed always regenerate from the full post_files list —
    # they are cheap and must stay in sync with what actually exists on disk.
    update_sitemap(sorted(post_files))
    generate_feed(sorted(post_files))

    if only_target:
        print(f"\nDone. 1 page built (--only {only_target}).")
    elif force_full:
        print(f"\nDone. {len(built)} page(s) built (--full).")
    else:
        print(f"\nDone. {len(built)} page(s) built, {skipped} skipped (up-to-date).")


if __name__ == '__main__':
    main()

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
  <script type="text/javascript" async
    src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
  </script>
"""

WEBR_HEAD_BLOCK = """
    <!-- CodeMirror critical inline CSS — gutter measurement needs these BEFORE
         CM5 JS runs; the deferred external CSS arrives too late. -->
    <style>
      .CodeMirror-gutters{position:absolute;left:0;top:0;min-height:100%;z-index:3;background:#020617;border-right:none;padding-right:10px}
      .CodeMirror-gutter{white-space:normal;height:100%;display:inline-block;vertical-align:top;margin-bottom:-50px}
      .CodeMirror-gutter-elt{position:absolute;cursor:default;z-index:4}
      .CodeMirror-linenumber{padding:0 3px 0 5px;min-width:20px;text-align:right;color:#6e7681;white-space:nowrap;font-size:14px}
    </style>
    <!-- WebR Interactive R Code — external CSS deferred (non-render-blocking) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css"></noscript>
    <link rel="stylesheet" href="www/webr.css?v=2" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="www/webr.css?v=2"></noscript>
"""

WEBR_BODY_BLOCK = """
  <!-- WebR Engine — CodeMirror deferred to avoid blocking -->
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/r/r.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/mode/overlay.min.js"></script>
  <script type="module" src="www/webr-init.js?v=2"></script>
  <!-- Mermaid for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad: true, theme: 'default'});</script>
"""

ENGAGEMENT_HEAD_BLOCK = '    <link rel="stylesheet" href="www/engagement.css?v=2" media="print" onload="this.media=\'all\'">\n    <noscript><link rel="stylesheet" href="www/engagement.css?v=2"></noscript>'
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

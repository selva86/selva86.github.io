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
import hashlib
import urllib.request

# Paths relative to repo root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TEMPLATE_PATH = os.path.join(SCRIPT_DIR, "template.html")
POSTS_DIR = os.path.join(REPO_ROOT, "_posts")
SITEMAP_PATH = os.path.join(REPO_ROOT, "sitemap.xml")
SIDEBAR_PATH = os.path.join(REPO_ROOT, "www", "sidebar.json")
OG_DIR = os.path.join(REPO_ROOT, "screenshots", "og")
VENDOR_DIR = os.path.join(REPO_ROOT, "www", "vendor")

# Vendor assets to self-host (downloaded once, then served locally).
# Empty after CodeMirror was removed. CodeJar + Prism are vendored by hand
# (see www/vendor/) and concatenated into editor-bundle.min.js at build time.
VENDOR_ASSETS = {}

# Pre-vendored editor libraries that get concatenated into the single
# editor-bundle.min.js served on interactive pages. Sources are already
# minified; build_editor_bundle() only prepends a preamble and concats.
EDITOR_BUNDLE_SOURCES = [
    'prism-1.29.0.min.js',
    'prism-r-1.29.0.min.js',
    'codejar-4.2.0.min.js',
]
EDITOR_BUNDLE_NAME = 'editor-bundle.min.js'
# Prism would auto-highlight every <code class="language-*"> on DOMContentLoaded.
# We call Prism.highlight() manually from webr-init.js, so disable auto mode.
EDITOR_BUNDLE_PREAMBLE = 'window.Prism=window.Prism||{};window.Prism.manual=true;'


def file_content_hash(filepath, length=8):
    """First `length` hex chars of MD5 of file content."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()[:length]
    except OSError:
        return ''


# ---------------------------------------------------------------------------
# Build-time syntax highlighting for <div class="webr-editor"> blocks.
#
# Readers see colored, line-numbered R code from the first paint. When the
# reader clicks the block, webr-init.js swaps the static markup for a
# CodeJar-managed contenteditable div — Prism repaints the same token palette
# on every keystroke, so colors and line numbers stay visible while editing.
# ---------------------------------------------------------------------------
try:
    import html as _html_mod
    from pygments import highlight as _pyg_highlight
    from pygments.lexers import get_lexer_by_name as _pyg_get_lexer
    from pygments.formatters import HtmlFormatter as _PygHtmlFormatter
    _R_LEXER = _pyg_get_lexer('r')
    _R_FORMATTER = _PygHtmlFormatter(nowrap=True)
    _PYGMENTS_AVAILABLE = True
except ImportError:
    _PYGMENTS_AVAILABLE = False

_WEBR_EDITOR_RE = re.compile(
    r'(<div class="webr-editor"[^>]*>)([\s\S]*?)(</div>)',
    re.IGNORECASE,
)


# Classes Pygments emits that we don't style (whitespace, default-color
# punctuation/names). Unwrapping them is safe and cuts ~10-15 KB on a
# typical tutorial page.
_PYG_NO_STYLE_RE = re.compile(r'<span class="(?:w|p|n|nn|nx|nl)">([^<]*)</span>')


def _pygmentize_editor(match):
    """Pygments-highlight the R code inside a .webr-editor block and wrap
    each line in <span class="cl"> for CSS-driven line numbering.

    Strips the zero-value span wrappers Pygments emits for whitespace (.w)
    and un-colored punctuation (.p) — the parent has `white-space: pre` so
    raw whitespace paints identically, and .p maps to the default color in
    CSS. Dropping these wrappers reduces the per-page HTML by ~30-50 KB on
    tutorials with many code blocks."""
    open_tag = match.group(1)
    body = match.group(2)
    close_tag = match.group(3)
    raw = _html_mod.unescape(body).strip('\n\r')
    if not raw:
        return match.group(0)
    try:
        highlighted = _pyg_highlight(raw, _R_LEXER, _R_FORMATTER).rstrip('\n')
    except Exception:
        return match.group(0)  # on any failure, leave the block untouched
    highlighted = _PYG_NO_STYLE_RE.sub(r'\1', highlighted)
    lines = highlighted.split('\n')
    wrapped = '\n'.join(f'<span class="cl">{ln}</span>' for ln in lines)
    return f'{open_tag}{wrapped}{close_tag}'


def pygmentize_webr_editors(content):
    """Replace raw R inside every .webr-editor with Pygments-highlighted
    spans. No-op if Pygments isn't installed or no editor blocks exist."""
    if not _PYGMENTS_AVAILABLE or 'webr-editor' not in content:
        return content
    return _WEBR_EDITOR_RE.sub(_pygmentize_editor, content)


def ensure_vendor_assets():
    """Download vendor files if missing. Idempotent."""
    os.makedirs(VENDOR_DIR, exist_ok=True)
    for filename, url in VENDOR_ASSETS.items():
        path = os.path.join(VENDOR_DIR, filename)
        if os.path.exists(path):
            continue
        print(f"  Downloading {filename} ...")
        urllib.request.urlretrieve(url, path)
        print(f"  Saved: {path} ({os.path.getsize(path):,} bytes)")


def build_editor_bundle():
    """Concatenate pre-minified CodeJar + Prism into a single editor bundle.

    Idempotent — rebuilds only if any source is newer than the bundle. Writes
    to www/editor-bundle.min.js. Returns the absolute path.
    """
    out_path = os.path.join(REPO_ROOT, 'www', EDITOR_BUNDLE_NAME)
    src_paths = [os.path.join(VENDOR_DIR, name) for name in EDITOR_BUNDLE_SOURCES]
    missing = [p for p in src_paths if not os.path.exists(p)]
    if missing:
        print(f"  WARN: editor bundle sources missing: {missing}")
        return out_path
    # Skip if the bundle is already newer than every source.
    if os.path.exists(out_path):
        out_mtime = os.path.getmtime(out_path)
        if all(os.path.getmtime(p) <= out_mtime for p in src_paths):
            return out_path
    parts = [EDITOR_BUNDLE_PREAMBLE]
    for p in src_paths:
        with open(p, 'r', encoding='utf-8') as f:
            parts.append(f.read().rstrip())
    # Trailing semicolons guard against an IIFE running into the next script.
    bundle = '\n;\n'.join(parts) + '\n'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(bundle)
    print(f"  Built {EDITOR_BUNDLE_NAME}: {os.path.getsize(out_path):,} bytes")
    return out_path


def minify_assets(force=False):
    """Create .min. siblings for own JS/CSS. Returns {basename: final_abs_path}.

    Idempotent: skips re-minifying when the .min file already exists and is
    newer than its source. Pass force=True to override (e.g. on --full builds)
    so the .min content is guaranteed to reflect the current minifier output.

    Why this matters: build.py uses the .min file mtimes as part of its
    "global deps" mtime check. If we re-write every .min on every build, the
    global_deps_mtime is always "now" and incremental rebuild collapses to
    full rebuild. The skip below is what makes incremental work in practice.
    """
    try:
        import rjsmin
        js_min = rjsmin.jsmin
    except ImportError:
        js_min = None
    try:
        import csscompressor
        css_min = csscompressor.compress
    except ImportError:
        css_min = None

    if not js_min and not css_min:
        print("  Minification skipped (pip install rjsmin csscompressor)")

    own_js = [
        os.path.join(REPO_ROOT, 'www', 'toc.js'),
        os.path.join(REPO_ROOT, 'www', 'webr-init.js'),
        os.path.join(REPO_ROOT, 'www', 'engagement.js'),
    ]
    own_css = [
        os.path.join(REPO_ROOT, 'css', 'main.css'),
        os.path.join(REPO_ROOT, 'www', 'webr.css'),
        os.path.join(REPO_ROOT, 'www', 'engagement.css'),
        os.path.join(REPO_ROOT, 'www', 'highlight.css'),
    ]

    def _is_fresh(min_path, src_path):
        if force or not os.path.exists(min_path):
            return False
        try:
            return os.path.getmtime(min_path) >= os.path.getmtime(src_path)
        except OSError:
            return False

    final = {}
    for path in own_js:
        base, ext = os.path.splitext(path)
        min_path = base + '.min' + ext
        basename = os.path.basename(path)
        if _is_fresh(min_path, path):
            final[basename] = min_path
            continue
        if js_min:
            try:
                src = open(path, 'r', encoding='utf-8').read()
                out = js_min(src)
                open(min_path, 'w', encoding='utf-8').write(out)
                saved = len(src.encode('utf-8')) - len(out.encode('utf-8'))
                print(f"  Minified {basename}: saved {saved:,} bytes")
                final[basename] = min_path
                continue
            except Exception as e:
                print(f"  WARN: {basename} minification failed: {e}")
        final[basename] = path

    for path in own_css:
        base, ext = os.path.splitext(path)
        min_path = base + '.min' + ext
        basename = os.path.basename(path)
        if _is_fresh(min_path, path):
            final[basename] = min_path
            continue
        if css_min:
            try:
                src = open(path, 'r', encoding='utf-8').read()
                out = css_min(src)
                open(min_path, 'w', encoding='utf-8').write(out)
                saved = len(src.encode('utf-8')) - len(out.encode('utf-8'))
                print(f"  Minified {basename}: saved {saved:,} bytes")
                final[basename] = min_path
                continue
            except Exception as e:
                print(f"  WARN: {basename} minification failed: {e}")
        final[basename] = path

    return final


def compute_asset_hrefs(final_paths):
    """Build {logical_key: 'relative/path.min.ext?h=abcd1234'} dict for template injection."""
    # Map logical keys to their final absolute paths
    asset_final_paths = {
        'main.css': final_paths.get('main.css', os.path.join(REPO_ROOT, 'css', 'main.css')),
        'toc.js': final_paths.get('toc.js', os.path.join(REPO_ROOT, 'www', 'toc.js')),
        'webr.css': final_paths.get('webr.css', os.path.join(REPO_ROOT, 'www', 'webr.css')),
        'webr-init.js': final_paths.get('webr-init.js', os.path.join(REPO_ROOT, 'www', 'webr-init.js')),
        'editor-bundle.js': os.path.join(REPO_ROOT, 'www', EDITOR_BUNDLE_NAME),
        'engagement.css': final_paths.get('engagement.css', os.path.join(REPO_ROOT, 'www', 'engagement.css')),
        'engagement.js': final_paths.get('engagement.js', os.path.join(REPO_ROOT, 'www', 'engagement.js')),
        'highlight.css': final_paths.get('highlight.css', os.path.join(REPO_ROOT, 'www', 'highlight.css')),
        'bootstrap.min.css': os.path.join(REPO_ROOT, 'www', 'bootstrap.min.css'),
    }

    asset_hashes = {k: file_content_hash(v) for k, v in asset_final_paths.items()}

    asset_hrefs = {}
    for key, path in asset_final_paths.items():
        rel = os.path.relpath(path, REPO_ROOT).replace('\\', '/')
        h = asset_hashes.get(key, '')
        asset_hrefs[key] = f"{rel}?h={h}" if h else rel

    return asset_hrefs, asset_final_paths


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


def load_sidebar_sections():
    """Load sidebar.json and return the raw list of sections (or [])."""
    if not os.path.exists(SIDEBAR_PATH):
        return []
    with open(SIDEBAR_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_sidebar_map():
    """Load sidebar.json and build a slug -> section_title lookup."""
    sections = load_sidebar_sections()
    mapping = {}
    for section in sections:
        title = section.get('title', '')
        for item in section.get('items', []):
            if item.get('divider'):
                continue
            mapping[item['href']] = title
    return mapping


def _esc_html(s):
    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


# Inline monochrome icons for the sidebar Tools tab. 16x16 viewBox, single
# stroke colour via currentColor, kept tiny so they don't bloat every page.
_TOOL_ICONS = {
    'ab-test-calculator.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<rect x="2.5" y="3.5" width="4" height="9" rx="0.5"/>'
        '<rect x="9.5" y="3.5" width="4" height="9" rx="0.5"/></svg>',
    'confidence-interval-calculator.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M3.5 4v8M3.5 4H5M3.5 12H5"/>'
        '<circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/>'
        '<path d="M12.5 4v8M12.5 4H11M12.5 12H11"/></svg>',
    'effect-size-converter.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2.5 5.5h11M11 3l2.5 2.5L11 8"/>'
        '<path d="M13.5 10.5h-11M5 8l-2.5 2.5L5 13"/></svg>',
    'power-analysis.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M9 2L4 9h3.5L7 14l5-7H8.5z"/></svg>',
    'z-score-percentile.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2 13c2 0 3-1 4-3s1.5-6 2-6 .5 6 2 6 2.5 0 4 0"/>'
        '<path d="M2 13.5h12"/></svg>',
    'confusion-matrix-interpreter.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<rect x="2.5" y="2.5" width="4.5" height="4.5"/>'
        '<rect x="9" y="2.5" width="4.5" height="4.5"/>'
        '<rect x="2.5" y="9" width="4.5" height="4.5"/>'
        '<rect x="9" y="9" width="4.5" height="4.5"/></svg>',
    'lm-output-interpreter.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2 13.5L14 3"/>'
        '<circle cx="4" cy="11.5" r="1" fill="currentColor" stroke="none"/>'
        '<circle cx="7.5" cy="9" r="1" fill="currentColor" stroke="none"/>'
        '<circle cx="11" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    'glm-output-interpreter.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2 13C5 13 5 3 8 3s3 10 6 10"/>'
        '<path d="M2 13.5h12"/></svg>',
    'multiple-testing-correction.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2.5 4l2 2 3-3M2.5 8l2 2 3-3M2.5 12l2 2 3-3"/>'
        '<path d="M10.5 4h3M10.5 8h3M10.5 12h3"/></svg>',
    'normality-test-picker.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2 13c2 0 3-1 4-3s1.5-6 2-6 .5 6 2 6 2.5 0 4 0"/>'
        '<circle cx="13" cy="4" r="1.6" fill="currentColor" stroke="none"/></svg>',
    'type-i-ii-error-visualizer.html':
        '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<path d="M2 12c1.5 0 2-2 3.5-2S7 12 8 12s2-8 3.5-8S13 12 14.5 12"/>'
        '<line x1="8" y1="2" x2="8" y2="14" stroke-dasharray="2 2"/></svg>',
}


# Sidebar Tools tab — interactive calculators / interpreters.
# Each entry maps a tool slug to a sidebar group + display title.
# Update here when adding new tools (also drop the HTML into /tools/).
COMPENDIUM_TOOLS = [
    # Calculators (parametric tests + commodity stats)
    {'group': 'Calculators', 'slug': 'ab-test-calculator.html',                  'text': 'A/B Test Calculator'},
    {'group': 'Calculators', 'slug': 't-test-calculator.html',                   'text': 't-Test Calculator'},
    {'group': 'Calculators', 'slug': 'chi-square-calculator.html',               'text': 'Chi-Square Test'},
    {'group': 'Calculators', 'slug': 'confidence-interval-calculator.html',      'text': 'Confidence Interval'},
    {'group': 'Calculators', 'slug': 'bootstrap-ci-calculator.html',             'text': 'Bootstrap CI'},
    {'group': 'Calculators', 'slug': 'effect-size-converter.html',               'text': 'Effect Size Converter'},
    {'group': 'Calculators', 'slug': 'power-analysis.html',                      'text': 'Power Analysis'},
    {'group': 'Calculators', 'slug': 'survival-power-calculator.html',           'text': 'Survival Power'},
    {'group': 'Calculators', 'slug': 'type-i-ii-error-visualizer.html',          'text': 'Type I / II Error'},
    {'group': 'Calculators', 'slug': 'z-score-percentile.html',                  'text': 'Z-Score &amp; Percentile'},
    {'group': 'Calculators', 'slug': 'equivalence-noninferiority-calculator.html', 'text': 'Equivalence / NI'},
    {'group': 'Calculators', 'slug': 'outlier-detection-calculator.html',        'text': 'Outlier Detection'},
    {'group': 'Calculators', 'slug': 'roc-auc-calculator.html',                  'text': 'ROC / AUC'},

    # Bayesian
    {'group': 'Bayesian',    'slug': 'bayes-theorem-calculator.html',            'text': 'Bayes Theorem'},
    {'group': 'Bayesian',    'slug': 'bayes-factor-calculator.html',             'text': 'Bayes Factor'},

    # Interpreters (paste R output, get plain-English read)
    {'group': 'Interpreters', 'slug': 'lm-output-interpreter.html',              'text': 'lm() Output'},
    {'group': 'Interpreters', 'slug': 'glm-output-interpreter.html',             'text': 'glm() Output'},
    {'group': 'Interpreters', 'slug': 'anova-output-interpreter.html',           'text': 'ANOVA Output'},
    {'group': 'Interpreters', 'slug': 'vif-interpreter.html',                    'text': 'VIF / Multicollinearity'},
    {'group': 'Interpreters', 'slug': 'confusion-matrix-interpreter.html',       'text': 'Confusion Matrix'},
    {'group': 'Interpreters', 'slug': 'diagnostic-plot-interpreter.html',        'text': 'Diagnostic Plots'},

    # Pickers (which test should I use?)
    {'group': 'Pickers',      'slug': 'normality-test-picker.html',              'text': 'Normality Test'},
    {'group': 'Pickers',      'slug': 'nonparametric-test-picker.html',          'text': 'Non-Parametric Test'},
    {'group': 'Pickers',      'slug': 'multiple-testing-correction.html',        'text': 'Multiple Testing'},

    # Time series + utilities
    {'group': 'Time series',  'slug': 'ts-stationarity-calculator.html',         'text': 'TS Stationarity'},

    # Causal + reproducibility
    {'group': 'Utilities',    'slug': 'dag-confounder-picker.html',              'text': 'DAG Confounder Picker'},
    {'group': 'Utilities',    'slug': 'reprex-builder.html',                     'text': 'Reprex Builder'},
]


def _render_tools_panel(current_slug):
    """Render the Tools panel content for the sidebar's Tools tab.

    `current_slug` is the path-stripped filename. When a /tools/<slug>.html
    page is being rendered, we mark that tool as active. For non-tool pages,
    no item is active and the user lands on the Posts tab by default.
    """
    # Normalize current_slug: strip leading /tools/ if present.
    cur = (current_slug or '').replace('tools/', '')
    parts = ['<ul class="sidebar-tools-list list-unstyled">']
    last_group = None
    for tool in COMPENDIUM_TOOLS:
        if tool['group'] != last_group:
            parts.append(
                f'<li class="sidebar-divider"><span class="subsec-chevron">&#9660;</span> {_esc_html(tool["group"])}</li>'
            )
            last_group = tool['group']
        active_attr = ' class="active"' if tool['slug'] == cur else ''
        icon = _TOOL_ICONS.get(tool['slug'], '')
        parts.append(
            f'<li><a href="/tools/{tool["slug"]}"{active_attr}>'
            f'<span class="tool-icon">{icon}</span>'
            f'<span class="tool-label">{tool["text"]}</span>'
            f'</a></li>'
        )
    parts.append('</ul>')
    return ''.join(parts)


def render_sidebar_html(sections, current_slug):
    """Render the sidebar markup at build time.

    Mirrors the structure toc.js used to build client-side, minus per-user
    state (visited dots, collapsed subsections). toc.js applies that state
    from localStorage on load so the static markup stays the same for every
    visitor (good for caching and for Ezoic, which strips external JS).

    Sidebar is split into two tab panels — Posts (the curriculum) and
    Tools (interactive calculators). The active panel is chosen at runtime
    by toc.js based on URL path + the user's last-pinned tab.
    """
    if not sections:
        return ''

    rendered_sections = []
    has_active_section = False
    for i, section in enumerate(sections):
        items = section.get('items') or []
        if not items:
            continue
        section_active = any(
            (not it.get('divider')) and it.get('href') == current_slug
            for it in items
        )
        if section_active:
            has_active_section = True
        rendered_sections.append((i, section, items, section_active))

    if not has_active_section and rendered_sections:
        # Match toc.js fallback: expand the first section when no item is active.
        i0, sec0, items0, _ = rendered_sections[0]
        rendered_sections[0] = (i0, sec0, items0, True)

    is_tools_page = (current_slug or '').startswith('tools/')

    parts = []
    # Continue-Reading chip lives ABOVE the tab strip so it's always
    # visible regardless of which panel is active. It's a page-pointer,
    # not panel-content.
    parts.append(
        '<div class="continue-chip" data-continue-chip>'
        '<span class="chip-label">Continue reading</span>'
        '<a href="#" data-continue-link></a>'
        '</div>'
    )

    # Posts/Tools tab strip — underline style. Active tab's bottom border
    # erases the strip's bottom border so the active tab reads as one
    # continuous unit with the panel below it.
    posts_tab_class = 'sidebar-tab' + ('' if is_tools_page else ' active')
    tools_tab_class = 'sidebar-tab' + (' active' if is_tools_page else '')
    # onclick handlers inline because Ezoic Leap strips both <script src> and
    # inline <script> blocks on tutorial/index pages; HTML attributes survive.
    onclick = (
        "var n=this.dataset.tab;"
        "document.querySelectorAll('.sidebar-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab===n)});"
        "document.querySelectorAll('.sidebar-panel').forEach(function(p){p.classList.toggle('active',p.dataset.panel===n)});"
        "try{localStorage.setItem('rstat_sidebar_tab',n)}catch(e){}"
    )
    parts.append('<div class="sidebar-tabs" role="tablist">')
    parts.append(f'<button class="{posts_tab_class}" data-tab="posts" type="button" role="tab" onclick="{onclick}">Posts</button>')
    parts.append(f'<button class="{tools_tab_class}" data-tab="tools" type="button" role="tab" onclick="{onclick}">Tools</button>')
    parts.append('</div>')

    posts_panel_class = 'sidebar-panel' + ('' if is_tools_page else ' active')
    tools_panel_class = 'sidebar-panel' + (' active' if is_tools_page else '')

    parts.append(f'<div class="{posts_panel_class}" data-panel="posts">')
    parts.append('<ul class="sidebar-menu list-unstyled">')
    for i, section, items, section_active in rendered_sections:
        sec_class = 'sidebar-section expanded' if section_active else 'sidebar-section'
        title = _esc_html(section.get('title', ''))
        parts.append(f'<li class="{sec_class}">')
        parts.append('<div class="sidebar-section-header">')
        parts.append(
            f'<span class="sidebar-chevron">&#9656;</span> {title}'
            f'<span class="section-meta" data-section-meta></span>'
        )
        parts.append('</div>')
        parts.append('<ul class="sidebar-section-items list-unstyled">')

        sub_idx = 0
        for item in items:
            if item.get('divider'):
                sub_idx += 1
                sub_key = f'sec{i}sub{sub_idx}'
                text = _esc_html(item.get('text', ''))
                parts.append(
                    f'<li class="sidebar-divider sidebar-subsection-toggle" '
                    f'data-subkey="{sub_key}" data-collapsed="false">'
                    f'<span class="subsec-chevron">&#9660;</span> {text}</li>'
                )
                continue
            raw_href = item.get('href', '')
            # Make href absolute (root-relative) so it resolves correctly when
            # the sidebar is injected into pages at non-root paths (e.g.
            # /tools/<slug>.html). Posts live at root, so a leading '/' fixes
            # the resolution.
            if raw_href and not raw_href.startswith(('/', 'http://', 'https://', '#')):
                raw_href = '/' + raw_href
            href = _esc_html(raw_href)
            text = _esc_html(item.get('text', ''))
            cur_sub_key = f'sec{i}sub{sub_idx}'
            is_active = item.get('href') == current_slug
            active_attr = ' class="active"' if is_active else ''
            parts.append(f'<li data-subkey="{cur_sub_key}">')
            parts.append(
                f'<a href="{href}"{active_attr}>'
                f'<span class="progress-dot"></span>{text}</a></li>'
            )
        parts.append('</ul></li>')
    parts.append('</ul>')

    parts.append('<div class="sidebar-subscribe">')
    parts.append(
        '<p>Stay up-to-date. '
        '<a href="https://docs.google.com/forms/d/1xkMYkLNFU9U39Dd8S_2JC0p8B5t6_Yq6zUQjanQQJpY/viewform">Subscribe!</a></p>'
    )
    parts.append(
        '<p><a href="https://docs.google.com/forms/d/13GrkCFcNa-TOIllQghsz2SIEbc-YqY9eJX02B19l5Ow/viewform">Chat!</a></p>'
    )
    parts.append('</div>')
    parts.append('</div>')  # close posts panel

    # Tools panel
    parts.append(f'<div class="{tools_panel_class}" data-panel="tools">')
    parts.append(_render_tools_panel(current_slug))
    parts.append('</div>')

    return ''.join(parts)


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
      tex2jax: {
        inlineMath: [['$','$'], ['\\\\(','\\\\)']],
        displayMath: [['$$','$$'], ['\\\\[','\\\\]']],
        processEscapes: true
      }
    });
  </script>
  <script type="text/javascript" async
    src="https://cdn.jsdelivr.net/npm/mathjax@2/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
  </script>
"""


def _format_byline_date(iso):
    try:
        d = datetime.date.fromisoformat(iso)
        return d.strftime('%B ') + str(d.day) + d.strftime(', %Y')
    except Exception:
        return iso


def render_byline(date_published, date_modified, author='Selva Prabhakaran'):
    pub = _format_byline_date(date_published)
    upd = _format_byline_date(date_modified)
    return (
        '<div class="post-byline" style="color:#6b7280;font-size:14px;'
        'margin:2px 0 18px 0;line-height:1.5;">'
        f'By <strong>{author}</strong>'
        f' &nbsp;&middot;&nbsp; Published {pub}'
        f' &nbsp;&middot;&nbsp; Last updated {upd}'
        '</div>'
    )

def make_webr_head_block(asset_hrefs):
    webr_css = asset_hrefs.get('webr.css', 'www/webr.css')
    # webr.css is render-blocking: the static editor relies on it for the dark
    # theme and pre-like layout, so the first paint must have it.
    return f'    <link rel="stylesheet" href="{webr_css}">\n'


def make_webr_body_block(asset_hrefs):
    webr_js = asset_hrefs.get('webr-init.js', 'www/webr-init.js')
    editor_js = asset_hrefs.get('editor-bundle.js', f'www/{EDITOR_BUNDLE_NAME}')
    # No defer — Ezoic Leap strips deferred scripts on tutorial pages.
    # Bundle loads first so window.CodeJar + window.Prism exist before webr-init runs.
    return (
        f'  <script src="{editor_js}"></script>\n'
        f'  <script src="{webr_js}"></script>\n'
    )


def make_engagement_head_block(asset_hrefs):
    eng_css = asset_hrefs.get('engagement.css', 'www/engagement.css')
    return (
        f'    <link rel="stylesheet" href="{eng_css}" media="print" onload="this.media=\'all\'">\n'
        f'    <noscript><link rel="stylesheet" href="{eng_css}"></noscript>'
    )


def make_engagement_body_block(asset_hrefs):
    eng_js = asset_hrefs.get('engagement.js', 'www/engagement.js')
    return f'    <script src="{eng_js}"></script>'

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
    asset_hrefs=None, sidebar_sections=None,
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

    # Build-time syntax highlighting for the static editor markup.
    # Runs only for pages that actually have webr blocks.
    if webr:
        content = pygmentize_webr_editors(content)
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
    # Continue-Reading placeholder — toc.js fills it from rstat_continue
    # (the prior page in the user's trail). Stays display:none on first
    # visit, so the section only appears once the reader has a trail.
    continue_reading_html = (
        '<aside class="continue-reading-block" data-continue-block>'
        '<div class="cr-eyebrow">Continue Reading</div>'
        '<a class="cr-link" data-continue-link href="#"></a>'
        '</aside>'
    )
    # Inject author + dates byline.
    # Preferred placement: immediately after the first `<p class="lead">...</p>` block,
    # so the snippet-eligible answer sits right under the H1 with no metadata between.
    # Fallback: after the first H1 if no lead paragraph is present.
    byline_html = render_byline(date_published, date_modified)
    lead_match = re.search(r'<p class="lead"[^>]*>.*?</p>', content, re.DOTALL)
    if lead_match:
        end = lead_match.end()
        content = content[:end] + '\n' + byline_html + content[end:]
    elif '</h1>' in content:
        content = content.replace('</h1>', '</h1>\n' + byline_html, 1)

    # PSEO posts: auto-inject "Run live, no install" callout above the first
    # WebR code block. One-time, makes the silent moat visible. Skipped if the
    # post explicitly opts out via frontmatter `runlive_callout: false` or if
    # there is no WebR block.
    if (meta.get('post_type', '').strip() == 'PSEO'
            and meta.get('runlive_callout', 'true').lower() != 'false'
            and '<div class="webr-container"' in content):
        runlive_html = (
            '<div class="callout callout-runlive">'
            '<div class="callout-label">Run live</div>'
            '<div class="callout-body">'
            '<strong>Run live, no install needed.</strong> Every R block on this page runs in your browser. '
            'Click Run, edit the code, re-run instantly. No setup.'
            '</div>'
            '</div>'
        )
        # Insert immediately before the first webr-container
        content = content.replace(
            '<div class="webr-container"',
            runlive_html + '\n<div class="webr-container"',
            1,
        )

    # PSEO posts: auto-inject jump-chip strip below the Decision Tree (or
    # below the Quick Answer if no Decision Tree, or below the byline if
    # neither). Chips link to every H2 by an auto-generated id slug.
    # H2 elements get id="..." injected so anchors resolve.
    # Opt-out via frontmatter `jump_chips: false`.
    if (meta.get('post_type', '').strip() == 'PSEO'
            and meta.get('jump_chips', 'true').lower() != 'false'):
        # 1. Auto-add id attributes to H2s that lack one. Use a stable slug.
        def _slugify(s):
            s = re.sub(r'<[^>]+>', '', s)  # strip inline tags
            s = s.lower()
            s = re.sub(r'[^a-z0-9]+', '-', s)
            return s.strip('-')

        h2_pattern = re.compile(r'<h2(?P<attrs>[^>]*)>(?P<inner>.*?)</h2>', re.DOTALL)
        h2_seen = []

        def _h2_with_id(m):
            attrs = m.group('attrs') or ''
            inner = m.group('inner')
            slug_text = _slugify(inner)
            if 'id=' in attrs:
                # extract existing id for chip target
                id_match = re.search(r'id\s*=\s*"([^"]*)"', attrs)
                existing_id = id_match.group(1) if id_match else slug_text
                h2_seen.append((existing_id, inner.strip()))
                return m.group(0)
            h2_seen.append((slug_text, inner.strip()))
            new_attrs = f' id="{slug_text}"' + attrs
            return f'<h2{new_attrs}>{inner}</h2>'

        content = h2_pattern.sub(_h2_with_id, content)

        # 2. Build the chip strip if there are at least 3 H2s
        if len(h2_seen) >= 3:
            chip_links = []
            for h2_id, h2_text in h2_seen:
                # Strip inline HTML and tags for the label
                label = re.sub(r'<[^>]+>', '', h2_text).strip()
                lower = label.lower()
                css_class = ''
                # Friendly relabeling for known H2 patterns
                if lower.startswith('what ') and 'in one sentence' in lower:
                    chip_label = 'Definition'
                elif lower.startswith('try it'):
                    chip_label = '▶ Try it'
                    css_class = ' class="try-it"'
                elif 'common patterns' in lower or lower.startswith('seven ') or lower.startswith('six ') or lower.startswith('five ') or lower.startswith('eight '):
                    chip_label = 'Examples'
                elif ' vs ' in lower and ('base r' in lower or 'base-r' in lower):
                    chip_label = 'vs Base R'
                elif ' vs ' in lower:
                    # e.g., "summarise() vs aggregate()" -> "vs aggregate"
                    parts = label.split(' vs ', 1)
                    rhs = parts[1].split()[0] if len(parts) > 1 else ''
                    chip_label = f'vs {rhs}' if rhs else label[:22]
                elif lower.startswith('common pitfalls'):
                    chip_label = 'Pitfalls'
                elif lower.startswith('related'):
                    chip_label = 'Related'
                elif lower == 'faq' or lower.startswith('faq'):
                    chip_label = 'FAQ'
                elif lower == 'syntax' or lower.startswith('syntax'):
                    chip_label = 'Syntax'
                else:
                    # Generic truncation with cleaner cut at word boundary
                    chip_label = label.split(':')[0]
                    if len(chip_label) > 22:
                        # Cut at last space before 22 chars
                        cut = chip_label[:22].rsplit(' ', 1)[0]
                        chip_label = cut if len(cut) >= 8 else chip_label[:20] + '…'
                chip_links.append(f'<a href="#{h2_id}"{css_class}>{_esc_html(chip_label)}</a>')
            chips_html = (
                '<nav class="jump-chips" aria-label="On this page">'
                '<span class="jc-label">Jump to</span>'
                + ''.join(chip_links) +
                '</nav>'
            )
            # 3. Insert position: after decision-tree, else after quick-answer,
            # else after byline (which is just inserted above).
            if '</div>' in content and 'class="decision-tree"' in content:
                # Find the closing </div> of the decision-tree wrapper.
                dt_match = re.search(r'<div class="decision-tree">.*?</div>\s*</div>', content, re.DOTALL)
                if dt_match:
                    end = dt_match.end()
                    content = content[:end] + '\n' + chips_html + content[end:]
                else:
                    # Fallback: simpler closing-div detection
                    dt_simple = re.search(r'<div class="decision-tree">.*?</svg></div>', content, re.DOTALL)
                    if dt_simple:
                        end = dt_simple.end()
                        content = content[:end] + '\n' + chips_html + content[end:]
            elif 'class="quick-answer"' in content:
                qa_match = re.search(r'<div class="quick-answer">.*?</div>\s*(?:<p[^>]*class="qa-foot"[^>]*>.*?</p>\s*)?</div>', content, re.DOTALL)
                if qa_match:
                    end = qa_match.end()
                    content = content[:end] + '\n' + chips_html + content[end:]
            elif lead_match:
                # No QA or DT: place chips after byline (which is right after lead)
                # The byline was already inserted; find its end.
                bl_match = re.search(r'<div class="post-byline".*?</div>', content, re.DOTALL)
                if bl_match:
                    end = bl_match.end()
                    content = content[:end] + '\n' + chips_html + content[end:]
    content_with_breadcrumb = breadcrumb_html + '\n' + content
    content_with_breadcrumb = content_with_breadcrumb + '\n' + continue_reading_html
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

    # Asset href placeholders (content-hash cache busting)
    _hrefs = asset_hrefs or {}
    # Bootstrap hash — extract just the hash from 'www/bootstrap.min.css?h=abcd1234'
    _bs_href = _hrefs.get('bootstrap.min.css', '')
    _bs_hash = _bs_href.split('?h=')[1] if '?h=' in _bs_href else ''
    page_html = page_html.replace('{{HASH_BOOTSTRAP_CSS}}', _bs_hash)
    page_html = page_html.replace('{{MAIN_CSS_HREF}}', _hrefs.get('main.css', 'css/main.css'))
    page_html = page_html.replace('{{HIGHLIGHT_CSS_HREF}}', _hrefs.get('highlight.css', 'www/highlight.css'))
    page_html = page_html.replace('{{TOC_JS_HREF}}', _hrefs.get('toc.js', 'www/toc.js'))

    sidebar_html = render_sidebar_html(sidebar_sections or [], slug)
    page_html = page_html.replace('{{SIDEBAR_HTML}}', sidebar_html)

    page_html = page_html.replace('{{WEBR_HEAD}}', make_webr_head_block(_hrefs) if webr else '')
    page_html = page_html.replace('{{WEBR_BODY}}', make_webr_body_block(_hrefs) if webr else '')
    page_html = page_html.replace('{{ENGAGEMENT_HEAD}}', make_engagement_head_block(_hrefs) if webr else '')
    page_html = page_html.replace('{{ENGAGEMENT_BODY}}', make_engagement_body_block(_hrefs) if webr else '')

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


def update_sitemap_tools():
    """Append every tools/*.html page (and the /tools/ landing) to sitemap.xml.
    Tools get priority 0.9 (above 0.8 tutorial default) and refresh on each
    build so newly added tools propagate without manual sitemap edits."""
    if not os.path.exists(SITEMAP_PATH):
        return
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    if not os.path.isdir(tools_dir):
        return
    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        sitemap = f.read()
    today = datetime.date.today().isoformat()
    added = []
    inserts = []
    # Landing first (priority 1.0)
    landing = 'https://r-statistics.co/tools/'
    if landing not in sitemap:
        inserts.append(
            f'  <url>\n'
            f'    <loc>{landing}</loc>\n'
            f'    <changefreq>weekly</changefreq>\n'
            f'    <lastmod>{today}</lastmod>\n'
            f'    <priority>1.0</priority>\n'
            f'  </url>\n'
        )
        added.append('tools/')
    for fn in sorted(os.listdir(tools_dir)):
        if not fn.endswith('.html'):
            continue
        url = f'https://r-statistics.co/tools/{fn}'
        path = os.path.join(tools_dir, fn)
        file_date = datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()
        if url not in sitemap:
            inserts.append(
                f'  <url>\n'
                f'    <loc>{url}</loc>\n'
                f'    <changefreq>monthly</changefreq>\n'
                f'    <lastmod>{file_date}</lastmod>\n'
                f'    <priority>0.9</priority>\n'
                f'  </url>\n'
            )
            added.append(fn)
        else:
            # Refresh lastmod on existing entries
            pattern = re.compile(
                r'(<loc>' + re.escape(url) + r'</loc>\s*\n\s*<changefreq>\w+</changefreq>\s*\n\s*<lastmod>)\d{4}-\d{2}-\d{2}(</lastmod>)'
            )
            sitemap = pattern.sub(r'\g<1>' + file_date + r'\2', sitemap)
    if inserts:
        sitemap = sitemap.replace('</urlset>', ''.join(inserts) + '</urlset>')
    with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
        f.write(sitemap)
    if added:
        print(f"  Sitemap: registered {len(added)} tool entries")


_ROOT_META_DESC_RE = re.compile(
    r'<meta\s+name=["\']?[Dd]escription["\']?\s+content=["\']([^"\']*)["\']',
    re.IGNORECASE,
)
_ROOT_TITLE_RE = re.compile(r'<title>([^<]+)</title>', re.IGNORECASE)


def _load_post_meta_map():
    """Return {slug -> frontmatter_dict} for every published page.

    Walks `_posts/*.html` first (frontmatter-driven, the modern source of
    truth). For legacy root-only pages — the 42 hand-edited tutorials that
    pre-date the build pipeline — the function falls back to scraping the
    root HTML's <meta name="Description"> and <title> tags so the Compendium
    can still render their cards with real text instead of empty boxes.
    """
    meta = {}
    for path in sorted(os.listdir(POSTS_DIR)):
        if not path.endswith('.html'):
            continue
        slug = path
        full = os.path.join(POSTS_DIR, path)
        try:
            with open(full, encoding='utf-8') as f:
                fm, _ = parse_front_matter(f.read())
            meta[slug] = fm
        except Exception:
            continue

    # Legacy root pages — scrape <meta description> for any slug not yet in
    # the map. We only consider slugs the sidebar actually references, so
    # we don't pollute the map with random root files like 404.html or about/.
    sidebar_slugs = set()
    try:
        with open(SIDEBAR_PATH, encoding='utf-8') as f:
            for sec in json.load(f):
                for it in sec.get('items') or []:
                    if not it.get('divider') and it.get('href'):
                        sidebar_slugs.add(it['href'])
    except Exception:
        return meta

    for slug in sidebar_slugs:
        if slug in meta:
            continue
        root_path = os.path.join(REPO_ROOT, slug)
        if not os.path.exists(root_path):
            continue
        try:
            with open(root_path, encoding='utf-8') as f:
                head = f.read(8000)  # description is always near the top
        except Exception:
            continue
        desc_m = _ROOT_META_DESC_RE.search(head)
        title_m = _ROOT_TITLE_RE.search(head)
        legacy = {'post_type': 'C'}
        if desc_m:
            legacy['description'] = desc_m.group(1).strip()
        if title_m:
            # Strip the trailing site name suffix that legacy pages append.
            t = title_m.group(1).strip()
            for sep in (' | ', ' - ', ' · '):
                if sep in t:
                    head_part, _, _tail = t.partition(sep)
                    if head_part:
                        t = head_part.strip()
                    break
            legacy['title'] = t
        if legacy.get('description') or legacy.get('title'):
            meta[slug] = legacy
    return meta


# Curated reading paths for /posts/. Each entry references real published
# slugs. The Compendium renderer drops paths whose articles don't all exist
# yet (so we never link to a 404), and the path card auto-computes a length
# string from the article count.
COMPENDIUM_READING_PATHS = [
    {
        'title': 'First week with R',
        'level': 'Beginner',
        'snippet': "Foundation — syntax, types, your first analysis. For someone opening RStudio for the first time.",
        'articles': [
            ('Is-R-Worth-Learning-in-2026.html', 'Is R worth learning?'),
            ('Install-R-and-RStudio-2026.html', 'Install R &amp; RStudio'),
            ('R-Syntax-101.html', 'R syntax 101'),
            ('R-Vectors.html', 'Working with vectors'),
            ('R-Data-Frames.html', 'Lists &amp; data frames'),
        ],
    },
    {
        'title': 'Becoming fluent in dplyr',
        'level': 'Intermediate',
        'snippet': "From basic verbs to grouped operations to joins. The data-wrangling stack you'll use every day.",
        'articles': [
            ('dplyr-filter-select.html', 'dplyr filter &amp; select'),
            ('dplyr-mutate-rename.html', 'dplyr mutate &amp; rename'),
            ('dplyr-group-by-summarise.html', 'dplyr group_by &amp; summarise'),
            ('dplyr-arrange-slice.html', 'dplyr arrange &amp; slice'),
            ('R-Joins.html', 'R joins'),
            ('pivot_longer-pivot_wider-Reshape-Data-in-R.html', 'pivot_longer &amp; pivot_wider'),
        ],
    },
    {
        'title': 'From t-tests to regression',
        'level': 'Intermediate',
        'snippet': "The full progression from comparing two groups to fitting linear models. Everything you'll actually use.",
        'articles': [
            ('Hypothesis-Testing-in-R.html', 'Hypothesis testing'),
            ('t-Tests-in-R.html', 't-Tests in R'),
            ('One-Way-ANOVA-in-R.html', 'One-way ANOVA'),
            ('Linear-Regression.html', 'Linear regression'),
            ('Linear-Regression-Assumptions-in-R.html', 'Regression assumptions'),
            ('Regression-Diagnostics-in-R.html', 'Regression diagnostics'),
        ],
    },
    {
        'title': 'Forecasting in production',
        'level': 'Advanced',
        'snippet': "Time-series done with discipline — from stationarity to backtesting and what you'll actually deploy.",
        'articles': [
            ('Time-Series-Analysis-With-R.html', 'Time series analysis'),
            ('Time-Series-Forecasting-With-R.html', 'Time series forecasting'),
            ('Time-Series-Forecasting-With-R-part2.html', 'More forecasting'),
        ],
    },
]


def render_compendium_page(sections, post_titles_map=None):
    """Render posts/index.html — the Compendium destination page.

    Strategy:
      * Walk _posts/*.html for frontmatter (date, description, post_type).
      * Build one band per sidebar section, picking the 8 most recently
        dated posts in each. Falls back to sidebar order if dates are
        missing.
      * Top story = the single most recent C-type post by date.
      * Reading paths come from COMPENDIUM_READING_PATHS; paths whose
        articles don't all exist yet are dropped silently.
      * Most-read = curated seed list (no analytics integration yet).
    """
    meta_map = _load_post_meta_map()

    def _info(slug):
        m = meta_map.get(slug, {})
        return {
            'slug': slug,
            'title': m.get('title', ''),
            'description': m.get('description', ''),
            'date': m.get('date', ''),
            'post_type': m.get('post_type', 'C'),
            'sidebar_section': m.get('sidebar_section', ''),
        }

    # Bands — one per sidebar section, 8 items by recency.
    reading_time_cache = {}
    bands = []
    for sec in sections:
        section_title = sec.get('title', '')
        items = []
        current_subsection = ''
        for it in sec.get('items') or []:
            if it.get('divider'):
                current_subsection = it.get('text', '') or ''
                continue
            slug = it.get('href') or ''
            if not slug:
                continue
            info = _info(slug)
            display_title = it.get('text') or info['title'] or slug
            # Subtitle = the part of the full frontmatter title that's *not*
            # already covered by the sidebar label. Most posts follow the
            # pattern "Topic: Tagline that explains the post" — we strip
            # everything up to and including the colon and use what's left
            # as the subtitle. When there is no colon, we fall back to the
            # full title only if it adds material info beyond the sidebar
            # label; otherwise suppress it as redundant.
            subtitle = ''
            full_title = (info['title'] or '').strip()
            if full_title:
                norm_full = re.sub(r'\s+', ' ', full_title.lower())
                norm_label = re.sub(r'\s+', ' ', display_title.lower())
                if ':' in full_title:
                    tail = full_title.split(':', 1)[1].strip()
                    if tail and tail.lower() != norm_label:
                        subtitle = tail
                elif norm_full != norm_label and not norm_full.startswith(norm_label) and not norm_label.startswith(norm_full):
                    subtitle = full_title
            if slug not in reading_time_cache:
                reading_time_cache[slug] = compute_reading_time(slug)
            items.append({
                'date': info['date'],
                'slug': slug,
                'title': display_title,
                'subtitle': subtitle,
                'reading_time': reading_time_cache[slug],
                'post_type': info['post_type'],
                'difficulty': _derive_difficulty(section_title, current_subsection),
            })
        items.sort(key=lambda x: (x['date'] or '0000-00-00'), reverse=True)
        bands.append({'name': section_title, 'items': items})

    # Top story: most recent C post across the whole site.
    dated = [(_info(s)['date'], s) for s in meta_map if _info(s).get('post_type', 'C') == 'C' and _info(s)['date']]
    dated.sort(reverse=True)
    top_slug = dated[0][1] if dated else None
    top_info = _info(top_slug) if top_slug else None

    # Last-published date for the strap.
    last_pub = dated[0][0] if dated else ''

    # Reading paths — drop any whose articles aren't all built.
    available = set(meta_map.keys())
    paths = []
    for p in COMPENDIUM_READING_PATHS:
        keep = [(slug, label) for slug, label in p['articles'] if slug in available]
        if not keep:
            continue
        paths.append({**p, 'articles': keep})

    # Most-read: curated seed (5 items) — pull only those that actually exist.
    most_read_seeds = [
        ('Linear-Regression.html', 'Statistics'),
        ('ggplot2-Tutorial-With-R.html', 'Visualization'),
        ('Logistic-Regression-With-R.html', 'Statistics'),
        ('Time-Series-Analysis-With-R.html', 'Time Series'),
        ('Top50-Ggplot2-Visualizations-MasterList-R-Code.html', 'Visualization'),
    ]
    most_read = []
    for slug, sec in most_read_seeds:
        if slug in available:
            info = _info(slug)
            most_read.append({'slug': slug, 'title': info['title'] or slug, 'section': sec})

    total_posts = len(meta_map)

    # ---- Render ----
    parts = []
    parts.append('<!DOCTYPE html><html lang="en"><head>')
    parts.append('<meta charset="utf-8">')
    parts.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    parts.append('<title>The Compendium · r-statistics.co</title>')
    parts.append('<meta name="description" content="The full archive of r-statistics.co — twelve years of practical statistics and R, plus curated reading paths to begin.">')
    parts.append('<link rel="canonical" href="https://r-statistics.co/posts/">')
    parts.append('<link rel="icon" type="image/png" href="/favicon.png">')
    parts.append('<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">')
    parts.append('<style>')
    parts.append(_compendium_css())
    parts.append('</style>')
    parts.append('</head><body>')

    # Lightweight masthead — site title + nav back, no global Bootstrap chrome.
    parts.append('<header class="comp-masthead"><div class="comp-masthead-inner">')
    parts.append('<a class="comp-wordmark" href="/"><span class="comp-mark">R</span><span>r-statistics<span class="muted">.co</span></span></a>')
    parts.append('<nav class="comp-nav">')
    parts.append('<a class="comp-nav-link" href="/">Home</a>')
    parts.append('<a class="comp-nav-link active" href="/posts/">Compendium</a>')
    parts.append('</nav>')
    parts.append('</div></header>')

    # Hero
    parts.append('<section class="archive-head"><div class="archive-head-inner">')
    parts.append('<div class="archive-head-top">')
    parts.append('<div class="archive-title-block">')
    parts.append('<div class="page-eyebrow">The Compendium · r-statistics.co</div>')
    parts.append('<h1 class="archive-title">The Compendium</h1>')
    parts.append('<p class="archive-tagline">Practical statistics and R, written for working data scientists. Curated reading paths to begin, the full archive to depth.</p>')
    parts.append('</div>')
    parts.append('<div class="archive-search-block">')
    parts.append('<form class="archive-search" action="https://www.google.com/search" method="get" target="_blank" rel="noopener">')
    parts.append('<input type="hidden" name="q" id="searchq">')
    parts.append('<input type="text" placeholder="Search r-statistics.co…" id="searchinput" oninput="document.getElementById(\'searchq\').value=\'site:r-statistics.co \'+this.value" autocomplete="off">')
    parts.append('<button type="submit" class="kbd">Go</button>')
    parts.append('</form>')
    if last_pub:
        parts.append(f'<span class="last-published">Last published <strong>{_esc_html(last_pub)}</strong> · all code verified vs R 4.4</span>')
    parts.append('</div>')
    parts.append('</div></div></section>')

    # Reading Paths
    if paths:
        parts.append('<section class="paths-section">')
        parts.append('<div class="paths-head">')
        parts.append('<span class="paths-eyebrow"><span class="accent">●</span>&nbsp;&nbsp;Reading paths · curated sequences for specific goals</span>')
        parts.append("<span class='paths-tagline'>Where to start when you don't know where to start.</span>")
        parts.append('</div>')
        parts.append('<div class="paths-grid">')
        for p in paths:
            n = len(p['articles'])
            parts.append('<div class="path-card">')
            parts.append(f'<span class="path-eyebrow"><span class="level-pill">{_esc_html(p["level"])}</span><span>{n} articles</span></span>')
            parts.append(f'<h3 class="path-title">{_esc_html(p["title"])}</h3>')
            parts.append(f'<p class="path-snippet">{_esc_html(p["snippet"])}</p>')
            parts.append('<div class="path-articles">')
            for i, (slug, label) in enumerate(p['articles'][:4]):
                parts.append(f'<a class="path-article" href="/{slug}"><span class="path-article-num">{i+1}</span><span class="path-article-title">{label}</span></a>')
            if n > 4:
                rem = n - 4
                last_slug = p['articles'][-1][0]
                parts.append(f'<a class="path-article" href="/{last_slug}"><span class="path-article-num">+{rem}</span><span class="path-article-title">{rem} more in this path…</span></a>')
            parts.append('</div></div>')
        parts.append('</div></section>')

    # Top story + Most read
    if top_info:
        parts.append('<section class="top-banner">')
        parts.append('<div class="top-story">')
        parts.append('<div class="top-story-eyebrow">Latest · just published</div>')
        parts.append(f'<h2 class="top-story-title"><a href="/{top_slug}">{_esc_html(top_info["title"])}</a></h2>')
        if top_info['description']:
            parts.append(f'<p class="top-story-snippet">{_esc_html(top_info["description"])}</p>')
        parts.append('<div class="top-story-byline">')
        parts.append('<span>Selva Prabhakaran</span><span class="dot"></span>')
        parts.append(f'<span>Published {_esc_html(top_info["date"])}</span>')
        parts.append('</div></div>')

        if most_read:
            parts.append('<div class="most-read">')
            parts.append('<div class="most-read-title"><span>Most read</span><span class="trending">↗ trending</span></div>')
            parts.append('<ol class="mr-list">')
            for mr in most_read:
                parts.append(f'<li><a href="/{mr["slug"]}"><div class="mr-title">{_esc_html(mr["title"])}</div><div class="mr-meta">{_esc_html(mr["section"])}</div></a></li>')
            parts.append('</ol></div>')
        parts.append('</section>')

    # Topic bands
    for i, band in enumerate(bands):
        if not band['items']:
            continue
        num = f'{i+1:02d}'
        items = band['items'][:8]
        # Pad to 8 for visual rhythm
        anchor = sections[i].get('items', [{}])[0]
        all_count = sum(1 for it in (sections[i].get('items') or []) if not it.get('divider'))
        sec_anchor = '/' + (band['items'][0]['slug'] if band['items'] else '')
        parts.append('<section class="band">')
        parts.append('<div class="band-head"><div class="band-head-left">')
        parts.append(f'<span class="band-num">Section {num}</span>')
        parts.append(f'<h2 class="band-name">{_esc_html(band["name"])}</h2>')
        parts.append('</div>')
        parts.append(f'<a class="band-link" href="{sec_anchor}">All {all_count} in {_esc_html(band["name"])} →</a>')
        parts.append('</div>')
        parts.append('<div class="band-grid">')
        for it in items:
            when = _format_when(it['date'])
            parts.append(f'<a class="band-item" href="/{it["slug"]}">')
            if when:
                parts.append(f'<span class="band-item-when">{_esc_html(when)}</span>')
            parts.append(f'<h3 class="band-item-title">{_esc_html(it["title"])}</h3>')
            if it.get('subtitle'):
                parts.append(f'<p class="band-item-subtitle">{_esc_html(it["subtitle"])}</p>')
            meta_bits = []
            diff = it.get('difficulty')
            if diff:
                diff_class = 'diff-' + diff.lower()
                meta_bits.append(f'<span class="diff-pill {diff_class}">{diff}</span>')
            if it['reading_time']:
                meta_bits.append(f'<span class="rt">{it["reading_time"]} min</span>')
            if meta_bits:
                parts.append('<div class="band-item-meta">' + ''.join(meta_bits) + '</div>')
            parts.append('</a>')
        # Pad with empty cells so last row keeps grid alignment
        for _ in range(max(0, 8 - len(items))):
            parts.append('<div class="band-item band-item-empty"></div>')
        parts.append('</div></section>')

    # Footer
    parts.append('<footer class="comp-footer"><div class="comp-footer-inner">')
    parts.append(f'<p class="colophon">Hand-edited since 2014. © 2014–{datetime.date.today().year} Selva Prabhakaran</p>')
    parts.append('<div class="links">')
    parts.append('<a href="/">Home</a>·<a href="/about/">About</a>·<a href="/feed.xml">RSS</a>')
    parts.append('</div></div></footer>')

    parts.append('</body></html>')
    return ''.join(parts)


_BEGINNER_SUBSECTIONS = re.compile(r'(?i)getting started|fundamentals|basics|intro|first|foundations')
_ADVANCED_SUBSECTIONS = re.compile(r'(?i)advanced|internals|how r works|performance|debugging|metaprogramming')


def _derive_difficulty(section, subsection):
    """Map (section, subsection) to a difficulty pill label.

    No frontmatter tag exists — we derive from the curator-chosen sidebar
    structure, which already groups posts by topic ramp. Rules:
      * Learn R + intro/fundamentals subsections → Beginner
      * Advanced R section → Advanced
      * Subsection name matches advanced keywords → Advanced
      * Subsection name matches beginner keywords → Beginner
      * Everything else → Intermediate
    """
    sec = (section or '').lower()
    sub = subsection or ''
    if 'advanced r' in sec:
        return 'Advanced'
    if _ADVANCED_SUBSECTIONS.search(sub):
        return 'Advanced'
    if 'learn r' in sec and _BEGINNER_SUBSECTIONS.search(sub):
        return 'Beginner'
    if 'classic tutorials' in sec:
        return 'Beginner'
    if 'practice exercises' in sec:
        # Exercises follow the difficulty of their parent topic; the sidebar
        # divider names mirror the section names ("R Fundamentals" etc.) so
        # we can read difficulty off the same patterns.
        if _BEGINNER_SUBSECTIONS.search(sub) or 'fundamentals' in sub.lower():
            return 'Beginner'
        if _ADVANCED_SUBSECTIONS.search(sub):
            return 'Advanced'
        return 'Intermediate'
    if _BEGINNER_SUBSECTIONS.search(sub):
        return 'Beginner'
    return 'Intermediate'


def _format_when(date_str):
    """Convert YYYY-MM-DD to a relative-time string for the band card."""
    if not date_str:
        return ''
    try:
        d = datetime.date.fromisoformat(date_str)
    except Exception:
        return date_str
    delta = (datetime.date.today() - d).days
    if delta <= 0:
        return 'today'
    if delta == 1:
        return 'yesterday'
    if delta < 30:
        return f'{delta}d ago'
    if delta < 365:
        return f'{delta // 30}mo ago'
    return f'{delta // 365}y ago'


def _compendium_css():
    """CSS for the Compendium page. Inlined to keep the page self-contained."""
    return r"""
:root{--page:#fafbfc;--surface:#ffffff;--surface-alt:#f1f3f6;--rule:#d8dce2;--rule-soft:#e8eaef;--rule-strong:#1a1d23;--text:#0d1117;--text-soft:#4a5160;--text-mute:#757a87;--accent:#1d3158;--accent-bright:#2c4574;--accent-soft:rgba(29,49,88,0.07);--accent-line:rgba(29,49,88,0.20);--success:#1f6f48;--success-soft:rgba(31,111,72,0.10);--ff-sans:'IBM Plex Sans',sans-serif;--ff-serif:'IBM Plex Serif',Georgia,serif;--ff-mono:'IBM Plex Mono',monospace;--shadow-sm:0 1px 2px rgba(13,17,23,0.04);--shadow-md:0 1px 2px rgba(13,17,23,0.04),0 6px 24px rgba(13,17,23,0.045);--ease:cubic-bezier(0.4,0,0.2,1)}
html.dark{--page:#0c0d10;--surface:#14161a;--surface-alt:#1a1d22;--rule:#262a31;--rule-soft:#1e2228;--rule-strong:#e0e3e9;--text:#e8eaee;--text-soft:#b0b5bf;--text-mute:#6e7382;--accent:#92a4d8;--accent-bright:#b3c4f0;--accent-soft:rgba(146,164,216,0.10);--accent-line:rgba(146,164,216,0.30)}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--page);color:var(--text);font-family:var(--ff-sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
::selection{background:var(--accent);color:#fff}
a{color:var(--text);text-decoration:none}
a:hover{color:var(--accent)}
.comp-masthead{position:sticky;top:0;z-index:30;background:rgba(250,251,252,0.85);backdrop-filter:saturate(160%) blur(14px);border-bottom:1px solid var(--rule)}
html.dark .comp-masthead{background:rgba(12,13,16,0.80)}
.comp-masthead-inner{max-width:1280px;margin:0 auto;padding:14px 28px;display:flex;align-items:center;gap:32px}
.comp-wordmark{display:inline-flex;align-items:center;gap:10px;font-family:var(--ff-mono);font-weight:600;font-size:15px;color:var(--text)}
.comp-mark{width:28px;height:28px;border-radius:6px;background:var(--accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:var(--shadow-sm)}
.comp-wordmark .muted{color:var(--text-mute)}
.comp-nav{display:flex;gap:4px;flex:1}
.comp-nav-link{color:var(--text-soft);font-size:14px;font-weight:500;padding:6px 12px;border-radius:6px}
.comp-nav-link:hover{background:var(--surface-alt);color:var(--text)}
.comp-nav-link.active{color:var(--text);background:var(--surface-alt)}
.archive-head{border-bottom:3px double var(--rule-strong);padding:48px 0 32px}
.archive-head-inner{max-width:1280px;margin:0 auto;padding:0 28px}
.archive-head-top{display:flex;justify-content:space-between;align-items:flex-end;gap:48px;flex-wrap:wrap;margin-bottom:24px}
.archive-title-block{flex:1;max-width:640px}
.page-eyebrow{font-family:var(--ff-sans);font-size:11.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-mute);margin-bottom:16px}
h1.archive-title{font-family:var(--ff-serif);font-weight:700;font-size:64px;line-height:0.95;letter-spacing:-0.03em;margin:0 0 16px;color:var(--text)}
.archive-tagline{font-family:var(--ff-serif);font-style:italic;font-size:18px;color:var(--text-soft);margin:0;letter-spacing:-0.005em;line-height:1.5;max-width:54ch}
.archive-search-block{flex:0 0 320px;display:flex;flex-direction:column;gap:10px;align-items:flex-end}
.archive-search{display:flex;align-items:center;gap:10px;background:var(--surface);border:1.5px solid var(--rule);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text-mute);min-width:300px;transition:all 0.15s var(--ease)}
.archive-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);color:var(--text)}
.archive-search input{border:none;outline:none;background:transparent;flex:1;font-family:inherit;font-size:14px;color:var(--text)}
.archive-search input::placeholder{color:var(--text-mute)}
.archive-search .kbd{font-family:var(--ff-mono);font-size:12px;padding:4px 10px;background:var(--surface-alt);border:1px solid var(--rule);border-radius:4px;color:var(--text-soft);cursor:pointer}
.archive-search .kbd:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.last-published{font-family:var(--ff-mono);font-size:11.5px;color:var(--text-mute);letter-spacing:0.04em}
.last-published strong{color:var(--text)}
.paths-section{max-width:1280px;margin:0 auto;padding:32px 28px 48px;border-bottom:1px solid var(--rule)}
.paths-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px}
.paths-eyebrow{font-family:var(--ff-sans);font-size:11.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-mute)}
.paths-eyebrow .accent{color:var(--accent)}
.paths-tagline{font-family:var(--ff-serif);font-style:italic;font-size:14px;color:var(--text-mute)}
.paths-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media(max-width:1080px){.paths-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.paths-grid{grid-template-columns:1fr}}
.path-card{background:var(--surface);border:1px solid var(--rule);border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;transition:all 0.18s var(--ease)}
.path-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent-line);transition:background 0.18s var(--ease)}
.path-card:hover{border-color:var(--accent-line);box-shadow:var(--shadow-md);transform:translateY(-1px)}
.path-card:hover::before{background:var(--accent)}
.path-eyebrow{display:flex;align-items:center;gap:8px;font-family:var(--ff-mono);font-size:10px;font-weight:600;color:var(--text-mute);letter-spacing:0.08em;text-transform:uppercase}
.path-eyebrow .level-pill{padding:1px 6px;background:var(--accent-soft);color:var(--accent);border-radius:3px;font-weight:700}
.path-title{font-family:var(--ff-serif);font-size:18px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;color:var(--text);margin:0}
.path-snippet{font-size:13px;line-height:1.5;color:var(--text-soft);margin:0}
.path-articles{display:flex;flex-direction:column;gap:4px;margin-top:4px}
.path-article{display:flex;align-items:center;gap:8px;font-family:var(--ff-mono);font-size:11.5px;color:var(--text-mute);line-height:1.4;text-decoration:none}
.path-article:hover{color:var(--accent)}
.path-article:hover .path-article-title{color:var(--accent)}
.path-article-num{flex:0 0 auto;width:18px;height:18px;border-radius:50%;background:var(--surface-alt);border:1px solid var(--rule);display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:600;color:var(--text-soft)}
.path-article-title{font-family:var(--ff-sans);font-size:12.5px;color:var(--text-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.top-banner{max-width:1280px;margin:0 auto 56px;padding:48px 28px;display:grid;grid-template-columns:2fr 1fr;gap:48px;border-bottom:1px solid var(--rule)}
@media(max-width:880px){.top-banner{grid-template-columns:1fr;gap:32px}}
.top-story-eyebrow{font-family:var(--ff-sans);font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.top-story-title{font-family:var(--ff-serif);font-size:42px;font-weight:600;line-height:1.1;letter-spacing:-0.025em;margin:0 0 16px;color:var(--text)}
.top-story-title a{color:var(--text)}
.top-story-title a:hover{color:var(--accent)}
.top-story-snippet{font-family:var(--ff-serif);font-style:italic;font-size:18px;line-height:1.55;color:var(--text-soft);max-width:54ch;margin:0 0 18px}
.top-story-byline{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--text-mute);font-family:var(--ff-mono)}
.top-story-byline .dot{width:3px;height:3px;background:var(--text-mute);border-radius:50%}
.most-read{padding-left:48px;border-left:1px solid var(--rule)}
@media(max-width:880px){.most-read{padding-left:0;border-left:none;padding-top:24px;border-top:1px solid var(--rule)}}
.most-read-title{font-family:var(--ff-sans);font-size:11.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-mute);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
.most-read-title .trending{font-family:var(--ff-mono);font-weight:500;letter-spacing:0;text-transform:none;font-size:11px}
.mr-list{list-style:none;padding:0;margin:0;counter-reset:mr}
.mr-list li{counter-increment:mr;padding:12px 0 12px 32px;border-bottom:1px solid var(--rule-soft);position:relative}
.mr-list li:last-child{border-bottom:none}
.mr-list li::before{content:counter(mr);position:absolute;left:0;top:14px;font-family:var(--ff-serif);font-size:22px;font-weight:600;color:var(--text-mute);letter-spacing:-0.02em;line-height:1}
.mr-list a{display:block}
.mr-list .mr-title{font-family:var(--ff-serif);font-size:15px;font-weight:600;line-height:1.3;color:var(--text);letter-spacing:-0.005em}
.mr-list a:hover .mr-title{color:var(--accent)}
.mr-list .mr-meta{font-family:var(--ff-mono);font-size:11px;color:var(--text-mute);margin-top:4px}
.band{max-width:1280px;margin:0 auto 56px;padding:0 28px}
.band-head{display:flex;align-items:baseline;justify-content:space-between;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid var(--rule-strong);flex-wrap:wrap;gap:8px}
.band-head-left{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.band-num{font-family:var(--ff-mono);font-size:11.5px;font-weight:600;color:var(--text-mute);letter-spacing:0.06em;text-transform:uppercase}
.band-name{font-family:var(--ff-serif);font-size:28px;font-weight:600;letter-spacing:-0.018em;color:var(--text);margin:0;line-height:1}
.band-link{display:inline-flex;align-items:center;gap:6px;font-family:var(--ff-sans);font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;flex:0 0 auto}
.band-link:hover{text-decoration:underline}
.band-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft)}
@media(max-width:980px){.band-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:580px){.band-grid{grid-template-columns:1fr}}
.band-item{padding:20px 22px;border-right:1px solid var(--rule-soft);border-bottom:1px solid var(--rule-soft);display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;transition:background 0.12s var(--ease);min-height:118px}
.band-item:nth-child(4n){border-right:none}
@media(max-width:980px){.band-item:nth-child(4n){border-right:1px solid var(--rule-soft)}.band-item:nth-child(2n){border-right:none}}
@media(max-width:580px){.band-item{border-right:none}}
.band-item:nth-last-child(-n+4){border-bottom:none}
.band-item:hover{background:var(--surface)}
.band-item-empty{pointer-events:none;background:transparent}
.band-item-when{font-family:var(--ff-mono);font-size:10.5px;font-weight:500;color:var(--text-mute);letter-spacing:0.05em;text-transform:uppercase}
.band-item-title{font-family:var(--ff-serif);font-size:18px;font-weight:600;line-height:1.25;letter-spacing:-0.012em;color:var(--text);margin:0}
.band-item:hover .band-item-title{color:var(--accent)}
.band-item-subtitle{font-family:var(--ff-sans);font-size:12.5px;line-height:1.4;color:var(--text-soft);margin:0;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:400}
.band-item-meta{display:flex;align-items:center;gap:10px;margin-top:auto}
.diff-pill{font-family:var(--ff-mono);font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:2px 7px;border-radius:3px;line-height:1.3}
.diff-pill.diff-beginner{background:rgba(31,111,72,0.10);color:var(--success)}
.diff-pill.diff-intermediate{background:var(--accent-soft);color:var(--accent)}
.diff-pill.diff-advanced{background:rgba(155,29,29,0.08);color:#9b1d1d}
html.dark .diff-pill.diff-advanced{background:rgba(255,120,120,0.12);color:#ff9b9b}
html.dark .diff-pill.diff-beginner{background:rgba(110,231,183,0.10);color:#6ee7b7}
.band-item-meta .rt{font-family:var(--ff-mono);font-size:11px;color:var(--text-mute);letter-spacing:0.03em}
.comp-footer{background:var(--surface);border-top:3px double var(--rule-strong);padding:36px 0;font-size:13px;margin-top:64px;color:var(--text-mute);text-align:center}
.comp-footer-inner{max-width:1280px;margin:0 auto;padding:0 28px}
.comp-footer .colophon{font-family:var(--ff-serif);font-style:italic;color:var(--text-soft);margin-bottom:8px;font-size:14px}
.comp-footer .links a{color:var(--text-soft);margin:0 12px}
"""


def patch_tool_pages(sections, asset_hrefs):
    """Inject the unified masthead + Posts/Tools sidebar into each tool.

    Tool HTMLs in /tools/ are self-contained (their own styles + scripts),
    not built from template.html. To bring them under the same chrome as
    tutorial pages we patch each at build time:
      * Drop the tool's bespoke masthead
      * Inject the site masthead just after <body>
      * Wrap the remaining body in a 2-col grid: [sidebar] [main]
      * Pull in main.css *before* the tool's inline <style> so the tool's
        own styles still win (they cascade later in the head)
      * Append toc.js + masthead behavior just before </body>

    The patch is idempotent — re-runs on already-patched files do nothing.
    """
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    if not os.path.isdir(tools_dir):
        return

    main_css_href = (asset_hrefs or {}).get('main.css', 'css/main.css')
    toc_js_href = (asset_hrefs or {}).get('toc.js', 'www/toc.js')

    # Layout CSS injected per-tool. Desktop: 2-col (sticky sidebar + main).
    # Mobile (<= 880px): sidebar becomes an off-canvas drawer toggled by the
    # hamburger button in the masthead. Pure CSS transform; the toggle uses
    # an onclick attribute on the button so Ezoic can't strip the wiring.
    layout_css = (
        '<style id="tool-chrome-css">'
        '.tool-chrome{max-width:1280px;margin:0 auto;padding:24px 24px 48px;'
        'display:grid;grid-template-columns:260px 1fr;gap:32px;align-items:start}'
        '.tool-chrome-side{position:sticky;top:72px;max-height:calc(100vh - 100px);'
        'overflow-y:auto;padding-right:8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}'
        '.tool-chrome-side #sidebar-nav{padding:0}'
        '.tool-chrome-main{min-width:0}'
        '.sidebar-toggle{display:none}'
        '.sidebar-backdrop{display:none}'
        '@media(max-width:880px){'
        '.tool-chrome{grid-template-columns:1fr;padding:16px}'
        '.tool-chrome-side{position:fixed;top:0;left:0;bottom:0;width:280px;max-height:100vh;'
        'background:#fff;z-index:1000;transform:translateX(-100%);transition:transform .22s ease;'
        'overflow-y:auto;padding:60px 14px 16px;box-shadow:2px 0 16px rgba(13,17,23,0.15);'
        'top:0;max-height:none}'
        'body.sidebar-open .tool-chrome-side{transform:translateX(0)}'
        '.sidebar-backdrop{position:fixed;inset:0;background:rgba(13,17,23,0.42);'
        'z-index:999;opacity:0;pointer-events:none;transition:opacity .22s}'
        'body.sidebar-open .sidebar-backdrop{display:block;opacity:1;pointer-events:auto}'
        '.sidebar-toggle{display:inline-flex;align-items:center;justify-content:center;'
        'width:40px;height:40px;background:transparent;border:none;cursor:pointer;'
        'color:#0d1117;padding:0;margin-right:8px;border-radius:6px}'
        '.sidebar-toggle:hover{background:rgba(13,17,23,0.06)}'
        '.sidebar-toggle svg{display:block}'
        '.sidebar-close{position:absolute;top:14px;right:14px;width:36px;height:36px;'
        'border-radius:50%;background:transparent;border:none;cursor:pointer;'
        'color:#0d1117;font-size:22px;line-height:1;padding:0;display:inline-flex;'
        'align-items:center;justify-content:center;z-index:2}'
        '.sidebar-close:hover{background:#f1f3f6}'
        '}'
        '</style>'
    )

    # Hamburger SVG (3-line menu icon). Inline so it can be styled via currentColor.
    hamburger_svg = (
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<line x1="3" y1="6" x2="21" y2="6"/>'
        '<line x1="3" y1="12" x2="21" y2="12"/>'
        '<line x1="3" y1="18" x2="21" y2="18"/>'
        '</svg>'
    )
    masthead_html = (
        '<header class="site-masthead">'
        '<div class="site-masthead-inner">'
        # Toggle handler: also relocates the drawer + backdrop to direct body
        # children on first open so any ancestor transform/filter (which
        # creates a containing block and breaks position:fixed) can't trap
        # the drawer inside .tool-chrome.
        '<button class="sidebar-toggle" type="button" aria-label="Open sidebar" '
        'onclick="(function(b){var d=document.querySelector(\'.tool-chrome-side\'),k=document.querySelector(\'.sidebar-backdrop\');'
        'if(d&&d.parentNode!==b)b.appendChild(d);if(k&&k.parentNode!==b)b.appendChild(k);'
        'b.classList.toggle(\'sidebar-open\')})(document.body)">' + hamburger_svg + '</button>'
        '<a class="masthead-wordmark" href="/">'
        '<span class="masthead-mark">R</span>'
        '<span class="masthead-name">r&#8209;statistics<span class="masthead-tld">.co</span></span>'
        '</a>'
        '<nav class="masthead-nav">'
        '<a class="masthead-nav-link" href="/">Home</a>'
        '<a class="masthead-nav-link" href="/posts/">Compendium</a>'
        '</nav>'
        '<div class="masthead-tools">'
        '<form onsubmit="window.open(\'https://google.com/search?q=\'+document.getElementById(\'tool-search\').value+\'%20site:r-statistics.co\');return false" class="masthead-search">'
        '<input type="text" id="tool-search" placeholder="Search…" aria-label="Search r-statistics.co">'
        '</form>'
        '</div>'
        '</div></header>'
    )

    masthead_re = re.compile(
        r'<header[^>]*class="masthead"[^>]*>.*?</header>',
        re.IGNORECASE | re.DOTALL,
    )
    head_close_re = re.compile(r'</head>', re.IGNORECASE)
    body_open_re = re.compile(r'<body[^>]*>', re.IGNORECASE)
    body_close_re = re.compile(r'</body>', re.IGNORECASE)

    main_css_hash_re = re.compile(
        r'(<link[^>]+href="/[^"]*main(?:\.min)?\.css)\?h=[a-f0-9]+',
        re.IGNORECASE,
    )
    toc_js_hash_re = re.compile(
        r'(<script[^>]+src="/[^"]*toc(?:\.min)?\.js)\?h=[a-f0-9]+',
        re.IGNORECASE,
    )

    def _refresh_cache_busts(html):
        """Update the ?h= query strings on main.css / toc.js links so
        already-patched tools pick up newly-built assets. Also refreshes
        the injected sidebar block so newly-registered tools appear without
        a full chrome re-injection."""
        new_main = '/' + main_css_href
        new_toc = '/' + toc_js_href
        # Just bump the existing ?h= portions to match what asset_hrefs has.
        new_html = main_css_hash_re.sub(lambda m: m.group(1) + (
            new_main.split('?', 1)[1] if '?' in new_main else ''
        ).replace('h=', '?h=') if '?h=' in new_main else m.group(1), html)
        # Simpler: just replace the entire main.css link with the fresh href
        link_re = re.compile(r'<link rel="stylesheet" href="/[^"]*main(?:\.min)?\.css[^"]*">', re.IGNORECASE)
        new_html = link_re.sub(f'<link rel="stylesheet" href="/{main_css_href}">', new_html, count=1)
        toc_link_re = re.compile(r'<script(?:\s+defer)?\s+src="/[^"]*toc(?:\.min)?\.js[^"]*"></script>', re.IGNORECASE)
        new_html = toc_link_re.sub(f'<script src="/{toc_js_href}"></script>', new_html, count=1)
        # Inject the runtime R syntax highlighter if not already present
        if 'r-syntax-highlight.js' not in new_html:
            new_html = new_html.replace(
                f'<script src="/{toc_js_href}"></script>',
                f'<script src="/{toc_js_href}"></script><script src="/www/r-syntax-highlight.js"></script>',
                1
            )
        # Refresh the chrome layout CSS so mobile-drawer rules land on tools
        # that were built before the drawer existed. Replace ALL occurrences
        # then drop duplicates — earlier builds occasionally injected the
        # block twice when the head was patched in two passes.
        layout_css_re = re.compile(
            r'<style id="tool-chrome-css">.*?</style>',
            re.DOTALL,
        )
        new_html = layout_css_re.sub(layout_css, new_html)
        # Dedupe: keep only the first instance of the layout CSS block.
        matches = list(layout_css_re.finditer(new_html))
        if len(matches) > 1:
            for m in reversed(matches[1:]):
                new_html = new_html[:m.start()] + new_html[m.end():]
        # Refresh the masthead so the hamburger button appears on tools that
        # were built before it existed. Match the existing site-masthead block.
        site_masthead_re = re.compile(
            r'<header class="site-masthead">.*?</header>',
            re.DOTALL,
        )
        new_html = site_masthead_re.sub(masthead_html, new_html, count=1)
        # Inject the sidebar-backdrop element + sidebar-close button if missing.
        # Check for the actual HTML element, not the bare class name (which now
        # appears in the layout CSS we just refreshed).
        if '<div class="sidebar-backdrop"' not in new_html:
            new_html = new_html.replace(
                '<div class="tool-chrome" data-tool-chrome="injected">',
                '<div class="sidebar-backdrop" '
                'onclick="document.body.classList.remove(\'sidebar-open\')"></div>'
                '<div class="tool-chrome" data-tool-chrome="injected">',
                1
            )
        if '<button class="sidebar-close"' not in new_html:
            new_html = new_html.replace(
                '<aside class="tool-chrome-side"><div id="sidebar-nav">',
                '<aside class="tool-chrome-side">'
                '<button class="sidebar-close" type="button" aria-label="Close sidebar" '
                'onclick="document.body.classList.remove(\'sidebar-open\')">&times;</button>'
                '<div id="sidebar-nav">',
                1
            )
        return new_html

    def _refresh_sidebar(html, fname):
        """Rebuild and replace the sidebar block inside an already-patched
        tool page so newly-registered tools / divider changes apply. Looks
        for <div id="sidebar-nav">...</div> immediately inside the chrome
        wrapper and substitutes a freshly-rendered version."""
        sidebar_html = render_sidebar_html(sections or [], current_slug='tools/' + fname)
        sb_re = re.compile(
            r'(<div id="sidebar-nav">).*?(</div>\s*</aside>)',
            re.DOTALL,
        )
        return sb_re.sub(lambda m: m.group(1) + sidebar_html + m.group(2), html, count=1)

    for fname in sorted(os.listdir(tools_dir)):
        if not fname.endswith('.html'):
            continue
        path = os.path.join(tools_dir, fname)
        with open(path, encoding='utf-8') as f:
            html = f.read()

        # Already-patched tools: refresh the cache-bust hashes AND refresh
        # the sidebar block so newly-registered tools appear without a
        # full chrome re-injection. Skip the rest of the (idempotent)
        # injection (masthead, wrapper, etc.).
        if 'data-tool-chrome="injected"' in html:
            new_html = _refresh_cache_busts(html)
            new_html = _refresh_sidebar(new_html, fname)
            if new_html != html:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_html)
            continue

        # 1. Inject main.css link BEFORE the tool's inline <style>, so the
        #    tool's own rules cascade later and win when they collide. Same
        #    file gets the layout-CSS shim before </head>; that one is fine
        #    after the tool because it only targets unique chrome classes.
        first_style_re = re.compile(r'<style[^>]*>', re.IGNORECASE)
        m = first_style_re.search(html)
        if m:
            html = html[:m.start()] + f'<link rel="stylesheet" href="/{main_css_href}">\n' + html[m.start():]
        html = head_close_re.sub(layout_css + '\n</head>', html, count=1)

        # 2. Strip the tool's bespoke masthead.
        html = masthead_re.sub('', html, count=1)

        # 3. Insert site masthead + open chrome wrapper just after <body>.
        # Mobile: the .sidebar-backdrop sits above content, below the drawer;
        # tapping it closes via inline onclick. The drawer itself carries an
        # absolute-positioned close (×) button so the user can dismiss without
        # reaching all the way back up to the hamburger.
        sidebar_html = render_sidebar_html(sections or [], current_slug='tools/' + fname)
        wrapper_open = (
            f'{masthead_html}'
            f'<div class="sidebar-backdrop" '
            f'onclick="document.body.classList.remove(\'sidebar-open\')"></div>'
            f'<div class="tool-chrome" data-tool-chrome="injected">'
            f'<aside class="tool-chrome-side">'
            f'<button class="sidebar-close" type="button" aria-label="Close sidebar" '
            f'onclick="document.body.classList.remove(\'sidebar-open\')">&times;</button>'
            f'<div id="sidebar-nav">{sidebar_html}</div>'
            f'</aside>'
            f'<main class="tool-chrome-main">'
        )
        html = body_open_re.sub(lambda m: m.group(0) + wrapper_open, html, count=1)

        # 4. Close the wrapper + append toc.js before </body>. Inline tab
        #    handler so the Posts/Tools sidebar tabs work even when Ezoic
        #    Leap strips our external <script src=...> tags.
        inline_tab_handler = (
            "<script>"
            "(function(){function w(){var t=document.querySelectorAll('.sidebar-tab'),p=document.querySelectorAll('.sidebar-panel');"
            "if(!t.length||!p.length)return false;"
            "function a(n){t.forEach(function(x){x.classList.toggle('active',x.getAttribute('data-tab')===n)});p.forEach(function(x){x.classList.toggle('active',x.getAttribute('data-panel')===n)})}"
            "var tp=location.pathname.indexOf('/tools/')===0;"
            "if(tp){a('tools')}else{try{var pin=localStorage.getItem('rstat_sidebar_tab');if(pin==='tools'||pin==='posts')a(pin)}catch(e){}}"
            "t.forEach(function(x){if(x.dataset.wired)return;x.dataset.wired='1';"
            "x.addEventListener('click',function(){var n=x.getAttribute('data-tab');a(n);try{localStorage.setItem('rstat_sidebar_tab',n)}catch(e){}})});"
            "return true}"
            "if(!w()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',w);else setTimeout(w,50)}})();"
            "</script>"
        )
        wrapper_close = (
            f'</main></div>'
            f'{inline_tab_handler}'
            f'<script src="/{toc_js_href}"></script>'
            f'<script src="/www/r-syntax-highlight.js"></script>'
        )
        html = body_close_re.sub(wrapper_close + '</body>', html, count=1)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'  Tool chrome: {fname}')


SIDEBAR_STATE_PATH = os.path.join(SCRIPT_DIR, '.sidebar_state.json')


def _sidebar_signature(sections):
    """Reduce a sidebar.json to a stable diff-friendly structure.

    Returns a list of (section_title, [item_signatures]) tuples where each
    item_signature is either ('item', href, text) or ('divider', text). This
    is what we compare across builds to decide additive vs structural.
    """
    sig = []
    for sec in sections or []:
        title = sec.get('title', '')
        items = []
        for it in sec.get('items') or []:
            if it.get('divider'):
                items.append(('divider', it.get('text', '')))
            else:
                items.append(('item', it.get('href', ''), it.get('text', '')))
        sig.append((title, items))
    return sig


def _classify_sidebar_change(prev, curr):
    """Return 'none', 'additive', or 'structural'.

    Additive means: same section count and order; for each section, the
    previous items are an exact prefix of the current items (only new items
    appended at the end). Anything else, including reorder, rename, removal,
    new section, or item moved between sections, is structural.

    First-run case (prev is None): treat as structural so the snapshot gets
    written at the end of the build but no patcher fires.
    """
    if prev is None:
        return 'structural'
    if prev == curr:
        return 'none'
    if len(prev) != len(curr):
        return 'structural'
    additive_seen = False
    for (p_title, p_items), (c_title, c_items) in zip(prev, curr):
        if p_title != c_title:
            return 'structural'
        # Previous items must be an exact prefix of current
        if len(c_items) < len(p_items):
            return 'structural'
        if c_items[:len(p_items)] != p_items:
            return 'structural'
        if len(c_items) > len(p_items):
            additive_seen = True
    return 'additive' if additive_seen else 'none'


def _load_sidebar_snapshot(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        # Stored as JSON-friendly nested lists
        return [(s[0], [tuple(it) for it in s[1]]) for s in data]
    except Exception:
        return None


def _save_sidebar_snapshot(curr_sig, path):
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump([[t, [list(it) for it in items]] for t, items in curr_sig], f)
    except OSError:
        pass


# Sidebar block boundary in built root pages: <div id="sidebar-nav">...</div>
# is wrapped by <div id="nav">, which closes just before <main id="content".
# See template.html lines 228-233 for the source structure.
_ROOT_SIDEBAR_RE = re.compile(
    r'(<div id="sidebar-nav">)(.*?)(</div>\s*</div>\s*<main id="content")',
    re.DOTALL,
)


def refresh_sidebar_in_root_pages(sections, post_files):
    """Surgically replace the sidebar block in every root post HTML.

    Used when sidebar.json changes are purely additive: cheaper than a full
    page rebuild because we only re-render the sidebar markup, not the entire
    page. Each root page's sidebar block is found via _ROOT_SIDEBAR_RE and
    swapped in place. ~5ms per page on typical hardware.
    """
    touched = 0
    skipped = 0
    for post_file in post_files:
        out_path = os.path.join(REPO_ROOT, post_file)
        if not os.path.exists(out_path):
            continue
        with open(out_path, encoding='utf-8') as f:
            html = f.read()
        m = _ROOT_SIDEBAR_RE.search(html)
        if not m:
            skipped += 1
            continue
        rendered = render_sidebar_html(sections, current_slug=post_file)
        if not rendered:
            continue
        if m.group(2) == rendered:
            continue
        new_html = html[:m.start()] + m.group(1) + rendered + m.group(3) + html[m.end():]
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        touched += 1
    print(f'  Sidebar refresh: {touched} root page(s) patched, {skipped} skipped (no sidebar block found)')


def patch_homepage_sidebar(sections):
    """Inject the rendered sidebar into index.html.

    index.html is hand-maintained (not generated by build_post). It used to
    rely on toc.js fetching sidebar.json client-side, but that path was
    removed when the rest of the site moved to server-rendered sidebars
    (Ezoic strips external JS). This step keeps the homepage in sync.
    """
    index_path = os.path.join(REPO_ROOT, 'index.html')
    if not os.path.exists(index_path):
        return
    with open(index_path, encoding='utf-8') as f:
        html = f.read()

    rendered = render_sidebar_html(sections, current_slug='index.html')
    pattern = re.compile(
        r'(<div id="sidebar-nav">)(.*?)(</div>\s*</div>\s*<div id="content")',
        re.DOTALL,
    )
    m = pattern.search(html)
    if not m:
        print('  WARN: index.html sidebar block not found, skipping homepage patch')
        return
    new_block = m.group(1) + rendered + m.group(3)
    if new_block == m.group(0):
        return
    new_html = html[:m.start()] + new_block + html[m.end():]
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('  Homepage: sidebar refreshed in index.html')


def generate_feed(post_files):
    """Generate an Atom feed from all posts and tools."""
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

    # Tools — read title + description from each tools/*.html and emit an Atom
    # entry per tool so RSS readers and AI crawlers see the calculator suite
    # alongside tutorials. Tools are tagged with category="tool" for filtering.
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    if os.path.isdir(tools_dir):
        import html as htmllib
        for fn in sorted(os.listdir(tools_dir)):
            if not fn.endswith('.html'):
                continue
            tpath = os.path.join(tools_dir, fn)
            with open(tpath, 'r', encoding='utf-8') as f:
                tsrc = f.read()
            tm = re.search(r'<title>([^<]+)</title>', tsrc)
            dm = re.search(r'<meta name="description" content="([^"]+)"', tsrc)
            raw_title = tm.group(1) if tm else fn[:-5]
            t_title = raw_title.split(' &middot;')[0].split(' · ')[0].strip()
            t_title = htmllib.unescape(t_title)
            t_desc = htmllib.unescape(dm.group(1)) if dm else ''
            t_title_xml = t_title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            t_desc_xml = t_desc.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            t_date = datetime.date.fromtimestamp(os.path.getmtime(tpath)).isoformat()
            url = f'https://r-statistics.co/tools/{fn}'
            entries.append(f"""  <entry>
    <title>{t_title_xml}</title>
    <link href="{url}"/>
    <id>{url}</id>
    <updated>{t_date}T00:00:00Z</updated>
    <summary>{t_desc_xml}</summary>
    <author><name>Selva Prabhakaran</name></author>
    <category term="tool"/>
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

    # ── Asset pipeline: vendor download → minify → hash → hrefs ──
    print("Asset pipeline:")
    ensure_vendor_assets()
    build_editor_bundle()
    final_paths = minify_assets(force=force_full)
    asset_hrefs, asset_final_paths = compute_asset_hrefs(final_paths)
    print(f"  Hashed {len(asset_hrefs)} assets")

    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    if not os.path.exists(POSTS_DIR):
        print("No _posts/ directory found.")
        return

    post_files = [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')]
    if not post_files:
        print("No posts found in _posts/")
        return

    sidebar_sections = load_sidebar_sections()
    sidebar_map = load_sidebar_map()
    prev_next_map = load_prev_next_map()
    slug_to_subpath, subpath_to_slugs = load_curriculum_siblings()

    # Sidebar change classification: decides whether sidebar.json acts as a
    # global rebuild trigger (structural changes) or just dispatches a cheap
    # in-place sidebar refresh on existing root pages (additive changes).
    # Snapshot persists at _build/.sidebar_state.json across runs.
    _curr_sidebar_sig = _sidebar_signature(sidebar_sections)
    _prev_sidebar_sig = _load_sidebar_snapshot(SIDEBAR_STATE_PATH)
    sidebar_change_kind = _classify_sidebar_change(_prev_sidebar_sig, _curr_sidebar_sig)
    if sidebar_change_kind != 'none':
        print(f"  Sidebar change: {sidebar_change_kind}")
    post_titles = load_post_titles()
    reading_time_cache = {}

    # "Global" dependencies — when any of these changes, every page must rebuild
    # because the change affects every output. template.html is embedded in
    # every page; build.py changes mean the generation logic itself changed.
    # Asset files are included because their content hash is embedded in every
    # output page. sidebar.json is included only when the change is structural
    # (reorder, rename, removal); for additive-only changes the cheaper
    # refresh_sidebar_in_root_pages handler runs after the per-page loop.
    asset_mtimes = [_mtime_or_zero(p) for p in asset_final_paths.values()]
    sidebar_dep_mtime = (
        _mtime_or_zero(SIDEBAR_PATH)
        if sidebar_change_kind == 'structural'
        else 0
    )
    global_deps_mtime = max(
        _mtime_or_zero(TEMPLATE_PATH),
        sidebar_dep_mtime,
        _mtime_or_zero(os.path.abspath(__file__)),
        max(asset_mtimes) if asset_mtimes else 0,
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
            asset_hrefs, sidebar_sections,
        )
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_html)
        print(f"Built: {post_file}")
        built.append(post_file)

    # Sidebar additive refresh — runs only when sidebar.json got new entries
    # appended (no reorder/rename/removal). Cheaper than a full rebuild because
    # it only re-renders the sidebar block per page, not the whole page.
    if sidebar_change_kind == 'additive' and not force_full and not only_target:
        refresh_sidebar_in_root_pages(sidebar_sections, sorted(post_files))

    # Post-build sanity check: re-run the healer across all fragments and
    # warn on any residual drift. The healer is idempotent, so a clean
    # build should emit zero warnings.
    leftover = 0
    for p in sorted(post_files):
        with open(os.path.join(POSTS_DIR, p), encoding='utf-8') as f:
            body = f.read()
        if heal_fragment(body) != body:
            leftover += 1
            print(f'  WARN leftover drift: {os.path.basename(p)}')
    if leftover:
        print(f'  WARN: {leftover} fragment(s) still drift after heal')

    # Sitemap and feed always regenerate from the full post_files list —
    # they are cheap and must stay in sync with what actually exists on disk.
    update_sitemap(sorted(post_files))
    update_sitemap_tools()
    generate_feed(sorted(post_files))

    # Regenerate /tools/ landing page so its card grid stays in sync with
    # whatever tools/*.html files exist on disk (titles + descriptions).
    try:
        from gen_tools_landing import render as render_tools_landing
        render_tools_landing()
    except Exception as e:
        print(f"  WARN: tools landing regen failed: {e}")

    # Regenerate per-tool OG images. Each card pulls title + description from
    # the tool's <head>, so any rename / desc tweak propagates to social
    # previews on the next build. Per-tool mtime check skips tools whose HTML
    # hasn't been touched since the existing PNG was written; --full forces
    # regen of all 27.
    try:
        from gen_og_images import main as render_og
        # Run silently — only print warnings
        import io, contextlib
        buf = io.StringIO()
        og_argv = ['gen_og_images.py']
        if force_full:
            og_argv.append('--force')
        with contextlib.redirect_stdout(buf):
            render_og(og_argv)
        print(f"  OG images: regenerated {buf.getvalue().count('->')} tool cards")
    except Exception as e:
        print(f"  WARN: OG image regen failed: {e}")
    patch_homepage_sidebar(sidebar_sections)
    patch_tool_pages(sidebar_sections, asset_hrefs)

    # Compendium destination page at /posts/.
    compendium_html = render_compendium_page(sidebar_sections)
    posts_dir = os.path.join(REPO_ROOT, 'posts')
    if os.path.isdir(posts_dir):
        compendium_path = os.path.join(posts_dir, 'index.html')
        with open(compendium_path, 'w', encoding='utf-8') as f:
            f.write(compendium_html)
        print(f'  Compendium: {compendium_path}')

    if only_target:
        print(f"\nDone. 1 page built (--only {only_target}).")
    elif force_full:
        print(f"\nDone. {len(built)} page(s) built (--full).")
    else:
        print(f"\nDone. {len(built)} page(s) built, {skipped} skipped (up-to-date).")

    # Persist sidebar snapshot so the next build can classify changes against it.
    # Don't save when --only is in effect — that doesn't represent the full
    # sidebar state for the site (we may have skipped a per-page refresh).
    if not only_target:
        _save_sidebar_snapshot(_curr_sidebar_sig, SIDEBAR_STATE_PATH)

    # Refresh PSEO master tracker (pseo-status.json) - cheap, idempotent.
    # Runs on every build so url/published_date/update_date stay current
    # automatically after each /publish-post call. Failures are non-fatal.
    try:
        import subprocess
        tracker_script = os.path.join(SCRIPT_DIR, '..', 'Scripts', 'build_pseo_tracker.py')
        if os.path.exists(tracker_script):
            r = subprocess.run(
                [sys.executable, tracker_script],
                capture_output=True, text=True, timeout=30
            )
            if r.returncode == 0:
                last = (r.stdout or '').strip().splitlines()[-1:] or ['']
                print(f'  PSEO tracker: {last[0].strip()}')
    except Exception as e:
        print(f'  PSEO tracker refresh skipped: {e}')


if __name__ == '__main__':
    main()

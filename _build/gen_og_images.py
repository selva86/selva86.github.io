"""Generate per-tool Open Graph images (1200x630 PNG) for r-statistics.co tools.

Reads title + description from each tools/*.html, renders a branded card
in IBM Plex Serif/Sans/Mono using PIL, and writes screenshots/og/<slug>.png.

Run:  python _build/gen_og_images.py            # all 27 tools
      python _build/gen_og_images.py <slug>     # one tool

Reuses the woff2 fonts already vendored in www/fonts/ibm-plex/ by
converting them to in-memory TTF via fontTools. No external font installs.
"""
import os, re, sys, io
import html as htmllib
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(REPO_ROOT, 'www', 'fonts', 'ibm-plex')
OG_DIR = os.path.join(REPO_ROOT, 'screenshots', 'og')

# Site palette (matches css/main.css tokens)
C_BG = (250, 251, 252)       # --c-bg
C_SURFACE = (255, 255, 255)  # --c-surface
C_TEXT = (13, 17, 23)        # --c-text
C_TEXT_SOFT = (74, 81, 96)   # --c-text-soft
C_TEXT_MUTE = (117, 122, 135)# --c-text-mute
C_ACCENT = (29, 49, 88)      # --c-accent
C_RULE = (216, 220, 226)     # --c-rule

# Per-category accent for the bottom-left tag chip
CATEGORY_OF = {}
for cat, slugs in [
    ('CALCULATOR', ['t-test-calculator','ab-test-calculator','chi-square-calculator','confidence-interval-calculator','bootstrap-ci-calculator','multiple-testing-correction','equivalence-noninferiority-calculator','z-score-percentile']),
    ('BAYESIAN', ['bayes-factor-calculator','bayes-theorem-calculator']),
    ('R OUTPUT INTERPRETER', ['lm-output-interpreter','glm-output-interpreter','anova-output-interpreter','diagnostic-plot-interpreter','vif-interpreter','confusion-matrix-interpreter']),
    ('PICKER', ['normality-test-picker','nonparametric-test-picker','dag-confounder-picker']),
    ('STUDY DESIGN', ['power-analysis','survival-power-calculator','effect-size-converter','type-i-ii-error-visualizer']),
    ('SPECIALIZED', ['ts-stationarity-calculator','outlier-detection-calculator','roc-auc-calculator','reprex-builder']),
]:
    for s in slugs:
        CATEGORY_OF[s] = cat


def load_ttf_from_woff2(woff2_path):
    """Convert a woff2 file to an in-memory TTF byte stream."""
    f = TTFont(woff2_path)
    buf = io.BytesIO()
    f.flavor = None  # strip woff2 wrapper, write as TTF
    f.save(buf)
    buf.seek(0)
    return buf


def get_font(woff2_name, size):
    """Return a PIL ImageFont at the given size from a woff2 in www/fonts/ibm-plex/."""
    path = os.path.join(FONTS_DIR, woff2_name)
    ttf = load_ttf_from_woff2(path)
    return ImageFont.truetype(ttf, size)


def wrap_text(draw, text, font, max_width):
    """Greedy word-wrap returning list of lines."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = ' '.join(current + [word])
        w = draw.textlength(test, font=font)
        if w <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(' '.join(current))
            current = [word]
    if current:
        lines.append(' '.join(current))
    return lines


def collect_tools():
    """Return [{slug, title, desc, category}] for every tool html file on disk."""
    tools = []
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    for fn in sorted(os.listdir(tools_dir)):
        if not fn.endswith('.html') or fn == 'index.html':
            continue
        slug = fn[:-5]
        with open(os.path.join(tools_dir, fn), encoding='utf-8') as f:
            s = f.read()
        title_m = re.search(r'<title>([^<]+)</title>', s)
        desc_m = re.search(r'<meta name="description" content="([^"]+)"', s)
        raw_title = title_m.group(1) if title_m else slug
        title = raw_title.split(' &middot;')[0].split(' · ')[0].strip()
        title = htmllib.unescape(title)
        desc = htmllib.unescape(desc_m.group(1)) if desc_m else ''
        tools.append({
            'slug': slug,
            'title': title,
            'desc': desc,
            'category': CATEGORY_OF.get(slug, 'TOOL'),
        })
    return tools


def render_one(tool):
    """Compose a single 1200x630 OG image for a tool."""
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), C_BG)
    draw = ImageDraw.Draw(img)

    # Top accent stripe
    draw.rectangle([(0, 0), (W, 8)], fill=C_ACCENT)

    # Surface panel inset (gives the design depth)
    pad = 56
    draw.rectangle([(pad, 56), (W - pad, H - pad)], fill=C_SURFACE, outline=C_RULE, width=1)

    # Fonts
    f_brand = get_font('ibm-plex-mono-500.woff2', 22)
    f_cat = get_font('ibm-plex-mono-500.woff2', 17)
    f_title = get_font('ibm-plex-serif-700.woff2', 64)
    f_title_sm = get_font('ibm-plex-serif-700.woff2', 52)
    f_title_xs = get_font('ibm-plex-serif-700.woff2', 44)
    f_desc = get_font('ibm-plex-sans-latin.woff2', 24)
    f_cta = get_font('ibm-plex-sans-latin.woff2', 21)

    # Header (inside the surface panel)
    inner_pad = 56 + 40
    top_y = 56 + 36

    # Brand mark (top-left)
    draw.text((inner_pad, top_y), 'r-statistics.co', font=f_brand, fill=C_ACCENT)

    # Category tag (top-right)
    cat_text = tool['category']
    cat_w = draw.textlength(cat_text, font=f_cat)
    draw.text((W - inner_pad - cat_w, top_y + 3), cat_text, font=f_cat, fill=C_TEXT_MUTE)

    # Tiny rule under header
    rule_y = top_y + 50
    draw.rectangle([(inner_pad, rule_y), (W - inner_pad, rule_y + 1)], fill=C_RULE)

    # Title (large serif, may wrap)
    title_x = inner_pad
    title_y = rule_y + 56
    available_w = W - 2 * inner_pad

    # Pick font size by length: try big first, step down if title is long
    for f_t in (f_title, f_title_sm, f_title_xs):
        title_lines = wrap_text(draw, tool['title'], f_t, available_w)
        if len(title_lines) <= 2:
            break

    line_h = f_t.getbbox('Hg')[3] + 8
    for i, line in enumerate(title_lines[:2]):
        draw.text((title_x, title_y + i * line_h), line, font=f_t, fill=C_TEXT)

    # Description (sans, wrapped, max 3 lines)
    desc_y = title_y + (len(title_lines[:2])) * line_h + 32
    desc_lines = wrap_text(draw, tool['desc'], f_desc, available_w)[:3]
    desc_line_h = f_desc.getbbox('Hg')[3] + 6
    for i, line in enumerate(desc_lines):
        draw.text((inner_pad, desc_y + i * desc_line_h), line, font=f_desc, fill=C_TEXT_SOFT)

    # Bottom row inside panel: URL path + CTA arrow
    bottom_y = H - pad - 60
    draw.text((inner_pad, bottom_y), f'/tools/{tool["slug"]}.html', font=f_brand, fill=C_TEXT_MUTE)

    # Use guillemets (U+00BB) instead of U+2192 — the latin-subset woff2 fonts
    # don't include the long arrow glyph and would render as tofu.
    cta_text = 'Open the tool »'
    cta_w = draw.textlength(cta_text, font=f_cta)
    draw.text((W - inner_pad - cta_w, bottom_y + 2), cta_text, font=f_cta, fill=C_ACCENT)

    return img


def main(argv):
    """Regenerate per-tool OG images.

    Skips tools whose existing PNG is at least as fresh as the tool's source
    HTML. The tool HTML is the only input that affects the image (title +
    description are read from the head); if the HTML is unchanged, the PNG
    cannot have changed, so re-rendering wastes ~0.5s per tool.

    Pass --force as the first arg to regenerate every PNG anyway.
    """
    os.makedirs(OG_DIR, exist_ok=True)
    args = list(argv[1:])
    force = False
    if '--force' in args:
        force = True
        args.remove('--force')
    tools = collect_tools()
    if args:
        only = args[0]
        tools = [t for t in tools if t['slug'] == only]
        if not tools:
            print(f'No tool with slug={only}')
            sys.exit(1)
    rendered = 0
    for t in tools:
        out = os.path.join(OG_DIR, f'{t["slug"]}.png')
        html_path = os.path.join(REPO_ROOT, 'tools', f'{t["slug"]}.html')
        if not force and os.path.exists(out):
            try:
                if os.path.getmtime(out) >= os.path.getmtime(html_path):
                    continue
            except OSError:
                pass  # fall through to re-render
        img = render_one(t)
        img.save(out, 'PNG', optimize=True)
        size_kb = os.path.getsize(out) // 1024
        print(f'  {t["slug"]:42s} -> {out.replace(REPO_ROOT, ".")} ({size_kb}KB)')
        rendered += 1
    print(f'Generated {rendered} of {len(tools)} OG images (skipped {len(tools) - rendered} up-to-date)')


if __name__ == '__main__':
    main(sys.argv)

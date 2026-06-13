"""Generate /tools/index.html, the landing page for the calculator suite.

Run via `python _build/gen_tools_landing.py` or imported by build.py.
Outputs tools/index.html with: hero, six category sections of cards
(one card per tool), an ItemList JSON-LD block for SEO, and a
BreadcrumbList. Pulls title/description from each tool file.
"""
import os, re, json
import html as htmllib

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATEGORIES = [
    ('Calculators', ['t-test-calculator','ab-test-calculator','chi-square-calculator','confidence-interval-calculator','bootstrap-ci-calculator','multiple-testing-correction','equivalence-noninferiority-calculator','z-score-percentile']),
    ('Bayesian', ['bayes-factor-calculator','bayes-theorem-calculator']),
    ('R Output Interpreters', ['lm-output-interpreter','glm-output-interpreter','anova-output-interpreter','diagnostic-plot-interpreter','vif-interpreter','confusion-matrix-interpreter']),
    ('Pickers and Decision Tools', ['normality-test-picker','nonparametric-test-picker','dag-confounder-picker']),
    ('Study Design and Power', ['power-analysis','survival-power-calculator','effect-size-converter','type-i-ii-error-visualizer']),
    ('Specialized', ['ts-stationarity-calculator','outlier-detection-calculator','roc-auc-calculator','reprex-builder']),
]


def collect_tools():
    """Return {slug: {title, desc}} for every tool html file on disk."""
    tools = {}
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    for fn in os.listdir(tools_dir):
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
        tools[slug] = {'title': title, 'desc': desc}
    return tools


def render():
    tools = collect_tools()
    total = sum(len(slugs) for _, slugs in CATEGORIES)

    item_list = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Statistical Tools, r-statistics.co',
        'description': 'Twenty-seven free, browser-based statistical calculators and R output interpreters with reproducible R code.',
        'url': 'https://r-statistics.co/tools/',
        'mainEntity': {
            '@type': 'ItemList',
            'numberOfItems': total,
            'itemListElement': []
        }
    }
    pos = 1
    for cat, slugs in CATEGORIES:
        for slug in slugs:
            t = tools.get(slug)
            if not t:
                continue
            item_list['mainEntity']['itemListElement'].append({
                '@type': 'ListItem',
                'position': pos,
                'name': t['title'],
                'description': t['desc'],
                'url': f'https://r-statistics.co/tools/{slug}.html'
            })
            pos += 1

    breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://r-statistics.co/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': 'https://r-statistics.co/tools/'}
        ]
    }

    cards_parts = []
    for cat, slugs in CATEGORIES:
        cards_parts.append('  <section class="cat-section">')
        cards_parts.append(f'    <h2 class="cat-h">{cat} <span class="cat-count">({len(slugs)})</span></h2>')
        cards_parts.append('    <div class="cat-grid">')
        for slug in slugs:
            t = tools.get(slug)
            if not t:
                continue
            esc_desc = t['desc'].replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            esc_title = t['title'].replace('<', '&lt;').replace('>', '&gt;')
            cards_parts.append(
                f'      <a class="tool-card" href="/tools/{slug}.html">\n'
                f'        <h3 class="tc-h">{esc_title}</h3>\n'
                f'        <p class="tc-desc">{esc_desc}</p>\n'
                f'        <span class="tc-cta">Open <span aria-hidden="true">&rarr;</span></span>\n'
                f'      </a>'
            )
        cards_parts.append('    </div>')
        cards_parts.append('  </section>')
    cards_html = '\n'.join(cards_parts)

    item_list_json = json.dumps(item_list, ensure_ascii=False, indent=2)
    breadcrumb_json = json.dumps(breadcrumb, ensure_ascii=False, indent=2)

    page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Statistical Tools &middot; r-statistics.co</title>
<meta name="description" content="27 free in-browser statistical calculators and R output interpreters: t-test, A/B test, ANOVA, lm/glm interpreters, Bayes factor, power analysis, ROC/AUC, and more. Reproducible R code included.">
<meta name="keywords" content="statistical calculator, R output interpreter, t-test calculator, A/B test calculator, power analysis, lm summary interpreter, glm interpreter, ANOVA, Bayes factor, ROC AUC, confusion matrix, online statistics tools">
<meta name="author" content="Selva Prabhakaran">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://r-statistics.co/tools/">
<link rel="icon" type="image/png" href="/screenshots/iconb-64.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Statistical Tools &middot; r-statistics.co">
<meta property="og:description" content="27 free in-browser statistical calculators and R output interpreters with reproducible R code.">
<meta property="og:url" content="https://r-statistics.co/tools/">
<meta property="og:site_name" content="r-statistics.co">
<meta property="og:image" content="https://r-statistics.co/screenshots/og-default.png">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Statistical Tools &middot; r-statistics.co">
<meta name="twitter:description" content="27 free in-browser statistical calculators and R output interpreters.">
<meta name="twitter:image" content="https://r-statistics.co/screenshots/og-default.png">

<script type="application/ld+json">
{item_list_json}
</script>

<script type="application/ld+json">
{breadcrumb_json}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{{
    --c-text:#0d1117;--c-text-soft:#4a5160;--c-text-mute:#757a87;
    --c-bg:#fafbfc;--c-bg-alt:#f1f3f6;--c-border:#d8dce2;--c-border-soft:#e8eaef;
    --c-surface:#ffffff;
    --c-accent:#1d3158;--c-accent-soft:rgba(29,49,88,0.07);--c-accent-deep:#0f1c3a;
  }}
  *,*::before,*::after{{box-sizing:border-box}}
  html,body{{margin:0;padding:0;background:var(--c-bg);color:var(--c-text);font-family:'IBM Plex Sans',sans-serif;font-size:15.5px;line-height:1.6}}
  .container{{max-width:1100px;margin:0 auto;padding:32px 24px 64px}}
  .hero{{margin:0 0 32px}}
  h1{{font-family:'IBM Plex Serif',serif;font-weight:700;font-size:2.1em;line-height:1.15;margin:0 0 8px;letter-spacing:-0.018em}}
  .hero-lead{{font-family:'IBM Plex Serif',serif;font-style:italic;font-size:17px;line-height:1.55;color:var(--c-text-soft);max-width:68ch;margin:0 0 14px}}
  .hero-meta{{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--c-text-mute);letter-spacing:0.06em;text-transform:uppercase}}
  .hero code{{font-family:'IBM Plex Mono',monospace;font-size:0.92em;background:var(--c-bg-alt);padding:1px 6px;border-radius:3px;color:var(--c-text)}}

  .cat-section{{margin:0 0 36px}}
  .cat-h{{font-family:'IBM Plex Serif',serif;font-weight:600;font-size:1.18em;letter-spacing:-0.005em;color:var(--c-text);margin:0 0 14px;padding:0 0 8px;border-bottom:1px solid var(--c-border-soft)}}
  .cat-count{{font-family:'IBM Plex Mono',monospace;font-size:0.7em;font-weight:500;color:var(--c-text-mute);letter-spacing:0.04em}}
  .cat-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}}

  .tool-card{{background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;padding:16px 18px 14px;text-decoration:none;color:var(--c-text);display:flex;flex-direction:column;justify-content:space-between;min-height:128px;transition:all 0.18s ease;box-shadow:0 1px 1px rgba(13,17,23,0.02)}}
  .tool-card:hover{{transform:translateY(-2px);box-shadow:0 6px 18px rgba(13,17,23,0.07),0 1px 2px rgba(13,17,23,0.04);border-color:rgba(29,49,88,0.20);text-decoration:none}}
  .tc-h{{font-family:'IBM Plex Serif',serif;font-weight:600;font-size:15.5px;line-height:1.25;color:var(--c-text);margin:0 0 6px;letter-spacing:-0.005em}}
  .tc-desc{{font-family:'IBM Plex Sans',sans-serif;font-size:12.5px;line-height:1.5;color:var(--c-text-soft);margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}}
  .tc-cta{{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:var(--c-accent);align-self:flex-start;margin-top:auto}}
  .tool-card:hover .tc-cta{{color:var(--c-accent-deep)}}

  .secondary-note{{margin:38px 0 0;padding:18px 22px;background:var(--c-bg-alt);border:1px dashed var(--c-border);border-radius:10px;font-size:13.5px;color:var(--c-text-soft);line-height:1.55;font-family:'IBM Plex Serif',serif;font-style:italic}}
  .secondary-note a{{color:var(--c-accent);text-decoration:underline;text-underline-offset:3px}}
  .secondary-note a:hover{{color:var(--c-accent-deep)}}
</style>
</head>
<body>
<div class="container">
  <div class="hero">
    <h1>Statistical Tools</h1>
    <p class="hero-lead">Twenty-seven free, browser-based calculators and interpreters that do exactly one statistical job each. Run a t-test, plan an A/B test, paste a <code>summary(lm)</code> output, correct for multiple testing. Every tool shows the formula, the matching R code, and a plain-language inference banner so you can copy results into a report without second-guessing.</p>
    <p class="hero-meta">{total} tools &middot; 6 categories &middot; 100% free &middot; No signup</p>
  </div>

{cards_html}

  <div class="secondary-note">
    Looking for the matching R tutorials? Browse the full <a href="/posts/">compendium</a> of long-form articles on probability, regression, ANOVA, time series, and machine learning in R.
  </div>
</div>
<!-- Cloudflare Web Analytics (cookieless; no consent required) -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{{"token": "edf7e3d50c3e4130a913e7f144643624"}}'></script>
</body>
</html>
'''
    _footer = open(os.path.join(REPO_ROOT, '_build', 'site_footer.html'), encoding='utf-8').read()
    page = page.replace('</body>', _footer + '</body>', 1)
    out = os.path.join(REPO_ROOT, 'tools', 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'Wrote {out} ({len(page):,} bytes, {total} tools across {len(CATEGORIES)} categories)')


if __name__ == '__main__':
    render()

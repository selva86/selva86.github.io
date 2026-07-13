"""Generate the v3 standalone "section" pages (certification, tools, tutorials,
exercises, roadmap, topic) with the exact v3 look-and-feel.

These are standalone pages (no article template, no sidebar) that share one set
of chrome: head (meta/og/canonical/JSON-LD + IBM Plex incl. italics + sections-v3.css),
the v3 masthead with REAL auth slots (.auth-anon / .auth-user filled by auth-hydrate.js),
the site footer, and the standard script stack (auth-hydrate, sections-v3, consent,
GA4 consent-mode, Cloudflare beacon, sign-in nudge). Page-specific body markup, CSS,
inline SVG sprite, and per-page JS are passed in by each section builder.

Run: `python _build/gen_sections.py` (builds every section page wired below).
Imported by build_with_pagefind.py so it runs on every CF Pages build.
"""
import os, json, re
import html as htmllib

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://r-statistics.co'

# v3 masthead nav: (label, href, active-key)
NAV = [
    ('Roadmap', '/roadmap/', 'roadmap'),
    ('Tutorials', '/tutorials/', 'tutorials'),
    ('Exercises', '/exercises/', 'exercises'),
    ('Tools', '/tools/', 'tools'),
    ('Certification', '/certifications', 'certification'),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700'
         '&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500'
         '&family=IBM+Plex+Mono:wght@400;500'
         '&family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">')

# Set html.js (gates reveal) + html.dark from saved theme, before paint (no FOUC).
FOUC = ("<script>(function(){var c='js';try{if(localStorage.getItem('theme')==='dark')"
        "c+=' dark';}catch(e){}document.documentElement.className=c;})();</script>")

# GA4 + Consent Mode v2 (copied verbatim from _build/template.html) + consent banner + CF beacon.
ANALYTICS = '''  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      analytics_storage: 'denied', wait_for_update: 1500
    });
    gtag('config', 'G-D5XKCMN7FR');
    (function () {
      var loaded = false;
      function load() { if (loaded) return; loaded = true; cleanup();
        var s = document.createElement('script'); s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-D5XKCMN7FR';
        document.head.appendChild(s); }
      var events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
      function cleanup() { events.forEach(function (e) { window.removeEventListener(e, load, { capture: true }); }); }
      function arm() { events.forEach(function (e) { window.addEventListener(e, load, { capture: true, once: true, passive: true }); }); setTimeout(load, 6000); }
      if (document.readyState === 'complete') arm();
      else window.addEventListener('load', arm, { once: true });
    })();
  </script>
  <script defer src="/www/consent-banner.js?v=2"></script>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "edf7e3d50c3e4130a913e7f144643624"}'></script>'''


def _esc(s):
    return htmllib.escape(s, quote=True)


def render_masthead(active):
    """Canonical sitewide navbar (owner rule 2026-07-12): the exact /roadmap/
    .nav design via www/site-nav.css (.sitenav). Mobile drawer + active-link
    marking come from www/site-nav.js ([data-snav-burger])."""
    links = []
    for label, href, key in NAV:
        if key == 'certification':
            continue  # canonical navbar carries the 4 roadmap links only
        cls = ' class="on"' if key == active else ''
        caret = ' <span class="ex-caret" aria-hidden="true">&#9662;</span>' if key == 'exercises' else ''
        links.append(f'      <a href="{href}"{cls}>{label}{caret}</a>')
    nav = '\n'.join(links)
    burger_svg = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                  'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
                  '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>'
                  '<line x1="3" y1="18" x2="21" y2="18"/></svg>')
    return f'''<nav class="sitenav" aria-label="Site">
  <div class="snav-wrap">
    <button data-snav-burger class="snav-burger" type="button" aria-label="Menu">{burger_svg}</button>
    <a class="snav-brand" href="/"><span class="brand-mark">R</span><span>r&#8209;statistics<span class="co">.co</span></span></a>
    <div class="snav-links">
{nav}
    </div>
    <div class="snav-right">
      <form class="snav-search" role="search" aria-label="Search r-statistics.co" onsubmit="var q=(this.q.value||'').trim();if(q)window.open('https://www.google.com/search?q='+encodeURIComponent(q+' site:r-statistics.co'));return false"><svg class="snav-sicon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input type="search" name="q" placeholder="Search" aria-label="Search r-statistics.co"></form><button class="snav-sbtn" data-snav-search type="button" aria-label="Search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></button>
      <a class="snav-btn" href="/pricing.html">Get certified <span class="a">&rarr;</span></a>
      <span class="auth-anon"><a href="/signin.html" class="masthead-auth-link">Sign in</a></span>
      <span class="auth-user"></span>
    </div>
  </div>
</nav>'''


def render_scripts(page_js=None):
    parts = [ANALYTICS,
             '  <script defer src="/www/auth-hydrate.js?v=11"></script>',
             '  <script defer src="/www/sections-v3.js?v=2"></script>',
             '  <script defer src="/www/site-nav.js?v=2"></script>',
             '  <script defer src="/www/practice-nav.js?v=10"></script>',
             '  <script defer src="/www/signin-nudge.js?v=16"></script>']
    for src in (page_js or []):
        parts.append(f'  <script defer src="{src}"></script>')
    return '\n'.join(parts)


def render_page(out_relpath, canonical, title, description, body_html, *,
                page_css='', sprite='', active='', page_js=None,
                keywords='', jsonld=None, og_image='/screenshots/og-default.png',
                inline_js='', robots='index, follow'):
    """Assemble + write one standalone section page; inject the site footer."""
    jsonld_blocks = ''
    for obj in (jsonld or []):
        jsonld_blocks += ('\n<script type="application/ld+json">\n'
                          + json.dumps(obj, ensure_ascii=False, indent=2) + '\n</script>')
    head = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_esc(title)}</title>
<meta name="description" content="{_esc(description)}">
<meta name="keywords" content="{_esc(keywords)}">
<meta name="author" content="Selva Prabhakaran">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}">
<link rel="icon" type="image/png" href="/screenshots/iconb-64.png">
<meta property="og:type" content="website">
<meta property="og:title" content="{_esc(title)}">
<meta property="og:description" content="{_esc(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="r-statistics.co">
<meta property="og:image" content="{SITE}{og_image}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{_esc(title)}">
<meta name="twitter:description" content="{_esc(description)}">
<meta name="twitter:image" content="{SITE}{og_image}">{jsonld_blocks}
{FOUC}
{FONTS}
<link rel="stylesheet" href="/www/sections-v3.css?v=3">
<link rel="stylesheet" href="/www/site-nav.css?v=3">
<style>html,body{{overflow-x:clip;max-width:100vw}}</style>
<style>
{page_css}
</style>
</head>
<body{' data-pagefind-ignore' if 'noindex' in robots else ''}>
{sprite}
{render_masthead(active)}
{body_html}
{render_scripts(page_js)}
{('  <script>' + inline_js + '</script>') if inline_js else ''}
</body>
</html>
'''
    footer = open(os.path.join(REPO_ROOT, '_build', 'site_footer.html'), encoding='utf-8').read()
    footer = footer.replace(
        '<span>&copy; 2016-2026 r-statistics.co</span>',
        '<span>&copy; 2016-2026 r-statistics.co</span>\n    '
        '<button id="darkBtn" onclick="toggleDark()" type="button" aria-label="Toggle dark mode" title="Toggle dark mode" '
        'style="background:none;border:1px solid rgba(255,255,255,.18);border-radius:6px;width:28px;height:28px;'
        'color:#aeb9d4;cursor:pointer;font-size:13px;line-height:1">&#9789;</button>', 1)
    page = head.replace('</body>', footer + '</body>', 1)
    out = os.path.join(REPO_ROOT, *out_relpath.split('/'))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'Wrote {out} ({len(page):,} bytes)')
    return out


# Minimal inline sprite providing the masthead's spark icon (each real page ships its full sprite).
SPARK_SPRITE = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
                '<symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
                'stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L13.8 9.4 L20 11 L13.8 12.6 L12 19 '
                'L10.2 12.6 L4 11 L10.2 9.4 Z"/></symbol></defs></svg>')


def _render_smoketest():
    """Phase-0 foundation check: render a throwaway page exercising the shared chrome."""
    body = '''<main class="wrap" style="padding:60px 24px">
  <section class="reveal">
    <h1 style="font-size:42px">Foundation smoke test</h1>
    <p style="color:var(--mut);font-size:18px;margin-top:14px">v3 chrome: masthead + auth slots + dark mode + reveal + footer.
      <em style="font-family:'IBM Plex Serif',serif;font-style:italic;color:var(--accent)"> italic serif renders.</em></p>
    <p style="margin-top:20px"><a class="btn btn-primary" href="#">Primary</a> <a class="btn btn-ghost btn-sm" href="#">Ghost</a></p>
  </section>
</main>'''
    render_page('_sections-smoketest.html', SITE + '/_sections-smoketest.html',
                'Foundation smoke test', 'sections-v3 foundation check', body,
                sprite=SPARK_SPRITE, active='')


SECTIONS_DIR = os.path.join(REPO_ROOT, '_build', 'sections')


def load_fragment(name):
    """Read _build/sections/<name>-fragment.html and split on the CSS/SPRITE/BODY markers."""
    with open(os.path.join(SECTIONS_DIR, name + '-fragment.html'), encoding='utf-8') as f:
        raw = f.read()
    css = raw.split('<!--===CSS===-->', 1)[1].split('<!--===SPRITE===-->', 1)[0].strip()
    sprite = raw.split('<!--===SPRITE===-->', 1)[1].split('<!--===BODY===-->', 1)[0].strip()
    body = raw.split('<!--===BODY===-->', 1)[1].strip()
    return css, sprite, body


def build_certification():
    css, sprite, body = load_fragment('certification')
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Certifications', 'item': SITE + '/certifications'}]}
    webpage = {'@context': 'https://schema.org', '@type': 'WebPage',
               'name': 'R Certifications, r-statistics.co',
               'url': SITE + '/certifications',
               'description': 'Verifiable, evidence-based R programming certifications, earned by solving real exercises and a code-based assessment.'}
    render_page(
        'certifications.html', SITE + '/certifications',
        'Certifications · r-statistics.co',
        'Verifiable, evidence-based R programming certifications. Earn one by solving 80% of the exercises across a curated track of hubs. Free to attempt; Pro to claim.',
        body, page_css=css, sprite=sprite, active='certification',
        page_js=['/www/cert-page.js?v=2'], jsonld=[webpage, breadcrumb],
        keywords='R certification, R programming certificate, verifiable credential, data science certificate, tidyverse certification, machine learning R certificate, statistics certificate, open badges')


# Tools index: (display name, monogram letter, tagline) aligned to gen_tools_landing.CATEGORIES order.
_TOOLS_CAT_META = [
    ('Calculators', 'C', 'run a test, get a number'),
    ('Reference Tables', 'T', 'printable critical-value tables'),
    ('Bayesian', 'B', 'update beliefs with evidence'),
    ('R Output Interpreters', 'R', 'paste output, get plain English'),
    ('Pickers &amp; Decision Tools', 'P', 'choose the right method'),
    ('Study Design &amp; Power', 'S', 'plan before you collect data'),
    ('Specialized', 'X', 'domain-specific tests'),
]


def build_tools():
    css, sprite, body = load_fragment('tools')
    from gen_tools_landing import collect_tools, CATEGORIES  # lazy: avoids import cycle
    tools = collect_tools()
    blocks, total = [], 0
    for (cat_name, slugs), (disp, letter, tagline) in zip(CATEGORIES, _TOOLS_CAT_META):
        present = [s for s in slugs if s in tools]
        total += len(present)
        cards = []
        for slug in present:
            t = tools[slug]
            title = t['title'].replace('<', '&lt;').replace('>', '&gt;')
            desc = t['desc'].replace('<', '&lt;').replace('>', '&gt;')
            cards.append(
                f'      <a class="trow" href="/tools/{slug}.html">'
                f'<span class="tname">{title} <span class="arr">&rarr;</span></span>'
                f'<p class="tdesc">{desc}</p></a>')
        blocks.append(
            '  <div class="cat">\n'
            f'    <div class="cathd"><span class="lm">{letter}</span><h3>{disp}</h3>'
            f'<span class="cc">{len(present)} tools</span><span class="gtag">{tagline}</span></div>\n'
            '    <div class="rows">\n' + '\n'.join(cards) + '\n    </div>\n  </div>')
    body = body.replace('{{TOOL_INDEX}}', '\n'.join(blocks))

    item_list = {'@context': 'https://schema.org', '@type': 'CollectionPage',
                 'name': 'Statistical Tools, r-statistics.co', 'url': SITE + '/tools/',
                 'mainEntity': {'@type': 'ItemList', 'numberOfItems': total, 'itemListElement': []}}
    pos = 1
    for cat_name, slugs in CATEGORIES:
        for slug in slugs:
            t = tools.get(slug)
            if not t:
                continue
            item_list['mainEntity']['itemListElement'].append(
                {'@type': 'ListItem', 'position': pos, 'name': t['title'],
                 'description': t['desc'], 'url': f'{SITE}/tools/{slug}.html'})
            pos += 1
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': SITE + '/tools/'}]}
    render_page(
        'tools/index.html', SITE + '/tools/',
        'Statistical Tools · r-statistics.co',
        '27 free in-browser statistical calculators and R output interpreters: t-test, A/B test, ANOVA, lm/glm interpreters, Bayes factor, power analysis, ROC/AUC, and more. Reproducible R code included.',
        body, page_css=css, sprite=sprite, active='tools',
        page_js=['/www/tools-page.js?v=1'], jsonld=[item_list, breadcrumb],
        keywords='statistical calculator, R output interpreter, t-test calculator, A/B test calculator, power analysis, lm summary interpreter, glm interpreter, ANOVA, Bayes factor, ROC AUC, confusion matrix, online statistics tools')
    print(f'  (tools index: {total} tools across {len(CATEGORIES)} categories)')


# Atlas config for the tutorials page (owner-approved assembly 2026-07-13:
# start-here + classics on top, full topic atlas as the body, no side rail).
_ATLAS_ACCENT = {'Learn R': '#2563a8', 'Data Wrangling': '#1f7a55', 'Statistics': '#a8322c',
                 'Visualization': '#b5631a', 'Time Series': '#4b45b8', 'Advanced R': '#0e7490',
                 'Classic Tutorials': '#9a7320', 'Practice Exercises': '#6d28d9'}
_ATLAS_BLURB = {
    'Learn R': 'The language itself: syntax, data types, functions, and the habits that make R feel natural.',
    'Data Wrangling': 'Get data in, clean it up, and shape it with dplyr and tidyr, the daily toolkit of every analyst.',
    'Statistics': 'From probability to regression, ANOVA, Bayesian methods and statistical theory, with runnable R at every step.',
    'Visualization': 'ggplot2 from the grammar up: every chart type, plus the polish that makes figures publication-ready.',
    'Time Series': 'Decompose, model and forecast time series with the classic r-statistics.co forecasting guides.',
    'Advanced R': 'How R actually works: functional programming, OOP, environments, debugging and performance.',
    'Classic Tutorials': 'The originals that put r-statistics.co on the map, read by millions of R users since 2016.',
    'Practice Exercises': 'Auto-graded problems and timed mastery quizzes. Solve in the browser, earn the certificate.',
}
# Starred = the classics + per-path flagships (kept in sync with the classics band).
_ATLAS_STARS = {
    'Top50-Ggplot2-Visualizations-MasterList-R-Code.html', 'Linear-Regression.html',
    'Logistic-Regression-With-R.html', 'Complete-Ggplot2-Tutorial-Part1-With-R-Code.html',
    'Time-Series-Analysis-With-R.html', 'Statistical-Tests-in-R.html',
    'R-Syntax-101.html', 'R-Data-Frames.html', 'R-Functions.html', 'R-vs-Python.html',
    'dplyr-group-by-summarise.html', 'R-Joins.html', 'pivot_longer-pivot_wider-Reshape-Data-in-R.html',
    'Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html', 'Hypothesis-Testing-in-R.html',
    'Which-Statistical-Test-in-R.html', 'One-Way-ANOVA-in-R.html', 'ggplot2-Grammar-of-Graphics.html',
    'Publication-Quality-Figures-in-R.html', 'Functional-Programming-in-R.html', 'OOP-in-R.html',
}


def _atlas_html():
    """Build the jump chips + atlas tiles from www/sidebar.json (the sidebar is
    the hand-curated SSOT, so the atlas stays current on every CI build)."""
    sections = json.load(open(os.path.join(REPO_ROOT, 'www', 'sidebar.json'), encoding='utf-8'))
    chips, tiles = [], []
    for sec in sections:
        title = sec['title']
        acc = _ATLAS_ACCENT.get(title, '#2563a8')
        anchor = 'atl-' + re.sub(r'[^a-z]', '', title.lower())
        items = sec.get('items', [])
        n_items = sum(1 for i in items if not i.get('divider'))
        chips.append(f'<a class="jch-chip" href="#{anchor}" style="--acc:{acc}"><i></i>{_esc(title)}<b>{n_items}</b></a>')
        # group by divider
        groups, cur = [], None
        for i in items:
            if i.get('divider'):
                cur = {'name': i['text'], 'items': []}
                groups.append(cur)
            else:
                if cur is None:
                    cur = {'name': '', 'items': []}
                    groups.append(cur)
                cur['items'].append(i)
        subs = []
        for gi, g in enumerate(groups):
            if not g['items']:
                continue
            lis = []
            for it in g['items']:
                href = it['href']
                label = _esc(it['text'])
                pill = ''
                if href.endswith('-quiz.html'):
                    pill = '<span class="atl-pill atl-quiz">Quiz</span>'
                elif label.endswith(' (Course)'):
                    label = label[:-9]
                    pill = '<span class="atl-pill atl-course">Interactive</span>'
                star = '<span class="atl-star">&#9733;</span>' if href in _ATLAS_STARS else ''
                lis.append(f'<li>{star}<a href="/{href}">{label}</a>{pill}</li>')
            openattr = ' open' if gi == 0 else ''
            name = _esc(g['name'] or title)
            subs.append(f'<details class="atl-sub"{openattr}><summary>{name}'
                        f'<span class="atl-c">{len(g["items"])}</span></summary><ul>{"".join(lis)}</ul></details>')
        tiles.append(f'<section class="atl-tile" id="{anchor}" style="--acc:{acc}">'
                     f'<div class="atl-th"><i></i><h3>{_esc(title)}</h3><span class="atl-n">{n_items} tutorials</span></div>'
                     f'<p class="atl-blurb">{_ATLAS_BLURB.get(title, "")}</p>{"".join(subs)}</section>')
    return ''.join(chips), ''.join(tiles)


def build_tutorials():
    import glob
    css, sprite, body = load_fragment('tutorials')
    # Total published pages = one _posts/*.html fragment per built page (committed; curriculum-status.json is gitignored).
    total = len(glob.glob(os.path.join(REPO_ROOT, '_posts', '*.html')))
    body = body.replace('{{TOTAL}}', f'{total:,}')
    chips, atlas = _atlas_html()
    body = body.replace('{{CHIPS}}', chips).replace('{{ATLAS}}', atlas)
    webpage = {'@context': 'https://schema.org', '@type': 'CollectionPage',
               'name': 'R Tutorials, r-statistics.co', 'url': SITE + '/tutorials/',
               'description': 'Free, runnable R tutorials across nine learning paths.'}
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Tutorials', 'item': SITE + '/tutorials/'}]}
    render_page(
        'tutorials/index.html', SITE + '/tutorials/',
        'R Tutorials · r-statistics.co',
        'Free, runnable R tutorials across nine learning paths: base R, data wrangling, visualization, statistics, time series, and machine learning. Every lesson runs live in the browser, and it has never been behind a paywall.',
        body, page_css=css, sprite=sprite, active='tutorials',
        page_js=['/www/tutorials-page.js?v=1'], jsonld=[webpage, breadcrumb],
        keywords='R tutorials, learn R, R programming tutorial, tidyverse, ggplot2, dplyr, R statistics, data science in R, runnable R examples')
    print(f'  (tutorials: total={total:,})')


# Topic classifier for the exercises landing: ordered, first-match-wins over the
# exercise-manifest hub slugs. Every one of the 127 hubs maps to exactly one topic.
_EX_TOPIC_RULES = [
    ('T_WRANGLE', ['dplyr', 'tidyr', 'tidyverse', 'data-table', 'data.table', 'stringr', 'lubridate',
                   'forcats', 'readr', 'broom', 'Data-Cleaning', 'Missing-Data', 'Data-Import', 'dbplyr',
                   'Web-Scraping', 'API-Calls', 'Data-Wrangling', 'Regex', 'Date-Time']),
    ('T_VIZ', ['ggplot2', 'plotly', 'leaflet', 'gt-Tables', 'Data-Visualization', 'Visualization-Project', 'EDA-']),
    ('T_ML', ['Machine-Learning', 'Cross-Validation', 'Decision-Tree', 'Random-Forest', 'XGBoost', 'caret',
              'tidymodels', 'Clustering', 'Cluster-Analysis', 'PCA', 'Ridge', 'Time-Series', 'ARIMA']),
    ('T_STATS', ['Hypothesis', 't-Test', 'ANOVA', 'Chi-Square', 'Correlation', 'Confidence', 'Regression',
                 'GLM', 'GAM', 'Logistic', 'Poisson', 'Linear', 'Multiple-Testing', 'Nonparametric', 'Post-Hoc',
                 'Power-Analysis', 'Probability', 'Distribution', 'Central-Limit', 'Bayesian', 'Sampling',
                 'Experimental', 'Mixed-Effects', 'Repeated', 'SEM', 'Survey', 'A-B-Testing', 'AB-Testing']),
    ('T_ADV', ['purrr', 'OOP', 'Debugging', 'Performance', 'Parallel', 'Package-Development', 'testthat',
               'Functional-Programming', 'Shiny', 'Markdown']),
    ('T_SPEC', ['Finance', 'Genomics', 'Biostatistics', 'Healthcare', 'Marketing', 'Sports', 'Text-Mining',
                'Network', 'Spatial', 'Survival']),
    ('T_FUND', ['R-Basics', 'R-Beginner', 'R-Vectors', 'R-Lists', 'R-Data-Frames', 'R-Subsetting',
                'R-Control-Flow', 'R-Functions', 'R-Apply', 'Apply-Family', 'R-String', 'Loops-vs',
                'Interview', 'R-for-Data-Science']),
]


def build_exercises():
    import glob
    css, sprite, body = load_fragment('exercises')
    manifest = json.load(open(os.path.join(REPO_ROOT, 'functions', '_data', 'exercise-manifest.json'), encoding='utf-8'))
    hubs = manifest['hubs']
    lessons_dir = os.path.join(REPO_ROOT, '_lessons')

    # classify every hub into exactly one topic (first-match-wins, fail loudly).
    # Interactive-lesson hubs share the exercise grading manifest (their gated
    # steps award XP through the same backend) but are NOT exercise hubs - they
    # belong to the lesson player, not the Exercises landing - so skip them.
    counts = {key: 0 for key, _ in _EX_TOPIC_RULES}
    skipped = 0
    for slug in hubs:
        if os.path.exists(os.path.join(lessons_dir, slug + '.html')):
            skipped += 1
            continue
        for key, subs in _EX_TOPIC_RULES:
            if any(s in slug for s in subs):
                counts[key] += 1
                break
        else:
            raise RuntimeError(f'exercises: hub not classified into any topic: {slug}')
    if sum(counts.values()) != len(hubs) - skipped:
        raise RuntimeError(f'exercises: topic counts {sum(counts.values())} != hub total {len(hubs) - skipped}')

    quizzes = len(glob.glob(os.path.join(REPO_ROOT, '*-quiz.html')))

    vals = {
        'TOTAL_EX': f"{manifest['_meta']['exercises']:,}",
        'TOTAL_HUBS': str(manifest['_meta']['hubs']),
        'T_QUIZ': str(quizzes),
        'S_BASICS': str(len(hubs['R-Basics-Exercises'])),
        'S_VECTORS': str(len(hubs['R-Vectors-Exercises'])),
        'S_DPLYR': str(len(hubs['dplyr-filter-select-Exercises'])),
        'S_GGPLOT': str(len(hubs['ggplot2-Exercises'])),
        'S_HYP': str(len(hubs['Hypothesis-Testing-Exercises-in-R'])),
    }
    vals.update({k: str(v) for k, v in counts.items()})
    for k, v in vals.items():
        body = body.replace('{{' + k + '}}', v)
    if '{{' in body:
        import re as _re
        raise RuntimeError('exercises: unfilled placeholders: ' + str(_re.findall(r'\{\{[A-Z_]+\}\}', body)))

    # validate every internal hub/page link target exists on disk (fail loudly)
    import re as _re
    for href in set(_re.findall(r'href="/([A-Za-z0-9._-]+\.html)"', body)):
        if not os.path.exists(os.path.join(REPO_ROOT, href)):
            raise RuntimeError(f'exercises: link target missing on disk: /{href}')

    collection = {'@context': 'https://schema.org', '@type': 'CollectionPage',
                  'name': 'R Exercises, r-statistics.co', 'url': SITE + '/exercises/',
                  'description': f"{manifest['_meta']['exercises']} auto-graded R exercises across {manifest['_meta']['hubs']} practice hubs."}
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Exercises', 'item': SITE + '/exercises/'}]}
    render_page(
        'exercises/index.html', SITE + '/exercises/',
        'R Exercises · r-statistics.co',
        '2,904 auto-graded R exercises across 127 hubs: base R, dplyr, ggplot2, statistics, and machine learning. Write real R, get it checked instantly. Free to attempt, no signup.',
        body, page_css=css, sprite=sprite, active='exercises',
        page_js=['/www/exercises-page.js?v=3'], jsonld=[collection, breadcrumb],
        keywords='R exercises, R practice problems, learn R by doing, dplyr exercises, ggplot2 exercises, R coding challenges, auto-graded R, R interview questions')
    print(f"  (exercises: {manifest['_meta']['exercises']} exercises / {len(hubs)} hubs · topics "
          + ', '.join(f"{k}={counts[k]}" for k, _ in _EX_TOPIC_RULES) + f", quizzes={quizzes})")


def build_roadmap():
    import glob
    css, sprite, body = load_fragment('roadmap')
    total = len(glob.glob(os.path.join(REPO_ROOT, '_posts', '*.html')))
    body = body.replace('{{TOTAL}}', f'{total:,}')
    if '{{' in body:
        import re as _re
        raise RuntimeError('roadmap: unfilled placeholders: ' + str(_re.findall(r'\{\{[A-Z_]+\}\}', body)))
    webpage = {'@context': 'https://schema.org', '@type': 'WebPage',
               'name': 'R Learning Roadmap, r-statistics.co', 'url': SITE + '/roadmap/',
               'description': 'Guided routes through the r-statistics.co library, sequenced by where you are headed: new to R, data analyst, machine learning, research, or time series.'}
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Roadmap', 'item': SITE + '/roadmap/'}]}
    render_page(
        'roadmap/index.html', SITE + '/roadmap/',
        'R Learning Roadmap · r-statistics.co',
        'A guided route through R, sequenced by your goal: new to R, data analyst, machine learning, researcher, or time series. Each stage earns the next, ending in a verifiable certificate.',
        body, page_css=css, sprite=sprite, active='roadmap',
        page_js=['/www/roadmap-page.js?v=10'], jsonld=[webpage, breadcrumb],
        keywords='R learning roadmap, learn R path, R study plan, data science roadmap, how to learn R, R curriculum, R learning order')
    print(f'  (roadmap: total={total:,})')


def build_statistics():
    """Topic pilot page: /statistics/ (reusable pattern for the other 8 paths later)."""
    css, sprite, body = load_fragment('statistics')
    if '{{' in body:
        import re as _re
        raise RuntimeError('statistics: unfilled placeholders: ' + str(_re.findall(r'\{\{[A-Z_]+\}\}', body)))
    # validate internal links exist on disk (fail loudly)
    import re as _re
    for href in set(_re.findall(r'href="/([A-Za-z0-9._-]+\.html)"', body)):
        if not os.path.exists(os.path.join(REPO_ROOT, href)):
            raise RuntimeError(f'statistics: link target missing on disk: /{href}')
    webpage = {'@context': 'https://schema.org', '@type': 'CollectionPage',
               'name': 'Statistics with R, r-statistics.co', 'url': SITE + '/statistics/',
               'description': 'The statistics learning path in R: probability, inference, regression, ANOVA, categorical analysis, and Bayesian methods, in the order to learn them.'}
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Statistics', 'item': SITE + '/statistics/'}]}
    render_page(
        'statistics/index.html', SITE + '/statistics/',
        'Statistics with R · r-statistics.co',
        'Learn statistics in R the right way round: probability, inference, regression, ANOVA, and Bayesian methods, in a sequence that builds. Every concept runs live in the browser.',
        body, page_css=css, sprite=sprite, active='',
        page_js=['/www/statistics-page.js?v=1'], jsonld=[webpage, breadcrumb],
        keywords='statistics in R, learn statistics with R, R hypothesis testing, R regression, ANOVA in R, probability in R, Bayesian statistics R, statistical inference R')
    print('  (statistics topic pilot built)')


def build_verify():
    """Dedicated credential-lookup page: /verify/ (RST id -> /cert/<id>)."""
    css, sprite, body = load_fragment('verify')
    webpage = {'@context': 'https://schema.org', '@type': 'WebPage',
               'name': 'Verify a credential, r-statistics.co', 'url': SITE + '/verify/',
               'description': 'Verify any r-statistics.co certificate by its public credential ID. See the holder, track, assessment score and issue date. No account needed.'}
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Verify a credential', 'item': SITE + '/verify/'}]}
    render_page(
        'verify/index.html', SITE + '/verify/',
        'Verify a Credential · r-statistics.co',
        'Verify any r-statistics.co certificate by its public credential ID. See the holder, track, assessment score and issue date, no account needed.',
        body, page_css=css, sprite=sprite, active='',
        page_js=['/www/verify-page.js?v=2'], jsonld=[webpage, breadcrumb],
        keywords='verify R certificate, credential verification, r-statistics.co credential, check certificate ID, verify data science certificate')
    print('  (verify credential page built)')


def build_dashboard():
    """Private signed-in dashboard: /dashboard.html (anon -> redirected to sign-in by JS)."""
    css, sprite, body = load_fragment('dashboard')
    render_page(
        'dashboard.html', SITE + '/dashboard.html',
        'Dashboard · r-statistics.co',
        'Your r-statistics.co dashboard: progress, streak, certificates and saved posts.',
        body, page_css=css, sprite=sprite, active='',
        page_js=['/www/dashboard-page.js?v=3'], robots='noindex, nofollow')
    print('  (dashboard built)')


# Public section pages to register in sitemap.xml (canonical URL -> built file).
# Dashboard is deliberately excluded (private, noindex).
_SITEMAP_PAGES = [
    ('https://r-statistics.co/certifications', 'certifications.html'),
    ('https://r-statistics.co/tutorials/', 'tutorials/index.html'),
    ('https://r-statistics.co/exercises/', 'exercises/index.html'),
    ('https://r-statistics.co/roadmap/', 'roadmap/index.html'),
    ('https://r-statistics.co/statistics/', 'statistics/index.html'),
    ('https://r-statistics.co/verify/', 'verify/index.html'),
]


def register_sitemap():
    """Insert the public section pages into sitemap.xml if absent. Runs after
    build.py has (re)written the sitemap, so it only ever appends new <url>s."""
    import datetime
    path = os.path.join(REPO_ROOT, 'sitemap.xml')
    if not os.path.exists(path):
        return
    xml = open(path, encoding='utf-8').read()
    added = 0
    for url, relfile in _SITEMAP_PAGES:
        if f'<loc>{url}</loc>' in xml:
            continue
        fp = os.path.join(REPO_ROOT, *relfile.split('/'))
        lastmod = (datetime.date.fromtimestamp(os.path.getmtime(fp)).isoformat()
                   if os.path.exists(fp) else datetime.date.today().isoformat())
        block = (f'  <url>\n    <loc>{url}</loc>\n    <changefreq>weekly</changefreq>\n'
                 f'    <lastmod>{lastmod}</lastmod>\n    <priority>0.9</priority>\n  </url>\n')
        xml = xml.replace('</urlset>', block + '</urlset>', 1)
        added += 1
    if added:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(xml)
    print(f'  (sitemap: +{added} section pages)')


def build_all():
    """Build every wired section page. Section builders are added per phase."""
    build_certification()
    build_tools()
    build_tutorials()
    build_exercises()
    # build_roadmap() superseded 2026-06-21 by the hand-authored F2 page
    # (roadmap/index.html + role pages via _build/build_roadmap_f2.js). The v3
    # fragment generator must NOT regenerate roadmap/index.html or it clobbers F2.
    build_statistics()
    build_verify()
    # build_dashboard() superseded 2026-06-21 by the hand-authored F2 dashboard
    # (/dashboard.html + www/dashboard.js). Do NOT regenerate or it clobbers F2.
    register_sitemap()


if __name__ == '__main__':
    import sys
    if '--smoketest' in sys.argv:
        _render_smoketest()
    else:
        build_all()

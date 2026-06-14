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
import os, json
import html as htmllib

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://r-statistics.co'

# v3 masthead nav: (label, href, active-key)
NAV = [
    ('Roadmap', '/roadmap/', 'roadmap'),
    ('Tutorials', '/tutorials/', 'tutorials'),
    ('Exercises', '/exercises/', 'exercises'),
    ('Tools', '/tools/', 'tools'),
    ('Certification', '/certifications/', 'certification'),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700'
         '&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500'
         '&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">')

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
    links = []
    for label, href, key in NAV:
        cls = ' class="on"' if key == active else ''
        links.append(f'      <a href="{href}"{cls}>{label}</a>')
    nav = '\n'.join(links)
    return f'''<header class="masthead">
  <div class="wrap">
    <a class="wordmark" href="/"><span class="mark">R</span>r-statistics<span class="co">.co</span></a>
    <nav class="nav">
{nav}
    </nav>
    <div class="mh-right">
      <a class="btn-pro" href="/pricing.html"><svg class="ic"><use href="#i-spark"/></svg> Try Pro free</a>
      <button class="iconbtn" id="darkBtn" onclick="toggleDark()" aria-label="Toggle dark mode" type="button">&#9789;</button>
      <span class="auth-anon"><a class="masthead-auth-link" href="/signin.html">Sign in</a></span>
      <span class="auth-user"></span>
    </div>
  </div>
</header>'''


def render_scripts(page_js=None):
    parts = [ANALYTICS,
             '  <script defer src="/www/auth-hydrate.js?v=10"></script>',
             '  <script defer src="/www/sections-v3.js?v=1"></script>',
             '  <script defer src="/www/signin-nudge.js?v=10"></script>']
    for src in (page_js or []):
        parts.append(f'  <script defer src="{src}"></script>')
    return '\n'.join(parts)


def render_page(out_relpath, canonical, title, description, body_html, *,
                page_css='', sprite='', active='', page_js=None,
                keywords='', jsonld=None, og_image='/screenshots/og-default.png',
                inline_js=''):
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
<meta name="robots" content="index, follow">
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
<link rel="stylesheet" href="/www/sections-v3.css?v=1">
<style>
{page_css}
</style>
</head>
<body>
{sprite}
{render_masthead(active)}
{body_html}
{render_scripts(page_js)}
{('  <script>' + inline_js + '</script>') if inline_js else ''}
</body>
</html>
'''
    footer = open(os.path.join(REPO_ROOT, '_build', 'site_footer.html'), encoding='utf-8').read()
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
        page_js=['/www/cert-page.js?v=1'], jsonld=[webpage, breadcrumb],
        keywords='R certification, R programming certificate, verifiable credential, data science certificate, tidyverse certification, machine learning R certificate, statistics certificate, open badges')


# Tools index: (display name, monogram letter, tagline) aligned to gen_tools_landing.CATEGORIES order.
_TOOLS_CAT_META = [
    ('Calculators', 'C', 'run a test, get a number'),
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


def build_tutorials():
    import glob
    css, sprite, body = load_fragment('tutorials')
    # Total published pages = one _posts/*.html fragment per built page (committed; curriculum-status.json is gitignored).
    total = len(glob.glob(os.path.join(REPO_ROOT, '_posts', '*.html')))
    body = body.replace('{{TOTAL}}', f'{total:,}')
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


def build_all():
    """Build every wired section page. Section builders are added per phase."""
    build_certification()
    build_tools()
    build_tutorials()


if __name__ == '__main__':
    import sys
    if '--smoketest' in sys.argv:
        _render_smoketest()
    else:
        build_all()

"""Generate /assessment/<id>.html for every handbook section.

One page per section of the Time Series and Statistics handbooks (27 total).
Pages carry the full site chrome by reusing gen_sections.render_page, so they
get the masthead, auth hydration, dark mode, footer and analytics for free.

The page itself is a shell: #asmt is filled by www/assessment.js, which pulls
the questions from /api/assessment/<id>. Nothing about the question bank is
present in the HTML, so there is nothing to scrape.

    python Scripts/gen_assessments.py
"""
import importlib.util
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, '_build'))

spec = importlib.util.spec_from_file_location(
    'gen_sections', os.path.join(REPO_ROOT, '_build', 'gen_sections.py'))
gs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gs)

SITE = 'https://r-statistics.co'
OUT_DIR = os.path.join(REPO_ROOT, 'assessment')

PAGE_CSS = """
.asmt-page{max-width:900px;margin:0 auto;padding:34px 20px 80px}
.asmt-crumb{font-size:13px;color:#6b7280;margin:0 0 14px}
.asmt-crumb a{color:#2056d2;text-decoration:none}
.asmt-h1{font-family:'IBM Plex Serif',Georgia,serif;font-size:30px;font-weight:700;
  color:#16181d;margin:0 0 8px;letter-spacing:-.3px;line-height:1.2}
.asmt-dek{font-size:16px;color:#4b5160;margin:0 0 26px;max-width:64ch}
html.dark .asmt-h1{color:#eef2fa}
html.dark .asmt-dek{color:#c8d0e0}
html.dark .asmt-crumb{color:#9aa6c0}
@media (prefers-color-scheme:dark){
  .asmt-h1{color:#eef2fa}.asmt-dek{color:#c8d0e0}.asmt-crumb{color:#9aa6c0}
}
"""


def build_page(aid, meta, book_href):
    title = f"{meta['title']} assessment | {meta['book_title']}"
    desc = (f"Test what you learned in Part {meta['section']} of {meta['book_title']}: "
            f"{meta['title'].lower()}. Twelve questions drawn at random, scored, free to take.")
    canonical = f"{SITE}/assessment/{aid}.html"

    body = f'''
<main class="asmt-page">
  <p class="asmt-crumb"><a href="{book_href}">{gs._esc(meta['book_title'])}</a> &rsaquo; Part {meta['section']}</p>
  <h1 class="asmt-h1">{gs._esc(meta['title'])}</h1>
  <p class="asmt-dek">Twelve questions on what Part {meta['section']} covered, drawn at random from a larger
     set so no two attempts are the same. Free to take. Your score, what you missed, and where
     you stand against everyone else who has taken it.</p>
  <div class="asmt" id="asmt" data-assessment-id="{gs._esc(aid)}"></div>
</main>
'''

    jsonld = [{
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": f"{meta['title']} assessment",
        "educationalLevel": "Intermediate",
        "about": {"@type": "Thing", "name": meta['title']},
        "provider": {"@type": "Organization", "name": "r-statistics.co", "url": SITE},
        "url": canonical,
    }]

    gs.render_page(
        out_relpath=os.path.join('assessment', f'{aid}.html'),
        canonical=canonical,
        title=title,
        description=desc,
        body_html=body,
        page_css=PAGE_CSS,
        active='tutorials',
        page_js=['/www/assessment.js?v=1'],
        keywords=f"{meta['title']}, R assessment, quiz, {meta['book_title']}",
        jsonld=jsonld,
    )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    meta_path = os.path.join(REPO_ROOT, 'functions', '_data', 'assessments.json')
    metas = json.load(open(meta_path, encoding='utf-8'))

    curricula = json.load(open(os.path.join(REPO_ROOT, 'www', 'curricula.json'), encoding='utf-8'))
    book_href = {b['key']: b['index'] for b in curricula['books']}

    # The assessment player stylesheet is a page-level asset, injected once here
    # rather than through the shared sections stylesheet.
    css_link = '<link rel="stylesheet" href="/www/assessment.css?v=1">'
    n = 0
    for aid, meta in sorted(metas.items()):
        build_page(aid, meta, book_href.get(meta['book'], '/tutorials/'))
        # render_page has no stylesheet hook, so patch the link in after write.
        p = os.path.join(OUT_DIR, f'{aid}.html')
        html = open(p, encoding='utf-8').read()
        if css_link not in html:
            html = html.replace('<style>\n\n.asmt-page', css_link + '\n<style>\n\n.asmt-page', 1)
            if css_link not in html:  # fallback anchor
                html = html.replace('</head>', css_link + '\n</head>', 1)
            open(p, 'w', encoding='utf-8', newline='\n').write(html)
        n += 1
    print(f'WROTE {n} assessment pages to /assessment/')


if __name__ == '__main__':
    main()

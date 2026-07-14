# -*- coding: utf-8 -*-
"""Build www/exercise-catalog.json: the data file behind /exercises/.

Sources (all already maintained by the publish pipeline):
  - www/sidebar.json                Practice Exercises items (display titles)
  - functions/_data/exercise-manifest.json   per-problem difficulty (build_exercise_manifest.py)
  - curriculum-status.json          slug -> learning-path mapping (gitignored, local)
  - <hub>.html root pages           lead blurb, section titles, per-problem titles

A new exercise hub appears here automatically once it is published and the
manifest regenerates. Only a brand-new TOPIC needs a keyword line below.

Run: python Scripts/build_exercise_catalog.py   (from the repo root)
"""
import json, io, os, re, html, hashlib, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PATH_NAME = {'/learn-r/': 'R Fundamentals', '/data-wrangling/': 'Data Wrangling',
 '/visualization/': 'Visualization', '/statistics/': 'Statistics',
 '/time-series/': 'Time Series', '/machine-learning/': 'Machine Learning',
 '/advanced-r/': 'Advanced R', '/reporting/': 'Reporting',
 '/specializations/': 'Specializations'}
COLLECTIONS = ('R-Interview-Questions', 'Statistics-Interview-Questions', 'ML-Interview-Questions',
 'Top-20-Bayesian', 'Probability-Puzzles', 'AB-Testing-Interview', 'SQL-to-dplyr',
 'Top-25-Regression', 'Top-20-Time-Series', 'Resampling-Problems', 'Data-Cleaning-Gauntlet',
 'Error-Triage', 'Regex-Drills', 'Dates-and-Times-Drills', 'Base-R-Speed-Round',
 'ggplot2-Recreation', 'Take-Home-Assignment')
ORDER = ['Collections'] + list(PATH_NAME.values())

KEYMAP = [
 (('Apply-Family','R-Beginner','R-Debugging','Loops-vs-Vectorization','purrr','R-for-Data-Science'), 'R Fundamentals'),
 (('API-Calls','Data-Cleaning','Data-Wrangling','data.table','dbplyr','dplyr','tidyr','tidyverse',
   'readr','stringr','lubridate','forcats','Regex','Web-Scraping','Date-Time-Manipulation'), 'Data Wrangling'),
 (('Data-Visualization','ggplot2','plotly','leaflet','EDA'), 'Visualization'),
 (('A-B-Testing','Bayesian','Correlation','Mixed-Effects','Poisson-Regression',
   'Probability-Distributions','Sampling-Methods','Survey-Analysis','Survival-Analysis','GAM','broom'), 'Statistics'),
 (('ARIMA','Time-Series'), 'Time Series'),
 (('Clustering','Cross-Validation','Decision-Tree','Machine-Learning','Random-Forest',
   'XGBoost','caret','tidymodels','Ridge-and-Lasso'), 'Machine Learning'),
 (('Parallel-Computing','R-Package-Development','R-Performance-Optimization','testthat','Shiny'), 'Advanced R'),
 (('R-Markdown','gt-Tables'), 'Reporting'),
 (('R-for-','Network-Analysis','Spatial-Analysis','Text-Mining'), 'Specializations'),
]

def keycat(slug):
    for keys, cat in KEYMAP:
        if any(slug.startswith(k) or k in slug for k in keys):
            return cat
    return None

def strip_tags(x):
    return html.unescape(re.sub(r'<[^>]+>', '', x)).strip()

def parse_hub(slug):
    path = slug + '.html'
    if not os.path.exists(path):
        return '', {}, {}
    s = io.open(path, encoding='utf-8').read()
    lead = re.search(r'<p class="lead"[^>]*>(.*?)</p>', s, re.S)
    md = re.search(r'<meta name="description" content="([^"]*)"', s)
    blurb = strip_tags(lead.group(1)) if lead else (md.group(1) if md else '')
    if len(blurb) > 220:
        blurb = blurb[:217].rsplit(' ', 1)[0] + '...'
    sec_titles = {}
    for m in re.finditer(r'<h2[^>]*>\s*Section\s+(\d+)[.:]?\s*(.*?)</h2>', s, re.S):
        t = re.sub(r'\s*\(\d+ problems?\)\s*$', '', strip_tags(m.group(2)))
        sec_titles[int(m.group(1))] = t
    ex_titles = {}
    for m in re.finditer(r'id="(' + re.escape(slug) + r'-ex-[\d-]+)"[^>]*>.*?<h3 class="exercise-title"[^>]*>(.*?)</h3>', s, re.S):
        t = re.sub(r'^Exercise\s+[\d.]+\s*[:.]?\s*', '', strip_tags(m.group(2)))
        if len(t) > 90: t = t[:87].rsplit(' ', 1)[0] + '...'
        ex_titles[m.group(1)] = t
    return blurb, sec_titles, ex_titles

def main():
    sidebar = json.load(open('www/sidebar.json', encoding='utf-8'))
    manifest = json.load(open('functions/_data/exercise-manifest.json', encoding='utf-8'))
    hubs = manifest['hubs']
    slug2path = {}
    if os.path.exists('curriculum-status.json'):
        cur = json.load(open('curriculum-status.json', encoding='utf-8'))
        for pk, path in cur['paths'].items():
            for sk, sp in path['sub_paths'].items():
                for p in sp['posts']:
                    sl = (p.get('slug') or '').replace('.html', '')
                    if sl: slug2path[sl] = PATH_NAME.get(pk)

    sec = next(s for s in sidebar if s.get('title') == 'Practice Exercises')
    cats = {k: [] for k in ORDER + ['Other']}
    quizzes = []
    for item in sec['items']:
        if item.get('divider'): continue
        slug = item['href'].replace('.html', '')
        if slug.endswith('-quiz'):
            q = {'title': item['text'], 'href': item['href'], 'slug': slug, 'mins': None}
            if os.path.exists(slug + '.html'):
                m = re.search(r'(\d+)\s*min', io.open(slug + '.html', encoding='utf-8').read())
                if m: q['mins'] = int(m.group(1))
            quizzes.append(q)
            continue
        ex = hubs.get(slug)
        row = {'title': re.sub(r'\s*\(\d+ problems?\)', '', item['text']),
               'href': item['href'], 'slug': slug}
        if ex:
            d = list(ex.values())
            b, i, a = d.count('beginner'), d.count('intermediate'), d.count('advanced')
            row.update(n=len(d), b=b, i=i, a=a, xp=b*10 + i*25 + a*50, mins=b*2 + i*4 + a*7)
            share_b, share_a = b/len(d), a/len(d)
            row['level'] = 'Starter' if share_b >= .5 else ('Challenge' if share_a >= .3 else 'Core')
        else:
            row.update(n=0, b=0, i=0, a=0, xp=0, mins=0, level='Core')
        blurb, sec_titles, ex_titles = parse_hub(slug)
        row['blurb'] = blurb
        groups, idx = {}, 0
        for eid, dif in (ex or {}).items():
            idx += 1
            m = re.search(r'-ex-(\d+)-(\d+)$', eid)
            snum = int(m.group(1)) if m else 1
            groups.setdefault(snum, []).append(
                {'id': eid, 'n': idx, 'd': {'beginner':'b','intermediate':'i','advanced':'a'}[dif],
                 't': ex_titles.get(eid, '')})
        row['sections'] = [{'num': k, 'title': sec_titles.get(k, f'Section {k}'),
                            'problems': v} for k, v in sorted(groups.items())]
        if any(slug.startswith(c) for c in COLLECTIONS):
            cat = 'Collections'
        else:
            cat = slug2path.get(slug) or keycat(slug) or 'Other'
        cats[cat].append(row)

    for k in cats:
        cats[k].sort(key=lambda h: (-(h['b']/h['n']) if h['n'] else 0,
                                    (h['a']/h['n']) if h['n'] else 0, h['title']))
    other = [h['slug'] for h in cats['Other']]
    if other:
        sys.stderr.write('WARNING: uncategorized hubs (add a KEYMAP line): %s\n' % other)
    out_cats = [{'name': k, 'hubs': cats[k]} for k in ORDER + ['Other'] if cats[k]]
    tot_n = sum(h['n'] for c in out_cats for h in c['hubs'])
    tot_h = sum(len(c['hubs']) for c in out_cats)
    tot_xp = sum(h['xp'] for c in out_cats for h in c['hubs'])
    out = {'categories': out_cats, 'quizzes': quizzes,
           'totals': {'hubs': tot_h, 'exercises': tot_n, 'xp': tot_xp},
           'xp_rules': {'beginner': 10, 'intermediate': 25, 'advanced': 50}}
    payload = json.dumps(out, separators=(',', ':'))
    io.open('www/exercise-catalog.json', 'w', encoding='utf-8', newline='\n').write(payload)
    h8 = hashlib.md5(payload.encode()).hexdigest()[:8]
    print(f'www/exercise-catalog.json: {tot_h} hubs / {tot_n} problems / {tot_xp} XP / {len(quizzes)} quizzes / {len(payload)//1024}KB / hash {h8}')
    return h8

if __name__ == '__main__':
    main()

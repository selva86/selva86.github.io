# -*- coding: utf-8 -*-
"""Generate exercises/index.html (the Practice library) and practice-menu.json (the
navbar Practice menu's data). Design: design_handoff_practice_library + practice_menu
(2026-10).

Everything structural is server-rendered from www/exercise-catalog.json so the page
reads and crawls without JavaScript (every hub row is a plain link). The page script
only fills in what belongs to the visitor: progress from /api/me/practice, the free
plan allowance from /api/me/meter, the activity calendar. Signed-out visitors see the
honest zero state. No invented numbers anywhere: counts come from the catalog, the
free allowance from functions/_lib/meter.ts.

Data: www/exercise-catalog.json (Scripts/build_exercise_catalog.py). Rebuild that
first when hubs change, then rerun this. CI runs it through gen_sections.py.

Run: python _build/gen_exercises_index.py    (from the repo root)
"""
import json, io, os, re, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

DATA = json.load(open('www/exercise-catalog.json', encoding='utf-8'))
CATS = DATA['categories']; QUIZZES = DATA['quizzes']; TOT = DATA['totals']
shell = io.open('_build/exercises-shell.html', encoding='utf-8').read()

# The free allowance is enforced in functions/_lib/meter.ts; quote the same number.
_m = re.search(r'export const METER_LIMIT = (\d+);', io.open('functions/_lib/meter.ts', encoding='utf-8').read())
assert _m, 'METER_LIMIT not found in functions/_lib/meter.ts'
METER_LIMIT = int(_m.group(1))

FEATURED = 'Featured Problem Sets'
# Topic colour, short id, one-line description (design handoff), menu icon.
TOPIC_META = {
    'R Fundamentals':   ('fund', '#1F6B4A', 'Vectors, data frames, functions, and the base R muscle memory everything else builds on.', 'M5 8l4 4-4 4M12 16h7'),
    'Data Wrangling':   ('wrangle', '#2E9C74', 'Import, clean, reshape, and join real datasets with dplyr, tidyr, and friends.', 'M4 6h16M7 12h10M10 18h4'),
    'Visualization':    ('viz', '#2F7FA0', 'Charts that read clearly, from a first ggplot2 bar chart to themed, faceted figures.', 'M4 20h16M6 20v-6M10 20V9M14 20v-8M18 20V5'),
    'Statistics':       ('stats', '#5A6FB5', 'Probability, tests, confidence intervals, and regression, practiced until the output makes sense.', 'M3 19h18M4 18c3 0 4-11 8-11s5 11 8 11'),
    'Time Series':      ('ts', '#7A5CA8', 'Dates, decomposition, and ARIMA forecasting drills.', 'M3 17l5-5 4 3 6-7M14 8h4v4'),
    'Machine Learning': ('ml', '#3F9DA0', 'Train, validate, and tune models: trees, forests, boosting, clustering.', 'M8 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M14 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0M8 7h8M7 9l4 6M17 9l-4 6'),
    'Advanced R':       ('adv', '#4A5560', 'Performance, packages, testing, and Shiny apps.', 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9'),
    'Reporting':        ('report', '#7C9A3A', 'R Markdown documents and publication tables.', 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5'),
    'Specializations':  ('spec', '#9A5A8A', 'Domain practice: finance, genomics, healthcare, marketing, spatial, text.', 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'),
}
# Featured sets by goal (the families the old shelf rings used), in display order.
GOALS = [
    ('interview-prep', 'Interview prep', 'M4 8h16v11H4zM9 8V5h6v3M4 13h16', 'All interview sets',
     ['R-Interview-Questions', 'Statistics-Interview-Questions', 'ML-Interview-Questions-in-R', 'AB-Testing-Interview-Cases',
      'SQL-to-dplyr-Translations', 'Take-Home-Assignment-Simulator']),
    ('everyday-fluency', 'Everyday fluency', 'M13 3L5 14h6l-1 7 8-11h-6l1-7z', 'All fluency drills',
     ['Base-R-Speed-Round', 'Regex-Drills-in-R', 'Dates-and-Times-Drills-in-R', 'Error-Triage-Drills-in-R', 'Data-Cleaning-Gauntlet']),
    ('statistics-depth', 'Statistics depth', 'M3 19h18M4 18c3 0 4-11 8-11s5 11 8 11', 'All statistics sets',
     ['Top-20-Bayesian-Problems-in-R', 'Probability-Puzzles-for-Interviews', 'Top-25-Regression-Problems-in-R',
      'Top-20-Time-Series-Problems-in-R', 'Resampling-Problems-in-R', 'ggplot2-Recreation-Challenge']),
]
# Quiz -> topic as the design groups them (the interview quiz belongs to a featured
# set, which is not a topic; the design files it under R Fundamentals).
QUIZ_TOPIC = {'R Interview Readiness Quiz': 'R Fundamentals'}
QUIZ_ICONS = {
    'R Fundamentals Quiz': 'M5 8l4 4-4 4M12 16h7',
    'Functional Programming Quiz': 'M8 4c-2 0-3 1-3 3v2c0 1-1 2-2 3 1 1 2 2 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1 1 2 2 3-1 1-2 2-2 3v2c0 2-1 3-3 3',
    'R Interview Readiness Quiz': 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    'dplyr Quiz': 'M4 5h16l-6 7v6l-4 2v-8z',
    'tidyr Quiz': 'M4 4h16v16H4zM4 10h16M10 4v16',
    'ggplot2 Quiz': 'M4 20h16M6 20v-6M10 20V9M14 20v-8M18 20V5',
    'Hypothesis Testing Quiz': 'M3 19h18M4 18c3 0 4-11 8-11s5 11 8 11',
    'Linear Regression Quiz': 'M4 19L20 6M6 15h.01M9 14h.01M12 10h.01M15 9h.01M17 11h.01',
    'Time Series Quiz': 'M3 17l5-5 4 3 6-7M14 8h4v4',
    'Machine Learning Quiz': 'M8 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M14 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0M8 7h8M7 9l4 6M17 9l-4 6',
    'Shiny Quiz': 'M3 5h18v14H3zM3 9h18M6.5 7h.01M9 7h.01',
}
MEDAL = 'M12 14.5a5 5 0 1 1 0-10a5 5 0 1 1 0 10M12 7.3l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3zM8.6 13.2L7 21l5-2.6 5 2.6-1.6-7.8'


def esc(s): return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('"', '&quot;')
def num(n): return '{:,}'.format(n)
def url(href): return '/' + href.lstrip('/')
def ico(d, s=24, cls=''):
    return (f'<svg{" class=" + chr(34) + cls + chr(34) if cls else ""} width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="{d}"/></svg>')
def clean_title(t):
    t = re.sub(r' \((\d+)\)$', '', t)                 # "Error Triage Drills (20)" -> count shows in the pill
    t = re.sub(r' \(\d+ ([A-Za-z]+)\)$', r' \1', t)   # "SQL to dplyr (30 Translations)" -> "SQL to dplyr Translations"
    return t


# ---------------- data ----------------
feat_cat = next(c for c in CATS if c['name'] == FEATURED)
TOPICS = [c for c in CATS if c['name'] != FEATURED]
assert set(TOPIC_META) == {c['name'] for c in TOPICS}, 'a topic is missing from TOPIC_META: %r' % ({c['name'] for c in TOPICS} ^ set(TOPIC_META))
feat_by_slug = {h['slug']: h for h in feat_cat['hubs']}
goal_slugs = [s for g in GOALS for s in g[4]]
assert sorted(goal_slugs) == sorted(feat_by_slug), 'featured sets and GOALS disagree: %r' % (set(goal_slugs) ^ set(feat_by_slug))
hub_topic = {h['slug']: c['name'] for c in CATS for h in c['hubs']}
ALL_HUBS = [h for c in CATS for h in c['hubs']]
assert sum(h['n'] for h in ALL_HUBS) == TOT['exercises'] and len(ALL_HUBS) == TOT['hubs']
DIFF_TOT = {'beginner': sum(h['b'] for h in ALL_HUBS), 'intermediate': sum(h['i'] for h in ALL_HUBS), 'advanced': sum(h['a'] for h in ALL_HUBS)}
TOPIC_HUBS = sum(len(c['hubs']) for c in TOPICS)

quiz_by_topic = {c['name']: [] for c in TOPICS}
for q in QUIZZES:
    base = q['slug'][:-5] if q['slug'].endswith('-quiz') else q['slug']
    t = QUIZ_TOPIC.get(q['title']) or hub_topic.get(base)
    assert t in quiz_by_topic, 'quiz %r has no topic' % q['title']
    quiz_by_topic[t].append(q)
QUIZ_ORDER = [q for c in TOPICS for q in quiz_by_topic[c['name']]]
QUIZ_TOPICS = sum(1 for c in TOPICS if quiz_by_topic[c['name']])
_qm = sorted({q['mins'] for q in QUIZZES})
QUIZ_MINS = ('%d minutes' % _qm[0]) if len(_qm) == 1 else ('%d to %d minutes' % (_qm[0], _qm[-1]))

# ---------------- page sections ----------------
def runs_bar():
    return (f'<div class="exl-runs" id="exlRuns" data-v="anon" role="region" aria-label="Free plan">'
            f'<div class="exl-in">'
            f'<span class="exl-pill" data-anon>Free account</span>'
            f'<span class="exl-rt" data-anon><b>{METER_LIMIT} graded exercises a month</b>, with your XP and progress saved</span>'
            f'<span class="exl-pill" data-free>Free plan</span>'
            f'<span class="exl-rt" data-free><b id="exlLeft">{METER_LIMIT} of {METER_LIMIT}</b> left this month <span class="exl-rr" id="exlReset"></span></span>'
            f'<span class="exl-rgap"></span>'
            f'<span class="exl-rn" data-free>Hubs you start stay open all month</span>'
            f'<a class="exl-rl" href="/signin.html?next=%2Fexercises%2F" data-anon>Sign in</a>'
            f'<a class="exl-rb" href="/signin.html?next=%2Fexercises%2F" data-anon>Create free account</a>'
            f'<a class="exl-rb" href="/pricing.html" data-free>Go unlimited</a>'
            f'</div></div>')


def hero():
    jumps = [('start', 'New to R', '/R-Beginner-Exercises.html', 'M5 8l4 4-4 4M12 16h7')] + \
            [(g[0], g[1], '/exercises/#goal-' + g[0], g[2]) for g in GOALS]
    tiles = ''.join(f'<a class="exl-jt" href="{h}" data-jt="{k}"><span class="exl-jti">{ico(d, 15)}</span><span class="exl-jtl">{esc(n)}</span></a>'
                    for k, n, h, d in jumps)
    return (
        '<section class="exl-hero" aria-labelledby="exlH1"><div class="exl-hin">'
        '<div class="exl-hl">'
        '<h1 id="exlH1">The practice workbook</h1>'
        '<p class="exl-lead">R sticks when you write it, not when you read about it. Each problem here checks your answer '
        'the moment you run it, so you always know which skills you own and which need another rep.</p>'
        f'<div class="exl-jump" id="exlJump">{tiles}</div>'
        '</div>'
        '<div class="exl-hright">'
        '<div class="exl-back" aria-hidden="true"></div>'
        '<div class="exl-photo"><img src="/www/img/practice-hero-1.jpg" width="1120" height="880" alt="" fetchpriority="high" decoding="async">'
        '<span class="exl-duo" aria-hidden="true"></span><span class="exl-scrim" aria-hidden="true"></span></div>'
        f'<span class="exl-chip"><span class="exl-chipi">{ico("M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2", 13)}</span>7 minutes, between lectures</span>'
        '<div class="exl-card" aria-label="Example problem">'
        '<div class="exl-cr"><span>Predict the output</span><span class="exl-hard">Hard</span></div>'
        '<pre class="exl-code"><code>x &lt;- c("10", "5", "20")\nas.numeric(factor(x))</code></pre>'
        '<div class="exl-cr"><code class="exl-out">[1] 1 3 2</code><span class="exl-ok">Correct &middot; +50 XP</span></div>'
        '</div>'
        '</div>'
        '</div></section>')


def featured():
    cards = []
    for gid, gname, gicon, _all, slugs in GOALS:
        hubs = [feat_by_slug[s] for s in slugs]
        rows = ''.join(f'<a class="exl-gr" href="{url(h["href"])}" data-hub="{h["slug"]}" data-n="{h["n"]}">'
                       f'<span class="exl-grt">{esc(clean_title(h["title"]))}</span><span class="exl-cnt">{h["n"]}</span></a>' for h in hubs)
        cards.append(
            f'<div class="exl-goal" id="goal-{gid}">'
            f'<div class="exl-gh"><span class="exl-tile">{ico(gicon, 20)}</span><span><b class="exl-pj">{esc(gname)}</b>'
            f'<span class="exl-meta">{len(hubs)} sets &middot; {num(sum(h["n"] for h in hubs))} problems</span></span></div>'
            f'<div class="exl-gl">{rows}</div>'
            f'<a class="exl-gf" href="{url(hubs[0]["href"])}" data-goal-first="{gid}">Open {esc(gname)} &rarr;</a></div>')
    return ('<section class="exl-sec" id="featured" aria-labelledby="exlFeat">'
            '<h2 id="exlFeat" class="exl-h2">Featured problem sets</h2>'
            f'<p class="exl-sub">{len(feat_cat["hubs"])} hand-picked sets, grouped by what you&#39;re practicing for.</p>'
            f'<div class="exl-goals">{"".join(cards)}</div></section>')


def wall():
    diff_rows = ''.join(
        f'<div class="exl-dr"><span class="exl-dn"><i style="background:{col}"></i>{lab}</span>'
        f'<span class="exl-dv"><b data-diff="{k}">0</b> / {num(DIFF_TOT[k])}</span>'
        f'<span class="exl-bar"><i data-diffbar="{k}" style="background:{col}"></i></span></div>'
        for k, lab, col in (('beginner', 'Easy', '#9FD3B6'), ('intermediate', 'Medium', '#4DB384'), ('advanced', 'Hard', '#0F3F2A')))
    topics = ''.join(
        f'<a class="exl-bti" href="#topic-{TOPIC_META[c["name"]][0]}" data-topic-link="{TOPIC_META[c["name"]][0]}">'
        f'<span class="exl-btn"><i style="background:{TOPIC_META[c["name"]][1]}"></i>{esc(c["name"])}</span>'
        f'<span class="exl-btv"><b data-tsolved="{TOPIC_META[c["name"]][0]}">0</b> / {num(sum(h["n"] for h in c["hubs"]))}</span>'
        f'<span class="exl-bar"><i data-tbar="{TOPIC_META[c["name"]][0]}" style="background:{TOPIC_META[c["name"]][1]}"></i></span></a>'
        for c in TOPICS)
    return ('<section class="exl-sec" id="wall" aria-labelledby="exlWall">'
            '<h2 id="exlWall" class="exl-h2">The Exercises Wall</h2>'
            '<p class="exl-sub" id="exlWallSub">Sign in and every solve shows up here, by difficulty, by day and by topic.</p>'
            '<div class="exl-wallc">'
            '<div class="exl-tot">'
            '<div class="exl-ring"><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="60" class="exl-rt0"/>'
            '<circle cx="70" cy="70" r="60" class="exl-rt1" id="exlRing" stroke-dasharray="0 377"/></svg>'
            f'<span class="exl-rc"><b id="exlTot" class="exl-pj">0</b><span>of {num(TOT["exercises"])} solved</span></span></div>'
            f'<div class="exl-diffs">{diff_rows}</div></div>'
            '<div class="exl-cal"><div class="exl-calh"><b class="exl-pj" id="exlCalT">0 solves in the last 6 months</b>'
            '<span id="exlCalM">0 active days &middot; longest streak 0 days</span></div>'
            '<div class="exl-calg" id="exlCal" role="img" aria-label="Daily solves over the last 26 weeks"></div>'
            '<div class="exl-leg"><span>Less</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>More</span></div></div>'
            f'<div class="exl-bt"><span class="exl-btt">By topic</span><div class="exl-btg">{topics}</div></div>'
            '</div></section>')


def browse():
    chips = ''.join(f'<a class="exl-chipt" href="#topic-{TOPIC_META[c["name"]][0]}" data-topic-link="{TOPIC_META[c["name"]][0]}">'
                    f'<i style="background:{TOPIC_META[c["name"]][1]}"></i>{esc(c["name"])} <span>{len(c["hubs"])}</span></a>' for c in TOPICS)
    cards = []
    for ti, c in enumerate(TOPICS, 1):
        tid, col, desc, _ = TOPIC_META[c['name']]
        hubs = c['hubs']
        probs = sum(h['n'] for h in hubs); xp = sum(h['xp'] for h in hubs)
        rows = ''.join(
            f'<a class="exl-hr" href="{url(h["href"])}" data-hub="{h["slug"]}" data-n="{h["n"]}" data-q="{esc(h["title"].lower())}">'
            f'<span class="exl-hn">{ti}.{hi}</span>'
            f'<span class="exl-hname"><span>{esc(h["title"])}</span></span>'
            f'<span class="exl-db" aria-label="{h["b"]} easy, {h["i"]} medium, {h["a"]} hard">'
            f'<i class="e" style="flex:{h["b"]}"></i><i class="m" style="flex:{h["i"]}"></i><i class="h" style="flex:{h["a"]}"></i></span>'
            f'<span class="exl-hd"><b>0</b>/{h["n"]}</span><span class="exl-hx">{num(h["xp"])} XP</span></a>'
            for hi, h in enumerate(hubs, 1))
        quiz = ''.join(
            f'<div class="exl-qs"><span class="exl-qsi">{ico(MEDAL, 17)}</span>'
            f'<span class="exl-qst">Finished here? Take the <b>{esc(q["title"])}</b> ({q["mins"]} min) to check what stuck.</span>'
            f'<a class="exl-qsb" href="{url(q["href"])}">Start quiz &rarr;</a></div>' for q in quiz_by_topic[c['name']])
        cards.append(
            f'<details class="exl-topic" id="topic-{tid}" data-topic="{tid}" style="--tc:{col}"{" open" if ti == 1 else ""}>'
            f'<summary class="exl-th"><span class="exl-tn">{ti}</span><span class="exl-tt">'
            f'<span class="exl-ttl"><b class="exl-pj">{esc(c["name"])}</b><span class="exl-meta">{len(hubs)} hubs &middot; {num(probs)} problems &middot; {num(xp)} XP</span></span>'
            f'<span class="exl-td">{esc(desc)}</span>'
            f'<span class="exl-tp"><span class="exl-bar"><i data-tbar2="{tid}"></i></span><span class="exl-tpv"><b data-tsolved2="{tid}">0</b> / {num(probs)} solved</span></span>'
            f'</span><span class="exl-chev" aria-hidden="true"></span></summary>'
            f'<div class="exl-tb"><div class="exl-thead" aria-hidden="true"><span>#</span><span>Hub</span>'
            f'<span class="exl-dl"><i class="e"></i>Easy <i class="m"></i>Med <i class="h"></i>Hard</span><span>Done</span><span>XP</span></div>'
            f'{rows}{quiz}</div></details>')
    return ('<section class="exl-sec" id="browse" aria-labelledby="exlBrowse">'
            '<h2 id="exlBrowse" class="exl-h2">Browse by topic</h2>'
            f'<p class="exl-sub">{TOPIC_HUBS} hubs in {len(TOPICS)} topics. {QUIZ_TOPICS} of them end with a timed mastery quiz.</p>'
            '<div class="exl-tool" id="exlTool">'
            '<label class="exl-srch"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>'
            f'<input id="exlQ" type="search" placeholder="Search {TOPIC_HUBS} hubs" aria-label="Search hubs" autocomplete="off"><kbd aria-hidden="true">/</kbd></label>'
            f'<div class="exl-chips">{chips}</div></div>'
            '<p class="exl-none" id="exlNone" hidden>No hub matches that search.</p>'
            f'<div class="exl-topics">{"".join(cards)}</div></section>')


def quizzes():
    cards = ''.join(
        f'<a class="exl-qc" href="{url(q["href"])}">{ico(QUIZ_ICONS.get(q["title"], MEDAL), 24, "exl-qci")}'
        f'<span class="exl-qct"><b>{esc(q["title"])}</b><span>{esc(next(t for t, qs in quiz_by_topic.items() if q in qs))} &middot; {q["mins"]} min</span></span>'
        f'<span class="exl-qcc" aria-hidden="true">&rsaquo;</span></a>' for q in QUIZ_ORDER)
    return ('<section class="exl-quizzes" id="mastery-quizzes" aria-labelledby="exlQuiz">'
            '<div class="exl-qh"><h2 id="exlQuiz" class="exl-h2">Mastery quizzes</h2>'
            f'<p>{len(QUIZ_ORDER)} timed quizzes, {QUIZ_MINS} each. Each one also appears at the end of its topic above.</p></div>'
            f'<div class="exl-qg">{cards}</div></section>')


BODY = runs_bar() + hero() + '<div class="exl-wrap">' + featured() + wall() + browse() + quizzes() + '</div>'

# Hub totals + topic for the client (progress math); a few KB.
HUBDATA = {h['slug']: [h['n'], TOPIC_META[hub_topic[h['slug']]][0] if hub_topic[h['slug']] != FEATURED else ''] for h in ALL_HUBS}

CSS = r"""
:root{--exl-ink:#151816;--exl-body:#363D39;--exl-mut:#59605C;--exl-sub:#868C89;--exl-faint:#A6ADA9;
 --exl-line:#E3E6E4;--exl-line2:#ECEEED;--exl-line3:#F0F2F1;--exl-s1:#FAFBFA;--exl-page:#F6F8F7;--exl-s3:#EEF1EF;--exl-card:#fff;
 --exl-brand:#1F6B4A;--exl-brandh:#17553A;--exl-deep:#0F3F2A;--exl-mint:#E3F1E9;--exl-mint2:#CFE5D8;--exl-acc:#4DB384;
 --exl-okbg:#E5F3EA;--exl-ok:#226B47;--exl-err:#A33B2E;--exl-nav:63px;--exl-runsh:0px;--exl-toolh:66px}
html.dark{--exl-ink:#E8ECE9;--exl-body:#C9D1CC;--exl-mut:#AAB4AE;--exl-sub:#8D9791;--exl-faint:#6F7A74;
 --exl-line:#26302B;--exl-line2:#1F2823;--exl-line3:#1B231F;--exl-s1:#0F1512;--exl-page:#0B110E;--exl-s3:#1B2620;--exl-card:#111714;
 --exl-mint:#163322;--exl-mint2:#24503A;--exl-okbg:#163322;--exl-ok:#8FE0B4;--exl-brand:#6FCF9B;--exl-brandh:#8FE0B4}
body{background:var(--exl-page)}
footer.rsft h4{font-family:'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif}
main.exl{display:block;font-family:'Source Sans 3',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:17px;line-height:1.55;color:var(--exl-ink);-webkit-font-smoothing:antialiased}
main.exl *{box-sizing:border-box}
main.exl a{color:inherit;text-decoration:none}
main.exl a:focus-visible,main.exl summary:focus-visible,main.exl input:focus-visible{outline:2px solid var(--exl-brand);outline-offset:2px;border-radius:6px}
main.exl svg{display:block;flex:none}
.exl-pj,main.exl h1,main.exl .exl-h2{font-family:'Plus Jakarta Sans','Inter Tight',Inter,system-ui,sans-serif}
.exl-wrap{max-width:1264px;margin:0 auto;padding:0 32px}
.exl-sec{margin-top:80px;scroll-margin-top:calc(var(--exl-nav) + var(--exl-runsh) + 16px)}
.exl-h2{font-weight:800;font-size:clamp(28px,3.4vw,38px);letter-spacing:-.02em;line-height:1.1;margin:0;color:var(--exl-ink)}
.exl-sub{font-size:17.5px;color:var(--exl-mut);margin:8px 0 26px}
.exl-meta{font-size:14px;color:var(--exl-sub);font-weight:400}
.exl-bar{display:block;height:5px;border-radius:999px;background:var(--exl-s3);overflow:hidden}
.exl-bar i{display:block;height:100%;width:0;border-radius:999px;background:var(--exl-brand);transition:width .5s ease}

/* runs bar (sticky under the navbar) */
.exl-runs{position:sticky;top:var(--exl-nav);z-index:40;background:#0F3F2A;color:#fff;height:46px;white-space:nowrap;overflow:hidden}
.exl-runs[data-v="none"]{display:none}
body.state-pro .exl-runs[data-v="anon"]{display:none}
.exl-runs .exl-in{max-width:1264px;margin:0 auto;padding:0 32px;height:100%;display:flex;align-items:center;gap:20px}
.exl-runs[data-v="anon"] [data-free],.exl-runs[data-v="free"] [data-anon]{display:none!important}
.exl-pill{font-size:12.5px;font-weight:700;border:1px solid rgba(255,255,255,.28);color:#CFE5D8;border-radius:999px;padding:3px 10px;flex:none}
.exl-rt{font-size:15px;color:#CFE5D8;min-width:0;overflow:hidden;text-overflow:ellipsis}
.exl-rt b{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:16px;color:#fff}
.exl-rt b.low{color:#F6B3AA}
.exl-rr{color:#8FB9A2}
.exl-rgap{margin-left:auto}
.exl-rn{font-size:14px;color:#8FB9A2}
.exl-rl{font-size:14.5px;color:#CFE5D8;font-weight:600}
main.exl .exl-rl:hover{color:#fff}
.exl-rb{background:#fff;color:#0F3F2A!important;font-size:14px;font-weight:700;padding:6px 14px;border-radius:9px;flex:none}
.exl-rb:hover{background:#E3F1E9}

/* hero */
.exl-hero{background-color:#121815;background-image:radial-gradient(rgba(77,179,132,.16) 1px,transparent 1.3px);background-size:14px 14px;color:#fff;padding:36px 0 44px}
.exl-hin{max-width:1264px;margin:0 auto;padding:0 32px;display:flex;flex-wrap:wrap;gap:36px;align-items:center}
.exl-hl{flex:1 1 320px;min-width:0}
main.exl h1{font-weight:800;font-size:clamp(38px,5vw,56px);letter-spacing:-.03em;line-height:1.02;margin:0;color:#fff}
.exl-lead{font-size:19px;color:#B8C7BF;max-width:540px;margin:18px 0 26px;line-height:1.5}
.exl-jump{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:460px}
.exl-jt{display:flex;align-items:center;gap:10px;background:#1B2620;border:1px solid #26332C;border-radius:12px;padding:8px 10px 8px 8px;transition:border-color .15s}
.exl-jt:hover{border-color:#4DB384}
.exl-jti{width:28px;height:28px;border-radius:8px;background:#121815;border:1px solid #26332C;color:#8FE0B4;display:grid;place-items:center;flex:none}
.exl-jtl{font-size:14.5px;font-weight:700;line-height:1.25;color:#fff}
.exl-hright{position:relative;flex:1.25 1 420px;max-width:560px;height:440px}
.exl-back{position:absolute;top:-14px;right:-14px;width:62%;height:58%;border-radius:22px;background-color:#1F6B4A;background-image:radial-gradient(rgba(255,255,255,.22) 1px,transparent 1.3px);background-size:12px 12px}
.exl-photo{position:absolute;inset:0;border-radius:22px;overflow:hidden;background:#0F3F2A;box-shadow:0 40px 80px -30px rgba(0,0,0,.7)}
.exl-photo::after{content:'';position:absolute;inset:0;border-radius:22px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.exl-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 48%;filter:grayscale(1) contrast(1.08) brightness(1.06);display:block}
.exl-duo{position:absolute;inset:0;background:#2E8A5E;mix-blend-mode:color;opacity:.9}
.exl-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,63,42,0) 55%,rgba(11,26,18,.55) 100%)}
.exl-chip{position:absolute;top:18px;left:-18px;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#151816;border-radius:999px;padding:7px 14px 7px 8px;font-size:14px;font-weight:600;box-shadow:0 14px 30px -12px rgba(0,0,0,.5)}
.exl-chipi{width:22px;height:22px;border-radius:50%;background:#1F6B4A;color:#fff;display:grid;place-items:center}
.exl-card{position:absolute;bottom:22px;left:-22px;width:min(270px,calc(100% - 20px));background:#fff;color:#151816;border-radius:16px;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr);gap:8px;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}
.exl-cr{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px;font-weight:600;color:#59605C}
.exl-hard{color:#A33B2E}
main.exl .exl-code{font-family:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;font-size:13.5px;line-height:1.6;background:#F6F8F7;border-radius:8px;padding:6px 10px;margin:0;white-space:pre;overflow:hidden;color:#151816}
.exl-out{font-family:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;font-size:14px;font-weight:500;color:#151816;background:none;padding:0}
.exl-ok{font-size:13px;font-weight:700;background:#E5F3EA;color:#226B47;border-radius:999px;padding:3px 10px;white-space:nowrap}

/* featured */
.exl-goals{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}
.exl-goal{background:var(--exl-card);border:1px solid var(--exl-line);border-radius:18px;padding:22px 20px 18px;display:flex;flex-direction:column;scroll-margin-top:calc(var(--exl-nav) + var(--exl-runsh) + 16px)}
.exl-goal.exl-flash{animation:exlflash 1.6s ease}
@keyframes exlflash{0%,40%{box-shadow:0 0 0 3px var(--exl-acc)}100%{box-shadow:0 0 0 0 transparent}}
.exl-gh{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.exl-gh b{display:block;font-size:19px;font-weight:800;letter-spacing:-.01em;line-height:1.2}
.exl-tile{width:44px;height:44px;border-radius:11px;background:var(--exl-mint);border:1px solid var(--exl-mint2);color:#0F3F2A;display:grid;place-items:center;flex:none}
html.dark .exl-tile{color:#CFEEDD}
.exl-gl{border-top:1px solid var(--exl-line2)}
.exl-gr{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--exl-line2);font-size:15.5px;font-weight:600;color:var(--exl-body)}
main.exl .exl-gr:hover{color:var(--exl-brand)}
.exl-cnt{font-size:12px;font-weight:700;border-radius:999px;padding:1px 8px;background:var(--exl-s3);color:var(--exl-mut);flex:none}
.exl-cnt.prog{background:var(--exl-okbg);color:var(--exl-ok)}
.exl-cnt.done{background:var(--exl-brand);color:#fff}
html.dark .exl-cnt.done{color:#0B110E}
.exl-gf{margin-top:auto;padding-top:14px;font-size:15px;font-weight:700;color:var(--exl-brand)!important}

/* wall */
.exl-wallc{background:var(--exl-card);border:1px solid var(--exl-line);border-radius:18px;display:flex;flex-wrap:wrap;overflow:hidden}
.exl-tot{flex:1 1 340px;padding:26px;border-right:1px solid var(--exl-line2);display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.exl-ring{position:relative;width:140px;height:140px;flex:none}
.exl-ring svg{width:140px;height:140px;transform:rotate(-90deg)}
.exl-rt0{fill:none;stroke:var(--exl-s3);stroke-width:10}
.exl-rt1{fill:none;stroke:var(--exl-brand);stroke-width:10;stroke-linecap:round;transition:stroke-dasharray .6s ease}
.exl-rt1[stroke-dasharray^="0 "]{visibility:hidden}
.exl-rc{position:absolute;inset:0;display:grid;place-content:center;text-align:center;line-height:1.1}
.exl-rc b{font-size:30px;font-weight:800}
.exl-rc span{font-size:13px;color:var(--exl-sub);margin-top:2px}
.exl-diffs{flex:1 1 180px;display:grid;gap:14px;min-width:0}
.exl-dr{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center}
.exl-dn{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px}
.exl-dn i,.exl-btn i{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}
.exl-dv{font-size:14px;color:var(--exl-sub)}
.exl-dv b{color:var(--exl-ink)}
.exl-dr .exl-bar{grid-column:1/-1}
.exl-cal{flex:2 1 460px;padding:24px 26px;min-width:0}
.exl-calh{display:flex;justify-content:space-between;align-items:baseline;gap:6px 16px;flex-wrap:wrap;margin-bottom:14px}
.exl-calh b{font-size:18px;font-weight:800}
.exl-calh span{font-size:14px;color:var(--exl-sub)}
.exl-calg{display:grid;grid-template-columns:30px repeat(26,minmax(0,1fr));grid-template-rows:auto repeat(7,auto);gap:3px;min-height:150px}
.exl-calg .exl-mo{grid-row:1;font-size:11.5px;color:var(--exl-sub);white-space:nowrap;line-height:1.4}
.exl-calg .exl-dy{grid-column:1;font-size:11.5px;color:var(--exl-sub);line-height:1;align-self:center}
.exl-calg .c{aspect-ratio:1;border-radius:3px;background:var(--exl-s3)}
.exl-calg .c.f{background:transparent}
.exl-calg .c.l1,.exl-leg .l1{background:#CFE5D8}
.exl-calg .c.l2,.exl-leg .l2{background:#8FCCAA}
.exl-calg .c.l3,.exl-leg .l3{background:#3E9B6E}
.exl-calg .c.l4,.exl-leg .l4{background:#0F3F2A}
html.dark .exl-calg .c.l4,html.dark .exl-leg .l4{background:#8FE0B4}
.exl-calg .c.t{box-shadow:inset 0 0 0 1.5px var(--exl-brand)}
.exl-leg{display:flex;justify-content:flex-end;align-items:center;gap:4px;margin-top:10px;font-size:12px;color:var(--exl-sub)}
.exl-leg i{width:11px;height:11px;border-radius:3px;background:var(--exl-s3);display:inline-block}
.exl-leg span{margin:0 3px}
.exl-bt{flex:1 1 100%;border-top:1px solid var(--exl-line2);padding:20px 26px 22px}
.exl-btt{display:block;font-weight:700;font-size:15px;margin-bottom:12px}
.exl-btg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:12px 32px}
.exl-bti{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center}
.exl-btn{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px}
.exl-btv{font-size:13.5px;color:var(--exl-sub)}
.exl-btv b{color:var(--exl-ink);font-weight:600}
.exl-bti .exl-bar{grid-column:1/-1;height:4px}
main.exl .exl-bti:hover .exl-btn{color:var(--exl-brand)}

/* browse */
.exl-tool{position:sticky;top:calc(var(--exl-nav) + var(--exl-runsh));z-index:30;background:var(--exl-page);padding:12px 0;border-bottom:1px solid var(--exl-line);display:flex;gap:12px 16px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
.exl-srch{position:relative;flex:1 1 260px;max-width:320px;display:flex;align-items:center;height:42px;border:1px solid var(--exl-line);border-radius:12px;background:var(--exl-card);padding:0 10px 0 36px}
.exl-srch svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--exl-sub)}
.exl-srch input{border:0;outline:0;background:transparent;font:inherit;font-size:15.5px;color:var(--exl-ink);width:100%;min-width:0;height:100%}
.exl-srch kbd{font-family:inherit;font-size:12px;border:1px solid var(--exl-line);border-radius:6px;padding:0 6px;color:var(--exl-sub);background:var(--exl-s1)}
.exl-chips{display:flex;flex-wrap:wrap;gap:6px;flex:1 1 400px}
.exl-chipt{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--exl-line);background:var(--exl-card);border-radius:999px;padding:4px 11px;font-size:14px;font-weight:600;white-space:nowrap}
.exl-chipt i{width:9px;height:9px;border-radius:3px}
.exl-chipt span{color:var(--exl-sub);font-weight:400}
main.exl .exl-chipt:hover{border-color:var(--exl-brand)}
.exl-none{color:var(--exl-mut);margin:6px 0 18px}
.exl-topics{display:grid;gap:12px}
.exl-topic{background:var(--exl-card);border:1px solid var(--exl-line);border-radius:18px;overflow:hidden;scroll-margin-top:calc(var(--exl-nav) + var(--exl-runsh) + var(--exl-toolh) + 12px)}
.exl-topic[hidden]{display:none}
.exl-th{list-style:none;cursor:pointer;display:grid;grid-template-columns:48px minmax(0,1fr) 36px;gap:18px;align-items:center;padding:20px 22px}
.exl-th::-webkit-details-marker{display:none}
.exl-tn{width:48px;height:48px;border-radius:12px;background:var(--tc);color:#fff;display:grid;place-items:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:19px}
.exl-tt{display:grid;gap:4px;min-width:0}
.exl-ttl{display:flex;align-items:baseline;gap:6px 12px;flex-wrap:wrap}
.exl-ttl b{font-size:21px;font-weight:800;letter-spacing:-.01em}
.exl-td{font-size:15.5px;color:var(--exl-mut)}
.exl-tp{display:flex;align-items:center;gap:12px;margin-top:4px}
.exl-tp .exl-bar{flex:0 1 320px;height:6px}
.exl-tp .exl-bar i{background:var(--tc)}
.exl-tpv{font-size:13.5px;color:var(--exl-sub);white-space:nowrap}
.exl-tpv b{color:var(--exl-ink);font-weight:600}
.exl-chev{width:36px;height:36px;border:1px solid var(--exl-line);border-radius:10px;position:relative}
.exl-chev::before{content:'';position:absolute;left:50%;top:50%;width:7px;height:7px;border-right:1.8px solid var(--exl-mut);border-bottom:1.8px solid var(--exl-mut);transform:translate(-50%,-70%) rotate(45deg);transition:transform .2s}
.exl-topic[open] .exl-chev::before{transform:translate(-50%,-30%) rotate(-135deg)}
.exl-tb{border-top:1px solid var(--exl-line2)}
.exl-thead,.exl-hr{display:grid;grid-template-columns:52px minmax(0,1fr) 170px 76px 84px;gap:12px;align-items:center;padding:0 22px}
.exl-thead{background:var(--exl-s1);font-size:12.5px;font-weight:700;color:var(--exl-sub);height:38px;border-bottom:1px solid var(--exl-line2)}
.exl-thead span:nth-child(4),.exl-thead span:nth-child(5){text-align:right}
.exl-dl{display:flex;align-items:center;gap:5px;font-weight:600}
.exl-dl i{width:8px;height:8px;border-radius:2px;display:inline-block;margin-left:4px}
.exl-dl i:first-child{margin-left:0}
.exl-db .e,.exl-dl .e{background:#9FD3B6}.exl-db .m,.exl-dl .m{background:#4DB384}.exl-db .h,.exl-dl .h{background:#0F3F2A}
html.dark .exl-db .h,html.dark .exl-dl .h{background:#8FE0B4}
.exl-hr{min-height:48px;border-bottom:1px solid var(--exl-line3);font-size:15.5px;transition:background .12s}
main.exl .exl-hr:hover{background:#F6FAF7}
html.dark main.exl .exl-hr:hover{background:#151E19}
.exl-hr[hidden]{display:none}
.exl-hn{font-size:13px;color:var(--exl-sub);font-weight:600}
.exl-hname{display:flex;align-items:center;gap:8px;min-width:0;font-weight:600;color:var(--exl-ink)}
.exl-hname>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.exl-done{font-size:11.5px;font-weight:700;background:var(--exl-brand);color:#fff;border-radius:999px;padding:1px 8px;flex:none}
html.dark .exl-done{color:#0B110E}
.exl-db{display:flex;gap:2px;height:8px;border-radius:999px;overflow:hidden}
.exl-db i{display:block;height:100%}
.exl-hd{text-align:right;font-size:14.5px;color:var(--exl-sub)}
.exl-hd b{font-weight:600}
.exl-hd.done{color:var(--exl-brand);font-weight:700}
.exl-hd.done b{font-weight:700}
.exl-hx{text-align:right;font-size:14px;color:var(--exl-sub)}
.exl-qs{display:flex;align-items:center;gap:14px;margin:12px 22px;background-color:#121815;background-image:radial-gradient(rgba(77,179,132,.16) 1px,transparent 1.3px);background-size:14px 14px;color:#E1EAE5;border-radius:14px;padding:14px 16px 14px 18px}
.exl-qs+.exl-qs{margin-top:-2px}
.exl-qs:last-child{margin-bottom:22px}
.exl-qsi{width:34px;height:34px;border-radius:9px;background:#1B2620;border:1px solid #26332C;color:#4DB384;display:grid;place-items:center;flex:none}
.exl-qst{flex:1;font-size:15px;min-width:0}
.exl-qst b{color:#fff}
.exl-qsb{background:#fff;color:#0F3F2A!important;font-size:14px;font-weight:700;padding:8px 14px;border-radius:9px;white-space:nowrap;flex:none}
.exl-qsb:hover{background:#E3F1E9}

/* mastery quizzes */
.exl-quizzes{margin-top:80px;background-color:#121815;background-image:radial-gradient(rgba(77,179,132,.16) 1px,transparent 1.3px);background-size:14px 14px;border-radius:24px;padding:40px 36px;color:#fff;scroll-margin-top:calc(var(--exl-nav) + var(--exl-runsh) + 16px)}
.exl-quizzes .exl-h2{color:#fff}
.exl-qh p{color:#B8C7BF;font-size:17px;margin:10px 0 26px;max-width:640px}
.exl-qg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.exl-qc{display:flex;align-items:center;gap:14px;background:#1B2620;border:1px solid #26332C;border-radius:14px;padding:16px 16px 16px 18px;transition:border-color .15s}
.exl-qc:hover{border-color:#4DB384}
.exl-qci{color:#4DB384}
.exl-qct{flex:1;min-width:0;display:grid;line-height:1.3}
.exl-qct b{font-size:15.5px;font-weight:700;color:#fff}
.exl-qct span{font-size:13.5px;color:#8FA79A;margin-top:3px}
.exl-qcc{color:#8FA79A;font-size:20px}

/* responsive */
@media (max-width:900px){.exl-tot{border-right:0;border-bottom:1px solid var(--exl-line2)}}
@media (max-width:850px){
 .exl-hright{flex:1 1 100%;max-width:none;height:360px;margin:0 8px 0 14px}
}
@media (max-width:720px){
 .exl-wrap,.exl-hin,.exl-runs .exl-in{padding-left:16px;padding-right:16px}
 .exl-runs .exl-in{gap:12px}
 .exl-rn{display:none!important}
 .exl-rl{display:none!important}
 .exl-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;flex-basis:100%;padding-bottom:2px}
 .exl-chips::-webkit-scrollbar{display:none}
 .exl-srch{max-width:none}
 .exl-th{grid-template-columns:40px minmax(0,1fr) 30px;gap:12px;padding:16px}
 .exl-tn{width:40px;height:40px;font-size:16px}
 .exl-chev{width:30px;height:30px}
 .exl-quizzes{padding:30px 18px;border-radius:18px}
 .exl-qs{flex-wrap:wrap;margin:12px 16px}
 .exl-tot,.exl-cal,.exl-bt{padding-left:18px;padding-right:18px}
 .exl-sec,.exl-quizzes{margin-top:56px}
}
@media (max-width:640px){
 .exl-thead,.exl-hr{grid-template-columns:40px minmax(0,1fr) 60px 70px;padding:0 16px}
 .exl-db,.exl-dl{display:none!important}
 .exl-hr{font-size:15px}
}
@media (max-width:480px){
 .exl-runs .exl-pill{display:none!important}
 .exl-card{left:-8px}
 .exl-chip{left:-8px}
 .exl-hright{height:300px}
 .exl-rt{font-size:14px}
}
@media (prefers-reduced-motion:reduce){.exl-bar i,.exl-rt1{transition:none}.exl-goal.exl-flash{animation:none}}
"""

JS = r"""
(function(){
  'use strict';
  var HUBS = __HUBDATA__, LIMIT = __LIMIT__;
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, runs = $('#exlRuns'), tool = $('#exlTool');

  /* sticky stack: navbar -> runs bar -> topic toolbar; anchors offset by it */
  function stack(){
    var nav = document.querySelector('.sitenav');
    root.style.setProperty('--exl-nav', (nav ? Math.round(nav.getBoundingClientRect().height) : 0) + 'px');
    var rh = runs && getComputedStyle(runs).display !== 'none' ? runs.offsetHeight : 0;
    root.style.setProperty('--exl-runsh', rh + 'px');
    if (tool) root.style.setProperty('--exl-toolh', tool.offsetHeight + 'px');
  }
  stack(); window.addEventListener('resize', stack);

  /* calendar: 26 weeks to today (UTC days, the same days the server counts) */
  var DAY = 864e5, MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function lvl(n){ return n <= 0 ? '' : n === 1 ? ' l1' : n <= 3 ? ' l2' : n <= 5 ? ' l3' : ' l4'; }
  function calendar(days){
    var g = $('#exlCal'); if (!g) return;
    var counts = {}; (days || []).forEach(function(x){ counts[x.d] = x.n; });
    var now = new Date(), t0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    var dow = (new Date(t0).getUTCDay() + 6) % 7, start = t0 - (dow + 25 * 7) * DAY;
    var html = '', prevM = -1, total = 0, active = 0, run = 0, best = 0;
    ['Mon', '', 'Wed', '', 'Fri', '', ''].forEach(function(l, i){ if (l) html += '<span class="exl-dy" style="grid-row:' + (i + 2) + '">' + l + '</span>'; });
    for (var w = 0; w < 26; w++){
      var mt = new Date(start + w * 7 * DAY).getUTCMonth();
      if (mt !== prevM && w < 25) html += '<span class="exl-mo" style="grid-column:' + (w + 2) + '">' + MONTHS[mt] + '</span>';
      prevM = mt;
      for (var d = 0; d < 7; d++){
        var t = start + (w * 7 + d) * DAY, pos = 'grid-column:' + (w + 2) + ';grid-row:' + (d + 2);
        if (t > t0){ html += '<span class="c f" style="' + pos + '"></span>'; continue; }
        var key = new Date(t).toISOString().slice(0, 10), n = counts[key] || 0, dt = new Date(t);
        total += n; if (n){ active++; run++; if (run > best) best = run; } else run = 0;
        html += '<span class="c' + lvl(n) + (t === t0 ? ' t' : '') + '" style="' + pos + '" title="' + dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()] + ': ' + n + ' solved"></span>';
      }
    }
    g.innerHTML = html;
    $('#exlCalT').textContent = total.toLocaleString('en-US') + (total === 1 ? ' solve' : ' solves') + ' in the last 6 months';
    $('#exlCalM').textContent = active + (active === 1 ? ' active day' : ' active days') + ' · longest streak ' + best + (best === 1 ? ' day' : ' days');
  }
  calendar([]);

  /* progress: /api/me/practice for signed-in learners */
  function pct(a, b){ return b ? Math.min(100, 100 * a / b) : 0; }
  function hydrate(P){
    var H = P.hubs || {}, topics = {};
    $$('[data-hub]').forEach(function(el){
      var s = el.getAttribute('data-hub'), n = +el.getAttribute('data-n'), d = Math.min(n, H[s] || 0);
      if (el.classList.contains('exl-gr')){
        var c = $('.exl-cnt', el);
        if (d >= n){ c.textContent = 'Done'; c.className = 'exl-cnt done'; }
        else if (d > 0){ c.textContent = d + '/' + n; c.className = 'exl-cnt prog'; }
      } else if (el.classList.contains('exl-hr')){
        var hd = $('.exl-hd', el); hd.innerHTML = '<b>' + d + '</b>/' + n; hd.classList.toggle('done', d >= n && n > 0);
        var nm = $('.exl-hname', el), pill = $('.exl-done', nm);
        if (d >= n && n > 0 && !pill) nm.insertAdjacentHTML('beforeend', '<span class="exl-done">Done</span>');
      }
    });
    Object.keys(HUBS).forEach(function(s){ var t = HUBS[s][1]; if (!t) return; topics[t] = topics[t] || [0, 0]; topics[t][0] += Math.min(HUBS[s][0], H[s] || 0); topics[t][1] += HUBS[s][0]; });
    Object.keys(topics).forEach(function(t){
      var v = topics[t], p = pct(v[0], v[1]) + '%';
      $$('[data-tsolved="' + t + '"],[data-tsolved2="' + t + '"]').forEach(function(b){ b.textContent = v[0].toLocaleString('en-US'); });
      $$('[data-tbar="' + t + '"],[data-tbar2="' + t + '"]').forEach(function(b){ b.style.width = p; });
    });
    var tot = P.solved || 0, all = __TOTAL__;
    $('#exlTot').textContent = tot.toLocaleString('en-US');
    $('#exlRing').setAttribute('stroke-dasharray', (3.7699 * pct(tot, all)).toFixed(1) + ' 377');
    var DT = __DIFFTOT__;
    ['beginner', 'intermediate', 'advanced'].forEach(function(k){
      var v = (P.diff && P.diff[k]) || 0;
      $('[data-diff="' + k + '"]').textContent = v.toLocaleString('en-US');
      $('[data-diffbar="' + k + '"]').style.width = pct(v, DT[k]) + '%';
    });
    $('#exlWallSub').textContent = 'Everything you have solved, by difficulty, by day and by topic.';
    calendar(P.days);
    var L = P.last, jt = $('[data-jt="start"]');
    if (L && L.slug && jt){ jt.setAttribute('href', '/' + L.slug + '.html'); $('.exl-jtl', jt).textContent = 'Continue'; jt.querySelector('.exl-jti').innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'; }
    $$('[data-goal-first]').forEach(function(a){
      var card = a.closest('.exl-goal'), next = $$('.exl-gr', card).filter(function(r){ return Math.min(+r.getAttribute('data-n'), H[r.getAttribute('data-hub')] || 0) < +r.getAttribute('data-n'); })[0];
      if (next) a.setAttribute('href', next.getAttribute('href'));
    });
  }

  /* free plan allowance: /api/me/meter (display only; the attempt endpoint enforces) */
  function fmtReset(iso){ var d = new Date(iso + 'T00:00:00Z'); return isNaN(d) ? '' : d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }
  function meter(M){
    if (!M || !M.metered){ runs.setAttribute('data-v', 'none'); stack(); return; }
    var b = $('#exlLeft'); b.textContent = M.left + ' of ' + M.limit; b.classList.toggle('low', M.left <= 5);
    $('#exlReset').textContent = M.resets ? '· resets ' + fmtReset(M.resets) : '';
    runs.setAttribute('data-v', 'free'); stack();
  }

  var token = '', me = null, lastLoad = 0;
  function get(path){ return fetch(path, { headers: { Authorization: 'Bearer ' + token } }).then(function(r){ return r.ok ? r.json() : null; }); }
  function load(){
    lastLoad = Date.now();
    get('/api/me/practice').then(function(P){ if (P) hydrate(P); }).catch(function(){});
    if (me && me.pro){ runs.setAttribute('data-v', 'none'); stack(); }
    else get('/api/me/meter').then(meter).catch(function(){});
  }
  document.addEventListener('auth-hydrated', function(e){
    var d = e && e.detail; me = d && d.me; token = (d && d.token) || '';
    if (me && me.user && token) load();
    else { runs.setAttribute('data-v', 'anon'); stack(); }
  });
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible' && token && me && me.user && Date.now() - lastLoad > 30000) load();
  });

  /* search: filter hub rows by name, hide topics with no match */
  var q = $('#exlQ'), saved = null;
  if (q){
    q.addEventListener('input', function(){
      var v = q.value.trim().toLowerCase(), any = false;
      if (v && !saved) saved = $$('.exl-topic').map(function(t){ return t.open; });
      $$('.exl-topic').forEach(function(t, i){
        var hit = 0;
        $$('.exl-hr', t).forEach(function(r){ var ok = !v || r.getAttribute('data-q').indexOf(v) >= 0; r.hidden = !ok; if (ok) hit++; });
        $$('.exl-qs', t).forEach(function(x){ x.hidden = !!v; });
        t.hidden = !!v && !hit;
        if (v && hit) t.open = true;
        if (!v && saved) t.open = saved[i];
        if (hit) any = true;
      });
      if (!v) saved = null;
      $('#exlNone').hidden = !v || any;
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement, tag = a && a.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (a && a.isContentEditable)) return;
      e.preventDefault(); q.focus();
    });
  }

  /* topic links: open the topic, then scroll to it (scroll-margin covers the sticky stack) */
  function goTopic(id, focus){
    var t = document.getElementById('topic-' + id); if (!t) return;
    if (t.hidden && q){ q.value = ''; q.dispatchEvent(new Event('input')); }
    t.open = true; stack();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focus) t.querySelector('summary').focus({ preventScroll: true });
  }
  $$('[data-topic-link]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); goTopic(a.getAttribute('data-topic-link'), true); history.replaceState(null, '', '#topic-' + a.getAttribute('data-topic-link')); });
  });

  /* arriving from the navbar menu: #goal-*, ?goal=*, #topic-* */
  function arrive(){
    var m = /^#topic-([a-z]+)$/.exec(location.hash);
    if (m){ goTopic(m[1], false); return; }
    var g = (/[?&]goal=([a-z-]+)/.exec(location.search) || [])[1] || (/^#goal-([a-z-]+)$/.exec(location.hash) || [])[1];
    var card = g && document.getElementById('goal-' + g);
    if (card){ stack(); card.scrollIntoView({ block: 'start' }); card.classList.add('exl-flash'); setTimeout(function(){ card.classList.remove('exl-flash'); }, 1700); }
  }
  if (document.readyState === 'complete') setTimeout(arrive, 50); else window.addEventListener('load', function(){ setTimeout(arrive, 50); });
  window.addEventListener('hashchange', arrive);
})();
"""

js = (JS.replace('__HUBDATA__', json.dumps(HUBDATA, separators=(',', ':')))
        .replace('__LIMIT__', str(METER_LIMIT))
        .replace('__TOTAL__', str(TOT['exercises']))
        .replace('__DIFFTOT__', json.dumps(DIFF_TOT, separators=(',', ':'))))

page = shell.replace('<!--EXBODY-->', '<main class="exl" id="main">\n<style>' + CSS + '</style>\n' + BODY + '\n<script>' + js + '</script>\n')

# The three meta descriptions carry the exercise and hub counts. Rewritten from the
# catalogue on every build, and loud if the sentence ever moves.
_count_pat = re.compile(r'[\d,]+ auto-graded R exercises across \d+ hubs')
_count_txt = '{:,} auto-graded R exercises across {} hubs'.format(TOT['exercises'], TOT['hubs'])
page, _n = _count_pat.subn(_count_txt, page)
assert _n == 3, 'expected 3 meta count sentences in the shell, patched %d' % _n

assert chr(8212) not in CSS + BODY + js, 'em dash found'
assert 'WebR' not in BODY and 'webr' not in BODY.lower(), 'WebR in public copy'
assert page.count('<main class="exl" id="main">') == 1
io.open('exercises/index.html', 'w', encoding='utf-8', newline='\n').write(page)

# ---------------- navbar Practice menu data (/practice-menu.json) ----------------
menu = {
    'v': 1,
    'goals': [{'id': gid, 'name': gname, 'icon': gicon, 'all': gall, 'href': '/exercises/#goal-' + gid,
               'sets': [{'t': clean_title(feat_by_slug[s]['title']), 'h': url(feat_by_slug[s]['href']), 's': s, 'n': feat_by_slug[s]['n']} for s in slugs[:4]]}
              for gid, gname, gicon, gall, slugs in GOALS],
    'topics': [{'id': TOPIC_META[c['name']][0], 'name': c['name'], 'icon': TOPIC_META[c['name']][3], 'n': len(c['hubs']),
                'href': '/exercises/#topic-' + TOPIC_META[c['name']][0]} for c in TOPICS],
    'quizzes': {'n': len(QUIZ_ORDER), 'topics': QUIZ_TOPICS, 'href': '/exercises/#mastery-quizzes', 'icon': MEDAL},
    'start': {'goal': GOALS[0][1], 't': clean_title(feat_by_slug[GOALS[0][4][0]]['title']), 'h': url(feat_by_slug[GOALS[0][4][0]]['href'])},
    # every hub: [title, problems, goal or topic name] so "Continue" can name any hub
    'hubs': {h['slug']: [clean_title(h['title']), h['n'],
                         next((g[1] for g in GOALS if h['slug'] in g[4]), hub_topic[h['slug']])] for h in ALL_HUBS},
}
_mj = json.dumps(menu, separators=(',', ':'), ensure_ascii=False)
assert chr(8212) not in _mj
io.open('practice-menu.json', 'w', encoding='utf-8', newline='\n').write(_mj)
print('exercises/index.html written:', len(page) // 1024, 'KB | practice-menu.json', len(_mj.encode()) // 1024, 'KB')

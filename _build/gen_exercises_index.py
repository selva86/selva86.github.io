# -*- coding: utf-8 -*-
"""Generate exercises/index.html (the live exercises catalog page).

Design: the approved A3 workbook. One page: hero with a self-solving demo of the
real exercise UI, bench (Continue / Suggested next / Today), The Exercises Wall
(every problem as a difficulty-tinted square), sticky topic chips with scroll-spy
and search, then the full syllabus (every hub row server-rendered and crawlable,
expandable to real section titles + per-problem index chips that deep-link).

State is honest: the server renders the signed-out, fresh-visitor view. All
progress UI hydrates client-side from the same localStorage the hub engine
(exercise-hub.js) writes: rsc-exercise-hub-v1:<path> {solved:{id:true}},
rsc-streak-v1 {days}, rsc-daily-v1 {date,count}. Signed-in users additionally
get total XP + streak from /api/me/stats. No invented numbers anywhere.

Data: www/exercise-catalog.json (Scripts/build_exercise_catalog.py). Rebuild
that first when hubs change, then rerun this.

Run: python _build/gen_exercises_index.py    (from the repo root)
"""
import json, io, os, re, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

DATA = json.load(open('www/exercise-catalog.json', encoding='utf-8'))
CATS = DATA['categories']; QUIZZES = DATA['quizzes']; TOT = DATA['totals']
CAT_HASH = hashlib.md5(io.open('www/exercise-catalog.json', encoding='utf-8').read().encode()).hexdigest()[:8]

SHELL = '_build/exercises-shell.html'
if not os.path.exists(SHELL):
    live = io.open('exercises/index.html', encoding='utf-8').read()
    pre = live[:live.index('<main class="wrap">')]
    suf = live[live.index('</main>'):]
    suf = suf.replace('  <script defer src="/www/exercises-page.js?v=3"></script>\n', '')
    suf = re.sub(r'[ ]*<script defer src="/www/signin-nudge\.js[^>]*></script>\n?', '', suf)
    if '/www/webr.min.css' not in pre:
        pre = pre.replace('<link rel="stylesheet" href="/www/site-nav.css?v=5">',
                          '<link rel="stylesheet" href="/www/site-nav.css?v=5">\n<link rel="stylesheet" href="/www/webr.min.css">', 1)
    io.open(SHELL, 'w', encoding='utf-8', newline='\n').write(pre + '<!--EXBODY-->' + suf)
    print('bootstrapped', SHELL, 'from the previous live page')
shell = io.open(SHELL, encoding='utf-8').read()

ACC = {'R Fundamentals':'#2056d2','Data Wrangling':'#0f8a5f','Visualization':'#b3591c',
 'Statistics':'#7c3aed','Time Series':'#0e7490','Machine Learning':'#be185d',
 'Advanced R':'#4d7c0f','Reporting':'#92590e','Specializations':'#475569','Other':'#475569'}
INTRO = {
 'R Fundamentals':'Vectors, data frames, functions, and the base R muscle memory everything else builds on.',
 'Data Wrangling':'Import, clean, reshape, and join real datasets with dplyr, tidyr, and friends.',
 'Visualization':'Charts that read clearly, from a first ggplot2 bar chart to themed, faceted figures.',
 'Statistics':'Probability, tests, confidence intervals, and regression, practiced until the output makes sense.',
 'Time Series':'Dates, decomposition, and ARIMA forecasting drills.',
 'Machine Learning':'Train, validate, and tune models: trees, forests, boosting, clustering.',
 'Advanced R':'Performance, packages, testing, and Shiny apps.',
 'Reporting':'R Markdown documents and publication tables.',
 'Specializations':'Domain practice: finance, genomics, healthcare, marketing, spatial, text.',
 'Other':'More practice sets.'}
QUIZMAP = {
 'R Fundamentals': ['R-Beginner-Exercises-quiz', 'R-Functional-Programming-Exercises-quiz', 'R-Interview-Questions-quiz'],
 'Data Wrangling': ['dplyr-Exercises-in-R-quiz', 'tidyr-Exercises-in-R-quiz'],
 'Visualization': ['ggplot2-Exercises-in-R-quiz'],
 'Statistics': ['Hypothesis-Testing-Exercises-in-R-quiz', 'Linear-Regression-Exercises-in-R-quiz'],
 'Time Series': ['Time-Series-Exercises-in-R-quiz'],
 'Machine Learning': ['Machine-Learning-Exercises-in-R-quiz'],
 'Advanced R': ['Shiny-Exercises-in-R-quiz'],
}

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('"','&quot;')
def tmins(m): return f'~{m} min' if m < 60 else (f'~{m/60:.1f} h'.replace('.0 h',' h'))
def out(s): return f'<p class="a2-out"><span class="pr">#&gt;</span>{s}</p>'
def aid(name): return re.sub(r'[^a-z]+','-', name.lower()).strip('-')
def dmix(h):
    parts = []
    for cls, n, name in (('g', h['b'], 'beginner'), ('o', h['i'], 'intermediate'), ('r', h['a'], 'advanced')):
        if n:
            parts.append(f'<span class="{cls}" title="{n} {name}"><i></i>{n}</span>')
    return '<span class="dmix">' + ''.join(parts) + '</span>'

CSS = r"""
:root{--chunk:#f8fafd;--sq:8px}
html.dark{--chunk:#131b30}
.a2-out{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--faint);font-feature-settings:"tnum";margin:0}
.a2-out .pr{color:var(--green);opacity:.75;margin-right:6px;user-select:none}
.pen{display:inline-flex;flex:none;color:var(--green)}
.pen svg{width:15px;height:13px;overflow:visible}
.pen path{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.dmix{display:inline-flex;gap:9px;align-items:baseline;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mut);font-feature-settings:"tnum";justify-self:end}
.dmix i{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:3px}
.dmix .g i{background:var(--green)}.dmix .o i{background:#e08a00}.dmix .r i{background:#c04343}

.a2-hero{padding:44px 0 0;display:grid;grid-template-columns:1.2fr .95fr;gap:40px;align-items:center}
.a2-hero h1{font-family:'Inter Tight','Inter',sans-serif;font-size:40px;font-weight:700;letter-spacing:-.028em;margin:0}
.a2-hero .dek{font-size:17px;color:var(--mut);margin:15px 0 0;max-width:32em;line-height:1.55}
.a2-hero .a2-out{margin-top:16px;font-size:13px}

.a3-demo{background:transparent;border:0;border-radius:0;padding:0}
.a3-demo .webr-container{filter:drop-shadow(0 26px 40px rgba(13,20,38,.28))}
.a3-demo .webr-code-block{border:1px solid #1e2a44;overflow:hidden}
.a3-demo-head{display:flex;align-items:center;gap:10px;margin:0 0 8px}
.a3-demo-k{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.a3-demo-task{font-size:13.5px;color:var(--mut);line-height:1.5;margin:0 0 10px}
.a3-demo-task strong{color:var(--ink)}
.a3-demo .webr-code-block{border-radius:0}
.a3-demo .webr-editor{min-height:52px;font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.6;color:#e2e8f0;background:#0f172a;padding:10px 13px;white-space:pre-wrap}
.a3-demo .webr-output{margin:0;border-top:.8px solid rgba(51,65,85,.5);background:#0f172a;color:#86efac;font-family:'IBM Plex Mono',monospace;font-size:12.5px;padding:8px 13px;white-space:pre-wrap}
.a3-demo .webr-run-btn.pressed{transform:translateY(1px);filter:brightness(1.25)}
.a3-demo-fb{margin-top:9px;font-size:13px;font-weight:600;color:var(--faint);min-height:19px;transition:color .4s}
.a3-demo-fb.ok{color:var(--green)}
.dc-caret{display:inline-block;width:8px;height:14px;background:#94a3b8;vertical-align:-2px;animation:dcblink 1.05s steps(1) infinite}
@keyframes dcblink{50%{opacity:0}}
.dc-dots{display:inline-flex;gap:4px;align-items:center;margin-left:auto}
.dc-dots i{width:5px;height:5px;border-radius:50%;background:var(--line);transition:background .3s}
.dc-dots i.on{background:var(--accent)}
@media(prefers-reduced-motion:reduce){.dc-caret{display:none}}

.a2-bench{display:grid;grid-template-columns:1.35fr 1fr .82fr;gap:15px;margin:26px 0 0;align-items:stretch}
.a2-card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:0;padding:15px 17px;display:flex;flex-direction:column;gap:8px}
.a2-card[hidden]{display:none}
.a2-card .k{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.a2-card .t{font-family:'Inter Tight','Inter',sans-serif;font-size:17px;font-weight:600;line-height:1.3}
.a2-card .s{font-size:12.5px;color:var(--mut)}
.a2-card .row{display:flex;align-items:center;gap:10px;margin-top:auto}
.a2-mini{display:flex;gap:3px;flex-wrap:wrap}
.a2-mini i{width:12px;height:12px;border-radius:2px;border:1px solid var(--border);display:inline-block}
.a2-mini i.s{background:var(--green);border-color:var(--green)}
.a2-goal{display:flex;align-items:center;gap:13px}
.a2-goal .nums{font-size:12px;color:var(--mut);line-height:1.7}
.a2-goal .nums b{font-family:'Inter Tight','Inter',sans-serif;font-size:15px;color:var(--ink)}

.a2-wallwrap{margin:36px 0 0;background:var(--card);border:1px solid var(--line);border-radius:0;padding:20px 24px 22px;text-align:center}
.a2-wallwrap h2{font-family:'Inter Tight','Inter',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-.02em}
.a2-wallwrap .a2-out{margin:6px 0 0}
.a2-legend{display:flex;gap:15px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--faint);margin:12px 0 16px;flex-wrap:wrap;justify-content:center}
.a2-legend i{width:10px;height:10px;border-radius:2.5px;display:inline-block;margin-right:5px;vertical-align:-1px}
.a2-wall-clip{max-height:270px;overflow:hidden;position:relative;min-height:120px;text-align:left}
.a2-wallwrap.open .a2-wall-clip{max-height:none}
.a2-wall-clip::after{content:'';position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(to bottom,transparent,var(--card));pointer-events:none}
.a2-wallwrap.open .a2-wall-clip::after{display:none}
.a2-wall-more{margin:10px 0 0;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--card);font:inherit;font-size:12.5px;font-weight:600;color:var(--mut);border-radius:0;padding:6px 14px;cursor:pointer}
.a2-wall-more:hover{border-color:var(--accent);color:var(--accent)}
.a2-wband{margin:0 0 10px}
.a2-wband .wh{display:flex;align-items:baseline;gap:10px;margin:0 0 5px}
.a2-wband .wh a{font-family:'Inter Tight','Inter',sans-serif;font-size:14px;font-weight:600}
.a2-wband .wh a:hover{color:var(--accent)}
.a2-wband .wh .a2-out{font-size:10.5px}
.a2-sqs{display:flex;flex-wrap:wrap;gap:2px}
.a2-sqs a{width:var(--sq);height:var(--sq);border-radius:2.5px;display:block}
.a2-sqs a.b{background:color-mix(in srgb,var(--green) 30%,var(--card))}
.a2-sqs a.i{background:color-mix(in srgb,#c99117 45%,var(--card))}
.a2-sqs a.a{background:color-mix(in srgb,var(--red) 38%,var(--card))}
.a2-sqs a.s{background:var(--green)}
.a2-sqs a:hover{outline:2px solid var(--accent);outline-offset:1px}

.a2-catnav{position:sticky;top:62px;z-index:40;background:var(--mast);backdrop-filter:blur(8px);margin:30px -24px 0;padding:9px 24px;border-bottom:1px solid var(--line);display:flex;gap:7px;align-items:center;overflow-x:auto;scrollbar-width:none}
.a2-catnav::-webkit-scrollbar{display:none}
.a2-catnav a.chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:99px;font-size:12.5px;font-weight:600;color:var(--mut);border:1px solid transparent;white-space:nowrap}
.a2-catnav a.chip .d{width:8px;height:8px;border-radius:50%;flex:none}
.a2-catnav a.chip .c{font-family:'IBM Plex Mono',monospace;font-weight:400;font-size:11px;color:var(--faint)}
.a2-catnav a.chip:hover{background:var(--navy-soft)}
.a2-catnav a.chip.on{border-color:var(--border);background:var(--card);color:var(--ink)}
.a2-qwrap{margin-left:auto;display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);border-radius:99px;padding:5px 12px;flex:none}
.a2-qwrap svg{color:var(--faint);flex:none}
.a2-qwrap input{border:0;outline:0;background:none;font:inherit;font-size:13px;color:var(--ink);width:190px}
.a2-qwrap kbd{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--faint);border:1px solid var(--line);border-radius:4px;padding:0 5px}
.a2-qcount{display:none;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--faint);margin:14px 0 0}
body.searching .a2-qcount{display:block}

.a2-sec{margin:40px 0 0;background:var(--card);border:1px solid var(--line);border-radius:0;padding:0 24px 18px;overflow:hidden;scroll-margin-top:120px}
.a2-sech{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;--acc:transparent;margin:0 -24px 0;padding:18px 24px 13px;background:color-mix(in srgb,var(--acc) 6%,var(--card));border-bottom:1px solid var(--line)}
.a2-sech .d{width:10px;height:10px;border-radius:50%;flex:none;align-self:center}
.a2-sech h2{font-family:'Inter Tight','Inter',sans-serif;font-size:22px;font-weight:700;margin:0;letter-spacing:-.02em}
.a2-sech .a2-out{margin-left:2px}
.a2-sech .bar{flex-basis:100%;height:3px;border-radius:99px;background:var(--line);margin-top:9px;overflow:hidden}
.a2-sech .bar i{display:block;height:100%;border-radius:99px;width:0%}
.a2-intro{color:var(--mut);font-size:14px;margin:13px 0 8px;max-width:56em}
.a2-rows{position:relative;padding-left:34px}
.a2-hub{border-bottom:1px solid var(--line)}
.a2-hub:last-child{border-bottom:0}
.a2-hubrow{display:grid;grid-template-columns:16px minmax(0,1fr) 100px 64px 80px 30px;gap:10px;align-items:center;padding:10px 2px;position:relative}
.a2-hubrow .mnum{position:absolute;left:-34px;width:22px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--faint);font-feature-settings:"tnum";user-select:none}
.a2-tog{width:28px;height:28px;border:1px solid var(--border);background:var(--card);border-radius:0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:var(--mut);padding:0}
.a2-tog:hover{border-color:var(--accent);color:var(--accent)}
.a2-tog svg{width:13px;height:13px;transition:transform .16s var(--ease)}
.a2-hub.open .a2-tog svg{transform:rotate(180deg)}
.a2-hubrow .st{width:14px;height:14px;border:1.4px solid var(--border);border-radius:50%}
.a2-hubrow .st.part{border-color:var(--accent);background:conic-gradient(var(--accent) var(--pct),transparent 0)}
.a2-hubrow .t{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.a2-hubrow .t a:hover{color:var(--accent);text-decoration:underline}
.a2-hubrow .num{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--faint);text-align:right;font-feature-settings:"tnum";white-space:nowrap}
.a2-hub.done .a2-hubrow .t{color:var(--faint);font-weight:500}
.a2-hub.done .a2-hubrow .mnum{text-decoration:line-through;opacity:.6}
.a2-hd{display:grid;grid-template-columns:16px minmax(0,1fr) 100px 64px 80px 30px;gap:10px;padding:4px 2px 6px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.a2-hd span:nth-child(n+3){text-align:right}

.a2-body{display:none;margin:0 2px 13px;background:var(--chunk);border:1px solid var(--line);border-radius:0;padding:13px 15px}
.a2-hub.open .a2-body{display:block}
.a2-blurb{font-size:13px;color:var(--mut);line-height:1.55;max-width:56em;margin:0 0 10px}
.a2-cs{margin:0 0 10px}
.a2-cs .sh{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--faint);margin:0 0 6px}
.a2-cs .sh .h{color:var(--ink);font-weight:600}
.a2-chips{display:flex;flex-wrap:wrap;gap:2px 6px}
.a2-chips a{font-family:'IBM Plex Mono',monospace;font-size:12px;padding:3px 2px;border-radius:4px;font-feature-settings:"tnum";opacity:0;animation:a2in .18s var(--ease) forwards}
@keyframes a2in{to{opacity:1}}
@media(prefers-reduced-motion:reduce){.a2-chips a{animation:none;opacity:1}}
.a2-chips a .br{color:var(--faint);opacity:.55}
.a2-chips a.b{color:var(--green)}.a2-chips a.i{color:var(--amber)}.a2-chips a.a{color:var(--red)}
.a2-chips a.solved{background:var(--green);color:#fff;padding:3px 6px}
.a2-chips a.solved .br{color:#fff;opacity:.7}
.a2-chips a:hover{text-decoration:underline}
.a2-act{display:flex;gap:11px;align-items:center;margin-top:11px}
.a2-act .open-hub{font-size:12.5px;font-weight:600;color:var(--accent)}
.a2-act .a2-out{margin-left:auto}

.a2-pmatch{margin:0 0 10px 30px;padding:0;list-style:none}
.a2-pmatch li{margin:0 0 5px}
.a2-pmatch a{display:flex;gap:8px;align-items:baseline;font-size:13px;color:var(--mut)}
.a2-pmatch a:hover{color:var(--accent)}
.a2-pmatch .pn{font-family:'IBM Plex Mono',monospace;font-size:10.5px;flex:none;min-width:28px;text-align:right}
.a2-pmatch mark{background:var(--accent-soft);color:var(--ink);border-radius:2px;padding:0}
.a2-pmatch .pn.b{color:var(--green)}.a2-pmatch .pn.i{color:var(--amber)}.a2-pmatch .pn.a{color:var(--red)}

.a2-quiz{display:flex;align-items:center;gap:12px;border:1px dashed var(--border);border-radius:0;padding:11px 14px;margin:14px 0 0}
.a2-quiz svg{color:var(--amber);flex:none}
.a2-quiz .qt{font-size:13.5px}.a2-quiz .qt b{font-family:'Inter Tight','Inter',sans-serif}
.a2-quiz .go{margin-left:auto;flex:none}
body.searching .a2-hub.qhide,body.searching .a2-sec.qhide,body.searching .a2-quiz,body.searching .a2-wallwrap,body.searching .a2-bench,body.searching .a2-hero .a3-demo{display:none}
.a2-note{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--faint);margin:14px 0 0}

@media(max-width:900px){.a2-hero{grid-template-columns:1fr;gap:26px}.a2-bench{grid-template-columns:1fr}}
@media(max-width:860px){
.a2-hd{display:none}
.a2-hubrow{grid-template-columns:16px minmax(0,1fr) 74px 30px;row-gap:3px}
.a2-hubrow .dmix,.a2-hubrow .num:not(.probs){display:none}
.a2-hubrow .num.probs::after{content:' problems'}
.a2-rows{padding-left:0}.a2-hubrow .mnum{display:none}
.a2-qwrap input{width:120px}
.a2-sec{padding:0 14px 16px}.a2-sech{margin:0 -14px 0;padding:16px 14px 12px}
}
"""

PEN = '<span class="pen"><svg viewBox="0 0 15 13"><path d="M2 7.4 L5.6 11 L13 2.6"/></svg></span>'

def demo_block():
    return """
<div class="a3-demo" id="demoCard" aria-label="Live demo: a real exercise solving itself">
  <div class="a3-demo-head">
    <span class="a3-demo-k">Solve Them Live</span>
    <span class="dc-dots" aria-hidden="true"><i class="on"></i><i></i><i></i></span>
  </div>
  <p class="a3-demo-task"><strong>Task:</strong> <span id="dcQ">Keep only the values greater than 10, then return their mean.</span></p>
  <div class="webr-container">
    <div class="webr-code-block">
      <div class="webr-header">
        <div class="webr-header-left"><span class="webr-header-badge">R</span><span class="webr-header-label">Your turn</span></div>
        <div class="webr-header-right"><button class="btn btn-sm btn-primary webr-run-btn" id="dcRun" type="button">&#9654; Run</button></div>
      </div>
      <div class="webr-editor" data-language="r"><span class="cl" id="dcSetup">x &lt;- c(4, 19, 7, 42, 23)</span>
<span class="cl"><span id="dcTyped"></span><span class="dc-caret" id="dcCaret"></span></span></div>
      <pre class="webr-output" id="dcOut" hidden></pre>
    </div>
  </div>
  <div class="a3-demo-fb" id="dcVerdict" role="status" aria-live="off">&nbsp;</div>
</div>"""

def bench():
    # suggested first hub: the most beginner-leaning set in the catalog
    sug = None
    best = -1.0
    for c in CATS:
        for h in c['hubs']:
            if h['n'] and (h['b'] / h['n']) > best:
                best = h['b'] / h['n']
                sug = (c, h)
    sc, sh = sug
    return f"""
<section class="a2-bench reveal" aria-label="Your desk">
  <div class="a2-card" id="benchCont" hidden>
    <span class="k">Continue where you left off</span>
    <span class="t" id="bcT"></span>
    <span class="s" id="bcS"></span>
    <div class="a2-mini" id="bcMini" aria-hidden="true"></div>
    <div class="row"><a class="btn btn-primary btn-sm" id="bcGo" href="#">Resume <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a>
    <span class="a2-out" id="bcXp"></span></div>
  </div>
  <div class="a2-card" id="benchStart">
    <span class="k">New here</span>
    <span class="t">Start with {esc(sh['title'])}</span>
    <span class="s">{sh['b']} of {sh['n']} problems are beginner level. A gentle first set in {sc['name']}. Free, no account needed.</span>
    <div class="row"><a class="btn btn-primary btn-sm" href="/{sh['href']}">Start solving <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a></div>
  </div>
  <div class="a2-card" id="benchSug">
    <span class="k">Suggested next</span>
    <span class="t" id="sgT">{esc(sh['title'])}</span>
    <span class="s" id="sgS">Mostly beginner problems, a gentle set in {sc['name']}.</span>
    <div class="row"><a class="btn btn-ghost btn-sm" id="sgGo" href="#{aid(sc['name'])}">See it in the syllabus</a></div>
  </div>
  <div class="a2-card" id="benchToday" hidden>
    <span class="k">Today</span>
    <div class="a2-goal">
      <div class="nums" id="tdNums"></div>
    </div>
  </div>
</section>"""

def sections_html():
    secs = []
    for ci, c in enumerate(CATS):
        a = aid(c['name'])
        n = sum(h['n'] for h in c['hubs']); xp = sum(h['xp'] for h in c['hubs'])
        rows = []
        for hi, h in enumerate(c['hubs']):
            rows.append(f"""<div class="a2-hub" data-slug="{h['slug']}" data-href="{h['href']}" data-n="{h['n']}" data-title="{esc(h['title'].lower())}">
<div class="a2-hubrow">
  <span class="mnum">{ci+1}.{hi+1}</span>
  <span class="st"></span>
  <span class="t"><a href="/{h['href']}">{esc(h['title'])}</a></span>
  {dmix(h)}
  <span class="num probs" data-done>{h['n']}</span>
  <span class="num">{h['xp']:,} XP</span>
  <button class="a2-tog" type="button" aria-expanded="false" aria-label="Show the problems in {esc(h['title'])}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
</div>
<div class="a2-body" data-hydrate="0"></div>
<ul class="a2-pmatch" hidden></ul>
</div>""")
        quiz_slips = ''
        for qs in QUIZMAP.get(c['name'], []):
            q = next((x for x in QUIZZES if x['slug'] == qs), None)
            if q:
                mins = f" ({q['mins']} min)" if q.get('mins') else ''
                quiz_slips += (f'<div class="a2-quiz"><svg class="ic"><use href="#i-award"/></svg>'
                    f'<span class="qt">Finished here? Take the <b>{esc(q["title"])}</b>{mins} and bank credit toward the certificate.</span>'
                    f'<a class="btn btn-ghost btn-sm go" href="/{q["href"]}">Start quiz</a></div>')
        secs.append(f"""
<section class="a2-sec reveal" id="{a}" data-spysec="{a}" data-cat="{ci}">
  <div class="a2-sech" style="--acc:{ACC.get(c['name'], '#475569')}">
    <span class="d" style="background:{ACC.get(c['name'], '#475569')}"></span>
    <h2>{c['name']}</h2>
    <p class="a2-out"><span class="pr">#&gt;</span>{len(c['hubs'])} hubs &middot; {n} problems &middot; <span data-catsolved>0</span>/{n} solved &middot; {xp:,} XP</p>
    <span class="bar"><i data-catbar style="background:{ACC.get(c['name'], '#475569')}"></i></span>
  </div>
  <p class="a2-intro">{INTRO.get(c['name'], '')}</p>
  <div class="a2-hd"><span></span><span>Hub</span><span style="text-align:right" title="beginner, intermediate, advanced problem counts">Difficulty</span><span style="text-align:right">Done</span><span style="text-align:right">XP</span><span></span></div>
  <div class="a2-rows">{''.join(rows)}</div>
  {quiz_slips}
</section>""")
    return ''.join(secs)

chips_nav = ''.join(
    f'<a class="chip" href="#{aid(c["name"])}" data-spy="{aid(c["name"])}"><span class="d" style="background:{ACC.get(c["name"], "#475569")}"></span>{c["name"]} <span class="c">{len(c["hubs"])}</span></a>'
    for c in CATS)

quiz_chips = ''.join(
    f'<a style="display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);border-radius:99px;padding:7px 13px;font-size:13px;font-weight:500" href="/{q["href"]}"><svg class="ic ic-sm" style="color:var(--amber)"><use href="#i-award"/></svg> {esc(q["title"])}</a>'
    for q in QUIZZES)

BODY = f"""
<section class="a2-hero reveal">
  <div>
    <h1>The practice workbook</h1>
    <p class="dek">R sticks when you write it, not when you read about it. Each problem here checks your answer the moment you run it, so you always know which skills you own and which need another rep.</p>
    {out(f"<b style='color:var(--ink)'>{TOT['hubs']}</b> hubs &middot; <b style='color:var(--ink)'>{len(CATS)}</b> Domains &middot; Tons of XP on the table")}
  </div>
  {demo_block()}
</section>
{bench()}
<section class="a2-wallwrap reveal" id="wall">
  <h2>The Exercises Wall</h2>
  <div class="a2-legend"><span><i style="background:color-mix(in srgb,var(--green) 30%,var(--card))"></i>beginner +10</span>
  <span><i style="background:color-mix(in srgb,#c99117 45%,var(--card))"></i>intermediate +25</span>
  <span><i style="background:color-mix(in srgb,var(--red) 38%,var(--card))"></i>advanced +50</span>
  <span><i style="background:var(--green)"></i>solved</span></div>
  <div class="a2-wall-clip" id="a2Clip"><div id="a2Wall"><p class="a2-note">One square per problem. Loading the wall...</p></div></div>
  <button class="a2-wall-more" id="a2More" type="button" hidden>Show the full wall</button>
</section>
<nav class="a2-catnav" aria-label="Topics">
  {chips_nav}
  <span class="a2-qwrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input id="a2Q" type="search" placeholder="Search {TOT['exercises']:,} problems" aria-label="Search hubs and problems"><kbd>/</kbd></span>
</nav>
<p class="a2-qcount" id="a2Count"></p>
{sections_html()}
<section class="a2-sec reveal" id="quizzes" data-spysec="quizzes" style="padding-bottom:22px">
  <div class="a2-sech"><svg class="ic" style="color:var(--amber)"><use href="#i-award"/></svg><h2>Mastery quizzes</h2>
  {out(f"{len(QUIZZES)} assessments &middot; timed &middot; count toward the certificate")}</div>
  <p class="a2-intro">Each quiz also appears at the end of its topic above. Pass one and it counts toward the certificate.</p>
  <div style="display:flex;flex-wrap:wrap;gap:8px">{quiz_chips}</div>
</section>
<section class="a2-sec reveal" style="padding-bottom:22px">
  <div class="a2-sech"><h2>Keep what you earn</h2></div>
  <p class="a2-intro">Attempts are free without an account. Sign in and every solve, streak day, and XP point is saved to your profile, and finished topics count toward the certificate.</p>
  <a class="btn btn-primary" href="/signin.html">Sign in free <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a>
  <a class="btn btn-ghost" style="margin-left:8px" href="/pricing.html">See certification</a>
</section>
"""

JS = r"""
var XPD={b:10,i:25,a:50},DN={b:'beginner',i:'intermediate',a:'advanced'};
var CATS=null,HUBIX={},PEN='__PEN__';
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}

/* honest progress: the same localStorage the hub engine writes */
function solvedFor(href){
  try{var d=JSON.parse(localStorage.getItem('rsc-exercise-hub-v1:/'+href));
    return (d&&d.solved)||{}}catch(e){return{}}
}
function solvedCount(href){var s=solvedFor(href),n=0;for(var k in s)if(s[k])n++;return n}

fetch('/www/exercise-catalog.json?v=__CATHASH__').then(function(r){return r.json()}).then(function(d){
  CATS=d.categories;
  CATS.forEach(function(c){c.hubs.forEach(function(h){HUBIX[h.slug]=h})});
  buildWall();hydrateAll();wireRows();wireSearch();
}).catch(function(){
  document.getElementById('a2Wall').innerHTML='<p class="a2-note">The catalog data could not be loaded. The syllabus below still works.</p>';
  wireRows();
});

function buildWall(){
  var html='',totalSolved=0;
  CATS.forEach(function(c){
    var n=0,dex=0,sqs='';
    c.hubs.forEach(function(h){var sv=solvedFor(h.href);n+=h.n;
      (h.sections||[]).forEach(function(sec){sec.problems.forEach(function(p){
        var solved=!!sv[p.id];if(solved)dex++;
        sqs+='<a class="'+(solved?'s':p.d)+'" href="/'+h.href+'#'+p.id+'" title="'+esc(h.title+': '+(p.t||('problem '+p.n))+' ('+DN[p.d]+')')+'"></a>';})})});
    totalSolved+=dex;
    var a=c.name.toLowerCase().replace(/[^a-z]+/g,'-');
    html+='<div class="a2-wband"><div class="wh"><a href="#'+a+'">'+c.name+'</a>'+
    '<span class="a2-out"><span class="pr">#&gt;</span>'+c.hubs.length+' hubs &middot; '+n+' problems &middot; '+dex+' solved</span></div>'+
    '<div class="a2-sqs">'+sqs+'</div></div>';});
  document.getElementById('a2Wall').innerHTML=html;
  var ws=document.getElementById('wallSolved');if(ws)ws.textContent=totalSolved;
  var wrap=document.querySelector('.a2-wallwrap'),clip=document.getElementById('a2Clip'),btn=document.getElementById('a2More');
  if(document.getElementById('a2Wall').scrollHeight>clip.clientHeight+40){btn.hidden=false;
    btn.addEventListener('click',function(){var open=wrap.classList.toggle('open');
      btn.textContent=open?'Collapse the wall':'Show the full wall';});}
}

function hydrateAll(){
  var cont=null,contFrac=0;
  document.querySelectorAll('.a2-sec[data-cat]').forEach(function(sec){
    var catSolved=0,catN=0;
    sec.querySelectorAll('.a2-hub').forEach(function(hub){
      var href=hub.getAttribute('data-href'),n=+hub.getAttribute('data-n')||0;
      var k=solvedCount(href);catN+=n;catSolved+=k;
      var st=hub.querySelector('.st'),done=hub.querySelector('[data-done]');
      if(k>=n&&n>0){hub.classList.add('done');
        if(st)st.outerHTML=PEN;
        if(done)done.textContent=n;}
      else if(k>0){st.classList.add('part');st.style.setProperty('--pct',Math.round(360*k/Math.max(n,1))+'deg');
        if(done)done.textContent=k+'/'+n;
        var f=k/Math.max(n,1);if(f>contFrac&&f<1){contFrac=f;cont={hub:hub,k:k,n:n}}}
    });
    var cs=sec.querySelector('[data-catsolved]'),cb=sec.querySelector('[data-catbar]');
    if(cs)cs.textContent=catSolved;
    if(cb)cb.style.width=Math.round(100*catSolved/Math.max(catN,1))+'%';
  });
  /* fresh visitor: Suggested next duplicates the New-here card; show it only
     alongside real progress */
  if(!cont){var bs=document.getElementById('benchSug');if(bs)bs.hidden=true}
  /* Continue card from the most advanced unfinished hub on this device */
  if(cont){
    var h=HUBIX[cont.hub.getAttribute('data-slug')];
    if(h){document.getElementById('bcT').textContent=h.title;
      document.getElementById('bcS').textContent='Problem '+(cont.k+1)+' of '+h.n;
      document.getElementById('bcGo').setAttribute('href','/'+h.href);
      var sv=solvedFor(h.href),mini='',i=0;
      (h.sections||[]).forEach(function(sec){sec.problems.forEach(function(p){
        if(i++<60)mini+='<i class="'+(sv[p.id]?'s':'')+'"></i>'})});
      document.getElementById('bcMini').innerHTML=mini;
      var left=0;(h.sections||[]).forEach(function(sec){sec.problems.forEach(function(p){if(!sv[p.id])left+=XPD[p.d]})});
      document.getElementById('bcXp').innerHTML='<span class="pr">#&gt;</span>'+left+' XP left in this hub';
      document.getElementById('benchCont').hidden=false;
      document.getElementById('benchStart').hidden=true;}
  }
  /* Today card: real local counters, plus account stats when signed in */
  try{
    var daily=JSON.parse(localStorage.getItem('rsc-daily-v1')||'null');
    var streak=JSON.parse(localStorage.getItem('rsc-streak-v1')||'null');
    var today=(daily&&daily.date===new Date().toISOString().slice(0,10))?daily.count:0;
    var days=(streak&&streak.days)||0;
    if(today>0||days>0){
      document.getElementById('tdNums').innerHTML='<b>'+today+' solved today</b><br>'+
        (days>0?('<span style="color:var(--amber)">&#9650;</span> '+days+'-day streak'):'keep the streak alive');
      document.getElementById('benchToday').hidden=false;}
  }catch(e){}
  document.addEventListener('auth-hydrated',function(ev){
    var me=ev.detail&&ev.detail.me;if(!me||!me.user)return;
    fetch('/api/me/stats',{headers:ev.detail.token?{Authorization:'Bearer '+ev.detail.token}:{}})
      .then(function(r){return r.ok?r.json():null}).then(function(s){
        if(!s)return;
        var el=document.getElementById('tdNums');
        var extra='<span style="color:var(--faint)">'+(s.total_xp||0).toLocaleString()+' XP total</span>';
        if(el&&el.innerHTML)el.innerHTML+='<br>'+extra;
        else{el.innerHTML='<b>'+(s.current_streak_days||0)+'-day streak</b><br>'+extra;
          document.getElementById('benchToday').hidden=false;}
      }).catch(function(){});
  });
}

function hydrateBody(hub){
  var body=hub.querySelector('.a2-body');
  if(body.getAttribute('data-hydrate')==='1')return;
  var h=HUBIX&&HUBIX[hub.getAttribute('data-slug')];if(!h){body.innerHTML='<p class="a2-note">Open the hub to see its problems.</p>';return}
  var sv=solvedFor(h.href),k=solvedCount(h.href);
  var secs=(h.sections||[]).map(function(sec){
    return '<div class="a2-cs"><p class="sh">## Section '+sec.num+'. <span class="h">'+esc(sec.title)+'</span> ('+sec.problems.length+')</p>'+
    '<div class="a2-chips">'+sec.problems.map(function(p,ix){
      var cls=p.d+(sv[p.id]?' solved':'');
      var tip=(p.t?p.t+' ':'problem '+p.n+' ')+'('+DN[p.d]+', +'+XPD[p.d]+' XP)';
      return '<a class="'+cls+'" style="animation-delay:'+Math.min(ix*14,420)+'ms" href="/'+h.href+'#'+p.id+'" title="'+esc(tip)+'"><span class="br">[</span>'+p.n+'<span class="br">]</span></a>';}).join('')+'</div></div>';}).join('');
  var act=(k>0&&k<h.n)?('Resume at problem '+(k+1)):(k>=h.n&&h.n>0?'Review the set':'Start at problem 1');
  body.innerHTML='<p class="a2-blurb">'+esc(h.blurb||'')+'</p>'+secs+
  '<div class="a2-act"><a class="btn btn-primary btn-sm" href="/'+h.href+'">'+act+' <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a>'+
  '<a class="open-hub" href="/'+h.href+'">Open the full hub</a>'+
  '<span class="a2-out"><span class="pr">#&gt;</span>solved: '+k+'/'+h.n+'</span></div>';
  body.setAttribute('data-hydrate','1');
}

function wireRows(){
  document.querySelectorAll('.a2-hub').forEach(function(hub){
    var btn=hub.querySelector('.a2-tog');
    function tog(){hydrateBody(hub);hub.classList.toggle('open');
      btn.setAttribute('aria-expanded',hub.classList.contains('open')?'true':'false')}
    btn.addEventListener('click',tog);
  });
}

function wireSearch(){
  var inp=document.getElementById('a2Q'),count=document.getElementById('a2Count');
  function apply(){
    var q=inp.value.trim().toLowerCase();
    document.body.classList.toggle('searching',!!q);
    if(!q){
      document.querySelectorAll('.a2-hub.qhide,.a2-sec.qhide').forEach(function(el){el.classList.remove('qhide')});
      document.querySelectorAll('.a2-pmatch').forEach(function(ul){ul.hidden=true;ul.innerHTML=''});
      return;}
    var re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
    var hubHits=0,pHits=0;
    document.querySelectorAll('.a2-sec[data-spysec]').forEach(function(sec){
      var any=false;
      sec.querySelectorAll('.a2-hub').forEach(function(hub){
        var slug=hub.getAttribute('data-slug');if(!slug){hub.classList.add('qhide');return}
        var h=HUBIX[slug];var tm=hub.getAttribute('data-title').indexOf(q)>=0;
        var pm=[];if(h)(h.sections||[]).forEach(function(s){s.problems.forEach(function(p){
          if(p.t&&p.t.toLowerCase().indexOf(q)>=0)pm.push(p)})});
        var ul=hub.querySelector('.a2-pmatch');
        if(tm||pm.length){hub.classList.remove('qhide');any=true;hubHits++;pHits+=pm.length;
          if(pm.length&&h){ul.hidden=false;ul.innerHTML=pm.slice(0,4).map(function(p){
            return '<li><a href="/'+h.href+'#'+p.id+'"><span class="pn '+p.d+'">['+p.n+']</span>'+
            esc(p.t).replace(re,'<mark>$1</mark>')+'</a></li>'}).join('')+
            (pm.length>4?('<li><a href="/'+h.href+'"><span class="pn"></span>and '+(pm.length-4)+' more in this hub</a></li>'):'');}
          else{ul.hidden=true;ul.innerHTML=''}}
        else{hub.classList.add('qhide');ul.hidden=true;ul.innerHTML=''}});
      sec.classList.toggle('qhide',!any);});
    count.textContent=hubHits+' hubs, '+pHits+' matching problems for "'+q+'"';
  }
  inp.addEventListener('input',apply);
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();inp.focus()}
    if(e.key==='Escape'){inp.value='';apply()}});
}

/* scroll-spy */
(function(){var links=document.querySelectorAll('.a2-catnav a[data-spy]');
var secs=document.querySelectorAll('[data-spysec]');
function on(){var y=window.scrollY+150,cur=null;
secs.forEach(function(s){if(s.offsetTop<=y)cur=s.getAttribute('data-spysec')});
links.forEach(function(l){l.classList.toggle('on',l.getAttribute('data-spy')===cur)});}
window.addEventListener('scroll',on,{passive:true});on();})();

/* hero demo: a real exercise block solving itself, slowly */
(function(){
var P=[
 {q:'Keep only the values greater than 10, then return their mean.',
  setup:'x <- c(4, 19, 7, 42, 23)',ans:'mean(x[x > 10])',out:'#> [1] 28',fb:'Correct. +10 XP'},
 {q:'Count the gear values among cars with mpg above 25.',
  setup:'library(dplyr)',ans:'mtcars %>% filter(mpg > 25) %>% count(gear)',out:'#>   gear n\n#> 1    4 5\n#> 2    5 1',fb:'Correct. +25 XP'},
 {q:'How many characters are in each of these words?',
  setup:'w <- c("mean", "median", "mode")',ans:'nchar(w)',out:'#> [1] 4 6 4',fb:'Correct. +10 XP'}
];
var card=document.getElementById('demoCard');if(!card)return;
var elQ=document.getElementById('dcQ'),elS=document.getElementById('dcSetup'),elTy=document.getElementById('dcTyped'),
    elO=document.getElementById('dcOut'),elV=document.getElementById('dcVerdict'),elR=document.getElementById('dcRun'),
    dots=card.querySelectorAll('.dc-dots i');
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(rm){var p0=P[0];elTy.textContent=p0.ans;elO.hidden=false;elO.textContent=p0.out;
  elV.textContent=p0.fb;elV.classList.add('ok');return}
var ix=0,paused=false;
card.addEventListener('mouseenter',function(){paused=true});
card.addEventListener('mouseleave',function(){paused=false});
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function unpaused(){return new Promise(function(r){(function c(){if(!paused)return r();setTimeout(c,300)})()})}
function typeAns(a){return new Promise(function(r){var i=0;(function step(){
  if(paused){setTimeout(step,300);return}
  elTy.textContent=a.slice(0,++i);
  if(i<a.length)setTimeout(step,34+Math.random()*46);else r();})()})}
function setP(p,k){elQ.textContent=p.q;elS.textContent=p.setup;
  elTy.textContent='';elO.hidden=true;elO.textContent='';
  elV.innerHTML='&nbsp;';elV.classList.remove('ok');
  dots.forEach(function(d,i){d.classList.toggle('on',i===k)});}
(async function loop(){
  for(;;){
    var p=P[ix%P.length];setP(p,ix%P.length);
    await wait(1500);await unpaused();
    await typeAns(p.ans);
    await wait(500);await unpaused();
    elR.classList.add('pressed');await wait(220);elR.classList.remove('pressed');
    await wait(300);
    elO.hidden=false;elO.textContent=p.out;
    await wait(500);
    elV.textContent=p.fb;elV.classList.add('ok');
    await wait(3600);await unpaused();
    ix++;
  }
})();
})();
"""

reveal = """
<script>(function(){var els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
els.forEach(function(e){io.observe(e)});})();</script>"""

js = JS.replace('__PEN__', PEN.replace("'", "\\'")).replace('__CATHASH__', CAT_HASH)
page = shell.replace('<!--EXBODY-->',
    '<main class="wrap">\n<style>' + CSS + '</style>\n' + BODY + '\n' + reveal + '\n<script>' + js + '</script>\n')
assert chr(8212) not in CSS + BODY + js, 'em dash found'
assert page.count('<main class="wrap">') == 1
io.open('exercises/index.html', 'w', encoding='utf-8', newline='\n').write(page)
print('exercises/index.html written:', len(page)//1024, 'KB | catalog hash', CAT_HASH)

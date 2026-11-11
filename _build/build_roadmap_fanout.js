/* Builds the v2 track pages: /roadmap/v2/<slug>.html, one per track.
 *
 * Run: node _build/build_roadmap_fanout.js      (from the repo root)
 *
 * A SECOND presentation of the same curriculum. It does not touch
 * /roadmap/<slug>.html, which stays exactly as it is.
 *
 * Why generated rather than written by hand: the curriculum, the lesson
 * titles and above all which lessons are free all live in courses.json and
 * www/roadmap-curriculum.js, and they move. A hand-written copy would be
 * wrong within a week, and wrong about access is the one thing a pricing page
 * cannot be.
 *
 * Access is read PER LESSON from courses.json. The v1 page infers it from the
 * section number, which the regating made approximate: the first lesson of
 * every section is free now, so no section is wholly free or wholly Pro.
 *
 * The pages carry noindex and canonical to their v1 twin. Two indexable pages
 * holding one curriculum would compete with each other, and the v1 page is the
 * one with the links and the history.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
global.window = {};
require(path.join(root, 'www', 'roadmap-data.js'));
require(path.join(root, 'www', 'roadmap-curriculum.js'));
const RM = global.window.RM;
const RM2 = global.window.RM2;

const CSS_V = 6;   // /www/roadmap-fanout.css is immutable: bump on every change
const JS_V = 5;    // /www/roadmap-fanout.js  likewise

/* Track key to page slug. The same pairing /roadmap/ already publishes, so the
   v2 page sits beside its twin and can canonical to it. */
const SLUG = {
  foundations: 'new-to-r',
  analyst: 'data-analyst',
  ds: 'data-scientist',
  ts: 'forecaster',
  researcher: 'researcher',
  developer: 'r-developer',
  mleng: 'ml-engineer',
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad2 = (n) => (n < 10 ? '0' + n : String(n));

const ICON_STAR =
  '<svg class="rmx-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 2.6l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.9l-5.8 3.5 1.6-6.6-5.2-4.4 6.8-.5z"/></svg>';

const ICON_BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/>' +
  '<polyline points="12 19 5 12 12 5"/></svg>';

const ICON_INFO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/>' +
  '<line x1="12" y1="7.5" x2="12" y2="7.6"/></svg>';

const ICON_COPY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/>' +
  '<path d="M5 15V5a2 2 0 012-2h8"/></svg>';

// ---------------------------------------------------------------- data ----

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'courses.json'), 'utf8'));
const COURSES = catalog.courses || catalog;

/* Every built lesson of a track, grouped by the roadmap section its course is
   pinned to, each kept in its taught order. */
function lessonsBySection(trackKey) {
  const out = {};
  COURSES.filter((c) => c.roadmap && c.roadmap.track === trackKey).forEach((c) => {
    const sec = Number(c.roadmap.section);
    if (!sec) return;
    (c.lessons || []).forEach((l) => {
      if (l.built === false) return;
      (out[sec] = out[sec] || []).push({
        slug: l.slug,
        title: l.title || l.slug,
        subtitle: l.subtitle || '',
        order: Number(l.order) || 0,
        kind: l.kind || 'lesson',
        pro: String(l.access).toLowerCase() === 'pro',
        course: c.course_id,
      });
    });
  });
  Object.keys(out).forEach((k) => out[k].sort((a, b) => a.order - b.order));
  return out;
}

function level(trackKey) {
  return (RM.LEVELS || []).find((l) => l.key === trackKey) || {};
}

/* The lesson the player opens on: the first free lesson in the earliest
   section that has one. Never a Pro lesson, and never a quiz. */
function openingLesson(bySec) {
  const secs = Object.keys(bySec).map(Number).sort((a, b) => a - b);
  for (const s of secs) {
    const hit = bySec[s].find((l) => !l.pro && l.kind !== 'quiz');
    if (hit) return hit;
  }
  return null;
}

// ------------------------------------------------------------- chrome ----

/* The navbar and the script tags are lifted from the v1 page rather than
   retyped. One navbar sitewide is a project rule, and a second hand-written
   copy would drift the moment the real one changes. */
function chromeFrom(slug) {
  const p = path.join(root, 'roadmap', slug + '.html');
  const h = fs.readFileSync(p, 'utf8');
  const i = h.indexOf('<nav class="nav">');
  const j = h.indexOf('</nav>', i);
  if (i < 0 || j < 0) throw new Error('nav block not found in ' + p);
  const nav = h.slice(i, j + '</nav>'.length);

  // every deferred script except the v1 page controller, which does not apply
  const scripts = (h.match(/<script[^>]*src="\/www\/[^"]*"[^>]*><\/script>/g) || [])
    /* The v1 page controller does not apply here, and the feedback launcher
       parks itself bottom right, exactly over the lesson's Continue button. */
    .filter((s) => !/roadmap-role\.js|feedback-widget\.js/.test(s));

  const cf = h.match(/<script[^>]*cloudflareinsights[^>]*><\/script>/);

  const ga = h.match(/<script>\s*window\.dataLayer[\s\S]*?<\/script>/);

  const foot = (() => {
    const a = h.lastIndexOf('<footer');
    if (a < 0) return '';
    const b = h.indexOf('</footer>', a);
    return b < 0 ? '' : h.slice(a, b + '</footer>'.length);
  })();

  return { nav, scripts, cf: cf ? cf[0] : '', ga: ga ? ga[0] : '', foot };
}

// ------------------------------------------------------------ building ----

function railCurriculum(secs, bySec) {
  return secs.map((s) => {
    const ls = bySec[s.n] || [];
    if (!ls.length) return '';
    /* The href is real so the row works without JavaScript and opens in a new
       tab the way any link should. The script intercepts a plain click and
       loads the lesson into the player instead, which is what keeps a reader
       on this page. */
    const rows = ls.map((l) =>
      '<a class="rmx-l" href="/' + esc(l.slug) + '.html"' +
      ' data-rmx-lesson="' + esc(l.slug) + '"' + (l.pro ? ' data-pro="1"' : '') + '>' +
      '<span class="rmx-lt">' + esc(l.title) + '</span>' +
      (l.pro ? ICON_STAR : '') + '</a>'
    ).join('');
    return '<details class="rmx-sec"' + (s.n === 1 ? ' open' : '') + '>' +
      '<summary><span class="rmx-sn">' + pad2(s.n) + '</span>' +
      '<span class="rmx-st">' + esc(s.title) + '</span>' +
      '<span class="rmx-ct">' + ls.length + '</span></summary>' +
      '<div class="rmx-lsns">' + rows + '</div></details>';
  }).join('');
}

/* Shown only while the player holds a locked lesson, which is why it carries
   `hidden`. The lesson's own gate inside the frame says what is locked; this
   says what it costs, which the gate does not. */
function proPanel(L) {
  const cert = L.cert ? esc(L.cert) : 'the certificate';
  return '<div class="rmx-pro" data-rmx-offertrigger hidden>' +
    '<p class="rmx-eyebrow">Free preview</p>' +
    '<h3>Open the rest of the track</h3>' +
    '<p>One plan opens every track on the site, the graded practice, and ' + cert +
    '. The first lesson of every section stays free whether you buy or not.</p>' +
    '<div class="rmx-plans">' +
      '<div class="rmx-plan pick">' +
        '<span class="pn">All-Access, annual</span>' +
        '<span class="pa" data-rmx-price="year">$129</span>' +
        '<span class="pw">a year, every track</span>' +
        '<a class="pb" href="/pricing.html#plans">See the plan</a>' +
      '</div>' +
      '<div class="rmx-plan alt">' +
        '<span class="pn">Lifetime</span>' +
        '<span class="pa" data-rmx-price="lifetime">$279</span>' +
        '<span class="pw">once, and never again</span>' +
        '<a class="pb" href="/pricing.html#lifetime">See Lifetime</a>' +
      '</div>' +
    '</div></div>';
}

function offerDialog() {
  const conf = new Array(10).fill('<i></i>').join('');
  return '<div class="rmx-offer" id="rmxOffer" role="dialog" aria-modal="true" ' +
    'aria-labelledby="rmxOfferH" aria-hidden="true">' +
    '<div class="rmx-offerbox">' +
      '<button type="button" class="ox" aria-label="Close. This offer will not come back.">×</button>' +
      '<div class="rmx-stage">' +
        '<span class="rmx-conf" aria-hidden="true">' + conf + '</span>' +
        '<div class="rmx-ticket"><span data-rmx-pct>30%</span> off</div>' +
      '</div>' +
      '<div class="rmx-offerbody">' +
        '<h2 id="rmxOfferH">You have unlocked a limited-time coupon</h2>' +
        /* Filled from the server's own list of covered prices, so the promise
           and the Paddle restriction cannot drift apart. The baked wording is
           the conservative one. */
        '<p class="sub">Applies to <span data-rmx-applies>the annual plan and Lifetime</span>. ' +
        'Monthly renews at its displayed price.</p>' +
        '<div class="rmx-code"><code data-rmx-code>CODE</code>' +
          '<button type="button" class="cp" data-rmx-copy aria-label="Copy the code">' +
          ICON_COPY + '<span class="cplab">Copy</span></button></div>' +
        '<p class="rmx-expl">Use it before it expires in</p>' +
        '<div class="rmx-clocks"><b data-rmx-mm>60</b><i>:</i><b data-rmx-ss>00</b></div>' +
        '<a class="ob" data-rmx-take href="/pricing.html">Use 30% coupon →</a>' +
        '<p class="rmx-once">' + ICON_INFO + ' This offer is issued ' +
        '<b>once for your account</b> and will not appear again.</p>' +
      '</div>' +
    '</div></div>';
}

function page(trackKey) {
  const slug = SLUG[trackKey];
  const L = level(trackKey);
  const meta = (RM.TRACK_META || {})[trackKey] || {};
  const secs = (RM2.sections || {})[trackKey] || [];
  const bySec = lessonsBySection(trackKey);
  const chrome = chromeFrom(slug);

  const all = Object.keys(bySec).reduce((a, k) => a.concat(bySec[k]), []);
  const total = all.length;
  const free = all.filter((l) => !l.pro).length;
  const open = openingLesson(bySec);

  const role = meta.role || L.persona || slug;
  const title = role + ' track, lesson by lesson';
  const desc = 'Every lesson in the ' + role + ' track, which are free, and what Pro opens. ' +
    (L.become ? L.become.slice(0, 110) : '');

  const facts = [
    total ? '<li><b>' + total + '</b> lessons, <b>' + free + '</b> open free</li>' : '',
    '<li>' + ICON_STAR + ' marks Pro lessons</li>',
    L.weeks ? '<li><b>' + esc(L.weeks.replace(/^~/, '')) + '</b> at a steady pace</li>' : '',
    meta.build ? '<li>You finish with: ' + esc(meta.build) + '</li>' : '',
  ].filter(Boolean).join('');

  /* The real lesson, in the page. Emitted as markup rather than mounted by
     script so it is there without JavaScript, and same-origin so the page can
     dress the frame and gate the first run. */
  /* No bar above the frame. The lesson names itself in its own breadcrumb and
     the rail highlights the row, so a third copy of the title only pushed the
     player below the fold. */
  const player = open
    ? '<div class="rmx-playwrap" data-rmx-player data-lesson-href="/' + esc(open.slug) + '.html">' +
      '<iframe class="rmx-frame" src="/' + esc(open.slug) + '.html" loading="lazy" ' +
      'title="' + esc(open.title) + ', interactive lesson"></iframe>' +
      '</div>'
    : '';

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(title) + ' · r-statistics.co</title>\n' +
    '<meta name="description" content="' + esc(desc.trim()) + '">\n' +
    /* Not indexable, and pointed at its twin: one curriculum on two indexable
       URLs would only compete with itself. */
    '<meta name="robots" content="noindex, follow">\n' +
    '<link rel="canonical" href="https://r-statistics.co/roadmap/' + slug + '.html">\n' +
    '<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
    '<meta name="theme-color" content="#1F6B4A">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800;900&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/www/site-nav.css?v=19">\n' +
    /* The base sheet: the canonical navbar, the body font and half the design
       tokens are defined here. Without it the page renders as unstyled serif
       with every var() falling back to nothing. Loaded before this page's own
       sheet so the page's rules win where the two overlap. */
    '<link rel="stylesheet" href="/www/roadmap-role.css?v=25">\n' +
    '<link rel="stylesheet" href="/www/roadmap-fanout.css?v=' + CSS_V + '">\n' +
    chrome.ga + '\n' +
    '</head>\n<body data-page="rmx" data-role="' + trackKey + '">\n' +
    chrome.nav + '\n' +
    '<div class="rmx">\n' +
    '<aside class="rmx-rail">\n' +
      '<a class="rmx-back" href="/roadmap/">' + ICON_BACK + 'All tracks</a>\n' +
      '<div class="rmx-key"><h1>' + esc(role) + '</h1>' +
      (L.cert ? '<span class="rmx-cert">' + esc(L.cert) + '</span>' : '') +
      '<ul class="rmx-facts">' + facts + '</ul></div>\n' +
      '<h2 class="rmx-currhead">Curriculum</h2>\n' +
      railCurriculum(secs, bySec) + '\n' +
    '</aside>\n' +
    '<main class="rmx-main">\n' +
      /* No heading or standfirst here: the rail already names the track and
         carries its facts, and repeating them pushed the lesson below the
         fold. The rail's name is the page's only h1, which is also one fewer
         than before. */
      '<nav class="rmx-crumb"><a href="/">Home</a><span>/</span><a href="/roadmap/">Tracks</a>' +
      '<span>/</span><span>' + esc(role) + '</span></nav>\n' +
      player + '\n' +
      /* The curriculum is the rail's job. Repeating all 176 rows underneath
         the player doubled the page weight and buried the one thing the page
         is for. The plan box takes its place, and only when the lesson in the
         player is a locked one. */
      proPanel(L) + '\n' +
    '</main>\n</div>\n' +
    offerDialog() + '\n' +
    (chrome.foot || '') + '\n' +
    chrome.scripts.join('\n') + '\n' +
    '<script defer src="/www/roadmap-fanout.js?v=' + JS_V + '"></script>\n' +
    chrome.cf + '\n' +
    '</body>\n</html>\n';
}

// ----------------------------------------------------------------- run ----

const outDir = path.join(root, 'roadmap', 'v2');
fs.mkdirSync(outDir, { recursive: true });

let n = 0;
Object.keys(SLUG).forEach((key) => {
  if (!((RM2.sections || {})[key] || []).length) {
    console.log('  skipped ' + key + ': no sections in the curriculum data');
    return;
  }
  const html = page(key);
  const p = path.join(outDir, SLUG[key] + '.html');
  fs.writeFileSync(p, html, 'utf8');
  const bySec = lessonsBySection(key);
  const all = Object.keys(bySec).reduce((a, k) => a.concat(bySec[k]), []);
  console.log('  wrote roadmap/v2/' + SLUG[key] + '.html  ' +
    all.length + ' lessons, ' + all.filter((l) => !l.pro).length + ' free');
  n++;
});
console.log('done: ' + n + ' page(s)');

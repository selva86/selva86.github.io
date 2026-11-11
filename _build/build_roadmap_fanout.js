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

const CSS_V = 1;   // /www/roadmap-fanout.css is immutable: bump on every change
const JS_V = 1;    // /www/roadmap-fanout.js  likewise

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

const ICON_PLAY =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l12 7-12 7z"/></svg>';

const ICON_TAG =
  '<svg class="tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7.2-7.2a2 2 0 01-.6-1.4V4a1 1 0 011-1h8a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.4z"/>' +
  '<circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

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
    .filter((s) => !/roadmap-role\.js/.test(s));

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
    const rows = ls.map((l) =>
      '<a class="rmx-l" href="/' + esc(l.slug) + '.html">' +
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

function mainCurriculum(secs, bySec) {
  return secs.map((s) => {
    const ls = bySec[s.n] || [];
    const built = ls.length > 0;
    const freeN = ls.filter((l) => !l.pro).length;
    const meta = built
      ? ls.length + (ls.length === 1 ? ' lesson' : ' lessons') + (freeN ? ', ' + freeN + ' free' : '')
      : 'in the plan';

    const rows = built
      ? ls.map((l, i) =>
          '<a class="rmx-row ' + (l.pro ? 'is-pro' : 'is-free') + '" href="/' + esc(l.slug) + '.html">' +
          '<span class="rmx-rown">' + (i + 1) + '</span>' +
          '<span class="rmx-rowt">' + esc(l.title) +
          (l.subtitle ? '<small>' + esc(l.subtitle) + '</small>' : '') + '</span>' +
          '<span class="rmx-rowa">' + (l.pro ? ICON_STAR + 'Pro' : 'Free') + '</span></a>'
        ).join('')
      /* A section with nothing built yet shows its concepts and says so. The
         alternative, hiding it, would make the track look shorter than it is. */
      : '<div class="rmx-row"><span class="rmx-rown"></span><span class="rmx-rowt">' +
        esc((s.items || []).join(' · ')) + '</span></div>';

    return '<details class="rmx-block"' + (s.n === 1 ? ' open' : '') + '>' +
      '<summary><span class="rmx-bn">' + pad2(s.n) + '</span>' +
      '<span class="rmx-bt"><strong>' + esc(s.title) + '</strong>' +
      (s.outcome ? '<em>' + esc(s.outcome) + '</em>' : '') + '</span>' +
      '<span class="rmx-bmeta">' + meta + '</span></summary>' +
      '<div class="rmx-rows">' + rows + '</div></details>';
  }).join('');
}

function proPanel(L) {
  const cert = L.cert ? esc(L.cert) : 'the certificate';
  return '<div class="rmx-pro" data-rmx-offertrigger>' +
    '<h3>The starred lessons come with Pro</h3>' +
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
  return '<div class="rmx-offer" id="rmxOffer" role="dialog" aria-modal="true" ' +
    'aria-labelledby="rmxOfferH" aria-hidden="true">' +
    '<div class="rmx-offerbox">' +
      '<div class="oc" data-rmx-pct>30%</div>' +
      '<h2 id="rmxOfferH">Here is 30% off, once.</h2>' +
      '<p>You have been reading the curriculum, so here is the discount rather than ' +
      'a form to ask for it.</p>' +
      '<div class="rmx-pill">' +
        '<span>' + ICON_TAG + ' 30% off the annual plan with <code data-rmx-code>CODE</code></span>' +
        '<button type="button" class="cp" data-rmx-copy aria-label="Copy the code">' +
          ICON_COPY + '<span class="cplab">Copy</span></button>' +
        '<span class="ends">ends in <span data-rmx-clock>24h</span></span>' +
      '</div>' +
      '<p class="rmx-once">This appears once. Close it and it is gone for good, ' +
      'on this browser and every other one you sign in from.</p>' +
      '<a class="ob" data-rmx-take href="/pricing.html">Use it now</a>' +
      '<button type="button" class="ox">No thanks, I understand it will not come back</button>' +
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

  const player = open
    ? '<div class="rmx-playwrap" data-rmx-player data-lesson-href="/' + esc(open.slug) + '.html">' +
      '<div class="rmx-playbar"><span class="rmx-freechip">FREE</span>' +
      '<span class="lab">' + esc(open.title) + '</span></div>' +
      '<button type="button" class="rmx-poster">' +
        '<p class="rmx-postertitle">' + esc(open.title) + '</p>' +
        (open.subtitle ? '<p class="rmx-posterbody">' + esc(open.subtitle) + '</p>' : '') +
        '<span class="rmx-playrow">' +
          '<span class="rmx-play">' + ICON_PLAY + '</span>' +
          '<span class="rmx-playnote"><b>Run this lesson in the page.</b><br>' +
          'Nothing to install, and it takes about twenty minutes.</span>' +
        '</span>' +
      '</button></div>'
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
      '<nav class="rmx-crumb"><a href="/">Home</a><span>/</span><a href="/roadmap/">Tracks</a>' +
      '<span>/</span><span>' + esc(role) + '</span></nav>\n' +
      '<h1 class="rmx-h">' + esc(role) + '</h1>\n' +
      (L.become ? '<p class="rmx-dek">' + esc(L.become) + '</p>\n' : '') +
      player + '\n' +
      '<h2 class="rmx-sechead">The whole curriculum</h2>\n' +
      '<p class="rmx-seclede">' + (total
        ? 'The first lesson of every section is free to read and to run. The starred lessons come with Pro.'
        : 'This track is written and being built out lesson by lesson.') + '</p>\n' +
      '<div class="rmx-legend"><span><b>' + free + '</b> free</span>' +
      '<span>' + ICON_STAR + '<b>' + (total - free) + '</b> with Pro</span>' +
      '<span>' + total + ' lessons in all</span></div>\n' +
      mainCurriculum(secs, bySec) + '\n' +
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

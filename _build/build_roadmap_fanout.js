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

const CSS_V = 25;   // /www/roadmap-fanout.css is immutable: bump on every change
const JS_V = 13;    // /www/roadmap-fanout.js  likewise

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

/* The outcome lines in roadmap-data.js are written as whole sentences, so the
   first letter comes down when one is joined onto a clause. */
const lower1 = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);

const ICON_STAR =
  '<svg class="rmx-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 2.6l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.9l-5.8 3.5 1.6-6.6-5.2-4.4 6.8-.5z"/></svg>';

const ICON_BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/>' +
  '<polyline points="12 19 5 12 12 5"/></svg>';

const ICON_PLAY =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l12 7-12 7z"/></svg>';

const ICON_LOCK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2.2"/>' +
  '<path d="M8 10.5V7.4A4 4 0 0 1 16 7.4v3.1"/></svg>';

const ICON_LIST =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/>' +
  '<line x1="9" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/>' +
  '<line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/></svg>';

const ICON_CHART =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 7"/>' +
  '<polyline points="15 7 21 7 21 13"/></svg>';

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

  /* The navbar is not finished by its stylesheet. The v1 page carries an
     inline block that lays out the right-hand group (search, the button, the
     avatar) and styles the signed-out link, and without it that group loses
     its flex row and its spacing and the avatar lands wherever it falls.
     Lifted with the markup for the same reason the markup is lifted: one
     navbar sitewide, and a hand-copied second version drifts. */
  const navcss = (h.match(/<style>[^<]*\.nav \.right[^<]*<\/style>/) || [''])[0];

  const foot = (() => {
    const a = h.lastIndexOf('<footer');
    if (a < 0) return '';
    const b = h.indexOf('</footer>', a);
    return b < 0 ? '' : h.slice(a, b + '</footer>'.length);
  })();

  return { nav, navcss, scripts, cf: cf ? cf[0] : '', ga: ga ? ga[0] : '', foot };
}

// ------------------------------------------------------------ building ----

/* `trackHref` is set on the overview, where there is no player to load into:
   the rows then point at the track page with the lesson in the hash and are
   left to navigate. On the track page itself they stay interceptable. */
function railCurriculum(secs, bySec, trackSlug) {
  return secs.map((s) => {
    const ls = bySec[s.n] || [];
    if (!ls.length) return '';
    /* The href is real so the row works without JavaScript and opens in a new
       tab the way any link should. The script intercepts a plain click and
       loads the lesson into the player instead, which is what keeps a reader
       on this page. */
    const rows = ls.map((l) => {
      const href = trackSlug
        ? '/roadmap/v2/' + trackSlug + '.html#' + esc(l.slug)
        : '/' + esc(l.slug) + '.html';
      const hook = trackSlug
        ? ''
        : ' data-rmx-lesson="' + esc(l.slug) + '"' + (l.pro ? ' data-pro="1"' : '');
      return '<a class="rmx-l" href="' + href + '"' + hook + '>' +
        '<span class="rmx-lt">' + esc(l.title) + '</span>' +
        (l.pro ? ICON_STAR : '') + '</a>';
    }).join('');
    /* Every section open. The rail is a contents page; a reader scanning for
       a lesson should not have to guess which fold it is behind. */
    return '<details class="rmx-sec" open>' +
      '<summary><span class="rmx-sn">' + pad2(s.n) + '</span>' +
      '<span class="rmx-st">' + esc(s.title) + '</span>' +
      '<span class="rmx-ct">' + ls.length + '</span></summary>' +
      '<div class="rmx-lsns">' + rows + '</div></details>';
  }).join('');
}

/* Shown only while the player holds a locked lesson, which is why it carries
   `hidden`. The lesson's own gate inside the frame says what is locked; this
   says what it costs, which the gate does not.

   Laid out like the reference: the Pro mark, the claim, what the plan opens,
   then the plans as two rows a reader picks between rather than two cards
   they compare, and one button. */
function proPanel(L, tracks) {
  const cert = L.cert ? esc(L.cert) : 'the certificate';
  const chips = tracks.map((t) =>
    '<span class="rmx-chip' + (t.built ? '' : ' soon') + '">' + esc(t.name) +
    (t.built ? '' : '<i>soon</i>') + '</span>'
  ).join('');

  return '<div class="rmx-pro" data-rmx-offertrigger hidden>' +
    '<span class="rmx-prochip">' + ICON_STAR + 'Pro</span>' +
    '<h3>Continue learning</h3>' +
    '<p class="rmx-prosub">Pro opens the rest of this track, every other track on the ' +
    'site, the graded practice and ' + cert + '. The first lesson of every section ' +
    'stays free whether you buy or not.</p>' +
    '<div class="rmx-unlock"><span class="lab">Unlock full access to</span>' +
    '<span class="rmx-chips">' + chips + '</span></div>' +
    '<div class="rmx-opts">' +
      '<button type="button" class="rmx-opt on" data-rmx-opt="year" aria-pressed="true">' +
        '<span class="l"><b>All-Access annual</b><em>Billed once a year</em></span>' +
        /* The saving is the USD one; the script restates it from the real
           localized figures when Paddle has previewed them. */
        '<span class="rmx-save" data-rmx-save="year">save 60%</span>' +
        '<span class="r"><b data-rmx-price="year">$129</b>' +
        '<em data-rmx-permonth="year">about $10.75 a month</em></span>' +
      '</button>' +
      /* Quarterly deliberately carries no saving badge. .rmx-save is absolutely
         positioned above its own row, so a badge on the second row lands in the
         8px grid gap and sits on the row above it; and leaving it off keeps the
         annual saving as the one number the eye is drawn to, which is the plan
         worth selling. The script removes this row when the quarterly price is
         not provisioned, and it is the only plan here the pricing page does not
         carry, so its button opens Paddle rather than linking away. */
      '<button type="button" class="rmx-opt" data-rmx-opt="quarter" aria-pressed="false">' +
        '<span class="l"><b>All-Access, 3 months</b><em>Billed once a quarter</em></span>' +
        '<span class="r"><b data-rmx-price="quarter">$69</b>' +
        '<em data-rmx-permonth="quarter">about $23 a month</em></span>' +
      '</button>' +
      '<button type="button" class="rmx-opt" data-rmx-opt="lifetime" aria-pressed="false">' +
        '<span class="l"><b>Lifetime</b><em>One payment, no renewal</em></span>' +
        '<span class="r"><b data-rmx-price="lifetime">$279</b><em>paid once</em></span>' +
      '</button>' +
    '</div>' +
    '<a class="rmx-buy" data-rmx-buy href="/pricing.html#plans">Buy now &rarr;</a>' +
    /* Not "all plans" any more: the quarterly row above is sold here and not
       on the pricing page, so a link promising every plan would be false the
       moment somebody followed it. */
    '<p class="rmx-fine"><a href="/pricing.html">Other plans</a> &middot; ' +
    'Already Pro? <a href="/signin.html">Sign in</a></p>' +
    '</div>';
}


/* One drawing per track, of the thing the track is actually about: a fitted
   cloud for the modeller, a forecast fan for the forecaster, a sampling
   distribution for the researcher, and so on. Drawn at 64x64 and scaled, so
   they stay crisp at any size. */
const COVER_ART = {
  // a scatter with a curve through it
  ds: '<path d="M6 54 C 20 50, 30 30, 58 12" /><circle cx="14" cy="46" r="2.6" fill="currentColor" stroke="none"/>' +
      '<circle cx="24" cy="44" r="2.6" fill="currentColor" stroke="none"/><circle cx="30" cy="34" r="2.6" fill="currentColor" stroke="none"/>' +
      '<circle cx="40" cy="28" r="2.6" fill="currentColor" stroke="none"/><circle cx="46" cy="18" r="2.6" fill="currentColor" stroke="none"/>' +
      '<circle cx="20" cy="34" r="2.6" fill="currentColor" stroke="none"/><circle cx="36" cy="42" r="2.6" fill="currentColor" stroke="none"/>',
  // a series, then the fan of what comes next
  ts: '<path d="M5 44 l8 -10 l7 12 l8 -16 l7 9 l6 -12" /><path d="M41 27 l17 -14" stroke-dasharray="4 4"/>' +
      '<path d="M41 27 l17 2" stroke-dasharray="4 4"/><path d="M41 27 C 50 24, 55 18, 58 13" opacity=".55"/>' +
      '<path d="M41 27 C 50 28, 55 28, 58 29" opacity=".55"/>',
  // bars, read left to right
  analyst: '<path d="M8 54 v-14" /><path d="M20 54 v-24" /><path d="M32 54 v-32" /><path d="M44 54 v-20" /><path d="M56 54 v-28" />',
  // the first steps
  foundations: '<path d="M6 52 h12 v-12 h12 v-12 h12 v-12 h12" />',
  // a sampling distribution with its tail
  researcher: '<path d="M5 48 C 18 48, 20 14, 32 14 C 44 14, 46 48, 59 48" />' +
      '<path d="M46 48 C 50 44, 54 40, 59 48 Z" opacity=".5"/><path d="M5 52 h54" opacity=".5"/>',
  // braces, for the one that is about writing R rather than using it
  developer: '<path d="M26 10 C 18 10, 20 28, 12 32 C 20 36, 18 54, 26 54" />' +
      '<path d="M38 10 C 46 10, 44 28, 52 32 C 44 36, 46 54, 38 54" />',
  // a small network
  mleng: '<circle cx="12" cy="18" r="4"/><circle cx="12" cy="46" r="4"/><circle cx="32" cy="32" r="4"/>' +
      '<circle cx="52" cy="18" r="4"/><circle cx="52" cy="46" r="4"/>' +
      '<path d="M16 20 L28 30 M16 44 L28 34 M36 30 L48 20 M36 34 L48 44" />',
};

function coverArt(key) {
  const d = COVER_ART[key];
  if (!d) return '';
  return '<span class="cv-art" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" ' +
    'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    d + '</svg></span>';
}

/* The cover tile. Drawn rather than an image: each track already carries a
   colour in roadmap-data.js, so seven covers need no seven assets and cannot
   fall out of step with the track they belong to. */
function cover(trackKey, role) {
  const L = level(trackKey);
  const c = L.color || '#1f7a55';
  return '<div class="ov-cover" style="--cv:' + esc(c) + '" aria-hidden="true">' +
    '<i class="cv-tab"></i>' +
    coverArt(trackKey) +
    '<span class="cv-body"><span class="cv-rule"></span>' +
    '<span class="cv-name">' + esc(role) + '</span>' +
    '<span class="cv-foot">r-statistics.co</span></span></div>';
}

const ICON_ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/>' +
  '<polyline points="12 5 19 12 12 19"/></svg>';

/* Every track and whether it has lessons built, for the "unlock full access
   to" row. Tracks with nothing built are marked rather than hidden, which is
   both honest and what the reference does. */
function trackChips() {
  return Object.keys(SLUG).map((key) => {
    const meta = (RM.TRACK_META || {})[key] || {};
    const lvl = level(key);
    const bySec = lessonsBySection(key);
    const n = Object.keys(bySec).reduce((a, k) => a + bySec[k].length, 0);
    return { name: meta.role || lvl.persona || SLUG[key], built: n > 0 };
  });
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

/* Both pages share one shell: the same head, the same navbar, the same rail.
   Only the main column differs, which is what makes the overview read as the
   same place rather than a second site. */
function shell(o) {
  const chrome = chromeFrom(o.slug);
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(o.title) + ' · r-statistics.co</title>\n' +
    '<meta name="description" content="' + esc(o.desc.trim()) + '">\n' +
    /* These are the gateway now: the navbar and the roadmap index open them,
       so they are the indexable version and each one speaks for itself. The
       v1 pages stay live and point their canonical here. */
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="canonical" href="https://r-statistics.co' + o.canon + '">\n' +
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
    chrome.navcss + chrome.ga + '\n' +
    '</head>\n<body data-page="rmx" data-role="' + o.trackKey + '">\n' +
    chrome.nav + '\n' +
    '<div class="rmx">\n' +
    '<aside class="rmx-rail">\n' + o.rail + '\n</aside>\n' +
    '<main class="rmx-main">\n' + o.main + '\n</main>\n</div>\n' +
    offerDialog() + '\n' +
    (chrome.foot || '') + '\n' +
    chrome.scripts.join('\n') + '\n' +
    /* Only the track page carries the Pro panel, and only the panel needs a
       checkout. The overview page does not get this script. */
    (o.buy ? '<script defer src="/www/checkout.js?v=2"></script>\n' : '') +
    '<script defer src="/www/roadmap-fanout.js?v=' + JS_V + '"></script>\n' +
    chrome.cf + '\n' +
    '</body>\n</html>\n';
}

/* The rail is identical on both pages, so a reader keeps their place in the
   curriculum when they move between them. The overview link sits above the
   curriculum, where a contents link belongs. */
function rail(trackKey, onOverview) {
  const slug = SLUG[trackKey];
  const L = level(trackKey);
  const meta = (RM.TRACK_META || {})[trackKey] || {};
  const secs = (RM2.sections || {})[trackKey] || [];
  const bySec = lessonsBySection(trackKey);
  const role = meta.role || L.persona || slug;

  /* Only the legend. The lesson count and the time estimate were stating the
     obvious twice: the curriculum is right underneath with every lesson in
     it, and the overview's standfirst carries the counts for anyone who wants
     the number. The legend stays because the star needs explaining once. */
  const facts = '<li class="leg">' + ICON_STAR + 'marks a Pro lesson</li>';

  return '<a class="rmx-back" href="/roadmap/">' + ICON_BACK + 'All tracks</a>\n' +
    '<div class="rmx-key"><h1>' + esc(role) + '</h1>' +
    (L.cert ? '<span class="rmx-cert">' + esc(L.cert) + '</span>' : '') +
    '<ul class="rmx-facts">' + facts + '</ul></div>\n' +
    '<a class="rmx-ovlink" href="/roadmap/v2/' + slug + '-overview.html"' +
    (onOverview ? ' aria-current="page"' : '') + '>' + ICON_LIST + 'Course overview</a>\n' +
    '<h2 class="rmx-currhead">Curriculum</h2>\n' +
    railCurriculum(secs, bySec, onOverview ? slug : null);
}

// ------------------------------------------------------- the track page ----

function page(trackKey) {
  const slug = SLUG[trackKey];
  const L = level(trackKey);
  const meta = (RM.TRACK_META || {})[trackKey] || {};
  const bySec = lessonsBySection(trackKey);
  const open = openingLesson(bySec);
  const role = meta.role || L.persona || slug;

  /* The real lesson, in the page. Emitted as markup rather than mounted by
     script so it is there without JavaScript, and same-origin so the page can
     dress the frame and gate the first run. No bar above it: the lesson names
     itself in its own breadcrumb and the rail highlights the row. */
  /* The player starts covered, in one of two states the script resolves from
     who is asking. Signed out, a free lesson shows a play button and the
     lesson is not loaded at all until they are back from signing in; a Pro
     lesson shows a lock and no play button, and is never loaded for somebody
     who cannot open it. Nothing of the lesson is behind the cover in either
     case the real lesson is behind it: readable under a light wash when they
     are signed out, blurred under the lock when it is a Pro one. A Pro
     lesson's own page is public and serves two steps before its gate, so
     nothing here is shown that was not already open.
     Without JavaScript the play button is an ordinary link to the lesson. */
  const player = open
    ? '<div class="rmx-playwrap" data-rmx-player data-state="signin"' +
      ' data-lesson-href="/' + esc(open.slug) + '.html"' +
      ' data-lesson-title="' + esc(open.title) + '">' +
      '<div class="rmx-cover">' +
        '<div class="rmx-coverin">' +
          '<span class="rmx-lock" aria-hidden="true">' + ICON_LOCK + '</span>' +
          '<a class="rmx-play" data-rmx-play href="/' + esc(open.slug) + '.html" ' +
          'aria-label="Start this lesson">' + ICON_PLAY + '</a>' +
          '<p class="rmx-covertitle" data-rmx-covertitle>' + esc(open.title) + '</p>' +
          '<p class="rmx-covernote" data-rmx-covernote>Sign in to run this lesson in the page.</p>' +
        '</div>' +
      '</div>' +
      '</div>'
    /* No lessons built yet: say so and point at the plan, rather than leaving
       a page with a breadcrumb on it and nothing else. */
    : '<div class="rmx-soon">' +
      '<h2>This track is being written</h2>' +
      '<p>The curriculum is planned and published in full. Lessons are being ' +
      'built section by section, and the first lesson of every section will be ' +
      'free to run.</p>' +
      '<a class="rmx-buy" href="/roadmap/v2/' + esc(slug) + '-overview.html">' +
      'See the plan &rarr;</a></div>';

  const main =
    '<nav class="rmx-crumb"><a href="/">Home</a><span>/</span><a href="/roadmap/">Tracks</a>' +
    '<span>/</span><span>' + esc(role) + '</span></nav>\n' +
    player + '\n' +
    proPanel(L, trackChips());

  return shell({
    trackKey, slug, rail: rail(trackKey, false), main,
    /* This page has the Pro panel, which sells the quarterly plan and so has
       to be able to open a checkout. */
    buy: true,
    canon: '/roadmap/v2/' + slug + '.html',
    title: role + ' track, lesson by lesson',
    desc: 'Every lesson in the ' + role + ' track, which are free, and what Pro opens. ' +
      (L.become ? L.become.slice(0, 110) : ''),
  });
}

// ---------------------------------------------------- the overview page ----

/* The whole curriculum on one page, every section open, built to the
   reference: a progress strip, the track, a jump grid of the sections, then
   each section with its lessons in full. A star marks a Pro lesson and
   nothing marks a free one, the same convention as the rail.

   Lesson rows point back at the track page with the lesson in the hash, so a
   click opens it in the player rather than leaving for the bare lesson page.
   That keeps the rail, the plan box and the gate all in play. */
function overviewPage(trackKey) {
  const slug = SLUG[trackKey];
  const L = level(trackKey);
  const meta = (RM.TRACK_META || {})[trackKey] || {};
  const secs = (RM2.sections || {})[trackKey] || [];
  const bySec = lessonsBySection(trackKey);
  const open = openingLesson(bySec);
  const role = meta.role || L.persona || slug;
  const track = '/roadmap/v2/' + slug + '.html';

  const strip = open
    ? '<section class="ov-strip">' + ICON_CHART +
      '<p><b>Track your progress.</b> <a href="/signin.html">Sign in</a>' +
      ', or start with <a href="' + track + '#' + esc(open.slug) + '">' +
      esc(open.title) + '</a></p></section>'
    /* Nothing to start yet. Say that, rather than inviting somebody to sign in
       for a track with no lessons in it. */
    : '<section class="ov-strip">' + ICON_CHART +
      '<p><b>This track is being written.</b> The curriculum below is the plan ' +
      'it is being built to.</p></section>';

  const withLessons = secs.filter((s) => (bySec[s.n] || []).length);
  /* Every section, built or not. A track with nothing built yet still has its
     curriculum written, and showing it beats showing an empty page. */
  const shown = withLessons.length ? withLessons : secs;

  const jump = shown.map((s) => {
    const n = (bySec[s.n] || []).length;
    return '<a href="#s' + pad2(s.n) + '"><span class="n">' + pad2(s.n) + '</span>' +
      '<span class="t"><b>' + esc(s.title) + '</b>' +
      '<em>' + (n ? n + (n === 1 ? ' lesson' : ' lessons') : 'in the plan') + '</em></span>' +
      '<span class="ar">' + ICON_ARROW + '</span></a>';
  }).join('');

  const sections = shown.map((s) => {
    const ls = bySec[s.n] || [];
    const freeN = ls.filter((l) => !l.pro).length;
    const rows = ls.map((l, i) =>
      '<a class="ov-row ' + (l.pro ? 'is-pro' : 'is-free') + '" ' +
      'href="' + track + '#' + esc(l.slug) + '">' +
      '<span class="g">' + (l.pro ? ICON_STAR : '') + '</span>' +
      '<span class="num">' + pad2(s.n) + '.' + pad2(i + 1) + '</span>' +
      '<span class="t">' + esc(l.title) +
      (l.subtitle ? '<small>' + esc(l.subtitle) + '</small>' : '') + '</span>' +
      '<span class="a">' + (l.pro ? ICON_STAR + 'Pro' : 'Free') + '</span></a>'
    ).join('');

    /* Nothing built: the concepts, said plainly as a plan. Not dressed up as
       a lesson list, because a reader who starts a track and finds nothing
       there is worse off than one who was told. */
    const body = ls.length
      ? '<div class="ov-rows">' + rows + '</div>'
      : '<div class="ov-rows"><div class="ov-planned">' +
        esc((s.items || []).join(' \u00b7 ')) + '</div></div>';

    return '<section class="ov-sec" id="s' + pad2(s.n) + '">' +
      '<div class="ov-sechead"><span class="n">' + pad2(s.n) + '</span>' +
      '<span class="t"><b>' + esc(s.title) + '</b>' +
      (s.outcome ? '<em>' + esc(s.outcome) + '</em>' : '') + '</span>' +
      '<span class="ct">' + (ls.length
        ? ls.length + (ls.length === 1 ? ' lesson' : ' lessons') + (freeN ? ', ' + freeN + ' free' : '')
        : 'in the plan') + '</span></div>' + body + '</section>';
  }).join('\n');

  const main =
    '<nav class="rmx-crumb"><a href="/">Home</a><span>/</span><a href="/roadmap/">Tracks</a>' +
    '<span>/</span><a href="' + track + '">' + esc(role) + '</a>' +
    '<span>/</span><span>Overview</span></nav>\n' +
    strip + '\n' +
    /* The counts sit in the standfirst rather than in a strip of their own,
       which is how the reference states them, and it puts the size of the
       track and how much of it is open in the first thing anybody reads. */
    /* What the track leaves you able to do, not how many files it is made of.
       The counts said nothing a reader wants at this moment and the page
       answers them anyway: the grid below gives a count per section and every
       section header says how many of its lessons are free. */
    '<div class="ov-headrow"><header class="ov-head"><h1>' + esc(role) + '</h1><p>' +
    (L.become ? esc(L.become) + ' ' : '') +
    (L.arrive ? '<b>Finish it and ' + esc(lower1(L.arrive)) + '</b>' : '') +
    '</p></header>' + cover(trackKey, role) + '</div>\n' +
    '<div class="ov-struct"><span class="ov-lab">Curriculum structure</span>' +
    '<div class="ov-grid">' + jump + '</div></div>\n' +
    '<div class="ov-div"><span>Full curriculum</span></div>\n' +
    sections;

  return shell({
    trackKey, slug, rail: rail(trackKey, true), main,
    canon: '/roadmap/v2/' + slug + '-overview.html',
    title: role + ' course overview',
    desc: 'The whole ' + role + ' curriculum on one page: every section, every lesson, ' +
      'and which of them are free.',
  });
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
  fs.writeFileSync(path.join(outDir, SLUG[key] + '.html'), page(key), 'utf8');
  fs.writeFileSync(path.join(outDir, SLUG[key] + '-overview.html'), overviewPage(key), 'utf8');
  const bySec = lessonsBySection(key);
  const all = Object.keys(bySec).reduce((a, k) => a.concat(bySec[k]), []);
  console.log('  wrote roadmap/v2/' + SLUG[key] + '.html  ' +
    all.length + ' lessons, ' + all.filter((l) => !l.pro).length + ' free');
  n++;
});
console.log('done: ' + n + ' page(s)');

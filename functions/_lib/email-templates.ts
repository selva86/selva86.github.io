// Lifecycle email templates. Bodies are the copy SSOT verbatim:
// Plans/01_email_and_nurture/email-copy-book.md - edit copy THERE first, then
// mirror here.
//
// Voice pass v2 (2026-08-13, owner feedback): these render as PLAIN PERSONAL
// NOTES, not marketing mail. No card chrome, no logo header, no button - a
// short note from a person (Akshay) with inline links, exactly what a human
// would send from their mail client. That is both the voice fix and the
// Gmail-Promotions fix: buttons, benefit bullets, and branded shells are what
// the tab classifier keys on. The styled emailShell stays in use for receipts
// and fulfilment only.
//
// Token rule (P3): a line whose data is missing is DROPPED, never faked.

export type EmailCategory = "account" | "progress" | "nurture" | "offers";

// The person these emails come from. The mailbox akshay@r-statistics.co must
// exist (Cloudflare Email Routing rule) BEFORE flag:email-live flips, or replies bounce.
export const SENDER = { email: "akshay@r-statistics.co", name: "Akshay from r-statistics.co" };
export const REPLY_TO = { email: "akshay@r-statistics.co", name: "Akshay" };

export interface RenderedEmail {
  subject: string;
  preheader: string;
  text: string;
  html: string;
  category: EmailCategory;
  reason: string; // footer transparency line, without the prefix
}

export interface TemplateData {
  first_name?: string | null;
  pass_end_date?: string;      // "Sep 8"
  hub_url?: string;            // taster hub (1a)
  hub_name?: string;
  course_title?: string;       // 1b
  next_lesson_url?: string;    // falls back to the DA roadmap
  reset_date?: string;         // cap-hit
  unsubscribe_url?: string;    // one-click, HMAC-signed
  // Per-recipient tracking context (brain fills it): the same HMAC signature
  // as the unsubscribe link. When present, the HTML body gets the open pixel
  // and every link routes through /api/email/click so opens/clicks attribute
  // to the exact email_key. Text bodies keep direct links.
  track?: { uid: string; sig: string; key: string };
}

const SITE = "https://r-statistics.co";
const PREFS_URL = `${SITE}/account.html#emails`;

function utm(url: string, key: string): string {
  const abs = url.startsWith("http") ? url : SITE + (url.startsWith("/") ? url : "/" + url);
  return `${abs}${abs.includes("?") ? "&" : "?"}utm_source=email&utm_campaign=${encodeURIComponent(key)}`;
}

function hi(d: TemplateData): string {
  const n = (d.first_name || "").trim().split(/\s+/)[0];
  return n ? `Hi ${n},` : "Hi,";
}

function trackUrl(d: TemplateData, url: string): string {
  if (!d.track) return url;
  const abs = url.startsWith("http") ? url : SITE + (url.startsWith("/") ? url : "/" + url);
  return `${SITE}/api/email/click?u=${encodeURIComponent(d.track.uid)}&k=${encodeURIComponent(d.track.key)}&t=${d.track.sig}&to=${encodeURIComponent(abs)}`;
}

function openPixel(d: TemplateData): string {
  if (!d.track) return "";
  return `<img src="${SITE}/api/email/open?u=${encodeURIComponent(d.track.uid)}&k=${encodeURIComponent(d.track.key)}&t=${d.track.sig}" width="1" height="1" alt="" style="display:block;border:0">`;
}

// Text footer. Account emails carry no unsubscribe (they are the service);
// everything else gets reason + preferences + one-click unsubscribe.
function footerText(category: EmailCategory, reason: string, d: TemplateData): string {
  if (category === "account") return "";
  const unsub = d.unsubscribe_url ? ` | Unsubscribe: ${d.unsubscribe_url}` : "";
  return `\n\n--\nYou get this because ${reason}.\nEmail preferences: ${PREFS_URL}${unsub}`;
}

function footerHtml(category: EmailCategory, reason: string, d: TemplateData): string {
  if (category === "account") return "";
  const unsub = d.unsubscribe_url
    ? ` &middot; <a href="${d.unsubscribe_url}" style="color:#8a8f98">Unsubscribe</a>`
    : "";
  return `<p style="margin:28px 0 0;font-size:12px;color:#8a8f98">You get this because ${reason}.<br>` +
    `<a href="${PREFS_URL}" style="color:#8a8f98">Email preferences</a>${unsub}</p>`;
}

// The plain personal-note wrapper. Deliberately looks like a human email:
// default-ish font stack, no card, no header, links inline, nothing branded.
function personalShell(preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<div style="max-width:560px;padding:8px 16px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1d23">
${contentHtml}
</div>
</body></html>`;
}

function toHtmlParas(text: string, d: TemplateData): string {
  // Plain paragraphs; a [label -> url] line becomes a plain inline link.
  return text.split(/\n\n+/).map((p) => {
    const m = p.match(/^\[(.+?) -> (.+?)\]$/);
    if (m) return `<p style="margin:0 0 16px"><a href="${trackUrl(d, m[2])}" style="color:#2056d2">${m[1]}</a></p>`;
    return `<p style="margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

export function renderPersonalNote(args: {
  key: string; category: EmailCategory; reason: string;
  subject: string; preheader: string; body: string; data: TemplateData;
}): RenderedEmail {
  return assemble(args);
}

function assemble(args: {
  key: string; category: EmailCategory; reason: string;
  subject: string; preheader: string; body: string; data: TemplateData;
}): RenderedEmail {
  const text = args.body + footerText(args.category, args.reason, args.data);
  const html = personalShell(
    args.preheader,
    toHtmlParas(args.body, args.data) + footerHtml(args.category, args.reason, args.data) + openPixel(args.data),
  );
  return { subject: args.subject, preheader: args.preheader, text, html, category: args.category, reason: args.reason };
}

// ---------------------------------------------------------------- welcomes

function welcomeExercise(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const hub = utm(d.hub_url || "/exercises/", key);
  const passLine = d.pass_end_date
    ? `You've also got the full Data Analyst track free until ${d.pass_end_date}. Thirty days of interactive lessons, from wrangling messy data to building reports. If you're even half-serious about R, that's the thing I'd point you at.`
    : `You've also got the full Data Analyst track free for your first 30 days. If you're even half-serious about R, that's the thing I'd point you at.`;
  const body =
`${hi(d)}

Nice one. That solve you just made is safely on your profile, XP and all, and your streak started today.

Since you're new, two things worth knowing.

You get 25 graded exercises a month on the free plan, and any hub you start stays open until the month ends, so you can always finish what you began.

${passLine}

[Keep practicing where you left off -> ${hub}]

Everything else, the New to R course and all 1,300+ tutorials, is free forever. No clock on those.

Stuck or confused about anything? Just hit reply. I actually read these.

Akshay`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Your first solve is saved",
    preheader: "The XP is on your profile. A couple of things worth knowing.",
    body, data: d,
  });
}

function welcomeLesson(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const courseLine = d.course_title
    ? `${d.course_title} is open again and your place is saved, so you can carry on right where the wall stopped you.`
    : `The lesson you were reading is open again and your place is saved.`;
  const body =
`${hi(d)}

You're in. ${courseLine}

[Continue the lesson -> ${next}]

One thing worth knowing: your account comes with the full Data Analyst track, free until ${d.pass_end_date || "the end of your first 30 days"}. Whatever you finish in those 30 days stays finished, along with the XP and streak you build up.

The New to R course and all the tutorials don't have a clock. Those are free, period.

If anything's confusing, just reply and ask. Happy to help.

Akshay`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Pick up where you left off",
    preheader: "Your lesson is open again, and your place is saved.",
    body, data: d,
  });
}

function welcomeBrowsing(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const start = utm("/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Welcome aboard. Quick lay of the land, then I'll get out of your way.

The New to R course and all 1,300+ tutorials are free forever. Practice gives you 25 graded exercises a month, with instant feedback right in the browser.

And for your first 30 days, the full Data Analyst track is open to you free, until ${d.pass_end_date || "the end of your first 30 days"}. Lessons, quizzes, the certificate path, all of it.

If you're brand new to R, start with New to R. If you already write a bit of code, jump straight into the track:

[Start the Data Analyst track -> ${start}]

Wherever you get stuck, hit reply. A person answers, not a bot.

Akshay`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Welcome, and where to start",
    preheader: "What's free, what's open for your first 30 days, and one good starting point.",
    body, data: d,
  });
}

// ---------------------------------------------------------------- pass arc

function pass23(d: TemplateData): RenderedEmail {
  const key = "pass-23";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const end = d.pass_end_date || "soon";
  const body =
`${hi(d)}

Quick heads-up: one week left on your Data Analyst pass. Until ${end} the whole track is open to you.

After that it moves to Pro. What stays free: New to R, every tutorial, your XP and streak, and everything you've already finished. What doesn't: the remaining lessons and quizzes on the track.

If you've got momentum, this is the week to use it.

[Carry on with the track -> ${next}]

Akshay`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass ends this week",
    subject: `Your Data Analyst pass ends ${end}`,
    preheader: "One week left. What stays free after, and what does not.",
    body, data: d,
  });
}

function pass30(d: TemplateData): RenderedEmail {
  const key = "pass-30";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Last day of your pass. Tonight at midnight UTC the Data Analyst track moves to Pro for your account.

If you're mid-lesson, finish it tonight. It stays finished forever.

[Open the track -> ${next}]

Your XP, streak, and free practice aren't going anywhere either way.

Akshay`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass ends today",
    subject: "Last day of your Data Analyst pass",
    preheader: "The track closes tonight. Everything you finished stays.",
    body, data: d,
  });
}

function pass31(d: TemplateData): RenderedEmail {
  const key = "pass-31";
  const body =
`${hi(d)}

Your 30-day pass wrapped up yesterday. First, thanks for spending part of your month learning here. Genuinely.

Nothing you did is lost. Every lesson you finished, all your XP, your streak: still on your profile. The New to R course and all the tutorials stay free, and you still get 25 graded practice exercises every month.

If Pro ever makes sense for you down the road, you'll pick up exactly where you left off. Nothing resets.

And if there's something I can help with in the meantime, you know where the reply button is.

Akshay`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass just ended",
    subject: "Your pass ended, your progress didn't",
    preheader: "Everything you finished stays. Here is how things look from today.",
    body, data: d,
  });
}

// ---------------------------------------------------------------- cap hit

function capHit(d: TemplateData): RenderedEmail {
  const key = "cap";
  const pricing = utm("/pricing.html", key);
  const reset = d.reset_date || "the 1st";
  const body =
`${hi(d)}

You just used your 25th graded exercise this month. That's a serious month of practice. Most people never get close.

Nothing dramatic happens now: every hub you started stays open until ${reset}, lessons and tutorials aren't affected, and your streak and XP are safe. A fresh 25 lands on ${reset}.

If waiting sounds annoying, Pro removes the cap entirely:

[Have a look at Pro -> ${pricing}]

Either way, nice work this month.

Akshay`;
  return assemble({
    key, category: "progress", reason: "you used all 25 free exercises this month",
    subject: "All 25 for this month, done",
    preheader: `Your started hubs stay open. A fresh 25 lands on ${reset}.`,
    body, data: d,
  });
}

// ---------------------------------------------------------------- the flip

function flipAnnouncement(d: TemplateData): RenderedEmail {
  const key = "flip";
  const start = utm("/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Two changes to the free tier, live today. The short version:

Free practice now gives you 25 graded exercises a month. Any hub you start stays open until the month ends, so you won't get cut off mid-set. Lessons and tutorials aren't metered at all, and nothing you've already earned changes.

Second, and this one's the good news: the full Data Analyst track is open to you, free, for the next 30 days, until ${d.pass_end_date || "30 days from today"}. Whatever you finish stays finished, even after the window closes.

Why the change? Grading and hosting cost real money, and this keeps the free tier sustainable without touching what matters: New to R and all 1,300+ tutorials stay free forever.

Thirty days is enough to get real value out of that track. It's yours:

[Start the Data Analyst track -> ${start}]

Questions or objections, just reply. I answer every one.

Akshay`;
  return assemble({
    key, category: "account", reason: "you have an r-statistics.co account",
    subject: "Two changes to your r-statistics.co account",
    preheader: "Free practice gets a monthly allowance, and the Data Analyst track opens free for 30 days.",
    body, data: d,
  });
}

// ---------------------------------------------------------------- registry

export const TEMPLATES: Record<string, (d: TemplateData) => RenderedEmail> = {
  "welcome-exercise": welcomeExercise,
  "welcome-lesson": welcomeLesson,
  "welcome-browsing": welcomeBrowsing,
  "pass-23": pass23,
  "pass-30": pass30,
  "pass-31": pass31,
  "cap": capHit,
  "flip": flipAnnouncement,
};

export function renderEmail(key: string, data: TemplateData): RenderedEmail | null {
  const fn = TEMPLATES[key];
  return fn ? fn(data) : null;
}

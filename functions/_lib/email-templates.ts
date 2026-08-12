// Lifecycle email templates. Bodies are the copy SSOT verbatim:
// Plans/01_email_and_nurture/email-copy-book.md - edit copy THERE first, then
// mirror here. Every template returns subject/preheader/text/html plus its
// category (arbitration + consent) and the footer reason line (the
// transparency rule: the first footer line says exactly why this email sent).
//
// Token rule (P3): a line whose data is missing is DROPPED, never faked.
// Templates receive already-computed tokens; helpers here only assemble.

import { emailShell } from "./email";

export type EmailCategory = "account" | "progress" | "nurture" | "offers";

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
    ? ` &middot; <a href="${d.unsubscribe_url}" style="color:#6b7280">Unsubscribe</a>`
    : "";
  return `<p style="margin:24px 0 0;font-size:12px;color:#6b7280">You get this because ${reason}.<br>` +
    `<a href="${PREFS_URL}" style="color:#6b7280">Email preferences</a>${unsub}</p>`;
}

function toHtmlParas(text: string): string {
  // Plain paragraphs; [label -> url] becomes a link line.
  return text.split(/\n\n+/).map((p) => {
    const m = p.match(/^\[(.+?) -> (.+?)\]$/);
    if (m) return `<p style="margin:0 0 16px"><a href="${m[2]}" style="color:#2056d2;font-weight:600">${m[1]} &rarr;</a></p>`;
    return `<p style="margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function assemble(args: {
  key: string; category: EmailCategory; reason: string;
  subject: string; preheader: string; body: string; data: TemplateData;
  ctaUrl?: string; ctaLabel?: string;
}): RenderedEmail {
  const text = args.body + footerText(args.category, args.reason, args.data);
  const html = emailShell({
    preheader: args.preheader,
    contentHtml: toHtmlParas(args.body) + footerHtml(args.category, args.reason, args.data),
    ctaUrl: args.ctaUrl,
    ctaLabel: args.ctaLabel,
  });
  return { subject: args.subject, preheader: args.preheader, text, html, category: args.category, reason: args.reason };
}

// ---------------------------------------------------------------- welcomes

function welcomeExercise(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const hub = utm(d.hub_url || "/exercises/", key);
  const body =
`${hi(d)}

That solve you just made is on your profile now, with its XP. Your streak started today.

Two things your free account gives you, so you know what you have:

1. 25 graded exercises every month. Any practice hub you start stays open until the month ends, so you can always finish what you began.

2. The full Data Analyst track, free until ${d.pass_end_date || "the end of your first 30 days"}. That is 30 days of interactive lessons, from wrangling data to building reports. It is the fastest way we know to get job-ready in R.

[Continue practicing -> ${hub}]

The New to R course and every tutorial on the site stay free forever, no clock on those.

If anything is confusing, just reply. I read these.

Selva`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Your first solve is saved",
    preheader: "The XP is on your profile. Here is what else your account does.",
    body, data: d, ctaUrl: hub, ctaLabel: "Continue practicing",
  });
}

function welcomeLesson(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const courseLine = d.course_title
    ? `You stopped mid-way through ${d.course_title}. It is open now, and your place is saved.`
    : `The lesson you were reading is open now, and your place is saved.`;
  const body =
`${hi(d)}

${courseLine}

[Continue the lesson -> ${next}]

Your account also comes with the Data Analyst 30-day pass: the full track, free until ${d.pass_end_date || "the end of your first 30 days"}. Lessons you finish stay finished, and your XP and streak build as you go.

The New to R course and every tutorial stay free forever.

Questions? Reply to this email. I read every one.

Selva`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Pick up where you left off",
    preheader: "Your lesson is open, and the Data Analyst track is free for 30 days.",
    body, data: d, ctaUrl: next, ctaLabel: "Continue the lesson",
  });
}

function welcomeBrowsing(d: TemplateData): RenderedEmail {
  const key = "welcome";
  const start = utm("/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Welcome. Here is the short version of what you now have:

- 25 graded practice exercises a month, with instant feedback in the browser.
- The Data Analyst track, free until ${d.pass_end_date || "the end of your first 30 days"}. Interactive lessons, quizzes, and a certificate at the end.
- The New to R course and 1,300+ tutorials, free forever.

If you are new to R, start with New to R. If you already write some R, start the Data Analyst track and see how far you get in 30 days.

[Start learning -> ${start}]

Reply if you get stuck anywhere. I read these.

Selva`;
  return assemble({
    key, category: "account", reason: "you created an r-statistics.co account",
    subject: "Your r-statistics.co account, in 30 seconds",
    preheader: "What is free, what the 30-day pass covers, and where to start.",
    body, data: d, ctaUrl: start, ctaLabel: "Start learning",
  });
}

// ---------------------------------------------------------------- pass arc

function pass23(d: TemplateData): RenderedEmail {
  const key = "pass-23";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const end = d.pass_end_date || "soon";
  const body =
`${hi(d)}

One week left on your pass. Until ${end} the full Data Analyst track is open to you. After that, the track moves to Pro, and here is exactly what changes:

Stays free forever: the New to R course, every tutorial, your XP, your streak, and everything you already finished.

Needs Pro after ${end}: the remaining Data Analyst lessons and their quizzes.

If you have momentum, this is the week to use it.

[Continue the track -> ${next}]

Selva`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass ends this week",
    subject: `Your Data Analyst pass ends ${end}`,
    preheader: "One week left. What stays free after, and what does not.",
    body, data: d, ctaUrl: next, ctaLabel: "Continue the track",
  });
}

function pass30(d: TemplateData): RenderedEmail {
  const key = "pass-30";
  const next = utm(d.next_lesson_url || "/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Today is the last day of your pass. At midnight UTC the Data Analyst track moves to Pro for your account.

If you are mid-lesson, tonight is the time to finish it.

[Open the track -> ${next}]

Everything you finished stays on your profile, and your XP and streak keep building through the free practice exercises.

Selva`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass ends today",
    subject: "Last day of your Data Analyst pass",
    preheader: "The track closes tonight. Your progress stays.",
    body, data: d, ctaUrl: next, ctaLabel: "Open the track",
  });
}

function pass31(d: TemplateData): RenderedEmail {
  const key = "pass-31";
  const body =
`${hi(d)}

Your 30-day pass ended yesterday. Before anything else: thank you for spending part of your month learning here.

What you keep, free, forever:

- Everything you finished, and all your XP.
- The New to R course, end to end.
- 25 graded practice exercises a month.
- 1,300+ tutorials.

If you come back to Pro someday, your progress will be exactly where you left it. Reply anytime if I can help with something.

Selva`;
  return assemble({
    key, category: "offers", reason: "your Data Analyst pass just ended",
    subject: "What stays free on r-statistics.co",
    preheader: "Your pass ended. Here is everything that did not.",
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

You used all 25 graded exercises this month. That is a full month of practice, most people do not get close.

Until ${reset}:

- Every hub you started stays open, finish them anytime.
- Lessons and tutorials are not affected at all.
- Your streak and XP are safe.

A fresh 25 lands on ${reset}. If you do not want to wait, Pro removes the cap entirely:

[See Pro plans -> ${pricing}]

Selva`;
  return assemble({
    key, category: "progress", reason: "you used all 25 free exercises this month",
    subject: "All 25 for this month, done",
    preheader: `Your started hubs stay open. Fresh 25 on ${reset}.`,
    body, data: d, ctaUrl: pricing, ctaLabel: "See Pro plans",
  });
}

// ---------------------------------------------------------------- the flip

function flipAnnouncement(d: TemplateData): RenderedEmail {
  const key = "flip";
  const start = utm("/roadmap/data-analyst.html", key);
  const body =
`${hi(d)}

Two changes to how the free tier works, both live today.

1. Free practice is now 25 graded exercises a month. Any hub you start stays open until the month ends, so you will never be cut off in the middle of a set. Lessons and tutorials are not metered, and nothing you have already earned is affected.

2. The full Data Analyst track is open to you, free, for the next 30 days, until ${d.pass_end_date || "30 days from today"}. Interactive lessons, quizzes, the certificate path, all of it. After 30 days the track moves to Pro, but whatever you finish stays finished.

Why the change: grading and hosting cost real money, and this keeps the free tier sustainable while keeping New to R and all 1,300+ tutorials free forever.

If 30 days is enough to get value from the Data Analyst track, it is yours.

[Start the track -> ${start}]

Questions or objections, reply to this email. I answer.

Selva`;
  return assemble({
    key, category: "account", reason: "you have an r-statistics.co account",
    subject: "Two changes to your r-statistics.co account",
    preheader: "Free practice gets a monthly allowance. The Data Analyst track opens free for 30 days.",
    body, data: d, ctaUrl: start, ctaLabel: "Start the track",
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

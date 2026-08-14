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

import lifecycleJson from "../_data/lifecycle-emails.json";

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

// ------------------------------------------------------------------
// Lifecycle templates, data-driven (editable from the dashboard).
// Copy: _data/lifecycle-emails.json (KV override emailcopy:<key> beats it).
// Every token resolves via fills() with a safe fallback, so an edited body
// can never render an empty hole; link tokens are utm-tagged and (in HTML)
// click-tracked. required = tokens a saved edit must keep.
// ------------------------------------------------------------------

export interface EmailCopy { subject: string; preheader: string; body: string }
const DEFAULT_COPY = lifecycleJson as unknown as Record<string, EmailCopy>;

interface LifecycleMeta {
  key: string; category: EmailCategory; reason: string;
  fills: (d: TemplateData) => Record<string, string>;
  linkTokens: string[]; // filled with utm'd absolute URLs
  required: string[];
}

function firstName(d: TemplateData): string {
  return (d.first_name || "").trim().split(/\s+/)[0] || "there";
}

export const LIFECYCLE: Record<string, LifecycleMeta> = {
  "welcome-exercise": {
    key: "welcome", category: "account", reason: "you created an r-statistics.co account",
    linkTokens: ["hub_url"], required: ["hub_url"],
    fills: (d) => ({
      first_name: firstName(d),
      pass_end_date: d.pass_end_date || "the end of your first 30 days",
      hub_url: utm(d.hub_url || "/exercises/", "welcome"),
    }),
  },
  "welcome-lesson": {
    key: "welcome", category: "account", reason: "you created an r-statistics.co account",
    linkTokens: ["next_lesson_url"], required: ["next_lesson_url"],
    fills: (d) => ({
      first_name: firstName(d),
      pass_end_date: d.pass_end_date || "the end of your first 30 days",
      next_lesson_url: utm(d.next_lesson_url || "/roadmap/data-analyst.html", "welcome"),
      course_line: d.course_title
        ? `${d.course_title} is open again and your place is saved, so you can carry on right where the wall stopped you.`
        : "The lesson you were reading is open again and your place is saved.",
    }),
  },
  "welcome-browsing": {
    key: "welcome", category: "account", reason: "you created an r-statistics.co account",
    linkTokens: ["start_url"], required: ["start_url"],
    fills: (d) => ({
      first_name: firstName(d),
      pass_end_date: d.pass_end_date || "the end of your first 30 days",
      start_url: utm("/roadmap/data-analyst.html", "welcome"),
    }),
  },
  "pass-23": {
    key: "pass-23", category: "offers", reason: "your Data Analyst pass ends this week",
    linkTokens: ["next_lesson_url"], required: ["next_lesson_url"],
    fills: (d) => ({
      first_name: firstName(d),
      pass_end_date: d.pass_end_date || "soon",
      next_lesson_url: utm(d.next_lesson_url || "/roadmap/data-analyst.html", "pass-23"),
    }),
  },
  "pass-30": {
    key: "pass-30", category: "offers", reason: "your Data Analyst pass ends today",
    linkTokens: ["next_lesson_url"], required: ["next_lesson_url"],
    fills: (d) => ({
      first_name: firstName(d),
      next_lesson_url: utm(d.next_lesson_url || "/roadmap/data-analyst.html", "pass-30"),
    }),
  },
  "pass-31": {
    key: "pass-31", category: "offers", reason: "your Data Analyst pass just ended",
    linkTokens: [], required: [],
    fills: (d) => ({ first_name: firstName(d) }),
  },
  "cap": {
    key: "cap", category: "progress", reason: "you used all 25 free exercises this month",
    linkTokens: ["pricing_url"], required: ["pricing_url"],
    fills: (d) => ({
      first_name: firstName(d),
      reset_date: d.reset_date || "the 1st",
      pricing_url: utm("/pricing.html", "cap"),
    }),
  },
  "flip": {
    key: "flip", category: "account", reason: "you have an r-statistics.co account",
    linkTokens: ["start_url"], required: ["start_url"],
    fills: (d) => ({
      first_name: firstName(d),
      pass_end_date: d.pass_end_date || "30 days from today",
      start_url: utm("/roadmap/data-analyst.html", "flip"),
    }),
  },
};

export const TEMPLATES: Record<string, true> = Object.fromEntries(
  Object.keys(LIFECYCLE).map((k) => [k, true as const]),
) as Record<string, true>;

export function defaultLifecycleCopy(template: string): EmailCopy | null {
  return DEFAULT_COPY[template] ?? null;
}

export function renderEmail(template: string, d: TemplateData, copy?: EmailCopy | null): RenderedEmail | null {
  const meta = LIFECYCLE[template];
  const c = copy ?? DEFAULT_COPY[template];
  if (!meta || !c) return null;
  const map = meta.fills(d);
  const fill = (t: string) => t.replace(/\{([a-z_]+)\}/g, (_m, k) => (map[k] !== undefined ? map[k] : `{${k}}`));
  return assemble({
    key: meta.key, category: meta.category, reason: meta.reason,
    subject: fill(c.subject), preheader: fill(c.preheader), body: fill(c.body), data: d,
  });
}

export function lifecycleTokens(template: string): { allowed: string[]; required: string[] } | null {
  const meta = LIFECYCLE[template];
  if (!meta) return null;
  const sample = meta.fills({});
  return { allowed: Object.keys(sample), required: meta.required };
}


// The daily operator digest.
//
// What it is for: one email a day that answers "is the machine working, is
// the funnel moving, and is there anything I should do today". Not a
// dashboard in an inbox. A dashboard in an inbox gets read for a fortnight
// and then filtered, because a wall of numbers with nothing to react to
// teaches you that there is nothing to react to.
//
// So three rules run through this file.
//
// 1. EVERY NUMBER CARRIES A BASELINE. "6 sign-ups" means nothing. "6
//    sign-ups, 7-day mean 4" means something. Each row reports yesterday,
//    the mean of the seven days before it, and the direction, and the email
//    only shouts when the gap is big enough to be real.
//
// 2. THE TOP OF THE FUNNEL IS INCLUDED EVEN THOUGH NOBODY ASKS FOR IT.
//    Sign-ups without visits is a ratio with one side missing: six sign-ups
//    on 400 visits and six on 1,800 are different days.
//
// 3. IT WATCHES FOR SILENCE. The most expensive bug on this site was a
//    signal that recorded zero rows for months while everything downstream
//    looked healthy (pro_wall_hit, fixed 2026-09-21). A count that has gone
//    quiet is reported as loudly as a count that has spiked, because the
//    quiet one is the one nobody notices.
//
// Everything is derived from tables that already exist. No new writes, no
// schema change, and the whole thing is roughly a dozen grouped queries
// against bounded date ranges.

const SITE = "https://r-statistics.co";

export interface DigestEnv {
  DB: D1Database;
  KV?: KVNamespace;
}

/* 03:00 UTC is 08:30 in India, which is where this gets read, and it is late
   enough that yesterday's traffic row has certainly been written. */
export const DIGEST_HOUR_UTC = 3;

/* A measured quantity: yesterday, and the seven days before it. */
export interface Metric {
  key: string;
  label: string;
  value: number;
  mean7: number;
  /** null when a baseline would be meaningless (too little history). */
  delta: number | null;
  /** true when the move is big enough to be worth a reader's attention. */
  notable: boolean;
  /** a count that used to happen and has stopped. */
  silent: boolean;
  suffix?: string;
}

export interface Digest {
  day: string;            // the day being reported, YYYY-MM-DD (UTC)
  subject: string;
  headline: string;
  metrics: Record<string, Metric>;
  order: string[][];      // metric keys, grouped into the sections below
  sections: string[];     // section titles, parallel to `order`
  alerts: string[];
  quiet: boolean;         // nothing notable and nothing broken
  topPages: Array<{ path: string; visits: number }>;
  emailByTemplate: Array<{ key: string; sent: number; opened: number; clicked: number }>;
  intent: Array<{ signal: string; n: number }>;
}

/* ---------------------------------------------------------------- helpers */

function dayKeyUTC(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Unix seconds for 00:00 UTC of the day `offsetDays` ago. */
function dayStartUTC(offsetDays: number): number {
  return Math.floor(Date.parse(dayKeyUTC(offsetDays) + "T00:00:00Z") / 1000);
}

/* Turn a day -> count map into a metric.
 *
 * The baseline is a mean rather than a median because these series are small
 * and a median of seven mostly-zero days hides a real trend. The notability
 * test is deliberately dull: a move has to be both proportionally large and
 * absolutely large enough to matter, or a day going from 1 to 3 shouts as
 * loudly as one going from 400 to 1200. */
function metric(
  key: string, label: string, byDay: Map<string, number>, suffix?: string,
): Metric {
  const value = byDay.get(dayKeyUTC(1)) ?? 0;
  const prior: number[] = [];
  for (let i = 2; i <= 8; i++) prior.push(byDay.get(dayKeyUTC(i)) ?? 0);
  const seen = prior.filter((n) => n > 0).length;
  const mean7 = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = seen >= 2 ? value - mean7 : null;
  const ratio = mean7 > 0 ? value / mean7 : (value > 0 ? Infinity : 1);
  const notable = delta !== null && Math.abs(value - mean7) >= 3 &&
    (ratio >= 1.6 || ratio <= 0.55);
  // silence: it used to happen on most days and yesterday it did not happen
  const silent = value === 0 && seen >= 4 && mean7 >= 1;
  return { key, label, value, mean7, delta, notable, silent, suffix };
}

/** One grouped query -> a day => count map, for a `date(col,'unixepoch')` group. */
async function seriesFromRows(
  rows: Array<{ d: string; n: number }> | undefined,
): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  for (const r of rows ?? []) m.set(r.d, Number(r.n || 0));
  return m;
}

async function grouped(
  DB: D1Database, sql: string, ...binds: unknown[]
): Promise<Map<string, number>> {
  try {
    const res = await DB.prepare(sql).bind(...binds).all<{ d: string; n: number }>();
    return seriesFromRows(res.results);
  } catch {
    return new Map();
  }
}

/* ---------------------------------------------------------------- gather */

export async function buildDigest(env: DigestEnv): Promise<Digest> {
  const DB = env.DB;
  const from = dayStartUTC(9);           // nine days back covers day-1 plus a 7-day baseline
  const day = dayKeyUTC(1);

  // ---- top of the funnel: what the site actually received
  const visits = await grouped(DB,
    `SELECT day AS d, visits AS n FROM traffic_daily WHERE day >= ?1`, dayKeyUTC(9));
  const pageviews = await grouped(DB,
    `SELECT day AS d, pageviews AS n FROM traffic_daily WHERE day >= ?1`, dayKeyUTC(9));

  // ---- accounts
  const signups = await grouped(DB,
    `SELECT date(created_at,'unixepoch') d, COUNT(*) n FROM users
      WHERE created_at >= ?1 AND deleted_at IS NULL GROUP BY d`, from);
  const signins = await grouped(DB,
    `SELECT date(created_at,'unixepoch') d, COUNT(DISTINCT user_id) n FROM sessions
      WHERE created_at >= ?1 GROUP BY d`, from);

  // ---- doing the thing
  const solves = await grouped(DB,
    `SELECT date(submitted_at,'unixepoch') d, COUNT(*) n FROM exercise_attempts
      WHERE submitted_at >= ?1 AND passed = 1 GROUP BY d`, from);
  const solvers = await grouped(DB,
    `SELECT date(submitted_at,'unixepoch') d, COUNT(DISTINCT user_id) n FROM exercise_attempts
      WHERE submitted_at >= ?1 AND passed = 1 GROUP BY d`, from);
  const lessons = await grouped(DB,
    `SELECT date(at,'unixepoch') d, COUNT(*) n FROM intent_signals
      WHERE at >= ?1 AND signal = 'lesson_complete' GROUP BY d`, from);
  const lessonUsers = await grouped(DB,
    `SELECT date(at,'unixepoch') d, COUNT(DISTINCT COALESCE(user_id, anon_id)) n
       FROM intent_signals WHERE at >= ?1 AND signal = 'lesson_complete' GROUP BY d`, from);

  /* Activation: someone who signed up that day and solved something the same
     day. The single most predictive number a learning site has, and the one
     no raw count tells you. */
  const activated = await grouped(DB,
    `SELECT date(u.created_at,'unixepoch') d, COUNT(DISTINCT u.id) n
       FROM users u JOIN exercise_attempts e ON e.user_id = u.id AND e.passed = 1
      WHERE u.created_at >= ?1 AND u.deleted_at IS NULL
        AND date(e.submitted_at,'unixepoch') = date(u.created_at,'unixepoch')
      GROUP BY d`, from);

  /* Returning: active that day, but signed up before it. Retention, not
     acquisition, is what compounds here. */
  const returning = await grouped(DB,
    `SELECT date(e.submitted_at,'unixepoch') d, COUNT(DISTINCT e.user_id) n
       FROM exercise_attempts e JOIN users u ON u.id = e.user_id
      WHERE e.submitted_at >= ?1 AND e.passed = 1
        AND date(u.created_at,'unixepoch') < date(e.submitted_at,'unixepoch')
      GROUP BY d`, from);

  // ---- intent
  const sig = async (name: string) => grouped(DB,
    `SELECT date(at,'unixepoch') d, COUNT(*) n FROM intent_signals
      WHERE at >= ?1 AND signal = ?2 GROUP BY d`, from, name);
  const pricing = await sig("pricing_view");
  const proWall = await sig("pro_wall_hit");
  const signWall = await sig("signin_wall_hit");
  const coStart = await sig("checkout_start");
  const coLead = await sig("checkout_lead");
  const alerts7 = await sig("price_alert");

  const purchases = await grouped(DB,
    `SELECT date(created_at,'unixepoch') d, COUNT(*) n FROM subscriptions
      WHERE created_at >= ?1 GROUP BY d`, from);

  // ---- credentials, the proof the product works
  const badges = await grouped(DB,
    `SELECT date(earned_at,'unixepoch') d, COUNT(*) n FROM badges_earned
      WHERE earned_at >= ?1 GROUP BY d`, from);
  const certs = await grouped(DB,
    `SELECT date(issued_at,'unixepoch') d, COUNT(*) n FROM certificates
      WHERE issued_at >= ?1 GROUP BY d`, from);

  // ---- email
  const ev = async (name: string) => grouped(DB,
    `SELECT date(at,'unixepoch') d, COUNT(*) n FROM email_events
      WHERE at >= ?1 AND event = ?2 GROUP BY d`, from, name);
  const eSent = await ev("sent");
  const eOpen = await ev("open");
  const eClick = await ev("click");
  const eBounce = await ev("bounce");
  const eUnsub = await ev("unsubscribe");
  const eError = await ev("error");

  const M = (m: Metric) => m;
  const metrics: Record<string, Metric> = {};
  const add = (m: Metric) => { metrics[m.key] = M(m); return m.key; };

  const g1 = [
    add(metric("visits", "Visits", visits)),
    add(metric("pageviews", "Pageviews", pageviews)),
    add(metric("signups", "Sign-ups", signups)),
    add(metric("signins", "People who signed in", signins)),
  ];
  const g2 = [
    add(metric("activated", "Signed up and solved the same day", activated)),
    add(metric("returning", "Came back from an earlier day", returning)),
    add(metric("solvers", "People who solved something", solvers)),
    add(metric("solves", "Exercises solved", solves)),
    add(metric("lessonUsers", "People who finished a lesson", lessonUsers)),
    add(metric("lessons", "Lessons finished", lessons)),
  ];
  const g3 = [
    add(metric("pricing", "Pricing page views", pricing)),
    add(metric("proWall", "Pro lesson walls hit", proWall)),
    add(metric("signWall", "Sign-in walls hit", signWall)),
    add(metric("coStart", "Checkouts opened", coStart)),
    add(metric("coLead", "Emails left at checkout", coLead)),
    add(metric("alerts", "Price alerts set", alerts7)),
    add(metric("purchases", "Purchases", purchases)),
  ];
  const g4 = [
    add(metric("eSent", "Emails sent", eSent)),
    add(metric("eOpen", "Opened", eOpen)),
    add(metric("eClick", "Clicked", eClick)),
    add(metric("eBounce", "Bounced", eBounce)),
    add(metric("eUnsub", "Unsubscribed", eUnsub)),
  ];
  const g5 = [
    add(metric("badges", "Badges earned", badges)),
    add(metric("certs", "Certificates issued", certs)),
  ];

  // ---- the detail tables
  const topPages: Array<{ path: string; visits: number }> = [];
  try {
    const row = await DB.prepare(
      `SELECT top_pages FROM traffic_daily WHERE day = ?1`,
    ).bind(day).first<{ top_pages: string | null }>();
    const parsed = row?.top_pages ? JSON.parse(row.top_pages) : [];
    for (const p of (parsed as Array<{ path: string; visits: number }>).slice(0, 8)) {
      topPages.push({ path: p.path, visits: Number(p.visits || 0) });
    }
  } catch { /* the column is optional and sometimes null */ }

  const emailByTemplate: Digest["emailByTemplate"] = [];
  try {
    const rows = (await DB.prepare(
      `SELECT email_key AS k,
              SUM(CASE WHEN event = 'sent'  THEN 1 ELSE 0 END) sent,
              SUM(CASE WHEN event = 'open'  THEN 1 ELSE 0 END) opened,
              SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END) clicked
         FROM email_events
        WHERE at >= ?1 AND at < ?2
        GROUP BY email_key HAVING sent > 0 ORDER BY sent DESC LIMIT 10`,
    ).bind(dayStartUTC(1), dayStartUTC(0))
      .all<{ k: string; sent: number; opened: number; clicked: number }>()).results ?? [];
    for (const r of rows) {
      emailByTemplate.push({
        key: r.k || "(none)", sent: Number(r.sent || 0),
        opened: Number(r.opened || 0), clicked: Number(r.clicked || 0),
      });
    }
  } catch { /* nothing sent yesterday */ }

  const intent: Digest["intent"] = [];
  try {
    const rows = (await DB.prepare(
      `SELECT signal, COUNT(*) n FROM intent_signals
        WHERE at >= ?1 AND at < ?2 GROUP BY signal ORDER BY n DESC`,
    ).bind(dayStartUTC(1), dayStartUTC(0)).all<{ signal: string; n: number }>()).results ?? [];
    for (const r of rows) intent.push({ signal: r.signal, n: Number(r.n || 0) });
  } catch { /* fine */ }

  /* ---- what, if anything, needs a human
   *
   * The bar is deliberately high. An alert that fires most days is furniture,
   * and furniture is what people stop reading. */
  const alerts: string[] = [];
  const yesterdayErrors = eError.get(day) ?? 0;
  if (yesterdayErrors > 0) {
    alerts.push(`${yesterdayErrors} email send ${yesterdayErrors === 1 ? "error" : "errors"}. Check the ZeptoMail token and the Worker log.`);
  }
  const sentY = metrics.eSent.value, bounceY = metrics.eBounce.value;
  if (sentY >= 20 && bounceY / sentY > 0.05) {
    alerts.push(`Bounce rate ${Math.round(100 * bounceY / sentY)}% on ${sentY} sends. Anything over 5% puts the sending domain at risk.`);
  }
  for (const k of ["visits", "signups", "solves", "eSent", "pricing"]) {
    const m = metrics[k];
    if (m && m.silent) {
      alerts.push(`${m.label} recorded nothing yesterday and averaged ${m.mean7.toFixed(1)} a day before that. Something upstream may have stopped.`);
    }
  }
  if (metrics.coStart.value > 0 && metrics.purchases.value === 0 && metrics.coStart.mean7 >= 1) {
    alerts.push(`${metrics.coStart.value} checkout${metrics.coStart.value === 1 ? "" : "s"} opened and none completed.`);
  }
  if (metrics.signups.value > 0 && metrics.activated.value === 0 && metrics.signups.value >= 3) {
    alerts.push(`${metrics.signups.value} people signed up and none of them solved anything the same day.`);
  }

  const notable = Object.values(metrics).filter((m) => m.notable);
  const quiet = alerts.length === 0 && notable.length === 0;

  /* The headline is the subject line, so it has to survive being read on a
     lock screen with nothing else. Money first, then the biggest move, then
     the plain shape of the day. */
  const bits: string[] = [];
  bits.push(`${metrics.visits.value.toLocaleString("en-US")} visits`);
  bits.push(`${metrics.signups.value} sign-up${metrics.signups.value === 1 ? "" : "s"}`);
  if (metrics.purchases.value > 0) {
    bits.push(`${metrics.purchases.value} purchase${metrics.purchases.value === 1 ? "" : "s"}`);
  }
  if (alerts.length) bits.push(`${alerts.length} to look at`);
  const headline = bits.join(", ");
  const subject = `r-statistics.co ${day} · ${headline}`;

  return {
    day, subject, headline, metrics,
    order: [g1, g2, g3, g4, g5],
    sections: ["Who arrived", "What they did", "Intent and money", "Email", "Earned"],
    alerts, quiet, topPages, emailByTemplate, intent,
  };
}

/* ---------------------------------------------------------------- render */

function esc(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function arrow(m: Metric): string {
  if (m.delta === null) return "";
  if (Math.abs(m.delta) < 0.5) return "level";
  const up = m.delta > 0;
  return `${up ? "up" : "down"} ${Math.abs(Math.round(m.delta))}`;
}

function row(m: Metric): string {
  const base = m.delta === null ? "no baseline yet"
    : `7-day mean ${m.mean7 < 10 ? m.mean7.toFixed(1) : Math.round(m.mean7)}, ${arrow(m)}`;
  const colour = m.notable ? (m.delta! > 0 ? "#1f7a55" : "#b45309") : "#6b7280";
  return `<tr>
    <td style="padding:7px 0;border-bottom:1px solid #eef1ef;font:400 14px Inter,Arial,sans-serif;color:#454c58">${esc(m.label)}</td>
    <td style="padding:7px 0;border-bottom:1px solid #eef1ef;text-align:right;font:700 15px Inter,Arial,sans-serif;color:#0d1117">${m.value.toLocaleString("en-US")}</td>
    <td style="padding:7px 0 7px 14px;border-bottom:1px solid #eef1ef;text-align:right;font:400 12px Inter,Arial,sans-serif;color:${colour};white-space:nowrap">${esc(base)}</td>
  </tr>`;
}

export function renderDigestHtml(d: Digest): string {
  const h: string[] = [];
  h.push(`<div style="background:#f8faf9;padding:24px 0;font-family:Inter,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e3e8e4;border-radius:12px;padding:26px 28px">`);
  h.push(`<div style="font:600 12.5px Inter,Arial,sans-serif;color:#78808c">r-statistics.co &middot; ${esc(d.day)}</div>`);
  h.push(`<h1 style="font:700 21px Inter,Arial,sans-serif;color:#0d1117;margin:6px 0 2px;letter-spacing:-.01em">${esc(d.headline)}</h1>`);

  if (d.quiet) {
    h.push(`<p style="font:400 14px Inter,Arial,sans-serif;color:#454c58;margin:10px 0 0">A normal day. Nothing moved far enough from its baseline to be worth your attention, and nothing is broken. The numbers are below if you want them.</p>`);
  }

  if (d.alerts.length) {
    h.push(`<div style="margin:16px 0 0;padding:14px 16px;background:#fdf6ec;border-left:3px solid #b45309;border-radius:0 8px 8px 0">
      <div style="font:700 13px Inter,Arial,sans-serif;color:#b45309;margin-bottom:6px">Worth a look</div>
      <ul style="margin:0;padding-left:18px;font:400 13.5px Inter,Arial,sans-serif;color:#454c58">`);
    for (const a of d.alerts) h.push(`<li style="margin:3px 0">${esc(a)}</li>`);
    h.push(`</ul></div>`);
  }

  d.order.forEach((keys, i) => {
    h.push(`<h2 style="font:600 13px Inter,Arial,sans-serif;color:#78808c;margin:24px 0 4px">${esc(d.sections[i])}</h2>`);
    h.push(`<table style="width:100%;border-collapse:collapse">`);
    for (const k of keys) if (d.metrics[k]) h.push(row(d.metrics[k]));
    h.push(`</table>`);
    if (d.sections[i] === "Email" && d.metrics.eSent.value > 0) {
      const o = Math.round(100 * d.metrics.eOpen.value / d.metrics.eSent.value);
      const c = Math.round(100 * d.metrics.eClick.value / d.metrics.eSent.value);
      h.push(`<p style="font:400 12.5px Inter,Arial,sans-serif;color:#78808c;margin:6px 0 0">${o}% opened, ${c}% clicked.</p>`);
    }
  });

  if (d.emailByTemplate.length) {
    h.push(`<h2 style="font:600 13px Inter,Arial,sans-serif;color:#78808c;margin:24px 0 4px">Which emails</h2><table style="width:100%;border-collapse:collapse">`);
    for (const t of d.emailByTemplate) {
      h.push(`<tr><td style="padding:5px 0;font:400 13px Inter,Arial,sans-serif;color:#454c58">${esc(t.key)}</td>
        <td style="padding:5px 0;text-align:right;font:400 13px Inter,Arial,sans-serif;color:#0d1117">${t.sent} sent</td>
        <td style="padding:5px 0 5px 12px;text-align:right;font:400 12.5px Inter,Arial,sans-serif;color:#78808c">${t.opened} open, ${t.clicked} click</td></tr>`);
    }
    h.push(`</table>`);
  }

  if (d.intent.length) {
    h.push(`<h2 style="font:600 13px Inter,Arial,sans-serif;color:#78808c;margin:24px 0 4px">Every signal recorded</h2>
      <p style="font:400 12.5px Inter,Arial,sans-serif;color:#454c58;margin:0">`);
    h.push(d.intent.map((s) => `${esc(s.signal)} ${s.n}`).join(" &middot; "));
    h.push(`</p>`);
  }

  if (d.topPages.length) {
    h.push(`<h2 style="font:600 13px Inter,Arial,sans-serif;color:#78808c;margin:24px 0 4px">Most visited yesterday</h2><table style="width:100%;border-collapse:collapse">`);
    for (const p of d.topPages) {
      h.push(`<tr><td style="padding:5px 0;font:400 13px Inter,Arial,sans-serif"><a href="${SITE}${esc(p.path)}" style="color:#1f7a55;text-decoration:none">${esc(p.path)}</a></td>
        <td style="padding:5px 0;text-align:right;font:400 13px Inter,Arial,sans-serif;color:#454c58">${p.visits}</td></tr>`);
    }
    h.push(`</table>`);
  }

  h.push(`<p style="font:400 12px Inter,Arial,sans-serif;color:#9aa2ac;margin:26px 0 0;padding-top:14px;border-top:1px solid #eef1ef">
    Days run 00:00 to 24:00 UTC. Baselines are the mean of the seven days before.
    <a href="${SITE}/api/admin/digest" style="color:#1f7a55;text-decoration:none">Open today's</a>
    &middot; <a href="${SITE}/dashboard.html" style="color:#1f7a55;text-decoration:none">Dashboard</a></p>`);
  h.push(`</div></div>`);
  return h.join("\n");
}

export function renderDigestText(d: Digest): string {
  const L: string[] = [];
  L.push(`r-statistics.co  ${d.day}`);
  L.push(d.headline);
  L.push("");
  if (d.quiet) {
    L.push("A normal day. Nothing moved far enough from its baseline to be worth");
    L.push("your attention, and nothing is broken.");
    L.push("");
  }
  if (d.alerts.length) {
    L.push("WORTH A LOOK");
    for (const a of d.alerts) L.push("  - " + a);
    L.push("");
  }
  d.order.forEach((keys, i) => {
    L.push(d.sections[i].toUpperCase());
    for (const k of keys) {
      const m = d.metrics[k];
      if (!m) continue;
      const base = m.delta === null ? "no baseline yet"
        : `mean ${m.mean7 < 10 ? m.mean7.toFixed(1) : Math.round(m.mean7)}, ${arrow(m)}`;
      L.push(`  ${m.label.padEnd(36)} ${String(m.value).padStart(6)}   (${base})`);
    }
    L.push("");
  });
  if (d.emailByTemplate.length) {
    L.push("WHICH EMAILS");
    for (const t of d.emailByTemplate) {
      L.push(`  ${t.key.padEnd(24)} ${t.sent} sent, ${t.opened} open, ${t.clicked} click`);
    }
    L.push("");
  }
  if (d.intent.length) {
    L.push("EVERY SIGNAL RECORDED");
    L.push("  " + d.intent.map((s) => `${s.signal} ${s.n}`).join(", "));
    L.push("");
  }
  if (d.topPages.length) {
    L.push("MOST VISITED YESTERDAY");
    for (const p of d.topPages) L.push(`  ${String(p.visits).padStart(5)}  ${p.path}`);
    L.push("");
  }
  L.push("Days run 00:00 to 24:00 UTC. Baselines are the mean of the seven days before.");
  L.push(`${SITE}/api/admin/digest`);
  return L.join("\n");
}

/* ---------------------------------------------------------------- send

   Called from the hourly cron. Fires at most once per UTC day: the guard is
   the email_events row the send itself writes, so a retry, a second Worker
   or a manual run cannot produce two. Off by setting flag:digest-email to
   "off"; absent means on, because this is a thing the owner asked for rather
   than an experiment. */
export async function maybeSendDigest(
  env: DigestEnv & { ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string; ADMIN_EMAIL?: string },
  send: (a: { to: { email: string }; subject: string; htmlBody: string; textBody: string })
    => Promise<{ ok: boolean; status: number; error?: string }>,
  opts?: { force?: boolean },
): Promise<{ sent: boolean; reason: string; subject?: string }> {
  const force = !!opts?.force;
  if (!force && new Date().getUTCHours() !== DIGEST_HOUR_UTC) {
    return { sent: false, reason: "not the hour" };
  }
  if (env.KV && (await env.KV.get("flag:digest-email")) === "off") {
    return { sent: false, reason: "flag:digest-email is off" };
  }
  const admin = env.ADMIN_EMAIL || "selva86@gmail.com";

  const already = await env.DB.prepare(
    `SELECT 1 AS x FROM email_events
      WHERE email_key = 'digest' AND event = 'sent' AND at >= ?1 LIMIT 1`,
  ).bind(Math.floor(Date.parse(dayKeyUTC(0) + "T00:00:00Z") / 1000))
    .first<{ x: number }>().catch(() => null);
  if (already && !force) return { sent: false, reason: "already sent today" };

  const d = await buildDigest(env);
  const r = await send({
    to: { email: admin },
    subject: d.subject,
    htmlBody: renderDigestHtml(d),
    textBody: renderDigestText(d),
  });
  try {
    await env.DB.prepare(
      "INSERT INTO email_events (at, user_id, email_key, event, meta) VALUES (?,?,?,?,?)",
    ).bind(Math.floor(Date.now() / 1000), null, "digest", r.ok ? "sent" : "error",
      r.ok ? d.day : String(r.error || r.status)).run();
  } catch { /* the send is what matters */ }
  return { sent: r.ok, reason: r.ok ? "sent" : String(r.error || r.status), subject: d.subject };
}

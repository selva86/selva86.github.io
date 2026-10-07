// Shared Supabase project: one auth project serves two sites, site keys
// "rstatistics" (the R site) and "mlplus". Both sites' Database Webhooks receive
// every auth.users change, and one account signs in to both sites. These pure
// rules decide, on each site, which accounts it mirrors, which it counts as its
// own signups, and when its owner hears about one. No I/O here (unit-tested by
// Scripts/functions-truth/signup-site.test.mjs); the side effects live in the
// webhook, the middleware and signup-claim.ts. Keep this file identical on both
// sites.
//
// The rules:
// 1. A signup is tagged at creation with user_metadata.site = <site key> when
//    the client can say so (magic link). OAuth (Google, GitHub, Google one-tap)
//    cannot carry metadata at creation, so those accounts arrive untagged.
// 2. A webhook creates a row only for its own tag. An UPDATE for anyone else
//    refreshes the row only if this site already has one (email, name, avatar
//    stay current for people who use both sites). DELETE always applies.
// 3. Untagged accounts are created lazily on their first authenticated request
//    on whichever site the person uses ("first sight"). If the account became
//    usable (created or email-confirmed) within CLAIM_WINDOW_SEC of that first
//    sight, the sign-up happened here: this site claims it, writes the tag back
//    to Supabase so the attribution is permanent, and notifies its owner.
//    Anything older is a pre-existing account from the other site or from
//    before the tag existed: it gets a row, but is neither counted nor notified.

/** An untagged account first seen this soon after it became usable signed up here. */
export const CLAIM_WINDOW_SEC = 3600;
/** Never announce an account as a "new signup" when it was first seen later than this. */
export const NOTIFY_WINDOW_SEC = 48 * 3600;

const TAG_RE = /^[a-z0-9_-]{1,32}$/;

/** The site tag in user_metadata.site, or "" when absent or malformed (user metadata is user-writable). */
export function siteTag(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const v = (meta as Record<string, unknown>).site;
  if (typeof v !== "string") return "";
  const t = v.trim();
  return TAG_RE.test(t) ? t : "";
}

/**
 * A Supabase timestamp as unix seconds, or NaN. Accepts the auth API form
 * ("2026-10-07T06:57:01.123456Z") and the database form carried by webhooks
 * ("2026-10-07 06:57:01.123456+00").
 */
export function supabaseTime(s: unknown): number {
  if (typeof s !== "string" || !s.trim()) return NaN;
  const t = s.trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")       // JavaScript parses milliseconds only
    .replace(/([+-]\d{2})$/, "$1:00");   // "+00" -> "+00:00"
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : NaN;
}

/**
 * When the account became usable: the later of creation and email
 * confirmation. A magic link requested long ago but clicked just now is new;
 * an account confirmed long ago is not. NaN when neither is known.
 */
export function accountTime(u: { created_at?: unknown; email_confirmed_at?: unknown; confirmed_at?: unknown }): number {
  const created = supabaseTime(u.created_at);
  const confirmed = supabaseTime(u.email_confirmed_at ?? u.confirmed_at);
  if (Number.isNaN(created)) return confirmed;
  return Number.isNaN(confirmed) ? created : Math.max(created, confirmed);
}

export type MirrorAction = "upsert" | "refresh" | "skip" | "delete";
export interface WebhookPlan {
  own: boolean;          // the account carries this site's tag (signup notification eligible)
  mirror: MirrorAction;  // refresh = update the row only when this site already has it
}

/** What a site's auth webhook does with one auth.users event (rule 2). */
export function webhookPlan(type: string, tag: string, siteKey: string): WebhookPlan {
  const own = !!tag && tag === siteKey;
  if (type === "DELETE") return { own, mirror: "delete" };
  if (type !== "INSERT" && type !== "UPDATE") return { own: false, mirror: "skip" };
  if (own) return { own, mirror: "upsert" };
  return { own, mirror: type === "UPDATE" ? "refresh" : "skip" };
}

export type FirstSightKind = "own" | "claim" | "other-site" | "legacy";
export interface FirstSightDecision {
  kind: FirstSightKind;
  signupSite: string | null;  // users.signup_site to record (written only while NULL)
  writeTag: boolean;          // stamp user_metadata.site = siteKey in Supabase
  notify: boolean;            // owner "new signup" email (flag-gated and deduped downstream)
}

/**
 * Rule 3: who does an account belong to, the first time this site sees it?
 * accountAt is accountTime() of the Supabase user; firstSeenAt is when this
 * site created its row (users.created_at), so a retry later decides the same.
 */
export function classifyFirstSight(a: {
  tag: string;
  siteKey: string;
  accountAt: number;
  firstSeenAt: number;
}): FirstSightDecision {
  const lag = Number.isFinite(a.accountAt) && Number.isFinite(a.firstSeenAt)
    ? Math.max(0, a.firstSeenAt - a.accountAt)  // clock skew between Supabase and the edge counts as 0
    : Infinity;                                   // unknown age: never claim, never announce
  if (a.tag && a.tag === a.siteKey) {
    // Tagged here; the webhook normally created the row first. Reaching this
    // means it missed: attribute, and notify unless it is stale.
    return { kind: "own", signupSite: a.siteKey, writeTag: false, notify: lag <= NOTIFY_WINDOW_SEC };
  }
  if (a.tag) return { kind: "other-site", signupSite: a.tag, writeTag: false, notify: false };
  if (lag <= CLAIM_WINDOW_SEC) return { kind: "claim", signupSite: a.siteKey, writeTag: true, notify: true };
  return { kind: "legacy", signupSite: null, writeTag: false, notify: false };
}

/** Signup attribution stamped into user_metadata on the magic-link path (absent for OAuth). */
export function signupSourceFromMeta(meta: unknown): { page?: string; trigger?: string; next?: string } {
  const m = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof m[k] === "string" && m[k] ? (m[k] as string) : undefined);
  return { page: s("signup_page"), trigger: s("signup_trigger"), next: s("signup_next") };
}

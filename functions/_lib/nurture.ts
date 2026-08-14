// Nurture sequence email rendering (Phase C). Copy lives in
// _data/nurture-emails.json (owner mirror: Plans/01_email_and_nurture/
// nurture-week-one-emails.md); subjects live in the mini-courses registry.
// A seq with no copy entry, or a lesson not yet built, renders null - the
// brain treats null as "hold at the frontier".

import miniCoursesJson from "../_data/mini-courses.json";
import nurtureEmailsJson from "../_data/nurture-emails.json";
import { renderPersonalNote, type RenderedEmail, type TemplateData } from "./email-templates";

interface SeqItem { seq: number; kind: string; subject: string; source: string; slug?: string | null; course?: string | null }
interface Mini { window_hours: number; sequence: SeqItem[] }
const MINI = miniCoursesJson as unknown as Mini;
const COPY = nurtureEmailsJson as unknown as Record<string, { preheader: string; body: string }>;

export const SEQ_ITEMS: Record<number, SeqItem> = {};
for (const it of MINI.sequence) SEQ_ITEMS[it.seq] = it;
export const MAX_SEQ = Math.max(...MINI.sequence.map((i) => i.seq));

// Is this seq number sendable right now? Lessons need a BUILT slug; public
// treats need only copy. Missing copy always blocks.
export function seqSendable(seq: number): boolean {
  const it = SEQ_ITEMS[seq];
  if (!it || !COPY[String(seq)]) return false;
  if (it.kind === "public") return true;
  return !!it.slug;
}

// Destination for the email link. Windowed lessons carry the personal token
// so the click works signed-out; public pages go bare.
export function seqUrl(seq: number, uid: string, sig: string | undefined): string | null {
  const it = SEQ_ITEMS[seq];
  if (!it) return null;
  if (it.kind === "public") return `https://r-statistics.co/${it.source}.html`;
  if (!it.slug) return null;
  const base = `https://r-statistics.co/${it.slug}.html`;
  return sig ? `${base}?u=${encodeURIComponent(uid)}&t=${sig}` : base;
}

// The editable layer: an owner edit saved from the dashboard lives in KV as
// emailcopy:seq:<n> = {subject?, preheader, body} and beats the bundled copy.
// Deleting the key reverts to the shipped default. Reads happen at render
// time, so an edit reaches the very next send with no deploy (KV propagation
// is under a minute).
export interface SeqCopy { subject?: string; preheader: string; body: string }

export async function getSeqCopy(kv: KVNamespace, seq: number): Promise<SeqCopy | null> {
  try {
    const raw = await kv.get(`emailcopy:seq:${seq}`);
    if (raw) {
      const o = JSON.parse(raw) as SeqCopy;
      if (o && typeof o.body === "string" && o.body.includes("{url}")) return o;
    }
  } catch { /* fall through to bundled */ }
  const c = COPY[String(seq)];
  return c ? { preheader: c.preheader, body: c.body } : null;
}

export function defaultSeqCopy(seq: number): SeqCopy | null {
  const c = COPY[String(seq)];
  return c ? { preheader: c.preheader, body: c.body } : null;
}

export function renderSeqEmail(seq: number, url: string, d: TemplateData, copy?: SeqCopy | null): RenderedEmail | null {
  const it = SEQ_ITEMS[seq];
  const c = copy ?? COPY[String(seq)];
  if (!it || !c) return null;
  const body = c.body
    .replace(/\{first_name\}/g, "__FIRST__")
    .replace(/\{url\}/g, url)
    .replace(/__FIRST__/g, (d.first_name || "").trim().split(/\s+/)[0] || "there");
  return renderPersonalNote({
    key: `seq:${seq}`,
    category: "nurture",
    reason: "you turned on the daily lesson series",
    subject: (copy && copy.subject) || it.subject,
    preheader: c.preheader,
    body,
    data: d,
  });
}

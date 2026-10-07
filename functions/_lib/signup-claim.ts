// First sight of an account on this site (shared Supabase project; the rules
// are in signup-site.ts). Called in waitUntil when the middleware or /api/me
// creates the D1 row lazily, and retried by /api/me for fresh rows that are
// still unattributed. It reads the account from Supabase with the person's own
// access token (GET /auth/v1/user: no service-role key involved), decides
// whose signup it is, records users.signup_site, stamps the tag on an untagged
// account it claims, and sends the owner's "new signup" email for a genuine
// signup here. Never throws. Keep this file identical on both sites.

import type { Env } from "../_middleware";
import { claimSignupSite } from "./db";
import { notifyNewSignup } from "./notify";
import { accountTime, classifyFirstSight, signupSourceFromMeta, siteTag } from "./signup-site";

const SETTLED_TTL = 3 * 86400; // outlives the 48h fresh-user retry window of /api/me
const RETRY_AFTER = 300;       // a failed attempt is retried by /api/me after five minutes

interface AuthUser {
  id?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export async function settleFirstSight(
  env: Env,
  siteKey: string,
  user: { id: string; email: string; created_at: number },
  token: string,
): Promise<void> {
  // Cheap dedupe of the Supabase read across concurrent first requests and
  // /api/me retries. The exactly-once guarantee for side effects is the D1
  // claim below, not this marker.
  const mark = `signup-settled:${user.id}`;
  try {
    if (await env.KV.get(mark)) return;
    await env.KV.put(mark, "1", { expirationTtl: SETTLED_TTL });
  } catch {
    return;
  }
  try {
    const base = (env.SUPABASE_URL || "").replace(/\/+$/, "");
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY };
    const res = await fetch(`${base}/auth/v1/user`, { headers });
    if (!res.ok) throw new Error(`auth user read returned ${res.status}`);
    const au = (await res.json()) as AuthUser;
    if (au.id !== user.id) throw new Error("token belongs to another account");
    const meta = au.user_metadata ?? {};
    const d = classifyFirstSight({
      tag: siteTag(meta),
      siteKey,
      accountAt: accountTime(au),
      firstSeenAt: user.created_at,
    });
    const won = d.signupSite ? await claimSignupSite(env.DB, user.id, d.signupSite) : false;
    console.log(`[signup.first-sight] ${user.id} on ${siteKey}: ${d.kind}${d.signupSite && !won ? " (already attributed)" : ""}`);
    if (!won) return;
    if (d.writeTag) {
      // Merge-update of user_metadata (other keys are kept). The resulting
      // auth.users UPDATE reaches both webhooks: this site refreshes its row
      // (no email: the confirmation is not new), the other site skips it
      // unless it already has the person. A failure here must not cost the
      // owner's email below: the claim is already recorded and is not retried.
      try {
        const put = await fetch(`${base}/auth/v1/user`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ data: { site: siteKey } }),
        });
        if (!put.ok) console.warn(`[signup.first-sight] tag write-back failed for ${user.id}: ${put.status}`);
      } catch (e) {
        console.warn(`[signup.first-sight] tag write-back failed for ${user.id}: ${(e as Error).message}`);
      }
    }
    if (d.notify) {
      await notifyNewSignup(
        env,
        { id: user.id, email: user.email, provider: (au.app_metadata?.provider as string | undefined) || undefined },
        signupSourceFromMeta(meta),
      );
    }
  } catch (e) {
    console.warn(`[signup.first-sight] ${user.id}: ${(e as Error).message}; will retry`);
    await env.KV.put(mark, "retry", { expirationTtl: RETRY_AFTER }).catch(() => {});
  }
}

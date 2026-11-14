// The ops alarm clock. One deployable, two schedules, and nothing else: all
// the logic and every provider secret live on the Pages project, so this
// Worker holds exactly one secret (CRON_SECRET, same value as the Pages side)
// and no bindings. Nothing has to be duplicated between the two deploys.
//
//   0 * * * *    hourly  -> /api/cron/email-brain
//   40 2 * * *   daily   -> /api/cron/integrity
//
// Why 02:40 for the integrity check: the daily operator digest fires at 03:00
// UTC (DIGEST_HOUR_UTC in functions/_lib/digest.ts). Running the check twenty
// minutes earlier means a finding and the digest arrive in the same reading,
// rather than the alert landing hours away from the numbers it bears on.
//
// Deploy:  cd workers/email-brain && npx wrangler deploy
// Secret:  npx wrangler secret put CRON_SECRET  (value must match Pages)

export interface Env {
  CRON_SECRET: string;
}

/* Which endpoint each schedule rings. Cloudflare hands scheduled() the cron
   string exactly as wrangler.toml spells it, so these keys must stay
   character-for-character identical to the [triggers] crons list in that
   file. They are the same two lines in both places on purpose: an edit that
   changes one and not the other is a schedule that fires and does nothing,
   which is why an unmatched cron logs loudly below instead of falling back to
   a default. Guessing wrong here would either double-send the brain's email
   or silently stop it. */
const ROUTES: Record<string, string> = {
  "0 * * * *": "/api/cron/email-brain",
  "40 2 * * *": "/api/cron/integrity",
};

async function ring(path: string, secret: string): Promise<void> {
  try {
    const r = await fetch(`https://r-statistics.co${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    // Log the outcome so `wrangler tail` shows each run's summary.
    console.log(`${path}:`, r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.log(`${path} failed:`, String(e));
  }
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const path = ROUTES[controller.cron];
    if (!path) {
      console.log("UNROUTED CRON, nothing ran:", controller.cron, "known:", Object.keys(ROUTES).join(" / "));
      return;
    }
    ctx.waitUntil(ring(path, env.CRON_SECRET));
  },
};

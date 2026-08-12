// The email brain's alarm clock. Fires hourly and POSTs the Pages endpoint
// that actually runs the brain (functions/api/cron/email-brain.ts). All email
// logic and all provider secrets live on the Pages project; this Worker holds
// exactly one secret (CRON_SECRET, same value as the Pages side) and no
// bindings, so nothing ever needs to be duplicated between the two deploys.
//
// Deploy:  cd workers/email-brain && npx wrangler deploy
// Secret:  npx wrangler secret put CRON_SECRET  (value must match Pages)

export interface Env {
  CRON_SECRET: string;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      fetch("https://r-statistics.co/api/cron/email-brain", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }).then(async (r) => {
        // Log the outcome so `wrangler tail` shows each run's summary.
        console.log("email-brain run:", r.status, (await r.text()).slice(0, 300));
      }).catch((e) => console.log("email-brain run failed:", String(e))),
    );
  },
};

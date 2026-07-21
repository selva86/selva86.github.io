// POST /api/notify/checkout
//
// Lightweight owner notification that someone OPENED a Paddle checkout on
// /pricing.html (fired by the Paddle.js eventCallback). Purely informational:
// always returns 204, never blocks or errors the checkout itself.
//
// Abuse guard: one email per IP per 10 minutes via a KV marker; body is
// size-capped and only whitelisted fields are read.

import type { Env, RequestData } from "../../_middleware";
import { notifyAdminEvent } from "../../_lib/notify";

const RATE_TTL_SEC = 600;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const done = new Response(null, { status: 204 });
  try {
    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
    const rateKey = `ntf-co:${ip}`;
    if (await context.env.KV.get(rateKey)) return done;
    await context.env.KV.put(rateKey, "1", { expirationTtl: RATE_TTL_SEC });

    let body: { plan?: unknown; price_id?: unknown; value?: unknown; currency?: unknown } = {};
    try { body = await context.request.json(); } catch (_) {}
    const plan = typeof body.plan === "string" ? body.plan.slice(0, 40) : "";
    const priceId = typeof body.price_id === "string" ? body.price_id.slice(0, 60) : "";
    const value = typeof body.value === "number" && isFinite(body.value) ? String(body.value) : "";
    const currency = typeof body.currency === "string" ? body.currency.slice(0, 8) : "";

    const user = context.data.user;
    const country = context.request.headers.get("CF-IPCountry") || "";
    const referer = context.request.headers.get("Referer") || "";

    context.waitUntil(notifyAdminEvent(context.env, {
      subject: `[r-statistics.co] Checkout opened${plan ? ": " + plan : ""}`,
      headline: "Checkout opened",
      rows: [
        ...(plan ? [["Plan", plan] as [string, string]] : []),
        ...(priceId ? [["Price", priceId] as [string, string]] : []),
        ...(value ? [["Amount (minor units)", value + (currency ? " " + currency : "")] as [string, string]] : []),
        ["User", user ? user.email : "anonymous"],
        ...(country ? [["Country", country] as [string, string]] : []),
        ...(referer ? [["Page", referer] as [string, string]] : []),
      ],
      ...(user ? { replyTo: user.email } : {}),
    }));
  } catch (_) { /* informational only */ }
  return done;
};

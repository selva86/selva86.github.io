// Unit checks for www/form-guard.js, the CLIENT half of the form guard. Run:
//   node Scripts/functions-truth/form-guard-client.test.mjs
//
// WHY THIS EXISTS. The server half has had tests since it was written. The
// client half did not, and on 2026-11-24 that became a problem: prewarm() was
// added so the Turnstile challenge runs while someone types instead of after
// they press Send, and the two interesting rules it has to respect cannot be
// checked in a browser from automation. Cloudflare refuses to hand a headless
// client a token at all, by design, so every real-browser probe of the warmed
// path comes back empty whether the code is right or wrong.
//
// The rules themselves are pure logic, so they are tested here against a
// stubbed turnstile:
//
//   1. A token is SINGLE USE. If a second send replays the first token the
//      server refuses it, and a present-but-invalid token is refused in BOTH
//      lenient and strict mode, which is worse than sending none at all.
//   2. A token EXPIRES in about five minutes. Someone writing a considered
//      bug report will outlast one, so a parked token that has gone stale
//      must be replaced rather than handed over.
//
// Both failures look identical in a browser: the send simply goes through
// while the flag is off. They would only surface as mysteriously refused
// messages after strict mode is turned on, which is exactly the kind of bug
// that is impossible to find later.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const SRC = readFileSync(path.join(ROOT, "www", "form-guard.js"), "utf8");

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}
function ok(cond, label) { eq(!!cond, true, label); }

/* A turnstile stand-in that records what it was asked to do. Nothing here
   talks to the network; the point is the bookkeeping, not the challenge. */
function stubTurnstile() {
  const calls = { renders: 0, executes: 0, resets: 0 };
  const widgets = [];
  const find = (id) => widgets.find((w) => w.id === id);
  return {
    calls,
    widgets,
    /* Hand a widget a solved token, the way a finished challenge would. */
    park(id, value) { const w = find(id); if (w) { w.response = value; w.expired = false; } },
    expire(id) { const w = find(id); if (w) w.expired = true; },
    api: {
      render(host, opts) {
        calls.renders++;
        const id = "w" + calls.renders;
        widgets.push({ id, host, opts, response: "", expired: false });
        return id;
      },
      getResponse(id) { const w = find(id); return w ? w.response : undefined; },
      isExpired(id) { const w = find(id); return w ? !!w.expired : false; },
      reset(id) { calls.resets++; const w = find(id); if (w) { w.response = ""; w.expired = false; } },
      execute(id, opts) {
        calls.executes++;
        const w = find(id);
        const fresh = "fresh-token-" + calls.executes;
        setTimeout(() => { if (w) w.response = fresh; opts.callback(fresh); }, 5);
      },
    },
  };
}

/* Load the real file with a chosen sitekey and a stubbed turnstile already
   present, so loadApi() resolves without a script tag. */
function load({ sitekey = "0xTESTKEY", turnstile = stubTurnstile() } = {}) {
  const src = SRC.replace(/var SITEKEY = '[^']*';/, `var SITEKEY = '${sitekey}';`);
  assert.ok(src.includes(`var SITEKEY = '${sitekey}';`), "the SITEKEY line must still be rewritable");
  /* turnstile is already present, so loadApi() resolves without a script tag
     and the tests stay synchronous about everything except the challenge. */
  const win = { turnstile: turnstile.api };
  const sandbox = {
    window: win,
    document: {
      createElement: () => ({ set src(_v) {}, get src() { return ""; } }),
      head: { appendChild() {} },
    },
    setTimeout, clearTimeout, Promise, console, Error,
  };
  vm.runInNewContext(src, sandbox, { filename: "www/form-guard.js" });
  return { guard: win.RSCFormGuard, turnstile, win };
}

const host = (id) => ({ id, nodeName: "DIV" });

console.log("the exports and the off switch");
{
  const { guard } = load();
  eq(Object.keys(guard).sort(), ["enabled", "prewarm", "token"], "three exports, prewarm among them");
  eq(guard.enabled(), true, "enabled with a sitekey");
}
{
  const { guard, turnstile } = load({ sitekey: "" });
  eq(guard.enabled(), false, "disabled with no sitekey");
  guard.prewarm(host("a"));
  eq(turnstile.calls.renders, 0, "prewarm renders nothing while no sitekey is set");
  eq(await guard.token(host("a")), "", "and token resolves empty rather than throwing");
}

console.log("prewarm renders once, and only once");
{
  const { guard, turnstile } = load();
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  eq(turnstile.calls.renders, 1, "first prewarm renders the widget");
  eq(turnstile.calls.executes, 0, "and asks for nothing: it is a hint, not a step");
  guard.prewarm(host("cf"));
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  eq(turnstile.calls.renders, 1, "repeat prewarms are ignored for the same host");
}
{
  const { guard, turnstile } = load();
  guard.prewarm({ nodeName: "DIV" });            // no id
  guard.prewarm(null);
  await new Promise((r) => setTimeout(r, 10));
  eq(turnstile.calls.renders, 0, "prewarm needs a host with an id and refuses to guess");
}

console.log("the warm path: a parked token costs no round trip");
{
  const { guard, turnstile } = load();
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  turnstile.park("w1", "warmed-token");          // the challenge finished while they typed
  const t = await guard.token(host("cf"));
  eq(t, "warmed-token", "the token parked by prewarm is handed straight back");
  eq(turnstile.calls.executes, 0, "with no execute, which is the whole point of prewarming");
  eq(turnstile.calls.resets, 0, "and no reset, which would have thrown the warm token away");
}

console.log("single use: a second send never replays the first token");
{
  const { guard, turnstile } = load();
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  turnstile.park("w1", "warmed-token");
  const first = await guard.token(host("cf"));
  const second = await guard.token(host("cf"));
  eq(first, "warmed-token", "first send uses the warm token");
  ok(second && second !== first, "second send gets a DIFFERENT token");
  eq(turnstile.calls.resets, 1, "because the spent widget was reset exactly once");
  eq(turnstile.calls.executes, 1, "and a new challenge was run for it");
  const third = await guard.token(host("cf"));
  ok(third && third !== second, "and a third send is fresh again");
}

console.log("expiry: a stale parked token is replaced, not handed over");
{
  const { guard, turnstile } = load();
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  turnstile.park("w1", "stale-token");
  turnstile.expire("w1");                        // five minutes of typing later
  const t = await guard.token(host("cf"));
  ok(t && t !== "stale-token", "the expired token is not what comes back");
  eq(turnstile.calls.resets, 1, "the widget was reset");
  eq(turnstile.calls.executes, 1, "and a fresh challenge was run");
}
{
  // The expired-callback must clear the widget by itself, so the next send
  // does not even find a stale token to reject.
  const { guard, turnstile } = load();
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  turnstile.park("w1", "stale-token");
  const opts = turnstile.widgets[0].opts;
  ok(typeof opts["expired-callback"] === "function", "the widget registers an expired-callback");
  opts["expired-callback"]();
  eq(turnstile.api.getResponse("w1"), "", "which clears the stale token in the background");
  eq(turnstile.calls.resets, 1, "by resetting the widget, without anyone sending anything");
}

console.log("it never rejects, whatever turnstile does");
{
  const t = stubTurnstile();
  t.api.execute = () => { throw new Error("challenge platform exploded"); };
  const { guard } = load({ turnstile: t });
  eq(await guard.token(host("cf")), "", "a throwing execute resolves empty instead of rejecting");
}
{
  const t = stubTurnstile();
  t.api.render = () => { throw new Error("render refused"); };
  const { guard } = load({ turnstile: t });
  eq(await guard.token(host("cf")), "", "a throwing render resolves empty too");
  guard.prewarm(host("cf"));                      // must also swallow it
  ok(true, "and prewarm swallows the same failure without throwing");
}
{
  const t = stubTurnstile();
  t.api.execute = (id, opts) => { setTimeout(() => opts["error-callback"]("110200"), 5); };
  const { guard } = load({ turnstile: t });
  eq(await guard.token(host("cf")), "", "an error-callback resolves empty, so the send still happens");
}
{
  // isExpired is not in every version of the API. A missing method must not
  // take the token with it.
  const t = stubTurnstile();
  delete t.api.isExpired;
  const { guard } = load({ turnstile: t });
  guard.prewarm(host("cf"));
  await new Promise((r) => setTimeout(r, 10));
  t.park("w1", "warmed-token");
  eq(await guard.token(host("cf")), "warmed-token", "a missing isExpired is treated as not expired");
}

console.log("two hosts on one page keep their own widgets");
{
  const { guard, turnstile } = load();
  guard.prewarm(host("cf-turnstile"));
  guard.prewarm(host("rsfb-ts"));
  await new Promise((r) => setTimeout(r, 10));
  eq(turnstile.calls.renders, 2, "one widget each");
  turnstile.park("w1", "contact-token");
  turnstile.park("w2", "widget-token");
  eq(await guard.token(host("cf-turnstile")), "contact-token", "the contact form gets its own token");
  eq(await guard.token(host("rsfb-ts")), "widget-token", "and the sitewide widget gets its own");
  eq(turnstile.calls.resets, 0, "neither send disturbed the other");
}

console.log(`\n${n - fails}/${n} checks passed`);
process.exit(fails ? 1 : 0);

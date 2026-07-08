# /write-tool ab-test-calculator - build plan + parity checklist

Predecessor: `tools/ab-test-calculator.html` (old tool restored in commit 368c2e7b1 after a
175KB wipe; only site-wide nav/footer rebuilds since). It already carries Lab-sheet typography
and the 3 UX features, but its math is hand-rolled and UNVERIFIED, and it advertises capabilities
it does not compute. This pass = rebuild-in-place to the current v2 bar: verified math lib,
correct + live + reproducible R, deterministic Bayesian math, a REAL sequential mode, and the
missing v2 elements (trust line, GA events, copyable report line, visible FAQ). No capability dropped
except unequal-allocation, which was advertised but never reachable (dropped with a taught reason).

## Pass 0 - full feature inventory of the predecessor

Modes (mode x framing): plan (sample size) | analyze x {freq two-prop z, bayes beta-binomial, both}.
Controls: mode tabs, framing tabs, alpha picker (.01/.05/.10), tail tabs (two/one-sided), 3 plan
number inputs (baseline/mde/power), 4 analyze number inputs (nA/cA/nB/cB), 3 viz sliders. 6 scenario
presets (plan2arm, analyze [default], bayesonly, sequential, longtail, custom). SVG viz: power curve
(plan), normal-tail density (freq), Beta posteriors (bayes/both). 3 UX features present (tool-lead,
"I want to..." banner, live inference line). Anatomy/explainer + further-reading. Live "same thing in
R" WebR block (Run/Copy/Reset). JSON-LD: WebApplication + FAQPage + BreadcrumbList.

## Gaps found vs the current v2 bar (this pass fixes)

1. Math hand-rolled + unverified. `pnorm` is the A&S 26.2.17 approximation (~7.5e-8), mislabeled
   "Hart's"; no tools/lib, no R truth table. -> FIX: `tools/lib/ab-test-math.js` (UMD) reusing
   normal-math (machine-precision pnorm/qnorm) + ttest-math (lgamma/ibeta). Node harness vs truth.
2. Bayesian is Monte-Carlo (10k unseeded draws): P(B>A), CrI, BF10 vary per reload, do NOT match the
   emitted R (which uses set.seed + 1e5 draws), and BF10 is a crude 0.01-bin Savage-Dickey ratio that
   can blow up to 1e9. -> FIX: deterministic. P(B>A) = integrate(dbeta_B * pbeta_A); mean lift exact;
   difference CrI via deterministic CDF + bisection; BF10 via exact closed-form beta-binomial
   marginal-likelihood ratio B(a1,b1)B(a2,b2)/[B(a0,b0)B(a0+cA+cB, b0+nA+nB-cA-cB)]. All R-verifiable.
3. Sequential/Pocock ADVERTISED (title/meta/JSON-LD/FAQ/anatomy/"sequential" scenario) but DEAD CODE
   (pocockBoundary never called; MODES has no sequential). -> FIX: ship a real Sequential sanity-check
   mode. Standard tabulated Pocock constants c_K (Jennison & Turnbull 2000, Table available; cited on
   page), per-look nominal alpha = 2*(1-Phi(c_K)). Honest + more than the predecessor shipped.
4. No GA tool_use/tool_copy, no consent-mode gtag, no consent-banner.js. -> ADD (match t-test).
5. No dedicated copyable report line (only R-code copy). -> ADD `#report` + Copy button (tool_copy).
6. No trust line in the contract format. -> ADD ("No data leaves your browser / Verified against R's
   prop.test(), pwr.2p.test() and integrate() / Free"). Sequential constants cited separately.
7. FAQPage JSON-LD present but NO visible on-page FAQ. -> ADD visible FAQ matching the schema.
8. CI critical value ignores tail (always qnorm(1-a/2)). -> FIX: one-sided CI when tail=one-sided,
   matching prop.test(alternative="greater").
9. Unequal-allocation advertised in JSON-LD but never reachable. -> DROP claim; teach on-page (equal
   split is most powerful; pwr.2p2n.test for unequal). Plan framing simplified to frequentist n
   (bayes-plan / thr input were cosmetic and never rendered).
10. BF10 never emitted in R block. -> emit deterministic R for every displayed number incl. BF10.

## Sign convention

Lift = pB - pA (how much better B is). Emit `prop.test(x=c(cB,cA), n=c(nB,nA), correct=FALSE)` so R's
estimate/CI are pB - pA and match the tool. Sequential/bayes B-first likewise.

## Parity checklist (every predecessor capability ships) - ALL VERIFIED

- [x] plan (sample size, Cohen's h, pwr.2p.test) + freq (two-prop z) + bayes (beta-binomial) + both
- [x] sequential mode - now REAL (was advertised-only)
- [x] alpha picker (.01/.05/.10), tail (two/one-sided)
- [x] 6 scenario presets (sequential chip now routes to the real sequential mode)
- [x] 3 UX features (tool-lead, "I want to..." banner, live inference line)
- [x] SVG viz per mode (power curve / normal tails / Beta posteriors / Pocock boundary) + live readout
- [x] anatomy/explainer, further reading
- [x] live R block (now correct + deterministic + reproduces every displayed number - re-run in R 4.6.0)
- [x] JSON-LD (WebApplication + FAQPage + BreadcrumbList)
- [x] NEW: trust line, GA tool_use/tool_copy + consent block, copyable report line, visible FAQ

## Bayesian math (deterministic - the crux)

Prior Beta(a0,b0), default Beta(1,1). Posteriors A~Beta(a1=a0+cA, b1=b0+nA-cA), B~Beta(a2,b2).
- P(B>A) = integral_0^1 dbeta(x;a2,b2) * pbeta(x;a1,b1) dx   (R: integrate; JS: composite Simpson)
- mean lift = a2/(a2+b2) - a1/(a1+b1)
- D = pB - pA. CDF P(D<=d) = integral_0^1 dbeta(a;a1,b1) * pbeta(a+d;a2,b2) da. 95% CrI by bisection.
- BF10 (rates differ vs equal) = B(a1,b1)*B(a2,b2) / [B(a0,b0)*B(a0+cA+cB, b0+nA+nB-cA-cB)], exact.

## Pass 4 gates

- [x] Node harness: 29/29 truth cases pass at <=1e-6 (freq/plan/bayes/sequential + edges)
- [x] Playwright E2E vs truth table: DOM == lib == R for all modes + edge cases (zeroB, one-sided, longtail)
- [x] Emitted R re-run in R 4.6.0: reproduces z/p/CI, P(B>A)/CrI/BF10, n, per-look alpha
- [x] Chrome injection: 1 injected chrome, 0 bespoke masthead, sidebar 27 links + 49 icons + fold control
- [x] mobile 390px: scrollWidth 375 <= innerWidth 390 (no horizontal overflow)
- [x] parity checklist above fully checked; smoke tests 6/6; GA tool_use/tool_copy fire
- [ ] CF preview + prod poll after merge (PENDING owner go-ahead before merge to master)

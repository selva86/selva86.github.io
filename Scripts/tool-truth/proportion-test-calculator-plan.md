# proportion-test-calculator — build plan

Wave-3 NEW tool (keyword gap G1). One- and two-proportion **z-tests** with the
CLASSROOM framing the A/B-test tool never wins on: state H0/H1, compute the z
statistic, the critical value, and the p-value, decide.

## Pass 0 — feature inventory / parity

No predecessor tool exists (`tools/proportion-test-calculator.html` absent from git
history). New-tool depth bar (inherit best-tool depth):

- **2 modes** via the "I want to ..." selector: one-proportion test (x of n vs p0),
  two-proportion test (x1/n1 vs x2/n2).
- **3 alternatives** per mode: two-sided / greater / less.
- **3 significance levels**: alpha 0.10 / 0.05 / 0.01 (conf 0.90/0.95/0.99).
- **Scenario chips**: poll vs 50%, coin, drug two-arm, A/B conversion, one-sided.
- **Visual answer**: standard-normal curve with the rejection region shaded and the
  observed z marked (the classroom picture), plus a 4-tile stats grid.
- **Plain-English verdict** + **live inference line** (decision rule named).
- **Continuity-correction teaching note** (the differentiator, see below).
- **R code emitter** that actually runs: `prop.test(..., correct = FALSE)`.
- How-computed steps, method table, formulas table, FAQ, go-deeper links.

## The continuity-correction story (the spec differentiator)

R's `prop.test()` **defaults to `correct = TRUE`** (Yates continuity correction);
the textbook z-test is `correct = FALSE`. The tool:

- Headlines the **classroom** (uncorrected) z, p, critical value, decision.
- Shows a note with what R's DEFAULT (`correct = TRUE`) gives (z_cc, p_cc), so the
  reader learns why their hand-computed z differs from `prop.test()` out of the box.
- Emits the honest `prop.test(x, n, p = p0, alternative = "...", correct = FALSE)`
  snippet that reproduces the headline numbers, and names the default in a comment.

## Math (Pass 2) — REUSE, compose additively

`tools/lib/proportion-math.js` (NEW, UMD) composes:
- `normal-math.js` — `pnorm`, `qnorm` (p-values, critical values).
- `ci-math.js` — `wilsonCI` (one-sample CI == prop.test correct=FALSE conf.int),
  `diffPropCI` (two-sample CI == prop.test correct=FALSE conf.int).
Adds NOTHING to those libs. Load order: ttest-math -> normal-math -> ci-math ->
proportion-math.

Statistic replicated exactly as R `prop.test` (per-cell |O-E|-YATES form) so both
correct settings match R bit-for-bit; signed z = sign(effect)*sqrt(X-squared);
one-sided p = `pnorm(z, lower.tail = (alt=="less"))`; two-sided = `pchisq(X²,1,upper)`
= `2*pnorm(-|z|)`. YATES(one) = min(0.5, |x-n*p0|); YATES(two) = min(0.5, |Δ|/(1/n1+1/n2)).

## Pass 1 — R truth: `proportion-test-calculator.{R,json}`

Every mode x alternative x correct, plus edges: x=0, x=n, tiny n (n=5,10), delta=0,
large n, conf 0.90/0.95/0.99. Fields per case: statistic, p.value, estimate, conf.int
for both correct settings + manual classroom z0 (assert == signed sqrt of uncorrected X²).

## Pass 4 — gates + registration

Node harness <=1e-6; local Playwright E2E all modes/alts/edges; chrome check; mobile
390px; CF preview E2E; merge master; poll prod. Registration: build.py
(_TOOL_ICONS curve+z-line, COMPENDIUM_TOOLS Calculators), gen_tools_landing.py
(CATEGORIES + C3META), tool-audit tool-list.json, content-hash ?v pins on all 4 libs.
Cross-link ab-test-calculator, confidence-interval-calculator, statistical-test-chooser.

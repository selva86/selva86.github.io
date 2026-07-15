# fisher-exact-test-calculator — build plan (wave-3)

## What it is
Fisher's exact test from a 2x2 counts table. Headline = the exact p-value (one- and
two-sided) plus the odds ratio (conditional MLE) with an exact confidence interval,
exactly as R's `fisher.test()` reports. Optional mid-p. Teaches WHEN Fisher beats the
chi-square test (small expected counts) with a live shows-work null-distribution viz.

Keyword owned by GraphPad with a worse UX. Differentiators:
1. Shows-work: draws the hypergeometric null distribution with the observed cell marked
   and the exact tail(s) shaded — the reader SEES where the p-value comes from.
2. Matches-R-exactly trust line (verified against `fisher.test()`).
3. Runnable `fisher.test()` emitter (with alternative + conf.level + mid-p note).

## Reuse (Pass 0 / owner rule): the exact-test machinery is already R-verified
`tools/lib/oddsratio-math.js` (W2.3, verified vs R fisher.test at <=1e-6) exposes:
- `fisherP(a,b,c,d)`      -> two-sided p (R "minlike")
- `fisherMLE(a,b,c,d)`    -> conditional MLE (fisher.test $estimate)
- `fisherCI(a,b,c,d,lv)`  -> two-sided exact CI (fisher.test $conf.int)
- `chisq(a,b,c,d)`        -> Pearson chi-square (Yates + raw) + minExp
- `uniroot(f,lo,hi)`      -> R zeroin2 Brent at tol .Machine$double.eps^0.25

New `tools/lib/fisher-math.js` **requires** oddsratio-math.js + normal-math.js and adds,
additively (no edit to oddsratio-math.js -> no stale ?v pin on odds-ratio-calculator):
- one-sided p (greater = P(X>=x), less = P(X<=x)) from the central hypergeometric (null)
- mid-p (two-sided minlike, and one-sided) = tail - 0.5 * point mass
- one-sided exact CI: greater = [ncp.L(1-lv), Inf], less = [0, ncp.U(1-lv)]
  (ncp.L/ncp.U ported from R fisher.test, same logic as oddsratio-math.fisherCI which
   uses alpha=(1-lv)/2 for two-sided)
- expected counts + Fisher-vs-chisq recommendation (minExp < 5 -> Fisher)

## Math ground truth (Pass 1)
`Scripts/tool-truth/fisher-exact-test-calculator.R` -> `.json`, R 4.6.0.
Per table: fisher.test two.sided/greater/less p, estimate, conf.int at 90/95/99 (two.sided)
+ conf.int greater/less at 95; sample OR (ad/bc, Haldane if a 0 cell); minExp; chisq Yates/raw;
mid-p (two/greater/less) computed from base `dhyper` over the support (the ground-truth
definition the JS must match bit-for-bit).
Edge cases: x=lo (a=0 -> OR 0), x=hi (b=0 or c=0 -> OR Inf), OR=1, tiny n, double-zero
corners, huge counts (near-normal, big support -> viz windowing).

Gate: `Scripts/tool-truth/test-fisher-exact-test-calculator-math.js` all cases <=1e-6 rel.

## Page (Pass 3) — Lab-sheet clean source, build injects chrome
Shell: de-injected odds-ratio-calculator (closest 2x2 domain match). NO masthead, NO
`data-tool-v2`, NO in-page footer. Contract title 40-60ch. WebApplication + FAQPage JSON-LD.

The 3 mandatory UX features:
1. Tool lead under H1 — what Fisher answers, what to drop in (4 counts), what comes back.
2. "I want to ..." banner — the goal phrase IS the alternative selector, synced with mode pills:
   two-sided (groups differ) / greater (group 1 higher odds) / less (group 1 lower odds).
3. Live inference line after results — decision rule + conclusion for THIS p.

Anatomy: hero + mode pills (alternative) + I-want banner; scenario chips (tea-tasting,
case-control small, adverse event, protective, zero cell, large->chi-square); 2x2 table
input (renamable labels); options (confidence level 90/95/99 + "show mid-p" toggle);
results card — verdict chip + p headline, null-distribution viz (bars + shaded tails,
observed marked) + OR forest interval, stats grid (p selected / two-sided / greater / less,
OR cMLE + exact CI, sample OR, min expected + recommendation, mid-p when on), plain-English
box, live inference line, copy report line; how-computed collapsible (hypergeometric steps
with live numbers); live fisher.test() R code with copy; trust line; below-fold "Fisher vs
chi-square: when to use which", method table, FAQ, go-deeper (odds-ratio-calculator,
chi-square-table, confusion-matrix, p-value-calculator).

GA tool_use/tool_copy. Consent-mode GA + consent-banner.js + CF beacon carried in source.
No em dashes, no eyebrow kicker, no JetBrains Mono, no in-page footer, no UI-tour copy.

## Registration
- `_build/build.py` COMPENDIUM_TOOLS (Calculators) + 16px icon
- `_build/gen_tools_landing.py` CATEGORIES + C3META card
- content-hash ?v pin on normal-math.js, oddsratio-math.js, fisher-math.js refs
- `Scripts/tool-audit/tool-list.json` add slug

## Parity checklist (Pass 0 — NEW tool, inherit depth bar of best tools)
- [ ] Multiple modes (two-sided / greater / less alternative) via pills + I-want banner
- [ ] Scenario presets (>=5) incl. zero-cell + large->chi-square
- [ ] Plain-English verdict + live inference line
- [ ] Runnable R emitter (fisher.test with alternative + conf.level)
- [ ] Shows-work how-computed (hypergeometric) + null-distribution viz (the differentiator)
- [ ] Method table + FAQ + go-deeper cross-links (odds-ratio + chi-square)
- [ ] Mid-p option (differentiator; if cheap — it is)
- [ ] Two-sided + one-sided p all shown; OR cMLE + exact CI; sample OR reference
- [ ] Confidence level 90/95/99
- [ ] Every displayed number verified vs R fisher.test at <=1e-6

## Verification gates (Pass 4)
1. Local Playwright E2E vs truth table (all alternatives, levels, mid-p, edge cases, errors)
2. Chrome check: exactly 1 injected chrome, 0 own mastheads, canonical navbar + sidebar
3. Mobile 390px no overflow
4. Parity checklist all ticked
5. CF/prod E2E with fresh discriminator; ship on master (wave-3 direct-to-master pattern)

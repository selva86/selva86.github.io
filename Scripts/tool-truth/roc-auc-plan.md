# roc-auc v2 rebuild plan

Rebuild `tools/roc-auc-calculator.html` (ROC / AUC Calculator). v1 is on a v2-style Lab-sheet
shell already, but is a "v1" by the signal test: it ships `webr-init.min.js` and has NO external
math lib (all math inline). Rebuild = port math into an R-verified `roc-math.js`, drop WebR for a
static "same thing in R" block, freeze scenario datasets so R verifies the exact numbers, add a
proper FAQ + method table, keep the strong existing UX.

## v1 feature inventory (parity checklist — every line ships in v2 or is waived-with-reason)

- [ ] Tool lead under H1 (plain-language explainer) — KEEP
- [ ] 4-min primer dropdown (what ROC/AUC mean, reading the curve, picking optimum, when wrong) — KEEP
- [ ] "I want to ..." banner-sentence with live n / AUC summary — KEEP (single-mode tool; the banner
      frames intent; the "mode" facet is the CI-method + cost inputs. Keep an inline selector feel.)
- [ ] 6 scenario preset cards: perfect, mtcars, imbal, breast, random, custom — KEEP, but FREEZE the
      datasets as fixed arrays (v1 generated them with a runtime RNG → not R-verifiable). mtcars =
      real `glm(vs~disp,mtcars)` fitted probs (authentic + deterministic).
- [ ] Inputs: paste textarea (y score), cost ratio FN:FP, CI-method select, bootstrap-B (conditional) — KEEP
- [ ] AUC + 95% CI big display (DeLong default) — KEEP; **FIX**: v1 built the CI on the logit scale;
      pROC::ci.auc(method="delong") builds it on the linear AUC scale then clamps to [0,1]. Verify in
      R and match pROC exactly (this is the v2 math fix).
- [ ] SE display (DeLong) — KEEP, verify vs pROC var(roc).
- [ ] 3 optimal thresholds (Youden J, F1, cost-weighted), clickable to set operating point — KEEP;
      **FIX**: use pROC's threshold grid = midpoints between consecutive unique scores + ±Inf (v1 used
      raw score values), so reported thresholds match coords(). Youden verified vs coords(...,"best").
- [ ] Confusion matrix + metrics at current threshold (TP/FP/FN/TN, sens/spec/ppv/npv/acc/F1) — KEEP,
      verify vs pROC coords(x=t). Reuse ClassificationMath.binary for the metric set.
- [ ] Recap ("How we got there") — KEEP
- [ ] ROC curve SVG (interactive, threshold marker) — KEEP
- [ ] Score-distribution SVG by outcome + threshold slider — KEEP
- [ ] Calibration: Brier score + reliability decile bins — KEEP, verify Brier = mean((p-y)^2);
      bins deterministic (stable sort by score, contiguous index split).
- [ ] Live inference banner after results — KEEP
- [ ] Read-more: ROC anatomy + DeLong derivation (formulas) — KEEP
- [ ] Caveats: when this is the wrong tool (multiclass / survival / imbalance / PR curve) — KEEP as method table
- [ ] R code emitter — KEEP as a STATIC copyable block (no WebR runtime). Emits real pROC code that
      reproduces the displayed AUC/CI/coords for the CURRENT dataset.
- [ ] FAQPage + WebApplication + Breadcrumb JSON-LD — KEEP; add a visible FAQ accordion (plain
      <details> in a .faq container; chrome CSS styles it — no bespoke accordion CSS).
- [ ] Trust line: "No data leaves your browser / Verified against R's pROC / Free" — ensure literally true.
- [ ] GA tool_use + tool_copy; consent-mode GA + CF beacon — KEEP.

### CI-method "Bootstrap" decision
DeLong is exact and is pROC's analytic default → verified bit-for-bit. Bootstrap: attempt to
reproduce pROC's stratified resampling with the R Mersenne-Twister (reuse bootstrap-math RRNG). If it
verifies in the truth harness, keep "Bootstrap (verified)". If pROC's internal sampling order can't be
matched cleanly, DROP the bootstrap option with a taught reason on-page (DeLong is exact; a browser
can't reproduce pROC's stratified bootstrap seed-for-seed — use ci.auc(method="bootstrap") in R).

## Non-negotiables (owner rules)
- No bespoke masthead, no `data-tool-v2`; author `<body>` with no `<header>` — build.py injects chrome.
- NO in-page footer (`.ft`) — build.py injects SITE-FOOTER-V2.
- No em dashes, no JetBrains Mono, never name the in-browser R runtime, no stat-triplet flourish.
- Contract title 40-60ch, canonical, WebApplication+FAQPage JSON-LD.
- Page < 60KB self-contained (excluding injected chrome).

## R truth targets (pROC 1.19.0.1, R 4.6.0)
AUC, DeLong var/se, CI @ 90/95/99 (linear-scale, clamped), Youden/F1/cost thresholds over the
midpoint grid, confusion matrix @ Youden threshold, Brier, calibration bins. Datasets frozen in JSON,
embedded verbatim in the page and the node harness — three-way identical by construction.
Edge cases: perfect separation (AUC=1, var=0), near-random, imbalance, ties, tiny n.

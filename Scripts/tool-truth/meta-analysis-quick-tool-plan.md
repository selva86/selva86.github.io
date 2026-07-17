# Meta-Analysis Quick Tool - build plan and parity checklist

Slug: `tools/meta-analysis-quick-tool.html`
Wave 3, Tier 3 row 19. Interpreter moat: pool a handful of studies without installing anything.

## Pass 0 - feature inventory

**No predecessor.** No `tools/meta-analysis-quick-tool.html` exists live, in git history, or on
any preview branch (`git log --all -- tools/meta-analysis-quick-tool.html` is empty). There is
therefore no capability to preserve, and nothing is being dropped.

A previous build attempt left three untracked artifacts, which this build adopted after
re-verifying them rather than rewriting: `tools/lib/meta-analysis-math.js`,
`Scripts/tool-truth/meta-analysis-quick-tool.R`, `Scripts/tool-truth/test-meta-analysis-math.js`.

New tools inherit the depth bar of the best existing tools. Checklist:

| Depth bar item | Shipped as |
| --- | --- |
| Multiple modes | 2 input formats: effect + SE per study, and 2x2 event counts per study |
| Method choices | Both models always computed and always shown side by side (fixed effect, DerSimonian-Laird) |
| Scenario presets | 6 chips: studies that agree, studies that disagree, a protective effect, 2x2 trials, a zero-event arm, trials that scatter |
| What-if interactivity | Live recompute on every keystroke, mode switch and level change; 90/95/99 levels |
| Visual answer | Forest plot: weight-sized squares, CI whiskers with off-scale arrowheads, dashed null line, one diamond per model |
| Plain-English verdict | Verdict box + a "which model to report" inference line that names the model and the reason |
| Report line | One-line journal-ready summary with both models and all heterogeneity stats, copyable |
| R code emitter | Live `metafor` code: `rma(method="FE")`, `rma(method="DL")`, `forest()`, plus `escalc(measure="OR")` in counts mode |
| Explainer / anatomy | "How this is computed" with the live arithmetic, 6 to 7 steps |
| Below-fold teaching | 3 method tables (two models, reading a forest plot, 2x2 to log OR) + 6-question FAQ |

## Spec requirements, and where each one landed

| Spec line | Where |
| --- | --- |
| Paste effect + SE rows | `es` mode, `MetaMath.parse(text,'es')` |
| Paste 2x2 counts, auto log OR + SE, **show that arithmetic** | `counts` mode; per-study table columns `ln(ad/bc)` and `sqrt(1/a+1/b+1/c+1/d)` render the numbers substituted in, per study; step 1 of How-this-is-computed repeats it for study 1 |
| Fixed effect: weight formula + weighted mean shown | How-this-is-computed steps 2 and 3 (`w = 1/SE^2`, `sum(w*yi)/sum(w)` with live numbers) |
| DL: show Q, df, C, tau2 = max(0,(Q-df)/C), re-weighted pool | Steps 4, 5, 6, 7 with live numbers |
| Heterogeneity readout Q, df, p, I2, tau2, each explained actionably | "Do these studies agree?" card, one row per statistic, sentence branches on the actual value |
| Forest plot, square sized by weight, whiskers, diamond per pool, log scale + OR labels for 2x2 | `drawForest()`; axis ticks label `exp(yi)` in counts mode, which is a log OR axis |
| Verdict paragraph: which model and why | `.infline` "Which model to report", three branches (identical / random-effects forced / random-effects as safe default) |
| R one-liners incl. escalc for 2x2 | `renderR()`, verified to actually run (see below) |
| Verify EVERY number vs local R metafor, incl. I2 > 60 and a 2x2 case | 12-case truth table; `es_high` I2 = 89.60, `counts_high` I2 = 88.57, `counts_zero` zero-event arm |
| Malformed paste -> clear message | 8 error cases asserted in E2E |
| Cross-link effect-size-converter + meta-analysis tutorial cluster | See "Cross-links" below |

## Cross-links

`effect-size-converter` is linked twice: from the Go-deeper rail and naturally inside the FAQ
answer on mixing effect metrics, where a reader actually hits the need.

**The meta-analysis tutorial cluster does not exist yet.** No page on the site teaches
meta-analysis: a sweep for `meta-analys*`, `forest plot`, `DerSimonian`, `heterogeneity` and
`metafor` across all HTML returns only passing mentions (`Sample-Size-Planning-in-R.html` has the
most, 5). The spec says to cross-link it "where they exist", so the Go-deeper rail links what is
genuinely relevant and real instead: `odds-ratio-calculator` (the 2x2 effect this tool pools),
`confidence-interval-calculator`, `Hierarchical-Models-and-Partial-Pooling.html` (partial pooling
is the same idea as a random-effects model) and `Sample-Size-Planning-in-R.html`. When the
meta-analysis tutorial cluster ships, add it to the Go-deeper rail and to the FAQ.

## Verification

- **Pass 1** R truth table: `Scripts/tool-truth/meta-analysis-quick-tool.R` -> `.json`,
  12 cases, R 4.6.0 + metafor 5.0.1. Covers k=2, k=10, negative effects, a dominant study,
  a homogeneous set, 90/95/99 levels, high heterogeneity (I2 89.6 and 88.6) and a zero-event arm.
- **Pass 2** math gate: `node Scripts/tool-truth/test-meta-analysis-math.js`
  -> 396/396 at <=1e-6 relative, worst deviation 7.13e-9.
- **Pass 4.1** E2E: `node Scripts/tool-truth/e2e-meta-analysis.mjs` -> 345/345.
  Asserts rendered pooled estimates, both CIs, Q, df, I2, tau2 and every per-study weight
  against metafor for all 12 cases, both modes, all three levels.
- **Rubric 6** the emitted R code is not just plausible, it runs:
  `node Scripts/tool-truth/e2e-meta-rcode.mjs` pipes the page's own emitted code into
  Rscript and checks R's `coef(fe)` / `coef(re)` against what the page displays. 4/4.

## Deviations, stated

- The spec says "canvas forest plot". Rendered as inline **SVG**, not `<canvas>`: every v2 tool
  draws in SVG, and SVG is what carries the `aria-label` the rubric requires, scales without
  blurring on the 2x device ratio, and keeps the plot assertable from Playwright. "House-style"
  and `<canvas>` were in tension here and house style won.
- Square size is the **fixed-effect** weight in both models' plots, stated in the caption and the
  aria-label, rather than switching with the recommended model. Both weight columns are in the
  per-study table, so nothing is hidden.

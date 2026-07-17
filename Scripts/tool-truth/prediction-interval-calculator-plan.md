# Prediction Interval Calculator - build plan and parity checklist

Slug: `tools/prediction-interval-calculator.html`
Wave 3, Tier 3 row 20. The PI-vs-CI confusion killer: one page where both intervals sit side by
side at the same x, so the difference stops being a definition to memorise and becomes a picture.

## Pass 0 - feature inventory

**No predecessor.** No `tools/prediction-interval-calculator.html` exists live, in git history, or
on any branch (`git log --all -- tools/prediction-interval-calculator.html` is empty; a loop over
every local branch head found no such blob). Nothing to preserve, nothing dropped.

New tools inherit the depth bar of the best existing tools. Checklist:

| Depth bar item | Shipped as |
| --- | --- |
| Multiple modes | 3: compare both intervals (default), predict one new observation, estimate the mean response. The mode picks which interval is the headline; both panes always stay on screen, because hiding one would defeat the tool's purpose |
| Method choices | Both intervals always computed and always shown together; level selectable 90/95/99 via pills plus any level 50-100 via the number field |
| Scenario presets | 4 chips: study hours and exam score (default), speed and stopping distance (real noisy data), ad spend and sales (wide x spread), only 3 data points (df=1) |
| What-if interactivity | Live recompute on every keystroke, chip, pill and mode switch; plus a dedicated x0 slider that ranges 35% beyond the data on each side so the bow-tie flare and extrapolation are both reachable by dragging |
| Visual answer | Scatter + fitted line + PI band + CI band nested inside it + x0 marker drawn as a wide PI bar and a narrow CI bar sharing one centre dot; the observed-x span is shaded so extrapolation reads as "off the spine" |
| Plain-English verdict | Plain box naming both readings in the preset's own words, plus an inference line that names the decision rule and the choice for THIS result |
| Report line | One-line journal-ready summary: fitted value, both intervals, n, s, df, and an `[extrapolated]` tag when it applies |
| R code emitter | Live `lm()` + both `predict()` calls with the data inlined, each followed by R's actual output as a comment |
| Explainer / anatomy | "How this is computed" in 4 steps with the live arithmetic substituted in |
| Below-fold teaching | Formula card (both formulas in MathJax, extra term highlighted, choosing rule), 3 prose sections, method table, 8-question FAQ |

## Spec requirements, and where each one landed

| Spec line | Where |
| --- | --- |
| Paste x,y data rows (two columns) | `#data` textarea -> `PIMath.parseXY()`, wrapping the shared `DataParse.parseMatrix` so headers, tabs/commas/semicolons/spaces and NA rows all work |
| Fit a simple linear regression | `PIMath.fit()`, least squares, verified against `stats::lm` |
| For a user-supplied NEW x0 report BOTH intervals side by side | `.pair` two-pane block: PI pane and CI pane, always both, same centre stated above them |
| At a chosen confidence level | Level pills 90/95/99 + free-entry number field, both synced |
| TEACH the difference: same center, different widths, and WHY | Headline in compare mode is literally "Same centre: X. Different widths."; the `PI is wider by` stat shows the ratio; the plain box says the gap is the noise of a single outcome |
| Both formulas in MathJax with the extra term highlighted | `.fx` card. MathJax v2 (site convention, SVG output). The lone `1` under the PI root is `\color{#b4530f}{\mathbf{1}}` in the PI accent, with a callout dot beneath naming it |
| One-sentence plain-language rule for choosing | `.rule` strip: "if your sentence is about one specific case, use the prediction interval. If it is about the average at that x, use the confidence interval." |
| What-if control on x0 that live-updates both intervals | `#x0r` range input, synced two-way with `#x0` |
| Makes visible that both bands are narrowest at the mean of x and widen away | The bands are drawn across the whole x window, so dragging shows the pinch at xbar directly; a prose section explains the pivot at (xbar, ybar); the plain box calls it out when x0 sits at the mean |
| House-style canvas plot: scatter, fitted line, BOTH bands (CI inside PI), x0 marker | `#plot`. **Drawn as SVG, not `<canvas>`**: every scatter tool on the site is SVG (`grep -c '<canvas'` is 0 across `tools/`), and the house `.viz svg{width:100%;height:auto}` rule, retina crispness and the `aria-label` all depend on it. Read "canvas" as the drawing-surface sense; "house-style" is the binding constraint |
| Flag extrapolation, warn the intervals understate real uncertainty | `#warn` banner beside the x0 control, `(extrapolated)` on the result chip, a sentence appended to the inference line, and the shaded observed-x spine on the plot. The copy says the interval is a floor on the uncertainty, not a bound, because outside the data nothing tests linearity |
| Verdict paragraph a beginner could paste into a report | `.plain` box + `#report` copy line |
| R one-liners: `predict(fit, newdata, interval="prediction")` and `"confidence"` | Emitted live in the R block, both calls, with R's real output as comments |
| Verify EVERY number vs local R `predict()` | See below |
| Malformed paste -> clear message | 6 error paths, each with a human sentence naming the fix |
| Cross-link linear-regression + confidence-interval + related tutorials | Go-deeper chips; the method table links the regression calculator for slope questions; the assumptions FAQ links the diagnostic plot interpreter |

## Pass 1 - R truth table

`Scripts/tool-truth/prediction-interval-calculator.R` -> `prediction-interval-calculator.json`.
R 4.6.0. Ground truth is `stats::lm` + `stats::predict.lm(interval="prediction"|"confidence")`,
never a re-derivation.

7 datasets x several x0 x 3 levels = **105 cells**. Cases 1-4 are the shipped presets, so what a
user loads is exactly what was verified. Coverage includes:

- x0 exactly at `mean(x)` (both bands minimal), interior points, the observed min and max
- **extrapolation on both sides** (`x0 = -1` and `x0 = 16` for the default; `x0 = 25` for cars)
- tiny n=3 (df=1, t=12.7, enormous intervals)
- near-perfect fit (sigma ~ 0.0014), wide x spread, negative slope, duplicated x values

## Pass 2 - math library

`tools/lib/prediction-interval-math.js`, UMD, `window.PIMath` / `require`. No new distribution
primitives: `qt` is `TTestMath.tQuantile` (exact bisection on the exact t CDF, already verified for
the t-test and CI tools) and parsing reuses `DataParse.parseMatrix`.

Gate: `Scripts/tool-truth/test-prediction-interval-calculator-math.js`
**1189 checks, 0 fails, worst relative error 3.2e-12** (bar: 1e-6). Beyond the R cells it asserts
the invariants the page teaches rather than assuming them: PI strictly wider than CI everywhere,
both widths minimal at xbar, the extrapolation flag matching the observed range, n<3 and
zero-variance x refused rather than silently NaN'd.

## Pass 4 - gates

| Gate | Result |
| --- | --- |
| Math vs R | 1189 checks, 0 fails, worst 3.2e-12 |
| Local E2E (`e2e-prediction-interval-calculator.mjs`) | **649 assertions, 0 fails**: every rendered PI/CI/centre against all 105 R cells, the 3 UX features and their two-way sync, extrapolation flagging, slider, level-invariance of the ratio, R emitter, 6 malformed-input paths, viz, copies, SEO/a11y |
| Emitted R actually runs | Extracted from the live DOM, run in R 4.6.0: reproduces the displayed values exactly (PI 70.74791/77.25209 -> page shows 70.748 to 77.252) |
| Chrome check | 1 injected chrome, 0 own mastheads, `.sitenav` present, 71 sidebar links, `.rail-fold` present, icon-only fold |
| Mobile | No horizontal overflow at 360 / 390 / 768 / 1280 |
| Title contract | `Free Prediction Interval Calculator: PI vs CI at x0`, 51ch (bar 40-60) |
| Page audit | Clean except the size note below |

## Known deviation: page weight

`page_audit.mjs` flags `htmlKB > 200`; this page renders **251KB** against 193-209KB for shipped
peers measured on the same local server (`linear-regression-calculator` 205 and
`correlation-calculator` 209 trip the same check locally today).

The entire excess is MathJax, which the spec explicitly required: ~14KB of rendered formula DOM
plus ~15KB of MathJax's own injected CSS. It was already reduced from 279KB by switching MathJax
to SVG output (-24KB), replacing an expensive `\underbrace{\substack{}}` with a coloured term plus
an HTML callout (-4KB), and trimming the band to 48 vertices (-2KB). Going under 200 would mean
dropping MathJax and hand-rolling the formulas, which contradicts the spec and the site's math
convention (every tutorial loads the same MathJax v2 build from the same CDN, so it is warm cache
for most visitors).

Flagged rather than silently shipped or silently dropped. If the owner prefers the size bar over
the MathJax requirement, the fix is local to the `.fx` card.

## Notes

- The 3 old-tool UX features: tool lead under the H1, an "I want to ..." banner whose goal phrase
  is the mode selector, and a live inference line after the results.
- The inference line uses `id="inference-line"`, not `infline`. The audit detects the feature via
  `[id*="inference"]`, which is why peers that *have* the feature still sit on its `NO_INF`
  exemption list. Making the real feature detectable beats adding the page to an exemption list.
- Console 404s on localhost (`/cdn-cgi/trace`, `/api/me`, the CF beacon) are prod-edge endpoints.
  Verified to fail identically on already-shipped tools served from the same server, so the E2E
  filters exactly those three and nothing broader.

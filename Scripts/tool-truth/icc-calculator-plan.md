# icc-calculator - build plan, parity and inspection matrix

Wave-3, Tier 2, reliability cluster. Sibling of `cohens-kappa-calculator` and
`cronbachs-alpha-calculator`.

## Pass 0 - feature inventory

**No predecessor.** Nothing at `tools/icc-calculator.html` in the working tree,
in git history, or on `tools-v2`. So there is no capability to preserve, and the
checklist below is the **depth bar** inherited from the best existing tools
rather than a parity list.

| Depth-bar item | Shipped as |
|---|---|
| Multiple input modes | Wide table (subjects x raters) + long format (subject, rater, score), pivoted client-side |
| Scenario presets | 5 chips: 3 radiologists, Rater bias, 5-point Likert, No agreement, Long format. Every one is a case in the R truth table, so the E2E asserts the rendered numbers against psych |
| Method / option toggles | The 3-question WHICH-ICC picker (design / agreement / unit) + CI level 90-95-99 |
| Plain-English verdict | `#plain`, with a distinct honest branch for negative ICC |
| Live inference line | `#infline`, names the decision rule and the conclusion for this result |
| R code emitter | `#rcodepre`, live, and **verified to actually run**: the emitted script was executed in R 4.6.0 and reproduced the displayed ICC(3,k), its 99% bounds, F and p |
| Explainer + FAQ | "Which ICC do I need?" cards, the six-forms table, the statistic table, 7-question FAQ |
| Visual answer | Koo & Li band gauge with CI bracket + a six-form comparison chart with CI whiskers, pick highlighted |
| Copyable report | APA-style report line + "copy all six" TSV |
| How-computed | 5 steps with live numbers, branching on the selected model |

**The moat** (per the spec: no good interactive competitor exists, so the
guidance IS the product): the picker is not decoration. It is wired to the
headline, the highlighted table row, the viz, the how-computed steps and the R
comment. The Rater-bias preset exists to make the stakes concrete: the same 8
subjects give ICC(3,1) = 0.991 and ICC(1,1) = 0.752, so "which ICC" is worth
more than any amount of decimal places.

## Pass 1 - R truth table

`Scripts/tool-truth/icc-calculator.R` -> `icc-calculator.json`, 16 cases.

**Ground truth is `psych::ICC(x, lmer = FALSE)`, not psych's default.** Probed
first and documented in the script header: `lmer = TRUE` fits with lme4 (REML),
which (a) is an iterative optimizer that agrees with the closed form only to
convergence tolerance (measured ~1.8e-3 on clean balanced data) and (b) clamps
negative variance components at zero, reporting ICC2 = 0.000 where the closed
form gives -0.290. It is not reproducible in JS by construction. `lmer = FALSE`
is the exact Shrout & Fleiss (1979) ANOVA closed form. The page emits
`lmer = FALSE` so the copied code reproduces the displayed numbers, and both the
FAQ and the R comment say why.

Coverage: clean 20x4 at alpha .10/.05/.01, judge bias, k=2 (at .05 and .01),
tiny n=6 (spec edge case), 5-point Likert 12x5, perfect agreement, pure noise
(negative ICC), k=6, moderate mid-band, huge judge effect, clean integer rater
bias (the preset), and exact constant offset.

## Pass 2 - math library

`tools/lib/icc-math.js` (UMD). Composes rather than re-deriving: `pf`/`qf` from
`dist-tables-math` (adaptive inversion, handles the fractional Satterthwaite df)
and its `pvF` for the right tail via the beta symmetry
`I_x(a,b) = 1 - I_{1-x}(b,a)`, so large F values do not underflow through
`1 - pf`. Zero edits to any existing lib.

Harness `Scripts/tool-truth/test-icc-math.js`: **785 checks, 0 failures, worst
relative error 2.03e-11** (gate is 1e-6).

**One waiver, by rule not by case name:** where R's own residual F exceeds 1e20
its SSE is floating-point cancellation noise (~1e-14..1e-28 out of QR) rather
than data, so F, p and MSE are waived there and replaced by a limit assertion
(F = Infinity, p = 0, MSE = 0). Every ICC estimate and every confidence bound is
compared with no waiver, including in those cases.

### Two bugs the truth table caught

1. **ICC2 must not go to 1 when the residual vanishes.** The `exact_offset_6x3`
   case (raters differ by an exact constant) proved the first draft wrong: it
   special-cased MSE = 0 by forcing all two-way ICCs to 1. R gives
   ICC2 = 0.9554, because `k*MSJ/n` survives in its denominator - a constant
   rater offset leaves consistency perfect but caps absolute agreement. The
   point estimates need no special-casing at all; IEEE arithmetic gives the
   right limit. Only the intervals do, and only because they hit Inf/Inf.
2. **The ICC2 interval still exists when MSE = 0.** Its Satterthwaite df has the
   limit `v -> k-1` as `Fj -> infinity`; taking it reproduces R's bounds
   (0.35286845, 0.99449704) to 8 decimals.

### A real psych artefact, reproduced then contained

For sufficiently negative ICC the average-measure transform
`L*k / (1 + L*(k-1))` is singular: on `pure_noise_10x3`, psych reports ICC2k
lower = **+41.16** and upper = **-0.455**, a lower bound above its upper bound.
The library reproduces psych faithfully; the **page** detects `lower > upper` and
prints `n/a` with a caveat explaining the transform, instead of rendering the
artefact as though it were an interval.

## Pass 4 - gates

| Gate | Result |
|---|---|
| 1. Local E2E vs truth table | **362 passed, 0 failed** (`Scripts/tool-truth/e2e-icc.mjs`) |
| 2. Chrome check | 1 injected chrome, 0 own mastheads, no `data-tool-v2`, `.sitenav` present, sidebar 50+ tool links with icons + `.rail-fold`, `.rsft` footer present, no in-page `.ft` footer, tool still computes |
| 3. Mobile 390px | `scrollWidth <= innerWidth + 1`; also checked at 360 / 768 / 1024 / 1280 / 1440 |
| 4. Parity | N/A (new tool); depth bar above, all met |
| 5. CF preview -> master -> prod | polled with a fresh query string for `data-tool-chrome="injected"` |

E2E covers: default paint, 10 truth cases pasted, all 3 CI levels against
separate truth cases, all 8 picker paths (each asserting headline form, value vs
R, highlighted row, and that Q2 hides for non-random designs), long-format pivot
equivalence, missing-data listwise drop, 5 error paths + recovery, every
downstream surface updating together, the ANOVA table vs R's mean squares, 3
copy buttons, 6 viewports, title/desc length, canonical, JSON-LD validity,
aria-live, no em dash, no JetBrains Mono, and zero console errors.

## Inspection matrix

| # | Dimension | Verdict |
|---|---|---|
| 1 | Correctness | PASS - 785 harness + 362 E2E checks vs psych; edge cases incl. k=2, n=6, perfect, exact-offset, negative ICC, singular CI |
| 2 | Feature completeness | PASS - 2 modes, 5 presets, picker, 3 CI levels; loads populated on first paint |
| 3 | Input handling | PASS - 5 distinct human error messages (single row vs single column told apart from the raw shape, not one vague string), junk tolerated, missing rows dropped with a count, fixing input clears the error |
| 4 | Interactivity | PASS - every input recomputes headline, both vizzes, stats, both tables, plain-English, caveat, inference, report, R code and steps together |
| 5 | Visualization | PASS - both vizzes live, labelled, aria-labelled; axis floor adapts to 0 or -1 so the common case gets the full width and band labels stop colliding; a band is only labelled when it has room; values past the axis are drawn at the edge and said so |
| 6 | Communication | PASS - emitted R executed in R 4.6.0 and reproduced the page; verdict judged on the CI lower bound per Koo & Li; 3 old-tool UX features present |
| 7 | UI/UX | PASS - Lab sheet, no AI-tell fonts, no eyebrow, no em dashes, no in-page footer |
| 8 | Responsive | PASS - 360/390/768/1024/1280/1440, no overflow, no stat tile wraps |
| 9 | Performance/health | PASS - zero console errors (CF beacon + `/api/me` excepted: both injected chrome, both 200 on the real origin) |
| 10 | SEO/meta | PASS - title 55ch, desc 157ch, canonical, WebApplication + FAQPage JSON-LD parse |
| 11 | Analytics/trust | PASS - `tool_use` + `tool_copy` wired, consent-mode GA; every trust-line claim literally true |
| 12 | Accessibility | PASS - labelled inputs, aria-live results, keyboard operable, aria-labelled svgs |

### Fixed during the build

- Long-format split regex `[\t,;]+|\s{2,}|\s+` split `"S1, Dr_A, 9"` on the comma
  **and** the following space, yielding empty fields and 0 detected raters.
  Now `[\t,;\s]+` + filter, the same rule `data-parse` uses for grids.
- Two NUL bytes were introduced into the source by the write pipeline where a
  `' '` separator was intended, corrupting the long-format pivot key. Replaced
  with a `JSON.stringify` composite key.
- The error path called `drawGauge(null)` without the new domain argument after
  the adaptive-axis change, making every SVG coordinate NaN. Caught by the
  zero-console-errors assertion.
- The stat grid's 4-across media query keyed on **viewport** width, but the
  injected sidebar takes 292px, so at 1024px the tiles were too narrow for
  `[-0.519, -0.116]` and wrapped. Breakpoint moved to 1180px and asserted at
  six widths.

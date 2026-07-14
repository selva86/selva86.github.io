# Parity checklist - lm-output-interpreter reskin (Lab-sheet v2)

Source of parity: the pre-reskin `tools/lm-output-interpreter.html` (softwareVersion 2.1,
IBM Plex design system, ~260KB). Reskin target: t-test-calculator.html Lab-sheet shell
(Inter/Inter Tight, injected chrome/footer). Math is R-verified (`lm-math.js` harness
338 PASS / 0 FAIL) and NOT rebuilt. Every capability below ships in v2 or is dropped only
with a stated reason.

## Modes / interval types
- [x] Mode: **Single model** (default)
- [x] Mode: **Compare 2+ models** (up to 5; add/remove model blocks)
- [x] CI level toggle **90% / 95% / 99%** (drives coefficient CIs + forest plot CI width)

## Scenario presets (6)
- [x] mtcars  `mpg ~ wt + hp`
- [x] iris  `Sepal.Length ~ Sepal.Width + Species` (factor + numeric)
- [x] factor  `score ~ method + age` (categorical, k-1 dummies)
- [x] interaction  `mpg ~ wt * hp`
- [x] poly  `mpg ~ poly(hp, 2)`
- [x] custom  (paste your own)
- [x] default paint = mtcars loaded on boot (never an empty tool)

## Input handling
- [x] Paste textarea(s); compare mode labels Model A / B / ... with remove (x)
- [x] Parser handles: Call/formula, Residuals quantiles, Coefficients table with stars,
      aliased `NA` rows, `< 2e-16`, scientific notation, Signif codes line, Residual SE + df,
      Multiple/Adjusted R-squared, F-statistic line
- [x] Exact recompute of model F p-value via LMMath.fPValue (printed value often truncated)
- [x] Parse status line (parsed / N coefficients / df / R^2), warning + error states

## Single-model output
- [x] live-summary sentence (predictors, % variance, F, sig count)
- [x] decision-card verdict (broken / solid / weak) with icon + rationale
- [x] Call display (monospace)
- [x] Coefficient table: name, estimate, SE, t, p (+ sig stars), CI at chosen level (exact qt)
- [x] Fit grid: R^2, Adj R^2, F(df1,df2), F p-value
- [x] Fit explanation text (variance-share language + F verdict + residual SE)
- [x] Per-coefficient plain-English reads: intercept, continuous slope, factor level,
      interaction, polynomial, aliased - each with pVerdict badge
- [x] Diagnostic callouts: aliased, low df, R^2>0.99, no explanatory power, extreme t,
      multicollinearity, large RSE/intercept
- [x] Journal-ready report line + Copy button (fires tool_copy)

## Compare output
- [x] Comparison table: formula, n, residual df, R^2, adj R^2, residual SE, F, F p, AIC, BIC,
      logLik - per-row winner highlight
- [x] Different-n guard callout (AIC/BIC not comparable across n)
- [x] Nested anova F-test callout (isNested detection -> F + p verdict)
- [x] Non-nested info callout (use AIC/BIC)
- [x] Verdict/recommendation paragraph (AIC/BIC winner + delta interpretation, agree/disagree)
- [x] Caveats block (AIC vs BIC, delta<2 rule, F-test nested-only, same-data)

## Visualization (forest plot / compare bars)
- [x] Single: coefficient forest plot (estimate +/- CI per term, zero ref, sig terms accent)
- [x] Compare: side-by-side R^2 / AIC bars per model, leader highlighted
- [x] viz-caption + viz-readout live, aria-label on svg

## R code emitter (copy-ready, live)
- [x] Single: lm fit, summary, confint(level), plot diagnostics, broom::tidy, glance
- [x] Compare: fit1/fit2, summary both, AIC/BIC/anova, broom::tidy
- [x] Copy button (fires tool_copy)

## 3 old-tool UX features (mandatory)
- [x] Tool lead under H1 (what lm answers, what to paste, what you get back)
- [x] "I want to ..." banner with inline mode selector = banner-sentence (#banner-sentence)
- [x] Live inference line after results (#inference-banner)

## Explainers / context
- [x] 4-min primer dropdown (what lm does, coef table, R^2/F/residuals, picking a model)
- [x] Method context (use-when / example / inputs-needed per mode) - render compactly
- [x] "Anatomy of summary(lm)" explainer: 5 formula+prose steps (SS/R^2, coef SE+t, overall F,
      residual SE, nested anova F)
- [x] "When this is the wrong tool" alt-list (glm, mixed, VIF, diagnostic plot, time-series)
- [x] Trust line (no data leaves browser / verified vs lm(), confint() & anova() / free)
- [x] Numerical-accuracy note

## FAQ (3, matches FAQPage JSON-LD)
- [x] (Intercept) row meaning
- [x] negative coefficient interpretation
- [x] R-squared vs adjusted R-squared

## Further reading (8 links)
- [x] Linear-Regression, assumptions, diagnostics, interaction, dummy vars, poly/spline,
      model-selection, confidence-interval-calculator

## SEO / meta / analytics (reuse verbatim where valid)
- [x] Title 40-60ch (current 52ch: "Free lm() Output Interpreter: Read Your R Regression")
- [x] meta description, canonical, OG/Twitter
- [x] JSON-LD: WebApplication + BreadcrumbList + FAQPage
- [x] tool_use once, tool_copy on report + rcode
- [x] consent-mode GA (G-D5XKCMN7FR) + consent-banner.js + CF beacon
- [x] window.runSmokeTests console harness + toast notifications

## Deliberately dropped (with reason, taught or harmless)
- Bespoke masthead + `.scenario-chip` in masthead: replaced by injected site chrome (owner rule).
- `.tool-meta` line: was `display:none` in v1 (redundant with tool-lead) - dropped.
- 3-column "workshop" (ws-method/ws-inputs/ws-output) layout: the old-design signature the
  owner flagged; replaced by Lab-sheet hero + 2-col grid. No capability lost (method context
  preserved as a compact collapsible; all render targets retained).
- IBM Plex font stack: replaced by Inter / Inter Tight / ui-monospace (design gate).

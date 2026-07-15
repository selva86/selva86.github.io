# anova-calculator - build plan + parity checklist (wave-3)

## What it is (distinctness)
A CALCULATOR: computes a full ANOVA table from RAW pasted group data. This is
DISTINCT from the existing `anova-output-interpreter`, which decodes a printed
`summary(aov())` / `car::Anova()` table someone already ran. Cross-link both
ways ("already have R's table? use the interpreter"); never duplicate.

## Pass 0 - depth bar (new tool, no predecessor)
Inherit the best-tool depth bar: multiple modes, scenario presets, plain-English
verdict, R emitter, explainer + FAQ, live viz.

- [x] Two modes: One-way ANOVA + Two-way ANOVA (factorial with interaction)
- [x] Scenario preset chips per mode (real R-dataset numbers: PlantGrowth,
      ToothGrowth) + a couple of hand cases
- [x] Full ANOVA table: SS / df / MS / F / p per term + Residuals + Total
- [x] Effect sizes: eta^2 (+ omega^2, Cohen's f for one-way; partial eta^2 two-way)
- [x] Group / cell summary stats (n, mean, sd, se)
- [x] Assumption check: Levene (Brown-Forsythe, median-centered) for one-way;
      residual note for two-way
- [x] Visual answer: group-means plot with 95% CI bars + shaded F-distribution
      tail (the p-value made visible)
- [x] Plain-English verdict + decisive inference line + copyable report line
- [x] Runnable `aov()` R emitter (long-format data + summary + effectsize + Levene)
- [x] Method table + FAQ + go-deeper links
- [x] The 3 old-tool UX features: tool lead under H1, "I want to <mode>" banner,
      live inference line

## Math (Pass 1-2) - VERIFIED
`tools/lib/anova-math.js` extended additively (interpreter primitives untouched):
- `oneWay(groups,{conf})` - SS_b/SS_w from raw groups, reuse `termStats` for
  F/p/eta^2/omega^2/Cohen's f, `levene()` Brown-Forsythe.
- `twoWay(a,b,y)` - Type I sequential SS via nested-model residual-SS
  differences (RSS0 -> RSS(A) -> RSS(A+B, OLS) -> RSS(full)); matches
  `summary(aov(y~A*B))` for balanced AND unbalanced. Gaussian-elim OLS for the
  additive model.
- Ground truth `anova-calculator.R` (R 4.6.0: aov, car::leveneTest,
  effectsize::eta_squared/omega_squared). Node harness: 254 checks pass.
- Documented waivers: (1) omega^2 raw negative -> page FLOORS at 0 like
  effectsize; (2) Levene 0/0 for all-equal spreads (n=2 all groups) -> NaN ->
  page shows n/a (R returns perfect-fit FP noise and warns).

## Shell / gates (Pass 3-4)
- Lab-sheet v2 shell (strip linear-regression-calculator.html), NO bespoke
  masthead, NO data-tool-v2, NO in-page footer, no eyebrow kicker, no em dashes,
  no JetBrains Mono. build.py injects chrome.
- Local Playwright E2E vs truth table (both modes), chrome-injection check,
  390px overflow, then CF preview / master / prod poll.

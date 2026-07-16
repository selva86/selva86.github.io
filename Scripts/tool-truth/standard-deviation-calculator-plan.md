# Standard Deviation Calculator - build plan

## Pass 0 - Feature inventory / parity

No predecessor tool exists (`git log`, `tools/` scan: only descriptive-statistics,
iqr, percentile, z-score-percentile are related, none is a standard-deviation
calculator). This is a NEW tool, so it inherits the depth bar of the best tools:
two input modes, scenario presets, plain-English verdict, live R emitter, a full
shows-work derivation, explainer + method table + FAQ, cross-links.

The differentiator vs calculator.net is the taught step-by-step derivation:
deviations table -> sum of squares -> BOTH denominators (n-1 and n) side by side,
with the Bessel's-correction story explained, not just a number.

## Modes

1. `data`  - paste a list of numbers -> sample & population SD/variance, mean, n,
   SE of the mean, CV, min/max/range, full derivation.
2. `freq`  - paste a frequency table (value, count per line) -> expands
   rep(values, counts) and runs the same math (reuses ALL verified functions).
   Counts must be positive integers.

Estimator toggle (sample n-1 / population n) picks the headline answer and which
denominator the derivation emphasises; BOTH are always shown in the stats grid.

## Math (reuse, additive)

- `tools/lib/data-parse.js` (numericVector for data mode, parseMatrix for freq).
- `tools/lib/descriptive-math.js` `describe()` already returns mean/sum/median/
  sd/var/sdPop/varPop/se/cv/cvPop/min/max/range. Added ONE additive field: `ss`
  (sum of squared deviations) for the shows-work. No behaviour change to callers.
- Loads ttest-math -> data-parse -> descriptive-math (descriptive factory needs
  TTestMath.tQuantile at load).

## Truth table

`standard-deviation-calculator.R` -> R 4.6.0 base: mean/sum/var/sd + pop var/sd
(`sum((x-m)^2)/n`), ss, se = sd/sqrt(n), cv = sd/mean, cvPop = sdPop/mean.
Edge cases: n=1 (sample sd NA), n=2, constant sample (sd 0), negatives, decimals,
mixed magnitudes, and 5 frequency-table cases via rep(). Node harness:
17 cases / 238 checks / worst rel 3.8e-16.

## Viz

Horizontal spread strip: axis with ticks, mean line, shaded +/-1 SD and +/-2 SD
bands (selected estimator), data points as dots (data mode) or count-scaled
lollipops (freq mode), coloured by which band they fall in. aria-label.

## 3 old-tool UX features

- Tool lead under H1 (what SD answers, what to paste, what comes back).
- "I want to compute the standard deviation of [a list of numbers / a frequency
  table]" banner select synced to the mode pills.
- Live inference line after results (names the estimator + the spread conclusion).

## Cross-links

descriptive-statistics-calculator, iqr-calculator, percentile-calculator,
z-score-percentile.

## Registration

COMPENDIUM_TOOLS + icon (build.py), CATEGORIES + C3META (gen_tools_landing.py),
tool-audit/tool-list.json, ?v content-hash pins on the three libs.

# Build plan — Mean, Median & Mode Calculator

## Pass 0 — Feature inventory / parity
NEW tool. No predecessor (checked tools/, git history — none). So parity =
inherit the depth bar of the best existing v2 tools (standard-deviation,
descriptive-statistics), not a migration checklist.

Depth-bar capabilities shipped:
- [x] Two modes via the "I want to..." selector: `data` (paste a list) and
      `freq` (a value+count frequency table). Reuses the SD frequency machinery
      (rep-expand -> describe()).
- [x] Scenario chips (presets) per mode — realistic, non-empty first paint.
- [x] Visual answer: a distribution strip/histogram with the mean line and the
      median line drawn where they fall + a mode marker. This IS the skewness
      teaching visual (mean pulled toward the long tail).
- [x] Stats grid: Mean, Median, Mode, Range, Midrange, Min, Max, n.
- [x] Plain-English box + decisive inference line (skew read: which of
      mean/median is the more trustworthy summary for THIS data).
- [x] Copyable report line (journal-ready).
- [x] How-computed collapsible with live numbers on the user's data.
- [x] Live "same thing in R" code block (incl. the honest mode snippet).
- [x] Trust line, method table, FAQ (unified injected-chrome accordion),
      go-deeper cross-links.
- [x] 3 old-tool UX features: tool lead under H1, "I want to..." mode-selector
      banner before inputs, live inference line after results.

## Central-tendency honesty rules (the differentiator)
- Mode: report ALL values tied at the maximum frequency.
  - modeFreq == 1 and n > 1  -> "No mode" (every value appears once).
  - n == 1                    -> the single value is trivially the mode.
  - two ties                 -> "bimodal"; 3+ -> "multimodal".
- R has no built-in mode: teach `ux <- unique(x); tab <- tabulate(match(x,ux));
  ux[tab == max(tab)]` (all modes) and note `names(which.max(table(x)))` returns
  only the first. Both shown in the R block / method table.
- Skewness note: when mean > median (right skew) or mean < median (left skew),
  say the median is the more representative center and WHY (the tail pulls the
  mean). When mean ~= median, say the mean is a fine summary.

## Math
Reuse tools/lib/descriptive-math.js (already has mean/median/min/max/range/
skewness + modesOf with the multimodal + no-mode convention). Added ONE additive
field: `midrange = (min+max)/2`. No behaviour change to existing callers, so
their stale ?v pins stay valid; this tool pins the new hash (?v=2659ddd4).
Data-parse.js reused unchanged (?v=2dcfaba1); ttest-math.js unchanged (?v=53c42e8a).

## Verification
Scripts/tool-truth/mean-median-mode-calculator.R -> .json (20 cases: symmetric,
skewed both ways, income long-tail, bimodal, multimodal, all-unique/no-mode,
constant, n=1, n=2, negatives, decimals, grades, + 5 frequency cases incl a
tie). test-mean-median-mode-calculator-math.js: 200 checks pass, worst rel
5.25e-15. Emitted R re-runs and reproduces displayed mean/median/mode/range.

## Cross-links
standard-deviation-calculator, iqr-calculator, descriptive-statistics-calculator
(per spec) + z-score-percentile.

## Registration
COMPENDIUM_TOOLS + icon (build.py), CATEGORIES + C3META (gen_tools_landing.py),
tool-audit/tool-list.json, content-hash ?v pin on descriptive-math.js.

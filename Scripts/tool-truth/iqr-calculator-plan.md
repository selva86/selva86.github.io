# iqr-calculator - build plan

New Tool Farm v2 tool (no predecessor -> inherit the depth bar of the best tools:
multiple modes, scenario presets, plain-English verdict, R emitter, explainer + FAQ,
live visual). Wave-3.

## What it does
Paste raw data -> Q1 / median / Q3, IQR, 1.5xIQR and 3xIQR fences, five-number
summary, explicitly listed outliers (mild vs extreme), and a labeled boxplot-style
visual marking the box, whiskers, fences and outlier points. R type-7 quantile
default (matches IQR() / quantile()) with a type-6 toggle and the type note.

## Modes ("I want to ...")
1. `data` (default) - flag outliers in raw data. Full analysis + boxplot.
2. `summary` - IQR & fences from Q1 and Q3 (optional value to classify).

## Reuse (no new lib file)
- descriptive-math.js (from percentile/descriptive builds): quantileType (type 7/6),
  fivenum, describe(), plus NEW additive boxplotStats(sorted, coef) = exact
  stats::boxplot.stats reproduction (fivenum hinges + hinge fences + out list).
- data-parse.js: numericVector paste parsing. Load order: ttest-math -> data-parse
  -> descriptive-math (descriptive-math factory needs TTestMath at load).

## Math decision (verified in R)
The tool computes Q1/Q3/IQR/fences/outliers from **type-7 quartiles** (the IQR()
and quantile() default). Verified in the truth table that type-7 fence outliers
== boxplot.stats(x)$out for all 16 datasets (the two fence definitions differ
slightly but no point falls in the gap on sensible data). R's boxplot()/fivenum()
use Tukey hinges - shown as the five-number summary and taught in the method note.
Mild outlier = beyond 1.5xIQR, within 3xIQR; extreme = beyond 3xIQR (Tukey far-out).

## Verification
- Scripts/tool-truth/iqr-calculator.R -> .json (quantile 7/6, IQR, fivenum,
  boxplot.stats$stats/$out at coef 1.5 and 3, type-7 fences/outliers).
- test-iqr-calculator-math.js: 423/423 pass, worst rel 2.5e-16.

## Scenarios (match truth datasets for E2E)
- exam    (no outliers)
- salary  (one extreme high, 240000)
- response (two extreme high API latencies)
- sensor  (mild low 18.9 + extreme high 28.9)  <- default (shows full classification)

## Depth-bar checklist
- [x] 2 modes + inline "I want to" selector synced with pills
- [x] scenario chips (4 presets)
- [x] type 7/6 method toggle (the type note)
- [x] labeled boxplot viz: box, median, whiskers, inner+outer fences, outlier dots
- [x] verdict headline + vchip + plain-English box + live inference line
- [x] stats grid (Q1/med/Q3/IQR + fences/min/max) + five-number summary + outlier list
- [x] copyable report line + Copy table + live R code (quantile/IQR/fivenum/boxplot.stats)
- [x] how-computed collapsible with live numbers
- [x] trust line (every claim literally true), method table, FAQ, go-deeper links
- [x] tool_use / tool_copy GA, consent-mode + CF beacon
- [x] no em dashes, no eyebrow kicker, no JetBrains Mono, no in-page footer

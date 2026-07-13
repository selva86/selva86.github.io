# outlier-detection-calculator v2 build plan

## Pass 0 - Feature inventory (from existing v1 tool, tools/outlier-detection-calculator.html)
Existing tool signals: WebR compute (no math lib), IBM Plex fonts, non-contract title,
divergent shell (.shell/.workshop/.ws-*), baked chrome-aware CSS. => FULL REBUILD.

Capabilities to preserve (parity checklist):
- [x] 4 methods: Grubbs (two-sided single), Generalized ESD (Rosner), Hampel (MAD), Tukey IQR
- [x] alpha selector {0.10, 0.05, 0.01} (Grubbs + ESD)
- [x] ESD max-outliers k (default 5, 1..20)
- [x] Hampel k multiplier (default 3)
- [x] Tukey IQR multiplier coef (default 1.5, +3.0)
- [x] scenario presets (was 6; ship 5 clean ones + custom via editing)
- [x] tool lead under H1 (.dek)
- [x] "I want to ..." mode-selector banner (.iwant)
- [x] live inference line (.infline)
- [x] visual answer (SVG strip/dot plot with fences + flagged points)
- [x] method-adaptive stats grid + plain-English box + copy report line
- [x] how-computed collapsible with live numbers
- [x] live R code emitter per method
- [x] method comparison table + FAQ + go-deeper links
- Dropped: WebR live runtime (replaced by instant JS lib; R shown as copyable code). Reason: instant recompute, never name the runtime.

## Pass 1 - R truth table  [DONE]
Scripts/tool-truth/outlier.R -> outlier.json (93 cases).
Ground truth: outliers::grubbs.test (+ qgrubbs Gcrit), EnvStats::rosnerTest (+ rosnerTestLambda),
stats::median/mad(1.4826), grDevices::boxplot.stats(fivenum hinges).
Edge cases: nearconst (G=max, p=0), tiny n=3, ties, negatives, decimals, even-median, lognormal, low-side, both-tails.

## Pass 2 - math lib  [DONE, GREEN]
tools/lib/outlier-math.js (UMD, reuses ttest-math tCDF/tQuantile).
Gate Scripts/tool-truth/test-outlier-math.js: 1008 assertions, 0 fails, max rel err 8.0e-14.

## Pass 3 - page  [IN PROGRESS]
Shell copied from tools/t-test-calculator.html (current Lab-sheet standard).
Title (60ch): "Free Outlier Detection Calculator: Grubbs, ESD, Hampel & IQR".
No data-tool-v2, no own masthead, no in-page footer. Inter fonts. No em dashes. system mono for code.

## Pass 4 - gates
1. Local E2E Playwright vs truth table (all methods) + chrome check + mobile 390 + parity + CF preview.

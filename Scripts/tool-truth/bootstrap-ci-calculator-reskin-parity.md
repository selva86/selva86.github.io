# Reskin parity checklist - bootstrap-ci-calculator

Source of parity = the pre-reskin `tools/bootstrap-ci-calculator.html` (old IBM-Plex / lean-navy
shell, ~226KB, 75 IBM Plex refs, double-injected chrome). Target = the Lab-sheet v2 shell
(copied from `tools/chi-square-calculator.html`). Math + features are R-verified and unchanged;
only the design system, page weight, and UI-JS location change.

Every old capability below ships in v2 in the same or better form, or is dropped ONLY with a
stated, on-page reason.

## Modes / statistics (the "mode" axis) - 6, all kept
- [x] mean  -> mode pill + banner select
- [x] median -> mode pill + banner select
- [x] SD -> mode pill + banner select
- [x] IQR -> mode pill + banner select
- [x] 90th percentile (p90) -> mode pill + banner select
- [x] custom function (JS expression of x[]) -> mode pill + banner select, reveals `#custom-fn`

## CI method toggle - 4, all kept (results show all four side by side)
- [x] Normal (norm)
- [x] Percentile (perc)
- [x] Basic (basic)
- [x] BCa (bca, default) + BCa-fallback-to-percentile on degenerate distribution

## Confidence level - 4 pills, all kept
- [x] 80% / 90% / 95% (default) / 99%

## Inputs - all kept, same ids so ported JS binds unchanged
- [x] Raw data textarea `#data-input` (one value per line, or comma/space/semicolon separated)
- [x] Statistic select `#stat-pick` (mode) + custom function input `#custom-fn` / `#custom-fn-row`
- [x] Resample count `#B-input` (200..50000, default 2000)
- [x] Method picker `#method-picker` (4 pills)
- [x] Confidence picker `#conf-picker` (4 pills)
- [x] Random seed `#seed-input` (default 42) - reproducible via R Mersenne-Twister

## Scenario presets - 6, all kept (deterministic samplers via BM.RRNG)
- [x] meanNormal - Mean of n=30 normal
- [x] medianLognormal - Median of n=100 lognormal
- [x] sdOutlier - SD with outliers
- [x] iqrLarge - IQR of n=200
- [x] p90 - 90th percentile
- [x] custom - Use my own data
- [x] scenario context card (icon + title + story) + clear button

## Outputs - all kept
- [x] Verdict headline (selected method CI, level) + verdict line (theta-hat, bias, SE) -> `.res`
- [x] Stats grid: n, theta-hat, bias, SE, B -> `.stats`
- [x] All-four-intervals comparison table (method / lower / upper / width, active row tagged) -> method table
- [x] Diagnostic callouts: small n (<10), BCa needs B>=1000, BCa fallback, constant-data point mass
- [x] Bootstrap-distribution histogram SVG with CI band, bound lines, theta-hat marker, ticks
- [x] Interactive viz sliders (B / level / seed what-if) `#viz-sliders` + live readout
- [x] Plain-English read box `.plain`
- [x] Live inference line `#inference-banner` (`.infline`)
- [x] Recap fields (n, theta-hat, B, method, 1-alpha, CI lo/hi, bias, SE, seed, elapsed) ->
      folded into stats grid + method table + copyable report line + viz caption (elapsed ms in caption)
- [x] Copyable report line `.copyrow` (journal-ready)

## R code emitter - kept
- [x] `library(boot)` + data vector + stat_fn + set.seed + boot() + boot.ci(type=c("norm","basic","perc","bca")) + b$t0 / bias / SE
- [~] RUNNABLE in-browser R (old WebR editor) -> rendered as a STATIC, copyable `.rcode` block.
      REASON (on-page + uniform v2 rule): every Lab-sheet tool ships the R as verified, copyable code,
      not an in-page runtime; the emitter and its exact reproducibility are unchanged. WebR CSS/JS
      dropped (it was unused by the compute path; math runs in bootstrap-math.js). Reduces page weight.

## The 3 owner UX features - all kept
- [x] Tool lead (`.dek`) - plain-language explainer under H1
- [x] "I want to ..." banner with inline mode select (`.iwant` / `.psel`), contains literal "I want to"
- [x] Live inference line after results (`.infline` `#inference-banner`)

## Explainer / below-fold sections - all kept
- [x] 4-min primer (`.primer` details)
- [x] Anatomy: 6 steps (resampling, normal, percentile, basic, BCa, bias/SE) -> `.sect .anat`
- [x] "When the bootstrap is the wrong tool" - 6-row table -> `.sect` table
- [x] Further reading / Go deeper links (5) -> `.sect .rel`
- [x] Numerical-accuracy note
- [x] Visible FAQ (`.sect.faq` details) - ADDED in v2 (old page had FAQPage JSON-LD only); reuses the 3 schema Q&A + 2 more

## Metadata - kept, title updated to house style
- [x] Meta description (verbatim, 50-170ch)
- [x] Canonical, OG, Twitter
- [x] JSON-LD: WebApplication + BreadcrumbList + FAQPage (verbatim content; name/og-title aligned to new title)
- [~] Title -> "Free Bootstrap Confidence Interval Calculator (BCa)" (51ch, house "Free ... Calculator" pattern),
      dropping the old "&middot; r-statistics.co" suffix to match t-test/chi-square/ab-test v2 tools. Old 42ch also passed.

## Analytics / trust - kept
- [x] tool_use (first input) + tool_copy (copy clicks) GA events
- [x] Consent-mode GA block + consent-banner.js + Cloudflare beacon
- [x] Trust line: No data leaves your browser / Verified against R's boot.ci() / Free

# nonparametric — build plan & parity checklist

Slug: `nonparametric` (rebuild of `nonparametric-test-picker`, mirrors the
diagnostic-plot-interpreter -> diagnostic-plot rename). Old URL gets a
client-redirect stub.

## Pass 0 — Feature inventory of tools/nonparametric-test-picker.html (v1, WebR)

Title: "Non-Parametric Test Picker". Desc mentions Mann-Whitney U, Wilcoxon
signed-rank, Kruskal-Wallis, Sign test; test statistic, p-value, effect size,
Hodges-Lehmann CI.

### Modes (test-pick select) — PARITY REQUIRED
1. Mann-Whitney U (two independent groups) -> wilcox.test(x, y)
2. Wilcoxon signed-rank (paired or one-sample) -> wilcox.test(x, y, paired=TRUE) / wilcox.test(x, mu=)
3. Kruskal-Wallis (three or more groups) -> kruskal.test(list)
4. Sign test (direction only) -> binom.test on positive/negative counts

### Params — PARITY REQUIRED
- alpha-pick: 0.10 / 0.05 / 0.01
- sided-pick: two-sided / less / greater
- cc-picker: continuity correction on/off (normal-approx path)
- tie-picker: ties handling note/toggle

### Inputs
- data-input textarea; paste-label changes per mode; multi-column parse
  (columns = groups). One-sample needs a mu field.

### Outputs / features — PARITY REQUIRED
- result-display (U/W/V/H statistic), result-label, result-aux, result-bounds (HL CI)
- p-value, exact vs normal-approx decision shown
- Effect sizes: rank-biserial correlation (= Cliff's delta for MWU), epsilon-squared (KW), Hodges-Lehmann estimate + CI
- Visualization (viz-svg) with what-if sliders (viz-sliders), caption, readout
- Per-method explainer that updates: intro / use-when / inputs-needed / example
- Scenario chips: mwu, paired, kw, ordinal, ties, custom (each with a story)
- recap-mini rows
- R code emitter (wilcox.test / kruskal.test / binom.test)
- The 3 UX features: tool lead, "I want to ..." banner (mode selector), inference line
- FAQ: primer, when to use, read more, caveats

### Dropped / changed (with reason, taught on-page)
- WebR runtime dropped (v2 rule): all math in nonparametric-math.js, R-verified.
- Tie-aware EXACT p-values (R 4.6.0 default): tool uses the classic rule —
  exact only when no ties/zeros and n small; otherwise normal approximation
  with continuity + tie/zero variance correction. The emitted R code PINS
  `exact=`/`correct=` so the displayed value always reproduces in R. Taught in
  the method table + an "exact vs approximate" explainer.

## Decision rule (matches R when exact/correct pinned)
- MWU exact: nx<50 && ny<50 && no ties -> pwilcox. Else normal approx.
- Signed-rank exact: n<50 && no ties && no zeros -> psignrank. Else normal approx.
- KW: chi-square approx with tie correction (always).
- Sign test: exact binom.test (always).

## Math to reproduce (nonparametric-math.js)
- rank() ties="average"; median(); tie/zero corrections.
- dwilcox/pwilcox/qwilcox DP; dsignrank/psignrank/qsignrank DP.
- Normal approx z with continuity correction (Edgeworth terms only if correct>1;
  we use correct=1 default -> plain 0.5 correction, F() returns pnorm).
- HL estimate + CI: exact (diffs[qu], diffs[ql+1] via qwilcox/qsignrank) and
  asymptotic (uniroot/zeroin2 port, tol=1e-4) — ported from R source.
- Effect sizes cross-checked vs effectsize::rank_biserial / rank_epsilon_squared.
- Sign test: binom.test two-sided (dbinom<=d*relErr) + Clopper-Pearson CI (reuse ci-math exactCI).
- KW p = pchisq upper (reuse ci-math chisqCDF / normal-math gammq).

## Reuse
- normal-math.js: pnorm, qnorm, gammq, lgamma.
- ci-math.js: chisqCDF, qchisq, qbeta, exactCI (sign-test CI).
- ttest-math.js: ibeta (via ci-math).

## Pass 4 results (all green)
- Node harness: 179 checks, 0 fail (exact ~1e-9, p/stat/effect 1e-6, asymp CI 2e-5).
- Local E2E (Playwright, clean + chrome-injected page): 175 checks, 0 fail across all
  32 truth cases + error handling (empty/junk/one-col/mismatch) + per-mode UI toggles.
- effectsize cross-check in R: rank-biserial + epsilon^2 match to 0/1e-16.
- Chrome: 1 injected chrome, 0 bespoke masthead, canonical .sitenav navbar, sidebar
  438 links + 27 icons + rail-fold. Tool computes with chrome.
- Mobile 390px: document scrollWidth 375 <= 390 (mtab scrolls inside .tscroll).
- Console: only /api/me 404 (localhost backend absent, like CF-beacon exception).

## Parity checklist vs v1 (all shipped)
- 4 modes (MWU, signed-rank, KW, sign) ........... shipped (pills + I-want-to select)
- alpha 0.10/0.05/0.01, alternative, continuity cc  shipped (per-mode show/hide)
- one-sample mu ................................... shipped (auto-detected 1 col)
- scenario presets (6 chips w/ story) ............ shipped, mapped to truth cases
- statistic + exact/approx p ..................... shipped, decision shown
- effect sizes (rank-biserial/Cliff, epsilon^2) .. shipped (effectsize-matched)
- Hodges-Lehmann estimate + CI ................... shipped (exact + asymptotic)
- visualization (value/difference strip) ......... shipped, live, aria-label
- per-method explainer (how-computed, updates) ... shipped
- R code emitter (pins exact=/correct=) .......... shipped, reproduces displayed value
- 3 UX features (lead, banner, inference) ........ shipped
- FAQ + method table + go-deeper ................. shipped
- DROPPED: WebR runtime -> R-verified JS lib (v2 rule); tie-aware exact p (classic
  rule instead, taught on-page); what-if sliders -> live recompute on every edit.

# Wave 1: New Tools (owner-approved 2026-07-13)

SERP-validated shortlist (SerpAPI scan 2026-07-13: no interactive tool ranks for any of these; competitors are static tables / dated UIs). Build order below. Every tool follows `/write-tool` (Pass 0-4 gates, R truth table, UMD lib, Lab sheet shell, injected chrome, the 3 UX features, 12-dim rubric). These are NEW tools: no predecessor parity, but the depth bar = best existing tools. NO compromise on features - the specs below are the MINIMUM scope. No JBM, no em-dash, no stat-triplet copy ([[feedback_ai_tells]]).

Queue position: after the 17-tool rebuild queue completes (reprex is last), then W1 order: 1 -> 2 -> 3 -> 4 -> 5.

## W1.1 `statistical-test-chooser` - Statistical Test Chooser

The strategic hub tool: wizard -> the right test -> our calculator/tutorial.
- **Wizard inputs:** goal (compare groups / relationship / prediction / describe / time-to-event / agreement), outcome type (continuous / binary / count / ordinal), predictor(s)/groups (1, 2, 3+), paired vs independent, normality (yes / no / unsure -> point to normality tools), equal variances, sample size band.
- **Output card:** recommended test + one-line why + assumptions checklist + runnable R code + parametric<->nonparametric alternative + direct links to OUR matching calculator + tutorial + exercises.
- **Coverage matrix (min 30 endpoints):** one/two-sample & paired t, Welch, Mann-Whitney, Wilcoxon signed-rank, sign test, one-way/repeated ANOVA, Welch ANOVA, Kruskal-Wallis, Friedman, chi-square (GoF + independence), Fisher exact, McNemar, Cochran Q, Pearson/Spearman/Kendall, simple/multiple/logistic/Poisson regression, log-rank, Cox, kappa, ICC, z-test for proportions (1&2 sample), binomial test.
- **SEO-critical:** the FULL decision tree must also exist as server-rendered on-page content (crawlable text sections per goal, not just the JS wizard). Wizard state in URL hash (shareable).
- **Truth table:** deterministic scenario->test mapping, >=40 E2E paths asserted vs a fixture JSON reviewed against Zar/UCLA guides. No Rscript needed for the mapping; R code snippets on the card must be run-verified in R 4.6.0 (syntax + example output).
- I want to... `<select: find the right statistical test / check my test's assumptions / ...>`.

## W1.2 `t-table` + `z-table` - Interactive Critical Value Tables (ONE worker run, ONE lib)

- **Lib `dist-tables-math.js`:** qt/pt, qnorm/pnorm, qchisq/pchisq, qf/pf (reuse ttest-math/normal-math primitives; add chisq/F quantiles if missing from ci-math). Truth: R grid >=600 cases (df 1-200 incl. fractional, alpha .10/.05/.025/.01/.005/.001, one/two-tailed, extremes).
- **`t-table.html`:** interactive lookup (df + alpha + tails -> highlighted cell), full printable t-table (server-rendered - THIS is what ranks for "t table"), shaded t-curve visual synced to selection, reverse mode (t + df -> p), copy `qt(0.975, df=n)` R code, common-cutoffs chips (95% CI, one-tailed .05...).
- **`z-table.html`:** same shell for standard normal: z -> area (left/right/between/beyond), area -> z, full printable z-table (both signs), curve visual, `qnorm/pnorm` code.
- Both pages fully server-rendered tables for SEO; JS enhances. chi-square-table + f-table are fast-follows on the same lib (wave 2).

## W1.3 `p-value-calculator` - p-value Calculator

- **Modes:** from t (+df), z, chi-square (+df), F (+df1/df2), r (+n); one/two-tailed where applicable; inverse mode (alpha -> critical value).
- Shaded curve per mode, p to 4 sig figs + scientific for p<1e-4, verdict line vs user-set alpha (the inference line: "Since p = 0.0031 < 0.05, reject H0..."), report line (APA: t(24) = 2.31, p = .030), R code per mode.
- **Truth:** R pt/pnorm/pchisq/pf grid >=400 cases incl. extremes (|t|>30, df=1, p underflow), both tails, inverse cases.
- Scenario chips: common exam values. Shares dist-tables-math.js from W1.2 (build W1.2 FIRST).

## W1.4 `descriptive-statistics-calculator` - Descriptive Statistics Calculator

- **Input:** paste data (newline/comma/space/tab separated; tolerant of headers, currency symbols, thousands separators, NA/blank cells). THIS PARSER becomes the shared `tools/lib/data-parse.js` reused by W1.5 + correlation (wave 2) - build it clean, unit-tested.
- **Stats:** n, missing, mean, median, mode(s), sd + var (sample AND population toggles), SE, 95% CI of mean, min/max/range, quartiles (R type-7 default; note the type), IQR, skewness + kurtosis (state formulas; match e1071 defaults), CV, sum. Outlier flags (1.5xIQR) listed.
- **Visuals:** histogram (auto bins, Freedman-Diaconis) + boxplot, both live.
- Copyable report block + APA line + R code (`summary()`, `psych::describe()`), CSV column picker if multi-column paste.
- **Truth:** R on >=30 vectors: n=1, n=2, constant, all-NA, with-NA, negatives, huge magnitudes, tiny variance, heavy skew, ties for mode. Match `mean/sd/quantile(type=7)/e1071::skewness(type=3)` exactly.

## W1.5 `cronbachs-alpha-calculator` - Cronbach's Alpha Calculator

- **Input:** paste item-response matrix (rows = respondents, cols = items; CSV/TSV, header tolerant) via data-parse.js. Min 2 items x 3 respondents, NA handling (pairwise/listwise toggle, default listwise like psych).
- **Output:** raw alpha + 95% CI (Feldt), standardized alpha, item stats table (mean, sd, item-total r, alpha-if-deleted with the current alpha highlighted), inter-item correlation mean/range, verdict bands (>=.9 / .8 / .7 / .6 with the "high alpha is not unidimensionality" caveat taught on-page), reverse-coded item detector (negative item-total r flagged + one-click reverse for a chosen max scale value).
- R code `psych::alpha(df)` + report line.
- **Truth:** vs `psych::alpha` on >=25 matrices: 2-item, 10-item, with NA, a reversed item, near-zero variance item, k respondents < k items.

## Wave 2 (approved shortlist, not yet queued)
`r-error-decoder` (validate with 10 PSEO error pages first), `odds-ratio-calculator` (2x2 epi suite: OR/RR/NNT/attributable risk, epitools truth), `correlation-calculator` (data-parse.js reuse), `chi-square-table` + `f-table` (dist-tables lib reuse), `sample-size-calculator` (hold: strong SERP incumbents - long-tail plan first), `ggplot2-theme-builder` (HAND-BUILD, design-led showpiece, not a worker tool).

## Wave 2 MINIMUM specs (owner-approved 2026-07-14; scope non-negotiable, same bar as wave 1)

## W2.1 `chi-square-table` + `f-table` - Critical Value Tables (ONE worker run, reuses dist-tables-math.js)

- Reuse `tools/lib/dist-tables-math.js` (qchisq/pchisq, qf/pf already R-verified to 1e-12). Extend ONLY if a primitive is missing; keep the existing harness green.
- `chi-square-table.html`: full printable chi-square table SERVER-RENDERED (df 1-100 incl. steps, alpha .995/.99/.975/.95/.90/.10/.05/.025/.01/.005 both tails where sensible), interactive lookup (df + alpha highlights cell), shaded chi-square curve synced to selection, reverse mode (statistic + df -> p), copyable `qchisq()` R code, common-use chips (goodness-of-fit, independence 2x2, variance CI).
- `f-table.html`: printable F tables per alpha (.05/.025/.01) SERVER-RENDERED with df1 columns x df2 rows (standard textbook layout), alpha switcher, interactive lookup + reverse mode (F + df1 + df2 -> p), `qf()` code, ANOVA-use chips.
- Truth: R grid >=500 cases incl. fractional df, extreme df, tail edges. Harness `Scripts/tool-truth/test-chi-square-table-math.js` gates both pages.
- Both pages: tables crawlable static HTML; JS enhances. Register in build.py (icons: chi-square curve grid / F grid), gen_tools_landing CATEGORIES ('Reference Tables') + C3META dials.

## W2.2 `correlation-calculator` - Correlation Calculator

- Input: paste two columns (or multi-column with picker) via `tools/lib/data-parse.js` (extend upstream if needed, keep its unit tests green). Pairwise NA handling stated on-page.
- Methods: Pearson, Spearman, Kendall tau-b. For each: coefficient, CI (Fisher z for Pearson; bootstrap or z-approx for rank methods, method stated), t/z statistic, p-value one/two-tailed, n used.
- Visuals: scatter with fit line (Pearson) and rank-scatter toggle; live verdict line ("r = .62, 95% CI [.41, .77]: a strong positive linear association"); strength bands taught on-page with the "correlation is not causation and r misses curves" caveat + Anscombe note.
- APA report line, R code `cor.test(x, y, method=...)` per method. Scenario chips (height/weight style pairs, a curved trap pair showing r near 0).
- Truth: vs R `cor.test` on >=60 cases: ties (Kendall/Spearman with ties -> exact vs normal approx noted), n=3 minimum, perfect +/-1, near-zero, NA patterns, outlier pair. Gate <=1e-6 (match R's tie handling exactly or state the approximation on-page).

## W2.3 `odds-ratio-calculator` - 2x2 Epidemiology Suite

- Input: 2x2 counts (exposed/unexposed x outcome/no-outcome) with editable labels; scenario chips (cohort, case-control, RCT).
- Output: OR (Wald + Fisher exact CI), RR (Wald CI), risk difference + NNT/NNH (CI), attributable risk % + population attributable fraction, chi-square/Fisher p (auto-pick with rule stated), verdict line naming the RIGHT measure for the study design (case-control -> OR only, with the why taught on-page).
- Zero-cell handling: Haldane-Anscombe 0.5 correction, applied transparently with a note.
- Visuals: paired risk bars + CI interval plot. APA/journal report line, R code (`epitools::oddsratio`, `riskratio`) that reproduces the numbers.
- Truth: vs R `epitools` + `fisher.test` on >=80 tables: balanced, rare outcome, zero cells, huge counts, protective effects (OR<1). Gate <=1e-6.

## Wave 2 gate task (after W2.3): `r-error-decoder` PSEO validation

Before any decoder tool is built: publish 10 PSEO pages targeting exact R error strings (e.g. "object of type closure is not subsettable", "could not find function", "unexpected symbol", "non-numeric argument to binary operator", "cannot open the connection", "subscript out of bounds", "argument is of length zero", "$ operator is invalid for atomic vectors", "missing value where TRUE/FALSE needed", "unused argument"). Measure GSC impressions/clicks ~3 weeks. Tool builds only if the query class converts.


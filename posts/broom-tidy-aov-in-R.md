---
title: "broom tidy() for aov in R: Convert ANOVA Tables to Tibbles"
slug: "broom-tidy-aov-in-R"
description: "Tidy any aov fit in R with broom::tidy(). Convert one-way, two-way, and TukeyHSD ANOVA tables into one-row-per-term tibbles for dplyr, ggplot2, and reports."
keywords: "broom tidy aov, tidy aov R, broom ANOVA tidy, tidy.aov function R, broom aov output, convert aov to data frame R, tidy ANOVA model R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "One-Way-ANOVA-in-R.html"
auto_link_terms: "tidy.aov()|broom tidy aov|broom::tidy.aov()|tidy ANOVA model|tidy aov"
auto_link_case_sensitive: true
target_keyword: "broom tidy aov"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for aov in R: Convert ANOVA Tables to Tibbles

<p class="lead">The <code>broom::tidy()</code> function turns a fitted <code>aov</code> object into a one-row-per-term tibble with <code>sumsq</code>, <code>meansq</code>, <code>statistic</code>, and <code>p.value</code> columns. It replaces the printed ANOVA table from <code>summary(fit)</code> with a data frame you can pipe into <code>dplyr</code>, <code>ggplot2</code>, or a Word report.</p>

[QUICK ANSWER]
tidy(aov_fit)                              # one row per ANOVA term
tidy(aov_fit) |> filter(term != "Residuals")  # drop residual row
tidy(aov_fit) |> arrange(p.value)          # rank effects by p-value
tidy(TukeyHSD(aov_fit))                    # tidy post-hoc pairwise table
tidy(aov(y ~ A * B, data = df))            # two-way with interaction
tidy(aov(y ~ A + Error(subject/A), data = df))  # repeated measures
glance(aov_fit)                            # one-row model summary

[DECISION TREE: Is tidy(aov) the right tool?]
- ANOVA F table as a data frame: tidy(aov_fit)
- one-row model fit summary (r.squared, sigma): glance(aov_fit)
- per-observation residuals or fitted values: augment(aov_fit)
- pairwise mean differences after a significant F: tidy(TukeyHSD(aov_fit))
- Type II or Type III sums of squares: tidy(car::Anova(aov_fit, type = 3))
- mixed-effects ANOVA with random terms: broom.mixed::tidy(lmer_fit)
- publication-ready ANOVA table in Word: gtsummary::tbl_summary or flextable

## What tidy() does for aov in one sentence

**`tidy()` converts the printed ANOVA table into a tibble.** A fitted `aov` object holds the same information `summary(fit)` prints, but it lives in a list of class `c("aov", "lm")` that is awkward to subset programmatically. `broom::tidy()` pulls the per-term sum of squares, mean square, F statistic, and p-value, returning one row per source of variation including `Residuals`.

The content matches `summary(fit)[[1]]`, but it is a true tibble with stable column names. That unlocks every tidyverse verb: filter residuals, arrange by p-value, plot effect sizes, or `bind_rows()` multiple ANOVA tables. The shape never changes across one-way, two-way, or factorial designs.

## Syntax

**`tidy.aov()` is the S3 method that broom dispatches to when you pass an `aov` fit.** You never call it directly; calling `tidy()` on an `aov` object routes to the right method automatically.

```r title="Fit a one-way ANOVA on PlantGrowth"
library(broom)
library(dplyr)

# PlantGrowth: 30 plants, 3 treatment groups, dried weight as response
aov_fit <- aov(weight ~ group, data = PlantGrowth)
class(aov_fit)
#> [1] "aov" "lm"
```

The function signature is short:

- `x`: the fitted `aov` object (or `aovlist` for designs with `Error()` strata)
- `conf.int`: ignored for `aov` (no coefficient-level intervals are returned); pass `tidy()` to the underlying `lm` if you need them
- `conf.level`: same, ignored at the aov level
- `...`: forwarded to internal helpers; rarely used

The returned tibble always has these six columns:

| Column | Meaning |
|---|---|
| `term` | Source of variation (predictor name or `Residuals`) |
| `df` | Degrees of freedom for the term |
| `sumsq` | Sum of squares |
| `meansq` | Mean square (`sumsq / df`) |
| `statistic` | F statistic (or `NA` for the residual row) |
| `p.value` | Two-sided p-value (or `NA` for the residual row) |

[TIP]
**Keep the `Residuals` row when reporting variance explained, drop it for effect plots.** The residual row carries the within-group variability you need to compute eta-squared or omega-squared, so filter it out only after the calculation, not before.

## Common patterns

### 1. One-way ANOVA as a tidy table

```r title="Tidy a one-way ANOVA"
tidy(aov_fit)
#> # A tibble: 2 x 6
#>   term         df sumsq meansq statistic p.value
#>   <chr>     <dbl> <dbl>  <dbl>     <dbl>   <dbl>
#> 1 group         2  3.77   1.88      4.85  0.0159
#> 2 Residuals    27 10.5    0.389    NA    NA
```

Two rows: the treatment factor `group` and the within-group `Residuals`. The F statistic 4.85 is `meansq(group) / meansq(Residuals)`; the p-value 0.0159 says the three treatment means differ at the 5% level. Unlike the fixed-width `summary(aov_fit)` printout, the tibble lets you compute follow-ups (like effect size) in one extra line.

### 2. Effect size from the tidy table

```r title="Compute eta-squared from sumsq"
tidy(aov_fit) |>
  mutate(eta_sq = sumsq / sum(sumsq)) |>
  filter(term != "Residuals") |>
  select(term, sumsq, eta_sq, p.value)
#> # A tibble: 1 x 4
#>   term  sumsq eta_sq p.value
#>   <chr> <dbl>  <dbl>   <dbl>
#> 1 group  3.77  0.264  0.0159
```

Eta-squared is the proportion of total variance explained by each factor (factor sumsq divided by total sumsq, residuals included). The tidy table makes it a one-liner. Here, 26.4% of variation in plant weight is attributable to treatment group, a large effect by Cohen's conventions (>= 0.14).

### 3. Two-way ANOVA with an interaction

```r title="Two-way ANOVA on ToothGrowth"
# ToothGrowth: tooth length by supplement and dose
tg_fit <- aov(len ~ supp * dose, data = ToothGrowth)

tidy(tg_fit)
#> # A tibble: 4 x 6
#>   term         df  sumsq meansq statistic   p.value
#>   <chr>     <dbl>  <dbl>  <dbl>     <dbl>     <dbl>
#> 1 supp          1  205.   205.      12.3   0.000894
#> 2 dose          1 2224.  2224.     133.    1.91e-15
#> 3 supp:dose     1   88.9   88.9     5.33  0.0246
#> 4 Residuals    56  934.    16.7    NA    NA
```

Four rows: a main effect per factor, the `supp:dose` interaction, and residuals. The interaction p-value 0.0246 is significant, so the effect of `supp` depends on `dose`. With more factors the table grows but the columns stay identical, which is the point of tidy data.

### 4. Tidy a Tukey HSD post-hoc test

```r title="Tidy pairwise mean comparisons"
post_hoc <- TukeyHSD(aov_fit)
tidy(post_hoc)
#> # A tibble: 3 x 7
#>   term  contrast null.value estimate conf.low conf.high adj.p.value
#>   <chr> <chr>         <dbl>    <dbl>    <dbl>     <dbl>       <dbl>
#> 1 group trt1-ctrl         0   -0.371   -1.06     0.320       0.391
#> 2 group trt2-ctrl         0    0.494   -0.197    1.19        0.198
#> 3 group trt2-trt1         0    0.865    0.174    1.56        0.0120
#> 4 group ctrl-ctrl         0    0       NA       NA          NA
```

After a significant omnibus F, `TukeyHSD()` runs all pairwise mean differences with a family-wise alpha correction. `tidy()` on its result returns one row per contrast with the point estimate, 95% CI, and adjusted p-value. Only `trt2-trt1` is significant (adjusted p = 0.012), which is the report-ready summary rather than the matrix-of-matrices that `print(TukeyHSD(fit))` produces.

[NOTE]
**Repeated-measures ANOVA returns an `aovlist`.** When the formula contains an `Error()` term, the fit class becomes `c("aovlist", "listof")` and `tidy()` returns one tibble per stratum stacked by row, with an extra `stratum` column. The shape rule still holds, just with one more identifier.

## tidy() vs base summary() and other reporting paths

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `summary(fit)` | printed text plus nested list | Quick console check |
| `broom::tidy(fit)` | tibble (data frame) | dplyr piping, ggplot, effect size math |
| `gtsummary::tbl_regression()` | rendered HTML or Word table | Final report without manual formatting |

Use `tidy()` whenever the next step is code: computing eta-squared, faceting F-statistic plots across designs, or saving ANOVA tables to CSV. Use `gtsummary` for the final document; it accepts a tidied table and adds publication formatting. The `summary()` printout is the fastest interactive eyeball but a dead end for anything programmatic.

[KEY INSIGHT]
**The tibble is the bridge between ANOVA modeling and tidyverse tooling.** Once `tidy()` returns a six-column tibble, every dplyr verb, every ggplot geom, and every `gt` or `flextable` layout works without a custom shim. This is why `broom` ships inside the `tidymodels` meta-package even if you only fit a single ANOVA.

## Common pitfalls

**Pitfall 1: confusing `tidy(aov_fit)` with `tidy(lm_fit)`.** An `aov` object inherits from `lm`, so `tidy(lm(weight ~ group, data = PlantGrowth))` also runs but returns a different shape: one row per coefficient (intercept, `grouptrt1`, `grouptrt2`). The `aov` tidy is the F-test ANOVA table; the `lm` tidy is the coefficient table for contrast-coded dummies. They are not interchangeable in reports.

```r title="Same data, two different tidy outputs"
tidy(aov(weight ~ group, data = PlantGrowth)) |> nrow()
#> [1] 2
tidy(lm(weight ~ group, data = PlantGrowth)) |> nrow()
#> [1] 3
```

**Pitfall 2: Type I sums of squares by default.** Base R `aov()` uses sequential (Type I) sumsq, so term order in the formula changes per-term sumsq for unbalanced designs. For Type II or III, pass `car::Anova(aov_fit, type = 3)` to `tidy()`. The returned tibble keeps the same shape with corrected sumsq.

[WARNING]
**`tidy(aov_fit)` returns `NA` for `statistic` and `p.value` on the `Residuals` row.** This is intentional; there is no F-test for residuals. But it breaks naive aggregations like `summarise(across(everything(), mean))` unless you filter the residual row first or pass `na.rm = TRUE`. Always handle the NA row explicitly when piping the tidy table into a calculation.

**Pitfall 3: forgetting to install `broom`.** The package is installed by default if you have `tidymodels`, but a bare R installation does not include it. Run `install.packages("broom")` once, then `library(broom)` per session. If you see `could not find function "tidy"`, that is the cause.

## Try it yourself

**Try it:** Fit a two-way ANOVA on `ToothGrowth` predicting `len` from `supp` and `dose` (as a factor) without the interaction. Use `tidy()` to produce the ANOVA table and arrange the rows by ascending p-value. Save the result to `ex_anova_table`.

```r title="Your turn: tidy a two-way ANOVA"
# Try it: tidy a two-factor ANOVA, rank effects by p-value
ex_anova_table <- # your code here

ex_anova_table
#> Expected: 3 rows (supp, dose, Residuals) with the strongest effect on top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- aov(len ~ supp + factor(dose), data = ToothGrowth)
ex_anova_table <- tidy(ex_fit) |> arrange(p.value)
ex_anova_table
#> # A tibble: 3 x 6
#>   term            df  sumsq meansq statistic  p.value
#>   <chr>        <dbl>  <dbl>  <dbl>     <dbl>    <dbl>
#> 1 factor(dose)     2 2426.  1213.      82.8  1.87e-17
#> 2 supp             1  205.   205.      14.0  4.29e- 4
#> 3 Residuals       56  820.    14.6    NA   NA
```

**Explanation:** Wrapping `dose` in `factor()` makes the model fit a two-degree-of-freedom term instead of a single linear slope, which is the correct ANOVA framing for a categorical predictor. The NA p-value on the residual row sorts to the bottom by default with `arrange()`.

</details>

## Related broom functions for aov

After mastering `tidy()`, the next two broom verbs round out the workflow:

- `glance(aov_fit)`: one-row model summary with `r.squared`, `adj.r.squared`, `sigma`, `statistic`, `p.value`, `df`, `logLik`, `AIC`, `BIC`, `deviance`, `df.residual`, `nobs`
- `augment(aov_fit)`: per-observation tibble with `.fitted`, `.resid`, `.std.resid`, `.hat`, `.sigma`, `.cooksd`
- `tidy(TukeyHSD(aov_fit))`: post-hoc pairwise comparison table after a significant omnibus F

To combine multiple ANOVA fits across groups, use `purrr::map_dfr(fits, tidy, .id = "model")`. The `.id` column lets you facet an F-statistic comparison plot by model.

See the official [broom reference for aov methods](https://broom.tidymodels.org/reference/tidy.aov.html) for the full argument list.

## FAQ

**How do I extract the F statistic and p-value from an aov in R?**

Call `tidy(aov_fit)` and read the `statistic` and `p.value` columns. Treatment-effect rows hold the F values; the `Residuals` row has NA in both. For a one-liner, pipe `tidy(fit) |> filter(term != "Residuals") |> pull(p.value)`. The column names never change across one-way, two-way, or factorial designs.

**What is the difference between tidy(aov) and tidy(lm) on the same data?**

`tidy(aov_fit)` returns the ANOVA table: one row per source of variation with `df`, `sumsq`, `meansq`, `statistic` (F), `p.value`. `tidy(lm_fit)` returns the coefficient table: one row per dummy contrast with `estimate`, `std.error`, `statistic` (t), `p.value`. The first answers "does this factor matter overall"; the second, "how does each level differ from the reference".

**Does broom tidy work with repeated-measures ANOVA?**

Yes. When the formula contains an `Error()` stratum, `aov()` returns an `aovlist` object. `tidy()` handles it by returning a stacked tibble with one row per term per stratum, plus a `stratum` column to identify which Error level the row belongs to. The other six columns are unchanged.

**How do I tidy a Type II or Type III ANOVA?**

Base `aov()` uses Type I (sequential) sumsq. For Type II or III on unbalanced designs, pass the fit to `car::Anova(fit, type = 2)` or `type = 3`, then call `tidy()` on the result. The tibble shape matches `tidy(aov_fit)`, so downstream code stays the same.

**Can I plot effect sizes directly from the tidy output?**

Yes. After `tidy(fit) |> mutate(eta_sq = sumsq / sum(sumsq)) |> filter(term != "Residuals")`, pipe into `ggplot(aes(x = eta_sq, y = reorder(term, eta_sq))) + geom_col()` for a horizontal bar chart of variance explained. The Residuals row must be dropped before plotting or the bar for unexplained variance will dwarf the others.

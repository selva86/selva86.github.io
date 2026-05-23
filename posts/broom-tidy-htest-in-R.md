---
title: "broom tidy() for htest in R: Tidy Hypothesis Test Results"
slug: "broom-tidy-htest-in-R"
description: "Tidy htest objects in R using broom::tidy(). Convert t.test, cor.test, chisq.test, prop.test, and wilcox.test results to one-row tibbles for analysis."
keywords: "broom tidy htest, tidy htest R, tidy.htest function R, broom tidy t.test, broom tidy chisq.test, tidy hypothesis test R, broom tidy cor.test"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "tidy.htest()|broom tidy htest|broom::tidy.htest()|tidy hypothesis test|tidy htest"
auto_link_case_sensitive: true
target_keyword: "broom tidy htest"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom tidy() for htest in R: Tidy Hypothesis Test Results

<p class="lead">The <code>broom::tidy()</code> function turns any <code>htest</code> object, the output of <code>t.test()</code>, <code>cor.test()</code>, <code>chisq.test()</code>, <code>prop.test()</code>, and friends, into a one-row tibble with <code>estimate</code>, <code>statistic</code>, <code>p.value</code>, and confidence interval columns. It replaces the printed test report with a data frame you can pipe into <code>dplyr</code>, <code>ggplot2</code>, or a Word report.</p>

[QUICK ANSWER]
tidy(t.test(mtcars$mpg))                          # one-sample t
tidy(t.test(mpg ~ am, data = mtcars))             # two-sample Welch t
tidy(cor.test(mtcars$mpg, mtcars$wt))             # Pearson correlation
tidy(chisq.test(table(mtcars$cyl, mtcars$gear)))  # chi-square independence
tidy(prop.test(c(40, 55), c(100, 100)))           # two-proportion z
tidy(wilcox.test(mpg ~ am, data = mtcars))        # rank-sum (non-parametric)
tidy(shapiro.test(mtcars$mpg))                    # normality check

[DECISION TREE: Is tidy() the right tool for an htest?]
- single hypothesis test result as a data frame: tidy(test_result)
- ANOVA F table from aov(): tidy(aov_fit)
- linear or generalized model coefficients: tidy(lm_fit) or tidy(glm_fit)
- one-row model summary (AIC, R-squared): glance(fit)
- per-row fitted values and residuals: augment(fit)
- mixed-effects test results: broom.mixed::tidy(lmer_fit)
- publication-ready test table in Word: gtsummary::tbl_summary()

## What tidy() does for htest in one sentence

**`tidy()` flattens an `htest` object into a single-row tibble.** Base R hypothesis tests return a list of class `"htest"` that prints as a fixed-width report but is awkward to subset. `broom::tidy()` extracts the test statistic, p-value, effect estimate, confidence interval, and method label, all keyed by stable column names. Every test that returns class `htest` follows the same tidying contract.

The single-row shape is what makes the function powerful. Run a hundred t-tests across subsets and `bind_rows()` the tidied results, no parser logic required. The tibble shape is identical whether the underlying test is parametric or rank-based.

## Syntax

**`tidy.htest()` is the S3 method that `broom` dispatches to when you pass any `htest` object.** You never call it directly. Calling `tidy()` on the result of `t.test`, `cor.test`, `chisq.test`, `prop.test`, `wilcox.test`, `ks.test`, `var.test`, `fisher.test`, `mcnemar.test`, `oneway.test`, `binom.test`, or `shapiro.test` routes to the right method automatically.

```r title="Confirm an htest class on a t.test result"
library(broom)
library(dplyr)

tt <- t.test(mpg ~ am, data = mtcars)
class(tt)
#> [1] "htest"
```

The function signature is short:

- `x`: the fitted `htest` object
- `...`: forwarded to internal helpers; rarely used

The returned tibble columns vary slightly by test family, but the core set is always present:

| Column | Meaning |
|---|---|
| `estimate` | Effect size (mean difference, correlation r, proportion difference) |
| `statistic` | Test statistic (t, chi-square, W, Z) |
| `p.value` | Two-sided p-value (or one-sided per `alternative`) |
| `parameter` | Degrees of freedom or sample size, depending on test |
| `conf.low`, `conf.high` | Confidence interval bounds (when the test returns one) |
| `method` | Human-readable test name, e.g. `"Welch Two Sample t-test"` |
| `alternative` | `"two.sided"`, `"less"`, or `"greater"` |

[TIP]
**Use `glance()` and `tidy()` interchangeably on an `htest`.** Because the test produces a single row, `glance(test_result)` returns the same tibble as `tidy(test_result)`. The broom team kept both methods so model-level pipelines that call `glance()` still work for hypothesis tests.

## Common patterns

### 1. Tidy a one-sample and two-sample t-test

```r title="Tidy two flavors of t.test"
one_t <- t.test(mtcars$mpg, mu = 25)
tidy(one_t)
#> # A tibble: 1 x 8
#>   estimate statistic p.value parameter conf.low conf.high method            alternative
#>      <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl> <chr>             <chr>
#> 1     20.1     -5.08 1.86e-5      31.0     18.0      22.3 One Sample t-test two.sided

two_t <- t.test(mpg ~ am, data = mtcars)
tidy(two_t)
#> # A tibble: 1 x 10
#>   estimate estimate1 estimate2 statistic  p.value parameter conf.low conf.high method                  alternative
#>      <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>    <dbl>     <dbl> <chr>                   <chr>
#> 1    -7.24      17.1      24.4     -3.77 0.000137      18.3    -11.3     -3.21 Welch Two Sample t-test two.sided
```

Both calls produce one row. The one-sample form has a single `estimate` (the sample mean). The two-sample form adds `estimate1` and `estimate2` for the two group means and keeps `estimate` as the difference. The fixed schema means downstream code does not care which test ran.

### 2. Tidy correlation and rank-based tests

```r title="Pearson correlation and Wilcoxon rank-sum"
cor_test <- cor.test(mtcars$mpg, mtcars$wt)
tidy(cor_test)
#> # A tibble: 1 x 8
#>   estimate statistic  p.value parameter conf.low conf.high method                              alternative
#>      <dbl>     <dbl>    <dbl>     <int>    <dbl>     <dbl> <chr>                               <chr>
#> 1   -0.868     -9.56 1.29e-10        30   -0.934    -0.744 Pearson's product-moment correlation two.sided

wilc <- wilcox.test(mpg ~ am, data = mtcars, conf.int = TRUE)
tidy(wilc)
#> # A tibble: 1 x 7
#>   estimate statistic   p.value conf.low conf.high method                                          alternative
#>      <dbl>     <dbl>     <dbl>    <dbl>     <dbl> <chr>                                           <chr>
#> 1    -6.80         42 0.0019         -11.2     -2.7 Wilcoxon rank sum test with continuity correction two.sided
```

Both rows fit the same template. `estimate` is the Pearson r in the first case and the Hodges-Lehmann location shift in the second. Passing `conf.int = TRUE` to `wilcox.test()` is the only way to populate `conf.low` and `conf.high` for that test; without it those columns are NA.

### 3. Tidy categorical tests

```r title="Chi-square independence and two-proportion z"
chi <- chisq.test(table(mtcars$cyl, mtcars$gear))
tidy(chi)
#> # A tibble: 1 x 4
#>   statistic p.value parameter method
#>       <dbl>   <dbl>     <int> <chr>
#> 1      18.0 0.00121         4 Pearson's Chi-squared test

pp <- prop.test(c(40, 55), c(100, 100))
tidy(pp)
#> # A tibble: 1 x 9
#>   estimate1 estimate2 statistic p.value parameter conf.low conf.high method                                              alternative
#>       <dbl>     <dbl>     <dbl>   <dbl>     <int>    <dbl>     <dbl> <chr>                                               <chr>
#> 1      0.40      0.55      4.32  0.0376         1   -0.290  -0.00969 2-sample test for equality of proportions with cont... two.sided
```

`chisq.test()` has no natural effect size, so `tidy()` drops the `estimate` column entirely. `prop.test()` does, and returns `estimate1`/`estimate2` for the two proportions. The variable column set is by design: missing values would be misleading, so broom omits them rather than fill with NA.

### 4. Bind many tests into one report

```r title="Run a test per group and stack the tidied rows"
mt_split <- split(mtcars, mtcars$cyl)

test_table <- mt_split |>
  lapply(\(d) t.test(d$mpg, mu = 25)) |>
  lapply(tidy) |>
  bind_rows(.id = "cyl")
test_table
#> # A tibble: 3 x 9
#>   cyl   estimate statistic   p.value parameter conf.low conf.high method            alternative
#>   <chr>    <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl> <chr>             <chr>
#> 1 4         26.7     1.32   0.218          10.0     24.0      29.4 One Sample t-test two.sided
#> 2 6         19.7    -7.59   0.000625        6.00    18.0      21.5 One Sample t-test two.sided
#> 3 8         15.1    -10.7   1.45e-7        13.0     13.1      17.1 One Sample t-test two.sided
```

This is the payoff. With a per-group t-test the printed reports would be three separate text blocks; the tidied rows stack into a comparable table with a `cyl` identifier column. Sorting, filtering, plotting, and saving to CSV become one-liners.

[NOTE]
**Use `purrr::map(.) |> bind_rows()` for the same effect in tidyverse style.** `purrr::map(mt_split, ~ tidy(t.test(.x$mpg, mu = 25))) |> bind_rows(.id = "cyl")` replaces the two `lapply()` calls with one pipeline. Both produce identical tibbles.

## tidy() vs base print() and other reporting paths

**Three tools cover the same job from different angles.** Pick by what you do next with the output.

| Tool | Output type | Best for |
|---|---|---|
| `print(test_result)` | text report | Quick console eyeball |
| `broom::tidy(test_result)` | tibble (single row) | dplyr piping, batched testing, ggplot |
| `gtsummary::tbl_summary()` | rendered HTML or Word | Final publication-ready report |

Use `tidy()` whenever the next step is code: filtering on `p.value`, plotting effect sizes with confidence intervals, or saving test results to disk. Use `gtsummary` for the final document; it accepts a tidied table and adds journal formatting. The `print()` output is the fastest interactive eyeball but a dead end for anything programmatic.

[KEY INSIGHT]
**The single-row tibble is the bridge between base-R hypothesis testing and tidyverse tooling.** Once `tidy()` returns a row with stable column names, every dplyr verb, every ggplot geom for error bars, and every `gt` or `flextable` layout works without a custom shim. This is why `broom` ships inside the `tidymodels` meta-package even if you only run two-sample t-tests.

## Common pitfalls

**Pitfall 1: assuming every column always appears.** The columns returned depend on the test. `chisq.test()` has no `estimate`, `wilcox.test()` without `conf.int = TRUE` has no `conf.low`/`conf.high`, and `cor.test(method = "spearman")` returns a different `statistic` name (S instead of t). Code that hardcodes `pull(estimate)` will fail on a chi-square. Use `dplyr::any_of(c("estimate", "conf.low"))` when binding heterogeneous tests, or call `bind_rows()` first and let it fill missing columns with NA.

```r title="any_of() guards against missing columns"
tests <- list(
  t_test  = t.test(mtcars$mpg, mu = 25),
  chi_sq  = chisq.test(table(mtcars$cyl, mtcars$gear))
)
lapply(tests, tidy) |>
  bind_rows(.id = "test") |>
  select(test, statistic, p.value, any_of(c("estimate", "conf.low", "conf.high")))
#> # A tibble: 2 x 6
#>   test   statistic  p.value estimate conf.low conf.high
#>   <chr>      <dbl>    <dbl>    <dbl>    <dbl>     <dbl>
#> 1 t_test     -5.08 1.86e-5      20.1     18.0      22.3
#> 2 chi_sq     18.0  0.00121      NA       NA        NA
```

**Pitfall 2: confusing `tidy()` on an `htest` with `tidy()` on the underlying data.** `tidy(t.test(mtcars$mpg))` returns the test result. `tidy(mtcars$mpg)` returns a tibble of the vector itself. The class on the input drives dispatch, so passing the wrong object silently produces the wrong shape. Always check `class()` if a tidy output looks unexpected.

[WARNING]
**The `parameter` column means different things across tests.** For `t.test`, it is degrees of freedom (often non-integer for Welch). For `chisq.test`, it is also df but integer-valued. For `prop.test` with one group, it is the sample size. For `wilcox.test`, the column is absent entirely. Do not treat `parameter` as a single metric across stacked test results; document or relabel it in your report.

**Pitfall 3: forgetting that one-sided tests still produce a single row.** Passing `alternative = "greater"` or `"less"` changes the `p.value` and `conf.low`/`conf.high` values but not the shape. The `alternative` column records the choice, so a downstream consumer can verify which tail the p-value refers to without rerunning the test.

## Try it yourself

**Try it:** Run a Welch two-sample t-test comparing `wt` between automatic and manual transmissions in `mtcars`. Tidy the result and pull the 95% confidence interval as a numeric vector of length two. Save it to `ex_ci`.

```r title="Your turn: extract a confidence interval"
# Try it: tidy a t.test, then pull the CI
ex_test <- t.test(wt ~ am, data = mtcars)
ex_ci <- # your code here

ex_ci
#> Expected: c(conf.low, conf.high) ~ c(0.85, 2.00)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- t.test(wt ~ am, data = mtcars)
ex_ci <- tidy(ex_test) |>
  select(conf.low, conf.high) |>
  unlist(use.names = FALSE)
ex_ci
#> [1] 0.8525632 2.0026926
```

**Explanation:** Tidying the test gives a one-row tibble. Selecting the two CI columns and `unlist()` strips names and returns a length-two numeric vector, the typical shape for downstream plotting or reporting code that expects `c(lower, upper)`.

</details>

## Related broom functions for htest

After mastering `tidy()` on `htest` objects, the next two broom verbs round out the workflow:

- `glance(test_result)`: same single row as `tidy()`; kept for API symmetry with model objects
- `augment(test_result)`: NOT defined for `htest` (no per-observation residuals); use the underlying data directly
- `tidy(aov(...))`: ANOVA tables, covered in the sibling [broom tidy aov post](broom-tidy-aov-in-R.html)
- `tidy(lm(...))`: regression coefficient tables for the linear model behind a t.test
- `tidy(chisq.test(...))`: also reachable via `gtsummary::tbl_cross()` for categorical reports

To compare effect sizes across many tests at once, use `purrr::map_dfr(tests, tidy, .id = "test")`. The `.id` column lets you facet a forest-plot-style ggplot by test name.

See the official [broom reference for tidy.htest methods](https://broom.tidymodels.org/reference/tidy.htest.html) for the full column list per test family.

## FAQ

**How do I extract the p-value from a t.test result in R?**

Call `broom::tidy(t.test(...))` and read the `p.value` column, or pull it directly with `tidy(t.test(x, y))$p.value`. The same one-liner works for `cor.test`, `chisq.test`, `prop.test`, and any other `htest`-class result. This is the most reliable way to grab the p-value without parsing the printed report or remembering which list element holds it.

**What is the difference between tidy(t.test) and tidy(lm) on the same comparison?**

A two-sample t-test on `mpg ~ am` and `lm(mpg ~ am)` test the same hypothesis with the same p-value when variances are equal. `tidy(t.test(...))` returns one row with the group means and CI for the difference. `tidy(lm(...))` returns two rows, one per coefficient (intercept and `am` slope). Pick the t-test form for compact reports, the lm form when you need additional predictors.

**Does broom tidy work with fisher.test and mcnemar.test?**

Yes. Both return objects of class `htest`, so `tidy()` dispatches to the same method. `fisher.test()` adds `estimate` (the odds ratio) and `conf.low`/`conf.high`. `mcnemar.test()` returns only `statistic`, `p.value`, `parameter` (df), and `method`. The single-row shape holds for both.

**How do I tidy a one-sided test and keep that information?**

Pass `alternative = "greater"` or `"less"` to the test as usual. The tidied row keeps an `alternative` column with the chosen direction, and the `p.value` is the one-sided value. The confidence interval becomes one-sided too (one bound is infinite, displayed as `Inf` or `-Inf`). Always check `alternative` before reusing the p-value downstream.

**Can I plot a forest plot directly from the tidy output?**

Yes. Stack tidied tests with `bind_rows(.id = "label")`, then `ggplot(aes(x = estimate, y = label)) + geom_point() + geom_errorbarh(aes(xmin = conf.low, xmax = conf.high))`. Add `geom_vline(xintercept = 0, linetype = "dashed")` for a reference at the null. Drop rows where `conf.low` is NA (chi-square, McNemar) before plotting.

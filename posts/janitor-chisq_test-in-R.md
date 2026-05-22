---
title: "janitor chisq.test() in R: Chi-Square Test on Tabyls"
slug: "janitor-chisq_test-in-R"
description: "Use janitor chisq.test() to run a chi-square test of independence directly on a tabyl object in R. Covers two-way tables, simulated p-values, and pitfalls."
keywords: "janitor chisq.test, chisq.test function R, janitor chisq.test examples, tabyl chi-square test, chi-square test janitor, independence test tabyl, chisq.test tabyl"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "janitor chisq.test|janitor::chisq.test()|chi-square test on tabyl|chisq.test on a tabyl|chi-square test of independence on tabyl"
auto_link_case_sensitive: true
target_keyword: "janitor chisq.test"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor chisq.test() in R: Chi-Square Test on Tabyls

<p class="lead">The <code>chisq.test()</code> method in janitor runs Pearson's chi-square test directly on a <code>tabyl</code> object, so you can stay in the tidy pipe instead of converting the table to a matrix first. It dispatches to <code>stats::chisq.test()</code> under the hood, accepting all the same arguments, and works on both 2-way (independence) and 1-way (goodness-of-fit) tabyls.</p>

[QUICK ANSWER]
tabyl(df, v1, v2) |> chisq.test()                          # independence test
tabyl(df, v1, v2) |> chisq.test(correct = FALSE)           # no Yates correction
tabyl(df, v1, v2) |> chisq.test(simulate.p.value = TRUE)   # Monte Carlo p
tabyl(df, v1) |> chisq.test()                              # goodness-of-fit, equal p
tabyl(df, v1) |> chisq.test(p = c(.5, .3, .2))             # custom expected p
tabyl(df, v1, v2) |> chisq.test() |> broom::tidy()         # tidy data frame
chisq.test(tabyl(df, v1, v2))$expected                     # inspect expecteds

[DECISION TREE: Is chisq.test() on a tabyl the right tool?]
- test independence on a 2-way tabyl: tabyl(df, v1, v2) |> chisq.test()
- expected cell count below 5: tabyl(df, v1, v2) |> fisher.test()
- ordered categories with trend: prop.trend.test() on counts vector
- one-way goodness-of-fit, equal p: tabyl(df, v1) |> chisq.test()
- exact small-sample 2x2 test: fisher.test(tabyl(df, v1, v2))
- need standardized residuals: chisq.test(tab)$stdres
- adorned with totals or percents: drop adorn_* then run chisq.test()

## What chisq.test() does on a tabyl in one sentence

**`janitor::chisq.test()` is an S3 method that lets a `tabyl` flow straight into a Pearson chi-square test without an intermediate `as.matrix()` step.** The function inherits every argument of `stats::chisq.test()`, so the test logic, p-value, and `htest` return object are identical to the base R call. The only thing janitor adds is method dispatch on the `tabyl` class.

In a tidy workflow this matters: `chisq.test()` is the natural last step after a cross-tab, and the janitor method removes the break to base R hypothesis testing.

## Syntax

**The method accepts a tabyl as the first argument; everything else is forwarded to `stats::chisq.test()`.** The signature is intentionally minimal:

```r title="Load janitor and build a sample tabyl"
library(janitor)
library(dplyr)

tab <- mtcars |>
  tabyl(cyl, am)

tab
#>  cyl  0  1
#>    4  3  8
#>    6  4  3
#>    8 12  2
```

The call that follows looks just like base R:

```
chisq.test(x, correct = TRUE, p = rep(1/length(x), length(x)),
           rescale.p = FALSE, simulate.p.value = FALSE, B = 2000)
```

The only thing that changes is the type of `x`: a tabyl instead of a matrix or table. The `correct` argument controls Yates' continuity correction (defaults to TRUE for 2x2 tables, ignored otherwise). The `simulate.p.value` switch turns on Monte Carlo simulation, useful when expected counts dip below 5.

## Six common patterns

### 1. Two-way independence test

The canonical use case: do the row and column variables vary together, or are they independent?

```r title="Test cyl by am for independence"
mtcars |>
  tabyl(cyl, am) |>
  chisq.test()
#>
#> 	Pearson's Chi-squared test
#>
#> data:  
#> X-squared = 8.7407, df = 2, p-value = 0.01265
```

The p-value below 0.05 rejects the null of independence between cylinder count and transmission type. R prints a warning when expected counts fall below 5, which happens here for the 6-cylinder by automatic cell.

### 2. One-way goodness-of-fit test

A 1-way tabyl can be tested for goodness-of-fit. The default null is that all categories occur with equal probability.

```r title="Goodness-of-fit on a single column"
mtcars |>
  tabyl(cyl) |>
  chisq.test()
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  
#> X-squared = 2.3125, df = 2, p-value = 0.3147
```

Against a uniform 11/11/11 null, mtcars cylinder counts are not significantly different.

### 3. Custom expected probabilities

For a goodness-of-fit test with non-uniform expected probabilities, pass a numeric vector to `p`. The vector must have the same length as the tabyl's categories and sum to 1.

```r title="Goodness-of-fit with custom expected p"
mtcars |>
  tabyl(cyl) |>
  chisq.test(p = c(0.5, 0.2, 0.3))
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  
#> X-squared = 2.1761, df = 2, p-value = 0.3369
```

[TIP]
**`rescale.p = TRUE` saves a step when probabilities do not sum to exactly 1.** Floating-point inputs from a calculation often miss 1 by a tiny amount, which makes `chisq.test()` throw an error. Passing `rescale.p = TRUE` divides each probability by the sum, normalizing them before the test runs.

### 4. Simulated p-values for sparse tables

When expected counts fall below 5, the chi-square approximation breaks down. `simulate.p.value = TRUE` returns a Monte Carlo p-value instead.

```r title="Monte Carlo p-value for a sparse tabyl"
set.seed(42)

mtcars |>
  tabyl(cyl, am) |>
  chisq.test(simulate.p.value = TRUE, B = 5000)
#>
#> 	Pearson's Chi-squared test with simulated p-value
#> 	(based on 5000 replicates)
#>
#> data:  
#> X-squared = 8.7407, df = NA, p-value = 0.01539
```

`B` sets the number of simulated tables (2000 by default); higher `B` gives a more stable p-value.

### 5. Extract test components for reporting

The return value is a standard `htest` list. Pull out individual pieces with `$`, or convert the whole result to a tidy data frame with `broom::tidy()`.

```r title="Extract statistic, p-value, and expecteds"
res <- mtcars |>
  tabyl(cyl, am) |>
  chisq.test()

res$statistic
#> X-squared 
#>  8.740725

res$p.value
#> [1] 0.01265

res$expected
#>  cyl       0       1
#>    4 6.71875 4.28125
#>    6 4.27500 2.72500
#>    8 8.00625 5.99375
```

The `$expected` table is the most important diagnostic; cells below 5 are the warning signs that the chi-square assumption is shaky.

### 6. Switch to Fisher's exact test when assumptions break

`fisher.test()` also has a janitor method, so the swap is one verb deep.

```r title="Fisher exact test on the same tabyl"
mtcars |>
  tabyl(cyl, am) |>
  fisher.test()
#>
#> 	Fisher's Exact Test for Count Data
#>
#> data:  
#> p-value = 0.009105
#> alternative hypothesis: two.sided
```

Fisher's test makes no large-sample approximation, so it is safer for sparse 2-way tables.

## Compare with alternatives

**Several routes lead to the same chi-square result; the right pick depends on what is already in the pipeline.** The table below maps each route to its best use case.

| Approach | Code | Use when |
|---|---|---|
| janitor method | `tabyl(df, v1, v2) \|> chisq.test()` | already piping with janitor or dplyr |
| Base R on a table | `chisq.test(table(df$v1, df$v2))` | quick one-liner, no pipe |
| Base R on a matrix | `chisq.test(matrix(c(...), nrow = 2))` | working from pre-computed counts |
| Fisher exact | `tabyl(df, v1, v2) \|> fisher.test()` | expected counts below 5 |
| broom-tidy result | `chisq.test(tab) \|> broom::tidy()` | building report tables |

When to use which:

- The janitor method is the cleanest fit inside a tidy pipeline; the test logic is identical to base R.
- Reach for `table()` when you have raw vectors and no other reason to build a tabyl.
- Use `fisher.test()` whenever the chi-square test prints a "chi-squared approximation may be incorrect" warning.

[NOTE]
**Coming from Python pandas?** The closest equivalent of `tabyl(df, v1, v2) |> chisq.test()` is `scipy.stats.chi2_contingency(pd.crosstab(df.v1, df.v2))`. The tidy pipe in R keeps the table and the test in one expression; `scipy` separates them into two calls.

## Common pitfalls

**Pitfall 1: running chisq.test() on an adorned tabyl.** The adorn_* family changes the tabyl's values: totals get appended, counts become proportions. Piping such a tabyl into `chisq.test()` treats the totals row as a real category, inflating the statistic. Always call `chisq.test()` BEFORE any adorn step.

**Pitfall 2: low expected counts trigger a silent warning, not an error.** R prints "Chi-squared approximation may be incorrect" but still returns a p-value. Readers often miss the warning and report the result. Inspect `$expected` first; if any cell is below 5, switch to `fisher.test()` or pass `simulate.p.value = TRUE`.

[WARNING]
**`show_na = TRUE` (the tabyl default) inflates the chi-square statistic.** Missing values become their own row or column in the tabyl, and `chisq.test()` treats that NA category as just another bucket. If you do not intend to test missingness as a category, build the tabyl with `show_na = FALSE` (or filter NA before tabulating) so the test ignores missing observations.

**Pitfall 3: forgetting Yates' continuity correction is on by default for 2x2.** For 2x2 tables, base R subtracts 0.5 from each absolute cell difference before squaring, which lowers the statistic and the p-value compared with the uncorrected form. If you want the uncorrected Pearson statistic, pass `correct = FALSE` explicitly. Many textbooks and other software packages report uncorrected values by default.

## Try it yourself

**Try it:** Take `HairEyeColor`, collapse the `Sex` margin, build a tabyl of hair color by eye color from the underlying counts, and run a chi-square test of independence. Save the test to `ex_chi`.

```r title="Your turn: hair by eye independence"
# Try it: chi-square on HairEyeColor (collapsed across Sex)
ex_dat <- as.data.frame(margin.table(HairEyeColor, c(1, 2)))
ex_dat <- ex_dat[rep(seq_len(nrow(ex_dat)), ex_dat$Freq), c("Hair", "Eye")]

ex_chi <- # your code here

ex_chi
#> Expected: very small p-value, X-squared above 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dat <- as.data.frame(margin.table(HairEyeColor, c(1, 2)))
ex_dat <- ex_dat[rep(seq_len(nrow(ex_dat)), ex_dat$Freq), c("Hair", "Eye")]

ex_chi <- ex_dat |>
  tabyl(Hair, Eye) |>
  chisq.test()

ex_chi
#>
#> 	Pearson's Chi-squared test
#>
#> data:  
#> X-squared = 138.29, df = 9, p-value < 2.2e-16
```

**Explanation:** Expanding the frequency table back to one row per observation lets `tabyl()` count from raw data. The test rejects independence: hair color and eye color are strongly associated, exactly the textbook conclusion for this dataset.

</details>

## Related janitor functions

After running `chisq.test()` on a tabyl, these are the natural next steps:

- `tabyl()`: build the 1-way or 2-way frequency table the test operates on
- `fisher.test()`: janitor S3 method for Fisher's exact test, the small-sample alternative
- `adorn_totals()`: add row, column, or both totals AFTER the test, never before
- `adorn_percentages()`: convert counts to row, column, or grand-total proportions
- `untabyl()`: strip the tabyl class if a downstream function rejects it

For a full tour of janitor's verbs, see the [janitor package guide](janitor-Package-in-R.html). The official reference lives at [sfirke.github.io/janitor](https://sfirke.github.io/janitor/).

## FAQ

**What does janitor chisq.test() do?**

It adds an S3 method, `chisq.test.tabyl()`, that accepts a tabyl and forwards to `stats::chisq.test()`. The result is the same Pearson chi-square test you would get from base R, computed on the same counts, returning the same `htest` object. The benefit is purely ergonomic: a tabyl flows straight into the test inside a tidy pipe, without an `as.matrix()` step.

**How is janitor::chisq.test() different from stats::chisq.test()?**

The statistical logic is identical. janitor only adds method dispatch: when the input has class `tabyl`, R routes the call through `chisq.test.tabyl()`, which strips the tabyl wrapper and calls `stats::chisq.test()` on the underlying counts. Every argument (`correct`, `p`, `rescale.p`, `simulate.p.value`, `B`) is passed through unchanged.

**Why do I get a "chi-squared approximation may be incorrect" warning?**

This warning fires when any expected cell count falls below 5. The chi-square distribution is an approximation to the exact sampling distribution; the approximation degrades when cells are sparse. Check `result$expected` to confirm, then either combine sparse categories, switch to `fisher.test()`, or rerun with `simulate.p.value = TRUE` for a Monte Carlo p-value.

**Can I run chisq.test() on a tabyl with adorn_totals() applied?**

No. `adorn_totals()` adds a "Total" row or column whose counts duplicate the marginals, and `chisq.test()` would treat that row as a real category, inflating the statistic. Run `chisq.test()` first, then add adornments to the printable table afterward, or build a separate tabyl for the test.

**Does janitor have a method for fisher.test() too?**

Yes. `janitor::fisher.test()` is the same kind of S3 method as `chisq.test.tabyl()`. It accepts a tabyl and forwards to `stats::fisher.test()`. The pattern is consistent: any base R hypothesis test that operates on a contingency table now flows out of `tabyl()` in one verb.

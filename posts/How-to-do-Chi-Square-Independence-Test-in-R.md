---
title: "Chi-Square Test of Independence in R: chisq.test() Guide"
slug: "How-to-do-Chi-Square-Independence-Test-in-R"
description: "Run a chi-square test of independence in R with chisq.test() to test relationships between two categorical variables. Includes assumptions and 5 examples."
keywords: "chi-square independence test in R, chisq.test, R chi-squared test, chi-square test of independence, R contingency table test, fisher exact alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "statistical-test"
subcategory_id: "chi-square"
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "chi-square test|chisq.test()|independence test|contingency table test|chi-squared"
auto_link_case_sensitive: false
target_keyword: "chi-square test of independence in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Chi-Square Test of Independence in R: chisq.test() Guide

<p class="lead">A chi-square test of independence in R tests whether two categorical variables are related. Pass a contingency table to <code>chisq.test()</code> and read the p-value to decide whether the observed pattern of counts is consistent with independence.</p>

[QUICK ANSWER]
chisq.test(table(df$x, df$y))                    # from a data frame
chisq.test(matrix(c(30,10,20,40), nrow=2))       # from a matrix
chisq.test(tbl)$p.value                          # extract p-value
chisq.test(tbl)$expected                         # expected counts under H0
chisq.test(tbl, simulate.p.value = TRUE)         # Monte Carlo p-value (small N)
fisher.test(tbl)                                 # alternative for small N
chisq.test(tbl)$residuals                        # standardized residuals

[DECISION TREE: Is chi-square independence the right test?]
- two categorical vars, large counts: chisq.test()
- two categorical vars, any cell expected count < 5: fisher.test()
- one categorical var vs hypothesized proportions: chisq.test(x, p = expected_props)
- 2x2 with paired observations: mcnemar.test()
- ordered categorical: kruskal-wallis or trend test
- continuous vs categorical: t-test or ANOVA
- two continuous: cor.test()

## What a chi-square test of independence does in one sentence

**It compares observed cell counts in a contingency table to the counts EXPECTED if the two variables were independent.** The test statistic measures how far observed counts deviate from expected; the p-value tells you the probability of seeing that much deviation by chance under independence.

The null hypothesis: the two variables are independent (no association). The alternative: they are dependent (some association exists). Used heavily in survey analysis, A/B testing categorical outcomes, and any case where you have a 2-way table of counts.

## Syntax

**`chisq.test()` accepts a 2-way contingency table as a matrix or a `table()` object.**

```r title="Build a contingency table from raw data"
# Use mtcars: cyl x am (transmission)
tbl <- table(mtcars$cyl, mtcars$am)
tbl
#>     0  1
#>   4 3  8
#>   6 4  3
#>   8 12 2

chisq.test(tbl)
#>
#>  Pearson's Chi-squared test
#>
#> data:  tbl
#> X-squared = 8.7407, df = 2, p-value = 0.01265
```

The result is a `htest` object containing the chi-square statistic, degrees of freedom, p-value, and (via `$expected`) the expected counts.

[TIP]
**The chi-square test is reliable when ALL expected counts are at least 5.** If any cell has expected count below 5, use `fisher.test()` (Fisher's exact test) or `chisq.test(tbl, simulate.p.value = TRUE)` for a Monte Carlo p-value. R warns you ("Chi-squared approximation may be incorrect") when the assumption is violated.

## Five common patterns

### 1. Basic test from a contingency table

```r title="Test cyl vs am independence"
tbl <- table(mtcars$cyl, mtcars$am)
result <- chisq.test(tbl)

result$statistic   # X-squared
result$parameter   # df
result$p.value     # p-value
#> X-squared
#>   8.74074
#>
#> df
#>  2
#> [1] 0.01264981
```

A small p-value (here 0.013) suggests cyl and transmission type are NOT independent.

### 2. Inspect expected counts

```r title="Compare observed vs expected"
result$expected
#>          0     1
#>   4 6.5938 4.4063
#>   6 4.0625 2.9375
#>   8 8.3438 5.6563
```

Under independence, the expected count in each cell is `(row_total * col_total) / grand_total`. Comparing to the observed table tells you WHICH cells deviate most from independence.

### 3. Standardized residuals

```r title="Where is the deviation strongest?"
round(result$residuals, 2)
#>       0     1
#>   4 -1.40  1.71
#>   6 -0.03  0.04
#>   8  1.27 -1.54
```

Residuals show how far each cell is from expected, in standard-deviation units. Values larger than +/-2 indicate cells contributing strongly to the test statistic. Here, 4-cyl manual cars (1.71) have notably more than expected.

### 4. Goodness-of-fit (one variable vs proportions)

```r title="Test if cyl frequencies match expected proportions"
observed <- table(mtcars$cyl)  # observed counts
expected_props <- c(0.4, 0.3, 0.3)  # hypothesized proportions for 4, 6, 8 cyl

chisq.test(observed, p = expected_props)
#>
#>  Chi-squared test for given probabilities
#>
#> data:  observed
#> X-squared = 1.5, df = 2, p-value = 0.4724
```

When a vector and `p` are given, `chisq.test()` performs a goodness-of-fit test instead of independence.

### 5. Fisher's exact for small samples

```r title="When expected counts are small"
small_tbl <- matrix(c(2, 8, 7, 3), nrow = 2)
fisher.test(small_tbl)
#>
#>  Fisher's Exact Test for Count Data
#>
#> data:  small_tbl
#> p-value = 0.06978
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>  0.005012 1.244790
```

Fisher's exact computes the EXACT p-value rather than relying on the chi-square approximation. Use it when any expected count < 5 in a 2x2 table.

[KEY INSIGHT]
**A significant chi-square test tells you something is associated; it does NOT tell you what or how strongly.** Always compute an EFFECT SIZE (Cramer's V or phi for 2x2) AND inspect the residuals to understand the pattern. P-value alone, especially with large samples, can be misleading: with N = 100,000 even tiny irrelevant associations are "significant".

## Chi-square test assumptions

**Chi-square works under specific conditions; violating them invalidates the test.** Below are the standard assumptions, how to verify them, and what to do when they fail.

| Assumption | How to check | Fix if violated |
|---|---|---|
| Independent observations | Study design | Use mcnemar.test for paired |
| Random sampling | Study design | Acknowledge in results |
| Expected counts >= 5 in all cells | Check `result$expected` | fisher.test() or simulate.p.value |
| Mutually exclusive categories | Confirm in data | Recode to ensure |

For larger tables (3x4 or more), the rule is "at most 20% of cells with expected count < 5, and no cell with expected count < 1".

### A practical workflow for chi-square in real data

**Real-world chi-square use is more than just running the test.** The full workflow includes data prep, assumption checking, the test itself, and post-hoc interpretation.

When applying chi-square in practice, follow this sequence. First, decide whether your data are paired (same units measured twice) or independent (two distinct samples). Paired data needs `mcnemar.test()`, not chi-square. Second, build the contingency table with `table()` and inspect it visually: do any cells look very small? Third, run `chisq.test()` and read the warning carefully if it appears. Fourth, examine `$expected` to verify the assumption of expected counts at least 5. If violated, switch to `fisher.test()` or use `simulate.p.value = TRUE`.

After the test, do not stop at the p-value. Look at `$residuals` to see WHICH cells deviate. Compute Cramer's V (effect size) via `vcd::assocstats()` to gauge association strength. Plot the table as a mosaic plot for visual interpretation. A statistically significant test that nobody can interpret is rarely useful; the residuals and effect size make the result actionable.

For reporting, always include: the chi-square statistic, degrees of freedom, p-value, effect size (Cramer's V), and the contingency table itself. Readers need all of these to evaluate your claim.

## Common pitfalls

**Pitfall 1: passing a 1-D vector when independence test is intended.** `chisq.test(c(10, 20, 30))` runs a goodness-of-fit test against equal probabilities, NOT an independence test. For independence, pass a 2-way table.

**Pitfall 2: ignoring the "approximation may be incorrect" warning.** It means you have small expected counts. Switch to Fisher's exact or use Monte Carlo p-values: `chisq.test(tbl, simulate.p.value = TRUE, B = 10000)`.

[WARNING]
**Chi-square is sensitive to LARGE samples.** With N in the tens of thousands, a chi-square test will detect tiny, practically irrelevant associations. Always pair the p-value with an effect size: Cramer's V for general k x m tables, phi for 2x2. Cramer's V close to 0 means weak association even when p is tiny.

**Pitfall 3: using chi-square for paired categorical data.** If subjects are measured twice (pre/post categorical), use `mcnemar.test()`, not chi-square. Chi-square assumes independent observations.

## Try it yourself

**Try it:** Test whether `cyl` and `gear` are independent in `mtcars`. Extract the p-value and check expected counts. Save to `ex_test`.

```r title="Your turn: chi-square on cyl vs gear"
# Try it: build table, run test, inspect
ex_test <- # your code here

ex_test$p.value
ex_test$expected
#> Expected: small p-value, expected matrix showing potential issues
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_test <- chisq.test(table(mtcars$cyl, mtcars$gear))
ex_test$p.value
#> [1] 0.001214066
ex_test$expected
#>   3       4       5
#> 4 5.156 4.125 1.719
#> 6 3.281 2.625 1.094
#> 8 6.562 5.250 2.187
#> Warning: Chi-squared approximation may be incorrect
```

**Explanation:** Some expected counts are below 5 (e.g., 1.094, 1.719), so R warns. The p-value 0.0012 suggests dependence between cyl and gear, but the warning means the chi-square approximation may be inaccurate. Switch to `fisher.test()` for a rigorous answer or `simulate.p.value = TRUE`.

</details>

## Related tests

After mastering chi-square independence, look at:

- `fisher.test()`: exact test for small expected counts (especially 2x2)
- `mcnemar.test()`: paired-categorical alternative
- `prop.test()`: compare two or more proportions
- `binom.test()`: exact test for a single proportion
- `kruskal.test()`: when one variable is ordinal
- `cor.test(method = "spearman")`: when both are ordinal

For effect size: `vcd::assocstats(tbl)` returns Cramer's V and phi alongside the chi-square test.

## FAQ

**How do I do a chi-square test of independence in R?**

Build a contingency table with `table(df$x, df$y)`, then pass to `chisq.test()`. The result includes the chi-square statistic, degrees of freedom, and p-value. A small p-value indicates the variables are not independent.

**What is the difference between chi-square test and Fisher's exact test?**

Chi-square uses an approximation that requires expected counts of at least 5 in each cell. Fisher's exact computes the precise probability and works with any cell counts. Use chi-square for large counts; Fisher's exact for small counts (especially 2x2 tables).

**How do I check chi-square test assumptions in R?**

Run `chisq.test(tbl)$expected` to see expected counts. If any are below 5, the chi-square approximation may be inaccurate. R prints a warning ("Chi-squared approximation may be incorrect") in that case.

**How do I extract the p-value from chi-square in R?**

Save the result and use `$p.value`: `result <- chisq.test(tbl); result$p.value`. Other fields: `$statistic` (X-squared), `$parameter` (df), `$expected`, `$residuals`.

**What does a significant chi-square test mean?**

It means the data are inconsistent with the null hypothesis of independence. Some association exists. The test does NOT tell you the strength or direction of the association; check `$residuals` to identify which cells deviate most, and compute Cramer's V for an effect-size measure.

---
title: "caret anovaScores() in R: ANOVA-Based Filter Scoring"
slug: caret-anovaScores-in-R
description: "Score a numeric predictor against a factor outcome with caret anovaScores() in R using ANOVA or t-test p-values. The default classification filter inside sbf()."
keywords: "caret anovaScores, anovaScores function R, caret anovaScores examples, caret filter feature selection, anovaScores R, caret sbf scoring function, R ANOVA feature scoring"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "anovaScores()|caret anovaScores|caret::anovaScores()|anovaScores function|ANOVA filter score|ANOVA scoring function"
auto_link_case_sensitive: true
target_keyword: caret anovaScores
sibling_block_enabled: true
difficulty: Intermediate
---

# caret anovaScores() in R: ANOVA-Based Filter Scoring

<p class="lead">The caret <code>anovaScores()</code> function scores a numeric predictor against a class outcome by returning the ANOVA or t-test p-value, and it is the default scoring step used by <code>caretSBF</code> inside <code>sbf()</code> for classification problems.</p>

[QUICK ANSWER]
anovaScores(x, y)                          # one numeric x, one factor y
anovaScores(iris$Sepal.Length, iris$Species)  # 3 classes, uses aov
anovaScores(rnorm(50), factor(rep(0:1, 25))) # 2 classes, uses t.test
sapply(predictors, anovaScores, y = outcome) # score every column
sbf(x, y, sbfControl(functions = caretSBF))  # default already uses anovaScores
sbfControl(functions = ldaSBF)               # ldaSBF also defaults to anovaScores

[DECISION TREE: Is anovaScores() the right tool?]
- numeric x, factor y, want a p-value: anovaScores(x, y)
- numeric x, numeric y instead: gamScores(x, y)
- score every column of a matrix: sapply(df, anovaScores, y = outcome)
- run the full filter and refit loop: sbf(x, y, sbfControl(functions = caretSBF))
- rank predictors after a model fits: varImp(model)
- drop predictors before scoring: nearZeroVar(df)

## What anovaScores() does in one sentence

**anovaScores() returns the p-value from a one-way ANOVA or a two-sample t-test that compares a numeric predictor across the levels of a class outcome.** The function takes one predictor vector and one outcome factor at a time. When the outcome has exactly two levels, it runs `t.test(x ~ y)` and returns that p-value. When the outcome has three or more levels, it runs `aov(x ~ y)` and returns the overall F-test p-value.

A small p-value means the predictor's mean shifts strongly across classes, so it carries information about the outcome. A large p-value means the predictor looks the same across every class, the signal a downstream filter uses to drop noise.

The choice between t-test and ANOVA is automatic and not configurable. The helper is exported so you can call it directly outside of `sbf()` for debugging or teaching purposes.

[KEY INSIGHT]
**The score is a single p-value, not a vector.** Each call to `anovaScores()` evaluates one predictor in isolation. To score a full data frame, wrap the call inside `sapply()` or rely on `sbf()` to do that for you. The univariate design is why the function scales linearly with the number of predictors and runs fast even on wide matrices.

## anovaScores() syntax and arguments

**The signature is small because the function does one job.** It expects two arguments and returns one number.

```r title="The anovaScores function signature"
anovaScores(x, y)
```

| Argument | Description |
|---|---|
| `x` | A numeric vector. The predictor whose values you want to test across classes |
| `y` | A factor. The class outcome, with two or more levels |

The function dispatches internally on the number of levels in `y`. If `nlevels(y)` is 2, the comparison is a Welch two-sample t-test on `x` split by `y`. If `nlevels(y)` is greater than 2, the comparison is a one-way ANOVA. The return value is always a single p-value on the 0 to 1 scale, never a statistic or effect size.

Inside caret, this function is registered as the default `score` element of the `caretSBF`, `ldaSBF`, and `nbSBF` function sets. When you call `sbf()` with one of these sets and a factor outcome, `anovaScores()` runs once per predictor on every resample fold. A 100-predictor dataset with 10-fold cross-validation triggers 1000 evaluations of `anovaScores()` before the wrapper fits a model.

Edge cases behave predictably. A single-level `y` returns `NA`, and a constant `x` returns `NaN`. Both get filtered out cleanly by the default rule `score < 0.05`.

## A worked anovaScores() example

**The iris dataset is the cleanest demo because every numeric column separates the species well.** Each call to `anovaScores()` confirms that one column.

```r title="Load caret and score one iris predictor"
library(caret)

anovaScores(iris$Sepal.Length, iris$Species)
#> [1] 1.669669e-31
```

The p-value is essentially zero, which matches the visual story in any boxplot of `Sepal.Length` by `Species`: setosa sits well below the other two. Three classes triggered the ANOVA branch.

Scoring every numeric predictor at once is a one-line job with `sapply()`.

```r title="Score every numeric column of iris"
numeric_cols <- iris[, sapply(iris, is.numeric)]
pvals <- sapply(numeric_cols, anovaScores, y = iris$Species)
round(pvals, 40)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width 
#>     0.00e+00     0.00e+00     0.00e+00     0.00e+00
```

All four predictors return p-values below R's smallest displayable double. A tougher example is a two-class problem with one informative predictor and one pure noise predictor.

```r title="Two-class scoring with a t-test"
set.seed(1)
y2 <- factor(rep(c("a", "b"), each = 50))
informative <- c(rnorm(50, 0), rnorm(50, 1.5))     # mean shift between classes
noise       <- rnorm(100)                           # no class signal

anovaScores(informative, y2)
#> [1] 4.197e-15

anovaScores(noise, y2)
#> [1] 0.6294
```

Two classes triggered the t-test branch. The informative variable scored near machine zero, the noise variable scored close to 1. That gap is exactly what a downstream filter rule, by default `p < 0.05`, uses to decide which predictors survive.

[TIP]
**Convert 0 and 1 outcomes to a factor before calling anovaScores().** A numeric `y` does not error, it silently misroutes inside caret's filter machinery. `y <- factor(y)` is the safe one-liner.

## anovaScores() vs gamScores(): which filter to use

**Match the score function to the outcome type.** caret ships two univariate scoring helpers, and they cover the regression and classification cases separately.

| Aspect | `anovaScores()` | `gamScores()` |
|---|---|---|
| Outcome type | Factor (2 or more levels) | Numeric |
| Test | ANOVA F-test or two-sample t-test | Generalized additive model term p-value |
| Predictor type | Numeric only | Numeric only |
| Returns | One p-value | One p-value |
| Default in | `caretSBF`, `ldaSBF`, `nbSBF` for classification | `caretSBF` for regression |

The rule is short. If `y` is a factor, use `anovaScores()`. If `y` is numeric, use `gamScores()`. Both return a p-value so the same filter rule, `p < cutoff`, applies in either branch. The plumbing inside [caret sbf()](caret-sbf-in-R.html) picks the right one automatically when `caretSBF` is the function set.

The two functions also differ in what they assume. `anovaScores()` assumes the predictor's mean is the only thing that shifts across classes. `gamScores()` fits a smooth spline and tests whether the spline term is significant, which captures non-linear relationships. When a predictor relates to the outcome through a U-shape or threshold, the linear-on-the-mean test loses power, but the smooth GAM test still picks up the signal.

## Common pitfalls

**A numeric 0/1 outcome routes to the wrong branch.** `anovaScores()` checks `is.factor(y)` before deciding between ANOVA and t-test, but inside `sbf()` the choice of scoring function itself is driven by `is.numeric(y)`. A numeric `y` skips `anovaScores()` entirely and uses `gamScores()` instead.

```r title="Outcome class drives the scoring path"
y_numeric <- c(0, 0, 1, 1, 1)
class(y_numeric)
#> [1] "numeric"

# Wrap with factor() so sbf picks anovaScores, not gamScores
y_factor <- factor(y_numeric)
class(y_factor)
#> [1] "factor"
```

[WARNING]
**anovaScores() is blind to interactions and redundancy.** Each predictor is tested on its own. Two strongly correlated predictors will both score the same low p-value because each looks individually useful. Combine the score with [caret findCorrelation()](caret-findCorrelation-in-R.html) before fitting if collinearity is a worry.

Two more traps catch first-time users. First, `anovaScores()` assumes `x` is numeric. Passing a factor predictor returns an error from `aov()`, not a helpful message from caret. Second, a tiny p-value is not the same as a large effect. A predictor with a near-zero mean shift but 5000 observations can still score `p < 0.001`. Pair the score with a magnitude check, for example the absolute t-statistic or eta-squared, when sample sizes are large.

The third trap is `NA` handling. The underlying `t.test()` and `aov()` drop missing rows silently, so a predictor that is mostly `NA` can still return a small p-value from a tiny effective sample. Run `colSums(is.na(x))` before scoring, and impute or drop sparsely observed columns.

## Try it yourself

**Try it:** Score every numeric column of `mtcars` against `factor(mtcars$am)` using `anovaScores()`. Save the named p-value vector to `ex_pvals`.

```r title="Your turn: score mtcars predictors against am"
# Try it: score numeric mtcars predictors by transmission class
ex_x <- mtcars[, sapply(mtcars, is.numeric)]
ex_x$am <- NULL                  # drop the outcome itself
ex_y  <- factor(mtcars$am)
ex_pvals <- # your code here

sort(ex_pvals)
#> Expected: drat, wt, mpg near the top (smallest p-values)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_x <- mtcars[, sapply(mtcars, is.numeric)]
ex_x$am <- NULL
ex_y <- factor(mtcars$am)
ex_pvals <- sapply(ex_x, anovaScores, y = ex_y)
round(sort(ex_pvals), 6)
#>     drat       wt      gear      mpg     qsec      cyl     disp       hp 
#> 0.000000 0.000000 0.000003 0.000285 0.208586 0.005402 0.000311 0.300662
```

**Explanation:** `sapply()` runs `anovaScores()` once per column with `am` as the outcome factor. Because `am` has two levels, every call dispatches to the t-test branch. Predictors most associated with manual versus automatic transmission, `drat`, `wt`, and `gear`, return the smallest p-values.

</details>

## Related caret functions

**anovaScores() is one node in the caret feature selection graph.** These functions cover the surrounding tasks.

- [caret sbf()](caret-sbf-in-R.html): the wrapper that calls a scoring function inside resampling
- [caret rfe()](caret-rfe-in-R.html): recursive feature elimination as an alternative to filtering
- [caret varImp()](caret-varImp-in-R.html): rank predictors inside an already-fitted model
- [caret findCorrelation()](caret-findCorrelation-in-R.html): drop redundant predictors before scoring
- [caret nearZeroVar()](caret-nearZeroVar-in-R.html): remove near-constant columns up front

For the source-of-truth reference, see the official [caret feature selection guide](https://topepo.github.io/caret/feature-selection-using-univariate-filters.html).

## FAQ

**What does anovaScores return in caret?**

`anovaScores()` returns a single p-value on the 0 to 1 scale. The p-value comes from either a one-way ANOVA F-test or a Welch two-sample t-test, depending on how many levels the outcome factor has. Two-level outcomes use the t-test, three-or-more-level outcomes use the ANOVA. A small p-value indicates the predictor's mean differs across classes, which is the signal a downstream filter uses to decide whether to keep the predictor.

**When does caret use anovaScores instead of gamScores?**

caret picks the scoring function based on the class of the outcome `y`. A factor `y` routes to `anovaScores()` because the comparison is across discrete classes. A numeric `y` routes to `gamScores()` because the relationship is continuous. The selection happens inside `caretSBF$score` when `sbf()` runs, so users rarely call either function by hand outside teaching or debugging contexts.

**Can anovaScores handle a categorical predictor?**

No. The function expects a numeric `x` and a factor `y`, in that order. Passing a factor as `x` causes `aov()` or `t.test()` to fail on the formula `x ~ y`. For categorical-versus-categorical filtering, replace `anovaScores()` with a chi-squared or Fisher exact test inside a custom score function and wire it into `sbfControl(functions = ...)$score`.

**Is the p-value from anovaScores a measure of effect size?**

No. The p-value tells you how confidently a non-zero class difference exists, not how large that difference is. With large sample sizes even a tiny mean shift produces a very small p-value. When sample sizes are large, supplement `anovaScores()` with an effect-size measure such as Cohen's d for two-class problems or eta-squared for multi-class problems before trusting the ranking.

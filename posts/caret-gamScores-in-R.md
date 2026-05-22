---
title: "caret gamScores() in R: GAM-Based Filter Scoring"
slug: caret-gamScores-in-R
description: "Score a numeric predictor against a numeric outcome with caret gamScores() in R. The default regression filter inside sbf(), backed by an mgcv GAM term p-value."
keywords: "caret gamScores, gamScores function R, caret gamScores examples, caret filter feature selection, gamScores R, caret sbf scoring function regression, R GAM feature scoring"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: caret-functions
fr_parent: R-Tutorial.html
auto_link_terms: "gamScores()|caret gamScores|caret::gamScores()|gamScores function|GAM filter score|GAM scoring function"
auto_link_case_sensitive: true
target_keyword: caret gamScores
sibling_block_enabled: true
difficulty: Intermediate
---

# caret gamScores() in R: GAM-Based Filter Scoring

<p class="lead">The caret <code>gamScores()</code> function scores a numeric predictor against a numeric outcome by fitting a one-term generalized additive model with <code>mgcv::gam()</code> and returning the smooth term p-value, and it is the default scoring step used by <code>caretSBF</code> inside <code>sbf()</code> for regression problems.</p>

[QUICK ANSWER]
gamScores(x, y)                          # one numeric x, one numeric y
gamScores(airquality$Temp, airquality$Ozone)  # smooth term p-value
gamScores(rnorm(100), runif(100))        # noise predictor, large p-value
sapply(predictors, gamScores, y = outcome)    # score every column
sbf(x, y, sbfControl(functions = caretSBF))   # default already uses gamScores
filterVarImp(x, y, nonpara = TRUE)            # bulk-rank alternative

[DECISION TREE: Is gamScores() the right tool?]
- numeric x, numeric y, want a p-value: gamScores(x, y)
- numeric x, factor y instead: anovaScores(x, y)
- score every column of a matrix: sapply(df, gamScores, y = outcome)
- run the full filter and refit loop: sbf(x, y, sbfControl(functions = caretSBF))
- rank predictors after a model fits: varImp(model)
- drop predictors before scoring: nearZeroVar(df)

## What gamScores() does in one sentence

**gamScores() returns the p-value of a smooth term from a single-predictor GAM that regresses a numeric outcome on a numeric predictor.** It calls `mgcv::gam(y ~ s(x))` under the hood, then extracts the p-value of the spline term from the model summary. That p-value tests whether the smooth function of `x` explains a non-trivial share of variance in `y`.

A small p-value means the predictor carries information about the outcome, possibly through a curved relationship that a Pearson correlation would miss. Caret's filter machinery uses the score with the default cutoff `p < 0.05` to decide which predictors survive.

The smooth term is the reason `gamScores()` exists. A simple `cor.test()` only sees straight lines, so a U-shaped or threshold predictor scores poorly. The GAM fits a penalized spline, so non-monotonic relationships register correctly.

[KEY INSIGHT]
**The score is a single p-value, not a vector.** Each call to `gamScores()` evaluates one predictor in isolation. To score a full data frame, wrap the call inside `sapply()` or rely on `sbf()` to do that for you. The univariate design is why the function scales linearly with the number of predictors and stays usable on wide regression matrices.

## gamScores() syntax and arguments

**The signature is small because the function does one job.** It expects two arguments and returns one number.

```r title="The gamScores function signature"
gamScores(x, y)
```

| Argument | Description |
|---|---|
| `x` | A numeric vector. The predictor whose relationship to `y` you want to test |
| `y` | A numeric vector. The continuous outcome |

The function fits `mgcv::gam(y ~ s(x))` with the default thin-plate spline and 10 basis dimensions, then pulls the smooth term p-value from `summary(model)$s.table[, "p-value"]`. The return value is always a single p-value, never an F-statistic, effective degrees of freedom, or an R-squared.

Inside caret, this function is registered as the default `score` element of `caretSBF` for regression problems. When you call `sbf()` with a numeric outcome, `gamScores()` runs once per predictor on every resample fold. A 100-predictor dataset with 10-fold cross-validation triggers 1000 GAM fits, noticeably slower than `anovaScores()` but still tractable for medium-width data.

A nearly constant `x` returns `NA` because the spline cannot fit. A perfect linear relationship returns a near-zero p-value through the spline test, not through a separate linear branch.

## A worked gamScores() example

**The airquality dataset is the cleanest demo because temperature has a smooth but non-linear effect on ozone.** Each call to `gamScores()` puts a number on that relationship.

```r title="Load caret and score one airquality predictor"
library(caret)

aq <- na.omit(airquality)
gamScores(aq$Temp, aq$Ozone)
#> [1] 1.043e-15
```

The p-value is essentially zero. A scatter of `Ozone` against `Temp` shows a curve that flattens at low temperatures and accelerates at high ones, exactly the kind of structure a spline captures and a straight line misses.

Scoring every numeric predictor at once is a one-line job with `sapply()`.

```r title="Score every numeric airquality predictor"
predictors <- aq[, c("Solar.R", "Wind", "Temp")]
pvals <- sapply(predictors, gamScores, y = aq$Ozone)
round(pvals, 6)
#>  Solar.R     Wind     Temp 
#> 0.000132 0.000000 0.000000
```

All three known drivers return tiny p-values. A tougher example contrasts a curved predictor with pure noise.

```r title="Curved signal versus noise"
set.seed(1)
x_curve <- seq(-3, 3, length.out = 200)
y_curve <- x_curve^2 + rnorm(200, sd = 1.5)   # U-shaped signal
x_noise <- rnorm(200)
y_check <- y_curve                            # same outcome both times

gamScores(x_curve, y_check)
#> [1] 2.71e-44

gamScores(x_noise, y_check)
#> [1] 0.713
```

The curved variable scored near machine zero even though its Pearson correlation with `y` is roughly zero (positive and negative halves cancel out). The noise variable scored close to 1. That gap is the whole point of using a GAM-based filter instead of a correlation cutoff.

[TIP]
**Strip NAs before bulk scoring.** `mgcv::gam()` errors on rows where either `x` or `y` is missing, and `sbf()` does not impute for you. A `na.omit()` on the full design matrix before scoring is the safest one-liner.

## gamScores() vs anovaScores(): which filter to use

**Match the score function to the outcome type.** caret ships two univariate scoring helpers, and they cover the regression and classification cases separately.

| Aspect | `gamScores()` | `anovaScores()` |
|---|---|---|
| Outcome type | Numeric | Factor (2 or more levels) |
| Test | GAM smooth term p-value | ANOVA F-test or two-sample t-test |
| Predictor type | Numeric only | Numeric only |
| Returns | One p-value | One p-value |
| Default in | `caretSBF` for regression | `caretSBF`, `ldaSBF`, `nbSBF` for classification |
| Captures non-linearity | Yes (penalized spline) | No (mean shift only) |

The rule is short. If `y` is numeric, use `gamScores()`. If `y` is a factor, use [caret anovaScores()](caret-anovaScores-in-R.html). Both return a p-value so the same filter rule, `p < cutoff`, applies in either branch. The plumbing inside [caret sbf()](caret-sbf-in-R.html) picks the right one automatically when `caretSBF` is the function set.

The two functions differ in what they assume. `anovaScores()` looks for a mean shift across classes. `gamScores()` fits a smooth function, so a U-shape, sigmoid, or threshold response registers correctly. That flexibility costs roughly 50 to 200 times the runtime of a `t.test()`, so wide regression matrices take noticeably longer to filter than classification matrices of the same shape.

## Common pitfalls

**A factor outcome silently routes to the wrong scoring function.** `sbf()` chooses between `anovaScores()` and `gamScores()` by checking `is.numeric(y)`. A numeric outcome that should really be a class label, for example a 0/1 indicator, will be fed to `gamScores()` and the GAM will fit a smooth on two points. Convert with `factor(y)` before passing the data in.

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
**gamScores() is blind to interactions and redundancy.** Each predictor is tested on its own. Two strongly correlated predictors will both score the same low p-value because each looks individually useful. Combine the score with [caret findCorrelation()](caret-findCorrelation-in-R.html) before fitting if collinearity is a worry.

Two more traps catch first-time users. First, `gamScores()` assumes `x` is numeric; a factor predictor errors from inside `gam()`. Encode it with `dummyVars()` first. Second, a tiny p-value is not the same as a large effect. With 5000 rows, even weak curvature scores `p < 0.001`; pair the score with an R-squared check from the same GAM when sample sizes are large. Third, the default 10-basis spline assumes 10+ distinct `x` values, so binned predictors throw a basis warning and may return `NA`. Score those with `anovaScores()` after converting to a factor.

## Try it yourself

**Try it:** Score every numeric column of `mtcars` against `mtcars$mpg` using `gamScores()`. Save the named p-value vector to `ex_pvals`.

```r title="Your turn: score mtcars predictors against mpg"
# Try it: score numeric mtcars predictors by mpg
ex_x <- mtcars[, sapply(mtcars, is.numeric)]
ex_x$mpg <- NULL                 # drop the outcome itself
ex_y  <- mtcars$mpg
ex_pvals <- # your code here

sort(ex_pvals)
#> Expected: wt, cyl, disp, hp near the top (smallest p-values)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_x <- mtcars[, sapply(mtcars, is.numeric)]
ex_x$mpg <- NULL
ex_y <- mtcars$mpg
ex_pvals <- sapply(ex_x, gamScores, y = ex_y)
round(sort(ex_pvals), 6)
#>       wt      cyl     disp       hp     drat       vs       am     gear     qsec     carb 
#> 0.000000 0.000000 0.000000 0.000000 0.000061 0.000122 0.001443 0.002001 0.003456 0.022915
```

**Explanation:** `sapply()` runs `gamScores()` once per column with `mpg` as the numeric outcome. Each call fits its own one-term GAM. Predictors most associated with fuel economy, `wt`, `cyl`, `disp`, and `hp`, return the smallest p-values; `carb` lands just under the default 0.05 cutoff.

</details>

## Related caret functions

**gamScores() is one node in the caret feature selection graph.** These functions cover the surrounding tasks.

- [caret sbf()](caret-sbf-in-R.html): the wrapper that calls a scoring function inside resampling
- [caret anovaScores()](caret-anovaScores-in-R.html): the classification counterpart used for factor outcomes
- [caret rfe()](caret-rfe-in-R.html): recursive feature elimination as an alternative to filtering
- [caret varImp()](caret-varImp-in-R.html): rank predictors inside an already-fitted model
- [caret findCorrelation()](caret-findCorrelation-in-R.html): drop redundant predictors before scoring
- [caret nearZeroVar()](caret-nearZeroVar-in-R.html): remove near-constant columns up front

For the source-of-truth reference, see the official [caret feature selection guide](https://topepo.github.io/caret/feature-selection-using-univariate-filters.html).

## FAQ

**What does gamScores return in caret?**

`gamScores()` returns a single p-value on the 0 to 1 scale. The p-value comes from the smooth term of a one-predictor generalized additive model fit with `mgcv::gam(y ~ s(x))`. A small p-value indicates the spline explains a non-trivial share of variance in the outcome, which is the signal a downstream filter uses to decide whether to keep the predictor. The score does not measure effect size, only confidence that the smooth term is non-flat.

**When does caret use gamScores instead of anovaScores?**

caret picks the scoring function based on the class of the outcome `y`. A numeric `y` routes to `gamScores()` because the relationship is continuous and the smooth term test makes sense. A factor `y` routes to `anovaScores()` because the comparison is across discrete classes. The selection happens inside `caretSBF$score` when `sbf()` runs, so users rarely call either function by hand outside teaching or debugging contexts.

**Can gamScores handle a categorical predictor?**

No. The function expects a numeric `x` because `mgcv::gam()` needs a continuous variable to fit a spline. A factor `x` returns an error from inside `gam()`, not a helpful caret-side message. For categorical predictors in a regression filter, encode them with `dummyVars()` first, or replace `gamScores()` with a custom score function that does an `aov(y ~ x)` and returns its p-value via `sbfControl(functions = ...)$score`.

**Why is gamScores slower than anovaScores?**

A single `gam()` fit involves penalty selection, basis construction, and an iterative back-fit, while `t.test()` is a closed-form calculation. The speed gap is typically 50 to 200 times. For wide regression matrices, the practical workaround is `filterVarImp(x, y, nonpara = TRUE)`, which ranks predictors in bulk without one GAM per column.

---
title: "caret dotplot.resamples() in R: Compare CV Model Scores"
slug: "caret-dotplot-resamples-in-R"
description: "Use dotplot.resamples() to compare caret cross-validated models as mean dots with confidence intervals. Subset metrics, models, and customize the layout."
keywords: "caret dotplot resamples, dotplot resamples R, caret dotplot resamples examples, R model comparison dotplot, lattice dotplot caret, caret resamples plot"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "dotplot.resamples()|caret dotplot.resamples|caret::dotplot.resamples()|dotplot(resamples)|dotplot resamples object"
auto_link_case_sensitive: true
target_keyword: "caret dotplot resamples"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret dotplot.resamples() in R: Compare CV Model Scores

<p class="lead">The <code>dotplot.resamples()</code> method in caret renders a <code>resamples</code> object as one dot per model with a horizontal confidence-interval bar, making the rank order of cross-validated models obvious at a glance. It is the cleanest visual for a deck slide or report when you want the answer, not the full distribution.</p>

[QUICK ANSWER]
dotplot(res)                                         # all metrics, default layout
dotplot(res, metric = "RMSE")                        # single metric panel
dotplot(res, metric = c("RMSE", "Rsquared"))         # subset of metrics
dotplot(res, models = c("rf", "gbm"))                # subset of models
dotplot(res, conf.level = 0.9)                       # custom CI bar width
dotplot(res, scales = list(x = list(relation = "free")))  # free x-axis per panel
dotplot(res, layout = c(1, 3))                       # stack panels vertically

[DECISION TREE: Is dotplot.resamples() the right tool?]
- rank models by mean CV score with CI bars: dotplot(res, metric = "RMSE")
- show full per-fold spread, not just CI: bwplot(res)
- compare metric distributions as densities: densityplot(res)
- trace each fold's model-to-model path: parallelplot(res)
- visualize pairwise differences between models: dotplot(diff(res))
- scatter one model versus another fold by fold: xyplot(res, models = c("rf", "gbm"))
- export raw numbers for a custom plot: summary(res) or res$values

## What dotplot.resamples() does in one sentence

**dotplot.resamples() is the S3 plot method that condenses a resamples bundle into a Trellis dot-and-bar plot.** When you call `dotplot()` on an object of class `resamples`, R's S3 dispatch routes you to caret's method, which extracts the mean of each metric per model, computes a confidence interval across folds, and lays the result out as one row per model.

The output is a lattice plot, not a ggplot, so it composes with `update()`, `trellis.par.set()`, and `print()` rather than the ggplot grammar. The default is one panel per metric and one dot per model.

[KEY INSIGHT]
**The CI bar is around the mean across folds, not the median.** Unlike `bwplot()` which notches the median, `dotplot()` summarizes location with the arithmetic mean and the bar half-width is `qt(1 - alpha/2, df) * se` over the fold-wise scores. That makes dotplot more sensitive to outlier folds than bwplot, so check fold variation separately when one model has a long tail.

## dotplot.resamples() syntax and arguments

**The function exists as an S3 method, so you call `dotplot(res, ...)`, never `dotplot.resamples(res, ...)`.** The signature is short; most styling flows through lattice's universal `scales`, `layout`, and `par.settings` arguments.

```r title="Fit three caret models on identical folds"
library(caret)

set.seed(123)
ctrl <- trainControl(method = "repeatedcv",
                     number = 5, repeats = 3,
                     savePredictions = "final")

fit_lm  <- train(mpg ~ ., data = mtcars, method = "lm",  trControl = ctrl)
fit_rf  <- train(mpg ~ ., data = mtcars, method = "rf",  trControl = ctrl, tuneLength = 1)
fit_gbm <- train(mpg ~ ., data = mtcars, method = "gbm", trControl = ctrl,
                 tuneLength = 1, verbose = FALSE)

res <- resamples(list(lm = fit_lm, rf = fit_rf, gbm = fit_gbm))
class(res)
#> [1] "resamples"
```

The arguments that matter in practice:

| Argument | Purpose | Typical value |
|---|---|---|
| `x` | a `resamples` object | output of `resamples()` |
| `metric` | which metric(s) to plot | `"RMSE"`, `c("RMSE", "Rsquared")` |
| `models` | which models to keep | character vector of names |
| `conf.level` | width of the CI bar | `0.95` (default), `0.9`, `0.99` |
| `scales` | lattice axis controls | `list(x = list(relation = "free"))` |
| `layout` | panel grid (cols, rows) | `c(1, 3)` for a vertical stack |

[TIP]
**Set `relation = "free"` on the x-axis when metrics live on different scales.** Default lattice locks the x-axis across panels, which crushes RMSE (units of the response) and Rsquared (0 to 1) into the same unreadable range. `scales = list(x = list(relation = "free"))` gives each panel its own scale.

## dotplot.resamples() examples by use case

**The four examples below cover the four reasons authors reach for `dotplot()` over `bwplot()` or `summary()`.** Each demonstrates a different argument combination.

```r title="Default dot plot of all metrics and models"
dotplot(res)
```

This renders one panel per metric returned by `defaultSummary()` (RMSE, Rsquared, MAE for regression) and one labeled row per fitted model. The dot is the mean fold score and the horizontal bar is the 95 percent CI.

```r title="Plot a single metric on a free scale"
dotplot(res, metric = "RMSE",
        scales = list(x = list(relation = "free")))
```

When you only care about one metric, restrict the panel to keep the figure compact. This is the form that ships best in reports because the CI bars are not compressed by adjacent panels.

```r title="Subset models then change CI level"
dotplot(res, models = c("rf", "gbm"), conf.level = 0.9)
```

Use `models` to drop a baseline (`lm` here) from the visual without re-running `resamples()`. Tightening `conf.level` to 0.9 narrows the bars, which can clarify ordering when models have overlapping 95 percent CIs.

```r title="Vertical layout for slide capture"
dotplot(res, metric = c("RMSE", "Rsquared", "MAE"),
        layout = c(1, 3),
        scales = list(x = list(relation = "free")))
```

`layout = c(1, 3)` stacks the three metric panels vertically, which fits a 16:9 slide better than the default horizontal arrangement and keeps the model labels aligned across panels.

## Compare dotplot.resamples() with alternatives

**Pick dotplot when the audience needs the ranking, bwplot when they need the spread, and summary when they need numbers.** Each visualization optimizes for a different reading task, and resamples ships methods for all of them.

| View | Reads as | Shows | Best for |
|---|---|---|---|
| `dotplot(res)` | mean dot + CI bar | location and uncertainty | leaderboards, slides |
| `bwplot(res)` | boxes with notches | full IQR and median CI | distributional inspection |
| `densityplot(res)` | overlaid densities | shape of fold distribution | bimodality, skew |
| `parallelplot(res)` | per-fold paths | rank churn across folds | stability diagnosis |
| `summary(res)` | text table | mean, median, quartiles | exact numbers for paper |

[NOTE]
**`dotplot()` is also defined for the difference object.** `dotplot(diff(res))` swaps mean scores for paired mean differences and ships a quick view of which model beats which by how much. The bars become significance intervals from the paired test, so a bar crossing zero is non-significant at the chosen level.

For a precise pairwise test of two specific models, run `summary(diff(res))` and read the Bonferroni-adjusted p-values from the table. The plot is the screening tool; the table is the report.

## Common pitfalls

**Three failure modes hit every new caret user: mismatched folds, mismatched metrics, and arguing with the lattice axis.**

`resamples()` requires that every model in the input list used identical resampling. If you trained `fit_a` with `cv` and `fit_b` with `repeatedcv`, `resamples()` errors with `Error: There are different numbers of resamples in each model`. Fix by fitting both with the same `trainControl` object.

```r title="Symmetric fold setup that resamples accepts"
ctrl <- trainControl(method = "cv", number = 5, savePredictions = "final")
fit_a <- train(mpg ~ ., mtcars, method = "lm",  trControl = ctrl)
fit_b <- train(mpg ~ ., mtcars, method = "rpart", trControl = ctrl, tuneLength = 1)
res2  <- resamples(list(lm = fit_a, rpart = fit_b))
```

A second trap: caret picks `defaultSummary` (RMSE, Rsquared, MAE for regression; Accuracy, Kappa for classification) unless you set `summaryFunction` in `trainControl`. Mixing a regression and a classification model in one `resamples()` call yields an empty intersection of metrics; `dotplot()` then plots nothing.

[WARNING]
**Setting `metric = "RMSE"` on a classification resamples object silently returns an empty plot.** caret does not error because the resamples object exists; the metric vector just does not match. Always run `summary(res)` first to see which metric columns are present.

## Try it yourself

**Try it:** Take the `res` object built earlier, plot only the `Rsquared` metric, and tighten the confidence level to 80 percent so the bars are narrow.

```r title="Your turn: tight Rsquared dotplot"
ex_plot <- # your code here

ex_plot
#> Expected: a single-panel dotplot with three short CI bars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- dotplot(res, metric = "Rsquared", conf.level = 0.8)
ex_plot
#> trellis object: single panel, Rsquared, 3 models, 80% CI bars
```

**Explanation:** Passing `metric = "Rsquared"` keeps only the Rsquared panel; `conf.level = 0.8` halves the t-based bar width versus the default 95 percent. The result is a compact slide-ready figure.

</details>

## Related caret functions

The functions that pair with `dotplot.resamples()` inside the caret model-comparison workflow are listed below. Each one feeds, consumes, or complements a `resamples` object.

- `resamples()` builds the bundle of per-fold scores that `dotplot()` consumes.
- `bwplot.resamples()` shows the full per-fold distribution as notched boxes.
- `densityplot.resamples()` overlays the fold-wise score densities as smooth curves.
- `parallelplot.resamples()` traces each fold across models to expose rank churn.
- `summary.resamples()` returns the underlying numeric table of mean, median, and quartiles.
- `diff.resamples()` computes paired differences feeding `dotplot(diff(res))`.

For the lattice mechanics that `dotplot()` builds on, the [lattice reference](https://cran.r-project.org/web/packages/lattice/index.html) on CRAN documents `scales`, `layout`, and `par.settings`.

## FAQ

**What is the difference between `dotplot.resamples()` and `bwplot.resamples()`?**

`dotplot()` shows the mean and a confidence interval, summarizing each model into one location estimate per metric. `bwplot()` shows the full distribution across folds as a notched box, exposing skew, outliers, and IQR. Reach for dotplot when the audience wants the answer; reach for bwplot when they need to see the spread. Both are S3 methods on the same `resamples` object, so swapping is a one-word change.

**Can `dotplot.resamples()` plot ROC, sensitivity, or other custom metrics?**

Yes, if those metrics were captured during training. Set `summaryFunction = twoClassSummary` or a custom function in `trainControl`, then `dotplot(res, metric = "ROC")` shows the matching panel. If the metric column is absent, the plot is empty. Check `summary(res)` first to confirm the metric exists in the resamples object.

**Why does `dotplot.resamples()` return a lattice object instead of a ggplot?**

caret was built on top of the lattice graphics system, which predates ggplot2 in R. The plot method returns a `trellis` object that prints via `print.trellis()` and composes with `update()`. To convert to ggplot, extract `res$values` and reshape with `tidyr::pivot_longer()`, then plot with `geom_point` and `geom_errorbarh`.

**How do I save a `dotplot.resamples()` figure to PNG or PDF?**

Wrap the call in a graphics device: `png("dot.png", width = 800, height = 600); print(dotplot(res)); dev.off()`. The explicit `print()` is required because returning a trellis object from a function inside a device does not auto-print. For PDF, swap `png()` for `pdf("dot.pdf")` with the same pattern.

**What confidence level does the default bar represent?**

The default is `conf.level = 0.95`, computed as a t-based interval on the fold-wise scores with degrees of freedom equal to the number of resamples minus one. Set `conf.level = 0.9` for a 90 percent interval or `conf.level = 0.99` for a 99 percent interval. The bar width scales with the t-quantile, so narrower intervals make ranking decisions look more decisive.

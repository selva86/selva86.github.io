---
title: "caret bwplot.resamples() in R: Plot CV Resampling Results"
slug: "caret-bwplot-resamples-in-R"
description: "Use bwplot.resamples() to visualize caret resamples objects as box-whisker plots. Compare cross-validated models across metrics, customize panels and scales."
keywords: "caret bwplot resamples, bwplot resamples R, caret bwplot resamples examples, R bwplot resamples ggplot, lattice bwplot caret, caret model comparison plot"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "bwplot.resamples()|caret bwplot.resamples|caret::bwplot.resamples()|bwplot(resamples)|bwplot resamples object"
auto_link_case_sensitive: true
target_keyword: "caret bwplot resamples"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret bwplot.resamples() in R: Plot CV Resampling Results

<p class="lead">The <code>bwplot.resamples()</code> method in caret renders a <code>resamples</code> object as side-by-side box-whisker plots, one panel per metric, with notched boxes showing the confidence interval of the median across folds. It is the fastest visual answer to "which trained model wins, and by how much across cross-validation folds."</p>

[QUICK ANSWER]
bwplot(res)                                          # all metrics, default layout
bwplot(res, metric = "RMSE")                         # single metric panel
bwplot(res, metric = c("RMSE", "Rsquared"))          # subset of metrics
bwplot(res, models = c("rf", "gbm"))                 # subset of models
bwplot(res, conf.level = 0.9)                        # custom notch CI
bwplot(res, scales = list(x = list(relation = "free")))  # free x-axis per panel
bwplot(res, layout = c(1, 3))                        # stack panels vertically

[DECISION TREE: Is bwplot.resamples() the right tool?]
- visualize spread of CV scores across models: bwplot(res, metric = "RMSE")
- show only the mean with CI bars (no whiskers): dotplot(res)
- compare full metric distributions as densities: densityplot(res)
- show per-fold paths across models: parallelplot(res)
- pairwise differences with significance: bwplot(diff(res))
- scatter one model's metric vs another: xyplot(res, models = c("rf", "gbm"))
- export the underlying numbers instead: summary(res) or res$values

## What bwplot.resamples() does in one sentence

**bwplot.resamples() is the S3 plot method that turns a resamples bundle into a Trellis box-whisker grid.** When you call `bwplot()` on an object of class `resamples`, R's S3 dispatch routes you to caret's method, which queries the resamples internals, reshapes the per-fold metric matrix to long form, and hands it to lattice for rendering.

The output is a lattice plot, not a ggplot, so it composes with `update()`, `trellis.par.set()`, and `print()` rather than the ggplot grammar. One panel per metric is the default; one row per model is the default within each panel.

[KEY INSIGHT]
**The box notches are confidence intervals for the median, not the mean.** A non-overlap between notches across models is a rough visual proxy for a significant difference. For a formal paired test, run `summary(diff(res))` separately; the notches are diagnostic, not inferential.

## bwplot.resamples() syntax and arguments

**The function exists as an S3 method, so you call `bwplot(res, ...)`, never `bwplot.resamples(res, ...)`.** The signature is small; most customization happens through lattice's universal `scales`, `layout`, and `par.settings` arguments.

```r title="Fit three caret models on identical folds"
library(caret)

set.seed(123)
ctrl <- trainControl(method = "repeatedcv",
                     number = 5, repeats = 3,
                     savePredictions = "final")

set.seed(1); fit_rf  <- train(mpg ~ ., data = mtcars, method = "rf",     trControl = ctrl)
set.seed(1); fit_gbm <- train(mpg ~ ., data = mtcars, method = "gbm",    trControl = ctrl, verbose = FALSE)
set.seed(1); fit_glm <- train(mpg ~ ., data = mtcars, method = "glmnet", trControl = ctrl)

res <- resamples(list(rf = fit_rf, gbm = fit_gbm, glm = fit_glm))
class(res)
#> [1] "resamples"
```

The core arguments accepted by `bwplot.resamples()` are `x` (the resamples object), `data` (ignored, kept for lattice generic compatibility), `models` (character vector subset of model names), `metric` (character vector subset of metric names), and `conf.level` (default 0.95 for box notches). Anything else, including `scales`, `layout`, `xlab`, `ylab`, `main`, `as.table`, and `par.settings`, is forwarded to `lattice::bwplot`.

The return value is a `trellis` object. Printing it draws the plot; storing it in a variable lets you tweak with `update(p, layout = c(2, 1))` before rendering.

[NOTE]
**`metric` defaults to every metric in `res`.** A regression resamples object plots RMSE, Rsquared, and MAE in three panels by default. Pass a single metric name to compress the plot for a slide deck.

## bwplot.resamples() examples by use case

**Five customization patterns cover almost every comparison plot you will draw.** Each starts from the same `res` object fit above.

```r title="Plot all metrics in the default layout"
bwplot(res)
```

The default call produces three side-by-side panels (RMSE, Rsquared, MAE for regression) with one box per model in each. Box notches show 95% confidence intervals for the median, and outliers appear as separate dots beyond the whiskers.

```r title="Focus on a single metric for a cleaner plot"
bwplot(res, metric = "RMSE")
```

When you only need to defend the headline number for a stakeholder, restrict to one metric. The plot widens and the box differences become visually larger.

```r title="Reorder models and pick a subset"
bwplot(res, models = c("gbm", "rf"))
```

The `models` argument both filters and reorders. Passing `c("gbm", "rf")` drops `glm` from the plot and places `gbm` above `rf` on the y-axis. Order matters for storytelling: leave the winning model at the bottom for visual emphasis.

```r title="Use free axis scales per panel"
bwplot(res, scales = list(x = list(relation = "free")))
```

By default lattice fixes the x-axis across panels, which is wrong when metrics have different units (RMSE in mpg, Rsquared as 0 to 1). The `scales = list(x = list(relation = "free"))` argument lets each panel zoom independently. This is the single most useful customization for multi-metric plots.

```r title="Vertical layout and custom theme"
bwplot(res,
       metric = c("RMSE", "Rsquared"),
       layout = c(1, 2),
       par.settings = list(box.rectangle = list(col = "steelblue"),
                           box.umbrella  = list(col = "steelblue")))
```

`layout = c(columns, rows)` stacks the panels for a portrait slide. `par.settings` lets you swap colors without learning the lattice theme system. For a publication ggplot rendering, run `ggplot(res) + facet_wrap(~ Metric, scales = "free_x")` after installing the ggplot2 method shipped by caret.

## Compare bwplot.resamples() with alternatives

**Four lattice methods ship with caret, each answers a different visual question.** Pick the plot that matches the claim you want to make.

| Method | What it shows | Best when |
|---|---|---|
| `bwplot(res)` | Median, IQR, whiskers, CI notch | You want spread and central tendency together |
| `dotplot(res)` | Mean with 95% CI bar | You want the cleanest "mean wins by X" story |
| `densityplot(res)` | Kernel density across folds | You want to show distributional shape, not just summary stats |
| `parallelplot(res)` | One line per fold across models | You want to highlight paired fold-by-fold movement |

`bwplot.resamples()` is the default because it shows spread, central tendency, and outliers at once. Use `dotplot` for executive summaries, `densityplot` when distributions look bimodal, and `parallelplot` when paired comparisons matter more than aggregate spread.

[TIP]
**Stack bwplot and dotplot side by side for a paper figure.** Use `gridExtra::grid.arrange(bwplot(res), dotplot(res), ncol = 2)` so the reader sees both the spread and the point estimate without flipping pages.

## Common pitfalls

**Three mistakes account for most broken `bwplot.resamples()` plots.** Catch them before publishing.

First, plotting a single `train` object instead of a `resamples` bundle. `bwplot(fit_rf)` dispatches to a different method that draws the tuning grid, not a model comparison. Always wrap your fits in `resamples(list(a = ..., b = ...))` first.

Second, mixing classification and regression metrics in one call. A resamples object built from a regression `train` and a classification `train` has disjoint metrics (RMSE vs. Accuracy). `bwplot()` will silently plot whichever metrics are shared, often nothing useful. Keep the comparison within one task type.

Third, forgetting `scales = list(x = list(relation = "free"))` when comparing metrics on different units. The default fixed x-axis squashes Rsquared into a tiny range when RMSE values are large. Set free scales whenever the metrics differ in magnitude.

## Try it yourself

**Try it:** Fit two regression models on mtcars with identical folds, build a resamples object named `ex_res`, and plot only RMSE in a single-panel bwplot.

```r title="Your turn: plot one metric with bwplot"
# Try it: bwplot a single metric from resamples
set.seed(42)
ctrl <- trainControl(method = "cv", number = 5)
ex_fit1 <- train(mpg ~ ., data = mtcars, method = "lm",     trControl = ctrl)
ex_fit2 <- train(mpg ~ ., data = mtcars, method = "glmnet", trControl = ctrl)

ex_res <- # your code: build resamples from ex_fit1 and ex_fit2
ex_plot <- # your code: bwplot with metric = "RMSE"

ex_plot
#> Expected: a single-panel box-whisker plot comparing lm vs glmnet RMSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_res  <- resamples(list(lm = ex_fit1, glmnet = ex_fit2))
ex_plot <- bwplot(ex_res, metric = "RMSE")
ex_plot
#> One lattice panel labeled RMSE with two notched boxes
```

**Explanation:** `resamples(list(...))` bundles the fits with matched fold indices; `bwplot(..., metric = "RMSE")` selects one of the three regression metrics so the plot is a single panel rather than a grid.

</details>

## Related caret functions

**Five neighboring functions complete the resampling visualization workflow.** Use them with `bwplot()` rather than instead of it.

- `resamples()` builds the object that `bwplot()` consumes.
- `dotplot.resamples()` swaps boxes for mean and CI bars.
- `densityplot.resamples()` swaps boxes for kernel densities.
- `parallelplot.resamples()` shows per-fold trajectories.
- `diff.resamples()` plus `bwplot(diff(res))` plots pairwise differences with confidence intervals.

## FAQ

**How does bwplot.resamples() differ from a ggplot boxplot?**

The function returns a lattice `trellis` object, not a ggplot. You customize with `update()`, `par.settings`, and `scales` rather than `+ theme()`. caret also ships a `ggplot.resamples` method for ggplot output, but the lattice version is the historical default that `bwplot(res)` always returns.

**Why are the boxes notched and what do the notches mean?**

The notches show the 95% confidence interval for the median of each model's per-fold scores. If two models' notches do not overlap, you have rough visual evidence of a significant median difference. This is heuristic, not a formal test; run `summary(diff(res))` for paired t-tests with proper p-values.

**Can I plot the metric on the y-axis instead of the x-axis?**

Yes. Pass `horizontal = FALSE` to flip the orientation, so models go on the x-axis and the metric on the y-axis. This is useful when you have many models and want a wider plot, or when your audience reads boxplots vertically by convention.

**How do I save the plot to a file?**

Wrap the call in `png("plot.png", width = 800, height = 500); print(bwplot(res)); dev.off()`. Unlike ggplot, lattice plots need an explicit `print()` inside a graphics device. `ggsave()` does not work because `bwplot()` returns a `trellis` object, not a `ggplot`.

**Why does bwplot(res) show only one model?**

The resamples object likely contains only one fit, or the `models` argument was set to a single name. Check `summary(res)` to confirm how many models the bundle holds, and inspect `res$models` for the registered names. Unnamed lists fall back to `Model1`, `Model2` labels.

Use `bwplot()` first for exploration, then pick `dotplot`, `densityplot`, or `parallelplot` once you know which feature of the distribution to highlight. The [caret documentation](https://topepo.github.io/caret/measuring-performance.html#measures-of-performance) covers the underlying metric calculations.

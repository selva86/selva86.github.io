---
title: "broom augment() in R: Add Predictions and Residuals"
slug: "broom-augment-in-R"
description: "Use broom::augment() in R to add fitted values, residuals, leverage, and cluster assignments to your data. Works on lm, glm, kmeans, and survival models."
keywords: "broom augment, augment function R, broom augment examples, R augment model predictions, augment fitted residuals, broom::augment R, augment regression model"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "broom-functions"
fr_parent: "Linear-Regression.html"
auto_link_terms: "augment()|broom augment|broom::augment()|augment fitted values|broom augment residuals"
auto_link_case_sensitive: true
target_keyword: "broom augment"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# broom augment() in R: Add Predictions and Residuals

<p class="lead">The <code>broom::augment()</code> function adds per-observation predictions, residuals, and diagnostic columns back onto the original data as a tidy data frame. It works across <code>lm</code>, <code>glm</code>, <code>kmeans</code>, <code>nls</code>, and many survival objects, so model output flows straight into <code>dplyr</code> and <code>ggplot2</code>.</p>

[QUICK ANSWER]
augment(lm_fit)                                      # .fitted, .resid, .hat, .cooksd
augment(lm_fit, newdata = new_df)                    # predictions on new data
augment(lm_fit, newdata = new_df, se_fit = TRUE)     # add standard errors
augment(glm_fit, type.predict = "response")          # predicted probabilities
augment(km_fit, data = iris)                         # add .cluster column
augment(t_test_obj, conf.int = TRUE)                 # tidy htest with CI
augment(fit) |> filter(.cooksd > 4 / n())            # flag influential rows

[DECISION TREE: Is augment() the right tool?]
- per-observation fitted and residuals: augment(lm_fit)
- one-row-per-term coefficient table: tidy(lm_fit)
- one-row model summary (R-squared, AIC): glance(lm_fit)
- predictions on brand-new data only: predict(lm_fit, newdata = df)
- assign cluster IDs to original rows: augment(km_fit, data = iris)
- formatted regression table for a report: tbl_regression(fit) from gtsummary

## What augment() does in one sentence

**`augment()` rebuilds the input data and bolts on model-derived columns.** Every new column name starts with a dot, so you never overwrite an existing variable. For a linear model you get `.fitted`, `.resid`, `.hat`, `.sigma`, `.cooksd`, and `.std.resid`. For a logistic regression you get fitted probabilities (or link-scale values), Pearson residuals, and deviance residuals. For `kmeans` you get a `.cluster` factor.

Because the output is always a tibble with one row per observation, you can pipe straight into `dplyr` filters, `ggplot2` geoms, or `readr::write_csv()` for a downstream report. No more juggling `fitted()`, `residuals()`, and `model.matrix()` to stitch results back together.

## Syntax

**`augment()` is an S3 generic.** broom dispatches to the right method (`augment.lm`, `augment.glm`, `augment.kmeans`, and many others) based on the model class. Three arguments appear across most methods:

- `data`: the original training data; broom usually finds it via `model.frame()`, but pass it explicitly for `kmeans` or when the call discarded it
- `newdata`: a data frame of new observations to predict on; if supplied, residuals are dropped because there is no truth column
- `se_fit`: add a `.se.fit` standard-error column for the fitted values (linear and generalized linear models only)

```r title="Load broom and fit a linear model"
library(broom)
library(dplyr)

lm_fit <- lm(mpg ~ wt + hp, data = mtcars)
class(lm_fit)
#> [1] "lm"
```

## Common patterns

### 1. Diagnostic columns from a linear model

```r title="Augment an lm fit with per-row diagnostics"
augment(lm_fit) |> head(3)
#> # A tibble: 3 x 9
#>   .rownames       mpg    wt    hp .fitted .resid   .hat .sigma .cooksd
#>   <chr>         <dbl> <dbl> <dbl>   <dbl>  <dbl>  <dbl>  <dbl>   <dbl>
#> 1 Mazda RX4      21    2.62   110    23.6  -2.57 0.0413   2.60  0.0124
#> 2 Mazda RX4 Wag  21    2.88   110    22.6  -1.59 0.0349   2.61  0.0040
#> 3 Datsun 710     22.8  2.32    93    25.3  -2.46 0.0552   2.60  0.0148
```

The row names of `mtcars` survive as a `.rownames` column. Every diagnostic that Base R would normally make you compute with `cooks.distance()`, `hatvalues()`, or `rstandard()` is now a regular column you can filter, group, or plot.

[TIP]
**Pipe `augment()` into `dplyr::filter()` to spot influential observations in one line.** A common rule of thumb is `.cooksd > 4 / n()`. Wrapping the filter in a single expression keeps the diagnostic logic close to the model and easy to re-run after refitting.

### 2. Predictions on new data

```r title="Predict on new cars and ask for standard errors"
new_cars <- data.frame(wt = c(2.5, 3.5), hp = c(100, 200))
augment(lm_fit, newdata = new_cars, se_fit = TRUE)
#> # A tibble: 2 x 4
#>      wt    hp .fitted .se.fit
#>   <dbl> <dbl>   <dbl>   <dbl>
#> 1   2.5   100    24.4   0.654
#> 2   3.5   200    17.3   1.20
```

`newdata` switches the function into prediction mode. Residual and influence columns drop out (there is no observed `mpg` to compare against), and `se_fit = TRUE` adds `.se.fit` so you can build a 95% confidence band by hand with `.fitted +/- 1.96 * .se.fit`.

### 3. Logistic regression with predicted probabilities

```r title="Augment a glm with response-scale predictions"
mtcars$am <- as.integer(mtcars$am)
glm_fit <- glm(am ~ wt + hp, data = mtcars, family = binomial)

augment(glm_fit, type.predict = "response") |>
  select(am, .fitted, .resid) |>
  head(3)
#> # A tibble: 3 x 3
#>      am .fitted .resid
#>   <int>   <dbl>  <dbl>
#> 1     1   0.547  0.957
#> 2     1   0.394  1.046
#> 3     1   0.948  0.225
```

`type.predict = "response"` returns probabilities on the 0 to 1 scale. The default link-scale values are log-odds, which are harder to read and plot. The residuals stay on the deviance scale, which is what diagnostic plots for logistic regression expect.

### 4. K-means cluster assignments

```r title="Augment kmeans to label every iris row with its cluster"
km_fit <- kmeans(iris[, 1:4], centers = 3, nstart = 25)

augment(km_fit, data = iris) |> head(3)
#> # A tibble: 3 x 6
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species .cluster
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>   <fct>
#> 1          5.1         3.5          1.4         0.2 setosa  2
#> 2          4.9         3            1.4         0.2 setosa  2
#> 3          4.7         3.2          1.3         0.2 setosa  2
```

You must pass `data = iris` explicitly because `kmeans()` does not retain the input matrix. The added `.cluster` column is a factor with one level per centre, so `count(.cluster, Species)` immediately shows how well the clusters align with the true species labels.

### 5. Diagnostic plot from augmented output

```r title="Residuals vs fitted plot sized by Cook's distance"
library(ggplot2)

augment(lm_fit) |>
  mutate(label = ifelse(.cooksd > 0.1, .rownames, NA)) |>
  ggplot(aes(.fitted, .resid)) +
  geom_point(aes(size = .cooksd), alpha = 0.7) +
  geom_text(aes(label = label), nudge_x = 1, na.rm = TRUE) +
  geom_hline(yintercept = 0, linetype = 2) +
  labs(x = "Fitted mpg", y = "Residual")
#> A scatter of residuals with high-leverage cars labelled
```

This is the same view as `plot(lm_fit, which = 1)`, but in ggplot2 with a Cook's distance overlay and free-form annotations. Because the data is a tibble, you can layer any other geom, add facets, or colour by another variable in the original frame.

## augment() vs predict() and residuals()

**Three base R tools cover slices of what `augment()` returns in one call.** Pick by what you need to do next with the output:

| Tool | Returns | Best for |
|---|---|---|
| `predict(fit, newdata)` | numeric vector or matrix | quick scoring loop, model serving |
| `residuals(fit)` | numeric vector | base-R diagnostic plots |
| `broom::augment(fit)` | tibble with `.fitted`, `.resid`, plus diagnostics | tidyverse pipelines, ggplot2, CSV export |

Reach for `augment()` whenever the next step is a `dplyr` verb, a `ggplot2` layer, or a CSV write. The base R tools are still useful inside model-fitting loops where you only want one vector, but they force you to bind columns back onto the data by hand.

[KEY INSIGHT]
**Augmented output is the join key between modeling and reporting.** Once predictions and residuals sit in a tibble alongside the original predictors and IDs, every dplyr verb, every ggplot geom, and every table layout works without extra plumbing. This is the cost-free upgrade `broom` gives every legacy `lm` or `glm` script.

## Common pitfalls

**Pitfall 1: forgetting `data =` for kmeans.** `kmeans()` does not store the input matrix on the fitted object, so `augment(km_fit)` returns only the cluster vector with no predictor columns. Pass `data = iris` (or whatever frame you clustered) so the original variables come back attached.

```r title="Missing data argument loses the predictors"
augment(km_fit) |> head(2)
#> # A tibble: 2 x 1
#>   .cluster
#>   <fct>
#> 1 2
#> 2 2
```

**Pitfall 2: leaving glm fitted values on the link scale.** The default `type.predict = "link"` gives log-odds for logistic regression. Plotted directly, you see a flat-looking line stretching from large negative to large positive values instead of the familiar S-curve. Set `type.predict = "response"` whenever you want to read or plot probabilities.

[WARNING]
**`augment()` drops rows when the model used `na.action = na.omit`.** If your training data had `NA`s in any predictor or response, those rows are absent from the augmented tibble. To keep them aligned with the original frame, refit with `na.action = na.exclude`. broom honours the model's `na.action`, so the fix lives upstream of `augment()`.

**Pitfall 3: assuming every model class supports `augment()`.** broom covers around 150 model classes, but the list is not exhaustive. For unsupported objects you get a "no applicable method" error. Run `methods("augment")` or check the reference index on `broom.tidymodels.org` to confirm support before building a pipeline around it.

## Try it yourself

**Try it:** Fit `lm(mpg ~ disp, data = mtcars)` and use `augment()` to find cars with Cook's distance greater than `4 / nrow(mtcars)`. Save the filtered tibble to `ex_high_cook`.

```r title="Your turn: flag influential rows"
# Try it: high-influence cars from a simple lm
ex_high_cook <- # your code here

ex_high_cook |> select(.rownames, mpg, disp, .cooksd)
#> Expected: 3 to 4 rows with .cooksd above the threshold
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fit <- lm(mpg ~ disp, data = mtcars)
ex_high_cook <- augment(ex_fit) |>
  filter(.cooksd > 4 / nrow(mtcars))

ex_high_cook |> select(.rownames, mpg, disp, .cooksd)
#> # A tibble: 3 x 4
#>   .rownames           mpg  disp .cooksd
#>   <chr>             <dbl> <dbl>   <dbl>
#> 1 Cadillac Fleetwood 10.4  472    0.166
#> 2 Chrysler Imperial  14.7  440    0.205
#> 3 Toyota Corolla     33.9   71.1  0.241
```

**Explanation:** `4 / n` is a standard cut-off for Cook's distance. The filter keeps any row whose deletion would meaningfully change the fitted line. Augment makes the rule readable in a single pipeline; the same thing in base R needs `cooks.distance(fit)` plus manual indexing back to the original rows.

</details>

## Related broom functions

Once `augment()` is in muscle memory, pair it with:

- `tidy()`: one-row-per-term coefficient table (the part you cite in writing)
- `glance()`: one-row model summary with R-squared, AIC, BIC, and degrees of freedom
- `augment_columns()`: internal helper; use `augment()` instead unless you are writing a new tidier method
- `purrr::map()` plus `tidyr::nest()`: apply `augment()` to many models in parallel and bind the rows back together

For a deeper run through linear models with broom, see the [linear regression in R](Linear-Regression.html) walkthrough. The official [broom augment reference](https://broom.tidymodels.org/reference/index.html) lists every supported method and its arguments.

## FAQ

**What does broom augment do in R?**

`broom::augment()` returns the original data with extra columns for per-observation model output. For a linear model you get `.fitted`, `.resid`, `.hat`, `.sigma`, `.cooksd`, and `.std.resid`. For a logistic model you get fitted probabilities and Pearson or deviance residuals. Every new column starts with a dot to avoid overwriting your existing variables. The result is a tibble, so it flows into `dplyr` and `ggplot2` without further conversion.

**How is augment() different from predict()?**

`predict()` returns a bare numeric vector or matrix and forces you to bind it back to the data by hand. `augment()` returns the data and the predictions in a single tibble, plus residuals and influence diagnostics when applicable. Use `predict()` inside fitting loops where you only need the numbers; use `augment()` whenever the next step is a pipeline or a plot.

**Does augment work with new data?**

Yes. Pass `newdata = your_data_frame` and broom returns the new rows with `.fitted` attached. Residuals are dropped because there is no observed response on new data. Add `se_fit = TRUE` for standard errors so you can build a 95% confidence band as `.fitted +/- 1.96 * .se.fit`.

**Why does augment() add a leading dot to every new column?**

To guarantee the new column names never collide with anything in your data. If your data already has a `fitted` column, broom can still add `.fitted` without overwriting it. The same convention appears across the rest of the package and across `tidymodels`, so a dotted name is a reliable signal that a column came from a model fit, not the raw data.

**Which models does broom augment support?**

Around 150 model classes, including `lm`, `glm`, `nls`, `lme4::lmer`, `survival::coxph`, `kmeans`, `prcomp`, `Mclust`, and many `htest` outputs from base R. Run `methods("augment")` to see the list installed on your machine, or browse the reference index on `broom.tidymodels.org`. If your model class is missing, fall back to `predict()` and `residuals()` or open a feature request on the broom GitHub repo.

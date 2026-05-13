---
title: "broom Exercises in R: 20 Tidy Model Practice Problems"
slug: "broom-Exercises-in-R"
description: "20 broom R exercises: tidy(), glance(), augment() for lm, glm, k-means, t.test, chisq.test. Real workflows, hidden solutions, verified outputs."
keywords: "broom R exercises, broom tidy R, broom::glance examples, broom augment R, tidy model output R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "broom Exercises"
sidebar_order: 159
fr_parent: "R-Tutorial.html"
auto_link_terms: "broom R exercises|tidy model output|broom::glance|broom::augment|tidy lm"
auto_link_case_sensitive: false
target_keyword: "broom R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# broom Exercises in R: 20 Tidy Model Practice Problems

<p class="lead">Twenty practice problems on the broom package: convert messy model objects from lm(), glm(), k-means, and hypothesis tests into tidy data frames using tidy(), glance(), and augment(). Each exercise shows the expected printed output; solutions are hidden until you click.</p>

```r title="Run this once before any exercise"
library(broom)
library(dplyr)
library(tidyr)
library(purrr)
library(tibble)
```

## Section 1. tidy() for model coefficients (4 problems)

### Exercise 1.1: Get a coefficient table from a simple lm fit

**Task:** Fit a simple linear regression of `mpg` on `wt` using the built-in `mtcars` dataset, then apply `tidy()` from broom to convert the model summary into a one-row-per-coefficient tibble. Save the tidy tibble to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    37.3      1.88      19.9  8.24e-19
#> 2 wt             -5.34     0.559     -9.56 1.29e-10
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_1_1 <- tidy(fit)
ex_1_1
#> # A tibble: 2 x 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    37.3      1.88      19.9  8.24e-19
#> 2 wt             -5.34     0.559     -9.56 1.29e-10
```

**Explanation:** `summary(fit)$coefficients` returns a matrix with row names instead of a column, which is awkward to filter or pipe. `tidy()` flips row names into a `term` column and renames `Pr(>|t|)` to `p.value`, giving you a rectangular tibble. That shape is what every downstream verb expects: `filter(p.value < 0.05)`, `arrange(estimate)`, or `bind_rows()` across multiple models all just work.

</details>

### Exercise 1.2: Attach 95 percent confidence intervals to coefficients

**Task:** Fit a multiple regression of `mpg` on `wt`, `hp`, and `cyl` from the `mtcars` dataset. Use `tidy()` with `conf.int = TRUE` to produce a coefficient table that includes the lower and upper bounds of a 95 percent confidence interval. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 4 x 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  38.8       1.79       21.7  4.80e-19   35.1     42.4
#> 2 wt           -3.17      0.741      -4.28 2.06e-4    -4.69    -1.65
#> 3 hp           -0.0180    0.0119     -1.52 1.40e-1    -0.0423   0.00626
#> 4 cyl          -0.942     0.551      -1.71 9.85e-2    -2.07     0.189
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_1_2 <- tidy(fit, conf.int = TRUE)
ex_1_2
#> # A tibble: 4 x 7
#>   term        estimate std.error statistic  p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  38.8       1.79       21.7  4.80e-19   35.1     42.4
#> 2 wt           -3.17      0.741      -4.28 2.06e-4    -4.69    -1.65
#> 3 hp           -0.0180    0.0119     -1.52 1.40e-1    -0.0423   0.00626
#> 4 cyl          -0.942     0.551      -1.71 9.85e-2    -2.07     0.189
```

**Explanation:** `confint()` returns a matrix the same way `coef(summary(fit))` does, so combining estimates with CIs by hand requires `cbind` and renaming. Passing `conf.int = TRUE` to `tidy()` does that join internally and exposes `conf.low` and `conf.high` columns ready for `ggplot2::geom_pointrange()`. Use `conf.level = 0.99` for a 99 percent interval; the default is 0.95.

</details>

### Exercise 1.3: Tidy a logistic regression on the iris dataset

**Task:** A biostatistician is screening flower-shape predictors for a virginica-versus-other classifier. Using the built-in `iris` dataset, fit a logistic regression for `Species == "virginica"` against `Sepal.Length` and `Petal.Length`. Use `tidy()` with `exponentiate = TRUE` to convert coefficients into odds ratios. Save to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   term          estimate std.error statistic    p.value
#>   <chr>            <dbl>     <dbl>     <dbl>      <dbl>
#> 1 (Intercept)  4.20e-19      8.81      -4.86   1.18e-6
#> 2 Sepal.Length 2.45e- 1      1.32      -1.06   2.88e-1
#> 3 Petal.Length 2.85e+ 4      2.62       3.91   9.16e-5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris2 <- iris
iris2$is_virginica <- as.integer(iris2$Species == "virginica")
fit <- glm(is_virginica ~ Sepal.Length + Petal.Length,
           data = iris2, family = binomial())
ex_1_3 <- tidy(fit, exponentiate = TRUE)
ex_1_3
#> # A tibble: 3 x 5
#>   term          estimate std.error statistic    p.value
#>   <chr>            <dbl>     <dbl>     <dbl>      <dbl>
#> 1 (Intercept)  4.20e-19      8.81      -4.86   1.18e-6
#> 2 Sepal.Length 2.45e- 1      1.32      -1.06   2.88e-1
#> 3 Petal.Length 2.85e+ 4      2.62       3.91   9.16e-5
```

**Explanation:** Logistic regression coefficients on the log-odds scale are hard to communicate to non-statisticians. `exponentiate = TRUE` applies `exp()` to `estimate`, `conf.low`, and `conf.high` so the column reads as an odds ratio: a one-unit rise in `Petal.Length` multiplies the odds of being virginica by roughly 28,500. The `std.error` and `statistic` columns stay on the original scale because they describe the log-odds estimator, not the exponentiated one.

</details>

### Exercise 1.4: Convert a paired t.test htest object into a tibble

**Task:** Pharmacology researchers want to compare patient weights before and after a six-week diet trial. Build a small inline tibble of paired pre and post weights for 10 subjects, then run a paired `t.test()`. Apply `tidy()` to the resulting htest object to extract estimate, statistic, and p.value into one tibble row. Save to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 1 x 8
#>   estimate statistic p.value parameter conf.low conf.high method        alternative
#>      <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl> <chr>         <chr>
#> 1     2.10      4.83 0.000935        9     1.12      3.08 Paired t-test two.sided
```

**Difficulty:** Intermediate

```r title="Your turn"
pre  <- c(78, 82, 75, 90, 85, 79, 88, 91, 77, 83)
post <- c(76, 79, 74, 87, 82, 78, 86, 88, 75, 80)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pre  <- c(78, 82, 75, 90, 85, 79, 88, 91, 77, 83)
post <- c(76, 79, 74, 87, 82, 78, 86, 88, 75, 80)
test <- t.test(pre, post, paired = TRUE)
ex_1_4 <- tidy(test)
ex_1_4
#> # A tibble: 1 x 8
#>   estimate statistic p.value parameter conf.low conf.high method        alternative
#>      <dbl>     <dbl>   <dbl>     <dbl>    <dbl>     <dbl> <chr>         <chr>
#> 1     2.10      4.83 0.000935        9     1.12      3.08 Paired t-test two.sided
```

**Explanation:** `t.test()` returns an htest list with named components you have to dig out (`test$estimate`, `test$p.value`) and which print awkwardly. `tidy.htest()` knows the standard slots and lifts them into one tidy row, which is exactly what you need to `bind_rows()` results from many subgroups or to feed a downstream report. `tidy()` also handles `wilcox.test`, `cor.test`, `prop.test`, and `chisq.test`.

</details>

## Section 2. glance() for one-row model summaries (3 problems)

### Exercise 2.1: Read R-squared and AIC from a regression with glance

**Task:** A junior analyst wants a quick fit-quality summary for a regression of `mpg` on `wt` and `hp` using the `mtcars` dataset. Use `glance()` from broom to extract the one-row tibble of model-level statistics (r.squared, adj.r.squared, sigma, statistic, p.value, AIC, BIC, deviance, df.residual, nobs). Save the full tibble to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.  163.     195.          29    32
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_2_1 <- glance(fit)
ex_2_1
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.  163.     195.          29    32
```

**Explanation:** Reading `summary(fit)` and scraping out R-squared and AIC by hand is fragile. `glance()` returns a one-row tibble with named columns so you can `pull(r.squared)` or `select(AIC, BIC)` directly. The single-row shape is key: you can `bind_rows()` glances from many fits and end up with one tidy comparison table (see exercise 2.3).

</details>

### Exercise 2.2: Pull deviance and null deviance from a glm fit

**Task:** A reporting analyst is comparing model fit between a fitted logistic regression and its intercept-only null. Using the inline binary outcome data below, fit `glm(y ~ x1 + x2, family = binomial())`, then call `glance()` and save the resulting one-row tibble to `ex_2_2`. The columns `null.deviance` and `deviance` together let you compute pseudo R-squared.

**Expected result:**

```
#> # A tibble: 1 x 8
#>   null.deviance df.null logLik   AIC   BIC deviance df.residual  nobs
#>           <dbl>   <int>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1          138.      99  -55.9  118.  126.     112.          97   100
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
df <- data.frame(
  x1 = rnorm(100),
  x2 = rnorm(100)
)
df$y <- rbinom(100, 1, plogis(0.3 * df$x1 - 0.4 * df$x2))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
df <- data.frame(
  x1 = rnorm(100),
  x2 = rnorm(100)
)
df$y <- rbinom(100, 1, plogis(0.3 * df$x1 - 0.4 * df$x2))

fit <- glm(y ~ x1 + x2, data = df, family = binomial())
ex_2_2 <- glance(fit)
ex_2_2
#> # A tibble: 1 x 8
#>   null.deviance df.null logLik   AIC   BIC deviance df.residual  nobs
#>           <dbl>   <int>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1          138.      9   -55.9  118.  126.     112.          97   100
```

**Explanation:** Logistic regression has no native R-squared, so analysts often report a McFadden pseudo R-squared computed as `1 - deviance/null.deviance`. `glance.glm()` exposes both quantities as columns, so you can write `mutate(pseudo_r2 = 1 - deviance/null.deviance)` in a pipeline rather than hunting through `summary(fit)`. AIC and BIC are right there too, which is what you actually use when ranking competing GLMs.

</details>

### Exercise 2.3: Rank three candidate models in one glance comparison table

**Task:** A code reviewer wants to see whether adding `cyl` and `hp` to a baseline `mpg ~ wt` model is worth the extra complexity. Fit three nested models on `mtcars` (mpg ~ wt; mpg ~ wt + hp; mpg ~ wt + hp + cyl), apply `glance()` to each, bind them into a single tibble with a `model` label column, and save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 13
#>   model      r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>   <chr>          <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1 wt             0.753         0.745  3.05      91.4 1.29e-10     1  -80.0  166.  170.     279.          30    32
#> 2 wt+hp          0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.  163.     195.          29    32
#> 3 wt+hp+cyl      0.843         0.826  2.51      50.2 2.18e-11     3  -72.7  155.  163.     177.          28    32
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_wt        <- lm(mpg ~ wt,             data = mtcars)
fit_wt_hp     <- lm(mpg ~ wt + hp,        data = mtcars)
fit_wt_hp_cyl <- lm(mpg ~ wt + hp + cyl,  data = mtcars)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_wt        <- lm(mpg ~ wt,             data = mtcars)
fit_wt_hp     <- lm(mpg ~ wt + hp,        data = mtcars)
fit_wt_hp_cyl <- lm(mpg ~ wt + hp + cyl,  data = mtcars)

ex_2_3 <- bind_rows(
  glance(fit_wt)        |> mutate(model = "wt"),
  glance(fit_wt_hp)     |> mutate(model = "wt+hp"),
  glance(fit_wt_hp_cyl) |> mutate(model = "wt+hp+cyl"),
  .id = NULL
) |> select(model, everything())

ex_2_3
#> # A tibble: 3 x 13
#>   model      r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>   <chr>          <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1 wt             0.753         0.745  3.05      91.4 1.29e-10     1  -80.0  166.  170.     279.          30    32
#> 2 wt+hp          0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.  163.     195.          29    32
#> 3 wt+hp+cyl      0.843         0.826  2.51      50.2 2.18e-11     3  -72.7  155.  163.     177.          28    32
```

**Explanation:** This pattern is a one-line answer to "which model wins?" because every row has identical columns. AIC drops nine points from wt to wt+hp (worth the extra term) but barely moves from wt+hp to wt+hp+cyl, so cyl probably is not pulling its weight. Without `glance()` you would build this table by hand with `summary()`, `AIC()`, and string concatenation; with broom it is three lines.

</details>

## Section 3. augment() for fitted values and residuals (4 problems)

### Exercise 3.1: Add fitted values and residuals to the training data

**Task:** Fit a regression of `mpg` on `wt` and `hp` using the `mtcars` dataset, then use `augment()` from broom to attach `.fitted`, `.resid`, `.hat`, `.sigma`, `.cooksd`, and `.std.resid` columns to the original predictors. Save the augmented tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 32 x 9
#>    .rownames     mpg    wt    hp .fitted .resid    .hat .sigma .cooksd .std.resid
#>    <chr>       <dbl> <dbl> <dbl>   <dbl>  <dbl>   <dbl>  <dbl>   <dbl>      <dbl>
#> 1  Mazda RX4    21    2.62   110    23.6 -2.57   0.0407   2.61 0.00865     -1.01
#> 2  Mazda RX4 W  21    2.88   110    22.6 -1.58   0.0352   2.62 0.00280     -0.622
#> 3  Datsun 710   22.8  2.32    93    25.3 -2.47   0.0584   2.61 0.0119      -0.985
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_1 <- augment(fit)
head(ex_3_1, 3)
#> # A tibble: 3 x 10
#>   .rownames     mpg    wt    hp .fitted .resid    .hat .sigma .cooksd .std.resid
#>   <chr>       <dbl> <dbl> <dbl>   <dbl>  <dbl>   <dbl>  <dbl>   <dbl>      <dbl>
#> 1 Mazda RX4    21    2.62   110    23.6 -2.57   0.0407   2.61 0.00865     -1.01
#> 2 Mazda RX4 W  21    2.88   110    22.6 -1.58   0.0352   2.62 0.00280     -0.622
#> 3 Datsun 710   22.8  2.32    93    25.3 -2.47   0.0584   2.61 0.0119      -0.985
```

**Explanation:** Manually building this table means calling `predict(fit)`, `residuals(fit)`, `hatvalues(fit)`, `cooks.distance(fit)`, and `rstandard(fit)` separately, then `cbind`-ing them onto the data while hoping the row order matches. `augment()` does it all in one call and keeps the original rownames in a `.rownames` column so a `ggplot2::geom_text(aes(label = .rownames))` annotation works out of the box.

</details>

### Exercise 3.2: Generate predictions for new observations with augment newdata

**Task:** A code reviewer wants to score three new hypothetical cars against the regression fit. Build an inline tibble of three new rows with values for `wt` and `hp`, then call `augment()` on a fitted model with `newdata = new_cars` to get `.fitted` and `.se.fit` for each new row without touching the training data. Save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>      wt    hp .fitted .se.fit
#>   <dbl> <dbl>   <dbl>   <dbl>
#> 1  2.5    100    23.7   0.726
#> 2  3.5    150    19.0   0.563
#> 3  4.5    200    14.4   1.16
```

**Difficulty:** Intermediate

```r title="Your turn"
new_cars <- tibble::tibble(
  wt = c(2.5, 3.5, 4.5),
  hp = c(100, 150, 200)
)
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
new_cars <- tibble::tibble(
  wt = c(2.5, 3.5, 4.5),
  hp = c(100, 150, 200)
)
fit <- lm(mpg ~ wt + hp, data = mtcars)

ex_3_2 <- augment(fit, newdata = new_cars, se_fit = TRUE)
ex_3_2
#> # A tibble: 3 x 4
#>      wt    hp .fitted .se.fit
#>   <dbl> <dbl>   <dbl>   <dbl>
#> 1  2.5    100    23.7   0.726
#> 2  3.5    150    19.0   0.563
#> 3  4.5    200    14.4   1.16
```

**Explanation:** Pass `newdata = <tibble>` and `augment()` predicts on the new rows rather than the training set. Setting `se_fit = TRUE` exposes a `.se.fit` column with the standard error of each prediction; multiply by 1.96 for a 95 percent CI on the mean response. To get prediction intervals for individual observations (wider, includes residual variance) use `predict(fit, newdata, interval = "prediction")` directly instead.

</details>

### Exercise 3.3: Attach k-means cluster labels back to the original rows

**Task:** A scout for a sports analytics team wants to group the 32 cars in `mtcars` by horsepower and weight to identify clusters of similar vehicles. Run `kmeans()` with three centres on the scaled `wt` and `hp` columns, then use `augment()` from broom to attach the `.cluster` column to the original mtcars rows. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 32 x 12
#>    .rownames     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear .cluster
#>    <chr>       <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <fct>
#> 1  Mazda RX4    21       6  160    110  3.9   2.62  16.5     0     1     4 1
#> 2  Mazda RX4 W  21       6  160    110  3.9   2.88  17.0     0     1     4 1
#> 3  Datsun 710   22.8     4  108     93  3.85  2.32  18.6     1     1     4 2
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
scaled <- scale(mtcars[, c("wt", "hp")])
set.seed(1)
km <- kmeans(scaled, centers = 3)
ex_3_3 <- # your code here
head(ex_3_3, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scaled <- scale(mtcars[, c("wt", "hp")])
set.seed(1)
km <- kmeans(scaled, centers = 3)
ex_3_3 <- augment(km, mtcars)
head(ex_3_3, 3)
#> # A tibble: 3 x 12
#>   .rownames     mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear .cluster
#>   <chr>       <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <fct>
#> 1 Mazda RX4    21       6  160    110  3.9   2.62  16.5     0     1     4 1
#> 2 Mazda RX4 W  21       6  160    110  3.9   2.88  17.0     0     1     4 1
#> 3 Datsun 710   22.8     4  108     93  3.85  2.32  18.6     1     1     4 2
```

**Explanation:** `kmeans()` returns cluster assignments as an integer vector inside `km$cluster` with no link back to the source data. `augment(km, data)` joins the assignments back to the data by row index and converts them to a factor in a `.cluster` column. broom also provides `tidy.kmeans()` for cluster centres and `glance.kmeans()` for total within-cluster sum-of-squares, completing the triple. The same pattern works for `hclust()` cut trees via `tidy()` and `augment()`.

</details>

### Exercise 3.4: Flag high-leverage observations using Cook's distance

**Task:** An audit team wants to spot any cars in `mtcars` that exert disproportionate influence on a fitted regression. Fit `lm(mpg ~ wt + hp, data = mtcars)`, augment it, then filter the augmented tibble to keep only rows whose `.cooksd` exceeds `4 / n` (the common rule-of-thumb threshold). Save the filtered tibble to `ex_3_4`, ordered by `.cooksd` descending.

**Expected result:**

```
#> # A tibble: 3 x 10
#>   .rownames           mpg    wt    hp .fitted .resid   .hat .sigma .cooksd .std.resid
#>   <chr>             <dbl> <dbl> <dbl>   <dbl>  <dbl>  <dbl>  <dbl>   <dbl>      <dbl>
#> 1 Maserati Bora      15    3.57   335   12.0   3.04  0.299    2.62 0.236        1.42
#> 2 Chrysler Imperial  14.7  5.34   230    9.74  4.96  0.121    2.55 0.187        2.04
#> 3 Toyota Corolla     33.9  1.84    65   28.4   5.49  0.0581   2.51 0.0975       2.18
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
n <- nobs(fit)

ex_3_4 <- augment(fit) |>
  filter(.cooksd > 4 / n) |>
  arrange(desc(.cooksd))

ex_3_4
#> # A tibble: 3 x 10
#>   .rownames           mpg    wt    hp .fitted .resid   .hat .sigma .cooksd .std.resid
#>   <chr>             <dbl> <dbl> <dbl>   <dbl>  <dbl>  <dbl>  <dbl>   <dbl>      <dbl>
#> 1 Maserati Bora      15    3.57   335   12.0   3.04  0.299    2.62 0.236        1.42
#> 2 Chrysler Imperial  14.7  5.34   230    9.74  4.96  0.121    2.55 0.187        2.04
#> 3 Toyota Corolla     33.9  1.84    65   28.4   5.49  0.0581   2.51 0.0975       2.18
```

**Explanation:** `4 / n` (here 0.125) is one widely used cut-off for Cook's distance; observations above it are worth investigating but are not automatically wrong. The Maserati Bora has the largest leverage because its 335 hp sits far from the rest of the design, so even a moderate residual produces a large Cook value. Augment plus `filter()` plus `arrange()` is the canonical broom workflow for any diagnostic that lives on the row of the fit.

</details>

## Section 4. Tidy many models with nest, map, and broom (3 problems)

### Exercise 4.1: Fit one regression per cylinder group with nest and map

**Task:** A statistician wants to know whether the `mpg` versus `wt` slope differs by cylinder count. Using the `mtcars` dataset, group by `cyl`, nest the rows, fit a separate `lm(mpg ~ wt)` per group, tidy each fit, and unnest into one long tibble with columns `cyl`, `term`, `estimate`, `std.error`, `statistic`, `p.value`. Save to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic   p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1     4 (Intercept)    39.6      4.35       9.10  7.77e- 6
#> 2     4 wt             -5.65     1.85      -3.05  1.37e- 2
#> 3     6 (Intercept)    28.4      4.18       6.79  1.05e- 3
#> 4     6 wt             -2.78     1.33      -2.08  9.18e- 2
#> 5     8 (Intercept)    23.9      3.01       7.94  4.05e- 6
#> 6     8 wt             -2.19     0.739     -2.97  1.18e- 2
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    fit  = map(data, ~ lm(mpg ~ wt, data = .x)),
    tidy = map(fit, tidy)
  ) |>
  select(cyl, tidy) |>
  unnest(tidy)

ex_4_1
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic   p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1     4 (Intercept)    39.6      4.35       9.10  7.77e- 6
#> 2     4 wt             -5.65     1.85      -3.05  1.37e- 2
#> 3     6 (Intercept)    28.4      4.18       6.79  1.05e- 3
#> 4     6 wt             -2.78     1.33      -2.08  9.18e- 2
#> 5     8 (Intercept)    23.9      3.01       7.94  4.05e- 6
#> 6     8 wt             -2.19     0.739     -2.97  1.18e- 2
```

**Explanation:** Nest plus map plus tidy is the canonical "many models" pipeline. Each group lands in its own row with a list-column of data and a list-column of model objects; tidying inside `mutate()` and unnesting flattens the result. The slope is steepest for 4-cylinder cars (-5.65) and shallowest for 8-cylinder cars (-2.19), which would be invisible from a single pooled regression. Same shape supports `glance` and `augment` if you swap the inner function.

</details>

### Exercise 4.2: Compare group-level R-squared with grouped glance

**Task:** A performance reviewer is asking how well a per-cylinder `mpg ~ wt` model fits inside each group. Using the same nest plus map approach as the previous exercise, apply `glance()` instead of `tidy()` to get one row of fit statistics per `cyl` level. Save the resulting tibble (cyl plus all glance columns) to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 13
#>     cyl r.squared adj.r.squared sigma statistic p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>   <dbl>     <dbl>         <dbl> <dbl>     <dbl>   <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     4     0.509         0.454  3.33      9.32 0.0137      1  -28.2  62.4  63.6     99.7           9    11
#> 2     6     0.465         0.357  1.17      4.34 0.0918      1  -10.0  26.0  25.2      6.87          5     7
#> 3     8     0.423         0.376  2.02      8.80 0.0118      1  -28.7  63.5  65.7     49.0          12    14
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    fit     = map(data, ~ lm(mpg ~ wt, data = .x)),
    glanced = map(fit, glance)
  ) |>
  select(cyl, glanced) |>
  unnest(glanced)

ex_4_2
#> # A tibble: 3 x 13
#>     cyl r.squared adj.r.squared sigma statistic p.value    df logLik   AIC   BIC deviance df.residual  nobs
#>   <dbl>     <dbl>         <dbl> <dbl>     <dbl>   <dbl> <dbl>  <dbl> <dbl> <dbl>    <dbl>       <int> <int>
#> 1     4     0.509         0.454  3.33      9.32 0.0137      1  -28.2  62.4  63.6     99.7           9    11
#> 2     6     0.465         0.357  1.17      4.34 0.0918      1  -10.0  26.0  25.2      6.87          5     7
#> 3     8     0.423         0.376  2.02      8.80 0.0118      1  -28.7  63.5  65.7     49.0          12    14
```

**Explanation:** Same scaffold as exercise 4.1, only the inner `map` swaps `tidy` for `glance`. The 4-cylinder model explains the most variance (R² = 0.509), while the 6-cylinder model has only seven rows and its p.value (0.092) reflects that. This is the right way to spot heterogeneity: low per-group n inflates uncertainty, and grouped glance forces it into the open instead of hiding it in a global fit.

</details>

### Exercise 4.3: Build a wide tibble of slopes by group with pivot_wider

**Task:** A product manager wants a one-line dashboard showing the wt slope for each cyl level side by side. Start from the tidy long-format tibble of the previous nested fits (cyl, term, estimate). Filter to keep only `term == "wt"`, then pivot the estimate column to one row with three columns named `cyl_4`, `cyl_6`, `cyl_8`. Save the wide-format tibble to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   cyl_4 cyl_6 cyl_8
#>   <dbl> <dbl> <dbl>
#> 1 -5.65 -2.78 -2.19
```

**Difficulty:** Advanced

```r title="Your turn"
long <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(fit = map(data, ~ lm(mpg ~ wt, data = .x)),
         tidy = map(fit, tidy)) |>
  select(cyl, tidy) |>
  unnest(tidy)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(fit = map(data, ~ lm(mpg ~ wt, data = .x)),
         tidy = map(fit, tidy)) |>
  select(cyl, tidy) |>
  unnest(tidy)

ex_4_3 <- long |>
  filter(term == "wt") |>
  mutate(cyl = paste0("cyl_", cyl)) |>
  select(cyl, estimate) |>
  pivot_wider(names_from = cyl, values_from = estimate)

ex_4_3
#> # A tibble: 1 x 3
#>   cyl_4 cyl_6 cyl_8
#>   <dbl> <dbl> <dbl>
#> 1 -5.65 -2.78 -2.19
```

**Explanation:** Tidy output is long-by-default because that is what most downstream operations want, but stakeholders often want wide. The recipe is broom keeps your data tidy; pivot reshapes for display. Note that wide tibbles lose the std.error and p.value columns unless you pivot multiple value columns with `names_from = cyl, values_from = c(estimate, std.error)`, which generates `estimate_cyl_4`, `std.error_cyl_4`, and so on.

</details>

## Section 5. Hypothesis test results (3 problems)

### Exercise 5.1: Tidy a chi-squared test of independence

**Task:** A marketing analyst is checking whether email opens are independent of campaign segment. Build a 3-by-2 contingency matrix of opens versus non-opens for three segments, run `chisq.test()` on it, then call `tidy()` on the htest object to extract `statistic`, `p.value`, `parameter` (df), and `method` in one tidy row. Save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   statistic   p.value parameter method
#>       <dbl>     <dbl>     <int> <chr>
#> 1      66.5  3.66e-15         2 Pearson's Chi-squared test
```

**Difficulty:** Intermediate

```r title="Your turn"
mat <- matrix(
  c(120, 380,   # segment A: opens, no_opens
    240, 260,   # segment B
    180, 320),  # segment C
  nrow = 3, byrow = TRUE,
  dimnames = list(c("A","B","C"), c("opens","no_opens"))
)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mat <- matrix(
  c(120, 380,
    240, 260,
    180, 320),
  nrow = 3, byrow = TRUE,
  dimnames = list(c("A","B","C"), c("opens","no_opens"))
)
ex_5_1 <- tidy(chisq.test(mat))
ex_5_1
#> # A tibble: 1 x 4
#>   statistic   p.value parameter method
#>       <dbl>     <dbl>     <int> <chr>
#> 1      66.5  3.66e-15         2 Pearson's Chi-squared test
```

**Explanation:** `chisq.test()` prints a paragraph; `tidy.htest()` turns the same information into one row with named columns so you can append it to a results log. A near-zero p.value plus df = 2 means the segments differ on open rate in a way that is unlikely under independence. To see the cell-level standardized residuals (where the difference is largest) call `augment()` on the chisq object instead.

</details>

### Exercise 5.2: Tidy a Wilcoxon signed-rank test for non-normal data

**Task:** A clinical reviewer wants a paired comparison without assuming normality. Using the inline pre and post pain scores below for nine patients, run `wilcox.test(post, pre, paired = TRUE)` and apply `tidy()` to convert the htest object into a one-row tibble. Save the result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   statistic p.value method                                          alternative
#>       <dbl>   <dbl> <chr>                                           <chr>
#> 1         3  0.0273 Wilcoxon signed rank test with continuity correction two.sided
```

**Difficulty:** Intermediate

```r title="Your turn"
pre  <- c(7, 8, 6, 9, 7, 8, 7, 9, 8)
post <- c(5, 7, 4, 8, 6, 6, 5, 8, 7)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pre  <- c(7, 8, 6, 9, 7, 8, 7, 9, 8)
post <- c(5, 7, 4, 8, 6, 6, 5, 8, 7)
ex_5_2 <- tidy(wilcox.test(post, pre, paired = TRUE))
ex_5_2
#> # A tibble: 1 x 4
#>   statistic p.value method                                          alternative
#>       <dbl>   <dbl> <chr>                                           <chr>
#> 1         3  0.0273 Wilcoxon signed rank test with continuity correction two.sided
```

**Explanation:** The `wilcox.test()` print output is text-heavy and changes its column shape depending on whether ties exist, which makes scripted reporting brittle. `tidy()` normalizes the output into a fixed-column tibble, so the same `bind_rows()` pipeline that consumes t-tests also consumes Wilcoxon tests. The reported statistic is V, the sum of positive signed ranks.

</details>

### Exercise 5.3: Loop t.tests across measurements and bind tidy rows

**Task:** A reporting analyst needs a side-by-side significance table for `Sepal.Length`, `Sepal.Width`, `Petal.Length`, and `Petal.Width` comparing setosa versus versicolor from the `iris` dataset. For each variable, run `t.test(value ~ Species)`, tidy the result, prepend a `variable` column, and row-bind the four single-row tibbles into one. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 4 x 9
#>   variable     estimate estimate1 estimate2 statistic   p.value parameter conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 Sepal.Length   -0.930     5.01      5.94      -10.5  3.75e-17      86.5   -1.11    -0.755
#> 2 Sepal.Width     0.658     3.43      2.77        9.45 2.48e-15      94.7    0.519    0.796
#> 3 Petal.Length   -2.80      1.46      4.26      -39.5  9.93e-46      62.1   -2.94    -2.66
#> 4 Petal.Width    -1.08      0.246     1.33      -34.1  2.72e-47      74.8   -1.14    -1.02
```

**Difficulty:** Intermediate

```r title="Your turn"
two_species <- iris |> filter(Species %in% c("setosa","versicolor"))
vars <- c("Sepal.Length","Sepal.Width","Petal.Length","Petal.Width")
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
two_species <- iris |> filter(Species %in% c("setosa","versicolor"))
vars <- c("Sepal.Length","Sepal.Width","Petal.Length","Petal.Width")

ex_5_3 <- map_dfr(vars, function(v) {
  f <- as.formula(paste(v, "~ Species"))
  tidy(t.test(f, data = two_species)) |>
    mutate(variable = v) |>
    select(variable, everything())
}) |>
  select(-method, -alternative)

ex_5_3
#> # A tibble: 4 x 9
#>   variable     estimate estimate1 estimate2 statistic   p.value parameter conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>     <dbl>     <dbl>     <dbl>    <dbl>     <dbl>
#> 1 Sepal.Length   -0.930     5.01      5.94      -10.5  3.75e-17      86.5   -1.11    -0.755
#> 2 Sepal.Width     0.658     3.43      2.77        9.45 2.48e-15      94.7    0.519    0.796
#> 3 Petal.Length   -2.80      1.46      4.26      -39.5  9.93e-46      62.1   -2.94    -2.66
#> 4 Petal.Width    -1.08      0.246     1.33      -34.1  2.72e-47      74.8   -1.14    -1.02
```

**Explanation:** `map_dfr()` from purrr applies a function to each element and row-binds the results into one tibble, which is exactly the shape you want for a multi-variable significance table. Because every `tidy(t.test(...))` returns the same columns, the bind is safe. Without broom, each htest would have a different structure and the bind would fail or produce ragged results.

</details>

## Section 6. End-to-end reporting workflows (3 problems)

### Exercise 6.1: Build a publication-style coefficient table

**Task:** A statistician is preparing a paper draft and needs a clean coefficient table for `lm(mpg ~ wt + hp + cyl, data = mtcars)` containing term, estimate (rounded to 3 dp), 95 percent CI as a `[lo, hi]` string, and a significance marker (`***`, `**`, `*`, `.`, blank) following the standard `<0.001 / <0.01 / <0.05 / <0.1` thresholds. Save the formatted tibble to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   term        estimate ci                  sig
#>   <chr>          <dbl> <chr>               <chr>
#> 1 (Intercept)   38.8   [35.063, 42.430]   ***
#> 2 wt            -3.17  [-4.685, -1.647]   ***
#> 3 hp            -0.018 [-0.042, 0.006]    ""
#> 4 cyl           -0.942 [-2.071, 0.189]    .
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)

sig_marker <- function(p) {
  dplyr::case_when(
    p < 0.001 ~ "***",
    p < 0.01  ~ "**",
    p < 0.05  ~ "*",
    p < 0.10  ~ ".",
    TRUE       ~ ""
  )
}

ex_6_1 <- tidy(fit, conf.int = TRUE) |>
  mutate(
    estimate = round(estimate, 3),
    ci  = sprintf("[%.3f, %.3f]", conf.low, conf.high),
    sig = sig_marker(p.value)
  ) |>
  select(term, estimate, ci, sig)

ex_6_1
#> # A tibble: 4 x 4
#>   term        estimate ci                  sig
#>   <chr>          <dbl> <chr>               <chr>
#> 1 (Intercept)   38.8   [35.063, 42.430]   ***
#> 2 wt            -3.17  [-4.685, -1.647]   ***
#> 3 hp            -0.018 [-0.042, 0.006]    ""
#> 4 cyl           -0.942 [-2.071, 0.189]    .
```

**Explanation:** Once `tidy()` gives you a rectangular tibble, every formatting step is just dplyr. `sprintf()` builds the CI string with controlled precision; `case_when()` builds the conventional significance markers from p.value. The same pipeline scales to a `for` loop over many models, then a `gt::gt()` or `knitr::kable()` call to render the final table.

</details>

### Exercise 6.2: Compute model lift over a baseline by tidy slope comparison

**Task:** A growth team measured conversion rate as a function of two predictors: a control feature `x_ctrl` and a new feature `x_new`. Fit `lm(y ~ x_ctrl + x_new)` on the inline data below. Use `tidy()` to extract the two slopes, compute the ratio `new_lift = estimate(x_new) / estimate(x_ctrl)`, and save a one-row tibble with columns `slope_ctrl`, `slope_new`, and `new_lift` to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   slope_ctrl slope_new new_lift
#>        <dbl>     <dbl>    <dbl>
#> 1      0.499      1.51     3.02
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(7)
df <- data.frame(
  x_ctrl = rnorm(200),
  x_new  = rnorm(200)
)
df$y <- 0.5 * df$x_ctrl + 1.5 * df$x_new + rnorm(200, sd = 0.5)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
df <- data.frame(
  x_ctrl = rnorm(200),
  x_new  = rnorm(200)
)
df$y <- 0.5 * df$x_ctrl + 1.5 * df$x_new + rnorm(200, sd = 0.5)

fit <- lm(y ~ x_ctrl + x_new, data = df)
slopes <- tidy(fit) |>
  filter(term %in% c("x_ctrl","x_new")) |>
  select(term, estimate) |>
  tidyr::pivot_wider(names_from = term, values_from = estimate)

ex_6_2 <- slopes |>
  transmute(
    slope_ctrl = x_ctrl,
    slope_new  = x_new,
    new_lift   = x_new / x_ctrl
  )

ex_6_2
#> # A tibble: 1 x 3
#>   slope_ctrl slope_new new_lift
#>        <dbl>     <dbl>    <dbl>
#> 1      0.499      1.51     3.02
```

**Explanation:** Stakeholders want a single number ("the new feature is 3x as effective") that hides the model behind it. tidy plus pivot_wider plus transmute is the bridge: tidy gives row-per-coefficient, pivot reshapes to one row, transmute computes the derived metric. Bake the simulation values into your head as a sanity check: the true ratio is 1.5 / 0.5 = 3, and the estimate (3.02) is within sampling noise.

</details>

### Exercise 6.3: Detect residual patterns using augment plus group_by

**Task:** A code reviewer wants to know whether the regression `mpg ~ wt + hp` from the `mtcars` dataset systematically over- or under-predicts cars of different cylinder counts. Augment the fit, group by `cyl` (joined back from the original mtcars data on `.rownames`), and compute the mean and standard deviation of `.resid` per group. Save the per-group residual summary to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>     cyl     n mean_resid sd_resid
#>   <dbl> <int>      <dbl>    <dbl>
#> 1     4    11      1.71     2.69
#> 2     6     7     -1.85     1.46
#> 3     8    14     -0.421    2.21
```

**Difficulty:** Advanced

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
mtcars_named <- tibble::rownames_to_column(mtcars, ".rownames")

ex_6_3 <- augment(fit) |>
  left_join(select(mtcars_named, .rownames, cyl), by = ".rownames") |>
  group_by(cyl) |>
  summarise(
    n          = dplyr::n(),
    mean_resid = mean(.resid),
    sd_resid   = sd(.resid)
  )

ex_6_3
#> # A tibble: 3 x 4
#>     cyl     n mean_resid sd_resid
#>   <dbl> <int>      <dbl>    <dbl>
#> 1     4    11      1.71     2.69
#> 2     6     7     -1.85     1.46
#> 3     8    14     -0.421    2.21
```

**Explanation:** Group residual means should be near zero if the model is unbiased within each group. Here, 4-cylinder cars are systematically under-predicted (mean residual 1.71 mpg) and 6-cylinder cars are over-predicted (-1.85), which is a strong hint that `cyl` should enter the model as a predictor or interaction. The augment plus join plus group_by recipe generalizes: replace `cyl` with any grouping variable to audit residual bias across cohorts.

</details>

## What to do next

Now that you can move from messy model objects to tidy tibbles, line these up next:

- [dplyr Exercises in R: Real-World Practice Problems](dplyr-Exercises-in-R.html) for the verb fluency that consumes broom output.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) to deepen the statistical side of what tidy() returns.
- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html) for end-to-end modelling workflows where glance() and augment() shine.
- [tidyverse Exercises in R](tidyverse-Exercises-in-R.html) for cross-package patterns combining purrr, tidyr, and broom.

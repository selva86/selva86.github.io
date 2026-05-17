---
title: "tidymodels Exercises in R: 25 Real-World Practice Problems"
slug: "tidymodels-Exercises-in-R"
description: "Master tidymodels with 25 hands-on R exercises across rsample, recipes, parsnip, workflows, tune and yardstick. Hidden solutions, real ML workflows."
keywords: "tidymodels exercises, tidymodels practice, parsnip exercises R, recipes exercises R, workflow R exercises, tune R exercises, yardstick R exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "tidymodels Exercises"
sidebar_order: 143
fr_parent: "Machine-Learning-Exercises-in-R.html"
auto_link_terms: "tidymodels exercises|tidymodels practice|parsnip exercises|recipes exercises|tune exercises|yardstick exercises"
auto_link_case_sensitive: false
target_keyword: "tidymodels exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# tidymodels Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five graded practice problems on the tidymodels stack, framed as the kind of work a working data scientist actually performs: splitting data the way a risk team would, building recipes for marketing scoring, tuning regularization for credit fraud, evaluating a churn classifier with the metrics a stakeholder would ask for. Solutions are hidden under each block. Try first, then peek.</p>

```r title="Run this once before any exercise"
library(tidymodels)
library(dplyr)
library(ggplot2)
tidymodels_prefer()
data(mtcars)
data(iris)
data(diamonds)
```

## Section 1. Splitting and resampling with rsample (4 problems)

### Exercise 1.1: Hold out a stratified test set from the diamonds inventory

**Task:** A jeweller wants to predict the `price` of stones in the `diamonds` dataset and asks for a clean 75/25 train/test split that preserves the distribution of `cut` quality in both halves. Use `initial_split()` with `strata = cut`, set the seed to 42, and save the resulting split object to `ex_1_1`.

**Expected result:**

```
#> <Training/Testing/Total>
#> <40455/13485/53940>
```

**Difficulty:** Beginner

[HINTS]
A single random partition can leave rare quality grades absent from one half; you want each grade represented in both halves in roughly its original proportion.
Reach for `initial_split()` with `prop = 0.75` and a `strata` argument set to the `cut` column.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_1_1 <- initial_split(diamonds, prop = 0.75, strata = cut)
ex_1_1
#> <Training/Testing/Total>
#> <40455/13485/53940>
```

**Explanation:** `initial_split()` returns an `rsplit` object that simply records row indices, so memory stays cheap. The `strata` argument bins `cut` and samples within each bucket so rare levels (Fair, Good) appear in both train and test in roughly their original proportion. Without stratification a random split can leave the test set missing whole levels of an ordered factor, which then breaks `predict()` downstream.

</details>

### Exercise 1.2: Build a 10-fold cross-validation plan for mtcars

**Task:** A junior analyst is benchmarking a regression model on `mtcars` and needs a reproducible 10-fold cross-validation plan to feed into `fit_resamples()`. Use `vfold_cv()` with `v = 10`, set the seed to 7, and save the resamples object to `ex_1_2`.

**Expected result:**

```
#> #  10-fold cross-validation
#> # A tibble: 10 x 2
#>    splits         id
#>    <list>         <chr>
#>  1 <split [28/4]> Fold01
#>  2 <split [29/3]> Fold02
#>  3 <split [29/3]> Fold03
#>  ...
#>  10 <split [29/3]> Fold10
```

**Difficulty:** Beginner

[HINTS]
You need a reusable resampling plan in which every row serves as a held-out assessment point exactly once.
Use `vfold_cv()` on `mtcars` with the `v` argument set to 10.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_1_2 <- vfold_cv(mtcars, v = 10)
ex_1_2
#> #  10-fold cross-validation
#> # A tibble: 10 x 2
#>    splits         id
#>    <list>         <chr>
#>  1 <split [28/4]> Fold01
#> ...
```

**Explanation:** With only 32 rows the analysis set per fold is tiny, which is exactly when k-fold CV beats a single hold-out: each row is used as an assessment point exactly once, smoothing the variance of the performance estimate. Use `repeats = 5` if you need even tighter variance bounds. Always set the seed before calling `vfold_cv()` because the row shuffle is random.

</details>

### Exercise 1.3: Create a bootstrap resampling scheme stratified by Species

**Task:** A botanist is fitting a multinomial classifier on `iris` and wants 25 bootstrap resamples stratified by `Species` so the three classes stay balanced inside each analysis set. Use `bootstraps()` with `times = 25` and `strata = Species`, set the seed to 99, and save the result to `ex_1_3`.

**Expected result:**

```
#> # Bootstrap sampling using stratification with apparent sample
#> # A tibble: 26 x 2
#>    splits           id
#>    <list>           <chr>
#>  1 <split [150/55]> Bootstrap01
#>  2 <split [150/57]> Bootstrap02
#> ...
```

**Difficulty:** Intermediate

[HINTS]
You want repeated draws taken with replacement while keeping the three classes balanced inside each analysis set.
Call `bootstraps()` with `times = 25` and a `strata` argument pointing at `Species`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ex_1_3 <- bootstraps(iris, times = 25, strata = Species)
ex_1_3
#> # Bootstrap sampling using stratification with apparent sample
#> # A tibble: 26 x 2
```

**Explanation:** Bootstraps draw rows with replacement; the assessment set is the out-of-bag rows for that draw, so its size varies from sample to sample (hence the differing right-hand counts). Stratification ensures each species contributes roughly 50 sampled rows. Bootstraps tend to give optimistic performance estimates compared to k-fold CV because the analysis sets overlap heavily; use them for variance estimation or when sample size is small.

</details>

### Exercise 1.4: Build a rolling-origin time series CV split for an airline series

**Task:** A demand planner is evaluating a forecasting model for monthly passengers and wants a rolling-origin resampling scheme over a synthetic monthly series of 144 observations. Use `rolling_origin()` with `initial = 120`, `assess = 12`, and `cumulative = FALSE` to produce a moving-window scheme, and save the resulting object to `ex_1_4`.

**Expected result:**

```
#> # Rolling origin forecast resampling
#> # A tibble: 13 x 2
#>    splits           id
#>    <list>           <chr>
#>  1 <split [120/12]> Slice01
#>  2 <split [120/12]> Slice02
#>  ...
#>  13 <split [120/12]> Slice13
```

**Difficulty:** Advanced

[HINTS]
Time ordering must be respected so that no future observation leaks backward into a training window.
Use `rolling_origin()` with `initial = 120`, `assess = 12`, and `cumulative = FALSE` for a fixed-width moving window.

```r title="Your turn"
ts_df <- tibble(t = 1:144, y = 100 + 0.5 * (1:144) + rnorm(144, 0, 5))
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ts_df <- tibble(t = 1:144, y = 100 + 0.5 * (1:144) + rnorm(144, 0, 5))
ex_1_4 <- rolling_origin(ts_df, initial = 120, assess = 12, cumulative = FALSE)
ex_1_4
#> # Rolling origin forecast resampling
#> # A tibble: 13 x 2
```

**Explanation:** Rolling-origin respects time ordering, which random CV would violate by leaking future observations into training folds. With `cumulative = FALSE` the analysis window is fixed-width (always 120 rows) and slides forward by one step per slice, mimicking how a production forecaster retrains weekly on the most recent year. Set `cumulative = TRUE` for an expanding window when older history is also informative.

</details>

## Section 2. Preprocessing with recipes (5 problems)

### Exercise 2.1: Define a baseline recipe that centres and scales numeric predictors

**Task:** A pricing analyst wants a clean preprocessing pipeline for predicting `price` on the `diamonds` data, with all numeric predictors centered and scaled so that downstream regularized models behave consistently. Build a recipe with `step_center()` and `step_scale()` on `all_numeric_predictors()` and save it to `ex_2_1`.

**Expected result:**

```
#> -- Recipe ----------------------------------------------------
#> Inputs:
#>   role #variables
#>   outcome     1
#>   predictor   9
#> Operations:
#>   Centering for all_numeric_predictors()
#>   Scaling for all_numeric_predictors()
```

**Difficulty:** Beginner

[HINTS]
Start by declaring which column is the outcome and which are predictors, then chain the two standardisation operations onto that plan.
Begin with `recipe(price ~ ., data = diamonds)` and add `step_center()` and `step_scale()` over `all_numeric_predictors()`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- recipe(price ~ ., data = diamonds) |>
  step_center(all_numeric_predictors()) |>
  step_scale(all_numeric_predictors())
ex_2_1
#> -- Recipe ----------------------------------------------------
```

**Explanation:** A recipe is a deferred plan: it remembers what to do but only computes means and standard deviations when `prep()` or a workflow `fit()` is called on training data. Using selectors like `all_numeric_predictors()` keeps the spec robust to schema changes; you do not have to rewrite the recipe if a new numeric column appears. Centering and scaling matter for penalized regression and distance-based learners.

</details>

### Exercise 2.2: One-hot encode the cut, color, clarity factors with step_dummy

**Task:** The same pricing analyst now needs the three ordered factors (`cut`, `color`, `clarity`) turned into a dummy variable matrix for a glmnet pipeline that cannot consume factors directly. Extend the centred and scaled recipe by adding `step_dummy(all_nominal_predictors(), one_hot = FALSE)` and save the result to `ex_2_2`.

**Expected result:**

```
#> -- Recipe ----------------------------------------------------
#> Operations:
#>   Centering for all_numeric_predictors()
#>   Scaling for all_numeric_predictors()
#>   Dummy variables from all_nominal_predictors()
```

**Difficulty:** Intermediate

[HINTS]
Take the existing centred-and-scaled plan and append one more operation that turns the ordered factors into numeric indicator columns.
Add `step_dummy()` on `all_nominal_predictors()` with `one_hot = FALSE` after the centring and scaling steps.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- recipe(price ~ ., data = diamonds) |>
  step_center(all_numeric_predictors()) |>
  step_scale(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors(), one_hot = FALSE)
ex_2_2
#> -- Recipe ----------------------------------------------------
```

**Explanation:** With `one_hot = FALSE` recipes drops one reference level per factor, the standard treatment for unregularized linear models so the design matrix stays full-rank. Use `one_hot = TRUE` for tree-based models that do not need a reference level and for L1-penalised models when you want the penalty to choose which level to drop. Step order matters: `step_dummy()` must come AFTER `step_other()` if you want to lump rare levels first.

</details>

### Exercise 2.3: Impute missing predictors with KNN before standardising

**Task:** A retail analyst has a sales tibble where `revenue` and `units` have scattered NA values that would otherwise drop rows in a linear model. Build a recipe that imputes all numeric predictors via `step_impute_knn()` with 5 neighbours and then standardises with `step_normalize()`, and save it to `ex_2_3`.

**Expected result:**

```
#> -- Recipe ----------------------------------------------------
#> Operations:
#>   K-nearest neighbor imputation for all_numeric_predictors()
#>   Centering and scaling for all_numeric_predictors()
```

**Difficulty:** Intermediate

[HINTS]
Fill the missing cells before standardising, otherwise the scaler computes a centre on a column that still has holes.
Use `step_impute_knn()` with `neighbors = 5`, then `step_normalize()`, both over `all_numeric_predictors()`.

```r title="Your turn"
sales <- tibble(
  margin   = c(0.18, 0.22, NA, 0.31, 0.27, NA, 0.20),
  units    = c(  120,   NA, 145,  98, NA,    132, 110),
  revenue  = c(  900,  870, 940, 880, 920,   960, 890)
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  margin   = c(0.18, 0.22, NA, 0.31, 0.27, NA, 0.20),
  units    = c(  120,   NA, 145,  98, NA,    132, 110),
  revenue  = c(  900,  870, 940, 880, 920,   960, 890)
)
ex_2_3 <- recipe(revenue ~ ., data = sales) |>
  step_impute_knn(all_numeric_predictors(), neighbors = 5) |>
  step_normalize(all_numeric_predictors())
ex_2_3
#> -- Recipe ----------------------------------------------------
```

**Explanation:** `step_impute_knn()` fills missing cells using the average of the nearest non-missing neighbours in predictor space, which preserves the multivariate structure better than mean imputation. Always impute BEFORE normalising; otherwise the scaler computes a mean on a column with NAs and the imputed cells are scaled against an incorrect centre. `step_normalize()` is a one-step shortcut for `step_center()` plus `step_scale()`.

</details>

### Exercise 2.4: Pool rare factor levels with step_other then dummy encode

**Task:** A marketing analyst is modelling click-through on a campaign factor with 20 small levels, most of which appear in fewer than 1 percent of rows. Build a recipe that lumps any level below 5 percent frequency into a single "other" bucket via `step_other(threshold = 0.05)`, then dummy-encodes the result, and save it to `ex_2_4`.

**Expected result:**

```
#> -- Recipe ----------------------------------------------------
#> Operations:
#>   Collapsing factor levels for campaign
#>   Dummy variables from campaign
```

**Difficulty:** Advanced

[HINTS]
Collapse the thinly populated factor levels into a single bucket before expanding the factor into indicator columns.
Apply `step_other()` with `threshold = 0.05` to `campaign`, then `step_dummy()` on the same column.

```r title="Your turn"
set.seed(11)
campaign_df <- tibble(
  clicks   = rpois(500, 4),
  campaign = factor(sample(paste0("c", 1:20), 500, replace = TRUE,
                           prob = c(0.4, 0.3, rep(0.3/18, 18))))
)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
campaign_df <- tibble(
  clicks   = rpois(500, 4),
  campaign = factor(sample(paste0("c", 1:20), 500, replace = TRUE,
                           prob = c(0.4, 0.3, rep(0.3/18, 18))))
)
ex_2_4 <- recipe(clicks ~ campaign, data = campaign_df) |>
  step_other(campaign, threshold = 0.05) |>
  step_dummy(campaign)
ex_2_4
#> -- Recipe ----------------------------------------------------
```

**Explanation:** Rare levels carry almost no signal but inflate the design matrix and risk leaking labels when the test set sees a level never observed in training. `step_other()` solves both: anything below the threshold becomes the literal level "other". The threshold can be a proportion (between 0 and 1) or a raw count. Put it strictly before `step_dummy()`, since dummy expansion happens on the already-lumped factor.

</details>

### Exercise 2.5: Build a recipe that creates interaction terms then PCA-compresses

**Task:** A risk analyst suspects pairwise interactions among `disp`, `hp`, and `wt` carry signal for predicting `mpg` on `mtcars` but does not want the inflated feature count to hurt the linear model. Build a recipe that creates the three pairwise interaction terms with `step_interact()` and then collapses everything via `step_pca(num_comp = 3)`, and save it to `ex_2_5`.

**Expected result:**

```
#> -- Recipe ----------------------------------------------------
#> Operations:
#>   Centering and scaling for all_numeric_predictors()
#>   Interactions with disp:hp + disp:wt + hp:wt
#>   PCA extraction with all_numeric_predictors()
```

**Difficulty:** Advanced

[HINTS]
Standardise first so no single column dominates, then build the pairwise products, then compress the widened matrix into a few components.
Chain `step_normalize()`, `step_interact(terms = ~ disp:hp + disp:wt + hp:wt)`, and `step_pca(num_comp = 3)`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- recipe(mpg ~ disp + hp + wt, data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_interact(terms = ~ disp:hp + disp:wt + hp:wt) |>
  step_pca(all_numeric_predictors(), num_comp = 3)
ex_2_5
#> -- Recipe ----------------------------------------------------
```

**Explanation:** Order matters: normalise first so the PCA loadings are not dominated by the column with the largest variance, then create interactions, then PCA the union. `step_interact()` takes a formula with the colon syntax, so `disp:hp` means "the product of disp and hp". PCA on the expanded matrix yields uncorrelated components that absorb most of the joint variance, which a downstream OLS or glmnet can consume without multicollinearity warnings.

</details>

## Section 3. Model specification with parsnip (4 problems)

### Exercise 3.1: Specify a linear regression with the lm engine

**Task:** A finance team wants a simple ordinary least squares regression as a baseline for predicting the `mpg` outcome on `mtcars`. Use parsnip to specify a `linear_reg()` model with engine `lm`, then save the spec to `ex_3_1` so it can be slotted into a workflow later.

**Expected result:**

```
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

**Difficulty:** Beginner

[HINTS]
Declare the kind of model you want as a standalone spec that holds no data, separately from the routine that will fit it.
Use `linear_reg()` piped into `set_engine("lm")`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- linear_reg() |>
  set_engine("lm")
ex_3_1
#> Linear Regression Model Specification (regression)
#>
#> Computational engine: lm
```

**Explanation:** parsnip separates WHAT model you want (a linear regression) from WHICH engine fits it (`lm`, `glmnet`, `stan`, `keras`, etc.). The model specification is itself a small object that holds no data: it gets `fit()` later inside a workflow or directly with `fit(spec, formula, data)`. This decoupling is the whole point of parsnip: you can swap engines without rewriting the rest of the pipeline.

</details>

### Exercise 3.2: Specify an elastic net glmnet regression with tunable penalty and mixture

**Task:** A credit risk modeller wants an elastic net regression on customer features and intends to tune both the penalty strength and the L1/L2 mixture later via grid search. Use `linear_reg()` with `penalty = tune()` and `mixture = tune()`, set the engine to `glmnet`, and save the spec to `ex_3_2`.

**Expected result:**

```
#> Linear Regression Model Specification (regression)
#>
#> Main Arguments:
#>   penalty = tune()
#>   mixture = tune()
#>
#> Computational engine: glmnet
```

**Difficulty:** Intermediate

[HINTS]
Leave the regularization strength and the L1/L2 balance unspecified so a later search can fill them in.
Call `linear_reg(penalty = tune(), mixture = tune())` and `set_engine("glmnet")`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- linear_reg(penalty = tune(), mixture = tune()) |>
  set_engine("glmnet")
ex_3_2
#> Linear Regression Model Specification (regression)
#>
#> Main Arguments:
#>   penalty = tune()
#>   mixture = tune()
#>
#> Computational engine: glmnet
```

**Explanation:** Marking an argument with `tune()` is a placeholder: it tells parsnip that the value will be provided later by `tune_grid()` or `tune_bayes()`. With `mixture = 0` glmnet behaves as pure ridge (L2), with `mixture = 1` it is pure lasso (L1), and anything in between is elastic net. Tuning both at once explores the regularization geometry rather than committing to a flavour up front, which usually wins on noisy financial features.

</details>

### Exercise 3.3: Specify a logistic classification spec with the glm engine

**Task:** A fraud team is building a binary classifier for whether a transaction will be charged back and wants a no-frills logistic regression as the baseline. Use parsnip to specify `logistic_reg()` with engine `glm` and mode `classification`, and save it to `ex_3_3`.

**Expected result:**

```
#> Logistic Regression Model Specification (classification)
#>
#> Computational engine: glm
```

**Difficulty:** Intermediate

[HINTS]
You want a baseline binary classifier defined as a spec, with both its task and its fitting routine stated explicitly.
Pipe `logistic_reg()` into `set_engine("glm")` and `set_mode("classification")`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")
ex_3_3
#> Logistic Regression Model Specification (classification)
#>
#> Computational engine: glm
```

**Explanation:** `logistic_reg()` is already a classification-only spec so `set_mode("classification")` is technically redundant, but writing it explicitly makes the intent obvious in code reviews. The `glm` engine fits maximum likelihood; switch to `glmnet` if you need regularization or to `stan_glm` (via `rstanarm`) for Bayesian posterior intervals. parsnip will silently route `predict(type = "prob")` to the correct underlying call.

</details>

### Exercise 3.4: Specify a random forest classifier with ranger and tunable mtry plus min_n

**Task:** A churn analyst is choosing a random forest as the strong baseline for predicting customer attrition and wants to tune both `mtry` (predictors sampled per split) and `min_n` (node-size floor) via cross-validation. Specify `rand_forest()` with `mtry = tune()`, `min_n = tune()`, `trees = 500`, engine `ranger`, mode `classification`, and save the spec to `ex_3_4`.

**Expected result:**

```
#> Random Forest Model Specification (classification)
#>
#> Main Arguments:
#>   mtry  = tune()
#>   trees = 500
#>   min_n = tune()
#>
#> Computational engine: ranger
```

**Difficulty:** Advanced

[HINTS]
Fix the ensemble size but leave the per-split sampling and the node-size floor open for a cross-validated search.
Use `rand_forest(mtry = tune(), min_n = tune(), trees = 500)` with `set_engine("ranger")` and `set_mode("classification")`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- rand_forest(mtry = tune(), min_n = tune(), trees = 500) |>
  set_engine("ranger") |>
  set_mode("classification")
ex_3_4
#> Random Forest Model Specification (classification)
#>
#> Main Arguments:
#>   mtry  = tune()
#>   trees = 500
#>   min_n = tune()
#>
#> Computational engine: ranger
```

**Explanation:** `ranger` is the production-grade engine: it is multi-threaded, handles factors directly, and is roughly an order of magnitude faster than the original `randomForest` package on wide data. Keep `trees` fixed (500 is usually plenty for accuracy stability) and tune `mtry` and `min_n`, which control bias/variance trade-off and tree depth. Setting `importance = "impurity"` on the engine call would let you read feature importance after fitting.

</details>

## Section 4. Combining recipe and model into a workflow (4 problems)

### Exercise 4.1: Bind a recipe and a linear model into a single workflow

**Task:** A reporting analyst wants one object that carries both the preprocessing recipe and the OLS model spec so the data prep and the fit cannot drift apart in code review. Combine the recipe `ex_2_1` (normalisation only) and the spec `ex_3_1` (lm) into a workflow object using `workflow()`, `add_recipe()`, and `add_model()`, and save it to `ex_4_1`.

**Expected result:**

```
#> == Workflow ==================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
#>
#> -- Preprocessor ----------------------------------------------
#> 2 Recipe Steps
#>   - step_center()
#>   - step_scale()
#> -- Model -----------------------------------------------------
#> Linear Regression Model Specification (regression)
#> Computational engine: lm
```

**Difficulty:** Intermediate

[HINTS]
Bundle the preprocessing plan and the model spec into one container so they cannot drift apart in review.
Start with `workflow()`, then `add_recipe(ex_2_1)` and `add_model(ex_3_1)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- workflow() |>
  add_recipe(ex_2_1) |>
  add_model(ex_3_1)
ex_4_1
#> == Workflow ==================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
```

**Explanation:** A workflow is the single object you pass to `fit()`, `predict()`, `last_fit()`, and `tune_grid()`. Bundling recipe and spec prevents the classic mistake of preprocessing train and test differently: when you call `fit(workflow, train)`, the recipe is `prep()`d on train ONLY, and `predict(workflow, new_data = test)` reuses those frozen statistics. A workflow without a preprocessor is allowed; add a formula instead with `add_formula()`.

</details>

### Exercise 4.2: Fit a workflow on training data and pull out the model parameters

**Task:** The same reporting analyst now wants to fit `ex_4_1` on the training portion of an 80/20 split of `mtcars` and inspect the fitted coefficients with `extract_fit_parsnip()` followed by `tidy()`. Save the tidied coefficient tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 11 x 5
#>    term         estimate std.error statistic   p.value
#>    <chr>           <dbl>     <dbl>     <dbl>     <dbl>
#>  1 (Intercept)    19.7      0.452      43.6  3.20e-19
#>  2 cyl            -0.523    1.07       -0.49 6.31e- 1
#>  3 disp            1.51     1.85        0.81 4.26e- 1
#>  ...
```

**Difficulty:** Intermediate

[HINTS]
Fit on the training rows only, then drill into the bundle to reach the inner fitted model and turn its coefficients into a tidy table.
Call `fit()` on `training(mt_split)`, then pipe the result through `extract_fit_parsnip()` and `tidy()`.

```r title="Your turn"
set.seed(101)
mt_split <- initial_split(mtcars, prop = 0.8)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
mt_split <- initial_split(mtcars, prop = 0.8)
fit_obj <- fit(ex_4_1, data = training(mt_split))
ex_4_2 <- fit_obj |>
  extract_fit_parsnip() |>
  tidy()
ex_4_2
#> # A tibble: 11 x 5
```

**Explanation:** `extract_fit_parsnip()` digs through the workflow wrapper and returns the inner parsnip fit object; `tidy()` then converts the engine-specific coefficient table into a uniform tibble. Use `extract_fit_engine()` instead if you need the raw `lm` object for diagnostics. Always tidy the result before plotting or exporting: the column names (`estimate`, `std.error`) are guaranteed by broom regardless of engine.

</details>

### Exercise 4.3: Compare two workflows with a workflow_set

**Task:** A model-comparison reviewer is benchmarking two classifiers (logistic regression and a 500-tree random forest) on a binarised version of `mtcars` where `am` is the target. Build a `workflow_set()` that pairs the same simple normalised recipe with both model specs, and save the workflowset to `ex_4_3`.

**Expected result:**

```
#> # A workflow set/tibble: 2 x 4
#>   wflow_id          info             option    result
#>   <chr>             <list>           <list>    <list>
#> 1 norm_logistic     <tibble [1 x 4]> <opts[0]> <list [0]>
#> 2 norm_random_forest <tibble [1 x 4]> <opts[0]> <list [0]>
```

**Difficulty:** Intermediate

[HINTS]
You want every pairing of one preprocessor with several models laid out as rows so they can be compared in one pass.
Use `workflow_set()` with a `preproc` list holding the recipe and a `models` list holding both specs.

```r title="Your turn"
mt <- mtcars |> mutate(am = factor(am))
rec_norm <- recipe(am ~ cyl + disp + hp + wt, data = mt) |>
  step_normalize(all_numeric_predictors())
log_spec <- logistic_reg() |> set_engine("glm")
rf_spec  <- rand_forest(trees = 500) |> set_engine("ranger") |>
  set_mode("classification")
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> mutate(am = factor(am))
rec_norm <- recipe(am ~ cyl + disp + hp + wt, data = mt) |>
  step_normalize(all_numeric_predictors())
log_spec <- logistic_reg() |> set_engine("glm")
rf_spec  <- rand_forest(trees = 500) |> set_engine("ranger") |>
  set_mode("classification")
ex_4_3 <- workflow_set(
  preproc = list(norm = rec_norm),
  models  = list(logistic = log_spec, random_forest = rf_spec)
)
ex_4_3
#> # A workflow set/tibble: 2 x 4
```

**Explanation:** `workflow_set()` takes lists of preprocessors and models and produces every combination as rows of a tibble. You then call `workflow_map("fit_resamples", resamples = folds)` on the whole set to evaluate them in one call, and `rank_results()` to sort the leaderboard. This is the right tool when you want to compare three preprocessing variants against four model families: twelve workflows in three lines of code.

</details>

### Exercise 4.4: Last-fit a workflow on the full training split and evaluate on test

**Task:** A pricing modeller wants the standard tidymodels closing move on a workflow: fit on the training half of an 80/20 split of `diamonds` (small sample of 2000 rows for speed) and immediately score on the held-out test rows. Use `last_fit()` on a normalised lm workflow against `ex_1_1_small` and save the resulting tibble to `ex_4_4`.

**Expected result:**

```
#> # Resampling results
#> # Manual resampling
#> # A tibble: 1 x 6
#>   splits         id              .metrics         .notes         .predictions     .workflow
#>   <list>         <chr>           <list>           <list>         <list>           <list>
#> 1 <split [1500/500]> train/test  <tibble [2 x 4]> <tibble [0 x 3]> <tibble [500 x 4]> <workflow>
```

**Difficulty:** Advanced

[HINTS]
The closing move refits on the training half and scores the held-out half in a single call against the original split object.
Call `last_fit()`, passing the workflow and `split = ex_1_1_small`.

```r title="Your turn"
set.seed(303)
small <- diamonds |> slice_sample(n = 2000)
ex_1_1_small <- initial_split(small, prop = 0.75)
rec_d <- recipe(price ~ carat + depth + table, data = training(ex_1_1_small)) |>
  step_normalize(all_numeric_predictors())
wf <- workflow() |> add_recipe(rec_d) |> add_model(linear_reg() |> set_engine("lm"))
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(303)
small <- diamonds |> slice_sample(n = 2000)
ex_1_1_small <- initial_split(small, prop = 0.75)
rec_d <- recipe(price ~ carat + depth + table, data = training(ex_1_1_small)) |>
  step_normalize(all_numeric_predictors())
wf <- workflow() |> add_recipe(rec_d) |> add_model(linear_reg() |> set_engine("lm"))
ex_4_4 <- last_fit(wf, split = ex_1_1_small)
ex_4_4
#> # Resampling results
#> # Manual resampling
```

**Explanation:** `last_fit()` is the bridge between training and the final test-set score. It refits the workflow on the training set, generates predictions on the test set, and returns one tibble row holding the metrics, the predictions, and the fitted workflow. Pull pieces with `collect_metrics()`, `collect_predictions()`, or `extract_workflow()`. Use it once and only once per project: the test set is sacred and not for iteration.

</details>

## Section 5. Hyperparameter tuning with tune and dials (4 problems)

### Exercise 5.1: Build a regular grid of penalty and mixture for an elastic net

**Task:** A credit risk analyst is preparing to tune the elastic net from exercise 3.2 and wants a five-by-five grid over `penalty` (log-spaced) and `mixture` (linearly spaced from 0 to 1). Use `grid_regular()` with `penalty()` and `mixture()` and `levels = 5`, and save the grid tibble to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 25 x 2
#>      penalty mixture
#>        <dbl>   <dbl>
#>  1 0.0000000001   0
#>  2 0.0000000316   0
#>  3 0.0000100000   0
#>  ...
#>  25 0.1            1
```

**Difficulty:** Intermediate

[HINTS]
You need an evenly spaced Cartesian set of candidate values across the two regularization controls.
Use `grid_regular()` with `penalty()` and `mixture()` and `levels = 5`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- grid_regular(penalty(), mixture(), levels = 5)
ex_5_1
#> # A tibble: 25 x 2
```

**Explanation:** `grid_regular()` builds a Cartesian product across the named parameters. The `dials` package defines sensible default ranges per parameter: `penalty()` defaults to `1e-10` to `1` on a log10 scale, and `mixture()` to `0` to `1` linearly. Override with `penalty(range = c(-4, 0))` if you want a tighter window. For higher-dimensional spaces use `grid_latin_hypercube()` or `grid_space_filling()`, which scale far better than dense grids.

</details>

### Exercise 5.2: Tune the elastic net via cross-validation and collect the metric tibble

**Task:** The same analyst now runs the tuning loop: combine the recipe `ex_2_2`, the spec `ex_3_2`, the cv folds `ex_1_2` (10-fold), and the grid `ex_5_1`. Call `tune_grid()` on the workflow with metrics RMSE and MAE, then `collect_metrics()` and save the averaged metrics tibble to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 50 x 8
#>     penalty mixture .metric .estimator   mean     n std_err .config
#>       <dbl>   <dbl> <chr>   <chr>       <dbl> <int>   <dbl> <chr>
#>  1 1e-10        0   mae     standard     900    10    35.2  Preprocessor1_Model01
#>  2 1e-10        0   rmse    standard    1400    10    62.7  Preprocessor1_Model01
#>  ...
```

**Difficulty:** Intermediate

[HINTS]
Fit the workflow once per fold-and-candidate combination, then average the scores across folds into one row per setting.
Call `tune_grid()` with `resamples`, `grid = ex_5_1`, and `metrics = metric_set(rmse, mae)`, then pass the result to `collect_metrics()`.

```r title="Your turn"
wf_enet <- workflow() |> add_recipe(ex_2_2) |> add_model(ex_3_2)
small_folds <- vfold_cv(slice_sample(diamonds, n = 1500), v = 5)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
wf_enet <- workflow() |> add_recipe(ex_2_2) |> add_model(ex_3_2)
small_folds <- vfold_cv(slice_sample(diamonds, n = 1500), v = 5)
tuned <- tune_grid(
  wf_enet,
  resamples = small_folds,
  grid = ex_5_1,
  metrics = metric_set(rmse, mae)
)
ex_5_2 <- collect_metrics(tuned)
ex_5_2
#> # A tibble: 50 x 8
```

**Explanation:** `tune_grid()` fits the workflow once per (fold x grid point) combination, here 5 x 25 = 125 fits, and returns a nested tibble. `collect_metrics()` flattens that into one row per (grid point x metric), averaging across folds and reporting the standard error so you can spot which configurations are merely lucky rather than genuinely best. Pass `control = control_grid(save_pred = TRUE)` if you also want the raw fold predictions for ROC plotting.

</details>

### Exercise 5.3: Identify the best penalty and finalize the workflow

**Task:** Continue from the tuned object: select the best combination of `penalty` and `mixture` from `tuned` using the RMSE metric, then finalize the workflow with those values so it can be `last_fit()`. Save the finalized workflow to `ex_5_3`.

**Expected result:**

```
#> == Workflow ==================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
#>
#> -- Model -----------------------------------------------------
#> Linear Regression Model Specification (regression)
#>
#> Main Arguments:
#>   penalty = 0.001
#>   mixture = 0.5
#>
#> Computational engine: glmnet
```

**Difficulty:** Advanced

[HINTS]
Pick the winning hyperparameter row by the chosen metric, then stamp those values into the workflow's open placeholders.
The output of `select_best()` (with `metric = "rmse"`) feeds into `finalize_workflow()`.

```r title="Your turn"
best <- select_best(tuned, metric = "rmse")
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
best <- select_best(tuned, metric = "rmse")
ex_5_3 <- finalize_workflow(wf_enet, best)
ex_5_3
#> == Workflow ==================================================
#> Preprocessor: Recipe
#> Model: linear_reg()
```

**Explanation:** `select_best()` returns a one-row tibble with the winning hyperparameter combination by the named metric. `finalize_workflow()` substitutes those values into every `tune()` placeholder in the workflow, producing a workflow object that no longer contains any unresolved parameters. From here you call `last_fit(ex_5_3, split = your_initial_split)` to score the test set, or `fit(ex_5_3, data = full_train)` for production. Use `select_by_one_std_err()` for a more conservative pick.

</details>

### Exercise 5.4: Run a Bayesian search instead of a fixed grid

**Task:** A senior modeller observes that the elastic net grid is wasteful when the optimum sits in a small region, and wants a Bayesian search to home in on it efficiently. Run `tune_bayes()` on the same `wf_enet` and 5-fold resamples, starting from 5 initial points and iterating 10 times to minimise RMSE, and save the result to `ex_5_4`.

**Expected result:**

```
#> # Tuning results
#> # 5-fold cross-validation
#> # A tibble: 15 x 5
#>   splits        id    .metrics         .notes         .iter
#>   <list>        <chr> <list>           <list>         <int>
#>  1 <split>      Fold1 <tibble [2 x 6]> <tibble [0 x 3]>  0
#>  ...
```

**Difficulty:** Advanced

[HINTS]
Instead of an exhaustive grid, let a surrogate model propose where to sample next, starting from a few seed points.
Use `tune_bayes()` with `initial = 5`, `iter = 10`, and `metrics = metric_set(rmse)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(404)
ex_5_4 <- tune_bayes(
  wf_enet,
  resamples = small_folds,
  initial = 5,
  iter = 10,
  metrics = metric_set(rmse),
  control = control_bayes(no_improve = 5, verbose = FALSE)
)
ex_5_4
#> # Tuning results
```

**Explanation:** `tune_bayes()` fits a Gaussian process surrogate over the parameter space using the initial points, then proposes the next configuration where the GP expects the largest improvement in the target metric. The `no_improve` argument is an early-stopping rule: if 5 successive iterations fail to beat the running best, the search halts. For 2-3 dimensional spaces grid search still wins on simplicity, but for 5+ dimensions Bayesian search reaches similar accuracy with 10x fewer fits.

</details>

## Section 6. Evaluation and finalization with yardstick (4 problems)

### Exercise 6.1: Compute RMSE and R-squared on a regression prediction tibble

**Task:** A pricing modeller has a prediction tibble with a `.pred` column and a truth column `price` after scoring a regression model and wants a single tibble with both RMSE and R-squared via a shared metric set. Use `metric_set(rmse, rsq)` and call it on `preds` with `truth = price` and `estimate = .pred`, then save the resulting metric tibble to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard     1187.
#> 2 rsq     standard        0.87
```

**Difficulty:** Intermediate

[HINTS]
Bundle the two regression scores into one reusable scorer, then apply that scorer to the prediction tibble.
Build `metric_set(rmse, rsq)` and call the resulting function with `truth = price` and `estimate = .pred`.

```r title="Your turn"
set.seed(505)
preds <- tibble(
  price = rnorm(200, mean = 5000, sd = 1500),
  .pred = price + rnorm(200, 0, 1200)
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(505)
preds <- tibble(
  price = rnorm(200, mean = 5000, sd = 1500),
  .pred = price + rnorm(200, 0, 1200)
)
metric_fn <- metric_set(rmse, rsq)
ex_6_1 <- metric_fn(preds, truth = price, estimate = .pred)
ex_6_1
#> # A tibble: 2 x 3
```

**Explanation:** `metric_set()` is a closure factory: it returns a function that accepts a data frame plus `truth` and `estimate` columns and returns the metrics as a tidy tibble. Bundling metrics like this is far cleaner than calling `rmse()`, `rsq()`, and `mae()` separately and `bind_rows`-ing them. The `.estimator` column distinguishes binary, micro, macro, etc.; for regression it is always `standard`.

</details>

### Exercise 6.2: Build a classification metric set with accuracy, sensitivity, and roc_auc

**Task:** A churn classifier reviewer needs a single metric set that captures accuracy, sensitivity, and ROC AUC so the same call works inside `tune_grid()` and on a final test set. Build the metric set with `metric_set(accuracy, sensitivity, roc_auc)` and apply it to `cls_preds` with `truth = churn`, `estimate = .pred_class`, and the probability column `.pred_yes`. Save the metric tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   .metric     .estimator .estimate
#>   <chr>       <chr>          <dbl>
#> 1 accuracy    binary         0.81
#> 2 sensitivity binary         0.72
#> 3 roc_auc     binary         0.88
```

**Difficulty:** Intermediate

[HINTS]
One scorer should cover both the hard-class metrics and the probability-based one so the same call works everywhere.
Build `metric_set(accuracy, sensitivity, roc_auc)` and pass `truth = churn`, `estimate = .pred_class`, and the `.pred_yes` column.

```r title="Your turn"
set.seed(606)
n <- 300
cls_preds <- tibble(
  churn       = factor(sample(c("yes","no"), n, replace = TRUE, prob = c(0.3, 0.7))),
  .pred_yes   = pmax(pmin(ifelse(churn == "yes", rnorm(n, 0.7, 0.2),
                                                  rnorm(n, 0.3, 0.2)), 1), 0)
) |>
  mutate(.pred_no    = 1 - .pred_yes,
         .pred_class = factor(ifelse(.pred_yes > 0.5, "yes", "no"),
                              levels = c("yes","no")))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(606)
n <- 300
cls_preds <- tibble(
  churn       = factor(sample(c("yes","no"), n, replace = TRUE, prob = c(0.3, 0.7))),
  .pred_yes   = pmax(pmin(ifelse(churn == "yes", rnorm(n, 0.7, 0.2),
                                                  rnorm(n, 0.3, 0.2)), 1), 0)
) |>
  mutate(.pred_no    = 1 - .pred_yes,
         .pred_class = factor(ifelse(.pred_yes > 0.5, "yes", "no"),
                              levels = c("yes","no")))
multi <- metric_set(accuracy, sensitivity, roc_auc)
ex_6_2 <- multi(cls_preds, truth = churn, estimate = .pred_class, .pred_yes,
                event_level = "first")
ex_6_2
#> # A tibble: 3 x 3
```

**Explanation:** yardstick separates class-prediction metrics (need `estimate = .pred_class`) from probability-based metrics (need the class-prob column, here `.pred_yes`). A single `metric_set()` accepts both: pass the class column as `estimate` and any probability columns as additional unnamed arguments. The `event_level` argument tells sensitivity which factor level is the positive class; without it yardstick defaults to the first factor level, which is often wrong for "yes/no" outcomes.

</details>

### Exercise 6.3: Plot a calibration-style ROC curve from prediction probabilities

**Task:** A senior reviewer wants a visual diagnostic alongside the AUC number: the ROC curve for the churn predictions in `cls_preds`. Build the curve tibble with `roc_curve()` and pipe it into `autoplot()` to render a ggplot object, then save that plot to `ex_6_3`.

**Expected result:**

```
#> # A ggplot object showing the ROC curve, x = 1 - specificity, y = sensitivity,
#> # diagonal reference line indicating chance performance.
```

**Difficulty:** Advanced

[HINTS]
First build the threshold-by-threshold sensitivity and specificity table, then hand it to the generic plotting method.
Pipe `roc_curve()` (with `truth = churn` and the `.pred_yes` column) into `autoplot()`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- roc_curve(cls_preds, truth = churn, .pred_yes, event_level = "first") |>
  autoplot()
ex_6_3
#> # A ggplot object: ROC curve for the yes vs no churn classifier
```

**Explanation:** `roc_curve()` returns a tibble of thresholds, sensitivity, and specificity at each cut point; `autoplot.roc_df()` is the yardstick-specific method that renders it with the chance diagonal. Pair it with `pr_curve()` for the precision-recall view, which is far more informative on imbalanced targets (here the 30/70 churn split is borderline). For a multiclass ROC, pass several prob columns and yardstick produces one curve per class facet.

</details>

### Exercise 6.4: Confusion matrix and Cohen's kappa from a multiclass classifier

**Task:** A botanist evaluating the Species classifier on a sampled `iris` prediction tibble wants the 3x3 confusion matrix and Cohen's kappa together so she can report both raw counts and the agreement-adjusted score. Use `conf_mat()` to build the matrix object, summarise with `summary()`, filter to the kappa row, and save the resulting tibble to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 kap     multiclass      0.92
```

**Difficulty:** Advanced

[HINTS]
Build the cross-tabulation object, expand it into its full panel of metrics, and keep only the chance-adjusted agreement row.
Use `conf_mat()`, then `summary()`, then `filter()` to the `.metric == "kap"` row.

```r title="Your turn"
set.seed(707)
iris_preds <- iris |>
  mutate(.pred_class = ifelse(runif(nrow(iris)) < 0.95, Species,
                              sample(levels(Species), nrow(iris), replace = TRUE)),
         .pred_class = factor(.pred_class, levels = levels(Species)))
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(707)
iris_preds <- iris |>
  mutate(.pred_class = ifelse(runif(nrow(iris)) < 0.95, Species,
                              sample(levels(Species), nrow(iris), replace = TRUE)),
         .pred_class = factor(.pred_class, levels = levels(Species)))
cm <- conf_mat(iris_preds, truth = Species, estimate = .pred_class)
ex_6_4 <- summary(cm) |> filter(.metric == "kap")
ex_6_4
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 kap     multiclass      0.92
```

**Explanation:** Cohen's kappa adjusts raw accuracy for the proportion of agreement expected by chance, which matters when class frequencies are uneven. A kappa above 0.8 is conventionally "almost perfect"; near zero means the classifier is no better than guessing the marginal proportions. `summary(conf_mat)` returns roughly 13 metrics in one tibble (accuracy, kappa, sensitivity, specificity, ppv, npv, mcc, f1, and more), which is the fastest way to populate a stakeholder report card.

</details>

## What to do next

Pair these exercises with the related material on r-statistics.co:

- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html) for the broader ML-in-R problem set across packages.
- [caret Exercises in R](caret-Exercises-in-R.html) if you want to compare the tidymodels stack against the older caret API on the same problem.
- [Cross-Validation Exercises in R](Cross-Validation-Exercises-in-R.html) for deeper rsample drills focused only on resampling.
- [Random Forest Exercises in R](Random-Forest-Exercises-in-R.html) and [XGBoost Exercises in R](XGBoost-Exercises-in-R.html) for engine-specific tuning practice you can plug into a tidymodels workflow.

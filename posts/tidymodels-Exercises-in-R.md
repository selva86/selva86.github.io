---
title: "tidymodels Exercises in R: 25 Practice Problems"
slug: "tidymodels-Exercises-in-R"
description: "Master tidymodels with 25 practice problems: rsample, recipes, parsnip, workflows, tune, yardstick. Hidden solutions."
keywords: "tidymodels exercises, tidymodels practice, parsnip exercises R, recipes exercises R, workflow R exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "tidymodels Exercises"
sidebar_order: 143
fr_parent: "R-Tutorial.html"
auto_link_terms: "tidymodels exercises|tidymodels practice|parsnip exercises|recipes exercises"
auto_link_case_sensitive: false
target_keyword: "tidymodels exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# tidymodels Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on the tidymodels stack: rsample, recipes, parsnip, workflows, tune, yardstick. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(tidymodels)
```

### Exercise 1: initial_split

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
split <- initial_split(mtcars, prop = 0.7)
list(train = nrow(training(split)), test = nrow(testing(split)))
```

</details>

### Exercise 2: vfold_cv

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
vfold_cv(mtcars, v = 5)
```

</details>

### Exercise 3: recipe

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
recipe(mpg ~ ., data = mtcars)
```

</details>

### Exercise 4: step_normalize

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())
```

</details>

### Exercise 5: prep + bake

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
rec <- recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors())
prep(rec) |> bake(new_data = mtcars) |> head()
```

</details>

### Exercise 6: linear_reg model

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
linear_reg() |> set_engine("lm")
```

</details>

### Exercise 7: rand_forest model

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
rand_forest(trees = 100) |> set_mode("regression") |> set_engine("ranger")
```

</details>

### Exercise 8: boost_tree model

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
boost_tree(trees = 100) |> set_mode("regression") |> set_engine("xgboost")
```

</details>

### Exercise 9: workflow

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wf <- workflow() |>
  add_recipe(recipe(mpg ~ ., data = mtcars)) |>
  add_model(linear_reg() |> set_engine("lm"))
wf
```

</details>

### Exercise 10: fit workflow

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wf <- workflow() |> add_recipe(recipe(mpg ~ ., data = mtcars)) |>
  add_model(linear_reg() |> set_engine("lm"))
fit(wf, mtcars)
```

</details>

### Exercise 11: Predict from workflow

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wf <- workflow() |> add_recipe(recipe(mpg ~ ., data = mtcars)) |>
  add_model(linear_reg() |> set_engine("lm"))
fitted <- fit(wf, mtcars)
predict(fitted, new_data = mtcars[1:3, ])
```

</details>

### Exercise 12: fit_resamples

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
folds <- vfold_cv(mtcars, v = 5)
wf <- workflow() |> add_recipe(recipe(mpg ~ ., data = mtcars)) |>
  add_model(linear_reg() |> set_engine("lm"))
fit_resamples(wf, folds, metrics = metric_set(rmse, rsq))
```

</details>

### Exercise 13: collect_metrics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
folds <- vfold_cv(mtcars, v = 5)
wf <- workflow() |> add_formula(mpg ~ .) |> add_model(linear_reg() |> set_engine("lm"))
fit_resamples(wf, folds) |> collect_metrics()
```

</details>

### Exercise 14: Tune hyperparameter

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
folds <- vfold_cv(mtcars, v = 5)
rf <- rand_forest(mtry = tune(), trees = 100) |> set_mode("regression") |> set_engine("ranger")
wf <- workflow() |> add_formula(mpg ~ .) |> add_model(rf)
grid <- expand.grid(mtry = c(2, 4, 6))
tune_grid(wf, folds, grid = grid) |> collect_metrics()
```

</details>

### Exercise 15: yardstick metrics

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
truth <- c(1, 2, 3, 4); pred <- c(1.1, 1.9, 3.2, 3.8)
data.frame(truth, pred) |> yardstick::rmse(truth, pred)
```

</details>

### Exercise 16: Classification: logistic

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
binary <- iris |> dplyr::filter(Species != "setosa") |>
  dplyr::mutate(Species = droplevels(Species))
mod <- logistic_reg() |> set_engine("glm")
fit(workflow() |> add_formula(Species ~ Sepal.Length) |> add_model(mod), binary)
```

</details>

### Exercise 17: step_dummy

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
recipe(mpg ~ ., data = mtcars |> dplyr::mutate(cyl = factor(cyl))) |>
  step_dummy(all_nominal_predictors())
```

</details>

### Exercise 18: step_corr (remove correlated)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
recipe(mpg ~ ., data = mtcars) |>
  step_corr(all_numeric_predictors(), threshold = 0.9)
```

</details>

### Exercise 19: step_pca

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
recipe(mpg ~ ., data = mtcars) |>
  step_normalize(all_numeric_predictors()) |>
  step_pca(all_numeric_predictors(), num_comp = 3)
```

</details>

### Exercise 20: last_fit

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
split <- initial_split(mtcars, prop = 0.7)
wf <- workflow() |> add_formula(mpg ~ .) |> add_model(linear_reg() |> set_engine("lm"))
last_fit(wf, split) |> collect_metrics()
```

</details>

### Exercise 21: select_best after tuning

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# After tune_grid result `res`:
# best <- select_best(res, "rmse")
# finalize_workflow(wf, best)
```

</details>

### Exercise 22: workflow_set for many models

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ws <- workflow_set(
  preproc = list(rec = recipe(mpg ~ ., data = mtcars)),
  models = list(lm = linear_reg() |> set_engine("lm"),
                rf = rand_forest() |> set_mode("regression") |> set_engine("ranger"))
)
```

</details>

### Exercise 23: parsnip translate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
linear_reg() |> set_engine("lm") |> translate()
```

</details>

### Exercise 24: tidy a fit

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wf <- workflow() |> add_formula(mpg ~ .) |> add_model(linear_reg() |> set_engine("lm"))
fit(wf, mtcars) |> extract_fit_parsnip() |> tidy()
```

</details>

### Exercise 25: Save model object

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
wf <- workflow() |> add_formula(mpg ~ .) |> add_model(linear_reg() |> set_engine("lm"))
saveRDS(fit(wf, mtcars), "wf.rds")
```

</details>

## What to do next

- **Machine-Learning-Exercises** (shipped) — broader ML.
- **Cross-Validation-Exercises** (shipped) — CV deep dive.

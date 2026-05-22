---
title: "caret modelLookup() in R: Find Tuning Parameters"
slug: "caret-modelLookup-in-R"
description: "Use caret modelLookup() in R to find the tuning parameters, model type, and probability support for any of caret's 230+ models. Examples with output included."
keywords: "caret modelLookup, modelLookup function R, caret modelLookup examples, R caret model tuning parameters, caret list model parameters, modelLookup caret package, caret tuning grid parameters"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "modelLookup()|caret modelLookup|caret::modelLookup()|modelLookup function in caret|look up caret models"
auto_link_case_sensitive: true
target_keyword: "caret modelLookup"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret modelLookup() in R: Find Tuning Parameters

<p class="lead">The <code>modelLookup()</code> function in caret returns a small data frame describing any model's tuning parameters, whether it handles regression or classification, and whether it produces class probabilities. Call it before <code>train()</code> to know exactly which hyperparameters caret will tune.</p>

[QUICK ANSWER]
modelLookup("rf")                          # one model
modelLookup("glmnet")                      # model with two tuning params
modelLookup()                              # every available method
nrow(modelLookup())                        # count parameters across all models
unique(modelLookup()$model)                # list of model names
subset(modelLookup(), forClass & probModel)  # classifiers with probabilities
subset(modelLookup(), forReg & parameter != "parameter")  # regression models with tuning

[DECISION TREE: Is modelLookup() the right tool?]
- list tuning parameters for one method: modelLookup("xgbTree")
- get the full caret model registry: names(getModelInfo())
- fetch the underlying fit/predict code: getModelInfo("rf", regex = FALSE)
- fit and tune a model with those parameters: train(y ~ ., data = df, method = "rf")
- build an explicit tuning grid: expand.grid(mtry = c(2, 4, 6))
- choose a resampling scheme: trainControl(method = "cv", number = 10)

## What modelLookup() does in one sentence

**`modelLookup()` is caret's model registry index.** You pass a method string and it returns a data frame with one row per tuning parameter, plus flags showing whether the model supports regression (`forReg`), classification (`forClass`), and class probabilities (`probModel`). Call it without arguments and you get the same data for every method caret knows.

The point of `modelLookup()` is reconnaissance. Before you write `train(..., method = "gbm", tuneGrid = ...)`, you need to know which columns the `tuneGrid` data frame must contain. `modelLookup("gbm")` tells you in one line.

## modelLookup() syntax and arguments

**The signature has one required argument and two switches.** Most calls use only the first.

```r title="Load caret and check the function"
library(caret)

args(modelLookup)
#> function (model = NULL)
#> NULL
```

`modelLookup()` accepts a single argument:

- `model`: a character string naming a caret method (`"rf"`, `"glmnet"`, `"xgbTree"`, etc.). Default `NULL` returns the registry for every model caret ships.

The returned data frame has six columns:

- `model`: the method string you pass to `train(method = ...)`.
- `parameter`: the tuning parameter name. Use these as `tuneGrid` columns.
- `label`: a human-readable description of the parameter.
- `forReg`: `TRUE` if the model supports regression.
- `forClass`: `TRUE` if the model supports classification.
- `probModel`: `TRUE` if the model can return class probabilities via `predict(type = "prob")`.

[NOTE]
**`modelLookup()` only reads metadata, it does not fit a model.** Calls are cheap and have no side effects. You can run it repeatedly inside a loop or a Shiny app without performance concerns.

## modelLookup() examples by use case

### 1. Look up one model

The most common call: pass a method string and read the tuning parameters.

```r title="Inspect random forest tuning parameters"
modelLookup("rf")
#>   model parameter                         label forReg forClass probModel
#> 1    rf      mtry #Randomly Selected Predictors   TRUE     TRUE      TRUE
```

Random forest tunes a single parameter, `mtry`. So `tuneGrid` must be a data frame with one column named `mtry`. The `forReg` and `forClass` flags say the same model code handles both tasks.

```r title="Inspect glmnet, which tunes two parameters"
modelLookup("glmnet")
#>    model parameter                    label forReg forClass probModel
#> 1 glmnet     alpha        Mixing Percentage   TRUE     TRUE      TRUE
#> 2 glmnet    lambda Regularization Parameter   TRUE     TRUE      TRUE
```

glmnet returns two rows because it tunes `alpha` (elastic-net mixing) and `lambda` (regularization strength). The `tuneGrid` data frame needs both columns.

### 2. List every available method

Call with no arguments to get the whole registry.

```r title="Browse the caret model catalog"
all_models <- modelLookup()
dim(all_models)
#> [1] 460   6

head(all_models, 3)
#>   model parameter                    label forReg forClass probModel
#> 1  ada      iter                #Trees    FALSE     TRUE      TRUE
#> 2  ada  maxdepth         Max Tree Depth    FALSE     TRUE      TRUE
#> 3  ada        nu      Learning Rate         FALSE     TRUE      TRUE
```

Each row is one tuning parameter, not one model. To count unique models, deduplicate on `model`.

```r title="How many caret models exist"
length(unique(all_models$model))
#> [1] 238
```

### 3. Filter to models that match a task

Subset the registry by the `forReg`, `forClass`, and `probModel` flags to find models for a specific job.

```r title="Find classifiers that return probabilities"
prob_classifiers <- subset(all_models,
                           forClass == TRUE & probModel == TRUE)
length(unique(prob_classifiers$model))
#> [1] 196

head(unique(prob_classifiers$model), 8)
#> [1] "ada"      "AdaBag"   "AdaBoost.M1" "amdai"
#> [5] "avNNet"   "awnb"     "awtan"       "bag"
```

Useful when your downstream code needs `predict(type = "prob")` for ROC curves or calibration plots. Models without `probModel = TRUE` can still classify, but only return hard class labels.

[TIP]
**Combine `modelLookup()` with `getModelInfo()` for a full picture.** `modelLookup()` returns the parameter names; `getModelInfo("rf")` returns the parameter ranges, default values, and the actual fit and predict functions. The two functions are complementary.

### 4. Build a tuneGrid from modelLookup() output

The cleanest workflow uses `modelLookup()` to fetch the parameter names, then constructs `tuneGrid` programmatically.

```r title="Drive tuneGrid from the registry"
set.seed(1)
params <- modelLookup("knn")$parameter
params
#> [1] "k"

grid <- expand.grid(k = c(3, 5, 7, 9))
fit_knn <- train(Species ~ ., data = iris,
                 method = "knn",
                 tuneGrid = grid)
fit_knn$bestTune
#>   k
#> 2 5
```

This pattern is robust to model swaps. If you change `method = "knn"` to `method = "kknn"`, `modelLookup()` returns three parameters instead of one, and your grid builder adapts without code edits.

## modelLookup() vs getModelInfo()

**Both functions index caret's model registry, but they answer different questions.** Pick by what you need.

| Aspect              | `modelLookup()`              | `getModelInfo()`                  |
|---------------------|------------------------------|-----------------------------------|
| Return type         | Data frame                   | List of model definitions         |
| Information         | Parameter names, task flags  | Fit, predict, grid, sort logic    |
| Common use          | Pre-train reconnaissance     | Custom model construction         |
| Cost                | Negligible                   | Negligible for inspection         |
| Regex on model name | No                           | Yes, via `regex = TRUE`           |

Use `modelLookup()` when you want a quick table of tuning parameters. Use `getModelInfo("rf", regex = FALSE)$rf` when you need to read or modify the underlying fit and predict code.

## Common pitfalls

**`modelLookup()` returns one row per parameter, not per model.** If you write `nrow(modelLookup())`, you get parameter count (460+), not model count (~238). Always deduplicate on the `model` column before counting models.

**Models with no tuning parameter still appear with a placeholder row.** `modelLookup("lm")` returns one row with `parameter = "parameter"` and `label = "parameter"`. That single literal row is caret's signal that the model has nothing to tune; do not pass it as a real `tuneGrid` column.

```r title="Linear model has a placeholder row"
modelLookup("lm")
#>   model parameter     label forReg forClass probModel
#> 1    lm parameter parameter   TRUE    FALSE     FALSE
```

[WARNING]
**A method string typo silently returns zero rows.** `modelLookup("randomForest")` returns an empty data frame because the caret method is `"rf"`, not `"randomForest"`. Always sanity-check with `nrow(modelLookup("yourmethod")) > 0` before piping into `train()`.

## Try it yourself

**Try it:** Use `modelLookup()` to list every model that supports both regression and classification probabilities. Save the unique model names to `ex_dual_models` and print how many there are.

```r title="Your turn: find dual-task probability models"
# Try it: filter the registry
ex_dual_models <- # your code here

length(ex_dual_models)
#> Expected: around 130
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
reg <- modelLookup()
dual <- subset(reg, forReg & forClass & probModel)
ex_dual_models <- unique(dual$model)
length(ex_dual_models)
#> [1] 132
```

**Explanation:** Combine the three logical flag columns with `&`, subset the registry, then deduplicate on `model`. The result is the set of methods you can drop into `train()` for either task and still call `predict(type = "prob")`.

</details>

## Related caret functions

- [`train()`](caret-train-in-R.html) consumes the parameter names that `modelLookup()` returns.
- [`trainControl()`](caret-trainControl-in-R.html) defines the resampling strategy passed alongside `tuneGrid`.
- `getModelInfo()` returns the full model definition list when you need fit and predict internals.
- [`varImp()`](caret-varImp-in-R.html) reports variable importance from any model `train()` produced.
- [`confusionMatrix()`](caret-confusionMatrix-in-R.html) evaluates classification predictions from those models.

## FAQ

**How do I find all models caret supports?**

Call `modelLookup()` with no arguments and pull the unique values from the `model` column: `unique(modelLookup()$model)`. As of caret 6.0-94, the registry holds about 238 methods. The official list at `topepo.github.io/caret/available-models.html` mirrors this output and adds the source package for each method.

**What does `forReg` mean in modelLookup output?**

`forReg = TRUE` says the same method string handles regression. Some methods support only one task: `glm` with `family = "binomial"` is classification-only, while `lm` is regression-only. Models like `"rf"`, `"glmnet"`, and `"xgbTree"` flip both flags to `TRUE` and switch behavior based on the outcome variable's type.

**Why does modelLookup("lm") return a row with parameter = "parameter"?**

That single literal row is caret's placeholder for models with no tunable hyperparameters. Linear regression has no grid to search, so caret manufactures a stub row to keep the schema consistent. Do not pass that literal `"parameter"` column to `tuneGrid`; instead, omit `tuneGrid` entirely or use `tuneLength = 1`.

**What is the difference between modelLookup and getModelInfo?**

`modelLookup()` returns a tidy data frame describing tuning parameters and task support. `getModelInfo()` returns a list with the same metadata plus the actual `fit`, `predict`, `prob`, and `grid` functions caret uses to drive training. Use `modelLookup()` for inspection; use `getModelInfo()` when you build a custom method or debug caret's internals.

**Can I use modelLookup with custom models?**

Yes. If you register a custom model with `train(method = my_model_list, ...)`, `modelLookup()` will read the `parameters` element from the list and include it in the output. The list must have `parameters` as a data frame with columns `parameter`, `class`, and `label`. See `?caret::models` or `getModelInfo("rf", regex = FALSE)$rf$parameters` for the expected structure.

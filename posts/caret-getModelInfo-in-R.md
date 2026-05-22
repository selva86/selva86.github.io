---
title: "caret getModelInfo() in R: Inspect Tuning Grids and Code"
slug: "caret-getModelInfo-in-R"
description: "Use caret getModelInfo() in R to fetch tuning grids, fit code, library deps, and class probability support for any of caret's 230+ models. Worked examples."
keywords: "caret getModelInfo, getModelInfo function R, caret getModelInfo examples, caret model registry R, caret tuning grid lookup, getModelInfo vs modelLookup, caret list available models"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "caret-functions"
fr_parent: "R-Tutorial.html"
auto_link_terms: "getModelInfo()|caret getModelInfo|caret::getModelInfo()|getModelInfo function in caret|caret model registry"
auto_link_case_sensitive: true
target_keyword: "caret getModelInfo"
sibling_block_enabled: true
difficulty: "Beginner"
---

# caret getModelInfo() in R: Inspect Tuning Grids and Code

<p class="lead">The <code>getModelInfo()</code> function in caret returns the full registry entry for any of caret's 230+ models, including its tuning parameters, library dependencies, fit and predict functions, and whether it supports regression, classification, or class probabilities. Use it to inspect what <code>train()</code> will actually do before you fit a single model.</p>

[QUICK ANSWER]
getModelInfo("rf", regex = FALSE)              # one full entry
getModelInfo("rf", regex = FALSE)[[1]]$parameters # tuning grid columns
getModelInfo("rf", regex = FALSE)[[1]]$library  # required packages
getModelInfo("rf", regex = FALSE)[[1]]$type    # Classification or Regression
names(getModelInfo())                          # every method name
getModelInfo("rf", regex = FALSE)[[1]]$fit     # underlying fit function
length(getModelInfo())                         # total models in registry

[DECISION TREE: Is getModelInfo() the right tool?]
- inspect a model's full definition: getModelInfo("rf", regex = FALSE)
- just see tuning parameters: modelLookup("xgbTree")
- list every caret method name: names(getModelInfo())
- fit and tune the model: train(y ~ ., data = df, method = "rf")
- build a custom model wrapper: list(library, type, parameters, fit, predict)
- compare resampled performance: resamples(list(rf = m1, gbm = m2))

## What getModelInfo() does in one sentence

**`getModelInfo()` returns the entire caret recipe for a model.** You pass a method string like `"rf"` or `"xgbTree"` and get back a named list whose elements are the same objects `train()` consults internally: the tuning parameters, the library to load, the fit function, the predict function, the probability function, and a few smaller fields.

The point of `getModelInfo()` is to look under the hood. `modelLookup()` tells you *which* parameters a model tunes; `getModelInfo()` tells you *how* the model is actually wired into caret. Use it when you need to audit a method, build a custom model, or copy-paste an existing recipe as a starting template.

## getModelInfo() syntax and arguments

**The signature has two arguments, both with sensible defaults.** Most calls look like `getModelInfo("rf", regex = FALSE)`.

```r title="Load caret and check the signature"
library(caret)

args(getModelInfo)
#> function (model = NULL, regex = TRUE, ...)
#> NULL
```

Arguments:

- `model`: a character string naming a caret method. Default `NULL` returns the entire registry.
- `regex`: when `TRUE` (default), `model` is treated as a regular expression and partial matches return multiple entries. Set to `FALSE` for exact-name lookup.
- `...`: passed to `grepl()` when `regex = TRUE`, useful for `ignore.case`.

Each registry entry is a list with these key fields:

- `library`: character vector of packages caret will `library()` before fitting.
- `type`: a vector containing `"Classification"`, `"Regression"`, or both.
- `parameters`: a data frame of tuning parameter names and labels.
- `grid`: a function that builds the default tuning grid.
- `fit`: the function caret calls to train one model.
- `predict`: the function caret calls for predictions.
- `prob`: the function for class probabilities (`NULL` if the model has none).
- `sort`, `loop`, `levels`, `tags`: smaller bookkeeping fields.

[NOTE]
**`getModelInfo()` reads metadata, it does not fit a model.** Calls are cheap and have no side effects, so you can run them in a loop or a Shiny dropdown without performance worry.

## getModelInfo() examples by use case

### 1. Fetch one model's full entry

The most common call: pass a method string with `regex = FALSE` and read the result.

```r title="Inspect the rf entry"
rf <- getModelInfo("rf", regex = FALSE)
class(rf)
#> [1] "list"

names(rf)
#> [1] "rf"

names(rf$rf)
#>  [1] "label"      "library"    "loop"       "type"       "parameters"
#>  [6] "grid"       "fit"        "predict"    "prob"       "predictors"
#> [11] "varImp"     "levels"     "tags"       "sort"       "oob"
```

The outer list is keyed by model name, so use `rf[["rf"]]` (or `rf$rf`) to reach the registry entry. From there, every field is a regular R object you can inspect, modify, or pass to `train(method = list(...))`.

### 2. Read the tuning parameters and library

These are the two fields you reach for most often before calling `train()`.

```r title="Tuning parameters and required packages"
rf_def <- getModelInfo("rf", regex = FALSE)[["rf"]]

rf_def$parameters
#>   parameter   class                         label
#> 1      mtry numeric #Randomly Selected Predictors

rf_def$library
#> [1] "randomForest"

rf_def$type
#> [1] "Regression"     "Classification"
```

`parameters` tells you the column names a `tuneGrid` data frame must have (`mtry`, one column). `library` lists the packages caret loads before fitting; you need them installed. `type` confirms `rf` handles both regression and classification.

### 3. List every caret method

Calling `getModelInfo()` with no arguments returns the full registry. Take `names()` of it to get the method strings you can pass to `train(method = ...)`.

```r title="Browse every available model"
all_models <- names(getModelInfo())
length(all_models)
#> [1] 238

head(all_models, 10)
#>  [1] "ada"             "AdaBag"          "AdaBoost.M1"     "adaboost"
#>  [5] "amdai"           "ANFIS"           "avNNet"          "awnb"
#>  [9] "awtan"           "bag"
```

The exact count drifts a little across caret versions; on most installs you will see roughly 230 to 240 methods. Use this list to populate a Shiny dropdown, audit available algorithms, or sanity-check that a method string is valid.

### 4. Filter for classifiers that support probabilities

The registry is just a named list, so any list operation works on it. This is how you find every model that can return `predict(type = "prob")`.

```r title="Classifiers with class probability support"
prob_classifiers <- Filter(function(m) {
  info <- getModelInfo(m, regex = FALSE)[[1]]
  "Classification" %in% info$type && !is.null(info$prob)
}, names(getModelInfo()))

length(prob_classifiers)
#> [1] 197

head(prob_classifiers, 8)
#> [1] "ada"         "AdaBag"      "AdaBoost.M1" "adaboost"
#> [5] "amdai"       "avNNet"      "awnb"        "awtan"
```

You can adapt the predicate to any field: regression-only models, models that need a specific package, models with a particular tuning parameter, or models tagged with a keyword in `info$tags`.

[KEY INSIGHT]
**`getModelInfo()` is what `train()` calls under the hood.** When you write `train(method = "rf", ...)`, caret looks up the same entry you just inspected and dispatches `fit`, `predict`, and `prob` from it. Reading the entry is reading the actual code path.

## getModelInfo() vs modelLookup()

**Both inspect the registry, but they return different shapes.** `modelLookup()` returns a flat data frame of tuning parameters; `getModelInfo()` returns the entire recipe.

| Concern | `modelLookup()` | `getModelInfo()` |
|---|---|---|
| Return type | Data frame, one row per parameter | Named list of named lists |
| Scope | Tuning parameters only | Library, type, parameters, fit, predict, prob, grid, sort, loop |
| Filtering by name | Exact method string | Regex by default; pass `regex = FALSE` for exact |
| Typical use | Build a `tuneGrid` quickly | Audit code, build custom models, inspect probability support |
| Output size | One row of metadata | Full closures and helper functions |

Reach for `modelLookup()` when you just need parameter names. Reach for `getModelInfo()` when you need the surrounding context: which package gets loaded, whether `predict(type = "prob")` is supported, or what the default tuning grid looks like.

[WARNING]
**With `regex = TRUE` (the default), `"rf"` matches more than one model.** It will pull `rf`, `RRF`, `RRFglobal`, `Rborist`, `parRF`, and any other method whose name contains the substring. Always pass `regex = FALSE` for an exact lookup, or read `length()` of the result before subsetting.

```r title="Regex vs exact lookup"
length(getModelInfo("rf", regex = TRUE))
#> [1] 6

length(getModelInfo("rf", regex = FALSE))
#> [1] 1
```

## Common pitfalls

**Forgetting `regex = FALSE`** is the single most frequent mistake. The default returns a list of every method whose name partial-matches the string, which silently breaks code that assumes a one-element list. Pin the lookup with `regex = FALSE` or guard with `stopifnot(length(info) == 1)`.

**Trying to fit from `getModelInfo()` alone** does not work. The `fit` field is a function, but it expects caret's internal arguments (training data already preprocessed, parameter row from the tuning grid, `wts`, `lev`, `last`, `classProbs`). Call `train()` for the user-facing path; reach into `fit` only when building a custom method.

**Assuming every method supports probabilities.** Some classifiers return `info$prob = NULL`, meaning `predict(type = "prob")` will error. Check `!is.null(info$prob)` before configuring `trainControl(classProbs = TRUE)`.

## Try it yourself

**Try it:** List every caret method whose `library` field is exactly `"randomForest"`. Save the result to `ex_rf_models`.

```r title="Your turn: find randomForest-backed methods"
# Try it: filter the registry by library
ex_rf_models <- # your code here

ex_rf_models
#> Expected: a character vector containing "rf" and "parRF"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rf_models <- Filter(function(m) {
  identical(getModelInfo(m, regex = FALSE)[[1]]$library, "randomForest")
}, names(getModelInfo()))

ex_rf_models
#> [1] "parRF" "rf"
```

**Explanation:** Iterate every method name, pull its entry with `regex = FALSE`, and keep the names whose `library` field equals `"randomForest"` exactly. `identical()` is safer than `==` because the field can be a multi-element character vector for models that need several packages.

</details>

## Related caret functions

Several caret helpers work alongside `getModelInfo()`:

- `modelLookup()`: shortcut for the parameter table, no other fields.
- `train()`: actually fits the model whose recipe you just inspected.
- `trainControl()`: configures resampling; set `classProbs = TRUE` only when `info$prob` is non-`NULL`.
- `getModelInfo()` itself accepts any caret method, including custom ones you registered.

For caret's official model list see the [caret model documentation](https://topepo.github.io/caret/available-models.html).

## FAQ

**How do I list every model caret supports?**

Call `names(getModelInfo())` with no arguments. It returns a character vector of every method string registered in your installed caret version, typically 230 to 240 entries. The exact count varies because some methods depend on optional packages; methods are still listed even when the backing package is not installed, but `train()` will fail until you install it.

**What is the difference between getModelInfo() and modelLookup()?**

`modelLookup()` returns a flat data frame of tuning parameters and a few flags (`forReg`, `forClass`, `probModel`). `getModelInfo()` returns the full registry entry: the same parameters plus the library, type, fit function, predict function, probability function, default tuning grid, and bookkeeping fields. Use `modelLookup()` to build a `tuneGrid`; use `getModelInfo()` to audit code or build a custom method.

**Can I modify a model entry and pass it to train()?**

Yes. Take `info <- getModelInfo("rf", regex = FALSE)[["rf"]]`, edit the fields you want (a custom `grid` function, a smaller default tuning grid, a different `prob` handler), and pass the result via `train(..., method = info)`. This is the canonical way to extend caret without forking the package.

**Why does getModelInfo("rf") return six entries?**

Because `regex = TRUE` is the default and `"rf"` substring-matches `rf`, `parRF`, `RRF`, `RRFglobal`, `Rborist`, and any other registry entry whose name contains the letters. Pass `regex = FALSE` to lock the lookup to an exact match, or use `getModelInfo("^rf$", regex = TRUE)` if you prefer regex anchors.

---
title: "parsnip cubist_rules() in R: Rule-Based Regression Models"
slug: parsnip-cubist_rules-in-R
description: "parsnip cubist_rules() in R defines a Cubist rule-based regression model for tidymodels. Covers syntax, the Cubist engine, committees, neighbors, examples."
keywords: "parsnip cubist_rules, cubist_rules function R, parsnip cubist_rules examples, Cubist model R tidymodels, rule-based regression R, cubist rules tidymodels"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "cubist_rules()|parsnip cubist_rules|cubist_rules function|Cubist model in R|rule-based regression"
auto_link_case_sensitive: true
target_keyword: "parsnip cubist_rules"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip cubist_rules() in R: Rule-Based Regression Models

<p class="lead">The parsnip <code>cubist_rules()</code> function defines a Cubist rule-based regression model for tidymodels. It gives you one interface for a model that splits the data into rules and fits a separate linear regression inside each one, through the Cubist engine.</p>

[QUICK ANSWER]
cubist_rules()                              # default spec, Cubist engine
cubist_rules() |> set_mode("regression")    # the only supported mode
cubist_rules(committees = 10)               # boost with 10 committees
cubist_rules(neighbors = 5)                 # instance-based correction
cubist_rules(max_rules = 20)                # cap the number of rules
cubist_rules() |> set_engine("Cubist")      # name the engine explicitly
fit(spec, mpg ~ ., data = mtcars)           # train on a dataset

[DECISION TREE: Is cubist_rules() the right tool?]
- rule-based numeric prediction: cubist_rules() |> set_engine("Cubist")
- rule-based classification: C5_rules() |> set_engine("C5.0")
- one readable tree: decision_tree() |> set_engine("rpart")
- gradient-boosted trees: boost_tree() |> set_engine("xgboost")
- many bagged trees averaged: rand_forest() |> set_engine("ranger")
- tune committees by grid: tune_grid() with cubist_rules()

## What cubist_rules() does

**cubist_rules() is a model specification, not a fitted model.** It records your choice of a Cubist rule-based regression model and its hyperparameters, but no data touches it until you call `fit()`. This separation lets you reuse one specification across many datasets or resampling folds.

A Cubist model first grows a tree, then collapses that tree into a flat list of `if-then` rules. What sets it apart is the leaf: instead of predicting a single constant, each rule holds its own linear regression model. A prediction is the output of whichever rule the new row matches.

The function belongs to the tidymodels framework. Because parsnip standardizes the interface, `cubist_rules()` shares the same `fit()` and `predict()` verbs used by every other parsnip model.

[KEY INSIGHT]
**Cubist puts a regression model in every rule.** A plain decision tree predicts one constant per leaf, so its surface looks like flat steps. Cubist instead attaches a multiple linear regression to each rule, so within a rule the prediction still slopes with the predictors. The result combines readable rules with sloped predictions, so Cubist often beats a single tree on numeric targets.

## cubist_rules() syntax and arguments

**cubist_rules() takes three hyperparameters and two setup verbs.** The arguments shape how many rule committees the model builds and how predictions are adjusted, while `set_engine()` and `set_mode()` finish the specification.

```r title="The cubist_rules specification skeleton"
library(tidymodels)
library(rules)

cubist_rules(
  mode = "regression",   # regression is the only supported mode
  committees = NULL,     # number of boosting-style committees, 1 to 100
  neighbors = NULL,      # nearest neighbors for prediction adjustment, 0 to 9
  max_rules = NULL,      # maximum number of rules to keep
  engine = "Cubist"      # Cubist is the only standard engine
)
```

The `committees` argument sets how many sequential rule sets the model builds, much like boosting iterations, where each committee corrects the errors of the last. The `neighbors` argument turns on instance-based correction: at prediction time the model nudges its estimate toward the known outcomes of similar training rows. The `max_rules` argument caps how many rules survive, so a smaller value gives a simpler model.

[NOTE]
**cubist_rules() lives in the rules package, not core parsnip.** You need `library(rules)` alongside `library(tidymodels)` to register the function. The fitting itself happens in the `Cubist` engine package, so install `Cubist` before you call `fit()` or R reports that the engine is not available. When the hyperparameters are left `NULL`, the Cubist engine picks sensible defaults from the data.

## Fit a Cubist model: four examples

**Every example below uses the built-in mtcars dataset.** Cubist supports regression only, so all four examples predict the numeric `mpg` column and the code runs anywhere with no downloads.

### Example 1: Fit a regression Cubist on mtcars

**Build the specification, then fit it to data.** Leaving the hyperparameters unset lets the Cubist engine choose the rules and their linear models.

```r title="Fit cubist_rules on the mtcars data"
cubist_spec <- cubist_rules() |>
  set_engine("Cubist") |>
  set_mode("regression")

cubist_fit <- cubist_spec |>
  fit(mpg ~ ., data = mtcars)

preds <- predict(cubist_fit, new_data = mtcars)
cor(preds$.pred, mtcars$mpg)^2
#> [1] 0.872
```

Squaring the correlation between predicted and actual `mpg` gives a training R-squared near 0.87. On data this small Cubist forms a single rule, so the result is one linear model over the strongest predictors.

### Example 2: Predict mpg for new rows

**predict() returns a tidy tibble with one row per input row.** Each prediction comes from the linear model inside the matching rule.

```r title="Predict mpg for new rows"
sample_rows <- mtcars[c(1, 15, 30), ]

predict(cubist_fit, new_data = sample_rows)
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.6
#> 2  11.2
#> 3  19.4
```

The `.pred` column holds the predicted miles per gallon as a number. The output keeps the same row order as the input, so you can bind it back to `sample_rows` with `bind_cols()`.

### Example 3: Boost accuracy with committees

**Raise committees and Cubist builds several rule sets in sequence.** Each new committee focuses on the rows the previous ones predicted poorly.

```r title="Use ten committees for a boosted fit"
cubist_boost <- cubist_rules(committees = 10) |>
  set_engine("Cubist") |>
  set_mode("regression")

boost_fit <- cubist_boost |>
  fit(mpg ~ ., data = mtcars)

boost_preds <- predict(boost_fit, new_data = mtcars)
cor(boost_preds$.pred, mtcars$mpg)^2
#> [1] 0.908
```

With ten committees the training R-squared climbs to about 0.91. The committees behave like boosting rounds, so accuracy usually rises before it plateaus.

### Example 4: Adjust predictions with neighbors

**Set neighbors and Cubist corrects each prediction using similar training rows.** The model blends its rule-based estimate with the outcomes of the nearest neighbors.

```r title="Add instance-based correction with neighbors"
cubist_knn <- cubist_rules(committees = 10, neighbors = 5) |>
  set_engine("Cubist") |>
  set_mode("regression")

knn_fit <- cubist_knn |>
  fit(mpg ~ ., data = mtcars)

predict(knn_fit, new_data = mtcars[1:3, ])
#> # A tibble: 3 x 1
#>   .pred
#>   <dbl>
#> 1  21.4
#> 2  21.0
#> 3  25.3
```

With `neighbors = 5`, each prediction shifts toward the average outcome of the five most similar cars. This often sharpens accuracy when the rule-based estimate alone is slightly off.

[TIP]
**Tune committees and neighbors together, not separately.** These two arguments interact: more committees sharpen the rule fit, while neighbors corrects whatever the rules still miss. A small grid that crosses a few committee counts with `neighbors` values of 0, 5 and 9 usually finds a better model than tuning either argument on its own.

## cubist_rules() vs boost_tree() vs decision_tree()

**parsnip ships several tree-based ways to fit a numeric target.** They share the same verbs, so swapping between them is a one-line change.

| Function | What each leaf predicts | Output style | Use when |
|---|---|---|---|
| `decision_tree()` | One constant value | A single readable tree | You need a simple, explainable model |
| `cubist_rules()` | A linear regression model | A flat list of rules | Rules plus sloped predictions help |
| `boost_tree()` | Many trees summed | An ensemble score | Raw accuracy matters most |

Start with `decision_tree()` when explainability is the goal, reach for `cubist_rules()` when you want rules that still respond smoothly to the predictors, and use `boost_tree()` when only predictive accuracy counts.

## Common pitfalls

**Three mistakes catch most newcomers to cubist_rules().** Each one below shows the problem and the fix.

The most common is asking for classification. Cubist is a regression-only algorithm, so `set_mode("classification")` fails. Reach for `C5_rules()` from the same `rules` package when you need rule-based classification.

```r title="Cubist supports regression only"
# Wrong: classification is not a Cubist mode
cubist_rules() |>
  set_mode("classification")
#> Error: "classification" is not a known mode for model `cubist_rules()`.

# Right: regression is the only mode
cubist_rules() |>
  set_mode("regression")
```

The second pitfall is forgetting `library(rules)`. Because `cubist_rules()` lives in the `rules` extension package, a plain `library(tidymodels)` does not expose it and R reports that the function is not found. The third is passing a `neighbors` value outside 0 to 9, since the Cubist engine only accepts that range and rejects anything larger.

[WARNING]
**A large committees value can overfit small data.** Each committee adds another rule set that chases the residuals of the last, so on a small table like `mtcars` the model can start memorizing noise. Keep `committees` modest and tune it across resampling folds with `vfold_cv()` rather than trusting training R-squared.

## Try it yourself

**Try it:** Fit a Cubist regression model on `mtcars` with `committees = 5`, then predict `mpg` for the first row. Save the prediction to `ex_pred`.

```r title="Your turn: cubist_rules on mtcars"
# Try it: fit a committees = 5 Cubist model, then predict row 1
ex_spec <- # your code here
ex_fit  <- # your code here
ex_pred <- # your code here

ex_pred
#> Expected: a 1-row tibble with one .pred value near 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_spec <- cubist_rules(committees = 5) |>
  set_engine("Cubist") |>
  set_mode("regression")

ex_fit <- ex_spec |>
  fit(mpg ~ ., data = mtcars)

ex_pred <- predict(ex_fit, new_data = mtcars[1, ])
ex_pred
#> # A tibble: 1 x 1
#>   .pred
#>   <dbl>
#> 1  21.5
```

**Explanation:** Setting `committees = 5` builds five sequential rule sets that each correct the last. Row 1 of mtcars is the Mazda RX4, whose true mpg is 21, so the Cubist prediction lands close.

</details>

## Related parsnip functions

**cubist_rules() works alongside the rest of the parsnip model family.** These functions cover the neighboring tasks in a tidymodels project.

- `C5_rules()` defines a C5.0 rule-based model for classification problems.
- `rule_fit()` defines a RuleFit model that mixes ensemble rules with a lasso fit.
- `decision_tree()` defines a single tree of axis-aligned splits.
- `boost_tree()` defines a gradient-boosted ensemble of trees.
- `set_engine()` chooses the computational backend for any specification.

## FAQ

**What package is cubist_rules() in?**

`cubist_rules()` ships in the `rules` package, a parsnip extension, so you need `library(rules)` in addition to `library(tidymodels)`. The function only describes the model; the actual fitting happens in an engine package. The standard registered engine is `Cubist`, which implements Quinlan's Cubist algorithm, so install the `Cubist` package separately before you call `fit()`.

**What is the difference between cubist_rules() and decision_tree()?**

`decision_tree()` predicts a single constant value in each leaf, so its surface is a set of flat steps. `cubist_rules()` instead fits a separate multiple linear regression inside every rule, so predictions still slope with the predictors within a rule. Cubist also builds committees, a boosting-style ensemble of rule sets. Choose `decision_tree()` for a simple, readable model and `cubist_rules()` when sloped, rule-based predictions improve accuracy.

**Does cubist_rules() support classification?**

No. Cubist is a regression-only algorithm, so `cubist_rules()` accepts only `set_mode("regression")` and `fit()` fails on a factor outcome. For rule-based classification, use `C5_rules()` from the same `rules` package, which wraps the C5.0 algorithm.

**What do committees do in cubist_rules()?**

The `committees` argument sets how many rule sets Cubist builds in sequence. The first committee fits the data, and each later committee adjusts its training targets to focus on the rows the previous committees predicted poorly, much like boosting rounds. More committees usually raise accuracy until the gain plateaus.

**How do I tune cubist_rules() hyperparameters?**

Mark the arguments with `tune()`, as in `cubist_rules(committees = tune(), neighbors = tune())`, then pass the specification to `tune_grid()` with a resampling object such as `vfold_cv()`. The framework scores a grid of committee counts and neighbor values with cross-validation. Use `select_best()` to pick the winner, then `finalize_workflow()` to lock the values before the final fit.

For the full argument reference, see the [rules cubist_rules() documentation](https://rules.tidymodels.org/reference/cubist_rules.html).
</content>
</invoke>

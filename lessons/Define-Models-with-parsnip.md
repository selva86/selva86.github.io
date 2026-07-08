---
title: "tidymodels Lesson 2: Define models with parsnip"
description: "Use parsnip to define models in R through one interface: build a spec, fit it, and switch from logistic regression to a random forest without rewriting code."
keywords: "parsnip, tidymodels, R modeling, model specification, set_engine, set_mode, rand_forest, logistic regression in R, predict tibble, switch model engine"
mathjax: true
webr: true
curriculum_id: "6.50.2"
post_type: "LESSON"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "2"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Bundle-Steps-with-workflows.html"
course_prev: "Preprocess-with-recipes.html"
lesson_access: "free"
catalog_blurb: "One interface to fit and swap many models without rewriting your code."
---

=== step === cover
::eyebrow Lesson 2 of 7
## Define models with parsnip

In Lesson 1 you cleaned the lender's data with a recipe. Now you need the model that actually predicts who defaults. Here is the snag: R has dozens of modeling packages, and each one speaks its own dialect. The argument names differ, the way you hand over data differs, even the shape of the answer differs. parsnip gives you one calm way to describe any model, so you can fit a logistic regression today and a random forest tomorrow without rewriting a line of the code around it.

By the end of this lesson you will be able to:

- Tell a model (the mathematical form) apart from the engine (the package that fits it)
- Build a parsnip spec from three plain choices: model type, engine, and mode
- Fit it, read the tidy predictions, and swap in a completely different model without touching the rest of your code

**Prerequisites:** you can run R and use the `|>` pipe, and you have built a [recipe to prep and bake your data](Preprocess-with-recipes.html).

::widget process-flow {"steps":[{"title":"specify","sub":"pick a model type: logistic_reg, rand_forest"},{"title":"set_engine","sub":"which package fits it: glm, randomForest"},{"title":"set_mode","sub":"classification or regression"},{"title":"fit","sub":"run the spec on the training data"},{"title":"predict","sub":"a tidy tibble, the same shape every time"}]}

=== step === concept
::eyebrow The problem
## Every model speaks a different dialect

Each modeling package in base R was written by different people at different times, so each has its own way of being called. Suppose our lender wants to try three models on the same question, who defaults. Watch how little the three calls have in common.

```r-static
# Logistic regression
glm(defaulted ~ ., data = train, family = binomial)

# Random forest
randomForest(defaulted ~ ., data = train, ntree = 500)

# Penalized logistic (lasso)
glmnet(x = model.matrix(defaulted ~ ., train)[, -1],
       y = train$defaulted, family = "binomial")
```

Three models, three different stories. The differences are not cosmetic; they reach all the way to how you read the result.

| Model | Function | How the data goes in | What `predict()` returns |
|---|---|---|---|
| Logistic regression | `glm()` | a formula plus a data frame | log-odds numbers you convert yourself |
| Random forest | `randomForest()` | a formula plus a data frame | a factor of classes, or a votes matrix |
| Lasso | `glmnet()` | a numeric `x` matrix plus a `y` vector | a matrix, one column per penalty value |

To move from one model to the next you rewrite the call, reshape the data, and re-learn how to read the output. parsnip removes all three frictions at once.

=== step === concept
::eyebrow The core idea
## A model, an engine, and a mode

parsnip asks you for three things, each in plain words.

1. **The model type:** the mathematical form of the model, such as a logistic regression or a random forest. `logistic_reg()` and `rand_forest()` are model types.
2. **The engine:** which package actually does the fitting. The same logistic regression can be estimated by `glm`, by `glmnet`, even by Stan. You pick one with `set_engine()`.
3. **The mode:** are you predicting a category (classification) or a number (regression)? You choose with `set_mode()`.

The model-versus-engine split is the heart of parsnip, so let us make it precise. A logistic regression is a mathematical statement: the log-odds of the outcome are a straight-line combination of the predictors,

\[ \log\frac{p}{1-p} = \beta_0 + \beta_1 x_1 + \cdots + \beta_k x_k \]

where \(p\) is the probability the applicant defaults, \(x_1, \dots, x_k\) are the predictors (income, age, and so on), and \(\beta_0, \dots, \beta_k\) are the numbers the model learns. That equation is the **model**. How you actually find the best \(\beta\) values, by maximum likelihood in `glm`, by penalized likelihood in `glmnet`, by sampling in Stan, is the **engine**. Same model, different engine.

In R, the spec reads like a sentence:

```r
library(parsnip)
spec <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")
spec
#> Logistic Regression Model Specification (classification)
#>
#> Computational engine: glm
```

[KEY INSIGHT]
A model type plus an engine plus a mode is a complete parsnip spec. Read it back and it says exactly what you intend: a logistic regression, fit by glm, used for classification.

One honest catch lives in the word engine. The engine package has to be installed. `glm` rides along with R itself, but to use the `randomForest` engine in a moment, the randomForest package must be present, and parsnip will tell you plainly if it is missing.

=== step === concept
::eyebrow Blueprint, then fit
## A spec is a plan until you fit it

Notice what just happened, or rather what did not. We described a model, yet no data has been touched and nothing has been learned. A spec is a blueprint, exactly as the recipe in Lesson 1 was a plan until `prep()` ran it. Learning happens only when you call `fit()` with training data.

First, the lender's loan book, built right here so this page stands on its own:

```r
set.seed(7)
n <- 240
loans <- data.frame(
  income   = round(runif(n, 22000, 98000)),   # annual income
  age      = round(runif(n, 21, 60)),
  employed = round(runif(n, 2, 160)),         # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
risk <- with(loans, plogis(-1.1 + 1.4 * (income < 45000) +
              1.0 * (employed < 20) + 0.6 * (home == "rent")))
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"))
train <- loans[1:180, ]     # 180 applicants to learn from
test  <- loans[181:240, ]   # 60 held back to predict on
table(train$defaulted)
#>  no yes
#> 114  66
```

Now fit the spec to the training set. parsnip hands your formula and data to the engine, runs it, and keeps the real fitted model in a tidy wrapper. `extract_fit_engine()` hands that real model back, and here it is an ordinary `glm` object you could pass to any glm method:

```r
fit_glm <- fit(spec, defaulted ~ income + age + employed + home, data = train)
class(extract_fit_engine(fit_glm))   # the real model wrapped inside
#> [1] "glm" "lm"
```

[KEY INSIGHT]
fit() is the single moment any learning happens, and it happens on the training data alone. parsnip did not replace glm; it called glm for you and kept the genuine result in a consistent wrapper, while extract_fit_engine() returns that original model whenever you want it.

=== step === quiz
::eyebrow Check yourself
## Model or engine?

You have a spec that reads `logistic_reg() |> set_engine("glm")`. You change it to `logistic_reg() |> set_engine("glmnet")`. What did you change?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The model type: you are now fitting a different kind of model ::no The model type is still logistic_reg(); the equation for the log-odds has not changed. Only the package that estimates it did.
- The mode: you switched from classification to regression ::no The mode is untouched. set_mode() controls that, and you did not call it; glmnet here is still doing classification.
- The engine: the same logistic regression, now estimated by a different package ::ok Right. The model type (the equation) and the mode (the task) are unchanged. set_engine() only swaps how the coefficients are computed: glm's maximum likelihood for glmnet's penalized version.

=== step === widget
::eyebrow The payoff
## Swap the model, keep your code

Here is what the unified interface buys you. To try a random forest instead of a logistic regression, you change the spec and nothing else. The `fit()` call and the `predict()` call stay exactly the same.

A random forest is a completely different algorithm (hundreds of decision trees voting), yet the code around it does not flinch. We load the engine package so parsnip can reach it, then fit on the same training data:

```r
library(randomForest)
rf_spec <- rand_forest(trees = 300) |>
  set_engine("randomForest") |>
  set_mode("classification")

set.seed(99)
fit_rf <- fit(rf_spec, defaulted ~ income + age + employed + home, data = train)
predict(fit_rf, new_data = test) |> head()
#> # A tibble: 6 x 1
#>   .pred_class
#>   <fct>
#> 1 no
#> 2 yes
#> 3 no
#> 4 no
#> 5 no
#> 6 no
```

Same `fit()`, same `predict()`. Only the first line, the spec, changed. That is the whole promise: your modeling code stops caring which algorithm is underneath it.

::widget process-flow {"steps":[{"title":"swap the spec","sub":"logistic_reg() becomes rand_forest()"},{"title":"fit","sub":"same call as before, same arguments"},{"title":"predict","sub":"same call, same tidy tibble back"}]}

=== step === concept
::eyebrow Tidy by design
## Predictions you can always read

Look again at what `predict()` returned: a tibble with one tidy column, `.pred_class`. That is not a glm quirk or a random forest quirk. parsnip guarantees the same shape for every model. Ask for class probabilities instead and you always get one column per class, each named for its class:

```r
predict(fit_glm, new_data = test, type = "prob") |> head()
#> # A tibble: 6 x 2
#>   .pred_no .pred_yes
#>      <dbl>     <dbl>
#> 1    0.800     0.200
#> 2    0.446     0.554
#> 3    0.619     0.381
#> 4    0.755     0.245
#> 5    0.792     0.208
#> 6    0.641     0.359
```

Compare that to base R, where every model answers `predict()` in its own format:

| Model | What base-R `predict()` hands back |
|---|---|
| `glm()` | a numeric vector on the log-odds scale, unless you remember `type = "response"` |
| `randomForest()` | a factor of classes, or a votes matrix with `type = "prob"` |
| `glmnet()` | a matrix, one column per penalty value |

With parsnip the answer is always a tibble, with the same number of rows as your input and predictably named columns: `.pred_class` for the label, and `.pred_<level>` for each probability. You can pipe it straight into the next step without reshaping anything.

[NOTE]
Predictable column names are what make the rest of tidymodels click together. In Lesson 5 you will hand these `.pred_` columns straight to yardstick to score the model, with no glue code in between.

=== step === quiz
::eyebrow Check yourself
## What does predict() give you?

You fit two parsnip models, a logistic regression and a random forest, and call `predict(fit, new_data = test)` on each with no `type` argument. What comes back?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A plain vector from each, in whatever format the underlying package happens to use ::no That is base R's behaviour, and the exact friction parsnip removes. Through parsnip every model answers in the same tidy tibble.
- A tibble from each, with the same column (.pred_class) and one row per input row ::ok Exactly. Every parsnip model returns a tibble of the same shape, so the same downstream code reads both. Ask for type = "prob" and you get .pred_no and .pred_yes columns the same way.
- Nothing useful until you also pass the original training data ::no predict() needs only the fitted model and the new_data; the training data is already baked into the fit.

=== step === tryit
::eyebrow Your turn
## Specify a decision tree

Your lender wants to try one more model: a single decision tree, fit by the `rpart` engine, for classification. The model type is `decision_tree()`, and the mode is already set for you. Add the one verb that names the fitting package, then check it.

```r
tree_spec <- decision_tree(tree_depth = 5) |>
  ____("rpart") |>          # name the package that will fit the tree
  set_mode("classification")
tree_spec
```
::check {"regex":"set_engine","gate":true,"difficulty":"intermediate","ok":"That is it: set_engine() names the package that fits the tree, here rpart. Same three-part pattern, a brand new model type.","no":"You need the verb that picks the fitting package: set_engine(\"rpart\")."}
::solution
```r
library(rpart)
tree_spec <- decision_tree(tree_depth = 5) |>
  set_engine("rpart") |>
  set_mode("classification")
tree_spec
#> Decision Tree Model Specification (classification)
#>
#> Main Arguments:
#>   tree_depth = 5
#>
#> Computational engine: rpart
```

=== step === concept
::eyebrow Going further
## One interface, many more engines

parsnip ships with engines for the common models, and you can always ask what is on offer for a given model type:

```r
library(parsnip)
show_engines("logistic_reg")
#> # A tibble: 8 x 2
#>   engine    mode
#>   <chr>     <chr>
#> 1 glm       classification
#> 2 glmnet    classification
#> 3 LiblineaR classification
#> 4 spark     classification
#> 5 keras     classification
#> 6 keras3    classification
#> 7 stan      classification
#> 8 brulee    classification
```

When you need a model parsnip does not cover out of the box, an add-on package registers new engines that plug into the same interface. The most useful one for tabular data is **bonsai**, which adds the modern boosted-tree engines, LightGBM and CatBoost, behind the familiar `boost_tree()` model type:

```r-static
library(bonsai)

boost_spec <- boost_tree(trees = 500, learn_rate = 0.05) |>
  set_engine("lightgbm") |>
  set_mode("classification")

fit_boost <- fit(boost_spec, defaulted ~ ., data = train)
```

That spec reads exactly like the others: a model type, an engine, a mode. (LightGBM relies on a compiled library, so run that block in a local R session rather than here in the browser.) The point holds either way: once you know the three-part pattern, every model in the tidymodels universe looks the same.

=== step === concept
::eyebrow Go deeper
## References

- [parsnip package documentation (tidymodels)](https://parsnip.tidymodels.org/) - the official reference for model types, set_engine(), set_mode(), and fit().
- [Tidy Modeling with R, ch. 6: Fitting models with parsnip](https://www.tmwr.org/models) - Kuhn and Silge's walk-through of the specify, fit, predict pattern.
- [Search parsnip models and engines](https://www.tidymodels.org/find/parsnip/) - a browsable list of every model type and the engines that fit it.
- [bonsai package documentation](https://bonsai.tidymodels.org/) - the add-on that registers LightGBM and CatBoost as parsnip engines.

=== step === complete
## Lesson 2 complete

You can now describe any model the tidymodels way: a model type, an engine, and a mode, fit with one call and read through predictably tidy predictions. That single interface is what lets you swap a logistic regression for a random forest, or a boosted tree, without rewriting the code around it.

Next, Lesson 3: Bundle steps with workflows. You will tie the recipe from Lesson 1 and the model spec from this lesson into one object that preprocesses, fits, and predicts as a single unit, so your training and test data always flow through the exact same pipeline with no chance of a mismatch.

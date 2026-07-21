---
title: "tidymodels Lesson 3: Bundle steps with workflows"
catalog_blurb: "Combine preprocessing and a model so train and test follow the same path."
description: "Tie a recipe and a model into one tidymodels workflow in R: fit preprocessing and model in a single call, predict with automatic baking, and swap parts safely."
keywords: "tidymodels workflows, workflow in R, add_recipe, add_model, fit workflow, predict workflow, update_model, recipe and model pipeline, parsnip, prevent data leakage"
post_type: "LESSON"
curriculum_id: "6.50.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "3"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Resample-with-rsample.html"
course_prev: "Define-Models-with-parsnip.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Bundle steps with workflows

In Lesson 1 you built a recipe to clean the lender's data, and in Lesson 2 you built a model spec to predict who defaults. Right now those are two separate objects sitting on your desk. To actually score the test set you have to thread them together by hand: prep the recipe, bake the train data, fit the model, bake the test data the same way, then predict. Every place you re-type a step is a place train and test can quietly drift apart. A `workflow` bolts the recipe and the model into one object that does the whole thing in a single `fit()` and a single `predict()`.

By the end of this lesson you will be able to:

- Explain why a recipe and a model kept as two loose objects invite a train/test preprocessing mismatch
- Bundle them into one workflow and fit the whole pipeline with a single call
- Predict on raw new data and let the workflow re-apply the recipe for you, then swap the model with one line

**Prerequisites:** you can run R and use the `|>` pipe, and you have built a [recipe to prep and bake your data](Preprocess-with-recipes.html) and [a model spec you can fit and predict with](Define-Models-with-parsnip.html).

::widget process-flow {"steps":[{"title":"recipe + model","sub":"two separate objects from Lessons 1 and 2"},{"title":"workflow()","sub":"bundle them into one container"},{"title":"fit","sub":"prep the recipe and fit the model in one call"},{"title":"predict","sub":"new data is baked, then predicted, automatically"}]}

=== step === concept
::eyebrow The problem
## Two objects, threaded by hand

Here is the lender's loan book again, rebuilt right here so this page runs on its own, along with the recipe from Lesson 1 and the model spec from Lesson 2.

```r
library(recipes)
library(parsnip)

set.seed(7)
n <- 240
loans <- data.frame(
  income   = round(runif(n, 22000, 98000)),   # annual income
  age      = round(runif(n, 21, 60)),
  employed = round(runif(n, 2, 160)),          # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
risk <- with(loans, plogis(-1.1 + 1.4 * (income < 45000) +
             1.0 * (employed < 20) + 0.6 * (home == "rent")))
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"))
train <- loans[1:180, ]      # 180 applicants to learn from
test  <- loans[181:240, ]    # 60 held back to predict on
table(train$defaulted)
#>  no yes
#> 114  66
```

```r
# Lesson 1's recipe: impute, scale, dummy-code (learned on train)
rec <- recipe(defaulted ~ income + age + employed + home, data = train) |>
  step_impute_median(all_numeric_predictors()) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())

# Lesson 2's model: a logistic regression, fit by glm
spec <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")
```

Now score the test set the by-hand way. It takes five separate steps, and you have to keep them in step with each other every single time.

```r
prepped    <- prep(rec, training = train)        # 1. learn medians/means/sds on TRAIN
train_bake <- bake(prepped, new_data = train)    # 2. apply them to train
test_bake  <- bake(prepped, new_data = test)     # 3. apply the SAME numbers to test
fit_manual <- fit(spec, defaulted ~ ., data = train_bake)   # 4. fit on baked train
predict(fit_manual, new_data = test_bake) |> head()         # 5. predict on baked test
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

It works, but look at how much can go wrong. Forget step 3 and the model never sees the test set. Bake the test set with a recipe you accidentally re-prepped on `test`, and the leakage you closed in Lesson 1 comes right back. Add a model later and you must remember to bake its data too.

[WARNING]
Every hand-typed step is a chance for the test data to travel a different path than the training data. A mismatch here does not throw an error; it silently inflates or wrecks your score. This bookkeeping is exactly what a workflow takes off your hands.

=== step === quiz
::eyebrow Check yourself
## Where the by-hand pipeline breaks

A teammate scores the model like this: prep the recipe on `train` and predict on train, then, for the test set, prep a **brand-new** recipe on `test` and bake `test` with it. The test accuracy looks great. What went wrong?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The second recipe re-learned its medians and scaling from the test rows, so test information leaked into preprocessing and the score is optimistic ::ok Right. A recipe must be prepped on the training set alone, then the SAME frozen recipe applied to test with bake(). Prepping a fresh recipe on test relearns the numbers from test rows, exactly the leak Lesson 1 closed, and the by-hand pipeline makes that slip easy.
- Nothing is wrong; each set should be prepped on its own data ::no That is the leak. The numbers (medians, means, sds) must come from train only. Prepping again on test lets the test rows shape their own preprocessing, and your score stops being honest.
- bake() cannot be called twice, so the second call silently returned the training data ::no bake() can be applied as often as you like. The bug is statistical, not mechanical: the second recipe learned its statistics from the wrong rows.

=== step === concept
::eyebrow The fix
## A workflow is one container

A workflow is a single object that holds your preprocessor and your model together. You start an empty one with `workflow()`, then add the two pieces you already have.

```r
library(workflows)

wf <- workflow() |>
  add_recipe(rec) |>
  add_model(spec)
wf
#> == Workflow ===================================
#> Preprocessor: Recipe
#> Model: logistic_reg()
#>
#> -- Preprocessor -------------------------------
#> 3 Recipe Steps
#>
#> * step_impute_median()
#> * step_normalize()
#> * step_dummy()
#>
#> -- Model --------------------------------------
#> Logistic Regression Model Specification (classification)
#>
#> Computational engine: glm
```

Read it back and the workflow tells you exactly what it will do: take raw data, run the three recipe steps, then fit a logistic regression. Notice that nothing has been fitted yet. Just like a recipe or a spec, a workflow is a blueprint until you fit it.

::widget process-flow {"steps":[{"title":"workflow()","sub":"start an empty container"},{"title":"add_recipe(rec)","sub":"the preprocessor from Lesson 1"},{"title":"add_model(spec)","sub":"the model from Lesson 2"}]}

=== step === concept
::eyebrow One call
## One fit() does the whole pipeline

Calling `fit()` on the workflow does both jobs at once. It preps the recipe on the training data, bakes that data, and fits the model on the result, all inside a single call.

```r
wf_fit <- fit(wf, data = train)
class(extract_fit_engine(wf_fit))   # the genuine model fitted inside
#> [1] "glm" "lm"
```

The workflow really did run glm for you. `extract_fit_engine()` hands back the same kind of `glm` object you met in Lesson 2, now fitted on data the recipe had already prepared.

It helps to see a fitted workflow for what it is: a composition of two learned functions. To predict the outcome for a new applicant \(x\), the workflow computes

\[ \hat{y} = m\big(b(x)\big) \]

where \(b\) is the baking function the recipe learned on the training set (it carries the frozen medians, means and standard deviations from Lesson 1), and \(m\) is the model fitted in Lesson 2. Both \(b\) and \(m\) are learned once, on the training data, inside that one `fit()` call. At prediction time the workflow runs the same \(b\), then the same \(m\), on whatever \(x\) you hand it.

[KEY INSIGHT]
A single fit() learns both halves of the pipeline, the recipe's numbers and the model's coefficients, on the training data alone. There is no separate prep step to remember, and no way to fit the model on data the recipe has not prepared.

=== step === tryit
::eyebrow Your turn
## Attach the model

Here is a workflow with the recipe already added. Add the model spec so the container holds both pieces, then print it.

```r
wf2 <- workflow() |>
  add_recipe(rec) |>
  ____(spec)        # attach the model spec
wf2
```
::check {"regex":"add_model","gate":true,"difficulty":"intermediate","ok":"That completes the workflow: add_model() attaches the parsnip spec, so the container now holds the preprocessor AND the model.","no":"You need the verb that attaches a model spec to a workflow: add_model(spec)."}
::solution
```r
wf2 <- workflow() |>
  add_recipe(rec) |>
  add_model(spec)
wf2
```

=== step === concept
::eyebrow The payoff
## predict() bakes the new data for you

Now the moment it all pays off. To predict on the held-out applicants, you hand the fitted workflow the **raw** test set. You do not bake it first; the workflow bakes it for you, using the recipe it already learned on train.

```r
predict(wf_fit, new_data = test) |> head()
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

Ask for probabilities instead and you get the same tidy shape parsnip always returns, one column per class.

```r
predict(wf_fit, new_data = test, type = "prob") |> head()
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

Is the workflow really doing the same thing as the five hand-steps from before? Check it directly: pull the predicted class from each and compare.

```r
flow   <- predict(wf_fit, new_data = test)$.pred_class
manual <- predict(fit_manual, new_data = test_bake)$.pred_class
all(flow == manual)
#> [1] TRUE
```

Identical, row for row. The workflow is the by-hand pipeline, bundled into one object, with no chance of baking the test set differently from the training set.

[KEY INSIGHT]
You passed raw test data to predict() and got predictions straight back. The workflow baked it with the training recipe automatically, so train and test always travel the exact same path. That single guarantee is the whole reason workflows exist.

=== step === quiz
::eyebrow Check yourself
## What does predict() do here?

Your fitted workflow contains a recipe (impute, normalize, dummy-code) and a model. You call `predict(wf_fit, new_data = raw_test)` on brand-new applicants whose columns have **not** been baked. What happens?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It errors, because you have to bake the test data yourself before predicting ::no That is the by-hand workflow you are leaving behind. A fitted workflow bakes new data for you, so passing raw test is exactly right.
- It re-learns the normalization from these new test rows, then predicts ::no It never relearns anything at predict time. The recipe was frozen when you called fit(); predict applies those train-learned numbers, which is what keeps it leak-free.
- It applies the recipe it learned on train to the raw data, then feeds the baked rows to the model, returning a tidy tibble ::ok Exactly. predict() runs the frozen recipe, then the fitted model, so raw data in gives tidy predictions out, on the identical path the training data took.

=== step === concept
::eyebrow Swap a part
## Swap the model, keep the rest

Because the workflow holds the model in one named slot, you can replace it without touching the recipe or any of the surrounding code. `update_model()` swaps the model spec; the recipe rides along unchanged.

```r
library(randomForest)
rf_spec <- rand_forest(trees = 300) |>
  set_engine("randomForest") |>
  set_mode("classification")

wf_rf <- wf |> update_model(rf_spec)   # same recipe, brand-new model, one line

set.seed(99)
wf_rf_fit <- fit(wf_rf, data = train)
names(predict(wf_rf_fit, new_data = test))   # the answer arrives in the same tidy shape
#> [1] ".pred_class"
```

A random forest is a completely different algorithm from a logistic regression, yet the recipe, the `fit()` call, and the `predict()` call did not change. And when you need a fitted piece on its own, the extractors hand it back.

```r
class(extract_fit_engine(wf_rf_fit))   # the genuine randomForest model, pulled back out
#> [1] "randomForest"
```

[NOTE]
A workflow holds exactly one preprocessor and one model. That is deliberate: it is the single, unambiguous path your data takes. When you want to race several models or several recipes against each other at once, you reach for workflowsets, the subject of Lesson 7.

::widget process-flow {"steps":[{"title":"keep the recipe","sub":"the preprocessor does not change"},{"title":"update_model(rf_spec)","sub":"swap in a random forest, one line"},{"title":"fit + predict","sub":"the same calls, the same tidy output"}]}

=== step === tryit
::eyebrow Your turn
## A fresh workflow, end to end

Put it all together. The lender wants to try a single decision tree through the same recipe. The spec and the empty workflow are built for you. Complete the one call that preps the recipe **and** fits the tree in a single step.

```r
library(rpart)
tree_spec <- decision_tree(tree_depth = 5) |>
  set_engine("rpart") |>
  set_mode("classification")

tree_wf <- workflow() |>
  add_recipe(rec) |>
  add_model(tree_spec)

tree_fit <- ____(tree_wf, data = train)   # one call: prep the recipe AND fit the tree
tree_fit
```
::check {"regex":"fit\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That is the whole point: one fit() preps the recipe on train and fits the tree together, and predict() will bake the test set the same way. You changed only the model.","no":"Use fit(): fit(tree_wf, data = train) runs the recipe and fits the model in one call."}
::solution
```r
library(rpart)
tree_spec <- decision_tree(tree_depth = 5) |>
  set_engine("rpart") |>
  set_mode("classification")

tree_wf <- workflow() |>
  add_recipe(rec) |>
  add_model(tree_spec)

tree_fit <- fit(tree_wf, data = train)
predict(tree_fit, new_data = test) |> nrow()   # one tidy prediction per held-out applicant
#> [1] 60
```

=== step === concept
::eyebrow Go deeper
## References

- [workflows package documentation (tidymodels)](https://workflows.tidymodels.org/) - the official reference for `workflow()`, `add_recipe()`, `add_model()`, and `fit()`.
- [Tidy Modeling with R, ch. 7: A model workflow](https://www.tmwr.org/workflows) - Kuhn and Silge on why bundling preprocessing and modeling is sound practice, not just convenience.
- [Get Started: Preprocess your data with recipes](https://www.tidymodels.org/start/recipes/) - the official walk-through that pairs a recipe with a model inside a workflow, end to end.
- [workflows function reference](https://workflows.tidymodels.org/reference/index.html) - every verb you can use, including `update_model()`, `update_recipe()`, and the `extract_*()` family.

=== step === complete
## Lesson 3 complete

You can now bundle a recipe and a model into a single workflow that fits the whole pipeline in one call and bakes new data for you at predict time, so train and test can never drift apart. Swapping the model is one line, and the rest of your code does not flinch.

Next, Lesson 4: Resample with rsample. One honest train/test split still rests its whole verdict on a single slice of luck. You will run the entire workflow across many resampled folds, so your estimate of how good the model is becomes something you can actually trust.

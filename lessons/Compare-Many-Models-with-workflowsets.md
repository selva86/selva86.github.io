---
title: "tidymodels Lesson 7: Compare many models with workflowsets"
catalog_blurb: "How to compare several models on equal footing and pick the best."
description: "Run a fair model bake-off in R with workflowsets: cross recipes with models, score them all on the same folds, rank the leaderboard, and finalize the winner."
keywords: "workflowsets R, compare models in R, workflow_set, workflow_map, rank_results, tidymodels model selection, fit_resamples, last_fit, cross-validation comparison"
post_type: "LESSON"
curriculum_id: "6.50.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "7"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: ""
course_prev: "Tune-with-the-tune-package.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Compare many models with workflowsets

In Lesson 6 you tuned a single decision tree on the lender's loan book and confirmed it once on a sealed test set. But a tuned tree is only as good as the fact that it was a tree. In a real project you rarely commit to one model up front. You line up a few honest contenders, a plain logistic regression, that decision tree, a random forest, and you let them race.

The trick is making the race **fair**: every contender judged on the exact same folds, by the exact same metric, with no contender peeking at data the others did not. The chart below is the finish line, three models, one ROC AUC bar each, the tallest one wins. This lesson is how you produce that chart with one tool instead of three copy-pasted scripts.

::widget chart-plotter {"data":[{"x":"logistic","y":0.66},{"x":"tree","y":0.63},{"x":"forest","y":0.69}],"geoms":["bar"],"x":"model","y":"roc_auc"}

By the end of this lesson you will be able to:

- Explain why a fair model comparison needs the **same resamples and the same metric** for every contender
- Build a **workflow set** that crosses your preprocessors with your model specs into one object
- Run the whole bake-off across shared folds in one call, rank the leaderboard, and finalize the winner

**Prerequisites:** you can run R and use the `|>` pipe, and from earlier lessons you can [bundle a recipe and model into a workflow](Bundle-Steps-with-workflows.html) (Lesson 3), [score across cross-validation folds](Resample-with-rsample.html) (Lesson 4), [measure with `roc_auc`](Measure-with-yardstick.html) (Lesson 5), and [tune a model honestly](Tune-with-the-tune-package.html) (Lesson 6). We reuse that exact loan book here.

=== step === concept
::eyebrow Why you cannot just eyeball it
## One race, same rules for everyone

Here is the tempting, wrong way to compare three models: fit each one however is convenient, glance at a number for each, keep the biggest. It breaks in two quiet ways. First, if each model is scored on a **different** random split of the data, you are comparing how lucky each split was, not how good each model is. Second, if you score a model on the rows it trained on, the most flexible model always looks best because it can memorize, which is the overfitting trap you have met all course.

The fix is the same discipline you have built up lesson by lesson: judge every contender on **one shared set of cross-validation folds** with **one shared metric**. Same questions, same judges, same answer key. That is the entire idea behind a workflow set.

So we start exactly where Lesson 6 ended, the same loan book, the same split, the same five folds. Run this once to rebuild it in this session:

```r
library(rsample)

set.seed(7)
n <- 240
loans <- data.frame(
  income   = round(runif(n, 22000, 98000)),   # annual income, dollars
  age      = round(runif(n, 21, 60)),
  employed = round(runif(n, 2, 160)),          # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
risk <- with(loans, plogis(-1.1 + 1.4 * (income < 45000) +
             1.0 * (employed < 20) + 0.6 * (home == "rent")))
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"))
loans$defaulted <- relevel(loans$defaulted, ref = "yes")   # "yes" is the event we predict

set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)   # 179 rows to compare on
test  <- testing(split)    # 61 rows locked away for the final check
folds <- vfold_cv(train, v = 5, strata = defaulted)
```

[WARNING]
The test set stays sealed for the whole bake-off. Every model is compared using cross-validation on the **training** folds only. The locked test set is touched exactly once, at the very end, to confirm the single model you crowned. Use it to choose, and it stops being an honest estimate of new-data performance.

=== step === concept
::eyebrow The contenders
## Three honest candidates

A bake-off needs entries. We pick three models that fail in different ways, so the comparison is meaningful rather than three flavors of the same thing:

- **Logistic regression**, the simple linear baseline. If a fancy model cannot beat this, the complexity is not earning its keep.
- **A decision tree** at `tree_depth = 4`, the moderately shallow tree Lesson 6 tuned to. One tree, interpretable, a little unstable.
- **A random forest**, hundreds of trees averaged. More flexible, harder to interpret, usually steadier.

All three can share **one recipe**, the leak-free preprocessor from Lesson 1: turn the `home` factor into dummy columns and put the numeric predictors on a common scale. The recipe learns its scaling from each fold's training rows only, so nothing leaks.

```r
library(parsnip)
library(recipes)
library(workflows)
library(rpart)
library(randomForest)

rec <- recipe(defaulted ~ ., data = train) |>
  step_dummy(all_nominal_predictors()) |>
  step_normalize(all_numeric_predictors())

lr_spec   <- logistic_reg() |>
  set_engine("glm") |>
  set_mode("classification")

tree_spec <- decision_tree(tree_depth = 4) |>
  set_engine("rpart") |>
  set_mode("classification")

rf_spec   <- rand_forest(trees = 300) |>
  set_engine("randomForest") |>
  set_mode("classification")
```

Three model specs, one recipe. Next we hand them to a single object that will keep them all on the same footing.

=== step === tryit
::eyebrow Your turn
## Cross the recipe with the models

A **workflow set** is the cross product of your preprocessors and your models. With \(P\) preprocessors and \(M\) model specs you get \(P \times M\) ready-to-fit workflows, each a recipe paired with a model. Here \(P = 1\) and \(M = 3\), so the set holds three workflows; swap in two recipes and you would get six, every combination, without writing them out by hand.

`workflow_set` builds that table for you. You pass it a named list of preprocessors and a named list of models. Fill in the function name.

```r
library(workflowsets)

all_wf <- ____(
  preproc = list(base = rec),
  models  = list(logistic = lr_spec, tree = tree_spec, forest = rf_spec)
)
all_wf
```
::check {"regex":"workflow_set\\b","gate":true,"difficulty":"intermediate","ok":"Right. workflow_set crosses the one recipe with the three models into three workflows, named by joining the preprocessor and model names: base_logistic, base_tree, base_forest.","no":"Use workflow_set(preproc = ..., models = ...) to cross the preprocessors with the model specs."}
::solution
```r
library(workflowsets)

all_wf <- workflow_set(
  preproc = list(base = rec),
  models  = list(logistic = lr_spec, tree = tree_spec, forest = rf_spec)
)
all_wf
#> # A workflow set/tibble: 3 x 4
#>   wflow_id      info             option    result
#>   <chr>         <list>           <list>    <list>
#> 1 base_logistic <tibble [1 x 4]> <opts[0]> <list [0]>
#> 2 base_tree     <tibble [1 x 4]> <opts[0]> <list [0]>
#> 3 base_forest   <tibble [1 x 4]> <opts[0]> <list [0]>
```

Each row is one workflow, named `<preprocessor>_<model>`, with an empty `result` column waiting to be filled. Filling every one of those cells, fairly, is the next step.

=== step === widget
::eyebrow The whole bake-off in one call
## Map one scorer over every workflow

You already know how to resample one workflow: in Lesson 4, `fit_resamples` fit a workflow across the folds and recorded its metrics. `workflow_map` does that for **every** workflow in the set, on the **same** folds, with the **same** metrics, in a single call. The five-step picture below is the whole tournament.

::widget process-flow {"steps":[{"title":"Build the set","sub":"cross preprocessors with models into one object"},{"title":"Map over resamples","sub":"fit every workflow on the same folds, same metrics"},{"title":"Collect and rank","sub":"gather every score, rank the candidates"},{"title":"Pick the winner","sub":"pull the top workflow out of the set"},{"title":"Confirm once","sub":"last fit on the locked test set"}]}

You hand `workflow_map` the set, the name of the function to run on each workflow (`"fit_resamples"`), a `seed` so the folds are reused identically, and the same `resamples` and `metrics` arguments that function expects.

```r
library(tune)
library(yardstick)

res <- workflow_map(
  all_wf,
  "fit_resamples",
  seed      = 123,
  resamples = folds,                            # the SAME folds for all three
  metrics   = metric_set(roc_auc, accuracy)     # the SAME yardstick for all three
)
res
#> # A workflow set/tibble: 3 x 4
#>   wflow_id      info             option    result
#>   <chr>         <list>           <list>    <list>
#> 1 base_logistic <tibble [1 x 4]> <opts[1]> <rsmp[+]>
#> 2 base_tree     <tibble [1 x 4]> <opts[1]> <rsmp[+]>
#> 3 base_forest   <tibble [1 x 4]> <opts[1]> <rsmp[+]>
```

The `result` column now reads `<rsmp[+]>`: every workflow has been resampled and carries its scores. Three models, fifteen little fits (three workflows times five folds), one call. No copy-paste, and impossible to accidentally hand one model a different split.

=== step === quiz
::eyebrow Check yourself
## What makes the bake-off fair?

You want to crown the best of your three models honestly. Which setup makes the comparison fair?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Score every workflow on the same cross-validation folds with the same metric set ::ok Exactly. Identical folds and an identical metric mean any difference in score reflects the model, not a lucky split or a different yardstick. That is the one thing a workflow set guarantees for you.
- Fit each model on its own fresh random split so each gets an independent look at the data ::no Different splits make the scores incomparable: you would be measuring which split was easiest, not which model is best. A fair race needs one shared set of folds for everyone.
- Compare each model by its accuracy on the rows it was trained on ::no That is the overfitting trap. The most flexible model (the forest) can memorize the training rows and look best there while generalizing no better. Training-set scores cannot rank models honestly.

=== step === concept
::eyebrow Read the leaderboard
## Rank the contenders

The scores are in; now read them. `rank_results` flattens the whole set into one tidy leaderboard, one row per model per metric, sorted by the metric you name. `autoplot` draws the same thing as a ranked plot.

```r
library(ggplot2)

rank_results(res, rank_metric = "roc_auc")
#> # A tibble: 6 x 9
#>   wflow_id      .config        .metric   mean std_err     n model          rank
#>   <chr>         <chr>          <chr>    <dbl>   <dbl> <int> <chr>         <int>
#> 1 base_forest   pre0_mod0_pos~ accuracy 0.690  0.027     5 rand_forest       1
#> 2 base_forest   pre0_mod0_pos~ roc_auc  0.690  0.031     5 rand_forest       1
#> 3 base_logistic pre0_mod0_pos~ accuracy 0.664  0.018     5 logistic_reg      2
#> 4 base_logistic pre0_mod0_pos~ roc_auc  0.662  0.030     5 logistic_reg      2
#> 5 base_tree     pre0_mod0_pos~ accuracy 0.641  0.030     5 decision_tree     3
#> 6 base_tree     pre0_mod0_pos~ roc_auc  0.631  0.029     5 decision_tree     3

autoplot(res)
```

Read the leaderboard like a results table, not a verdict carved in stone. The random forest tops it, the logistic regression is a close second, and the single tree trails. The board below is that result, the report-ready view of those numbers:

::widget styled-table {"cols":["Rank","Model","ROC AUC","Accuracy"],"rows":[[1,"Random forest",0.69,0.69],[2,"Logistic regression",0.66,0.66],[3,"Decision tree",0.63,0.64]],"title":"Model bake-off, ranked by ROC AUC","note":"Mean over 5 cross-validation folds on the loan training set."}

[NOTE]
Look at `std_err` before you celebrate. The forest leads the logistic regression by about 0.03 ROC AUC, and each has a standard error near 0.03. On only 179 training rows the bands overlap, so the lead is real but slim. A ranking is the start of a decision, not the end: weigh it against interpretability and cost. Here the simple logistic regression is competitive enough that many lenders would prefer it for the explanation it gives a declined applicant.

=== step === quiz
::eyebrow Check yourself
## Which model do you crown?

On your leaderboard the random forest has the highest cross-validated ROC AUC, while the decision tree fits the training rows a touch harder. Which model do you finalize and take to the sealed test set?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The decision tree, since a tighter fit on the training rows means it has learned the data more thoroughly ::no A tighter training fit is the overfitting signature, not strength. The tree's honest cross-validated score is the lowest of the three, which is exactly why you resample instead of trusting the training fit.
- The random forest, because the cross-validated score is the honest estimate of new-data performance, and that is what you are choosing on ::ok Right. You crown on the cross-validated metric because it is your only fair read on unseen data. The forest's lead is slim, so it is fine to weigh interpretability too, but on score alone the forest wins.
- Run all three on the locked test set and keep whichever scores highest there ::no That spends the test set three times. Once you pick the candidate that won on the test rows, the choice has seen them, and the test score is no longer an honest estimate. The test set votes exactly once, on the model you already chose.

=== step === tryit
::eyebrow Close it out
## Crown the winner and confirm

You picked the random forest. Two moves finish the job. `extract_workflow` pulls that workflow back out of the set by its id (`base_forest`). Then `last_fit` does the honest finish you learned in Lesson 6: it trains the winner on the **full** training set and scores it once on the test set you sealed away in step 2. Fill in the function that does that final fit.

```r
final_wf  <- extract_workflow(all_wf, id = "base_forest")
final_fit <- ____(final_wf, split, metrics = metric_set(roc_auc, accuracy))
collect_metrics(final_fit)
```
::check {"regex":"last_fit\\b","gate":true,"difficulty":"intermediate","ok":"That is the finish. last_fit trains the winning workflow on the whole training set and gives you the first and only test-set score. If it lands near the cross-validated 0.69, your bake-off was honest.","no":"Use last_fit(final_wf, split, ...): it fits on the full training data and scores once on the locked test set inside split."}
::solution
```r
final_wf  <- extract_workflow(all_wf, id = "base_forest")
final_fit <- last_fit(final_wf, split, metrics = metric_set(roc_auc, accuracy))
collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric  .estimator .estimate .config
#>   <chr>    <chr>          <dbl> <chr>
#> 1 accuracy binary         0.672 pre0_mod0_post0
#> 2 roc_auc  binary         0.668 pre0_mod0_post0
```

The test-set ROC AUC (0.668) lands right beside the cross-validated estimate (0.690), close enough to trust. That agreement is the payoff of doing the whole comparison on sealed folds: the number you reported is the number you got.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [workflowsets package documentation (tidymodels)](https://workflowsets.tidymodels.org/) - the reference for `workflow_set()`, `workflow_map()`, `rank_results()`, and `extract_workflow()`.
- [Tidy Modeling with R, ch. 15: Screening many models](https://www.tmwr.org/workflow-sets) - Kuhn and Silge on building and comparing whole sets of model-and-recipe combinations.
- [Get Started with tidymodels](https://www.tidymodels.org/start/) - the official walk-through of the pieces (recipes, parsnip, workflows, resampling, tuning) this lesson composes.
- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - resampling and model selection, the statistics under the bake-off.

=== step === complete
## Lesson 7 complete

You ran a real model bake-off. You stood up three honest contenders on a shared recipe, crossed them into one workflow set, scored every one of them across the same five folds with the same metrics in a single `workflow_map` call, read the ranked leaderboard, crowned the winner on its cross-validated score (while keeping an eye on the slim margin and interpretability), and confirmed it once on the test set you had sealed all along.

That completes the tidymodels course. You can now take a modeling problem from a raw data frame to a defensible chosen model: a leak-free recipe (Lesson 1), a model spec you can swap engines on (Lesson 2), the two bundled into a workflow (Lesson 3), honest scores from resampling (Lesson 4), the right metric to read them (Lesson 5), tuned hyperparameters (Lesson 6), and a fair comparison that picks the winner (here). Head back to the [course page](R-tidymodels-Course.html) to claim your certificate and see where this fits in the Data Scientist track.

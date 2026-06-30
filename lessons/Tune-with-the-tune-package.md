---
title: "tidymodels Lesson 6: Tune with the tune package"
catalog_blurb: "How to find the model settings that work best, without fooling yourself."
description: "Search hyperparameters the honest way with the tune package: build a grid, score every candidate across resampling folds, pick the winner, and finalize your R workflow."
keywords: "tune package R, hyperparameter tuning in R, tune_grid, grid search, tidymodels, cross-validation tuning, decision tree cost_complexity tree_depth, select_best, finalize_workflow, last_fit"
post_type: "LESSON"
curriculum_id: "6.50.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "6"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Compare-Many-Models-with-workflowsets.html"
course_prev: "Measure-with-yardstick.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Tune with the tune package

In Lesson 5 you built a fair yardstick for the lender's loan-default model: precision, recall, ROC AUC, read across your resampling folds. A trustworthy scorer is exactly what you have been missing to do the one thing this course has carefully avoided so far, which is to **choose** between models.

Here is the catch that makes choosing hard. Every model has a complexity dial. Turn it too low and the model is too simple to see the real pattern (it underfits). Turn it too high and the model memorizes the noise in your training data (it overfits). Somewhere in between is a sweet spot, and you cannot see it by eye. Drag the slider below and watch the test error trace its tell-tale U.

::widget bias-variance {}

By the end of this lesson you will be able to:

- Tell a **parameter** (learned from the data) from a **hyperparameter** (a dial you set before fitting), and name a decision tree's two dials
- Build a grid of candidate settings and score every one of them across resampling folds with `tune_grid`
- Read the results, pick the winner, and finalize your workflow, then confirm it once on a test set you never touched

**Prerequisites:** you can run R and use the `|>` pipe, and from earlier lessons you can [bundle a model into a workflow](Bundle-Steps-with-workflows.html) (Lesson 3), [score it across cross-validation folds](Resample-with-rsample.html) (Lesson 4), and [measure it with `roc_auc`](Measure-with-yardstick.html) (Lesson 5). We reuse that exact loan book here.

=== step === concept
::eyebrow The thing you actually set
## A model with dials to turn

Until now the loan model has been a logistic regression, and there was nothing to tune. Its coefficients are **parameters**: numbers the fitting routine *learns* straight from the data. You never pick them by hand.

A **hyperparameter** is different. It is a setting you choose *before* fitting, one that shapes how the model learns. The fitting routine cannot learn it for you, because changing it changes what "best fit" even means. Think of baking: the oven temperature is a hyperparameter you dial in beforehand, and the cake that comes out is the parameter the oven "fits" at that temperature. Set the temperature wrong and no amount of baking saves the cake.

To see tuning actually bite, we need a model with real dials. A **decision tree** has two. Same loan data, new model.

::widget tree-diagram {"root":"income under $45k?","l":"employed under 20 mo?","r":"home is rent?","leaves":["defaults","pays","defaults","pays"]}

- **`tree_depth`** \((d)\): how many questions deep any path through the tree may go. A depth-1 tree asks one question; a depth-8 tree can ask eight in a row and carve the data into tiny pockets.
- **`cost_complexity`** \((\alpha)\): how reluctant the tree is to add another split. A tree is scored by \(R_\alpha(T) = R(T) + \alpha\,|T|\), where \(R(T)\) is its error on the training rows, \(|T|\) is its number of leaves, and \(\alpha\) is a price charged per leaf. A large \(\alpha\) makes extra leaves expensive, so the tree stays small; a tiny \(\alpha\) lets it grow freely.

Both dials control the same thing the slider above did: model complexity. In tidymodels, you mark a dial as "to be decided" by setting it to `tune()`, a placeholder that leaves the value blank for now.

```r
library(parsnip)
library(rpart)
library(workflows)

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
table(loans$defaulted)
#>
#> yes  no
#>  89 151

tree_spec <- decision_tree(
  cost_complexity = tune(),     # alpha: the price per leaf, left blank to tune
  tree_depth      = tune()      # d: the maximum depth, left blank to tune
) |>
  set_engine("rpart") |>
  set_mode("classification")

tree_wf <- workflow() |>
  add_formula(defaulted ~ .) |>
  add_model(tree_spec)
tree_spec
#> Decision Tree Model Specification (classification)
#>
#> Main Arguments:
#>   cost_complexity = tune()
#>   tree_depth = tune()
#>
#> Computational engine: rpart
```

A tree splits on raw values, so it needs no scaling or dummy variables; we hand the workflow the formula directly instead of a recipe. The spec now has two holes in it. Tuning is the business of filling them.

=== step === concept
::eyebrow Set up an honest scorer
## Score every candidate the honest way

You have a model with two blanks. The obvious move, fit a few trees and keep whichever looks best, hides a trap you already met in Lesson 4: a single number from a single split is a roll of the dice, and the deepest tree always wins on the data it trained on. So you score each candidate setting the way you learned to score any model honestly, by **cross-validation**.

First carve off a final test set and lock it away. Then make the folds out of the **training** part only. Every candidate will be judged by its average score across these folds; the locked test set is not allowed to vote.

```r
library(rsample)

set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)   # 179 rows to tune on
test  <- testing(split)    # 61 rows locked away for the final check

folds <- vfold_cv(train, v = 5, strata = defaulted)
folds
#>  5-fold cross-validation using stratification
#> # A tibble: 5 x 2
#>   splits           id
#>   <list>           <chr>
#> 1 <split [142/37]> Fold1
#> 2 <split [143/36]> Fold2
#> 3 <split [143/36]> Fold3
#> 4 <split [144/35]> Fold4
#> 5 <split [144/35]> Fold5
```

[WARNING]
The test set is sacred. The moment you use it to *choose* settings, it stops being an honest estimate of new-data performance, because the choice has now seen it. Tuning happens entirely inside the training folds; the test set is touched exactly once, at the very end, to confirm the model you already picked.

=== step === quiz
::eyebrow Check yourself
## How do you pick the best settings?

You will end up with nine candidate trees, each with different `tree_depth` and `cost_complexity`. How should you decide which settings are best?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Fit each one on the full training data and keep the tree with the highest training accuracy ::no That is the overfitting trap. The deepest, least-penalized tree always scores highest on the rows it trained on, because it can memorize them. Training accuracy cannot tell good settings apart from settings that just overfit.
- Score each candidate by cross-validation on the training folds and keep the best average, leaving the test set untouched ::ok Exactly. The cross-validated score is an honest estimate of how each setting performs on data it has not seen, and that is the only fair basis for choosing. The test set stays sealed for the final check.
- Fit each on the training data, score all nine on the test set, and keep the test-set winner ::no That spends the test set nine times. Once you pick the candidate that scored best on the test rows, the choice has seen them, so its test score is no longer an honest read on new data. You have leaked the test set into the decision.

=== step === concept
::eyebrow The menu of candidates
## A grid of settings to try

A **grid** is just the list of hyperparameter combinations you want to try. For each dial you pick a few values, then take every pairing. With \(L\) values per dial and \(p\) dials, a regular grid has \(L^p\) points. Two dials at three values each gives \(3^2 = 9\) candidate trees.

`grid_regular` from the `dials` package builds that menu for you. It knows sensible ranges for each hyperparameter, so you only say how many levels you want.

```r
library(dials)
library(tune)

tree_grid <- grid_regular(
  cost_complexity(),
  tree_depth(range = c(1L, 8L)),
  levels = 3
)
nrow(tree_grid)
#> [1] 9
tree_grid
#> # A tibble: 9 x 2
#>   cost_complexity tree_depth
#>             <dbl>      <int>
#> 1    0.0000000001          1
#> 2    0.0000031600          1
#> 3    0.1000000000          1
#> 4    0.0000000001          4
#> 5    0.0000031600          4
#> 6    0.1000000000          4
#> 7    0.0000000001          8
#> 8    0.0000031600          8
#> 9    0.1000000000          8
```

Read the two extremes and you can already predict the U-curve. The trees with `cost_complexity = 0.1` are so heavily penalized they barely split (near the underfit end); the deep, barely-penalized trees (`tree_depth = 8`, tiny `cost_complexity`) split until they memorize (the overfit end). The honest winner should sit somewhere in the middle.

=== step === concept
::eyebrow Run the search
## Fit every candidate on every fold

This is the whole machine, in one picture. `tune_grid` walks the grid, and for each of the nine candidates it runs your workflow across all five folds, records the metrics, and moves on. Nine candidates times five folds is 45 little fits, and `tune_grid` does the bookkeeping.

::widget process-flow {"steps":[{"title":"Set the grid","sub":"list the hyperparameter combinations to try"},{"title":"Resample","sub":"split the training data into cross-validation folds"},{"title":"Fit and score","sub":"train every candidate on every fold, score on its holdout"},{"title":"Collect","sub":"average each candidate score across the folds"},{"title":"Select and finalize","sub":"keep the best settings, lock them into the workflow"}]}

You hand `tune_grid` the same three things `fit_resamples` took in Lesson 4, plus one more: the grid of candidates to try.

```r
library(yardstick)

set.seed(123)
tree_res <- tune_grid(
  tree_wf,                                       # the workflow with two blanks
  resamples = folds,                             # the folds to score on
  grid      = tree_grid,                         # the nine candidates
  metrics   = metric_set(roc_auc, accuracy)      # how to score each one
)
collect_metrics(tree_res)
#> # A tibble: 18 x 8
#>   cost_complexity tree_depth .metric  .estimator  mean     n std_err .config
#>             <dbl>      <int> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1    0.0000000001          1 accuracy binary     0.626     5 0.00556 pre0_mod1_post0
#> 2    0.0000000001          1 roc_auc  binary     0.567     5 0.0299  pre0_mod1_post0
#> 3    0.0000000001          4 accuracy binary     0.654     5 0.0252  pre0_mod4_post0
#> 4    0.0000000001          4 roc_auc  binary     0.655     5 0.0301  pre0_mod4_post0
#> # i 14 more rows
```

`collect_metrics` gives one row per candidate per metric: its mean across the five folds and the standard error of that mean. Eighteen rows because nine candidates times two metrics. That table is the entire search, laid out for you to read.

=== step === concept
::eyebrow Read the results, pick a winner
## Which settings actually won?

You rarely want to eyeball eighteen rows. `show_best` sorts by a metric and hands you the top few, and `select_best` returns just the single winning row, ready to plug back into the model.

```r
library(ggplot2)

show_best(tree_res, metric = "roc_auc", n = 5)
#> # A tibble: 5 x 8
#>   cost_complexity tree_depth .metric .estimator  mean     n std_err .config
#>             <dbl>      <int> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1    0.0000000001          4 roc_auc binary     0.655     5  0.0301 pre0_mod4_post0
#> 2    0.0000031600          4 roc_auc binary     0.655     5  0.0301 pre0_mod5_post0
#> 3    0.0000000001          8 roc_auc binary     0.631     5  0.0288 pre0_mod7_post0
#> 4    0.0000031600          8 roc_auc binary     0.631     5  0.0288 pre0_mod8_post0
#> 5    0.1000000000          1 roc_auc binary     0.500     5  0.0000 pre0_mod3_post0

best_tree <- select_best(tree_res, metric = "roc_auc")
best_tree
#> # A tibble: 1 x 3
#>   cost_complexity tree_depth .config
#>             <dbl>      <int> <chr>
#> 1    0.0000000001          4 pre0_mod4_post0
```

The honest winner is a **moderately shallow** tree, not the deepest one. The depth-8 trees fit the training rows harder but score lower across the folds, and the heavily-penalized stump (`cost_complexity = 0.1`) collapses to an AUC of 0.5, no better than a coin flip. That is the cover's U-curve, made of real numbers. `autoplot` draws it straight from the results: ROC AUC against tree depth, one line per cost_complexity.

```r
autoplot(tree_res)
```

=== step === quiz
::eyebrow Check yourself
## Deepest fit versus best score

In your results, the deepest tree (`tree_depth = 8`) fits the training rows harder, but a shallower tree (`tree_depth = 4`) has the higher cross-validated ROC AUC. Which settings do you finalize?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Depth 8, because it fits the training data best, so it must be the stronger model ::no A better fit on the training rows is the overfitting signature, not strength. A deeper tree carves the training data into tiny pockets it memorizes, which is exactly why its honest cross-validated score drops. That is the right-hand side of the cover's U-curve.
- Depth 4, because the best cross-validated score is the honest estimate of new-data performance, and that is what you are choosing on ::ok Right. You are choosing the settings that generalize best, and the cross-validated score is your only fair read on that. The deeper tree's training advantage does not survive contact with held-out data.
- Neither; average the two depths and use a depth-6 tree to split the difference ::no You cannot average tree depths into a model, and there is no reason to want to. The cross-validated scores already tell you depth 4 generalizes better, so you pick it outright.

=== step === tryit
::eyebrow Your turn
## Finalize and confirm

You have the winning settings in `best_tree`. The last two moves: `finalize_workflow` plugs those settings into the workflow's two blanks, and `last_fit` does the honest finish, it trains the finalized tree on the **full** training set and scores it once on the test set you locked away in step 3. Fill in the settings to plug in.

```r
final_wf  <- finalize_workflow(tree_wf, ____)   # plug the winning settings into the workflow
final_fit <- last_fit(final_wf, split, metrics = metric_set(roc_auc, accuracy))
collect_metrics(final_fit)
```
::check {"regex":"best_tree","gate":true,"difficulty":"intermediate","ok":"That is the finish: finalize_workflow fills the two blanks with best_tree, and last_fit gives you the first and only test-set score. If it lands near your cross-validated number, your tuning was honest.","no":"Plug in the winning settings you selected: finalize_workflow(tree_wf, best_tree)."}
::solution
```r
final_wf  <- finalize_workflow(tree_wf, best_tree)
final_fit <- last_fit(final_wf, split, metrics = metric_set(roc_auc, accuracy))
collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric  .estimator .estimate .config
#>   <chr>    <chr>          <dbl> <chr>
#> 1 roc_auc  binary         0.641 pre0_mod0_post0
#> 2 accuracy binary         0.656 pre0_mod0_post0
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [tune package documentation (tidymodels)](https://tune.tidymodels.org/) - the reference for `tune()`, `tune_grid()`, `show_best()`, `select_best()`, `finalize_workflow()`, and `last_fit()`.
- [Tidy Modeling with R, ch. 13: Grid search](https://www.tmwr.org/grid-search) - Kuhn and Silge on regular versus space-filling grids and how to read tuning results.
- [Get Started: Tune model parameters (tidymodels)](https://www.tidymodels.org/start/tuning/) - the official end-to-end walk-through that tunes a decision tree, the same model you tuned here.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - decision trees, cost-complexity pruning, and the bias-variance reason tuning matters at all.

=== step === complete
## Lesson 6 complete

You can now tune a model honestly. You told a learned parameter from a hyperparameter you set, marked a tree's dials with `tune()`, built a grid of candidates, scored every one of them across resampling folds with `tune_grid`, read the results with `collect_metrics` and `show_best`, picked the winner with `select_best`, and closed the loop with `finalize_workflow` and a single `last_fit` on the test set you had kept sealed all along. That sealed-test-set discipline is the difference between a model you tuned and a model you fooled yourself into liking.

Next, Lesson 7: Compare many models with workflowsets. You tuned one model here. In real projects you have several candidates, a tree, a penalized regression, a boosted ensemble, and you want to tune and compare them all on the same footing, then crown a winner. `workflowsets` runs that whole bake-off for you.

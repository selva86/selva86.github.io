---
title: "tidymodels Lesson 6: Tune with the tune package"
catalog_blurb: "Search a model's settings with resampling and lock in the best."
description: "Tune a model's hyperparameters in R with the tune package: mark settings with tune(), search a grid across resampling folds with tune_grid, then select the best and finalize."
keywords: "tune package R, tune_grid, hyperparameter tuning R, tidymodels tuning, grid_regular, select_best, finalize_workflow, last_fit, decision tree tuning, cost_complexity tree_depth"
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

In Lesson 5 the loan-default model left us with an uncomfortable number: a cross-validated recall of about **0.26**, meaning it caught barely a quarter of the applicants who actually defaulted. One honest response is to reach for a more flexible model. A **decision tree** can carve the loan book into regions of high and low risk that a straight-line logistic regression cannot.

But a tree comes with settings you have to choose: how deep it may grow, how hard it gets pruned back. Set them wrong and the tree either memorizes the training rows (and stumbles on new applicants) or collapses to a useless stump. The picture below is that whole problem in one shape. As a model grows more complex, error on the training data keeps falling, but error on fresh data traces a **U**: too simple on the left, too flexible on the right, with a sweet spot in between. Drag the slider and watch the two curves separate.

Tuning is how you find that sweet spot on purpose instead of guessing. The `tune` package searches a menu of candidate settings, scores each one honestly with the resampling from Lesson 4, and hands you the best.

::widget bias-variance {}

By the end of this lesson you will be able to:

- Tell a **parameter** the model learns from a **hyperparameter** you set, and name a tree's two knobs
- Mark hyperparameters with `tune()` and lay out a grid of candidate settings
- Run a grid search across cross-validation folds with `tune_grid()`, scored by a metric set
- Read the results, select the best settings, finalize the workflow, and confirm it once on a sealed test set

**Prerequisites:** you can run R and use the `|>` pipe, and from earlier lessons you can [bundle a recipe and model into a workflow](Bundle-Steps-with-workflows.html) (Lesson 3), [score across cross-validation folds](Resample-with-rsample.html) (Lesson 4), and [measure with `roc_auc` and a metric set](Measure-with-yardstick.html) (Lesson 5). We work from that same lender's loan book here.

=== step === concept
::eyebrow The knobs you set
## A model with knobs to turn

Logistic regression had nothing to tune: you hand it the data, it estimates one slope per predictor, and that is that. A decision tree is different. It **learns** where to split (is income under 45k? is the job under two years old?), but you must **tell it in advance** how far it is allowed to go. Here is a small loan tree so the picture is concrete: each box asks one yes-or-no question, and each leaf at the bottom is a final verdict, default or repay.

::widget tree-diagram {"root":"income under 45k?","l":"job under 24 mo?","r":"a renter?","leaves":["default","repay","default","repay"]}

Those settings you fix in advance are the tree's hyperparameters, and a tree has two that matter most:

- **`tree_depth`**: the most questions the tree may ask along any path from top to bottom. A depth of 2 asks at most two questions before deciding; a depth of 12 can ask twelve, carving the loan book into far finer regions.
- **`cost_complexity`**: how much the tree is punished for having many leaves, which prunes it back. rpart grows a tree by minimizing

\[ R_\alpha(T) = R(T) + \alpha \lvert T \rvert \]

where \(R(T)\) is how often tree \(T\) misclassifies a training applicant, \(\lvert T \rvert\) is the number of leaves (the final risk buckets), and \(\alpha\) is `cost_complexity`. A big \(\alpha\) makes every extra leaf expensive, so the tree stays small; an \(\alpha\) near zero lets it grow almost without limit.

The distinction is not academic; the knob genuinely changes the tree. Rebuild the lender's loan book here so the page runs on its own. Each row is one applicant, and `defaulted` (yes or no) is what we predict, with **yes** as the first factor level so it stays the class we care about catching. We also split off a quarter of the book as a test set right now, and do not touch it again until the final step.

```r
library(dplyr)
library(rsample)
set.seed(7)
n <- 500
loans <- data.frame(
  income   = round(runif(n, 20000, 100000)),   # annual income, dollars
  age      = round(runif(n, 21, 65)),
  employed = round(runif(n, 1, 200)),           # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
z <- 3.4 - 4.8 * (loans$income / 1e5) - 2.0 * (loans$employed / 200) +
     0.8 * (loans$home == "rent") - 0.5 * (loans$age / 65)
loans$defaulted <- factor(ifelse(runif(n) < plogis(z), "yes", "no"),
                          levels = c("yes", "no"))

set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)   # 374 applicants we tune on
test  <- testing(split)    # 126 sealed away until the very end
table(loans$defaulted)
#>
#> yes  no
#> 202 298
```

Of 500 applicants, **202 defaulted** and 298 repaid. Now grow two trees on the training applicants, one with pruning switched off and one with it turned up, and count how many leaves each ends up with:

```r
library(rpart)
n_leaves <- function(fit) sum(fit$frame$var == "<leaf>")

overgrown <- rpart(defaulted ~ ., data = train, cp = 0,    minsplit = 2)  # no pruning
pruned    <- rpart(defaulted ~ ., data = train, cp = 0.05)                # heavy pruning
c(overgrown = n_leaves(overgrown), pruned = n_leaves(pruned))
#> overgrown    pruned
#>        93         2
```

Same data, same algorithm, one setting changed. The overgrown tree splits the 374 training applicants into **93** tiny buckets (it has all but memorized them); the pruned tree keeps just **2**. Neither is likely the right tree for judging a brand-new applicant. That single hyperparameter, `cost_complexity`, swung the model from one extreme to the other. Choosing well between those extremes is exactly what tuning does.

=== step === quiz
::eyebrow Check yourself
## Parameter or hyperparameter?

The loan tree learned, from the data, that its first split should be "is income under 45k?". Separately, before fitting, you decided the tree may grow to a depth of 7. Which of those two is the hyperparameter?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The split "income under 45k", because the tree chose that threshold ::no That threshold is a **parameter**: the tree learned it from the training data, the way logistic regression learns a slope. You did not set it by hand.
- The depth limit of 7, because you fixed it before the tree ever saw the data ::ok Right. A hyperparameter is a setting you choose in advance; the fitting algorithm then works within it. tree_depth and cost_complexity are hyperparameters, while the split thresholds the tree finds are parameters.
- Neither, because a decision tree works out its own best depth from the data ::no That is the tempting trap. Left alone, rpart just uses default settings; it does not search for the depth that will generalize best. Finding that is the whole job of tuning.

=== step === widget
::eyebrow The whole loop at a glance
## Six moves, start to finish

Before the details, here is the shape of the entire lesson. Tuning is always the same six moves: mark the knobs you want searched, list the candidate settings, cut the training data into folds, score every candidate on every fold, keep the best, and confirm the winner once on the sealed test set. Everything that follows just fills in one box at a time.

::widget process-flow {"steps":[{"title":"Mark","sub":"flag each knob to search with tune()"},{"title":"Grid","sub":"list the candidate settings to try"},{"title":"Resample","sub":"cut the training data into cross-validation folds"},{"title":"Score","sub":"fit every candidate on every fold, keep the metric"},{"title":"Select","sub":"take the settings with the best resampled score"},{"title":"Confirm","sub":"finalize, then score once on the sealed test set"}]}

=== step === concept
::eyebrow Moves 1 and 2 begin
## Mark the knobs with tune()

To search a hyperparameter instead of fixing it, you write `tune()` in its place. It is a placeholder that says "leave this blank for now; we will fill it from the grid later." Here we mark both tree knobs as tunable, then wrap the spec in a workflow exactly as in Lesson 3, pairing it with a recipe. A tree needs no normalizing or dummy variables (rpart handles raw numbers and factors itself), so the recipe is just the formula.

```r
library(parsnip)
library(tune)
library(recipes)
library(workflows)

tree_spec <- decision_tree(
  cost_complexity = tune(),
  tree_depth      = tune()
) |>
  set_engine("rpart") |>
  set_mode("classification")

tree_wf <- workflow() |>
  add_model(tree_spec) |>
  add_recipe(recipe(defaulted ~ ., data = train))

tree_spec
#> Decision Tree Model Specification (classification)
#>
#> Main Arguments:
#>   cost_complexity = tune()
#>   tree_depth = tune()
#>
#> Computational engine: rpart
```

Printing the spec shows both arguments held open at `tune()`. The workflow is now a template with two blanks in it; the search will stamp out a filled-in copy for every candidate setting.

=== step === concept
::eyebrow Move 2: the candidate menu
## Lay out the grid of settings

A **grid** is just the list of candidate settings to try. `grid_regular()` builds a regular one: hand it the parameter objects from the `dials` package and how many `levels` of each to space out, and it returns every combination. With two knobs at three levels each, that is \(3^2 = 9\) candidates.

```r
library(dials)
tree_grid <- grid_regular(
  cost_complexity(),
  tree_depth(range = c(2, 12)),
  levels = 3
)
tree_grid
#> # A tibble: 9 x 2
#>   cost_complexity tree_depth
#>             <dbl>      <int>
#> 1    0.0000000001          2
#> 2    0.00000316            2
#> 3    0.1                   2
#> 4    0.0000000001          7
#> 5    0.00000316            7
#> 6    0.1                   7
#> 7    0.0000000001         12
#> 8    0.00000316           12
#> 9    0.1                  12
```

Each parameter object knows its own sensible range. `cost_complexity()` sweeps from almost no pruning (0.0000000001) up to heavy pruning (0.1) on a log scale; `tree_depth(range = c(2, 12))` spaces depths from a shallow 2 to a deep 12. Nine rows, nine trees to try.

[NOTE]
More candidates means a finer search but more fitting. The count grows fast: two knobs at five levels is \(5^2 = 25\) candidates, and three knobs would be \(5^3 = 125\). Start coarse, then zoom in around the promising region.

=== step === tryit
::eyebrow Your turn
## Make the search finer

Three levels per knob is coarse. Rebuild the grid with **5** levels of each, so the search tries more candidate depths and penalties. How many candidates does that make?

```r
library(dials)
finer_grid <- grid_regular(
  cost_complexity(),
  tree_depth(range = c(2, 12)),
  levels = ____
)
nrow(finer_grid)
```
::check {"regex":"levels\\s*=\\s*5","gate":true,"difficulty":"beginner","ok":"Yes: five levels of two knobs is 5^2 = 25 candidates. Each one still has to be scored on every fold, so a finer grid costs more compute, the trade you are always managing.","no":"Set levels = 5. With two knobs that gives 5^2 = 25 candidate settings."}
::solution
```r
finer_grid <- grid_regular(
  cost_complexity(),
  tree_depth(range = c(2, 12)),
  levels = 5
)
nrow(finer_grid)
#> [1] 25
```

=== step === concept
::eyebrow Moves 3 and 4: score every candidate
## Search across the folds with tune_grid()

Now the honest part. We do not score the nine candidates on the training data as a whole (the overgrown tree would win by memorizing it), and we certainly do not peek at the sealed test set. Instead we reuse the cross-validation from Lesson 4: cut the training applicants into 5 folds, and score every candidate on every fold. `tune_grid()` does all of it, taking the workflow, the folds, the grid, and the metric set from Lesson 5.

```r
library(yardstick)
set.seed(3)
folds <- vfold_cv(train, v = 5, strata = defaulted)

tree_metrics <- metric_set(roc_auc, accuracy)

set.seed(4)
tree_res <- tune_grid(
  tree_wf,
  resamples = folds,
  grid      = tree_grid,
  metrics   = tree_metrics
)
tree_res
#> # Tuning results
#> # 5-fold cross-validation using stratification
#> # A tibble: 5 x 4
#>   splits           id    .metrics          .notes
#>   <list>           <chr> <list>            <list>
#> 1 <split [298/76]> Fold1 <tibble [18 x 6]> <tibble [0 x 4]>
#> 2 <split [299/75]> Fold2 <tibble [18 x 6]> <tibble [0 x 4]>
#> 3 <split [299/75]> Fold3 <tibble [18 x 6]> <tibble [0 x 4]>
#> 4 <split [300/74]> Fold4 <tibble [18 x 6]> <tibble [0 x 4]>
#> 5 <split [300/74]> Fold5 <tibble [18 x 6]> <tibble [0 x 4]>
```

That one call fitted a lot of trees. Nine candidate settings, each trained and scored on all 5 folds, is \(9 \times 5 = 45\) tree fits. Each row above is one fold; its `.metrics` holds an 18-row tibble (9 candidates times 2 metrics). tune keeps every score so we can average them next.

[WARNING]
Never tune on the test set. If you tried all nine candidates on `test` and kept the best, that final score would be optimistic: you would have fitted your choice of settings to the very data meant to give an unbiased estimate. The test set earns its keep only by staying sealed until the end. Candidates are judged on the training folds, full stop.

=== step === quiz
::eyebrow Check yourself
## Where do candidates get scored?

You have nine candidate settings for the loan tree. To decide which is best, where should each one be scored?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- On the cross-validation folds of the training data, averaging each candidate's score across the folds ::ok Exactly. Resampling gives every candidate an honest estimate of how it does on data it was not fitted to, and it never touches the sealed test set.
- On the sealed test set, keeping whichever candidate scores highest ::no That leaks the test set. Once you have used it to choose settings, it can no longer give an unbiased final score; you have tuned to it. Keep it sealed until the very end.
- On the full training set, keeping whichever candidate fits it best ::no The most complex candidate always fits the training data best (the overgrown 93-leaf tree memorized it). Training fit rewards overfitting, which is the opposite of what you want.

=== step === concept
::eyebrow Reading the scoreboard
## Collect and rank the results

`collect_metrics()` averages each candidate's score across the 5 folds and pairs it with a standard error, so you see both the typical performance and how much it wobbled fold to fold.

```r
collect_metrics(tree_res)
#> # A tibble: 18 x 8
#>    cost_complexity tree_depth .metric  .estimator  mean     n std_err .config
#>              <dbl>      <int> <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#>  1    0.0000000001          2 accuracy binary     0.660     5  0.0111 pre0_mod1...
#>  2    0.0000000001          2 roc_auc  binary     0.652     5  0.0205 pre0_mod1...
#>  3    0.0000000001          7 accuracy binary     0.671     5  0.0197 pre0_mod2...
#>  4    0.0000000001          7 roc_auc  binary     0.723     5  0.0218 pre0_mod2...
#>  5    0.0000000001         12 accuracy binary     0.671     5  0.0197 pre0_mod3...
#>  6    0.0000000001         12 roc_auc  binary     0.723     5  0.0218 pre0_mod3...
#>  7    0.00000316            2 accuracy binary     0.660     5  0.0111 pre0_mod4...
#>  8    0.00000316            2 roc_auc  binary     0.652     5  0.0205 pre0_mod4...
#>  9    0.00000316            7 accuracy binary     0.671     5  0.0197 pre0_mod5...
#> 10    0.00000316            7 roc_auc  binary     0.723     5  0.0218 pre0_mod5...
#> 11    0.00000316           12 accuracy binary     0.671     5  0.0197 pre0_mod6...
#> 12    0.00000316           12 roc_auc  binary     0.723     5  0.0218 pre0_mod6...
#> 13    0.1                   2 accuracy binary     0.687     5  0.0196 pre0_mod7...
#> 14    0.1                   2 roc_auc  binary     0.651     5  0.0197 pre0_mod7...
#> 15    0.1                   7 accuracy binary     0.687     5  0.0196 pre0_mod8...
#> 16    0.1                   7 roc_auc  binary     0.651     5  0.0197 pre0_mod8...
#> 17    0.1                  12 accuracy binary     0.687     5  0.0196 pre0_mod9...
#> 18    0.1                  12 roc_auc  binary     0.651     5  0.0197 pre0_mod9...
```

Eighteen rows: one per candidate per metric. Rather than squint at all of them, ask `show_best()` for the top candidates by the metric you care about, `roc_auc`:

```r
show_best(tree_res, metric = "roc_auc")
#> # A tibble: 5 x 8
#>   cost_complexity tree_depth .metric .estimator  mean     n std_err .config
#>             <dbl>      <int> <chr>   <chr>      <dbl> <int>   <dbl> <chr>
#> 1    0.0000000001          7 roc_auc binary     0.723     5  0.0218 pre0_mod2...
#> 2    0.0000000001         12 roc_auc binary     0.723     5  0.0218 pre0_mod3...
#> 3    0.00000316            7 roc_auc binary     0.723     5  0.0218 pre0_mod5...
#> 4    0.00000316           12 roc_auc binary     0.723     5  0.0218 pre0_mod6...
#> 5    0.0000000001          2 roc_auc binary     0.652     5  0.0205 pre0_mod1...
```

The best cross-validated **roc_auc is 0.723**, reached at depth 7 (the tiny cost_complexity values barely prune, so depth is doing the work here). Growing to depth 12 scores identically: on just 374 training rows the tree runs out of useful splits well before 12, so the extra allowance is never used. And you can see the whole search surface at a glance:

```r
autoplot(tree_res)
```

[KEY INSIGHT]
Look back at the full table. The heavily pruned candidates (cost_complexity 0.1) post the **highest accuracy, 0.687**, yet the **lowest roc_auc, 0.651**. Pruning that hard leaves only a couple of broad buckets that lean "no default", which scores well on accuracy where most applicants really do repay, but such a coarse tree barely separates risk, so its ranking is the worst of the lot. Because Lesson 5 taught us to judge this model by roc_auc, tuning correctly prefers the depth-7 tree despite its lower accuracy. Tune for the metric that matches your decision, or you will optimize the wrong thing.

=== step === tryit
::eyebrow Move 5: lock in the winner
## Select the best, then finalize

The search is done; now collect its verdict. `select_best()` pulls the single top-scoring candidate out of the results as a one-row tibble of settings. Fill in the function, keyed to `roc_auc`:

```r
best_tree <- ____(tree_res, metric = "roc_auc")
best_tree
```
::check {"regex":"select_best\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That is it: select_best returns the winning settings (cost_complexity 1e-10, tree_depth 7). Next you stamp them into the workflow.","no":"Use select_best(tree_res, metric = \"roc_auc\"): it returns the single candidate with the best cross-validated roc_auc."}
::solution
```r
best_tree <- select_best(tree_res, metric = "roc_auc")
best_tree
#> # A tibble: 1 x 3
#>   cost_complexity tree_depth .config
#>             <dbl>      <int> <chr>
#> 1    0.0000000001          7 pre0_mod2_post0
```

Those winning settings are still just numbers in a tibble. `finalize_workflow()` stamps them into the tunable workflow, replacing each `tune()` blank with its chosen value and returning a concrete workflow, ready to fit:

```r
final_wf <- finalize_workflow(tree_wf, best_tree)
```

`final_wf` is now the depth-7 tree with its settings locked in, no blanks left. All that remains is to prove it on data it has never seen.

=== step === concept
::eyebrow Did the search actually help?
## Was tuning worth it?

Fair question. Compare three trees on the exact same 5 folds: the **careless** deep tree (the worst setting in our grid, roc_auc 0.651), the **rpart default** (what you get with no tuning at all), and the **tuned** winner (0.723). We already have the first and third; here is the untouched default for comparison:

```r
default_wf <- workflow() |>
  add_model(decision_tree() |> set_engine("rpart") |> set_mode("classification")) |>
  add_recipe(recipe(defaulted ~ ., data = train))

set.seed(4)
default_res <- fit_resamples(default_wf, folds, metrics = tree_metrics)
collect_metrics(default_res) |>
  filter(.metric == "roc_auc") |>
  pull(mean) |>
  round(3)
#> [1] 0.707
```

Now put all three side by side:

::widget chart-plotter {"data":[{"x":"deep tree","y":0.651},{"x":"rpart default","y":0.707},{"x":"tuned","y":0.723}],"geoms":["bar"],"x":"setting","y":"roc_auc"}

Tuning lifted roc_auc from the default's **0.707** to **0.723**, a real if modest gain, and it steered you well clear of the careless deep tree at **0.651**. That 0.072 spread between the best and worst settings is the whole point: the choice of hyperparameters swings performance by seven points of AUC, and tuning is how you land on the good end instead of gambling.

=== step === concept
::eyebrow Move 6: the honest finish
## Confirm once on the sealed test set

The 0.723 came from cross-validation on the training folds. It is a good estimate, but it is the number the search *optimized*, so it leans a touch optimistic. For the figure you report to the risk committee, you want a score from data that played no part in choosing anything, and that is the test set you sealed away in step 2. `last_fit()` takes the finalized workflow, trains it on the **full** training set, and scores it **once** on that held-out test set:

```r
final_fit <- last_fit(final_wf, split, metrics = tree_metrics)
collect_metrics(final_fit)
#> # A tibble: 2 x 4
#>   .metric  .estimator .estimate .config
#>   <chr>    <chr>          <dbl> <chr>
#> 1 accuracy binary         0.690 pre0_mod0_post0
#> 2 roc_auc  binary         0.695 pre0_mod0_post0
```

The honest test-set **roc_auc is 0.695**, a little below the cross-validated 0.723, which is exactly the small optimism we expected. This 0.695 is the number to report: it is the only score computed on applicants that had no hand in picking the model or its settings.

=== step === quiz
::eyebrow Check yourself
## Which number do you report?

Your tuned loan tree scored **0.723 roc_auc** in cross-validation and **0.695** on the sealed test set. Which do you put in the report to the risk committee, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The 0.723, because it is the higher number and came from five folds ::no It is higher precisely because the search optimized it: the settings were chosen to maximize that cross-validated score, so it is a little optimistic. Reporting it would overstate the model.
- The 0.695, because the test set played no part in choosing the model or its settings ::ok Right. The test set stayed sealed through the entire search, so its score is the one unbiased estimate of how the model will do on genuinely new applicants. That is the number to stand behind.
- Neither, you should average them to 0.709 ::no Averaging a biased estimate with an unbiased one just gives a new biased number. The clean logic is simpler: report the score from data that had no hand in building the model.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [tune package documentation (tidymodels)](https://tune.tidymodels.org/) - the reference for tune_grid, collect_metrics, select_best and finalize_workflow, each with runnable examples.
- [Get Started: Tune model parameters (tidymodels.org)](https://www.tidymodels.org/start/tuning/) - the official hands-on walkthrough, tuning a decision tree from grid to final fit.
- [Tidy Modeling with R, ch. 13: Grid search](https://www.tmwr.org/grid-search) - Kuhn and Silge on regular vs space-filling grids and how tune_grid works under the hood.
- [dials package documentation (tidymodels)](https://dials.tidymodels.org/) - the parameter objects (cost_complexity, tree_depth and the rest) and the grid builders that lay out a search.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - decision trees and cost-complexity pruning, the theory behind the cost_complexity knob.

=== step === complete
## Lesson 6 complete

You can now tune a model instead of guessing at its settings. You marked a tree's `cost_complexity` and `tree_depth` with `tune()`, laid out a grid of candidates, and ran `tune_grid()` to score every one across cross-validation folds without once touching the test set. You read the leaderboard with `collect_metrics()` and `show_best()`, selected the winner, finalized the workflow, and confirmed it a single time on the sealed test set for an honest **0.695** roc_auc.

The deeper habit is the honest one: candidates are judged by resampling, the test set is spent only at the very end, and you tune for the metric that matches your decision, not whichever number happens to look best.

Next, Lesson 7: Compare many models with workflowsets. Tuning found the best *tree*, but why assume a tree is the right model at all? You will line up a logistic regression, this tuned tree, and a random forest, and race them on the exact same folds to crown a winner fairly.

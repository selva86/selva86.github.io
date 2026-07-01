---
title: "Model Evaluation Lesson 4: Hyperparameter Tuning Strategies"
catalog_blurb: "How to find good model settings without wasting your search budget."
description: "Hyperparameter tuning in R: why grid search wastes your budget, how random and Bayesian search find good settings faster, and how to spend a search budget well."
keywords: "hyperparameter tuning, grid search, random search, Bayesian optimization, model tuning, cross-validation, random forest, mtry, tune, R"
post_type: "LESSON"
curriculum_id: "6.70.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "4"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "Scoring-Rules-and-Regression-Metrics.html"
course_prev: "Nested-Cross-Validation.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Hyperparameter Tuning Strategies

In Lesson 3 you quietly ran a search: eight polynomial degrees, scored one by one, keep the best. That is a *grid search*, the simplest tuning strategy there is. It works fine for one knob and eight settings. But the bakery has grown. You now predict daily cake sales from six signals, not one, and you have switched to a random forest with two knobs worth turning. Trying every combination is no longer cheap, and soon it is impossible. This lesson is about searching *well*: how to find good settings without burning your whole compute budget on bad ones.

By the end you will be able to:

- Tell a hyperparameter (a knob you set before training) from a parameter (a number the model learns)
- Explain why, for the same number of tries, random search beats a grid, and when Bayesian search beats both
- Set up a search in R and spend a limited tuning budget where it actually pays off

**Prerequisites:** Lessons 1 to 3 (k-fold cross-validation, and that "tuning" means trying several settings and keeping the best). You can fit a model and call `predict()`.

::widget tuning-search {}

=== step === concept
::eyebrow Two kinds of numbers
## Parameters the model learns, hyperparameters you choose

Picture baking a cake. You set the oven **dial** to 180 degrees and a timer to 40 minutes: those are choices you make *before* anything bakes. What comes out, how risen, how browned, how moist, is decided *during* baking by the batter reacting to that heat. You do not set the browning directly; you set the dial, and the browning follows.

A model works the same way, and the two words for it matter for the rest of this lesson:

- A **parameter** is a number the model *learns from the data* while it trains. You never set these by hand. In a random forest they are the actual split questions inside every tree ("is temperature above 24?"), chosen automatically to fit the bakery's history.
- A **hyperparameter** is a number *you* set *before* training, that shapes *how* the model learns. It is the oven dial. The model cannot learn it from the data, because it governs the learning itself.

Let us build the bakery's data and meet its hyperparameters. Each lesson runs in a fresh R session, so we create everything inline (run this once):

```r
# 300 days of the bakery: daily cake sales vs six signals (simulated so we control the truth).
set.seed(1)
n <- 300
bakery <- data.frame(
  temp    = round(runif(n, 5, 35), 1),   # the day's high, degrees C
  weekend = rbinom(n, 1, 2/7),           # 1 if Saturday or Sunday
  promo   = rbinom(n, 1, 0.30),          # 1 if a promotion ran that day
  holiday = rbinom(n, 1, 0.08),          # 1 if a public holiday
  rain_mm = round(rexp(n, 1/4), 1),      # rainfall, mm
  passers = round(runif(n, 50, 400))     # foot-traffic index outside the shop
)
bakery$sales <- with(bakery,
  40 + 6*temp - 0.15*temp^2 + 25*weekend + 35*promo + 60*holiday -
  1.3*rain_mm + 0.04*passers + rnorm(n, 0, 12))    # a curve + effects + noise (sd 12 cakes)
dim(bakery)
#> [1] 300   7
```

Now fit one random forest. Two of its arguments are hyperparameters, and we simply *choose* them:

```r
library(randomForest)
set.seed(7)
rf <- randomForest(sales ~ ., data = bakery,
                   mtry = 6,        # HYPERPARAMETER: features each split may consider
                   nodesize = 5,    # HYPERPARAMETER: smallest allowed leaf (controls depth)
                   ntree = 150)
round(sqrt(tail(rf$mse, 1)), 2)     # out-of-bag RMSE, the typical miss in cakes
#> [1] 15.78
```

We let every split look at all six signals (`mtry = 6`) and used a modest leaf size (`nodesize = 5`), a perfectly reasonable first guess. It lands **15.78 cakes off**, on average. Is that the best these two knobs can do? We have no idea, and the only way to find out is to search. Note what we did and did *not* set: the split questions inside the 150 trees, the parameters, were learned for us; choosing the two hyperparameters well is the whole game of tuning.

Think of the two knobs as two axes. Every setting is a point on the floor; the height above each point is that setting's cross-validated error. That landscape is the **search space**, and formally we want its lowest point:

\[ \lambda^{*} = \arg\min_{\lambda \,\in\, \Lambda}\ \mathrm{CV}(\lambda) \]

Here \(\lambda\) (lambda) is one *combination* of hyperparameters (for example, `mtry = 4, nodesize = 10`), \(\Lambda\) is the whole set of combinations you would consider, \(\mathrm{CV}(\lambda)\) is that combination's cross-validated error (the honest score from Lessons 1 to 3), and \(\lambda^{*}\) is the winner. The catch is that every time you evaluate \(\mathrm{CV}(\lambda)\) you must train and score a whole model, which costs time. So you get a **budget** \(B\): a fixed number of settings you can afford to try. Tuning strategy is simply *how you spend \(B\)*.

[KEY INSIGHT]
Parameters are learned; hyperparameters are chosen. Tuning is the search for the best choice, and because each try costs a full model fit, the real question is never "which setting is best?" but "how do I find a great setting within a limited number of tries?"

=== step === quiz
::eyebrow Check yourself
## Which is the hyperparameter?

You train the random forest above. Which of these is a **hyperparameter**, the kind of number you set before training rather than one the model learns?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The specific question at the top of tree 12 ("is temperature above 24.3?") ::no That split question is a *parameter*: the forest learned it from the data while training. You never set it by hand.
- `mtry`, the number of features each split is allowed to consider ::ok Right. `mtry` is set before training and shapes *how* the trees learn; the model cannot discover it from the data. That makes it a hyperparameter, one of the knobs you tune.
- The predicted sales for a sunny Saturday ::no That is an *output* the trained model produces, not a setting you choose. Predictions come from the learned parameters.

=== step === concept
::eyebrow The obvious strategy
## Grid search: try every combination

The most natural way to spend your budget is a **grid search**: list a few values for each knob, then try every combination. It is exactly what you did in Lesson 3, just with more than one knob now. Let us score each combination with the forest's free out-of-bag (OOB) error from Lesson 3, so the search runs fast right here. (You could just as well use k-fold CV; the *strategy* is the same whatever the scorer.)

```r
# Score any (mtry, nodesize) combination by the forest's out-of-bag RMSE.
oob_rmse <- function(mtry, nodesize, ntree = 150) {
  set.seed(7)                                # same seed for every combo = a fair, paired comparison
  rf <- randomForest(sales ~ ., data = bakery,
                     mtry = mtry, nodesize = nodesize, ntree = ntree)
  sqrt(tail(rf$mse, 1))                       # out-of-bag RMSE
}

grid <- expand.grid(mtry = c(2, 4, 6), nodesize = c(3, 10, 25))   # 3 x 3 = 9 combinations
grid$rmse <- round(mapply(oob_rmse, grid$mtry, grid$nodesize), 2)
grid[order(grid$rmse), ]                      # best (lowest RMSE) first
#>   mtry nodesize  rmse
#> 2    4        3 15.43
#> 5    4       10 15.43
#> 1    2        3 15.52
#> 8    4       25 15.64
#> 6    6       10 15.79
#> 4    2       10 15.89
#> 9    6       25 15.95
#> 7    2       25 16.13
#> 3    6        3 16.17
```

Nine fits, and the best combination sits on top: `mtry = 4` at **15.43 cakes**, already a clear step down from our 15.78 first guess. (Two combinations tie at 15.43; a coarse grid often cannot separate near-neighbours.) Simple, thorough, and easy to explain, which is why grid search is everywhere. But it hides a budget problem that grows fast:

- With `d` knobs and `v` values each, the grid has \(v^{d}\) points. Three knobs at five values each is already 125 fits; add a fourth and it is 625. This is the **curse of dimensionality**: cost explodes as you add knobs.
- Flip it around: a budget of \(B\) grid points spread over \(d\) knobs tries only \(B^{1/d}\) *distinct values per knob*. A 25-point grid over 2 knobs tries just 5 values of each. Every one of those 5 is spent on *both* knobs equally, even if one knob barely changes the score.

[WARNING]
A grid spends your budget as if every knob mattered the same amount. In real models a few knobs move the score a lot and the rest hardly matter, so a grid pours most of its tries into settings that were never going to help.

=== step === widget
::eyebrow See it
## The same budget, spent two ways

Here is that budget problem made visible. The shaded square is the search space: darker means lower validation error, so the sweet spot is the dark patch. Both searches get the **same number of tries**. Toggle between them.

Grid search lays its tries on a rigid lattice, so it only ever samples a handful of distinct values along each axis. Random search scatters its tries, so each one lands on a *fresh random* value of *every* knob. When one knob matters far more than the other, random search almost always finds a better spot, because it explored the important axis more finely for the exact same cost.

::widget tuning-search {}

This is the classic result of Bergstra and Bengio (2012): for the same budget, random search usually beats grid search, and the gap widens the more knobs you have.

=== step === concept
::eyebrow Do it in R
## Random search: same budget, better coverage

Random search could not be simpler: instead of a lattice, draw each try at random from the ranges you care about. We keep the same budget of nine fits so the comparison is fair.

```r
# Same 9-fit budget as the grid, but every draw is a fresh value on BOTH axes.
set.seed(1)
rand <- data.frame(mtry     = sample(1:6,  9, replace = TRUE),
                   nodesize = sample(2:30, 9, replace = TRUE))
rand$rmse <- round(mapply(oob_rmse, rand$mtry, rand$nodesize), 2)
rand[order(rand$rmse), ]
#>   mtry nodesize  rmse
#> 9    3        8 15.40
#> 5    5       11 15.50
#> 7    6       15 15.63
#> 2    4        2 15.70
#> 6    3       23 15.87
#> 8    2       11 15.89
#> 4    2       22 16.28
#> 3    1       22 19.37
#> 1    1       20 19.72
```

Same nine-fit budget as the grid, but every draw is an independent random value on both axes, so these nine fits spanned a far wider range of `nodesize` (2 to 23) than the grid's three fixed values, and they found `mtry = 3, nodesize = 8` at **15.40 cakes**, a hair better than the grid's best for the same cost. Notice the honest cost of randomness too: two unlucky draws landed on `mtry = 1` (about 19 to 20 cakes, starved trees). Random search does waste the occasional try on a bad region, yet it still edged out the grid here. How many random tries do you actually need? There is a clean answer. If the best settings are the top \(q\) fraction of a knob's range, then a single random draw misses that zone with probability \(1-q\), and \(B\) independent draws all miss it with probability \((1-q)^{B}\). To hit the zone with confidence at least \(1-\delta\):

\[ 1-(1-q)^{B} \ \ge\ 1-\delta \qquad\Longrightarrow\qquad B \ \ge\ \frac{\log \delta}{\log(1-q)} \]

Read \(q\) as "how good is good enough" (the top slice you would be happy to land in) and \(\delta\) as "how much bad luck you will tolerate." To land in the best 5% of a knob's range with 95% confidence, that is \(B \ge \log(0.05)/\log(0.95) \approx 59\) draws, and, remarkably, that number does not depend on how many knobs you have. Sixty-ish random tries buys you a near-best value of *every* knob at once.

=== step === quiz
::eyebrow Check yourself
## Why does random win?

You are tuning a model with **three** hyperparameters, but only **one** of them really affects the score. You can afford 64 evaluations. A grid uses a 4 x 4 x 4 lattice; random search draws 64 random points. Which explores the important knob better, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The grid, because it covers the space evenly and leaves no gaps ::no Even coverage of the *whole* space is exactly the trap. The grid spreads its 64 tries across all three knobs equally, so it wastes most of them on the two knobs that do not matter.
- They are equivalent: 64 tries is 64 tries either way ::no The count is the same but the *coverage per knob* is not. That is the whole point of the difference.
- Random search, because its 64 points use 64 distinct values of the important knob, while the grid uses only 4 ::ok Exactly. The 4 x 4 x 4 grid tries just four distinct values of each knob, so only four of its tries explore the one knob that matters. Random search gives that knob 64 different values for the same budget.

=== step === concept
::eyebrow Search smarter
## Bayesian search: learn from your tries

Grid and random search share one weakness: they are **blind**. Every try is chosen in advance, so the search never learns from what it has already seen. If ten tries all showed that low `nodesize` is better, a random search will still happily waste its eleventh try on a huge `nodesize`.

**Bayesian optimization** (also called sequential model-based search) fixes that. After a handful of tries, it fits a cheap stand-in model, a *surrogate*, that predicts the validation error across the whole space *and* how unsure it is at each point. It then picks the next real evaluation where the surrogate looks most promising, balancing two urges: **exploit** (probe where predicted error is low) and **explore** (probe where it is unsure, in case a better region is hiding). Each new result sharpens the surrogate, so every try is smarter than the last.

::widget process-flow {"steps":[{"title":"Warm up","sub":"evaluate a few random settings to get started"},{"title":"Fit a surrogate","sub":"a cheap model predicts CV error everywhere, with an uncertainty band"},{"title":"Pick the next point","sub":"where error looks low OR the surrogate is unsure: exploit vs explore"},{"title":"Evaluate for real","sub":"run CV there and add the true result"},{"title":"Repeat","sub":"the surrogate sharpens; each try beats a blind guess"}]}

In practice you do not build this by hand. The tidymodels `tune` package runs the whole loop for you (run this one in a full R install):

```r-static
library(tidymodels)
spec <- rand_forest(mtry = tune(), min_n = tune()) |>       # mark the two knobs to tune
  set_engine("randomForest") |> set_mode("regression")

set.seed(1)
bo <- tune_bayes(
  spec, sales ~ .,
  resamples = vfold_cv(bakery, v = 5),                      # score each try with 5-fold CV
  initial   = 5,                                            # 5 random warm-up tries
  iter      = 20                                            # then 20 model-guided tries
)
select_best(bo, metric = "rmse")                            # the best combination found
```

[KEY INSIGHT]
Bayesian search shines when each evaluation is **expensive**: a slow model, big data, or costly cross-validation. It reaches a good spot in far fewer tries than random search. When a fit is cheap and fast, plain random search is simpler and often just as good. Do not reach for the heavy machinery you do not need.

=== step === concept
::eyebrow Spend it well
## Don't grid what a curve already tells you

A budget is only as good as how you spend it. Two habits separate a wasteful search from a sharp one.

1. **Tune the knobs that matter, on the right scale.** A few hyperparameters move the score a lot; most barely register. Spend your budget on the influential ones. And search learning-rate-like knobs on a **log scale** (`0.001, 0.01, 0.1`), not a linear one, because their effect is multiplicative, not additive.
2. **Do not grid-search something you can read off a curve.** The number of trees in a forest, or boosting rounds in a booster, is the classic example. You never need a grid for it. Train once while watching the error round by round: it falls, then flattens (forest) or turns back up (boosting). Read the best number straight off that **learning curve**.

That second habit has a name: **early stopping**. Drag the marker below to choose where to stop. Too early leaves signal on the table; too late overfits; the sweet spot is the lowest point on the validation curve, and you found it with a *single* training run instead of a whole grid.

::widget learning-curve {}

Early stopping tunes an entire axis, the number of rounds, for the price of one fit. That is the mindset for the whole budget: never spend a search where a single, well-read training run will do.

=== step === tryit
::eyebrow Your turn
## Set up a random search on a budget

You can afford **20 model fits**. The smart move, as you have seen, is to spend them on random search, not a 20-point grid: 20 random draws give each knob 20 distinct values, while a grid would give only a handful. Fill in the blank so `nodesize` gets 20 independent random draws from 2 to 40 (matching the 20 draws for `mtry`).

```r
set.seed(2)
search <- data.frame(
  mtry     = sample(1:6, 20, replace = TRUE),   # 20 random values of mtry
  nodesize = ____                               # 20 random leaf sizes, from 2 to 40
)
head(search)
```
::check {"regex":"sample\\s*\\(\\s*2:40\\s*,\\s*20","gate":true,"difficulty":"beginner","ok":"That is it: sample(2:40, 20, replace = TRUE) draws 20 independent leaf sizes, so every one of your 20 fits explores a new value of BOTH knobs. Score each row with oob_rmse and keep the lowest, exactly as the grid block did.","no":"You need 20 random draws from the range 2 to 40, one per fit: sample(2:40, 20, replace = TRUE)."}
::solution
```r
set.seed(2)
search <- data.frame(
  mtry     = sample(1:6, 20, replace = TRUE),
  nodesize = sample(2:40, 20, replace = TRUE)   # 20 independent draws, one per fit
)
head(search)
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Bergstra & Bengio (2012), Random Search for Hyper-Parameter Optimization, JMLR 13](https://www.jmlr.org/papers/v13/bergstra12a.html) - the paper that showed random search beats grid search for the same budget, with the coverage argument you saw here.
- [Snoek, Larochelle & Adams (2012), Practical Bayesian Optimization of Machine Learning Algorithms, NeurIPS](https://arxiv.org/abs/1206.2944) - the standard reference for the surrogate-and-acquisition loop behind Bayesian search.
- [Probst, Boulesteix & Bischl (2019), Tunability: Importance of Hyperparameters of Machine Learning Algorithms, JMLR 20](https://www.jmlr.org/papers/v20/18-444.html) - measures which hyperparameters actually matter, the evidence behind "tune the few that count."
- [tidymodels: the tune package](https://tune.tidymodels.org/) - grid, random and Bayesian search in production R, including `tune_grid()` and `tune_bayes()`.

=== step === complete
## Lesson 4 complete

You can now search for hyperparameters without wasting your budget. Parameters are learned by the model; hyperparameters are the knobs you set, and tuning is the search for the best knobs within a fixed number of tries. A grid tries every combination but pours budget into knobs that do not matter; random search gives every try a fresh value of every knob, so it wins for the same cost; Bayesian search learns from past tries and pays off when each evaluation is expensive. And the sharpest habit of all is to never search for what a single learning curve already tells you.

Next, Lesson 5: Scoring Rules and Regression Metrics. You have been minimising RMSE without asking whether RMSE is even the right target. You will meet proper scoring rules, log-loss, and the difference between RMSE, MAE and MAPE, and learn to pick the score your search should actually be chasing.

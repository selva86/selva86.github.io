---
title: "Model Evaluation Lesson 4: Hyperparameter Tuning Strategies"
catalog_blurb: "How to find good model settings without wasting your search budget."
description: "Hyperparameter tuning in R: why grid search wastes your budget, how random and Bayesian search find good settings faster, and how to spend a search budget well."
keywords: "hyperparameter tuning, grid search, random search, Bayesian optimization, model tuning, cross-validation, decision tree, tidymodels, tune, R"
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

In Lesson 3 you quietly ran a search: eight polynomial degrees, scored one by one, keep the best. That is a *grid search*, the simplest tuning strategy there is. It works fine for one knob and eight settings. But the bakery has grown. You now predict daily cake sales from six signals, not one, and you are fitting a tree with two knobs worth turning. Trying every combination is no longer cheap, and soon it is impossible. This lesson is about searching *well*: how to find good settings without burning your whole budget on bad ones.

By the end you will be able to:

- Tell a hyperparameter (a knob you set before training) from a parameter (a number the model learns)
- Explain why, for the same number of tries, random search matches or beats a grid, and when Bayesian search beats both
- Set up a search in R and spend a limited tuning budget where it actually pays off

**Prerequisites:** Lessons 1 to 3 (k-fold cross-validation, and that "tuning" means trying several settings and keeping the best). You can fit a model and call `predict()`.

::widget tuning-search {}

=== step === concept
::eyebrow Two kinds of number
## Parameters the model learns, hyperparameters you choose

Picture baking a cake. You set the oven **dial** to 180 degrees and a timer to 40 minutes: those are choices you make *before* anything bakes. What comes out, how risen, how browned, how moist, is decided *during* baking by the batter reacting to that heat. You do not set the browning directly; you set the dial, and the browning follows.

A model works the same way, and the two words for it matter for the rest of this lesson:

- A **parameter** is a number the model *learns from the data* while it trains. You never set these by hand. In a decision tree they are the actual split questions inside the tree ("is `promo` on?", "is temperature above 24?"), chosen automatically to fit the bakery's history.
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

Now grow one small tree and read what it did. We *chose* `maxdepth = 2` (a hyperparameter, at most two questions deep); the tree then *learned* everything else, which signals to split on and where:

```r
library(rpart)
# maxdepth = 2 is a HYPERPARAMETER we set. The splits below are PARAMETERS the
# tree LEARNED from the data: which signal to ask about, and at what cutoff.
# (cp = 0 just turns off rpart's built-in pruning, so maxdepth is the only size
# limit here; it is plumbing, not a third knob to tune.)
small <- rpart(sales ~ ., data = bakery,
               control = rpart.control(maxdepth = 2, cp = 0))
small
#> n= 300
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 300 291637.90 116.9736
#>   2) promo< 0.5 204 163850.20 106.3624
#>     4) holiday< 0.5 183  85148.30 100.1916 *
#>     5) holiday>=0.5 21  11008.73 160.1365 *
#>   3) promo>=0.5 96  56006.90 139.5223
#>     6) weekend< 0.5 67  26504.99 131.2315 *
#>     7) weekend>=0.5 29  14256.40 158.6770 *
```

You set one number, `maxdepth = 2`. The tree discovered the rest on its own: split first on `promo`, then on `holiday` or `weekend`, and predict an average for each of the four leaves. Those splits and averages are the **parameters**, learned. Grow it deeper and it would also learn temperature cutoffs like "is temperature above 24?". What it can *never* learn is the dial itself: how deep to grow, how large a leaf to allow. Those you must choose, and choosing them well is the whole game of tuning.

Think of the knobs as axes. Every setting is a point on the floor; the height above each point is that setting's cross-validated error. That landscape is the **search space**, and formally we want its lowest point:

\[ \lambda^{*} = \arg\min_{\lambda \,\in\, \Lambda}\ \mathrm{CV}(\lambda) \]

Here \(\lambda\) (lambda) is one *combination* of hyperparameters (say, `maxdepth = 4, minbucket = 10`), \(\Lambda\) is the whole set of combinations you would consider, \(\mathrm{CV}(\lambda)\) is that combination's cross-validated error (the honest score from Lessons 1 to 3), and \(\lambda^{*}\) is the winner. The catch is that every time you evaluate \(\mathrm{CV}(\lambda)\) you must train and score a whole model, which costs time. So you get a **budget** \(B\): a fixed number of settings you can afford to try. Tuning strategy is simply *how you spend* \(B\).

[KEY INSIGHT]
Parameters are learned; hyperparameters are chosen. Tuning is the search for the best choice, and because each try costs a full model fit, the real question is never "which setting is best?" but "how do I find a great setting within a limited number of tries?"

=== step === quiz
::eyebrow Check yourself
## Which is the hyperparameter?

You grow the tree above. Which of these is a **hyperparameter**, the kind of number you set before training rather than one the model learns?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The split at the top of the tree, "is `promo` on?" ::no That split question is a *parameter*: the tree learned it from the data while training. You never set it by hand.
- `maxdepth`, the largest number of questions the tree may ask in a row ::ok Right. `maxdepth` is set before training and shapes *how* the tree learns; the model cannot discover it from the data. That makes it a hyperparameter, one of the knobs you tune.
- The predicted sales for a sunny Saturday ::no That is an *output* the trained model produces, not a setting you choose. Predictions come from the learned parameters.

=== step === widget
::eyebrow The shape of the job
## Tuning is a loop

Whatever strategy you use, tuning is the same five-step loop: propose a setting, score it honestly, remember the score, repeat until the budget runs out, then refit the winner on all your data. The only thing a *strategy* changes is the first step, how the next setting is proposed. Grid search proposes a fixed lattice; random search proposes random points; Bayesian search proposes the point its past results suggest is most promising.

::widget process-flow {"steps":[{"title":"Propose a setting","sub":"pick one combination of the hyperparameters to try"},{"title":"Score it","sub":"cross-validate that setting on the training data (Lessons 1 to 3)"},{"title":"Record","sub":"store the setting and its validation error"},{"title":"Repeat","sub":"until the budget of tries runs out"},{"title":"Refit the best","sub":"take the winning setting and fit it on all the data"}]}

Keep that loop in mind: everything below is just a smarter way to do the *propose* step.

=== step === concept
::eyebrow The obvious strategy
## Grid search: try every combination

The most natural way to spend your budget is a **grid search**: list a few values for each knob, then try every combination. It is exactly what you did in Lesson 3, just with more than one knob now. We will tune two knobs of the tree: `maxdepth` (how many questions deep it may grow) and `minbucket` (the smallest number of days allowed in a leaf, which stops it carving the data too fine).

To keep every number here instant and reproducible, we score each setting on a single held-out slice of days rather than full k-fold CV. The *strategy* is identical whatever the scorer; in a real project you would drop in the k-fold CV from Lessons 1 to 3.

```r
# Split the 300 days: 210 to train on, 90 held out to score each candidate.
set.seed(7)
idx <- sample(nrow(bakery), 0.7 * nrow(bakery))
tr  <- bakery[idx, ]
va  <- bakery[-idx, ]

# Score any (maxdepth, minbucket) setting by its error on the held-out days.
val_rmse <- function(maxdepth, minbucket) {
  fit <- rpart(sales ~ ., data = tr,
               control = rpart.control(maxdepth = maxdepth,
                                       minbucket = minbucket, cp = 0))
  sqrt(mean((va$sales - predict(fit, va))^2))   # RMSE: the typical miss, in cakes
}

grid <- expand.grid(maxdepth = c(2, 4, 6, 8), minbucket = c(2, 8, 20, 40))  # 4 x 4 = 16
grid$rmse <- round(mapply(val_rmse, grid$maxdepth, grid$minbucket), 2)
grid[order(grid$rmse), ]                          # best (lowest RMSE) first
#>    maxdepth minbucket  rmse
#> 8         8         8 17.73
#> 7         6         8 17.81
#> 2         4         2 17.92
#> 6         4         8 17.94
#> 3         6         2 19.76
#> 4         8         2 20.66
#> 5         2         8 21.77
#> 1         2         2 23.10
#> 10        4        20 25.04
#> 11        6        20 25.04
#> 12        8        20 25.04
#> 9         2        20 25.05
#> 13        2        40 28.50
#> 14        4        40 28.50
#> 15        6        40 28.50
#> 16        8        40 28.50
```

Sixteen fits, and the best sits on top: `maxdepth = 8, minbucket = 8` at **17.73 cakes** off, on average. Read the table and you can *see* the two knobs at work. `minbucket` is the one that really moves the score: force at least 40 days per leaf and the tree is too coarse to fit anything (28.50, bottom four rows, no matter how deep you let it grow); allow small leaves and it drops into the high teens. `maxdepth` matters far less once `minbucket` is small. That imbalance, one knob dominating, is the single most important fact about real tuning, and it is exactly what the next two strategies exploit.

=== step === concept
::eyebrow The catch
## Why a grid explodes

Grid search is simple, thorough, and easy to explain, which is why it is everywhere. But it hides a budget problem that grows fast.

- With `d` knobs and `v` values each, the grid has \(v^{d}\) points. Three knobs at five values each is already \(5^{3} = 125\) fits; add a fourth and it is \(5^{4} = 625\); wrap each in 5-fold CV and that is over 3,000 model fits for four knobs. This is the **curse of dimensionality**: cost explodes as you add knobs.
- Flip it around. A budget of \(B\) grid points spread over \(d\) knobs tries only \(B^{1/d}\) *distinct values per knob*. Our 16-point grid over 2 knobs tried just \(\sqrt{16} = 4\) values of each. And every one of those 4 was spent on *both* knobs equally, even though we just saw that `minbucket` matters and `maxdepth` barely does.

[WARNING]
A grid spends your budget as if every knob mattered the same amount. In real models a few knobs move the score a lot and the rest hardly matter, so a grid pours most of its tries into settings that were never going to help.

=== step === quiz
::eyebrow Check yourself
## How big does a grid get?

You decide to grid-search **4** hyperparameters, trying **5** values of each, and you score every setting with **5-fold** cross-validation. Roughly how many model fits is that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- About 20: you add up 4 knobs times 5 values ::no The knobs *multiply*, not add. Every value of one knob is paired with every value of all the others, so it is 5 to the power of 4, not 4 times 5.
- Over 3,000: 5^4 = 625 combinations, each fit 5 times for the folds ::ok Right. 625 settings times 5 folds is 3,125 fits, just to tune four knobs. Each knob you add multiplies the cost, which is why exhaustive grids stop being affordable fast.
- Exactly 625: the folds do not change the count ::no The 625 is the number of settings, but each one is trained and scored once per fold. With 5-fold CV that is 625 times 5 = 3,125 fits.

=== step === widget
::eyebrow See it
## The same budget, spent two ways

Here is that budget problem made visible. The shaded square is the search space: darker means lower validation error, so the sweet spot is the dark patch. Both searches get the **same number of tries**. Toggle between them.

Grid search lays its tries on a rigid lattice, so it only ever samples a handful of distinct values along each axis. Random search scatters its tries, so each one lands on a *fresh random* value of *every* knob. When one knob matters far more than the other, random search almost always finds a better spot, because it explored the important axis more finely for the exact same cost.

::widget tuning-search {}

This is the classic result of Bergstra and Bengio (2012): for the same budget, random search matches or beats grid search, and the gap widens the more knobs you have.

=== step === concept
::eyebrow Do it in R
## Random search: same budget, better coverage

Random search could not be simpler: instead of a lattice, draw each try at random from the ranges you care about. We keep the exact same budget of 16 fits so the comparison is fair.

```r
# Same 16-fit budget as the grid, but every draw is a fresh value on BOTH axes.
set.seed(1)
rand <- data.frame(maxdepth  = sample(2:12, 16, replace = TRUE),
                   minbucket = sample(2:50, 16, replace = TRUE))
rand$rmse <- round(mapply(val_rmse, rand$maxdepth, rand$minbucket), 2)
rand[order(rand$rmse), ]
#>    maxdepth minbucket  rmse
#> 1        10         8 17.73
#> 2         5        10 17.98
#> 3         8        16 25.03
#> 15        7        16 25.03
#> 4         2        22 25.05
#> 7        12        26 26.44
#> 13        6        26 26.44
#> 16       11        34 26.44
#> 5         3        38 26.45
#> 9        12        38 26.45
#> 10        4        38 26.45
#> 11        2        35 26.45
#> 6         8        42 28.26
#> 8         3        47 28.26
#> 12        6        43 28.26
#> 14       11        45 28.26
```

For the same 16 fits, random search matched the grid's best (17.73) while spreading its tries across **12 distinct** leaf sizes instead of the grid's **4** (8, 16, 22, 26, 34, 38, ...). On just two knobs the two strategies roughly tie, which is honest: random search is not magic, and with one dominant knob a lucky grid can keep up. Its real edge shows up as knobs pile on, because the finer per-axis coverage lets it find good values a coarse lattice steps right over. You will see that in the try-it: a *smaller* random search finds a leaf size the grid never tested, and beats it.

How many random tries do you actually need? There is a clean answer. If the best settings are the top \(q\) fraction of a knob's range, then a single random draw misses that zone with probability \(1-q\), and \(B\) independent draws all miss it with probability \((1-q)^{B}\). To hit the zone with confidence at least \(1-\delta\):

\[ 1-(1-q)^{B} \ \ge\ 1-\delta \qquad\Longrightarrow\qquad B \ \ge\ \frac{\log \delta}{\log(1-q)} \]

Read \(q\) as "how good is good enough" (the top slice you would be happy to land in) and \(\delta\) as "how much bad luck you will tolerate." To land in the best 5% of a knob's range with 95% confidence, that is \(B \ge \log(0.05)/\log(0.95) \approx 59\) draws, and, remarkably, that number does not depend on how many knobs you have. About sixty random tries buys you a near-best value of *every* knob at once.

=== step === quiz
::eyebrow Check yourself
## Why does random win as knobs grow?

You are tuning a model with **three** hyperparameters, but only **one** of them really affects the score. You can afford 64 evaluations. A grid uses a 4 x 4 x 4 lattice; random search draws 64 random points. Which explores the important knob better, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The grid, because it covers the space evenly and leaves no gaps ::no Even coverage of the *whole* space is exactly the trap. The grid spreads its 64 tries across all three knobs equally, so it wastes most of them varying the two knobs that do not matter.
- They are equivalent: 64 tries is 64 tries either way ::no The count is the same but the *coverage per knob* is not. That is the whole point of the difference.
- Random search, because its 64 points use 64 distinct values of the important knob, while the grid uses only 4 ::ok Exactly. The 4 x 4 x 4 grid tries just four distinct values of each knob, so only four of its tries explore the one knob that matters. Random search gives that knob 64 different values for the same budget.

=== step === concept
::eyebrow Search smarter
## Bayesian search: learn from your tries

Grid and random search share one weakness: they are **blind**. Every try is chosen in advance, so the search never learns from what it has already seen. If ten tries all showed that a small `minbucket` is better, a random search will still happily waste its eleventh try on a huge one.

**Bayesian optimization** (also called sequential model-based search) fixes that. After a handful of tries, it fits a cheap stand-in model, a *surrogate*, that predicts the validation error across the whole space *and* how unsure it is at each point. It then picks the next real evaluation where the surrogate looks most promising, balancing two urges: **exploit** (probe where predicted error is low) and **explore** (probe where it is unsure, in case a better region is hiding). Each new result sharpens the surrogate, so every try is smarter than the last.

Press **Next sample** below to watch it work. The dashed line is the true (hidden) objective; the band is the surrogate's uncertainty; the blue curve underneath is how attractive each point looks. Watch it lock onto the peak in just a few evaluations.

::widget bayesopt-acq {}

In practice you do not build this by hand. The tidymodels `tune` package runs the whole loop for you (run this one in a full R install):

```r-static
library(tidymodels)
spec <- decision_tree(tree_depth = tune(), min_n = tune()) |>   # mark the two knobs to tune
  set_engine("rpart") |> set_mode("regression")

set.seed(1)
bo <- tune_bayes(
  spec, sales ~ .,
  resamples = vfold_cv(bakery, v = 5),   # score each try with 5-fold CV
  initial   = 5,                         # 5 random warm-up tries
  iter      = 20                         # then 20 model-guided tries
)
select_best(bo, metric = "rmse")         # the best combination found
```

[KEY INSIGHT]
Bayesian search shines when each evaluation is **expensive**: a slow model, big data, or costly cross-validation. It reaches a good spot in far fewer tries than random search. When a fit is cheap and fast, plain random search is simpler and often just as good. Do not reach for heavy machinery you do not need.

=== step === quiz
::eyebrow Check yourself
## When is Bayesian search worth it?

Bayesian optimization adds real overhead: it fits and re-fits a surrogate model between every evaluation. In which situation does that overhead most clearly pay for itself?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each evaluation is very expensive: a slow model on big data with costly cross-validation, so you can afford only a few dozen tries ::ok Right. When every try is precious, spending a little extra thinking to choose the *next* one wisely saves far more than it costs. That is exactly where Bayesian search earns its keep.
- Each fit is cheap and instant, and you can easily afford thousands of tries ::no Then the surrogate's overhead buys you little: plain random search will blanket the space just fine. Save the machinery for when tries are scarce.
- You have a single hyperparameter that takes one of three values ::no With three options you just try all three. Any search strategy is overkill for a space that small.

=== step === concept
::eyebrow Spend it well
## Don't grid what a curve already tells you

A budget is only as good as how you spend it. Two habits separate a wasteful search from a sharp one.

1. **Tune the knobs that matter, on the right scale.** A few hyperparameters move the score a lot; most barely register (you saw `minbucket` dominate `maxdepth`). Spend your budget on the influential ones. And search learning-rate-like knobs on a **log scale** (`0.001, 0.01, 0.1`), not a linear one, because their effect is multiplicative, not additive.
2. **Do not grid-search something you can read off a curve.** The number of boosting rounds, or trees in a forest, is the classic example. You never need a grid for it. Train once while watching the error round by round: it falls, then flattens or turns back up. Read the best number straight off that **learning curve**.

That second habit has a name: **early stopping**. Drag the marker below to choose where to stop. Too early leaves signal on the table; too late overfits; the sweet spot is the lowest point on the validation curve, and you found it with a *single* training run instead of a whole grid.

::widget learning-curve {}

Early stopping tunes an entire axis, the number of rounds, for the price of one fit. That is the mindset for the whole budget: never spend a search where a single, well-read training run will do.

=== step === tryit
::eyebrow Your turn
## Spend a small budget on random search

You can afford just **12 model fits**. The smart move, as you have seen, is to spend them on random search, not a 12-point grid: 12 random draws give each knob 12 distinct values, while a grid would give only three or four. Fill in the blank so `minbucket` gets 12 independent random draws from 2 to 50 (matching the 12 draws for `maxdepth`), then score each row with the `val_rmse` you built earlier.

```r
set.seed(3)
search <- data.frame(
  maxdepth  = sample(2:12, 12, replace = TRUE),   # 12 random depths
  minbucket = ____                                # 12 random leaf sizes, from 2 to 50
)
search$rmse <- round(mapply(val_rmse, search$maxdepth, search$minbucket), 2)
search[which.min(search$rmse), ]                  # the best of the 12
```
::check {"regex":"sample\\s*\\(\\s*2:50\\s*,\\s*12","gate":true,"difficulty":"beginner","ok":"That is it. Those 12 draws land on minbucket = 9, a value the 16-point grid never tried, and score 17.56, beating the grid's 17.73 for fewer fits. Random search found a good spot in the gaps between the lattice.","no":"You need 12 random draws from the range 2 to 50, one per fit: sample(2:50, 12, replace = TRUE)."}
::solution
```r
set.seed(3)
search <- data.frame(
  maxdepth  = sample(2:12, 12, replace = TRUE),
  minbucket = sample(2:50, 12, replace = TRUE)    # 12 independent draws, one per fit
)
search$rmse <- round(mapply(val_rmse, search$maxdepth, search$minbucket), 2)
search[which.min(search$rmse), ]
#>   maxdepth minbucket  rmse
#> 3        8         9 17.56
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Bergstra & Bengio (2012), Random Search for Hyper-Parameter Optimization, JMLR 13](https://www.jmlr.org/papers/v13/bergstra12a.html) - the paper that showed random search matches or beats grid search for the same budget, with the coverage argument you saw here.
- [Snoek, Larochelle & Adams (2012), Practical Bayesian Optimization of Machine Learning Algorithms, NeurIPS](https://arxiv.org/abs/1206.2944) - the standard reference for the surrogate-and-acquisition loop behind Bayesian search.
- [Probst, Boulesteix & Bischl (2019), Tunability: Importance of Hyperparameters of Machine Learning Algorithms, JMLR 20](https://www.jmlr.org/papers/v20/18-444.html) - measures which hyperparameters actually matter, the evidence behind "tune the few that count."
- [tidymodels: the tune package](https://tune.tidymodels.org/) - grid, random and Bayesian search in production R, including `tune_grid()` and `tune_bayes()`.

=== step === complete
## Lesson 4 complete

You can now search for hyperparameters without wasting your budget. Parameters are learned by the model; hyperparameters are the knobs you set, and tuning is the search for the best knobs within a fixed number of tries. A grid tries every combination but pours budget into knobs that do not matter, and its cost explodes as you add them; random search gives every try a fresh value of every knob, so it matches or beats a grid for the same cost and pulls ahead as knobs grow; Bayesian search learns from past tries and pays off when each evaluation is expensive. And the sharpest habit of all is to never search for what a single learning curve already tells you.

Next, Lesson 5: Scoring Rules and Regression Metrics. You have been minimising RMSE without asking whether RMSE is even the right target. You will meet proper scoring rules, log loss, and the difference between RMSE, MAE and MAPE, and learn to pick the score your search should actually be chasing.

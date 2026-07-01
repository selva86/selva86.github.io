---
title: "Gradient Boosting Lesson 3: The Hyperparameters That Matter"
catalog_blurb: "The few boosting settings that actually change results, and how to set them."
description: "The handful of gradient boosting hyperparameters that actually matter: number of trees, learning rate, tree depth and regularization, how they trade off, and how to tune them."
keywords: "gradient boosting hyperparameters, learning rate, number of trees, max_depth, num_leaves, regularization, XGBoost tuning, LightGBM tuning, shrinkage, boosting overfitting, n_estimators"
post_type: "LESSON"
curriculum_id: "6.40.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "3"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "Early-Stopping-and-Learning-Curves.html"
course_prev: "LightGBM-and-CatBoost-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 6
## The Hyperparameters That Matter

In Lesson 2 you handed Sam's bike-kiosk chain to LightGBM and CatBoost and met a fistful of settings in passing: `num_leaves`, `learning_rate`, `max_bin`, `nrounds`. A real booster exposes dozens more. Stare at that wall of options and tuning feels like turning random dials.

It is not. A handful of knobs do almost all the work, they trade off against each other in predictable ways, and once you see the picture you can set them on purpose instead of by luck.

By the end of this lesson you will be able to:

- Name the four hyperparameters that actually move a booster, and say what each controls
- Explain the learning-rate and number-of-trees trade-off, and set the two together
- Explain why boosting wants shallow trees when a random forest wants deep ones
- Use regularization to shrink the gap between training and validation error
- Follow a sensible tuning ORDER instead of guessing knobs at random

**Prerequisites:** Lesson 1 ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html): residuals, the learning rate, shallow trees in sequence) and Lesson 2 ([LightGBM and CatBoost in R](LightGBM-and-CatBoost-in-R.html)). You can run R and you know what a training and validation split is, and what RMSE measures.

::widget process-flow {"steps":[{"title":"Number of trees","sub":"how many boosting rounds: the total model capacity"},{"title":"Learning rate","sub":"how much of each tree to keep: the step size"},{"title":"Tree depth","sub":"how complex each tree is: weak vs strong learners"},{"title":"Regularization","sub":"the brakes that stop it memorizing the training data"}]}

=== step === concept
::eyebrow The short list
## Most settings do not matter, these four do

A trained booster is an *additive model*: it starts from one flat guess and stacks many small trees on top, each one nudging the prediction toward what the last batch still got wrong. Write that as

\[ F_M(x) = F_0(x) + \nu \sum_{m=1}^{M} h_m(x) \]

where \(F_0(x)\) is the initial guess (the mean of the target), \(h_m(x)\) is the \(m\)-th tree, \(M\) is the number of trees, and \(\nu\) (the Greek letter "nu") is the **learning rate** (some libraries call it the *shrinkage*), a small multiplier between 0 and 1 applied to every tree. Read straight off that one formula, the knobs that change the answer are: how many trees \(M\), how big a slice of each you keep \(\nu\), how complex each tree \(h_m\) is allowed to be, and how hard you penalize complexity to stop overfitting. Everything else is a refinement.

Those four ideas wear different names in every library. Here is the same knob across the three boosters you met in Lesson 2:

| What it controls | XGBoost | LightGBM | CatBoost |
|---|---|---|---|
| Number of trees | `nrounds` / `n_estimators` | `num_iterations` | `iterations` |
| Learning rate (shrinkage) | `eta` | `learning_rate` | `learning_rate` |
| Tree complexity | `max_depth` | `num_leaves` | `depth` |
| Min data per leaf | `min_child_weight` | `min_data_in_leaf` | `min_data_in_leaf` |
| Row / column sampling | `subsample` / `colsample_bytree` | `bagging_fraction` / `feature_fraction` | `subsample` / `rsm` |
| L1 / L2 penalty | `alpha` / `lambda` | `lambda_l1` / `lambda_l2` | `l2_leaf_reg` |

In code, a booster's settings are just a named list. A LightGBM run on Sam's chain might start like this:

```r-static
# The four knobs (plus their regularization helpers), named the LightGBM way:
params <- list(
  num_iterations   = 500,   # number of trees M
  learning_rate    = 0.05,  # nu: how much of each tree to keep
  num_leaves       = 31,    # tree complexity (XGBoost calls it max_depth)
  min_data_in_leaf = 20,    # regularization: smallest leaf allowed
  bagging_fraction = 0.8,   # regularization: sample 80% of rows each tree
  feature_fraction = 0.8,   # regularization: sample 80% of columns each tree
  lambda_l2        = 1.0    # regularization: L2 penalty on leaf scores
)
```

The rest of this lesson takes those four knobs one at a time, on a small slice of Sam's data you can boost right here in the browser.

=== step === widget
::eyebrow Knob 1
## Number of trees

Each boosting round adds one more tree that corrects the leftover error, so more trees means more capacity to fit. The catch: a booster fits the *training* data a little better with every single tree, forever. Training error only ever falls. Validation error, the error on rentals the model never saw, falls at first while the trees are still learning real demand, bottoms out, then climbs as later trees start memorizing the noise in the training days.

Drag the slider below. The orange training curve slides down without end, the validation curve makes a U, and the dashed line marks the round where validation is lowest, the best number of trees.

::widget learning-curve {"rounds":40}

Let us see that U for real on Sam's data. First we build one kiosk's daily rentals against temperature (demand humps near a pleasant 22 degrees), and a tiny booster we will reuse to test every knob. Each lesson runs in a fresh R session, so run this setup block once.

```r
library(rpart)
set.seed(1)
n <- 240
temp    <- runif(n, -2, 36)                                          # daily high temperature, deg C
rentals <- 120 + 180 * exp(-((temp - 22)^2) / 120) + rnorm(n, 0, 22) # demand peaks near 22 C
day <- data.frame(temp = temp, rentals = rentals)
tr  <- 1:170; te <- 171:n                                            # training rows / validation rows

# A tiny gradient booster we will reuse to test each knob. It stacks `rounds`
# shallow trees (each fit to the current residuals) and returns the training
# and validation RMSE, so we can watch both move as we turn the dials.
boost_tv <- function(depth, lr, rounds, minbucket = 1) {
  pred <- rep(mean(day$rentals[tr]), nrow(day))                # start at the mean
  for (m in 1:rounds) {
    res  <- data.frame(temp = day$temp[tr], r = day$rentals[tr] - pred[tr])
    tree <- rpart(r ~ temp, data = res,
                  control = rpart.control(maxdepth = depth, minsplit = 2,
                                          minbucket = minbucket, cp = 0))
    pred <- pred + lr * predict(tree, day)                     # add a shrunken correction
  }
  c(train = sqrt(mean((day$rentals[tr] - pred[tr])^2)),
    val   = sqrt(mean((day$rentals[te] - pred[te])^2)))
}
nrow(day)
#> [1] 240
```

Now sweep the number of trees at a fixed learning rate and watch validation RMSE turn the corner.

```r
rounds <- c(10, 40, 120, 300)
val    <- sapply(rounds, function(R) unname(boost_tv(depth = 2, lr = 0.1, rounds = R)["val"]))
data.frame(rounds, val_rmse = round(val, 1))
#>   rounds val_rmse
#> 1     10     34.8
#> 2     40     23.2
#> 3    120     23.3
#> 4    300     24.4
```

[KEY INSIGHT]
More trees is not "more is better." It is a dial with a sweet spot: too few and the model has not finished learning the signal (underfit), too many and it starts fitting noise (overfit). Lesson 4 shows how *early stopping* finds that sweet spot for you automatically.

=== step === widget
::eyebrow Knob 2
## Learning rate

The learning rate \(\nu\) decides how much of each new tree you actually add. After round \(m\) the model updates by

\[ F_m(x) = F_{m-1}(x) + \nu\, h_m(x) \]

so \(\nu = 1\) adds each tree in full, while \(\nu = 0.05\) adds only a twentieth of it. A small \(\nu\) means each tree barely moves the prediction, so the booster takes small, cautious steps toward the answer. That is exactly gradient descent, and the picture below is its simplest form: a ball rolling down a loss bowl by steps of size \(\nu\). Slide the learning rate. Too small and it crawls, just right and it walks smoothly to the bottom, too large and it overshoots and bounces, or flies out of the bowl entirely.

::widget gradient-descent {}

A booster behaves the same way. Small steps are safer and generalize better, but you need more of them to arrive, so the learning rate and the number of trees are two ends of one trade-off. Roughly, what matters is the total signal added, \(\nu \times M\): halve the learning rate and you need about twice as many trees to fit the same amount. See it on Sam's data, same trees, three settings:

```r
round(rbind(
  "big steps, few trees"    = boost_tv(depth = 2, lr = 0.30, rounds = 40),
  "small steps, few trees"  = boost_tv(depth = 2, lr = 0.03, rounds = 40),
  "small steps, many trees" = boost_tv(depth = 2, lr = 0.03, rounds = 300)
), 1)
#>                         train  val
#> big steps, few trees     15.8 23.2
#> small steps, few trees   29.8 32.7
#> small steps, many trees  17.1 23.1
```

The middle row, a small learning rate with too few trees, has barely started: it underfits. Give the same small rate enough trees (the third row) and it catches the aggressive setting and tends to generalize a touch better. This is why practitioners pick a low learning rate and then add trees, rather than cranking the rate to finish faster.

[NOTE]
A high learning rate is the single fastest way to overfit a booster: each big step can blow past the best fit, and a few trees are enough to start carving the training noise. When in doubt, lower \(\nu\) and add trees.

=== step === quiz
::eyebrow Check yourself
## Learning rate and trees together

Your booster does well with `learning_rate = 0.1` and 500 trees. You decide to halve the learning rate to `0.05` for a smoother, steadier fit. To keep roughly the same quality of fit, what should you do with the number of trees?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Halve the trees too, to about 250, so the two cuts cancel out ::no That cuts the total signal twice over. With half the step size AND half the trees you add only a quarter of what you did before, so the model underfits badly.
- Roughly double the trees, to about 1000, since the smaller steps each add less ::ok Right. What fits the data is roughly the total signal added, \(\nu \times M\). Halve \(\nu\) and you must roughly double \(M\) to keep that product, and you get a smoother, usually better-generalizing fit for the extra compute.
- Leave the trees at 500, the learning rate has nothing to do with how many you need ::no They are coupled. With half the step size and the same number of trees, the model has only travelled half as far toward the fit, so it underfits.

=== step === widget
::eyebrow Knob 3
## Tree depth

How complex should each individual tree be? Tree depth (or, equivalently, the leaf count `num_leaves`) sets that. A depth-1 tree (a "stump") asks one question. A depth-10 tree asks a long chain of them and can carve the data into hundreds of tiny regions. Depth also sets the *interaction order*: a depth-\(d\) tree can combine up to \(d\) features in a single rule, so depth 1 captures one feature at a time while depth 4 can learn "cold AND weekend AND downtown."

The bias-variance picture below is the same U you saw for trees, now driven by complexity. Slide it: too simple underfits (high bias), too complex overfits (high variance), and the sweet spot sits in between.

::widget bias-variance {}

Here is the twist that trips people up. A **random forest wants deep trees**, because it averages many independent deep trees and the averaging cancels their variance. **Boosting wants shallow trees**, because the trees are added in sequence and each one already corrects the last, so a deep tree per round overshoots and the ensemble overfits fast. Depth 3 to 8 is the usual home for a booster. Watch stumps beat deep trees on Sam's data:

```r
round(rbind(
  "depth-1 stumps" = boost_tv(depth = 1,  lr = 0.1, rounds = 80),
  "depth-10 trees" = boost_tv(depth = 10, lr = 0.1, rounds = 80)
), 1)
#>                train val
#> depth-1 stumps  21.7  25
#> depth-10 trees   0.1  29
```

The deep-tree row drives training RMSE lower (it can memorize) but validation RMSE is worse: each over-eager tree has chased noise. Shallow trees, added patiently, win.

=== step === concept
::eyebrow Knob 4
## Regularization: the brakes

The first three knobs decide how much a booster *can* fit. Regularization decides how much you *let* it, by penalizing or restricting complexity so the model spends its capacity on signal, not noise. The everyday symptom regularization fixes is a big gap between a low training error and a high validation error: the model has memorized the training days.

The main brakes, all of which you turn toward "more conservative" when you see overfitting:

| Knob | What it does | Turn it... |
|---|---|---|
| Min data per leaf | refuse leaves built on a few rows | UP to fight overfit |
| Subsample (rows) | fit each tree on a random fraction of rows | DOWN (e.g. 0.8) to fight overfit |
| Column sample | offer each tree a random subset of features | DOWN (e.g. 0.8) to decorrelate trees |
| L2 penalty \(\lambda\) | shrink large leaf scores toward zero | UP for a smoother model |
| Min split gain \(\gamma\) | refuse splits that barely help | UP to prune weak splits |

The math behind the last two is one extra term added to what the booster minimizes. Alongside the prediction loss, each tree \(h\) pays a complexity price

\[ \Omega(h) = \gamma\, T + \tfrac{1}{2}\,\lambda \sum_{j=1}^{T} w_j^2 \]

where \(T\) is the number of leaves in the tree, \(w_j\) is the score (the value) on leaf \(j\), \(\gamma\) charges a flat fee per leaf (so the tree only grows leaves that earn their keep), and \(\lambda\) is the L2 penalty that pulls every leaf score toward zero (so no single leaf can shout). Bigger \(\gamma\) and \(\lambda\) mean simpler, calmer trees. The L1 penalty in the table (XGBoost's `alpha`) does the same job with absolute values and can push some leaf scores to exactly zero; L2 is the usual default.

You can feel the simplest brake right now. Take the over-eager depth-10 booster from the last step and just forbid tiny leaves, demand at least 25 rows in every leaf:

```r
round(rbind(
  "unregularized (min leaf 1)"  = boost_tv(depth = 10, lr = 0.1, rounds = 120, minbucket = 1),
  "regularized   (min leaf 25)" = boost_tv(depth = 10, lr = 0.1, rounds = 120, minbucket = 25)
), 1)
#>                             train  val
#> unregularized (min leaf 1)    0.0 29.0
#> regularized   (min leaf 25)  20.8 27.1
```

The unregularized row has the lower training RMSE but the wider gap to validation, the signature of overfitting. One brake closes most of that gap. The trade is real, though: lean too hard on the brakes and you swing the other way into underfitting, so regularization is a dial to balance, not a switch to slam.

=== step === tryit
::eyebrow Your turn
## Set a safe learning rate

You have seen the rule: small, cautious steps generalize better, as long as you give the booster enough trees to arrive. Set a **low** learning rate (a value below 0.1) on Sam's data and let it run for 300 trees. Fill in the blank with a small learning rate.

```r
boost_tv(depth = 3, lr = ____, rounds = 300)
```
::check {"regex":"lr\\s*=\\s*0\\.0\\d","gate":true,"difficulty":"beginner","ok":"Nicely cautious. A learning rate of 0.0x takes small steps; with 300 trees it has room to reach a smooth, well-generalizing fit.","no":"You want a SMALL learning rate, something like lr = 0.05 (a value of the form 0.0x, below 0.1). Small steps plus enough trees is the safe recipe."}
::solution
```r
round(boost_tv(depth = 3, lr = 0.05, rounds = 300), 1)
#> train   val 
#>  10.7  23.5
```

=== step === widget
::eyebrow Putting it together
## The tuning recipe

The four knobs interact, so the order you set them in matters. Tuning all of them at once is a hopeless search; tuning them in this sequence is a short, reliable one. This is the workflow seasoned practitioners reach for, and the order most automated tuners follow too.

::widget process-flow {"steps":[{"title":"1. Fix a low learning rate","sub":"start around 0.05 to 0.1: small, safe steps"},{"title":"2. Pick the number of trees","sub":"let validation error choose it (early stopping, Lesson 4)"},{"title":"3. Tune tree complexity","sub":"search depth / num_leaves and min data per leaf"},{"title":"4. Add regularization","sub":"row and column sampling, plus L1 / L2, to taste"},{"title":"5. Final squeeze","sub":"lower the learning rate, raise the trees, refit"}]}

Notice the learning rate appears twice: you fix a sensible value early so the rest of the search is stable, then lower it at the very end (adding trees to compensate) to wring out the last bit of accuracy. The number of trees is the one knob you almost never tune by hand, because validation error picks it for free. That is the whole subject of Lesson 4.

=== step === quiz
::eyebrow Check yourself
## Your model is overfitting

You train a booster on Sam's full chain and see a training RMSE of 14 but a validation RMSE of 41: a wide gap. The model has memorized the training days. Which set of moves is most likely to close the gap?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Add more trees and raise the learning rate, to push training error even lower ::no Both moves add capacity and *widen* the gap. Lower training error with the same memorizing trees is exactly the overfit getting worse, not better.
- Nothing, a low training error means the model is excellent, validation error always lags ::no A large gap is the definition of overfitting, not a feature. The honest measure of the model is the validation error, and right now it is poor.
- Lower the tree depth, raise the minimum leaf size, add row and column sampling, and lower the learning rate with more trees ::ok Exactly. Every one of those is a brake: shallower and larger-leaf trees fit less aggressively, sampling decorrelates them, and a smaller learning rate takes safer steps. Together they trade a little training error for a lot of validation error, closing the gap.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [The Elements of Statistical Learning, ch. 10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - boosting, the shrinkage (learning-rate) and tree-size parameters, with the full theory.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentler companion on tree boosting and its three tuning parameters.
- [Chen and Guestrin (2016), XGBoost: A Scalable Tree Boosting System](https://arxiv.org/abs/1603.02754) - the regularized objective (the \(\gamma\) and \(\lambda\) penalty) you saw, straight from the source.
- [XGBoost docs: Notes on Parameter Tuning](https://xgboost.readthedocs.io/en/stable/tutorials/param_tuning.html) - practical advice on trees, depth, learning rate and the bias-variance trade-off.
- [Friedman (2002), Stochastic Gradient Boosting](https://doi.org/10.1016/S0167-9473%2801%2900065-2) - why fitting each tree on a random subsample of rows improves accuracy.

=== step === complete
## Lesson 3 complete

You now know the four knobs that actually move a booster: the number of trees \(M\) (capacity, with a sweet spot), the learning rate \(\nu\) (the step size, traded off against the number of trees through \(\nu \times M\)), the tree depth (keep it shallow, the opposite of a random forest), and regularization (the brakes that shrink the gap between training and validation error). And you have a recipe: fix a low learning rate, let validation error choose the trees, then tune complexity and regularization.

Next, Lesson 4: Early Stopping and Learning Curves. You met the learning curve here and saw that validation error makes a U. Next you will read that curve properly and let it stop training at the bottom automatically, so you never have to guess the number of trees again.

---
title: "Gradient Boosting Lesson 4: Early Stopping and Learning Curves"
catalog_blurb: "Read train and validation curves to stop training right before it overfits."
description: "Read a gradient boosting learning curve, diagnose overfitting from its shape, and use early stopping with a patience window to set the number of trees in R."
keywords: "early stopping, learning curve, gradient boosting, validation error, overfitting, best iteration, early stopping rounds, patience, XGBoost, LightGBM, number of trees, R"
post_type: "LESSON"
curriculum_id: "6.40.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "4"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "Monotonic-Constraints-for-Business-Rules.html"
course_prev: "The-Hyperparameters-That-Matter.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## Early Stopping and Learning Curves

In Lesson 3 you saw the validation error of a booster make a U: too few trees and it underfits, too many and it overfits. That U is the single most useful picture in boosting, and this lesson is about reading it.

Sam runs a chain of bike-rental kiosks and wants to predict each day's rentals from the daily high temperature. A booster keeps stacking small trees, fitting the training days a little better with every round, forever. So the real question is not "is more trees better." It is **when do you stop?** Set the number of trees too high by hand and you overfit; too low and you leave demand unlearned.

By the end of this lesson you will be able to:

- Read a learning curve and say what the training curve and the validation curve each tell you
- Diagnose overfitting, underfitting, or a healthy fit from the curve's shape, and pick the fix
- State the early-stopping rule (the validation minimum, plus a patience window) and why patience beats stopping at the first uptick
- Use early stopping in R to set the number of trees for free, with no grid search

**Prerequisites:** Lesson 1 ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html): residuals, the learning rate, shallow trees in sequence) and Lesson 3 ([The Hyperparameters That Matter](The-Hyperparameters-That-Matter.html): the four knobs and the validation U). You can run R and you know what a training/validation split is and what RMSE measures.

::widget gradient-boosting {}

=== step === concept
::eyebrow The picture
## The learning curve, read properly

A **learning curve** plots two numbers against the boosting round: the error on the training days (the days the model fits) and the error on a held-out **validation** set (days it never trains on). We measure error with RMSE, the root-mean-square of the prediction misses, in the same units as rentals.

Here is the asymmetry that makes the curve so useful. Every new tree is fit to correct what the current model still gets wrong on the *training* days, so the training curve falls a little more every single round and never turns back up. The validation curve has no such guarantee: it falls while the trees are still learning real, repeatable demand, bottoms out, then **climbs** once later trees start fitting the random noise in the training days. The lowest point of the validation curve is the model you want.

Write the booster as the additive model from Lesson 3,

\[ F_M(x) = F_0(x) + \nu \sum_{m=1}^{M} h_m(x), \]

where \(F_0(x)\) is the starting guess (the mean rentals), \(h_m\) is the \(m\)-th tree, \(\nu\) is the learning rate, and \(M\) is the number of trees. Reading the curve picks \(M\): the best number of trees is the round where validation error is smallest,

\[ M^\star = \arg\min_{m}\; \mathcal{L}_{\text{val}}(m), \]

where \(\mathcal{L}_{\text{val}}(m)\) is the validation RMSE after \(m\) rounds and \(\arg\min\) means "the round \(m\) that makes it smallest."

Drag the slider below to choose where to stop. Watch the orange training curve slide down without end while the validation curve makes its U, and read the verdict: stopped too early, stopped too late, or right at the sweet spot. That slider, done automatically, is early stopping.

::widget learning-curve {"rounds":40}

=== step === concept
::eyebrow In R
## Build the curve on Sam's data

Let us produce that exact picture for real. Each lesson runs in a fresh R session, so we rebuild Sam's data here: one kiosk's daily rentals against temperature (demand humps near a pleasant 22 degrees), then a small booster that records BOTH errors after every round. Run this setup once.

```r
library(rpart)
set.seed(1)
n <- 240
temp    <- runif(n, -2, 36)                                          # daily high temperature, deg C
rentals <- 120 + 180 * exp(-((temp - 22)^2) / 120) + rnorm(n, 0, 22) # demand peaks near 22 C
day <- data.frame(temp = temp, rentals = rentals)
tr  <- 1:170; va <- 171:n            # training rows / held-out validation rows

# Boost `rounds` shallow trees, recording train + validation RMSE AFTER each round,
# so we can watch the learning curve form. Each tree fits the current residuals.
boost_curve <- function(rounds = 120, depth = 2, lr = 0.1) {
  pred <- rep(mean(day$rentals[tr]), nrow(day))                  # start every prediction at the mean
  out  <- data.frame(round = 1:rounds, train = NA_real_, valid = NA_real_)
  for (m in 1:rounds) {
    res   <- data.frame(temp = day$temp[tr], r = day$rentals[tr] - pred[tr])
    stump <- rpart(r ~ temp, data = res,
                   control = rpart.control(maxdepth = depth, minsplit = 2, cp = 0))
    pred  <- pred + lr * predict(stump, day)                     # add a shrunken correction
    out$train[m] <- sqrt(mean((day$rentals[tr] - pred[tr])^2))  # training RMSE so far
    out$valid[m] <- sqrt(mean((day$rentals[va] - pred[va])^2))  # validation RMSE so far
  }
  out
}
nrow(day)
#> [1] 240
```

Now boost 120 rounds and look at the first few. Both errors start high and fall together while the model is still learning the temperature-to-demand shape.

```r
lc <- boost_curve(rounds = 120)
round(head(lc), 1)
#>   round train valid
#> 1     1  59.0  58.5
#> 2     2  54.3  54.3
#> 3     3  50.2  50.6
#> 4     4  46.7  47.4
#> 5     5  43.5  44.7
#> 6     6  40.6  42.2
```

The interesting part is where they part ways. Ask R for the round with the lowest validation error, then compare a few rounds across the whole run.

```r
best <- which.min(lc$valid)   # the round where validation error is smallest
best
#> [1] 64
round(lc[c(1, 30, best, 120), ], 1)
#>     round train valid
#> 1       1  59.0  58.5
#> 30     30  20.1  23.8
#> 64     64  18.2  22.8
#> 120   120  16.1  23.3
```

Validation bottoms out at round 64 (RMSE 22.8), then creeps back up to 23.3 by round 120, even as training error keeps dropping to 16.1. Those last 56 trees made the model look better on the training days and worse on new days. That widening gap is overfitting, caught in the act.

=== step === quiz
::eyebrow Check yourself
## Which model do you ship?

You boost Sam's kiosk for 120 rounds. Training RMSE keeps falling every round and is lowest at round 120. Validation RMSE fell to 22.8 at round 64, then drifted up to 23.3 by round 120. Which model would you put into production?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Round 120: training error is lowest there, so that is the best-fit model ::no Training error always falls with more trees, so it can never tell you when to stop. By round 120 the extra trees have fit training noise: that is why validation got worse. Training error is not the honest measure.
- Round 64: it has the lowest validation error, the best estimate of how the model does on new days ::ok Exactly. Validation error is measured on days the model never trained on, so its minimum marks the most signal with the least overfit. The rise after 64 is memorized noise.
- Neither: keep adding trees past 120 until validation error comes back down ::no It will not come back down. Once validation turns up it keeps climbing as later trees fit more noise. The minimum you already passed, round 64, is the stopping point.

=== step === concept
::eyebrow Three shapes
## What the curve's shape is telling you

The same plot diagnoses three different problems by its shape. Read the gap between the two curves and where the validation curve is heading.

| Shape you see | Diagnosis | What to do |
|---|---|---|
| Validation makes a clear U; small gap at the bottom | Healthy. The minimum is your number of trees. | Stop at the validation minimum. |
| Training error near zero, validation far above it and rising | Overfitting. The model memorizes training days. | Stop earlier; shallower trees; lower learning rate; more regularization. |
| Both errors high and still falling (or flat and high) together | Underfitting. The model has not learned the signal yet. | More rounds; a touch more depth; a higher learning rate. |

See all three on Sam's data. The same booster, three settings, reporting the final training and validation RMSE for each.

```r
# Final train + validation RMSE under three settings, on the same data.
final_tv <- function(...) unlist(tail(boost_curve(...)[c("train", "valid")], 1))
regimes <- rbind(
  healthy  = final_tv(rounds = 64,  depth = 2, lr = 0.10),   # stop at the validation minimum
  overfit  = final_tv(rounds = 250, depth = 8, lr = 0.30),   # deep trees, big steps, far too many rounds
  underfit = final_tv(rounds = 8,   depth = 1, lr = 0.05)    # too few, too-cautious rounds
)
round(regimes, 1)
#>          train valid
#> healthy   18.2  22.8
#> overfit    0.0  29.0
#> underfit  52.8  53.0
```

Read the gaps. The healthy row has a small, honest gap (18.2 vs 22.8). The overfit row drives training error to literally zero but validation is the worst of the three (29.0): a giant gap is the signature of memorizing. The underfit row has almost no gap, but both numbers are terrible (about 53): it never learned the temperature-to-demand curve at all. A tiny gap is only good news when both errors are also low.

=== step === concept
::eyebrow The automation
## Early stopping, in one function

Reading `which.min` off a finished curve works, but it wastes effort: you had to boost a fixed 120 rounds and guess that 120 was enough. **Early stopping** flips it around. You set the number of trees deliberately high, then let the booster watch validation error as it goes and stop itself once that error has not improved for a while.

"For a while," not "at all," is the important part. A validation curve is a little jagged, so it can tick up for one unlucky round and then fall to a new low. The **patience** (libraries call it `early_stopping_rounds`) is how many non-improving rounds you tolerate before giving up. Each time validation hits a new best, the counter resets; when it runs out, you stop and keep the best round, not the last one.

```r
early_stop <- function(rounds = 300, depth = 2, lr = 0.1, patience = 10) {
  pred <- rep(mean(day$rentals[tr]), nrow(day))
  best_val <- Inf; best_round <- 0; wait <- 0; m <- 0
  for (m in 1:rounds) {
    res   <- data.frame(temp = day$temp[tr], r = day$rentals[tr] - pred[tr])
    stump <- rpart(r ~ temp, data = res,
                   control = rpart.control(maxdepth = depth, minsplit = 2, cp = 0))
    pred  <- pred + lr * predict(stump, day)
    v <- sqrt(mean((day$rentals[va] - pred[va])^2))
    if (v < best_val) {                 # new best: remember this round, reset the clock
      best_val <- v; best_round <- m; wait <- 0
    } else {
      wait <- wait + 1                  # no improvement this round
      if (wait >= patience) break       # patience used up: stop
    }
  }
  list(stopped_at = m, best_round = best_round, best_valid = round(best_val, 2))
}
early_stop(rounds = 300, patience = 10)
#> $stopped_at
#> [1] 74
#>
#> $best_round
#> [1] 64
#>
#> $best_valid
#> [1] 22.84
```

You asked for up to 300 trees. Early stopping ran to round 74, after watching validation fail to beat its round-64 low for 10 straight rounds, then handed back round 64 as the answer. You never had to know in advance that 64 was right. That is the whole trick: early stopping tunes the number of trees for you, in a single fit, with no grid search.

[WARNING]
You chose the number of trees by looking at the validation set, so its error at the best round (22.84) is now slightly optimistic: you have peeked at it. For an honest estimate of how the model does on genuinely new days, keep a separate **test** set that early stopping never touches, and report on that.

=== step === tryit
::eyebrow Your turn
## Find the stopping round

`lc` holds the per-round curve you built earlier with `boost_curve(rounds = 120)`. Find the round with the LOWEST validation error: that is where early stopping would stop. Fill in the blank with the right function.

```r
# Which round has the smallest validation error?
best_round <- which.____(lc$valid)
best_round
```
::check {"regex":"which\\.min","gate":true,"difficulty":"beginner","ok":"Right: which.min returns the position of the smallest value, so which.min(lc$valid) is the round with the lowest validation error, the stopping point.","no":"You want the SMALLEST validation error, not the largest. Use which.min(lc$valid) (min, not max)."}
::solution
```r
best_round <- which.min(lc$valid)
best_round
#> [1] 64
```

=== step === quiz
::eyebrow Check yourself
## Why patience?

You are running early stopping with `patience = 10`. Watching validation error, you see it tick UP slightly at round 41, then fall to a brand-new low at round 58. What does the booster do at round 41?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It stops at round 41, because validation error got worse ::no That would quit on a single noisy round and miss the better model waiting at round 58. Stopping at the first uptick is exactly the mistake patience exists to prevent.
- It keeps going: one bad round is well inside the patience window, and the new low at 58 resets the counter ::ok Right. Patience tolerates a run of non-improving rounds. Because round 58 sets a new best, the wait counter resets to zero and the round-58 model is kept, not lost.
- It lowers the learning rate automatically to recover ::no Early stopping never changes the learning rate. It only decides when to stop and which round's model to keep.

=== step === concept
::eyebrow In practice
## How real boosters do it

You will rarely hand-write the loop above. Every production booster has early stopping built in: you pass a validation set to watch and an `early_stopping_rounds` (the patience), set `nrounds` deliberately high, and the library finds the best round for you. Here is the XGBoost idiom in R. (It needs the `xgboost` package, which does not run in this in-browser R, so run this one in your own R session.)

```r-static
library(xgboost)

# Wrap the training and validation matrices XGBoost expects.
dtrain <- xgb.DMatrix(x_train, label = y_train)
dvalid <- xgb.DMatrix(x_valid, label = y_valid)

fit <- xgb.train(
  params  = list(objective = "reg:squarederror", eta = 0.05, max_depth = 4),
  data    = dtrain,
  nrounds = 5000,                          # set this deliberately HIGH
  watchlist = list(train = dtrain, valid = dvalid),
  early_stopping_rounds = 50,              # stop after 50 rounds with no validation gain
  eval_metric = "rmse"
)

fit$best_iteration   # the number of trees early stopping chose for you
```

LightGBM is the same idea with `valids` and `early_stopping_round`; the model remembers its `best_iteration` and uses it when you predict. The recipe from Lesson 3 now closes cleanly: fix a low learning rate, set the trees high, and let early stopping pick the exact number, so the one knob you never have to tune by hand is the number of trees.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [The Elements of Statistical Learning, ch. 10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - boosting, the shrinkage and number-of-trees parameters, and why the test curve turns back up.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentler companion on choosing the number of trees for a boosted model.
- [XGBoost docs: Notes on Parameter Tuning](https://xgboost.readthedocs.io/en/stable/tutorials/param_tuning.html) - controlling overfitting and the number of rounds, with early stopping in practice.
- [LightGBM docs: early_stopping_round](https://lightgbm.readthedocs.io/en/latest/Parameters.html) - the same patience parameter, and how best_iteration is used at predict time.
- [Prechelt (1998), Early Stopping, But When?](https://doi.org/10.1007/3-540-49430-8_3) - the classic treatment of when to stop and why a patience window beats the first uptick.

=== step === complete
## Lesson 4 complete

You can now read a boosting learning curve, the most useful diagnostic the method gives you. Training error always falls, so it never tells you when to stop; validation error makes a U whose minimum is the right number of trees. The curve's shape names the problem: a small gap at a low minimum is healthy, a wide and growing gap is overfitting, two high curves are underfitting. And early stopping automates the read: set the trees high, watch validation, wait out a patience window of non-improving rounds, and keep the best one, no grid search required.

Next, Lesson 5: Monotonic Constraints for Business Rules. Sometimes accuracy is not enough and the business needs a guarantee, for example that predicted demand never falls as temperature moves toward the ideal. You will force a feature's effect to go one way on purpose, and weigh the small accuracy cost against the trust it buys.

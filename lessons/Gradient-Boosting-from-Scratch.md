---
title: "Gradient Boosting Lesson 1: Gradient Boosting from Scratch"
catalog_blurb: "How boosting corrects its own errors, one small tree at a time."
description: "Build gradient boosting from scratch in R: how each shallow tree fits the previous model's errors (the residuals), what the learning rate does, and how boosting differs from bagging."
keywords: "gradient boosting, boosting from scratch, residuals, learning rate, shrinkage, gradient boosting in R, additive model, bagging vs boosting, decision stump, ensemble"
post_type: "LESSON"
curriculum_id: "6.40.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "1"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "LightGBM-and-CatBoost-in-R.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 6
## Gradient Boosting from Scratch

Welcome to the Gradient Boosting track. A random forest grows hundreds of trees in parallel and lets them vote. Boosting takes the opposite path: it grows trees one at a time, and each new tree exists for a single job, to fix the mistakes the trees before it are still making.

Meet Sam, who runs a bike-rental kiosk by the river. Sam wants to predict how many bikes get rented from the day's high temperature. The pattern is a hump: rentals climb as it warms up, peak on pleasant days, then fall off in punishing heat. No single short rule captures that shape. But a stack of short rules, each patching the leftover error of the last, can. That stack is gradient boosting, and in this lesson you build it from nothing.

By the end of this lesson you will be able to:

- Explain boosting as sequential error-correction: each new tree is trained on what the current model still gets wrong
- Say what the learning rate does and why small steps beat big ones
- Build a booster by hand in R and see its error fall, tree by tree

**Prerequisites:** you can run R, you know what a decision tree and a training/test set are, and you have met overfitting (the [Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html) lesson). Bagging and random forests show up only for one contrast near the end.

The widget below starts at round 0, the worst possible model: one flat line at the average. Drag the slider to add boosting rounds and watch the fit bend toward the points.

::widget gradient-boosting {}

=== step === concept
::eyebrow The idea
## How boosting works

Think about how you would study for a hard exam. You take a practice test, see which questions you got wrong, and spend your next session on exactly those. Take another test, find the new weak spots, drill those. Each round you are not relearning everything, you are correcting what you still get wrong. Boosting trains a model the same way.

It starts with the dumbest possible guess: predict the same number for every day, the average rentals. That guess is wrong by different amounts on different days. The amount it is wrong on a given day is the **residual**, the actual value minus the current prediction:

\[ r_i = y_i - F(x_i) \]

Here \(y_i\) is the real rentals on day \(i\), \(F(x_i)\) is the model's current prediction for that day, and \(r_i\) is the leftover error. Now the key move: fit a small tree not to the rentals, but to those residuals. That tree learns the *pattern in the mistakes*, where the model runs high and where it runs low. Add a slice of its corrections back into the model, and the predictions get a little better everywhere. Then compute the new (smaller) residuals and repeat.

Written as a formula, the model is built up one tree at a time. Start at the mean, then on each round \(m\) add a new tree \(h_m\) fit to the current residuals:

\[ F_0(x) = \bar y, \qquad F_m(x) = F_{m-1}(x) + \nu\, h_m(x) \]

where \(\bar y\) is the average rentals, \(h_m\) is the small tree trained on round \(m\)'s residuals, and \(\nu\) (the Greek letter "nu") is the **learning rate**, a small number that shrinks each tree's contribution. We come back to \(\nu\) shortly.

[KEY INSIGHT]
"Gradient" is not just a brand name. For squared-error loss \(L = \tfrac{1}{2}(y - F)^2\), the derivative with respect to the prediction \(F\) is \(-(y - F) = -r\). The residual *is* the negative gradient of the loss. So fitting each tree to the residuals is literally doing gradient descent, one tree-shaped step at a time. That is where gradient boosting gets its name.

::widget process-flow {"steps":[{"title":"Start at the mean","sub":"predict one flat number for every day, the average"},{"title":"Fit a tree to the residuals","sub":"a small tree learns where the model runs high or low"},{"title":"Add a shrunken slice, repeat","sub":"nudge the prediction, recompute residuals, grow the next tree"}]}

=== step === widget
::eyebrow The key experiment
## Watch the residuals shrink

Here is the whole idea, live. The black dots are Sam's bike days. The orange stems are the residuals, the gap between each day and the model's current line. At round 0 the line is flat (the mean) and the stems are long: the model is wrong everywhere.

Drag the **rounds** slider. Each round fits one short tree to the current residuals and adds a shrunken slice of it. Watch the line bend to hug the hump while the orange stems collapse toward zero and the RMSE (the typical leftover error) falls. No single tree did this; the stack of small corrections did.

::widget gradient-boosting {}

Notice the fit is built from little flat steps. Each step is one shallow tree. Pile up enough of them and the staircase traces a smooth curve.

=== step === quiz
::eyebrow Check yourself
## What does the next tree learn?

A booster has already fit its first tree and made predictions. Now it grows a second tree. What target does that second tree try to predict?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The original rentals again, exactly like the first tree did ::no That would just grow another copy of the first tree, learning nothing new. The whole point is to attack what the first tree missed, not to repeat it. (Re-fitting the original target on resampled data is bagging, a different method.)
- The residuals: what the current model still gets wrong (actual minus current prediction) ::ok Exactly. Each new tree is trained on the leftover errors, so it specializes in fixing them. Add its correction and the residuals shrink, which is why the fit improves round after round.
- A fresh bootstrap resample of the original rentals ::no That is bagging's trick (random forests). Boosting does not resample the outcome; it re-targets the same data onto the current residuals, so every tree corrects the ones before it.

=== step === concept
::eyebrow The one real dial
## The learning rate

When a new tree predicts the residuals, you could add its full correction to the model. Boosting almost never does. Instead it adds only a small slice, scaled by the **learning rate** \(\nu\), typically something like 0.1. A tree that says "push this day up by 40" only moves it up by 4.

Why hold back? Because full-size corrections overshoot. They lunge at the training data, chase its noise, and overfit in just a few rounds. Small steps creep toward the answer instead: each tree nudges the model a little, the next tree cleans up what is left, and the final fit is smoother and generalizes better to new days. The cost is more trees, and the rule of thumb is simple.

[KEY INSIGHT]
Halve the learning rate and you roughly double the number of trees needed to reach the same fit. Smaller steps are safer but slower. A small rate (0.01 to 0.1) with many trees is the standard recipe for a booster that holds up on new data.

The widget below uses a learning rate of **0.1**, gentler than the one a few steps back (which used 0.3). Drag it to the same number of rounds you tried earlier: the fit moves more cautiously and needs more rounds to tighten. That is shrinkage at work.

::widget gradient-boosting {"lr":0.1}

=== step === concept
::eyebrow In R
## Boost it by hand

No package magic. We will build a booster from `rpart` stumps (depth-1 trees) so you can see every moving part. Each lesson runs in a fresh R session, so we type Sam's 24 days in directly, then start from the dumbest model: predict the mean for every day.

```r
library(rpart)

# 24 days at Sam's kiosk: the day's high temperature (deg C) and bikes rented.
bikes <- data.frame(
  temp    = c(1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31, 33, 34, 12, 23),
  rentals = c(93, 156, 139, 204, 212, 267, 262, 309, 272, 328, 337, 318, 366, 336, 365, 325, 355, 363, 322, 357, 308, 323, 309, 322)
)

rmse <- function(actual, pred) sqrt(mean((actual - pred)^2))

pred <- rep(mean(bikes$rentals), nrow(bikes))   # round 0: one flat guess, the mean
rmse(bikes$rentals, pred)                        # typical error of the flat guess
#> [1] 74.19
```

The flat guess is off by about 74 bikes on a typical day. Now the boosting loop, exactly the algorithm from earlier: each round fits a stump to the current residuals and adds a shrunken slice of it.

```r
lr <- 0.1                                  # learning rate: add 10% of each tree
for (m in 1:200) {
  resid <- bikes$rentals - pred            # what the model still gets wrong
  stump <- rpart(resid ~ temp, data = bikes,
                 control = rpart.control(maxdepth = 1, cp = 0, minsplit = 2))
  pred  <- pred + lr * predict(stump)      # add a shrunken correction
}
rmse(bikes$rentals, pred)                   # typical error after boosting
#> [1] 12.40
```

From 74 bikes of error down to about 12, built only from one-split stumps and one rule: keep fitting the leftover error. The very first stump splits the days near 8.5 degrees (it pushes cold days down and warm days up); every stump after it cleans up a smaller piece of the hump.

=== step === tryit
::eyebrow Your turn
## Add one more shrunken round

Here is a single boosting round, written out. The new stump predicts the leftover error (the residuals). The catch is the last line: you must add only a **shrunken** slice of the stump's correction, scaled by the learning rate `lr`, not the whole thing. Fill in the blank so the correction is shrunk.

```r
resid <- bikes$rentals - pred            # what the model still gets wrong
stump <- rpart(resid ~ temp, data = bikes,
               control = rpart.control(maxdepth = 1, cp = 0, minsplit = 2))

pred  <- pred + ____ * predict(stump)    # add a SHRUNKEN slice, not the full correction
rmse(bikes$rentals, pred)
```
::check {"regex":"lr\\s*\\*\\s*predict","gate":true,"difficulty":"beginner","ok":"That is shrinkage: the model takes only a small step toward the new tree's correction, so it improves cautiously instead of overshooting. Smaller lr, more trees.","no":"Scale the correction by the learning rate: pred + lr * predict(stump). Adding the full predict(stump) would let one tree lunge at the data and overfit."}
::solution
```r
resid <- bikes$rentals - pred
stump <- rpart(resid ~ temp, data = bikes,
               control = rpart.control(maxdepth = 1, cp = 0, minsplit = 2))

pred  <- pred + lr * predict(stump)
rmse(bikes$rentals, pred)
```

=== step === concept
::eyebrow Two ways to combine trees
## Bagging vs boosting

You have now met both great tree ensembles, and they are near opposites. A random forest is **bagging**: grow many deep trees in parallel, each on its own random resample, then average them to cancel their variance. Boosting grows shallow trees in sequence, each fixing the last, to drive down bias. The differences all flow from that one choice, parallel versus sequential.

| | Bagging (random forest) | Boosting |
|---|---|---|
| Trees are built | in parallel, independently | one after another, each fixing the last |
| Each tree is fit to | a bootstrap resample of the data | the current model's residuals |
| Tree depth | deep (low bias, high variance) | shallow (a stump or small tree) |
| Mainly reduces | variance | bias (and some variance) |
| More trees | never overfit, the error just settles | can overfit if you boost too long |
| Tuning effort | light | more careful (rate, trees, depth) |

[WARNING]
That last row is the catch with boosting, and it is the opposite of a forest. Because every round deliberately fits the leftover error, enough rounds will start fitting *noise*, and test error climbs even as training error keeps falling. A random forest never has this problem; a booster does. Knowing when to stop is its own skill, which is exactly what later lessons (early stopping and learning curves) are about.

=== step === quiz
::eyebrow Check yourself
## Why can more trees hurt a booster?

You train a gradient booster and keep adding trees. Training error keeps dropping, but the error on held-out days has started to *rise*. When you did the same with a random forest, adding trees never hurt. What explains the difference?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Boosting builds trees sequentially to reduce bias, so extra rounds eventually fit noise and overfit; a forest's trees are independent and only average out variance, so more never hurt ::ok Exactly. Each boosting round chases the current residuals, so past a point it starts memorizing noise and held-out error rises. Bagging averages independent trees, which only stabilizes the prediction, so extra trees converge rather than overfit. This is why boosting needs early stopping and a forest does not.
- Random forests use shallower trees than boosters, so they cannot overfit no matter how many you add ::no It is the other way around: forests use deep trees and boosters use shallow ones. Depth is not what saves the forest; independence is. Averaging independent trees cancels variance without chasing noise.
- The booster's learning rate grows with each tree, which is what causes the late overfitting ::no The learning rate is a fixed small constant you choose; it does not grow. The overfitting comes from adding too many sequential correction trees, not from a changing rate.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Friedman (2001), Greedy Function Approximation: A Gradient Boosting Machine, Annals of Statistics](https://doi.org/10.1214/aos/1013203451) - the paper that defined gradient boosting as gradient descent in function space.
- [The Elements of Statistical Learning, ch. 10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - "Boosting and Additive Trees", the full theory behind what you built here.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentler companion treatment of boosting and tree methods.
- [XGBoost: Introduction to Boosted Trees](https://xgboost.readthedocs.io/en/stable/tutorials/model.html) - a clear, modern derivation of regularized gradient boosting and why shrinkage helps.

=== step === complete
## Lesson 1 complete

You built gradient boosting from the ground up: start at the mean, fit each new tree to the residuals (which, for squared error, are the negative gradient of the loss), and add a shrunken slice scaled by the learning rate. You watched the error fall tree by tree, coded the loop by hand, and saw why a booster, unlike a forest, can overfit if you run it too long.

Next, Lesson 2: LightGBM and CatBoost in R. The hand-rolled stump loop you wrote is the honest core of every modern booster; now you will meet the fast, production-grade ones, histogram splits, native categorical handling, and when to reach for which.

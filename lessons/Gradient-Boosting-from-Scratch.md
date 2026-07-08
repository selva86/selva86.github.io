---
title: "Gradient Boosting Lesson 1: Gradient Boosting from Scratch"
catalog_blurb: "How boosting fixes its own mistakes one correction at a time."
description: "Build a gradient booster by hand in R: start at the average, fit each shallow tree to what is still wrong, add a shrunken slice, and watch the error fall."
keywords: "gradient boosting, boosting from scratch, residuals, learning rate, shrinkage, boosting vs bagging, gradient descent, rpart, machine learning, R"
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

Gradient boosting wins more tabular machine-learning contests than any other method. Underneath the famous names (XGBoost, LightGBM, CatBoost) sits one plain idea you can build by hand: make a rough guess, look at what it got wrong, and add a small correction. Do that a few hundred times and a pile of weak little trees becomes a very strong model. You will build that loop yourself for Sam, who rents bikes from a kiosk by the river and wants to predict how many will go out on a given day from the temperature.

By the end of this lesson you will be able to:

- Explain boosting as sequential error-correction: each tree fixes what the last model still got wrong
- Grow a gradient-boosted model in R and watch the error fall
- Say what the learning rate does, and how boosting differs from a random forest

**Prerequisites:** you can run R, and you know what a decision tree is and that one deep tree overfits (the [Random Forests course](RF-Course-Lesson-1.html)).

::widget gradient-boosting {"rounds":8}

=== step === concept
::eyebrow The big idea
## Learn from your own mistakes

In the Random Forests course you built trees in parallel: hundreds of deep trees, each on its own resample, all voting at once. Averaging cancelled their scattered errors. Boosting takes the opposite path, and it is worth pausing on the contrast.

A booster grows trees one after another. It starts with a single crude guess, measures how far off that guess is on every row, and grows a small tree whose only job is to predict those leftover errors. It adds that correction, measures the new (smaller) errors, and grows another tree for those. Each tree cleans up after the one before it.

[KEY INSIGHT]
A random forest builds many independent experts and averages them. A booster builds one long chain of specialists, where each new specialist studies only the mistakes the team is still making. Same raw material (trees), opposite strategy.

That "study the leftover mistakes" step is the whole trick, so let us make it concrete with a real, tiny example.

=== step === concept
::eyebrow Meet the data
## Sam's bike kiosk

Sam rents bikes from a kiosk by the river. Warm days bring crowds, but a scorching day keeps people home, so the number of bikes rented rises with temperature and then falls again. Here are six of Sam's recent Saturdays: the day's high temperature and how many bikes went out.

```r
# Six of Sam's Saturdays: the day's high temperature and the bikes rented
temp   <- c(8, 12, 16, 20, 24, 28)   # daily high, degrees C
rented <- c(30, 44, 60, 72, 68, 50)  # bikes rented that day
data.frame(temp, rented)
#>   temp rented
#> 1    8     30
#> 2   12     44
#> 3   16     60
#> 4   20     72
#> 5   24     68
#> 6   28     50
```

The scatter below plots those six points. Notice the hump: rentals climb from the cold mornings up to a comfortable 20 degrees, then drop off when it gets too hot. No single straight line fits this well, and neither does one shallow tree. That gap is exactly what boosting will close, piece by piece.

::widget chart-plotter {"data":[{"x":8,"y":30},{"x":12,"y":44},{"x":16,"y":60},{"x":20,"y":72},{"x":24,"y":68},{"x":28,"y":50}],"geoms":["point"],"x":"temp","y":"rented"}

=== step === concept
::eyebrow Step zero
## The flat guess, and what it gets wrong

Every model has to start somewhere. The simplest possible model ignores temperature and predicts the same number for every day: the average. Call that first prediction \(\hat{y}^{(0)} = \bar{y}\), where \(\bar{y}\) is the mean of the six counts and \(\hat{y}^{(0)}\) reads "our prediction at round zero."

Now the important part. For each day \(i\) we measure the **residual**: the actual count minus what we predicted, \(r_i = y_i - \hat{y}_i\). Here \(y_i\) is the real number of bikes rented on day \(i\) and \(\hat{y}_i\) is the model's current prediction for that day. A positive residual means we predicted too low; a negative one means too high.

```r
guess <- mean(rented)   # the flat model: predict this same number every day
guess
#> [1] 54
resid <- rented - guess # residual = actual minus current prediction
resid
#> [1] -24 -10   6  18  14  -4
```

So the flat guess of 54 is 24 too high on the coldest day and 18 too low on the best day. The interactive below shows the same starting point on a bigger, curvier example: at round 0 the prediction is one flat line (the mean) and the orange stems are the residuals, one per point. They are long, because a flat line ignores everything. Those stems are what the next tree will attack.

::widget gradient-boosting {"rounds":0}

=== step === tryit
::eyebrow Your turn
## Compute the residuals

A residual is just actual minus predicted. Fill in the blank so `resid` holds how far the flat guess was from each day's real count.

```r
guess <- mean(rented)     # predict this same number every day
resid <- rented - ____    # residual: actual bikes minus the current prediction
resid
```
::check {"regex":"rented\\s*-\\s*guess","gate":true,"difficulty":"beginner","ok":"That is the residual: each day's actual count minus the current prediction. These leftovers are what the next tree learns to predict.","no":"Subtract the current prediction from the actual: rented - guess."}
::solution
```r
guess <- mean(rented)
resid <- rented - guess
resid
#> [1] -24 -10   6  18  14  -4
```

=== step === concept
::eyebrow The core move
## Fit a small tree to the leftovers

Here is the heart of boosting. We grow a shallow tree, but not to predict the bike counts. We grow it to predict the **residuals**. In other words, the tree's target is the column `resid`, not `rented`. It learns a rule like "cold days were overpredicted, so nudge them down; mild days were underpredicted, so nudge them up."

A shallow tree could split those six residuals like this. Cold days (below 14 degrees) were badly overpredicted by the flat guess, so they get large negative corrections. The mild middle days were underpredicted, so they get a positive push. The single too-hot day gets a small negative one. Every number on a leaf below is the average residual of the days that land there, the correction the tree recommends.

::widget tree-diagram {"root":"temp below 14 deg?","l":"temp below 10 deg?","r":"temp below 26 deg?","leaves":["-24 bikes","-10 bikes","+13 bikes","-4 bikes"]}

We do not trust that correction fully. We add only a fraction of it to the current prediction, then repeat. Written out, the update at round \(m\) is

\[ \hat{y}^{(m)} = \hat{y}^{(m-1)} + \eta \, f_m(x) \]

where \(\hat{y}^{(m-1)}\) is the prediction so far, \(f_m(x)\) is the new tree fit to the current residuals, and \(\eta\) (the Greek letter eta, a small positive number like 0.1) is the **learning rate** that shrinks each correction. After the update, the residuals get smaller, and the next tree works on what is left.

=== step === widget
::eyebrow The key experiment
## Watch it correct itself, live

This is a real booster running in your browser. At round 0 it is the flat mean line, with long orange residual stems. Drag the slider to add trees one at a time. Each new shallow tree fits the current stems and pulls the fit toward the points it still gets wrong. Watch the stems collapse and the RMSE (the typical size of a residual) fall.

::widget gradient-boosting {}

No single tree here is any good on its own. Each one only nudges. But stacked in sequence, each cleaning up the last one's leftovers, they trace the whole curve.

=== step === quiz
::eyebrow Check yourself
## What does the next tree predict?

You start with the flat guess (the average), then grow the first tree. What is that tree trained to predict?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The residuals: how far each day's actual count sits from the current prediction ::ok Right. Every tree after the first is fit to the leftover errors of the model so far, not to the original counts. Chasing the residuals is what makes it boosting.
- The original bike counts again, learned fresh from scratch ::no That is what a single stand-alone tree does. A booster's later trees never see the raw counts; they only see what the current model still gets wrong, the residuals.
- The average count across all days ::no The average is only the starting guess (round 0). From then on each tree predicts the residuals of the model built so far.

=== step === concept
::eyebrow The safety dial
## The learning rate: small, safe steps

Why add only a fraction \(\eta\) of each tree instead of the whole correction? Because one tree's idea of the fix is noisy. If you apply it in full, the model lurches, overshoots, and starts chasing the quirks of your particular data. Shrinking every correction (a typical \(\eta\) is between 0.01 and 0.3) means no single tree can dominate. The model creeps toward a good fit in many small, safe steps instead of a few reckless leaps.

There is a trade. A smaller \(\eta\) needs more trees to travel the same distance, so \(\eta = 0.05\) with 500 trees often beats \(\eta = 0.5\) with 50. Slower but steadier almost always generalizes better.

The widget below shows the same small-steps idea on a simple bowl-shaped error surface, where the lowest point is the best model. Slide the learning rate and step downhill: too small and it crawls, just right and it settles into the bottom, too large and it overshoots and bounces around. A booster feels exactly this.

::widget gradient-descent {}

=== step === quiz
::eyebrow Check yourself
## Turning down the learning rate

You cut the learning rate from 0.3 down to 0.05 and keep everything else the same. What is the right expectation?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It makes no difference, as long as you run the same number of trees ::no It does make a difference. Each tree now moves the prediction only about a sixth as far, so with the same number of trees the model underfits. You need more trees to make up the distance.
- Each tree moves the prediction less, so you need more trees, but the final fit usually generalizes better ::ok Exactly. Smaller steps are safer: no single tree can overshoot, so the model tends to generalize better. The cost is that you must grow more trees to cover the same ground.
- A smaller rate always gives a worse model, because the steps are too small ::no Not worse, just slower. Small steps plus enough trees is the combination that usually generalizes best; the rate and the number of trees are turned together.

=== step === concept
::eyebrow Why the name
## Why "gradient" boosting?

The word gradient is not decoration. Measure how wrong a single prediction is with squared-error loss, \(L(y, \hat{y}) = \tfrac{1}{2}(y - \hat{y})^2\), where \(y\) is the actual count and \(\hat{y}\) is the prediction. Ask how the loss changes as we nudge the prediction, which is its slope, or gradient, with respect to \(\hat{y}\):

\[ \frac{\partial L}{\partial \hat{y}} = -(y - \hat{y}) = -r \]

The residual \(r\) is exactly the **negative gradient** of the loss. So when each tree fits the residuals, it is fitting the negative gradient, and adding a shrunken slice is a step downhill on the loss. That is ordinary gradient descent, taken one tree at a time, which is why the bowl widget on the last step felt so familiar.

[KEY INSIGHT]
Fitting the residuals is not a lucky shortcut. For squared-error loss the residual IS the negative gradient, so boosting is gradient descent in the space of predictions. Swap in a different loss (say absolute error for robustness to outliers) and you fit the negative gradient of that loss instead. Same machine, any loss you like.

=== step === concept
::eyebrow The other ensemble
## Boosting versus bagging

You now know two ways to turn many trees into one strong model, and they are near mirror images. A random forest uses **bagging**: grow deep trees in parallel, each on its own bootstrap sample, and average them to cancel their variance. Boosting grows shallow trees in sequence, each fitting the previous model's residuals, to grind down bias.

| | Bagging (random forest) | Boosting |
|---|---|---|
| How trees are built | in parallel, each independent | one after another, each fixes the last |
| What each tree learns | its own bootstrap sample of the rows | the residuals of the model so far |
| Each tree on its own | deep, low bias, overfits | shallow, weak, underfits |
| How they combine | averaged, an equal vote | added in sequence, a shrunken slice each |
| Mainly reduces | variance | bias |
| Adding more trees | never hurts, error just flattens | keeps helping, then can overfit |

The last row is the one to remember. A forest cannot overfit from extra trees, it only converges. A booster can, because every tree pushes harder on the training data, so at some point it starts memorizing noise. That is why the later lessons in this course spend real time on early stopping. To feel the forest's parallel-averaging side again, drag the slider below: many independent trees, averaged at once, the opposite of a boosting chain.

::widget forest-averaging {}

=== step === quiz
::eyebrow Check yourself
## Same thing, or not?

A colleague says a random forest and a gradient booster are basically the same idea, just many trees combined. What is the key difference?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There is no real difference; both just average a pile of independent trees ::no Only bagging averages independent trees. Boosting's trees are not independent at all: each one is grown specifically to fix the errors of the trees before it.
- A forest grows trees in parallel and averages them to cut variance; a booster grows them in sequence, each fitting the last model's residuals, to cut bias ::ok Right. Parallel-and-average versus sequential-and-correct is the whole distinction, and it is why one reduces variance while the other reduces bias.
- A booster averages its trees, while a forest adds its trees up one by one ::no It is the other way round. The forest averages; the booster adds shrunken corrections in sequence.

=== step === concept
::eyebrow The recipe
## The boosting loop, in three rules

Strip away the detail and gradient boosting is just three steps on a loop.

1. **Start at the average.** The first prediction for every row is the mean of the target.
2. **Fit a shallow tree to the residuals.** Grow a small tree whose target is what the model still gets wrong.
3. **Add a shrunken slice.** Update the prediction by the learning rate times the new tree, then go back to step 2.

::widget process-flow {"steps":[{"title":"Start at the average","sub":"the first prediction for every row is the mean of the target"},{"title":"Fit a tree to the residuals","sub":"grow a shallow tree whose target is what the model still gets wrong"},{"title":"Add a shrunken slice","sub":"update by learning-rate times the new tree, then repeat"}]}

That is the entire algorithm. Everything the famous boosters add (histogram splits, clever regularization, native categoricals) is speed and polish on top of these three lines. Time to run the three lines yourself.

=== step === tryit
::eyebrow Build it
## Boost it in R

Sam kept a full summer of daily counts, so here are 120 days built inline. Start every prediction at the mean, then loop: compute the residuals, fit a one-split stump to them, and add a shrunken slice. Fill in the blank so each round adds the new stump's prediction.

```r
library(rpart)
set.seed(1)
sam <- data.frame(temp = runif(120, 5, 33))                             # 120 summer days, degrees C
sam$rentals <- 30 + 4 * sam$temp - 0.11 * sam$temp^2 + rnorm(120, 0, 6) # real demand plus noise

pred <- rep(mean(sam$rentals), nrow(sam))   # round 0: one flat guess, the average
lr   <- 0.1                                  # learning rate: add only a slice of each tree
for (m in 1:50) {
  r     <- sam$rentals - pred                # what the model still gets wrong
  stump <- rpart(r ~ temp, data = sam, control = rpart.control(maxdepth = 1, cp = 0))
  pred  <- pred + lr * ____                  # add a shrunken slice of the new tree
}
sqrt(mean((sam$rentals - pred)^2))           # RMSE after boosting (was 8.65 at round 0)
```
::check {"regex":"predict\\(\\s*stump\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That is the loop: residuals, fit a stump, add a shrunken slice of its prediction. Fifty rounds pull the RMSE from 8.65 down to about 5.14.","no":"Add the new tree's prediction, shrunk by the rate: pred + lr * predict(stump)."}
::solution
```r
library(rpart)
set.seed(1)
sam <- data.frame(temp = runif(120, 5, 33))
sam$rentals <- 30 + 4 * sam$temp - 0.11 * sam$temp^2 + rnorm(120, 0, 6)

pred <- rep(mean(sam$rentals), nrow(sam))
lr   <- 0.1
for (m in 1:50) {
  r     <- sam$rentals - pred
  stump <- rpart(r ~ temp, data = sam, control = rpart.control(maxdepth = 1, cp = 0))
  pred  <- pred + lr * predict(stump)
}
sqrt(mean((sam$rentals - pred)^2))
#> [1] 5.141449
```

=== step === concept
::eyebrow Know your tool
## Where boosting shines, where it bites

You just built the real algorithm. Here is the honest picture of when to reach for it.

**Strengths**

- Usually the most accurate model on tabular data, often the winner on structured problems
- Turns weak, shallow trees into a strong learner with a low, tunable bias
- Fits any differentiable loss, so the same machine handles regression, classification, and ranking

**Costs and cautions**

- It can overfit if you run too many trees or set the learning rate too high, so it needs a validation set and early stopping
- Trees are grown in sequence, so training does not parallelize the way a forest does
- More knobs to turn (trees, learning rate, tree depth) than a random forest's near-automatic fit

In real work you would not hand-roll the loop. The production boosters do the same thing far faster, with better trees and built-in shrinkage. Here is the same model with the `gbm` package (install and run it in your own R):

```r-static
# The same idea, done for real by a package. Run this locally.
library(gbm)
fit <- gbm(rentals ~ temp, data = sam, distribution = "gaussian",
           n.trees = 500, shrinkage = 0.05, interaction.depth = 3)
sqrt(mean((sam$rentals - predict(fit, sam, n.trees = 500))^2))
```

Meeting the fast, modern versions of exactly this, LightGBM and CatBoost, is Lesson 2.

=== step === concept
::eyebrow Go deeper
## References

- [Friedman (2001), Greedy Function Approximation: A Gradient Boosting Machine, Annals of Statistics 29(5)](https://doi.org/10.1214/aos/1013203451) - the paper that framed boosting as gradient descent on a loss.
- [The Elements of Statistical Learning, ch. 10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - boosting, the additive model, and shrinkage, with the full math.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentler companion on tree ensembles, boosting included.
- [XGBoost docs: Introduction to Boosted Trees](https://xgboost.readthedocs.io/en/stable/tutorials/model.html) - the residual-and-gradient story you built here, in a production booster's own words.

=== step === complete
## Lesson 1 complete

You built gradient boosting from the ground up: start at the average, fit a shallow tree to the residuals, add a shrunken slice, and repeat. You saw why fitting the residuals is really gradient descent (the residual is the negative gradient of squared-error loss), what the learning rate buys you (small, safe steps that generalize), and how boosting mirrors bagging (sequential and bias-cutting, versus parallel and variance-cutting).

Next, Lesson 2: LightGBM and CatBoost in R. Sam's kiosk grows into a citywide bike-share with millions of rides, and the hand-rolled loop is far too slow. You will meet the histogram-split trick that makes boosting fast, and the native way modern boosters swallow hundreds of categories without a one-hot explosion.

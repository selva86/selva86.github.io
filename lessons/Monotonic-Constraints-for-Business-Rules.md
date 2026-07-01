---
title: "Gradient Boosting Lesson 5: Monotonic Constraints for Business Rules"
catalog_blurb: "When and how to force a feature's effect to move only one direction."
description: "Force a feature's effect one way with a monotonic constraint: why a pricing model needs it, how to do it in R, and the small accuracy-for-trust trade."
keywords: "monotonic constraints, monotone_constraints, isotonic regression, isoreg, gradient boosting, xgboost, lightgbm, business rules, constrained model, monotonic constraint in R"
post_type: "LESSON"
curriculum_id: "6.40.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "5"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "Quantile-Regression-Forests-and-Prediction-Intervals.html"
course_prev: "Early-Stopping-and-Learning-Curves.html"
---

=== step === cover
::eyebrow Lesson 5 of 6
## Monotonic Constraints for Business Rules

In Lesson 4 you learned to read a learning curve and stop a booster before it overfits. That was about getting the SIZE of the fit right. This lesson is about a different worry, one that accuracy alone will never catch: getting the DIRECTION right.

Sam, who runs the bike-rental kiosks, now wants a pricing tool: type in tomorrow's rental price and it predicts how many bikes go out. Everyone at the kiosk knows one thing for certain: raise the price and you do not sell MORE bikes. Yet when Sam trains a booster on a season of noisy price experiments, the model does exactly that in a couple of spots. It predicts more rentals at $5.50 than at $5.00. The numbers fit the past, but no manager will trust a tool that says "charge more to sell more."

By the end of this lesson you will be able to:

- Say what a monotonic constraint is, in plain words and as a formula
- Recognize when a business needs one, and when forcing it would be a mistake
- Force a feature's effect to go one way in R, and read the result
- Weigh the small accuracy-for-trust trade that a constraint buys

**Prerequisites:** Lesson 1 ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html): trees fit in sequence, the learning rate) and you can run R. The chart below is Sam's price experiment: each dot is one price he tested and the average bikes rented at it.

::widget chart-plotter {"data":[{"x":3,"y":150},{"x":3.5,"y":142},{"x":4,"y":134},{"x":4.5,"y":120},{"x":5,"y":112},{"x":5.5,"y":124},{"x":6,"y":108},{"x":6.5,"y":100},{"x":7,"y":116},{"x":7.5,"y":94},{"x":8,"y":88},{"x":8.5,"y":82}],"geoms":["point","line"],"x":"price","y":"rentals","code":{"point":"ggplot(demo, aes(price, rentals)) +\n  geom_point()","line":"ggplot(demo, aes(price, rentals)) +\n  geom_line()"}}

=== step === concept
::eyebrow Why it matters
## When accuracy is not enough

A model can be accurate and still be unusable. Sam's pricing tool will be read by staff who set prices every morning, and it has to obey a rule they already know in their bones: higher price, never more demand. A model that breaks that rule, even once, even when it scores well, gets switched off, because nobody trusts a tool that contradicts common sense.

This is not special to bikes. Across many fields there is a feature whose direction is fixed by domain knowledge or by law, and the model is expected to honor it:

| Feature | The rule the business needs | Direction |
|---|---|---|
| Applicant income | a higher income must never lower the approved loan amount | up |
| Insurance risk score | more risk must never lower the premium | up |
| Product price | a higher price must never raise predicted demand | down |
| Years of experience | more experience must never lower predicted pay | up |

A **monotonic constraint** is how you tell a model to obey one of these rules. It forces the prediction to move in only one direction as a chosen feature increases, no matter what wobble the training data happens to show.

=== step === widget
::eyebrow See the problem
## The model can point the wrong way

A booster has no idea that price should only push demand down. It just fits the data, and Sam's data, like all real data, is noisy: by chance the kiosks rented a few extra bikes on some pricier days. A flexible model traces those bumps faithfully. Here is the line a high-capacity model draws through Sam's points. Follow it left to right and watch it climb in two places where it should only fall.

::widget chart-plotter {"data":[{"x":3,"y":150},{"x":3.5,"y":142},{"x":4,"y":134},{"x":4.5,"y":120},{"x":5,"y":112},{"x":5.5,"y":124},{"x":6,"y":108},{"x":6.5,"y":100},{"x":7,"y":116},{"x":7.5,"y":94},{"x":8,"y":88},{"x":8.5,"y":82}],"geoms":["line","point"],"x":"price","y":"rentals","code":{"line":"ggplot(demo, aes(price, rentals)) +\n  geom_line()","point":"ggplot(demo, aes(price, rentals)) +\n  geom_point()"}}

Let us confirm it in R, not just by eye. We build Sam's twelve price experiments, fit an unconstrained regression tree (the kind of fully flexible learner a booster stacks up), and ask R where the fitted demand RISES as price rises. Each lesson runs in a fresh R session, so we build the data right here.

```r
library(rpart)

# Sam tested 12 daily rental prices and logged the average bikes rented at each.
trials <- data.frame(
  price   = c(3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5),
  rentals = c(150, 142, 134, 120, 112, 124, 108, 100, 116,  94,  88,  82)
)

# An unconstrained model, free to fit every bump (a deep tree interpolates the points).
tree <- rpart(rentals ~ price, data = trials,
              control = rpart.control(cp = 0, minsplit = 2, minbucket = 1, xval = 0))
trials$fit_free <- predict(tree, trials)

# At which price steps does predicted demand RISE? (a pricing tool should never do this)
which(diff(trials$fit_free) > 0)
#> [1] 5 8
```

Steps 5 and 8 are the price moves $5.00 -> $5.50 and $6.50 -> $7.00. At both, the unconstrained model predicts MORE rentals for a HIGHER price. That is the bug a business cannot ship.

=== step === concept
::eyebrow The definition
## What "monotonic" means, exactly

"Monotonic" just means moving in one direction only. A model is **monotonically non-decreasing** in a feature if increasing that feature never decreases the output, and **monotonically non-increasing** if increasing the feature never increases the output. The word to notice is "never": the prediction is allowed to stay flat, but it may not reverse.

Write the model's prediction as \(f(x)\), where \(x\) is the feature we care about (the price) and every other feature is held fixed. A non-increasing constraint on price is the promise

\[ x' \ge x \;\Rightarrow\; f(x') \le f(x). \]

Read it in words: take any two prices and call the higher one \(x'\); then the predicted rentals at the higher price, \(f(x')\), are at most the rentals at the lower price, \(f(x)\). Flip the inequality to \(f(x') \ge f(x)\) and you have the non-decreasing version, the one income and experience need.

[KEY INSIGHT]
A constraint fixes the DIRECTION of a feature's effect, never its size. It does not say "demand falls fast" or "by this much"; it only forbids the effect from ever pointing the wrong way. The data still decides the magnitude.

=== step === quiz
::eyebrow Check yourself
## What does the constraint promise?

Sam adds a monotonic constraint to the price feature in his rental model. Which statement is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Non-increasing on price: raising the price can never increase the predicted rentals, though they may stay flat ::ok Exactly. The constraint forbids the prediction from rising as price rises; a plateau (equal) is allowed, only a reversal is banned. It fixes direction, not size.
- Non-decreasing on price, so the tool predicts more rentals at higher prices and matches the revenue goal ::no That points the wrong way. Higher revenue is a business goal, but demand still falls as price rises; constraining price to increase demand would bake a falsehood into the model.
- It does not matter which direction you pick, because the constraint just makes the model fit Sam's past data more closely ::no Direction is the whole point, and a constraint does not improve the fit to past data. It usually fits slightly worse in-sample; what it buys is a trustworthy direction, not accuracy.

=== step === concept
::eyebrow The fix
## Force the direction with isotonic regression

To SEE a constraint work, reach for the simplest possible monotone fitter: **isotonic regression**. Give it the points and a required direction and it returns the closest staircase that never reverses, by pooling any run of points that violates the direction into one flat level. In base R that is `isoreg`. It fits a non-decreasing step function, so to make demand non-increasing in price we flip the sign of rentals, fit, then flip back.

```r
# Force the fit to be NON-INCREASING in price (pool any upward bump into a flat step).
iso <- isoreg(trials$price, -1 * trials$rentals)   # isoreg fits NON-DECREASING; -y reverses it
trials$fit_mono <- -iso$yf

round(trials$fit_mono, 1)
#>  [1] 150 142 134 120 118 118 108 108 108  94  88  82

# Does the constrained fit ever rise as price rises?
all(diff(trials$fit_mono) <= 0)
#> [1] TRUE
```

The two bumps are gone. Where the raw data climbed (at $5.00 -> $5.50 and $6.50 -> $7.00), isotonic regression pooled the offending pair into a single flat level (118, then 108), so the curve only ever falls or holds. The line below is that constrained fit: same data, but it can no longer point the wrong way.

::widget chart-plotter {"data":[{"x":3,"y":150},{"x":3.5,"y":142},{"x":4,"y":134},{"x":4.5,"y":120},{"x":5,"y":118},{"x":5.5,"y":118},{"x":6,"y":108},{"x":6.5,"y":108},{"x":7,"y":108},{"x":7.5,"y":94},{"x":8,"y":88},{"x":8.5,"y":82}],"geoms":["line","point"],"x":"price","y":"fit","code":{"line":"ggplot(monofit, aes(price, fit)) +\n  geom_line()","point":"ggplot(monofit, aes(price, fit)) +\n  geom_point()"}}

[NOTE]
A real booster does this more cleverly. Instead of fixing predictions after the fact, XGBoost and LightGBM bake the rule into training: at every split they reject any cut that would push the prediction the wrong way. Same guarantee, but enforced as the trees grow, which usually costs less accuracy than repairing the output afterward. Isotonic regression is just the quickest way to feel the idea and run it yourself.

=== step === tryit
::eyebrow Your turn
## Reverse the direction

The goal below is the same constrained fit, but the sign trick is missing. `isoreg` always fits a NON-DECREASING step. To force demand to be NON-INCREASING in price instead, what do you multiply rentals by before fitting? Fill in the blank.

```r
# Make the isotonic fit NON-INCREASING in price.
iso <- isoreg(trials$price, ____ * trials$rentals)
trials$fit_mono <- -iso$yf
all(diff(trials$fit_mono) <= 0)
```
::check {"regex":"-\\s*1","gate":true,"difficulty":"beginner","ok":"Right. Multiplying by -1 flips the data upside down, so isoreg's non-decreasing fit becomes a non-increasing fit once you negate it back. The check returns TRUE: the fit never rises with price.","no":"You need to flip the sign so a non-decreasing fitter produces a non-increasing curve. Multiply rentals by -1."}
::solution
```r
iso <- isoreg(trials$price, -1 * trials$rentals)
trials$fit_mono <- -iso$yf
all(diff(trials$fit_mono) <= 0)
```

=== step === concept
::eyebrow The cost
## The accuracy-for-trust trade

Forcing a direction is not free. The unconstrained model could bend to every point, including the noise; the constrained one gives up those two bumps, so it fits the training data a little less tightly. You can measure the gap exactly.

```r
rmse <- function(a, b) sqrt(mean((a - b)^2))

c(unconstrained = rmse(trials$rentals, trials$fit_free),
  monotone      = rmse(trials$rentals, trials$fit_mono))
#> unconstrained      monotone
#>      0.000000      4.082483
```

The unconstrained model nails the training data (zero error) because it memorized every wobble. The monotone model is off by about 4 bikes a day in-sample. That 4 bikes is the visible cost of the guarantee.

Here is why it is usually a bargain. Those two upward bumps were almost certainly noise (a higher price cannot truly create demand), so the unconstrained model's extra "accuracy" was just fitting randomness. On NEW days the monotone model often does as well or better, and it never embarrasses you. You traded a sliver of in-sample fit, most of it noise, for a rule you can defend in a meeting.

[WARNING]
Only constrain a feature whose direction you actually know. Temperature is the trap: Sam's rentals climb as it warms toward a pleasant 22 degrees, then FALL in punishing heat, a hump, not a one-way street. Force temperature to be monotone and you would wreck a relationship that is genuinely two-directional. A constraint encodes domain knowledge; use it only where that knowledge is real.

=== step === concept
::eyebrow In practice
## Doing it in a real booster

You will not hand-roll isotonic fits in production. Every modern booster takes a `monotone_constraints` setting: one entry per feature, where `1` means "may only increase the prediction," `-1` means "may only decrease it," and `0` means "no constraint." The library then enforces it at every split while the trees grow. Here is Sam's pricing model in XGBoost, with price pinned to decrease and the other features left free. (XGBoost is not available in this in-browser R, so run this one in your own R session.)

```r-static
library(xgboost)

# Feature columns, in order: price, temp, weekend.
# price may ONLY decrease the prediction; temp and weekend stay unconstrained.
params <- list(
  objective = "reg:squarederror",
  eta = 0.05, max_depth = 4,
  monotone_constraints = "(-1,0,0)"   # one entry per feature, in column order
)

fit <- xgb.train(params, data = xgb.DMatrix(X, label = y), nrounds = 400)
```

LightGBM is the same idea with `monotone_constraints = c(-1, 0, 0)` passed in its `params`. The order of that vector follows your feature columns, so a misplaced entry silently constrains the wrong feature: always line it up against your column order and sanity-check the fitted effect afterward.

[KEY INSIGHT]
A constraint is a promise you make on the business's behalf, not something the data asks for. Set it only for features with a known, defensible direction (price, income, risk, dose), leave everything else at 0, and you get a model that is both accurate and trusted.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [XGBoost: Monotonic Constraints](https://xgboost.readthedocs.io/en/stable/tutorials/monotonic.html) - the official how-to for the `monotone_constraints` setting you met here, with worked pictures.
- [LightGBM: monotone_constraints parameter](https://lightgbm.readthedocs.io/en/latest/Parameters.html) - the same constraint in LightGBM, plus `monotone_constraints_method` for how strictly it is enforced.
- [R documentation: isoreg (isotonic regression)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/isoreg.html) - the base-R monotone fitter you ran, and the pool-adjacent-violators idea behind it.
- [Gupta et al. (2016), Monotonic Calibrated Interpolated Look-Up Tables, JMLR 17](https://jmlr.org/papers/v17/15-243.html) - the research case that monotonicity constraints improve trust and often generalization.

=== step === complete
## Lesson 5 complete

You learned to control the DIRECTION of a model, not just its accuracy. A monotonic constraint forces a feature's effect to move one way only. You saw an unconstrained booster point the wrong way on Sam's noisy price data, fixed it with isotonic regression in R, and read the small in-sample cost (about 4 bikes a day) that bought a rule the business can trust. In production you set it with `monotone_constraints`, one entry per feature, only for directions you actually know.

Next, Lesson 6: Quantile Regression Forests and Prediction Intervals. Every model so far has handed back a single number. Next you will predict a RANGE instead, a low-to-high interval that says how sure the model is, which is often what a real decision needs.

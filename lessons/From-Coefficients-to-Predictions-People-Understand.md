---
title: "Linear Regression, Properly Lesson 8: From coefficients to predictions people understand"
catalog_blurb: "How to turn a fitted model into a prediction, an interval, and an effect."
description: "A food delivery model becomes a predicted time with its interval, a marginal effect that shrinks with distance, and a curve held fixed on rush hour, in R."
keywords: "predicted value, confidence interval, prediction interval, marginal effect, held-fixed prediction, partial dependence, predict.lm, linear regression, R"
post_type: "LESSON"
curriculum_id: "4.60.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "8"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: ""
course_prev: "Transformations-That-Earn-Their-Keep.html"
---

=== step === cover
## From coefficients to predictions people understand

Today let's turn a fitted regression model into the three things people actually ask for once it exists: a predicted number, a range around that number, and a picture of how the number moves as one input changes.

Here is a food delivery dispatcher looking back at the last 60 deliveries. For each one, three things were recorded: how far it travelled, in km, whether it happened during rush hour, and how long it took, in minutes.

A model has already been fit to this data, one that predicts delivery_time from distance_km, distance_km squared, and rush_hour. This lesson starts from that fitted model, not from fitting it. Here is what the 60 deliveries look like.

::widget chart-plotter {"data": [{"x":18.4,"y":37.3},{"x":18.8,"y":41.7},{"x":6.4,"y":33.1},{"x":16.8,"y":40.3},{"x":13.2,"y":35.6},{"x":10.9,"y":41.9},{"x":15,"y":48.2},{"x":3.6,"y":14.8},{"x":13.5,"y":32.2},{"x":14.4,"y":33.6},{"x":9.7,"y":39.8},{"x":14.7,"y":37.5},{"x":18.8,"y":46.7},{"x":5.9,"y":23},{"x":9.8,"y":26.7},{"x":18.9,"y":34.1},{"x":19.6,"y":44},{"x":3.2,"y":22.8},{"x":10,"y":28.8},{"x":11.6,"y":31.4},{"x":18.2,"y":41.8},{"x":3.6,"y":27.1},{"x":19.8,"y":39.2},{"x":19,"y":40.1},{"x":2.6,"y":13.6},{"x":10.8,"y":41.1},{"x":8.4,"y":38},{"x":18.2,"y":34.9},{"x":9.5,"y":39.6},{"x":16.9,"y":41.2},{"x":15,"y":30},{"x":16.4,"y":40.7},{"x":8.4,"y":37.4},{"x":14,"y":34.2},{"x":1.1,"y":20},{"x":16.8,"y":44.1},{"x":1.1,"y":20.3},{"x":4.9,"y":27.2},{"x":18.2,"y":37.8},{"x":12.6,"y":36.6},{"x":8.2,"y":38.2},{"x":9.3,"y":27.4},{"x":1.7,"y":17.1},{"x":19.5,"y":34.1},{"x":9.2,"y":42.1},{"x":19.2,"y":39.6},{"x":17.9,"y":33.8},{"x":13.2,"y":31.2},{"x":19.4,"y":42.4},{"x":12.8,"y":35.1},{"x":7.3,"y":36.3},{"x":7.6,"y":29.1},{"x":8.6,"y":26.8},{"x":15.9,"y":44.5},{"x":1.7,"y":11},{"x":15.2,"y":43.4},{"x":13.9,"y":30.9},{"x":4.3,"y":24.1},{"x":6,"y":20.2},{"x":10.8,"y":30.8}], "geoms": ["point"], "x": "distance_km", "y": "delivery_time"}

Distance and delivery time climb together, but the climb curves rather than sitting on one straight line. And at almost any distance, the points split into two loose bands, one sitting above the other by about the same gap throughout: rush hour's effect, visible before anything has even been fitted to it.

=== step === concept
## The fitted model you are handed

A model like this is usually handed to you already fit. Someone, maybe you last week, maybe a colleague, ran `lm()` on these 60 deliveries and saved the result. Build that same model once here, so it is ready to reuse without rebuilding it.

```r
# Build the 60 deliveries you have been handed, and the model fit to them
set.seed(42)
distance_km <- round(runif(60, 1, 20), 1)
rush_hour <- sample(rep(c(0, 1), length.out = 60))
delivery_time <- round(9 + 2.7 * distance_km - 0.065 * distance_km^2 + 8.5 * rush_hour + rnorm(60, 0, 3), 1)
deliveries <- data.frame(distance_km, rush_hour, delivery_time)

fit <- lm(delivery_time ~ distance_km + I(distance_km^2) + rush_hour, data = deliveries)
round(coef(fit), 4)
round(summary(fit)$r.squared, 4)
#>      (Intercept)      distance_km I(distance_km^2)        rush_hour 
#>           9.0755           2.7705          -0.0726           8.4682 
#> [1] 0.9024
```

Four numbers came out of that fit, and this lesson is not about how `lm()` found them. It is about what to do with them once you have them.

9.08 is the intercept: what the model would predict at distance_km = 0 and rush_hour = 0. It mostly exists to make the arithmetic work, not a number you would quote to anyone.

2.77 is the coefficient on distance_km. On its own, it would say that every extra km adds 2.77 minutes. But `I(distance_km^2)` also has a coefficient, -0.0726, so distance_km's effect on delivery_time is not one fixed number. It curves: the squared term chips away a little more from each extra km's gain as distance_km grows.

8.47 is the coefficient on rush_hour: a delivery that happens during rush hour (rush_hour = 1) gets 8.47 more minutes added to its prediction than an identical delivery outside rush hour (rush_hour = 0), at any distance. That constant, 8.47, is the gap between the two bands you noticed in the scatter plot a moment ago.

R-squared is 0.9024: the model explains about 90% of how delivery_time varies across these 60 deliveries. That is a good fit, and it is also not what this lesson is about. Everything from here is about reading predictions, intervals, and effects out of a model you are handed, already fit, already checked.

=== step === concept
## A predicted value is one formula, plugged in once

Say a courier is about to leave for a 12 km delivery, during rush hour. What does the model say that delivery will take?

A linear model's prediction is just its formula, with the actual covariate values plugged in. Here, distance_km = 12 and rush_hour = 1, and distance_km squared is 12 squared, 144.

```r
# Predict delivery_time by hand with the rounded coefficients, then exactly with predict()
new_delivery <- data.frame(distance_km = 12, rush_hour = 1)
by_hand <- 9.08 + 2.77 * 12 - 0.073 * 12^2 + 8.47
round(by_hand, 4)
round(unname(predict(fit, new_delivery)), 4)
#> [1] 40.278
#> [1] 40.3365
```

Doing it by hand with the coefficients rounded to 2 or 3 decimals gets 40.278. Calling `predict()` on the model itself gets 40.3365, a difference of about 0.06. That gap is not an error in either number.

It comes from rounding -0.0726 down to -0.073 and then multiplying it by 144: a tiny rounding error on the coefficient gets magnified by the squared term. `predict()` carries every decimal `lm()` actually stored, so it is the number to use for anything that matters. The by-hand version is only there to show where a prediction comes from.

So the model predicts about 40.34 minutes for this delivery. That is one number. What else should sit next to it?

=== step === concept
## Naming the two intervals around that number

40.34 minutes is the model's single best guess. But a single number hides two different questions a dispatcher might actually be asking, and they have different answers.

Question one: on average, how long does a 12 km, rush-hour delivery take? That is a question about the mean, the average over every delivery that could happen at this exact distance_km and rush_hour. The answer is a confidence interval.

Question two: how long will this one delivery, happening right now, actually take? That is a question about a single new observation, not an average. The answer is a prediction interval.

```r
# Two different intervals, from the same model, at the same covariate setting
round(predict(fit, new_delivery, interval = "confidence"), 2)
round(predict(fit, new_delivery, interval = "prediction"), 2)
#>     fit   lwr   upr
#> 1 40.34 39.08 41.59
#>     fit   lwr   upr
#> 1 40.34 34.66 46.02
```

The fitted value, 40.34, is the same both times, because both intervals are built around that same predicted value. But the confidence interval runs from 39.08 to 41.59, a width of about 2.5 minutes. The prediction interval runs from 34.66 to 46.02, a width of over 11 minutes, more than four times as wide.

Confusing the two is a common mistake. The confidence interval answers "how precisely do we know the average," and that is a narrow question with a narrow answer. The prediction interval answers "where could one real delivery land," and real deliveries scatter around the average by more than the average's own uncertainty does. Why is the gap this big, and not some other size?

=== step === widget
## Watching the two bands pull apart

Before sliding anything, make a prediction of your own. As the sample size behind a regression grows, say from 8 points to 300, what happens to the confidence band around the fitted line? What happens to the prediction band?

The widget below runs on its own simulated data, points scattered around a straight line, not the 60 deliveries above. But it asks the exact same confidence-versus-prediction question, with a slider on the one thing that differs: how much data went into the fit.

::widget regression-intervals {}

Push the sample-size slider from low to high. The green confidence band collapses in toward the line as n grows: more data pins down where the true average line sits, more and more precisely. The orange prediction band barely moves. A single new point still scatters around the line by roughly the same amount no matter how many points went into fitting it, because that scatter comes from noise more data cannot shrink.

60 deliveries already sits well inside this widget's range. So the confidence interval here, 39.08 to 41.59, is already narrow, and collecting far more deliveries would narrow it further, the same way the green band does above. But the prediction interval, 34.66 to 46.02, would not shrink nearly as much, the same way the orange band does not. Something other than sample size is keeping it that wide.

=== step === concept
## Why the prediction interval is wider, derived not asserted

That something else has a name: the residual variance, the leftover noise in delivery_time that distance_km, distance_km squared, and rush_hour never explain. Every prediction interval has to account for it. A confidence interval does not, because a confidence interval only asks about an average, and noise averages out. A single new delivery gets no such benefit.

This is not just a story about bands. It is an exact identity. The variance of a prediction for one new delivery equals the variance of the fitted mean plus the residual variance:

\[ \text{Var}(y_{\text{new}}) = \text{Var}(\hat{y}_{\text{mean}}) + \sigma^2 \]

\(\sigma^2\) here is the residual variance: how much delivery_time still bounces around the fitted line after accounting for distance_km and rush_hour. Check the identity against this model's own two intervals.

```r
# Back out each interval's own standard error, then compare their squares against sigma^2
tcrit <- qt(0.975, df = fit$df.residual)
round(tcrit, 4)

ci <- predict(fit, new_delivery, interval = "confidence")
pi_new <- predict(fit, new_delivery, interval = "prediction")
se_ci <- (ci[1, "upr"] - ci[1, "fit"]) / tcrit
se_pi <- (pi_new[1, "upr"] - pi_new[1, "fit"]) / tcrit
round(c(se_ci = se_ci, se_pi = se_pi), 4)
round(c(se_ci_sq = se_ci^2, se_pi_sq = se_pi^2), 4)

sigma_sq <- summary(fit)$sigma^2
round(sigma_sq, 4)
round(se_pi^2 - se_ci^2, 4)
#> [1] 2.0032
#>  se_ci  se_pi 
#> 0.6264 2.8355 
#> se_ci_sq se_pi_sq 
#>   0.3924   8.0399 
#> [1] 7.6475
#> [1] 7.6475
```

Working backward from each interval's half-width gives the standard error each one is built on: 0.6264 minutes for the confidence interval, 2.8355 minutes for the prediction interval. Squaring those turns them into variances, 0.3924 and 8.0399. And 8.0399 minus 0.3924 is 7.6475, which is exactly `sigma_sq`, the residual variance this model estimates entirely on its own, computed independently of either interval.

So the prediction interval is not wider because of anything special about this model, or about distance_km = 12. It is wider because a prediction interval carries everything the confidence interval carries, 0.39 of variance about where the average sits, plus one new delivery's own irreducible noise, 7.65 more. Add those two variances and take the square root, and you get the prediction interval's own standard error, 2.84 minutes. That is a derivation, not a rule to memorize.

=== step === quiz
## Quick check: where the extra width comes from

The prediction interval at distance_km = 12, rush_hour = 1 is 11.36 minutes wide; the confidence interval at the exact same point is only 2.51 minutes wide. Where does that extra width actually come from?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The sample size, n = 60, is too small; a bigger sample would close most of the gap between the two intervals. ::no
- The prediction interval adds the residual variance of one new delivery, 7.65, on top of the confidence interval's own variance, 0.39. ::ok Exactly. 0.39 plus 7.65 is 8.04, the prediction interval's own variance, verified against sigma squared a moment ago. Growing n would shrink the 0.39 further, but the 7.65 stays, because it is the model's own leftover noise, not a measurement of how much data went in.
- rush_hour is a 0/1 variable, and including it in the model widens any interval it touches. ::no Not quite. Growing n toward 300 would shrink the confidence interval further, the same way the green band in the widget collapsed, but the prediction interval stays anchored near sigma, because its width is set by the model's own residual noise, not by sample size. And rush_hour being 0 or 1 plays no special role here: a continuous predictor would widen the prediction interval by exactly the same residual-variance term. The extra width is the residual variance of one new delivery, added on top of the confidence interval's own variance.

=== step === concept
## A marginal effect: what one more km costs, as a difference

distance_km's coefficient, 2.77, is not "the effect of one more km." Because of the squared term, the actual effect of one more km depends on where you measure it. The honest way to ask "what does one more km cost, in minutes" is to predict twice and subtract: predict at distance_km, predict at distance_km + 1, and take the difference. That difference is a marginal effect.

```r
# Compute the marginal effect of one more km near distance_km=5 and near distance_km=15
near5 <- predict(fit, data.frame(distance_km = c(5, 6), rush_hour = 1))
round(unname(near5), 2)
round(unname(near5[2] - near5[1]), 2)

near15 <- predict(fit, data.frame(distance_km = c(15, 16), rush_hour = 1))
round(unname(near15), 2)
round(unname(near15[2] - near15[1]), 2)
#> [1] 29.58 31.55
#> [1] 1.97
#> [1] 42.77 43.29
#> [1] 0.52
```

Near distance_km = 5, going from 5 to 6 km raises the prediction from 29.58 to 31.55 minutes, a marginal effect of 1.97 minutes for that one extra km. Near distance_km = 15, going from 15 to 16 raises it from 42.77 to only 43.29, a marginal effect of just 0.52 minutes.

Same model, same coefficient of 2.77 on distance_km. But the actual cost of one more km is almost four times bigger early in a trip than it is late in one. The negative coefficient on distance_km squared, -0.0726, is what does this: it grows in size faster than the positive linear term as distance_km increases, bending the curve over, so each additional km buys less of a rise in delivery_time than the one before it.

[NOTE]
A coefficient on a nonlinear term is not itself a marginal effect. The marginal effect is always the difference between two predictions, and it has to be computed at a stated covariate setting, because it can be a different number at a different setting.

=== step === concept
## The predicted curve across the whole range, rush hour held fixed

One marginal effect is a difference between two predictions. The full picture is what the model predicts across every distance_km from 1 to 20, with rush_hour held at one fixed value. That is what a "held-fixed" prediction curve actually is: everything else in the model stays put, and only one predictor sweeps across its range.

The widget below builds this same kind of curve for a different fitted model, with two predictors, not this lesson's deliveries. It sweeps one feature, predicts for every row at each point along the sweep, and averages those predictions into one curve, what statisticians call a partial-dependence curve. The faint individual-row predictions behind that average are each called an ICE curve.

::widget pdp-curve {}

Each faint line above is one row's prediction as that example's feature sweeps across its range; the bold line is their average. Here, with only one predictor swept and the other held fixed at a single value for the whole sweep, every row's prediction would move identically, so there would be nothing to average over. That is the version built below, on distance_km itself.

```r
# Sweep distance_km from 1 to 20, holding rush_hour fixed at each of its two values, and plot both curves
grid1 <- data.frame(distance_km = 1:20, rush_hour = 1)
grid0 <- data.frame(distance_km = 1:20, rush_hour = 0)
pred1 <- predict(fit, grid1)
pred0 <- predict(fit, grid0)

plot(grid1$distance_km, pred1, type = "l", lwd = 2, col = "darkorange",
     ylim = range(c(pred1, pred0)), xlab = "distance_km", ylab = "predicted delivery_time")
lines(grid0$distance_km, pred0, lwd = 2, col = "steelblue")
legend("bottomright", legend = c("rush_hour = 1", "rush_hour = 0"),
       col = c("darkorange", "steelblue"), lwd = 2)

round(c(start = unname(pred1[1]), end = unname(pred1[20])), 2)
round(c(start = unname(pred0[1]), end = unname(pred0[20])), 2)
round(range(pred1 - pred0), 4)
#> start   end 
#> 20.24 43.92 
#> start   end 
#> 11.77 35.45 
#> [1] 8.4682 8.4682
```

The orange curve, rush_hour held at 1, rises from 20.24 minutes at distance_km = 1 to 43.92 at distance_km = 20, climbing fast at first and flattening out later, exactly the shrinking marginal effect from a moment ago. The blue curve, rush_hour held at 0, has the same shape, rising from 11.77 to 35.45.

Look at the gap between the two curves instead of either one on its own. It is 8.4682 minutes at distance_km = 1, and still 8.4682 minutes at distance_km = 20. `range()` of that gap across every single distance_km from 1 to 20 is just that one number, twice. That constant gap is exactly the rush_hour coefficient.

It stays constant because rush_hour enters the model additively, with no term that lets it interact with distance_km. Holding rush_hour fixed and sweeping distance_km shows you distance_km's own shape, and switching which value rush_hour is fixed at only slides that same shape up or down by 8.4682, never bending it.

=== step === quiz
## Closing quiz: reading the marginal effect

A moment ago, one more km raised the prediction by 1.97 minutes near distance_km = 5, but only by 0.52 minutes near distance_km = 15, with rush_hour fixed at 1 in both cases. What in the fitted model actually explains why that marginal effect shrinks as distance_km grows?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- rush_hour changes partway through a 15 km delivery, pulling the later part of the trip down. ::no
- The negative coefficient on distance_km squared, -0.0726, curves the fit, so each additional km adds less to the prediction than the one before it. ::ok Exactly. The I(distance_km^2) term's negative coefficient grows in size faster than the positive 2.77 on distance_km as distance_km increases, bending the curve over. That is the entire reason one more km is worth 1.97 minutes near distance_km=5 and only 0.52 near distance_km=15.
- The model grows less accurate at longer distances, so predictions late in the trip carry more error. ::no Not quite. rush_hour is set once in the data frame handed to predict(), to either 0 or 1, for the whole delivery; it has no way to change partway through a trip. And R-squared and the residual standard error are both single numbers computed once for the whole model; they do not vary by distance_km, so the model is not somehow less accurate at longer distances. What actually changes with distance_km is the curve's own slope, which the negative coefficient on distance_km squared controls directly.

=== step === tryit
## Your turn: predict a delivery the model has not seen

A new delivery comes in: distance_km = 16, during normal traffic, so rush_hour = 0. Build its data frame the same way you did earlier for the 12 km delivery, and this time ask for the prediction interval, since you want to know where this ONE delivery could land, not the average.

```r
# Predict delivery_time for a new delivery the model has not seen, with its interval
new_delivery2 <- data.frame(distance_km = 16, rush_hour = 0)

# Your turn: call predict() on new_delivery2 with interval = "prediction"
```
::check {"regex": "(?=[\\s\\S]*predict[(])(?=[\\s\\S]*new_delivery2)(?=[\\s\\S]*interval\\s*=\\s*[\"']prediction[\"'])", "gate": true, "difficulty": "intermediate", "ok": "Right: a fitted value of 34.82 minutes, with a prediction interval of 29.16 to 40.48. A bare 34.82 would have been the whole answer earlier in this lesson; here the interval is what actually tells the dispatcher how much this one real delivery could still miss it by.", "no": "Call predict() the same way you did for the 12 km delivery: predict(fit, new_delivery2, interval = \"prediction\"). new_delivery2 is already built above, so this is the one line you need."}
::solution
```r
# Call predict() with interval = "prediction" to get the fitted value and both bounds
round(predict(fit, new_delivery2, interval = "prediction"), 2)
#>     fit   lwr   upr
#> 1 34.82 29.16 40.48
```

=== step === concept
## References

- Faraway, J. J. "Linear Models with R." CRC Press. The prediction chapter, on the difference between a confidence interval for the mean and a prediction interval for a new observation.
- [predict.lm: Predict method for Linear Model Fits](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - R Core Team. The documentation for `predict()`, used throughout this lesson for both intervals and both marginal-effect comparisons.
- [lm: Fitting Linear Models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - R Core Team. The documentation for `lm()`, the function this lesson's model was fit with.
- [TDist: The Student t Distribution](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html) - R Core Team. The documentation for `qt()`, used to convert each interval's half-width into a standard error.
- Greene, W. H. "Econometric Analysis." The chapter on computing a marginal effect from a fitted model when a predictor enters nonlinearly, exactly the distance_km and distance_km squared case in this lesson.

=== step === complete
## What a fitted model actually gives you

Three things, each with a number from this lesson's own model.

- A predicted value with the right interval. At distance_km = 12, rush_hour = 1, the model predicts 40.34 minutes. The confidence interval for the average is 2.51 minutes wide; the prediction interval for one new delivery is 11.36 minutes wide, because it carries the residual variance on top of the confidence interval's own.
- A marginal effect that depends on where you evaluate it. One more km adds 1.97 minutes near distance_km = 5, but only 0.52 minutes near distance_km = 15, because the negative coefficient on distance_km squared curves the fit.
- A held-fixed curve, shaped by one predictor at a time. Sweeping distance_km from 1 to 20 at a fixed rush_hour traces the curve distance_km alone produces; switching rush_hour to its other value only slides that curve by a constant 8.4682 minutes, never bends it.

A coefficient table is where a fitted model starts. These three are what most people actually came for.

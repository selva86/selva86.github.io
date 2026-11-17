---
title: "Probability and Estimation Lesson 6: Point estimates and the standard error"
catalog_blurb: "What makes an estimator good, and why precision grows slower than sample size."
description: "Score two competing estimators of a rate by bias, variance and mean squared error, then see why a standard error shrinks more slowly as the sample grows."
keywords: "point estimate, estimator, bias, variance, mean squared error, standard error, Laplace's rule of succession, R"
post_type: "LESSON"
curriculum_id: "4.10.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-probability"
course_title: "Probability and Estimation, from the ground up"
course_lesson: "6"
course_total: "7"
course_landing: "Probability-and-Estimation-Course.html"
course_next: "Confidence-Intervals-by-Bootstrap.html"
course_prev: "The-Sampling-Distribution-of-a-Statistic.html"
---

=== step === cover
## Point estimates and the standard error

Today let's work out what makes one way of estimating a number better than another, and how far you can actually trust the single number a sample hands you.

Devi runs a small bakery that is testing a new sourdough loaf. She sets out free samples by the register and tracks who comes back to actually buy a loaf. Here is what happened with today's 20 tasters: a 1 for a taster who bought, a 0 for a taster who only tried the sample.

::widget chart-plotter {"data":[{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":1},{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":1},{"x":10,"y":0},{"x":11,"y":0},{"x":12,"y":0},{"x":13,"y":1},{"x":14,"y":1},{"x":15,"y":1},{"x":16,"y":0},{"x":17,"y":0},{"x":18,"y":0},{"x":19,"y":0},{"x":20,"y":0}],"geoms":["bar"],"x":"taster","y":"bought","code":{"bar":"ggplot(tasters, aes(factor(taster), bought)) +\n  geom_col()"}}

5 of the 20 tasters bought a loaf today, a rate of 0.25. Is that number something Devi can lean on, or could a different batch of 20 tasters on a different day have handed her something else entirely?

=== step === concept
::prose-only the three terms applied to the cover's own number, 0.25
## An estimate, an estimator, and the parameter they all describe

Three words are about to do a lot of work in this lesson: estimate, estimator, and parameter. The cover's single number, 0.25, is a good place to pin all three down before going any further.

The parameter is the thing you actually want to know: Devi's true buy rate, the share of tasters who would buy a loaf if she could offer the sample to every possible taster she will ever see. For a real bakery, nobody ever gets to see that number directly. For this lesson, since it is a simulation Devi ran on purpose, the parameter is fixed at 0.30.

Hang onto that number: the whole lesson is about to measure how close different rules land to it, and how much each one wobbles while doing so.

The estimator is the rule itself: count how many of the sampled tasters bought a loaf, then divide by how many tasters were sampled. That rule, buyers divided by sample size, is written x over n and usually called phat, said "p hat". It works on any sample Devi could draw, not just today's 20.

The estimate is what that rule gives you once you plug in real numbers. Devi's rule on today's 20 tasters gives 5 over 20, which is 0.25. That is the estimate: one number, tied to one particular sample, standing in for a parameter you cannot see directly.

=== step === concept
## A second way to estimate the same rate

phat is not the only rule you could use on the same sample. Here is a second one, called Laplace's rule of succession: add one buyer and one non-buyer to the count before dividing, so the rule becomes x plus 1, over n plus 2. Starting every estimate off already counting one buyer and one non-buyer nudges it a little toward 0.5, an effect that matters most when a sample is small.

Compute both rules on Devi's actual 20 tasters.

```r
# Draw today's 20 tasters and compute both estimators of the true buy rate
set.seed(11)
bought_today <- rbinom(20, 1, 0.30)
x <- sum(bought_today)
n <- length(bought_today)
phat <- x / n
laplace_today <- (x + 1) / (n + 2)
x
#> [1] 5
phat
#> [1] 0.25
round(laplace_today, 4)
#> [1] 0.2727
```

`rbinom(20, 1, 0.30)` draws 20 independent 0s and 1s, each one a 1 with probability 0.30, standing in for Devi's 20 tasters at her true buy rate. `x` counts how many bought, 5, and `phat` comes out to 5 over 20, the same 0.25 today's tasters already gave. `laplace_today` works out to 0.2727, the rule of succession's answer on the exact same sample.

Same 20 tasters, two different rules, two different numbers. Neither rule is wrong: they are just different ways of turning one sample into one estimate. The real question is which one actually does a better job, and answering that takes more than a single day's sample.

=== step === concept
## Scoring both estimators by simulating 2000 days

One day of 20 tasters is not enough to say whether a rule is any good, since phat might simply have gotten lucky or unlucky today. To actually score a rule, repeat Devi's 20-taster day over and over, apply the rule every time, and see how the results behave across many days, not just one.

Three numbers describe how a rule behaves over many repeats. Bias is how far the rule's average estimate sits from the true parameter, 0.30, so zero bias means the rule is right on average even when any single day misses. Variance is how much the rule's estimate moves from day to day, with a low-variance rule giving similar answers each time even when it is a little off. Mean squared error, MSE, adds the two together, bias squared plus variance, into one number that scores a rule's total error.

Repeat today's 20-taster day 2000 times, apply both rules to every one of those days, and compute bias, variance and MSE for each.

```r
# Repeat today's 20-taster day 2000 times and score both estimators against the true rate of 0.30
set.seed(2026)
sims2000 <- replicate(2000, rbinom(20, 1, 0.30))
x_sims <- colSums(sims2000)
phat_sims <- x_sims / 20
laplace_sims <- (x_sims + 1) / (20 + 2)
true_p <- 0.30

round(c(bias = mean(phat_sims) - true_p, variance = var(phat_sims), mse = mean((phat_sims - true_p)^2)), 4)
#>     bias variance      mse
#>   0.0026   0.0100   0.0100

round(c(bias = mean(laplace_sims) - true_p, variance = var(laplace_sims), mse = mean((laplace_sims - true_p)^2)), 4)
#>     bias variance      mse
#>   0.0205   0.0083   0.0087
```

`sims2000` holds 2000 simulated days of 20 tasters each, every one drawn from the same true rate of 0.30. `x_sims` counts the buyers on each of those days, so `phat_sims` and `laplace_sims` hold 2000 estimates apiece, one pair per simulated day, from the exact same two rules you just ran once by hand.

phat comes out almost exactly unbiased: its average estimate sits just 0.0026 away from the true 0.30, with a variance of 0.0100. The Laplace rule carries a real bias, 0.0205, because starting every estimate off nudged toward 0.5 costs something once the true rate sits below 0.5. But its variance is lower, 0.0083, because that same nudge pulls any one day's wild estimate back toward the middle.

Add bias squared to variance for each rule and you get MSE: 0.0100 for phat, 0.0087 for the Laplace rule. The biased rule actually wins. Its small, steady bias costs far less than the variance it saves, and MSE is what counts both of those costs on equal terms.

=== step === widget
## The bias-variance trade-off, as a dartboard

See that trade-off as a dartboard instead of a table. Each dart is one simulated day's estimate: bias is how far the whole cluster sits from the bullseye on average, and variance is how spread out the darts are around their own centre.

The widget below opens already set to the Laplace rule's own numbers from above, bias 0.0205 and variance 0.0083.

::widget bias-variance-target {"bias":0.0205,"variance":0.0083}

Drag either slider and the readout below updates bias squared, variance, and their sum, MSE, in real time. Push bias down to 0 and watch the darts centre on the bullseye, but keep an eye on MSE too: a perfectly centred cluster that is badly spread out can still score worse than a cluster that sits a little off centre but stays tight, exactly the trade Devi's two rules just made.

=== step === quiz
## Quick check: what happens when an estimator shrinks too much

Here is a third rule for the same question: ignore the sample completely and always report 0.5, no matter what the 20 tasters did. That rule has zero variance, since it never changes, but its bias is fixed at 0.5 minus 0.30, which is 0.2. Squaring that bias alone already gives 0.04, its entire MSE since the variance is zero. Compare that number to phat's 0.0100 and the Laplace rule's 0.0087 from the simulation above.

What happens to an estimator's MSE when it shrinks every estimate toward one fixed number, no matter what the sample shows?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Worse: MSE climbs to 0.04, well above phat's 0.0100 and the Laplace rule's 0.0087, because giving up all the variance cost more than it saved. ::ok Right. Always reporting 0.5 drives variance to exactly 0, but its bias, 0.2, is so large that squaring it alone, 0.04, beats both of the real rules above. Shrinking an estimator too far trades away more than it gains.
- Better, because an estimator with zero variance always beats one that carries any variance at all. ::no
- About the same, since all three rules are still estimating the same true rate from the same kind of sample. ::no Zero variance is not automatically the win it sounds like. MSE adds bias squared to variance, and here the bias is so large, 0.2, that squaring it alone already tops both phat's and the Laplace rule's MSE. Estimating the same parameter does not mean scoring the same on how well you estimate it.

=== step === concept
## The standard error is an estimator's own estimated spread

Step back from the simulation for a second. In real life, Devi only ever gets today's one sample, not 2000 repeats, so she can never compute phat's real bias or variance the way the simulation above just did. What she can still get, from just the one sample in hand, is an estimate of how much phat would move around if she could repeat the day: its standard error.

A standard error is the standard deviation of an estimator's own sampling distribution, the spread you would see across repeats, estimated here from a single sample rather than measured directly. For phat, the formula is the square root of phat times 1 minus phat, over n.

Plug in today's phat, 0.25, and n, 20, and compare it against what the same formula gives using the true rate instead.

```r
# Compare the estimated standard error (built from phat) against the true standard error (built from the true rate)
se_estimated <- sqrt(phat * (1 - phat) / 20)
se_true <- sqrt(true_p * (1 - true_p) / 20)
round(se_estimated, 4)
#> [1] 0.0968
round(se_true, 4)
#> [1] 0.1025
```

`se_estimated`, 0.0968, is what Devi could actually compute, since it only needs phat and n, both of which she already has from today's sample. `se_true`, 0.1025, is the real standard error, the one you only get by plugging in the true rate, 0.30, which Devi never actually sees. The two sit close but are not identical, because `se_estimated` plugs phat in for the true rate it cannot see.

That is what makes a standard error an estimated quantity: built from the one sample you have, standing in for a true spread you cannot compute directly.

=== step === concept
::prose-only algebra beside the numbers already simulated two steps back
## Where the square root of n comes from

Where does that square root of n in the formula actually come from? phat is the mean of n independent 0-or-1 draws, one per taster, and each one of those draws has its own variance. For a single 0-or-1 draw with buy probability p, the variance is p times 1 minus p: with Devi's true rate of 0.30, that works out to 0.30 times 0.70, which is 0.21.

Variances of independent draws add when you sum them, so the sum of all n draws has variance n times 0.21. phat divides that sum by n, and dividing a variance by n divides it by n squared, since variance scales with the square of whatever you multiply the data by. So the sum's variance, n times 0.21, divided by n squared, leaves 0.21 over n, and taking the square root of a variance gives a standard deviation, which is exactly what a standard error is.

Check that against what the simulation actually showed. At n equals 20, the formula gives 0.21 divided by 20, which is 0.0105. The simulated variance for phat, from those 2000 repeated days, was 0.0100, close enough that the algebra and the simulation are clearly describing the same quantity.

=== step === concept
## Why a bigger sample narrows the standard error at a decelerating rate

That 0.21 over n formula has a consequence worth seeing directly: how fast does the standard error actually shrink as Devi collects more tasters? Compute it at four sample sizes, each four times the last.

```r
# Standard error at four sample sizes, each four times the last
sigma2 <- true_p * (1 - true_p)
ns <- c(20, 80, 320, 1280)
se_n <- sqrt(sigma2 / ns)
round(se_n, 4)
#> [1] 0.1025 0.0512 0.0256 0.0128

round(se_n[-length(se_n)] / se_n[-1], 2)
#> [1] 2 2 2
```

Each time n quadruples, from 20 to 80 to 320 to 1280, the standard error only halves: 0.1025, then 0.0512, then 0.0256, then 0.0128. The ratios confirm it exactly, 2 every time. That is the square root doing its work: quadrupling n divides 0.21 over n by 4, and the square root of a quarter is a half, not a quarter.

To cut Devi's standard error in half again from here, she would need four times as many tasters again, not twice as many. Precision keeps improving with a bigger sample, just more slowly than it feels like it should.

=== step === widget
## Watching precision tighten as n grows

The same square-root-of-n law is not special to Devi's buy rate. It governs the standard error of practically any estimate built from a sample, including a very different kind of estimate: a regression line's fitted mean at a given x value.

This next widget switches away from Devi's bakery to its own built-in regression data, because reusing the same law on a second, unrelated quantity is the point: showing it is a general law, not one trick that only works for proportions. Slide n and watch two bands at once, one for the fitted mean and one for predicting a single new point.

::widget regression-intervals {}

The confidence band around the fitted mean narrows as n grows, the exact same square-root-of-n shrinkage you just computed by hand for Devi's proportion. But the prediction band, the range for one new individual point, barely moves. More data pins down where the average line sits, but it does nothing to shrink how much one new observation can scatter around that line. That scatter is a property of the data itself, not something a bigger sample can buy you out of.

=== step === quiz
## Practice: naming the estimate, the estimator and the parameter

Today's same 20 tasters gave two different numbers: phat's 0.25 and the Laplace rule's 0.2727. Which of the following correctly names what those two numbers actually are?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Both are estimates. Each came from applying a different rule, a different estimator, to the exact same sample, so they differ because the rules differ, not because the parameter changed. ::ok Right. The parameter, Devi's true rate of 0.30, never moved. phat and the Laplace rule are two different estimators, and each handed back its own estimate from the same 20 tasters.
- 0.2727 must be the parameter, since it sits closer to the true rate Devi fixed for this simulation. ::no
- Only one of them can be valid, since Devi's buy rate is a single quantity and a quantity can only have one estimate. ::no Neither reading holds up. The parameter is Devi's one true, fixed rate, and nothing a sample produces, however close, turns into the parameter itself. And a single quantity can easily have more than one honest estimate: phat and the Laplace rule are both legitimate estimators, just different rules, so two different numbers from the same sample is expected, not a contradiction.

=== step === tryit
## Your turn: how far a bigger sample shrinks the standard error

Devi expects about 80 tasters next week, four times today's 20. She still does not know her true buy rate, so just like before, she has to plug in phat, 0.25, in place of the unknown p.

Compute the estimated standard error at n = 80, using the same formula as before: the square root of phat times 1 minus phat, over n.

```r
# phat = 0.25 is today's estimate, the best guess available for the unknown true rate.
# Compute the estimated standard error at n = 80 instead of 20:
# sqrt(phat * (1 - phat) / 80)
# One line. Press Check when you have it.
```
::check {"regex": "sqrt[(]\\s*phat\\s*[*]\\s*[(]1\\s*-\\s*phat[)]\\s*/\\s*80\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.0484, almost exactly half of 0.0968. Four times the tasters, half the standard error, the same narrowing the widget above just showed, but never any faster than that square root allows.", "no": "Reuse the standard error formula and swap in 80 for the sample size: sqrt(phat * (1 - phat) / 80)."}
::solution
```r
# Estimated standard error at n = 80, plugging in phat for the unknown true rate
se_80 <- sqrt(phat * (1 - phat) / 80)
round(se_80, 4)
#> [1] 0.0484
```

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Casella, G. and Berger, R., *Statistical Inference* (2nd ed., Chapman and Hall/CRC), Chapter 7.3, bias, variance and mean squared error of a point estimator](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036)
- [Wasserman, L., *All of Statistics* (Springer), Chapter 9, the standard error of an estimator and how it is estimated from data](https://doi.org/10.1007/978-0-387-21736-9)
- Agresti, A. (2013). *Categorical Data Analysis* (3rd ed.). Wiley. Shrinkage and add-constant estimators of a binomial proportion, including Laplace's rule of succession.
- [R documentation for replicate(), rbinom() and var()](https://search.r-project.org/R/refmans/base/html/replicate.html)

=== step === complete
## What today's two estimators showed

Devi's two rules scored the same 20-taster day differently, and that difference is the whole lesson in miniature:

- phat is unbiased but noisier: its average estimate lands almost exactly on the true rate, 0.30, but it carries more variance from day to day.
- The Laplace rule is a little biased but tighter: it drifts toward 0.5, yet that small, steady bias costs less than the variance it saves, so it wins on MSE.
- Always reporting 0.5 shrinks far too hard. Zero variance looks appealing until you square its bias, and that squared bias alone beats both of the real rules.
- A standard error is an estimator's own estimated spread, built from the one sample you have. It falls as sigma over the square root of n, which is why quadrupling your sample only ever halves it.

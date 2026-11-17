---
title: "Estimation and the Bootstrap Lesson 7: Standard errors for transformed estimates"
catalog_blurb: "Multiply a standard error by a slope to get one for a transformed quantity."
description: "Learn the delta method, which turns a standard error you already have into one for a transformed quantity, by multiplying it by the transform's slope."
keywords: "delta method, standard error, Taylor expansion, variance of a transformed estimate, bootstrap, log-odds to probability, logistic regression, R statistics"
post_type: "LESSON"
curriculum_id: "4.20.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "7"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: ""
course_prev: "Estimating-Error-by-Leaving-One-Out.html"
---

=== step === cover
## Standard errors for transformed estimates

Today let's look at a shortcut: how to turn a standard error you already have into one for a completely different quantity, without ever refitting a model.

The curve below belongs to a different problem. A coin is flipped 40 times and lands heads 12 of them. Its peak sits at the estimated chance of heads, and the width of that peak already gives you a standard error for that estimate, read straight off the curve, no separate formula needed.

::widget likelihood-curve {"model": "bern", "n": 40}

That standard error belongs to the coin's rate. But suppose the quantity you actually need is not that rate itself, but some function of it, its reciprocal, say, or its square. Today's method, called the delta method, tells you how to carry that same standard error across to the new quantity. It costs you one number: the slope of that function at the estimate.

=== step === concept
## Why you cannot just start over

A small online store's support desk logs how long the gap is, in minutes, between each of 40 tickets that come in during one shift. Most gaps are short, a minute or two, but a few stretch much longer: the longest, ticket 23, waited 9.99 minutes for the one before it.

Here are all 40 gaps, in the order the tickets arrived.

```r
# Log the gap, in minutes, between each of 40 consecutive support tickets
set.seed(42)
gaps <- round(rexp(40, rate = 0.5), 2)
gaps
#>  [1] 0.40 1.32 0.57 0.08 0.95 2.93 0.63 0.82 2.38 1.43 2.69 4.82 0.19 0.11 2.51
#> [16] 0.62 0.95 1.24 2.49 0.74 9.73 1.33 9.99 0.45 2.42 1.44 2.62 0.56 0.46 2.57
#> [31] 1.14 6.04 1.00 0.71 3.51 1.47 0.06 0.70 0.79 3.80
```

Treat those gaps as draws from an exponential distribution, the standard model for a waiting time between events. Its one parameter is a rate, lambda, tickets per minute, and the usual estimate is one over the mean gap. Compute it, together with its standard error.

```r
# Estimate the ticket arrival rate and its standard error
lambda_hat <- 1 / mean(gaps)
se_lambda <- lambda_hat / sqrt(40)
round(lambda_hat, 4)
#> [1] 0.5085
round(se_lambda, 4)
#> [1] 0.0804
```

So lambda_hat, the estimated rate, is 0.5085 tickets per minute. Its standard error, se_lambda, is 0.0804: that is how much the rate estimate would typically move if the desk logged a different 40-ticket shift. This se_lambda formula, lambda_hat over the square root of n, is the standard asymptotic formula for an exponential rate, the same kind of plug-in estimate you would get from the curvature of its log-likelihood.

But the rate is not what management actually asked for. What they want is the mean number of minutes between tickets, which is 1 over lambda_hat. That quantity is easy enough to get, just flip the rate over. Its standard error is the problem.

You could, in principle, start over: derive a whole new standard error for the mean wait from scratch, the way se_lambda was derived for the rate. For this particular case that path happens to land somewhere clean, you will check it two steps from now. But for most functions of an estimate, no such clean formula exists, and working out a fresh theory of estimation for every new quantity you might want is not something you can afford to do before lunch.

What you already have is lambda_hat and se_lambda. The question today is how to carry that one standard error across to the mean wait, without doing the work twice.

=== step === concept
## The rule: multiply by the slope

Here is the idea behind the delta method, in one line. Close up to an estimate, almost any smooth function looks like a straight line, because that is what a derivative measures: the slope of the best straight-line approximation at a point. Call the function g, and the estimate theta_hat.

If theta_hat moves by about se(theta_hat) from one sample to the next, then near theta_hat, g behaves like a line with slope g_prime(theta_hat). A straight line turns a step of size se(theta_hat) in theta into a step of size g_prime(theta_hat) times se(theta_hat) in g(theta). Taking the absolute value, since a standard error is never negative, gives the delta method's rule:

`SE(g(theta_hat)) = |g_prime(theta_hat)| x SE(theta_hat)`

[KEY INSIGHT]
One multiplication is the whole method. Find the slope of your function at the estimate you already have, take its absolute value, and multiply it by the standard error you already have.

For the support desk, g is the function that turns a rate into a mean wait: g(lambda) = 1 / lambda. Its derivative is g_prime(lambda) = -1 / lambda^2. Nothing is computed yet, just the shape of the rule.

One shortcut that looks tempting here does not actually give you this. Take the rate's own 95% interval, lambda_hat plus or minus 1.96 times se_lambda, and push each endpoint through g. That can hand you an interval for the mean wait, since g is one to one. But it never hands you a standard error you could reuse somewhere else, and once g bends more sharply than a straight line across the width of that interval, the two routes can disagree, because the delta method's interval is forced to sit symmetrically around g(lambda_hat) while the endpoint trick is not.

=== step === quiz
## Quick check: the delta method's rule

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- SE(g(theta_hat)) = g_prime(theta_hat) x SE(theta_hat), with no absolute value. ::no
- SE(g(theta_hat)) = the absolute value of g_prime(theta_hat), evaluated at theta_hat, multiplied by SE(theta_hat). ::ok Exactly. The derivative is evaluated at the estimate itself, its absolute value is taken because a standard error cannot be negative, and that result multiplies the original standard error, nothing more.
- SE(g(theta_hat)) = the absolute value of g_prime, evaluated at SE(theta_hat) instead of at theta_hat, multiplied by SE(theta_hat). ::no
- SE(g(theta_hat)) = g_prime(theta_hat) squared, multiplied by SE(theta_hat). ::no The derivative belongs at the estimate theta_hat, not at the standard error, so the slope describes how g bends right where your data landed. Dropping the absolute value risks a negative standard error, which cannot exist. And squaring the derivative is the rule for a variance, not a standard error: multiply by the derivative once you have taken its absolute value, never square it.

=== step === widget
## Reading the rate's standard error off its curve

The widget below is the same one from the cover, switched to a waiting-time model instead of a coin. Its own built-in waits are rigged to average exactly 2 minutes, a rate of 0.5, not literally the support desk's logged gaps. But that is close enough to lambda_hat, 0.5085, and it runs on the same sample size, 40, so the curve and its readout describe the same kind of estimate the support desk just produced.

::widget likelihood-curve {"model": "expo", "n": 40}

The peak of that curve is the rate estimate, and the readout below it prices a standard error straight from how sharply the curve falls away on either side. Move the sample-size slider up and watch two things happen together: the curve gets narrower, and the standard error it reports shrinks with it. That is the same se_lambda you just computed by formula, read here off the shape of a curve instead.

=== step === concept
## Turning the rate into a mean, by hand

Now put that rule to work on the support desk's own numbers. The function is g(lambda) = 1 / lambda, its derivative is g_prime(lambda) = -1 / lambda^2, and the delta method's rule says to take the absolute value of that derivative at lambda_hat and multiply it by se_lambda.

```r
# Carry the rate's standard error over to the mean wait, g(lambda) = 1 / lambda
g_prime <- 1 / lambda_hat^2
se_mu <- g_prime * se_lambda
mu_hat <- 1 / lambda_hat
ci_mu <- mu_hat + c(-1.96, 1.96) * se_mu
round(g_prime, 4)
#> [1] 3.8671
round(se_mu, 4)
#> [1] 0.3109
round(mu_hat, 4)
#> [1] 1.9665
round(ci_mu, 4)
#> [1] 1.3571 2.5759
```

The slope of 1 / lambda at lambda_hat is 3.8671, already fairly steep, since lambda_hat is well below 1. Multiplying that slope by se_lambda, 0.0804, gives se_mu, 0.3109: the standard error of the mean wait, mu_hat, which works out to 1.9665 minutes. Add and subtract 1.96 times se_mu around mu_hat for an ordinary 95% interval, and you get 1.3571 to 2.5759 minutes. All of that came from two numbers you already had, lambda_hat and se_lambda, and one derivative.

=== step === concept
## Checking the answer against a formula you already trust

There is a second, completely independent way to get a standard error for this same mean wait, and it is worth checking the delta method's answer against it.

mu_hat is not some new quantity. One over lambda_hat is exactly the sample mean of the 40 gaps: flip the rate back over and you land on the same number you started with. For an exponential distribution, the population standard deviation always equals the population mean, so the known textbook standard error for a sample mean here, mu over the square root of n, becomes mu_hat over the square root of n once you plug in the estimate.

```r
# Compare against the exponential's own textbook standard error for its mean
se_mu_known <- mu_hat / sqrt(40)
round(se_mu_known, 4)
#> [1] 0.3109
round(mean(gaps), 4)
#> [1] 1.9665
```

[KEY INSIGHT]
se_mu_known comes out at 0.3109, matching se_mu from the delta method exactly, because both routes are computing the same standard error for the same quantity, just arrived at differently. One used a general rule about slopes that works for any smooth transform. The other used a fact specific to the exponential distribution, that its standard deviation equals its mean. They had to agree.

=== step === widget
## Checking the delta method against a bootstrap

A second check does not lean on any property specific to the exponential at all. Resample the 40 logged gaps with replacement, recompute the mean each time, and read the spread of those resampled means as a standard error, the way the bootstrap always works.

::widget bootstrap-sample {"n": 40, "seed": 42, "tail": "Each badge stands for one of the 40 logged gaps between tickets. Some of them turn up twice or more in a single draw below, and some do not turn up at all."}

Now do that resampling for real, 5,000 times, on the support desk's own 40 gaps.

```r
# Bootstrap the mean wait: resample the 40 gaps and recompute the mean, 5000 times
set.seed(42)
boot_mu <- replicate(5000, mean(sample(gaps, 40, replace = TRUE)))
round(sd(boot_mu), 4)
#> [1] 0.3592
round(quantile(boot_mu, c(0.025, 0.975)), 4)
#>   2.5%  97.5%
#> 1.3354 2.7437
```

The bootstrap standard error, 0.3592, sits close to the delta method's 0.3109, but it is visibly larger. The 95% interval it gives, 1.3354 to 2.7437 minutes, is also wider than the delta method's 1.3571 to 2.5759, especially on the upper end. That is the honest signature of the right skew in these 40 gaps. A few long waits, like the 9.99-minute one, can pull a resampled mean up further than any short wait can pull it down, something the delta method's straight-line approximation has no way to see.

=== step === concept
## A second case: turning an odds into a probability

The delta method is not limited to one transform at a time. Here is a case where it runs twice in a row.

A win-back email campaign targets 150 lapsed customers, and 36 of them come back and buy again. Fit that as a logistic regression with no predictors, which estimates the reactivation rate on the log-odds scale.

```r
# A reactivation campaign: 36 of 150 lapsed customers came back
reactivated <- 36
not_reactivated <- 114
fit <- glm(cbind(reactivated, not_reactivated) ~ 1, family = binomial)
beta0_hat <- coef(fit)[[1]]
se_beta0 <- sqrt(vcov(fit)[1, 1])
round(beta0_hat, 4)
#> [1] -1.1527
round(se_beta0, 4)
#> [1] 0.1912
```

beta0_hat, -1.1527, is the estimated reactivation rate on the log-odds scale, with standard error se_beta0, 0.1912, straight out of the model. Convert that to an odds first. The function is g(x) = exp(x), and its own derivative is exp(x) again, so the slope at beta0_hat is just odds_hat itself.

```r
# Convert the log-odds to an odds: g(x) = exp(x), whose own derivative is exp(x)
odds_hat <- exp(beta0_hat)
se_odds <- odds_hat * se_beta0
round(odds_hat, 4)
#> [1] 0.3158
round(se_odds, 4)
#> [1] 0.0604
```

Now convert that odds to a probability, the function researchers actually want most of the time. The function is g(x) = x / (1 + x), with derivative 1 / (1 + x)^2.

```r
# Convert the odds to a probability: g(x) = x / (1 + x)
p_hat <- odds_hat / (1 + odds_hat)
slope_p <- 1 / (1 + odds_hat)^2
se_p <- slope_p * se_odds
round(p_hat, 4)
#> [1] 0.24
round(se_p, 4)
#> [1] 0.0349
```

p_hat lands on 0.24, exactly the raw reactivation rate, 36 of 150. Its standard error, se_p, is 0.0349. Check that against the known binomial formula for a sample proportion.

```r
# Compare against the textbook standard error of a sample proportion
se_p_known <- sqrt(p_hat * (1 - p_hat) / 150)
round(se_p_known, 4)
#> [1] 0.0349
```

0.0349 again, matching exactly. The log-odds standard error travelled through two transforms, exp and then x / (1 + x), and each one contributed its own slope. Those slopes multiplied onto each other rather than adding, which is why a two-stage chain needs each stage worked out in its own right.

=== step === tryit
## Your turn: a transform you have not seen yet

lambda_hat and se_lambda, from the support desk's own 40 gaps, are still available. The exponential distribution's own variance is a function of lambda too: sigma^2 = 1 / lambda^2. Find its standard error the same way you found se_mu, by differentiating this new function and multiplying.

```r
# lambda_hat and se_lambda already hold the rate estimate and its standard error.
# The exponential's variance is g(lambda) = 1 / lambda^2.
# Find g_prime, the derivative -2 / lambda_hat^3, then:
#   se_var <- abs(g_prime) * se_lambda
# Two lines. Press Check when you have them.
```
::check {"regex": "-\\s*2\\s*/\\s*lambda_hat\\s*\\^\\s*3[\\s\\S]*?abs[(][\\s\\S]*?[)]\\s*[*]\\s*se_lambda", "gate": true, "difficulty": "intermediate", "ok": "Right: g_prime comes out to about -15.2094, and se_var to about 1.2229. The variance moves a lot faster than the mean does near this rate, which is exactly why its slope is so much steeper than the 3.8671 you found for the mean wait.", "no": "Differentiate g(lambda) = 1 / lambda^2 the same way you differentiated 1 / lambda earlier: g_prime is -2 / lambda_hat^3. Then take its absolute value and multiply by se_lambda, the delta method's own rule."}
::solution
```r
# The standard error of the exponential's variance, via the delta method
g_prime <- -2 / lambda_hat^3
se_var <- abs(g_prime) * se_lambda
round(g_prime, 4)
#> [1] -15.2094
round(se_var, 4)
#> [1] 1.2229
```

=== step === quiz
## Quick check: the delta method, start to finish

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The delta method gives an exact standard error for the transformed quantity, the same as fitting a brand new model for it would. ::no
- The delta method's one-term Taylor expansion only gives an approximate standard error, which is exactly why it is worth checking against a bootstrap on real data, the way the support desk's resampling check did. ::ok Exactly. The straight-line approximation is only ever approximate, and the bootstrap came back a little wider for precisely that reason: it does not need the approximation at all.
- Once you have SE(theta_hat), you can reuse that same number unchanged as the standard error of g(theta_hat), on any new scale. ::no
- When a transform is applied twice in a row, like log-odds to odds to probability, the overall slope is the sum of the two slopes from each stage. ::no The delta method is a first-order approximation, not an exact answer, which is why running a bootstrap on the same data and comparing the two is worth doing. A standard error you already have can never be reused unchanged on a new scale; it has to be multiplied by the transform's own slope, taken at the estimate. And when a transform runs in two stages, as log-odds to odds to probability just did, the two slopes multiply together. They do not add.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Casella, G. and Berger, R. L., *Statistical Inference* (2nd ed., Duxbury/Chapman and Hall)](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036), the delta method and its derivation from a one-term Taylor expansion.
- [Efron, B. and Tibshirani, R. J., *An Introduction to the Bootstrap* (Chapman and Hall/CRC, 1993)](https://doi.org/10.1201/9780429246593), the bootstrap used here as a resampling check on a delta-method standard error.
- Agresti, A. *Categorical Data Analysis* (3rd ed.). Wiley. Standard errors for log-odds, odds and proportions under logistic regression.
- Oehlert, G. W. (1992). "A note on the delta method." *The American Statistician*, 46(1), 27-29.
- Ver Hoef, J. M. (2012). "Who invented the delta method?" *The American Statistician*, 66(2), 124-140.
- [Wikipedia, "Delta method"](https://en.wikipedia.org/wiki/Delta_method), the general statement of the rule and its derivation from a one-term Taylor expansion.

=== step === complete
## What the delta method gives you

- The rule: multiply a standard error you already have by the absolute value of the transform's own slope at the estimate.
- For the support desk, that turned se_lambda, 0.0804, into se_mu, 0.3109, by multiplying by the slope of 1 / lambda at lambda_hat, 3.8671.
- For the reactivation campaign, the same rule ran twice in a row, carrying a log-odds standard error through an odds and on to a probability, the two slopes multiplying rather than adding.
- Whenever the delta method's answer is the only check available, run a bootstrap on the same data the way the support desk's check did, and compare the two. If they agree, trust the shortcut. If they do not, trust the bootstrap.

A quantity built from two estimates at once, such as a ratio or a difference of two separate rates, needs this same rule extended to more than one input.

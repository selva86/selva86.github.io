---
title: "Estimation and the Bootstrap Lesson 4: How much information a sample carries"
catalog_blurb: "Learn to read a likelihood curve's sharpness as Fisher information, and its floor."
description: "Compute Fisher information for a Bernoulli rate two ways, a numeric second derivative and its closed form, then check the Cramer-Rao bound by simulation."
keywords: "Fisher information, Cramer-Rao bound, log-likelihood, maximum likelihood estimation, standard error, unbiased estimator, R"
post_type: "LESSON"
curriculum_id: "4.20.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "4"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "Two-Bootstrap-Intervals-and-When-They-Differ.html"
course_prev: "Matching-Moments-to-Estimate-a-Parameter.html"
---

=== step === cover
## How much information a sample carries

Today let's work out exactly how much one sample is really telling you about the number you are trying to estimate.

A hospital tries a new treatment on patients who either respond to it or do not. Forty patients take it, and 12 of them respond, an observed rate of 0.3. Call the treatment's true response rate p, the number you do not know and are trying to pin down.

Every candidate value of p explains that sample better or worse. Score each candidate by how well it explains the 12 responses actually seen, a score called a likelihood, and plot that score across every value of p from near 0 to near 1. The curve below is exactly that plot, and it peaks right at 0.3, since 0.3 is the value that explains the data best.

::widget likelihood-curve {"model": "bern", "n": 40}

The picture mounts a coin instead of a patient, held at the same 30% rate: its own label talks about flips, not responses, but the shape it draws is exactly the trial's shape, since both carry the identical ratio. Look at how fast the curve falls away once you move left or right of the peak. That fall-off has a shape, sharp or shallow, and that shape is a number waiting to be read off it.

=== step === widget
## A bigger sample sharpens the curve and shrinks the standard error

The same widget is mounted again below, but now its sample-size slider is yours to move. It still runs on a coin held at exactly 30%, the same rate as the hospital's trial, so at 40 flips it is showing the trial's own 12-of-40 shape, just under its coin label rather than a patient one.

::widget likelihood-curve {"model": "bern", "n": 40}

Move the slider from 40 up to 160. Watch two things.

The peak does not move. It sits at 0.3 at every sample size, because the rate behind the data never changes, only how much of it you have.

The curve itself does move. At 40, the readout below the picture prices the standard error, how much the estimate would typically wobble if you reran the trial, at 0.0725. Slide up to 160 and that same readout drops to 0.0362, less than half. The curve has visibly narrowed to match: at 160, values even a little away from 0.3 now score far worse than they did at 40.

So a bigger sample does not move the estimate here. The rate was always 0.3. What the bigger sample buys is a sharper curve, and the smaller standard error that comes with it.

=== step === concept
## Fisher information: the curve's own curvature, numeric and closed form

The sharpness you just watched change has a name: Fisher information. Work with the log of that likelihood score from the cover instead of the plain score itself, called the log-likelihood: taking a log never moves where a curve peaks, but it turns the product of many small probabilities into a sum, which is far easier to differentiate. Fisher information is defined as the negative of that log-likelihood's second derivative, measured right at the peak. A sharp peak falls away fast, so its second derivative is a large negative number, and the information, its negative, is a large positive one. A flat peak falls away slowly, so the information stays small.

Start with the hospital's own 40-patient sample, 12 responses, and compute it directly.

```r
# The clinical trial: 12 of 40 patients responded, an observed rate of 0.3
n <- 40
k <- 12
p_hat <- k / n
p_hat
#> [1] 0.3

# The log-likelihood for a Bernoulli rate p, given this exact data
loglik <- function(p) k * log(p) + (n - k) * log(1 - p)
```

A second derivative is the rate of change of a slope, which is exactly the curvature a sharp or flat peak is made of. Approximate it with a finite difference: nudge p_hat a tiny step in each direction and see how fast the log-likelihood's own slope is changing there.

```r
# Approximate the second derivative at the peak with a finite difference
h <- 1e-4
d2_num <- (loglik(p_hat + h) - 2 * loglik(p_hat) + loglik(p_hat - h)) / h^2
info_numeric <- -d2_num
info_numeric
#> [1] 190.4762
```

A finite difference is only an approximation. R can differentiate the log-likelihood exactly instead, symbolically, with `D()`. `D()` takes an unevaluated expression and a variable name, and hands back the derivative of that expression with respect to that variable, as another expression you can then evaluate at any point.

```r
# Differentiate the same log-likelihood symbolically, twice, with D()
ll_expr <- quote(k * log(p) + (n - k) * log(1 - p))
d1 <- D(ll_expr, "p")
d1
#> k * (1/p) - (n - k) * (1/(1 - p))

d2 <- D(d1, "p")
d2
#> -(k * (1/p^2) + (n - k) * (1/(1 - p)^2))

info_closed_form <- -eval(d2, list(p = p_hat, n = n, k = k))
info_closed_form
#> [1] 190.4762
```

The finite difference and the exact symbolic derivative land on the identical number, 190.4762. For a Bernoulli rate, that second derivative always simplifies to one plain formula: n divided by p times (1 minus p).

```r
# The same number falls out of a plain closed-form formula
info40 <- n / (p_hat * (1 - p_hat))
info40
#> [1] 190.4762
```

Three different routes, a finite difference, an exact symbolic derivative, and a closed-form formula, all land on 190.4762. That is the Fisher information in the hospital's 40-patient sample. Run the same closed form on the 160-patient version of the same trial, 48 of 160 patients responding, still 30%.

```r
# The same closed form at 160 patients: 48 of 160 responded, still 30%
n2 <- 160
k2 <- 48
p_hat2 <- k2 / n2
info160 <- n2 / (p_hat2 * (1 - p_hat2))
info160
#> [1] 761.9048

info160 / info40
#> [1] 4
```

Four times the patients bought exactly four times the Fisher information, 761.9048 against 190.4762. That is the algebraic reason the curve in the last step looked so much sharper at 160: the formula says sample size and information scale together, one for one.

=== step === quiz
## Quick check: what made the curve sharper

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The 160-patient curve is sharper because 160 patients happens to carry a different, more favorable true response rate than the 40-patient trial. ::no
- The 160-patient curve is sharper because its Fisher information is larger: n divided by p times (1 minus p) gives 761.9048 at 160 patients against 190.4762 at 40, with the rate held fixed at 0.3 throughout. ::ok Exactly. The rate never changed, only n did, and the formula says information scales with n directly: four times the patients gave exactly four times the information.
- The two curves carry about the same information, since the finite-difference second derivative and the closed-form formula only ever agree approximately, never exactly. ::no
- The 40-patient curve is actually sharper, because fewer patients leaves fewer candidate values of p to rule out, which the formula reads as more information. ::no The finite difference, the exact symbolic derivative, and the closed-form formula all landed on the identical number at each sample size, 190.4762 at 40 patients and 761.9048 at 160, not an approximation of one another. The rate stayed at 0.3 in both samples, so only the sample size changed, and Fisher information for a Bernoulli rate is n divided by p times (1 minus p): more n at the same p always means more information, never less.

=== step === concept
## The Cramer-Rao bound: a floor no unbiased estimator can get under

Fisher information is not just a number for describing a curve's shape. It sets a limit on how precisely you can ever hope to estimate p from a sample that size, no matter which unbiased method you use. That limit is called the Cramer-Rao bound, and it says the variance of any unbiased estimator of p can be no smaller than 1 divided by the Fisher information.

Apply that directly to the two sample sizes already in hand.

```r
# The Cramer-Rao bound: 1 over the Fisher information, and its square root
crlb40 <- 1 / info40
se40 <- sqrt(crlb40)
cat("crlb40:", crlb40, " se40:", round(se40, 4), "\n")
#> crlb40: 0.00525  se40: 0.0725 

crlb160 <- 1 / info160
se160 <- sqrt(crlb160)
cat("crlb160:", crlb160, " se160:", round(se160, 4), "\n")
#> crlb160: 0.0013125  se160: 0.0362 
```

Both standard errors match the numbers the widget already priced earlier in this lesson, 0.0725 at 40 patients and 0.0362 at 160. The widget below confirms it again directly, mounted now at 160.

::widget likelihood-curve {"model": "bern", "n": 160}

It runs on the same built-in 30% coin as before, now set to 160, and its own readout prices the standard error at 0.0362, exactly se160 above. The bound itself is a property of the sample size and the rate, fixed before you ever choose an estimator: it says what no unbiased method can beat. Whether a particular estimator actually reaches that floor is a separate question.

=== step === concept
## Does the sample proportion reach the Cramer-Rao bound? A sweep across sample sizes

The ordinary sample proportion, responses divided by patients, is an unbiased estimator of p. The Cramer-Rao bound tells you the smallest variance any unbiased estimator of p could have. Those are two different claims, and nothing so far has shown that the sample proportion actually reaches that floor rather than sitting safely above it.

Check it by simulation. For eight sample sizes, from 10 patients up to 300, simulate 50,000 trials of each size at the true rate 0.3, and compute the sample proportion's own variance across those 50,000 repeats. Then set that simulated variance beside the Cramer-Rao bound for the same size, p times (1 minus p) divided by n.

```r
# Eight sample sizes, each simulated 50,000 times at the true rate 0.3
n_sweep <- c(10, 20, 30, 50, 80, 120, 200, 300)
set.seed(42)
sim_var <- sapply(n_sweep, function(sz) var(rbinom(50000, sz, 0.3) / sz))
crlb_sweep <- 0.3 * 0.7 / n_sweep

data.frame(n = n_sweep, simulated_variance = round(sim_var, 6), crlb = round(crlb_sweep, 6))
#>     n simulated_variance     crlb
#> 1  10           0.021369 0.021000
#> 2  20           0.010487 0.010500
#> 3  30           0.007041 0.007000
#> 4  50           0.004202 0.004200
#> 5  80           0.002640 0.002625
#> 6 120           0.001746 0.001750
#> 7 200           0.001057 0.001050
#> 8 300           0.000693 0.000700
```

Line up the two columns at every row and they are, within rounding, the same number: 0.021369 against 0.021 at 10 patients, 0.004202 against 0.0042 at 50, 0.000693 against 0.0007 at 300. Plot both series on the same axes to see it as one picture instead of eight separate comparisons.

```r
# Plot the simulated variance against the Cramer-Rao bound, same axes
plot(n_sweep, sim_var, type = "b", pch = 16, col = "steelblue",
     xlab = "sample size", ylab = "variance of the sample proportion",
     main = "Simulated variance vs the Cramer-Rao bound")
lines(n_sweep, crlb_sweep, type = "b", pch = 1, col = "firebrick", lty = 2)
legend("topright", legend = c("simulated variance", "Cramer-Rao bound"),
       col = c("steelblue", "firebrick"), pch = c(16, 1), lty = c(1, 2))
```

The two lines sit on top of each other at every sample size, not just close on average across many. The sample proportion is not only unbiased. It reaches the Cramer-Rao bound exactly, at every sample size this sweep tried.

=== step === tryit
## Your turn: information and its floor for a new trial

A second hospital runs the same kind of trial on a different drug: 80 patients, a 25% response rate. Nothing about the Fisher information or the Cramer-Rao bound for this trial has been computed yet.

Use the two formulas from this lesson. Fisher information for a Bernoulli rate is n divided by p times (1 minus p). The Cramer-Rao bound it sets is 1 divided by that information.

```r
# A second trial: 80 patients, a 25% response rate
n3 <- 80
p3 <- 0.25

# Compute the Fisher information, then the Cramer-Rao bound it sets
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*info3\\s*<-\\s*n3\\s*/\\s*[(]p3\\s*\\*\\s*[(]1\\s*-\\s*p3[)][)])(?=[\\s\\S]*crlb3\\s*<-\\s*1\\s*/\\s*info3)", "gate": true, "difficulty": "intermediate", "ok": "Right: info3 is 426.6667 and crlb3 is 0.00234375. The same two formulas that worked on the hospital's 40 and 160-patient trials work on any Bernoulli rate and sample size, nothing new needed.", "no": "Use the two formulas this lesson already gave you: info3 <- n3 / (p3 * (1 - p3)), then crlb3 <- 1 / info3."}
::solution
```r
# Fisher information and the Cramer-Rao bound it sets, for the new trial
info3 <- n3 / (p3 * (1 - p3))
crlb3 <- 1 / info3
round(info3, 4)
#> [1] 426.6667
round(crlb3, 8)
#> [1] 0.00234375
```

=== step === quiz
## Quick check: what reaching the bound actually means

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Every unbiased estimator reaches the Cramer-Rao bound automatically, so the simulation in the last step only confirmed something already guaranteed. ::no
- A bigger sample eventually drives the Cramer-Rao bound itself down to zero, so at a large enough sample size any estimator would appear to reach it. ::no
- The sample proportion's simulated variance matching the bound at every sample size shows that this particular estimator, for this particular model, is as precise as any unbiased estimator of p can possibly be. That is a property of the sample proportion, not something every unbiased estimator gets for free. ::ok Exactly. Being unbiased only earns an estimator a place at or above the floor. Reaching the floor exactly, the way the sample proportion did at every size in the sweep, is a separate, stronger fact that had to be checked, not assumed.
- Reaching the bound and having no bias are two names for the same property, so confirming one in the simulation also confirmed the other. ::no Unbiasedness and reaching the Cramer-Rao bound are two different claims. An estimator can be unbiased and still sit above the floor, with a larger variance than the bound allows. The simulation checked the stronger, separate claim, that the sample proportion's variance matched the bound exactly at every one of the eight sample sizes tried, not merely that it carried no bias.

=== step === concept
::prose-only the sources are text, not a visual
## References

- Fisher, R. A. (1922). "On the Mathematical Foundations of Theoretical Statistics." *Philosophical Transactions of the Royal Society A*, 222, 309-368. The paper that introduced Fisher information.
- Rao, C. R. (1945). "Information and the accuracy attainable in the estimation of statistical parameters." *Bulletin of the Calcutta Mathematical Society*, 37, 81-91. One half of the bound this lesson is named for.
- Cramer, H. (1946). *Mathematical Methods of Statistics*. Princeton University Press. The other half of the bound's name.
- [Casella, G. and Berger, R. L., *Statistical Inference* (2nd ed., Duxbury/Chapman and Hall)](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036), the chapter on Fisher information, the information inequality, and efficient estimators.
- [Wasserman, L., *All of Statistics* (Springer, 2004), the chapter on Fisher information and asymptotic efficiency](https://doi.org/10.1007/978-0-387-21736-9)
- [Wikipedia, "Fisher information"](https://en.wikipedia.org/wiki/Fisher_information), the general definition and its role in the Cramer-Rao bound.
- [R documentation for `D()` (stats package)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/deriv.html), the symbolic differentiation function used in this lesson to find Fisher information exactly.

=== step === complete
## What Fisher information guarantees, and what it does not

The hospital's 40-patient trial carried a Fisher information of 190.4762, and its 160-patient version carried 761.9048, four times as much for four times the patients. Each number set a floor on how precisely any unbiased method could ever pin down the true response rate from a sample that size: a variance no smaller than 0.00525 at 40 patients, no smaller than 0.0013125 at 160.

The sample proportion reached both floors exactly, confirmed by simulation rather than assumed from the formula. That is a fact about this particular estimator on this particular model, not a guarantee that carries over automatically to every parameter or every estimator you will meet elsewhere. Whether a method reaches its own Cramer-Rao bound is always a question worth checking on its own terms, the way this lesson just checked it.

The next lesson in this course moves from a floor on precision to two different ways of building an interval from a bootstrap, and exactly when they stop agreeing.

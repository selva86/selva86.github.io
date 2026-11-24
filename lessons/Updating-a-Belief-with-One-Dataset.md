---
title: "Bayesian Data Analysis Lesson 1: Updating a belief with one dataset"
catalog_blurb: "How a tutoring program's real results turn a prior belief into a posterior one."
description: "See a university tutoring program's real pass counts turn a prior belief into a posterior one, and why a confident but wrong prior barely moves at all."
keywords: "Bayesian inference, prior, likelihood, posterior, beta distribution, conjugate prior, Bayes rule, credible interval, pseudo-observations, beta-binomial, R"
post_type: "LESSON"
curriculum_id: "4.110.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "1"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: "Why-Sampling-Works-When-Algebra-Does-Not"
course_prev: ""
---

=== step === cover
## Updating a belief with one dataset

Today let's understand how to turn a belief you already hold into a new one, once a real dataset has had its say.

Here's the running example. A university is trialling a new tutoring program ahead of a qualifying exam. Historically, 55% of students pass this exam without any extra help. This year, 36 students used the new tutoring program, and 25 of them passed, a rate of about 69.4%.

::widget chart-plotter {"data":[{"x":"Historical rate","y":0.55},{"x":"This cohort","y":0.6944}],"geoms":["bar"],"x":"group","y":"pass rate"}

That gap between the two bars, about 14 percentage points, raises the real question: is the tutoring program really better, or did this one batch of 36 students just get lucky?

=== step === concept
## Bayes' rule: turning a prior belief into a posterior one

Before seeing this year's 36 students, you already held a belief about the true pass rate: the historical rate, 0.55. Statisticians have a name for a belief held before seeing new data, a **prior**.

Then this year's results came in. The probability of seeing exactly 25 passes out of 36 students, worked out separately for each candidate true rate, is called the **likelihood**. It is not the probability that a candidate rate is correct. It is the probability the data would come out looking the way it did, if that rate were the true one.

Combine the prior with the likelihood and you get an updated belief, the **posterior**: what you believe about the true rate after seeing this cohort.

Bayes' rule is the formula for combining them:

\[P(\theta \mid \text{data}) \propto P(\text{data} \mid \theta) \times P(\theta)\]

In words, the posterior is proportional to the likelihood times the prior. Here theta, \(\theta\), stands for the one unknown number this whole lesson is trying to pin down: the true pass rate under the tutoring program.

`dbinom(y, n, theta)` in R gives the probability of seeing y successes out of n trials, if the true success rate is theta. Try it at a few candidate rates and see which one the 25-of-36 result favors most.

```r
# Score how likely 25-of-36 passes is at a few candidate true pass rates
theta <- c(0.3, 0.55, 0.694, 0.9)
likelihood <- dbinom(25, 36, theta)
data.frame(theta, likelihood = round(likelihood, 6))
#>   theta likelihood
#> 1 0.300   0.000001
#> 2 0.550   0.029726
#> 3 0.694   0.143105
#> 4 0.900   0.000431
```

Read the likelihood column as how probable this exact result, 25 of 36, would be under each candidate rate. At theta = 0.694, this cohort's own rate, the likelihood is highest, 0.143105. At theta = 0.3 or theta = 0.9, the likelihood collapses to almost nothing: 25 passes out of 36 would be very hard to explain if the true rate sat that far off.

So the likelihood scores every candidate rate by how well it explains the data you actually saw. The prior brings in what you believed before that data arrived.

=== step === concept
## The beta distribution: a shape for a belief about a proportion

A prior needs a shape, not a single number, because a belief about a proportion is never "the rate is exactly 0.55". It is a whole range of plausible rates, some more likely than others.

The **beta distribution** is the standard shape for a belief about a proportion, because it lives on exactly the range a proportion can take, 0 to 1. It has two parameters, written Beta(a, b), and both are read as counts of imagined past data: a pseudo-successes and b pseudo-failures, believed before any real data arrives.

Beta(1, 1) is completely flat, equally plausible everywhere from 0 to 1. It says "no opinion": one imagined success and one imagined failure, so weak together that they carry no real pull. Call this the **flat prior**.

Beta(11, 9) is centred on 0.55, since 11 divided by (11 + 9) is 0.55, which matches the historical rate. Its two parameters add up to 20, so this prior is worth 20 pseudo-observations, about as much weight as a small pilot study. Call this the **mild prior**.

::widget chart-plotter {"data":[{"x":0.00,"y":1,"fill":"Beta(1,1): flat"},{"x":0.02,"y":1,"fill":"Beta(1,1): flat"},{"x":0.04,"y":1,"fill":"Beta(1,1): flat"},{"x":0.06,"y":1,"fill":"Beta(1,1): flat"},{"x":0.08,"y":1,"fill":"Beta(1,1): flat"},{"x":0.10,"y":1,"fill":"Beta(1,1): flat"},{"x":0.12,"y":1,"fill":"Beta(1,1): flat"},{"x":0.14,"y":1,"fill":"Beta(1,1): flat"},{"x":0.16,"y":1,"fill":"Beta(1,1): flat"},{"x":0.18,"y":1,"fill":"Beta(1,1): flat"},{"x":0.20,"y":1,"fill":"Beta(1,1): flat"},{"x":0.22,"y":1,"fill":"Beta(1,1): flat"},{"x":0.24,"y":1,"fill":"Beta(1,1): flat"},{"x":0.26,"y":1,"fill":"Beta(1,1): flat"},{"x":0.28,"y":1,"fill":"Beta(1,1): flat"},{"x":0.30,"y":1,"fill":"Beta(1,1): flat"},{"x":0.32,"y":1,"fill":"Beta(1,1): flat"},{"x":0.34,"y":1,"fill":"Beta(1,1): flat"},{"x":0.36,"y":1,"fill":"Beta(1,1): flat"},{"x":0.38,"y":1,"fill":"Beta(1,1): flat"},{"x":0.40,"y":1,"fill":"Beta(1,1): flat"},{"x":0.42,"y":1,"fill":"Beta(1,1): flat"},{"x":0.44,"y":1,"fill":"Beta(1,1): flat"},{"x":0.46,"y":1,"fill":"Beta(1,1): flat"},{"x":0.48,"y":1,"fill":"Beta(1,1): flat"},{"x":0.50,"y":1,"fill":"Beta(1,1): flat"},{"x":0.52,"y":1,"fill":"Beta(1,1): flat"},{"x":0.54,"y":1,"fill":"Beta(1,1): flat"},{"x":0.56,"y":1,"fill":"Beta(1,1): flat"},{"x":0.58,"y":1,"fill":"Beta(1,1): flat"},{"x":0.60,"y":1,"fill":"Beta(1,1): flat"},{"x":0.62,"y":1,"fill":"Beta(1,1): flat"},{"x":0.64,"y":1,"fill":"Beta(1,1): flat"},{"x":0.66,"y":1,"fill":"Beta(1,1): flat"},{"x":0.68,"y":1,"fill":"Beta(1,1): flat"},{"x":0.70,"y":1,"fill":"Beta(1,1): flat"},{"x":0.72,"y":1,"fill":"Beta(1,1): flat"},{"x":0.74,"y":1,"fill":"Beta(1,1): flat"},{"x":0.76,"y":1,"fill":"Beta(1,1): flat"},{"x":0.78,"y":1,"fill":"Beta(1,1): flat"},{"x":0.80,"y":1,"fill":"Beta(1,1): flat"},{"x":0.82,"y":1,"fill":"Beta(1,1): flat"},{"x":0.84,"y":1,"fill":"Beta(1,1): flat"},{"x":0.86,"y":1,"fill":"Beta(1,1): flat"},{"x":0.88,"y":1,"fill":"Beta(1,1): flat"},{"x":0.90,"y":1,"fill":"Beta(1,1): flat"},{"x":0.92,"y":1,"fill":"Beta(1,1): flat"},{"x":0.94,"y":1,"fill":"Beta(1,1): flat"},{"x":0.96,"y":1,"fill":"Beta(1,1): flat"},{"x":0.98,"y":1,"fill":"Beta(1,1): flat"},{"x":1.00,"y":1,"fill":"Beta(1,1): flat"},{"x":0.00,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.02,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.04,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.06,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.08,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.10,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.12,"y":0.0002,"fill":"Beta(11,9): mild"},{"x":0.14,"y":0.0007,"fill":"Beta(11,9): mild"},{"x":0.16,"y":0.0023,"fill":"Beta(11,9): mild"},{"x":0.18,"y":0.0061,"fill":"Beta(11,9): mild"},{"x":0.20,"y":0.0143,"fill":"Beta(11,9): mild"},{"x":0.22,"y":0.0303,"fill":"Beta(11,9): mild"},{"x":0.24,"y":0.0587,"fill":"Beta(11,9): mild"},{"x":0.26,"y":0.1055,"fill":"Beta(11,9): mild"},{"x":0.28,"y":0.1778,"fill":"Beta(11,9): mild"},{"x":0.30,"y":0.2830,"fill":"Beta(11,9): mild"},{"x":0.32,"y":0.4279,"fill":"Beta(11,9): mild"},{"x":0.34,"y":0.6179,"fill":"Beta(11,9): mild"},{"x":0.36,"y":0.8556,"fill":"Beta(11,9): mild"},{"x":0.38,"y":1.1397,"fill":"Beta(11,9): mild"},{"x":0.40,"y":1.4643,"fill":"Beta(11,9): mild"},{"x":0.42,"y":1.8186,"fill":"Beta(11,9): mild"},{"x":0.44,"y":2.1870,"fill":"Beta(11,9): mild"},{"x":0.46,"y":2.5500,"fill":"Beta(11,9): mild"},{"x":0.48,"y":2.8857,"fill":"Beta(11,9): mild"},{"x":0.50,"y":3.1715,"fill":"Beta(11,9): mild"},{"x":0.52,"y":3.3867,"fill":"Beta(11,9): mild"},{"x":0.54,"y":3.5141,"fill":"Beta(11,9): mild"},{"x":0.56,"y":3.5425,"fill":"Beta(11,9): mild"},{"x":0.58,"y":3.4680,"fill":"Beta(11,9): mild"},{"x":0.60,"y":3.2946,"fill":"Beta(11,9): mild"},{"x":0.62,"y":3.0339,"fill":"Beta(11,9): mild"},{"x":0.64,"y":2.7042,"fill":"Beta(11,9): mild"},{"x":0.66,"y":2.3285,"fill":"Beta(11,9): mild"},{"x":0.68,"y":1.9324,"fill":"Beta(11,9): mild"},{"x":0.70,"y":1.5409,"fill":"Beta(11,9): mild"},{"x":0.72,"y":1.1760,"fill":"Beta(11,9): mild"},{"x":0.74,"y":0.8549,"fill":"Beta(11,9): mild"},{"x":0.76,"y":0.5884,"fill":"Beta(11,9): mild"},{"x":0.78,"y":0.3803,"fill":"Beta(11,9): mild"},{"x":0.80,"y":0.2285,"fill":"Beta(11,9): mild"},{"x":0.82,"y":0.1259,"fill":"Beta(11,9): mild"},{"x":0.84,"y":0.0625,"fill":"Beta(11,9): mild"},{"x":0.86,"y":0.0272,"fill":"Beta(11,9): mild"},{"x":0.88,"y":0.0100,"fill":"Beta(11,9): mild"},{"x":0.90,"y":0.0029,"fill":"Beta(11,9): mild"},{"x":0.92,"y":0.0006,"fill":"Beta(11,9): mild"},{"x":0.94,"y":0.0001,"fill":"Beta(11,9): mild"},{"x":0.96,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":0.98,"y":0.0000,"fill":"Beta(11,9): mild"},{"x":1.00,"y":0.0000,"fill":"Beta(11,9): mild"}],"geoms":["line"],"x":"theta","y":"density"}

The flat curve sits level at a density of 1 everywhere from 0 to 1, no preference anywhere. The mild curve is a hump centred close to 0.55, peaking around theta = 0.56 at a density near 3.54, falling away on both sides. That hump is what "a mild opinion worth 20 pseudo-observations" looks like drawn out.

=== step === concept
## The conjugate update: add successes and failures to the prior

Here is the one rule that makes a beta prior so convenient. When the data are successes and failures, like passes and fails on an exam, updating a Beta(a, b) prior with y successes and (n - y) failures gives a posterior that is just another beta distribution, Beta(a + y, b + (n - y)). No integration needed, just addition.

Apply that to the mild prior, Beta(11, 9), using this cohort's 25 passes and 11 fails out of 36.

```r
# Update the mild prior by adding this cohort's successes and failures
a <- 11; b <- 9
y <- 25; n <- 36
posterior_a <- a + y
posterior_b <- b + (n - y)
c(posterior_a, posterior_b)
#> [1] 36 20
mean_posterior <- posterior_a / (posterior_a + posterior_b)
round(mean_posterior, 4)
#> [1] 0.6429
```

So the mild prior's posterior is Beta(36, 20), mean about 0.643. Look at where 36 and 20 came from: 11 pseudo-successes plus 25 real successes gives 36, and 9 pseudo-failures plus 11 real failures gives 20. The data simply got added onto the prior's own counts.

There is a second curve worth drawing on the same axis: the likelihood itself, rescaled into a proper density over theta. For binomial data like this, that rescaled likelihood takes exactly the shape of Beta(y + 1, (n - y) + 1), which here is Beta(26, 12). It is nobody's prior. It is just the data's own shape, placed on the same axis so you can compare prior, likelihood and posterior directly.

::widget chart-plotter {"data":[{"x":0.00,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.02,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.04,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.06,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.08,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.10,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.12,"y":0.0002,"fill":"Prior: Beta(11,9)"},{"x":0.14,"y":0.0007,"fill":"Prior: Beta(11,9)"},{"x":0.16,"y":0.0023,"fill":"Prior: Beta(11,9)"},{"x":0.18,"y":0.0061,"fill":"Prior: Beta(11,9)"},{"x":0.20,"y":0.0143,"fill":"Prior: Beta(11,9)"},{"x":0.22,"y":0.0303,"fill":"Prior: Beta(11,9)"},{"x":0.24,"y":0.0587,"fill":"Prior: Beta(11,9)"},{"x":0.26,"y":0.1055,"fill":"Prior: Beta(11,9)"},{"x":0.28,"y":0.1778,"fill":"Prior: Beta(11,9)"},{"x":0.30,"y":0.2830,"fill":"Prior: Beta(11,9)"},{"x":0.32,"y":0.4279,"fill":"Prior: Beta(11,9)"},{"x":0.34,"y":0.6179,"fill":"Prior: Beta(11,9)"},{"x":0.36,"y":0.8556,"fill":"Prior: Beta(11,9)"},{"x":0.38,"y":1.1397,"fill":"Prior: Beta(11,9)"},{"x":0.40,"y":1.4643,"fill":"Prior: Beta(11,9)"},{"x":0.42,"y":1.8186,"fill":"Prior: Beta(11,9)"},{"x":0.44,"y":2.1870,"fill":"Prior: Beta(11,9)"},{"x":0.46,"y":2.5500,"fill":"Prior: Beta(11,9)"},{"x":0.48,"y":2.8857,"fill":"Prior: Beta(11,9)"},{"x":0.50,"y":3.1715,"fill":"Prior: Beta(11,9)"},{"x":0.52,"y":3.3867,"fill":"Prior: Beta(11,9)"},{"x":0.54,"y":3.5141,"fill":"Prior: Beta(11,9)"},{"x":0.56,"y":3.5425,"fill":"Prior: Beta(11,9)"},{"x":0.58,"y":3.4680,"fill":"Prior: Beta(11,9)"},{"x":0.60,"y":3.2946,"fill":"Prior: Beta(11,9)"},{"x":0.62,"y":3.0339,"fill":"Prior: Beta(11,9)"},{"x":0.64,"y":2.7042,"fill":"Prior: Beta(11,9)"},{"x":0.66,"y":2.3285,"fill":"Prior: Beta(11,9)"},{"x":0.68,"y":1.9324,"fill":"Prior: Beta(11,9)"},{"x":0.70,"y":1.5409,"fill":"Prior: Beta(11,9)"},{"x":0.72,"y":1.1760,"fill":"Prior: Beta(11,9)"},{"x":0.74,"y":0.8549,"fill":"Prior: Beta(11,9)"},{"x":0.76,"y":0.5884,"fill":"Prior: Beta(11,9)"},{"x":0.78,"y":0.3803,"fill":"Prior: Beta(11,9)"},{"x":0.80,"y":0.2285,"fill":"Prior: Beta(11,9)"},{"x":0.82,"y":0.1259,"fill":"Prior: Beta(11,9)"},{"x":0.84,"y":0.0625,"fill":"Prior: Beta(11,9)"},{"x":0.86,"y":0.0272,"fill":"Prior: Beta(11,9)"},{"x":0.88,"y":0.0100,"fill":"Prior: Beta(11,9)"},{"x":0.90,"y":0.0029,"fill":"Prior: Beta(11,9)"},{"x":0.92,"y":0.0006,"fill":"Prior: Beta(11,9)"},{"x":0.94,"y":0.0001,"fill":"Prior: Beta(11,9)"},{"x":0.96,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.98,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":1.00,"y":0.0000,"fill":"Prior: Beta(11,9)"},{"x":0.00,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.02,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.04,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.06,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.08,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.10,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.12,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.14,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.16,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.18,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.20,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.22,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.24,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.26,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.28,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.30,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.32,"y":0.0001,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.34,"y":0.0004,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.36,"y":0.0013,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.38,"y":0.0036,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.40,"y":0.0091,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.42,"y":0.0212,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.44,"y":0.0461,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.46,"y":0.0938,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.48,"y":0.1795,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.50,"y":0.3235,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.52,"y":0.5504,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.54,"y":0.8854,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.56,"y":1.3478,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.58,"y":1.9426,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.60,"y":2.6508,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.62,"y":3.4225,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.64,"y":4.1760,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.66,"y":4.8062,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.68,"y":5.2036,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.70,"y":5.2810,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.72,"y":5.0002,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.74,"y":4.3897,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.76,"y":3.5449,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.78,"y":2.6059,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.80,"y":1.7199,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.82,"y":1.0006,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.84,"y":0.5003,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.86,"y":0.2074,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.88,"y":0.0676,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.90,"y":0.0160,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.92,"y":0.0024,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.94,"y":0.0002,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.96,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.98,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":1.00,"y":0.0000,"fill":"Likelihood (rescaled): Beta(26,12)"},{"x":0.00,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.02,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.04,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.06,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.08,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.10,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.12,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.14,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.16,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.18,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.20,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.22,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.24,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.26,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.28,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.30,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.32,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.34,"y":0.0002,"fill":"Posterior: Beta(36,20)"},{"x":0.36,"y":0.0006,"fill":"Posterior: Beta(36,20)"},{"x":0.38,"y":0.0023,"fill":"Posterior: Beta(36,20)"},{"x":0.40,"y":0.0073,"fill":"Posterior: Beta(36,20)"},{"x":0.42,"y":0.0210,"fill":"Posterior: Beta(36,20)"},{"x":0.44,"y":0.0551,"fill":"Posterior: Beta(36,20)"},{"x":0.46,"y":0.1307,"fill":"Posterior: Beta(36,20)"},{"x":0.48,"y":0.2830,"fill":"Posterior: Beta(36,20)"},{"x":0.50,"y":0.5607,"fill":"Posterior: Beta(36,20)"},{"x":0.52,"y":1.0187,"fill":"Posterior: Beta(36,20)"},{"x":0.54,"y":1.7003,"fill":"Posterior: Beta(36,20)"},{"x":0.56,"y":2.6094,"fill":"Posterior: Beta(36,20)"},{"x":0.58,"y":3.6819,"fill":"Posterior: Beta(36,20)"},{"x":0.60,"y":4.7730,"fill":"Posterior: Beta(36,20)"},{"x":0.62,"y":5.6748,"fill":"Posterior: Beta(36,20)"},{"x":0.64,"y":6.1716,"fill":"Posterior: Beta(36,20)"},{"x":0.66,"y":6.1163,"fill":"Posterior: Beta(36,20)"},{"x":0.68,"y":5.4956,"fill":"Posterior: Beta(36,20)"},{"x":0.70,"y":4.4472,"fill":"Posterior: Beta(36,20)"},{"x":0.72,"y":3.2136,"fill":"Posterior: Beta(36,20)"},{"x":0.74,"y":2.0510,"fill":"Posterior: Beta(36,20)"},{"x":0.76,"y":1.1398,"fill":"Posterior: Beta(36,20)"},{"x":0.78,"y":0.5416,"fill":"Posterior: Beta(36,20)"},{"x":0.80,"y":0.2148,"fill":"Posterior: Beta(36,20)"},{"x":0.82,"y":0.0689,"fill":"Posterior: Beta(36,20)"},{"x":0.84,"y":0.0171,"fill":"Posterior: Beta(36,20)"},{"x":0.86,"y":0.0031,"fill":"Posterior: Beta(36,20)"},{"x":0.88,"y":0.0004,"fill":"Posterior: Beta(36,20)"},{"x":0.90,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.92,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.94,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.96,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":0.98,"y":0.0000,"fill":"Posterior: Beta(36,20)"},{"x":1.00,"y":0.0000,"fill":"Posterior: Beta(36,20)"}],"geoms":["line"],"x":"theta","y":"density"}

Look at where each curve sits. The posterior, Beta(36, 20), sits between the prior and the rescaled likelihood, pulled toward the likelihood but not all the way to it, because the mild prior still carries its own 20 pseudo-observations of pull on the result.

=== step === quiz
## Quick check: reading the conjugate update

A prior Beta(2, 2) meets a dataset of 8 successes in 10 trials. By the add-counts rule from the last step, what is the posterior?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Beta(10, 4) ::ok Correct. Add the 8 successes to the prior's own 2, giving 10, and add the 2 failures to the prior's other 2, giving 4.
- Beta(8, 2) ::no This keeps only the data and drops the prior's own 2 pseudo-successes and 2 pseudo-failures. The rule adds the data onto the prior's existing counts, it never replaces them.
- Beta(2, 2) ::no This is just the original prior, left unchanged. The whole point of the conjugate update is that the data move the parameters: 8 successes and 2 failures get added on top of the prior's 2 and 2.
- Beta(4, 10) ::no This swaps successes and failures. Out of 10 trials, 8 were successes and 2 were failures, not the other way around, so the first parameter should be the larger one, not the second.

=== step === widget
## Three priors meet the same 36 students

Push the add-counts rule further and see what it reveals about priors in general. Take three very different priors, update each one with the same 25 passes and 11 fails from this year's cohort, and watch how far each posterior moves.

The flat prior, Beta(1, 1), carries only 2 pseudo-observations, so it has almost no opinion to defend. Updated with 25 successes and 11 failures, its posterior is Beta(26, 12), mean about 0.684, close to this cohort's own rate of 0.694.

The mild prior, Beta(11, 9), carries 20 pseudo-observations centred on 0.55. Updated the same way, its posterior is Beta(36, 20), mean about 0.643, which sits about 64% of the way from the historical 0.55 toward the cohort's 0.694.

The confident-but-wrong prior, Beta(220, 180), is also centred on 0.55, but carries 400 pseudo-observations, twenty times the mild prior's conviction. Updated with the same 25 passes and 11 fails, its posterior is Beta(245, 191), mean about 0.562, only about 8% of the way from 0.55 to 0.694.

::widget chart-plotter {"data":[{"x":0.00,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.02,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.04,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.06,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.08,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.10,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.12,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.14,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.16,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.18,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.20,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.22,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.24,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.26,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.28,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.30,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.32,"y":0.0001,"fill":"From flat prior: Beta(26,12)"},{"x":0.34,"y":0.0004,"fill":"From flat prior: Beta(26,12)"},{"x":0.36,"y":0.0013,"fill":"From flat prior: Beta(26,12)"},{"x":0.38,"y":0.0036,"fill":"From flat prior: Beta(26,12)"},{"x":0.40,"y":0.0091,"fill":"From flat prior: Beta(26,12)"},{"x":0.42,"y":0.0212,"fill":"From flat prior: Beta(26,12)"},{"x":0.44,"y":0.0461,"fill":"From flat prior: Beta(26,12)"},{"x":0.46,"y":0.0938,"fill":"From flat prior: Beta(26,12)"},{"x":0.48,"y":0.1795,"fill":"From flat prior: Beta(26,12)"},{"x":0.50,"y":0.3235,"fill":"From flat prior: Beta(26,12)"},{"x":0.52,"y":0.5504,"fill":"From flat prior: Beta(26,12)"},{"x":0.54,"y":0.8854,"fill":"From flat prior: Beta(26,12)"},{"x":0.56,"y":1.3478,"fill":"From flat prior: Beta(26,12)"},{"x":0.58,"y":1.9426,"fill":"From flat prior: Beta(26,12)"},{"x":0.60,"y":2.6508,"fill":"From flat prior: Beta(26,12)"},{"x":0.62,"y":3.4225,"fill":"From flat prior: Beta(26,12)"},{"x":0.64,"y":4.1760,"fill":"From flat prior: Beta(26,12)"},{"x":0.66,"y":4.8062,"fill":"From flat prior: Beta(26,12)"},{"x":0.68,"y":5.2036,"fill":"From flat prior: Beta(26,12)"},{"x":0.70,"y":5.2810,"fill":"From flat prior: Beta(26,12)"},{"x":0.72,"y":5.0002,"fill":"From flat prior: Beta(26,12)"},{"x":0.74,"y":4.3897,"fill":"From flat prior: Beta(26,12)"},{"x":0.76,"y":3.5449,"fill":"From flat prior: Beta(26,12)"},{"x":0.78,"y":2.6059,"fill":"From flat prior: Beta(26,12)"},{"x":0.80,"y":1.7199,"fill":"From flat prior: Beta(26,12)"},{"x":0.82,"y":1.0006,"fill":"From flat prior: Beta(26,12)"},{"x":0.84,"y":0.5003,"fill":"From flat prior: Beta(26,12)"},{"x":0.86,"y":0.2074,"fill":"From flat prior: Beta(26,12)"},{"x":0.88,"y":0.0676,"fill":"From flat prior: Beta(26,12)"},{"x":0.90,"y":0.0160,"fill":"From flat prior: Beta(26,12)"},{"x":0.92,"y":0.0024,"fill":"From flat prior: Beta(26,12)"},{"x":0.94,"y":0.0002,"fill":"From flat prior: Beta(26,12)"},{"x":0.96,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.98,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":1.00,"y":0.0000,"fill":"From flat prior: Beta(26,12)"},{"x":0.00,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.02,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.04,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.06,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.08,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.10,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.12,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.14,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.16,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.18,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.20,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.22,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.24,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.26,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.28,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.30,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.32,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.34,"y":0.0002,"fill":"From mild prior: Beta(36,20)"},{"x":0.36,"y":0.0006,"fill":"From mild prior: Beta(36,20)"},{"x":0.38,"y":0.0023,"fill":"From mild prior: Beta(36,20)"},{"x":0.40,"y":0.0073,"fill":"From mild prior: Beta(36,20)"},{"x":0.42,"y":0.0210,"fill":"From mild prior: Beta(36,20)"},{"x":0.44,"y":0.0551,"fill":"From mild prior: Beta(36,20)"},{"x":0.46,"y":0.1307,"fill":"From mild prior: Beta(36,20)"},{"x":0.48,"y":0.2830,"fill":"From mild prior: Beta(36,20)"},{"x":0.50,"y":0.5607,"fill":"From mild prior: Beta(36,20)"},{"x":0.52,"y":1.0187,"fill":"From mild prior: Beta(36,20)"},{"x":0.54,"y":1.7003,"fill":"From mild prior: Beta(36,20)"},{"x":0.56,"y":2.6094,"fill":"From mild prior: Beta(36,20)"},{"x":0.58,"y":3.6819,"fill":"From mild prior: Beta(36,20)"},{"x":0.60,"y":4.7730,"fill":"From mild prior: Beta(36,20)"},{"x":0.62,"y":5.6748,"fill":"From mild prior: Beta(36,20)"},{"x":0.64,"y":6.1716,"fill":"From mild prior: Beta(36,20)"},{"x":0.66,"y":6.1163,"fill":"From mild prior: Beta(36,20)"},{"x":0.68,"y":5.4956,"fill":"From mild prior: Beta(36,20)"},{"x":0.70,"y":4.4472,"fill":"From mild prior: Beta(36,20)"},{"x":0.72,"y":3.2136,"fill":"From mild prior: Beta(36,20)"},{"x":0.74,"y":2.0510,"fill":"From mild prior: Beta(36,20)"},{"x":0.76,"y":1.1398,"fill":"From mild prior: Beta(36,20)"},{"x":0.78,"y":0.5416,"fill":"From mild prior: Beta(36,20)"},{"x":0.80,"y":0.2148,"fill":"From mild prior: Beta(36,20)"},{"x":0.82,"y":0.0689,"fill":"From mild prior: Beta(36,20)"},{"x":0.84,"y":0.0171,"fill":"From mild prior: Beta(36,20)"},{"x":0.86,"y":0.0031,"fill":"From mild prior: Beta(36,20)"},{"x":0.88,"y":0.0004,"fill":"From mild prior: Beta(36,20)"},{"x":0.90,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.92,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.94,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.96,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.98,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":1.00,"y":0.0000,"fill":"From mild prior: Beta(36,20)"},{"x":0.00,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.02,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.04,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.06,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.08,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.10,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.12,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.14,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.16,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.18,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.20,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.22,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.24,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.26,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.28,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.30,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.32,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.34,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.36,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.38,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.40,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.42,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.44,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.46,"y":0.0019,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.48,"y":0.0470,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.50,"y":0.5781,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.52,"y":3.5458,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.54,"y":10.8924,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.56,"y":16.7088,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.58,"y":12.6722,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.60,"y":4.6705,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.62,"y":0.8157,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.64,"y":0.0652,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.66,"y":0.0023,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.68,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.70,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.72,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.74,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.76,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.78,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.80,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.82,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.84,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.86,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.88,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.90,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.92,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.94,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.96,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":0.98,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"},{"x":1.00,"y":0.0000,"fill":"From confident-wrong prior: Beta(245,191)"}],"geoms":["line"],"x":"theta","y":"density"}

Notice how narrow and tall the confident-but-wrong prior's posterior is next to the other two. All three posteriors saw the exact same 36 students. The only thing that differed between them was how many pseudo-observations each prior brought to the table.

A prior with few pseudo-observations gets swept along by real data. A prior with hundreds of pseudo-observations barely moves, even when the real data disagrees with it. That is the honest warning about priors: being confident is really a claim about how much evidence it should take to move you, and if that confidence is wrong, a prior that strong barely moves even when the data say otherwise.

=== step === concept
## What a 95% credible interval actually says

A posterior mean is one number. But the posterior is a whole distribution, so it also supports a range: a **credible interval**.

Take the flat prior's posterior from a moment ago, Beta(26, 12). Its 95% credible interval is the range holding the middle 95% of that distribution, found with `qbeta()`.

```r
# Find the 95% credible interval from the flat prior's posterior, Beta(26, 12)
interval <- qbeta(c(0.025, 0.975), 26, 12)
sprintf("%.3f", interval)
#> [1] "0.530" "0.820"
```

So the 95% credible interval runs from 0.530 to 0.820.

Here is the part that is easy to get wrong about an interval like this. Because the posterior IS a probability distribution over the true pass rate theta, you get to say directly:

\[P(0.530 \le \theta \le 0.820 \mid \text{data}) = 0.95\]

There is a 95% probability that the true pass rate lies between 0.530 and 0.820.

A confidence interval of that same width cannot support that sentence. A confidence interval comes from a procedure that, run over and over on new samples, would cover the true rate 95% of the time. It says nothing about where the true rate is likely to sit for this one dataset you actually have. A credible interval makes exactly the statement people wrongly reach for when they talk about a confidence interval, because it comes from an actual probability distribution over the parameter, which a confidence interval never has.

=== step === quiz
## Closing check: what the credible interval says

Recall the flat prior's posterior, Beta(26, 12), the weakest-pulled of the three priors you just compared. Its 95% credible interval runs from 0.530 to 0.820. Which sentence reads that interval correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- There is a 95% probability that the true pass rate lies between 0.530 and 0.820. ::ok Correct. The posterior is a probability distribution over the true pass rate, so the credible interval supports exactly this sentence.
- 95% of intervals built this same way, from repeated samples, would contain the true rate. ::no This is the confidence interval's own definition, not the credible interval's. A confidence interval is a statement about the procedure across many repeated samples. A credible interval is a statement about this one posterior, for this one dataset.
- The confident-but-wrong prior's interval would come out about this same width. ::no It would not. The confident-but-wrong prior's posterior, Beta(245, 191), is far more concentrated than the flat prior's Beta(26, 12), because it is built from 400 pseudo-observations plus the 36 real ones. Its 95% credible interval is much narrower than 0.530 to 0.820.
- There is a 95% chance this cohort's own observed rate, 0.694, falls inside this range. ::no This mixes up the parameter with one observed statistic. The interval is a probability statement about the unknown true pass rate, theta, not about this cohort's own already-known rate of 0.694, which is simply a fixed number that happens to fall inside it.

=== step === tryit
## Your turn: change the prior, read the posterior

The code below computes the posterior mean for a Beta(a, b) prior updated with this cohort's 25 passes and 11 fails out of 36 students. It currently uses the mild prior, Beta(11, 9).

```r
# Compute the posterior mean from a prior's alpha and beta, plus the 36 students' results
y <- 25; n <- 36
a <- 11
b <- 9
posterior_mean <- (a + y) / (a + y + b + (n - y))
round(posterior_mean, 3)
#> [1] 0.643
```

Change `a` and `b` to the confident-but-wrong prior's values, 220 and 180, and run it again. See how far the posterior mean moves this time.

::check {"regex": "(?=[\\s\\S]*220)(?=[\\s\\S]*180)", "gate": true, "difficulty": "intermediate", "ok": "Right: with a = 220 and b = 180, the posterior mean drops to about 0.562, barely past the prior's own 0.55. Compare that to the mild prior's 0.643 a moment ago. The same 36 students, read against a far more confident prior, move it only a fraction of the distance.", "no": "Set a <- 220 and b <- 180 in the code above, the confident-but-wrong prior's pseudo-counts, then press Check."}
::solution
```r
# Recompute the posterior mean using the confident-but-wrong prior's alpha and beta
y <- 25; n <- 36
a <- 220
b <- 180
posterior_mean <- (a + y) / (a + y + b + (n - y))
round(posterior_mean, 3)
#> [1] 0.562
```

=== step === concept
## References

- [Bayesian Data Analysis, 3rd edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, A., Carlin, J.B., Stern, H.S., Dunson, D.B., Vehtari, A. and Rubin, D.B. (2013), CRC Press. The reference text behind the conjugate update and credible intervals used in this lesson.
- [Doing Bayesian Data Analysis, 2nd edition](https://sites.google.com/site/doingbayesiandataanalysis/) - Kruschke, J.K. (2014), Academic Press. A gentler, example-driven path through the same beta-binomial update.
- [Statistical Rethinking, 2nd edition](https://xcelab.net/rm/statistical-rethinking/) - McElreath, R. (2020), CRC Press. Builds the same prior-likelihood-posterior picture from first principles, with worked R code throughout.
- Casella, G. and Berger, R.L. (2002). Statistical Inference, 2nd edition. Duxbury. The standard reference for the confidence interval definition this lesson's credible interval is contrasted against.

=== step === complete
## What one dataset can and cannot do to a belief

Here's everything in one place. This year's tutoring cohort gave you 25 passes out of 36 students, against a historical pass rate of 0.55. Bayes' rule combined that result with a prior belief by adding real successes and failures onto the prior's own pseudo-successes and pseudo-failures, turning Beta(a, b) into Beta(a + y, b + (n - y)).

How far that update moved depended entirely on how many pseudo-observations the prior carried. The flat prior, worth almost nothing, landed close to the cohort's own 0.694. The mild prior, worth 20 pseudo-observations, moved about 64% of the way there. The confident-but-wrong prior, worth 400, moved only about 8%, because its own conviction outweighed one cohort's worth of real evidence.

And the flat prior's posterior supported a genuine probability statement: a 95% credible interval running from 0.530 to 0.820, inside which the true pass rate sits with 95% probability, a sentence a same-width confidence interval cannot make.

The next lesson in this course covers what to do when a closed-form update like this one does not exist, which is most of the time, by exploring the posterior through sampling instead.

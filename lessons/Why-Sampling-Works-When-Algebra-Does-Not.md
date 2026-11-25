---
title: "Bayesian Data Analysis Lesson 2: Why sampling works when algebra does not"
catalog_blurb: "How to find a posterior by sampling when no formula for it exists."
description: "An everyday prior breaks Bayes' tidy formula. Build a Metropolis sampler from scratch in R, validate it, then reach posterior numbers no formula gives."
keywords: "Bayesian inference, Markov chain Monte Carlo, Metropolis algorithm, Metropolis-Hastings, Hamiltonian Monte Carlo, conjugate prior, posterior sampling, acceptance rate, R-hat, effective sample size, trace plot, R"
post_type: "LESSON"
curriculum_id: "4.110.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "2"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: "Your-First-Bayesian-Regression"
course_prev: "Updating-a-Belief-with-One-Dataset"
---

=== step === cover
## Why sampling works when algebra does not

Today let's understand why sampling can find a posterior even when the neat algebra behind Bayes' rule cannot, using one real measurement problem.

A technician is checking one oven. The oven has a dial for its temperature, but the real temperature inside often drifts from what the dial says, by some fixed amount called the offset. To measure it, the technician uses a probe whose own measurement error is known from its calibration certificate, a standard deviation of 1C. The probe takes 20 independent readings of the offset, and they average 3.19C.

Before taking a single reading, the technician already held a real belief about the offset, built from years of servicing this model of oven. That belief is not a bell curve. It is a Gamma distribution with shape 4 and rate 1.3, a curve that climbs from zero, peaks, and then trails off slowly to the right.

::widget chart-plotter {"data":[{"x":0,"y":0},{"x":0.05,"y":1e-04},{"x":0.1,"y":4e-04},{"x":0.15,"y":0.0013},{"x":0.2,"y":0.0029},{"x":0.25,"y":0.0054},{"x":0.3,"y":0.0087},{"x":0.35,"y":0.0129},{"x":0.4,"y":0.0181},{"x":0.45,"y":0.0242},{"x":0.5,"y":0.0311},{"x":0.55,"y":0.0387},{"x":0.6,"y":0.0471},{"x":0.65,"y":0.0562},{"x":0.7,"y":0.0657},{"x":0.75,"y":0.0757},{"x":0.8,"y":0.0861},{"x":0.85,"y":0.0968},{"x":0.9,"y":0.1077},{"x":0.95,"y":0.1187},{"x":1,"y":0.1297},{"x":1.05,"y":0.1407},{"x":1.1,"y":0.1516},{"x":1.15,"y":0.1623},{"x":1.2,"y":0.1728},{"x":1.25,"y":0.1831},{"x":1.3,"y":0.193},{"x":1.35,"y":0.2025},{"x":1.4,"y":0.2116},{"x":1.45,"y":0.2203},{"x":1.5,"y":0.2286},{"x":1.55,"y":0.2363},{"x":1.6,"y":0.2436},{"x":1.65,"y":0.2503},{"x":1.7,"y":0.2566},{"x":1.75,"y":0.2623},{"x":1.8,"y":0.2674},{"x":1.85,"y":0.2721},{"x":1.9,"y":0.2762},{"x":1.95,"y":0.2798},{"x":2,"y":0.2828},{"x":2.05,"y":0.2854},{"x":2.1,"y":0.2875},{"x":2.15,"y":0.2891},{"x":2.2,"y":0.2903},{"x":2.25,"y":0.291},{"x":2.3,"y":0.2912},{"x":2.35,"y":0.2911},{"x":2.4,"y":0.2906},{"x":2.45,"y":0.2897},{"x":2.5,"y":0.2884},{"x":2.55,"y":0.2868},{"x":2.6,"y":0.2849},{"x":2.65,"y":0.2826},{"x":2.7,"y":0.2801},{"x":2.75,"y":0.2773},{"x":2.8,"y":0.2743},{"x":2.85,"y":0.2711},{"x":2.9,"y":0.2676},{"x":2.95,"y":0.264},{"x":3,"y":0.2602},{"x":3.05,"y":0.2562},{"x":3.1,"y":0.2521},{"x":3.15,"y":0.2478},{"x":3.2,"y":0.2434},{"x":3.25,"y":0.239},{"x":3.3,"y":0.2344},{"x":3.35,"y":0.2298},{"x":3.4,"y":0.2252},{"x":3.45,"y":0.2204},{"x":3.5,"y":0.2157},{"x":3.55,"y":0.2109},{"x":3.6,"y":0.2061},{"x":3.65,"y":0.2013},{"x":3.7,"y":0.1965},{"x":3.75,"y":0.1917},{"x":3.8,"y":0.1869},{"x":3.85,"y":0.1821},{"x":3.9,"y":0.1774},{"x":3.95,"y":0.1727},{"x":4,"y":0.1681},{"x":4.05,"y":0.1635},{"x":4.1,"y":0.1589},{"x":4.15,"y":0.1544},{"x":4.2,"y":0.15},{"x":4.25,"y":0.1457},{"x":4.3,"y":0.1414},{"x":4.35,"y":0.1371},{"x":4.4,"y":0.133},{"x":4.45,"y":0.1289},{"x":4.5,"y":0.1249},{"x":4.55,"y":0.121},{"x":4.6,"y":0.1172},{"x":4.65,"y":0.1134},{"x":4.7,"y":0.1097},{"x":4.75,"y":0.1062},{"x":4.8,"y":0.1026},{"x":4.85,"y":0.0992},{"x":4.9,"y":0.0959},{"x":4.95,"y":0.0926},{"x":5,"y":0.0895},{"x":5.05,"y":0.0864},{"x":5.1,"y":0.0834},{"x":5.15,"y":0.0804},{"x":5.2,"y":0.0776},{"x":5.25,"y":0.0748},{"x":5.3,"y":0.0721},{"x":5.35,"y":0.0695},{"x":5.4,"y":0.067},{"x":5.45,"y":0.0645},{"x":5.5,"y":0.0622},{"x":5.55,"y":0.0599},{"x":5.6,"y":0.0576},{"x":5.65,"y":0.0554},{"x":5.7,"y":0.0533},{"x":5.75,"y":0.0513},{"x":5.8,"y":0.0494},{"x":5.85,"y":0.0475},{"x":5.9,"y":0.0456},{"x":5.95,"y":0.0438},{"x":6,"y":0.0421},{"x":6.05,"y":0.0405},{"x":6.1,"y":0.0389},{"x":6.15,"y":0.0373},{"x":6.2,"y":0.0358},{"x":6.25,"y":0.0344},{"x":6.3,"y":0.033},{"x":6.35,"y":0.0317},{"x":6.4,"y":0.0304},{"x":6.45,"y":0.0292},{"x":6.5,"y":0.028},{"x":6.55,"y":0.0268},{"x":6.6,"y":0.0257},{"x":6.65,"y":0.0246},{"x":6.7,"y":0.0236},{"x":6.75,"y":0.0226},{"x":6.8,"y":0.0217},{"x":6.85,"y":0.0208},{"x":6.9,"y":0.0199},{"x":6.95,"y":0.019},{"x":7,"y":0.0182},{"x":7.05,"y":0.0175},{"x":7.1,"y":0.0167},{"x":7.15,"y":0.016},{"x":7.2,"y":0.0153},{"x":7.25,"y":0.0146},{"x":7.3,"y":0.014},{"x":7.35,"y":0.0134},{"x":7.4,"y":0.0128},{"x":7.45,"y":0.0122},{"x":7.5,"y":0.0117},{"x":7.55,"y":0.0112},{"x":7.6,"y":0.0107},{"x":7.65,"y":0.0102},{"x":7.7,"y":0.0098},{"x":7.75,"y":0.0093},{"x":7.8,"y":0.0089},{"x":7.85,"y":0.0085},{"x":7.9,"y":0.0081},{"x":7.95,"y":0.0078},{"x":8,"y":0.0074}],"geoms":["line"],"x":"offset","y":"density"}

That shape is the whole problem ahead. A Gamma prior paired with a normal likelihood from the readings has no neat formula waiting at the end, the way some other pairings do. So the only way forward is to compute, not to solve.

=== step === concept
## Bayes' rule always holds, a tidy formula rarely does

Bayes' rule always holds, no matter what shape the prior takes. In words: the posterior, what you believe about the offset after seeing the data, is proportional to the prior times the likelihood, what the data say about each candidate offset.

\[ p(\text{offset} \mid \text{data}) \;\propto\; p(\text{offset}) \times p(\text{data} \mid \text{offset}) \]

That proportionality always holds. What does not always hold is a tidy formula for the whole posterior curve. For a few special pairings, multiplying the prior by the likelihood lands you back in a named distribution, with its own mean and interval you can write down directly. Statisticians call a pairing like that a conjugate prior. A Beta prior paired with a count of successes and failures is one such pair.

The Gamma prior on this oven's offset, paired with the normal likelihood from the 20 readings, is not conjugate. So there is no formula waiting at the end for its mean, its spread, or anything else about it.

Even without a formula for the whole curve, you can still compare how spread out the prior's own belief is against how spread out the data's signal is. Run this.

```r
# Compare how spread out the prior is against how spread out the data's signal is
shape <- 4
rate <- 1.3
prior_percentiles <- qgamma(c(0.05, 0.50, 0.95), shape, rate)
round(prior_percentiles, 2)
#> [1] 1.05 2.82 5.96

sigma <- 1
n <- 20
sem <- sigma / sqrt(n)
round(sem, 3)
#> [1] 0.224
```

The prior puts the middle 90% of its belief between about 1.05 and 5.96, a wide range built from years of guessing rather than from any single reading. The data, by contrast, pin the offset down to within about 0.224C of the sample average, since that is sigma over the square root of 20 readings. The data pin the offset down far more precisely here than the prior does, and that is going to matter later.

=== step === widget
## The lucky case: a conjugate pair solved by four sliders

There is one pairing where the posterior comes out instantly: a normal prior paired with a normal likelihood. Multiply two normal curves together and the result is, again, a normal curve, with its own mean and standard deviation you can read straight off a formula. No computing required.

The widget below demonstrates exactly that update, on its own generic illustration: a prior belief with a mean and a confidence of your choosing, updated by a data average built from some number of observations. Set the prior confidence slider to its widest setting, 3, and the data points slider to 20, leaving the prior mean at 0 and the data average at 3.

::widget bayes-update {}

Drag those two sliders and watch the reading below the chart update. At those settings, the posterior mean comes out at about 2.93, right next to the data average of 3, not the prior's starting guess of 0. A prior standard deviation of 3 is so wide that it carries almost no information, so the posterior follows the data almost entirely. That is the normal-normal shortcut: multiply, read off the new mean and standard deviation, done.

The oven's own prior is a Gamma, not a normal. Multiply a Gamma by a normal likelihood and the result is neither a Gamma nor a normal nor anything else with a name. So this shortcut does not apply to the oven's own Gamma prior.

=== step === concept
## You can always compute the height, just not the whole shape

Even when there is no formula for the whole posterior curve, there is always a way to get its height at any single candidate value. Pick a candidate offset, multiply the prior's density there by the likelihood's density there, and that product is the posterior's unnormalized height at that point. Unnormalized just means the heights are not yet scaled into a true probability curve, but their relative sizes already say which candidates the posterior favors.

Try it at five candidate offsets around the data's own average of 3.19.

```r
# Multiply the prior density and the likelihood density at five candidate offsets
offsets <- c(2.8, 3.0, 3.19, 3.4, 3.6)
ybar <- 3.19
prior_height <- dgamma(offsets, shape = 4, rate = 1.3)
likelihood_height <- dnorm(ybar, mean = offsets, sd = sem)
posterior_height <- prior_height * likelihood_height
data.frame(offset = offsets, height = round(posterior_height, 3),
           ratio_to_peak = round(posterior_height / max(posterior_height), 3))
#>   offset height ratio_to_peak
#> 1   2.80  0.107         0.245
#> 2   3.00  0.324         0.742
#> 3   3.19  0.436         1.000
#> 4   3.40  0.258         0.593
#> 5   3.60  0.068         0.157
```

The height peaks exactly at 3.19, the data's own average, since that is where the likelihood is highest and the prior still carries reasonable weight. Move away from it in either direction and the height drops: by 3.6, it has fallen to about 16% of the peak.

This one fact, that a height is always computable even when a whole curve is not, is what makes a general-purpose sampler possible at all. You do not need a formula for the whole posterior to compute its height at a point. You only need the prior's density and the likelihood's density, multiplied, at that one point. True at 2.8, true at 3.19, true anywhere you care to check.

=== step === concept
## A fine grid works for one parameter, and stops working for several

If you can compute the posterior's height at one point, you can compute it at thousands of points and stitch them into an approximation of the whole curve. Lay down a fine grid of candidate offsets, compute the height at every one, and scale all the heights so the total area underneath sums to 1. That turns an unnormalized height into an actual posterior density.

Use a grid of 4001 points stretched from 0 to 8.

```r
# Approximate the whole posterior with a fine grid and normalize it to integrate to 1
grid <- seq(0, 8, length.out = 4001)
step_size <- grid[2] - grid[1]
prior_height <- dgamma(grid, shape = 4, rate = 1.3)
likelihood_height <- dnorm(ybar, mean = grid, sd = sem)
posterior_height <- prior_height * likelihood_height
posterior_density <- posterior_height / (sum(posterior_height) * step_size)
posterior_mean <- sum(grid * posterior_density) * step_size
posterior_mode <- grid[which.max(posterior_density)]
posterior_sd <- sqrt(sum((grid - posterior_mean)^2 * posterior_density) * step_size)
round(c(mean = posterior_mean, mode = posterior_mode, sd = posterior_sd), 3)
#>  mean  mode    sd 
#> 3.173 3.172 0.222 
```

The grid turns a problem with no formula into three concrete numbers: a posterior mean of 3.173, a mode of 3.172, and a standard deviation of 0.222. Notice how much narrower this already looks than the prior's own wide spread. Twenty readings have pinned the offset down hard.

Plotted on the same 0 to 8 axis as the prior, the posterior is a tall, narrow spike.

::widget chart-plotter {"data":[{"x":0,"y":0},{"x":0.05,"y":0},{"x":0.1,"y":0},{"x":0.15,"y":0},{"x":0.2,"y":0},{"x":0.25,"y":0},{"x":0.3,"y":0},{"x":0.35,"y":0},{"x":0.4,"y":0},{"x":0.45,"y":0},{"x":0.5,"y":0},{"x":0.55,"y":0},{"x":0.6,"y":0},{"x":0.65,"y":0},{"x":0.7,"y":0},{"x":0.75,"y":0},{"x":0.8,"y":0},{"x":0.85,"y":0},{"x":0.9,"y":0},{"x":0.95,"y":0},{"x":1,"y":0},{"x":1.05,"y":0},{"x":1.1,"y":0},{"x":1.15,"y":0},{"x":1.2,"y":0},{"x":1.25,"y":0},{"x":1.3,"y":0},{"x":1.35,"y":0},{"x":1.4,"y":0},{"x":1.45,"y":0},{"x":1.5,"y":0},{"x":1.55,"y":0},{"x":1.6,"y":0},{"x":1.65,"y":0},{"x":1.7,"y":0},{"x":1.75,"y":0},{"x":1.8,"y":0},{"x":1.85,"y":0},{"x":1.9,"y":0},{"x":1.95,"y":0},{"x":2,"y":0},{"x":2.05,"y":0},{"x":2.1,"y":0},{"x":2.15,"y":0},{"x":2.2,"y":1e-04},{"x":2.25,"y":3e-04},{"x":2.3,"y":8e-04},{"x":2.35,"y":0.0018},{"x":2.4,"y":0.0042},{"x":2.45,"y":0.0089},{"x":2.5,"y":0.0181},{"x":2.55,"y":0.035},{"x":2.6,"y":0.0643},{"x":2.65,"y":0.1122},{"x":2.7,"y":0.1862},{"x":2.75,"y":0.2934},{"x":2.8,"y":0.4395},{"x":2.85,"y":0.6257},{"x":2.9,"y":0.8464},{"x":2.95,"y":1.0882},{"x":3,"y":1.3297},{"x":3.05,"y":1.5443},{"x":3.1,"y":1.7046},{"x":3.15,"y":1.7884},{"x":3.2,"y":1.7835},{"x":3.25,"y":1.6906},{"x":3.3,"y":1.5233},{"x":3.35,"y":1.3048},{"x":3.4,"y":1.0623},{"x":3.45,"y":0.8222},{"x":3.5,"y":0.605},{"x":3.55,"y":0.4232},{"x":3.6,"y":0.2814},{"x":3.65,"y":0.1779},{"x":3.7,"y":0.1069},{"x":3.75,"y":0.0611},{"x":3.8,"y":0.0332},{"x":3.85,"y":0.0171},{"x":3.9,"y":0.0084},{"x":3.95,"y":0.0039},{"x":4,"y":0.0017},{"x":4.05,"y":7e-04},{"x":4.1,"y":3e-04},{"x":4.15,"y":1e-04},{"x":4.2,"y":0},{"x":4.25,"y":0},{"x":4.3,"y":0},{"x":4.35,"y":0},{"x":4.4,"y":0},{"x":4.45,"y":0},{"x":4.5,"y":0},{"x":4.55,"y":0},{"x":4.6,"y":0},{"x":4.65,"y":0},{"x":4.7,"y":0},{"x":4.75,"y":0},{"x":4.8,"y":0},{"x":4.85,"y":0},{"x":4.9,"y":0},{"x":4.95,"y":0},{"x":5,"y":0},{"x":5.05,"y":0},{"x":5.1,"y":0},{"x":5.15,"y":0},{"x":5.2,"y":0},{"x":5.25,"y":0},{"x":5.3,"y":0},{"x":5.35,"y":0},{"x":5.4,"y":0},{"x":5.45,"y":0},{"x":5.5,"y":0},{"x":5.55,"y":0},{"x":5.6,"y":0},{"x":5.65,"y":0},{"x":5.7,"y":0},{"x":5.75,"y":0},{"x":5.8,"y":0},{"x":5.85,"y":0},{"x":5.9,"y":0},{"x":5.95,"y":0},{"x":6,"y":0},{"x":6.05,"y":0},{"x":6.1,"y":0},{"x":6.15,"y":0},{"x":6.2,"y":0},{"x":6.25,"y":0},{"x":6.3,"y":0},{"x":6.35,"y":0},{"x":6.4,"y":0},{"x":6.45,"y":0},{"x":6.5,"y":0},{"x":6.55,"y":0},{"x":6.6,"y":0},{"x":6.65,"y":0},{"x":6.7,"y":0},{"x":6.75,"y":0},{"x":6.8,"y":0},{"x":6.85,"y":0},{"x":6.9,"y":0},{"x":6.95,"y":0},{"x":7,"y":0},{"x":7.05,"y":0},{"x":7.1,"y":0},{"x":7.15,"y":0},{"x":7.2,"y":0},{"x":7.25,"y":0},{"x":7.3,"y":0},{"x":7.35,"y":0},{"x":7.4,"y":0},{"x":7.45,"y":0},{"x":7.5,"y":0},{"x":7.55,"y":0},{"x":7.6,"y":0},{"x":7.65,"y":0},{"x":7.7,"y":0},{"x":7.75,"y":0},{"x":7.8,"y":0},{"x":7.85,"y":0},{"x":7.9,"y":0},{"x":7.95,"y":0},{"x":8,"y":0}],"geoms":["line"],"x":"offset","y":"density"}

Compare that narrow spike against the oven's own Gamma prior curve, wide and low by comparison. That difference in width is the data at work: a prior that could plausibly have been anywhere between 1 and 6 has been narrowed by 20 readings down to a sliver around 3.17.

A grid like this works because there was only one unknown, the offset. Add more unknowns and the grid stops being usable. Keeping the same resolution across five unknowns at once would need 4001 raised to the 5th power evaluations.

```r
# See how a one-parameter grid explodes once several parameters are unknown together
format(4001^5, scientific = TRUE, digits = 3)
#> [1] "1.03e+18"
```

That is about 10 to the 18th evaluations, a number no computer will finish in your lifetime. One unknown, and a grid is fine. A handful of unknowns, which is the normal case the moment a model has more than one parameter, and the grid is instantly impossible.

=== step === concept
## Validate first, trust second

Before trusting a brand new computational method on a problem with no known answer, test it on a version of the same problem where the answer is known. Build a general-purpose sampler, check it against a case you can verify by hand, then point it at the real Gamma prior only once it passes that check.

A flat, uninformative prior turns this exact problem conjugate. If the prior assigns equal weight to every possible offset, multiplying it by the normal likelihood leaves the likelihood essentially unchanged, and the posterior comes out as a normal distribution by formula: its mean is the data's own average, and its standard deviation is sigma over the square root of n, the same 0.224 you already saw.

```r
# The flat-prior posterior has a known formula: Normal(ybar, sigma / sqrt(n))
round(c(mean = ybar, sd = sem), 3)
#>  mean    sd 
#> 3.190 0.224 
```

Call this the answer key. Whatever general sampling method comes next has to reproduce 3.19 and 0.224 on this flat-prior version before you can trust it on the real Gamma-prior problem, where there is no answer key to check against.

=== step === widget
## A Metropolis sampler, about fifteen lines, built from scratch

Here is a general method that needs no formula at all: start at some candidate offset, propose a small random step away from it, and decide whether to take that step using one rule. The rule is called the Metropolis rule, named after the 1953 paper that introduced it.

Propose a new candidate by nudging the current one with a bit of normal noise. If the new candidate's posterior height is higher than the current one's, take the step for certain. If it is lower, take the step anyway, but only with a probability equal to the ratio of the new height to the current one's: a small drop in height is often taken, a big drop rarely is. Either way, record wherever the chain ends up, then repeat the whole thing thousands of times.

In log form, since multiplying thousands of tiny probabilities quickly underflows to zero, this is about fifteen lines of base R.

```r
# Build a Metropolis sampler and validate it on the flat-prior case, where the answer is known
logpost_flat <- function(mu) dnorm(ybar, mean = mu, sd = sem, log = TRUE)

metropolis <- function(logpost, start, proposal_sd, n_iter) {
  chain <- numeric(n_iter)
  chain[1] <- start
  current <- start
  n_accept <- 0
  for (i in 2:n_iter) {
    candidate <- rnorm(1, current, proposal_sd)
    log_ratio <- logpost(candidate) - logpost(current)
    if (log(runif(1)) < log_ratio) {
      current <- candidate
      n_accept <- n_accept + 1
    }
    chain[i] <- current
  }
  list(chain = chain, acceptance = n_accept / (n_iter - 1))
}

set.seed(2026)
for (proposal_sd in c(0.08, 0.5, 3)) {
  fit <- metropolis(logpost_flat, start = 3, proposal_sd = proposal_sd, n_iter = 10000)
  cat("proposal sd", proposal_sd, "acceptance", round(fit$acceptance, 3),
      "mean", round(mean(fit$chain), 3), "sd", round(sd(fit$chain), 3), "\n")
}
#> proposal sd 0.08 acceptance 0.883 mean 3.188 sd 0.222 
#> proposal sd 0.5 acceptance 0.457 mean 3.188 sd 0.22 
#> proposal sd 3 acceptance 0.094 mean 3.195 sd 0.222 
```

All three widths land close to the answer key, 3.19 and 0.224, so the sampler is doing its job no matter how far it steps. But look at the acceptance column. A tiny proposal width of 0.08 gets accepted 88.3% of the time, so the chain barely moves each step and crawls across the posterior slowly even though it is rarely turned down. A huge width of 3 gets accepted only 9.4% of the time, since most big jumps land somewhere with a much lower height and get rejected. A proposal width of 0.5 sits in between, accepted 45.7% of the time, and mixes through the posterior fastest of the three.

This tradeoff, between step size and how efficiently the chain explores, is exactly what the widget below lets you feel directly.

::widget mcmc-walk {}

This widget targets the same flat-prior posterior, Normal(3.19, 0.224), that you just validated by hand. Toggle between its three preset proposal widths and watch the acceptance rate update live: 86.6% for the smallest, 46.9% for the medium one, and 9.8% for the largest, the same pattern your own code just produced. The top panel traces the chain's path over iterations, and the bottom panel fills in a histogram of the chain against the true posterior curve.

The code block the widget itself prints runs the identical Metropolis loop, but on a freshly simulated sample of 20 readings rather than reusing the oven's own 3.19. So its printed numbers will land close to, but not exactly on, the ones you already computed. The method is what matters here, not which particular sample it happens to run on.

=== step === quiz
## Quick check: the Metropolis accept-or-reject rule

Try the rule by hand. Using the real Gamma prior's height, now written in logs, the posterior's log height at a current offset of 3.0 works out to -1.129.

Propose a move to 3.3. Its log height is -0.993, a rise of 0.136 over the current point. By the Metropolis rule, a rise is accepted for certain.

Now propose a move to 2.6 instead. Its log height is -4.158, a fall of 3.029 from the current point. The chain does not automatically reject this. It accepts the move with probability exp(-3.029), which works out to 0.048, about a 1 in 21 chance.

What should happen to the proposed move to 2.6?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Rejected outright, since the proposed point's height fell. ::no
- Accepted with probability 0.048, about a 1 in 21 chance, since that is exp of the fall in log height. ::ok Exactly. A fall in height is never an automatic rejection. The chain still takes it sometimes, just rarely, in proportion to how far the height dropped.
- Accepted outright, the same as the move to 3.3. ::no
- Accepted with a flat 50% chance, since the chain is just as likely to go up as down. ::no The Metropolis rule has no fixed coin flip anywhere in it. A proposal that climbs is always taken. A proposal that falls is taken with probability equal to exp of the log-height difference, here exp(-3.029), which is 0.048, not 0.5.

=== step === concept
## Trusting the sampler on the real prior

You just validated the sampler on a problem with a known answer. Now point the exact same machinery at the real problem: the oven's own Gamma prior, which has no formula to check against.

Only one thing changes in the code: the log-posterior function. Swap in the Gamma prior's log density plus the likelihood's log density, and restrict the offset to positive values, since a Gamma distribution assigns zero probability to anything at or below zero.

```r
# Point the identical sampler at the real Gamma prior instead of a flat one
logpost_real <- function(mu) {
  if (mu <= 0) return(-Inf)
  dgamma(mu, shape = 4, rate = 1.3, log = TRUE) + dnorm(ybar, mean = mu, sd = sem, log = TRUE)
}

set.seed(2026)
fit_real <- metropolis(logpost_real, start = 3, proposal_sd = 0.5, n_iter = 10000)
round(c(acceptance = fit_real$acceptance, mean = mean(fit_real$chain), sd = sd(fit_real$chain)), 3)
#> acceptance       mean         sd 
#>      0.466      3.172      0.219 
```

The chain lands at a mean of 3.172 and a standard deviation of 0.219, with an acceptance rate of 46.6%, close to the grid approximation's 3.173 and 0.222. Nothing in the code above ever referenced that grid. It just ran the same validated loop with a different height function, and arrived at the same place by a completely different route.

This is the whole payoff. There was never a formula for this posterior, and there still isn't one. But the sampler reaches its mean and spread anyway, built from nothing more than the ability to compute a height at a point and a rule that sometimes accepts a step downhill.

=== step === concept
## Hamiltonian Monte Carlo and the checklist for trusting a chain
::prose-only no catalog widget models HMC's gradient-guided proposal or multi-chain diagnostics; explained and defined directly

The Metropolis sampler above proposes its next step blindly, as a random nudge in a random direction. It works, but on harder problems with many parameters, most of those blind proposals land somewhere with a lower height and get rejected, so the chain crawls.

Hamiltonian Monte Carlo, usually shortened to HMC, fixes this by proposing with information instead of proposing blindly. It computes the log-posterior's gradient, how steeply the height is rising or falling at the current point, and uses that slope to steer the proposal like a ball rolling with momentum across the posterior's surface. A proposal guided this way is far more likely to land somewhere with a comparable or higher height, so it can take bigger, more useful steps and explore the posterior in far fewer iterations than a blind random walk. The tradeoff is that each step costs more to compute, since it needs that gradient.

Whichever sampler produced a chain, Metropolis or HMC, there is a standard checklist to run through before trusting its answer.

- A **trace plot** is the chain's value plotted against its iteration number. A healthy trace looks like noise scattered evenly around a stable level, with no drift and no long flat stretches where the chain got stuck.
- **R-hat** compares several chains started from different starting points. If they have all explored the same posterior, R-hat sits close to 1, generally below about 1.01. A higher R-hat means the chains still disagree about where the posterior actually is.
- **Effective sample size**, usually shortened to ESS, states how many roughly independent draws a correlated chain is actually worth. Since consecutive draws in any one chain are correlated with each other, the ESS is always smaller than the raw number of iterations run.
- A **divergence** is a warning specific to HMC, raised when a proposed trajectory becomes numerically unstable partway through. Even one divergence is a sign that some region of the posterior was not explored properly.

None of these four checks, on its own, proves a chain converged. Together, they are the closest thing this whole approach has to a safety net.

=== step === quiz
## Closing check: judging a chain before trusting it

Four chains were run on a model, and the report back says this: R-hat is 1.08, the acceptance rate was 90% using a small proposal width, and there were 0 divergences.

Should this chain be trusted?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Yes, since 0 divergences means nothing went wrong. ::no
- Yes, since a 90% acceptance rate means the chain mixed well. ::no
- No. An R-hat of 1.08 is above the roughly 1.01 threshold, which means the separate chains still disagree about where the posterior sits, regardless of what the other two numbers say. ::ok Right. R-hat checks something the other two numbers cannot: whether independent chains, started from different places, converged on the same answer. A pass on acceptance or divergences does not make up for a fail here.
- Yes, since the chains ran all the way to completion. ::no Running to completion only means the sampler did not crash. It says nothing about whether the chains actually converged on the same posterior. Here R-hat flags that they did not, and a 90% acceptance rate at a small proposal width is usually a sign of slow mixing rather than a healthy chain, which only compounds the problem.

=== step === tryit
## Your turn: change the proposal width, read the acceptance rate

The functions `metropolis()` and `logpost_flat()` are already defined and ready to reuse. Run the code below once as it stands, then change the proposal width and run it again to see how the acceptance rate responds.

```r
# Run the validated sampler on the flat-prior case and read off the acceptance rate
propSD <- 0.08
set.seed(2026)
fit <- metropolis(logpost_flat, start = 3, proposal_sd = propSD, n_iter = 10000)
round(c(acceptance = fit$acceptance, mean = mean(fit$chain), sd = sd(fit$chain)), 3)
```
::check {"regex": "propSD\\s*<-\\s*(?!0\\.08)[0-9]", "gate": true, "difficulty": "intermediate", "ok": "Right: a wider proposal drops the acceptance rate, the same tradeoff you just saw in the Metropolis sampler above. The posterior mean and standard deviation barely move, since the sampler still lands in the same place either way.", "no": "Change the value assigned to propSD away from 0.08, then run the block again. Try something like propSD <- 2."}
::solution
```r
# Try a much wider proposal width and watch the acceptance rate drop
propSD <- 2
set.seed(2026)
fit <- metropolis(logpost_flat, start = 3, proposal_sd = propSD, n_iter = 10000)
round(c(acceptance = fit$acceptance, mean = mean(fit$chain), sd = sd(fit$chain)), 3)
#> acceptance       mean         sd 
#>      0.140      3.198      0.216 
```

Acceptance drops from 88.3% all the way to 14.0%, since most proposals this far from the current point land somewhere with a much lower height. Yet the posterior mean and standard deviation barely move, still close to 3.19 and 0.22. The proposal width changes how efficiently the chain explores. It does not change where the chain ends up.

=== step === concept
## References

- [Bayesian Data Analysis, 3rd edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013), CRC Press. The standard reference behind the grid approximation, the Metropolis sampler, and Hamiltonian Monte Carlo alike.
- [Understanding the Metropolis-Hastings Algorithm](https://doi.org/10.1080/00031305.1995.10476177) - Chib and Greenberg (1995), The American Statistician, 49(4), 327-335. A clear derivation of the accept-or-reject rule built by hand above.
- [MCMC Using Hamiltonian Dynamics](https://arxiv.org/abs/1206.1901) - Neal (2011), in Handbook of Markov Chain Monte Carlo, CRC Press. The detailed account of how the log-posterior's gradient steers an HMC proposal.
- [Rank-Normalization, Folding, and Localization: An Improved R-hat for Assessing Convergence of MCMC](https://doi.org/10.1214/20-BA1221) - Vehtari, Gelman, Simpson, Carpenter and Burkner (2021), Bayesian Analysis, 16(2), 667-718. The current standard behind the R-hat diagnostic named in the checklist above.

=== step === complete
## What sampling buys you when algebra cannot

Walk back through what just happened, because the payoff of this method is easy to undersell.

Bayes' rule always holds: the posterior is proportional to the prior times the likelihood, for any prior you can write down, any likelihood you can write down. A closed-form formula for the whole posterior is the rare exception, true only for a handful of lucky pairings like a normal prior with a normal likelihood.

What never stops being possible is computing the posterior's unnormalized height at one point, by multiplying two densities. A fine grid turns that into an approximation of the whole curve for one unknown, but a grid's cost explodes the moment there is more than one. The Metropolis sampler turns the same idea, evaluate and compare heights, into a method that scales: propose a step, accept it for certain if it climbs, accept it with a probability if it falls, and record wherever the chain lands. Validated on a flat-prior case with a known answer, then pointed unchanged at the real Gamma prior, it reached a mean and spread no formula could have given directly.

Hamiltonian Monte Carlo speeds up the same idea by proposing with the log-posterior's own slope instead of proposing blindly. And the checklist, trace plots, R-hat, effective sample size, divergences, is what separates a chain that actually converged from one that only looks like it did.

The next place all of this gets put to work is a real regression's coefficients, with more than one parameter on the table at once.

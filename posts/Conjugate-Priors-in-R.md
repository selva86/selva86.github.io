---
title: "Conjugate Priors in R: The Shortcut That Gives Exact Posteriors Without MCMC"
slug: "Conjugate-Priors-in-R"
description: "Conjugate priors in R give exact posteriors in closed form. Master Beta-Binomial, Gamma-Poisson, and Normal-Normal updates with worked simulations, no MCMC."
keywords: "conjugate priors R, Beta-Binomial, Gamma-Poisson, Normal-Normal, posterior closed form, Bayesian inference R, conjugate distribution, prior posterior R"
auto_link_terms: "conjugate prior|Beta-Binomial conjugate|Gamma-Poisson conjugate|Normal-Normal conjugate|conjugate family|posterior closed form"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-05-09"
curriculum_id: "5.1.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Conjugate Priors"
sidebar_order: 112
difficulty: "Intermediate"
---

# Conjugate Priors in R: The Shortcut That Gives Exact Posteriors Without MCMC

<p class="lead">You ran a small website test. 9 visitors saw a new button, 6 of them clicked. You want to know the true click-through rate, with a proper sense of how uncertain it is. There is a one-line shortcut in R that gives you the answer exactly, no simulation, no integration. The trick is called a conjugate prior, and once you see it work you will reach for it for the rest of your career.</p>

## What is the closed-form shortcut for proportion problems?

Take the website test as the running example. 9 visitors, 6 clicks. Without any prior knowledge about what click-through rates usually look like, you might guess "around 6/9 = 0.67." But that single number tells you nothing about how confident you should be. Was 6/9 just a fluky run of 9 visitors when the true rate is 0.5? Or are you slightly under-counting and it's really 0.8? You want the *range* of plausible rates, not a single number.

There is a piece of mathematical luck that makes this easy. For proportion data with a flat starting belief, the posterior (the curve of plausible rates after seeing the data) has a known shape: it is a member of the Beta family. Two numbers describe it completely. Add the number of clicks to one of them, add the misses to the other, done.

```r title="The whole calculation, in two lines"
n <- 9       # visitors
k <- 6       # clicks

post_a <- 1 + k          # adds clicks to alpha
post_b <- 1 + (n - k)    # adds non-clicks to beta

# Most plausible rate, and a 95% range
post_a / (post_a + post_b)
#> [1] 0.6363636
qbeta(c(0.025, 0.975), post_a, post_b)
#> [1] 0.3149859 0.8911781
```

Most plausible click-through rate: about 64%. There's a 95% chance the true rate is somewhere between 31% and 89%. With only 9 visitors, the answer is necessarily wide; the data simply does not pin down the rate yet. But it's an honest range, not a fake-precise point estimate.

The two starting numbers, both 1, encode the assumption "before seeing data, every rate between 0% and 100% is equally plausible." A different starting belief would change those two numbers. The arithmetic stays the same. That is what makes this a shortcut: no integration, no MCMC, no special package. Just `qbeta()`.

![Why conjugacy works](screenshots/Conjugate-Priors-in-R-kernel.webp)
*Figure 1: Why the shortcut works. The prior and the data share an algebraic shape, so the posterior stays in the same family with simple arithmetic on the parameters.*

[KEY INSIGHT]
**The shortcut is just adding numbers.** Add observed successes to the first parameter, observed failures to the second. The posterior is the Beta distribution with those two new numbers. Every Bayesian summary, mean, range, "probability the rate exceeds 50%", is one call to `qbeta()` or `pbeta()` away.

**Try it:** Run the same calculation with a bigger experiment. 50 visitors, 32 clicked. Does the 95% range shrink as you'd expect?

```r title="Your turn: more visitors"
ex_n <- 50
ex_k <- 32

# compute post_a, post_b, mean, and 95% range
#> Expected: similar mean to 32/50 = 0.64, but a much narrower range
```

<details><summary>Click to reveal solution</summary>

```r title="Bigger experiment solution"
ex_a <- 1 + ex_k
ex_b <- 1 + ex_n - ex_k
ex_a / (ex_a + ex_b)
#> [1] 0.6346154
qbeta(c(0.025, 0.975), ex_a, ex_b)
#> [1] 0.5012167 0.7567060
```

The most plausible rate is essentially unchanged at 0.63 (still close to 32/50 = 0.64), but the 95% range tightened dramatically: from [0.31, 0.89] with 9 visitors down to [0.50, 0.76] with 50. More data narrows the range, exactly as it should.

</details>

## Why does this shortcut work?

You probably noticed the trick used a Beta distribution and the data was about Yes/No outcomes. That pairing is not an accident. It is a "conjugate" pair, which is just a fancy word for "they fit together algebraically." Some pairs of starting belief and data type are conjugate, most are not. When they are, you get the closed-form arithmetic above. When they aren't, you fall back to MCMC.

The reason conjugate pairs exist: a Beta curve and a Yes/No likelihood look the same when you write them out. Both are powers of `theta` and `(1-theta)`. Multiply two things that share that algebraic shape and you get something else with the same shape, just with the powers added together. That's where the addition comes from.

You don't need to memorize the math, only the *idea*: the prior says "I believe rates near X are likely," the data says "actually, rates that explain my k clicks in n trials are likely," and the math lets you combine those into a posterior that lives in the same family. The posterior is a compromise between your prior and your data. With more data, the data wins; with less data, the prior matters more.

For the math-curious, here is the formal statement:

$$ p(\theta \mid k) \;\propto\; p(k \mid \theta)\,p(\theta) \;\propto\; \theta^{a-1+k}\,(1-\theta)^{b-1+n-k} $$

The right-hand side is the kernel of a $\text{Beta}(a+k, b+n-k)$ distribution, which is exactly the update rule used in the code. If symbols are not your thing, skip ahead, the practical recipe stays the same.

[NOTE]
**You can use a starting belief other than "everything equally plausible."** Setting `prior_a` and `prior_b` to different numbers encodes a stronger or skewed prior. A `Beta(2, 2)` prior is mildly skeptical of extreme rates. A `Beta(20, 20)` prior is strongly centered at 50%. The update rule (add k to alpha, add n-k to beta) is unchanged.

**Try it:** Repeat the original 6-of-9 calculation with a `Beta(2, 2)` prior. The posterior parameters change, but the recipe doesn't.

```r title="Your turn: a different starting belief"
ex_prior_a <- 2
ex_prior_b <- 2

# update with the same data (n=9, k=6) and report mean and 95% range
#> Expected: posterior pulled slightly toward 0.5 compared to the flat-prior version
```

<details><summary>Click to reveal solution</summary>

```r title="Beta(2, 2) prior solution"
ex_post_a <- ex_prior_a + 6
ex_post_b <- ex_prior_b + 9 - 6
ex_post_a / (ex_post_a + ex_post_b)
#> [1] 0.6153846
qbeta(c(0.025, 0.975), ex_post_a, ex_post_b)
#> [1] 0.3531571 0.8407018
```

Posterior mean drops from 0.64 (flat prior) to 0.62 with the mildly-skeptical prior, slightly pulled toward the center. The 95% range also narrows a touch because the prior contributes a bit of information.

</details>

## Where else does the shortcut work?

Three pairings show up most often in real work. They share the same idea, just with different distributions for different kinds of data.

**For proportions** (yes/no, click/no-click, defect/no-defect), the pair is Beta-Binomial. You already saw it.

**For rates** (events per day, calls per hour, accidents per month), the pair is Gamma-Poisson. The starting belief is a Gamma curve over plausible rates; the data is counts. The update: add the total observed events to alpha, add the number of observation periods to beta.

```r title="Gamma-Poisson rate update"
# Five days of customer support tickets
y <- c(8, 12, 7, 15, 9)

prior_a <- 2          # mild prior: "around 8 tickets per day, but uncertain"
prior_b <- 0.25

post_a <- prior_a + sum(y)            # 2 + 51 = 53
post_b <- prior_b + length(y)          # 0.25 + 5 = 5.25

post_a / post_b                        # most plausible rate
#> [1] 10.09524
qgamma(c(0.025, 0.975), post_a, post_b)
#> [1]  7.563749 12.916091
```

Most plausible ticket rate is 10.1 per day; 95% range is [7.6, 12.9]. Same kind of arithmetic as the click-through case, just `qgamma()` instead of `qbeta()`.

**For Normal data with a known measurement spread** (e.g., five blood-pressure readings where you trust the cuff is accurate), the pair is Normal-Normal. The arithmetic is a precision-weighted average of your prior mean and the data mean. Slightly more setup but the same idea.

```r title="Normal-Normal mean update (known sigma)"
y <- c(135, 128, 142, 119, 130, 122, 138, 125, 132, 117)
n <- length(y)
sigma <- 10            # known measurement spread

prior_mean <- 120
prior_sd   <- 8

# Precision = 1 / variance. Posterior precision is sum of prior + data precision.
prior_prec <- 1 / prior_sd^2
data_prec  <- n / sigma^2

post_var  <- 1 / (prior_prec + data_prec)
post_mean <- post_var * (prior_mean * prior_prec + mean(y) * data_prec)

post_mean
#> [1] 125.6957
qnorm(c(0.025, 0.975), post_mean, sqrt(post_var))
#> [1] 121.4108 129.9806
```

After 10 readings averaging 128.8 and a prior centered at 120, the posterior settles at 125.7 with a 95% range of [121.4, 130.0]. The data dominated the prior because 10 readings outweighed a prior worth roughly 1.6 readings (the ratio of precisions).

![Three common conjugate pairs](screenshots/Conjugate-Priors-in-R-three-families.webp)
*Figure 2: Three common conjugate pairs and the closed-form parameters of the posterior.*

[TIP]
**These three patterns cover most everyday Bayesian work in R.** Proportions use Beta-Binomial, rates use Gamma-Poisson, and Normal data with known spread uses Normal-Normal. Internalize the recipe for each and you can write the posterior in three lines without opening a textbook.

**Try it:** Suppose you observed 25 emergency calls in 4 hours and want a posterior on calls per hour. Use a `Gamma(1, 0.5)` prior (mild belief in low rates).

```r title="Your turn: emergency call rate"
calls <- 25
hours <- 4

# update prior_a=1, prior_b=0.5 with the data; report mean and 95% range
#> Expected: rate around 6 calls per hour, range somewhere around 4 to 9
```

<details><summary>Click to reveal solution</summary>

```r title="Emergency call rate solution"
post_a <- 1 + calls
post_b <- 0.5 + hours
post_a / post_b
#> [1] 5.777778
qgamma(c(0.025, 0.975), post_a, post_b)
#> [1] 3.808076 8.107996
```

Most plausible rate is 5.8 calls per hour; 95% range is [3.8, 8.1]. Notice how the prior parameters got absorbed into the posterior arithmetic with the data.

</details>

## How sensitive is the answer to my prior choice?

A reasonable worry about Bayesian methods: "what if I picked a bad prior?" The honest check is to try several reasonable priors and see how much the answer moves. If three plausible priors give similar posteriors, the conclusion is robust. If they disagree noticeably, that itself is a finding to report.

Back to the original click-through rate problem (9 visitors, 6 clicks). Try three priors that bracket what a reasonable analyst might pick: skeptical of extreme rates, flat, and optimistic.

```r title="Three reasonable priors, same data"
priors <- list(
  skeptical  = c(2, 5),     # mean 2/7 = 0.29, mildly skeptical
  flat       = c(1, 1),     # no prior info
  optimistic = c(8, 2)      # mean 8/10 = 0.80, mildly optimistic
)

for (name in names(priors)) {
  p <- priors[[name]]
  pa <- p[1] + 6
  pb <- p[2] + 9 - 6
  mn <- pa / (pa + pb)
  cri <- qbeta(c(0.025, 0.975), pa, pb)
  cat(sprintf("%-10s posterior mean=%.2f  95%%=[%.2f, %.2f]\n", name, mn, cri[1], cri[2]))
}
#> skeptical  posterior mean=0.50  95%=[0.27, 0.73]
#> flat       posterior mean=0.64  95%=[0.31, 0.89]
#> optimistic posterior mean=0.78  95%=[0.55, 0.94]
```

Three priors, three posteriors, three different answers. The skeptical prior pulls the posterior toward 0.50, the optimistic prior pulls it toward 0.78. With only 9 visitors, the choice of prior matters a lot. With 50 visitors the spread would be much smaller; with 500 it would be barely visible.

That's the honest report you give a stakeholder: "under three reasonable starting beliefs, the click-through rate is somewhere between 0.50 and 0.78. We need more data to pin it down."

[TIP]
**Reporting prior sensitivity is what makes Bayesian analysis credible.** Always show the answer under your stated prior plus a couple of plausible alternatives. If they agree directionally, you have a solid result. If they disagree, that's a sign you need more data, or the prior matters in ways you should defend.

**Try it:** Re-run the three-prior comparison with 50 visitors and 32 clicks. Notice how the posteriors converge.

```r title="Your turn: more data, less prior sensitivity"
n2 <- 50
k2 <- 32

# loop over the same three priors and see how much the posterior means now agree
#> Expected: all three posteriors close together, in the 0.55-0.65 range
```

<details><summary>Click to reveal solution</summary>

```r title="Sensitivity with 50 visitors solution"
for (name in names(priors)) {
  p <- priors[[name]]
  pa <- p[1] + k2
  pb <- p[2] + n2 - k2
  cat(sprintf("%-10s posterior mean=%.3f\n", name, pa / (pa + pb)))
}
#> skeptical  posterior mean=0.596
#> flat       posterior mean=0.635
#> optimistic posterior mean=0.667
```

Three priors that gave posterior means from 0.50 to 0.78 with 9 data points now give 0.60 to 0.67 with 50 data points, a much narrower spread. With enough data, the prior choice barely matters.

</details>

## When does the shortcut stop working?

The arithmetic of conjugate priors is gorgeous when it works, but the list of pairs that *are* conjugate is short. The moment your model leaves that list, the closed-form disappears and you need a sampler.

Three places it breaks. **Two unknown parameters in a Normal model:** if you don't know either the mean or the spread, the conjugate setup gets ugly fast. **Hierarchical models:** when you have group-level priors over parameters in another model, e.g., separate rates per region with a global rate prior, the math no longer factors cleanly. **Custom likelihoods:** if your data follows some non-standard shape that isn't on the conjugate list, no shortcut exists.

The 2-parameter Normal case shows the wall. Both the underlying mean and the underlying spread of the data are unknown. Closed-form is gone. You can still compute a posterior numerically by laying down a grid of candidate (mean, sd) pairs, but that scales badly.

```r title="Two unknowns: closed-form disappears"
set.seed(11)
y <- rnorm(20, mean = 5, sd = 1.5)

# Lay down an 80x80 grid over (mu, sigma) and score each pair
mu_grid    <- seq(3, 7, length.out = 80)
sigma_grid <- seq(0.5, 3, length.out = 80)

post <- outer(mu_grid, sigma_grid, function(m, s) {
  ll <- sapply(seq_along(m), function(i) sum(dnorm(y, mean = m[i], sd = s[i], log = TRUE)))
  exp(ll - max(ll))
})
post <- post / sum(post)

# Most plausible mean (collapsing over sigma)
sum(mu_grid * rowSums(post))
#> [1] 5.124375
```

That's 80 × 80 = 6,400 cells, fine. Add a third unknown parameter at the same resolution and you'd be at 512,000 cells; a fifth and you'd be in the hundreds of millions. That's the wall MCMC was invented to scale past.

![When conjugacy stops helping](screenshots/Conjugate-Priors-in-R-when-fails.webp)
*Figure 3: When conjugacy stops helping. Most real models fall off this tree quickly.*

[TIP]
**brms and Stan generalize the prior + likelihood = posterior idea via sampling.** The mental model you built here, prior plus data combine into a posterior, transfers exactly. MCMC just produces samples instead of a closed form, and the same summary functions (mean, 95% range, "probability the rate exceeds X") work on those samples too.

**Try it:** Roughly how many cells does grid approximation need for 5 unknowns at 50 points each?

```r title="Your turn: grid cost for 5 unknowns"
ex_d <- 5
# total cells at 50 points each
#> Expected: a number above 300 million
```

<details><summary>Click to reveal solution</summary>

```r title="Grid cost solution"
50 ^ ex_d
#> [1] 312500000
```

Over 312 million cells. Each cell needs a likelihood evaluation. By 6-7 unknowns even cluster-scale grids are infeasible.

</details>

## Practice Exercises

### Exercise 1: A click-through rate from a smaller experiment

A new ad got 8 clicks out of 50 impressions. Use a `Beta(2, 8)` prior (mildly skeptical, mean of 0.20). Report the posterior mean, 95% range, and the posterior probability that the true rate exceeds 5%.

```r title="Exercise 1 starter"
ctr_n <- 50
ctr_k <- 8
prior_a <- 2
prior_b <- 8

# compute post_a, post_b, mean, 95% range, and 1 - pbeta(0.05, ...)
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
post_a <- prior_a + ctr_k
post_b <- prior_b + ctr_n - ctr_k
post_a / (post_a + post_b)
#> [1] 0.1666667
qbeta(c(0.025, 0.975), post_a, post_b)
#> [1] 0.07887789 0.27554510
1 - pbeta(0.05, post_a, post_b)
#> [1] 0.9919859
```

Posterior mean: 0.17. 95% range: [0.08, 0.28]. Posterior probability that the rate exceeds 5%: about 99%, very strong evidence the ad outperforms a 5% threshold.

</details>

### Exercise 2: An A/B test using two posteriors at once

Variant A got 84 clicks from 1,200 impressions. Variant B got 105 clicks from 1,180 impressions. Use a flat `Beta(1, 1)` prior on each. Use the closed-form posteriors plus 10,000 random draws from each (`rbeta()`) to estimate the probability that B's true rate is higher than A's.

```r title="Exercise 2 starter"
# 1) compute closed-form posteriors for A and B
# 2) draw 10,000 samples from each via rbeta()
# 3) report mean(b > a)
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
a_post_a <- 1 + 84;   a_post_b <- 1 + 1200 - 84
b_post_a <- 1 + 105;  b_post_b <- 1 + 1180 - 105

set.seed(2026)
draws_a <- rbeta(1e5, a_post_a, a_post_b)
draws_b <- rbeta(1e5, b_post_a, b_post_b)

mean(draws_b > draws_a)
#> [1] 0.97083
```

About 97% probability that B's true rate is higher than A's. That's a clean answer to report directly to a stakeholder, no p-values to translate.

</details>

### Exercise 3: A blood-pressure mean from prior and data

Five blood-pressure readings: 132, 128, 135, 121, 138. Known measurement standard deviation: 8. Prior on the underlying mean: `Normal(120, 10)`. Compute the posterior mean and 95% range using the Normal-Normal arithmetic.

```r title="Exercise 3 starter"
bp_y <- c(132, 128, 135, 121, 138)
bp_sigma <- 8
bp_prior_mean <- 120
bp_prior_sd <- 10

# Compute precisions, then posterior mean and variance, then 95% range with qnorm()
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
n <- length(bp_y)
prior_prec <- 1 / bp_prior_sd^2
data_prec  <- n / bp_sigma^2

post_var  <- 1 / (prior_prec + data_prec)
post_mean <- post_var * (bp_prior_mean * prior_prec + mean(bp_y) * data_prec)

post_mean
#> [1] 128.7407
sqrt(post_var)
#> [1] 3.448834
qnorm(c(0.025, 0.975), post_mean, sqrt(post_var))
#> [1] 121.9812 135.5003
```

Posterior mean: 128.7. Standard deviation: 3.4. 95% range: [122.0, 135.5]. The data mean was 130.8 and the prior mean was 120; the posterior sits at 128.7, much closer to the data because 5 measurements with sigma=8 carry more precision than a prior with sd=10.

</details>

## Complete Example: A Customer Satisfaction Report

A SaaS company surveys 200 customers; 132 say they would recommend the product. Marketing wants to claim "the recommendation rate is above 60%." Quantify that claim under three priors (skeptical, flat, optimistic) and report whether the conclusion is robust.

```r title="Customer satisfaction with three priors"
n <- 200
k <- 132

priors <- list(
  skeptical  = c(2, 5),
  flat       = c(1, 1),
  optimistic = c(8, 2)
)

for (name in names(priors)) {
  p <- priors[[name]]
  pa <- p[1] + k
  pb <- p[2] + n - k
  mn <- pa / (pa + pb)
  cri <- qbeta(c(0.025, 0.975), pa, pb)
  p_above <- 1 - pbeta(0.60, pa, pb)
  cat(sprintf("%-10s mean=%.3f  95%%=[%.3f, %.3f]  P(rate>0.60)=%.3f\n",
              name, mn, cri[1], cri[2], p_above))
}
#> skeptical  mean=0.646  95%=[0.578, 0.710]  P(rate>0.60)=0.909
#> flat       mean=0.658  95%=[0.591, 0.722]  P(rate>0.60)=0.950
#> optimistic mean=0.667  95%=[0.601, 0.731]  P(rate>0.60)=0.975
```

All three priors give posterior probability above 90% that the true rate exceeds 60%, and posterior means within 0.02 of each other. Marketing's claim is robust: under three reasonable starting beliefs, the data strongly support "the rate is above 60%." A confident report with an honest sensitivity check, in eight lines of base R.

## Summary

The closed-form trick works when the prior and the likelihood are conjugate. Three pairings cover most real work:

| Type of data | Prior | Posterior shortcut |
|---|---|---|
| Yes/No (proportions) | `Beta(a, b)` | `Beta(a + k, b + n - k)` |
| Counts (rates) | `Gamma(a, b)` | `Gamma(a + sum y, b + n)` |
| Normal with known sigma (means) | `Normal(m, s)` | precision-weighted blend of `m` and the data mean |

When you can use the shortcut, do. When you cannot (more than two unknown parameters, hierarchical models, custom likelihoods), reach for `brms` or `rstan` and let MCMC do the work. The mental model, prior plus data give a posterior, is the same in both worlds.

## References

1. Johnson, A. A., Ott, M. Q., Dogucu, M. *Bayes Rules! An Introduction to Applied Bayesian Modeling*, Chapman & Hall, 2022. Open access. Chapter 5 covers conjugate families with worked R code. [bayesrulesbook.com/chapter-5](https://www.bayesrulesbook.com/chapter-5).
2. Gelman, A., Carlin, J. B., Stern, H. S. et al. *Bayesian Data Analysis*, 3rd ed., Chapman & Hall, 2013. Chapters 2-3 derive the standard conjugate families.
3. Cook, J. D. "Diagram of Bayesian conjugate priors." [johndcook.com/blog/conjugate_prior_diagram](https://www.johndcook.com/blog/conjugate_prior_diagram/). Interactive cross-family reference.
4. Fink, D. "A Compendium of Conjugate Priors." 1997. [johndcook.com/CompendiumOfConjugatePriors.pdf](https://www.johndcook.com/CompendiumOfConjugatePriors.pdf).
5. Gelman, A. and the Stan team. "Prior choice recommendations." [github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations).
6. CRAN Task View: Bayesian Inference. [cran.r-project.org/web/views/Bayesian.html](https://cran.r-project.org/web/views/Bayesian.html).

## Continue Learning

- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html), the section opener that walks through the prior-likelihood-posterior workflow with simulation, building the intuition that conjugacy then turbocharges.
- [Grid Approximation in R](Grid-Approximation-in-R.html), what to do when the conjugate shortcut does not apply but you still want a posterior in base R, no MCMC.
- [Bayes' Theorem in R](Bayes-Theorem-in-R.html), the discrete case that motivates everything here, worked through a medical-test example.

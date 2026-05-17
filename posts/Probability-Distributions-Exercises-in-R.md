---
title: "Probability Distributions Exercises in R: 25 Real-World Problems"
slug: "Probability-Distributions-Exercises-in-R"
description: "Practice probability distributions in R with 25 problems: normal, binomial, Poisson, exponential, t, chi-square, F. d/p/q/r prefixes, hidden solutions."
keywords: "probability distributions R, dnorm exercises, rbinom R practice, dpois R exercises, qt qchisq qf R, R probability distributions exercises"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Probability Distributions"
sidebar_order: 137
fr_parent: "Probability.html"
auto_link_terms: "probability distributions R|dnorm exercises|rbinom R practice|dpois R exercises|qchisq R"
auto_link_case_sensitive: false
target_keyword: "probability distributions R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Probability Distributions Exercises in R: 25 Real-World Problems

<p class="lead">Twenty-five practice problems on probability distributions in R covering the normal, binomial, Poisson, exponential, gamma, beta, t, chi-square, and F families, plus the d/p/q/r function prefixes and applied simulation workflows. Solutions are hidden under each exercise so you can attempt the work first.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
```

## Section 1. Normal distribution (5 problems)

### Exercise 1.1: Body and tail probabilities of the standard normal

**Task:** A quant team is sanity-checking a risk model and needs three probabilities from the standard normal: P(Z <= 1.96), P(Z > 1.96), and P(-1 < Z < 1). Use `pnorm()` for all three and save the answers as a named numeric vector to `ex_1_1` with names `body`, `upper_tail`, and `within_one_sd`.

**Expected result:**

```
#>          body    upper_tail within_one_sd
#>     0.9750021     0.0249979     0.6826895
```

**Difficulty:** Beginner

[HINTS]
All three answers are areas under the standard normal curve, and the cumulative-from-the-left view gives every one of them.
Reach for `pnorm()` with the default lower tail for the body, `lower.tail = FALSE` for the upper tail, and a difference of two `pnorm()` calls at 1 and -1 for the middle band.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- c(
  body          = pnorm(1.96),
  upper_tail    = 1 - pnorm(1.96),
  within_one_sd = pnorm(1) - pnorm(-1)
)
ex_1_1
#>          body    upper_tail within_one_sd
#>     0.9750021     0.0249979     0.6826895
```

**Explanation:** `pnorm(q)` returns the lower-tail CDF P(Z <= q) by default. For the upper tail you can either subtract from 1 or pass `lower.tail = FALSE`, which is more numerically stable in the deep tail. The "within one standard deviation" probability 0.6827 is the famous 68 from the 68/95/99.7 rule, computed as the difference of two CDFs.

</details>

### Exercise 1.2: IQ score above gifted threshold

**Task:** Suppose adult IQ scores follow Normal(100, 15). A school district wants the probability that a randomly selected adult has an IQ above 130 (the conventional gifted threshold) so it can size its enrichment program. Compute this probability and save it to `ex_1_2`.

**Expected result:**

```
#> [1] 0.02275013
```

**Difficulty:** Beginner

[HINTS]
You want the area in the right tail of a normal curve, beyond the cutoff value.
Call the normal CDF at 130 with `mean = 100`, `sd = 15`, and `lower.tail = FALSE`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- pnorm(130, mean = 100, sd = 15, lower.tail = FALSE)
ex_1_2
#> [1] 0.02275013
```

**Explanation:** `pnorm(130, 100, 15, lower.tail = FALSE)` returns P(X > 130) directly without subtracting from 1. About 2.3 percent of adults score above 130, which matches the well-known "two standard deviations above the mean" rule of thumb. Avoid `1 - pnorm(130, 100, 15)` for very extreme values because of floating-point cancellation; `lower.tail = FALSE` evaluates the survival function in log space internally.

</details>

### Exercise 1.3: Process out of spec for a manufacturing line

**Task:** A bottling line fills bottles to a target of 500 ml with a known standard deviation of 4 ml. Quality control rejects any bottle below 492 ml or above 508 ml. Compute the probability that a single bottle is out of spec, then express the expected reject rate per 10,000 bottles. Save both as a named numeric vector to `ex_1_3` with names `p_reject` and `per_10k`.

**Expected result:**

```
#>     p_reject      per_10k
#>   0.04550026  455.0026390
```

**Difficulty:** Intermediate

[HINTS]
The reject region is two separate pieces, one below the lower limit and one above the upper limit, and their probabilities add.
Add `pnorm(492, 500, 4)` to `pnorm(508, 500, 4, lower.tail = FALSE)`, then scale that probability by 10000.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_reject <- pnorm(492, 500, 4) + pnorm(508, 500, 4, lower.tail = FALSE)
ex_1_3 <- c(p_reject = p_reject, per_10k = p_reject * 10000)
ex_1_3
#>     p_reject      per_10k
#>   0.04550026  455.0026390
```

**Explanation:** The reject region is two disjoint tails, so add the lower-tail probability at 492 to the upper-tail probability at 508. Because the spec limits are exactly 2 standard deviations from the mean, the answer should be close to the canonical 4.55 percent outside-2-sigma figure. For symmetric limits a faster equivalent is `2 * pnorm(-2)`; this code generalizes to asymmetric tolerances.

</details>

### Exercise 1.4: Quantile for top decile of SAT scores

**Task:** SAT total scores are modeled as Normal(1050, 200). An admissions analyst wants the minimum score required to be in the top 10 percent of test takers (the 90th percentile). Compute this cutoff and round it to the nearest integer, saving to `ex_1_4`.

**Expected result:**

```
#> [1] 1306
```

**Difficulty:** Intermediate

[HINTS]
You need the score sitting at a given percentile, which is the inverse of a cumulative probability.
Use `qnorm(0.90, mean = 1050, sd = 200)` and wrap it in `round()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- round(qnorm(0.90, mean = 1050, sd = 200))
ex_1_4
#> [1] 1306
```

**Explanation:** `qnorm(p)` inverts `pnorm()`: it returns the value `x` such that P(X <= x) = p. The 90th-percentile z-score 1.2816 multiplied by sd 200 plus mean 1050 gives 1306.3, which rounds to 1306. The d/p/q/r naming pattern is consistent across distributions (`qbinom`, `qpois`, `qt`, etc.), which lets you swap families without re-learning the API.

</details>

### Exercise 1.5: Empirical sample mean vs theoretical

**Task:** Draw a reproducible sample of 1000 observations from Normal(50, 10) using `set.seed(2026)`, then compute the empirical mean and the empirical standard deviation. Save a named numeric vector with names `sample_mean` and `sample_sd` to `ex_1_5`.

**Expected result:**

```
#> sample_mean    sample_sd
#>   49.9081     10.1734
```

**Difficulty:** Beginner

[HINTS]
Generate a reproducible random sample, then summarize it with the usual location and spread measures.
Seed with `set.seed(2026)`, draw with `rnorm(1000, mean = 50, sd = 10)`, then apply `mean()` and `sd()`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
samp <- rnorm(1000, mean = 50, sd = 10)
ex_1_5 <- c(sample_mean = mean(samp), sample_sd = sd(samp))
round(ex_1_5, 4)
#> sample_mean    sample_sd
#>   49.9081     10.1734
```

**Explanation:** `rnorm(n, mean, sd)` generates n pseudo-random draws. With n = 1000 the sample mean and sd land within roughly 1 percent of the true parameters, which gives you a tangible feel for sampling variability. The `set.seed()` call makes the draws reproducible across runs; without it every run yields different numbers, which is fine for production simulation but bad for shared exercises.

</details>

## Section 2. Binomial and Poisson (5 problems)

### Exercise 2.1: Exact binomial probability of defect count

**Task:** A semiconductor fab produces wafers with a 3 percent defect rate. An inspector samples 50 wafers. Compute the probability that exactly 2 wafers are defective using `dbinom()` and save the result to `ex_2_1`.

**Expected result:**

```
#> [1] 0.2554592
```

**Difficulty:** Beginner

[HINTS]
You want the probability of an exact count in a fixed number of independent yes/no trials.
Call `dbinom()` with the count 2, `size = 50`, and `prob = 0.03`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- dbinom(2, size = 50, prob = 0.03)
ex_2_1
#> [1] 0.2554592
```

**Explanation:** `dbinom(x, size, prob)` evaluates the binomial PMF P(X = x) for n trials with success probability p. Roughly 25.5 percent of samples of 50 wafers will contain exactly 2 defectives. A common mistake is passing `dbinom(0.03, 50, 2)`: arguments are positional and the first slot is the count, not the probability. When in doubt name the arguments.

</details>

### Exercise 2.2: At-least-k correct by guessing

**Task:** A 20-question multiple-choice exam has 4 options per question and a student guesses every answer. Compute the probability of getting at least 8 questions correct purely by chance. Save to `ex_2_2`.

**Expected result:**

```
#> [1] 0.00563208
```

**Difficulty:** Intermediate

[HINTS]
"At least 8" is the upper tail of a count distribution, so rewrite it as a strict inequality before the cumulative function lines up.
Use `pbinom(7, size = 20, prob = 0.25, lower.tail = FALSE)` - note the 7, not 8.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pbinom(7, size = 20, prob = 0.25, lower.tail = FALSE)
ex_2_2
#> [1] 0.00563208
```

**Explanation:** P(X >= 8) = P(X > 7) = `pbinom(7, lower.tail = FALSE)`. The lower-tail flag is preferred over `1 - pbinom(7, ...)` for numerical accuracy in the tail. Note the off-by-one: `pbinom(8, ..., lower.tail = FALSE)` would return P(X > 8) = P(X >= 9), which excludes the case X = 8. Always read the inequality direction carefully when using discrete CDFs.

</details>

### Exercise 2.3: Poisson probability of call volume

**Task:** A customer support hotline receives a Poisson stream of calls at an average rate of 12 per hour. Compute the probability that exactly 15 calls arrive in a randomly chosen hour and save the result to `ex_2_3`.

**Expected result:**

```
#> [1] 0.07239112
```

**Difficulty:** Beginner

[HINTS]
You want the probability of an exact event count when events arrive at a steady average rate.
Call `dpois()` at 15 with `lambda = 12`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- dpois(15, lambda = 12)
ex_2_3
#> [1] 0.07239112
```

**Explanation:** The Poisson distribution has a single parameter lambda equal to both the mean and the variance. `dpois(x, lambda)` evaluates P(X = x). The Poisson is the natural model for counts of independent events in fixed time or space windows: call arrivals, photon detections, web hits, mutations along a DNA segment. If your data has variance much larger than the mean, switch to a negative binomial instead.

</details>

### Exercise 2.4: Staffing the 99th percentile of call volume

**Task:** The same hotline as the prior exercise (lambda = 12 calls per hour) staffs to the 99th percentile of hourly call volume to avoid wait-time SLA breaches. Compute the smallest integer call count that captures at least 99 percent of hours and save to `ex_2_4`.

**Expected result:**

```
#> [1] 21   # smallest integer with P(X <= x) >= 0.99
```

**Difficulty:** Intermediate

[HINTS]
You need the smallest count that captures a target share of hours, which is the inverse of a cumulative count probability.
Use `qpois(0.99, lambda = 12)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- qpois(0.99, lambda = 12)
ex_2_4
#> [1] 21
```

**Explanation:** `qpois(p, lambda)` returns the smallest integer x such that P(X <= x) >= p. Staffing for 21 simultaneous calls covers 99 percent of hours given lambda = 12. The discrete quantile function steps in integers, so `qpois(0.99, 12)` and `qpois(0.995, 12)` may return the same value. For continuous distributions like the normal the quantile is unique; for discrete ones the right-continuous convention is enforced.

</details>

### Exercise 2.5: Estimate Bernoulli success rate by simulation

**Task:** Simulate 10000 Bernoulli trials with true success probability 0.37 using `set.seed(7)` and `rbinom()`, then compute the empirical proportion of successes and the absolute error vs the true rate. Save both as a named numeric vector with names `p_hat` and `abs_error` to `ex_2_5`.

**Expected result:**

```
#>      p_hat  abs_error
#>     0.3677   0.0023
```

**Difficulty:** Intermediate

[HINTS]
Simulate many single yes/no trials, then compare the observed success share with the true rate.
Seed with `set.seed(7)`, draw with `rbinom(10000, size = 1, prob = 0.37)`, take `mean()`, and use `abs()` for the error.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
trials <- rbinom(10000, size = 1, prob = 0.37)
p_hat <- mean(trials)
ex_2_5 <- c(p_hat = p_hat, abs_error = abs(p_hat - 0.37))
round(ex_2_5, 4)
#>      p_hat  abs_error
#>     0.3677   0.0023
```

**Explanation:** `rbinom(n, size = 1, prob)` draws n Bernoulli trials. The empirical proportion 0.3677 differs from the true 0.37 by about 0.0023, which is consistent with the theoretical standard error sqrt(p*(1-p)/n) = sqrt(0.37*0.63/10000) = 0.00483. By the law of large numbers, p_hat converges to p as n grows, but at the slow sqrt(n) rate: to halve the error you need four times as many trials.

</details>

## Section 3. Continuous distributions (5 problems)

### Exercise 3.1: Uniform: probability and verification of mean

**Task:** A delivery dispatcher models arrival time at a depot as Uniform(15, 45) minutes past the hour. Compute the probability the package arrives between minute 20 and minute 30, and also the theoretical mean of the distribution. Save a named numeric vector with names `p_window` and `theory_mean` to `ex_3_1`.

**Expected result:**

```
#>    p_window theory_mean
#>      0.3333     30.0000
```

**Difficulty:** Beginner

[HINTS]
For a uniform distribution the probability of an interval is just its share of the total range, and the mean sits at the midpoint.
Take the difference of two `punif()` calls at 30 and 20 with `min = 15`, `max = 45`, and compute `(15 + 45) / 2` for the mean.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_window <- punif(30, min = 15, max = 45) - punif(20, min = 15, max = 45)
ex_3_1 <- c(p_window = p_window, theory_mean = (15 + 45) / 2)
round(ex_3_1, 4)
#>    p_window theory_mean
#>      0.3333     30.0000
```

**Explanation:** For Uniform(a, b) the CDF is linear: P(X <= x) = (x - a) / (b - a). The 10-minute window from 20 to 30 spans one-third of the 30-minute support, hence p = 1/3. The theoretical mean is the midpoint (a + b) / 2 = 30. The uniform is a useful baseline for "completely uninformed" probabilities and a building block for inverse-CDF sampling from any other distribution.

</details>

### Exercise 3.2: Exponential: probability of long service time

**Task:** A web service has request handling times that are exponentially distributed with rate 1/200 per millisecond (mean 200 ms). The SRE team needs the probability that a single request takes longer than 500 ms, since requests exceeding that figure trigger an alert. Save the answer to `ex_3_2`.

**Expected result:**

```
#> [1] 0.082085
```

**Difficulty:** Intermediate

[HINTS]
You want the chance a waiting time exceeds a threshold, which is the right tail of the waiting-time distribution.
Call `pexp(500, rate = 1/200, lower.tail = FALSE)` - note it takes a rate, not a mean.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pexp(500, rate = 1/200, lower.tail = FALSE)
ex_3_2
#> [1] 0.082085
```

**Explanation:** `pexp()` uses the rate parameter (reciprocal of the mean), not the mean. With rate = 1/200 the mean is 200 and the upper-tail probability at 500 is exp(-500/200) = exp(-2.5) = 0.0821. About 8 percent of requests will breach the 500 ms threshold. The exponential is memoryless, which makes it the canonical model for waiting times in a Poisson process; if observed data is heavier-tailed than exponential, consider a Weibull or log-normal model.

</details>

### Exercise 3.3: Gamma: 95th percentile of cumulative service time

**Task:** Suppose 5 independent jobs each take Exponential(rate = 1/30) seconds to process. The total time follows Gamma(shape = 5, rate = 1/30). Compute the 95th percentile of the total time and save it (in seconds) to `ex_3_3`.

**Expected result:**

```
#> [1] 273.3057
```

**Difficulty:** Intermediate

[HINTS]
The total of several independent waiting times follows a gamma distribution, and you need its 95th percentile.
Use `qgamma(0.95, shape = 5, rate = 1/30)`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- qgamma(0.95, shape = 5, rate = 1/30)
ex_3_3
#> [1] 273.3057
```

**Explanation:** The sum of k independent Exponential(rate) variables is Gamma(shape = k, rate). With shape 5 and rate 1/30 the mean is 5 * 30 = 150 and the 95th percentile is about 273 seconds. The Gamma generalizes both the exponential (shape = 1) and the chi-square (shape = df/2, rate = 1/2). Be careful with parameterization: R lets you supply either `rate` or `scale` (with rate = 1 / scale); supplying both raises an error.

</details>

### Exercise 3.4: Beta: posterior mean of conversion rate

**Task:** An e-commerce team starts with a Beta(2, 2) prior on a checkout conversion rate, then observes 47 conversions out of 100 visitors. The posterior is Beta(2 + 47, 2 + 53) = Beta(49, 55). Compute the posterior mean and the lower bound of the 95 percent equal-tailed credible interval (the 2.5th percentile). Save both as a named numeric vector with names `post_mean` and `cred_lower` to `ex_3_4`.

**Expected result:**

```
#>  post_mean cred_lower
#>     0.4712     0.3752
```

**Difficulty:** Advanced

[HINTS]
A beta posterior has a closed-form mean from its two shape parameters, and its credible bound is a percentile of that beta.
Compute the mean as `alpha / (alpha + beta)` with alpha 49 and beta 55, and get the lower bound from `qbeta(0.025, shape1 = 49, shape2 = 55)`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
alpha <- 49
beta_param <- 55
post_mean <- alpha / (alpha + beta_param)
cred_lower <- qbeta(0.025, shape1 = alpha, shape2 = beta_param)
ex_3_4 <- c(post_mean = post_mean, cred_lower = cred_lower)
round(ex_3_4, 4)
#>  post_mean cred_lower
#>     0.4712     0.3752
```

**Explanation:** Beta(alpha, beta) is the conjugate prior for the binomial likelihood, so the posterior after observing s successes and f failures is Beta(alpha + s, beta + f). The posterior mean is alpha / (alpha + beta). The 2.5th percentile `qbeta(0.025, ...)` is the lower bound of the equal-tailed 95 percent credible interval. Note this is different from a highest-density interval (HDI) for skewed Beta posteriors; the `HDInterval` package computes the HDI if you need it.

</details>

### Exercise 3.5: Lognormal: tail probability of asset return

**Task:** A daily asset price ratio is modeled as Lognormal(meanlog = 0.0005, sdlog = 0.012), which means log-returns are approximately Normal(0.0005, 0.012). The risk team wants the probability of a daily ratio above 1.025 (a 2.5 percent up-move). Save the probability to `ex_3_5`.

**Expected result:**

```
#> [1] 0.01952155
```

**Difficulty:** Advanced

[HINTS]
A lognormal tail probability is driven entirely by the normal that governs its logarithm.
Call `plnorm(1.025, meanlog = 0.0005, sdlog = 0.012, lower.tail = FALSE)`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- plnorm(1.025, meanlog = 0.0005, sdlog = 0.012, lower.tail = FALSE)
ex_3_5
#> [1] 0.01952155
```

**Explanation:** `plnorm()` takes the parameters of the underlying normal, not the lognormal mean and variance. Internally R evaluates `pnorm(log(1.025), meanlog, sdlog, lower.tail = FALSE)`. About 1.95 percent of days will see a price ratio above 1.025 under this model. Lognormal is a workhorse for multiplicative growth processes (asset prices, biological populations, particle sizes) because the log of the variable is symmetric and well-behaved.

</details>

## Section 4. Sampling distributions: t, chi-square, F (5 problems)

### Exercise 4.1: Critical t value for a two-sided test

**Task:** A biostatistician runs a two-sided t-test with sample size 20 (so df = 19) at the 5 percent significance level. She needs the positive critical value, that is, the value `tcrit` such that P(|T| > tcrit) = 0.05. Save the answer to `ex_4_1`.

**Expected result:**

```
#> [1] 2.093024
```

**Difficulty:** Intermediate

[HINTS]
A two-sided test splits its rejection probability into two equal tails, so the critical value is an upper-tail percentile.
Use `qt(0.975, df = 19)` - the 0.975 reflects splitting 0.05 across two tails.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- qt(0.975, df = 19)
ex_4_1
#> [1] 2.093024
```

**Explanation:** For a two-sided test at alpha = 0.05 you split the rejection region into two tails of 0.025 each, so the critical value is the 97.5 percentile of the t distribution with df = 19. The t critical 2.093 is larger than the normal critical 1.96, reflecting the heavier tails at finite df. As df grows the t converges to the standard normal; at df = 30 the critical value is already 2.042, very close to 1.96.

</details>

### Exercise 4.2: Chi-square critical value for variance test

**Task:** A QA analyst tests whether a process variance is below a threshold with a one-sided chi-square test at alpha = 0.05 with sample size 25 (df = 24). She needs the lower-tail critical value `chi_crit` such that P(X <= chi_crit) = 0.05 under chi-square with 24 df. Save the result to `ex_4_2`.

**Expected result:**

```
#> [1] 13.84843
```

**Difficulty:** Intermediate

[HINTS]
A lower-tail test rejects for small statistic values, so the critical value is a low percentile of the distribution.
Use `qchisq(0.05, df = 24)`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- qchisq(0.05, df = 24)
ex_4_2
#> [1] 13.84843
```

**Explanation:** A one-sided lower-tail test rejects when the chi-square statistic is too small, which happens when the sample variance is unusually small. `qchisq(0.05, df = 24)` returns the 5th percentile, 13.85. The mean of a chi-square with df = k is k, so 13.85 sits well below the mean of 24, as expected for a lower-tail critical. For the upper-tail version (testing whether variance exceeds a threshold), use `qchisq(0.95, df = 24)`.

</details>

### Exercise 4.3: F critical value for ANOVA

**Task:** A researcher runs a one-way ANOVA with 4 groups (so numerator df = 3) and 60 total observations (so denominator df = 56) at alpha = 0.05. Compute the upper-tail F critical value for the test and save it to `ex_4_3`.

**Expected result:**

```
#> [1] 2.769431
```

**Difficulty:** Intermediate

[HINTS]
An ANOVA rejects for large variance ratios, so the critical value is an upper-tail percentile of the F distribution.
Use `qf(0.95, df1 = 3, df2 = 56)`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- qf(0.95, df1 = 3, df2 = 56)
ex_4_3
#> [1] 2.769431
```

**Explanation:** The F distribution is the ratio of two scaled chi-square variables and is always right-skewed and non-negative. For ANOVA the numerator df is groups minus 1 and the denominator df is total observations minus groups. The upper-tail 95th percentile 2.77 is the rejection cutoff: an observed F above this value implies between-group variance is significantly larger than within-group variance at alpha = 0.05.

</details>

### Exercise 4.4: t vs normal density convergence

**Task:** Build a tibble showing the density of the standard normal alongside the t density at three df values (df = 3, df = 10, df = 30) at the points x = c(-3, -2, -1, 0, 1, 2, 3). The result should be a tibble with columns `x`, `normal`, `t_df3`, `t_df10`, `t_df30`, saved to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 7 x 5
#>       x  normal  t_df3 t_df10 t_df30
#>   <dbl>   <dbl>  <dbl>  <dbl>  <dbl>
#> 1    -3 0.00443 0.0229 0.0114 0.00610
#> 2    -2 0.0540  0.0675 0.0611 0.0560
#> 3    -1 0.242   0.207  0.231  0.239
#> 4     0 0.399   0.367  0.389  0.396
#> 5     1 0.242   0.207  0.231  0.239
#> 6     2 0.0540  0.0675 0.0611 0.0560
#> 7     3 0.00443 0.0229 0.0114 0.00610
```

**Difficulty:** Advanced

[HINTS]
You are evaluating the height of each curve at several points, then laying the normal and the three t curves side by side in a table.
Build a `tibble()` whose columns come from `dnorm(xs)` and `dt(xs, df = ...)` for df 3, 10, and 30.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
xs <- c(-3, -2, -1, 0, 1, 2, 3)
ex_4_4 <- tibble(
  x      = xs,
  normal = dnorm(xs),
  t_df3  = dt(xs, df = 3),
  t_df10 = dt(xs, df = 10),
  t_df30 = dt(xs, df = 30)
)
ex_4_4
#> # A tibble: 7 x 5
#>       x  normal  t_df3 t_df10 t_df30
#>   <dbl>   <dbl>  <dbl>  <dbl>  <dbl>
#> 1    -3 0.00443 0.0229 0.0114 0.00610
#> ...
```

**Explanation:** Read row by row to see two trends. First, the tails (|x| = 3) are progressively heavier for smaller df: the t with df = 3 has roughly 5 times the normal density at x = 3. Second, as df grows the t density approaches the normal everywhere. At df = 30 the differences are already in the third decimal place. This is the formal statement of the t-to-normal convergence theorem, and the reason "large-sample" z procedures replace t procedures when df is high.

</details>

### Exercise 4.5: Sampling distribution of the mean via simulation

**Task:** Use `set.seed(11)` and replicate 5000 times the experiment of drawing a sample of size 25 from Exponential(rate = 1/10) and computing the sample mean. Then compute the empirical mean and standard deviation of those 5000 sample means and save them as a named numeric vector with names `clt_mean` and `clt_se` to `ex_4_5`.

**Expected result:**

```
#>  clt_mean    clt_se
#>   10.0146    2.0252
```

**Difficulty:** Advanced

[HINTS]
Repeat the draw-a-sample-and-average experiment many times, then describe the spread of those averages.
Seed with `set.seed(11)`, wrap `mean(rexp(25, rate = 1/10))` inside `replicate(5000, ...)`, then take `mean()` and `sd()`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
sample_means <- replicate(5000, mean(rexp(25, rate = 1/10)))
ex_4_5 <- c(clt_mean = mean(sample_means), clt_se = sd(sample_means))
round(ex_4_5, 4)
#>  clt_mean    clt_se
#>   10.0146    2.0252
```

**Explanation:** This demonstrates the Central Limit Theorem on a skewed parent. The exponential with rate 1/10 has true mean 10 and true sd 10, so the theoretical standard error of the sample mean is 10 / sqrt(25) = 2. The empirical clt_se 2.0252 matches that closely. The sampling distribution of the mean is approximately normal even though the parent is exponential, which is why z-based and t-based methods work for averages of moderately sized samples from non-normal populations.

</details>

## Section 5. Simulation and applied workflows (5 problems)

### Exercise 5.1: Monte Carlo estimate of pi

**Task:** Estimate pi by simulation. Use `set.seed(42)` to draw 100000 points uniformly in the unit square ([0,1] x [0,1]) and compute the fraction inside the quarter circle of radius 1. Multiply by 4 to estimate pi, then compute the absolute error vs `pi`. Save a named numeric vector with names `pi_hat` and `abs_error` to `ex_5_1`.

**Expected result:**

```
#>    pi_hat abs_error
#>    3.1407    0.0009
```

**Difficulty:** Intermediate

[HINTS]
The fraction of random points landing inside the quarter circle equals the ratio of its area to the square's.
Seed with `set.seed(42)`, draw coordinates with `runif()`, test `x^2 + y^2 <= 1`, and multiply the `mean()` of that by 4.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 100000
x <- runif(n)
y <- runif(n)
inside <- (x^2 + y^2) <= 1
pi_hat <- 4 * mean(inside)
ex_5_1 <- c(pi_hat = pi_hat, abs_error = abs(pi_hat - pi))
round(ex_5_1, 4)
#>    pi_hat abs_error
#>    3.1407    0.0009
```

**Explanation:** The fraction of uniform points falling inside the quarter circle is the ratio of areas (pi/4) / 1 = pi/4, so multiplying by 4 estimates pi. The error shrinks at rate 1/sqrt(n), which is why getting one more digit of accuracy costs 100 times more samples. This is the canonical Monte Carlo example and a stepping stone to high-dimensional integration where deterministic quadrature becomes infeasible.

</details>

### Exercise 5.2: Historical Value at Risk for a portfolio

**Task:** A risk team holds a portfolio whose log-returns are modeled as Normal(meanlog = 0.0004, sdlog = 0.011). Compute the parametric 1-day 99 percent Value at Risk, defined as the negative of the 1st percentile of the simple return (exp(log_ret) - 1). Report the VaR as a positive percentage (so a 2.5 percent loss is reported as 2.5) and save to `ex_5_2`.

**Expected result:**

```
#> [1] 2.518
```

**Difficulty:** Advanced

[HINTS]
Parametric VaR is a low percentile of the return distribution, converted from log-return space into simple-return space.
Get the log-return quantile from `qnorm(0.01, mean = 0.0004, sd = 0.011)`, map it with `exp(...) - 1`, then negate and scale to a percentage.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
log_ret_q01 <- qnorm(0.01, mean = 0.0004, sd = 0.011)
simple_ret_q01 <- exp(log_ret_q01) - 1
ex_5_2 <- round(-simple_ret_q01 * 100, 3)
ex_5_2
#> [1] 2.518
```

**Explanation:** Parametric VaR under a Gaussian log-return model converts a quantile of the log-return into a simple-return quantile via the exponential map. The 1 percent log-return quantile is `qnorm(0.01, 0.0004, 0.011) = -0.02519`, and `exp(-0.02519) - 1 = -0.02487`, so the 1-day 99 percent VaR is about 2.49 percent of position value. Real risk teams typically compute historical VaR (the empirical quantile of realized returns) and validate against parametric VaR; large gaps signal fat tails not captured by the normal model.

</details>

### Exercise 5.3: Empirical vs theoretical CDF of standard normal

**Task:** Use `set.seed(99)` to draw 500 samples from N(0, 1), evaluate both the empirical CDF at x = c(-1.5, -0.5, 0, 0.5, 1.5) and the theoretical normal CDF at the same points, and assemble a tibble with columns `x`, `ecdf_at_x`, `theory_cdf`, `abs_diff`. Save the tibble to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>       x ecdf_at_x theory_cdf abs_diff
#>   <dbl>     <dbl>      <dbl>    <dbl>
#> 1  -1.5     0.07       0.0668  0.00320
#> 2  -0.5     0.302      0.309   0.00683
#> 3   0       0.498      0.5     0.00200
#> 4   0.5     0.690      0.691   0.00131
#> 5   1.5     0.926      0.933   0.00718
```

**Difficulty:** Intermediate

[HINTS]
Compare a step function built from the sample against the true cumulative curve at a handful of points.
Build the step function with `ecdf(samp)`, evaluate it and `pnorm()` on the grid, and assemble the columns in a `tibble()`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
samp <- rnorm(500)
fn <- ecdf(samp)
xs <- c(-1.5, -0.5, 0, 0.5, 1.5)
ex_5_3 <- tibble(
  x          = xs,
  ecdf_at_x  = fn(xs),
  theory_cdf = pnorm(xs),
  abs_diff   = abs(fn(xs) - pnorm(xs))
)
ex_5_3
#> # A tibble: 5 x 4
#>       x ecdf_at_x theory_cdf abs_diff
#>   <dbl>     <dbl>      <dbl>    <dbl>
#> 1  -1.5     0.07       0.0668  0.00320
#> ...
```

**Explanation:** `ecdf()` returns a step function that you can evaluate at any point. The largest absolute gap between the empirical and theoretical CDFs is the Kolmogorov-Smirnov test statistic; here all gaps are under 0.01, consistent with a fit-to-the-truth scenario. For n = 500 the KS critical value at alpha = 0.05 is about 0.061, so this sample is far from rejecting normality. Use this technique to spot-check distributional fit anywhere you have raw samples.

</details>

### Exercise 5.4: Coverage probability of a 95 percent z confidence interval

**Task:** Simulate 5000 datasets of size 30 from Normal(mean = 5, sd = 2) with `set.seed(13)`. For each dataset compute a 95 percent z confidence interval using the true sd, then compute the empirical coverage probability (the fraction of intervals that contain the true mean 5). Save to `ex_5_4`.

**Expected result:**

```
#> [1] 0.9534
```

**Difficulty:** Advanced

[HINTS]
For each simulated dataset, check whether its interval traps the true mean, then average those hits.
Inside `replicate(5000, ...)` build the half-width as `qnorm(0.975) * 2 / sqrt(n)`, test whether 5 lies between the bounds, then take `mean()`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
n <- 30
sims <- replicate(5000, {
  x <- rnorm(n, mean = 5, sd = 2)
  m <- mean(x)
  half <- qnorm(0.975) * 2 / sqrt(n)
  (m - half <= 5) && (5 <= m + half)
})
ex_5_4 <- mean(sims)
ex_5_4
#> [1] 0.9534
```

**Explanation:** The z interval `mean +/- z_{0.975} * sigma / sqrt(n)` has nominal coverage 95 percent. The empirical coverage 0.9534 is within Monte Carlo error of the nominal value (the Monte Carlo standard error here is sqrt(0.95 * 0.05 / 5000) = 0.003). If you replace the true sd with the sample sd and keep using `qnorm(0.975)`, coverage falls below nominal for small n, which is the original motivation for the t interval.

</details>

### Exercise 5.5: Density plot of standard normal vs t with df=3

**Task:** Build a ggplot that overlays the standard normal density and the t density with df = 3 on the same axes, computed over a grid from `-4` to `4` in steps of 0.05. Map distribution to color and save the assembled ggplot object to `ex_5_5`.

**Expected result:**

```
# A ggplot showing two density curves:
#   - "Normal" centered at 0 with the familiar bell shape
#   - "t (df=3)" with the same center but noticeably heavier tails
# Aesthetics: x is the grid, y is density, color encodes distribution.
```

**Difficulty:** Intermediate

[HINTS]
Stack both density curves into one long data frame with a column flagging which distribution each row belongs to, then map that column to color.
Build a grid with `seq(-4, 4, by = 0.05)`, get heights from `dnorm()` and `dt(..., df = 3)`, and draw with `ggplot()` plus `geom_line()` mapping `color = distribution`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- seq(-4, 4, by = 0.05)
plot_df <- tibble(
  x = rep(grid, 2),
  density = c(dnorm(grid), dt(grid, df = 3)),
  distribution = rep(c("Normal", "t (df=3)"), each = length(grid))
)
ex_5_5 <- ggplot(plot_df, aes(x, density, color = distribution)) +
  geom_line(linewidth = 1) +
  labs(title = "Standard normal vs t with df = 3",
       x = "x", y = "Density", color = NULL) +
  theme_minimal()
ex_5_5
#> # A ggplot with two density curves over x in [-4, 4]
```

**Explanation:** Plotting two densities on a shared axis is the clearest way to internalize the "heavier tails, lower peak" relationship between t and normal. The t with df = 3 has only one finite variance moment (variance df / (df - 2) = 3) and very heavy tails, which is why t-based inference is so robust to mild outliers. As df increases the t curve squashes toward the normal; at df = 30 they overlap almost exactly.

</details>

## What to do next

Now that you have practiced the d/p/q/r family across every common distribution, sharpen the connected skills:

- [Probability fundamentals in R](Probability.html): review the parent post on probability, expectation, and independence
- [Statistical Tests Exercises in R](Statistical-Tests-Exercises-in-R.html): apply the t, chi-square, and F distributions to hypothesis testing
- [Sampling Methods Exercises in R](Sampling-Methods-Exercises-in-R.html): bootstrap, jackknife, and Monte Carlo workflows
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html): inference for regression uses the same sampling-distribution machinery

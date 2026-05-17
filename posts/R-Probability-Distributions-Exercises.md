---
title: "R Probability Distributions Exercises: 20 Real-World Practice Problems"
slug: "R-Probability-Distributions-Exercises"
description: "Practice 20 R probability distribution problems across normal, binomial, Poisson, t, chi-squared, and F. Each has a starter, hidden solution, and explanation."
keywords: "R probability distributions exercises, dnorm pnorm qnorm exercises, dbinom pbinom practice, dpois ppois exercises, qt qchisq qf critical values, R simulation exercises, R probability practice problems"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Probability Distributions (20 problems)"
sidebar_order: 215
fr_parent: "Normal-t-F-and-Chi-Squared-Distributions-in-R.html"
auto_link_terms: "r probability distributions exercises|dnorm pnorm qnorm practice|r binomial distribution exercises|r poisson distribution practice|r critical values exercises|r simulation exercises"
auto_link_case_sensitive: false
target_keyword: "R probability distributions exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Probability Distributions Exercises: 20 Real-World Practice Problems

<p class="lead">Twenty problems drilling the `d`, `p`, `q`, `r` prefix convention across R's most-used distributions: normal, binomial, Poisson, t, chi-squared, F, beta, and exponential. Every exercise embeds a real workflow (QA on a manufacturing line, a clinical trial, a Monte Carlo simulation), shows exact expected output, and hides a solution behind a click.</p>

```r title="Run this once before any exercise"
# All exercises use only base R distribution functions.
library(stats)   # auto-attached; included here for clarity
set.seed(NULL)
```

## Section 1. Normal distribution (4 problems)

### Exercise 1.1: Compute a normal density at a single value with dnorm

**Task:** A human factors team modelling adult male height assumes a normal distribution with mean 70 inches and standard deviation 3 inches. Compute the value of the probability density function at exactly 72 inches using `dnorm()` and save the scalar to `ex_1_1`.

**Expected result:**

```
#> [1] 0.1064827
```

**Difficulty:** Beginner

[HINTS]
The bell curve has a height at every point; you want that height at one specific value, not an area or a probability.
Call the density function with the value 72 and the `mean` and `sd` arguments.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- dnorm(72, mean = 70, sd = 3)
ex_1_1
#> [1] 0.1064827
```

**Explanation:** `dnorm(x, mean, sd)` returns the height of the bell curve at `x`, which is a density (per inch), not a probability. The value `0.1065` does not mean "10.65% of men are 72 inches tall"; it means the density there is `0.1065 per inch`. To get an actual probability you integrate the density over an interval, which is what `pnorm()` does in the next exercise.

</details>

### Exercise 1.2: Probability inside a tolerance band with two pnorm calls

**Task:** A quality engineer at a widget plant assumes widget diameter follows a normal distribution with mean 10.0 mm and standard deviation 0.15 mm. The spec is 9.8 to 10.2 mm. Compute the probability that a random widget falls inside the spec band using two `pnorm()` calls and save the scalar probability to `ex_1_2`.

**Expected result:**

```
#> [1] 0.8175776
```

**Difficulty:** Intermediate

[HINTS]
The probability of landing inside an interval is the area to the left of the upper limit minus the area to the left of the lower limit.
Subtract one `pnorm()` call at 9.8 from another at 10.2, each with the same `mean` and `sd`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- pnorm(10.2, mean = 10, sd = 0.15) -
          pnorm(9.8,  mean = 10, sd = 0.15)
ex_1_2
#> [1] 0.8175776
```

**Explanation:** `pnorm()` is the cumulative distribution function: `pnorm(q)` returns the area under the curve to the left of `q`. The probability of landing inside `[a, b]` is therefore `pnorm(b) - pnorm(a)`. Both spec limits are 1.33 standard deviations from the mean, so this is the classic `pnorm(1.33) - pnorm(-1.33)` calculation; about 82% of widgets are in spec.

</details>

### Exercise 1.3: Find the 95th percentile of customer chest size with qnorm

**Task:** A clothing retailer sizing a new T-shirt line assumes adult chest measurement follows `N(40, 4)` inches. The product team needs the 95th percentile of the chest distribution so the largest size covers 95% of customers. Use `qnorm()` and save the scalar inch value to `ex_1_3`.

**Expected result:**

```
#> [1] 46.57941
```

**Difficulty:** Intermediate

[HINTS]
You need the value below which 95% of the distribution sits - the inverse of a cumulative probability.
Call `qnorm()` with 0.95 as the probability plus the `mean` and `sd` arguments.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- qnorm(0.95, mean = 40, sd = 4)
ex_1_3
#> [1] 46.57941
```

**Explanation:** `qnorm(p, mean, sd)` is the inverse of `pnorm()`; it returns the value below which a fraction `p` of the distribution falls. The 95th percentile of `N(0, 1)` is the famous 1.6449, and the answer here is just `40 + 4 * 1.6449`. This same call is how confidence intervals get their `z` critical values: `qnorm(0.975)` gives the 1.96 you see in every textbook 95% CI formula.

</details>

### Exercise 1.4: Draw a reproducible random sample with rnorm and a fixed seed

**Task:** Call `set.seed(123)` and then draw 10 observations from the standard normal distribution using `rnorm()`. Save the resulting length-10 numeric vector to `ex_1_4`. The seed makes the draw reproducible across runs.

**Expected result:**

```
#>  [1] -0.56047565 -0.23017749  1.55870831  0.07050839  0.12928774  1.71506499
#>  [7]  0.46091621 -1.26506123 -0.68685285 -0.44566197
```

**Difficulty:** Beginner

[HINTS]
Random draws need their generator state pinned first so the same numbers come back on every run.
Call `set.seed(123)`, then `rnorm(10)` with no mean or sd so it defaults to the standard normal.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
ex_1_4 <- rnorm(10)
ex_1_4
#>  [1] -0.56047565 -0.23017749  1.55870831  0.07050839  0.12928774  1.71506499
#>  [7]  0.46091621 -1.26506123 -0.68685285 -0.44566197
```

**Explanation:** `rnorm(n)` with no mean or sd defaults to `N(0, 1)`, the standard normal. `set.seed()` fixes R's pseudo-random generator state so the same seed always returns the same draws; this matters enormously for reproducible simulations and unit tests. Note that calling `rnorm()` again without re-seeding will return the next 10 numbers in the stream, not the same 10.

</details>

## Section 2. Binomial distribution (3 problems)

### Exercise 2.1: Exact count probability with dbinom for an A/B test

**Task:** An experimentation platform expects conversion to follow `Binomial(n = 20, p = 0.3)` for the control arm in a small A/B test. Compute the probability of observing exactly 7 conversions out of 20 visitors using `dbinom()` and save the scalar probability to `ex_2_1`.

**Expected result:**

```
#> [1] 0.1643718
```

**Difficulty:** Beginner

[HINTS]
"Exactly k" successes is a single point on the probability mass function, not a cumulative range.
Call `dbinom()` with 7, plus the `size` and `prob` arguments.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- dbinom(7, size = 20, prob = 0.3)
ex_2_1
#> [1] 0.1643718
```

**Explanation:** `dbinom(x, size, prob)` returns the probability mass at exactly `x` successes in `size` trials. The formula is `choose(20, 7) * 0.3^7 * 0.7^13`, but you should never compute it by hand because `dbinom` handles the large factorials in log space and stays accurate. For "exactly k" questions use `dbinom`; for "at most k" or "more than k" questions use `pbinom`, shown in the next exercise.

</details>

### Exercise 2.2: Cumulative probability with pbinom for a complaints budget

**Task:** A call center handles 50 calls per shift and each call has a 0.04 probability of generating a complaint, independent of the others. The ops team has a "no more than 3 complaints" target; compute `P(complaints <= 3)` using `pbinom()` and save the scalar to `ex_2_2`.

**Expected result:**

```
#> [1] 0.860838
```

**Difficulty:** Intermediate

[HINTS]
"No more than 3" is a cumulative probability that includes 3 and everything below it.
Call `pbinom()` with 3 as the quantile, plus the `size` and `prob` arguments.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pbinom(3, size = 50, prob = 0.04)
ex_2_2
#> [1] 0.860838
```

**Explanation:** `pbinom(q, size, prob)` returns `P(X <= q)`, the cumulative probability up to and including `q` successes. About 86% of shifts come in at or below the 3-complaint target. A common slip is treating "no more than 3" as `pbinom(2, ...)`; the upper bound is inclusive, so 3 is `pbinom(3, ...)`. For a strict less-than-3 you would use `pbinom(2, ...)`.

</details>

### Exercise 2.3: Right-tail probability for a clinical trial response

**Task:** A pharma team enrols 100 patients in a single-arm trial where the expected response rate is 0.60. The principal investigator wants the probability of observing at least 65 responders. Compute it using one `pbinom()` call with `lower.tail = FALSE` and save the scalar to `ex_2_3`.

**Expected result:**

```
#> [1] 0.1795
```

**Difficulty:** Intermediate

[HINTS]
"At least 65" is a right-tail probability, and the tail bound is exclusive so it must sit one below 65.
Call `pbinom()` with 64, the `size` and `prob` arguments, and `lower.tail = FALSE`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- pbinom(64, size = 100, prob = 0.6, lower.tail = FALSE)
ex_2_3
#> [1] 0.1795
```

**Explanation:** `pbinom(q, ..., lower.tail = FALSE)` returns `P(X > q)`, the right tail strictly above `q`. To get `P(X >= 65)` you ask for the tail above 64, not above 65, because the bound is exclusive when `lower.tail = FALSE`. Writing it this way avoids the rounding error you would get from `1 - pbinom(64, 100, 0.6)`; the `lower.tail = FALSE` path is numerically stable in the far tails too.

</details>

## Section 3. Poisson distribution (3 problems)

### Exercise 3.1: Single-count probability with dpois for web traffic

**Task:** A web service averages 5 requests per second, and the SRE team treats arrivals as Poisson. Compute the probability of seeing exactly 8 requests in a 1-second window using `dpois()` and save the scalar probability to `ex_3_1`.

**Expected result:**

```
#> [1] 0.06527804
```

**Difficulty:** Beginner

[HINTS]
"Exactly 8 events" is a single point on the count distribution, not a range.
Call `dpois()` with 8 and the `lambda` rate argument.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- dpois(8, lambda = 5)
ex_3_1
#> [1] 0.06527804
```

**Explanation:** `dpois(x, lambda)` returns the Poisson probability mass at exactly `x` events when the rate parameter is `lambda`. The mean and variance of a Poisson are both `lambda`, so a sample of 8 lives a bit above the mean of 5 and gets about a 6.5% probability. Poisson is the natural model for counts in a fixed window when events are independent and arrive at a constant average rate.

</details>

### Exercise 3.2: Tail probability with ppois for bank branch staffing

**Task:** A retail bank branch records on average 12 customer arrivals per hour and the operations team plans staffing around the right tail. Compute the probability of receiving more than 15 customers in a single hour using `ppois()` with `lower.tail = FALSE` and save the scalar to `ex_3_2`.

**Expected result:**

```
#> [1] 0.1555819
```

**Difficulty:** Intermediate

[HINTS]
"More than 15" is the right tail strictly above 15.
Call `ppois()` with 15, the `lambda` argument, and `lower.tail = FALSE`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ppois(15, lambda = 12, lower.tail = FALSE)
ex_3_2
#> [1] 0.1555819
```

**Explanation:** `ppois(q, lambda, lower.tail = FALSE)` returns `P(X > q)`. So "more than 15" is exactly `ppois(15, 12, lower.tail = FALSE)`. About 16% of hours will see more than 15 customers; that headroom drives the staffing buffer. If the question were "15 or more", you would query `ppois(14, 12, lower.tail = FALSE)` since the bound is strict.

</details>

### Exercise 3.3: Rescale a rate over a longer window for earthquake counts

**Task:** A seismic station records earthquakes at a long-run rate of 0.2 events per day. A seismologist preparing a monthly bulletin needs the probability of 3 or more earthquakes over a 30-day month. Rescale lambda to the 30-day window first, then compute the upper-tail probability with `ppois()` and save it to `ex_3_3`.

**Expected result:**

```
#> [1] 0.9380312
```

**Difficulty:** Intermediate

[HINTS]
A per-day rate must be converted to the same time window as the question before any probability makes sense.
Multiply the daily rate by 30 to get `lambda`, then call `ppois()` with 2 and `lower.tail = FALSE` for "3 or more".

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lambda_30d <- 0.2 * 30   # daily rate scaled to a 30-day window
ex_3_3 <- ppois(2, lambda = lambda_30d, lower.tail = FALSE)
ex_3_3
#> [1] 0.9380312
```

**Explanation:** A Poisson rate is additive over time: 0.2 per day for 30 days gives `lambda = 6` for the month. The window scaling is the most common Poisson gotcha; if you keep `lambda = 0.2` and ask about 3 events, you get an absurdly tiny probability because 0.2 is a per-day rate, not a per-month rate. Always confirm the rate and the question are on the same time scale.

</details>

## Section 4. t, chi-squared, and F distributions (4 problems)

### Exercise 4.1: Critical t value for a two-sided test with 24 degrees of freedom

**Task:** A statistician running a two-sided one-sample t-test at significance level 0.05 with sample size 25 (so df equals 24) wants the upper critical value of the t distribution. Compute it with `qt()` at the 0.975 quantile and df = 24, and save the scalar to `ex_4_1`.

**Expected result:**

```
#> [1] 2.063899
```

**Difficulty:** Intermediate

[HINTS]
A two-sided test splits its significance level evenly into both tails, so the upper cutoff sits at the 0.975 quantile.
Call `qt()` with 0.975 and `df = 24`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- qt(0.975, df = 24)
ex_4_1
#> [1] 2.063899
```

**Explanation:** `qt(p, df)` returns the quantile of the t distribution. For a two-sided 0.05-level test, the upper rejection cutoff sits at the 0.975 quantile because we split alpha evenly into both tails. Note `2.064 > 1.96`; the t critical value is always larger than the normal one because the t has heavier tails. As df grows, `qt(0.975, df)` converges to 1.96 from above.

</details>

### Exercise 4.2: Two-sided p value from a t statistic in a biostat trial

**Task:** A biostatistician comparing two treatment arms reports a two-sample t statistic of 2.31 on 18 degrees of freedom. Compute the two-sided p-value using `pt()` (apply `abs()` and double the lower tail) and save the scalar to `ex_4_2`.

**Expected result:**

```
#> [1] 0.03284
```

**Difficulty:** Intermediate

[HINTS]
A two-sided p-value is the tail area beyond the statistic, doubled, and using the negative absolute value keeps the sign from mattering.
Call `pt()` on `-abs(2.31)` with `df = 18` and multiply the result by 2.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t_stat <- 2.31
ex_4_2 <- 2 * pt(-abs(t_stat), df = 18)
ex_4_2
#> [1] 0.03284
```

**Explanation:** The two-sided p-value is `2 * P(T <= -|t|)`, i.e. the lower-tail area at `-|t|` doubled. Using `-abs(t_stat)` makes the formula work whether the input statistic is positive or negative. Don't write `2 * (1 - pt(t_stat, df))`; that gives the right answer for positive t only and is numerically worse in the tails than the `-abs(t)` form.

</details>

### Exercise 4.3: Critical chi-squared value for a goodness-of-fit test

**Task:** An auditor running a chi-squared goodness-of-fit test for a categorical variable with 6 categories has df = 5 and wants the upper critical value at alpha = 0.05. Use `qchisq()` at the 0.95 quantile with df = 5 and save the scalar to `ex_4_3`.

**Expected result:**

```
#> [1] 11.0705
```

**Difficulty:** Advanced

[HINTS]
A chi-squared test puts the whole significance level in the upper tail, so the cutoff is the upper quantile.
Call `qchisq()` with 0.95 and `df = 5`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- qchisq(0.95, df = 5)
ex_4_3
#> [1] 11.0705
```

**Explanation:** Chi-squared tests are one-sided in the upper tail; the entire alpha goes to the right, so the cutoff is `qchisq(1 - alpha, df)`. You will reject the null whenever the observed test statistic exceeds 11.07. Degrees of freedom for a goodness-of-fit test is `(number of categories) - 1 - (parameters estimated)`; with 6 categories and no estimated parameters, df = 5.

</details>

### Exercise 4.4: p value from an F statistic in a four-group ANOVA

**Task:** A one-way ANOVA across 4 treatment groups with 36 total subjects (df1 = 3 between, df2 = 32 within) returns an F statistic of 4.27. Compute the upper-tail p-value using `pf()` with `lower.tail = FALSE` and save the scalar to `ex_4_4`.

**Expected result:**

```
#> [1] 0.01206
```

**Difficulty:** Advanced

[HINTS]
An F test is one-sided in the upper tail, so the p-value is the area above the observed statistic.
Call `pf()` with 4.27, `df1 = 3`, `df2 = 32`, and `lower.tail = FALSE`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- pf(4.27, df1 = 3, df2 = 32, lower.tail = FALSE)
ex_4_4
#> [1] 0.01206
```

**Explanation:** Like chi-squared, the F test is one-sided in the upper tail because the F statistic is a ratio of variances and large values argue against the null. With p ~ 0.012 you would reject the null of equal group means at alpha = 0.05. The two df arguments are not interchangeable: `df1` is the numerator (between-group) df and `df2` is the denominator (within-group) df. Swapping them gives a different and wrong p-value.

</details>

## Section 5. Random sampling and simulation (3 problems)

### Exercise 5.1: Sample mean from a Beta distribution and compare to theory

**Task:** After `set.seed(42)`, draw 1000 random values from a Beta distribution with shape1 = 2 and shape2 = 5 using `rbeta()`, then compute the sample mean and save the scalar to `ex_5_1`. The theoretical mean of Beta(2, 5) is 2 / 7 = 0.2857, so the sample mean should land near that.

**Expected result:**

```
#> [1] 0.2832
```

**Difficulty:** Intermediate

[HINTS]
Draw a large sample from the distribution, then average it to estimate the mean.
After `set.seed(42)`, wrap `rbeta()` (with `shape1` and `shape2`) inside `mean()`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_5_1 <- mean(rbeta(1000, shape1 = 2, shape2 = 5))
ex_5_1
#> [1] 0.2832
```

**Explanation:** The Beta distribution lives on `[0, 1]` and is the natural choice for proportions and probabilities. Its mean is `shape1 / (shape1 + shape2)`, so Beta(2, 5) has mean 2/7. With 1000 draws the sample mean is within ~0.003 of the theoretical mean, illustrating the law of large numbers. Increase `n` to 100000 and the sample mean tightens further around 0.2857.

</details>

### Exercise 5.2: Monte Carlo demonstration of the central limit theorem

**Task:** A statistics instructor wants to demonstrate the central limit theorem by simulating 5000 sample means, each computed from 30 i.i.d. draws of `Exponential(rate = 1)`. After `set.seed(7)`, use `replicate()` to produce the 5000 means and save the length-5000 numeric vector to `ex_5_2`. A summary of that vector should be roughly normal with mean ~1 and sd ~1/sqrt(30) = 0.1826.

**Expected result:**

```
#> length: 5000
#> mean(ex_5_2): ~1.000
#> sd(ex_5_2):   ~0.182
#> head(ex_5_2): 0.9831 1.1054 0.8762 1.0719 0.9385 1.1947
```

**Difficulty:** Advanced

[HINTS]
Repeat the experiment of drawing a small sample and taking its mean many thousands of times, collecting each mean.
After `set.seed(7)`, use `replicate(5000, ...)` around `mean(rexp(30, rate = 1))`.

```r title="Your turn"
ex_5_2 <- # your code here
length(ex_5_2)
mean(ex_5_2)
sd(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_5_2 <- replicate(5000, mean(rexp(30, rate = 1)))
length(ex_5_2)
#> [1] 5000
mean(ex_5_2)
#> [1] 1.000378
sd(ex_5_2)
#> [1] 0.1826144
```

**Explanation:** The CLT says the sampling distribution of the mean converges to a normal even when the parent distribution is skewed. Exponential(1) is heavily right-skewed with mean 1 and sd 1, yet the distribution of 5000 sample means (each from n = 30) is nearly normal with mean 1 and sd `1/sqrt(30) = 0.183`. `replicate()` is the idiomatic way to run many independent simulations; for very large simulations swap to `vapply(seq_len(M), ..., numeric(1))` for type safety.

</details>

### Exercise 5.3: Compare an empirical tail probability to the theoretical pnorm value

**Task:** A risk team wants to sanity-check `pnorm(2, lower.tail = FALSE)` by simulation. After `set.seed(99)`, draw 100000 standard normal values with `rnorm()`, compute the empirical proportion above 2, and save a named numeric vector with elements `empirical` and `theoretical` to `ex_5_3`. The two should agree to about three decimals.

**Expected result:**

```
#>   empirical theoretical
#>  0.02256000  0.02275013
```

**Difficulty:** Advanced

[HINTS]
Estimate a tail probability by the fraction of a large random sample that lands beyond the threshold, then place it next to the exact value.
After `set.seed(99)`, build a named vector from `mean(x > 2)` and `pnorm(2, lower.tail = FALSE)`, where `x` comes from `rnorm(1e5)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
x <- rnorm(1e5)
ex_5_3 <- c(
  empirical   = mean(x > 2),
  theoretical = pnorm(2, lower.tail = FALSE)
)
ex_5_3
#>   empirical theoretical
#>  0.02256000  0.02275013
```

**Explanation:** The empirical proportion `mean(x > 2)` is a Monte Carlo estimate of `P(X > 2)`. With 100000 draws the Monte Carlo standard error is roughly `sqrt(p * (1 - p) / n) = sqrt(0.0227 * 0.9773 / 1e5) = 0.00047`, so agreement to about three decimals is exactly what you expect. This kind of cross-check is gold for catching code bugs: if the simulation disagreed with `pnorm` by more than a few standard errors, the simulation is wrong, not `pnorm`.

</details>

## Section 6. Real-world probability calculations (3 problems)

### Exercise 6.1: Production yield probability with the binomial right tail

**Task:** A semiconductor fab produces wafers with a long-run 0.92 yield (probability a single wafer passes inspection). A QA manager wants the probability that a batch of 50 wafers contains at least 48 good ones. Compute it with `pbinom()` and `lower.tail = FALSE`, then save the scalar to `ex_6_1`.

**Expected result:**

```
#> [1] 0.2241
```

**Difficulty:** Intermediate

[HINTS]
"At least 48" is a right-tail probability whose exclusive bound sits one below 48.
Call `pbinom()` with 47, the `size` and `prob` arguments, and `lower.tail = FALSE`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- pbinom(47, size = 50, prob = 0.92, lower.tail = FALSE)
ex_6_1
#> [1] 0.2241
```

**Explanation:** For "at least 48" with `lower.tail = FALSE`, you query the right tail above 47, since `P(X >= 48) = P(X > 47)`. About 22% of batches will hit the 48-out-of-50 bar at a 92% per-wafer yield. To raise that probability you either improve per-wafer yield or accept a more lenient threshold; both can be re-evaluated with one tweak to this call.

</details>

### Exercise 6.2: Wald 95% confidence interval for a proportion via qnorm

**Task:** A clinical trial reports 38 successes out of 50 patients. The biostatistician needs the Wald 95% confidence interval for the true response proportion: `phat plus or minus z * sqrt(phat * (1 - phat) / n)`, where `z = qnorm(0.975)`. Compute it and save a length-2 numeric vector with the lower and upper bounds (in that order) to `ex_6_2`.

**Expected result:**

```
#> [1] 0.6416 0.8784
```

**Difficulty:** Advanced

[HINTS]
A confidence interval extends a fixed number of standard errors on each side of the sample estimate.
Get the multiplier from `qnorm(0.975)`, compute the standard error, and build a length-2 vector of the estimate minus and plus `z * se`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n     <- 50
x     <- 38
phat  <- x / n
se    <- sqrt(phat * (1 - phat) / n)
z     <- qnorm(0.975)
ex_6_2 <- c(phat - z * se, phat + z * se)
round(ex_6_2, 4)
#> [1] 0.6416 0.8784
```

**Explanation:** The Wald formula plugs the sample proportion straight into a normal approximation. The 1.96 multiplier is `qnorm(0.975)`, the 97.5th percentile of `N(0, 1)`; using `qnorm` instead of a hard-coded 1.96 lets you change the confidence level (say to 90% or 99%) by editing one number. For very small samples or proportions near 0 or 1, the Wald interval underperforms; consider Wilson or Clopper-Pearson (`binom.test()`), but the Wald formula is the workhorse you will see every day.

</details>

### Exercise 6.3: Probability of an out-of-spec part with two-tail pnorm

**Task:** A Six Sigma engineer monitoring a turning operation models part diameter as normal with mean 25.05 mm and standard deviation 0.18 mm. The spec band is 24.5 to 25.5 mm. Compute the probability of an out-of-spec part (below 24.5 or above 25.5) by summing the two tails with `pnorm()` and save the scalar to `ex_6_3`.

**Expected result:**

```
#> [1] 0.007343
```

**Difficulty:** Advanced

[HINTS]
The defect probability is the two pieces of area outside the spec band added together, not the area inside.
Add `pnorm()` at the lower limit to `pnorm()` at the upper limit with `lower.tail = FALSE`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mu  <- 25.05
sd  <- 0.18
lo  <- 24.5
hi  <- 25.5
ex_6_3 <- pnorm(lo, mu, sd) + pnorm(hi, mu, sd, lower.tail = FALSE)
ex_6_3
#> [1] 0.007343
```

**Explanation:** The defect probability is the sum of the two tail areas outside the spec, not the area inside; resist the urge to write `1 - pnorm(hi, mu, sd)` because that ignores the lower tail. Note the asymmetry: with the process mean offset to 25.05 (5 hundredths above target), most of the 0.73% defect probability comes from the upper tail. Centering the process at 25.00 would push the defect rate below 0.5%, which is the kind of result that justifies a recalibration.

</details>

## What to do next

- Review the parent core post: [Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html) to revisit the d/p/q/r convention.
- Practice hypothesis testing end-to-end with [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).
- Sharpen your sampling intuition with [Sampling Methods Exercises in R](Sampling-Methods-Exercises-in-R.html).
- Apply these distributions to real data using [Statistical Inference Exercises in R](Statistical-Inference-Exercises-in-R.html).

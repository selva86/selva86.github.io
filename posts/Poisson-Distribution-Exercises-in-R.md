---
title: "Poisson Distribution Exercises in R: 16 Real-World Practice Problems"
slug: "Poisson-Distribution-Exercises-in-R"
description: "Sixteen Poisson distribution exercises in R covering dpois, ppois, qpois, rpois, fitdistr, and poisson.test with full runnable solutions and explanations."
keywords: "poisson distribution R exercises, dpois examples, ppois practice problems, rpois simulation, qpois quantile, poisson.test in R, MLE poisson, fitdistr poisson"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Poisson Distribution Exercises"
sidebar_order: 152
fr_parent: "Binomial-and-Poisson-Distributions-in-R.html"
auto_link_terms: "poisson distribution exercises|dpois practice|ppois practice|qpois practice|rpois practice|poisson.test in r"
auto_link_case_sensitive: false
target_keyword: "poisson distribution exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Poisson Distribution Exercises in R: 16 Real-World Practice Problems

<p class="lead">Sixteen progressively harder Poisson distribution exercises in R covering exact probabilities with <code>dpois()</code>, cumulative probabilities with <code>ppois()</code>, quantiles with <code>qpois()</code>, simulation with <code>rpois()</code>, lambda estimation, and inference via <code>poisson.test()</code>. Every problem ships with a hidden solution and a written explanation so you can self-grade as you work through them.</p>

```r title="Run this once before any exercise"
library(stats)
library(MASS)
```

## Section 1. Exact probabilities with dpois (3 problems)

### Exercise 1.1: Probability of exactly two events at rate five

**Task:** A retail call centre receives an average of five complaint calls per hour. Use `dpois()` to compute the exact probability of receiving exactly two complaint calls in a one-hour window, and save the scalar result to `ex_1_1`. Round the printed value to four decimal places.

**Expected result:**

```
#> [1] 0.0842
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
round(ex_1_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- dpois(2, lambda = 5)
round(ex_1_1, 4)
#> [1] 0.0842
```

**Explanation:** `dpois(x, lambda)` evaluates the Poisson probability mass function $P(X = x) = \lambda^{x} e^{-\lambda} / x!$ at a single integer. Here $5^{2} e^{-5} / 2!$ collapses to roughly 0.0842, an 8.4 percent chance. A common mistake is calling `ppois()` instead, which would give the cumulative probability of 0, 1, or 2 calls (about 0.125). Whenever the question says "exactly k", reach for `dpois()`; "at most k" maps to `ppois()`.

</details>

### Exercise 1.2: Compare exact probabilities across two rate scenarios

**Task:** A network engineer compares two routers. Router A drops on average 3 packets per second, router B drops 7. For each router compute the probability of dropping exactly four packets in a one-second window using `dpois()`, store both probabilities in a named numeric vector with names `A` and `B`, and save the vector to `ex_1_2`. The router with the higher probability under lambda four is the one whose mean sits closest to four.

**Expected result:**

```
#>      A      B 
#> 0.1680 0.0912
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
round(ex_1_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(
  A = dpois(4, lambda = 3),
  B = dpois(4, lambda = 7)
)
round(ex_1_2, 4)
#>      A      B 
#> 0.1680 0.0912
```

**Explanation:** The Poisson mass function peaks near `floor(lambda)`. Router A with `lambda = 3` sits one step below four, so `dpois(4, 3)` is still close to the mode and returns 0.168. Router B at `lambda = 7` sits three steps above four, so the tail probability drops to 0.091. A frequent pitfall is comparing tail probabilities directly without normalising for the underlying rate; here the comparison is valid because both queries evaluate the same x at different lambdas.

</details>

### Exercise 1.3: Tabulate the full PMF for k from zero to ten

**Task:** A traffic engineer studies a busy intersection that averages 4 minor incidents per week. Produce a length-11 numeric vector containing `dpois(0:10, lambda = 4)`, name each element by its k value using `setNames()`, round to four decimal places, and save the result to `ex_1_3`. The peak of the PMF should land at `k = 3` and `k = 4` (both around 0.1954).

**Expected result:**

```
#>      0      1      2      3      4      5      6      7      8      9     10 
#> 0.0183 0.0733 0.1465 0.1954 0.1954 0.1563 0.1042 0.0595 0.0298 0.0132 0.0053
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- setNames(
  round(dpois(0:10, lambda = 4), 4),
  0:10
)
ex_1_3
#>      0      1      2      3      4      5      6      7      8      9     10 
#> 0.0183 0.0733 0.1465 0.1954 0.1954 0.1563 0.1042 0.0595 0.0298 0.0132 0.0053
```

**Explanation:** `dpois()` is vectorised over its first argument, so passing `0:10` returns the whole PMF in one call rather than looping. When `lambda` is an integer, the mass function has two equal modes at `lambda - 1` and `lambda`; here that means k of 3 and 4 both peak at 0.1954. Naming the vector by its k values makes downstream filtering (for instance `ex_1_3[as.character(5:7)]`) read clearly. For a non-integer `lambda`, the mode collapses to the single integer `floor(lambda)`.

</details>

## Section 2. Cumulative and tail probabilities with ppois (3 problems)

### Exercise 2.1: At most versus more than for a single rate

**Task:** Compute two probabilities for a Poisson with `lambda = 6`: the probability of at most 4 events using `ppois()`, and the probability of more than 4 events using `ppois()` with `lower.tail = FALSE`. Combine both into a named numeric vector with names `at_most_4` and `more_than_4`, and save it to `ex_2_1`. They must sum to one because at-most-four and more-than-four partition the integers.

**Expected result:**

```
#>   at_most_4 more_than_4 
#>      0.2851      0.7149
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
round(ex_2_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- c(
  at_most_4   = ppois(4, lambda = 6),
  more_than_4 = ppois(4, lambda = 6, lower.tail = FALSE)
)
round(ex_2_1, 4)
#>   at_most_4 more_than_4 
#>      0.2851      0.7149
```

**Explanation:** `ppois(q, lambda)` returns $P(X \le q)$ by default. Setting `lower.tail = FALSE` flips it to $P(X > q)$, which is more numerically stable than computing `1 - ppois(...)` when the lower tail is close to one. Because the two events partition the sample space, the sum is exactly 1.0 up to floating-point error. A frequent mistake is reading "more than 4" as `q = 5`; the correct call is `q = 4, lower.tail = FALSE`, which excludes 4 itself.

</details>

### Exercise 2.2: Call centre staffing under a service-level constraint

**Task:** The operations manager of a help desk staffs the night shift for an average of 12 tickets per hour. Compute the probability of receiving 15 or fewer tickets in a one-hour window (the "comfortable" zone), and the probability of receiving 20 or more (the "overload" zone). Bundle the two probabilities into a length-2 named vector `c(comfortable = ..., overload = ...)` and save it to `ex_2_2`. Use `ppois()` for both calls.

**Expected result:**

```
#> comfortable    overload 
#>      0.8444      0.0116
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
round(ex_2_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- c(
  comfortable = ppois(15, lambda = 12),
  overload    = ppois(19, lambda = 12, lower.tail = FALSE)
)
round(ex_2_2, 4)
#> comfortable    overload 
#>      0.8444      0.0116
```

**Explanation:** "20 or more tickets" is $P(X \ge 20)$, which equals $P(X > 19)$, so the upper-tail call uses `q = 19` not `q = 20`. This off-by-one is the single biggest source of bugs when translating English statements into `ppois()` arguments. With overload sitting at roughly 1.2 percent the manager can comfortably staff for fifteen with confidence, but a separate Erlang-C calculation would also account for service time, not just arrival rate.

</details>

### Exercise 2.3: Map a probability range to ordered cutoffs

**Task:** A quality-control engineer monitors defective parts at an average rate of 8 per shift. For each cutoff k in 5, 8, 10, 12, 15 compute $P(X \le k)$ using `ppois()`. Save the five probabilities as a named numeric vector (names taken from the k values) to `ex_2_3`. Together these five values trace out the empirical CDF at those grid points.

**Expected result:**

```
#>      5      8     10     12     15 
#> 0.1912 0.5925 0.8159 0.9362 0.9918
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
round(ex_2_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cutoffs  <- c(5, 8, 10, 12, 15)
ex_2_3   <- setNames(ppois(cutoffs, lambda = 8), cutoffs)
round(ex_2_3, 4)
#>      5      8     10     12     15 
#> 0.1912 0.5925 0.8159 0.9362 0.9918
```

**Explanation:** Vectorising `ppois()` over `cutoffs` returns the CDF at each gridpoint in one call, which is the right way to inspect tail behaviour without a loop. Notice the CDF is non-decreasing and climbs from 0.19 at k=5 (well below the mean) to 0.99 at k=15 (almost two standard deviations above). A useful sanity check is that `ppois(floor(lambda), lambda)` for `lambda = 8` should sit near 0.59, reflecting the slight right skew of the distribution.

</details>

## Section 3. Quantiles with qpois (2 problems)

### Exercise 3.1: Smallest k achieving 95 percent coverage

**Task:** A platform engineer wants the smallest integer count k such that $P(X \le k) \ge 0.95$ when the server averages 25 errors per day. Use `qpois()` to compute this critical k and save it as an integer scalar to `ex_3_1`. Also verify the answer by feeding k back into `ppois()` and confirming the cumulative probability is at least 0.95.

**Expected result:**

```
#> [1] 34
#> verify ppois(ex_3_1, 25): 0.9621
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
cat("verify ppois(ex_3_1, 25):", round(ppois(ex_3_1, 25), 4), "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- qpois(0.95, lambda = 25)
ex_3_1
#> [1] 34
cat("verify ppois(ex_3_1, 25):", round(ppois(ex_3_1, 25), 4), "\n")
#> verify ppois(ex_3_1, 25): 0.9621
```

**Explanation:** `qpois(p, lambda)` returns the smallest integer k with $P(X \le k) \ge p$. Because the Poisson is discrete the realised coverage almost always overshoots p; here 0.9621 is the first integer that clears 0.95. Reusing the same logic, `qpois(0.5, lambda)` returns the median, which for integer `lambda` equals `lambda`. A common pitfall is interpreting `qpois()` as a continuous inverse-CDF: the result is always integer-valued and stepwise, never interpolated.

</details>

### Exercise 3.2: Inventory ordering for a 99 percent service level

**Task:** A retailer sells umbrellas at an average rate of 30 per week. To avoid stockouts the inventory manager wants the smallest weekly order quantity that meets a 99 percent service level (the probability of weekly demand being met without backorder is at least 0.99). Use `qpois()` once and save the integer order quantity to `ex_3_2`, then print both the value and the realised service level from `ppois()`.

**Expected result:**

```
#> reorder_point: 43
#> realised_service_level: 0.9911
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
cat("reorder_point:", ex_3_2, "\n")
cat("realised_service_level:", round(ppois(ex_3_2, 30), 4), "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- qpois(0.99, lambda = 30)
cat("reorder_point:", ex_3_2, "\n")
cat("realised_service_level:", round(ppois(ex_3_2, 30), 4), "\n")
#> reorder_point: 43
#> realised_service_level: 0.9911
```

**Explanation:** With weekly mean demand of 30 the standard deviation is $\sqrt{30} \approx 5.48$, so a 99-percent cushion sits roughly $2.33 \times 5.48 \approx 12.8$ units above the mean, giving 43. This matches the integer answer from `qpois()` exactly. The same call structure underpins safety-stock decisions across e-commerce and pharmacy inventory, where ordering "mean plus a margin" leaves you stocking out half the time and ordering by quantile keeps you above your target service level.

</details>

## Section 4. Simulation with rpois (3 problems)

### Exercise 4.1: Simulate a sample and recover the rate

**Task:** Draw a Poisson sample of size 1000 with rate 7 using `rpois()` after calling `set.seed(42)` for reproducibility, then compute the sample mean. Save the sample-mean scalar (not the full vector) to `ex_4_1`. With `n = 1000` and the law of large numbers, the empirical mean should be within roughly 0.1 of the true rate seven.

**Expected result:**

```
#> [1] 7.046
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(42)
# your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
samp_4_1 <- rpois(1000, lambda = 7)
ex_4_1   <- mean(samp_4_1)
ex_4_1
#> [1] 7.046
```

**Explanation:** `rpois(n, lambda)` returns `n` independent draws from a Poisson with the given rate. For large n the sample mean is consistent for `lambda`, which is why 7.046 sits very close to the true 7. The sample variance should be similar (here roughly 7.0) because the Poisson has the equidispersion property `var = mean`. A real-world departure from this equality is the classic test for overdispersion and motivates the negative binomial as a richer alternative.

</details>

### Exercise 4.2: Monte Carlo tail probability versus theory

**Task:** Approximate $P(X \ge 10)$ when `lambda = 6` by simulating 100,000 draws with `rpois()` after `set.seed(2026)`, then compute the empirical fraction of draws greater than or equal to 10. Compare against the exact theoretical value from `ppois()`. Save a named numeric vector `c(simulated = ..., theoretical = ...)` to `ex_4_2`. The two should agree to within roughly 0.002 at this sample size.

**Expected result:**

```
#>   simulated theoretical 
#>     0.08374     0.08392
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(2026)
# your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
draws_4_2 <- rpois(100000, lambda = 6)
ex_4_2 <- c(
  simulated   = mean(draws_4_2 >= 10),
  theoretical = ppois(9, lambda = 6, lower.tail = FALSE)
)
ex_4_2
#>   simulated theoretical 
#>     0.08374     0.08392
```

**Explanation:** The Monte Carlo estimate's standard error scales like $\sqrt{p(1-p)/n}$, so 100,000 draws of a probability near 0.084 gives a standard error around 0.0009 and the two estimates agreeing to three decimals is expected. Note the asymmetry in arguments: `mean(draws >= 10)` is the empirical fraction at or above 10, which equals $P(X > 9) = $ `ppois(9, lower.tail = FALSE)`. Mixing this up by passing 10 to the theoretical call is the classic off-by-one.

</details>

### Exercise 4.3: Time-varying rate over a 30-day window

**Task:** A climatologist models lightning strikes on a tropical island with a piecewise rate: 2 strikes per day for the first 10 days (calm season), 5 per day for the next 10 days (transition), 12 per day for the final 10 days (storm season). Simulate one realisation across all 30 days using a single vectorised `rpois()` call after `set.seed(7)`, returning a length-30 integer vector. Save the vector to `ex_4_3` and print its sum (the total number of strikes over the month).

**Expected result:**

```
#> [1] 199
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(7)
lambdas <- c(rep(2, 10), rep(5, 10), rep(12, 10))
# your code here
sum(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
lambdas <- c(rep(2, 10), rep(5, 10), rep(12, 10))
ex_4_3 <- rpois(30, lambda = lambdas)
sum(ex_4_3)
#> [1] 199
```

**Explanation:** `rpois()` recycles its `lambda` argument elementwise, so passing a length-30 vector draws each entry from a Poisson with its own rate in a single C-level call rather than three separate calls. This is meaningfully faster than looping and is the same trick used in non-homogeneous Poisson process simulation. Expected total is $10 \times 2 + 10 \times 5 + 10 \times 12 = 190$, so a draw of 199 is well within one standard deviation $\sqrt{190} \approx 13.8$ of the expectation.

</details>

## Section 5. Estimating lambda from data (3 problems)

### Exercise 5.1: Maximum likelihood estimator is the sample mean

**Task:** A biostatistician counts the number of point mutations across 80 short genomic regions, stored as the integer vector below. Compute the maximum-likelihood estimate of the Poisson rate parameter, which equals the sample mean, and save the scalar MLE to `ex_5_1`. Also print the result so the value shows in the output.

**Expected result:**

```
#> [1] 3.4625
```

**Difficulty:** Intermediate

```r title="Your turn"
counts_5_1 <- c(
  3, 2, 4, 5, 1, 3, 4, 2, 5, 6, 3, 4, 2, 1, 3, 7, 4, 2, 3, 5,
  4, 3, 2, 5, 4, 3, 6, 2, 1, 3, 4, 5, 3, 2, 4, 1, 6, 3, 4, 2,
  3, 5, 4, 3, 7, 2, 1, 4, 3, 5, 2, 4, 3, 6, 5, 3, 4, 2, 1, 3,
  4, 5, 3, 2, 4, 6, 3, 5, 2, 4, 1, 3, 5, 4, 3, 2, 6, 3, 4, 5
)
# your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts_5_1 <- c(
  3, 2, 4, 5, 1, 3, 4, 2, 5, 6, 3, 4, 2, 1, 3, 7, 4, 2, 3, 5,
  4, 3, 2, 5, 4, 3, 6, 2, 1, 3, 4, 5, 3, 2, 4, 1, 6, 3, 4, 2,
  3, 5, 4, 3, 7, 2, 1, 4, 3, 5, 2, 4, 3, 6, 5, 3, 4, 2, 1, 3,
  4, 5, 3, 2, 4, 6, 3, 5, 2, 4, 1, 3, 5, 4, 3, 2, 6, 3, 4, 5
)
ex_5_1 <- mean(counts_5_1)
ex_5_1
#> [1] 3.4625
```

**Explanation:** Solving $\partial / \partial \lambda \log L = 0$ for the Poisson likelihood gives $\hat{\lambda}_{\text{MLE}} = \bar{x}$, so `mean()` is the maximum-likelihood estimate and no optimiser is needed. The closed form makes the Poisson one of the simplest distributions to estimate, but the trade-off is the strong "mean equals variance" assumption. A quick diagnostic is `var(counts_5_1) / mean(counts_5_1)`; values much above 1 signal overdispersion and a negative binomial may fit better.

</details>

### Exercise 5.2: Wald 95 percent confidence interval for lambda

**Task:** Using the same counts vector `counts_5_1` from the previous exercise, compute the large-sample Wald 95-percent confidence interval for the Poisson rate using the closed form $\hat{\lambda} \pm 1.96 \sqrt{\hat{\lambda}/n}$. Save the two-element numeric vector `c(lower = ..., upper = ...)` to `ex_5_2`. The interval should be narrow because n is 80 and lambda is moderate.

**Expected result:**

```
#>  lower  upper 
#> 3.0552 3.8698
```

**Difficulty:** Advanced

```r title="Your turn"
# your code here using counts_5_1 from Exercise 5.1
round(ex_5_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lambda_hat <- mean(counts_5_1)
n          <- length(counts_5_1)
se         <- sqrt(lambda_hat / n)
ex_5_2 <- c(
  lower = lambda_hat - qnorm(0.975) * se,
  upper = lambda_hat + qnorm(0.975) * se
)
round(ex_5_2, 4)
#>  lower  upper 
#> 3.0552 3.8698
```

**Explanation:** The Wald interval relies on the asymptotic normality of the MLE with variance $\lambda / n$, so the standard error is $\sqrt{\hat{\lambda}/n}$. For moderate to large samples this is accurate, but if your counts are small (mean below about 2) the interval can dip below zero and you should switch to the exact `poisson.test()` interval shown in Section 6. Using `qnorm(0.975)` (about 1.96) avoids hard-coding the magic number and makes the formula generalise to other confidence levels.

</details>

### Exercise 5.3: Fit Poisson via fitdistr from MASS

**Task:** Re-estimate the Poisson rate from `counts_5_1` using `MASS::fitdistr()` with `densfun = "Poisson"`. Extract the named `estimate` element from the returned `fitdistr` object and save the scalar lambda estimate to `ex_5_3`. Confirm it matches `mean(counts_5_1)` to at least four decimal places: by theory the two are identical because `fitdistr()` for the Poisson finds the MLE in closed form.

**Expected result:**

```
#> lambda 
#> 3.4625
```

**Difficulty:** Advanced

```r title="Your turn"
# your code here using counts_5_1 from Exercise 5.1
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_5_3 <- fitdistr(counts_5_1, densfun = "Poisson")
ex_5_3  <- fit_5_3$estimate
ex_5_3
#> lambda 
#> 3.4625
```

**Explanation:** `MASS::fitdistr()` is a general MLE fitter that recognises common distributions by name and skips the optimiser when a closed-form solution exists. For the Poisson it returns the sample mean as the estimate plus a standard error equal to $\sqrt{\hat{\lambda}/n}$. The wrapper is more useful when you need a quick AIC or log-likelihood comparison: `fit_5_3$loglik` and `AIC(fit_5_3)` work out of the box. For richer count models (negative binomial, zero-inflated) use `MASS::glm.nb()` or the `pscl` package instead.

</details>

## Section 6. Inference with poisson.test (3 problems)

### Exercise 6.1: One-sample test against a hypothesised rate

**Task:** An ER nurse manager hypothesises that the night shift averages 8 critical admissions. On a recent night the team logged 14 admissions. Run a two-sided exact test of $H_0: \lambda = 8$ versus $H_a: \lambda \ne 8$ using `poisson.test()` with the observed count, the offset of 1 (one night), and `r = 8`. Extract the p-value and save it as a scalar to `ex_6_1`. Round to four decimal places.

**Expected result:**

```
#> [1] 0.0492
```

**Difficulty:** Intermediate

```r title="Your turn"
# your code here
round(ex_6_1, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_6_1 <- poisson.test(x = 14, T = 1, r = 8, alternative = "two.sided")
ex_6_1   <- test_6_1$p.value
round(ex_6_1, 4)
#> [1] 0.0492
```

**Explanation:** `poisson.test(x, T, r)` performs an exact binomial-based test for the rate parameter against the hypothesised value `r`. With 14 events when 8 were expected the two-sided p-value lands just under 0.05, suggesting evidence against $H_0$ at the conventional level (though only marginally). The `T` argument is the exposure (time, area, person-years); always set it explicitly so the test interprets the rate per unit correctly. The exact test is preferable to a normal approximation when the count is small.

</details>

### Exercise 6.2: Compare two rates with a two-sample exact test

**Task:** A pharmacology team compares adverse events on two trial arms over the same 1000 patient-days each. Arm A: 12 events. Arm B: 25 events. Run a two-sided `poisson.test()` for the rate ratio $\lambda_A / \lambda_B$ with the data vector `c(12, 25)`, the exposures `c(1000, 1000)`, and `r = 1`. Extract the p-value and save it to `ex_6_2`. Round to four decimal places.

**Expected result:**

```
#> [1] 0.0469
```

**Difficulty:** Advanced

```r title="Your turn"
# your code here
round(ex_6_2, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_6_2 <- poisson.test(
  x = c(12, 25),
  T = c(1000, 1000),
  r = 1,
  alternative = "two.sided"
)
ex_6_2 <- test_6_2$p.value
round(ex_6_2, 4)
#> [1] 0.0469
```

**Explanation:** With two counts and two exposures, `poisson.test()` switches to a conditional binomial test on the first count given the total, testing the null rate ratio `r`. The result mirrors what you would get from an exact two-sided binomial test on 12 successes out of 37 with success probability 0.5. The 95-percent confidence interval for the rate ratio (`test_6_2$conf.int`) usefully complements the p-value because it tells you how big or small the true ratio could plausibly be, not just whether it differs from 1.

</details>

### Exercise 6.3: Extract the rate-ratio confidence interval

**Task:** Using the same two counts as the previous exercise (12 events on arm A and 25 events on arm B, each with 1000 patient-days of exposure), extract the 95-percent confidence interval for the rate ratio $\lambda_A / \lambda_B$ from the `poisson.test()` object. Save the two-element numeric vector `c(lower, upper)` of the interval to `ex_6_3`. The interval excludes 1, consistent with the significant p-value from the previous problem.

**Expected result:**

```
#>  lower  upper 
#> 0.2334 0.9851
```

**Difficulty:** Advanced

```r title="Your turn"
# your code here
round(ex_6_3, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_6_3 <- poisson.test(
  x = c(12, 25),
  T = c(1000, 1000),
  conf.level = 0.95
)
ex_6_3 <- setNames(as.numeric(test_6_3$conf.int), c("lower", "upper"))
round(ex_6_3, 4)
#>  lower  upper 
#> 0.2334 0.9851
```

**Explanation:** The `conf.int` element of a `htest` object holds the exact confidence interval for the parameter, here the rate ratio $\lambda_A / \lambda_B$. Because the interval (0.23, 0.99) excludes 1, arm A's event rate is statistically lower than arm B's at the 5 percent level, matching the significant p-value above. For regulatory reporting it is good practice to quote both the point estimate (`test_6_3$estimate`) and the interval rather than the p-value alone, because the interval communicates effect size and uncertainty in one shot.

</details>

## What to do next

Now that you can manipulate Poisson probabilities, quantiles, samples, and tests in R, build up your inferential toolkit with these related practice hubs:

- [Binomial Distribution Exercises in R](Binomial-Distribution-Exercises-in-R.html) for the discrete cousin of the Poisson and the limit relationship between them.
- [Poisson Regression Exercises in R](Poisson-Regression-Exercises-in-R.html) to model counts that depend on covariates rather than a single fixed rate.
- [Normal Distribution Exercises in R](Normal-Distribution-Exercises-in-R.html) to practice the d/p/q/r prefix pattern on the continuous side.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) to ground exact tests like `poisson.test()` inside the broader null-hypothesis framework.

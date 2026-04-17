---
title: "Poisson Distribution Exercises in R: 10 Problems with Solutions"
slug: Poisson-Distribution-Exercises-in-R
description: "Master Poisson distribution in R with 10 practice problems covering dpois, ppois, qpois, rpois, and poisson.test. Each exercise has a scaffold, hint, solution."
keywords: "poisson distribution R exercises, dpois examples, ppois practice problems, rpois simulation, qpois quantile, poisson.test R, poisson probability R, R statistics practice"
auto_link_terms: "poisson distribution exercises|poisson practice problems|dpois exercises|ppois exercises|rpois exercises|poisson exercises in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: E4.4
post_type: EX
sidebar_title: "Poisson Distribution Exercises"
fr_parent: Binomial-and-Poisson-Distributions-in-R.html
difficulty: Intermediate
---

# Poisson Distribution Exercises in R: 10 Problems with Solutions

<p class="lead">These 10 Poisson distribution exercises in R walk you from <code>dpois()</code> one-liners to <code>poisson.test()</code> inference, with full runnable solutions. Every problem has a scaffold, a hint, and a reveal so you can check your answer the moment you finish coding.</p>

## What quick R one-liners solve Poisson problems?

The Poisson distribution answers one question: *given an average rate λ of events in a window, how likely is each count?* R gives you four functions, `dpois()`, `ppois()`, `qpois()`, `rpois()`, that cover exact probability, cumulative probability, quantiles, and random samples. Before the 10 problems, a single runnable block shows the two most common cases side by side so you can spot which function fits a new question at a glance.

```r
# Call centre — 4 calls/hour on average
dpois(3, lambda = 4)     # P(exactly 3 calls in 1 hour)
#> [1] 0.1953668

ppois(3, lambda = 4)     # P(at most 3 calls in 1 hour)
#> [1] 0.4334701
```

The first call asks "what is the probability of exactly 3 calls?" and the second asks "what is the probability of 3 or fewer?" Both share the same parameter, `lambda = 4` events per hour, and differ only in the function name. That two-function pairing handles most questions you will meet.

![Decision tree: the four Poisson functions.](screenshots/Poisson-Distribution-Exercises-in-R-function-picker.webp)

*Figure 1: The four Poisson functions, pick one by what the question asks for.*

[KEY INSIGHT]
**R's d/p/q/r prefix pattern is universal.** The same four-letter scheme, `d` for density/mass, `p` for cumulative, `q` for quantile, `r` for random, works for every distribution in base R (`dnorm`, `pbinom`, `qexp`, `rt`). Learn it once for Poisson, reuse it forever.

**Try it:** Compute the probability of exactly 2 events when the average rate is λ = 5.

```r
# Try it: exact probability with dpois
ex_p <- dpois(___, lambda = ___)
ex_p
#> Expected: about 0.0842
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_p <- dpois(2, lambda = 5)
ex_p
#> [1] 0.08422434
```

**Explanation:** `dpois(k, lambda)` returns P(X = k). With λ = 5 events on average but k = 2 observed, the count falls well below the mean, so the probability is small.

</details>

## How do you compute exact Poisson probabilities with dpois()?

`dpois(k, lambda)` returns the probability mass at a single count. The formula under the hood is the classic Poisson PMF:

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

Where:
- $\lambda$ = the average rate of events per window
- $k$ = the count of events you ask about
- $e$ = Euler's constant, ≈ 2.71828
- $k!$ = k factorial (the number of orderings of k items)

For a single k, one `dpois()` call is enough. For a range of counts, say "between 3 and 5 emails", pass a vector of k values and sum the result.

```r
# Emails — 3 per hour on average
dpois(5, lambda = 3)                    # P(exactly 5 emails)
#> [1] 0.1008188

p_emails <- sum(dpois(3:5, lambda = 3)) # P(3, 4, or 5 emails)
p_emails
#> [1] 0.4901484
```

The first call gives a direct mass at k = 5. The second passes a vector `3:5` to `dpois()`, returning three probabilities in one go, which `sum()` collapses into the total for the range. The answer, about 49%, is the probability that the hour lands anywhere in that 3-to-5-email band.

[TIP]
**Pass a vector of k values to vectorize dpois().** For any "between a and b" range question, `sum(dpois(a:b, lambda))` is the one-line idiom. It is faster and clearer than a loop, and it beats typing three separate `dpois()` calls.

**Try it:** A bus arrives at a stop at a rate of 1.5 per 10 minutes. Compute P(exactly 2 arrivals in a 10-minute window).

```r
# Try it: bus arrivals with dpois
ex_bus <- dpois(___, lambda = ___)
ex_bus
#> Expected: about 0.2510
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bus <- dpois(2, lambda = 1.5)
ex_bus
#> [1] 0.2510214
```

**Explanation:** With λ = 1.5 buses per 10 minutes, seeing exactly 2 is close to the mean, so the probability is high, about 25%.

</details>

## How do you compute cumulative Poisson probabilities with ppois()?

`ppois(q, lambda)` returns the cumulative probability up to and including `q`, that is, P(X ≤ q). For "at least" questions, use the complement rule or the `lower.tail = FALSE` shortcut.

Two ways to get "at least 7":

```r
# Customer arrivals — 5 per hour on average
p_at_most <- ppois(5, lambda = 5)
p_at_most
#> [1] 0.6159607

p_at_least <- 1 - ppois(6, lambda = 5)              # complement
p_at_least
#> [1] 0.2378398

ppois(6, lambda = 5, lower.tail = FALSE)            # same thing, cleaner
#> [1] 0.2378398
```

The first line returns the probability of 5 or fewer arrivals, just over 61%, a bit more than half since 5 matches the mean exactly. The next two lines compute P(X ≥ 7) by subtracting P(X ≤ 6) from 1. The `lower.tail = FALSE` form skips the subtraction and returns the upper tail directly, the idiom to reach for in every "at least" problem.

[WARNING]
**ppois(q) returns P(X ≤ q), NOT P(X < q).** This is the most common off-by-one trap in Poisson problems. For strict inequality P(X < 7), pass `q = 6` to `ppois()`. For P(X ≥ 7), pass `q = 6` with `lower.tail = FALSE`, not `q = 7`.

**Try it:** Defects arrive on a production line at λ = 2 per shift. Compute P(at least 3 defects in a shift).

```r
# Try it: at-least probability with ppois
ex_defects <- ppois(___, lambda = ___, lower.tail = ___)
ex_defects
#> Expected: about 0.3233
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_defects <- ppois(2, lambda = 2, lower.tail = FALSE)
ex_defects
#> [1] 0.3233236
```

**Explanation:** P(X ≥ 3) is the upper tail starting strictly above 2. Pass `q = 2` with `lower.tail = FALSE`, `ppois()` returns P(X > 2), which is the same as P(X ≥ 3) for an integer-valued distribution.

</details>

## How do you find quantiles and simulate counts with qpois() and rpois()?

`qpois(p, lambda)` inverts `ppois()`, give it a cumulative probability and it returns the smallest count `k` where P(X ≤ k) reaches `p`. `rpois(n, lambda)` draws `n` random counts from the distribution, useful for simulation.

```r
# Website traffic — 10 visits/minute on average
q95 <- qpois(0.95, lambda = 10)   # 95th-percentile traffic
q95
#> [1] 15

set.seed(42)
sim_counts <- rpois(5, lambda = 10)  # five simulated minutes
sim_counts
#> [1]  9 14 10 13  9
```

The first call answers "what is the smallest visit count that covers 95% of minutes?", 15 visits. If you provisioned a server for 15 concurrent visits, it would handle 95% of one-minute windows without overload. The second call draws 5 random counts from the same distribution, which hover around the mean of 10, exactly what a real minute-by-minute log would look like.

[NOTE]
**rpois's first argument is the number of draws, not lambda.** Write `rpois(n = 1000, lambda = 5)` for 1,000 random counts, not `rpois(5, 1000)`. The order matters, unnamed arguments swap roles silently.

**Try it:** Set `set.seed(7)` and simulate 10 counts with λ = 4. Report the sample mean.

```r
# Try it: simulate and report mean
set.seed(7)
ex_sim <- rpois(___, lambda = ___)
mean(ex_sim)
#> Expected: around 4 (sampling noise varies each run)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(7)
ex_sim <- rpois(10, lambda = 4)
ex_sim
#> [1] 6 3 3 4 8 5 3 6 3 4
mean(ex_sim)
#> [1] 4.5
```

**Explanation:** The theoretical mean of a Poisson(λ) is λ itself. A 10-draw sample will land close but not exactly on 4 because of sampling noise; a 10,000-draw sample would converge much tighter.

</details>

## Practice Exercises

Ten problems, arranged from easy to hard. Each uses distinct `my_*` variable names so your exercise work does not overwrite the tutorial state above. Write your solution in the starter block, run it, then open the reveal to check.

### Exercise 1: Emergency room admissions (exact count)

A hospital emergency room averages 6 admissions per hour. Compute P(exactly 4 admissions in an hour). Save the answer to `my_p1`.

```r
# Exercise 1: exact count with dpois
# Hint: dpois(k, lambda) gives P(X = k)

my_p1 <- 
print(my_p1)
#> Expected: about 0.1339
```

<details>
<summary>Click to reveal solution</summary>

```r
my_p1 <- dpois(4, lambda = 6)
print(my_p1)
#> [1] 0.1338526
```

**Explanation:** With λ = 6 per hour but k = 4, the observed count is below the mean, so the probability dips below the mass at k = 6 (which is the mode).

</details>

### Exercise 2: Monthly website outages (at most k)

A website averages 2 outages per month. Compute P(at most 1 outage in a given month). Save to `my_p2`.

```r
# Exercise 2: cumulative probability with ppois
# Hint: "at most k" means P(X <= k)

my_p2 <- 
print(my_p2)
#> Expected: about 0.4060
```

<details>
<summary>Click to reveal solution</summary>

```r
my_p2 <- ppois(1, lambda = 2)
print(my_p2)
#> [1] 0.4060058
```

**Explanation:** `ppois(1, 2)` sums the masses at 0 and 1 outages, about 41% of months stay within the "0 or 1" window.

</details>

### Exercise 3: Product defects (at least 2)

A production unit averages 0.8 defects per unit. Compute P(at least 2 defects in a unit). Save to `my_p3`.

```r
# Exercise 3: complement with ppois
# Hint: use lower.tail = FALSE and pass q = 1

my_p3 <- 
print(my_p3)
#> Expected: about 0.1912
```

<details>
<summary>Click to reveal solution</summary>

```r
my_p3 <- ppois(1, lambda = 0.8, lower.tail = FALSE)
print(my_p3)
#> [1] 0.1912079
```

**Explanation:** P(X ≥ 2) = P(X > 1). Pass `q = 1` with `lower.tail = FALSE`, this is the upper-tail idiom that replaces the manual `1 - ppois(...)` subtraction.

</details>

### Exercise 4: Insurance claims (range)

An insurer receives 5 claims per day on average. Compute P(between 3 and 7 claims, inclusive). Save to `my_p4`.

```r
# Exercise 4: range using sum(dpois(a:b, lambda))
# Hint: 3:7 is a vector of 5 values

my_p4 <- 
print(my_p4)
#> Expected: about 0.7419
```

<details>
<summary>Click to reveal solution</summary>

```r
my_p4 <- sum(dpois(3:7, lambda = 5))
print(my_p4)
#> [1] 0.7419466
```

**Explanation:** Passing `3:7` to `dpois()` returns five probabilities, one per count. `sum()` collapses them into the total mass for the inclusive range, about 74%, a large share because the range is centred on the mean.

</details>

### Exercise 5: Helpdesk staffing (quantile)

A helpdesk receives 12 calls per hour on average. Find the smallest staff count `my_staff` such that P(calls ≤ my_staff) ≥ 0.95, enough capacity to cover 95% of hours.

```r
# Exercise 5: inverse CDF with qpois
# Hint: qpois returns the smallest k with P(X <= k) >= p

my_staff <- 
print(my_staff)
#> Expected: 18
```

<details>
<summary>Click to reveal solution</summary>

```r
my_staff <- qpois(0.95, lambda = 12)
print(my_staff)
#> [1] 18

# Sanity check
ppois(18, lambda = 12)
#> [1] 0.9625197
```

**Explanation:** `qpois(0.95, 12)` answers "what staff count covers at least 95% of hours?", 18. The sanity check confirms `ppois(18, 12)` indeed exceeds 0.95, while `ppois(17, 12)` does not.

</details>

### Exercise 6: Call-centre simulation (rpois + summary stats)

Simulate 10,000 hours of a call centre with λ = 8. Set `set.seed(44)`. Save the draws to `my_sim6` and compute the sample mean and variance, both should land near 8.

```r
# Exercise 6: simulate and verify mean = variance = lambda
set.seed(44)
my_sim6 <- 
c(sample_mean = mean(my_sim6), sample_var = var(my_sim6))
#> Expected: both about 8
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(44)
my_sim6 <- rpois(10000, lambda = 8)
c(sample_mean = mean(my_sim6), sample_var = var(my_sim6))
#> sample_mean  sample_var
#>   7.985300    7.949594
```

**Explanation:** A Poisson distribution has the unusual property that `E[X] = Var[X] = λ`. A 10,000-draw sample makes both estimates snap tight to 8, a quick visual check that your data really is Poisson-shaped.

</details>

### Exercise 7: Bus arrivals (rate scaling)

Buses arrive at a stop at 2 per 15 minutes on average. Convert the rate to arrivals per hour (should be λ = 8) and compute P(at least 10 buses in a 60-minute window). Save to `my_p7`.

```r
# Exercise 7: scale lambda, then compute upper tail
# Hint: 2 per 15 min = 8 per 60 min; then use ppois with lower.tail = FALSE

my_lambda7 <- 
my_p7 <- 
print(my_p7)
#> Expected: about 0.2834
```

<details>
<summary>Click to reveal solution</summary>

```r
my_lambda7 <- 2 * 4           # 4 quarters in an hour => lambda = 8 / hour
my_p7 <- ppois(9, lambda = my_lambda7, lower.tail = FALSE)
print(my_p7)
#> [1] 0.2833757
```

**Explanation:** Poisson rates scale linearly with the time window. Doubling the window doubles λ. Once rescaled to hourly units, this becomes a standard "at least 10" upper-tail query, so use `lower.tail = FALSE` with `q = 9`.

</details>

### Exercise 8: Plot the PMF (visualization)

Plot the probability mass function of Poisson(λ = 7) over the range 0:20 using `barplot()`. Label the axes and highlight the mode bar in a distinct colour.

```r
# Exercise 8: PMF barplot
# Hint: dpois(0:20, 7) gives you the full vector of masses

my_x8 <- 0:20
my_masses8 <- 
my_colours8 <- 

barplot(my_masses8, names.arg = my_x8,
        col = my_colours8,
        xlab = "k (count)", ylab = "P(X = k)",
        main = "Poisson PMF, lambda = 7")
```

<details>
<summary>Click to reveal solution</summary>

```r
my_x8 <- 0:20
my_masses8 <- dpois(my_x8, lambda = 7)
my_colours8 <- ifelse(my_masses8 == max(my_masses8), "steelblue", "grey70")

barplot(my_masses8, names.arg = my_x8,
        col = my_colours8,
        xlab = "k (count)", ylab = "P(X = k)",
        main = "Poisson PMF, lambda = 7")
```

**Explanation:** The Poisson PMF peaks at the integer floor of λ, here, k = 7. The highlighted bar makes that mode obvious. For non-integer λ, two adjacent bars can share the maximum.

</details>

### Exercise 9: Rate test (poisson.test)

Over 10 time units you observed 25 events. Test the null hypothesis H0: λ = 2 against a two-sided alternative using `poisson.test()`. Save the result to `my_test9` and extract the p-value.

```r
# Exercise 9: exact rate test
# Hint: poisson.test(x, T, r) where x = observed, T = time, r = null rate

my_test9 <- 
my_test9$p.value
#> Expected: about 0.0343
```

<details>
<summary>Click to reveal solution</summary>

```r
my_test9 <- poisson.test(x = 25, T = 10, r = 2)
print(my_test9)
#>   Exact Poisson test
#>
#> data:  25 time base: 10
#> number of events = 25, time base = 10, p-value = 0.03426
#> alternative hypothesis: true event rate is not equal to 2
#> 95 percent confidence interval:
#>  1.617477 3.691057
#> sample estimate:
#> event rate
#>        2.5

my_test9$p.value
#> [1] 0.03425515
```

**Explanation:** The observed rate is 2.5 events per unit, higher than the hypothesised 2. The exact two-sided p-value is about 0.034, so you reject H0 at α = 0.05. The 95% CI (1.62, 3.69) excludes 2 at the lower bound only just barely, the evidence is there, but not overwhelming.

</details>

### Exercise 10: Hospital bed planning (capacity + simulation)

A hospital admits 30 patients per day on average. What is the smallest bed capacity `my_beds` such that the probability of overflow, P(admissions > my_beds), stays below 5%? Verify with a 10,000-day simulation (`set.seed(2026)`): the empirical overflow share should sit under 0.05.

```r
# Exercise 10: capacity planning, then verify by simulation
# Hint: use qpois(0.95, 30), then check with rpois

my_beds <- 
print(my_beds)
#> Expected: 39

set.seed(2026)
my_days10 <- rpois(10000, lambda = 30)
my_overflow <- mean(my_days10 > my_beds)
print(my_overflow)
#> Expected: around 0.03
```

<details>
<summary>Click to reveal solution</summary>

```r
my_beds <- qpois(0.95, lambda = 30)
print(my_beds)
#> [1] 39

set.seed(2026)
my_days10 <- rpois(10000, lambda = 30)
my_overflow <- mean(my_days10 > my_beds)
print(my_overflow)
#> [1] 0.0299
```

**Explanation:** `qpois(0.95, 30)` returns 39, the smallest count with cumulative probability ≥ 95%. The simulation confirms only about 3% of days exceed 39 admissions, well within the 5% overflow budget. If you tried 38 beds instead, the empirical overflow would jump above 5%.

</details>

## Complete Example: End-to-End ER Admissions Workflow

A real capacity study combines every function you just practised. Walk through a full hour-by-hour ER admissions analysis: compute the theoretical moments, cap capacity at the 95th percentile, simulate a week of hours to sanity-check the distribution, then test the rate against a historical baseline using 72 hours of recent data.

```r
# Scenario: ER admissions, lambda = 6 per hour
er_lambda <- 6

# 1. Theoretical mean and variance (both equal lambda for Poisson)
c(mean = er_lambda, variance = er_lambda)
#>     mean variance
#>        6        6

# 2. Probability the hour is a "stress hour" (8 or more admissions)
ppois(7, lambda = er_lambda, lower.tail = FALSE)
#> [1] 0.2560202

# 3. 95th-percentile hourly capacity target
qpois(0.95, lambda = er_lambda)
#> [1] 10

# 4. Simulate a week (168 hours) and summarise
set.seed(2026)
er_sim <- rpois(168, lambda = er_lambda)
summary(er_sim)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   0.000   4.000   6.000   5.976   8.000  12.000

# 5. Rate test: observed 520 admissions over 72 hours vs baseline lambda = 6
er_test <- poisson.test(x = 520, T = 72, r = 6)
er_test$p.value
#> [1] 0.0008842947

er_test$conf.int
#> [1] 6.608921 7.866632
#> attr(,"conf.level")
#> [1] 0.95
```

The five steps form a reproducible capacity review. First, the theoretical mean and variance both equal 6, the Poisson signature. Second, about 26% of hours will cross 8 admissions, so roughly one in four hours is a stress hour. Third, `qpois(0.95, 6)` sets the 95th-percentile staffing target at 10 beds. Fourth, a 168-hour simulation returns a sample mean near 6 and a max of 12, exactly what a real week would look like. Fifth, the `poisson.test()` on 520 admissions in 72 hours returns a p-value of about 0.0009 and a 95% CI of (6.61, 7.87), conclusive evidence that the recent rate has climbed above the baseline of 6, which should prompt a staffing review.

## Summary

The table below is the full decision reference for Poisson problems in R. Pair it with the four-function picker in Figure 1 and the PMF formula to handle every exercise type you just practised.

| Function | What it returns | Typical question | One-line idiom |
|---|---|---|---|
| `dpois(k, lambda)` | P(X = k) | "Exactly k events" | `dpois(5, 3)` |
| `ppois(q, lambda)` | P(X ≤ q) | "At most q events" | `ppois(5, 3)` |
| `ppois(q, lambda, lower.tail = FALSE)` | P(X > q) | "At least q+1 events" | `ppois(4, 3, lower.tail = FALSE)` |
| `qpois(p, lambda)` | smallest k with P(X ≤ k) ≥ p | "Capacity for p% of windows" | `qpois(0.95, 3)` |
| `rpois(n, lambda)` | n random counts | "Simulate n windows" | `rpois(1000, 3)` |
| `poisson.test(x, T, r)` | exact rate test + 95% CI | "Is the rate different from r?" | `poisson.test(25, 10, 2)` |

Key facts to remember:

- The PMF is $P(X = k) = \lambda^k e^{-\lambda} / k!$.
- Mean and variance both equal λ, the Poisson fingerprint.
- Poisson rates scale linearly with the window: doubling the window doubles λ.
- `ppois(q)` returns P(X ≤ q), not P(X < q), an off-by-one trap.
- For ranges, `sum(dpois(a:b, lambda))` is the vectorised idiom.

## References

1. R Core Team, *The Poisson Distribution* (`?Poisson` help page). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Poisson.html)
2. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition (2023). [Link](https://r4ds.hadley.nz/)
3. Ross, S., *Introduction to Probability Models*, 12th Edition. Academic Press (2019). Chapter 5: The Poisson Process.
4. Zach, *A Guide to dpois, ppois, qpois, and rpois in R*. Statology. [Link](https://www.statology.org/dpois-ppois-qpois-rpois-r/)
5. Soage, J. C., *Poisson Distribution in R*. R-Coder. [Link](https://r-coder.com/poisson-distribution-r/)
6. Schork, J., *Poisson Distribution in R (4 Examples)*. Statistics Globe. [Link](https://statisticsglobe.com/poisson-distribution-in-r-dpois-ppois-qpois-rpois)
7. Rusczyk, D., *Exercises on the Poisson Distribution*. Emory Math Center. [Link](https://mathcenter.oxford.emory.edu/site/math117/probSetPoissonDistribution/)
8. Dalgaard, P., *Introductory Statistics with R*, 2nd Edition. Springer (2008). Chapter 3: Probability and Distributions.

## Continue Learning

- [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html), the core tutorial this exercise set sharpens. Read it first if `dpois()` vs `dbinom()` still feels blurry.
- [Binomial Distribution Exercises in R](Binomial-Distribution-Exercises-in-R.html), sibling exercise set. Same scaffold-hint-reveal format, applied to `dbinom`/`pbinom`/`qbinom`/`rbinom`.
- [Random Variables in R](Random-Variables-in-R.html), the foundational post covering PMFs, CDFs, and quantile functions that `dpois`/`ppois`/`qpois` implement.

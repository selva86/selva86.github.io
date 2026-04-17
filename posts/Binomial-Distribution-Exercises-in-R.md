---
title: "Binomial Distribution Exercises in R: 10 Practice Problems Solved"
slug: Binomial-Distribution-Exercises-in-R
description: "Solve 10 binomial distribution exercises in R with runnable code. Covers dbinom, pbinom, qbinom, rbinom, binom.test, and visualization with full solutions."
keywords: "binomial distribution R exercises, dbinom examples, pbinom practice problems, rbinom simulation, qbinom quantile, binom.test R, binomial probability R, R statistics practice"
auto_link_terms: "binomial distribution exercises|binomial practice problems|dbinom exercises|pbinom exercises|rbinom exercises|binomial exercises in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: E4.3
post_type: EX
sidebar_title: "Binomial Distribution Exercises"
fr_parent: Binomial-and-Poisson-Distributions-in-R.html
difficulty: Intermediate
---

# Binomial Distribution Exercises in R: 10 Practice Problems Solved

<p class="lead">These 10 binomial distribution exercises in R walk you from <code>dbinom()</code> one-liners to <code>binom.test()</code> inference, with full runnable solutions. Every problem has a scaffold, a hint, and a reveal so you can check your answer the moment you finish coding.</p>

## What quick R one-liners solve binomial problems?

The binomial distribution answers one question: *given n trials with success probability p, how likely is each count of successes?* R gives you four functions, `dbinom()`, `pbinom()`, `qbinom()`, `rbinom()`, that cover exact probability, cumulative probability, quantiles, and random samples. Before the 10 problems, a single runnable block shows the two most common cases side by side so you can spot which function fits a new question at a glance.

```r title="Demo dbinom and pbinom on coin flips"
# Fair coin, 10 flips — two classic questions
dbinom(5, size = 10, prob = 0.5)   # P(exactly 5 heads)
#> [1] 0.2460938

pbinom(5, size = 10, prob = 0.5)   # P(at most 5 heads)
#> [1] 0.6230469
```

The first call asks "what is the probability of landing on exactly 5 heads?" and the second asks "what is the probability of 5 or fewer?" Both share the same parameters, `size = 10` trials, `prob = 0.5` success rate, and differ only in the function name. That two-function pairing handles most questions you will meet.

![Decision tree: the four binomial functions.](screenshots/Binomial-Distribution-Exercises-in-R-function-picker.webp)

*Figure 1: The four binomial functions, pick one by what the question asks for.*

[KEY INSIGHT]
**R's d/p/q/r prefix pattern is universal.** The same four-letter scheme, `d` for density/mass, `p` for cumulative, `q` for quantile, `r` for random, works for every distribution in base R (`dnorm`, `ppois`, `qexp`, `rt`). Learn it once for binomial, reuse it forever.

**Try it:** Compute the probability of exactly 3 successes in 8 trials with success probability 0.4.

```r title="Your turn: dbinom for exactly three"
# Try it: exact probability with dbinom
ex_p <- dbinom(___, size = ___, prob = ___)
ex_p
#> Expected: about 0.2787
```

<details>
<summary>Click to reveal solution</summary>

```r title="dbinom for three successes solution"
ex_p <- dbinom(3, size = 8, prob = 0.4)
ex_p
#> [1] 0.2786918
```

**Explanation:** `dbinom(k, n, p)` returns P(X = k). Here X is the number of successes in 8 independent trials with p = 0.4, and k = 3.

</details>

## How do you compute exact binomial probabilities with dbinom()?

`dbinom(k, size = n, prob = p)` returns the probability mass at a single count. The formula under the hood is the classic binomial PMF:

$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

Where:
- $n$ = number of trials
- $k$ = count of successes you ask about
- $p$ = probability of success on each trial
- $\binom{n}{k}$ = the number of ways to choose which trials succeed

For a single k, a single `dbinom()` call is enough. For a range of counts, say "between 3 and 5 successes", pass a vector of k values and sum the result.

```r title="Sum dbinom over a range"
# Fair coin, 10 flips
p_seven <- dbinom(7, size = 10, prob = 0.5)   # exactly 7 heads
p_seven
#> [1] 0.1171875

# Between 3 and 5 heads, inclusive
p_range <- sum(dbinom(3:5, size = 10, prob = 0.5))
p_range
#> [1] 0.568359375
```

`p_seven` tells you that landing on exactly 7 heads happens about 12% of the time, not rare, but not the modal outcome either. The range call sums the PMF at k = 3, 4, 5. Passing the vector `3:5` vectorizes automatically, and `sum()` collapses the three probabilities into one number (roughly 0.57).

[TIP]
**Vectorize dbinom for ranges instead of calling it in a loop.** `sum(dbinom(3:5, 10, 0.5))` is faster and more readable than three separate calls, and it scales cleanly when the range gets wider (e.g., `sum(dbinom(30:60, 100, 0.5))`).

**Try it:** Find the probability of exactly 4 successes in 12 trials with success probability 0.3.

```r title="Your turn: dbinom with twelve trials"
# Try it: dbinom with n=12, p=0.3
ex_p4 <- dbinom(___, size = ___, prob = ___)
ex_p4
#> Expected: about 0.2311
```

<details>
<summary>Click to reveal solution</summary>

```r title="dbinom twelve trials solution"
ex_p4 <- dbinom(4, size = 12, prob = 0.3)
ex_p4
#> [1] 0.2311397
```

**Explanation:** Same function, new parameters. The peak of this PMF sits near np = 3.6, so k = 4 is close to the mode and picks up a large share of the mass.

</details>

## How do you compute cumulative probabilities with pbinom()?

`pbinom(q, size = n, prob = p)` returns $P(X \le q)$, the cumulative probability up to and including q. "At least" questions flip the direction, and there are two equivalent ways to compute them: the explicit complement `1 - pbinom(...)` or the `lower.tail = FALSE` argument.

```r title="Compute cumulative probability with pbinom"
# n = 10, p = 0.3
p_leq3 <- pbinom(3, size = 10, prob = 0.3)   # P(X <= 3)
p_leq3
#> [1] 0.6496107

# P(X >= 7), two equivalent ways
p_geq7a <- 1 - pbinom(6, size = 10, prob = 0.3)
p_geq7a
#> [1] 0.01059208

p_geq7b <- pbinom(6, size = 10, prob = 0.3, lower.tail = FALSE)
p_geq7b
#> [1] 0.01059208
```

`p_leq3` says that in 10 trials with p = 0.3, three or fewer successes happen about 65% of the time. The two "at least 7" calls return the same ~1% probability: `1 - pbinom(6, ...)` subtracts everything up to 6 from 1, while `lower.tail = FALSE` does the same arithmetic internally. Use whichever reads better in your code; the `lower.tail` form avoids a potential rounding issue when the tail is extremely small.

[WARNING]
**pbinom(q) is P(X ≤ q), not P(X < q).** A common off-by-one mistake is to write `pbinom(7, ...)` when you really want "strictly less than 7", the correct call is `pbinom(6, ...)`. Always ask yourself whether the boundary is included before picking q.

**Try it:** For n = 5 and p = 0.2, find the probability of at least 2 successes.

```r title="Your turn: at least two successes"
# Try it: P(X >= 2) with n=5, p=0.2
ex_ge <- 1 - pbinom(___, size = ___, prob = ___)
ex_ge
#> Expected: about 0.2627
```

<details>
<summary>Click to reveal solution</summary>

```r title="At least two successes solution"
ex_ge <- 1 - pbinom(1, size = 5, prob = 0.2)
ex_ge
#> [1] 0.26272

# Equivalent with lower.tail
pbinom(1, size = 5, prob = 0.2, lower.tail = FALSE)
#> [1] 0.26272
```

**Explanation:** "At least 2" means X ≥ 2, which is the complement of X ≤ 1. Subtract `pbinom(1, ...)` from 1, or use `lower.tail = FALSE` to get the upper tail directly.

</details>

## How do you find quantiles and simulate with qbinom() and rbinom()?

`qbinom()` inverts `pbinom()`: given a cumulative probability, it returns the smallest count whose cumulative probability reaches that threshold. `rbinom()` draws random binomial counts, useful for simulation, Monte Carlo checks, and bootstrapping. The first argument of `rbinom()` is the number of random draws to make, not the trial count; the trial count is `size`.

```r title="Use qbinom and rbinom"
# n = 100 trials, p = 0.4 — 95th percentile of the success count
q95 <- qbinom(0.95, size = 100, prob = 0.4)
q95
#> [1] 48

# Five simulated outcomes from the same distribution
set.seed(101)
sim5 <- rbinom(5, size = 100, prob = 0.4)
sim5
#> [1] 38 38 42 39 42
```

`q95 = 48` tells you that in 95% of experiments you should see 48 or fewer successes, so 48 is a reasonable "worst-case-except-for-5%" threshold. The `rbinom()` call generates 5 independent samples from Binomial(100, 0.4); each number is one simulated experiment's success count, and they cluster around the mean $np = 40$. `set.seed()` ensures your results match when you rerun the code.

[NOTE]
**rbinom's first argument is the number of draws, not the trial count.** `rbinom(5, 100, 0.4)` means "give me 5 independent counts, each from Binomial(100, 0.4)", not "5 trials with 100 draws each." Swapping the two is the most common bug with this function.

**Try it:** Simulate 10 draws from Binomial(20, 0.6) with `set.seed(7)` and compute the mean of the draws.

```r title="Your turn: simulate ten counts"
# Try it: 10 simulated counts, their mean
set.seed(7)
ex_sim <- rbinom(___, size = ___, prob = ___)
mean(ex_sim)
#> Expected: a value near 12 (theoretical mean is np = 12)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simulated mean near np solution"
set.seed(7)
ex_sim <- rbinom(10, size = 20, prob = 0.6)
ex_sim
#> [1] 13 13 10 13 14 11 13 13 13 14
mean(ex_sim)
#> [1] 12.7
```

**Explanation:** With only 10 draws, the sample mean (12.7) wanders a bit around the theoretical mean `np = 12`. Increase the number of draws to tighten the estimate, try 10,000 and compare.

</details>

## Practice Exercises

Ten problems, progressively harder. Each one gives the setup, a starter block with a hint, and a hidden solution you can reveal after you try. Variables are prefixed `ans` or named by exercise so they do not clash with tutorial state.

### Exercise 1: Exactly k heads in a fair coin toss

A fair coin is tossed 6 times. What is the probability of exactly 4 heads? Save the answer to `ans1`.

```r title="Exercise 1: dbinom for four heads"
# Exercise 1: exact probability with dbinom
# Hint: size = 6, prob = 0.5

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ans1 <- dbinom(4, size = 6, prob = 0.5)
ans1
#> [1] 0.234375
```

**Explanation:** P(X = 4) for Binomial(6, 0.5). Four heads in six tosses is close to the mode (3), so the probability is a healthy ~23%.

</details>

### Exercise 2: At most 2 defects in a batch

A factory produces parts with a 15% defect rate. In a batch of 20 parts, what is the probability of at most 2 defects? Save to `ans2`.

```r title="Exercise 2: at most two defects"
# Exercise 2: cumulative probability with pbinom
# Hint: "at most 2" means X <= 2

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ans2 <- pbinom(2, size = 20, prob = 0.15)
ans2
#> [1] 0.4048607
```

**Explanation:** P(X ≤ 2) in Binomial(20, 0.15). About 40% of batches pass a "2 defects or fewer" gate.

</details>

### Exercise 3: At least 3 correct by guessing

A quiz has 10 multiple-choice questions, each with 4 options. What is the probability of getting at least 3 correct by guessing randomly? Save to `ans3`.

```r title="Exercise 3: at least three correct"
# Exercise 3: complement with pbinom
# Hint: p = 1/4, "at least 3" is the complement of "at most 2"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ans3 <- 1 - pbinom(2, size = 10, prob = 0.25)
ans3
#> [1] 0.4744072

# Equivalent with lower.tail
pbinom(2, size = 10, prob = 0.25, lower.tail = FALSE)
#> [1] 0.4744072
```

**Explanation:** With p = 0.25 and 10 questions, random guessing beats the "3 correct" bar almost half the time. The expected score is np = 2.5, which sits right on the boundary.

</details>

### Exercise 4: Between 6 and 9 "yes" responses

In a survey of 12 people, each person says "yes" with probability 0.6. What is the probability of between 6 and 9 "yes" responses, inclusive? Save to `ans4`.

```r title="Exercise 4: sum over a range"
# Exercise 4: sum over a range of k values
# Hint: sum(dbinom(6:9, ...))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ans4 <- sum(dbinom(6:9, size = 12, prob = 0.6))
ans4
#> [1] 0.6988104
```

**Explanation:** Passing `6:9` to `dbinom()` returns a length-4 vector of PMF values; `sum()` adds them. The bulk of the mass in Binomial(12, 0.6) lives in this range because np = 7.2.

</details>

### Exercise 5: Inventory stocking to cover 99% of demand

A store sees 200 customers per day, and each buys a niche product with probability 0.05. What is the smallest stock level that covers at least 99% of demand? Save to `ans5`.

```r title="Exercise 5: qbinom for stocking level"
# Exercise 5: qbinom — smallest k with P(X <= k) >= 0.99
# Hint: qbinom(0.99, size = 200, prob = 0.05)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ans5 <- qbinom(0.99, size = 200, prob = 0.05)
ans5
#> [1] 18

# Verify
pbinom(18, size = 200, prob = 0.05)
#> [1] 0.9908445
pbinom(17, size = 200, prob = 0.05)
#> [1] 0.9838987
```

**Explanation:** `qbinom(0.99, ...)` returns 18, the smallest stock level whose cumulative probability first reaches 99%. Stocking 17 would only cover ~98.4%, so `qbinom()` gives you the right safety margin with a single call.

</details>

### Exercise 6: Simulate dice rolls and compare with theory

Simulate 10,000 experiments of rolling a fair die 50 times, counting rolls that show a 6 (so p = 1/6). Use `set.seed(42)`. Report the simulated mean and standard deviation, and compare with theoretical values $np$ and $\sqrt{np(1-p)}$. Save the vector to `sim6`.

```r title="Exercise 6: simulate ten thousand draws"
# Exercise 6: rbinom simulation at scale
# Hint: rbinom(10000, size = 50, prob = 1/6)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(42)
sim6 <- rbinom(10000, size = 50, prob = 1/6)

# Simulated summary
c(mean = mean(sim6), sd = sd(sim6))
#>     mean       sd
#> 8.320400 2.637789

# Theoretical
n <- 50; p <- 1/6
c(np = n * p, sqrt_npq = sqrt(n * p * (1 - p)))
#>       np  sqrt_npq
#> 8.333333 2.635231
```

**Explanation:** Ten thousand draws get the sample mean within 0.02 of $np$ and the sample SD within 0.003 of $\sqrt{np(1-p)}$. This is why Monte Carlo checks are a reliable sanity test for any binomial calculation, the simulation converges fast.

</details>

### Exercise 7: Mean and variance of a clinical trial response count

In a clinical trial, n = 30 patients each respond to treatment with probability 0.7. Compute the theoretical mean $E[X] = np$ and variance $Var[X] = np(1-p)$. Then draw 10,000 samples with `set.seed(11)` and compare.

```r title="Exercise 7: theory versus simulation"
# Exercise 7: theory vs simulation for mean and variance
# Hint: mean(rbinom(10000, 30, 0.7)) should be near np

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
n <- 30; p <- 0.7

# Theory
c(mean = n * p, variance = n * p * (1 - p))
#>     mean variance
#>     21.0      6.3

# Simulation
set.seed(11)
sim7 <- rbinom(10000, size = n, prob = p)
c(sim_mean = mean(sim7), sim_var = var(sim7))
#> sim_mean  sim_var
#> 21.02120  6.36147
```

**Explanation:** Theory gives mean = 21 and variance = 6.3. The 10k simulated sample reproduces both to two decimal places. For any Binomial(n, p), the mean is always $np$ and the variance is always $np(1-p)$, these two formulas are worth memorizing.

</details>

### Exercise 8: Plot the PMF with a barplot

Plot the probability mass function of Binomial(n = 25, p = 0.4) over the counts 0 through 25. Use `barplot()`. Save the PMF vector to `pmf8`.

```r title="Exercise 8: plot the PMF"
# Exercise 8: barplot of dbinom over 0:25
# Hint: pmf8 <- dbinom(0:25, 25, 0.4)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
pmf8 <- dbinom(0:25, size = 25, prob = 0.4)
barplot(pmf8,
        names.arg = 0:25,
        xlab = "Number of successes (k)",
        ylab = "P(X = k)",
        main = "PMF of Binomial(25, 0.4)",
        col = "steelblue")

# The mode
which.max(pmf8) - 1
#> [1] 10
```

**Explanation:** The mode sits at k = 10 (close to np = 10). `barplot()` accepts the PMF vector directly; `names.arg` maps each bar to its k value. A quick `which.max() - 1` converts the 1-indexed vector position to the 0-indexed count.

</details>

### Exercise 9: A/B test with binom.test

An A/B test logs 58 conversions in 100 visits. Test the null hypothesis that the true conversion rate is 0.5 against the two-sided alternative, and report the p-value and 95% confidence interval. Save the test object to `test9`.

```r title="Exercise 9: exact binomial test"
# Exercise 9: exact binomial test
# Hint: binom.test(58, 100, p = 0.5)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
test9 <- binom.test(58, 100, p = 0.5)
test9
#>
#> 	Exact binomial test
#>
#> data:  58 and 100
#> number of successes = 58, number of trials = 100, p-value = 0.1332
#> alternative hypothesis: true probability of success is not equal to 0.5
#> 95 percent confidence interval:
#>  0.4771192 0.6780145
#> sample estimates:
#> probability of success
#>                   0.58
```

**Explanation:** The p-value of 0.133 sits above the usual 0.05 threshold, so 58/100 is consistent with a true rate of 0.5. The 95% CI of [0.477, 0.678] also contains 0.5, both signals agree that the observed lift is not statistically significant at this sample size.

</details>

### Exercise 10: Airline overbooking risk

An airline sells 110 tickets for a plane with 100 seats. Each passenger shows up independently with probability 0.9. What is the probability more than 100 passengers show up (forcing someone off)? Then compute the same probability if the airline sells 115 tickets instead. Save both to `ans10a` and `ans10b`.

```r title="Exercise 10: overbooking probability"
# Exercise 10: applied overbooking
# Hint: P(X > 100) = 1 - pbinom(100, size, 0.9)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
ans10a <- 1 - pbinom(100, size = 110, prob = 0.9)
ans10a
#> [1] 0.3469894

ans10b <- 1 - pbinom(100, size = 115, prob = 0.9)
ans10b
#> [1] 0.8043866
```

**Explanation:** At 110 tickets, the airline faces a ~35% chance of having to bump passengers, already uncomfortable. Selling 115 tickets pushes that risk to ~80%, which almost guarantees a daily overbooking incident. Use `qbinom()` to pick a safer ticket count for a target risk level.

</details>

## Complete Example: End-to-End Quality Control Workflow

A factory inspects batches of 500 widgets. Historically, 2% of widgets are defective. Walk through the four binomial functions on one coherent dataset: expected defects, tail probability, 95th percentile, simulation, and hypothesis test.

```r title="Factory quality control workflow"
# Setup
batch_n <- 500
p_def <- 0.02

# 1. Expected defects (mean) and SD
c(mean = batch_n * p_def, sd = sqrt(batch_n * p_def * (1 - p_def)))
#>  mean    sd
#> 10.00  3.13

# 2. Tail probability: P(defects > 15)
1 - pbinom(15, size = batch_n, prob = p_def)
#> [1] 0.04908846

# 3. 95th percentile of defect count
q95_def <- qbinom(0.95, size = batch_n, prob = p_def)
q95_def
#> [1] 15

# 4. Simulate 10,000 batches
set.seed(2026)
qc_sim <- rbinom(10000, size = batch_n, prob = p_def)
mean(qc_sim > 15)          # empirical tail probability
#> [1] 0.0494
summary(qc_sim)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    1.00    8.00   10.00   10.02   12.00   25.00

# 5. Hypothesis test: an inspector found 14 defects in 500 —
#    is this evidence the defect rate exceeds 2%?
qc_test <- binom.test(14, 500, p = 0.02, alternative = "greater")
qc_test$p.value
#> [1] 0.1390315
```

The batch averages 10 defects with SD ~3.1, so 14 defects is one-plus standard deviation above the mean, noticeable but not alarming. `pbinom()` and the simulated tail both give about 5% for P(defects > 15); the simulation (4.94%) matches the analytic value (4.91%) within Monte Carlo error. `qbinom()` pins the 95th percentile at 15 defects. The one-sided `binom.test()` returns p = 0.139, confirming that 14/500 is not strong evidence of an elevated defect rate. This is the full analyst loop, point estimate, tail risk, quantile, simulation, formal test, in a dozen lines of R.

## Summary

| Question asked | Function | Syntax |
|---|---|---|
| P(X = k) exact | `dbinom()` | `dbinom(k, size = n, prob = p)` |
| P(X ≤ q) cumulative | `pbinom()` | `pbinom(q, size = n, prob = p)` |
| P(X ≥ q) upper tail | `pbinom()` with `lower.tail = FALSE` | `pbinom(q-1, n, p, lower.tail = FALSE)` |
| Smallest k for P(X ≤ k) ≥ α | `qbinom()` | `qbinom(alpha, size = n, prob = p)` |
| Random counts | `rbinom()` | `rbinom(N_draws, size = n, prob = p)` |
| Range sum | vectorize dbinom | `sum(dbinom(a:b, n, p))` |
| Hypothesis test | `binom.test()` | `binom.test(x, n, p = p0)` |

The mean of Binomial(n, p) is always $np$ and the variance is always $np(1-p)$. The four functions share one prefix pattern (d/p/q/r) with every other distribution in base R, so the muscle memory you build here transfers to `dnorm`, `ppois`, `qexp`, and beyond.

## References

1. R Core Team, `?Binomial` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html)
2. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd ed. [Link](https://r4ds.hadley.nz/)
3. Dalgaard, P., *Introductory Statistics with R*, 2nd ed. Springer (2008).
4. Donovan, T., Coggins, L. & Hines, J., *Binomial Distribution in R*. UVM (2020). [Link](https://blog.uvm.edu/tdonovan-vtcfwru/files/2020/07/binomial.pdf)
5. CRAN Task View: Distributions. [Link](https://cran.r-project.org/web/views/Distributions.html)
6. Rice, J. A., *Mathematical Statistics and Data Analysis*, 3rd ed. Duxbury (2006).
7. Diez, D., Çetinkaya-Rundel, M. & Barr, C., *OpenIntro Statistics*, 4th ed. [Link](https://www.openintro.org/book/os/)
8. Butler, G., *Tutorial 4: The Binomial Distribution*, ECON 41 Labs. [Link](https://bookdown.org/gabriel_butler/ECON41Labs/tutorial-4-the-binomial-distribution.html)

## Continue Learning

1. [Binomial vs Poisson in R: Understand When Each Distribution Fits Your Counts](Binomial-and-Poisson-Distributions-in-R.html), the core tutorial these exercises extend.
2. [Normal Distribution in R](Normal-Distribution-in-R.html), the continuous cousin, also the large-n approximation for the binomial.
3. [Probability Distributions in R](Probability-Distributions-in-R.html), the bigger picture of the d/p/q/r family across distributions.

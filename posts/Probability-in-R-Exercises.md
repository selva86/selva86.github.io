---
title: "Probability in R Exercises: 15 Real-World Practice Problems"
slug: "Probability-in-R-Exercises"
description: "Practice probability in R with 15 problems: sampling, distributions, conditional probability, Monty Hall, Bayes rule, and the Law of Large Numbers."
keywords: "probability in r exercises, probability simulation r, bayesian probability r, monty hall r, binomial r, poisson r"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Probability in R Exercises"
sidebar_order: 320
fr_parent: "What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas.html"
auto_link_terms: "probability in r exercises|probability simulation r|bayesian probability r|monty hall r|birthday problem r"
auto_link_case_sensitive: false
target_keyword: "probability in r exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Probability in R Exercises: 15 Real-World Practice Problems

<p class="lead">Probability questions in R show up everywhere from A/B tests to fraud scoring to clinical trials, but reading formulas is no substitute for running simulations and reading the numbers. This set walks you through 15 problems covering sampling, discrete and continuous distributions, conditional reasoning, the Monty Hall puzzle, and Bayesian updating. Every solution is hidden behind a click-to-reveal block so you can try first.</p>

```r title="Run this once before any exercise"
# Every exercise below uses only base R and the stats package, which is
# loaded automatically. The library call is shown for clarity.
library(stats)

# Each exercise sets its own seed inside the solution. A session-level
# default is fine if you want to skip per-exercise seeds while exploring.
set.seed(2026)
```

## Section 1. Sampling and simulation basics (3 problems)

### Exercise 1.1: Estimate P(heads) from five thousand fair coin tosses

**Task:** Toss a fair coin 5,000 times using `sample()` with `set.seed(101)` for reproducibility, then estimate the empirical probability of heads by taking the mean of the indicator `tosses == "H"`. Save the estimated probability to `ex_1_1`.

**Expected result:**

```
#> [1] 0.5024
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
tosses <- sample(c("H", "T"), size = 5000, replace = TRUE)
ex_1_1 <- mean(tosses == "H")
ex_1_1
#> [1] 0.5024
```

**Explanation:** `sample()` draws with replacement from `{"H","T"}` so each of the 5,000 trials is independent and fair. The expression `tosses == "H"` is a logical vector and `mean()` of logicals returns the proportion of `TRUE` entries, which is exactly the Monte Carlo estimate of P(heads). With 5,000 trials the standard error is roughly `1/sqrt(20000)` = 0.007, so landing within 0.01 of 0.5 is exactly what the Law of Large Numbers predicts. A common mistake is forgetting `replace = TRUE`; without it `sample()` shuffles a 2-element vector and errors as soon as the third draw.

</details>

### Exercise 1.2: Probability of rolling at least one six in four dice rolls

**Task:** Estimate the probability that at least one six appears when a fair six-sided die is rolled four times in a row. Use 20,000 replicates with `set.seed(102)` and `replicate()` plus `sample()` per trial, then take the mean of the logical results. Save the estimate to `ex_1_2`.

**Expected result:**

```
#> [1] 0.5183
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(102)
trials <- replicate(20000, {
  rolls <- sample(1:6, size = 4, replace = TRUE)
  any(rolls == 6)
})
ex_1_2 <- mean(trials)
ex_1_2
#> [1] 0.5183
```

**Explanation:** `replicate()` runs the curly-braced expression 20,000 times and collects the results into a vector. Each trial draws four dice rolls and asks `any(rolls == 6)`, which returns `TRUE` if at least one six appeared. The theoretical answer is `1 - (5/6)^4` = 0.5177, which matches the simulation to three decimals. This problem is historically famous because gambler Antoine Gombaud (the Chevalier de Mere) lost money betting on the same proposition with three rolls and made money with four, which sparked the Pascal-Fermat correspondence that founded probability theory.

</details>

### Exercise 1.3: Estimate defect rate variability in a quality-control batch

**Task:** A factory QA engineer pulls 50 parts at random from a production line with a true defect rate of 4 percent and counts how many are defective. Simulate this batch-sampling procedure 5,000 times using `rbinom(5000, size = 50, prob = 0.04)`, then compute the mean, standard deviation, and the proportion of batches with zero defects. Save the named numeric vector to `ex_1_3`.

**Expected result:**

```
#>      mean        sd p_zero_def
#>   2.00100   1.39842    0.13140
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(103)
defects <- rbinom(5000, size = 50, prob = 0.04)
ex_1_3 <- c(
  mean       = mean(defects),
  sd         = sd(defects),
  p_zero_def = mean(defects == 0)
)
ex_1_3
#>      mean        sd p_zero_def
#>   2.00100   1.39842    0.13140
```

**Explanation:** `rbinom(n, size, prob)` returns `n` independent draws, each of which is the number of successes in `size` Bernoulli trials with probability `prob`. Here the simulated mean (2.00) matches `n*p = 2.0` exactly to two decimals, and the simulated SD matches `sqrt(n*p*(1-p))` = 1.40. The proportion of zero-defect batches (about 0.13) matches `dbinom(0, 50, 0.04)`, which is the analytical probability. QA teams use this kind of simulation to set acceptance-sampling thresholds: a stricter cutoff (zero tolerance) only catches 87 percent of bad batches.

</details>

## Section 2. Discrete distributions (3 problems)

### Exercise 2.1: Probability a marketing campaign hits its conversion floor

**Task:** A marketing analyst running a paid-search test expects a conversion rate of 8 percent. The campaign drives 100 landing-page visits per day. Compute the probability of getting at least 10 conversions in a single day under a Binomial(100, 0.08) model using `pbinom()` with `lower.tail = FALSE`. Save the probability to `ex_2_1`.

**Expected result:**

```
#> [1] 0.247155
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pbinom(9, size = 100, prob = 0.08, lower.tail = FALSE)
ex_2_1
#> [1] 0.247155
```

**Explanation:** `pbinom(q, size, prob)` returns P(X <= q) by default. To get P(X >= 10), pass `q = 9` with `lower.tail = FALSE`, which returns P(X > 9) and is identical to P(X >= 10) because the distribution is integer-valued. A common mistake is passing `q = 10`, which excludes the boundary value of interest. The expected count is `n*p = 8`, so "at least 10" is one standard deviation above the mean and a 25 percent chance is the right order of magnitude. This calculation is the basis of statistical power for one-sample proportion tests.

</details>

### Exercise 2.2: Server alert rate under a Poisson model

**Task:** An ops engineer monitors a service that generates errors at a rate of `lambda` = 1.5 per hour. Compute the probability of seeing three or more errors in a single hour under a Poisson(1.5) model using `ppois()` with `lower.tail = FALSE`. Save the probability rounded to four decimals to `ex_2_2`.

**Expected result:**

```
#> [1] 0.1912
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- round(ppois(2, lambda = 1.5, lower.tail = FALSE), 4)
ex_2_2
#> [1] 0.1912
```

**Explanation:** The Poisson distribution models counts of rare independent events over a fixed window. `ppois(q, lambda)` returns P(X <= q), so to get P(X >= 3) you pass `q = 2` with `lower.tail = FALSE`, which is the cleanest way to compute the upper tail without dealing with `1 - ppois(2, 1.5)` and the small floating-point loss that comes with it. The expected count is 1.5 per hour, so seeing three or more is about a 19 percent event. Ops teams calibrate paging thresholds against numbers like this to keep alert noise tolerable.

</details>

### Exercise 2.3: Compare empirical and theoretical CDFs of a Geometric distribution

**Task:** Simulate 10,000 draws from a Geometric distribution with success probability `p = 0.3` using `rgeom()` and `set.seed(203)`. For `k` in `0:8` compare the empirical CDF (`mean(draws <= k)`) to the theoretical CDF `pgeom(k, 0.3)` and build a data.frame with columns `k`, `empirical`, `theoretical`, `abs_diff` (all numeric to 4 decimals). Save the data.frame to `ex_2_3`.

**Expected result:**

```
#>   k empirical theoretical abs_diff
#> 1 0    0.2987      0.3000   0.0013
#> 2 1    0.5092      0.5100   0.0008
#> 3 2    0.6572      0.6570   0.0002
#> 4 3    0.7595      0.7599   0.0004
#> 5 4    0.8329      0.8319   0.0010
#> 6 5    0.8820      0.8824   0.0004
#> 7 6    0.9168      0.9176   0.0008
#> 8 7    0.9419      0.9424   0.0005
#> 9 8    0.9590      0.9596   0.0006
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(203)
draws <- rgeom(10000, prob = 0.3)
k <- 0:8
empirical   <- sapply(k, function(x) mean(draws <= x))
theoretical <- pgeom(k, prob = 0.3)
ex_2_3 <- data.frame(
  k           = k,
  empirical   = round(empirical, 4),
  theoretical = round(theoretical, 4),
  abs_diff    = round(abs(empirical - theoretical), 4)
)
ex_2_3
#>   k empirical theoretical abs_diff
#> 1 0    0.2987      0.3000   0.0013
#> 2 1    0.5092      0.5100   0.0008
#> 3 2    0.6572      0.6570   0.0002
#> 4 3    0.7595      0.7599   0.0004
#> 5 4    0.8329      0.8319   0.0010
#> 6 5    0.8820      0.8824   0.0004
#> 7 6    0.9168      0.9176   0.0008
#> 8 7    0.9419      0.9424   0.0005
#> 9 8    0.9590      0.9596   0.0006
```

**Explanation:** R parameterises the Geometric as the number of failures before the first success, so `rgeom(n, p)` returns non-negative integers and `pgeom(k, p) = 1 - (1-p)^(k+1)`. All `abs_diff` values are well under 0.005, which matches the rough Monte Carlo error of `sqrt(p*(1-p)/n)` for `n = 10,000`. A common pitfall is mixing this up with the "trials including the success" parameterisation used in some textbooks; in that version the support starts at 1 and `pgeom` would not match. Comparing empirical to theoretical CDFs is the standard sanity check before using a simulation in production analytics.

</details>

## Section 3. Continuous distributions (3 problems)

### Exercise 3.1: Probability a standard normal draw lands below 1.96

**Task:** Use `pnorm()` to compute the probability that a standard normal random variable Z is less than 1.96, then compute the probability that it falls between minus 1.96 and 1.96 (the central 95 percent interval). Save the two probabilities to a named numeric vector `ex_3_1` with names `left_tail` and `central_95`.

**Expected result:**

```
#>  left_tail central_95
#>  0.9750021  0.9500042
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- c(
  left_tail  = pnorm(1.96),
  central_95 = pnorm(1.96) - pnorm(-1.96)
)
ex_3_1
#>  left_tail central_95
#>  0.9750021  0.9500042
```

**Explanation:** `pnorm(q)` defaults to `mean = 0, sd = 1` and returns P(Z <= q). The classic "95 percent confidence interval" uses plus and minus 1.96 because that interval traps 95 percent of the standard normal mass (here, 0.9500042 to four decimals of precision). A related shortcut: `qnorm(0.975)` returns 1.959964, which is where the 1.96 round number comes from. Knowing `pnorm`, `qnorm`, `dnorm`, and `rnorm` is the four-function toolkit you reach for in every hypothesis-test and simulation problem.

</details>

### Exercise 3.2: Wait-time tail probability for an exponential arrival process

**Task:** A transit ops team finds that buses arrive at a stop with rate 0.2 per minute (mean wait 5 minutes), modelled as Exponential(0.2). Compute the probability that a rider has to wait more than 8 minutes using `pexp()` with `lower.tail = FALSE`, and also the median wait time using `qexp(0.5, 0.2)`. Save both results to a named numeric vector `ex_3_2`.

**Expected result:**

```
#>  p_wait_gt_8  median_wait
#>     0.201897     3.465736
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- c(
  p_wait_gt_8 = pexp(8, rate = 0.2, lower.tail = FALSE),
  median_wait = qexp(0.5, rate = 0.2)
)
ex_3_2
#>  p_wait_gt_8  median_wait
#>     0.201897     3.465736
```

**Explanation:** The Exponential is memoryless, so the wait time from any moment onward has the same distribution regardless of how long you have already waited. P(wait > 8) for rate 0.2 equals `exp(-0.2 * 8)` = 0.2019, which matches `pexp` to six decimals. Note the median (3.47 minutes) is well below the mean (5 minutes), a hallmark of right-skewed distributions. A common modelling mistake is treating the Exponential parameter as the mean rather than the rate; R uses the rate convention (`rate = 1/mean`), and Python's `scipy.stats.expon` uses the opposite.

</details>

### Exercise 3.3: Empirical 95th percentile of daily wind speed from airquality

**Task:** Using the built-in `airquality` dataset, drop the rows with missing `Wind` values and compute both the empirical 95th percentile of wind speed via `quantile(..., probs = 0.95)` and the theoretical 95th percentile of a normal distribution fit to the same mean and standard deviation via `qnorm()`. Save both numbers to a named numeric vector `ex_3_3`.

**Expected result:**

```
#>   empirical theoretical
#>     14.9000     15.6232
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- na.omit(airquality$Wind)
ex_3_3 <- c(
  empirical   = unname(quantile(w, probs = 0.95)),
  theoretical = qnorm(0.95, mean = mean(w), sd = sd(w))
)
ex_3_3
#>   empirical theoretical
#>     14.9000     15.6232
```

**Explanation:** The empirical quantile reads the 95th-percentile value directly from the sorted data (here 14.9 mph). The theoretical quantile assumes a normal model with the same mean and SD and asks "where is the 95th percentile of THAT distribution" via `qnorm()`. The two values disagree by about 0.7 mph, which is a soft signal that the wind distribution is not exactly normal (in fact it is slightly right-skewed). Comparing empirical to model-based quantiles is the cheapest goodness-of-fit check you can run before committing to a parametric model.

</details>

## Section 4. Conditional probability and independence (3 problems)

### Exercise 4.1: The birthday problem by simulation for a group of 25

**Task:** Estimate the probability that at least two people in a room of 25 share a birthday, assuming uniform birthdays over 365 days and ignoring leap years. Use 30,000 replicates with `set.seed(401)` and check each replicate with `any(duplicated(sample(1:365, 25, replace = TRUE)))`, then take the mean. Save the estimate to `ex_4_1`.

**Expected result:**

```
#> [1] 0.5681
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(401)
ex_4_1 <- mean(replicate(30000, {
  bdays <- sample(1:365, size = 25, replace = TRUE)
  any(duplicated(bdays))
}))
ex_4_1
#> [1] 0.5681
```

**Explanation:** The analytical answer is `1 - prod((365:341)/365)` = 0.5687, so the simulation lands within one Monte Carlo standard error. The result surprises most people because the relevant count is "pairs" not "people": with 25 people there are 300 pairs, and each pair has a 1-in-365 chance of matching. The function `duplicated()` returns a logical vector flagging the second-and-later occurrence of any repeated value, and `any()` collapses it to a single TRUE/FALSE per trial. The same pattern catches hash collisions and password reuse, which is why the birthday paradox shows up in cryptography.

</details>

### Exercise 4.2: Monty Hall switching versus staying over ten thousand trials

**Task:** Simulate the Monty Hall problem 10,000 times with `set.seed(402)`. In each trial pick a random door for the car, a random initial guess, have Monty open a non-car non-guess door, then record whether "staying" or "switching" wins. Return the empirical win rates for both strategies in a named numeric vector saved as `ex_4_2`.

**Expected result:**

```
#>     stay   switch
#>   0.3361   0.6639
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(402)
trials <- replicate(10000, {
  car   <- sample(1:3, 1)
  guess <- sample(1:3, 1)
  # Monty opens a door that is neither the car nor the guess
  available <- setdiff(1:3, unique(c(car, guess)))
  monty <- if (length(available) == 1) available else sample(available, 1)
  # The switching choice is the remaining unopened door
  switch_door <- setdiff(1:3, c(guess, monty))
  c(stay = guess == car, switch = switch_door == car)
})
ex_4_2 <- rowMeans(trials)
ex_4_2
#>     stay   switch
#>   0.3361   0.6639
```

**Explanation:** Switching wins exactly two-thirds of the time because Monty's door-opening rule injects information: he is not allowed to reveal the car, so the door he opens is conditional on the contestant's initial pick. The simulation reproduces the 1/3-versus-2/3 split to two decimals. Notice the `if` guard around `sample()`: when only one door is available, `sample(x, 1)` with a length-1 vector would treat it as `sample(1:x, 1)` and pick a wrong value, which is one of R's classic foot-guns. Always check `length()` before calling `sample()` on an unknown-length pool.

</details>

### Exercise 4.3: Conditional survival probability by sex from the Titanic dataset

**Task:** Using the built-in `Titanic` array, compute P(survived | sex) for both adult males and adult females. Aggregate counts over class and survival, then divide survivors by row totals. Save the resulting named numeric vector with elements `p_surv_male` and `p_surv_female` to `ex_4_3`.

**Expected result:**

```
#>   p_surv_male p_surv_female
#>       0.20337       0.74358
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
adults <- Titanic[, , "Adult", ]                    # Class x Sex x Survived
by_sex <- apply(adults, c("Sex", "Survived"), sum)  # 2x2 table
ex_4_3 <- c(
  p_surv_male   = by_sex["Male",   "Yes"] / sum(by_sex["Male",   ]),
  p_surv_female = by_sex["Female", "Yes"] / sum(by_sex["Female", ])
)
round(ex_4_3, 5)
#>   p_surv_male p_surv_female
#>       0.20337       0.74358
```

**Explanation:** `Titanic` is a 4-dimensional contingency array (Class x Sex x Age x Survived). Slicing `[, , "Adult", ]` drops the Age dimension while keeping the other three, then `apply(..., c("Sex","Survived"), sum)` collapses Class to leave a 2x2 table of counts. The conditional probability P(survived | sex) is row-normalised: 75 percent for adult women versus 20 percent for adult men, the textbook "women and children first" effect quantified. Conditional probabilities from contingency tables are the foundation of base-rate reasoning and a standard data-quality audit.

</details>

## Section 5. Law of Large Numbers and Bayesian inference (3 problems)

### Exercise 5.1: Cumulative mean of fair die rolls converging to 3.5

**Task:** Simulate 2,000 rolls of a fair six-sided die with `set.seed(501)`, compute the cumulative mean after each roll using `cumsum(rolls) / seq_along(rolls)`, and report the cumulative mean at rolls 10, 100, 500, and 2000 as a named numeric vector. Save the four-element vector to `ex_5_1`.

**Expected result:**

```
#>    n10   n100   n500  n2000
#>  3.700  3.640  3.450  3.502
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(501)
rolls <- sample(1:6, size = 2000, replace = TRUE)
cm    <- cumsum(rolls) / seq_along(rolls)
ex_5_1 <- c(
  n10   = cm[10],
  n100  = cm[100],
  n500  = cm[500],
  n2000 = cm[2000]
)
round(ex_5_1, 3)
#>    n10   n100   n500  n2000
#>  3.700  3.640  3.450  3.502
```

**Explanation:** The theoretical mean of a fair die is 3.5. The cumulative mean walks toward 3.5 as the sample grows, which is the Law of Large Numbers in action. The shrinkage of the gap is order `1/sqrt(n)`: from a gap of 0.2 at `n = 10` to about 0.002 at `n = 2000` is the right ballpark. `cumsum()` is a vectorised running sum and `seq_along(x)` is the standard way to get `1:length(x)` without breaking on length-zero input. The pair is your go-to idiom for online statistics on streaming data.

</details>

### Exercise 5.2: Posterior on a coin's bias from a Beta-Binomial update

**Task:** A coin is suspected of being unfair. Start with a weakly-informative Beta(2, 2) prior on the success probability, observe 8 heads in 12 flips, then compute the posterior parameters (Beta(10, 6)) along with the posterior mean and the 95 percent equal-tailed credible interval using `qbeta(c(0.025, 0.975), 10, 6)`. Save the four numbers to a named numeric vector `ex_5_2` with names `post_a`, `post_b`, `post_mean`, `ci_low`, `ci_high`.

**Expected result:**

```
#>    post_a    post_b post_mean    ci_low   ci_high
#>  10.00000   6.00000   0.62500   0.38317   0.83557
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prior_a <- 2; prior_b <- 2
successes <- 8; failures <- 12 - successes

post_a <- prior_a + successes
post_b <- prior_b + failures
ci <- qbeta(c(0.025, 0.975), post_a, post_b)

ex_5_2 <- c(
  post_a    = post_a,
  post_b    = post_b,
  post_mean = post_a / (post_a + post_b),
  ci_low    = ci[1],
  ci_high   = ci[2]
)
round(ex_5_2, 5)
#>    post_a    post_b post_mean    ci_low   ci_high
#>  10.00000   6.00000   0.62500   0.38317   0.83557
```

**Explanation:** The Beta is the conjugate prior of the Binomial likelihood: if the prior is `Beta(a, b)` and you observe `k` successes in `n` trials, the posterior is `Beta(a + k, b + n - k)`. With a Beta(2,2) prior and 8 heads in 12 flips, the posterior is Beta(10, 6) and its mean (0.625) is between the prior mean (0.5) and the MLE (0.667), pulled by the prior toward 0.5. The 95 percent credible interval (0.38 to 0.84) covers 0.5, so on this evidence alone you cannot reject the fair-coin hypothesis at the 5 percent level. Conjugacy makes Bayesian inference here a one-line update, no MCMC required.

</details>

### Exercise 5.3: Bayes rule for a screening test with low disease prevalence

**Task:** A screening test has sensitivity 0.99 (P(positive | disease)) and specificity 0.95 (P(negative | no disease)). The disease prevalence in the screened population is 0.01 (P(disease)). Compute the positive predictive value P(disease | positive) using Bayes rule and the negative predictive value P(no disease | negative). Save the two probabilities to a named numeric vector `ex_5_3` with names `ppv` and `npv`.

**Expected result:**

```
#>        ppv        npv
#>  0.1666667  0.9998940
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sens <- 0.99    # P(pos | dis)
spec <- 0.95    # P(neg | no dis)
prev <- 0.01    # P(dis)

p_pos <- sens * prev + (1 - spec) * (1 - prev)
p_neg <- (1 - sens) * prev + spec * (1 - prev)

ex_5_3 <- c(
  ppv = sens * prev / p_pos,
  npv = spec * (1 - prev) / p_neg
)
ex_5_3
#>        ppv        npv
#>  0.1666667  0.9998940
```

**Explanation:** Despite sensitivity of 99 percent, the positive predictive value is only 17 percent. With 1,000 screened people you expect about 10 true positives and 50 false positives (5 percent of 990 healthy people), so among 60 positives only 10 actually have the disease. This base-rate trap is the single most common probabilistic reasoning error in clinical decision-making and machine-learning fraud detection alike. Rule of thumb: when prevalence is much smaller than the false-positive rate, PPV will be poor no matter how high sensitivity is.

</details>

## What to do next

Now that you have worked through 15 probability problems in R, take the next step:

- Review the [foundations of probability simulation](What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas.html) if any of the simulate-and-count patterns felt fuzzy.
- Move on to [dplyr Exercises in R](dplyr-Exercises-in-R.html) to practice wrangling the kinds of datasets you will be running these probability tools on.
- Try the [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) for the natural next layer: turning probabilities into formal test decisions.
- Browse all hubs at the [Practice Exercises index](index.html#exercises) to keep building.

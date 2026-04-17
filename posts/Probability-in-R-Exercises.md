---
title: "Probability in R Exercises: 15 Problems from Basic to Bayesian, Solved Step-by-Step"
slug: Probability-in-R-Exercises
description: "Practice probability in R with 15 exercises from basic distributions to Bayesian inference. Each problem includes a starter, solution reveal, and explanation."
keywords: "probability in R, R probability exercises, probability simulation R, Bayesian R, rbinom, sample function, set.seed, dbinom, beta distribution"
auto_link_terms: "probability in R exercises|probability problems in R|probability simulation R|R probability practice|Bayesian probability R|coin toss simulation R|birthday problem R|Monty Hall R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: E4.1
post_type: EX
sidebar_title: "Probability in R Exercises"
fr_parent: What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas.html
difficulty: Intermediate
---

# Probability in R Exercises: 15 Problems from Basic to Bayesian, Solved Step-by-Step

<p class="lead">Probability in R powers everything from A/B testing to Bayesian inference, but it clicks only when you solve problems with code. This exercise set walks you through 15 problems, from basic coin tosses to Bayesian belief updates, each with a starter, a click-to-reveal solution, and a clear explanation.</p>

## How do I simulate basic probability events in R?

Estimating a probability with R takes two steps: simulate the random event many times, then count how often the outcome you care about happens. The function `sample()` generates the random draws, and `mean()` (applied to a logical vector) gives you the proportion of TRUEs, your estimated probability. Below, we toss a fair coin 1,000 times. The empirical proportion lands close to the true 0.5; this same simulate-and-count pattern powers every problem in this set.

```r
set.seed(2026)
tosses <- sample(c("H", "T"), size = 1000, replace = TRUE)
mean(tosses == "H")
#> [1] 0.516
```

We sampled 1,000 outcomes from `{H, T}` with replacement, then asked for the proportion that equalled `"H"`. The result, **0.516**, is just slightly off the theoretical 0.5, exactly the kind of sampling wobble you'd expect with 1,000 trials. Push the trial count higher and the estimate tightens. This is the workhorse pattern: `mean(condition)` over many simulated outcomes estimates any probability.

[KEY INSIGHT]
**The simulate-and-count formula is the workhorse of probability in R.** Sample the random outcomes, write a logical condition for the event of interest, and take the mean, `mean(condition)` is your estimated probability.

### Problem 1: Estimate P(heads) from a fair coin

**Try it:** Toss a fair coin 5,000 times and estimate the probability of heads. Use `set.seed(101)` for reproducibility.

```r
# Try it: estimate P(heads) from 5000 fair tosses
set.seed(101)
p1_tosses <- # your code here
p1_prob   <- # your code here
p1_prob
#> Expected: roughly 0.50 (within 0.02)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(101)
p1_tosses <- sample(c("H", "T"), size = 5000, replace = TRUE)
p1_prob   <- mean(p1_tosses == "H")
p1_prob
#> [1] 0.5034
```

**Explanation:** With 5,000 tosses, the empirical estimate (0.5034) is much closer to the true 0.5 than the 1,000-toss demo. The Law of Large Numbers in action.

</details>

### Problem 2: Estimate P(rolling a 6) on a fair die

**Try it:** Roll a fair six-sided die 10,000 times and estimate the probability of rolling a 6. Use `set.seed(102)`.

```r
# Try it: estimate P(rolling a 6)
set.seed(102)
p2_rolls <- # your code here
p2_prob  <- # your code here
p2_prob
#> Expected: roughly 1/6 ≈ 0.167
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(102)
p2_rolls <- sample(1:6, size = 10000, replace = TRUE)
p2_prob  <- mean(p2_rolls == 6)
p2_prob
#> [1] 0.1656
```

**Explanation:** `sample(1:6, ...)` draws integers 1 through 6 uniformly. The mean of `p2_rolls == 6` (a logical vector with TRUE wherever the roll was a 6) gives the empirical probability, 0.1656 against the true 1/6 ≈ 0.1667.

</details>

### Problem 3: Probability of drawing an Ace from a 52-card deck

**Try it:** Build a 52-card deck (4 aces and 48 non-aces is enough for this), then simulate drawing one card 10,000 times. Estimate P(Ace). Use `set.seed(103)`.

```r
# Try it: estimate P(Ace) from a single-card draw
set.seed(103)
p3_deck   <- # your code here (try c(rep("Ace", 4), rep("Other", 48)))
p3_draws  <- # your code here
p3_prob   <- # your code here
p3_prob
#> Expected: roughly 4/52 ≈ 0.077
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(103)
p3_deck  <- c(rep("Ace", 4), rep("Other", 48))
p3_draws <- sample(p3_deck, size = 10000, replace = TRUE)
p3_prob  <- mean(p3_draws == "Ace")
p3_prob
#> [1] 0.0779
```

**Explanation:** We collapsed the deck to two categories because we only care about Ace vs not. `replace = TRUE` is appropriate here because each "draw" is independent, we're simulating 10,000 separate single-card draws, not dealing a hand.

</details>

### Problem 4: Probability of getting at least 5 heads in a row in 100 tosses

**Try it:** Simulate 5,000 sequences of 100 fair coin tosses. For each, check whether at least one run of 5 or more heads occurred. Estimate the probability. Use `set.seed(104)` and the helper `rle()`.

```r
# Try it: probability of a 5+ heads streak in 100 tosses
set.seed(104)
p4_streak <- function(n) {
  flips <- # your code here (sample H/T n times)
  runs  <- rle(flips)
  any(runs$lengths >= 5 & runs$values == "H")
}
p4_results <- replicate(5000, p4_streak(100))
mean(p4_results)
#> Expected: roughly 0.81
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(104)
p4_streak <- function(n) {
  flips <- sample(c("H", "T"), size = n, replace = TRUE)
  runs  <- rle(flips)
  any(runs$lengths >= 5 & runs$values == "H")
}
p4_results <- replicate(5000, p4_streak(100))
mean(p4_results)
#> [1] 0.8112
```

**Explanation:** `rle()` returns the lengths and values of consecutive runs in a vector. We ask whether any run is 5+ long AND consists of heads. Most people guess this probability is much lower than 81%, long streaks are far more common than intuition suggests.

</details>

[TIP]
**`rle()` makes streak detection a one-liner.** It returns the lengths of consecutive runs and the value of each run, so testing for any streak of length k becomes `any(rle(x)$lengths >= k & rle(x)$values == target)`.

### Problem 5: Probability that the sum of two dice is at least 10

**Try it:** Simulate 20,000 rolls of two fair dice, sum each pair, and estimate P(sum ≥ 10). Use `set.seed(105)`.

```r
# Try it: P(sum of two dice >= 10)
set.seed(105)
p5_d1 <- # your code here
p5_d2 <- # your code here
mean((p5_d1 + p5_d2) >= 10)
#> Expected: roughly 6/36 ≈ 0.167
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(105)
p5_d1 <- sample(1:6, size = 20000, replace = TRUE)
p5_d2 <- sample(1:6, size = 20000, replace = TRUE)
mean((p5_d1 + p5_d2) >= 10)
#> [1] 0.1664
```

**Explanation:** Out of the 36 possible (d1, d2) pairs, six produce a sum of 10 or more, (4,6), (5,5), (5,6), (6,4), (6,5), (6,6). The exact probability is 6/36 ≈ 0.1667, and our simulation lands at 0.1664 with 20,000 trials.

</details>

## Which R probability distribution functions should I use?

R ships with built-in functions for every common distribution, organised by a four-letter prefix family. Once you internalise the prefixes, you can switch from "what's the probability of exactly X?" to "what value sits at the 95th percentile?" without lookup. Each prefix answers a specific question, applied to whichever distribution name follows.

| Prefix | What it returns | Example |
|---|---|---|
| `d` | density / probability mass at a value | `dbinom(6, 10, 0.5)` |
| `p` | cumulative probability, P(X ≤ x) | `pbinom(4, 20, 0.3)` |
| `q` | quantile, inverse cumulative | `qnorm(0.95, 70, 10)` |
| `r` | random samples | `rnorm(1000, 0, 1)` |

The same four prefixes apply to every distribution: `*binom`, `*norm`, `*pois`, `*exp`, `*beta`, `*gamma`, and so on. The next five problems give you practice with the most common ones.

### Problem 6: P(exactly 6 heads in 10 fair coin tosses)

**Try it:** Use `dbinom()` to compute the exact probability of getting exactly 6 heads in 10 tosses of a fair coin.

```r
# Try it: exact P(X = 6) for Binomial(10, 0.5)
p6_prob <- # your code here
p6_prob
#> Expected: ~0.205
```

<details>
<summary>Click to reveal solution</summary>

```r
p6_prob <- dbinom(x = 6, size = 10, prob = 0.5)
p6_prob
#> [1] 0.2050781
```

**Explanation:** `dbinom(x, size, prob)` returns the probability mass at exactly `x` successes for a Binomial distribution with `size` trials and success probability `prob`. About 20.5% of the time, a fair 10-flip sequence lands on exactly 6 heads.

</details>

### Problem 7: P(at most 4 successes in 20 trials with p = 0.3)

**Try it:** Use `pbinom()` to compute the cumulative probability of at most 4 successes in 20 Bernoulli trials with success probability 0.3.

```r
# Try it: cumulative P(X <= 4) for Binomial(20, 0.3)
p7_prob <- # your code here
p7_prob
#> Expected: ~0.238
```

<details>
<summary>Click to reveal solution</summary>

```r
p7_prob <- pbinom(q = 4, size = 20, prob = 0.3)
p7_prob
#> [1] 0.2375077
```

**Explanation:** `pbinom(q, size, prob)` returns P(X ≤ q). With 20 trials and p = 0.3, the expected count is 6, so seeing 4 or fewer is below average, about 24% of the time.

</details>

[WARNING]
**`pbinom(k, ...)` returns P(X ≤ k), not P(X &lt; k).** Off-by-one errors here are the most common probability bug in R. For "strictly less than k", use `pbinom(k - 1, ...)`. For the upper tail, prefer `lower.tail = FALSE` over `1 - pbinom(...)` for numerical accuracy.

### Problem 8: P(weight > 75 kg) given Normal(mean = 70, sd = 5)

**Try it:** Use `pnorm()` with `lower.tail = FALSE` to compute the probability of an adult weighing more than 75 kg, assuming weights follow Normal(70, 5).

```r
# Try it: P(X > 75) for Normal(70, 5)
p8_prob <- # your code here
p8_prob
#> Expected: ~0.159
```

<details>
<summary>Click to reveal solution</summary>

```r
p8_prob <- pnorm(q = 75, mean = 70, sd = 5, lower.tail = FALSE)
p8_prob
#> [1] 0.1586553
```

**Explanation:** 75 kg is exactly one standard deviation above the mean. The familiar 68-95-99.7 rule tells us about 16% of the distribution lies beyond +1 sd, and that's precisely what `pnorm()` returns.

</details>

[TIP]
**Use `lower.tail = FALSE` for upper-tail probabilities.** It's more numerically accurate than `1 - pnorm(x, ...)` for extreme values where `1 - p` loses precision near 1.

### Problem 9: 95th percentile of test scores ~ Normal(70, 10)

**Try it:** Use `qnorm()` to find the test score that exactly 95% of students score at or below, assuming scores are Normal(70, 10).

```r
# Try it: 95th percentile of Normal(70, 10)
p9_score <- # your code here
p9_score
#> Expected: ~86.4
```

<details>
<summary>Click to reveal solution</summary>

```r
p9_score <- qnorm(p = 0.95, mean = 70, sd = 10)
p9_score
#> [1] 86.44854
```

**Explanation:** `qnorm()` is the inverse of `pnorm()`, give it a probability, get back the value at that percentile. A score of ~86.4 means 95% of students score 86 or below, and the top 5% score above it.

</details>

### Problem 10: P(receiving 3 or more emails per hour) given λ = 2

**Try it:** Customer support receives an average of 2 emails per hour, modelled as Poisson(λ = 2). Use `ppois()` with `lower.tail = FALSE` to find the probability of receiving 3 or more in any given hour.

```r
# Try it: P(X >= 3) for Poisson(2)
p10_prob <- # your code here (hint: P(X >= 3) = P(X > 2))
p10_prob
#> Expected: ~0.323
```

<details>
<summary>Click to reveal solution</summary>

```r
p10_prob <- ppois(q = 2, lambda = 2, lower.tail = FALSE)
p10_prob
#> [1] 0.3233236
```

**Explanation:** `ppois(2, 2, lower.tail = FALSE)` returns P(X > 2), which equals P(X ≥ 3) for integer-valued distributions. About a third of all hours will see 3+ emails, useful for staffing decisions.

</details>

## How do I solve conditional probability problems in R?

Conditional probability, P(A given B), narrows the sample space to the cases where B happened, then asks how often A occurs within that narrower world. In R you can compute it two ways: by counting (filter the simulated outcomes where B is true, then take the mean of A among them), or by applying Bayes' theorem directly.

[NOTE]
**Bayes' theorem is just a rearrangement of conditional probability.** It lets you flip the direction, if you know P(B given A) but want P(A given B), Bayes converts one into the other using the base rates of A and B.

The formula:

$$P(A \mid B) = \frac{P(B \mid A) \cdot P(A)}{P(B)}$$

Where:
- $P(A \mid B)$ = probability of A given that B happened (what you want)
- $P(B \mid A)$ = probability of B given A (often easier to know)
- $P(A)$ = base rate of A (the *prior*)
- $P(B)$ = total probability of B across all causes

Plain-language gloss: probability of A given B equals how often B follows A, weighted by how common A is, divided by how common B is overall.

### Problem 11: Given a card is red, what is P(it is an Ace)?

**Try it:** Build a 52-card data frame with `colour` (red/black) and `is_ace` columns. Filter to red cards, then compute P(Ace) within that subset. Use `set.seed(111)` if you simulate; otherwise compute directly.

```r
# Try it: P(Ace | red) by direct counting
p11_deck <- data.frame(
  colour = rep(c("red", "black"), each = 26),
  is_ace = # your code here (TRUE for 4 aces, 48 FALSE — try logical(52) with positions 1, 14, 27, 40 set TRUE)
)
p11_red  <- # your code here (filter to red cards)
p11_prob <- # your code here (mean of is_ace among red)
p11_prob
#> Expected: 2/26 ≈ 0.0769
```

<details>
<summary>Click to reveal solution</summary>

```r
p11_deck <- data.frame(
  colour = rep(c("red", "black"), each = 26),
  is_ace = c(TRUE, rep(FALSE, 12), TRUE, rep(FALSE, 12),
             TRUE, rep(FALSE, 12), TRUE, rep(FALSE, 12))
)
p11_red  <- p11_deck[p11_deck$colour == "red", ]
p11_prob <- mean(p11_red$is_ace)
p11_prob
#> [1] 0.07692308
```

**Explanation:** Conditioning on "red" narrows the deck from 52 cards to 26. Of those, 2 are aces (the heart and diamond aces). 2/26 = 1/13 ≈ 0.077. Notice this is the same as the unconditional P(Ace) = 4/52 = 1/13, colour and ace-ness are independent.

</details>

### Problem 12: Medical test, P(disease | positive test)?

A disease has a prevalence of 1% in the population. A test is 99% sensitive (correctly flags 99% of true cases) and 95% specific (correctly clears 95% of healthy people). Someone tests positive, what's the probability they actually have the disease?

**Try it:** Apply Bayes' theorem directly. P(B) needs the law of total probability: P(positive) = P(pos | disease)·P(disease) + P(pos | healthy)·P(healthy).

```r
# Try it: P(disease | positive test)
p12_prior <- # your code here (prevalence)
p12_sens  <- # your code here (P(pos | disease))
p12_spec  <- # your code here (specificity → P(pos | healthy) = 1 - spec)
p12_post  <- # your code here (apply Bayes)
p12_post
#> Expected: ~0.167 — much lower than most people guess!
```

<details>
<summary>Click to reveal solution</summary>

```r
p12_prior <- 0.01
p12_sens  <- 0.99
p12_spec  <- 0.95
p_pos_given_healthy <- 1 - p12_spec
p_pos_total <- p12_sens * p12_prior + p_pos_given_healthy * (1 - p12_prior)
p12_post <- (p12_sens * p12_prior) / p_pos_total
p12_post
#> [1] 0.1666947
```

**Explanation:** Despite the test being 99% sensitive, only ~16.7% of positive results correspond to true cases. The rare disease (1% prevalence) means most positives are false positives drawn from the much larger healthy population. This is the base-rate fallacy in action.

</details>

[KEY INSIGHT]
**Base rates often beat test accuracy in your intuition.** A 99% sensitive test for a rare disease still produces mostly false positives, the math is correct, your gut isn't. Always plug numbers into Bayes before trusting a single test result.

## Practice Exercises

The next three problems are capstones, each combines simulation, distributions, and conditional reasoning into a single workflow. They use a `mp_` variable prefix to keep them isolated from the per-problem variables above.

### Exercise 13: The birthday problem

In a room of 23 people, what's the probability that at least two share a birthday? Solve it two ways: (a) by simulation with `replicate()` and `duplicated()`, and (b) analytically using `prod()` over the sequence 365, 364, …, 343.

```r
# Exercise 13: birthday paradox — simulate AND verify analytically
set.seed(2301)
mp13_birthday <- function(n) {
  bdays <- # your code here (sample 1:365 n times with replacement)
  any(duplicated(bdays))
}
mp13_sim <- # your code here (replicate 10000 times, take the mean)

# Analytical: P(no shared) = 365/365 * 364/365 * ... * 343/365
mp13_analytical <- # your code here (use prod() and 1 -)

c(simulation = mp13_sim, analytical = mp13_analytical)
#> Expected: both close to 0.507
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2301)
mp13_birthday <- function(n) {
  bdays <- sample(1:365, size = n, replace = TRUE)
  any(duplicated(bdays))
}
mp13_sim <- mean(replicate(10000, mp13_birthday(23)))

mp13_analytical <- 1 - prod((365 - 0:22) / 365)

c(simulation = mp13_sim, analytical = mp13_analytical)
#> simulation analytical
#>    0.5081     0.5073
```

**Explanation:** Both methods land at ~0.507, a coin-flip chance of a shared birthday in just 23 people, which surprises almost everyone. The analytical formula computes P(all distinct) by multiplying the available "free" days for each new person, then subtracts from 1.

</details>

### Exercise 14: Monty Hall, should you switch?

Three doors hide one car and two goats. You pick a door. The host (who knows where the car is) opens a different door revealing a goat, then offers you the chance to switch. Simulate 10,000 games for both "stay" and "switch" strategies. Report the empirical win rates.

```r
# Exercise 14: Monty Hall — empirical win rates
set.seed(2402)
mp14_play <- function(strategy = c("stay", "switch")) {
  strategy <- match.arg(strategy)
  car      <- sample(1:3, 1)
  pick     <- sample(1:3, 1)
  host_opens <- # your code here (host opens a door that is NOT car AND NOT pick)
  if (strategy == "stay") {
    final <- pick
  } else {
    final <- # your code here (the remaining door)
  }
  final == car
}

mp14_stay   <- mean(replicate(10000, mp14_play("stay")))
mp14_switch <- mean(replicate(10000, mp14_play("switch")))
c(stay = mp14_stay, switch = mp14_switch)
#> Expected: stay ~ 0.333, switch ~ 0.667
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2402)
mp14_play <- function(strategy = c("stay", "switch")) {
  strategy <- match.arg(strategy)
  car      <- sample(1:3, 1)
  pick     <- sample(1:3, 1)
  doors    <- setdiff(1:3, c(car, pick))
  host_opens <- if (length(doors) == 1) doors else sample(doors, 1)
  if (strategy == "stay") {
    final <- pick
  } else {
    final <- setdiff(1:3, c(pick, host_opens))
  }
  final == car
}

mp14_stay   <- mean(replicate(10000, mp14_play("stay")))
mp14_switch <- mean(replicate(10000, mp14_play("switch")))
c(stay = mp14_stay, switch = mp14_switch)
#>   stay switch
#> 0.3343 0.6648
```

**Explanation:** Switching wins ~2/3 of the time, twice as often as staying. The intuition: your initial pick is right 1/3 of the time, so switching loses 1/3 of the time and wins the other 2/3. The host's reveal doesn't change the original 1/3 odds on your first pick, it just concentrates the remaining 2/3 onto the single unopened door.

</details>

### Exercise 15: Bayesian update, coin bias from data

You're handed a coin and want to estimate its bias (probability of heads). Start with a uniform prior, Beta(1, 1), reflecting "I have no idea, any bias from 0 to 1 is equally plausible." After observing 7 heads in 10 tosses, compute the posterior, plot it, and report the posterior mean and 95% credible interval. Use the conjugate update: Beta(α + heads, β + tails).

```r
# Exercise 15: Bayesian beta-binomial update
prior_alpha <- 1
prior_beta  <- 1
heads       <- 7
tails       <- 3

mp15_alpha <- # your code here (posterior alpha)
mp15_beta  <- # your code here (posterior beta)

post_mean <- mp15_alpha / (mp15_alpha + mp15_beta)
mp15_ci   <- # your code here (use qbeta with c(0.025, 0.975))

list(posterior = c(alpha = mp15_alpha, beta = mp15_beta),
     mean = post_mean,
     ci_95 = mp15_ci)
#> Expected: alpha=8, beta=4, mean ≈ 0.667, CI ≈ (0.39, 0.89)
```

<details>
<summary>Click to reveal solution</summary>

```r
prior_alpha <- 1
prior_beta  <- 1
heads       <- 7
tails       <- 3

mp15_alpha <- prior_alpha + heads
mp15_beta  <- prior_beta + tails

post_mean <- mp15_alpha / (mp15_alpha + mp15_beta)
mp15_ci   <- qbeta(c(0.025, 0.975), mp15_alpha, mp15_beta)

list(posterior = c(alpha = mp15_alpha, beta = mp15_beta),
     mean = post_mean,
     ci_95 = mp15_ci)
#> $posterior
#> alpha  beta
#>     8     4
#>
#> $mean
#> [1] 0.6666667
#>
#> $ci_95
#> [1] 0.3902172 0.8907807

# Optional: visualise the posterior
curve(dbeta(x, mp15_alpha, mp15_beta), from = 0, to = 1,
      xlab = "Coin bias (P(heads))", ylab = "Posterior density",
      main = "Beta(8, 4) posterior after 7H/3T")
```

**Explanation:** The Beta-Binomial conjugate update is a one-liner: add observed heads to prior alpha, observed tails to prior beta. The posterior mean of 0.667 matches the empirical proportion (7/10), but the wide 95% credible interval (0.39, 0.89) honestly reflects how little 10 tosses actually tells us. With more data, the interval would tighten dramatically around the true bias.

</details>

## Complete Example: Simulate-then-verify workflow on the birthday paradox

The birthday problem is the perfect prototype for the workflow you'll reuse on every probability question: frame it, simulate it, derive the analytical answer, and compare. Below we put all five steps in one place.

```r
# 1. Frame: P(at least two people share a birthday in a room of n)?
# 2. Simulate
set.seed(99)
bd_one_room <- function(n) any(duplicated(sample(1:365, n, replace = TRUE)))
bd_sim   <- mean(replicate(20000, bd_one_room(23)))

# 3. Analytical
bd_exact <- 1 - prod((365 - 0:22) / 365)

# 4. Compare
data.frame(
  method = c("simulation (20k rooms)", "analytical formula"),
  prob   = round(c(bd_sim, bd_exact), 4)
)
#>                   method   prob
#> 1 simulation (20k rooms) 0.5063
#> 2     analytical formula 0.5073
```

The simulation and the closed-form answer agree to within 0.001, a sanity check that both your code and your math are correct. Now we extend the question: how does the probability scale with room size?

```r
# 5. Sweep n from 5 to 50 and plot the curve
bd_n     <- 5:50
bd_probs <- sapply(bd_n, function(k) 1 - prod((365 - 0:(k - 1)) / 365))

plot(bd_n, bd_probs, type = "b", pch = 19,
     xlab = "Number of people in the room",
     ylab = "P(at least two share a birthday)",
     main = "Birthday problem: probability vs room size")
abline(h = 0.5, lty = 2, col = "red")
abline(v = 23,  lty = 2, col = "red")
```

The dashed lines mark the famous tipping point: 23 people is the smallest n where the probability crosses 50%. By 50 people, you're at 97%, almost guaranteed. The same simulate-then-verify-then-explore workflow scales to any probability question you'll encounter.

## Summary

The 15 problems above span the full toolkit you need for everyday probability work in R:

- **Simulate-and-count**, `mean(condition)` over many `replicate()`s estimates any probability empirically
- **`d/p/q/r` distribution prefix family**, density, cumulative, quantile, random samples for `*binom`, `*norm`, `*pois`, `*exp`, `*beta`
- **`pbinom(k, ...)` returns P(X ≤ k)**, use `lower.tail = FALSE` for upper tails and to avoid off-by-one bugs
- **Conditional probability narrows the sample space**, filter to where the condition holds, then compute the inner probability
- **Bayes' theorem flips the direction**, prior × likelihood / evidence converts P(B|A) into P(A|B)
- **Beta-Binomial conjugate update**, Bayesian inference in a single line: posterior = Beta(α + heads, β + tails)
- **Always verify simulation against analytical**, when an exact formula exists, compute both and check they agree

| Problem type | Function | Typical pattern |
|---|---|---|
| Empirical probability | `sample()`, `replicate()`, `mean()` | `mean(replicate(N, condition))` |
| Exact discrete probability | `dbinom`, `dpois` | `dbinom(k, n, p)` |
| Cumulative probability | `pbinom`, `pnorm`, `ppois` | `pbinom(k, n, p, lower.tail = FALSE)` |
| Percentile / quantile | `qnorm`, `qbeta` | `qnorm(0.95, mean, sd)` |
| Bayesian posterior (Beta-Binomial) | `dbeta`, `qbeta` | `qbeta(c(.025, .975), α + h, β + t)` |

## References

1. R Core Team, *An Introduction to R*. CRAN documentation. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. R `stats` package, distribution function reference (`?Distributions`). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)
3. Jim Albert & Jingchen Hu, *Probability and Bayesian Modeling*. CRC Press. [Link](https://bayesball.github.io/BOOK/)
4. Alicia A. Johnson, Miles Q. Ott, Mine Dogucu, *Bayes Rules! An Introduction to Applied Bayesian Modeling*. CRC Press. [Link](https://www.bayesrulesbook.com/)
5. Paul Teetor, *R Cookbook* (2nd ed.), Chapter 8: Probability. O'Reilly. [Link](https://rc2e.com/probability)
6. Wikipedia, Birthday problem. [Link](https://en.wikipedia.org/wiki/Birthday_problem)
7. Wikipedia, Monty Hall problem. [Link](https://en.wikipedia.org/wiki/Monty_Hall_problem)

## Continue Learning

- [Probability Simulation in R](Probability-Simulation-in-R.html), a deeper tutorial on the simulate-and-count workflow, including `replicate()`, Monte Carlo estimation, and convergence diagnostics.
- [Conditional Probability in R](Conditional-Probability-in-R.html), extends Problems 11 and 12 with more conditional setups, the law of total probability, and event independence.
- [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html), a focused walk-through of the discrete distributions used in Problems 6, 7, and 10, with all four `d/p/q/r` functions explored in depth.

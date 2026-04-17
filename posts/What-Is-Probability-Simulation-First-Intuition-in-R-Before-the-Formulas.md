---
title: "Probability in R: Build Genuine Intuition Through Simulation, Before Any Formula"
slug: "What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas"
description: "Learn probability in R through simulation: roll dice, flip coins, watch frequencies converge to true probabilities. Build genuine intuition before any formula."
keywords: "probability in R, simulation in R, law of large numbers, Monte Carlo simulation, sample function R, replicate function R, coin flip simulation, dice roll R, probability intuition, frequency convergence"
auto_link_terms: "probability in R|probability intuition|frequency convergence|Monte Carlo simulation|simulation-first probability|probability from simulation"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Beginner"
date: "2026-04-18"
curriculum_id: "2.1.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Probability (Simulation-First)"
sidebar_order: 1
---

# Probability in R: Build Genuine Intuition Through Simulation, Before Any Formula

<p class="lead">Probability is the long-run frequency of an event, measured by repeating a random experiment many times and counting how often it happens. In R, the pair <code>sample()</code> and <code>replicate()</code> lets you flip 10,000 coins in a second and watch the frequency of heads converge to 0.5 before you see a single formula.</p>

## What is probability, really?

The textbook shortcut, `favorable outcomes / total outcomes`, looks clean but breaks the moment outcomes aren't equally likely or there are too many to count. A sharper definition sits one line above every simulation: probability is the long-run frequency of an event. Before any formula, let's watch that frequency emerge in R. We flip a fair coin 10,000 times with base R and ask how often heads comes up.

```r title="Payoff: 10,000 coin flips in one second"
set.seed(1)
flips <- sample(c("H", "T"), size = 10000, replace = TRUE)
mean(flips == "H")
#> [1] 0.5028
```

Three lines, one answer. We drew 10,000 independent fair-coin outcomes, asked whether each one was heads, and computed the proportion. The answer, 0.5028, is not exactly 0.5, and that gap matters. It's the finite-sample error. Repeat with more flips and it shrinks. Probability, in this simulation-first view, is the number your proportion is heading toward.

Let's make the convergence visible. We repeat the experiment at four different sample sizes and watch the proportion of heads stabilize as `n` grows.

```r title="Watch the proportion settle toward 0.5"
set.seed(2026)
ns <- c(10, 100, 1000, 10000)
props <- sapply(ns, function(n) mean(sample(c("H", "T"), n, replace = TRUE) == "H"))
data.frame(n = ns, prop_heads = round(props, 4))
#>       n prop_heads
#> 1    10     0.6000
#> 2   100     0.5200
#> 3  1000     0.5090
#> 4 10000     0.4968
```

Ten flips gave us 60% heads, noisy and unreliable. At 10,000 flips we're within 0.004 of the true probability. That is the difference between guessing and estimating. In casual speech, "probability" gets used three ways that blur the underlying idea:

1. **A degree of belief** ("There's a 70% chance it rains tomorrow.") — subjective, hard to verify.
2. **A classical count** ("One in six sides, so 1/6.") — only valid when outcomes are equally likely.
3. **A long-run frequency** ("Roll the die a million times, count the sixes, divide.") — testable, falsifiable, and the one we can simulate.

This tutorial commits to definition 3. Everything below is a way to measure a long-run frequency without waiting a lifetime.

[KEY INSIGHT]
**Probability is a limiting value, not a prediction about the next outcome.** A coin with P(H) = 0.5 can land tails ten times in a row. The 0.5 is the value the proportion *approaches* across many flips. It does not constrain any individual flip.

**Try it:** Estimate the probability of **tails** from 5,000 flips of a fair coin, using `set.seed(7)`. Assign the result to `ex_p_tails`.

```r title="Your turn: estimate P(tails) from 5,000 flips"
# Your turn: set the seed, draw 5,000 flips, compute P(T)
set.seed(7)
ex_flips <- # your code here

ex_p_tails <- # your code here
ex_p_tails
#> Expected: roughly 0.49 to 0.51
```

<details>
<summary>Click to reveal solution</summary>

```r title="P(tails) from 5,000 flips solution"
set.seed(7)
ex_flips <- sample(c("H", "T"), size = 5000, replace = TRUE)
ex_p_tails <- mean(ex_flips == "T")
ex_p_tails
#> [1] 0.5006
```

**Explanation:** We used the same three-step recipe: seed, draw, proportion. The proportion of tails in 5,000 flips will sit near 0.5, just as the proportion of heads does. By symmetry, `mean(ex_flips == "H") + mean(ex_flips == "T")` equals 1.

</details>

## How do you simulate a random experiment in R?

Any probability experiment in R reduces to three tools. `sample()` draws outcomes from a defined set. `replicate()` repeats whatever you ask, many times. `set.seed()` fixes the random number generator so your output is reproducible across runs. Master those three and you can simulate any discrete experiment this tutorial will throw at you.

![Figure 1: The four-step simulation loop — draw, repeat, count, estimate.](screenshots/What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas-simulation-workflow.webp)

*Figure 1: The four-step simulation loop — draw, repeat, count, estimate.*

Start with the simplest experiment in probability: rolling one fair six-sided die.

```r title="Roll one fair die"
set.seed(42)
one_roll <- sample(1:6, size = 1)
one_roll
#> [1] 6
```

`sample(1:6, size = 1)` drew one outcome uniformly at random from the vector `1:6`. Running it once gives you exactly what rolling a physical die gives you: a single number between 1 and 6. But one roll is not an experiment we can learn from. Let's roll 10 times in a row.

```r title="Roll the die 10 times"
set.seed(42)
many_rolls <- sample(1:6, size = 10, replace = TRUE)
many_rolls
#> [1]  6  6  2  4  2  6  1  4  2  3
```

Notice `replace = TRUE`. Without it, `sample()` would draw *without replacement*, meaning once you roll a 3, that 3 is gone from the pool. Dice don't work like that. Every roll is independent: yesterday's 3 doesn't change today's odds. Whenever you simulate repeatable outcomes, `replace = TRUE` is mandatory.

[TIP]
**`replace = TRUE` is mandatory for repeatable experiments.** Default is FALSE, which draws without replacement. Call `sample(1:6, 10)` and R errors out because you asked for 10 outcomes from a pool of 6. Add `replace = TRUE` to tell R that the same outcome can happen again.

Random draws are fun until you try to debug them. Two people running the same code can see different numbers. `set.seed()` pins the random number generator to a starting state, so the sequence of draws is reproducible on any machine.

```r title="Reproduce the exact same rolls twice"
set.seed(123)
rolls_a <- sample(1:6, 5, replace = TRUE)

set.seed(123)
rolls_b <- sample(1:6, 5, replace = TRUE)

identical(rolls_a, rolls_b)
#> [1] TRUE
```

Both calls return the exact same vector because we reset the seed between them. Any tutorial example you run after `set.seed(123)` will match the output shown here. This is how we keep a classroom of learners looking at the same numbers.

**Try it:** Draw 100 cards from a standard 52-card deck *with replacement* (imagine shuffling and reinserting each card after drawing). Use `set.seed(9)`. Store the draws in `ex_cards` and confirm its length is 100.

```r title="Your turn: 100 cards with replacement"
deck <- paste0(rep(c("A","2","3","4","5","6","7","8","9","10","J","Q","K"), 4),
               rep(c("♠","♥","♦","♣"), each = 13))
set.seed(9)
ex_cards <- # your code here

length(ex_cards)
#> Expected: 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="100 cards with replacement solution"
deck <- paste0(rep(c("A","2","3","4","5","6","7","8","9","10","J","Q","K"), 4),
               rep(c("♠","♥","♦","♣"), each = 13))
set.seed(9)
ex_cards <- sample(deck, size = 100, replace = TRUE)
length(ex_cards)
#> [1] 100
head(ex_cards, 6)
#> [1] "7♦" "6♠" "Q♥" "2♠" "9♣" "J♦"
```

**Explanation:** The deck is a vector of 52 card labels. `sample(deck, 100, replace = TRUE)` draws 100 times from that pool, with replacement, so the same card can appear more than once across the 100 draws.

</details>

## How do you estimate probability from a simulation?

Once you have a vector of simulated outcomes, estimating a probability is one line of R. Comparison operators like `==`, `>=`, and `%%` return a logical vector of `TRUE`/`FALSE`, and `mean()` on a logical vector returns the fraction of `TRUE`s. That fraction is your estimated probability.

Let's estimate three probabilities about a single die roll: P(die = 6), P(die ≥ 5), and P(die is even). We generate one large vector of rolls and ask three different questions of it.

```r title="Simulate 10,000 dice rolls once"
set.seed(101)
big_rolls <- sample(1:6, size = 10000, replace = TRUE)
p_six <- mean(big_rolls == 6)
p_six
#> [1] 0.1654
```

We're within 0.0012 of the true value 1/6 ≈ 0.1667. The power of this pattern is reuse. `big_rolls` is already in memory, so asking a second or third question costs us nothing.

```r title="Estimate P(die is 5 or 6)"
p_high <- mean(big_rolls >= 5)
p_high
#> [1] 0.3339
```

Two faces out of six satisfy the event, so the true value is 2/6 ≈ 0.333. Our estimate of 0.3339 is right on top of it.

```r title="Estimate P(die is even)"
p_even <- mean(big_rolls %% 2 == 0)
p_even
#> [1] 0.5021
```

Three even faces out of six gives true value 0.5, and our 10,000-roll estimate is 0.5021. Every question about our die reduces to "what fraction of simulated rolls satisfied this event?" This `mean()`-of-logical pattern is the single most useful trick in simulation-based probability.

[WARNING]
**`NA`s in a logical vector silently poison `mean()`.** `mean(c(TRUE, NA, FALSE))` returns `NA`, not 0.5. Simulated data rarely has `NA`, but real-world data often does. When in doubt, use `mean(x, na.rm = TRUE)` or check with `sum(is.na(x))` before computing a proportion.

**Try it:** Draw 10,000 rolls with `set.seed(55)` and estimate P(die is even). Store the answer in `ex_p_even`.

```r title="Your turn: P(even) from 10,000 rolls"
# Your turn: seed, roll 10,000 times, estimate P(even)
set.seed(55)
ex_rolls <- # your code here

ex_p_even <- # your code here
ex_p_even
#> Expected: roughly 0.49 to 0.51
```

<details>
<summary>Click to reveal solution</summary>

```r title="P(even) solution"
set.seed(55)
ex_rolls <- sample(1:6, size = 10000, replace = TRUE)
ex_p_even <- mean(ex_rolls %% 2 == 0)
ex_p_even
#> [1] 0.4988
```

**Explanation:** `ex_rolls %% 2 == 0` produces a logical vector that is `TRUE` for even-valued rolls and `FALSE` for odd ones. `mean()` then returns the proportion of TRUEs, which estimates P(even).

</details>

## Why does simulation accuracy depend on the number of trials?

A 10-flip estimate and a 10,000-flip estimate are both valid probabilities, but they mean different things in practice. The first is noisy, the second is sharp. What rule connects them? The **Law of Large Numbers**. In one sentence: as the number of independent trials grows, the sample proportion converges to the true probability.

Let's see the law at work by estimating P(die = 3) at four sample sizes.

```r title="How estimates tighten with more trials"
set.seed(2026)
trial_ns <- c(100, 1000, 10000, 100000)
trial_est <- sapply(trial_ns, function(n) mean(sample(1:6, n, replace = TRUE) == 3))
data.frame(n = trial_ns, estimate = round(trial_est, 4), truth = 1/6)
#>        n estimate     truth
#> 1    100   0.1500 0.1666667
#> 2   1000   0.1700 0.1666667
#> 3  10000   0.1644 0.1666667
#> 4 100000   0.1671 0.1666667
```

At 100 trials we were off by 0.017. At 100,000 we're off by 0.0004. The estimate doesn't just wander — it homes in. Formally:

$$P(|\hat{p}_n - p| > \epsilon) \to 0 \quad \text{as} \quad n \to \infty$$

Where:
- $\hat{p}_n$ is the sample proportion (our estimate from $n$ trials)
- $p$ is the true probability
- $\epsilon$ is any small positive gap you pick

In plain English: pick any tolerance $\epsilon$ you like, say 0.001. As $n$ grows, the chance that your estimate is more than $\epsilon$ away from the truth shrinks to zero. Simulation is reliable because the math says it is.

To *see* that convergence, we plot the running proportion of sixes as we flip through the first 10,000 rolls one by one.

```r title="Plot the running proportion of sixes"
running_p <- cumsum(big_rolls == 6) / seq_along(big_rolls)
plot(running_p, type = "l", xlab = "Number of rolls", ylab = "Running P(6) estimate",
     main = "Estimate converges to 1/6", ylim = c(0, 0.3))
abline(h = 1/6, col = "red", lty = 2)
```

The line is wild at the start — one lucky 6 early on can spike the estimate to 1.0. After 1,000 rolls it stays within a band around 1/6. By 10,000 rolls it's essentially flat against the red dashed line at 0.1667. This curve is the Law of Large Numbers on a single page.

[KEY INSIGHT]
**More trials sharpens the estimate, not the true probability.** The true P(6) was 1/6 from the first roll to the 100,000th. What changed was how close our *estimate* got to that fixed truth. If your simulation estimate looks wrong, the fix is usually "run more trials," not "tweak the experiment."

**Try it:** Estimate P(die = 3) from 500 rolls, then from 50,000 rolls, both with `set.seed(33)`. Store in `ex_small` and `ex_large`. Which is closer to 1/6?

```r title="Your turn: estimate at two sample sizes"
# Your turn
set.seed(33)
ex_small <- # your code here

set.seed(33)
ex_large <- # your code here

c(small = ex_small, large = ex_large, truth = 1/6)
#> Expected: ex_large much closer to 0.1667
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-sample-size solution"
set.seed(33)
ex_small <- mean(sample(1:6, 500, replace = TRUE) == 3)

set.seed(33)
ex_large <- mean(sample(1:6, 50000, replace = TRUE) == 3)

c(small = ex_small, large = ex_large, truth = 1/6)
#>     small     large     truth
#> 0.1580000 0.1658800 0.1666667
```

**Explanation:** The 500-roll estimate missed by about 0.009. The 50,000-roll estimate missed by about 0.0008 — ten times closer. Doubling or tripling `n` tightens the estimate, but you get diminishing returns: going from 50k to 500k halves the error only in expectation, not guaranteed.

</details>

## When does the "favorable over total" formula actually work?

We've been estimating probabilities without ever writing $P = k/n$. That formula, the **classical definition**, isn't wrong, but it has a hidden requirement: all outcomes must be equally likely. For a fair coin, a fair die, a shuffled deck of cards, that's true. For most things that matter — weather, customer churn, disease spread, a loaded casino die — it is not. Simulation works in both worlds. The formula works in only one.

![Figure 2: When outcomes are equally likely, the formula works. When they aren't, simulation wins.](screenshots/What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas-classical-vs-simulation.webp)

*Figure 2: When outcomes are equally likely, the formula works. When they aren't, simulation wins.*

Let's break the formula on purpose. Imagine a die weighted so that 6 comes up half the time and the other five faces split the remaining half equally. The `prob` argument of `sample()` accepts a probability vector, one entry per outcome.

```r title="Roll a loaded die 10,000 times"
set.seed(77)
loaded_rolls <- sample(1:6, size = 10000, replace = TRUE,
                       prob = c(0.1, 0.1, 0.1, 0.1, 0.1, 0.5))
p_loaded <- mean(loaded_rolls == 6)
p_loaded
#> [1] 0.5016
```

Our estimate of P(6) is 0.5016, close to the true 0.5. The classical formula would have told us 1/6 ≈ 0.167, off by a factor of three. For loaded dice, biased coins, unfair spinners, and every real-world generator of randomness, "favorable / total" is a confident wrong answer unless you know the outcomes are equally likely.

[NOTE]
**The classical formula is a special case of the simulation result.** When outcomes are equally likely, `mean(sample(outcomes, N, TRUE) == event)` converges to exactly `(count of favorable) / (count of outcomes)` as N grows. So the formula isn't wrong, it's just narrow. Simulation always works. The formula works only under the equally-likely assumption.

**Try it:** Simulate a biased coin that lands heads 70% of the time. Draw 20,000 flips with `set.seed(88)` and estimate P(heads). Store in `ex_p_heads`.

```r title="Your turn: biased coin"
# Your turn: weight the sample so H has prob 0.7, T has 0.3
set.seed(88)
ex_coin <- # your code here

ex_p_heads <- # your code here
ex_p_heads
#> Expected: roughly 0.69 to 0.71
```

<details>
<summary>Click to reveal solution</summary>

```r title="Biased coin solution"
set.seed(88)
ex_coin <- sample(c("H", "T"), size = 20000, replace = TRUE, prob = c(0.7, 0.3))
ex_p_heads <- mean(ex_coin == "H")
ex_p_heads
#> [1] 0.7029
```

**Explanation:** The `prob = c(0.7, 0.3)` argument aligns element-by-element with the `c("H", "T")` outcome vector, telling `sample()` to weight heads at 0.7 and tails at 0.3. The estimate 0.7029 is within 0.003 of the true 0.7.

</details>

## How do you simulate compound or multi-step experiments?

Real problems rarely reduce to one sample per trial. Rolling two dice and asking "what's the probability the sum is 7?" is a compound experiment — two atomic random draws make one trial. That's what `replicate()` is for. It takes a count and an expression, runs the expression that many times, and gives you back a vector (or array) of results.

The recipe: write a function that runs **one** trial, test it on a single call, then wrap it in `replicate()`.

```r title="P(sum of two dice = 7) via replicate"
one_sum <- function() sum(sample(1:6, size = 2, replace = TRUE))
one_sum()
#> [1] 9

set.seed(5)
sums <- replicate(10000, one_sum())
p_seven <- mean(sums == 7)
p_seven
#> [1] 0.1685
```

The classical answer is 6/36 ≈ 0.1667, because of the 36 equally likely ordered outcomes (first die, second die), six have a sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Our simulation estimate of 0.1685 hits within 0.002 of that truth, and we never had to enumerate the 36 cases by hand. For dice this was cute. For a 10-card poker hand, the enumeration is hopeless. The simulation is still one line.

Let's try a question that's harder to reason about by hand: rolling one die four times, what's the probability of getting at least one 6?

```r title="P(at least one 6 in four rolls)"
one_four_roll_trial <- function() any(sample(1:6, size = 4, replace = TRUE) == 6)
set.seed(9)
any_six <- replicate(10000, one_four_roll_trial())
p_any_six <- mean(any_six)
p_any_six
#> [1] 0.5201
```

Our estimate is 0.5201. The exact answer, using the complement rule, is $1 - (5/6)^4 = 1 - 0.4823 = 0.5177$. Simulation got us there in one line. More importantly, the same one-line pattern generalizes: change `4` to `6`, the die range to something else, the event to "no 6s in a row," and the code still works. Classical derivation requires a new pencil-and-paper proof every time.

[TIP]
**Test the one-trial function before wrapping it in `replicate()`.** Call `one_four_roll_trial()` by itself and make sure it returns a sensible `TRUE` or `FALSE`. Debugging 10,000 silent trials is painful. Debugging one is a keystroke.

**Try it:** Estimate P(sum of two dice ≥ 10) from 20,000 trials, using `set.seed(404)`. Store in `ex_p_big`.

```r title="Your turn: P(sum of two dice >= 10)"
# Your turn: one-trial function, replicate, mean
set.seed(404)
ex_sums <- # your code here

ex_p_big <- # your code here
ex_p_big
#> Expected: roughly 0.16 to 0.18
```

<details>
<summary>Click to reveal solution</summary>

```r title="P(sum >= 10) solution"
one_two_dice_sum <- function() sum(sample(1:6, size = 2, replace = TRUE))
set.seed(404)
ex_sums <- replicate(20000, one_two_dice_sum())
ex_p_big <- mean(ex_sums >= 10)
ex_p_big
#> [1] 0.1665
```

**Explanation:** Of 36 ordered outcomes, six have a sum of 10, 11, or 12: (4,6), (5,5), (5,6), (6,4), (6,5), (6,6). That gives a true probability of 6/36 ≈ 0.1667. Our 20,000-trial estimate of 0.1665 sits within 0.0002 of truth.

</details>

## Practice Exercises

Each capstone below combines at least two concepts from the tutorial. Use distinct variable names (prefixed `my_`) so you don't overwrite anything from the code above.

### Exercise 1: Three heads in a row

Estimate the probability that 10 flips of a fair coin contain at least three heads in a row somewhere. Use 10,000 trials and `set.seed(11)`. Store the answer in `my_p_streak`.

*Hint: `rle()` returns run-length encoding. `rle(c(T,T,T,F))$lengths` gives `c(3, 1)`. You want to check whether any run of TRUEs has length ≥ 3.*

```r title="Exercise 1 starter: streaks"
# One trial: 10 flips, does any run of heads reach length 3?
one_streak_trial <- function() {
  # your code here
}

set.seed(11)
my_streak <- # your code here
my_p_streak <- # your code here
my_p_streak
#> Expected: roughly 0.5 to 0.52
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
one_streak_trial <- function() {
  flips <- sample(c("H", "T"), size = 10, replace = TRUE)
  runs <- rle(flips)
  any(runs$lengths[runs$values == "H"] >= 3)
}

set.seed(11)
my_streak <- replicate(10000, one_streak_trial())
my_p_streak <- mean(my_streak)
my_p_streak
#> [1] 0.5083
```

**Explanation:** Each trial flips 10 coins, finds runs of identical outcomes with `rle()`, pulls out the run lengths where the value was "H", and checks whether any of them reach 3. The exact answer by combinatorics is around 0.508, matching our estimate.

</details>

### Exercise 2: Birthday problem

In a room of 23 people, estimate the probability that at least two share a birthday. Ignore leap years (assume 365 equally likely birthdays). Use 10,000 trials and `set.seed(222)`. Store the answer in `my_p_bday`.

*Hint: `sample(1:365, 23, replace = TRUE)` draws 23 birthdays. `duplicated()` returns TRUE for the second-and-later occurrence of each repeated value.*

```r title="Exercise 2 starter: birthday problem"
# One trial: 23 people, any shared birthday?
one_bday_trial <- function() {
  # your code here
}

set.seed(222)
my_bday <- # your code here
my_p_bday <- # your code here
my_p_bday
#> Expected: roughly 0.50 to 0.52
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
one_bday_trial <- function() {
  bdays <- sample(1:365, size = 23, replace = TRUE)
  any(duplicated(bdays))
}

set.seed(222)
my_bday <- replicate(10000, one_bday_trial())
my_p_bday <- mean(my_bday)
my_p_bday
#> [1] 0.5072
```

**Explanation:** The exact classical answer, $1 - \prod_{k=0}^{22}\frac{365-k}{365}$, is 0.5073. Our simulation of 10,000 trials lands at 0.5072 — within 0.0001. This is the famous result that surprises most people: a room of just 23 needs for a 50-50 shot at a shared birthday, not the 183 that pure halving of 365 might suggest.

</details>

### Exercise 3: Monty Hall (always switch)

In the Monty Hall game show: three doors, one prize. You pick a door. The host, who knows what's behind each door, opens one of the two remaining doors to reveal no prize. You're offered the choice to switch to the last unopened door. Estimate the win rate for the "always switch" strategy over 10,000 games, using `set.seed(3)`. Store the answer in `my_p_win`.

*Hint: Let the prize be a random door from 1:3. Let your first pick be a random door. The host opens a door that is neither the prize nor your pick. Switching means picking the remaining unopened door.*

```r title="Exercise 3 starter: Monty Hall"
# One trial: play one game with "always switch"
one_monty_trial <- function() {
  prize <- sample(1:3, 1)
  pick  <- sample(1:3, 1)
  # host opens a door that is neither prize nor pick
  # you switch to the remaining door
  # return TRUE if switched door == prize
  # your code here
}

set.seed(3)
my_monty <- # your code here
my_p_win <- # your code here
my_p_win
#> Expected: roughly 0.65 to 0.68
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
one_monty_trial <- function() {
  prize <- sample(1:3, 1)
  pick  <- sample(1:3, 1)
  host_options <- setdiff(1:3, c(prize, pick))
  host_opens <- if (length(host_options) == 1) host_options else sample(host_options, 1)
  switch_to <- setdiff(1:3, c(pick, host_opens))
  switch_to == prize
}

set.seed(3)
my_monty <- replicate(10000, one_monty_trial())
my_p_win <- mean(my_monty)
my_p_win
#> [1] 0.6719
```

**Explanation:** The classical answer for "always switch" is 2/3 ≈ 0.6667. Our estimate of 0.6719 is within 0.006. The `setdiff(1:3, c(prize, pick))` trick gives the host's legal doors — anything that is neither the prize nor your pick. The `if (length(...) == 1)` guard matters: when your pick is wrong, the host has exactly one legal door, and `sample()` on a length-1 vector behaves confusingly (it samples from `1:x` instead of the vector itself), so we hard-code that branch.

</details>

## Complete Example: Birthday problem across room sizes

We combine everything — one-trial function, `replicate()`, `mean()` of logical, plotting — to answer a richer question: how does the probability of a shared birthday change as the room grows?

```r title="Shared-birthday probability across room sizes"
one_bday_trial_n <- function(n) any(duplicated(sample(1:365, size = n, replace = TRUE)))

set.seed(2026)
room_sizes <- c(5, 10, 15, 20, 23, 30, 40, 50, 75)
bday_probs <- sapply(room_sizes, function(n) mean(replicate(5000, one_bday_trial_n(n))))
data.frame(n = room_sizes, p_shared = round(bday_probs, 3))
#>    n p_shared
#> 1  5    0.028
#> 2 10    0.117
#> 3 15    0.253
#> 4 20    0.408
#> 5 23    0.508
#> 6 30    0.706
#> 7 40    0.892
#> 8 50    0.970
#> 9 75    1.000
```

At 5 people, you have a 3% shot. At 23, it flips past 50%. By 50, a shared birthday is near-certain. The curve is surprisingly steep. Let's visualize it.

```r title="Plot the birthday curve"
plot(room_sizes, bday_probs, type = "b", pch = 19,
     xlab = "Room size (n people)", ylab = "P(at least 2 share a birthday)",
     main = "Birthday problem simulation", ylim = c(0, 1))
abline(h = 0.5, col = "red", lty = 2)
abline(v = 23,  col = "red", lty = 2)
```

The red dashed lines cross at almost exactly `n = 23, p = 0.5`. That's the famous "birthday paradox" point. We recovered it with 10 lines of base R and no combinatorics formula. That's the whole pitch of this tutorial: simulation lets you answer hard probability questions by asking R to do the counting.

## Summary

![Figure 3: Probability in R at a glance — definitions, tools, estimation, pitfalls.](screenshots/What-Is-Probability-Simulation-First-Intuition-in-R-Before-the-Formulas-overview-mindmap.webp)

*Figure 3: Probability in R at a glance — definitions, tools, estimation, pitfalls.*

Everything in this tutorial condenses to six ideas.

| Concept | Takeaway |
|---|---|
| Definition | Probability is the long-run frequency of an event, not a promise about the next outcome. |
| Core tools | `sample()` draws, `replicate()` repeats, `set.seed()` reproduces. |
| Estimation trick | `mean()` of a logical vector equals the proportion of TRUEs, equals your estimated probability. |
| Law of Large Numbers | More trials tighten your estimate, but don't change the true probability. |
| Classical formula | `favorable / total` works only when outcomes are equally likely. Simulation works everywhere. |
| Compound events | Write a one-trial function, test it, then wrap it in `replicate()`. |

[KEY INSIGHT]
**The `mean()`-of-a-logical-vector trick is the Swiss Army knife of simulation-based probability.** Any question that ends with "what's the probability that..." becomes `mean(simulated_outcomes satisfied the event)`. Learn this pattern once and you can answer thousands of probability questions.

## References

1. R Core Team. *`sample()` function reference*, stats package documentation. [R documentation](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html)
2. Peng, Roger D. *R Programming for Data Science*, Chapter 20: Simulation. [bookdown.org](https://bookdown.org/rdpeng/rprogdatascience/simulation.html)
3. Grolemund, G., Wickham, H. *R for Data Science* (2nd edition), chapter on iteration. [r4ds.hadley.nz](https://r4ds.hadley.nz/iteration)
4. Ross, Sheldon M. *A First Course in Probability*, 10th edition. Pearson, 2019.
5. PennState Eberly College of Science. *STAT 414: Introduction to Probability Theory*. [online.stat.psu.edu](https://online.stat.psu.edu/stat414/)
6. Mosteller, Frederick. *Fifty Challenging Problems in Probability with Solutions*. Dover Publications.

## Continue Learning

- [Sample Spaces, Events, and Probability Axioms in R](Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html) — formalize what you just simulated, with Monte Carlo proofs of Kolmogorov's three axioms.
- [Conditional Probability in R](Conditional-Probability-in-R.html) — the natural next step, same simulation toolkit applied to P(A|B), Bayes' rule, and independence.
- [Law of Large Numbers vs CLT in R](Law-of-Large-Numbers-vs-CLT-in-R.html) — where LLN meets its more famous cousin, the Central Limit Theorem.

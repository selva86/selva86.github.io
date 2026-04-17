---
title: "Random Variables in R: Discrete vs Continuous, PMF, PDF, and CDF, Visualised"
slug: "Random-Variables-in-R"
description: "A random variable maps outcomes to numbers. Learn discrete PMFs and continuous PDFs in R, how CDFs unify both, and master R's d/p/q/r function pattern."
keywords: "random variables in R, discrete random variable R, continuous random variable R, PMF in R, PDF in R, CDF in R, dbinom, dnorm, pnorm, d/p/q/r functions R"
auto_link_terms: "random variables in R|probability mass function|probability density function|cumulative distribution function|PMF and CDF|discrete vs continuous random variables|d/p/q/r functions"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-16"
curriculum_id: "2.1.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Random Variables"
sidebar_order: 19
difficulty: "Beginner"
---

# Random Variables in R: Discrete vs Continuous, PMF, PDF, and CDF, Visualised

<p class="lead">A random variable is a function that assigns a number to every outcome of a random experiment, and R gives you a consistent set of tools to compute probabilities, densities, quantiles, and random draws for any distribution.</p>

## What is a random variable, and why does R care?

Every time you roll a die, flip a coin, or measure a patient's blood pressure, the result is uncertain, but you can still attach numbers to the possible outcomes. That mapping from outcome to number is a **random variable**. Let's see one in action: we'll simulate 1,000 dice rolls and count how often each face appears.

```r title="Simulate one thousand dice rolls"
# Simulate 1,000 rolls of a fair six-sided die
set.seed(1)
rolls <- sample(1:6, size = 1000, replace = TRUE)

# Count how often each face appeared
freq_table <- table(rolls)
freq_table
#>   1   2   3   4   5   6
#> 165 171 173 156 172 163

# Visualise the frequencies
barplot(freq_table,
        col = "steelblue",
        main = "1,000 Dice Rolls",
        xlab = "Face value",
        ylab = "Frequency")
```

Each face shows up roughly 167 times (1,000 / 6), which matches our intuition for a fair die. The variable `rolls` holds the *realised values* of a random variable, the rule that says "read the top face and record its number."

In probability notation, we write the random variable as a capital letter like $X$, and a specific observed value as lowercase $x$. So $X$ = "the face you roll" and $x = 4$ means you rolled a four.

Here's another example. A coin flip can be turned into a random variable by mapping Heads to 1 and Tails to 0.

```r title="Coin flip as random variable"
# Coin flip as a random variable: Heads = 1, Tails = 0
set.seed(7)
coin_flips <- sample(c(0, 1), size = 500, replace = TRUE)

# The sample mean estimates P(Heads)
mean(coin_flips)
#> [1] 0.488
```

The mean of 0.488 is close to the theoretical 0.5, our simulated coin is approximately fair.

[KEY INSIGHT]
**A random variable is not a number, it is a rule that turns each random outcome into a number.** The die itself doesn't change, but the random variable defines *which aspect* of the outcome you record (the face value, whether it's even, whether it exceeds 3, etc.).

**Try it:** Simulate 2,000 rolls of an 8-sided die (faces 1 through 8) and compute the sample mean. It should be close to 4.5.

```r title="Exercise: eight sided die simulation"
# Try it: 8-sided die simulation
set.seed(123)
ex_rolls <- sample(1:8, size = 2000, replace = TRUE)
mean(ex_rolls)
#> Expected: close to 4.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eight sided die solution"
set.seed(123)
ex_rolls <- sample(1:8, size = 2000, replace = TRUE)
mean(ex_rolls)
#> [1] 4.4895
```

**Explanation:** The theoretical mean of a uniform discrete distribution on 1 to 8 is $(1+8)/2 = 4.5$. With 2,000 rolls, the sample mean is very close to this value.

</details>

## How do discrete and continuous random variables differ?

Not all random variables work the same way. The crucial distinction is whether the possible values are **countable** or **uncountable**.

- **Discrete** random variables take on a countable set of values, die faces (1 through 6), number of emails per hour (0, 1, 2, ...), defective items in a batch. You can list them out.
- **Continuous** random variables can take any value in an interval, height (170.342... cm), temperature (36.6127...°C), waiting time (4.8 minutes). You cannot list every possibility because there are infinitely many values between any two points.

Let's see how this plays out visually. A discrete distribution looks like a bar chart (each value gets its own bar), while a continuous distribution looks like a smooth curve.

```r title="Discrete bar versus continuous curve"
# Side-by-side: discrete bar chart vs continuous curve
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1))

# Left: Discrete — fair die probabilities
die_faces <- 1:6
die_probs <- rep(1/6, 6)
barplot(die_probs, names.arg = die_faces, col = "steelblue",
        main = "Discrete: Fair Die",
        xlab = "Face value", ylab = "Probability",
        ylim = c(0, 0.25))

# Right: Continuous — normal distribution curve
curve(dnorm(x, mean = 0, sd = 1), from = -4, to = 4,
      col = "tomato", lwd = 2,
      main = "Continuous: Normal(0,1)",
      xlab = "x", ylab = "Density")

par(mfrow = c(1, 1))
```

The left panel shows that each die face has an exact probability of 1/6. The right panel shows a smooth density curve, the height at any single point is *not* a probability (more on that in the PDF section below).

![Discrete random variables produce countable outcomes (bar chart); continuous random variables produce values on a real interval (smooth curve).](screenshots/Random-Variables-in-R-discrete-vs-continuous.webp)
*Figure 1: Discrete random variables produce countable outcomes (bar chart); continuous random variables produce values on a real interval (smooth curve).*

[WARNING]
**For continuous random variables, P(X = x) is always zero.** You must compute P(a < X < b), the probability of falling in a *range*, instead. This is the single most important distinction between discrete and continuous distributions.

**Try it:** Classify each of the following as discrete or continuous: (a) number of typos on a page, (b) waiting time at a bus stop, (c) shoe size in EU (36, 37, ..., 46). Store your answers in a character vector.

```r title="Exercise: classify discrete or continuous"
# Try it: classify as "discrete" or "continuous"
ex_types <- c(
  typos      = "___",  # (a)
  wait_time  = "___",  # (b)
  shoe_size  = "___"   # (c)
)
ex_types
#> Expected: "discrete", "continuous", "discrete"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Classify discrete or continuous solution"
ex_types <- c(
  typos      = "discrete",     # countable: 0, 1, 2, ...
  wait_time  = "continuous",   # any positive real number
  shoe_size  = "discrete"      # finite set: 36, 37, ..., 46
)
ex_types
#>       typos   wait_time   shoe_size
#> "discrete" "continuous"  "discrete"
```

**Explanation:** Typos are counted (0, 1, 2, ...), waiting time can be any positive value (3.27 minutes), and EU shoe sizes jump in whole numbers, so they are countable.

</details>

## What is a probability mass function (PMF)?

The probability mass function tells you the probability that a discrete random variable equals each of its possible values. Formally:

$$P(X = x) = p(x) \quad \text{for each possible } x$$

Two rules must hold: every probability is between 0 and 1, and all probabilities sum to exactly 1.

The most common discrete distribution is the **binomial**, it counts the number of successes in $n$ independent trials, each with success probability $p$. Its PMF is:

$$P(X = x) = \binom{n}{x} p^x (1-p)^{n-x}$$

Where:
- $n$ = number of trials
- $x$ = number of successes (0, 1, 2, ..., n)
- $p$ = probability of success on each trial

*If you're not interested in the math, skip to the code below, the practical R functions are all you need.*

In R, the `dbinom()` function computes this PMF. The "d" prefix stands for "density", but for discrete distributions it returns an actual probability.

```r title="Binomial probability mass function"
# Binomial PMF: 10 coin flips with P(heads) = 0.3
x_binom <- 0:10
pmf_binom <- dbinom(x_binom, size = 10, prob = 0.3)

# Display the probabilities
round(pmf_binom, 4)
#>  [1] 0.0282 0.1211 0.2335 0.2668 0.2001 0.1029 0.0368 0.0090 0.0014
#> [10] 0.0001 0.0000

# Verify they sum to 1
sum(pmf_binom)
#> [1] 1

# Plot the PMF
barplot(pmf_binom, names.arg = x_binom, col = "steelblue",
        main = "Binomial PMF: n=10, p=0.3",
        xlab = "Number of successes (x)",
        ylab = "P(X = x)")
```

The tallest bar is at $x = 3$, meaning 3 successes out of 10 is the single most likely outcome when $p = 0.3$. Notice how the bars drop off sharply after $x = 5$, getting 8 or more successes is nearly impossible with such a low success rate.

The Poisson distribution is another important discrete distribution. It counts events in a fixed interval (emails per hour, accidents per month) and has a single parameter $\lambda$ (lambda), the average rate.

```r title="Poisson probability mass function"
# Poisson PMF: average 5 events per interval
x_pois <- 0:15
pmf_pois <- dpois(x_pois, lambda = 5)

barplot(pmf_pois, names.arg = x_pois, col = "coral",
        main = "Poisson PMF: lambda = 5",
        xlab = "Number of events (x)",
        ylab = "P(X = x)")
```

The Poisson PMF is skewed right and peaks near $\lambda = 5$. Compared to the binomial, the Poisson has no upper limit on $x$, you could theoretically see 20 events, though the probability is vanishingly small.

[TIP]
**The d in dbinom() stands for density, but for discrete distributions it returns an actual probability, the value of the PMF at that point.** So `dbinom(3, 10, 0.3)` gives you exactly P(X = 3), which is 0.2668.

**Try it:** A basketball player makes 60% of free throws. What is the probability of making exactly 7 out of 10? Use `dbinom()`.

```r title="Exercise: free throw probability"
# Try it: free throw probability
ex_prob <- dbinom(___, size = ___, prob = ___)
ex_prob
#> Expected: approximately 0.215
```

<details>
<summary>Click to reveal solution</summary>

```r title="Free throw probability solution"
ex_prob <- dbinom(7, size = 10, prob = 0.6)
ex_prob
#> [1] 0.2149908
```

**Explanation:** `dbinom(7, 10, 0.6)` computes the binomial PMF at $x = 7$ with $n = 10$ trials and $p = 0.6$. There's about a 21.5% chance of making exactly 7 out of 10 free throws.

</details>

## What is a probability density function (PDF)?

For continuous random variables, individual point probabilities are zero, so instead of a PMF we use a **probability density function**. The PDF gives the *density* (the height of the curve), and probability comes from the *area under the curve* between two points:

$$P(a < X < b) = \int_a^b f(x)\,dx$$

Where:
- $f(x)$ = the PDF (density at point $x$)
- The integral computes the area under $f(x)$ from $a$ to $b$

Think of it like a hill: the PDF draws the shape of the hill, and the probability of landing between two points is the area of the slice between them.

The most famous continuous distribution is the **normal** (bell curve) with mean $\mu$ and standard deviation $\sigma$. In R, `dnorm()` computes the density and `pnorm()` computes the area (cumulative probability). Let's plot the standard normal PDF and shade the area between -1 and 1.

```r title="Normal density with shaded area"
# Normal PDF with shaded area between -1 and 1
x_norm <- seq(-4, 4, length.out = 500)
y_norm <- dnorm(x_norm)

plot(x_norm, y_norm, type = "l", lwd = 2, col = "tomato",
     main = "Normal PDF: Mean=0, SD=1",
     xlab = "x", ylab = "Density f(x)")

# Shade the area between -1 and 1
x_shade <- x_norm[x_norm >= -1 & x_norm <= 1]
y_shade <- dnorm(x_shade)
polygon(c(-1, x_shade, 1), c(0, y_shade, 0),
        col = rgb(1, 0.4, 0.4, 0.3), border = NA)

# The shaded area = P(-1 < X < 1)
pnorm(1) - pnorm(-1)
#> [1] 0.6826895
```

About 68.3% of the probability falls within one standard deviation of the mean, this is the famous **68-95-99.7 rule**. The shaded region shows this area visually.

A common misconception is that `dnorm(0)` gives you a probability. It does not, it gives you a density value.

```r title="Density versus tiny interval probability"
# dnorm(0) is a density, NOT a probability
dnorm(0)
#> [1] 0.3989423

# The actual probability of a tiny interval around 0
pnorm(0.01) - pnorm(-0.01)
#> [1] 0.007978846
```

The density at $x = 0$ is about 0.399, but the probability of $X$ falling in the tiny interval $(-0.01, 0.01)$ is only 0.008. As the interval shrinks, the probability approaches zero, which is why P(X = exactly 0) = 0 for continuous distributions.

[KEY INSIGHT]
**The PDF value can exceed 1, and that is perfectly fine.** For example, `dunif(0.5, min = 0, max = 0.5)` returns 2.0. Only the *total area* under the curve must equal 1, not the height at any point.

**Try it:** For a normal distribution with mean = 100 and sd = 15 (IQ scores), what fraction of people score between 85 and 115? Use `pnorm()`.

```r title="Exercise: IQ between eighty five and one fifteen"
# Try it: IQ scores between 85 and 115
ex_iq_prob <- pnorm(___, mean = 100, sd = 15) - pnorm(___, mean = 100, sd = 15)
ex_iq_prob
#> Expected: approximately 0.6827
```

<details>
<summary>Click to reveal solution</summary>

```r title="IQ interval probability solution"
ex_iq_prob <- pnorm(115, mean = 100, sd = 15) - pnorm(85, mean = 100, sd = 15)
ex_iq_prob
#> [1] 0.6826895
```

**Explanation:** 85 and 115 are each one standard deviation from the mean (100 ± 15). By the 68-95-99.7 rule, about 68.3% of people score in this range, exactly what `pnorm()` confirms.

</details>

## How does the CDF unify discrete and continuous distributions?

The cumulative distribution function works the same way for both types:

$$F(x) = P(X \le x)$$

It answers the question: "What is the probability that $X$ is *at most* $x$?" The CDF always starts at 0, ends at 1, and never decreases.

The difference is in the *shape*: discrete CDFs are staircase functions (flat between values, jumping at each possible value), while continuous CDFs are smooth S-shaped curves.

Let's plot both side by side.

```r title="Discrete versus continuous cumulative function"
# Side-by-side: discrete CDF (step) vs continuous CDF (smooth)
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1))

# Left: Binomial CDF — staircase
x_cdf <- 0:10
cdf_binom <- pbinom(x_cdf, size = 10, prob = 0.3)

plot(x_cdf, cdf_binom, type = "s", lwd = 2, col = "steelblue",
     main = "Discrete CDF: Binomial(10, 0.3)",
     xlab = "x", ylab = "F(x) = P(X ≤ x)",
     ylim = c(0, 1))
points(x_cdf, cdf_binom, pch = 19, col = "steelblue")

# Right: Normal CDF — smooth S-curve
x_cdf_norm <- seq(-4, 4, length.out = 500)
cdf_norm <- pnorm(x_cdf_norm)

plot(x_cdf_norm, cdf_norm, type = "l", lwd = 2, col = "tomato",
     main = "Continuous CDF: Normal(0, 1)",
     xlab = "x", ylab = "F(x) = P(X ≤ x)",
     ylim = c(0, 1))
abline(h = c(0, 1), lty = 3, col = "gray")

par(mfrow = c(1, 1))
```

The binomial CDF jumps at each integer, the jump height at $x$ equals the PMF value $P(X = x)$. The normal CDF rises smoothly because the random variable can take any value.

The **quantile function** is the inverse of the CDF: given a probability $p$, it finds the value $x$ such that $P(X \le x) = p$. R uses the `q` prefix for quantile functions.

```r title="Quantile function as inverse CDF"
# Quantile function: inverse CDF
# Normal: what value has 97.5% of data below it?
qnorm(0.975)
#> [1] 1.959964

# Binomial: what is the median of Binomial(10, 0.3)?
qbinom(0.5, size = 10, prob = 0.3)
#> [1] 3

# Useful: normal distribution critical values
qnorm(c(0.025, 0.975))  # 95% confidence interval bounds
#> [1] -1.959964  1.959964
```

The value 1.96 appears everywhere in statistics, it is the 97.5th percentile of the standard normal, which defines the bounds of a 95% confidence interval. The binomial median is 3, meaning half the time you get 3 or fewer successes out of 10 with $p = 0.3$.

[NOTE]
**R's p-prefix functions compute the CDF: pbinom(), pnorm(), ppois(), punif(). The q-prefix functions invert it.** This pair, CDF and inverse CDF, answers the two most common probability questions: "what probability?" and "what value?".

**Try it:** A Poisson(lambda=7) variable counts daily customer complaints. What is the probability of receiving at most 5 complaints? Use `ppois()`.

```r title="Exercise: poisson cumulative probability"
# Try it: Poisson CDF
ex_complaints <- ppois(___, lambda = ___)
ex_complaints
#> Expected: approximately 0.301
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson cumulative probability solution"
ex_complaints <- ppois(5, lambda = 7)
ex_complaints
#> [1] 0.3007083
```

**Explanation:** `ppois(5, 7)` computes $P(X \le 5)$ for a Poisson distribution with $\lambda = 7$. There is about a 30% chance of receiving 5 or fewer complaints when the average is 7.

</details>

## What is the d/p/q/r pattern and how do you use it for any distribution?

Every distribution in R follows the same naming convention with four function prefixes:

| Prefix | What it computes | Question it answers |
|--------|-----------------|---------------------|
| `d` | Density / mass | "How likely is this specific value?" |
| `p` | Cumulative probability (CDF) | "What is P(X ≤ x)?" |
| `q` | Quantile (inverse CDF) | "What value has this cumulative probability?" |
| `r` | Random generation | "Give me simulated draws from this distribution." |

Attach the prefix to any distribution name, `binom`, `norm`, `pois`, `unif`, `exp`, `t`, `chisq`, `gamma`, and you get the function. Let's see this consistency in action across four distributions.

```r title="The d p q r pattern across distributions"
# The d/p/q/r pattern works identically across distributions
# ---- Binomial(n=10, p=0.5) ----
dbinom(5, size = 10, prob = 0.5)  # P(X = 5)
#> [1] 0.2460938
pbinom(5, size = 10, prob = 0.5)  # P(X <= 5)
#> [1] 0.6230469
qbinom(0.5, size = 10, prob = 0.5) # median
#> [1] 5
set.seed(10); rbinom(5, size = 10, prob = 0.5) # 5 random draws
#> [1] 5 2 5 6 4

# ---- Normal(mean=0, sd=1) ----
dnorm(0)                           # density at 0
#> [1] 0.3989423
pnorm(1.96)                        # P(X <= 1.96)
#> [1] 0.9750021
qnorm(0.975)                       # 97.5th percentile
#> [1] 1.959964
set.seed(10); rnorm(5)             # 5 random draws
#> [1]  0.01874617 -0.18425254 -1.37133055 -0.59916772  0.29454513

# ---- Poisson(lambda=5) ----
dpois(3, lambda = 5)               # P(X = 3)
#> [1] 0.1403739
ppois(3, lambda = 5)               # P(X <= 3)
#> [1] 0.2650259
qpois(0.5, lambda = 5)             # median
#> [1] 5
set.seed(10); rpois(5, lambda = 5) # 5 random draws
#> [1] 5 4 3 4 5

# ---- Uniform(min=0, max=10) ----
dunif(3, min = 0, max = 10)        # density at 3
#> [1] 0.1
punif(7, min = 0, max = 10)        # P(X <= 7)
#> [1] 0.7
qunif(0.5, min = 0, max = 10)      # median
#> [1] 5
set.seed(10); runif(5, min = 0, max = 10) # 5 random draws
#> [1] 5.074782 3.068495 4.269371 6.931021 0.851507
```

Notice the pattern: no matter which distribution you use, the API is always `d___(value, params)`, `p___(value, params)`, `q___(probability, params)`, `r___(n, params)`. Learn it once, use it for any distribution.

Here is a quick reference table of common distributions in R:

| Distribution | R name | Key parameters | Typical use |
|---|---|---|---|
| Binomial | `binom` | `size`, `prob` | Count of successes in n trials |
| Poisson | `pois` | `lambda` | Count of events in a fixed interval |
| Normal | `norm` | `mean`, `sd` | Heights, IQ, measurement errors |
| Uniform | `unif` | `min`, `max` | Equally likely outcomes in a range |
| Exponential | `exp` | `rate` | Waiting time between events |
| Student's t | `t` | `df` | Small-sample means, confidence intervals |
| Chi-squared | `chisq` | `df` | Goodness-of-fit, independence tests |
| Gamma | `gamma` | `shape`, `rate` | Waiting time for multiple events |

![R's d/p/q/r naming pattern: every distribution has four functions that answer four different questions.](screenshots/Random-Variables-in-R-dpqr-pattern.webp)
*Figure 2: R's d/p/q/r naming pattern: every distribution has four functions that answer four different questions.*

[TIP]
**Memorise the d/p/q/r pattern once and you can work with any of R's 20+ built-in distributions instantly.** Type `?Distributions` in R to see the full list.

**Try it:** For a Uniform(0, 10) distribution, compute: (a) the density at x = 3, (b) P(X ≤ 7), (c) the median, (d) five random draws with `set.seed(55)`.

```r title="Exercise: uniform d p q r"
# Try it: Uniform(0, 10) — all four d/p/q/r functions
set.seed(55)
ex_d <- dunif(___, min = 0, max = 10)  # (a)
ex_p <- punif(___, min = 0, max = 10)  # (b)
ex_q <- qunif(___, min = 0, max = 10)  # (c)
ex_r <- runif(___, min = 0, max = 10)  # (d)

cat("Density:", ex_d, "\nCDF:", ex_p, "\nMedian:", ex_q, "\nDraws:", ex_r)
#> Expected: 0.1, 0.7, 5, five numbers between 0 and 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uniform d p q r solution"
set.seed(55)
ex_d <- dunif(3, min = 0, max = 10)
ex_p <- punif(7, min = 0, max = 10)
ex_q <- qunif(0.5, min = 0, max = 10)
ex_r <- runif(5, min = 0, max = 10)

cat("Density:", ex_d, "\nCDF:", ex_p, "\nMedian:", ex_q, "\nDraws:", ex_r)
#> Density: 0.1
#> CDF: 0.7
#> Median: 5
#> Draws: 4.642399 5.765795 6.753671 2.057192 6.705825
```

**Explanation:** The uniform density is constant at $1/(10-0) = 0.1$. The CDF at 7 is $7/10 = 0.7$. The median is the midpoint, 5. Random draws are uniformly spread across [0, 10].

</details>

## How do you simulate random variables and verify their distributions?

Simulation is the best way to build intuition about distributions. The idea is simple: generate a large number of random draws, plot a histogram, and compare it to the theoretical PMF or PDF. As the number of draws grows, the histogram converges to the true distribution, this is the **law of large numbers** in action.

Let's start with a discrete example. We'll draw 10,000 samples from a Binomial(10, 0.3) distribution and overlay the theoretical PMF.

```r title="Simulate binomial against theoretical pmf"
# Simulate 10,000 binomial draws and overlay theoretical PMF
set.seed(42)
sim_binom <- rbinom(10000, size = 10, prob = 0.3)

# Histogram of simulated data (as proportions)
hist(sim_binom, breaks = seq(-0.5, 10.5, 1), freq = FALSE,
     col = "lightblue", border = "white",
     main = "Simulated vs Theoretical: Binomial(10, 0.3)",
     xlab = "Number of successes", ylab = "Probability")

# Overlay theoretical PMF
x_overlay <- 0:10
points(x_overlay, dbinom(x_overlay, 10, 0.3),
       pch = 19, col = "red", cex = 1.5)
legend("topright", legend = c("Simulated", "Theoretical"),
       fill = c("lightblue", NA), pch = c(NA, 19),
       col = c("lightblue", "red"), border = c("white", NA))
```

The red dots (theoretical PMF) sit right on top of the histogram bars. With 10,000 draws, the simulation closely matches the theory.

Now let's do the same for a continuous distribution. We'll simulate 10,000 IQ scores from a Normal(100, 15) distribution.

```r title="Simulate normal against theoretical pdf"
# Simulate 10,000 normal draws and overlay theoretical PDF
set.seed(99)
sim_norm <- rnorm(10000, mean = 100, sd = 15)

hist(sim_norm, breaks = 50, freq = FALSE,
     col = "lightyellow", border = "white",
     main = "Simulated vs Theoretical: Normal(100, 15)",
     xlab = "IQ Score", ylab = "Density")

# Overlay theoretical PDF
curve(dnorm(x, mean = 100, sd = 15), add = TRUE,
      col = "tomato", lwd = 2)
```

The smooth red curve fits the histogram beautifully. This is the power of simulation, you can *see* the distribution come alive from random draws.

How many draws do you need before the histogram looks right? Let's compare 100, 1,000, and 10,000 samples.

```r title="Convergence by sample size"
# Convergence demo: how sample size affects the histogram
par(mfrow = c(1, 3), mar = c(4, 4, 3, 1))

for (n in c(100, 1000, 10000)) {
  set.seed(77)
  draws <- rnorm(n, mean = 0, sd = 1)
  hist(draws, breaks = 30, freq = FALSE,
       col = "lightblue", border = "white",
       main = paste("n =", n),
       xlab = "x", ylab = "Density",
       xlim = c(-4, 4), ylim = c(0, 0.45))
  curve(dnorm(x), add = TRUE, col = "tomato", lwd = 2)
}

par(mfrow = c(1, 1))
```

With $n = 100$, the histogram is lumpy and rough. At $n = 1{,}000$, the bell shape is clear. By $n = 10{,}000$, the histogram is nearly indistinguishable from the theoretical curve. More samples always gives a better picture.

[WARNING]
**Always call set.seed() before random generation if you want reproducible results.** Without it, every run gives different numbers, which makes debugging and sharing results much harder.

**Try it:** Simulate 5,000 draws from Poisson(lambda=4), plot a histogram, and check that the sample mean is close to 4.

```r title="Exercise: poisson simulation histogram"
# Try it: Poisson simulation
set.seed(200)
ex_sim <- rpois(5000, lambda = 4)
hist(ex_sim, breaks = seq(-0.5, max(ex_sim) + 0.5, 1),
     col = "coral", border = "white",
     main = "Poisson(4) Simulation",
     xlab = "Number of events")
mean(ex_sim)
#> Expected: close to 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson simulation solution"
set.seed(200)
ex_sim <- rpois(5000, lambda = 4)
hist(ex_sim, breaks = seq(-0.5, max(ex_sim) + 0.5, 1),
     col = "coral", border = "white",
     main = "Poisson(4) Simulation",
     xlab = "Number of events")
mean(ex_sim)
#> [1] 3.9938
```

**Explanation:** The sample mean of 3.99 is very close to the theoretical mean $\lambda = 4$. The histogram shows the characteristic right-skewed shape of the Poisson distribution.

</details>

## Practice Exercises

### Exercise 1: Simulate and verify a binomial distribution

Generate 10,000 samples from Binomial(20, 0.4). Plot the histogram (as proportions) and overlay the theoretical PMF as red points. Compute the sample mean and compare it to the theoretical mean ($n \times p = 8$).

```r title="Exercise: binomial simulation and verification"
# Exercise 1: Binomial simulation and verification
# Hint: use rbinom(), hist(freq = FALSE), and points() with dbinom()
set.seed(300)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Binomial simulation solution"
set.seed(300)
my_binom <- rbinom(10000, size = 20, prob = 0.4)

hist(my_binom, breaks = seq(-0.5, 20.5, 1), freq = FALSE,
     col = "lightblue", border = "white",
     main = "Binomial(20, 0.4): Simulated vs Theoretical",
     xlab = "Number of successes", ylab = "Probability")

points(0:20, dbinom(0:20, 20, 0.4), pch = 19, col = "red", cex = 1.3)

cat("Sample mean:", mean(my_binom), "\nTheoretical mean:", 20 * 0.4)
#> Sample mean: 7.9908
#> Theoretical mean: 8
```

**Explanation:** The sample mean of ~8.0 matches the theoretical mean $n \times p = 20 \times 0.4 = 8$. The red PMF points align closely with the histogram bars, confirming the simulation is correct.

</details>

### Exercise 2: Multiple-choice exam, binomial probabilities

An exam has 30 multiple-choice questions, each with 4 options. A student guesses randomly on all of them. Compute: (a) the probability of passing (≥15 correct), (b) the expected score, (c) the probability of getting exactly the expected score. Use binomial functions.

```r title="Exercise: multiple choice exam probabilities"
# Exercise 2: Multiple-choice exam probabilities
# Hint: n=30, p=1/4=0.25
# (a) P(X >= 15) = 1 - P(X <= 14) — use pbinom with lower.tail
# (b) Expected value = n * p
# (c) P(X = expected) — use dbinom

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Multiple choice exam solution"
n_questions <- 30
p_guess <- 1/4

# (a) Probability of passing (>= 15 correct)
my_pass_prob <- 1 - pbinom(14, size = n_questions, prob = p_guess)
cat("P(pass):", my_pass_prob)
#> P(pass): 0.0003233539

# (b) Expected score
my_expected <- n_questions * p_guess
cat("\nExpected score:", my_expected)
#> Expected score: 7.5

# (c) P(X = expected score = 7.5) — but X must be an integer!
# Closest integers are 7 and 8
cat("\nP(X = 7):", dbinom(7, n_questions, p_guess))
#> P(X = 7): 0.1593222
cat("\nP(X = 8):", dbinom(8, n_questions, p_guess))
#> P(X = 8): 0.1332102
```

**Explanation:** The chance of passing by guessing is tiny, about 0.03%. The expected score is 7.5, but since the number correct must be a whole number, we check both 7 and 8. Each has about a 15% probability. This exercise highlights that the expected value doesn't have to be a possible outcome.

</details>

### Exercise 3: Exponential lifetime analysis

A machine part's lifetime follows an Exponential distribution with rate = 0.01 (mean = 100 hours). Compute: (a) P(lifetime > 150 hours), (b) the median lifetime, (c) simulate 5,000 lifetimes and plot a histogram with the theoretical PDF overlaid.

```r title="Exercise: exponential lifetime probabilities"
# Exercise 3: Exponential distribution
# Hint: use pexp(), qexp(), rexp() with rate = 0.01
# For P(X > 150), remember P(X > x) = 1 - P(X <= x)

set.seed(500)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential lifetime solution"
my_rate <- 0.01

# (a) P(lifetime > 150 hours)
my_surv_prob <- 1 - pexp(150, rate = my_rate)
cat("P(lifetime > 150):", my_surv_prob)
#> P(lifetime > 150): 0.2231302

# (b) Median lifetime
my_median <- qexp(0.5, rate = my_rate)
cat("\nMedian lifetime:", my_median, "hours")
#> Median lifetime: 69.31472 hours

# (c) Simulate and plot
set.seed(500)
my_lifetimes <- rexp(5000, rate = my_rate)
hist(my_lifetimes, breaks = 50, freq = FALSE,
     col = "lightyellow", border = "white",
     main = "Exponential(rate=0.01): Simulated Lifetimes",
     xlab = "Lifetime (hours)", ylab = "Density")
curve(dexp(x, rate = my_rate), add = TRUE, col = "tomato", lwd = 2)
```

**Explanation:** About 22.3% of parts survive past 150 hours. The median (69.3 hours) is less than the mean (100 hours) because the exponential distribution is right-skewed, most parts fail relatively early, but a long tail of parts lasts much longer.

</details>

## Putting It All Together

Let's combine everything we've learned in a realistic scenario. Suppose a small website receives an average of 50 visits per day, and we model daily visits as a Poisson random variable with $\lambda = 50$.

```r title="End-to-end poisson website visits"
# === Complete Example: Poisson Model for Website Visits ===
lambda <- 50

# Q1: What is the probability of 40 or fewer visits?
p_low <- ppois(40, lambda = lambda)
cat("P(visits <= 40):", round(p_low, 4))
#> P(visits <= 40): 0.0871

# Q2: What is the probability of more than 60 visits?
p_high <- 1 - ppois(60, lambda = lambda)
cat("\nP(visits > 60):", round(p_high, 4))
#> P(visits > 60): 0.0722

# Q3: What is the probability of 45-55 visits (near average)?
p_mid <- ppois(55, lambda) - ppois(44, lambda)
cat("\nP(45 <= visits <= 55):", round(p_mid, 4))
#> P(45 <= visits <= 55): 0.6006

# Q4: What is the 90th percentile? (How many visits on a busy day?)
q90 <- qpois(0.90, lambda = lambda)
cat("\n90th percentile:", q90, "visits")
#> 90th percentile: 59 visits

# Q5: Simulate one year of daily visits
set.seed(2026)
sim_visits <- rpois(365, lambda = lambda)

# Plot the simulated year
hist(sim_visits, breaks = 25, freq = FALSE,
     col = "lightblue", border = "white",
     main = "365 Days of Website Visits: Poisson(50)",
     xlab = "Daily visits", ylab = "Density")

# Overlay theoretical PMF
x_range <- 30:75
points(x_range, dpois(x_range, lambda), pch = 19, col = "red", cex = 0.8)

# Compare sample stats to theoretical
cat("\n\nSample mean:", round(mean(sim_visits), 2),
    " | Theoretical:", lambda)
#> Sample mean: 50.12  | Theoretical: 50

cat("\nSample SD:", round(sd(sim_visits), 2),
    " | Theoretical:", round(sqrt(lambda), 2))
#> Sample SD: 7.23  | Theoretical: 7.07
```

The sample mean (50.1) and standard deviation (7.2) closely match the theoretical values (50 and 7.07). For a Poisson distribution, both the mean and variance equal $\lambda$, so $SD = \sqrt{\lambda} = \sqrt{50} \approx 7.07$.

The histogram shows that most days see between 40 and 60 visits, with a 90th percentile at 59, meaning only about 10% of days exceed 59 visits. This kind of analysis helps website owners plan server capacity and set realistic traffic expectations.

## Summary

| Concept | Discrete | Continuous | R Function Prefix |
|---|---|---|---|
| Probability at a point | PMF: $P(X = x)$, gives actual probabilities | PDF: $f(x)$, gives density, not probability | `d` (dbinom, dnorm, dpois, ...) |
| Cumulative probability | CDF: $P(X \le x)$, staircase function | CDF: $P(X \le x)$, smooth S-curve | `p` (pbinom, pnorm, ppois, ...) |
| Inverse CDF (quantile) | Smallest $x$ where $F(x) \ge p$ | Value $x$ where $F(x) = p$ | `q` (qbinom, qnorm, qpois, ...) |
| Random generation | Simulated integer draws | Simulated real-valued draws | `r` (rbinom, rnorm, rpois, ...) |

**Key takeaways:**

1. A random variable maps experiment outcomes to numbers, discrete if countable, continuous if uncountable
2. Discrete distributions use PMFs (bar charts); continuous distributions use PDFs (smooth curves)
3. The CDF works for both types and answers "what is P(X ≤ x)?"
4. R's d/p/q/r naming convention gives you four tools for every distribution, learn the pattern once, apply it everywhere
5. Simulation with r-prefix functions lets you verify theory and build intuition

![Overview of random variable concepts: from experiment to outcome to PMF/PDF and CDF.](screenshots/Random-Variables-in-R-concept-overview.webp)
*Figure 3: Overview of random variable concepts: from experiment to outcome to PMF/PDF and CDF.*

## References

1. R Core Team, *An Introduction to R*, Ch. 8: Probability distributions. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Probability-distributions)
2. Dekking, F.M. et al., *A Modern Introduction to Probability and Statistics*. Springer (2005).
3. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
4. CRAN, Distributions task view. [Link](https://cran.r-project.org/web/views/Distributions.html)
5. Rice, J.A., *Mathematical Statistics and Data Analysis*, 3rd Edition. Cengage (2006).
6. R Documentation, `?Distributions` (base R). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)
7. Kross, S., *Introduction to dnorm, pnorm, qnorm, and rnorm*. [Link](https://seankross.com/notes/dpqr/)
8. Probability Course, *CDF and PDF*. [Link](https://www.probabilitycourse.com/chapter3/3_2_1_cdf.php)

## Continue Learning

1. [Probability Axioms in R](Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html), Prove the three rules of probability through hands-on Monte Carlo simulation before touching any formula.
2. [Conditional Probability in R](Conditional-Probability-in-R.html), Master P(A|B), independence tests, and Bayes' theorem with interactive R code.
3. [Linear Regression](Linear-Regression.html), See how random variables and probability distributions underpin regression modelling and prediction intervals.

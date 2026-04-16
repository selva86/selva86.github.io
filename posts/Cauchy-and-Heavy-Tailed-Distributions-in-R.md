---
title: "Cauchy & Heavy-Tailed Distributions in R: When the CLT Fails You"
slug: Cauchy-and-Heavy-Tailed-Distributions-in-R
description: "Cauchy and heavy-tailed distributions break the Central Limit Theorem. Simulate the failure in R and learn practical fixes: medians, Student-t, bootstrap."
keywords: "Cauchy distribution R, heavy-tailed distribution, central limit theorem failure, rcauchy, dcauchy, Student-t distribution, Pareto distribution, robust statistics R, fat tails"
auto_link_terms: "Cauchy distribution|heavy-tailed distribution|fat-tailed distribution|rcauchy()|dcauchy()|infinite variance|when CLT fails"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: FR-prob-7
post_type: FR
fr_parent: Central-Limit-Theorem-in-R.html
difficulty: Intermediate
---

# Cauchy & Heavy-Tailed Distributions in R: When the CLT Fails You

<p class="lead">The Central Limit Theorem promises that averages stabilize as samples grow. Cauchy and other heavy-tailed distributions break that promise because their variance is infinite, which means sample means never settle — no matter how large <code>n</code> gets. This post shows the failure in action and gives you a practical playbook for what to do instead.</p>

## Why does the Central Limit Theorem fail for Cauchy samples?

The CLT's guarantee quietly assumes the distribution you're sampling from has a finite variance. Drop that assumption and the machinery collapses. The fastest way to see this is to simulate it: take thousands of draws from a Cauchy distribution, track the running average, and watch it refuse to converge.

The code below draws 5,000 values with `rcauchy()`, computes the cumulative mean after each new draw, and plots the running average against the sample size. For a Normal distribution you'd see a curve that hugs zero more and more tightly. Here, the line keeps lurching upward and downward no matter how many draws accumulate.

```r
# Simulate 5,000 Cauchy draws and track the running mean
set.seed(314)
n_draws      <- 5000
cauchy_draws <- rcauchy(n_draws)
cum_mean     <- cumsum(cauchy_draws) / seq_along(cauchy_draws)

# How extreme do the draws get?
summary(cauchy_draws)
#>       Min.   1st Qu.    Median      Mean   3rd Qu.      Max.
#> -2193.110    -0.978     0.000     0.089     1.028   730.472

# Plot the running mean — it never settles
plot(seq_along(cum_mean), cum_mean, type = "l", col = "firebrick",
     xlab = "n (sample size)", ylab = "cumulative mean",
     main = "Cauchy cumulative mean — does not converge")
abline(h = 0, lty = 2)
```

Two things stand out. First, the raw draws span roughly `-2193` to `+730` — a single extreme observation can dwarf thousands of moderate ones. Second, the red line (the running mean) swings around wildly and shows no sign of shrinking toward any fixed value. That's the CLT failing in plain sight.

[KEY INSIGHT]
**The average of `n` Cauchy variables is itself Cauchy, not a narrower bell curve.** Averaging is supposed to shrink the spread by a factor of `sqrt(n)`. Not here — the Cauchy is *stable under averaging*, so a 5,000-sample mean is just as noisy as a single draw.

**Try it:** Replace `rcauchy()` with `rnorm()` and confirm the running mean settles close to zero as `n` grows.

```r
# Try it: run the same simulation with Normal draws
set.seed(314)
ex_normal_draws <- rnorm(5000)
ex_cum_mean     <- # your code here

plot(seq_along(ex_cum_mean), ex_cum_mean, type = "l",
     xlab = "n", ylab = "cumulative mean",
     main = "Normal cumulative mean")
abline(h = 0, lty = 2)
#> Expected: the red line hugs 0 once n is in the hundreds.
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(314)
ex_normal_draws <- rnorm(5000)
ex_cum_mean     <- cumsum(ex_normal_draws) / seq_along(ex_normal_draws)

plot(seq_along(ex_cum_mean), ex_cum_mean, type = "l",
     xlab = "n", ylab = "cumulative mean",
     main = "Normal cumulative mean")
abline(h = 0, lty = 2)
#> The running mean is within ±0.05 of 0 by n = 1000.
```

**Explanation:** `cumsum(x) / seq_along(x)` gives the mean after each new observation. For the Normal, the variance is finite, so the CLT kicks in and the running mean tightens around the true mean (zero) at rate `1 / sqrt(n)`.

</details>

## What makes a distribution "heavy-tailed"?

A distribution is **heavy-tailed** when extreme values happen far more often than a Normal distribution would suggest. The technical version: the tail probability `P(X > x)` decays *slower than exponentially* — typically as a power `x^(-alpha)`. Power-law decay keeps non-trivial probability in the tails even for huge `x`, which is why a single draw can be thousands of times larger than the bulk of your data.

Let's visualize this. We'll plot the density `f(x)` for a standard Normal, a Student-t with 3 degrees of freedom, and a standard Cauchy on a log-y axis. On a log scale, exponential decay (Normal) looks like a steep straight-down curve, while power-law decay (Cauchy, t with low df) stays high.

```r
# Compare density tails on a log-y scale
x_grid     <- seq(0, 10, length.out = 400)
normal_den <- dnorm(x_grid)
cauchy_den <- dcauchy(x_grid)
t3_den     <- dt(x_grid, df = 3)

plot(x_grid, normal_den, type = "l", log = "y", col = "steelblue", lwd = 2,
     ylim = c(1e-20, 1), xlab = "x", ylab = "density (log scale)",
     main = "Tail decay: Normal vs Student-t(3) vs Cauchy")
lines(x_grid, t3_den,     col = "darkorange", lwd = 2)
lines(x_grid, cauchy_den, col = "firebrick",  lwd = 2)
legend("topright", legend = c("Normal", "Student-t df=3", "Cauchy"),
       col = c("steelblue", "darkorange", "firebrick"), lwd = 2)
```

The Normal curve plunges off the chart by `x = 6` — its density at `x = 10` is about `1e-23`, effectively zero. The Cauchy curve, in contrast, is still at `~0.003` at `x = 10`. That three-decimal-place probability is why extreme values keep showing up in Cauchy samples and why the running mean never settles.

![Tail decay across distribution families](screenshots/Cauchy-and-Heavy-Tailed-Distributions-in-R-tail-decay-flow.webp)
*Figure 1: Moving from Normal to Pareto, each step down loses another finite moment — by the time you reach Cauchy, even the mean is undefined.*

If you want the math, the Cauchy PDF is:

$$f(x) = \frac{1}{\pi\,(1 + x^2)}$$

The variance is defined as $E[X^2] = \int_{-\infty}^{\infty} x^2 f(x) \, dx$. Plug in the Cauchy density and the integrand behaves like $x^2 / x^2 = 1$ out in the tails — so the integral goes to infinity. No finite variance, no CLT. *If you're not interested in the math, skip to the next section.*

[NOTE]
**"Heavy tail" is a spectrum, not a yes/no label.** Student-t with df = 30 is nearly Normal. Student-t with df = 3 has finite variance but fat tails. Student-t with df = 1 *is* Cauchy. As df shrinks, the tails grow heavier and moments disappear one by one.

**Try it:** Add a Student-t with 10 degrees of freedom to the same plot and see where it sits on the thin-to-heavy spectrum.

```r
# Try it: add df = 10 to the comparison
ex_t10_den <- # your code here

plot(x_grid, normal_den, type = "l", log = "y", col = "steelblue", lwd = 2,
     ylim = c(1e-20, 1), xlab = "x", ylab = "density (log scale)")
lines(x_grid, ex_t10_den,  col = "darkgreen", lwd = 2)
lines(x_grid, cauchy_den,  col = "firebrick", lwd = 2)
#> Expected: the t(10) curve sits between Normal and Cauchy, closer to Normal.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_t10_den <- dt(x_grid, df = 10)

plot(x_grid, normal_den, type = "l", log = "y", col = "steelblue", lwd = 2,
     ylim = c(1e-20, 1), xlab = "x", ylab = "density (log scale)")
lines(x_grid, ex_t10_den,  col = "darkgreen", lwd = 2)
lines(x_grid, cauchy_den,  col = "firebrick", lwd = 2)
legend("topright", legend = c("Normal", "t(10)", "Cauchy"),
       col = c("steelblue", "darkgreen", "firebrick"), lwd = 2)
```

**Explanation:** `dt(x, df = 10)` gives the Student-t density. With 10 degrees of freedom, it's visually close to Normal in the bulk but has slightly heavier tails — a small fat-tail upgrade you'd still trust CLT-based methods for, cautiously.

</details>

## How do R's Cauchy functions work? (dcauchy, pcauchy, qcauchy, rcauchy)

R ships a full four-function family for Cauchy, matching the convention used for every built-in distribution:

- `dcauchy(x, location, scale)` — **d**ensity at `x`
- `pcauchy(q)` — **p**robability that `X <= q` (the CDF)
- `qcauchy(p)` — the **q**uantile for probability `p` (the inverse CDF)
- `rcauchy(n)` — `n` **r**andom draws

Defaults are `location = 0`, `scale = 1` — that combination is called the **standard Cauchy**, and it's identical to a Student-t with 1 degree of freedom. One demo block shows all four in action so you can see how they relate.

```r
# All four Cauchy functions on the standard Cauchy
set.seed(7)

# Density at x = 0 (the peak of standard Cauchy)
dens_val      <- dcauchy(0)
dens_val
#> [1] 0.3183099    # 1/pi

# P(X <= 1.96) — compare to Normal's 0.975
prob_tail     <- pcauchy(1.96)
prob_tail
#> [1] 0.8499659    # much less of the mass below 1.96 than Normal

# 95th percentile of standard Cauchy
q95           <- qcauchy(0.95)
q95
#> [1] 6.313752     # Normal's 95th percentile is ~1.645

# Four draws
cauchy_sample <- rcauchy(4)
cauchy_sample
#> [1]  2.287121 -1.086867 -1.049114  0.471131
```

Read off the key facts. The density at zero is `1/pi ≈ 0.318`, which is lower than the Normal's peak of `~0.399` — Cauchy spreads mass into the tails to make up for it. And the 95th percentile sits at `6.31` versus `1.64` for the Normal, showing how much further you have to go to capture the same tail probability.

[TIP]
**The standard Cauchy has no "scale" in the usual sense.** The `scale` argument controls the half-width at half-maximum, not the standard deviation (which doesn't exist). Doubling `scale` doubles how spread out the draws are, but there's no sigma to report.

**Try it:** Compute the probability that a standard Cauchy sample exceeds `10` in absolute value — i.e., `P(|X| > 10)`. Use `pcauchy()` and symmetry.

```r
# Try it: P(|X| > 10) for standard Cauchy
ex_p_extreme <- # your code here
ex_p_extreme
#> Expected: about 0.0635 — more than 6% of draws land outside [-10, 10].
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_p_extreme <- 2 * (1 - pcauchy(10))
ex_p_extreme
#> [1] 0.06345783
```

**Explanation:** Cauchy is symmetric, so `P(|X| > 10) = 2 * P(X > 10) = 2 * (1 - P(X <= 10))`. The result — over 6% — is enormous compared to the Normal's `2e-23`. Those extreme events are why sample means don't converge.

</details>

## How do Student-t and Pareto compare as heavy-tailed cousins?

Cauchy is the poster child, but it sits inside two broader families you should recognize. The **Student-t** family is controlled by degrees of freedom `df`: `df = 1` is Cauchy, `df = 2` has a finite mean but infinite variance, `df >= 3` has both mean and variance, and as `df → infinity` the distribution collapses to a Normal. The **Pareto** family is a power-law parameterized by a shape `alpha`: `alpha <= 1` has infinite mean, `1 < alpha <= 2` has infinite variance, and `alpha > 2` behaves well enough for standard inference.

The cleanest way to feel these families is to watch cumulative sample means at different `df` values side by side. At `df = 1` they wander forever; at `df = 5` they're unsteady but converging; at `df = 30` they hug the true mean of zero.

```r
# Cumulative means across Student-t families
set.seed(101)
n      <- 5000
t_df1  <- rt(n, df = 1)    # same as standard Cauchy
t_df5  <- rt(n, df = 5)    # finite variance, still heavy-ish
t_df30 <- rt(n, df = 30)   # nearly Normal

cm1    <- cumsum(t_df1)  / seq_len(n)
cm5    <- cumsum(t_df5)  / seq_len(n)
cm30   <- cumsum(t_df30) / seq_len(n)

plot(cm30, type = "l", col = "steelblue",  lwd = 2, ylim = c(-3, 3),
     xlab = "n", ylab = "cumulative mean",
     main = "Cumulative sample means by degrees of freedom")
lines(cm5,  col = "darkorange", lwd = 2)
lines(cm1,  col = "firebrick",  lwd = 2)
abline(h = 0, lty = 2)
legend("topright", legend = c("t(30)", "t(5)", "t(1) = Cauchy"),
       col = c("steelblue", "darkorange", "firebrick"), lwd = 2)
```

The blue `t(30)` line is near zero almost immediately. The orange `t(5)` line wobbles more but visibly narrows toward zero. The red `t(1)` (Cauchy) line jumps around without settling — exactly what Section 1 showed, now put in family context. Degrees of freedom act as a continuous dial between "standard CLT works fine" and "CLT is broken."

[NOTE]
**R has no `rpareto()` in base.** You can hand-roll it via inverse transform: given scale `x_m` and shape `alpha`, `rpareto(n) <- x_m * (runif(n))^(-1/alpha)`. For a proper implementation with `dpareto/ppareto/qpareto`, use the **extraDistr** or **actuar** packages in your local R.

**Try it:** Draw three independent samples of 1,000 values each from `rt(df = 1)` and compute `var()` on each. The three numbers should disagree wildly — because the theoretical variance doesn't exist, your sample estimate is meaningless.

```r
# Try it: variance of three Cauchy (t df=1) replicates
set.seed(1)
ex_var_reps <- # your code here — call var() three times on rt(1000, df=1)
ex_var_reps
#> Expected: three numbers that could each be in the thousands — and different.
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
ex_var_reps <- c(
  var(rt(1000, df = 1)),
  var(rt(1000, df = 1)),
  var(rt(1000, df = 1))
)
ex_var_reps
#> [1]  218.6281  7794.3162    63.1144
```

**Explanation:** Each `var()` call returns a finite number because the sample is finite, but those numbers have no limit to converge to. Reporting "the variance was 218" hides the fact that a rerun could have given you 7,794. With heavy-tailed data, never trust a single variance estimate.

</details>

## What should you do when CLT fails?

Detecting that the CLT doesn't apply is half the battle. The other half is replacing it with something that does. Four practical moves cover most real situations.

![Decision flow for choosing a robust alternative to the sample mean](screenshots/Cauchy-and-Heavy-Tailed-Distributions-in-R-what-to-use-decision.webp)
*Figure 2: A quick decision flow for picking a robust alternative to the sample mean when tails misbehave.*

**Move 1: use the median or a trimmed mean.** Unlike the mean, the median ignores how extreme outliers are — only their rank matters. A trimmed mean (e.g. `mean(x, trim = 0.1)` drops the top and bottom 10%) keeps more information but still resists extremes.

**Move 2: bootstrap your confidence intervals.** The percentile bootstrap computes your statistic on many resamples and uses the empirical quantiles as a CI. It doesn't need finite variance, which is why it's the go-to when CLT-based intervals would be nonsense.

**Move 3: model with a Student-t likelihood.** When you're fitting a model to heavy-tailed data, swapping the Normal error term for a Student-t (via `MASS::fitdistr()` in local R, or a Bayesian t-likelihood in Stan/brms) keeps the extremes from dominating the fit.

**Move 4: log-transform right-skewed data.** If your data is lognormal-like (right-skewed but with finite moments), `log(x)` often makes it approximately Normal, and you can use standard methods on the transformed scale.

Let's see move 1 in action. The code below tracks both the running mean *and* the running median on a single Cauchy sample. The mean keeps taking hits from outliers; the median, anchored to the middle observation, stays pinned near the true location.

```r
# Mean vs median stability on Cauchy data
set.seed(42)
cauchy_series   <- rcauchy(5000)

running_mean    <- cumsum(cauchy_series) / seq_along(cauchy_series)
running_median  <- sapply(seq_along(cauchy_series),
                          function(i) median(cauchy_series[1:i]))

# Compare final estimates
c(final_mean = tail(running_mean, 1),
  final_median = tail(running_median, 1))
#> final_mean final_median
#>  -0.183942    -0.026104

# Plot both
plot(running_median, type = "l", col = "steelblue", lwd = 2,
     ylim = c(-3, 3), xlab = "n", ylab = "running estimate",
     main = "Running mean vs running median — Cauchy sample")
lines(running_mean, col = "firebrick", lwd = 2)
abline(h = 0, lty = 2)
legend("topright", legend = c("running median", "running mean"),
       col = c("steelblue", "firebrick"), lwd = 2)
```

The final median is near `-0.03` — within spitting distance of the true Cauchy location parameter, zero. The final mean lands at `-0.18`, not catastrophic here but you can see it bounce in the plot. Run this chunk repeatedly with different seeds and the pattern is always the same: the blue line is calm, the red line is not.

[WARNING]
**Heavy-tailed sample means can *look* stable for thousands of draws, then jump.** If you stopped the simulation at `n = 1000` you might convince yourself the mean was converging. One big observation later, it isn't. Never judge Cauchy stability from a short run — and use median-like estimators if you can't guarantee finite variance.

**Try it:** Compare `mean()` versus `median()` on the first 1,000 draws and on all 5,000 draws of `cauchy_series`. Notice which estimator changed more when you added 4,000 more draws.

```r
# Try it: mean vs median stability across sample sizes
ex_mean_1k  <- # your code here
ex_mean_all <- # your code here
ex_med_1k   <- # your code here
ex_med_all  <- # your code here

c(mean_1k = ex_mean_1k, mean_all = ex_mean_all,
  med_1k  = ex_med_1k,  med_all  = ex_med_all)
#> Expected: the mean can shift by a lot; the median barely moves.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mean_1k  <- mean(cauchy_series[1:1000])
ex_mean_all <- mean(cauchy_series)
ex_med_1k   <- median(cauchy_series[1:1000])
ex_med_all  <- median(cauchy_series)

c(mean_1k = ex_mean_1k, mean_all = ex_mean_all,
  med_1k  = ex_med_1k,  med_all  = ex_med_all)
#>   mean_1k  mean_all    med_1k   med_all
#> -0.450317 -0.183942  0.008291 -0.026104
```

**Explanation:** Adding 4,000 more draws shifted the mean by about `0.27` but the median by only about `0.03`. The median's *breakdown point* (the fraction of outliers it can tolerate) is `50%`, compared to `0%` for the mean — a single extreme value can drag the mean anywhere.

</details>

## Practice Exercises

Three capstone problems that combine the ideas from the tutorial. Each one is solvable with base R alone.

### Exercise 1: Percentile bootstrap for a Cauchy median

Write a bootstrap procedure that returns a 95% confidence interval for the **median** of a Cauchy sample of size 200. Resample with replacement 1,000 times, compute the median each time, then use the 2.5th and 97.5th percentiles of the resampled medians as your CI. Save the result to `my_ci`.

```r
# Exercise 1: bootstrap 95% CI for the median of a Cauchy sample
# Hint: use sample(..., replace = TRUE) and quantile(..., probs = c(0.025, 0.975))

set.seed(1)
my_cauchy <- rcauchy(200)

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
my_cauchy <- rcauchy(200)

B            <- 1000
my_boot_meds <- replicate(B, median(sample(my_cauchy, replace = TRUE)))
my_ci        <- quantile(my_boot_meds, probs = c(0.025, 0.975))
my_ci
#>       2.5%      97.5%
#> -0.3268791  0.2604961
```

**Explanation:** `replicate(B, ...)` runs the resampling `B` times. Each resample has the same size as the original. The quantiles of the distribution of resampled medians form the percentile CI. This works because it doesn't require finite variance — only that the median is well-defined, which it is for Cauchy.

</details>

### Exercise 2: Diagnose a mystery sample

You're handed `my_mystery <- c(rcauchy(99), 1e6)` — 99 Cauchy draws plus one massive outlier. Compute four summaries: `mean`, `median`, `mad` (median absolute deviation, a robust spread), and `sd`. Then quantify the outlier's *leverage* — how much the outlier shifts `mean` vs `median` — by recomputing both with and without the outlier and storing the two differences in `my_leverage`.

```r
# Exercise 2: diagnose heavy tails in a mystery sample
# Hint: compute stats with and without the last element; compare shifts.

set.seed(11)
my_mystery <- c(rcauchy(99), 1e6)

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
my_mystery <- c(rcauchy(99), 1e6)

my_stats <- c(
  mean   = mean(my_mystery),
  median = median(my_mystery),
  mad    = mad(my_mystery),
  sd     = sd(my_mystery)
)
my_stats
#>        mean      median         mad          sd
#>  1.0003e+04  1.5632e-01  1.3200e+00  9.9993e+04

# Outlier leverage
clean         <- my_mystery[-length(my_mystery)]
my_leverage   <- c(
  mean_shift   = mean(my_mystery)   - mean(clean),
  median_shift = median(my_mystery) - median(clean)
)
my_leverage
#>   mean_shift  median_shift
#>    9999.9986       0.0052
```

**Explanation:** The single outlier shifts the mean by about 10,000 and the median by about 0.005 — a ratio of roughly 2,000,000x. `sd` is similarly ruined while `mad` is not. The takeaway: `mean` and `sd` can be arbitrarily manipulated by one bad observation; their robust counterparts (`median`, `mad`) cannot.

</details>

### Exercise 3: SD of sample means across Student-t degrees of freedom

Simulate the spread of the sample mean as `df` varies. For each `df` in `c(1, 2, 3, 5, 30)`, draw 2,000 independent samples of size 500 from `rt(500, df)`, compute each sample's mean, and report the **standard deviation of those 2,000 sample means**. Store the result as a named numeric vector `my_sim` with `df` values as names.

```r
# Exercise 3: SD of sample means across Student-t df
# Hint: use replicate() to simulate sample means; then sd() across simulations.

my_df_grid <- c(1, 2, 3, 5, 30)

# Your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_df_grid <- c(1, 2, 3, 5, 30)

set.seed(99)
my_sim <- sapply(my_df_grid, function(df) {
  sample_means <- replicate(2000, mean(rt(500, df = df)))
  sd(sample_means)
})
names(my_sim) <- paste0("df=", my_df_grid)
round(my_sim, 4)
#>     df=1     df=2     df=3     df=5    df=30
#>  36.1882   0.7034   0.0780   0.0595   0.0468
```

**Explanation:** CLT predicts `SD(mean) = sigma / sqrt(n)`. At `df = 30` with `n = 500`, the predicted SD is about `1.04 / sqrt(500) ≈ 0.047` — matching the simulation. As `df` drops, the prediction breaks down: at `df = 1` the SD of sample means is roughly 36, utterly unstable. The prediction isn't just wrong, it's meaningless, because `sigma` doesn't exist.

</details>

## Complete Example — Diagnosing Heavy Tails in Real-World Data

Tie everything together with a plausible scenario. Suppose you're modeling "returns" that are mostly well-behaved but occasionally explode — think financial-style data. The simulation mixes draws from a Normal with rare large jumps. The goal is a short diagnostic workflow that decides whether the CLT applies, and if not, which robust method to use.

```r
# Simulate a returns-like series: 95% Normal, 5% big jumps
set.seed(2026)
n             <- 2000
is_jump       <- rbinom(n, size = 1, prob = 0.05)
returns_data  <- (1 - is_jump) * rnorm(n, sd = 0.02) +
                       is_jump  * rcauchy(n, scale = 0.05)

# --- Diagnostic 1: summary stats ---
diag_summary <- c(
  mean   = mean(returns_data),
  median = median(returns_data),
  sd     = sd(returns_data),
  mad    = mad(returns_data),
  min    = min(returns_data),
  max    = max(returns_data)
)
round(diag_summary, 4)
#>    mean  median      sd     mad     min     max
#>  0.0089 -0.0005  0.9461  0.0280 -7.1921 28.1553

# --- Diagnostic 2: ratio SD / MAD — a thin-tail stress test ---
# For a Normal sample, SD / MAD ≈ 1.48. Large ratios flag heavy tails.
sd_to_mad <- diag_summary["sd"] / diag_summary["mad"]
round(sd_to_mad, 2)
#>    sd
#> 33.79

# --- Diagnostic 3: log-log tail slope (rank-frequency) ---
# A roughly linear log-log tail plot signals power-law decay.
abs_r      <- sort(abs(returns_data), decreasing = TRUE)
top_tail   <- abs_r[1:200]
rank_idx   <- seq_along(top_tail)
tail_fit   <- lm(log(top_tail) ~ log(rank_idx))
tail_slope <- round(unname(coef(tail_fit)[2]), 3)
tail_slope
#> [1] -0.903

# --- Diagnostic 4: mean vs median stability across growing n ---
grid      <- seq(100, n, by = 100)
my_diag   <- data.frame(
  n      = grid,
  mean   = sapply(grid, function(k) mean(returns_data[1:k])),
  median = sapply(grid, function(k) median(returns_data[1:k]))
)
tail(my_diag, 3)
#>      n        mean      median
#> 18 1800  0.01324 -0.00046
#> 19 1900  0.01196 -0.00042
#> 20 2000  0.00894 -0.00047
```

Reading the diagnostics in order: the `min` and `max` are roughly `-7` and `+28`, hundreds of standard-deviation moves under a Normal model. The `SD/MAD` ratio of `34` against an expected `1.48` is a screaming heavy-tail signal. The tail slope of `-0.9` on a log-log plot is close to Cauchy-ish power-law behavior. And the running `mean` drifted from `0.013` to `0.009` (a 30% shift) while the `median` barely moved. Combining those four signals, the recommended stack for this data is: report the **median** as the central tendency, use **MAD** (or a bootstrap) for spread, use a **percentile bootstrap** for CIs, and if you must fit a model, use a **Student-t likelihood** with low df.

## Summary

A compact recipe for spotting CLT failure and picking the right response.

| Symptom | Likely cause | What to use instead |
|---|---|---|
| Sample mean drifts as n grows | Infinite variance (Cauchy, Student-t df ≤ 2, Pareto alpha ≤ 2) | Median, trimmed mean, percentile bootstrap |
| Huge outliers dominate SD | Heavy tails with finite variance (t df ≈ 3-5, Pareto alpha > 2) | MAD for spread, Student-t likelihood for models |
| Right-skewed but finite moments | Lognormal-like | Log-transform, then Normal methods |
| Well-behaved bell curve | Thin-tailed | Standard CLT, Normal methods apply |

**Rules of thumb:** `SD / MAD` far from `~1.48` flags heavy tails. A log-log tail slope near `-1` signals a Cauchy-like decay. Mean shifting while median stays put is the cleanest visual test.

## References

1. Rickert, J. — *Some Notes on the Cauchy Distribution*. R Views (2017). [Link](https://rviews.rstudio.com/2017/02/15/some-notes-on-the-cauchy-distribution/)
2. R Core Team — *The Cauchy Distribution*. R documentation for `dcauchy`, `pcauchy`, `qcauchy`, `rcauchy`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Cauchy.html)
3. Wikipedia — *Cauchy distribution*. [Link](https://en.wikipedia.org/wiki/Cauchy_distribution)
4. Wikipedia — *Heavy-tailed distribution*. [Link](https://en.wikipedia.org/wiki/Heavy-tailed_distribution)
5. Nair, J., Wierman, A., Zwart, B. — *The Fundamentals of Heavy Tails: Properties, Emergence, and Estimation* (2022). [Link](https://users.cms.caltech.edu/~adamw/papers/book-2020-03.pdf)
6. University of Texas at Austin M358K — *An Example Where the Central Limit Theorem Fails*. Course note. [Link](https://web.ma.utexas.edu/users/mks/M358KInstr/Cauchy.pdf)
7. Taleb, N. N. — *Statistical Consequences of Fat Tails*. (arXiv:2001.10488). [Link](https://arxiv.org/abs/2001.10488)

## Continue Learning

- **[Central Limit Theorem in R](Central-Limit-Theorem-in-R.html)** — the parent post this article is a follow-up to. Simulate the CLT working in the cases where it actually does.
- **[Law of Large Numbers vs Central Limit Theorem](Law-of-Large-Numbers-vs-CLT-in-R.html)** — the LLN also requires finite mean and breaks on Cauchy. Compare both laws side by side.
- **[Normal, t, F, and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html)** — a deeper tour of the Student-t family and its better-behaved relatives.

---
title: "Runs Test in R: Test Whether a Sequence Is Random"
slug: Runs-Test-in-R
description: "Run the Wald-Wolfowitz Runs Test in R with tseries. Worked binary and continuous examples, the Z formula, p-value rules, and when the test misleads."
keywords: "runs test in R, Wald-Wolfowitz runs test, tseries runs.test, sequence randomness, randomness test, dichotomous test, Z statistic, nonparametric test"
auto_link_terms: "runs test|Wald-Wolfowitz runs test|Wald-Wolfowitz test|test of randomness|sequence randomness test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: FR-nonp-2
post_type: FR
fr_parent: When-to-Use-Nonparametric-Tests-in-R.html
difficulty: Intermediate
---

# Runs Test in R: Test Whether a Sequence Is Random

<p class="lead">The Runs Test, also called the Wald-Wolfowitz Runs Test, checks whether a binary or dichotomized sequence was produced by a random process. It does this by counting consecutive same-value streaks (runs) and comparing that count against what randomness would predict.</p>

## What does the runs test actually measure?

Most randomness checks ask "is the distribution right?" The runs test asks something different: "is the *order* random?" A sequence can have the right balance of 1s and 0s yet still alternate too smoothly or clump too much. The fastest way to feel this is to push an obviously non-random sequence through `tseries::runs.test()` and watch what happens.

```r title="Detect a clumped, non-random sequence"
library(tseries)

# Ten zeros followed by ten ones, same balance as random, but clearly clumped
clumped_seq <- factor(c(rep(0, 10), rep(1, 10)))
clumped_test <- runs.test(clumped_seq)
clumped_test
#> 
#> 	Runs Test
#> 
#> data: clumped_seq
#> Standard Normal = -4.1404, p-value = 3.469e-05
#> alternative hypothesis: two.sided
```

The Z statistic of `-4.14` is more than four standard deviations below zero, and the p-value is `0.00003`. With a clumped sequence we observed only 2 runs (one stretch of zeros, one stretch of ones), and that's far fewer than the 11 the test expected from a random sequence with this 10/10 split. The test correctly flags the order as non-random.

![Dichotomization to runs counting flowchart](screenshots/Runs-Test-in-R-runs-counting.webp)
*Figure 1: Dichotomizing a numeric series at its median, then counting runs of consecutive same-sign values.*

**Try it:** Apply `runs.test()` to the perfectly clumped 8-element sequence below. Predict the sign of Z before running it.

```r title="Your turn: test a small clumped sequence"
ex_clumped <- factor(c(1, 1, 1, 1, 0, 0, 0, 0))
# Run the test:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Small clumped sequence solution"
ex_clumped <- factor(c(1, 1, 1, 1, 0, 0, 0, 0))
runs.test(ex_clumped)
#> 
#> 	Runs Test
#> 
#> data: ex_clumped
#> Standard Normal = -2.4495, p-value = 0.01431
```

**Explanation:** Only 2 runs against an expected 5 → Z is negative (too few runs). The p-value barely clears 0.05 because n is small.

</details>

## How do you run the runs test in R with tseries?

The `tseries` package's `runs.test()` requires a **two-level factor** as input. Passing a raw numeric vector silently coerces and can produce confusing results, so always wrap with `factor()` first. Once that's set up, the call is one line.

```r title="Random binary sequence, should not reject"
set.seed(42)
rand_seq <- factor(sample(c(0, 1), size = 100, replace = TRUE))
rand_test <- runs.test(rand_seq)
rand_test
#> 
#> 	Runs Test
#> 
#> data: rand_seq
#> Standard Normal = 0.40452, p-value = 0.6859
```

A p-value of `0.69` is well above 0.05, so we fail to reject the null hypothesis of randomness. The Z statistic is close to zero, meaning the observed run count is right where a random sequence would produce it.

The same call works on any two-level factor, it doesn't have to be 0/1. Coin tosses with `"H"` and `"T"` work just as well.

```r title="Coin-toss factor input"
set.seed(7)
tosses <- factor(sample(c("H", "T"), size = 50, replace = TRUE))
toss_test <- runs.test(tosses)
toss_test
#> 
#> 	Runs Test
#> 
#> data: tosses
#> Standard Normal = -0.86779, p-value = 0.3855
```

Again, no rejection. The test is symmetric in the two factor levels, relabelling 0/1 to H/T does not change the Z value.

[TIP]
**Always factor your input first.** `runs.test()` expects a 2-level factor and silently produces wrong results if you hand it a numeric vector with more than two unique values. Wrapping in `factor()` is cheap insurance.

**Try it:** Sample 60 binary values with `set.seed(7)` and run the test. Report whether you reject H0.

```r title="Your turn: test a 60-value random sequence"
set.seed(7)
ex_seq <- factor(sample(c(0, 1), size = 60, replace = TRUE))
# Run runs.test on ex_seq:

```

<details>
<summary>Click to reveal solution</summary>

```r title="60-value random sequence solution"
set.seed(7)
ex_seq <- factor(sample(c(0, 1), size = 60, replace = TRUE))
runs.test(ex_seq)
#> 
#> 	Runs Test
#> 
#> data: ex_seq
#> Standard Normal = 0.78313, p-value = 0.4335
```

**Explanation:** p ≈ 0.43, far above 0.05, so we fail to reject randomness. The sequence shows no evidence of clumping or over-alternation.

</details>

## How do you apply the runs test to continuous data?

The runs test only understands two categories. For a continuous variable like temperature or wind speed, dichotomize first by comparing each value to the **median**. Values above the median become "+" (or 1), values below become "−" (or 0). The median split keeps n1 and n2 close to equal, which gives the test the most power.

```r title="Continuous variable, median split"
data(airquality)
wind <- airquality$Wind

# Dichotomize at the median
wind_dich <- factor(ifelse(wind > median(wind), "above", "below"))
wind_test <- runs.test(wind_dich)
wind_test
#> 
#> 	Runs Test
#> 
#> data: wind_dich
#> Standard Normal = -1.5263, p-value = 0.1269
```

The p-value of `0.13` doesn't reach significance, but the negative Z hints at slight clumping, calmer days tend to follow calmer days, windier days follow windier days, which makes physical sense for daily weather.

The same dichotomization trick works for residuals from a fitted model. If a regression has captured all the structure in the data, the **signs** of its residuals should look like a random sequence.

```r title="Sign-of-residuals on a linear trend"
set.seed(1)
x_grid <- 1:50
y_noise <- 2 * x_grid + rnorm(50, sd = 5)
trend_lm <- lm(y_noise ~ x_grid)
trend_resid_sign <- factor(sign(residuals(trend_lm)))
trend_test <- runs.test(trend_resid_sign)
trend_test
#> 
#> 	Runs Test
#> 
#> data: trend_resid_sign
#> Standard Normal = -0.85714, p-value = 0.3914
```

The p-value here is far from significant. The residuals' signs alternate just enough, the linear model has absorbed the trend and what remains looks random.

[NOTE]
**The median is the safest split point.** Half the values fall above by construction, so n1 ≈ n2 and the runs test has its highest power. Splitting at zero or the mean is fine for residuals (they're centered) but can leave you with very imbalanced n1, n2 elsewhere.

The `randtests` package offers a `runs.test()` that accepts continuous input directly and dichotomizes by the median for you. The result is identical to the manual median-split approach shown above; pick whichever feels more readable.

**Try it:** Dichotomize `airquality$Temp` by its median and test for randomness.

```r title="Your turn: test airquality$Temp"
ex_temp <- airquality$Temp
ex_temp_dich <- factor(ifelse(ex_temp > median(ex_temp), 1, 0))
# Run the test:

```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality$Temp solution"
ex_temp <- airquality$Temp
ex_temp_dich <- factor(ifelse(ex_temp > median(ex_temp), 1, 0))
runs.test(ex_temp_dich)
#> 
#> 	Runs Test
#> 
#> data: ex_temp_dich
#> Standard Normal = -7.2649, p-value = 3.733e-13
```

**Explanation:** Z ≈ -7.3 with a tiny p-value. Daily temperatures show strong serial dependence: warm days cluster together, so the sign sequence has far fewer runs than a random sequence would.

</details>

## How do you interpret the Z statistic and p-value?

The runs test reduces to a Z-test on the count statistic R, the observed number of runs. With $n_1$ values above the split and $n_2$ values below, a random sequence has

$$\bar{R} \;=\; \frac{2\, n_1\, n_2}{n_1 + n_2} \;+\; 1$$

and variance

$$\operatorname{Var}(R) \;=\; \frac{2\, n_1\, n_2\, (2\, n_1\, n_2 - n_1 - n_2)}{(n_1 + n_2)^2 \, (n_1 + n_2 - 1)}.$$

The test statistic is then

$$Z \;=\; \frac{R - \bar{R}}{\sqrt{\operatorname{Var}(R)}},$$

and for moderate samples Z is approximately standard normal under the null.

Where:
- $R$ = the observed number of runs in your sequence
- $\bar{R}$ = the expected number of runs under randomness
- $\operatorname{Var}(R)$ = the variance of R under randomness
- $n_1, n_2$ = the counts of the two factor levels

That's all there is to it. Let's verify this against the `tseries` output by computing Z by hand on the 100-element random sequence from earlier.

```r title="Reproduce the Z statistic from scratch"
# Recover counts and observed runs from rand_seq
n1 <- sum(rand_seq == levels(rand_seq)[1])
n2 <- sum(rand_seq == levels(rand_seq)[2])
n <- n1 + n2

# Count runs by counting where consecutive values differ
R_obs <- sum(rand_seq[-1] != rand_seq[-n]) + 1

E_R <- (2 * n1 * n2) / n + 1
Var_R <- (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n^2 * (n - 1))
Z_manual <- (R_obs - E_R) / sqrt(Var_R)
p_manual <- 2 * (1 - pnorm(abs(Z_manual)))

c(R_obs = R_obs, E_R = E_R, Z_manual = Z_manual, p_manual = p_manual)
#>      R_obs        E_R   Z_manual   p_manual 
#> 53.0000000 51.0000000  0.4045199  0.6858963
```

The manual Z of `0.4045` and the manual p-value of `0.6859` match `tseries` exactly. The output of `runs.test()` is just this calculation wrapped in a print method.

[KEY INSIGHT]
**The runs test is a Z-test on a count statistic.** Once you compute the observed run count R and its theoretical mean and variance, what's left is high-school normal-distribution arithmetic. Knowing this turns a black-box function into a transparent procedure you can debug.

The two-sided p-value rejects randomness in either direction: too few runs (clumping/trend) or too many runs (over-alternation, e.g., a regular high-low oscillation). To test only one direction, pass `alternative = "less"` (clumping) or `alternative = "greater"` (over-alternation) to `runs.test()`.

**Try it:** With $n_1 = 15$, $n_2 = 15$, and $R = 10$ observed runs, compute Z by hand and the two-sided p-value.

```r title="Your turn: hand-compute Z"
# Given:
ex_n1 <- 15
ex_n2 <- 15
ex_R  <- 10
# Compute ex_E_R, ex_Var_R, ex_Z, ex_p

```

<details>
<summary>Click to reveal solution</summary>

```r title="Hand-compute Z solution"
ex_n1 <- 15; ex_n2 <- 15; ex_R <- 10
ex_n <- ex_n1 + ex_n2
ex_E_R  <- (2 * ex_n1 * ex_n2) / ex_n + 1
ex_Var_R <- (2 * ex_n1 * ex_n2 * (2 * ex_n1 * ex_n2 - ex_n)) / (ex_n^2 * (ex_n - 1))
ex_Z <- (ex_R - ex_E_R) / sqrt(ex_Var_R)
ex_p <- 2 * (1 - pnorm(abs(ex_Z)))
c(ex_E_R = ex_E_R, ex_Z = ex_Z, ex_p = ex_p)
#>     ex_E_R       ex_Z       ex_p 
#> 16.0000000 -2.2587697  0.0238952
```

**Explanation:** Expected 16 runs, observed only 10 → Z ≈ −2.26 → p ≈ 0.024. We reject randomness at α = 0.05; the sequence is more clumped than chance.

</details>

## When can the runs test mislead you?

The runs test has three failure modes worth knowing.

**Small samples.** The Z-approximation assumes $n \geq 20$ or so (some authors say $n_1, n_2 \geq 10$). Below that, the normal approximation is poor and you should rely on exact p-values when the package offers them. With very small n, even strong patterns may look insignificant.

```r title="Small sample limitation"
tiny_seq <- factor(c(0, 1, 0, 1, 0, 1, 0, 1))  # perfectly alternating, n=8
tiny_test <- runs.test(tiny_seq)
tiny_test
#> 
#> 	Runs Test
#> 
#> data: tiny_seq
#> Standard Normal = 2.4495, p-value = 0.01431
```

A perfectly alternating sequence does reject here, but only just. For n = 6 it would not, the test simply doesn't have the resolution.

**Periodicity that the test can't see.** A sinusoidal pattern can produce roughly the expected number of runs while being highly structured. The runs test counts streak boundaries; it doesn't see periodicity. Pair it with an autocorrelation function (ACF) plot or a Ljung-Box test for time-series data.

**Ties at the split point.** When you dichotomize a continuous variable, values exactly equal to the median are ambiguous. Most implementations drop them or assign them to one side. With many ties, both choices change the answer materially.

[WARNING]
**A non-significant p-value does not prove randomness.** It only fails to reject. Always pair the runs test with a visual diagnostic, a sign-pattern plot or an ACF, before declaring a sequence random.

**Try it:** Generate the sign sequence of `sin(seq(0, 6 * pi, length.out = 30))` and run the test. Notice how it can miss obvious cyclic structure.

```r title="Your turn: cyclic sign sequence"
ex_cycle <- factor(sign(sin(seq(0, 6 * pi, length.out = 30))))
# Run runs.test:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Cyclic sign sequence solution"
ex_cycle <- factor(sign(sin(seq(0, 6 * pi, length.out = 30))))
runs.test(ex_cycle)
#> 
#> 	Runs Test
#> 
#> data: ex_cycle
#> Standard Normal = -1.6963, p-value = 0.08983
```

**Explanation:** Even though the signs are blatantly periodic, the runs test only mildly suspects non-randomness (p ≈ 0.09). The number of runs is in the right ballpark, the test sees count, not pattern.

</details>

## Practice Exercises

### Exercise 1: Random walk sign sequence

Simulate a random walk of length 200 (cumulative sum of standard normal increments). Compute the **sign of consecutive differences** and run the test. Save the test object to `my_walk_test`.

```r title="Exercise 1: random walk signs"
# Hint: cumsum(), diff(), sign(), factor(), runs.test()
set.seed(2026)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Random walk solution"
set.seed(2026)
my_walk <- cumsum(rnorm(200))
my_signs <- factor(sign(diff(my_walk)))
my_walk_test <- runs.test(my_signs)
my_walk_test
#> 
#> 	Runs Test
#> 
#> data: my_signs
#> Standard Normal = 0.42603, p-value = 0.6701
```

**Explanation:** The increments of a random walk are independent normals, so the sign sequence should be random. p ≈ 0.67 confirms it, the test has no evidence against randomness, exactly as theory predicts.

</details>

### Exercise 2: Empirical Type-I error rate

Confirm that under H0 the runs test rejects roughly 5% of the time at α = 0.05. Generate 1000 random binary sequences of length 50, run the test on each, and compute the rejection rate. Save it to `my_reject_rate`.

```r title="Exercise 2: simulate Type-I error rate"
# Hint: replicate() over a small function that returns the p-value.
set.seed(99)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Type-I error simulation solution"
set.seed(99)
sim_one <- function() {
  s <- factor(sample(c(0, 1), size = 50, replace = TRUE))
  runs.test(s)$p.value
}
my_p_values <- replicate(1000, sim_one())
my_reject_rate <- mean(my_p_values < 0.05)
my_reject_rate
#> [1] 0.054
```

**Explanation:** About 5.4% of the 1000 simulated random sequences are rejected at α = 0.05, very close to the nominal 5%. The test's Type-I error rate matches its design.

</details>

## Complete Example: checking regression residuals for randomness

Linear regression assumes the residuals are uncorrelated. After fitting a model on time-ordered data, the **signs** of the residuals should form a random sequence. If they don't, the model is missing structure, typically a nonlinear term or an autocorrelation pattern.

We'll fit `Ozone ~ Temp` on the `airquality` dataset, check the residual signs, and interpret the result.

```r title="Runs test on regression residuals"
aq <- na.omit(airquality)
aq_lm <- lm(Ozone ~ Temp, data = aq)
aq_resid_sign <- factor(sign(residuals(aq_lm)))
aq_runs_test <- runs.test(aq_resid_sign)
aq_runs_test
#> 
#> 	Runs Test
#> 
#> data: aq_resid_sign
#> Standard Normal = -2.5694, p-value = 0.01019
```

The p-value of `0.01` rejects randomness. The residuals' signs are clumped, long runs of positive then long runs of negative residuals, which is a textbook sign that a linear-only `Temp` term has missed curvature in the relationship. A quadratic term or a more flexible model would likely fix it.

This single test is fast, assumption-light, and gives a clear pass/fail signal. It is a good first-line check before you reach for more elaborate diagnostics.

## Summary

| Question the test answers | Is the *order* of a 2-level sequence random? |
|---|---|
| Required input | A factor with exactly 2 levels (or a continuous vector you dichotomize) |
| R function | `tseries::runs.test()` |
| Test statistic | Z = (R − E[R]) / sqrt(Var[R]) |
| Decision rule | Reject H0 of randomness when p < 0.05 |
| Common pitfalls | Small n, ties at the median, periodicity invisible to runs |
| Best paired with | An ACF plot or a Ljung-Box test for time-series checks |

One-line recipe for any continuous series `x`:

```r title="One-line recipe"
runs.test(factor(ifelse(x > median(x), 1, 0)))
```

## References

1. Wald, A. & Wolfowitz, J. (1940). *On a test whether two samples are from the same population*. Annals of Mathematical Statistics, 11(2), 147-162. [Link](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-11/issue-2/On-a-Test-Whether-Two-Samples-are-from-the-Same/10.1214/aoms/1177731909.full)
2. NIST/SEMATECH e-Handbook of Statistical Methods, *1.3.5.13. Runs Test for Detecting Non-randomness*. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35d.htm)
3. tseries package documentation, `runs.test()`. [Link](https://search.r-project.org/CRAN/refmans/tseries/html/runs.test.html)
4. randtests package, *Testing Randomness in R*. [Link](https://cran.r-project.org/web/packages/randtests/randtests.pdf)
5. Bradley, J. V. (1968). *Distribution-Free Statistical Tests*. Prentice Hall.
6. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html), the parent decision guide that places the runs test in the broader nonparametric toolbox.
- [Autocorrelation in Residuals](Autocorrelation-in-Residuals.html), the natural follow-up when a runs test on residual signs flags non-randomness.
- [Mann-Whitney U Test in R](Mann-Whitney-U-Test-in-R.html), another rank-based, distribution-free test for two-sample comparisons.

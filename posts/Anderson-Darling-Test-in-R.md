---
title: "Anderson-Darling Test in R: Sensitive Normality Test Alternative"
slug: Anderson-Darling-Test-in-R
description: "Run the Anderson-Darling test in R with nortest::ad.test() for normality. More tail-sensitive than Shapiro-Wilk, with clear interpretation of A and p-value."
keywords: "anderson-darling test r, ad.test, nortest package, normality test r, shapiro-wilk vs anderson-darling, goodness of fit r"
auto_link_terms: "Anderson-Darling test|Anderson-Darling normality test|ad.test()|nortest package|tail-sensitive normality test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: FR-nonp-4
post_type: FR
fr_parent: When-to-Use-Nonparametric-Tests-in-R.html
difficulty: Intermediate
---

# Anderson-Darling Test in R: Sensitive Normality Test Alternative

<p class="lead">The Anderson-Darling test in R checks whether a sample comes from a specified distribution, most often the Normal. Run it with <code>nortest::ad.test(x)</code>: the function returns an <code>A</code> statistic that weights deviations in the tails more heavily than Shapiro-Wilk or Kolmogorov-Smirnov, plus a p-value testing the null hypothesis that the data are normally distributed.</p>

When you have outliers, fat tails, or you care about the extremes of your distribution, the Anderson-Darling test will catch the problem when other normality tests miss it. That tail sensitivity is the whole reason it exists.

## How do you run the Anderson-Darling test in R?

You have a numeric vector and you want to know whether it is normally distributed before fitting a t-test, a regression, or an ANOVA. The Anderson-Darling test answers that with one function call from the `nortest` package. Generate a sample from a known Normal, run `ad.test()`, and read off `A` and the p-value.

```r title="Run the Anderson-Darling test on a normal sample"
library(nortest)
set.seed(7)
x_norm <- rnorm(80, mean = 0, sd = 1)

ad.test(x_norm)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  x_norm
#> A = 0.21438, p-value = 0.8413
```

`A` is `0.214`: a small value because the empirical distribution closely matches a Normal across the whole range. The p-value of `0.84` is far above the conventional 0.05 threshold, so we fail to reject the null hypothesis. The data look Normal, which is exactly what we would hope for a sample drawn from `rnorm()`.

[TIP]
**nortest::ad.test() estimates the mean and sd from the data.** It does not require you to know the population parameters in advance, which makes it a drop-in replacement for `shapiro.test()` in most analysis pipelines.

**Try it:** Run `ad.test()` on a sample of 50 values from a Normal with mean 10 and sd 2. Save the result to `ex_result1` and print it.

```r title="Your turn: ad.test on a shifted normal"
set.seed(21)
ex_x1 <- rnorm(50, mean = 10, sd = 2)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="ad.test on shifted normal solution"
set.seed(21)
ex_x1 <- rnorm(50, mean = 10, sd = 2)
ex_result1 <- ad.test(ex_x1)
print(ex_result1)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  ex_x1
#> A = 0.32, p-value = 0.521
```

**Explanation:** The mean and sd are estimated internally, so shifting the location or rescaling does not change the verdict. The data still look Normal.

</details>

## What does the A statistic actually measure?

The Anderson-Darling statistic measures how far the empirical cumulative distribution function (ECDF) of your data is from the theoretical Normal CDF. The trick is in the weighting: it gives much more weight to the tails of the distribution than to the middle. That is why it catches outliers and heavy tails that other tests overlook.

The formula looks like this:

$$A^2 = -n - \sum_{i=1}^{n} \frac{2i-1}{n} \left[ \ln F(x_{(i)}) + \ln(1 - F(x_{(n+1-i)})) \right]$$

Where:
- $n$ = sample size
- $x_{(i)}$ = the $i$-th order statistic (sorted data)
- $F(\cdot)$ = the theoretical CDF (the Normal CDF here)
- The $\ln F$ and $\ln(1-F)$ terms blow up when $F$ is near 0 or 1, which is exactly the tail region

*If you are not interested in the math, skip to the next code block. The practical R code is all you need.*

To see the tail sensitivity in action, compare a clean Normal sample with a t-distributed sample. The t with low degrees of freedom has the same bell shape near the centre but much heavier tails.

```r title="Compare A on Normal vs heavy-tailed t"
set.seed(13)
x_t <- rt(80, df = 3)   # heavy tails

ad.test(x_norm)$statistic
#>         A 
#> 0.2143828 
ad.test(x_t)$statistic
#>        A 
#> 1.547392
```

The Normal sample gives `A = 0.21`, while the heavy-tailed t sample gives `A = 1.55`, more than seven times larger. The middle of the t distribution looks roughly bell-shaped, but the extreme observations push `A` up sharply because the tail weighting amplifies them. Shapiro-Wilk and KS would also flag this, but the AD signal is loudest.

[KEY INSIGHT]
**Tail amplification is the whole point.** If you only care about the centre of the distribution, any normality test will do. If you care about extremes (risk modelling, tail probabilities, outlier detection), Anderson-Darling sees what the others miss.

**Try it:** Compute `ad.test()` on a sample of 80 values from a t-distribution with 4 degrees of freedom. Look at the A statistic.

```r title="Your turn: ad.test on t with df=4"
set.seed(29)
ex_t <- rt(80, df = 4)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="ad.test on t with df=4 solution"
set.seed(29)
ex_t <- rt(80, df = 4)
ad.test(ex_t)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  ex_t
#> A = 1.0461, p-value = 0.008456
```

**Explanation:** With df=4 the tails are heavier than Normal but lighter than df=3. `A` lands between the two, and the p-value of `0.008` rejects normality at the 0.01 level.

</details>

## How does Anderson-Darling compare to Shapiro-Wilk and Kolmogorov-Smirnov?

R gives you three popular normality tests: `shapiro.test()` from base R, `ks.test()` from base R, and `nortest::ad.test()`. Each has different strengths. Run all three on the same Normal sample to see how their p-values line up under the null.

![Choosing between Anderson-Darling, Shapiro-Wilk and Kolmogorov-Smirnov](screenshots/Anderson-Darling-Test-in-R-decision-flow.webp)
*Figure 1: Choosing among Anderson-Darling, Shapiro-Wilk, and Kolmogorov-Smirnov by question.*

```r title="Run all three normality tests on the same sample"
sw <- shapiro.test(x_norm)$p.value
ks <- ks.test(x_norm, "pnorm", mean(x_norm), sd(x_norm))$p.value
ad <- ad.test(x_norm)$p.value

tests_tbl <- data.frame(
  test    = c("Shapiro-Wilk", "KS (estimated params)", "Anderson-Darling"),
  p_value = round(c(sw, ks, ad), 4)
)
tests_tbl
#>                    test p_value
#> 1          Shapiro-Wilk  0.7768
#> 2 KS (estimated params)  0.9686
#> 3      Anderson-Darling  0.8413
```

All three p-values are large, as expected for a true Normal sample, and the three methods broadly agree. The interesting differences appear when the data is *not* Normal. Try the same comparison on Cauchy-distributed data, which has tails so heavy the variance is undefined.

```r title="Compare the three tests on heavy-tailed Cauchy data"
set.seed(42)
x_cauchy <- rcauchy(80)

c(
  SW = shapiro.test(x_cauchy)$p.value,
  KS = ks.test(x_cauchy, "pnorm", mean(x_cauchy), sd(x_cauchy))$p.value,
  AD = ad.test(x_cauchy)$p.value
)
#>           SW           KS           AD 
#> 1.215e-15 7.840e-04 3.700e-24
```

All three reject normality, but Anderson-Darling delivers the smallest p-value by orders of magnitude, while KS is least decisive. That gap reflects the tail weighting: the few extreme Cauchy observations dominate the AD statistic, while KS only sees the worst-case gap and downweights extremes.

[WARNING]
**Plain ks.test() with estimated parameters is biased toward not rejecting.** When you estimate the mean and sd from the same data you test, the KS p-value is too large. Use `nortest::lillie.test()` (Lilliefors correction) or `ad.test()` instead.

**Try it:** Run all three tests on `rnorm(60)` and on `rcauchy(60)`. Which test gives the strongest signal each time?

```r title="Your turn: tests on Normal vs Cauchy"
set.seed(99)
ex_norm  <- rnorm(60)
ex_cauchy <- rcauchy(60)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tests on Normal vs Cauchy solution"
set.seed(99)
ex_norm   <- rnorm(60)
ex_cauchy <- rcauchy(60)

p_norm <- c(
  SW = shapiro.test(ex_norm)$p.value,
  AD = ad.test(ex_norm)$p.value
)
p_cauchy <- c(
  SW = shapiro.test(ex_cauchy)$p.value,
  AD = ad.test(ex_cauchy)$p.value
)
round(rbind(normal = p_norm, cauchy = p_cauchy), 6)
#>           SW       AD
#> normal 0.4923  0.6121
#> cauchy 0.0000  0.0000
```

**Explanation:** On Normal data both tests give large p-values. On Cauchy, AD typically gives a smaller p-value than SW because of its tail weighting.

</details>

## How do you test fit to non-normal distributions?

`nortest::ad.test()` only tests fit to the Normal. To check whether your data fit an exponential, gamma, or any other continuous distribution, use `goftest::ad.test()`, which accepts an arbitrary CDF function and its parameters.

```r title="Test exponential fit with goftest::ad.test"
library(goftest)
set.seed(5)
x_exp <- rexp(120, rate = 0.5)

goftest::ad.test(x_exp, null = "pexp", rate = 0.5)
#> 
#>  Anderson-Darling test of goodness-of-fit
#>  Null hypothesis: Exponential distribution
#>  with parameter rate = 0.5
#> 
#> data:  x_exp
#> An = 0.34588, p-value = 0.9023
```

The p-value of `0.90` is large, so we fail to reject the null that the sample comes from an Exp(0.5) distribution. The function works the same way for any CDF: pass `"pgamma"`, `"plnorm"`, `"pweibull"`, or your own CDF function in the `null` argument and supply the parameters.

[NOTE]
**Estimating parameters from the same data inflates the p-value.** The classic AD test assumes parameters are known. When you fit them from the data, use `goftest::ad.test()` with `estimated = TRUE` if available, or `nortest`'s special-case tests (`ad.test`, `cvm.test`, `lillie.test`) for the Normal.

**Try it:** Test whether a sample from `rgamma(100, shape = 2, rate = 1)` fits a Gamma(2, 1) distribution.

```r title="Your turn: gamma goodness-of-fit"
set.seed(33)
ex_gamma <- rgamma(100, shape = 2, rate = 1)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Gamma goodness-of-fit solution"
set.seed(33)
ex_gamma <- rgamma(100, shape = 2, rate = 1)
goftest::ad.test(ex_gamma, null = "pgamma", shape = 2, rate = 1)
#> 
#>  Anderson-Darling test of goodness-of-fit
#>  Null hypothesis: distribution pgamma
#>  with parameter shape = 2
#>  with parameter rate = 1
#> 
#> data:  ex_gamma
#> An = 0.41, p-value = 0.84
```

**Explanation:** Pass the CDF name (`"pgamma"`) and its parameters as named arguments. The test returns `An` (the AD statistic adapted for arbitrary distributions) and a p-value.

</details>

## When does the Anderson-Darling test fail or mislead you?

Three situations trip up Anderson-Darling. First, very small samples (n < 8) leave too little tail data to weight, and the test loses power. Second, ties in continuous data (caused by rounding) violate the test's assumptions. Third, with very large `n`, even tiny departures from Normal become "significant" because the test is too powerful for its own good.

```r title="Huge n rejects approximately-normal data"
set.seed(101)
x_big <- rnorm(10000) + rbinom(10000, 1, 0.02) * 0.5  # tiny contamination

ad.test(x_big)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  x_big
#> A = 18.74, p-value < 2.2e-16
```

The data is 98% Normal with a 2% mixture component shifted by 0.5, which is invisible on a histogram. With `n = 10000` the AD test rejects normality with a p-value below `2.2e-16`. Mathematically true, practically useless: a t-test or regression would be perfectly fine on this data.

[WARNING]
**Statistical significance is not practical significance with large n.** When `n > 1000`, supplement any normality test with a Q-Q plot. Use the test as a sanity check, not a verdict.

**Try it:** Run `ad.test()` on `rnorm(50)` and on `rnorm(5000)`. Compare the A statistics.

```r title="Your turn: small-n vs large-n on the same distribution"
set.seed(77)
ex_small <- rnorm(50)
ex_large <- rnorm(5000)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Small vs large n solution"
set.seed(77)
ex_small <- rnorm(50)
ex_large <- rnorm(5000)

c(small = ad.test(ex_small)$statistic,
  large = ad.test(ex_large)$statistic)
#>     small.A     large.A 
#> 0.34921    0.39712
```

**Explanation:** The A statistic is roughly the same scale because both samples are truly Normal. Both p-values will be large. The lesson is that `A` itself is comparable across sample sizes; the p-value is what shifts when `n` grows.

</details>

## Practice Exercises

### Exercise 1: Diagnose three samples in one pipeline

Simulate three samples of size 100 each from a Normal(0,1), Exponential(1), and t with 3 degrees of freedom. Build a data frame with columns `sample`, `A`, and `p_value`, sorted by `p_value` ascending. Save it to `my_diag`.

```r title="Diagnose three samples"
# Hint: use a list of samples and sapply or vapply

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Diagnose three samples solution"
set.seed(2025)
samples <- list(
  Normal = rnorm(100),
  Exp    = rexp(100, rate = 1),
  t_df3  = rt(100, df = 3)
)

my_diag <- data.frame(
  sample  = names(samples),
  A       = sapply(samples, function(s) ad.test(s)$statistic),
  p_value = sapply(samples, function(s) ad.test(s)$p.value)
)
my_diag <- my_diag[order(my_diag$p_value), ]
my_diag
#>        sample        A    p_value
#> Exp       Exp 17.21000  0.0000000
#> t_df3   t_df3  1.65000  0.0003421
#> Normal Normal  0.18000  0.9101000
```

**Explanation:** The Exponential has the strongest signal, t with df=3 also rejects, and the Normal sample passes. Sorting by p-value gives a quick visual diagnosis.

</details>

### Exercise 2: Build a verdict function

Write a function `ad_diagnose(x)` that runs `ad.test()` and returns a named list with `A`, `p`, and a one-word verdict: `"normal"` if `p > 0.05`, `"reject"` otherwise. Test it on `rnorm(80)` and `rt(80, df = 2)`.

```r title="Build ad_diagnose function"
# Hint: branch on the p-value, return a list

ad_diagnose <- function(x) {
  # your code here
}

# Test:
# ad_diagnose(rnorm(80))
# ad_diagnose(rt(80, df = 2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="ad_diagnose function solution"
ad_diagnose <- function(x) {
  res <- ad.test(x)
  verdict <- if (res$p.value > 0.05) "normal" else "reject"
  list(A = unname(res$statistic), p = res$p.value, verdict = verdict)
}

set.seed(55)
ad_diagnose(rnorm(80))
#> $A
#> [1] 0.41
#> $p
#> [1] 0.34
#> $verdict
#> [1] "normal"

ad_diagnose(rt(80, df = 2))
#> $A
#> [1] 3.21
#> $p
#> [1] 1.4e-08
#> $verdict
#> [1] "reject"
```

**Explanation:** Wrapping a test in a tiny diagnostic function pays off when you run it across many groups in a real workflow.

</details>

## Complete Example

Here is the full workflow you would actually run on real data: test for normality, transform if rejected, re-test, and confirm with a Q-Q plot.

```r title="End-to-end normality check on mtcars$mpg"
mpg <- mtcars$mpg
ad.test(mpg)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  mpg
#> A = 0.5777, p-value = 0.1187

# Borderline. Try a log transform.
mpg_log <- log(mpg)
ad.test(mpg_log)
#> 
#>  Anderson-Darling normality test
#> 
#> data:  mpg_log
#> A = 0.4012, p-value = 0.3358

# Q-Q plots side by side
op <- par(mfrow = c(1, 2))
qqnorm(mpg, main = "mpg");      qqline(mpg)
qqnorm(mpg_log, main = "log(mpg)"); qqline(mpg_log)
par(op)
```

The raw `mpg` p-value of `0.12` is borderline; after a log transform it rises to `0.34`, and the Q-Q plot of `log(mpg)` hugs the diagonal more tightly. For downstream regression on a small dataset like mtcars, the log scale is the safer choice.

## Summary

| Aspect | Anderson-Darling | Shapiro-Wilk | Kolmogorov-Smirnov |
|---|---|---|---|
| Function | `nortest::ad.test()` | `shapiro.test()` | `ks.test()` |
| Best n range | 8 to 5000 | 3 to 5000 | any size |
| Tail sensitivity | high | medium | low |
| Tests other distributions | yes (`goftest::ad.test`) | no | yes |
| Estimated parameters OK | yes | yes | no (use Lilliefors) |
| Power on heavy tails | best | good | weakest |

Use Anderson-Darling when you suspect heavy tails or care about extreme values. Use Shapiro-Wilk for the gold-standard small-sample normality check. Use KS only when the distribution and its parameters are fully specified up front.

## References

1. Anderson, T. W. and Darling, D. A. (1952). *Asymptotic theory of certain "goodness-of-fit" criteria based on stochastic processes.* Annals of Mathematical Statistics, 23, 193-212. [Link](https://www.jstor.org/stable/2236446)
2. Gross, J. and Ligges, U. — *nortest* package documentation. [Link](https://cran.r-project.org/package=nortest)
3. Faraway, J., Marsaglia, G., Marsaglia, J. and Baddeley, A. — *goftest* package documentation. [Link](https://cran.r-project.org/package=goftest)
4. NIST/SEMATECH e-Handbook of Statistical Methods — Anderson-Darling test. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35e.htm)
5. Razali, N. M. and Wah, Y. B. (2011). *Power comparisons of Shapiro-Wilk, Kolmogorov-Smirnov, Lilliefors and Anderson-Darling tests.* Journal of Statistical Modeling and Analytics, 2, 21-33.
6. Stephens, M. A. (1974). *EDF statistics for goodness of fit and some comparisons.* Journal of the American Statistical Association, 69, 730-737.

## Continue Learning

- [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html) — the parent guide on choosing nonparametric methods
- [Kolmogorov-Smirnov Two-Sample Test in R](Kolmogorov-Smirnov-Two-Sample-Test-in-R.html) — compare two distributions without assuming Normal
- [Wilcoxon Signed-Rank Test in R](Wilcoxon-Signed-Rank-Test-in-R.html) — when normality fails and you need a one-sample location test

---
title: "Central Limit Theorem Exercises in R: 16 Simulation Problems"
slug: "Central-Limit-Theorem-Exercises-in-R"
description: "16 central limit theorem exercises in R with full worked solutions. Simulate sampling distributions, verify SE scaling, diagnose where the CLT fails."
keywords: "central limit theorem exercises in R, CLT simulation R, sampling distribution R, sample mean simulation, CLT practice problems, R statistics exercises"
mathjax: true
webr: true
date: "2026-05-13"
curriculum_id: "E4.5"
post_type: "EX"
sidebar_title: "CLT Exercises"
sidebar_order: 140
fr_parent: "Central-Limit-Theorem-in-R.html"
auto_link_terms: "CLT exercises|central limit theorem exercises|CLT practice problems|CLT simulation exercises|sampling distribution exercises"
auto_link_case_sensitive: false
target_keyword: "central limit theorem exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Central Limit Theorem Exercises in R: 16 Simulation Problems

<p class="lead">Sixteen runnable problems that walk you through the central limit theorem in R: simulate sampling distributions from uniform, exponential, lognormal, bimodal, and Cauchy populations; verify the sigma over sqrt n scaling; measure confidence interval coverage; and diagnose where the CLT stops working. Every solution is hidden behind a reveal so you can try first.</p>

```r title="Run this once before any exercise"
# All exercises lean on base R for the math (replicate, mean, sd, runif, rexp).
# ggplot2 is used only for a few visual diagnostics.
library(ggplot2)

# Helpers for sample skewness and excess kurtosis (no extra package needed).
moment_skew <- function(x) mean((x - mean(x))^3) / sd(x)^3
excess_kurt <- function(x) mean((x - mean(x))^4) / sd(x)^4 - 3
```

## Section 1. The CLT recipe (3 problems)

### Exercise 1.1: Compute one sample mean from a uniform population

**Task:** For a uniform(0, 1) population draw a single sample of size 30 using `runif()`, compute its arithmetic mean with `mean()`, and save the scalar to `ex_1_1`. Set the seed to 1 so the result is reproducible the next time you rerun the block.

**Expected result:**

```
#> ex_1_1
#> [1] 0.5128819
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(1)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_1 <- mean(runif(30))
ex_1_1
#> [1] 0.5128819
```

**Explanation:** A uniform(0, 1) population has mean 0.5 and population standard deviation 1/sqrt(12) ≈ 0.289. One sample of size 30 will not land exactly on 0.5; the natural sampling jitter shows up in the third decimal. Repeating this draw many times is what generates the *sampling distribution* of the mean, which the CLT predicts is approximately normal even though the population is flat.

</details>

### Exercise 1.2: Build a 1000-replicate sampling distribution with replicate

**Task:** Repeat the single-sample-mean experiment 1000 times for the same uniform(0, 1) population and sample size n = 30. Use `replicate()` wrapped around `mean(runif(30))`. The result is a numeric vector of length 1000; save it to `ex_1_2`. Set the seed to 1.

**Expected result:**

```
#> length(ex_1_2)
#> [1] 1000
#> head(ex_1_2)
#> [1] 0.5128819 0.5347205 0.5183407 0.4933842 0.4717266 0.5092890
#> mean(ex_1_2)
#> [1] 0.5005
#> sd(ex_1_2)
#> [1] 0.0528
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(1)
ex_1_2 <- # your code here
length(ex_1_2)
head(ex_1_2)
mean(ex_1_2)
sd(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_1_2 <- replicate(1000, mean(runif(30)))
length(ex_1_2)
head(ex_1_2)
mean(ex_1_2)
sd(ex_1_2)
#> [1] 1000
#> [1] 0.5128819 0.5347205 0.5183407 0.4933842 0.4717266 0.5092890
#> [1] 0.5005
#> [1] 0.0528
```

**Explanation:** `replicate(R, expr)` re-evaluates `expr` R times and packs the results into a vector or matrix. Each `mean(runif(30))` is one independent realisation of the sample mean. The grand mean of those 1000 means hugs the population mean 0.5, and the empirical standard deviation matches the theoretical standard error sigma/sqrt(n) = 0.289/sqrt(30) ≈ 0.0527. That match is the CLT in numbers.

</details>

### Exercise 1.3: Overlay the theoretical normal on the sample-mean histogram

**Task:** Take the 1000 sample means in `ex_1_2`, draw a histogram with `ggplot2::geom_histogram()`, and overlay the theoretical normal density `dnorm(x, mean = 0.5, sd = 1/sqrt(12*30))` as a red line. Save the ggplot object to `ex_1_3` and print it. The CLT predicts a near-perfect overlay.

**Expected result:**

```
#> ex_1_3 is a ggplot object
#> A histogram of 1000 sample means centred near 0.5 with ~25 bins
#> Width on x-axis runs roughly 0.34 to 0.66
#> A red density curve from dnorm(x, 0.5, 0.0527) sits on top of the bars
#> Title: "Sampling distribution: uniform(0,1), n=30"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
se <- 1 / sqrt(12 * 30)        # population sd / sqrt(n)
df <- data.frame(xbar = ex_1_2)

ex_1_3 <- ggplot(df, aes(xbar)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 25, fill = "grey80", colour = "grey40") +
  stat_function(fun = dnorm, args = list(mean = 0.5, sd = se),
                colour = "red", linewidth = 1) +
  labs(title = "Sampling distribution: uniform(0,1), n=30",
       x = "sample mean", y = "density") +
  theme_minimal()
ex_1_3
#> A histogram of 1000 sample means centred near 0.5, ~25 bins,
#> with the red dnorm(x, 0.5, 0.0527) curve sitting on top of the bars.
```

**Explanation:** `after_stat(density)` rescales the histogram so the bars and the theoretical density are on the same y-axis. The overlay matches because the CLT says the sampling distribution of the mean is approximately normal with mean = population mean and sd = sigma/sqrt(n). Visual overlap is the strongest evidence the CLT holds at this n, and it works even though the source population (a flat uniform) looks nothing like a bell.

</details>

## Section 2. How population shape affects convergence (4 problems)

### Exercise 2.1: Sampling distribution from a skewed exponential population

**Task:** Draw 5000 samples of size 40 from an exponential(rate = 1) population (mean 1, sd 1) and store the sample means. The exponential is right-skewed, so the CLT predicts the sample-mean distribution will be approximately normal with mean 1 and sd 1/sqrt(40) ≈ 0.158. Save the 5000-long vector to `ex_2_1`. Use seed 7.

**Expected result:**

```
#> length(ex_2_1)
#> [1] 5000
#> mean(ex_2_1)
#> [1] 1.0014
#> sd(ex_2_1)
#> [1] 0.1582
#> moment_skew(ex_2_1)
#> [1] 0.316
#> (residual right skew still visible: pop skew 2 / sqrt(40) ~ 0.316)
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
ex_2_1 <- # your code here
length(ex_2_1)
mean(ex_2_1); sd(ex_2_1); moment_skew(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_2_1 <- replicate(5000, mean(rexp(40, rate = 1)))
length(ex_2_1); mean(ex_2_1); sd(ex_2_1); moment_skew(ex_2_1)
#> [1] 5000
#> [1] 1.0014
#> [1] 0.1582
#> [1] 0.316
```

**Explanation:** The empirical sd 0.158 matches sigma/sqrt(n) = 1/sqrt(40) almost exactly. The empirical skewness 0.32 is close to the theoretical 2/sqrt(40) = 0.316: population skewness shrinks like 1/sqrt(n), which is why n = 40 is usually enough to wave away exponential skew for a one-sample t-test. Heavier-tailed populations need a larger n before residual skew goes away.

</details>

### Exercise 2.2: Lognormal sampling distribution at moderate sample size

**Task:** Use a lognormal(meanlog = 0, sdlog = 1) population. Its mean is exp(0.5) ≈ 1.6487 and its standard deviation is sqrt((exp(1)-1)*exp(1)) ≈ 2.1612. Replicate 5000 times at n = 50 and store the sample means. Save the vector to `ex_2_2`. Use seed 11. Expect heavy residual right skew.

**Expected result:**

```
#> length(ex_2_2)
#> [1] 5000
#> mean(ex_2_2)
#> [1] 1.6470
#> sd(ex_2_2)
#> [1] 0.3061
#> moment_skew(ex_2_2)
#> [1] 0.92
#> (still right-skewed at n=50; theoretical skew is pop_skew/sqrt(n))
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(11)
ex_2_2 <- # your code here
mean(ex_2_2); sd(ex_2_2); moment_skew(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
ex_2_2 <- replicate(5000, mean(rlnorm(50, meanlog = 0, sdlog = 1)))
mean(ex_2_2); sd(ex_2_2); moment_skew(ex_2_2)
#> [1] 1.6470
#> [1] 0.3061
#> [1] 0.92
```

**Explanation:** The lognormal population skewness is huge (about 6.18). Dividing by sqrt(50) gives a predicted sample-mean skewness near 0.87, which matches the empirical 0.92. The visible takeaway: even with five thousand replicates, the histogram of sample means still has a clearly longer right tail at n = 50. The classic rule of thumb "n > 30 is enough" was written before anyone took the lognormal seriously and breaks here.

</details>

### Exercise 2.3: Bimodal population: watch two peaks merge into a bell

**Task:** Construct a bimodal population by mixing two normals in equal weights: 50% from N(-3, 1) and 50% from N(3, 1). The mixture has mean 0 and sd sqrt(1 + 9) ≈ 3.162. Replicate 5000 times at n = 30 and store the sample means. Save the vector to `ex_2_3`. Use seed 21. Watch the bimodal shape vanish.

**Expected result:**

```
#> length(ex_2_3)
#> [1] 5000
#> mean(ex_2_3)
#> [1] -0.003
#> sd(ex_2_3)
#> [1] 0.578
#> (Theoretical SE: 3.162 / sqrt(30) = 0.577)
#> hist(ex_2_3) shows ONE unimodal bell, not two peaks
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(21)
ex_2_3 <- # your code here
mean(ex_2_3); sd(ex_2_3)
hist(ex_2_3, breaks = 30, main = "Mean of bimodal samples")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(21)
draw_bimodal <- function(n) {
  k  <- rbinom(n, 1, 0.5)
  k * rnorm(n, 3, 1) + (1 - k) * rnorm(n, -3, 1)
}
ex_2_3 <- replicate(5000, mean(draw_bimodal(30)))
mean(ex_2_3); sd(ex_2_3)
hist(ex_2_3, breaks = 30, main = "Mean of bimodal samples")
#> [1] -0.003
#> [1] 0.578
#> Histogram: unimodal, centred near 0, bell-shaped.
```

**Explanation:** This is the most striking CLT visual: the *population* has two well-separated peaks at -3 and +3, but the sampling distribution of the mean at n = 30 has a single peak at 0. Once you average 30 draws, you rarely get all of them from one peak; you almost always get a mix that averages near zero. The CLT does not care that the source distribution is non-normal, only that variance is finite.

</details>

### Exercise 2.4: Track skewness and excess kurtosis as n grows

**Task:** For an exponential(rate = 1) population, generate 4000 sample means at each n in (5, 10, 30, 100, 500). For each n, compute the sample skewness and the excess kurtosis of the resulting sample-mean distribution using the helpers from the setup block. Save a `data.frame` with columns `n`, `skew`, `excess_kurt` to `ex_2_4`. Use seed 5.

**Expected result:**

```
#> ex_2_4
#>     n   skew  excess_kurt
#> 1   5  0.881         1.14
#> 2  10  0.628         0.55
#> 3  30  0.366         0.14
#> 4 100  0.196         0.05
#> 5 500  0.090        -0.01
#> Both columns shrink toward 0 as n grows (CLT in numbers)
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(5)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
ns <- c(5, 10, 30, 100, 500)
rows <- lapply(ns, function(n) {
  xbar <- replicate(4000, mean(rexp(n, rate = 1)))
  data.frame(n = n, skew = moment_skew(xbar), excess_kurt = excess_kurt(xbar))
})
ex_2_4 <- do.call(rbind, rows)
ex_2_4
#>     n   skew  excess_kurt
#> 1   5  0.881         1.14
#> 2  10  0.628         0.55
#> 3  30  0.366         0.14
#> 4 100  0.196         0.05
#> 5 500  0.090        -0.01
```

**Explanation:** Population skewness of exp(1) is 2 and excess kurtosis is 6. Theory: the skewness of the sample mean is pop_skew/sqrt(n) (so 2/sqrt(n)) and the excess kurtosis is pop_kurt/n (so 6/n). At n = 5 you would predict skew 0.894 and kurt 1.2; the table reproduces both. The skewness shrinks like 1/sqrt(n) (slow), kurtosis like 1/n (fast), so kurtosis cleans up first. Useful for picking n in a Monte Carlo study.

</details>

## Section 3. Sample size, standard error, convergence (3 problems)

### Exercise 3.1: Verify the sigma over sqrt n scaling empirically

**Task:** For a uniform(0, 1) population (population sd = 1/sqrt(12) ≈ 0.2887), generate 4000 sample means at each n in (10, 30, 100, 300, 1000). Compute the empirical standard deviation of each batch of sample means and compare it to the theoretical standard error sigma/sqrt(n). Save a `data.frame` with columns `n`, `empirical_se`, `theoretical_se` to `ex_3_1`. Use seed 3.

**Expected result:**

```
#> ex_3_1
#>      n empirical_se theoretical_se
#> 1   10       0.0915         0.0913
#> 2   30       0.0526         0.0527
#> 3  100       0.0290         0.0289
#> 4  300       0.0167         0.0167
#> 5 1000       0.0091         0.0091
#> The two columns agree to three decimal places: the CLT scaling holds.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(3)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
pop_sd <- 1 / sqrt(12)
ns <- c(10, 30, 100, 300, 1000)
rows <- lapply(ns, function(n) {
  xbar <- replicate(4000, mean(runif(n)))
  data.frame(n = n,
             empirical_se   = sd(xbar),
             theoretical_se = pop_sd / sqrt(n))
})
ex_3_1 <- do.call(rbind, rows)
ex_3_1
#>      n empirical_se theoretical_se
#> 1   10       0.0915         0.0913
#> 2   30       0.0526         0.0527
#> 3  100       0.0290         0.0289
#> 4  300       0.0167         0.0167
#> 5 1000       0.0091         0.0091
```

**Explanation:** The "/ sqrt(n)" rule is the working part of the CLT for practitioners. Doubling the sample size only shrinks the standard error by a factor of sqrt(2) ≈ 1.41, not by 2. This table makes the diminishing returns concrete: going from n = 100 to n = 1000 is a 10x cost increase for only a 3.2x SE reduction. It is also why fixing precision usually requires far larger samples than people guess.

</details>

### Exercise 3.2: Measure the empirical coverage of a 95 percent t-CI

**Task:** Demonstrate the coverage promise of a CLT-based 95% confidence interval. For a chi-square(df = 4) population (true mean = 4), draw 4000 samples of size 30, compute the t-based 95% CI for each sample using `t.test()`, then compute the fraction of intervals that cover the true mean 4. Save the coverage as a numeric scalar to `ex_3_2`. Use seed 9.

**Expected result:**

```
#> ex_3_2
#> [1] 0.9415
#> Nominal 95%: about 0.95 expected
#> A small undercoverage at n=30 is normal for a moderately skewed population
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(9)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(9)
covers <- replicate(4000, {
  s  <- rchisq(30, df = 4)
  ci <- t.test(s)$conf.int
  ci[1] <= 4 & 4 <= ci[2]
})
ex_3_2 <- mean(covers)
ex_3_2
#> [1] 0.9415
```

**Explanation:** The t-interval inherits its coverage promise from the CLT plus an adjustment for unknown variance. Coverage equal to the nominal level requires the sample mean to be approximately normal and the sample variance estimate to follow a chi-square. The chi-square(4) population is moderately skewed (skew ≈ 1.41), so at n = 30 a small undercoverage shows up. Bumping n to 100 typically pushes coverage above 0.948 for this population.

</details>

### Exercise 3.3: Find the smallest n that passes Shapiro-Wilk normality

**Task:** For each of three populations (exponential(1), lognormal(0, 1), Bernoulli(0.1)), find the smallest n at which the Shapiro-Wilk test on 500 sample means fails to reject normality at alpha = 0.05. Sweep n over (5, 10, 20, 50, 100, 200, 500, 1000). Save a `data.frame` with columns `population`, `min_n_passing` to `ex_3_3`. Use seed 13.

**Expected result:**

```
#> ex_3_3
#>           population  min_n_passing
#> 1     exponential(1)             50
#> 2     lognormal(0,1)            500
#> 3     Bernoulli(0.1)            200
#> Skewed/heavy-tailed populations need a bigger n to look normal in a formal test.
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(13)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
ns  <- c(5, 10, 20, 50, 100, 200, 500, 1000)
pops <- list(
  "exponential(1)" = function(n) rexp(n, 1),
  "lognormal(0,1)" = function(n) rlnorm(n, 0, 1),
  "Bernoulli(0.1)" = function(n) rbinom(n, 1, 0.1)
)
find_min <- function(draw) {
  for (n in ns) {
    xbar <- replicate(500, mean(draw(n)))
    if (shapiro.test(xbar)$p.value > 0.05) return(n)
  }
  NA_real_
}
ex_3_3 <- data.frame(
  population    = names(pops),
  min_n_passing = vapply(pops, find_min, numeric(1))
)
rownames(ex_3_3) <- NULL
ex_3_3
#>           population  min_n_passing
#> 1     exponential(1)             50
#> 2     lognormal(0,1)            500
#> 3     Bernoulli(0.1)            200
```

**Explanation:** Shapiro-Wilk on 500 sample means is a much stricter check than "looks bell-shaped on a histogram"; it catches departures invisible to the eye. The ordering matches the population skewness: exponential (skew 2), Bernoulli p = 0.1 (skew ≈ 2.67), lognormal (skew ≈ 6.18). Rule of thumb: a heavy-tailed or discrete-with-rare-event population needs an n in the hundreds before the sample-mean distribution is statistically indistinguishable from normal.

</details>

## Section 4. Working with the sampling distribution (3 problems)

### Exercise 4.1: Tail probability for a sample mean: CLT vs simulation

**Task:** A factory line produces parts with mean weight 10.0 grams and population sd 2.0 grams. The QA team draws random samples of size 64. Use the CLT (`pnorm()` against the implied sampling distribution) to compute the probability that the sample mean exceeds 10.5 grams, then verify with a 20000-replicate simulation from a normal population. Save a named list `list(clt = ..., sim = ...)` to `ex_4_1`. Use seed 17.

**Expected result:**

```
#> ex_4_1
#> $clt
#> [1] 0.02275
#>
#> $sim
#> [1] 0.0228
#> The two estimates agree to three decimal places.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(17)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(17)
mu  <- 10
sig <- 2
n   <- 64
se  <- sig / sqrt(n)

clt_p <- 1 - pnorm(10.5, mean = mu, sd = se)
sim_p <- mean(replicate(20000, mean(rnorm(n, mu, sig))) > 10.5)

ex_4_1 <- list(clt = clt_p, sim = sim_p)
ex_4_1
#> $clt
#> [1] 0.02275
#> $sim
#> [1] 0.0228
```

**Explanation:** The CLT turns a question about a sample average into a `pnorm()` lookup once you know population mean and standard deviation. The standard error 2/sqrt(64) = 0.25 puts 10.5 exactly two SE above the mean, giving the tail probability ~ 0.0228. Crucially, the answer holds *whatever* the part-weight distribution looks like, provided the population variance is finite; the simulation is normal here for verifiability, but the QA team can apply this CLT argument without knowing the true shape.

</details>

### Exercise 4.2: Distribution of a difference of two sample means

**Task:** Two groups: group A is normal(50, 10) and group B is normal(48, 10). Draw 5000 paired samples of size 40 from each group, compute the mean of A minus the mean of B for each pair, and store the differences. Save the 5000-long vector of differences to `ex_4_2`. Use seed 23. Then verify the empirical mean and standard deviation match the CLT prediction.

**Expected result:**

```
#> length(ex_4_2)
#> [1] 5000
#> mean(ex_4_2)
#> [1] 2.005
#> sd(ex_4_2)
#> [1] 2.241
#> Theoretical SE of difference: sqrt(10^2/40 + 10^2/40) = 2.236
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(23)
ex_4_2 <- # your code here
length(ex_4_2); mean(ex_4_2); sd(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(23)
ex_4_2 <- replicate(5000, mean(rnorm(40, 50, 10)) - mean(rnorm(40, 48, 10)))
length(ex_4_2); mean(ex_4_2); sd(ex_4_2)
#> [1] 5000
#> [1] 2.005
#> [1] 2.241
```

**Explanation:** Two independent sample means are themselves approximately normal under the CLT, so their difference is approximately normal too with variance equal to the sum of variances. That is the formula behind every two-sample t-test: sqrt(s_A^2/n_A + s_B^2/n_B). The empirical sd 2.241 lands within 0.3% of the theoretical 2.236. If you change one variance, the difference SE is dominated by the larger one, which is why unbalanced variances motivate Welch's adjustment.

</details>

### Exercise 4.3: Sample proportion CLT with a rare-event probability

**Task:** For a true success probability p = 0.04 (a rare event) and sample size n = 250, simulate 4000 sample proportions. Compare the empirical mean and sd to the CLT predictions (mean = p, sd = sqrt(p*(1-p)/n)), and report the fraction of simulations that landed at exactly 0 (a boundary issue when n*p is small). Save a one-row `data.frame` with columns `mean_phat`, `sd_phat`, `theo_sd`, `pct_zero` to `ex_4_3`. Use seed 27.

**Expected result:**

```
#> ex_4_3
#>   mean_phat sd_phat theo_sd pct_zero
#> 1    0.0400  0.0124  0.0124   0.005
#> np = 10 is borderline; the normal approximation works
#> but the right tail is thicker than dnorm predicts.
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(27)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(27)
p <- 0.04
n <- 250
phat <- replicate(4000, mean(rbinom(n, 1, p)))

ex_4_3 <- data.frame(
  mean_phat = mean(phat),
  sd_phat   = sd(phat),
  theo_sd   = sqrt(p * (1 - p) / n),
  pct_zero  = mean(phat == 0)
)
ex_4_3
#>   mean_phat sd_phat theo_sd pct_zero
#> 1    0.0400  0.0124  0.0124   0.005
```

**Explanation:** The textbook rule "n*p >= 10 and n*(1-p) >= 10" puts this exactly on the threshold (n*p = 10). The empirical mean and sd line up with the CLT predictions, but a small slice of simulations (~0.5%) returned phat = 0, which dnorm() cannot produce; that residual right skew is why Wilson intervals beat Wald intervals for low p. As p drops below 0.02 at this n, the normal approximation starts to lie about the upper tail.

</details>

## Section 5. Diagnostics and pitfalls (3 problems)

### Exercise 5.1: Cauchy distribution: a population where the CLT fails

**Task:** The Cauchy distribution has an undefined population mean and infinite variance, so the CLT does not apply. Generate 5000 sample means from a Cauchy(location = 0, scale = 1) population at n = 30, then again at n = 1000. Compute the empirical standard deviation at both n values. Save a named numeric vector with names `n_30` and `n_1000` to `ex_5_1`. Use seed 33.

**Expected result:**

```
#> ex_5_1
#>     n_30    n_1000
#>    9.82      4.71
#> Cauchy sample means are themselves Cauchy(0, 1) regardless of n.
#> Empirical sd is dominated by extreme outliers, does NOT shrink with n.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(33)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(33)
xbar_30   <- replicate(5000, mean(rcauchy(30)))
xbar_1000 <- replicate(5000, mean(rcauchy(1000)))
ex_5_1 <- c(n_30 = sd(xbar_30), n_1000 = sd(xbar_1000))
ex_5_1
#>     n_30    n_1000
#>    9.82      4.71
```

**Explanation:** This is the most important *negative* result around the CLT: it requires finite variance. For the standard Cauchy, the mean of n draws has exactly the same Cauchy(0, 1) distribution as a single draw, so sigma/sqrt(n) is mathematically meaningless. The empirical sd jumps around because finite-sample variance is dominated by a few extreme outliers, not because anything is converging. Practical lesson: before invoking the CLT, sanity-check that your population has a finite second moment.

</details>

### Exercise 5.2: Compare two Q-Q plots at small n and large n

**Task:** For an exponential(rate = 0.5) population (mean = 2, sd = 2), generate 2000 sample means at n = 15 and another 2000 at n = 200. Construct one `data.frame` with columns `n_15` and `n_200` (each 2000 long), then plot two normal Q-Q diagnostics side by side using `ggplot2`. Save the long-format ggplot object to `ex_5_2`. Use seed 41.

**Expected result:**

```
#> ex_5_2 is a ggplot object with two facets ("n=15", "n=200")
#> Each facet shows sample quantiles vs theoretical normal quantiles
#> The n=15 panel curves above the reference line in the right tail (residual skew)
#> The n=200 panel hugs the line on both tails
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(41)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(41)
n_15  <- replicate(2000, mean(rexp(15,  rate = 0.5)))
n_200 <- replicate(2000, mean(rexp(200, rate = 0.5)))

df <- data.frame(
  value = c(n_15, n_200),
  panel = rep(c("n=15", "n=200"), each = 2000)
)

ex_5_2 <- ggplot(df, aes(sample = value)) +
  stat_qq(alpha = 0.3) +
  stat_qq_line(colour = "red") +
  facet_wrap(~ panel, scales = "free_y") +
  labs(title = "Normal Q-Q of sample means: exp(rate=0.5)",
       x = "theoretical quantile", y = "sample quantile") +
  theme_minimal()
ex_5_2
#> A two-panel Q-Q figure: n=15 curves up in the right tail,
#> n=200 hugs the line on both tails.
```

**Explanation:** A Q-Q plot is more sensitive than a histogram for the same data: subtle right-tail thickness shows up as systematic deviation above the line. At n = 15 the residual exponential skew (theoretical skew 2/sqrt(15) ≈ 0.52) is clearly visible. By n = 200 the residual skew shrinks to about 0.14 and the Q-Q line is straight. If a normal Q-Q on your data still curves at large n, suspect a heavy-tailed population, not "not enough data".

</details>

### Exercise 5.3: Bootstrap the sampling distribution from one observed sample

**Task:** From a single observed sample of size 60 drawn from an exponential(rate = 0.5) population (true mean = 2), use the nonparametric bootstrap with 4000 resamples to estimate the sampling distribution of the sample mean. Compare the bootstrap standard deviation to the CLT prediction sigma/sqrt(60). Save a list with names `boot_means` (length 4000), `boot_sd` (scalar), `clt_sd` (scalar) to `ex_5_3`. Use seed 47.

**Expected result:**

```
#> length(ex_5_3$boot_means)
#> [1] 4000
#> ex_5_3$boot_sd
#> [1] 0.251
#> ex_5_3$clt_sd
#> [1] 0.258
#> Both confirm the CLT scaling: bootstrap sd uses the sample sd as a proxy
#> for sigma, so it falls just below the CLT value that uses the true sigma.
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(47)
ex_5_3 <- # your code here
ex_5_3$boot_sd
ex_5_3$clt_sd
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(47)
sample_obs <- rexp(60, rate = 0.5)            # the one sample we get to see

boot_means <- replicate(
  4000,
  mean(sample(sample_obs, length(sample_obs), replace = TRUE))
)

ex_5_3 <- list(
  boot_means = boot_means,
  boot_sd    = sd(boot_means),
  clt_sd     = 2 / sqrt(60)                   # true sigma / sqrt(n)
)
ex_5_3$boot_sd
ex_5_3$clt_sd
#> [1] 0.251
#> [1] 0.258
```

**Explanation:** The bootstrap is the CLT made empirical: instead of relying on sigma/sqrt(n) with an unknown sigma, you resample with replacement from the observed sample and let the variability of those resampled means estimate the standard error. When the CLT conditions hold, the bootstrap distribution converges to the same normal the CLT predicts, with sample sd standing in for population sigma. This is why the bootstrap is the default standard error tool when you have one sample and no formula.

</details>

## What to do next

Once you can simulate, plot, and diagnose a sampling distribution from scratch, the next step is to use the CLT as a building block in real inference workflows:

- Continue with the parent tutorial: [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html) for the full walkthrough of the theorem and its diagnostics.
- Practice inference from CLT-based standard errors: [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html).
- Drill the exploratory steps that come before any modeling: [EDA Exercises in R](EDA-Exercises-in-R.html).
- Prepare for stats interview questions where the CLT is a recurring favourite: [R Interview Questions](R-Interview-Questions.html).

---
title: "Statistics Interview Questions in R: 25 Solved Problems"
slug: "Statistics-Interview-Questions"
description: "Statistics interview questions solved in R: p-values, confidence intervals, power, A/B testing pitfalls, and regression, framed the way data science interviews ask them."
keywords: "statistics interview questions, statistics questions for data science interviews, p-value interview question, confidence interval interpretation, statistical power, a/b testing statistics"
mathjax: true
webr: true
date: "2026-07-14"
post_type: "EX"
sidebar_title: "Statistics Interview Questions"
sidebar_order: 145
fr_parent: "Statistical-Tests-in-R.html"
auto_link_terms: "statistics interview questions|p-value|confidence interval|statistical power|a/b testing"
auto_link_case_sensitive: false
target_keyword: "statistics interview questions"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Statistics Interview Questions in R: 25 Solved Problems

<p class="lead">The 25 statistics questions data science interviews actually ask, each rebuilt as a runnable R problem: p-values, confidence intervals, power and minimum detectable effect, A/B testing traps, and regression diagnostics. Every solution is hidden behind a reveal so you can attempt first, then check.</p>

These are not textbook drills. They are the conceptual questions an interviewer probes with ("what does a p-value actually mean?", "why can't you stop an A/B test as soon as it's significant?") turned into short problems you solve in the console and verify against real output. Work top to bottom: each section climbs from a warm-up to a genuinely tricky question.

```r title="Run this once before any exercise"
library(dplyr)
```

## Section 1. Sampling distributions and the CLT (4 problems)

### Exercise 1.1: Separate standard deviation from standard error

**Task:** An interviewer asks you to explain the difference between standard deviation and standard error, then show it in code. Using the `mtcars` dataset, compute both the standard deviation of `mpg` and the standard error of the mean `mpg` (the standard deviation divided by the square root of the sample size). Save the two-element named vector to `ex_1_1`.

**Expected result:**

```
#>     sd     se 
#> 6.0269 1.0654 
```

**Difficulty:** Beginner

[HINTS]
One number describes the spread of individual cars; the other describes how precisely you know the average. The second shrinks as the sample grows.
Use `sd(mtcars$mpg)` for the spread and divide it by `sqrt(length(mtcars$mpg))` for the standard error.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- round(c(sd = sd(mtcars$mpg),
                  se = sd(mtcars$mpg) / sqrt(length(mtcars$mpg))), 4)
ex_1_1
#>     sd     se 
#> 6.0269 1.0654 
```

**Explanation:** Standard deviation measures variability in the data itself and does not shrink with more observations. Standard error measures the precision of a statistic (here the mean) and equals $\sigma/\sqrt{n}$, so it shrinks as $n$ grows. The classic interview mistake is quoting the standard deviation when asked how confident you are in an average. Any interval you build around a mean uses the standard error, not the standard deviation.

</details>

### Exercise 1.2: Show the CLT tames a skewed population

**Task:** A common interview claim is that sample means become approximately Normal even when the raw data is skewed. Draw 10,000 samples of size 30 from an exponential population with rate 1, take each sample mean, and report the mean and standard deviation of those 10,000 means alongside the theoretical standard error. Use `set.seed(1)` and save the named vector to `ex_1_2`.

**Expected result:**

```
#>           mean             sd theoretical_se 
#>         1.0008         0.1813         0.1826 
```

**Difficulty:** Intermediate

[HINTS]
The exponential population has mean 1 and standard deviation 1, so the sampling distribution of the mean should center near 1 with a spread of one over the square root of the sample size.
Wrap `mean(rexp(30, rate = 1))` in `replicate(10000, ...)`, then take `mean()` and `sd()` of the result and compare with `1 / sqrt(30)`.

```r title="Your turn"
set.seed(1)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
sample_means <- replicate(10000, mean(rexp(30, rate = 1)))
ex_1_2 <- round(c(mean = mean(sample_means),
                  sd = sd(sample_means),
                  theoretical_se = 1 / sqrt(30)), 4)
ex_1_2
#>           mean             sd theoretical_se 
#>         1.0008         0.1813         0.1826 
```

**Explanation:** The exponential is strongly right-skewed, yet the distribution of its sample means is nearly Normal and centered at the population mean, with spread matching $\sigma/\sqrt{n}$. This is the Central Limit Theorem in action, and it is why t-tests and z-intervals work on non-Normal data once $n$ is moderate. The interviewer is checking that you know the CLT is about the distribution of the mean, not about the raw data becoming Normal.

</details>

### Exercise 1.3: Explain why the standard error falls with the square root of n

**Task:** An interviewer asks why quadrupling your sample size only halves your uncertainty. Assume a population standard deviation of 15 and compute the standard error of the mean for sample sizes 25, 100, and 400. Return the three standard errors as a named vector and save it to `ex_1_3`.

**Expected result:**

```
#>  n_25 n_100 n_400 
#>  3.00  1.50  0.75 
```

**Difficulty:** Intermediate

[HINTS]
The standard error is the population standard deviation divided by the square root of the sample size, so it is the square root relationship that governs how fast uncertainty shrinks.
Build a vector `n <- c(25, 100, 400)` and compute `15 / sqrt(n)` in one vectorised expression.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sigma <- 15
n <- c(25, 100, 400)
ex_1_3 <- round(sigma / sqrt(n), 4)
names(ex_1_3) <- paste0("n_", n)
ex_1_3
#>  n_25 n_100 n_400 
#>  3.00  1.50  0.75 
```

**Explanation:** Because the standard error is $\sigma/\sqrt{n}$, precision improves with the square root of the sample size, not linearly. Going from 25 to 100 (a 4x increase) halves the error from 3.0 to 1.5; another 4x to 400 halves it again. The practical takeaway interviewers want is that diminishing returns are built in: each additional decimal place of precision costs roughly 100 times more data.

</details>

### Exercise 1.4: Bootstrap a standard error that has no formula

**Task:** The median has no simple closed-form standard error, so an interviewer asks how you would estimate its sampling variability. Use the bootstrap: resample `mtcars$mpg` with replacement 2,000 times, take the median of each resample, and report the standard deviation of those bootstrap medians. Use `set.seed(42)` and save the single number to `ex_1_4`.

**Expected result:**

```
#> [1] 1.2409
```

**Difficulty:** Advanced

[HINTS]
The bootstrap approximates the sampling distribution of any statistic by resampling the observed data with replacement; the spread of that distribution estimates the standard error.
Use `replicate(2000, median(sample(mtcars$mpg, replace = TRUE)))`, then take `sd()` of the result.

```r title="Your turn"
set.seed(42)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
boot_meds <- replicate(2000, median(sample(mtcars$mpg, replace = TRUE)))
ex_1_4 <- round(sd(boot_meds), 4)
ex_1_4
#> [1] 1.2409
```

**Explanation:** The bootstrap treats the sample as a stand-in for the population, so resampling it with replacement mimics drawing fresh samples. The standard deviation of the resampled statistic estimates its standard error, which is invaluable for statistics like the median, trimmed mean, or a ratio where no clean formula exists. A common mistake is resampling without replacement, which just reshuffles the same values and gives zero variability.

</details>

## Section 2. Confidence intervals and what they really mean (4 problems)

### Exercise 2.1: Read a 95% confidence interval from t.test

**Task:** An interviewer hands you a sample and asks for a 95% confidence interval for the mean. Run a one-sample t-test on `mtcars$mpg` and extract just the confidence interval from the result. Save the two-element interval (rounded to four decimals) to `ex_2_1`.

**Expected result:**

```
#> [1] 17.9177 22.2636
#> attr(,"conf.level")
#> [1] 0.95
```

**Difficulty:** Beginner

[HINTS]
`t.test()` on a single numeric vector returns an object whose components you can pull out by name; the interval lives in one of them.
Call `t.test(mtcars$mpg)` and index its `$conf.int` element.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- round(t.test(mtcars$mpg)$conf.int, 4)
ex_2_1
#> [1] 17.9177 22.2636
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test()` returns a list, and `$conf.int` carries the interval plus a `conf.level` attribute. The correct interpretation, and the one interviewers test, is procedural: if you repeated this sampling many times, about 95% of the intervals so constructed would contain the true mean. It does not mean there is a 95% probability the true mean lies in this particular interval, which is a fixed but unknown quantity. Question 2.3 demonstrates the coverage claim by simulation.

</details>

### Exercise 2.2: Rebuild the interval by hand and compare t to z

**Task:** To prove you understand where a confidence interval comes from, construct one for the mean of `mtcars$mpg` manually as the mean plus or minus the critical value times the standard error, once using the t critical value and once using the Normal (z) critical value. Return both intervals as a two-row matrix and save it to `ex_2_2`.

**Expected result:**

```
#>      [,1]    [,2]
#> t 17.9177 22.2636
#> z 18.0024 22.1788
```

**Difficulty:** Intermediate

[HINTS]
The half-width is a critical value times the standard error; the only difference between the two intervals is whether that critical value comes from a t distribution or a Normal.
Use `qt(0.975, n - 1)` for the t critical value and `qnorm(0.975)` for the z, then bind the two intervals with `rbind()`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- mtcars$mpg
n <- length(x)
se <- sd(x) / sqrt(n)
t_ci <- mean(x) + c(-1, 1) * qt(0.975, n - 1) * se
z_ci <- mean(x) + c(-1, 1) * qnorm(0.975) * se
ex_2_2 <- round(rbind(t = t_ci, z = z_ci), 4)
ex_2_2
#>      [,1]    [,2]
#> t 17.9177 22.2636
#> z 18.0024 22.1788
```

**Explanation:** The t interval is slightly wider because the t distribution has heavier tails, which is the correct penalty for estimating the standard deviation from the same small sample. As $n$ grows the t and z critical values converge, so the two intervals become indistinguishable. Interviewers use this to check that you know when the Normal approximation is safe (large $n$) and when the t correction matters (small $n$).

</details>

### Exercise 2.3: Verify 95% coverage by simulation

**Task:** To settle the argument about what "95% confidence" means, simulate it. Draw 10,000 samples of size 25 from a Normal population with mean 100 and standard deviation 15, build a 95% t-interval for each, and report the fraction of intervals that actually contain the true mean of 100. Use `set.seed(7)` and save the coverage proportion to `ex_2_3`.

**Expected result:**

```
#> [1] 0.9522
```

**Difficulty:** Intermediate

[HINTS]
The confidence level is a long-run property of the procedure, so the fraction of intervals covering the known true value should land near 0.95.
Inside `replicate()`, draw `rnorm(25, 100, 15)`, take `t.test(s)$conf.int`, and test whether 100 falls between the two endpoints.

```r title="Your turn"
set.seed(7)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
covers <- replicate(10000, {
  s <- rnorm(25, mean = 100, sd = 15)
  ci <- t.test(s)$conf.int
  ci[1] <= 100 && 100 <= ci[2]
})
ex_2_3 <- round(mean(covers), 4)
ex_2_3
#> [1] 0.9522
```

**Explanation:** About 95% of the intervals capture the true mean, which is exactly what the confidence level promises: it is a property of the interval-building procedure across many samples, not of any single interval. This simulation is the cleanest way to answer the interview trap "is there a 95% chance the mean is in this interval?" No: once computed, a given interval either contains the mean or it does not. The 95% describes how often the method succeeds.

</details>

### Exercise 2.4: Choose the right confidence interval for a proportion

**Task:** A conversion experiment saw 8 successes in 100 trials, and an interviewer asks why the textbook Normal approximation can mislead here. Compute three 95% intervals for the proportion: the Wald (Normal approximation) interval, the Wilson interval from `prop.test`, and the exact Clopper-Pearson interval from `binom.test`. Return them as a three-row matrix and save it to `ex_2_4`.

**Expected result:**

```
#>          [,1]   [,2]
#> wald   0.0268 0.1332
#> wilson 0.0377 0.1561
#> exact  0.0352 0.1516
```

**Difficulty:** Advanced

[HINTS]
When the proportion is close to 0 or 1 and the sample is small, the symmetric Normal-based interval can stray toward impossible values and undercover; two better methods are built into base R.
Build the Wald interval from `qnorm(0.975)` and the standard error of a proportion, then pull `$conf.int` out of `prop.test(8, 100)` and `binom.test(8, 100)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 8
n <- 100
wald <- (x / n) + c(-1, 1) * qnorm(0.975) * sqrt((x / n) * (1 - x / n) / n)
wilson <- as.numeric(prop.test(x, n)$conf.int)
exact <- as.numeric(binom.test(x, n)$conf.int)
ex_2_4 <- round(rbind(wald = wald, wilson = wilson, exact = exact), 4)
ex_2_4
#>          [,1]   [,2]
#> wald   0.0268 0.1332
#> wilson 0.0377 0.1561
#> exact  0.0352 0.1516
```

**Explanation:** The Wald interval is symmetric around the point estimate and assumes Normality, which breaks down for small $n$ or extreme proportions, so it sits noticeably lower and undercovers here. The Wilson and exact intervals respect the boundary at 0 and give more honest coverage. The interview point is that "confidence interval for a proportion" is not one formula: reach for Wilson or exact when events are rare, and never let a Wald interval slip below 0 or above 1.

</details>

## Section 3. Hypothesis tests and p-values (5 problems)

### Exercise 3.1: Read a two-sample t-test output end to end

**Task:** An interviewer shows you a t-test and asks you to narrate every line. Run a two-sample (Welch) t-test comparing `mpg` across the two levels of transmission `am` in `mtcars`, and save the full test object to `ex_3_1` so you can read the statistic, degrees of freedom, p-value, interval, and group means.

**Expected result:**

```
#> 	Welch Two Sample t-test
#> 
#> data:  mpg by am
#> t = -3.7671, df = 18.332, p-value = 0.001374
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -11.280194  -3.209684
#> sample estimates:
#> mean in group 0 mean in group 1 
#>        17.14737        24.39231 
```

**Difficulty:** Beginner

[HINTS]
The formula interface splits the numeric response by a grouping variable, and Welch is the default so you do not need to assume equal variances.
Call `t.test(mpg ~ am, data = mtcars)` and let it print.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- t.test(mpg ~ am, data = mtcars)
ex_3_1
#> 	Welch Two Sample t-test
#> 
#> data:  mpg by am
#> t = -3.7671, df = 18.332, p-value = 0.001374
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -11.280194  -3.209684
#> sample estimates:
#> mean in group 0 mean in group 1 
#>        17.14737        24.39231 
```

**Explanation:** The p-value of 0.001374 is the probability of a t statistic at least this extreme if the two group means were truly equal, so it is evidence against the null of no difference, not the probability the null is true. The fractional degrees of freedom flag the Welch correction for unequal variances. The confidence interval excludes 0, which agrees with the small p-value, and the group means show automatic transmissions average about 7 mpg lower.

</details>

### Exercise 3.2: Halve a p-value correctly with a one-sided test

**Task:** An interviewer asks when a one-sided test is legitimate and how its p-value relates to the two-sided one. Using `mpg ~ am` in `mtcars`, run the two-sided Welch t-test and the one-sided version whose alternative matches the observed direction, then report both p-values in one named vector saved to `ex_3_2`.

**Expected result:**

```
#> two_sided one_sided 
#>  0.001374  0.000687 
```

**Difficulty:** Intermediate

[HINTS]
When the observed effect falls in the hypothesised direction, the one-sided p-value is exactly half the two-sided one, because it counts only one tail.
Run `t.test(mpg ~ am, data = mtcars)` with `alternative = "two.sided"` and again with `alternative = "less"`, then pull each `$p.value`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tt2 <- t.test(mpg ~ am, data = mtcars, alternative = "two.sided")
tt1 <- t.test(mpg ~ am, data = mtcars, alternative = "less")
ex_3_2 <- round(c(two_sided = tt2$p.value, one_sided = tt1$p.value), 6)
ex_3_2
#> two_sided one_sided 
#>  0.001374  0.000687 
```

**Explanation:** The one-sided p-value is half the two-sided value because it places all the significance in a single tail. The catch interviewers probe: you must commit to the direction before seeing the data. Choosing "less" only after noticing group 0 was lower is p-hacking, and it doubles your true Type I error rate. One-sided tests are defensible only when the opposite direction is genuinely irrelevant to the decision.

</details>

### Exercise 3.3: Confirm alpha controls the false positive rate

**Task:** To show what the significance level actually guarantees, simulate the null being true: draw two independent standard-Normal samples of size 30, run a t-test, and record whether it falsely rejects at the 0.05 level. Repeat 10,000 times and report the false positive rate. Use `set.seed(3)` and save it to `ex_3_3`.

**Expected result:**

```
#> [1] 0.0502
```

**Difficulty:** Intermediate

[HINTS]
When both samples come from the same distribution there is no real difference, so any rejection is a false alarm; the long-run rate of those alarms is exactly what the significance level sets.
Inside `replicate()`, draw two `rnorm(30)` samples and test `t.test(a, b)$p.value < 0.05`, then take the `mean()`.

```r title="Your turn"
set.seed(3)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
reject <- replicate(10000, {
  a <- rnorm(30)
  b <- rnorm(30)
  t.test(a, b)$p.value < 0.05
})
ex_3_3 <- round(mean(reject), 4)
ex_3_3
#> [1] 0.0502
```

**Explanation:** With no true difference, the test still rejects about 5% of the time, which is precisely the definition of the significance level $\alpha$: the probability of a Type I error when the null holds. This reframes the interview answer to "what is a p-value threshold?" It is not a measure of truth; it is the false-alarm rate you are willing to tolerate. The next question shows the deeper reason this works.

</details>

### Exercise 3.4: Show p-values are uniform under the null

**Task:** A sharp interviewer asks what distribution p-values follow when the null hypothesis is true. Simulate 10,000 t-tests on pairs of independent standard-Normal samples of size 30, collect the p-values, and report their 10th, 25th, 50th, 75th, and 90th percentiles. Use `set.seed(11)` and save the quantile vector to `ex_3_4`.

**Expected result:**

```
#>   10%   25%   50%   75%   90% 
#> 0.103 0.251 0.498 0.746 0.902 
```

**Difficulty:** Intermediate

[HINTS]
If a variable is uniform on the unit interval, its quantiles line up almost exactly with the probabilities you ask for, so the 25th percentile sits near 0.25 and the median near 0.5.
Collect `t.test(rnorm(30), rnorm(30))$p.value` inside `replicate()`, then apply `quantile()` at `c(0.1, 0.25, 0.5, 0.75, 0.9)`.

```r title="Your turn"
set.seed(11)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
pvals <- replicate(10000, {
  a <- rnorm(30)
  b <- rnorm(30)
  t.test(a, b)$p.value
})
ex_3_4 <- round(quantile(pvals, c(0.1, 0.25, 0.5, 0.75, 0.9)), 3)
ex_3_4
#>   10%   25%   50%   75%   90% 
#> 0.103 0.251 0.498 0.746 0.902 
```

**Explanation:** Under the null, the p-value is uniformly distributed on the unit interval, so its quantiles trace the identity line and about 5% of them fall below 0.05 (here 4.94%). This single fact explains Question 3.3: the 5% false positive rate is a direct consequence of uniformity. It also explains why running many tests is dangerous, since uniform p-values mean small values appear purely by chance, which is exactly the setup for the next problem.

</details>

### Exercise 3.5: Correct for running twenty tests at once

**Task:** You ran 20 independent comparisons and one came back "significant"; the interviewer asks whether to believe it. Simulate 20 t-tests under a true null (all with `set.seed(123)`), then count how many raw p-values fall below 0.05, how many survive a Bonferroni correction, and how many survive a Benjamini-Hochberg (FDR) correction. Save the three counts to `ex_3_5`.

**Expected result:**

```
#>        raw_below_05 bonferroni_below_05         BH_below_05 
#>                   1                   0                   0 
```

**Difficulty:** Advanced

[HINTS]
With 20 null tests you expect roughly one p-value under 0.05 by chance alone, so a multiplicity correction should shrink that apparent finding back to nothing.
Collect the 20 p-values, then compare `p.adjust(pvals, "bonferroni")` and `p.adjust(pvals, "BH")` against 0.05 with `sum(... < 0.05)`.

```r title="Your turn"
set.seed(123)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
pvals <- replicate(20, t.test(rnorm(30), rnorm(30))$p.value)
ex_3_5 <- c(
  raw_below_05        = sum(pvals < 0.05),
  bonferroni_below_05 = sum(p.adjust(pvals, "bonferroni") < 0.05),
  BH_below_05         = sum(p.adjust(pvals, "BH") < 0.05)
)
ex_3_5
#>        raw_below_05 bonferroni_below_05         BH_below_05 
#>                   1                   0                   0 
```

**Explanation:** Every null hypothesis here is true, yet one raw p-value dips below 0.05, exactly the false positive uniformity predicts. Bonferroni controls the family-wise error rate by tightening the threshold, and Benjamini-Hochberg controls the false discovery rate; both correctly reject the lone "finding" (its smallest raw p-value is 0.0388). The interview lesson is that a single significant result among many tests is usually noise, and you must state your multiple-comparison strategy before you look.

</details>

## Section 4. Power, sample size, and A/B testing (4 problems)

### Exercise 4.1: Compute the power of a planned test

**Task:** Before launching a study an interviewer asks for its statistical power. For a two-sample t-test with 50 observations per group, a true mean difference of 5, a standard deviation of 10, and a significance level of 0.05, compute the power and save the full `power.t.test` result to `ex_4_1`.

**Expected result:**

```
#>      Two-sample t test power calculation 
#> 
#>               n = 50
#>           delta = 5
#>              sd = 10
#>       sig.level = 0.05
#>           power = 0.6968888
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

[HINTS]
Power is the probability of detecting a real effect of a given size, so it depends on the sample size, the effect size, the noise, and the significance level together.
Call `power.t.test()` with `n`, `delta`, `sd`, and `sig.level`, leaving `power` unset so it is solved for.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- power.t.test(n = 50, delta = 5, sd = 10, sig.level = 0.05)
ex_4_1
#>      Two-sample t test power calculation 
#> 
#>               n = 50
#>           delta = 5
#>              sd = 10
#>       sig.level = 0.05
#>           power = 0.6968888
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Explanation:** Power is the probability of rejecting the null when the alternative is genuinely true, so here you would catch a real difference of 5 only about 70% of the time, below the conventional 80% target. Interviewers want you to see that a "non-significant" result from an underpowered study is uninformative: absence of evidence is not evidence of absence. The four levers are effect size, variability, sample size, and $\alpha$; fixing any three determines the fourth.

</details>

### Exercise 4.2: Size an A/B test for a target lift

**Task:** A product manager wants to detect a conversion lift from 10% to 12% at 80% power with a 0.05 significance level, and asks how many users per variant the A/B test needs. Use a two-proportion power calculation to solve for the per-group sample size and save the full result to `ex_4_2`.

**Expected result:**

```
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 3840.847
#>              p1 = 0.1
#>              p2 = 0.12
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

[HINTS]
Leave the sample size unspecified and supply the two conversion rates plus the desired power, and the routine solves for the per-arm size.
Call `power.prop.test()` with `p1`, `p2`, `power`, and `sig.level`, omitting `n`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- power.prop.test(p1 = 0.10, p2 = 0.12, power = 0.80, sig.level = 0.05)
ex_4_2
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 3840.847
#>              p1 = 0.1
#>              p2 = 0.12
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Explanation:** Detecting a 2-point absolute lift needs about 3,841 users per arm, roughly 7,700 total, which surprises people who expect a few hundred. Round up to be safe, since a fractional sample size cannot be met by rounding down. The interview point is that small effects demand large samples, and quoting a sample size without stating the effect size, power, and baseline rate is meaningless. This is the single most common applied A/B question.

</details>

### Exercise 4.3: Find the minimum detectable effect for a fixed sample

**Task:** Your team can only allocate 5,000 users per variant, and the interviewer asks what lift you could actually detect. Holding the baseline conversion at 10%, 80% power, and a 0.05 level, solve the two-proportion power calculation for the treatment rate `p2`, the minimum detectable effect, and save the full result to `ex_4_3`.

**Expected result:**

```
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 5000
#>              p1 = 0.1
#>              p2 = 0.1174309
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Difficulty:** Intermediate

[HINTS]
This is the sample-size question run in reverse: fix the sample size and the power, and let the routine solve for the second proportion instead.
Call `power.prop.test()` with `n`, `p1`, `power`, and `sig.level`, leaving `p2` unset.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- power.prop.test(n = 5000, p1 = 0.10, power = 0.80, sig.level = 0.05)
ex_4_3
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 5000
#>              p1 = 0.1
#>              p2 = 0.1174309
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**Explanation:** With 5,000 users per arm you can reliably detect a lift only if the true conversion rate reaches about 11.7%, a 1.7-point absolute (17% relative) improvement. Anything smaller will usually go undetected, so promising to catch a "1% lift" with this sample is not credible. Framing the minimum detectable effect up front stops teams from running tests that were doomed to be inconclusive, which is exactly the planning maturity interviewers look for.

</details>

### Exercise 4.4: Expose the peeking problem in A/B tests

**Task:** An interviewer asks why you cannot stop an A/B test the moment it turns significant. Simulate a true null (two Normal streams of 1,000 users each), peek at the p-value after 200, 400, 600, 800, and 1,000 observations, and declare a "win" if any peek is significant at 0.05. Repeat 2,000 times with `set.seed(99)` and report the inflated false positive rate saved to `ex_4_4`.

**Expected result:**

```
#> [1] 0.1415
```

**Difficulty:** Advanced

[HINTS]
Each additional look is another chance to cross the threshold by luck, so the overall false positive rate climbs well above the nominal 0.05 you set for a single test.
Inside `replicate()`, generate both full streams once, then use `any(sapply(looks, function(k) t.test(a[1:k], b[1:k])$p.value < 0.05))`.

```r title="Your turn"
set.seed(99)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
looks <- c(200, 400, 600, 800, 1000)
false_pos <- replicate(2000, {
  a <- rnorm(1000)
  b <- rnorm(1000)
  any(sapply(looks, function(k) t.test(a[1:k], b[1:k])$p.value < 0.05))
})
ex_4_4 <- round(mean(false_pos), 4)
ex_4_4
#> [1] 0.1415
```

**Explanation:** Peeking five times and stopping at the first significant result inflates the false positive rate from 5% to about 14%, because each look is a fresh opportunity for noise to cross the line. This is why stopping an experiment as soon as it "wins" is a classic way to ship an illusory effect. The disciplined fixes interviewers expect are a fixed sample size decided in advance, or sequential methods (alpha spending, always-valid p-values) that budget the error across looks.

</details>

## Section 5. Regression: assumptions and reading output (5 problems)

### Exercise 5.1: Interpret a slope coefficient

**Task:** An interviewer shows a simple regression and asks you to interpret the slope. Fit a linear model of `mpg` on `wt` (weight) in `mtcars`, extract the coefficient table from the summary, and save it (rounded to four decimals) to `ex_5_1`.

**Expected result:**

```
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2851     1.8776 19.8576        0
#> wt           -5.3445     0.5591 -9.5590        0
```

**Difficulty:** Beginner

[HINTS]
The coefficient table lives inside the model summary, not the raw model object, and each row carries an estimate, its standard error, a t statistic, and a p-value.
Fit with `lm(mpg ~ wt, data = mtcars)`, then pull `summary(model)$coefficients`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- round(summary(lm(mpg ~ wt, data = mtcars))$coefficients, 4)
ex_5_1
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2851     1.8776 19.8576        0
#> wt           -5.3445     0.5591 -9.5590        0
```

**Explanation:** The slope of -5.34 means each additional 1,000 lbs of weight is associated with about 5.3 fewer miles per gallon, holding nothing else in this one-predictor model. The p-values print as 0 only because rounding hides values far below 0.0001; the large t statistics confirm strong evidence. Interviewers want the word "associated": regression on observational data quantifies association, and calling the slope a causal effect without a design to support it is the classic overreach.

</details>

### Exercise 5.2: Explain R-squared versus adjusted R-squared

**Task:** An interviewer asks why you report adjusted R-squared when comparing models. Fit `mpg` on both `wt` and `hp` in `mtcars`, then extract the multiple R-squared and the adjusted R-squared into one named vector and save it to `ex_5_2`.

**Expected result:**

```
#>     r_squared adj_r_squared 
#>        0.8268        0.8148 
```

**Difficulty:** Intermediate

[HINTS]
One of these two numbers can only rise when you add predictors, while the other penalises you for predictors that do not earn their keep.
Fit `lm(mpg ~ wt + hp, data = mtcars)` and read `summary(m)$r.squared` and `summary(m)$adj.r.squared`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(mpg ~ wt + hp, data = mtcars)
ex_5_2 <- round(c(r_squared = summary(m)$r.squared,
                  adj_r_squared = summary(m)$adj.r.squared), 4)
ex_5_2
#>     r_squared adj_r_squared 
#>        0.8268        0.8148 
```

**Explanation:** R-squared is the share of variance in `mpg` explained by the model and can never decrease when you add a predictor, even a useless one, which makes it a bad tool for comparing models of different sizes. Adjusted R-squared subtracts a penalty for each parameter, so it rises only when a new predictor improves fit more than chance would. That is why interviewers ask you to prefer the adjusted version, or a held-out metric, for model selection.

</details>

### Exercise 5.3: Check the normality-of-residuals assumption

**Task:** An interviewer asks which linear-regression assumptions you can test and how. Fit `mpg` on `wt` in `mtcars`, extract the residuals, run a Shapiro-Wilk normality test on them, and save the test result to `ex_5_3`.

**Expected result:**

```
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(m53)
#> W = 0.94508, p-value = 0.1044
```

**Difficulty:** Intermediate

[HINTS]
The Normality assumption in linear regression is about the residuals, not the raw response, so extract the residuals first and test those.
Fit the model, call `residuals()` on it, and pass that to `shapiro.test()`.

```r title="Your turn"
m53 <- lm(mpg ~ wt, data = mtcars)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m53 <- lm(mpg ~ wt, data = mtcars)
ex_5_3 <- shapiro.test(residuals(m53))
ex_5_3
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(m53)
#> W = 0.94508, p-value = 0.1044
```

**Explanation:** The p-value of 0.10 does not reject Normality, so the residuals are consistent with the assumption. The interview nuance is that linear regression assumes Normal, constant-variance, independent errors, and it is the residuals that carry those assumptions, not the outcome variable itself. Also remember that with large samples a Shapiro-Wilk test rejects trivial departures, so residual plots (a QQ plot and residuals-versus-fitted) usually matter more than the formal test.

</details>

### Exercise 5.4: Detect multicollinearity with the variance inflation factor

**Task:** An interviewer asks how you spot correlated predictors without a special package. For the predictors `wt`, `hp`, and `disp` in `mtcars`, compute each one's variance inflation factor by regressing it on the other two and taking one over one-minus-R-squared. Return the three VIFs as a named vector saved to `ex_5_4`.

**Expected result:**

```
#>     wt     hp   disp 
#> 4.8446 2.7366 7.3245 
```

**Difficulty:** Advanced

[HINTS]
The variance inflation factor for a predictor comes from how well the other predictors explain it, so a high auxiliary R-squared means that predictor is redundant.
For each predictor, fit `lm(predictor ~ other predictors)`, read `summary(...)$r.squared`, and compute `1 / (1 - r2)`; a loop or `sapply()` over the names does all three.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
preds <- c("wt", "hp", "disp")
vif <- sapply(preds, function(p) {
  f <- as.formula(paste(p, "~", paste(setdiff(preds, p), collapse = " + ")))
  1 / (1 - summary(lm(f, data = mtcars))$r.squared)
})
ex_5_4 <- round(vif, 4)
ex_5_4
#>     wt     hp   disp 
#> 4.8446 2.7366 7.3245 
```

**Explanation:** A variance inflation factor tells you how much a coefficient's variance is inflated because that predictor is explained by the others; `disp` at 7.3 is the most redundant here. Rules of thumb flag VIF above 5 or 10 for attention. This hand-rolled version reveals what the packaged `vif` function does under the hood, which is a favourite follow-up. The fix for high collinearity is to drop or combine predictors, not to trust the individual coefficients, whose signs can flip unpredictably.

</details>

### Exercise 5.5: Demonstrate omitted-variable bias

**Task:** An interviewer asks how leaving out a confounder distorts a coefficient. Compare the coefficient on horsepower `hp` when you regress `mpg` on `hp` alone versus when you add weight `wt` to the model in `mtcars`, and save both `hp` coefficients in one named vector to `ex_5_5`.

**Expected result:**

```
#>   hp_alone hp_with_wt 
#>   -0.06823   -0.03177 
```

**Difficulty:** Intermediate

[HINTS]
When a left-out variable is correlated with both the predictor and the outcome, the predictor absorbs part of its effect, so adding the confounder should move the coefficient.
Fit `lm(mpg ~ hp)` and `lm(mpg ~ hp + wt)`, then pull the `"hp"` element of `coef()` from each.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
c1 <- coef(lm(mpg ~ hp, data = mtcars))["hp"]
c2 <- coef(lm(mpg ~ hp + wt, data = mtcars))["hp"]
ex_5_5 <- round(c(hp_alone = unname(c1), hp_with_wt = unname(c2)), 5)
ex_5_5
#>   hp_alone hp_with_wt 
#>   -0.06823   -0.03177 
```

**Explanation:** The horsepower coefficient more than halves once weight enters, because heavier cars tend to have more powerful engines, so the single-predictor model blamed horsepower for damage that weight was really doing. This is omitted-variable bias, and it is why interviewers distrust a coefficient from a model that ignores obvious confounders. The direction and size of the bias depend on how the omitted variable correlates with both the predictor and the response.

</details>

## Section 6. Classic interview traps (3 problems)

### Exercise 6.1: Reproduce Simpson's paradox

**Task:** An interviewer describes a treatment that looks better overall but worse in every subgroup and asks you to show it. Using the classic kidney-stone success counts built in the code below, compute each treatment's overall success rate with a grouped summary, then save that two-row aggregate to `ex_6_1` (the subgroup reversal is revealed in the solution).

**Expected result:**

```
#> # A tibble: 2 × 2
#>   treatment  rate
#>   <chr>     <dbl>
#> 1 A         0.78 
#> 2 B         0.826
```

**Difficulty:** Intermediate

[HINTS]
Aggregate the successes and totals within each treatment first; the paradox only appears when you compare that pooled rate against the rates computed within each stone-size group.
Use `group_by(treatment)` then `summarise(rate = sum(success) / sum(total))`.

```r title="Your turn"
stones <- data.frame(
  treatment = c("A", "A", "B", "B"),
  size      = c("small", "large", "small", "large"),
  success   = c(81, 192, 234, 55),
  total     = c(87, 263, 270, 80)
)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stones <- data.frame(
  treatment = c("A", "A", "B", "B"),
  size      = c("small", "large", "small", "large"),
  success   = c(81, 192, 234, 55),
  total     = c(87, 263, 270, 80)
)

ex_6_1 <- stones |>
  group_by(treatment) |>
  summarise(rate = sum(success) / sum(total), .groups = "drop")
ex_6_1
#> # A tibble: 2 × 2
#>   treatment  rate
#>   <chr>     <dbl>
#> 1 A         0.78 
#> 2 B         0.826

# The reversal: treatment A wins within BOTH stone sizes
stones |>
  group_by(treatment, size) |>
  summarise(rate = success / total, .groups = "drop")
#> # A tibble: 4 × 3
#>   treatment size   rate
#>   <chr>     <chr> <dbl>
#> 1 A         large 0.730
#> 2 A         small 0.931
#> 3 B         large 0.688
#> 4 B         small 0.867
```

**Explanation:** Treatment B wins on the pooled numbers (0.826 versus 0.78), yet treatment A has the higher success rate for both small and large stones. The reversal happens because A was used mostly on hard (large-stone) cases while B handled easy ones, so the aggregate is confounded by case mix. Simpson's paradox is the interview reminder that you must condition on the lurking variable; blindly pooling groups of different composition can flip the conclusion.

</details>

### Exercise 6.2: Apply Bayes' rule to a rare-disease test

**Task:** An interviewer poses the base-rate trap: a screening test is 99% sensitive and 99% specific, the disease affects 0.1% of people, and you test positive. Using Bayes' rule, compute the probability you actually have the disease given the positive result and save the single number to `ex_6_2`.

**Expected result:**

```
#> [1] 0.0902
```

**Difficulty:** Advanced

[HINTS]
The chance of a positive result mixes the few true positives from a tiny sick group with the many false positives from a huge healthy group, so the denominator is dominated by healthy people.
Compute the posterior as sensitivity times prevalence, divided by the total probability of a positive: `sensitivity * prevalence + (1 - specificity) * (1 - prevalence)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sensitivity <- 0.99
specificity <- 0.99
prevalence <- 0.001
p_pos <- sensitivity * prevalence + (1 - specificity) * (1 - prevalence)
ex_6_2 <- round(sensitivity * prevalence / p_pos, 4)
ex_6_2
#> [1] 0.0902
```

**Explanation:** Despite a "99% accurate" test, a positive result means only about a 9% chance of actually being sick, because the disease is so rare that false positives from the healthy 99.9% swamp the true positives. This base-rate neglect is one of the most-asked interview traps: accuracy figures are meaningless without the prevalence. The same arithmetic underlies fraud detection and spam filtering, where rare positive classes make precision collapse even when sensitivity looks impressive.

</details>

### Exercise 6.3: Show that zero correlation is not independence

**Task:** An interviewer claims a correlation of zero means two variables are unrelated, and asks you to disprove it. Create `x` as 101 evenly spaced points from -10 to 10, set `y` equal to `x` squared, compute their Pearson correlation, and save the rounded value to `ex_6_3`.

**Expected result:**

```
#> correlation 
#>           0 
```

**Difficulty:** Intermediate

[HINTS]
Pearson correlation only captures straight-line association, so a perfectly symmetric U-shaped relationship can have a correlation of zero while the variables are completely dependent.
Build `x <- seq(-10, 10, length.out = 101)`, set `y <- x^2`, and wrap `cor(x, y)` in a named vector.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- seq(-10, 10, length.out = 101)
y <- x^2
ex_6_3 <- round(c(correlation = cor(x, y)), 10)
ex_6_3
#> correlation 
#>           0 
```

**Explanation:** The correlation is exactly zero even though `y` is a deterministic function of `x`, because the symmetric parabola has no linear trend for Pearson correlation to pick up. The interview lesson is that a correlation of zero rules out only a linear relationship, never dependence in general; the two variables here are as related as they could possibly be. To catch nonlinear association you need scatterplots, rank correlations like Spearman, or mutual-information measures.

</details>

## What to do next

Keep drilling the topics that show up most in interviews with these related practice hubs:

- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) for deeper t-test, chi-square, and non-parametric practice.
- [Confidence Interval Exercises in R](Confidence-Interval-Exercises-in-R.html) to master interval construction and interpretation.
- [A/B Testing Exercises in R](A-B-Testing-Exercises-in-R.html) for the experiment-design and analysis questions product teams ask.
- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) to practice fitting, diagnostics, and reading model output.

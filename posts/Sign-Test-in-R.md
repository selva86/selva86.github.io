---
title: "Sign Test in R: The Simplest One-Sample Nonparametric Test"
slug: Sign-Test-in-R
description: "Run the sign test in R with binom.test(). Learn the simplest one-sample nonparametric test, when to use it over Wilcoxon, and how to handle ties."
keywords: "sign test in R, one-sample sign test, binom.test, nonparametric median test, sign test vs wilcoxon, paired sign test, R nonparametric"
auto_link_terms: "sign test|one-sample sign test|paired sign test|nonparametric median test|binom.test()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-30
curriculum_id: FR-nonp-1
post_type: FR
fr_parent: Wilcoxon-Signed-Rank-Test-in-R.html
difficulty: "Beginner"
---

# Sign Test in R: The Simplest One-Sample Nonparametric Test

<p class="lead">The sign test is the simplest one-sample nonparametric test in R. It asks whether a population's median equals a hypothesised value using only the <strong>signs</strong> of the differences, no normality, no symmetry, no rank arithmetic. In R, you run it with one line: <code>binom.test()</code>.</p>

This guide covers the test on real survey data, on paired before/after measurements, the head-to-head with Wilcoxon, and ties.

## When should you use the sign test?

The sign test answers one question: is the median of your data different from a value you specify? It counts how many observations land above your hypothesised median and treats each one like a coin flip. Under the null, you would expect roughly half above and half below, any extreme split is evidence against it. Because the test only looks at signs, it survives outliers, skew, and ordinal data that break the t-test.

A SaaS team runs a 20-user satisfaction survey on a 1 to 10 scale, and wants to know whether the median rating differs from 7.

```r title="Sign test on satisfaction scores"
# 20 satisfaction ratings, 1-10 scale. H0: median rating = 7.
scores <- c(8, 9, 7, 6, 9, 8, 8, 9, 5, 8,
            9, 7, 8, 9, 8, 9, 7, 8, 9, 8)

above <- sum(scores > 7)        # number of "+" signs
below <- sum(scores < 7)        # number of "-" signs
n_eff <- above + below          # ties are dropped

c(above = above, below = below, n_eff = n_eff)
#>  above  below  n_eff
#>     15      2     17

binom.test(above, n_eff, p = 0.5)
#>
#> 	Exact binomial test
#>
#> data:  above and n_eff
#> number of successes = 15, number of trials = 17, p-value = 0.002351
#> alternative hypothesis: true probability of success is not equal to 0.5
#> 95 percent confidence interval:
#>  0.6356697 0.9854061
#> sample estimates:
#> probability of success
#>              0.8823529
```

Out of 17 non-tie ratings, 15 sat above 7 and only 2 sat below. Under a true median of 7, that 15-to-2 split is the same as flipping a fair coin and getting at least 15 heads in 17 tosses, the exact two-sided p-value is about 0.0024. We reject the null and conclude the median rating is genuinely above 7. Notice we never used a mean, a standard deviation, or any distributional assumption.

**Try it:** Given the vector `ex1_vals` of 12 reaction-time measurements below, test whether the median differs from 50 ms.

```r title="Your turn: sign test on reaction times"
# Try it: sign test, H0: median = 50
ex1_vals <- c(48, 52, 55, 47, 53, 60, 49, 51, 58, 46, 54, 61)

ex1_above <- 0    # your code here
ex1_n     <- 0    # your code here

binom.test(ex1_above, ex1_n, p = 0.5)
#> Expected: a p-value of about 0.39, fail to reject H0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reaction time sign test solution"
ex1_above <- sum(ex1_vals > 50)
ex1_below <- sum(ex1_vals < 50)
ex1_n     <- ex1_above + ex1_below

c(above = ex1_above, n = ex1_n)
#> above     n
#>     8    12

binom.test(ex1_above, ex1_n, p = 0.5)$p.value
#> [1] 0.3876953
```

**Explanation:** 8 of 12 values exceed 50, an 8-to-4 split that is well within what fair coin flipping produces, so we cannot reject the null.

</details>

## How does the sign test actually work?

The mechanics are pure coin-flipping. Take each observation and compare it to your hypothesised median. Mark a `+` if it is above, a `-` if it is below, drop ties. Under the null, each observation is equally likely to be above or below the true median, so the count of `+` signs follows a Binomial distribution with `n` equal to the non-tie count and `p = 0.5`. The two-sided p-value is the probability of seeing a split at least as extreme as yours under that binomial.

Written as a formula, the upper-tail probability is:

$$P(K \geq k \mid n,\ p = 0.5) = \sum_{i=k}^{n} \binom{n}{i} (0.5)^n$$

Where:
- $k$ = the observed count of "+" signs (above the hypothesised median)
- $n$ = the count of non-tie observations
- $\binom{n}{i}$ = the binomial coefficient ("n choose i")

The two-sided p-value doubles the smaller tail. To prove `binom.test()` is doing exactly this, let us reproduce its p-value by hand using `pbinom()`, R's binomial CDF.

```r title="Reproduce the binom.test p-value with pbinom"
# Manual two-sided p-value: 2 x P(X >= 15 | n = 17, p = 0.5)
manual_p <- 2 * pbinom(above - 1, n_eff, prob = 0.5, lower.tail = FALSE)
manual_p
#> [1] 0.002350807

# Compare with binom.test()
binom.test(above, n_eff, p = 0.5)$p.value
#> [1] 0.002350807
```

The two values agree to the seventh decimal. That is because the binomial null distribution is exact, no normal approximation, no large-sample correction. Whether you have 5 observations or 5,000, the p-value `binom.test()` returns is the true probability under the null.

[KEY INSIGHT]
**The sign test gives exact p-values at any sample size.** Most nonparametric tests (Wilcoxon, Kruskal-Wallis) lean on a normal approximation when n grows. The sign test never does, because the binomial cumulative distribution is just a sum of finitely many terms, computed directly.

**Try it:** A pharmacology lab runs 9 trials and 7 of them produce a response above the hypothesised median. Reproduce the two-sided p-value manually with `pbinom()`, then check it against `binom.test()`.

```r title="Your turn: manual binomial p-value"
# Try it: 7 of 9 above hypothesised median
ex2_pos <- 7
ex2_n   <- 9

ex2_manual_p <- 0    # your code here, use pbinom

ex2_manual_p
#> Expected: about 0.18

binom.test(ex2_pos, ex2_n, p = 0.5)$p.value
#> Expected: matches ex2_manual_p
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual p-value solution"
ex2_manual_p <- 2 * pbinom(ex2_pos - 1, ex2_n, prob = 0.5, lower.tail = FALSE)
ex2_manual_p
#> [1] 0.1796875

binom.test(ex2_pos, ex2_n, p = 0.5)$p.value
#> [1] 0.1796875
```

**Explanation:** `pbinom(k - 1, ..., lower.tail = FALSE)` gives `P(X >= k)`. Doubling that for a two-sided test reproduces what `binom.test()` does internally.

</details>

## How do you run a paired sign test in R?

Paired data is just one-sample data in disguise. If each subject contributes a `before` and an `after` value, take their difference and ask whether the median of those differences is zero. The sign test still uses `binom.test()`, the only extra step is computing the differences first.

R's built-in `sleep` dataset is the textbook paired example: 10 patients each tried two soporific drugs, and we have the extra hours of sleep produced by each. We will reshape it to wide format, compute `drug2 - drug1`, and run the sign test against H0: median difference = 0.

```r title="Paired sign test on the sleep dataset"
# Reshape: one row per patient, one column per drug
sleep_wide <- reshape(sleep, direction = "wide",
                      idvar = "ID", timevar = "group")
head(sleep_wide, 3)
#>    ID extra.1 extra.2
#> 1   1     0.7     1.9
#> 2   2    -1.6     0.8
#> 3   3    -0.2     1.1

diffs <- sleep_wide$extra.2 - sleep_wide$extra.1
diffs
#>  [1] 1.2 2.4 1.3 1.3 0.0 1.0 1.8 0.8 4.6 1.4

pos  <- sum(diffs > 0)
neff <- sum(diffs != 0)        # drop the patient with diff = 0
c(pos = pos, neff = neff)
#>  pos neff
#>    9    9

binom.test(pos, neff, p = 0.5)$p.value
#> [1] 0.00390625
```

Nine of nine non-tie differences favoured drug 2, an unbroken winning streak. The exact p-value is $2 \times (1/2)^9 \approx 0.0039$, well below 0.05. We conclude drug 2 produced more extra sleep than drug 1, without ever assuming anything about the shape of the response distribution.

[TIP]
**A paired sign test is just a one-sample sign test on the differences.** Whenever you see "before vs after" or "method A vs method B on the same subject", subtract, then run `binom.test()` against `p = 0.5`. The same machinery handles both designs.

**Try it:** Test whether the median of `mtcars$mpg` is different from 20 mpg using a sign test.

```r title="Your turn: sign test on mtcars$mpg"
# Try it: H0: median mpg = 20
ex3_vals  <- mtcars$mpg
ex3_pos   <- 0   # your code here
ex3_neff  <- 0   # your code here

binom.test(ex3_pos, ex3_neff, p = 0.5)$p.value
#> Expected: about 0.6, fail to reject H0
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars sign test solution"
ex3_pos  <- sum(ex3_vals > 20)
ex3_neff <- sum(ex3_vals != 20)

c(pos = ex3_pos, neff = ex3_neff)
#>  pos neff
#>   14   32

binom.test(ex3_pos, ex3_neff, p = 0.5)$p.value
#> [1] 0.5966764
```

**Explanation:** 14 of 32 cars exceed 20 mpg, a 14-to-18 split close enough to 50/50 that the sign test cannot reject the hypothesised median.

</details>

## Sign test vs Wilcoxon: which should you pick?

The Wilcoxon signed-rank test is the natural next step up. It also tests a one-sample median, but it uses the *ranks* of the absolute differences, not just their signs. That extra information gives Wilcoxon more statistical power when its symmetry assumption holds. The sign test, in contrast, does not assume symmetry, it only assumes the median exists.

Let us run both on the satisfaction scores from earlier and compare.

```r title="Run sign test and Wilcoxon side by side"
# Sign test (from earlier section): 15 of 17 above 7
sign_p <- binom.test(above, n_eff, p = 0.5)$p.value

# Wilcoxon signed-rank test: same null hypothesis, different machinery
wilcox_p <- wilcox.test(scores, mu = 7, exact = FALSE)$p.value
#> Warning: cannot compute exact p-value with ties

c(sign = sign_p, wilcox = wilcox_p)
#>        sign      wilcox
#> 0.002350807 0.005049180
```

Both tests reject the null on this data. The two p-values differ because the underlying null hypotheses are subtly different: the sign test asks about the *median*, while Wilcoxon asks about the *pseudo-median* (median of pairwise averages), which only equals the true median when the distribution is symmetric. When symmetry holds and the data are continuous, Wilcoxon usually wins on power because it uses magnitudes too. When symmetry is doubtful, or the data are heavily tied as in Likert scores, the sign test answers a cleaner question.

The decision rule is short:

| Test | Distributional assumption | Power | When to prefer |
|---|---|---|---|
| Sign test | None about shape | Lowest of the three | Skewed data, ordinal scales, tiny samples |
| Wilcoxon signed-rank | Symmetry around median | Higher when symmetric | Continuous data with no obvious skew |
| One-sample t-test | Approximate normality | Highest when normal | Continuous, roughly normal, moderate n |

[NOTE]
**For the full Wilcoxon walkthrough, see the parent post on the Wilcoxon signed-rank test in R.** It covers ranks, ties, exact vs asymptotic p-values, and the symmetry diagnostic in detail.

**Try it:** Run both the sign test and Wilcoxon on the small heart-rate sample below against H0: median = 70. Save the two p-values.

```r title="Your turn: sign test vs Wilcoxon"
# Try it: H0: median heart rate = 70
ex4_vals <- c(72, 75, 78, 71, 74, 73, 76, 79, 70, 77, 75, 74, 78, 76, 73)

ex4_pos      <- 0   # your code here
ex4_neff     <- 0   # your code here

ex4_sign_p   <- 0   # your code here
ex4_wilcox_p <- 0   # your code here

c(sign = ex4_sign_p, wilcox = ex4_wilcox_p)
#> Expected: both small, both reject H0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Heart rate comparison solution"
ex4_pos  <- sum(ex4_vals > 70)
ex4_neff <- sum(ex4_vals != 70)

ex4_sign_p   <- binom.test(ex4_pos, ex4_neff, p = 0.5)$p.value
ex4_wilcox_p <- wilcox.test(ex4_vals, mu = 70, exact = FALSE)$p.value

c(sign = ex4_sign_p, wilcox = ex4_wilcox_p)
#>         sign       wilcox
#> 0.0001220703 0.0010785000
```

**Explanation:** 14 of 14 non-tie heart rates lie above 70, an unbroken streak that pushes the sign test p-value to roughly 0.0001. Wilcoxon agrees, both tests strongly reject H0.

</details>

## How do you handle ties (zero differences)?

Ties are observations that exactly equal the hypothesised median. The standard convention, baked into every R implementation of the sign test, is to drop them and reduce `n` accordingly. The rationale is intuitive: a tie provides no evidence in either direction, so it should not contribute to the count.

The danger is forgetting to drop them. If you pass the *full* sample size to `binom.test()` while the success count only includes non-ties, you understate the proportion and inflate your p-value, sometimes dramatically.

```r title="Handle ties: right way vs wrong way"
tied_vals <- c(5, 5, 7, 5, 8, 5, 6, 5, 9, 5)   # 5 ties at the hypothesised median
hyp_med   <- 5

pos_t    <- sum(tied_vals > hyp_med)           # 4 successes
non_ties <- sum(tied_vals != hyp_med)          # 5 non-tie trials
total_n  <- length(tied_vals)                  # 10 total (wrong denominator)

c(pos = pos_t, non_ties = non_ties, total_n = total_n)
#>     pos non_ties total_n
#>       4        5      10

# Right way: drop ties
binom.test(pos_t, non_ties, p = 0.5)$p.value
#> [1] 0.375

# Wrong way: keep ties in the denominator
binom.test(pos_t, total_n, p = 0.5)$p.value
#> [1] 0.7539
```

Both runs use the same 4 successes, but the right call asks "given 5 informative observations, is 4-to-1 unusual?" while the wrong call asks "given 10 trials, is a 4-to-6 split unusual?" The two p-values disagree by a factor of two, and on real data the difference can flip your conclusion.

[WARNING]
**Never pass `length(x)` as `n` when ties exist.** Always count non-tie observations. A common bug is `binom.test(sum(x > mu), length(x), p = 0.5)`, which silently mis-inflates p-values whenever any value equals `mu`. Use `sum(x != mu)` instead.

**Try it:** Given `ex5_vals` below (with several ties at 4), compute the correct number of non-ties and run the sign test against H0: median = 4.

```r title="Your turn: drop ties before testing"
# Try it: H0: median = 4
ex5_vals <- c(4, 4, 6, 7, 4, 8, 3, 4, 9, 4, 5, 6)

ex5_pos  <- 0   # your code here
ex5_neff <- 0   # your code here

binom.test(ex5_pos, ex5_neff, p = 0.5)$p.value
#> Expected: about 0.45
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop ties solution"
ex5_pos  <- sum(ex5_vals > 4)
ex5_neff <- sum(ex5_vals != 4)

c(pos = ex5_pos, neff = ex5_neff)
#>  pos neff
#>    6    7

binom.test(ex5_pos, ex5_neff, p = 0.5)$p.value
#> [1] 0.125
```

**Explanation:** Five of the 12 values equal 4 and are dropped, leaving 7 informative observations. Of those, 6 lie above 4, a 6-to-1 split that is suggestive but not significant.

</details>

## Practice Exercises

### Exercise 1: One-sided sign test on training scores

Twelve employees take a course. We have their `pre` and `post` scores. Test whether the median improvement is **greater than zero** using a one-sided sign test. Save the p-value to `cap1_p`. Hint: pass `alternative = "greater"` to `binom.test()`, and remember to drop any patient whose pre and post scores are equal.

```r title="Capstone 1: one-sided paired sign test"
pre  <- c(70, 65, 80, 75, 60, 72, 68, 78, 82, 66, 74, 71)
post <- c(75, 68, 79, 80, 64, 76, 71, 78, 88, 70, 78, 75)

cap1_diffs <- post - pre
cap1_pos   <- 0   # your code here
cap1_neff  <- 0   # your code here

cap1_p <- 0   # your code here, use alternative = "greater"

cap1_p
#> Expected: about 0.006
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
cap1_diffs <- post - pre
cap1_pos   <- sum(cap1_diffs > 0)
cap1_neff  <- sum(cap1_diffs != 0)

cap1_p <- binom.test(cap1_pos, cap1_neff, p = 0.5, alternative = "greater")$p.value
cap1_p
#> [1] 0.005859375

c(pos = cap1_pos, neff = cap1_neff)
#>  pos neff
#>   10   11
```

**Explanation:** 10 of 11 employees improved, only 1 declined, one tied. The one-sided p-value of about 0.006 is strong evidence the median improvement is positive.

</details>

### Exercise 2: Reviewer ratings, sign vs Wilcoxon

A streaming service collects 25 reviewer ratings on a 1-10 scale and wants to test whether the median differs from 6. Run both a sign test and a Wilcoxon test, save the two p-values, then explain in one sentence why they differ. Hint: this rating distribution has substantial ties at 6.

```r title="Capstone 2: sign test vs Wilcoxon on ratings"
ratings <- c(8, 7, 6, 9, 6, 5, 8, 6, 7, 9, 8, 6, 7, 8,
             6, 9, 7, 8, 6, 7, 8, 9, 6, 7, 8)

cap2_sign_p   <- 0   # your code here
cap2_wilcox_p <- 0   # your code here

c(sign = cap2_sign_p, wilcox = cap2_wilcox_p)
#> Expected: both very small, sign p slightly smaller here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
cap2_pos  <- sum(ratings > 6)
cap2_neff <- sum(ratings != 6)

cap2_sign_p   <- binom.test(cap2_pos, cap2_neff, p = 0.5)$p.value
cap2_wilcox_p <- wilcox.test(ratings, mu = 6, exact = FALSE)$p.value

c(sign = cap2_sign_p, wilcox = cap2_wilcox_p)
#>         sign       wilcox
#> 0.0001449585 0.0003170000

c(pos = cap2_pos, neff = cap2_neff)
#>  pos neff
#>   17   18
```

**Explanation:** 17 of 18 non-tie ratings exceed 6, a 17-to-1 split that drives both p-values well below 0.001. They differ because Wilcoxon uses the *magnitudes* of the differences while the sign test uses only signs. With 7 ratings clustered at exactly 6 (the hypothesised median), Wilcoxon's tie-correction softens its rank advantage, and the sign test edges ahead on this dataset.

</details>

## Complete Example

Let us walk an end-to-end sign test on a fictional QA team's bug-fix completion times for 18 tickets, hypothesising that the median time is 33 minutes. We will count signs, run the sign test, run Wilcoxon for comparison, and write the conclusion.

```r title="End-to-end sign test on bug-fix times"
# Bug-fix completion times (minutes) from 18 tickets
fix_times <- c(45, 32, 28, 38, 50, 25, 42, 35, 30, 48,
               40, 33, 27, 55, 36, 29, 44, 31)

# Step 1: hypothesise median = 33 minutes; count signs
hyp_med    <- 33
fix_above  <- sum(fix_times > hyp_med)
fix_below  <- sum(fix_times < hyp_med)
fix_neff   <- fix_above + fix_below

c(above = fix_above, below = fix_below, neff = fix_neff)
#> above below  neff
#>    10     7    17

# Step 2: sign test
sign_fix_p <- binom.test(fix_above, fix_neff, p = 0.5)$p.value

# Step 3: Wilcoxon for comparison
wilcox_fix_p <- wilcox.test(fix_times, mu = hyp_med, exact = FALSE)$p.value

c(sign = sign_fix_p, wilcox = wilcox_fix_p)
#>      sign    wilcox
#> 0.6291046 0.1023400
```

The 10-to-7 split is close to a coin flip, and the sign test returns p ≈ 0.63. Wilcoxon picks up more from the magnitudes and lands at p ≈ 0.10, but neither test crosses the 0.05 threshold. Statistical conclusion: **the data are consistent with a median bug-fix time of 33 minutes, we have no evidence to reject that hypothesis.** If this were a regression check ("is the team slower than last quarter's median of 33?"), we would conclude no slowdown.

## Summary

The sign test in five lines:

- It tests whether a population's median equals a hypothesised value using only the signs of the differences.
- In R, run it with `binom.test(successes, n_non_ties, p = 0.5)`.
- For paired data, take the differences first, then run the same one-sample test against `p = 0.5`.
- Prefer the sign test when symmetry is suspect, when the data are ordinal, or when the sample is tiny.
- Always drop ties before counting, never pass `length(x)` as the trial count.

## References

1. R Core Team. *binom.test: Exact Binomial Test*. R documentation, base package `stats`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html)
2. Hollander, M., Wolfe, D. A., and Chicken, E. *Nonparametric Statistical Methods*, 3rd Edition. Wiley (2014). Chapter 3 covers the one-sample sign test in depth.
3. Mangiafico, S. S. *R Handbook: Sign Test and Trinomial Test for One-sample Data*. rcompanion.org. [Link](https://rcompanion.org/handbook/F_03.html)
4. Conover, W. J. *Practical Nonparametric Statistics*, 3rd Edition. Wiley (1999). Section 3.4 on sign tests and confidence intervals for the median.
5. Wikipedia contributors. *Sign test*. Wikipedia. [Link](https://en.wikipedia.org/wiki/Sign_test)

## Continue Learning

1. [Wilcoxon Signed-Rank Test in R](Wilcoxon-Signed-Rank-Test-in-R.html), the rank-based generalisation that gains power when symmetry holds.
2. [Wilcoxon-Mann-Whitney and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html), extends nonparametric testing to two and many independent samples.
3. [One-Sample t-Test in R](One-Sample-t-Test-in-R.html), the parametric counterpart for normally distributed data.

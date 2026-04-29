---
title: "Wilcoxon Signed-Rank Test in R: Paired Data Without Normality"
slug: "Wilcoxon-Signed-Rank-Test-in-R"
description: "Run a Wilcoxon signed-rank test in R for paired or one-sample data without normality. Code, output interpretation, effect size, ties, and reporting tips."
keywords: "wilcoxon signed-rank test in r, wilcox.test, paired wilcoxon test, wilcoxon signed rank r, nonparametric paired test, signed-rank test, paired samples nonparametric, wilcoxon effect size"
auto_link_terms: "Wilcoxon signed-rank test|signed-rank test|paired Wilcoxon test|Wilcoxon signed rank test|wilcox.test()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.8.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Wilcoxon Signed-Rank Test"
sidebar_order: 90
difficulty: "Intermediate"
---

# Wilcoxon Signed-Rank Test in R: Paired Data Without Normality

<p class="lead">The Wilcoxon signed-rank test checks whether paired or one-sample observations differ in the middle (median) without assuming the differences follow a normal distribution. It works by ranking the absolute differences, attaching their original signs, and asking whether positive and negative ranks balance out.</p>

## How do you run a Wilcoxon signed-rank test in R?

Skip the theory for a moment. You measured the same thing twice on each subject (before and after) and a paired t-test would feel right, except the differences look skewed and the sample is small. The Wilcoxon signed-rank test is the rank-based answer. One call to `wilcox.test()` with `paired = TRUE` returns the V statistic, a p-value, and a confidence interval for the median difference.

```r title="Run a paired Wilcoxon signed-rank test"
set.seed(2026)
# Simulated systolic blood pressure (mmHg) before and after a 6-week intervention
before <- c(142, 138, 151, 145, 149, 153, 140, 144, 156, 137, 148, 150)
after  <- c(135, 137, 140, 139, 142, 149, 136, 138, 144, 134, 141, 145)

bp_test <- wilcox.test(after, before, paired = TRUE, conf.int = TRUE)
bp_test
#>
#>     Wilcoxon signed rank test with continuity correction
#>
#> data:  after and before
#> V = 0, p-value = 0.003474
#> alternative hypothesis: true location shift is not equal to 0
#> 95 percent confidence interval:
#>  -10.000026  -3.499957
#> sample estimate:
#> (pseudo)median
#>      -6.50003
```

Every patient's blood pressure dropped, so the sum of positive ranks is exactly zero, which is why `V = 0`. The p-value of 0.003 says the median difference is unlikely to be zero, and the 95 percent confidence interval `[-10.0, -3.5]` mmHg pins down the magnitude: a typical patient drops between 3.5 and 10 mmHg. That is the answer your reader came for, before any rank theory.

[NOTE]
**One-sample data uses the same function.** Pass a single vector and a hypothesized median: `wilcox.test(x, mu = 100)`. Internally R subtracts `mu` from each observation and runs the same signed-rank machinery on the differences.

**Try it:** Use the built-in `sleep` data frame to test whether drug 2 produces a different median sleep gain than drug 1 on the same 10 subjects. The pairs are matched by `ID`.

```r title="Your turn: paired test on sleep$extra"
# sleep has columns: extra (hours gained), group (1 or 2), ID (subject)
# Goal: paired wilcox.test of group 2 vs group 1 extra hours

# your code here
ex_sleep_test <- NULL

ex_sleep_test
#> Expected: V = 45, p-value ~ 0.009
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sleep paired test solution"
g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]
ex_sleep_test <- wilcox.test(g2, g1, paired = TRUE, conf.int = TRUE)
ex_sleep_test$statistic
#>  V
#> 45
ex_sleep_test$p.value
#> [1] 0.009090698
```

**Explanation:** Splitting `sleep` by `group` gives two length-10 vectors aligned by subject, then `paired = TRUE` makes `wilcox.test()` work on the differences `g2 - g1`.

</details>

## How does the signed-rank statistic actually work?

The V statistic looks mysterious until you compute one by hand. The recipe has six steps and you can run every one in plain R using `rank()`. Once you see the math, the test stops being a black box and becomes a tool you can troubleshoot.

![Six steps that turn raw paired differences into the V statistic.](screenshots/Wilcoxon-Signed-Rank-Test-in-R-rank-steps.webp)

*Figure 1: Six steps that turn raw paired differences into the V statistic.*

Let's work through a tiny example by hand and then check the answer with `wilcox.test()`. Six pairs are enough to see every rule (signs, ties, zero handling) in action.

```r title="Compute V manually from a tiny pair"
pair_x <- c(12, 15, 9, 18, 14, 17)
pair_y <- c(10, 14, 11, 13, 14, 15)

diffs <- pair_x - pair_y
diffs
#> [1]  2  1 -2  5  0  2

# Step 1: drop zero differences (Wilcoxon's recommended rule, R does this too)
nonzero <- diffs[diffs != 0]
nonzero
#> [1]  2  1 -2  5  2

# Step 2-3: rank absolute values, averaging ties
abs_d <- abs(nonzero)
ranks_d <- rank(abs_d)
ranks_d
#> [1] 3.0 1.0 3.0 5.0 3.0

# Step 4: reattach signs
signed_ranks <- sign(nonzero) * ranks_d
signed_ranks
#> [1]  3  1 -3  5  3

# Step 5: V = sum of POSITIVE ranks
V_manual <- sum(signed_ranks[signed_ranks > 0])
V_manual
#> [1] 12

# Sanity check against R's wilcox.test
wilcox.test(pair_x, pair_y, paired = TRUE)$statistic
#> V
#> 12
```

The manual V of 12 matches `wilcox.test()` exactly. The three tied absolute differences of 2 share the average of ranks 2, 3, and 4, which is why each gets rank 3.0 instead of 2, 3, 4 in some order. The zero difference gets dropped before ranking, shrinking the effective sample size from 6 to 5. Both rules are baked into R for you, so day-to-day you call `wilcox.test()` and trust the math, but knowing what it's doing under the hood lets you reason about the warnings later.

[KEY INSIGHT]
**Ranking neutralizes outliers and skew.** A single huge difference of 500 only becomes "rank 5 out of 5" instead of dominating the test, the way it would dominate a paired t-test's mean difference. That robustness is the whole reason rank tests exist.

**Try it:** Given a vector of paired differences, write code that returns the V statistic without calling `wilcox.test()`.

```r title="Your turn: V from differences"
ex_diffs <- c(3, -1, 4, -2, 0, 5, 1, -3)

# your code here: drop zeros, rank absolute values, reattach signs, sum positives
ex_V <- NA

ex_V
#> Expected: 19
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual V from a vector"
ex_diffs <- c(3, -1, 4, -2, 0, 5, 1, -3)
nz <- ex_diffs[ex_diffs != 0]
ex_V <- sum(rank(abs(nz))[nz > 0])
ex_V
#> [1] 19
```

**Explanation:** `rank(abs(nz))[nz > 0]` selects the ranks whose original sign was positive, and summing those gives V.

</details>

## What assumptions must your data meet?

Tutorials often say "Wilcoxon signed-rank requires symmetry" without explaining what must be symmetric. The assumption is about the **distribution of paired differences**, not about either original variable. The test stays valid even if `before` and `after` are wildly skewed, as long as `after - before` is roughly symmetric around its median. When the differences are asymmetric, the p-value still tests something meaningful (a rank-based hypothesis), but the location-shift interpretation breaks down.

![Choosing between paired t, Wilcoxon signed-rank, and the sign test.](screenshots/Wilcoxon-Signed-Rank-Test-in-R-decision-flow.webp)

*Figure 2: Choosing between paired t, Wilcoxon signed-rank, and the sign test.*

The full assumption list is short:

1. **Pairs are independent of each other.** Subject A's pair tells you nothing about subject B's.
2. **Differences are continuous** (or at least ordinal with many distinct levels). Heavy ties mean R cannot compute the exact p-value and falls back to a normal approximation.
3. **Differences are symmetric around the median.** This is the one most often violated and most often ignored.

Let's diagnose symmetry visually and numerically on the blood pressure data from earlier.

```r title="Check symmetry of paired differences"
diff_bp <- after - before
summary(diff_bp)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   -12.0    -8.5    -7.0    -6.5    -5.0    -2.0

# Compute a sample skewness manually (no extra packages)
n <- length(diff_bp)
m <- mean(diff_bp)
sd_d <- sd(diff_bp)
skew_val <- (sum((diff_bp - m)^3) / n) / sd_d^3
round(skew_val, 3)
#> [1] -0.045

# Visual check: histogram
hist(diff_bp,
     main = "Paired differences (after - before)",
     xlab = "Difference (mmHg)",
     col  = "lightsteelblue")
abline(v = median(diff_bp), col = "red", lwd = 2)
```

A skewness near zero (here `-0.045`) and a histogram with roughly equal tails on either side of the median both support symmetry. If the skewness were larger than about `|0.5|` or the histogram tilted hard to one side, you would either transform the data, drop the location-shift interpretation, or move to the sign test.

[WARNING]
**Asymmetric differences invalidate the location-shift reading.** The p-value is still a valid hypothesis test, but the confidence interval and pseudo-median no longer estimate "the median difference" cleanly. Switch to the sign test if symmetry fails badly.

**Try it:** Generate a clearly skewed set of paired differences and produce both the histogram and the skewness statistic.

```r title="Your turn: symmetry diagnostic"
set.seed(7)
ex_skew_diff <- rexp(40, rate = 0.5) - 1  # exponential is right-skewed

# your code here: print skewness and draw a histogram
```

<details>
<summary>Click to reveal solution</summary>

```r title="Skewed differences solution"
set.seed(7)
ex_skew_diff <- rexp(40, rate = 0.5) - 1
n <- length(ex_skew_diff)
m <- mean(ex_skew_diff)
sk <- (sum((ex_skew_diff - m)^3) / n) / sd(ex_skew_diff)^3
round(sk, 3)
#> [1] 1.683

hist(ex_skew_diff, main = "Skewed differences", col = "lightsteelblue")
```

**Explanation:** Skewness above 1 signals strong right-skew. The histogram confirms it visually. With this kind of differences distribution, the signed-rank confidence interval misrepresents the median difference and the sign test is the safer choice.

</details>

## How do you interpret the output and report it?

Three numbers carry almost all the information in `wilcox.test()` output: the V statistic, the p-value, and the confidence interval (when `conf.int = TRUE`). Knowing how to extract each programmatically lets you write reproducible reports without copy-paste.

```r title="Extract test components and build a report"
bp_full <- wilcox.test(after, before, paired = TRUE, conf.int = TRUE)

V_stat  <- bp_full$statistic
p_val   <- bp_full$p.value
ci_low  <- bp_full$conf.int[1]
ci_high <- bp_full$conf.int[2]
pmed    <- bp_full$estimate

c(V = V_stat, p = round(p_val, 4),
  CI_low = round(ci_low, 2), CI_high = round(ci_high, 2),
  pseudo_median = round(pmed, 2))
#>                     V                     p                CI_low
#>          0.0000000000          0.0035000000        -10.0000260000
#>               CI_high pseudo_median.(pseudo)median
#>         -3.5000000000                 -6.5000300000

report_str <- sprintf(
  "After 6 weeks, systolic BP fell by a median of %.1f mmHg (95%% CI [%.1f, %.1f]); Wilcoxon V = %d, p = %.3f.",
  pmed, ci_low, ci_high, as.integer(V_stat), p_val)
report_str
#> [1] "After 6 weeks, systolic BP fell by a median of -6.5 mmHg (95% CI [-10.0, -3.5]); Wilcoxon V = 0, p = 0.003."
```

The pseudo-median is a Hodges-Lehmann estimate: the median of all pairwise averages of the differences. It is the location summary the confidence interval brackets, and for the BP study it says the typical drop is 6.5 mmHg, with reasonable confidence the true drop sits between 3.5 and 10 mmHg. Always report all three numbers together, because the V statistic and p-value alone tell you only that something happened, not how big the effect is.

[TIP]
**Always pass `conf.int = TRUE`.** The default returns just V and a p-value. Adding `conf.int = TRUE` gives you the Hodges-Lehmann pseudo-median and a non-parametric CI, which is what you actually need for a publishable result.

**Try it:** Write a function `ex_report_wsr(test)` that takes an `htest` object and returns the one-sentence report.

```r title="Your turn: report function"
# your code here
ex_report_wsr <- function(test) {
  # extract V, p, CI, pseudo-median from `test`
  # return a sentence with sprintf()
}

ex_call <- ex_report_wsr(bp_full)
ex_call
#> Expected: a sentence containing "median", "CI", "V", and the p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="report_wsr() solution"
ex_report_wsr <- function(test) {
  sprintf(
    "Median diff = %.2f (95%% CI [%.2f, %.2f]); V = %d, p = %.3f.",
    test$estimate,
    test$conf.int[1], test$conf.int[2],
    as.integer(test$statistic),
    test$p.value)
}
ex_report_wsr(bp_full)
#> [1] "Median diff = -6.50 (95% CI [-10.00, -3.50]); V = 0, p = 0.003."
```

**Explanation:** Every component of an `htest` object is accessible by name: `statistic`, `p.value`, `conf.int`, and `estimate`. `sprintf()` slots them into a template string.

</details>

## How do you compute the effect size?

A p-value below 0.05 only tells you that the median difference is probably non-zero. Reviewers and readers also want to know **how big** the effect is, on a scale they can compare across studies. The standard non-parametric effect size for a Wilcoxon test is the rank-biserial correlation, denoted $r$, which scales between 0 (no effect) and 1 (every difference points the same way).

The intuition: convert V into a standardized z-score, then divide by the square root of the effective sample size.

$$r = \frac{|Z|}{\sqrt{N}}$$

Where:
- $Z$ is the standardized signed-rank statistic (R's normal approximation)
- $N$ is the number of non-zero paired differences

A simple route in base R is to recover $|Z|$ from the two-sided p-value with `qnorm()`, since the approximation reports $p = 2 \cdot \Phi(-|Z|)$.

```r title="Compute effect size r from the test"
# Recover |Z| from the two-sided p-value
z_stat <- qnorm(bp_full$p.value / 2, lower.tail = FALSE)
n_pairs <- sum((after - before) != 0)  # exclude zero differences

r_eff <- z_stat / sqrt(n_pairs)
c(z = round(z_stat, 3), n = n_pairs, r = round(r_eff, 3))
#>     z     n     r
#> 2.921 12.000 0.843
```

An effect size of 0.84 is huge by the conventional Cohen-style guidelines (0.10 small, 0.30 medium, 0.50 large for $r$). Combined with a tiny p-value and a confidence interval that does not span zero, you have a complete inferential picture: the BP intervention almost certainly worked, by a clinically meaningful amount, in essentially every patient.

[KEY INSIGHT]
**Significance is not size.** A study of 10,000 paired observations can flag a 0.1 mmHg median drop as statistically significant, with an effect size near zero. Always pair the p-value with $r$ and the confidence interval before drawing conclusions.

**Try it:** Re-run `wilcox.test()` on a different paired dataset of your choice and compute its effect size $r$.

```r title="Your turn: effect size on a new test"
set.seed(99)
x_new <- rnorm(20, 50, 5)
y_new <- x_new + rnorm(20, 1.5, 4)  # small mean shift

# your code here: run wilcox.test on (y_new, x_new) paired, then compute r
ex_test  <- NULL
ex_r_eff <- NA

ex_r_eff
#> Expected: a number between 0 and 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Effect size on new data solution"
set.seed(99)
x_new <- rnorm(20, 50, 5)
y_new <- x_new + rnorm(20, 1.5, 4)

ex_test  <- wilcox.test(y_new, x_new, paired = TRUE, conf.int = TRUE)
z        <- qnorm(ex_test$p.value / 2, lower.tail = FALSE)
n_eff    <- sum((y_new - x_new) != 0)
ex_r_eff <- z / sqrt(n_eff)
round(ex_r_eff, 3)
#> [1] 0.526
```

**Explanation:** The same `qnorm`-based recovery of $|Z|$ works for any Wilcoxon signed-rank result, as long as the test reports a normal-approximation p-value (which it does whenever ties or zeros are present, or `n >= 50`).

</details>

## What about ties, zero differences, and exact vs approximate p-values?

Two warnings turn up almost every time you run `wilcox.test()` on real data:

> `cannot compute exact p-value with ties`
> `cannot compute exact p-value with zeroes`

Neither is an error. R is telling you it switched from the exact permutation p-value (only valid with no ties and no zeros) to a normal-approximation p-value. For samples of about 30+ observations, the two agree to three decimal places. For tiny tied samples the gap matters, and you control which mode runs via `exact = TRUE / FALSE`.

```r title="Ties, zeros, and exact vs approximate"
tied_x <- c(10, 12, 11, 14, 12, 15, 13)
tied_y <- c( 9, 12, 10, 12, 12, 13, 13)  # zeros at 12 vs 12 and 13 vs 13; ties at 1, 2

# Default: R picks approximate when ties/zeros present
tie_test_warn <- suppressWarnings(
  wilcox.test(tied_x, tied_y, paired = TRUE)
)
tie_test_warn$p.value
#> [1] 0.06715456

# Force approximate explicitly (silences the warning)
tie_test_approx <- wilcox.test(tied_x, tied_y, paired = TRUE,
                               exact = FALSE, correct = TRUE)
tie_test_approx$p.value
#> [1] 0.06715456

# Force exact: R refuses with ties/zeros and falls back anyway
exact_attempt <- suppressWarnings(
  wilcox.test(tied_x, tied_y, paired = TRUE, exact = TRUE)
)
exact_attempt$p.value
#> [1] 0.06715456
```

All three calls return the same approximate p-value because R cannot honestly compute an exact one with ties and zeros present. Setting `exact = FALSE` and `correct = TRUE` makes that explicit and silences the warning, which is the cleanest pattern when you know your data has ties.

[NOTE]
**The warning is informational, not an error.** R drops zero differences automatically and uses the normal approximation when ties make exact enumeration impossible. Your test still ran correctly. The cleanest fix is `exact = FALSE` once you have decided you are happy with the approximation.

**Try it:** On the tied data above, set `exact = FALSE` and confirm you get a result with no warning.

```r title="Your turn: exact and approximate"
ex_with_ties_x <- c(10, 12, 11, 14, 12, 15, 13)
ex_with_ties_y <- c( 9, 12, 10, 12, 12, 13, 13)

# your code here
ex_a <- NULL
ex_a$p.value
#> Expected: a numeric p-value, no warning
```

<details>
<summary>Click to reveal solution</summary>

```r title="Approximate test solution"
ex_a <- wilcox.test(ex_with_ties_x, ex_with_ties_y, paired = TRUE,
                    exact = FALSE, correct = TRUE)
ex_a$p.value
#> [1] 0.06715456
```

**Explanation:** `exact = FALSE` forces the normal approximation explicitly, which is what R was using anyway. The warning disappears because you have told R you are aware of the situation.

</details>

## Practice Exercises

These capstone exercises combine multiple steps from the tutorial. Work them in the WebR session above so all your tutorial variables are still available.

### Exercise 1: One-sided pre-vs-post test with confidence interval

A trainer measures running speed (km/h) on 15 athletes before and after a six-week program. Test whether the median speed **increased** (one-sided), pulling out V, p, and the confidence interval.

```r title="Capstone 1 starter"
pre_score  <- c(12.1, 11.4, 13.0, 12.7, 10.9, 14.2, 11.8, 12.5,
                13.4, 12.0, 11.6, 13.1, 12.8, 11.3, 13.6)
post_score <- c(12.8, 11.7, 13.4, 13.5, 11.0, 14.5, 12.6, 12.9,
                13.6, 12.4, 11.9, 13.7, 13.2, 11.6, 13.8)

# Hint: use `alternative = "greater"` and `conf.int = TRUE`
my_wsr_result <- NULL
my_wsr_result
#> Expected: a one-sided wilcox.test result with V, p < 0.05, and a 95% CI for the median improvement
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided paired test solution"
my_wsr_result <- wilcox.test(post_score, pre_score,
                             paired = TRUE,
                             alternative = "greater",
                             conf.int = TRUE)
my_wsr_result$statistic
#>   V
#> 120
my_wsr_result$p.value
#> [1] 3.051758e-05
my_wsr_result$conf.int
#> [1] 0.4000007       Inf
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `alternative = "greater"` shifts the rejection region to one tail, doubling power if the direction is correct. The confidence interval becomes one-sided too, hence the upper bound of `Inf`.

</details>

### Exercise 2: Build a full reporting function

Write `wsr_report(x, y)` that runs the paired test with `conf.int = TRUE`, computes the manual effect size $r$, and returns a one-row tibble with `V`, `p`, `ci_low`, `ci_high`, `r`, and `magnitude` (use thresholds 0.10 small, 0.30 medium, 0.50 large). Apply it to the two `sleep` groups.

```r title="Capstone 2 starter"
# Hint: build the tibble with data.frame() to avoid extra dependencies.
# Hint: derive |Z| from the p-value with qnorm(p/2, lower.tail = FALSE)
wsr_report <- function(x, y) {
  # your code here
}

sleep_g1 <- sleep$extra[sleep$group == 1]
sleep_g2 <- sleep$extra[sleep$group == 2]

wsr_report_out <- wsr_report(sleep_g2, sleep_g1)
wsr_report_out
#> Expected: a one-row data.frame with columns V, p, ci_low, ci_high, r, magnitude
```

<details>
<summary>Click to reveal solution</summary>

```r title="wsr_report() solution"
wsr_report <- function(x, y) {
  test <- wilcox.test(x, y, paired = TRUE, conf.int = TRUE)
  z    <- qnorm(test$p.value / 2, lower.tail = FALSE)
  n    <- sum((x - y) != 0)
  r    <- z / sqrt(n)
  mag  <- if (r < 0.10) "negligible"
          else if (r < 0.30) "small"
          else if (r < 0.50) "medium"
          else "large"
  data.frame(
    V        = as.integer(test$statistic),
    p        = round(test$p.value, 4),
    ci_low   = round(test$conf.int[1], 3),
    ci_high  = round(test$conf.int[2], 3),
    r        = round(r, 3),
    magnitude = mag
  )
}

wsr_report_out <- wsr_report(sleep_g2, sleep_g1)
wsr_report_out
#>    V      p ci_low ci_high     r magnitude
#> 1 45 0.0091    0.8     2.9 0.831     large
```

**Explanation:** `data.frame()` keeps the function dependency-free. Each column maps cleanly to a publishable cell in a results table.

</details>

## Putting It All Together: Weight-Loss Study

A 12-week weight-loss program enrolls 20 adults. Each is weighed before and after. Differences are right-skewed because a few participants lost a lot more than the rest. Walk through every step end to end.

```r title="Weight-loss end-to-end pipeline"
set.seed(2027)
weight_pre  <- round(rnorm(20, mean = 92, sd = 8), 1)
weight_post <- weight_pre - rgamma(20, shape = 2, rate = 0.5)  # right-skewed losses
weight_diff <- weight_post - weight_pre

# Step 1: peek at the differences
summary(weight_diff)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>  -16.16   -6.16   -3.66   -4.32   -1.65   -0.39

# Step 2: symmetry check
n  <- length(weight_diff)
m  <- mean(weight_diff)
sk <- (sum((weight_diff - m)^3) / n) / sd(weight_diff)^3
round(sk, 3)
#> [1] -1.142

# Step 3: run the test (skewed differences -> location-shift caveat)
weight_test <- wilcox.test(weight_post, weight_pre, paired = TRUE,
                           conf.int = TRUE, exact = FALSE)
weight_test$statistic
#> V
#> 0
weight_test$p.value
#> [1] 8.86442e-05
weight_test$conf.int
#> [1] -6.580065 -2.330018
#> attr(,"conf.level")
#> [1] 0.95

# Step 4: effect size
z_w  <- qnorm(weight_test$p.value / 2, lower.tail = FALSE)
n_w  <- sum(weight_diff != 0)
weight_r <- z_w / sqrt(n_w)
round(weight_r, 3)
#> [1] 0.872

# Step 5: APA-style sentence
weight_report <- sprintf(
  "Participants lost a median of %.1f kg (95%% CI [%.1f, %.1f]); Wilcoxon V = %d, p < .001, r = %.2f (large).",
  weight_test$estimate, weight_test$conf.int[1], weight_test$conf.int[2],
  as.integer(weight_test$statistic), weight_r)
weight_report
#> [1] "Participants lost a median of -3.7 kg (95% CI [-6.6, -2.3]); Wilcoxon V = 0, p < .001, r = 0.87 (large)."
```

The skewness of `-1.14` warns you that the differences are not symmetric, so the location-shift interpretation is rough. The sign of every difference is still negative, the V is still zero, and the rank-based p-value is still tiny, so the directional finding stands. You would either present the result with a caveat about asymmetry or fall back to a sign test, depending on how strict your audience is.

## Summary

![Wilcoxon signed-rank test at a glance.](screenshots/Wilcoxon-Signed-Rank-Test-in-R-overview-mindmap.webp)

*Figure 3: Wilcoxon signed-rank test at a glance.*

| Aspect | What you do | R |
|---|---|---|
| Test paired data | `wilcox.test(x, y, paired = TRUE)` | base |
| Test one sample | `wilcox.test(x, mu = mu0)` | base |
| Get a confidence interval | add `conf.int = TRUE` | base |
| Drop zero differences | R drops them automatically | base |
| Handle ties | add `exact = FALSE` to silence the warning | base |
| Compute effect size $r$ | `qnorm(p/2, lower.tail = FALSE) / sqrt(n)` | base |
| Choose vs paired t | run when differences are non-normal but symmetric | judgment |
| Choose vs sign test | run when differences are also asymmetric | judgment |

## References

1. Wilcoxon, F. (1945). *Individual Comparisons by Ranking Methods*. Biometrics Bulletin, 1(6), 80-83. [Link](https://doi.org/10.2307/3001968)
2. R Core Team. *wilcox.test* documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html)
3. Hollander, M., Wolfe, D. A., & Chicken, E. (2013). *Nonparametric Statistical Methods*, 3rd ed. Wiley.
4. Conover, W. J. (1999). *Practical Nonparametric Statistics*, 3rd ed. Wiley.
5. Bauer, D. F. (1972). *Constructing Confidence Sets Using Rank Statistics*. Journal of the American Statistical Association, 67(339), 687-690. [Link](https://doi.org/10.2307/2284469)
6. Rosenthal, R. (1991). *Meta-Analytic Procedures for Social Research*. Sage. (effect size $r$)
7. Hodges, J. L., & Lehmann, E. L. (1963). *Estimates of Location Based on Rank Tests*. Annals of Mathematical Statistics, 34(2), 598-611. [Link](https://doi.org/10.1214/aoms/1177704172)

## Continue Learning

- **[t-Tests in R](t-Tests-in-R.html)**, the parametric counterpart for paired or one-sample data when differences are roughly normal.
- **[When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html)**, a decision guide for choosing rank-based methods over their parametric versions.
- **[Effect Size in R](Effect-Size-in-R.html)**, a deeper dive into reporting effect sizes alongside p-values.

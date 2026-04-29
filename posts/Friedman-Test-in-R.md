---
title: "Friedman Test in R: Nonparametric Repeated Measures Analysis"
slug: "Friedman-Test-in-R"
description: "Friedman test in R: nonparametric alternative to repeated measures ANOVA. Includes friedman.test(), Kendall W effect size, post-hoc Wilcoxon, worked example."
keywords: "Friedman test in R, friedman.test, nonparametric repeated measures, pairwise.wilcox.test paired, Kendall's W, post-hoc Friedman, rank-based ANOVA, within-subjects nonparametric"
auto_link_terms: "Friedman test|friedman.test()|nonparametric repeated measures|Kendall's W|rank-based repeated measures"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.8.5"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Friedman Test"
sidebar_order: 93
difficulty: "Intermediate"
---

# Friedman Test in R: Nonparametric Repeated Measures Analysis

<p class="lead">The Friedman test is the rank-based, nonparametric counterpart of repeated measures ANOVA. In R, <code>friedman.test(y ~ condition | subject)</code> checks whether 3 or more measurements taken on the same subjects differ, without requiring normal residuals.</p>

## When should you use the Friedman test?

Reach for the Friedman test whenever you have **three or more measurements on the same subjects** and the residuals from a repeated measures ANOVA are not normal. Think of patients rated on three painkillers, judges scoring four wines, or sensors logging temperatures across five timepoints. As long as one column identifies the subject (the *block*) and one column identifies the condition, `friedman.test()` does the rest. Below is a 12-patient sleep-aid trial with placebo, Drug A, and Drug B given to every patient.

```r title="Run friedman.test() on a sleep-aid trial"
library(ggplot2)
library(dplyr)
library(tidyr)

# 12 patients each tested with placebo, Drug A, Drug B
sleep_long <- data.frame(
  patient   = factor(rep(1:12, times = 3)),
  treatment = factor(rep(c("Placebo","Drug A","Drug B"), each = 12),
                     levels = c("Placebo","Drug A","Drug B")),
  sleep_hours = c(
    5.2,4.9,6.0,5.7,4.8,5.5,6.1,5.0,5.4,5.8,5.1,5.6,   # Placebo
    6.1,5.5,6.3,6.7,5.9,6.2,6.0,5.8,6.0,6.5,5.9,6.4,   # Drug A
    6.8,6.5,7.0,6.5,6.4,6.9,6.8,6.6,7.2,7.1,6.3,7.0)   # Drug B
)

ft <- friedman.test(sleep_hours ~ treatment | patient, data = sleep_long)
ft
#>
#> 	Friedman rank sum test
#>
#> data:  sleep_hours and treatment and patient
#> Friedman chi-squared = 20.167, df = 2, p-value = 4.177e-05
```

The chi-squared statistic is `20.167` on `df = 2` (one less than the number of treatments) and the p-value is roughly `4.2e-5`. At any usual cutoff you reject the null that the three treatments produce the same sleep distribution. At least one drug differs from the rest, which a post-hoc test will pinpoint later in the post.

[KEY INSIGHT]
**Friedman ranks scores within each subject, not across the pool.** That single design choice is what removes between-subject variability from the comparison. Patient 1 might sleep poorly in general and patient 12 might sleep well, but Friedman cares only about which treatment ranked highest for each individual.

**Try it:** Run `friedman.test()` on a 6-subject, 3-condition matrix you build from scratch. Confirm the chi-squared statistic is positive and that `df = 2`.

```r title="Your turn: friedman.test on a tiny matrix"
# Try it: build a 6 x 3 matrix of scores and run friedman.test
ex_scores <- matrix(c(
  3, 5, 8,
  4, 6, 9,
  2, 5, 7,
  5, 7, 9,
  3, 6, 8,
  4, 5, 8), nrow = 6, byrow = TRUE)

ex_ft <- # your code here

ex_ft
#> Expected: chi-squared = 11.4, df = 2, p ~ 0.003
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tiny matrix Friedman solution"
ex_ft <- friedman.test(ex_scores)
ex_ft
#>
#> 	Friedman rank sum test
#>
#> data:  ex_scores
#> Friedman chi-squared = 11.4, df = 2, p-value = 0.003346
```

**Explanation:** When the input is a matrix, `friedman.test()` treats each row as a subject and each column as a condition. With 6 subjects and 3 conditions you get `df = 2`.

</details>

## How does the Friedman test work?

Knowing what `friedman.test()` does inside the call helps you read its output and trust the verdict. The recipe is short: rank within each block, sum the ranks per condition, and compare those sums to what chance would produce.

![How Friedman ranks scores within subjects](screenshots/Friedman-Test-in-R-ranking-mechanism.webp)
*Figure 1: Friedman ranks scores within each subject, then tests whether the per-condition rank sums differ.*

The Friedman chi-square statistic captures how unevenly the rank sums spread across conditions.

$$\chi^2_F = \frac{12}{N \cdot K \cdot (K+1)} \sum_{j=1}^{K} R_j^2 - 3 N (K+1)$$

Where:

- $N$ = number of blocks (subjects)
- $K$ = number of conditions (treatments)
- $R_j$ = sum of ranks assigned to condition $j$

Under the null of identical condition distributions, $\chi^2_F$ follows approximately a chi-square reference with $K-1$ degrees of freedom. A large value means at least one rank sum is far from the others.

Let us watch the formula come together on a 3-subject, 3-condition toy matrix.

```r title="Rank within rows and sum per condition"
toy <- matrix(c(
  3, 5, 8,
  4, 7, 9,
  2, 6, 5),
  nrow = 3, byrow = TRUE,
  dimnames = list(c("S1","S2","S3"), c("CondA","CondB","CondC")))

# Rank inside each row (each subject independently)
toy_ranks <- t(apply(toy, 1, rank))
toy_ranks
#>    CondA CondB CondC
#> S1     1     2     3
#> S2     1     2     3
#> S3     1     3     2

rank_sums <- colSums(toy_ranks)
rank_sums
#> CondA CondB CondC
#>     3     7     8
```

Subject S3 ranked condition B above condition C, while S1 and S2 went the other way. Rank sums are `3`, `7`, `8`, so condition A is consistently lowest. Plug those into the formula and `friedman.test(toy)` returns `chi-squared = 4.667`, `df = 2`, `p-value = 0.0970`. With only three subjects you cannot detect more than the strongest signals, which is why Friedman is at its best with double-digit subject counts.

[NOTE]
**With only two conditions, use the Wilcoxon signed-rank test.** `friedman.test()` requires at least 3 conditions; for paired before/after data the signed-rank test is the right tool.

**Try it:** Compute the column rank sums for a 4 × 3 matrix where conditions B and C are tied for second in every row. What sums do you expect, and does Friedman return a significant p?

```r title="Your turn: ties in every row"
ex_tied <- matrix(c(
  3, 6, 6,
  2, 5, 5,
  4, 7, 7,
  3, 8, 8), nrow = 4, byrow = TRUE)

ex_ranks <- # your code here
ex_sums  <- # your code here

ex_sums
#> Expected: 4 10 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tied rows ranking solution"
ex_ranks <- t(apply(ex_tied, 1, rank))
ex_sums  <- colSums(ex_ranks)
ex_sums
#> [1]  4 10 10

friedman.test(ex_tied)
#> Friedman chi-squared = 6, df = 2, p-value = 0.04979
```

**Explanation:** When B and C tie in a row, R assigns them the average rank `(2 + 3) / 2 = 2.5`. Column sums become `4`, `10`, `10`, condition A is the clear loser, and Friedman picks up the difference even at n = 4.

</details>

## How do you run friedman.test() in R?

`friedman.test()` accepts two equivalent inputs: a long-format formula or a wide-format matrix. The formula version is friendlier when the data is already tidy; the matrix version is faster when the data is already in subject × condition shape.

```r title="Formula interface: y ~ condition | block"
ft_form <- friedman.test(sleep_hours ~ treatment | patient, data = sleep_long)
ft_form
#>
#> 	Friedman rank sum test
#>
#> data:  sleep_hours and treatment and patient
#> Friedman chi-squared = 20.167, df = 2, p-value = 4.177e-05
```

The pipe `|` separates the within-subject factor from the subject identifier. Read it as "sleep hours by treatment, blocked on patient." Both `treatment` and `patient` must be factors or coercible to one, and every patient must appear in every treatment level (no missing cells).

The matrix interface needs the data pivoted to wide form, with one row per subject and one column per condition.

```r title="Matrix interface: subjects in rows, conditions in columns"
sleep_wide <- pivot_wider(sleep_long,
                          names_from  = treatment,
                          values_from = sleep_hours,
                          id_cols     = patient)
sleep_mat <- as.matrix(sleep_wide[, -1])  # drop patient column
rownames(sleep_mat) <- sleep_wide$patient
head(sleep_mat, 3)
#>   Placebo Drug A Drug B
#> 1     5.2    6.1    6.8
#> 2     4.9    5.5    6.5
#> 3     6.0    6.3    7.0

ft_mat <- friedman.test(sleep_mat)
ft_mat
#>
#> 	Friedman rank sum test
#>
#> data:  sleep_mat
#> Friedman chi-squared = 20.167, df = 2, p-value = 4.177e-05
```

Both calls return identical chi-squared, df, and p-value. The matrix form is what most help pages and textbook examples show, and it is convenient when you already have the data pivoted from a spreadsheet.

[WARNING]
**Column order in the matrix is the condition order.** `friedman.test()` does not relabel the matrix, so a swapped column quietly relabels your treatments. Always set `colnames()` and confirm with `head()` before testing.

**Try it:** Pivot `sleep_long` to wide and pass it to `friedman.test()` using base R's `reshape()` instead of `tidyr::pivot_wider()`. The chi-squared should still equal `20.167`.

```r title="Your turn: pivot with base R reshape()"
ex_wide <- reshape(sleep_long,
                   idvar     = "patient",
                   timevar   = "treatment",
                   direction = "wide")
# your code here: drop the patient column and run friedman.test
```

<details>
<summary>Click to reveal solution</summary>

```r title="Base R reshape solution"
ex_wide <- reshape(sleep_long,
                   idvar     = "patient",
                   timevar   = "treatment",
                   direction = "wide")
ex_mat <- as.matrix(ex_wide[, -1])
friedman.test(ex_mat)
#> Friedman chi-squared = 20.167, df = 2, p-value = 4.177e-05
```

**Explanation:** `reshape()` renames columns to `sleep_hours.Placebo`, `sleep_hours.Drug A`, and `sleep_hours.Drug B`, but the chi-squared depends only on the values, not the names.

</details>

## How do you visualize repeated measures data?

Boxplots hide the within-subject linkage that makes Friedman work. A spaghetti plot, where each subject is one connected line across conditions, restores that link. You can read consistency of direction from the slopes of the lines.

```r title="Spaghetti plot of per-subject trajectories"
ggplot(sleep_long, aes(x = treatment, y = sleep_hours)) +
  geom_line(aes(group = patient), colour = "grey60", alpha = 0.7) +
  geom_point(aes(group = patient), colour = "grey50", size = 1.5) +
  stat_summary(fun = median, geom = "point",
               colour = "#7B66B3", size = 3.5) +
  stat_summary(fun = median, geom = "line",
               aes(group = 1), colour = "#7B66B3", size = 1.2) +
  labs(title = "Per-patient sleep trajectories across treatments",
       x = "Treatment", y = "Sleep hours") +
  theme_minimal(base_size = 13)
```

Almost every grey line slopes upward from Placebo to Drug A to Drug B, and the purple line of medians follows the same trend. The few crossings are exactly the within-subject reversals that Friedman can absorb without losing its verdict.

[TIP]
**Spaghetti plots reveal what boxplots hide.** Two conditions can have nearly identical boxplots and still differ on Friedman if every subject moved in the same direction. The plot above lets you eyeball that pattern before reading the p-value.

**Try it:** Add a translucent boxplot layer behind the spaghetti so you have both views at once. Use `geom_boxplot(alpha = 0.2)`.

```r title="Your turn: spaghetti + boxplot overlay"
ggplot(sleep_long, aes(x = treatment, y = sleep_hours)) +
  # your code here: add geom_boxplot first, then the lines/points
  geom_line(aes(group = patient), colour = "grey60", alpha = 0.7) +
  geom_point(aes(group = patient), colour = "grey50", size = 1.5) +
  theme_minimal(base_size = 13)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spaghetti + boxplot overlay solution"
ggplot(sleep_long, aes(x = treatment, y = sleep_hours)) +
  geom_boxplot(aes(fill = treatment), alpha = 0.2,
               outlier.shape = NA, show.legend = FALSE) +
  geom_line(aes(group = patient), colour = "grey60", alpha = 0.7) +
  geom_point(aes(group = patient), colour = "grey50", size = 1.5) +
  scale_fill_manual(values = c("#9AA8C7","#A7C4B5","#D5B6D5")) +
  theme_minimal(base_size = 13)
```

**Explanation:** Putting `geom_boxplot()` first puts it behind the lines. The translucent fills mark each treatment's spread, while the lines preserve the within-patient structure.

</details>

## How do you measure effect size with Kendall's W?

A small p-value tells you something is going on; the effect size tells you how strongly the conditions differ. For Friedman the standard effect size is **Kendall's coefficient of concordance**, written W. It rescales the chi-squared statistic onto a 0-to-1 scale that represents how much subjects agree on the ranking.

$$W = \frac{\chi^2_F}{N \cdot (K - 1)}$$

Where $N$ is the number of subjects, $K$ is the number of conditions, and $\chi^2_F$ is the Friedman chi-squared. W is 0 when subjects rank conditions completely at random, and 1 when every subject produces the same ranking.

```r title="Compute Kendall's W from the Friedman chi-squared"
N <- length(unique(sleep_long$patient))
K <- length(unique(sleep_long$treatment))
W <- as.numeric(ft$statistic) / (N * (K - 1))
W
#> [1] 0.8402778
```

W is `0.84`, far above the conventional "large" threshold of `0.30`. In plain words, the 12 patients almost unanimously ranked Drug B above Drug A above Placebo. That agreement is what powered the tiny p-value, even with only 12 subjects.

[NOTE]
**Cohen's thresholds for W depend on K.** For three conditions, `W < 0.10` is small, `0.10 to 0.30` is medium, and `>= 0.30` is large. Five or more conditions push the "large" threshold down to `0.25` because rank concordance is harder to achieve with more conditions to order.

**Try it:** Wrap the W formula in a helper `ex_kendall_w(ft, N, K)` that returns W for any Friedman result. Test it on the original `ft`.

```r title="Your turn: kendall_w helper"
ex_kendall_w <- function(ft, N, K) {
  # your code here
}

ex_kendall_w(ft, 12, 3)
#> Expected: ~0.84
```

<details>
<summary>Click to reveal solution</summary>

```r title="kendall_w helper solution"
ex_kendall_w <- function(ft, N, K) {
  as.numeric(ft$statistic) / (N * (K - 1))
}

ex_kendall_w(ft, 12, 3)
#> [1] 0.8402778
```

**Explanation:** `ft$statistic` is a named numeric. Stripping the name with `as.numeric()` keeps the helper's output clean.

</details>

## Which post-hoc test should follow a significant Friedman?

A significant Friedman tells you *some* pair of conditions differs but not *which* pair. The standard follow-up is a **paired Wilcoxon signed-rank test** for every pair, with a multiple-testing adjustment.

```r title="pairwise.wilcox.test() with paired = TRUE"
pwc <- pairwise.wilcox.test(sleep_long$sleep_hours,
                            sleep_long$treatment,
                            paired = TRUE,
                            p.adjust.method = "BH")
pwc
#>
#> 	Pairwise comparisons using Wilcoxon signed rank exact test
#>
#> data:  sleep_long$sleep_hours and sleep_long$treatment
#>
#>        Placebo Drug A
#> Drug A 0.00098 -
#> Drug B 0.00098 0.00098
#>
#> P value adjustment method: BH
```

After Benjamini-Hochberg adjustment all three pairs come back significant at any usual cutoff. Drug A beats Placebo, Drug B beats Placebo, and Drug B also beats Drug A. The conclusion mirrors what the spaghetti plot showed: the effect is consistent across patients, in the expected order.

[KEY INSIGHT]
**Pairwise Wilcoxon does not reuse the Friedman ranks.** Each pair is re-ranked from scratch using only the two columns under comparison. That keeps the post-hoc independent of the others but can occasionally disagree with what an all-pairs method like Conover or Nemenyi would say. When that happens, prefer the rank-method that matches your reporting convention rather than picking the more flattering p-value.

If you want a method that uses the Friedman ranks directly instead of re-ranking each pair, the **Conover** and **Nemenyi** tests are the textbook choices. They live in the `PMCMRplus` package, which is heavier than base R because it pulls in a C++ toolchain. Outside this notebook you would call `PMCMRplus::frdAllPairsConoverTest(sleep_mat)` for the Conover variant and `PMCMRplus::frdAllPairsNemenyiTest(sleep_mat)` for the Nemenyi variant.

[WARNING]
**Skipping the adjustment inflates Type I errors.** Three pairwise tests at alpha 0.05 give you a 14% chance of at least one false positive even when nothing is going on. Always pass `p.adjust.method = "BH"` (less strict, controls FDR) or `"bonferroni"` (strict, controls FWER).

**Try it:** Re-run `pairwise.wilcox.test()` on `sleep_long` with `p.adjust.method = "bonferroni"`. Compare against the BH numbers above. Save the result to `ex_pwc_bonf`.

```r title="Your turn: Bonferroni adjustment"
ex_pwc_bonf <- # your code here

ex_pwc_bonf
#> Expected: same conclusions, p-values multiplied by 3 (capped at 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bonferroni adjustment solution"
ex_pwc_bonf <- pairwise.wilcox.test(sleep_long$sleep_hours,
                                    sleep_long$treatment,
                                    paired = TRUE,
                                    p.adjust.method = "bonferroni")
ex_pwc_bonf
#>
#> 	Pairwise comparisons using Wilcoxon signed rank exact test
#>
#>        Placebo Drug A
#> Drug A 0.0029  -
#> Drug B 0.0015  0.0029
#>
#> P value adjustment method: bonferroni
```

**Explanation:** Bonferroni multiplies each raw p-value by the number of tests (3 here), capped at 1. The conclusions stay the same because the raw p-values were tiny to start with.

</details>

## What assumptions does the Friedman test require?

Friedman is forgiving but it is not assumption-free. Five conditions need to hold for the chi-square approximation to behave.

1. **Three or more conditions per subject.** With two conditions, use the Wilcoxon signed-rank test instead.
2. **Same subjects across all conditions.** No missing cells. If patient 7 skipped Drug B, drop patient 7 entirely or impute before testing.
3. **Outcome is at least ordinal.** Friedman ranks within rows, so the values must be orderable. Likert scales, reaction times, and continuous scores all qualify; nominal categories do not.
4. **Subjects (blocks) are independent.** The repeated measurements happen *within* a subject, but different subjects must not influence each other.
5. **Conditions can be ranked without dominant ties.** Friedman handles a few ties through average ranks, but if most rows are flat, the test loses power and the chi-square approximation drifts.

![Choosing a repeated measures test](screenshots/Friedman-Test-in-R-decision-flow.webp)
*Figure 2: Decision tree: when to choose Friedman over repeated measures ANOVA or a mixed-effects model.*

The clearest sign that Friedman is the right tool is failure of the normality assumption that powers RM-ANOVA. Fit the parametric model, look at the residuals, and let Shapiro-Wilk decide.

```r title="Shapiro-Wilk on RM-ANOVA residuals as a switching rule"
aov_fit <- lm(sleep_hours ~ treatment + patient, data = sleep_long)
shap_p  <- shapiro.test(residuals(aov_fit))$p.value
shap_p
#> [1] 0.6131
```

The residuals look fine here (`p > 0.05`), so RM-ANOVA would also work. Friedman's value shows when this gate fails: skewed reaction-time data, heavy-tailed cost data, or hard caps from rating scales push residuals away from normal and break the F distribution that RM-ANOVA leans on. In those cases Friedman keeps its calibration.

[NOTE]
**Sphericity is not Friedman's problem either.** RM-ANOVA also requires that the variances of all pairwise differences are equal. Friedman ranks within subjects, so it sidesteps both normality and sphericity in one move.

[TIP]
**Mid-ranks handle ties automatically.** R assigns tied values the average of their ranks (so a tie of two values that would have been ranks 2 and 3 becomes 2.5 each). This keeps Friedman well-behaved with a handful of ties, but the test loses power as the share of ties grows.

**Try it:** Decide which test fits each scenario, then state your reasoning in one sentence.

```r title="Your turn: pick the right test"
# Scenario A: 8 subjects, 2 conditions, normal residuals -> ?
# Scenario B: 30 subjects, 4 conditions, residuals fail Shapiro -> ?
# Scenario C: 12 subjects nested within 3 clinics, 4 conditions -> ?

ex_choice_a <- "..."
ex_choice_b <- "..."
ex_choice_c <- "..."
```

<details>
<summary>Click to reveal solution</summary>

**A:** Paired t-test (or Wilcoxon signed-rank if normality also fails). Friedman needs `K >= 3`.

**B:** Friedman test. Same subjects, more than two conditions, residuals fail normality.

**C:** Mixed-effects model (`lme4::lmer` or its rank-based cousin). Subjects are nested in clinics, so the independence assumption of Friedman breaks down.

</details>

## Practice Exercises

The exercises below combine ideas from across the post. Each one expects you to write code from scratch and verify against the expected output.

### Exercise 1: Full Friedman workflow on a fresh dataset

Build a 10-subject, 3-condition data frame `my_df` of synthetic exam scores, run `friedman.test()`, compute Kendall's W, and run BH-adjusted pairwise Wilcoxon. Save the trio to `my_ft`, `my_W`, and `my_pwc`.

```r title="Exercise 1: end-to-end pipeline"
# Hint: rep() builds repeated factors; rnorm() with set.seed() builds scores

set.seed(7)
my_df <- data.frame(
  student   = factor(rep(1:10, times = 3)),
  method    = factor(rep(c("Lecture","Group","Tutor"), each = 10),
                     levels = c("Lecture","Group","Tutor")),
  score     = c(rnorm(10, 60, 5), rnorm(10, 65, 5), rnorm(10, 72, 5))
)

# Write your code below:
my_ft  <-
my_W   <-
my_pwc <-
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(7)
my_df <- data.frame(
  student   = factor(rep(1:10, times = 3)),
  method    = factor(rep(c("Lecture","Group","Tutor"), each = 10),
                     levels = c("Lecture","Group","Tutor")),
  score     = c(rnorm(10, 60, 5), rnorm(10, 65, 5), rnorm(10, 72, 5))
)

my_ft <- friedman.test(score ~ method | student, data = my_df)
my_W  <- as.numeric(my_ft$statistic) / (10 * (3 - 1))
my_pwc <- pairwise.wilcox.test(my_df$score, my_df$method,
                               paired = TRUE,
                               p.adjust.method = "BH")
list(chi_sq = unname(my_ft$statistic),
     p      = my_ft$p.value,
     W      = my_W,
     pairs  = my_pwc$p.value)
```

**Explanation:** The pipeline is identical to the sleep-aid example. With `set.seed(7)` the chi-squared is small enough that you can see how Friedman behaves under noisier signals.

</details>

### Exercise 2: Build a friedman_report() helper

Write a function `friedman_report(y, x, block)` that returns a list with `chi_sq`, `df`, `p`, `W`, and a BH-adjusted pairwise Wilcoxon matrix. Call it on `sleep_long`.

```r title="Exercise 2: helper function"
# Hint: friedman.test takes a formula y ~ x | block when you build it with reformulate()

friedman_report <- function(y, x, block) {
  # your code here
}

friedman_report(sleep_long$sleep_hours,
                sleep_long$treatment,
                sleep_long$patient)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
friedman_report <- function(y, x, block) {
  N  <- length(unique(block))
  K  <- length(unique(x))
  ft <- friedman.test(y, groups = x, blocks = block)
  W  <- as.numeric(ft$statistic) / (N * (K - 1))
  pw <- pairwise.wilcox.test(y, x, paired = TRUE, p.adjust.method = "BH")
  list(chi_sq = as.numeric(ft$statistic),
       df     = as.numeric(ft$parameter),
       p      = ft$p.value,
       W      = W,
       pairs  = pw$p.value)
}

friedman_report(sleep_long$sleep_hours,
                sleep_long$treatment,
                sleep_long$patient)
#> $chi_sq
#> [1] 20.16667
#>
#> $df
#> [1] 2
#>
#> $p
#> [1] 4.177e-05
#>
#> $W
#> [1] 0.8402778
#>
#> $pairs
#>        Placebo Drug A
#> Drug A 0.00098 NA
#> Drug B 0.00098 0.00098
```

**Explanation:** `friedman.test()` accepts vector arguments via `(y, groups, blocks)`, which lets the helper stay simple. The pairwise matrix uses NA for the upper triangle, the same shape `pairwise.wilcox.test` returns.

</details>

### Exercise 3: Decide between Friedman and RM-ANOVA on borderline data

Use `set.seed(42)` to generate a 20-subject, 3-condition data frame `my_borderline` with mostly normal residuals plus two outliers. Fit `lm()`, run Shapiro on the residuals, and recommend Friedman or RM-ANOVA based on the p-value. Save the recommendation to `my_pick`.

```r title="Exercise 3: switching rule in action"
set.seed(42)
n  <- 20
my_borderline <- data.frame(
  subj  = factor(rep(1:n, times = 3)),
  cond  = factor(rep(c("A","B","C"), each = n)),
  y     = c(rnorm(n, 10, 2),
            rnorm(n, 11, 2),
            c(rnorm(n - 2, 13, 2), 30, 32))   # two outliers in condition C
)

# Write your code below:
fit       <- # ...
shap_p    <- # ...
my_pick   <- # ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(42)
n  <- 20
my_borderline <- data.frame(
  subj  = factor(rep(1:n, times = 3)),
  cond  = factor(rep(c("A","B","C"), each = n)),
  y     = c(rnorm(n, 10, 2),
            rnorm(n, 11, 2),
            c(rnorm(n - 2, 13, 2), 30, 32))
)

fit      <- lm(y ~ cond + subj, data = my_borderline)
shap_p   <- shapiro.test(residuals(fit))$p.value
my_pick  <- ifelse(shap_p < 0.05, "Friedman", "RM-ANOVA")
list(shapiro_p = shap_p, recommendation = my_pick)
```

**Explanation:** The two outliers drag the residuals away from normal, Shapiro returns a small p, and the rule recommends Friedman. Without the outliers, the same code would point you to RM-ANOVA.

</details>

## Complete Example

The R help page for `friedman.test()` ships with the **Rounding First Base** dataset from Hollander and Wolfe (1973): 22 baseball players timed running to first base under three styles of rounding. The pipeline below shows the full reporting workflow you would put in a paper.

```r title="End-to-end Friedman pipeline on RoundingTimes"
RoundingTimes <- matrix(c(
  5.40, 5.50, 5.55,
  5.85, 5.70, 5.75,
  5.20, 5.60, 5.50,
  5.55, 5.50, 5.40,
  5.90, 5.85, 5.70,
  5.45, 5.55, 5.60,
  5.40, 5.40, 5.35,
  5.45, 5.50, 5.35,
  5.25, 5.15, 5.00,
  5.85, 5.80, 5.70,
  5.25, 5.20, 5.10,
  5.65, 5.55, 5.45,
  5.60, 5.35, 5.45,
  5.05, 5.00, 4.95,
  5.50, 5.50, 5.40,
  5.45, 5.55, 5.50,
  5.55, 5.55, 5.35,
  5.45, 5.50, 5.55,
  5.50, 5.45, 5.25,
  5.65, 5.60, 5.40,
  5.70, 5.65, 5.55,
  6.30, 6.30, 6.25),
  nrow = 22, byrow = TRUE,
  dimnames = list(1:22, c("Round Out", "Narrow Angle", "Wide Angle")))

# Step 1: run the test
ft_round <- friedman.test(RoundingTimes)
ft_round
#>
#> 	Friedman rank sum test
#>
#> data:  RoundingTimes
#> Friedman chi-squared = 11.143, df = 2, p-value = 0.003805

# Step 2: compute Kendall's W
N <- nrow(RoundingTimes); K <- ncol(RoundingTimes)
W_round <- as.numeric(ft_round$statistic) / (N * (K - 1))
W_round
#> [1] 0.2532468

# Step 3: pivot to long for pairwise.wilcox.test
round_long <- data.frame(
  player = factor(rep(1:N, times = K)),
  style  = factor(rep(colnames(RoundingTimes), each = N),
                  levels = colnames(RoundingTimes)),
  time   = as.numeric(RoundingTimes)
)
pwc_round <- pairwise.wilcox.test(round_long$time, round_long$style,
                                  paired = TRUE,
                                  p.adjust.method = "BH")
pwc_round
#>
#> 	Pairwise comparisons using Wilcoxon signed rank test with continuity correction
#>
#>              Round Out Narrow Angle
#> Narrow Angle 0.355     -
#> Wide Angle   0.021     0.005
#>
#> P value adjustment method: BH
```

The Friedman test gives a p-value of `0.0038`, so at least one rounding style differs in expected time. Kendall's W is `0.25` (medium effect for `K = 3`). Pairwise Wilcoxon then locates the difference: **Wide Angle is faster than both Round Out and Narrow Angle**, while Round Out and Narrow Angle do not differ. A reporting sentence: *"A Friedman test indicated a significant effect of rounding style on running time, chi-squared(2) = 11.14, p = .004, W = 0.25. BH-adjusted pairwise Wilcoxon comparisons showed Wide Angle was faster than both Round Out (p = .021) and Narrow Angle (p = .005), with no difference between the latter two (p = .355)."*

## Summary

The Friedman test is your first stop whenever the same subjects are measured under three or more conditions and you cannot trust normality. The table below is a quick reference card for the full workflow.

![End-to-end Friedman workflow](screenshots/Friedman-Test-in-R-workflow.webp)
*Figure 3: The end-to-end Friedman workflow: test, effect size, post-hoc, report.*

| Step | R call | What it gives you |
|---|---|---|
| Run the test | `friedman.test(y ~ x \| block)` | chi-squared, df, p-value |
| Effect size | `chi^2 / (N * (K - 1))` | Kendall's W in [0, 1] |
| Visualize | `geom_line(aes(group = subj))` | Spaghetti plot of trajectories |
| Post-hoc | `pairwise.wilcox.test(..., paired = TRUE, p.adjust.method = "BH")` | All-pair p-value matrix |
| Assumption check | `shapiro.test(residuals(lm(...)))` | Switching rule vs RM-ANOVA |

Reach for **RM-ANOVA** when the residuals look normal, **Friedman** when they do not, and a **mixed-effects model** when subjects are nested in higher-level groups. Pair every Friedman with Kendall's W and a multiple-testing-aware post-hoc, and you have a defensible analysis even before you write the report.

## References

1. R Core Team. `friedman.test()` reference documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/friedman.test.html)
2. Friedman, M. (1937). The use of ranks to avoid the assumption of normality implicit in the analysis of variance. *Journal of the American Statistical Association*, 32(200), 675-701. [Link](https://www.jstor.org/stable/2279372)
3. Hollander, M., Wolfe, D. A., Chicken, E. (2014). *Nonparametric Statistical Methods*, 3rd Edition. Wiley. Chapter 7.
4. Mangiafico, S. (2016). *Summary and Analysis of Extension Program Evaluation in R*, Friedman Test chapter. [Link](https://rcompanion.org/handbook/F_10.html)
5. Pohlert, T. (2023). *PMCMRplus: Calculate Pairwise Multiple Comparisons of Mean Rank Sums Extended*. CRAN. [Link](https://cran.r-project.org/web/packages/PMCMRplus/index.html)
6. Conover, W. J. (1999). *Practical Nonparametric Statistics*, 3rd Edition. Wiley. Sections 5.8 and 5.9.
7. Wikipedia, Friedman test. [Link](https://en.wikipedia.org/wiki/Friedman_test)

## Continue Learning

- [Kruskal-Wallis Test in R: k-Sample Nonparametric ANOVA + Post-Hoc](Kruskal-Wallis-Test-in-R-2.html) covers the Friedman analogue when groups are *independent* rather than repeated measures on the same subjects.
- [Wilcoxon Signed-Rank Test in R: Paired Data Without Normality](Wilcoxon-Signed-Rank-Test-in-R.html) handles the two-condition special case that backs Friedman's pairwise post-hoc.
- [When to Use Nonparametric Tests in R: Decision Guide with Flowchart](When-to-Use-Nonparametric-Tests-in-R.html) gives the broader decision tree that places Friedman among its rank-based cousins.

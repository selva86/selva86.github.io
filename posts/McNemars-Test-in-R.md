---
title: "McNemar's Test in R: Paired Categorical Data & Matched Case-Control"
slug: "McNemars-Test-in-R"
description: "Run McNemar's test in R for paired categorical data and matched case-control studies. Build 2x2 tables, use mcnemar.test(), interpret discordant pairs."
keywords: "McNemar's test in R, mcnemar.test, paired categorical data, matched case-control, discordant pairs, paired proportions, exact McNemar test, before after binary, paired binary outcomes, continuity correction"
auto_link_terms: "McNemar's test|McNemar test|mcnemar.test|paired categorical data|matched case-control|discordant pairs|paired binary data"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "FR-cate-3"
post_type: "FR"
fr_parent: "Fishers-Exact-Test-in-R.html"
difficulty: "Intermediate"
---

# McNemar's Test in R: Paired Categorical Data & Matched Case-Control

<p class="lead">McNemar's test compares two paired proportions on the same subjects. It looks only at the cells where two paired measurements disagree (the discordant pairs) and asks whether one direction of change is more common than the other. Reach for it whenever the same person, item, or matched pair contributes both data points.</p>

## What problem does McNemar's test solve?

Suppose 794 voters watch a debate and you record their preferred candidate before and after. A regular chi-square test cannot answer "did opinions shift?" here, because each voter contributes two linked observations and chi-square assumes those rows are independent. McNemar's test fixes this by ignoring everyone whose answer stayed the same, and asking whether the people who *changed* moved mostly in one direction. Let's run it.

```r title="Paired vote shift before vs after a debate"
votes <- matrix(c(48,  86,
                  150, 510),
                nrow = 2, byrow = TRUE,
                dimnames = list(after  = c("Candidate A", "Candidate B"),
                                before = c("Candidate A", "Candidate B")))
votes
#>              before
#> after         Candidate A Candidate B
#>   Candidate A          48          86
#>   Candidate B         150         510

mc1 <- mcnemar.test(votes)
mc1
#> 
#> 	McNemar's Chi-squared test with continuity correction
#> 
#> data:  votes
#> McNemar's chi-squared = 16.818, df = 1, p-value = 4.115e-05
```

The test ignores the 48 voters who picked A both times and the 510 who picked B both times. It only counts the 150 who switched A to B and the 86 who switched B to A. The chi-square value is 16.8 with one degree of freedom and a p-value near zero, so the asymmetry between 150 and 86 is far larger than chance would explain. Net opinion moved toward candidate B.

![Decision flow for choosing between McNemar and related tests.](screenshots/McNemars-Test-in-R-when-to-use.webp)
*Figure 1: Decision flow: choosing between McNemar, chi-square, and the exact binomial form.*

[KEY INSIGHT]
**McNemar's test throws away the agreements and tests only the disagreements.** People who answered the same way both times tell us nothing about *change*, so the test conditions on the count of switchers and asks if the two switching directions are 50/50.

**Try it:** Swap the two discordant counts (86 and 150) so the directions are equal. Predict what the p-value should be, then run it.

```r title="Your turn: balanced switchers"
ex_votes <- matrix(c(48, 118,
                     118, 510),
                   nrow = 2, byrow = TRUE)

# Run mcnemar.test() on ex_votes:
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Balanced switchers solution"
ex_mc <- mcnemar.test(ex_votes)
ex_mc
#> 
#> 	McNemar's Chi-squared test with continuity correction
#> 
#> data:  ex_votes
#> McNemar's chi-squared = 0, df = 1, p-value = 1
```

**Explanation:** When `b == c`, the numerator `(b - c)^2` is zero, so the chi-square statistic is zero and the p-value is 1. There is no evidence of asymmetric change.

</details>

## How does the discordant-pair logic work?

Every paired 2x2 table has four cells: `a` and `d` are the concordant pairs (both measurements agree), while `b` and `c` are the discordant pairs (the measurements disagree, in opposite directions). McNemar's test only uses `b` and `c`. The intuition is simple: if there is no real shift between the two timepoints, a subject who *did* change is equally likely to have moved in either direction, so we expect `b` and `c` to be roughly equal.

![Anatomy of a paired 2x2 table.](screenshots/McNemars-Test-in-R-2x2-structure.webp)
*Figure 2: Anatomy of the paired 2x2 table, only the discordant cells (b, c) drive the test.*

The test statistic itself is short:

$$\chi^2 = \frac{(b - c)^2}{b + c}$$

Where:

- $b$ = pairs that went from "yes" to "no" (or first category to second)
- $c$ = pairs that went from "no" to "yes"
- $\chi^2$ follows a chi-square distribution with 1 degree of freedom under H0

Let's compute the statistic by hand and compare it with `mcnemar.test()` (with `correct = FALSE`, so R uses the same formula).

```r title="Manual chi-square vs mcnemar.test"
b <- 86
c <- 150

chi2_manual <- (b - c)^2 / (b + c)
chi2_manual
#> [1] 17.35593

mcnemar.test(votes, correct = FALSE)
#> 
#> 	McNemar's Chi-squared test
#> 
#> data:  votes
#> McNemar's chi-squared = 17.356, df = 1, p-value = 3.108e-05
```

The two numbers match, which confirms the formula and confirms that `mcnemar.test()` ignores the concordant cells entirely. The p-value drops slightly versus the corrected version we ran above because we removed the continuity correction.

**Try it:** Compute the McNemar chi-square by hand for `b = 12` and `c = 4`, then verify with `mcnemar.test()` on a 2x2 matrix where the concordant cells can be anything (set them to 100 each).

```r title="Your turn: hand-compute the statistic"
ex_b <- 12
ex_c <- 4

# 1) compute chi2 by hand:
# 2) build a 2x2 matrix and verify with mcnemar.test(..., correct = FALSE)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Hand-compute solution"
ex_chi2 <- (ex_b - ex_c)^2 / (ex_b + ex_c)
ex_chi2
#> [1] 4

ex_tab <- matrix(c(100, ex_b,
                   ex_c, 100), nrow = 2, byrow = TRUE)
mcnemar.test(ex_tab, correct = FALSE)
#> 
#> 	McNemar's Chi-squared test
#> 
#> data:  ex_tab
#> McNemar's chi-squared = 4, df = 1, p-value = 0.0455
```

**Explanation:** The concordant counts (100, 100) do not affect the statistic at all, only `b` and `c` do.

</details>

## How does the continuity correction change the result?

By default, `mcnemar.test()` applies a Yates-style continuity correction: it subtracts 1 from `|b - c|` before squaring. This nudges the p-value upward to compensate for using a continuous chi-square distribution to approximate a discrete count statistic. With large discordant totals the correction barely moves the answer; with small ones it can flip a borderline result.

```r title="Continuity correction on vs off"
mc_corr   <- mcnemar.test(votes, correct = TRUE)   # default
mc_uncorr <- mcnemar.test(votes, correct = FALSE)

mc_corr$statistic
#> McNemar's chi-squared 
#>              16.81780
mc_uncorr$statistic
#> McNemar's chi-squared 
#>              17.35593

c(corrected = mc_corr$p.value, uncorrected = mc_uncorr$p.value)
#>    corrected  uncorrected 
#> 4.114617e-05 3.107948e-05
```

Both p-values are tiny here, so the conclusion does not change. But notice how the corrected statistic is smaller and the p-value is larger. That extra padding is doing exactly what it claims: making the test slightly more conservative.

[TIP]
**Default to `correct = TRUE` for routine reporting.** It matches the behavior most reviewers and textbooks expect. Switch to `correct = FALSE` only when you want the raw formula or are comparing against a hand calculation.

**Try it:** Compare corrected vs uncorrected on the small table `b = 12, c = 4` from the last exercise (use `ex_tab`). Which p-value is larger?

```r title="Your turn: small-sample correction effect"
# Use ex_tab from the previous exercise.
# Run mcnemar.test() with correct = TRUE and correct = FALSE.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Small-sample correction solution"
mcnemar.test(ex_tab, correct = TRUE)$p.value
#> [1] 0.08012

mcnemar.test(ex_tab, correct = FALSE)$p.value
#> [1] 0.0455
```

**Explanation:** With only 16 discordant pairs, the correction pushes the p-value from 0.046 to 0.080, crossing the conventional 0.05 threshold. This is exactly the regime where you should think about an exact test instead.

</details>

## When should you use the exact binomial version?

When the total number of discordant pairs `b + c` is small, the chi-square approximation is unreliable. A common rule of thumb is to use the exact form whenever `b + c < 25`. The exact McNemar test is just a binomial test in disguise: under the null hypothesis, each discordant pair is equally likely to flip in either direction, so `b` follows a Binomial(`b + c`, 0.5) distribution. We can run this directly with `binom.test()`.

```r title="Exact McNemar via binom.test"
b_small <- 12
c_small <- 4
n_disc  <- b_small + c_small

mc_exact_binom <- binom.test(b_small, n_disc, p = 0.5)
mc_exact_binom
#> 
#> 	Exact binomial test
#> 
#> data:  b_small and n_disc
#> number of successes = 12, number of trials = 16, p-value = 0.07681
#> alternative hypothesis: true probability of success is not equal to 0.5
#> 95 percent confidence interval:
#>  0.4685 0.9298
#> sample estimates:
#> probability of success 
#>                   0.75
```

The exact p-value is 0.0768, which lands between the continuity-corrected (0.0801) and uncorrected (0.0455) chi-square versions, and is the most trustworthy of the three when discordant pairs are this scarce. With only 16 discordant pairs, you should report the exact p-value instead of the chi-square one.

[WARNING]
**Do not trust the chi-square McNemar p-value when `b + c < 25`.** The chi-square distribution is a poor approximation for so few discordant pairs. The exact binomial p-value above is the safe choice, and it costs you nothing extra.

**Try it:** Run an exact McNemar on `b = 1, c = 7`. What does the p-value say?

```r title="Your turn: very small discordants"
# Run binom.test() for b = 1, c = 7

```

<details>
<summary>Click to reveal solution</summary>

```r title="Tiny discordants solution"
binom.test(1, 1 + 7, p = 0.5)$p.value
#> [1] 0.0703125
```

**Explanation:** Only 8 discordant pairs is firmly in exact-test territory. The p-value of 0.07 says the imbalance (1 vs 7) is not quite significant at the conventional 5 percent threshold, even though the proportion looks lopsided.

</details>

## How do you run McNemar's test on a matched case-control study?

In a 1:1 matched case-control study, every case is paired with one control matched on age, sex, and other confounders. You then ask whether the case was exposed to a risk factor more often than its matched control. The 2x2 table cross-classifies exposure (yes/no) for case versus control. Concordant pairs (both exposed, or both not exposed) carry no information about the case-control difference. Discordant pairs do all the work, and the matched odds ratio is simply `b / c`.

```r title="Matched case-control: smoking and lung cancer"
# 50 matched pairs of cases (lung cancer) and controls,
# cross-tabulating smoking exposure within each pair.
cc_table <- matrix(c(8,  20,
                     5,  17),
                   nrow = 2, byrow = TRUE,
                   dimnames = list(case    = c("Smoker", "Non-smoker"),
                                   control = c("Smoker", "Non-smoker")))
cc_table
#>             control
#> case         Smoker Non-smoker
#>   Smoker          8         20
#>   Non-smoker      5         17

mc_cc <- mcnemar.test(cc_table)
mc_cc
#> 
#> 	McNemar's Chi-squared test with continuity correction
#> 
#> data:  cc_table
#> McNemar's chi-squared = 7.84, df = 1, p-value = 0.005107

OR_matched <- 20 / 5
OR_matched
#> [1] 4
```

Twenty pairs had a smoking case with a non-smoking control, while only 5 pairs had the reverse. McNemar's p-value of 0.005 says this asymmetry is unlikely under the null. The matched odds ratio of 4 means a case is four times as likely to be the exposed member of the pair, suggesting smoking is associated with lung cancer in this matched design.

[KEY INSIGHT]
**McNemar gives you the p-value, but the matched odds ratio (b / c) gives you the effect size.** Always report both. A tiny p-value with an OR near 1 is a sign of a huge sample, not a meaningful association.

**Try it:** What is the matched OR if you flip the discordant cells (so b = 5 and c = 20)?

```r title="Your turn: flipped exposure"
# Compute the matched OR for b = 5, c = 20

```

<details>
<summary>Click to reveal solution</summary>

```r title="Flipped exposure solution"
ex_OR <- 5 / 20
ex_OR
#> [1] 0.25
```

**Explanation:** Flipping the direction inverts the odds ratio. An OR of 0.25 says the exposed member of the pair is *less* likely to be the case, which would suggest a protective effect.

</details>

## What if your table is bigger than 2x2?

`mcnemar.test()` also accepts square `k x k` tables, where it tests *marginal homogeneity*: whether the row totals and column totals come from the same distribution. This is useful for ordinal scales, like a rater's 3-level score before and after training. For larger tables R uses the Stuart-Maxwell variant, which is McNemar's natural generalization.

```r title="3x3 rater agreement table"
rater <- matrix(c(20,  4,  1,
                   3, 30,  6,
                   0,  5, 31),
                nrow = 3, byrow = TRUE,
                dimnames = list(after  = c("Low", "Med", "High"),
                                before = c("Low", "Med", "High")))
rater
#>       before
#> after  Low Med High
#>   Low   20   4    1
#>   Med    3  30    6
#>   High   0   5   31

mc_kxk <- mcnemar.test(rater)
mc_kxk
#> 
#> 	McNemar's Chi-squared test
#> 
#> data:  rater
#> McNemar's chi-squared = 1.2338, df = 3, p-value = 0.7449
```

The p-value of 0.74 means the row and column marginals are statistically indistinguishable. After training, the *distribution* of scores is essentially the same, even though individual ratings shifted up or down. This is the right answer for an "is there a systematic shift in the population?" question.

[NOTE]
**For 2x2 tables with very few discordants, prefer the exact binomial form from the previous section.** `mcnemar.test()` falls back to its chi-square path even for 2x2 input, so you have to ask for `binom.test()` explicitly when the chi-square approximation is shaky.

**Try it:** Build a 3x3 table where the diagonal is all 50 and off-diagonal cells are all 0. What p-value do you expect?

```r title="Your turn: perfect agreement"
# Build the 3x3 matrix with 50s on the diagonal and 0s elsewhere.
# Run mcnemar.test() on it.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Perfect agreement solution"
ex_diag <- diag(50, 3)
ex_diag
#>      [,1] [,2] [,3]
#> [1,]   50    0    0
#> [2,]    0   50    0
#> [3,]    0    0   50

mcnemar.test(ex_diag)
#> 
#> 	McNemar's Chi-squared test
#> 
#> data:  ex_diag
#> McNemar's chi-squared = NaN, df = 3, p-value = NaN
```

**Explanation:** All discordants are zero, so the test statistic is 0/0 (NaN). Practically, perfect agreement leaves nothing to test. Add a tiny number of off-diagonal counts to get a finite statistic.

</details>

## Practice Exercises

### Exercise 1: Pre-post survey on a training program

A training program asked 200 employees whether they felt confident using R, before and after a workshop. The cross-tab is: 40 said "yes" both times, 90 said "no" both times, 8 dropped from yes to no, and 62 went from no to yes. Build the 2x2 matrix, run `mcnemar.test()` with and without continuity correction, and decide which p-value is more appropriate to report.

```r title="Practice 1: pre-post training"
# Build the 2x2 matrix for the training data
# Hint: rows = after, columns = before

# Run mcnemar.test() with and without correction:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Practice 1 solution"
my_train <- matrix(c(40, 62,
                      8, 90),
                   nrow = 2, byrow = TRUE,
                   dimnames = list(after  = c("Yes", "No"),
                                   before = c("Yes", "No")))

mcnemar.test(my_train, correct = TRUE)$p.value
#> [1] 2.42e-10

mcnemar.test(my_train, correct = FALSE)$p.value
#> [1] 1.09e-10
```

**Explanation:** With `b + c = 70` discordant pairs, the chi-square approximation is fine, so either p-value is fine to report. Both are essentially zero. Convention favors the corrected version. The matched OR is `62 / 8 = 7.75`, so confidence rose strongly after the workshop.

</details>

### Exercise 2: Tiny matched case-control study

In a matched case-control study with only 30 pairs, you observe `b = 3` (cases exposed, controls not) and `c = 10` (controls exposed, cases not). The remaining 17 pairs are concordant. Decide whether to use the chi-square McNemar or the exact binomial form, run the appropriate test, and compute the matched odds ratio.

```r title="Practice 2: tiny case-control"
# b = 3, c = 10
# Step 1: choose chi-square or exact?
# Step 2: run the test
# Step 3: matched OR

```

<details>
<summary>Click to reveal solution</summary>

```r title="Practice 2 solution"
my_b <- 3
my_c <- 10

# b + c = 13 < 25, so use the exact binomial form
my_exact <- binom.test(my_b, my_b + my_c, p = 0.5)
my_exact$p.value
#> [1] 0.09228

my_OR <- my_b / my_c
my_OR
#> [1] 0.3
```

**Explanation:** Only 13 discordant pairs means the chi-square approximation is unsafe. The exact p-value is 0.092, so we cannot reject the null at the 0.05 level despite the lopsided 3:10 split. The matched OR of 0.3 hints at a protective effect, but with this sample size we lack the evidence to claim it.

</details>

## Complete Example: agreement between two graders

Sixty patients in an eye-drop trial were each scored "improved" or "not improved" by two ophthalmologists working independently. We want to know whether the two graders systematically disagreed: does Grader A label patients as "improved" more often than Grader B?

```r title="Two-grader agreement: full workflow"
eye_table <- matrix(c(28,  4,
                     12, 16),
                    nrow = 2, byrow = TRUE,
                    dimnames = list(grader_A = c("Improved", "Not improved"),
                                    grader_B = c("Improved", "Not improved")))
eye_table
#>               grader_B
#> grader_A       Improved Not improved
#>   Improved           28            4
#>   Not improved       12           16

# Marginal proportions
margin_A <- sum(eye_table[1, ]) / sum(eye_table)
margin_B <- sum(eye_table[, 1]) / sum(eye_table)
c(grader_A_prop = margin_A, grader_B_prop = margin_B)
#> grader_A_prop grader_B_prop 
#>     0.5333333     0.6666667

# Chi-square McNemar (b + c = 16 is borderline)
eye_mc <- mcnemar.test(eye_table)
eye_mc
#> 
#> 	McNemar's Chi-squared test with continuity correction
#> 
#> data:  eye_table
#> McNemar's chi-squared = 3.0625, df = 1, p-value = 0.08012

# Exact binomial (preferred here because b + c < 25)
eye_exact <- binom.test(4, 16, p = 0.5)
eye_exact$p.value
#> [1] 0.0768
```

Grader A called 53 percent of patients improved while grader B called 67 percent improved. Of the 16 patients where the two graders disagreed, 12 were rated "not improved" by A and "improved" by B, against only 4 the other way. The exact p-value of 0.077 is just above 0.05, so the disagreement direction is suggestive but not conclusive at the conventional threshold. With more patients, this could turn into a clear systematic bias.

## Summary

McNemar's test is the right choice whenever your two measurements are linked at the row level: same person twice, matched case-control pairs, two diagnostic tests on the same patient.

| Situation | Test to use | R call |
|---|---|---|
| 2x2 paired table, b + c >= 25 | Chi-square McNemar | `mcnemar.test(tab)` |
| 2x2 paired table, b + c < 25 | Exact binomial | `binom.test(b, b + c, 0.5)` |
| k x k square table (k > 2) | Stuart-Maxwell | `mcnemar.test(tab)` (auto) |
| Matched case-control effect size | Matched odds ratio | `b / c` |
| Independent samples instead | Chi-square or Fisher | `chisq.test()` / `fisher.test()` |

**Key formula:** $\chi^2 = (b - c)^2 / (b + c)$, with 1 degree of freedom. The continuity-corrected version subtracts 1 from $|b - c|$ before squaring.

**Reporting checklist:** state the discordant counts (`b` and `c`), the test variant (corrected, uncorrected, or exact), the p-value, and the matched odds ratio when relevant.

## References

1. McNemar, Q. (1947). Note on the sampling error of the difference between correlated proportions or percentages. *Psychometrika*, 12(2), 153-157. [Link](https://link.springer.com/article/10.1007/BF02295996)
2. Agresti, A. (2013). *Categorical Data Analysis* (3rd ed.). Wiley. Chapter 10: Models for Matched Pairs.
3. Fagerland, M. W., Lydersen, S., & Laake, P. (2013). The McNemar test for binary matched-pairs data: mid-p and asymptotic are better than exact conditional. *BMC Medical Research Methodology*, 13, 91. [Link](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/1471-2288-13-91)
4. R Core Team. `?mcnemar.test` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mcnemar.test.html)
5. Fay, M. P. exact2x2 package vignette: Exact McNemar's Test and Confidence Intervals. CRAN. [Link](https://cran.r-project.org/web/packages/exact2x2/vignettes/exactMcNemar.pdf)
6. Mangiafico, S. *Summary and Analysis of Extension Program Evaluation in R*: McNemar Test. [Link](https://rcompanion.org/handbook/H_05.html)

## Continue Learning

- [Fisher's Exact Test in R](Fishers-Exact-Test-in-R.html), the unpaired counterpart for small 2x2 tables.
- [Categorical Data in R](Categorical-Data-in-R.html), a broader toolkit for factor variables and contingency tables.
- [Chi-Squared Test of Independence](Chi-Squared-Test-of-Independence.html) for when your two samples are independent rather than paired.

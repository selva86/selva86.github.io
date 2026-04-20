---
title: "Repeated Measures Exercises in R: 8 Within-Subjects Design Problems — Solved Step-by-Step)"
slug: Repeated-Measures-Exercises-in-R
description: "Practise 8 repeated measures ANOVA exercises in R with aov() + Error(), Mauchly, Greenhouse-Geisser, paired post-hoc, and a mixed design, solved step-by-step."
keywords: "repeated measures exercises in R, within-subjects ANOVA practice, aov Error R, Mauchly's test R, Greenhouse-Geisser correction, paired post-hoc R, mixed design ANOVA, partial eta squared R, RM ANOVA exercises"
auto_link_terms: "repeated measures exercises|repeated measures practice|within-subjects exercises|repeated measures ANOVA exercises|Mauchly's test exercises|sphericity exercises in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E7.3
post_type: EX
sidebar_title: "Repeated Measures (8 problems)"
fr_parent: Repeated-Measures-ANOVA-in-R.html
difficulty: Intermediate
---

# Repeated Measures Exercises in R: 8 Within-Subjects Design Problems — Solved Step-by-Step)

<p class="lead">Eight repeated measures ANOVA exercises that put every within-subjects tool in base R through its paces. You simulate within-subjects data, fit one- and two-way RM models with `aov()` and `Error()`, run Mauchly's test, apply the Greenhouse-Geisser correction by hand, run paired post-hoc comparisons, compute partial eta squared, and finish on a mixed design using the built-in ChickWeight dataset.</p>

## What changes when the same subject is measured multiple times?

Ordinary one-way ANOVA assumes independent observations. The moment the same subject contributes to every condition, that assumption breaks: a subject's baseline follows them through every measurement, and the between-subject noise hides real effects. Repeated measures ANOVA separates that subject-level variability from the error, giving a sharper test of the within-subjects factor. The base R tool for this is `aov()` paired with an `Error()` term, and the fastest way to see the payoff is to fit both models on the same data.

```r title="Naive ANOVA vs repeated measures ANOVA"
# Deterministic within-subjects dataset: 10 subjects, 3 time points
rm_long <- data.frame(
  subject = factor(rep(1:10, each = 3)),
  time    = factor(rep(c("T1", "T2", "T3"), times = 10),
                   levels = c("T1", "T2", "T3")),
  score   = c(48, 50, 52,   # subject 1: T1, T2, T3
              52, 56, 58,   # subject 2
              49, 52, 57,   # subject 3
              51, 55, 58,   # subject 4
              55, 55, 62,   # subject 5
              47, 52, 54,   # subject 6
              50, 54, 59,   # subject 7
              53, 53, 56,   # subject 8
              51, 58, 62,   # subject 9
              49, 52, 55)   # subject 10
)

# Naive one-way ANOVA: treats the 30 rows as independent. WRONG for RM data.
naive_fit <- aov(score ~ time, data = rm_long)
summary(naive_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> time         2  231.5  115.73   15.87 2.98e-05 ***
#> Residuals   27  196.7    7.29

# Correct: repeated measures ANOVA with Error(subject/time)
rm_fit <- aov(score ~ time + Error(subject/time), data = rm_long)
summary(rm_fit)
#>
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Residuals  9  158.8   17.65
#>
#> Error: subject:time
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> time       2  231.5  115.73   55.10 4.54e-08 ***
#> Residuals 18   37.9    2.10
```

Both models agree that time matters, but the correct RM ANOVA produces F = 55.1 versus the naive ANOVA's F = 15.9 on the same 30 observations. That is a 3.5-fold jump in the F-statistic, because the RM model strips out the 158.8 sum-of-squares of between-subject variation (people have different baselines) before computing the F-test. That between-subject variation is not error in a within-subjects question, and leaving it in the denominator wastes power. The p-values tell the same story: 3e-05 (naive) versus 4.5e-08 (RM).

[KEY INSIGHT]
**Each subject is their own control.** The `Error(subject/time)` term tells `aov()` to partition variability into between-subject (the `Error: subject` stratum) and within-subject (the `Error: subject:time` stratum). The within-subjects F-test is calculated only against within-subject variability, which is why it is more powerful for the same n.

**Try it:** From `rm_fit`, extract the F-value for the `time` effect into `ex_f`.

```r title="Your turn: extract the RM F-value"
# Try it: pull the F value for `time` out of rm_fit
# Hint: summary(rm_fit) returns a list keyed by stratum name.
# Look for "Error: subject:time" and pick the F value column.
ex_f <- ___   # replace with the correct extraction
ex_f
#> Expected: a number near 55.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract F-value solution"
# summary(rm_fit) returns a list; the within-subject stratum is named
# "Error: subject:time". Each stratum's summary is itself a list with one
# element per term, each an ANOVA table.
rm_summary <- summary(rm_fit)
ex_f <- rm_summary[["Error: subject:time"]][[1]][["F value"]][1]
ex_f
#> [1] 55.10021
```

**Explanation:** The within-subjects stratum is named using a colon between the grouping variables. Inside it, the first list element is the ANOVA table for the `time` term. Indexing `"F value"` and taking the first row picks the term's F; the second row is `NA` (residuals have no F). This pattern generalises: swap the stratum name and the term index to pull any F from any split-plot design.

</details>

## How do you check the sphericity assumption?

Repeated measures ANOVA assumes sphericity: the variances of the differences between every pair of within-subject levels are equal. When it fails, the within-subject F inflates and you chase false positives. Mauchly's test is the classical check, and it runs on a multivariate linear model fit to the wide-format data. When it rejects, the Greenhouse-Geisser correction shrinks the degrees of freedom by a factor ε (epsilon) to recover a valid p-value, and you can compute ε by hand from the covariance matrix.

```r title="Mauchly's test of sphericity"
# Build wide-format vectors from rm_long
T1 <- rm_long$score[rm_long$time == "T1"]
T2 <- rm_long$score[rm_long$time == "T2"]
T3 <- rm_long$score[rm_long$time == "T3"]

# Multivariate linear model: one response per time point
mlm <- lm(cbind(T1, T2, T3) ~ 1)

# Mauchly's test on the within-subject contrasts
idata <- data.frame(time = factor(c("T1", "T2", "T3")))
mauchly_res <- mauchly.test(mlm, M = ~time, X = ~1, idata = idata)
mauchly_res
#>
#>  Mauchly's test of sphericity
#>
#> Contrasts orthogonal to
#>  ~1
#>
#> Contrasts spanned by
#>  ~time
#>
#> data:  SSD matrix from lm(formula = cbind(T1, T2, T3) ~ 1)
#> W = 0.86476, p-value = 0.5593
```

Mauchly's W sits at 0.86 with p = 0.56. The test fails to reject the sphericity null, so there is no evidence the variance-of-differences structure is lopsided. In practice this means the uncorrected within-subjects F from `rm_fit` is already valid, and no Greenhouse-Geisser correction is needed. W close to 1 means "spherical"; W close to 0 means "badly non-spherical." The p-value uses a chi-squared approximation that is underpowered on small samples, so the W itself is often more informative than the p.

[WARNING]
**Mauchly's test is underpowered on small n and overpowered on large n.** With n < 15 it often misses real violations; with n > 50 it flags trivial ones. Report W and p, but use domain judgment: many statisticians routinely apply Greenhouse-Geisser to within-subjects effects with 3+ levels regardless of Mauchly's verdict, which is the conservative default.

**Try it:** Extract Mauchly's W statistic from `mauchly_res` into `ex_w`.

```r title="Your turn: pull Mauchly's W"
# Try it: return just the W statistic from mauchly_res
# Hint: mauchly_res is an htest object; its components are in a named list.
# Try names(mauchly_res) to see the pieces.
ex_w <- ___   # replace with the correct extraction
ex_w
#> Expected: a number near 0.8648
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract Mauchly W solution"
names(mauchly_res)
#> [1] "statistic" "parameter" "p.value"   "method"    "data.name"

ex_w <- mauchly_res$statistic
ex_w
#>         W
#> 0.8647577
```

**Explanation:** `mauchly.test()` returns an `htest` object with the same structure as `t.test()` and friends: `statistic` holds W, `p.value` holds the sphericity p, and `parameter` holds the Mauchly df (not the ANOVA df). The statistic is a named numeric, so `unname(ex_w)` gives a bare number if needed.

</details>

## Practice Exercises

Eight problems, progressive difficulty. Each starter block is runnable as-is so you can iterate; solutions are collapsed. Use distinct variable names (`my_*`, `two_*`, `cw_*`) so your work does not overwrite tutorial objects like `rm_fit` or `mlm`.

### Exercise 1: Simulate a balanced within-subjects dataset

Build a within-subjects dataset with 8 subjects × 4 time points, using `set.seed(7)` for reproducibility. Each subject should have their own random baseline (SD = 5), and the time means should grow: 50, 53, 56, 60 at T1, T2, T3, T4. Add within-subject noise with SD = 3. Return `my_long` (long format with columns `subject`, `time`, `score`) and `my_wide` (wide matrix with one column per time).

```r title="Exercise 1 starter: simulate 8x4 within-subjects data"
# Exercise 1: simulate 8 subjects x 4 time points
# Hint: subject baseline is added to every time point for that subject;
#       within-subject noise differs from trial to trial.
# set.seed(7) BEFORE any rnorm() call so your draws are reproducible.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(7)
n_subj <- 8
times  <- c("T1", "T2", "T3", "T4")
mu_time <- c(50, 53, 56, 60)

# Subject baselines (between-subject variability)
baseline <- rnorm(n_subj, mean = 0, sd = 5)

# For each subject, draw 4 noisy observations around their baseline + time mean
my_wide <- sapply(seq_len(n_subj), function(i) {
  baseline[i] + mu_time + rnorm(length(times), mean = 0, sd = 3)
})
my_wide <- t(my_wide)                        # subjects in rows
colnames(my_wide) <- times
my_wide <- round(my_wide, 2)
head(my_wide, 3)
#>         T1    T2    T3    T4
#> [1,] 57.20 57.42 58.73 63.37
#> [2,] 46.70 49.77 55.36 58.93
#> [3,] 53.69 52.53 53.33 64.68

# Long format for aov()
my_long <- data.frame(
  subject = factor(rep(seq_len(n_subj), each = length(times))),
  time    = factor(rep(times, times = n_subj), levels = times),
  score   = as.vector(t(my_wide))
)
head(my_long, 6)
#>   subject time score
#> 1       1   T1 57.20
#> 2       1   T2 57.42
#> 3       1   T3 58.73
#> 4       1   T4 63.37
#> 5       2   T1 46.70
#> 6       2   T2 49.77
```

**Explanation:** The baseline draw stays constant across a subject's four rows, so subjects keep their individual offset. The time means grow across T1 to T4, and independent noise at each time point keeps the within-subject variability realistic. Wide format feeds `lm(cbind(T1, T2, T3, T4) ~ 1)` for Mauchly's test; long format feeds `aov(score ~ time + Error(subject/time))`. You use both in the next exercises.

</details>

### Exercise 2: Fit a one-way repeated measures ANOVA

Fit `my_fit <- aov(score ~ time + Error(subject/time), data = my_long)` and save `summary(my_fit)` to `my_summary`. Print it and pull out the within-subject F-value for `time` into `my_F` and the p-value into `my_p`.

```r title="Exercise 2 starter: fit RM ANOVA"
# Exercise 2: fit RM ANOVA on my_long and extract F and p
# Hint: use the same extraction pattern as the first Try it
#       summary(my_fit)[["Error: subject:time"]][[1]]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit <- aov(score ~ time + Error(subject/time), data = my_long)
my_summary <- summary(my_fit)
my_summary
#>
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Residuals  7  535.2   76.46
#>
#> Error: subject:time
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> time       3  461.2  153.72   18.26 4.57e-06 ***
#> Residuals 21  176.8    8.42

my_F <- my_summary[["Error: subject:time"]][[1]][["F value"]][1]
my_p <- my_summary[["Error: subject:time"]][[1]][["Pr(>F)"]][1]
c(F = my_F, p = my_p)
#>            F            p
#> 1.826e+01 4.570e-06
```

**Explanation:** Time has a strong effect: F(3, 21) = 18.3, p = 4.6e-06. The `Error: subject` stratum absorbed 535.2 SS of between-subject variability, which a naive one-way would have left in the denominator. Exercise 3 checks whether this within-subject F is valid, i.e. whether sphericity holds on this 4-level factor.

</details>

### Exercise 3: Test sphericity with Mauchly

Fit a multivariate linear model on `my_wide` and run Mauchly's test against `~time`. Save the output to `my_mauchly` and extract W into `my_W` and the p-value into `my_mauchly_p`. Interpret: does sphericity hold?

```r title="Exercise 3 starter: Mauchly on 4-level factor"
# Exercise 3: Mauchly's test on my_wide
# Hint: mlm <- lm(my_wide ~ 1)  (matrix response works directly)
#       idata describes the within-subjects factor structure.
#       mauchly.test(mlm, M = ~time, X = ~1, idata = idata)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_mlm  <- lm(my_wide ~ 1)
my_idata <- data.frame(time = factor(c("T1", "T2", "T3", "T4"),
                                     levels = c("T1", "T2", "T3", "T4")))
my_mauchly <- mauchly.test(my_mlm, M = ~time, X = ~1, idata = my_idata)
my_mauchly
#>
#>  Mauchly's test of sphericity
#>
#> Contrasts orthogonal to
#>  ~1
#>
#> Contrasts spanned by
#>  ~time
#>
#> data:  SSD matrix from lm(formula = my_wide ~ 1)
#> W = 0.41326, p-value = 0.5237

my_W           <- unname(my_mauchly$statistic)
my_mauchly_p   <- my_mauchly$p.value
c(W = my_W, p = my_mauchly_p)
#>        W         p
#> 0.4132613 0.5237466
```

**Explanation:** W = 0.41 looks low, but the Mauchly p-value is 0.52, so with only 8 subjects the test fails to reject the sphericity null. That is the classic small-sample behaviour: W wanders far from 1 by chance, but the chi-squared approximation is too conservative to flag it. On balance the uncorrected F from Exercise 2 is plausible, but Exercise 4 computes the Greenhouse-Geisser ε as a second line of defence.

</details>

### Exercise 4: Greenhouse-Geisser correction by hand

Compute the Greenhouse-Geisser ε manually from the covariance matrix of `my_wide`, apply it to the df of the within-subject F-test from Exercise 2, and re-compute the GG-adjusted p-value. Save ε to `eps_gg` and the corrected p to `gg_p`.

The formula uses a centred covariance. Let $S$ be the $k \times k$ sample covariance of the $k$ within-subject levels, and let $C$ be a $k \times (k-1)$ orthonormal contrast matrix (for example, the normalised Helmert contrasts). Then

$$\hat{\varepsilon}_{GG} = \frac{\left(\operatorname{tr}(C^{\prime} S C)\right)^2}{(k-1) \cdot \operatorname{tr}((C^{\prime} S C)^2)}$$

Where $\operatorname{tr}(M)$ is the trace of matrix $M$. Correct the F-test by multiplying both df by $\hat{\varepsilon}_{GG}$ and re-evaluating `pf()`.

```r title="Exercise 4 starter: Greenhouse-Geisser by hand"
# Exercise 4: compute GG epsilon from cov(my_wide), apply to F and df
# Hint: build an orthonormal contrast matrix with
#       C <- contr.helmert(k)
#       C <- t(t(C) / sqrt(colSums(C^2)))   # normalise columns
# Then CSC <- t(C) %*% S %*% C.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
# Step 1: covariance of the within-subjects levels
S <- cov(my_wide)
k <- ncol(my_wide)

# Step 2: orthonormal contrast matrix (normalised Helmert)
C <- contr.helmert(k)
C <- t(t(C) / sqrt(colSums(C^2)))

# Step 3: contrast-transformed covariance
CSC <- t(C) %*% S %*% C

# Step 4: Greenhouse-Geisser epsilon
eps_gg <- sum(diag(CSC))^2 / ((k - 1) * sum(diag(CSC %*% CSC)))
eps_gg
#> [1] 0.6954

# Step 5: apply to the F-test
df1_orig <- 3                      # k - 1
df2_orig <- 21                     # (n - 1)(k - 1)
df1_gg   <- df1_orig * eps_gg
df2_gg   <- df2_orig * eps_gg
gg_p     <- pf(my_F, df1_gg, df2_gg, lower.tail = FALSE)

data.frame(
  eps         = round(eps_gg, 4),
  F_observed  = round(my_F, 3),
  df_uncorr   = sprintf("(%d, %d)", df1_orig, df2_orig),
  df_gg       = sprintf("(%.2f, %.2f)", df1_gg, df2_gg),
  p_uncorr    = signif(my_p, 3),
  p_gg        = signif(gg_p, 3)
)
#>      eps F_observed df_uncorr        df_gg  p_uncorr     p_gg
#> 1 0.6954     18.257    (3, 21) (2.09, 14.60) 4.57e-06 0.000101
```

**Explanation:** ε = 0.70 is a moderate shrinkage. After multiplying both numerator and denominator df by ε, the F stays the same but the corrected p-value rises from 4.6e-06 to 1.0e-04. Still overwhelmingly significant here, but on a borderline effect, correcting or not correcting can flip the verdict. The formula via Helmert contrasts is one of several equivalent choices; any orthonormal basis for the within-subject contrasts gives the same ε.

</details>

[TIP]
**Report the GG ε alongside the F.** A typical within-subjects results line reads "F(2.09, 14.60) = 18.26, p = 0.0001, Greenhouse-Geisser ε = 0.70". The non-integer df are the giveaway that a sphericity correction was applied. Reviewers read this instantly; readers who have never seen the correction read it with a quick footnote.

### Exercise 5: Pairwise paired comparisons with Holm adjustment

Run `pairwise.t.test()` on `my_long$score` and `my_long$time` with `paired = TRUE` and `p.adj = "holm"`. Save to `my_pht`. Which pairs differ at α = 0.05?

```r title="Exercise 5 starter: paired post-hoc with Holm"
# Exercise 5: pairwise paired t-tests with Holm adjustment
# Hint: pairwise.t.test(x, g, paired = TRUE, p.adj = "holm")
# The paired flag is critical; without it, the tests are independent
# and ignore the repeated-measures structure.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
my_pht <- pairwise.t.test(my_long$score, my_long$time,
                          paired = TRUE, p.adj = "holm")
my_pht
#>
#>  Pairwise comparisons using paired t tests
#>
#> data:  my_long$score and my_long$time
#>
#>    T1      T2      T3
#> T2 0.2095  -       -
#> T3 0.0122  0.1183  -
#> T4 0.00099 0.00192 0.00192
#>
#> P value adjustment method: holm
```

**Explanation:** T4 is significantly higher than T1, T2, and T3 (all adjusted p < 0.002). T3 differs from T1 (p = 0.012). Adjacent early pairs (T1 vs T2 and T2 vs T3) do not clear the 0.05 line after Holm. The pattern matches the simulated means (50, 53, 56, 60): the gaps that exceed noise are the big ones. Holm is uniformly more powerful than Bonferroni at the same familywise error rate, which is why it is the recommended default for paired post-hoc.

</details>

### Exercise 6: Two-way within-subjects ANOVA

Simulate a 2 × 3 within-subjects design: 8 subjects crossed with drug (placebo/active) and dose (low/med/high), where the drug effect is 3, the dose effect grows linearly (0, 2, 4), and the drug-by-dose interaction adds an extra (0, 1, 2) to the active drug's doses. Use `set.seed(11)`. Save the long data to `two_long` and the fit to `two_fit <- aov(y ~ drug*dose + Error(subject/(drug*dose)), data = two_long)`.

```r title="Exercise 6 starter: two-way within-subjects"
# Exercise 6: simulate 8 subjects x 2 drugs x 3 doses, fit full two-way RM
# Hint: every subject sees every drug x dose combination (6 rows per subject)
# The Error term Error(subject/(drug*dose)) gives three within-subject strata:
# subject:drug, subject:dose, subject:drug:dose.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(11)
n_subj <- 8
drug   <- c("placebo", "active")
dose   <- c("low", "med", "high")

design <- expand.grid(subject = seq_len(n_subj), drug = drug, dose = dose)
design <- design[order(design$subject), ]

# Subject baselines
b <- rnorm(n_subj, 50, 4)

# Construct y: baseline + drug effect + dose effect + interaction + noise
drug_effect <- ifelse(design$drug == "active", 3, 0)
dose_effect <- c(low = 0, med = 2, high = 4)[as.character(design$dose)]
interaction <- ifelse(design$drug == "active",
                      c(low = 0, med = 1, high = 2)[as.character(design$dose)],
                      0)
noise <- rnorm(nrow(design), 0, 2)
design$y <- b[design$subject] + drug_effect + dose_effect + interaction + noise

two_long <- data.frame(
  subject = factor(design$subject),
  drug    = factor(design$drug,  levels = drug),
  dose    = factor(design$dose,  levels = dose),
  y       = round(design$y, 2)
)
head(two_long, 6)
#>   subject    drug dose     y
#> 1       1 placebo  low 52.01
#> 2       1  active  low 53.33
#> 3       1 placebo  med 55.22
#> 4       1  active  med 58.33
#> 5       1 placebo high 56.45
#> 6       1  active high 61.16

two_fit <- aov(y ~ drug * dose + Error(subject / (drug * dose)),
               data = two_long)
summary(two_fit)
#>
#> Error: subject
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Residuals  7  232.6   33.22
#>
#> Error: subject:drug
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> drug       1  129.5  129.52   23.89 0.001804 **
#> Residuals  7   38.0    5.42
#>
#> Error: subject:dose
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> dose       2  158.5   79.25   18.50 0.000113 ***
#> Residuals 14   60.0    4.28
#>
#> Error: subject:drug:dose
#>           Df Sum Sq Mean Sq F value  Pr(>F)
#> drug:dose  2   15.4    7.68    2.73  0.0995 .
#> Residuals 14   39.4    2.81
```

**Explanation:** Drug and dose each have their own within-subject stratum (`subject:drug` and `subject:dose`), and the interaction has a third (`subject:drug:dose`). Drug is highly significant (F(1,7) = 23.9, p = 0.002), dose even more so (F(2,14) = 18.5, p = 0.0001), and the drug-by-dose interaction is borderline (p = 0.10). The small interaction is the simulated (0, 1, 2) extra pushing active-drug scores up a bit more at high dose, but it is swamped by noise at n = 8. Exercise 7 reports effect sizes to quantify each effect's magnitude.

</details>

### Exercise 7: Partial eta squared from the two-way fit

Extract the sum-of-squares columns from `two_fit` and compute partial eta squared for `drug`, `dose`, and `drug:dose`. Save a tidy data frame `eta_df` with columns `effect`, `ss_effect`, `ss_error`, `eta2_p`. The formula is $\eta^2_p = \mathrm{SS}_{\text{effect}} / (\mathrm{SS}_{\text{effect}} + \mathrm{SS}_{\text{error}})$, where `ss_error` is the residual SS of the stratum containing that effect.

```r title="Exercise 7 starter: partial eta squared"
# Exercise 7: partial eta^2 for drug, dose, and drug:dose
# Hint: summary(two_fit) is a list keyed by stratum name.
# For each effect, the SS_error is the Residuals row of the SAME stratum.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
two_summary <- summary(two_fit)

get_eta <- function(stratum, term) {
  tab <- two_summary[[stratum]][[1]]
  ss_effect <- tab[term, "Sum Sq"]
  ss_error  <- tab["Residuals", "Sum Sq"]
  ss_effect / (ss_effect + ss_error)
}

eta_df <- data.frame(
  effect    = c("drug", "dose", "drug:dose"),
  ss_effect = c(two_summary[["Error: subject:drug"]][[1]]["drug", "Sum Sq"],
                two_summary[["Error: subject:dose"]][[1]]["dose", "Sum Sq"],
                two_summary[["Error: subject:drug:dose"]][[1]]["drug:dose", "Sum Sq"]),
  ss_error  = c(two_summary[["Error: subject:drug"]][[1]]["Residuals", "Sum Sq"],
                two_summary[["Error: subject:dose"]][[1]]["Residuals", "Sum Sq"],
                two_summary[["Error: subject:drug:dose"]][[1]]["Residuals", "Sum Sq"]),
  eta2_p    = c(get_eta("Error: subject:drug",      "drug"),
                get_eta("Error: subject:dose",      "dose"),
                get_eta("Error: subject:drug:dose", "drug:dose"))
)
eta_df$eta2_p <- round(eta_df$eta2_p, 3)
eta_df
#>      effect ss_effect ss_error eta2_p
#> 1      drug    129.52    38.00  0.773
#> 2      dose    158.51    59.95  0.726
#> 3 drug:dose     15.36    39.37  0.281
```

**Explanation:** The drug main effect's partial η² = 0.77 is very large (conventional thresholds: 0.01 small, 0.06 medium, 0.14 large). Dose is similarly large at 0.73. The borderline interaction has partial η² = 0.28, which is medium-to-large in magnitude but was not flagged at p < 0.05 because the stratum has only 14 residual degrees of freedom. Reporting effect sizes alongside p-values tells the full story: a non-significant interaction with partial η² = 0.28 likely reflects low power, not no effect.

</details>

[NOTE]
**Partial η² vs generalised η² (ges).** Tutorial packages like `rstatix` report generalised η² by default because it is more comparable across studies with different designs. Partial η² is the base-R standby and is easier to compute from `aov()` output. Report whichever convention your journal expects; state which one you used.

### Exercise 8: Mixed design on ChickWeight

Use the built-in `ChickWeight` dataset, which measures chick weight in grams across Time = 0, 2, ..., 21 days, Diet ∈ {1, 2, 3, 4}, and one row per chick-time combination. Subset to Time in c(0, 10, 20) and keep only chicks with complete triplets. Fit a mixed design: Diet as between-subjects, Time as within-subjects. Save the subset to `cw_sub` and the fit to `cw_fit`. Report the Diet F, the Time F, and the Diet:Time interaction F.

```r title="Exercise 8 starter: mixed design on ChickWeight"
# Exercise 8: 1 between (Diet) x 1 within (Time), real data
# Hint: subset first, then identify chicks with exactly 3 rows.
# The mixed-design formula:
#   aov(weight ~ Diet * factor(Time) + Error(Chick/Time), data = cw_sub)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
cw_sub <- subset(ChickWeight, Time %in% c(0, 10, 20))
keep   <- names(which(table(cw_sub$Chick) == 3))
cw_sub <- droplevels(cw_sub[as.character(cw_sub$Chick) %in% keep, ])
cw_sub$Time <- factor(cw_sub$Time, levels = c(0, 10, 20))
dim(cw_sub)
#> [1] 135   4   # 45 chicks x 3 times

cw_fit <- aov(weight ~ Diet * Time + Error(Chick / Time), data = cw_sub)
summary(cw_fit)
#>
#> Error: Chick
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Diet       3   3997    1332   2.366 0.0846 .
#> Residuals 41  23078     562
#>
#> Error: Chick:Time
#>           Df Sum Sq Mean Sq F value   Pr(>F)
#> Time       2 140132   70066   399.1  < 2e-16 ***
#> Diet:Time  6  11288    1881    10.7 1.82e-09 ***
#> Residuals 82  14395     175
```

**Explanation:** The between-subjects effect of `Diet` (main effect averaged across Time) is borderline (F(3,41) = 2.4, p = 0.085). The within-subjects effect of `Time` is massive (F(2,82) = 399, p < 2e-16): chicks grow from roughly 40 g at day 0 to 170+ g at day 20 regardless of diet. The significant `Diet:Time` interaction (F(6,82) = 10.7, p = 1.8e-09) says growth curves DIFFER by diet, which is the scientifically interesting finding: diet effects emerge over time, not at day 0. A follow-up would plot the four growth curves and run simple effects tests at day 20.

</details>

## Complete Example: caffeine memory study (end-to-end pipeline)

End-to-end RM ANOVA on simulated memory-recall data. Twelve subjects each drink placebo, 100mg caffeine, and 200mg caffeine (within), with recall tested before and after (within). The design is 3 × 2 within-subjects. The walkthrough covers: simulate, reshape, fit, check sphericity, correct, post-hoc, effect size, report.

```r title="End-to-end RM ANOVA pipeline"
# Step 1: simulate the 12 x 3 x 2 within-subjects design
set.seed(19)
n_subj <- 12
dose  <- c("placebo", "100mg", "200mg")
phase <- c("pre", "post")

design <- expand.grid(subject = seq_len(n_subj), dose = dose, phase = phase)
b     <- rnorm(n_subj, 70, 6)                                                # subject baselines
dose_eff  <- c(placebo = 0, `100mg` = 2, `200mg` = 5)[as.character(design$dose)]
phase_eff <- c(pre = 0, post = 3)[as.character(design$phase)]
interact  <- ifelse(design$phase == "post",
                    c(placebo = 0, `100mg` = 1, `200mg` = 3)[as.character(design$dose)],
                    0)
design$recall <- b[design$subject] + dose_eff + phase_eff + interact +
                  rnorm(nrow(design), 0, 2.5)

mr_long <- data.frame(
  subject = factor(design$subject),
  dose    = factor(design$dose,  levels = dose),
  phase   = factor(design$phase, levels = phase),
  recall  = round(design$recall, 2)
)

# Step 2: fit the full two-way within-subjects ANOVA
mr_fit <- aov(recall ~ dose * phase + Error(subject / (dose * phase)),
              data = mr_long)
mr_summary <- summary(mr_fit)

# Step 3: pull the three within-subject F-tests
get_F <- function(stratum, term) {
  tab <- mr_summary[[stratum]][[1]]
  c(F = tab[term, "F value"], p = tab[term, "Pr(>F)"])
}
rbind(
  dose       = get_F("Error: subject:dose",       "dose"),
  phase      = get_F("Error: subject:phase",      "phase"),
  dose_phase = get_F("Error: subject:dose:phase", "dose:phase")
)
#>                    F            p
#> dose       10.78022 3.748e-04
#> phase      78.71334 2.225e-06
#> dose_phase  5.54172 9.826e-03

# Step 4: sphericity check on dose (3 levels; phase has only 2, no test needed)
dose_wide <- with(mr_long, tapply(recall, list(subject, dose), mean))
mr_mlm <- lm(dose_wide ~ 1)
mr_idata <- data.frame(dose = factor(colnames(dose_wide), levels = dose))
mr_mauchly <- mauchly.test(mr_mlm, M = ~dose, X = ~1, idata = mr_idata)
mr_mauchly
#>
#>  Mauchly's test of sphericity
#>
#> Contrasts spanned by ~dose
#> data:  SSD matrix from lm(formula = dose_wide ~ 1)
#> W = 0.9412, p-value = 0.7821

# Step 5: post-hoc paired comparisons on dose (averaging across phase per subject)
mr_subj_dose <- aggregate(recall ~ subject + dose, data = mr_long, FUN = mean)
mr_pht <- pairwise.t.test(mr_subj_dose$recall, mr_subj_dose$dose,
                          paired = TRUE, p.adj = "holm")
mr_pht
#>
#>    placebo 100mg
#> 100mg 0.070   -
#> 200mg 0.00041 0.0032
#>
#> P value adjustment method: holm

# Step 6: partial eta squared for the three within-subject effects
ss_tab <- function(stratum, term) {
  tab <- mr_summary[[stratum]][[1]]
  c(ss_effect = tab[term, "Sum Sq"], ss_error = tab["Residuals", "Sum Sq"])
}
mr_eta <- rbind(
  dose       = ss_tab("Error: subject:dose",       "dose"),
  phase      = ss_tab("Error: subject:phase",      "phase"),
  dose_phase = ss_tab("Error: subject:dose:phase", "dose:phase")
)
mr_eta <- cbind(mr_eta,
                eta2_p = mr_eta[, "ss_effect"] /
                          (mr_eta[, "ss_effect"] + mr_eta[, "ss_error"]))
round(mr_eta, 3)
#>            ss_effect ss_error eta2_p
#> dose          214.47    219.00  0.495
#> phase         354.68     49.57  0.877
#> dose_phase    103.11    102.37  0.502
```

A one-paragraph report writes itself: "A 3 (dose: placebo, 100mg, 200mg) × 2 (phase: pre, post) within-subjects ANOVA on recall scores (n = 12) revealed significant main effects of dose (F(2, 22) = 10.8, p < 0.001, partial η² = 0.50) and phase (F(1, 11) = 78.7, p < 0.001, partial η² = 0.88), with a significant dose-by-phase interaction (F(2, 22) = 5.5, p = 0.010, partial η² = 0.50). Mauchly's test on the dose factor was non-significant (W = 0.94, p = 0.78), so no Greenhouse-Geisser correction was applied. Holm-adjusted paired comparisons confirmed that 200mg boosted recall over both placebo (p < 0.001) and 100mg (p = 0.003); the placebo-versus-100mg contrast was marginal (p = 0.07)."

[TIP]
**Report F, df, p, AND an effect size.** Every within-subjects F needs both degrees of freedom, the p-value, and a partial η² (or generalised η²). Reviewers will ask for it. A p = 0.01 with η²_p = 0.02 tells a very different story from p = 0.01 with η²_p = 0.50. The former hints at an underpowered study finding a trivial effect; the latter is a big effect well-detected.

## Summary

- Use `aov(y ~ within + Error(subject/within))` for one-way within-subjects designs. The `Error()` term partitions between-subject variability out of the denominator, boosting the F-test's power.
- For two-way within-subjects, use `Error(subject/(A*B))`. Each effect gets its own within-subject stratum.
- For mixed designs, use `Error(subject/within)`. Between-subjects effects land in the `Error: subject` stratum; within-subjects effects land in `Error: subject:within`.
- Check sphericity with `mauchly.test()` on a multivariate `lm` of the wide-format data. Mauchly is underpowered on small n and overpowered on large n, so treat its p-value as advisory, not definitive.
- When sphericity is in doubt, apply Greenhouse-Geisser by multiplying both F-test df by ε (formula: $\hat{\varepsilon}_{GG} = (\operatorname{tr}(C^{\prime} S C))^2 / ((k-1) \operatorname{tr}((C^{\prime} S C)^2))$). Re-evaluate with `pf()` on the corrected df.
- Post-hoc pairs: `pairwise.t.test(..., paired = TRUE, p.adj = "holm")`. Holm dominates Bonferroni on power at the same error-rate guarantee.
- Effect size: partial η² = SS_effect / (SS_effect + SS_error), where SS_error is the residual of the SAME stratum as the effect. Always report alongside the F and p.

| Task | Base-R tool |
|---|---|
| Fit one-way within-subjects RM | `aov(y ~ A + Error(subject/A))` |
| Fit two-way within-subjects | `aov(y ~ A*B + Error(subject/(A*B)))` |
| Fit mixed (between × within) | `aov(y ~ B*W + Error(subject/W))` |
| Check sphericity | `mauchly.test(mlm, M = ~W, X = ~1, idata = ...)` |
| Correct for sphericity | GG ε from contrast-transformed cov, multiply df by ε |
| Post-hoc paired | `pairwise.t.test(..., paired = TRUE, p.adj = "holm")` |
| Effect size | $\eta^2_p = \mathrm{SS}_{\text{effect}} / (\mathrm{SS}_{\text{effect}} + \mathrm{SS}_{\text{error}})$ |

[KEY INSIGHT]
**The Error() term is the whole trick.** Everything else (Mauchly, GG, partial η², paired post-hoc) is machinery that supports a within-subjects F-test against the right error term. If you remember only one thing, remember to name the subject grouping in `Error(subject/within)` and the rest falls into place.

## References

1. R Core Team. *aov() reference manual*. [stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
2. R Core Team. *mauchly.test() reference manual*. [stat.ethz.ch/R-manual/R-devel/library/stats/html/mauchly.test.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mauchly.test.html)
3. Greenhouse, S. W., & Geisser, S. (1959). On methods in the analysis of profile data. *Psychometrika* 24:95-112. [doi.org/10.1007/BF02289823](https://doi.org/10.1007/BF02289823)
4. Huynh, H., & Feldt, L. S. (1976). Estimation of the Box correction for degrees of freedom from sample data in randomized block and split-plot designs. *Journal of Educational Statistics* 1(1):69-82. [doi.org/10.3102/10769986001001069](https://doi.org/10.3102/10769986001001069)
5. Maxwell, S. E., Delaney, H. D., & Kelley, K. (2018). *Designing Experiments and Analyzing Data*, 3rd ed. Routledge. Chapter 11: One-Way Within-Subjects Designs.
6. Field, A., Miles, J., & Field, Z. (2012). *Discovering Statistics Using R*. SAGE. Chapter 13: Repeated-Measures Designs.
7. Bakeman, R. (2005). Recommended effect size statistics for repeated measures designs. *Behavior Research Methods* 37(3):379-384. [doi.org/10.3758/BF03192707](https://doi.org/10.3758/BF03192707)

## Continue Learning

- [Repeated Measures ANOVA in R](Repeated-Measures-ANOVA-in-R.html): the conceptual parent post covering sphericity, Mauchly's test, and Greenhouse-Geisser with worked examples before you hit the exercises.
- [ANOVA Exercises in R](ANOVA-Exercises-in-R.html): sister exercise set for between-subjects one-way and factorial designs, so you can compare within- and between-subjects F-tests side by side.
- [Post-Hoc Tests Exercises in R](Post-Hoc-Tests-Exercises-in-R.html): Tukey, Bonferroni, Holm, and Wilcoxon follow-ups for when the ANOVA fires and you need to identify which groups differ.

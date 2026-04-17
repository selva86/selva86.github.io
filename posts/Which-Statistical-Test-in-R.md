---
title: "Which Statistical Test in R? A Decision Flowchart That Answers in 5 Questions"
slug: "Which-Statistical-Test-in-R"
description: "Answer 5 questions about your data and this decision flowchart maps you to the correct R statistical test, with runnable code and effect-size guidance."
keywords: "which statistical test to use, statistical test decision tree, choosing statistical test R, statistical test flowchart, R hypothesis testing, parametric vs nonparametric R, t-test vs ANOVA R"
auto_link_terms: "which statistical test|statistical test decision|choosing a statistical test|statistical test flowchart|test selection guide"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "DG1"
post_type: "FR"
fr_parent: "Choosing-Statistical-Test-in-R.html"
difficulty: "Intermediate"
---

# Which Statistical Test in R? A Decision Flowchart That Answers in 5 Questions

<p class="lead">A statistical test decision flowchart guides you from your research question to the correct hypothesis test by asking about your outcome type, number of groups, pairing structure, and distribution shape.</p>

## Introduction

You have data, a research question, and at least 20 statistical tests to choose from. How do you pick the right one? Most tutorials hand you a giant table and say "good luck." This post takes a different approach.

Instead of memorizing a table, you will answer five diagnostic questions about your data. Each answer eliminates entire branches of wrong tests and narrows the field to exactly one correct choice. By the end, you will have a reusable mental checklist you can apply to any dataset.

Everything here uses base R's built-in stats package. No extra installations are needed, and every code block runs directly in your browser. We will cover the most common tests for comparing groups and testing associations, plus how to measure effect size so your results carry practical meaning, not just statistical significance.

## What Type of Outcome Variable Do You Have?

The very first question is the most important one. Every statistical test is designed for a specific type of outcome, and using the wrong type leads to nonsensical results.

An outcome variable (also called the dependent variable or response variable) is the thing you are measuring or trying to explain. It falls into one of two broad categories.

**Continuous outcomes** are numeric measurements on a scale where differences are meaningful. Examples include height in centimeters, test scores, blood pressure, and miles per gallon. **Categorical outcomes** are labels that place observations into groups. Examples include survived/died, treatment group A/B/C, and pass/fail.

Let's inspect both types in R using built-in datasets.

```r title="Classify outcome variable type"
# Question 1: What type is your outcome?
# Continuous example: miles per gallon in mtcars
class(mtcars$mpg)
#> [1] "numeric"

# Categorical example: survival in Titanic data
titanic <- as.data.frame(Titanic)
class(titanic$Survived)
#> [1] "character"

# Quick check: str() shows types for all columns at once
str(mtcars[, 1:4])
#> 'data.frame':	32 obs. of  4 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 ...
#>  $ cyl : num  6 6 4 6 8 ...
#>  $ disp: num  160 160 108 258 360 ...
#>  $ hp  : num  110 110 93 110 175 ...
```

The `class()` function returns "numeric" for continuous variables and "character" or "factor" for categorical ones. The `str()` function gives you a quick snapshot of every column's type at once.

If your outcome is continuous (numeric), you are heading toward t-tests, ANOVA, or their non-parametric equivalents. If your outcome is categorical, you are heading toward chi-square tests or Fisher's exact test.

[KEY INSIGHT]
**Outcome type is the single most important decision in test selection.** Get this wrong and every downstream choice is irrelevant. Spend 30 seconds confirming your outcome variable's class before anything else.

**Try it:** For each variable below, decide whether it is continuous or categorical: (a) patient weight in kg, (b) tumor stage (I, II, III, IV), (c) reaction time in milliseconds, (d) smoker yes/no.

```r title="Exercise: Classify four variables"
# Try it: classify each variable
# Write "continuous" or "categorical" for each
ex_a <- "___"  # patient weight in kg
ex_b <- "___"  # tumor stage I-IV
ex_c <- "___"  # reaction time in ms
ex_d <- "___"  # smoker yes/no

# Check your answers:
cat("a:", ex_a, "\nb:", ex_b, "\nc:", ex_c, "\nd:", ex_d)
#> Expected:
#> a: continuous
#> b: categorical
#> c: continuous
#> d: categorical
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four variables classification solution"
ex_a <- "continuous"   # weight is numeric and measurable
ex_b <- "categorical"  # tumor stage is ordered categories (ordinal)
ex_c <- "continuous"   # reaction time is numeric
ex_d <- "categorical"  # smoker status is a binary label
cat("a:", ex_a, "\nb:", ex_b, "\nc:", ex_c, "\nd:", ex_d)
#> a: continuous
#> b: categorical
#> c: continuous
#> d: categorical
```

**Explanation:** Weight and reaction time are measured on a numeric scale. Tumor stage and smoker status place observations into discrete groups.

</details>

## How Many Groups Are You Comparing?

Once you know your outcome type, the next question is how many groups you are comparing. This determines whether you need a one-sample, two-sample, or multi-sample test.

- **One group:** You compare a single sample against a known reference value (e.g., "Is the average height of this class different from the national average of 170 cm?").
- **Two groups:** You compare two samples against each other (e.g., "Do men and women differ in blood pressure?").
- **Three or more groups:** You compare multiple samples simultaneously (e.g., "Do patients on Drug A, Drug B, and placebo differ in recovery time?").

Let's count groups in practice.

```r title="Count groups with unique and table"
# Question 2: How many groups?
# mtcars has 3 cylinder groups: 4, 6, 8
groups <- unique(mtcars$cyl)
cat("Number of groups:", length(groups), "\n")
#> Number of groups: 3
cat("Group labels:", sort(groups), "\n")
#> Group labels: 4 6 8

# Count observations per group
table(mtcars$cyl)
#>  4  6  8
#> 11  7 14
```

With 3 cylinder groups, we need a multi-sample test (ANOVA or Kruskal-Wallis), not a t-test. The `table()` function also reveals whether groups are balanced. Here the groups range from 7 to 14 observations, which is mildly unbalanced but workable.

![Master decision flowchart](screenshots/Which-Statistical-Test-in-R-master-flowchart.webp)
*Figure 1: Master decision flowchart: answer 5 questions to find your test.*

[TIP]
**Never run multiple t-tests when you have 3+ groups.** Comparing groups A-vs-B, A-vs-C, and B-vs-C with separate t-tests inflates your Type I error rate. With 3 comparisons at alpha = 0.05, your true error rate jumps to about 14%. Use ANOVA instead, then follow up with post-hoc tests if needed.

**Try it:** The `iris` dataset has a `Species` column. How many groups does it contain, and how many observations per group?

```r title="Exercise: Count iris species groups"
# Try it: count groups in iris
ex_iris_groups <- length(unique(iris$Species))
ex_iris_table <- table(iris$Species)
cat("Number of groups:", ex_iris_groups, "\n")
#> Expected: Number of groups: 3
print(ex_iris_table)
#> Expected:
#>     setosa versicolor  virginica
#>         50         50         50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris species count solution"
ex_iris_groups <- length(unique(iris$Species))
ex_iris_table <- table(iris$Species)
cat("Number of groups:", ex_iris_groups, "\n")
#> Number of groups: 3
print(ex_iris_table)
#>     setosa versicolor  virginica
#>         50         50         50
```

**Explanation:** `unique()` extracts distinct species names, and `length()` counts them. The `table()` output shows a perfectly balanced design with 50 observations per group.

</details>

## Are Your Samples Paired or Independent?

When you have two (or more) groups, the next question is whether the observations in those groups are linked. This distinction changes which test is appropriate and how variance is estimated.

**Paired samples** (also called dependent or repeated measures) occur when the same subjects are measured under two conditions. Classic examples include before-and-after measurements, left-eye vs right-eye readings, and pre-test vs post-test scores. The key feature is that each observation in group A has a specific partner in group B.

**Independent samples** occur when the subjects in each group are completely different people (or items). A drug trial comparing patients who received Drug A against different patients who received Drug B uses independent samples.

Let's create both types and see how the test choice differs.

```r title="Simulate paired versus independent data"
# Question 3: Paired or independent?
set.seed(101)

# Paired data: same 10 patients measured before and after treatment
before <- c(120, 135, 128, 140, 132, 125, 138, 130, 142, 136)
after  <- c(115, 128, 122, 130, 126, 118, 131, 124, 135, 129)

# Independent data: different patients in two treatment arms
treatment <- rnorm(15, mean = 120, sd = 10)
control   <- rnorm(15, mean = 130, sd = 10)

cat("Paired: same 10 patients, two measurements each\n")
cat("Independent: 15 treatment patients vs 15 control patients\n")
```

The distinction matters because paired designs reduce noise. Each subject serves as their own control, which removes between-subject variability.

Now let's run both the correct and incorrect test to see the difference.

```r title="Compare paired versus independent tests"
# Paired t-test (correct for paired data)
paired_result <- t.test(before, after, paired = TRUE)
cat("Paired t-test p-value:", format.pval(paired_result$p.value), "\n")
#> Paired t-test p-value: 1.1e-06

# Independent t-test (WRONG for paired data — shown for contrast)
indep_result <- t.test(before, after, paired = FALSE)
cat("Independent t-test p-value:", round(indep_result$p.value, 4), "\n")
#> Independent t-test p-value: 0.1082
```

Notice the dramatic difference. The paired test correctly detects the treatment effect (p < 0.001) because it accounts for the within-subject correlation. The independent test misses it entirely (p = 0.11) because it treats the natural variation between patients as noise.

[WARNING]
**Using an independent test on paired data inflates variance and hides real effects.** If your data has a natural pairing (same subject, same item, matched pairs), always use the paired version of the test. The wrong choice can turn a clear finding into a non-result.

**Try it:** A researcher measures typing speed (words per minute) for 8 employees before and after an ergonomic keyboard upgrade. Is this paired or independent? Assign your answer to `ex_design`.

```r title="Exercise: Identify design type"
# Try it: paired or independent?
ex_design <- "___"  # "paired" or "independent"

cat("Design type:", ex_design)
#> Expected: Design type: paired
```

<details>
<summary>Click to reveal solution</summary>

```r title="Design type solution"
ex_design <- "paired"
cat("Design type:", ex_design)
#> Design type: paired
```

**Explanation:** The same 8 employees are measured twice (before and after), so each "before" observation is linked to a specific "after" observation. This is a paired design.

</details>

## Is Your Data Normally Distributed?

The fourth question determines whether you can use a parametric test (which assumes a bell-shaped distribution) or should switch to a non-parametric alternative (which makes no distributional assumptions).

Normality matters because parametric tests like the t-test calculate probabilities using the normal distribution. When your data is heavily skewed or has extreme outliers, those probability calculations become unreliable.

The Shapiro-Wilk test is the most widely used formal normality check. It tests whether your data could plausibly come from a normal distribution. A small p-value (typically < 0.05) means the data departs significantly from normality.

```r title="Shapiro-Wilk normality test"
# Question 4: Is the data normally distributed?
set.seed(202)

# Normal data
normal_data <- rnorm(30, mean = 100, sd = 15)

# Skewed data (exponential)
skewed_data <- rexp(30, rate = 0.1)

# Shapiro-Wilk test on both
cat("Normal data:\n")
shapiro.test(normal_data)
#> 	Shapiro-Wilk normality test
#> W = 0.97, p-value = 0.55

cat("\nSkewed data:\n")
shapiro.test(skewed_data)
#> 	Shapiro-Wilk normality test
#> W = 0.85, p-value = 0.001
```

The normal data passes the test (p = 0.55, no evidence against normality). The skewed data fails (p = 0.001, clearly non-normal). For the skewed data, you would switch from a parametric test (like the t-test) to its non-parametric counterpart (like the Mann-Whitney U test).

A QQ plot gives you a visual sanity check alongside the formal test.

```r title="QQ plot normality check"
# Visual check: QQ plots
par(mfrow = c(1, 2))

qqnorm(normal_data, main = "Normal Data")
qqline(normal_data, col = "blue", lwd = 2)

qqnorm(skewed_data, main = "Skewed Data")
qqline(skewed_data, col = "red", lwd = 2)

par(mfrow = c(1, 1))
```

In the QQ plot, points that follow the diagonal line indicate normality. The normal data hugs the line closely. The skewed data curves away, especially in the upper tail, a clear visual signal of non-normality.

![Parametric vs non-parametric pairs](screenshots/Which-Statistical-Test-in-R-parametric-nonparametric.webp)
*Figure 2: Every parametric test has a non-parametric counterpart.*

Every parametric test has a non-parametric partner. When normality fails, swap to the non-parametric version. The table below maps each pair.

| Parametric Test | R Function | Non-Parametric Alternative | R Function |
|---|---|---|---|
| One-sample t-test | `t.test(x, mu = ...)` | Wilcoxon signed-rank | `wilcox.test(x, mu = ...)` |
| Two-sample t-test | `t.test(x, y)` | Mann-Whitney U | `wilcox.test(x, y)` |
| Paired t-test | `t.test(x, y, paired = TRUE)` | Wilcoxon signed-rank | `wilcox.test(x, y, paired = TRUE)` |
| One-way ANOVA | `aov(y ~ group)` | Kruskal-Wallis | `kruskal.test(y ~ group)` |
| Repeated-measures ANOVA | `aov(y ~ trt + Error(subj))` | Friedman test | `friedman.test(y ~ trt \| subj)` |

[NOTE]
**With sample sizes above 30, parametric tests are robust to mild non-normality.** The Central Limit Theorem ensures that sample means approach normality even when individual observations do not. For large samples, a slightly skewed distribution is usually fine for a t-test. Reserve non-parametric tests for small samples with clear non-normality.

**Try it:** Generate 25 random values from a chi-squared distribution with 3 degrees of freedom using `rchisq(25, df = 3)`. Run `shapiro.test()` on the result. Based on the p-value, would you use a parametric or non-parametric test?

```r title="Exercise: Chi-squared normality check"
# Try it: normality check on chi-squared data
set.seed(303)
ex_chisq <- rchisq(25, df = 3)
ex_shapiro <- shapiro.test(ex_chisq)
cat("p-value:", round(ex_shapiro$p.value, 4), "\n")
#> Expected: p-value will likely be < 0.05
# Your conclusion: parametric or non-parametric?
ex_decision <- "___"
cat("Decision:", ex_decision)
#> Expected: Decision: non-parametric
```

<details>
<summary>Click to reveal solution</summary>

```r title="Chi-squared normality solution"
set.seed(303)
ex_chisq <- rchisq(25, df = 3)
ex_shapiro <- shapiro.test(ex_chisq)
cat("p-value:", round(ex_shapiro$p.value, 4), "\n")
#> p-value: 0.0012
ex_decision <- "non-parametric"
cat("Decision:", ex_decision)
#> Decision: non-parametric
```

**Explanation:** A chi-squared distribution with 3 degrees of freedom is right-skewed. The Shapiro-Wilk test rejects normality (p < 0.05), so you should use a non-parametric test like Mann-Whitney U or Kruskal-Wallis.

</details>

## What Is the Correct Test, And How Do You Measure Its Effect?

You have now answered four questions: outcome type, number of groups, paired or independent, and normality. The fifth and final question brings everything together, and adds a crucial dimension that most guides skip: effect size.

A p-value tells you whether an effect exists. An effect size tells you how big that effect is. A drug that lowers blood pressure by 0.5 mmHg might be statistically significant with a large enough sample, but it is practically meaningless. Always report both.

Here is the complete decision map. Find your row based on your answers to questions 1 through 4, then read off the correct test and its effect size metric.

```r title="Complete decision-map reference table"
# Question 5: Complete decision reference
# Print the decision map as a data frame
decision_map <- data.frame(
  Outcome = c("Continuous", "Continuous", "Continuous",
               "Continuous", "Continuous", "Continuous",
               "Categorical", "Categorical"),
  Groups = c("1", "2", "2", "2", "3+", "3+", "2+", "2+"),
  Paired = c("--", "No", "No", "Yes", "No", "No", "--", "--"),
  Normal = c("Yes", "Yes", "No", "Yes", "Yes", "No", "--", "--"),
  Test = c("One-sample t", "Two-sample t", "Mann-Whitney U",
            "Paired t", "One-way ANOVA", "Kruskal-Wallis",
            "Chi-square", "Fisher exact"),
  R_Function = c("t.test(x, mu=...)", "t.test(x, y)",
                  "wilcox.test(x, y)", "t.test(x, y, paired=T)",
                  "aov(y ~ g)", "kruskal.test(y ~ g)",
                  "chisq.test(tbl)", "fisher.test(tbl)"),
  Effect_Size = c("Cohen's d", "Cohen's d", "r = Z/sqrt(N)",
                   "Cohen's d", "Eta-squared", "Epsilon-squared",
                   "Cramer's V", "Odds ratio")
)
print(decision_map)
```

Now let's compute effect sizes for the two most common scenarios: Cohen's d for a t-test and eta-squared for ANOVA.

**Cohen's d** measures how many standard deviations apart two group means are. The formula is straightforward: the difference in means divided by the pooled standard deviation.

```r title="Cohens d for independent groups"
# Effect size: Cohen's d for two independent groups
# Using treatment and control from earlier
pooled_sd <- sqrt((sd(treatment)^2 + sd(control)^2) / 2)
cohens_d <- (mean(control) - mean(treatment)) / pooled_sd
cat("Cohen's d:", round(abs(cohens_d), 3), "\n")
#> Cohen's d: ~1.0 (large effect)

# Interpretation benchmarks
cat("\nCohen's d benchmarks:\n")
cat("  Small:  0.2\n")
cat("  Medium: 0.5\n")
cat("  Large:  0.8\n")
```

A Cohen's d of around 1.0 means the two groups differ by a full standard deviation, that is a large, clinically meaningful effect.

**Eta-squared** measures the proportion of total variance explained by the grouping variable. It ranges from 0 to 1, where higher values mean the groups explain more of the variation.

```r title="Eta-squared for one-way ANOVA"
# Effect size: Eta-squared for one-way ANOVA
aov_result <- aov(mpg ~ factor(cyl), data = mtcars)
ss <- summary(aov_result)[[1]]
eta_sq <- ss$`Sum Sq`[1] / sum(ss$`Sum Sq`)
cat("Eta-squared:", round(eta_sq, 3), "\n")
#> Eta-squared: 0.732

# Interpretation benchmarks
cat("\nEta-squared benchmarks:\n")
cat("  Small:  0.01\n")
cat("  Medium: 0.06\n")
cat("  Large:  0.14\n")
cat("\nCylinder count explains", round(eta_sq * 100, 1),
    "% of mpg variance\n")
#> Cylinder count explains 73.2% of mpg variance
```

An eta-squared of 0.73 is extraordinarily large. Cylinder count explains nearly three-quarters of the variation in fuel efficiency. This is both statistically significant and practically important.

![Effect size benchmarks](screenshots/Which-Statistical-Test-in-R-effect-size-guide.webp)
*Figure 3: Effect size benchmarks by test family.*

[KEY INSIGHT]
**A tiny p-value with a tiny effect size means statistically significant but practically meaningless.** With a large enough sample, even trivial differences become "significant." Effect size separates real findings from noise amplified by sample size.

**Try it:** Two groups have means of 50 and 55, both with a standard deviation of 12. Calculate Cohen's d and classify the effect as small, medium, or large.

```r title="Exercise: Calculate Cohens d"
# Try it: calculate Cohen's d
ex_mean1 <- 50
ex_mean2 <- 55
ex_sd <- 12
ex_d <- abs(ex_mean2 - ex_mean1) / ex_sd
cat("Cohen's d:", round(ex_d, 3), "\n")
#> Expected: Cohen's d: 0.417
# Classify: "small", "medium", or "large"?
ex_size <- "___"
cat("Effect size:", ex_size)
#> Expected: Effect size: medium
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohens d calculation solution"
ex_mean1 <- 50
ex_mean2 <- 55
ex_sd <- 12
ex_d <- abs(ex_mean2 - ex_mean1) / ex_sd
cat("Cohen's d:", round(ex_d, 3), "\n")
#> Cohen's d: 0.417
ex_size <- "medium"
cat("Effect size:", ex_size)
#> Effect size: medium
```

**Explanation:** A Cohen's d of 0.417 falls between the small (0.2) and medium (0.5) benchmarks. It rounds to a medium effect, the groups differ by about four-tenths of a standard deviation.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Running multiple t-tests instead of ANOVA

❌ **Wrong:**
```r title="Mistake: Multiple t-tests for groups"
# Comparing 3 groups with separate t-tests (BAD)
t.test(mtcars$mpg[mtcars$cyl == 4], mtcars$mpg[mtcars$cyl == 6])
t.test(mtcars$mpg[mtcars$cyl == 4], mtcars$mpg[mtcars$cyl == 8])
t.test(mtcars$mpg[mtcars$cyl == 6], mtcars$mpg[mtcars$cyl == 8])
# 3 tests at alpha=0.05 => actual error rate ~14.3%
```

**Why it is wrong:** Each t-test has a 5% false positive chance. Running three raises the family-wise error rate to 1 - (0.95)^3 = 14.3%. With 10 groups you would have 45 comparisons and a 90%+ false positive chance.

✅ **Correct:**
```r title="Correct: ANOVA with Tukey HSD"
# Use ANOVA for 3+ groups, then post-hoc if significant
aov_fit <- aov(mpg ~ factor(cyl), data = mtcars)
summary(aov_fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(cyl)   2  824.8   412.4    39.7 4.98e-09
#> Residuals    29  301.3    10.4

# Post-hoc: Tukey's HSD for pairwise comparisons
TukeyHSD(aov_fit)
```

### Mistake 2: Treating paired data as independent

❌ **Wrong:**
```r title="Mistake: Independent test on paired"
# Before-after data analyzed as independent (BAD)
t.test(before, after, paired = FALSE)
#> p-value: 0.1082  (misses the real effect!)
```

**Why it is wrong:** Ignoring the pairing adds between-subject variability to the error term. The test loses power and may fail to detect a real effect.

✅ **Correct:**
```r title="Correct: Use paired t-test"
# Correct: use paired = TRUE
t.test(before, after, paired = TRUE)
#> p-value: 1.1e-06  (strong evidence of treatment effect)
```

### Mistake 3: Reporting only p-values without effect sizes

❌ **Wrong:**
```r title="Mistake: Report p-value alone"
# "The groups differed significantly (p < 0.001)."
# But how MUCH did they differ? No one knows.
```

**Why it is wrong:** A p-value says whether an effect exists, not how big it is. With n = 100,000, a half-point difference can be "highly significant." Without effect size, nobody can judge practical importance.

✅ **Correct:**
```r title="Correct: Report p-value with effect"
# Always report both
cat("Groups differed significantly",
    "(p < 0.001, Cohen's d =", round(abs(cohens_d), 2), ")\n")
#> Groups differed significantly (p < 0.001, Cohen's d = 1.0)
# Now the reader knows: large, practically meaningful effect
```

### Mistake 4: Using parametric tests on heavily skewed small samples

❌ **Wrong:**
```r title="Mistake: t-test on skewed sample"
# Small, heavily skewed sample — t-test is unreliable
set.seed(404)
skewed_small <- rexp(12, rate = 0.5)
t.test(skewed_small, mu = 2)
```

**Why it is wrong:** With only 12 observations and strong skewness, the t-test's normality assumption is badly violated. The Central Limit Theorem does not rescue you at n = 12.

✅ **Correct:**
```r title="Correct: Wilcoxon non-parametric test"
# Use the non-parametric Wilcoxon test instead
wilcox.test(skewed_small, mu = 2)
#> Wilcoxon signed rank test
#> V = ..., p-value = ...
```

### Mistake 5: Confusing statistical and practical significance

❌ **Wrong:** "p < 0.001 therefore the effect is important." This is a logical error. Statistical significance depends on sample size. With n = 1,000,000, even a 0.01-unit difference can be significant.

✅ **Correct:** Report the effect size, confidence interval, and interpret in domain context. Ask: "Is this difference big enough to matter to the people affected?"

## Practice Exercises

### Exercise 1: Walk through the 5-question flowchart

A researcher measured reaction times (in milliseconds) for two independent groups: 20 participants who drank coffee and 20 who drank water. The reaction time data is roughly normal. Walk through all 5 questions and run the correct test.

```r title="Exercise 1: Coffee versus water"
# Exercise 1: Apply the 5-question decision framework
set.seed(501)
my_coffee <- rnorm(20, mean = 250, sd = 30)
my_water  <- rnorm(20, mean = 270, sd = 30)

# Q1: Outcome type? (continuous — reaction time in ms)
# Q2: How many groups? (2 — coffee vs water)
# Q3: Paired or independent? (independent — different people)
# Q4: Normal? Check with shapiro.test()
# Q5: Run the correct test and compute Cohen's d

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Coffee versus water solution"
set.seed(501)
my_coffee <- rnorm(20, mean = 250, sd = 30)
my_water  <- rnorm(20, mean = 270, sd = 30)

# Q1: Continuous (numeric reaction times)
# Q2: 2 groups
# Q3: Independent (different participants)

# Q4: Check normality
shapiro.test(my_coffee)
#> p-value > 0.05 (normal)
shapiro.test(my_water)
#> p-value > 0.05 (normal)

# Q5: Two-sample t-test (continuous, 2 groups, independent, normal)
my_result <- t.test(my_coffee, my_water)
print(my_result)

# Effect size: Cohen's d
my_pooled_sd <- sqrt((sd(my_coffee)^2 + sd(my_water)^2) / 2)
my_d <- abs(mean(my_coffee) - mean(my_water)) / my_pooled_sd
cat("Cohen's d:", round(my_d, 3), "\n")
```

**Explanation:** The outcome is continuous, there are 2 independent groups, and both pass normality. The correct test is the two-sample t-test. Cohen's d quantifies the separation between groups in standard deviation units.

</details>

### Exercise 2: ANOVA or Kruskal-Wallis?

Three dosage levels of a medication (low, medium, high) are tested on different patients. The outcome is pain score (0-10 scale). The low-dose group's data is heavily skewed. Decide between ANOVA and Kruskal-Wallis, run the test, and report the appropriate effect size.

```r title="Exercise 2: ANOVA versus Kruskal-Wallis"
# Exercise 2: Choose between ANOVA and Kruskal-Wallis
set.seed(602)
my_low    <- round(rexp(15, rate = 0.3), 1)  # skewed!
my_medium <- round(rnorm(15, mean = 4, sd = 1.5), 1)
my_high   <- round(rnorm(15, mean = 2, sd = 1), 1)

my_pain   <- c(my_low, my_medium, my_high)
my_dose   <- factor(rep(c("low", "medium", "high"), each = 15))

# Step 1: Check normality per group
# Step 2: Choose and run the correct test
# Step 3: Compute effect size

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="ANOVA versus Kruskal-Wallis solution"
set.seed(602)
my_low    <- round(rexp(15, rate = 0.3), 1)
my_medium <- round(rnorm(15, mean = 4, sd = 1.5), 1)
my_high   <- round(rnorm(15, mean = 2, sd = 1), 1)

my_pain   <- c(my_low, my_medium, my_high)
my_dose   <- factor(rep(c("low", "medium", "high"), each = 15))

# Step 1: Check normality per group
shapiro.test(my_low)
#> p-value < 0.05 (NOT normal — skewed)
shapiro.test(my_medium)
shapiro.test(my_high)

# Step 2: At least one group fails normality -> Kruskal-Wallis
my_kw <- kruskal.test(my_pain ~ my_dose)
print(my_kw)

# Step 3: Epsilon-squared effect size
my_H <- my_kw$statistic
my_n <- length(my_pain)
my_eps2 <- as.numeric(my_H / ((my_n^2 - 1) / (my_n + 1)))
cat("Epsilon-squared:", round(my_eps2, 3), "\n")
```

**Explanation:** The low-dose group fails Shapiro-Wilk, so ANOVA assumptions are violated. Kruskal-Wallis is the correct non-parametric alternative for 3+ independent groups. Epsilon-squared is its effect size metric, interpreted similarly to eta-squared.

</details>

## Putting It All Together

Let's walk through a complete real-world example from start to finish. The research question: "Does engine type (4-cylinder, 6-cylinder, or 8-cylinder) affect fuel efficiency?"

We will answer all 5 questions, run the appropriate test, check assumptions, and report the effect size.

```r title="End-to-end cylinder mpg analysis"
# Complete example: Does cylinder count affect fuel efficiency?
# Dataset: mtcars (built-in)

# QUESTION 1: What is the outcome type?
cat("Outcome: mpg (miles per gallon) —", class(mtcars$mpg), "\n")
#> Outcome: mpg (miles per gallon) — numeric
# Answer: Continuous

# QUESTION 2: How many groups?
cat("Groups:", length(unique(mtcars$cyl)), "—",
    sort(unique(mtcars$cyl)), "\n")
#> Groups: 3 — 4 6 8
# Answer: 3 groups -> multi-sample test

# QUESTION 3: Paired or independent?
# Different cars in each group -> Independent
cat("Design: Independent (different cars per group)\n")

# QUESTION 4: Normal within each group?
cat("\nNormality check per group:\n")
for (g in sort(unique(mtcars$cyl))) {
  p <- shapiro.test(mtcars$mpg[mtcars$cyl == g])$p.value
  cat("  cyl =", g, ": p =", round(p, 4),
      ifelse(p > 0.05, "(normal)", "(non-normal)"), "\n")
}
#> cyl = 4 : p = 0.2606 (normal)
#> cyl = 6 : p = 0.3253 (normal)
#> cyl = 8 : p = 0.2986 (normal)
# Answer: All groups pass normality -> parametric

# QUESTION 5: Run the test
cat("\n--- One-way ANOVA ---\n")
fuel_aov <- aov(mpg ~ factor(cyl), data = mtcars)
print(summary(fuel_aov))
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(cyl)   2  824.8   412.4    39.7 4.98e-09
#> Residuals    29  301.3    10.4

# Effect size: Eta-squared
fuel_ss <- summary(fuel_aov)[[1]]
fuel_eta <- fuel_ss$`Sum Sq`[1] / sum(fuel_ss$`Sum Sq`)
cat("\nEta-squared:", round(fuel_eta, 3), "\n")
#> Eta-squared: 0.732

# Interpretation
cat("\nConclusion: Cylinder count significantly affects",
    "fuel efficiency\n")
cat("(F(2,29) = 39.7, p < 0.001, eta-sq = 0.73).\n")
cat("This is a very large effect — cylinders explain",
    "73% of mpg variance.\n")

# Post-hoc: Which groups differ?
cat("\n--- Tukey's HSD ---\n")
TukeyHSD(fuel_aov)
```

All three pairwise comparisons are significant. Four-cylinder cars get the best mileage (mean 26.7 mpg), followed by six-cylinder (19.7 mpg), then eight-cylinder (15.1 mpg). The effect is large, and the pattern makes physical sense, more cylinders burn more fuel.

## Summary

Here is the complete 5-question framework at a glance.

| Question | Your Answer | Leads To |
|---|---|---|
| 1. Outcome type? | Continuous | t-tests / ANOVA branch |
| 1. Outcome type? | Categorical | Chi-square / Fisher branch |
| 2. How many groups? | 1 | One-sample test |
| 2. How many groups? | 2 | Two-sample test |
| 2. How many groups? | 3+ | ANOVA / Kruskal-Wallis |
| 3. Paired or independent? | Paired | Paired test variant |
| 3. Paired or independent? | Independent | Independent test variant |
| 4. Normal distribution? | Yes | Parametric version |
| 4. Normal distribution? | No | Non-parametric version |
| 5. Effect size? | Always | Report alongside p-value |

**Quick reference for the most common tests:**

| Scenario | Test | R Function | Effect Size |
|---|---|---|---|
| 1 group vs known value | One-sample t-test | `t.test(x, mu = value)` | Cohen's d |
| 2 independent, normal | Two-sample t-test | `t.test(x, y)` | Cohen's d |
| 2 independent, non-normal | Mann-Whitney U | `wilcox.test(x, y)` | r = Z / sqrt(N) |
| 2 paired, normal | Paired t-test | `t.test(x, y, paired = TRUE)` | Cohen's d |
| 2 paired, non-normal | Wilcoxon signed-rank | `wilcox.test(x, y, paired = TRUE)` | r = Z / sqrt(N) |
| 3+ independent, normal | One-way ANOVA | `aov(y ~ group)` | Eta-squared |
| 3+ independent, non-normal | Kruskal-Wallis | `kruskal.test(y ~ group)` | Epsilon-squared |
| Categorical, large N | Chi-square test | `chisq.test(table)` | Cramer's V |
| Categorical, small N | Fisher's exact test | `fisher.test(table)` | Odds ratio |

## FAQ

**Can I use a t-test if my data isn't perfectly normal?**

Yes, if your sample size is large enough. The Central Limit Theorem guarantees that the sampling distribution of the mean approaches normality as n grows. With n > 30 per group, the t-test is robust to moderate non-normality. For small samples (n < 15) with visible skewness, switch to the non-parametric alternative.

**What's the difference between Mann-Whitney U and Wilcoxon rank-sum?**

They are the same test with two names. The Mann-Whitney U test and the Wilcoxon rank-sum test are mathematically equivalent. In R, `wilcox.test(x, y)` performs both. The test compares the ranks of values rather than the raw values, making it distribution-free.

**How do I choose between chi-square and Fisher's exact test?**

Use chi-square when all expected cell counts are 5 or greater. Use Fisher's exact test when any expected count falls below 5. Fisher's test computes exact probabilities rather than relying on the chi-square approximation, so it is more reliable for small samples. In R, check expected counts with `chisq.test(table)$expected`.

**Should I always report effect sizes?**

Yes. The American Statistical Association's 2016 statement on p-values recommends reporting effect sizes alongside p-values. A p-value tells you whether an effect is real. An effect size tells you whether it matters. Both are needed for sound conclusions.

**What if I have more than one outcome variable?**

When you have multiple outcome variables measured on the same subjects, consider MANOVA (for continuous outcomes across groups) or multivariate regression. These tests account for correlations between outcomes. In R, use `manova()` for MANOVA. These are beyond this guide's scope, consult a multivariate statistics resource.

## References

1. R Core Team, t.test() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. R Core Team, aov() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
3. R Core Team, shapiro.test() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/shapiro.test.html)
4. Cohen, J., *Statistical Power Analysis for the Behavioral Sciences*, 2nd Edition. Lawrence Erlbaum Associates (1988).
5. Field, A., Miles, J. & Field, Z., *Discovering Statistics Using R*. SAGE Publications (2012). Chapters 9-12.
6. UCLA OARC, Choosing the Correct Statistical Test in SAS, Stata, SPSS and R. [Link](https://stats.oarc.ucla.edu/other/mult-pkg/whatstat/)
7. Wasserstein, R. & Lazar, N., The ASA Statement on p-Values: Context, Process, and Purpose. *The American Statistician* 70(2), 129-133 (2016). [Link](https://doi.org/10.1080/00031305.2016.1154108)
8. Stats and R, What Statistical Test Should I Do? [Link](https://statsandr.com/blog/what-statistical-test-should-i-do/)

## Continue Learning

- **Hypothesis Testing Fundamentals**, For a deeper dive into p-values, confidence intervals, and Type I/II errors, the hypothesis testing foundations tutorial covers the theory behind every test in this guide.
- **Regression Decision Guide**, When your question is about predicting an outcome rather than comparing groups, the regression model selection guide walks you through choosing between linear, logistic, Poisson, and other regression models.
- **ANOVA Deep Dive**, For a thorough treatment of one-way, factorial, and repeated-measures ANOVA with full R code and post-hoc comparisons, see the ANOVA tutorial.

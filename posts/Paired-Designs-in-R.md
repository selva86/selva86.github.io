---
title: "Paired Designs in R: Before-After and Matched Pairs"
slug: "Paired-Designs-in-R"
description: "Paired designs compare the same subjects before and after, or matched pairs. Learn the paired t-test, Wilcoxon signed-rank, effect size, and power in R."
keywords: "paired t-test in R, paired designs, before-after study, matched pairs, Wilcoxon signed-rank test, paired samples, repeated measures, effect size, power analysis, t.test paired"
auto_link_terms: "paired design|paired designs|before-after study|before-after design|matched pairs|matched-pairs design|paired samples|repeated measures design|within-subjects design|paired difference|pre-post design"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-7.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Paired Designs"
sidebar_order: 40
difficulty: "Intermediate"
---

<p class="lead">A paired design measures the same subject twice (before and after) or matches subjects into pairs, so each pair acts as its own control. Analyzing the within-pair differences strips out person-to-person noise, which gives a far more sensitive test than comparing two separate groups. This tutorial builds the whole workflow in base R, from the first test to effect size and sample-size planning.</p>

## What is a paired design, and when do you use one?

Suppose the same 10 patients each tried two different sleep drugs, and you recorded how many extra hours they slept on each. The question is simple: did one drug help more than the other? Because every patient took *both* drugs, the two columns of numbers are linked patient by patient. That link is what makes the design "paired", and R has a one-argument switch to use it. The `sleep` dataset ships with R, so you can run the test right now.

```r title="A paired t-test on before and after data"
# 10 patients each tried two sleep drugs; extra = extra hours slept.
# Because the SAME patients took both drugs, the two columns are paired.
with(sleep, t.test(extra[group == 2], extra[group == 1], paired = TRUE))
#> 
#> 	Paired t-test
#> 
#> data:  extra[group == 2] and extra[group == 1]
#> t = 4.0621, df = 9, p-value = 0.002833
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  0.7001142 2.4598858
#> sample estimates:
#> mean difference 
#>            1.58
```

Read the result from the bottom up. The average difference is 1.58, so drug 2 added about 1.58 more hours of sleep per patient than drug 1. The p-value of 0.0028 is well below 0.05, so that difference is unlikely to be chance. The 95% confidence interval runs from 0.70 to 2.46 hours and never touches zero, which tells the same story: the drugs really do differ.

Now let us look at the data that produced that answer, so the structure is clear. Each patient appears in two rows, one per drug.

```r title="Look at the paired data"
# Each patient (ID) appears twice, once per drug (group).
head(sleep, 4)
nrow(sleep); nlevels(sleep$ID)
#>   extra group ID
#> 1   0.7     1  1
#> 2  -1.6     1  2
#> 3  -0.2     1  3
#> 4  -1.2     1  4
#> [1] 20
#> [1] 10
```

There are 20 rows but only 10 patients, because each patient contributes two measurements. A **before-after** design looks exactly like this: the same person, measured at two time points. A **matched pairs** design is its close cousin, where you pair up two *different* people who are alike (twins, or two customers with similar histories) and give each a different treatment. Both designs share one idea: compare within the pair, not across the whole sample.

![Two paired designs both reduce to one difference per pair](screenshots/Paired-Designs-in-R-design-types.webp)

*Figure 1: The two paired designs both reduce to one difference per pair.*

[KEY INSIGHT]
**In a paired design, each pair is its own control.** Whatever makes a patient sleep more or less overall (age, health, mood) is present in both of their readings, so it cancels when you subtract one from the other. You are left with a cleaner measure of the treatment effect.

**Try it:** Compute the mean extra sleep for each drug group so you can see the two averages behind that 1.58 difference.

```r title="Your turn: mean extra sleep per drug"
# Compute the mean of `extra` for each `group` in the sleep data.
# Replace NULL with your answer, then run.
ex_means <- NULL   # hint: tapply(sleep$extra, sleep$group, mean)

# Expected: group 1 around 0.75, group 2 around 2.33
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean extra sleep per drug solution"
ex_means <- tapply(sleep$extra, sleep$group, mean)
ex_means
#>    1    2 
#> 0.75 2.33
```

**Explanation:** `tapply()` splits `extra` by `group` and applies `mean()` to each piece. The gap of 2.33 minus 0.75 equals 1.58, the mean difference the paired test reported.

</details>

## Why does pairing beat two independent samples?

It is tempting to think of the two drugs as two separate groups and reach for the ordinary two-sample t-test. Let us do exactly that on the very same data and see what happens. This is the test you get if you forget the `paired = TRUE` switch.

```r title="The wrong test ignores the pairing"
# If we (wrongly) treat the two drugs as independent groups:
t.test(extra ~ group, data = sleep)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  extra by group
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> alternative hypothesis: true difference in means between group 1 and group 2 is not equal to 0
#> 95 percent confidence interval:
#>  -3.3654832  0.2054832
#> sample estimates:
#> mean in group 1 mean in group 2 
#>            0.75            2.33
```

The group means are identical to before (0.75 and 2.33), yet the p-value jumped to 0.079, above the usual 0.05 line. The unpaired test would tell you there is *no* significant difference. Same numbers, opposite conclusion. The unpaired test threw away the pairing, and with it, the test's power.

Why does that happen? The unpaired test measures each drug's spread across all patients, and patients vary a lot in how much they sleep. The paired test instead looks at each patient's *change*, and those changes are much tighter. The numbers below make the gap visible.

```r title="Why pairing shrinks the noise"
g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]
diffs <- g2 - g1                 # each patient's change from drug 1 to drug 2
c(sd_all_readings = sd(sleep$extra),  # spread across all 20 readings
  sd_of_changes   = sd(diffs),        # spread of the 10 per-patient changes
  correlation     = cor(g1, g2))      # how aligned the two drugs are per patient
#> sd_all_readings   sd_of_changes     correlation 
#>       2.0179197       1.2299955       0.7951702
```

The spread of the raw readings is about 2.02 hours, but the spread of the within-patient changes is only 1.23. The paired test divides by that smaller number, so the same 1.58 difference looks much bigger relative to the noise. The correlation of 0.80 is the reason: patients who slept a lot on drug 1 also slept a lot on drug 2, so subtracting removes that shared tendency.

[KEY INSIGHT]
**Pairing wins when the two measurements are positively correlated.** The stronger the within-pair correlation, the more between-subject noise subtraction removes, and the more powerful the paired test becomes. If the pairing is meaningless (correlation near zero), you gain nothing and lose a degree of freedom.

**Try it:** The paired test uses the standard error of the differences. Compute it as the standard deviation of `diffs` divided by the square root of the number of pairs.

```r title="Your turn: standard error of the difference"
# n is the number of pairs = length(diffs).
ex_se <- NULL   # hint: sd(diffs) / sqrt(length(diffs))

# Expected: about 0.389
```

<details>
<summary>Click to reveal solution</summary>

```r title="Standard error of the difference solution"
ex_se <- sd(diffs) / sqrt(length(diffs))
ex_se
#> [1] 0.3889587
```

**Explanation:** Dividing the mean difference (1.58) by this standard error (0.389) gives 4.06, exactly the t-statistic the paired test reported.

</details>

## How do you run a paired t-test step by step?

Here is the idea that makes the paired t-test easy to understand: it is nothing more than a one-sample t-test run on the column of differences. You already built that column above as `diffs`. Testing whether its mean is zero is the same as testing whether the two conditions differ.

```r title="A paired t-test is a one-sample t-test on the differences"
# `diffs` holds drug 2 minus drug 1 for each patient. Test whether their mean is 0:
t.test(diffs)
#> 
#> 	One Sample t-test
#> 
#> data:  diffs
#> t = 4.0621, df = 9, p-value = 0.002833
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  0.7001142 2.4598858
#> sample estimates:
#> mean of x 
#>      1.58
```

The t-statistic (4.0621), degrees of freedom (9), and p-value (0.002833) are identical to the paired test from the first section. That is not a coincidence, it is the definition. A paired t-test computes the differences for you and runs a one-sample test on them.

If you like seeing the machinery, the t-statistic is the mean difference divided by its standard error. If formulas are not your thing, skip the next block; the code above is all you need.

$$t = \frac{\bar{d}}{s_d / \sqrt{n}}$$

Where:

- $\bar{d}$ is the mean of the paired differences
- $s_d$ is the standard deviation of the differences
- $n$ is the number of pairs

Let us plug the pieces in by hand and confirm they reproduce the statistic.

```r title="The paired t-statistic by hand"
n_pairs <- length(diffs)
t_value <- mean(diffs) / (sd(diffs) / sqrt(n_pairs))
c(mean_diff = mean(diffs), t = t_value, df = n_pairs - 1)
#> mean_diff         t        df 
#>  1.580000  4.062128  9.000000
```

The hand computation gives t = 4.0621 with 9 degrees of freedom, matching R's built-in output. This is why the test needs so little: just one column of differences plus its mean and spread.

[NOTE]
**The formula interface does not accept paired = TRUE in base R.** Writing t.test(extra ~ group, data = sleep, paired = TRUE) throws the error "cannot use 'paired' in formula method". Always pass the two columns as separate vectors, as in t.test(after, before, paired = TRUE).

**Try it:** Pull the 95% confidence interval for the mean difference out of a one-sample t-test on `diffs`.

```r title="Your turn: confidence interval for the mean difference"
# Extract just the confidence interval from the test object.
ex_ci <- NULL   # hint: t.test(diffs)$conf.int

# Expected: roughly 0.70 to 2.46
```

<details>
<summary>Click to reveal solution</summary>

```r title="Confidence interval for the mean difference solution"
ex_ci <- t.test(diffs)$conf.int
ex_ci
#> [1] 0.7001142 2.4598858
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** Every `t.test()` result is a list, and `$conf.int` grabs the interval directly, which is handy when you want to report it without printing the full test.

</details>

## How do you get before-after data into the right shape?

Real datasets rarely arrive pre-split into two neat vectors. The most common shape is **wide**: one row per subject, with a `before` column and an `after` column. Let us build a small weight-loss study in that shape and run the test straight from the columns.

```r title="Before and after in wide format"
# One row per subject, two measurement columns.
weight <- data.frame(
  subject = 1:8,
  before  = c(80, 92, 75, 88, 69, 95, 83, 78),
  after   = c(78, 89, 74, 83, 66, 90, 80, 77)
)
t.test(weight$before, weight$after, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  weight$before and weight$after
#> t = 5.2373, df = 7, p-value = 0.001203
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  1.576954 4.173046
#> sample estimates:
#> mean difference 
#>           2.875
```

Subjects lost 2.875 kg on average (p = 0.0012), and the interval from 1.58 to 4.17 kg stays positive. The other common shape is **long**: one row per measurement, with a column saying whether it is a before or after value. Many plotting and modeling tools prefer long format, so it helps to reshape with `pivot_longer()`.

```r title="Reshape wide data to long"
library(dplyr)
library(tidyr)

weight_long <- weight |>
  pivot_longer(c(before, after), names_to = "time", values_to = "kg")
head(as.data.frame(weight_long), 4)
#>   subject   time kg
#> 1       1 before 80
#> 2       1  after 78
#> 3       2 before 92
#> 4       2  after 89
```

Each subject now spans two rows, tagged `before` or `after`. To run the paired test from long data, pull the two groups back out as vectors and keep them in subject order so the pairs line up.

```r title="Run the paired test on long data"
before_kg <- weight_long$kg[weight_long$time == "before"]
after_kg  <- weight_long$kg[weight_long$time == "after"]
t.test(before_kg, after_kg, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  before_kg and after_kg
#> t = 5.2373, df = 7, p-value = 0.001203
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  1.576954 4.173046
#> sample estimates:
#> mean difference 
#>           2.875
```

Same t-statistic, same p-value. The shape of the data did not change the answer, only how you fed it to the test. A picture makes the pairing obvious: draw one line per subject connecting their before and after value.

```r title="Visualize the paired structure"
library(ggplot2)

ggplot(weight_long, aes(x = time, y = kg, group = subject)) +
  geom_line(color = "grey60") +
  geom_point(size = 2, color = "#4c6ef5") +
  scale_x_discrete(limits = c("before", "after")) +
  labs(title = "Each line is one subject", x = NULL, y = "Weight (kg)") +
  theme_minimal(base_size = 13)
```

Almost every line slopes downward, which is the visual signature of a real effect in a paired design. If the lines crossed randomly, the paired test would find little.

[WARNING]
**The two vectors must stay aligned pair by pair.** R matches the first element of one vector to the first of the other, and so on. If you sort one column but not the other, or a subject has a missing value on only one side, the pairs break silently. Drop incomplete pairs before testing, or pass na.action carefully.

**Try it:** Using `weight_long`, compute the mean weight at each time point with `group_by()` and `summarise()`.

```r title="Your turn: mean weight before and after"
# Group by time, then summarise the mean of kg.
ex_time_means <- NULL   # hint: weight_long |> group_by(time) |> summarise(mean_kg = mean(kg))

# Expected: before around 82.5, after around 79.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean weight before and after solution"
ex_time_means <- weight_long |>
  group_by(time) |>
  summarise(mean_kg = mean(kg))
as.data.frame(ex_time_means)
#>     time mean_kg
#> 1  after  79.625
#> 2 before  82.500
```

**Explanation:** The two means differ by 2.875 kg, matching the paired test. `group_by()` plus `summarise()` is the tidyverse way to collapse each group to a single number.

</details>

## How do you check assumptions, and what if they fail?

The paired t-test makes one real assumption, and it is easy to get wrong. The assumption is that the *differences* are roughly normally distributed. Not the before values, not the after values, only their difference. With eight differences that is a lot to ask of a formal test, but `shapiro.test()` gives a quick read.

```r title="Check normality of the differences"
weight_diffs <- weight$before - weight$after
shapiro.test(weight_diffs)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  weight_diffs
#> W = 0.8832, p-value = 0.202
```

The Shapiro-Wilk p-value is 0.20, above 0.05, so there is no evidence the differences depart from normality. A picture helps confirm it. Plot the distribution of the differences and check that it is not wildly skewed or spiked.

```r title="See the distribution of the differences"
ggplot(data.frame(diff = weight_diffs), aes(x = diff)) +
  geom_histogram(bins = 6, fill = "#4c6ef5", color = "white") +
  labs(title = "Distribution of before - after differences",
       x = "Difference (kg)", y = "Count") +
  theme_minimal(base_size = 13)
```

[WARNING]
**Test the differences, not the raw before and after columns.** A common mistake is running a normality check on the before values and again on the after values. The paired t-test never assumes those are normal. Only the single column of differences matters.

When the differences are clearly non-normal, for example when an outlier dominates or the sample is small and skewed, switch to the **Wilcoxon signed-rank test**. It ranks the size of the differences instead of using their raw values, so a single extreme point has far less influence on the result. The decision comes down to one question, shown below.

![Normal differences point to the paired t-test, skewed ones to Wilcoxon](screenshots/Paired-Designs-in-R-test-choice.webp)

*Figure 2: Normal differences point to the paired t-test; skewed ones to Wilcoxon.*

Here is the Wilcoxon test on a small, skewed reaction-time sample where two values are far larger than the rest.

```r title="Wilcoxon signed-rank test: the nonparametric backup"
# A small, skewed before/after sample (reaction time, ms) with two large values.
rt_before <- c(310, 305, 320, 480, 300, 315, 295, 500)
rt_after  <- c(290, 300, 305, 350, 285, 300, 290, 360)
wilcox.test(rt_before, rt_after, paired = TRUE)
#> 
#> 	Wilcoxon signed rank exact test
#> 
#> data:  rt_before and rt_after
#> V = 36, p-value = 0.007812
#> alternative hypothesis: true location shift is not equal to 0
```

The test reports V = 36 and p = 0.0078, so reaction times dropped after the change even though the sample was skewed. The Wilcoxon test gives you a p-value without trusting the normality assumption.

[NOTE]
**The Wilcoxon signed-rank test is the paired test's nonparametric partner.** For a deeper look at how it ranks differences and handles ties, see the dedicated guide on the [Wilcoxon signed-rank test](Wilcoxon-Signed-Rank-Test-in-R.html).

**Try it:** Run a Shapiro-Wilk test on the sleep `diffs` you built earlier to see whether the paired t-test was justified there.

```r title="Your turn: test normality of the sleep differences"
# `diffs` holds the 10 within-patient sleep differences.
ex_shap <- NULL   # hint: shapiro.test(diffs)

# Expected: W around 0.83, p-value around 0.03 (just under 0.05)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Normality of the sleep differences solution"
ex_shap <- shapiro.test(diffs)
ex_shap
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  diffs
#> W = 0.82987, p-value = 0.03334
```

**Explanation:** Here the p-value (0.033) dips just below 0.05, a mild warning that the differences are not perfectly normal. With only 10 pairs the paired t-test is fairly robust, but a cautious analyst would also report the Wilcoxon result as a cross-check.

</details>

## How big is the effect, and how many pairs do you need?

A p-value tells you whether an effect exists, not how large it is. With enough pairs, even a trivial difference becomes "significant". So always report an **effect size** next to the p-value. For paired data the standard measure is Cohen's $d_z$: the mean difference divided by the standard deviation of the differences.

$$d_z = \frac{\bar{d}}{s_d}$$

It answers "how many standard deviations of change is the average change?" Rough guideposts are 0.2 (small), 0.5 (medium), and 0.8 (large).

```r title="Effect size for paired data (Cohen's dz)"
# dz = mean of the differences / SD of the differences
dz <- mean(diffs) / sd(diffs)
round(dz, 3)
#> [1] 1.285
```

A $d_z$ of 1.29 is very large: the typical patient's change is more than one standard deviation of change. That is why the effect was significant even with just 10 patients. The flip side of that question is planning: if you were designing a new study, how many pairs would you need to detect this effect reliably? Base R's `power.t.test()` answers it.

```r title="How many pairs for 80 percent power?"
# Given the effect we measured, how many pairs give 80% power?
power.t.test(delta = mean(diffs), sd = sd(diffs), power = 0.80,
             sig.level = 0.05, type = "paired")
#> 
#>      Paired t test power calculation 
#> 
#>               n = 6.912532
#>           delta = 1.58
#>              sd = 1.229995
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number of *pairs*, sd is std.dev. of *differences* within pairs
```

The answer is n = 6.9, which you round up to 7 pairs. Because the effect is so strong, a tiny study can detect it. For a `type = "paired"` calculation, remember that `sd` is the standard deviation of the *differences*, not of the raw scores, exactly as the note at the bottom of the output reminds you.

[TIP]
**Report the effect size and confidence interval, not just the p-value.** A significant p-value with a tiny dz means the effect is real but too small to matter in practice. Pairing dz with the mean difference and its interval tells the reader both whether the effect exists and whether it is worth acting on.

**Try it:** Compute Cohen's $d_z$ for the weight-loss study using `weight_diffs`.

```r title="Your turn: effect size for the weight study"
# weight_diffs holds the 8 before - after weight changes.
ex_dz <- NULL   # hint: mean(weight_diffs) / sd(weight_diffs)

# Expected: a large effect, dz above 1.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Effect size for the weight study solution"
ex_dz <- mean(weight_diffs) / sd(weight_diffs)
round(ex_dz, 3)
#> [1] 1.852
```

**Explanation:** A $d_z$ of 1.85 is a huge effect, which fits the near-parallel downward lines you saw in the slope plot.

</details>

## Complete Example: a full before-after analysis

Let us tie every step together on a fresh study. Imagine 15 people ran a reaction-time task before and after a training program, with times recorded in milliseconds. We will simulate the data with a fixed seed so your run matches exactly, then walk the full pipeline: build the data, check the assumption, run the test, then report the effect.

```r title="A full paired analysis from scratch"
set.seed(2026)
n <- 15
rt_pre  <- round(rnorm(n, mean = 420, sd = 40))
rt_post <- round(rt_pre - rnorm(n, mean = 18, sd = 15))   # training tends to lower RT
train <- data.frame(person = 1:n, pre = rt_pre, post = rt_post)
head(train, 4)
#>   person pre post
#> 1      1 441  403
#> 2      2 377  350
#> 3      3 426  405
#> 4      4 417  411
```

The data is in wide format, one row per person. Next, form the differences, check that they are normal, then run the paired test.

```r title="Check the assumption, then run the test"
train_diff <- train$pre - train$post
shapiro.test(train_diff)          # are the differences roughly normal?
t.test(train$pre, train$post, paired = TRUE)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  train_diff
#> W = 0.95755, p-value = 0.65
#> 
#> 	Paired t-test
#> 
#> data:  train$pre and train$post
#> t = 6.7473, df = 14, p-value = 9.36e-06
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  17.5989 34.0011
#> sample estimates:
#> mean difference 
#>            25.8
```

The Shapiro-Wilk p-value of 0.65 says the differences are comfortably normal, so the paired t-test is appropriate. The test finds a mean drop of 25.8 ms with a tiny p-value, and the confidence interval from 17.6 to 34.0 ms stays well away from zero. Finally, package the result the way you would in a report, with the effect size included.

```r title="Report the effect size and a plain-English result"
dz_train <- mean(train_diff) / sd(train_diff)
tt <- t.test(train$pre, train$post, paired = TRUE)
p_txt <- ifelse(tt$p.value < 0.001, "< 0.001", sprintf("= %.3f", tt$p.value))
cat(sprintf(
  "Mean drop: %.1f ms (95%% CI %.1f to %.1f), t(%d) = %.2f, p %s, dz = %.2f\n",
  mean(train_diff), tt$conf.int[1], tt$conf.int[2],
  tt$parameter, tt$statistic, p_txt, dz_train))
#> Mean drop: 25.8 ms (95% CI 17.6 to 34.0), t(14) = 6.75, p < 0.001, dz = 1.74
```

That single line is exactly what belongs in a results section: the size of the effect, its confidence interval, the test statistic with degrees of freedom, the p-value, and the standardized effect size. Any reader can judge both significance and practical importance from it.

## Practice Exercises

These combine several steps from the tutorial. Try each before opening the solution. The starter blocks define the data for you, so you only write the analysis.

### Exercise 1: Reshape and run a paired test

A blood-pressure study measured six patients before and after a drug. Reshape the wide table to long format, then run a paired t-test comparing before against after.

```r title="Exercise 1: reshape and run a paired test"
# Blood pressure (mmHg) before and after a drug, 6 patients.
bp <- data.frame(
  patient = 1:6,
  before  = c(145, 152, 138, 160, 149, 155),
  after   = c(138, 145, 135, 150, 142, 148)
)
# 1) reshape bp to long with a `phase` column and a `bp_value` column
# 2) run a paired t-test comparing before vs after
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
bp_long <- pivot_longer(bp, c(before, after),
                        names_to = "phase", values_to = "bp_value")
bp_before <- bp_long$bp_value[bp_long$phase == "before"]
bp_after  <- bp_long$bp_value[bp_long$phase == "after"]
t.test(bp_before, bp_after, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  bp_before and bp_after
#> t = 7.5106, df = 5, p-value = 0.0006619
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  4.494559 9.172108
#> sample estimates:
#> mean difference 
#>        6.833333
```

**Explanation:** The drug lowered blood pressure by about 6.8 mmHg on average (p = 0.0007). Reshaping did not change the test, it just organized the data; the two vectors still had to be extracted in patient order.

</details>

### Exercise 2: Pick the right test

An income-change sample has one enormous outlier. Compute the differences, test them for normality, then run the appropriate test: a paired t-test if the differences look normal, otherwise the Wilcoxon signed-rank test.

```r title="Exercise 2: pick the right test"
# Income before and after (in $1000s), 7 people, one huge value.
inc_before <- c(42, 45, 39, 41, 300, 44, 40)
inc_after  <- c(45, 47, 42, 44, 260, 46, 43)
# 1) compute the differences and test them with shapiro.test()
# 2) if normal use a paired t-test; if not, use wilcox.test(paired = TRUE)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
inc_diff <- inc_before - inc_after
shapiro.test(inc_diff)                     # the outlier wrecks normality
wilcox.test(inc_before, inc_after, paired = TRUE)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  inc_diff
#> W = 0.47505, p-value = 7.967e-06
#> 
#> 	Wilcoxon signed rank exact test
#> 
#> data:  inc_before and inc_after
#> V = 7, p-value = 0.2656
#> alternative hypothesis: true location shift is not equal to 0
```

**Explanation:** The Shapiro-Wilk p-value is far below 0.05, so the differences are not normal and the paired t-test is unsafe. The Wilcoxon test reports p = 0.27, so once you stop letting the outlier dominate, the change is not significant.

</details>

### Exercise 3: Effect size and required sample size

Using the reaction-time `train_diff` from the Complete Example, compute Cohen's $d_z$, then use `power.t.test()` to find how many pairs would give 90% power at the observed effect.

```r title="Exercise 3: effect size and required sample size"
# train_diff was created in the Complete Example.
# 1) compute dz = mean(train_diff) / sd(train_diff)
# 2) power.t.test(type = "paired") with power = 0.90,
#    delta = mean(train_diff), sd = sd(train_diff)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
dz3 <- mean(train_diff) / sd(train_diff)
round(dz3, 3)
power.t.test(delta = mean(train_diff), sd = sd(train_diff),
             power = 0.90, sig.level = 0.05, type = "paired")
#> [1] 1.742
#> 
#>      Paired t test power calculation 
#> 
#>               n = 5.709197
#>           delta = 25.8
#>              sd = 14.80926
#>       sig.level = 0.05
#>           power = 0.9
#>     alternative = two.sided
#> 
#> NOTE: n is number of *pairs*, sd is std.dev. of *differences* within pairs
```

**Explanation:** The effect is large ($d_z$ = 1.74), so only about 6 pairs (rounding 5.7 up) are needed for 90% power. Strong effects need small samples; weak effects need large ones.

</details>

## Frequently Asked Questions

### When should I use a paired test instead of a two-sample test?

Use a paired test whenever each observation in one condition has a natural partner in the other: the same subject measured twice, or two subjects matched on key traits. If the two groups are unrelated people with no pairing, use the ordinary two-sample t-test.

### Is a paired t-test really the same as a one-sample t-test on the differences?

Yes, exactly. The paired test computes each pair's difference and runs a one-sample t-test checking whether the mean difference is zero. You saw both routes give identical t, df, and p-values above.

### What is the key assumption of the paired t-test?

That the paired differences are approximately normally distributed. The raw before and after values do not need to be normal, only their difference. Check it with `shapiro.test()` on the differences and a quick histogram.

### What if my differences are not normal?

Use the Wilcoxon signed-rank test, `wilcox.test(x, y, paired = TRUE)`. It ranks the differences rather than using their raw magnitudes, so outliers and skew have far less influence. With large samples the paired t-test also becomes robust to non-normality.

### Is the analysis different for before-after versus matched pairs?

No. Both designs produce one difference per pair, and the math from that point on is identical. The difference is only in how the pairing arises: repeated measurement of one subject, or matching of two subjects.

### How do I report a paired t-test?

Report the mean difference with its 95% confidence interval, the t-statistic with degrees of freedom, the p-value, and an effect size such as Cohen's $d_z$. The one-line report in the Complete Example shows the standard format.

## Summary

Paired designs are one of the simplest ways to get a more sensitive test: by making each pair its own control, they remove the person-to-person noise that weakens two-sample comparisons. The table below captures the workflow.

| Step | What you do | R tool |
|---|---|---|
| Recognize the design | Same subject twice, or matched subjects | before-after / matched pairs |
| Shape the data | Wide (two columns) or long (one per row) | `pivot_longer()` |
| Visualize | One line per pair | `ggplot()` slope plot |
| Check the assumption | Differences roughly normal | `shapiro.test()` on differences |
| Run the test | Paired t-test, or Wilcoxon if skewed | `t.test(..., paired = TRUE)`, `wilcox.test(..., paired = TRUE)` |
| Report the effect | Effect size and required sample size | Cohen's $d_z$, `power.t.test()` |

![The full paired-analysis workflow at a glance](screenshots/Paired-Designs-in-R-workflow-mindmap.webp)

*Figure 3: The full paired-analysis workflow at a glance.*

The core habit to carry away: always analyze the differences, always report an effect size next to the p-value, and always pass your two columns as separate vectors because the formula interface will not take `paired = TRUE`.

## References

1. R Core Team. *t.test: Student's t-Test* (stats package documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
2. R Core Team. *wilcox.test: Wilcoxon Rank Sum and Signed Rank Tests*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html)
3. R Core Team. *power.t.test: Power Calculations for Two-Sample t Test*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html)
4. R Core Team. *shapiro.test: Shapiro-Wilk Normality Test*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/shapiro.test.html)
5. R Core Team. *sleep: Student's Sleep Data*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/sleep.html)
6. tidyr documentation. *pivot_longer()*. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
7. Wickham, H., Cetinkaya-Rundel, M., and Grolemund, G. *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)
8. Wikipedia. *Paired difference test*. [Link](https://en.wikipedia.org/wiki/Paired_difference_test)

## Continue Learning

- [t-Tests in R](t-Tests-in-R.html): all four t-test variants, including how the paired test fits alongside one-sample and two-sample tests.
- [Wilcoxon Signed-Rank Test in R](Wilcoxon-Signed-Rank-Test-in-R.html): the nonparametric partner for paired data, explained from scratch.
- [Effect Size in R](Effect-Size-in-R.html): Cohen's d and related measures for reporting how big an effect really is.
- [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html): plan sample sizes before you collect data, for paired and unpaired designs.

---
title: "Statistical vs Practical Significance in R"
slug: "Statistical-vs-Practical-Significance"
description: "Statistical significance says an effect is real; practical significance asks if it matters. Tell them apart in R with effect size and confidence intervals."
keywords: "statistical vs practical significance, practical significance, effect size, p-value and sample size, Cohen's d in R, confidence interval, significance testing in R, smallest effect size of interest"
auto_link_terms: "statistical vs practical significance|practical significance|practical vs statistical significance|statistically significant but not practically|practically significant|practical importance|real-world significance|smallest effect size of interest|statistical versus practical significance|significance versus importance"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-6.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Statistical vs Practical"
sidebar_order: "30"
difficulty: "Intermediate"
---

<p class="lead">Statistical significance tells you an effect is probably real. Practical significance tells you whether it is big enough to care about. They are not the same, and mixing them up is one of the most expensive mistakes in data analysis. This tutorial uses base R throughout, so you need no extra packages.</p>

## What is the difference between statistical and practical significance?

Imagine your team tests a new checkout page against the old one and times how long each customer takes to check out. With 50,000 customers in each group, the test comes back "statistically significant." Before you celebrate, look at the numbers. The code below shows the trap in one shot: a rock-solid p-value sitting on top of a difference so small no customer would ever feel it.

We will simulate the two groups and run a standard t-test, which compares the average checkout time of the two pages and reports a p-value.

```r title="Simulate two checkout pages and t-test them"
set.seed(101)
version_a <- rnorm(50000, mean = 30.2, sd = 10)  # current checkout, seconds
version_b <- rnorm(50000, mean = 30.0, sd = 10)  # new checkout, seconds

t.test(version_a, version_b)
#> 	Welch Two Sample t-test
#>
#> data:  version_a and version_b
#> t = 3.2438, df = 99997, p-value = 0.00118
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  0.08076842 0.32739405
#> sample estimates:
#> mean of x mean of y
#>  30.23085  30.02677
```

The p-value is 0.00118. That is far below the usual 0.05 cutoff, so by the textbook rule the new page is "significantly" faster. The walk-through: `rnorm()` drew 50,000 random checkout times for each page, `t.test()` compared their averages, and the tiny p-value says a gap this size is very unlikely to be pure chance.

Now ask the question the p-value never answers: how much faster? Let us look at the actual averages.

```r title="Show the actual size of the gap"
mean(version_a)
#> [1] 30.23085
mean(version_b)
#> [1] 30.02677
mean(version_a) - mean(version_b)
#> [1] 0.2040812
```

The new page saves about 0.2 seconds. Two tenths of one second, on a page that takes half a minute. No human would ever notice that. The result is statistically significant and practically meaningless at the same time.

That gap is the whole topic of this tutorial. **Statistical significance** answers "is this effect probably real, or could it be random noise?" You measure it with a p-value. **Practical significance** answers "is this effect big enough to change a decision?" You measure it with the size of the effect, not its p-value.

![Two different questions, answered by two different tools.](screenshots/Statistical-vs-Practical-Significance-two-questions.webp)

*Figure 1: Two different questions, answered by two different tools.*

[NOTE]
**Statistical significance is about chance, not size.** A small p-value only says the effect is unlikely to be zero. It says nothing about whether the effect is large enough to matter, which is a completely separate question you have to answer yourself.

**Try it:** Express the 0.2-second gap as a percentage of the current page's average time. A number this small tells you at a glance how trivial the improvement is.

```r title="Your turn: gap as a percent"
# Target answer: about 0.675 (well under 1 percent)
# Replace the 0 with: (mean(version_a) - mean(version_b)) / mean(version_a) * 100
ex_pct <- 0
ex_pct
```

<details>
<summary>Click to reveal solution</summary>

```r title="Gap as a percent solution"
ex_pct <- (mean(version_a) - mean(version_b)) / mean(version_a) * 100
round(ex_pct, 3)
#> [1] 0.675
```

**Explanation:** The improvement is under 0.7 percent of the current checkout time. Dividing the raw gap by the baseline turns "0.2 seconds" into "basically nothing," which is exactly how a stakeholder would read it.

</details>

## Why do large samples make almost everything statistically significant?

Here is the uncomfortable truth behind the checkout example: with a big enough sample, almost any difference becomes statistically significant, no matter how tiny. To see why, you only need to know what a t-test actually measures.

A t-test builds a t-statistic, and the p-value comes from that number. The formula is short: the t-statistic is the size of the effect divided by the standard error. The standard error shrinks as the sample grows, because more data means a more precise estimate. So even a frozen, tiny effect produces a bigger and bigger t-statistic as you collect more data, which drives the p-value down toward zero.

Let us prove it. We will hold the difference fixed at exactly 0.2 seconds and the spread fixed at 10, then change only the sample size and watch the p-value.

```r title="Freeze the effect, grow the sample"
observed_diff <- 0.2   # same 0.2-second gap every time
spread <- 10           # same variability every time
sizes <- c(50, 500, 5000, 50000)

se <- spread * sqrt(2 / sizes)          # standard error of the difference
t_stat <- observed_diff / se            # effect divided by standard error
p_values <- 2 * pt(-abs(t_stat), df = 2 * sizes - 2)

data.frame(
  sample_size = sizes,
  p_value = round(p_values, 4),
  cohens_d = round(observed_diff / spread, 3)
)
#>   sample_size p_value cohens_d
#> 1          50  0.9205     0.02
#> 2         500  0.7519     0.02
#> 3        5000  0.3173     0.02
#> 4       50000  0.0016     0.02
```

Read down the `p_value` column: 0.92, then 0.75, then 0.32, then 0.0016. The exact same 0.2-second difference goes from "nowhere near significant" to "highly significant" purely because the sample got bigger. Nothing about the effect changed. The walk-through: `se` falls as `sizes` rises, so `t_stat` climbs, and `pt()` converts that into an ever-smaller p-value.

Now read the `cohens_d` column, which measures the effect in standard-deviation units (the next section builds it from scratch). It sits at 0.02 the whole way down. The size of the effect never moved. Only your certainty that it is not exactly zero did.

[KEY INSIGHT]
**Statistical significance grows with sample size.** A significant p-value is a joint statement about the effect and how much data you collected. Feed a trivial effect enough data and it will clear any significance threshold you like, which is why "significant" alone can never mean "important."

**Try it:** Rerun the sweep, but change the frozen difference from 0.2 to 2 seconds. A ten-times-bigger effect should turn significant at a much smaller sample size.

```r title="Your turn: sweep a 2-second gap"
# Target answer: significant (p under 0.05) by n = 500
ex_diff2 <- 2
ex_t2 <- ex_diff2 / se                  # reuse se and sizes from above
# Replace the 0 with: 2 * pt(-abs(ex_t2), df = 2 * sizes - 2)
ex_p2 <- 0
data.frame(sample_size = sizes, p_value = round(ex_p2, 4))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sweep a 2-second gap solution"
ex_diff2 <- 2
ex_t2 <- ex_diff2 / se
ex_p2 <- 2 * pt(-abs(ex_t2), df = 2 * sizes - 2)
data.frame(sample_size = sizes, p_value = round(ex_p2, 4))
#>   sample_size p_value
#> 1          50  0.3198
#> 2         500  0.0016
#> 3        5000  0.0000
#> 4       50000  0.0000
```

**Explanation:** A real 2-second effect reaches significance by n = 500, while the trivial 0.2-second effect needed n = 50,000. Bigger true effects need less data to detect, but a big enough sample eventually flags even the tiniest gap.

</details>

## How do you measure practical significance with effect size?

If the p-value cannot tell you whether an effect is big, what can? The answer is **effect size**: a number that measures the gap in a way that does not inflate with sample size. The most common one for comparing two means is Cohen's d, which expresses the difference in standard-deviation units.

The idea is simple. Instead of asking "how many seconds apart are the two averages," Cohen's d asks "how many standard deviations apart are they." Dividing by the spread makes the number comparable across studies and, crucially, independent of how many people you tested.

You have already seen the concept above, so here is the formula it comes from. Skip it if you like; the code right after does the same arithmetic.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_p}, \qquad s_p = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}}$$

Where:

- $\bar{x}_1 - \bar{x}_2$ = the raw gap between the two group averages
- $s_p$ = the pooled standard deviation, the typical spread combined across both groups
- $n_1, n_2$ = the two sample sizes
- $s_1^2, s_2^2$ = the two group variances

Let us turn that formula into a small function and run it on the checkout data.

```r title="Define cohens_d and apply it"
cohens_d <- function(x, y) {
  nx <- length(x); ny <- length(y)
  pooled_sd <- sqrt(((nx - 1) * var(x) + (ny - 1) * var(y)) / (nx + ny - 2))
  (mean(x) - mean(y)) / pooled_sd
}

cohens_d(version_a, version_b)
#> [1] 0.02051532
```

Cohen's d for the checkout test is 0.02. That is the same tiny number you saw in the sweep, and it does not care that we had 50,000 people per group. The walk-through: the function pools the two spreads into `pooled_sd`, then divides the raw mean gap by it, giving the effect in standard-deviation units.

How do you read a d of 0.02? Jacob Cohen offered rough benchmarks, still the most quoted starting point.

| Cohen's d | Rough label | What it feels like |
|---|---|---|
| 0.20 | Small | Detectable only with care |
| 0.50 | Medium | Visible to the naked eye |
| 0.80 | Large | Obvious, hard to miss |

At 0.02, the checkout effect is far below even "small." Now contrast that with an effect that genuinely matters: a drug trial where the treatment lifts a score by 12 points.

```r title="Contrast a genuinely large effect"
set.seed(404)
placebo <- rnorm(60, mean = 100, sd = 15)
active  <- rnorm(60, mean = 112, sd = 15)

t.test(active, placebo)$p.value
#> [1] 1.293809e-06
cohens_d(active, placebo)
#> [1] 0.9324492
```

Here the p-value is tiny (0.0000013) and the effect size is large (d = 0.93). This is what you want: a result that is both real and big. The walk-through: `t.test()$p.value` pulls out just the p-value, and `cohens_d()` reports a gap of nearly one full standard deviation, which lands well past Cohen's "large" mark.

[TIP]
**Report an effect size next to every p-value.** The p-value tells a reader the effect is probably not zero; the effect size tells them whether to care. Journals and A/B testing platforms increasingly require both for exactly this reason.

**Try it:** A tutoring program is tested on 40 students before and after. Compute Cohen's d for the improvement using the `cohens_d()` function you just wrote.

```r title="Your turn: effect size of a tutoring program"
set.seed(505)
ex_before <- rnorm(40, mean = 70, sd = 8)
ex_after  <- rnorm(40, mean = 74, sd = 8)

# Target answer: about 0.61 (a medium-to-large effect)
# Replace the 0 with: cohens_d(ex_after, ex_before)
ex_d <- 0
round(ex_d, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tutoring program effect size solution"
ex_d <- cohens_d(ex_after, ex_before)
round(ex_d, 2)
#> [1] 0.61
```

**Explanation:** The tutoring program has a Cohen's d of 0.61, a medium-to-large effect. Unlike a p-value, this number would read the same whether the class had 40 students or 40,000.

</details>

## How do confidence intervals show practical significance?

Effect size gives you one number for the gap. A confidence interval gives you something even more useful: the plausible range for the true effect. If the entire range is trivially small, the effect is trivially small, even when the p-value is far below 0.05.

A 95 percent confidence interval is the band of values that are consistent with your data. The t-test already computed one for the checkout gap. Let us pull it out on its own.

```r title="Confidence interval for the checkout gap"
t.test(version_a, version_b)$conf.int
#> [1] 0.08076842 0.32739405
#> attr(,"conf.level")
#> [1] 0.95
```

The interval runs from 0.08 to 0.33 seconds. Two things jump out. First, it does not include zero, which is another way of seeing the result is statistically significant. Second, and more important, even the most optimistic end of the range is a third of a second. The best case is still nothing a customer would feel. The walk-through: `$conf.int` extracts the two bounds, and both sit far below anything a person would notice.

Compare that to the drug trial, where the interval tells a very different story.

```r title="Confidence interval for the drug effect"
t.test(active, placebo)$conf.int
#> [1]  7.990146 18.112955
#> attr(,"conf.level")
#> [1] 0.95
```

The drug's interval runs from about 8 to 18 points. Even the worst case, an 8-point lift, is a meaningful improvement. The interval is not just away from zero; it is entirely inside "this matters" territory. That is practical significance you can see at a glance.

[NOTE]
**A confidence interval does double duty.** Whether it excludes zero answers the significance question, and where it sits answers the magnitude question. Reading the whole interval, not just checking for zero, is the single fastest habit for telling the two kinds of significance apart.

**Try it:** Pull the lower and upper bounds of the drug interval into separate values using square-bracket indexing. The interval is just a length-two vector.

```r title="Your turn: extract the interval bounds"
ex_ci <- t.test(active, placebo)$conf.int
# Target answer: 7.99 and 18.11
# Replace the 0s with ex_ci[1] and ex_ci[2]
ex_low  <- 0
ex_high <- 0
round(c(ex_low, ex_high), 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract the interval bounds solution"
ex_ci <- t.test(active, placebo)$conf.int
ex_low  <- ex_ci[1]
ex_high <- ex_ci[2]
round(c(ex_low, ex_high), 2)
#> [1]  7.99 18.11
```

**Explanation:** A confidence interval is an ordinary vector, so `ex_ci[1]` and `ex_ci[2]` grab its two ends. Being able to read both bounds is what lets you judge the effect's size, not just its significance.

</details>

## How do you decide what counts as practically significant?

So far we have judged effects loosely: 0.2 seconds feels trivial, 12 points feels real. That gut feeling is not good enough for a real decision. The fix is to set a threshold before you run the test: the smallest effect that would actually change what you do. Researchers call this the smallest effect size of interest, or SESOI.

Setting the threshold up front stops you from rationalizing whatever result you happen to get. For the checkout page, suppose the team agrees in advance: a redesign is only worth shipping if it saves at least 3 seconds. Now the decision becomes mechanical. Compare the observed effect, and its whole confidence interval, against that 3-second line.

```r title="Compare the result to a pre-set threshold"
threshold <- 3   # smallest saving worth shipping for, in seconds

observed <- abs(mean(version_a) - mean(version_b))
ci_upper <- max(abs(t.test(version_a, version_b)$conf.int))

round(observed, 3)
#> [1] 0.204
round(ci_upper, 3)
#> [1] 0.327
ci_upper < threshold
#> [1] TRUE
```

The observed saving is 0.204 seconds and even the top of the confidence interval is 0.327 seconds. Both sit far below the 3-second threshold, so `ci_upper < threshold` returns `TRUE`. The verdict: statistically significant, but not practically significant. Do not ship it. The walk-through: we take the absolute effect and the largest plausible effect, then check that even the best case falls short of the line the team drew.

Every result lands in one of four boxes, depending on the two questions. The chart below maps them out.

![Every result sits somewhere on these two axes.](screenshots/Statistical-vs-Practical-Significance-decision-quadrant.webp)

*Figure 2: Every result sits somewhere on these two axes.*

The dangerous box is the bottom-right: statistically significant but practically trivial. That is where huge samples push almost everything, and where the checkout test landed.

[WARNING]
**Benchmarks are a fallback, not a verdict.** Cohen's 0.2 / 0.5 / 0.8 labels are convenient, but a "small" effect can be life-saving (a cheap pill that slightly lowers heart-attack risk across millions) and a "large" effect can be useless. Whenever you can, set your threshold from real-world costs and benefits, not from a generic table.

**Try it:** Apply the same threshold logic to the drug trial. If the team only cares about improvements of at least 5 points, check whether even the smallest plausible effect clears that bar.

```r title="Your turn: threshold decision for the drug"
ex_drug_ci <- t.test(active, placebo)$conf.int
# Target answer: TRUE (smallest plausible effect is 7.99, above 5)
# Replace the 0 with: min(abs(ex_drug_ci))
ex_smallest <- 0
ex_smallest > 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold decision for the drug solution"
ex_drug_ci <- t.test(active, placebo)$conf.int
ex_smallest <- min(abs(ex_drug_ci))
round(ex_smallest, 2)
#> [1] 7.99
ex_smallest > 5
#> [1] TRUE
```

**Explanation:** Even the most pessimistic plausible effect, 7.99 points, clears the 5-point threshold. So the drug is both statistically and practically significant: the whole confidence interval sits above what the team cares about.

</details>

## Complete Example: A/B Test Decision From Start to Finish

Let us put every piece together on the kind of test a real company runs. Your site gets heavy traffic, so an experiment collects 2,000,000 visitors per variant. You are testing whether a new landing page lifts the signup rate above the current 12.0 percent. The new page truly converts a hair better, at 12.1 percent. With traffic this large, the test will be significant. The real question is whether a hair is worth shipping.

First, simulate the two variants and run a proportion test, which compares two conversion rates.

```r title="Run the A/B test at scale"
set.seed(606)
visitors <- 2000000
conv_old <- rbinom(1, visitors, 0.1200)   # signups on the current page
conv_new <- rbinom(1, visitors, 0.1210)   # signups on the new page

signups <- prop.test(c(conv_new, conv_old), c(visitors, visitors))
signups
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(conv_new, conv_old) out of c(visitors, visitors)
#> X-squared = 5.6741, df = 1, p-value = 0.01722
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  0.0001373234 0.0014136766
#> sample estimates:
#>    prop 1    prop 2
#> 0.1207215 0.1199460
```

The p-value is 0.01722, comfortably under 0.05. The new page is statistically significantly better. If you stopped here, you would ship it. But you know better now, so measure the size of the win.

```r title="Measure the lift and its range"
rate_old <- conv_old / visitors
rate_new <- conv_new / visitors
round(c(rate_old, rate_new), 5)
#> [1] 0.11995 0.12072

lift_pp <- (rate_new - rate_old) * 100      # lift in percentage points
round(lift_pp, 4)
#> [1] 0.0775

round(signups$conf.int * 100, 4)            # same interval, in percentage points
#> [1] 0.0137 0.1414
#> attr(,"conf.level")
#> [1] 0.95
```

The lift is 0.0775 percentage points, and the confidence interval says the true lift is somewhere between 0.014 and 0.14 percentage points. Even the optimistic end, 0.14 points, means fewer than 3 extra signups per 2,000 visitors. The walk-through: we convert the raw counts into rates, take the difference as a percentage point lift, and rescale the test's interval into the same units so it is easy to read.

Now make the call with a pre-set threshold. Suppose the product team decided beforehand that a redesign has to lift signups by at least 0.5 percentage points to justify the engineering and risk. The entire confidence interval, top included, is below 0.5. So the honest decision is: significant, yes, but do not ship. The win is too small to be worth the cost.

[KEY INSIGHT]
**A tiny effect can be rock-solid and still not worth shipping.** At two million visitors, a 0.08 percentage point lift is statistically certain and commercially pointless. The p-value confirmed the effect is real; the effect size and threshold told you it was too small to act on. That is the entire difference between statistical and practical significance, in one decision.

## Practice Exercises

These combine the ideas above. Try each before opening the solution. The exercises use their own variable names, so they will not disturb the earlier examples.

### Exercise 1: Significant is not the only question

Two teaching methods are compared on 80 students each. Run a t-test to check statistical significance, then compute Cohen's d. What do you conclude when the p-value and the effect size seem to disagree?

```r title="Exercise 1: test and size a teaching effect"
set.seed(707)
method_x <- rnorm(80, mean = 75, sd = 10)
method_y <- rnorm(80, mean = 78, sd = 10)

# 1. Get the p-value from t.test()
# 2. Get Cohen's d from cohens_d()
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
round(t.test(method_y, method_x)$p.value, 4)
#> [1] 0.1086
round(cohens_d(method_y, method_x), 3)
#> [1] 0.255
```

**Explanation:** The p-value is 0.1086, above 0.05, so the difference is not statistically significant. Yet Cohen's d is 0.255, a real small-to-medium effect. The two do not actually disagree: with only 80 students the study is underpowered, so a genuine effect fails to reach significance. Not significant does not mean no effect; it can mean not enough data.

</details>

### Exercise 2: Find where a trivial effect turns significant

A frozen effect of d = 0.1 is tested at growing sample sizes. Using the same deterministic approach from the sweep earlier, find the smallest sample size in the list where the p-value drops below 0.05. Confirm the effect size never changes.

```r title="Exercise 2: locate the significance tipping point"
d_target <- 0.1
ex_sizes <- c(100, 500, 1000, 2000, 5000)

# Build the p-value at each size (work in SD units, so spread = 1)
# Hint: ex_se <- sqrt(2 / ex_sizes); ex_t <- d_target / ex_se
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
d_target <- 0.1
ex_sizes <- c(100, 500, 1000, 2000, 5000)
ex_se <- sqrt(2 / ex_sizes)
ex_t <- d_target / ex_se
ex_p <- 2 * pt(-abs(ex_t), df = 2 * ex_sizes - 2)
data.frame(sample_size = ex_sizes, p_value = round(ex_p, 4))
#>   sample_size p_value
#> 1         100  0.4803
#> 2         500  0.1142
#> 3        1000  0.0255
#> 4        2000  0.0016
#> 5        5000  0.0000
```

**Explanation:** The p-value crosses 0.05 between n = 500 and n = 1000; by n = 1000 it is 0.0255. The effect size stayed frozen at d = 0.1 the whole time. Significance was bought with sample size, not with a bigger effect.

</details>

### Exercise 3: The full workflow on one result

An ed-tech company tests a new app feature on 10,000 students and measures test scores. Run the complete practical-significance workflow: get the p-value, the effect size, and the confidence interval, then decide against a threshold of 2 points (the smallest score gain the company would act on).

```r title="Exercise 3: full workflow on test scores"
set.seed(909)
control_scores <- rnorm(10000, mean = 72.0, sd = 12)
feature_scores <- rnorm(10000, mean = 72.5, sd = 12)

# 1. p-value from t.test()
# 2. Cohen's d from cohens_d()
# 3. confidence interval from t.test()$conf.int
# 4. is the whole interval below the 2-point threshold?
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
tt <- t.test(feature_scores, control_scores)
round(tt$p.value, 5)
#> [1] 0.00087
round(mean(feature_scores) - mean(control_scores), 3)
#> [1] 0.566
round(cohens_d(feature_scores, control_scores), 3)
#> [1] 0.047
round(tt$conf.int[1:2], 3)
#> [1] 0.233 0.899
max(tt$conf.int) < 2
#> [1] TRUE
```

**Explanation:** The result is statistically significant (p = 0.00087) but the effect is negligible: Cohen's d is 0.047 and the whole confidence interval, 0.23 to 0.90 points, sits below the 2-point threshold. The feature raises scores by well under a point. Significant, but not worth acting on.

</details>

## Summary

Statistical significance and practical significance answer two different questions, and a good analysis reports both. The table below is your quick reference.

| Concept | Question it answers | Tool in R |
|---|---|---|
| Statistical significance | Is the effect probably real? | `t.test()`, `prop.test()` p-value |
| Practical significance | Is the effect big enough to matter? | Cohen's d, effect size |
| Plausible range | How big could the true effect be? | `t.test()$conf.int` |
| Decision rule | Does it clear my threshold? | Compare effect and interval to a pre-set SESOI |

The one habit that keeps you out of trouble: never read a p-value on its own. Pair it with an effect size and a confidence interval, and judge both against a threshold you set before seeing the data. The mindmap below recaps the whole picture.

![The whole picture at a glance.](screenshots/Statistical-vs-Practical-Significance-overview-mindmap.webp)

*Figure 3: The whole picture at a glance.*

Key takeaways:

- A small p-value means "unlikely to be chance," not "big enough to matter."
- Large samples make almost any difference statistically significant, so significance alone is a weak signal.
- Effect size (like Cohen's d) measures the magnitude of an effect and does not inflate with sample size.
- A confidence interval shows both significance and magnitude at once; read the whole interval, not just whether it excludes zero.
- Decide with a threshold set in advance, ideally from real-world costs and benefits rather than a generic benchmark table.

## Frequently Asked Questions

A few questions come up again and again once people see the gap between the two kinds of significance. Here are quick answers.

### Can a result be practically significant but not statistically significant?

Yes. A real, meaningful effect measured in a small or underpowered study can easily miss the p < 0.05 cutoff, exactly as you saw in Exercise 1. That is why you report the effect size and confidence interval too: they reveal a genuine effect that a p-value alone would let you dismiss as "not significant."

### Is a p-value of 0.001 more practically significant than a p-value of 0.04?

No. A smaller p-value means you are more confident the effect is not exactly zero, not that the effect is bigger. Two results with wildly different p-values can have identical effect sizes. Practical size comes from the effect size and confidence interval, never from how small the p-value is.

### What effect size should I use for two proportions instead of two means?

For two means, Cohen's d is the standard choice. For two proportions, the most decision-relevant number is usually the plain difference in rates, measured in percentage points, together with its confidence interval, as in the complete example above. Cohen's h is a standardized alternative when you need one comparable across studies.

### How do I choose the smallest effect size of interest?

Set it from real-world costs and benefits whenever you can: the smallest improvement that would actually change your decision, given what the change costs. A generic benchmark table is only a last resort. Ask "how big would the effect have to be for us to act?" and use that number as your threshold, decided before you see the data.

### Does a larger sample size make my results more practically significant?

No. A larger sample makes tiny effects easier to detect statistically, but it does not change how big the effect actually is. If anything, a very large sample widens the gap between statistical and practical significance, because it will flag effects far too small to matter.

## References

1. Sullivan, G. M. & Feinn, R. (2012). Using Effect Size, or Why the P Value Is Not Enough. *Journal of Graduate Medical Education*. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3444174/). The short paper this whole tutorial builds on: why a p-value alone never tells you if an effect matters.
2. Lakens, D. (2013). Calculating and reporting effect sizes to facilitate cumulative science. *Frontiers in Psychology*. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3840331/). A practical how-to for computing and reporting Cohen's d and other effect sizes.
3. Lakens, D., Scheel, A. M. & Isager, P. M. (2018). Equivalence Testing for Psychological Research: A Practical Primer. *Advances in Methods and Practices in Psychological Science*. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5502906/). Introduces equivalence testing, the formal way to declare an effect too small to care about.
4. R Core Team. `t.test` {stats} reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html). Official docs for the function behind every p-value and confidence interval on this page.
5. R Core Team. `prop.test` {stats} reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html). Official docs for comparing two proportions, as in the A/B test example.
6. Wikipedia. Effect size. [Link](https://en.wikipedia.org/wiki/Effect_size). A broad catalogue of effect-size measures beyond Cohen's d.
7. Wikipedia. Clinical significance (statistical vs practical significance). [Link](https://en.wikipedia.org/wiki/Clinical_significance). The clinical framing of the same statistical-versus-practical distinction.
8. R Core Team. *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html). A refresher on the base-R basics this tutorial assumes.

## Continue Learning

- [Effect Size in R](Effect-Size-in-R.html): go deeper into Cohen's d, eta-squared, and correlation-based effect sizes, the numbers that quantify practical significance.
- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html): understand the framework that produces the p-value in the first place, so you know exactly what "significant" claims.
- [Power Analysis in R](Statistical-Power-Analysis-in-R.html): plan a sample size big enough to detect an effect that matters, instead of one so big it flags effects that do not.

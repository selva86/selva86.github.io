---
title: "Choosing Statistical Tests Lesson 5: Reporting effect size, not just significance"
catalog_blurb: "Why a significant result and a big result are not the same thing."
description: "A tutoring pilot's t-test gives p = 0.037. Cohen's d, a correlation and a risk ratio show how big that effect actually is, and why size and significance differ."
keywords: "Cohen's d, effect size, point-biserial correlation, risk ratio, statistical significance vs effect size, confidence interval for effect size, Hedges and Olkin standard error, effect size in R, p-value and effect size, R"
post_type: "LESSON"
curriculum_id: "4.40.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "5"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: "Equivalence-Testing-with-TOST.html"
course_prev: "Permutation-and-Randomization-Tests.html"
---

=== step === cover
## Reporting effect size, not just significance

Today let's understand effect size: the question a p-value never answers, which is how big a result actually is.

Here is the pilot we will use throughout. A school tries out a weekly tutoring program. 12 students get the tutoring, another 12 get the standard program instead, and after a term all 24 sit the same 50-point test. The tutored group averages 36.5. The standard group averages 31.17. A t-test run on these 24 scores gives t = 2.22, p = 0.037, so the gap clears the usual 0.05 bar.

But p = 0.037 only says the gap is unlikely to be pure noise. It says nothing about whether 5.33 points, out of 50, is a result worth changing a program for. That is a separate question, and it is the one this lesson answers.

The chart below shows the 24 scores split by group. Switch between the boxplot and the point view to see the same gap two ways.

::widget chart-plotter {"data":[{"x":"tutored","y":38},{"x":"tutored","y":37},{"x":"tutored","y":30},{"x":"tutored","y":34},{"x":"tutored","y":40},{"x":"tutored","y":40},{"x":"tutored","y":31},{"x":"tutored","y":36},{"x":"tutored","y":28},{"x":"tutored","y":36},{"x":"tutored","y":45},{"x":"tutored","y":43},{"x":"standard","y":32},{"x":"standard","y":39},{"x":"standard","y":37},{"x":"standard","y":34},{"x":"standard","y":27},{"x":"standard","y":32},{"x":"standard","y":39},{"x":"standard","y":36},{"x":"standard","y":29},{"x":"standard","y":20},{"x":"standard","y":29},{"x":"standard","y":20}],"geoms":["boxplot","point"],"x":"group","y":"score"}

=== step === concept
## The raw difference, in the test's own units

Start with the plainest number there is: how far apart are the two group averages, in the units the test was actually scored in.

```r
# Compute each group's mean score and the raw gap between them
tutored <- c(38, 37, 30, 34, 40, 40, 31, 36, 28, 36, 45, 43)
standard <- c(32, 39, 37, 34, 27, 32, 39, 36, 29, 20, 29, 20)

group_means <- tapply(c(tutored, standard), rep(c("tutored", "standard"), each = 12), mean)
group_means
round(group_means["tutored"] - group_means["standard"], 2)
#> standard  tutored 
#> 31.16667 36.50000 
#> tutored 
#>    5.33 
```

The tutored group scores 5.33 points higher on average. That is the **raw difference**, and it is already a complete, meaningful number: a teacher reading this result does not need anything standardized to understand it. 5.33 points, out of 50, is just 5.33 points.

But the raw difference has a limit. It is tied to this test's own scale. If the test had been out of 100 instead of 50, the same underlying improvement could show up as twice the gap, a bigger-looking number for the exact same effect. So a raw difference from one test cannot be compared to a raw difference from a different test, or a different outcome, unless both are measured on the same scale.

That is the gap the next few numbers are built to close.

=== step === concept
## Cohen's d: the raw difference standardized by the pooled spread

To compare an effect across different scales, divide the raw gap by something both groups share: how spread out their scores are.

First, compute each group's own spread, its standard deviation:

```r
# Compute the pooled standard deviation and Cohen's d by hand
tutored <- c(38, 37, 30, 34, 40, 40, 31, 36, 28, 36, 45, 43)
standard <- c(32, 39, 37, 34, 27, 32, 39, 36, 29, 20, 29, 20)
n1 <- length(tutored)
n2 <- length(standard)

pooled_sd <- sqrt(((n1 - 1) * var(tutored) + (n2 - 1) * var(standard)) / (n1 + n2 - 2))
d <- (mean(tutored) - mean(standard)) / pooled_sd

round(pooled_sd, 2)
round(d, 2)
#> [1] 5.87
#> [1] 0.91
```

The tutored group's scores spread with a standard deviation of 5.16. The standard group's scores spread wider, with a standard deviation of 6.51. `pooled_sd` blends the two into one number, 5.87, weighted by each group's sample size, which here is the same for both. This pooled standard deviation is the spread the data themselves show, combining both groups into a single yardstick.

Now divide the raw gap by that yardstick. This is **Cohen's d**:

\[ d = \frac{\bar{x}_{tutored} - \bar{x}_{standard}}{s_p} \]

where \(\bar{x}_{tutored}\) and \(\bar{x}_{standard}\) are the two group means and \(s_p\) is the pooled standard deviation:

\[ s_p = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}} \]

d comes out to 0.91. Because d divides points by points, the units cancel, and what is left is a count of pooled standard deviations: the tutored group sits 0.91 pooled standard deviations above the standard group. That count means the same thing on any test, out of 50 or out of 500, a property the raw difference does not have.

Jacob Cohen, who introduced this measure, proposed rough bands for reading it: 0.2 is a small effect, 0.5 a medium one, 0.8 a large one. At 0.91, this pilot's effect counts as large by that convention.

=== step === concept
## A correlation effect size for the same two groups

d standardizes a difference between two means. There is a second way to size up the same two groups, built instead on correlation, which you already know from any other pair of numeric variables.

Code which program each student was in as a number, 1 for tutored and 0 for standard, and correlate that code with the score:

```r
# Code the group as 1 for tutored and 0 for standard, then correlate it with the score
tutored <- c(38, 37, 30, 34, 40, 40, 31, 36, 28, 36, 45, 43)
standard <- c(32, 39, 37, 34, 27, 32, 39, 36, 29, 20, 29, 20)

score <- c(tutored, standard)
group_code <- rep(c(1, 0), each = 12)

round(cor(group_code, score), 2)
#> [1] 0.43
```

That 0.43 is a **point-biserial correlation**: an ordinary Pearson correlation, computed exactly the way you would for any two numeric columns, except one of the two columns here only ever takes the values 0 and 1. It still lands on the familiar -1 to 1 scale, with 0 meaning the group a student was in told you nothing about their score, and 1 meaning it told you everything.

d and the point-biserial correlation are measuring the same 24 scores, but they answer two different questions. d asks how far apart the two group means sit, in pooled standard deviations. The correlation asks how strongly knowing a student's group lets you predict their score. They will not generally agree in size, because they are not the same question asked twice.

=== step === widget
## A risk ratio: effect size for a yes-or-no reading of the same data

d and the correlation both treat the score as a number on a scale. Sometimes the question that actually matters is simpler than that: did the test take the student over some line, pass or fail, yes or no.

Pick a line. Call 36 points or more a pass. Count how often each group clears it.

```r
# Dichotomize both groups at 36 points and compute the risk ratio
tutored <- c(38, 37, 30, 34, 40, 40, 31, 36, 28, 36, 45, 43)
standard <- c(32, 39, 37, 34, 27, 32, 39, 36, 29, 20, 29, 20)

tutored_pass_rate <- mean(tutored >= 36)
standard_pass_rate <- mean(standard >= 36)

round(tutored_pass_rate, 3)
round(standard_pass_rate, 3)
round(tutored_pass_rate / standard_pass_rate, 2)
#> [1] 0.667
#> [1] 0.333
#> [1] 2
```

8 of the 12 tutored students pass, a rate of 0.667. 4 of the 12 standard students pass, a rate of 0.333. Divide one rate by the other and you get a **risk ratio** of 2.0: a tutored student is twice as likely to pass as a standard student.

This collapses the same 24 continuous scores already used above down to a single yes-or-no line. That throws information away, so it is not always the right choice. But it is sometimes exactly the question a stakeholder is asking, not "how many points higher" or "how strongly correlated," but plainly, did this work.

The chart below plots the two pass rates side by side.

::widget chart-plotter {"data":[{"x":"tutored","y":0.667},{"x":"standard","y":0.333}],"geoms":["bar"],"x":"group","y":"pass rate"}

=== step === quiz
## Quick check: three readings of one gap

A colleague reports a result from this same pilot: "the risk ratio was 2.0." Which of the four numbers computed so far is that?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Cohen's d, the raw gap divided by the pooled standard deviation. ::no
- The point-biserial correlation between group and score. ::no
- The risk ratio: the tutored pass rate divided by the standard pass rate. ::ok Right. A risk ratio compares two proportions, the tutored pass rate over the standard pass rate, 0.667 over 0.333, giving 2.0. Cohen's d and the point-biserial correlation are both built from the raw scores, not from pass rates, and the raw difference, 5.33 points, carries no ratio in it at all.
- The raw difference in points between the two group means. ::no Cohen's d divides the mean gap by the pooled standard deviation, giving 0.91, a count of standard deviations, not a ratio of proportions. The point-biserial correlation, 0.43, sits on the familiar -1 to 1 scale, not a ratio either. The raw difference, 5.33 points, is in the test's own units, with no standardizing or ratio involved. Only the risk ratio, 2.0, compares two proportions directly.

=== step === widget
## Significance and magnitude are not the same axis

Every number so far has measured size. None of them has anything to do with whether a gap is statistically significant. The next two pilots show why confusing the two is a mistake worth guarding against.

First, imagine the tutoring program rolled out to 4,000 students per arm, and imagine its true effect is tiny, d = 0.05.

```r
# Simulate a 4,000-per-arm rollout with a true effect too small to matter, d = 0.05
set.seed(1)
standard_big <- rnorm(4000, mean = 32, sd = 6)
tutored_big <- rnorm(4000, mean = 32.4, sd = 6)

pooled_sd_big <- sqrt((var(tutored_big) + var(standard_big)) / 2)
d_big <- (mean(tutored_big) - mean(standard_big)) / pooled_sd_big
round(d_big, 2)

t.test(tutored_big, standard_big)
#> [1] 0.05
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  tutored_big and standard_big
#> t = 2.2587, df = 7989.1, p-value = 0.02393
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  0.04080851 0.57683123
#> sample estimates:
#> mean of x mean of y 
#>  32.31500  32.00618 
```

d = 0.05 is tiny, a quarter of what Cohen called a small effect. But with 4,000 students in each arm, the t-test still clears the 0.05 bar: p = 0.024. A large enough sample can make almost any real difference, however small, come back significant.

The picture below is the shape behind that p-value: a null distribution, standardized so that any t-statistic can be placed on it, with the p-value read off as the shaded tail. Drag the marker and watch the shaded area change.

::widget null-distribution {"tails": 2, "max": 3, "start": 2.26, "label": "t, 4000 per arm"}

Now the opposite pilot. A true effect large enough to matter, d = 1.49, but tried on only 5 students per arm.

```r
# Simulate a 5-per-arm pilot with a true effect large enough to matter, d = 1.49
set.seed(4)
standard_small <- round(rnorm(5, mean = 32, sd = 6))
tutored_small <- round(rnorm(5, mean = 42, sd = 6))

pooled_sd_small <- sqrt((4 * var(tutored_small) + 4 * var(standard_small)) / 8)
d_small <- (mean(tutored_small) - mean(standard_small)) / pooled_sd_small
round(d_small, 2)

t.test(tutored_small, standard_small)
#> [1] 1.49
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  tutored_small and standard_small
#> t = 2.3623, df = 6.5024, p-value = 0.05289
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.16733 20.16733
#> sample estimates:
#> mean of x mean of y 
#>      45.4      35.4 
```

d = 1.49 is well past Cohen's large band. But with only 5 students in each arm, the same t-test misses the bar: p = 0.053. A real, sizeable effect can fail to reach significance simply because too few students were tested.

Put the two pilots side by side. A large sample turned a trivial effect significant. A small sample kept a large effect from reaching significance. Significance answers "how sure are we this is not noise." Effect size answers "how big is it." A result can be one without being the other.

=== step === concept
## The interval around an effect size most papers leave off

d = 0.91 is a single number, a point estimate. Like any estimate from a sample, it carries uncertainty, and that uncertainty is rarely reported alongside it.

Hedges and Olkin worked out an approximate standard error for d, built from the two sample sizes and d itself:

\[ SE(d) = \sqrt{\frac{n_1+n_2}{n_1 n_2} + \frac{d^2}{2(n_1+n_2-2)}} \]

Apply it to this pilot's own numbers, n1 = 12, n2 = 12, d = 0.91, and build a 95% interval around d the same way you would around any estimate, plus or minus 1.96 standard errors:

```r
# Compute the standard error of Cohen's d (Hedges and Olkin) and its 95% interval
tutored <- c(38, 37, 30, 34, 40, 40, 31, 36, 28, 36, 45, 43)
standard <- c(32, 39, 37, 34, 27, 32, 39, 36, 29, 20, 29, 20)
n1 <- length(tutored)
n2 <- length(standard)

pooled_sd <- sqrt(((n1 - 1) * var(tutored) + (n2 - 1) * var(standard)) / (n1 + n2 - 2))
d <- (mean(tutored) - mean(standard)) / pooled_sd

se_d <- sqrt((n1 + n2) / (n1 * n2) + d^2 / (2 * (n1 + n2 - 2)))
ci_lower <- d - 1.96 * se_d
ci_upper <- d + 1.96 * se_d

round(se_d, 2)
round(c(ci_lower, ci_upper), 2)
#> [1] 0.43
#> [1] 0.06 1.75
```

The standard error of d is 0.43, and the 95% interval runs from 0.06 to 1.75.

Read "d = 0.91, a large effect" on its own and the result sounds settled. But the interval it actually sits inside stretches from 0.06, barely above zero, all the way to 1.75, more than Cohen's large band on its own. With only 12 students per arm, this pilot's d could just as easily describe a nearly negligible effect as a huge one. That range is invisible unless it is reported beside the point estimate, which is exactly why it is worth computing.

=== step === quiz
## Quick check: what to report, and what the data support

A new two-group study, run on a very large sample, reports p = 0.01. Its own write-up adds that the actual gap between the two groups is tiny next to how much the outcome naturally varies. What should you do before deciding this result is worth acting on?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Treat p = 0.01 as proof the effect is big enough to matter. ::no
- Ask for the effect size and its confidence interval before deciding whether the result is worth acting on. ::ok Right. A p-value on its own never says how big an effect is, however large the sample. Ask for the effect size and its interval first, the way the tutoring pilot's own d and its 0.06-to-1.75 interval were asked for here, before deciding a result is worth acting on.
- Since the gap sounds small, conclude there is no real effect at all. ::no
- Rerun the same test on an even bigger sample to get a clearer answer. ::no A small p-value at a large sample size can come from a tiny, unimportant effect, the same way the 4,000-per-arm rollout reached p = 0.024 on a d of just 0.05. A result that misses significance is not proof of zero effect either, the way the 5-per-arm pilot missed 0.05 on a d of 1.49. And a bigger sample does not fix a missing number: it only answers the significance question more precisely, while the effect size itself still has to be computed and reported.

=== step === tryit
## Your turn: size a new result

A customer-support team tests two onboarding scripts on new hires. Script A is tried by 10 new hires, Script B by another 10, and each new hire is scored out of 100 by a trainer after their first week.

Fill in the pooled standard deviation, Cohen's d, and the standard error of d, then say in a comment whether the 95% interval crosses zero.

```r
# Fill in the pooled sd, Cohen's d, and the standard error of d, then say whether the interval crosses zero
groupA <- c(81, 65, 73, 75, 73, 69, 82, 69, 86, 69)
groupB <- c(71, 79, 50, 59, 60, 66, 59, 40, 41, 72)
n1 <- length(groupA)
n2 <- length(groupB)

# Compute the pooled standard deviation here, using var() and sqrt(), the same way as the tutoring pilot
pooled_sd <- NA

# Compute Cohen's d here: the mean difference over the pooled sd
d <- NA

# Compute the standard error of d here (Hedges and Olkin), using sqrt(), then build the 95% interval with 1.96
se_d <- NA
ci_lower <- d - 1.96 * se_d
ci_upper <- d + 1.96 * se_d

round(d, 2)
round(c(ci_lower, ci_upper), 2)

# Does the 95% interval cross zero? Answer here:
```
::check {"regex": "(?=[\\s\\S]*sqrt[(])(?=[\\s\\S]*(var[(]|sd[(]))(?=[\\s\\S]*1\\.96)", "gate": true, "difficulty": "intermediate", "ok": "Right: pooled sd = 10.38, d = 1.4, and a 95% interval running from 0.41 to 2.38. That interval sits entirely above zero, so this is unlikely to be nothing.", "no": "Build pooled_sd from var() and sqrt(), the same way the tutoring pilot's calculation did. Then get se_d with sqrt() again, and the interval with 1.96 times se_d on each side of d."}
::solution
```r
# Complete the pooled sd, Cohen's d, and the standard error of d, then say whether the interval crosses zero
groupA <- c(81, 65, 73, 75, 73, 69, 82, 69, 86, 69)
groupB <- c(71, 79, 50, 59, 60, 66, 59, 40, 41, 72)
n1 <- length(groupA)
n2 <- length(groupB)

pooled_sd <- sqrt(((n1 - 1) * var(groupA) + (n2 - 1) * var(groupB)) / (n1 + n2 - 2))
d <- (mean(groupA) - mean(groupB)) / pooled_sd

se_d <- sqrt((n1 + n2) / (n1 * n2) + d^2 / (2 * (n1 + n2 - 2)))
ci_lower <- d - 1.96 * se_d
ci_upper <- d + 1.96 * se_d

round(d, 2)
round(c(ci_lower, ci_upper), 2)
#> [1] 1.4
#> [1] 0.41 2.38

# Does the 95% interval cross zero? No, it runs from 0.41 to 2.38, entirely above zero.
```

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences](https://search.worldcat.org/title/17877467) - Cohen, J. (1988). The source of the small, medium and large bands, 0.2, 0.5 and 0.8, used to read Cohen's d in this lesson.
- [Statistical Methods for Meta-Analysis](https://shop.elsevier.com/books/statistical-methods-for-meta-analysis/hedges/978-0-12-336380-0) - Hedges, L.V. & Olkin, I. (1985). The source of the standard error of d used to build the confidence interval around it.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein, R.L. & Lazar, N.A. (2016), The American Statistician 70(2), 129-133. A formal statement on what a p-value does and does not measure, including that it is not a measure of effect size.
- [Understanding the New Statistics: Effect Sizes, Confidence Intervals, and Meta-Analysis](https://www.routledge.com/Understanding-The-New-Statistics-Effect-Sizes-Confidence-Intervals-and/Cumming/p/book/9780415879682) - Cumming, G. (2012). A full treatment of reporting effect sizes and their intervals in place of a bare significance verdict.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button, K.S. et al. (2013), Nature Reviews Neuroscience. A worked case for why a small study's effect size estimate, like the tutoring pilot's own, carries more uncertainty than a lone point estimate reveals.

=== step === complete
## Report the size, not just the verdict

The same 24 students, tutored and standard, gave four separate numbers in this lesson: a raw difference of 5.33 points, a Cohen's d of 0.91, a point-biserial correlation of 0.43, and a risk ratio of 2.0. None of those four is more correct than the others. Each answers a different question about the same gap, in points, in pooled standard deviations, in correlation, in pass rates, and a reader gets to pick whichever one answers the question they actually have.

The two simulated pilots then separated that size question from the significance question. 4,000 students per arm turned a d of 0.05, trivial by any standard, into p = 0.024, well below 0.05. 5 students per arm kept a d of 1.49, well past Cohen's large band, at p = 0.053, just above 0.05. Significant and large are not names for the same thing.

And the interval around this pilot's own d, running from 0.06 to 1.75, showed that even a single point estimate like "d = 0.91" can overstate how settled a result really is.

So when a result comes in, report the effect size next to the p-value, and report the interval around that effect size too. A verdict of significant or not significant is never the whole answer.

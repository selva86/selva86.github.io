---
title: "Which Test Do I Run? Lesson 2: Welch's ANOVA: the test for unequal group variances"
slug: "Which-Test-Mini-2"
description: "The classic one-way ANOVA pools every group variance into one number. See where that breaks, then run Welch's ANOVA on departments with unequal pay spread."
keywords: "Welch's ANOVA in R, oneway.test, unequal variances ANOVA, homogeneity of variance, Bartlett test in R, one-way ANOVA assumptions, Satterthwaite degrees of freedom"
mathjax: true
webr: true
date: "2026-09-05"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "2"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-1"
course_next: ""
curriculum_id: "0.0.13"
lesson_access: "windowed"
catalog_blurb: "How to compare group averages when one group is far more spread out."
---

=== step === cover
## Welch's ANOVA: the test for unequal group variances

Today we are going to take one company's payroll and find out why the usual test for comparing three group averages reports a difference on it that is not there.

Here is the situation. One company has 72 employees in three departments. Support has 30 people, Marketing has 30, and Engineering has 12. For every person we have one number: annual pay, in thousands of dollars.

Support and Marketing are ordinary salaried teams, so almost everyone in them earns something close to the middle of their band. Engineering is not like that. Its 12 people run from a first-year graduate up to two specialists on a band of their own, so their salaries sit much further apart.

That gap in spread is what the choice of test turns on. The classic one-way ANOVA is built on the idea that every group has the same spread, and once that is false its p-value no longer means what it is supposed to mean.

Getting there takes three steps, all on the same 72 salaries.

::widget process-flow {"steps":[{"title":"Look at the spread in each department","sub":"the size, mean and variance of each one"},{"title":"Run the classic one-way F-test","sub":"it replaces all three spreads with one pooled number"},{"title":"Run the Welch version","sub":"it weights each department by its own variance"}]}

The first one is just looking. The other two are one R function each.

=== step === concept
## The pay data from three departments

Let's build the data first, because every number from here on comes out of it.

The salaries are simulated with `rnorm()`, and that is deliberate: it lets us fix the truth ourselves. All three departments get the same true mean, 62 thousand. What differs is the true standard deviation, which is 4 for Support, 5 for Marketing, and 20 for Engineering.

So we already know the right answer to the question "do these three departments differ in average pay?". They do not. Any test that says they do is wrong, and we are going to watch one do exactly that.

Press Run.

```r
# Build the pay data for the three departments and summarise each one
set.seed(171)
salary <- data.frame(
  dept = factor(rep(c("Support", "Marketing", "Engineering"), times = c(30, 30, 12)),
                levels = c("Support", "Marketing", "Engineering")),
  pay  = c(rnorm(30, mean = 62, sd = 4),      # Support: 30 people, narrow band
           rnorm(30, mean = 62, sd = 5),      # Marketing: 30 people, narrow band
           rnorm(12, mean = 62, sd = 20))     # Engineering: 12 people, wide band
)

summ <- data.frame(
  n    = tapply(salary$pay, salary$dept, length),
  mean = tapply(salary$pay, salary$dept, mean),
  sd   = tapply(salary$pay, salary$dept, sd),
  var  = tapply(salary$pay, salary$dept, var)
)
round(summ, 1)
#>              n mean   sd   var
#> Support     30 61.5  4.6  21.6
#> Marketing   30 61.9  4.5  20.2
#> Engineering 12 68.5 15.8 249.1
```

`tapply()` splits `pay` by `dept` and applies a function to each piece, so one call gives one number per department. `summ` holds the full precision and we round only for printing, because the by-hand arithmetic later needs the exact values.

Now read the mean column. Support's mean came out at 61.5, Marketing's at 61.9, and Engineering's at 68.5. Engineering's mean sits 7.0 above Support's even though all three were built around the same 62.

That gap is sampling noise and nothing else. It is large because Engineering has only 12 people drawn from a wide band, and a department like that can land 7 points off the truth without anything unusual happening.

The sd column is where the trouble starts.

=== step === concept
## How unequal the three spreads are

Look at the var column again: 21.6 for Support, 20.2 for Marketing, and 249.1 for Engineering. Divide the largest by the smallest and you get 12.3, so Engineering's variance is more than twelve times Marketing's.

Variance is the average squared distance from a group's own mean, and its square root is the standard deviation. Support's 4.6 and Engineering's 15.8 are that same quantity in thousands of dollars, which makes them easier to hold against each other than the squared versions.

The boxplot below shows the same thing without any arithmetic. Each box covers the middle half of a department's salaries, from the 25th to the 75th percentile, and the line inside is the median.

::widget chart-plotter {"x":"dept_num","y":"pay","geoms":["boxplot","point"],"code":{"boxplot":"ggplot(pay_plot, aes(x = group, y = pay)) +\n  geom_boxplot()","point":"ggplot(pay_plot, aes(x = group, y = pay)) +\n  geom_point()"},"data":[{"x":1,"y":58.1,"fill":"Support"},{"x":1,"y":62.8,"fill":"Support"},{"x":1,"y":66.2,"fill":"Support"},{"x":1,"y":57.3,"fill":"Support"},{"x":1,"y":66.2,"fill":"Support"},{"x":1,"y":62.2,"fill":"Support"},{"x":1,"y":53.8,"fill":"Support"},{"x":1,"y":64.2,"fill":"Support"},{"x":1,"y":70.4,"fill":"Support"},{"x":1,"y":63.6,"fill":"Support"},{"x":1,"y":64.2,"fill":"Support"},{"x":1,"y":53.4,"fill":"Support"},{"x":1,"y":61.8,"fill":"Support"},{"x":1,"y":68.3,"fill":"Support"},{"x":1,"y":65.4,"fill":"Support"},{"x":1,"y":69.0,"fill":"Support"},{"x":1,"y":58.4,"fill":"Support"},{"x":1,"y":62.9,"fill":"Support"},{"x":1,"y":59.9,"fill":"Support"},{"x":1,"y":58.7,"fill":"Support"},{"x":1,"y":63.0,"fill":"Support"},{"x":1,"y":64.2,"fill":"Support"},{"x":1,"y":55.2,"fill":"Support"},{"x":1,"y":56.4,"fill":"Support"},{"x":1,"y":58.6,"fill":"Support"},{"x":1,"y":57.0,"fill":"Support"},{"x":1,"y":62.8,"fill":"Support"},{"x":1,"y":67.5,"fill":"Support"},{"x":1,"y":59.5,"fill":"Support"},{"x":1,"y":55.1,"fill":"Support"},{"x":2,"y":57.3,"fill":"Marketing"},{"x":2,"y":62.9,"fill":"Marketing"},{"x":2,"y":64.4,"fill":"Marketing"},{"x":2,"y":66.7,"fill":"Marketing"},{"x":2,"y":66.0,"fill":"Marketing"},{"x":2,"y":60.3,"fill":"Marketing"},{"x":2,"y":50.2,"fill":"Marketing"},{"x":2,"y":69.6,"fill":"Marketing"},{"x":2,"y":61.0,"fill":"Marketing"},{"x":2,"y":57.0,"fill":"Marketing"},{"x":2,"y":65.4,"fill":"Marketing"},{"x":2,"y":63.2,"fill":"Marketing"},{"x":2,"y":64.0,"fill":"Marketing"},{"x":2,"y":62.3,"fill":"Marketing"},{"x":2,"y":62.8,"fill":"Marketing"},{"x":2,"y":60.8,"fill":"Marketing"},{"x":2,"y":57.6,"fill":"Marketing"},{"x":2,"y":64.9,"fill":"Marketing"},{"x":2,"y":65.7,"fill":"Marketing"},{"x":2,"y":56.7,"fill":"Marketing"},{"x":2,"y":59.7,"fill":"Marketing"},{"x":2,"y":67.8,"fill":"Marketing"},{"x":2,"y":62.6,"fill":"Marketing"},{"x":2,"y":58.7,"fill":"Marketing"},{"x":2,"y":60.7,"fill":"Marketing"},{"x":2,"y":57.0,"fill":"Marketing"},{"x":2,"y":56.6,"fill":"Marketing"},{"x":2,"y":67.1,"fill":"Marketing"},{"x":2,"y":59.2,"fill":"Marketing"},{"x":2,"y":70.0,"fill":"Marketing"},{"x":3,"y":49.8,"fill":"Engineering"},{"x":3,"y":77.7,"fill":"Engineering"},{"x":3,"y":77.1,"fill":"Engineering"},{"x":3,"y":59.7,"fill":"Engineering"},{"x":3,"y":74.5,"fill":"Engineering"},{"x":3,"y":66.1,"fill":"Engineering"},{"x":3,"y":53.6,"fill":"Engineering"},{"x":3,"y":49.3,"fill":"Engineering"},{"x":3,"y":78.1,"fill":"Engineering"},{"x":3,"y":58.1,"fill":"Engineering"},{"x":3,"y":104.5,"fill":"Engineering"},{"x":3,"y":73.6,"fill":"Engineering"}]}

Support's middle half sits between 58.2 and 64.2. Engineering's runs from 56.9 to 77.2, and one engineer is out at 104.5. Switch the chart over to points and you can see those 12 salaries strung across a range the other two departments never reach.

What we are looking at has a name. **Equal variance**, also called homogeneity of variance, is the assumption that every group in the comparison has the same true spread. It is one of the three assumptions behind the classic one-way ANOVA, alongside independent observations and roughly normal values inside each group.

We can also test it. Bartlett's test starts from the null hypothesis that all the group variances are equal, and returns the probability of seeing spreads at least this uneven if that null were true.

```r
# Test whether the three departments share one common variance
bartlett.test(pay ~ dept, data = salary)
#>
#> 	Bartlett test of homogeneity of variances
#>
#> data:  pay by dept
#> Bartlett's K-squared = 41.332, df = 2, p-value = 1.059e-09
```

The p-value is 1.059e-09, which is R's shorthand for 0.000000001059. The equal variance assumption is not close to holding here.

[NOTE]
Bartlett's test is sensitive to non-normal data, so heavy tails on their own can make it flag unequal variances that are not really there. When your values are skewed, Levene's test, which compares distances from each group median instead, is the safer check. Our salaries are normal by construction, so Bartlett's is fine for this data.

So the assumption fails. The next question is what the classic test actually does with those three variances.

=== step === concept
## What the classic one-way ANOVA pools together

The classic one-way ANOVA compares the spread between the department means against the spread inside the departments. A difference is believable when the gaps between the means are wide and the spread inside each department is small.

For the second half of that sentence it needs one number for "the spread inside the departments". It does not have one. It has three: 21.6, 20.2 and 249.1. So it averages them, weighting each by its degrees of freedom, which for a variance is that department's size minus one.

\[ s_p^2 \;=\; \frac{\sum_{i=1}^{k}(n_i - 1)\,s_i^2}{N - k} \]

Here \(s_i^2\) is the variance of department \(i\), \(n_i\) is its size, \(k\) is the number of departments, and \(N\) is the total number of employees. The result is called the **pooled variance**, and it is the single spread the classic test then uses for all three departments.

R prints it for us. Fit the classic ANOVA and read the Mean Sq entry on the Residuals row.

```r
# Fit the classic one-way ANOVA and read what it puts in the residual row
aov_fit <- aov(pay ~ dept, data = salary)
summary(aov_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> dept         2    460  230.03   4.015 0.0224 *
#> Residuals   69   3953   57.29
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

That 57.29 on the Residuals row is the pooled variance. Here is the same number built by hand out of the table we already have.

```r
# Rebuild the pooled variance by hand from the per-department table
pooled_var <- sum((summ$n - 1) * summ$var) / (sum(summ$n) - 3)
round(c(pooled_variance = pooled_var, pooled_sd = sqrt(pooled_var)), 2)
#> pooled_variance       pooled_sd
#>           57.29            7.57
```

So the classic test is working with one spread, 57.29, which is 7.57 thousand as a standard deviation. Hold that against the real three. It is too large for Support at 4.6 and Marketing at 4.5, and it is less than half of Engineering's 15.8.

The direction of that mistake is what matters. The 7.0-point gap comes from Engineering, and the test is comparing that gap against a spread of 7.57 rather than 15.8. Any gap looks convincing when you measure it with a ruler that is too short.

And that is what comes back. F is the spread between the department means divided by the spread inside them, 230.03 over 57.29, which is the 4.015 on the dept row. Written out with its two degrees of freedom that is F(2, 69) = 4.02, and p is 0.0224. Under the usual 0.05 threshold that counts as a real difference between the departments, on data where all three true means are 62.

[KEY INSIGHT]
The classic F-test does not merely assume equal variances as a formality. It replaces the real variances with a single pooled number, so a group that is genuinely noisier than the rest is compared against a spread that is too small for it, and its ordinary sampling noise is read as evidence.

=== step === quiz
## Quick check: what the pooled variance did here
::prose-only the check itself is the step, and the three variances plus the pooled 57.29 it asks about are already computed and on the page

The three department variances are 21.6, 20.2 and 249.1, and the classic F-test replaced all three with the single pooled value 57.29. What did that do to the evidence?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It changed the department means, so the 7.0-point gap between Engineering and Support is not really there. ::no
- It stood in for a variance of 249.1 with a number about four times too small, so Engineering's ordinary noise was counted as strong evidence. ::ok Exactly. Pooling never touches a mean. It sets the ruler the gap is measured against, and the number it used for Engineering was about a quarter of that department's real variance.
- It made the test more cautious, because averaging in Engineering's 249.1 inflated the spread used for every department. ::no
- It dropped the 104.5 salary as an outlier, so Engineering looks tighter than it really is. ::no The pooled variance keeps every salary and changes no mean. All it does is force one spread on all three departments: a little too large for Support and Marketing, far too small for Engineering. That last part is why a 7.0-point gap came back significant.

=== step === concept
## How Welch's ANOVA weights each department and adjusts the df

Welch's ANOVA does not pool. It lets every department keep its own variance, then sets how much each one counts toward the result.

The weight of department \(i\) is its size divided by its variance.

\[ w_i \;=\; \frac{n_i}{s_i^2} \]

A department that is large and has a narrow spread gets a big weight. A small one with a wide spread gets almost nothing.

Everything else in the test is that weight carried through. The grand mean becomes a weighted mean instead of a plain one, the between-department term is weighted the same way, and the denominator degrees of freedom are cut down by a correction due to Satterthwaite.

\[ F \;=\; \frac{\frac{1}{k-1}\sum_i w_i\,(\bar{x}_i - \tilde{\mu})^2}{1 + \frac{2(k-2)}{k^2-1}\,\Lambda}, \qquad \Lambda \;=\; \sum_i \frac{1}{n_i - 1}\left(1 - \frac{w_i}{\sum_j w_j}\right)^{2} \]

\[ \mathrm{df}_2 \;=\; \frac{k^2 - 1}{3\,\Lambda} \]

In those two lines, \(\bar{x}_i\) is the mean of department \(i\) and \(\tilde{\mu}\) is the weighted grand mean. \(\Lambda\) is the one quantity they share. It is built out of the weights and the group sizes and nothing else, and the bigger it gets, the smaller both the F and the denominator df become.

In R all of that is one line, and the argument that switches it on is `var.equal = FALSE`.

```r
# Run Welch's ANOVA, which does not assume equal variances
welch_fit <- oneway.test(pay ~ dept, data = salary, var.equal = FALSE)
welch_fit
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  pay and dept
#> F = 1.1104, num df = 2.000, denom df = 25.213, p-value = 0.345
```

F is 1.1104 and p is 0.345. On the same 72 salaries, the classic test returned 0.0224 and Welch's returns 0.345. Only one of the two can be right, and we know which, because all three departments were built around a mean of 62.

The other thing to notice is the denominator df, 25.213 rather than 69. It is fractional, and that fraction is what Welch's correction does to the degrees of freedom. The numerator df stays at the number of groups minus one, which is 2.

Now let's put the formulas to work and get both numbers out of the table by hand.

```r
# Reproduce Welch's F and its denominator df from the per-department table
k   <- 3
w_i <- setNames(summ$n / summ$var, rownames(summ))
round(w_i, 3)
#>     Support   Marketing Engineering
#>       1.391       1.482       0.048

grand_mean <- sum(w_i * summ$mean) / sum(w_i)              # the weighted grand mean
lambda     <- sum((1 - w_i / sum(w_i))^2 / (summ$n - 1))   # the Satterthwaite term

welch_F  <- (sum(w_i * (summ$mean - grand_mean)^2) / (k - 1)) /
            (1 + 2 * (k - 2) * lambda / (k^2 - 1))
welch_df <- (k^2 - 1) / (3 * lambda)

cat("grand mean :", round(grand_mean, 2), "\n")
cat("F          :", round(welch_F, 4), "\n")
cat("denom df   :", round(welch_df, 3), "\n")
#> grand mean : 61.85
#> F          : 1.1104
#> denom df   : 25.213
```

The same 1.1104 and the same 25.213 that `oneway.test()` printed, straight out of the per-department table.

Read the weights first. Support gets 1.391 and Marketing 1.482, but Engineering gets 0.048, which is about a thirtieth of Marketing's. Engineering is still in the test and can still move the answer, but only in proportion to how precisely its mean was measured.

That is also why the weighted grand mean is 61.85 and not 63.97, which is what you get by averaging 61.5, 61.9 and 68.5 as equals. Engineering's 68.5 barely pulls it.

The denominator df says the same thing in another way. The classic test had 69 of them, one for every employee past the three department means. Welch's has 25.213, because a department whose mean is that imprecise cannot contribute a full share. Fewer denominator degrees of freedom means a wider F distribution, and that is what keeps the p-value from coming out too small.

[KEY INSIGHT]
Pooling and weighting are opposite answers to the same question. The classic test forces one spread on all three departments. Welch's lets each keep its own, weights each one by \(n_i / s_i^2\), and pays for the imprecision with fewer degrees of freedom.

=== step === concept
## How often each test flags a difference that is not there

One dataset is one dataset. Maybe this particular draw was unlucky and the classic test is fine in general. The way to settle that is to run the whole thing many times.

A test that rejects at p below 0.05 is set up to do something specific. When there is no real difference, it will still report one about 5 times in 100. That is its false positive rate, also called the Type I error rate, and 0.05 is the rate we agreed to accept when we picked the threshold.

So let's build 1,000 companies in which the three departments genuinely have the same mean pay, run both tests on every one, and count how often each test rejects.

```r
# Count how often each test reports a difference when there is none
rate <- function(sizes, spreads, means = c(62, 62, 62), reps = 1000) {
  dept <- factor(rep(c("Support", "Marketing", "Engineering"), times = sizes),
                 levels = c("Support", "Marketing", "Engineering"))
  p <- replicate(reps, {
    pay <- c(rnorm(sizes[1], means[1], spreads[1]),
             rnorm(sizes[2], means[2], spreads[2]),
             rnorm(sizes[3], means[3], spreads[3]))
    c(classic = oneway.test(pay ~ dept, var.equal = TRUE)$p.value,
      welch   = oneway.test(pay ~ dept, var.equal = FALSE)$p.value)
  })
  round(100 * rowMeans(p < 0.05), 1)
}

set.seed(7)
rate(sizes = c(30, 30, 12), spreads = c(4, 5, 20))
#> classic   welch
#>    25.0     5.8
```

The classic test announced a difference in 250 of the 1,000 companies. Every one of those was a false alarm, because `means` was `c(62, 62, 62)` in all 1,000 of them. Welch's announced 58, which is what a 5% rule is supposed to deliver.

25.0% in place of 5% is not a small miscalibration. Run the classic test on data shaped like ours and you are wrong five times as often as you believe you are.

Now change one thing. Give all three departments the same spread of 5, keep the sizes and the means exactly as they were, and count again.

```r
# The same count when all three departments have the same spread
set.seed(7)
rate(sizes = c(30, 30, 12), spreads = c(5, 5, 5))
#> classic   welch
#>     5.1     5.5
```

5.1% and 5.5%. When the assumption holds, the two tests agree with each other and both land where the 0.05 threshold says they should.

[KEY INSIGHT]
Welch's ANOVA held its false positive rate near 5% whether the spreads were equal or not. The classic F-test held it only when the spreads were equal, and it has no way of telling you which of the two situations you are in.

=== step === widget
## What unequal spread breaks, and what it leaves alone

Unequal spread does not damage everything in a model, and it is worth being exact about what it does and does not touch.

The dial below runs its own set of simulated studies at every severity setting. It uses one predictor and a straight line rather than three departments, but the assumption being broken is the same one, equal error variance.

At each setting it measures two things. Coverage is the share of 95% confidence intervals that really do contain the true value. R-squared is how well the line fits.

::widget assumption-dial {"assumption":"heteroskedasticity","levels":11,"start":0}

Start at the left, where the assumption holds. Coverage reads 95.1%, which is exactly what a 95% interval is supposed to do, and R-squared is 0.503.

Now drag the dial all the way to the right. Coverage falls to 70.7%, so nearly three intervals in every ten miss the value they were built to capture. R-squared goes from 0.503 to 0.533, which is to say it barely moves at all.

That split is the point. The estimate and the fit are unaffected. The uncertainty statement is not.

Bring it back to the salaries. The three department means, 61.5, 61.9 and 68.5, are perfectly good estimates and unequal spread did nothing to them. What broke was the p-value on the comparison, and that is precisely the number the classic test got wrong.

=== step === concept
## How to run and report Welch's ANOVA on your own data

There are three things to do, in order, whenever you have three or more groups to compare.

1. Look at the spread in each group: the size, mean and standard deviation of each one, plus a boxplot. Add Bartlett's or Levene's test if you want a p-value beside it.
2. Run `oneway.test(y ~ group, data = df, var.equal = FALSE)`.
3. Report the F, both degrees of freedom and the p-value, with the fractional df left exactly as it came.

That third one is where people slip. The fractional denominator df is not an untidy number waiting to be cleaned up, it is the correction itself, and rounding 25.213 to 25 throws away the thing that makes the result checkable by someone else.

Build the reported line straight out of the fitted object, so no number is ever typed twice.

```r
# Write the Welch result the way it should be reported
sprintf("Welch's F(%.0f, %.2f) = %.2f, p = %.3f",
        welch_fit$parameter[1], welch_fit$parameter[2],
        welch_fit$statistic, welch_fit$p.value)
#> [1] "Welch's F(2, 25.21) = 1.11, p = 0.345"
```

`welch_fit$parameter` holds the two degrees of freedom and `welch_fit$statistic` holds the F, so the sentence updates itself if the data changes.

That leaves one fair objection. If Welch's is going to be the default, what does it cost on data where the spreads really are equal?

Here is that cost, measured. It is the same simulation as before with equal spreads of 5, except that Engineering is now genuinely 6 points ahead at a true mean of 68. The share of rejections is no longer a false positive rate, it is power: the chance of catching a difference that is really there.

```r
# What Welch's costs in power when the spreads really are equal
set.seed(7)
rate(sizes = c(30, 30, 12), spreads = c(5, 5, 5), means = c(62, 62, 68))
#> classic   welch
#>    92.0    91.2
```

92.0% against 91.2%. Using Welch's when you did not need it cost 0.8 percentage points of power. Using the classic test when you did need Welch's cost 19 percentage points of false alarms, from 5.8% up to 25.0%.

[TIP]
Do not test the variances first and then pick a test based on the result. That two-stage procedure has an error rate of its own, because a variance test can miss real inequality in small samples and flag harmless inequality in large ones, and whichever ANOVA follows inherits the mistake. Run Welch's by default and there is no decision left to get wrong.

=== step === quiz
## Quick check: what the unequal spread actually broke
::prose-only the check itself is the step, and both numbers it rests on, the 25.0% against 5.8% and the coverage on the dial, are already on the page

Across 1,000 companies where all three departments truly had the same mean pay, the classic test reported a difference 25.0% of the time and Welch's 5.8%. What exactly did the unequal spread damage?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It biased the department means upward, so Engineering only looked better paid than it was. ::no
- It made both tests too cautious, so real differences were missed rather than invented. ::no
- The means were estimated fine, and what broke was the p-value and the uncertainty behind it, which is why the classic test rejected in a quarter of companies that had no real difference. ::ok Yes. The dial showed the same split: coverage fell from 95.1% to 70.7% while R-squared barely moved. Unequal spread is a standard error problem, not an estimation problem.
- Welch's fixes it by pulling the group means closer together before testing them. ::no Welch's never changes a group mean. It keeps every mean exactly as it is and changes only what each one is weighted by and the degrees of freedom the F is compared against. What unequal spread damages is the uncertainty statement, which is why 25.0% of companies with no real difference still came back significant.

=== step === tryit
## Your turn: run both tests when the departments are the same size

Engineering had only 12 people. Some of the damage came from the unequal spread, and some came from the noisiest department also being the smallest. So what happens when all three departments have 30 people and the spreads are still 4, 5 and 20?

The block below already builds `salary_eq`. Add two lines to it: the classic one-way F-test on `salary_eq`, then Welch's ANOVA on the same data.

```r
# salary_eq holds 30 people in every department, with the same three spreads
set.seed(171)
salary_eq <- data.frame(
  dept = factor(rep(c("Support", "Marketing", "Engineering"), times = c(30, 30, 30)),
                levels = c("Support", "Marketing", "Engineering")),
  pay  = c(rnorm(30, mean = 62, sd = 4),
           rnorm(30, mean = 62, sd = 5),
           rnorm(30, mean = 62, sd = 20))
)
# Run the classic one-way F-test on salary_eq, then Welch's ANOVA on it.
# Two lines. Press Check when you have them.
```
::check {"regex": "oneway[.]test[(][^)]*var[.]equal\\s*=\\s*FALSE", "gate": true, "difficulty": "beginner", "ok": "That is it. The classic test gives F(2, 87) = 3.45 with p = 0.0361, and Welch's gives F(2, 52.65) = 1.92 with p = 0.157. All three true means are 62 again, so the classic rejection is another false alarm, and the denominator df is 52.65 rather than 87.", "no": "Two calls to the same function, changing one argument between them: oneway.test(pay ~ dept, data = salary_eq, var.equal = TRUE), then the same line with var.equal = FALSE."}
::solution
```r
# Run both tests on the equal-sized departments
oneway.test(pay ~ dept, data = salary_eq, var.equal = TRUE)
#>
#> 	One-way analysis of means
#>
#> data:  pay and dept
#> F = 3.4502, num df = 2, denom df = 87, p-value = 0.03615
#>

oneway.test(pay ~ dept, data = salary_eq, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  pay and dept
#> F = 1.9217, num df = 2.00, denom df = 52.65, p-value = 0.1565
```

Equal group sizes help, but they do not remove the problem. Count the false alarms again with 30 people in every department and the gap is smaller but still there.

```r
# The false positive rate when all three departments have 30 people
set.seed(7)
rate(sizes = c(30, 30, 30), spreads = c(4, 5, 20))
#> classic   welch
#>     7.0     4.7
```

7.0% against 4.7%, so the classic rejection you just produced is one of that 7%.

=== step === concept
## References
::prose-only a list of sources, and the only links anywhere in the lesson

- [On the comparison of several mean values: an alternative approach](https://doi.org/10.1093/biomet/38.3-4.330) - Welch (1951), Biometrika 38(3-4), 330-336. The test itself, and the Satterthwaite denominator df you computed by hand.
- [Some theorems on quadratic forms applied in the study of analysis of variance problems, I](https://doi.org/10.1214/aoms/1177728786) - Box (1954), Annals of Mathematical Statistics 25(2), 290-302. What unequal variances do to the classic one-way F-test, worked out in full.
- [A note on preliminary tests of equality of variances](https://doi.org/10.1348/000711004849222) - Zimmerman (2004), British Journal of Mathematical and Statistical Psychology 57(1), 173-181. Why testing the variances first and then choosing a test does not work.
- [Why psychologists should by default use Welch's t-test instead of Student's t-test](https://doi.org/10.5334/irsp.82) - Delacre, Lakens and Leys (2017), International Review of Social Psychology 30(1), 92-101. The argument for making the Welch version the default, made for the two-group case.
- [Test for equal means in a one-way layout](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - R Core Team, the documentation for `oneway.test()`.

=== step === complete
## Quick recap

We had three departments and 72 salaries, all built around the same true mean of 62. Here is what the two tests made of that.

- The classic one-way F-test replaced variances of 21.6, 20.2 and 249.1 with a single pooled 57.29 and returned F(2, 69) = 4.02 with p = 0.0224, which is a difference that does not exist.
- Welch's ANOVA weighted each department by \(n_i / s_i^2\), giving 1.391, 1.482 and 0.048, cut the denominator df to 25.213, and returned F(2, 25.213) = 1.11 with p = 0.345.
- Across 1,000 companies with no real difference, the classic test rejected 25.0% of the time and Welch's 5.8%. Only one of those is the 5% the threshold was set for.
- Where the spreads were genuinely equal the two agreed, and Welch's cost 0.8 percentage points of power.

So the rule is short. Whenever you compare three or more groups, run `oneway.test(y ~ group, data = df, var.equal = FALSE)` and report the fractional denominator df as it comes out.

Next time three or more groups land in front of you, you will know what the classic F-test does with their spreads, and why the fractional denominator df on the Welch line is the part worth keeping. Nice work getting through it.

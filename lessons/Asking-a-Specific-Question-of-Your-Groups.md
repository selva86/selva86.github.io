---
title: "ANOVA and Multiple Comparisons Lesson 5: Asking a specific question of your groups"
catalog_blurb: "Why a planned contrast answers one question more cheaply than testing every possible pair."
description: "A field trial on corn yield shows how to write contrast weights for a specific question, then compares their cost in power against Tukey's all-pairs test."
keywords: "planned contrasts, contrast weights, orthogonal contrasts, linear trend contrast, Tukey HSD, one-way ANOVA, multiple comparisons, t-test by hand, family-wise error rate, post hoc test"
post_type: "LESSON"
curriculum_id: "4.50.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "5"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "Controlling-the-Family-Wise-Error-Rate.html"
course_prev: "Fixed-or-Random-Which-Factor-Is-Which.html"
---

=== step === cover
## Asking a specific question of your groups

Today let's learn how to ask a fertilizer trial one specific question, instead of settling for the one blunt question an ANOVA already answers.

A field trial gives forty corn plots one of four nitrogen rates: 0, 60, 120 or 180 pounds per acre, ten plots at each rate. At harvest, every plot's yield is recorded in bushels per acre. Here is what all forty plots look like, grouped by the rate each one received.

::widget chart-plotter {"data":[{"x":"1: 0 lb/acre","y":131.64},{"x":"1: 0 lb/acre","y":112.3},{"x":"1: 0 lb/acre","y":115.78},{"x":"1: 0 lb/acre","y":117.04},{"x":"1: 0 lb/acre","y":117.01},{"x":"1: 0 lb/acre","y":120.15},{"x":"1: 0 lb/acre","y":123.81},{"x":"1: 0 lb/acre","y":119.87},{"x":"1: 0 lb/acre","y":120.71},{"x":"1: 0 lb/acre","y":113.58},{"x":"2: 60 lb/acre","y":150.78},{"x":"2: 60 lb/acre","y":159.88},{"x":"2: 60 lb/acre","y":149.51},{"x":"2: 60 lb/acre","y":167.55},{"x":"2: 60 lb/acre","y":138.77},{"x":"2: 60 lb/acre","y":141.56},{"x":"2: 60 lb/acre","y":151.65},{"x":"2: 60 lb/acre","y":151.36},{"x":"2: 60 lb/acre","y":152.62},{"x":"2: 60 lb/acre","y":151.57},{"x":"3: 120 lb/acre","y":169.34},{"x":"3: 120 lb/acre","y":161.14},{"x":"3: 120 lb/acre","y":169.91},{"x":"3: 120 lb/acre","y":153.42},{"x":"3: 120 lb/acre","y":155.94},{"x":"3: 120 lb/acre","y":162.76},{"x":"3: 120 lb/acre","y":143.35},{"x":"3: 120 lb/acre","y":165.34},{"x":"3: 120 lb/acre","y":153.04},{"x":"3: 120 lb/acre","y":158.2},{"x":"4: 180 lb/acre","y":152.76},{"x":"4: 180 lb/acre","y":168.33},{"x":"4: 180 lb/acre","y":170.07},{"x":"4: 180 lb/acre","y":174.85},{"x":"4: 180 lb/acre","y":163.76},{"x":"4: 180 lb/acre","y":165.92},{"x":"4: 180 lb/acre","y":147.19},{"x":"4: 180 lb/acre","y":178.09},{"x":"4: 180 lb/acre","y":163.73},{"x":"4: 180 lb/acre","y":165.23}],"geoms":["boxplot"],"x":"rate","y":"yield"}

Yield climbs steadily from 0 to 120 pounds per acre, then barely moves by 180. "Do these four groups differ" is too blunt a question for a pattern like that. Sharper questions are available: does any nitrogen help at all, does yield keep climbing as the rate climbs, and does one particular jump in rate matter.

=== step === concept
## What makes a contrast "planned"
::prose-only the three questions are stated in the running example's own words, before any of them is tested

A contrast is a weighted sum of the group means, where the weights add up to zero. Each contrast encodes one specific question about the groups, and the weights are how you write that question down in numbers.

Here are three such questions about the corn trial, in plain words.

- Does any nitrogen help at all, compared to no nitrogen?
- Does yield keep rising as the nitrogen rate rises, across all four rates?
- Does going from 60 to 120 pounds per acre actually matter, on its own?

Each of those is a contrast waiting to be written down. What makes a contrast "planned" is that you decide the question before you run any test, not after looking at which gaps in the data happen to look biggest. That order matters, because picking the biggest-looking gap after seeing the data and then testing it is a kind of search, and a search costs more than one planned question does.

=== step === concept
## The data: four nitrogen rates, one yield per plot

Let's build that data in R so every number from here on comes from one place. The code below creates one row per plot, assigns each of the four rates to ten plots, and gives each plot a yield with some natural variation worked in.

```r
# Build the yield data: 40 corn plots, 10 at each of four nitrogen rates
set.seed(321)
rate <- rep(c(0, 60, 120, 180), each = 10)
target <- rep(c(118, 148, 162, 165), each = 10)
yield <- target + rnorm(40, mean = 0, sd = 8)
corn <- data.frame(rate = factor(rate), yield = yield)

dim(corn)
#> [1] 40  2

round(tapply(corn$yield, corn$rate, mean), 2)
#>      0     60    120    180 
#> 119.19 151.52 159.24 164.99 

round(tapply(corn$yield, corn$rate, sd), 2)
#>     0    60   120   180 
#>  5.58  8.13  8.20  9.29 
```

`rate` holds the four nitrogen levels as a label, not a number, so R treats it as four separate groups rather than a sliding scale. `target` is the true average yield built into each group before any noise is added: 118, 148, 162 and 165 bushels per acre. `rnorm(40, mean = 0, sd = 8)` adds that noise, eight bushels per acre of plot-to-plot variation, the kind of thing that comes from soil, rainfall and everything else a trial cannot fully control.

Once the noise is added, the actual group means in `corn` are not exactly 118, 148, 162 and 165. They land at 119.19, 151.52, 159.24 and 164.99 bushels per acre, and the spread inside each group, its standard deviation, runs from about 5.6 to 9.3 bushels per acre. Every contrast from here on starts from these four means and the ten plots behind each one.

=== step === concept
## Writing the first contrast: control against the treatments

Before asking any specific question, it helps to know what the blunt question already said. A one-way ANOVA on `corn` tests whether the four group means differ at all, lumping every rate into one yes-or-no answer.

```r
# Fit the one-way ANOVA comparing all four nitrogen rates at once
fit <- aov(yield ~ rate, data = corn)
summary(fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> rate         3  12554    4185   66.78 8.81e-15 ***
#> Residuals   36   2256      63                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

F(3, 36) comes out at 66.78, with a p-value of 8.81e-15, far below the usual 0.05 cutoff. So something about nitrogen rate does change yield. But the ANOVA table stops there. It never says which rates differ, by how much, or whether the pattern keeps climbing or levels off. For that, you need a contrast.

Every contrast's standard error uses the ANOVA's mean squared error, the `Mean Sq` value on the `Residuals` row above. It is the within-group variance: how much yield wobbles around its own group's mean once the nitrogen rate is accounted for. Pull it out and round it.

```r
# Pull out the ANOVA's mean squared error, the within-group variance
mse <- summary(fit)[[1]]["Residuals", "Mean Sq"]
round(mse, 2)
#> [1] 62.67
```

62.67 is in the same units as yield squared, bushels per acre squared, and you will see it inside a square root in every contrast from here on.

Now write the first contrast. The question: does any nitrogen at all raise yield over no nitrogen? That means comparing the control, 0 lb per acre, against the average of the three treated rates. The weights are (-1, 1/3, 1/3, 1/3), one weight for each rate in the order 0, 60, 120, 180. They sum to zero, which is what makes this a contrast rather than just a difference between two numbers picked out by hand. Read it as "the average of the three treated rates, minus the control."

```r
# Compute a contrast's estimate, standard error, t-statistic and p-value by hand
group_means <- tapply(corn$yield, corn$rate, mean)
group_n     <- tapply(corn$yield, corn$rate, length)

contrast_stat <- function(w) {
  L  <- sum(w * group_means)
  se <- sqrt(mse * sum(w^2 / group_n))
  t  <- L / se
  p  <- 2 * pt(-abs(t), 36)
  cat(sprintf("L = %.2f\nSE = %.3f\nt(36) = %.2f\np = %s\n", L, se, t, format.pval(p, digits = 3)))
}

w_control <- c(-1, 1/3, 1/3, 1/3)
contrast_stat(w_control)
#> L = 39.40
#> SE = 2.891
#> t(36) = 13.63
#> p = 8.8e-16
```

`sum(w * group_means)` multiplies each group's mean by its weight and adds the four results together. That is the contrast's estimate, `L`. `sqrt(mse * sum(w^2 / group_n))` is its standard error: square each weight, divide by that group's sample size, add the four results, multiply by the mean squared error, then take the square root. Dividing the estimate by its standard error gives the t-statistic, and `pt()` turns that t-statistic into a two-sided p-value using 36 residual degrees of freedom, the same 36 you saw in the ANOVA table above.

`L` comes out at 39.40. So the three treated rates average 39.40 bushels per acre above no nitrogen at all. Its t-statistic is 13.63 on 36 degrees of freedom, and the p-value prints as 8.8e-16, far below 0.05. That is an ordinary, correctly computed number: one specific question, asked and answered.

=== step === concept
## A linear trend across the four rates

The second question is different: does yield keep climbing as the nitrogen rate climbs, across all four rates at once, not just control against the rest?

Because 0, 60, 120 and 180 are equally spaced, 60 lb per acre apart each step, the standard weights for a linear trend across four equally spaced levels are (-3, -1, 1, 3). They still sum to zero. Each weight is proportional to how far that rate sits from the middle of the range, negative on the low end and positive on the high end, so the contrast reads as a slope: how much yield rises, on average, per step up in rate.

```r
# Linear trend across the four rates
w_trend <- c(-3, -1, 1, 3)
contrast_stat(w_trend)
#> L = 145.12
#> SE = 11.195
#> t(36) = 12.96
#> p = 3.97e-15
```

`L` works out to 145.12, with t(36) = 12.96 and p = 3.97e-15. The trend is real: yield rises on average as the nitrogen rate rises. But a significant linear contrast only says the overall slope across all four rates is not zero. It does not by itself say the rise stays straight all the way to 180 lb per acre. Whether it flattens out near the top is a separate question, and it is exactly the pattern the four boxes of yield already hinted at.

=== step === widget
## Testing one specific gap: 60 against 120 lb/acre

The third question zooms in further: does going from 60 to 120 lb per acre actually matter, on its own, apart from the trend or the control comparison?

The weights (0, 1, -1, 0) isolate just that gap. They put zero weight on the control and on 180 lb per acre, and set 60 against 120 directly.

```r
# The 60-versus-120 gap, isolated on its own
w_gap <- c(0, 1, -1, 0)
contrast_stat(w_gap)
#> L = -7.72
#> SE = 3.540
#> t(36) = -2.18
#> p = 0.0358
```

`L` is -7.72 bushels per acre: the 60 lb per acre group averages 7.72 bushels per acre below the 120 lb per acre group. Its t-statistic is -2.18 on 36 degrees of freedom, and the p-value is 0.0358, under the usual 0.05 cutoff. So on its own, tested as a single planned question, that gap is significant.

Here is that t-statistic placed against a null distribution, the spread of t-values you would expect if the 60 and 120 lb per acre groups truly had the same average yield.

::widget null-distribution {"tails":2,"max":4,"start":2.18,"label":"t for the 60 vs 120 lb/acre gap"}

The slider already starts at 2.18, and the shaded two-sided tail reads about 0.029. That is a little lower than the t(36) p-value of 0.0358 above, because this widget shades a standard normal reference, whose tails are thinner than a t-distribution's with only 36 degrees of freedom. The t-distribution's fatter tails make an extreme value a bit less surprising, which is why its p-value comes out a bit higher. Both readings agree on the conclusion: this gap is significant at the usual 0.05 cutoff.

=== step === concept
## What makes two contrasts orthogonal

Three contrasts are now on the page: the control contrast, the trend contrast and the 60-versus-120 gap. A natural next question is whether any of them are telling you the same thing twice.

Two contrasts are orthogonal when the dot product of their weights is zero: multiply the weights in matching positions, then add the four products. Orthogonal contrasts carry no overlapping information about the group means, so each answers its own question with nothing left over for the other to reuse.

```r
# Check all three pairs of contrasts for orthogonality
sum(w_control * w_gap)
#> [1] 0

sum(w_control * w_trend)
#> [1] 4

sum(w_trend * w_gap)
#> [1] -2
```

The control contrast and the 60-versus-120 gap are orthogonal: their dot product is 0. That makes sense once you look at the weights. The control contrast gives all three treated rates the same weight, 1/3 each, so it cannot tell 60 and 120 apart on its own. The gap contrast only ever asks about 60 and 120, and nothing it contains overlaps with what the control contrast measures.

The other two pairs are not orthogonal. The control contrast and the trend contrast give a dot product of 4, and the trend contrast and the gap give -2. That does not make either contrast wrong. Each of the three still answers its own question honestly. It just means the trend contrast and the gap contrast share a little of the same information, since the trend contrast already leans on the difference between 60 and 120 lb per acre as part of its overall slope.

=== step === quiz
## Quick check: contrast weights and orthogonality

Here is a new question about the same trial: does 60 lb per acre out-yield 180 lb per acre? Using the same four-rate order, 0, 60, 120, 180, which weight vector tests exactly that question, and what follows once you test it?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Weights (0, 1, 0, -1). This contrast is orthogonal to the control-versus-treatments contrast, and at t(36) = -3.80 it is significant at 0.05. ::ok Right. The dot product of (0, 1, 0, -1) with the control contrast (-1, 1/3, 1/3, 1/3) is 0, because the control contrast weighs all three treated rates equally and so cannot tell any two of them apart on its own. And t(36) = -3.80 clears the 0.05 cutoff easily, since |t| only needs to pass about 2.03 at 36 degrees of freedom.
- Weights (0, 1, 0, -1). This contrast is not orthogonal to the control-versus-treatments contrast, but at t(36) = -3.80 it is still significant at 0.05. ::no
- Weights (1, 0, 0, -1). This contrast is orthogonal to the control-versus-treatments contrast, and at t(36) = -3.80 it is significant at 0.05. ::no
- Weights (0, 1, 0, -1). This contrast is orthogonal to the control-versus-treatments contrast, but at t(36) = -3.80 it is not significant at 0.05. ::no The weights (0, 1, 0, -1) are the right ones here: zero on the control and on 120, 1 on 60 lb per acre, -1 on 180 lb per acre. Their dot product with the control contrast is 0, so the two are orthogonal, because the control contrast treats all three treated rates alike and cannot tell 60 and 180 apart by itself. And t(36) = -3.80 is well past the roughly 2.03 that marks the 0.05 cutoff at 36 degrees of freedom, so this gap is significant.

=== step === concept
## Tukey's all-pairs comparison on the same data

The three contrasts above were each planned: one specific question, decided in advance. Tukey's test takes a different approach: test every one of the six possible pairs among the four rates at once, and adjust each comparison's p-value to protect against the extra chances to find something by looking at all six.

```r
# Tukey's test on all six pairs of rates at once
TukeyHSD(fit)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = yield ~ rate, data = corn)
#> 
#> $rate
#>              diff       lwr      upr     p adj
#> 60-0    32.335584 22.801004 41.87016 0.0000000
#> 120-0   40.054575 30.519995 49.58915 0.0000000
#> 180-0   45.801734 36.267154 55.33631 0.0000000
#> 120-60   7.718991 -1.815588 17.25357 0.1481170
#> 180-60  13.466150  3.931571 23.00073 0.0028664
#> 180-120  5.747159 -3.787421 15.28174 0.3786912
```

Look at the `120-60` row. Its difference is 7.72 bushels per acre, the same magnitude as the 60-versus-120 contrast computed above, just written the other way round, 120 minus 60 instead of 60 minus 120. But its adjusted p-value is 0.148. Under Tukey's test, the identical gap is no longer significant at 0.05, even though nothing about the data changed between that contrast and this table.

The table below lays the two p-values for that one gap side by side.

::widget styled-table {"cols":["comparison","estimate","method","p"],"rows":[["60 vs 120, planned","-7.72","one contrast","0.0358"],["60 vs 120, Tukey","7.72","all six pairs","0.148"]],"title":"The same gap, two prices","note":"Same plots, same yields, two honest p-values."}

Toggle to the report table and the two rows sit next to each other: the planned contrast's t(36) = -2.18, p = 0.0358, against Tukey's diff = 7.72, p adjusted = 0.148. Same plots, same yields, same arithmetic difference, and two different answers to "is this gap significant." The only thing that changed is how many questions the test protected against at once.

=== step === quiz
## Quick check: why the same gap gets two different p-values

The 60-versus-120 gap came back significant as a planned contrast and not significant under Tukey. Why?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Tukey's test protects against making an error on any of all six possible pairwise comparisons at once, which raises the bar for every single one of them, including this one. ::ok Right. The planned contrast only ever had to answer one question, decided before the data arrived. Tukey's test has to answer six at once, and protecting all six raises the bar each individual comparison has to clear.
- The two tests used a different number of plots, so their standard errors are not really comparable. ::no
- Tukey's test uses a different formula for the standard error of the gap than the planned contrast does. ::no
- The planned contrast skipped a correction for multiple comparisons that it should have used, so its p-value is invalid. ::no None of these explain it. Both tests ran on the same 40 plots and lean on the same mean squared error for their standard error, so neither the sample size nor the standard error formula changed. And the planned contrast did not skip anything: it was one question, decided before the test ran, which is exactly why it never needed a correction for testing six questions at once. The gap between 0.0358 and 0.148 comes entirely from how many comparisons each test stood guard over.

=== step === tryit
## Your turn: test the gap at the top of the dose range

One more question to ask of the same data: does 180 lb per acre out-yield 120 lb per acre? Edit the weights below so the contrast tests exactly that, reusing `group_means`, `group_n` and `mse` already on this page, then run `contrast_stat` on it.

```r
# Your turn: build the weights that test 120 lb/acre against 180 lb/acre
w_top <- c(0, 1, -1, 0)
contrast_stat(w_top)
```
::check {"regex": "w_top\\s*<-\\s*c[(]\\s*0,\\s*0,\\s*1,\\s*-1\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "Right: L = -5.75, SE = 3.540, t(36) = -1.62, p = 0.113. Not significant: by 120 lb per acre, the yield curve has already leveled off, so the extra 60 lb per acre on top does not move the average by more than chance would explain.", "no": "Shift the two nonzero weights over by one position: 0 on the control, 0 on 60, 1 on 120 and -1 on 180, so the contrast reads c(0, 0, 1, -1)."}
::solution
```r
# Build the weights that test 120 lb/acre against 180 lb/acre
w_top <- c(0, 0, 1, -1)
contrast_stat(w_top)
#> L = -5.75
#> SE = 3.540
#> t(36) = -1.62
#> p = 0.113
```

=== step === concept
## References

- Montgomery, D.C. (2017). "Design and Analysis of Experiments." Wiley. The chapter on orthogonal contrasts and multiple comparison procedures, including Tukey's method.
- Kutner, M.H., Nachtsheim, C.J., Neter, J. and Li, W. (2004). "Applied Linear Statistical Models." McGraw-Hill. The chapter on contrasts and simultaneous inference procedures.
- Tukey, J.W. (1949). "Comparing Individual Means in the Analysis of Variance." Biometrics, 5(2), 99-114. The original studentized-range procedure behind `TukeyHSD()`.
- Maxwell, S.E. and Delaney, H.D. (2004). "Designing Experiments and Analyzing Data." Routledge. Planned comparisons versus post hoc procedures.
- [R documentation: aov](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the function fitting the one-way ANOVA that every contrast and Tukey's test build on.
- [R documentation: the t distribution](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html) - R Core Team, the `pt()` function used to turn each contrast's t-statistic into a p-value.
- [R documentation: TukeyHSD](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TukeyHSD.html) - R Core Team, the function used for the all-pairs comparison in this lesson.

=== step === complete
## What a planned contrast buys you, and when Tukey is the right tool

Three planned contrasts have now answered three separate questions about this trial: does any nitrogen help at all (yes, 39.40 bushels per acre above control, p < 0.0001), does yield keep climbing as the rate climbs (yes, on average, p < 0.0001), and does the 60-to-120 lb per acre jump matter on its own (yes, by itself, p = 0.0358).

That last number is the one worth holding onto. The exact same gap, tested as one of Tukey's six pairs instead of as its own planned question, came back at p = 0.148, not significant. Nothing about the forty plots changed between those two numbers. What changed is how many questions each test stood guard over.

A planned contrast is the right tool when you know your question before the data arrive, because it only pays the cost of answering that one question. Tukey's test is the right tool when you did not have a specific question in advance and every one of the six pairs genuinely needs protecting at once, because now you are asking the data itself which gaps matter, rather than checking one you already suspected.

Protecting many questions at once instead of six specific pairs is itself a bigger topic, controlling how often any test in a whole batch turns up a false alarm, and that is where this story picks back up next.

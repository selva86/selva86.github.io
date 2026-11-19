---
title: "Linear Regression, Properly Lesson 2: The five assumptions, ranked by what they cost"
catalog_blurb: "Which of five broken assumptions costs the most, measured in coverage not R-squared."
description: "Break each of the five OLS assumptions on purpose in one 60-gym regression, and watch which ones wreck your interval's coverage and which barely touch it."
keywords: "OLS assumptions, confidence interval coverage, heteroskedasticity, intraclass correlation, dependence, nonlinearity, non-normal residuals, leverage and influence, Cook's distance, residual plot, R-squared versus coverage, lm, R"
post_type: "LESSON"
curriculum_id: "4.60.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "2"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: ""
course_prev: "What-Holding-Other-Variables-Constant-Really-Means.html"
---

=== step === cover
## The five assumptions, ranked by what they cost

Today let's find out, with real numbers instead of a rule of thumb, which of the five assumptions behind an ordinary regression costs you the most when it breaks.

Northline Fitness runs 60 gyms. Each month its data team regresses a gym's revenue on its active-member count, to see how strongly more members actually brings in more revenue.

Here are all 60 gyms, active members against monthly revenue in thousands of dollars.

::widget chart-plotter {"data":[{"x":351,"y":86.3},{"x":440,"y":77.6},{"x":328,"y":67.4},{"x":595,"y":101.5},{"x":456,"y":73.7},{"x":330,"y":63.2},{"x":474,"y":66.9},{"x":501,"y":100.3},{"x":483,"y":85.8},{"x":386,"y":89.5},{"x":586,"y":104.2},{"x":463,"y":75.1},{"x":352,"y":70.3},{"x":176,"y":30},{"x":544,"y":82.3},{"x":415,"y":76.9},{"x":418,"y":70.7},{"x":524,"y":90.6},{"x":510,"y":89.2},{"x":485,"y":79.4},{"x":521,"y":85},{"x":506,"y":86.7},{"x":428,"y":86.8},{"x":201,"y":28.4},{"x":488,"y":90.5},{"x":414,"y":77.1},{"x":403,"y":82},{"x":258,"y":48},{"x":367,"y":70.4},{"x":466,"y":84.3},{"x":569,"y":92.5},{"x":409,"y":84.2},{"x":463,"y":91.9},{"x":414,"y":80.4},{"x":269,"y":66.6},{"x":374,"y":73.1},{"x":377,"y":57.1},{"x":413,"y":68.8},{"x":541,"y":82.1},{"x":504,"y":83.3},{"x":402,"y":66.7},{"x":392,"y":71.2},{"x":497,"y":78.4},{"x":481,"y":85.6},{"x":344,"y":57.7},{"x":342,"y":79.2},{"x":460,"y":87.5},{"x":505,"y":95.9},{"x":408,"y":76.7},{"x":517,"y":104.7},{"x":464,"y":75.9},{"x":353,"y":60.8},{"x":458,"y":93.6},{"x":296,"y":50.5},{"x":578,"y":96.8},{"x":638,"y":104.2},{"x":380,"y":66.1},{"x":305,"y":55.2},{"x":483,"y":88.9},{"x":405,"y":71.2}],"geoms":["point"],"x":"members","y":"revenue"}

The 60 points climb left to right: gyms with more active members tend to bring in more revenue, and a straight line fits that cloud reasonably well.

But a straight line like this one rests on five assumptions working quietly behind the scenes:

1. The true relationship really is a straight line (**linearity**).
2. Each gym's error is independent of every other gym's error (**independence**).
3. The spread of that error is the same size everywhere along the line (**equal variance**).
4. The errors are shaped like a normal distribution (**normal residuals**).
5. No single gym is carrying the whole fit on its own (**no undue influence**).

Keep this plot in mind. Over the next few steps, each of these five gets broken on purpose, one at a time, on these same 60 gyms, and the damage gets measured instead of guessed at.

=== step === concept
## What a confidence interval promises, and the number that tracks it

Put a number on that scatter first: create the 60 gyms, fit the line, and measure how strongly members and revenue move together.

```r
# Create Northline Fitness's 60 gyms and fit revenue on members
set.seed(1)
n <- 60
members <- round(rnorm(n, mean = 420, sd = 110))
revenue <- round(12 + 0.15 * members + rnorm(n, sd = 9), 1)
gyms <- data.frame(members = members, revenue = revenue)

round(cor(gyms$members, gyms$revenue), 3)
#> [1] 0.858
fit1 <- lm(revenue ~ members, data = gyms)
round(coef(fit1), 3)
#> (Intercept)     members 
#>      14.681       0.146 
round(summary(fit1)$r.squared, 3)
#> [1] 0.737
```

The correlation, 0.858, confirms what the scatter showed: a fairly strong relationship. The fitted line says each extra active member is worth about $146 a month in revenue (the slope, 0.146, in units of $1,000s). R-squared, 0.737, says the line explains about 74% of the variation in revenue across these 60 gyms.

A 95% confidence interval for that slope, 0.146, is also built from this one sample of 60 gyms. The promise behind it is this: if you repeated the whole study many times, each time drawing a fresh batch of 60 gyms and building a fresh 95% interval, about 95% of those intervals would contain the true slope, the one you would get if you could regress revenue on members for every gym that will ever exist.

That share, the percentage of repeated intervals that actually contain the truth, is called **coverage**. It is a different question from how well the line fits the 60 gyms you happened to sample, which is what R-squared measures. Coverage is about the interval's promise. R-squared is about the line's fit to this sample. Keeping those two apart matters, because that is exactly where the five assumptions do their damage: mostly to coverage, rarely to R-squared.

You cannot check coverage from one real study, because you never see the true slope. But you can check it in a simulation, where you set the true slope yourself and then watch how often the interval catches it.

Here, 1,000 fresh 60-gym studies are simulated. Every one of them obeys all five assumptions: the error is normal, its spread is constant, each gym's error is independent of the rest, the relationship is truly a straight line, and no gym is unusual enough to carry the fit alone. Only the random noise added to revenue changes from study to study.

```r
# Repeat the 60-gym study 1,000 times, under assumptions that are all true
set.seed(2)
true_slope <- 0.15
sims <- 1000
covered <- logical(sims)
r_squared <- numeric(sims)

for (i in seq_len(sims)) {
  study_revenue <- 12 + true_slope * members + rnorm(n, sd = 9)
  study_fit <- lm(study_revenue ~ members)
  study_ci <- confint(study_fit)["members", ]
  covered[i] <- study_ci[1] < true_slope && true_slope < study_ci[2]
  r_squared[i] <- summary(study_fit)$r.squared
}

mean(covered)
#> [1] 0.945
round(mean(r_squared), 3)
#> [1] 0.714
```

945 of the 1,000 intervals contained 0.15, the true slope: coverage of 94.5%, close enough to the promised 95% that the gap is just simulation noise. The average R-squared across those 1,000 studies is 0.714, while the single sample you plotted a moment ago read 0.737. Both numbers wobble a little from study to study. What matters is that coverage sits near 95% and R-squared sits near its own long-run average, because every assumption behind the simulation is true.

[KEY INSIGHT]
Coverage answers "can I trust this interval." R-squared answers "how well does this line fit this sample." They are not the same question, and a broken assumption rarely damages both the same way.

Keep 94.5% in mind as the clean baseline. Every step from here breaks exactly one assumption on these same 60 gyms and watches what happens to coverage and to R-squared.

=== step === widget
## Dependence: when one gym's error leaks into the next

Suppose several of Northline's gyms sit in the same region and share a regional manager, local competition, and a local economy. When that region has a bad month, every gym in it tends to have a bad month together. Their errors are no longer private to each gym; they are shared.

The **intraclass correlation (ICC)** measures how much of the leftover variation in revenue, after accounting for members, is shared within a group of gyms rather than private to each one. An ICC of 0 means every gym's error is its own business. An ICC of 0.6 means most of what looks like gym-to-gym noise is really one regional shock, felt by every gym in that region at once.

Drag the dial below from ICC = 0 toward ICC = 0.6 and watch two lines: the coverage of the slope's 95% interval, and R-squared.

::widget assumption-dial {"assumption":"independence","n":60,"levels":11,"seed":17}

At ICC = 0, coverage sits at about 94.5%, matching the clean baseline from the last step. At ICC = 0.3, coverage has fallen to about 81.3%. At ICC = 0.6, a believable amount of shared regional shock, coverage is down to about 69.2%, the worst number in this whole lesson. R-squared barely moves across all three: about 0.502, then 0.510, then 0.523.

The reason is that 60 gyms grouped into regions do not hand you 60 independent looks at the members-revenue relationship once their errors move together. You effectively have far fewer than 60 independent pieces of information, but the usual formula for the standard error still assumes you have all 60 of them. So it reports a narrower, more confident interval than the data actually earns, and the interval misses the true slope far more often than the stated 5% of the time. Nothing is wrong with the fitted line itself. What breaks is the claim about how sure you can be of it.

=== step === quiz
## Quick check: dependence and what it costs

The widget you just dragged took ICC from 0 to 0.6 on the gym data. Which statement about what happened is true?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The 95% interval for the slope covers the true value far less often, even though R-squared stays almost the same. ::ok Exactly. Coverage fell from about 95% to about 69% while R-squared barely moved, from 0.502 to 0.523. The line's fit to this sample is fine; the interval's promise about repeated samples is not.
- R-squared collapses by roughly the same amount as coverage does. ::no
- A bigger sample fixes the problem, because the standard error always shrinks as n grows. ::no
- The fitted slope itself becomes biased, pulled away from its true value. ::no Dependence does not bias the slope itself, and a bigger n alone does not repair it, since the formula still treats every gym as independent information. What actually breaks is the interval's coverage, which fell from about 95% to about 69% while R-squared barely moved. The line's fit stays about the same; what you can no longer trust is how confident the interval claims to be.

=== step === widget
## Equal variance: when the spread itself has a pattern

Now break a different assumption. Suppose bigger gyms' revenue swings by much larger dollar amounts than smaller gyms' revenue: a $2,000 miss is nothing for an 800-member gym, but it would be huge for a 150-member gym. The spread of the error is no longer constant; it grows with the size of the gym. This is **heteroskedasticity**, unequal variance.

::widget assumption-dial {"assumption":"heteroskedasticity","n":60,"levels":11,"seed":17}

At the baseline, where the spread is constant (a 1x ratio between the widest and narrowest spread), coverage sits at about 95.1%. Once the widest spread is about 9 times the narrowest, coverage has fallen to about 88.2%. Push it to an 81x spread, and coverage is down to about 70.7%. R-squared barely moves through all three: about 0.503, 0.511, then 0.533.

The mechanism is the same shape as dependence. The standard error formula assumes one shared noise level across every gym. Once a handful of big gyms carry noise far larger than the rest, the formula's single shared estimate understates how uncertain the slope really is, so the interval comes out too narrow and misses the truth more often than it should. Again, the fitted line barely changes; the interval's promise is what gives way.

=== step === concept
## An influential point: when one gym can move the slope

Northline opens a new flagship gym: 800 active members, well beyond any other gym in the chain, the largest of which has 638 members. Its monthly revenue comes in at $112,000. Add it to the 60 gyms and fit the line twice, once without it and once with it.

```r
# Add Northline's new flagship gym (800 members) and refit the line with and without it
mega <- data.frame(members = 800, revenue = 112)
gyms_mega <- rbind(gyms, mega)

fit_without <- lm(revenue ~ members, data = gyms)
fit_with    <- lm(revenue ~ members, data = gyms_mega)

round(coef(fit_without), 3)
#> (Intercept)     members 
#>      14.681       0.146 
round(coef(fit_with), 3)
#> (Intercept)     members 
#>      19.096       0.135 
round(summary(fit_without)$r.squared, 3)
#> [1] 0.737
round(summary(fit_with)$r.squared, 3)
#> [1] 0.737
```

R-squared does not move at all, 0.737 to 0.737. But the slope moves from 0.146 to 0.135, a drop of about 7.5%, and the intercept moves even more, 14.7 to 19.1. One gym, out of 61, shifted the slope by an amount that would read as a different number in a report.

Why did a single row move so much? Two things have to combine.

**Leverage** is about the predictor alone: how far a point's x-value sits from the rest.

```r
# How much leverage does the flagship gym carry, purely from its member count
round(hatvalues(fit_with)[61], 3)
#> [1] 0.216
```

At 800 members, far from any other gym, this one row carries leverage of 0.216. If every one of the 61 gyms carried equal leverage, each would carry 2 divided by 61, about 0.033 (2 because the line has two coefficients, an intercept and a slope). The flagship gym carries roughly 6.6 times that.

High leverage alone is not enough to cause trouble. A far-out point that lands exactly where the existing line would already have predicted it changes nothing, because there is nothing for it to correct. **Influence** needs a residual too, a gap between what the line predicted and what actually happened.

```r
# What the trend from the other 60 gyms alone would have predicted for an 800-member gym
round(unname(predict(fit_without, data.frame(members = 800))), 1)
#> [1] 131.6
```

Based on the other 60 gyms, an 800-member gym was expected to bring in about $131,600 a month. The flagship actually brought in $112,000, about $19,600 short. That gap, combined with its extreme leverage, is what pulled the slope down.

**Cook's distance** combines leverage and the residual into one number per row, measuring how much the whole fitted line would move if that row were dropped.

```r
# Cook's distance for the flagship gym, against the usual rule-of-thumb threshold
round(cooks.distance(fit_with)[61], 3)
#> [1] 0.571
round(4 / nrow(gyms_mega), 3)
#> [1] 0.066
```

A common rule of thumb flags a row once its Cook's distance clears 4 divided by the number of rows, 0.066 here. The flagship gym comes in at 0.571, well over eight times that. By leverage alone, or by its residual alone, this gym might have passed unnoticed. Together, they make it the most influential row in the dataset, while leaving R-squared completely untouched.

=== step === widget
## Nonlinearity: fine in the middle, costly at the edges

Suppose the true relationship between members and revenue is not a straight line at all. Maybe very large gyms see diminishing returns, so revenue grows more slowly than membership does once a gym gets big enough. Fit a straight line anyway, and the cost depends on where you ask that line to speak.

This dial does not change the true slope by region or by scale. It changes how much the true relationship actually bends away from a straight line, from 0% curvature (the truth really is straight) to 100% (the truth bends sharply at the high end). The interval tracked here is not for the slope itself, but for the model's prediction at the top of the member-count range, the largest gyms in the chain.

::widget assumption-dial {"assumption":"linearity","n":60,"levels":11,"seed":17}

At 0% curvature, coverage for that top-of-range prediction sits at about 95%, R-squared around 0.80, the usual clean baseline. At 50% curvature, coverage has already fallen under 30%, while R-squared has barely moved, still about 0.79. At full, 100% curvature, coverage is down near zero, essentially never catching the true value, while R-squared sits at about 0.77, only a little lower than where it started.

A straight line fit to a bent relationship still passes through the middle of the cloud reasonably well, because most of the 60 gyms sit in the middle of the member-count range, where a straight line and a curved one nearly agree. R-squared is computed over all 60 points, so it barely notices. But the prediction asked of the model here is for a gym near the top of the range, exactly where a straight line and a bending truth disagree the most. The cost of nonlinearity is not spread evenly across the data. It concentrates wherever you ask the line to speak for a part of the range it was never built to bend around.

=== step === widget
## Non-normal residuals: the cheapest violation of the five

Last assumption: that the errors are shaped like a normal distribution. Drag this dial from no skew to severe skew in the errors and watch the same two numbers.

::widget assumption-dial {"assumption":"normality","n":60,"levels":11,"seed":17}

Coverage barely reacts: about 95.1% with clean, symmetric errors, still about 95.0% once the errors are badly skewed. Compare that to dependence, which fell from about 95% to about 69%, or nonlinearity, which fell to near zero at the edge of the range. Non-normal residuals, by contrast, cost almost nothing.

The reason is the 95% interval is not built from the shape of any one gym's error. It is built from the slope's own sampling distribution, the spread of the estimated slope you would get across many repeats of the study. A slope is a weighted average over 60 data points, and averages settle toward a normal shape as the count going into them grows, even when the individual pieces do not look normal at all. That fact, that an average of many things looks normal even when the individual things do not, is the **Central Limit Theorem**, and it is doing nearly all the work keeping this interval honest at n = 60.

[NOTE]
R-squared even rises a little here, from 0.503 to 0.544, because skewed noise occasionally hands the line a few large residuals in one direction that make the fit look marginally tighter by chance. It is a small, incidental shift, not a sign that skewed errors help.

=== step === concept
## The five, ranked side by side

Here is everything you have just seen, side by side.

| Assumption broken | Coverage after the break | What happens to R-squared | Verdict |
|---|---|---|---|
| Dependence (ICC 0.6) | falls to about 69% | barely moves (0.50 to 0.52) | worst of the five |
| Equal variance (81x spread) | falls to about 71% | barely moves (0.50 to 0.53) | serious for the interval only |
| Nonlinearity (full curvature, top of range) | falls to under 1% | barely moves (0.80 to 0.77) | harmless in the middle, severe at the edges |
| An influential point (the flagship gym) | not a coverage curve; one row moved the slope 7.5% | unchanged (0.737 to 0.737) | usually mild, occasionally the worst of all |
| Non-normal residuals (severe skew) | stays near 95% | rises slightly (0.50 to 0.54) | nearly free at n = 60 |

Dependence costs the most, because it quietly shrinks how much independent information 60 rows actually carry. Equal variance costs nearly as much, for the same underlying reason: the standard error formula assumes something about the noise that is no longer true. Nonlinearity's damage is real but conditional. It depends entirely on where you ask the model to speak; harmless near the center of the data, severe at the edges. An influential point is conditional in a different way: most points never come close to this, but the one that combines high leverage with a real residual can do damage on the scale of dependence itself. Non-normal residuals cost the least of all, because the Central Limit Theorem is quietly repairing the damage as n grows.

A formal significance test for a violated assumption, like the Breusch-Pagan test for equal variance or the Shapiro-Wilk test for normality, answers a narrower question than people expect: is there enough data to detect the violation at all. With enough rows, Breusch-Pagan flags even a trivial amount of heteroskedasticity, and Shapiro-Wilk flags even a barely visible skew. The test's p-value tracks sample size as much as it tracks severity. What actually decides whether to worry, as the numbers above have shown, is how far coverage and R-squared move once you look, not whether a test can detect that they moved at all. A diagnostic plot, read for its shape and the size of the pattern, beats a p-value for that question.

=== step === widget
## Reading the shape in a residuals-vs-fitted plot

A residuals-vs-fitted plot puts the model's fitted values on the x-axis and its residuals on the y-axis. The shape it draws tells you which, if any, of the five assumptions is in trouble.

This widget draws its own illustrative set of residuals rather than Northline's own data, but the three shapes it shows map directly onto what you already saw: the funnel is the shape equal variance leaves behind once it breaks, and the curve is the shape nonlinearity leaves behind.

::widget residual-plot {}

A healthy fit scatters in a flat, even band around zero, no matter where you look along the x-axis, which is exactly what equal variance and linearity together predict. A funnel, where the band fans out as the fitted value grows, is the heteroskedasticity from a few steps back. A curve, where the residuals bend in a clear U instead of scattering flat, is the nonlinearity from the step before that. Learning to read this one plot gets you most of the way to catching two of the five assumptions on sight.

=== step === quiz
## Quick check: rank the damage

Rank these three violations from most damaging to least damaging to a 95% interval's coverage: dependence, equal variance, and non-normal residuals.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Dependence costs the most, equal variance next, and non-normal residuals cost the least, because that is the order in which their coverage falls. ::ok Right. Dependence took coverage to about 69%, equal variance to about 71%, and non-normal residuals barely moved it from 95%. Ranking by coverage is exactly what every widget above has been showing.
- Non-normal residuals cost the most, because its R-squared moved further than any of the other two (0.503 to 0.544). ::no
- Equal variance costs the most, because its widget's scatter visibly fans out the most dramatically. ::no
- All three cost about the same, since every broken assumption damages a regression by a similar amount. ::no Each of these swaps the wrong yardstick in for the right one, or assumes every violation is interchangeable. Rank by what actually happened to COVERAGE: dependence fell to about 69%, equal variance to about 71%, and non-normal residuals stayed near 95%. R-squared, how dramatic a picture looks, and "every violation is the same" are all the wrong number to rank by.

=== step === tryit
## Your turn: diagnose the gym data

Here is the residuals-vs-fitted plot for the fit that includes the flagship gym, with that one row marked in red.

```r
# Plot residuals against fitted values for the fit that includes the flagship gym, flagging that row
plot(fitted(fit_with), resid(fit_with),
     xlab = "fitted revenue ($1,000s)", ylab = "residual",
     main = "Residuals vs fitted, flagship gym included", pch = 19)
abline(h = 0, lty = 2, col = "grey50")
points(fitted(fit_with)[61], resid(fit_with)[61], pch = 19, col = "red", cex = 1.6)
text(fitted(fit_with)[61], resid(fit_with)[61], "flagship gym", pos = 1, col = "red")
```

Notice something. The flagship gym's residual, about -15.3, is not even the largest one on the plot; several of the other 60 gyms miss by more than that. What marks it out is its position: it sits far to the right, alone, at a fitted value no other gym comes close to. A residual that is not extreme on its own, sitting at an extreme fitted value, is exactly what leverage and influence together produced for this gym a moment ago.

`gyms_mega` still holds all 61 rows, the 60 original gyms plus the flagship. Using it, and the original `gyms` on its own, compute the slope with the flagship gym included and the slope without it, so you can see directly how much one row is responsible for.

```r
# The slope using every gym, flagship included
fit_with <- lm(revenue ~ members, data = gyms_mega)
coef(fit_with)["members"]

# Your turn: fit the same model on gyms (without the flagship) and compare
```
::check {"regex": "lm[(]revenue\\s*~\\s*members,\\s*data\\s*=\\s*gyms\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. Without the flagship gym the slope is back to about 0.146, close to where this story started. Dropping the one row that was carrying an outsized share of the fit moved the slope back by about 0.011, or 7.5%, confirming it was that single row doing the pulling.", "no": "Fit the same model again, this time with data = gyms instead of data = gyms_mega, and print its slope so you have both numbers side by side."}
::solution
```r
# Fit the same model without the flagship gym, then compare both slopes
fit_without <- lm(revenue ~ members, data = gyms)
round(coef(fit_without)["members"], 3)
#> members 
#>   0.146 
round(coef(fit_with)["members"], 3)
#> members 
#>   0.135 
```

Removing the flagship gym is not automatically the right call, and nothing here said to delete it. What matters is recognizing what the row is doing: one gym, far outside the usual member-count range, that also misses its expected revenue, pulling the slope down by a reportable amount while leaving R-squared almost untouched. Whether it stays in the dataset depends on something no formula answers: is this flagship gym a one-off exception, or the first sign of a real pattern among very large gyms that the model needs to capture on purpose. That answer comes from knowing the business, not from Cook's distance alone.

=== step === concept
## References

- Fox, J., "Applied Regression Analysis and Generalized Linear Models". The standard reference for regression diagnostics and residual plots.
- Faraway, J., "Linear Models with R". Its chapter on checking assumptions covers the same five checks worked through here.
- Belsley, D., Kuh, E. and Welsch, R., "Regression Diagnostics: Identifying Influential Data and Sources of Collinearity". The original source for leverage, influence and Cook's distance.
- Long, J. S. and Ervin, L. H. (2000), "Using Heteroscedasticity Consistent Standard Errors in the Linear Regression Model", The American Statistician. On repairing the standard error once equal variance breaks.
- Wooldridge, J., "Introductory Econometrics: A Modern Approach". Its treatment of clustered and dependent errors extends the dependence case above to grouped data more generally.
- [confint() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html) - R Core Team. Builds the 95% interval checked for coverage throughout.
- [cooks.distance() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html) - R Core Team. Computes the Cook's distance used to flag the flagship gym.
- [predict.lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - R Core Team. Produces the trend's predicted revenue for an 800-member gym.

=== step === complete
## What the ranking is actually for

Five assumptions, broken one at a time on the same 60 gyms, cost very different amounts. Dependence and equal variance both hit coverage hard while leaving R-squared almost exactly where it was, because both break a promise about the standard error, not about the fitted line. Nonlinearity's cost depends on where you look, harmless near the center of the data and severe at the edges. An influential point is rare but, when leverage and a real residual combine, as they did for the flagship gym, it can move a headline number by a reportable amount. Non-normal residuals cost the least of the five, because averaging 60 numbers together already pulls the slope's own sampling distribution most of the way to normal.

The practical rule underneath all five: read a diagnostic plot for its shape and the size of what it shows, and rank what you see by its cost to coverage, not by whether a significance test can detect it. A test mostly tells you whether n was large enough to notice. The plot tells you whether it matters.

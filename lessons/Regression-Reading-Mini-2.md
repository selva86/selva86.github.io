---
title: "Linear regression assumptions: the 5 checks"
slug: "Regression-Reading-Mini-2"
description: "Every regression makes five promises about your data. Run all five checks on one real model in R, see what each catches, and repair the ones that fail."
keywords: "linear regression assumptions, regression diagnostics in R, residuals vs fitted plot, heteroscedasticity, Breusch-Pagan test, Durbin-Watson test, Cooks distance, leverage and influence"
mathjax: true
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "2"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: "Regression-Reading-Mini-1"
course_next: ""
curriculum_id: "0.0.22"
lesson_access: "windowed"
catalog_blurb: "The five checks that tell you whether a regression can be trusted."
---

=== step === cover
::eyebrow Reading Regression Models
## Linear regression assumptions: the 5 checks

Let's start with a small moving company. There are two people, a van, and a job sheet where every move gets one row: the week it happened, how many people were on the crew that day, how many boxes got packed, and how many hours the whole job took.

That sheet now holds sixty jobs from one year of work. The owner wants to stop guessing when quoting new work, so they fit the obvious model: hours on boxes.

The output could not look better. Every extra box adds 0.037 hours, the p-value is under 2e-16, and the model accounts for 83% of the variation in how long a job runs.

So the quoting starts.

Here is the trouble. Nothing in that output can tell you whether it is safe to quote from. Before a regression says anything at all, it makes five quiet promises about your data, and it never mentions them again.

::widget process-flow {"steps":[{"title":"A straight line","sub":"is a straight line the right shape for this relationship"},{"title":"Equal spread","sub":"do the errors stay the same size as the prediction grows"},{"title":"Independence","sub":"does one error tell you nothing about the next one"},{"title":"Normal errors","sub":"do the errors follow a bell shape closely enough"},{"title":"No single row in charge","sub":"is one job setting the answer on its own"}]}

When all five hold, the coefficient, the interval and the p-value mean what they appear to mean. When one breaks, the summary prints exactly the same way and those numbers quietly stop being trustworthy.

Four of the five are broken in this job sheet.

Each check is one plot or one line of code, so all five take a couple of minutes. Let's run them one at a time on the real data, and then repair what they find.

=== step === concept
## The model we are about to check

Everything from here on runs on one table, so let's put it on the screen first. Every row is one completed move, in the order the jobs happened.

```r
# Build the moving company's job sheet: 60 completed moves, in date order
jobs <- data.frame(
  job   = 1:60,
  week  = c(1, 2, 3, 3, 5, 7, 8, 8, 9, 9, 9, 11, 12, 15, 16, 16, 17, 18, 19, 20,
            21, 21, 24, 24, 26, 26, 26, 27, 27, 28, 28, 29, 30, 31, 31, 31, 31, 33, 33, 34,
            34, 35, 39, 40, 40, 41, 42, 43, 43, 43, 43, 44, 45, 47, 49, 49, 50, 51, 51, 52),
  crew  = c(2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
            2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3),
  boxes = c(121, 101, 119, 150, 213, 101, 219, 87, 52, 152, 216, 23, 135, 97, 92, 217, 67, 157, 114, 112,
            55, 46, 380, 68, 108, 116, 158, 175, 50, 57, 68, 67, 84, 188, 112, 37, 134, 48, 122, 173,
            65, 48, 201, 48, 94, 27, 56, 140, 34, 188, 187, 63, 144, 134, 16, 103, 95, 44, 218, 139),
  hours = c(11.1, 10, 11.7, 13.5, 12.7, 9.3, 14.9, 9.9, 6.9, 11.6, 13.7, 5.8, 12, 8.9, 8.9, 14.7, 8.3, 12.6, 9.9, 10.1,
            7.6, 7.6, 15.8, 8.3, 10.1, 10.4, 12.4, 11.8, 6.7, 7.2, 7.5, 7.3, 7.6, 11.8, 8.1, 5.8, 9.6, 5.9, 9.6, 12.3,
            6.9, 5.9, 11.4, 6.8, 8.3, 4.7, 7, 9.8, 5.1, 11.6, 10.9, 6.9, 9.9, 9.5, 3.9, 8.5, 9.3, 6.2, 11.8, 9.1)
)

head(jobs)
#>   job week crew boxes hours
#> 1   1    1    2   121  11.1
#> 2   2    2    2   101  10.0
#> 3   3    3    2   119  11.7
#> 4   4    3    2   150  13.5
#> 5   5    5    2   213  12.7
#> 6   6    7    2   101   9.3
```

Most of these are house moves in the 16 to 219 box range. One of them, job 23, is an office move at 380 boxes, and it is the only job of its kind on the sheet. Hold that thought, because it comes back.

The owner quotes on box count, so the model uses boxes to predict hours and ignores the other columns.

```r
# Fit hours on boxes: the model the owner quotes new work from
fit <- lm(hours ~ boxes, data = jobs)
summary(fit)
#>
#> Call:
#> lm(formula = hours ~ boxes, data = jobs)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.3894 -0.6187 -0.2043  0.7170  2.7811
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 5.194645   0.285251   18.21   <2e-16 ***
#> boxes       0.036828   0.002168   16.99   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 1.106 on 58 degrees of freedom
#> Multiple R-squared:  0.8327,	Adjusted R-squared:  0.8298
#> F-statistic: 288.6 on 1 and 58 DF,  p-value: < 2.2e-16
```

Read it the way the owner did. A job starts at 5.19 hours before a single box is touched, and every box after that adds 0.036828 hours, which is about 2 minutes and 13 seconds. Box count alone accounts for 83% of the differences in job length, and the p-value on that slope is small enough that R stops printing digits.

That is a strong result. A hundred-box move should take 5.19 plus 3.68, near enough nine hours, and the owner can quote that.

Now here is the part worth sitting with. Every number in that block was computed from the assumption that the five promises hold. Not one of them is a test of whether they do.

=== step === concept
## Residuals: what every check actually looks at

None of the five checks ever looks at the boxes column or the hours column directly. They all look at one derived quantity, so let's build it before going near a diagnostic plot.

A residual is the hours a job really took minus the hours the fitted line predicted for it. Written out for job \(i\):

\[ e_i \;=\; y_i \;-\; \hat{y}_i \]

Here \(y_i\) is the recorded hours and \(\hat{y}_i\) is what the line says for that job's box count. A positive residual means the job overran the prediction, and a negative one means it came in early.

Here is the whole idea in one picture. The green line is the fit, and each grey drop is one job's residual.

```r
# Draw the fitted line and the residual for every one of the 60 jobs
plot(jobs$boxes, jobs$hours, pch = 19, col = "grey35",
     xlab = "Boxes packed", ylab = "Hours the job took",
     main = "Every job, the fitted line, and the gap between them")
abline(fit, col = "forestgreen", lwd = 2)
segments(jobs$boxes, jobs$hours, jobs$boxes, fitted(fit), col = "grey70")
```

Those grey drops are the raw material for everything that follows. Now let's get them as numbers rather than as a picture, because numbers are what the tests read.

```r
# Put the prediction and the residual beside the raw columns for each job
sheet <- data.frame(
  boxes    = jobs$boxes,
  hours    = jobs$hours,
  fitted   = round(fitted(fit), 2),
  residual = round(residuals(fit), 2)
)

head(sheet)
#>   boxes hours fitted residual
#> 1   121  11.1   9.65     1.45
#> 2   101  10.0   8.91     1.09
#> 3   119  11.7   9.58     2.12
#> 4   150  13.5  10.72     2.78
#> 5   213  12.7  13.04    -0.34
#> 6   101   9.3   8.91     0.39
```

Job 1 packed 121 boxes, the line predicted 9.65 hours, and the crew actually took 11.1. It ran 1.45 hours long, so its residual is 1.45. Job 5 came in 0.34 hours under.

Two facts about these residuals are worth having before we start reading them.

```r
# The residuals average out to zero, and the worst single miss is over three hours
c(mean_residual = round(mean(residuals(fit)), 6),
  largest_miss  = round(max(abs(residuals(fit))), 2))
#> mean_residual  largest_miss
#>          0.00          3.39
```

The first is not a discovery, it is arithmetic. Least squares places the line so that the overs and the unders cancel exactly, which is true of every straight-line fit and therefore tells you nothing about this one.

The second is the interesting one. Somewhere in these sixty jobs the model is off by three hours and twenty-three minutes. The median job on this sheet runs 9.4 hours, so that is a third of a working day the owner did not see coming.

[KEY INSIGHT]
All five checks read the residuals, and each one reads them a different way: their shape against the prediction, their size against the prediction, their order in time, their distribution, and how hard any single one of them pulls on the fit. That is the whole subject in one sentence.

=== step === widget
## What a broken assumption costs you

Before running the checks, it helps to know what is at stake, because the answer surprises most people.

The intuition almost everyone starts with is that a broken assumption ruins the fit. It does not, at least not usually. What it ruins is the honesty of the standard error, and with it everything computed from the standard error: the t value, the p-value, the confidence interval.

The dial below breaks one assumption on purpose, the one about the errors staying the same size, and measures the damage two ways. The red line is coverage: run two thousand complete studies at that severity and count how often the 95% confidence interval actually contains the true slope. That is what a 95% interval promises, so the honest answer is 95%. The blue dashed line is R-squared, the number people quote to say a model is good.

Drag the slider from no violation across to severe.

::widget assumption-dial {"assumption": "heteroskedasticity", "start": 0, "levels": 11}

Watch the two lines separate. R-squared barely moves, because the fit is genuinely still describing the data. Coverage falls away underneath it, and an interval that claims 95% while covering far less than that is simply wrong.

This is why the summary can never warn you. R-squared, the coefficient and the shape of the printout are the parts a violation tends to leave alone. The interval and the p-value are the parts it wrecks, and they print identically either way.

[WARNING]
A regression summary has no capacity to tell you its assumptions are broken. It is not that it forgets to check them, it is that its output is the wrong place to look. The five checks exist because the damage lands where the summary does not show.

=== step === concept
## Is the relationship actually a straight line?

The first promise is the one people forget is a promise at all. `lm()` fits a straight line whether or not a straight line is the right shape, and it never complains.

So the question is not whether the line fits well. It is whether the misses are patternless. If a straight line is the right shape, the residuals should scatter around zero with no relationship to the prediction. If the truth bends and you fit a line, the residuals will hold the bend the line missed.

That comparison is exactly what the residuals versus fitted plot draws: the prediction along the bottom, the residual up the side, and a red smoother through the middle to make the trend visible.

```r
# Check the shape: residuals against fitted values, with the smoother
plot(fit, which = 1)
```

Read the red smoother against the dashed line at zero, and ignore the individual points for a moment.

It starts about 1.2 hours below zero at the smallest jobs, climbs above zero through the middle of the range, and then drops steeply away on the right. That is an arch, not a flat band.

Turn it back into the owner's language and it says something specific. The smallest jobs finish sooner than the line says they will. Jobs through the middle of the range run over it. Out at the right-hand end the line is over-predicting once more. The model is not making random mistakes, it is making the same mistake to every job of a given size, and that is the signature of a wrong shape.

The reason is easy to picture once you see it. Packing 30 boxes and packing 60 boxes is not twice the work, because carrying gear in, protecting the floor and backing the van up happen once either way. Real jobs do grow with box count, but they grow slower and slower, so the truth is a curve that flattens as it rises. A straight line cannot bend, so it sits above that curve at the two ends and below it through the middle, which is exactly the arch you are looking at.

[NOTE]
An arch in this plot never means you collected bad data or too little of it. It means the equation is the wrong shape for the relationship. Another 60 jobs would draw the same arch with more points on it.

That reading skill carries the rest of the way, because the four remaining checks are all variations on it: draw the residuals a particular way, then ask whether what you see could plausibly be nothing.

=== step === quiz
## Quick check: what a curve in the residual plot means

The smoother in that plot rose above zero through the middle of the range and dived below zero at both ends, instead of running flat. What does that tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The data is noisy, and a curve like that is what noise looks like on a small sample. ::no
- Some of the jobs were recorded wrongly and should be removed before fitting again. ::no
- A straight line is the wrong shape for this relationship, so the model misses in a pattern that depends on job size. ::ok Exactly. The misses are not random, they track the prediction, and only a change to the shape of the model can remove them.
- The relationship is too weak for a regression to pick up. ::no The relationship here is strong, and noise does not organise itself into an arch that follows the prediction. A curve in this plot is about the shape of the equation, not about the quality or the quantity of the data, which is why collecting more jobs would reproduce the same curve.

=== step === concept
## Do the errors grow with the prediction?

The second promise is that the errors stay the same size across the whole range. A model that is off by an hour on a small job should be off by about an hour on a big one too.

That promise has a name worth knowing, because it turns up in every textbook and every warning about it. Equal error variance is called homoscedasticity, and the failure of it is heteroscedasticity, which is Greek for spread that changes.

The previous plot already hints at it, but the misses are easier to compare when you strip out the sign and flatten the scale. That is what the scale-location plot does. It takes each residual, divides it by the size the model expects a residual to have, drops the minus sign and takes a square root, so the only thing left to look at is size.

```r
# Check the spread: is the size of the miss growing with the prediction
plot(fit, which = 3)
```

The red smoother dips a little through the shorter jobs, bottoming out near 0.7, then climbs the rest of the way across and is past 0.9 by the right-hand end.

That is a funnel. When the model predicts a short job its misses are small, and when it predicts a long one they are far larger, which is exactly what the second promise said would not happen.

A picture is only suggestive, though, and the eye is easy to fool with 60 points. There is a formal test for this exact question. The Breusch-Pagan test regresses the squared residuals on the predictors and asks whether the spread has any relationship to them at all. Its null hypothesis is the promise itself, that the variance is constant, so a small p-value is evidence the promise is broken.

```r
# Test the spread formally with the Breusch-Pagan test
suppressPackageStartupMessages(library(lmtest))
bptest(fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 14.138, df = 1, p-value = 0.0001699
```

A p-value of 0.00017 says that if the spread really were constant, a funnel this pronounced would turn up in about 17 tests out of every hundred thousand. It is not a close call.

Here is why it matters so much for the quoting. Least squares computes one residual standard error for the whole model, 1.106 hours, and every standard error, interval and p-value in that summary is built from that single number. It is one average struck across jobs whose real errors are nothing like each other, so it overstates the uncertainty on small jobs and understates it on large ones. The interval around a 200-box quote is narrower than the data can support.

[KEY INSIGHT]
The coefficient survives heteroscedasticity roughly intact. The uncertainty around it does not. That is the pattern the dial showed, and it is why a model can look right in the summary and still mislead you about how sure you are.

=== step === tryit
## Your turn: measure the spread at both ends

The plot showed a funnel and the test gave it a p-value, but neither one tells you how big the funnel is in hours. That is worth having as a number, and it takes two lines.

Split the sixty jobs by their predicted length. Take the residuals of the third with the smallest fitted values, take the residuals of the third with the largest, and compare the standard deviation of each group.

```r
# fit is the model, so residuals(fit) are the misses and fitted(fit)
# are the predictions.
# Build low: the residuals whose fitted value is at or below quantile(fitted(fit), 1/3).
# Build high: the residuals whose fitted value is at or above quantile(fitted(fit), 2/3).
# Then print sd(low) and sd(high).
# Two lines and a print. Press Check when you have them.
```
::check {"regex": "(sd[(]\\s*low[\\s\\S]*sd[(]\\s*high|sd[(]\\s*high[\\s\\S]*sd[(]\\s*low)", "gate": true, "difficulty": "beginner", "ok": "That is it: 0.69 hours against 1.47. The model is more than twice as wrong on the biggest jobs as on the smallest, and it reports a single error figure of 1.11 hours for both.", "no": "Subset the residuals by the fitted values, then take the two standard deviations: `low <- residuals(fit)[fitted(fit) <= quantile(fitted(fit), 1/3)]`, the same line with `>=` and `2/3` for `high`, then `sd(low)` and `sd(high)`."}
::solution
```r
# Residual spread in the lowest and the highest third of the predictions
low  <- residuals(fit)[fitted(fit) <= quantile(fitted(fit), 1/3)]
high <- residuals(fit)[fitted(fit) >= quantile(fitted(fit), 2/3)]

round(c(low_third = sd(low), high_third = sd(high)), 2)
#>  low_third high_third
#>       0.69       1.47
```

Quote a small move and the model's typical miss is about 40 minutes. Quote a large one and it is closer to an hour and a half. The summary offers one number, 1.106 hours, and it is honest about neither end.

=== step === concept
## Is each error independent of the one before it?

The third promise is that knowing one job overran tells you nothing about whether the next one will. Errors are supposed to arrive independently, like coin tosses.

Neither plot so far could have shown you a breach of it, because both of them put the prediction on the horizontal axis. Dependence between jobs lives in a dimension neither plot uses, which is the order the jobs happened in.

The job sheet is already in date order, so plotting the residuals against the job number is enough.

```r
# Read the same residuals in date order, and add a smoother to show any drift
plot(jobs$job, residuals(fit), pch = 19, col = "grey35",
     xlab = "Job number, in the order the jobs happened",
     ylab = "Residual (hours)",
     main = "The same residuals, read in date order")
abline(h = 0, col = "red", lwd = 2)
lines(lowess(jobs$job, residuals(fit)), col = "steelblue", lwd = 2)
```

The blue smoother sits well above the zero line for the first half of the year and well below it for the second half. The residuals are not shuffled around zero, they are drifting.

The split is stark enough to measure directly.

```r
# Average residual in the first half of the year against the second
round(c(jobs_1_to_27  = mean(residuals(fit)[1:27]),
        jobs_28_to_60 = mean(residuals(fit)[28:60])), 2)
#>  jobs_1_to_27 jobs_28_to_60
#>          0.76         -0.62
```

For the first 27 jobs the model under-predicts by 46 minutes on average, and for the remaining 33 it over-predicts by 37 minutes. Something changed at the company partway through the year, and because the model has no column for it, the change went into the residuals instead.

The standard test for this pattern is Durbin-Watson, which compares each residual with the one immediately before it:

\[ DW \;=\; \frac{\sum_{t=2}^{n}\left(e_t - e_{t-1}\right)^2}{\sum_{t=1}^{n} e_t^2} \]

The numerator adds up how far each residual jumps from its predecessor. When neighbouring residuals are unrelated those jumps are large and the ratio lands near 2. When neighbours resemble each other the jumps are small and the statistic falls toward 0. Values above 2 mean the opposite, residuals that flip sign every time.

```r
# Test independence: does each residual resemble the one before it
dwtest(fit)
#>
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 1.1761, p-value = 0.0004451
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW comes back at 1.18 against the 2 you want, with a p-value of 0.00045. The correlation behind that number is easy to see on its own.

```r
# Correlate each residual with the one immediately before it
r <- residuals(fit)
round(cor(r[-60], r[-1]), 3)
#> [1] 0.397
```

A correlation of 0.4 between consecutive jobs means the residuals carry roughly 40% of themselves forward. Each new job is not a fresh piece of evidence about the model, it is partly a repeat of the last one, and a model with 60 correlated rows knows less than a model with 60 independent ones. The standard errors, computed as though all sixty counted fully, come out too small.

[NOTE]
This check needs the rows in a meaningful order to mean anything at all. Sort the same sixty jobs by box count and the drift vanishes from the plot without a thing about the data changing. Run it in the order the data was collected, which for job sheets, logs and anything carrying a date is time order.

=== step === quiz
## Quick check: what a drift in job order means

The residuals averaged 0.76 hours above the line for the first 27 jobs and 0.62 below it for the remaining 33. What is the sensible reading?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The jobs were entered into the sheet in a strange order, and sorting them properly would remove the drift. ::no
- Something about the business changed partway through the year, and because the model has no column for it, the change is showing up in the residuals. ::ok Yes. A residual is whatever the model could not account for, so a variable that moves with time and is missing from the model leaves its shape there.
- The residuals are not normally distributed, so the p-values cannot be trusted. ::no
- The model needs more data before the drift will settle down. ::no The order here is the real order the jobs happened in, so the drift is a fact about the business rather than a filing accident. It is also not a normality question, since that concerns the shape of the residuals and not their sequence, and more jobs collected the same way would extend the drift rather than dissolve it.

=== step === concept
## Are the residuals close to normal?

The fourth promise is about the shape of the residuals: they should be roughly normal, the familiar bell.

Be precise about what the claim covers, because this is where most of the confusion sits. It says nothing about the hours column, and nothing about the boxes column. Both are free to be as skewed as they like. It is only the residuals, what is left after the model has done its work, that are supposed to be bell shaped.

What the promise buys you is the t distribution. The p-values and the intervals in the summary are all read off a t distribution, and that reading is exact when the errors are normal. So this promise holds up the small print of the inference rather than the coefficient itself.

The tool is the Q-Q plot. It sorts the residuals from smallest to largest and plots each one against the value a perfectly normal sample of the same size would have in that position. If the residuals really are normal, every point lands on the diagonal.

```r
# Check the shape of the residuals against a normal distribution
plot(fit, which = 2)
```

The points track the diagonal closely through the middle and wander a little at the ends, which is what a normal sample of 60 looks like. One point at the bottom left sits well off the line, and that is a job we will come back to.

There is a test for it as well. Shapiro-Wilk takes the null hypothesis that the residuals are normal, so here a large p-value is the reassuring one.

```r
# Test the residuals for normality
shapiro.test(residuals(fit))
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.97992, p-value = 0.4253
#>
```

A p-value of 0.43 gives no reason to doubt normality. This is the one promise the job sheet keeps.

It is also, honestly, the least demanding of the five, and it is worth knowing why. With enough rows the sampling distribution of the coefficients tends toward normal whatever the errors look like, so mild skew stops mattering. Sixty rows is usually enough for that to be working in your favour. Normality earns its keep when the sample is small, when you need a prediction interval for one future job, or when the residuals are so lopsided that they are pointing at a wrong model rather than an odd shape.

[TIP]
When a Q-Q plot does look bad, treat it as a symptom before treating it as the problem. Skewed residuals usually mean a missing variable or a wrong shape, and repairing that repairs the Q-Q plot along with it. Reaching for a transformation on the strength of the Q-Q plot alone is treating the reading rather than the cause.

=== step === quiz
## Quick check: what the Q-Q plot does and does not tell you

The Q-Q plot came back clean and Shapiro-Wilk gave p = 0.43. Which statement is right?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The hours column is normally distributed. ::no
- The model has passed its assumption checks, so the p-values in the summary can be trusted. ::no
- Both the hours and the boxes columns are close enough to normal for the regression to be valid. ::no Normality is a promise about the residuals, never about the raw columns, which are free to be as skewed as they like. It is also only one of the five, so a clean Q-Q plot cannot vouch for the shape, the spread, the independence, or the pull of any single row.
- The residuals are close to normal, which supports the t based p-values and intervals and says nothing at all about the other four checks. ::ok Exactly right. Normality is a claim about what is left over once the model has fitted, and each of the five checks stands on its own.

=== step === concept
## Is one job setting the slope?

The fifth promise is the odd one out. The first four are about the errors as a group, and this one is about individual rows: no single job should be deciding the answer for all the others.

Two different ideas hide inside that, and keeping them apart is what makes this check usable rather than a vague hunt for weird rows.

Leverage is about position. A row has high leverage when its predictor value sits far from the rest, because a point out on its own has room to swing the line. Influence is about consequence, whether the answer actually moves when you take the row away. Leverage is potential, and influence is what came of it.

The widget below makes the difference physical. The far-right point has high leverage wherever you drag it, because it is always the only point out there. Watch how much of that leverage turns into influence as you move it up and down.

::widget leverage-point {}

Now to the job sheet. Leverage is measured by the hat value, a number between 0 and 1 saying how much of its own fitted value a row is responsible for. Hat values always average out to p over n, where p is the number of coefficients, so the usual flag is set at twice that average.

```r
# Leverage: which jobs sit furthest from the rest on box count
round(sort(hatvalues(fit), decreasing = TRUE)[1:4], 3)
#>    23     7    59    16
#> 0.289 0.059 0.058 0.057

2 * 2 / 60
#> [1] 0.06666667
```

Job 23 has a hat value of 0.289 against a flag line of 0.067, and the next highest job in the whole sheet is 0.059. That is the 380-box office move, sitting on its own out past every house move on the list.

High leverage is not itself a fault, though. Plenty of high-leverage points sit exactly where the line was going anyway and change nothing. For the consequence you want Cook's distance, which drops each row in turn, refits, and measures how far all sixty predictions move as a result.

```r
# Influence: how much does the answer move if a job is dropped
round(sort(cooks.distance(fit), decreasing = TRUE)[1:4], 3)
#>    23    55     7     4
#> 2.679 0.087 0.073 0.072
```

Job 23 scores 2.679. Every other job on the sheet comes in under 0.09. Common flags are 0.5 or 1, and this is several times either.

R gives you both readings in one picture, with residuals against leverage and Cook's distance drawn on as dashed contours.

```r
# Leverage against residual, with Cook's distance contours
plot(fit, which = 5)
```

Job 23 sits alone at the far right, outside the dashed contour, exactly where a single influential row shows up.

Since Cook's distance is defined by refitting, you can watch it happen. Drop job 23 and fit the same model on the remaining 59.

```r
# Refit without the office move and compare the two slopes
fit_no23 <- lm(hours ~ boxes, data = jobs[-23, ])
round(rbind(all_60_jobs = coef(fit), without_job_23 = coef(fit_no23)), 4)
#>                (Intercept)  boxes
#> all_60_jobs         5.1946 0.0368
#> without_job_23      4.7192 0.0417
```

The rate per box goes from 0.0368 to 0.0417 hours, a jump of 13%, on the strength of one row out of sixty. Quote the largest house move on the sheet, 219 boxes, and the two fits are 35 minutes apart.

And the definition really is that plain. Take the change in every fitted value, square it, add it all up, and divide by the number of coefficients times the residual variance.

```r
# Cook's distance for job 23 computed by hand, from the two fits
p  <- 2
s2 <- summary(fit)$sigma^2

sum((fitted(fit) - predict(fit_no23, jobs))^2) / (p * s2)
#> [1] 2.678921
```

The same 2.679 that `cooks.distance()` reported, worked out from the two fits directly.

So what do you do about it? Not delete it, which is the reflex and it is the wrong one. Three things, in order:

1. Check the row is real. A 380 in a column where everything else is under 220 is exactly what a typing slip looks like. Here it is genuine.
2. Ask whether it is the same kind of job. An office move with a lift, a loading bay and a different packing style is arguably a different business, and a model of house moves may simply not be about it.
3. Report both fits. When a conclusion depends on one row, that fact belongs in what you report, not in a decision you make quietly.

[WARNING]
Dropping an inconvenient row because it is influential is how a model gets fitted to the answer you wanted. Influence tells you a row matters, and nothing more. The only grounds for removing it are that it is wrong, or that it belongs to a different population than the one you are modelling.

=== step === concept
## Fixing the shape: hours and boxes on a log scale

All five checks are in now, and four of them failed. Start with two of those four, because they turn out to be one problem seen twice. The line sat above the smallest jobs and below the middle ones, and the size of the misses grew as the jobs grew. Those are two views of one fact: moving time rises with box count but rises at a decreasing rate, and the error rises in proportion to the job rather than by a fixed number of hours.

A relationship that multiplies rather than adds becomes a straight line when you take logs of both sides. So instead of predicting hours from boxes, predict log hours from log boxes.

```r
# Refit on a log scale for both hours and boxes
log_fit <- lm(log(hours) ~ log(boxes), data = jobs)
round(coef(log_fit), 3)
#> (Intercept)  log(boxes)
#>       0.138       0.452

2 ^ coef(log_fit)[2]
#> log(boxes)
#>   1.367653
```

The coefficient of 0.452 reads as a percentage for a percentage: a 1% increase in boxes buys about 0.45% more hours. The second line says the same thing in a way you can quote out loud. Double the boxes and the job takes about 1.37 times as long, not twice as long, which is the diminishing return the arch was pointing at all along.

Now check the shape again on the new model.

```r
# Does the arch survive the change of scale
plot(log_fit, which = 1)
```

The smoother is flat now, running along zero across the whole range instead of arching over it. That is the first failed check repaired.

Then look at what happened to the second one, which nobody touched.

```r
# The spread test on the log scale model
bptest(log_fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  log_fit
#> BP = 0.0010313, df = 1, p-value = 0.9744
```

From 0.00017 to 0.97, with no separate repair aimed at it. That is not luck. On the hours scale a 10% overrun on a fifteen-hour job is an hour and a half while the same 10% on a five-hour job is half an hour, so the errors had to fan out. On the log scale a 10% overrun is the same distance wherever it happens, so the fan closes.

[KEY INSIGHT]
A curve in the residuals and a funnel in the spread very often have one cause and one repair. When errors are proportional to the size of the thing being measured, logging both sides straightens the shape and evens the spread in a single move.

=== step === concept
## Fixing dependence: the variable the model was missing

The independence check has not been rerun since the change of scale, so start there.

```r
# Did the change of scale do anything for the drift in job order
dwtest(log_fit)
#>
#> 	Durbin-Watson test
#>
#> data:  log_fit
#> DW = 0.87591, p-value = 9.25e-07
#> alternative hypothesis: true autocorrelation is greater than 0
```

No. The statistic went from 1.18 to 0.88, further from 2 than it was before, because the drift lives in time rather than in shape and no change of scale can reach it.

So look back at where it turned over. The residuals sat high through the first 27 jobs and low after that, so ask what was different about job 28.

The job sheet has the answer sitting in a column the model never used. From week 27 onward the crew column reads 3 instead of 2, because a third person joined the company partway through the year.

That accounts for the whole pattern. For the first half of the year two people did all the work, so jobs ran longer than a model that had not been told why. From week 27 a third pair of hands made every job faster, and the same model started quoting more hours than the crew actually needed. The residuals were not misbehaving, they were carrying a variable the model could not see.

So give it the column.

```r
# Add the crew size the model was missing
full_fit <- lm(log(hours) ~ log(boxes) + crew, data = jobs)
summary(full_fit)
#>
#> Call:
#> lm(formula = log(hours) ~ log(boxes) + crew, data = jobs)
#>
#> Residuals:
#>      Min       1Q   Median       3Q      Max
#> -0.10870 -0.03376 -0.01156  0.04460  0.13262
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  0.61986    0.07647   8.106 4.59e-11 ***
#> log(boxes)   0.42703    0.01242  34.371  < 2e-16 ***
#> crew        -0.14475    0.01571  -9.213 6.94e-13 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 0.05912 on 57 degrees of freedom
#> Multiple R-squared:  0.9627,	Adjusted R-squared:  0.9614
#> F-statistic: 735.5 on 2 and 57 DF,  p-value: < 2.2e-16
```

The crew coefficient is negative, which is what you would hope: more people, less time. On a log scale it converts into a percentage.

```r
# Turn the crew coefficient into plain percentage terms
round(100 * (exp(coef(full_fit)["crew"]) - 1), 1)
#>  crew
#> -13.5
```

Adding a third person takes about 13.5% off a job, holding box count fixed. That is a genuinely useful sentence for the business, and it was unavailable while the information sat in the residuals.

Now the independence check.

```r
# Has adding crew size restored independence between consecutive jobs
dwtest(full_fit)
#>
#> 	Durbin-Watson test
#>
#> data:  full_fit
#> DW = 2.0095, p-value = 0.4768
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW moves from 1.18 to 2.01, as close to the ideal 2 as you could ask for, with a p-value of 0.48.

[KEY INSIGHT]
A failed check is a lead, not a verdict on your data. Residuals that drift with time, or with anything else, are telling you a variable is missing, and the repair is usually to find it and add it rather than to patch the standard errors.

=== step === concept
## The two-line check, and which fix goes with which failure

Running these one at a time is how you learn them. Running them on a real model is quicker than that, because four of the five come out of a single call.

```r
# All four residual based checks in one call, for the repaired model
par(mfrow = c(2, 2))
plot(full_fit)
par(mfrow = c(1, 1))
```

The four panels are the ones already used: residuals versus fitted for shape, the Q-Q plot for normality, scale-location for spread, and residuals versus leverage with the Cook's distance contours. Independence is the one that needs its own line, because the plot method has no way of knowing what order your rows are in.

Here are the three tests on the repaired model together.

```r
# The formal tests on the repaired model: spread, independence, normality, influence
bptest(full_fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  full_fit
#> BP = 2.0807, df = 2, p-value = 0.3533

dwtest(full_fit)
#>
#> 	Durbin-Watson test
#>
#> data:  full_fit
#> DW = 2.0095, p-value = 0.4768
#> alternative hypothesis: true autocorrelation is greater than 0

shapiro.test(residuals(full_fit))
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(full_fit)
#> W = 0.97947, p-value = 0.4067

round(max(cooks.distance(full_fit)), 3)
#> [1] 0.15
```

Every one of them clears now. Spread at 0.35, independence at 0.48, normality at 0.41, and the largest Cook's distance on the sheet at 0.15 against a flag of 0.5.

Here is the whole thing on one page, so you have the mapping from symptom to repair.

| Check | What failure looks like | What it costs you | The fix that worked here |
|---|---|---|---|
| Straight line | the smoother arches instead of running flat | the model misses in a pattern, so predictions are biased by size | log both sides, since the relationship multiplies |
| Equal spread | the band of residuals fans out as the prediction grows | one blended standard error, so intervals are wrong at both ends | the same log scale closed the fan |
| Independence | residuals drift up or down through the row order | standard errors too small, so results look surer than they are | add the missing variable, here the crew size |
| Normal errors | points bend away from the diagonal on the Q-Q plot | the t based p-values and intervals lose their exactness | already fine at 60 rows, and usually a symptom of another failure |
| No row in charge | one Cook's distance dwarfs all the others | the answer belongs to one row rather than to the data | verify the row, ask if it belongs, and report both fits |

[TIP]
Run the four-panel plot and the independence test the moment you fit a model, before you read the coefficient. It is quicker than reading the summary, and it tells you whether the summary is worth reading.

=== step === quiz
## Quick check: which failure is this, and what fixes it

Suppose the moving company fits a fresh model and finds the residual band narrow on short jobs and wide on long ones, while the smoother through the middle stays flat. Which check has failed, and what is the sensible first move?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Equal spread has failed while the shape is fine, so confirm it with a Breusch-Pagan test and try modelling on a log scale. ::ok Right. A flat smoother says the shape is fine, and a fanning band is spread alone, which is exactly the failure a log scale usually settles.
- The straight line check has failed, so the model needs a squared term added. ::no
- Independence has failed, so the rows need sorting before the model is refitted. ::no
- Normality has failed, so the residuals need a transformation before the p-values mean anything. ::no The smoother is flat, so the shape of the model is not the problem, and nothing here concerns the row order or the bell shape of the residuals. A band that fans out with the prediction while the smoother stays level is the equal spread check and nothing else.

=== step === tryit
## Your turn: does the office move still run the show?

Job 23, the 380-box office move, carried a Cook's distance of 2.679 on the original model while no other job reached 0.09. The model has changed twice since then, so the honest thing is to ask the question again rather than assume.

Check job 23 on the repaired model, `full_fit`, and then refit without it to see whether the box coefficient moves.

```r
# full_fit is lm(log(hours) ~ log(boxes) + crew, data = jobs).
# Print the hat value and the Cook's distance for job 23 on full_fit.
# Then refit the same model on jobs[-23, ] and compare the two sets of coefficients.
# Press Check when you have both.
```
::check {"regex": "cooks[.]distance[(]\\s*full_fit[\\s\\S]*jobs\\s*\\[\\s*-\\s*23", "gate": true, "difficulty": "intermediate", "ok": "Yes. The hat value falls from 0.289 to 0.104 and Cook's distance from 2.679 to 0.142, and the box coefficient barely moves, 0.427 against 0.434. The office move is an ordinary row on this model.", "no": "Two moves. First `hatvalues(full_fit)[23]` and `cooks.distance(full_fit)[23]`, then refit with `lm(log(hours) ~ log(boxes) + crew, data = jobs[-23, ])` and compare its coefficients with the ones from `full_fit`."}
::solution
```r
# Job 23 on the repaired model, and the same model fitted without it
round(c(hat = hatvalues(full_fit)[23], cook = cooks.distance(full_fit)[23]), 3)
#>  hat.23 cook.23
#>   0.104   0.142

no23 <- lm(log(hours) ~ log(boxes) + crew, data = jobs[-23, ])
round(rbind(all_60_jobs = coef(full_fit), without_job_23 = coef(no23)), 3)
#>                (Intercept) log(boxes)   crew
#> all_60_jobs          0.620      0.427 -0.145
#> without_job_23       0.599      0.434 -0.147
```

Nothing about job 23 changed. What changed is the scale it is measured on. Taking logs put 380 boxes only a short way past 220, so the office move stopped sitting alone out on the right, and its leverage fell with it.

That is worth remembering. Influence is a property of the row and the model together, so repairing the model can dissolve an influential point without anybody deleting anything.

=== step === quiz
## Quick check: what the five checks protect

The original model had an R-squared of 0.83 and a p-value under 2e-16 while four of the five checks were failing. What are the five checks actually protecting?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The size of the coefficient, which is the number a broken assumption distorts most. ::no
- The R-squared, which drops as soon as an assumption breaks. ::no
- The standard errors, intervals and p-values, which is why a high R-squared says nothing about whether the assumptions hold. ::ok Exactly. The fit can stay respectable while the uncertainty around it stops being honest, which is precisely what the dial showed.
- Nothing measurable, since the checks are a formality that rarely changes a conclusion. ::no A broken assumption usually leaves the coefficient roughly where it was and R-squared looking healthy, and lands its damage on the uncertainty instead. That is why the summary cannot warn you, and why the checks are not a formality: they decide whether the p-value and the interval mean anything.

=== step === concept
## References

- [An R Companion to Applied Regression, 3rd edition](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), Sage. The diagnostics chapter behind these five checks, and the source of most of the R practice around them.
- [Detection of Influential Observation in Linear Regression](https://doi.org/10.1080/00401706.1977.10489493) - Cook (1977), Technometrics 19(1), 15-18. The paper that defines Cook's distance as the change in the fitted values when a row is dropped.
- [A Simple Test for Heteroscedasticity and Random Coefficient Variation](https://doi.org/10.2307/1911963) - Breusch and Pagan (1979), Econometrica 47(5), 1287-1294. The test behind `bptest()`.
- [Testing for Serial Correlation in Least Squares Regression II](https://doi.org/10.1093/biomet/38.1-2.159) - Durbin and Watson (1951), Biometrika 38(1-2), 159-177. Where the statistic and its null distribution come from.
- [Plot Diagnostics for an lm Object](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html) - R Core Team. Exactly what each of the four panels draws, and how to choose among them.

=== step === complete
## Quick recap

You took a regression whose summary looked excellent, ran the five checks on it, found four of them broken, and repaired the model until they cleared. To summarise:

- A residual is the recorded value minus the fitted one, and all five checks are different readings of the residuals.
- A straight line was the wrong shape, which the residuals versus fitted plot showed as an arch rather than a flat band.
- The errors grew with the prediction, 0.69 hours of spread on the smallest third of jobs against 1.47 on the largest, confirmed by Breusch-Pagan at p = 0.00017.
- The errors were not independent, drifting from 0.76 hours above the line to 0.62 below, with Durbin-Watson at 1.18 against the ideal 2.
- The residuals were close to normal, at p = 0.43, and that was the one promise the data kept.
- One job out of sixty, the 380-box office move, carried a Cook's distance of 2.679 while nothing else reached 0.09, and dropping it moved the rate per box by 13%.
- Logging both hours and boxes cleared the shape and the spread together, and adding the crew column cleared the independence. The repaired model passes all five.

The habit that goes with all of this is short. Fit the model, run `par(mfrow = c(2, 2)); plot(model)` and one `dwtest()`, and only then read the summary. It costs a minute, and it decides whether the rest of the output is worth anything.

Next time a check fails on you, read it as a lead rather than a setback. It is the model telling you something specific about your data that the summary had no way to say. Congratulations, and have a great day!

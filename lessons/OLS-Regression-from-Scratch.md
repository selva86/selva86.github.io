---
title: "Regression Modeling Lesson 1: OLS Regression from Scratch"
catalog_blurb: "How regression finds the best-fitting line, and what its numbers mean."
description: "Build linear regression from scratch: the line that minimizes squared error, the normal equations, fitting lm() in R, and reading coefficients and R-squared."
keywords: "OLS regression, linear regression, least squares, residuals, normal equations, lm in R, R-squared, slope and intercept, regression from scratch, R"
post_type: "LESSON"
curriculum_id: "6.20.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "1"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Regression-Assumptions-and-Residuals.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## OLS Regression from Scratch

Welcome to the Regression Modeling track. Meet Priya, who runs a small iced-coffee cart outside a train station. She has a hunch: warmer days sell more coffee. For 12 days she jotted down two numbers, the day's high temperature and the cups she sold. Plotted below, her hunch looks right. But a hunch is not a tool. Priya wants the *line* through those dots, because the line answers three real questions: how many extra cups does each warmer degree buy, what should she stock for tomorrow's 25 degree forecast, and how much should she trust the answer at all.

That line is what regression gives you, and it is the workhorse of data science: it draws the single best line through a cloud of points and turns it into numbers you can read and act on. This first lesson builds it from the ground up, no black boxes.

By the end of this lesson you will be able to:

- Read a regression line as a prediction rule, and say what its slope and intercept mean
- Explain what makes the "best" line best, and fit it in R with one function
- Read the coefficients and the R-squared, and know where the line stops being trustworthy

**Prerequisites:** you can run R and read its output, and you know what a scatter plot and an average are. No statistics or modeling is assumed; every term is defined as it appears.

::widget chart-plotter {"data":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}],"geoms":["point"],"x":"temp","y":"cups"}

The dots climb from lower-left to upper-right: warmer means more cups. The number in the corner is the correlation, near 1, confirming a strong straight-line trend. Now let us find the line itself.

=== step === concept
::eyebrow The idea
## Many lines, one best

You could lay a ruler across Priya's dots a thousand ways. Every line is a guess of the form

\[ \widehat{\text{cups}} = b_0 + b_1 \cdot \text{temp} \]

Read that out loud: the predicted cups (the little hat on cups means "the line's estimate, not the real number") equal an **intercept** \(b_0\) plus a **slope** \(b_1\) times the temperature. The slope \(b_1\) is the engine: it says how many more cups you expect for each extra degree. The intercept \(b_0\) is just where the line crosses temperature zero, the starting height. Pick those two numbers and you have picked a line.

So which two numbers are best? The line that sits *closest* to the dots. To make "closest" precise we measure, for each day, how badly the line missed. That miss is the **residual**: the actual cups minus the cups the line predicted for that day.

\[ e_i = y_i - \hat y_i \]

Here \(y_i\) is day \(i\)'s real cups, \(\hat y_i\) is the line's prediction for that day, and \(e_i\) is the leftover gap, positive when the line guessed too low, negative when too high. A good line makes all those gaps small at once.

We cannot just add the raw gaps, because the positives and negatives would cancel and a terrible line could score zero. So we **square** each residual first (which also punishes one big miss far more than several small ones) and add them up. That total is the **sum of squared errors**:

\[ \text{SSE} = \sum_{i=1}^{n} (y_i - \hat y_i)^2 \]

where \(n\) is the number of days. **Ordinary Least Squares (OLS)** is the rule that picks the one slope and intercept making this SSE as small as it can possibly be.

[KEY INSIGHT]
Every line you could draw has a sum of squared errors. OLS is simply the line that wins that contest: the smallest SSE, the tightest overall fit to the data.

Strip the coffee labels off for a moment. Below is a handful of points and a line you can grab. Drag the slope and intercept, and each point drops a red square whose *area* is its squared error. Watch the running SSE. Then press **Snap to least squares** to jump straight to the winning line.

::widget ols-fit {}

There is a shortcut to that winner. Setting the slope of the SSE to zero (the calculus of "lowest point") gives two formulas, called the **normal equations**, that compute the best slope and intercept directly:

\[ b_1 = \frac{\sum_i (x_i - \bar x)(y_i - \bar y)}{\sum_i (x_i - \bar x)^2}, \qquad b_0 = \bar y - b_1 \bar x \]

where \(x_i, y_i\) are a day's temperature and cups, and \(\bar x, \bar y\) are their averages. You will not crank these by hand: with many predictors they bundle into one matrix equation, and R solves it for you in a microsecond, which is exactly what we do next.

=== step === quiz
::eyebrow Check yourself
## Why square the misses?

A residual is the gap between a day's actual cups and the cups the line predicted for that day. OLS adds up the **squared** residuals and picks the line that makes that total smallest. Why square each residual first, instead of just adding the raw gaps?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Squaring converts cups into a percentage, so the errors become comparable ::no Squaring does not change the units into percentages; a squared residual is in "cups squared." Its job is about signs and emphasis, not rescaling.
- So gaps above and below the line cannot cancel out, and a big miss counts far more than a small one ::ok Exactly. Raw gaps would cancel (a +5 and a -5 sum to 0), letting an awful line look perfect. Squaring makes every miss positive and makes large misses dominate, which is what pulls the line tight to the data.
- Because the best line must pass exactly through every point, and squaring forces it to ::no No line passes through every point unless the data is perfectly straight. OLS does not aim for that; it minimizes the total squared gap across all points at once.

=== step === concept
::eyebrow In R
## Fit it in one line

Time to stop dragging and let R find the exact winner. Each lesson runs in a fresh R session, so we type Priya's 12 days in directly, then hand them to `lm()`, R's linear-model function. The formula `cups ~ temp` reads "model cups as a function of temp."

```r
# Priya's log: the day's high temperature (deg C) and iced coffees sold.
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60)
)

fit <- lm(cups ~ temp, data = coffee)   # least squares, solved for us
round(coef(fit), 3)
#> (Intercept)        temp
#>       0.818       1.944
```

Two numbers come back, and they are exactly the slope and intercept the Snap button hunted for. `coef(fit)` labels them: the **intercept** \(b_0 = 0.818\) and the **slope** on `temp`, \(b_1 = 1.944\). So Priya's fitted line is

\[ \widehat{\text{cups}} = 0.818 + 1.944 \cdot \text{temp} \]

The slope is the headline: each extra degree of temperature is worth about **1.94 more cups**, call it two cups a degree. That single number is what a hunch could never give her. We will read the intercept carefully in a moment, but first, let us put the line to work.

=== step === tryit
::eyebrow Your turn
## Predict tomorrow

Tomorrow's forecast is **25 degrees**. Use the fitted model to predict how many cups Priya should prep for. `predict()` needs the new day handed to it as a small data frame, through its `newdata` argument. Fill in the blank so it scores the 25 degree day.

```r
new_day <- data.frame(temp = 25)
predict(fit, ____)
```
::check {"regex":"newdata\\s*=\\s*new_day","gate":true,"difficulty":"beginner","ok":"About 49.4 cups. That is just the line evaluated at 25: 0.818 + 1.944 times 25. Priya preps 50 and goes home early.","no":"Hand predict() the new day through its newdata argument: predict(fit, newdata = new_day)."}
::solution
```r
new_day <- data.frame(temp = 25)
predict(fit, newdata = new_day)
#>        1
#> 49.41121
```

=== step === concept
::eyebrow How good is the fit?
## R-squared: how much the line explains

Priya has a line, but is it a *good* line? A slope alone cannot say; she needs to know how much of the day-to-day swing in cups the temperature actually accounts for. That is what **R-squared** measures.

The idea is a fair comparison. If Priya had no model at all, her best single guess for any day would be the average cups, and her total error would be the squared distance of every day from that average, the **total sum of squares**:

\[ \text{SST} = \sum_{i=1}^{n} (y_i - \bar y)^2 \]

The line does better than the average, and its leftover error is the SSE from before. R-squared is the *fraction of that baseline error the line removes*:

\[ R^2 = 1 - \frac{\text{SSE}}{\text{SST}} \]

If the line explained nothing, SSE would equal SST and \(R^2 = 0\). If it passed through every point, SSE would be 0 and \(R^2 = 1\). Let us compute both pieces on Priya's data and read the result.

```r
sse <- sum(residuals(fit)^2)                       # squared misses the line still leaves
sst <- sum((coffee$cups - mean(coffee$cups))^2)    # squared misses if you only knew the average
round(c(sse = sse, sst = sst, r_squared = 1 - sse / sst), 3)
#>      sse      sst r_squared
#>   44.015 1218.667     0.964
```

\(R^2 = 0.964\). Temperature explains about **96% of the variation** in Priya's daily cups; only 4% is left to everything else, weekends, rain, a passing tour group. That is an unusually tight fit (real business data is messier), but it tells her the line is worth trusting. R reports the same number for you as `summary(fit)$r.squared`.

=== step === quiz
::eyebrow Check yourself
## What does R-squared of 0.96 mean?

Priya's regression of cups on temperature has \(R^2 = 0.96\). Which statement reads that number correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- About 96% of the variation in daily cups is accounted for by temperature; the rest is other factors ::ok Right. R-squared is the share of the total up-and-down in the outcome that the line explains. 0.96 means temperature captures almost all of it, leaving a small slice to everything the model leaves out.
- The line's predictions are correct 96% of the time ::no R-squared is not an accuracy rate or a probability. It measures how much of the *variation* the line explains, not how often a prediction is exactly right (regression predictions of a number are almost never exactly right).
- Temperature causes 96% of Priya's coffee sales ::no R-squared says nothing about cause. It only measures how well the line fits; a high R-squared can come from a lurking third variable, as the next step warns.

=== step === concept
::eyebrow Knowing the limits
## Reading the line responsibly

A fitted line is confident everywhere, even where it has no business being. Two cautions keep you honest.

**Do not extrapolate far past your data.** Priya's temperatures run from 15 to 31 degrees. Ask the line about a freak 40 degree heatwave and it cheerfully answers \(0.818 + 1.944 \times 40 \approx 79\) cups, but nothing in her data supports that. Sales might keep rising, or the cart might sell out, or commuters might just stay home in air conditioning. The same trap explains the intercept: \(b_0 = 0.818\) is the predicted cups at 0 degrees, far outside her 15-to-31 range, so reading it as "she sells about one cup when it freezes" is meaningless. The intercept is where the line *crosses*, not a real prediction.

**A line is not a cause.** Temperature and cups move together, but the regression alone cannot prove temperature *drives* sales. Maybe warm days fall on summer weekends when foot traffic is high anyway. Correlation, however tight, is evidence to investigate, not a verdict.

[WARNING]
A high R-squared means the line fits the data you have; it does not license predictions outside that range, and it never, on its own, establishes causation. Trust the line inside its data, and stay skeptical past the edges.

=== step === quiz
::eyebrow Check yourself
## Where does the line stop being trustworthy?

Priya's model, fit on days from 15 to 31 degrees, is \(\widehat{\text{cups}} = 0.818 + 1.944 \cdot \text{temp}\). A reporter asks her to predict sales for a record 42 degree day. What is the honest answer?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Plug in 42; the model gives about 82 cups, so that is the prediction ::no The arithmetic works, but 42 degrees is well outside the 15-to-31 range the line was fit on. Extrapolating that far assumes the straight-line trend holds where you have zero evidence.
- R-squared is 0.96, so any prediction the model makes is reliable ::no A high R-squared describes the fit *within* the observed data. It says nothing about whether the relationship still holds at temperatures the model never saw.
- The model can suggest a number, but 42 degrees is outside the data range, so the prediction is an unsupported extrapolation and should be flagged as such ::ok Exactly. You can compute it, but you must label it as extrapolation. The trustworthy zone is the range you actually observed; beyond it the straight line is an assumption, not a finding.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the clearest first treatment of linear regression, coefficients, and R-squared.
- [The Elements of Statistical Learning, ch. 3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full least-squares derivation, including the matrix normal equations.
- [R for Data Science (2e), chapter on model basics](https://r4ds.hadley.nz/) - building and reading models in R with the tidyverse mindset.
- [R documentation: lm()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - the function you used, with every argument and what it returns.

=== step === complete
## Lesson 1 complete

You built linear regression from the ground up: a line is a prediction rule, the *best* line is the one that minimizes the sum of squared residuals, the normal equations (and `lm()`) find it instantly, the coefficients read as a slope and an intercept with real-world meaning, and R-squared tells you how much of the variation the line explains, with extrapolation and causation as the two cliffs to avoid.

Next, Lesson 2: Regression assumptions and residuals. The line you just fit comes with fine print, four assumptions it quietly relies on, and the residuals you met today are exactly the diagnostic tool that tells you whether those assumptions hold or your model is lying to you.

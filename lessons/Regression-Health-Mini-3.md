---
title: "Robust regression: when outliers bite"
slug: "Regression-Health-Mini-3"
description: "One extreme income can drag a least squares line into saying the opposite of the truth. Fit a robust line on the same data and read the weights it gives."
keywords: "robust regression in r, rlm in r, m-estimation, huber weights, tukey bisquare, outliers in regression, iteratively reweighted least squares, mm-estimation"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "3"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-2"
course_next: ""
curriculum_id: "0.0.26"
lesson_access: "windowed"
catalog_blurb: "Why one extreme value bends a regression line, and how to resist it."
---

=== step === cover
::eyebrow Regression Health Check
## Robust regression: when outliers bite

You survey fifty working people, and you ask each of them two questions: how many years they have been doing the job, and what they earn in a year.

Forty nine of them answer the way you would expect. Person 11 sold their company last year, so they write down 48,000,000.

You fit a line anyway, because that is what you do with two columns of numbers. The line comes back saying that every extra year of experience costs a person 205,172 a year.

It says costs, not earns.

So one respondent out of fifty has rewritten the answer for the other forty nine. Ordinary regression minimises squared errors, so somebody who misses the line by a lot does not nudge it, they yank it.

Robust regression refuses to let any single row shout that loudly. Here is what we are going to do about person 11.

::widget process-flow {"steps":[{"title":"See the damage","sub":"fit least squares on all 50 and watch the slope turn negative"},{"title":"Turn the row down","sub":"refit with rlm(), which gives every person a weight as it fits"},{"title":"Decide which fit to report","sub":"work out whether person 11 is a wrong number or a real answer"}]}

We are going to run both fits on the same fifty people, work out one of those weights by hand, and then decide which of the two answers you would actually publish.

=== step === concept
## The survey, and the line it gives you

Let's get the numbers on the table first, because everything from here on is computed from them.

Each of the fifty rows is one person. `years` is how long they have been working, `income` is what they earn in a year. Press Run and look at row 11.

```r
# Build the 50-person survey and look at the rows around person 11
set.seed(2026)
survey <- data.frame(years = sample(1:25, 50, replace = TRUE))
survey$income <- round(28000 + 2400 * survey$years + rnorm(50, 0, 6000), -2)
survey$income[11] <- 48000000

head(survey, 12)
#>    years   income
#> 1     25    79700
#> 2      1    29900
#> 3      6    44900
#> 4     13    57400
#> 5     15    70400
#> 6     12    58800
#> 7      4    38200
#> 8     16    74100
#> 9      5    50000
#> 10    12    67500
#> 11     2 48000000
#> 12    24    94300
```

Row 11 says two years of experience and 48,000,000 a year. Every other row on screen is in the tens of thousands, running from 29,900 up to 94,300, which is what a survey like this normally looks like.

Now plot the fifty people the way you always would.

```r
# Plot all 50 people: income against years of experience
plot(survey$years, survey$income, pch = 19, col = "grey40",
     main = "Fifty people, income against experience",
     xlab = "Years of experience", ylab = "Annual income")
```

That is the first thing an extreme value does to you. The y axis has to stretch to 48 million to fit one person, so the other forty nine are pressed into a flat strip along the bottom and the axis labels come back in scientific notation. There is a relationship in there somewhere, but you cannot see it.

Cut the y axis at 100,000 and the forty nine come back.

```r
# Same plot, with the y axis cut at 100,000 so the other 49 people are visible
plot(survey$years, survey$income, pch = 19, col = "grey40",
     ylim = c(0, 100000),
     main = "The same 50 people, y axis cut at 100,000",
     xlab = "Years of experience", ylab = "Annual income")
```

There it is. Income climbs with experience in a fairly straight line, which is exactly the pattern the survey set out to measure. Person 11 is now above the top of the picture, which is fine, we know where they are.

So let's fit the model, ordinary least squares on all fifty rows.

```r
# Fit ordinary least squares on all 50 rows and read the summary
ols_fit <- lm(income ~ years, data = survey)
summary(ols_fit)
#> Call:
#> lm(formula = income ~ years, data = survey)
#>
#> Residuals:
#>      Min       1Q   Median       3Q      Max
#> -3005261 -2172500  -723775    98961 45170011
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  3240332    1872153   1.731   0.0899 .
#> years        -205172     148537  -1.381   0.1736
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 6719000 on 48 degrees of freedom
#> Multiple R-squared:  0.03823,	Adjusted R-squared:  0.01819
#> F-statistic: 1.908 on 1 and 48 DF,  p-value: 0.1736
```

Read the `years` row of the coefficient table. The estimate is -205,172, so the fitted line says one more year of experience goes with 205,172 less income a year. The p-value is 0.1736 and the R-squared is 0.038, so the model is also telling you it cannot really tell.

Every number in there is wrong and nothing is broken. `lm()` did precisely what it was asked to do. The trouble is what it was asked.

=== step === concept
## Why squaring lets one row pick the line

The whole problem fits into one piece of arithmetic.

Least squares picks the line that makes the sum of squared residuals as small as it can be. A residual is the vertical gap between a person and the line: what they actually earn, minus what the line predicted for them.

To measure how big person 11's gap really is, we need a line that person 11 did not get to influence. So fit the same model on the other forty nine rows, and then measure person 11 against that.

```r
# Fit the same line on the 49 rows without person 11, and measure person 11 against it
honest <- survey[-11, ]
honest_fit <- lm(income ~ years, data = honest)
round(coef(honest_fit), 1)
#> (Intercept)       years
#>     25022.5      2555.3

resid_all <- survey$income - predict(honest_fit, survey)
round(unname(resid_all[11]))
#> [1] 47969867
```

The forty nine honest respondents put the line at 25,022.5 plus 2,555.3 for every year of experience, near the 28,000 and 2,400 the data was built from, give or take the noise. Against that line, person 11 sits 47,969,867 above where they were predicted to be.

That number is person 11's residual. Now square it, square everybody else's, and put the two piles side by side.

```r
# Compare person 11's squared residual with the other 49 squared residuals added up
sq_person11 <- unname(resid_all[11])^2
sq_other49  <- sum(resid_all[-11]^2)

c(person11 = sq_person11, other49 = sq_other49)
#>     person11      other49
#> 2.301108e+15 1.729325e+09

round(sq_person11 / sq_other49)
#> [1] 1330640
```

Person 11 contributes 2.3 quadrillion to the sum of squares. The other forty nine put together contribute 1.7 billion. The ratio is 1,330,640, so inside the quantity least squares is trying to make small, that single row weighs 1.3 million times as much as everybody else combined.

Least squares is not ignoring the forty nine. It is doing its job perfectly. Its job simply happens to be almost entirely about person 11.

[KEY INSIGHT]
Squaring is what does the damage. A residual ten times bigger than another one contributes a hundred times more to the total, so the further a row sits from the line, the more say it gets over where the line goes.

=== step === quiz
## Quick check: what least squares is actually minimising

Person 11 reports 48,000,000 while the rest of the survey reports tens of thousands. What is it about that row that hands it control of the line?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Its income is the largest number in the data, and least squares is pulled towards large values of the response. ::no
- It sits near the left edge of the experience range, where there are fewer people around to hold the line in place. ::no
- Its residual is enormous, and least squares minimises the sum of squared residuals, so that one squared gap outweighs all the others put together. ::ok Exactly right. The size of the income on its own means nothing. What counts is how far the row lands from the line, and that distance gets squared before it is added up.
- Fifty rows is a small sample, so every single row carries 2% of the fit. ::no It is not the size of the sample and it is not the size of the income. It is the squaring. Person 11 misses the line by about 48 million, and 48 million squared came out 1,330,640 times everything the other forty nine contribute between them. Each row carries the square of its own distance from the line, never an equal share.

=== step === concept
## The same survey, fitted with rlm()

It is the same fifty people and the same two columns, with one different function.

`rlm()` lives in the MASS package, which ships with R itself. It fits a robust regression: the same straight line as before, chosen by a rule that will not let one row do what person 11 just did.

```r
# Fit the same survey with robust regression and line the three answers up
suppressMessages(library(MASS))
rob_fit <- rlm(income ~ years, data = survey)

round(cbind(OLS = coef(ols_fit),
            Robust = coef(rob_fit),
            Without_person_11 = coef(honest_fit)), 1)
#>                   OLS  Robust Without_person_11
#> (Intercept) 3240332.1 25587.0           25022.5
#> years       -205171.5  2528.1            2555.3
```

Take the three columns one at a time. Least squares on all fifty says the slope is -205,171.5. Robust regression on the very same fifty says 2,528.1. And the line fitted on the forty nine honest people, the one person 11 never touched, says 2,555.3.

So `rlm()` landed within 27 of the answer you would get by deleting person 11 by hand, and nobody deleted anybody. Person 11 is still sitting in the data. Their row was simply not allowed to carry a million times the weight of everyone else.

Now read the robust fit in full.

```r
# Read the robust fit in full
summary(rob_fit)
#> Call: rlm(formula = income ~ years, data = survey)
#> Residuals:
#>      Min       1Q   Median       3Q      Max
#>   -15053    -4596     1202     3970 47969357
#>
#> Coefficients:
#>             Value      Std. Error t value
#> (Intercept) 25587.0327  1831.0050    13.9743
#> years        2528.1175   145.2721    17.4026
#>
#> Residual standard error: 6254 on 48 degrees of freedom
```

Two things are worth stopping on. The residual quartiles are now in the thousands, where least squares was reporting them in the millions, because the robust line actually runs through the crowd. And the largest residual is 47,969,357, so person 11 has not been trimmed or capped or thrown out. They are right there, being 48 million away from the line.

Last, put both lines on the picture.

```r
# Draw the least squares line and the robust line over the same 50 people
plot(survey$years, survey$income, pch = 19, col = "grey40", ylim = c(0, 100000),
     main = "The least squares line against the robust line",
     xlab = "Years of experience", ylab = "Annual income")
abline(ols_fit, col = "firebrick", lwd = 2.5)
abline(rob_fit, col = "steelblue", lwd = 2.5, lty = 2)
legend("topleft", c("lm()", "rlm()"), col = c("firebrick", "steelblue"),
       lty = c(1, 2), lwd = 2.5, bty = "n")
```

The red least squares line slopes down across the people it is supposed to be describing. The blue dashed robust line rises through the middle of them. Same data, same formula, two different stories.

=== step === concept
## The weight rlm() gave each of the 50 people

So how does `rlm()` decide? It fits the line more than once.

The method is called iteratively reweighted least squares. Fit an ordinary line, look at how far each person landed from it, give every person a weight based on that distance, then fit the line again with those weights applied. Repeat until the coefficients stop moving. An estimator that works this way, judging every row by nothing except how far it landed from the line, is called an M-estimator.

A weight of 1 means the person counts in full, exactly as they would under ordinary least squares. A weight of 0.5 means they count half. Those weights are not thrown away at the end either. They are kept, one per row, so you can read them.

Sort them from smallest to largest and look at the bottom six.

```r
# List the six people the robust fit trusted least, with their residuals and weights
w   <- rob_fit$w
ord <- order(w)

data.frame(person    = ord[1:6],
           years     = survey$years[ord[1:6]],
           residual  = round(residuals(rob_fit)[ord[1:6]]),
           weight    = round(w[ord[1:6]], 4),
           row.names = NULL)
#>   person years residual weight
#> 1     11     2 47969357 0.0002
#> 2     36    13   -15053 0.5561
#> 3     10    12    11576 0.7355
#> 4      9     5    11772 0.7527
#> 5     48     5    -9828 0.8069
#> 6     44    16    -9637 0.8842

round(mean(w[-11]), 3)
#> [1] 0.971
```

Person 11 came out at 0.0002. In the final fit they are carrying about two ten thousandths of a normal person's say, which is why the slope came back at 2,528 instead of -205,172.

Below them the weights fall away gently. Person 36 is 15,053 under the line and gets 0.556. Person 10 is 11,576 over it and gets 0.736. The other forty nine average 0.971, so nearly everybody is counting nearly in full.

That is the shape of the thing. People who fit the line count in full, people who do not get a steadily shrinking say, and there is no cliff edge anywhere along the way.

[NOTE]
A low weight is not a verdict. It says a row landed far from the line the rest of the data drew, and nothing more than that. Whether the row is a typing mistake, a rare truth, or a sign that a straight line was the wrong shape to fit is a question the arithmetic cannot answer for you.

=== step === concept
## How the Huber weight is calculated

The weights are not magic and they are not fitted. There is a formula behind them, and you can work person 11's weight out yourself.

Two things go into it. The first is a scale, written \(s\), which is a robust measure of how far a typical person sits from the line. It plays the part that the residual standard error plays under ordinary least squares. For this survey `rlm()` reports it as 6,254, in the same units as income.

Divide a residual by \(s\) and you get the scaled residual \(r\), which says how many typical misses this person is away from the line. Scaling that way makes every residual comparable whatever units the response came in.

Then comes Huber's rule itself:

\[ w(r) \;=\; \min\left(1, \frac{k}{|r|}\right), \qquad k = 1.345 \]

Read it in two halves. While the scaled residual is smaller than \(k\), the fraction is bigger than 1, so the minimum is 1 and the person counts in full. Once the scaled residual grows past \(k\), the weight becomes \(k\) divided by the size of the miss, so a person twice as far out gets half the say.

Now do person 11 by hand and see whether the formula agrees with the software.

```r
# Work out person 11's Huber weight by hand and check it against rlm()
s   <- rob_fit$s
r11 <- unname(residuals(rob_fit)[11]) / s

round(c(scale = s, scaled_residual = r11), 1)
#>           scale scaled_residual
#>          6254.0          7670.2

round(min(1, 1.345 / abs(r11)), 6)
#> [1] 0.000175

round(unname(rob_fit$w[11]), 6)
#> [1] 0.000175
```

Person 11 sits 7,670.2 typical misses away from the line. So the weight is 1.345 divided by 7,670.2, which is 0.000175. That is exactly the number `rlm()` reported, and we got there with a calculator.

The constant \(k = 1.345\) is not arbitrary either. Huber picked it so that on clean, normally distributed data the estimator keeps 95% of the precision of ordinary least squares. You give up five percent when nothing is wrong, in exchange for not being wrecked when something is.

Here is the rule drawn out across the range of scaled residuals you would ever see.

```r
# Draw the Huber weight curve across scaled residuals from -6 to 6
r_grid <- seq(-6, 6, length.out = 400)

plot(r_grid, pmin(1, 1.345 / abs(r_grid)), type = "l", lwd = 2.5, col = "steelblue",
     ylim = c(0, 1.05), main = "The Huber weight, k = 1.345",
     xlab = "Scaled residual", ylab = "Weight")
abline(v = c(-1.345, 1.345), lty = 3, col = "grey50")
```

The curve is flat at 1 between the two dotted lines, then falls away on both sides, and it never touches the floor. Every person keeps some say, however far out they are.

=== step === tryit
## Your turn: write the Huber weight function

You have seen the rule and checked it on one person. Write it as a function now, so it can weigh a whole column of scaled residuals at once.

The rule is: 1, or \(k\) divided by the size of the miss, whichever is smaller, with \(k = 1.345\). Use `pmin()` rather than `min()` so a whole vector goes through in one call, and `abs()` so a person below the line is treated the same as one above it. Then run it on the scaled residuals 0.5, 1.5, 3 and 10.

```r
# huber_weight(r) should return 1 while the scaled residual r is small,
# and 1.345 divided by the size of r once it grows past 1.345.
# Use pmin() so one call handles a whole vector, and abs() so a miss
# below the line counts the same as a miss above it.
# Then call your function on c(0.5, 1.5, 3, 10).
# Press Check when you have it.
```
::check {"regex": "pmin[(].*(1\\.345|k)\\s*/\\s*abs[(]", "gate": true, "difficulty": "beginner", "ok": "That is the rule. 1.0000, 0.8967, 0.4483, 0.1345: the weight is untouched inside the flat part, then falls away as one over the size of the miss.", "no": "Build the two halves into a single expression and let pmin() choose between them: pmin(1, 1.345 / abs(r)). Wrap that in a function of r, then call it on c(0.5, 1.5, 3, 10)."}
::solution
```r
# Turn the Huber rule into a function and weigh four scaled residuals
huber_weight <- function(r) pmin(1, 1.345 / abs(r))
round(huber_weight(c(0.5, 1.5, 3, 10)), 4)
#> [1] 1.0000 0.8967 0.4483 0.1345
```

A scaled residual of 0.5 is inside the flat part, so it counts in full. At 1.5 the weight is already down to 0.8967, at 3 it is 0.4483, at 10 it is 0.1345. Notice that even ten typical misses out, that person still carries about 13% of a vote. Huber never takes anybody all the way to zero.

=== step === concept
## Huber weights against Tukey bisquare weights

Huber is not the only rule. The other one you will run into is Tukey's bisquare, and the difference between the two is exactly the thing you just noticed: what happens far out.

Huber decays as \(k / |r|\) and never reaches zero. Bisquare is redescending, which means it comes down to exactly zero at a scaled residual of 4.685 and stays there. Past that point a row is not turned down, it is out of the fit altogether.

Draw the two curves on the same axes and the difference is hard to miss.

```r
# Draw the Huber and Tukey bisquare weight curves on the same axes
r_grid <- seq(-6, 6, length.out = 400)

plot(r_grid, psi.huber(r_grid), type = "l", lwd = 2.5, col = "steelblue",
     ylim = c(0, 1.05), main = "Huber against Tukey bisquare",
     xlab = "Scaled residual", ylab = "Weight")
lines(r_grid, psi.bisquare(r_grid), lwd = 2.5, col = "firebrick", lty = 2)
abline(v = c(-4.685, 4.685), lty = 3, col = "grey50")
legend("bottomleft", c("psi.huber", "psi.bisquare"),
       col = c("steelblue", "firebrick"), lty = c(1, 2), lwd = 2.5, bty = "n")
```

The blue Huber curve keeps falling towards zero and never gets there. The red dashed bisquare curve reaches the floor at the dotted lines and stops.

Now fit the survey both ways and see what that difference is worth in coefficients.

```r
# Refit the survey with bisquare weights and compare the two robust answers
bisq_fit <- rlm(income ~ years, data = survey, psi = psi.bisquare)

round(cbind(Huber = coef(rob_fit), Bisquare = coef(bisq_fit)), 1)
#>               Huber Bisquare
#> (Intercept) 25587.0  24897.6
#> years        2528.1   2577.9

round(bisq_fit$w[11], 6)
#> [1] 0
```

Huber gives 2,528.1, bisquare gives 2,577.9, and the forty nine honest people say 2,555.3. Bisquare sits about as far above that reference as Huber sits below it, which is roughly what you would expect from two sensible estimators reading the same data.

The number that matters is the last one. Under bisquare, person 11's weight is not small. It is 0.

That difference comes at a price. Huber's loss is convex, so the fit converges to the same answer wherever it starts from. Bisquare's is not, so where it settles can depend on where it started, and by default `rlm()` starts from an ordinary least squares fit, which on this survey is the wrecked line. It found its way to 2,577.9 anyway. On more heavily contaminated data that starting point is exactly what makes a redescending fit something to check rather than trust.

[TIP]
Start with Huber. Reach for bisquare when you have reason to believe some rows are simply wrong rather than merely unusual. If the two agree, either one is a reasonable thing to report, and if they disagree that gap is telling you something about your data worth finding out before you publish anything.

=== step === widget
## The same scatter under OLS, Huber and Tukey

Reading two weight curves is one thing. Watching them act on a fit is another.

Below are fifteen points with one bad one among them, which is the same situation as person 11 in a shape you can take in at a glance. Switch between the three methods and watch two things: the size of the far point, which is drawn in proportion to the weight it was given, and where the line goes.

::widget robust-weights {}

Under OLS the bad point is full size and the line is pulled down to meet it. Switch to Huber and the point shrinks while the line swings back towards the trend the other fourteen agree on. Switch to Tukey and it all but disappears.

That shrinking dot is the entire method. Nothing was deleted and no threshold was crossed. The row was just asked to speak more quietly.

=== step === quiz
## Quick check: which weight function drops a row to zero

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Both of them do, once a row is far enough out. Huber gets there at 1.345 and bisquare at 4.685. ::no
- Only Tukey bisquare. It redescends to exactly zero past a scaled residual of 4.685, while Huber keeps shrinking towards zero without ever arriving. ::ok Right. Huber caps how loudly a row can speak, bisquare can switch it off completely. That is why bisquare is the one to reach for when you think some rows are simply wrong.
- Only Huber, because it is the default in rlm() and a default is normally the more aggressive of the options. ::no
- Neither. Both are M-estimators, and an M-estimator by definition keeps every row in the fit. ::no The two part company right at the far end. Huber decays as k over the size of the residual, which shrinks forever without reaching zero, so 1.345 is where the shrinking starts rather than where it ends. Bisquare comes down to exactly zero at 4.685 and stays there, which is what redescending means, and that is why it weighted person 11 exactly 0 in this survey.

=== step === concept
## What robust regression costs when the data is clean

Here is a fair question. If a robust fit survives a wrecked survey and lands where least squares lands on a clean one, why is least squares still the default anywhere?

Because it is not quite free. Turning rows down means using slightly less of your data, and using less data means your estimate wobbles a little more from one sample to the next.

So let's measure that wobble rather than argue about it. Run three hundred fresh surveys, every one of them clean, fifty honest people each and no person 11 anywhere. Fit both estimators on each survey, then see how much each slope varies across the three hundred.

```r
# Run 300 clean surveys and measure how much each estimator's slope wobbles
set.seed(11)
sim_slopes <- replicate(300, {
  yrs   <- sample(1:25, 50, replace = TRUE)
  inc   <- 28000 + 2400 * yrs + rnorm(50, 0, 6000)
  clean <- data.frame(years = yrs, income = inc)
  c(lm  = unname(coef(lm(income ~ years, data = clean))[2]),
    rlm = unname(coef(rlm(income ~ years, data = clean))[2]))
})

round(c(lm = sd(sim_slopes["lm", ]), rlm = sd(sim_slopes["rlm", ])), 1)
#>    lm   rlm
#> 121.6 125.3

round(sd(sim_slopes["rlm", ]) / sd(sim_slopes["lm", ]), 3)
#> [1] 1.031
```

The true slope in every one of those three hundred surveys was 2,400. The least squares estimates scatter around it with a standard deviation of 121.6, and the robust estimates scatter with 125.3. That is 3% wider.

Three percent is the whole bill. It is what \(k = 1.345\) was chosen to cost, and it is why robust regression is a reasonable default rather than an emergency measure. When nothing is wrong you give up almost nothing, and when something is wrong you keep your answer.

=== step === widget
## When the bad number is in the predictor

Everything so far has been about a wrong income. Person 11's `years` value was perfectly fine, it was their `income` that came in at 48 million.

Now think about the other kind of wrong number, the one in the predictor. Somebody types their years of experience into the wrong box, or adds a digit by accident, and lands far out along the x axis where nobody else is standing.

Drag the slider under the chart to move that far right point up and down, and watch what the fit does.

::widget leverage-point {}

The solid line is fitted with the far point included and the dashed line is fitted without it. Move the point and the solid line pivots to follow, while the dashed line does not shift at all.

The block under the chart runs those same two fits in R, and prints a Cook's distance for every row: one number per row saying how far the whole fitted line moves when that row is taken out.

That is leverage. A point far out along x works like the end of a long lever, so a small move in its y value swings the whole line. And here is the part that matters next: because the line follows the point, the point ends up close to the line, which keeps its own residual small.

=== step === concept
## Why an M-estimator misses a high-leverage row, and what fixes it

Let's do that with the survey rather than with a picture.

Take person 11 out and put a different kind of mistake in their place: a respondent who meant to type 6 into the years box and typed 60. Their income of 30,000 is perfectly ordinary. It is their experience that is impossible.

Let's fit that survey four ways: ordinary least squares, Huber, bisquare, and one more called MM, which we will get to in a moment.

```r
# Replace person 11 with a respondent who typed 60 into the years box
typo <- rbind(honest, data.frame(years = 60, income = 30000))
bad  <- nrow(typo)

fits <- list(OLS      = lm(income ~ years, data = typo),
             Huber    = rlm(income ~ years, data = typo),
             Bisquare = rlm(income ~ years, data = typo, psi = psi.bisquare),
             MM       = rlm(income ~ years, data = typo, method = "MM"))

round(sapply(fits, function(f) unname(coef(f)[2])), 1)
#>      OLS    Huber Bisquare       MM
#>    905.8   2298.4   2588.8   2591.6
```

Least squares collapses to 905.8, which you were expecting by now. Huber reaches 2,298.4 and stops well short of the 2,555.3 the honest rows give. Bisquare gets to 2,588.8 and MM to 2,591.6, both of them close.

So Huber failed here, and it failed for a reason worth understanding. Start with the weight each method gave that one mistyped row.

```r
# See what weight each robust method gave that one mistyped row
round(c(Huber    = unname(fits$Huber$w[bad]),
        Bisquare = unname(fits$Bisquare$w[bad]),
        MM       = unname(fits$MM$w[bad])), 4)
#>    Huber Bisquare       MM
#>   0.0743   0.0000   0.0000

round(c(residual_ols   = unname(residuals(fits$OLS)[bad]),
        residual_huber = unname(residuals(fits$Huber)[bad])))
#>   residual_ols residual_huber
#>         -66232        -135565
```

Huber gave the row 0.0743, which is a serious turning down, and it still was not enough. Bisquare and MM both gave it exactly 0.

Two things are going on at once. Huber judges a row by its residual, and this row's residual is small precisely because the line was dragged over to meet it: 66,232 under ordinary least squares, and even after Huber pulled the line back, only 135,565. Person 11 was 48 million out. A row that hides from the test does not get turned down enough.

The second thing is that 0.0743 of a high-leverage row is still a lot of pull. A long lever with a light hand on it still moves the line.

You can measure how long that lever is with a standard diagnostic called the hat value, which says how far a row's predictor values sit from everybody else's. Hat values always average out to the number of coefficients divided by the number of rows, which here is 2 over 50, so there is always a yardstick to hold a row up against.

```r
# Measure how much leverage that mistyped row has, against the average row
round(c(hat_value   = unname(hatvalues(fits$OLS)[bad]),
        hat_average = 2 / nrow(typo)), 3)
#>   hat_value hat_average
#>       0.554       0.040
```

0.554 against an average of 0.040, so that single row has roughly fourteen times the leverage of a typical respondent. Run this before you reach for a robust fit and you will know which kind of problem you are holding.

[WARNING]
Huber and bisquare as used here are M-estimators: they judge every row by its residual and by nothing else. That works when the wrong number is in the response. It works much less well when the wrong number is in a predictor, because a row like that bends the line towards itself and so keeps its own residual small.

MM-estimation is the standard answer to it. It starts from an estimator built to survive up to half the data being contaminated, then polishes that with an M-estimator step to win the precision back. In R that is `rlm(..., method = "MM")`, or `lmrob()` from the robustbase package. On the mistyped survey it landed at 2,591.6.

=== step === quiz
## Quick check: why the years-box typo got past Huber

The mistyped respondent had an ordinary income of 30,000 and an impossible 60 years of experience. Huber weighted them 0.0743 and still returned a slope of 2,298.4 rather than 2,555.3. What went wrong?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- 0.0743 is simply not a low enough weight. Huber would have handled the row if k had been set below 1.345. ::no
- The income of 30,000 was too close to the middle of the data for any method to notice the row at all. ::no
- Huber only turns down rows whose response is too high, and this row's response was on the low side. ::no
- Huber judges a row by its residual, and this row sits so far out along the predictor that it pulls the line towards itself, which keeps that residual small. Only a redescending weight or an MM fit reaches zero here. ::ok That is it. The row hides from the very test that was meant to catch it, and what is left of its pull gets amplified by how far out it sits.
- Nothing went wrong. 2,298.4 and 2,555.3 are the same answer to within rounding. ::no An M-estimator asks one question of every row: how far is it from the line? A row far out along the predictor bends the line towards itself, so it answers that question with a small number and keeps most of its weight. That is why bisquare, which can weight a row exactly zero, and MM, which starts from an estimator built to survive contamination, both recovered the slope while Huber stalled at 2,298.4.

=== step === concept
## Why summary(rlm) has no p-values

You may have noticed something missing from the robust summary. It printed a value, a standard error and a t value for each coefficient, and then it stopped. No p-value column, no significance stars, no R-squared.

That is deliberate. Those standard errors are asymptotic approximations. They are what the sampling variability tends towards as the sample grows without limit, and for a survey of fifty people there is no exact reference distribution sitting behind them. MASS declines to print a p-value it cannot stand behind, which is a more honest position than most software takes.

So get your uncertainty a different way. Draw fifty people at a time out of your own fifty, with replacement, two hundred times over. Refit the robust line on each of those resamples, then read an interval straight off the spread of slopes that comes back.

```r
# Resample the survey 200 times and read an interval off the robust slopes
set.seed(5)
boot_slopes <- replicate(200, {
  rows <- sample(nrow(survey), nrow(survey), replace = TRUE)
  unname(coef(rlm(income ~ years, data = survey[rows, ]))[2])
})

round(quantile(boot_slopes, c(0.025, 0.975)))
#>  2.5% 97.5%
#>  2161  2813
```

2,161 to 2,813. That is the interval you would report alongside the slope of 2,528, and it leans on no distributional assumption at all. It depends only on the fifty people you actually surveyed.

[NOTE]
Some of those resamples draw person 11 twice or three times over, and some leave them out entirely. That is not a flaw in the method, it is part of what the interval is measuring: how much your answer depends on which fifty people happened to walk in.

=== step === concept
## Which of the two fits is the honest one to report

Both fits ran on the same fifty rows and they disagree about the sign of the effect. One of them has to go into the write-up, and choosing between them is not a statistical question. It is a question about person 11.

Ask it plainly: is that row wrong, or is it a real member of the population you were asked about?

| The answer | Where it comes from | When it is the honest one to report |
|---|---|---|
| -205,172 a year | Least squares on all fifty, with person 11 treated as an ordinary respondent | Almost never here, because it is a summary of one person wearing a coat marked fifty |
| 2,528 a year | Robust regression, with person 11 still in the data but barely counting | When person 11 is a wrong number, or a real person whose money comes from something other than being paid for their time |
| 2,555 a year | Least squares on the forty nine, with person 11 deleted by hand | When you can justify the deletion in writing, to somebody who is going to ask |

Notice that the second and third answers land in nearly the same place. That is the usual outcome, and it is the reason to prefer the robust fit: it gets you to the deletion answer without you ever having to be the person who decided which row to delete.

Now the harder case. Suppose person 11 is genuinely real, and suppose the question you were asked was about everybody who works, founders included. Then 2,528 is answering a narrower question than the one you were given, and the right response is to report both fits and say plainly that the answer turns on whether the tail belongs in it.

[WARNING]
Huber and bisquare agreeing is evidence, not proof. Two estimators built on the same idea, judging rows by the same residuals, will often agree with each other while both being pulled the same wrong way, which is exactly what happened to the mistyped respondent. Agreement is a good reason to relax about contamination in the response. It says nothing at all about a wrong number in a predictor.

=== step === quiz
## Quick check: the sentence you would publish about this survey

You have to write one sentence about experience and income for the fifty people you surveyed. Which one can you defend?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Each extra year of experience goes with 205,172 less income a year, although the effect is not significant (p = 0.174). ::no
- Each extra year of experience goes with about 2,528 more income a year, and the effect is highly significant, with a t value of 17.4. ::no
- Each extra year of experience goes with about 2,528 more income a year, with a bootstrap interval of 2,161 to 2,813. One respondent reporting 48,000,000 was turned down by the robust fit. ::ok Yes. The robust slope, an interval that does not lean on an assumption the fit cannot support, and one line saying out loud what happened to person 11. Anybody reading it can check every part of it.
- Each extra year of experience is worth about 2,555 more income a year, after removing an outlier from the sample. ::no The first sentence reports a slope that one respondent wrote by themselves. The second hangs a significance claim on a t value that has no p-value behind it, which is the very thing the robust summary refused to print. The fourth is close, but it deletes a row while calling it an outlier and never says which row or why, so nobody can check the decision. Only the third gives the robust slope, an honest interval, and the contamination declared out loud.

=== step === tryit
## Your turn: find the rows rlm() distrusted

The weights are a diagnostic, and reading them is a habit worth having. Whenever a robust fit and an ordinary one disagree, the weights tell you which rows caused the argument.

`rob_fit` holds the robust fit of income on years for all fifty people, and `rob_fit$w` holds one weight per person, in survey order. Build a small data frame of person number, years and weight, sort it with `order()`, show the five lowest, then count how many people came in under 0.9.

```r
# rob_fit$w holds one weight per person, in the same order as survey.
# Build a data frame of person, years and weight, sort it with order(),
# and print the five lowest with head().
# Then count how many of the 50 weights fall below 0.9.
# Press Check when you have it.
```
::check {"regex": "order[(][^)]*(weight|[$]w)", "gate": true, "difficulty": "intermediate", "ok": "Six of the fifty came in below 0.9, and only one of them is anywhere near zero. That is a healthy weight profile: one contaminated row, then a normal spread of people who happen to sit a little off the line.", "no": "order() returns the row positions in ascending order, so you can index the frame with it: weight_table[order(weight_table$weight), ]. Wrap that in head(..., 5), then count with sum() on the comparison rob_fit$w below 0.9."}
::solution
```r
# Sort all 50 people by the weight rlm() gave them and count the distrusted ones
weight_table <- data.frame(person = 1:50,
                           years  = survey$years,
                           weight = round(rob_fit$w, 3))

head(weight_table[order(weight_table$weight), ], 5)
#>    person years weight
#> 11     11     2  0.000
#> 36     36    13  0.556
#> 10     10    12  0.735
#> 9       9     5  0.753
#> 48     48     5  0.807

sum(rob_fit$w < 0.9)
#> [1] 6
```

Six people out of fifty came in under 0.9, and only person 11 is anywhere near zero. That is what a healthy weight profile looks like: one contaminated row, then a normal spread of people who happen to sit a bit off the line.

=== step === tryit
## Your turn: refit on the rows the weights kept

There is one more thing the weights let you do. Instead of deciding by eye which row to delete, you can let the fit tell you: keep everybody weighted 0.5 or more, and refit ordinary least squares on those.

Only person 11 falls under 0.5, at 0.0002, and the next lowest weight in the survey is 0.556, so this keeps forty nine people. Subset `survey` using `rob_fit$w`, print how many rows survived, and fit `lm(income ~ years)` on what is left.

```r
# Keep only the people rob_fit weighted at 0.5 or more, by subsetting
# survey with rob_fit$w, and call the result kept.
# Print how many rows survived with nrow(), then fit
# lm(income ~ years) on kept and print its coefficients.
# Press Check when you have it.
```
::check {"regex": "survey\\[.*rob_fit[$]w", "gate": true, "difficulty": "intermediate", "ok": "49 rows survive, and least squares on them gives 25,022.5 and 2,555.3. That is the line the honest respondents drew, recovered without anybody having to decide by hand which row to throw out.", "no": "A logical vector goes straight into the row slot of a data frame: kept <- survey[rob_fit$w >= 0.5, ]. Then nrow(kept), and coef(lm(income ~ years, data = kept))."}
::solution
```r
# Refit least squares on only the rows the robust weights kept
kept <- survey[rob_fit$w >= 0.5, ]

nrow(kept)
#> [1] 49

round(coef(lm(income ~ years, data = kept)), 1)
#> (Intercept)       years
#>     25022.5      2555.3
```

25,022.5 and 2,555.3, which is the line the forty nine honest respondents gave from the very beginning. You recovered it without once pointing at a row and calling it wrong. The weights did the pointing.

[TIP]
Use this to explain a fit, not to produce one. Reporting the robust fit is the cleaner thing to do, because it keeps every row in the model. Refitting on the survivors is how you show a colleague, in one line, exactly which rows the robust weights were quiet about.

=== step === concept
## References

- [Robust Estimation of a Location Parameter](https://doi.org/10.1214/aoms/1177703732) - Huber (1964), Annals of Mathematical Statistics 35(1), 73-101. Where M-estimation and the Huber loss come from, including the reasoning behind k = 1.345.
- [Modern Applied Statistics with S, 4th edition](https://www.stats.ox.ac.uk/pub/MASS4/) - Venables and Ripley (Springer, 2002), chapter 6. The book `rlm()` ships with, and the documentation for psi.huber, psi.bisquare and method = "MM".
- [High Breakdown-Point and High Efficiency Robust Estimates for Regression](https://doi.org/10.1214/aos/1176350366) - Yohai (1987), Annals of Statistics 15(2), 642-656. The MM-estimator that recovered the slope when the wrong number was in the predictor.
- [Robust Statistics: Theory and Methods (with R), 2nd edition](https://doi.org/10.1002/9781119214656) - Maronna, Martin, Yohai and Salibian-Barrera (Wiley, 2019). Leverage against residual outliers, breakdown point and efficiency, worked out properly.
- [Robust Fitting of Linear Models](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/rlm.html) - R Core Team, the reference page for `rlm()`. The arguments used here: psi, k, method and scale.est.

=== step === complete
## Quick recap

We had fifty people, one of them a founder, and a line that came back saying experience costs money. Here is what stays with you from fixing it.

- Least squares minimises the sum of squared residuals, so a row far from the line does not merely count more, it counts by the square. Person 11 outweighed the other forty nine by 1,330,640 to 1.
- `rlm()` fits the line over and over, handing every row a weight from its residual each time round. Those weights are readable afterwards: person 11 got 0.0002 while the other forty nine averaged 0.971.
- Huber caps how loudly a row can speak, `pmin(1, 1.345 / abs(r))`, and never reaches zero. Tukey bisquare redescends to exactly zero past 4.685, which is what you want when a row is simply wrong rather than merely unusual.
- On clean data the robust slope wobbles 3% more than the least squares slope, 125.3 against 121.6. That is the entire price of the insurance.
- An M-estimator judges a row by its residual, so a wrong number in a predictor hides from it. Hat values tell you when you are in that situation, and MM-estimation is what to fit when you are.

And the sentence you would actually publish about this survey:

"Each extra year of experience goes with about 2,528 more income a year, with a bootstrap interval of 2,161 to 2,813. One respondent reporting 48,000,000 was turned down by the robust fit."

The next time one row in a dataset looks like it is doing all the talking, you will know how to make it speak at the same volume as everybody else. Nicely done, and see you soon.

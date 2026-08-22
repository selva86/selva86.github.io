---
title: "Linear regression assumptions: the 5 checks"
slug: "Regression-Reading-Mini-2"
description: "Your regression output can look perfect and still be broken. Run all five assumption checks on a real model, find the two that fail, and repair each one."
keywords: "linear regression assumptions in R, check regression assumptions, regression diagnostics in R, plot.lm, residual plots, Breusch-Pagan test, Durbin-Watson test, Cook's distance, heteroskedasticity in R"
mathjax: false
webr: true
date: "2026-08-23"
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
catalog_blurb: "The five checks that tell you whether your regression can be believed."
---

=== step === cover
::eyebrow Reading Regression Models
## Linear regression assumptions: the 5 checks

You have fitted regressions before. Here is the professional habit that goes with them.

Say you fit a model on a small store's daily numbers and the output comes back looking perfect. R-squared is 0.73, and both predictors carry three stars. Nothing in that output is flashing red, so you take the slope to the meeting and tell everyone that each extra advertising dollar brings back 2.17 dollars.

The trouble is that a linear regression makes five promises about your data before it prints a single one of those numbers. It assumes the relationship really is a straight line, that the errors do not grow as the prediction grows, that no single day is running the whole model, and two more we will come to.

When the five promises hold, your conclusions are solid. When one of them breaks, the fit can sit exactly where it was while the standard errors, the confidence intervals and the p-values stop meaning what they say.

Here is that damage, measured. Pick one of the three promises below, then drag the dial from no violation up to a severe one. The dashed line is R-squared, the thing you look at. The solid line is coverage, which is the share of thousands of repeated studies whose 95% confidence interval actually contained the true answer. It is supposed to sit at 95%.

::widget assumption-dial {"assumptions": ["linearity", "heteroskedasticity", "normality"], "start": 0}

Watch which line moves. On the first two the fit holds steady while the coverage falls away, and that is why a broken promise is so easy to miss. The number you check is not the number that breaks. Drag the normality one and almost nothing moves, which is a result we come back to.

So today we build a store's 180 days ourselves, plant two flaws in them on purpose, and run all five checks to see which ones catch what we planted.

=== step === concept
## A store's 180 days, and a model that looks perfect

Everything today happens on one small online store, so let's build its numbers first.

Every day the store spends something on advertising, sends out a batch of marketing emails, and takes some money in sales. We are making these 180 days up rather than downloading them, and that is on purpose. Because we wrote the rules, we know exactly what is hiding in the data, so we can judge each check on whether it finds it.

Press Run.

```r
# Build 180 days of the store's ad spend, emails and sales
set.seed(42)
n_days   <- 180
ad_spend <- round(runif(n_days, 40, 700), 2)
emails   <- round(rnorm(n_days, 3000, 600))
sales    <- 300 + 600 * log(ad_spend) + 0.30 * emails +
            rnorm(n_days, 0, 40 + 0.5 * ad_spend)

store <- data.frame(day = 1:n_days, ad_spend = ad_spend,
                    emails = emails, sales = round(sales, 2))
head(store)
#>   day ad_spend emails   sales
#> 1   1   643.77   3835 5538.54
#> 2   2   658.47   2714 5025.06
#> 3   3   228.85   3390 4601.15
#> 4   4   588.10   3835 5420.80
#> 5   5   463.55   2334 4575.78
#> 6   6   382.60   2484 4916.39
```

`set.seed(42)` just fixes the randomness, so your 180 days match mine exactly. Advertising spend wanders between 40 and 693 dollars a day, emails sit around 3,000, and sales run from about 3,245 to about 5,984 dollars.

Now read the `sales` line slowly, because two flaws are planted in it.

Sales rise with advertising through `log(ad_spend)` rather than through `ad_spend` itself, which means each extra advertising dollar buys less than the dollar before it. That is the first flaw: the true shape is a curve, not a straight line. Sales also rise with emails at 30 cents an email, which is a plain straight line and perfectly fine.

The second flaw is in the noise. Look at the standard deviation inside that last `rnorm`, which is `40 + 0.5 * ad_spend`. On a quiet 40-dollar day it works out at 60. On a 690-dollar day it works out at 385, more than six times bigger. The busy days are simply more unpredictable than the quiet ones.

Now let's fit the model the way anyone would on a Monday morning, as a straight line in both predictors.

```r
# Fit sales on ad spend and emails, then read the output
fit <- lm(sales ~ ad_spend + emails, data = store)
summary(fit)
#>
#> Call:
#> lm(formula = sales ~ ad_spend + emails, data = store)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -662.95 -166.03   17.73  165.81  743.42
#>
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 2.979e+03  1.145e+02  26.019  < 2e-16 ***
#> ad_spend    2.166e+00  1.063e-01  20.380  < 2e-16 ***
#> emails      2.826e-01  3.561e-02   7.936  2.3e-13 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 270.6 on 177 degrees of freedom
#> Multiple R-squared:  0.731,	Adjusted R-squared:  0.728
#> F-statistic: 240.5 on 2 and 177 DF,  p-value: < 2.2e-16
```

Read that the way you would if you were in a hurry. R-squared is 0.731, so the model accounts for about 73% of the day-to-day movement in sales. Advertising comes in at 2.166 dollars of sales per dollar spent, with three stars beside it. Emails come in at 0.2826, also with three stars. The F-statistic at the bottom says the model as a whole is far better than nothing.

There is nothing in that output to worry about. Both flaws are still sitting in the data, and not one number on that page points at either of them.

=== step === concept
## The five promises the model just made about your data

Before it printed any of those numbers, `lm()` took five things for granted.

None of the five is about the `ad_spend` column or the `sales` column. All five are about the errors: the gaps between what the model predicted for a day and what the store actually sold that day. Those gaps have a name, **residuals**, and `residuals(fit)` gives you all 180 of them. Every check today is a different way of looking at that one set of numbers.

Here are the five promises, what a break looks like, and the check that finds each one.

| The promise | What a break looks like | The check that finds it |
|---|---|---|
| The relationship really is a straight line | the residuals bend into a hill or a valley instead of a flat band | Residuals vs Fitted plot, then an F test for a missed bend |
| The errors are the same size everywhere | residuals fan out into a funnel as the prediction rises | Scale-Location plot, then the Breusch-Pagan test |
| One day's error says nothing about the next day's | long runs of residuals with the same sign | residuals plotted in day order, then the Durbin-Watson test |
| The errors are roughly normal | the Q-Q points bend away from the line at the ends | Q-Q plot, then the Shapiro-Wilk test |
| No single day is running the model | one point sits far off on its own | Residuals vs Leverage plot, then Cook's distance |

Two things are worth noticing before we start. Four of those five checks come out of a single function call, which you are about to see. And every one of them looks at residuals, never at the raw columns.

[NOTE]
The assumptions are about the errors, not about your data. A wildly lopsided `ad_spend` column is not a violation of anything. The model never made a promise about the shape of your predictors, only about how the errors behave around the fitted line.

=== step === quiz
## Quick check: what a broken promise actually damages

Suppose one of those five promises is badly broken in a model you have just fitted. What is most likely to be wrong in the output in front of you?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- R-squared drops sharply, so a broken promise always shows up as a worse fit. ::no
- The standard errors, the confidence intervals and the p-values, while R-squared and the coefficients themselves can look completely normal. ::ok Exactly. That is what makes this worth doing: the number people check is not the number that breaks. A model can keep a healthy R-squared and still hand you a p-value that means nothing.
- The model refuses to fit and R returns an error, so you find out straight away. ::no
- The coefficients come back as NA, because they can no longer be computed. ::no A broken assumption is almost never loud. The model still fits, the coefficients still print, and R-squared can stay exactly where it was. What stops being trustworthy is the precision half of the output: the standard errors, and therefore the intervals and p-values built on top of them.

=== step === concept
## One line of code draws four of the five checks

You do not have to build these plots by hand. Call `plot()` on a fitted model and R gives you four diagnostic panels, one after another. `par(mfrow = c(2, 2))` arranges them in a two by two grid so all four arrive on one screen.

```r
# Draw the four standard diagnostic panels for the fitted model
par(mfrow = c(2, 2))
plot(fit)
```

Four panels, and each one is asking a different question.

- **Residuals vs Fitted** (top left) asks whether a straight line was the right shape. You want a flat, shapeless band around the horizontal zero line. The red curve through it is a smoother, drawn to make any trend easier to see.
- **Q-Q Residuals** (top right) asks whether the errors are roughly normal. You want the points to lie along the dashed diagonal.
- **Scale-Location** (bottom left) asks whether the errors stay the same size across the range. You want a flat red line, not one that climbs.
- **Residuals vs Leverage** (bottom right) asks whether any single day is running the model. You want no point stranded far to the right on its own.

A few points in each panel are labelled with their row number. Those are the most extreme days, and R labels them so you can go and look at them.

That is four of the five promises from one line of code. The fifth one, independence, is missing from the grid for a good reason: R has no idea what order your rows came in, so it cannot draw that plot for you. We will draw it ourselves in a few minutes.

=== step === concept
## Is the relationship really a straight line?

Start with the top-left panel, Residuals vs Fitted. Of the five, this is the one whose failure changes your answer, not just the error bars around it.

The idea behind it is simple. If a straight line really is the right shape, then after the line has done its job the leftovers should be pure noise: no pattern, no drift, no bend. Plot those leftovers against what the model predicted and you should get a flat, shapeless band.

Three shapes are worth knowing on sight. Switch between them and watch the band change.

::widget residual-plot {"start": "healthy"}

The healthy fit is the flat band: the trend line through the middle stays level and the points scatter evenly above and below it. The funnel widens as you move right, which is a different promise breaking, and we will come back to it. The curve is the one that matters here. Its residuals dip below zero through the middle of the range and rise above it at both ends, so the trend line makes a valley instead of staying flat.

What you are looking for is that shape, not that exact direction. A missed bend can leave a valley, low in the middle and high at the ends, or a hill, high in the middle and low at the ends. Either way the leftovers carry a pattern, and a pattern in the leftovers means the straight line got the shape wrong.

Now, which of the three is ours? Squinting at a plot is a fine start and a poor finish, so let's put a number on it. Split the 180 days into three advertising bands and average the residuals inside each band. If the band is genuinely flat, all three averages should land near zero.

```r
# Average the residuals inside three spend bands: a flat band gives three near-zero numbers
spend_band <- cut(store$ad_spend,
                  breaks = c(0, 200, 450, Inf),
                  labels = c("under 200", "200 to 450", "450 and up"))
round(tapply(residuals(fit), spend_band, mean), 1)
#>  under 200 200 to 450 450 and up
#>      -78.7      108.9      -45.3
```

They land nowhere near zero. On the cheap days the model overshoots by 79 dollars on average. In the middle it undershoots by 109. On the big days it overshoots again by 45. That is down, up, and down again: an arch, high in the middle and low at both ends. It is the mirror image of the valley in the widget above, and it is the very same failure: a pattern in the leftovers where there should be none.

Averages of residuals are still not a test, though, and eyeballing has no p-value. So here is the test. Fit the same model with one extra term, advertising spend squared, and ask whether the extra term earned its place. A squared term is the simplest way to let a model bend, so if bending helps, this is where it shows up. `anova()` compares the two models, one sitting inside the other, and reports the improvement as an F statistic. That comparison has a name, the nested F test.

```r
# Ask whether a squared ad-spend term earns its place in the model
fit_sq <- lm(sales ~ ad_spend + I(ad_spend^2) + emails, data = store)
anova(fit, fit_sq)
#> Analysis of Variance Table
#>
#> Model 1: sales ~ ad_spend + emails
#> Model 2: sales ~ ad_spend + I(ad_spend^2) + emails
#>   Res.Df      RSS Df Sum of Sq      F    Pr(>F)
#> 1    177 12961117
#> 2    176 10586965  1   2374152 39.468 2.536e-09 ***
```

F is 39.468 and the p-value is 0.0000000025. Read that as: if a straight line really were the right shape, an improvement this big from adding one bend would turn up in fewer than three tries in a billion. The `I()` wrapper, by the way, just tells R to treat `ad_spend^2` as arithmetic rather than as formula syntax.

So the eye and the test agree. The first promise is broken, and we broke it ourselves when we wrote `log(ad_spend)` into the build.

=== step === concept
## What a missed curve costs in real money

A broken assumption is easy to shrug off while it stays abstract, so let's turn this one into dollars.

The model has one number for advertising, 2.166, and it applies that number everywhere. Spend one more dollar on a 60-dollar day and the model says you get 2.17 dollars back. Spend one more on a 650-dollar day and the model says exactly the same thing. A straight line cannot say anything else, because one slope is all it has.

Is that what the store's own days say? We can ask them directly. Split the 180 days into the same three bands, fit the same straight-line model separately inside each band, and read off the advertising slope each band produces on its own.

```r
# Compare the one slope the whole line claims against what each spend band really returns
cheap <- subset(store, ad_spend < 200)
mid   <- subset(store, ad_spend >= 200 & ad_spend < 450)
big   <- subset(store, ad_spend >= 450)

slope_cheap <- coef(lm(sales ~ ad_spend + emails, data = cheap))[["ad_spend"]]
slope_mid   <- coef(lm(sales ~ ad_spend + emails, data = mid))[["ad_spend"]]
slope_big   <- coef(lm(sales ~ ad_spend + emails, data = big))[["ad_spend"]]

data.frame(spend_band     = c("under 200", "200 to 450", "450 and up"),
           days           = c(nrow(cheap), nrow(mid), nrow(big)),
           line_says      = round(coef(fit)[["ad_spend"]], 2),
           these_days_say = round(c(slope_cheap, slope_mid, slope_big), 2))
#>   spend_band days line_says these_days_say
#> 1  under 200   42      2.17           5.80
#> 2 200 to 450   62      2.17           2.40
#> 3 450 and up   76      2.17           1.21
```

One claim, and the days give three different answers. On the cheap days advertising returns 5.80 dollars a dollar. In the middle it returns 2.40. On the big days it returns 1.21. The single 2.17 the model reported is a blend of all three, and it is wrong at both ends of the range.

Because we built this data ourselves, we can go one better and check those band slopes against the truth. The sales column was built with `600 * log(ad_spend)`, and the return on one more dollar under that rule works out at `600 / ad_spend`.

```r
# The sales column was built with 600 * log(ad_spend), so the true return is 600 / ad_spend
round(600 / c(60, 300, 650), 2)
#> [1] 10.00  2.00  0.92
```

At a spend of 60 dollars a day the truth is 10 dollars back per advertising dollar. At 300 it is 2 dollars. At 650 it is 92 cents.

Now think about what the model would have you do. It reports 2.17 everywhere, so at 650 dollars a day it says advertising is still more than doubling your money, when the real answer is that you are losing eight cents on every dollar. A store acting on that number keeps buying advertising it should have stopped buying, and R-squared of 0.731 never once complains.

[KEY INSIGHT]
A missed curve does not usually ruin the fit. It ruins the answer at the edges of your data, which is exactly where decisions get made. R-squared is an average over all your rows, so a model can be a decent summary and a bad guide at the same time.

=== step === tryit
## Your turn: put the curve into the model

When the straight-line promise breaks, the repair is to change the model until the relationship inside it really is straight.

You do not have to guess the shape from nothing. A slope that shrinks as the predictor grows, the way advertising did here, is the classic sign of a logarithm, so the usual first move is to fit the predictor as `log(ad_spend)` instead of `ad_spend`. The model is still a linear regression. It is now linear in the log of spend rather than in spend itself.

Fit that model, call it `fit_curve`, and check two things: its R-squared, and whether the residual band has flattened out.

```r
# Refit the model with log(ad_spend) in place of ad_spend, then look again
# 1. Fit sales on log(ad_spend) and emails, and name it fit_curve.
# 2. Print summary(fit_curve)$r.squared.
# 3. Print round(tapply(residuals(fit_curve), spend_band, mean), 1) to see the band.
# Three lines. Press Check when you have them.
```
::check {"regex": "sales\\s*~\\s*log[(]ad_spend[)]", "gate": true, "difficulty": "intermediate", "ok": "That is it. R-squared rises from 0.731 to 0.792, and the three band averages fall from -78.7, 108.9 and -45.3 to 7.1, -14.6 and 8.0. The arch is gone.", "no": "Take the model you already have and swap one term: fit_curve is lm(sales ~ log(ad_spend) + emails, data = store), then print summary(fit_curve)$r.squared."}
::solution
```r
# Fit the curved version and see whether the residual band flattens out
fit_curve <- lm(sales ~ log(ad_spend) + emails, data = store)
summary(fit_curve)$r.squared
#> [1] 0.7915142

round(tapply(residuals(fit_curve), spend_band, mean), 1)
#>  under 200 200 to 450 450 and up
#>        7.1      -14.6        8.0
```

Look at those three band averages next to the ones from before. They went from minus 79, plus 109 and minus 45 down to plus 7, minus 15 and plus 8. The arch has flattened into noise, which is what a kept promise looks like.

R-squared went up too, from 0.731 to 0.792, but treat that as a bonus rather than the point. The reason to make this change is that the model now gives a different, and correct, answer at every spend level instead of one blended answer everywhere.

=== step === concept
## Does the spread grow with the prediction?

On to the second promise. The model assumes the errors are the same size everywhere: as unpredictable on a 4,000-dollar day as on a 5,500-dollar day. The proper name for that is **homoskedasticity**, and for the failure, **heteroskedasticity**. They are ugly words for a simple picture, which is a band that fans out.

We know this promise is broken, because we built the noise with a standard deviation of `40 + 0.5 * ad_spend`. Let's see whether the checks find it. First, measure the spread directly. Sort the days by what the model predicted for them, cut them into three equal groups, and take the standard deviation of the residuals inside each group.

```r
# Measure the residual spread inside three bands of the prediction itself
fitted_band <- cut(fitted(fit),
                   breaks = quantile(fitted(fit), c(0, 1/3, 2/3, 1)),
                   labels = c("low", "middle", "high"),
                   include.lowest = TRUE)
round(tapply(residuals(fit), fitted_band, sd), 1)
#>    low middle   high
#>  227.2  201.4  327.9
```

On the store's biggest days the model's typical miss is 328 dollars. In the middle of the range it is 201, which makes the top third about 60% wider than the middle one.

That is the funnel from the widget earlier, written as numbers. The plot that shows it is the bottom-left panel of the diagnostic grid, Scale-Location, and the test that puts a p-value on it is **Breusch-Pagan**, which lives in the `lmtest` package. It works by asking whether the size of the residuals can itself be predicted from the predictors. If it can, the spread is not constant.

```r
# Draw the scale-location panel and test the spread with Breusch-Pagan
suppressMessages(library(lmtest))
par(mfrow = c(1, 1))
plot(fit, which = 3)
bptest(fit)
#>
#> 	studentized Breusch-Pagan test
#>
#> data:  fit
#> BP = 12.103, df = 2, p-value = 0.002354
```

The Scale-Location panel plots the size of each residual, on a square-root scale, against the fitted value, so it strips away the sign and shows nothing but magnitude. Its red trend line climbs from left to right instead of staying flat.

Breusch-Pagan agrees, at p = 0.0024. If the spread really were constant, a pattern this strong would turn up about twice in a thousand models. So the second promise is broken as well.

=== step === concept
## The repair that leaves every coefficient exactly where it was

Here is the part almost everyone guesses wrong, so it is worth slowing down for.

When the spread is uneven, the coefficients are still fine. `lm()` picks the line that minimises squared error, and an uneven spread does not pull that line off course. The estimate stays unbiased. What breaks is the standard error printed beside it.

Think about why. The standard error is the model's statement of how precisely it knows a coefficient, and it is computed on the assumption that every day is equally informative. When the model's typical miss is three hundred dollars on the big days and two hundred on the quiet ones, that assumption is false, so the arithmetic behind the standard error is using the wrong weights. The number it produces can come out too small or too large. Either way, the confidence interval and the p-value are built on top of it, so they inherit the mistake.

The repair is not to change the model. It is to compute the standard errors a different way, one that stops assuming an equal spread and reads the actual spread off the residuals instead. Those are called **heteroskedasticity-robust** standard errors, and `coeftest()` from `lmtest` together with `vcovHC()` from `sandwich` produce them in one line. Here they are next to the plain ones.

```r
# Put the plain standard errors beside heteroskedasticity-robust ones
suppressMessages(library(sandwich))
coeftest(fit)
#>
#> t test of coefficients:
#>
#>               Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) 2978.77520  114.48438 26.0191 < 2.2e-16 ***
#> ad_spend       2.16642    0.10630 20.3799 < 2.2e-16 ***
#> emails         0.28260    0.03561  7.9362 2.296e-13 ***

coeftest(fit, vcov = vcovHC(fit, type = "HC1"))
#>
#> t test of coefficients:
#>
#>               Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) 2.9788e+03 1.0642e+02 27.9904 < 2.2e-16 ***
#> ad_spend    2.1664e+00 1.2351e-01 17.5397 < 2.2e-16 ***
#> emails      2.8260e-01 3.3613e-02  8.4077 1.344e-14 ***
```

Compare the two blocks column by column. The Estimate column is identical: 2.1664 for advertising in both, 0.2826 for emails in both. Not one coefficient moved, because nothing about the fitted line changed.

The Std. Error column did move. Advertising went from 0.1063 to 0.1235, about 16% wider, so the plain standard error was overstating how precisely we knew that slope. Emails went the other way, from 0.03561 down to 0.03361. Both were wrong, in opposite directions, and only the robust version knows by how much.

[KEY INSIGHT]
Uneven spread is a precision problem, not a bias problem. The coefficient was never in danger. The error bar around it was. So the fix is the standard error, and the model you report is the model you already had.

`type = "HC1"` is the small-sample correction most people use, and it is what Stata reports by default. On 180 rows the choice between HC1 and its siblings barely matters, so take it as a sensible default rather than a decision to agonise over.

=== step === quiz
## Quick check: reading a funnel in the residuals

You fit a model on a new dataset. The Residuals vs Fitted plot shows a band that starts narrow on the left and fans out steadily to the right, and Breusch-Pagan comes back at p = 0.004. What have you actually learned?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The slope is biased, so the model needs a curved term before you can trust it. ::no
- The largest observations are outliers and should be removed before refitting. ::no
- The slope estimate is still sound, but the standard error around it is not, so the repair is robust standard errors and the model stays as it is. ::ok Right. A funnel is about how confidently you know the answer, never about whether the answer is in the right place. Refit nothing, recompute the standard errors.
- Nothing needs doing, because R-squared is high and the coefficients are significant. ::no A funnel is a precision failure. The fitted line is still the least-squares line and the coefficients are still unbiased, so there is nothing to refit and nothing to delete. What is unreliable is the standard error, and with it the interval and the p-value. Recompute those with a robust estimator and report the same model.

=== step === concept
## Does one day's error carry into the next?

The third promise is that the errors are independent: knowing how wrong the model was on Tuesday tells you nothing about how wrong it will be on Wednesday.

This is the one check R cannot draw for you, because a data frame does not know what its rows mean. Ours are days in order, so "the next observation" is a real thing here and the promise is worth checking. Plot each day's residual against the day it happened.

```r
# Plot each day's residual against the day it happened, in the original row order
par(mfrow = c(1, 1))
plot(store$day, residuals(fit), pch = 16, col = "grey40",
     xlab = "Day", ylab = "Residual",
     main = "Residual by day, in the order the days happened")
abline(h = 0, col = "red", lwd = 2)
```

What you want is what you see: points crossing the red zero line constantly, with no long stretches stuck on one side. A failure would look obviously different. If the model ran ten days too low and then twelve days too high, you would see the points drift above and below the line in long waves, and that pattern is called **autocorrelation**.

The test for it is **Durbin-Watson**, also from `lmtest`. It compares each residual with the one before it and returns a number between 0 and 4. Around 2 means no link between neighbours. Below 2 means consecutive residuals tend to share a sign, and above 2 means they tend to alternate.

```r
# Test whether each day's error is linked to the day before it
dwtest(fit)
#>
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 2.1937, p-value = 0.9037
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW is 2.1937, near enough to 2 to be unremarkable, and p is 0.90. There is no evidence of any link between one day's error and the next.

That is the correct result, and we know it because we built the noise one day at a time with independent draws from `rnorm`. The third promise holds. Three checks in, and this is the first one to come back clean.

=== step === concept
## The Q-Q plot passes, and it mattered least anyway

The fourth promise is that the errors are roughly normal: mostly small, symmetric around zero, with big misses rare in both directions.

The plot for it is the Q-Q plot, and the idea behind it takes one sentence. Sort your residuals from smallest to largest, work out where each one would sit if the errors really were normal, and plot what you got against what you expected. If they match, every point lands on a straight diagonal line. Points that bend away from that line at the ends are the ones telling you the tails are fatter or thinner than normal.

```r
# Check whether the residuals are roughly normal, by eye and by test
par(mfrow = c(1, 1))
qqnorm(residuals(fit), main = "Normal Q-Q plot of the residuals")
qqline(residuals(fit), col = "red", lwd = 2)
shapiro.test(residuals(fit))
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.99454, p-value = 0.751
```

The points sit along the red line from end to end, and **Shapiro-Wilk**, which tests the same thing numerically, returns p = 0.751. There is no sign of trouble.

Now for the part nobody tells beginners. Of the five promises, this is the least important one on a dataset of a few hundred rows, and it is the one people worry about the most.

The reason is that the standard errors and p-values in a regression do not really need the individual errors to be normal. They need the coefficient estimates to be roughly normal, and a coefficient is built from sums across all your rows. Sums of many independent things drift towards normal on their own, whatever shape the individual pieces had. That is the central limit theorem doing the work, and on 180 rows it has plenty to work with.

[WARNING]
Shapiro-Wilk gets more sensitive as your sample grows. On 5,000 rows it will flag departures from normality so small that they change none of your conclusions. Look at the Q-Q plot and judge how far the tails actually bend, rather than acting on the p-value alone.

=== step === quiz
## Quick check: a run of same-sign residuals, and a Q-Q that bends on 5,000 rows

Two colleagues bring you two models. In the first, the residuals plotted in date order sit above zero for eleven weeks straight and then below zero for nine. In the second, fitted on 5,000 rows, the Q-Q points bend very slightly at both ends and Shapiro-Wilk returns p = 0.01. Which one needs work?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The first. Long runs of the same sign are broken independence, and its standard errors are unreliable until that is dealt with. The second is a mild normality flag on a large sample, which usually calls for nothing. ::ok Exactly right. Autocorrelation genuinely damages the standard errors and needs a real answer. A normality test firing on thousands of rows is mostly the test showing off its sensitivity.
- The second. Any Shapiro-Wilk p under 0.05 means the model's p-values cannot be trusted. ::no
- Both, equally. A failed check is a failed check, whichever assumption it belongs to. ::no
- Neither. Runs in the residuals are normal, and 5,000 rows is enough to make any assumption safe. ::no The five checks do not carry equal weight. Broken independence is one of the serious ones: consecutive errors that share a sign mean your rows carry less information than the model believes, and the standard errors shrink accordingly. Normality is the mildest of the five on a large sample, because the central limit theorem is already doing the work, and Shapiro-Wilk grows more sensitive with every extra row.

=== step === widget
## Is one day running the whole model?

The fifth promise is the one that has nothing to do with the shape of anything. It is about whether the model belongs to all your rows, or to one of them.

Three words get used here, and they mean different things.

**Leverage** is about a row's position on the predictors alone. A day where the store spent 1,800 dollars, when every other day sits under 700, has high leverage. It is far out on the horizontal axis, so the fitted line has to pay it a lot of attention. Notice that leverage says nothing at all about sales, because a far-out day can still land exactly where the line expects.

**Influence** is leverage plus being in the wrong place. The day is far out on the predictors and its sales also miss what the line predicted. That combination is what actually drags the line.

**Cook's distance** puts a number on influence. For each row it asks a single question: if I dropped this one row and refitted, how far would all the other fitted values move? A big Cook's distance means that dropping this row would change the model's answers for every other row too.

Drag the far-right point up and down. The solid line is the fit with that point included, and the dashed line is the fit without it. The line underneath reports both slopes, "with it" against "without it", so you can read the damage as a number rather than guess it from the picture.

::widget leverage-point {}

Notice two things while you drag. When the far point sits where the dashed line expects it, the two lines lie on top of each other and the two slopes agree, which is high leverage doing no harm at all. And the point never has to look absurd to do damage. A modest shift up or down swings the solid line noticeably, because there is nothing else out at that end of the axis to argue with it.

The Run button below the chart fits both models in R and prints the Cook's distance for that point, which is the number you would compute on your own data.

=== step === tryit
## Your turn: add Black Friday and watch a coefficient move

Now let's do that to our own store.

Imagine one more day at the end of the 180, a Black Friday. The store spends 1,800 dollars on advertising, more than double its previous biggest day. It sends 5,200 emails. It takes 14,500 dollars, roughly two and a half times its best day so far.

Nothing about that day is a mistake. It is a real day, correctly recorded, and it is exactly the kind of row that takes over a model without anyone noticing.

The starting code below refits the repaired model on the clean 180 days and then builds `black_friday`, the same data with the extra day glued on the end. Your job is to fit the same model on `black_friday`, compare its coefficients with the clean ones, and measure the new day's Cook's distance.

```r
# Add one Black Friday to the 180 days and measure how far it drags the model
fit_curve <- lm(sales ~ log(ad_spend) + emails, data = store)

black_friday <- rbind(store,
  data.frame(day = 181, ad_spend = 1800, emails = 5200, sales = 14500))

# 1. Fit sales on log(ad_spend) and emails using black_friday, and name it fit_bf.
# 2. Print round(coef(fit_curve), 2) and round(coef(fit_bf), 2) to compare them.
# 3. Print round(max(cooks.distance(fit_bf)), 2).
# Press Check when you have them.
```
::check {"regex": "data\\s*=\\s*black_friday", "gate": true, "difficulty": "intermediate", "ok": "There it is. One row out of 181 pushed the advertising coefficient from 611.41 to 747.09, a jump of more than 22%, and the emails coefficient from 0.27 to 0.55, which is double. Its Cook's distance is 6.29 against a next-highest of 0.0182.", "no": "Reuse the same formula on the new data: fit_bf is lm(sales ~ log(ad_spend) + emails, data = black_friday). Then print round(coef(fit_bf), 2) and round(max(cooks.distance(fit_bf)), 2)."}
::solution
```r
# Refit the repaired model with the extra day and measure that day's pull
fit_bf <- lm(sales ~ log(ad_spend) + emails, data = black_friday)

round(coef(fit_curve), 2)
#>   (Intercept) log(ad_spend)        emails
#>        318.53        611.41          0.27

round(coef(fit_bf), 2)
#>   (Intercept) log(ad_spend)        emails
#>      -1250.45        747.09          0.55

round(max(cooks.distance(fit_bf)), 2)
#> [1] 6.29

round(unname(sort(cooks.distance(fit_bf), decreasing = TRUE)[2]), 4)
#> [1] 0.0182
```

Take the two coefficient rows first. Advertising moved from 611.41 to 747.09, up by more than 22%. Emails moved from 0.27 to 0.55, which is to say it doubled. The intercept crossed from plus 318 to minus 1,250. One row in 181 did all of that.

Now the Cook's distances. Black Friday scores 6.29. The next largest day in the whole dataset scores 0.0182, which is about 350 times smaller. There is nothing to argue about, because the gap between first and second is itself the finding.

Common rules of thumb put the worry line at 0.5, or at 1, or at four divided by the number of rows. On these numbers it does not matter which rule you prefer. What matters is the shape of the sorted list: one enormous value, and then a cliff.

=== step === concept
## Run all five again, and say what you do about Black Friday

Black Friday was a what-if. We invented that day to see what one row could do, so the store's real records are still the clean 180, and the model it ships is the repaired one. But the question it raises is not hypothetical, because sooner or later a row like that turns up in your data for real.

So what do you do when a single row is running your model? "Drop the outlier" is the common reflex and it is the wrong one. There are three honest answers, and which one you pick depends on what the row is.

1. **The row is a mistake.** A misplaced decimal point, a duplicated import, a sensor that read minus 999. Fix it if you can, remove it if you cannot, and say in writing that you did.
2. **The row is real but outside the question you are answering.** If the store is modelling ordinary trading days to plan its weekly advertising, Black Friday is a different kind of day. Then you exclude it, state the exclusion, and narrow your claim to ordinary days.
3. **The row is real and inside the question.** Then it stays. Report both fits, the one with it and the one without it, and let the reader see how much of your answer rests on one day.

For a genuine Black Friday the third answer is the one to give. It is a real trading day and it belongs in a model of how advertising moves sales, so it stays, and you report both fits. Deleting it and presenting the tidier number without saying so is the thing not to do. That is how a coefficient of 747 turns into a coefficient of 611 in a slide deck with no footnote.

Our own 180 days contain no such row, so the model to recheck is `fit_curve`. And a repaired model always gets rechecked, because a repair can fix one thing and expose another. Here are all five, run again.

```r
# Rerun all five checks on the repaired model and print the verdicts side by side
fit_curve    <- lm(sales ~ log(ad_spend) + emails, data = store)
fit_curve_sq <- lm(sales ~ log(ad_spend) + I(ad_spend^2) + emails, data = store)

data.frame(
  check   = c("straight line", "even spread", "independent errors",
              "normal errors", "no day in charge"),
  measure = c("nested F p-value", "Breusch-Pagan p-value", "Durbin-Watson p-value",
              "Shapiro-Wilk p-value", "largest Cook's distance"),
  value   = round(c(anova(fit_curve, fit_curve_sq)[["Pr(>F)"]][2],
                    bptest(fit_curve)$p.value,
                    dwtest(fit_curve)$p.value,
                    shapiro.test(residuals(fit_curve))$p.value,
                    max(cooks.distance(fit_curve))), 5))
#>                check                 measure   value
#> 1      straight line        nested F p-value 0.30622
#> 2        even spread   Breusch-Pagan p-value 0.00007
#> 3 independent errors   Durbin-Watson p-value 0.82779
#> 4      normal errors    Shapiro-Wilk p-value 0.00085
#> 5   no day in charge largest Cook's distance 0.06595
```

Go down that column one row at a time, because every movement in it matters.

The straight-line check now passes at p = 0.31. With `log(ad_spend)` in the model, a squared term adds nothing worth having, so the curve is genuinely gone.

Independence still passes at p = 0.83, unchanged, which is what you would expect from a repair that never touched the row order.

The largest Cook's distance is 0.066, well under every rule of thumb. On the clean 180 days no single day is in charge.

Then the two that did not go the way you might hope. Breusch-Pagan got worse, from 0.0024 down to 0.00007, so the uneven spread is still there and is now easier to see. Fixing the shape did not fix the spread, because those were two separate flaws that we planted separately. And normality, which passed comfortably before at p = 0.751, now fails at p = 0.00085. The missed curve had been padding the residuals with a systematic arch. Take the arch away and what is left are the real tails, which come from noise more than six times wider on the big days than on the quiet ones.

So the model to report is `fit_curve`, with robust standard errors, because that second promise is still broken.

```r
# Report the repaired model with standard errors that survive the uneven spread
coeftest(fit_curve, vcov = vcovHC(fit_curve, type = "HC1"))
#>
#> t test of coefficients:
#>
#>                 Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)   318.533949 123.482252  2.5796    0.0107 *
#> log(ad_spend) 611.411401  20.680375 29.5648 < 2.2e-16 ***
#> emails          0.272555   0.030362  8.9768 4.016e-16 ***
```

That is the whole habit in one block of output: a model whose shape you tested, standard errors that do not lean on a promise you know is broken, and a normality flag you have looked at and decided you can live with on 180 rows.

=== step === quiz
## Quick check: matching the symptom to the check

A colleague sends you a Residuals vs Fitted plot from a model you have never seen. The points sit below the zero line at the left end, ride above it through the middle, and drop back below it at the right end. The vertical spread looks about the same all the way across. Which promise is broken, and what is the repair?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- Equal spread is broken, so recompute the standard errors with a robust estimator. ::no
- Independence is broken, so run Durbin-Watson and switch to a time-series model. ::no
- One observation is running the model, so find it with Cook's distance and decide what to do about it. ::no The give-away is the arch: below, then above, then below. That is a systematic pattern in the residuals, which means the straight line missed a bend, and a bend is fixed by changing the model. An even vertical spread rules out the funnel, a shape in fitted-value order says nothing about row order, and a pattern that runs across the whole band is not the work of one point.
- The straight-line promise is broken, so change the model: add a squared term or take a log, then rerun the check. ::ok Exactly. Down, up, down with an even spread is the arch, and an arch means the shape is wrong. That is the one failure where the fix is a different model rather than a different standard error.

=== step === tryit
## Your turn: run all five on a model you have not seen

One last model, and this one you have not built.

`mtcars` ships with R: 32 cars from a 1974 magazine road test, one row per car. A very common first model on it predicts fuel economy, `mpg`, from weight and horsepower. The starting code fits it for you.

Run all five checks on `mt` and see what you find. Use the nested F test for a missed curve, `bptest()` for the spread, `dwtest()` for independence, `shapiro.test()` for normality, and the sorted Cook's distances for a car that is running the show. Because `mtcars` rows carry the car names, that last one will tell you exactly which car it is.

```r
# Fit miles per gallon on weight and horsepower, the model you are about to check
mt <- lm(mpg ~ wt + hp, data = mtcars)

# Run the five checks on mt:
# 1. anova() against a model with I(wt^2) added, for a missed curve.
# 2. bptest(mt), 3. dwtest(mt), 4. shapiro.test(residuals(mt)).
# 5. round(sort(cooks.distance(mt), decreasing = TRUE)[1:3], 3).
# Press Check when you have them.
```
::check {"regex": "anova\\s*[(]\\s*mt\\s*,", "gate": true, "difficulty": "advanced", "ok": "Good. Three of the five come back interesting: a real curve in weight (F = 9.85, p = 0.004), a normality flag (p = 0.034), and the Chrysler Imperial at a Cook's distance of 0.424, about one and a half times the next car. The spread is fine at p = 0.64, and the Durbin-Watson number is the one to think twice about.", "no": "Five lines, one per check: anova(mt, lm(mpg ~ wt + I(wt^2) + hp, data = mtcars)), then bptest(mt), dwtest(mt), shapiro.test(residuals(mt)), and round(sort(cooks.distance(mt), decreasing = TRUE)[1:3], 3)."}
::solution
```r
# Run all five checks on the mtcars model
mt_sq <- lm(mpg ~ wt + I(wt^2) + hp, data = mtcars)
anova(mt, mt_sq)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + I(wt^2) + hp
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)
#> 1     29 195.05
#> 2     28 144.29  1    50.755 9.8489 0.003978 **

bptest(mt)
#> 	studentized Breusch-Pagan test
#>
#> data:  mt
#> BP = 0.88072, df = 2, p-value = 0.6438

dwtest(mt)
#> 	Durbin-Watson test
#>
#> data:  mt
#> DW = 1.3624, p-value = 0.02061
#> alternative hypothesis: true autocorrelation is greater than 0

shapiro.test(residuals(mt))
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(mt)
#> W = 0.92792, p-value = 0.03427

round(sort(cooks.distance(mt), decreasing = TRUE)[1:3], 3)
#> Chrysler Imperial     Maserati Bora    Toyota Corolla
#>             0.424             0.272             0.208
```

Four things are worth saying about that.

The curve is real. Adding a squared weight term improves the fit at p = 0.004, which makes sense once you picture it. The cars here run from about 1,500 to about 5,400 pounds, and putting on the first thousand pounds costs a lot of miles per gallon while putting on the last thousand costs much less, because by then there is not much economy left to lose. It is the same shape as our advertising spend, and it takes the same repair.

The spread is fine, at p = 0.64, so the plain standard errors are doing their job.

Normality flags at p = 0.034, and the Q-Q plot is worth a look before you act on it. On 32 rows a mild bend is not much to go on either way.

And the Chrysler Imperial has a Cook's distance of 0.424, about one and a half times the next car and roughly twice the third. At 5,345 pounds it is the second heaviest car in the set, and it returns 14.7 miles per gallon where the model predicts 9.2, so it is far out on weight and well off the line at the same time. It is not an error and it belongs in a study of these cars, so it stays, and you report that the weight coefficient leans on it.

That leaves the Durbin-Watson result, which came back at p = 0.02. Think about that one for a moment before you move on.

=== step === quiz
## Quick check: a Durbin-Watson number you should ignore

The `mtcars` model returned DW = 1.3624 with p = 0.021, which looks like broken independence. What should you do about it?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Switch to standard errors that allow for autocorrelation, since p is under 0.05. ::no
- Nothing. Durbin-Watson compares each row with the row before it, and `mtcars` rows are cars printed in a magazine table, not measurements taken in order. There is no "before" here, so the number is not measuring anything. ::ok Exactly. A check only means something when its question applies to your data. Ask a test about an ordering that does not exist and it will still return a number, and that number will still come with a p-value.
- Sort the rows by weight and run the test again, so that the ordering becomes meaningful. ::no
- Treat it as a sign that the model is missing a predictor, since that is what autocorrelation usually indicates. ::no Independence is a claim about how your rows were collected. If they arrived in time order, or in geographic clusters, or in classrooms, the question is real and the answer matters. If they are 32 cars listed in whatever order a magazine printed them, there is no sequence for an error to carry along, and reordering them yourself would manufacture a pattern rather than reveal one.

=== step === concept
## References

- [Plot Diagnostics for an lm Object](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html) - R Core Team. The documentation for `plot.lm()`, covering all six diagnostic plots and the `which` argument that picks one.
- [An R Companion to Applied Regression, 3rd edition](https://CRAN.R-project.org/package=car) - Fox and Weisberg (2019), Sage. The regression diagnostics chapters, and the home of the `car` package.
- [Diagnostic Checking in Regression Relationships](https://CRAN.R-project.org/package=lmtest) - Zeileis and Hothorn (2002), R News 2(3), 7-10. The paper behind `lmtest`, and the source of `bptest()`, `dwtest()` and `coeftest()`.
- [Econometric Computing with HC and HAC Covariance Matrix Estimators](https://www.jstatsoft.org/article/view/v011i10) - Zeileis (2004), Journal of Statistical Software 11(10). What `vcovHC()` computes, and how HC0 through HC3 differ.
- [Detection of Influential Observation in Linear Regression](https://www.jstor.org/stable/1268249) - Cook (1977), Technometrics 19(1), 15-18. The original definition of Cook's distance.

=== step === complete
## Quick recap

You took a model that looked perfect, put it through all five checks, and found two of its promises broken. Here is the whole thing on one page.

The five promises, and the checks that find them:

1. **The relationship is a straight line.** Residuals vs Fitted, then a nested F test against a model with a squared term. Ours arched: mean residuals of -78.7, +108.9 and -45.3 across three spend bands, F = 39.5 at p = 0.0000000025.
2. **The errors are the same size everywhere.** Scale-Location, then Breusch-Pagan. Ours fanned out: spreads of 227, 201 and 328 across the range, p = 0.0024.
3. **One error says nothing about the next.** Residuals plotted in row order, then Durbin-Watson. Ours passed: DW = 2.19 at p = 0.90.
4. **The errors are roughly normal.** The Q-Q plot, then Shapiro-Wilk. Ours passed at p = 0.751, and on a few hundred rows this is the mildest of the five anyway.
5. **No single row is running the model.** Residuals vs Leverage, then Cook's distance. Ours passed until we added Black Friday, which scored 6.29 against a next-highest of 0.0182 and moved a coefficient by 22%.

And a single `plot(fit)` call draws four of those five, with `par(mfrow = c(2, 2))` in front of it to lay them out on one screen.

When a check fails there are only three answers, and picking the right one is most of the skill:

- **Change the model.** For a broken shape. A log or a squared term, then rerun the check.
- **Change the standard errors.** For an uneven spread, or for errors that are linked to each other. The coefficients were never wrong; only the error bars were.
- **Leave it alone and say so.** For an influential row that is real and belongs, or a normality flag on a large sample. Report both fits, or report the judgement, and let your reader see it.

One last thing worth keeping. After you repair a model, run all five again. Ours came back with the curve gone, the spread still uneven, and a normality flag that had been hiding under the arch the whole time. Checking once is a habit. Checking again after the repair is the professional one.

That is the full set. Next time an output comes back with three stars and a healthy R-squared, you will know what to do before you believe any of it. Have a great day!

---
title: "Time Series Regression Lesson 1: Fitting a trend line with TSLM"
catalog_blurb: "Fit a straight trend line through your data and read what the slope means."
description: "Fit an ordinary regression line to 48 months of user growth with TSLM(), read its slope, forecast ahead, and see which assumptions a time series breaks."
keywords: "TSLM, time series linear model, fable TSLM R, trend predictor fable, new_data forecast R, report glance fabletools, Durbin-Watson time series, autocorrelated residuals regression"
post_type: "LESSON"
curriculum_id: "5.40.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-regression"
course_title: "Time Series Regression"
course_lesson: "1"
course_total: "6"
course_landing: "Time-Series-Regression-Course.html"
course_next: "Trend-and-Seasonal-Dummy-Variables.html"
course_prev: ""
---

=== step === cover
## Fitting a trend line with TSLM

Today let's understand how to fit a straight trend line through a time series, using TSLM(), and read exactly what the line's own numbers mean.

Northwind is a small SaaS company that tracks its monthly active users, MAU for short. Here are 48 months of it, January 2022 through December 2025. MAU climbs from 1,225 users to a high of 5,290, but it is not a straight climb, it wobbles up and down along the way.

::widget chart-plotter {"data":[{"x":1,"y":1225},{"x":2,"y":1257},{"x":3,"y":1322},{"x":4,"y":1366},{"x":5,"y":1409},{"x":6,"y":1500},{"x":7,"y":1574},{"x":8,"y":1674},{"x":9,"y":1933},{"x":10,"y":1968},{"x":11,"y":1935},{"x":12,"y":2058},{"x":13,"y":2269},{"x":14,"y":2483},{"x":15,"y":2536},{"x":16,"y":2526},{"x":17,"y":2569},{"x":18,"y":2610},{"x":19,"y":3130},{"x":20,"y":2865},{"x":21,"y":2763},{"x":22,"y":2890},{"x":23,"y":2949},{"x":24,"y":2982},{"x":25,"y":3024},{"x":26,"y":3136},{"x":27,"y":3115},{"x":28,"y":3277},{"x":29,"y":3620},{"x":30,"y":3685},{"x":31,"y":3750},{"x":32,"y":3673},{"x":33,"y":3605},{"x":34,"y":3790},{"x":35,"y":3763},{"x":36,"y":3977},{"x":37,"y":4580},{"x":38,"y":4268},{"x":39,"y":4684},{"x":40,"y":4689},{"x":41,"y":4520},{"x":42,"y":4274},{"x":43,"y":4473},{"x":44,"y":4691},{"x":45,"y":4924},{"x":46,"y":4993},{"x":47,"y":5290},{"x":48,"y":5181}],"geoms":["line"],"x":"month","y":"mau"}

Look at that shape for a second. It rises overall, but every few months it dips before climbing again. Draw one straight line through that wobble, and Northwind's growth reduces to two numbers: a starting point and a monthly rate.

=== step === concept
## What TSLM() fits, and what trend() means as a predictor

TSLM() stands for time series linear model. It fits the same ordinary linear regression you would get from lm(), except it is built to work on a tsibble, the tidyverse's structure for a table indexed by time, and it understands a few special time-aware predictors that lm() does not.

trend() is one of those predictors. It is nothing more than the row number of the series: 1 for the first month, 2 for the second, all the way up to 48 for Northwind's last month, December 2025.

Build Northwind's 48 months as a tsibble, then fit TSLM(mau ~ trend()), which reads as "explain mau using trend() as the only predictor."

```r
# Build Northwind's 48 months of MAU as a tsibble, then fit TSLM(mau ~ trend())
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(45)
trend_vals <- seq(1200, 5000, length.out = 48)
e <- numeric(48)
e[1] <- rnorm(1, 0, 0.06 * trend_vals[1])
for (i in 2:48) {
  e[i] <- 0.7 * e[i - 1] + rnorm(1, 0, 0.045 * trend_vals[i])
}
mau <- round(trend_vals + e)

nw <- tsibble(month = yearmonth("2022 Jan") + 0:47, mau = mau, index = month)
print(nw, n = 5)
#> # A tsibble: 48 x 2 [1M]
#>      month   mau
#>      <mth> <dbl>
#> 1 2022 Jan  1225
#> 2 2022 Feb  1257
#> 3 2022 Mar  1322
#> 4 2022 Apr  1366
#> 5 2022 May  1409
#> # ℹ 43 more rows

fit <- nw |> model(TSLM(mau ~ trend()))
print(fit)
#> # A mable: 1 x 1
#>   `TSLM(mau ~ trend())`
#>                 <model>
#> 1                <TSLM>
```

model() is fabletools' function for fitting any time series model onto a tsibble. It hands back a mable, short for model table, one row holding the whole fitted TSLM object inside a single cell. The print above just confirms which model that cell holds; the next step pulls the real numbers back out of it.

=== step === concept
## Reading the coefficients in real units

coef() pulls the fitted numbers out of the mable.

```r
# Read the intercept and slope, then check two fitted values by hand against augment()
coef(fit)
#> # A tibble: 2 × 6
#>   .model              term        estimate std.error statistic  p.value
#>   <chr>               <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 TSLM(mau ~ trend()) (Intercept)   1086.      49.2       22.1 4.11e-26
#> 2 TSLM(mau ~ trend()) trend()         83.9      1.75      48.0 6.01e-41

intercept <- 1085.6
slope <- 83.9

fitted_month1 <- intercept + slope * 1
fitted_month48 <- intercept + slope * 48
round(c(fitted_month1, fitted_month48), 1)
#> [1] 1169.5 5112.8

augment(fit) |>
  as.data.frame() |>
  transmute(month, mau, fitted = round(.fitted, 1)) |>
  filter(month == min(month) | month == max(month))
#>      month  mau fitted
#> 1 2022 Jan 1225 1169.5
#> 2 2025 Dec 5181 5112.8
```

Two rows, two coefficients. term names each one and estimate holds its number (the printed 1086. is just rounded for display; the real value is 1085.634). (Intercept) is the fitted mau at trend() = 0, one month before the data starts, so read it as the line's starting point rather than a real observed month.

trend() is the slope: mau rising by 83.9, on average, for every extra month. Across a full year that works out to 83.9 times 12, about 1,007 more users a year.

Put the two together and the line's equation is mau = 1085.6 + 83.9 * trend(). At month 1 that gives 1169.5, against a real January 2022 value of 1,225, a miss of 55.5. At month 48, December 2025, it gives 5112.8, against a real 5,181, a miss of 68.2. augment() confirms both by hand: it adds a .fitted column, the line's value for that row, straight onto the original tsibble, so you never have to compute it by hand again.

=== step === widget
## Dragging a line through 48 months by hand

Every point in Northwind's series sits a little off any straight line you could draw through it. That gap, for one month, is the residual: the real mau minus the line's prediction for that month. A residual can be positive, the real number beat the line, or negative, the line over-guessed.

To compare two different lines you need one number that scores the whole line at once, built from all 48 residuals. Adding the raw residuals will not work, positive and negative ones cancel out. So square each residual first, then add them up. Squaring drops the sign and punishes a big miss far more than a small one. That total is the sum of squared errors, SSE for short.

Ordinary least squares, the method behind TSLM(), is the rule that picks the one line, the one intercept and slope, that makes SSE as small as it can possibly be.

Drag the line below by hand and watch SSE change with it. It uses the same 48 (month, mau) pairs plotted in the first step, with the month number standing in for trend(). Then press "Snap to least squares" to jump straight to the minimum.

::widget ols-fit {"points":[{"x":1,"y":1225},{"x":2,"y":1257},{"x":3,"y":1322},{"x":4,"y":1366},{"x":5,"y":1409},{"x":6,"y":1500},{"x":7,"y":1574},{"x":8,"y":1674},{"x":9,"y":1933},{"x":10,"y":1968},{"x":11,"y":1935},{"x":12,"y":2058},{"x":13,"y":2269},{"x":14,"y":2483},{"x":15,"y":2536},{"x":16,"y":2526},{"x":17,"y":2569},{"x":18,"y":2610},{"x":19,"y":3130},{"x":20,"y":2865},{"x":21,"y":2763},{"x":22,"y":2890},{"x":23,"y":2949},{"x":24,"y":2982},{"x":25,"y":3024},{"x":26,"y":3136},{"x":27,"y":3115},{"x":28,"y":3277},{"x":29,"y":3620},{"x":30,"y":3685},{"x":31,"y":3750},{"x":32,"y":3673},{"x":33,"y":3605},{"x":34,"y":3790},{"x":35,"y":3763},{"x":36,"y":3977},{"x":37,"y":4580},{"x":38,"y":4268},{"x":39,"y":4684},{"x":40,"y":4689},{"x":41,"y":4520},{"x":42,"y":4274},{"x":43,"y":4473},{"x":44,"y":4691},{"x":45,"y":4924},{"x":46,"y":4993},{"x":47,"y":5290},{"x":48,"y":5181}]}

Look at the intercept and slope the snap lands on. They are 1085.6 and 83.9, the exact same numbers coef(fit) printed in the last step. That is not a coincidence, it is the same computation twice: TSLM() solves for least squares algebraically, and the snap button solves the identical problem by search. Both land in the same place because there is only one line that minimises SSE for this data.

=== step === quiz
## Quick check: what the snapped line means

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The slope means mau rises by about 84 for each additional month. ::ok Right. trend() moves by exactly 1 from one month to the next, so the slope, 83.9, is the average rise in mau for one extra month.
- The slope means mau rises by about 83.9 percent every year. ::no
- The slope is the starting mau in month 1. ::no
- The slope is the total increase in mau across all 48 months. ::no The slope is a per-month rate, not a percent and not a one-time total. Multiply it by 48 and you would get the line's total rise across the whole series, but the coefficient itself, 83.9, is the rise for one extra month.

=== step === concept
## report(): the full regression summary

report() prints the full regression summary fabletools can produce for a fitted model, the same kind of output you would get from summary() on an lm() object in base R.

```r
# Print the full regression summary for the fitted TSLM
report(fit)
#> Series: mau 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -335.37  -97.77  -10.55   84.88  450.30 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 1085.634     49.188   22.07   <2e-16 ***
#> trend()       83.898      1.748   48.01   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 167.7 on 46 degrees of freedom
#> Multiple R-squared: 0.9804,	Adjusted R-squared:  0.98
#> F-statistic:  2305 on 1 and 46 DF, p-value: < 2.22e-16
```

Residuals summarises the 48 misses: half of them fall between -97.77 and 84.88, the 1st and 3rd quartiles, and the single worst miss reaches 450.30.

Coefficients repeats the intercept and slope from the last step, now with full precision, 1085.634 and 83.898, and their significance. Both t values are large and both p-values print as under 2e-16, about as far from zero as a p-value can get, which says neither coefficient looks like it could plausibly be zero.

Residual standard error, 167.7, is the typical size of a miss, in mau, on 46 degrees of freedom, 48 months minus the 2 parameters the model had to estimate. Multiple R-squared, 0.9804, is the share of mau's variation this one straight line explains, 98%. Adjusted R-squared, 0.98, is the same idea corrected for the number of predictors, which barely moves it here since there is only one.

F-statistic, 2305 on 1 and 46 degrees of freedom, tests whether the slope is really different from zero at all. Its p-value, under 2.22e-16, says yes, decisively.

=== step === concept
## glance(): the same fit as one row of numbers

report() is built for reading. glance() is built for reuse: it returns the same fit as one row of a tidy table instead of printed text, ready to stack with other models' rows into a single comparison table.

```r
# Read the same fit as one tidy row of rounded summary numbers
glance(fit) |>
  as.data.frame() |>
  transmute(
    r_squared = round(r_squared, 4),
    adj_r_squared = round(adj_r_squared, 4),
    sigma2 = round(sigma2),
    AIC = round(AIC, 1),
    AICc = round(AICc, 1),
    BIC = round(BIC, 1),
    CV = round(CV)
  )
#>   r_squared adj_r_squared sigma2   AIC  AICc   BIC    CV
#> 1    0.9804          0.98  28136 495.7 496.3 501.3 29173
```

r_squared and adj_r_squared repeat what report() already showed. sigma2, 28136, is the residual variance, the squared version of the residual standard error you just read (167.7 squared lands close to 28136, the small gap is rounding). AIC, AICc and BIC are three different penalised scores for comparing models against each other, lower is better on all three; AICc is AIC with a small-sample correction, and BIC penalises extra parameters more heavily than AIC does. CV is a leave-one-out cross-validation score fabletools computes automatically for a linear model.

None of these numbers mean much read alone, on a single model. They earn their keep once you have two or more models' glance() rows to set side by side and pick the smallest AICc or CV.

=== step === concept
## Forecasting with new_data()

Reading a fit is one thing. Using it to look ahead is another.

new_data() builds empty future rows that continue a tsibble's own time index. Hand it nw and 6, and it returns 6 new rows that continue trend() to 49 through 54, January through June 2026.

```r
# Build 6 future rows continuing Northwind's time index, then forecast them
new_rows <- new_data(nw, 6)
print(new_rows)
#> # A tsibble: 6 x 1 [1M]
#>      month
#>      <mth>
#> 1 2026 Jan
#> 2 2026 Feb
#> 3 2026 Mar
#> 4 2026 Apr
#> 5 2026 May
#> 6 2026 Jun

fc <- fit |> forecast(new_rows)
fc |>
  as.data.frame() |>
  transmute(month, forecast = round(.mean, 1))
#>      month forecast
#> 1 2026 Jan   5196.7
#> 2 2026 Feb   5280.6
#> 3 2026 Mar   5364.5
#> 4 2026 Apr   5448.4
#> 5 2026 May   5532.3
#> 6 2026 Jun   5616.2
```

forecast() reads trend() straight off those new rows, 49 through 54, and applies the same line: 1085.6 + 83.9 * trend(). .mean holds that point forecast, the single most likely value for each month. January 2026 lands at 5196.7, and it keeps climbing by 83.9 a month straight through to 5616.2 in June, exactly the slope you already know.

A point forecast alone hides how much uncertainty surrounds it. hilo() turns fc into an interval instead of one number, at whatever confidence level you give it.

```r
# Turn the same forecast into an 80% interval instead of one point value
hl <- hilo(fc, level = 80)
hl |>
  as.data.frame() |>
  transmute(month, lower = round(`80%`$lower, 1), upper = round(`80%`$upper, 1))
#>      month  lower  upper
#> 1 2026 Jan 4972.6 5420.7
#> 2 2026 Feb 5056.0 5505.1
#> 3 2026 Mar 5139.3 5589.6
#> 4 2026 Apr 5222.6 5674.1
#> 5 2026 May 5305.9 5758.6
#> 6 2026 Jun 5389.1 5843.2
```

January's 80% interval runs 4972.6 to 5420.7, a width of about 448. June's runs 5389.1 to 5843.2, a width of about 454, and every month in between widens a little more than the last. That is not a quirk of this data, it is how a regression forecast always behaves: the further trend() reaches past the 48 months the model actually saw, the less certain the line's own extrapolation gets, and the interval grows to say so honestly.

=== step === widget
## Watching the forecast extend the series

See the same forecast as a picture instead of a table. Plot Northwind's 48 real months alongside the 6 forecasted ones, on the same axis.

::widget chart-plotter {"data":[{"x":1,"y":1225,"fill":"actual"},{"x":2,"y":1257,"fill":"actual"},{"x":3,"y":1322,"fill":"actual"},{"x":4,"y":1366,"fill":"actual"},{"x":5,"y":1409,"fill":"actual"},{"x":6,"y":1500,"fill":"actual"},{"x":7,"y":1574,"fill":"actual"},{"x":8,"y":1674,"fill":"actual"},{"x":9,"y":1933,"fill":"actual"},{"x":10,"y":1968,"fill":"actual"},{"x":11,"y":1935,"fill":"actual"},{"x":12,"y":2058,"fill":"actual"},{"x":13,"y":2269,"fill":"actual"},{"x":14,"y":2483,"fill":"actual"},{"x":15,"y":2536,"fill":"actual"},{"x":16,"y":2526,"fill":"actual"},{"x":17,"y":2569,"fill":"actual"},{"x":18,"y":2610,"fill":"actual"},{"x":19,"y":3130,"fill":"actual"},{"x":20,"y":2865,"fill":"actual"},{"x":21,"y":2763,"fill":"actual"},{"x":22,"y":2890,"fill":"actual"},{"x":23,"y":2949,"fill":"actual"},{"x":24,"y":2982,"fill":"actual"},{"x":25,"y":3024,"fill":"actual"},{"x":26,"y":3136,"fill":"actual"},{"x":27,"y":3115,"fill":"actual"},{"x":28,"y":3277,"fill":"actual"},{"x":29,"y":3620,"fill":"actual"},{"x":30,"y":3685,"fill":"actual"},{"x":31,"y":3750,"fill":"actual"},{"x":32,"y":3673,"fill":"actual"},{"x":33,"y":3605,"fill":"actual"},{"x":34,"y":3790,"fill":"actual"},{"x":35,"y":3763,"fill":"actual"},{"x":36,"y":3977,"fill":"actual"},{"x":37,"y":4580,"fill":"actual"},{"x":38,"y":4268,"fill":"actual"},{"x":39,"y":4684,"fill":"actual"},{"x":40,"y":4689,"fill":"actual"},{"x":41,"y":4520,"fill":"actual"},{"x":42,"y":4274,"fill":"actual"},{"x":43,"y":4473,"fill":"actual"},{"x":44,"y":4691,"fill":"actual"},{"x":45,"y":4924,"fill":"actual"},{"x":46,"y":4993,"fill":"actual"},{"x":47,"y":5290,"fill":"actual"},{"x":48,"y":5181,"fill":"actual"},{"x":49,"y":5196.7,"fill":"forecast"},{"x":50,"y":5280.6,"fill":"forecast"},{"x":51,"y":5364.5,"fill":"forecast"},{"x":52,"y":5448.4,"fill":"forecast"},{"x":53,"y":5532.3,"fill":"forecast"},{"x":54,"y":5616.2,"fill":"forecast"}],"geoms":["line","point"],"x":"month","y":"mau","code":{"line":"ggplot(nw_fc, aes(month, mau, color = series)) +\n  geom_line() +\n  geom_point()"}}

The forecasted months pick up exactly where the real series stops, continuing the same straight climb, the 5196.7 to 5616.2 you just printed. There is no bend where the actual data ends and the forecast begins, because the forecast is just the same line, mau = 1085.6 + 83.9 * trend(), evaluated a little further along the same trend() axis the whole line was fit on.

=== step === concept
## The two assumptions ordinary regression borrows, and how a time series breaks them

Ordinary regression, the kind TSLM() runs, was built for cross-sectional data: rows with no natural order, like a survey of unrelated customers. To trust everything report() and forecast() just handed you, in particular the standard errors, p-values and interval widths behind them, two assumptions about the errors have to hold.

1. Independence. Each residual is unrelated to the ones next to it. Knowing one month's miss should tell you nothing about the next month's miss.
2. Constant variance. The residuals spread out by roughly the same amount everywhere along the series, not tighter at one end and wider at the other.

Northwind's own residuals let you check both, directly.

```r
# Pull the residuals, then check the two assumptions against them
resid_vals <- residuals(fit)$.resid

lag1_cor <- cor(resid_vals[-length(resid_vals)], resid_vals[-1])
round(lag1_cor, 3)
#> [1] 0.426

dw_stat <- sum(diff(resid_vals)^2) / sum(resid_vals^2)
round(dw_stat, 3)
#> [1] 1.144

sd_first_half <- sd(resid_vals[1:24])
sd_second_half <- sd(resid_vals[25:48])
round(c(sd_first_half, sd_second_half), 1)
#> [1] 130.5 195.1
```

lag1_cor correlates every residual with the one right before it: 0.426. If independence held, that number would sit close to 0; instead each month's miss carries almost half of the previous month's miss forward into it, one residual predicting the next.

dw_stat is a Durbin-Watson-style statistic: the summed squared gap between neighbouring residuals, divided by the summed squared residuals. Independent residuals give a value near 2; Northwind's comes out at 1.144, well under it, the same story the lag-1 correlation just told from a different angle.

sd_first_half and sd_second_half check the second assumption: the residual standard deviation across the first 24 months against the last 24. 130.5 against 195.1, about 50% wider in the second half. The spread is not constant either.

None of this undoes the fitted line itself. 1085.6 and 83.9 are still the least-squares intercept and slope for this data, the best straight line through these 48 points. What it does undo is the machinery built on top of that line: report()'s R-squared and F-statistic and forecast()'s interval widths were all computed on the assumption of independent, constant-variance errors, and Northwind's residuals contradict both. Read a strong-looking fit on a time series with that in mind, rather than taking its p-values and intervals completely at face value.

=== step === quiz
## Quick check: reading the fit and its limits

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model should be discarded, since its residuals fail two assumptions. ::no
- The R-squared and F-statistic were computed assuming independent errors, an assumption the correlated residuals contradict, while the point forecasts and widening interval you just plotted are still real computed values the low Durbin-Watson-style statistic does not invalidate. ::ok Right. The fitted line, the point forecasts and the interval widths are all real numbers computed from real least-squares algebra. What the correlated, non-constant residuals undermine is how much you should trust the machinery built on top of them, the significance tests and interval widths, not the numbers themselves.
- A high R-squared proves TSLM() is the best possible model for this series. ::no
- A Durbin-Watson-style statistic well under 2 means the forecast itself will be inaccurate. ::no A low statistic says the assumptions behind the reported uncertainty do not hold, not that the point forecast is wrong. It also does not crown TSLM() the best model, and discarding a correctly-fit model outright over one diagnostic throws away a real result. The honest response is to read the significance tests and interval widths with that limitation in mind.

=== step === tryit
## Your turn: fit and forecast

nw still holds Northwind's 48 months of MAU, built earlier on this page.

```r
# nw already holds Northwind's 48 months of MAU, built earlier on this page.
# Fit TSLM(mau ~ trend()) on nw and store it.
# Forecast 3 more months with new_data(nw, 3), then print the point forecasts.
# Two lines. Press Check when you have them.
```
::check {"regex":"(?=[\\s\\S]*TSLM[(])(?=[\\s\\S]*forecast[(])","gate":true,"difficulty":"intermediate","ok":"Right: 5196.7, 5280.6 and 5364.5 for January through March 2026, the same numbers an earlier step printed for the first three forecasted months, because it is the exact same line.","no":"Fit the model first: nw |> model(TSLM(mau ~ trend())). Then forecast it: forecast(new_data(nw, 3)), and print the result."}
::solution
```r
# Fit TSLM(mau ~ trend()) on nw, forecast 3 more months, and print the point forecasts
fit3 <- nw |> model(TSLM(mau ~ trend()))
fit3 |>
  forecast(new_data(nw, 3)) |>
  as.data.frame() |>
  transmute(month, forecast = round(.mean, 1))
#>      month forecast
#> 1 2026 Jan   5196.7
#> 2 2026 Feb   5280.6
#> 3 2026 Mar   5364.5
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 7.1, The linear model](https://otexts.com/fpp3/regression-intro.html) - Hyndman and Athanasopoulos (3rd ed.), the source for TSLM() and ordinary regression on a time series.
- [fable package reference documentation for TSLM()](https://fable.tidyverts.org/reference/TSLM.html)
- [tsibble package reference documentation for new_data()](https://tsibble.tidyverts.org/reference/new-data.html)
- [fabletools package reference documentation for report() and glance()](https://fabletools.tidyverts.org/reference/report.html)
- [fabletools package reference documentation for forecast()](https://fabletools.tidyverts.org/reference/forecast.html)

=== step === complete
## What you can do now

You can now fit TSLM(mau ~ trend()) on a tsibble and read its intercept and slope in the real units of your data: 1085.6 and 83.9 here, about 1,007 more users a year.

You can read the same fit two ways, report()'s full printed summary or glance()'s one tidy row, and you can build future rows with new_data() and read forecast()'s point forecast and widening interval off them.

And you can name the two assumptions ordinary regression borrows, independence and constant variance, and check a fit's own residuals against both, the way Northwind's lag-1 correlation and growing spread just failed them.

The next lesson adds a seasonal pattern to this same trend line with season() and dummy variables.

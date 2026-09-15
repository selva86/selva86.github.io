---
title: "Time Series Regression Lesson 2: Trend and seasonal dummy variables"
catalog_blurb: "Read seasonal coefficients correctly, avoid the dummy trap, and fit trends that bend."
description: "Learn TSLM(y ~ trend() + season()) in R: read seasonal coefficients against a baseline quarter, avoid the dummy trap, and fit a piecewise trend with knots."
keywords: "TSLM trend and season in R, season() function in fable, seasonal dummy variables, dummy variable trap, piecewise linear trend, trend knots in R, TSLM coefficients interpretation, quarterly seasonal regression, extrapolating a linear trend, time series regression in R"
post_type: "LESSON"
curriculum_id: "5.40.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-regression"
course_title: "Time Series Regression"
course_lesson: "2"
course_total: "6"
course_landing: "Time-Series-Regression-Course.html"
course_next: "Fourier-Terms-for-Seasonality.html"
course_prev: "Time-Series-Linear-Models-TSLM.html"
---

=== step === cover
## Trend and seasonal dummy variables

Today let's learn how to put both a rising trend and a repeating yearly pattern into one regression model, using a gym chain's quarterly signups as the running example.

Meridian Fitness is a mid-size gym chain. Every quarter since 2018, it has logged how many new members signed up. Below are all 24 quarters, from 2018 Q1 to 2023 Q4, quarter 1 on the left and quarter 24 on the right.

::widget chart-plotter {"data":[{"x":1,"y":232},{"x":2,"y":224},{"x":3,"y":200},{"x":4,"y":242},{"x":5,"y":297},{"x":6,"y":289},{"x":7,"y":270},{"x":8,"y":299},{"x":9,"y":362},{"x":10,"y":338},{"x":11,"y":329},{"x":12,"y":354},{"x":13,"y":426},{"x":14,"y":379},{"x":15,"y":365},{"x":16,"y":391},{"x":17,"y":432},{"x":18,"y":415},{"x":19,"y":384},{"x":20,"y":401},{"x":21,"y":462},{"x":22,"y":445},{"x":23,"y":413},{"x":24,"y":429}],"geoms":["point","line"],"x":"quarter","y":"signups"}

Look at the shape. Signups climb year over year, but every Q1 sits higher than the quarter before it, and every Q3 dips lower than the quarter before that.

=== step === widget
## Trend alone: what TSLM(y ~ trend()) fits

`TSLM()` fits an ordinary linear regression, except its predictors are built from time itself instead of from other measured columns. The simplest one is `trend()`, a straight count of each quarter's position in the data: 1 for the first quarter, 2 for the second, and so on up to 24.

Fit `signups` on `trend()` alone, and read the coefficients `report()` returns.

```r
# Build the 24-quarter tsibble and fit a trend-only regression
library(fable)
library(fabletools)
library(tsibble)
library(dplyr)

meridian <- tsibble(
  quarter = yearquarter("2018 Q1") + 0:23,
  signups = c(232, 224, 200, 242, 297, 289, 270, 299, 362, 338, 329, 354,
              426, 379, 365, 391, 432, 415, 384, 401, 462, 445, 413, 429),
  index = quarter
)

fit_trend <- meridian |> model(TSLM(signups ~ trend()))
report(fit_trend)
#> Series: signups 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -53.9099 -22.2512  -0.5651  14.1941  71.9075 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 223.8551    12.6429   17.71 1.67e-14 ***
#> trend()      10.0183     0.8848   11.32 1.20e-10 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 30.01 on 22 degrees of freedom
#> Multiple R-squared: 0.8535,	Adjusted R-squared: 0.8469
#> F-statistic: 128.2 on 1 and 22 DF, p-value: 1.2037e-10
```

Two coefficients, and they are read exactly like any other regression. The intercept, 223.86, is where the line sits at quarter 0, just before the data starts. The slope on `trend()`, 10.02, says signups grow by about 10 members a quarter, on average, across all 24 quarters.

Drag the line below over the same 24 points and watch the residual squares shrink as you approach that same intercept and slope. TSLM() found the line that makes the sum of those squares as small as possible; this widget lets you find it by hand.

::widget ols-fit {"points":[{"x":1,"y":232},{"x":2,"y":224},{"x":3,"y":200},{"x":4,"y":242},{"x":5,"y":297},{"x":6,"y":289},{"x":7,"y":270},{"x":8,"y":299},{"x":9,"y":362},{"x":10,"y":338},{"x":11,"y":329},{"x":12,"y":354},{"x":13,"y":426},{"x":14,"y":379},{"x":15,"y":365},{"x":16,"y":391},{"x":17,"y":432},{"x":18,"y":415},{"x":19,"y":384},{"x":20,"y":401},{"x":21,"y":462},{"x":22,"y":445},{"x":23,"y":413},{"x":24,"y":429}]}

Settle near intercept 223.86 and slope 10.02 and the squares bottom out, at the same least-squares line `report()` gave you. Now look at which points sit far from that line even at the best fit: 2018 Q1 lands almost exactly on it, but 2019 Q1 through 2023 Q1 all sit clearly above it, while every single Q3, all six of them, sits below it. A single straight line cannot bend to follow that yearly wiggle. It can only run through the middle of it.

=== step === concept
## Adding season(): how the quarterly dummies join the trend

A straight line cannot bend, but it can be lifted or lowered separately for each quarter. That is what `season()` does: it builds a set of 0/1 predictor columns, called dummy variables, one for every quarter position in the year except the first, and adds them to the trend.

For a 4-quarter year, that is 3 new columns, not 4. Each new column is 1 in its own quarter position and 0 everywhere else: one column is 1 only in the second quarter of each year, another only in the third, another only in the fourth. The first quarter gets no column of its own. It becomes the reference that every other quarter is measured against.

Fit `signups` on `trend() + season()` and read the coefficient table.

```r
# Add season() to the formula: a dummy column for every quarter position except the first
fit_full <- meridian |> model(TSLM(signups ~ trend() + season()))
report(fit_full)
#> Series: signups 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -31.786 -12.035   2.083  11.568  36.557 
#> 
#> Coefficients:
#>               Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)   253.3143    10.1361  24.991 5.36e-16 ***
#> trend()        10.4714     0.5779  18.121 1.90e-13 ***
#> season()year2 -30.6381    11.1804  -2.740 0.013005 *  
#> season()year3 -62.6095    11.2251  -5.578 2.23e-05 ***
#> season()year4 -47.2476    11.2993  -4.181 0.000506 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 19.34 on 19 degrees of freedom
#> Multiple R-squared: 0.9475,	Adjusted R-squared: 0.9364
#> F-statistic: 85.64 on 4 and 19 DF, p-value: 7.0048e-12
```

Five coefficients now instead of two. `season()` named its three new columns `season()year2`, `season()year3` and `season()year4`, one for each position after the first in the yearly cycle: `year2` is the second quarter of the year, Q2, `year3` is Q3, and `year4` is Q4. Q1 has no column at all, which is exactly what makes it the reference quarter, sometimes called the baseline quarter.

The fit improved too. Adjusted R-squared rose from 0.85 with trend alone to 0.94 with trend and season together, and the residual standard error dropped from 30.01 to 19.34. `season()` is doing real work, not just adding noise to the formula.

=== step === concept
## Reading a seasonal coefficient against the baseline quarter

Take `season()year3`, -62.61. What does that number actually mean?

It is the average difference between a Q3 quarter and a Q1 quarter sitting at the same point on the trend line, not a difference from the series average and not a difference from last year's Q3. Holding the trend fixed, a Q3 quarter comes in 62.61 signups below where a Q1 quarter would land.

Check that by hand. 2021 Q3 is the 15th quarter in the data. Add the intercept, 15 times the trend slope, and the `season()year3` coefficient, and it should match `fitted()` for that row exactly.

```r
# Add the trend and one season() coefficient back together by hand, for 2021 Q3
co <- coef(fit_full)
b0      <- co$estimate[co$term == "(Intercept)"]
b_trend <- co$estimate[co$term == "trend()"]
b_q3    <- co$estimate[co$term == "season()year3"]

t <- 15   # 2021 Q3 is the 15th quarter in the data
hand_fit <- b0 + b_trend * t + b_q3
round(hand_fit, 2)
#> [1] 347.78

round(augment(fit_full)$.fitted[15], 2)
#> [1] 347.78
```

They match. The same reading applies to the other two quarters: `season()year2`, -30.64, says a Q2 quarter sits 30.64 below the Q1 it is measured against, and `season()year4`, -47.25, says a Q4 quarter sits 47.25 below. All three are negative here, which fits Meridian's pattern: Q1 is the New Year's resolution quarter, its highest, so every other quarter comes in below it.

Q1 itself gets no coefficient in that table. That is not an oversight, it is the reference quarter. Its own level is fully carried by the intercept and the trend, and every other quarter's coefficient is measured as a difference from wherever Q1 would sit.

=== step === widget
## Seeing the fitted trend and season curve against the data

See how the combined fit compares to the real data, not just one quarter's number.

::widget chart-plotter {"data":[{"x":1,"y":232,"fill":"actual"},{"x":2,"y":224,"fill":"actual"},{"x":3,"y":200,"fill":"actual"},{"x":4,"y":242,"fill":"actual"},{"x":5,"y":297,"fill":"actual"},{"x":6,"y":289,"fill":"actual"},{"x":7,"y":270,"fill":"actual"},{"x":8,"y":299,"fill":"actual"},{"x":9,"y":362,"fill":"actual"},{"x":10,"y":338,"fill":"actual"},{"x":11,"y":329,"fill":"actual"},{"x":12,"y":354,"fill":"actual"},{"x":13,"y":426,"fill":"actual"},{"x":14,"y":379,"fill":"actual"},{"x":15,"y":365,"fill":"actual"},{"x":16,"y":391,"fill":"actual"},{"x":17,"y":432,"fill":"actual"},{"x":18,"y":415,"fill":"actual"},{"x":19,"y":384,"fill":"actual"},{"x":20,"y":401,"fill":"actual"},{"x":21,"y":462,"fill":"actual"},{"x":22,"y":445,"fill":"actual"},{"x":23,"y":413,"fill":"actual"},{"x":24,"y":429,"fill":"actual"},{"x":1,"y":263.8,"fill":"fitted"},{"x":2,"y":243.6,"fill":"fitted"},{"x":3,"y":222.1,"fill":"fitted"},{"x":4,"y":248.0,"fill":"fitted"},{"x":5,"y":305.7,"fill":"fitted"},{"x":6,"y":285.5,"fill":"fitted"},{"x":7,"y":264.0,"fill":"fitted"},{"x":8,"y":289.8,"fill":"fitted"},{"x":9,"y":347.6,"fill":"fitted"},{"x":10,"y":327.4,"fill":"fitted"},{"x":11,"y":305.9,"fill":"fitted"},{"x":12,"y":331.7,"fill":"fitted"},{"x":13,"y":389.4,"fill":"fitted"},{"x":14,"y":369.3,"fill":"fitted"},{"x":15,"y":347.8,"fill":"fitted"},{"x":16,"y":373.6,"fill":"fitted"},{"x":17,"y":431.3,"fill":"fitted"},{"x":18,"y":411.2,"fill":"fitted"},{"x":19,"y":389.7,"fill":"fitted"},{"x":20,"y":415.5,"fill":"fitted"},{"x":21,"y":473.2,"fill":"fitted"},{"x":22,"y":453.0,"fill":"fitted"},{"x":23,"y":431.5,"fill":"fitted"},{"x":24,"y":457.4,"fill":"fitted"}],"geoms":["point","line"],"x":"quarter","y":"signups","code":{"line":"ggplot(meridian_long, aes(quarter, signups, color = series)) +\n  geom_line() +\n  geom_point()"}}

Unlike the trend-only model's straight line, this fitted line is not straight. It rises overall, the same climb `trend()` alone captured, but it also peaks every Q1 and dips every Q3, the same saw-tooth shape as the real data. Read each model's Pearson correlation with the actual signups and the improvement is right there in the number.

```r
# Compare how closely each model's fitted line tracks the real data
cor(augment(fit_trend)$.fitted, augment(fit_trend)$signups)
#> [1] 0.9238644

cor(augment(fit_full)$.fitted, augment(fit_full)$signups)
#> [1] 0.973371
```

Trend alone tracks the real data at r = 0.92. Trend plus season tracks it at r = 0.97. That gap is exactly the seasonal wiggle a straight line can never follow, no matter how you tilt it.

=== step === quiz
## Quick check: reading a seasonal coefficient

Suppose you look up a quarter on Meridian's trend line, the intercept plus `trend()` times the quarter index, and it works out to 400. That quarter is a Q4, and `season()year4` is -47.25.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 447.25, the trend value plus the size of the coefficient, ignoring its sign. ::no
- 47.25 fewer signups than the overall average across all 24 quarters. ::no
- 352.75, the trend value plus the Q4 coefficient. ::ok Right. A season() coefficient adds straight onto the trend value for that quarter's position, and season()year4 = -47.25 says a Q4 quarter sits, on average, 47.25 below where a Q1 quarter at the same trend value would land.
- About -47 signups, since that is what season()year4 equals. ::no A season() coefficient is never a raw signup count, and it is never a gap from the overall average. It only ever measures the gap between that quarter's position and Q1, the reference quarter, at the same point on the trend line. Add it to the trend value, keep its sign, and you get the quarter's fitted signups: 400 - 47.25 = 352.75.

=== step === concept
## The dummy trap: why every quarter cannot get its own dummy

`season()` builds three dummy columns for four quarters, not four. Building all four yourself, alongside an intercept, breaks the model. Here is why, and what it looks like when it happens.

Build all four quarter indicators by hand: one column that is 1 in every Q1 and 0 elsewhere, and the same for Q2, Q3 and Q4. Then fit a plain `lm()` with the trend, all four dummies, and an intercept, the way it might look natural to write before you know better.

```r
# Build all four quarter dummies by hand, then fit lm() with an intercept and all four
qoy <- rep(1:4, times = 6)
Q1 <- as.numeric(qoy == 1)
Q2 <- as.numeric(qoy == 2)
Q3 <- as.numeric(qoy == 3)
Q4 <- as.numeric(qoy == 4)
trend_num <- 1:24

fit_singular <- lm(meridian$signups ~ trend_num + Q1 + Q2 + Q3 + Q4)
summary(fit_singular)
#> 
#> Call:
#> lm(formula = meridian$signups ~ trend_num + Q1 + Q2 + Q3 + Q4)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -31.786 -12.035   2.083  11.568  36.557 
#> 
#> Coefficients: (1 not defined because of singularities)
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 206.0667    11.3042  18.229 1.71e-13 ***
#> trend_num    10.4714     0.5779  18.121 1.90e-13 ***
#> Q1           47.2476    11.2993   4.181 0.000506 ***
#> Q2           16.6095    11.2251   1.480 0.155351    
#> Q3          -15.3619    11.1804  -1.374 0.185436    
#> Q4                NA         NA      NA       NA    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 19.34 on 19 degrees of freedom
#> Multiple R-squared:  0.9475,	Adjusted R-squared:  0.9364 
#> F-statistic: 85.64 on 4 and 19 DF,  p-value: 7.005e-12
```

Read the top of the coefficients table first: `(1 not defined because of singularities)`. Then look at the bottom row: `Q4` comes back as `NA` on every column. R did not crash. It fit what it could and told you, plainly, that one coefficient cannot be estimated.

Here is why. Every row of the data belongs to exactly one quarter, so `Q1 + Q2 + Q3 + Q4` adds up to 1 on every single row, always. But the intercept column is also a column of 1s on every row, by definition. Two columns that are identical, or that can be built exactly from the others, cannot both have their own separate effect estimated. That is called perfect collinearity, and when it happens, `lm()` picks one of the tied columns, here `Q4`, and drops it, folding whatever it would have measured into the intercept instead.

This is the dummy trap: an intercept plus a complete set of dummies for every category, with none held back as the reference. `season()` never falls into it, because it only ever builds K-1 dummies for a K-period cycle, three for four quarters here, and leaves the first category to be carried by the intercept.

Fix it either of two ways: drop the intercept, so every quarter gets its own separate coefficient instead of a difference from a reference, or go back to `season()`'s own K-1 coding.

```r
# Refit without the intercept: now every quarter gets its own coefficient
fit_no_intercept <- lm(meridian$signups ~ 0 + trend_num + Q1 + Q2 + Q3 + Q4)
summary(fit_no_intercept)
#> 
#> Call:
#> lm(formula = meridian$signups ~ 0 + trend_num + Q1 + Q2 + Q3 + 
#>     Q4)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -31.786 -12.035   2.083  11.568  36.557 
#> 
#> Coefficients:
#>           Estimate Std. Error t value Pr(>|t|)    
#> trend_num  10.4714     0.5779   18.12 1.90e-13 ***
#> Q1        253.3143    10.1361   24.99 5.36e-16 ***
#> Q2        222.6762    10.5081   21.19 1.11e-14 ***
#> Q3        190.7048    10.8981   17.50 3.56e-13 ***
#> Q4        206.0667    11.3042   18.23 1.71e-13 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 19.34 on 19 degrees of freedom
#> Multiple R-squared:  0.9977,	Adjusted R-squared:  0.9971 
#> F-statistic:  1632 on 5 and 19 DF,  p-value: < 2.2e-16
```

Every coefficient comes back now. And the numbers tie straight back to `fit_full`: `Q1`, 253.31, matches the intercept from the `trend() + season()` fit. `Q2`, 222.68, is 253.31 minus 30.64, the `season()year2` coefficient. `Q3` and `Q4` match the same way. Two different codings, dropping the intercept or dropping one dummy, describe exactly the same fitted line.

=== step === concept
## Piecewise linear trends with knots

A single straight `trend()` cannot bend. But Meridian's growth genuinely changed pace: a rival gym opened three blocks away in 2021 Q1, and signups kept climbing after that, just more slowly.

`trend(knots = ...)` lets the slope change at an exact quarter while keeping the line continuous there, no jump, just a change in direction. Pass it the quarter where the slope should bend.

```r
# Fit a piecewise trend that is allowed to change slope at 2021 Q1
fit_knot <- meridian |> model(TSLM(signups ~ trend(knots = yearquarter("2021 Q1")) + season()))
report(fit_knot)
#> Series: signups 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -13.2297  -3.9163   0.9275   3.9400   9.1171 
#> 
#> Coefficients:
#>                                               Estimate Std. Error t value
#> (Intercept)                                   223.6632     4.0788  54.836
#> trend(knots = yearquarter("2021 Q1"))trend     14.8804     0.3986  37.331
#> trend(knots = yearquarter("2021 Q1"))trend_13  -9.4237     0.7492 -12.578
#> season()year2                                 -30.3352     3.6715  -8.262
#> season()year3                                 -62.0037     3.6864 -16.819
#> season()year4                                 -46.3389     3.7112 -12.486
#>                                               Pr(>|t|)    
#> (Intercept)                                    < 2e-16 ***
#> trend(knots = yearquarter("2021 Q1"))trend     < 2e-16 ***
#> trend(knots = yearquarter("2021 Q1"))trend_13 2.36e-10 ***
#> season()year2                                 1.54e-07 ***
#> season()year3                                 1.87e-12 ***
#> season()year4                                 2.66e-10 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 6.351 on 18 degrees of freedom
#> Multiple R-squared: 0.9946,	Adjusted R-squared: 0.9931
#> F-statistic:   667 on 5 and 18 DF, p-value: < 2.22e-16
```

Two trend rows now instead of one. `trend(...)trend`, 14.88, is the slope before the knot: about 14.88 signups a quarter through 2021 Q1. `trend(...)trend_13` is not a second slope on its own, it is the CHANGE in slope once the knot passes, -9.42. Add the two together to get the slope that actually applies from 2021 Q1 onward.

```r
# Read the two trend coefficients: the slope before the knot, and how much it changes after
trend_terms <- coef(fit_knot) |> filter(grepl("trend", term)) |> transmute(term, estimate = round(estimate, 2))
print(as.data.frame(trend_terms), row.names = FALSE)

pre_knot_slope  <- trend_terms$estimate[1]
slope_change    <- trend_terms$estimate[2]
post_knot_slope <- pre_knot_slope + slope_change
round(post_knot_slope, 2)
#>                                           term estimate
#>     trend(knots = yearquarter("2021 Q1"))trend    14.88
#>  trend(knots = yearquarter("2021 Q1"))trend_13    -9.42
#> [1] 5.46
```

So growth ran at about 14.88 signups a quarter before the rival gym opened, and about 5.46 a quarter after, a real slowdown, not just noise.

See the bend for yourself. Plot this piecewise fit next to the single straight trend, over all 24 quarters.

```r
# Compare the single straight trend with the piecewise trend, over all 24 quarters
library(ggplot2)

comparison <- data.frame(
  t = rep(1:24, 2),
  fitted = c(augment(fit_trend)$.fitted, augment(fit_knot)$.fitted),
  model = rep(c("single trend", "piecewise trend"), each = 24)
)

ggplot(comparison, aes(t, fitted, color = model)) +
  geom_line(linewidth = 1) +
  labs(x = "quarter", y = "fitted signups")
```

The single trend keeps climbing at the same steady rate for all 24 quarters. The piecewise trend follows it closely through 2021 Q1, then visibly flattens, bending toward the slower rate Meridian has actually kept ever since.

=== step === concept
## When a straight trend is a dangerous extrapolation

Every trend line fit so far only describes the 24 quarters it was trained on. Push either one past that window and see what each one assumes about the future.

Forecast 20 quarters past the data, five more years, with both the single straight trend and the piecewise trend, and compare what each one says about the same future quarter, 2028 Q4.

```r
# Forecast 20 quarters (5 years) past the data with each model, and compare the last one
future <- new_data(meridian, 20)

fc_trend_only <- fit_trend |> forecast(new_data = future)
fc_piecewise  <- fit_knot  |> forecast(new_data = future)

print(as.data.frame(fc_trend_only |> as_tibble() |> slice_tail(n = 1) |> transmute(quarter = as.character(quarter), forecast = round(.mean, 1))), row.names = FALSE)
#>  quarter forecast
#>  2028 Q4    664.7

print(as.data.frame(fc_piecewise |> as_tibble() |> slice_tail(n = 1) |> transmute(quarter = as.character(quarter), forecast = round(.mean, 1))), row.names = FALSE)
#>  quarter forecast
#>  2028 Q4    539.9
```

The single trend says 664.7 signups in 2028 Q4. The piecewise trend, carrying the slower post-2021 rate forward instead of the faster 2018-2020 rate, says 539.9, about 125 fewer. Same historical data up to 2023 Q4, two very different answers, because the two models disagree about which rate of growth is the real one to extend.

Here is the general point underneath both numbers. A fitted straight line only describes the rate of change actually observed inside its training window. Extending it five years past that window assumes that rate holds forever: never slows, never saturates as the local market fills up, never reverses. Real processes eventually do one of those three. A gym chain cannot add 10 net new members a quarter, every quarter, forever, in a town of finite size. The further you forecast past your data, the more that assumption is doing the work, and the less you should trust the number it hands back.

=== step === quiz
## Quick check: the dummy trap and extrapolation

A colleague fits `lm(signups ~ trend + Q1 + Q2 + Q3 + Q4)` on quarterly data, keeping the intercept in the formula, and R prints `Coefficients: (1 not defined because of singularities)` with `Q4` coming back as `NA`.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Some rows have a missing signups value, so R cannot estimate the last dummy. ::no
- Q1, Q2, Q3 and Q4 always sum to 1 for every row, exactly like the intercept column, so the four dummies plus the intercept are perfectly collinear and R drops one. ::ok Exactly. Every row belongs to exactly one quarter, so Q1+Q2+Q3+Q4 is a column of 1s, identical to the intercept column. lm() cannot separate the last dummy's effect from the intercept, so it drops one, here Q4, and reports it as NA. Dropping the intercept, or dropping to season()'s own K-1 coding, fixes it.
- One of the four dummy columns was accidentally stored as text instead of a number. ::no
- trend is measured on a different numeric scale than the dummies, so R cannot compare their coefficients. ::no Missing data and a scale mismatch would both throw different errors, and a text column would trip up lm() long before it got to singularities. What is actually happening is perfect collinearity: the four dummies always sum to 1, exactly duplicating the intercept column, so one coefficient cannot be separated from the rest and comes back NA.

=== step === tryit
## Your turn: fit a knot and forecast past the data

`meridian` still holds all 24 quarters. The code below refits the `trend() + season()` model. Add a knot at 2021 Q1 to its trend, so the slope is allowed to change where Meridian's growth actually slowed, then forecast one year past the data, 2024 Q4.

```r
# Add a knot at 2021 Q1 to the trend, then forecast one year ahead (2024 Q4)
fit_piecewise <- meridian |> model(TSLM(signups ~ ____ + season()))

future_year <- new_data(meridian, 4)
print(as.data.frame(fit_piecewise |> forecast(new_data = future_year) |> as_tibble() |> slice_tail(n = 1) |> transmute(quarter = as.character(quarter), forecast = round(.mean, 1))), row.names = FALSE)
```
::check {"regex": "(?=[\\s\\S]*trend[(]knots)(?=[\\s\\S]*new_data[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: 2024 Q4 lands near 452.6, close to the slower rate Meridian has kept since the rival gym opened, not the faster rate from 2018 to 2020.", "no": "Replace ____ with trend(knots = yearquarter(\"2021 Q1\")), keeping + season() in the formula, and keep the new_data() call so the model forecasts a real future quarter."}
::solution
```r
# Add a knot at 2021 Q1 to the trend, then forecast one year ahead (2024 Q4)
fit_piecewise <- meridian |> model(TSLM(signups ~ trend(knots = yearquarter("2021 Q1")) + season()))

future_year <- new_data(meridian, 4)
print(as.data.frame(fit_piecewise |> forecast(new_data = future_year) |> as_tibble() |> slice_tail(n = 1) |> transmute(quarter = as.character(quarter), forecast = round(.mean, 1))), row.names = FALSE)
#>  quarter forecast
#>  2024 Q4    452.6
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 7.4, Some useful predictors](https://otexts.com/fpp3/useful-predictors.html) - Hyndman and Athanasopoulos (3rd ed.), on trend and seasonal dummy variables inside a regression model.
- [Forecasting: Principles and Practice, section 7.7, Nonlinear regression](https://otexts.com/fpp3/nonlinear-regression.html) - Hyndman and Athanasopoulos (3rd ed.), on piecewise linear trends and choosing knots.
- [fable package reference documentation for TSLM()](https://fable.tidyverts.org/reference/TSLM.html)
- Wooldridge, J.M., *Introductory Econometrics: A Modern Approach*, on the dummy variable trap and why a regression drops one reference category.

=== step === complete
## What you can do now

You can now fit `TSLM(y ~ trend() + season())` and read every coefficient it returns: the trend slope, and each seasonal coefficient as a difference from the baseline quarter that `season()` leaves out. You know why `season()` builds K-1 dummies instead of K, and what breaks, a singular design matrix and an NA coefficient, when a model gets an intercept and a complete set of dummies instead. You can fit a piecewise trend with `trend(knots = ...)` and read its two coefficients as a slope and a change in slope. And you know to treat any straight trend's forecast with caution once it reaches past the data it was trained on.

Carry `trend()`, `season()` and knots forward into models with more predictors than these four, and each new one will read exactly the same way: add its coefficient onto the fitted line and ask what quarter, month or day it moves the answer for.

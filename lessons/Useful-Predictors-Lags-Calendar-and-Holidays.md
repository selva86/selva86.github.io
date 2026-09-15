---
title: "Time Series Regression Lesson 4: Lagged predictors, calendar effects and holiday dummies"
catalog_blurb: "Add lagged spend and calendar effects, then forecast ex-ante, ex-post and by scenario."
description: "Build a lagged predictor with lag(), add calendar, holiday and intervention dummies to a regression, and tell an ex-ante forecast from an ex-post one."
keywords: "lagged predictor in R, lag() dplyr, distributed lag model, calendar effects time series, trading day effect, holiday dummy variable, intervention dummy variable, TSLM regression R, ex-ante vs ex-post forecast, scenario forecasting R"
post_type: "LESSON"
curriculum_id: "5.40.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-regression"
course_title: "Time Series Regression"
course_lesson: "4"
course_total: "6"
course_landing: "Time-Series-Regression-Course.html"
course_next: "Selecting-Predictors-with-Cross-Validation.html"
course_prev: "Fourier-Terms-for-Seasonality.html"
---

=== step === cover
## Lagged predictors, calendar effects and holiday dummies

Today let's add three more kinds of predictors to a regression: a value carried over from an earlier month, a fact taken straight off the calendar, and a flag for a month that only happened once.

Northgate Appliances is a home appliance retailer. Its owner keeps two numbers every month: total sales, and how much the store spent on ads that month. Below are all 36 months, January 2021 through December 2023.

::widget chart-plotter {"data":[{"x":1,"y":30133},{"x":2,"y":51377},{"x":3,"y":52456},{"x":4,"y":44664},{"x":5,"y":48270},{"x":6,"y":51342},{"x":7,"y":49915},{"x":8,"y":49869},{"x":9,"y":51559},{"x":10,"y":46080},{"x":11,"y":68721},{"x":12,"y":53617},{"x":13,"y":49328},{"x":14,"y":53006},{"x":15,"y":15324},{"x":16,"y":33811},{"x":17,"y":53711},{"x":18,"y":42605},{"x":19,"y":46601},{"x":20,"y":54494},{"x":21,"y":47915},{"x":22,"y":52072},{"x":23,"y":63954},{"x":24,"y":46429},{"x":25,"y":52273},{"x":26,"y":50288},{"x":27,"y":59745},{"x":28,"y":51684},{"x":29,"y":47239},{"x":30,"y":54523},{"x":31,"y":42159},{"x":32,"y":56246},{"x":33,"y":50285},{"x":34,"y":52258},{"x":35,"y":70435},{"x":36,"y":53553}],"geoms":["point","line"],"x":"month","y":"sales"}

Sales climb slowly overall, but three months tower over their neighbors, $68,721, $63,954 and $70,435, and every one of them is a November. And one month sits far below everything else, $15,324, deep in the spring of 2022. The slow climb alone cannot explain either pattern.

=== step === concept
## What a lagged predictor is, and building it with lag()

A lagged predictor carries a predictor's value from an earlier period onto the current row. In R, `lag(x, 1)` shifts a column `x` down by one position, so the value that used to sit on the row above now sits on the current row. Build that for Northgate's ad spend, then look at the first few months.

```r
# Build Northgate's 36 months of ad spend and sales, then lag ad spend by one month
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(305)
month <- yearmonth("2021 Jan") + 0:35
t <- seq_along(month)

ad_spend <- round(5000 + rnorm(36, 0, 900))
ad_spend[15] <- 600  # March 2022: the store closed for a renovation and cut its ad spend

ad_spend_lag1 <- lag(ad_spend, 1)

weekdays_in <- function(the_month) {
  first_day <- as.Date(the_month)
  last_day <- first_day + lubridate::days_in_month(first_day) - 1
  all_days <- seq(first_day, last_day, by = "day")
  sum(!weekdays(all_days) %in% c("Saturday", "Sunday"))
}

# sales already carries a few calendar and business effects this lesson uncovers later
noise <- rnorm(36, 0, 1400)
sales <- round(
  8000 + 180 * t + 3.8 * ad_spend_lag1 +
    950 * sapply(month, weekdays_in) +
    14000 * as.integer(lubridate::month(as.Date(month)) == 11) -
    32000 * as.integer(t == 15) +
    noise
)
sales[1] <- round(8000 + 180 * t[1] + 950 * weekdays_in(month[1]) + noise[1])

shop <- tsibble(month = month, ad_spend = ad_spend, ad_spend_lag1 = ad_spend_lag1, sales = sales, index = month)

shop |> as_tibble() |> select(month, ad_spend, ad_spend_lag1) |> head(4)
#> # A tibble: 4 x 3
#>      month ad_spend ad_spend_lag1
#>      <mth>    <dbl>         <dbl>
#> 1 2021 Jan     5759            NA
#> 2 2021 Feb     4901          5759
#> 3 2021 Mar     4432          4901
#> 4 2021 Apr     4815          4432
```

Read February 2021's row: `ad_spend` is $4,901, February's own spend, while `ad_spend_lag1` is $5,759, January's spend carried forward one month. Every row's `ad_spend_lag1` is simply the row above's `ad_spend`. January 2021's `ad_spend_lag1` is `NA`, because no month sits before it in the data.

=== step === concept
## Finding the right lag by comparing correlations

Before fitting anything, check how strongly sales correlates with ad spend at a few candidate lags: the same month (lag 0), one month back (lag 1), and two months back (lag 2). Whichever lag correlates the most is the one worth building a predictor from.

```r
# Compare sales' correlation with ad spend at lag 0, lag 1 and lag 2
r <- c(
  lag0 = cor(shop$sales, shop$ad_spend, use = "complete.obs"),
  lag1 = cor(shop$sales, lag(shop$ad_spend, 1), use = "complete.obs"),
  lag2 = cor(shop$sales, lag(shop$ad_spend, 2), use = "complete.obs")
)
round(r, 4)
#>   lag0   lag1   lag2 
#> 0.1862 0.6448 -0.2030
```

Lag 1 is clearly the strongest, 0.6448 against 0.1862 for the same month and -0.2030 for two months back. A dollar of ad spend shows up in sales about a month later, not the same month and not two months on.

That gap is not just ad spend being a smooth series that happens to correlate with itself from month to month. Check ad spend against its own lag 1.

```r
# Check whether ad spend is simply smooth from one month to the next
round(cor(shop$ad_spend, lag(shop$ad_spend, 1), use = "complete.obs"), 4)
#> [1] -0.1394
```

That is -0.1394, close to zero. Ad spend is not smooth at all from one month to the next. So the strong 0.6448 at lag 1 is a real one-month delay in how sales respond to spend, not an artifact of ad spend carrying over on its own.

=== step === concept
## Fitting TSLM(sales ~ trend() + ad_spend_lag1) and reading the coefficient

With lag 1 chosen, fit a regression of sales on the trend and the lagged predictor.

```r
# Fit sales on the trend and last month's ad spend
fit_lag <- shop |> model(TSLM(sales ~ trend() + ad_spend_lag1))
report(fit_lag)
#> Series: sales 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -28164.9  -1983.0   -356.3    905.9  15523.1 
#> 
#> Coefficients:
#>                Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)   20163.503   5624.319   3.585  0.00111 ** 
#> trend()         246.129    113.918   2.161  0.03832 *  
#> ad_spend_lag1     5.379      1.011   5.319 7.85e-06 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 6763 on 32 degrees of freedom
#> Multiple R-squared: 0.4901,	Adjusted R-squared: 0.4583
#> F-statistic: 15.38 on 2 and 32 DF, p-value: 2.0858e-05
```

Read `ad_spend_lag1`'s row: 5.379, with p < 0.001. A dollar more ad spend last month lines up with about $5.38 more sales this month, holding the trend fixed. That coefficient is real, not noise. But `Multiple R-squared: 0.4901` says this model explains under half of the variation in sales, so plenty is still unaccounted for.

=== step === widget
## Seeing the lag model's fit against the raw sales

Plot that model's fitted values as a line against the real sales, month by month.

::widget chart-plotter {"data":[{"x":1,"y":30133,"fill":"actual"},{"x":2,"y":51377,"fill":"actual"},{"x":3,"y":52456,"fill":"actual"},{"x":4,"y":44664,"fill":"actual"},{"x":5,"y":48270,"fill":"actual"},{"x":6,"y":51342,"fill":"actual"},{"x":7,"y":49915,"fill":"actual"},{"x":8,"y":49869,"fill":"actual"},{"x":9,"y":51559,"fill":"actual"},{"x":10,"y":46080,"fill":"actual"},{"x":11,"y":68721,"fill":"actual"},{"x":12,"y":53617,"fill":"actual"},{"x":13,"y":49328,"fill":"actual"},{"x":14,"y":53006,"fill":"actual"},{"x":15,"y":15324,"fill":"actual"},{"x":16,"y":33811,"fill":"actual"},{"x":17,"y":53711,"fill":"actual"},{"x":18,"y":42605,"fill":"actual"},{"x":19,"y":46601,"fill":"actual"},{"x":20,"y":54494,"fill":"actual"},{"x":21,"y":47915,"fill":"actual"},{"x":22,"y":52072,"fill":"actual"},{"x":23,"y":63954,"fill":"actual"},{"x":24,"y":46429,"fill":"actual"},{"x":25,"y":52273,"fill":"actual"},{"x":26,"y":50288,"fill":"actual"},{"x":27,"y":59745,"fill":"actual"},{"x":28,"y":51684,"fill":"actual"},{"x":29,"y":47239,"fill":"actual"},{"x":30,"y":54523,"fill":"actual"},{"x":31,"y":42159,"fill":"actual"},{"x":32,"y":56246,"fill":"actual"},{"x":33,"y":50285,"fill":"actual"},{"x":34,"y":52258,"fill":"actual"},{"x":35,"y":70435,"fill":"actual"},{"x":36,"y":53553,"fill":"actual"},{"x":2,"y":51634,"fill":"fitted"},{"x":3,"y":47264,"fill":"fitted"},{"x":4,"y":44988,"fill":"fitted"},{"x":5,"y":47294,"fill":"fitted"},{"x":6,"y":51698,"fill":"fitted"},{"x":7,"y":50675,"fill":"fitted"},{"x":8,"y":51072,"fill":"fitted"},{"x":9,"y":51382,"fill":"fitted"},{"x":10,"y":47540,"fill":"fitted"},{"x":11,"y":53198,"fill":"fitted"},{"x":12,"y":53659,"fill":"fitted"},{"x":13,"y":49021,"fill":"fitted"},{"x":14,"y":56292,"fill":"fitted"},{"x":15,"y":43489,"fill":"fitted"},{"x":16,"y":27329,"fill":"fitted"},{"x":17,"y":57197,"fill":"fitted"},{"x":18,"y":41769,"fill":"fitted"},{"x":19,"y":45044,"fill":"fitted"},{"x":20,"y":56171,"fill":"fitted"},{"x":21,"y":50194,"fill":"fitted"},{"x":22,"y":53270,"fill":"fitted"},{"x":23,"y":50864,"fill":"fitted"},{"x":24,"y":44273,"fill":"fitted"},{"x":25,"y":54379,"fill":"fitted"},{"x":26,"y":50306,"fill":"fitted"},{"x":27,"y":61660,"fill":"fitted"},{"x":28,"y":51912,"fill":"fitted"},{"x":29,"y":43062,"fill":"fitted"},{"x":30,"y":54980,"fill":"fitted"},{"x":31,"y":44210,"fill":"fitted"},{"x":32,"y":58329,"fill":"fitted"},{"x":33,"y":53702,"fill":"fitted"},{"x":34,"y":52850,"fill":"fitted"},{"x":35,"y":60934,"fill":"fitted"},{"x":36,"y":56167,"fill":"fitted"}],"geoms":["line"],"x":"month","y":"sales","code":{"line":"ggplot(monthly, aes(month, sales, color = group)) +\n  geom_line()"}}

The fitted line tracks the slow overall rise well enough, using nothing but the trend and last month's ad spend. But it runs straight through the three November spikes and the March 2022 crash, missing every one of them by thousands of dollars. Nothing in this model yet accounts for holidays or a store closure.

=== step === quiz
## Quick check: why the lag must be known at forecast time

Standing at the end of December 2023, forecast January 2024's sales with the model just fitted. That forecast needs a value for `ad_spend_lag1` on the January 2024 row, and `ad_spend_lag1` for any row is always the month before's `ad_spend`.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The trend term has to be forecast first, so the model cannot produce a January 2024 number until trend() has a value for that month too. ::no
- Yes: that value is December 2023's own ad spend, a month that has already happened and is already on the books, so nothing needs to be forecast to get it. ::ok Right. Because the model uses ad spend lagged by one month, the predictor it needs for a one-step-ahead forecast is always last month's real, already-recorded spend, never a number that still has to be guessed.
- No: the model first needs a forecast of January 2024's own ad spend, since that is the number ad_spend_lag1 plugs into the regression. ::no
- No: a lagged predictor always needs a forecast of its own future value first, no matter how many months back the lag reaches. ::no Both of these mix up two different things. ad_spend_lag1 never needs January 2024's own ad spend, since it carries last month's value forward, not this month's. And a lag of at least one month is exactly what avoids ever needing a forecast of the predictor's own future value for a one-step-ahead forecast: trend() needs no forecast either, since it is just the next integer in a known sequence.

=== step === concept
## Calendar effects: trading days, a fact of the calendar itself

A calendar effect is a shift in a series that comes from the calendar itself, not from trend, season or any business decision. The plainest example is that months do not all have the same number of weekdays. Count Northgate's weekdays per month straight from its dates and add that as a predictor, called trading days.

```r
# Add trading days (the weekday count per real calendar month) and refit
shop <- shop |> mutate(trading_days = sapply(month, weekdays_in))
range(shop$trading_days)
#> [1] 20 23

fit_td <- shop |> model(TSLM(sales ~ trend() + ad_spend_lag1 + trading_days))
report(fit_td)
#> Series: sales 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -27403.2  -1718.5   -623.3    845.0  15639.6 
#> 
#> Coefficients:
#>                Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)   31629.495  27703.524   1.142   0.2623    
#> trend()         247.277    115.440   2.142   0.0402 *  
#> ad_spend_lag1     5.434      1.033   5.262 1.01e-05 ***
#> trading_days   -541.067   1279.348  -0.423   0.6753    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 6852 on 31 degrees of freedom
#> Multiple R-squared: 0.4931,	Adjusted R-squared: 0.444
#> F-statistic: 10.05 on 3 and 31 DF, p-value: 8.793e-05
```

Northgate's months run from 20 to 23 trading days. Yet the `trading_days` row comes back at -541.07 with p = 0.6753, not significant at all, and the wrong sign besides: more trading days should mean more sales, not fewer. Hold on to that puzzle. It gets resolved once two bigger effects join the model.

=== step === concept
## Holiday and intervention dummies: a recurring event versus a one-off

A holiday dummy flags a calendar event that recurs every year. Build one here as `november_dummy`, equal to 1 in every November, since Northgate runs a Black Friday push each year. An intervention dummy flags a single occurrence that will not repeat. Build that as `reno_dummy`, equal to 1 only in March 2022, when the store closed for a renovation.

```r
# Add a recurring holiday dummy (November) and a one-off intervention dummy (the March 2022 closure)
shop <- shop |> mutate(
  november_dummy = as.integer(lubridate::month(as.Date(month)) == 11),
  reno_dummy = as.integer(t == 15)
)

shop |> filter(november_dummy == 1) |> as_tibble() |> select(month, sales)
#> # A tibble: 3 x 2
#>      month sales
#>      <mth> <dbl>
#> 1 2021 Nov 68721
#> 2 2022 Nov 63954
#> 3 2023 Nov 70435

shop |> filter(month %in% yearmonth(c("2022 Mar", "2022 Apr"))) |> as_tibble() |>
  select(month, ad_spend, ad_spend_lag1, sales)
#> # A tibble: 2 x 4
#>      month ad_spend ad_spend_lag1 sales
#>      <mth>    <dbl>         <dbl> <dbl>
#> 1 2022 Mar      600          3650 15324
#> 2 2022 Apr     6107           600 33811
```

The three flagged Novembers all sit far above their neighbors, $68,721, $63,954 and $70,435. The closure shows up twice. First directly: March 2022's sales fall to $15,324, the lowest of all 36 months. Second through the lag: the closure also cut March's ad spend to $600, so April's `ad_spend_lag1` is $600 too, and April's sales, $33,811, carry that low spend forward one month later.

=== step === concept
## Fitting the full model: why the trading-day effect only now shows up

Refit with the trend, the lag, trading days, the November dummy and the closure dummy all together.

```r
# Fit the full model with the trend, the lag, trading days, the November dummy and the closure dummy
fit_full <- shop |> model(TSLM(sales ~ trend() + ad_spend_lag1 + trading_days + november_dummy + reno_dummy))
report(fit_full)
#> Series: sales 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -2667.9 -1026.2   141.6   756.8  3249.2 
#> 
#> Coefficients:
#>                  Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)     1.492e+04  6.093e+03   2.449   0.0206 *  
#> trend()         1.434e+02  2.497e+01   5.744 3.22e-06 ***
#> ad_spend_lag1   3.832e+00  2.289e-01  16.743  < 2e-16 ***
#> trading_days    6.553e+02  2.843e+02   2.305   0.0285 *  
#> november_dummy  1.428e+04  9.082e+02  15.724 9.90e-16 ***
#> reno_dummy     -3.081e+04  1.569e+03 -19.633  < 2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 1461 on 29 degrees of freedom
#> Multiple R-squared: 0.9784,	Adjusted R-squared: 0.9747
#> F-statistic: 263.3 on 5 and 29 DF, p-value: < 2.22e-16
```

`trading_days` now reads 655.33 with p = 0.0285, the right sign and statistically significant. Every other coefficient reads sensibly too: about $3.83 more sales for every extra dollar of last month's ad spend, about $655 more for each extra trading day, $14,280 more in a November, and $30,810 less in the closure month. `Multiple R-squared` jumps from 0.4901 to 0.9784.

Nothing about trading days itself changed between the two fits. What changed is that the November bump and the closure crash, both far larger than the trading-day effect, were sitting unexplained in the residuals of the earlier model. A small real effect can stay indistinguishable from noise while much larger unmodeled effects remain in the residual, right up until those larger effects are added to the model as their own terms.

=== step === concept
## Ex-ante versus ex-post forecasts

Forecasting January 2024 needs only December 2023's ad spend, and that has already happened. Forecasting February 2024 is a different story: it needs January 2024's ad spend, and January 2024 has not happened yet at the time the forecast is made.

```r
# Forecast January 2024 (needs no assumption), then February 2024 two ways: an assumed spend and the actual spend
dec2023_spend <- shop$ad_spend[36]
dec2023_spend
#> [1] 4183

jan2024 <- new_data(shop, 1) |> mutate(ad_spend_lag1 = dec2023_spend, trading_days = 23, november_dummy = 0, reno_dummy = 0)
fc_jan <- forecast(fit_full, new_data = jan2024)
round(fc_jan$.mean, 2)
#> [1] 51332.33

feb_ante <- new_data(jan2024, 1) |> mutate(ad_spend_lag1 = 4700, trading_days = 21, november_dummy = 0, reno_dummy = 0)
fc_ante <- forecast(fit_full, new_data = feb_ante)
round(fc_ante$.mean, 2)
#> [1] 52146.33

feb_post <- new_data(jan2024, 1) |> mutate(ad_spend_lag1 = 6000, trading_days = 21, november_dummy = 0, reno_dummy = 0)
fc_post <- forecast(fit_full, new_data = feb_post)
round(fc_post$.mean, 2)
#> [1] 57128.12
```

January 2024's forecast, $51,332, needed no assumption at all, since `ad_spend_lag1` for that row is December 2023's real, already-recorded $4,183. February 2024 is where the two kinds of forecast split apart. An **ex-ante forecast** assumes a value for the predictor it does not yet have, here $4,700, roughly Northgate's recent average spend, and gives $52,146. Once January 2024 actually happens and its real spend turns out to be $6,000, an **ex-post forecast** plugs in that real number instead, giving $57,128.

The $4,982 gap between them is the cost of guessing `ad_spend_lag1` wrong, not a fault in the regression. That is exactly why ex-post forecasts are used to judge a model's own accuracy, separately from the accuracy of whatever assumption went into its predictors.

=== step === concept
## Scenario forecasting with assumed predictor paths

Scenario forecasting deliberately tries more than one assumed predictor path, rather than aiming for a single most likely guess. Northgate's marketing team wants to compare keeping January 2024's ad spend flat against pushing it much higher.

```r
# Compare two ad-spend scenarios for February 2024: flat spend versus a bigger push
feb_push <- new_data(jan2024, 1) |> mutate(ad_spend_lag1 = 9000, trading_days = 21, november_dummy = 0, reno_dummy = 0)
fc_push <- forecast(fit_full, new_data = feb_push)
round(fc_push$.mean, 2)
#> [1] 68624.56
```

The flat scenario is the same $4,700 assumption already forecast above, $52,146. The push scenario, spending $9,000 instead, forecasts $68,625, a $16,478 difference. That gap is close to the `ad_spend_lag1` coefficient, 3.832, times the $4,300 difference between the two spending assumptions: 3.832 times 4,300 is 16,477.60, near enough to the $16,478 the two forecasts actually differ by, since the forecast moves in a straight line with `ad_spend_lag1`. The marketing team can weigh that $16,478 gain against the extra $4,300 spent before deciding.

=== step === widget
## Seeing the full model's fit as a report-ready table

Build a table of the four hardest months, the closure and the three Novembers, comparing each month's actual sales against the full model's fitted value.

::widget styled-table {"cols":["month","actual","fitted","residual"],"rows":[["2021 Nov",68721,66803,1918],["2022 Mar",15324,15324,0],["2022 Nov",63954,64758,-804],["2023 Nov",70435,71549,-1114]],"formats":{"actual":"dollar","fitted":"dollar","residual":"dollar"},"title":"Northgate: actual vs fitted sales at the four hardest months","note":"The full model lands within a few hundred dollars of actual sales at every one of these four extreme months."}

Compare that against the lag-only model's fitted line shown earlier, which missed these same four months by thousands of dollars. Adding the calendar, holiday and closure terms did not just raise the overall R-squared, it fixed the fit exactly where the lag-only model was worst.

=== step === quiz
## Quick check: calendar effects, holidays and ex-ante versus ex-post

A colleague fits trend() plus `ad_spend_lag1` alone, exactly like the earlier lag-only model, and finds a trading-day predictor comes back with a coefficient of -541.07 and p = 0.6753. They ask whether to drop trading days from the model for good.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, drop it for good. A predictor that comes back insignificant on its own can never turn significant later, no matter which other terms join the model. Separately, ex-post forecasting is a way to predict the future more accurately than an ex-ante forecast, since it always uses the real predictor value. ::no
- Not necessarily. Refit with the calendar, holiday and intervention terms together first: trading_days only turned significant once the much larger November and closure effects were added as terms instead of sitting unexplained in the residual. And ex-post forecasting is not a way to predict the future more accurately: it evaluates a model's own accuracy separately from the accuracy of its predictor assumptions, by feeding in the predictor's real value once it exists instead of an assumed one. ::ok Right. The full model proved exactly that: the same trading_days term that looked like noise alone came back at 655.33 and p = 0.0285 once the November and closure effects joined the model. And ex-post versus ex-ante is about which predictor value went in, an assumed one or a real one, never about which forecast sees further ahead.
- Yes, drop it for good, since a coefficient with the wrong sign on its own is proof the effect is not real, no matter what else is added to the model later. ::no
- Not necessarily, but ex-post forecasting is a way to predict the future more accurately than an ex-ante forecast, since it plugs in a number that already happened. ::no A coefficient that is not significant, or even has the wrong sign, is not proof an effect is fake: the full model showed the same trading_days term turn positive and significant once the bigger November and closure effects were added instead of sitting in the residual. And ex-post forecasting was never about predicting the future better. Both an ex-ante and an ex-post forecast use the exact same fitted model; they only differ in whether the predictor value fed into it is an assumed guess or a real number, which is why ex-post forecasts judge a model's own accuracy, not its ability to see further ahead.

=== step === tryit
## Your turn: forecast a third ad-spend scenario

jan2024 and fit_full are already built. Build a third scenario, assuming January 2024's ad spend comes in at 7000, and read off the February 2024 point forecast.

```r
# jan2024 (from the ex-ante/ex-post step) and fit_full are already built.
# Build a third scenario: new_data(jan2024, 1), with ad_spend_lag1 set to 7000,
# trading_days 21, november_dummy 0, reno_dummy 0.
# Then forecast(fit_full, new_data = ...) and print round(.mean, 2).
# Press Check when you have it.
```
::check {"regex":"new_data[(][\\s\\S]*7000","gate":true,"difficulty":"intermediate","ok":"Right: the February 2024 point forecast comes out at about $60,960, between the flat scenario's $52,146 and the push scenario's $68,625, exactly where a spend of $7,000 should land between $4,700 and $9,000.","no":"Call new_data(jan2024, 1) to build the next row, set ad_spend_lag1 to 7000 (trading_days 21, november_dummy and reno_dummy both 0), then pass it to forecast(fit_full, new_data = ...) and print round(.mean, 2)."}
::solution
```r
# Build a third scenario: assume January 2024's ad spend comes in at 7000, then forecast February 2024
feb_7000 <- new_data(jan2024, 1) |> mutate(ad_spend_lag1 = 7000, trading_days = 21, november_dummy = 0, reno_dummy = 0)
fc_7000 <- forecast(fit_full, new_data = feb_7000)
round(fc_7000$.mean, 2)
#> [1] 60960.26
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 7.4, Some useful predictors](https://otexts.com/fpp3/useful-predictors.html) - Hyndman and Athanasopoulos (3rd ed.), the source for trading days, holiday and intervention dummies, and lagged predictors.
- [Forecasting: Principles and Practice, section 7.6, Forecasting with regression](https://otexts.com/fpp3/forecasting-regression.html) - Hyndman and Athanasopoulos (3rd ed.), the source for ex-ante versus ex-post forecasts and scenario-based forecasting.
- [fabletools package reference documentation for new_data()](https://fabletools.tidyverts.org/reference/new_data.html)
- [fable package reference documentation for TSLM()](https://fable.tidyverts.org/reference/TSLM.html)
- Wooldridge, J.M., Introductory Econometrics: A Modern Approach, on distributed lag models and why a lag must already be observed before it can be used as a regressor.

=== step === complete
## What you can do now

You can now build a lagged predictor with `lag()` and pick its lag by comparing correlations, the way `ad_spend_lag1` beat both the same-month and two-month versions here. You know why that lag has to already be on hand at forecast time: a lag of one month or more never needs a forecast of its own future value.

You can add a calendar effect like trading days, a holiday dummy for a recurring event, and an intervention dummy for a one-off, and you have seen a small real effect stay hidden until the larger effects around it are accounted for. And you can tell an ex-ante forecast from an ex-post one, and both of those from a scenario forecast built to compare decisions rather than to guess the single most likely future.

The next lesson turns to choosing which predictors actually belong in a model, instead of adding every one that comes to mind.

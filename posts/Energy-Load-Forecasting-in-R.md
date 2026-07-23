---
title: "Energy Load Forecasting in R: an End-to-End Case Study"
slug: "Energy-Load-Forecasting-in-R"
description: "Energy load forecasting in R, end to end: explore real electricity demand data, build temperature and calendar features, then fit, backtest, and deploy."
keywords: "energy load forecasting in R, electricity demand forecasting, load forecasting R, time series forecasting R, temperature demand model, forecast electricity demand, dynamic regression, tslm forecast"
auto_link_terms: "energy load forecasting|electricity load forecasting|electricity demand forecasting|load forecasting|load forecasting in R|energy demand forecasting|forecasting electricity demand|demand forecasting case study|heating and cooling degrees|electricity demand data"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-13.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Energy Load Forecasting"
sidebar_order: 67
difficulty: "Advanced"
---

<p class="lead">Energy load forecasting predicts how much electricity a region will use in the hours and days ahead, so grid operators can line up supply with demand. This case study walks the whole workflow in R on real demand data: you explore the patterns, engineer temperature and calendar features, fit and backtest models, and deploy a two-week forecast with honest uncertainty.</p>

## What are we forecasting, and what does the data look like?

A grid operator lives with a hard constraint every single day. Generate too little electricity and the lights go out; generate too much and expensive fuel is burned for nothing. To stay in balance, they need a reliable number for tomorrow's demand, and for the days and weeks that follow it. That number is a load forecast, and this post builds one from the ground up.

We will work with three years of real electricity demand from Victoria, Australia, recorded every half hour alongside the local temperature. Before modeling anything, the first job is to get a clean daily table we can reason about. We use `dplyr` and `lubridate` to reshape the data and the `forecast` package to model it later.

```r title="Load libraries and build the daily dataset"
library(tsibbledata)
library(dplyr)
library(lubridate)
library(forecast)
library(ggplot2)

data("vic_elec")

# Roll the half-hourly readings up to one row per day
elec <- vic_elec |>
  as.data.frame() |>
  group_by(day = as_date(Date)) |>
  summarise(
    demand  = sum(Demand) / 1000,   # half-hourly MWh summed to GWh for the day
    temp    = mean(Temperature),    # average temperature that day, in Celsius
    holiday = as.integer(any(Holiday))
  )

head(elec)
#> # A tibble: 6 × 4
#>   day        demand  temp holiday
#>   <date>      <dbl> <dbl>   <int>
#> 1 2012-01-01   222.  25.3       1
#> 2 2012-01-02   258.  30.7       1
#> 3 2012-01-03   267.  26.5       0
#> 4 2012-01-04   223.  21.0       0
#> 5 2012-01-05   211.  17.5       0
#> 6 2012-01-06   210.  18.7       0
```

Each row is one day. The `demand` column is total electricity used, converted to gigawatt-hours (GWh) so the numbers are easy to read. The `temp` column is the average temperature, and `holiday` is 1 on public holidays and 0 otherwise. That is the raw material for the whole project.

Here is the road we are going to travel. We start with the daily data, understand what moves it, turn those forces into features, set up an honest test, fit and compare a few models, backtest the winner, and finally deploy a forecast. Each step feeds the next.

![The seven stages of the forecasting case study, from raw demand to a deployed forecast](screenshots/Energy-Load-Forecasting-in-R-workflow.webp)
*Figure 1: The seven stages of the forecasting case study, from raw demand to a deployed forecast.*

Let's look at the whole series at once. A picture of three years of demand tells us more than any summary statistic about what kind of forecasting problem this is.

```r title="Plot daily demand over three years"
ggplot(elec, aes(day, demand)) +
  geom_line(color = "#2c7fb8") +
  labs(title = "Daily electricity demand in Victoria, 2012-2014",
       x = NULL, y = "Demand (GWh per day)")
```

The line has a clear rhythm. Demand swells during the hot summers and again in the coldest part of winter, with calmer stretches in between. There is no strong long-term climb or fall, just a repeating seasonal wave with plenty of day-to-day jitter on top. A good forecast will need to capture that wave.

[NOTE]
**This data is from Victoria, Australia, where the seasons are flipped.** Summer runs from December to February and winter from June to August, so the December peaks you see are hot-weather peaks, not holiday-season heating.

**Try it:** Before we go further, get a feel for the scale. Compute the average daily demand across the whole series and round it to one decimal place.

```r title="Your turn: average daily demand"
# Compute the mean of elec$demand, then round the result to 1 decimal place.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Average daily demand"
ex_avg <- mean(elec$demand)
round(ex_avg, 1)
#> [1] 223.9
```

**Explanation:** The typical day uses about 224 GWh. That single number is a useful anchor: any forecast that drifts far from it on an ordinary day is probably wrong.

</details>

## What patterns actually drive demand?

A forecast is only as good as your understanding of what moves the series. Two forces jump out of the data, and one of them hides in a way that trips up beginners. Let's uncover both.

The first force is the weekly calendar. Offices, factories, and shops run Monday to Friday, so we expect weekdays to pull more power than weekends. Grouping the days by weekday and averaging confirms it.

```r title="Average demand by day of week"
elec |>
  mutate(weekday = wday(day, label = TRUE)) |>
  group_by(weekday) |>
  summarise(mean_demand = round(mean(demand), 1))
#> # A tibble: 7 × 2
#>   weekday mean_demand
#>   <ord>         <dbl>
#> 1 Sun            197.
#> 2 Mon            230.
#> 3 Tue            234.
#> 4 Wed            234.
#> 5 Thu            236.
#> 6 Fri            232.
#> 7 Sat            204.
```

The pattern is exactly what you would guess. Weekdays sit around 230 to 236 GWh, while Sunday drops to 197 and Saturday to 204. That is a swing of nearly 40 GWh just from the day of the week, so the calendar clearly matters.

The second force is temperature, and here a single summary number misleads. The obvious first move is to ask how strongly demand and temperature move together, using a correlation. A correlation near 1 or -1 means a strong straight-line link, and near 0 means none.

```r title="Correlate demand with temperature"
cor(elec$demand, elec$temp)
#> [1] 0.02746165
```

The correlation is 0.027, which is essentially zero. Taken at face value, this says temperature has nothing to do with demand. That conclusion would be badly wrong. The problem is that correlation only measures straight-line relationships, and the true link is not a straight line. Let's plot demand against temperature and see the real shape.

```r title="Plot demand against temperature"
ggplot(elec, aes(temp, demand)) +
  geom_point(alpha = 0.4, color = "#2c7fb8") +
  geom_smooth(method = "loess", se = FALSE, color = "#d95f0e") +
  labs(title = "Demand versus temperature: a V-shape, not a line",
       x = "Average temperature (Celsius)", y = "Demand (GWh per day)")
```

The cloud of points forms a V. Demand is lowest on mild days near 18 to 20 degrees, then rises as it gets hotter (air conditioning) and rises again as it gets colder (heating). A straight line through a V is flat, which is why the correlation was near zero. The relationship is strong; it just is not linear.

The most extreme days make the V impossible to miss. Let's pull out the two hottest and two coldest days and look at their demand.

```r title="Compare the hottest and coldest days"
bind_rows(
  elec |> arrange(desc(temp)) |> head(2) |> mutate(kind = "hottest"),
  elec |> arrange(temp)       |> head(2) |> mutate(kind = "coldest")
)
#> # A tibble: 4 × 5
#>   day        demand  temp holiday kind   
#>   <date>      <dbl> <dbl>   <int> <chr>  
#> 1 2014-01-15   345. 33.9        0 hottest
#> 2 2014-01-16   347. 33.9        0 hottest
#> 3 2013-06-24   265.  7.29       0 coldest
#> 4 2014-08-01   263.  7.35       0 coldest
```

Look at the demand column. The hottest days, near 34 degrees, hit 345 to 347 GWh, the highest in the whole dataset. The coldest days, near 7 degrees, still reach 263 to 265 GWh, far above a mild day's 200. Both temperature extremes drive demand up, from opposite directions. Figure 2 summarizes every force we now know pushes daily demand around.

![The main forces that push daily electricity demand up or down](screenshots/Energy-Load-Forecasting-in-R-demand-drivers.webp)
*Figure 2: The main forces that push daily electricity demand up or down.*

[KEY INSIGHT]
**A near-zero correlation can hide a powerful relationship.** Correlation only sees straight lines, so a V-shaped effect like temperature-driven demand reads as "no relationship" even though it is one of the strongest drivers in the data. Always plot before you trust a single number.

**Try it:** Find the single day with the highest demand in the whole series. Sort the table by demand from high to low and take the top row.

```r title="Your turn: the peak demand day"
# Arrange elec by demand from high to low, then keep only the first row.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="The peak demand day"
elec |> arrange(desc(demand)) |> head(1)
#> # A tibble: 1 × 4
#>   day        demand  temp holiday
#>   <date>      <dbl> <dbl>   <int>
#> 1 2014-01-16   347.  33.9       0
```

**Explanation:** The record day is 16 January 2014, a scorching 34-degree summer day when air conditioners across the state ran flat out. Peak demand and peak temperature line up exactly.

</details>

## How do we turn temperature and the calendar into features?

A model cannot learn a V-shape from raw temperature alone, because a straight-line coefficient can only bend one way. The fix is a classic idea from energy forecasting: split temperature into two separate features, one for the hot side and one for the cold side. These are called cooling degrees and heating degrees.

The idea is simple. Pick a comfortable baseline temperature, 18 degrees, where almost no heating or cooling is needed. On a hot day, cooling degrees count how far above 18 you are; on a cold day, heating degrees count how far below. Each stays at zero when it does not apply.

$$\text{cooling}_t = \max(\text{temp}_t - 18,\ 0), \qquad \text{heating}_t = \max(18 - \text{temp}_t,\ 0)$$

In words, cooling degrees are temperature minus 18 when that is positive, otherwise zero, and heating degrees are the mirror image. Figure 3 shows the split as a simple fork.

![How one temperature reading becomes heating and cooling degree features at an 18C threshold](screenshots/Energy-Load-Forecasting-in-R-degree-features.webp)
*Figure 3: How one temperature reading becomes heating and cooling degree features at an 18C threshold.*

The `pmax()` function does the "or zero" part for us: it takes the larger of each value and zero. While we are at it, we add a `weekend` flag for Saturdays and Sundays.

```r title="Build heating, cooling, and weekend features"
elec <- elec |>
  mutate(
    cooling = pmax(temp - 18, 0),          # degrees above 18C, drives cooling
    heating = pmax(18 - temp, 0),          # degrees below 18C, drives heating
    weekend = as.integer(wday(day) %in% c(1, 7))
  )

head(elec, 4)
#> # A tibble: 4 × 7
#>   day        demand  temp holiday cooling heating weekend
#>   <date>      <dbl> <dbl>   <int>   <dbl>   <dbl>   <int>
#> 1 2012-01-01   222.  25.3       1    7.32       0       1
#> 2 2012-01-02   258.  30.7       1   12.7        0       0
#> 3 2012-01-03   267.  26.5       0    8.51       0       0
#> 4 2012-01-04   223.  21.0       0    3.00       0       0
```

These early-January days are warm, so `cooling` is positive and `heating` is zero for all of them. To be sure the split behaves at both extremes, let's check one hot day and one cold day side by side.

```r title="Sanity-check the degree features"
elec |>
  filter(day %in% as_date(c("2014-01-16", "2013-06-24"))) |>
  select(day, temp, heating, cooling)
#> # A tibble: 2 × 4
#>   day         temp heating cooling
#>   <date>     <dbl>   <dbl>   <dbl>
#> 1 2013-06-24  7.29    10.7     0  
#> 2 2014-01-16 33.9      0      15.9
```

This is exactly the behavior we wanted. The cold winter day (7.3 degrees) has 10.7 heating degrees and zero cooling degrees. The hot summer day (33.9 degrees) flips it: 15.9 cooling degrees and zero heating. Each feature switches on only when its side of the weather arrives.

[TIP]
**Degree features make coefficients readable.** After fitting, the cooling coefficient reads directly as "extra GWh per degree of air conditioning" and the heating coefficient as "extra GWh per degree of heating." A raw squared-temperature term would fit the V too, but its coefficient means nothing you can explain to an operator.

**Try it:** Compute heating and cooling degrees by hand for a 25-degree day and a 10-degree day. Use the same 18-degree baseline.

```r title="Your turn: degrees for two temperatures"
# For a 25C day and a 10C day, use pmax() and an 18-degree baseline to fill in
# the heating and cooling columns of this data.frame. Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Degrees for two temperatures"
data.frame(
  temp    = c(25, 10),
  heating = pmax(18 - c(25, 10), 0),
  cooling = pmax(c(25, 10) - 18, 0)
)
#>   temp heating cooling
#> 1   25       0       7
#> 2   10       8       0
```

**Explanation:** At 25 degrees you are 7 above the baseline, so cooling is 7 and heating is 0. At 10 degrees you are 8 below, so heating is 8 and cooling is 0. The two features never fire at the same time.

</details>

## How do we set up an honest test with a baseline?

Before building anything clever, we need two things: a fair way to test a model, and a simple model to beat. Skip either and you will fool yourself into thinking a bad forecast is good.

The fair test for a time series is a time-based split. We train on the earlier part of the series and hold out the most recent stretch to check against, exactly mimicking how forecasting works in real life, where you only ever have the past. Here we hold out the final 28 days.

```r title="Split into training and holdout by time"
h <- 28
n <- nrow(elec)
train <- elec[1:(n - h), ]
test  <- elec[(n - h + 1):n, ]

c(train_days = nrow(train), test_days = nrow(test))
range(test$day)
#> train_days  test_days 
#>       1068         28 
#> [1] "2014-12-04" "2014-12-31"
```

We train on 1068 days and test on the last 28, which run from 4 to 31 December 2014. The model never sees those 28 days while learning, so scoring against them is honest.

[WARNING]
**Never shuffle a time series before splitting.** Random train-test splits, standard in other machine learning, leak the future into the past here: the model would train on days that come after the ones it is tested on. Always split by time, with the test set at the end.

Now the model to beat. The simplest sensible forecast for a series with a weekly rhythm is the seasonal naive: predict that each day equals the same weekday one week earlier. It is simple but surprisingly hard to beat, and any real model must clear this bar to be worth the trouble. We build a weekly time series with `ts(..., frequency = 7)` and score the seasonal naive with `accuracy()`.

```r title="Fit the seasonal-naive baseline"
y <- ts(train$demand, frequency = 7)

baseline <- snaive(y, h = h)
accuracy(baseline, test$demand)["Test set", c("RMSE", "MAE", "MAPE")]
#>     RMSE      MAE     MAPE 
#> 24.58821 19.29050 10.00200 
```

Three error numbers summarize the baseline. RMSE and MAE are both in GWh, so the average miss is roughly 19 to 25 GWh per day. The one to watch is MAPE, the mean absolute percentage error: on average the seasonal naive is off by 10.0 percent. That is the number every model from here on must beat.

**Try it:** Suppose you wanted a shorter, two-week holdout instead of four weeks. With `h` set to 14, how many training days would you have?

```r title="Your turn: training days for a 14-day holdout"
# With a 14-day holdout, work out how many training days are left.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Training days for a 14-day holdout"
ex_h <- 14
nrow(elec) - ex_h
#> [1] 1082
```

**Explanation:** With 1096 days in total, holding out 14 leaves 1082 for training. A shorter holdout gives more training data but a noisier accuracy estimate, because you are judging on fewer days.

</details>

## How do we forecast from temperature and the calendar?

Now we put the physics to work. We build a regression that explains demand with everything we learned drives it: a slow trend, the day-of-week effect, the two degree features, plus the holiday flag. The `tslm()` function fits a linear model to a time series, where `trend` and `season` are special terms it understands automatically.

```r title="Fit the temperature-and-calendar regression"
heating  <- ts(train$heating,  frequency = 7)
cooling  <- ts(train$cooling,  frequency = 7)
holidayt <- ts(train$holiday,  frequency = 7)

fit_reg <- tslm(y ~ trend + season + heating + cooling + holidayt)
round(coef(fit_reg), 2)
#> (Intercept)       trend     season2     season3     season4     season5     season6     season7 
#>      178.13       -0.01       36.79       40.07       39.91       40.25       36.46        7.78 
#>     heating     cooling    holidayt 
#>        5.05        6.82      -40.02 
```

Every coefficient tells a story you can read out loud. Each cooling degree adds 6.82 GWh and each heating degree adds 5.05 GWh, so each degree of cooling adds a little more demand than each degree of heating here. A public holiday cuts 40 GWh, a huge drop, because factories and offices close. The `season` terms are the weekday bumps relative to Sunday, and the `trend` is a flat -0.01, confirming there is no meaningful long-term drift. The model is not a black box; it is a readable summary of how demand works.

Underneath, this is one linear equation. If the formula helps you it is here, and if not, skip it: the coefficients above already tell you everything.

$$\text{demand}_t = \beta_0 + \text{trend}_t + \text{weekday}_t + \beta_c\,\text{cooling}_t + \beta_h\,\text{heating}_t + \beta_H\,\text{holiday}_t + \varepsilon_t$$

Where $\beta_c$ and $\beta_h$ are the cooling and heating effects, $\beta_H$ is the holiday effect, and $\varepsilon_t$ is the leftover error. Now the real test: forecast the 28 held-out days and score them. Because the model uses predictors, we hand it the test period's temperature and holiday values through `newdata`.

```r title="Forecast the holdout and measure accuracy"
newdata <- data.frame(heating = test$heating,
                      cooling = test$cooling,
                      holidayt = test$holiday)
fc_reg <- forecast(fit_reg, newdata = newdata)
accuracy(fc_reg, test$demand)["Test set", c("RMSE", "MAE", "MAPE")]
#>      RMSE       MAE      MAPE 
#> 11.212838  8.817148  4.471255 
```

The MAPE is 4.47 percent, less than half the baseline's 10.0 percent. Adding temperature and calendar knowledge cut the average error in half. A picture shows how tightly the forecast now tracks reality across the holdout.

```r title="Plot the forecast against the actual demand"
compare <- data.frame(
  day      = test$day,
  actual   = test$demand,
  forecast = as.numeric(fc_reg$mean)
)

ggplot(compare, aes(day)) +
  geom_line(aes(y = actual,   color = "Actual")) +
  geom_line(aes(y = forecast, color = "Forecast")) +
  labs(title = "Temperature-and-calendar forecast vs actual (28-day holdout)",
       x = NULL, y = "Demand (GWh per day)", color = NULL)
```

The two lines move together closely. The forecast catches the weekday-to-weekend dips and the temperature-driven swings, missing only the sharpest single-day spikes. For a model you can explain in one sentence, that is an excellent result.

[KEY INSIGHT]
**The interpretable model won, and that is common in load forecasting.** A regression built from the physics of the problem, temperature plus the calendar, beat the naive baseline by half. You do not need a black box when you understand what drives the series; you need the right features.

**Try it:** Read the cooling effect straight from the fitted model. Pull out the `cooling` coefficient and round it to two decimals.

```r title="Your turn: the cooling coefficient"
# Pull the "cooling" coefficient out of fit_reg and round it to 2 decimals.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="The cooling coefficient"
round(coef(fit_reg)["cooling"], 2)
#> cooling 
#>    6.82 
```

**Explanation:** Each degree above the 18-degree baseline adds 6.82 GWh of demand. On a 30-degree day, that is 12 cooling degrees times 6.82, about 82 extra GWh from air conditioning alone.

</details>

## Can we trust the model's uncertainty?

Great point forecasts are only half the job. A real forecast also needs an honest range around it, the prediction interval, so an operator knows how much to hedge. Before trusting that range, we must check the model's residuals, the leftover errors after the fit.

A regression assumes its residuals are independent noise. If today's error tells you something about tomorrow's, that assumption is broken and the prediction intervals will be too narrow. The `checkresiduals()` function runs a Breusch-Godfrey test, where a p-value below 0.05 means the errors are autocorrelated.

```r title="Check the regression residuals"
checkresiduals(fit_reg, plot = FALSE)
#> 
#> 	Breusch-Godfrey test for serial correlation of order up to 14
#> 
#> data:  Residuals from Linear regression model
#> LM test = 470.21, df = 14, p-value < 2.2e-16
```

The p-value is far below 0.05, so the residuals are strongly autocorrelated. In plain terms, the model's misses come in runs: several high days in a row, then several low. The point forecasts are still excellent, but the prediction intervals cannot be trusted, because the model assumes an independence that does not hold.

The fix is a dynamic regression, also called regression with ARIMA errors. It keeps temperature and calendar predictors (heating, cooling, a weekend flag, and holidays) but adds an ARIMA model on top to absorb the leftover time structure, which restores honest intervals. We pass the predictors to `auto.arima()` through `xreg`.

```r title="Fit a dynamic regression with ARIMA errors"
xreg_train <- cbind(heating = train$heating, cooling = train$cooling,
                    weekend = train$weekend, holiday = train$holiday)

fit_dyn <- auto.arima(y, xreg = xreg_train, d = 0)
fit_dyn
#> Series: y 
#> Regression with ARIMA(1,0,1)(2,0,0)[7] errors 
#> 
#> Coefficients:
#>          ar1      ma1    sar1    sar2  intercept  heating  cooling   weekend   holiday
#>       0.8492  -0.2764  0.2263  0.2328   220.6661   2.5846   5.4591  -33.2401  -31.4355
#> s.e.  0.0246   0.0480  0.0322  0.0307     1.8405   0.1416   0.1176    0.7603    1.0932
#> 
#> sigma^2 = 43.86:  log likelihood = -3531.19
#> AIC=7082.39   AICc=7082.59   BIC=7132.12
```

The label reads "Regression with ARIMA(1,0,1)(2,0,0)[7] errors." The regression coefficients (heating, cooling, weekend, holiday) are still there and still sensible, and the `[7]` part is a seasonal piece that models the weekly autocorrelation. The real question is whether this fixed the residuals, so we run the check again, this time a Ljung-Box test where a p-value above 0.05 is a pass.

```r title="Recheck the residuals after adding ARIMA errors"
checkresiduals(fit_dyn, plot = FALSE)
#> 
#> 	Ljung-Box test
#> 
#> data:  Residuals from Regression with ARIMA(1,0,1)(2,0,0)[7] errors
#> Q* = 17.386, df = 10, p-value = 0.06625
#> 
#> Model df: 4.   Total lags used: 14
```

The p-value is 0.066, above 0.05, so the residuals now pass as clean noise. The ARIMA part absorbed the autocorrelation the plain regression left behind, which means this model's prediction intervals can be trusted. Now let's put all three models on one scoreboard.

```r title="Compare all three models on the holdout"
fc_dyn <- forecast(fit_dyn, xreg = cbind(heating = test$heating, cooling = test$cooling,
                                         weekend = test$weekend, holiday = test$holiday))

rbind(
  seasonal_naive = accuracy(baseline, test$demand)["Test set", c("RMSE", "MAE", "MAPE")],
  temp_calendar  = accuracy(fc_reg,   test$demand)["Test set", c("RMSE", "MAE", "MAPE")],
  dynamic_reg    = accuracy(fc_dyn,   test$demand)["Test set", c("RMSE", "MAE", "MAPE")]
) |> round(2)
#>                 RMSE   MAE  MAPE
#> seasonal_naive 24.59 19.29 10.00
#> temp_calendar  11.21  8.82  4.47
#> dynamic_reg    17.88 13.66  7.06
```

Here is an honest surprise. The plain temperature-and-calendar regression has the best point accuracy (4.47 percent), better than the more complex dynamic regression (7.06 percent) on this particular holdout. The dynamic regression's value is not sharper points; it is trustworthy intervals, thanks to those clean residuals. Complexity did not win on accuracy, which is a lesson worth carrying into every project: always check, never assume.

[WARNING]
**Good point forecasts do not guarantee trustworthy intervals.** A model can nail the central prediction while its uncertainty band is far too narrow, because its residuals are autocorrelated. Diagnose the residuals before you quote a range, and reach for a dynamic regression when you need the band to hold up. See [Dynamic Regression in R](Dynamic-Regression-in-R.html) for the full treatment.

**Try it:** The `ar1` coefficient measures how strongly one day's error carries into the next. Extract it from the dynamic model and round it to three decimals.

```r title="Your turn: read the autocorrelation strength"
# Extract the "ar1" coefficient from fit_dyn and round it to 3 decimals.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="The autocorrelation strength"
round(coef(fit_dyn)["ar1"], 3)
#>   ar1 
#> 0.849 
```

**Explanation:** An `ar1` of 0.849 means a day's error is strongly linked to the day before, which is precisely the structure the plain regression ignored. Modeling it is what makes the dynamic regression's intervals honest.

</details>

## How do we know it will keep working?

One holdout can flatter or fool a model. December might have been an easy month, or a hard one, and a single 28-day test cannot tell the difference. The professional answer is backtesting: replay history many times, forecasting from many different cut points, and average the results.

The specific method is a rolling-origin backtest. We pick a cut point, train on everything before it, forecast the next two weeks, and score against what really happened. Then we slide the cut point forward and do it again, building up a distribution of errors instead of one lucky number. Figure 4 shows the loop.

![Rolling-origin backtesting: slide the cut point forward and re-score, again and again](screenshots/Energy-Load-Forecasting-in-R-backtest.webp)
*Figure 4: Rolling-origin backtesting: slide the cut point forward and re-score, again and again.*

We run eight folds, each forecasting 14 days ahead, comparing the temperature-and-calendar regression against the seasonal-naive baseline at every origin.

```r title="Backtest across eight rolling origins"
H <- 14
origins <- seq(n - 14 * 8, n - H, by = H)   # eight cut points, two weeks apart

scores <- lapply(origins, function(s) {
  tr <- elec[1:s, ]
  va <- elec[(s + 1):(s + H), ]
  yy <- ts(tr$demand, frequency = 7)
  fit <- tslm(yy ~ trend + season + heating + cooling + holidayt,
              data = data.frame(heating  = ts(tr$heating,  frequency = 7),
                                cooling  = ts(tr$cooling,  frequency = 7),
                                holidayt = ts(tr$holiday,  frequency = 7)))
  fc <- forecast(fit, newdata = data.frame(heating = va$heating,
                                           cooling = va$cooling,
                                           holidayt = va$holiday))
  sn <- snaive(yy, h = H)
  data.frame(naive_mape = mean(abs((va$demand - sn$mean) / va$demand)) * 100,
             model_mape = mean(abs((va$demand - fc$mean) / va$demand)) * 100)
})

backtest <- do.call(rbind, scores)
round(backtest, 2)
round(colMeans(backtest), 2)
#>   naive_mape model_mape
#> 1       2.39       2.68
#> 2       6.00       4.42
#> 3       3.53       3.51
#> 4       4.55       3.50
#> 5       5.40       3.28
#> 6       5.96       3.42
#> 7       6.06       2.82
#> 8      12.97       6.19
#> naive_mape model_mape 
#>       5.86       3.73 
```

Averaged across all eight folds, the regression scores 3.73 percent against the baseline's 5.86 percent, and it wins in seven of the eight folds. The single December holdout was not a fluke: the temperature-and-calendar model beats the baseline reliably, across different seasons and cut points. That consistency is what earns a model the right to be deployed.

[KEY INSIGHT]
**Judge a model on many origins, not one lucky split.** A single holdout is one sample of the model's skill. Rolling-origin backtesting turns that one number into a distribution, so you learn not just how good the model is but how consistent it is.

**Try it:** Count how many of the eight folds the model beat the baseline. Compare the two columns and sum the wins.

```r title="Your turn: count the model's wins"
# Count the folds where model_mape is below naive_mape in the backtest table.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Count the model's wins"
sum(backtest$model_mape < backtest$naive_mape)
#> [1] 7
```

**Explanation:** The model has a lower error than the baseline in 7 of 8 folds. No model wins every single time (in fold 1 the baseline was slightly ahead), but a 7-out-of-8 record is strong evidence the improvement is real.

</details>

## Complete Example: forecast the next two weeks

Everything so far was rehearsal on data we already had. Deployment is different: we forecast days that have not happened yet. This final section refits the winning model on all the data and produces a genuine two-week-ahead forecast, the artifact you would hand to an operator.

First, refit the temperature-and-calendar regression on the full three years, throwing nothing away. More history means better-estimated coefficients.

```r title="Refit the final model on all available data"
y_all <- ts(elec$demand, frequency = 7)

final_fit <- tslm(
  y_all ~ trend + season + heating + cooling + holidayt,
  data = data.frame(
    heating  = ts(elec$heating, frequency = 7),
    cooling  = ts(elec$cooling, frequency = 7),
    holidayt = ts(elec$holiday, frequency = 7)
  )
)
```

Now the catch that defines real load forecasting: the model needs future temperature, which we do not know. In practice you would plug in a weather forecast. Here we use a sensible stand-in, the seasonal normal, meaning the average temperature for each calendar day across the three years of history. We build that scenario for the first two weeks of January 2015 and forecast.

```r title="Build a temperature scenario and forecast ahead"
future_days <- seq(as_date("2015-01-01"), by = "day", length.out = 14)

# Seasonal-normal temperature: the historical average for each calendar day
normals <- elec |>
  mutate(md = format(day, "%m-%d")) |>
  group_by(md) |>
  summarise(temp_norm = mean(temp))

future <- data.frame(day = future_days, md = format(future_days, "%m-%d")) |>
  left_join(normals, by = "md") |>
  mutate(heating  = pmax(18 - temp_norm, 0),
         cooling  = pmax(temp_norm - 18, 0),
         holidayt = as.integer(day == as_date("2015-01-01")))

fc_future <- forecast(final_fit,
                      newdata = data.frame(heating  = future$heating,
                                           cooling  = future$cooling,
                                           holidayt = future$holidayt))

data.frame(day      = future$day,
           forecast = round(as.numeric(fc_future$mean), 1),
           lo80     = round(as.numeric(fc_future$lower[, 1]), 1),
           hi80     = round(as.numeric(fc_future$upper[, 1]), 1))
#>           day forecast  lo80  hi80
#> 1  2015-01-01    194.2 181.7 206.7
#> 2  2015-01-02    235.0 222.7 247.3
#> 3  2015-01-03    212.4 200.1 224.7
#> 4  2015-01-04    206.8 194.5 219.1
#> 5  2015-01-05    215.3 203.0 227.6
#> 6  2015-01-06    211.4 199.1 223.7
#> 7  2015-01-07    225.9 213.6 238.2
#> 8  2015-01-08    227.5 215.2 239.8
#> 9  2015-01-09    216.2 203.9 228.5
#> 10 2015-01-10    200.1 187.8 212.4
#> 11 2015-01-11    181.1 168.8 193.4
#> 12 2015-01-12    205.8 193.5 218.1
#> 13 2015-01-13    213.8 201.5 226.1
#> 14 2015-01-14    235.8 223.5 248.1
```

Read the first row: New Year's Day is forecast at 194 GWh, low because it is a holiday, with an 80 percent chance the true value lands between 182 and 207. The weekend of 10 to 11 January dips as expected, and warm weekdays climb back above 235. Each `lo80` and `hi80` pair is the range the operator would plan around. A plot makes the shape and the widening uncertainty clear.

```r title="Plot the two-week-ahead forecast with intervals"
autoplot(fc_future) +
  labs(title = "Two-week-ahead demand forecast with 80 and 95% intervals",
       x = "Week", y = "Demand (GWh per day)")
```

[WARNING]
**A temperature-driven forecast is only as good as the temperature you feed it.** Our seasonal-normal scenario is a placeholder; a real deployment would use a live weather forecast, and its errors flow straight into the demand forecast. And because the plain regression's residuals were autocorrelated, treat these intervals as approximate. When the band must be defensible, forecast with the dynamic regression instead.

## Frequently Asked Questions

**What is electricity load forecasting?** It is predicting how much electrical power a region will consume over a future window, from the next hour to the next year. Short-term forecasts (hours to a couple of weeks) run the grid day to day; medium-term forecasts (weeks to months) guide fuel buying and maintenance; long-term forecasts (years) inform building new power stations. This case study is a short-term, day-ahead-style problem.

**Why does temperature matter so much?** Because heating and cooling are electric. When it is hot, air conditioners draw power; when it is cold, electric heaters do. Mild days need neither, which is why demand is lowest in the middle and rises at both temperature extremes, the V-shape we saw.

**Do I really need the future temperature to forecast demand?** For a temperature-driven model, yes. That is the trade-off: temperature makes the model far more accurate, but you must supply its future values, usually from a weather forecast. A pure time series model like ETS or ARIMA needs no external inputs but cannot see a heatwave coming.

**Should I model daily or half-hourly data?** It depends on the decision. Daily totals, as here, suit fuel and capacity planning and are easier to learn from. Half-hourly forecasting matters for real-time grid balancing and adds a strong daily (within-day) cycle on top of everything here, usually handled with extra seasonal terms.

**Which model should I actually ship?** Start with the interpretable temperature-and-calendar regression: it was the most accurate here and you can explain every coefficient. Add the dynamic-regression version when you need trustworthy prediction intervals. Always confirm the choice with a rolling-origin backtest rather than a single holdout.

## Practice Exercises

These three exercises push on the case study's decisions. Each starter block runs as-is, so write your version and reveal ours to compare. They reuse the objects built above (`train`, `test`, `y`, `fc_reg`, `fc_dyn`), so run the tutorial code first.

### Exercise 1: How much does the calendar add?

The full model used temperature and the calendar. Isolate the calendar's contribution by fitting a temperature-only model (drop the `season` term) and comparing its holdout MAPE to the full model's 4.47 percent.

```r title="Your turn: temperature-only vs full model"
# Fit tslm(y ~ trend + heating + cooling + holidayt), call it fit_temp.
# Forecast it on newdata, then compare its Test-set MAPE to fc_reg's.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Temperature-only vs full model"
fit_temp <- tslm(y ~ trend + heating + cooling + holidayt)
fc_temp  <- forecast(fit_temp, newdata = newdata)
c(temp_only = accuracy(fc_temp, test$demand)["Test set", "MAPE"],
  full      = accuracy(fc_reg,  test$demand)["Test set", "MAPE"]) |> round(2)
#> temp_only      full 
#>      7.55      4.47 
```

**Explanation:** Temperature alone scores 7.55 percent; adding the weekday calendar drops it to 4.47. The calendar is worth roughly three percentage points of accuracy on its own, because weekends and holidays move demand by tens of GWh that temperature cannot explain.

</details>

### Exercise 2: Is 18 degrees the right threshold?

We split temperature at 18 degrees. Test whether 20 degrees would work better. Rebuild the heating and cooling features with a 20-degree baseline, refit the full model, and compare its holdout MAPE to the 18-degree version.

```r title="Your turn: threshold 20 vs 18"
# Rebuild cooling = pmax(temp - 20, 0) and heating = pmax(20 - temp, 0)
# on train and test, refit the tslm, forecast, and compare MAPE to 4.47.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold 20 vs 18"
train2 <- train |> mutate(cooling = pmax(temp - 20, 0), heating = pmax(20 - temp, 0))
test2  <- test  |> mutate(cooling = pmax(temp - 20, 0), heating = pmax(20 - temp, 0))
y2       <- ts(train2$demand,  frequency = 7)
heating  <- ts(train2$heating, frequency = 7)
cooling  <- ts(train2$cooling, frequency = 7)
holidayt <- ts(train2$holiday, frequency = 7)
fit20 <- tslm(y2 ~ trend + season + heating + cooling + holidayt)
fc20  <- forecast(fit20, newdata = data.frame(heating = test2$heating,
                                              cooling = test2$cooling,
                                              holidayt = test2$holiday))
c(threshold_18 = round(accuracy(fc_reg, test$demand)["Test set", "MAPE"], 2),
  threshold_20 = round(accuracy(fc20,  test2$demand)["Test set", "MAPE"], 2))
#> threshold_18 threshold_20 
#>         4.47         4.99 
```

**Explanation:** The 20-degree threshold scores 4.99 percent, slightly worse than 18's 4.47. The comfort point where neither heating nor cooling kicks in really is nearer 18 degrees for this region, which is why the original split fit better. Tuning the threshold is a legitimate way to squeeze out accuracy.

</details>

### Exercise 3: Does averaging the two models help?

A common trick is to average forecasts from different models, hoping their errors cancel. Build a simple ensemble by averaging the temperature-and-calendar and dynamic-regression point forecasts, then compare its MAPE to both.

```r title="Your turn: average the two forecasts"
# ens = average of fc_reg$mean and fc_dyn$mean.
# Compute its MAPE against test$demand and compare to 4.47 and 7.06.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Average the two forecasts"
ens      <- (as.numeric(fc_reg$mean) + as.numeric(fc_dyn$mean)) / 2
ens_mape <- mean(abs((test$demand - ens) / test$demand)) * 100
c(temp_calendar = round(accuracy(fc_reg, test$demand)["Test set", "MAPE"], 2),
  dynamic_reg   = round(accuracy(fc_dyn, test$demand)["Test set", "MAPE"], 2),
  ensemble      = round(ens_mape, 2))
#> temp_calendar   dynamic_reg      ensemble 
#>          4.47          7.06          5.14 
```

**Explanation:** The ensemble scores 5.14 percent, worse than the better model (4.47) and better than the worse one (7.06). Averaging landed in the middle, which is exactly what happens when one model is clearly stronger: blending pulls the good forecast toward the weaker one. Ensembles pay off when models are close in skill, not when one dominates.

</details>

## Summary

You built a complete energy load forecast, from a raw half-hourly feed to a deployable two-week outlook, and you did it with models you can fully explain. The spine of the project was a single realization: temperature is the master driver, but only once you split it into heating and cooling degrees so a model can see the V.

| Stage | Tool | Takeaway |
|---|---|---|
| Explore | `ggplot2`, `cor()` | A near-zero correlation hid a strong V-shaped temperature effect |
| Engineer | `pmax()` degree features | Heating and cooling degrees turn the V into readable coefficients |
| Baseline | `snaive()` | The seasonal naive set a 10.0 percent MAPE bar to beat |
| Model | `tslm()` | Temperature plus calendar halved the error to 4.47 percent |
| Trust | `checkresiduals()`, `auto.arima()` | Good points need a residual check; dynamic regression restores honest intervals |
| Backtest | rolling origins | The model beat the baseline in 7 of 8 folds, not by luck |
| Deploy | `forecast()` | A future forecast needs a future temperature scenario |

Keep these lessons close for your next forecasting project:

- **Plot before you trust a statistic.** The correlation said temperature was irrelevant; the scatter plot said it was everything.
- **Engineer features from the physics.** Heating and cooling degrees encode domain knowledge that a raw column cannot.
- **Always beat a baseline.** If your clever model cannot clear the seasonal naive, it is not clever.
- **Separate point accuracy from interval trust.** The simplest model had the best points; a dynamic regression was needed for honest ranges.
- **Backtest before you believe.** One holdout is an anecdote; many rolling origins are evidence.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 12.1: Complex seasonality (electricity demand). [Link](https://otexts.com/fpp3/complexseasonality.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 7: Time series regression models. [Link](https://otexts.com/fpp3/regression.html)
3. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 10: Dynamic regression models. [Link](https://otexts.com/fpp3/dynamic.html)
4. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 5.10: Time series cross-validation. [Link](https://otexts.com/fpp3/tscv.html)
5. Hyndman, R.J., & Khandakar, Y. - "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software*, 27(3), 2008. [Link](https://www.jstatsoft.org/article/view/v027i03)
6. O'Hara-Wild, M., Hyndman, R., & Wang, E. - `tsibbledata`: the `vic_elec` half-hourly electricity demand dataset. [Link](https://tsibbledata.tidyverts.org/reference/vic_elec.html)
7. Hong, T., & Fan, S. - "Probabilistic electric load forecasting: A tutorial review." *International Journal of Forecasting*, 32(3), 2016. [Link](https://doi.org/10.1016/j.ijforecast.2015.11.011)

## Continue Learning

- [Dynamic Regression in R](Dynamic-Regression-in-R.html) - the full treatment of regression with ARIMA errors used here for honest intervals.
- [ETS Models in R](ETS-Models-in-R.html) - exponential smoothing, the pure time series alternative that needs no external predictors.
- [Feature Engineering for Forecasting in R](Feature-Engineering-for-Forecasting-in-R.html) - more ways to turn calendars and drivers into model-ready features.
- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) - a deeper look at the error metrics RMSE, MAE and MAPE, and how to compare models fairly.
- [Backtesting Forecasts in R](Backtesting-Forecasts-in-R.html) - rolling-origin evaluation in depth, the method that validated our model.
- [EDA for Time Series in R](EDA-for-Time-Series-in-R.html) - the exploratory toolkit behind the pattern-hunting in this case study.

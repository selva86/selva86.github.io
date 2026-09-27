---
title: "Machine Learning and Deep Forecasting Lesson 2: Machine Learning Forecasting with modeltime"
slug: "Machine-Learning-Forecasting-with-modeltime"
description: "Forecast 12 months of airline passengers with glmnet and a random forest in modeltime, and score them against a seasonal naive and an ARIMA on one table."
keywords: "machine learning forecasting, modeltime, lag features, forecast horizon, time series split, glmnet, random forest, seasonal naive, ARIMA, forecast accuracy, R"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "2"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Global-Models-One-Model-Across-Many-Series"
course_next: "Boosted-Trees-for-Forecasting"
curriculum_id: "5.130.2"
lesson_access: "pro"
catalog_blurb: "How to check whether a machine learning forecast beats ARIMA and a naive baseline."
---

=== step === cover
## Machine Learning Forecasting with modeltime

Today let's use machine learning models to forecast a time series, and check whether they really do better than a seasonal naive forecast and an ARIMA.

Say you plan capacity for an airline. You need the number of international passengers for each of the next 12 months, and you have 144 months of history behind you, from January 1949 to December 1960.

A machine learning model does not read a series directly. It learns from a table with one row per month, where one column is the value to predict and the other columns are the predictors. So the first job is to turn the series into that kind of table.

After that, we fit four models on the same rows and score all four on the same 12 months, in one accuracy table.

::widget process-flow {"steps":[{"title":"Turn the series into rows","sub":"passengers is the target, lags and month are predictors"},{"title":"Split by date","sub":"108 months to train, the last 12 months to test"},{"title":"Fit four models","sub":"seasonal naive and ARIMA, glmnet and random forest"},{"title":"Compare on one table","sub":"MAE, MAPE and RMSE over the 12 test months"},{"title":"Refit and forecast","sub":"all 120 months in, January to December 1961 out"}]}

That is the whole flow, and we start at the first box.

=== step === concept
## The airline passengers series and what a model needs to learn from it

The series is the `AirPassengers` dataset that ships with base R. It holds the monthly totals of international airline passengers, in thousands, from January 1949 to December 1960.

We put it in a table with one row per month: the date and the passengers. Then we add up each year, pick out its busiest month, and draw the whole series.

Press Run.

```r
# Build the monthly passengers series, then total and peak it by year
library(dplyr)
library(ggplot2)

air <- tibble(
  date = seq(as.Date("1949-01-01"), by = "month", length.out = 144),
  passengers = as.numeric(AirPassengers)
)

dim(air)
#> [1] 144   2

yearly <- air |>
  mutate(year = format(date, "%Y")) |>
  group_by(year) |>
  summarise(total = sum(passengers), peak = max(passengers))

as.data.frame(yearly[c(1, 12), ])
#>   year total peak
#> 1 1949  1520  148
#> 2 1960  5714  622

ggplot(air, aes(date, passengers)) +
  geom_line(color = "#1f7a55") +
  labs(x = NULL, y = "Passengers (thousands)")
```

There are 144 rows. In 1949 the airline carried 1,520 thousand passengers, and its busiest month had 148 thousand. In 1960 it carried 5,714 thousand, and its busiest month had 622 thousand.

The chart shows the same thing. The level of the series rises every year, and the peak in the middle of each year rises with it.

Now think about what a machine learning model needs. It learns a mapping from predictor columns to one target column, and here the target is `passengers`. But this table has no predictors. A date is a single number that keeps growing, and it says nothing about what passengers were a year ago or which time of the year the row belongs to.

So we derive the predictors from the series itself.

=== step === concept
## Lag, calendar and trend features

We build three kinds of predictor columns, also called features, and each one carries something a plain date does not.

- A **lag** column is the value of the series some number of rows earlier. `passengers_lag12` is the passengers of the same month a year before, and `passengers_lag24` is the same month two years before.
- `month` is the calendar month, as a factor with 12 levels from Jan to Dec. It tells the model which time of the year a row belongs to.
- `t` counts the months from 1 for January 1949. It gives the model a number that rises along with the level of the series.

The lags are 12 and 24, not 1 and 2, because we forecast 12 months ahead. A lag of 12 is the smallest one that is still known for every month we forecast.

The function `lag(passengers, 12)` from dplyr shifts the column down by 12 rows. The first 24 months have no value 24 months earlier, so `passengers_lag24` is empty there and `drop_na()` removes those rows.

```r
# Add lag, month and month-counter columns, then drop the rows with no lag
library(tidyr)
library(lubridate)

feat <- air |>
  mutate(
    passengers_lag12 = lag(passengers, 12),
    passengers_lag24 = lag(passengers, 24),
    month = factor(month.abb[month(date)], levels = month.abb),
    t = row_number()
  ) |>
  drop_na()

head(as.data.frame(feat), 3)
#>         date passengers passengers_lag12 passengers_lag24 month  t
#> 1 1951-01-01        145              115              112   Jan 25
#> 2 1951-02-01        150              126              118   Feb 26
#> 3 1951-03-01        178              141              132   Mar 27

dim(feat)
#> [1] 120   6
```

We call this the feature table. It has 120 rows, January 1951 to December 1960, because 24 of the 144 months were dropped.

The first row is January 1951. It had 145 thousand passengers, 115 a year earlier (`passengers_lag12`) and 112 two years earlier (`passengers_lag24`), and its `t` is 25.

=== step === concept
## Why a lag has to be at least as long as the forecast horizon

The forecast horizon is how many months ahead we have to predict. Here it is 12: January to December 1961.

To forecast those months, we need a value for every predictor in the 12 future rows. Passengers for 1961 do not exist yet, so a lag column can only be used if it points at a month that has already happened.

We can check that. The function `future_frame()` adds the 12 future months to the table, with `passengers` set to NA. Then `lag()` computes the lags on the extended table. We try lags of 1 and 12 first and keep only the future rows.

```r
# Append the 12 months of 1961 and count the missing cells for two sets of lags
library(timetk)

lag_1_12 <- air |>
  future_frame(.date_var = date, .length_out = 12, .bind_data = TRUE) |>
  mutate(
    passengers_lag1 = lag(passengers, 1),
    passengers_lag12 = lag(passengers, 12)
  ) |>
  filter(date >= as.Date("1961-01-01"))

as.data.frame(head(lag_1_12, 3))
#>         date passengers passengers_lag1 passengers_lag12
#> 1 1961-01-01         NA             432              417
#> 2 1961-02-01         NA              NA              391
#> 3 1961-03-01         NA              NA              419

sum(is.na(lag_1_12$passengers_lag1))
#> [1] 11
sum(is.na(lag_1_12$passengers_lag12))
#> [1] 0

future_data <- air |>
  future_frame(.date_var = date, .length_out = 12, .bind_data = TRUE) |>
  mutate(
    passengers_lag12 = lag(passengers, 12),
    passengers_lag24 = lag(passengers, 24),
    month = factor(month.abb[month(date)], levels = month.abb),
    t = row_number()
  ) |>
  filter(date >= as.Date("1961-01-01"))

sum(is.na(select(future_data, passengers_lag12, passengers_lag24)))
#> [1] 0
```

Look at January 1961. Its `passengers_lag12` is 417, the January 1960 value, and its `passengers_lag1` is 432, the December 1960 value. Both exist. For February 1961 the lag 12 is 391, but the lag 1 is NA, because it is the passengers of January 1961, which is the very number we are trying to forecast.

Counting the empty cells, `passengers_lag1` is missing in 11 of the 12 future rows, and `passengers_lag12` in none.

[KEY INSIGHT]
The smallest lag has to be at least as long as the forecast horizon. Then every predictor in the future rows is a value that already exists when the forecast is made, so one model can predict all 12 months at once.

Lags of 12 and 24 follow that rule. The second part of the code builds the 12 future rows for the real feature table, with the same lags, `month` and `t`, and `t` continues from 145 to 156. It finds 0 empty cells in the two lag columns, and we keep it as `future_data` for the final forecast.

There is another way to use short lags, called recursive forecasting, which feeds each forecast back in as the next month's lag. We do not build it here.

=== step === concept
## Splitting by date: the last 12 months as the test set

To score a forecast, we need months whose passengers the models have not seen. So we hold out the last 12 months, 1960, as the test set. That is the same length as the horizon. The other 108 months are the training set.

The function `time_series_split()` splits by date. `assess = "12 months"` sets the length of the test set, and `cumulative = TRUE` makes the training set every month before it. Then `training()` and `testing()` from rsample return the two parts.

```r
# Split the 120 rows by date: the last 12 months are the test set
library(rsample)

splits <- time_series_split(feat, date_var = date, assess = "12 months", cumulative = TRUE)
tr <- training(splits)
te <- testing(splits)

c(train = nrow(tr), test = nrow(te))
#> train  test
#>   108    12
range(tr$date)
#> [1] "1951-01-01" "1959-12-01"
range(te$date)
#> [1] "1960-01-01" "1960-12-01"
c(train_max = max(tr$passengers), test_max = max(te$passengers))
#> train_max  test_max
#>       559       622

splits |>
  tk_time_series_cv_plan() |>
  plot_time_series_cv_plan(date, passengers, .interactive = FALSE)
```

The training months run from January 1951 to December 1959, and the test months are all of 1960. The chart colours the two parts. The test months also go higher than any training month: 622 against 559.

A random split would be a mistake here. A test month from March 1955 would be scored by a model that trained on rows from 1956 to 1960, so the model would have seen months after the one it forecasts. That is **leakage**: information from after the forecast date reaching the model.

The date split avoids it. Every lag in a test row points at a month up to December 1959, so no test row uses a value from the test period.

=== step === concept
## Two benchmarks: seasonal naive and auto ARIMA

Before we fit a machine learning model, we need something to beat. A **benchmark** is a simple forecasting method. A machine learning model is worth its extra work only if its error on the test months is lower than the seasonal naive's.

The seasonal naive forecast for a month is the value of the same month a year earlier. The second benchmark is an ARIMA, and the engine `auto_arima` searches for the ARIMA order with the lowest AICc, a score that trades fit against the number of terms.

Both use the formula `passengers ~ date` on the 108 training months, so they work from the dates and the passengers only.

```r
# Fit a seasonal naive and an auto ARIMA on the 108 training months
library(modeltime)
library(parsnip)

m_snaive <- naive_reg(seasonal_period = 12) |>
  set_engine("snaive") |>
  fit(passengers ~ date, data = tr)

m_arima <- arima_reg() |>
  set_engine("auto_arima") |>
  fit(passengers ~ date, data = tr)

m_arima
#> parsnip model object
#>
#> Series: outcome
#> ARIMA(1,0,0)(0,1,0)[12] with drift
#>
#> Coefficients:
#>          ar1   drift
#>       0.7942  2.7806
#> s.e.  0.0631  0.4299
#>
#> sigma^2 = 118.8:  log likelihood = -365
#> AIC=736.01   AICc=736.27   BIC=743.7

predict(m_snaive, new_data = te)$.pred[1:3]
#> [1] 360 342 406
tail(tr$passengers, 12)[1:3]
#> [1] 360 342 406
```

The seasonal naive forecasts for the first three test months are 360, 342 and 406. Those are the January to March 1959 values, one year back, so January 1960 gets 360.

`auto_arima` chose ARIMA(1,0,0)(0,1,0)[12] with drift, and the name has three parts:

- The (1,0,0) part is one autoregressive (AR) term. Each month's change from a year earlier depends on the previous month's change from a year earlier.
- The (0,1,0)[12] part takes one seasonal difference at period 12, so the model works with each month minus the same month a year before.
- The word drift means a constant trend term is included.

=== step === concept
## Two machine learning models: glmnet and random forest

Now the two machine learning models. Both learn from the same feature table, so both need the same preparation first, and a **recipe** describes it.

`recipe(passengers ~ ., data = tr)` says `passengers` is the target and every other column is a predictor. `update_role(date, new_role = "id")` keeps `date` in the data as a row label, not a predictor, because `t` already carries the trend. And `step_dummy(month)` turns the month factor into 11 indicator columns of 0 and 1, one for each month except January, which is the baseline.

A **workflow** bundles a recipe with a model specification, so one `fit()` call prepares the data and fits the model.

The first model is glmnet, a linear regression with a penalty on its coefficients. `penalty = 0.5` sets how strongly the coefficients are shrunk, and `mixture = 0.5` blends the lasso and ridge penalties equally, which is called an elastic net. The lasso part can shrink a coefficient all the way to 0, while the ridge part only shrinks it. We set the penalty by hand and do not tune it.

The second model is a random forest of 200 trees. Each tree splits a random sample of the training months into groups using the predictor columns, and it forecasts a month with the average passengers of the sampled months in its group. The forest then averages the 200 trees.

The forest draws random samples, so `set.seed(2026)` comes before each fit and gives the same result every run.

```r
# Fit an elastic net and a random forest through the same recipe
library(recipes)
library(workflows)
library(randomForest)
library(glmnet)

rec <- recipe(passengers ~ ., data = tr) |>
  update_role(date, new_role = "id") |>
  step_dummy(month)

glmnet_spec <- linear_reg(penalty = 0.5, mixture = 0.5) |>
  set_engine("glmnet")

rf_spec <- rand_forest(trees = 200) |>
  set_engine("randomForest") |>
  set_mode("regression")

set.seed(2026)
wf_glmnet <- workflow() |>
  add_recipe(rec) |>
  add_model(glmnet_spec) |>
  fit(data = tr)

set.seed(2026)
wf_rf <- workflow() |>
  add_recipe(rec) |>
  add_model(rf_spec) |>
  fit(data = tr)

wf_glmnet |>
  extract_fit_parsnip() |>
  tidy() |>
  select(term, estimate) |>
  mutate(estimate = round(estimate, 2)) |>
  as.data.frame()
#>                term estimate
#> 1       (Intercept)    31.50
#> 2  passengers_lag12     0.56
#> 3  passengers_lag24     0.34
#> 4                 t     0.41
#> 5         month_Feb    -6.83
#> 6         month_Mar     1.25
#> 7         month_Apr     0.00
#> 8         month_May     3.81
#> 9         month_Jun    12.63
#> 10        month_Jul    23.34
#> 11        month_Aug    24.70
#> 12        month_Sep     7.37
#> 13        month_Oct     0.00
#> 14        month_Nov    -7.05
#> 15        month_Dec    -2.26
```

The table lists the glmnet coefficients. With the other columns held fixed, an extra thousand passengers in the same month a year earlier adds 0.56 thousand to the forecast, and in the same month two years earlier it adds 0.34. Each month that passes adds 0.41 through `t`.

July sits 23.3 above January and August sits 24.7 above it. `month_Apr` and `month_Oct` are 0, because the lasso part of the penalty removed them.

=== step === concept
## Comparing the four models on one modeltime accuracy table

Now the four fitted models go into one table. `modeltime_table()` holds models of different kinds together: the two benchmarks are parsnip fits and the other two are workflows. `update_model_description()` gives each one a short label.

Then `modeltime_calibrate(new_data = te)` forecasts the 12 test months with every model and stores the actuals and the errors, called residuals. And `modeltime_accuracy()` scores each model on those errors. We keep three metrics:

- **MAE**, the mean absolute error, is the average size of a miss, in thousands of passengers.
- **MAPE**, the mean absolute percentage error, is the average miss as a percent of the actual value.
- **RMSE**, the root mean squared error, squares the misses before averaging and takes the root afterwards, so one large miss counts for more than several small ones.

The last column divides each model's MAE by the seasonal naive's MAE, as a percent.

```r
# Put the four fits in one table, forecast the 12 test months and score them
tbl <- modeltime_table(m_snaive, m_arima, wf_glmnet, wf_rf) |>
  update_model_description(1, "seasonal naive") |>
  update_model_description(2, "ARIMA") |>
  update_model_description(3, "glmnet") |>
  update_model_description(4, "random forest")

cal <- tbl |>
  modeltime_calibrate(new_data = te)

acc <- cal |>
  modeltime_accuracy()

acc |>
  transmute(
    model = .model_desc,
    share_of_naive_mae = round(100 * mae / mae[1], 1),
    mae = round(mae, 1),
    mape = round(mape, 2),
    rmse = round(rmse, 1)
  ) |>
  select(model, mae, mape, rmse, share_of_naive_mae) |>
  as.data.frame()
#>            model  mae mape rmse share_of_naive_mae
#> 1 seasonal naive 47.8 9.99 50.7              100.0
#> 2          ARIMA 14.8 3.08 18.2               30.9
#> 3         glmnet 18.2 3.74 21.2               38.0
#> 4  random forest 39.1 7.43 52.3               81.8
```

Start with the MAE column. The seasonal naive is off by 47.8 thousand passengers a month on average. ARIMA is off by 14.8, which is 30.9% of that, and glmnet by 18.2, which is 38.0%. The random forest is off by 39.1, which is 81.8%.

Now the RMSE. The random forest's RMSE is 52.3, higher than the seasonal naive's 50.7, even though its MAE is lower. So a few large misses sit behind that MAE.

All four scores come from one window of 12 months, so each is a single evaluation of that model.

=== step === widget
## Reading each model's forecast errors by month

The accuracy table averages the misses. To see where they fall, we list the error for each test month. The error is the actual passengers minus the forecast, so a positive error means the forecast was too low.

The code below builds the errors for all four models. It prints each model's lowest error, highest error, and its errors in July and August, the two busiest months. The last lines print the random forest's forecasts for January and July 1960, and the highest 1960 forecast from the random forest and from glmnet.

```r
# Actual minus forecast, for each model and each of the 12 test months
err <- cal |>
  modeltime_residuals() |>
  transmute(
    model = .model_desc,
    month = month(.index),
    error = round(.residuals, 1)
  )

err |>
  group_by(model) |>
  summarise(
    lowest = min(error),
    highest = max(error),
    july = error[month == 7],
    august = error[month == 8]
  ) |>
  as.data.frame()
#>            model lowest highest  july august
#> 1          ARIMA  -37.7    33.7  33.7    8.2
#> 2         glmnet  -18.2    38.0  38.0    9.4
#> 3  random forest  -17.2   117.5 117.5  100.3
#> 4 seasonal naive   13.0    74.0  74.0   47.0

# The random forest forecasts for January and July 1960, and each model's highest 1960 forecast
forest_1960 <- predict(wf_rf, new_data = te)$.pred
glmnet_1960 <- predict(wf_glmnet, new_data = te)$.pred

round(forest_1960[c(1, 7)], 1)
#> [1] 415.2 504.5
round(c(forest = max(forest_1960), glmnet = max(glmnet_1960)), 1)
#> forest glmnet
#>  505.7  596.6
```

The widget plots all 48 errors in the `err` table, one point for each model and month. The x-axis is the month of 1960, from 1 to 12. Switch it to the `facet_wrap` view to get one panel per model.

::widget facet-grid {"data":[{"x":1,"y":57,"facet":"seasonal naive"},{"x":2,"y":49,"facet":"seasonal naive"},{"x":3,"y":13,"facet":"seasonal naive"},{"x":4,"y":65,"facet":"seasonal naive"},{"x":5,"y":52,"facet":"seasonal naive"},{"x":6,"y":63,"facet":"seasonal naive"},{"x":7,"y":74,"facet":"seasonal naive"},{"x":8,"y":47,"facet":"seasonal naive"},{"x":9,"y":45,"facet":"seasonal naive"},{"x":10,"y":54,"facet":"seasonal naive"},{"x":11,"y":28,"facet":"seasonal naive"},{"x":12,"y":27,"facet":"seasonal naive"},{"x":1,"y":-3.9,"facet":"ARIMA"},{"x":2,"y":-6.2,"facet":"ARIMA"},{"x":3,"y":-37.7,"facet":"ARIMA"},{"x":4,"y":17.9,"facet":"ARIMA"},{"x":5,"y":7.7,"facet":"ARIMA"},{"x":6,"y":20.9,"facet":"ARIMA"},{"x":7,"y":33.7,"facet":"ARIMA"},{"x":8,"y":8.2,"facet":"ARIMA"},{"x":9,"y":7.3,"facet":"ARIMA"},{"x":10,"y":17.2,"facet":"ARIMA"},{"x":11,"y":-8.1,"facet":"ARIMA"},{"x":12,"y":-8.5,"facet":"ARIMA"},{"x":1,"y":15.1,"facet":"glmnet"},{"x":2,"y":13,"facet":"glmnet"},{"x":3,"y":-18.2,"facet":"glmnet"},{"x":4,"y":35,"facet":"glmnet"},{"x":5,"y":23.3,"facet":"glmnet"},{"x":6,"y":23.6,"facet":"glmnet"},{"x":7,"y":38,"facet":"glmnet"},{"x":8,"y":9.4,"facet":"glmnet"},{"x":9,"y":16.2,"facet":"glmnet"},{"x":10,"y":22.7,"facet":"glmnet"},{"x":11,"y":0.1,"facet":"glmnet"},{"x":12,"y":3.7,"facet":"glmnet"},{"x":1,"y":1.8,"facet":"random forest"},{"x":2,"y":24.6,"facet":"random forest"},{"x":3,"y":-17.2,"facet":"random forest"},{"x":4,"y":39.3,"facet":"random forest"},{"x":5,"y":30.1,"facet":"random forest"},{"x":6,"y":54.5,"facet":"random forest"},{"x":7,"y":117.5,"facet":"random forest"},{"x":8,"y":100.3,"facet":"random forest"},{"x":9,"y":40.2,"facet":"random forest"},{"x":10,"y":31.4,"facet":"random forest"},{"x":11,"y":8.2,"facet":"random forest"},{"x":12,"y":3.9,"facet":"random forest"}],"geom":"point","x":"month of 1960","y":"actual minus forecast","facetVar":"model"}

In the seasonal naive panel, every point sits above 0, from 13 to 74. The series rises every year, so the value from a year earlier is always too low. The ARIMA errors run from -37.7 to 33.7, on both sides of 0. The glmnet errors peak at 38.0 in July and 9.4 in August.

The random forest has two points far above the rest: 117.5 in July and 100.3 in August.

Here is the reason. A random forest forecast is an average of training passengers, so no forecast can go above 559, the highest value in the training months. But July 1960 was 622. The random forest's highest forecast for 1960 is 505.7, in August, and its July forecast is 504.5.

The series keeps rising, so an average of past months falls below the months being forecast, and the summer months, where the actuals are highest, are missed by the most.

glmnet is linear, so its forecasts are not limited to the range of the training passengers, and its highest 1960 forecast is 596.6. The random forest does use `month`: its July forecast is 504.5 against 415.2 for January.

=== step === widget
## Refit on all 120 months and forecast 1961

The test months have done their job, which was scoring the four models. For the real forecast we put them back. The function `modeltime_refit()` fits each of the four models again on all 120 rows of the feature table, with the same specifications.

The ARIMA order is searched again, so it can change, and it does: the refitted ARIMA is (1,1,0)(0,1,0)[12]. Then `modeltime_forecast()` forecasts the 12 future rows in `future_data`, and `plot_modeltime_forecast()` draws the history with the four forecasts. The bands are 95% intervals built from the calibration residuals, the errors on the 12 test months.

Press Run. The refit takes a moment.

```r
# Refit all four models on the 120 months and forecast January to December 1961
set.seed(2026)
refit <- cal |>
  modeltime_refit(data = feat)

fc <- refit |>
  modeltime_forecast(new_data = future_data, actual_data = feat)

p <- plot_modeltime_forecast(fc, .interactive = FALSE)
suppressWarnings(print(p))

fc |>
  filter(.key == "prediction") |>
  group_by(.model_desc) |>
  summarise(total_1961 = round(sum(.value))) |>
  as.data.frame()
#>                       .model_desc total_1961
#> 1 UPDATE: ARIMA(1,1,0)(0,1,0)[12]       6041
#> 2                          glmnet       6189
#> 3                   random forest       5884
#> 4                  seasonal naive       5714
```

The last lines print the 12-month total for 1961 from each model, in thousands of passengers. modeltime marks the refitted ARIMA with UPDATE and the order it found this time.

The seasonal naive total is 5,714, the 1960 total, because it repeats last year. ARIMA gives 6,041, glmnet 6,189 and the random forest 5,884.

The table below shows the same forecasts month by month, with a total row. Toggle it to see the raw values and then the formatted table.

::widget styled-table {"cols":["month","seasonal naive","ARIMA","glmnet","random forest"],"rows":[["Jan",417.0,444.3,451.4,455.4],["Feb",391.0,418.2,423.6,416.9],["Mar",419.0,446.2,467.2,465.5],["Apr",461.0,488.2,491.8,489.6],["May",472.0,499.2,510.0,501.4],["Jun",535.0,562.2,573.1,536.7],["Jul",622.0,649.2,662.2,561.6],["Aug",606.0,633.2,655.0,554.5],["Sep",508.0,535.2,549.3,523.1],["Oct",461.0,488.2,497.1,486.3],["Nov",390.0,417.2,431.9,430.1],["Dec",432.0,459.2,476.0,463.1],["Total",5714.0,6040.8,6188.6,5884.3]],"formats":{"seasonal naive":"comma","ARIMA":"comma","glmnet":"comma","random forest":"comma"},"title":"Forecast of monthly passengers for 1961, in thousands","note":"All four models were refitted on 120 months. The total row adds the 12 monthly forecasts."}

July 1961 is 622 for the seasonal naive, 649 for ARIMA, 662 for glmnet and 562 for the random forest. So the random forest is the lowest in July again.

No 1961 actuals exist yet, so this table cannot be scored. The evidence for how good each model is comes from the 12 test months of 1960.

=== step === quiz
## Quick check: why is the random forest's MAE close to the seasonal naive's?

In the accuracy table the random forest's MAE is 39.1, against 47.8 for the seasonal naive, and its July 1960 forecast is 117.5 below the actual. What explains that?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It ignores the `month` column, so it cannot tell July from January. ::no
- A random forest forecast is an average of training passengers, so on a rising series its forecasts stay below the actuals in the summer months. ::ok Yes. Its highest 1960 forecast is 505.7 and no forecast can pass 559, the highest training value, while July 1960 was 622. The July forecast of 504.5 sits 117.5 below the actual.
- 200 trees are too few, so the average has not settled. ::no
- Refitting on all 120 months removes the gap, so its 1961 forecast agrees with the other models. ::no Each of these is contradicted by the numbers. The random forest's July forecast (504.5) is above its January forecast (415.2), so it uses `month`. With 1,000 trees the MAE is 39.3, so more trees do not help. And after the refit, its July 1961 forecast is 562 against 649 for ARIMA and 662 for glmnet. The cause is the averaging: a random forest forecast is an average of training passengers, so on a rising series it falls below the months being forecast.

=== step === tryit
## Your turn: build the feature rows for a 6-month horizon

Suppose the planner only needs the next 6 months. The starter below builds the 6 future rows with a lag of 1 and counts the empty lag cells among them. With `lag(passengers, 1)` the count is 5, because only the first future month has a lag 1 that exists.

Change the lag so the count is 0. Press Check when it is.

```r
# Choose a lag that is known for every one of the 6 future months
library(dplyr)
library(timetk)

future_6 <- air |>
  future_frame(.date_var = date, .length_out = 6, .bind_data = TRUE) |>
  mutate(passengers_lag = lag(passengers, 1)) |>
  filter(is.na(passengers))

sum(is.na(future_6$passengers_lag))
```
::check {"regex": "lag[(]passengers,\\s*(n\\s*=\\s*)?([6-9]|[1-9][0-9]+)\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Yes: the count is 0. The lag is at least the 6-month horizon, so every lag cell in the future rows points at a month that has already happened.", "no": "The count is still above 0. A lag cell in a future row is filled only if it points at a month up to the end of the data, so the lag has to be at least 6, the horizon. Try lag(passengers, 6)."}
::solution
```r
# A lag of 6 equals the 6-month horizon, so no lag cell is empty
library(dplyr)
library(timetk)

future_6 <- air |>
  future_frame(.date_var = date, .length_out = 6, .bind_data = TRUE) |>
  mutate(passengers_lag = lag(passengers, 6)) |>
  filter(is.na(passengers))

sum(is.na(future_6$passengers_lag))
#> [1] 0
```

Any lag of at least 6 gives 0. A lag of 5 still leaves 1 empty cell, because the sixth future month would need the passengers of the first future month.

=== step === concept
## References
::prose-only a list of sources, nothing to draw

- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos (2021), OTexts. The chapters on benchmark methods and on evaluating forecast accuracy.
- [modeltime documentation](https://business-science.github.io/modeltime/) - Dancho, Business Science. The functions for building a modeltime table, calibrating, scoring, refitting and forecasting.
- [timetk documentation](https://business-science.github.io/timetk/) - Dancho, Business Science. The reference for `future_frame()`, `time_series_split()` and the split plots.
- [Regularization Paths for Generalized Linear Models via Coordinate Descent](https://doi.org/10.18637/jss.v033.i01) - Friedman, Hastie and Tibshirani (2010), Journal of Statistical Software 33(1). The paper behind glmnet and the elastic net.
- Time Series Analysis: Forecasting and Control - Box, Jenkins and Reinsel (1976), Holden-Day. The source of the airline passengers series.

=== step === complete
## Quick recap

You turned a monthly series into a feature table, fit four models on the same rows and scored them on the same 12 months. To summarize:

- A lag column is usable only if its smallest lag is at least the forecast horizon. With a horizon of 12, lags 12 and 24 are known for all 12 future months, while lag 1 was missing in 11 of them.
- The split follows the calendar: 108 months to train and the last 12 to test. A random split would train on months after the ones it scores.
- One modeltime table scored the benchmarks and the machine learning models the same way. The MAE on the 12 test months was 14.8 for ARIMA, 18.2 for glmnet, 39.1 for the random forest and 47.8 for the seasonal naive.
- glmnet's MAE is 38% of the seasonal naive's, so it beats that benchmark, but it stays behind ARIMA, 18.2 against 14.8. The random forest's MAE is 82% of the seasonal naive's.
- A random forest forecast is an average of training passengers, so on a rising series its forecasts fall below the actuals. In July 1960 it missed by 117.5.

So for this series, ARIMA is the model to beat, and glmnet is the machine learning model that comes closest.

In the next part, we fit gradient boosted trees on this kind of feature table and look at why trees cannot follow a trend.

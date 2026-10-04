---
title: "Production Forecasting Lesson 6: Deploying a forecasting service"
catalog_blurb: "What it takes to let another system safely request a forecast."
description: "Design a forecasting service's request and response contract, validate bad input, version the model with vetiver, and learn what earns trust in production."
keywords: "forecasting service, model deployment, vetiver, pins, plumber R, model versioning, API contract, request validation, MLOps, production forecasting, R"
post_type: "LESSON"
curriculum_id: "5.160.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-production"
course_title: "Production Forecasting"
course_lesson: "6"
course_total: "6"
course_landing: "Production-Forecasting-Course.html"
course_next: ""
course_prev: "Scaling-fable-and-fabletools.html"
---

=== step === cover
## Deploying a forecasting service

Today we're looking at what it actually takes to hand a forecasting model over to another piece of software, one that will call it every single morning with nobody standing by to catch a mistake.

Birchwood Grocers runs 4 grocery stores. Every morning, its replenishment system decides how much fresh milk to order for the next delivery truck, and for store 4 that decision leans on a forecast of how many cartons of milk the store will sell. The store has 730 days, two full years, of daily sales on record, starting 2024-01-01.

Here is the last 70 days of that record, the part closest to today.

::widget chart-plotter {"data":[{"x":"2025-10-22","y":133},{"x":"2025-10-23","y":119},{"x":"2025-10-24","y":140},{"x":"2025-10-25","y":163},{"x":"2025-10-26","y":181},{"x":"2025-10-27","y":119},{"x":"2025-10-28","y":138},{"x":"2025-10-29","y":139},{"x":"2025-10-30","y":135},{"x":"2025-10-31","y":132},{"x":"2025-11-01","y":182},{"x":"2025-11-02","y":170},{"x":"2025-11-03","y":125},{"x":"2025-11-04","y":138},{"x":"2025-11-05","y":147},{"x":"2025-11-06","y":132},{"x":"2025-11-07","y":142},{"x":"2025-11-08","y":174},{"x":"2025-11-09","y":192},{"x":"2025-11-10","y":136},{"x":"2025-11-11","y":135},{"x":"2025-11-12","y":144},{"x":"2025-11-13","y":129},{"x":"2025-11-14","y":137},{"x":"2025-11-15","y":176},{"x":"2025-11-16","y":163},{"x":"2025-11-17","y":125},{"x":"2025-11-18","y":146},{"x":"2025-11-19","y":156},{"x":"2025-11-20","y":141},{"x":"2025-11-21","y":131},{"x":"2025-11-22","y":174},{"x":"2025-11-23","y":163},{"x":"2025-11-24","y":131},{"x":"2025-11-25","y":133},{"x":"2025-11-26","y":125},{"x":"2025-11-27","y":146},{"x":"2025-11-28","y":135},{"x":"2025-11-29","y":176},{"x":"2025-11-30","y":164},{"x":"2025-12-01","y":144},{"x":"2025-12-02","y":143},{"x":"2025-12-03","y":130},{"x":"2025-12-04","y":136},{"x":"2025-12-05","y":136},{"x":"2025-12-06","y":166},{"x":"2025-12-07","y":179},{"x":"2025-12-08","y":142},{"x":"2025-12-09","y":128},{"x":"2025-12-10","y":140},{"x":"2025-12-11","y":137},{"x":"2025-12-12","y":131},{"x":"2025-12-13","y":177},{"x":"2025-12-14","y":163},{"x":"2025-12-15","y":130},{"x":"2025-12-16","y":150},{"x":"2025-12-17","y":137},{"x":"2025-12-18","y":137},{"x":"2025-12-19","y":147},{"x":"2025-12-20","y":175},{"x":"2025-12-21","y":167},{"x":"2025-12-22","y":130},{"x":"2025-12-23","y":134},{"x":"2025-12-24","y":133},{"x":"2025-12-25","y":136},{"x":"2025-12-26","y":144},{"x":"2025-12-27","y":190},{"x":"2025-12-28","y":171},{"x":"2025-12-29","y":139},{"x":"2025-12-30","y":123}],"geoms":["line"],"x":"date","y":"cartons","code":{"line":"ggplot(milk_sales[661:730, ], aes(date, cartons)) +\n  geom_line()"}}

Notice the ridge-and-valley pattern: cartons dip during the week and jump on weekends, while the whole line drifts upward, a little higher every week, across those 70 days. Somewhere, every single morning, something has to ask for tomorrow's number, safely, with nobody checking it by eye.

=== step === concept
## What changes when a machine asks instead of a person

Picture the forecast living the ordinary way first: as a script, forecast.R, that an analyst runs by hand each morning. They open it, run it, and glance at the number before sending it anywhere. If the date looks wrong, or the number comes out negative, they notice, and they fix it before it reaches anyone.

Now picture Birchwood's actual setup: the replenishment system calls the forecast automatically, at 6am, with nobody watching. Nobody glances at the number. Nobody notices if the date was typed wrong. Whatever comes back gets used to decide how much milk gets ordered.

That difference, a person in the loop versus nobody in the loop, is what changes when you serve a model instead of running it by hand. Three things that the analyst's habits used to cover for now have to be built into the service itself.

1. A fixed shape for what goes in and what comes back, a request and a response, agreed on in advance, since the caller is code and code cannot read a column header to work out what a number means.
2. Handling of bad input, since nobody is there to notice a typo or a nonsense request before it reaches the model.
3. Being available whenever the caller asks, with nobody around to restart it if it falls over overnight.

A contract, handling bad input, and staying available: those three things are what turn a fitted model sitting in an analyst's R session into a forecasting service.

=== step === concept
## The contract: what goes in, what comes back

A contract is just an agreement, written down precisely enough that two separate pieces of software, Birchwood's replenishment system and the forecasting service, can talk to each other without a person translating in between.

The request, what the replenishment system sends, has 3 fields:

- **store_id**: which of Birchwood's 4 stores the forecast is for.
- **as_of_date**: the last day of actual sales the forecast should count as known, the date everything is forecast forward from.
- **horizon_days**: how many days ahead to forecast, starting the day after as_of_date.

The response, what the service sends back, has 7 fields. Four of them, store_id, date, forecast, and the interval bounds, are the actual answer. The other three exist for a reason that matters once something goes wrong: **model_version** names exactly which version of the model produced this forecast, and **generated_at** records exactly when. Months later, if a forecast turns out to have been badly wrong, those two fields are what let someone trace it back to one exact model and one exact run, instead of shrugging and guessing.

Here is the full contract, with one real example of each field filled in.

::widget styled-table {"cols":["Direction","Field","Type","Example"],"rows":[["Request","store_id","integer","4"],["Request","as_of_date","date (YYYY-MM-DD)","2025-12-30"],["Request","horizon_days","integer","7"],["Response","store_id","integer","4"],["Response","date","date (YYYY-MM-DD)","2025-12-31"],["Response","forecast","numeric","139.5"],["Response","lower","numeric","125.5"],["Response","upper","numeric","153.5"],["Response","model_version","string","v3"],["Response","generated_at","datetime (ISO 8601)","2025-12-31T06:00:00Z"]],"title":"The Birchwood forecasting service contract","note":"The response row shown is for horizon day 1 (2025-12-31): a real 7-day request returns one row like this per day."}

Read the example response row as one sentence: as of 2025-12-30, store 4 is forecast to sell 139.5 cartons on 2025-12-31, somewhere between 125.5 and 153.5, according to model version v3, generated at 06:00 UTC that morning. Every part of that sentence is a field in the table above. Nothing in the response is free-floating; every number names what it belongs to and where it came from.

=== step === concept
## What happens on a bad request

A contract only says what a well-formed request looks like. It says nothing about what the service should do when a request is not well-formed, and with nobody watching at 6am, a bad request is no longer rare, it is routine. Three ways Birchwood's service can get a bad request:

1. **store_id = 9.** Birchwood only has 4 stores, so this store does not exist.
2. **horizon_days = 60.** The model is only checked out to be reliable 14 days ahead. Beyond that, the forecast is not trustworthy, so the service should refuse rather than guess.
3. **A missing as_of_date.** Without a reference date, the service has no idea which days to forecast.

A service that crashes on any of these is unusable, since a crash gives the replenishment system nothing to work with. A service that silently predicts anyway, or quietly returns 0, is worse: it looks like an answer, and the replenishment system will act on it. The right response is a structured error that names exactly which field was wrong and why, so whatever is calling the service can tell the difference between a real forecast and a rejected request.

validate_request() below checks a request before anything gets predicted. Press Run to see it reject all 3 bad requests, and let one good one through.

```r
# Define Birchwood's known stores, the longest trustworthy horizon, and the request checker
known_stores <- 1:4
MAX_HORIZON <- 14

validate_request <- function(store_id, as_of_date, horizon_days) {
  if (!(store_id %in% known_stores)) {
    return(list(field = "store_id", code = "unknown_store",
                message = paste("store_id", store_id, "is not one of Birchwood's stores")))
  }
  if (is.na(as_of_date)) {
    return(list(field = "as_of_date", code = "missing_field",
                message = "as_of_date is required"))
  }
  if (horizon_days < 1 || horizon_days > MAX_HORIZON) {
    return(list(field = "horizon_days", code = "horizon_out_of_range",
                message = paste("horizon_days must be between 1 and", MAX_HORIZON)))
  }
  NULL
}

# Try 3 bad requests, then one good one
validate_request(store_id = 9, as_of_date = "2025-12-30", horizon_days = 7)
validate_request(store_id = 4, as_of_date = "2025-12-30", horizon_days = 60)
validate_request(store_id = 4, as_of_date = NA, horizon_days = 7)
validate_request(store_id = 4, as_of_date = "2025-12-30", horizon_days = 7)
#> $field
#> [1] "store_id"
#> 
#> $code
#> [1] "unknown_store"
#> 
#> $message
#> [1] "store_id 9 is not one of Birchwood's stores"
#> 
#> $field
#> [1] "horizon_days"
#> 
#> $code
#> [1] "horizon_out_of_range"
#> 
#> $message
#> [1] "horizon_days must be between 1 and 14"
#> 
#> $field
#> [1] "as_of_date"
#> 
#> $code
#> [1] "missing_field"
#> 
#> $message
#> [1] "as_of_date is required"
#> 
#> NULL
```

Each of the 3 bad requests returns a list with the same 3 fields: which field was wrong, a short code for it, and a readable message. The 4th call, the good one, returns `NULL`, which is how validate_request() says "nothing wrong here, go ahead and predict." A real service checks for that `NULL` before it does anything else: no error means predict, an error means stop and send the error back instead.

=== step === quiz
## Quick check: the right response to a bad request

A request for store_id = 9 arrives at Birchwood's service. Store 9 does not exist.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Predict anyway, using store 4's model, since it is the most recently trained one ::no
- Return a structured error that names store_id as the bad field, and predict nothing ::ok Exactly right. A request for a store Birchwood does not have should never reach the model. validate_request() catches it first and hands back the field that failed, so whoever sent the request knows exactly what to fix.
- Return a forecast of 0 cartons for every day in the horizon ::no
- Let the function crash with R's default error message ::no A crash and a silent wrong number both leave the replenishment system no better off: one gets nothing back, the other gets an answer that looks real but is not. A structured error, naming the exact field that failed, is the only response that lets the caller fix the problem instead of guessing at it.

=== step === concept
## Fitting the model that will be served

Before any of this matters, there has to be a model to serve. Birchwood's store 4 has 730 days of daily cartons sold, with a clear weekday and weekend pattern and a slow upward trend, the same shape you saw on the cover.

Press Run to build that data and fit the regression the service will actually call.

```r
# Build store 4's 2 years of daily milk-carton sales, and fit the model the service will call
set.seed(5160)
dates <- seq(as.Date("2024-01-01"), by = "day", length.out = 730)
day_index <- 1:730
is_weekend <- weekdays(dates) %in% c("Saturday", "Sunday")
cartons <- round(100 + day_index * 40 / 729 + ifelse(is_weekend, 30, 0) + rnorm(730, 0, 8))
cartons <- pmax(cartons, 0)
milk_sales <- data.frame(date = dates, day_index = day_index, is_weekend = is_weekend, cartons = cartons)

fit <- lm(cartons ~ day_index + is_weekend, data = milk_sales)
summary(fit)
#> 
#> Call:
#> lm(formula = cartons ~ day_index + is_weekend, data = milk_sales)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -26.6876  -5.5201  -0.3069   5.4605  31.4957 
#> 
#> Coefficients:
#>                 Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)    1.002e+02  6.569e-01  152.48   <2e-16 ***
#> day_index      5.382e-02  1.487e-03   36.20   <2e-16 ***
#> is_weekendTRUE 3.000e+01  6.941e-01   43.22   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 8.465 on 727 degrees of freedom
#> Multiple R-squared:  0.8145,  Adjusted R-squared:  0.814 
#> F-statistic:  1596 on 2 and 727 DF,  p-value: < 2.2e-16
```

R prints those coefficient estimates in scientific notation because of how differently sized they are: `1.002e+02` is 100.2, `5.382e-02` is 0.05382, and `3.000e+01` is 30.00. Read plainly, the model says: start at about 100.2 cartons, add about 0.054 cartons for every day that passes, and add 30.0 more on top of that for any day that falls on a Saturday or Sunday. R names that last coefficient `is_weekendTRUE` rather than `is_weekend`, because `is_weekend` is a logical column, TRUE or FALSE, and R always tacks the level's name onto a logical or categorical predictor in its coefficient table.

Residual standard error, 8.465, is the typical size of a miss, in cartons: on an ordinary day, the actual count lands about 8 or 9 cartons away from what the line predicts. That is exactly the day-to-day noise store 4's sales were built with. This fitted line, `fit`, is the object the forecasting service is actually going to call every morning.

=== step === concept
## Reading the forecast and its prediction interval

A single point forecast is not enough for a replenishment decision; Birchwood also needs to know how much that forecast could be off by. That is what a prediction interval gives you: a range, not just a point, with some stated chance that the true number falls inside it.

Press Run to forecast the next 7 days from fit, with a 90% prediction interval around each one.

```r
# Forecast the next 7 days, with a 90% prediction interval around each one
future <- data.frame(day_index = 731:737)
future$date <- max(milk_sales$date) + 1:7
future$is_weekend <- weekdays(future$date) %in% c("Saturday", "Sunday")

forecast <- predict(fit, newdata = future, interval = "prediction", level = 0.90)
forecast_tbl <- cbind(future, round(forecast, 1))
forecast_tbl
#>   day_index       date is_weekend   fit   lwr   upr
#> 1       731 2025-12-31      FALSE 139.5 125.5 153.5
#> 2       732 2026-01-01      FALSE 139.6 125.6 153.5
#> 3       733 2026-01-02      FALSE 139.6 125.6 153.6
#> 4       734 2026-01-03       TRUE 169.7 155.7 183.7
#> 5       735 2026-01-04       TRUE 169.7 155.7 183.7
#> 6       736 2026-01-05      FALSE 139.8 125.8 153.8
#> 7       737 2026-01-06      FALSE 139.8 125.8 153.8
```

`interval = "prediction"` is what asks for a prediction interval rather than a confidence interval: it widens the band to cover the model's residual noise, 8.465 cartons worth, on top of the usual uncertainty about where the line itself sits. `level = 0.90` sets how much of that uncertainty the band is built to cover, 90%, which is why each row's upper bound sits about 14 cartons above its forecast and the lower bound about 14 cartons below.

Now compare day 731 and day 737 specifically. Day 731's interval runs 125.5 to 153.5, a width of 28.0. Day 737's interval runs 125.8 to 153.8, also 28.0 at this rounding, though the unrounded numbers (27.965 versus 27.967) do creep apart in the third decimal place.

That tiny movement, not the dramatic widening you might expect, is itself worth understanding. A prediction interval widens the further a forecast sits from the middle of the training data, because that is where the fitted line is least precisely pinned down. Birchwood trained this model on 730 days, so day 731 and day 737 are both still extremely close to that middle, and the interval barely moves between them. Fit the same model on 30 days of history instead of 730, and the same 7-day step out would widen the interval far more visibly, because each of those days would sit much further out, relative to how little data anchors the line.

One more sentence says more than the row-by-row numbers. Here is the last 30 days of actual sales, with the 7-day forecast and its prediction interval laid on top.

```r
# Plot the last 30 days of history with the 7-day forecast and its prediction interval
library(ggplot2)

history <- tail(milk_sales, 30)

ggplot() +
  geom_line(data = history, aes(date, cartons)) +
  geom_ribbon(data = forecast_tbl, aes(x = date, ymin = lwr, ymax = upr), alpha = 0.2) +
  geom_line(data = forecast_tbl, aes(x = date, y = fit), color = "blue") +
  labs(x = "Date", y = "Cartons of milk sold", title = "Store 4: last 30 days plus a 7-day forecast")
```

The black line is what actually happened. The blue line is the forecast, continuing the same weekday-weekend pattern forward. The shaded ribbon is the 90% prediction interval, a steady band running alongside the forecast line rather than flaring open, for exactly the reason just covered.

=== step === concept
## Versioning the model so a forecast can be traced to what produced it

Right now, `fit` is just an R object sitting in memory. Close this session and it is gone. Retrain it tomorrow on a new day of sales, and there is no record of what the model looked like today, the one that actually produced this morning's forecast. For a service other people's decisions depend on, that is not good enough.

The **vetiver** package's first job is to describe a fitted model so it can be handed off. `vetiver_model()` wraps `fit` with a name and a description of its inputs.

```r
# Wrap the fitted model with a name and a description of its inputs
suppressMessages(library(vetiver))
v <- vetiver_model(fit, "birchwood-store4-milk")
v
#> 
#> ── birchwood-store4-milk ─ <butchered_lm> model for deployment 
#> An OLS linear regression model using 2 features
```

That banner is vetiver describing `fit` back to you: an ordinary least squares regression, with 2 features, day_index and is_weekend. Wrapping it does not change what the model predicts. It changes what travels alongside it: a name, a description, and a record of the columns it expects.

The second package, **pins**, is what actually keeps a history. You write a model to a pins board under a name, and the next time you write a model under that same name, pins does not overwrite the old one. It keeps it, and numbers the new one as the next version. Real pin versions are not called v1, v2, v3; `pin_versions()` returns a short string stamped with a timestamp and a content hash, something like `20261004T044909Z-c66a5`. This lesson labels them v1, v2 and v3 instead, so the version named in a response is easy to read at a glance.

Here are the 3 versions Birchwood has pinned for store 4's model so far, each one a separate call to `vetiver_pin_write()` on a separate retraining date.

::widget styled-table {"cols":["Version","Created","Training RMSE"],"rows":[["v1","2024-03-31","16.14"],["v2","2024-10-27","8.52"],["v3","2025-12-31","8.45"]],"title":"Store 4 pinned model versions","note":"v1 was trained before the weekend pattern was added as a predictor. v2 added is_weekend. v3 is the current fit, trained on all 730 days."}

RMSE, root mean squared error, is the typical size of a training miss in cartons, the same idea as the residual standard error from a few steps back. v1 missed by about 16 cartons a day, because it only used day_index and had no way to explain the weekend jump. Adding is_weekend to v2 cut that roughly in half, to 8.52. v3, trained on the full 2 years and identical to the `fit` object from before, lands at 8.45, barely different from v2: once the right predictor is in the model, more history mostly just confirms the same answer rather than improving it further.

And this is the piece that makes a forecast traceable. The response's `model_version` field names one of these exact rows. See "v3" in a response, and you know precisely which training run produced it, what RMSE it had going in, and the exact day it was created.

=== step === concept
## Serving the model with plumber, and the operational habits that earn trust

Versioning answers what produced a forecast. It does not answer how the replenishment system actually gets one at 6am. That is **plumber**'s job: turning an ordinary R function into something another program can call over the network.

Here is the plumber.R file that would serve store 4's forecast. It is explained and shown, not run here, because serving an API means keeping a process listening for requests indefinitely, not evaluating a block of code once: run it on your own machine instead.

```r-static
# plumber.R: wraps validate_request() and the pinned model behind one HTTP endpoint
library(plumber)
library(vetiver)
library(pins)

board <- board_folder("birchwood-model-board")
v <- vetiver_pin_read(board, "birchwood-store4-milk", version = "v3")

#* Forecast cartons of milk for one Birchwood store
#* @param store_id The store to forecast for (1 to 4)
#* @param as_of_date The last day of known sales, as YYYY-MM-DD
#* @param horizon_days How many days ahead to forecast (1 to 14)
#* @post /forecast
function(store_id, as_of_date, horizon_days) {
  store_id <- as.integer(store_id)
  horizon_days <- as.integer(horizon_days)

  error <- validate_request(store_id, as_of_date, horizon_days)
  if (!is.null(error)) {
    return(list(error = error))
  }

  future <- data.frame(date = as.Date(as_of_date) + seq_len(horizon_days))
  future$is_weekend <- weekdays(future$date) %in% c("Saturday", "Sunday")

  pred <- predict(v$model, newdata = future, interval = "prediction", level = 0.90)

  list(
    store_id = store_id,
    date = as.character(future$date),
    forecast = unname(pred[, "fit"]),
    lower = unname(pred[, "lwr"]),
    upper = unname(pred[, "upr"]),
    model_version = "v3",
    generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
  )
}

# Run this on your own machine, not in a browser:
# plumber::plumb("plumber.R")$run(port = 8000)
```

Each `#*` line above is an annotation, a comment plumber reads to build the endpoint: `@param` documents one request field, and `@post /forecast` says this function answers a POST request sent to `/forecast`. `plumber::plumb("plumber.R")$run()` is what reads the whole file and starts the service listening. From there, calling `/forecast` is calling the function, with validate_request() and the pinned model both running inside it, exactly as shown in the earlier steps.

Getting the file running is not the same as earning anyone's trust in what it returns. Three operational habits decide that, and all three live in the gap between "it runs" and "people rely on it."

- **Latency.** The pinned model is loaded into memory once, when the service starts, not re-read from the pins board on every single request. Birchwood's replenishment system waits for an answer at 6am; a service that reads a model file from disk on every call would be needlessly slow for no benefit.
- **Logging.** Every request gets recorded: the model_version that answered it, the input it was given, and how long it took to respond. Without that, a forecast that turns out wrong weeks later is a dead end. With it, it traces back to one exact version and one exact run.
- **Rollback.** Because every version stays pinned, never overwritten, the previous version is always one step away. If a newly retrained model starts forecasting badly, the service can point back at the version before it immediately, with nobody retraining under pressure to make the bad morning stop.

Here is the full cycle those three habits sit inside, from one retrain to the next.

::widget process-flow {"steps":[{"title":"Retrain","sub":"fit cartons ~ day_index + is_weekend again on the latest sales"},{"title":"Pin a new version","sub":"vetiver_pin_write() adds it to the board; every earlier version stays"},{"title":"plumber loads it","sub":"the service reads the newest pinned version into memory once"},{"title":"The replenishment system requests","sub":"calls POST /forecast every morning at 6am, nobody watching"},{"title":"Log the request and response","sub":"record model_version, the input, the forecast, and the response time"},{"title":"Roll back if the new version is wrong","sub":"point the service at the previous pinned version while it is investigated"}]}

Notice where rollback sits: it is not a separate emergency procedure bolted on afterward, it is just the last arrow in the same cycle every retrain already goes through.

=== step === quiz
## Quick check: what a trustworthy forecasting service needs

Birchwood retrains store 4's model, plumber starts serving the new version, and within a day its forecasts are consistently low.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Retrain again immediately, on the bad day's data ::no
- Shut the service down until someone has time to fix it ::no
- Serve the previous pinned version again while the new one is investigated ::ok Right. Because every version stayed pinned, rolling back costs nothing more than pointing the service at the old version again, and Birchwood's forecasts go back to normal while someone works out what went wrong with the new one.
- Average the new model's forecast with the old model's forecast ::no Retraining again right away usually teaches the model the same mistake a second time, on data from the very day things went wrong. Averaging a known-bad model with a known-good one still ships a worse forecast than the good one alone. And shutting the service off entirely means the replenishment system gets no forecast at all tomorrow morning. Rolling back to the last pinned version is the only option that is both immediate and safe, which is the entire reason versions get pinned in the first place.

=== step === tryit
## Your turn: reject the request the service should never answer

known_stores, MAX_HORIZON and validate_request() are already sitting in your session. One check is missing from the function below: the one that rejects a horizon_days outside Birchwood's trusted range, 1 to MAX_HORIZON. Replace the `____` with that condition, then press Check.

```r
# Complete the one check that rejects a horizon_days outside Birchwood's trusted range
validate_request <- function(store_id, as_of_date, horizon_days) {
  if (!(store_id %in% known_stores)) {
    return(list(field = "store_id", code = "unknown_store",
                message = paste("store_id", store_id, "is not one of Birchwood's stores")))
  }
  if (is.na(as_of_date)) {
    return(list(field = "as_of_date", code = "missing_field",
                message = "as_of_date is required"))
  }
  if (____) {
    return(list(field = "horizon_days", code = "horizon_out_of_range",
                message = paste("horizon_days must be between 1 and", MAX_HORIZON)))
  }
  NULL
}

# Try it on a request that asks 21 days ahead
validate_request(store_id = 4, as_of_date = "2025-12-30", horizon_days = 21)
```
::check {"regex": "(horizon_days\\s*[<]\\s*1[\\s\\S]*horizon_days\\s*[>]\\s*MAX_HORIZON)|(horizon_days\\s*[>]\\s*MAX_HORIZON[\\s\\S]*horizon_days\\s*[<]\\s*1)", "gate": true, "difficulty": "intermediate", "ok": "That's it: horizon_days = 21 falls outside 1 to 14, so validate_request() now returns the horizon_days error instead of predicting 21 days ahead on a model only ever checked out to 14.", "no": "The condition needs both bounds: horizon_days less than 1, or horizon_days greater than MAX_HORIZON. Try: horizon_days < 1 || horizon_days > MAX_HORIZON"}
::solution
```r
# The complete check, with both bounds of the trusted horizon filled in
validate_request <- function(store_id, as_of_date, horizon_days) {
  if (!(store_id %in% known_stores)) {
    return(list(field = "store_id", code = "unknown_store",
                message = paste("store_id", store_id, "is not one of Birchwood's stores")))
  }
  if (is.na(as_of_date)) {
    return(list(field = "as_of_date", code = "missing_field",
                message = "as_of_date is required"))
  }
  if (horizon_days < 1 || horizon_days > MAX_HORIZON) {
    return(list(field = "horizon_days", code = "horizon_out_of_range",
                message = paste("horizon_days must be between 1 and", MAX_HORIZON)))
  }
  NULL
}

validate_request(store_id = 4, as_of_date = "2025-12-30", horizon_days = 21)
#> $field
#> [1] "horizon_days"
#> 
#> $code
#> [1] "horizon_out_of_range"
#> 
#> $message
#> [1] "horizon_days must be between 1 and 14"
```

`horizon_days < 1 || horizon_days > MAX_HORIZON` is true whenever the request asks for fewer than 1 day or more than 14. 21 clears the second half of that condition, so the function returns the horizon_days error instead of ever reaching predict().

=== step === concept
## References

- [vetiver R package documentation, "Version and deploy a model"](https://vetiver.posit.co/) - Posit. vetiver_model() and reading a version back from a served prediction.
- [pins R package documentation](https://pins.rstudio.com/) - Posit. board_folder() and versioned pins.
- [plumber R package documentation, "Quickstart"](https://www.rplumber.io/) - the #* annotations that turn an R function into an HTTP endpoint.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman, R.J. and Athanasopoulos, G. The chapters on prediction intervals and on evaluating and producing forecasts.
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/) - Google, 2016. The chapters on monitoring distributed systems and on managing a rollout, the source for this lesson's latency, logging and rollback framing.

=== step === complete
## What you can do now
::prose-only closing recap only, restating the lesson's own numbers, no new facts

You can now describe, end to end, what turns a fitted model into something another system can call safely.

- A **contract**: a fixed set of request fields (store_id, as_of_date, horizon_days) and response fields (store_id, date, forecast, lower, upper, model_version, generated_at), agreed on in advance.
- **Validated input**: a function that checks store_id against the known stores, horizon_days against the trusted range of 1 to 14, and as_of_date against being present at all, before anything gets predicted.
- A **versioned, traceable model**: vetiver_model() describes a fitted model, a pins board keeps every version ever written, and a model_version field in a response names exactly which one answered it. Store 4's 3 versions went from 16.14 to 8.52 to 8.45 training RMSE as the right predictor, then more history, went in.
- A **served endpoint**: plumber turns validate_request(), the pinned model, and the response contract into one function other software can call over the network.
- The **operational habits that earn trust**: latency (load the model once, not per request), logging (record model_version and response time on every call), and rollback (the previous pinned version is always one step away).

Store 4's own numbers run through all of it: about 0.054 extra cartons a day, a weekend bump of 30.0 cartons, a 90% prediction interval roughly 28 cartons wide that barely moves across a 7-day horizon, and 3 pinned versions tracing every forecast back to the model that made it.

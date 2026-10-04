---
title: "Machine Learning and Deep Forecasting Lesson 7: Bagging and combining forecasts"
slug: "Bootstrapping-Bagging-and-Forecast-Combinations"
description: "Bootstrap a time series with a moving block bootstrap, bag an ETS forecast to cut its error, then combine ETS and ARIMA forecasts to beat every single model."
keywords: "bootstrap time series, moving block bootstrap, bld.mbb.bootstrap, baggedETS, bagging forecasts, forecast combination, forecast combination puzzle, ARIMA, ETS, R time series, rolling origin forecast"
mathjax: false
webr: true
date: "2026-10-04"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "7"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Temporal-Fusion-Transformers"
course_next: ""
curriculum_id: "5.130.7"
lesson_access: "pro"
catalog_blurb: "Why averaging several forecasts usually beats picking the single best model."
---

=== step === cover
## Bagging and combining forecasts

Today let's look at the cheapest reliable trick in forecasting: instead of trusting one model's forecast, build several and combine them.

Suppose you are the demand planner at an airline. Every December you forecast passenger traffic for the coming calendar year, so the airline knows how many seats, crews and gates to plan for.

The series behind this lesson is `AirPassengers`, a dataset built into R: the monthly total of international airline passengers, in thousands, from January 1949 to December 1960, 144 months in all. We will train on the first 132 of those months, through December 1959, and hold back the 12 months of 1960 to check every forecast in this lesson against what actually happened.

The chart below plots the full series, the training months in one colour and the twelve held-out months of 1960 in the other.

::widget chart-plotter {"x":"month","y":"passengers","geoms":["line"],"data":[{"x":1,"y":112,"fill":"Trained on"},{"x":2,"y":118,"fill":"Trained on"},{"x":3,"y":132,"fill":"Trained on"},{"x":4,"y":129,"fill":"Trained on"},{"x":5,"y":121,"fill":"Trained on"},{"x":6,"y":135,"fill":"Trained on"},{"x":7,"y":148,"fill":"Trained on"},{"x":8,"y":148,"fill":"Trained on"},{"x":9,"y":136,"fill":"Trained on"},{"x":10,"y":119,"fill":"Trained on"},{"x":11,"y":104,"fill":"Trained on"},{"x":12,"y":118,"fill":"Trained on"},{"x":13,"y":115,"fill":"Trained on"},{"x":14,"y":126,"fill":"Trained on"},{"x":15,"y":141,"fill":"Trained on"},{"x":16,"y":135,"fill":"Trained on"},{"x":17,"y":125,"fill":"Trained on"},{"x":18,"y":149,"fill":"Trained on"},{"x":19,"y":170,"fill":"Trained on"},{"x":20,"y":170,"fill":"Trained on"},{"x":21,"y":158,"fill":"Trained on"},{"x":22,"y":133,"fill":"Trained on"},{"x":23,"y":114,"fill":"Trained on"},{"x":24,"y":140,"fill":"Trained on"},{"x":25,"y":145,"fill":"Trained on"},{"x":26,"y":150,"fill":"Trained on"},{"x":27,"y":178,"fill":"Trained on"},{"x":28,"y":163,"fill":"Trained on"},{"x":29,"y":172,"fill":"Trained on"},{"x":30,"y":178,"fill":"Trained on"},{"x":31,"y":199,"fill":"Trained on"},{"x":32,"y":199,"fill":"Trained on"},{"x":33,"y":184,"fill":"Trained on"},{"x":34,"y":162,"fill":"Trained on"},{"x":35,"y":146,"fill":"Trained on"},{"x":36,"y":166,"fill":"Trained on"},{"x":37,"y":171,"fill":"Trained on"},{"x":38,"y":180,"fill":"Trained on"},{"x":39,"y":193,"fill":"Trained on"},{"x":40,"y":181,"fill":"Trained on"},{"x":41,"y":183,"fill":"Trained on"},{"x":42,"y":218,"fill":"Trained on"},{"x":43,"y":230,"fill":"Trained on"},{"x":44,"y":242,"fill":"Trained on"},{"x":45,"y":209,"fill":"Trained on"},{"x":46,"y":191,"fill":"Trained on"},{"x":47,"y":172,"fill":"Trained on"},{"x":48,"y":194,"fill":"Trained on"},{"x":49,"y":196,"fill":"Trained on"},{"x":50,"y":196,"fill":"Trained on"},{"x":51,"y":236,"fill":"Trained on"},{"x":52,"y":235,"fill":"Trained on"},{"x":53,"y":229,"fill":"Trained on"},{"x":54,"y":243,"fill":"Trained on"},{"x":55,"y":264,"fill":"Trained on"},{"x":56,"y":272,"fill":"Trained on"},{"x":57,"y":237,"fill":"Trained on"},{"x":58,"y":211,"fill":"Trained on"},{"x":59,"y":180,"fill":"Trained on"},{"x":60,"y":201,"fill":"Trained on"},{"x":61,"y":204,"fill":"Trained on"},{"x":62,"y":188,"fill":"Trained on"},{"x":63,"y":235,"fill":"Trained on"},{"x":64,"y":227,"fill":"Trained on"},{"x":65,"y":234,"fill":"Trained on"},{"x":66,"y":264,"fill":"Trained on"},{"x":67,"y":302,"fill":"Trained on"},{"x":68,"y":293,"fill":"Trained on"},{"x":69,"y":259,"fill":"Trained on"},{"x":70,"y":229,"fill":"Trained on"},{"x":71,"y":203,"fill":"Trained on"},{"x":72,"y":229,"fill":"Trained on"},{"x":73,"y":242,"fill":"Trained on"},{"x":74,"y":233,"fill":"Trained on"},{"x":75,"y":267,"fill":"Trained on"},{"x":76,"y":269,"fill":"Trained on"},{"x":77,"y":270,"fill":"Trained on"},{"x":78,"y":315,"fill":"Trained on"},{"x":79,"y":364,"fill":"Trained on"},{"x":80,"y":347,"fill":"Trained on"},{"x":81,"y":312,"fill":"Trained on"},{"x":82,"y":274,"fill":"Trained on"},{"x":83,"y":237,"fill":"Trained on"},{"x":84,"y":278,"fill":"Trained on"},{"x":85,"y":284,"fill":"Trained on"},{"x":86,"y":277,"fill":"Trained on"},{"x":87,"y":317,"fill":"Trained on"},{"x":88,"y":313,"fill":"Trained on"},{"x":89,"y":318,"fill":"Trained on"},{"x":90,"y":374,"fill":"Trained on"},{"x":91,"y":413,"fill":"Trained on"},{"x":92,"y":405,"fill":"Trained on"},{"x":93,"y":355,"fill":"Trained on"},{"x":94,"y":306,"fill":"Trained on"},{"x":95,"y":271,"fill":"Trained on"},{"x":96,"y":306,"fill":"Trained on"},{"x":97,"y":315,"fill":"Trained on"},{"x":98,"y":301,"fill":"Trained on"},{"x":99,"y":356,"fill":"Trained on"},{"x":100,"y":348,"fill":"Trained on"},{"x":101,"y":355,"fill":"Trained on"},{"x":102,"y":422,"fill":"Trained on"},{"x":103,"y":465,"fill":"Trained on"},{"x":104,"y":467,"fill":"Trained on"},{"x":105,"y":404,"fill":"Trained on"},{"x":106,"y":347,"fill":"Trained on"},{"x":107,"y":305,"fill":"Trained on"},{"x":108,"y":336,"fill":"Trained on"},{"x":109,"y":340,"fill":"Trained on"},{"x":110,"y":318,"fill":"Trained on"},{"x":111,"y":362,"fill":"Trained on"},{"x":112,"y":348,"fill":"Trained on"},{"x":113,"y":363,"fill":"Trained on"},{"x":114,"y":435,"fill":"Trained on"},{"x":115,"y":491,"fill":"Trained on"},{"x":116,"y":505,"fill":"Trained on"},{"x":117,"y":404,"fill":"Trained on"},{"x":118,"y":359,"fill":"Trained on"},{"x":119,"y":310,"fill":"Trained on"},{"x":120,"y":337,"fill":"Trained on"},{"x":121,"y":360,"fill":"Trained on"},{"x":122,"y":342,"fill":"Trained on"},{"x":123,"y":406,"fill":"Trained on"},{"x":124,"y":396,"fill":"Trained on"},{"x":125,"y":420,"fill":"Trained on"},{"x":126,"y":472,"fill":"Trained on"},{"x":127,"y":548,"fill":"Trained on"},{"x":128,"y":559,"fill":"Trained on"},{"x":129,"y":463,"fill":"Trained on"},{"x":130,"y":407,"fill":"Trained on"},{"x":131,"y":362,"fill":"Trained on"},{"x":132,"y":405,"fill":"Trained on"},{"x":133,"y":417,"fill":"Held out (1960)"},{"x":134,"y":391,"fill":"Held out (1960)"},{"x":135,"y":419,"fill":"Held out (1960)"},{"x":136,"y":461,"fill":"Held out (1960)"},{"x":137,"y":472,"fill":"Held out (1960)"},{"x":138,"y":535,"fill":"Held out (1960)"},{"x":139,"y":622,"fill":"Held out (1960)"},{"x":140,"y":606,"fill":"Held out (1960)"},{"x":141,"y":508,"fill":"Held out (1960)"},{"x":142,"y":461,"fill":"Held out (1960)"},{"x":143,"y":390,"fill":"Held out (1960)"},{"x":144,"y":432,"fill":"Held out (1960)"}],"code":{"line":"ggplot(ap, aes(month, passengers, colour = group)) +\n  geom_line()"}}

Notice how the held-out stretch, the second colour, keeps climbing above anything the training months ever showed. That is exactly the stretch every forecast in this lesson has to reach.

=== step === concept
## Why one model's forecast depends on the data you happened to get

Let's start with the obvious thing to do: fit one model on the training months, and forecast with it.

`ets()` fits an exponential smoothing model to a time series automatically. It tries several combinations of a level, a trend and a season, and keeps the combination that fits best. Run it on the 132 training months, then forecast the 12 months of 1960.

```r
# Fit ETS on the training months and forecast the 12 held-out months of 1960
library(forecast)
train <- window(AirPassengers, end = c(1959, 12))
test  <- window(AirPassengers, start = c(1960, 1), end = c(1960, 12))

fit_ets <- ets(train)
fit_ets$method
#> [1] "ETS(M,Ad,M)"

fc_ets <- forecast(fit_ets, h = 12)
round(as.numeric(fc_ets$mean), 1)
#>  [1] 411.9 407.0 467.3 450.7 451.5 513.2 569.9 567.6 496.1 432.2 376.6 424.8
as.numeric(test)
#>  [1] 417 391 419 461 472 535 622 606 508 461 390 432
```

`ets()` settled on ETS(M,Ad,M): multiplicative errors, a damped additive trend, and a multiplicative season. Additive means the trend adds a fixed amount to the series each month rather than scaling with its level; damped means that added amount shrinks the further out the forecast runs, instead of carrying the same slope forever. Multiplicative means the swings scale up with the level of the series, which fits AirPassengers well since its summer peaks grow taller as the years go by.

Now score the forecast against what actually happened.

```r
# Score the forecast against the real 1960 totals
mae_ets  <- mean(abs(test - fc_ets$mean))
rmse_ets <- sqrt(mean((test - fc_ets$mean)^2))
sprintf("MAE = %.2f, RMSE = %.2f", mae_ets, rmse_ets)
#> [1] "MAE = 22.80, RMSE = 27.40"
```

MAE, the mean absolute error, averages how far off each month's forecast was, ignoring whether it ran too high or too low. RMSE, the root mean squared error, does something similar but squares each gap before averaging, so a few big misses weigh more heavily than many small ones.

`fit_ets` was fitted on exactly the 132 months that happened to occur between January 1949 and December 1959. Had the airline's bookings landed a little differently in any of those months, `ets()` would have produced a slightly different model, and a different forecast. The MAE of 22.80 above is not some fixed property of ETS on this series. It is what you get from the one history that actually happened, and a model's forecast is only ever as good as the one past it was shown.

=== step === concept
## Why you can't bootstrap a time series point by point

Since one history only gives one forecast, here's an idea: generate many alternate histories, and see how differently each one would have forecast. The usual way statisticians invent alternate versions of a dataset is the bootstrap: resample the data with replacement, so that some rows repeat and others get left out entirely.

For an ordinary dataset where every row stands on its own, like a list of customers, that works fine. But a time series is different. Each month's passenger count is not independent of the months around it. July usually looks like last July, and a busy month tends to follow another busy month. Resampling point by point, with replacement, throws all of that away.

Watch what it does to just the last 12 months of the training data, 1959.

```r
# Resample 1959's 12 months with replacement, point by point
last_1959 <- tail(as.numeric(train), 12)
last_1959
#>  [1] 360 342 406 396 420 472 548 559 463 407 362 405

set.seed(42)
scrambled <- sample(last_1959, replace = TRUE)
scrambled
#>  [1] 360 420 360 463 407 396 342 407 360 559 548 396
```

Look at what happened. 360 shows up three times, while 406, 472, 405 and 362 vanished entirely from the resample. December's figure could now sit right after August's instead of next to November's. Any trend or seasonal shape that ran through the real sequence of 1959 is gone from `scrambled`, because the sequence itself is gone.

A time series model relies on exactly that sequence, so a resampling scheme for a time series needs to keep nearby months together, and only vary the bigger structure. That is exactly what the moving block bootstrap does.

=== step === concept
## The moving block bootstrap

The fix the `forecast` package uses is called the moving block bootstrap, and it is implemented in `bld.mbb.bootstrap()`. It builds a new, equally plausible version of the series in four steps, keeping the trend and the season fixed, and reshuffling only what's left over once those are removed.

1. **Box-Cox transform the series.** A Box-Cox transform raises the series to some exponent, chosen automatically, that steadies a series whose swings grow as the series itself grows. AirPassengers climbs from around 100 in 1949 to over 500 by 1960, and its monthly ups and downs grow right along with it. This step shrinks that growing swing down to a roughly constant size, which the next step needs.
2. **Split the transformed series with STL.** STL, short for seasonal-trend decomposition using Loess, splits a series into three pieces that add back up to the original: a season (the repeating within-year shape), a trend (the slow-moving level), and a remainder (whatever is left once season and trend are taken out, the part that looks like noise).
3. **Resample only the remainder, in contiguous 24-month blocks.** Instead of shuffling single points, this step cuts the remainder into chunks of 24 months, twice AirPassengers's 12-month frequency and the function's default for a monthly series, then draws whole chunks with replacement, end to end, until it has rebuilt a remainder of the same length. Because whole 24-month chunks move together, the correlation between a month and the months right around it survives inside every chunk.
4. **Add the season and trend back, then invert the Box-Cox transform.** The season and trend from step 2 go back in completely unchanged. Only the remainder is new. Reversing the Box-Cox transform returns the result to the original passenger-count scale.

Run it on the 132 training months and ask for 10 replicates.

```r
# Build 10 alternate, equally plausible versions of the training series
set.seed(1)
reps10 <- bld.mbb.bootstrap(train, 10)
length(reps10)
#> [1] 10
```

`reps10` is a list of 10 series, each the same length as `train`. The first one is always the original series exactly, unchanged, so later code can treat "the real data" as replicate 1 of its own bootstrap. Replicates 2 through 10 are the genuine resamples.

Compare replicate 5's first 12 months against the real ones.

```r
# Compare one bootstrap replicate's first 12 months against the real series
round(as.numeric(reps10[[5]])[1:12], 1)
#>  [1] 114.3 116.9 132.1 127.7 126.3 141.9 159.5 156.3 137.0 113.5  98.1 110.7
round(as.numeric(train)[1:12], 1)
#>  [1] 112 118 132 129 121 135 148 148 136 119 104 118
```

The two runs are close but not identical. Every month in the replicate is a little higher or lower than the real one, and the gap changes from month to month rather than shifting by the same amount throughout. That's the fixed trend and season carrying most of the shape, with a resampled remainder nudging each month up or down a little: 112 becomes 114.3, 118 becomes 116.9, small and plausible shifts, not a different series pretending to be AirPassengers.

Here is the original training series next to two of these replicates, for the full 132 months.

::widget chart-plotter {"x":"month","y":"passengers","geoms":["line","point"],"data":[{"x":1,"y":112,"fill":"Original (train)"},{"x":2,"y":118,"fill":"Original (train)"},{"x":3,"y":132,"fill":"Original (train)"},{"x":4,"y":129,"fill":"Original (train)"},{"x":5,"y":121,"fill":"Original (train)"},{"x":6,"y":135,"fill":"Original (train)"},{"x":7,"y":148,"fill":"Original (train)"},{"x":8,"y":148,"fill":"Original (train)"},{"x":9,"y":136,"fill":"Original (train)"},{"x":10,"y":119,"fill":"Original (train)"},{"x":11,"y":104,"fill":"Original (train)"},{"x":12,"y":118,"fill":"Original (train)"},{"x":13,"y":115,"fill":"Original (train)"},{"x":14,"y":126,"fill":"Original (train)"},{"x":15,"y":141,"fill":"Original (train)"},{"x":16,"y":135,"fill":"Original (train)"},{"x":17,"y":125,"fill":"Original (train)"},{"x":18,"y":149,"fill":"Original (train)"},{"x":19,"y":170,"fill":"Original (train)"},{"x":20,"y":170,"fill":"Original (train)"},{"x":21,"y":158,"fill":"Original (train)"},{"x":22,"y":133,"fill":"Original (train)"},{"x":23,"y":114,"fill":"Original (train)"},{"x":24,"y":140,"fill":"Original (train)"},{"x":25,"y":145,"fill":"Original (train)"},{"x":26,"y":150,"fill":"Original (train)"},{"x":27,"y":178,"fill":"Original (train)"},{"x":28,"y":163,"fill":"Original (train)"},{"x":29,"y":172,"fill":"Original (train)"},{"x":30,"y":178,"fill":"Original (train)"},{"x":31,"y":199,"fill":"Original (train)"},{"x":32,"y":199,"fill":"Original (train)"},{"x":33,"y":184,"fill":"Original (train)"},{"x":34,"y":162,"fill":"Original (train)"},{"x":35,"y":146,"fill":"Original (train)"},{"x":36,"y":166,"fill":"Original (train)"},{"x":37,"y":171,"fill":"Original (train)"},{"x":38,"y":180,"fill":"Original (train)"},{"x":39,"y":193,"fill":"Original (train)"},{"x":40,"y":181,"fill":"Original (train)"},{"x":41,"y":183,"fill":"Original (train)"},{"x":42,"y":218,"fill":"Original (train)"},{"x":43,"y":230,"fill":"Original (train)"},{"x":44,"y":242,"fill":"Original (train)"},{"x":45,"y":209,"fill":"Original (train)"},{"x":46,"y":191,"fill":"Original (train)"},{"x":47,"y":172,"fill":"Original (train)"},{"x":48,"y":194,"fill":"Original (train)"},{"x":49,"y":196,"fill":"Original (train)"},{"x":50,"y":196,"fill":"Original (train)"},{"x":51,"y":236,"fill":"Original (train)"},{"x":52,"y":235,"fill":"Original (train)"},{"x":53,"y":229,"fill":"Original (train)"},{"x":54,"y":243,"fill":"Original (train)"},{"x":55,"y":264,"fill":"Original (train)"},{"x":56,"y":272,"fill":"Original (train)"},{"x":57,"y":237,"fill":"Original (train)"},{"x":58,"y":211,"fill":"Original (train)"},{"x":59,"y":180,"fill":"Original (train)"},{"x":60,"y":201,"fill":"Original (train)"},{"x":61,"y":204,"fill":"Original (train)"},{"x":62,"y":188,"fill":"Original (train)"},{"x":63,"y":235,"fill":"Original (train)"},{"x":64,"y":227,"fill":"Original (train)"},{"x":65,"y":234,"fill":"Original (train)"},{"x":66,"y":264,"fill":"Original (train)"},{"x":67,"y":302,"fill":"Original (train)"},{"x":68,"y":293,"fill":"Original (train)"},{"x":69,"y":259,"fill":"Original (train)"},{"x":70,"y":229,"fill":"Original (train)"},{"x":71,"y":203,"fill":"Original (train)"},{"x":72,"y":229,"fill":"Original (train)"},{"x":73,"y":242,"fill":"Original (train)"},{"x":74,"y":233,"fill":"Original (train)"},{"x":75,"y":267,"fill":"Original (train)"},{"x":76,"y":269,"fill":"Original (train)"},{"x":77,"y":270,"fill":"Original (train)"},{"x":78,"y":315,"fill":"Original (train)"},{"x":79,"y":364,"fill":"Original (train)"},{"x":80,"y":347,"fill":"Original (train)"},{"x":81,"y":312,"fill":"Original (train)"},{"x":82,"y":274,"fill":"Original (train)"},{"x":83,"y":237,"fill":"Original (train)"},{"x":84,"y":278,"fill":"Original (train)"},{"x":85,"y":284,"fill":"Original (train)"},{"x":86,"y":277,"fill":"Original (train)"},{"x":87,"y":317,"fill":"Original (train)"},{"x":88,"y":313,"fill":"Original (train)"},{"x":89,"y":318,"fill":"Original (train)"},{"x":90,"y":374,"fill":"Original (train)"},{"x":91,"y":413,"fill":"Original (train)"},{"x":92,"y":405,"fill":"Original (train)"},{"x":93,"y":355,"fill":"Original (train)"},{"x":94,"y":306,"fill":"Original (train)"},{"x":95,"y":271,"fill":"Original (train)"},{"x":96,"y":306,"fill":"Original (train)"},{"x":97,"y":315,"fill":"Original (train)"},{"x":98,"y":301,"fill":"Original (train)"},{"x":99,"y":356,"fill":"Original (train)"},{"x":100,"y":348,"fill":"Original (train)"},{"x":101,"y":355,"fill":"Original (train)"},{"x":102,"y":422,"fill":"Original (train)"},{"x":103,"y":465,"fill":"Original (train)"},{"x":104,"y":467,"fill":"Original (train)"},{"x":105,"y":404,"fill":"Original (train)"},{"x":106,"y":347,"fill":"Original (train)"},{"x":107,"y":305,"fill":"Original (train)"},{"x":108,"y":336,"fill":"Original (train)"},{"x":109,"y":340,"fill":"Original (train)"},{"x":110,"y":318,"fill":"Original (train)"},{"x":111,"y":362,"fill":"Original (train)"},{"x":112,"y":348,"fill":"Original (train)"},{"x":113,"y":363,"fill":"Original (train)"},{"x":114,"y":435,"fill":"Original (train)"},{"x":115,"y":491,"fill":"Original (train)"},{"x":116,"y":505,"fill":"Original (train)"},{"x":117,"y":404,"fill":"Original (train)"},{"x":118,"y":359,"fill":"Original (train)"},{"x":119,"y":310,"fill":"Original (train)"},{"x":120,"y":337,"fill":"Original (train)"},{"x":121,"y":360,"fill":"Original (train)"},{"x":122,"y":342,"fill":"Original (train)"},{"x":123,"y":406,"fill":"Original (train)"},{"x":124,"y":396,"fill":"Original (train)"},{"x":125,"y":420,"fill":"Original (train)"},{"x":126,"y":472,"fill":"Original (train)"},{"x":127,"y":548,"fill":"Original (train)"},{"x":128,"y":559,"fill":"Original (train)"},{"x":129,"y":463,"fill":"Original (train)"},{"x":130,"y":407,"fill":"Original (train)"},{"x":131,"y":362,"fill":"Original (train)"},{"x":132,"y":405,"fill":"Original (train)"},{"x":1,"y":115.7,"fill":"Replicate 2"},{"x":2,"y":111.6,"fill":"Replicate 2"},{"x":3,"y":126.3,"fill":"Replicate 2"},{"x":4,"y":123.7,"fill":"Replicate 2"},{"x":5,"y":124.6,"fill":"Replicate 2"},{"x":6,"y":145.7,"fill":"Replicate 2"},{"x":7,"y":159.9,"fill":"Replicate 2"},{"x":8,"y":156.6,"fill":"Replicate 2"},{"x":9,"y":132,"fill":"Replicate 2"},{"x":10,"y":115.5,"fill":"Replicate 2"},{"x":11,"y":104.7,"fill":"Replicate 2"},{"x":12,"y":111.5,"fill":"Replicate 2"},{"x":13,"y":118,"fill":"Replicate 2"},{"x":14,"y":114.6,"fill":"Replicate 2"},{"x":15,"y":137.1,"fill":"Replicate 2"},{"x":16,"y":135.5,"fill":"Replicate 2"},{"x":17,"y":135.3,"fill":"Replicate 2"},{"x":18,"y":153.5,"fill":"Replicate 2"},{"x":19,"y":173.5,"fill":"Replicate 2"},{"x":20,"y":182.6,"fill":"Replicate 2"},{"x":21,"y":166.6,"fill":"Replicate 2"},{"x":22,"y":143.3,"fill":"Replicate 2"},{"x":23,"y":118.7,"fill":"Replicate 2"},{"x":24,"y":132.6,"fill":"Replicate 2"},{"x":25,"y":140.9,"fill":"Replicate 2"},{"x":26,"y":140.8,"fill":"Replicate 2"},{"x":27,"y":167.9,"fill":"Replicate 2"},{"x":28,"y":160.5,"fill":"Replicate 2"},{"x":29,"y":160.9,"fill":"Replicate 2"},{"x":30,"y":185.4,"fill":"Replicate 2"},{"x":31,"y":193.8,"fill":"Replicate 2"},{"x":32,"y":207.7,"fill":"Replicate 2"},{"x":33,"y":196,"fill":"Replicate 2"},{"x":34,"y":167.9,"fill":"Replicate 2"},{"x":35,"y":149.9,"fill":"Replicate 2"},{"x":36,"y":159.7,"fill":"Replicate 2"},{"x":37,"y":159.9,"fill":"Replicate 2"},{"x":38,"y":156.9,"fill":"Replicate 2"},{"x":39,"y":182.4,"fill":"Replicate 2"},{"x":40,"y":186.5,"fill":"Replicate 2"},{"x":41,"y":188.6,"fill":"Replicate 2"},{"x":42,"y":216.5,"fill":"Replicate 2"},{"x":43,"y":243.5,"fill":"Replicate 2"},{"x":44,"y":235.8,"fill":"Replicate 2"},{"x":45,"y":229.8,"fill":"Replicate 2"},{"x":46,"y":196.4,"fill":"Replicate 2"},{"x":47,"y":171.3,"fill":"Replicate 2"},{"x":48,"y":179.2,"fill":"Replicate 2"},{"x":49,"y":190.3,"fill":"Replicate 2"},{"x":50,"y":192.1,"fill":"Replicate 2"},{"x":51,"y":219.8,"fill":"Replicate 2"},{"x":52,"y":222.9,"fill":"Replicate 2"},{"x":53,"y":212.5,"fill":"Replicate 2"},{"x":54,"y":233.4,"fill":"Replicate 2"},{"x":55,"y":278.8,"fill":"Replicate 2"},{"x":56,"y":271.9,"fill":"Replicate 2"},{"x":57,"y":242.4,"fill":"Replicate 2"},{"x":58,"y":210.8,"fill":"Replicate 2"},{"x":59,"y":185,"fill":"Replicate 2"},{"x":60,"y":220.6,"fill":"Replicate 2"},{"x":61,"y":206.2,"fill":"Replicate 2"},{"x":62,"y":197.2,"fill":"Replicate 2"},{"x":63,"y":228.3,"fill":"Replicate 2"},{"x":64,"y":229.8,"fill":"Replicate 2"},{"x":65,"y":217.6,"fill":"Replicate 2"},{"x":66,"y":260.3,"fill":"Replicate 2"},{"x":67,"y":285.8,"fill":"Replicate 2"},{"x":68,"y":298.2,"fill":"Replicate 2"},{"x":69,"y":268.1,"fill":"Replicate 2"},{"x":70,"y":233.8,"fill":"Replicate 2"},{"x":71,"y":203.4,"fill":"Replicate 2"},{"x":72,"y":232.9,"fill":"Replicate 2"},{"x":73,"y":247.3,"fill":"Replicate 2"},{"x":74,"y":254.2,"fill":"Replicate 2"},{"x":75,"y":287.1,"fill":"Replicate 2"},{"x":76,"y":261.4,"fill":"Replicate 2"},{"x":77,"y":258.7,"fill":"Replicate 2"},{"x":78,"y":308.3,"fill":"Replicate 2"},{"x":79,"y":347.4,"fill":"Replicate 2"},{"x":80,"y":347,"fill":"Replicate 2"},{"x":81,"y":311.7,"fill":"Replicate 2"},{"x":82,"y":276.5,"fill":"Replicate 2"},{"x":83,"y":250.3,"fill":"Replicate 2"},{"x":84,"y":280.6,"fill":"Replicate 2"},{"x":85,"y":279.6,"fill":"Replicate 2"},{"x":86,"y":277.7,"fill":"Replicate 2"},{"x":87,"y":317.1,"fill":"Replicate 2"},{"x":88,"y":311.2,"fill":"Replicate 2"},{"x":89,"y":312.9,"fill":"Replicate 2"},{"x":90,"y":362.4,"fill":"Replicate 2"},{"x":91,"y":389.9,"fill":"Replicate 2"},{"x":92,"y":399.2,"fill":"Replicate 2"},{"x":93,"y":352.7,"fill":"Replicate 2"},{"x":94,"y":312.4,"fill":"Replicate 2"},{"x":95,"y":284.4,"fill":"Replicate 2"},{"x":96,"y":317.2,"fill":"Replicate 2"},{"x":97,"y":323.8,"fill":"Replicate 2"},{"x":98,"y":318.3,"fill":"Replicate 2"},{"x":99,"y":364.7,"fill":"Replicate 2"},{"x":100,"y":358,"fill":"Replicate 2"},{"x":101,"y":354.5,"fill":"Replicate 2"},{"x":102,"y":407.1,"fill":"Replicate 2"},{"x":103,"y":432.2,"fill":"Replicate 2"},{"x":104,"y":429.7,"fill":"Replicate 2"},{"x":105,"y":391.8,"fill":"Replicate 2"},{"x":106,"y":333.1,"fill":"Replicate 2"},{"x":107,"y":299.5,"fill":"Replicate 2"},{"x":108,"y":342.4,"fill":"Replicate 2"},{"x":109,"y":341.8,"fill":"Replicate 2"},{"x":110,"y":332.9,"fill":"Replicate 2"},{"x":111,"y":385.4,"fill":"Replicate 2"},{"x":112,"y":386.1,"fill":"Replicate 2"},{"x":113,"y":398.3,"fill":"Replicate 2"},{"x":114,"y":440.2,"fill":"Replicate 2"},{"x":115,"y":457.8,"fill":"Replicate 2"},{"x":116,"y":448.4,"fill":"Replicate 2"},{"x":117,"y":407.1,"fill":"Replicate 2"},{"x":118,"y":357,"fill":"Replicate 2"},{"x":119,"y":320.3,"fill":"Replicate 2"},{"x":120,"y":355.4,"fill":"Replicate 2"},{"x":121,"y":357.4,"fill":"Replicate 2"},{"x":122,"y":355.8,"fill":"Replicate 2"},{"x":123,"y":383.5,"fill":"Replicate 2"},{"x":124,"y":403.9,"fill":"Replicate 2"},{"x":125,"y":407.1,"fill":"Replicate 2"},{"x":126,"y":479,"fill":"Replicate 2"},{"x":127,"y":529.3,"fill":"Replicate 2"},{"x":128,"y":566.9,"fill":"Replicate 2"},{"x":129,"y":483.9,"fill":"Replicate 2"},{"x":130,"y":420.6,"fill":"Replicate 2"},{"x":131,"y":340.5,"fill":"Replicate 2"},{"x":132,"y":401.9,"fill":"Replicate 2"},{"x":1,"y":114.3,"fill":"Replicate 5"},{"x":2,"y":116.9,"fill":"Replicate 5"},{"x":3,"y":132.1,"fill":"Replicate 5"},{"x":4,"y":127.7,"fill":"Replicate 5"},{"x":5,"y":126.3,"fill":"Replicate 5"},{"x":6,"y":141.9,"fill":"Replicate 5"},{"x":7,"y":159.5,"fill":"Replicate 5"},{"x":8,"y":156.3,"fill":"Replicate 5"},{"x":9,"y":137,"fill":"Replicate 5"},{"x":10,"y":113.5,"fill":"Replicate 5"},{"x":11,"y":98.1,"fill":"Replicate 5"},{"x":12,"y":110.7,"fill":"Replicate 5"},{"x":13,"y":117.2,"fill":"Replicate 5"},{"x":14,"y":122.4,"fill":"Replicate 5"},{"x":15,"y":143.6,"fill":"Replicate 5"},{"x":16,"y":143,"fill":"Replicate 5"},{"x":17,"y":131.5,"fill":"Replicate 5"},{"x":18,"y":153.3,"fill":"Replicate 5"},{"x":19,"y":169.7,"fill":"Replicate 5"},{"x":20,"y":165.3,"fill":"Replicate 5"},{"x":21,"y":154,"fill":"Replicate 5"},{"x":22,"y":130.6,"fill":"Replicate 5"},{"x":23,"y":118.7,"fill":"Replicate 5"},{"x":24,"y":135.9,"fill":"Replicate 5"},{"x":25,"y":146,"fill":"Replicate 5"},{"x":26,"y":154.1,"fill":"Replicate 5"},{"x":27,"y":165.6,"fill":"Replicate 5"},{"x":28,"y":155.7,"fill":"Replicate 5"},{"x":29,"y":157.8,"fill":"Replicate 5"},{"x":30,"y":188.4,"fill":"Replicate 5"},{"x":31,"y":199.2,"fill":"Replicate 5"},{"x":32,"y":209.2,"fill":"Replicate 5"},{"x":33,"y":180.3,"fill":"Replicate 5"},{"x":34,"y":163.9,"fill":"Replicate 5"},{"x":35,"y":146.8,"fill":"Replicate 5"},{"x":36,"y":165.2,"fill":"Replicate 5"},{"x":37,"y":166.5,"fill":"Replicate 5"},{"x":38,"y":166.8,"fill":"Replicate 5"},{"x":39,"y":201.3,"fill":"Replicate 5"},{"x":40,"y":201.4,"fill":"Replicate 5"},{"x":41,"y":197.3,"fill":"Replicate 5"},{"x":42,"y":211.3,"fill":"Replicate 5"},{"x":43,"y":231.7,"fill":"Replicate 5"},{"x":44,"y":242.2,"fill":"Replicate 5"},{"x":45,"y":214.2,"fill":"Replicate 5"},{"x":46,"y":194,"fill":"Replicate 5"},{"x":47,"y":168.4,"fill":"Replicate 5"},{"x":48,"y":189.9,"fill":"Replicate 5"},{"x":49,"y":194.2,"fill":"Replicate 5"},{"x":50,"y":197.7,"fill":"Replicate 5"},{"x":51,"y":229.2,"fill":"Replicate 5"},{"x":52,"y":223.7,"fill":"Replicate 5"},{"x":53,"y":237.6,"fill":"Replicate 5"},{"x":54,"y":249.3,"fill":"Replicate 5"},{"x":55,"y":267.5,"fill":"Replicate 5"},{"x":56,"y":266.6,"fill":"Replicate 5"},{"x":57,"y":240.9,"fill":"Replicate 5"},{"x":58,"y":196.9,"fill":"Replicate 5"},{"x":59,"y":178.4,"fill":"Replicate 5"},{"x":60,"y":196.7,"fill":"Replicate 5"},{"x":61,"y":205.9,"fill":"Replicate 5"},{"x":62,"y":207.7,"fill":"Replicate 5"},{"x":63,"y":237.7,"fill":"Replicate 5"},{"x":64,"y":227.6,"fill":"Replicate 5"},{"x":65,"y":230.8,"fill":"Replicate 5"},{"x":66,"y":275.2,"fill":"Replicate 5"},{"x":67,"y":318.3,"fill":"Replicate 5"},{"x":68,"y":311.7,"fill":"Replicate 5"},{"x":69,"y":256.9,"fill":"Replicate 5"},{"x":70,"y":221.1,"fill":"Replicate 5"},{"x":71,"y":201.6,"fill":"Replicate 5"},{"x":72,"y":229.7,"fill":"Replicate 5"},{"x":73,"y":238.4,"fill":"Replicate 5"},{"x":74,"y":240.4,"fill":"Replicate 5"},{"x":75,"y":274.7,"fill":"Replicate 5"},{"x":76,"y":268.8,"fill":"Replicate 5"},{"x":77,"y":258.3,"fill":"Replicate 5"},{"x":78,"y":294.2,"fill":"Replicate 5"},{"x":79,"y":330.1,"fill":"Replicate 5"},{"x":80,"y":347.3,"fill":"Replicate 5"},{"x":81,"y":322.7,"fill":"Replicate 5"},{"x":82,"y":287.9,"fill":"Replicate 5"},{"x":83,"y":260.2,"fill":"Replicate 5"},{"x":84,"y":269.8,"fill":"Replicate 5"},{"x":85,"y":279.4,"fill":"Replicate 5"},{"x":86,"y":274,"fill":"Replicate 5"},{"x":87,"y":305.7,"fill":"Replicate 5"},{"x":88,"y":312.3,"fill":"Replicate 5"},{"x":89,"y":301.2,"fill":"Replicate 5"},{"x":90,"y":353.1,"fill":"Replicate 5"},{"x":91,"y":395.9,"fill":"Replicate 5"},{"x":92,"y":416.7,"fill":"Replicate 5"},{"x":93,"y":357.8,"fill":"Replicate 5"},{"x":94,"y":323.7,"fill":"Replicate 5"},{"x":95,"y":286.5,"fill":"Replicate 5"},{"x":96,"y":304.3,"fill":"Replicate 5"},{"x":97,"y":316.1,"fill":"Replicate 5"},{"x":98,"y":323,"fill":"Replicate 5"},{"x":99,"y":369.5,"fill":"Replicate 5"},{"x":100,"y":350.7,"fill":"Replicate 5"},{"x":101,"y":353.3,"fill":"Replicate 5"},{"x":102,"y":397.7,"fill":"Replicate 5"},{"x":103,"y":449.7,"fill":"Replicate 5"},{"x":104,"y":448.5,"fill":"Replicate 5"},{"x":105,"y":397.2,"fill":"Replicate 5"},{"x":106,"y":332,"fill":"Replicate 5"},{"x":107,"y":294.5,"fill":"Replicate 5"},{"x":108,"y":332.7,"fill":"Replicate 5"},{"x":109,"y":339,"fill":"Replicate 5"},{"x":110,"y":347.3,"fill":"Replicate 5"},{"x":111,"y":393.2,"fill":"Replicate 5"},{"x":112,"y":380.7,"fill":"Replicate 5"},{"x":113,"y":377,"fill":"Replicate 5"},{"x":114,"y":424.2,"fill":"Replicate 5"},{"x":115,"y":477.6,"fill":"Replicate 5"},{"x":116,"y":469.7,"fill":"Replicate 5"},{"x":117,"y":413.3,"fill":"Replicate 5"},{"x":118,"y":343.3,"fill":"Replicate 5"},{"x":119,"y":297.6,"fill":"Replicate 5"},{"x":120,"y":335.6,"fill":"Replicate 5"},{"x":121,"y":357.4,"fill":"Replicate 5"},{"x":122,"y":347.2,"fill":"Replicate 5"},{"x":123,"y":415.9,"fill":"Replicate 5"},{"x":124,"y":412.4,"fill":"Replicate 5"},{"x":125,"y":413.1,"fill":"Replicate 5"},{"x":126,"y":469,"fill":"Replicate 5"},{"x":127,"y":530.8,"fill":"Replicate 5"},{"x":128,"y":557,"fill":"Replicate 5"},{"x":129,"y":506.6,"fill":"Replicate 5"},{"x":130,"y":433.1,"fill":"Replicate 5"},{"x":131,"y":356.4,"fill":"Replicate 5"},{"x":132,"y":396.1,"fill":"Replicate 5"}],"code":{"line":"ggplot(reps, aes(month, passengers, colour = group)) +\n  geom_line()","point":"ggplot(reps, aes(month, passengers, colour = group)) +\n  geom_point()"}}

All three lines trace the same climbing, seasonal shape. The two replicates wander a little above and a little below the original in different months, but neither one flattens the climb or erases the yearly cycle. That is the whole point: `bld.mbb.bootstrap()` hands you a new, equally plausible 132 months, not a random walk that happens to average out right.

=== step === quiz
## Quick check: resampling in blocks

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Blocks exist only to make the computation run faster; resampling point by point would give just as valid a replicate, only slower. ::no
- A block bootstrap returns the exact same series every time, since the blocks are fixed in advance. ::no
- Resampling the remainder in contiguous 24-month blocks keeps each month next to the neighbours it actually had, so the correlation between nearby months survives in every replicate. ::ok Exactly. The whole reason to move in blocks rather than single points is to protect that neighbour-to-neighbour structure. The trend and season stay fixed, and only the remainder's chunks get reshuffled.
- Blocks are only needed when a series has a trend; a series with no trend could safely be resampled one point at a time. ::no Blocks protect the correlation between neighbouring months, which has nothing to do with whether the series trends up or down. Even a flat series with no trend at all still has months that depend on their neighbours, so resampling it one point at a time would still scramble that structure.

=== step === concept
## Bagging a forecast by refitting on many bootstrap replicates

Now that you can build alternate, equally plausible histories, here's what to do with them: refit the model on each one, forecast with each refit, then average the forecasts. That is called bagging, short for bootstrap aggregating.

First, see how much just the December 1960 forecast moves across the 10 replicates from the last step.

```r
# Refit ETS on each of the 10 replicates, forecast 1960, and keep December's value
dec_forecasts <- numeric(10)
for (i in 1:10) {
  fit_i <- ets(reps10[[i]])
  fc_i  <- forecast(fit_i, h = 12)
  dec_forecasts[i] <- as.numeric(fc_i$mean)[12]
}
round(dec_forecasts, 1)
#>  [1] 424.8 416.1 429.1 450.1 416.9 471.5 455.3 448.1 468.3 463.0

round(range(dec_forecasts), 1)
#> [1] 416.1 471.5
sprintf("mean = %.1f, sd = %.1f", mean(dec_forecasts), sd(dec_forecasts))
#> [1] "mean = 444.3, sd = 21.1"
```

Ten refits of the same model, on ten histories that could all plausibly have happened, and December 1960's forecast swings from 416.1 to 471.5, a range of over 55, with a standard deviation around 21. That spread is the real uncertainty sitting underneath the single ETS forecast you fitted at the start, the one number, 424.8, you would have reported had you only ever seen replicate 1, the original.

Averaging over many such refits is what `baggedETS()` does, and it uses many more than 10. Build 100 replicates and let it refit and average over all of them. Refitting 100 models takes several minutes, so this code is shown for you to run locally.

```r-static
# Bag 100 ETS refits and forecast 1960 with their average
set.seed(1)
reps100 <- bld.mbb.bootstrap(train, 100)
fit_bagged <- baggedETS(train, bootstrapped_series = reps100)
fc_bagged  <- forecast(fit_bagged, h = 12)

round(as.numeric(fc_bagged$mean), 1)
#>  [1] 419.0 413.9 476.8 460.9 461.9 526.1 586.6 586.7 513.1 448.6 391.0 440.2

mae_bagged  <- mean(abs(test - fc_bagged$mean))
rmse_bagged <- sqrt(mean((test - fc_bagged$mean)^2))
sprintf("MAE = %.2f, RMSE = %.2f", mae_bagged, rmse_bagged)
#> [1] "MAE = 15.27, RMSE = 22.23"
```

The single ETS fit from earlier scored MAE 22.80 and RMSE 27.40. Averaging over 100 refits brings that down to MAE 15.27 and RMSE 22.23, a drop of about a third in MAE. Bagging doesn't hand any one refit new information the original data didn't have. What it does is stop you from betting everything on whichever single refit you happened to get, for the same reason averaging many measurements beats trusting just one.

=== step === concept
## Combining forecasts from different models

Bagging improved one model by refitting it on many versions of the same data. There is a second, entirely different way to hedge your bet: fit two different kinds of models to the one real dataset, and average their forecasts.

`auto.arima()` searches for the best ARIMA model for a series automatically, the same way `ets()` searches for the best exponential smoothing model.

```r
# auto.arima(train) searches many candidate models and settles on ARIMA(1,1,0)(0,1,0)[12].
# The search takes a while, so this box fits that chosen order directly: same model, same numbers.
fit_arima <- Arima(train, order = c(1, 1, 0), seasonal = c(0, 1, 0))
fit_arima
#> Series: train
#> ARIMA(1,1,0)(0,1,0)[12]
#>
#> Coefficients:
#>           ar1
#>       -0.2431
#> s.e.   0.0894
#>
#> sigma^2 = 109.8:  log likelihood = -447.95
#> AIC=899.9   AICc=900.01   BIC=905.46

fc_arima <- forecast(fit_arima, h = 12)
mae_arima  <- mean(abs(test - fc_arima$mean))
rmse_arima <- sqrt(mean((test - fc_arima$mean)^2))
sprintf("MAE = %.2f, RMSE = %.2f", mae_arima, rmse_arima)
#> [1] "MAE = 18.53, RMSE = 23.93"
```

ARIMA(1,1,0)(0,1,0)[12] reads as one autoregressive term and one ordinary difference, plus one seasonal difference at a lag of 12 months and no seasonal AR or MA term. On this series it scores MAE 18.53, already a little better than the single ETS fit's 22.80.

Now average the two forecasts, ETS's from earlier and ARIMA's just now, month by month.

```r
# Average the ETS and ARIMA forecasts, month by month
combo <- (fc_ets$mean + fc_arima$mean) / 2
round(as.numeric(combo), 1)
#>  [1] 418.0 407.0 469.1 455.8 468.2 525.1 591.4 595.7 512.0 452.0 401.7 447.3

mae_combo  <- mean(abs(test - combo))
rmse_combo <- sqrt(mean((test - combo)^2))
sprintf("MAE = %.2f, RMSE = %.2f", mae_combo, rmse_combo)
#> [1] "MAE = 13.92, RMSE = 19.19"
```

Line up all four forecasts against the real 1960 totals, including `snaive()`, the seasonal naive forecast that simply repeats each month's value from one year back.

```r
# Compare ETS, ARIMA, seasonal naive, and the average against the real totals
fc_snaive <- snaive(train, h = 12)

comparison <- data.frame(
  month  = 1:12,
  actual = as.numeric(test),
  ets    = round(as.numeric(fc_ets$mean), 1),
  arima  = round(as.numeric(fc_arima$mean), 1),
  snaive = round(as.numeric(fc_snaive$mean), 1),
  combo  = round(as.numeric(combo), 1)
)
comparison
#>    month actual   ets arima snaive combo
#> 1      1    417 411.9 424.1    360 418.0
#> 2      2    391 407.0 407.1    342 407.0
#> 3      3    419 467.3 470.8    406 469.1
#> 4      4    461 450.7 460.9    396 455.8
#> 5      5    472 451.5 484.9    420 468.2
#> 6      6    535 513.2 536.9    472 525.1
#> 7      7    622 569.9 612.9    548 591.4
#> 8      8    606 567.6 623.9    559 595.7
#> 9      9    508 496.1 527.9    463 512.0
#> 10    10    461 432.2 471.9    407 452.0
#> 11    11    390 376.6 426.9    362 401.7
#> 12    12    432 424.8 469.9    405 447.3

mae_snaive <- mean(abs(test - fc_snaive$mean))
sprintf("MAE: ets %.2f, arima %.2f, snaive %.2f, combo %.2f",
        mae_ets, mae_arima, mae_snaive, mae_combo)
#> [1] "MAE: ets 22.80, arima 18.53, snaive 47.83, combo 13.92"
```

The plain average of ETS and ARIMA, MAE 13.92, beats every single model on the list: ETS alone at 22.80, ARIMA alone at 18.53, and seasonal naive by a wide margin at 47.83. Neither ETS nor ARIMA needed to be the better model for the average to win. Look at month 5: ETS undershoots at 451.5 while ARIMA overshoots at 484.9. Averaging lets mistakes like that partly cancel instead of compounding.

=== step === concept
## Checking the combination across four earlier forecast origins

One comparison, on one forecast origin, is itself just one history. Does the average always win, or did it get lucky this once? Check by rolling the forecast origin back: repeat the exact same four forecasts, ETS, ARIMA, seasonal naive, and the ETS-ARIMA average, from the end of 1955, 1956, 1957 and 1958. Each time, forecast only the following calendar year from the data available up to that point.

```r
# Repeat the four forecasts from four earlier origins and score each one's MAE
origins <- c(1955, 1956, 1957, 1958)
# The order auto.arima(tr) picks at each origin, fitted directly to keep the loop fast
arima_orders <- list("1955" = list(c(0, 1, 1), c(1, 1, 0)),
                     "1956" = list(c(1, 1, 0), c(1, 1, 0)),
                     "1957" = list(c(1, 1, 0), c(0, 1, 0)),
                     "1958" = list(c(1, 1, 0), c(0, 1, 0)))
raw <- matrix(NA, 4, 4, dimnames = list(origins, c("ets", "arima", "snaive", "combo")))

for (j in seq_along(origins)) {
  yr <- origins[j]
  tr <- window(AirPassengers, end = c(yr, 12))
  te <- window(AirPassengers, start = c(yr + 1, 1), end = c(yr + 1, 12))

  p_ets    <- as.numeric(forecast(ets(tr), h = 12)$mean)
  ord      <- arima_orders[[as.character(yr)]]
  p_arima  <- as.numeric(forecast(Arima(tr, order = ord[[1]], seasonal = ord[[2]]), h = 12)$mean)
  p_snaive <- as.numeric(snaive(tr, h = 12)$mean)
  p_combo  <- (p_ets + p_arima) / 2

  raw[j, "ets"]    <- mean(abs(te - p_ets))
  raw[j, "arima"]  <- mean(abs(te - p_arima))
  raw[j, "snaive"] <- mean(abs(te - p_snaive))
  raw[j, "combo"]  <- mean(abs(te - p_combo))
}

round(raw, 1)
#>       ets arima snaive combo
#> 1955 13.8   8.5   44.2   7.9
#> 1956 19.7  12.1   40.2  15.4
#> 1957 17.3  19.4   12.6  17.2
#> 1958 43.5  45.5   47.3  44.5

round(colMeans(raw), 2)
#>    ets  arima snaive  combo
#>  23.59  21.38  36.08  21.26
```

Look at the winner, the lowest MAE, at each origin. 1955: the average wins at 7.9. 1956: ARIMA wins at 12.1. 1957: seasonal naive wins at 12.6. 1958: ETS wins at 43.5. A different method comes out on top every single time. Had you picked "the best model" after watching 1955's result, you would have bet everything on the average, then watched ARIMA beat it at the very next origin.

Here is a widget that steps through folds one at a time, the same stepping motion as walking through the four origins above, though it ships with its own small built-in dataset rather than these four years. Picture each click moving the origin forward one year, from the end of 1955 to the end of 1958, exactly like the loop you just ran.

::widget cv-folds {"k":4}

Now look at the two numbers that matter for a decision made in advance, without hindsight. The average's mean MAE across all four origins, 21.26, sits right beside the best individual model's mean (ARIMA at 21.38, ETS at 23.59), and it is the lowest of the four. Check which method was ever the single worst at any origin: seasonal naive was the worst at three of the four origins, 1955, 1956 and 1958; ARIMA was the worst once, at 1957; the average was never the worst at any of them. Close to the best on average, and never the single worst: that combination is exactly why you reach for the average when you don't know in advance which model will win.

=== step === concept
## The forecast combination puzzle
::prose-only named, cited finding; no new computation on this series, the numbers it reasons about were already computed and charted two steps back

You might expect a smarter combination to beat a plain 50-50 average: estimate how much to trust ETS against ARIMA from the four origins you just saw, and weight accordingly. Since ARIMA's mean MAE, 21.38, beat ETS's, 23.59, across those four origins, you might lean toward weighting ARIMA more heavily.

This is a well-documented finding with its own name: the forecast combination puzzle. Researchers who have compared combination methods across hundreds of real forecasting problems keep finding the same surprising result. Fitting weights from past accuracy, instead of just splitting evenly, usually makes the combined forecast worse, not better.

Why? Estimating a weight needs data, and four origins is not a lot of data. Any weight fitted off those four MAEs carries its own estimation error, since a different four origins could easily have handed ETS the lower mean instead. That estimation error gets added on top of whatever the weighting was trying to fix, and more often than not it costs more than the mis-weighting an equal split risks. An equal average needs no fitting and no extra history. It is biased toward neither model, which is exactly why it holds up so well when you don't have enough history to safely estimate anything fancier.

That is not an argument against ever fitting weights. With a long enough history of accuracy to learn from, a fitted combination can do better. But with a short history like this one, the dependable default is the plain average from two steps back.

=== step === quiz
## Quick check: picking a model after the fact

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ETS should be dropped from consideration, since it only won outright at one of the four origins. ::no
- A different model won at every one of the four origins, and the average was never the single worst performer at any of them, which is exactly why you can't pick "the best model" in advance. ::ok Exactly. You cannot know ahead of time which model will win the next origin, since a different one won every time here. The average's appeal is not that it wins the most. It's that it is never badly wrong.
- The average is worthless since it never came out on top at any single origin. ::no
- MAE is the wrong metric to use for this comparison, so none of these four numbers can be trusted. ::no MAE is a perfectly ordinary way to score a forecast's accuracy, and nothing about comparing four models at four origins calls for a different one. The lesson here is about which model to trust in advance, not about the choice of metric.

=== step === tryit
## Your turn: combine two forecasts by hand

`fc_ets$mean` and `fc_arima$mean` are still sitting in this session, both 12-month forecasts for 1960. Write the expression that averages them, month by month, into a vector called `combo`, the same combination from a few steps back.

```r
# fc_ets$mean and fc_arima$mean each hold a 12-month forecast for 1960.
# Average them, month by month, into a vector called combo.
# One line. Press Check when you have it.
```
::check {"regex": "combo\\s*<-\\s*[(]\\s*fc_ets\\$mean\\s*\\+\\s*fc_arima\\$mean\\s*[)]\\s*/\\s*2|combo\\s*<-\\s*[(]\\s*fc_arima\\$mean\\s*\\+\\s*fc_ets\\$mean\\s*[)]\\s*/\\s*2", "gate": true, "difficulty": "intermediate", "ok": "Right: that's the same average from a few steps back, MAE 13.92 against ETS's 22.80 and ARIMA's 18.53.", "no": "Add the two forecast vectors and divide by 2, the same combination you ran earlier: combo <- (fc_ets$mean + fc_arima$mean) / 2."}
::solution
```r
# Average the ETS and ARIMA forecasts, month by month
combo <- (fc_ets$mean + fc_arima$mean) / 2
round(as.numeric(combo), 1)
#>  [1] 418.0 407.0 469.1 455.8 468.2 525.1 591.4 595.7 512.0 452.0 401.7 447.3
```

=== step === concept
## References

- [Bagging exponential smoothing methods using STL decomposition and Box-Cox transformation](https://doi.org/10.1016/j.ijforecast.2015.07.002) - Bergmeir, C., Hyndman, R.J., Benitez, J.M. (2016), International Journal of Forecasting, 32(2), 303-312. The method behind `forecast::baggedETS()` and `forecast::bld.mbb.bootstrap()`.
- [Combining forecasts: A review and annotated bibliography](https://doi.org/10.1016/0169-2070%2889%2990012-5) - Clemen, R.T. (1989), International Journal of Forecasting, 5(4), 559-583. The case for simple-average forecast combination.
- [A Simple Explanation of the Forecast Combination Puzzle](https://doi.org/10.1111/j.1468-0084.2008.00541.x) - Smith, J., Wallis, K.F. (2009), Oxford Bulletin of Economics and Statistics, 71(3), 331-355. Names and explains the puzzle taught in this lesson.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman, R.J., Athanasopoulos, G., OTexts, section 12.4, Forecast combinations.
- [Forecasting Functions for Time Series and Linear Models](https://cran.r-project.org/web/packages/forecast/forecast.pdf) - the R package documentation for `forecast::bld.mbb.bootstrap()` and `forecast::baggedETS()`, the functions run in this lesson.

=== step === complete
## What this lesson leaves you able to do

You've now seen two different ways to stop trusting a single forecast too much.

- A model's forecast is tied to the one history it was shown. Fit `ets()` again on a different, equally plausible 132 months and you get a different forecast, as the 10 refits showed, swinging from 416.1 to 471.5 for December 1960 alone.
- The moving block bootstrap builds those alternate histories properly, by resampling only the STL remainder in contiguous 24-month blocks and leaving the trend and season untouched.
- Bagging averages refits across a hundred such replicates to narrow that dependence. Here it cut the MAE from 22.80 down to 15.27.
- Combining forecasts from different models, just by averaging them, hedges against picking the wrong single "best" model. Averaging ETS with ARIMA brought MAE down to 13.92, beating both individual models and the seasonal naive baseline.
- Across four earlier forecast origins, a different model won every single time, which is exactly why the equal average, never the single worst and close to the best on average, is the dependable default.
- The forecast combination puzzle explains why: fitting weights from a short history usually adds more estimation error than the mis-weighting an equal split risks.

The next time you have more than one reasonable model for a series, average their forecasts before you pick a favourite.

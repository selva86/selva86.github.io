---
title: "The Expert Edge in Forecasting Like a Pro Lesson 4: Forecast value added against a naive baseline"
catalog_blurb: "Score a forecasting model against the trivial benchmark it has to beat."
description: "Compute forecast value added in R: score an ETS model's MAE against a seasonal naive benchmark, SKU by SKU and in aggregate, then score a manual override."
keywords: "forecast value added, naive forecast, seasonal naive forecast, mean absolute error, MAE in R, ETS model evaluation, forecasting benchmark, judgmental override forecasting, Gilliland forecast value added, forecast package R"
post_type: "LESSON"
curriculum_id: "5.150.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "4"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Scaled-Errors-and-the-Lessons-of-the-M-Competitions.html"
course_prev: "Intermittent-Demand-Croston-ADIDA-and-TSB.html"
---

=== step === cover
## Forecast value added against a naive baseline

Today let's understand forecast value added, the number that finally answers a question every forecasting team eventually has to face: did the model actually earn the effort it took to build, or would a forecast anyone could write in one line of code have done just as well?

Here is SKU-05, one private-label item from a regional grocery chain's 18-SKU portfolio. The chain has 60 months of unit sales for it, and the forecasting team fits an ETS model, error-trend-seasonal exponential smoothing that picks its own level, trend and seasonal pattern from the data, on the first 48 of those months, then checks the forecast against the final 12.

::widget chart-plotter {"data":[{"x":1,"y":190,"fill":"Actual"},{"x":2,"y":298,"fill":"Actual"},{"x":3,"y":252,"fill":"Actual"},{"x":4,"y":308,"fill":"Actual"},{"x":5,"y":274,"fill":"Actual"},{"x":6,"y":224,"fill":"Actual"},{"x":7,"y":244,"fill":"Actual"},{"x":8,"y":169,"fill":"Actual"},{"x":9,"y":167,"fill":"Actual"},{"x":10,"y":166,"fill":"Actual"},{"x":11,"y":200,"fill":"Actual"},{"x":12,"y":276,"fill":"Actual"},{"x":13,"y":295,"fill":"Actual"},{"x":14,"y":335,"fill":"Actual"},{"x":15,"y":307,"fill":"Actual"},{"x":16,"y":323,"fill":"Actual"},{"x":17,"y":300,"fill":"Actual"},{"x":18,"y":226,"fill":"Actual"},{"x":19,"y":287,"fill":"Actual"},{"x":20,"y":222,"fill":"Actual"},{"x":21,"y":234,"fill":"Actual"},{"x":22,"y":249,"fill":"Actual"},{"x":23,"y":246,"fill":"Actual"},{"x":24,"y":272,"fill":"Actual"},{"x":25,"y":337,"fill":"Actual"},{"x":26,"y":309,"fill":"Actual"},{"x":27,"y":402,"fill":"Actual"},{"x":28,"y":332,"fill":"Actual"},{"x":29,"y":368,"fill":"Actual"},{"x":30,"y":337,"fill":"Actual"},{"x":31,"y":270,"fill":"Actual"},{"x":32,"y":264,"fill":"Actual"},{"x":33,"y":214,"fill":"Actual"},{"x":34,"y":262,"fill":"Actual"},{"x":35,"y":306,"fill":"Actual"},{"x":36,"y":313,"fill":"Actual"},{"x":37,"y":330,"fill":"Actual"},{"x":38,"y":349,"fill":"Actual"},{"x":39,"y":377,"fill":"Actual"},{"x":40,"y":401,"fill":"Actual"},{"x":41,"y":339,"fill":"Actual"},{"x":42,"y":322,"fill":"Actual"},{"x":43,"y":262,"fill":"Actual"},{"x":44,"y":292,"fill":"Actual"},{"x":45,"y":308,"fill":"Actual"},{"x":46,"y":324,"fill":"Actual"},{"x":47,"y":330,"fill":"Actual"},{"x":48,"y":289,"fill":"Actual"},{"x":49,"y":386,"fill":"Actual"},{"x":50,"y":409,"fill":"Actual"},{"x":51,"y":398,"fill":"Actual"},{"x":52,"y":407,"fill":"Actual"},{"x":53,"y":359,"fill":"Actual"},{"x":54,"y":373,"fill":"Actual"},{"x":55,"y":318,"fill":"Actual"},{"x":56,"y":265,"fill":"Actual"},{"x":57,"y":292,"fill":"Actual"},{"x":58,"y":350,"fill":"Actual"},{"x":59,"y":328,"fill":"Actual"},{"x":60,"y":390,"fill":"Actual"},{"x":49,"y":296.2,"fill":"ETS forecast"},{"x":50,"y":296.2,"fill":"ETS forecast"},{"x":51,"y":296.2,"fill":"ETS forecast"},{"x":52,"y":296.2,"fill":"ETS forecast"},{"x":53,"y":296.2,"fill":"ETS forecast"},{"x":54,"y":296.2,"fill":"ETS forecast"},{"x":55,"y":296.2,"fill":"ETS forecast"},{"x":56,"y":296.2,"fill":"ETS forecast"},{"x":57,"y":296.2,"fill":"ETS forecast"},{"x":58,"y":296.2,"fill":"ETS forecast"},{"x":59,"y":296.2,"fill":"ETS forecast"},{"x":60,"y":296.2,"fill":"ETS forecast"},{"x":49,"y":330,"fill":"Seasonal naive forecast"},{"x":50,"y":349,"fill":"Seasonal naive forecast"},{"x":51,"y":377,"fill":"Seasonal naive forecast"},{"x":52,"y":401,"fill":"Seasonal naive forecast"},{"x":53,"y":339,"fill":"Seasonal naive forecast"},{"x":54,"y":322,"fill":"Seasonal naive forecast"},{"x":55,"y":262,"fill":"Seasonal naive forecast"},{"x":56,"y":292,"fill":"Seasonal naive forecast"},{"x":57,"y":308,"fill":"Seasonal naive forecast"},{"x":58,"y":324,"fill":"Seasonal naive forecast"},{"x":59,"y":330,"fill":"Seasonal naive forecast"},{"x":60,"y":289,"fill":"Seasonal naive forecast"}],"geoms":["line"],"x":"month","y":"units","code":{"line":"ggplot(sku05, aes(month, units, color = group)) +\n  geom_line()"}}

Look at how flat the ETS forecast line sits across the final 12 months, while the actual sales swing well above it for most of that stretch. Over those 12 months, the ETS model's forecast missed actual sales by an average of 65.9 units a month. A seasonal naive forecast, the kind that just repeats whatever this SKU sold the same month last year, missed by only 36.8 units. So the model that took real engineering effort to build did worse than a forecast that takes one line of code. That gap is what forecast value added measures, and for SKU-05 it comes out negative.

=== step === concept
## The naive and seasonal naive forecasts

An error number on its own tells you almost nothing. 65.9 units a month, is that good or bad? It depends entirely on what you compare it against, and the fairest comparison is a benchmark that costs nothing to produce.

The simplest such benchmark is the naive forecast: repeat whatever the series did most recently, for every future period. The seasonal naive forecast does one thing differently. It repeats whatever happened at the same point in the last full cycle, in a monthly series, the same month a year back. Monthly retail sales almost always carry a yearly cycle, more sales in some months than others, repeating every 12 months, so a plain naive forecast would miss that shape completely, while seasonal naive captures it for free.

Build all 18 of the chain's SKUs the way the forecasting team actually sees them: 60 months of history each, with the first 48 months set aside to fit a model on and the final 12 held back to check it against. That held-back stretch is called the holdout: the real sales a forecast is finally judged against.

```r
# Build 18 SKUs of 60 months of unit sales: 13 with real seasonal growth, 5 flat and noisy
set.seed(1)
n_months <- 60
month <- 1:n_months

level_sg <- runif(13, 150, 500)
trend_sg <- runif(13, 0.8, 2.5)
amp_sg   <- runif(13, 0.20, 0.35)
noise_sg <- runif(13, 0.08, 0.16)

level_fn <- runif(5, 150, 500)
trend_fn <- runif(5, -0.1, 0.1)
amp_fn   <- runif(5, 0, 0.05)
noise_fn <- runif(5, 0.15, 0.28)

sku_demand <- vector("list", 18)
names(sku_demand) <- sprintf("SKU-%02d", 1:18)

for (i in 1:13) {
  seasonal <- amp_sg[i] * level_sg[i] * sin(2 * pi * month / 12)
  y <- level_sg[i] + trend_sg[i] * month + seasonal + rnorm(n_months, 0, noise_sg[i] * level_sg[i])
  sku_demand[[i]] <- round(pmax(y, 0))
}
for (i in 1:5) {
  seasonal <- amp_fn[i] * level_fn[i] * sin(2 * pi * month / 12)
  y <- level_fn[i] + trend_fn[i] * month + seasonal + rnorm(n_months, 0, noise_fn[i] * level_fn[i])
  sku_demand[[13 + i]] <- round(pmax(y, 0))
}

sku01 <- sku_demand[["SKU-01"]]
train01 <- sku01[1:48]
test01 <- sku01[49:60]

data.frame(month = 49:52,
           actual = test01[1:4],
           naive = rep(train01[48], 4),
           seasonal_naive = train01[37:40])
#>   month actual naive seasonal_naive
#> 1    49    355   271            338
#> 2    50    367   271            315
#> 3    51    395   271            314
#> 4    52    353   271            352
```

SKU-01's holdout starts at month 49. The naive forecast just repeats month 48's value, 271 units, for every one of the next four months. The seasonal naive forecast repeats months 37 to 40, the same four months one year earlier: 338, 315, 314 and 352, which already sit much closer to where actual sales landed.

```r
# Compare the naive and seasonal naive forecasts on the same 4 holdout months
mean(abs(test01[1:4] - rep(train01[48], 4)))
mean(abs(test01[1:4] - train01[37:40]))
#> [1] 96.5
#> [1] 37.75
```

Averaged over those four months, the naive forecast misses by 96.5 units. The seasonal naive forecast misses by only 37.75. That's the whole reason seasonal naive, and not plain naive, is the right minimal yardstick for a series shaped like this one.

=== step === concept
## Mean absolute error, computed by hand

Mean absolute error, MAE, is the average size of a forecast's miss, ignoring whether it missed high or low. Take each month's error (actual minus forecast), strip off the sign, then average those absolute errors over the whole holdout. The result stays in the data's own units, units of stock here, which is one reason forecasters reach for it so often.

Work it out by hand on SKU-01's first four holdout months, against the seasonal naive forecast from the last step.

| Month | Actual | Seasonal naive forecast | Absolute error |
|---|---|---|---|
| 49 | 355 | 338 | 17 |
| 50 | 367 | 315 | 52 |
| 51 | 395 | 314 | 81 |
| 52 | 353 | 352 | 1 |

Add up those four absolute errors, 17 + 52 + 81 + 1 = 151, and divide by 4: MAE = 37.75 units.

```r
# Reproduce the by-hand MAE for SKU-01's first 4 holdout months
abs_errors <- abs(test01[1:4] - train01[37:40])
abs_errors
mean(abs_errors)
#> [1] 17 52 81  1
#> [1] 37.75
```

=== step === concept
## Forecast value added: the formula

Forecast value added, FVA, puts one number on exactly the comparison the last two steps were building toward: how much of the benchmark's error did the model actually remove? FVA = 1 minus the model's MAE divided by the benchmark's MAE, read as a percentage.

A positive FVA means the model beat the free benchmark. Zero means a tie: the model added nothing worth its cost. A negative FVA means the model did worse than doing nothing new, which is exactly what happened with SKU-05 on the cover.

```r
# Fit ETS on SKU-05 and compare its forecast MAE against the seasonal naive benchmark
library(forecast)

sku05 <- sku_demand[["SKU-05"]]
train05 <- ts(sku05[1:48], frequency = 12)
test05 <- sku05[49:60]

fit05 <- ets(train05)
fc_ets05 <- as.numeric(forecast(fit05, h = 12)$mean)
fc_sn05 <- as.numeric(snaive(train05, h = 12)$mean)

mae_ets05 <- mean(abs(test05 - fc_ets05))
mae_sn05 <- mean(abs(test05 - fc_sn05))
fva05 <- 1 - mae_ets05 / mae_sn05

round(c(mae_ets = mae_ets05, mae_sn = mae_sn05, fva_pct = fva05 * 100), 1)
#> mae_ets  mae_sn fva_pct 
#>    65.9    36.8   -79.0 
```

1 minus 65.9 divided by 36.8 comes out to about -0.79, an FVA of -79%. Read that negative sign literally: the model's forecast error was 79% larger than the free benchmark's error, not smaller. ETS took real fitting work, and on this SKU it would have been both cheaper and more accurate to just repeat last year.

=== step === widget
## Computing forecast value added across 18 SKUs

One SKU is just a trial run. The real question for a forecasting team is the whole portfolio: does the model earn its place across all 18 SKUs it is asked to forecast, or only a handful of them?

```r
# Fit ETS and the seasonal naive benchmark for every SKU, then rank by forecast value added
fva_table <- data.frame(sku = character(), mae_ets = numeric(), mae_sn = numeric(), fva = numeric())

for (i in 1:18) {
  y <- sku_demand[[i]]
  train <- ts(y[1:48], frequency = 12)
  test <- y[49:60]
  fit <- ets(train)
  fc_ets <- as.numeric(forecast(fit, h = 12)$mean)
  fc_sn <- as.numeric(snaive(train, h = 12)$mean)
  mae_ets <- mean(abs(test - fc_ets))
  mae_sn <- mean(abs(test - fc_sn))
  fva_table <- rbind(fva_table, data.frame(sku = names(sku_demand)[i],
                                            mae_ets = round(mae_ets, 1),
                                            mae_sn = round(mae_sn, 1),
                                            fva = round(100 * (1 - mae_ets / mae_sn), 1)))
}

fva_table[order(fva_table$fva), ]
#>       sku mae_ets mae_sn   fva
#> 5  SKU-05    65.9   36.8 -79.0
#> 12 SKU-12    44.9   36.7 -22.5
#> 6  SKU-06    65.3   55.3 -18.1
#> 10 SKU-10    39.5   36.4  -8.4
#> 1  SKU-01    40.8   40.9   0.3
#> 13 SKU-13    62.5   66.8   6.4
#> 11 SKU-11    35.2   38.2   7.9
#> 9  SKU-09    46.9   51.5   8.9
#> 2  SKU-02    43.6   50.1  13.0
#> 7  SKU-07    79.1   91.9  13.9
#> 3  SKU-03    56.7   66.7  15.0
#> 17 SKU-17    33.7   40.8  17.3
#> 4  SKU-04    58.8   95.1  38.1
#> 8  SKU-08    32.5   54.8  40.7
#> 18 SKU-18    38.1   66.4  42.6
#> 15 SKU-15    33.9   59.8  43.2
#> 14 SKU-14    50.0   91.4  45.3
#> 16 SKU-16    23.6   45.5  48.1
sum(fva_table$fva > 0)
#> [1] 14
```

::widget styled-table {"cols":["SKU","MAE (ETS)","MAE (seasonal naive)","FVA"],"rows":[["SKU-05",65.9,36.8,-0.79],["SKU-12",44.9,36.7,-0.225],["SKU-06",65.3,55.3,-0.181],["SKU-10",39.5,36.4,-0.084],["SKU-01",40.8,40.9,0.003],["SKU-13",62.5,66.8,0.064],["SKU-11",35.2,38.2,0.079],["SKU-09",46.9,51.5,0.089],["SKU-02",43.6,50.1,0.13],["SKU-07",79.1,91.9,0.139],["SKU-03",56.7,66.7,0.15],["SKU-17",33.7,40.8,0.173],["SKU-04",58.8,95.1,0.381],["SKU-08",32.5,54.8,0.407],["SKU-18",38.1,66.4,0.426],["SKU-15",33.9,59.8,0.432],["SKU-14",50,91.4,0.453],["SKU-16",23.6,45.5,0.481]],"formats":{"MAE (ETS)":"1dp","MAE (seasonal naive)":"1dp","FVA":"pct"},"title":"Forecast value added by SKU, worst to best","note":"ETS fit on months 1 to 48, scored against seasonal naive over months 49 to 60."}

14 of the 18 SKUs score positive. But there are two honest ways to summarize that into one portfolio number, and they do not agree. Pool every SKU's errors together first (sum every MAE, then take the ratio) and you get a pooled FVA of +17%. Average the 18 individual FVA percentages directly instead, treating every SKU as equally important regardless of its size, and you get +11.8%. They differ because pooling lets the noisier, higher-error SKUs carry more weight than the small, quiet ones. Neither number is wrong, but a report should always say which one it means.

=== step === tryit
## Your turn: is this SKU's model worth it?

SKU-10 sits in that table with an ETS MAE of 39.5 and a seasonal naive MAE of 36.4. Compute its forecast value added the same way you just saw for SKU-05, then print whether the result is positive or negative.

```r
# mae_ets10 is 39.5 and mae_sn10 is 36.4.
# Compute forecast value added: 1 minus the ratio of the two MAEs,
# then print it as a percentage.
# Two lines. Press Check when you have them.
```
::check {"regex": "(1\\s*-\\s*[(]?\\s*39\\.5\\s*/\\s*36\\.4\\s*[)]?)|(39\\.5\\s*/\\s*36\\.4)", "gate": true, "difficulty": "beginner", "ok": "Right: about -8.5%. SKU-10 is a small loser, not a dramatic one like SKU-05, but it still lost to the seasonal naive benchmark.", "no": "Write the same ratio you used for SKU-05, with SKU-10's numbers: 1 - (39.5 / 36.4), then print it (multiply by 100 for a percentage)."}
::solution
```r
# Compute forecast value added for SKU-10 from its two MAE numbers
mae_ets10 <- 39.5
mae_sn10 <- 36.4
fva10 <- 1 - mae_ets10 / mae_sn10
round(fva10 * 100, 1)
#> [1] -8.5
```

=== step === concept
## Reading the table: a substantial minority failed
::prose-only reuses the styled-table already rendered in the previous step; no new computation or chart is needed to make this point

Four of the 18 SKUs, SKU-05, SKU-06, SKU-10 and SKU-12, score negative FVA, even though the whole portfolio's pooled FVA is a healthy +17%. A team that only ever checks that one pooled number never sees them.

That matters because those four SKUs are not a rounding error. They are more than a fifth of the portfolio, each one a case where the ETS model, which took real work to fit, forecasts worse than a method that takes one line of code. The only way to catch that is to look at the table row by row, not just at the one number it rolls up to.

=== step === widget
## Why SKU-16 wins and SKU-05 doesn't

SKU-16 posts the best FVA in the whole portfolio, +48.1%. SKU-05 posts the worst, -79.0%. Both get fit by the exact same ETS procedure. So what actually makes the difference?

```r
# Compare what ets() fitted for the big loser (SKU-05) and the big winner (SKU-16)
sku16 <- sku_demand[["SKU-16"]]
train16 <- ts(sku16[1:48], frequency = 12)
test16 <- sku16[49:60]

fit16 <- ets(train16)
fc_ets16 <- as.numeric(forecast(fit16, h = 12)$mean)
fc_sn16 <- as.numeric(snaive(train16, h = 12)$mean)

mae_ets16 <- mean(abs(test16 - fc_ets16))
mae_sn16 <- mean(abs(test16 - fc_sn16))
fva16 <- 1 - mae_ets16 / mae_sn16

data.frame(sku = c("SKU-05", "SKU-16"),
           ets_model = c(fit05$method, fit16$method),
           flat_forecast = round(c(fc_ets05[1], fc_ets16[1]), 1),
           mae_ets = round(c(mae_ets05, mae_ets16), 1),
           mae_sn = round(c(mae_sn05, mae_sn16), 1),
           fva_pct = round(c(fva05, fva16) * 100, 1))
#>      sku  ets_model flat_forecast mae_ets mae_sn fva_pct
#> 1 SKU-05 ETS(A,N,N)         296.2    65.9   36.8   -79.0
#> 2 SKU-16 ETS(A,N,N)         172.8    23.6   45.5    48.1
```

::widget chart-plotter {"data":[{"x":1,"y":180,"fill":"Actual"},{"x":2,"y":117,"fill":"Actual"},{"x":3,"y":163,"fill":"Actual"},{"x":4,"y":137,"fill":"Actual"},{"x":5,"y":176,"fill":"Actual"},{"x":6,"y":206,"fill":"Actual"},{"x":7,"y":212,"fill":"Actual"},{"x":8,"y":181,"fill":"Actual"},{"x":9,"y":126,"fill":"Actual"},{"x":10,"y":207,"fill":"Actual"},{"x":11,"y":234,"fill":"Actual"},{"x":12,"y":278,"fill":"Actual"},{"x":13,"y":155,"fill":"Actual"},{"x":14,"y":201,"fill":"Actual"},{"x":15,"y":235,"fill":"Actual"},{"x":16,"y":174,"fill":"Actual"},{"x":17,"y":201,"fill":"Actual"},{"x":18,"y":184,"fill":"Actual"},{"x":19,"y":165,"fill":"Actual"},{"x":20,"y":177,"fill":"Actual"},{"x":21,"y":213,"fill":"Actual"},{"x":22,"y":188,"fill":"Actual"},{"x":23,"y":150,"fill":"Actual"},{"x":24,"y":71,"fill":"Actual"},{"x":25,"y":140,"fill":"Actual"},{"x":26,"y":178,"fill":"Actual"},{"x":27,"y":64,"fill":"Actual"},{"x":28,"y":281,"fill":"Actual"},{"x":29,"y":108,"fill":"Actual"},{"x":30,"y":121,"fill":"Actual"},{"x":31,"y":239,"fill":"Actual"},{"x":32,"y":68,"fill":"Actual"},{"x":33,"y":203,"fill":"Actual"},{"x":34,"y":153,"fill":"Actual"},{"x":35,"y":192,"fill":"Actual"},{"x":36,"y":215,"fill":"Actual"},{"x":37,"y":133,"fill":"Actual"},{"x":38,"y":146,"fill":"Actual"},{"x":39,"y":42,"fill":"Actual"},{"x":40,"y":135,"fill":"Actual"},{"x":41,"y":194,"fill":"Actual"},{"x":42,"y":197,"fill":"Actual"},{"x":43,"y":265,"fill":"Actual"},{"x":44,"y":172,"fill":"Actual"},{"x":45,"y":190,"fill":"Actual"},{"x":46,"y":172,"fill":"Actual"},{"x":47,"y":149,"fill":"Actual"},{"x":48,"y":208,"fill":"Actual"},{"x":49,"y":198,"fill":"Actual"},{"x":50,"y":185,"fill":"Actual"},{"x":51,"y":142,"fill":"Actual"},{"x":52,"y":177,"fill":"Actual"},{"x":53,"y":213,"fill":"Actual"},{"x":54,"y":205,"fill":"Actual"},{"x":55,"y":149,"fill":"Actual"},{"x":56,"y":138,"fill":"Actual"},{"x":57,"y":192,"fill":"Actual"},{"x":58,"y":217,"fill":"Actual"},{"x":59,"y":176,"fill":"Actual"},{"x":60,"y":159,"fill":"Actual"},{"x":49,"y":172.8,"fill":"ETS forecast"},{"x":50,"y":172.8,"fill":"ETS forecast"},{"x":51,"y":172.8,"fill":"ETS forecast"},{"x":52,"y":172.8,"fill":"ETS forecast"},{"x":53,"y":172.8,"fill":"ETS forecast"},{"x":54,"y":172.8,"fill":"ETS forecast"},{"x":55,"y":172.8,"fill":"ETS forecast"},{"x":56,"y":172.8,"fill":"ETS forecast"},{"x":57,"y":172.8,"fill":"ETS forecast"},{"x":58,"y":172.8,"fill":"ETS forecast"},{"x":59,"y":172.8,"fill":"ETS forecast"},{"x":60,"y":172.8,"fill":"ETS forecast"},{"x":49,"y":133,"fill":"Seasonal naive forecast"},{"x":50,"y":146,"fill":"Seasonal naive forecast"},{"x":51,"y":42,"fill":"Seasonal naive forecast"},{"x":52,"y":135,"fill":"Seasonal naive forecast"},{"x":53,"y":194,"fill":"Seasonal naive forecast"},{"x":54,"y":197,"fill":"Seasonal naive forecast"},{"x":55,"y":265,"fill":"Seasonal naive forecast"},{"x":56,"y":172,"fill":"Seasonal naive forecast"},{"x":57,"y":190,"fill":"Seasonal naive forecast"},{"x":58,"y":172,"fill":"Seasonal naive forecast"},{"x":59,"y":149,"fill":"Seasonal naive forecast"},{"x":60,"y":208,"fill":"Seasonal naive forecast"}],"geoms":["line"],"x":"month","y":"units","code":{"line":"ggplot(sku16, aes(month, units, color = group)) +\n  geom_line()"}}

Both fits land on ETS(A,N,N): additive error, no trend, no seasonal term, just a level that gets nudged a little by each new month. The letters are identical. What differs is whether that no-trend assumption actually matches the SKU underneath it.

SKU-16 really is flat. Look at the actual line in the chart above: it wanders between roughly 42 and 281 with no real climb or fall, so a flat forecast of 172.8 for every one of the next 12 months is a reasonable bet. The seasonal naive forecast, on the other hand, repeats whatever happened a year back, month by noisy month, including a low of 42 that has nothing to do with this year. That noise is what seasonal naive drags into its forecast, and it's why ETS's flat line beats it so clearly.

SKU-05 is the opposite case. It has a real upward trend built into the data (the chart on the cover showed it climbing from under 200 up past 400 over its history), but ETS still picked no trend term, so its flat forecast of 296.2 undershoots a series whose level has kept rising all along. The seasonal naive forecast, by contrast, repeats last year's values, and because the series had already climbed by then, those repeated values happen to land much closer to where sales actually are now. Seasonal naive wins here for the same reason it loses on SKU-16: it carries forward whatever the series already did a year ago, for better or for worse. On a flat series that is noise worth avoiding. On a trending series it is signal ETS missed.

=== step === concept
## Forecast value added is not just model versus naive

Everything so far has scored one thing against one other thing: a model against a naive benchmark. But that is a special case of a more general idea.

Michael Gilliland, who introduced forecast value added, applied the same logic to every step in a forecasting process, including a human one. A planner's manual override is only worth keeping if its MAE beats the statistical forecast it replaces. The statistical forecast becomes the new benchmark, and the override step either adds value against it or it doesn't.

Apply a random judgmental nudge, averaging 0 with 7% of the forecast moving it up or down, to all 18 SKUs' ETS forecasts, as a stand-in for an analyst adjusting each number by feel.

```r
# Apply a random judgmental override to every SKU's ETS forecast and score it against the statistical forecast
set.seed(99)

override <- sapply(1:18, function(i) {
  y <- sku_demand[[i]]
  train <- ts(y[1:48], frequency = 12)
  test <- y[49:60]
  fit <- ets(train)
  fc_ets <- as.numeric(forecast(fit, h = 12)$mean)
  nudge <- rnorm(12, 0, 0.07)
  fc_override <- fc_ets * (1 + nudge)
  c(mae_ets = mean(abs(test - fc_ets)), mae_override = mean(abs(test - fc_override)))
})

pooled_mae_ets <- mean(override["mae_ets", ])
pooled_mae_override <- mean(override["mae_override", ])
pooled_fva_override <- 1 - pooled_mae_override / pooled_mae_ets

round(c(statistical = pooled_mae_ets, override = pooled_mae_override, fva_pct = pooled_fva_override * 100), 1)
#> statistical    override     fva_pct 
#>        47.3        51.4        -8.7 
sum(override["mae_override", ] < override["mae_ets", ])
sum(override["mae_override", ] > override["mae_ets", ])
#> [1] 3
#> [1] 15
```

::widget styled-table {"cols":["Step","Pooled MAE","FVA vs prior step"],"rows":[["Statistical forecast (ETS)",47.3,null],["Analyst override",51.4,-0.087]],"formats":{"Pooled MAE":"1dp","FVA vs prior step":"pct"},"title":"Scoring the analyst override against the statistical forecast","note":"Pooled MAE averaged across all 18 SKUs. Override = ETS forecast nudged by a random, roughly 7% judgment call."}

The override step scores a pooled FVA of -8.7% against the statistical forecast it adjusted. It helped on only 3 of the 18 SKUs and hurt on the other 15. Notice that the question here is not "does the override beat seasonal naive". It's "does the override beat the step right before it in the process", which is the statistical forecast. That is the same FVA formula, just pointed at a different benchmark.

=== step === quiz
## Quick check: does a positive aggregate FVA mean every model is worth keeping?

A team reports a pooled FVA of +17% across its 18-SKU portfolio and concludes every SKU's ETS model is worth keeping.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, a positive pooled FVA means the model is earning its keep everywhere it runs. ::no
- No. A positive pooled FVA can still hide a meaningful minority of SKUs where the model actually lost to the benchmark, as with 4 of the 18 SKUs here, so each series still needs checking on its own. ::ok Exactly. The pooled number and the per-SKU numbers can tell two different stories, and only the per-SKU table shows you which SKUs are the exceptions.
- No, because FVA is only a valid measure when it is computed on RMSE instead of MAE. ::no
- No, because a seasonal naive benchmark is never a fair comparison for retail sales data. ::no A pooled or portfolio-wide FVA can look healthy while a real minority of series underneath it are still losing to the benchmark, exactly as happened here: 4 of the 18 SKUs scored negative even though the pooled FVA was a healthy +17%. The only way to catch that is to check FVA SKU by SKU, not just read the one number it rolls up to.

=== step === tryit
## Your turn: score the override step

For SKU-16, the statistical forecast's MAE is 23.6 and its override's MAE is 31.3. Compute the override's forecast value added against the statistical forecast, and print whether it helped or hurt.

```r
# The statistical forecast's MAE for SKU-16 is 23.6, and its override's MAE is 31.3.
# Compute forecast value added for the override step: 1 minus the ratio of
# the override's MAE to the statistical forecast's MAE, then print it as a percentage.
# Two lines. Press Check when you have them.
```
::check {"regex": "(1\\s*-\\s*[(]?\\s*31\\.3\\s*/\\s*23\\.6\\s*[)]?)|(31\\.3\\s*/\\s*23\\.6)", "gate": true, "difficulty": "intermediate", "ok": "Right: about -32.6%. The override made SKU-16, one of the model's best performers, markedly worse.", "no": "Use the same ratio as before, but with the override's MAE on top and the statistical forecast's MAE on the bottom: 1 - (31.3 / 23.6)."}
::solution
```r
# Compute forecast value added for the override step on SKU-16
mae_stat16 <- 23.6
mae_override16 <- 31.3
fva_override16 <- 1 - mae_override16 / mae_stat16
round(fva_override16 * 100, 1)
#> [1] -32.6
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.2, Some simple forecasting methods](https://otexts.com/fpp3/simple-methods.html) - Hyndman and Athanasopoulos (3rd ed.), the definitions of the naive and seasonal naive methods used as the benchmark throughout.
- [Forecasting: Principles and Practice, section 5.8, Evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) - Hyndman and Athanasopoulos (3rd ed.), the source for MAE as used in this lesson.
- Gilliland, M. (2002), "Is Forecasting a Waste of Time?", Supply Chain Management Review. The article that introduced forecast value added as a test of whether a forecasting process step earns its cost.
- Fildes, R. and Goodwin, P. (2007), "Against Your Better Judgment? How Organizations Can Improve Their Use of Management Judgment in Forecasting," Interfaces, 37(6). On how judgmental overrides perform against the statistical forecasts they adjust.
- [forecast package on CRAN](https://cran.r-project.org/package=forecast) - documentation for `ets()`, `snaive()` and `forecast()`, the functions used throughout.

=== step === complete
## Judge every forecast against what it replaced

A model's error number means nothing by itself. It only means something once it's set against a benchmark that costs nothing to produce, the naive or seasonal naive forecast.

Forecast value added puts a number on that comparison: 1 minus the model's MAE over the benchmark's MAE. Positive means the model earned its cost. Negative means it didn't, no matter how much work went into fitting it. And the same formula applies one level up, scoring any step in a forecasting process, including a human override, against the step it replaced.

The one habit worth keeping from this whole lesson: check FVA series by series and step by step, never only in aggregate. A healthy pooled number can still be hiding more than a fifth of the portfolio quietly losing to a forecast anyone could have written for free.

Averaging errors honestly across series of very different sizes and scales, without letting one noisy SKU dominate the number, is its own problem, and that's exactly where this goes next.

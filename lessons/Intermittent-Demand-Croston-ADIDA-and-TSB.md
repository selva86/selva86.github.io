---
title: "The Expert Edge in Forecasting Like a Pro Lesson 3: Forecasting intermittent demand with Croston, ADIDA and TSB"
catalog_blurb: "Forecast demand that's mostly zero, judged with a metric MAE gets wrong."
description: "Forecast a mostly-zero spare-parts demand series in R with Croston, ADIDA and TSB, then judge the result with Periods in Stock rather than plain MAE or RMSE."
keywords: "Croston method, ADIDA, TSB method, intermittent demand forecasting, tsintermittent R package, demand interval, periods in stock metric, SBA correction, spare parts forecasting, zero inflated demand"
post_type: "LESSON"
curriculum_id: "5.150.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "3"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Forecast-Value-Added-Are-You-Beating-the-Naive-Baseline.html"
course_prev: "Conformal-Prediction-Intervals-for-Time-Series.html"
---

=== step === cover
## Forecasting intermittent demand with Croston, ADIDA and TSB

Today let's understand how to forecast demand that is mostly zero, the kind a spare part gets when it only sells once in a while.

A parts warehouse stocks a replacement bearing for a factory conveyor. Here is how many of these bearings it sold, week by week, over the last 104 weeks.

::widget chart-plotter {"data":[{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":0},{"x":10,"y":3},{"x":11,"y":0},{"x":12,"y":0},{"x":13,"y":7},{"x":14,"y":0},{"x":15,"y":0},{"x":16,"y":0},{"x":17,"y":0},{"x":18,"y":4},{"x":19,"y":0},{"x":20,"y":0},{"x":21,"y":4},{"x":22,"y":0},{"x":23,"y":0},{"x":24,"y":0},{"x":25,"y":0},{"x":26,"y":1},{"x":27,"y":0},{"x":28,"y":0},{"x":29,"y":2},{"x":30,"y":0},{"x":31,"y":0},{"x":32,"y":4},{"x":33,"y":0},{"x":34,"y":1},{"x":35,"y":0},{"x":36,"y":2},{"x":37,"y":0},{"x":38,"y":1},{"x":39,"y":0},{"x":40,"y":0},{"x":41,"y":2},{"x":42,"y":0},{"x":43,"y":0},{"x":44,"y":0},{"x":45,"y":0},{"x":46,"y":0},{"x":47,"y":0},{"x":48,"y":0},{"x":49,"y":0},{"x":50,"y":7},{"x":51,"y":4},{"x":52,"y":0},{"x":53,"y":0},{"x":54,"y":3},{"x":55,"y":0},{"x":56,"y":2},{"x":57,"y":0},{"x":58,"y":0},{"x":59,"y":0},{"x":60,"y":0},{"x":61,"y":0},{"x":62,"y":0},{"x":63,"y":0},{"x":64,"y":0},{"x":65,"y":0},{"x":66,"y":0},{"x":67,"y":0},{"x":68,"y":0},{"x":69,"y":0},{"x":70,"y":0},{"x":71,"y":0},{"x":72,"y":0},{"x":73,"y":0},{"x":74,"y":0},{"x":75,"y":0},{"x":76,"y":0},{"x":77,"y":0},{"x":78,"y":3},{"x":79,"y":0},{"x":80,"y":0},{"x":81,"y":0},{"x":82,"y":0},{"x":83,"y":0},{"x":84,"y":0},{"x":85,"y":0},{"x":86,"y":0},{"x":87,"y":0},{"x":88,"y":0},{"x":89,"y":2},{"x":90,"y":3},{"x":91,"y":0},{"x":92,"y":0},{"x":93,"y":0},{"x":94,"y":3},{"x":95,"y":0},{"x":96,"y":0},{"x":97,"y":0},{"x":98,"y":0},{"x":99,"y":0},{"x":100,"y":0},{"x":101,"y":4},{"x":102,"y":0},{"x":103,"y":0},{"x":104,"y":0}],"geoms":["bar"],"x":"week","y":"units","code":{"bar":"ggplot(bearing_demand, aes(factor(week), units)) +\n  geom_col()"}}

Look at how the bars sit flat on the floor almost everywhere. Only a handful of weeks show a bar at all, and even then the height never climbs past single digits. That is what makes this series different from the sales charts you have forecast before, and it is going to need a different set of tools.

=== step === concept
## What makes a demand series intermittent

A series like this one has a name in forecasting: intermittent demand. Most periods see no demand at all, and the periods that do see demand arrive at irregular gaps.

Every week in a series like this carries two separate facts. The first is demand occurrence: did an order happen this week, yes or no. The second is demand size: if an order did happen, how many units did it ask for. A week can report zero on occurrence, and in that case size never even comes up. Keeping these two facts apart is going to matter a lot very soon.

Two numbers describe how intermittent a series actually is. The average demand interval (ADI) is the average number of weeks between one order and the next. The squared coefficient of variation of demand size (CV2) measures how much order size varies from one order to the next, relative to its average: a CV2 near 0 means every order is about the same size, and a larger CV2 means order sizes bounce around a lot.

The `tsintermittent` package computes both of these from the raw series, and recommends which smoothing method fits the pattern it finds.

```r
# Build the bearing's 104-week demand series and measure how intermittent it is
library(tsintermittent)

set.seed(9)
n <- 104
occurs <- rbinom(n, 1, 0.14)
sizes <- rpois(n, 2) + 1
demand <- occurs * sizes

round(mean(demand == 0), 3)
idc <- idclass(matrix(demand, nrow = 1))
idc$p
round(idc$cv2, 3)
idc$summary
#> [1] 0.808
#> [1] 5.05
#> [1] 0.295
#>         Series
#> Croston      0
#> SBA          1
#> SES          0
```

80.8% of weeks really do show zero, matching the chart you just looked at. The average demand interval is 5.05 weeks between orders, and CV2 is 0.295, meaning order sizes vary a fair amount but not wildly. The summary table is `idclass()`'s recommendation: a 1 next to SBA and 0s next to Croston and SES means this series calls for the SBA-corrected variant of Croston's method, not plain Croston and not simple exponential smoothing (SES). You will meet SBA by name later in this lesson.

One more fact worth having on hand: across the 20 weeks that do carry an order, order size ranges from 1 to 7 units.

=== step === concept
## Why exponential smoothing fails here

Before trying any forecasting method, split the series in two. The first 80 weeks become the training set, the one each method gets to learn from. The last 24 weeks become the test set, held back so you can check a forecast against what actually happened.

A natural first attempt is exponential smoothing: smooth the series down to a single running level, and forecast that level forward. In R, that model is called ETS(A,N,N): additive error, no trend, no seasonality, just a level that updates a little with every new observation. How fast it updates is controlled by alpha. Alpha close to 1 means the level jumps almost all the way to the newest observation; alpha close to 0 means barely move the level no matter what comes in.

```r
# Fit simple exponential smoothing and forecast the 24-week holdout
library(forecast)

train <- demand[1:80]
test <- demand[81:104]

fit_ets <- ets(train, model = "ANN")
round(fit_ets$par["alpha"], 4)

ets_forecast <- as.numeric(forecast(fit_ets, h = 24)$mean)
round(ets_forecast[1:5], 3)
#> alpha 
#> 1e-04 
#> [1] 0.625 0.625 0.625 0.625 0.625
```

Alpha comes out at 0.0001, about as close to zero as a smoothing weight can get. The level barely moves no matter what the series does from week to week, because ETS sees a series that is mostly zero with the occasional spike and has no way to treat that pattern as anything other than noise sitting around one constant rate. Every one of the 24 forecasts rounds to the same 0.625 units a week, visible in the first five values above.

Now compare that flat number to what the holdout actually did.

```r
# Print the real 24-week holdout to compare against the flat ETS forecast
test
#> [1] 0 0 0 0 0 0 0 0 2 3 0 0 0 3 0 0 0 0 0 0 4 0 0 0
```

Twenty of those 24 weeks are a flat zero, and a forecast of 0.625 is wrong on every single one of them. It is also wrong, in the other direction, on the four weeks that do carry an order: 2, 3, 3 and 4 units, each undershot by a forecast that never moves. 0.625 is not a bad estimate of the long-run average rate. It is just a number that no individual week ever actually shows, and not a figure a warehouse could order stock against. Intermittent demand needs a method built around that mismatch, not a single smoothed level.

=== step === concept
## Croston's method: splitting demand size from demand interval

Croston's method, published by J.D. Croston in 1972, starts from the two facts the idclass check told apart earlier: demand occurrence and demand size. Instead of smoothing the raw series, which is mostly zeros, it smooths two separate running averages, and only updates them on a week an order actually happens.

Call the first running average Z: the smoothed order size, updated only on a week that has an order. Call the second X: the smoothed interval, in weeks, since the previous order. Both update the same way an exponential smoothing level does, with a weight w: the new value is w times what just happened, plus (1 - w) times the old running average. Croston's forecast for every future week is simply Z divided by X, the smoothed order size spread evenly over the smoothed gap between orders.

Work through it by hand on the first few training weeks, with w = 0.1. Weeks 1 through 9 are all zero: no order happens, so neither Z nor X has anything to update from, and there is no forecast yet. Week 10 brings the first order, 3 units, 10 weeks after the series started. That first sighting becomes the starting values directly: Z = 3, X = 10, and the forecast right after week 10 is Z / X = 3 / 10 = 0.30 units a week.

```r
# Hand-compute Croston's Z (size) and X (interval), updating only on order weeks
w <- 0.1
Z <- NA
X <- NA
last_order_week <- 0
croston_trace <- data.frame(week = integer(), demand = numeric(),
                             Z = numeric(), X = numeric(), forecast = numeric())

for (t in seq_along(train)) {
  if (train[t] > 0) {
    interval <- t - last_order_week
    if (is.na(Z)) {
      Z <- train[t]
      X <- interval
    } else {
      Z <- w * train[t] + (1 - w) * Z
      X <- w * interval + (1 - w) * X
    }
    last_order_week <- t
    croston_trace <- rbind(croston_trace,
      data.frame(week = t, demand = train[t], Z = round(Z, 2),
                 X = round(X, 2), forecast = round(Z / X, 3)))
  }
}
print(croston_trace, row.names = FALSE)
#>  week demand    Z     X forecast
#>    10      3 3.00 10.00    0.300
#>    13      7 3.40  9.30    0.366
#>    18      4 3.46  8.87    0.390
#>    21      4 3.51  8.28    0.424
#>    26      1 3.26  7.95    0.410
#>    29      2 3.14  7.46    0.420
#>    32      4 3.22  7.01    0.460
#>    34      1 3.00  6.51    0.461
#>    36      2 2.90  6.06    0.479
#>    38      1 2.71  5.65    0.479
#>    41      2 2.64  5.39    0.490
#>    50      7 3.08  5.75    0.535
#>    51      4 3.17  5.28    0.601
#>    54      3 3.15  5.05    0.624
#>    56      2 3.04  4.74    0.640
#>    78      3 3.03  6.47    0.469
```

Watch what happens over these 16 order weeks. Z stays anchored close to 3: every new order pulls it a little, but w = 0.1 keeps that pull gentle. X drifts down from 10 to under 5, because orders start arriving a bit more often than that first 10-week gap suggested. The forecast, their ratio, climbs steadily from 0.30 toward 0.64 as X shrinks faster than Z grows, then eases back down once the long 22-week gap before week 78 pulls X back up.

That hand trace is exactly what the `crost()` function in `tsintermittent` automates, with one more correction on top.

```r
# Fit Croston's method with the SBA bias correction
cro <- crost(train, w = 0.1, type = "sba", h = 24)
round(cro$frc.out[1], 3)
#> [1] 0.573
```

`crost()` returns 0.573 units a week for every one of the 24 holdout weeks, a little below the raw Z/X ratio the hand trace was heading toward. That is the SBA correction: `type = "sba"` multiplies the plain Croston ratio by 1 - w/2, which here is 1 - 0.1/2 = 0.95. Plain Croston's ratio is known to run a little high on average, and the SBA (Syntetos-Boylan Approximation) factor corrects for that bias, which is exactly why the idclass check earlier flagged SBA, not plain Croston, as the right variant for a series with this ADI and CV2.

=== step === concept
## TSB: updating the probability of an order every week

Croston's method has one quirk worth noticing: X, the smoothed interval, only updates on a week that has an order. During a long run of zero weeks, Croston's forecast does not move at all, because there is nothing for X to update from. Teunter, Syntetos and Babai published a fix for this in 2011, called TSB.

TSB smooths two different running quantities. One is p: a running measure of how likely an order is in a given week, nudged toward 1 after an order week and toward 0 after a zero week. The other is z: the smoothed order size, updated only on an order week, exactly like Croston's Z. The forecast for the next week is simply p times z.

The mechanical difference from Croston is this: p updates every single week, whether that week has an order or not. z, like Croston's Z, only moves on an order week.

Trace the first 10 training weeks by hand, with both weights set to 0.1. `tsb()` fits its own starting values for p and z directly from the series: here p starts at 1.45 and z at 0.79, for a first forecast of p times z = 1.45 x 0.79 = 1.14 units a week.

```r
# Hand-compute TSB's p (order likelihood) and z (order size), updating p every week
tsb_fit <- tsb(train, w = c(0.1, 0.1), h = 24)
p0 <- tsb_fit$initial[1]
z0 <- tsb_fit$initial[2]

wp <- 0.1
wz <- 0.1
p <- p0
z <- z0
tsb_trace <- data.frame(week = 0, demand = NA, p = round(p0, 3),
                         z = round(z0, 3), forecast = round(p0 * z0, 3))

for (t in 1:10) {
  ordered <- as.numeric(train[t] > 0)
  p <- p + wp * (ordered - p)
  if (ordered == 1) z <- z + wz * (train[t] - z)
  tsb_trace <- rbind(tsb_trace,
    data.frame(week = t, demand = train[t], p = round(p, 3),
               z = round(z, 3), forecast = round(p * z, 3)))
}
print(tsb_trace, row.names = FALSE)
#>  week demand     p     z forecast
#>     0     NA 1.451 0.788    1.143
#>     1      0 1.306 0.788    1.029
#>     2      0 1.175 0.788    0.926
#>     3      0 1.058 0.788    0.833
#>     4      0 0.952 0.788    0.750
#>     5      0 0.857 0.788    0.675
#>     6      0 0.771 0.788    0.607
#>     7      0 0.694 0.788    0.547
#>     8      0 0.625 0.788    0.492
#>     9      0 0.562 0.788    0.443
#>    10      3 0.606 1.009    0.611
```

Weeks 1 through 9 are all zero, same as before. Each zero week nudges p down by 10% of the gap between p and 0, that weight 0.1 again, while z does not move at all, since z only updates on an order week. After 9 such nudges p has fallen from 1.45 to 0.56, and the forecast p times z has fallen from 1.14 to 0.44. Week 10 brings the first order, 3 units: that single observation pulls p up toward 1 (to 0.61) and pulls z toward the order size (to 1.01), and the forecast jumps back up to 0.61.

Notice what Croston could never do here. During those 9 zero weeks, Croston's X stayed frozen, waiting for the next order to tell it anything. TSB's p kept moving every single week, heading toward 0. If this part's orders had simply stopped altogether from week 1 onward, p would keep falling toward 0 forever, and the forecast p times z would follow it down to 0. Croston's ratio Z/X can never reach 0 this way, because X only grows on an order week and never shrinks on a zero week; a part that is actually discontinued keeps a stale, nonzero Croston forecast long after its orders have stopped for good.

```r
# Fit TSB over the whole training set and read its forecast
round(tsb_fit$frc.out[1], 3)
#> [1] 0.305
```

Over the full 80 training weeks, `tsb()` settles on 0.305 units a week for every one of the 24 holdout weeks, noticeably lower than Croston-SBA's 0.573. The reason is the mechanism the hand trace just showed: the training set has far more zero weeks than order weeks, 64 against 16, and every one of those 64 zero weeks nudged p down a little further. Croston's X only ever grows on an order week, so it cannot register that extra silence the way TSB's p does, and TSB ends up forecasting a lower rate because it is the only one of the two methods actually counting the zero weeks into its estimate of how often an order happens.

=== step === widget
## ADIDA: aggregate, forecast, disaggregate

Croston and TSB both work on the series one week at a time. ADIDA, short for Aggregate-Disaggregate Intermittent Demand Approach, takes a different route: it changes the time scale first.

Group the 80 training weeks into blocks of 5 consecutive weeks each, and sum the demand inside every block. 80 weeks divided into blocks of 5 gives 16 blocks.

```r
# Sum the 80 weekly values into 16 blocks of 5 weeks each, and compare how often each view is zero
block_sums <- sapply(1:16, function(i) sum(train[((i - 1) * 5 + 1):(i * 5)]))
block_sums

round(mean(train == 0), 3)
round(mean(block_sums == 0), 3)
#> [1] 0 3 7 4 4 3 5 3 2 7 7 2 0 0 0 3
#> [1] 0.8
#> [1] 0.25
```

80% of the individual training weeks show zero, the same figure you have seen throughout this lesson. But only 4 of the 16 blocks show zero, a quarter of them. Summing 5 weeks at a time does not add any new orders. It just groups the series into chunks wide enough that most chunks catch at least one order somewhere inside them. The series has not changed; the window you are looking through it has.

Here is that same block-aggregated series. Switch between the bar and line view to see the same 16 numbers.

::widget chart-plotter {"data":[{"x":1,"y":0},{"x":2,"y":3},{"x":3,"y":7},{"x":4,"y":4},{"x":5,"y":4},{"x":6,"y":3},{"x":7,"y":5},{"x":8,"y":3},{"x":9,"y":2},{"x":10,"y":7},{"x":11,"y":7},{"x":12,"y":2},{"x":13,"y":0},{"x":14,"y":0},{"x":15,"y":0},{"x":16,"y":3}],"geoms":["bar","line"],"x":"block","y":"units","code":{"bar":"ggplot(blocks, aes(factor(block), units)) +\n  geom_col()","line":"ggplot(blocks, aes(block, units)) +\n  geom_line()"}}

On this aggregated scale, simple exponential smoothing, the same method that failed back when it saw the raw weekly series, can do a reasonable job, because the series it sees now looks far less like a wall of zeros.

```r
# Smooth the 16 blocks directly, then spread the forecast back over 5 weeks
ses_fit <- ses(block_sums, h = 1)
round(as.numeric(ses_fit$mean), 2)
round(as.numeric(ses_fit$mean) / 5, 3)
#> [1] 3.12
#> [1] 0.625
```

Simple exponential smoothing on the 16 blocks forecasts 3.12 units for the next block. Spread evenly across its 5 weeks, that is 3.12 / 5 = 0.625 units a week, the rate ADIDA would hand back if it only ever aggregated at this one block size. The `imapa()` function in `tsintermittent` does the same aggregate-forecast-disaggregate routine, but at many block sizes at once, and combines all of their disaggregated rates into one answer.

```r
# Run ADIDA across many aggregation levels at once and read its combined forecast
imapa_fit <- imapa(train, h = 24)
round(imapa_fit$frc.out[1], 3)
#> [1] 0.642
```

`imapa()` lands on 0.642 units a week, close to but not identical to the single-block-size estimate of 0.625, because it is blending evidence from several aggregation levels rather than betting on one choice of block size.

=== step === widget
## Comparing Croston, ADIDA and TSB on the same holdout

Four methods now have a forecast for the 24-week holdout: ETS at 0.625, Croston-SBA at 0.573, ADIDA at 0.642, TSB at 0.305, every one of them a flat rate repeated for all 24 weeks. Add one more for comparison: a naive forecast that simply guesses 0 every week, no model at all.

Score every one of the five against the actual 24 holdout weeks, which add up to 12 units total, using two familiar accuracy metrics. Mean Absolute Error (MAE) averages the absolute gap between forecast and actual over the 24 weeks. Root Mean Squared Error (RMSE) does the same with squared gaps, which punishes one big miss more than MAE does.

```r
# Score every method's flat forecast against the 24-week holdout
mae  <- function(forecast, actual) mean(abs(forecast - actual))
rmse <- function(forecast, actual) sqrt(mean((forecast - actual)^2))

naive_forecast   <- rep(0, 24)
croston_forecast <- as.numeric(cro$frc.out)
adida_forecast   <- as.numeric(imapa_fit$frc.out)
tsb_forecast     <- as.numeric(tsb_fit$frc.out)

sum(test)
round(c(naive = mae(naive_forecast, test), ets = mae(ets_forecast, test),
        croston = mae(croston_forecast, test), adida = mae(adida_forecast, test),
        tsb = mae(tsb_forecast, test)), 2)
round(c(naive = rmse(naive_forecast, test), ets = rmse(ets_forecast, test),
        croston = rmse(croston_forecast, test), adida = rmse(adida_forecast, test),
        tsb = rmse(tsb_forecast, test)), 2)
#> [1] 12
#>   naive     ets croston   adida     tsb 
#>    0.50    0.92    0.88    0.93    0.70 
#>   naive     ets croston   adida     tsb 
#>    1.26    1.16    1.16    1.16    1.17
```

Here is every method's forecast rate and its score against the holdout, side by side.

::widget styled-table {"cols":["method","weekly forecast rate","MAE","RMSE"],"rows":[["Naive (always 0)","0.000","0.50","1.26"],["ETS(A,N,N)","0.625","0.92","1.16"],["Croston-SBA","0.573","0.88","1.16"],["ADIDA (imapa)","0.642","0.93","1.16"],["TSB","0.305","0.70","1.17"]],"title":"Five forecasts against the same 24-week holdout","note":"Switch to the report table for the same numbers with cleaner labels."}

Look at the MAE column. The naive always-0 forecast posts 0.50, the lowest of all five, lower even than every method built specifically for intermittent demand. TSB comes next at 0.70, then Croston-SBA at 0.88, ETS at 0.92, and ADIDA at 0.93. That should feel wrong: a forecast of flat zero beating four purpose-built methods on the exact metric usually used to pick a winner.

=== step === concept
## Why accuracy metrics reward forecasting zero

80.8% of the holdout's own weeks are truly 0, so a forecast of 0 scores a perfect zero error on roughly four weeks out of every five. That is the entire reason naive always-0 posted the lowest MAE in the comparison table: MAE and RMSE both average the error week by week, and on a series this sparse, guessing zero is right most of the time by sheer arithmetic, whether or not it tells you anything useful.

Build a different kind of score: Periods in Stock (PIS). Imagine a running stock position that starts at 0. Every week, add that week's forecast to it, what you planned to have on hand, then subtract that week's actual demand, what left the shelf. That gives one running number for every week of the holdout, tracking whether, cumulatively, you have been ordering enough.

PIS does not just read off where that running position ends up in the final week. It adds up the running position itself, across all 24 weeks. A method that falls behind early and stays behind pays for every week it spends behind, not just the last one, which is closer to how a warehouse actually feels a shortage: a part that has sat out of stock for 20 straight weeks has cost 20 weeks of lost sales, not one.

```r
# Track the running stock position week by week, for naive-always-0 and TSB
pis_running <- function(forecast, actual) cumsum(forecast - actual)

data.frame(
  week = 81:104,
  actual = test,
  naive_pis = pis_running(naive_forecast, test),
  tsb_pis = round(pis_running(tsb_forecast, test), 1)
)
#>  week actual naive_pis tsb_pis
#>    81      0         0     0.3
#>    82      0         0     0.6
#>    83      0         0     0.9
#>    84      0         0     1.2
#>    85      0         0     1.5
#>    86      0         0     1.8
#>    87      0         0     2.1
#>    88      0         0     2.4
#>    89      2        -2     0.7
#>    90      3        -5    -1.9
#>    91      0        -5    -1.6
#>    92      0        -5    -1.3
#>    93      0        -5    -1.0
#>    94      3        -8    -3.7
#>    95      0        -8    -3.4
#>    96      0        -8    -3.1
#>    97      0        -8    -2.8
#>    98      0        -8    -2.5
#>    99      0        -8    -2.2
#>   100      0        -8    -1.9
#>   101      4       -12    -5.6
#>   102      0       -12    -5.3
#>   103      0       -12    -5.0
#>   104      0       -12    -4.7
```

Naive always-0 only ever falls: every real order (weeks 89, 90, 94 and 101) drags its running position lower, and a forecast of 0 never adds anything back. TSB's running position rises gently through the early zero weeks, since its forecast of 0.305 is small but still positive, then drops at each real order, ending the holdout lower but nowhere near naive's -12.

```r
# Compute each method's overall PIS score: the sum of its running position across the holdout
pis_score <- function(forecast, actual) sum(cumsum(forecast - actual))

c(naive = round(pis_score(naive_forecast, test), 1),
  ets = round(pis_score(ets_forecast, test), 1),
  croston = round(pis_score(croston_forecast, test), 1),
  adida = round(pis_score(adida_forecast, test), 1),
  tsb = round(pis_score(tsb_forecast, test), 1))
#>   naive     ets croston   adida     tsb 
#>  -126.0    61.5    45.8    66.6   -34.5
```

Naive always-0 posts -126, by far the largest shortfall of the five: a running stock position that only ever falls, because a forecast of 0 never replenishes anything while real orders keep arriving. ETS, Croston-SBA and ADIDA all land on the other side, positive totals of 61.5, 45.8 and 66.6: mild, steady overstock, since each of them forecasts more every week than this sparse holdout usually needs. TSB comes closest to 0, at -34.5, because its lower forecast of 0.305 tracks this particular holdout more closely than the higher, Croston-style rates.

So the method with the best MAE, naive always-0, has by far the worst PIS, and the method with only a middling MAE, TSB, comes closest to a stock position that neither starves the shelf nor piles up stock nobody needed. MAE and RMSE score each week in isolation, so they never notice that a string of correct zeros followed by a missed order leaves nothing in stock when a customer actually wants the part. PIS adds that running position up, so it notices exactly that.

Quick check before moving on.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Naive always-0 wins on both MAE and PIS, since forecasting less is always the safer choice on a mostly-zero series. ::no
- Naive always-0 wins on MAE because most holdout weeks really are zero, but it loses badly on PIS because its running stock position only falls and never recovers; TSB comes closest to zero on PIS. ::ok Exactly right. MAE rewards getting the common case, zero, right most weeks; PIS punishes a position that keeps falling and never gets replenished, which is exactly what naive always-0 does.
- Naive always-0 wins on MAE by chance, but ADIDA has the best PIS because it forecasts the highest rate of the five. ::no
- MAE and PIS always rank methods the same way; the table only looks different because of rounding. ::no MAE and PIS can rank methods in opposite orders, and they did here. Naive always-0 had the lowest MAE of the five but the largest shortfall by PIS, because PIS adds up a running stock position across every week instead of scoring each week on its own.

=== step === tryit
## Your turn: forecast a new parts series with tsintermittent

Try it on a different spare part from the same warehouse. Below are 60 weeks of demand for it.

```r
# Check how intermittent this second part's demand is
second_part <- c(0, 0, 0, 0, 2, 1, 0, 0, 4, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0,
                  0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0,
                  0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0)

idclass(matrix(second_part, nrow = 1))$p
idclass(matrix(second_part, nrow = 1))$cv2
#> [1] 4.307692
#> [1] 0.1623309
```

An ADI of 4.3 weeks and a CV2 of 0.16: orders come a little more often than the bearing's did (ADI 5.05), and order sizes vary less (CV2 0.16 against 0.295). Different part, same two methods.

```r
# second_part holds 60 weeks of demand for a different spare part
# Edit the line below: call crost() or tsb() on second_part, with a type= or w= argument,
# then print the forecast rate it returns
```
::check {"regex": "(crost|tsb)[(]\\s*second_part[\\s\\S]*(type|w)\\s*=", "gate": true, "difficulty": "intermediate", "ok": "Croston-SBA settles on 0.517 units a week for this part (tsb() gives 0.448 instead). Either call reads out as a flat forecast rate for a series with its own ADI and CV2, exactly the way the bearing's forecast did earlier in this lesson.", "no": "Call crost( or tsb( on second_part, with a type= argument (for crost, try type = \"sba\") or a w= argument (for tsb, try w = c(0.1, 0.1)), the same shape of call used earlier in this lesson, then print the result."}
::solution
```r
# Fit Croston-SBA on second_part and read its forecast rate
crost(second_part, w = 0.1, type = "sba", h = 12)$frc.out[1]
#> [1] 0.517
```

=== step === quiz
## Quick check: choosing among Croston, ADIDA and TSB

A warehouse manager is choosing a forecasting method for three different parts: one with a short but fairly regular order history, one with a very sparse history of only a handful of orders ever recorded, and one that might be discontinued soon, where demand could stop appearing altogether. Which method is the right choice for the part that might be discontinued?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Croston-SBA, because it is the standard baseline for intermittent demand. ::no Croston-SBA is the right baseline for a short but fairly regular order history. Its X, the smoothed interval, only updates on an order week, so it keeps repeating a nonzero forecast long after a part's orders have actually stopped, which is the wrong behaviour for a part that may be discontinued.
- ADIDA, because aggregating into blocks always gives the safest forecast. ::no ADIDA earns its keep on a very sparse or short history, where aggregating into blocks steadies an estimate that would otherwise rest on very few orders. It still forecasts a steady rate once fitted, and like Croston, it has no way to decay toward 0 on its own.
- TSB, because its order-likelihood estimate updates every week, including every zero week, so it can decay toward 0 if the part is genuinely discontinued. ::ok Exactly right. TSB is the only one of the three whose forecast can fall all the way to 0, because its p keeps moving on a zero week the same way it moves on an order week. For a part that might stop being ordered altogether, that is the behaviour you want.
- Any of the three, since they all converge to the same forecast given enough data. ::no They do not converge to the same answer. The weeks 1 to 9 hand trace earlier in this lesson showed exactly why not: Croston's X freezes on a run of zero weeks, while TSB's p kept moving through every one of them.

=== step === concept
## References

- [Forecasting and stock control for intermittent demands](https://doi.org/10.1057/jors.1972.50) - Croston, J.D. (1972), Operational Research Quarterly, 23(3). The original paper behind the Z/X method traced by hand earlier in this lesson.
- [The accuracy of intermittent demand estimates](https://doi.org/10.1016/j.ijforecast.2004.10.001) - Syntetos, A.A. and Boylan, J.E. (2005), International Journal of Forecasting, 21(2). The paper that identified Croston's upward bias and derived the SBA correction factor, 1 - w/2.
- [Intermittent demand: Linking forecasting to inventory obsolescence](https://doi.org/10.1016/j.ejor.2011.05.018) - Teunter, R.H., Syntetos, A.A. and Babai, M.Z. (2011), European Journal of Operational Research, 214(3). Introduces TSB and its every-week probability update, the method that can forecast toward 0 for a part that stops selling.
- [An aggregate-disaggregate intermittent demand approach (ADIDA) to forecasting](https://doi.org/10.1057/jors.2010.32) - Nikolopoulos, K., Syntetos, A.A., Boylan, J.E., Petropoulos, F. and Assimakopoulos, V. (2011), Journal of the Operational Research Society, 62(3). The paper behind the block-aggregation method fitted with `imapa()` above.
- [Evaluation of forecasting error measurements and techniques for intermittent demand](https://doi.org/10.1016/j.ijpe.2010.07.013) - Wallstrom, P. and Segerstedt, A. (2010), International Journal of Production Economics, 128(2). Covers why ordinary accuracy measures behave strangely on intermittent series, and proposes Periods in Stock as the measure that catches what they miss.

=== step === complete
## Putting Croston, ADIDA and TSB to work

This series started at 80.8% zero weeks, the kind of series where a single smoothed level forecasts a flat 0.625 units a week that no real week ever shows.

Croston's method split that series into two separate running averages, demand size and demand interval, and its SBA correction settled on 0.573 units a week. TSB kept smoothing the likelihood of an order through every week, zero or not, and landed lower, at 0.305, because it was the only method actually counting every zero week into its estimate. ADIDA took a third route entirely, aggregating into blocks until the zero share dropped from 80% to 25%, and settled near 0.642.

None of those three numbers is simply the best one. The real lesson was Periods in Stock: a naive forecast of always 0 wins on MAE but racks up a PIS of -126, a shortfall that never lets up, while TSB's PIS of -34.5 comes closest to a position that is neither starved nor overstocked. The right metric, not just the right method, is what this series needed.

Forecasting a flat rate well is still only half the job. The other half is knowing whether that forecast is actually worth the trouble compared to doing nothing more sophisticated than a naive guess, which is where this series goes next.

---
title: "The Expert Edge in Forecasting Like a Pro Lesson 5: Scaled errors and what the M competitions found"
catalog_blurb: "Why MASE and RMSSE compare forecasts fairly, and what the M competitions proved."
description: "See why MAPE breaks on near-zero sales, how MASE and RMSSE fix it by scaling against a naive forecast, and what the M-competitions found about simple models."
keywords: "MASE, RMSSE, MAPE forecast error, scaled error forecasting, M competitions, M4 competition, M5 competition, forecast accuracy metrics, naive forecast benchmark, WRMSSE"
post_type: "LESSON"
curriculum_id: "5.150.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "5"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Judgmental-Adjustments-and-Forecast-Governance.html"
course_prev: "Forecast-Value-Added-Are-You-Beating-the-Naive-Baseline.html"
---

=== step === cover
## Scaled errors and what the M competitions found

Today let's understand how to judge a forecast's accuracy fairly, even when the things you are forecasting sell at wildly different volumes, and what decades of forecasting competitions found about which methods actually win.

Thompson Supply runs an online catalog with 5 products: Packing Tape, Office Chair, Desk Lamp, Whiteboard Marker Set, and Laser Pointer. Here is how many units of each one it sold a week, on average, over its last 30 weeks.

::widget chart-plotter {"data":[{"x":"Packing Tape","y":252.5},{"x":"Office Chair","y":101.7},{"x":"Desk Lamp","y":40.3},{"x":"Whiteboard Marker Set","y":13.2},{"x":"Laser Pointer","y":3.1}],"geoms":["bar"],"x":"product","y":"average weekly units","code":{"bar":"ggplot(products, aes(product, average_weekly_units)) +\n  geom_col()"}}

Packing Tape sells a little over 80 times as many units a week as Laser Pointer does. Whatever measure Thompson Supply uses to judge its forecasts, that measure has to work fairly for both of them, not just for whichever one happens to sell the most.

=== step === concept
## One portfolio, one forecast, and the raw errors

Thompson Supply forecasts all 5 products the same simple way: the mean method. It looks at a product's last 30 weeks of sales, its training period, averages them into one number, and repeats that number as the forecast for every one of the next 10 weeks, its holdout period. The holdout weeks are held back from training so the forecast can be judged against sales it never got to see.

Build all 5 products, split each into training and holdout weeks, then score the mean method on Office Chair and Laser Pointer with 2 of the standard error measures.

```r
# Build Thompson Supply's 5 products and split each into training and holdout weeks
set.seed(142)
tape    <- pmax(round(rnorm(40, mean = 250, sd = 28)), 0)
chair   <- pmax(round(rnorm(40, mean = 100, sd = 12)), 0)
lamp    <- pmax(round(rnorm(40, mean = 40,  sd = 7)),  0)
markers <- rpois(40, lambda = 15)
pointer <- rpois(40, lambda = 3)

train_idx <- 1:30
hold_idx  <- 31:40

# The mean method: forecast every holdout week with the average of the 30 training weeks
mean_forecast <- function(x) mean(x[train_idx])

mae  <- function(actual, forecast) mean(abs(actual - forecast))
rmse <- function(actual, forecast) sqrt(mean((actual - forecast)^2))

chair_mae  <- mae(chair[hold_idx], mean_forecast(chair))
chair_rmse <- rmse(chair[hold_idx], mean_forecast(chair))
pointer_mae  <- mae(pointer[hold_idx], mean_forecast(pointer))
pointer_rmse <- rmse(pointer[hold_idx], mean_forecast(pointer))

round(c(chair_mae = chair_mae, chair_rmse = chair_rmse,
        pointer_mae = pointer_mae, pointer_rmse = pointer_rmse), 3)
#>   chair_mae   chair_rmse  pointer_mae pointer_rmse
#>      13.600       17.441        1.540        1.735
```

MAE, the mean absolute error, averages the absolute size of every miss in the holdout: how far off the forecast was, ignoring whether it was too high or too low. RMSE, the root mean squared error, does something close, but it squares each miss before averaging and only undoes the squaring with a square root at the end. Squaring first means one unusually large miss counts for more than several small ones.

Office Chair sells about 102 units a week on average, and its mean-method forecast misses by 13.6 units a week on MAE and 17.44 on RMSE. Laser Pointer sells only about 3 units a week, and its forecast misses by just 1.54 units on MAE and 1.735 on RMSE.

Read only the raw MAE and you would say Office Chair's forecast is the worse one, 13.6 against 1.54. But that gap is mostly about how many units each product sells, not about how good either forecast actually is. A product selling 100 units a week will almost always carry a bigger raw error than one selling 3, even when both forecasts are equally good relative to what each product normally does. Thompson Supply needs an error measure that does not just rank products by their sales volume.

=== step === concept
## Why MAPE breaks: it divides by the actual value

The usual fix for comparing errors across different scales is to turn them into a percentage. MAPE, the mean absolute percentage error, divides each week's miss by that week's own actual value before averaging, so the result reads as a percentage no matter how big the product is.

Compute Office Chair's MAPE over its 10 holdout weeks.

```r
# MAPE for Office Chair: the mean absolute percentage error over its 10 holdout weeks
chair_mape <- mean(abs(chair[hold_idx] - mean_forecast(chair)) / chair[hold_idx]) * 100
round(chair_mape, 2)
#> [1] 12.57
```

12.57% looks like a perfectly reasonable score. Now run the same formula on Laser Pointer, one holdout week at a time.

```r
# Per-week absolute percentage error for Laser Pointer's 10 holdout weeks
pointer_ape <- abs(pointer[hold_idx] - mean_forecast(pointer)) / pointer[hold_idx] * 100
round(pointer_ape, 2)
mean(pointer_ape)
#>  [1]  38.00  38.00    Inf  22.50  55.00  55.00 210.00  55.00 210.00   3.33
#> [1] Inf
```

Week 33, the 3rd holdout week, sold exactly 0 units. Dividing by an actual of 0 makes that week's percentage error infinite, and one infinite term is enough to make the whole MAPE infinite. For Thompson Supply, a low-volume product like Laser Pointer runs into weeks with 0 sales often enough that this is not a rare edge case. It is routine.

MAPE breaks a second way, even on weeks where the actual is never 0. Take holdout week 31, where Laser Pointer actually sold 5 units, and compare a forecast that is half of that against one that is double it.

```r
# A proportionally equal under-forecast and over-forecast on the same actual value
actual_wk31 <- 5
round(abs(actual_wk31 - 2.5) / actual_wk31 * 100, 0)
round(abs(actual_wk31 - 10) / actual_wk31 * 100, 0)
#> [1] 50
#> [1] 100
```

Forecasting half of 5, 2.5, gives a 50% error. Forecasting double, 10, gives a 100% error, even though both forecasts are off by the same ratio, one half as much, one twice as much. That happens because MAPE's denominator is always the actual value, which never moves with the forecast. An under-forecast can push the percentage error up to at most 100%, since a forecast cannot go below 0. An over-forecast has no such ceiling: it can run to 200%, to 1000%, or, as week 33 just showed, to infinity. MAPE punishes over-forecasting far more harshly than an equally sized under-forecast, for no reason connected to how bad either mistake actually is.

=== step === concept
## MASE: scaling the error by the naive method's own error

What Thompson Supply actually needs is a measure that divides by something that never hits 0 and never favors one direction of error over the other. MASE, the mean absolute scaled error, does this by dividing by a completely different reference: not the actual value, but the error of the simplest forecast there is, called the naive method.

The naive method forecasts every week with whatever the series did the week before. It needs no training and no formula, just last week's number carried forward one week. Measure the naive method's own error on the training weeks themselves, in-sample, meaning computed on the same data the naive method is using, and you get a baseline error that belongs to that one product alone, not to some external scale.

Compute the naive method's in-sample MAE on the 30 training weeks for Office Chair and Laser Pointer, then divide each product's holdout MAE from 2 steps back by its own naive MAE.

```r
# In-sample one-step naive error: forecast each training week with the week before it
naive_errors <- function(x_train) {
  actual   <- x_train[-1]
  forecast <- x_train[-length(x_train)]
  actual - forecast
}

chair_naive_mae   <- mean(abs(naive_errors(chair[train_idx])))
pointer_naive_mae <- mean(abs(naive_errors(pointer[train_idx])))

chair_mase   <- chair_mae / chair_naive_mae
pointer_mase <- pointer_mae / pointer_naive_mae

round(c(chair_naive_mae = chair_naive_mae, pointer_naive_mae = pointer_naive_mae,
        chair_mase = chair_mase, pointer_mase = pointer_mase), 3)
#>   chair_naive_mae pointer_naive_mae        chair_mase      pointer_mase
#>            17.310             1.897             0.786             0.812
```

MASE is the holdout MAE divided by that same product's in-sample naive MAE. Office Chair's naive method misses by 17.31 units a week on its training data, and the mean method's holdout MAE was 13.6, so Office Chair's MASE is 13.6 divided by 17.31, which is 0.786. Laser Pointer's naive method misses by 1.897 units a week in training, and its holdout MAE was 1.54, so Laser Pointer's MASE is 1.54 divided by 1.897, which is 0.812.

Read MASE against 1, not against 0. A MASE below 1 means the mean method beats the naive method, that trivial "repeat last week" guess, on that product. A MASE of exactly 1 means the mean method does no better than repeating last week. A MASE above 1 means the mean method is actually worse than that trivial guess. MASE has no upper or lower limit beyond that; it is a ratio, not a percentage.

Office Chair's MASE is 0.786 and Laser Pointer's is 0.812, nearly the same number, even though their raw MAEs, 13.6 and 1.54, looked nothing alike. Both products' mean-method forecasts beat their own naive benchmark by almost the same margin, about 21% for Office Chair and 19% for Laser Pointer. That is the fix: scaling each product's error by its own naive error puts every product on the same footing, regardless of how many units it sells.

=== step === concept
## RMSSE: the squared-error version of the same idea

RMSSE, the root mean squared scaled error, scales RMSE the same way MASE scales MAE, except it works with squared errors all the way through. Instead of dividing by the naive method's in-sample MAE, it divides the holdout's squared error by the naive method's in-sample squared error, called MSE, mean squared error, and only takes the square root at the very end.

Compute the naive method's in-sample MSE for Office Chair and Laser Pointer, then use it to find RMSSE for both.

```r
# In-sample one-step naive squared error, then RMSSE for both products
chair_naive_mse   <- mean(naive_errors(chair[train_idx])^2)
pointer_naive_mse <- mean(naive_errors(pointer[train_idx])^2)

chair_rmsse   <- sqrt(chair_rmse^2 / chair_naive_mse)
pointer_rmsse <- sqrt(pointer_rmse^2 / pointer_naive_mse)

round(c(chair_naive_mse = chair_naive_mse, pointer_naive_mse = pointer_naive_mse,
        chair_rmsse = chair_rmsse, pointer_rmsse = pointer_rmsse), 3)
#>   chair_naive_mse pointer_naive_mse       chair_rmsse     pointer_rmsse
#>           394.552             5.069             0.878             0.771
```

RMSSE is the square root of the holdout MSE divided by the in-sample naive MSE. Office Chair's naive MSE in training is 394.552, and its holdout RMSE was 17.441, so RMSSE is the square root of 17.441 squared over 394.552, which is 0.878. Laser Pointer's naive MSE is 5.069, and its holdout RMSE was 1.735, so RMSSE is the square root of 1.735 squared over 5.069, which is 0.771.

RMSSE carries the same relationship to MASE that RMSE carries to MAE. Because it squares every error before scaling, one unusually large miss moves RMSSE more than it moves MASE. Office Chair's RMSSE, 0.878, sits noticeably higher than its MASE, 0.786, which hints that at least one of its holdout weeks missed by more than the rest did. Laser Pointer's RMSSE, 0.771, sits a little below its MASE, 0.812, meaning its misses were more even across the 10 holdout weeks.

=== step === widget
## Comparing MAE, MASE, and RMSSE across all 5 products

Office Chair and Laser Pointer were only 2 of Thompson Supply's 5 products. Run the exact same computation, mean-method MAE, MASE and RMSSE against each product's own naive method, for Packing Tape, Desk Lamp and Whiteboard Marker Set too.

```r
# MAE, MASE and RMSSE for Packing Tape, Desk Lamp and Whiteboard Marker Set
tape_mae  <- mae(tape[hold_idx], mean_forecast(tape))
lamp_mae  <- mae(lamp[hold_idx], mean_forecast(lamp))
markers_mae <- mae(markers[hold_idx], mean_forecast(markers))

tape_rmse  <- rmse(tape[hold_idx], mean_forecast(tape))
lamp_rmse  <- rmse(lamp[hold_idx], mean_forecast(lamp))
markers_rmse <- rmse(markers[hold_idx], mean_forecast(markers))

tape_naive_mae  <- mean(abs(naive_errors(tape[train_idx])))
lamp_naive_mae  <- mean(abs(naive_errors(lamp[train_idx])))
markers_naive_mae <- mean(abs(naive_errors(markers[train_idx])))

tape_naive_mse  <- mean(naive_errors(tape[train_idx])^2)
lamp_naive_mse  <- mean(naive_errors(lamp[train_idx])^2)
markers_naive_mse <- mean(naive_errors(markers[train_idx])^2)

tape_mase  <- tape_mae / tape_naive_mae
lamp_mase  <- lamp_mae / lamp_naive_mae
markers_mase <- markers_mae / markers_naive_mae

tape_rmsse  <- sqrt(tape_rmse^2 / tape_naive_mse)
lamp_rmsse  <- sqrt(lamp_rmse^2 / lamp_naive_mse)
markers_rmsse <- sqrt(markers_rmse^2 / markers_naive_mse)

portfolio <- data.frame(
  product = c("Packing Tape", "Office Chair", "Desk Lamp", "Whiteboard Marker Set", "Laser Pointer"),
  avg_weekly = round(c(mean_forecast(tape), mean_forecast(chair), mean_forecast(lamp),
                        mean_forecast(markers), mean_forecast(pointer)), 1),
  MAE = round(c(tape_mae, chair_mae, lamp_mae, markers_mae, pointer_mae), 2),
  MASE = round(c(tape_mase, chair_mase, lamp_mase, markers_mase, pointer_mase), 3),
  RMSSE = round(c(tape_rmsse, chair_rmsse, lamp_rmsse, markers_rmsse, pointer_rmsse), 3)
)
portfolio
#>                 product avg_weekly   MAE  MASE RMSSE
#> 1          Packing Tape      252.5 23.00 0.676 0.609
#> 2          Office Chair      101.7 13.60 0.786 0.878
#> 3             Desk Lamp       40.3  6.16 0.992 0.824
#> 4 Whiteboard Marker Set       13.2  4.30 1.066 1.101
#> 5         Laser Pointer        3.1  1.54 0.812 0.771
```

Lay the whole portfolio out in one table.

::widget styled-table {"cols":["Product","Weekly average (training)","MAE","MASE","RMSSE"],"rows":[["Packing Tape","252.5","23.00","0.676","0.609"],["Office Chair","101.7","13.60","0.786","0.878"],["Desk Lamp","40.3","6.16","0.992","0.824"],["Whiteboard Marker Set","13.2","4.30","1.066","1.101"],["Laser Pointer","3.1","1.54","0.812","0.771"]],"title":"Five products, one portfolio","note":"MAE is in units sold a week and cannot be compared across rows. MASE and RMSSE are both ratios to the naive error of the same product, so they can."}

Look down the MAE column first. 23.00, 13.60, 6.16, 4.30, 1.54, falling in exactly the same order as the products' weekly sales volume, from Packing Tape at the top to Laser Pointer at the bottom. MAE is really just ranking products by how much they sell.

Now look down the MASE and RMSSE columns instead. Desk Lamp's MASE, 0.992, sits right in the middle, even though it sells less than a sixth of what Packing Tape does. Whiteboard Marker Set's MASE, 1.066, is the only one above 1, meaning its mean-method forecast is the only one in the portfolio that is actually worse than that product's own naive guess. You would never have spotted that from the MAE column, where it ranks fourth out of 5 simply because it does not sell much.

=== step === widget
## Why averaging MASE across a portfolio is fair and averaging MAE is not

Thompson Supply does not just want one error number per product. It wants one error number for the whole portfolio, so it can tell at a glance whether this month's forecasts, across everything it sells, are getting better or worse. The obvious move is to average the 5 products' error measure, and that is also where raw MAE falls apart.

Compute each product's share of the portfolio's total raw MAE, then do the same for MASE.

```r
# Each product's share of the portfolio's total MAE, and the same for MASE
total_mae <- sum(portfolio$MAE)
mae_share <- round(portfolio$MAE / total_mae * 100, 1)

total_mase <- sum(portfolio$MASE)
mase_share <- round(portfolio$MASE / total_mase * 100, 1)

data.frame(product = portfolio$product, mae_share, mase_share)

round(c(total_mae = total_mae, avg_mae = total_mae / 5,
        total_mase = total_mase, avg_mase = total_mase / 5,
        avg_rmsse = mean(portfolio$RMSSE)), 3)
#>                 product mae_share mase_share
#> 1          Packing Tape      47.3       15.6
#> 2          Office Chair      28.0       18.1
#> 3             Desk Lamp      12.7       22.9
#> 4 Whiteboard Marker Set       8.8       24.6
#> 5         Laser Pointer       3.2       18.7
#>  total_mae    avg_mae total_mase   avg_mase  avg_rmsse
#>     48.600      9.720      4.332      0.866      0.837
```

Packing Tape alone accounts for 47.3% of the portfolio's total MAE. Laser Pointer accounts for just 3.2%. A portfolio-average MAE of 9.72 units a week is really a number about Packing Tape; the other 4 products barely move it.

Now look at the MASE shares: 15.6%, 18.1%, 22.9%, 24.6% and 18.7%, for Packing Tape through Laser Pointer in that order. No single product dominates. That is because MASE is already a ratio, scaled by each product's own ordinary error, so a product's share of the total MASE reflects how its forecast is doing relative to itself, not how many units it happens to move. The portfolio's average MASE, 0.866, is a number you can actually trust: it says Thompson Supply's mean-method forecasts beat their own naive benchmarks by about 13% on average, across all 5 products, with no product's sales volume distorting the number. The average RMSSE works out to 0.837 the same way.

See the same 5 MASE values laid out as a chart.

::widget chart-plotter {"data":[{"x":"Packing Tape","y":0.676,"fill":"MASE"},{"x":"Office Chair","y":0.786,"fill":"MASE"},{"x":"Desk Lamp","y":0.992,"fill":"MASE"},{"x":"Whiteboard Marker Set","y":1.066,"fill":"MASE"},{"x":"Laser Pointer","y":0.812,"fill":"MASE"}],"geoms":["bar","point"],"x":"product","y":"MASE","code":{"bar":"ggplot(portfolio, aes(product, MASE)) +\n  geom_col()"}}

=== step === quiz
## Quick check: reading a MASE value and averaging fairly

Office Chair's MASE came out to 0.786 a few steps back. Whiteboard Marker Set's MASE, from the portfolio table, is 1.066. And the portfolio-average raw MAE, from the step before this one, was 9.72 units a week.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A MASE can only ever fall between 0 and 1, so Whiteboard Marker Set's 1.066 must be a mistake. ::no
- Whiteboard Marker Set's forecast is bad in absolute terms: a MASE of 1.066 means the mean method missed by more than 100%. ::no
- Whiteboard Marker Set's mean-method forecast is a little worse than that product's own naive forecast, and Office Chair's is clearly better than its own naive forecast. Neither number says anything about being good or bad in absolute terms, only about each product's own naive baseline. ::ok Exactly. MASE and RMSSE only ever compare a forecast to that same product's own naive benchmark: below 1 beats naive, above 1 is worse than naive, and there is no ceiling or floor past that. Whiteboard Marker Set's 1.066 just means its forecast lost out to its own naive guess by a small margin. It says nothing about Office Chair.
- The portfolio-average raw MAE, 9.72 units a week, is a good description of what a typical one of the 5 products' forecast error looks like. ::no MASE has no upper or lower bound, so a value above 1 is not an error and does not mean a forecast is bad in absolute terms, only that it lost to that product's own naive guess. And a raw MAE average across a portfolio is dominated by whichever product sells the most, Packing Tape here, so it is not a typical product's error either.

=== step === concept
## What the M1 and M3 competitions found: simple methods and forecast combinations win
::prose-only the finding is a historical result from two real competitions, not something to compute or plot from this lesson's data

Thompson Supply's problem, comparing forecast accuracy fairly, is not new. Forecasters have argued over it since long before MASE existed, and some of the biggest arguments got seriously tested by a series of open competitions known as the M-competitions.

The first one, called the M-Competition, or M1 for short, ran in 1982. Spyros Makridakis and a group of collaborators collected 1001 real time series and set a long list of forecasting methods, from simple exponential smoothing up through far more elaborate statistical models, competing against each other on the exact same series. The result surprised a lot of forecasters at the time: the simple methods did just as well as, and often better than, the complicated ones. Added sophistication was not buying the accuracy people expected it to.

The M3-Competition, run by Makridakis and Michele Hibon in 2000, repeated the exercise on 3003 series and confirmed it again. One single method, the Theta method, a simple way of splitting a series into a trend and a smoothed remainder, won the entire competition outright, beating every more elaborate model entered.

Both competitions turned up a second finding that mattered just as much. Take several different methods' forecasts for the same series and average them together, with nothing fancier than a plain mean, and that combination usually beat every individual method that went into it, including whichever one was individually the best. A forecast combination does not need to be clever to win. It just needs to average away each method's individual mistakes.

=== step === concept
## M4 and M5: hybrids, machine learning, and a revenue-weighted RMSSE
::prose-only the finding is a historical result from two real competitions, not something to compute or plot from this lesson's data

The M1 and M3 findings held for close to 4 decades: machine learning did not beat careful statistics, and simple methods and combinations kept winning. The M4 Competition, run in 2018 on 100,000 series, is where that story changed for the first time.

The M4 winner, built by Slawek Smyl, was a hybrid: a model that blended classical exponential smoothing with a recurrent neural network, trained across all 100,000 series at once rather than one at a time. It beat every pure statistical method entered and every pure machine-learning method entered. A hybrid, not either camp alone, took the top spot.

The M5 Competition, run on Kaggle in 2020 using several years of real Walmart retail sales, pushed further still. This time the winning methods were machine learning outright, gradient boosting models trained on thousands of related series together. M5 also changed how accuracy itself got scored: its official metric was WRMSSE, the weighted RMSSE, the same RMSSE computed earlier in this lesson, except each series' contribution to the average is weighted by that series' dollar revenue instead of being counted equally, the way a simple average treats every product the same regardless of how much money it actually brings in.

So the answer to what wins changed as the competitions changed what they tested on. Simple methods and combinations won when the series were few and short. A hybrid won once there was enough data, across enough series, for a neural network to learn something a formula could not. And machine learning won outright once the field had both huge retail datasets and a metric, WRMSSE, built to reflect what actually matters to a retailer: getting the high-revenue series right.

=== step === quiz
## Quick check: scaled errors and the M-competitions

What did the M1 and M3 competitions find, that surprised a lot of forecasters at the time?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- That the most mathematically sophisticated statistical models, fitted carefully by expert statisticians, consistently beat simple methods like exponential smoothing. ::no
- That simple methods often matched or beat more sophisticated ones, and that combining several forecasts by a plain average usually beat the single best method in that combination. ::ok Exactly right. That is the M1 and M3 finding, confirmed twice a generation apart, and it is why the Theta method, a simple decomposition approach, could win the M3-Competition outright.
- That no method beats a coin flip once a series runs long enough, so forecasting the average is always the safest choice. ::no
- That the competitions were won by deep learning models from the very first running in 1982. ::no Neither M1 (1982) nor M3 (2000) found deep learning or hybrids winning. Both found that simple methods did as well as or better than sophisticated statistical ones, and that averaging several forecasts together usually beat the best individual method in the average. Hybrids and machine learning winning came later, with M4 and M5.

=== step === tryit
## Your turn: compute RMSSE for the Laser Pointer

`pointer`, `train_idx` and `hold_idx` are still sitting in this page's session from several steps back, along with the `naive_errors()` and `rmse()` functions you used to find Office Chair's and Laser Pointer's numbers earlier. Laser Pointer's mean-method forecast for every holdout week was 3.1 units.

Write the code that computes the in-sample naive MSE from Laser Pointer's 30 training weeks, then uses it to find RMSSE.

```r
# pointer_train holds the Laser Pointer's 30 training weeks; pointer_actual its 10 holdout weeks
pointer_train  <- pointer[train_idx]
pointer_actual <- pointer[hold_idx]
pointer_fc     <- 3.1

# Compute the in-sample naive MSE from pointer_train, then use it to find RMSSE
# naive_errors() and rmse() are the same functions you used a few steps back
```
::check {"regex": "naive_errors[(]\\s*pointer_train\\s*[)][\\s\\S]*sqrt[(]", "gate": true, "difficulty": "intermediate", "ok": "Exactly. mean(naive_errors(pointer_train)^2) gives the in-sample naive MSE, 5.069, the same number from a few steps back. Dividing the holdout RMSE squared by that naive MSE and taking the square root lands RMSSE at 0.771, matching the portfolio table.", "no": "Call naive_errors(pointer_train) and square the result, then average it: that is the in-sample naive MSE. Then RMSSE is sqrt(rmse(pointer_actual, pointer_fc)^2 / that naive MSE)."}
::solution
```r
# In-sample naive MSE from the 30 training weeks, then RMSSE from the holdout RMSE
naive_mse <- mean(naive_errors(pointer_train)^2)
holdout_rmse <- rmse(pointer_actual, pointer_fc)
round(sqrt(holdout_rmse^2 / naive_mse), 3)
#> [1] 0.771
```

=== step === concept
## References

- [Another look at measures of forecast accuracy](https://doi.org/10.1016/j.ijforecast.2006.03.001) - Hyndman, R.J. and Koehler, A.B. (2006), International Journal of Forecasting. Introduces MASE.
- Makridakis, S. and collaborators (1982). The accuracy of extrapolation (time series) methods: results of a forecasting competition. Journal of Forecasting.
- [The M3-Competition: results, conclusions and implications](https://doi.org/10.1016/S0169-2070(00)00057-1) - Makridakis, S. and Hibon, M. (2000), International Journal of Forecasting.
- [The M4 Competition: 100,000 time series and 61 forecasting methods](https://doi.org/10.1016/j.ijforecast.2019.04.014) - Makridakis, S., Spiliotis, E. and Assimakopoulos, V. (2020), International Journal of Forecasting.
- Makridakis, S., Spiliotis, E. and Assimakopoulos, V. (2022). M5 accuracy competition: results, findings, and conclusions. International Journal of Forecasting.

=== step === complete
## Quick recap

By the end of this lesson, you can look at any two series of very different scale and know exactly which error measure to average, and why.

MAPE looks reasonable right up until a holdout week's actual is 0, where it breaks outright. Even away from 0, it punishes an over-forecast harder than an equally sized under-forecast, because its denominator never moves with the forecast.

MASE and RMSSE fix this by scaling the forecast's error against that same product's own naive method, the simple "repeat last week" guess, measured in-sample on the training weeks. That one change does two things at once: it removes the near-zero problem MAPE has, and it makes averaging across a portfolio fair, since no single best-selling product can dominate a ratio the way it dominates a raw MAE.

The M-competitions spent 4 decades testing which forecasting methods actually win in practice, not in theory. M1 and M3 found that simple methods and plain-average combinations beat individually sophisticated ones. M4 found a hybrid of statistics and a neural network winning once there was enough data across enough series. And M5 found machine learning winning outright, scored by WRMSSE, the same RMSSE from this lesson, weighted by each series' revenue instead of counted equally.

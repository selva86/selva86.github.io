---
title: "Forecasting Toolbox Lesson 4: Point forecasts versus the whole distribution"
catalog_blurb: "Learn which single number your stock decision actually needs from a forecast."
description: "A forecast is a whole distribution, not one number. Learn to read its mean, median and quantile forecasts, and pick the one your decision actually needs."
keywords: "point forecast in r, mean vs median forecast, quantile forecast in r, fable MEAN model, forecast distribution point estimate, choosing a point forecast, right skewed forecast distribution, quantile point forecast for stock decisions"
post_type: "LESSON"
curriculum_id: "5.30.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "4"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: "Time-Series-Cross-Validation-Rolling-Origin.html"
course_prev: "Forecast-Distributions-and-Prediction-Intervals.html"
---

=== step === cover
## Point forecasts versus the whole distribution

Today let's look at why a single forecasted number can hide a lot, using sixty days of real cake orders from a small bakery.

Maple & Rye is a bakery that takes orders for custom celebration cakes. Over the last 60 days it logged how many were ordered each day, mostly between 0 and 8 cakes, but with five catering-spike days jumping to between 15 and 22 at once. Across all 60 days the mean comes to 4.65 cakes a day, well above the median of 3.

::widget chart-plotter {"data":[{"x":1,"y":5},{"x":2,"y":20},{"x":3,"y":2},{"x":4,"y":5},{"x":5,"y":3},{"x":6,"y":3},{"x":7,"y":4},{"x":8,"y":1},{"x":9,"y":4},{"x":10,"y":4},{"x":11,"y":3},{"x":12,"y":4},{"x":13,"y":6},{"x":14,"y":2},{"x":15,"y":3},{"x":16,"y":6},{"x":17,"y":7},{"x":18,"y":1},{"x":19,"y":3},{"x":20,"y":3},{"x":21,"y":5},{"x":22,"y":1},{"x":23,"y":8},{"x":24,"y":6},{"x":25,"y":1},{"x":26,"y":3},{"x":27,"y":2},{"x":28,"y":5},{"x":29,"y":3},{"x":30,"y":5},{"x":31,"y":4},{"x":32,"y":4},{"x":33,"y":2},{"x":34,"y":22},{"x":35,"y":17},{"x":36,"y":5},{"x":37,"y":0},{"x":38,"y":2},{"x":39,"y":5},{"x":40,"y":3},{"x":41,"y":2},{"x":42,"y":3},{"x":43,"y":0},{"x":44,"y":7},{"x":45,"y":15},{"x":46,"y":18},{"x":47,"y":5},{"x":48,"y":3},{"x":49,"y":7},{"x":50,"y":3},{"x":51,"y":2},{"x":52,"y":2},{"x":53,"y":2},{"x":54,"y":4},{"x":55,"y":0},{"x":56,"y":4},{"x":57,"y":4},{"x":58,"y":1},{"x":59,"y":2},{"x":60,"y":3}],"geoms":["line","point"],"x":"Day","y":"Orders"}

Look at how those five catering-spike days tower over the rest of the history above. Any forecast for tomorrow has to somehow account for days like that, not just the quiet, ordinary ones.

=== step === concept
## What forecast() gives you by default: the mean

fable's simplest forecasting model is MEAN(): it takes the average of the whole history and repeats that same number as its forecast for every future day. Fit it on Maple & Rye's 60 days of orders, then forecast 14 days ahead.

```r
# Build the 60-day cake orders series, fit a MEAN model, and forecast 14 days ahead with a bootstrapped distribution
library(tsibble)
library(fable)
library(fabletools)

set.seed(42)
base_orders <- rpois(60, 3)
spike_orders <- rbinom(60, 1, 0.12) * rpois(60, 14)
orders <- base_orders + spike_orders

cakes <- tsibble(Day = 1:60, Orders = orders, index = Day)
fit <- cakes |> model(Mean = MEAN(Orders))

set.seed(123)
fc <- fit |> forecast(h = 14, bootstrap = TRUE, times = 2000)
fc
#> # A fable: 14 x 4 [1]
#> # Key:     .model [1]
#>    .model   Day       Orders .mean
#>    <chr>  <dbl>       <dist> <dbl>
#>  1 Mean      61 sample[2000]  4.62
#>  2 Mean      62 sample[2000]  4.53
#>  3 Mean      63 sample[2000]  4.71
#>  4 Mean      64 sample[2000]  4.69
#>  5 Mean      65 sample[2000]  4.67
#>  6 Mean      66 sample[2000]  4.85
#>  7 Mean      67 sample[2000]  4.67
#>  8 Mean      68 sample[2000]  4.47
#>  9 Mean      69 sample[2000]  4.77
#> 10 Mean      70 sample[2000]  4.78
#> 11 Mean      71 sample[2000]  4.52
#> 12 Mean      72 sample[2000]  4.59
#> 13 Mean      73 sample[2000]  4.65
#> 14 Mean      74 sample[2000]  4.54
```

`bootstrap = TRUE` and `times = 2000` tell forecast() to build each day's distribution by resampling the model's own residuals 2000 times, instead of assuming the distribution follows a bell curve. The Orders column holds each day's whole distribution, printed as sample[2000] since it is really 2000 simulated values, not one number. The .mean column pulls out just one summary of that distribution: its arithmetic mean.

Read the very first row. Day 61 is tomorrow, and .mean there is 4.62. That is forecast()'s own point forecast: the single number it hands you if you only look at .mean.

```r
# Round tomorrow's mean point forecast up to a whole cake, since a fraction of a cake cannot be baked
ceiling(fc$.mean[1])
#> [1] 5
```

Maple & Rye cannot bake 4.62 of a cake, so the bakery would round this up to 5 whole cakes.

=== step === concept
## The median: the same distribution's other point forecast

.mean is not the only number you can pull out of fc's Orders column. Read the median of that same distribution, tomorrow's forecast, next to its mean, and compare both against the mean and median of the 60 days of history behind them.

```r
# Compare tomorrow's forecast median against its mean, and the historical mean against the historical median
round(mean(fc$Orders[[1]]), 2)
median(fc$Orders[[1]])
mean(orders)
median(orders)
#> [1] 4.62
#> [1] 3
#> [1] 4.65
#> [1] 3
```

fc$Orders[[1]] pulls out tomorrow's whole forecast distribution, Day 61's. Its mean, 4.62, matches fc's own .mean column for Day 61. But its median is 3, a full 1.62 cakes lower.

The same gap sits in the 60 days of history the model was fit on: a mean of 4.65 against a median of 3. Averaging weighs every single day equally, so the five catering-spike days, 15 to 22 cakes each, pull the mean up a good deal. Sorting all 60 counts for the median puts an ordinary small day squarely in the middle of that list regardless, since there are only five spike days out of sixty, so the median barely moves. A mean sitting above the median like this is the signature of a right-skewed distribution: one with a long tail stretching out toward large values on one side, here the catering-spike days, while most of the distribution sits bunched down near zero.

=== step === quiz
## Quick check: why the mean sits above the median here

fc$Orders[[1]]'s mean came to 4.62 and its median to 3, and the same gap showed up in the 60-day history: mean 4.65, median 3.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- fable computes the median wrong for count data, so the two numbers do not have to agree. ::no
- The five catering-spike days, 15 to 22 cakes each, pull the mean up without moving the middle of the sorted list nearly as much. That is the signature of a right-skewed distribution. ::ok Right. Averaging weighs every day equally, so five big spike days pull the mean up a lot. Sorting the 60 counts for the median puts an ordinary small day in the middle regardless, so the spikes barely move it. That gap, mean above median, is exactly what a right-skewed distribution looks like.
- The mean is always above the median for any forecast distribution. ::no Neither of these holds up. fable's mean() and median() both read the same forecast distribution correctly, they are just different summaries of it, and a mean above the median is not a rule for every forecast. It is a sign of the skew this particular history has: five spike days pulling the average up without moving the sorted middle.

=== step === concept
## Quantiles: naming any point on the distribution

The median is really just a special case of something more general: a quantile. The median is the 50th percentile, the point below which half the distribution falls. Ask for any other percentage the same way, using quantile().

```r
# Read the 10th, 50th and 90th percentile point forecasts for tomorrow's distribution
unlist(quantile(fc$Orders[[1]], c(0.1, 0.5, 0.9)))
#> [1] 1 3 8
```

10 percent of tomorrow's plausible outcomes need 1 cake or fewer. 50 percent, the median, need 3 or fewer, matching the median computed a moment ago. 90 percent need 8 or fewer, which also means only 10 percent of plausible tomorrows need more than 8 cakes. Mean, median and any quantile you like are all just different single numbers pulled out of the very same forecast distribution.

=== step === concept
## Choosing the point forecast a decision actually needs

Mean, median and quantile are three different point forecasts from the same distribution, so which one should Maple & Rye actually plan around? That depends on what the number is used for, and specifically, on which mistake costs more.

Check how often each of those numbers would have actually covered demand, using the 60 days of real history.

```r
# Count how many of the 60 historical days topped 5 orders, the rounded mean, and how many topped 8, the 90th percentile
sum(orders > 5)
round(100 * sum(orders > 5) / 60, 1)
sum(orders > 8)
round(100 * sum(orders > 8) / 60, 1)
#> [1] 12
#> [1] 20
#> [1] 5
#> [1] 8.3
```

Prepping for 5 cakes, the rounded mean, would have left Maple & Rye short on 12 of the 60 days, 20 percent of the time. Prepping for 8, the 90th percentile, would have left it short on only 5 of those days, 8.3 percent of the time. But prepping to the higher number also means having the ingredients ready for more cakes than needed on every one of the quieter days. Whichever number Maple & Rye picks, it is trading a lower shortfall rate for more leftover stock on quiet days, or the other way round.

=== step === concept
## The cost of collapsing a distribution to one number

Push that trade-off one step further and see just how much a single point forecast leaves out.

```r
# Check how many of the 60 days needed 3 or fewer cakes, the demand a low point forecast would cover
sum(orders <= 3)
round(100 * mean(orders <= 3), 1)
#> [1] 31
#> [1] 51.7
```

31 of the 60 days, 51.7 percent, needed 3 cakes or fewer. Prepping to 8 wastes capacity on every single one of those days. But prepping to 5 still runs short 1 day in 5, the same 20 percent figure computed just above. There is no single point forecast that is both never short and never wasteful, because the real demand is not one number, it is this whole spread from 0 to 22.

=== step === widget
## Why the forecast band doesn't widen this time

Read the same bootstrapped distribution, but now look across all 14 forecasted days instead of just tomorrow. Pull the 10th, median and 90th percentile out of each day's distribution and plot the three as separate lines.

::widget chart-plotter {"data":[{"x":61,"y":1,"fill":"10th percentile"},{"x":62,"y":1,"fill":"10th percentile"},{"x":63,"y":1,"fill":"10th percentile"},{"x":64,"y":1,"fill":"10th percentile"},{"x":65,"y":1,"fill":"10th percentile"},{"x":66,"y":1,"fill":"10th percentile"},{"x":67,"y":1,"fill":"10th percentile"},{"x":68,"y":1,"fill":"10th percentile"},{"x":69,"y":1,"fill":"10th percentile"},{"x":70,"y":1,"fill":"10th percentile"},{"x":71,"y":1,"fill":"10th percentile"},{"x":72,"y":1,"fill":"10th percentile"},{"x":73,"y":1,"fill":"10th percentile"},{"x":74,"y":1,"fill":"10th percentile"},{"x":61,"y":3,"fill":"median"},{"x":62,"y":3,"fill":"median"},{"x":63,"y":3,"fill":"median"},{"x":64,"y":3,"fill":"median"},{"x":65,"y":3,"fill":"median"},{"x":66,"y":3,"fill":"median"},{"x":67,"y":3,"fill":"median"},{"x":68,"y":3,"fill":"median"},{"x":69,"y":4,"fill":"median"},{"x":70,"y":3,"fill":"median"},{"x":71,"y":3,"fill":"median"},{"x":72,"y":3,"fill":"median"},{"x":73,"y":3,"fill":"median"},{"x":74,"y":3,"fill":"median"},{"x":61,"y":8,"fill":"90th percentile"},{"x":62,"y":7,"fill":"90th percentile"},{"x":63,"y":8,"fill":"90th percentile"},{"x":64,"y":8,"fill":"90th percentile"},{"x":65,"y":7,"fill":"90th percentile"},{"x":66,"y":8,"fill":"90th percentile"},{"x":67,"y":8,"fill":"90th percentile"},{"x":68,"y":7,"fill":"90th percentile"},{"x":69,"y":8,"fill":"90th percentile"},{"x":70,"y":8,"fill":"90th percentile"},{"x":71,"y":7,"fill":"90th percentile"},{"x":72,"y":7,"fill":"90th percentile"},{"x":73,"y":8,"fill":"90th percentile"},{"x":74,"y":7,"fill":"90th percentile"}],"geoms":["line","point"],"x":"Day","y":"Orders","code":{"line":"ggplot(cakes_fc, aes(Day, Orders, colour = group)) +\n  geom_line() +\n  geom_point()"}}

Toggle between the line and point view. The 10th percentile sits flat at 1 cake on every single one of the 14 days. The median sits at 3 on almost all of them, ticking up to 4 on just one day. The 90th percentile bounces between 7 and 8 with no real drift either way, and none of the three lines climbs or fans out as the horizon stretches from Day 61 to Day 74.

That flatness is not a coincidence. The MEAN model treats every future day as an independent draw from the same 60 days of history, so nothing about forecasting 14 days out makes Maple & Rye any less certain about Day 74 than about Day 61. A model built this way will never produce a forecast band that widens with the horizon, no matter how far out you push it.

=== step === widget
## Reading a fan chart: when the lines really do fan apart

Every forecast band shown so far, on the cover chart and in the widget above, comes from Maple & Rye's own MEAN model, and it barely moves across the 14-day horizon. But not every forecast behaves like that. Read a case where the 10th, median and 90th percentile lines genuinely fan apart, wider the further out they run.

The widget below is not Maple & Rye's cake orders. It plots income against years of experience, a plain example built into the widget itself, since that is where fanning percentile lines show up clearly.

::widget quantile-lines {}

Toggle between the 10th, median and 90th percentile lines. Notice how the gap between them grows as years of experience climbs: junior earners cluster tightly together, but senior earners spread out from modest to very high income. A forecasting model that builds tomorrow's number on top of today's, instead of drawing each future day independently from history the way Maple & Rye's MEAN model does, would fan its own 10th, median and 90th percentile lines apart the very same way: tight close to the present, and wider the further out it looks.

=== step === quiz
## Quick check: matching the point forecast to the decision

A wholesale flour supplier ships Maple & Rye enough flour each morning to cover that day's forecast. If the forecast comes in too low, the bakery has to cancel a catering order on the spot, an expensive mistake. If it comes in too high, the extra flour just gets used in tomorrow's batch, a cheap one.

Which point forecast should size that flour order?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The mean, 4.62 cakes, since that is forecast()'s own default point forecast. ::no
- The median, 3 cakes, since it best represents a typical day's orders. ::no
- A high quantile, such as the 90th percentile, 8 cakes, since running short costs far more than a little leftover flour. ::ok Right. The two mistakes here do not cost the same. Running short cancels a catering order, the expensive mistake, while extra flour just gets used tomorrow, the cheap one. Since running short is the mistake to avoid, the flour order should cover a high quantile of tomorrow's distribution, not the mean or the median.
- The lowest quantile, such as the 10th percentile, 1 cake, since it keeps flour costs to a minimum. ::no None of the low or middle numbers fit a decision this lopsided. The mean still runs short on 20 percent of days and the median on roughly half of them, and the mistake that actually hurts here is running short, not holding a little extra flour. That is exactly why the flour order should be sized off a high quantile, not the middle of the distribution.

=== step === tryit
## Your turn: pick the point forecast a new decision needs

fc, the bootstrapped forecast built earlier on this page, still holds every day's distribution. A different wholesale partner will only accept a 1-in-20 shortfall, 5 percent, instead of the 1-in-10, 10 percent, behind the 90th percentile used earlier.

A 1-in-20 shortfall means only 5 percent of plausible tomorrows should exceed the number you order for, which is the 95th percentile of tomorrow's forecast distribution, fc$Orders[[1]].

```r
# fc still holds the bootstrapped forecast built earlier on this page
# Compute the 95th percentile of tomorrow's forecast distribution:
# quantile(fc$Orders[[1]], 0.95)
# One line. Press Check when you have it.
```
::check {"regex": "quantile[(]fc\\$Orders[[][[]1]]\\s*,\\s*0\\.95\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. quantile(fc$Orders[[1]], 0.95) is 17, so under this tighter 1-in-20 tolerance the flour order needs to cover 17 cakes' worth of batter, not just the 8 the 90th percentile called for earlier.", "no": "Use the same quantile() call from earlier on this page, just with 0.95 in place of 0.9: quantile(fc$Orders[[1]], 0.95)."}
::solution
```r
# Compute the 95th percentile of tomorrow's forecast distribution for a 1-in-20 shortfall tolerance
quantile(fc$Orders[[1]], 0.95)
#> [1] 17
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.5, Distributional forecasts and prediction intervals](https://otexts.com/fpp3/prediction-intervals.html) - Hyndman and Athanasopoulos (3rd ed.), the source for reading a forecast as a full distribution rather than one number.
- [Forecasting: Principles and Practice, chapter 5, The forecaster's toolbox](https://otexts.com/fpp3/the-forecasters-toolbox.html) - Hyndman and Athanasopoulos (3rd ed.), the chapter overview covering MEAN() and the other benchmark models used in this course.
- [fable package reference documentation for MEAN()](https://fable.tidyverts.org/reference/MEAN.html)
- [distributional package documentation (CRAN)](https://cran.r-project.org/package=distributional) - the mean(), median() and quantile() generics used throughout this lesson on a forecast distribution object.
- Gneiting, T. (2011), "Making and Evaluating Point Forecasts", Journal of the American Statistical Association, 106(494) - the theory connecting a point forecast to the decision's own loss function.

=== step === complete
## Quick recap

You now have the whole chain from a forecast distribution down to the one number a decision actually needs.

forecast() hands you a full distribution at every horizon, not one number, and .mean is only its default summary. The median, 3 cakes for tomorrow, and any other quantile you name, like 8 for the 90th percentile or 17 for the 95th, are all different single numbers pulled from that same distribution, and they differ here because the five catering-spike days give it a long right tail. Which one to use depends on the decision behind it: a lopsided cost, like cancelling a catering order against a little leftover flour, calls for a high quantile, not the mean or median that fable happens to print by default. No single point forecast is ever both never short and never wasteful, and Maple & Rye's own 14-day band stayed flat throughout because its MEAN model draws every future day independently from the same 60-day history. A model that builds each day on the last, the way the fan chart widget showed, would have its percentile lines spread wider the further out it looked.

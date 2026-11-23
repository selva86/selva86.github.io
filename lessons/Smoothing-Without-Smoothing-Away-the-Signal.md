---
title: "Additive and Nonparametric Models Lesson 1: Smoothing without smoothing away the signal"
catalog_blurb: "See four smoothing methods trade bias for variance on one noisy climb."
description: "Fit four smoothers to one noisy climb, sweep each one's tuning parameter from too stiff to too wiggly, and pick the setting with the lowest held-out error."
keywords: "smoothing, moving average, loess, regression spline, smoothing spline, bias-variance tradeoff, held-out error, bandwidth, overfitting, underfitting, R"
post_type: "LESSON"
curriculum_id: "4.100.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-additive"
course_title: "Additive and Nonparametric Models"
course_lesson: "1"
course_total: "6"
course_landing: "Additive-and-Nonparametric-Models-Course.html"
course_next: ""
course_prev: ""
---

=== step === cover
## Smoothing without smoothing away the signal

Today let's understand how a smoother decides how much of a noisy reading to trust and how much of it to treat as noise.

The running example is one web server's response time, checked once a minute for the 180 minutes right after it launched. In that stretch, response time starts out jumpy, swinging all over the place with no clear trend, then climbs, ending up past 250 milliseconds by the end of the 180 minutes.

Here are all 180 readings, first as plain points, then joined into a line.

::widget chart-plotter {"data":[{"x":1,"y":101},{"x":2,"y":72},{"x":3,"y":86},{"x":4,"y":90},{"x":5,"y":86.6},{"x":6,"y":79},{"x":7,"y":103.3},{"x":8,"y":79.2},{"x":9,"y":111},{"x":10,"y":79.8},{"x":11,"y":100.3},{"x":12,"y":115.1},{"x":13,"y":60},{"x":14,"y":76.7},{"x":15,"y":78.9},{"x":16,"y":90.5},{"x":17,"y":76.8},{"x":18,"y":41.2},{"x":19,"y":44.5},{"x":20,"y":101},{"x":21,"y":76.7},{"x":22,"y":54.6},{"x":23,"y":78.8},{"x":24,"y":99.7},{"x":25,"y":110},{"x":26,"y":75.2},{"x":27,"y":77.8},{"x":28,"y":55.3},{"x":29,"y":88.8},{"x":30,"y":72.4},{"x":31,"y":88.9},{"x":32,"y":92.8},{"x":33,"y":97.8},{"x":34,"y":73.3},{"x":35,"y":90.1},{"x":36,"y":56.9},{"x":37,"y":71},{"x":38,"y":70.2},{"x":39,"y":46.9},{"x":40,"y":83.8},{"x":41,"y":86.5},{"x":42,"y":78.2},{"x":43,"y":95.1},{"x":44,"y":73},{"x":45,"y":63.6},{"x":46,"y":90.8},{"x":47,"y":72.4},{"x":48,"y":106.4},{"x":49,"y":78.6},{"x":50,"y":95.1},{"x":51,"y":90.4},{"x":52,"y":74.1},{"x":53,"y":109.7},{"x":54,"y":96},{"x":55,"y":88.1},{"x":56,"y":91.2},{"x":57,"y":97.6},{"x":58,"y":89.1},{"x":59,"y":43.2},{"x":60,"y":92.8},{"x":61,"y":83.4},{"x":62,"y":92.2},{"x":63,"y":98.6},{"x":64,"y":111.3},{"x":65,"y":79.9},{"x":66,"y":110.9},{"x":67,"y":96.9},{"x":68,"y":108},{"x":69,"y":106.8},{"x":70,"y":104.5},{"x":71,"y":78.7},{"x":72,"y":93.6},{"x":73,"y":105},{"x":74,"y":82.1},{"x":75,"y":89},{"x":76,"y":106.7},{"x":77,"y":110.3},{"x":78,"y":106.6},{"x":79,"y":87.2},{"x":80,"y":85},{"x":81,"y":125.1},{"x":82,"y":107.3},{"x":83,"y":105.8},{"x":84,"y":103.7},{"x":85,"y":88.7},{"x":86,"y":117},{"x":87,"y":105.7},{"x":88,"y":107.5},{"x":89,"y":125.5},{"x":90,"y":125.2},{"x":91,"y":135.1},{"x":92,"y":108.5},{"x":93,"y":126.8},{"x":94,"y":139.4},{"x":95,"y":103.4},{"x":96,"y":108.8},{"x":97,"y":106.3},{"x":98,"y":103.1},{"x":99,"y":127.9},{"x":100,"y":138.2},{"x":101,"y":148.2},{"x":102,"y":147.7},{"x":103,"y":118.8},{"x":104,"y":163.5},{"x":105,"y":127.7},{"x":106,"y":141.3},{"x":107,"y":135.4},{"x":108,"y":141.9},{"x":109,"y":148.7},{"x":110,"y":149.7},{"x":111,"y":149.7},{"x":112,"y":153.9},{"x":113,"y":147.1},{"x":114,"y":149},{"x":115,"y":133.9},{"x":116,"y":155.3},{"x":117,"y":155.6},{"x":118,"y":206},{"x":119,"y":147.3},{"x":120,"y":172.1},{"x":121,"y":149.8},{"x":122,"y":152.4},{"x":123,"y":178.6},{"x":124,"y":164},{"x":125,"y":181.2},{"x":126,"y":177},{"x":127,"y":176.4},{"x":128,"y":157.4},{"x":129,"y":171.5},{"x":130,"y":194.7},{"x":131,"y":202.7},{"x":132,"y":188.8},{"x":133,"y":198.3},{"x":134,"y":217.1},{"x":135,"y":223.9},{"x":136,"y":187.7},{"x":137,"y":204.3},{"x":138,"y":226},{"x":139,"y":202.8},{"x":140,"y":210.8},{"x":141,"y":212},{"x":142,"y":201.7},{"x":143,"y":210},{"x":144,"y":217.9},{"x":145,"y":213.7},{"x":146,"y":238.2},{"x":147,"y":215.7},{"x":148,"y":217.9},{"x":149,"y":236.3},{"x":150,"y":211.3},{"x":151,"y":227.9},{"x":152,"y":206.5},{"x":153,"y":248.5},{"x":154,"y":228.1},{"x":155,"y":226.3},{"x":156,"y":215.9},{"x":157,"y":235.4},{"x":158,"y":224.6},{"x":159,"y":229.6},{"x":160,"y":257.9},{"x":161,"y":236.8},{"x":162,"y":224.3},{"x":163,"y":243.7},{"x":164,"y":236.6},{"x":165,"y":251.7},{"x":166,"y":265.1},{"x":167,"y":229.4},{"x":168,"y":251.8},{"x":169,"y":247},{"x":170,"y":259.8},{"x":171,"y":243.5},{"x":172,"y":260.1},{"x":173,"y":221.9},{"x":174,"y":274},{"x":175,"y":262.2},{"x":176,"y":247.4},{"x":177,"y":228.4},{"x":178,"y":260.3},{"x":179,"y":258.3},{"x":180,"y":251.4}],"geoms":["point","line"],"x":"minute","y":"response_time_ms"}

Joining the dots does not make the line smooth. It just drags a jagged path from one noisy point to the next, and that jaggedness is exactly what a real smoother has to see past.

=== step === concept
## What a smoother is trying to recover

A smoother's job is to recover the signal, the true quantity moving underneath the data, while setting aside the noise, the random wobble added to every single reading. Normally you never get to see the signal on its own. It arrives mixed with the noise, and no amount of staring at one reading tells you how much of it is real.

Here, unusually, you get to see both. The response time data is simulated, so the true climb that produced it is known exactly, and it can be drawn on the same plot as a check. Run the code below to see the 180 noisy readings next to that true climb.

```r
# Build the 180 noisy readings together with the true climb that produced them
library(ggplot2)
set.seed(42)
minute <- 1:180
true_curve <- 80 + 180 * plogis((minute - 120) / 20)
response_time_ms <- true_curve + rnorm(180, 0, 15)
server <- data.frame(minute, response_time_ms, true_curve)

ggplot(server, aes(minute, response_time_ms)) +
  geom_point(alpha = 0.4) +
  geom_line(aes(y = true_curve), color = "firebrick", linetype = "dashed", linewidth = 1)
```

The dashed line is the signal: a smooth, steady climb from about 80 milliseconds at minute 1 to about 250 milliseconds by minute 180, with no jitter in it at all. Every solid point sits off that line by some amount, high or low, and that gap is the noise, about 15 milliseconds of it added to a typical reading.

A smoother only ever sees the solid points. Its whole task is to guess the dashed line underneath them using nothing but those noisy dots, which is exactly what the next four methods try to do.

=== step === widget
## Four smoothers, one plot

Four different methods try to do that guessing, and it helps to see all four on the same 180 points before learning how each one works. A moving average replaces each point with the average of its nearby neighbours. A loess fit runs a small weighted regression around each point. A regression spline bends a smooth curve made of polynomial pieces to match the data. A smoothing spline does the same bending, but penalises any extra wiggle it adds.

Switch between the four tabs below to see each one fitted to the server's 180 readings at a reasonable starting setting.

::widget chart-plotter {"data":[{"x":1,"y":101},{"x":2,"y":72},{"x":3,"y":86},{"x":4,"y":90},{"x":5,"y":86.6},{"x":6,"y":79},{"x":7,"y":103.3},{"x":8,"y":79.2},{"x":9,"y":111},{"x":10,"y":79.8},{"x":11,"y":100.3},{"x":12,"y":115.1},{"x":13,"y":60},{"x":14,"y":76.7},{"x":15,"y":78.9},{"x":16,"y":90.5},{"x":17,"y":76.8},{"x":18,"y":41.2},{"x":19,"y":44.5},{"x":20,"y":101},{"x":21,"y":76.7},{"x":22,"y":54.6},{"x":23,"y":78.8},{"x":24,"y":99.7},{"x":25,"y":110},{"x":26,"y":75.2},{"x":27,"y":77.8},{"x":28,"y":55.3},{"x":29,"y":88.8},{"x":30,"y":72.4},{"x":31,"y":88.9},{"x":32,"y":92.8},{"x":33,"y":97.8},{"x":34,"y":73.3},{"x":35,"y":90.1},{"x":36,"y":56.9},{"x":37,"y":71},{"x":38,"y":70.2},{"x":39,"y":46.9},{"x":40,"y":83.8},{"x":41,"y":86.5},{"x":42,"y":78.2},{"x":43,"y":95.1},{"x":44,"y":73},{"x":45,"y":63.6},{"x":46,"y":90.8},{"x":47,"y":72.4},{"x":48,"y":106.4},{"x":49,"y":78.6},{"x":50,"y":95.1},{"x":51,"y":90.4},{"x":52,"y":74.1},{"x":53,"y":109.7},{"x":54,"y":96},{"x":55,"y":88.1},{"x":56,"y":91.2},{"x":57,"y":97.6},{"x":58,"y":89.1},{"x":59,"y":43.2},{"x":60,"y":92.8},{"x":61,"y":83.4},{"x":62,"y":92.2},{"x":63,"y":98.6},{"x":64,"y":111.3},{"x":65,"y":79.9},{"x":66,"y":110.9},{"x":67,"y":96.9},{"x":68,"y":108},{"x":69,"y":106.8},{"x":70,"y":104.5},{"x":71,"y":78.7},{"x":72,"y":93.6},{"x":73,"y":105},{"x":74,"y":82.1},{"x":75,"y":89},{"x":76,"y":106.7},{"x":77,"y":110.3},{"x":78,"y":106.6},{"x":79,"y":87.2},{"x":80,"y":85},{"x":81,"y":125.1},{"x":82,"y":107.3},{"x":83,"y":105.8},{"x":84,"y":103.7},{"x":85,"y":88.7},{"x":86,"y":117},{"x":87,"y":105.7},{"x":88,"y":107.5},{"x":89,"y":125.5},{"x":90,"y":125.2},{"x":91,"y":135.1},{"x":92,"y":108.5},{"x":93,"y":126.8},{"x":94,"y":139.4},{"x":95,"y":103.4},{"x":96,"y":108.8},{"x":97,"y":106.3},{"x":98,"y":103.1},{"x":99,"y":127.9},{"x":100,"y":138.2},{"x":101,"y":148.2},{"x":102,"y":147.7},{"x":103,"y":118.8},{"x":104,"y":163.5},{"x":105,"y":127.7},{"x":106,"y":141.3},{"x":107,"y":135.4},{"x":108,"y":141.9},{"x":109,"y":148.7},{"x":110,"y":149.7},{"x":111,"y":149.7},{"x":112,"y":153.9},{"x":113,"y":147.1},{"x":114,"y":149},{"x":115,"y":133.9},{"x":116,"y":155.3},{"x":117,"y":155.6},{"x":118,"y":206},{"x":119,"y":147.3},{"x":120,"y":172.1},{"x":121,"y":149.8},{"x":122,"y":152.4},{"x":123,"y":178.6},{"x":124,"y":164},{"x":125,"y":181.2},{"x":126,"y":177},{"x":127,"y":176.4},{"x":128,"y":157.4},{"x":129,"y":171.5},{"x":130,"y":194.7},{"x":131,"y":202.7},{"x":132,"y":188.8},{"x":133,"y":198.3},{"x":134,"y":217.1},{"x":135,"y":223.9},{"x":136,"y":187.7},{"x":137,"y":204.3},{"x":138,"y":226},{"x":139,"y":202.8},{"x":140,"y":210.8},{"x":141,"y":212},{"x":142,"y":201.7},{"x":143,"y":210},{"x":144,"y":217.9},{"x":145,"y":213.7},{"x":146,"y":238.2},{"x":147,"y":215.7},{"x":148,"y":217.9},{"x":149,"y":236.3},{"x":150,"y":211.3},{"x":151,"y":227.9},{"x":152,"y":206.5},{"x":153,"y":248.5},{"x":154,"y":228.1},{"x":155,"y":226.3},{"x":156,"y":215.9},{"x":157,"y":235.4},{"x":158,"y":224.6},{"x":159,"y":229.6},{"x":160,"y":257.9},{"x":161,"y":236.8},{"x":162,"y":224.3},{"x":163,"y":243.7},{"x":164,"y":236.6},{"x":165,"y":251.7},{"x":166,"y":265.1},{"x":167,"y":229.4},{"x":168,"y":251.8},{"x":169,"y":247},{"x":170,"y":259.8},{"x":171,"y":243.5},{"x":172,"y":260.1},{"x":173,"y":221.9},{"x":174,"y":274},{"x":175,"y":262.2},{"x":176,"y":247.4},{"x":177,"y":228.4},{"x":178,"y":260.3},{"x":179,"y":258.3},{"x":180,"y":251.4}],"geoms":["moving average","loess","regression spline","smoothing spline"],"x":"minute","y":"response_time_ms","code":{"moving average":"ggplot(df, aes(minute, response_time_ms)) +\n  geom_point(alpha = 0.4) +\n  geom_line(aes(y = as.numeric(stats::filter(response_time_ms, rep(1 / 9, 9)))), color = \"#2b6cb0\", linewidth = 1, na.rm = TRUE)","loess":"ggplot(df, aes(minute, response_time_ms)) +\n  geom_point(alpha = 0.4) +\n  geom_smooth(method = \"loess\", span = 0.3, se = FALSE, color = \"#c05621\")","regression spline":"ggplot(df, aes(minute, response_time_ms)) +\n  geom_point(alpha = 0.4) +\n  geom_smooth(method = \"lm\", formula = y ~ splines::bs(x, df = 6), se = FALSE, color = \"#2f855a\")","smoothing spline":"ggplot(df, aes(minute, response_time_ms)) +\n  geom_point(alpha = 0.4) +\n  geom_line(aes(y = predict(smooth.spline(minute, response_time_ms), minute)$y), color = \"#805ad5\", linewidth = 1)"}}

At these settings, a moving average over a 9-minute window, a loess fit with span 0.3, a regression spline with 6 degrees of freedom and a smoothing spline at its own default, all four curves track the climb closely and end up looking almost the same. That similarity is the point of this step. Underneath four different names and four different formulas, every one of them is doing the same job: trading off how much of each noisy point to keep against how much of it to throw away.

=== step === concept
## One tuning parameter, four different names

Every one of those four smoothers has exactly one dial that controls how it behaves: the moving average's window width, the loess fit's span, the regression spline's degrees of freedom, and the smoothing spline's own smoothing parameter. All four dials do the same thing. They set how far around a point the smoother is allowed to look before deciding what that point's fitted value should be.

Here is that one idea on the moving average alone, fitted twice: once with a narrow 3-minute window, and once with a wide 41-minute window.

```r
# Compare a narrow and a wide moving average against the true climb underneath them
library(ggplot2)
window3  <- as.numeric(stats::filter(response_time_ms, rep(1 / 3, 3)))
window41 <- as.numeric(stats::filter(response_time_ms, rep(1 / 41, 41)))

ggplot(server, aes(minute, response_time_ms)) +
  geom_point(alpha = 0.3) +
  geom_line(aes(y = true_curve), linetype = "dashed", color = "grey40") +
  geom_line(aes(y = window3), color = "#2b6cb0", linewidth = 1, na.rm = TRUE) +
  geom_line(aes(y = window41), color = "#c05621", linewidth = 1, na.rm = TRUE)
```

At minute 90, where the true climb sits at 112.8 milliseconds, the narrow 3-minute average reads 128.6, still bouncing with whatever noise happened to land nearby. The wide 41-minute average reads 116.6, much closer to the truth, because averaging over 41 minutes cancels out far more of the noise.

That wide average pays for its smoothness, though. Averaging over 41 minutes needs 20 minutes of neighbours on each side of a point, so it has no value at all for the first 20 and the last 20 minutes on the plot, one stretch nearly flat near the start and the other still climbing near the end. A narrower window gives up some of that smoothness to stay defined everywhere.

=== step === quiz
## Quick check: reading the four smoothers

A loess fit at span 0.3 and a regression spline fit at 6 degrees of freedom both track the same climb closely. Suppose you lower the loess span to 0.1 and separately raise the regression spline's degrees of freedom to 15. Do these two changes move their fits in the same direction, or in opposite directions?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Opposite directions: the smaller span makes the loess fit more flexible, while the larger degrees of freedom makes the spline fit less flexible. ::no
- Same direction: both fits become more flexible, because a smaller span looks at a narrower neighbourhood and more degrees of freedom gives the curve more pieces to bend with. ::ok Right. A smaller span and a larger degrees of freedom both widen how much the curve is allowed to wiggle, so they move the same way even though one number goes down and the other goes up.
- Same direction: both fits become smoother, because reducing the span and raising the degrees of freedom both add more structure to the fit. ::no
- There's no general relationship between the two; it depends on the dataset. ::no Not quite. Span and degrees of freedom are two names for one dial: how far a fitted point is allowed to look around it. A smaller span narrows that neighbourhood and a larger degrees of freedom buys more pieces to bend with, and both of those move a fit the same way, toward more flexible, on any dataset they are fitted to.

=== step === widget
## The sweep: from stiff to wiggly

The widget below swaps in a different curve, its own built-in 60-point example, so the sweep from one extreme to the other is easy to see on data built just for this. Its x-axis plays the same role as minute and its y-axis plays the same role as response time, just on a smaller, cleaner example.

::widget spline-smoother {}

Drag the smoothness slider labelled basis size k from 2 toward 30. At the low end the curve barely bends at all, missing the true shape underneath it: that is underfitting, also called bias, a curve too stiff to represent the signal it is supposed to track. At the high end the curve chases every noisy point: that is overfitting, also called variance, a curve so flexible it bends around the noise as if it were signal.

Somewhere in between, around the default setting of 6, the fitted curve tracks the dashed true curve without chasing its jitter. That middle ground is what every smoother in this lesson is reaching for, however it names its own dial.

=== step === concept
## Why eyeballing the sweep is not enough

Looking at a curve and judging whether it is too stiff or too wiggly works on the widget above because the true curve is drawn right there for comparison. On real data nobody has that dashed line. So the setting has to be chosen some other way, by testing the fit on data it never got to see.

Hold out the last 30 of the 180 minutes. Fit a smoother on only the first 150 minutes, then check its predictions against the real values in that held-out stretch. A natural regression spline, ns(), built so it extrapolates in a straight line past the edge of its training data rather than curving wildly the way some other splines do, is fit three times, at 3, 10 and 40 degrees of freedom, and each fit's error is measured on those 30 held-out minutes.

```r
# Fit the same natural spline at three flexibilities, then test each on minutes it never saw
library(splines)
train_minute <- minute[1:150]; train_resp <- response_time_ms[1:150]
test_minute  <- minute[151:180]; test_resp  <- response_time_ms[151:180]

held_out_rmse <- function(df) {
  fit <- lm(train_resp ~ ns(train_minute, df = df))
  test_fit <- predict(fit, newdata = data.frame(train_minute = test_minute))
  sqrt(mean((test_fit - test_resp) ^ 2))
}

round(c(df_3 = held_out_rmse(3), df_10 = held_out_rmse(10), df_40 = held_out_rmse(40)), 1)
#>  df_3 df_10 df_40 
#>  28.1  13.9 101.7 
```

A degrees of freedom of 40 gives a held-out error of 101.7, by far the worst of the three. A degrees of freedom of 3 gives 28.1. A degrees of freedom of 10 gives 13.9, the best of the three by a wide margin.

On the training data itself, though, df = 40 is actually the closest-fitting curve of the three, hugging the 150 training points more tightly than df = 10 does. Past the edge of that training data, it has nothing left to fit, only whatever direction its curve happened to be pointing when the data ran out.

Its last wiggle before minute 150 happens to be heading downward, and a natural spline continues in a straight line past the edge of its training range, so that downward line gets stretched across the whole held-out stretch. It predicts 213 milliseconds at minute 151 and falls all the way to 91 by minute 180, while the real reading there is 251. The df = 10 fit has no such wiggle to extrapolate, so its predictions keep climbing in step with the real data, from 224 up to 252.

That is the whole argument for held-out error over eyeballing. The curve that looked the most convincing on the data it was shown was, by a factor of five, the worst at predicting data it had not seen.

=== step === quiz
## Closing check: the trade-off across every method

Each of these is a real change you could make to one of the four smoothers in this lesson: a narrower moving-average window, a smaller loess span, a higher regression-spline degrees of freedom, or a lower smoothing-spline penalty. Which one pushes its fit furthest toward the overfitting side of the trade-off?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- Only the higher regression-spline degrees of freedom, since adding degrees of freedom is the textbook definition of overfitting. ::no
- Only the narrower moving-average window, since it is the simplest of the four smoothers to overfit with. ::no
- None of them increase variance on their own; it only happens once two or more of these changes are combined. ::no Not quite. Each of these four is the same dial, how far a fitted point is allowed to look around it, turned the same way under a different name. A narrower window, a smaller span, a higher degrees of freedom and a lower penalty each shrink that neighbourhood on their own, with no need to combine them, and each one alone pushes its fit toward chasing noise.
- All four, by about the same amount, because each one shrinks how far a fitted point is allowed to look around it. ::ok Right. Window width, span, degrees of freedom and smoothing parameter are four names for one dial, and moving any one of them in the direction that shrinks the neighbourhood pushes that smoother toward overfitting.

=== step === tryit
## Your turn: change a setting, read the error

The training and held-out minutes are still around. Below is the same regression spline fit at degrees of freedom 2, clearly under-smoothed, tested against the same 30 held-out minutes. Change the blank to 10, the setting with the lowest held-out error, and check that the error drops.

```r
# Fit a natural spline on the training 150 minutes, then test it on the last 30
library(splines)
fit <- lm(train_resp ~ ns(train_minute, df = ____))
test_fit <- predict(fit, newdata = data.frame(train_minute = test_minute))
round(sqrt(mean((test_fit - test_resp) ^ 2)), 1)
```
::check {"regex":"df\\s*=\\s*(8|9|10|11|12)\\b","gate":true,"difficulty":"beginner","ok":"Right: raising the degrees of freedom from 2 to 10 drops the held-out error from 25.7 to 13.9, the lowest of the settings tested on data the fit never saw.","no":"Replace the blank with 10, the setting with the lowest held-out error: ns(train_minute, df = 10)."}
::solution
```r
# Refit at the winning degrees of freedom and read the held-out error
library(splines)
fit <- lm(train_resp ~ ns(train_minute, df = 10))
test_fit <- predict(fit, newdata = data.frame(train_minute = test_minute))
round(sqrt(mean((test_fit - test_resp) ^ 2)), 1)
#> [1] 13.9
```

=== step === concept
## References

- [Robust Locally Weighted Regression and Smoothing Scatterplots](https://doi.org/10.1080/01621459.1979.10481038) - Cleveland, W.S. (1979), Journal of the American Statistical Association, 74(368), 829-836. The paper that introduced the loess fit built into this lesson's four-smoother comparison.
- Hastie, T. and Tibshirani, R. (1990). Generalized Additive Models. Chapman & Hall. Frames every smoother here as a building block for a generalized additive model.
- Simonoff, J.S. (1996). Smoothing Methods in Statistics. Springer. A full treatment of the bias-variance trade-off this lesson builds by hand.
- [Generalized Additive Models: An Introduction with R](https://www.routledge.com/products/9781498728331) - Wood, S.N. (2017), 2nd edition, CRC Press. Written by the author of the mgcv package, which fits additive models from smooth terms like these.
- [The Elements of Statistical Learning](https://link.springer.com/book/9780387848570) - Hastie, T., Tibshirani, R. and Friedman, J. (2009), 2nd edition, Springer. Chapter 5 covers basis expansions and regularization, the formal version of the regression and smoothing splines built here.

=== step === complete
## What picking a smoother actually decides

Four different smoothers, a moving average, a loess fit, a regression spline and a smoothing spline, all do the same job on the same 180-minute climb: trade off how closely they track every noisy point against how much of that noise they let through.

Each one controls that trade-off with its own single dial, a window width, a span, a degrees of freedom or a smoothing parameter, and sliding any of those dials toward more flexibility moves the fit the same way: less bias, more variance.

Eyeballing a fitted curve cannot tell you where on that trade-off to land, because the curve that looks closest to the data it was shown, df = 40 here, can be the worst at predicting data it has not seen. Held-out error can tell you: on this server's 180 minutes, a degrees of freedom of 10 beat both 3 and 40 by testing each one honestly on the last 30 minutes.

The next part of this course fits a generalized additive model, which picks that smoothing dial for you instead of leaving you to sweep it by hand.

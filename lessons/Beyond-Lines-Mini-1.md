---
title: "Segmented regression: find the breakpoints"
slug: "Beyond-Lines-Mini-1"
description: "A single straight line cannot explain data that has a kink in it. Build a hinge column, run an RSS grid search, and locate a real breakpoint yourself, in R."
keywords: "segmented regression, breakpoint regression, piecewise regression in R, hinge function regression, RSS grid search, changepoint detection, kink versus curve"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "beyond-straight-lines"
course_title: "Beyond Straight Lines"
course_lesson: "1"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Beyond-Lines-Mini-2"
curriculum_id: "0.0.36"
lesson_access: "windowed"
catalog_blurb: "Find the exact point where one slope changes to another, using RSS."
---

=== step === cover
## Segmented regression: find the breakpoints

Today let's understand segmented regression: how to pin down the exact spot where a relationship's slope changes.

Northlight Coffee runs a subscription box out of 140 local stores. Every store spent a different amount on Instagram ads last month, anywhere from about \$5,500 up to \$59,700, and every store rang up a different amount in sales that same month. Naturally you would expect that spending more on ads means selling more coffee. The chart below plots exactly that: each store's ad spend against its sales.

::widget chart-plotter {"data":[{"x":11.3,"y":41.72},{"x":39.2,"y":57.95},{"x":38.5,"y":57.28},{"x":39.3,"y":61.4},{"x":52.4,"y":83.35},{"x":40.2,"y":60.21},{"x":5.5,"y":36.65},{"x":17.8,"y":40.5},{"x":41.6,"y":63.33},{"x":33.3,"y":50.4},{"x":43.1,"y":64.05},{"x":35,"y":53.14},{"x":20.6,"y":38.97},{"x":55.8,"y":81.21},{"x":21.1,"y":45.72},{"x":51.1,"y":77.48},{"x":20.7,"y":44.75},{"x":19.7,"y":41.75},{"x":15.3,"y":41.72},{"x":17.8,"y":39.09},{"x":22.4,"y":43.2},{"x":21.6,"y":44.01},{"x":13.7,"y":47.17},{"x":7.2,"y":44.08},{"x":17,"y":41.06},{"x":49.6,"y":74.43},{"x":33.9,"y":48.76},{"x":55.3,"y":83.69},{"x":50.7,"y":77.76},{"x":7.5,"y":47.49},{"x":30.1,"y":48.28},{"x":19.6,"y":41.52},{"x":21.8,"y":43.47},{"x":32.9,"y":49.31},{"x":15,"y":39.77},{"x":46.8,"y":70.08},{"x":16.1,"y":39.73},{"x":19.2,"y":43.38},{"x":59.6,"y":87.92},{"x":49.4,"y":72.93},{"x":35.4,"y":53.6},{"x":40.6,"y":59.26},{"x":22.2,"y":40},{"x":39.2,"y":61.87},{"x":23.1,"y":43.53},{"x":32.6,"y":52.9},{"x":42.2,"y":59.64},{"x":31.7,"y":49.7},{"x":18.4,"y":44.78},{"x":47.1,"y":69.91},{"x":9.1,"y":40.79},{"x":22,"y":40.95},{"x":44.4,"y":72.51},{"x":32.8,"y":52.93},{"x":13.4,"y":47.48},{"x":32.7,"y":50.79},{"x":32.2,"y":47.98},{"x":46.3,"y":64.37},{"x":14.6,"y":40.28},{"x":51.7,"y":76.87},{"x":52.6,"y":80.45},{"x":7.3,"y":41.85},{"x":22.4,"y":39.84},{"x":5.8,"y":42.88},{"x":18.1,"y":37.76},{"x":43.9,"y":64.57},{"x":21.9,"y":42.34},{"x":33,"y":45.11},{"x":7.8,"y":43.93},{"x":36.1,"y":53.27},{"x":11.7,"y":40.75},{"x":54.1,"y":83.62},{"x":5.8,"y":42.78},{"x":48.1,"y":71.01},{"x":9.9,"y":43.03},{"x":33.6,"y":52.96},{"x":26.1,"y":48.9},{"x":8.9,"y":42.16},{"x":22.6,"y":44.91},{"x":41.8,"y":63.87},{"x":56,"y":80.87},{"x":31,"y":48.54},{"x":12.8,"y":46.84},{"x":34.9,"y":50.89},{"x":15.8,"y":42.74},{"x":54.4,"y":83.93},{"x":26.4,"y":43.26},{"x":22.1,"y":40.15},{"x":13.8,"y":39.46},{"x":54.3,"y":78.53},{"x":14.2,"y":39.59},{"x":54.5,"y":79.19},{"x":12.4,"y":40.62},{"x":12.2,"y":41.28},{"x":10.8,"y":42.84},{"x":33.1,"y":52.96},{"x":21.5,"y":48.26},{"x":6.5,"y":40.77},{"x":22,"y":42.34},{"x":45.8,"y":72.64},{"x":7,"y":46.16},{"x":36.1,"y":55.26},{"x":20.4,"y":42.06},{"x":16.2,"y":36.96},{"x":12.4,"y":46.09},{"x":22.9,"y":40.92},{"x":13.5,"y":38.65},{"x":12.1,"y":50.95},{"x":29,"y":46.26},{"x":7.1,"y":40.97},{"x":44.2,"y":57.87},{"x":10.5,"y":41.28},{"x":57.3,"y":86.68},{"x":11.7,"y":43},{"x":17.1,"y":45.3},{"x":55.2,"y":86.87},{"x":57,"y":86.86},{"x":20.4,"y":41.53},{"x":11.8,"y":43.88},{"x":48.8,"y":71.68},{"x":45.9,"y":66.75},{"x":55.4,"y":72.62},{"x":59.7,"y":84.63},{"x":56.8,"y":84.54},{"x":31.7,"y":55.7},{"x":20.6,"y":44.59},{"x":18.8,"y":44.68},{"x":32.7,"y":47.65},{"x":32.3,"y":50.49},{"x":22.5,"y":37.14},{"x":57.9,"y":86.02},{"x":39.9,"y":62.36},{"x":12,"y":42.36},{"x":28.3,"y":46.71},{"x":55.3,"y":81.99},{"x":30.7,"y":50.13},{"x":54.9,"y":86.04},{"x":37.9,"y":60.9},{"x":39.7,"y":60.09},{"x":52.8,"y":74.34}],"geoms":["point"],"x":"spend","y":"sales","code":{"point":"ggplot(stores, aes(spend, sales)) +\n  geom_point(alpha = 0.6) +\n  geom_smooth(method = \"lm\", se = FALSE, colour = \"firebrick\") +\n  geom_smooth(method = \"loess\", se = FALSE, colour = \"steelblue\")"}}

Press Run. It draws the 140 stores as a scatter, then lays two lines over them: a straight best fit line in red, and a curve that bends to follow the data in blue. Look at where the two pull apart, right in the middle of the cloud. The straight line runs too flat through the left half of the points and too shallow through the right half, while the curve smooths through the middle without ever quite matching the sharp turn the data makes at one particular spend level. That is the shape segmented regression is built to explain.

=== step === concept
## A kink is not a curve

Both lines on that chart missed the same thing, so let's measure exactly how badly. Fit one ordinary straight line through all 140 stores and see how well it does.

```r
# Simulate Northlight's 140 stores and fit one straight line through all of them
set.seed(1234)
spend <- round(runif(140, 5, 60), 1)
sales <- 40 + 0.15 * spend + ifelse(spend > 28, 1.20 * (spend - 28), 0) + rnorm(140, sd = 3)
stores <- data.frame(spend = spend, sales = sales)

fit_single <- lm(sales ~ spend, data = stores)
round(coef(fit_single), 3)
#> (Intercept)       spend 
#>      27.952       0.879 

round(sum(resid(fit_single)^2), 1)
#> [1] 4563

plot(sales ~ spend, data = stores, pch = 20, col = "grey40",
     xlab = "Ad spend, $'000", ylab = "Sales, $'000",
     main = "One straight line through all 140 stores")
abline(fit_single, col = "steelblue", lwd = 2)
```

`spend` and `sales` are both stored in thousands of dollars, so `spend = 27` means a store spent \$27,000 on ads, and `sales = 60` means that store rang up \$60,000. From here on I will just state the dollar amounts directly.

The single line says every extra \$1,000 of spend adds about \$879 in sales, everywhere along the range. To see how badly that one number fits, add up every point's squared miss from the line: predicted sales minus real sales, squared, then summed across all 140 stores. That total is called the residual sum of squares, RSS for short, and it comes out to about 4,563. The plot shows why: the line cuts through the flat stores on the left and the steep stores on the right, fitting neither group well.

Here is the distinction that matters. A curve bends smoothly, a little more at every point, with no single spot where anything changes abruptly. What Northlight's data shows instead is a kink: an abrupt change of slope at one exact spend level, flat before it and steep after it. Segmented regression is built for exactly this shape. Instead of smoothing through the kink the way a polynomial or a loess curve would, it assumes the kink is real, and estimates the one spend level where it happens. That level has a name: the breakpoint.

=== step === concept
## The hinge term: one line, two slopes

Suppose you already knew where the breakpoint sat, say at \$25,000. Could you fit two slopes with plain `lm()`, no special package? Yes: add a column that stays at zero until spend passes \$25,000, then rises exactly as fast as spend does after that.

That column is called a hinge term. Written out, the model looks like this:

\[
\text{sales} = \beta_0 + \beta_1 \cdot \text{spend} + \beta_2 \cdot (\text{spend} - c)_+
\]

Here \(c\) is the breakpoint you're trying, and \((\text{spend} - c)_+\) means "spend minus \(c\), or zero, whichever is bigger": zero for every store below \(c\), and rising one for one with spend above it. In R that is `pmax(spend - c, 0)`. Once you build that column, \(\beta_1\) is the slope below \(c\), and \(\beta_1 + \beta_2\) is the slope above it, because past \(c\) the hinge column rises exactly as fast as spend does, so its coefficient adds straight onto the original slope.

Let's try it at \(c = 25\).

```r
# Add a hinge column that is 0 up to spend = 25 and rises after, then fit lm() with it
hinge25 <- pmax(stores$spend - 25, 0)
fit25 <- lm(sales ~ spend + hinge25, data = stores)
round(coef(fit25), 4)
#> (Intercept)       spend     hinge25 
#>     43.7414     -0.1017      1.4323 

round(sum(resid(fit25)^2), 1)
#> [1] 1207.3

slope_below <- coef(fit25)["spend"]
slope_above <- slope_below + coef(fit25)["hinge25"]
round(c(below = slope_below, above = slope_above), 3)
#> below.spend above.spend 
#>      -0.102       1.331 
```

Below \$25,000, the slope is slightly negative, essentially flat. Above \$25,000, it jumps to about 1.33: every extra \$1,000 in spend adds roughly \$1,330 in sales. And the RSS dropped from 4,563 for the single line down to 1,207.3 for this two-slope fit, even at a breakpoint we only guessed at. Two slopes joined at a hinge already explain Northlight's data far better than one slope ever could.

=== step === widget
## How lm() actually picks a line: minimizing RSS

That guess of \$25,000 fit a lot better than one straight line, but was 25 actually the best guess? To answer that you first need to see, directly, what "best" means when `lm()` picks a line. Every time `lm()` picks a slope and an intercept, it is picking the pair that makes RSS as small as possible. Nothing else.

Watch it happen on a slice of Northlight's own data: the 68 stores that spent less than \$27,000, a range chosen because it looked flat in the opening scatter of ad spend against sales, not because \$27,000 is officially anything yet.

The chart below plots those same 68 stores, with sales shown as thousands above \$40,000 so the sliders have room to move. That shift changes nothing about the fit: moving every sales number down by the same constant only moves the intercept, never the residuals, so the RSS you see is the real one.

::widget ols-fit {"points":[{"x":11.3,"y":1.72},{"x":5.5,"y":-3.35},{"x":17.8,"y":0.5},{"x":20.6,"y":-1.03},{"x":21.1,"y":5.72},{"x":20.7,"y":4.75},{"x":19.7,"y":1.75},{"x":15.3,"y":1.72},{"x":17.8,"y":-0.91},{"x":22.4,"y":3.2},{"x":21.6,"y":4.01},{"x":13.7,"y":7.17},{"x":7.2,"y":4.08},{"x":17,"y":1.06},{"x":7.5,"y":7.49},{"x":19.6,"y":1.52},{"x":21.8,"y":3.47},{"x":15,"y":-0.23},{"x":16.1,"y":-0.27},{"x":19.2,"y":3.38},{"x":22.2,"y":0},{"x":23.1,"y":3.53},{"x":18.4,"y":4.78},{"x":9.1,"y":0.79},{"x":22,"y":0.95},{"x":13.4,"y":7.48},{"x":14.6,"y":0.28},{"x":7.3,"y":1.85},{"x":22.4,"y":-0.16},{"x":5.8,"y":2.88},{"x":18.1,"y":-2.24},{"x":21.9,"y":2.34},{"x":7.8,"y":3.93},{"x":11.7,"y":0.75},{"x":5.8,"y":2.78},{"x":9.9,"y":3.03},{"x":26.1,"y":8.9},{"x":8.9,"y":2.16},{"x":22.6,"y":4.91},{"x":12.8,"y":6.84},{"x":15.8,"y":2.74},{"x":26.4,"y":3.26},{"x":22.1,"y":0.15},{"x":13.8,"y":-0.54},{"x":14.2,"y":-0.41},{"x":12.4,"y":0.62},{"x":12.2,"y":1.28},{"x":10.8,"y":2.84},{"x":21.5,"y":8.26},{"x":6.5,"y":0.77},{"x":22,"y":2.34},{"x":7,"y":6.16},{"x":20.4,"y":2.06},{"x":16.2,"y":-3.04},{"x":12.4,"y":6.09},{"x":22.9,"y":0.92},{"x":13.5,"y":-1.35},{"x":12.1,"y":10.95},{"x":7.1,"y":0.97},{"x":10.5,"y":1.28},{"x":11.7,"y":3},{"x":17.1,"y":5.3},{"x":20.4,"y":1.53},{"x":11.8,"y":3.88},{"x":20.6,"y":4.59},{"x":18.8,"y":4.68},{"x":22.5,"y":-2.86},{"x":12,"y":2.36}]}

Drag the sliders and watch the SSE reading change, the widget's name for the same quantity, sum of squared errors. Press "Snap to least squares" and it jumps straight to the RSS-minimizing pair: a slope of about 0.004, practically flat, and an SSE of about 563.9. lm() found that pair by minimizing RSS, the exact same score that told you fit25 was better than the single line, and it is the exact same score a breakpoint search is about to use, just with one more value to search over: where the hinge sits.

=== step === widget
## What forcing one line across a kink looks like

Go back to that single straight line, the one with an RSS of 4,563. A residual is real sales minus predicted sales for one store. Plot every store's residual against its spend, and a forced-flat line leaves a very specific pattern.

::widget residual-plot {"start":"curved"}

This widget runs its own small example, but the shape under the curve setting is exactly what a single line does to Northlight's data: residuals swing negative on one side of the true kink and positive on the other, tracing a clear bend instead of scattering flatly. Switch to healthy and compare it with what a correctly hinged fit's residuals look like instead: no pattern at all, just noise above and below zero.

That U-shaped swing is what a high RSS looks like once you plot it out. It is the same trouble the single line's 4,563 already showed in one number; the residual plot just shows you where the misses are concentrated.

=== step === quiz
## Quick check: what RSS actually scores

The dragging widget and the residual pattern you just read both lean on the same idea. What exactly does RSS score?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- R-squared, the share of variance in sales that spend explains ::no
- The residual sum of squares: the total of every squared miss between a fitted line and the real data, the same number both lm() and a breakpoint search try to make as small as possible ::ok Right. lm() picks whichever slope and intercept minimize RSS, exactly what you watched happen when you snapped to least squares. A breakpoint search does the same thing one level up: it scores each candidate breakpoint by the RSS of the hinge fit built at that point, and keeps whichever one scores lowest.
- Whichever line looks like the best fit by eye ::no
- The p-value on the spend coefficient ::no RSS is not R-squared, a visual judgment, or a significance test. It is the total of every squared residual: the number lm() minimizes when it picks a line, and the number a breakpoint search minimizes when it picks a breakpoint. The bent shape in the residual widget is what a high RSS looks like once you draw it out.

=== step === concept
## The grid search: scoring every candidate breakpoint

Now you have everything needed to find Northlight's real breakpoint, not just guess at it. If lm() finds the best slope and intercept by minimizing RSS, a breakpoint search finds the best \(c\) the same way: try a range of candidate breakpoints, fit the hinge model at each one, and keep whichever candidate gives the lowest RSS.

```r
# Score every candidate breakpoint from 10 to 50 by its RSS, and keep the smallest
candidates <- seq(10, 50, by = 1)
rss_by_c <- sapply(candidates, function(c) {
  hinge <- pmax(stores$spend - c, 0)
  fit <- lm(sales ~ spend + hinge, data = stores)
  sum(resid(fit)^2)
})

best_c <- candidates[which.min(rss_by_c)]
best_rss <- round(min(rss_by_c), 1)
c(best_c = best_c, best_rss = best_rss)
#>   best_c best_rss 
#>     27.0   1174.6 
```

That loop fits 41 separate hinge models, one for every whole-number candidate from \$10,000 to \$50,000, and records each one's RSS. The winner is \$27,000, with an RSS of 1,174.6, well below the \$25,000 guess's 1,207.3 and nowhere close to the single line's 4,563.

A finer grid, stepping by \$100 instead of \$1,000, tightens that further.

```r
# Refine the search with a finer step around the winner
finer <- seq(20, 36, by = 0.1)
rss_finer <- sapply(finer, function(c) {
  hinge <- pmax(stores$spend - c, 0)
  fit <- lm(sales ~ spend + hinge, data = stores)
  sum(resid(fit)^2)
})
round(finer[which.min(rss_finer)], 1)
#> [1] 26.9
```

The finer search lands on \$26,900, a hair below the whole-number winner and close enough that both grids are clearly pointing at the same spot.

=== step === concept
## Reading the result: two slopes and where they meet

Take the winning breakpoint, \$27,000, and read its coefficients the same way you did for the \$25,000 guess.

```r
# Fit the winning breakpoint and read off its two slopes
hinge27 <- pmax(stores$spend - 27, 0)
fit_best <- lm(sales ~ spend + hinge27, data = stores)
round(coef(fit_best), 4)
#> (Intercept)       spend     hinge27 
#>     42.3746      0.0080      1.3817 

slope_below <- coef(fit_best)["spend"]
slope_above <- slope_below + coef(fit_best)["hinge27"]
round(c(below = slope_below, above = slope_above), 3)
#> below.spend above.spend 
#>       0.008       1.390 

plot(sales ~ spend, data = stores, pch = 20, col = "grey40",
     xlab = "Ad spend, $'000", ylab = "Sales, $'000",
     main = "The two-slope fit at the winning breakpoint")
spend_order <- order(stores$spend)
lines(stores$spend[spend_order], fitted(fit_best)[spend_order], col = "steelblue", lwd = 2)
abline(v = 27, lty = 2, col = "firebrick")
```

Below \$27,000, the slope is 0.008, close enough to zero to call it flat: whether a store spends \$6,000 or \$26,000 on ads, its sales barely move. Above \$27,000, the slope jumps to 1.39: every extra \$1,000 of spend goes with about \$1,390 more in sales. That is the sentence you could hand to a boss: below \$27,000 a month, ad spend buys almost nothing extra; past it, sales climb steeply with every dollar added.

=== step === concept
## How precise is the breakpoint estimate

\$27,000 is a single number, but how sure can you be that it is the right one? Look at how RSS behaved for the candidates right around it.

```r
# Look at how sharply RSS rises as the candidate breakpoint moves away from the winner
near_c <- 22:32
rss_near <- sapply(near_c, function(c) {
  hinge <- pmax(stores$spend - c, 0)
  fit <- lm(sales ~ spend + hinge, data = stores)
  sum(resid(fit)^2)
})
names(rss_near) <- near_c
round(rss_near, 1)
#>     22     23     24     25     26     27     28     29     30     31     32 
#> 1471.4 1356.9 1264.4 1207.3 1184.7 1174.6 1190.5 1226.6 1278.9 1342.8 1406.9 

plot(near_c, rss_near, type = "b", pch = 19, col = "steelblue",
     xlab = "Candidate breakpoint c ($'000)", ylab = "RSS",
     main = "RSS around the winning breakpoint")
abline(v = 27, lty = 2, col = "firebrick")
```

Move just one candidate away from 27, to 26 or 28, and RSS already climbs by 10 to 16. Move five away, to 22 or 32, and it is up by roughly 300. That is a sharp, narrow valley, and a sharp valley means the data pin the breakpoint down tightly: hardly any other candidate scores close to as well as 27 does. A flatter, wider valley would say the opposite, that a whole range of breakpoints fit about equally well, and the true location is much less certain.

Reading a valley's shape this way is informal. It gives you a feel for precision, not a number you could quote in a report. Turning it into an exact range, something like "the breakpoint sits between \$26,100 and \$27,900 at 95% confidence," takes a more advanced iterative method than a grid search.

[NOTE]
This data was built with a true breakpoint of \$28,000 (I fixed that number myself when generating it, so the search's own answer could be checked against it). The grid search's estimate of \$27,000, or \$26,900 from the finer grid, lands within about a thousand dollars of that true value, which is exactly the kind of result a sharp RSS valley predicts.

=== step === quiz
## Quick check: reading the search

The grid search's winner was \$27,000. What does that number actually mean?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It is the exact spend level where Northlight's true relationship changes, guaranteed ::no
- It is the breakpoint estimate that fits this particular sample's noise best, not a value guaranteed to be exactly right ::ok Right. The grid search reports whichever candidate minimizes RSS for these 140 stores. A different 140 stores drawn the same way would likely hand back a slightly different winner, maybe 26 or 28, not exactly 27 every time. That is why the shape of the RSS valley, not just this one number, is worth reading.
- It is the spend level where sales are highest ::no
- It is the spend level where spend and sales correlate most strongly ::no 27 is not the top of the sales range, and it is not where the correlation peaks either. It is the value of the candidate breakpoint that made the hinge model's RSS as small as possible for this sample, an estimate built from one dataset and its own noise, not a fixed fact about the population.

=== step === tryit
## Your turn: score a different breakpoint

You have seen that \$27,000 fits better than a \$25,000 guess. Confirm that it also fits better than a \$35,000 guess, by fitting the hinge model at \(c = 35\) and comparing its RSS to 1,174.6.

```r
# Build a hinge column at c = 35 and see how well that breakpoint fits
hinge35 <- pmax(stores$spend - 35, 0)
fit35 <- lm(sales ~ spend + hinge35, data = stores)

# your code here: print the RSS for this fit, and compare it to 1174.6 (the RSS at c = 27)
```
::check {"regex":"sum[(]resid[(]fit35[)]\\^2[)]|deviance[(]fit35[)]","gate":true,"difficulty":"intermediate","ok":"Right: the RSS at c = 35 is about 1,583.9, well above 1,174.6 at c = 27. Thirty-five spends further out on the range and misses the real bend, so its fit is noticeably worse.","no":"Compute RSS the same way you did for fit_best: sum(resid(fit35)^2), or the equivalent deviance(fit35)."}
::solution
```r
# Compute the RSS for the c = 35 hinge fit
sum(resid(fit35)^2)
#> [1] 1583.9
```

1,583.9 is well above 1,174.6, so the grid search from earlier already found a better breakpoint than 35.

=== step === concept
## References

A few authoritative places to take segmented regression further:

- [Estimating regression models with unknown break-points](https://onlinelibrary.wiley.com/doi/10.1002/sim.1545) - Muggeo (2003), Statistics in Medicine, 22(19), 3055 to 3071.
- [segmented: An R package to fit regression models with broken-line relationships](https://journal.r-project.org/articles/RN-2008-004/) - Muggeo (2008), R News, 8(1), 20 to 25.
- [Hypothesis testing when a nuisance parameter is present only under the alternative](https://academic.oup.com/biomet/article-abstract/74/1/33/217600) - Davies (1987), Biometrika, 74(1), 33 to 43.
- [segmented package reference manual](https://cran.r-project.org/web/packages/segmented/segmented.pdf) - CRAN.

=== step === complete
## Recap

You built segmented regression up from nothing but `lm()`. To recap the whole method:

- A kink is an abrupt change of slope at one exact point, unlike a curve, which bends smoothly everywhere. The point where a kink happens is the breakpoint.
- A hinge column, `pmax(spend - c, 0)`, turns a two-slope model into one ordinary `lm()` call: the slope before \(c\) is \(\beta_1\), the slope after it is \(\beta_1 + \beta_2\).
- RSS, the residual sum of squares, is the score both `lm()` and a breakpoint search minimize. It is the same number whether you are picking a slope or picking a breakpoint.
- With the breakpoint unknown, a grid search fits the hinge model at many candidate values of \(c\) and keeps whichever one gives the lowest RSS. For Northlight, that was \$27,000, refined to \$26,900 on a finer grid.
- Reading the RSS values near the winner gives an informal sense of precision: a sharp valley means the estimate is pinned down tightly, a flat one means it is not.

The next lesson in this course takes that RSS valley and turns it into a proper confidence interval for the breakpoint.

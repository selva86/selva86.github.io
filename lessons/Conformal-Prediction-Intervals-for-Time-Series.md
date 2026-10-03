---
title: "The Expert Edge in Forecasting Like a Pro Lesson 2: Conformal prediction intervals for time series"
catalog_blurb: "Build a prediction interval that actually hits its target coverage, not an assumed spread."
description: "Build a split-conformal prediction interval in R from calibration residuals, and see why it hits 90% coverage where a normal-theory interval reaches 66%."
keywords: "conformal prediction intervals, split conformal prediction, prediction interval R, calibration residuals, nonconformity score, coverage guarantee, distribution free inference, time series forecasting, heteroskedastic residuals, quantile regression intervals"
post_type: "LESSON"
curriculum_id: "5.150.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "2"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Intermittent-Demand-Croston-ADIDA-and-TSB.html"
course_prev: "Rolling-Origin-CV-and-the-Leakage-That-Fakes-Great-Backtests.html"
---

=== step === cover
## Conformal prediction intervals for time series

Today let's understand how to build a forecast interval that actually covers 90% of real outcomes when it says 90%, no matter how the error spread around the forecast behaves.

Lumen & Co is an online retailer, and its best-selling item is a desk lamp. Below are its weekly unit sales for the last 220 weeks, a little over four years.

::widget chart-plotter {"data":[{"x":1,"y":36},{"x":2,"y":36},{"x":3,"y":40},{"x":4,"y":40},{"x":5,"y":44},{"x":6,"y":36},{"x":7,"y":50},{"x":8,"y":43},{"x":9,"y":42},{"x":10,"y":42},{"x":11,"y":53},{"x":12,"y":42},{"x":13,"y":46},{"x":14,"y":45},{"x":15,"y":60},{"x":16,"y":42},{"x":17,"y":47},{"x":18,"y":29},{"x":19,"y":56},{"x":20,"y":44},{"x":21,"y":64},{"x":22,"y":52},{"x":23,"y":49},{"x":24,"y":59},{"x":25,"y":46},{"x":26,"y":75},{"x":27,"y":55},{"x":28,"y":47},{"x":29,"y":58},{"x":30,"y":58},{"x":31,"y":47},{"x":32,"y":53},{"x":33,"y":66},{"x":34,"y":58},{"x":35,"y":57},{"x":36,"y":47},{"x":37,"y":62},{"x":38,"y":50},{"x":39,"y":63},{"x":40,"y":60},{"x":41,"y":51},{"x":42,"y":39},{"x":43,"y":53},{"x":44,"y":66},{"x":45,"y":82},{"x":46,"y":60},{"x":47,"y":51},{"x":48,"y":48},{"x":49,"y":52},{"x":50,"y":58},{"x":51,"y":86},{"x":52,"y":59},{"x":53,"y":55},{"x":54,"y":67},{"x":55,"y":64},{"x":56,"y":53},{"x":57,"y":71},{"x":58,"y":74},{"x":59,"y":99},{"x":60,"y":86},{"x":61,"y":74},{"x":62,"y":54},{"x":63,"y":77},{"x":64,"y":76},{"x":65,"y":64},{"x":66,"y":60},{"x":67,"y":69},{"x":68,"y":96},{"x":69,"y":82},{"x":70,"y":98},{"x":71,"y":79},{"x":72,"y":46},{"x":73,"y":64},{"x":74,"y":69},{"x":75,"y":82},{"x":76,"y":73},{"x":77,"y":101},{"x":78,"y":92},{"x":79,"y":64},{"x":80,"y":79},{"x":81,"y":82},{"x":82,"y":63},{"x":83,"y":84},{"x":84,"y":103},{"x":85,"y":62},{"x":86,"y":86},{"x":87,"y":97},{"x":88,"y":71},{"x":89,"y":56},{"x":90,"y":99},{"x":91,"y":79},{"x":92,"y":73},{"x":93,"y":69},{"x":94,"y":100},{"x":95,"y":79},{"x":96,"y":83},{"x":97,"y":75},{"x":98,"y":104},{"x":99,"y":61},{"x":100,"y":98},{"x":101,"y":108},{"x":102,"y":84},{"x":103,"y":104},{"x":104,"y":69},{"x":105,"y":104},{"x":106,"y":77},{"x":107,"y":94},{"x":108,"y":60},{"x":109,"y":76},{"x":110,"y":101},{"x":111,"y":98},{"x":112,"y":99},{"x":113,"y":108},{"x":114,"y":95},{"x":115,"y":116},{"x":116,"y":57},{"x":117,"y":72},{"x":118,"y":87},{"x":119,"y":112},{"x":120,"y":103},{"x":121,"y":127},{"x":122,"y":95},{"x":123,"y":101},{"x":124,"y":129},{"x":125,"y":96},{"x":126,"y":87},{"x":127,"y":128},{"x":128,"y":130},{"x":129,"y":111},{"x":130,"y":133},{"x":131,"y":119},{"x":132,"y":61},{"x":133,"y":128},{"x":134,"y":108},{"x":135,"y":67},{"x":136,"y":72},{"x":137,"y":86},{"x":138,"y":115},{"x":139,"y":107},{"x":140,"y":124},{"x":141,"y":135},{"x":142,"y":129},{"x":143,"y":55},{"x":144,"y":98},{"x":145,"y":78},{"x":146,"y":129},{"x":147,"y":118},{"x":148,"y":101},{"x":149,"y":126},{"x":150,"y":81},{"x":151,"y":101},{"x":152,"y":96},{"x":153,"y":109},{"x":154,"y":113},{"x":155,"y":127},{"x":156,"y":139},{"x":157,"y":124},{"x":158,"y":119},{"x":159,"y":112},{"x":160,"y":113},{"x":161,"y":144},{"x":162,"y":105},{"x":163,"y":100},{"x":164,"y":125},{"x":165,"y":150},{"x":166,"y":133},{"x":167,"y":121},{"x":168,"y":79},{"x":169,"y":164},{"x":170,"y":115},{"x":171,"y":94},{"x":172,"y":118},{"x":173,"y":103},{"x":174,"y":87},{"x":175,"y":102},{"x":176,"y":130},{"x":177,"y":123},{"x":178,"y":119},{"x":179,"y":137},{"x":180,"y":69},{"x":181,"y":100},{"x":182,"y":140},{"x":183,"y":129},{"x":184,"y":151},{"x":185,"y":136},{"x":186,"y":161},{"x":187,"y":105},{"x":188,"y":121},{"x":189,"y":144},{"x":190,"y":149},{"x":191,"y":116},{"x":192,"y":167},{"x":193,"y":96},{"x":194,"y":150},{"x":195,"y":150},{"x":196,"y":143},{"x":197,"y":117},{"x":198,"y":143},{"x":199,"y":170},{"x":200,"y":121},{"x":201,"y":184},{"x":202,"y":136},{"x":203,"y":118},{"x":204,"y":138},{"x":205,"y":126},{"x":206,"y":112},{"x":207,"y":143},{"x":208,"y":138},{"x":209,"y":109},{"x":210,"y":162},{"x":211,"y":146},{"x":212,"y":134},{"x":213,"y":151},{"x":214,"y":160},{"x":215,"y":174},{"x":216,"y":138},{"x":217,"y":135},{"x":218,"y":183},{"x":219,"y":165},{"x":220,"y":159}],"geoms":["line"],"x":"week","y":"units","code":{"line":"ggplot(lumen, aes(week, units)) +\n  geom_line()"}}

Sales climb for most of the chart, from around 40 units a week near the start to around 150 by the end. But look at how much rougher the line gets as you move to the right: the week-to-week jumps near week 220 are plainly bigger than the ones near week 1.

=== step === concept
## Why one forecast number is never enough

Suppose you had to tell Lumen's warehouse manager how many lamps next week will sell, and you could only give one number. Whatever number you pick, say 120, the real figure that shows up will almost certainly not be exactly 120. It might be 108. It might be 134. A single number like this, a point forecast, is nearly always a little wrong, and there is no way around that.

So instead of one number, you build a range: a prediction interval. A 90% prediction interval is a range built so that, if you could rerun next week over and over under the same conditions, the real sales figure would land inside that range 90% of the time. That 90% is the interval's nominal coverage: the rate it is built to hit, fixed by construction, before you have seen a single real outcome to check it against.

What an interval is built to do and what it actually does are two different things, though. Once real future weeks actually arrive, you can go back and count how often the interval you built actually contained the truth. That count, as a fraction, is the interval's empirical coverage: not what it was built for, but what it delivered.

=== step === concept
## The usual fix: assume Normal, constant-spread errors

The classic way to build a 90% prediction interval for a forecast like this is to fit a trend line to the data, then add and subtract a single fixed amount around that line, an amount built from how far off the line usually ran on the data used to fit it.

Here is that model, fit only on Lumen's first 120 weeks, the training data.

```r
# Build Lumen's 220 weeks of sales, fit a trend line on the first 120 weeks, and get its 90% prediction interval
set.seed(9)
week <- 1:220
trend <- 40 + 0.5 * (week - 1)
spread <- ifelse(week <= 120, 5 + (22 - 5) * (week - 1) / (120 - 1), 22)
units <- round(trend + rnorm(220, 0, spread))
lumen <- data.frame(week = week, units = units)

train <- lumen[1:120, ]
fit <- lm(units ~ week, data = train)

round(predict(fit, newdata = data.frame(week = 121), interval = "prediction", level = 0.90), 2)
#>     fit   lwr    upr
#> 1 96.59 74.75 118.43
```

`train` is the first 120 weeks, the only data `fit` ever sees. `predict()` with `interval = "prediction"` does two things in one call: it forecasts week 121's sales at 96.59, and it wraps a band around that forecast, built so that 90% of weeks like this one should see their real sales land inside it. Here that band runs from 74.75 to 118.43, a half-width of about 21.84 units on either side of the forecast.

Where does 21.84 actually come from?

```r
# Work out where the 21.84 half-width above actually comes from
sigma <- summary(fit)$sigma
halfwidth_normal <- qnorm(0.95) * sigma
round(c(sigma = sigma, halfwidth_normal = halfwidth_normal), 2)
#>            sigma halfwidth_normal 
#>            12.96            21.31 
```

`sigma` is the residual standard deviation of the fitted model: one number, 12.96, summarizing how far off the trend line's fitted values typically ran across all 120 training weeks pooled together. `qnorm(0.95)` is 1.645, the point past which a standard Normal distribution has only 5% of its area remaining, so going 1.645 standard deviations either side of a forecast covers the middle 90%. Multiply the two and you get 21.31, which accounts for nearly all of the 21.84 that `predict()` actually returned.

The rest of that gap is a small extra term `predict()` adds for the uncertainty in the trend line's own fitted slope and intercept, and it grows a little the further a week sits from the training data.

```r
# Check the same 90% prediction interval much further into the future, at week 220
round(predict(fit, newdata = data.frame(week = 220), interval = "prediction", level = 0.90), 2)
#>      fit    lwr    upr
#> 1 142.56 119.18 165.95
```

By week 220, almost a hundred weeks past where training stopped, that half-width has crept up to about 23.4. But next to the 21.31 units that sigma alone contributes, the creep is small, so from here on, 21.31 is the Normal-theory half-width: one fixed number, built once from the training residuals, used the same way for every future week.

That number only holds up if the real week-to-week wobble around the trend keeps behaving like a single Normal distribution with that one constant spread, 12.96, for every week Lumen ever sells lamps.

=== step === concept
## When the spread of errors keeps changing

The `spread` object that generated this data starts at 5 in week 1 and climbs in a straight line up to 22 by week 120, then holds at 22 for the rest of the series.

That single number, the standard deviation of each week's random wobble around the trend, is exactly what a constant-spread prediction interval has to assume stays fixed forever. It does not. Going from 5 units of typical wobble in week 1 to 22 units from week 120 onward is more than a fourfold increase, all inside the very data `sigma` was pooled from.

This pattern, an error spread that changes depending on where you are in the data instead of staying constant, is called heteroskedasticity. The clearest way to see it is a scatter of points whose spread visibly fans out further along the x-axis, with percentile lines drawn through the 10th, 50th and 90th percentile tracking that fan.

The widget below uses its own example, income against years of work experience, instead of Lumen's sales, but it shows the identical pattern: years of experience stands in for week number, and income stands in for weekly sales.

::widget quantile-lines {}

Toggle between the 10th percentile, median and 90th percentile lines. At low experience, standing in for Lumen's early weeks, the three lines sit close together: not much separates a bad outcome from a good one. At high experience, standing in for Lumen's later weeks, they pull far apart: the gap between a bad outcome and a good one has grown enormously. A single straight line, or a single fixed half-width wrapped around it, can only ever describe one of those two pictures, never both.

=== step === quiz
## Quick check: reading what the fan-out means

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The fan-out just means the trend line itself needs more bend to it, not a straight line. ::no
- A half-width built from the spread of an earlier, calmer stretch of weeks will be too narrow once the real spread has grown this much. ::ok Exactly. The 21.31 half-width came from sigma, one number pooled across all 120 training weeks, most of which had a far smaller wobble than the weeks right before the training period ends. A spread that keeps climbing will always outrun a half-width built that way.
- Since the training period's average spread already blends in the wider later weeks, the fixed half-width already accounts for the growth. ::no
- It only affects how accurate the point forecast is, not how wide the interval around it should be. ::no None of the other three hold up. The half-width is one number, sigma pooled across all 120 training weeks, so it reflects the average wobble over that whole period, not the wobble right before the forecast period actually starts. When the real spread keeps climbing past that average, the way Lumen's does, a fixed half-width built from it falls short exactly where the data gets noisiest.

=== step === concept
## The conformal idea: calibrate on held-out residuals
::prose-only the recipe is a sequence of rules, not a shape to draw; the numbers it produces are worked out concretely in the next R step

Split-conformal prediction fixes the same problem a different way. Instead of assuming the errors follow a Normal distribution with one constant spread, it measures how big the model's errors actually were, on data the model never trained on, and uses that measurement directly as the half-width.

Here is the recipe. Split the series into three blocks in time order: a training block the model learns from, a calibration block the model never sees during training, and an evaluation block held back purely to judge the final result. On the calibration block, compute each week's nonconformity score, how far off, in absolute terms, the model's forecast was from the real sales: |actual minus forecast|. That produces one score per calibration week.

Then take a quantile of those scores and use it directly as the interval's half-width. Not exactly the 90th percentile, though: for a calibration set of size m and a target coverage of 90%, the correct level is `ceiling((m + 1) * 0.90) / m`. For m = 50, that works out to `ceiling(45.9) / 50`, which is 46 out of 50, the 46th-smallest score, landing at about the 92nd percentile.

That small correction, using m + 1 instead of m, is not a rounding convenience. It is exactly what makes the coverage guarantee hold for a finite calibration set of 50 weeks, not just in the limit as the calibration set grows huge.

=== step === concept
## Keeping the calibration split in time order
::prose-only the split is a rule about calendar order, not a shape to draw; the actual week ranges appear in the next step's code

That calibration block cannot be any 50 weeks picked at random out of the 220. It has to come after training, in calendar order, for the same reason any time series split has to respect calendar order: a model should never be judged, or calibrated, using data that happened before weeks it was allowed to learn from.

So here is Lumen's split. Weeks 1 to 120 train the model. Weeks 121 to 170, 50 weeks, calibrate it. Weeks 171 to 220, another 50 fresh weeks, are held back purely to judge the result at the end. That gives three blocks, each one strictly later in time than the one before it: training, then calibration, then evaluation.

=== step === concept
## Building both intervals in R

Time to build both half-widths for real and put them side by side.

```r
# Compute calibration residuals (weeks 121-170), then compare the two half-widths
cal <- lumen[121:170, ]
pred_cal <- unname(predict(fit, newdata = cal))
resid_cal <- abs(cal$units - pred_cal)

m <- nrow(cal)
k <- ceiling((m + 1) * 0.90)
k
#> [1] 46

q_conformal <- sort(resid_cal)[k]
round(c(max_resid = max(resid_cal), halfwidth_normal = halfwidth_normal, q_conformal = q_conformal), 2)
#>        max_resid halfwidth_normal      q_conformal 
#>            51.81            21.31            36.09 

sum(resid_cal > halfwidth_normal)
#> [1] 19
```

`cal` is the 50 calibration weeks, 121 through 170. `pred_cal` is what `fit`, trained only on weeks 1 to 120, forecasts for each of those weeks, and `resid_cal` is the absolute size of the miss on each one. `k` comes out to 46: `ceiling(51 * 0.90)` is `ceiling(45.9)`, which rounds up to 46, so the 46th-smallest absolute residual out of 50 is the number split-conformal uses.

That 46th-smallest residual, `q_conformal`, is 36.09. Compare the three numbers in that printed line. The single worst miss in calibration, 51.81, is already more than double the Normal-theory half-width, 21.31. And `sum(resid_cal > halfwidth_normal)` shows exactly how often that happens: 19 of the 50 calibration weeks, 38%, already have an absolute error bigger than 21.31, before a single evaluation week has even been looked at.

The conformal half-width, 36.09, is 69% wider than the Normal-theory interval's 21.31. That extra width is not carelessness in how the interval was built. It is exactly how big the calibration residuals actually needed to be to reach 90% coverage on Lumen's real, growing spread, instead of assuming a spread that stopped changing back around week 60.

=== step === widget
## Both bands against the evaluation weeks' real sales

Time to find out which interval actually holds up, on 50 weeks neither the model nor the calibration step has ever seen.

```r
# Compare both bands against the 50 evaluation weeks (171-220)
evalset <- lumen[171:220, ]
pred_eval <- unname(predict(fit, newdata = evalset))
abs_err_eval <- abs(evalset$units - pred_eval)

outside_normal <- evalset$week[abs_err_eval > halfwidth_normal]
outside_conformal <- evalset$week[abs_err_eval > q_conformal]

length(outside_normal)
#> [1] 17
length(outside_conformal)
#> [1] 5
outside_conformal
#> [1] 180 192 199 201 218
```

17 of the 50 evaluation weeks fall outside the Normal-theory band, forecast plus or minus 21.31. Only 5 fall outside the conformal band, forecast plus or minus 36.09, and the code names exactly which ones: weeks 180, 192, 199, 201 and 218.

The widget below works through the same split-conformal mechanics on its own small built-in example, a straight-line relationship rather than Lumen's sales, so you can watch a band move live instead of just reading numbers. Drag the target between 80%, 90% and 95% coverage, and watch two things move together: the band widens, and the share of points it actually catches climbs to match.

::widget conformal-bands {}

Set it to 90% and compare what you see against Lumen's own numbers above: a wider band than the Normal-theory one, in exchange for a coverage count that actually reaches 90%.

=== step === concept
## Checking which interval matched its stated coverage

```r
# Empirical coverage: fraction of evaluation weeks each band actually contains
normal_coverage <- mean(abs_err_eval <= halfwidth_normal)
conformal_coverage <- mean(abs_err_eval <= q_conformal)
round(c(normal_coverage = normal_coverage, conformal_coverage = conformal_coverage), 2)
#>    normal_coverage conformal_coverage 
#>               0.66               0.90 

round(c(normal_width = 2 * halfwidth_normal, conformal_width = 2 * q_conformal), 1)
#>    normal_width conformal_width 
#>            42.6            72.2 
```

The Normal-theory interval covers 33 of the 50 evaluation weeks, 66%, well under the 90% it was built for, a 24-point shortfall. The conformal interval covers 45 of the 50, 90%, exactly matching the 90% target. It does this with a wider band, 72.2 units total against 42.6, but that extra width is exactly what calibration showed was needed to reach 90% coverage on Lumen's real, growing spread.

This is not a lucky draw. Split-conformal prediction carries a real guarantee: over repeated calibration-and-evaluation splits drawn from the same underlying process, its coverage sits at or above the target. That guarantee rests on one condition, called exchangeability: the calibration weeks and the evaluation weeks have to come from the same underlying error behavior, so a residual drawn from one block is no different, in distribution, from a residual drawn from the other.

Lumen's spread happens to have leveled off at 22 by week 120, so weeks 121 to 170 and weeks 171 to 220 are both measuring that same, by-then-stable spread, and the guarantee holds: 45 out of 50. But if that spread had kept climbing past week 170 instead of leveling off, calibration would be measuring a smaller spread than evaluation actually has. Exchangeability would break, and conformal's own coverage could fall short of 90% too, for the same underlying reason the Normal-theory interval just did.

=== step === quiz
## Quick check: why the conformal band is wider

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A narrower interval is always better, no matter what coverage it actually reaches. ::no
- Conformal's point forecast is less accurate, and the wider band is just covering for that. ::no
- It reports the width the calibration weeks' own residuals actually needed to reach 90% coverage, not a guess based on an assumed Normal shape. ::ok Exactly. 36.09 is not a formula applied to one estimated number, sigma; it is the actual 46th-smallest absolute miss out of 50 real calibration weeks. It is wider because that is literally what those residuals needed.
- Conformal prediction always makes the interval some fixed multiple of the Normal-theory width, like 1.5 times wider. ::no None of the other three are right. The point forecast is identical either way, since both methods read it off the same fitted trend line; a narrower interval that misses its coverage target is not better, it is just wrong about how often it is wrong; and there is no fixed multiplier linking the two widths. Conformal's width comes straight from the calibration residuals themselves and could be a little wider or a lot wider depending on the data.

=== step === tryit
## Your turn: recompute the half-width for a 95% target

`resid_cal` still holds the 50 calibration residuals from Lumen's calibration weeks. The code below rebuilds the 90% conformal half-width from them. Change `target` to 0.95 and press Run to see how much further the half-width has to stretch to cover 95% of calibration weeks instead of 90%.

```r
# Edit target to 0.95 and see the half-width grow
m <- 50
target <- 0.90
k <- ceiling((m + 1) * target)
q_conformal_90 <- sort(resid_cal)[k]
round(q_conformal_90, 2)
```
::check {"regex": "target\\s*<-\\s*0\\.95", "gate": true, "difficulty": "intermediate", "ok": "Right: k becomes 49 and the quantile comes out to about 45.12, noticeably bigger than 36.09 at the 90% target. A higher target demands a wider net.", "no": "Change the target line to 0.95, keep the rest of the code the same, and press Run again: target <- 0.95."}
::solution
```r
# Recompute the conformal half-width at a 95% target instead of 90%
m <- 50
target <- 0.95
k <- ceiling((m + 1) * target)
q_conformal_95 <- sort(resid_cal)[k]
round(q_conformal_95, 2)
#> [1] 45.12
```

`k` jumps from 46 to 49. At the 90% target, only the 4 largest calibration residuals, positions 47 through 50, were allowed to sit above the half-width: 4 out of 50, 8%, close to the 10% miss rate a 90% interval is built to allow. At the 95% target, only the single largest residual is allowed above it: 1 out of 50, 2%, close to the 5% a 95% interval allows. Asking for a tighter miss rate always means paying for it with a wider half-width.

=== step === concept
## References

- [Distribution-Free Predictive Inference for Regression](https://doi.org/10.1080/01621459.2017.1307116) - Lei, J., G'Sell, M., Rinaldo, A., Tibshirani, R.J., Wasserman, L. (2018), Journal of the American Statistical Association. The paper that formalized split-conformal prediction for regression, including the finite-sample quantile correction used above.
- Vovk, V., Gammerman, A., Shafer, G. (2005). Algorithmic Learning in a Random World. Springer. The original book-length treatment of conformal prediction.
- Gibbs, I., Candes, E. (2021). "Adaptive Conformal Inference Under Distribution Shift." Advances in Neural Information Processing Systems (NeurIPS). Extends split-conformal prediction to series whose error spread keeps shifting, the exact failure case described above.
- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman, R.J., Athanasopoulos, G. The chapter on prediction intervals covers the Normal-theory interval used earlier.
- [conformalForecast](https://cran.r-project.org/package=conformalForecast) - an R package implementing split and other conformal methods for time series forecasts.

=== step === complete
## What you can do now

You built a Normal-theory 90% prediction interval and named the one assumption it rests on: one constant spread, 12.96, estimated once and applied to every future week. You then watched that assumption fail in Lumen's own data, where the weekly wobble around the trend grows from 5 units to 22 before leveling off.

From there you built a split-conformal interval instead: holding out 50 calibration weeks the model never trained on, scoring each one by its absolute residual, and taking the 46th-smallest of those 50 scores, 36.09, as the half-width. Checked against 50 fresh evaluation weeks, the Normal-theory interval covered only 66% against its stated 90%, while the conformal interval covered 45 of 50, landing right on target.

You can now build that interval yourself on a forecast of your own, and you know the one condition it depends on: calibration and evaluation have to be measuring the same underlying spread, or the guarantee can slip too.

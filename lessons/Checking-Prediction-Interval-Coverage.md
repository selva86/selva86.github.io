---
title: "The Expert Edge in Forecasting Like a Pro Lesson 7: Checking prediction interval coverage"
catalog_blurb: "Measure whether your prediction interval covers what it claims, and fix it."
description: "Run a rolling-origin backtest in R to measure a forecast's empirical coverage, diagnose why it misses its nominal level, and fix it by widening or refitting."
keywords: "prediction interval coverage, nominal coverage, empirical coverage, rolling-origin evaluation, calibration curve, heteroskedasticity in time series, fat-tailed forecast errors, parameter uncertainty, ETS model in R, forecast interval calibration"
post_type: "LESSON"
curriculum_id: "5.150.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "7"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: ""
course_prev: "Judgmental-Adjustments-and-Forecast-Governance.html"
---

=== step === cover
## Checking prediction interval coverage

Today let's work out whether a forecast's prediction interval actually delivers what its percentage claims.

Covewood Teas is a small online tea subscription seller. Here is how many new orders it picked up each week over the last 104 weeks, two full years.

::widget chart-plotter {"data":[{"x":1,"y":33},{"x":2,"y":27},{"x":3,"y":33},{"x":4,"y":32},{"x":5,"y":31},{"x":6,"y":23},{"x":7,"y":31},{"x":8,"y":31},{"x":9,"y":37},{"x":10,"y":35},{"x":11,"y":36},{"x":12,"y":35},{"x":13,"y":38},{"x":14,"y":39},{"x":15,"y":26},{"x":16,"y":49},{"x":17,"y":45},{"x":18,"y":44},{"x":19,"y":39},{"x":20,"y":48},{"x":21,"y":43},{"x":22,"y":44},{"x":23,"y":37},{"x":24,"y":56},{"x":25,"y":48},{"x":26,"y":61},{"x":27,"y":60},{"x":28,"y":50},{"x":29,"y":55},{"x":30,"y":63},{"x":31,"y":48},{"x":32,"y":54},{"x":33,"y":51},{"x":34,"y":56},{"x":35,"y":56},{"x":36,"y":64},{"x":37,"y":60},{"x":38,"y":50},{"x":39,"y":62},{"x":40,"y":51},{"x":41,"y":49},{"x":42,"y":66},{"x":43,"y":50},{"x":44,"y":63},{"x":45,"y":54},{"x":46,"y":74},{"x":47,"y":69},{"x":48,"y":60},{"x":49,"y":71},{"x":50,"y":69},{"x":51,"y":55},{"x":52,"y":65},{"x":53,"y":58},{"x":54,"y":72},{"x":55,"y":62},{"x":56,"y":67},{"x":57,"y":58},{"x":58,"y":61},{"x":59,"y":73},{"x":60,"y":62},{"x":61,"y":71},{"x":62,"y":75},{"x":63,"y":72},{"x":64,"y":72},{"x":65,"y":57},{"x":66,"y":73},{"x":67,"y":58},{"x":68,"y":90},{"x":69,"y":67},{"x":70,"y":81},{"x":71,"y":85},{"x":72,"y":80},{"x":73,"y":96},{"x":74,"y":72},{"x":75,"y":88},{"x":76,"y":72},{"x":77,"y":109},{"x":78,"y":93},{"x":79,"y":81},{"x":80,"y":95},{"x":81,"y":73},{"x":82,"y":106},{"x":83,"y":74},{"x":84,"y":69},{"x":85,"y":89},{"x":86,"y":101},{"x":87,"y":91},{"x":88,"y":82},{"x":89,"y":107},{"x":90,"y":124},{"x":91,"y":68},{"x":92,"y":114},{"x":93,"y":89},{"x":94,"y":109},{"x":95,"y":72},{"x":96,"y":94},{"x":97,"y":85},{"x":98,"y":92},{"x":99,"y":84},{"x":100,"y":105},{"x":101,"y":118},{"x":102,"y":94},{"x":103,"y":99},{"x":104,"y":87}],"geoms":["line"],"x":"week","y":"orders","code":{"line":"ggplot(covewood, aes(week, orders)) +\n  geom_line()"}}

Look at how tight those early week-to-week swings are, and how loose they get by the end. A forecasting model fit to a series like this will not just hand back one number for next week. It will also hand back a range, tagged with a confidence level such as 95%.

The question this whole lesson answers is this: does that range actually contain the real outcome 95% of the time, or is 95% just a label the model prints without anyone checking whether it holds up?

=== step === concept
## Defining nominal coverage

Let's fit a model to Covewood's history and see what it says about next week.

The model is ETS(A,A,N), the exponential smoothing model with additive error and additive trend and no seasonal part. Fit it to all 104 weeks, then forecast four weeks ahead.

```r
# Simulate Covewood's 104 weeks of orders, then fit ETS and forecast 4 weeks ahead
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(2026)
week <- 1:104
orders <- round(30 + 0.7 * week + rnorm(104, 0, 4 + 0.1 * week))
orders <- pmax(orders, 1)
dat <- tsibble(week = week, orders = orders, index = week)

fit_full <- dat |> model(ets = ETS(orders ~ error("A") + trend("A") + season("N")))
fc_full <- fit_full |> forecast(h = 4)

hilo_full <- fc_full |> hilo(level = c(80, 95))
forecast_table <- data.frame(
  week  = hilo_full$week,
  point = round(hilo_full$.mean, 1),
  lo80  = round(hilo_full$`80%`$lower, 1),
  hi80  = round(hilo_full$`80%`$upper, 1),
  lo95  = round(hilo_full$`95%`$lower, 1),
  hi95  = round(hilo_full$`95%`$upper, 1)
)
forecast_table
#>   week point lo80  hi80 lo95  hi95
#> 1  105 102.4 89.4 115.4 82.6 122.3
#> 2  106 103.1 90.1 116.1 83.3 123.0
#> 3  107 103.8 90.8 116.8 84.0 123.7
#> 4  108 104.5 91.5 117.5 84.7 124.4
```

Read the `point` column first. It climbs from 102.4 to 104.5, which just continues the climb you already saw in the series. The `lo80`/`hi80` and `lo95`/`hi95` columns are two separate claims wrapped around that same point forecast.

Take week 105. The model's 95% interval runs from 82.6 to 122.3. That 95 is called the interval's **nominal level**. Nominal here means "as stated" or "as claimed": it comes straight out of the model's own formula, built from how spread out the fitted model's past errors were, not from checking this particular interval against any real outcome yet.

So what does "95% nominal" actually mean? It states a long-run frequency: if you ran this exact forecast over and over, on data generated the same way, the real outcome should land inside the band 95 times out of 100. One forecast cannot test that claim on its own. You need to actually run it over and over, for real, and count.

=== step === concept
## Why checking coverage needs many forecasts, not one

Say week 105 comes in at 108 orders. That sits inside both the 80% and the 95% interval you just printed. Does that one hit prove the model's intervals are well calibrated?

It does not. A badly built interval will still hit sometimes, and a well built one will still miss sometimes. One outcome, hit or miss, carries almost no information about a stated rate like 95%.

To actually test the claim, you need to repeat the forecast many times and count how often it holds up. That count, as a fraction, is called **empirical coverage**: the share of many forecasts whose interval actually contained the real outcome.

The standard way to generate "many forecasts" from one historical series is a **rolling-origin evaluation**. Pick an **origin**, the last week of data the model is allowed to see. Train on everything up to the origin, then forecast a fixed number of weeks past it, called the **horizon**. Move the origin forward one week at a time, refitting the model each time on the expanding history, so every origin trains on more data than the last.

For Covewood, the plan is 41 origins, running from week 60 through week 100, each one forecasting 4 weeks ahead (the horizon). Here is that idea in miniature, run for just the first two origins.

```r
# A peek at the rolling-origin idea, run for just the first two origins (60 and 61)
peek_origins <- c(60, 61)
h <- 4

for (o in peek_origins) {
  train <- dat |> filter(week <= o)
  fit <- train |> model(ets = ETS(orders ~ error("A") + trend("A") + season("N")))
  fc <- fit |> forecast(h = h)
  hl95 <- fc |> hilo(level = 95)
  target_week <- o + h
  actual <- orders[target_week]
  row <- hl95 |> filter(week == target_week)
  hit <- actual >= row$`95%`$lower & actual <= row$`95%`$upper
  cat("origin", o, "-> forecasting week", target_week,
      "| actual:", actual, "| point:", round(row$.mean, 1),
      "| 95% interval: [", round(row$`95%`$lower, 1), ",", round(row$`95%`$upper, 1), "]",
      "| hit:", hit, "\n")
}
#> origin 60 -> forecasting week 64 | actual: 72 | point: 70.7 | 95% interval: [ 57.3 , 84.2 ] | hit: TRUE
#> origin 61 -> forecasting week 65 | actual: 57 | point: 71.6 | 95% interval: [ 58.2 , 84.9 ] | hit: FALSE
```

Origin 60 trains on weeks 1 to 60, then forecasts week 64 (that is origin plus the horizon of 4). The real value, 72, lands inside the interval: a hit. Origin 61 trains on one more week, forecasts week 65, and this time the real value of 57 falls below the interval's lower edge: a miss.

Two origins is not nearly enough to say anything about a 95% claim. Running all 41 is next.

=== step === concept
## The rolling-origin check, and what it finds

Scale the two-origin peek up to the full plan: all 41 origins, weeks 60 through 100, each one refitting ETS(A,A,N) and forecasting 4 weeks ahead. Check every forecast against three nominal levels at once: 50%, 80%, and 95%.

```r
# Run the rolling-origin loop: refit ETS at each of 41 origins, forecast 4 weeks ahead,
# and record whether the actual outcome landed inside the 50%, 80% and 95% intervals
origins <- 60:100
h <- 4
results <- data.frame()

for (o in origins) {
  train <- dat |> filter(week <= o)
  fit <- train |> model(ets = ETS(orders ~ error("A") + trend("A") + season("N")))
  fc <- fit |> forecast(h = h)
  hl <- fc |> hilo(level = c(50, 80, 95))
  target_week <- o + h
  actual <- orders[target_week]
  row <- hl |> filter(week == target_week)

  results <- rbind(results, data.frame(
    origin = o,
    actual = actual,
    point  = round(row$.mean, 1),
    hit50  = actual >= row$`50%`$lower & actual <= row$`50%`$upper,
    hit80  = actual >= row$`80%`$lower & actual <= row$`80%`$upper,
    hit95  = actual >= row$`95%`$lower & actual <= row$`95%`$upper
  ))
}

head(results, 6)
#>   origin actual point hit50 hit80 hit95
#> 1     60     72  70.7  TRUE  TRUE  TRUE
#> 2     61     57  71.6 FALSE FALSE FALSE
#> 3     62     73  73.1  TRUE  TRUE  TRUE
#> 4     63     58  74.2 FALSE FALSE FALSE
#> 5     64     90  74.8 FALSE FALSE FALSE
#> 6     65     67  73.2 FALSE  TRUE  TRUE

coverage_table <- data.frame(
  nominal_pct    = c(50, 80, 95),
  hits           = c(sum(results$hit50), sum(results$hit80), sum(results$hit95)),
  n              = nrow(results),
  empirical_pct  = round(c(mean(results$hit50), mean(results$hit80), mean(results$hit95)) * 100, 1)
)
coverage_table
#>   nominal_pct hits  n empirical_pct
#> 1          50   11 41          26.8
#> 2          80   18 41          43.9
#> 3          95   29 41          70.7
```

Read `coverage_table` straight down. The nominal 50% interval, the one that should hit about half the time, hit only 11 times out of 41: 26.8%. The nominal 80% interval hit 18 times: 43.9%. The nominal 95% interval, the widest and the one the business is most likely to trust, hit 29 times out of 41: 70.7%.

Every single one of those three numbers falls well short of what it claims. That is **under-coverage**, and it shows up at every nominal level checked, not just one. A model whose point forecasts track the trend just fine can still hand out intervals that, in the long run, do not contain what they promise.

=== step === concept
## The calibration curve: nominal against empirical

A table of three rows already makes the gap obvious, but a chart makes it impossible to miss. Plot the nominal level on one axis and the empirical coverage you just measured on the other, next to a straight reference line where nominal and empirical would be equal if the intervals were perfectly calibrated.

```r
# Line up the nominal level against the empirical coverage measured a moment ago
calib <- data.frame(
  nominal_pct    = coverage_table$nominal_pct,
  empirical_pct  = coverage_table$empirical_pct,
  gap            = round(coverage_table$nominal_pct - coverage_table$empirical_pct, 1)
)
calib
#>   nominal_pct empirical_pct  gap
#> 1          50          26.8 23.2
#> 2          80          43.9 36.1
#> 3          95          70.7 24.3
```

::widget chart-plotter {"data":[{"x":50,"y":26.8,"fill":"Empirical"},{"x":80,"y":43.9,"fill":"Empirical"},{"x":95,"y":70.7,"fill":"Empirical"},{"x":50,"y":50,"fill":"Perfect calibration"},{"x":80,"y":80,"fill":"Perfect calibration"},{"x":95,"y":95,"fill":"Perfect calibration"}],"geoms":["point","line"],"x":"nominal_pct","y":"empirical_pct","code":{"point":"ggplot(calib_plot, aes(nominal_pct, empirical_pct, color = fill)) +\n  geom_point()","line":"ggplot(calib_plot, aes(nominal_pct, empirical_pct, color = fill)) +\n  geom_line()"}}

The "Perfect calibration" line is the 45-degree reference: a model whose intervals were exactly right would put every point right on top of it. The "Empirical" line shows where Covewood's own intervals actually landed, and every one of its three points sits below the reference.

The gap is not the same size everywhere either. It runs 23.2 points at nominal 50%, widens to 36.1 points at nominal 80%, and comes back in a little to 24.3 points at nominal 95%. So the under-coverage is not a simple one-size problem that grows or shrinks neatly with the nominal level: it is real and sizeable at every level checked, and the next few steps work out why.

=== step === concept
## A good fit does not mean good coverage

Here is a question worth sitting with for a moment: if the ETS model's fit looked fine on an ordinary check, how could its intervals be this far off?

Nothing about Covewood's ETS fit looks unusual by an ordinary fit check. The point forecasts climb right along with the trend, and there is no telltale pattern jumping out of the residuals that would normally make you suspect the model. A fit statistic and an interval's coverage are simply answering two different questions, and one can look perfectly healthy while the other is quietly broken.

The widget below makes that split visible with its own repeated-simulation example: not Covewood's data, but a confidence interval on a regression coefficient (the slope) computed across many simulated studies.

::widget assumption-dial {"assumption":"heteroskedasticity"}

Drag the severity dial from no violation up to severe. Watch the share of simulated studies whose 95% interval actually contains the true slope, the coverage, fall as the dial moves up, while each study's R-squared, how well the fitted line matches its own data, barely moves at all.

That is the exact same decoupling you already found in Covewood's own numbers: the forecasts look fine, and the intervals do not hold up. The next three steps work out why, one cause at a time.

=== step === concept
## Cause one: a variance that moves

The first cause is sitting right there in the series you plotted back in the cover step: the week-to-week swings were tight early on and loose by the end. Measure that directly in the residuals of the full-sample model you already fit.

```r
# Pull the full-sample model's residuals and compare their spread in the first and second half
resid_full <- augment(fit_full)$.resid
spread_by_half <- round(c(weeks_1_52 = sd(resid_full[1:52]), weeks_53_104 = sd(resid_full[53:104])), 1)
spread_by_half
#>   weeks_1_52 weeks_53_104 
#>          6.4         12.6 
```

The residual spread very nearly doubles, from 6.4 in the first 52 weeks to 12.6 in the last 52. A spread that is not constant over time has a name: **heteroskedasticity**. ETS(A,A,N) fits one single error spread for the whole series, so the interval it builds has to be a compromise: too wide for the calm first half, too narrow for the volatile second half.

The widget below shows the same fan-out shape using its own example, income against years of experience, instead of Covewood's own data. Years of experience stands in for Covewood's week number, and income stands in for its weekly orders: both grow, and both get noisier as they grow.

::widget quantile-lines {}

Toggle between the 10th percentile, the median, and the 90th percentile line. They fan apart as years of experience rises, because the spread of income grows right along with it, exactly like the 6.4-to-12.6 split you just measured. A single line, or a single constant-width band, can never show that the spread itself is changing.

=== step === quiz
## Quick check: fit, coverage, and what moved

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The point forecasts must be biased, since the forecast errors are growing in size. ::no
- As long as the ETS fit statistic stays stable, the interval is still well calibrated. ::no
- The error spread is not constant: it roughly doubles from the first half of the series to the second half, so one constant-width interval cannot fit both halves at once. ::ok Exactly. That is heteroskedasticity: a 95% interval built from one fixed spread sits too wide for the calm first half and too narrow for the volatile second half, which is exactly the kind of mismatch that drags empirical coverage below what the interval claims.
- The model needs twice as much training data, because the residual spread doubled. ::no None of these follow from a doubling residual spread. The point forecasts can still track the trend well, so there is no bias, and a fit statistic like R-squared does not move much either, because a growing error spread changes the model's required width, not its average accuracy. The real story is heteroskedasticity: the error spread is not constant, so one constant-width interval cannot fit both halves of the series.

=== step === concept
## Cause two: fat tails

The second cause has nothing to do with Covewood's growing spread. To isolate it cleanly, build a separate, simpler example where the true mean and the true spread are both known exactly: mean 50, spread 10, no estimation involved at all.

Draw from a Normal distribution with that mean and spread, and separately from a t-distribution with 3 degrees of freedom, scaled to have the exact same mean and spread. A t-distribution with few degrees of freedom has **fat tails**: values far from the centre turn up more often than a Normal distribution would produce, even once both are scaled to match on spread alone.

```r
# Compare coverage under a Normal error and a heavier-tailed t(3) error with the same mean and spread
set.seed(2026)
n_draws <- 100000
true_mean <- 50
true_sd <- 10
normal_draws <- rnorm(n_draws, true_mean, true_sd)
t_raw <- rt(n_draws, df = 3)
t_scaled <- true_mean + (t_raw / sd(t_raw)) * true_sd

coverage_at <- function(draws, level) {
  alpha <- 1 - level / 100
  lo <- qnorm(alpha / 2, true_mean, true_sd)
  hi <- qnorm(1 - alpha / 2, true_mean, true_sd)
  mean(draws >= lo & draws <= hi) * 100
}
tails_table <- data.frame(
  nominal_pct = c(80, 90, 99),
  normal_pct  = round(sapply(c(80, 90, 99), coverage_at, draws = normal_draws), 1),
  t3_pct      = round(sapply(c(80, 90, 99), coverage_at, draws = t_scaled), 1)
)
tails_table
#>   nominal_pct normal_pct t3_pct
#> 1          80       79.9   88.8
#> 2          90       90.0   93.6
#> 3          99       99.0   97.9
```

Each interval here is built from the Normal distribution's own formula, so under `normal_draws` the empirical coverage lands right on the nominal level at every row, exactly as it should. The `t3_pct` column tells a more interesting story. At nominal 80% and 90%, the t(3) draws actually cover **more** often than claimed, 88.8% and 93.6% against 79.9% and 90.0%. But at nominal 99%, the pattern flips: t(3) covers only 97.9%, falling short of the 99.0% it should match.

Here is why the direction flips. A t-distribution scaled to match a Normal's spread is more peaked near its centre, not just heavier in its tails, because the extra variance a fat tail adds has to be balanced somewhere if the overall spread is held fixed. That peakedness pulls in extra coverage at the merely-wide 80% and 90% levels.

Only out at the very deepest level, 99%, do the genuinely fat tails win out and push real coverage below the nominal claim. So the shape of the error distribution, not only its spread, changes coverage, and the damage from fat tails concentrates specifically at the deepest nominal levels, the ones you would trust most to flag a truly rare outcome.

=== step === concept
## Cause three: a parameter treated as known

The third cause is about how much data went into estimating the model in the first place. Split the 41 rolling-origin windows you already ran into an early half and a late half, and compare their nominal 95% empirical coverage.

```r
# Split the 41 rolling-origin windows into an early half and a late half, both at nominal 95%
early <- results |> filter(origin >= 60, origin <= 80)
late  <- results |> filter(origin >= 81, origin <= 100)
window_split <- data.frame(
  window          = c("early (origins 60-80)", "late (origins 81-100)"),
  n               = c(nrow(early), nrow(late)),
  hits            = c(sum(early$hit95), sum(late$hit95)),
  empirical_95pct = round(c(mean(early$hit95), mean(late$hit95)) * 100, 1)
)
window_split
#>                  window  n hits empirical_95pct
#> 1 early (origins 60-80) 21   13            61.9
#> 2 late (origins 81-100) 20   16            80.0
```

The early windows, origins 60 through 80, trained on as few as 60 weeks of history and hit the nominal 95% mark only 61.9% of the time. The late windows, origins 81 through 100, trained on up to 100 weeks and climbed to 80.0%. Same model, same formula, same nominal level: the only thing that changed is how much history each origin had to learn from.

ETS's interval formula plugs in the estimated trend and estimated error spread as if they were the exact, true values, not estimates with their own uncertainty attached. That gap between "estimated" and "exactly known" is called **parameter uncertainty**, and it matters more the less data you have to estimate from. With only 60 training weeks, the early windows are estimating a climbing trend and a growing spread from a fairly thin slice of history, so the formula understates how wrong those estimates could be.

One honest caveat: the still-growing variance from cause one has not gone away by origin 100 either, so some of this early-versus-late gap is heteroskedasticity doing its work too. The two causes overlap here rather than cleanly separating, which is normal for real data.

=== step === concept
## Widening the interval or fixing the model

Three causes, one shared symptom: the 95% interval only delivered 70.7% coverage. There are two honest ways to respond, and they are not the same kind of fix.

The quick fix widens the existing interval using a scale factor taken straight from the data you already have. Take the 95th percentile of the absolute errors the 41-origin loop already produced, and divide it by the average 95% half-width (the distance from the point forecast out to one edge) that ETS(A,A,N) already outputs. That half-width is not in `results` yet, so the loop needs to run once more, this time keeping each origin's 95% upper edge too.

```r
# Rerun the 41-origin loop, this time keeping each origin's 95% upper edge as well
origins <- 60:100
h <- 4
results <- data.frame()
for (o in origins) {
  train <- dat |> filter(week <= o)
  fit <- train |> model(ets = ETS(orders ~ error("A") + trend("A") + season("N")))
  fc <- fit |> forecast(h = h)
  hl <- fc |> hilo(level = c(50, 80, 95))
  target_week <- o + h
  actual <- orders[target_week]
  row <- hl |> filter(week == target_week)
  results <- rbind(results, data.frame(
    origin = o, actual = actual, point = round(row$.mean, 1),
    hit50 = actual >= row$`50%`$lower & actual <= row$`50%`$upper,
    hit80 = actual >= row$`80%`$lower & actual <= row$`80%`$upper,
    hit95 = actual >= row$`95%`$lower & actual <= row$`95%`$upper,
    hi95  = row$`95%`$upper
  ))
}

abs_err <- abs(results$actual - results$point)
half_width_95 <- results$hi95 - results$point
scale_factor <- round(as.numeric(quantile(abs_err, 0.95)) / mean(half_width_95), 2)
scale_factor
#> [1] 1.58

results$lo95_scaled <- results$point - scale_factor * half_width_95
results$hi95_scaled <- results$point + scale_factor * half_width_95
results$hit95_scaled <- results$actual >= results$lo95_scaled & results$actual <= results$hi95_scaled
round(mean(results$hit95_scaled) * 100, 1)
#> [1] 92.7
```

Multiplying every half-width by 1.58 lifts the nominal 95% empirical coverage from 70.7% to 92.7%, a real improvement. But that scale factor was calibrated on the very same 41 origins it was just tested on, so part of that 92.7% is the fix fitting its own test. It is fast, and it is worth doing when you need an answer today, but it patches this one dataset rather than fixing what produced the gap.

The real fix goes after the mechanism instead. Refit with a multiplicative-error ETS(M,A,N), where the model's innovation spread scales with the level of the series rather than staying fixed, which is a direct match for a series whose spread visibly grows as its level grows.

```r
# Refit at every origin with a multiplicative-error model and rerun the same 41-origin check
results_m <- data.frame()
for (o in origins) {
  train <- dat |> filter(week <= o)
  fit_m <- train |> model(ets = ETS(orders ~ error("M") + trend("A") + season("N")))
  fc_m <- fit_m |> forecast(h = h)
  hl_m <- fc_m |> hilo(level = c(80, 95))
  target_week <- o + h
  actual <- orders[target_week]
  row <- hl_m |> filter(week == target_week)
  results_m <- rbind(results_m, data.frame(
    origin = o,
    hit80 = actual >= row$`80%`$lower & actual <= row$`80%`$upper,
    hit95 = actual >= row$`95%`$lower & actual <= row$`95%`$upper
  ))
}

fix_comparison <- data.frame(
  fix            = c("original ETS(A,A,N)", "scaled interval (x1.58)", "refit ETS(M,A,N)"),
  nominal_95_pct = round(c(mean(results$hit95), mean(results$hit95_scaled), mean(results_m$hit95)) * 100, 1)
)
fix_comparison
#>                       fix nominal_95_pct
#> 1     original ETS(A,A,N)           70.7
#> 2 scaled interval (x1.58)           92.7
#> 3        refit ETS(M,A,N)           90.2
```

The refit reaches 90.2% nominal 95% coverage, close to the scaled fix's 92.7%, but this time by changing how the model generates its intervals in the first place rather than by stretching them after the fact. The nominal 80% coverage under the refit model lands at 70.7%, still short of 80 but a real improvement over the original 43.9%.

So the honest tradeoff is this. The quick fix is faster, and it only patches the data it was tuned on. The real fix costs a refit, but it addresses the mechanism that produced the gap, and the improvement it buys is more likely to hold up on data it has not already seen.

=== step === quiz
## Quick check: naming the cause from the evidence

A colleague on another team brings you a different forecasting model. Its residual spread is flat across the whole training history, no doubling like Covewood's. Its rolling-origin windows are also long, several hundred points each, far more than Covewood's 60-to-100. But its nominal 99% interval only delivers about 96% empirical coverage, while its nominal 80% interval lands almost exactly on 80%.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- A variance that moves: the residual spread is not constant over time. ::no
- A parameter treated as known: the training window is too short to estimate the trend and spread reliably. ::no
- Fat tails: the error distribution is heavier-tailed than Normal, so coverage sags specifically at the deepest nominal levels tested. ::ok Right. A flat residual spread rules out heteroskedasticity, and training windows of several hundred points rule out serious parameter uncertainty. What is left is the shape of the error distribution: a heavier-than-Normal tail can track the nominal level closely through the middle of the distribution and still fall short specifically out at the extreme, which is exactly the 99%-only symptom described here.
- The point forecasts are biased low, so the interval is centred on the wrong number. ::no The spread was stated to be flat across the whole history, which rules out heteroskedasticity, and the training windows were stated to be long, which rules out serious parameter uncertainty. Nothing here points to the point forecasts being off-centre either. What is left is the shape of the error distribution: fat tails that only show their damage at the deepest nominal levels, exactly the 99%-only symptom described.

=== step === tryit
## Your turn: compute coverage and pick the fix

Suppose a colleague hands you the hit-or-miss record from 10 rolling-origin windows, each one checked against a nominal 90% interval.

```r
# hits holds TRUE/FALSE for 10 rolling-origin windows, each checked at a nominal 90% interval
hits <- c(TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE)

# Compute the empirical coverage: the share of TRUE values in hits.
# One line. Press Check when you have it.
```
::check {"regex": "mean[(]hits[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.7, or 70%, against a nominal 90%. A 20-point gap on an interval that claims to be right 9 times out of 10 is large enough to act on, the same size of gap Covewood's own 95% interval showed before it was fixed.", "no": "Count the share of TRUE values in hits with one line: mean(hits)."}
::solution
```r
# Compute empirical coverage as the share of TRUE values in hits
mean(hits)
#> [1] 0.7
```

70% empirical coverage against a 90% nominal claim is a 20-point gap. That is too large to blame on just having 10 windows instead of 41, and it is the same kind of gap this lesson has already shown how to close: scale the interval for a fast patch, or go back and ask which of the three causes, a moving variance, fat tails, or too little training data, actually produced it, and fix that instead.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman, R.J. & Athanasopoulos, G., OTexts. The chapters on prediction intervals and on ETS state space models.
- Christoffersen, P.F. (1998). "Evaluating Interval Forecasts." *International Economic Review*, 39(4), 841-862.
- Gneiting, T., Balabdaoui, F., & Raftery, A.E. (2007). "Probabilistic Forecasts, Calibration and Sharpness." *Journal of the Royal Statistical Society: Series B*, 69(2), 243-268.
- [hilo()](https://rdrr.io/cran/fabletools/man/hilo.html) - the fabletools documentation for pulling the lower and upper interval bounds out of a fitted forecast, used throughout this lesson's rolling-origin loop.
- [ETS()](https://rdrr.io/cran/fable/man/ETS.html) - the fable documentation for the exponential smoothing model family, including the error/trend/season specification used for Covewood's model.

=== step === complete
## What you can check now

Covewood's own numbers carried this whole lesson. A 95% interval that should have been right 95 times out of 100 was only right 70.7% of the time, 29 out of 41. The quick fix, scaling every half-width by 1.58, lifted that to 92.7%, calibrated on the same data it was tested against. The real fix, refitting with a multiplicative-error ETS(M,A,N) so the model's own innovation spread grows with the level, reached 90.2% by changing the mechanism instead of patching around it.

You can now run that same rolling-origin check on any interval a model hands you: refit at each origin, forecast ahead, count the hits, and compare the empirical rate against the nominal claim. And when the two numbers disagree, you have three places to look: a variance that moves, a tail that is fatter than Normal, or a parameter the formula is treating as known when it was only ever estimated.

A prediction interval's percentage is a claim, not a fact. Now you know how to test whether it holds up.

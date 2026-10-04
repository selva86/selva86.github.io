---
title: "Production Forecasting Lesson 1: Choosing how often to refit a forecast model"
catalog_blurb: "How to set a refit cadence from measured drift, not habit."
description: "Simulate a forecast refit too often, too rarely, and on a fixed schedule, then derive a numeric refit trigger from the model's own noise, not the calendar."
keywords: "model retraining, refit cadence, retraining trigger, forecast monitoring, concept drift, trailing moving average, mean absolute error, production forecasting, R"
post_type: "LESSON"
curriculum_id: "5.160.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-production"
course_title: "Production Forecasting"
course_lesson: "1"
course_total: "6"
course_landing: "Production-Forecasting-Course.html"
course_next: "Monitoring-Forecast-Accuracy-Over-Time.html"
course_prev: ""
---

=== step === cover
## Choosing how often to refit a forecast model

Today let's understand how often a forecast model should be refit, and what goes wrong on either side of the right answer.

Highgate Paper Co. is a wholesale paper products supplier. Its retail stationery customers place orders every week, and Highgate forecasts next week's order volume to plan production and shipping. Here are its last 100 weeks of orders, in cases a week. For the first 60 weeks, demand holds steady around 300 cases. Then, at week 61, a regional retail chain starts placing standing weekly orders, and the level steps up to 390 cases and stays there.

::widget chart-plotter {"data":[{"x":1,"y":313},{"x":2,"y":297},{"x":3,"y":307},{"x":4,"y":306},{"x":5,"y":286},{"x":6,"y":294},{"x":7,"y":307},{"x":8,"y":287},{"x":9,"y":294},{"x":10,"y":305},{"x":11,"y":286},{"x":12,"y":288},{"x":13,"y":303},{"x":14,"y":304},{"x":15,"y":313},{"x":16,"y":294},{"x":17,"y":314},{"x":18,"y":295},{"x":19,"y":308},{"x":20,"y":285},{"x":21,"y":310},{"x":22,"y":289},{"x":23,"y":312},{"x":24,"y":311},{"x":25,"y":293},{"x":26,"y":291},{"x":27,"y":314},{"x":28,"y":301},{"x":29,"y":312},{"x":30,"y":308},{"x":31,"y":297},{"x":32,"y":297},{"x":33,"y":292},{"x":34,"y":286},{"x":35,"y":293},{"x":36,"y":290},{"x":37,"y":308},{"x":38,"y":314},{"x":39,"y":304},{"x":40,"y":310},{"x":41,"y":306},{"x":42,"y":313},{"x":43,"y":298},{"x":44,"y":291},{"x":45,"y":310},{"x":46,"y":307},{"x":47,"y":302},{"x":48,"y":288},{"x":49,"y":294},{"x":50,"y":285},{"x":51,"y":308},{"x":52,"y":308},{"x":53,"y":300},{"x":54,"y":301},{"x":55,"y":285},{"x":56,"y":292},{"x":57,"y":290},{"x":58,"y":307},{"x":59,"y":301},{"x":60,"y":287},{"x":61,"y":375},{"x":62,"y":395},{"x":63,"y":375},{"x":64,"y":397},{"x":65,"y":384},{"x":66,"y":393},{"x":67,"y":393},{"x":68,"y":389},{"x":69,"y":395},{"x":70,"y":395},{"x":71,"y":376},{"x":72,"y":381},{"x":73,"y":387},{"x":74,"y":402},{"x":75,"y":383},{"x":76,"y":402},{"x":77,"y":389},{"x":78,"y":378},{"x":79,"y":377},{"x":80,"y":375},{"x":81,"y":385},{"x":82,"y":376},{"x":83,"y":383},{"x":84,"y":381},{"x":85,"y":396},{"x":86,"y":399},{"x":87,"y":399},{"x":88,"y":393},{"x":89,"y":403},{"x":90,"y":404},{"x":91,"y":383},{"x":92,"y":385},{"x":93,"y":396},{"x":94,"y":378},{"x":95,"y":400},{"x":96,"y":398},{"x":97,"y":403},{"x":98,"y":391},{"x":99,"y":389},{"x":100,"y":384}],"geoms":["line"],"x":"week","y":"orders","code":{"line":"ggplot(highgate, aes(week, orders)) +\n  geom_line()"}}

Highgate's forecast comes from a model, and like any forecasting model, it has to be refit now and then: re-estimated on the latest orders. Refit it too often, and you risk chasing noise instead of a real pattern. Refit it too rarely, and you risk missing that the level actually moved, the way it does at week 61 above. This lesson works out, from Highgate's own 100 weeks, how often is actually often enough.

=== step === concept
## The two ways a refit schedule goes wrong
::prose-only the numbers arrive from step 3 onward; this step only names the two failure modes

Refit means re-estimating a forecasting model's parameters on new data. For Highgate's order forecasts, that means recomputing whatever the model uses to predict next week's orders, using the most recent weeks of actual orders.

A refit schedule can fail two different ways. Refit too often, and ordinary week-to-week noise pushes the forecast around, even on weeks when nothing about the real level of demand has changed. Refit too rarely, and the forecast keeps repeating an old level long after the real level has moved, the way Highgate's does at week 61.

Both failures cost real forecast accuracy, and the cost can be measured directly in Highgate's own numbers.

=== step === concept
## A model that refits every week

Start with the model Highgate actually uses: the trailing 8-week average. Each week, it looks back over the last 8 weeks of orders, averages them, and uses that average as the forecast for the next week. Refitting this model just means recomputing that average once a new week of orders comes in.

Build the full 100-week series from the same fixed formula every time, then compute the trailing 8-week average for every week it can be computed, week 8 onward.

```r
# Build Highgate's 100-week order series and the trailing 8-week average
seed <- 7
noise <- numeric(100)
for (i in 1:100) {
  seed <- (seed * 48271) %% 2147483647
  noise[i] <- (seed %% 31) - 15
}
base_level <- c(rep(300, 60), rep(390, 40))
orders <- base_level + noise

roll <- rep(NA, 100)
for (t in 8:100) {
  roll[t] <- mean(orders[(t - 7):t])
}

forecast_55_61 <- round(roll[55:61], 2)
names(forecast_55_61) <- 55:61
forecast_55_61
#>     55     56     57     58     59     60     61 
#> 296.12 296.62 296.12 298.88 298.00 295.38 304.75 
```

Look at weeks 55 through 61. For most of those weeks the forecast sits in the 295 to 299 range, close to the true pre-shift level of 300. By week 61, the first post-shift week, it has barely moved, 304.75, because the 8-week window behind it, weeks 54 through 61, still mostly holds pre-shift orders. The forecast looks accurate here, but only because nothing has changed yet as far as it can tell.

=== step === concept
## How much weekly refitting moves when nothing has changed

Weekly refitting sounds safe: new data in, forecast updated, repeat. But even across the 39 weeks from 22 to 60, where the true level of demand never moves from 300, the trailing average itself keeps moving a little every week. That happens because it is built from 8 noisy weeks, and no 8-week window of noisy orders averages to exactly the same number as the window before it.

Measure that week-to-week movement directly, over weeks 22 to 60.

```r
# How much the weekly-refit forecast moves, week to week, over the stable weeks 22-60
change_stable <- diff(roll[21:60])
round(c(max = max(abs(change_stable)), mean = mean(abs(change_stable))), 2)
#>  max mean 
#>  3.5  1.4 
```

The forecast never moves by more than 3.5 cases from one week to the next in this stretch, and it moves by 1.4 cases on average. That is the cost of refitting every week: even with nothing really changing, the forecast still wobbles by a case or two, purely from which 8 weeks of noise happen to sit in the window. Call this the noise floor. Every refit schedule has to live with some version of it.

=== step === concept
## A model that is never refit again

Now go to the opposite extreme. Fit the trailing average once, on weeks 45 through 60, and then freeze it: never recompute it again, no matter what orders come in afterward.

To compare the frozen model against weekly refitting, measure each one's mean absolute error: for each week in the stretch being scored, take the forecast's miss from the actual orders, drop its sign so a miss of 10 counts the same whether it was too high or too low, then average those misses. The result stays in cases a week, the same unit as the orders themselves.

```r
# Fit the trailing average once on weeks 45-60, then compare weekly refitting against freezing it
frozen_level <- mean(orders[45:60])
mae <- function(actual, forecast) mean(abs(actual - forecast))
weekly_mae <- mae(orders[61:100], roll[60:99])
frozen_mae <- mae(orders[61:100], frozen_level)
round(c(frozen_level = frozen_level, weekly_mae = weekly_mae, frozen_mae = frozen_mae), 2)
#> frozen_level   weekly_mae   frozen_mae 
#>       297.81        17.53        91.36 
```

The frozen forecast is 297.81 cases, a perfectly reasonable number for the stable weeks it was fit on. See what that fixed number costs against weekly refitting over weeks 61 to 100, the 40 weeks after the real step to 390.

::widget chart-plotter {"data":[{"x":45,"y":310,"fill":"Actual"},{"x":46,"y":307,"fill":"Actual"},{"x":47,"y":302,"fill":"Actual"},{"x":48,"y":288,"fill":"Actual"},{"x":49,"y":294,"fill":"Actual"},{"x":50,"y":285,"fill":"Actual"},{"x":51,"y":308,"fill":"Actual"},{"x":52,"y":308,"fill":"Actual"},{"x":53,"y":300,"fill":"Actual"},{"x":54,"y":301,"fill":"Actual"},{"x":55,"y":285,"fill":"Actual"},{"x":56,"y":292,"fill":"Actual"},{"x":57,"y":290,"fill":"Actual"},{"x":58,"y":307,"fill":"Actual"},{"x":59,"y":301,"fill":"Actual"},{"x":60,"y":287,"fill":"Actual"},{"x":61,"y":375,"fill":"Actual"},{"x":62,"y":395,"fill":"Actual"},{"x":63,"y":375,"fill":"Actual"},{"x":64,"y":397,"fill":"Actual"},{"x":65,"y":384,"fill":"Actual"},{"x":66,"y":393,"fill":"Actual"},{"x":67,"y":393,"fill":"Actual"},{"x":68,"y":389,"fill":"Actual"},{"x":69,"y":395,"fill":"Actual"},{"x":70,"y":395,"fill":"Actual"},{"x":71,"y":376,"fill":"Actual"},{"x":72,"y":381,"fill":"Actual"},{"x":73,"y":387,"fill":"Actual"},{"x":74,"y":402,"fill":"Actual"},{"x":75,"y":383,"fill":"Actual"},{"x":76,"y":402,"fill":"Actual"},{"x":77,"y":389,"fill":"Actual"},{"x":78,"y":378,"fill":"Actual"},{"x":79,"y":377,"fill":"Actual"},{"x":80,"y":375,"fill":"Actual"},{"x":81,"y":385,"fill":"Actual"},{"x":82,"y":376,"fill":"Actual"},{"x":83,"y":383,"fill":"Actual"},{"x":84,"y":381,"fill":"Actual"},{"x":85,"y":396,"fill":"Actual"},{"x":86,"y":399,"fill":"Actual"},{"x":87,"y":399,"fill":"Actual"},{"x":88,"y":393,"fill":"Actual"},{"x":89,"y":403,"fill":"Actual"},{"x":90,"y":404,"fill":"Actual"},{"x":91,"y":383,"fill":"Actual"},{"x":92,"y":385,"fill":"Actual"},{"x":93,"y":396,"fill":"Actual"},{"x":94,"y":378,"fill":"Actual"},{"x":95,"y":400,"fill":"Actual"},{"x":96,"y":398,"fill":"Actual"},{"x":97,"y":403,"fill":"Actual"},{"x":98,"y":391,"fill":"Actual"},{"x":99,"y":389,"fill":"Actual"},{"x":100,"y":384,"fill":"Actual"},{"x":61,"y":297.81,"fill":"Frozen forecast"},{"x":62,"y":297.81,"fill":"Frozen forecast"},{"x":63,"y":297.81,"fill":"Frozen forecast"},{"x":64,"y":297.81,"fill":"Frozen forecast"},{"x":65,"y":297.81,"fill":"Frozen forecast"},{"x":66,"y":297.81,"fill":"Frozen forecast"},{"x":67,"y":297.81,"fill":"Frozen forecast"},{"x":68,"y":297.81,"fill":"Frozen forecast"},{"x":69,"y":297.81,"fill":"Frozen forecast"},{"x":70,"y":297.81,"fill":"Frozen forecast"},{"x":71,"y":297.81,"fill":"Frozen forecast"},{"x":72,"y":297.81,"fill":"Frozen forecast"},{"x":73,"y":297.81,"fill":"Frozen forecast"},{"x":74,"y":297.81,"fill":"Frozen forecast"},{"x":75,"y":297.81,"fill":"Frozen forecast"},{"x":76,"y":297.81,"fill":"Frozen forecast"},{"x":77,"y":297.81,"fill":"Frozen forecast"},{"x":78,"y":297.81,"fill":"Frozen forecast"},{"x":79,"y":297.81,"fill":"Frozen forecast"},{"x":80,"y":297.81,"fill":"Frozen forecast"},{"x":81,"y":297.81,"fill":"Frozen forecast"},{"x":82,"y":297.81,"fill":"Frozen forecast"},{"x":83,"y":297.81,"fill":"Frozen forecast"},{"x":84,"y":297.81,"fill":"Frozen forecast"},{"x":85,"y":297.81,"fill":"Frozen forecast"},{"x":86,"y":297.81,"fill":"Frozen forecast"},{"x":87,"y":297.81,"fill":"Frozen forecast"},{"x":88,"y":297.81,"fill":"Frozen forecast"},{"x":89,"y":297.81,"fill":"Frozen forecast"},{"x":90,"y":297.81,"fill":"Frozen forecast"},{"x":91,"y":297.81,"fill":"Frozen forecast"},{"x":92,"y":297.81,"fill":"Frozen forecast"},{"x":93,"y":297.81,"fill":"Frozen forecast"},{"x":94,"y":297.81,"fill":"Frozen forecast"},{"x":95,"y":297.81,"fill":"Frozen forecast"},{"x":96,"y":297.81,"fill":"Frozen forecast"},{"x":97,"y":297.81,"fill":"Frozen forecast"},{"x":98,"y":297.81,"fill":"Frozen forecast"},{"x":99,"y":297.81,"fill":"Frozen forecast"},{"x":100,"y":297.81,"fill":"Frozen forecast"}],"geoms":["line"],"x":"week","y":"orders","code":{"line":"ggplot(highgate_45_100, aes(week, orders, color = series)) +\n  geom_line()"}}

Weekly refitting's mean absolute error over those 40 weeks is 17.53 cases. The frozen model's is 91.36, more than 5 times worse. The frozen forecast has no way to reflect that the chain started ordering at week 61, so it just keeps repeating 297.81 forever, while actual orders sit near 390. The gap between the flat line and the real data in the chart above is the entire cost of never refitting again.

=== step === quiz
## Quick check: the two failure modes

Weekly refitting moved the forecast by at most 3.5 cases during the 39 weeks when nothing changed, and cost a mean absolute error of 17.53 over the 40 weeks after the real step. The frozen model never moved at all, and cost 91.36 over that same stretch. What does this pair of numbers actually show?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Weekly refitting pays a small, steady noise cost in exchange for catching the real change at week 61 quickly, while freezing the model avoids that noise cost but misses the real change entirely. ::ok Exactly. The 3.5-case noise floor from refitting every week is a small price next to the 91.36 error of never refitting again. Each schedule has a real cost; they are just costs of very different sizes.
- The model needs more historical data before it can be trusted, so neither schedule is reliable yet. ::no
- Refitting every week is always the wrong choice since it reacts to noise. ::no
- Freezing the model is the safer choice, since 91.36 is still a finite error and the forecast never moves unpredictably. ::no Freezing is not safer here: 91.36 is more than 5 times weekly refitting's 17.53, and the "unpredictability" of weekly refitting tops out at 3.5 cases a week. "Refitting every week is always wrong" does not hold either, since in this comparison it clearly wins on accuracy; the real question is not every-week against never, but what cadence sits between them.

=== step === concept
## A fixed, in-between schedule is still a guess

Both extremes have now been measured: refit every week, or never again. A compromise seems obvious. Refit every 8 weeks instead, using the trailing average computed at that moment, and hold that number fixed until the next scheduled refit.

```r
# Refit every 8 weeks, holding each refit's level fixed for the following 8 weeks
fixed8 <- rep(NA, 100)
refit_points <- seq(8, 96, by = 8)
for (t in refit_points) {
  level <- roll[t]
  for (w in (t + 1):min(t + 8, 100)) fixed8[w] <- level
}
fixed8_mae <- mae(orders[61:100], fixed8[61:100])
fixed8_mae_first8 <- mae(orders[61:68], fixed8[61:68])
round(c(fixed8_mae = fixed8_mae, fixed8_mae_first8 = fixed8_mae_first8), 2)
#>        fixed8_mae fixed8_mae_first8 
#>             24.22             68.88 
```

::widget styled-table {"cols":["Refit schedule","MAE, weeks 61-100"],"rows":[["Every week","17.53"],["Every 8 weeks","24.22"],["Never again","91.36"]],"title":"Three fixed schedules, one series","note":"Mean absolute error in cases a week, weeks 61-100 only."}

24.22 lands between weekly refitting's 17.53 and freezing's 91.36, which looks like a reasonable middle ground, until you see where that error actually comes from. The first 8 weeks right after the shift alone cost a mean absolute error of 68.88, almost as bad as freezing completely. That is the lag built into any fixed schedule: whatever just changed has to wait out the rest of the current 8-week block before the next scheduled refit even looks at it. A fixed interval cannot tell a quiet week apart from the one week that actually matters.

=== step === concept
## How to tell a real change from noise

The trailing average's own week-to-week change stays under 3.5 cases through the 39 stable weeks from 22 to 60. Extend that same measurement past the real shift at week 61, and watch what happens to it.

```r
# Extend the week-to-week change through the real shift at week 61, weeks 60-69
change_22_70 <- diff(roll[21:70])
names(change_22_70) <- 22:70
round(change_22_70[as.character(60:69)], 2)
#>    60    61    62    63    64    65    66    67    68    69 
#> -2.62  9.38 11.75 11.25 13.12 11.75 10.75 11.50 12.75  2.50 
```

::widget chart-plotter {"data":[{"x":22,"y":-1.875},{"x":23,"y":-0.125},{"x":24,"y":2.125},{"x":25,"y":-2.625},{"x":26,"y":-0.5},{"x":27,"y":0.75},{"x":28,"y":2},{"x":29,"y":0.25},{"x":30,"y":2.375},{"x":31,"y":-1.875},{"x":32,"y":-1.75},{"x":33,"y":-0.125},{"x":34,"y":-0.625},{"x":35,"y":-2.625},{"x":36,"y":-1.375},{"x":37,"y":-0.5},{"x":38,"y":0.75},{"x":39,"y":0.875},{"x":40,"y":1.625},{"x":41,"y":1.75},{"x":42,"y":3.375},{"x":43,"y":0.625},{"x":44,"y":0.125},{"x":45,"y":0.25},{"x":46,"y":-0.875},{"x":47,"y":-0.25},{"x":48,"y":-2.75},{"x":49,"y":-1.5},{"x":50,"y":-3.5},{"x":51,"y":1.25},{"x":52,"y":2.125},{"x":53,"y":-1.25},{"x":54,"y":-0.75},{"x":55,"y":-2.125},{"x":56,"y":0.5},{"x":57,"y":-0.5},{"x":58,"y":2.75},{"x":59,"y":-0.875},{"x":60,"y":-2.625},{"x":61,"y":9.375},{"x":62,"y":11.75},{"x":63,"y":11.25},{"x":64,"y":13.125},{"x":65,"y":11.75},{"x":66,"y":10.75},{"x":67,"y":11.5},{"x":68,"y":12.75},{"x":69,"y":2.5},{"x":70,"y":0}],"geoms":["line"],"x":"week","y":"change","code":{"line":"ggplot(highgate_change, aes(week, change)) +\n  geom_line()"}}

Through week 60, the week-to-week change in the forecast stays inside that same narrow band, never past 3.5 in either direction. Then, for seven straight weeks, 62 through 68, it jumps to between 10.75 and 13.12, more than 3 times anything seen in the stable weeks, as the real step from 300 to 390 works its way through the 8-week window one week at a time. These two regimes do not overlap at all. That gap, between how much the forecast moves on ordinary noise and how much it moves when the real level actually changes, is exactly the signal a refit schedule should be using.

=== step === concept
## Turning that signal into a refit rule

The trailing average's week-to-week change never passes 3.5 cases while nothing real is happening, but jumps past 9 once a real change is working through the window. That is a clean separation, so set a refit trigger just above the noise ceiling. Keep using whatever level is currently adopted as the forecast, and only refit, adopting the newly computed trailing average as the forecast going forward, when it differs from the level currently in use by more than 4 cases.

```r
# Refit only when the trailing average moves by more than 4 cases from the level now in use
adopted_level <- roll[8]
n_updates <- 0
update_weeks <- integer(0)
trigger_forecast <- rep(NA, 100)
for (t in 8:99) {
  if (abs(roll[t] - adopted_level) > 4) {
    adopted_level <- roll[t]
    n_updates <- n_updates + 1
    update_weeks <- c(update_weeks, t)
  }
  trigger_forecast[t + 1] <- adopted_level
}
trigger_mae <- mae(orders[61:100], trigger_forecast[61:100])

cat("Number of refits (weeks 8-99):", n_updates, "\n")
cat("Trigger-rule MAE, weeks 61-100:", round(trigger_mae, 2), "\n")
update_weeks
sum(update_weeks >= 61 & update_weeks <= 68)
#> Number of refits (weeks 8-99): 18 
#> Trigger-rule MAE, weeks 61-100: 17.55 
#>  [1] 12 15 19 35 42 49 55 61 62 63 64 65 66 67 68 82 88 90
#> [1] 8
```

::widget styled-table {"cols":["Refit policy","Refits performed","MAE, weeks 61-100"],"rows":[["Every week","92","17.53"],["Every 8 weeks","12","24.22"],["Never again","0","91.36"],["Only when the level moves more than 4","18","17.55"]],"title":"Four policies, one series","note":"Refits counted over weeks 8-99; MAE over weeks 61-100, the 40 weeks after the real step."}

18 refits, against 92 for weekly refitting, land at almost the same accuracy: a mean absolute error of 17.55 against weekly's 17.53. That is a fifth of the refits for essentially the same result.

Honestly, not every one of those 18 refits was actually catching a real change. Only 8 of them, the last line of the output above, fall inside the shift itself, weeks 61 through 68. The other 10 happened during otherwise quiet weeks, where ordinary noise alone pushed the trailing average just past the 4-case threshold. That is the price of setting the threshold this close to the noise ceiling: it occasionally fires on noise, but it still refits far less often than a weekly schedule while matching its accuracy.

=== step === concept
## What the threshold rule misses, and the backstop for it

A trigger built from how fast the trailing average normally moves has one honest gap. A real change that moves the level slowly enough never pushes the week-to-week change past 4 in a single week, and a pure threshold rule would never refit for it at all, no matter how far the level eventually drifts.

The fix is a backstop on top of the threshold, not instead of it.

::widget process-flow {"steps":[{"title":"Compute the trailing average for the current week","sub":"the mean of the last 8 weeks of orders"},{"title":"Compare it to the level currently in use","sub":"the level the forecast has been running on since the last refit"},{"title":"Refit now if the change exceeds the threshold","sub":"adopt the new average as the forecast level going forward"},{"title":"Otherwise wait","sub":"but refit anyway once a maximum interval passes with no trigger"}]}

Refit the moment the threshold fires. But also set a maximum interval, for example 13 weeks, and refit anyway once that many weeks have passed with no trigger, even if nothing has crossed the threshold. A fast change gets caught by the threshold. A slow one still gets caught, just later, by the backstop.

=== step === quiz
## Quick check: choosing a cadence policy

Weekly refitting costs 92 refits for a mean absolute error of 17.53. Refitting every 8 weeks costs 12 refits for 24.22. Never refitting again costs 0 refits for 91.36. And refitting only when the level moves by more than 4 costs 18 refits for 17.55, plus a maximum-interval backstop for drift too slow to trigger it. Which approach should Highgate actually adopt?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Refit only when the level moves past a threshold set just above the normal noise ceiling, with a maximum-interval backstop for drift too slow to trigger it; it matches weekly refitting's accuracy at a fifth of the refits, and the backstop covers what the threshold alone would miss. ::ok Exactly right. The threshold rule's 17.55 nearly matches weekly refitting's 17.53 at a fifth of the refits, and the maximum-interval backstop is what catches a change too slow to ever cross the threshold on its own.
- Refit every single week, since more refits can only help. ::no
- Keep whatever cadence the team already uses. ::no
- The threshold rule alone catches every real change, so no backstop is needed. ::no Refitting every week does not even win here: it costs almost 5 times the refits of the threshold rule for a nearly identical mean absolute error, 17.53 against 17.55. Keeping a schedule out of habit ignores both the noise ceiling and the real shift already measured in Highgate's own numbers. And the threshold rule alone cannot catch a change that drifts too slowly to ever move the trailing average by more than 4 cases in a single week, which is exactly why a maximum-interval backstop belongs on top of it.

=== step === tryit
## Your turn: refit or hold?

Highgate's threshold was 4 cases: refit whenever the trailing average moves by more than that from one week to the next. Suppose another series inside Highgate shows these week-to-week changes in its own trailing average: 1.1, -2.4, 3.0, 9.8, -0.6, 11.2. Using the same rule, find which of these six weeks call for a refit.

```r
# Weekly changes in the forecast level, and the refit threshold
changes <- c(1.1, -2.4, 3.0, 9.8, -0.6, 11.2)
threshold <- 4

# Write the comparison that flags which weeks call for a refit, then wrap it in which()

```
::check {"regex": "abs[(]\\s*changes\\s*[)]\\s*>\\s*threshold", "gate": true, "difficulty": "intermediate", "ok": "Exactly. abs(changes) > threshold flags entries 4 and 6, the two changes bigger than 4 in either direction, 9.8 and 11.2. Those are the two weeks that call for a refit; the rest sit inside the ordinary noise band.", "no": "Compare the absolute size of each change against the threshold: abs(changes) > threshold. Wrap that comparison in which() to see which positions it flags."}
::solution
```r
# Flag every week where the change's absolute size exceeds the threshold
flags <- abs(changes) > threshold
which(flags)
#> [1] 4 6
```

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman, R.J. and Athanasopoulos, G. Chapters on exponential smoothing and time-series cross-validation.
- [Designing Machine Learning Systems](https://github.com/chiphuyen/dmls-book) - Huyen, C. (2022), O'Reilly. Chapter on continual learning and retraining triggers versus fixed schedules.
- [Hidden Technical Debt in Machine Learning Systems](https://proceedings.neurips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) - Sculley, D. and collaborators (2015), NeurIPS.
- [A Survey on Concept Drift Adaptation](https://doi.org/10.1145/2523813) - Gama, J., Zliobaite, I., Bifet, A., Pechenizkiy, M., and Bouchachia, A. (2014), ACM Computing Surveys, 46(4).

=== step === complete
## What you can do now

By the end of this lesson, you can set a forecast model's refit cadence from its own measured noise, instead of from habit.

Weekly refitting cost a mean absolute error of 17.53 over the 40 weeks after Highgate's real shift, against 91.36 for never refitting again and 24.22 for a fixed every-8-week compromise that still lagged badly right after the shift. Measuring how far the forecast normally moves on pure noise, 3.5 cases at most, against how far it moves on a real change, past 9, gave a refit trigger that matched weekly refitting's accuracy, 17.55, using a fifth of the refits weekly refitting needed.

That trigger is not perfect on its own: a slow enough drift could still slip past it, which is why it runs alongside a maximum-interval backstop rather than alone.

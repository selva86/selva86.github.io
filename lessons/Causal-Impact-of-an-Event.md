---
title: "Intervention, Causal Impact, and Anomaly Detection Lesson 2: Estimating an event's effect with a counterfactual forecast"
catalog_blurb: "Build the counterfactual that tells you what would have happened without the event."
description: "Fit a model on the days before an event, forecast it forward as the counterfactual, and read the gap against what actually happened as the event's effect."
keywords: "counterfactual forecast, causal impact analysis, intervention analysis in R, auto.arima, forecast package R, pre-period and post-period, CausalImpact package, bsts Bayesian structural time series, cumulative effect, prediction interval"
post_type: "LESSON"
curriculum_id: "5.140.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-intervention"
course_title: "Intervention, Causal Impact, and Anomaly Detection"
course_lesson: "2"
course_total: "5"
course_landing: "Intervention-Causal-Impact-and-Anomaly-Detection-Course.html"
course_next: "Changepoint-Detection.html"
course_prev: "Intervention-Analysis-and-Interrupted-Time-Series.html"
---

=== step === cover
## Estimating an event's effect with a counterfactual forecast

Today let's understand how to work out what an event actually did to a number you track every day, using a real example you can run yourself.

Daybreak Coffee is an online coffee-subscription retailer. For 90 days it tracked its daily online orders, and on day 61 it launched a podcast advertising campaign. The 60 days before the campaign averaged 541.9 orders a day. The 30 days after averaged 668.2 orders a day.

Here is the whole 90-day series, colored by whether the day fell before or after the campaign.

::widget chart-plotter {"data":[{"x":1,"y":506,"fill":"pre"},{"x":2,"y":541,"fill":"pre"},{"x":3,"y":523,"fill":"pre"},{"x":4,"y":534,"fill":"pre"},{"x":5,"y":531,"fill":"pre"},{"x":6,"y":568,"fill":"pre"},{"x":7,"y":563,"fill":"pre"},{"x":8,"y":532,"fill":"pre"},{"x":9,"y":492,"fill":"pre"},{"x":10,"y":520,"fill":"pre"},{"x":11,"y":537,"fill":"pre"},{"x":12,"y":545,"fill":"pre"},{"x":13,"y":597,"fill":"pre"},{"x":14,"y":556,"fill":"pre"},{"x":15,"y":541,"fill":"pre"},{"x":16,"y":528,"fill":"pre"},{"x":17,"y":492,"fill":"pre"},{"x":18,"y":527,"fill":"pre"},{"x":19,"y":559,"fill":"pre"},{"x":20,"y":532,"fill":"pre"},{"x":21,"y":580,"fill":"pre"},{"x":22,"y":486,"fill":"pre"},{"x":23,"y":544,"fill":"pre"},{"x":24,"y":509,"fill":"pre"},{"x":25,"y":534,"fill":"pre"},{"x":26,"y":568,"fill":"pre"},{"x":27,"y":549,"fill":"pre"},{"x":28,"y":552,"fill":"pre"},{"x":29,"y":511,"fill":"pre"},{"x":30,"y":528,"fill":"pre"},{"x":31,"y":532,"fill":"pre"},{"x":32,"y":531,"fill":"pre"},{"x":33,"y":533,"fill":"pre"},{"x":34,"y":561,"fill":"pre"},{"x":35,"y":565,"fill":"pre"},{"x":36,"y":526,"fill":"pre"},{"x":37,"y":551,"fill":"pre"},{"x":38,"y":539,"fill":"pre"},{"x":39,"y":514,"fill":"pre"},{"x":40,"y":535,"fill":"pre"},{"x":41,"y":562,"fill":"pre"},{"x":42,"y":597,"fill":"pre"},{"x":43,"y":535,"fill":"pre"},{"x":44,"y":529,"fill":"pre"},{"x":45,"y":518,"fill":"pre"},{"x":46,"y":532,"fill":"pre"},{"x":47,"y":556,"fill":"pre"},{"x":48,"y":568,"fill":"pre"},{"x":49,"y":606,"fill":"pre"},{"x":50,"y":530,"fill":"pre"},{"x":51,"y":541,"fill":"pre"},{"x":52,"y":551,"fill":"pre"},{"x":53,"y":524,"fill":"pre"},{"x":54,"y":551,"fill":"pre"},{"x":55,"y":580,"fill":"pre"},{"x":56,"y":583,"fill":"pre"},{"x":57,"y":528,"fill":"pre"},{"x":58,"y":567,"fill":"pre"},{"x":59,"y":556,"fill":"pre"},{"x":60,"y":530,"fill":"pre"},{"x":61,"y":551,"fill":"post"},{"x":62,"y":646,"fill":"post"},{"x":63,"y":599,"fill":"post"},{"x":64,"y":586,"fill":"post"},{"x":65,"y":636,"fill":"post"},{"x":66,"y":620,"fill":"post"},{"x":67,"y":640,"fill":"post"},{"x":68,"y":669,"fill":"post"},{"x":69,"y":714,"fill":"post"},{"x":70,"y":694,"fill":"post"},{"x":71,"y":636,"fill":"post"},{"x":72,"y":661,"fill":"post"},{"x":73,"y":662,"fill":"post"},{"x":74,"y":666,"fill":"post"},{"x":75,"y":682,"fill":"post"},{"x":76,"y":692,"fill":"post"},{"x":77,"y":706,"fill":"post"},{"x":78,"y":653,"fill":"post"},{"x":79,"y":681,"fill":"post"},{"x":80,"y":690,"fill":"post"},{"x":81,"y":653,"fill":"post"},{"x":82,"y":691,"fill":"post"},{"x":83,"y":724,"fill":"post"},{"x":84,"y":729,"fill":"post"},{"x":85,"y":694,"fill":"post"},{"x":86,"y":693,"fill":"post"},{"x":87,"y":685,"fill":"post"},{"x":88,"y":683,"fill":"post"},{"x":89,"y":673,"fill":"post"},{"x":90,"y":738,"fill":"post"}],"x":"day","y":"orders","geoms":["line"],"code":{"line":"ggplot(orders_df, aes(day, orders, colour = period)) +\n  geom_line()"}}

Orders step up noticeably right where the color changes at day 61. But a weekly pattern was already pushing orders up and down before the campaign ever started, and the series was already drifting upward day by day on top of that. So the question this lesson answers is: how much of that step up is the campaign, and how much would have happened anyway?

=== step === concept
## What a counterfactual answers that a before and after average cannot

The gap between those two averages is 668.2 minus 541.9, which comes to 126.3 orders a day. It is tempting to call that the campaign's effect. But it is not, because both periods already carried patterns that had nothing to do with the campaign.

Build the series the way it was actually generated, and two of those patterns show up right in the code.

```r
# Build Daybreak Coffee's 90 days of orders and compare the before/after averages
set.seed(110)
day <- 1:90
day_of_week <- ((day - 1) %% 7) + 1                      # 1 = Monday ... 7 = Sunday
weekly_add  <- c(0, 15, 10, 5, 20, 55, 60)[day_of_week]  # Friday and Saturday run busiest

baseline <- 500 + 0.6 * day + weekly_add
noise    <- rnorm(90, mean = 0, sd = 18)
orders_obs <- baseline + noise

post_days <- 61:90
ramp <- pmin((post_days - 60) / 7, 1)                    # the lift ramps in over the first week
orders_obs[post_days] <- orders_obs[post_days] + 0.20 * baseline[post_days] * ramp
orders_obs <- round(orders_obs)

round(c(pre_mean = mean(orders_obs[1:60]), post_mean = mean(orders_obs[61:90]),
        naive_gap = mean(orders_obs[61:90]) - mean(orders_obs[1:60])), 1)
#> pre_mean post_mean naive_gap 
#>    541.9     668.2     126.3 
```

`weekly_add` adds the Friday and Saturday peak to every single day, before the campaign and after it alike. The `0.6 * day` term is a small steady climb that was already built into the series from day one. So part of that 126.3 naive gap is just the weekly pattern and the drift landing differently across the two periods, nothing to do with the campaign.

To separate the two properly, name the pieces.

- The **response series** is the number being measured over time. Here it is `orders_obs`, the daily order count.
- The **intervention date** is the day the event happened: day 61.
- The **pre-period** is every day before the intervention: days 1 to 60.
- The **post-period** is every day from the intervention onward: days 61 to 90.
- The **counterfactual** is what the response series would have looked like in the post-period if the intervention had never happened.

The campaign's effect is not post-period average minus pre-period average. It is actual minus counterfactual, day by day, and the counterfactual has to come from a model that never saw the campaign.

=== step === concept
## Build the counterfactual: fit a forecasting model on the pre-period alone

A counterfactual has to come from somewhere, and where you get it from is the whole trick. Fit a forecasting model using only the 60 pre-period days, the days that never saw the campaign. Whatever that model forecasts for day 61 onward is, by construction, what it predicts orders would do with no campaign in them, because it was never shown a single day that had one.

Turn the pre-period into a time series object and let `auto.arima()` search for the model that fits it best.

```r
# Fit a forecasting model on the pre-period alone, the only part that never saw the campaign
library(forecast)

y_pre <- ts(orders_obs[1:60], frequency = 7)   # frequency = 7 tells R the season repeats every 7 days
fit <- auto.arima(y_pre)
fit
#> Series: y_pre 
#> ARIMA(0,0,0)(0,1,1)[7] with drift 
#> 
#> Coefficients:
#>          sma1   drift
#>       -0.8354  0.3520
#> s.e.   0.2268  0.1313
#> 
#> sigma^2 = 308.9:  log likelihood = -230.13
#> AIC=466.26   AICc=466.75   BIC=472.17
```

Read the model name piece by piece. The first `(0,0,0)` is the ordinary, non-seasonal part, and all three zeros mean `auto.arima()` found no ordinary autoregressive term, no ordinary differencing, and no ordinary moving-average term worth keeping.

The second `(0,1,1)` is the seasonal part, and `[7]` says the season is 7 days long, one calendar week. The middle 1 means the model takes one seasonal difference: it works with the change from this Tuesday to last Tuesday rather than the raw order count, which is how it tracks the weekly Friday and Saturday peak without being told where the peaks sit. The final 1 is a seasonal moving-average term, `sma1` in the output, with coefficient -0.8354, which smooths that week-to-week change using last week's error.

`with drift` adds one more piece, a small constant slope. Its coefficient is 0.352, so the fitted line climbs by about 0.352 orders a day on top of the weekly pattern, matching the steady climb built into the series. `sigma^2 = 308.9` is what is left over once the weekly pattern and the drift are accounted for; its square root, about 17.6 orders, is how much a single day still wobbles around the fitted value.

This model never saw a single day from the campaign. So whatever it forecasts next is the counterfactual: what orders would have done if day 61 had been an ordinary Wednesday.

=== step === widget
## Forecast the counterfactual forward and compare it to what happened

`forecast()` turns that fitted model into 30 days of counterfactual values, one for every post-campaign day, each with a 95% interval around it.

```r
# Forecast the counterfactual 30 days forward and compare it to the real orders
fc <- forecast(fit, h = 30, level = 95)
actual_post <- orders_obs[61:90]
counterfactual <- as.numeric(fc$mean)
gap <- actual_post - counterfactual

round(data.frame(day = 60 + c(1, 2, 9),
                  actual = actual_post[c(1, 2, 9)],
                  counterfactual = counterfactual[c(1, 2, 9)],
                  gap = gap[c(1, 2, 9)]), 1)
#>   day actual counterfactual   gap
#> 1  61    551          557.4  -6.4
#> 2  62    646          575.3  70.7
#> 3  69    714          577.8 136.2
```

On day 61, the very first day of the campaign, actual orders came in at 551 against a counterfactual of 557.4, a gap of -6.4. That is the one day in the entire post-period where actual orders ran below the counterfactual; the campaign's lift was still ramping in and had not caught up yet. By day 62 the gap is already 70.7, and by day 69, the ninth day of the campaign, actual orders are running 136.2 above what the model expected with no campaign at all.

Here is the whole post-period: the actual orders and the counterfactual, plotted side by side.

::widget chart-plotter {"data":[{"x":61,"y":551,"fill":"actual"},{"x":62,"y":646,"fill":"actual"},{"x":63,"y":599,"fill":"actual"},{"x":64,"y":586,"fill":"actual"},{"x":65,"y":636,"fill":"actual"},{"x":66,"y":620,"fill":"actual"},{"x":67,"y":640,"fill":"actual"},{"x":68,"y":669,"fill":"actual"},{"x":69,"y":714,"fill":"actual"},{"x":70,"y":694,"fill":"actual"},{"x":71,"y":636,"fill":"actual"},{"x":72,"y":661,"fill":"actual"},{"x":73,"y":662,"fill":"actual"},{"x":74,"y":666,"fill":"actual"},{"x":75,"y":682,"fill":"actual"},{"x":76,"y":692,"fill":"actual"},{"x":77,"y":706,"fill":"actual"},{"x":78,"y":653,"fill":"actual"},{"x":79,"y":681,"fill":"actual"},{"x":80,"y":690,"fill":"actual"},{"x":81,"y":653,"fill":"actual"},{"x":82,"y":691,"fill":"actual"},{"x":83,"y":724,"fill":"actual"},{"x":84,"y":729,"fill":"actual"},{"x":85,"y":694,"fill":"actual"},{"x":86,"y":693,"fill":"actual"},{"x":87,"y":685,"fill":"actual"},{"x":88,"y":683,"fill":"actual"},{"x":89,"y":673,"fill":"actual"},{"x":90,"y":738,"fill":"actual"},{"x":61,"y":557.4,"fill":"counterfactual"},{"x":62,"y":575.3,"fill":"counterfactual"},{"x":63,"y":588.1,"fill":"counterfactual"},{"x":64,"y":533.7,"fill":"counterfactual"},{"x":65,"y":549.8,"fill":"counterfactual"},{"x":66,"y":541.7,"fill":"counterfactual"},{"x":67,"y":539,"fill":"counterfactual"},{"x":68,"y":559.8,"fill":"counterfactual"},{"x":69,"y":577.8,"fill":"counterfactual"},{"x":70,"y":590.6,"fill":"counterfactual"},{"x":71,"y":536.2,"fill":"counterfactual"},{"x":72,"y":552.2,"fill":"counterfactual"},{"x":73,"y":544.1,"fill":"counterfactual"},{"x":74,"y":541.5,"fill":"counterfactual"},{"x":75,"y":562.3,"fill":"counterfactual"},{"x":76,"y":580.2,"fill":"counterfactual"},{"x":77,"y":593,"fill":"counterfactual"},{"x":78,"y":538.6,"fill":"counterfactual"},{"x":79,"y":554.7,"fill":"counterfactual"},{"x":80,"y":546.6,"fill":"counterfactual"},{"x":81,"y":543.9,"fill":"counterfactual"},{"x":82,"y":564.8,"fill":"counterfactual"},{"x":83,"y":582.7,"fill":"counterfactual"},{"x":84,"y":595.5,"fill":"counterfactual"},{"x":85,"y":541.1,"fill":"counterfactual"},{"x":86,"y":557.2,"fill":"counterfactual"},{"x":87,"y":549.1,"fill":"counterfactual"},{"x":88,"y":546.4,"fill":"counterfactual"},{"x":89,"y":567.2,"fill":"counterfactual"},{"x":90,"y":585.2,"fill":"counterfactual"}],"x":"day","y":"orders","geoms":["line","point"],"code":{"line":"ggplot(post_compare, aes(day, orders, colour = series)) +\n  geom_line()","point":"ggplot(post_compare, aes(day, orders, colour = series)) +\n  geom_point()"}}

Follow the two lines from day 61. They start close together, cross briefly, and then the actual line pulls away and stays above the counterfactual for the rest of the post-period. That growing gap, not the single before-and-after averages, is where the campaign's effect actually lives.

=== step === widget
## Why the gap has to stay wide: confidence interval vs prediction interval

The forecast did not just give one number per day. It gave a point estimate, 557.4 for day 61, plus a 95% interval around it, because the model is not certain the future will match its central value exactly. That interval has a type, and the type decides how wide it can ever get.

Statisticians keep two different ranges for two different questions. A **confidence interval** answers where the true average sits. A **prediction interval** answers where one new, individual future value will land. The second is always wider, because it has to cover both the uncertainty about the average and the ordinary day-to-day scatter around it. The counterfactual forecast is the second kind: each post-campaign day is one new, unobserved value, not a long-run average.

The widget below is not the Daybreak Coffee series. It is its own small built-in regression, with a slider for the sample size n, so you can watch both kinds of interval behave as the data grows.

::widget regression-intervals {}

Slide n up and the confidence band, the one around the average, collapses toward the line, because more data pins down an average more precisely. The prediction band barely moves, because a new single point still carries the same ordinary scatter no matter how much data went into fitting the line. That is exactly why the counterfactual's interval never shrinks to nothing: 60 days of pre-period data pin down the model's pattern well, but every post-campaign day is still one new value, floored by the same day-to-day noise, sigma about 17.6 orders, that the pre-period always had.

=== step === quiz
## Quick check: reading the counterfactual chart and its interval

By day 9 of the campaign, how far above the counterfactual is the actual line running, and why does the band around the counterfactual stay wide instead of narrowing to nothing?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- By day 9, actual orders run close to the counterfactual, within a few orders either way. ::no
- By day 9, actual orders run about 136 orders above the counterfactual, and the band around the counterfactual stays wide because it is a prediction interval for one future day's orders, floored by the day-to-day noise, not by how many pre-period days fed the fit. ::ok Exactly right. The 95% band never has to promise that a single future day will land near its center, only that the range covers it 95% of the time, and that range is set by the ordinary day-to-day scatter, sigma about 17.6 orders, not by the sample size.
- The band stays wide only because the ARIMA model is the wrong model for this series. ::no
- Given enough pre-period days, the interval would eventually shrink to nothing. ::no More pre-period data pins down the model's pattern more precisely, which is the confidence-interval story. It does nothing to the ordinary day-to-day scatter in a single future value, which is the floor under a prediction interval and the reason it never reaches zero.

=== step === concept
## The cumulative effect: adding the daily gaps into one number

One number is more useful to a stakeholder than 30 separate daily gaps. Add every day's gap across the whole post-period, and you get the **cumulative effect**: the total number of extra orders the campaign gets credited with.

Sum the actual orders and the counterfactual orders separately across all 30 post-campaign days, then subtract.

```r
# Add up the 30 daily gaps into one cumulative effect over the whole post-period
actual_total <- sum(actual_post)
counterfactual_total <- sum(fc$mean)
cumulative_effect <- actual_total - counterfactual_total
pct_above <- 100 * cumulative_effect / counterfactual_total

round(data.frame(actual_total, counterfactual_total, cumulative_effect, pct_above), 1)
#>   actual_total counterfactual_total cumulative_effect pct_above
#> 1        20047              16795.5            3251.5      19.4
```

Daybreak Coffee actually took 20,047 orders over the 30 post-campaign days. Had the campaign never run, the counterfactual says it would have taken about 16,795.5. The difference, 3,251.5 orders, is the cumulative effect: 19.4% more than the counterfactual's own total.

That one number still needs a range around it, for the same reason every single day's forecast needed one. Each day's forecast carried its own 95% lower and upper bound, so add those up the same way to get an approximate interval for the cumulative effect.

```r
# Approximate the cumulative effect's own interval from the forecast's lower and upper bounds
effect_lower <- actual_total - sum(fc$upper)
effect_upper <- actual_total - sum(fc$lower)

round(data.frame(effect_lower, effect_upper), 1)
#>   effect_lower effect_upper
#> 1       2187.6       4315.5
```

A higher counterfactual total means a smaller effect, which is why the forecast's upper bound, the most generous counterfactual, produces the effect's lower bound, and the forecast's lower bound produces the effect's upper bound. So the honest headline is not "3,251.5 extra orders." It is "about 3,251.5 extra orders, plausibly between 2,187.6 and 4,315.5."

[NOTE]
This interval is only an approximation. Summing 30 separate 95% bounds treats each day's forecast error as unrelated to the next day's, which it is not: a day that runs high tends to be followed by another day that also runs high, because the model missed the same thing on both days. CausalImpact and bsts, covered next, fix exactly this by simulating the whole 30-day path at once instead of day by day.

=== step === concept
## Three ways this estimate can mislead you

A counterfactual forecast is only as honest as the pre-period model and the assumption that nothing else changed during the post-period. Three things commonly break that assumption, and a stakeholder looking at 3,251.5 extra orders should ask about all three.

1. **A concurrent event.** Suppose Daybreak Coffee also ran a sitewide discount the same week as the podcast campaign. The model has no way to separate the two, so every order the discount brought in gets credited to the campaign instead, inflating the 3,251.5 figure.
2. **A seasonal pattern the pre-period never saw.** The fitted model's seasonal part only knows a 7-day week, because that is all 60 days of pre-period data could show it. If a holiday surge happened to land inside the post-period, something a weekly-only model has no term for, the model would read the whole surge as campaign lift and overstate the effect.
3. **A control series that was itself affected.** Adding a competitor's sales as a steadying predictor only helps if the campaign left the competitor untouched. If the podcast also reached the competitor's customers and lifted its sales too, that control series is contaminated, and using it would bias the estimate with no obvious warning sign in the output.

=== step === concept
## Where CausalImpact and bsts take over

Everything so far, fit on the pre-period, forecast forward, subtract, sum, is also what the `CausalImpact` package automates, built on top of a Bayesian structural time series model from the `bsts` package. The idea is identical to what you just did by hand. What it adds is a properly simulated interval.

Instead of summing 30 separate forecast intervals, CausalImpact draws thousands of samples from the fitted model's posterior distribution, simulates a whole 30-day counterfactual path from each draw, and adds up each simulated path before looking at the spread across the thousands of totals. That path-by-path approach fixes the summed-bounds approximation, because it keeps each day's error correlated with the days around it instead of treating every day as independent. CausalImpact can also blend in several control predictors at once, like the competitor's sales from the control-series scenario earlier, as long as you are confident the campaign left them alone.

Here is the matching call: the same pre-period and post-period split, handed to `CausalImpact()` instead of `auto.arima()`.

```r-static
# Run the same pre-period / post-period split through CausalImpact instead of auto.arima()
library(CausalImpact)

daybreak_data <- data.frame(orders = orders_obs)
impact <- CausalImpact(daybreak_data, pre.period = c(1, 60), post.period = c(61, 90))
summary(impact)
```

Both `CausalImpact` and `bsts` are missing from the browser's R environment this lesson runs in, so the code above is shown rather than run. Everything it would report, the cumulative effect and its interval, is the same idea already built across the last few steps, just with a properly simulated interval in place of the summed-bounds shortcut.

=== step === quiz
## Quick check: putting the estimate together

Given the three ways this kind of estimate can mislead you and the difference between an approximate interval and a properly simulated one, which of these is the honest way to report the 3,251.5-order estimate?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The campaign caused exactly 3,251.5 extra orders, with certainty. ::no
- Given that the pre-period pattern held and no unmodeled concurrent event or unseen seasonality crept in, orders ran about 3,251 higher than the counterfactual over the post-period, plausibly between about 2,188 and 4,316, an approximate interval rather than a properly simulated one. ::ok Exactly right. It states the number, keeps the caveats about what could still be wrong, and is honest about the interval being the summed-bounds approximation, not CausalImpact's properly simulated one.
- Any rise in orders after day 61 proves the campaign worked. ::no
- The estimate would be unchanged even if a holiday fell inside the post-period. ::no A holiday inside the post-period is exactly the seasonal-pattern failure mode: the weekly-only model has no term for it, so it would fold the whole holiday surge into the campaign's credit and change the estimate with no warning in the output.

=== step === tryit
## Your turn: recompute the effect over a shorter window

`fit` and `actual_post` are both still around. Use them to find the cumulative effect over just the first 14 days of the campaign instead of all 30.

```r
# fc$mean holds the 30-day counterfactual and actual_post holds the 30 real
# post-campaign days.
# Slice both vectors down to their first 14 days, sum each one, and
# subtract the counterfactual sum from the actual sum.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*actual_post[[]1:14\\])(?=[\\s\\S]*fc[$]mean[[]1:14\\])", "gate": true, "difficulty": "intermediate", "ok": "Right: about 1,193 extra orders over just the first 14 days, a little over a third of the full 30-day cumulative effect, which fits since the campaign's lift was still ramping in over its first week.", "no": "Slice both vectors to their first 14 entries before subtracting: sum(actual_post[1:14]) and sum(fc$mean[1:14])."}
::solution
```r
# Cumulative effect over just the first 14 post-campaign days
sum(actual_post[1:14]) - sum(fc$mean[1:14])
#> [1] 1192.956
```

=== step === concept
## References

- [Inferring causal impact using Bayesian structural time-series models](https://doi.org/10.1214/14-AOAS788) - Brodersen, Gallusser, Koehler, Remy, and Scott (2015), Annals of Applied Statistics, 9(1), 247-274. The paper behind the CausalImpact package.
- [Predicting the present with Bayesian structural time series](https://doi.org/10.1504/IJMMNO.2014.059942) - Scott and Varian (2014), International Journal of Mathematical Modelling and Numerical Optimisation, 5(1-2), 4-23. The bsts model CausalImpact is built on.
- [Intervention analysis with applications to economic and environmental problems](https://doi.org/10.1080/01621459.1975.10480264) - Box and Tiao (1975), Journal of the American Statistical Association, 70(349), 70-79. The original statistical treatment of a known intervention date.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos. The chapters on ARIMA models and on regression with ARIMA errors cover the forecasting machinery this lesson builds on.
- [The CausalImpact package](https://github.com/google/CausalImpact) - Google, on CRAN and GitHub. The documentation for the automated version of the method built by hand in this lesson.

=== step === complete
## Quick recap

- A counterfactual is what the response series would have done after the intervention date if the event had never happened. Build it by fitting a model on the pre-period alone and forecasting it forward.
- The effect is actual minus counterfactual, day by day, never actual minus the pre-period average.
- Add the daily gaps into one cumulative effect, 3,251.5 extra orders here, with an approximate interval built from summing the forecast's own bounds.
- Three things can bias that number: a concurrent event, an unmodeled seasonal pattern, and a contaminated control series.
- CausalImpact and bsts automate the same fit-forecast-subtract idea, with a properly simulated interval in place of the summed-bounds shortcut.

The next lesson in this course picks up the harder version of this problem: finding the break date yourself, when nobody tells you which day the event happened on.

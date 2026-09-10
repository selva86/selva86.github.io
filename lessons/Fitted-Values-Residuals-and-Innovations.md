---
title: "Forecasting Toolbox Lesson 1: Fitted values, residuals and innovations"
catalog_blurb: "See why a model's fitted line is not proof it can forecast."
description: "Learn what augment() adds to a fitted fable model, why a one-step fitted value differs from a real forecast, and which residual to trust for diagnostics."
keywords: "augment fable r, fitted values vs forecast, one-step fitted value, innovation residuals, response residuals, RW drift model r, MASE out of sample accuracy, fable residual diagnostics"
post_type: "LESSON"
curriculum_id: "5.30.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "1"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: "Residual-Diagnostics-and-the-Ljung-Box-Test.html"
course_prev: ""
---

=== step === cover
## Fitted values, residuals and innovations

Today let's understand fitted values, residuals and innovations, the three columns a fitted time series model hands back the moment it is fit.

Northfield Outdoor Supply sells hiking and camping gear. Its owner keeps 60 months of revenue on record, January 2020 through December 2024. Revenue starts at $34,451 and climbs most years, with a summer peak that gets bigger in dollar terms as the business grows.

::widget chart-plotter {"data":[{"x":1,"y":34451},{"x":2,"y":34980},{"x":3,"y":37073},{"x":4,"y":41001},{"x":5,"y":48417},{"x":6,"y":52281},{"x":7,"y":51969},{"x":8,"y":49802},{"x":9,"y":44947},{"x":10,"y":41903},{"x":11,"y":37499},{"x":12,"y":39128},{"x":13,"y":39117},{"x":14,"y":39608},{"x":15,"y":36095},{"x":16,"y":46852},{"x":17,"y":49610},{"x":18,"y":56946},{"x":19,"y":52966},{"x":20,"y":51345},{"x":21,"y":57235},{"x":22,"y":50877},{"x":23,"y":48472},{"x":24,"y":42627},{"x":25,"y":43094},{"x":26,"y":40634},{"x":27,"y":47475},{"x":28,"y":54804},{"x":29,"y":52560},{"x":30,"y":61985},{"x":31,"y":59733},{"x":32,"y":62411},{"x":33,"y":58837},{"x":34,"y":59306},{"x":35,"y":49988},{"x":36,"y":48889},{"x":37,"y":47769},{"x":38,"y":47578},{"x":39,"y":51507},{"x":40,"y":59991},{"x":41,"y":61774},{"x":42,"y":68967},{"x":43,"y":72769},{"x":44,"y":77359},{"x":45,"y":62751},{"x":46,"y":62003},{"x":47,"y":57430},{"x":48,"y":54602},{"x":49,"y":53371},{"x":50,"y":59081},{"x":51,"y":56647},{"x":52,"y":62058},{"x":53,"y":68554},{"x":54,"y":71853},{"x":55,"y":75182},{"x":56,"y":71442},{"x":57,"y":76237},{"x":58,"y":66560},{"x":59,"y":64901},{"x":60,"y":57576}],"geoms":["point","line","bar"],"x":"month","y":"revenue"}

Look at that climb, and the summer bumps riding on top of it. Once you fit a model to a series shaped like this, R can give back a fitted line that sits almost exactly on top of the real one, and it is tempting to read a line that close as proof the model can forecast. This lesson shows you exactly what that fitted line is built from, and why closeness like that is not the proof it looks like.

=== step === concept
## What augment() adds to a fitted model

To see what augment() adds, first fit a model to Northfield's revenue. Build the 60 months as a tsibble, the tidyverse's structure for a table indexed by time, then fit a random walk with drift to the logged revenue.

```r
# Build Northfield's 60 months as a tsibble, then fit a random walk with drift to logged revenue
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(2024)
month <- yearmonth("2020 Jan") + 0:59
level <- 40000 + 480 * (0:59)
season <- 1 + 0.18 * sin(2 * pi * (((0:59) %% 12) - 3) / 12)
noise <- exp(rnorm(60, 0, 0.05))
revenue <- round(level * season * noise)

sales <- tsibble(month = month, revenue = revenue, index = month)

fit_full <- model(sales, drift = RW(log(revenue) ~ drift()))
invisible(report(fit_full))
#> Series: revenue
#> Model: RW w/ drift
#> Transformation: log(revenue)
#>
#> Drift: 0.0087 (se: 0.0123)
#> sigma^2: 0.0089
```

report() names the model RW w/ drift, a random walk with drift: its rule is last month's real value plus one constant step, called the drift, repeated every month. Because the model fit log(revenue) rather than revenue itself, that step lives on the log scale. The Drift row reads 0.0087, which works out to revenue growing by about 0.87% from one month to the next, on average across the whole series.

Now ask fabletools for the model's own bookkeeping with augment(). Hand it the mable, the fitted-model table fit_full holds, and it adds three new columns onto the original month and revenue columns.

```r
# Add the model's own bookkeeping columns onto the original month and revenue columns
aug_full <- augment(fit_full)
head(aug_full)
#> # A tsibble: 6 x 6 [1M]
#> # Key:       .model [1]
#>   .model    month revenue .fitted .resid   .innov
#>   <chr>     <mth>   <dbl>   <dbl>  <dbl>    <dbl>
#> 1 drift  2020 Jan   34451      NA     NA  NA
#> 2 drift  2020 Feb   34980   34752.   228.  0.00653
#> 3 drift  2020 Mar   37073   35286.  1787.  0.0494
#> 4 drift  2020 Apr   41001   37397.  3604.  0.0920
#> 5 drift  2020 May   48417   41359.  7058.  0.158
#> 6 drift  2020 Jun   52281   48840.  3441.  0.0681
```

Three new columns appear. .fitted holds the model's fitted value for that month, what it predicts revenue should have been. .resid holds the response residual, real revenue minus .fitted, in dollars. .innov holds the innovation residual, the miss measured on the scale the model actually fit, here the logged scale.

Row 1, January 2020, is NA across all three columns. There is no earlier month in this series for the model to build a one-step value from yet.

=== step === concept
## One-step fitted values are not forecasts

Look again at February 2020: .fitted reads 34,752 against a real 34,980, just 228 dollars off. That closeness is not luck. It comes straight from the formula .fitted uses.

.fitted for month t is built from one rule: take last month's real revenue, move it up by the drift on the log scale, then convert back to dollars. In R that is exp(log(revenue[t-1]) + drift). Check it by hand for a few months and compare against augment()'s own numbers.

```r
# Hand-compute the one-step fitted value for a few months, and compare it to augment()'s own numbers
drift <- tidy(fit_full)$estimate
round(drift, 4)
#> [1] 0.0087

manual_fitted <- exp(log(sales$revenue[1:5]) + drift)
round(manual_fitted, 1)
#> [1] 34752.2 35285.8 37397.1 41359.5 48840.3

round(aug_full$.fitted[2:6], 1)
#> [1] 34752.2 35285.8 37397.1 41359.5 48840.3
```

The two rows match exactly. Every .fitted value past the first is a one-step calculation: it only ever needs last month's real revenue plugged into that one formula.

Now compare that with a genuine forecast. Call forecast(fit_full, h = 12) to forecast twelve months ahead, and the very first forecasted month still has a real previous month to plug in, so that first step is really the same one-step calculation you just did by hand. But the second forecasted month has no real revenue yet, the real month has not happened. So the model plugs in its own forecast from the first step instead, and the third step builds on the second one's forecast, and so on. Past the first step, every forecasted value compounds on the model's earlier guesses, never on the real series again.

That is the entire difference between a fitted value and a forecast. A one-step fitted value always has a real number to start from. A forecast, past its first step, never does.

=== step === widget
## Reading the fitted line against the real series

See that mechanism on the chart itself. Plot Northfield's real revenue and fit_full's .fitted column on the same axis, month by month.

::widget chart-plotter {"data":[{"x":1,"y":34451,"fill":"actual"},{"x":2,"y":34980,"fill":"actual"},{"x":3,"y":37073,"fill":"actual"},{"x":4,"y":41001,"fill":"actual"},{"x":5,"y":48417,"fill":"actual"},{"x":6,"y":52281,"fill":"actual"},{"x":7,"y":51969,"fill":"actual"},{"x":8,"y":49802,"fill":"actual"},{"x":9,"y":44947,"fill":"actual"},{"x":10,"y":41903,"fill":"actual"},{"x":11,"y":37499,"fill":"actual"},{"x":12,"y":39128,"fill":"actual"},{"x":13,"y":39117,"fill":"actual"},{"x":14,"y":39608,"fill":"actual"},{"x":15,"y":36095,"fill":"actual"},{"x":16,"y":46852,"fill":"actual"},{"x":17,"y":49610,"fill":"actual"},{"x":18,"y":56946,"fill":"actual"},{"x":19,"y":52966,"fill":"actual"},{"x":20,"y":51345,"fill":"actual"},{"x":21,"y":57235,"fill":"actual"},{"x":22,"y":50877,"fill":"actual"},{"x":23,"y":48472,"fill":"actual"},{"x":24,"y":42627,"fill":"actual"},{"x":25,"y":43094,"fill":"actual"},{"x":26,"y":40634,"fill":"actual"},{"x":27,"y":47475,"fill":"actual"},{"x":28,"y":54804,"fill":"actual"},{"x":29,"y":52560,"fill":"actual"},{"x":30,"y":61985,"fill":"actual"},{"x":31,"y":59733,"fill":"actual"},{"x":32,"y":62411,"fill":"actual"},{"x":33,"y":58837,"fill":"actual"},{"x":34,"y":59306,"fill":"actual"},{"x":35,"y":49988,"fill":"actual"},{"x":36,"y":48889,"fill":"actual"},{"x":37,"y":47769,"fill":"actual"},{"x":38,"y":47578,"fill":"actual"},{"x":39,"y":51507,"fill":"actual"},{"x":40,"y":59991,"fill":"actual"},{"x":41,"y":61774,"fill":"actual"},{"x":42,"y":68967,"fill":"actual"},{"x":43,"y":72769,"fill":"actual"},{"x":44,"y":77359,"fill":"actual"},{"x":45,"y":62751,"fill":"actual"},{"x":46,"y":62003,"fill":"actual"},{"x":47,"y":57430,"fill":"actual"},{"x":48,"y":54602,"fill":"actual"},{"x":49,"y":53371,"fill":"actual"},{"x":50,"y":59081,"fill":"actual"},{"x":51,"y":56647,"fill":"actual"},{"x":52,"y":62058,"fill":"actual"},{"x":53,"y":68554,"fill":"actual"},{"x":54,"y":71853,"fill":"actual"},{"x":55,"y":75182,"fill":"actual"},{"x":56,"y":71442,"fill":"actual"},{"x":57,"y":76237,"fill":"actual"},{"x":58,"y":66560,"fill":"actual"},{"x":59,"y":64901,"fill":"actual"},{"x":60,"y":57576,"fill":"actual"},{"x":2,"y":34752,"fill":"fitted"},{"x":3,"y":35286,"fill":"fitted"},{"x":4,"y":37397,"fill":"fitted"},{"x":5,"y":41359,"fill":"fitted"},{"x":6,"y":48840,"fill":"fitted"},{"x":7,"y":52738,"fill":"fitted"},{"x":8,"y":52423,"fill":"fitted"},{"x":9,"y":50237,"fill":"fitted"},{"x":10,"y":45340,"fill":"fitted"},{"x":11,"y":42269,"fill":"fitted"},{"x":12,"y":37827,"fill":"fitted"},{"x":13,"y":39470,"fill":"fitted"},{"x":14,"y":39459,"fill":"fitted"},{"x":15,"y":39954,"fill":"fitted"},{"x":16,"y":36411,"fill":"fitted"},{"x":17,"y":47262,"fill":"fitted"},{"x":18,"y":50044,"fill":"fitted"},{"x":19,"y":57444,"fill":"fitted"},{"x":20,"y":53429,"fill":"fitted"},{"x":21,"y":51794,"fill":"fitted"},{"x":22,"y":57735,"fill":"fitted"},{"x":23,"y":51322,"fill":"fitted"},{"x":24,"y":48896,"fill":"fitted"},{"x":25,"y":43000,"fill":"fitted"},{"x":26,"y":43471,"fill":"fitted"},{"x":27,"y":40989,"fill":"fitted"},{"x":28,"y":47890,"fill":"fitted"},{"x":29,"y":55283,"fill":"fitted"},{"x":30,"y":53020,"fill":"fitted"},{"x":31,"y":62527,"fill":"fitted"},{"x":32,"y":60255,"fill":"fitted"},{"x":33,"y":62957,"fill":"fitted"},{"x":34,"y":59351,"fill":"fitted"},{"x":35,"y":59824,"fill":"fitted"},{"x":36,"y":50425,"fill":"fitted"},{"x":37,"y":49316,"fill":"fitted"},{"x":38,"y":48187,"fill":"fitted"},{"x":39,"y":47994,"fill":"fitted"},{"x":40,"y":51957,"fill":"fitted"},{"x":41,"y":60515,"fill":"fitted"},{"x":42,"y":62314,"fill":"fitted"},{"x":43,"y":69570,"fill":"fitted"},{"x":44,"y":73405,"fill":"fitted"},{"x":45,"y":78035,"fill":"fitted"},{"x":46,"y":63300,"fill":"fitted"},{"x":47,"y":62545,"fill":"fitted"},{"x":48,"y":57932,"fill":"fitted"},{"x":49,"y":55079,"fill":"fitted"},{"x":50,"y":53838,"fill":"fitted"},{"x":51,"y":59598,"fill":"fitted"},{"x":52,"y":57142,"fill":"fitted"},{"x":53,"y":62601,"fill":"fitted"},{"x":54,"y":69153,"fill":"fitted"},{"x":55,"y":72481,"fill":"fitted"},{"x":56,"y":75839,"fill":"fitted"},{"x":57,"y":72067,"fill":"fitted"},{"x":58,"y":76904,"fill":"fitted"},{"x":59,"y":67142,"fill":"fitted"},{"x":60,"y":65468,"fill":"fitted"}],"geoms":["line"],"x":"month","y":"revenue","code":{"line":"ggplot(monthly60, aes(month, revenue, color = group)) +\n  geom_line()"}}

The two lines sit almost on top of each other for nearly the whole 60 months. That closeness is not evidence the model can forecast Northfield's revenue. It happens because every fitted point after the first is built from the real previous month's revenue, exactly like you just computed by hand. A fitted line hugging the real series this closely is what a one-step fitted value always looks like, not a sign the same model would do as well forecasting months it has never seen.

=== step === concept
## Proving it: fit on the past, forecast the future

So test it properly. Split Northfield's 60 months into a training window the model gets to see, 2020 through 2023, 48 months, and a test window it does not, all of 2024, 12 months.

```r
# Split Northfield into a training window (2020-2023) and a held-back test window (2024), then fit the same model on training only
train <- sales |> filter_index("2020 Jan" ~ "2023 Dec")
test <- sales |> filter_index("2024 Jan" ~ .)

fit_train <- model(train, drift = RW(log(revenue) ~ drift()))

accuracy(fit_train) |>
  as.data.frame() |>
  transmute(type = .type, RMSE = round(RMSE), MASE = round(MASE, 2))
#>      type RMSE MASE
#>  Training 5085 0.68
```

RMSE, root mean squared error, says fit_train missed by about $5,085 a month on average, in dollars. MASE, mean absolute scaled error, compares that miss to a naive benchmark, last month's value, computed on the same training data; under 1 means beating naive, and 0.68 looks like a genuinely good model. But every number so far still comes from the training data fit_train has already seen, so none of it has proven anything about forecasting new months yet.

Now forecast the 12 withheld months and score those forecasts against the real 2024 revenue.

```r
# Forecast 12 months ahead with fit_train, then score those forecasts against the real, withheld 2024 revenue
fc_train <- forecast(fit_train, h = 12)

accuracy(fc_train, sales) |>
  as.data.frame() |>
  transmute(type = .type, RMSE = round(RMSE), MASE = round(MASE, 2))
#>  type RMSE MASE
#>  Test 8329 1.13
```

RMSE nearly doubles, to $8,329 a month. MASE crosses 1, to 1.13, worse than the naive guess it was supposed to beat. The exact same model that looked excellent by its training numbers loses to the simplest possible benchmark the moment it has to forecast months it never saw.

That gap, 0.68 in-sample against 1.13 out-of-sample, is the whole point of this lesson. A close-fitting line proves nothing about forecast accuracy until it is checked against data the model never got to see while fitting.

=== step === quiz
## Quick check: what a good fit on training data actually proves

fit_train's fitted values tracked its training data almost exactly, with a training MASE of 0.68.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It will forecast well, since fit_train's own fit tracked the training data that closely. ::no
- It means .resid and .innov must already be identical for this model. ::no
- It says nothing about forecast accuracy until it is checked against data the model has never seen. ::ok Right. fit_train's training numbers, RMSE 5,085 and MASE 0.68, looked fine on their own. But forecasting the withheld 2024 months gave RMSE 8,329 and MASE 1.13, worse than a naive guess. A close fit on training data and real forecast accuracy are two separate questions, and training accuracy alone never answers the second one.
- It means fit_train needs more parameters to fit the training data even more closely. ::no A close training fit does not settle forecast skill either way, and it says nothing about which residual column to read or how many parameters a model needs. The only way to know if a model forecasts well is to test it against data it never saw while fitting, exactly what the train and test split just did.

=== step === concept
## Response residuals vs innovation residuals

Look again at those two residual columns, .resid and .innov, and see why fable keeps both instead of just one.

Pull out two single months, four years apart: March 2020 and March 2024.

```r
# Compare .resid (dollars) against .innov (log scale) for the same month, four years apart
mar_pair <- aug_full |>
  filter(month %in% yearmonth(c("2020 Mar", "2024 Mar"))) |>
  as_tibble() |>
  mutate(pct_of_revenue = round(.resid / revenue * 100, 1)) |>
  select(month, revenue, .fitted, .resid, .innov, pct_of_revenue)
mar_pair
#> # A tibble: 2 x 6
#>      month revenue .fitted .resid  .innov pct_of_revenue
#>      <mth>   <dbl>   <dbl>  <dbl>   <dbl>          <dbl>
#> 1 2020 Mar   37073  35286.   1787.  0.0494            4.8
#> 2 2024 Mar  56647.  59598.  -2951. -0.0508           -5.2
```

March 2020: revenue $37,073 against a fitted $35,286, a .resid of $1,787, about 4.8% of that month's revenue. March 2024: revenue $56,647 against a fitted $59,598, a .resid of -$2,951, about -5.2% of that month's revenue. In dollars those two misses are nowhere close, the 2024 one runs 65% bigger. But .innov barely moves, 0.049 against -0.051, almost the same size in either direction.

.innov is the miss measured on the scale the model actually fit, the logged scale, so it tracks the proportion the model got wrong, not the dollar amount. Revenue itself grew by more than half between those two Marches, $37,073 to $56,647, up 53%. So even a model that is equally right or wrong in proportional terms lands a bigger dollar residual on the later, bigger month, purely from that growth, not from the model getting worse.

See the same pattern hold across the whole series, not just these two months.

```r
# Compare the typical size of .resid (dollars) against .innov (log scale) across each year
aug_full |>
  as_tibble() |>
  filter(!is.na(.resid)) |>
  mutate(year = lubridate::year(as.Date(month))) |>
  group_by(year) |>
  summarise(mean_abs_resid = round(mean(abs(.resid))), mean_abs_innov = round(mean(abs(.innov)), 3), .groups = "drop")
#> # A tibble: 5 x 3
#>    year mean_abs_resid mean_abs_innov
#>   <dbl>          <dbl>          <dbl>
#> 1  2020           3119          0.071
#> 2  2021           4336          0.09
#> 3  2022           4042          0.077
#> 4  2023           4483          0.072
#> 5  2024           4601          0.071
```

mean_abs_resid climbs from about $3,119 in 2020 to $4,601 in 2024, right in step with revenue's own growth. mean_abs_innov barely moves, holding between about 0.07 and 0.09 across all five years, no matter how big the series gets. .resid is a dollar-scale summary, so it inflates as the series itself grows even when the model's proportional accuracy has not changed. .innov strips that scale effect out.

On a model with no transformation at all, fit directly to revenue, .resid and .innov are the same column. The split only matters, and only appears, once a model is fit on a transformed scale like this one.

=== step === widget
## Reading a residuals-vs-fitted plot the right way

See what that scale difference means for the shape of a residuals-vs-fitted plot, the standard diagnostic plot for checking a model's assumptions.

::widget residual-plot {"start":"funnel"}

This widget builds its own small example, a plain straight-line fit, not Northfield's data. But the funnel shape it shows is exactly what plotting .resid against .fitted would draw here too: since .resid grows with the series' level, exactly what you just measured, $3,119 to $4,601, it would fan out wider at the high end of the series, purely from the log transform, not because the model is failing. Switch a diagnostic plot like this one over to .innov instead and the funnel disappears, since .innov does not grow with the series' level. That is exactly why residual diagnostics get read off .innov, never off .resid, on any model fit on a transformed scale.

=== step === quiz
## Quick check: choosing the right residual

A colleague plots .resid against .fitted on a series that has been growing for years, sees a funnel widening to the right, and asks whether the model is broken.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, refit the model with more lagged terms; a funnel always signals a missed pattern. ::no
- Check .innov instead of .resid; on a model fit on a transformed scale, .resid naturally grows with the series' level even when the model is fine. ::ok Right. .resid is a dollar-scale miss, so on a series whose level is growing it naturally fans out even when the model's proportional accuracy has not changed at all, exactly what you measured earlier. .innov, on the log scale the model actually fit, does not carry that scale effect, which is why diagnostics read .innov instead.
- No, .resid and .innov are always identical, so the funnel does not matter. ::no
- No, funnel shapes are only a concern outside time series data. ::no The funnel shape is real and worth explaining, but neither of these gets there: .resid and .innov are only identical when a model carries no transformation, and a growing dollar-scale residual is exactly as much of a concern in time series as anywhere else. The fix is to read the right column, .innov, not to dismiss the shape or assume the model is broken.

=== step === tryit
## Your turn: confirm a fitted model's edge really holds on new data

train2 and test2 split Northfield's series differently, and fit2 is already fit on train2 alone.

```r
# train2/test2 split the series differently, and fit2 is already fit on train2 alone
train2 <- sales |> filter_index("2020 Jan" ~ "2022 Dec")
test2 <- sales |> filter_index("2023 Jan" ~ .)

fit2 <- model(train2, drift = RW(log(revenue) ~ drift()))

accuracy(fit2) |>
  as.data.frame() |>
  transmute(type = .type, RMSE = round(RMSE), MASE = round(MASE, 2))
#>      type RMSE MASE
#>  Training 4754 0.72

# fit2's training MASE is 0.72, printed above.
# Forecast the 24 held-back months in test2 with fit2, then score
# those forecasts against the real revenue in sales.
# Two lines: fc2 <- forecast(...), then accuracy(...).
# Press Check when you have them.
```
::check {"regex":"forecast[(]\\s*fit2\\s*,\\s*h\\s*=\\s*24\\s*[)][\\s\\S]*accuracy[(]","gate":true,"difficulty":"intermediate","ok":"Test MASE comes out at 1.3, worse than fit2's training MASE of 0.72, the same gap you already proved once in this lesson. A close fit on training data never told you how the model would do on months it had not seen; only a genuine forecast against withheld data answers that, and here it says fit2 loses to naive again.","no":"Call forecast(fit2, h = 24) to genuinely forecast the 24 withheld months, store the result, then pass it to accuracy() together with sales to score it against the real values."}
::solution
```r
# Forecast the 24 held-back months with fit2, then score those forecasts against the real revenue in sales
fc2 <- forecast(fit2, h = 24)

accuracy(fc2, sales) |>
  as.data.frame() |>
  transmute(type = .type, RMSE = round(RMSE), MASE = round(MASE, 2))
#>  type RMSE MASE
#>  Test 8903  1.3
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.3, Fitted values and residuals](https://otexts.com/fpp3/residuals.html) - Hyndman and Athanasopoulos (3rd ed.), the source for one-step fitted values and the response-versus-innovation residual split used in this lesson.
- [Forecasting: Principles and Practice, section 5.8, Evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) - Hyndman and Athanasopoulos (3rd ed.), the source for RMSE and MASE as used here.
- [fabletools package reference documentation for augment()](https://fabletools.tidyverts.org/reference/augment.html)
- [fabletools package reference documentation for accuracy() and its measures](https://fabletools.tidyverts.org/reference/accuracy.html)
- Hyndman, R.J. and Koehler, A.B. (2006), "Another look at measures of forecast accuracy," International Journal of Forecasting, 22(4), 679-688. The paper that introduced MASE.

=== step === complete
## What you can do now

You can now call augment() on a fitted mable and name what its three columns hold: .fitted, the model's one-step value built from the real previous observation, .resid, the plain dollar-scale miss, and .innov, the miss on the scale the model actually fit.

You know why a close-fitting line is not proof of forecast skill: a one-step fitted value always has a real number to build from, while a genuine forecast, past its first step, only has its own earlier guesses to build on. Splitting a series into a training window and a withheld test window is the only way to find out which one you actually have.

And you can pick the right residual for checking a model's assumptions: .innov, never .resid, on any model fit on a transformed scale, since .resid inflates with the series' own level while .innov does not.

The next lesson checks whether a model's residuals actually behave like noise.

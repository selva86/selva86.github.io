---
title: "Time Series Regression Lesson 6: Spurious regression and how to avoid it"
catalog_blurb: "How two completely unrelated trending series can look strongly related, and the fix."
description: "Two unrelated trending series can produce a huge R-squared by chance. See the residual ACF alarm, then fix it by differencing or modelling the errors instead."
keywords: "spurious regression, non-stationary time series, random walk, unit root, residual ACF, Durbin-Watson test, differencing a time series, dynamic regression, ARIMA errors, TSLM in R"
post_type: "LESSON"
curriculum_id: "5.40.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-regression"
course_title: "Time Series Regression"
course_lesson: "6"
course_total: "6"
course_landing: "Time-Series-Regression-Course.html"
course_next: ""
course_prev: "Selecting-Predictors-with-Cross-Validation.html"
---

=== step === cover
## Spurious regression and how to avoid it

Today let's understand spurious regression: how two series with nothing real connecting them can still move together so closely that a regression between them looks like undeniable evidence, and how to catch it before it fools you.

Thistle and Vine is a small bakery chain. Nimbus is a fitness app. They share no supplier, no customers, no season, nothing that would tie one to the other.

But watch their numbers over the same 60 months, January 2021 to December 2025: Thistle and Vine's monthly revenue climbs from $40,181 to $50,120, and Nimbus's monthly paying subscribers climb from 1,492 to 2,183. Below, both series are indexed to start at 100, so a dollar figure and a headcount can share one chart.

::widget chart-plotter {"data":[{"x":1,"y":100,"fill":"revenue"},{"x":2,"y":101.1,"fill":"revenue"},{"x":3,"y":102.1,"fill":"revenue"},{"x":4,"y":100.9,"fill":"revenue"},{"x":5,"y":100.8,"fill":"revenue"},{"x":6,"y":101.8,"fill":"revenue"},{"x":7,"y":101.7,"fill":"revenue"},{"x":8,"y":101.5,"fill":"revenue"},{"x":9,"y":102.2,"fill":"revenue"},{"x":10,"y":104.2,"fill":"revenue"},{"x":11,"y":104.2,"fill":"revenue"},{"x":12,"y":105.7,"fill":"revenue"},{"x":13,"y":105.7,"fill":"revenue"},{"x":14,"y":106.2,"fill":"revenue"},{"x":15,"y":106.1,"fill":"revenue"},{"x":16,"y":106.5,"fill":"revenue"},{"x":17,"y":106.1,"fill":"revenue"},{"x":18,"y":105.4,"fill":"revenue"},{"x":19,"y":105.7,"fill":"revenue"},{"x":20,"y":105.2,"fill":"revenue"},{"x":21,"y":106.4,"fill":"revenue"},{"x":22,"y":107.4,"fill":"revenue"},{"x":23,"y":107.6,"fill":"revenue"},{"x":24,"y":108.4,"fill":"revenue"},{"x":25,"y":108.9,"fill":"revenue"},{"x":26,"y":108.4,"fill":"revenue"},{"x":27,"y":107.7,"fill":"revenue"},{"x":28,"y":108.4,"fill":"revenue"},{"x":29,"y":108,"fill":"revenue"},{"x":30,"y":109.5,"fill":"revenue"},{"x":31,"y":109.4,"fill":"revenue"},{"x":32,"y":110.2,"fill":"revenue"},{"x":33,"y":110.4,"fill":"revenue"},{"x":34,"y":111,"fill":"revenue"},{"x":35,"y":110.6,"fill":"revenue"},{"x":36,"y":111.5,"fill":"revenue"},{"x":37,"y":112.4,"fill":"revenue"},{"x":38,"y":113.8,"fill":"revenue"},{"x":39,"y":113.2,"fill":"revenue"},{"x":40,"y":113.5,"fill":"revenue"},{"x":41,"y":114,"fill":"revenue"},{"x":42,"y":115,"fill":"revenue"},{"x":43,"y":115.9,"fill":"revenue"},{"x":44,"y":115.8,"fill":"revenue"},{"x":45,"y":116.2,"fill":"revenue"},{"x":46,"y":116.6,"fill":"revenue"},{"x":47,"y":116.2,"fill":"revenue"},{"x":48,"y":116.9,"fill":"revenue"},{"x":49,"y":117.5,"fill":"revenue"},{"x":50,"y":117.1,"fill":"revenue"},{"x":51,"y":118.4,"fill":"revenue"},{"x":52,"y":118.2,"fill":"revenue"},{"x":53,"y":120.4,"fill":"revenue"},{"x":54,"y":121.3,"fill":"revenue"},{"x":55,"y":120.2,"fill":"revenue"},{"x":56,"y":121.5,"fill":"revenue"},{"x":57,"y":122.2,"fill":"revenue"},{"x":58,"y":122.6,"fill":"revenue"},{"x":59,"y":123.7,"fill":"revenue"},{"x":60,"y":124.7,"fill":"revenue"},{"x":1,"y":100,"fill":"subscribers"},{"x":2,"y":99.5,"fill":"subscribers"},{"x":3,"y":99.1,"fill":"subscribers"},{"x":4,"y":96.4,"fill":"subscribers"},{"x":5,"y":94.3,"fill":"subscribers"},{"x":6,"y":96.4,"fill":"subscribers"},{"x":7,"y":98.6,"fill":"subscribers"},{"x":8,"y":101.5,"fill":"subscribers"},{"x":9,"y":102.9,"fill":"subscribers"},{"x":10,"y":104.9,"fill":"subscribers"},{"x":11,"y":107.8,"fill":"subscribers"},{"x":12,"y":109.2,"fill":"subscribers"},{"x":13,"y":113.9,"fill":"subscribers"},{"x":14,"y":115,"fill":"subscribers"},{"x":15,"y":111.9,"fill":"subscribers"},{"x":16,"y":113.2,"fill":"subscribers"},{"x":17,"y":115.2,"fill":"subscribers"},{"x":18,"y":118,"fill":"subscribers"},{"x":19,"y":119.3,"fill":"subscribers"},{"x":20,"y":119.6,"fill":"subscribers"},{"x":21,"y":119.8,"fill":"subscribers"},{"x":22,"y":118.8,"fill":"subscribers"},{"x":23,"y":119.1,"fill":"subscribers"},{"x":24,"y":116.2,"fill":"subscribers"},{"x":25,"y":117.2,"fill":"subscribers"},{"x":26,"y":117.4,"fill":"subscribers"},{"x":27,"y":115.1,"fill":"subscribers"},{"x":28,"y":115.5,"fill":"subscribers"},{"x":29,"y":118.5,"fill":"subscribers"},{"x":30,"y":119,"fill":"subscribers"},{"x":31,"y":122.1,"fill":"subscribers"},{"x":32,"y":122.4,"fill":"subscribers"},{"x":33,"y":122.8,"fill":"subscribers"},{"x":34,"y":123.9,"fill":"subscribers"},{"x":35,"y":124.9,"fill":"subscribers"},{"x":36,"y":128.5,"fill":"subscribers"},{"x":37,"y":129.5,"fill":"subscribers"},{"x":38,"y":130.1,"fill":"subscribers"},{"x":39,"y":126.9,"fill":"subscribers"},{"x":40,"y":129.4,"fill":"subscribers"},{"x":41,"y":130,"fill":"subscribers"},{"x":42,"y":128.7,"fill":"subscribers"},{"x":43,"y":131.6,"fill":"subscribers"},{"x":44,"y":135.5,"fill":"subscribers"},{"x":45,"y":136.7,"fill":"subscribers"},{"x":46,"y":136.6,"fill":"subscribers"},{"x":47,"y":136.3,"fill":"subscribers"},{"x":48,"y":136.3,"fill":"subscribers"},{"x":49,"y":138.4,"fill":"subscribers"},{"x":50,"y":136.8,"fill":"subscribers"},{"x":51,"y":137.6,"fill":"subscribers"},{"x":52,"y":135.9,"fill":"subscribers"},{"x":53,"y":139.7,"fill":"subscribers"},{"x":54,"y":139.7,"fill":"subscribers"},{"x":55,"y":138.7,"fill":"subscribers"},{"x":56,"y":142.2,"fill":"subscribers"},{"x":57,"y":144.5,"fill":"subscribers"},{"x":58,"y":143.5,"fill":"subscribers"},{"x":59,"y":143.8,"fill":"subscribers"},{"x":60,"y":146.3,"fill":"subscribers"}],"geoms":["line"],"x":"month","y":"indexed value","code":{"line":"ggplot(indexed, aes(x = month, y = index_value, colour = series, group = series)) + geom_line(linewidth = 1)"}}

Look at how closely the two lines track each other, climbing in the same wobbly, drifting way, even though a bakery chain and a fitness app have nothing to do with one another.

=== step === concept
## Two businesses with nothing in common

Let's build both series exactly as they happened. Thistle and Vine's revenue starts at $40,181 in January 2021. Every month after that, revenue moves by a random amount, on average $160 up, but with swings of about $300 either way, so plenty of months dip instead of climb. Nimbus's subscriber count is built the same way, starting at 1,492, moving by a random amount every month too, on average up by 9 subscribers, with swings of about 25 either way.

Neither series knows anything about the other. Whatever moves revenue in a given month, a slow Tuesday or a marketing push, has nothing to do with whatever moves Nimbus's subscriber count that same month. The two are built from separate random number streams, and a bakery chain and a fitness app share no supplier, no customer base and no season that could quietly link them.

```r
# Build Thistle and Vine's revenue and Nimbus's subscribers as two separate random walks, then combine them into one tsibble
library(tsibble)

set.seed(348)
revenue <- round((cumsum(rnorm(60, mean = 1.6, sd = 3)) + 400) * 100)

set.seed(10348)
subs <- round((cumsum(rnorm(60, mean = 0.9, sd = 2.5)) + 150) * 10)

df <- tsibble(
  month = yearmonth("2021 Jan") + 0:59,
  revenue = revenue,
  subs = subs,
  index = month
)

head(df, 3)
#> # A tsibble: 3 x 3 [1M]
#>      month revenue  subs
#>      <mth>   <dbl> <dbl>
#> 1 2021 Jan   40181  1492
#> 2 2021 Feb   40636  1484
#> 3 2021 Mar   41032  1478
tail(df, 3)
#> # A tsibble: 3 x 3 [1M]
#>      month revenue  subs
#>      <mth>   <dbl> <dbl>
#> 1 2025 Oct   49278  2141
#> 2 2025 Nov   49714  2146
#> 3 2025 Dec   50120  2183
```

By December 2025, revenue has reached $50,120 and subscribers have reached 2,183. Notice the first three rows though: subscribers actually dip slightly, from 1,492 down to 1,478, before turning around and climbing for the rest of the 60 months. That is exactly what a random monthly step looks like. It does not march straight up, it wanders, sometimes backward, before the upward drift wins out over the long run.

=== step === concept
## What an r of 0.97 does not tell you

Now let's measure how closely these two unrelated series move together.

```r
# Correlation between revenue and subs
round(cor(revenue, subs), 3)
#> [1] 0.97
```

0.97, almost as strong as two variables can look. To see why that number is so misleading here, you need one new term.

A series like this one, where each month's value is last month's value plus a random step, is called a **random walk**. Revenue is a random walk: revenue in March is revenue in February plus that month's random step, and so on back to January. Subscribers work the same way.

Most variables you would compute a mean or a correlation for are stationary: they wander around one fixed level, the way a thermostat holds a room near 70 degrees. A random walk is not stationary. It has no fixed level to return to, so its value 60 months out depends on the sum of 60 random steps, and where it lands owes everything to which of those steps happened to fall up or down along the way.

That is exactly why two random walks, each free to wander with no anchor pulling it back, have far more room to end up drifting in the same direction over any one stretch than two ordinary, stable variables would. Neither series here causes the other, and neither predicts the other. They simply both happen to have a positive average step, an upward drift, so both climb overall, and over any one 60-month run, two climbing series can line up closely purely by chance.

To see this was not a one-off fluke of this particular pair, build a second, completely unrelated pair of random walks with different seeds and check their correlation too.

```r
# A second, unrelated pair of random walks, built with different seeds
set.seed(999)
r2 <- cumsum(rnorm(60, mean = 1.2, sd = 3))

set.seed(4242)
r3 <- cumsum(rnorm(60, mean = 0.8, sd = 2))

round(cor(r2, r3), 3)
#> [1] 0.925
```

0.925, again from two series with nothing to do with each other beyond both drifting upward on average. This is not bad luck striking twice. It is what random walks do.

=== step === concept
## Reading the regression's coefficients and fit statistics

So what happens if you actually fit a regression between the two? Regress Nimbus's subscribers on Thistle and Vine's revenue with `TSLM()`, fable's time series linear model, and read what `report()` hands back.

```r
# Fit subs as a linear function of revenue, then read the fit
library(fable)
library(fabletools)

fit <- df |> model(TSLM(subs ~ revenue))
report(fit)
#> Series: subs 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -111.221  -30.624   -5.042   35.048  129.285 
#> 
#> Coefficients:
#>               Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) -1.562e+03  1.121e+02  -13.93   <2e-16 ***
#> revenue      7.608e-02  2.516e-03   30.24   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 52.21 on 58 degrees of freedom
#> Multiple R-squared: 0.9404,	Adjusted R-squared: 0.9393
#> F-statistic: 914.7 on 1 and 58 DF, p-value: < 2.22e-16
```

Read the slope first: 0.0761. For every extra dollar of Thistle and Vine's monthly revenue, this fit says Nimbus's subscriber count rises by 0.0761. Its standard error, 0.00252, is tiny next to the slope itself, giving a t-value of 30.24, meaning the slope sits more than 30 standard errors away from zero. The p-value that goes with it, listed as under 2e-16, is far below any threshold anyone uses to call a result significant.

Multiple R-squared, 0.9404, says the line explains 94% of the month-to-month variation in subscribers. Adjusted R-squared, which corrects for the number of predictors, agrees at 0.9393. The F-statistic, 914.7, tests whether the whole model beats a flat line, and its p-value again sits below 2.22e-16.

Every number in that table tells the same story: an unmistakably strong, unmistakably significant fit. Judged only by these rules, this looks like a slam dunk. That is exactly the trap.

=== step === widget
## What a broken residual plot looks like

Before going back to Thistle and Vine's own residuals, let's build the eye test for reading any residual plot, using a separate, generic example, not the bakery or the fitness app.

A residual is the gap between what a fit predicted and what actually happened. If a fit has captured everything it should, its residuals should look boring: a flat, even scatter with no pattern, wobbling around zero by about the same amount everywhere.

Two shapes below are warnings instead. A funnel means the residuals spread wider as the fitted value grows. A curve means the residuals bow up or down instead of scattering flat, a sign the fit missed a bend in the real relationship.

Neither shape is literally what Thistle and Vine's regression looks like. They are here to train your eye before you look at the real thing.

::widget residual-plot {"start":"healthy"}

Toggle between Healthy, Funnel and Curved above to get a feel for each shape. Healthy is what every fit should aim for; Funnel and Curved are both alarms, just different ones. Now let's go back and see what Thistle and Vine's own residuals actually look like.

=== step === concept
## Reading this regression's residual ACF

A high R-squared and a huge t-value both came from the same residuals. Let's look at those residuals directly, the way the widget above just taught you to.

Start with the ACF, short for autocorrelation function. It measures how strongly each residual correlates with the residual some number of months before it, called a lag. Lag 1 is the correlation between each residual and the one right before it, lag 2 is two months back, and so on. For truly random residuals, every one of these correlations should sit close to zero.

```r
# Correlate the regression's residuals with their own past values, lag by lag
resid_vals <- residuals(fit)$.resid

round(acf(resid_vals, lag.max = 10, plot = FALSE)$acf[-1], 3)
#>  [1]  0.809  0.612  0.448  0.312  0.196  0.087 -0.023 -0.076 -0.083 -0.124
```

Lag 1 alone is 0.809, nowhere near zero: a residual that is high one month is very likely to still be high the next month. Lags 2, 3 and 4 are 0.612, 0.448 and 0.312, still large, only fading slowly.

To judge whether a lag is large enough to worry about, compare it against a significance band, roughly plus or minus 1.96 divided by the square root of the number of months.

```r
# The rough significance band for 60 months of data
round(1.96 / sqrt(60), 3)
#> [1] 0.253
```

Any lag inside plus-or-minus 0.253 is the kind of small wobble truly random residuals would produce anyway. Lags 1 through 4, at 0.809, 0.612, 0.448 and 0.312, all sit far outside that band. The residual plot the widget above taught you to read as boring is anything but boring here.

There is a second way to see the same alarm: the lag-1 correlation on its own, and one number built from it, the Durbin-Watson-style statistic, the summed squared gap between each residual and the one right after it, divided by the summed squared residuals.

```r
# Lag-1 correlation, then the Durbin-Watson-style statistic built from it
round(cor(resid_vals[-length(resid_vals)], resid_vals[-1]), 3)
#> [1] 0.821

round(sum(diff(resid_vals)^2) / sum(resid_vals^2), 3)
#> [1] 0.352
```

When neighbouring residuals are unrelated, this statistic sits near 2. When they move together the way these do, it drops toward 0. At 0.352, it is about as far from 2 as this statistic gets. The `lmtest` package's `dwtest()` runs the same idea formally and agrees.

```r
# The formal Durbin-Watson test needs a plain lm() fit
library(lmtest)

subs_df <- as.data.frame(df)
lm_fit <- lm(subs ~ revenue, data = subs_df)
dwtest(lm_fit)
#> 
#> 	Durbin-Watson test
#> 
#> data:  lm_fit
#> DW = 0.35243, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

Same alarm, formal test: DW = 0.352, p-value far below 2.2e-16. The ACF's first four lags, the lag-1 correlation, the Durbin-Watson-style statistic and the formal test all agree. The regression table you just read looked like overwhelming proof. These residuals say the opposite: something is very wrong with this fit.

=== step === widget
## Why an impressive result can still be pure chance

The earlier numbers, r = 0.97, t = 30.24, look almost too strong to be an accident. But strong-looking results can still happen by pure chance, and the best way to feel that in your bones is to watch chance produce one.

Picture a guesser with no real skill at all, right about half the time purely by luck, guessing on 10 questions. Getting 9 or 10 right by pure luck is rare, but rare is not the same as impossible, and the widget below lets you watch how often it happens.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses"}

Press Run a few times. Every bar counts how many pure-luck guessers landed on that score out of 10, and the highlighted bars mark 9 and 10. Most guessers land in the middle, near 5, but every so often one lands out at 9 or 10 on nothing but luck.

The same logic scales up to Thistle and Vine and Nimbus, just with far more room to work with. A guesser only has 10 independent coin flips to draw on. A random walk over 60 months has 60 independent random steps stacking up, with no fixed mean pulling either series back toward a stable level.

That gives two unrelated random walks far more room to drift the same direction over one 60-month run than two ordinary, stable variables would ever have. r = 0.97 and t = 30.24 are not proof that Thistle and Vine's revenue drives Nimbus's subscribers. They are what happens when two series that are each free to wander happen to wander the same way.

=== step === quiz
## Quick check: reading the fit and the alarm together

Thistle and Vine's fit came back with R-squared = 0.940 and t = 30.24. Its residuals came back with an ACF that breaks the significance band through lag 4 and a Durbin-Watson-style statistic of 0.352. Put those two readings together. What do they actually tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The R-squared of 0.940 alone settles it: a fit that strong is real evidence of a relationship, no matter what the residuals show. ::no
- A very strong-looking fit paired with heavily autocorrelated residuals is the signature of a spurious regression between two trending series, not evidence of a real link. ::ok Exactly. R-squared and t measure how closely the line tracks the data, nothing more. The ACF and the Durbin-Watson-style statistic check something the fit statistics cannot: whether the residuals still look boring. Here they say the fit only looks convincing because both series are trending together by chance.
- The low Durbin-Watson-style statistic just means the model needs more predictors to soak up the pattern left in the residuals. ::no
- A p-value below 2e-16 overrides any concern about the residuals; a result that significant cannot be spurious. ::no A high R-squared and a tiny p-value only say the line tracks the data closely, they say nothing about whether the residuals still look boring. A Durbin-Watson-style statistic of 0.352 means the residuals are heavily autocorrelated, exactly the pattern two independent trending series produce, and no amount of significance in the fit statistics excuses that. Adding predictors does not fix it either: the problem is that both series trend on their own, not that the model is missing a variable.

=== step === concept
## Fixing it by differencing both series

Now for the fix. The problem is that both series trend upward on their own, so their levels drift together even with nothing tying them. Differencing removes exactly that: instead of each month's level, it looks at each month's change from the month before. `diff(x)` turns 60 monthly levels into 59 month-to-month changes.

A month-to-month change in a random walk is just that month's random step, the same kind of value every month, with no running trend left to drift. Difference both series and refit.

```r
# Turn levels into month-to-month changes, then refit on the differenced series
d_revenue <- diff(revenue)
d_subs <- diff(subs)

df2 <- tsibble(
  month = yearmonth("2021 Feb") + 0:58,
  d_revenue = d_revenue,
  d_subs = d_subs,
  index = month
)

fit_d <- df2 |> model(TSLM(d_subs ~ d_revenue))
report(fit_d)
#> Series: d_subs 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -59.287 -15.299  -1.435  19.472  61.100 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)  
#> (Intercept)  7.68452    4.09877   1.875   0.0659 .
#> d_revenue    0.02391    0.01224   1.953   0.0557 .
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 27.21 on 57 degrees of freedom
#> Multiple R-squared: 0.06273,	Adjusted R-squared: 0.04629
#> F-statistic: 3.815 on 1 and 57 DF, p-value: 0.055715
```

Compare this table with the earlier one, side by side. R-squared collapsed from 0.940 to 0.063. The slope's t-value dropped from 30.24 to 1.953, and its p-value went from far below 2e-16 to 0.0557, above the usual 0.05 cutoff for calling a result significant. Correlation on the differenced series tells the same story.

```r
# Correlation between the differenced series
round(cor(d_revenue, d_subs), 3)
#> [1] 0.25
```

0.25, down from 0.97. Once the trend each series carries on its own is removed, almost all of the apparent relationship goes with it. The residuals confirm the fix worked, not just the fit statistics.

```r
# Recheck the ACF and the Durbin-Watson-style statistic on the new fit's residuals
resid_d <- residuals(fit_d)$.resid

round(acf(resid_d, lag.max = 10, plot = FALSE)$acf[-1], 3)
#>  [1]  0.078 -0.086  0.000 -0.039 -0.028 -0.078 -0.071 -0.137 -0.019 -0.076

round(sum(diff(resid_d)^2) / sum(resid_d^2), 3)
#> [1] 1.819
```

Every one of these 10 lags sits inside the roughly plus-or-minus 0.255 band for 59 residuals; none of the earlier lag-1-through-4 alarm survives. The Durbin-Watson-style statistic is now 1.819, close to the 2 that unrelated residuals give, instead of 0.352. The apparent relationship between revenue and subscribers is gone, and it is gone because it was never really there. Differencing did not destroy anything real; it removed the shared upward drift that was faking one.

=== step === concept
## Fixing it by modelling the errors instead

There is a second way to fix this, without differencing anything by hand yourself. Instead of feeding the model already-differenced data, fit it on the original, undifferenced revenue and subs, but tell it that its errors, not the raw data, need one difference. That is what `ARIMA(subs ~ revenue + pdq(0,1,0))` does: `pdq(0,1,0)` says take the AR order 0, difference the errors once, and take the MA order 0. Fitting a regression this way, where the leftover errors are modelled instead of assumed to already behave, is called **dynamic regression**.

```r
# Fit subs on revenue, telling the model its errors need one difference
fit_dyn <- df |> model(ARIMA(subs ~ revenue + pdq(0, 1, 0)))
report(fit_dyn)
#> Series: subs 
#> Model: LM w/ ARIMA(0,1,0) errors 
#> 
#> Coefficients:
#>       revenue  intercept
#>        0.0239     7.6845
#> s.e.   0.0120     4.0287
#> 
#> sigma^2 estimated as 740.4:  log likelihood=-277.61
#> AIC=561.22   AICc=561.66   BIC=567.45
```

`report()` gives the estimate and the standard error, but not the t-value or the p-value directly. Pull those from `coef()`.

```r
# Pull the t-value and p-value for the revenue coefficient
coef(fit_dyn)
#> # A tibble: 2 × 6
#>   .model                              term  estimate std.error statistic p.value
#>   <chr>                               <chr>    <dbl>     <dbl>     <dbl>   <dbl>
#> 1 ARIMA(subs ~ revenue + pdq(0, 1, 0… reve…   0.0239    0.0120      1.99  0.0516
#> 2 ARIMA(subs ~ revenue + pdq(0, 1, 0… inte…   7.68      4.03        1.91  0.0613
```

Revenue's coefficient is 0.0239, standard error 0.0120, t-value 1.99, p-value 0.0516. Compare that with the differenced regression: a slope of 0.0239, t = 1.95, p = 0.0557. The two fixes land on almost exactly the same honest answer, even though this one never touched `diff()`.

That is not a coincidence. Both fixes correct the same underlying problem, that the errors carry a trend of their own, just in two different places.

Differencing removes the trend from the data before fitting. Dynamic regression leaves the data alone and removes the trend from the model's errors instead. Either way, once that shared drift is accounted for, revenue's real connection to subscribers turns out to be too weak to call significant.

=== step === quiz
## Quick check: what differencing actually proved

Thistle and Vine's original fit gave t = 30.24 and R-squared = 0.940, backed by residuals that were anything but boring. After differencing, the same two series gave t = 1.95 and R-squared = 0.063, and the dynamic regression, fit on the original undifferenced data, landed on almost the same honest answer, t = 1.99. What do those numbers together actually prove?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The collapse from t = 30.24 to t = 1.95, confirmed again by the dynamic regression's t = 1.99, shows the original fit was an artifact of two trending series, not a real link that differencing destroyed. ::ok Right. Two independent fixes, one differencing the data, one modelling the errors, land on the same weak, insignificant answer. That agreement is what tells you the original t = 30.24 was never measuring a real connection between revenue and subscribers.
- Differencing destroyed a real relationship that existed in the levels; the honest answer was the original t = 30.24. ::no
- p = 0.0557 after differencing is still clear, significant proof of a real relationship between revenue and subscribers. ::no
- The drop in R-squared and t only reflects one fewer row of data after differencing, not a real change in the relationship. ::no Losing one row out of 60 could never turn a t of 30.24 into a t of 1.95. And a p-value of 0.0557 sits just above the usual 0.05 cutoff, so it does not count as significant by the same rule that called the original fit convincing. The dynamic regression, fit on all 60 original rows with no row dropped, reached the same weak answer, which is why the honest reading is that the original relationship was never really there.

=== step === tryit
## Your turn: catch and fix a second spurious regression

Your turn. Solstice Candle Co. and Harborview Aquarium share nothing either, a candle maker and a ticket booth at an aquarium. Both series below are already built and already correlating strongly in their levels, 48 unrelated months each.

```r
# Solstice Candle Co.'s monthly revenue and Harborview Aquarium's monthly ticket sales, 48 unrelated months each
set.seed(777)
c_rev <- round((cumsum(rnorm(48, mean = 1.3, sd = 2.6)) + 300) * 80)

set.seed(5777)
c_tix <- round((cumsum(rnorm(48, mean = 0.7, sd = 2.0)) + 90) * 15)

round(cor(c_rev, c_tix), 3)
#> [1] 0.942
```

0.942, just as strong-looking as Thistle and Vine's 0.97. Now fix it yourself: difference both `c_rev` and `c_tix`, then fit a regression, `lm()` or `TSLM()`, on the two differenced vectors, and see how much of that relationship survives.

```r
# c_rev and c_tix are already built. Difference both, then fit a regression
# (lm() or TSLM()) on the two differenced vectors.
# Two or three lines. Press Check when you have it.
```
::check {"regex":"(?=[\\s\\S]*diff[(]c_rev)(?=[\\s\\S]*diff[(]c_tix)(?=[\\s\\S]*(lm[(]|TSLM[(]))","gate":true,"difficulty":"intermediate","ok":"Right: the correlation drops to 0.088 and the slope's t-value comes out at 0.592, p = 0.557, nowhere near significant. Just like Thistle and Vine, the strong-looking level correlation was two unrelated trends drifting together.","no":"Call diff(c_rev) and diff(c_tix) to build the differenced vectors, then fit a regression between them: lm(diff(c_tix) ~ diff(c_rev)) is the simplest way."}
::solution
```r
# Difference both series, then refit a regression on the differenced values
d_c_rev <- diff(c_rev)
d_c_tix <- diff(c_tix)

fit_c_d <- lm(d_c_tix ~ d_c_rev)
summary(fit_c_d)
#> 
#> Call:
#> lm(formula = d_c_tix ~ d_c_rev)
#> 
#> Residuals:
#>    Min     1Q Median     3Q    Max 
#> -65.01 -14.48   1.74  15.39  53.73 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)  
#> (Intercept) 11.04356    4.20753   2.625   0.0118 *
#> d_c_rev      0.01056    0.01782   0.592   0.5566  
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 25.21 on 45 degrees of freedom
#> Multiple R-squared:  0.007736,	Adjusted R-squared:  -0.01431 
#> F-statistic: 0.3508 on 1 and 45 DF,  p-value: 0.5566

round(cor(d_c_rev, d_c_tix), 3)
#> [1] 0.088
```

=== step === concept
## References

- Granger, C.W.J. and Newbold, P. (1974), "Spurious Regressions in Econometrics," Journal of Econometrics, 2(2), 111-120. The original paper that named and demonstrated the problem.
- Phillips, P.C.B. (1986), "Understanding Spurious Regressions in Econometrics," Journal of Econometrics, 33(3), 311-340. The formal explanation of why it happens.
- [Forecasting: Principles and Practice, chapter 10, Dynamic regression models](https://otexts.com/fpp3/dynamic.html) - Hyndman and Athanasopoulos (3rd ed.), the source for dynamic regression and modelling the errors instead of the data.
- [fable package reference documentation for ARIMA()](https://fable.tidyverts.org/reference/ARIMA.html) - the regression-with-ARIMA-errors interface used in this lesson.
- [tsibble package reference documentation for difference()](https://tsibble.tidyverts.org/reference/difference.html)

=== step === complete
## What you can do now

You have now seen the whole arc. Two series with nothing tying them together, a bakery chain's revenue and a fitness app's subscriber count, correlated at 0.97 purely because both happened to be random walks drifting upward over the same 60 months. Regressed against each other, they produced a textbook-looking fit: R-squared 0.940, t = 30.24, a p-value far below any threshold anyone uses.

But the residuals told the real story. Their ACF broke the significance band through lag 4, their lag-1 correlation sat at 0.821, and the Durbin-Watson-style statistic came in at 0.352, nowhere near the 2 that boring, independent residuals give. The luck-simulator widget was a reminder why: a result that looks rare and impressive can still be exactly what chance produces, especially when two series are each free to wander with no fixed level pulling them back.

You fixed it two ways. Differencing both series, turning levels into month-to-month changes, dropped the correlation to 0.25 and the t-value to 1.95. Dynamic regression, fitting the original series while modelling the errors as needing one difference, reached almost the same honest answer, t = 1.99, without differencing anything by hand. Both agree: the relationship was never really there.

You can now read a regression's fit statistics alongside its residual ACF and Durbin-Watson-style statistic, recognise when a strong fit is actually a spurious regression between two trending series, and fix it either by differencing the data or by letting a dynamic regression model the errors instead.

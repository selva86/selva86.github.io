---
title: "Time Series Anomaly Detection in R: tsoutliers, anomalize"
slug: "Anomaly-Detection-in-Time-Series-in-R"
description: "Detect anomalies in time series with R. Learn the tsoutliers tso() procedure, the anomalize pipeline, additive outliers vs level shifts, and IQR vs GESD tuning."
keywords: "time series anomaly detection in R, tsoutliers R package, anomalize R package, tso function R, level shift detection, additive outlier, GESD anomaly detection, IQR outlier detection, outlier detection time series"
auto_link_terms: "time series anomaly detection|anomaly detection in time series|tsoutliers|anomalize|tso()|level shift|additive outlier|temporary change|GESD|time_decompose()|time_recompose()|detect outliers in a time series|structural break"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-7"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Anomaly Detection"
sidebar_order: "28"
difficulty: "Intermediate"
---

<p class="lead">Time series anomaly detection finds points that break the pattern a series has already established, judging each observation against its own trend and season rather than against the overall mean. In R the tsoutliers package fits an ARIMA model and names each anomaly's shape, telling a one-off spike apart from a permanent level shift, while the anomalize package decomposes a tidy data frame and flags unusual remainders across one series or hundreds at a time.</p>

## Why can't a plain z-score find anomalies in a time series?

The Nile has been measured at Aswan every year since 1871, and its most famous feature is a permanent drop in flow around the turn of the century. Ask a z-score to find it and you get nothing at all. That failure is the whole reason time series anomaly detection is a separate subject, so it is worth watching it happen.

A z-score is the standard textbook outlier test. You take each value, subtract the mean of the series, divide by the standard deviation, and flag anything more than three standard deviations away. The `Nile` dataset ships with R, so you can run this right now.

```r title="Score the Nile flow series with a z-score"
# Nile: the river's annual flow at Aswan, 1871 to 1970, in 100 million cubic metres
nile_z <- (Nile - mean(Nile)) / sd(Nile)

sum(abs(nile_z) > 3)          # how many years sit 3+ standard deviations from the mean?
#> [1] 0

round(max(abs(nile_z)), 2)    # the single most extreme year, measured in standard deviations
#> [1] 2.74
```

Read that carefully. `sum(abs(nile_z) > 3)` counts the years whose z-score is bigger than 3 in either direction, and the answer is zero. The second line asks for the most extreme year in the whole century, and even that one is only 2.74 standard deviations out. By the textbook rule, this series is completely clean.

It is not clean. Plot it and the problem is obvious.

```r title="Plot the Nile series and mark 1899"
plot(Nile,
     main = "Annual Nile flow at Aswan, 1871 to 1970",
     ylab = "Flow (100 million cubic metres)",
     xlab = "Year",
     col = "grey30")
abline(v = 1899, col = "firebrick", lty = 2, lwd = 2)
```

*Figure 1: The Nile series drops to a visibly lower level after 1899 and never recovers. Construction of the Aswan Low Dam began in 1898.*

The series does not have a spike. It has a **step**. Everything after the dashed line lives at a lower level than everything before it, permanently. Let us put a number on it.

```r title="Compare the mean before and after 1899"
round(mean(window(Nile, end = 1898)))     # average flow up to 1898
#> [1] 1098

round(mean(window(Nile, start = 1899)))   # average flow from 1899 onwards
#> [1] 850

round(sd(Nile))                           # spread of the whole series
#> [1] 169
```

`window()` cuts a slice out of a time series by date, so the first line averages every year up to 1898 and the second averages every year from 1899 on. The gap is 248 units, which is about one and a half standard deviations of the whole series.

Here is why the z-score missed it. The mean it subtracts, roughly 1,098 before the break and 850 after, is a single blended number computed from both halves at once. Every individual year sits close to that blend, because the shift is smaller than the year-to-year noise. No single point is extreme. The *pattern* is extreme, and a z-score cannot see patterns.

[KEY INSIGHT]
**A z-score has no memory of when a point happened.** Shuffle the years into random order and the z-scores come out identical, which tells you the test is throwing away the only thing that makes a time series a time series.

Trend is one way a series hides its anomalies. Season is the other, and for that we need data with a repeating cycle. The `anomalize` package ships with 425 days of real CRAN download counts for 15 tidyverse packages, which is exactly that kind of data.

```r title="Load daily CRAN download counts"
suppressPackageStartupMessages({
  library(anomalize)
  library(dplyr)
})
data(tidyverse_cran_downloads, package = "anomalize")

lub <- tidyverse_cran_downloads |>
  filter(package == "lubridate") |>
  ungroup() |>
  select(date, count)

lub
#> # A tibble: 425 × 2
#>    date       count
#>    <date>     <dbl>
#>  1 2017-01-01   643
#>  2 2017-01-02  1350
#>  3 2017-01-03  2940
#>  4 2017-01-04  4269
#>  5 2017-01-05  3724
#>  6 2017-01-06  2326
#>  7 2017-01-07  1107
#>  8 2017-01-08  1058
#>  9 2017-01-09  2494
#> 10 2017-01-10  3237
#> # ℹ 415 more rows
```

Two pieces of that block may be new to you. `suppressPackageStartupMessages()` hides the banner a package prints while it loads, so the output above stays readable; delete it and nothing else changes. `|>` is R's native pipe: `x |> f()` is another way of writing `f(x)`, and chaining it lets you read a sequence of steps top to bottom instead of inside out.

`tidyverse_cran_downloads` arrives grouped by package, so `filter()` picks one package, `ungroup()` drops the grouping, and `select()` keeps the two columns we need: a date and a count. That leaves 425 daily observations for `lubridate`.

Those numbers swing wildly, from 643 to 4,269 within a single week. That is not noise, it is a weekly cycle. Averaging by day of week makes it visible.

```r title="Average downloads by day of week"
lub |>
  mutate(day = weekdays(date)) |>
  group_by(day) |>
  summarise(mean_downloads = round(mean(count))) |>
  arrange(desc(mean_downloads))
#> # A tibble: 7 × 2
#>   day       mean_downloads
#>   <chr>              <dbl>
#> 1 Wednesday           5916
#> 2 Tuesday             5850
#> 3 Thursday            5651
#> 4 Monday              5258
#> 5 Friday              4437
#> 6 Sunday              2488
#> 7 Saturday            2437
```

`weekdays()` turns each date into a day name, then `group_by()` and `summarise()` average the counts within each day. A typical Wednesday sees 5,916 downloads and a typical Saturday sees 2,437, so weekends run at roughly 40 percent of midweek. That is the season.

Now watch what a z-score does with a series that has a season this strong.

```r title="Ask a z-score which days are anomalies"
lub_z <- (lub$count - mean(lub$count)) / sd(lub$count)

lub$date[abs(lub_z) > 3]     # the days a z-score calls anomalies
#> [1] "2017-10-30" "2018-02-07" "2018-02-28"

sum(lub$count == 0)          # days the download server actually returned nothing
#> [1] 9

round(min(lub_z), 2)         # how extreme a zero-download day looks to a z-score
#> [1] -1.91
```

The first line lists the days the z-score flags: 2017-10-30, 2018-02-07 and 2018-02-28. Those are ordinary busy weekdays that happened to be near the top of a growing series. The next two lines are the ones that matter.

There are **nine days where the count is literally zero**. A package with 5,000 downloads a day did not stop being downloaded worldwide on nine separate occasions. Those are logging failures, and they are the most obvious anomalies in the dataset. The z-score scores them at `-1.91`, comfortably inside the three-standard-deviation fence, so it flags none of them.

The reason is the same as before, this time coming through the season rather than the trend. Zero is not far from the mean of 4,582 in standard-deviation terms, because the weekly cycle already spreads the data over a huge range. The season inflates the standard deviation, the inflated standard deviation widens the fence, and the real anomalies end up inside it.

[WARNING]
**Both failures are silent.** The z-score does not warn you that it ignored the season. It returns a tidy list of the wrong days, which is far more dangerous than returning nothing.

Everything from here on is built on one repair: judge each point against what the series was doing *at that moment*, not against the series as a whole. Both packages in this tutorial do that, in two very different ways.

**Try it:** The Nile settles into a new normal after the break. Compute the mean and standard deviation of the years 1900 to 1970 only, and compare them to the whole-series numbers you saw above (mean 1,098 before the break, sd 169 overall).

```r title="Your turn: summarise the post-break Nile"
# Cut the series down to 1900-1970, then summarise it.
# Hint: window(Nile, start = ..., end = ...) slices a ts object by date.

ex_span <- Nile   # replace this with the windowed series
round(c(mean = mean(ex_span), sd = sd(ex_span)))

# Expected: a mean near 851 and an sd near 125
```

<details>
<summary>Click to reveal solution</summary>

```r title="Post-break Nile summary solution"
ex_span <- window(Nile, start = 1900, end = 1970)
round(c(mean = mean(ex_span), sd = sd(ex_span)))
#> mean   sd 
#>  851  125 
```

**Explanation:** Once you look at the post-break era on its own, the mean drops from 1,098 to 851 and the standard deviation shrinks from 169 to 125. The spread was inflated by mixing two different regimes into one series. Split them and each half is well behaved, which is precisely what a level-shift detector figures out on your behalf.

</details>

## What shapes can a time series anomaly take?

Before you can detect an anomaly you have to decide what you are looking for, because "unusual point" is not one thing. A one-off spike and a permanent step both look wrong on a chart, but they mean different things and need different fixes. The `tsoutliers` package distinguishes five shapes, and knowing them is the difference between reporting "we had 17 bad days" and reporting "our traffic dropped 20 percent on March 3rd and stayed there".

Let us build the three most common shapes from the same clean baseline so the difference is unmistakable.

```r title="Simulate the three main anomaly shapes"
set.seed(404)
n <- 80
normal <- 50 + rnorm(n, 0, 1.5)     # a flat, well-behaved series

ao <- normal                        # additive outlier: one point jumps
ao[40] <- ao[40] + 12

ls_shift <- normal                  # level shift: everything from t=40 jumps
ls_shift[40:n] <- ls_shift[40:n] + 12

tc <- normal                        # temporary change: jumps, then decays back
tc[40:n] <- tc[40:n] + 12 * 0.7^(0:(n - 40))

op <- par(mfrow = c(2, 2), mar = c(4, 4, 3, 1))
plot(normal,   type = "l", main = "Normal",            ylim = c(44, 66), ylab = "value")
plot(ao,       type = "l", main = "Additive outlier",  ylim = c(44, 66), ylab = "value")
plot(ls_shift, type = "l", main = "Level shift",       ylim = c(44, 66), ylab = "value")
plot(tc,       type = "l", main = "Temporary change",  ylim = c(44, 66), ylab = "value")
par(op)
```

*Figure 2: Three anomaly shapes built from one baseline. Only the additive outlier returns to normal immediately.*

Each series starts from the same `normal` baseline, so every difference you see is the anomaly and nothing else. The additive outlier adds 12 to a single point. The level shift adds 12 to that point *and everything after it*. The temporary change adds 12 and then multiplies the effect by 0.7 each step, so it fades. `par(mfrow = c(2, 2))` puts the four charts in a grid and `par(op)` restores the original settings afterwards.

The picture is convincing, but the arithmetic is more convincing still. Here are the same three series as numbers, around the moment things go wrong.

```r title="The three shapes as numbers"
data.frame(t      = 39:44,
           normal = round(normal[39:44], 1),
           AO     = round(ao[39:44], 1),
           LS     = round(ls_shift[39:44], 1),
           TC     = round(tc[39:44], 1))
#>    t normal   AO   LS   TC
#> 1 39   51.4 51.4 51.4 51.4
#> 2 40   48.0 60.0 60.0 60.0
#> 3 41   47.9 47.9 59.9 56.3
#> 4 42   51.4 51.4 63.4 57.3
#> 5 43   47.8 47.8 59.8 52.0
#> 6 44   51.0 51.0 63.0 53.9
```

Follow the four columns across row by row. At `t = 39` all four agree, because nothing has happened yet. At `t = 40` all three anomaly columns jump to 60.0 together, so at this single moment they are indistinguishable. The story splits at `t = 41`: `AO` snaps straight back to the baseline value of 47.9, `LS` stays 12 above it at 59.9 and never comes down, and `TC` sits at 56.3, part way back.

**What happens after the anomaly is the only thing that tells the three apart.** That is why detecting anomalies one point at a time can never classify them, and why `tso()` tests for shapes rather than points.

Here are all five shapes the package knows about.

| Code | Name | What it looks like | Typical cause | What to do |
|---|---|---|---|---|
| AO | Additive outlier | One point off, next point normal | Data entry error, one-off promotion, logging glitch | Correct or impute the single value |
| LS | Level shift | A permanent step to a new level | New pricing, a dam, a tracking-code change, a market entering | Do not "fix" it, model the two regimes |
| TC | Temporary change | A jump that decays back over a few periods | A news cycle, a viral post, a supply shock | Note the event and its half-life |
| IO | Innovational outlier | A shock that propagates through the model's own dynamics | A disturbance that the process itself carries forward | Investigate the driver, expect an echo |
| SLS | Seasonal level shift | A step that only affects one season | A store changing its Sunday opening hours | Re-estimate the seasonal pattern |

[WARNING]
**Mislabelling a level shift as a run of additive outliers is the classic mistake.** A detector tuned only for spikes will report the first few points after a step as outliers, then go quiet as the new level becomes normal. You end up "cleaning" a real business change out of your data and wondering why your forecast keeps drifting.

The three you will meet most often are AO, LS and TC. Innovational outliers matter mainly in econometrics, where the model's own dynamics propagate a shock forward, and seasonal level shifts need a strongly seasonal series before they are even identifiable.

**Try it:** The `tc` series above decays at a rate of 0.7 per step. Build a version that decays at 0.4, which fades roughly twice as fast, and look at how much of the original 12-unit shock survives each step.

```r title="Your turn: build a faster-decaying temporary change"
ex_tc <- normal
# Replace 0.7 with 0.4 so the effect dies out faster:
ex_tc[40:n] <- ex_tc[40:n] + 12 * 0.7^(0:(n - 40))

# Subtracting the baseline leaves just the anomaly's contribution:
round(ex_tc[40:44] - normal[40:44], 2)

# Expected: 12 first, then each number about 40% of the one before it
```

<details>
<summary>Click to reveal solution</summary>

```r title="Faster-decaying temporary change solution"
ex_tc <- normal
ex_tc[40:n] <- ex_tc[40:n] + 12 * 0.4^(0:(n - 40))
round(ex_tc[40:44] - normal[40:44], 2)
#> [1] 12.00  4.80  1.92  0.77  0.31
```

**Explanation:** Subtracting `normal` strips away the baseline and leaves the pure anomaly effect: 12, then 4.8, then 1.92, and so on, each one 0.4 times the last. By the fifth step only 0.31 units of a 12-unit shock remain, so this event is over in under a week. One thing to be clear about: the decay rate is not something `tso()` works out from the data. It is a fixed argument called `delta`, which defaults to 0.7, the same value the simulation above used. `tso()` estimates how big the shock was and assumes it faded at that rate, and that is what turns "something spiked" into "something spiked and was back to normal within a few days".

</details>

## How does tso() hunt for outliers?

`tso()` is the main function of the `tsoutliers` package. It automates a procedure published by Chen and Liu in 1993, and the idea behind it is more approachable than the paper's notation suggests.

The procedure rests on one observation. If you fit a model that captures a series' normal behaviour, then the leftovers, the parts the model could not explain, should look like formless random noise. Any structure left in those leftovers is by definition something the model does not account for. An anomaly is exactly that.

![Flowchart of the tso procedure: fit ARIMA, compute standardised residuals, test every date and type, add the worst offender as a regressor, refit, repeat](screenshots/Anomaly-Detection-in-Time-Series-in-R-tso-procedure.webp)

*Figure 3: The tso() loop: fit, test every date, absorb the worst offender, refit.*

Walking through the loop in plain English:

1. **Fit an ARIMA model** to the series. ARIMA is the standard model for describing how a series relates to its own recent past. `tso()` picks the model automatically, so you do not have to choose orders.
2. **Take the residuals** and standardise them, which puts them on a comparable scale.
3. **Test every date against every shape.** For each date and each anomaly type in `types`, compute a t-statistic asking "if an anomaly of this shape started here, how big would it be relative to its own uncertainty?"
4. **Compare the largest t-statistic to `cval`**, the critical value. If nothing clears the bar, stop.
5. **Absorb the winner.** Add that anomaly as a regressor column, refit the ARIMA model with it included, and go back to step 2.

The loop matters. Once a genuine anomaly is absorbed into the model, the residuals shrink, and the next round tests against a cleaner baseline. That is how the procedure separates one large real event from the smaller distortions it creates around itself.

Enough theory. Point it at the Nile.

```r title="Run tso() on the Nile series"
suppressPackageStartupMessages(library(tsoutliers))

nile_tso <- tso(Nile, types = c("AO", "LS", "TC"))
nile_tso$outliers
#>   type ind time   coefhat     tstat
#> 1   LS  29 1899 -242.2289 -9.045372
#> 2   AO  43 1913 -399.5211 -3.306074
```

Two anomalies, and the first one is the century-old story the z-score could not see. `LS` at `time` 1899 is a level shift: a permanent drop of 242 units, arriving exactly when construction of the Aswan Low Dam began. The second, `AO` at 1913, is a one-off low year that returns to normal immediately.

Compare that to the z-score's answer of "nothing unusual here". Same data, same century, and the difference is entirely in what the two methods were looking for.

You can also print the whole fitted object to see the model underneath.

```r title="Inspect the full tso() fit"
nile_tso
#> Series: Nile 
#> Regression with ARIMA(0,0,0) errors 
#> 
#> Coefficients:
#>       intercept       LS29       AO43
#>       1097.7500  -242.2289  -399.5211
#> s.e.    22.6783    26.7793   120.8446
#> 
#> sigma^2 = 14846:  log likelihood = -620.65
#> AIC=1249.29   AICc=1249.71   BIC=1259.71
#> 
#> Outliers:
#>   type ind time coefhat  tstat
#> 1   LS  29 1899  -242.2 -9.045
#> 2   AO  43 1913  -399.5 -3.306
```

This is an ordinary regression printout with the two outliers as predictors. `intercept` is 1097.75, which is that pre-break average you computed by hand earlier. `LS29` has a coefficient of -242.23 and a standard error of 26.78, so the step is estimated nine times more precisely than its own size. `ARIMA(0,0,0)` means that once the level shift is accounted for, nothing is left to model, no autoregressive terms and no moving-average terms. The step *was* the structure.

[NOTE]
**We asked for three types, not all five.** The default `types` argument is `c("AO", "LS", "TC")`, which is what this call uses explicitly. Innovational outliers are excluded because on an annual, non-seasonal series like the Nile they are hard to distinguish from additive outliers, and adding types you cannot identify slows the search and invites false positives.

**Try it:** Ask `tso()` to look for additive outliers only. If the level shift is genuinely a step and not a spike, restricting the search should make it vanish from the results.

```r title="Your turn: search for additive outliers only"
# Run tso() on Nile with types = "AO" and print the outliers table.

ex_ao_only <- tso(Nile, types = c("AO", "LS", "TC"))   # change the types argument
ex_ao_only$outliers

# Expected: the 1899 level shift is gone, leaving one AO around 1913
```

<details>
<summary>Click to reveal solution</summary>

```r title="Additive outliers only solution"
ex_ao_only <- tso(Nile, types = "AO")
ex_ao_only$outliers
#>   type ind time   coefhat     tstat
#> 1   AO  43 1913 -405.4265 -3.184294
```

**Explanation:** The 1899 level shift has disappeared entirely, because a permanent step simply is not the shape `types = "AO"` searches for. The 1913 spike survives with a slightly different coefficient (-405.4 instead of -399.5), because it is now being measured against a model that never learned about the step. The lesson is blunt: a detector only ever finds shapes you asked it for, so leaving `LS` out of `types` means you will never be told about a permanent change no matter how large it is.

</details>

## How do you read the tso() output and repair the series?

The outliers table has five columns and every one of them earns its place. Using the Nile result as the worked example:

| Column | Value in row 1 | What it means |
|---|---|---|
| `type` | `LS` | The shape: additive outlier, level shift or temporary change |
| `ind` | `29` | The **position** in the series, counting from 1 |
| `time` | `1899` | The **calendar label** for that position |
| `coefhat` | `-242.2289` | The size of the effect, in the series' own units |
| `tstat` | `-9.045372` | The size divided by its own standard error |

`coefhat` is the column you quote to another human being. It says the Nile lost 242 units of annual flow, permanently, and it is measured in the same units as the data. `tstat` is the column the algorithm uses to decide. It is just the coefficient divided by its standard error, which you can verify from the printout above.

```r title="Recompute the t-statistic by hand"
round(-242.2289 / 26.7793, 3)   # coefficient / standard error, both from the fit printout
#> [1] -9.045
```

That reproduces `tstat` exactly. The number means the estimated step is 9 standard errors away from zero, so the probability of seeing a step that clean in noise alone is vanishingly small. Anything past roughly 3 is already strong evidence, so 9 is not a borderline call.

[TIP]
**Report coefhat, not tstat, to anyone outside statistics.** "Flow dropped by 242 units and stayed there" lands. "The t-statistic was -9.05" does not. Keep the t-statistic for deciding, and the coefficient for explaining.

So how does an anomaly actually enter the model? As a plain column of numbers. `outliers.effects()` builds those columns for you, and looking at them makes the whole method concrete.

```r title="Turn the flagged outliers into regressor columns"
eff <- outliers.effects(nile_tso$outliers, n = length(Nile))
eff_tbl <- data.frame(year = 1871:1970, LS_1899 = eff[, 1], AO_1913 = eff[, 2])

subset(eff_tbl, year %in% c(1897, 1898, 1899, 1900, 1912, 1913, 1914))
#>    year LS_1899 AO_1913
#> 27 1897       0       0
#> 28 1898       0       0
#> 29 1899       1       0
#> 30 1900       1       0
#> 42 1912       1       0
#> 43 1913       1       1
#> 44 1914       1       0
```

`outliers.effects()` takes the outliers table and the series length, and returns one column per anomaly. We wrap it in a data frame with the actual years so the rows are readable. Now look at the two columns.

`LS_1899` is 0 before 1899 and 1 from 1899 onward, forever. It is a switch that flips on and stays on, which is precisely what "permanent step" means as arithmetic. `AO_1913` is 0 everywhere except the single year 1913. It is a pulse.

Multiply each column by its `coefhat` and add them to the intercept and you have reconstructed the model. That is the entire trick: **an anomaly type is just a differently shaped column of ones and zeros.** The level shift is a step function, the additive outlier is a pulse, and a temporary change would be a pulse that decays geometrically.

Which brings us to the practical payoff. If you know the shape and the size, you can subtract the anomaly back out. `tso()` has already done it and stored the result in `yadj`.

```r title="Compare the original series with the repaired one"
round(window(Nile, start = 1897, end = 1902))              # what was measured
#> [1] 1030 1100  774  840  874  694

round(window(nile_tso$yadj, start = 1897, end = 1902))     # with the level shift removed
#> [1] 1030 1100 1016 1082 1116  936
```

The two lines agree perfectly for 1897 and 1898, because the level shift had not started yet. From 1899 they diverge by roughly 242 units every single year, which is exactly `coefhat`. The adjusted series answers a specific hypothetical: what would the flow have looked like if the dam had never been built?

[WARNING]
**Use `yadj` to model, not to report.** The level shift was real, so a "repaired" Nile is a fiction. It is useful as a modelling input, because a series without the step is easier to forecast, but never hand it to someone as if it were the measurement.

The last dial is `cval`, the critical value a t-statistic has to beat. `tso()` picks a default from the series length, roughly 3 for a series of 100 points. Lower it and you catch more.

```r title="Loosen the detection threshold with cval"
nile_loose <- tso(Nile, types = c("AO", "LS", "TC"), cval = 2.8)
nile_loose$outliers
#>   type ind time   coefhat      tstat
#> 1   AO   7 1877 -307.1923  -2.803343
#> 2   AO  18 1888 -321.1923  -2.931103
#> 3   LS  29 1899 -269.1637 -10.898776
#> 4   AO  43 1913 -395.0286  -3.647619
#> 5   AO  94 1964  318.9714   2.945322
```

Dropping `cval` from about 3 to 2.8 takes the count from 2 to 5. The 1899 level shift is still there and now looks *stronger*, with a t-statistic of -10.9, because a better-specified model gives a cleaner estimate. But the three new additive outliers have t-statistics of 2.80, 2.93 and 2.95, all sitting barely over the new bar. Those are the definition of marginal calls.

[WARNING]
**Loosening cval manufactures outliers.** Push it low enough and a random walk will report a dozen anomalies, every one of them noise. Move `cval` because you have a reason (a short series, a known-noisy sensor), never because the result looks more interesting.

**Try it:** Go the other way. Tighten `cval` to 4 so only overwhelming evidence survives, and see which of the two original anomalies is strong enough to make the cut.

```r title="Your turn: tighten the threshold to cval = 4"
# Raise cval so only very strong evidence passes.

ex_strict <- tso(Nile, types = c("AO", "LS", "TC"), cval = 2.8)   # change cval to 4
ex_strict$outliers

# Expected: an empty table, zero rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Strict threshold solution"
ex_strict <- tso(Nile, types = c("AO", "LS", "TC"), cval = 4)
ex_strict$outliers
#> [1] type    ind     coefhat tstat  
#> <0 rows> (or 0-length row.names)
```

**Explanation:** At `cval = 4` the table is empty, which is surprising at first because the 1899 shift had a t-statistic of -9.05, comfortably past 4. The catch is that `cval` gates *every* stage of the loop, including the first pass over the raw residuals before any anomaly has been absorbed. At that stage no single candidate clears 4, so the loop stops before it ever gets to refit, and nothing is reported. The practical lesson: `cval` is not a post-hoc filter you can crank up to keep only the best findings. It changes the search itself, so raising it too far can hide the very anomaly that would have dominated the results.

</details>

## How does the anomalize pipeline flag anomalies in a data frame?

`tso()` is a specialist. It takes one `ts` object, fits a model, and tells you the shape of what it found. That is exactly what you want when you have one important series and a question about it.

It is not what you want when you have 400 dashboards refreshing every morning. For that you want speed, a tidy data frame in and out, and the ability to run every series at once. That is `anomalize`.

![Flowchart of the anomalize pipeline: date column plus value, time_decompose, season trend remainder, anomalize, remainder bounds and flag, time_recompose, bands on the original scale](screenshots/Anomaly-Detection-in-Time-Series-in-R-anomalize-pipeline.webp)

*Figure 4: The three anomalize verbs and the columns each one adds.*

The pipeline is three verbs, and each one adds columns to your data frame rather than replacing it. Start with `time_decompose()`.

```r title="Decompose the series into season, trend and remainder"
lub_dec <- lub |>
  time_decompose(count, method = "stl", frequency = "auto", trend = "auto")

lub_dec
#> # A time tibble: 425 × 5
#> # Index:         date
#>    date       observed season trend remainder
#>    <date>        <dbl>  <dbl> <dbl>     <dbl>
#>  1 2017-01-01      643 -2078. 2474.      246.
#>  2 2017-01-02     1350   518. 2491.    -1659.
#>  3 2017-01-03     2940  1117. 2508.     -685.
#>  4 2017-01-04     4269  1220. 2524.      525.
#>  5 2017-01-05     3724   865. 2541.      318.
#>  6 2017-01-06     2326   356. 2558.     -588.
#>  7 2017-01-07     1107 -1998. 2574.      531.
#>  8 2017-01-08     1058 -2078. 2591.      545.
#>  9 2017-01-09     2494   518. 2608.     -632.
#> 10 2017-01-10     3237  1117. 2624.     -504.
#> # ℹ 415 more rows
```

Alongside the table, R prints four status messages telling you it converted the tibble, picked `date` as the index, and chose `frequency = 7 days` and `trend = 91 days`. Those two choices are what `frequency = "auto"` and `trend = "auto"` resolved to: a weekly season and a quarter-long window for estimating the trend. The function inspects the spacing of your dates to pick them, which is why it needs a real `Date` column.

The `method = "stl"` argument means Seasonal-Trend decomposition using Loess, a standard technique that splits a series into three additive parts. Read the row for 2017-01-01: the observed count was 643, the season contribution was -2,078 (a New Year's Day Sunday, deep in the weekend trough), the trend was 2,474, and the remainder was 246.

Those three parts are not approximations. They add back up exactly.

```r title="Confirm the parts sum to the observed values"
round(head(lub_dec$season + lub_dec$trend + lub_dec$remainder, 4))
#> [1]  643 1350 2940 4269

head(lub$count, 4)
#> [1]  643 1350 2940 4269
```

Identical, to the unit. The decomposition is a lossless rewrite of the data into three interpretable pieces, and that is what makes the rest of the pipeline work.

[KEY INSIGHT]
**All the anomaly work happens on the remainder.** Season and trend are the parts you *expect*, so removing them leaves only the parts you did not. Detecting an anomaly in the remainder is the corrected version of what the z-score tried and failed to do on the raw values.

Now the second verb, which draws the limits.

```r title="Flag unusual remainders with the IQR method"
lub_anom <- lub_dec |>
  anomalize(remainder, method = "iqr", alpha = 0.05, max_anoms = 0.2)

lub_anom |> select(date, remainder, remainder_l1, remainder_l2, anomaly)
#> # A time tibble: 425 × 5
#> # Index:         date
#>    date       remainder remainder_l1 remainder_l2 anomaly
#>    <date>         <dbl>        <dbl>        <dbl> <chr>  
#>  1 2017-01-01      246.       -3323.        3310. No     
#>  2 2017-01-02    -1659.       -3323.        3310. No     
#>  3 2017-01-03     -685.       -3323.        3310. No     
#>  4 2017-01-04      525.       -3323.        3310. No     
#>  5 2017-01-05      318.       -3323.        3310. No     
#>  6 2017-01-06     -588.       -3323.        3310. No     
#>  7 2017-01-07      531.       -3323.        3310. No     
#>  8 2017-01-08      545.       -3323.        3310. No     
#>  9 2017-01-09     -632.       -3323.        3310. No     
#> 10 2017-01-10     -504.       -3323.        3310. No     
#> # ℹ 415 more rows
```

Three new columns appear. `remainder_l1` and `remainder_l2` are the lower and upper limits, here -3,323 and 3,310, and they are the *same on every row* because the IQR method computes one pair of limits for the whole series. `anomaly` is a plain `"Yes"` or `"No"` telling you whether that row's remainder fell outside them.

Look at 2017-01-02: a remainder of -1,659 is large, but it sits inside the fence, so the verdict is `No`. That is the pipeline working correctly. A quiet day right after New Year is unusual against the raw average and completely ordinary against its own season.

```r title="Count how many days were flagged"
lub_anom |> count(anomaly)
#> # A time tibble: 2 × 2
#> # Index:         date
#>   anomaly     n
#>   <chr>   <int>
#> 1 No        406
#> 2 Yes        19
```

Nineteen days out of 425, about 4.5 percent. That is a plausible number for real operational data, and a very different answer from the z-score's three.

The third verb translates the limits back into the units your reader thinks in.

```r title="Recompose the bounds onto the original scale"
lub_rec <- lub_anom |> time_recompose()

lub_rec |>
  filter(anomaly == "Yes") |>
  select(date, observed, recomposed_l1, recomposed_l2) |>
  mutate(across(where(is.numeric), round))
#> # A time tibble: 19 × 4
#> # Index:         date
#>    date       observed recomposed_l1 recomposed_l2
#>    <date>        <dbl>         <dbl>         <dbl>
#>  1 2017-01-12        0           199          6832
#>  2 2017-04-19     8549          1878          8512
#>  3 2017-09-01        0           813          7447
#>  4 2017-09-07     9491          1548          8181
#>  5 2017-10-30    11970          3089          9723
#>  6 2017-11-13    10267          3317          9951
#>  7 2017-11-14    11491          3927         10561
#>  8 2017-12-04    10324          3196          9829
#>  9 2017-12-05    10586          3776         10410
#> 10 2017-12-27     3692          3750         10384
#> 11 2018-01-01     1865          3095          9728
#> 12 2018-01-05        0          2970          9604
#> 13 2018-01-13     7635           817          7451
#> 14 2018-02-07    11924          5216         11849
#> 15 2018-02-08    11714          4913         11547
#> 16 2018-02-09        0          4456         11090
#> 17 2018-02-10        0          2154          8788
#> 18 2018-02-23        0          5195         11829
#> 19 2018-02-24        0          2895          9529
```

`time_recompose()` adds the season and trend back onto the remainder limits, producing `recomposed_l1` and `recomposed_l2`: the range of counts that would have been normal *on that specific date*. Unlike the remainder limits, these move every row.

That movement is the whole point. On 2017-01-12 the normal range was 199 to 6,832 and the count was 0, below the floor. On 2018-02-07 the normal range was 5,216 to 11,849 and the count was 11,924, just above the ceiling. A fixed threshold could never call both of those correctly, because 11,924 is a fine number in February and would be extraordinary in January.

Notice how many of the flagged days show `observed` of exactly 0. Let us check that directly.

```r title="Check how many zero-download days were caught"
zero_days <- lub$date[lub$count == 0]

sum(zero_days %in% lub_rec$date[lub_rec$anomaly == "Yes"])   # zero days that were flagged
#> [1] 7

length(zero_days)                                            # zero days that exist
#> [1] 9
```

Seven of the nine outage days are caught, against zero out of nine for the z-score. The two misses are worth understanding rather than glossing over: they fall on days whose seasonal expectation was already very low (a weekend in the trough), so a count of zero was not far enough below the floor to clear the limit. That is a genuine limitation of a purely statistical detector, and it is why a zero-count rule and an anomaly detector are complementary rather than redundant.

Finally, the package draws the whole thing for you.

```r title="Plot the flagged anomalies with their bands"
plot_anomalies(lub_rec, time_recomposed = TRUE, alpha_dots = 0.4) +
  ggplot2::labs(title = "lubridate daily CRAN downloads, anomalies flagged",
                x = NULL, y = "downloads")
```

*Figure 5: The grey band is the recomposed normal range, which widens and narrows with the weekly cycle. Red dots are the flagged days.*

`time_recomposed = TRUE` draws the grey band from `recomposed_l1` and `recomposed_l2`. The band narrows at weekends and widens midweek, and it drifts upward as the trend grows. That moving band is the visual version of everything this section has covered.

[NOTE]
**anomalize needs a data frame with a date column, not a ts object.** If your data is a `ts`, convert it first with something like `tibble(date = ..., value = as.numeric(my_ts))`. Passing a `ts` straight in will fail, because the pipeline reads the date column to work out the frequency.

**Try it:** The IQR limits come from the remainder's own quartiles. Compute the 25th and 75th percentiles of `lub_dec$remainder` and the distance between them, then compare that distance to the limits of -3,323 and 3,310 you saw above.

```r title="Your turn: compute the remainder quartiles and IQR"
# Get the 25th and 75th percentiles of the remainder, then their difference.
# Hint: quantile(x, c(0.25, 0.75)) and diff()

ex_iqr <- quantile(lub_dec$remainder, c(0.25, 0.75))
round(ex_iqr)
round(as.numeric(diff(ex_iqr)))

# Expected: quartiles near -480 and 467, with a gap near 948
```

<details>
<summary>Click to reveal solution</summary>

```r title="Remainder quartiles and IQR solution"
ex_iqr <- quantile(lub_dec$remainder, c(0.25, 0.75))
round(ex_iqr)
#>  25%  75% 
#> -480  467 
round(as.numeric(diff(ex_iqr)))
#> [1] 948
```

**Explanation:** The middle half of the remainders spans just 948 units, from -480 to 467, yet the limits sit out at roughly plus and minus 3,320. That is about 3.5 IQRs on either side, which is where `alpha` comes in: `anomalize` scales the fence by `0.15 / alpha`, so `alpha = 0.05` gives a factor of 3. Two useful facts fall out of this. The limits depend only on the *middle* of the distribution, so a handful of huge outliers cannot drag them outward, and `alpha` is a direct multiplier on the fence width rather than a p-value.

</details>

## When should you use GESD instead of IQR?

`anomalize()` accepts a second method, `"gesd"`, and the choice between the two is the most consequential tuning decision in the pipeline. Both answer the same question, "which remainders are too far out?", but they go about it in opposite ways.

**IQR computes its limits once.** It reads the quartiles of all 425 remainders, sets a single fence from them, then applies that fence to every row. Fast, and completely deterministic.

**GESD works iteratively.** It finds the most extreme remainder, tests whether it is more extreme than you would expect from that many draws of a normal distribution, removes it, recomputes the mean and standard deviation without it, and repeats. GESD stands for Generalised Extreme Studentised Deviate, and it is the test Twitter's anomaly-detection work popularised.

That iteration solves a specific problem called masking. If your series has six catastrophic days, those six inflate the standard deviation so much that a mildly bad seventh day looks perfectly normal by comparison. The big outliers *mask* the smaller ones. GESD removes them one at a time, so the standard deviation shrinks as it goes and the smaller offenders become visible.

```r title="Detect the same series with GESD"
lub_gesd <- lub_dec |>
  anomalize(remainder, method = "gesd", alpha = 0.05, max_anoms = 0.2) |>
  time_recompose()

lub_gesd |> count(anomaly)
#> # A time tibble: 2 × 2
#> # Index:         date
#>   anomaly     n
#>   <chr>   <int>
#> 1 No        395
#> 2 Yes        30
```

Thirty flagged instead of nineteen, on identical input. The obvious question is whether GESD found different days or simply more of them.

```r title="Compare which days each method flagged"
iqr_dates  <- lub_rec$date[lub_rec$anomaly == "Yes"]
gesd_dates <- lub_gesd$date[lub_gesd$anomaly == "Yes"]

length(intersect(iqr_dates, gesd_dates))   # days both methods agree on
#> [1] 19

setdiff(gesd_dates, iqr_dates)             # days only GESD found
#>  [1] "2017-04-26" "2017-04-27" "2017-04-29" "2017-05-02" "2017-09-11" "2017-11-06" "2017-12-03"
#>  [8] "2017-12-25" "2017-12-26" "2017-12-29" "2018-02-28"
```

The intersection is 19, which is every single day IQR found. **GESD's set strictly contains IQR's set**, and adds 11 more. This is masking made visible: those 11 days were always mildly unusual, but the huge zero-download days were inflating the spread enough to hide them. Peel the big ones off and the moderate ones surface.

Scan the extra dates and they make sense. 2017-12-25, 2017-12-26 and 2017-12-29 are Christmas week. 2017-04-26, 04-27 and 04-29 cluster in a single week. These are real events of a smaller size, not random noise.

Here is how the two compare in practice.

| | IQR | GESD |
|---|---|---|
| How limits are set | Once, from the quartiles | Iteratively, one point removed per round |
| Resists masking | No | Yes |
| Speed | Very fast | Slower, but fine to a few thousand points |
| Typical result | Fewer, more extreme flags | More flags, including moderate ones |
| Best for | Monitoring at scale, alerting on the worst | Investigation, forensic passes, clustered events |

Whichever method you pick, `alpha` controls how permissive it is. Sweeping it makes the sensitivity concrete.

```r title="Sweep alpha and count the anomalies"
for (a in c(0.025, 0.05, 0.10, 0.20)) {
  flagged <- anomalize(lub_dec, remainder, method = "iqr", alpha = a, max_anoms = 0.2)
  cat("alpha =", format(a, nsmall = 3), "-> anomalies:", sum(flagged$anomaly == "Yes"), "\n")
}
#> alpha = 0.025 -> anomalies: 4 
#> alpha = 0.050 -> anomalies: 19 
#> alpha = 0.100 -> anomalies: 44 
#> alpha = 0.200 -> anomalies: 84 
```

The loop reruns `anomalize()` four times and counts the flags. Halving `alpha` from 0.05 to 0.025 cuts the count from 19 to 4; doubling it to 0.10 raises it to 44. **`alpha` moves the answer by an order of magnitude across a perfectly reasonable range**, which means it is not a setting you can leave to chance.

The mechanism is the formula from the last exercise: the IQR fence is scaled by `0.15 / alpha`. At `alpha = 0.05` that is a factor of 3, and at `alpha = 0.20` it drops to 0.75, a fence narrower than the interquartile range itself.

One thing to keep straight: `alpha` does not mean the same thing in both methods. Under IQR it is only that multiplier, with no probability attached to it. Under GESD it is a real significance level, the false-positive rate the test accepts on each round of its search. The same number therefore is not directly comparable across the two, so tune it separately per method rather than carrying a value across.

[TIP]
**Tune alpha against a labelled week, not by eye.** Take a stretch of history where you know what actually happened, from incident tickets or a release log, and pick the `alpha` that recovers those events without burying you in extras. Choosing it by "that looks about right" bakes your expectations into the detector.

The other dial is `max_anoms`, and it works differently from `alpha` in a way that catches people out.

```r title="See how max_anoms caps the result"
for (m in c(0.01, 0.05, 0.20)) {
  flagged <- anomalize(lub_dec, remainder, method = "iqr", alpha = 0.20, max_anoms = m)
  cat("max_anoms =", m, "-> anomalies:", sum(flagged$anomaly == "Yes"), "\n")
}
#> max_anoms = 0.01 -> anomalies: 4 
#> max_anoms = 0.05 -> anomalies: 21 
#> max_anoms = 0.2 -> anomalies: 84 
```

`alpha` is held at 0.20 throughout, so the statistical test is identical in all three runs and would flag 84 days if left alone. Only `max_anoms` changes. At `0.01` you get 4 flags, which is 1 percent of 425. At `0.05` you get 21, which is 5 percent.

`max_anoms` is not a test. It is a hard ceiling expressed as a fraction of the series, and it keeps only the most extreme candidates up to that count.

[WARNING]
**max_anoms silently truncates.** Nothing warns you that 80 days met the statistical criterion and were dropped to honour the cap. If your flagged count lands suspiciously close to `max_anoms` times the row count, that is the ceiling talking, not the data. Raise it and rerun before you trust the number.

**Try it:** Run GESD with a much stricter `alpha` of 0.01 and see whether it still beats IQR's 19. This tells you whether GESD's extra finds come from being iterative or just from being permissive.

```r title="Your turn: run GESD with a strict alpha"
# Use method = "gesd" with alpha = 0.01, then count the flagged rows.

ex_gesd_tight <- anomalize(lub_dec, remainder, method = "gesd", alpha = 0.05, max_anoms = 0.2)
sum(ex_gesd_tight$anomaly == "Yes")

# Expected: a number in the twenties, still above IQR's 19 at the looser alpha of 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Strict GESD solution"
ex_gesd_tight <- anomalize(lub_dec, remainder, method = "gesd", alpha = 0.01, max_anoms = 0.2)
sum(ex_gesd_tight$anomaly == "Yes")
#> [1] 27
```

**Explanation:** Even at `alpha = 0.01`, five times stricter than the IQR run, GESD still flags 27 days against IQR's 19. So the extra detections are not the result of a looser threshold, they come from the iterative procedure genuinely un-masking days that IQR's single fixed fence could never reach. If you need to be confident you have not missed a moderate event, that is a real argument for GESD, and it costs you only compute time.

</details>

## How do you scan many series for anomalies at once?

Everything so far has run on one series. Real monitoring is never one series. It is every product line, every region, every endpoint, and if your detector needs a `for` loop and a list of results to stitch back together, you will not run it daily.

The pipeline handles this without any new functions, because the verbs respect `dplyr` grouping. `tidyverse_cran_downloads` arrives already grouped by package, so all 15 series can go through in a single pass.

```r title="Detect anomalies across all 15 packages at once"
all_anom <- tidyverse_cran_downloads |>
  time_decompose(count, method = "stl") |>
  anomalize(remainder, method = "iqr") |>
  time_recompose()

all_anom |>
  filter(anomaly == "Yes") |>
  count(package, name = "anomalies") |>
  arrange(desc(anomalies))
#> # A tibble: 15 × 2
#> # Groups:   package [15]
#>    package   anomalies
#>    <chr>         <int>
#>  1 broom            34
#>  2 stringr          29
#>  3 knitr            22
#>  4 tidyr            22
#>  5 tidyverse        22
#>  6 ggplot2          21
#>  7 lubridate        19
#>  8 dplyr            16
#>  9 readr            13
#> 10 tibble           13
#> 11 tidytext         13
#> 12 purrr            12
#> 13 tidyquant        12
#> 14 forcats           7
#> 15 glue              3
```

That is 6,375 rows across 15 series, decomposed, tested and recomposed by the same three lines you ran on one package, in about a second. Each package gets its own seasonal pattern, its own trend and its own limits, because the grouping is respected at every step. `lubridate` still shows the 19 anomalies you found earlier, which confirms the grouped run and the single run agree.

The ranking is the actual deliverable. `broom` has 34 anomalous days and `glue` has 3, so if you can only investigate two series this morning, you now know which two.

[TIP]
**Rank by anomaly count to triage a fleet of series.** Run the pipeline as a scheduled job, then sort by count and work down the list. It converts "we have 400 dashboards" into "these three need a human today", which is the only form in which anomaly detection actually gets used.

Plotting a grouped result faceted by series lets you eyeball a whole fleet at once. Fifteen panels is too many to read, so take four.

```r title="Plot anomalies for four packages side by side"
four <- tidyverse_cran_downloads |>
  filter(package %in% c("dplyr", "ggplot2", "tidyr", "purrr"))

four_anom <- four |>
  time_decompose(count, method = "stl") |>
  anomalize(remainder, method = "iqr") |>
  time_recompose()

plot_anomalies(four_anom, time_recomposed = TRUE, ncol = 2, alpha_dots = 0.4)
```

*Figure 6: Four packages, one pipeline, one chart. Each panel has its own band because each series was decomposed separately.*

Each panel carries its own grey band, sized to that package's own weekly pattern and trend. A shared y-axis and a shared threshold would have made `ggplot2`, the busiest of the four, swamp the others entirely.

**Try it:** Anomalies come in two flavours: counts above the ceiling and counts below the floor. Using `four_anom`, count only the **spikes** for each package, meaning rows where `observed` is above `recomposed_l2`.

```r title="Your turn: count spikes per package"
# Keep only flagged rows where observed is ABOVE the upper bound, then count per package.
# Hint: filter(anomaly == "Yes", observed > recomposed_l2) then count(package, ...)

four_anom |>
  filter(anomaly == "Yes") |>
  count(package, name = "spikes")

# Expected: four small numbers, all well below each package's total anomaly count
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spikes per package solution"
four_anom |>
  filter(anomaly == "Yes", observed > recomposed_l2) |>
  count(package, name = "spikes")
#> # A tibble: 4 × 2
#> # Groups:   package [4]
#>   package spikes
#>   <chr>    <int>
#> 1 dplyr        5
#> 2 ggplot2      1
#> 3 purrr        3
#> 4 tidyr        7
```

**Explanation:** Compare these to the totals from the grouped run: `ggplot2` had 21 anomalies but only 1 is a spike, so 20 are dips. `tidyr` had 22 with 7 spikes. Across all four packages, dips outnumber spikes heavily, which fits CRAN download data where the failure mode is a mirror going offline rather than a sudden surge. Splitting flags by direction takes about ten seconds and usually tells you more about root cause than the raw count does, so make it a habit.

</details>

## Which engine should you choose for your problem?

You now have two working detectors, so the question is when to reach for which. The honest way to answer it is to show each one failing at the other's job.

![Decision flowchart: name and repair one series leads to tsoutliers tso, flag and monitor many series leads to the anomalize pipeline](screenshots/Anomaly-Detection-in-Time-Series-in-R-method-choice.webp)

*Figure 7: Choosing between tso() and the anomalize pipeline.*

Start with the failure that surprises people. Take the Nile, the series whose level shift `tso()` identified with a t-statistic of -9.05, and push it through the anomalize pipeline.

```r title="Run the Nile through the anomalize pipeline"
nile_tbl <- tibble::tibble(date = as.Date(paste0(1871:1970, "-01-01")),
                           flow = as.numeric(Nile))

nile_anom <- nile_tbl |>
  time_decompose(flow, method = "stl", frequency = "auto", trend = "auto") |>
  anomalize(remainder, method = "iqr") |>
  time_recompose()

nile_anom |> count(anomaly)
#> # A time tibble: 1 × 2
#> # Index:         date
#>   anomaly     n
#>   <chr>   <int>
#> 1 No        100
```

One row in the output, and it says `No` a hundred times. **The anomalize pipeline finds nothing in the Nile.** Not a weak signal, not a marginal call: zero flagged points in the series containing one of the most studied structural breaks in statistics.

This is not a bug, and understanding why is the most useful idea in this whole tutorial. `time_decompose()` splits the series into season, trend and remainder. A level shift is, mathematically, a change in the level, so **STL absorbs it into the trend component**. The trend line simply steps down in 1899 and carries on. By the time `anomalize()` looks at the remainder, the shift has already been explained away, and what is left really is unremarkable noise.

[KEY INSIGHT]
**A level shift is a trend change, so decomposition hides it by design.** Anything the decomposition can explain will never reach the remainder, and anything that never reaches the remainder can never be flagged. `tso()` finds it because it tests for a step explicitly, as a named hypothesis, rather than looking at leftovers.

Now the reverse failure. `tso()` refits an ARIMA model on every iteration of its loop, so cost grows quickly with series length and with the number of `types` you search. On 100 annual points it is instant. On 6,375 daily rows across 15 groups, where the pipeline finished in about a second, `tso()` would need a separate call per series and a noticeable wait for each. It also returns `ind`, a position, so you have to map results back to dates yourself.

Here is the decision, laid out.

| | `tsoutliers::tso()` | `anomalize` pipeline |
|---|---|---|
| Input | A `ts` object | A data frame with a date column |
| Question it answers | What *kind* of event was this, and how big? | Which rows are unusual right now? |
| Names the shape | Yes: AO, LS, TC, IO, SLS | No, just Yes or No |
| Finds level shifts | Yes, that is its speciality | No, decomposition absorbs them |
| Gives a repaired series | Yes, via `yadj` | No |
| Many series at once | One call per series | Native, respects `group_by()` |
| Comfortable size | Up to a few hundred points | Thousands of rows across many groups |
| Main dial | `cval` | `alpha` and `max_anoms` |

The practical rule is short. **Use `anomalize` to find out that something happened, and `tso()` to find out what it was.** They are complementary, not competing, and the Complete Example below runs them exactly that way.

[NOTE]
**A third option worth knowing about.** The `timetk` package offers `plot_anomaly_diagnostics()` and `tk_anomaly_diagnostics()`, which wrap the same decompose-then-IQR logic with a slightly different interface. If your project already leans on `timetk`, those functions save you a dependency. The concepts in this tutorial transfer directly.

**Try it:** Confirm the null result above rather than taking it on trust. Filter `nile_anom` to the flagged rows and look at what comes back.

```r title="Your turn: list the Nile anomalies anomalize found"
# Filter nile_anom to anomaly == "Yes" and select date and observed.

nile_anom |> select(date, observed)

# Expected: a tibble with 0 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Empty flagged set solution"
nile_anom |> filter(anomaly == "Yes") |> select(date, observed)
#> # A time tibble: 0 × 2
#> # Index:         date
#> # ℹ 2 variables: date <date>, observed <dbl>
```

**Explanation:** A tibble with 0 rows, and R helpfully lists the columns that would have been there. This is the output worth remembering, because it is what a silent failure looks like in practice. Nothing errored, nothing warned, and a pipeline that returns an empty set reads exactly like "all clear". Whenever a detector reports zero anomalies on data you believe is eventful, check whether the shape you care about is one the method can represent at all.

</details>

## Complete Example: an end-to-end anomaly audit

Time to put both engines together on a series we have not touched yet. `broom` had the most anomalies of the 15 packages, 34 of them, so it makes a good subject. The workflow is the one you would run in production: screen broadly, classify narrowly, then repair.

**Stage 1: screen the whole series with anomalize.**

```r title="Screen the broom series for anomalies"
broom_dl <- tidyverse_cran_downloads |>
  filter(package == "broom") |>
  ungroup() |>
  select(date, count)

broom_flagged <- broom_dl |>
  time_decompose(count, method = "stl") |>
  anomalize(remainder, method = "iqr", alpha = 0.05, max_anoms = 0.2) |>
  time_recompose()

broom_flagged |> count(anomaly)
#> # A time tibble: 2 × 2
#> # Index:         date
#>   anomaly     n
#>   <chr>   <int>
#> 1 No        391
#> 2 Yes        34
```

Thirty-four flagged days out of 425, exactly matching what the grouped run reported earlier. That is our candidate list.

**Stage 2: split the candidates by direction and timing.**

```r title="Classify the flagged days by direction and weekday"
broom_events <- broom_flagged |>
  filter(anomaly == "Yes") |>
  mutate(direction = ifelse(observed < recomposed_l1, "dip", "spike"),
         day       = weekdays(date))

broom_events |> count(direction)
#> # A time tibble: 2 × 2
#> # Index:         date
#>   direction     n
#>   <chr>     <int>
#> 1 dip          17
#> 2 spike        17

broom_events |> filter(direction == "dip") |> count(day, sort = TRUE)
#> # A time tibble: 7 × 2
#> # Index:         date
#>   day           n
#>   <chr>     <int>
#> 1 Friday        5
#> 2 Saturday      4
#> 3 Monday        2
#> 4 Sunday        2
#> 5 Wednesday     2
#> 6 Thursday      1
#> 7 Tuesday       1
```

A clean 17-17 split between dips and spikes. The weekday breakdown of the dips is the interesting part: 9 of the 17 land on a Friday or Saturday. Remember that the pipeline has already removed the weekly season, so this is not "weekends are quiet". It is a genuine tendency for whatever breaks to break at the end of the week, which is precisely the kind of lead an operations team can act on.

**Stage 3: look at the worst offenders.**

```r title="Find the three deepest dips"
broom_events |>
  filter(direction == "dip") |>
  arrange(observed) |>
  head(3) |>
  select(date, observed, recomposed_l1) |>
  mutate(across(where(is.numeric), round))
#> # A time tibble: 3 × 3
#> # Index:         date
#>   date       observed recomposed_l1
#>   <date>        <dbl>         <dbl>
#> 1 2018-01-05        0          2843
#> 2 2018-02-09        0          3537
#> 3 2018-02-23        0          3827
```

All three are zero-count days, and all three had a floor of at least 2,843. Two of them, 2018-02-09 and 2018-02-23, are exactly two weeks apart. That pattern is worth naming properly, which is Stage 4.

**Stage 4: classify the shape with tso().**

```r title="Name the shape of the February events"
win <- broom_dl |>
  filter(date >= as.Date("2018-01-15"), date <= as.Date("2018-03-01"))

nrow(win)
#> [1] 46

win_ts  <- ts(win$count, frequency = 7)
win_fit <- tso(win_ts, types = c("AO", "LS", "TC"))

data.frame(date   = win$date[win_fit$outliers$ind],
           type   = win_fit$outliers$type,
           effect = round(win_fit$outliers$coefhat),
           tstat  = round(win_fit$outliers$tstat, 2))
#>         date type effect  tstat
#> 1 2018-02-09   TC  -4664 -10.54
#> 2 2018-02-23   TC  -4440  -7.47
```

Three things are happening in that block, so take them one at a time.

We cut a 46-day window around the events, because `tso()` is happiest on short series and we already know from Stage 3 where to look. `ts(win$count, frequency = 7)` wraps the counts as a weekly-seasonal time series, which is what `tso()` expects. Then, because `tso()` reports `ind` as a position rather than a date, we index back into `win$date` to recover real calendar dates, which is the small piece of glue that makes the output shareable.

The verdict: both events are **temporary changes**, not additive outliers. That distinction is the payoff of the whole exercise. An additive outlier would mean one broken day followed by an immediate return to normal. A TC means the effect **decayed back over several days**, so downloads did not simply resume the next morning, they climbed back gradually. The effect sizes, -4,664 and -4,440, say each event cost about 4,500 downloads at its worst.

Two temporary changes of near-identical size, exactly 14 days apart, is the signature of a recurring biweekly failure rather than two unrelated incidents. Two events are not proof of a schedule, but the pattern is specific enough to take to whoever runs the mirror and check against their job logs.

**Stage 5: recover what the numbers should have been.**

```r title="Read the repaired values around the first event"
hit <- win_fit$outliers$ind[1]

data.frame(date     = win$date[hit:(hit + 4)],
           observed = win$count[hit:(hit + 4)],
           repaired = round(as.numeric(win_fit$yadj)[hit:(hit + 4)]))
#>         date observed repaired
#> 1 2018-02-09        0     4664
#> 2 2018-02-10        0     3265
#> 3 2018-02-11     2537     4823
#> 4 2018-02-12     5374     6974
#> 5 2018-02-13     5920     7040
```

`yadj` estimates what each day would have been without the event. The gap closes as you read down: 4,664 lost on the 9th, 3,265 on the 10th, 2,286 on the 11th, and by the 13th the series is nearly back. That decay is the "temporary" in temporary change, made concrete.

Add the five gaps and the incident cost roughly 13,000 downloads. That is a number you can take to a status page, and you got there by screening with `anomalize`, classifying with `tso()`, and reading the repair off `yadj`.

## Practice Exercises

These combine several ideas from the tutorial. Each uses `my_`-prefixed variable names so nothing you built above gets overwritten.

### Exercise 1: Audit a package and split the flags by direction

Run the full three-verb pipeline on the `dplyr` download series with `method = "iqr"` and `alpha = 0.05`. Report how many days were flagged in total, and how many of those were dips, meaning `observed` fell below `recomposed_l1`.

```r title="Exercise 1: audit dplyr downloads"
# Build the pipeline for package == "dplyr", then count total flags and dips.
# Hint: filter -> ungroup -> select -> time_decompose -> anomalize -> time_recompose

my_dplyr <- tidyverse_cran_downloads

# Write your code below:

# Expected: 16 anomalies in total, of which 11 are dips
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_dplyr <- tidyverse_cran_downloads |>
  filter(package == "dplyr") |>
  ungroup() |>
  select(date, count) |>
  time_decompose(count, method = "stl") |>
  anomalize(remainder, method = "iqr", alpha = 0.05) |>
  time_recompose()

my_dplyr |> filter(anomaly == "Yes") |> nrow()
#> [1] 16

my_dplyr |> filter(anomaly == "Yes", observed < recomposed_l1) |> nrow()
#> [1] 11
```

**Explanation:** Sixteen anomalies, eleven of them dips. The 16 matches the grouped run from the multi-series section exactly, which is the check worth making: a single-series pipeline and a grouped one must agree, because the grouping only changes how rows are batched, never how limits are computed. The dip-heavy split, 11 down against 5 up, is the same pattern the four-package exercise showed, and it points at CRAN mirror availability rather than at bursts of interest.

</details>

### Exercise 2: Plant a level shift and recover it

Simulate a series of 80 points where the first 40 are drawn from a normal distribution with mean 100 and standard deviation 4, and the last 40 from mean 128 with the same standard deviation. Use `set.seed(2026)`. Run `tso()` on it, then check the estimated shift size against the difference between the two halves' actual means.

```r title="Exercise 2: recover a planted level shift"
# 1. Build the series with rnorm() and wrap it with ts(..., frequency = 1)
# 2. Run tso() with types = c("AO", "LS", "TC") and print the outliers
# 3. Compare coefhat to the difference between the two segment means

set.seed(2026)

# Write your code below:

# Expected: one LS at position 41, coefhat near 27.6, segment means near 100 and 127
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2026)
my_series <- ts(c(rnorm(40, 100, 4), rnorm(40, 128, 4)), frequency = 1)

my_fit <- tso(my_series, types = c("AO", "LS", "TC"))
my_fit$outliers
#>   type ind time  coefhat    tstat
#> 1   LS  41   41 27.64748 32.83734

round(mean(window(my_series, start = 1,  end = 40)))
#> [1] 100
round(mean(window(my_series, start = 41, end = 80)))
#> [1] 127
```

**Explanation:** `tso()` recovers the planted shift precisely. It reports a single `LS` at position 41, which is the exact index where the distribution changed, with a coefficient of 27.65 against a true shift of 28. The segment means, 100 and 127, differ by 27, so the estimate is right to within a fraction of one standard deviation. The t-statistic of 32.8 is enormous because the shift is seven times the noise level. Worth noting what is absent: no spurious additive outliers were reported around the break, even though `types` included them, because the loop absorbed the step first and left nothing for the other shapes to explain.

</details>

### Exercise 3: Compare the two detection methods on a new series

Run the pipeline on the `tidyquant` series using `method = "gesd"` with `alpha = 0.05`, and report how many days were flagged and how many of those were spikes (`observed` above `recomposed_l2`). Then build a small data frame comparing IQR and GESD flag counts on the `lub_dec` object from earlier.

```r title="Exercise 3: compare IQR and GESD"
# Part A: tidyquant through the pipeline with GESD, count flags and spikes.
# Part B: a two-row data frame of method vs flagged count, using lub_dec.
# Hint for B: sum(anomalize(lub_dec, remainder, method = "iqr")$anomaly == "Yes")

# Write your code below:

# Expected: 20 flags of which 15 are spikes; then iqr 19 vs gesd 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_tq <- tidyverse_cran_downloads |>
  filter(package == "tidyquant") |>
  ungroup() |>
  select(date, count) |>
  time_decompose(count, method = "stl") |>
  anomalize(remainder, method = "gesd", alpha = 0.05) |>
  time_recompose()

my_tq |> filter(anomaly == "Yes") |> nrow()
#> [1] 20

my_tq |> filter(anomaly == "Yes", observed > recomposed_l2) |> nrow()
#> [1] 15

my_compare <- data.frame(
  method  = c("iqr", "gesd"),
  flagged = c(sum(anomalize(lub_dec, remainder, method = "iqr")$anomaly  == "Yes"),
              sum(anomalize(lub_dec, remainder, method = "gesd")$anomaly == "Yes"))
)
my_compare
#>   method flagged
#> 1    iqr      19
#> 2   gesd      30
```

**Explanation:** Two results worth sitting with. First, `tidyquant` breaks the pattern every other series showed: 15 of its 20 anomalies are spikes rather than dips. `tidyquant` is a finance package, so bursts of interest around market events are a plausible driver, and it is a reminder that "anomalies are usually dips" was a fact about CRAN infrastructure, not a law. Second, the comparison confirms the section-6 finding in one table: GESD flags 30 where IQR flags 19 on identical input. Running both and looking at the difference costs almost nothing and tells you how much masking your series has.

</details>

## Frequently Asked Questions

### What is the difference between an outlier and an anomaly in a time series?

In everyday use they are the same word. In time series work the useful distinction is that an outlier is a value far from the rest of the data, while an anomaly is a value far from what the series predicted for that moment. The Nile shows why that matters: its level shift is a genuine anomaly and contains no outliers at all, which is why a z-score reported zero findings on it.

### Should I remove anomalies from my data before forecasting?

It depends entirely on the shape. Remove an additive outlier, because a mistyped number or a logging glitch carries no information about the future. Never remove a level shift, because it is real and permanent, and deleting it teaches your model to forecast a world that no longer exists. Use `tso()` to name the shape before you decide, and remember that `yadj` gives you the repaired series only when repair is the right call.

### Does anomalize work on a ts object?

No. `time_decompose()` reads a date or date-time column to work out the frequency and trend windows, so it needs a data frame, not a `ts`. Convert first with `tibble(date = your_dates, value = as.numeric(your_ts))`. Going the other way, `tso()` needs a `ts` object, which you build with `ts(df$value, frequency = 7)` for daily data with a weekly cycle or `frequency = 12` for monthly data.

### How much data do I need before anomaly detection is reliable?

For `anomalize` you want at least two full seasonal cycles so STL can separate season from trend, which means about two weeks for daily data with a weekly cycle and about two years for monthly data. For `tso()` the constraint is different: the default `cval` is derived from the series length, and with fewer than about 50 points the procedure has little power, so genuine anomalies go unreported.

### Why does anomalize flag more days than I expected?

Check `alpha` first. Under IQR it is a direct multiplier on the fence width rather than a p-value, with a factor of `0.15 / alpha`; under GESD it is a genuine significance level, so the same value behaves differently in the two methods. Then check whether your flagged count is sitting at exactly `max_anoms` times your row count, which means the cap truncated the result rather than the data producing it. Finally, GESD normally flags more than IQR on the same series, so switching methods alone can change the number substantially.

### Can I detect anomalies in real time as new data arrives?

Both tools here are retrospective: they look at a whole series at once and decide which points were unusual. For streaming use, the standard pattern is to rerun the pipeline on a rolling window (say the last 90 days) each time a batch arrives, and treat only the newest rows' flags as alerts. Be aware that a point near the end of a window has less context on one side, so it is judged less reliably than a point in the middle.

### Is anomalize still maintained?

The package is on CRAN and works, and the same decompose-then-test approach now also ships inside `timetk` as `tk_anomaly_diagnostics()` and `plot_anomaly_diagnostics()`. If you are starting a new project that already uses `timetk`, those functions save you a dependency. Everything in this tutorial about decomposition, IQR, GESD and `alpha` transfers to them directly.

## Summary

![Mindmap of time series anomaly detection in R covering why z-scores fail, anomaly shapes, tsoutliers and anomalize](screenshots/Anomaly-Detection-in-Time-Series-in-R-overview-mindmap.webp)

*Figure 8: Everything this tutorial covered, in one map.*

| Question | Tool | The line of code |
|---|---|---|
| Is a z-score enough? | No, it ignores trend and season | `(x - mean(x)) / sd(x)` finds 0 anomalies in the Nile |
| What shape is this anomaly? | `tsoutliers` | `tso(y, types = c("AO", "LS", "TC"))` |
| How big was it, in real units? | The `coefhat` column | `fit$outliers$coefhat` |
| What would the series have been without it? | The adjusted series | `fit$yadj` |
| How sensitive is the search? | The critical value | `tso(y, cval = 2.8)` |
| Which rows of my data frame are unusual? | `anomalize` | `time_decompose()` then `anomalize()` then `time_recompose()` |
| What counted as normal on that date? | The recomposed bounds | `recomposed_l1` and `recomposed_l2` |
| Am I missing moderate events? | Switch methods | `anomalize(remainder, method = "gesd")` |
| How do I loosen or tighten it? | `alpha`, capped by `max_anoms` | `alpha = 0.05` gives an IQR factor of 3 |
| How do I run 400 series? | Group the data frame | `group_by(series)` before `time_decompose()` |

The four ideas worth carrying away:

1. **Judge each point against its own moment, not the series average.** Both packages do this. It is the entire difference between them and a z-score.
2. **Name the shape before you decide what to do.** A spike gets fixed, a level shift gets modelled, and treating one as the other corrupts your data or your forecast.
3. **A detector only finds shapes it can represent.** anomalize returns zero anomalies for the Nile, silently, because STL folds a level shift into the trend.
4. **Screen with `anomalize`, classify with `tso()`.** They answer different questions and the workflow that uses both beats either one alone.

## References

1. Chen, C. and Liu, L.-M. (1993). *Joint Estimation of Model Parameters and Outlier Effects in Time Series*. Journal of the American Statistical Association, 88(421), 284-297. The paper `tso()` implements; the package PDF below restates the procedure and the outlier filters in full. [Link](https://cran.r-project.org/web/packages/tsoutliers/tsoutliers.pdf)
2. López-de-Lacalle, J. *tsoutliers: Detection of Outliers in Time Series*. CRAN package page and reference manual. [Link](https://cran.r-project.org/package=tsoutliers)
3. `tso()` function reference, with every argument including `types`, `cval`, `maxit.iloop` and `tsmethod`. [Link](https://www.rdocumentation.org/packages/tsoutliers/versions/0.6-10/topics/tso)
4. Dancho, M. and Vaughan, D. *anomalize: Tidy Anomaly Detection*. CRAN package page. [Link](https://cran.r-project.org/package=anomalize)
5. Business Science. *Anomaly Detection Using Tidy and Anomalize*, the package announcement explaining the IQR and GESD lineage. [Link](https://www.business-science.io/code-tools/2018/04/08/introducing-anomalize.html)
6. Rosner, B. *Percentage Points for a Generalized ESD Many-Outlier Procedure*. Technometrics, 25(2), 165-172 (1983). The source of the GESD method; the NIST handbook page below works through the test statistic and critical values step by step. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h3.htm)
7. Cleveland, R. B., Cleveland, W. S., McRae, J. E. and Terpenning, I. *STL: A Seasonal-Trend Decomposition Procedure Based on Loess*. Journal of Official Statistics, 6(1), 3-73 (1990). The decomposition `time_decompose()` uses. [Link](https://www.scb.se/contentassets/ca21efb41fee47d293bbee5bf7be7fb3/stl-a-seasonal-trend-decomposition-procedure-based-on-loess.pdf)
8. Hyndman, R. J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition. Chapter 3: Time series decomposition. [Link](https://otexts.com/fpp3/decomposition.html)
9. `forecast::tsoutliers()` reference, the lightweight interpolation-based detector that inspired the IQR method. [Link](https://pkg.robjhyndman.com/forecast/reference/tsoutliers.html)

## Continue Learning

- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html): the STL machinery behind `time_decompose()`, covered properly: how season, trend and remainder are estimated and what the window arguments actually control.
- [Test Stationarity in R](Test-Stationarity-in-R.html): a level shift is one way a series stops being stationary, and these tests tell you whether the break you found is the only one.
- [Moving Averages in R](Moving-Averages-in-R.html): the smoothing ideas that trend estimation is built on, and a lighter-weight way to spot a series drifting away from its own recent behaviour.

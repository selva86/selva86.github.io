---
title: "Holt-Winters in R: Additive or Multiplicative Seasonality?"
slug: "Holt-Winters-in-R"
description: "Holt-Winters adds trend and seasonality to exponential smoothing in R. Use additive when the seasonal swing stays constant, multiplicative when it grows."
keywords: "holt winters in R, hw function R, multiplicative seasonality, additive seasonality, holt winters forecasting, seasonal exponential smoothing, HoltWinters R, triple exponential smoothing"
auto_link_terms: "Holt-Winters|Holt-Winters in R|Holt-Winters method|hw()|triple exponential smoothing|multiplicative seasonality|additive seasonality|seasonal exponential smoothing|seasonal indices|the seasonal component|HoltWinters()|seasonal swing|level, trend and seasonality"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "3.8.8"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Holt-Winters"
sidebar_order: 12
difficulty: "Intermediate"
---

<p class="lead">Holt-Winters is exponential smoothing with two more moving parts bolted on: a <b>trend</b>, so the forecast can climb or fall, and a <b>season</b>, so it can repeat a yearly shape instead of running flat. The one decision it asks of you is how the season attaches to the rest. <b>Additive</b> means the season is a fixed number of units, the same every December no matter how big the business gets. <b>Multiplicative</b> means the season is a percentage, so the December spike grows as the business grows. This post builds both on one dataset, shows you the diagnostic that decides between them, and reconstructs a forecast by hand so nothing stays hidden.</p>

Everything below uses one dataset, so you always have something concrete to picture.

**Ridge Road Bakery** sells sourdough loaves. In [the exponential smoothing post](Exponential-Smoothing-in-R.html) we forecast their loaves from 24 weeks of counts, and simple exponential smoothing did fine, because 24 weeks is too short a window to contain a yearly cycle. Then the owner went looking in the back office and found the **monthly ledger, four full years of it, January 2022 through December 2025**.

| Year | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2022 | 393 | 392 | 422 | 429 | 483 | 448 | 414 | 408 | 471 | 498 | 552 | **686** |
| 2023 | 433 | 409 | 464 | 479 | 479 | 476 | 409 | 415 | 505 | 525 | 601 | **723** |
| 2024 | 469 | 447 | 477 | 503 | 523 | 508 | 462 | 454 | 541 | 563 | 626 | **770** |
| 2025 | 475 | 463 | 492 | 559 | 565 | 530 | 489 | 500 | 574 | 597 | 672 | **848** |

Four years of monthly loaf sales at Ridge Road Bakery. Read down the December column.

Two things jump out of that table that the weekly slice could never have shown. The bakery is **growing**: 2022 averaged 466 loaves a month, 2025 averaged 564. And **December is enormous** every single year: 686, then 723, then 770, then 848, roughly half again as much as a normal month, every time.

The bakery has one question, and it is the same question the whole post answers: **how many loaves should they order flour for in December 2026?** Hold on to that number as it appears. Section 1 gives you an answer. Everything after that is about whether the answer deserves your trust, and why it is 900 rather than 859.

## What does Holt-Winters forecast that SES cannot?

Simple exponential smoothing estimates one thing, the **level**, meaning where the series sits right now. Its forecast for next month is the level, and its forecast for the month after that is also the level, so it draws a flat line into the future. Point that at the bakery's ledger and it will average December in with February and hand back a single number for all of 2026. It has no way to say "but December is different."

Holt-Winters tracks three things instead of one: the level, a **trend** (how much the series gains or loses per month), and a **season** (a separate adjustment for each of the twelve months). The forecast is those three recombined, which means it comes out as a *shape* rather than a line. Here is the whole thing working on the bakery, before any explanation.

```r title="Forecast the bakery's next twelve months"
suppressMessages(library(forecast))

# Ridge Road Bakery: sourdough loaves sold per month, Jan 2022 to Dec 2025.
loaves <- c(393, 392, 422, 429, 483, 448, 414, 408, 471, 498, 552, 686,
            433, 409, 464, 479, 479, 476, 409, 415, 505, 525, 601, 723,
            469, 447, 477, 503, 523, 508, 462, 454, 541, 563, 626, 770,
            475, 463, 492, 559, 565, 530, 489, 500, 574, 597, 672, 848)

# frequency = 12 tells R the season repeats every 12 observations.
bakery <- ts(loaves, start = c(2022, 1), frequency = 12)

fit <- hw(bakery, seasonal = "multiplicative", h = 12)
round(fit$mean)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2026 519 500 546 581 604 578 521 527 617 649 727 900
```

Take the code apart line by line. `library(forecast)` loads the package that supplies `hw()`; the `suppressMessages()` wrapper just keeps its startup banner out of the way. `loaves` is the ledger from the table above, read left to right, top to bottom, so the 12th entry (686) is December 2022 and the 48th (848) is December 2025.

`ts(loaves, start = c(2022, 1), frequency = 12)` is the important one. It wraps the plain vector into a **time series object**, which is R's way of attaching calendar meaning to numbers. `start = c(2022, 1)` says the first observation is month 1 of 2022. `frequency = 12` says the season repeats every 12 observations, so R knows the 12th, 24th, 36th and 48th entries are all Decembers and belong together. Get `frequency` wrong and every seasonal method on this page silently forecasts nonsense, because nothing else in the data says what a "season" is. (There is more on `ts` objects in [Time Series Objects in R](Time-Series-Objects-in-R.html).)

`hw()` is the Holt-Winters fitter. It takes the series, `seasonal = "multiplicative"` (the choice this post is about, and which we will justify properly in section 3 rather than just assert), and `h = 12`, the number of periods to forecast. It returns a forecast object; `fit$mean` holds the point forecasts, and `round()` drops the decimals for readability.

Now look at the twelve numbers. They are not a flat line. February 2026 comes in at 500 loaves and December 2026 at 900, and the shape between them is the bakery's own year: a slow February trough, a spring lift, a July and August dip when everyone leaves town, then the long climb into the holidays. Compare the forecast row against any row of the ledger table and it is recognisably the same pattern, shifted up. **That is the answer to the bakery's question: order flour for about 900 loaves in December 2026.** They sold 848 last December, and the model expects roughly 6% more.

Along with the point forecast, `hw()` gives you prediction intervals, which are the model's honest statement of how wrong it might be.

```r title="The forecast with its uncertainty"
fit
#>          Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> Jan 2026       518.8595 501.9441 535.7749 492.9896 544.7294
#> Feb 2026       500.4866 484.1546 516.8185 475.5090 525.4641
#> Mar 2026       545.6749 527.8314 563.5185 518.3855 572.9644
#> Apr 2026       580.8039 561.7430 599.8648 551.6527 609.9551
#> May 2026       603.5619 583.6450 623.4788 573.1016 634.0222
#> Jun 2026       578.1789 558.9523 597.4054 548.7744 607.5833
#> Jul 2026       521.2057 503.6972 538.7142 494.4288 547.9826
#> Aug 2026       527.1201 509.1856 545.0545 499.6916 554.5485
#> Sep 2026       617.1202 595.7960 638.4445 584.5076 649.7329
#> Oct 2026       648.5976 625.7730 671.4222 613.6904 683.5048
#> Nov 2026       727.1645 701.0333 753.2958 687.2002 767.1289
#> Dec 2026       900.4408 867.3115 933.5700 849.7739 951.1076
```

Printing the forecast object shows five columns. `Point Forecast` is the single best guess, the same numbers as before without the rounding. `Lo 80` and `Hi 80` bracket the range the model is 80% confident about, and `Lo 95` / `Hi 95` do the same at 95%. For December 2026 the model says: best guess 900 loaves, 95% confident it lands between 850 and 951.

Notice the intervals are **wider for December** (about 101 loaves from Lo 95 to Hi 95) than for January (about 52). Under multiplicative seasonality the uncertainty is proportional too, so the model is not just predicting a bigger December, it is admitting it is less sure about a bigger December. An additive model would have handed you roughly equal-width intervals all year.

Twelve numbers in a row are hard to see the shape in. Draw them instead.

```r title="Draw the ledger and the forecast together"
plot(fit, main = "Ridge Road Bakery: four years of ledger, one year of forecast",
     ylab = "loaves per month", xlab = "year")
```

`plot()` on a forecast object knows what it is holding: it draws the four years of ledger, then continues into the forecast with the 80% and 95% prediction intervals as shaded bands around it. Four December spikes climb up the left of the plot, and the fifth one, the forecast, lands where the pattern says it should. The shaded band around that fifth spike is the 850-to-951 range you just read off the table, and you can see it is fatter than the band over any other month.

> **Note:** `hw()` needs at least two full seasonal cycles before it will produce numbers, and it needs your `ts` object to have the right `frequency`. Both of those are the most common reasons a first attempt returns nothing useful. Section 7 shows exactly what that failure looks like.

**Try it:** Ask the same model for two years instead of one and check that the shape repeats rather than flattening out.

```r title="Your turn: forecast two years"
ex_two <- hw(bakery, seasonal = "multiplicative", h = 24)

# 1. Print round(ex_two$mean) and look at both December entries
# 2. Before you run it: should the second December be bigger than the first?
```

<details><summary>Click to reveal solution</summary>

```r title="Two-year forecast solution"
ex_two <- hw(bakery, seasonal = "multiplicative", h = 24)
round(ex_two$mean)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2026 519 500 546 581 604 578 521 527 617 649 727 900
#> 2027 560 540 589 626 651 623 561 567 664 698 782 968
```

The shape repeats and the whole thing has moved up. December 2027 is 968 loaves against December 2026's 900, an extra 68. That extra is the trend working through the season: twelve more months at about 3.9 loaves a month lifts the level by roughly 47, and December's 1.44x multiplier scales that gain up rather than just passing it through. This is also a good moment to be suspicious. The model will happily project this same climb out to 2050 without ever blinking, because a plain Holt-Winters trend does not flatten on its own. Section 7 covers what to do about that.

</details>

## What are the three components tracking?

The forecast in section 1 came out of three numbers the model keeps updating as it walks through your data, one per component. This section opens them up, because once you can read the three you can rebuild any forecast in the table yourself.

Each component is a running estimate, and each has its own **forgetting dial**, a number between 0 and 1 that decides how hard a new observation is allowed to move it. That idea is exactly the alpha from simple exponential smoothing, and Holt-Winters just has three of them instead of one.

![Diagram showing a new observation feeding three separate update boxes for level, trend and season, each with its own dial alpha, beta and gamma, which then combine either additively or multiplicatively into the forecast](screenshots/Holt-Winters-in-R-components.webp)
*Figure 1: The three components of Holt-Winters. Every new observation updates a level, a trend and a seasonal index, each through its own dial. The forecast recombines them, and the only question is whether the season is added or multiplied.*

Here is what each one holds, in the bakery's own units.

- **Level, written \(\ell_t\)**: the deseasonalised size of the business right now, in loaves per month. It answers "how big is a typical month at this bakery, ignoring which month it happens to be?" Its dial is \(\alpha\) (alpha).
- **Trend, written \(b_t\)**: how many loaves per month the level is gaining. A positive \(b_t\) means growth. Its dial is \(\beta\) (beta, printed by R as `beta`).
- **Season, written \(s_t\)**: December's own adjustment. There are twelve of these, one per month, and the model keeps all twelve, refreshing each one when its month comes round again. Its dial is \(\gamma\) (gamma).

R stores all of these in the fitted model under `$model$states`, one row per time point.

```r title="The level and trend at the end of the data"
round(tail(fit$model$states[, c("l", "b")], 3), 2)
#>               l    b
#> Oct 2025 571.31 3.67
#> Nov 2025 574.97 3.66
#> Dec 2025 578.87 3.89
```

`fit$model$states` is a matrix with one row per time point and one column per component. The `[, c("l", "b")]` part keeps just the level and trend columns, `tail(..., 3)` keeps the last three rows, and `round(..., 2)` trims the decimals.

Read the last row. At the end of December 2025 the model reckons the bakery's level is **578.87 loaves per month** and its trend is **3.89 loaves per month per month**. Sanity-check the level against the ledger: 2025 actually averaged 564 loaves a month, and 578.87 is a little above that, exactly as it should be, because the level is an estimate of *now* (end of 2025) rather than an average over the whole year, and the bakery grew through the year. The trend says the level is climbing by about 3.9 loaves each month, or about 47 loaves a year, which lines up with the ledger's year-on-year march from 466 to 564.

Now the twelve seasonal indices.

```r title="The twelve seasonal indices"
last_row <- nrow(fit$model$states)
round(fit$model$states[last_row, paste0("s", 1:12)], 3)
#>    s1    s2    s3    s4    s5    s6    s7    s8    s9   s10   s11   s12
#> 1.439 1.170 1.050 1.005 0.864 0.860 0.960 1.009 0.977 0.924 0.853 0.890
```

`nrow()` finds the last row of the state matrix (the final time point, December 2025), and `paste0("s", 1:12)` builds the twelve column names `"s1"` through `"s12"` so we can pull them all at once.

These are multipliers, which is why they hover around 1. Now the part that trips everyone up: **`s1` is the most recent month, not January.** The state matrix stores the seasonal indices in reverse order, newest first, so on the last row (December 2025) `s1` is December's index, `s2` is November's, and it counts backwards to `s12`, which is January's.

So read it as: December multiplies the level by **1.439**, meaning December runs about 44% above a typical month. November is 1.170 (`s2`), October 1.050 (`s3`). At the other end, `s11` = 0.853 is February at about 15% *below* typical, and `s12` = 0.890 is January. Those match the ledger: February is the worst month of every year in the table, and December is the best by a wide margin.

Now the payoff. If you can read the three components, you can rebuild any forecast in section 1 with arithmetic. The multiplicative forecast rule is: take the level, add \(h\) steps of trend, multiply by the right month's index.

```r title="Rebuild December 2026 by hand"
l_now <- as.numeric(fit$model$states[last_row, "l"])   # level at Dec 2025
b_now <- as.numeric(fit$model$states[last_row, "b"])   # trend at Dec 2025
s_dec <- as.numeric(fit$model$states[last_row, "s1"])  # December's index

round(c(level = l_now, trend = b_now, season_dec = s_dec), 4)
#>      level      trend season_dec
#>   578.8714     3.8910     1.4394

# December 2026 is 12 months after December 2025, so h = 12.
(l_now + 12 * b_now) * s_dec
#> [1] 900.4408

# What hw() reported:
fit$mean[12]
#> [1] 900.4408
```

Walk through the arithmetic. `as.numeric()` strips the names off so the result prints cleanly. The level at the end of the data is 578.8714 loaves. December 2026 is twelve months later, so the model expects the level to have climbed by `12 * 3.8910`, about 46.7 loaves, reaching roughly 625.6. That is a projection of a *typical* month in December 2026, not of December itself. To get December we multiply by December's index: `625.6 * 1.4394`, which lands on **900.4408**.

And `fit$mean[12]`, straight from `hw()`, is **900.4408**. Identical, to four decimal places. (The printed components above are rounded for display; the arithmetic uses the full-precision values, which is why it matches exactly.) There is no extra machinery inside `hw()` beyond what you just did by hand. It found good values for the three components and then multiplied them out.

> **Watch out:** `s1` being the newest month rather than January catches almost everyone. If you pull seasonal indices off the state matrix and they seem shifted, this is why. `fit$model$states` counts backwards from the last row's month.

**Try it:** Rebuild the July 2026 forecast the same way and check it against `fit$mean[7]`. July is seven months after December 2025, so `h = 7`, and you will need July's index.

```r title="Your turn: rebuild July by hand"
# Dec 2025 is s1, so count backwards: Nov = s2, Oct = s3 ...
# Which sN is July? (Hint: December minus July is five months.)
# Then: (l_now + 7 * b_now) * s_july, and compare to fit$mean[7]
```

<details><summary>Click to reveal solution</summary>

```r title="Rebuild-July solution"
# Counting back from December: Nov s2, Oct s3, Sep s4, Aug s5, Jul s6.
s_jul <- as.numeric(fit$model$states[last_row, "s6"])
s_jul
#> [1] 0.8599215

(l_now + 7 * b_now) * s_jul
#> [1] 521.2057

fit$mean[7]
#> [1] 521.2057
```

July's index is 0.8599, so July runs about 14% below a typical month, which fits a bakery whose customers are away. The hand calculation gives 521.2057 and `hw()` gives 521.2057. The same three numbers, a different month's index, and the whole 2026 row of section 1 falls out of twelve repeats of this arithmetic.

</details>

## Additive or multiplicative: how do you tell?

We have been using `seasonal = "multiplicative"` for two sections on my say-so. Time to earn it. This is the decision in the title, and it is not a matter of taste: the data answers it, and this section is the diagnostic.

Start with what the two words mean as **mechanisms**, because that is what you are choosing between. Suppose the bakery's December rush is driven by a fixed local tradition: the same 300 households have always bought the same extra loaves for the holidays, and that never changes as the bakery grows. Then December is **additive**: a fixed *plus 200 loaves*, whatever the level. Now suppose instead the rush is driven by every regular customer buying about 44% more in December. As the customer base grows, the December bump grows with it. That is **multiplicative**: a *plus 44 percent*, whatever the level.

Both descriptions produce a December spike. They are different mechanisms, they extrapolate differently, and they leave a different fingerprint in the data. Let us build both on purpose in a small sandbox, where we control the mechanism and can see what each one looks like.

```r title="Two mechanisms, built on purpose"
month <- rep(1:12, 4)                     # 1..12, four times over
climb <- 452 + 2.55 * (1:48)              # the same steady level climb for both
shape <- c(0.87, 0.85, 0.92, 0.98, 1.01, 0.96, 0.88, 0.87, 1.00, 1.06, 1.16, 1.43)
shape <- shape / mean(shape)              # normalise so an average month is 1

# Additive: the season is a fixed number of loaves, pinned to an early-years level.
twin_add  <- climb + (shape[month] - 1) * 470

# Multiplicative: the season is a percentage of wherever the level currently is.
twin_mult <- climb * shape[month]

# How wide is the peak-to-trough swing in each year?
year <- rep(1:4, each = 12)
round(tapply(twin_add,  year, function(v) max(v) - min(v)), 1)
#>     1     2     3     4
#> 298.3 298.3 298.3 298.3
round(tapply(twin_mult, year, function(v) max(v) - min(v)), 1)
#>     1     2     3     4
#> 301.8 319.6 337.4 355.1
```

Read the construction first. `climb` is a level rising steadily from about 455 to about 574 over 48 months, and **both** series use the identical `climb`, so the level path is not what differs. `shape` is a twelve-month seasonal pattern, divided by its own mean so an average month sits at 1.00 and December sits at 1.43. `shape[month]` repeats that pattern across all 48 months.

The two series then differ in exactly one character. `twin_add` **adds** `(shape - 1) * 470`, turning the shape into a fixed number of loaves (December gets `0.43 * 470`, about +203, every year forever). `twin_mult` **multiplies** by `shape`, so December is always 1.43 times the level, whatever the level has become. `tapply(x, year, ...)` then splits each series by year and measures its peak-to-trough swing.

The two output rows are the entire diagnostic. The additive twin's swing is **298.3 in all four years**, dead constant, even though its level rose by more than 100 loaves. The multiplicative twin's swing **grows every year: 301.8, 319.6, 337.4, 355.1**, because the same percentage of a bigger level is a bigger number of loaves. Same seasonal shape, same level climb, two mechanisms, and they separate cleanly on one measurement.

![Decision diagram for choosing additive or multiplicative seasonality, starting from whether the series contains zeros, then whether the peak-to-trough swing widens as the level rises, with fitting both and comparing AICc as the fallback](screenshots/Holt-Winters-in-R-decision.webp)
*Figure 2: The additive-or-multiplicative decision. Zeros rule out multiplicative outright. Otherwise the question is whether the seasonal swing widens as the level rises, and if you cannot tell by eye, fit both and let AICc decide.*

Now run that same measurement on the real bakery.

```r title="The bakery's seasonal swing, year by year"
year_of <- rep(2022:2025, each = 12)
swing <- tapply(loaves, year_of, function(v) max(v) - min(v))
avg   <- tapply(loaves, year_of, mean)

data.frame(swing = swing, average = round(avg, 1), ratio = round(swing / avg, 3))
#>      swing average ratio
#> 2022   294   466.3 0.630
#> 2023   314   493.2 0.637
#> 2024   323   528.6 0.611
#> 2025   385   563.7 0.683
```

`tapply(loaves, year_of, ...)` splits the 48 months into four years and applies a function to each. `swing` is peak minus trough within each year, `avg` is that year's mean, and `ratio` divides one by the other.

Read the columns against each other, because that comparison is the whole test. The raw `swing` **grows**, from 294 loaves in 2022 to 385 in 2025, a 31% increase. If the season were additive, that column would sit still the way the additive twin's did. Meanwhile the `ratio` column is roughly **flat**, hovering around 0.61 to 0.68 with no trend, which says the swing is growing at about the same rate as the business. That is the multiplicative fingerprint, and it is why section 1 used `seasonal = "multiplicative"`.

The `ratio` column is worth keeping as a habit. Raw swing growing on its own is not conclusive, because a swing can widen for reasons unrelated to the level. Swing growing *while the ratio stays put* is the thing that points at a percentage mechanism.

You can also just look. Plot the series and ask whether the peaks fan outward.

```r title="Look at the fanning"
plot(bakery, main = "Ridge Road Bakery: monthly loaves, 2022 to 2025",
     ylab = "loaves per month", xlab = "year", col = "steelblue", lwd = 2)
points(bakery, pch = 16, cex = 0.5, col = "steelblue")
abline(lm(bakery ~ time(bakery)), col = "grey60", lty = 2)
```

`plot()` on a `ts` object draws it against its calendar time axis for free. `points()` marks the individual months, and the `abline(lm(...))` line is a plain straight-line fit through the whole series, drawn only as a visual reference for the level's climb.

Look at the spikes. Each December peak stands further above the dashed reference line than the one before it, and each February trough sits a little further below. The band the series lives in is a **funnel opening to the right**, not a constant-width ribbon. That fanning is what "multiplicative" looks like from across the room, and the swing table is the same fact with numbers on it.

> **Watch out:** the eye test is genuinely hard on short or noisy series, and a funnel over three years can easily be luck. When you are unsure, do not agonise. Fit both and compare, which is exactly what section 5 does. That is a legitimate answer, not a cop-out.

**Try it:** Run the swing measurement on the additive twin and the multiplicative twin using the same `data.frame` recipe you just used on the bakery, and confirm which twin the bakery resembles.

```r title="Your turn: the ratio column on both twins"
# Build the same swing / average / ratio table for twin_add and twin_mult
# (year is already defined above as rep(1:4, each = 12))
# Which one has a flat ratio column AND a growing swing column?
```

<details><summary>Click to reveal solution</summary>

```r title="Twin-ratio solution"
twin_table <- function(x) {
  sw <- tapply(x, year, function(v) max(v) - min(v))
  av <- tapply(x, year, mean)
  data.frame(swing = round(sw, 1), average = round(av, 1), ratio = round(sw / av, 3))
}
twin_table(twin_add)
#>   swing average ratio
#> 1 298.3   468.6 0.637
#> 2 298.3   499.2 0.598
#> 3 298.3   529.8 0.563
#> 4 298.3   560.4 0.532
twin_table(twin_mult)
#>   swing average ratio
#> 1 301.8   469.6 0.643
#> 2 319.6   500.2 0.639
#> 3 337.4   530.8 0.636
#> 4 355.1   561.4 0.633
```

The two tables fail different columns, and that is the point. The additive twin holds its swing at 298.3 while its ratio **slides downward** (0.637 to 0.532), because a fixed swing is a shrinking fraction of a growing business. The multiplicative twin's swing climbs while its ratio holds near 0.64. The bakery's real table (swing 294 to 385, ratio wobbling around 0.63 with no drift) is unmistakably the second pattern, and its ratio even sits in the same neighbourhood. Note the bakery's ratio is not as perfectly flat as the twin's, because real data has noise in it that a constructed twin does not; you are looking for the absence of a trend, not for identical numbers.

</details>

## What actually changes in the equations?

You have seen the mechanism and the diagnostic. Now the formal statement, because "add versus multiply" turns out to change the meaning of the seasonal numbers themselves, which matters as soon as you try to report them.

Both models keep the same three components and update them with the same three dials. Only the combination rule differs. Writing \(m\) for the number of periods in a season (12 for monthly data), \(h\) for how many steps ahead you are forecasting, and \(\hat{y}_{t+h|t}\) for "the forecast for time \(t+h\), made using data up to time \(t\)", the two forecast equations are:

$$\hat{y}_{t+h|t} = \ell_t + h\,b_t + s_{t+h-m(k+1)} \qquad \text{(additive)}$$

$$\hat{y}_{t+h|t} = (\ell_t + h\,b_t) \times s_{t+h-m(k+1)} \qquad \text{(multiplicative)}$$

Every symbol, one at a time. \(\ell_t\) is the level at the end of the data, 578.8714 loaves for the bakery. \(b_t\) is the trend, 3.8910 loaves per month, so \(h\,b_t\) is the total climb expected over \(h\) months. \(s\) is the seasonal index for the month you are forecasting. The subscript \(s_{t+h-m(k+1)}\) looks forbidding but says something mundane: **use the most recent estimate of the right month's index.** The \(k\) in it is just a counter (\(k\) is the integer part of \((h-1)/m\)) that reaches back a whole number of years to find December's last estimate rather than running off the end of the data. That is all the subscript does. When we wrote `(l_now + 12 * b_now) * s_dec` by hand in section 2, we were doing that lookup manually by grabbing `s1`.

So the entire difference between the two models is the character between the bracket and the \(s\): a \(+\) or a \(\times\).

That one character changes what \(s\) *is*. In the additive model \(s\) is measured in **loaves**, and a typical month's index is 0, because adding 0 leaves the level alone. In the multiplicative model \(s\) is a **unitless multiplier**, and a typical month's index is 1, because multiplying by 1 leaves the level alone. Fit both and R will show you exactly that.

```r title="The same December, in two different units"
fit_add <- hw(bakery, seasonal = "additive", h = 12)

last_add <- nrow(fit_add$model$states)
round(fit_add$model$states[last_add, c("l", "b", "s1")], 2)
#>      l      b     s1
#> 579.03   4.30 228.31
```

Same call as before, with `seasonal = "additive"` swapped in, then the same state-matrix lookup for the level, trend and most recent seasonal index (December's, since `s1` is the newest).

The level (579.03) and trend (4.30) are close to the multiplicative model's 578.87 and 3.89, which makes sense, since both models are looking at the same growing series. But look at `s1`: **228.31**, against the multiplicative model's **1.439**. They are not in conflict; they are answering in different currencies. The additive model says "December is 228 loaves above a typical month." The multiplicative model says "December is 1.44 times a typical month." Both are true of 2025. They only come apart when you extrapolate: as the level grows, +228 loaves stays +228 forever, while 1.44x keeps pace.

You can watch them come apart on the very forecast the bakery asked for.

```r title="Where the two models disagree"
round(c(additive = fit_add$mean[12], multiplicative = fit$mean[12]))
#>       additive multiplicative
#>            859            900
```

`fit_add$mean[12]` and `fit$mean[12]` are the December 2026 point forecasts from the two fitted models.

**859 against 900.** A 41-loaf gap, about 5%, on the one number the bakery actually wanted. That gap is not noise or a numerical detail. It is the two mechanisms disagreeing about what December 2026 means. The additive model projects a level of about 630 and adds its fixed 228, landing on 859. The multiplicative model projects a level of about 626 and multiplies by 1.44, which piles on about 275 loaves rather than 228, landing on 900. The gap is exactly that: 44% of a level that has been growing for four years is now worth more loaves than the fixed bump the additive model settled on. This is the whole reason the choice is worth a section, and the next one settles it with evidence.

## Which one fits the bakery better?

The swing table in section 3 already pointed at multiplicative. Good practice is to confirm the eyeball with a number, especially since we now know the choice is worth 41 loaves of flour. There are two standard ways, and the reassuring outcome is when they agree.

The first is **AICc**, a score that balances how well a model fits against how many parameters it burned doing so. Lower is better. It exists because fit alone is a rigged contest: a model with enough knobs can trace your data perfectly and still forecast garbage, so AICc charges a penalty per parameter and asks whether the improvement paid for itself.

```r title="Compare the two models by AICc"
c(additive = fit_add$model$aicc, multiplicative = fit$model$aicc)
#>       additive multiplicative
#>       482.3778       465.6373
```

`fit$model` is the underlying fitted state-space model inside the forecast object, and `$aicc` is its score.

**465.64 for multiplicative against 482.38 for additive.** Lower wins, so multiplicative wins, by about 16.7 points. For AICc a gap of more than about 10 is normally treated as decisive, so this is not a close call.

And here the comparison is even cleaner than usual: both models have **exactly the same number of parameters** (the same three dials, the same initial states, the same twelve seasonal indices). The complexity penalty is therefore identical for both and cancels out entirely, which means the 16.7-point gap is pure fit. AICc is not doing anything subtle here; it is just reporting that one of these describes the data better.

> **Note:** comparing AICc across models is only legitimate when they are fitted to the **same data on the same scale**. Additive and multiplicative Holt-Winters both model the raw `bakery` series, so the comparison is fair. If you had log-transformed the series for one model and not the other, the AICc values would be measuring different things and comparing them would be meaningless.

The second way is more direct and harder to argue with: **hide some data, forecast it, and see who came closer.** AICc is a theoretical estimate of out-of-sample performance; a holdout just measures it.

```r title="Train on three years, forecast the fourth"
train <- window(bakery, end = c(2024, 12))     # 2022 to 2024
test  <- window(bakery, start = c(2025, 1))    # 2025, hidden from both models

h_add  <- hw(train, seasonal = "additive",       h = 12)
h_mult <- hw(train, seasonal = "multiplicative", h = 12)

round(c(additive       = accuracy(h_add,  test)["Test set", "RMSE"],
        multiplicative = accuracy(h_mult, test)["Test set", "RMSE"]), 2)
#>       additive multiplicative
#>          23.17          16.82
```

`window()` cuts a `ts` object by calendar date, keeping its time attributes intact: `train` is the first three years, `test` is 2025. Both models are then fitted on `train` only, so 2025 is genuinely unseen. `accuracy(forecast, test)` compares the forecasts against the held-out truth and returns a table of error measures; `["Test set", "RMSE"]` pulls out the root mean squared error, which is roughly "typical size of a miss, in loaves."

**Multiplicative misses by about 16.8 loaves a month, additive by about 23.2.** Multiplicative is about 27% more accurate on data neither model was allowed to see. Two independent tests, same verdict, matching the swing table's fingerprint. The bakery should use multiplicative, and the December 2026 answer stands at 900.

Now the honest part, which is the December the holdout got wrong.

```r title="What each model predicted for the December it could not see"
round(c(actual         = as.numeric(test[12]),
        additive       = h_add$mean[12],
        multiplicative = h_mult$mean[12]), 1)
#>         actual       additive multiplicative
#>          848.0          784.5          813.3
```

`test[12]` is the real December 2025 number from the ledger, and the other two are what each model, trained only on 2022 to 2024, predicted for it.

December 2025 actually came in at **848**. The additive model said 784.5, missing by 63.5 loaves. The multiplicative model said 813.3, missing by 34.7. So multiplicative is **better, not right**: it still left the bakery about 35 loaves short on its biggest day of the year. Look back at the ledger and you can see why. December 2025's ratio to its year's average was 1.504, the highest of the four years, so that December was unusually strong even by this bakery's standards. No model that averages four Decembers together will call that. Being closer than the alternative is what a model can offer you here; the prediction interval from section 1 is where it tells you how much room to leave.

**Try it:** The two models were compared on RMSE. Look at the whole `accuracy()` table for the fitted models and check whether MAE and MAPE tell the same story.

```r title="Your turn: other error measures"
# accuracy(fit_add) and accuracy(fit) each return a table of error measures.
# Compare the RMSE, MAE and MAPE columns. Do all three agree on a winner?
```

<details><summary>Click to reveal solution</summary>

```r title="Error-measures solution"
round(rbind(additive       = accuracy(fit_add)[, c("RMSE", "MAE", "MAPE")],
            multiplicative = accuracy(fit)[,     c("RMSE", "MAE", "MAPE")]), 2)
#>                 RMSE  MAE MAPE
#> additive       12.46 9.42 1.85
#> multiplicative  9.94 7.62 1.56
```

All three agree, and multiplicative wins on each. RMSE (root mean squared error, which punishes big misses hardest) drops from 12.46 to 9.94. MAE (mean absolute error, the average miss in loaves) drops from 9.42 to 7.62. MAPE (mean absolute percentage error) drops from 1.85% to 1.56%. Note these are **in-sample** numbers, computed on the data the models were fitted to, so they flatter both models compared to the holdout figures above (9.94 versus 16.82). That is exactly why the holdout is the stronger test: a model is always better at explaining what it has already seen.

</details>

## What are alpha, beta and gamma telling you?

Three components, three dials. Each one is a number between 0 and 1 that decides how much a new observation is allowed to move its component. R fits all three for you by minimising forecast error, but they are worth reading afterwards, because they are a message about your data rather than just settings.

The update equations make the meaning concrete. For the multiplicative model:

$$\ell_t = \alpha \frac{y_t}{s_{t-m}} + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$

$$b_t = \beta^*(\ell_t - \ell_{t-1}) + (1 - \beta^*) b_{t-1}$$

$$s_t = \gamma \frac{y_t}{\ell_{t-1} + b_{t-1}} + (1 - \gamma) s_{t-m}$$

Each one is the same weighted average in a different costume: *some of what just happened, plus the rest of what we already believed.* Take the level equation. \(y_t / s_{t-m}\) is this month's actual sales divided out by this month's known seasonal index, which is the deseasonalised news ("December sold 848, and December usually runs 1.44x, so that is like a normal month of 589"). \(\ell_{t-1} + b_{t-1}\) is what we expected the level to be, given last month's level and trend. \(\alpha\) picks how much to trust the news over the expectation, exactly as it did in simple exponential smoothing.

The trend equation compares this month's level to last month's, calling the difference the observed slope, and blends it into the old trend with weight \(\beta^*\). (R prints this as `beta`; the star is a bookkeeping convention in the state-space formulation and does not change the reading.) The seasonal equation divides this month's actual by the deseasonalised level to ask "how far above typical was this month, really?" and blends that into the old index for this month with weight \(\gamma\).

```r title="Read the three dials"
round(fit$model$par[c("alpha", "beta", "gamma")], 4)
#>  alpha   beta  gamma
#> 0.0223 0.0216 0.0177
```

`fit$model$par` is the named vector of every parameter `hw()` estimated, and we are pulling the three dials out of it.

All three are **tiny**, close to 0.02. Every component is set to nearly ignore each new month and hold what it already believed. What that says about the bakery is that its pattern is extremely stable: the level, the growth rate and the seasonal shape have all held steady across four years, so the best thing the model can do is average over the whole history rather than chase recent months. The fitted dials are a description of the data's regularity, not a tuning choice.

Read them as a scale, in either direction:

| Dial | Near 0 means | Near 1 means |
|---|---|---|
| \(\alpha\) (level) | The level barely moves; the series is stable around a slow path | The level chases the latest month; recent data is all that matters |
| \(\beta\) (trend) | The growth rate is constant; a straight-line climb | The slope is re-estimated constantly; growth is erratic |
| \(\gamma\) (season) | The seasonal shape is fixed; every December behaves like the last four | The seasonal shape drifts; this December is not last December |

A high \(\gamma\) is the one worth paying attention to. It means the model is having to relearn the seasonal pattern as it goes, which is either real (the business changed) or a sign that your seasonal shape is not stable enough for Holt-Winters to be the right tool.

> **Note:** small dials are not a virtue and large dials are not a defect. They are a readout of your series. This bakery's ledger is exceptionally regular, which is what four years of near-identical Decembers will do. A real ledger with a refit, a pandemic or a new competitor in it would fit larger dials, and that would be correct.

## When does Holt-Winters break?

Everything above worked because the bakery's data is well-behaved. Four things break Holt-Winters, and only one of them has the courtesy to fail loudly. The other three go quietly, which is worse. Knowing them is what separates using the function from trusting its output.

**1. Fewer than two full seasonal cycles.** The model has to estimate one seasonal index per period, twelve of them for monthly data. With less than two years it cannot separate "December is special" from "that particular December was a good month", so it does not try.

```r title="Eighteen months is not enough"
short <- ts(loaves[1:18], start = c(2022, 1), frequency = 12)   # 1.5 years

hw(short, seasonal = "multiplicative", h = 4)$mean
#>      Jul Aug Sep Oct
#> 2023  NA  NA  NA  NA
```

`loaves[1:18]` takes the first eighteen months (all of 2022 plus the first half of 2023), rewrapped as a monthly `ts`.

The forecast comes back as **`NA`**, four of them. Notice what did *not* happen: no error, no stop. `hw()` ran, returned an object with the right shape, and filled it with nothing. If you had piped that straight into a report you would be shipping blanks, and if you had piped it into arithmetic, the `NA`s would spread quietly into every number they touched, because almost anything times `NA` is `NA`. **Check your forecasts for `NA` before you use them.** You need at least two full cycles, and three or more before the seasonal indices are worth much.

**2. Zeros or negative values, with multiplicative seasonality.** A multiplicative model works in ratios, and it cannot make sense of a month that sold nothing: you cannot express 0 as a percentage of a level, and dividing by it in the seasonal update is worse. This one at least fails loudly.

```r title="A month with zero sales"
closed <- bakery
closed[7] <- 0     # July 2022: the oven died and the bakery shut for a month

tryCatch(hw(closed, seasonal = "multiplicative", h = 4),
         error = function(e) conditionMessage(e))
#> [1] "Inappropriate model for data with negative or zero values"
```

`closed` is a copy of the bakery with July 2022 zeroed out. `tryCatch(..., error = function(e) conditionMessage(e))` catches the error and prints its message instead of stopping the page, so you can see the text.

The message is explicit: **"Inappropriate model for data with negative or zero values"**. Your options are to switch to `seasonal = "additive"` (which handles zeros without complaint), or to treat that zero as the missing observation it really is rather than a real sale of nothing. Series that hit zero regularly, like intermittent demand for a slow-moving part, need a different method family entirely.

**3. A trend that never flattens.** Plain Holt-Winters projects the trend in a straight line forever. Twelve months out that is reasonable. Ten years out it has the bakery selling loaves by the tonne. The fix is **damping**, which shrinks the trend a little at each step so it flattens toward a level instead of climbing without limit.

```r title="Damping the trend for a long horizon"
long_plain <- hw(bakery, seasonal = "multiplicative", h = 60)
long_damp  <- hw(bakery, seasonal = "multiplicative", h = 60, damped = TRUE)

# December in five years' time, both ways
round(c(plain = long_plain$mean[60], damped = long_damp$mean[60]))
#>  plain damped
#>   1169    940
```

Both calls forecast 60 months (five years) ahead, the second with `damped = TRUE`. `$mean[60]` is the last of those, December 2030.

The plain model has the bakery selling **1,169 loaves** in December 2030, up from 848 today, because it projected about 3.9 loaves a month of growth for five straight years and never questioned it. The damped model says **940**. That is a 229-loaf disagreement about the same December, produced by one argument. Neither number is knowledge, but the damped one encodes a more defensible belief: growth usually slows. For horizons beyond a couple of seasonal cycles, damping is the safer default, and the empirical forecasting literature has found damped trends hard to beat.

**4. Seasonality that changes shape.** Holt-Winters assumes one seasonal pattern, gently updated. If the bakery starts a wholesale contract that flattens its Decembers, the model will not notice quickly, and a high fitted \(\gamma\) is your hint that something like this is going on. Structural breaks need to be handled, not smoothed over.

There is also a limit worth stating plainly: **Holt-Winters handles exactly one seasonal period.** Daily data with both a weekly and a yearly cycle is beyond it, and beyond `ets()` too. That is a real boundary of the method, not a gap in this post, and it is where models like TBATS or seasonal ARIMA start.

## hw(), HoltWinters() or ets()?

Three functions in R will fit you a Holt-Winters model, which is a reliable source of confusion. They are three doors into the same family.

`hw()` is what this post used. It comes from the forecast package, it fits the model and returns the forecast in one call, and it optimises the initial states along with the dials.

`HoltWinters()` is in base R's stats package, so it needs no install. It fits the same model with a different initialisation (it seeds the components from a decomposition of the first two cycles rather than optimising them) and returns a fitted model you then pass to `forecast()` or `predict()`.

```r title="The base R function on the same data"
hw_base <- HoltWinters(bakery, seasonal = "multiplicative")

round(coef(hw_base)[c("a", "b")], 2)
#>      a      b
#> 581.66   3.42
```

`HoltWinters()` takes the same `seasonal` argument. `coef()` pulls out its fitted components, where `a` is the level and `b` is the trend, the same quantities `hw()` called `l` and `b`.

Base R puts the level at **581.66** and the trend at **3.42**, against `hw()`'s 578.87 and 3.89. Close but not identical, and the difference is the initialisation, not a bug in either. Use `hw()` when you have the forecast package, mostly because it gives you prediction intervals and `accuracy()` in the same idiom.

`ets()` is the one worth knowing best. Rather than making you choose, it fits the whole family and picks by AICc.

```r title="Let ets() choose the model"
auto <- ets(bakery)
auto$method
#> [1] "ETS(M,A,M)"
```

`ets()` with no arguments beyond the series searches the family and returns the best-scoring fit; `$method` names the winner.

**ETS(M,A,M)**, read as three slots: the **E**rror is Multiplicative, the **T**rend is Additive, and the **S**eason is Multiplicative. The third slot is our decision, and `ets()` reached it on its own from the data, agreeing with the swing table, the AICc comparison and the holdout. The middle slot says the trend is a plain straight-line climb rather than a damped one. That three-letter taxonomy covers a wider family than Holt-Winters alone, and it is a topic of its own; section 8.4 of Hyndman and Athanasopoulos (reference 2) takes it apart properly.

So which should you reach for? Use `ets()` when you want the best model and do not need to defend a particular one. Use `hw()` when you have a reason to fix the seasonal type yourself, which is more common than it sounds: when the mechanism is known (a percentage-driven holiday rush is multiplicative whatever three years of noisy data implies), when you need the same specification across many series for comparability, or when a stakeholder needs the model to be explainable. Knowing what `ets()` would have chosen anyway is how you know whether your reason is a good one.

## FAQ

**What is the difference between `hw()` and `HoltWinters()` in R?**
They fit the same model but initialise it differently and live in different places. `HoltWinters()` is base R and seeds the level, trend and seasonal indices from a decomposition of the first two seasonal cycles. `hw()` is from the forecast package and optimises the initial states jointly with the dials, which is why its numbers differ slightly (level 578.87 versus 581.66 on the bakery). `hw()` also returns prediction intervals and works with `accuracy()`, so it is the more practical choice for forecasting.

**How much data do I need for Holt-Winters?**
At least two full seasonal cycles, or the model returns `NA` forecasts without erroring. Two years of monthly data is the bare minimum, and it is thin: each seasonal index is estimated from only two observations. Three to four cycles is where the seasonal indices become trustworthy, which is why the bakery's four years is a comfortable amount rather than a lucky one.

**Can I use multiplicative seasonality with zeros in my data?**
No. `hw()` stops with "Inappropriate model for data with negative or zero values", because a multiplicative season is a ratio and a zero has no meaningful ratio to a level. Use `seasonal = "additive"` instead, or, if the zeros are really missing observations rather than genuine zero sales, treat them as `NA` and let the model handle the gap.

**Should I log-transform instead of using multiplicative seasonality?**
It is a real alternative: taking logs turns a multiplicative pattern into an additive one, so `hw()` with `seasonal = "additive"` on `log(bakery)` gets at a similar idea. The catch is that back-transforming the forecast introduces a bias that needs correcting, and your prediction intervals end up asymmetric on the original scale. Multiplicative Holt-Winters gets you there directly and keeps the output in loaves. Use logs when the variance is misbehaving for reasons beyond seasonality.

**Why are all three of my smoothing parameters so small?**
Because your series is regular. Small dials mean each component is holding steady rather than chasing new observations, which is the right response to a stable pattern. The bakery fits 0.02, 0.02 and 0.02 because its level, growth and seasonal shape barely wavered over four years. Do not force them larger; they are a readout, not a knob you should be turning.

**My forecast keeps climbing forever. Is that right?**
It is what a plain Holt-Winters trend does: a straight line, extrapolated for as long as you ask. Over one or two cycles it is fine, but at 60 months it had the bakery at 1,169 loaves a December. Add `damped = TRUE` to shrink the trend gradually toward flat. For any horizon beyond a couple of seasonal cycles, damping is the safer default.

## Summary

Ridge Road Bakery should order flour for about **900 loaves** in December 2026, and expect to be within roughly 50 either way. That number came from three components and one decision, and you can now rebuild it by hand.

| Idea | What it means | In R |
|---|---|---|
| The three components | Level \(\ell_t\), trend \(b_t\), and one seasonal index \(s_t\) per period | `fit$model$states` |
| The three dials | \(\alpha\), \(\beta\), \(\gamma\): how hard new data moves each component | `fit$model$par` |
| Additive season | The season is a fixed number of units; typical month = 0 | `seasonal = "additive"` |
| Multiplicative season | The season is a percentage of the level; typical month = 1 | `seasonal = "multiplicative"` |
| The diagnostic | Swing grows while swing-to-level ratio stays flat = multiplicative | the swing table in section 3 |
| The forecast rule | `(level + h * trend) * season`, or `+ season` if additive | `fit$mean` |
| Confirming the choice | Lower AICc wins; a holdout measures it directly | `fit$model$aicc`, `accuracy(f, test)` |
| `s1` gotcha | State matrix stores seasonal indices newest-first, not January-first | `states[nrow(states), "s1"]` |
| Needs 2+ cycles | Less returns `NA` forecasts, silently | check for `NA` |
| Zeros | Break multiplicative outright; additive copes | `seasonal = "additive"` |
| Long horizons | An undamped trend climbs without limit | `damped = TRUE` |
| Letting R choose | Fits the family, picks by AICc, agreed with us here | `ets(bakery)` |

Two things are worth carrying away. The additive-or-multiplicative question is **empirical, not stylistic**: the swing table, the AICc gap and the holdout all answered it the same way in about ten lines, and the answer was worth 41 loaves on the one forecast the bakery cared about. And the model has **no hidden machinery**: level, plus twelve months of trend, times December's multiplier, is `(578.8714 + 12 * 3.8910) * 1.4394`, which lands on 900.4 and is exactly the number `hw()` printed. Everything else is R finding good values for those three components.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 8.3. The canonical treatment of Holt-Winters, including both seasonal forms and the damped variant. [otexts.com/fpp3/holt-winters.html](https://otexts.com/fpp3/holt-winters.html)
2. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 8.4. The ETS taxonomy that names our fitted model ETS(M,A,M), and where the third letter is the choice this post made. [otexts.com/fpp3/taxonomy.html](https://otexts.com/fpp3/taxonomy.html)
3. `ses()` / `holt()` / `hw()` reference manual, forecast package. The full argument list for `hw()`, including `seasonal`, `damped`, `alpha`, `beta` and `gamma`. [pkg.robjhyndman.com/forecast/reference/ses.html](https://pkg.robjhyndman.com/forecast/reference/ses.html)
4. `ets()` reference manual, forecast package. The automatic model selection used in the last section, and its `model` string syntax. [pkg.robjhyndman.com/forecast/reference/ets.html](https://pkg.robjhyndman.com/forecast/reference/ets.html)
5. `HoltWinters()` reference manual, base R stats. The base R implementation, including how it seeds the initial components differently from `hw()`. [stat.ethz.ch/R-manual/R-devel/library/stats/html/HoltWinters.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/HoltWinters.html)
6. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. The paper describing how the package fits these models and selects among them by AICc. [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03)
7. NIST/SEMATECH *e-Handbook of Statistical Methods*, section 6.4.3.5: Triple Exponential Smoothing. A short, independent derivation of the same three update equations. [itl.nist.gov/div898/handbook/pmc/section4/pmc435.htm](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc435.htm)
8. forecast package on CRAN. Version history and the full reference manual for every function used here. [cran.r-project.org/package=forecast](https://cran.r-project.org/package=forecast)

## Continue Learning

- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html), where this bakery started. It builds the level recursion and the alpha dial from nothing in six lines, which is the one component Holt-Winters inherits unchanged.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), the other way to split a series into trend and season. It answers the same additive-or-multiplicative question from a descriptive angle, and is a good way to eyeball the diagnostic from section 3 before you fit anything.
- [Time Series Objects in R](Time-Series-Objects-in-R.html), on `ts` objects and `frequency`. Worth ten minutes if the `frequency = 12` line in section 1 was doing more work than you expected.
- [Moving Averages in R](Moving-Averages-in-R.html), the smoothing family seen from the descriptive side, and the machinery `HoltWinters()` uses internally to seed its initial seasonal indices.

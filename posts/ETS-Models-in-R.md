---
title: "ETS Models in R: Error, Trend, and Seasonal Components"
slug: "ETS-Models-in-R"
description: "ETS labels a forecast's error, trend and season as none, additive or multiplicative. Read all 30 models, let ets() choose, and know what each one implies."
keywords: "ETS models in R, ets() R, error trend seasonal, ETS(M,A,M), exponential smoothing state space, automatic forecasting R, damped trend R, ETS model selection"
auto_link_terms: "ETS|ETS model|ETS models|ETS models in R|ets()|the ETS framework|ETS taxonomy|error, trend and season|multiplicative error|additive error|damped trend|automatic model selection|state space model|the three-letter taxonomy"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "3.8.9"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ETS Models"
sidebar_order: 13
difficulty: "Intermediate"
---

<p class="lead">ETS is a naming scheme for exponential smoothing models. It describes any of them with three letters, one per moving part: <b>E</b> for how the error behaves, <b>T</b> for the trend, <b>S</b> for the season. Each slot gets <b>N</b> (none), <b>A</b> (additive) or <b>M</b> (multiplicative), and the trend slot also allows damped versions, which is how the family reaches exactly 30 members. This post decodes the letters on one dataset, rebuilds a forecast by hand from the components they name, fits all 30 models so the count stops being a claim, and shows what R's <code>ets()</code> is really doing when it picks one for you.</p>

Everything below uses one dataset, the same one the last two posts used, so you always have something concrete to picture.

**Ridge Road Bakery** sells sourdough loaves. In [the exponential smoothing post](Exponential-Smoothing-in-R.html) their weekly counts got a flat forecast, because simple exponential smoothing tracks only a level. In [the Holt-Winters post](Holt-Winters-in-R.html) their **monthly ledger, four full years of it, January 2022 through December 2025**, got a forecast with a shape: December 2026 at about **900 loaves**. That post ended by mentioning that `ets()` looked at the same ledger and called its own model **ETS(M,A,M)**, then left the three letters unexplained and moved on.

This post is those three letters. And there is a loose end worth naming now, because you will notice it in the first code block: `ets()` does not say 900. It says **871**. Same bakery, same four years, a 29-loaf gap. By the end you will know exactly which argument causes it, and which of the two numbers to trust.

## What model does ets() choose for the bakery?

`ets()` takes a series and hands back a fitted model with a name. No arguments beyond the data, no decisions asked of you. Here it is on the bakery's ledger, before any explanation of what the name means.

```r title="Let ets() name and fit a model"
suppressMessages(library(forecast))

# Ridge Road Bakery: sourdough loaves sold per month, Jan 2022 to Dec 2025.
loaves <- c(393, 392, 422, 429, 483, 448, 414, 408, 471, 498, 552, 686,
            433, 409, 464, 479, 479, 476, 409, 415, 505, 525, 601, 723,
            469, 447, 477, 503, 523, 508, 462, 454, 541, 563, 626, 770,
            475, 463, 492, 559, 565, 530, 489, 500, 574, 597, 672, 848)

# frequency = 12 tells R the season repeats every 12 observations.
bakery <- ts(loaves, start = c(2022, 1), frequency = 12)

fit <- ets(bakery)
fit$method
#> [1] "ETS(M,A,M)"

round(forecast(fit, h = 12)$mean)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2026 514 494 539 570 595 567 511 513 605 629 707 871
```

Take the code apart line by line. `library(forecast)` loads the package that supplies `ets()`, and `suppressMessages()` keeps its startup banner out of the output. `loaves` is the ledger read left to right, top to bottom, so entry 12 (686) is December 2022 and entry 48 (848) is December 2025. `ts(loaves, start = c(2022, 1), frequency = 12)` wraps the bare numbers into a time series object: `start = c(2022, 1)` says observation one is month one of 2022, and `frequency = 12` says the cycle is twelve observations long, which is the only thing telling R that entries 12, 24, 36 and 48 are all Decembers. (There is more on this in [Time Series Objects in R](Time-Series-Objects-in-R.html).)

`ets(bakery)` is the whole fitting call. `fit$method` is the name it chose, and `forecast(fit, h = 12)$mean` holds the twelve monthly point forecasts, rounded here for readability.

Two things came back. The name, **ETS(M,A,M)**, which is what this post is about. And a forecast with the bakery's own year in it: a February trough at 494, the summer dip at 511 and 513, then the climb to **871** in December. Nobody told `ets()` that December matters, that the bakery is growing, or that the seasonal swing is a percentage rather than a fixed number of loaves. It read all of that off 48 numbers and wrote its conclusion in three letters.

Those letters are not a label R invented for display. They are the model. Printing the fitted object shows the parts they name.

```r title="What the name is standing for"
fit
#> ETS(M,A,M) 
#> 
#> Call:
#> ets(y = bakery)
#> 
#>   Smoothing parameters:
#>     alpha = 0.0147 
#>     beta  = 2e-04 
#>     gamma = 0.0135 
#> 
#>   Initial states:
#>     l = 449.6068 
#>     b = 2.6447 
#>     s = 1.437 1.1705 1.0463 1.0106 0.8614 0.8609
#>            0.9608 1.0116 0.9734 0.9258 0.852 0.8898
#> 
#>   sigma:  0.0245
#> 
#>      AIC     AICc      BIC 
#> 442.1174 462.5174 473.9279
```

Read it top to bottom. The **smoothing parameters** are the three dials from the previous two posts: `alpha` for the level, `beta` for the trend, `gamma` for the season, each between 0 and 1, each saying how fast that component chases new data. The **initial states** are where the three components started in January 2022: a level `l` of 450 loaves, a trend `b` of 2.64 loaves per month, and twelve seasonal values `s`. **sigma** is the size of the model's error, and the fact that it reads 0.0245 rather than something in loaves is the first hint about the E slot. The three numbers at the bottom are information criteria, fit scores that let R rank one model against another. They are how `ets()` chose this model over the others, and the section on how it chooses comes back to them.

> **Note:** `alpha`, `beta` and `gamma` are the same dials `hw()` and `ses()` use, and they mean the same thing here. What ETS adds is not new dials, it is a naming scheme for which components exist at all and how they combine.

## What do the three letters mean?

The name has three slots, always in the same order: **E**rror, **T**rend, **S**eason. Each slot answers one question about the series with one letter.

**N** means none: the component is absent. **A** means additive: the component works by addition, in the units of the data. **M** means multiplicative: the component works by multiplication, as a percentage of whatever the series currently sits at. The trend slot has two extra options, **Ad** and **Md**, the damped versions, which bend the trend gradually toward flat instead of extrapolating it forever.

![Flowchart of the three ETS slots, each with its options, multiplying out to 30 models](screenshots/ETS-Models-in-R-taxonomy.webp)
*Figure 1: The three slots of an ETS model. Every model in the family is one choice from each column, which is why the count comes out at 2 x 5 x 3 = 30.*

So **ETS(M,A,M)** is a specific set of three claims about Ridge Road Bakery:

- **E = M**: the error is multiplicative, so the bakery's unpredictability is a percentage of its size, not a fixed number of loaves.
- **T = A**: the trend is additive, so growth is a fixed number of loaves added per month, a straight line rather than a compounding curve.
- **S = M**: the season is multiplicative, so December is a multiplier on the level, not a fixed bonus of loaves.

Those are claims you can check, because the fitted components are stored in the model. `fit$states` is a matrix with one row per time point; the last row is where every component ended up in December 2025.

```r title="Where the components ended up"
states <- fit$states[nrow(fit$states), ]
round(states, 3)
#>       l       b      s1      s2      s3      s4      s5      s6      s7      s8      s9     s10 
#> 574.978   2.630   1.437   1.170   1.046   1.010   0.861   0.861   0.961   1.011   0.973   0.925 
#>     s11     s12 
#>   0.852   0.890
```

`nrow(fit$states)` is the number of rows, so `fit$states[nrow(fit$states), ]` is the final row. It holds fourteen numbers: the level `l`, the trend `b`, and twelve seasonal values `s1` to `s12`.

The level ended at **574.98** loaves, which is the bakery's underlying size in December 2025 with the season taken out. The trend ended at **2.63**, meaning the level is growing by about two and a half loaves per month. The twelve `s` values are the seasonal multipliers, and every one of them sits near 1: they multiply.

The `s` numbering is the one genuinely confusing thing here, so do not guess at it. **`s1` is the most recent season, and they run backwards from there.** The series ends in December 2025, so `s1` is December, `s2` is November, and `s12` is January. Relabelling them in calendar order makes them readable.

```r title="The seasonal multipliers, in calendar order"
season <- states[paste0("s", 1:12)]
names(season) <- month.abb[12:1]     # s1 is December, s2 November, ... s12 January

round(season[month.abb], 3)
#>   Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec 
#> 0.890 0.852 0.925 0.973 1.011 0.961 0.861 0.861 1.010 1.046 1.170 1.437

# The same thing as percentages above or below a normal month.
round(100 * (season[month.abb] - 1), 1)
#>   Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec 
#> -11.0 -14.8  -7.5  -2.7   1.1  -3.9 -13.9 -13.9   1.0   4.6  17.0  43.7
```

`paste0("s", 1:12)` builds the names `"s1"` through `"s12"` to pull those twelve entries out. `month.abb` is a vector built into R holding `"Jan"` through `"Dec"`, so `month.abb[12:1]` is that vector reversed, which is the order the `s` values are actually in. Indexing by `season[month.abb]` then puts them back into calendar order. Subtracting 1 and multiplying by 100 turns each multiplier into a percentage: 1.437 becomes +43.7%.

Now check them against the ledger. February is the year's trough at 0.852, a February being about 15% below a normal month, and the raw ledger agrees (392, 409, 447, 463, the smallest number in every year). July and August both sit at 0.861, the summer dip. November is +17%, December is **+43.7%**. The model never saw a calendar. It recovered the bakery's year from the numbers alone, and expressed it exactly the way the S slot promised: as multipliers.

Which means the December forecast is not a mystery. It is those components put back together, and you can do it by hand.

```r title="Rebuild the December forecast from the components"
level    <- unname(states["l"])    # 574.978, the level in Dec 2025
growth   <- unname(states["b"])    # 2.630 loaves added per month
dec_mult <- unname(states["s1"])   # 1.437, December's multiplier

# T = A: twelve months of trend get ADDED to the level.
round(level, 2)
#> [1] 574.98
round(level + 12 * growth, 2)
#> [1] 606.54

# S = M: December's multiplier gets MULTIPLIED in.
round((level + 12 * growth) * dec_mult, 2)
#> [1] 871.46

# Which is exactly what forecast() said.
round(forecast(fit, h = 12)$mean[12], 2)
#> [1] 871.46
```

`unname()` strips the names off, so the results print as plain numbers instead of carrying an `l` or `s1` label around. Then the arithmetic is the model, one slot at a time. Start at the level, 574.98. December 2026 is twelve months past the end of the data, and because **T is additive**, those twelve months are `12 * 2.630 = 31.6` loaves *added*, giving 606.54. Because **S is multiplicative**, December is not another addition but a *multiplication* by 1.437, giving **871.46**. And `forecast()` returns 871.46.

That is the whole point of the taxonomy. The letters tell you which arithmetic assembles the forecast: A means you add that component, M means you multiply by it, N means it is not there at all. In general the point forecast \(h\) steps ahead of the end of an ETS(M,A,M) fit is

\[ \hat{y}_{t+h} = (\ell_t + h \, b_t) \, s_{t+h-m} \]

where \(\ell_t\) is the final level, \(b_t\) the final trend per period, \(m\) the season length (12 here), and \(s_{t+h-m}\) the seasonal multiplier for the month you are forecasting. Set \(h = 12\), \(\ell_t = 574.978\), \(b_t = 2.630\), \(s = 1.437\) and you get the 871.46 above.

**Try it:** Rebuild July 2026 the same way. July is seven months past the end of the data, and its multiplier is `s6`. Work out the number before you run it: the summer dip is about 14% down, so expect something well below the level.

```r title="Your turn: rebuild July by hand"
jul_mult <- unname(states["s6"])

# 1. Print jul_mult and check it against the calendar table above
# 2. Apply the same recipe: (level + 7 * growth) * jul_mult
# 3. Compare against forecast(fit, h = 12)$mean[7]
# Expected: a number near 511, matching the forecast exactly
```

<details><summary>Click to reveal solution</summary>

```r title="July-by-hand solution"
jul_mult <- unname(states["s6"])
round(jul_mult, 3)
#> [1] 0.861

round((level + 7 * growth) * jul_mult, 2)
#> [1] 510.86

round(forecast(fit, h = 12)$mean[7], 2)
#> [1] 510.86
```

Seven months of trend added to the level gives 593.39, and July's 0.861 multiplier pulls it down to **510.86**, which is exactly what `forecast()` returns for July 2026. The recipe did not change between December and July. Only the multiplier did, and `s6` is July because the `s` values count backwards from December.

</details>

## Why are there exactly 30 models?

The count follows from the slots. Multiply the options together: **2 errors x 5 trends x 3 seasons = 30**.

| Slot | Options | Count |
|---|---|---|
| **E**rror | A, M | 2 |
| **T**rend | N, A, Ad, M, Md | 5 |
| **S**eason | N, A, M | 3 |

The error slot has no N, and that is not an oversight. A model with no error term would claim the bakery is perfectly predictable, which is not a forecasting model at all, so every ETS model has an error and the only question is whether it is additive or multiplicative. The trend slot has five because A and M each come in a damped variant, Ad and Md, and "no trend" is a real option. The season slot has three, with N covering every series that has no repeating cycle.

Rather than take the multiplication on faith, build the list.

```r title="Enumerate the whole family"
family <- expand.grid(season = c("N", "A", "M"),
                      trend  = c("N", "A", "Ad", "M", "Md"),
                      error  = c("A", "M"),
                      stringsAsFactors = FALSE)
family$label <- sprintf("ETS(%s,%s,%s)", family$error, family$trend, family$season)

nrow(family)
#> [1] 30

family$label
#>  [1] "ETS(A,N,N)"  "ETS(A,N,A)"  "ETS(A,N,M)"  "ETS(A,A,N)"  "ETS(A,A,A)"  "ETS(A,A,M)" 
#>  [7] "ETS(A,Ad,N)" "ETS(A,Ad,A)" "ETS(A,Ad,M)" "ETS(A,M,N)"  "ETS(A,M,A)"  "ETS(A,M,M)" 
#> [13] "ETS(A,Md,N)" "ETS(A,Md,A)" "ETS(A,Md,M)" "ETS(M,N,N)"  "ETS(M,N,A)"  "ETS(M,N,M)" 
#> [19] "ETS(M,A,N)"  "ETS(M,A,A)"  "ETS(M,A,M)"  "ETS(M,Ad,N)" "ETS(M,Ad,A)" "ETS(M,Ad,M)"
#> [25] "ETS(M,M,N)"  "ETS(M,M,A)"  "ETS(M,M,M)"  "ETS(M,Md,N)" "ETS(M,Md,A)" "ETS(M,Md,M)"
```

`expand.grid()` builds every combination of the vectors you hand it, one row per combination, which is exactly the multiplication done for you. `stringsAsFactors = FALSE` keeps the letters as text rather than factors, so `sprintf()` can paste them into the `ETS(x,y,z)` shape. There are **30 rows**, and printing `family$label` shows all 30 names.

Several of them are already familiar under other titles. `ETS(A,N,N)` is simple exponential smoothing, the flat-line model from [the exponential smoothing post](Exponential-Smoothing-in-R.html). `ETS(A,A,N)` is Holt's linear trend method. `ETS(A,A,A)` is additive Holt-Winters and `ETS(M,A,M)` is the multiplicative one. The taxonomy is not a new set of models; it is a filing system that gives the methods you already know their coordinates, and fills in the gaps between them.

And every one of the 30 is a real model that R will fit. Here is the whole family fitted to the bakery, scored and ranked.

```r title="Fit all 30 to the bakery"
family$aicc <- NA_real_

for (i in seq_len(nrow(family))) {
  spec <- paste0(family$error[i], substr(family$trend[i], 1, 1), family$season[i])
  f <- suppressWarnings(ets(bakery, model = spec, damped = grepl("d", family$trend[i]),
                            allow.multiplicative.trend = TRUE, restrict = FALSE))
  family$aicc[i] <- round(f$aicc, 1)
}

ranked <- family[order(family$aicc), c("label", "aicc")]
print(head(ranked, 5), row.names = FALSE)
#>        label  aicc
#>   ETS(A,M,M) 457.3
#>   ETS(M,M,M) 460.2
#>   ETS(A,A,M) 460.7
#>   ETS(M,A,M) 462.5
#>  ETS(A,Md,M) 473.9

print(tail(ranked, 3), row.names = FALSE)
#>        label  aicc
#>   ETS(A,N,N) 621.4
#>  ETS(A,Ad,N) 628.4
#>  ETS(A,Md,N) 628.9
```

Walk through the loop. `spec` builds the three-letter string `ets()` wants, and because that string has no room for the little `d`, damping is passed separately: `substr(family$trend[i], 1, 1)` takes just the first letter of `"Ad"`, and `grepl("d", family$trend[i])` is `TRUE` exactly when the trend was a damped one. The two arguments `allow.multiplicative.trend = TRUE` and `restrict = FALSE` open up combinations `ets()` will not consider on its own, which is what the section on how `ets()` chooses is about. `suppressWarnings()` keeps the optimiser's grumbles about the awkward fits out of the output. Printing with `row.names = FALSE` drops the row numbers R would otherwise put down the left edge, which here are just leftovers from the original ordering and mean nothing. `AICc` is a fit score where **lower is better**; the same section explains it.

Look at what ranked where. Every model in the top five ends in **M**, a multiplicative season, which is the bakery's December spike being detected over and over by different models. Every model at the bottom ends in **N**, no season at all, and the gap between best and worst is about 170 AICc points, which is enormous. The single biggest thing about this series is that it has a season, and the taxonomy makes that visible as a pattern across the whole family rather than a single verdict.

Note also that `ETS(M,A,M)`, the model `ets(bakery)` actually chose, sits **fourth** on this list. That is not a mistake, and it is not a contradiction. It is a consequence of what `ets()` will and will not consider, which is exactly what the section on how `ets()` chooses is for.

**Try it:** How many of the 30 models could possibly apply to a series with no season at all, like the bakery's original 24 weekly counts?

```r title="Your turn: count the non-seasonal models"
# The season slot is fixed at N. The other two slots are still free.
# Work it out from the table above, then check your arithmetic in R.
# Expected: 10
```

<details><summary>Click to reveal solution</summary>

```r title="Non-seasonal count solution"
# 2 errors x 5 trends x 1 season (N)
2 * 5 * 1
#> [1] 10

# The same answer, read off the enumerated family:
sum(family$season == "N")
#> [1] 10
```

Fixing the season at N leaves 2 errors and 5 trends, so **10** of the 30 models remain, and counting the rows of the family where `season == "N"` confirms it. Those ten are the entire non-seasonal toolkit: `ETS(A,N,N)` is simple exponential smoothing, `ETS(A,A,N)` is Holt's method, `ETS(A,Ad,N)` is damped Holt, and so on. This is why the weekly slice in the exponential smoothing post had so few sensible options: with no season, five sixths of the family is off the table before you start.

</details>

## What does the error slot actually change?

The T and S slots have visible jobs: they put the climb and the December spike into the forecast. The E slot is the one people skip, because its job is invisible in the point forecast. Look again at the point-forecast formula from earlier:

\[ \hat{y}_{t+h} = (\ell_t + h \, b_t) \, s_{t+h-m} \]

There is no error term in it. The level, the trend and the season are all there; the E slot is not. That is not sloppy notation. The error has an average of zero (additive) or an average of one as a multiplier (multiplicative), so when you forecast the *average* outcome, it drops out. The E slot does not tell you where the forecast points.

What it tells you is **how big the misses are, and whether that size depends on how big the bakery is**. Written out, an additive-error model says each observation is the components plus a shock:

\[ y_t = (\ell_{t-1} + b_{t-1}) \, s_{t-m} + \varepsilon_t \]

and a multiplicative-error model says each observation is the components times a shock:

\[ y_t = (\ell_{t-1} + b_{t-1}) \, s_{t-m} \, (1 + \varepsilon_t) \]

In both, \(y_t\) is the loaves actually sold in month \(t\), \(\ell_{t-1}\) and \(b_{t-1}\) are the level and trend carried in from last month, \(s_{t-m}\) is the seasonal factor for this month from one cycle back, and \(\varepsilon_t\) is the random shock, averaging zero with standard deviation \(\sigma\).

The difference is where \(\varepsilon_t\) attaches. In the additive form it is **added in loaves**, so \(\sigma\) is a count: a typical miss is 30 loaves, in February and in December alike. In the multiplicative form it is added to 1 and **multiplied through**, so \(\sigma\) is a *fraction*: a typical miss is 2.45% of whatever that month was heading for. That is why `sigma: 0.0245` printed as a decimal rather than a loaf count back in the very first printout. It was a percentage all along.

That difference never shows up in the point forecast. It shows up entirely in the **prediction interval**, the range the model gives around each forecast. So compare the two.

```r title="An additive error and a multiplicative error, side by side"
add_err <- forecast(ets(bakery, model = "AAA"), h = 12)   # additive error
mul_err <- forecast(ets(bakery, model = "MAM"), h = 12)   # multiplicative error

# The 95% interval reaches this far either side of each point forecast.
spread_add <- (add_err$upper[, 2] - add_err$lower[, 2]) / 2
spread_mul <- (mul_err$upper[, 2] - mul_err$lower[, 2]) / 2

compare <- data.frame(
  month    = month.abb,
  add_fc   = round(as.numeric(add_err$mean)),
  add_pm   = round(spread_add, 1),
  add_pct  = round(100 * spread_add / as.numeric(add_err$mean), 1),
  mult_fc  = round(as.numeric(mul_err$mean)),
  mult_pm  = round(spread_mul, 1),
  mult_pct = round(100 * spread_mul / as.numeric(mul_err$mean), 1)
)
print(compare, row.names = FALSE)
#>  month add_fc add_pm add_pct mult_fc mult_pm mult_pct
#>    Jan    519   29.9     5.8     514    24.7      4.8
#>    Feb    513   29.9     5.8     494    23.7      4.8
#>    Mar    553   30.0     5.4     539    25.9      4.8
#>    Apr    587   30.1     5.1     570    27.4      4.8
#>    May    602   30.2     5.0     595    28.6      4.8
#>    Jun    582   30.4     5.2     567    27.3      4.8
#>    Jul    543   30.7     5.7     511    24.5      4.8
#>    Aug    541   31.1     5.8     513    24.7      4.8
#>    Sep    623   31.6     5.1     605    29.1      4.8
#>    Oct    648   32.1     5.0     629    30.2      4.8
#>    Nov    713   32.8     4.6     707    34.0      4.8
#>    Dec    859   33.6     3.9     871    41.9      4.8
```

`ets(bakery, model = "AAA")` forces additive error, additive trend, additive season, and `model = "MAM"` forces the multiplicative-error, multiplicative-season version; both keep the same additive trend, so the E and S slots are the only things moving. `$upper[, 2]` and `$lower[, 2]` are the 95% interval bounds (column 1 would be the 80% interval), so half their difference is how far the interval reaches either side of the point forecast. `add_pm` is that reach in loaves and `add_pct` is the same thing as a percentage of the forecast.

Now read the two `pm` columns down the page, because this is the whole E slot in one table.

The **additive-error** model's reach barely moves: 29.9 loaves in January, 33.6 in December. It is claiming that December, a 859-loaf month, is predictable to within about the same number of loaves as February, a 513-loaf month. As a percentage that means its confidence *improves* as the months get bigger, from 5.8% down to **3.9%**.

The **multiplicative-error** model's reach grows with the month: 24.7 loaves in January, **41.9** in December. As a percentage it is 4.8% in January and 4.8% in December, and 4.8% in every other month too. Not approximately. Look at the whole `mult_pct` column: it is flat.

That is the E slot, stated as plainly as it can be. **Additive error means the misses are a constant number of loaves. Multiplicative error means the misses are a constant percentage.** And you can see which one the bakery is by asking the owner a question they can actually answer: is a busy December as predictable as a quiet February to within 30 loaves either way, or is every month predictable to within about 5% of itself? For a business whose December is half again the size of its February, the percentage story is the honest one, and that is the M in the first slot.

```r title="See the two error shapes"
par(mfrow = c(2, 1), mar = c(3, 4, 3, 1))

plot(add_err, main = "ETS(A,A,A): additive error, a constant band",
     ylab = "loaves", xlab = "", fcol = "steelblue", flwd = 2)
plot(mul_err, main = "ETS(M,A,M): multiplicative error, a band that flares in December",
     ylab = "loaves", xlab = "", fcol = "tomato", flwd = 2)

par(mfrow = c(1, 1))
```

`par(mfrow = c(2, 1))` stacks two plots vertically so the interval shapes line up for comparison, and `plot()` on a forecast object draws the history, the point forecast and the shaded intervals for free. In the top panel the shaded band keeps a near-constant width as it crosses the twelve months, including through the December spike. In the bottom panel the band is visibly narrow through the quiet months and flares out over November and December, tracking the size of what it is predicting.

**Try it:** December's forecast is about 1.76 times February's. If the multiplicative-error interval really is a constant percentage, its December reach should be 1.76 times its February reach. Check it.

```r title="Your turn: is the spread really proportional?"
# spread_mul holds the 12 half-widths; [12] is December, [2] is February.
# 1. Compute the ratio of the December reach to the February reach
# 2. Compute the ratio of the December forecast to the February forecast
# 3. Compare the two ratios
# Expected: both ratios are the same number
```

<details><summary>Click to reveal solution</summary>

```r title="Proportional-spread solution"
round(unname(spread_mul[12] / spread_mul[2]), 2)
#> [1] 1.76

round(unname(mul_err$mean[12] / mul_err$mean[2]), 2)
#> [1] 1.76
```

The December interval is 1.76 times as wide as February's, and December's forecast is 1.76 times February's. The two ratios are the same number because that is precisely what a multiplicative error means: the uncertainty is a fixed fraction of the level, so scaling the forecast scales the interval by the same amount. Run the same two lines on `spread_add` and `add_err` and the ratios come apart, because a constant band cannot track a growing forecast.

</details>

## How does ets() choose one, and what does it skip?

`ets()` fits a set of candidate models, scores each one, and keeps the best. The score is **AICc**, the corrected Akaike Information Criterion, and lower is better. It rewards a model for fitting the data and penalises it for every parameter it uses, so a model only earns its extra dials by fitting better than they cost. The correction is a small-sample adjustment, and with 48 observations the bakery counts as a small sample, which is why AICc rather than plain AIC is the default.

The important thing is what the candidate set contains, because it is **not** all 30. Two defaults narrow it before scoring starts.

`allow.multiplicative.trend = FALSE` removes every model with an M or Md trend, which is 12 of the 30, leaving 18. `restrict = TRUE` then removes combinations that are numerically unstable, which for the remaining 18 means the three that pair an additive error with a multiplicative season. So the real search is 15 models.

```r title="What ets() actually considers by default"
default_space <- expand.grid(season = c("N", "A", "M"),
                             trend  = c("N", "A", "Ad"),
                             error  = c("A", "M"),
                             stringsAsFactors = FALSE)
default_space$label <- sprintf("ETS(%s,%s,%s)",
                               default_space$error, default_space$trend, default_space$season)

# Which of these will ets() actually fit with its default restrict = TRUE?
default_space$allowed <- vapply(seq_len(nrow(default_space)), function(i) {
  spec <- paste0(default_space$error[i], substr(default_space$trend[i], 1, 1),
                 default_space$season[i])
  f <- try(suppressWarnings(ets(bakery, model = spec,
                                damped = grepl("d", default_space$trend[i]))), silent = TRUE)
  !inherits(f, "try-error")
}, logical(1))

nrow(default_space)
#> [1] 18
sum(default_space$allowed)
#> [1] 15
default_space$label[!default_space$allowed]
#> [1] "ETS(A,N,M)"  "ETS(A,A,M)"  "ETS(A,Ad,M)"
```

`vapply()` runs a function over each row and insists the answer is a single logical each time, which is a safer `sapply()`. Inside, `try(..., silent = TRUE)` attempts the fit and captures the failure instead of stopping the script, and `inherits(f, "try-error")` asks whether that attempt failed, so `allowed` ends up `TRUE` for the models `ets()` will fit and `FALSE` for the ones it refuses.

Of the 18 models left once multiplicative trends are excluded, **15** fit and **3** are refused: `ETS(A,N,M)`, `ETS(A,A,M)` and `ETS(A,Ad,M)`. All three are the same idea, an additive error bolted onto a multiplicative season, and they are excluded because that pairing has no finite variance, so the model can produce forecasts that blow up. `restrict = TRUE` is R declining to hand you a model that is known to misbehave.

This explains the fourth-place finish in the all-30 ranking above. On the full 30, `ETS(A,M,M)` scored 457.3, better than the 462.5 of the `ETS(M,A,M)` that `ets()` actually chose. But `ETS(A,M,M)` has a multiplicative trend and an additive error paired with a multiplicative season, so it is outside the default search twice over. `ets()` did not miss it. It refused it.

> **Watch out:** AICc measures fit to the 48 months you have. It says nothing about what happens at long horizons. A multiplicative trend compounds, so a model that fits slightly better in-sample can forecast a bakery selling absurd numbers of loaves a few years out. That is why `allow.multiplicative.trend` defaults to `FALSE`: the models it hides are dangerous more often than they are useful, and the default is protecting you rather than restricting you. Turn it on only if you have a reason to believe growth compounds, and check the long-horizon forecast when you do.

## How do you override the choice?

The `model` argument takes the three-letter string directly, so anything `ets()` chose is a suggestion you can overrule. The letters go in slot order, and **Z** means "choose this slot for me". `ets(bakery)` is really `ets(bakery, model = "ZZZ")`: all three slots automatic. `model = "MAM"` fixes all three. `model = "ZZM"` would fix only the season as multiplicative and let R pick the error and trend.

Damping does not fit in a three-letter string, so it rides along as the separate `damped` argument: `damped = TRUE` forces it, `damped = FALSE` forbids it, and `damped = NULL` (the default) lets `ets()` try both.

```r title="Force a model, and force damping"
# Force the fully additive model, the same one hw(seasonal = "additive") fits.
forced_add <- ets(bakery, model = "AAA")
forced_add$method
#> [1] "ETS(A,A,A)"
round(forecast(forced_add, h = 12)$mean[12], 1)
#> [1] 858.9

# Force a damped trend on the automatic winner.
damped_fit <- ets(bakery, model = "MAM", damped = TRUE)
damped_fit$method
#> [1] "ETS(M,Ad,M)"

# Damping cost this series 13 AICc points, so ets() was right to skip it.
round(c(straight = fit$aicc, damped = damped_fit$aicc), 1)
#> straight   damped 
#>    462.5    475.8
```

`ets(bakery, model = "AAA")` fixes all three slots as additive; its December forecast is 858.9 loaves, about 13 below the automatic model's 871. `ets(bakery, model = "MAM", damped = TRUE)` keeps the winning error and season but bends the trend, and `$method` confirms the middle slot became `Ad`. Comparing the two AICc values, damping scores 475.8 against the undamped 462.5, which is **13 points worse**. `ets()` tried the damped version during its search and rejected it for exactly this reason, and now you can see the number it rejected it on.

Forcing a model is not a hack; it is a normal part of forecasting. Fix the slots when the mechanism is known (a holiday rush driven by percentages is multiplicative whatever four noisy years imply), when you need one specification across many series so the results compare, or when someone has to defend the model in a meeting. The automatic choice is the thing you check your reasoning against.

**Try it:** Force the simplest model in the family, `ETS(A,N,N)`, onto the bakery. It has no trend and no season, so predict what its twelve forecasts will look like before you run it.

```r title="Your turn: force the simplest model"
# model = "ANN" is simple exponential smoothing: level only.
# 1. Fit it and print $method
# 2. Print the February and December forecasts: forecast(flat, h = 12)$mean[c(2, 12)]
# 3. Ask why the bakery's owner would find this forecast useless
# Expected: both months identical, because a level-only model draws a flat line
```

<details><summary>Click to reveal solution</summary>

```r title="Simplest-model solution"
flat <- ets(bakery, model = "ANN")
flat$method
#> [1] "ETS(A,N,N)"

round(forecast(flat, h = 12)$mean[c(2, 12)], 1)
#> [1] 800.6 800.6
```

February and December get the same number, **800.6**, because with N in both the trend and season slots there is nothing in the model that can tell one month from another. It is the flat line from the exponential smoothing post, and the number is useless in both directions at once: it would have the bakery over-produce by 300 loaves in February and under-produce by 70 in December. Worth noticing that it is the *December* level it settled near, because December's huge values drag the level up. A model with no season does not ignore the season; it smears it across every month.

</details>

## Why did hw() say 900 when ets() says 871?

Now the loose end from the top of the post. The Holt-Winters post fit `hw(bakery, seasonal = "multiplicative")` and forecast **900** loaves for December 2026. `ets(bakery)` fits ETS(M,A,M) and forecasts **871**. Multiplicative Holt-Winters *is* ETS(M,A,M), so the same model on the same data has produced two different numbers, and that deserves an answer rather than a shrug.

The models are not different. The fitting is. `hw()` calls `ets()` internally with `model = "MAM"` and one argument changed: `opt.crit = "mse"`. That argument is the optimiser's target. `ets()` defaults to `opt.crit = "lik"`, which finds the parameters that make the observed data most likely under the state space model. `hw()` asks instead for the parameters that minimise the squared errors of the one-step-ahead fits. Two different questions, two different answers.

```r title="The whole 29-loaf gap is one argument"
like_fit <- ets(bakery, model = "MAM")                    # default: opt.crit = "lik"
mse_fit  <- ets(bakery, model = "MAM", opt.crit = "mse")  # what hw() does internally

round(forecast(like_fit, h = 12)$mean[12], 2)
#> [1] 871.46
round(forecast(mse_fit,  h = 12)$mean[12], 2)
#> [1] 900.44

# hw() from the previous post, for comparison:
round(hw(bakery, seasonal = "multiplicative", h = 12)$mean[12], 2)
#> [1] 900.44

# The difference lives entirely in beta, the trend dial.
round(c(lik = like_fit$par["beta"], mse = mse_fit$par["beta"]), 4)
#> lik.beta mse.beta 
#>   0.0002   0.0216
```

Changing one argument reproduces the previous post's 900.44 exactly, to the decimal. The two fits are the same model form; only `beta` really moved, from **0.0002** to **0.0216**.

That tiny number is the whole story. `beta` is how fast the trend chases new data. At `beta = 0.0002` the likelihood fit has essentially frozen the trend, leaving it near its initial 2.63 loaves per month for all four years. At `beta = 0.0216` the squared-error fit lets the trend drift upward, and by December 2025 it has reached 3.89 loaves per month. Extrapolate that difference twelve months and multiply by December's 1.44, and you have the 29 loaves.

So which is right? The tempting move is to let AICc settle it, and that move is a trap worth naming. AICc is built out of the likelihood, and `like_fit` is by construction the fit that makes the likelihood as large as it can be, so it wins an AICc comparison against any other fit of the same model form automatically: 462.5 against the squared-error fit's 465.6. That is arithmetic, not evidence. Scoring a likelihood fit against a squared-error fit using a likelihood-based score is asking one of the contestants to referee. The comparison that would actually settle it is out-of-sample: fit both on the first three years, forecast 2025, and see which one landed closer to what the bakery really sold.

What the two fits genuinely disagree about is the bakery, not the mathematics. `hw()` is the more optimistic of the two because it believes growth is accelerating; `ets()` believes growth is steady and the recent lift is seasonal noise. That is a question about the business. If you have outside reason to think growth really is accelerating, 900 is defensible; if you do not, 871 is the more conservative flour order. Either way, you now know it is `beta` you are betting on.

> **Note:** This is the most common way two "identical" R forecasts disagree, and it is almost never the model. Check `opt.crit`, check `initial`, check whether one function optimised the starting states and the other seeded them from a decomposition. Same equations, different objective, different answer.

## When does ETS break?

The taxonomy is tidy, which makes it easy to forget it has hard edges. Four are worth knowing before you trust an ETS forecast.

**Some combinations are forbidden outright.** You saw `restrict = TRUE` refuse the three additive-error, multiplicative-season models a moment ago. Ask for one by name and R says so plainly.

**Multiplicative anything needs strictly positive data.** A multiplicative season is a ratio, and there is no meaningful ratio to zero. If Ridge Road Bakery had closed for December 2022, that single zero would take every multiplicative model off the table.

```r title="The two ways ETS refuses"
# 1. A forbidden combination, asked for by name.
forbidden <- try(ets(bakery, model = "AAM"), silent = TRUE)
cat(as.character(forbidden))
#> Error in ets(bakery, model = "AAM") : Forbidden model combination

# 2. A zero in the data: pretend the bakery closed for December 2022.
closed_dec <- loaves
closed_dec[12] <- 0
closed <- ts(closed_dec, start = c(2022, 1), frequency = 12)

refused <- try(ets(closed, model = "MAM"), silent = TRUE)
cat(as.character(refused))
#> Error in ets(closed, model = "MAM") : 
#>   Inappropriate model for data with negative or zero values

# And left to choose, it abandons the season entirely.
ets(closed)$method
#> [1] "ETS(A,A,N)"
```

`try(..., silent = TRUE)` captures each error instead of stopping the page, and `cat(as.character(...))` prints the message R produced. The first is a flat refusal of an unstable specification. The second is the positivity rule: one zero in 48 months and every multiplicative model is gone.

The third result is the one to take seriously. Left to choose on a series with a single zero, `ets()` returned **ETS(A,A,N)**, a model with **no season at all**. One bad month did not merely downgrade the season from multiplicative to additive; it knocked the entire seasonal component out of the winning model, on a series whose defining feature is a December spike. A zero that is really a closure, a missing reading, or a data-entry slip should be `NA`, not `0`. Coding it as zero does not lose you one observation, it can lose you the shape of the year.

**One seasonal period only.** Every ETS model carries exactly one `m`. Daily data with both a weekly and a yearly cycle cannot be expressed in three letters, and neither `ets()` nor Holt-Winters will do it. That is where TBATS and seasonal ARIMA start.

**Long seasons are impractical.** `ets()` will not fit `m` above 24. A season of length 52 (weekly data) needs 52 seasonal states estimated from a handful of cycles, which is more parameters than the data can support. Fourier terms in a regression are the usual answer.

## What does this look like in fable?

The forecast package is the older of Rob Hyndman's two toolkits. Its successor, **fable**, uses tsibbles and tidyverse verbs, and it names models with the same three-letter taxonomy, because the taxonomy is the theory, not the package. The function is `ETS()` with a capital E, and the letters are spelled out as terms: `error("M") + trend("A") + season("M")`, or left off entirely to get the automatic search.

fable is not one of the packages this page can run in your browser, so the block below is for your own R session.

```r-static title="The same model in fable (run this locally)"
library(fable)
library(tsibble)
library(dplyr)

# fable wants a tsibble: a data frame with a declared time index.
bakery_tbl <- tsibble(month  = yearmonth("2022 Jan") + 0:47,
                      loaves = loaves,
                      index  = month)

ets_fit <- bakery_tbl |> model(auto = ETS(loaves))
ets_fit
#> # A mable: 1 x 1
#>           auto
#>        <model>
#> 1 <ETS(M,A,M)>

ets_fit |> forecast(h = 12) |> as_tibble() |> select(month, .mean) |> tail(2)
#> # A tibble: 2 × 2
#>      month .mean
#>      <mth> <dbl>
#> 1 2026 Nov  707.
#> 2 2026 Dec  871.
```

`tsibble()` builds fable's data structure, where `yearmonth("2022 Jan") + 0:47` generates the 48 monthly stamps and `index = month` declares which column is time. `model(auto = ETS(loaves))` fits the model and stores it in a mable, fable's table of models, and `forecast(h = 12)` produces a fable of forecasts, from which `.mean` is the point forecast.

The answers are identical: **ETS(M,A,M)**, and 871 loaves for December 2026, the same number `ets()` gave. Different syntax, same 30 models, same winner. If you learn to read the letters here you can read them anywhere, which is the real reason the taxonomy is worth your time. A fuller treatment of the tidy workflow is its own topic.

## FAQ

**What does the ETS in ETS models stand for?**
Two things at once, which is deliberate. It is **E**rror, **T**rend, **S**eason, the three slots in the name. It also reads as **E**xponen**T**ial **S**moothing, the family of methods those slots describe. Hyndman chose the acronym so it would work both ways.

**Is ETS the same as Holt-Winters?**
Holt-Winters is a small corner of ETS. Additive Holt-Winters is ETS(A,A,A) and multiplicative Holt-Winters is ETS(M,A,M), so those two methods are 2 of the 30 models. The taxonomy also covers everything with no trend, no season, damped trends, and multiplicative trends, plus the choice of error type that Holt-Winters never asks you about.

**Why is there no ETS(N,...) model with no error?**
Because a model with no error term would be claiming the series is perfectly predictable from its components, which leaves nothing to forecast and no way to build a prediction interval. Every real series has noise, so the only question the E slot asks is what kind, which is why it has two options and not three.

**Does the error slot change my point forecast?**
Barely, and not by design. The error averages out of the point forecast, so the E slot has no term in the forecast formula. It does change the fitting, so in practice the numbers differ a little: on the bakery, ETS(A,A,A) says 859 for December against ETS(M,A,M)'s 871. What the E slot really controls is the prediction interval: additive gives you a constant band in loaves, multiplicative gives you a constant percentage.

**Why did ets() not pick the model with the best AICc?**
It picked the best AICc *among the models it searches*, which is 15 of the 30. Its defaults exclude multiplicative trends (`allow.multiplicative.trend = FALSE`) and unstable additive-error, multiplicative-season combinations (`restrict = TRUE`). Fit all 30 by hand and something outside that set can score better in-sample, as `ETS(A,M,M)` does on the bakery. That is usually the defaults doing their job, since multiplicative trends compound into unreasonable long-horizon forecasts.

**How much data does ETS need?**
At least two full seasonal cycles for any model with a season, which is 24 months of monthly data, and that is the bare minimum rather than a comfortable amount, since each of the twelve seasonal states would rest on two observations. Three or four cycles is where the seasonal indices settle down. Non-seasonal models are far less demanding, and `ETS(A,N,N)` will fit a handful of points.

**Can ETS handle daily data with weekly and yearly seasonality?**
No. Each ETS model carries exactly one seasonal period, and `ets()` refuses `m` above 24 anyway. Multiple or long seasonalities need TBATS, Fourier terms in a dynamic regression, or Prophet.

## Summary

`ets(bakery)` chose **ETS(M,A,M)** and forecast **871** loaves for December 2026. That name is a complete description of the model: the misses are a percentage of the month's size, growth is a fixed 2.63 loaves added per month, and December is a 1.437 multiplier on the level. Rebuild it as `(574.978 + 12 x 2.630) x 1.437` and 871.46 comes back out.

| Slot | Options | What the choice means | On the bakery |
|---|---|---|---|
| **E**rror | A, M | Constant misses in units, or misses as a constant percentage | **M**: about 4.8% every month |
| **T**rend | N, A, Ad, M, Md | Flat, straight line, flattening, compounding, or damped compounding | **A**: +2.63 loaves per month |
| **S**eason | N, A, M | No cycle, a fixed unit swing, or a percentage swing | **M**: December x 1.437 |

| Thing to remember | Why |
|---|---|
| 2 x 5 x 3 = **30 models** | Errors x trends x seasons; the trend slot carries the damped variants |
| `ets()` searches **15**, not 30 | Multiplicative trends off by default; unstable A-error, M-season combos refused |
| **AICc picks the winner** | Lower is better; it scores in-sample fit, not long-horizon safety |
| The **E slot is about intervals** | It is absent from the point-forecast formula and sets how uncertainty scales |
| `model = "ZZZ"`, `damped = NULL` | Z means "choose for me"; fix any slot by naming its letter |
| `opt.crit` explains `hw()` vs `ets()` | Same ETS(M,A,M); "mse" gives 900, "lik" gives 871 |

The taxonomy is worth more than the automation it enables. Once the three letters mean something to you, `ets()` stops being a black box that returns a number and becomes a tool that hands you a testable description of your series, in a notation every serious forecasting package shares.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., chapter 8. The canonical treatment of the ETS taxonomy and the table of all 30 models. [otexts.com/fpp3/expsmooth.html](https://otexts.com/fpp3/expsmooth.html)
2. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 8.5. The innovations state space formulation, where the additive and multiplicative error equations come from. [otexts.com/fpp3/ets.html](https://otexts.com/fpp3/ets.html)
3. `ets()` reference manual, forecast package. Every argument used on this page, including `model`, `damped`, `restrict`, `opt.crit` and `allow.multiplicative.trend`. [pkg.robjhyndman.com/forecast/reference/ets.html](https://pkg.robjhyndman.com/forecast/reference/ets.html)
4. Hyndman, R. J., Koehler, A. B., Snyder, R. D. & Grose, S. "A state space framework for automatic forecasting using exponential smoothing methods." *International Journal of Forecasting* 18(3), 2002. The paper that turned the methods into a model family and made automatic selection possible. [robjhyndman.com/papers/ijf25.pdf](https://robjhyndman.com/papers/ijf25.pdf)
5. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. Documents the AICc-based selection algorithm `ets()` runs. [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03)
6. `ETS()` reference, fable package. The tidyverse spelling of the same taxonomy, with the `error()`, `trend()` and `season()` term syntax. [fable.tidyverts.org/reference/ETS.html](https://fable.tidyverts.org/reference/ETS.html)
7. Hyndman, R. J., Koehler, A. B., Ord, J. K. & Snyder, R. D. *Forecasting with Exponential Smoothing: The State Space Approach*. Springer, 2008. The book-length treatment, including why the additive-error, multiplicative-season models are excluded. [robjhyndman.com/expsmooth](https://robjhyndman.com/expsmooth/)

## Continue Learning

- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html), where the level and `alpha` come from. It builds ETS(A,N,N), the simplest of the 30, from scratch.
- [Holt-Winters in R](Holt-Winters-in-R.html), the direct prequel. It builds the trend and season this post decodes, and its 900-loaf answer is the one this post reconciles.
- [Time Series Objects in R](Time-Series-Objects-in-R.html), for `ts`, `frequency`, and why getting the season length wrong silently ruins every model on this page.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), which splits a series into trend and seasonal parts to look at rather than to forecast with. A useful check on the components ETS estimates.

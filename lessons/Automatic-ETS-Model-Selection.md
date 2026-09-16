---
title: "Exponential Smoothing ETS Lesson 5: How to let ETS() choose a model, and when to override it"
catalog_blurb: "See what an automatic model search actually compares, and when to override its pick."
description: "See how ETS() fits all 18 candidate error, trend and season combinations by maximum likelihood, ranks them by AICc, and when to override its automatic pick."
keywords: "ETS automatic model selection, AICc model selection, maximum likelihood ETS, fable ETS report(), R time series forecasting, exponential smoothing model selection, override ETS trend, ETS(M,N,M), AICc vs log-likelihood, forecast() in fable"
post_type: "LESSON"
curriculum_id: "5.50.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-ets"
course_title: "Exponential Smoothing ETS"
course_lesson: "5"
course_total: "6"
course_landing: "Exponential-Smoothing-ETS-Course.html"
course_next: "Forecasting-with-ETS-in-fable.html"
course_prev: "The-ETS-Taxonomy.html"
---

=== step === cover
## How to let ETS() choose a model, and when to override it

Today let's understand how ETS() decides which model to fit on its own, and when that automatic pick is worth overriding.

Take Western Australia's domestic holiday trips, counted every quarter from 1998 to 2017, in thousands of overnight trips. That's 80 quarters of real tourism numbers, and the series climbs across the two decades, from around 750 thousand trips a quarter in the late 1990s to over 1,000 thousand two decades later. Here is all 80 quarters of it, plotted in order.

::widget chart-plotter {"data":[{"x":1998.0,"y":773},{"x":1998.25,"y":720},{"x":1998.5,"y":755},{"x":1998.75,"y":814},{"x":1999.0,"y":943},{"x":1999.25,"y":845},{"x":1999.5,"y":823},{"x":1999.75,"y":697},{"x":2000.0,"y":905},{"x":2000.25,"y":905},{"x":2000.5,"y":672},{"x":2000.75,"y":716},{"x":2001.0,"y":709},{"x":2001.25,"y":738},{"x":2001.5,"y":762},{"x":2001.75,"y":813},{"x":2002.0,"y":871},{"x":2002.25,"y":773},{"x":2002.5,"y":789},{"x":2002.75,"y":643},{"x":2003.0,"y":846},{"x":2003.25,"y":714},{"x":2003.5,"y":722},{"x":2003.75,"y":766},{"x":2004.0,"y":942},{"x":2004.25,"y":685},{"x":2004.5,"y":772},{"x":2004.75,"y":727},{"x":2005.0,"y":817},{"x":2005.25,"y":646},{"x":2005.5,"y":650},{"x":2005.75,"y":624},{"x":2006.0,"y":863},{"x":2006.25,"y":761},{"x":2006.5,"y":679},{"x":2006.75,"y":799},{"x":2007.0,"y":852},{"x":2007.25,"y":786},{"x":2007.5,"y":702},{"x":2007.75,"y":762},{"x":2008.0,"y":900},{"x":2008.25,"y":654},{"x":2008.5,"y":736},{"x":2008.75,"y":655},{"x":2009.0,"y":748},{"x":2009.25,"y":642},{"x":2009.5,"y":570},{"x":2009.75,"y":584},{"x":2010.0,"y":636},{"x":2010.25,"y":627},{"x":2010.5,"y":603},{"x":2010.75,"y":567},{"x":2011.0,"y":733},{"x":2011.25,"y":648},{"x":2011.5,"y":613},{"x":2011.75,"y":666},{"x":2012.0,"y":779},{"x":2012.25,"y":680},{"x":2012.5,"y":629},{"x":2012.75,"y":692},{"x":2013.0,"y":918},{"x":2013.25,"y":745},{"x":2013.5,"y":680},{"x":2013.75,"y":691},{"x":2014.0,"y":1266},{"x":2014.25,"y":1066},{"x":2014.5,"y":855},{"x":2014.75,"y":898},{"x":2015.0,"y":1168},{"x":2015.25,"y":990},{"x":2015.5,"y":928},{"x":2015.75,"y":960},{"x":2016.0,"y":1166},{"x":2016.25,"y":1054},{"x":2016.5,"y":804},{"x":2016.75,"y":983},{"x":2017.0,"y":1134},{"x":2017.25,"y":998},{"x":2017.5,"y":880},{"x":2017.75,"y":1026}],"geoms":["line"],"x":"Year","y":"Trips"}

Look at how that line climbs unevenly over the two decades, dipping and recovering along the way. In the steps ahead, you will let ETS() search across every reasonable combination on exactly this series, and see which one it picks for you.

=== step === concept
## ETS() with no formula: fitting becomes a search

ETS stands for three parts a model can have: Error, Trend and Season. Error is either additive (A), where the noise around the series stays roughly the same size no matter how high the series runs, or multiplicative (M), where the noise grows and shrinks along with the level. Trend is none (N), additive (A) as a straight climb or fall, or additive damped (Ad), a climb that flattens out over time. Season is none (N), additive (A) as a repeating swing of fixed size, or multiplicative (M) as a repeating swing that grows with the level.

report() always writes a model's name as ETS(error, trend, season), in that fixed order. So ETS(A,A,A) means additive error, additive trend, additive season, and ETS(M,N,M) means multiplicative error, no trend, multiplicative season.

Until now, you have told ETS() exactly which of those three letters to use, by writing something like ETS(trips ~ error("A") + trend("A") + season("A")). But you do not have to name any of them. Leave the right-hand side off entirely, and ETS() fits every valid combination itself and hands you back the one it judged best.

Build the WA series first, then fit it both ways and compare the labels.

```r
# Build the WA quarterly holiday-trips tsibble, then let ETS() search for the best model on its own
library(fable)
library(tsibble)
library(dplyr)

trips <- c(773, 720, 755, 814, 943, 845, 823, 697, 905, 905, 672, 716,
           709, 738, 762, 813, 871, 773, 789, 643, 846, 714, 722, 766,
           942, 685, 772, 727, 817, 646, 650, 624, 863, 761, 679, 799,
           852, 786, 702, 762, 900, 654, 736, 655, 748, 642, 570, 584,
           636, 627, 603, 567, 733, 648, 613, 666, 779, 680, 629, 692,
           918, 745, 680, 691, 1266, 1066, 855, 898, 1168, 990, 928, 960,
           1166, 1054, 804, 983, 1134, 998, 880, 1026)

wa <- tsibble(
  quarter = yearquarter(seq(as.Date("1998-01-01"), by = "quarter", length.out = 80)),
  trips = trips,
  index = quarter
)

fit_auto <- wa |> model(auto = ETS(trips))
fit_auto
#> # A mable: 1 x 1
#>           auto
#>        <model>
#> 1 <ETS(M,N,M)>
```

Now fit the same 80 quarters again, but name every letter yourself.

```r
# Fit the same data, but name every letter yourself instead of letting ETS() search
fit_named <- wa |> model(named = ETS(trips ~ error("A") + trend("A") + season("A")))
fit_named
#> # A mable: 1 x 1
#>          named
#>        <model>
#> 1 <ETS(A,A,A)>
```

Two different labels from the same 80 quarters. fit_named is exactly what you asked for: additive error, additive trend, additive season, because that is what you typed. fit_auto's label, ETS(M,N,M), is not something you picked. It is what fable's search judged as the best fit among every combination it tried, silently, in the background.

=== step === concept
## Fitting by maximum likelihood: the parameters are optimized, not guessed

Every one of those candidate structures still needs its own numbers before it can do anything. ETS(M,N,M) needs alpha for the level and gamma for the season, since it has no trend and so no beta. Where do those two numbers come from?

They come from maximum likelihood fitting. For a structure like ETS(M,N,M), the fitting procedure tries out different values of alpha and gamma, together with the model's starting level and starting seasonal offsets, and asks: for each combination, how probable would the 80 real quarters actually be, if that combination were true? It keeps the combination that makes the real data the most probable. That probability, scored on a log scale, is called the log-likelihood. Maximum likelihood fitting means picking the parameters that push the log-likelihood as high as it will go.

Fitted this way, ETS(M,N,M) settles on alpha 0.4667 and gamma 0.0001, with a log-likelihood of -524.848. See what happens when gamma is forced to 0.2 instead of being fitted.

```r
# Fit the model two ways: let gamma be estimated by maximum likelihood, then force it to 0.2 instead
fit_compare <- wa |> model(
  auto = ETS(trips),
  fixed_gamma = ETS(trips ~ error("M") + trend("N") + season("M", gamma = 0.2))
)

tidy(fit_compare) |>
  filter(term %in% c("alpha", "gamma")) |>
  transmute(.model, term, estimate = sprintf("%.4f", estimate))
#> # A tibble: 4 x 3
#>   .model      term  estimate
#>   <chr>       <chr> <chr>
#> 1 auto        alpha 0.4667
#> 2 auto        gamma 0.0001
#> 3 fixed_gamma alpha 0.4253
#> 4 fixed_gamma gamma 0.2000
```

Forcing gamma to 0.2 is not maximum likelihood fitting. It is a fixed guess. Even after alpha re-optimizes around it, to 0.4253, the fit gets worse: log-likelihood drops from -524.848 to -526.582. AICc, a score you will use properly in the next step, moves the same direction, from 1065.252 to 1066.314. Lower is better for AICc, so both numbers agree: the fitted alpha and gamma genuinely explain these 80 quarters better than an arbitrary pair does, because they were chosen specifically to make this data as probable as possible.

=== step === widget
## AICc ranks all 18 candidate structures

Put a number on how the search actually works. Error can be A or M, 2 choices. Trend can be N, A or Ad, 3 choices. Season can be N, A or M, 3 choices. Multiply those out and you get 18 valid combinations for quarterly data like this, and ETS()'s search fits every one of them by maximum likelihood, then keeps the one with the lowest AICc.

AICc scores each fitted model on two things at once: how well its fitted values matched the 80 real quarters, from the log-likelihood, and how many parameters it had to estimate to get there. A model with more parameters can usually match data it has already seen a little better, just because it has more room to bend around every observation. AICc corrects for that by adding a penalty for each extra parameter, so a bigger, more flexible structure only wins if the fit it buys is worth more than the penalty it pays. Lower AICc always wins, whatever the reason behind the number.

Here are all 18, ranked.

::widget styled-table {"cols":["Model","Error","Trend","Season","AICc"],"rows":[["ETS(M,N,M)","M","N","M","1065.252"],["ETS(M,N,A)","M","N","A","1066.298"],["ETS(M,Ad,M)","M","Ad","M","1071.956"],["ETS(M,A,M)","M","A","M","1072.209"],["ETS(M,Ad,A)","M","Ad","A","1072.465"],["ETS(M,A,A)","M","A","A","1073.003"],["ETS(A,N,A)","A","N","A","1074.981"],["ETS(A,N,M)","A","N","M","1075.086"],["ETS(A,Ad,M)","A","Ad","M","1079.234"],["ETS(A,A,A)","A","A","A","1080.374"],["ETS(A,Ad,A)","A","Ad","A","1080.708"],["ETS(A,A,M)","A","A","M","1080.825"],["ETS(A,N,N)","A","N","N","1116.400"],["ETS(M,N,N)","M","N","N","1118.203"],["ETS(A,A,N)","A","A","N","1120.500"],["ETS(M,Ad,N)","M","Ad","N","1120.643"],["ETS(A,Ad,N)","A","Ad","N","1121.017"],["ETS(M,A,N)","M","A","N","1123.431"]],"title":"All 18 valid ETS structures on the WA series, ranked by AICc","note":"Lower AICc is better. ETS(M,N,M) sits 1.046 points ahead of the runner-up and stays ahead of every other structure on the list."}

The same table, built by code instead of read off the widget.

```r
# Fit every valid combination of error, trend and season, then rank them by AICc
library(purrr)

combos <- expand.grid(
  error = c("A", "M"),
  trend = c("N", "A", "Ad"),
  season = c("N", "A", "M"),
  stringsAsFactors = FALSE
)

fit_one_aicc <- function(e, t, s) {
  spec <- ETS(trips ~ error(e) + trend(t) + season(s))
  fit <- wa |> model(m = spec)
  glance(fit)$AICc
}

combos$AICc <- pmap_dbl(list(combos$error, combos$trend, combos$season), fit_one_aicc)
combos <- combos[order(combos$AICc), ]
combos$Model <- paste0("ETS(", combos$error, ",", combos$trend, ",", combos$season, ")")
combos$AICc <- sprintf("%.3f", combos$AICc)
head(combos[, c("Model", "AICc")], 6)
#>         Model     AICc
#> 1  ETS(M,N,M) 1065.252
#> 2  ETS(M,N,A) 1066.298
#> 3 ETS(M,Ad,M) 1071.956
#> 4  ETS(M,A,M) 1072.209
#> 5 ETS(M,Ad,A) 1072.465
#> 6  ETS(M,A,A) 1073.003
```

ETS(M,N,M), the same structure fit_auto found earlier, tops the list at 1065.252. Its closest real competitor, ETS(M,N,A), sits at 1066.298, just 1.046 points behind, close enough that both share the same error and trend letters and differ only in whether the season adds or multiplies. The closest structure that adds a trend, ETS(M,Ad,M), needs 1071.956, about 6.7 points worse. And the weakest structure on the whole board, ETS(M,A,N), a trended model with no season at all, comes in at 1123.431, 58 points behind the winner.

=== step === quiz
## Quick check: what the search actually compares

Among the 18 structures fable fitted on the WA series, one question decides the winner.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The candidate with the highest log-likelihood, on its own. ::no
- The candidate with the lowest AICc, the score that rewards a good fit but penalizes extra parameters. ::ok Right. AICc is the only thing the search compares across the 18 candidates, and ETS(M,N,M) won it at 1065.252.
- Whichever candidate has the simplest error, trend and season letters, regardless of how well it fits. ::no
- Whichever candidate's trend and season best match what the plot looks like by eye. ::no Neither a visual match nor raw log-likelihood decides the winner. AICc does: it rewards a structure whose fitted values matched the 80 quarters well, then subtracts a penalty for every parameter that structure needed to get there. Lower AICc wins, full stop.

=== step === concept
## Reading report()'s full printout for the winning model

report() prints four things together for whichever model it is given: the label, the fitted smoothing parameters, the fitted initial states, and a line of three information criteria. Call it on fit_auto to see all four for ETS(M,N,M).

```r
# See the full printed report for the automatically chosen model
report(fit_auto)
#> Series: trips
#> Model: ETS(M,N,M)
#>   Smoothing parameters:
#>     alpha = 0.4667391
#>     gamma = 0.0001000141
#>
#>   Initial states:
#>      l[0]      s[0]     s[-1]     s[-2]    s[-3]
#>  810.3324 0.9418981 0.9230515 0.9874052 1.147645
#>
#>   sigma^2:  0.0112
#>
#>      AIC     AICc      BIC
#> 1063.696 1065.252 1080.371
```

Walk it top to bottom. "Model: ETS(M,N,M)" is the label you already saw. "Smoothing parameters" gives the two fitted values from the maximum likelihood search: alpha 0.4667391 and gamma 0.0001000141. "Initial states" gives the model's fitted starting point: l[0], 810.3324, is the starting level in thousand trips, and s[0] through s[-3] are the four fitted starting seasonal multipliers, one per quarter of the year. Because this model's season is multiplicative, they sit close to 1 rather than close to 0: a multiplier above 1 means that quarter usually runs above the level, below 1 means it usually runs under it. One line down, sigma^2 is 0.0112: the fitted variance of the model's one-step-ahead errors, on the same multiplicative scale the model fits in. Smaller means a tighter fit, though it is not one of the three scores the search actually compares.

The last line prints three related scores together: AIC, its small-sample-corrected sibling AICc, and BIC, a similar score with its own, usually harsher, penalty for extra parameters. report() always prints all three, but the search you ran two steps back only ever compared AICc across the 18 candidates. AIC and BIC just come along for reference.

=== step === widget
## The winning model's forecast, plotted against its own history

fit_auto is fitted and its structure is settled. Now use it to forecast 8 quarters ahead, from 2018 Q1 through 2019 Q4, and read the forecast means it produces.

```r
# Forecast 8 quarters ahead from the automatically chosen model
fc_auto <- fit_auto |> forecast(h = 8)
as_tibble(fc_auto) |> transmute(quarter, mean_trips = sprintf("%.1f", .mean))
#> # A tibble: 8 x 2
#>   quarter mean_trips
#>     <qtr> <chr>
#> 1 2018 Q1 1182.7
#> 2 2018 Q2 1017.6
#> 3 2018 Q3 951.3
#> 4 2018 Q4 970.7
#> 5 2019 Q1 1182.7
#> 6 2019 Q2 1017.6
#> 7 2019 Q3 951.3
#> 8 2019 Q4 970.7
```

Now see those 8 quarters plotted against the 80 real ones that came before them.

::widget chart-plotter {"data":[{"x":1998.0,"y":773,"fill":"History"},{"x":1998.25,"y":720,"fill":"History"},{"x":1998.5,"y":755,"fill":"History"},{"x":1998.75,"y":814,"fill":"History"},{"x":1999.0,"y":943,"fill":"History"},{"x":1999.25,"y":845,"fill":"History"},{"x":1999.5,"y":823,"fill":"History"},{"x":1999.75,"y":697,"fill":"History"},{"x":2000.0,"y":905,"fill":"History"},{"x":2000.25,"y":905,"fill":"History"},{"x":2000.5,"y":672,"fill":"History"},{"x":2000.75,"y":716,"fill":"History"},{"x":2001.0,"y":709,"fill":"History"},{"x":2001.25,"y":738,"fill":"History"},{"x":2001.5,"y":762,"fill":"History"},{"x":2001.75,"y":813,"fill":"History"},{"x":2002.0,"y":871,"fill":"History"},{"x":2002.25,"y":773,"fill":"History"},{"x":2002.5,"y":789,"fill":"History"},{"x":2002.75,"y":643,"fill":"History"},{"x":2003.0,"y":846,"fill":"History"},{"x":2003.25,"y":714,"fill":"History"},{"x":2003.5,"y":722,"fill":"History"},{"x":2003.75,"y":766,"fill":"History"},{"x":2004.0,"y":942,"fill":"History"},{"x":2004.25,"y":685,"fill":"History"},{"x":2004.5,"y":772,"fill":"History"},{"x":2004.75,"y":727,"fill":"History"},{"x":2005.0,"y":817,"fill":"History"},{"x":2005.25,"y":646,"fill":"History"},{"x":2005.5,"y":650,"fill":"History"},{"x":2005.75,"y":624,"fill":"History"},{"x":2006.0,"y":863,"fill":"History"},{"x":2006.25,"y":761,"fill":"History"},{"x":2006.5,"y":679,"fill":"History"},{"x":2006.75,"y":799,"fill":"History"},{"x":2007.0,"y":852,"fill":"History"},{"x":2007.25,"y":786,"fill":"History"},{"x":2007.5,"y":702,"fill":"History"},{"x":2007.75,"y":762,"fill":"History"},{"x":2008.0,"y":900,"fill":"History"},{"x":2008.25,"y":654,"fill":"History"},{"x":2008.5,"y":736,"fill":"History"},{"x":2008.75,"y":655,"fill":"History"},{"x":2009.0,"y":748,"fill":"History"},{"x":2009.25,"y":642,"fill":"History"},{"x":2009.5,"y":570,"fill":"History"},{"x":2009.75,"y":584,"fill":"History"},{"x":2010.0,"y":636,"fill":"History"},{"x":2010.25,"y":627,"fill":"History"},{"x":2010.5,"y":603,"fill":"History"},{"x":2010.75,"y":567,"fill":"History"},{"x":2011.0,"y":733,"fill":"History"},{"x":2011.25,"y":648,"fill":"History"},{"x":2011.5,"y":613,"fill":"History"},{"x":2011.75,"y":666,"fill":"History"},{"x":2012.0,"y":779,"fill":"History"},{"x":2012.25,"y":680,"fill":"History"},{"x":2012.5,"y":629,"fill":"History"},{"x":2012.75,"y":692,"fill":"History"},{"x":2013.0,"y":918,"fill":"History"},{"x":2013.25,"y":745,"fill":"History"},{"x":2013.5,"y":680,"fill":"History"},{"x":2013.75,"y":691,"fill":"History"},{"x":2014.0,"y":1266,"fill":"History"},{"x":2014.25,"y":1066,"fill":"History"},{"x":2014.5,"y":855,"fill":"History"},{"x":2014.75,"y":898,"fill":"History"},{"x":2015.0,"y":1168,"fill":"History"},{"x":2015.25,"y":990,"fill":"History"},{"x":2015.5,"y":928,"fill":"History"},{"x":2015.75,"y":960,"fill":"History"},{"x":2016.0,"y":1166,"fill":"History"},{"x":2016.25,"y":1054,"fill":"History"},{"x":2016.5,"y":804,"fill":"History"},{"x":2016.75,"y":983,"fill":"History"},{"x":2017.0,"y":1134,"fill":"History"},{"x":2017.25,"y":998,"fill":"History"},{"x":2017.5,"y":880,"fill":"History"},{"x":2017.75,"y":1026,"fill":"History"},{"x":2018.0,"y":1182.7,"fill":"Forecast"},{"x":2018.25,"y":1017.6,"fill":"Forecast"},{"x":2018.5,"y":951.3,"fill":"Forecast"},{"x":2018.75,"y":970.7,"fill":"Forecast"},{"x":2019.0,"y":1182.7,"fill":"Forecast"},{"x":2019.25,"y":1017.6,"fill":"Forecast"},{"x":2019.5,"y":951.3,"fill":"Forecast"},{"x":2019.75,"y":970.7,"fill":"Forecast"}],"geoms":["line","point"],"x":"Year","y":"Trips"}

Look closely at the two years of forecast. The first four quarters, 1182.7, 1017.6, 951.3, 970.7, repeat exactly in the next four. The saw-tooth shape, high in the first quarter of the year and low in the third, keeps going. But the level it saws around stays flat between the two years, it does not continue climbing. Compare that with the 80 real quarters in the same plot: the whole history climbed over its 20 years. Why would a forecast leave out a climb that obvious? That is exactly what the next step works out.

=== step === concept
## Why the forecast goes flat, and overriding it with an explicit trend

ETS(M,N,M)'s middle letter is N. No trend term at all. The model's equations only ever update a level, which reacts each quarter to how far off the last forecast was, and a season, the repeating shape. Nothing in that combination carries a persistent rise forward from one quarter to the next.

But the real WA series did rise. Its quarterly mean was 796.25 in the first 8 quarters, back in 1998 and 1999, and 1005.625 in the last 8, in 2016 and 2017, a genuine climb over the 20 years.

So how did a model with no trend term still win on AICc? Because within the 80 quarters it was actually fitted on, the level component alone, updating a little every quarter, tracked that slow rise closely enough. Adding a trend term costs more in AICc's parameter penalty than it gains in fit here: recall ETS(M,A,M) from the leaderboard, at 1072.209, 7 points worse than the winner. AICc only ever scores how well a structure explains the data it was fitted on. It says nothing about whether the pattern that structure settled for is safe to carry forward, and a model with no trend term carries nothing forward. It simply repeats its last full seasonal cycle's level, forever.

If you believe that rise is real and worth carrying forward, you can force a trend into the model yourself, keeping the error and season letters ETS() already chose.

```r
# Force an explicit trend into the model, keeping the search's own error and season letters
fit_override <- wa |> model(override = ETS(trips ~ error("M") + trend("A") + season("M")))

glance(fit_override) |> transmute(model = .model, AICc = sprintf("%.3f", AICc))
#> # A tibble: 1 x 2
#>   model    AICc
#>   <chr>    <chr>
#> 1 override 1072.209

fc_override <- fit_override |> forecast(h = 8)
tibble(
  quarter = fc_auto$quarter,
  auto = sprintf("%.1f", fc_auto$.mean),
  override = sprintf("%.1f", fc_override$.mean)
)
#> # A tibble: 8 x 3
#>   quarter auto   override
#>     <qtr> <chr>  <chr>
#> 1 2018 Q1 1182.7 1209.7
#> 2 2018 Q2 1017.6 1036.6
#> 3 2018 Q3 951.3  982.4
#> 4 2018 Q4 970.7  1001.8
#> 5 2019 Q1 1182.7 1243.1
#> 6 2019 Q2 1017.6 1064.9
#> 7 2019 Q3 951.3  1009.1
#> 8 2019 Q4 970.7  1028.8
```

[KEY INSIGHT]
Forcing trend("A") costs AICc: 1072.209 against the winner's 1065.252, about 7 points worse, because a fitted trend term is one more parameter to pay for. But the forecast it produces climbs across the two years instead of repeating, from 1209.7 in the first quarter of 2018 to 1243.1 in the first quarter of 2019. Which one you trust is not a question AICc can answer. It comes down to whether you believe the rise already in the history is a pattern likely to continue, or noise the model was right to leave out.

=== step === quiz
## Quick check: reading the automatic pick's tradeoffs

ETS(M,N,M)'s AICc is 1065.252. ETS(M,A,M), the version with an explicit trend, comes in at 1072.209, about 7 points worse.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- ETS(M,A,M) is definitely the wrong model for this series. ::no
- The gap proves the flat forecast from ETS(M,N,M) will turn out correct. ::no
- ETS(M,N,M) explains the 80 already-seen quarters better once the parameter penalty is counted in, and the gap says nothing about which forecast will hold up. ::ok Exactly. AICc only ever scores fit against the data already seen. It has no opinion on whether a rise the fitted model did not need to explain is about to continue.
- Alpha and gamma for ETS(M,N,M) were set by hand rather than fitted. ::no A 7-point AICc gap says one thing only: ETS(M,N,M) explained the 80 already-seen quarters better, once its extra parameter is priced in. It says nothing about whether that trend-free forecast, or the climbing one, will match what actually happens next. And every parameter in both models, alpha, gamma, and beta where it exists, came from fitting, not from a guess.

=== step === tryit
## Your turn: force a trend without discarding the search's own letters

report() already named error "M" and season "M" for this series, on its own. Only the trend letter is in question. Write the override formula yourself: keep error("M") and season("M"), and put trend("A") between them. Fit it on wa, forecast 8 quarters ahead, and check that the means no longer repeat.

```r
# report() already named error "M" and season "M" for this series.
# Keep those two letters, force trend("A") between them, and fit it
# on wa as ETS(trips ~ error("M") + trend("A") + season("M")).
# Then forecast h = 8 and print round(.mean, 1).
```
::check {"regex": "error\\s*[(].M.\\s*[)]\\s*\\+\\s*trend\\s*[(].A.\\s*[)]\\s*\\+\\s*season\\s*[(].M.", "gate": true, "difficulty": "intermediate", "ok": "Right: the forecast means now run 1209.7, 1036.6, 982.4, 1001.8, then 1243.1, 1064.9, 1009.1, 1028.8, each quarter of the second year above the matching quarter of the first. AICc is worse than the automatic pick, 1072.209 against 1065.252, but the forecast finally carries the rise forward.", "no": "Keep the letters report() already gave this series, error(\"M\") and season(\"M\"), and put trend(\"A\") between them: ETS(trips ~ error(\"M\") + trend(\"A\") + season(\"M\"))."}
::solution
```r
# Fit the trend-forced override yourself and forecast 8 quarters ahead
fit_yourturn <- wa |> model(yourturn = ETS(trips ~ error("M") + trend("A") + season("M")))
fc_yourturn <- fit_yourturn |> forecast(h = 8)
round(fc_yourturn$.mean, 1)
#> [1] 1209.7 1036.6  982.4 1001.8 1243.1 1064.9 1009.1 1028.8
```

Same numbers as the AICc comparison two steps back, because it is the same model. Notice the second year sits above the first in every quarter, 1243.1 above 1209.7, 1064.9 above 1036.6, and so on. That is what a fitted trend term does: it carries a slope forward instead of repeating the last cycle.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 8](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos, 3rd edition. The full treatment of ETS() model selection this lesson's numbers and letters are drawn from.
- [A state space framework for automatic forecasting using exponential smoothing methods](https://doi.org/10.1016/S0169-2070(01)00110-8) - Hyndman, Koehler, Snyder and Grose (2002), International Journal of Forecasting, 18(3), 439-454. The paper behind fable's automatic search.
- [Regression and time series model selection in small samples](https://doi.org/10.1093/biomet/76.2.297) - Hurvich and Tsai (1989), Biometrika, 76(2), 297-307. The source of the AICc correction the search uses.
- [fable package reference documentation for ETS()](https://fable.tidyverts.org/reference/ETS.html)

=== step === complete
## Quick recap

- ETS() with no formula fits every valid combination of error, trend and season, 18 of them for a series like this one, each by maximum likelihood.
- It keeps the one with the lowest AICc: fit against the 80 quarters already seen, penalized by how many parameters it took to get there. ETS(M,N,M) won at 1065.252.
- report() prints that winner's label, its fitted smoothing parameters, its initial states, and the AIC, AICc and BIC line together, even though the search itself only ever compares AICc.
- A low-AICc structure does not have to carry forward a trend you can see in the plotted history. ETS(M,N,M)'s forecast repeated because its trend letter is N; forcing trend("A") cost 7 AICc points but gave you a forecast that climbs instead.

Next, you will turn a fitted ETS model into forecasts with real prediction intervals, and check how good those forecasts actually are.

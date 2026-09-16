---
title: "Dynamic Regression and Complex Seasonality Lesson 2: Fitting a dynamic harmonic regression"
catalog_blurb: "Model a season too long for seasonal ARIMA, then forecast it with Fourier terms."
description: "Fit Fourier terms plus ARIMA errors on a 52-week seasonal series, choose the harmonic count K by AICc, and forecast the held-out weeks with real intervals."
keywords: "dynamic harmonic regression, Fourier terms, fourier(K = ), ARIMA errors, choosing K by AICc, seasonal period, fable, tsibble, weekly demand forecast, prediction interval"
post_type: "LESSON"
curriculum_id: "5.70.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-dynamic"
course_title: "Dynamic Regression and Complex Seasonality"
course_lesson: "2"
course_total: "6"
course_landing: "Dynamic-Regression-and-Complex-Seasonality-Course.html"
course_next: "Multiple-Seasonal-Periods.html"
course_prev: "Regression-with-ARIMA-Errors.html"
---

=== step === cover
## Fitting a dynamic harmonic regression

Today let's understand how to model a season that repeats once a year, using a handful of sine and cosine terms inside an ARIMA fit, on a real weekly electricity demand series.

Here's the running example. Victoria, an Australian state, has to keep its electricity grid supplied every week of the year, and demand rises and falls with the seasons: more air conditioning in summer, more heating in winter. We'll use 156 consecutive weeks of the grid's actual electricity demand, in gigawatt-hours (GWh), covering 2012 through 2014, so the yearly rhythm repeats three times over.

Plot the week number against that week's demand, one point per week.

::widget chart-plotter {"data":[{"x":1,"y":782.3},{"x":2,"y":731.9},{"x":3,"y":855.5},{"x":4,"y":889.8},{"x":5,"y":826.8},{"x":6,"y":772.6},{"x":7,"y":837.3},{"x":8,"y":884.3},{"x":9,"y":788.9},{"x":10,"y":753.8},{"x":11,"y":766.9},{"x":12,"y":765.9},{"x":13,"y":759.2},{"x":14,"y":729.1},{"x":15,"y":737.9},{"x":16,"y":755.5},{"x":17,"y":765.1},{"x":18,"y":812.6},{"x":19,"y":799.5},{"x":20,"y":834.1},{"x":21,"y":848.8},{"x":22,"y":864.1},{"x":23,"y":865.6},{"x":24,"y":838.6},{"x":25,"y":875.1},{"x":26,"y":873},{"x":27,"y":875.1},{"x":28,"y":850.6},{"x":29,"y":835.2},{"x":30,"y":852.7},{"x":31,"y":857.5},{"x":32,"y":858.9},{"x":33,"y":855.1},{"x":34,"y":825.9},{"x":35,"y":810.6},{"x":36,"y":772},{"x":37,"y":780.6},{"x":38,"y":766.1},{"x":39,"y":761.5},{"x":40,"y":749.4},{"x":41,"y":776.2},{"x":42,"y":737.8},{"x":43,"y":737.9},{"x":44,"y":744.3},{"x":45,"y":704.7},{"x":46,"y":726.8},{"x":47,"y":747.5},{"x":48,"y":816.5},{"x":49,"y":748.3},{"x":50,"y":798.8},{"x":51,"y":762.6},{"x":52,"y":633.5},{"x":53,"y":754.7},{"x":54,"y":763.1},{"x":55,"y":792},{"x":56,"y":791.3},{"x":57,"y":725.8},{"x":58,"y":820.8},{"x":59,"y":852.4},{"x":60,"y":867.7},{"x":61,"y":785.2},{"x":62,"y":929},{"x":63,"y":832.2},{"x":64,"y":755},{"x":65,"y":747.4},{"x":66,"y":721.6},{"x":67,"y":751.8},{"x":68,"y":761.1},{"x":69,"y":729.9},{"x":70,"y":787.1},{"x":71,"y":768.1},{"x":72,"y":808.1},{"x":73,"y":824.2},{"x":74,"y":809.2},{"x":75,"y":822.9},{"x":76,"y":828.8},{"x":77,"y":861.6},{"x":78,"y":856},{"x":79,"y":816.2},{"x":80,"y":854},{"x":81,"y":807},{"x":82,"y":847},{"x":83,"y":824.7},{"x":84,"y":831.9},{"x":85,"y":808.2},{"x":86,"y":833.3},{"x":87,"y":744.2},{"x":88,"y":737.4},{"x":89,"y":753.8},{"x":90,"y":756.7},{"x":91,"y":724.4},{"x":92,"y":725.1},{"x":93,"y":721.2},{"x":94,"y":734.1},{"x":95,"y":758.4},{"x":96,"y":739.7},{"x":97,"y":717.6},{"x":98,"y":756.1},{"x":99,"y":734.3},{"x":100,"y":741.6},{"x":101,"y":757.7},{"x":102,"y":721.1},{"x":103,"y":799.1},{"x":104,"y":649.6},{"x":105,"y":631.7},{"x":106,"y":738.2},{"x":107,"y":1004.1},{"x":108,"y":750},{"x":109,"y":902},{"x":110,"y":901.2},{"x":111,"y":798.7},{"x":112,"y":729},{"x":113,"y":744.1},{"x":114,"y":772.5},{"x":115,"y":741.9},{"x":116,"y":729.8},{"x":117,"y":724.6},{"x":118,"y":771.9},{"x":119,"y":742.5},{"x":120,"y":701.5},{"x":121,"y":701.6},{"x":122,"y":777.9},{"x":123,"y":798},{"x":124,"y":742},{"x":125,"y":746.7},{"x":126,"y":775.3},{"x":127,"y":782.3},{"x":128,"y":789.9},{"x":129,"y":820},{"x":130,"y":839.8},{"x":131,"y":841.6},{"x":132,"y":847.7},{"x":133,"y":865.9},{"x":134,"y":876},{"x":135,"y":839.3},{"x":136,"y":839.8},{"x":137,"y":851.8},{"x":138,"y":811.6},{"x":139,"y":779.2},{"x":140,"y":787.6},{"x":141,"y":751.4},{"x":142,"y":777.9},{"x":143,"y":721.4},{"x":144,"y":718.6},{"x":145,"y":729.2},{"x":146,"y":745.6},{"x":147,"y":749},{"x":148,"y":735.9},{"x":149,"y":707.6},{"x":150,"y":742.2},{"x":151,"y":732.5},{"x":152,"y":744},{"x":153,"y":771.2},{"x":154,"y":747},{"x":155,"y":744.3},{"x":156,"y":669.5}],"geoms":["point","line"],"x":"Week","y":"Demand"}

The line climbs and falls roughly once a year, from a low near 632 GWh to a high just over 1,004 GWh. But look closely: it isn't one smooth, even wave. Some years bend earlier or later than others, and there are bumps along the way instead of one clean sine curve.

=== step === concept
## Why can't seasonal ARIMA handle a 52-week season?

Seasonal ARIMA adds a seasonal part on top of the ordinary ARIMA(p, d, q): a piece written (P, D, Q)[m], with P seasonal AR terms, D seasonal differences, Q seasonal MA terms, all built around a season of length m, the number of periods before the pattern repeats.

A seasonal difference at lag m compares each observation to the one exactly m periods earlier. For monthly data with a yearly season, m = 12, and the comparison is this January against last January. Here the season is a year of weekly data, so m = 52: this week against the same week last year.

Here's the problem. That single seasonal difference has nothing to compare the first m weeks against, since there's no earlier year for them to look back to, so it throws those weeks away before a single residual exists.

See how many of the 156 weeks would actually be left after one seasonal difference, at a few different values of m.

```r
# How many of 156 weeks survive one seasonal difference, at a few different season lengths m
n <- 156
n - 52
n - 12
n - 4
#> [1] 104
#> [1] 144
#> [1] 152
```

See that same loss expressed as a percentage of the 156 weeks.

```r
# The same loss, as a share of the 156 weeks
round(52 / n * 100, 1)
round(12 / n * 100, 1)
round(4 / n * 100, 1)
#> [1] 33.3
#> [1] 7.7
#> [1] 2.6
```

If this same 156-week series had a season of only 12 weeks or 4 weeks, one seasonal difference would cost a small, forgettable slice of it, 7.7% or 2.6%. But at m = 52, that same single difference costs 33.3% of the series, a full third, before fitting anything. It isn't seasonal differencing itself that's the problem. It's a season this long relative to how much data there is.

=== step === concept
## Setting up Victoria's weekly demand in R

Build the 156-week tsibble from the real weekly totals, and split it into a 144-week training window and the last 12 weeks to test against.

```r
# Build the 156-week tsibble of Victoria's real weekly electricity demand, then split it into a 144-week training window and the last 12 weeks to test against
library(tsibble)
library(forecast)
library(fable)
library(fabletools)
library(dplyr)

demand <- c(782.3, 731.9, 855.5, 889.8, 826.8, 772.6, 837.3, 884.3, 788.9,
753.8, 766.9, 765.9, 759.2, 729.1, 737.9, 755.5, 765.1, 812.6,
799.5, 834.1, 848.8, 864.1, 865.6, 838.6, 875.1, 873, 875.1,
850.6, 835.2, 852.7, 857.5, 858.9, 855.1, 825.9, 810.6, 772,
780.6, 766.1, 761.5, 749.4, 776.2, 737.8, 737.9, 744.3, 704.7,
726.8, 747.5, 816.5, 748.3, 798.8, 762.6, 633.5, 754.7, 763.1,
792, 791.3, 725.8, 820.8, 852.4, 867.7, 785.2, 929, 832.2, 755,
747.4, 721.6, 751.8, 761.1, 729.9, 787.1, 768.1, 808.1, 824.2,
809.2, 822.9, 828.8, 861.6, 856, 816.2, 854, 807, 847, 824.7,
831.9, 808.2, 833.3, 744.2, 737.4, 753.8, 756.7, 724.4, 725.1,
721.2, 734.1, 758.4, 739.7, 717.6, 756.1, 734.3, 741.6, 757.7,
721.1, 799.1, 649.6, 631.7, 738.2, 1004.1, 750, 902, 901.2, 798.7,
729, 744.1, 772.5, 741.9, 729.8, 724.6, 771.9, 742.5, 701.5,
701.6, 777.9, 798, 742, 746.7, 775.3, 782.3, 789.9, 820, 839.8,
841.6, 847.7, 865.9, 876, 839.3, 839.8, 851.8, 811.6, 779.2,
787.6, 751.4, 777.9, 721.4, 718.6, 729.2, 745.6, 749, 735.9,
707.6, 742.2, 732.5, 744, 771.2, 747, 744.3, 669.5)

weekly <- tsibble(
  Week = yearweek("2012 W01") + 0:155,
  Demand = demand,
  index = Week
)
head(weekly)
#> # A tsibble: 6 x 2 [1W]
#>       Week Demand
#>     <week>  <dbl>
#> 1 2012 W01   782.
#> 2 2012 W02   732.
#> 3 2012 W03   856.
#> 4 2012 W04   890.
#> 5 2012 W05   827.
#> 6 2012 W06   773.

train <- weekly |> filter(row_number() <= 144)
test  <- weekly |> filter(row_number() > 144)

nrow(train)
#> [1] 144
nrow(test)
#> [1] 12
```

That's 144 weeks to fit on, and the last 12 weeks held back to forecast against later.

A regression's leftover error, whatever it doesn't explain, can still carry a pattern from one week to the next. Instead of treating that leftover pattern as pure noise, ARIMA(p, d, q) models it directly: p autoregressive terms, d differences and q moving-average terms describe whatever structure is left over once the regression part has done its job. That's the same idea this lesson builds on, just with a new kind of predictor doing the explaining.

=== step === concept
## The Fourier term: a sine and cosine pair over the year

A Fourier term is one sine wave and one cosine wave, both completing exactly one full cycle over the season, 52 weeks here. Regressing on that sine and that cosine together can reproduce any single smooth wave of period 52, whatever its height and whatever week it peaks in. The sine sets how the wave moves early on, the cosine sets how tall it starts, and together the two numbers pin down the whole shape.

Call the first sine term S1 and the first cosine term C1. With t as the week number and m = 52 the season length:

\[ S_1 = \sin\left(\frac{2\pi t}{52}\right) \qquad C_1 = \cos\left(\frac{2\pi t}{52}\right) \]

Compute S1 and C1 by hand for five weeks spaced across one year.

```r
# Compute the first sine and cosine Fourier term by hand, for five weeks spread across one year
t_sample <- c(1, 13, 26, 39, 52)
S1 <- sin(2 * pi * t_sample / 52)
C1 <- cos(2 * pi * t_sample / 52)
data.frame(week = t_sample, S1 = round(S1, 3), C1 = round(C1, 3))
#>   week     S1     C1
#> 1    1  0.121  0.993
#> 2   13  1.000  0.000
#> 3   26  0.000 -1.000
#> 4   39 -1.000  0.000
#> 5   52  0.000  1.000
```

Read those five rows as one lap of the wave. S1 starts small, climbs to its peak at week 13, a quarter of the way through the year, falls back through zero by week 26, bottoms out at week 39, and is back near zero by week 52. C1 traces the same lap a quarter cycle ahead of S1: it starts near its own peak, crosses zero at week 13, bottoms out at week 26, crosses zero again at week 39, and returns near its peak by week 52.

See both curves over the full 52 weeks of one year.

::widget chart-plotter {"data":[{"x":1,"y":0.121,"fill":"S1"},{"x":2,"y":0.239,"fill":"S1"},{"x":3,"y":0.355,"fill":"S1"},{"x":4,"y":0.465,"fill":"S1"},{"x":5,"y":0.568,"fill":"S1"},{"x":6,"y":0.663,"fill":"S1"},{"x":7,"y":0.749,"fill":"S1"},{"x":8,"y":0.823,"fill":"S1"},{"x":9,"y":0.885,"fill":"S1"},{"x":10,"y":0.935,"fill":"S1"},{"x":11,"y":0.971,"fill":"S1"},{"x":12,"y":0.993,"fill":"S1"},{"x":13,"y":1,"fill":"S1"},{"x":14,"y":0.993,"fill":"S1"},{"x":15,"y":0.971,"fill":"S1"},{"x":16,"y":0.935,"fill":"S1"},{"x":17,"y":0.885,"fill":"S1"},{"x":18,"y":0.823,"fill":"S1"},{"x":19,"y":0.749,"fill":"S1"},{"x":20,"y":0.663,"fill":"S1"},{"x":21,"y":0.568,"fill":"S1"},{"x":22,"y":0.465,"fill":"S1"},{"x":23,"y":0.355,"fill":"S1"},{"x":24,"y":0.239,"fill":"S1"},{"x":25,"y":0.121,"fill":"S1"},{"x":26,"y":0,"fill":"S1"},{"x":27,"y":-0.121,"fill":"S1"},{"x":28,"y":-0.239,"fill":"S1"},{"x":29,"y":-0.355,"fill":"S1"},{"x":30,"y":-0.465,"fill":"S1"},{"x":31,"y":-0.568,"fill":"S1"},{"x":32,"y":-0.663,"fill":"S1"},{"x":33,"y":-0.749,"fill":"S1"},{"x":34,"y":-0.823,"fill":"S1"},{"x":35,"y":-0.885,"fill":"S1"},{"x":36,"y":-0.935,"fill":"S1"},{"x":37,"y":-0.971,"fill":"S1"},{"x":38,"y":-0.993,"fill":"S1"},{"x":39,"y":-1,"fill":"S1"},{"x":40,"y":-0.993,"fill":"S1"},{"x":41,"y":-0.971,"fill":"S1"},{"x":42,"y":-0.935,"fill":"S1"},{"x":43,"y":-0.885,"fill":"S1"},{"x":44,"y":-0.823,"fill":"S1"},{"x":45,"y":-0.749,"fill":"S1"},{"x":46,"y":-0.663,"fill":"S1"},{"x":47,"y":-0.568,"fill":"S1"},{"x":48,"y":-0.465,"fill":"S1"},{"x":49,"y":-0.355,"fill":"S1"},{"x":50,"y":-0.239,"fill":"S1"},{"x":51,"y":-0.121,"fill":"S1"},{"x":52,"y":0,"fill":"S1"},{"x":1,"y":0.993,"fill":"C1"},{"x":2,"y":0.971,"fill":"C1"},{"x":3,"y":0.935,"fill":"C1"},{"x":4,"y":0.885,"fill":"C1"},{"x":5,"y":0.823,"fill":"C1"},{"x":6,"y":0.749,"fill":"C1"},{"x":7,"y":0.663,"fill":"C1"},{"x":8,"y":0.568,"fill":"C1"},{"x":9,"y":0.465,"fill":"C1"},{"x":10,"y":0.355,"fill":"C1"},{"x":11,"y":0.239,"fill":"C1"},{"x":12,"y":0.121,"fill":"C1"},{"x":13,"y":0,"fill":"C1"},{"x":14,"y":-0.121,"fill":"C1"},{"x":15,"y":-0.239,"fill":"C1"},{"x":16,"y":-0.355,"fill":"C1"},{"x":17,"y":-0.465,"fill":"C1"},{"x":18,"y":-0.568,"fill":"C1"},{"x":19,"y":-0.663,"fill":"C1"},{"x":20,"y":-0.749,"fill":"C1"},{"x":21,"y":-0.823,"fill":"C1"},{"x":22,"y":-0.885,"fill":"C1"},{"x":23,"y":-0.935,"fill":"C1"},{"x":24,"y":-0.971,"fill":"C1"},{"x":25,"y":-0.993,"fill":"C1"},{"x":26,"y":-1,"fill":"C1"},{"x":27,"y":-0.993,"fill":"C1"},{"x":28,"y":-0.971,"fill":"C1"},{"x":29,"y":-0.935,"fill":"C1"},{"x":30,"y":-0.885,"fill":"C1"},{"x":31,"y":-0.823,"fill":"C1"},{"x":32,"y":-0.749,"fill":"C1"},{"x":33,"y":-0.663,"fill":"C1"},{"x":34,"y":-0.568,"fill":"C1"},{"x":35,"y":-0.465,"fill":"C1"},{"x":36,"y":-0.355,"fill":"C1"},{"x":37,"y":-0.239,"fill":"C1"},{"x":38,"y":-0.121,"fill":"C1"},{"x":39,"y":0,"fill":"C1"},{"x":40,"y":0.121,"fill":"C1"},{"x":41,"y":0.239,"fill":"C1"},{"x":42,"y":0.355,"fill":"C1"},{"x":43,"y":0.465,"fill":"C1"},{"x":44,"y":0.568,"fill":"C1"},{"x":45,"y":0.663,"fill":"C1"},{"x":46,"y":0.749,"fill":"C1"},{"x":47,"y":0.823,"fill":"C1"},{"x":48,"y":0.885,"fill":"C1"},{"x":49,"y":0.935,"fill":"C1"},{"x":50,"y":0.971,"fill":"C1"},{"x":51,"y":0.993,"fill":"C1"},{"x":52,"y":1,"fill":"C1"}],"geoms":["line"],"x":"Week","y":"Value","code":{"line":"ggplot(fourier_terms, aes(Week, Value, colour = group)) +\n  geom_line(linewidth = 1)"}}

Both curves are smooth, single-hump-and-dip waves, exactly one cycle over 52 weeks. Fit a regression on S1 and C1 together and it can slide, stretch and tilt this pair into any single wave of that same period.

=== step === concept
## One harmonic, then more: what K controls

One harmonic, S1 and C1 together, can only trace one smooth rise and fall a year. But real demand, like the chart back at the start of this lesson, doesn't move like one clean wave. It can level off earlier or later than a pure sine, or carry a second, smaller swing within the year that one wave alone has no way to represent.

A second harmonic adds exactly that. It's a second sine and cosine pair, S2 and C2, completing two full cycles over the same 52 weeks instead of one, and it lets the combined curve bend in ways a single wave cannot reach.

K is the count of harmonic pairs used:

- K = 1 uses only S1 and C1: one smooth wave a year.
- K = 2 adds S2 and C2 on top: a second, faster swing layered onto the first.
- Each extra K adds one more pair, Sk and Ck, completing k cycles a year, and two more coefficients the model has to estimate.

More harmonics buy more flexibility to trace the real shape. But every one of them costs two more numbers to estimate from the same 144 training weeks, and that trade-off, flexibility against cost, is a general one, worth seeing on a different curve first.

The widget below doesn't run on Victoria's demand data. It fits its own generic scatter, with a slider setting how many basis pieces the fit is allowed to use, but the trade-off it shows is the same one K makes here. Slide it and watch the fit move from stiff to a good match to a wiggly overfit.

::widget spline-smoother {}

Somewhere between those two extremes sits a fit that tracks the true curve without chasing its noise. That's the spot K needs to land on too: enough harmonics to trace the real yearly shape, not so many that they start fitting one particular week's noise instead of the pattern.

=== step === concept
## How fourier() turns K into model columns

fable's fourier() function builds these harmonic pairs for you. Call it on the training tsibble with a chosen K, and it hands back one sine and one cosine column per harmonic.

```r
# See what fourier() returns when asked for K = 2 harmonics on the training tsibble
fr <- fourier(train, K = 2)
round(head(fr), 3)
colnames(fr)
#>      S1-52 C1-52 S2-52 C2-52
#> [1,] 0.120 0.993 0.239 0.971
#> [2,] 0.239 0.971 0.463 0.886
#> [3,] 0.353 0.935 0.661 0.750
#> [4,] 0.463 0.886 0.821 0.571
#> [5,] 0.566 0.824 0.934 0.358
#> [6,] 0.661 0.750 0.992 0.126
#> [1] "S1-52" "C1-52" "S2-52" "C2-52"
```

K = 2 hands back 4 columns, 2K in general: S1-52 and C1-52 for the first harmonic, S2-52 and C2-52 for the second, each name carrying its harmonic number and the period it was built for, 52 weeks. The values themselves are just S1, C1, S2, C2 computed at every training week, the same arithmetic from the last step done automatically for however many harmonics you ask for.

One naming detail worth knowing before it shows up and confuses you: fourier() names its own columns with a hyphen, S1-52. Once a column like that goes into a model formula, fable turns the hyphen into an underscore to make a valid coefficient name, so the same term reappears as S1_52 in a fitted model's coefficients. Same number, two spellings depending on where you're looking.

=== step === concept
## Fitting ARIMA(demand ~ fourier(K = ) + pdq())

Put fourier(K = 2) straight inside an ARIMA() formula, and fable fits the harmonic columns as the regression part while letting pdq() search for whatever ARIMA order the leftover error still needs.

```r
# Fit ARIMA with the K = 2 Fourier columns as predictors, and let fable search for the ARIMA order the leftover error needs
fit_k2 <- train |> model(dynamic = ARIMA(Demand ~ fourier(K = 2) + pdq()))
report(fit_k2)
#> Series: Demand 
#> Model: LM w/ ARIMA(0,1,1) errors 
#> 
#> Coefficients:
#>           ma1  fourier(K = 2)C1_52  fourier(K = 2)S1_52  fourier(K = 2)C2_52
#>       -0.9624             -28.1089             -19.1619             -36.3960
#> s.e.   0.0214               5.6518               5.3949               5.2997
#>       fourier(K = 2)S2_52
#>                   23.2952
#> s.e.               5.2079
#> 
#> sigma^2 estimated as 2046:  log likelihood=-746.77
#> AIC=1505.54   AICc=1506.15   BIC=1523.31
```

Read "LM w/ ARIMA(0,1,1) errors" as two halves. LM is the regression half, the four Fourier columns explaining the yearly shape. ARIMA(0,1,1) is what's left over: no AR terms, one difference, one MA term, ma1 = -0.9624, describing whatever short-run pattern the Fourier columns didn't catch.

The Fourier coefficients themselves set the shape of each harmonic's wave. C1_52 = -28.1089 and S1_52 = -19.1619 together fix the height and timing of the first harmonic, one cycle a year. C2_52 = -36.3960 and S2_52 = 23.2952 do the same for the second harmonic, the finer, twice-a-year swing riding on top of it.

sigma^2 = 2046 is the estimated variance of what's left after all of that, and AICc = 1506.15 is a single number balancing that fit against how many coefficients it took to get there. That number is exactly what decides K next.

=== step === concept
## Choosing K by AICc

Fit K = 1 through K = 6 on the same training data, and let AICc say which one actually earns its extra coefficients. Try K = 1 by itself first.

```r
# Fit ARIMA with fourier(K = 1), the smallest candidate, on its own first
fit_k1 <- train |> model(k1 = ARIMA(Demand ~ fourier(K = 1) + pdq()))
#> Warning message:
#> 1 error encountered for k1
#> [1] Could not find an appropriate ARIMA model.
#> This is likely because automatic selection does not select models with characteristic roots that may be numerically unstable.
#> For more details, refer to https://otexts.com/fpp3/arima-r.html#plotting-the-characteristic-roots
```

fable's automatic search couldn't land on a stable model with only K = 1's two columns to work with here, and returned a null model instead of forcing a bad fit. That's a real limit of the automatic search on this series, not a mistake in the code. Fit the rest, K = 2 through K = 6, and see whether they fare better.

```r
# Fit ARIMA with fourier(K = ) for K = 2 through 6 on the training data
fits <- train |> model(
  k2 = ARIMA(Demand ~ fourier(K = 2) + pdq()),
  k3 = ARIMA(Demand ~ fourier(K = 3) + pdq()),
  k4 = ARIMA(Demand ~ fourier(K = 4) + pdq()),
  k5 = ARIMA(Demand ~ fourier(K = 5) + pdq()),
  k6 = ARIMA(Demand ~ fourier(K = 6) + pdq())
)
```

All five fit cleanly this time. Collect AICc from each, and sort from lowest to highest. glance() doesn't return an ARIMA model's fit statistics reliably in this in-browser R, so run this one locally instead:

```r-static
# Collect AICc from the five fits, and sort from lowest to highest
k_aicc <- fits |> glance() |> select(.model, AICc) |> mutate(AICc = round(AICc, 2)) |> arrange(AICc)
print(as.data.frame(k_aicc), row.names = FALSE)
#>  .model    AICc
#>      k4 1492.59
#>      k5 1496.27
#>      k3 1498.21
#>      k6 1498.60
#>      k2 1506.15
```

See the same numbers plotted against K.

::widget chart-plotter {"data":[{"x":2,"y":1506.15},{"x":3,"y":1498.21},{"x":4,"y":1492.59},{"x":5,"y":1496.27},{"x":6,"y":1498.6}],"geoms":["point","line"],"x":"K","y":"AICc"}

AICc drops from 1506.15 at K = 2 down to 1492.59 at K = 4, then climbs back up to 1496.27 at K = 5 and 1498.60 at K = 6. Every extra harmonic adds two more coefficients to estimate, C and S for that harmonic, and AICc charges a penalty for each one on top of rewarding a better fit. Up to K = 4, the fit improves by more than the penalty costs. Past it, the penalty wins. K = 4 has the lowest AICc of the five, so that's the model carried forward.

=== step === quiz
## Quick check: what a lower AICc across K is really telling you

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Always pick the largest K you tried, since more harmonics can only trace the yearly shape more closely. ::no
- AICc weighs how well a model fits against how many coefficients it costs to get there. Past K = 4 here, each extra harmonic's coefficients cost more than the fit they buy, so AICc turns back up instead of continuing to fall. ::ok Right. AICc rewards a closer fit but charges a penalty for every extra coefficient, C and S for each additional harmonic. Up to K = 4 the fit improves faster than the penalty grows; past it the penalty wins, which is exactly why the curve dips then climbs.
- A lower AICc always comes with a lower sigma^2 too, so the two numbers always agree on which K is best. ::no
- Since K = 1 could not even find a stable model, the comparison among K = 2 through 6 is unreliable, and any of them works about as well as any other. ::no sigma^2 never charges a penalty for extra coefficients, so it can keep falling even after AICc turns back up; the two numbers do not have to agree on the best K. And K = 1 failing to fit is a separate issue from how K = 2 through 6 compare to each other: five real fits, with AICc from 1492.59 to 1506.15, is enough to tell them apart.

=== step === concept
## Forecasting the weekly series end to end

fourier() only needs the week numbers to build the future harmonic columns, not any future demand, so this forecasts exactly the way ARIMA(y ~ x + pdq()) does with a known future predictor. Fit the K = 4 model on the 144 training weeks, then forecast the 12 held-out weeks.

```r
# Refit at K = 4, the best AICc from the last step, and forecast the 12 held-out weeks
dynamic_best <- train |> model(dynamic = ARIMA(Demand ~ fourier(K = 4) + pdq()))
fc <- forecast(dynamic_best, new_data = test)

fc_check <- fc |> as_tibble() |> transmute(week = as.character(Week), forecast = round(.mean, 1))
print(as.data.frame(fc_check), row.names = FALSE)
#>      week forecast
#>  2014 W41    727.7
#>  2014 W42    730.9
#>  2014 W43    735.2
#>  2014 W44    739.0
#>  2014 W45    740.7
#>  2014 W46    739.8
#>  2014 W47    736.5
#>  2014 W48    731.8
#>  2014 W49    727.6
#>  2014 W50    725.8
#>  2014 W51    728.2
#>  2014 W52    735.6
```

Compare that against how the interval around each forecast behaves. Read the 80% interval's width at the first held-out week and at the last.

```r
# Read the 80% interval width at the first held-out week and the last
fc_hilo <- fc |> hilo(level = c(80, 95)) |> as_tibble()
round(fc_hilo$`80%`[[1]]$upper - fc_hilo$`80%`[[1]]$lower, 1)
round(fc_hilo$`80%`[[12]]$upper - fc_hilo$`80%`[[12]]$lower, 1)
#> [1] 108.7
#> [1] 109.6
```

The interval widens a little, 108.7 GWh one week out to 109.6 GWh twelve weeks out, exactly the direction a forecast interval should move as the horizon stretches further from the last training week.

Now check the point forecasts against what demand actually did.

```r
# Compare the forecast against the 12 real held-out weeks
print(as.data.frame(accuracy(fc, test) |> transmute(RMSE = round(RMSE, 1), MAE = round(MAE, 1))), row.names = FALSE)
#>  RMSE  MAE
#>  26.9 19.3
```

See the actual demand and the forecast side by side over the 12 test weeks.

::widget chart-plotter {"data":[{"x":145,"y":729.2,"fill":"Actual"},{"x":146,"y":745.6,"fill":"Actual"},{"x":147,"y":749,"fill":"Actual"},{"x":148,"y":735.9,"fill":"Actual"},{"x":149,"y":707.6,"fill":"Actual"},{"x":150,"y":742.2,"fill":"Actual"},{"x":151,"y":732.5,"fill":"Actual"},{"x":152,"y":744,"fill":"Actual"},{"x":153,"y":771.2,"fill":"Actual"},{"x":154,"y":747,"fill":"Actual"},{"x":155,"y":744.3,"fill":"Actual"},{"x":156,"y":669.5,"fill":"Actual"},{"x":145,"y":727.7,"fill":"Forecast"},{"x":146,"y":730.9,"fill":"Forecast"},{"x":147,"y":735.2,"fill":"Forecast"},{"x":148,"y":739,"fill":"Forecast"},{"x":149,"y":740.7,"fill":"Forecast"},{"x":150,"y":739.8,"fill":"Forecast"},{"x":151,"y":736.5,"fill":"Forecast"},{"x":152,"y":731.8,"fill":"Forecast"},{"x":153,"y":727.6,"fill":"Forecast"},{"x":154,"y":725.8,"fill":"Forecast"},{"x":155,"y":728.2,"fill":"Forecast"},{"x":156,"y":735.6,"fill":"Forecast"}],"geoms":["line"],"x":"Week","y":"Demand","code":{"line":"ggplot(weekly_fc, aes(Week, Demand, colour = group)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 2)"}}

The forecast tracks the general level of the 12 test weeks without chasing every up and down, off by 26.9 GWh on average (RMSE), on a series that runs from around 632 to 1,004 GWh. Week 156's actual demand, 669.5, is the one week the forecast misses by the most, well below its neighbours; nothing in the yearly shape or the short-run ARIMA term predicts an isolated one-week dip like that.

=== step === quiz
## Quick check: why the dynamic harmonic regression works here

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A Fourier-based regression only approximates what a seasonal ARIMA(P, D, Q)[52] would already do, so the two approaches would end up fitting about the same model here. ::no
- Seasonal ARIMA at m = 52 needs seasonal terms reaching a full year back, more than a 156-week series can spare, while fourier(K = ) adds only 2K columns to the regression, no matter how long the season is. ::ok Right. A seasonal difference at m = 52 throws away 52 of 156 weeks before a residual even exists, and seasonal AR or MA terms at that lag need still more history. fourier(K = ) sidesteps all of that: 2K columns, regardless of whether the season is 52 weeks or 520.
- fourier(K = ) only works here because K = 4 happens to equal the number of years in the training data. ::no
- Seasonal ARIMA would work just as well here if it were only given more data, so the real issue was just that 156 weeks wasn't enough, nothing about how Fourier terms are built. ::no Even with far more weeks, an m = 52 seasonal ARIMA still needs a full extra year before its first seasonal difference produces any residual, and its seasonal AR and MA terms add parameters of their own on top of the non-seasonal ones. fourier(K = )'s advantage, 2K columns regardless of season length, holds at any series length; it isn't only about this one 156-week series being short. And K = 4 being the best AICc here is a property of this series, not a coincidence tied to there being three years of training data.

=== step === tryit
## Your turn: forecast from the fitted model

dynamic_best and test both already exist from the last step. Call forecast() on dynamic_best, giving it test as new_data, the same pattern used to build fc two steps back.

```r
# dynamic_best is the K = 4 model fit on train; test holds the 12 held-out weeks.
# Complete this line: call forecast() on dynamic_best with new_data = test.
# Press Check when you have it.

```
::check {"regex": "forecast[(]dynamic_best,\\s*new_data\\s*=\\s*test[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: the same 12-week forecast as before, means running from 727.7 up to 740.7 and back down to 735.6.", "no": "Call forecast(dynamic_best, new_data = test), the same pattern used two steps back to build fc."}
::solution
```r
# Reproduce the same 12-week forecast from the fitted model
forecast(dynamic_best, new_data = test)
#> # A fable: 12 x 4 [1W]
#> # Key:     .model [1]
#>    .model      Week
#>    <chr>     <week>
#>  1 dynamic 2014 W41
#>  2 dynamic 2014 W42
#>  3 dynamic 2014 W43
#>  4 dynamic 2014 W44
#>  5 dynamic 2014 W45
#>  6 dynamic 2014 W46
#>  7 dynamic 2014 W47
#>  8 dynamic 2014 W48
#>  9 dynamic 2014 W49
#> 10 dynamic 2014 W50
#> 11 dynamic 2014 W51
#> 12 dynamic 2014 W52
#> # ℹ 2 more variables: Demand <dist>, .mean <dbl>
```

Same 12 weeks, same model, same forecast as the one built two steps back. fable's fit is deterministic on the same data and formula, so calling forecast() on it again never turns up a different answer.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/), chapter 10, Dynamic regression models - Hyndman and Athanasopoulos, the source of the Fourier-terms-plus-ARIMA-errors model and choosing K by AICc.
- [fable package reference](https://fable.tidyverts.org/) - documentation for fourier(), ARIMA(), pdq(), report() and forecast().
- [tsibbledata::vic_elec documentation](https://tsibbledata.tidyverts.org/reference/vic_elec.html) - source of the half-hourly Victorian electricity demand aggregated to weekly totals here, from the Australian Energy Market Operator.
- [Hurvich, C.M. and Tsai, C.-L. (1989), "Regression and Time Series Model Selection in Small Samples," Biometrika 76(2), 297-307](https://doi.org/10.1093/biomet/76.2.297) - the original source of the AICc small-sample correction used to choose K in this lesson.

=== step === complete
## What you can do now

You can explain why a 52-week season defeats seasonal ARIMA's (P, D, Q)[52] terms: a single seasonal difference at that lag throws away a third of a 156-week series before any residual exists, and it only gets worse from there. A Fourier-based regression sidesteps the problem entirely, adding 2K columns regardless of how long the season is.

You can fit ARIMA(Demand ~ fourier(K = ) + pdq()) in fable, read report()'s two halves, the Fourier coefficients that shape the yearly curve and the ARIMA coefficients that mop up whatever's left, and choose K by comparing AICc across candidates rather than just picking the largest one.

And you just forecast a weekly series end to end from a fitted dynamic harmonic regression, at K = 4, reading its widening prediction interval and its RMSE against 12 real held-out weeks.

Next, you'll meet a series with two seasonal cycles running at once, daily and weekly, and see how the same Fourier idea extends to handle both together.

---
title: "Exponential Smoothing ETS Lesson 3: Holt-Winters seasonal smoothing, additive and multiplicative"
catalog_blurb: "Tell whether your seasonal swings should add or multiply, then forecast them."
description: "Add a seasonal term to exponential smoothing with gamma, tell additive from multiplicative seasonality, and forecast quarterly tourism data with ETS() in fable."
keywords: "Holt-Winters seasonal method, additive seasonality, multiplicative seasonality, gamma smoothing parameter, ETS(A,A,A), ETS(M,A,M), damped seasonal trend, seasonal forecasting in R, fable ETS model, quarterly tourism data"
post_type: "LESSON"
curriculum_id: "5.50.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-ets"
course_title: "Exponential Smoothing ETS"
course_lesson: "3"
course_total: "6"
course_landing: "Exponential-Smoothing-ETS-Course.html"
course_next: "The-ETS-Taxonomy.html"
course_prev: "Holt-Linear-Trend-and-Damped-Trend.html"
---

=== step === cover
## Holt-Winters seasonal smoothing, additive and multiplicative

Today let's understand Holt-Winters seasonal smoothing, the method that adds a repeating yearly pattern on top of a rising or falling trend.

Take Western Australia's domestic holiday trips, counted every quarter from 1998 to 2017, in thousands of overnight trips. That's 80 quarters of real tourism numbers, and they do two things at once. They climb overall, from around 750 thousand trips a quarter in the late 1990s to over 1,000 thousand two decades later. And within every single year they repeat the same shape: high in the first quarter, low in the third. Here is all 80 quarters of it, plotted in order.

::widget chart-plotter {"data":[{"x":1998,"y":773},{"x":1998.25,"y":720},{"x":1998.5,"y":755},{"x":1998.75,"y":814},{"x":1999,"y":943},{"x":1999.25,"y":845},{"x":1999.5,"y":823},{"x":1999.75,"y":697},{"x":2000,"y":905},{"x":2000.25,"y":905},{"x":2000.5,"y":672},{"x":2000.75,"y":716},{"x":2001,"y":709},{"x":2001.25,"y":738},{"x":2001.5,"y":762},{"x":2001.75,"y":813},{"x":2002,"y":871},{"x":2002.25,"y":773},{"x":2002.5,"y":789},{"x":2002.75,"y":643},{"x":2003,"y":846},{"x":2003.25,"y":714},{"x":2003.5,"y":722},{"x":2003.75,"y":766},{"x":2004,"y":942},{"x":2004.25,"y":685},{"x":2004.5,"y":772},{"x":2004.75,"y":727},{"x":2005,"y":817},{"x":2005.25,"y":646},{"x":2005.5,"y":650},{"x":2005.75,"y":624},{"x":2006,"y":863},{"x":2006.25,"y":761},{"x":2006.5,"y":679},{"x":2006.75,"y":799},{"x":2007,"y":852},{"x":2007.25,"y":786},{"x":2007.5,"y":702},{"x":2007.75,"y":762},{"x":2008,"y":900},{"x":2008.25,"y":654},{"x":2008.5,"y":736},{"x":2008.75,"y":655},{"x":2009,"y":748},{"x":2009.25,"y":642},{"x":2009.5,"y":570},{"x":2009.75,"y":584},{"x":2010,"y":636},{"x":2010.25,"y":627},{"x":2010.5,"y":603},{"x":2010.75,"y":567},{"x":2011,"y":733},{"x":2011.25,"y":648},{"x":2011.5,"y":613},{"x":2011.75,"y":666},{"x":2012,"y":779},{"x":2012.25,"y":680},{"x":2012.5,"y":629},{"x":2012.75,"y":692},{"x":2013,"y":918},{"x":2013.25,"y":745},{"x":2013.5,"y":680},{"x":2013.75,"y":691},{"x":2014,"y":1266},{"x":2014.25,"y":1066},{"x":2014.5,"y":855},{"x":2014.75,"y":898},{"x":2015,"y":1168},{"x":2015.25,"y":990},{"x":2015.5,"y":928},{"x":2015.75,"y":960},{"x":2016,"y":1166},{"x":2016.25,"y":1054},{"x":2016.5,"y":804},{"x":2016.75,"y":983},{"x":2017,"y":1134},{"x":2017.25,"y":998},{"x":2017.5,"y":880},{"x":2017.75,"y":1026}],"geoms":["line"],"x":"Year","y":"Trips"}

Look at how the line saws up and down on its way up. Every year opens high and dips by the third quarter, while the whole pattern climbs together across the two decades. That repeating shape, riding on top of a trend, is exactly what Holt-Winters seasonal smoothing is built to forecast.

=== step === concept
## Why a trend-only forecast misses the repeating swings

See what a plain trend does with this series before adding anything new to it. Fit ETS(A,A,N), additive error, additive trend, no season, on the WA holiday trips, and forecast two years ahead.

```r
# Build the WA quarterly holiday-trips series and see how a trend-only ETS model forecasts it
suppressMessages({
  library(fable)
  library(tsibble)
  library(tsibbledata)
  library(dplyr)
})

data(tourism)
tourism <- tourism |> filter(State == "Western Australia", Purpose == "Holiday")

wa_hol <- tourism |> summarise(Trips = sum(Trips))

fit_trend_only <- wa_hol |> model(ETS(Trips ~ error("A") + trend("A") + season("N")))
fc_trend_only <- forecast(fit_trend_only, h = "2 years")
fc_trend_only |> as_tibble() |> select(Quarter, .mean)
#> # A tibble: 8 × 2
#>   Quarter .mean
#>     <qtr> <dbl>
#> 1 2018 Q1  999.
#> 2 2018 Q2 1001.
#> 3 2018 Q3 1004.
#> 4 2018 Q4 1006.
#> 5 2019 Q1 1009.
#> 6 2019 Q2 1012.
#> 7 2019 Q3 1014.
#> 8 2019 Q4 1017.
```

The forecast barely moves. It creeps from 999 thousand trips in 2018 Q1 up to 1017 thousand by 2019 Q4, a rise of only 18 thousand trips over two full years. But the real WA series never sits still like that within a year. In 2017 alone it ran from 1134 thousand trips in the first quarter down to 880 thousand in the third, a swing of 254 thousand trips inside twelve months, more than ten times what this model expects to move in two full years. The model has a level and a slope, and nothing else. Nothing in that combination marks the third quarter as usually quiet.

Run report() to see the fitted model and its AICc, the score used to compare how well different models fit the same data. Lower is better.

```r
# See the trend-only model's fitted parameters and its AICc
report(fit_trend_only)
#> Series: Trips 
#> Model: ETS(A,A,N) 
#>   Smoothing parameters:
#>     alpha = 0.2776877 
#>     beta  = 1e-04 
#> 
#>   Initial states:
#>      l[0]     b[0]
#>  797.4035 2.622654
#> 
#>   sigma^2:  13902.59
#> 
#>      AIC     AICc      BIC 
#> 1119.645 1120.456 1131.555 
```

AICc lands at 1120.46. Hold on to that number, because once a season enters the model, that score has somewhere to fall.

=== step === concept
## The seasonal component and the smoothing parameter gamma

Holt-Winters adds a third smoothed piece alongside the level and the trend: the season, written s_t. For quarterly data it takes one value per quarter of the year, so there are four of them in a full cycle, m = 4. Here is the additive form of the equation.

$$s_t = \gamma(y_t - l_t) + (1 - \gamma)s_{t-m}$$

Read the right side term by term. The first part, gamma times (y_t minus l_t), is how far the newest observation actually landed from the current level, discounted by gamma. The second part, (1 minus gamma) times s_{t-m}, carries forward the seasonal offset from m periods back, the same quarter one year earlier. Gamma sits between 0 and 1, the same range as alpha and beta, but it plays its own role here: it decides how fast each quarter's offset updates from this cycle's fresh data, versus how much it holds on to the offset the model already had for that same quarter a year ago.

A gamma near 1 means the seasonal shape shifts quickly from one year to the next, weighted toward this year's data. A gamma near 0 means the shape barely updates at all, and stays close to whatever pattern it settled on early in the series.

=== step === concept
## The level and trend equations complete the recursion

With the season defined, the level and trend equations change just enough to make room for it.

$$l_t = \alpha(y_t - s_{t-m}) + (1-\alpha)(l_{t-1} + b_{t-1})$$

The level equation now subtracts last cycle's seasonal offset from y_t before it smooths anything. That way, a quarter that is seasonally high or low does not get mistaken for a real change in the level. The trend equation keeps exactly the form it always has.

$$b_t = \beta(l_t - l_{t-1}) + (1-\beta)b_{t-1}$$

And forecasting h steps ahead now adds back the right seasonal offset for whichever future quarter you land on.

$$\hat{y}_{t+h|t} = l_t + hb_t + s_{t+h-m(k+1)}$$

The first two terms are familiar: the current level, plus h times the current slope. The last term picks one of the four stored seasonal offsets, the one that matches the quarter h steps ahead falls on. k = floor((h-1)/m) just counts how many full cycles h reaches, so the model always grabs the offset for the right quarter instead of reusing the same one every time.

=== step === concept
## Fitting ETS(A,A,A) in fable and reading gamma

Time to fit the full model. ETS(A,A,A) means additive error, additive trend, additive season, each one smoothed by its own parameter: alpha for the level, beta for the trend, gamma for the season.

```r
# Fit additive Holt-Winters (an additive trend and an additive season) and inspect the parameters
fit_add <- wa_hol |> model(ETS(Trips ~ error("A") + trend("A") + season("A")))
report(fit_add)
#> Series: Trips 
#> Model: ETS(A,A,A) 
#>   Smoothing parameters:
#>     alpha = 0.3948398 
#>     beta  = 0.000100013 
#>     gamma = 0.1700823 
#> 
#>   Initial states:
#>      l[0]     b[0]      s[0]     s[-1]    s[-2]    s[-3]
#>  808.2677 3.328787 -41.42725 -52.10399 8.818261 84.71298
#> 
#>   sigma^2:  7827.426
#> 
#>      AIC     AICc      BIC 
#> 1077.364 1079.936 1098.803 
```

Alpha comes out at 0.3948, about what you would expect for a level that adjusts at a moderate pace. Beta is 0.0001, essentially frozen, so the slope barely moves once the series settles into its climb. And gamma is 0.1701, low, meaning the seasonal shape updates slowly and stays close to whatever pattern the model locked onto early on.

AICc for this model is 1079.94, already well below the trend-only model's AICc of 1120.46. Adding a season gave the model somewhere to put the repeating swing, and the fit improved because of it.

Now look at the seasonal offsets the model actually fitted for the last full year on record.

```r
# Read off 2017's fitted seasonal offsets, one per quarter, from the model's components
components(fit_add) |> as_tibble() |> select(Quarter, season) |> tail(4) |>
  mutate(season = sprintf("%.2f", season))
#> # A tibble: 4 × 2
#>   Quarter season 
#>     <qtr> <chr>  
#> 1 2017 Q1 148.05 
#> 2 2017 Q2 -5.70  
#> 3 2017 Q3 -117.45
#> 4 2017 Q4 -40.80 
```

Those are the s_t values from the seasonal equation, one for each quarter of 2017. Add each one onto that quarter's trend level and you get the fitted value: the first quarter runs about 148 thousand trips above trend, the third quarter about 117 thousand below it. That near 150-thousand swing, above trend in Q1 and below it in Q3, is the seasonal component doing exactly the job the trend-only model could not.

=== step === quiz
## Quick check: what gamma changes

Before moving on, check that gamma's role is solid. The equation was s_t = gamma(y_t - l_t) + (1 - gamma)s_{t-m}, and the fit just gave gamma = 0.1701.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Gamma sets how fast the series climbs overall each year, the same job beta does for the trend. ::no
- It controls how fast each quarter's seasonal offset updates from this cycle's new data, versus staying close to the offset the model already had for that same quarter a year ago. ::ok Exactly. That is the same role alpha plays for the level and beta plays for the trend, just applied here to the repeating shape instead.
- A gamma close to 1, like 0.9, keeps the seasonal shape fixed for twenty years without changing. ::no
- Gamma must always equal 1 divided by m, so for quarterly data it has to be exactly 0.25. ::no Gamma is not a fixed constant tied to how many quarters there are. It is estimated from the data just like alpha and beta, and here it came out at 0.1701. A gamma near 1 makes the seasonal shape update fast from year to year; a gamma near 0, like the one fitted here, keeps it close to whatever shape the model settled on early.

=== step === concept
## Additive versus multiplicative seasonality: the visual test

So far the season has been additive: a fixed offset, in the same units as the data, added onto the trend. There is a second form. Multiplicative seasonality is a percentage of the current trend level, multiplied onto it instead of added.

Telling the two apart comes down to one visual test. Does the within-year high-to-low swing stay about the same size as the series climbs, or does it grow larger as the level rises? A fixed-size swing points to additive. A swing that grows with the level points to multiplicative.

Check it on the WA series itself, comparing an early year against a much later one.

```r
# Compare the high-to-low swing within 1998 against the swing within 2014
suppressMessages(library(lubridate))
y1998 <- wa_hol |> filter(year(Quarter) == 1998) |> pull(Trips) |> round()
y2014 <- wa_hol |> filter(year(Quarter) == 2014) |> pull(Trips) |> round()

tibble(
  year = c(1998, 2014),
  low = c(min(y1998), min(y2014)),
  high = c(max(y1998), max(y2014)),
  swing = c(max(y1998) - min(y1998), max(y2014) - min(y2014))
)
#> # A tibble: 2 × 4
#>    year   low  high swing
#>   <dbl> <dbl> <dbl> <dbl>
#> 1  1998   720   814    94
#> 2  2014   855  1266   411
```

In 1998 the swing was 94 thousand trips, against a level sitting around 765 thousand. By 2014 the swing had grown to 411 thousand, against a level near 1021 thousand. The swing did not just grow, it grew much faster than the level itself did. That is the signature of multiplicative seasonality, not additive.

=== step === widget
## Seeing the pattern across 20 years, one line vs four facets

One combined line makes a growing swing hard to see clearly, because every year's ups and downs overlap on top of each other. Splitting the series into one small panel per quarter, all sharing the same axis, makes it obvious.

::widget facet-grid {"data":[{"x":1998,"y":773,"facet":"Q1"},{"x":1998,"y":720,"facet":"Q2"},{"x":1998,"y":755,"facet":"Q3"},{"x":1998,"y":814,"facet":"Q4"},{"x":1999,"y":943,"facet":"Q1"},{"x":1999,"y":845,"facet":"Q2"},{"x":1999,"y":823,"facet":"Q3"},{"x":1999,"y":697,"facet":"Q4"},{"x":2000,"y":905,"facet":"Q1"},{"x":2000,"y":905,"facet":"Q2"},{"x":2000,"y":672,"facet":"Q3"},{"x":2000,"y":716,"facet":"Q4"},{"x":2001,"y":709,"facet":"Q1"},{"x":2001,"y":738,"facet":"Q2"},{"x":2001,"y":762,"facet":"Q3"},{"x":2001,"y":813,"facet":"Q4"},{"x":2002,"y":871,"facet":"Q1"},{"x":2002,"y":773,"facet":"Q2"},{"x":2002,"y":789,"facet":"Q3"},{"x":2002,"y":643,"facet":"Q4"},{"x":2003,"y":846,"facet":"Q1"},{"x":2003,"y":714,"facet":"Q2"},{"x":2003,"y":722,"facet":"Q3"},{"x":2003,"y":766,"facet":"Q4"},{"x":2004,"y":942,"facet":"Q1"},{"x":2004,"y":685,"facet":"Q2"},{"x":2004,"y":772,"facet":"Q3"},{"x":2004,"y":727,"facet":"Q4"},{"x":2005,"y":817,"facet":"Q1"},{"x":2005,"y":646,"facet":"Q2"},{"x":2005,"y":650,"facet":"Q3"},{"x":2005,"y":624,"facet":"Q4"},{"x":2006,"y":863,"facet":"Q1"},{"x":2006,"y":761,"facet":"Q2"},{"x":2006,"y":679,"facet":"Q3"},{"x":2006,"y":799,"facet":"Q4"},{"x":2007,"y":852,"facet":"Q1"},{"x":2007,"y":786,"facet":"Q2"},{"x":2007,"y":702,"facet":"Q3"},{"x":2007,"y":762,"facet":"Q4"},{"x":2008,"y":900,"facet":"Q1"},{"x":2008,"y":654,"facet":"Q2"},{"x":2008,"y":736,"facet":"Q3"},{"x":2008,"y":655,"facet":"Q4"},{"x":2009,"y":748,"facet":"Q1"},{"x":2009,"y":642,"facet":"Q2"},{"x":2009,"y":570,"facet":"Q3"},{"x":2009,"y":584,"facet":"Q4"},{"x":2010,"y":636,"facet":"Q1"},{"x":2010,"y":627,"facet":"Q2"},{"x":2010,"y":603,"facet":"Q3"},{"x":2010,"y":567,"facet":"Q4"},{"x":2011,"y":733,"facet":"Q1"},{"x":2011,"y":648,"facet":"Q2"},{"x":2011,"y":613,"facet":"Q3"},{"x":2011,"y":666,"facet":"Q4"},{"x":2012,"y":779,"facet":"Q1"},{"x":2012,"y":680,"facet":"Q2"},{"x":2012,"y":629,"facet":"Q3"},{"x":2012,"y":692,"facet":"Q4"},{"x":2013,"y":918,"facet":"Q1"},{"x":2013,"y":745,"facet":"Q2"},{"x":2013,"y":680,"facet":"Q3"},{"x":2013,"y":691,"facet":"Q4"},{"x":2014,"y":1266,"facet":"Q1"},{"x":2014,"y":1066,"facet":"Q2"},{"x":2014,"y":855,"facet":"Q3"},{"x":2014,"y":898,"facet":"Q4"},{"x":2015,"y":1168,"facet":"Q1"},{"x":2015,"y":990,"facet":"Q2"},{"x":2015,"y":928,"facet":"Q3"},{"x":2015,"y":960,"facet":"Q4"},{"x":2016,"y":1166,"facet":"Q1"},{"x":2016,"y":1054,"facet":"Q2"},{"x":2016,"y":804,"facet":"Q3"},{"x":2016,"y":983,"facet":"Q4"},{"x":2017,"y":1134,"facet":"Q1"},{"x":2017,"y":998,"facet":"Q2"},{"x":2017,"y":880,"facet":"Q3"},{"x":2017,"y":1026,"facet":"Q4"}],"geom":"line","x":"Year","y":"Trips","facetVar":"Quarter"}

Look at the Q1 panel against the Q3 panel. Q1 climbs from 773 thousand trips in 1998 to 1266 thousand in 2014, then settles at 1134 thousand in 2017. Q3 climbs far less over the same span, from 755 thousand up to only 880 thousand by 2017. The two panels visibly pull apart after 2014: Q1 keeps reaching new heights while Q3 barely moves. That is the growing swing from 1998 to 2014, now spread out quarter by quarter so you can watch it happen.

=== step === concept
## Fitting ETS(M,A,M) and confirming with AICc

The visual test pointed at multiplicative. Fit it and let AICc confirm the call with a number.

```r
# Fit multiplicative Holt-Winters and compare its AICc against the additive fit
fit_mult <- wa_hol |> model(ETS(Trips ~ error("M") + trend("A") + season("M")))
report(fit_mult)
#> Series: Trips 
#> Model: ETS(M,A,M) 
#>   Smoothing parameters:
#>     alpha = 0.4767598 
#>     beta  = 0.02624188 
#>     gamma = 0.0001000026 
#> 
#>   Initial states:
#>      l[0]     b[0]     s[0]     s[-1]     s[-2]    s[-3]
#>  804.1725 12.81432 0.939274 0.9217069 0.9872416 1.151777
#> 
#>   sigma^2:  0.0116
#> 
#>      AIC     AICc      BIC 
#> 1069.175 1071.746 1090.613 
```

In a multiplicative model, the fitted seasonal terms are ratios around 1, not offsets around 0. A ratio above 1 means that quarter runs above trend; below 1 means below trend. Read off 2017's ratios.

```r
# Read off 2017's fitted seasonal ratios, one per quarter
components(fit_mult) |> as_tibble() |> select(Quarter, season) |> tail(4) |>
  mutate(season = sprintf("%.4f", season))
#> # A tibble: 4 × 2
#>   Quarter season
#>     <qtr> <chr> 
#> 1 2017 Q1 1.1517
#> 2 2017 Q2 0.9873
#> 3 2017 Q3 0.9217
#> 4 2017 Q4 0.9393
```

Q1 sits at 1.1517, about 15% above trend. Q3 sits at 0.9217, about 8% below trend. Multiply the trend level for a quarter by its ratio and you get the fitted value, the same way the additive model added its offset.

Now set the two AICc scores side by side.

```r
# Set the additive and multiplicative AICc scores side by side
tibble(model = c("Additive", "Multiplicative"),
       AICc = sprintf("%.2f", c(glance(fit_add)$AICc, glance(fit_mult)$AICc)))
#> # A tibble: 2 × 2
#>   model          AICc   
#>   <chr>          <chr>  
#> 1 Additive       1079.94
#> 2 Multiplicative 1071.75
```

Multiplicative wins, 1071.75 against 1079.94, a gap of 8.2. The number agrees with what the facets already showed: the swing scales with the level, so a model that scales its season with the level fits better.

=== step === widget
## Comparing the additive and multiplicative forecasts

Both models are fitted now. See how far apart their forecasts actually land.

::widget chart-plotter {"data":[{"x":1998,"y":773,"fill":"Historical"},{"x":1998.25,"y":720,"fill":"Historical"},{"x":1998.5,"y":755,"fill":"Historical"},{"x":1998.75,"y":814,"fill":"Historical"},{"x":1999,"y":943,"fill":"Historical"},{"x":1999.25,"y":845,"fill":"Historical"},{"x":1999.5,"y":823,"fill":"Historical"},{"x":1999.75,"y":697,"fill":"Historical"},{"x":2000,"y":905,"fill":"Historical"},{"x":2000.25,"y":905,"fill":"Historical"},{"x":2000.5,"y":672,"fill":"Historical"},{"x":2000.75,"y":716,"fill":"Historical"},{"x":2001,"y":709,"fill":"Historical"},{"x":2001.25,"y":738,"fill":"Historical"},{"x":2001.5,"y":762,"fill":"Historical"},{"x":2001.75,"y":813,"fill":"Historical"},{"x":2002,"y":871,"fill":"Historical"},{"x":2002.25,"y":773,"fill":"Historical"},{"x":2002.5,"y":789,"fill":"Historical"},{"x":2002.75,"y":643,"fill":"Historical"},{"x":2003,"y":846,"fill":"Historical"},{"x":2003.25,"y":714,"fill":"Historical"},{"x":2003.5,"y":722,"fill":"Historical"},{"x":2003.75,"y":766,"fill":"Historical"},{"x":2004,"y":942,"fill":"Historical"},{"x":2004.25,"y":685,"fill":"Historical"},{"x":2004.5,"y":772,"fill":"Historical"},{"x":2004.75,"y":727,"fill":"Historical"},{"x":2005,"y":817,"fill":"Historical"},{"x":2005.25,"y":646,"fill":"Historical"},{"x":2005.5,"y":650,"fill":"Historical"},{"x":2005.75,"y":624,"fill":"Historical"},{"x":2006,"y":863,"fill":"Historical"},{"x":2006.25,"y":761,"fill":"Historical"},{"x":2006.5,"y":679,"fill":"Historical"},{"x":2006.75,"y":799,"fill":"Historical"},{"x":2007,"y":852,"fill":"Historical"},{"x":2007.25,"y":786,"fill":"Historical"},{"x":2007.5,"y":702,"fill":"Historical"},{"x":2007.75,"y":762,"fill":"Historical"},{"x":2008,"y":900,"fill":"Historical"},{"x":2008.25,"y":654,"fill":"Historical"},{"x":2008.5,"y":736,"fill":"Historical"},{"x":2008.75,"y":655,"fill":"Historical"},{"x":2009,"y":748,"fill":"Historical"},{"x":2009.25,"y":642,"fill":"Historical"},{"x":2009.5,"y":570,"fill":"Historical"},{"x":2009.75,"y":584,"fill":"Historical"},{"x":2010,"y":636,"fill":"Historical"},{"x":2010.25,"y":627,"fill":"Historical"},{"x":2010.5,"y":603,"fill":"Historical"},{"x":2010.75,"y":567,"fill":"Historical"},{"x":2011,"y":733,"fill":"Historical"},{"x":2011.25,"y":648,"fill":"Historical"},{"x":2011.5,"y":613,"fill":"Historical"},{"x":2011.75,"y":666,"fill":"Historical"},{"x":2012,"y":779,"fill":"Historical"},{"x":2012.25,"y":680,"fill":"Historical"},{"x":2012.5,"y":629,"fill":"Historical"},{"x":2012.75,"y":692,"fill":"Historical"},{"x":2013,"y":918,"fill":"Historical"},{"x":2013.25,"y":745,"fill":"Historical"},{"x":2013.5,"y":680,"fill":"Historical"},{"x":2013.75,"y":691,"fill":"Historical"},{"x":2014,"y":1266,"fill":"Historical"},{"x":2014.25,"y":1066,"fill":"Historical"},{"x":2014.5,"y":855,"fill":"Historical"},{"x":2014.75,"y":898,"fill":"Historical"},{"x":2015,"y":1168,"fill":"Historical"},{"x":2015.25,"y":990,"fill":"Historical"},{"x":2015.5,"y":928,"fill":"Historical"},{"x":2015.75,"y":960,"fill":"Historical"},{"x":2016,"y":1166,"fill":"Historical"},{"x":2016.25,"y":1054,"fill":"Historical"},{"x":2016.5,"y":804,"fill":"Historical"},{"x":2016.75,"y":983,"fill":"Historical"},{"x":2017,"y":1134,"fill":"Historical"},{"x":2017.25,"y":998,"fill":"Historical"},{"x":2017.5,"y":880,"fill":"Historical"},{"x":2017.75,"y":1026,"fill":"Historical"},{"x":2018,"y":1186,"fill":"Additive"},{"x":2018.25,"y":1036,"fill":"Additive"},{"x":2018.5,"y":927,"fill":"Additive"},{"x":2018.75,"y":1007,"fill":"Additive"},{"x":2019,"y":1200,"fill":"Additive"},{"x":2019.25,"y":1049,"fill":"Additive"},{"x":2019.5,"y":941,"fill":"Additive"},{"x":2019.75,"y":1021,"fill":"Additive"},{"x":2018,"y":1211,"fill":"Multiplicative"},{"x":2018.25,"y":1047,"fill":"Multiplicative"},{"x":2018.5,"y":986,"fill":"Multiplicative"},{"x":2018.75,"y":1013,"fill":"Multiplicative"},{"x":2019,"y":1253,"fill":"Multiplicative"},{"x":2019.25,"y":1083,"fill":"Multiplicative"},{"x":2019.5,"y":1020,"fill":"Multiplicative"},{"x":2019.75,"y":1048,"fill":"Multiplicative"}],"geoms":["line"],"x":"Quarter","y":"Trips"}

The two forecasts start close together in 2018 and pull apart from there. By 2019 Q1 the additive path reaches 1199.60 thousand trips while the multiplicative path reaches 1253.23 thousand, a gap of 53.6 thousand trips that did not exist a year earlier. The reason is exactly what the facets showed: the multiplicative form scales its seasonal swing with the rising level, so as the trend climbs, its Q1 peak climbs faster too. The additive form holds its swing fixed in absolute size no matter how high the trend goes.

=== step === concept
## The damped seasonal variant

Holt's trend can be damped, multiplying the carried slope by phi, a number under 1, at every step so the trend flattens out instead of running forever. The same idea combines with a season.

$$b_t = \beta(l_t - l_{t-1}) + (1-\beta)\phi b_{t-1}$$

Fit the damped version of both the multiplicative and the additive models, and compare all four AICc scores.

```r
# Fit the damped multiplicative and damped additive variants
fit_damped_mult <- wa_hol |> model(ETS(Trips ~ error("M") + trend("Ad") + season("M")))
report(fit_damped_mult)
#> Series: Trips 
#> Model: ETS(M,Ad,M) 
#>   Smoothing parameters:
#>     alpha = 0.4147755 
#>     beta  = 0.0265954 
#>     gamma = 0.0001000147 
#>     phi   = 0.9285208 
#> 
#>   Initial states:
#>      l[0]     b[0]      s[0]     s[-1]     s[-2]    s[-3]
#>  770.4218 12.74693 0.9423364 0.9224261 0.9857181 1.149519
#> 
#>   sigma^2:  0.0115
#> 
#>      AIC     AICc      BIC 
#> 1068.670 1071.858 1092.490 

fit_damped_add <- wa_hol |> model(ETS(Trips ~ error("A") + trend("Ad") + season("A")))
report(fit_damped_add)
#> Series: Trips 
#> Model: ETS(A,Ad,A) 
#>   Smoothing parameters:
#>     alpha = 0.3899641 
#>     beta  = 0.03030438 
#>     gamma = 0.0001001166 
#>     phi   = 0.8006681 
#> 
#>   Initial states:
#>      l[0]     b[0]      s[0]     s[-1]     s[-2]    s[-3]
#>  760.9275 14.84886 -43.29169 -59.29299 -5.585112 108.1698
#> 
#>   sigma^2:  7749.609
#> 
#>      AIC     AICc      BIC 
#> 1077.446 1080.635 1101.266 
```

```r
# Compare all four AICc values together
tibble(
  model = c("Additive", "Multiplicative", "Damped additive", "Damped multiplicative"),
  AICc = sprintf("%.2f", c(glance(fit_add)$AICc, glance(fit_mult)$AICc,
                  glance(fit_damped_add)$AICc, glance(fit_damped_mult)$AICc))
)
#> # A tibble: 4 × 2
#>   model                 AICc   
#>   <chr>                 <chr>  
#> 1 Additive              1079.94
#> 2 Multiplicative        1071.75
#> 3 Damped additive       1080.63
#> 4 Damped multiplicative 1071.86
```

Damping barely moves either score. The damped multiplicative model gets phi = 0.9285 and an AICc of 1071.86, almost identical to the undamped multiplicative fit's 1071.75. The damped additive model gets phi = 0.8007 and an AICc of 1080.63, slightly worse than the undamped additive fit's 1079.94. Both phi values sit well under 1, which would normally mean a trend that flattens noticeably, but here it barely changes the forecast because WA's holiday trend is mild to begin with, not the kind of runaway climb that damping was built to rein in. Damping is an option to reach for when an undamped trend would keep climbing forever over a long horizon. It is not an automatic improvement, and this series is a case where it does almost nothing.

=== step === quiz
## Quick check: choosing the form, and what damping does here

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Pick multiplicative seasonality when the within-year swing grows larger as the series' level rises, the way it did here, confirmed by AICc: 1071.75 against the additive fit's 1079.94. ::ok Right. The facets showed the swing widening with the level, and AICc backed it up with a number, 1071.75 beating 1079.94.
- Always use multiplicative seasonality for quarterly data, since the frequency alone decides it. ::no
- A small gamma, like the 0.1701 from the additive fit, already tells you multiplicative is not needed. ::no
- Damping only applies to additive models, never to multiplicative ones. ::no The frequency of a series never decides additive versus multiplicative on its own. Neither does the size of gamma, which only measures how fast one model's own seasonal shape updates, not which of the two forms fits better. And damping applies to either form: the damped multiplicative fit, ETS(M,Ad,M), sits right alongside the undamped one, with an AICc of 1071.86 against 1071.75.

=== step === tryit
## Your turn: fit the damped multiplicative model and forecast

`wa_hol` still holds the 20 years of WA quarterly trips from earlier in this lesson. Fit ETS(Trips ~ error("M") + trend("Ad") + season("M")) on it, then forecast two years ahead.

```r
# Fit ETS(M,Ad,M) on wa_hol and forecast two years ahead

```
::check {"regex": "ETS[(][\\s\\S]*forecast[(]", "gate": true, "difficulty": "intermediate", "ok": "That's it. The damped multiplicative fit forecasts a 2019 Q1 of 1206 thousand trips, close to the undamped multiplicative model's 1253 because phi barely bites on a trend this mild.", "no": "Fit the model with wa_hol |> model(ETS(Trips ~ error(\"M\") + trend(\"Ad\") + season(\"M\"))), then call forecast() on the fitted object with h = \"2 years\"."}
::solution
```r
# Fit the damped multiplicative model and forecast two years ahead
fit_damped_mult <- wa_hol |> model(ETS(Trips ~ error("M") + trend("Ad") + season("M")))
fc_damped_mult <- forecast(fit_damped_mult, h = "2 years")
fc_damped_mult |> as_tibble() |> select(Quarter, .mean)
#> # A tibble: 8 × 2
#>   Quarter .mean
#>     <qtr> <dbl>
#> 1 2018 Q1 1189.
#> 2 2018 Q2 1024.
#> 3 2018 Q3  962.
#> 4 2018 Q4  985.
#> 5 2019 Q1 1206.
#> 6 2019 Q2 1037.
#> 7 2019 Q3  973.
#> 8 2019 Q4  996.
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 8.3, Holt-Winters' seasonal method](https://otexts.com/fpp3/holt-winters.html) - Hyndman and Athanasopoulos (3rd ed.).
- [Forecasting sales by exponentially weighted moving averages](https://doi.org/10.1287/mnsc.6.3.324) - Winters, P.R. (1960), Management Science, 6(3), 324-342. The paper that added the seasonal component to Holt's method.
- [Forecasting with Exponential Smoothing: The State Space Approach](https://doi.org/10.1007/978-3-540-71918-2) - Hyndman, R.J., Koehler, A.B., Ord, J.K. and Snyder, R.D. (2008), Springer.
- [Exponential smoothing: the state of the art, Part II](https://doi.org/10.1016/j.ijforecast.2006.03.005) - Gardner, E.S. (2006), International Journal of Forecasting, 22(4), 637-666.
- [fable package reference documentation for ETS()](https://fable.tidyverts.org/reference/ETS.html)

=== step === complete
## Quick recap

You added a third smoothed component to exponential smoothing and used it to forecast a real seasonal series end to end. To summarize:

- The season, s_t, is smoothed by gamma the same way the level is smoothed by alpha and the trend by beta, just applied to the repeating shape instead.
- Additive seasonality adds a fixed offset onto the trend. Multiplicative seasonality multiplies a ratio onto it, so the swing scales with the level.
- The visual test decides between them: does the within-year swing stay a fixed size, or does it grow as the level rises? AICc then confirms the call with a number.
- On the WA holiday series, multiplicative won, 1071.75 against 1079.94, because the swing grew from 94 thousand trips in 1998 to 411 thousand by 2014.
- Damping the trend, phi under 1, barely changed either score here, because WA's holiday trend was mild to start with. It matters far more on a series with a trend that would otherwise run away.

You now have the full Holt-Winters recipe: level, trend and season, in either additive or multiplicative form, with or without damping, fitted and forecast through ETS() in fable.

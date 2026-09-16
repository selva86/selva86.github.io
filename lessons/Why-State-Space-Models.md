---
title: "State Space Models and the Kalman Filter Lesson 1: An observed series as a noisy view of a hidden state"
catalog_blurb: "Why ETS and ARIMA agree, and why missing years don't break the fit."
description: "See a time series as a hidden level plus noise, write its observation and state equations on the Nile, and see why ETS and ARIMA reach nearly the same forecast."
keywords: "state space models, local level model, observation equation, state equation, Kalman filter, ETS ARIMA equivalence, StructTS, Nile dataset R, missing values time series"
post_type: "LESSON"
curriculum_id: "5.80.1"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "1"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "The-Kalman-Filter-and-Smoother.html"
course_prev: ""
---

=== step === cover
## An observed series as a noisy view of a hidden state

Today let's understand state space models, using one long, real series as the running example throughout.

The series is Nile, one of R's own built-in datasets: the river's annual flow at Aswan, in Egypt, measured every year from 1871 to 1970, a hundred years in all. Each reading is in units of 10^8 cubic metres.

Here is the whole hundred years, plotted in the order the years actually happened.

::widget chart-plotter {"data":[{"x":1871,"y":1120},{"x":1872,"y":1160},{"x":1873,"y":963},{"x":1874,"y":1210},{"x":1875,"y":1160},{"x":1876,"y":1160},{"x":1877,"y":813},{"x":1878,"y":1230},{"x":1879,"y":1370},{"x":1880,"y":1140},{"x":1881,"y":995},{"x":1882,"y":935},{"x":1883,"y":1110},{"x":1884,"y":994},{"x":1885,"y":1020},{"x":1886,"y":960},{"x":1887,"y":1180},{"x":1888,"y":799},{"x":1889,"y":958},{"x":1890,"y":1140},{"x":1891,"y":1100},{"x":1892,"y":1210},{"x":1893,"y":1150},{"x":1894,"y":1250},{"x":1895,"y":1260},{"x":1896,"y":1220},{"x":1897,"y":1030},{"x":1898,"y":1100},{"x":1899,"y":774},{"x":1900,"y":840},{"x":1901,"y":874},{"x":1902,"y":694},{"x":1903,"y":940},{"x":1904,"y":833},{"x":1905,"y":701},{"x":1906,"y":916},{"x":1907,"y":692},{"x":1908,"y":1020},{"x":1909,"y":1050},{"x":1910,"y":969},{"x":1911,"y":831},{"x":1912,"y":726},{"x":1913,"y":456},{"x":1914,"y":824},{"x":1915,"y":702},{"x":1916,"y":1120},{"x":1917,"y":1100},{"x":1918,"y":832},{"x":1919,"y":764},{"x":1920,"y":821},{"x":1921,"y":768},{"x":1922,"y":845},{"x":1923,"y":864},{"x":1924,"y":862},{"x":1925,"y":698},{"x":1926,"y":845},{"x":1927,"y":744},{"x":1928,"y":796},{"x":1929,"y":1040},{"x":1930,"y":759},{"x":1931,"y":781},{"x":1932,"y":865},{"x":1933,"y":845},{"x":1934,"y":944},{"x":1935,"y":984},{"x":1936,"y":897},{"x":1937,"y":822},{"x":1938,"y":1010},{"x":1939,"y":771},{"x":1940,"y":676},{"x":1941,"y":649},{"x":1942,"y":846},{"x":1943,"y":812},{"x":1944,"y":742},{"x":1945,"y":801},{"x":1946,"y":1040},{"x":1947,"y":860},{"x":1948,"y":874},{"x":1949,"y":848},{"x":1950,"y":890},{"x":1951,"y":744},{"x":1952,"y":749},{"x":1953,"y":838},{"x":1954,"y":1050},{"x":1955,"y":918},{"x":1956,"y":986},{"x":1957,"y":797},{"x":1958,"y":923},{"x":1959,"y":975},{"x":1960,"y":815},{"x":1961,"y":1020},{"x":1962,"y":906},{"x":1963,"y":901},{"x":1964,"y":1170},{"x":1965,"y":912},{"x":1966,"y":746},{"x":1967,"y":919},{"x":1968,"y":718},{"x":1969,"y":714},{"x":1970,"y":740}],"geoms":["line"],"x":"year","y":"flow"}

Look at that line. For its first three decades it swings around a high band, then somewhere near 1898 it drops and spends the rest of the century swinging around a lower band instead.

=== step === concept
## A real shift in level, not just one bad year

That drop around 1898 could be two different things: a single unusually low year the eye is exaggerating, or a real, lasting change in how much water the Nile carried every year from then on. The only way to tell them apart is to compare the two periods properly, not just look at the line.

Nile still holds all hundred years. Split it at 1898 and average each half.

```r
# Compare the mean Nile flow before and after 1898
before_1898 <- window(Nile, end = 1898)
after_1898 <- window(Nile, start = 1899)
round(mean(before_1898), 2)
#> [1] 1097.75
round(mean(after_1898), 2)
#> [1] 849.97
```

The 28 years up to 1898 average 1097.75. The 72 years from 1899 average 849.97, a drop of about 248, close to 23 percent of the earlier level. And it is not one bad year dragging that second average down: the drop holds across all 72 of those years, which is what makes it a real shift and not noise.

This matches a changepoint researchers have already found in this exact series, right around 1898 (Cobb, 1978), noted on R's own help page for the Nile dataset.

=== step === concept
## Writing the observation equation and the state equation

Two equations sit behind everything in this lesson, and Nile already gives every symbol in them a real meaning.

\[ y_t = \mu_t + \epsilon_t \]

This is the observation equation. \(y_t\) is the recorded Nile flow in year \(t\), the actual number in the dataset, the one you plotted and averaged in the last two steps. \(\mu_t\) is the hidden level: the true, underlying flow that year, which nobody ever measures directly. \(\epsilon_t\) is that year's own measurement noise, whatever pushed the recorded flow above or below the true level, purely by chance.

\[ \mu_t = \mu_{t-1} + \eta_t \]

This is the state equation. It says the hidden level this year, \(\mu_t\), equals last year's hidden level, \(\mu_{t-1}\), plus a small nudge, \(\eta_t\). The level is allowed to drift a little every year, but it is never allowed to jump.

Of the four symbols, \(y_t\) is the one you actually observe, sitting right there in the dataset. \(\mu_t\), \(\epsilon_t\) and \(\eta_t\) never show up in the data at all, but \(\mu_t\) is the one this whole lesson is really about: the hidden level that \(\epsilon_t\) and \(\eta_t\) together hide from you.

Put the two equations together and you have the local level model, the simplest state space model there is. Every richer state space model later in this course keeps this same shape, one equation for what you observe and one for how the hidden state moves, and only makes the state itself bigger: a level and a trend, a level and a season, and so on.

=== step === widget
## Splitting the flow before and after 1898

See the same before-and-after story as a picture, split into its two periods instead of left as one solid line.

::widget chart-plotter {"data":[{"x":1871,"y":1120,"fill":"Before 1898"},{"x":1872,"y":1160,"fill":"Before 1898"},{"x":1873,"y":963,"fill":"Before 1898"},{"x":1874,"y":1210,"fill":"Before 1898"},{"x":1875,"y":1160,"fill":"Before 1898"},{"x":1876,"y":1160,"fill":"Before 1898"},{"x":1877,"y":813,"fill":"Before 1898"},{"x":1878,"y":1230,"fill":"Before 1898"},{"x":1879,"y":1370,"fill":"Before 1898"},{"x":1880,"y":1140,"fill":"Before 1898"},{"x":1881,"y":995,"fill":"Before 1898"},{"x":1882,"y":935,"fill":"Before 1898"},{"x":1883,"y":1110,"fill":"Before 1898"},{"x":1884,"y":994,"fill":"Before 1898"},{"x":1885,"y":1020,"fill":"Before 1898"},{"x":1886,"y":960,"fill":"Before 1898"},{"x":1887,"y":1180,"fill":"Before 1898"},{"x":1888,"y":799,"fill":"Before 1898"},{"x":1889,"y":958,"fill":"Before 1898"},{"x":1890,"y":1140,"fill":"Before 1898"},{"x":1891,"y":1100,"fill":"Before 1898"},{"x":1892,"y":1210,"fill":"Before 1898"},{"x":1893,"y":1150,"fill":"Before 1898"},{"x":1894,"y":1250,"fill":"Before 1898"},{"x":1895,"y":1260,"fill":"Before 1898"},{"x":1896,"y":1220,"fill":"Before 1898"},{"x":1897,"y":1030,"fill":"Before 1898"},{"x":1898,"y":1100,"fill":"Before 1898"},{"x":1899,"y":774,"fill":"From 1898"},{"x":1900,"y":840,"fill":"From 1898"},{"x":1901,"y":874,"fill":"From 1898"},{"x":1902,"y":694,"fill":"From 1898"},{"x":1903,"y":940,"fill":"From 1898"},{"x":1904,"y":833,"fill":"From 1898"},{"x":1905,"y":701,"fill":"From 1898"},{"x":1906,"y":916,"fill":"From 1898"},{"x":1907,"y":692,"fill":"From 1898"},{"x":1908,"y":1020,"fill":"From 1898"},{"x":1909,"y":1050,"fill":"From 1898"},{"x":1910,"y":969,"fill":"From 1898"},{"x":1911,"y":831,"fill":"From 1898"},{"x":1912,"y":726,"fill":"From 1898"},{"x":1913,"y":456,"fill":"From 1898"},{"x":1914,"y":824,"fill":"From 1898"},{"x":1915,"y":702,"fill":"From 1898"},{"x":1916,"y":1120,"fill":"From 1898"},{"x":1917,"y":1100,"fill":"From 1898"},{"x":1918,"y":832,"fill":"From 1898"},{"x":1919,"y":764,"fill":"From 1898"},{"x":1920,"y":821,"fill":"From 1898"},{"x":1921,"y":768,"fill":"From 1898"},{"x":1922,"y":845,"fill":"From 1898"},{"x":1923,"y":864,"fill":"From 1898"},{"x":1924,"y":862,"fill":"From 1898"},{"x":1925,"y":698,"fill":"From 1898"},{"x":1926,"y":845,"fill":"From 1898"},{"x":1927,"y":744,"fill":"From 1898"},{"x":1928,"y":796,"fill":"From 1898"},{"x":1929,"y":1040,"fill":"From 1898"},{"x":1930,"y":759,"fill":"From 1898"},{"x":1931,"y":781,"fill":"From 1898"},{"x":1932,"y":865,"fill":"From 1898"},{"x":1933,"y":845,"fill":"From 1898"},{"x":1934,"y":944,"fill":"From 1898"},{"x":1935,"y":984,"fill":"From 1898"},{"x":1936,"y":897,"fill":"From 1898"},{"x":1937,"y":822,"fill":"From 1898"},{"x":1938,"y":1010,"fill":"From 1898"},{"x":1939,"y":771,"fill":"From 1898"},{"x":1940,"y":676,"fill":"From 1898"},{"x":1941,"y":649,"fill":"From 1898"},{"x":1942,"y":846,"fill":"From 1898"},{"x":1943,"y":812,"fill":"From 1898"},{"x":1944,"y":742,"fill":"From 1898"},{"x":1945,"y":801,"fill":"From 1898"},{"x":1946,"y":1040,"fill":"From 1898"},{"x":1947,"y":860,"fill":"From 1898"},{"x":1948,"y":874,"fill":"From 1898"},{"x":1949,"y":848,"fill":"From 1898"},{"x":1950,"y":890,"fill":"From 1898"},{"x":1951,"y":744,"fill":"From 1898"},{"x":1952,"y":749,"fill":"From 1898"},{"x":1953,"y":838,"fill":"From 1898"},{"x":1954,"y":1050,"fill":"From 1898"},{"x":1955,"y":918,"fill":"From 1898"},{"x":1956,"y":986,"fill":"From 1898"},{"x":1957,"y":797,"fill":"From 1898"},{"x":1958,"y":923,"fill":"From 1898"},{"x":1959,"y":975,"fill":"From 1898"},{"x":1960,"y":815,"fill":"From 1898"},{"x":1961,"y":1020,"fill":"From 1898"},{"x":1962,"y":906,"fill":"From 1898"},{"x":1963,"y":901,"fill":"From 1898"},{"x":1964,"y":1170,"fill":"From 1898"},{"x":1965,"y":912,"fill":"From 1898"},{"x":1966,"y":746,"fill":"From 1898"},{"x":1967,"y":919,"fill":"From 1898"},{"x":1968,"y":718,"fill":"From 1898"},{"x":1969,"y":714,"fill":"From 1898"},{"x":1970,"y":740,"fill":"From 1898"}],"geoms":["line","point"],"x":"year","y":"flow"}

Switch between the line view and the point view. Either way, the same two colours mark the same two periods, 28 years above the split and 72 below it, with the whole picture stepping down right at the 1898 boundary you already found in the means.

=== step === widget
## How far the state equation lets the level move

The state equation, \(\mu_t = \mu_{t-1} + \eta_t\), has one thing you have not seen yet: how big \(\eta_t\), the yearly nudge, actually is. That size decides how closely the fitted level tracks the data it is watching.

Drag this slider and watch that same trade-off play out on a generic curve.

::widget spline-smoother {}

A stiff line barely moves from one point to the next: that is what a state space model with a tiny \(\eta_t\) looks like, since every year's nudge is small. A wiggly line chases every point instead: that is a large \(\eta_t\), since the level is then free to move almost as much as the data itself does.

Nile's own moving averages show the same trade-off in real numbers, with no slider involved.

```r
# Compare a 3-year and a 15-year moving average of Nile flow around 1898
ma3 <- stats::filter(Nile, rep(1 / 3, 3))
ma15 <- stats::filter(Nile, rep(1 / 15, 15))
window(Nile, start = 1900, end = 1900)
#> Time Series:
#> Start = 1900
#> End = 1900
#> Frequency = 1
#> [1] 840
window(ma3, start = 1900, end = 1900)
#> Time Series:
#> Start = 1900
#> End = 1900
#> Frequency = 1
#> [1] 829.3333
window(ma15, start = 1900, end = 1900)
#> Time Series:
#> Start = 1900
#> End = 1900
#> Frequency = 1
#> [1] 951.6
```

By 1900 the raw flow has already fallen to 840. The 3-year average is close behind it, at 829.3, because it only looks at three nearby years. The 15-year average is still up at 951.6, because it is still averaging in over a decade of the old, higher years from before 1898.

A state space model with a large \(\eta_t\) behaves like that 3-year average: quick to follow a real shift. One with a small \(\eta_t\) behaves like the 15-year average: slow, still smoothing over a shift that happened years earlier.

=== step === quiz
## Quick check: state change or just noise?

You have now seen the 1898 shift three ways: as two means, as two coloured bands, and as two moving averages that both agree it happened. Which part of the state space model does a change like that actually belong to?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The observation noise, \(\epsilon_t\), simply got bigger for that decade. ::no
- The state equation's \(\mu_t\) moved to a new, lower level around 1898; it was not the observation noise changing, and it was not one bad year. ::ok Right. A level shift that holds for 72 straight years is exactly what a moving \(\mu_t\) looks like. \(\epsilon_t\) is only ever that one year's own noise, so it could never explain a change that lasts for decades.
- The one hundred-year average across the whole series already told you everything you needed to know. ::no A single average across all hundred years blends the two different levels together and hides the shift completely, which is the opposite of what splitting the series in two just showed you. The change belongs to \(\mu_t\), the state equation's own level, not to \(\epsilon_t\) getting noisier for a while, and not to some single summary number that erases the shift.

=== step === concept
## ETS and ARIMA: two routes to the same local level model

The local level model is not just a diagram. Two of R's own forecasting functions estimate it directly, each by a completely different search, and it is worth seeing that they land in nearly the same place.

Fit it the first way, as ETS(A,N,N): additive error, no trend, no season, which is exactly the local level model written in state space form.

```r
# Build the Nile tsibble and fit ETS(A,N,N), the local level model in state space form
library(tsibble)
library(fable)

nile_tsbl <- as_tsibble(Nile)
names(nile_tsbl) <- c("year", "flow")

fit_ets <- nile_tsbl |>
  model(ets = ETS(flow ~ error("A") + trend("N") + season("N")))
report(fit_ets)
#> Series: flow
#> Model: ETS(A,N,N)
#>   Smoothing parameters:
#>     alpha = 0.2455339
#>
#>   Initial states:
#>      l[0]
#>  1110.687
#>
#>   sigma^2:  20802.8
#>
#>      AIC     AICc      BIC
#> 1458.781 1459.031 1466.597
forecast(fit_ets, h = 1)
#> # A fable: 1 x 4 [1Y]
#> # Key:     .model [1]
#>   .model  year          flow
#>   <chr>  <dbl>        <dist>
#> 1 ets     1971 N(805, 20803)
#> # i 1 more variable: .mean <dbl>
```

`report()` shows alpha = 0.2455339, the same alpha from the state equation two steps back: how much of last year's surprise gets folded into this year's level. `forecast()` puts 1971, the year right after the data ends, at 805 on average.

Now fit the same idea a second way.

```r
# Fit ARIMA(0,1,1) with no constant on the same series, the other route to the same model
fit_arima <- arima(Nile, order = c(0, 1, 1), include.mean = FALSE)
fit_arima
#> Call:
#> arima(x = Nile, order = c(0, 1, 1), include.mean = FALSE)
#>
#> Coefficients:
#>           ma1
#>       -0.7329
#> s.e.   0.1143
#>
#> sigma^2 estimated as 20600:  log likelihood = -632.55,  aic = 1269.09
predict(fit_arima, n.ahead = 1)$pred
#> Time Series:
#> Start = 1971
#> End = 1971
#> Frequency = 1
#> [1] 798.3673
```

ARIMA(0,1,1) with no constant differences the series once, which removes \(\mu_t\)'s drift directly instead of estimating it as a separate state, and then fits one moving-average term, theta = -0.7329, to what is left. Its forecast for 1971 comes out at 798.4.

805 against 798 is within about 1 percent, close enough to say the two are clearly describing the same series the same way. And there is a direct link between their two numbers: 1 + theta works out to 0.267, close to alpha's 0.2455. The two are not identical, because ETS and `arima()` optimise slightly different likelihoods to get there, but they sit close enough to confirm both are circling the same local level model from two different directions.

=== step === concept
## Estimating a year nobody measured

One practical payoff of writing a series this way: the model still has something to say about a year with no data in it at all. See it by deleting a real stretch of Nile's own history.

```r
# Delete 40 of Nile's 100 years, following R's own documented Nile example
NileNA <- Nile
NileNA[c(21:40, 61:80)] <- NA
window(NileNA, start = 1891, end = 1895)
#> Time Series:
#> Start = 1891
#> End = 1895
#> Frequency = 1
#> [1] NA NA NA NA NA
```

1891 to 1910 and 1931 to 1950, 40 years in total, are now missing, following the exact example documented on R's own `?Nile` help page. Fit the local level model on this gappy series with `StructTS()`, then smooth it with `tsSmooth()`.

```r
# Fit the local level model on the gappy series and smooth every year, missing years included
fit_na <- StructTS(NileNA, type = "level")
sm_na <- tsSmooth(fit_na)
window(sm_na[, "level"], start = 1891, end = 1895)
#> Time Series:
#> Start = 1891
#> End = 1895
#> Frequency = 1
#> [1] 987.7609 979.7011 971.6412 963.5814 955.5215
```

Even though `NileNA` has no data at all for 1891 to 1895, `tsSmooth()` still returns a real number for the level in every one of those years. That is because the state equation, \(\mu_t = \mu_{t-1} + \eta_t\), only ever needs \(\mu_{t-1}\); it does not need \(y_t\) to produce \(\mu_t\). In a year with an observation, the observation equation adds its own information on top of that. In a year with none, \(\mu_t\) simply carries forward from \(\mu_{t-1}\) plus the model's own estimated size of \(\eta_t\), which is why the numbers above decline gently across the whole 20-year gap instead of freezing in place.

=== step === concept
## Reading the hidden level off as its own number

Fit the same local level model on the whole, ungapped Nile series this time, and look at what the smoothed level does right through the 1898 shift.

```r
# Fit the local level model on the full Nile series and smooth its level component
fit_full <- StructTS(Nile, type = "level")
sm_full <- tsSmooth(fit_full)
window(sm_full[, "level"], start = 1896, end = 1900)
#> Time Series:
#> Start = 1896
#> End = 1900
#> Frequency = 1
#> [1] 1078.1819 1038.4717  999.5857  950.9291  919.4883
```

This is \(\mu_t\) itself, read straight off the fitted model, one named number for every year: 1078 in 1896, 1038 in 1897, 1000 in 1898, 951 in 1899, and 919 by 1900. It does not jump from the old level to the new one in a single year. It slides down over several years instead, because \(\eta_t\) only ever nudges \(\mu_t\) a little at a time, exactly as the state equation says it must. That is the real difference between reading the raw \(y_t\), which does jump around year to year since it still carries \(\epsilon_t\), and reading \(\mu_t\), which only ever moves as fast as the state equation allows.

=== step === quiz
## Quiz: the state space idea in one pass

The observation and state equations and the ETS/ARIMA fit both point at the same fact from two different angles. Put them together.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Both ETS(A,N,N) and ARIMA(0,1,1) are estimating the same local level model, \(y_t = \mu_t + \epsilon_t\) with \(\mu_t = \mu_{t-1} + \eta_t\), just through two different search routines. ::ok Exactly. The observation and state equations wrote the local level model down as two equations, and the fitted models showed ETS(A,N,N) and ARIMA(0,1,1) landing close to each other because they are estimating that exact same model, one through ETS's own state space search and the other through differencing plus a moving-average term.
- It is a coincidence that happens to hold for this particular series. ::no
- ETS and ARIMA always forecast identically, for any series. ::no Not for any series, and not by coincidence here either. The match holds specifically because ETS(A,N,N) and ARIMA(0,1,1) are two routes to the same underlying local level model. A different pair, like a damped-trend ETS model and a seasonally differenced ARIMA, has no such exact correspondence and can disagree by a lot.

=== step === tryit
## Your turn: find the model's estimate for a missing year

`sm_na` still holds the smoothed level for every year of `NileNA`, missing years included. Here is what it says for the two years right around 1900, skipping 1900 itself.

```r
# Show the smoothed level for the years just before and after 1900, from the gappy fit
sm_na[c(29, 31), "level"]
#> [1] 923.2821 907.1623
```

1899 sits at 923.2821 and 1901 at 907.1623, both estimated from inside a 20-year gap with no data at all. Now find 1900's own smoothed level the same way you found 1891 to 1895's a little earlier: with `window()` on `sm_na`'s level column.

```r
# sm_na still holds the smoothed level for every year of NileNA, missing years included.
# Print the smoothed level for 1900 alone, the same way 1891 to 1895 were printed a little earlier.
# One line. Press Check when you have it.
```
::check {"regex": "sm_na[\\s\\S]*1900", "gate": true, "difficulty": "intermediate", "ok": "Right: 915.2222, sitting right between 1899's 923.2821 and 1901's 907.1623, sliding down through the gap one small step at a time. Nowhere near the raw 840 the Nile actually carried that year: the model was never shown that number, so it interpolates smoothly between what it does know instead of recovering the exact past reading.", "no": "Use window() on sm_na's level column the same way you did it for 1891 to 1895, this time with start = 1900 and end = 1900."}
::solution
```r
# Print the smoothed level for 1900 alone
window(sm_na[, "level"], start = 1900, end = 1900)
#> Time Series:
#> Start = 1900
#> End = 1900
#> Frequency = 1
#> [1] 915.2222
```

=== step === concept
## References

- Durbin, J. and Koopman, S.J. (2001), *Time Series Analysis by State Space Methods*, Oxford University Press. Source of the Nile series and the local level model this lesson builds from.
- [Cobb, G.W. (1978), "The Problem of the Nile: Conditional Solution to a Changepoint Problem"](https://doi.org/10.1093/biomet/65.2.243), *Biometrika* 65(2), 243-251. The changepoint near 1898 that the before-and-after comparison earlier in this lesson confirms.
- [R documentation for the `Nile` dataset](https://stat.ethz.ch/R-manual/R-patched/library/datasets/html/Nile.html) (datasets package). Confirms the 1871-1970 span, the units, and the changepoint citation used in this lesson.
- Harvey, A.C. (1989), *Forecasting, Structural Time Series Models and the Kalman Filter*, Cambridge University Press. The standard reference for the general state space form, of which this lesson's local level model is the simplest case.
- [Forecasting: Principles and Practice, chapter 8: Exponential smoothing](https://otexts.com/fpp3/expsmooth.html) - Hyndman, R.J. and Athanasopoulos, G. (3rd ed., OTexts). The state space formulation behind the `ETS()` fit in this lesson.

=== step === complete
## What you can do now

You can now say what a state space model actually claims: an observation equation for the number you see, plus noise, sitting on a state equation for how a hidden level moves underneath it. On Nile, that hidden level held near 1098 for 28 years, then slid down to about 850 for the rest of the century, and \(\mu_t\), not \(\epsilon_t\), is what carried it there.

You have also seen the same local level model twice, from two different directions: ETS(A,N,N) and ARIMA(0,1,1) landing within about a percent of each other on the same series, because they are fitting the same pair of equations two different ways.

And you have used two things that fall straight out of writing a series this way: a real number for a year with no observation at all, and a hidden level you can read off directly, year by year, instead of only ever seeing it through the noise sitting on top of it.

Next, you will open up exactly how a state space model computes all of this: the predict-then-update loop that produced every smoothed number in this lesson, worked out by hand on a few years of data.

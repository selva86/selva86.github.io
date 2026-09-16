---
title: "ARIMA and Seasonal ARIMA Lesson 3: Reading the ACF and PACF to tell AR from MA"
catalog_blurb: "Tell an AR process from an MA process by reading two simple plots."
description: "What the PACF measures that the ACF misses, and how to read the ACF and PACF together to tell an AR process from an MA process on real and simulated series."
keywords: "ACF, PACF, partial autocorrelation, autocorrelation function, AR process, MA process, ARIMA order identification, gg_tsdisplay, Box-Jenkins, time series R"
post_type: "LESSON"
curriculum_id: "5.60.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-arima"
course_title: "ARIMA and Seasonal ARIMA"
course_lesson: "3"
course_total: "7"
course_landing: "ARIMA-and-Seasonal-ARIMA-Course.html"
course_next: "Non-Seasonal-ARIMA-Models.html"
course_prev: "Differencing-and-Seasonal-Differencing.html"
---

=== step === cover
## Reading the ACF and PACF to tell AR from MA

Today let's understand two plots that, read together, tell you what kind of pattern is still hiding in a time series once the trend and the season are gone: the ACF, and a second plot called the PACF.

The running example is AirPassengers, R's built-in monthly count of international airline passengers, in thousands, from January 1949 through December 1960. One ordinary difference and one seasonal difference, at lag 12, already removed its climbing trend and its yearly season, leaving 131 months behind.

Here is what remains.

::widget chart-plotter {"data":[{"x":1,"y":5},{"x":2,"y":1},{"x":3,"y":-3},{"x":4,"y":-2},{"x":5,"y":10},{"x":6,"y":8},{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":-8},{"x":10,"y":-4},{"x":11,"y":12},{"x":12,"y":8},{"x":13,"y":-6},{"x":14,"y":13},{"x":15,"y":-9},{"x":16,"y":19},{"x":17,"y":-18},{"x":18,"y":0},{"x":19,"y":0},{"x":20,"y":-3},{"x":21,"y":3},{"x":22,"y":3},{"x":23,"y":-6},{"x":24,"y":0},{"x":25,"y":4},{"x":26,"y":-15},{"x":27,"y":3},{"x":28,"y":-7},{"x":29,"y":29},{"x":30,"y":-9},{"x":31,"y":12},{"x":32,"y":-18},{"x":33,"y":4},{"x":34,"y":-3},{"x":35,"y":2},{"x":36,"y":-3},{"x":37,"y":-9},{"x":38,"y":27},{"x":39,"y":11},{"x":40,"y":-8},{"x":41,"y":-21},{"x":42,"y":9},{"x":43,"y":-4},{"x":44,"y":-2},{"x":45,"y":-8},{"x":46,"y":-12},{"x":47,"y":-1},{"x":48,"y":1},{"x":49,"y":-16},{"x":50,"y":7},{"x":51,"y":-7},{"x":52,"y":13},{"x":53,"y":16},{"x":54,"y":17},{"x":55,"y":-17},{"x":56,"y":1},{"x":57,"y":-4},{"x":58,"y":5},{"x":59,"y":5},{"x":60,"y":10},{"x":61,"y":7},{"x":62,"y":-13},{"x":63,"y":10},{"x":64,"y":-6},{"x":65,"y":15},{"x":66,"y":11},{"x":67,"y":-8},{"x":68,"y":-1},{"x":69,"y":-8},{"x":70,"y":-11},{"x":71,"y":15},{"x":72,"y":-7},{"x":73,"y":2},{"x":74,"y":6},{"x":75,"y":-6},{"x":76,"y":4},{"x":77,"y":11},{"x":78,"y":-10},{"x":79,"y":9},{"x":80,"y":-15},{"x":81,"y":-11},{"x":82,"y":2},{"x":83,"y":-6},{"x":84,"y":3},{"x":85,"y":-7},{"x":86,"y":15},{"x":87,"y":-4},{"x":88,"y":2},{"x":89,"y":11},{"x":90,"y":4},{"x":91,"y":10},{"x":92,"y":-13},{"x":93,"y":-8},{"x":94,"y":-7},{"x":95,"y":-4},{"x":96,"y":-5},{"x":97,"y":-8},{"x":98,"y":-11},{"x":99,"y":-6},{"x":100,"y":8},{"x":101,"y":5},{"x":102,"y":13},{"x":103,"y":12},{"x":104,"y":-38},{"x":105,"y":12},{"x":106,"y":-7},{"x":107,"y":-4},{"x":108,"y":19},{"x":109,"y":4},{"x":110,"y":20},{"x":111,"y":4},{"x":112,"y":9},{"x":113,"y":-20},{"x":114,"y":20},{"x":115,"y":-3},{"x":116,"y":5},{"x":117,"y":-11},{"x":118,"y":4},{"x":119,"y":16},{"x":120,"y":-11},{"x":121,"y":-8},{"x":122,"y":-36},{"x":123,"y":52},{"x":124,"y":-13},{"x":125,"y":11},{"x":126,"y":11},{"x":127,"y":-27},{"x":128,"y":-2},{"x":129,"y":9},{"x":130,"y":-26},{"x":131,"y":-1}],"geoms":["line"],"x":"index","y":"value"}

It wanders around zero with no obvious climb and no obvious yearly repeat left in it. But flat to the eye is not the same thing as free of pattern, and telling those two apart is exactly what the ACF and the PACF, read side by side, let you do.

=== step === concept
## What the ACF leaves out, and what the PACF adds

The ACF, short for autocorrelation function, measures how strongly a series is related to its own past. Its value at lag k is the correlation between the series and that same series shifted back k steps. A significance band, roughly plus or minus 2 divided by the square root of how many values you have, marks how far that correlation can wander by pure chance when there is really no dependence at that lag.

But the ACF cannot separate a direct effect from an indirect one. Its value at lag 2 mixes the direct pull of lag 2 on today's value with an indirect pull that arrives secondhand: lag 2 helps shape lag 1, and lag 1 helps shape today, so part of what the ACF reports at lag 2 is really lag 1's influence passed along the chain, not lag 2 acting on its own.

The partial autocorrelation function, the PACF, strips that indirect part out. The PACF at lag k is the coefficient on the k-th lag when today's value is regressed on lags 1 through k all at once. With lags 1 through k-1 already sitting in that same regression, whatever coefficient lag k earns is its direct pull alone, once every indirect path through the closer lags has been accounted for.

Write that regression out for lag k:

\[ y_t = \alpha_1 y_{t-1} + \alpha_2 y_{t-2} + \cdots + \alpha_k y_{t-k} + \varepsilon_t \]

The PACF at lag k is \(\alpha_k\), the coefficient on the k-th lag in that particular regression. Check a different lag and you run a different regression, one more lag long, and read off its own last coefficient.

See that difference on a real series instead of in the abstract. Build a simulated series 200 points long, with a known rule linking each value to its own last two lags. Then compare the ACF's raw value at lag 2 against the lag-2 coefficient from regressing today's value on its first two lags together.

```r
# Compare the ACF at lag 2 with the lag-2 coefficient from a two-lag regression
library(tsibble)
library(feasts)
library(dplyr)

set.seed(6)
ar2_y <- as.numeric(arima.sim(list(ar = c(0.6, -0.3)), n = 200))
ar2 <- tsibble(t = 1:200, y = ar2_y, index = t)

round((ar2 |> ACF(y, lag_max = 2))$acf[2], 3)
#> [1] -0.062

y_now <- ar2_y[3:200]
y_lag1 <- ar2_y[2:199]
y_lag2 <- ar2_y[1:198]
round(coef(lm(y_now ~ y_lag1 + y_lag2)), 3)
#> (Intercept)      y_lag1      y_lag2 
#>      -0.079       0.619      -0.350 

round((ar2 |> PACF(y, lag_max = 2))$pacf[2], 3)
#> [1] -0.343
```

The raw ACF at lag 2 comes out at -0.062, small. But once lag 1 sits in the regression alongside it, lag 2's own coefficient comes out at -0.350, close to what `PACF()` reports directly for lag 2, -0.343 (the small gap between -0.350 and -0.343 is just two different ways of estimating the same thing, a plain regression here against PACF's own method, not a real disagreement). Lag 2's raw correlation was hiding most of its real, direct pull, because a large share of it was arriving secondhand, through lag 1.

=== step === widget
## The AR(2) signature: PACF cuts off, ACF decays

The series built a moment ago followed a known rule: an autoregressive process of order 2, written AR(2). In general, an AR(p) process writes today's value as a weighted sum of its own last p values, plus fresh noise:

\[ y_t = \phi_1 y_{t-1} + \phi_2 y_{t-2} + \cdots + \phi_p y_{t-p} + \varepsilon_t \]

That series used p = 2, with weights phi1 = 0.6 and phi2 = -0.3.

Compute its ACF and PACF over the first 10 lags.

```r
# Compute the ACF and PACF of the AR(2) series over the first 10 lags
round((ar2 |> ACF(y, lag_max = 10))$acf, 3)
#>  [1]  0.457 -0.062 -0.208 -0.183 -0.090  0.052  0.040 -0.029 -0.058 -0.056

round((ar2 |> PACF(y, lag_max = 10))$pacf, 3)
#>  [1]  0.457 -0.343 -0.019 -0.098 -0.011  0.069 -0.096 -0.015 -0.032 -0.030
```

With 200 values, the significance band is about plus or minus 0.1414. The PACF reads 0.457 at lag 1 and -0.343 at lag 2, both well outside that band, then every value from lag 3 through lag 10 falls back inside it. That is a clean cutoff, right at lag 2, exactly matching p = 2. The ACF never does that. It keeps producing values like -0.208 at lag 3 and -0.183 at lag 4 before settling down, decaying gradually instead of stopping at a fixed lag.

See that pair as bar charts, the first 10 lags each, with any bar outside the band marked apart from the ones inside it. Here is the ACF first.

::widget chart-plotter {"data":[{"x":1,"y":0.457,"fill":"Outside band"},{"x":2,"y":-0.062,"fill":"Inside band"},{"x":3,"y":-0.208,"fill":"Outside band"},{"x":4,"y":-0.183,"fill":"Outside band"},{"x":5,"y":-0.090,"fill":"Inside band"},{"x":6,"y":0.052,"fill":"Inside band"},{"x":7,"y":0.040,"fill":"Inside band"},{"x":8,"y":-0.029,"fill":"Inside band"},{"x":9,"y":-0.058,"fill":"Inside band"},{"x":10,"y":-0.056,"fill":"Inside band"}],"geoms":["bar"],"x":"lag","y":"acf"}

And here is the PACF, over the same 10 lags.

::widget chart-plotter {"data":[{"x":1,"y":0.457,"fill":"Outside band"},{"x":2,"y":-0.343,"fill":"Outside band"},{"x":3,"y":-0.019,"fill":"Inside band"},{"x":4,"y":-0.098,"fill":"Inside band"},{"x":5,"y":-0.011,"fill":"Inside band"},{"x":6,"y":0.069,"fill":"Inside band"},{"x":7,"y":-0.096,"fill":"Inside band"},{"x":8,"y":-0.015,"fill":"Inside band"},{"x":9,"y":-0.032,"fill":"Inside band"},{"x":10,"y":-0.030,"fill":"Inside band"}],"geoms":["bar"],"x":"lag","y":"pacf"}

The PACF bars stop clearing the band right where p stops: two bars out, then eight bars in a row inside it. That cutoff at lag p is the AR(p) signature. Once lags 1 and 2 already sit in the regression behind the PACF, there is no lag-3 or lag-4 term in the AR(2) equation itself for a lag-3 or lag-4 regression coefficient to pick up, so those coefficients settle near zero. The ACF carries no such regression, so it keeps decaying instead, chained back through the indirect effects that lags 1 and 2 pass along.

=== step === widget
## The MA(2) signature: ACF cuts off, PACF decays

An AR process is not the only kind of dependence a stationary series can have. A moving average process of order q, written MA(q), writes today's value as today's own fresh noise plus a weighted sum of the last q noise terms:

\[ y_t = \varepsilon_t + \theta_1 \varepsilon_{t-1} + \theta_2 \varepsilon_{t-2} + \cdots + \theta_q \varepsilon_{t-q} \]

Build a second simulated series, 200 points long, an MA(2) with weights theta1 = 0.7 and theta2 = -0.4. Compute its ACF and PACF over the first 10 lags the same way.

```r
# Build an MA(2) series and compute its ACF and PACF over the first 10 lags
set.seed(1)
ma2_y <- as.numeric(arima.sim(list(ma = c(0.7, -0.4)), n = 200))
ma2 <- tsibble(t = 1:200, y = ma2_y, index = t)

round((ma2 |> ACF(y, lag_max = 10))$acf, 3)
#>  [1]  0.239 -0.221 -0.013 -0.003  0.015  0.008  0.033 -0.011  0.066  0.001

round((ma2 |> PACF(y, lag_max = 10))$pacf, 3)
#>  [1]  0.239 -0.295  0.147 -0.130  0.103 -0.071  0.099 -0.088  0.170 -0.151
```

This time the ACF is the one that cuts off. It reads 0.239 at lag 1 and -0.221 at lag 2, then every value from lag 3 through lag 10 sits inside the same 0.1414 band. The PACF does not settle the same way. It also starts at 0.239 and -0.295, but from lag 3 on it keeps moving, 0.147, -0.130, 0.103, and a couple of later bars still poke back outside the band rather than staying put.

See both as bar charts, the same way as before. Here is the ACF.

::widget chart-plotter {"data":[{"x":1,"y":0.239,"fill":"Outside band"},{"x":2,"y":-0.221,"fill":"Outside band"},{"x":3,"y":-0.013,"fill":"Inside band"},{"x":4,"y":-0.003,"fill":"Inside band"},{"x":5,"y":0.015,"fill":"Inside band"},{"x":6,"y":0.008,"fill":"Inside band"},{"x":7,"y":0.033,"fill":"Inside band"},{"x":8,"y":-0.011,"fill":"Inside band"},{"x":9,"y":0.066,"fill":"Inside band"},{"x":10,"y":0.001,"fill":"Inside band"}],"geoms":["bar"],"x":"lag","y":"acf"}

And here is the PACF.

::widget chart-plotter {"data":[{"x":1,"y":0.239,"fill":"Outside band"},{"x":2,"y":-0.295,"fill":"Outside band"},{"x":3,"y":0.147,"fill":"Outside band"},{"x":4,"y":-0.130,"fill":"Inside band"},{"x":5,"y":0.103,"fill":"Inside band"},{"x":6,"y":-0.071,"fill":"Inside band"},{"x":7,"y":0.099,"fill":"Inside band"},{"x":8,"y":-0.088,"fill":"Inside band"},{"x":9,"y":0.170,"fill":"Outside band"},{"x":10,"y":-0.151,"fill":"Outside band"}],"geoms":["bar"],"x":"lag","y":"pacf"}

This is the mirror image of the AR(2) case. The MA(2) equation only ever writes today's value in terms of the last two noise terms, so the ACF, which measures the raw correlation, has nothing left to pick up past lag 2 and cuts off there cleanly. The PACF, though, is really asking an AR question at every lag, how much does adding one more lag to a growing regression still help, and an MA process can only be written as an AR process of infinite length. So its PACF never fully settles the way AR(2)'s did. It fades out instead, sometimes unevenly, rather than stopping dead at one lag.

=== step === widget
## The two signatures side by side

Both signatures, gathered in one place.

::widget styled-table {"cols":["Process","ACF pattern","PACF pattern"],"rows":[["AR(p)","Decays","Cuts off after lag p"],["MA(q)","Cuts off after lag q","Decays"]],"title":"Two signatures to tell apart","note":"Whichever plot cuts off cleanly names the order: lag p for an AR(p), lag q for an MA(q)."}

Reading either row is the same move: find the plot that stops clearing the significance band at a fixed lag and stays inside it from there on. That lag is the process's order. The other plot, the one that keeps decaying instead of stopping, is not read for an order at all, only for the shape that confirms which family you are looking at.

=== step === quiz
## Quick check: why AR(2)'s PACF cuts off but its ACF does not

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The ACF and the PACF measure the same thing, just computed in a different way. ::no
- The difference between the two plots is just simulation noise, not a real pattern. ::no
- Past lag 2, the AR(2) equation has no direct term for those lags, so their regression coefficients, the PACF, come out near zero. The ACF still carries the indirect effect chained back through lags 1 and 2, so it keeps decaying instead. ::ok Exactly right. AR(2) only ever writes today's value in terms of its own last two lags, so once lags 1 and 2 already sit in the regression behind the PACF, a lag-3 or lag-4 coefficient has nothing direct left to explain. The ACF has no such regression behind it, so it keeps carrying that indirect chain instead.
- The PACF cuts off because the simulated series is too short to show anything at higher lags. ::no PACF and ACF measure the same underlying dependence, but PACF strips out the indirect path through the closer lags, which is exactly why the two plots differ here. That gap is not noise, it is what an AR(2) process predicts, and it shows up the same way whether the series is 100 points or 2,000. Once lags 1 and 2 sit in the regression, there is nothing direct left for lag 3 or beyond to explain.

=== step === concept
## gg_tsdisplay(plot_type = "partial"): the standard view

Building the ACF and the PACF as two separate calls works, but it is not how most people check this in practice. The feasts package has one function, `gg_tsdisplay()`, that puts the time plot, the ACF and the PACF together in a single call, with `plot_type = "partial"` telling it to use the PACF rather than a plain lag plot for the third panel.

Run it on the same AR(2) series, still sitting in your session.

```r
# Show the time plot, ACF and PACF together for the AR(2) series
library(feasts)

ar2 |> gg_tsdisplay(y, plot_type = "partial")
```

The three panels show the same story already worked out by hand: a series bouncing around with no trend, an ACF that decays, and a PACF that cuts off after lag 2. `gg_tsdisplay()` does not compute anything new, it just saves you from calling `ACF()` and `PACF()` separately and lining the two plots up yourself, which is why it is the function reached for first in practice.

=== step === widget
## Reading a real series: AR or MA pattern left in AirPassengers?

Time to read a real series instead of a simulated one. Rebuild the differenced AirPassengers series: one seasonal difference at lag 12, then one ordinary difference at lag 1, leaving 131 months.

```r
# Rebuild the twice-differenced AirPassengers series and check its ACF and PACF
air <- as_tsibble(AirPassengers) |> rename(passengers = value, month = index)
air <- air |> mutate(D1 = difference(passengers, lag = 12))
air <- air |> mutate(D1d1 = difference(D1, lag = 1))

n_air <- sum(!is.na(air$D1d1))
n_air
#> [1] 131

round(2 / sqrt(n_air), 4)
#> [1] 0.1747

round((air |> ACF(D1d1, lag_max = 18))$acf, 3)
#>  [1] -0.310  0.095 -0.097 -0.099  0.061  0.000 -0.056 -0.061  0.176 -0.140
#> [11]  0.070 -0.134  0.087  0.002  0.065 -0.109  0.000  0.044

round((air |> PACF(D1d1, lag_max = 18))$pacf, 3)
#>  [1] -0.310 -0.001 -0.075 -0.167 -0.015  0.018 -0.088 -0.134  0.156 -0.059
#> [11] -0.052 -0.115  0.060  0.004  0.037 -0.087 -0.028  0.019
```

With 131 values, the band is wider than before, about plus or minus 0.1747. Look at the ACF first. It spikes once, to -0.310 at lag 1, then every later value sits inside the band, apart from lag 9 at 0.176, which pokes just past 0.1747, small enough to read as noise rather than a real spike. Now look at the PACF. It also starts at -0.310, then falls straight inside the band from lag 2 on and stays there through lag 18.

See both as bar charts, over the full 18 lags checked.

::widget chart-plotter {"data":[{"x":1,"y":-0.310,"fill":"Outside band"},{"x":2,"y":0.095,"fill":"Inside band"},{"x":3,"y":-0.097,"fill":"Inside band"},{"x":4,"y":-0.099,"fill":"Inside band"},{"x":5,"y":0.061,"fill":"Inside band"},{"x":6,"y":0.000,"fill":"Inside band"},{"x":7,"y":-0.056,"fill":"Inside band"},{"x":8,"y":-0.061,"fill":"Inside band"},{"x":9,"y":0.176,"fill":"Outside band"},{"x":10,"y":-0.140,"fill":"Inside band"},{"x":11,"y":0.070,"fill":"Inside band"},{"x":12,"y":-0.134,"fill":"Inside band"},{"x":13,"y":0.087,"fill":"Inside band"},{"x":14,"y":0.002,"fill":"Inside band"},{"x":15,"y":0.065,"fill":"Inside band"},{"x":16,"y":-0.109,"fill":"Inside band"},{"x":17,"y":0.000,"fill":"Inside band"},{"x":18,"y":0.044,"fill":"Inside band"}],"geoms":["bar"],"x":"lag","y":"acf"}

::widget chart-plotter {"data":[{"x":1,"y":-0.310,"fill":"Outside band"},{"x":2,"y":-0.001,"fill":"Inside band"},{"x":3,"y":-0.075,"fill":"Inside band"},{"x":4,"y":-0.167,"fill":"Inside band"},{"x":5,"y":-0.015,"fill":"Inside band"},{"x":6,"y":0.018,"fill":"Inside band"},{"x":7,"y":-0.088,"fill":"Inside band"},{"x":8,"y":-0.134,"fill":"Inside band"},{"x":9,"y":0.156,"fill":"Inside band"},{"x":10,"y":-0.059,"fill":"Inside band"},{"x":11,"y":-0.052,"fill":"Inside band"},{"x":12,"y":-0.115,"fill":"Inside band"},{"x":13,"y":0.060,"fill":"Inside band"},{"x":14,"y":0.004,"fill":"Inside band"},{"x":15,"y":0.037,"fill":"Inside band"},{"x":16,"y":-0.087,"fill":"Inside band"},{"x":17,"y":-0.028,"fill":"Inside band"},{"x":18,"y":0.019,"fill":"Inside band"}],"geoms":["bar"],"x":"lag","y":"pacf"}

This is the same reading as the MA(2) simulation, only cleaner: the ACF clears the band once and then stays quiet (setting aside one marginal bar close enough to the line to call noise), while the PACF drops inside the band right after lag 1 and never comes back out. An ACF that cuts off, a PACF that decays away, is an MA-looking signature, here suggesting q = 1.

=== step === quiz
## Quick check: reading a new pair

Someone hands you a description of a plot pair instead of the plot itself: the ACF decays slowly across many lags, and the PACF has two clear spikes, at lag 1 and lag 2, then drops inside the band from lag 3 on. What does that pair look like?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- MA(2): its ACF should cut off, not decay, so this reverses which plot cuts off. ::no
- White noise: a white noise series would keep both plots inside the band at every lag, not show two clear PACF spikes. ::no
- AR(2): a PACF that cuts off at lag 2 while the ACF keeps decaying is exactly the AR(p) signature, here with p = 2. ::ok Right. Decaying ACF, cutting-off PACF, is the AR(p) reading every time, and the lag where the PACF stops clearing the band names p directly, two spikes here.
- The series needs another difference: nothing about a lag pattern like this points at a leftover trend or season. ::no This pair is the AR(p) signature: ACF decays, PACF cuts off, here after two clear spikes, so p = 2. An MA(2) would show the opposite pairing, a cutting-off ACF and a decaying PACF. White noise would keep both plots inside the band throughout. And a pattern like this, in a series that has already had its trend and season removed, is about which lags it still depends on, not about whether it needs differencing.

=== step === tryit
## Your turn: read a series you have not seen scored yet

Build one more simulated series, this time an AR(1), and read off where its PACF stops mattering. Complete the line below with a call to `PACF()`, or to `gg_tsdisplay()` with `plot_type = "partial"`.

```r
# Build a new AR(1) series and find where its PACF stops mattering.
library(tsibble)
library(feasts)
library(dplyr)

set.seed(7)
ar1_y <- as.numeric(arima.sim(list(ar = 0.8), n = 100))
ar1 <- tsibble(t = 1:100, y = ar1_y, index = t)

# Complete this line: call PACF on ar1, or call gg_tsdisplay on ar1
# with plot_type set to partial. Press Check when you have it.

```
::check {"regex": "(PACF[(])|(gg_tsdisplay[(][\\s\\S]*plot_type[\\s\\S]*partial)", "gate": true, "difficulty": "intermediate", "ok": "Right: the PACF reads 0.790 at lag 1, then stays under the 0.2 band all the way through lag 10, a clean cutoff after lag 1.", "no": "Call PACF() on ar1 the same way you did for ar2, or run gg_tsdisplay(ar1, y, plot_type = \"partial\") for all three panels at once."}
::solution
```r
# Find where the PACF stops mattering for this new series
round((ar1 |> PACF(y, lag_max = 10))$pacf, 3)
#>  [1]  0.790 -0.100 -0.150 -0.034 -0.153  0.093 -0.050  0.004  0.035  0.115
```

With 100 values, the band is plus or minus 0.2. Only lag 1, at 0.790, clears it. Every value from lag 2 through lag 10, from -0.100 down to -0.153 and back up to 0.115, sits inside that band. That is a cutoff right after lag 1, the AR(1) signature, p = 1.

=== step === concept
## References

- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/), chapter 9, ARIMA models - Hyndman and Athanasopoulos, the source for `gg_tsdisplay()` and the ACF/PACF reading method taught here.
- [feasts package reference](https://pkg.robjhyndman.com/feasts/) - documentation for `ACF()`, `PACF()` and `gg_tsdisplay()`.
- Box, Jenkins and Reinsel, "Time Series Analysis: Forecasting and Control" - the original source of the ACF/PACF identification method.
- [R's AirPassengers dataset documentation](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/AirPassengers.html) (datasets package) - originally published in Box and Jenkins (1976).

=== step === complete
## What you can do now

You can explain what the PACF measures: the direct effect of a lag once every closer lag already sits in the same regression, with the indirect share the ACF still carries stripped back out.

You can read an ACF/PACF pair, or a single `gg_tsdisplay(plot_type = "partial")` panel, and name a series as AR(p)-like, PACF cuts off, ACF decays, or MA(q)-like, ACF cuts off, PACF decays, reading the cutoff lag straight off as the order.

You can run `PACF()` or `gg_tsdisplay()` on a series you have not seen scored, and read off the lag where it stops mattering.

Next, you will turn that same AR and MA reading straight into the p and q of an ARIMA model and fit it with `ARIMA()` in fable.

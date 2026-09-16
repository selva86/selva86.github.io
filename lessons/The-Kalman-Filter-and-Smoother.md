---
title: "State Space Models and the Kalman Filter Lesson 2: The predict-then-update loop inside the Kalman filter"
catalog_blurb: "Work the Kalman filter's predict and update steps by hand on real data."
description: "See the Kalman filter's predict and update steps worked by hand on the Nile river, watch the gain settle to a steady value, then smooth the whole series."
keywords: "Kalman filter, Kalman smoother, predict-update loop, Kalman gain, state space model, Nile dataset R, StructTS, Rauch-Tung-Striebel smoother, tsSmooth, local level model"
post_type: "LESSON"
curriculum_id: "5.80.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "2"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "Local-Level-and-Local-Linear-Trend-Models.html"
course_prev: "Why-State-Space-Models.html"
---

=== step === cover
## The predict-then-update loop inside the Kalman filter

Today let's open up the machinery that actually produces a state space model's numbers: the Kalman filter's predict step and its update step, worked by hand until you can run them on any new year yourself.

The example is Nile again, the river's annual flow at Aswan for a hundred years, 1871 to 1970, already fit as a local level model. That fit gives two numbers: one for how much the hidden level itself drifts from year to year, and one for how noisy any single year's reading is. Here is the whole series again, exactly as it happened.

::widget chart-plotter {"data":[{"x":1871,"y":1120},{"x":1872,"y":1160},{"x":1873,"y":963},{"x":1874,"y":1210},{"x":1875,"y":1160},{"x":1876,"y":1160},{"x":1877,"y":813},{"x":1878,"y":1230},{"x":1879,"y":1370},{"x":1880,"y":1140},{"x":1881,"y":995},{"x":1882,"y":935},{"x":1883,"y":1110},{"x":1884,"y":994},{"x":1885,"y":1020},{"x":1886,"y":960},{"x":1887,"y":1180},{"x":1888,"y":799},{"x":1889,"y":958},{"x":1890,"y":1140},{"x":1891,"y":1100},{"x":1892,"y":1210},{"x":1893,"y":1150},{"x":1894,"y":1250},{"x":1895,"y":1260},{"x":1896,"y":1220},{"x":1897,"y":1030},{"x":1898,"y":1100},{"x":1899,"y":774},{"x":1900,"y":840},{"x":1901,"y":874},{"x":1902,"y":694},{"x":1903,"y":940},{"x":1904,"y":833},{"x":1905,"y":701},{"x":1906,"y":916},{"x":1907,"y":692},{"x":1908,"y":1020},{"x":1909,"y":1050},{"x":1910,"y":969},{"x":1911,"y":831},{"x":1912,"y":726},{"x":1913,"y":456},{"x":1914,"y":824},{"x":1915,"y":702},{"x":1916,"y":1120},{"x":1917,"y":1100},{"x":1918,"y":832},{"x":1919,"y":764},{"x":1920,"y":821},{"x":1921,"y":768},{"x":1922,"y":845},{"x":1923,"y":864},{"x":1924,"y":862},{"x":1925,"y":698},{"x":1926,"y":845},{"x":1927,"y":744},{"x":1928,"y":796},{"x":1929,"y":1040},{"x":1930,"y":759},{"x":1931,"y":781},{"x":1932,"y":865},{"x":1933,"y":845},{"x":1934,"y":944},{"x":1935,"y":984},{"x":1936,"y":897},{"x":1937,"y":822},{"x":1938,"y":1010},{"x":1939,"y":771},{"x":1940,"y":676},{"x":1941,"y":649},{"x":1942,"y":846},{"x":1943,"y":812},{"x":1944,"y":742},{"x":1945,"y":801},{"x":1946,"y":1040},{"x":1947,"y":860},{"x":1948,"y":874},{"x":1949,"y":848},{"x":1950,"y":890},{"x":1951,"y":744},{"x":1952,"y":749},{"x":1953,"y":838},{"x":1954,"y":1050},{"x":1955,"y":918},{"x":1956,"y":986},{"x":1957,"y":797},{"x":1958,"y":923},{"x":1959,"y":975},{"x":1960,"y":815},{"x":1961,"y":1020},{"x":1962,"y":906},{"x":1963,"y":901},{"x":1964,"y":1170},{"x":1965,"y":912},{"x":1966,"y":746},{"x":1967,"y":919},{"x":1968,"y":718},{"x":1969,"y":714},{"x":1970,"y":740}],"geoms":["line"],"x":"year","y":"flow"}

That line is the raw material. Everything from here on opens up the loop that reads it one year at a time and turns each reading into a filtered estimate of where the level really is.

=== step === concept
## The two moves: predict, then update

Every year, the filter takes two moves in order, and both of them use only what came before: last year's estimate, and this year's fresh reading.

The predict step comes first. It carries last year's filtered estimate forward unchanged, since a local level model has no trend to add, and it inflates that estimate's variance by the state variance, usually written Q.

\[ a_{t|t-1} = a_{t-1|t-1} \]
\[ P_{t|t-1} = P_{t-1|t-1} + Q \]

Read \(a_{t|t-1}\) as "the estimate for year t, using data only up to year t minus 1": this year's prediction, built from last year's already-filtered estimate, \(a_{t-1|t-1}\). \(P_{t|t-1}\) is that prediction's own variance, how uncertain the predicted level is before this year's reading has even arrived. It grows by Q every year, because a level that is free to drift becomes a little less certain with every year that passes.

Then comes the update. It compares the new reading to what was predicted, and that gap gets its own name.

\[ v_t = y_t - a_{t|t-1} \]

\(v_t\) is called the innovation: literally, how much genuinely new information this year's reading carries over what the model already expected. A reading that lands exactly on the prediction has an innovation of 0, since it told the filter nothing it did not already know.

How much of that innovation gets folded into the estimate is set by a single number, the Kalman gain.

\[ K_t = \frac{P_{t|t-1}}{P_{t|t-1} + H} \]
\[ a_{t|t} = a_{t|t-1} + K_t v_t \]
\[ P_{t|t} = (1 - K_t) P_{t|t-1} \]

\(K_t\) is the predicted variance divided by itself plus H, the observation variance, so it always comes out between 0 and 1. The updated estimate, \(a_{t|t}\), is the prediction plus the gain times the innovation: a gain near 1 pulls the estimate almost all the way to the new reading, and a gain near 0 leaves it almost where it was predicted. The updated variance, \(P_{t|t}\), shrinks by that same factor, since a real reading was just used to sharpen the guess.

One diagram puts all three moves in the order they actually happen.

::widget process-flow {"steps":[{"title":"Predict","sub":"carry the previous estimate forward and add the state variance Q"},{"title":"Compare","sub":"take the innovation, the gap between the reading and the prediction"},{"title":"Update","sub":"blend the prediction and the reading, weighted by the gain"}]}

Every year of Nile's hundred, the filter does nothing but these three moves, over and over.

=== step === concept
## Working the loop by hand for 1871 to 1874

Fit the local level model on Nile first, so the loop above has real numbers to work with.

```r
# Fit the local level model on Nile and read off its two variances
fit <- StructTS(Nile, type = "level")
fit$coef
#>     level   epsilon 
#>  1469.147 15098.577 
```

`level` is Q, the state variance: 1469.147. `epsilon` is H, the observation variance: 15098.577. H is about ten times bigger than Q, and that ratio already says something about how the filter will behave: a single year's reading is far noisier than the level's own year-to-year drift, so the filter should end up leaning more on its own past estimate than on any one reading.

The filter also needs somewhere to start. Nothing at all is known about the level before 1871, so start diffuse: a0 = 1120, the first year's own reading, paired with an enormous starting variance, P0 = 10,000,000, standing in for "nothing is known yet."

Run the predict and update steps above by hand, one year at a time, for the first four years.

```r
# Filter 1871 to 1874 by hand, starting from a diffuse guess
Q <- unname(fit$coef["level"])
H <- unname(fit$coef["epsilon"])
y <- as.numeric(window(Nile, end = 1874))

a0 <- 1120
P0 <- 1e7

a_pred <- numeric(4); gain <- numeric(4); a_filt <- numeric(4); innov <- numeric(4)
a_prev <- a0
P_prev <- P0

for (t in 1:4) {
  a_pred[t] <- a_prev
  P_pred    <- P_prev + Q
  innov[t]  <- y[t] - a_pred[t]
  gain[t]   <- P_pred / (P_pred + H)
  a_filt[t] <- a_pred[t] + gain[t] * innov[t]
  P_prev    <- (1 - gain[t]) * P_pred
  a_prev    <- a_filt[t]
}

data.frame(year = 1871:1874, y = y, a_pred = round(a_pred, 3),
           gain = round(gain, 4), a_filt = round(a_filt, 3))
#>   year    y   a_pred   gain   a_filt
#> 1 1871 1120 1120.000 0.9985 1120.000
#> 2 1872 1160 1120.000 0.5229 1140.914
#> 3 1873  963 1140.914 0.3828 1072.813
#> 4 1874 1210 1072.813 0.3244 1117.311
```

1871 predicts 1120, the diffuse starting guess itself, since there is nothing else yet for a_prev to carry forward. Its gain comes out at 0.9985, almost 1, because the predicted variance is still close to that enormous 10,000,000: with essentially nothing known, the update hands nearly the whole estimate over to the first reading, so the filtered level lands right back on 1120.

1872 predicts 1120 again, since this year's prediction is simply last year's filtered estimate. The reading comes in at 1160, an innovation of 40, and the gain has already fallen to 0.5229, because one year of filtering has shrunk the predicted variance a good deal. The filtered level splits the difference at 1140.914, about halfway between the prediction and the reading.

By 1873 the gain is down to 0.3828, and by 1874 to 0.3244. The predicted variance keeps shrinking every year while H stays fixed at 15098.577, and since the gain is the predicted variance divided by itself plus H, it keeps falling right along with it.

=== step === quiz
## Quick check: reading the predict-update loop

1871's gain came out at 0.9985. 1873's came out at 0.3828, less than half as large, using the exact same Q and H both years. What made the two gains so different?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The gain depends on how big that year's new reading was. ::no
- The predicted variance started enormous in 1871, since nothing was known yet, and shrank fast as two more years of readings were folded into it; the gain fell right along with it. ::ok Exactly. The gain is the predicted variance divided by itself plus H, and H never changes, so a shrinking predicted variance is the whole story.
- The gain is fixed by Q and H alone, and never changes from year to year. ::no Both of the other answers reach for the wrong lever: the size of one particular reading, or a gain that supposedly never moves. What actually changes the gain, year to year, is the predicted variance: enormous in 1871 because the diffuse start assumed nothing, and much smaller by 1873 after two more years of updates had already sharpened the estimate. H stays fixed at 15098.577 the whole time, so a falling predicted variance is the entire reason the gain falls with it.

=== step === concept
## Running the loop across all hundred years

The same three moves, run once for every year Nile has, are exactly the loop above, just extended from 4 years to 100.

```r
# Run the predict-update loop across all 100 Nile years
y_full <- as.numeric(Nile)
n <- length(y_full)

a_pred_all <- numeric(n); P_pred_all <- numeric(n)
a_filt_all <- numeric(n); P_filt_all <- numeric(n)
gain_all   <- numeric(n)

a_prev <- a0
P_prev <- P0

for (t in 1:n) {
  a_pred_all[t] <- a_prev
  P_pred_all[t] <- P_prev + Q
  gain_all[t]   <- P_pred_all[t] / (P_pred_all[t] + H)
  a_filt_all[t] <- a_pred_all[t] + gain_all[t] * (y_full[t] - a_pred_all[t])
  P_filt_all[t] <- (1 - gain_all[t]) * P_pred_all[t]
  a_prev <- a_filt_all[t]
  P_prev <- P_filt_all[t]
}

round(gain_all[1:6], 4)
#> [1] 0.9985 0.5229 0.3828 0.3244 0.2966 0.2826
round(c(`1885` = gain_all[15], `1970` = gain_all[100]), 4)
#>   1885   1970 
#> 0.2671 0.2671 
```

The first six gains match the four already worked by hand, plus two more: 0.2966 for 1875 and 0.2826 for 1876. The fall keeps going for a few more years, then it stops. By 1885, the fifteenth year, the gain has settled at 0.2671, and it stays there, unchanged, all the way out to 1970, the last year of the series.

See that fall and that flat stretch as one picture.

```r
# Plot the Kalman gain across all 100 years
plot(1871:1970, gain_all, type = "l", xlab = "year", ylab = "Kalman gain",
     main = "The gain falls fast, then holds steady")
```

The gain settles because two forces reach a balance. Every year, the predict step adds Q to the variance, which pushes the gain up. But the update step then shrinks the variance back down by a factor of 1 minus the gain, which pushes it down again. Once those two effects cancel exactly, the variance stops moving from one year to the next, and so does the gain.

That balance point is the variance P that solves this equation.

\[ P = \frac{(P + Q)H}{P + Q + H} \]

In words: the variance at which one more year of drift, added by the predict step, is exactly cancelled out by one more year of sharpening against a noisy reading. Once P stops moving, the gain, built entirely from P, H and Q, stops moving too.

=== step === widget
## The gain as the weight between prediction and new reading

The update formula, \(a_{t|t} = a_{t|t-1} + K_t v_t\), the prediction plus the gain times the gap to the new reading, is really a weighted average written in a different shape: \((1 - K_t)\) of the prediction plus \(K_t\) of the reading itself. That is exactly what a Bayesian update does with a prior belief and new evidence, and the widget below shows it directly.

This widget carries its own numbers, not Nile's: a prior mean of 0 and a data average of 3, built from 10 readings, kept small so the two curves are easy to read on one screen. The arithmetic behind it is identical to the update step above: blend a prior belief with new evidence, weighted by how much you trust each one.

::widget bayes-update {}

Drag the prior confidence slider toward its high end and the prior curve spreads out wide: the posterior slides most of the way toward the data average, the same way a gain of 0.9985 let 1871's reading almost overwrite the diffuse starting guess. Drag it toward its low end and the prior narrows into a tight, confident spike: the posterior barely leaves the prior mean, the way the steady gain of 0.2671 only just nudges the level once many years have already been filtered.

The posterior mean in the middle of the screen is playing exactly the role \(a_{t|t}\) plays in the filter: a blend of the existing estimate and the newest reading, weighted by a number between 0 and 1.

=== step === concept
## Filtering uses only past data; smoothing uses the whole series

Every filtered level produced so far only ever used data up to that year. 1896's filtered level never saw 1897, 1898, or any year after. That is the definition of filtering: an estimate that only looks backward in time.

Smoothing asks a different question: given the entire hundred years, what is the best estimate of 1896's level? To answer it, run the same recursion a second time, backward, once the forward pass has finished filtering every year. This backward pass is called the Rauch-Tung-Striebel smoother.

\[ J_t = \frac{P_{t|t}}{P_{t+1|t}} \]
\[ \tilde a_t = a_{t|t} + J_t \left( \tilde a_{t+1} - a_{t+1|t} \right) \]

\(J_t\) is the smoother gain: how much of the difference between next year's smoothed estimate and next year's prediction gets folded back into this year's own estimate. \(\tilde a_t\) is the smoothed level for year t, this year's filtered estimate nudged by what the years after it turned out to say.

Run that backward pass over the arrays the forward loop already filled in, starting from the last year and working back to the first.

```r
# Smooth every year with the Rauch-Tung-Striebel backward pass
a_smooth <- numeric(n)
a_smooth[n] <- a_filt_all[n]

for (t in (n - 1):1) {
  J <- P_filt_all[t] / P_pred_all[t + 1]
  a_smooth[t] <- a_filt_all[t] + J * (a_smooth[t + 1] - a_pred_all[t + 1])
}

years <- 1871:1970
idx <- which(years %in% 1896:1900)
data.frame(year = years[idx], filtered = round(a_filt_all[idx], 3),
           smoothed = round(a_smooth[idx], 3))
#>   year filtered smoothed
#> 1 1896 1187.169 1078.182
#> 2 1897 1145.196 1038.472
#> 3 1898 1133.126  999.586
#> 4 1899 1037.220  950.929
#> 5 1900  984.551  919.488
```

Look at 1898. Filtered, using only data up to that year, it reads 1133.126. Smoothed, using the whole series, it reads 999.586, well over 100 lower. The years right after 1898, 1899's reading of 774 and 1900's reading of 840, both sit a long way under the level the filtered estimate still carried at the time, and the smoother lets those later, lower readings pull 1898's own estimate down to match, something the filtered estimate could never do, since those readings were not yet included in it.

See that same gap between filtered and smoothed as a picture, over a wider stretch of years.

::widget chart-plotter {"data":[{"x":1885,"y":1020,"fill":"Raw reading"},{"x":1886,"y":960,"fill":"Raw reading"},{"x":1887,"y":1180,"fill":"Raw reading"},{"x":1888,"y":799,"fill":"Raw reading"},{"x":1889,"y":958,"fill":"Raw reading"},{"x":1890,"y":1140,"fill":"Raw reading"},{"x":1891,"y":1100,"fill":"Raw reading"},{"x":1892,"y":1210,"fill":"Raw reading"},{"x":1893,"y":1150,"fill":"Raw reading"},{"x":1894,"y":1250,"fill":"Raw reading"},{"x":1895,"y":1260,"fill":"Raw reading"},{"x":1896,"y":1220,"fill":"Raw reading"},{"x":1897,"y":1030,"fill":"Raw reading"},{"x":1898,"y":1100,"fill":"Raw reading"},{"x":1899,"y":774,"fill":"Raw reading"},{"x":1900,"y":840,"fill":"Raw reading"},{"x":1901,"y":874,"fill":"Raw reading"},{"x":1902,"y":694,"fill":"Raw reading"},{"x":1903,"y":940,"fill":"Raw reading"},{"x":1904,"y":833,"fill":"Raw reading"},{"x":1905,"y":701,"fill":"Raw reading"},{"x":1885,"y":1047.1,"fill":"Filtered level"},{"x":1886,"y":1023.9,"fill":"Filtered level"},{"x":1887,"y":1065.6,"fill":"Filtered level"},{"x":1888,"y":994.4,"fill":"Filtered level"},{"x":1889,"y":984.7,"fill":"Filtered level"},{"x":1890,"y":1026.1,"fill":"Filtered level"},{"x":1891,"y":1045.9,"fill":"Filtered level"},{"x":1892,"y":1089.7,"fill":"Filtered level"},{"x":1893,"y":1105.8,"fill":"Filtered level"},{"x":1894,"y":1144.3,"fill":"Filtered level"},{"x":1895,"y":1175.2,"fill":"Filtered level"},{"x":1896,"y":1187.2,"fill":"Filtered level"},{"x":1897,"y":1145.2,"fill":"Filtered level"},{"x":1898,"y":1133.1,"fill":"Filtered level"},{"x":1899,"y":1037.2,"fill":"Filtered level"},{"x":1900,"y":984.6,"fill":"Filtered level"},{"x":1901,"y":955,"fill":"Filtered level"},{"x":1902,"y":885.3,"fill":"Filtered level"},{"x":1903,"y":899.9,"fill":"Filtered level"},{"x":1904,"y":882.1,"fill":"Filtered level"},{"x":1905,"y":833.7,"fill":"Filtered level"},{"x":1885,"y":1040.3,"fill":"Smoothed level"},{"x":1886,"y":1037.9,"fill":"Smoothed level"},{"x":1887,"y":1043,"fill":"Smoothed level"},{"x":1888,"y":1034.8,"fill":"Smoothed level"},{"x":1889,"y":1049.5,"fill":"Smoothed level"},{"x":1890,"y":1073.1,"fill":"Smoothed level"},{"x":1891,"y":1090.2,"fill":"Smoothed level"},{"x":1892,"y":1106.4,"fill":"Smoothed level"},{"x":1893,"y":1112.4,"fill":"Smoothed level"},{"x":1894,"y":1114.8,"fill":"Smoothed level"},{"x":1895,"y":1104.1,"fill":"Smoothed level"},{"x":1896,"y":1078.2,"fill":"Smoothed level"},{"x":1897,"y":1038.5,"fill":"Smoothed level"},{"x":1898,"y":999.6,"fill":"Smoothed level"},{"x":1899,"y":950.9,"fill":"Smoothed level"},{"x":1900,"y":919.5,"fill":"Smoothed level"},{"x":1901,"y":895.8,"fill":"Smoothed level"},{"x":1902,"y":874.2,"fill":"Smoothed level"},{"x":1903,"y":870.1,"fill":"Smoothed level"},{"x":1904,"y":859.3,"fill":"Smoothed level"},{"x":1905,"y":851,"fill":"Smoothed level"}],"geoms":["line"],"x":"year","y":"flow"}

The raw readings jump around every year. The filtered line follows them fairly closely, since it only ever reacts to what has already happened. The smoothed line is calmer still, and for most of these years it sits below the filtered line, because the lower readings that keep coming in all the way out to 1905 are already folded into it.

Check the hand-rolled smoother against R's own smoother for this model, `tsSmooth()`.

```r
# Compare the hand-rolled smoother against tsSmooth()
sm_full <- tsSmooth(fit)
round(window(sm_full[, "level"], start = 1896, end = 1900), 3)
#> Time Series:
#> Start = 1896 
#> End = 1900 
#> Frequency = 1 
#> [1] 1078.182 1038.472  999.586  950.929  919.488
```

Every one of those five numbers matches the hand-rolled smoothed levels exactly. `tsSmooth()` runs the same backward pass just worked through by hand; it was only run in the open this time, one year at a time, instead of hidden inside a single function call.

=== step === quiz
## Quiz: filtering versus smoothing

1898's filtered level and its smoothed level told two different stories, both correct, both about the exact same year. What actually explains the difference?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Smoothing uses a bigger gain than filtering, which is why its estimate lands somewhere else. ::no
- Smoothing revises every year's estimate using later readings too, the same weighted blend the gain widget just showed, only run again backward through the series. ::ok Right. Filtering only ever asks what was known up to that year. Smoothing asks the same question with the whole series in hand, and answers it with the identical predict-update arithmetic, just run once forward and once backward.
- Filtering is wrong, and smoothing is the corrected version of the same estimate. ::no Smoothing does not correct a mistake. Filtering answers a real, different question: what does the estimate look like using only that year's data and earlier? Smoothing answers what the estimate looks like with every year in hand. Both estimates are correct answers to their own question, and the gain does not get bigger for smoothing; the same weighted-blend arithmetic just runs backward as well as forward.

=== step === tryit
## Your turn: filter one more year by hand

1875's own filtered level and variance work out to 1129.973 and 4478.225, computed the exact same way as the four years worked by hand earlier. Q and H are still sitting in this page's own session. Filter 1876 as well, given that year's real reading, 1160.

```r
# Continue the hand loop one more year: filter 1876
a_filt_1875 <- 1129.973
P_filt_1875 <- 4478.225
y_1876 <- 1160

# Using Q and H already defined on this page, compute:
#   P_pred      the predicted variance for 1876
#   gain        the Kalman gain for 1876
#   a_filt_1876 the filtered level for 1876
# Three lines. Press Check when you have them.
```
::check {"regex": "P_filt_1875\\s*[+]\\s*Q[\\s\\S]*\\/[\\s\\S]*[+]\\s*H", "gate": true, "difficulty": "intermediate", "ok": "Right: a predicted level of 1129.973 (the level does not move in the predict step), a gain of 0.2826, and a filtered level of 1138.458. The gain keeps easing down from 0.2966 in 1875, on its way toward the steady 0.2671 it reaches by 1885.", "no": "Compute the predicted variance the same way the earlier years did it: P_filt_1875 + Q. Then the gain: that predicted variance divided by itself plus H. Then blend: a_pred + gain * (y_1876 - a_pred)."}
::solution
```r
# Filter 1876 from 1875's own filtered level and variance
P_pred      <- P_filt_1875 + Q
gain        <- P_pred / (P_pred + H)
a_pred      <- a_filt_1875
a_filt_1876 <- a_pred + gain * (y_1876 - a_pred)

round(c(a_pred = a_pred, gain = gain, a_filt_1876 = a_filt_1876), 4)
#>      a_pred        gain a_filt_1876 
#>   1129.9730      0.2826   1138.4583 
```

=== step === concept
## References

- Durbin, J. and Koopman, S.J. (2001), *Time Series Analysis by State Space Methods*, Oxford University Press. The standard reference for the predict and update recursions used in this lesson.
- Harvey, A.C. (1989), *Forecasting, Structural Time Series Models and the Kalman Filter*, Cambridge University Press. Derives the predict and update equations for the local level model.
- Rauch, H.E., Tung, F. and Striebel, C.T. (1965), "Maximum Likelihood Estimates of Linear Dynamic Systems," *AIAA Journal* 3(8), 1445-1450. The original fixed-interval smoother behind the backward pass.
- [R documentation for `StructTS`](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/StructTS.html) (stats package). Confirms the `type = "level"` fit and the `level` and `epsilon` coefficient names used throughout.
- [R documentation for `tsSmooth`](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/tsSmooth.html) (stats package). Documents the smoother whose output matches the hand-rolled backward pass in this lesson exactly.
- [R documentation for the `Nile` dataset](https://stat.ethz.ch/R-manual/R-patched/library/datasets/html/Nile.html) (datasets package). Confirms the 1871-1970 span and units used as the running example.

=== step === complete
## What you can do now

You can now run the Kalman filter's predict step and update step by hand for any year: carry the estimate forward and add Q, compare the new reading to that prediction to get the innovation, then blend the two by the gain, the predicted variance over itself plus H.

You have watched that gain fall fast at the start, from 0.9985 in 1871 down to a steady 0.2671 by 1885, because the update step shrinks the variance faster than the predict step's own drift, Q, can add it back. And you have seen the gain reappear as the exact same weighted blend a Bayesian update makes between a prior belief and new evidence.

You have also filtered and smoothed the same series and watched them disagree on purpose: filtering only ever uses data up to that year, smoothing uses the whole series by running the identical recursion backward, and both hand-rolled results matched `StructTS()` and `tsSmooth()` exactly.

Next, you will meet a second state space model built from this same predict-update loop, one with a trend riding on top of the level, and see how the two compare once the level alone is no longer enough.

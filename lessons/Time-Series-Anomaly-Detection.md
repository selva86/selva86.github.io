---
title: "Anomaly Detection Lesson 5: Time-Series Anomaly Detection"
description: "Detect anomalies in a time series in R: point, contextual and collective outliers, a robust rolling median and MAD control band, and STL decomposition residuals."
keywords: "time series anomaly detection, point contextual collective outliers, rolling median MAD control band, STL decomposition, seasonal anomaly, remainder residuals, R"
mathjax: true
webr: true
curriculum_id: "6.200.5"
post_type: "LESSON"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "5"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Kernel-PCA-Sparse-PCA-and-NMF.html"
course_prev: "Autoencoders-for-Anomaly-Detection.html"
lesson_access: "pro"
catalog_blurb: "Spot the day that breaks a series once its rhythm is accounted for."
---

=== step === cover
::eyebrow Lesson 5 of 7
## Time-Series Anomaly Detection

Every detector so far, from the isolation forest to the autoencoder, judged each point on its own: it looked at a data point's features and asked "does this sit where normal points sit?" Order did not matter; you could shuffle the rows and nothing changed. This lesson breaks that assumption. Here the data arrives in time order, and **when** a value happens is part of what makes it normal or not.

Follow one running example: **Rosa's bakery** takes online orders, and Rosa has 16 weeks of daily order counts. Business is growing, weekends are busy, midweek is quiet. Against that steady rhythm, three strange things happen: one Wednesday a post goes viral, one Saturday a snowstorm empties the town, and one week the oven breaks. Each is a different KIND of anomaly, and by the end you will catch all three, in a few lines of base R.

By the end of this lesson you will be able to:

- Tell the three kinds of time-series anomaly apart: **point**, **contextual**, and **collective**
- Explain why a single flat "mean plus or minus three standard deviations" band is the wrong tool for a series with a trend and a weekly rhythm
- Build a robust **rolling median / MAD control band** and use it to flag point anomalies
- Strip out trend and seasonality with **STL decomposition** and flag the leftover **remainder**, catching the contextual and collective anomalies the band misses
- Score a detector by **precision and recall** (not accuracy), and tell a one-off anomaly from lasting **drift**

**Prerequisites:** you can run R and read base R (indexing, `which`, `sapply`, a `data.frame`); you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (the base-rate trap, why accuracy is the wrong score) and the four point-by-point detectors up to [Lesson 4: Autoencoders](Autoencoders-for-Anomaly-Detection.html). Time series, trend, seasonality and the modified z-score are all defined here from scratch.

::widget chart-plotter {"data":[{"x":1,"y":49},{"x":2,"y":45},{"x":3,"y":58},{"x":4,"y":54},{"x":5,"y":62},{"x":6,"y":85},{"x":7,"y":80},{"x":8,"y":51},{"x":9,"y":47},{"x":10,"y":60},{"x":11,"y":56},{"x":12,"y":64},{"x":13,"y":88},{"x":14,"y":83},{"x":15,"y":52},{"x":16,"y":48},{"x":17,"y":168},{"x":18,"y":57},{"x":19,"y":65},{"x":20,"y":89},{"x":21,"y":84},{"x":22,"y":54},{"x":23,"y":50},{"x":24,"y":61},{"x":25,"y":58},{"x":26,"y":66},{"x":27,"y":90},{"x":28,"y":85}],"geoms":["line","point"],"x":"day","y":"orders"}

=== step === concept
::eyebrow The idea
## Meet Rosa's series

A **time series** is just a value measured at regular time steps, in order: here, the number of online orders on each of 112 consecutive days. Two patterns run underneath it, and naming them now is what lets us spot the odd days later.

- **Trend:** a slow drift in the overall level. Rosa's bakery is getting more popular, so the baseline climbs gently over the 16 weeks.
- **Seasonality:** a pattern that repeats on a fixed cycle. Rosa's cycle is weekly: quiet Monday to Friday, busy on the weekend. Every seven days the shape repeats.

Each lesson runs in a fresh R session, so let us build Rosa's series right here (run this once). We plant the three anomalies now and study them for the rest of the lesson.

```r
set.seed(20)
day    <- 1:112                                    # 16 weeks of daily online orders
dow    <- ((day - 1) %% 7) + 1                      # day of week: 1 = Mon, ..., 6 = Sat, 7 = Sun
season <- c(-8, -12, -9, -5, 3, 28, 23)[dow]        # weekly rhythm: quiet midweek, busy weekend
trend  <- 52 + 0.18 * day                           # slow, steady growth
orders <- round(trend + season + rnorm(112, 0, 4))  # the normal series, plus small noise

# now plant three anomalies of three different kinds:
orders[45]    <- 175                 # a Wednesday: a post goes viral        (point)
orders[76]    <- 33                  # a Saturday buried by a snowstorm      (contextual)
orders[92:98] <- orders[92:98] - 30  # the oven broke for a whole week       (collective)

bakery <- data.frame(day, dow, orders)
head(bakery)
#>   day dow orders
#> 1   1   1     49
#> 2   2   2     38
#> 3   3   3     51
#> 4   4   4     42
#> 5   5   5     54
#> 6   6   6     83
```

Look at the first week: the count creeps up Monday to Friday, then jumps to 83 on Saturday (day 6). That weekend jump is the seasonality. Plot the whole series and you can see both patterns at once: the gentle upward slope (trend) and the repeating weekend spikes (seasonality).

```r
plot(day, orders, type = "l", col = "grey55",
     xlab = "day", ylab = "orders", main = "Rosa's daily online orders, 16 weeks")
points(day, orders, pch = 16, cex = 0.5, col = "grey30")
```

One point towers over everything (the viral Wednesday). The other two anomalies are hiding in plain sight, and finding them is the whole job.

=== step === concept
::eyebrow The three kinds
## Point, contextual, and collective

Not all anomalies look the same, and the differences decide which tool you need. There are three kinds, and Rosa's series has one of each.

- A **point anomaly** is a single value that is extreme against the whole series. Day 45's 175 orders is far above anything else, on any day of the week. You could spot it with your eyes shut.
- A **contextual anomaly** is a value that is perfectly ordinary *in general* but wrong *for its moment*. Day 76's 33 orders would be a fine Tuesday, but it lands on a Saturday, when Rosa normally does about 90. It is only anomalous **in its weekly context**.
- A **collective anomaly** is a stretch of points that is unremarkable one day at a time but jointly wrong as a run. Days 92 to 98 are each a bit low; together they form a week-long slump (the broken oven) that no single day announces.

The plot below colours each kind. Notice how obvious the point anomaly is and how quietly the other two sit inside the normal range.

```r
kind <- rep("normal", 112)
kind[45] <- "point"; kind[76] <- "contextual"; kind[92:98] <- "collective"
cols <- c(normal = "grey70", point = "#d1495b",
          contextual = "#2e7d5b", collective = "#e8a13a")
plot(day, orders, type = "l", col = "grey80", xlab = "day", ylab = "orders")
points(day, orders, pch = 16, cex = 1.1, col = cols[kind])
legend("topleft", legend = names(cols), col = cols, pch = 16, bty = "n")
```

[KEY INSIGHT]
The point anomaly stands out against the whole series; the contextual and collective anomalies only stand out once you know the expected level for that day of the week. That single distinction drives the whole lesson: to catch the last two, you must first model the rhythm and then look at what is left over.

=== step === quiz
::eyebrow Check yourself
## Which kind is the snowstorm Saturday?

Day 76 has 33 orders. On a weekday, 33 orders would be completely ordinary, well inside Rosa's normal midweek range. But day 76 is a Saturday, when she usually does about 90. Which kind of anomaly is it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A point anomaly: 33 is simply an extreme value that stands out against the whole series ::no On its own, 33 is not extreme at all; plenty of quiet weekdays sit near it. A point anomaly would be far from every other value regardless of the day. This one is only wrong for its day of the week.
- A contextual anomaly: 33 is a fine weekday number but far too low for a busy Saturday, so it is only anomalous in its time-of-week context ::ok Exactly. The value is normal in general and wrong only for its context (a Saturday). That is the defining feature of a contextual anomaly, and it is invisible until you account for the weekly rhythm.
- A collective anomaly: it is part of a run of days that are jointly unusual ::no A collective anomaly is a stretch of consecutive points (like the broken-oven week). Day 76 is a single isolated day, so it does not qualify.

=== step === concept
::eyebrow The obvious tool, and why it fails
## One flat band flags only the spike

The instinct from earlier lessons is a **control band**: compute the mean and standard deviation, then flag anything more than three standard deviations away. Write \(\bar{x}\) for the mean of all the orders and \(s\) for their standard deviation; the band is \(\bar{x} \pm 3s\), and you flag any day outside it. Let us try it.

```r
gmean <- mean(orders)
gsd   <- sd(orders)
band  <- c(lower = gmean - 3 * gsd, upper = gmean + 3 * gsd)
round(c(mean = gmean, sd = gsd, band), 1)
#>  mean    sd lower upper
#>  63.9  21.2   0.3 127.5
which(orders > band["upper"] | orders < band["lower"])   # what the flat band flags
#> [1] 45
```

The band is a single horizontal pair of lines from 0.3 to 127.5, and it catches exactly one day: the viral Wednesday. It misses the snowstorm Saturday (33 is comfortably above the lower line of 0.3) and the whole broken-oven week. Two reasons it fails:

- **Wrong shape.** A flat band ignores the trend and the weekly rhythm entirely. It cannot know that 33 is fine on a Tuesday but alarming on a Saturday, because it holds one threshold for every day.
- **A fragile yardstick.** That single 175-order spike inflated \(s\) to 21.2, widening the band so much that the genuinely low Saturday hides inside it. This is the same masking trap you met with the plain z-score: one big outlier swells the spread and hides the others.

We need a band that **moves with the series** and a scale that **one spike cannot inflate**.

=== step === concept
::eyebrow A band that moves
## The rolling median / MAD control band

Fix both problems at once by making the band **local** and **robust**.

- **Local:** instead of one global mean, use a rolling window. For each day, take the **median** of the orders in a window around it. The median of a two-week window tracks the trend and slides up as the baseline climbs, so the band follows the series instead of sitting flat.
- **Robust:** measure the local spread with the **MAD** (median absolute deviation), the median of the distances from the local median. A single spike creates one large distance, and the median of the distances ignores it, so the scale stays honest.

Put them together into a **local modified z-score**. For day \(t\), let \(m_t\) be the median of the window around it and \(\mathrm{MAD}_t\) the MAD of that window. The score is

\( M_t = \dfrac{x_t - m_t}{\mathrm{MAD}_t} \)

R's `mad()` already multiplies by the constant \(1.4826\), which puts \(\mathrm{MAD}_t\) on the same footing as a standard deviation for bell-shaped data, so \(M_t\) reads like an ordinary z-score and the usual cut-off is \(|M_t| > 3.5\). Let us build it.

```r
k <- 15                                             # a two-week window (odd, as runmed needs)
h <- (k - 1) / 2
n <- length(orders)
center   <- as.numeric(runmed(orders, k))           # local median: a robust trend line
roll_mad <- sapply(seq_len(n), function(i) {
  lo <- max(1, i - h); hi <- min(n, i + h)
  mad(orders[lo:hi])                                # local spread, robust to a spike
})
mz <- (orders - center) / roll_mad                  # local modified z-score
flag_roll <- which(abs(mz) > 3.5)
flag_roll
#> [1]  45 104
round(mz[c(45, 76, 95)], 2)                         # point, contextual, mid-slump
#> [1]  8.99 -1.66 -1.50
```

The point spike screams at \(M = 8.99\) and is flagged. But look at the other two: the snowstorm Saturday scores only \(-1.66\) and the middle of the broken-oven week only \(-1.50\), both comfortably inside the band. The band even flags day 104, an ordinary busy Saturday that happened to poke through: a false alarm. Plot it to see the band hug the series while missing the quiet anomalies.

```r
plot(day, orders, type = "l", col = "grey55", xlab = "day", ylab = "orders")
lines(day, center + 3.5 * roll_mad, col = "#3b6ea5", lty = 2)   # upper band
lines(day, center - 3.5 * roll_mad, col = "#3b6ea5", lty = 2)   # lower band
points(day[flag_roll], orders[flag_roll], pch = 16, col = "#d1495b")
```

=== step === tryit
::eyebrow Your turn
## Make the local scale robust

The rolling band's power comes entirely from measuring the local spread with a scale that a spike cannot inflate. Fill in that robust scale (the median absolute deviation) and confirm it flags the point spike.

```r
center   <- as.numeric(runmed(orders, 15))          # local median
roll_mad <- sapply(seq_len(112), function(i) {
  lo <- max(1, i - 7); hi <- min(112, i + 7)
  ____(orders[lo:hi])                               # a local spread one spike cannot inflate
})
mz <- (orders - center) / roll_mad
which(abs(mz) > 3.5)
```
::check {"regex":"mad\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. mad() is the robust local scale; the band flags day 45 (the viral spike) and day 104 (a busy Saturday false alarm), but never the quiet contextual and collective anomalies.","no":"Use mad(), the median absolute deviation: mad(orders[lo:hi]) is the local spread that a single spike cannot inflate."}
::solution
```r
center   <- as.numeric(runmed(orders, 15))
roll_mad <- sapply(seq_len(112), function(i) {
  lo <- max(1, i - 7); hi <- min(112, i + 7)
  mad(orders[lo:hi])
})
mz <- (orders - center) / roll_mad
which(abs(mz) > 3.5)
#> [1]  45 104
```

=== step === concept
::eyebrow The limit
## What the moving band cannot see

The rolling band is genuinely useful: it is the right, simple tool for **point** anomalies on a trending series, and unlike the flat band its scale is not wrecked by the spike. But list what it actually caught against the nine days we know are anomalous, and the gap is stark.

```r
planted <- c(45, 76, 92:98)     # the days we planted: viral, snowstorm, broken-oven week
flag_roll                       # what the moving band flagged
#> [1]  45 104
setdiff(planted, flag_roll)     # real anomalies the band missed
#> [1] 76 92 93 94 95 96 97 98
```

It missed eight of the nine, for two reasons that both trace back to seasonality:

- **The contextual Saturday hides.** The window around day 76 mixes quiet weekdays and busy weekends, so the local MAD is large. Measured against that wide local spread, a low Saturday looks unremarkable. The band has no idea that Saturdays "should" be high.
- **The collective slump masks itself.** As the rolling median passes through the broken-oven week, it is dragged down toward the low values, so the band sinks with the slump and the low days sit inside it. A sustained anomaly quietly redefines its own "normal."

The fix is to stop fighting the seasonality and instead **model it explicitly**, subtract it out, and look only at what is left.

=== step === concept
::eyebrow Split the series
## STL: trend plus seasonal plus remainder

**STL** (Seasonal-Trend decomposition using Loess) splits a series into three added-up parts. Writing \(y_t\) for the orders on day \(t\):

\( y_t = T_t + S_t + R_t \)

- \(T_t\) is the **trend**: the slow-moving level (Rosa's growth).
- \(S_t\) is the **seasonal** part: the repeating weekly shape (the weekend lift, the midweek dip).
- \(R_t\) is the **remainder**: everything trend and season do not explain. On a normal day it is small noise. On an anomalous day it is large, because trend and season have already accounted for what the day *should* have been.

That is the whole trick: once the expected level and weekly shape are removed, an anomaly has nowhere to hide. Fit it in one call. The arguments matter, so read the comments:

```r
series <- ts(orders, frequency = 7)     # tell R the season repeats every 7 days
fit <- stl(series,
           s.window = "periodic",       # one fixed weekly shape, learned from all weeks
           t.window = 41,               # a stiff trend, so a week-long dip is NOT smoothed away
           robust = TRUE)               # down-weight outliers so they do not distort the fit
plot(fit)                               # trend, seasonal and remainder, stacked
```

Two choices earn their keep. `robust = TRUE` stops the viral spike from bending the trend around it. And a deliberately stiff `t.window = 41` keeps the trend from chasing the broken-oven week: a flexible trend would bend down into that dip, absorb it, and leave nothing in the remainder. Stiffen the trend and the whole slump stays where we can see it.

=== step === concept
::eyebrow The payoff
## Flag the remainder

Now apply the same robust rule as before, but to the **remainder** instead of the raw orders. Because the remainder has the trend and weekly shape removed, it is roughly flat noise, and every kind of anomaly shows up as a large residual.

```r
remainder <- as.numeric(fit$time.series[, "remainder"])
rz <- (remainder - median(remainder)) / mad(remainder)   # modified z on the remainder
flag_stl <- which(abs(rz) > 3.5)
flag_stl
#> [1] 45 76 92 93 94 95 96 97 98
round(rz[c(45, 76, 95)], 1)                              # point, contextual, mid-slump
#> [1]  35.5 -17.7  -8.8
```

All nine anomalous days, and only those days, are flagged. The contextual Saturday that the rolling band scored a sleepy \(-1.66\) now scores \(-17.7\). Here is exactly why:

```r
c(orders    = orders[76],
  seasonal  = as.numeric(round(fit$time.series[76, "seasonal"], 1)),
  trend     = as.numeric(round(fit$time.series[76, "trend"], 1)),
  remainder = round(remainder[76], 1))
#>    orders  seasonal     trend remainder
#>      33.0      26.6      68.7     -62.3
```

STL expected this Saturday to sit at trend plus season, \(68.7 + 26.6 \approx 95\) orders. It saw 33. The 62-order shortfall lands entirely in the remainder, and a 62-order miss on a series whose normal noise is a handful of orders is enormous. The collective slump surfaces the same way: with the trend held stiff, each broken-oven day carries its full 30-order shortfall into the remainder, so the whole week is flagged, not just its edges.

=== step === tryit
::eyebrow Your turn
## Model the season, then look at what is left

Reproduce the STL detector. The one argument that makes it a *seasonal* decomposition is `s.window`; set it so STL learns a single repeating weekly shape from all the weeks.

```r
fit <- stl(ts(orders, frequency = 7),
           s.window = ____,               # learn ONE repeating weekly shape
           t.window = 41, robust = TRUE)
rem <- fit$time.series[, "remainder"]
which(abs((rem - median(rem)) / mad(rem)) > 3.5)
```
::check {"regex":"periodic","gate":true,"difficulty":"intermediate","ok":"Right. s.window = \"periodic\" locks one weekly shape across all 16 weeks; subtract it and the trend, and all nine anomalous days fall out of the remainder.","no":"Use s.window = \"periodic\" (in quotes): it tells STL to fit a single, fixed weekly pattern rather than one that drifts week to week."}
::solution
```r
fit <- stl(ts(orders, frequency = 7),
           s.window = "periodic",
           t.window = 41, robust = TRUE)
rem <- fit$time.series[, "remainder"]
which(abs((rem - median(rem)) / mad(rem)) > 3.5)
#> [1] 45 76 92 93 94 95 96 97 98
```

=== step === quiz
::eyebrow Check yourself
## Why did STL catch the Saturday the band missed?

The rolling median / MAD band scored the snowstorm Saturday a sleepy \(-1.66\) and waved it through. STL scored the very same day \(-17.7\) and flagged it. What changed?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- STL simply used a lower threshold than the rolling band ::no Both used the same rule, flag when the modified z exceeds 3.5. The difference is not the threshold; it is what the z-score is measured against.
- STL removed the weekly seasonal pattern first, so the expected busy-Saturday level is subtracted out and the shortfall becomes a large remainder, while the rolling band's local spread (mixing quiet weekdays and busy weekends) was too wide to notice it ::ok Exactly. STL knows a Saturday should be about 95, so 33 leaves a 62-order remainder. The rolling band had no model of the weekly rhythm; its local scale, blended across weekdays and weekends, was too wide for the low Saturday to stand out.
- The rolling band's window was too small; a wider window would have caught it ::no Widening the window does not help: it blends even more weekdays with weekends, making the local spread wider still. The problem is not window size but that the band never models the weekly cycle. STL does.

=== step === concept
::eyebrow Score it honestly
## Precision and recall, not accuracy

Lesson 1's warning still holds: at a low anomaly rate, accuracy lies. Nine of Rosa's 112 days are anomalous, so a lazy detector that flags nothing is already 92% "accurate" and completely useless. Score by **precision** (of the days you flagged, how many were truly anomalous) and **recall** (of the truly anomalous days, how many you caught) instead.

```r
truth <- rep(FALSE, 112)
truth[c(45, 76, 92:98)] <- TRUE          # the 9 planted anomaly-days
score <- function(idx) {
  pred <- rep(FALSE, 112); pred[idx] <- TRUE
  tp <- sum(pred & truth); fp <- sum(pred & !truth); fn <- sum(!pred & truth)
  c(flagged = sum(pred), precision = round(tp / (tp + fp), 2),
    recall = round(tp / (tp + fn), 2))
}
rbind(rolling_band = score(flag_roll),
      stl_remainder = score(flag_stl))
#>               flagged precision recall
#> rolling_band        2       0.5   0.11
#> stl_remainder       9       1.0   1.00
```

The numbers make the whole lesson concrete. The rolling band flagged two days, one real and one false alarm: precision 0.5, recall 0.11. It caught the point spike and nothing else. The STL remainder flagged exactly the nine anomalous days: precision 1.0, recall 1.0. Modelling the rhythm first, then flagging the leftovers, is what turned a detector that saw one anomaly into one that saw all three kinds.

=== step === concept
::eyebrow When the anomaly is the new normal
## Anomaly or drift?

One honest caveat before you ship this. A collective slump that **ends** (the oven gets fixed) is an anomaly: the series returns to its old pattern, and flagging the slump was the right call. But a shift that **persists** is not an anomaly at all, it is **drift**: the new level *is* the new normal, and a detector that keeps firing on it is just crying wolf.

Telling them apart is a monitoring question, not a single-flag question. The standard move is to compare the recent distribution of the series against the reference distribution it used to follow, with a **population stability index (PSI)**: small PSI means the stream still looks like its old self, a large PSI means the world has moved and it is time to retrain your baseline rather than page someone at 3am. Slide the monitor below and watch the live distribution pull away from the training reference until the PSI trips the alert.

::widget drift-monitor {}

[NOTE]
Rule of thumb: a large residual that returns to normal is an anomaly to investigate; a residual that stays out and shifts the whole distribution is drift to adapt to. Rosa's broken oven is the first; a permanent new delivery partner that lifts every day's orders is the second. Same big residual on day one, opposite right response.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Hyndman & Athanasopoulos, Forecasting: Principles and Practice (3rd ed): Time series decomposition](https://otexts.com/fpp3/decomposition.html) - the free, definitive walk through STL and what trend, seasonal and remainder mean.
- [R documentation: stl()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html) - the exact function you used, with `s.window`, `t.window` and `robust` explained, and the Cleveland et al. (1990) STL paper cited.
- [Leys et al. (2013), Detecting outliers: use absolute deviation around the median](https://doi.org/10.1016/j.jesp.2013.03.013) - the published case for the median and MAD over the mean and SD, the robust scale behind your control band.
- [Hochenbaum, Vallis & Kejariwal (2017), Automatic Anomaly Detection in the Cloud Via Statistical Learning](https://arxiv.org/abs/1704.07706) - the S-H-ESD method (seasonal-decomposition plus a robust test) that productionised exactly this idea at scale.
- [NIST/SEMATECH e-Handbook: control charts](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc31.htm) - the classical grounding for control bands and out-of-control rules.

=== step === complete
## Lesson 5 complete

You added time to your toolkit. Where every earlier detector judged a point on its own, you saw that in a series **when** a value happens is part of whether it is normal, giving three kinds of anomaly: the **point** spike that stands out against everything, the **contextual** value that is wrong only for its moment, and the **collective** run that is jointly off. You learned why a flat mean-and-SD band is the wrong shape and too fragile, built a robust **rolling median / MAD band** that catches point anomalies, and then saw it go blind to the other two because it never models the weekly rhythm. **STL decomposition** fixed that: strip out trend and seasonal, flag the large **remainder**, and all three kinds fell out cleanly, precision and recall both 1.0. Finally you learned to score honestly with precision and recall, and to tell a passing anomaly from lasting drift.

Next, Lesson 6: **Kernel PCA, Sparse PCA and NMF**. The linear autoencoder in Lesson 4 could only bend its manifold into a flat subspace. Next you go beyond plain PCA, to curved structure with kernel PCA, readable components with sparse PCA, and additive parts-based decompositions with non-negative matrix factorization.

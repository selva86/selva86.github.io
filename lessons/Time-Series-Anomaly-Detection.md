---
title: "Anomaly Detection Lesson 5: Time-Series Anomaly Detection"
catalog_blurb: "Spot the day that breaks a series once its rhythm is accounted for."
description: "Detect anomalies in a time series in R: point, contextual and collective outliers, a robust rolling median and MAD control band, and STL residual detection."
keywords: "time series anomaly detection, contextual outlier, collective anomaly, STL decomposition, rolling median, MAD, control band, seasonality, R"
post_type: "LESSON"
curriculum_id: "6.200.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "5"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Kernel-PCA-Sparse-PCA-and-NMF.html"
course_prev: "Autoencoders-for-Anomaly-Detection.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Time-Series Anomaly Detection

The four detectors you have built so far all judged a point on its own: how few cuts isolate it, how sparse its neighbourhood is, which side of a boundary it lands on, how badly a model rebuilds it. None of them cared about ORDER. But some of the most important anomalies only exist in order.

Meet Rosa. She runs a coffee cart outside an office block and sells about 160 cups on a busy weekday, about 55 on a quiet weekend. One Thursday she sells 60. On any earlier detector, 60 cups is a perfectly ordinary number: it is a normal Saturday. In its slot on the calendar, a Thursday, it is alarming: a public holiday she forgot, or a fault in the till. A value that is fine on its own but wrong for its moment in time is a **contextual anomaly**, and you cannot see it without the clock.

By the end of this lesson you will be able to:

- Tell point, contextual, and collective anomalies apart in a series
- See why a single fixed fence fails once a series has trend and seasonality
- Build a robust rolling control band, and watch a weekly rhythm defeat it
- Strip out trend and season with STL, then flag the leftover residuals, the move that catches the contextual Thursday

**Prerequisites:** you can run R and read base R (indexing, `which`), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (contextual outliers, the base-rate trap) and [Lesson 4: Autoencoders](Autoencoders-for-Anomaly-Detection.html) (scoring a point by how badly it fits the learned normal). No time-series background is assumed; trend, seasonality and decomposition are built up here.

Here is the shape of where we are headed: a live monitor that stays quiet while a stream looks normal, then raises an alert once the signal drifts out of its band. By the end you will have built the detector behind an alarm like this.

::widget drift-monitor {}

=== step === concept
::eyebrow The new ingredient
## In a series, the neighbours are the clock

Every detector in this course so far treated your data as a bag of points with no order: shuffle the rows and nothing changes. A time series is different. Each reading has a POSITION, and the readings around it (yesterday, last Tuesday, this time last month) are its context. That one fact creates three distinct kinds of anomaly, and they need different tools.

- A **point anomaly** is a single reading extreme on its own, no context required. Rosa sells 335 cups the day a conference books catering. Any of your earlier detectors would catch it.
- A **contextual anomaly** is a reading ordinary in general but wrong for its position. The Thursday at 60 cups. The number is common; its slot is not.
- A **collective anomaly** is a run of readings, each individually plausible, that is wrong as a group. A road closure drops Rosa to about 135 cups for five straight weekdays. No single day is shocking; five in a row is.

Let us build Rosa's 13 weeks and plant one of each. This is the only data the whole lesson uses, so run it first. Interactive R runs right here in your browser; press Run.

```r
set.seed(42)
n      <- 91
date   <- as.Date("2024-01-01") + 0:(n - 1)         # 91 days; 2024-01-01 is a Monday
day    <- weekdays(date)
dow    <- (0:(n - 1)) %% 7                           # 0 = Mon ... 6 = Sun
season <- c(38, 44, 46, 42, 30, -64, -72)[dow + 1]   # weekly rhythm: busy weekdays, quiet weekends
trend  <- 118 + 0.45 * (1:n)                         # a slow climb as the cart gets known
cups   <- round(trend + season + rnorm(n, 0, 7))

cups[17]    <- 335                # POINT: a one-off catering order (a Wednesday)
cups[46]    <- 60                 # CONTEXTUAL: a holiday on a busy Thursday
cups[64:68] <- cups[64:68] - 52   # COLLECTIVE: a 5-day road-closure slump

coffee <- data.frame(date, day, cups)
plot(coffee$date, coffee$cups, type = "o", pch = 20, cex = 0.6, col = "grey45",
     xlab = "", ylab = "cups sold", main = "Rosa's coffee cart: 13 weeks")
points(coffee$date[c(17, 46)], coffee$cups[c(17, 46)], col = "firebrick", pch = 19, cex = 1.3)
head(coffee)
#>         date       day cups
#> 1 2024-01-01    Monday  166
#> 2 2024-01-02   Tuesday  159
#> 3 2024-01-03 Wednesday  168
#> 4 2024-01-04  Thursday  166
#> 5 2024-01-05    Friday  153
#> 6 2024-01-06  Saturday   56
```

The zig-zag is the weekly rhythm: five busy weekdays, then the weekend floor. The tall red spike is the catering day; the lone red dot near the middle is the 60-cup Thursday; and if you look around day 64 you can see a shallow, five-day dip. Those are the three anomalies. Now we hunt them.

=== step === quiz
::eyebrow Check yourself
## What kind of anomaly is the Thursday?

On that Thursday the cart sold 60 cups. Across the whole 13 weeks, 60 is an unremarkable number: most Saturdays and Sundays sit right around there. Yet a Thursday is normally a 160-cup day. Which kind of anomaly is this?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- A point anomaly, because 60 is far from the typical day ::no A point anomaly is extreme on its own scale. 60 cups is not extreme at all: plenty of weekend days sell about 60. It only looks wrong once you know it landed on a Thursday.
- A contextual anomaly, because 60 is normal in general but wrong for a Thursday ::ok Exactly. The value is ordinary; its context (a busy weekday) is what makes it an anomaly. A detector that ignores the day of week waves it straight through.
- A collective anomaly, because it is part of the weekly pattern ::no A collective anomaly is a RUN of points wrong as a group. This is a single day, and it breaks the weekly pattern rather than belonging to it.

=== step === concept
::eyebrow The first attempt
## One fence for the whole series, and why it slips

The simplest anomaly rule is a fixed fence: take the mean and standard deviation of every reading, and flag anything more than three standard deviations away. The standard score of day \(t\) is

\( z_t = \dfrac{x_t - \bar{x}}{s} \)

where \(x_t\) is that day's cups, \(\bar{x}\) the average over all days, and \(s\) the standard deviation. Flag the day when \(|z_t| > 3\). Let us run it on Rosa's cart.

```r
z       <- (cups - mean(cups)) / sd(cups)     # standard score of every day
flagged <- which(abs(z) > 3)                  # the classic 3-sigma fence
coffee[flagged, c("date", "day", "cups")]
#>         date       day cups
#> 17 2024-01-17 Wednesday  335
round(c(sd = sd(cups), lo = mean(cups) - 3 * sd(cups), hi = mean(cups) + 3 * sd(cups)), 1)
#>    sd    lo    hi
#>  53.2 -13.9 305.6
```

The fence catches exactly one day: the 335-cup catering spike. It misses the Thursday holiday and the five-day slump completely. Look at why. The standard deviation is a huge 53.2 cups, because busy weekdays and quiet weekends are heaped into one pile. That stretches the fence all the way from -13.9 to 305.6 cups, and a band running from "negative coffee" to 306 cups will never flag a 60-cup Thursday.

[WARNING]
A single global fence fails a real series in two ways at once. It ignores STRUCTURE: trend and seasonality inflate the spread, so the band grows too wide to catch anything but the most blatant spike. And the mean and standard deviation are NOT ROBUST: the 335-cup spike drags the mean up and the deviation out, loosening the very fence meant to catch it. Two problems, so we fix them one at a time.

=== step === concept
::eyebrow Fix one: robust and local
## A band that moves with the series

Start with the two flaws from the last step. Replace the mean and standard deviation with their **robust** cousins, the median and the **MAD** (median absolute deviation), which barely move when a few wild points are present. And make the band **local**: instead of one fence for all 91 days, compare each day only to its recent neighbours, so the band rides up and down with the trend.

The median absolute deviation is the median of the distances from the median:

\( \text{MAD} = 1.4826 \cdot \text{median}_i \lvert x_i - \tilde{m} \rvert \)

where \(\tilde{m}\) is the median. The constant 1.4826 rescales MAD so that, for well-behaved data, it matches the standard deviation, which lets us keep the familiar "more than 3 away" cutoff. For each day we take a rolling median \(\tilde{m}_t\) and a local MAD over a one-week window, then score

\( z_t = \dfrac{\lvert x_t - \tilde{m}_t \rvert}{\text{MAD}_t} \)

and flag \(z_t > 3\). This is the Hampel filter. In R, `runmed` gives the rolling median and `mad` the robust spread.

```r
w        <- 7                                   # a one-week window
roll_med <- runmed(cups, w, endrule = "median") # robust local centre
roll_mad <- sapply(seq_len(n), function(i) mad(cups[max(1, i - 3):min(n, i + 3)]))
robust_z <- abs(cups - roll_med) / roll_mad
hits     <- which(robust_z > 3)
length(hits)                                    # how many days does it flag?
#> [1] 19
sort(table(coffee$day[hits]), decreasing = TRUE)  # on which weekdays?
#>    Sunday  Saturday  Thursday Wednesday
#>         9         8         1         1

plot(coffee$date, cups, type = "l", col = "grey65", xlab = "", ylab = "cups sold",
     main = "Rolling median with a 3-MAD band")
lines(coffee$date, roll_med, col = "steelblue", lwd = 2)
lines(coffee$date, roll_med + 3 * roll_mad, col = "steelblue", lty = 2)
lines(coffee$date, roll_med - 3 * roll_mad, col = "steelblue", lty = 2)
points(coffee$date[hits], cups[hits], col = "firebrick", pch = 19)
```

The band now breathes with the series, and the spike no longer wrecks it: the median and MAD shrug it off. But look at what it flagged. Nineteen days, and seventeen of them are Saturdays and Sundays. The filter is shouting "anomaly!" at nearly every ordinary weekend. Only 2 of the 19 flags are real. A detector that cries wolf 17 times to catch 2 events is worse than useless.

[KEY INSIGHT]
A rolling window assumes the series is LOCALLY SMOOTH: today should look like the last few days. Rosa's series is not locally smooth; it swings by 100 cups every single week, on schedule. The window straddles busy and quiet days, its median lands in the middle, so every weekend reads "too low" and every weekday "too high." A rolling band handles TREND (a slow drift the local median tracks) but not SEASONALITY (a fast, repeating swing it cannot tell from an anomaly). The weekly rhythm is not noise to smooth over; it is signal to MODEL.

=== step === quiz
::eyebrow Check yourself
## Why did the rolling band flag every weekend?

The rolling median and MAD band flagged 19 days, of which 17 were perfectly normal Saturdays and Sundays. What is the root cause?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The MAD is not robust enough, so the weekend points inflate it ::no The MAD is robust; that is precisely why the 335-cup spike did not blow up the band. Robustness is not the problem here.
- The window is too short; a longer window would smooth the weekends away ::no A longer window makes it worse: it blends even more weekdays and weekends together, so the median sits further from both. No window length fixes a swing the method cannot represent.
- A rolling window assumes the series is locally smooth, and a strong weekly cycle is not, so every weekend reads as "too low" ::ok Right. The band compares each day to a local centre that averages busy and quiet days together. The weekly seasonality is a real, repeating pattern the band has no way to model, so it mistakes normal weekends for anomalies.

=== step === concept
::eyebrow Fix two: model the rhythm
## Split the series into trend, season, and what is left

If the weekly swing is signal, then model it and subtract it. **Decomposition** splits a series into three added-up parts:

\( x_t = T_t + S_t + R_t \)

the **trend** \(T_t\) (the slow climb as the cart gets known), the **seasonal** part \(S_t\) (the repeating weekly shape: weekdays up, weekends down), and the **remainder** \(R_t\), everything the first two cannot explain. The remainder is the whole point: once the expected trend and the expected weekly shape are stripped out, a normal day leaves almost nothing behind, and an anomaly leaves a big leftover.

**STL** (Seasonal-Trend decomposition using Loess) is a robust, widely used way to compute that split. It estimates the seasonal shape by smoothing across same-weekday values, the trend by smoothing across the deseasonalised series, and calls the rest the remainder. In R it is one function; you only tell it the period, 7 days for a weekly cycle.

```r
y   <- ts(cups, frequency = 7)                  # tell R the season repeats every 7 days
fit <- stl(y, s.window = "periodic", robust = TRUE)
plot(fit)                                        # four panels: data, seasonal, trend, remainder
round(fit$time.series[1:7, "seasonal"], 1)       # the learned weekly shape, Mon to Sun
#> [1]  28.8  35.1  33.3  33.1  20.6 -71.7 -79.2
```

The four panels tell the story: a gently rising trend, a clean repeating weekly wave, and a remainder that is mostly flat except for a few sharp spikes. The learned weekly shape confirms it: about +30 cups on weekdays, about -75 on Saturdays and Sundays. STL discovered Rosa's rhythm on its own, and "normal for a Thursday" now lives in \(S_t\) instead of being mistaken for an anomaly. The anomalies have nowhere left to hide but the remainder, where a robust fence finally works.

=== step === tryit
::eyebrow Your turn
## Flag the leftover residuals

The remainder is what trend and season could not explain, so a normal day sits near zero and an anomaly sticks out. Score each remainder with the same robust z you built earlier, distance from the median in MADs, and flag anything past 3. Fill in the cutoff.

```r
resid    <- as.numeric(fit$time.series[, "remainder"])  # the leftover, per day
robust_z <- abs(resid - median(resid)) / mad(resid)     # robust score on the remainder
flagged  <- which(robust_z > ____)                      # a 3-MAD robust fence
coffee[flagged, c("date", "day", "cups")]
```
::check {"regex":">\\s*3","gate":true,"difficulty":"intermediate","ok":"That is the payoff. The Thursday holiday now scores a robust z of 17 and the catering spike 24.5, both far past 3. Point and contextual anomalies pop straight out of the remainder.","no":"Use the same 3-sigma-style cutoff as before: flag where robust_z is greater than 3."}
::solution
```r
resid    <- as.numeric(fit$time.series[, "remainder"])
robust_z <- abs(resid - median(resid)) / mad(resid)
flagged  <- which(robust_z > 3)
coffee[flagged, c("date", "day", "cups")]
#>         date       day cups
#> 17 2024-01-17 Wednesday  335
#> 46 2024-02-15  Thursday   60
#> 65 2024-03-05   Tuesday  134
#> 69 2024-03-09  Saturday   91
#> 70 2024-03-10    Sunday   83
round(robust_z[c(17, 46)], 1)   # the point spike and the contextual holiday
#> [1] 24.5 17.0
```

The two isolated anomalies land at the very top: the catering spike at a robust z of 24.5, and the contextual Thursday at 17, both impossible to miss. The fence also flags days 65, 69 and 70, all clustered around the road-closure week. That is neither luck nor quite success: the collective slump is a different animal, and the next step is honest about why.

=== step === quiz
::eyebrow Check yourself
## Why did STL catch the Thursday the global fence missed?

The global mean plus-or-minus 3sd fence scored the 60-cup Thursday as ordinary. After STL, that same day scored a robust z of 17 on its remainder. What changed?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The seasonal component encodes the expected weekday level, so a busy-weekday slot filled with a weekend-sized number leaves a huge remainder ::ok Exactly. STL subtracts the roughly +33 cups a Thursday should carry: expected near 160, actual 60, so the remainder is about -120, enormous next to the tiny remainders of normal days. Context that was invisible to a global fence is now measured explicitly.
- STL uses a lower threshold than 3, so it flags more days ::no The threshold is the same 3 in both. Nothing about the cutoff changed; what changed is the quantity being thresholded, a remainder with trend and season removed instead of the raw value.
- STL is robust and the global fence was not, and robustness alone catches contextual anomalies ::no Robustness helps with the point spike, but it is not the reason here. Even a robust global fence would still heap weekdays and weekends together and miss the Thursday. Removing the seasonal expectation is what exposes it.

=== step === concept
::eyebrow When it breaks
## The hard cases, and turning a score into a monitor

STL residual detection nails point and contextual anomalies. Three honest limits are worth stating plainly.

**Collective anomalies are the hard case.** Look at the residual scores across the five-day road-closure slump:

```r
round(robust_z[64:68], 1)   # the five slump days, Mon to Fri
#> [1] 2.9 4.1 0.7 1.3 1.6
```

Only one of the five clears the fence. A sustained shift is partly absorbed by the decomposition itself: the trend component bends down to follow the slump, so most of the drop is explained away as a temporary trend change rather than left in the remainder. Worse, that bent trend throws off the days around the closure (65, 69, 70 in the last step): one slump day (65) pokes through the softened band, and the recovery days just after it ends (69, 70) read as anomalies while the trend climbs back. For runs like this a residual fence is the wrong tool. You want a **change-point** method that tests whether the whole level shifted, not whether one point stuck out.

**STL is batch, not live.** It needs the whole series (at least two full cycles) to estimate the season, so it reports on yesterday, not this second. To watch a stream in real time you re-fit on a rolling history, or forecast the next value and flag a large forecast error, the same residual idea one step ahead.

**A score is not a decision.** As in Lesson 1, at a low anomaly rate a fence that fires often is mostly false alarms. Judge it by precision and recall on labelled days, and set the cutoff to the alarm budget you can actually action, not to a round number like 3.

That last idea, watch a running signal, stay quiet until it leaves its normal band, then raise an alert, is exactly what a production monitor does. Slide the one below to feel it: a stream drifts, a stability score climbs, and past a line it alarms. Watching a whole distribution drift, rather than a single series, is the closely related subject of the drift course.

::widget drift-monitor {}

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Hyndman and Athanasopoulos, Forecasting: Principles and Practice, 3.6 STL decomposition (free)](https://otexts.com/fpp3/stl.html) - the clearest hands-on treatment of the decomposition you used.
- [The same book, Chapter 3: Time series decomposition (free)](https://otexts.com/fpp3/decomposition.html) - trend, seasonality and remainder from the ground up.
- [R documentation: stl(), seasonal decomposition of time series by loess](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html) - the exact function and every argument.
- [Leys et al. (2013), Detecting outliers: use the median absolute deviation (J. Exp. Soc. Psych.)](https://doi.org/10.1016/j.jesp.2013.03.013) - why the robust MAD fence beats a mean-and-sd fence.
- [Chandola, Banerjee and Kumar (2009), Anomaly Detection: A Survey (ACM Computing Surveys)](https://doi.org/10.1145/1541880.1541882) - the point, contextual and collective taxonomy this lesson is built around.

=== step === complete
## Lesson 5 complete

Time changed the game. When each reading's context is its position in a series, anomalies split into three kinds: point (extreme on its own), contextual (an ordinary value in the wrong moment), and collective (a run that is wrong as a group). You watched a single global fence catch only the blatant spike, a robust rolling band drown in false alarms because a weekly rhythm is not locally smooth, and finally the move that works: decompose the series with STL into trend, season and remainder, then run a robust MAD fence on the remainder. That caught the contextual Thursday a global rule called ordinary; it scored a robust z of 17 once its expected weekday level was subtracted out. You also met the honest edges: collective slumps get absorbed by the decomposition, STL is batch not live, and a score still has to earn its threshold.

Five detectors down, and every one has treated the features it was handed as fixed. Next, Lesson 6: **Kernel PCA, Sparse PCA and NMF**, where you go under the hood of the linear subspace from Lesson 4, bending it into curves with a kernel, forcing it to name only a few features at a time, and decomposing data into the additive parts it is really built from.

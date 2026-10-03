---
title: "Intervention, Causal Impact, and Anomaly Detection Lesson 4: Detecting anomalies and outliers in a series"
catalog_blurb: "Tell a single bad day from a bad stretch, and flag both correctly."
description: "Learn to tell a point anomaly from a contextual or collective one, fit a residual-based detector, pick a threshold, and catch all three with anomalize."
keywords: "anomaly detection in R, outlier detection time series, point anomaly, contextual anomaly, collective anomaly, anomalize package R, STL decomposition, GESD test, residual z-score, false alarm rate"
post_type: "LESSON"
curriculum_id: "5.140.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-intervention"
course_title: "Intervention, Causal Impact, and Anomaly Detection"
course_lesson: "4"
course_total: "5"
course_landing: "Intervention-Causal-Impact-and-Anomaly-Detection-Course.html"
course_next: "Handling-Outliers-in-Time-Series.html"
course_prev: "Changepoint-Detection.html"
---

=== step === cover
## Detecting anomalies and outliers in a series

Today let's look at a real series of daily counts and find exactly where it went wrong, in three different ways that each need their own kind of check.

A city runs a bike-share program. Every day for 120 days, somebody counted how many rides were completed that day. Here is the whole series.

::widget chart-plotter {"data":[{"x":1,"y":875},{"x":2,"y":798},{"x":3,"y":836},{"x":4,"y":847},{"x":5,"y":838},{"x":6,"y":538},{"x":7,"y":603},{"x":8,"y":820},{"x":9,"y":905},{"x":10,"y":822},{"x":11,"y":877},{"x":12,"y":917},{"x":13,"y":490},{"x":14,"y":535},{"x":15,"y":822},{"x":16,"y":853},{"x":17,"y":817},{"x":18,"y":722},{"x":19,"y":731},{"x":20,"y":602},{"x":21,"y":538},{"x":22,"y":759},{"x":23,"y":824},{"x":24,"y":880},{"x":25,"y":908},{"x":26,"y":815},{"x":27,"y":543},{"x":28,"y":483},{"x":29,"y":853},{"x":30,"y":809},{"x":31,"y":853},{"x":32,"y":864},{"x":33,"y":878},{"x":34,"y":532},{"x":35,"y":577},{"x":36,"y":769},{"x":37,"y":807},{"x":38,"y":805},{"x":39,"y":743},{"x":40,"y":841},{"x":41,"y":568},{"x":42,"y":546},{"x":43,"y":872},{"x":44,"y":813},{"x":45,"y":787},{"x":46,"y":1500},{"x":47,"y":811},{"x":48,"y":621},{"x":49,"y":547},{"x":50,"y":545},{"x":51,"y":858},{"x":52,"y":814},{"x":53,"y":909},{"x":54,"y":872},{"x":55,"y":571},{"x":56,"y":579},{"x":57,"y":875},{"x":58,"y":852},{"x":59,"y":730},{"x":60,"y":861},{"x":61,"y":836},{"x":62,"y":578},{"x":63,"y":595},{"x":64,"y":908},{"x":65,"y":823},{"x":66,"y":905},{"x":67,"y":867},{"x":68,"y":895},{"x":69,"y":611},{"x":70,"y":604},{"x":71,"y":814},{"x":72,"y":852},{"x":73,"y":881},{"x":74,"y":819},{"x":75,"y":836},{"x":76,"y":601},{"x":77,"y":609},{"x":78,"y":877},{"x":79,"y":824},{"x":80,"y":816},{"x":81,"y":921},{"x":82,"y":871},{"x":83,"y":585},{"x":84,"y":577},{"x":85,"y":815},{"x":86,"y":887},{"x":87,"y":855},{"x":88,"y":857},{"x":89,"y":902},{"x":90,"y":618},{"x":91,"y":641},{"x":92,"y":847},{"x":93,"y":892},{"x":94,"y":923},{"x":95,"y":823},{"x":96,"y":833},{"x":97,"y":543},{"x":98,"y":531},{"x":99,"y":605},{"x":100,"y":605},{"x":101,"y":621},{"x":102,"y":610},{"x":103,"y":620},{"x":104,"y":666},{"x":105,"y":566},{"x":106,"y":877},{"x":107,"y":857},{"x":108,"y":869},{"x":109,"y":882},{"x":110,"y":880},{"x":111,"y":594},{"x":112,"y":600},{"x":113,"y":857},{"x":114,"y":857},{"x":115,"y":811},{"x":116,"y":863},{"x":117,"y":858},{"x":118,"y":707},{"x":119,"y":545},{"x":120,"y":885}],"geoms":["line"],"x":"day","y":"rides","code":{"line":"ggplot(rides_df, aes(day, rides)) +\n  geom_line()"}}

Look closely at the chart. Something is off in three separate stretches of it, each in a different way.

=== step === concept
## Three different questions people call anomaly detection

People use the word "anomaly" (also called an outlier) for a lot of different things. But "a part of the series that does not behave the way the rest of it does" can mean three genuinely different situations, and a check built for one of them can walk right past the other two.

A **point anomaly** is a single observation that sits far from its own neighbours, obvious just by looking at the points right next to it. Day 46, a Thursday, had 1500 rides, while day 45 had 787 and day 47 had 811. 1500 is nowhere near either neighbour, so this one jumps out on sight alone.

A **contextual anomaly** is an observation that looks completely ordinary next to its neighbours, but is wrong once you bring in the context it should actually be judged against. Day 50, a Monday, had 545 rides. Its neighbours, day 49 and day 51, had 547 and 858. 545 sits right next to 547, so a check that only compares neighbours would wave it straight through. But Mondays on this program normally run far higher than 545, so judged against what a Monday looks like, it is wrong.

A **collective anomaly** is a stretch where no single day is extreme by itself, but the stretch as a whole breaks the pattern. Days 99 to 103, a Monday through Friday, ran 605, 605, 621, 610 and 620 rides. Each of those days sits close to its own neighbours, so none of them look like a point anomaly on that test alone. But compare this five-day stretch to any other working week on the chart above: every other week runs noticeably higher, and here all five days dropped together.

The chart below marks all three on the same series.

::widget chart-plotter {"data":[{"x":1,"y":875,"fill":"ordinary"},{"x":2,"y":798,"fill":"ordinary"},{"x":3,"y":836,"fill":"ordinary"},{"x":4,"y":847,"fill":"ordinary"},{"x":5,"y":838,"fill":"ordinary"},{"x":6,"y":538,"fill":"ordinary"},{"x":7,"y":603,"fill":"ordinary"},{"x":8,"y":820,"fill":"ordinary"},{"x":9,"y":905,"fill":"ordinary"},{"x":10,"y":822,"fill":"ordinary"},{"x":11,"y":877,"fill":"ordinary"},{"x":12,"y":917,"fill":"ordinary"},{"x":13,"y":490,"fill":"ordinary"},{"x":14,"y":535,"fill":"ordinary"},{"x":15,"y":822,"fill":"ordinary"},{"x":16,"y":853,"fill":"ordinary"},{"x":17,"y":817,"fill":"ordinary"},{"x":18,"y":722,"fill":"ordinary"},{"x":19,"y":731,"fill":"ordinary"},{"x":20,"y":602,"fill":"ordinary"},{"x":21,"y":538,"fill":"ordinary"},{"x":22,"y":759,"fill":"ordinary"},{"x":23,"y":824,"fill":"ordinary"},{"x":24,"y":880,"fill":"ordinary"},{"x":25,"y":908,"fill":"ordinary"},{"x":26,"y":815,"fill":"ordinary"},{"x":27,"y":543,"fill":"ordinary"},{"x":28,"y":483,"fill":"ordinary"},{"x":29,"y":853,"fill":"ordinary"},{"x":30,"y":809,"fill":"ordinary"},{"x":31,"y":853,"fill":"ordinary"},{"x":32,"y":864,"fill":"ordinary"},{"x":33,"y":878,"fill":"ordinary"},{"x":34,"y":532,"fill":"ordinary"},{"x":35,"y":577,"fill":"ordinary"},{"x":36,"y":769,"fill":"ordinary"},{"x":37,"y":807,"fill":"ordinary"},{"x":38,"y":805,"fill":"ordinary"},{"x":39,"y":743,"fill":"ordinary"},{"x":40,"y":841,"fill":"ordinary"},{"x":41,"y":568,"fill":"ordinary"},{"x":42,"y":546,"fill":"ordinary"},{"x":43,"y":872,"fill":"ordinary"},{"x":44,"y":813,"fill":"ordinary"},{"x":45,"y":787,"fill":"ordinary"},{"x":46,"y":1500,"fill":"point anomaly"},{"x":47,"y":811,"fill":"ordinary"},{"x":48,"y":621,"fill":"ordinary"},{"x":49,"y":547,"fill":"ordinary"},{"x":50,"y":545,"fill":"contextual anomaly"},{"x":51,"y":858,"fill":"ordinary"},{"x":52,"y":814,"fill":"ordinary"},{"x":53,"y":909,"fill":"ordinary"},{"x":54,"y":872,"fill":"ordinary"},{"x":55,"y":571,"fill":"ordinary"},{"x":56,"y":579,"fill":"ordinary"},{"x":57,"y":875,"fill":"ordinary"},{"x":58,"y":852,"fill":"ordinary"},{"x":59,"y":730,"fill":"ordinary"},{"x":60,"y":861,"fill":"ordinary"},{"x":61,"y":836,"fill":"ordinary"},{"x":62,"y":578,"fill":"ordinary"},{"x":63,"y":595,"fill":"ordinary"},{"x":64,"y":908,"fill":"ordinary"},{"x":65,"y":823,"fill":"ordinary"},{"x":66,"y":905,"fill":"ordinary"},{"x":67,"y":867,"fill":"ordinary"},{"x":68,"y":895,"fill":"ordinary"},{"x":69,"y":611,"fill":"ordinary"},{"x":70,"y":604,"fill":"ordinary"},{"x":71,"y":814,"fill":"ordinary"},{"x":72,"y":852,"fill":"ordinary"},{"x":73,"y":881,"fill":"ordinary"},{"x":74,"y":819,"fill":"ordinary"},{"x":75,"y":836,"fill":"ordinary"},{"x":76,"y":601,"fill":"ordinary"},{"x":77,"y":609,"fill":"ordinary"},{"x":78,"y":877,"fill":"ordinary"},{"x":79,"y":824,"fill":"ordinary"},{"x":80,"y":816,"fill":"ordinary"},{"x":81,"y":921,"fill":"ordinary"},{"x":82,"y":871,"fill":"ordinary"},{"x":83,"y":585,"fill":"ordinary"},{"x":84,"y":577,"fill":"ordinary"},{"x":85,"y":815,"fill":"ordinary"},{"x":86,"y":887,"fill":"ordinary"},{"x":87,"y":855,"fill":"ordinary"},{"x":88,"y":857,"fill":"ordinary"},{"x":89,"y":902,"fill":"ordinary"},{"x":90,"y":618,"fill":"ordinary"},{"x":91,"y":641,"fill":"ordinary"},{"x":92,"y":847,"fill":"ordinary"},{"x":93,"y":892,"fill":"ordinary"},{"x":94,"y":923,"fill":"ordinary"},{"x":95,"y":823,"fill":"ordinary"},{"x":96,"y":833,"fill":"ordinary"},{"x":97,"y":543,"fill":"ordinary"},{"x":98,"y":531,"fill":"ordinary"},{"x":99,"y":605,"fill":"collective anomaly"},{"x":100,"y":605,"fill":"collective anomaly"},{"x":101,"y":621,"fill":"collective anomaly"},{"x":102,"y":610,"fill":"collective anomaly"},{"x":103,"y":620,"fill":"collective anomaly"},{"x":104,"y":666,"fill":"ordinary"},{"x":105,"y":566,"fill":"ordinary"},{"x":106,"y":877,"fill":"ordinary"},{"x":107,"y":857,"fill":"ordinary"},{"x":108,"y":869,"fill":"ordinary"},{"x":109,"y":882,"fill":"ordinary"},{"x":110,"y":880,"fill":"ordinary"},{"x":111,"y":594,"fill":"ordinary"},{"x":112,"y":600,"fill":"ordinary"},{"x":113,"y":857,"fill":"ordinary"},{"x":114,"y":857,"fill":"ordinary"},{"x":115,"y":811,"fill":"ordinary"},{"x":116,"y":863,"fill":"ordinary"},{"x":117,"y":858,"fill":"ordinary"},{"x":118,"y":707,"fill":"ordinary"},{"x":119,"y":545,"fill":"ordinary"},{"x":120,"y":885,"fill":"ordinary"}],"geoms":["point"],"x":"day","y":"rides","code":{"point":"ggplot(rides_df, aes(day, rides, color = category)) +\n  geom_point()"}}

One single rule will not catch all three, because each one is wrong in a different way: alone, against its own context, or as a group.

=== step === concept
## Would a simple global threshold catch all three?

The simplest possible check ignores all of that and just asks: how far is each day from the series' own overall mean, measured in standard deviations? That distance is called a **z-score**: take a value, subtract the mean, and divide by the standard deviation. A z-score of 0 means a day sits exactly at the average; a z-score of 3 means it sits 3 standard deviations above it, which is already rare for data that behaves like a bell curve.

Let's compute it for real, for every one of the 120 days.

```r
# Simulate the 120-day ride series, then check whether one global mean and sd flags all three planted problems
set.seed(42)
dow_levels <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
dow <- rep(dow_levels, length.out = 120)
base <- ifelse(dow %in% c("Sat", "Sun"), 540, 820)
trend <- seq(0, 60, length.out = 120)
noise <- rnorm(120, 0, 40)
rides <- round(base + trend + noise)

rides[46] <- 1500
rides[50] <- 545
rides[99:103] <- c(605, 605, 621, 610, 620)

global_mean <- mean(rides)
global_sd <- sd(rides)
z_global <- (rides - global_mean) / global_sd

round(global_mean, 1)
#> [1] 763.1
round(global_sd, 1)
#> [1] 148.8
which(abs(z_global) > 3)
#> [1] 46
round(z_global[c(46, 50, 99:103)], 2)
#> [1]  4.95 -1.47 -1.06 -1.06 -0.95 -1.03 -0.96
```

Across all 120 days, the mean is 763.1 rides and the standard deviation is 148.8. Measured against that single global yardstick, day 46's z-score is 4.95, well past the usual cutoff of 3, so this check catches it easily.

But day 50 only reaches -1.47, and the five days from 99 to 103 only reach between -0.95 and -1.06. None of those come anywhere near 3 standard deviations, so a check built on one global mean and sd walks straight past both of them. It was never going to catch them: day 50 is ordinary next to its own neighbours, and the five-day stretch is ordinary next to its own neighbours too. A global check never separates Mondays from any other weekday in the first place, so it has nothing to compare either one against.

=== step === quiz
## Quick check: what would a global threshold miss?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- All three of them. ::no
- The point anomaly and the contextual one, day 46 and day 50. ::no
- Only the point anomaly, day 46. ::ok Right. Day 46's z-score was 4.95, past the usual cutoff of 3. Day 50 only reached -1.47, and the five-day stretch only reached about -1 in either direction, both comfortably inside the cutoff, so a check built on the global mean and sd alone walks right past them.
- None of them. ::no A global mean and sd check does catch something: day 46's z-score of 4.95 clears the usual cutoff of 3 standard deviations. What it misses is day 50 (z = -1.47) and the five-day stretch (z near -1), both ordinary by that global standard even though one is wrong for its weekday and the other breaks the weekly pattern as a group.

=== step === concept
## Residual-based detection: fitting a model, then reading what is left over

The global check failed because it never captured what a typical Monday, or a typical Thursday, actually looks like. The fix is to give it that: fit a model that captures what each day of the week normally does, and then judge each day against its own weekday's expectation instead of against the whole series at once.

The simplest such model is just each weekday's own average. For every Monday in the data, average its rides; that average becomes the model's expectation for any Monday. Do the same for Tuesday through Sunday, and you have seven expectations instead of one.

Once you have that, a **residual** is just the gap between what actually happened and what the model expected: the actual value minus the fitted value for that weekday. A big residual, in either direction, is a day that broke its own weekday's pattern, not just the series' overall pattern.

```r
# Fit each weekday's own average, then turn each day's gap from it into a z-score
dow_means <- tapply(rides, dow, mean)
round(dow_means[dow_levels], 1)
#>   Mon   Tue   Wed   Thu   Fri   Sat   Sun 
#> 815.3 830.4 825.0 874.9 837.3 586.4 569.2 

resid <- rides - dow_means[dow]
resid_sd <- sd(resid)
round(resid_sd, 1)
#> [1] 90.1

z_resid <- resid / resid_sd
flagged_days <- c(46, 50, 99:103)
resid_table <- data.frame(
  day = flagged_days,
  weekday = dow[flagged_days],
  rides = rides[flagged_days],
  residual = round(resid[flagged_days], 1),
  z = round(z_resid[flagged_days], 2)
)
print(resid_table, row.names = FALSE)
#>  day weekday rides residual     z
#>   46     Thu  1500    625.1  6.94
#>   50     Mon   545   -270.3 -3.00
#>   99     Mon   605   -210.3 -2.33
#>  100     Tue   605   -225.4 -2.50
#>  101     Wed   621   -204.0 -2.26
#>  102     Thu   610   -264.9 -2.94
#>  103     Fri   620   -217.3 -2.41
```

A Monday on this program normally runs 815.3 rides, a Thursday 874.9, and a Sunday as low as 569.2. Those seven numbers are the model's whole idea of what a normal day looks like, one number per weekday.

Judged against its own weekday instead of the whole series, day 50's residual is -270.3, a z-score of -3.00, comfortably past the cutoff that the global check never got close to. The five days from 99 to 103 now land between -2.26 and -2.94, all past 2 standard deviations too. Day 46 shows up even more clearly than before, at a residual z-score of 6.94. Fitting a model that accounts for the day of the week turns two invisible problems into two obvious ones.

=== step === concept
## The threshold decision: how many standard deviations is enough?

Catching an anomaly this way means picking a cutoff k, and flagging every day where the residual z-score's absolute value goes over k. The question is which k to pick, and the answer is a trade-off, not a fixed rule.

```r
# Sweep the detection threshold and see what each setting costs in false alarms and misses
planted <- c(46, 50, 99:103)
k_values <- c(1.5, 2, 2.5, 3)
sweep_table <- data.frame()
for (k in k_values) {
  flagged <- which(abs(z_resid) > k)
  hits <- length(intersect(flagged, planted))
  false_alarms <- length(setdiff(flagged, planted))
  misses <- length(setdiff(planted, flagged))
  sweep_table <- rbind(sweep_table, data.frame(k = k, flagged = length(flagged), hits = hits, false_alarms = false_alarms, misses = misses))
}
print(sweep_table, row.names = FALSE)
#>    k flagged hits false_alarms misses
#>  1.5       8    7            1      0
#>  2.0       7    7            0      0
#>  2.5       4    4            0      3
#>  3.0       1    1            0      6
```

At k = 1.5, the check flags 8 days: all 7 of the real problems, plus one false alarm. Day 18, an ordinary Thursday with 722 rides, has a residual z-score of -1.70, past 1.5 purely by ordinary noise, with nothing actually wrong with it.

At k = 2, the check flags exactly 7 days, and all 7 are real: 0 false alarms, 0 misses. Loosen the cutoff below 2 and false alarms start creeping in, like day 18. Tighten it above 2 and real problems start slipping through: at k = 2.5, 3 of the 7 are missed; at k = 3, only day 46 still clears the bar, and the other 6 are missed, including the entire 5-day stretch.

That is the whole trade-off in one table. A looser cutoff catches more real problems but lets more ordinary noise through as false alarms. A tighter cutoff lets less noise through but starts missing real problems too. k = 2 happens to be the sweet spot for this particular series, not a number that works everywhere; a noisier series would need a different cutoff to land on the same trade-off.

=== step === widget
## Why a threshold's false-alarm rate needs independent residuals

There is a second problem with picking a threshold by hand, and it has nothing to do with which k you choose. It is about whether the residuals behave the way the threshold assumes they do.

A threshold like k = 2 implies a fixed false-alarm rate: under ordinary noise, a stated share of days should cross it purely by chance, so the rest of what it flags should be real. That implied rate holds only under one condition, that each day's residual carries no information about the next day's residual, called independence. The widget below runs that same kind of check, but on a fresh simulated regression, and watches what happens to that implied rate as the errors stop being independent.

::widget assumption-dial {"assumption": "autocorrelation"}

Drag the dial from independent toward severe. At the independent end, a 95% interval actually covers the truth about 95% of the time, and the model's fit looks stable. But once the errors carry real autocorrelation, an AR(1) correlation of 0.92 between one error and the next, coverage collapses to about 32.4%, while the fit statistic barely moves, holding around 0.63.

Autocorrelation, one day's leftover error carrying into the next day's, is common in time series, including a bike-share program where a slow day, say from bad weather, tends to run into another slow day right after it. When it is present, the false-alarm rate a threshold is supposed to produce and the false-alarm rate it actually produces come apart, and no amount of retuning k fixes that. Fixing it means checking the residuals for independence first, not picking a different cutoff.

=== step === concept
## Decomposition-based detection: splitting the series before testing for anomalies

Fitting day-of-week means was the simplest possible model: seven numbers, one per weekday. A richer model splits the series into more pieces before looking for what is left over, and **STL decomposition** is the standard way to do that.

STL splits a series into three parts that add back up to the original: a **trend** (the slow underlying rise or fall), a repeating **seasonal** pattern (here, a 7-day cycle that repeats week after week), and a **remainder** (whatever is left once the trend and seasonal pattern are both subtracted out). The remainder plays the same role that the residual played: it is where you look for anomalies.

```r
# Split the series into trend, a repeating 7-day pattern, and what's left over, using STL decomposition
library(dplyr)
library(tibble)
library(anomalize)

rides_tbl <- tibble(
  date = seq(as.Date("2026-01-05"), by = "day", length.out = 120),
  rides = rides
)

decomposed <- rides_tbl %>%
  time_decompose(rides, method = "stl", frequency = 7, message = FALSE)

print(decomposed, n = 3)
#> # A time tibble: 120 × 5
#> # Index:         date
#>   date       observed season trend remainder
#>   <date>        <dbl>  <dbl> <dbl>     <dbl>
#> 1 2026-01-05      875   76.3  763.     36.0 
#> 2 2026-01-06      798   72.2  762.    -36.5 
#> 3 2026-01-07      836   70.9  762.      3.07
#> # ℹ 117 more rows
```

Take the very first row. Day 1, a Monday, observed 875 rides. STL splits that into a seasonal component of 76.3 (how much a Monday typically runs above the trend), a trend of 763.0 (the slow underlying level at that point in the series), and a remainder of 36.0. Add the three back up, 76.3 plus 763.0 plus 36.0, and you get 875.3, which rounds back to the observed 875.

The remainder is computed exactly the same way the residual was: actual minus modeled. The only difference is what counts as "modeled". Before, it was a flat weekday average. Now it is a smooth decomposition that tracks the trend as it slowly rises, which makes the remainder a cleaner signal to test for anomalies in a series where the overall level is moving.

=== step === concept
## Reading anomalize's IQR and GESD tests on the remainder

Once you have a remainder, you still need a rule for calling a particular point in it an anomaly. The `anomalize` package offers two, and both skip the step where you pick a k by hand.

The **IQR method** widens the familiar boxplot fence. The ordinary boxplot rule flags a point outside 1.5 times the interquartile range beyond the first or third quartile; `anomalize`'s IQR test does the same thing on the remainder, with a fence set to widen automatically with how spread out the remainder actually is, rather than you choosing a multiple of a standard deviation.

The **GESD test** (Generalized Extreme Studentized Deviate) works differently. It tests whether the single most extreme remaining point is more extreme than a critical value built for that exact sample size, removes it if so, and repeats the test on what is left, up to a limit on how many points it is allowed to remove. Where the residual z-score check tested every point against one fixed cutoff, GESD tests one point at a time and keeps going only as long as it keeps finding real outliers.

```r
# Flag outliers in the remainder two ways: IQR (a widened boxplot fence) and GESD (test the most extreme leftover point, remove it, repeat)
anomalized_iqr <- decomposed %>% anomalize(remainder, method = "iqr")
anomalized_gesd <- decomposed %>% anomalize(remainder, method = "gesd")

anomalized_iqr %>% filter(anomaly == "Yes") %>% select(date, observed, remainder)
#> # A time tibble: 7 × 3
#> # Index:         date
#>   date       observed remainder
#>   <date>        <dbl>     <dbl>
#> 1 2026-02-19     1500      646.
#> 2 2026-02-23      545     -298.
#> 3 2026-04-13      605     -256.
#> 4 2026-04-14      605     -252.
#> 5 2026-04-15      621     -235.
#> 6 2026-04-16      610     -266.
#> 7 2026-04-17      620     -247.

all(which(anomalized_iqr$anomaly == "Yes") == which(anomalized_gesd$anomaly == "Yes"))
#> [1] TRUE
```

Both tests flag the same 7 days: day 46 (2026-02-19), day 50 (2026-02-23), and the full stretch from day 99 to day 103 (2026-04-13 through 2026-04-17). No false alarms, no misses, and no k chosen by hand anywhere in either test.

::widget chart-plotter {"data":[{"x":1,"y":36,"fill":"ordinary"},{"x":2,"y":-36.5,"fill":"ordinary"},{"x":3,"y":3.1,"fill":"ordinary"},{"x":4,"y":-5.7,"fill":"ordinary"},{"x":5,"y":-5.8,"fill":"ordinary"},{"x":6,"y":-32.3,"fill":"ordinary"},{"x":7,"y":44.9,"fill":"ordinary"},{"x":8,"y":-16.4,"fill":"ordinary"},{"x":9,"y":73,"fill":"ordinary"},{"x":10,"y":-8.4,"fill":"ordinary"},{"x":11,"y":26.8,"fill":"ordinary"},{"x":12,"y":75.6,"fill":"ordinary"},{"x":13,"y":-77.9,"fill":"ordinary"},{"x":14,"y":-20.7,"fill":"ordinary"},{"x":15,"y":-12.1,"fill":"ordinary"},{"x":16,"y":23.3,"fill":"ordinary"},{"x":17,"y":-11.2,"fill":"ordinary"},{"x":18,"y":-126,"fill":"ordinary"},{"x":19,"y":-108.2,"fill":"ordinary"},{"x":20,"y":36.2,"fill":"ordinary"},{"x":21,"y":-15.6,"fill":"ordinary"},{"x":22,"y":-73.1,"fill":"ordinary"},{"x":23,"y":-3.7,"fill":"ordinary"},{"x":24,"y":53.8,"fill":"ordinary"},{"x":25,"y":62,"fill":"ordinary"},{"x":26,"y":-22.3,"fill":"ordinary"},{"x":27,"y":-20.8,"fill":"ordinary"},{"x":28,"y":-68.7,"fill":"ordinary"},{"x":29,"y":22.9,"fill":"ordinary"},{"x":30,"y":-16.7,"fill":"ordinary"},{"x":31,"y":28.8,"fill":"ordinary"},{"x":32,"y":19.3,"fill":"ordinary"},{"x":33,"y":41.3,"fill":"ordinary"},{"x":34,"y":-31.9,"fill":"ordinary"},{"x":35,"y":24.6,"fill":"ordinary"},{"x":36,"y":-62.5,"fill":"ordinary"},{"x":37,"y":-20.8,"fill":"ordinary"},{"x":38,"y":-22.3,"fill":"ordinary"},{"x":39,"y":-105.2,"fill":"ordinary"},{"x":40,"y":0.5,"fill":"ordinary"},{"x":41,"y":0,"fill":"ordinary"},{"x":42,"y":-10.9,"fill":"ordinary"},{"x":43,"y":35.6,"fill":"ordinary"},{"x":44,"y":-20.2,"fill":"ordinary"},{"x":45,"y":-45.9,"fill":"ordinary"},{"x":46,"y":646.1,"fill":"flagged"},{"x":47,"y":-35.3,"fill":"ordinary"},{"x":48,"y":47,"fill":"ordinary"},{"x":49,"y":-16.1,"fill":"ordinary"},{"x":50,"y":-297.7,"fill":"flagged"},{"x":51,"y":18.5,"fill":"ordinary"},{"x":52,"y":-25.2,"fill":"ordinary"},{"x":53,"y":48.7,"fill":"ordinary"},{"x":54,"y":19.2,"fill":"ordinary"},{"x":55,"y":-9.5,"fill":"ordinary"},{"x":56,"y":9.4,"fill":"ordinary"},{"x":57,"y":25.8,"fill":"ordinary"},{"x":58,"y":6,"fill":"ordinary"},{"x":59,"y":-115.7,"fill":"ordinary"},{"x":60,"y":-5.7,"fill":"ordinary"},{"x":61,"y":-23.2,"fill":"ordinary"},{"x":62,"y":-8.7,"fill":"ordinary"},{"x":63,"y":19.4,"fill":"ordinary"},{"x":64,"y":53,"fill":"ordinary"},{"x":65,"y":-28.6,"fill":"ordinary"},{"x":66,"y":53.9,"fill":"ordinary"},{"x":67,"y":-5,"fill":"ordinary"},{"x":68,"y":31,"fill":"ordinary"},{"x":69,"y":19.7,"fill":"ordinary"},{"x":70,"y":24.1,"fill":"ordinary"},{"x":71,"y":-45.1,"fill":"ordinary"},{"x":72,"y":-3.4,"fill":"ordinary"},{"x":73,"y":26.3,"fill":"ordinary"},{"x":74,"y":-55.9,"fill":"ordinary"},{"x":75,"y":-30.6,"fill":"ordinary"},{"x":76,"y":7.5,"fill":"ordinary"},{"x":77,"y":27.2,"fill":"ordinary"},{"x":78,"y":16.4,"fill":"ordinary"},{"x":79,"y":-32.6,"fill":"ordinary"},{"x":80,"y":-39.4,"fill":"ordinary"},{"x":81,"y":45.5,"fill":"ordinary"},{"x":82,"y":4,"fill":"ordinary"},{"x":83,"y":-8.9,"fill":"ordinary"},{"x":84,"y":-5,"fill":"ordinary"},{"x":85,"y":-45.7,"fill":"ordinary"},{"x":86,"y":30.3,"fill":"ordinary"},{"x":87,"y":-0.6,"fill":"ordinary"},{"x":88,"y":-18.7,"fill":"ordinary"},{"x":89,"y":34.6,"fill":"ordinary"},{"x":90,"y":23.7,"fill":"ordinary"},{"x":91,"y":58.5,"fill":"ordinary"},{"x":92,"y":-14.2,"fill":"ordinary"},{"x":93,"y":34.9,"fill":"ordinary"},{"x":94,"y":67.1,"fill":"ordinary"},{"x":95,"y":-53,"fill":"ordinary"},{"x":96,"y":-34.5,"fill":"ordinary"},{"x":97,"y":-51.3,"fill":"ordinary"},{"x":98,"y":-51.4,"fill":"ordinary"},{"x":99,"y":-256.1,"fill":"flagged"},{"x":100,"y":-252,"fill":"flagged"},{"x":101,"y":-234.7,"fill":"flagged"},{"x":102,"y":-265.8,"fill":"flagged"},{"x":103,"y":-247.3,"fill":"flagged"},{"x":104,"y":71.9,"fill":"ordinary"},{"x":105,"y":-16.2,"fill":"ordinary"},{"x":106,"y":16.1,"fill":"ordinary"},{"x":107,"y":0.2,"fill":"ordinary"},{"x":108,"y":13.5,"fill":"ordinary"},{"x":109,"y":6.4,"fill":"ordinary"},{"x":110,"y":12.9,"fill":"ordinary"},{"x":111,"y":0.1,"fill":"ordinary"},{"x":112,"y":18,"fill":"ordinary"},{"x":113,"y":-3.7,"fill":"ordinary"},{"x":114,"y":0.4,"fill":"ordinary"},{"x":115,"y":-44.3,"fill":"ordinary"},{"x":116,"y":-12.4,"fill":"ordinary"},{"x":117,"y":-8.9,"fill":"ordinary"},{"x":118,"y":113.3,"fill":"ordinary"},{"x":119,"y":-36.8,"fill":"ordinary"},{"x":120,"y":24.5,"fill":"ordinary"}],"geoms":["point"],"x":"day","y":"remainder","code":{"point":"ggplot(remainder_df, aes(day, remainder, color = anomaly)) +\n  geom_point()"}}

The chart above is the remainder series from the STL decomposition, with the 7 flagged days marked. They are exactly the same 7 real problems the residual check at k = 2 found, reached by a completely different route: splitting the series properly first, then testing what's left over against a rule that sets its own fence.

=== step === concept
## Comparing the three detectors on the same seven days

Three detectors, one scoreboard, over the same 7 real problems planted in this series.

::widget styled-table {"cols":["method","hits out of 7","false alarms","misses"],"rows":[["Global mean, plus or minus 3 standard deviations",1,0,6],["Residual z-score, k = 2",7,0,0],["anomalize (IQR or GESD)",7,0,0]],"title":"Three detectors on the same seven planted days","note":"Residual z only gets all seven right at this one hand-picked k. anomalize gets there with no k chosen by hand at all."}

The global mean and sd check catches 1 of the 7, with no false alarms, because it only ever looks for a point far from the whole series at once. The residual z-score check, with a day-of-week model behind it, catches all 7 with no false alarms, but only at one hand-picked cutoff, k = 2, reached by sweeping through several candidate values and keeping the one with no false alarms and no misses. `anomalize`'s IQR and GESD tests also catch all 7 with no false alarms, and neither one needed a k chosen by hand at all.

None of that makes the residual check useless. It is simpler to explain, and it is the right tool when you already know roughly what a normal day should look like and just want to watch for departures from it. But when you do not want to hand-tune a cutoff, decomposition-based detection gets to the same answer without one.

=== step === quiz
## Quick check: what does raising the threshold cost?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Raising k from 2 to 3 adds false alarms, in exchange for catching fewer misses. ::no
- Any k at or above 1.5 is free: it costs nothing to raise it that far. ::no
- Raising k from 2 to 3 trades 0 misses for 6 misses, at 0 false alarms either way, while anomalize caught all 7 with no threshold chosen by hand. ::ok Right. Sweeping the threshold showed k = 2 at 7 hits, 0 false alarms, 0 misses, and k = 3 at 1 hit, 0 false alarms, 6 misses: raising k cost misses here, not false alarms. anomalize reached the same 7 of 7 with no k at all.
- anomalize also needed a hand-picked k to reach 7 of 7. ::no
- A tighter threshold also fixes the problem caused by correlated residuals. ::no Raising k only changes how many misses or false alarms a fixed threshold produces on this one series. It does nothing about residuals that are correlated over time, a separate problem where a threshold's stated false-alarm rate stops matching its real one once residuals are not independent. Fixing that needs independent residuals, not a different k.

=== step === tryit
## Your turn: flag the real anomalies yourself

`rides`, `dow` and `dow_means` are already in your session. Compute the residual, turn it into a z-score, and flag every day where that z-score's absolute value goes over k = 2, the cutoff that gave this series 0 false alarms and 0 misses.

```r
# Your turn: compute each day's residual against its own weekday average, turn it into a z-score, then flag the days where it goes over a threshold
k <- 2

# YOUR CODE: compute my_resid from rides and dow_means, then my_z from my_resid and its own standard deviation, then which days have abs(my_z) over k

```
::check {"regex": "abs[(][^)]*[)]\\s*>\\s*k", "gate": true, "difficulty": "intermediate", "ok": "Exactly the 7 real problems planted in this series: days 46, 50, 99, 100, 101, 102 and 103, now reproduced in 3 lines instead of writing out the full table by hand.", "no": "Build it this way: my_resid <- rides - dow_means[dow], then my_z <- my_resid / sd(my_resid), then which(abs(my_z) > k)."}
::solution
```r
# Compute each day's residual against its own weekday average, convert it to a z-score, and flag the days over k
my_resid <- rides - dow_means[dow]
my_z <- my_resid / sd(my_resid)
which(abs(my_z) > k)
#> Thu Mon Mon Tue Wed Thu Fri 
#>  46  50  99 100 101 102 103 
```

=== step === concept
## References

- [STL decomposition (fpp3, Hyndman and Athanasopoulos)](https://otexts.com/fpp3/stl.html) - the trend, seasonal and remainder split behind decomposition-based detection.
- [Automatic Anomaly Detection in the Cloud Via Statistical Learning](https://arxiv.org/abs/1704.07706) - Hochenbaum, Vallis and Kejariwal (2017). The STL-plus-ESD method the `anomalize` package implements.
- Rosner, B. (1983), "Percentage Points for a Generalized ESD Many-Outlier Procedure," Technometrics, 25(2), 165-172. The GESD test used to flag outliers in a remainder.
- [anomalize package](https://cran.r-project.org/web/packages/anomalize/index.html) - Business Science. Documentation for `time_decompose()`, `anomalize()` and `time_recompose()`.
- Tukey, J.W. (1977), "Exploratory Data Analysis," Addison-Wesley. The interquartile-range fence the IQR method widens.

=== step === complete
## What you can do now

You can now tell three different problems apart under one word, "anomaly". A point anomaly is far from its own neighbours, like day 46's 1500 rides next to 787 and 811. A contextual anomaly looks ordinary next to its neighbours but wrong against what its own context, like its weekday, expects, like day 50's 545 rides on a day that normally runs well above that. A collective anomaly has no single extreme day, but a whole stretch, like days 99 to 103, breaking the pattern together.

You can also build two different detectors for them. Fit a model that captures the pattern, day-of-week means here, turn each day's gap from it into a residual and then a z-score, and pick a cutoff k: at k = 2 this series goes 7 hits, 0 false alarms, 0 misses, but that cutoff has to be found by sweeping through candidates, and it only holds its stated false-alarm rate if the residuals are independent over time. Or split the series properly first with an STL decomposition and test the remainder with `anomalize`'s IQR or GESD tests, which reached the same 7 of 7 with no cutoff chosen by hand at all.

One thing this lesson has not covered: what to do with an anomaly once you have found one. Deleting it, replacing it, or treating it as a known event are three different choices, each with its own consequences for whatever you do with the series next, and that decision is a separate job from the detection you just learned.

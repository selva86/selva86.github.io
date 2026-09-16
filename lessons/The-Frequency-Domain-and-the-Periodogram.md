---
title: "Spectral and Frequency Domain Analysis Lesson 1: The frequency domain and the periodogram"
catalog_blurb: "See a series as a sum of waves, then find its real cycles."
description: "See a noisy 70-day restaurant series as a sum of waves, run spec.pgram() in R to find its two real cycles, and learn why its raw noise never quiets down."
keywords: "periodogram, frequency domain, spec.pgram in R, frequency period and amplitude, spectral analysis, Fourier decomposition, seasonal time series, raw periodogram noise, cycles per day, time series in R"
post_type: "LESSON"
curriculum_id: "5.90.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-spectral"
course_title: "Spectral and Frequency Domain Analysis"
course_lesson: "1"
course_total: "5"
course_landing: "Spectral-and-Frequency-Domain-Analysis-Course.html"
course_next: "Estimating-the-Spectral-Density.html"
course_prev: ""
---

=== step === cover
## The frequency domain and the periodogram

Today let's understand the frequency domain and the periodogram, using ten weeks of a real restaurant's lunch covers as the running example.

Northside Diner is a lunch restaurant. Every day for ten weeks, seventy days in all, it logged how many covers it served, covers being the restaurant term for parties served a meal. Here is the whole seventy days, in the order they happened.

::widget chart-plotter {"data":[{"x":1,"y":110},{"x":2,"y":105},{"x":3,"y":101},{"x":4,"y":134},{"x":5,"y":174},{"x":6,"y":149},{"x":7,"y":108},{"x":8,"y":99},{"x":9,"y":88},{"x":10,"y":91},{"x":11,"y":119},{"x":12,"y":167},{"x":13,"y":144},{"x":14,"y":105},{"x":15,"y":68},{"x":16,"y":99},{"x":17,"y":93},{"x":18,"y":141},{"x":19,"y":146},{"x":20,"y":116},{"x":21,"y":114},{"x":22,"y":104},{"x":23,"y":111},{"x":24,"y":100},{"x":25,"y":140},{"x":26,"y":147},{"x":27,"y":135},{"x":28,"y":109},{"x":29,"y":80},{"x":30,"y":99},{"x":31,"y":88},{"x":32,"y":133},{"x":33,"y":157},{"x":34,"y":148},{"x":35,"y":98},{"x":36,"y":104},{"x":37,"y":104},{"x":38,"y":98},{"x":39,"y":130},{"x":40,"y":166},{"x":41,"y":127},{"x":42,"y":102},{"x":43,"y":105},{"x":44,"y":120},{"x":45,"y":91},{"x":46,"y":137},{"x":47,"y":165},{"x":48,"y":143},{"x":49,"y":109},{"x":50,"y":120},{"x":51,"y":95},{"x":52,"y":95},{"x":53,"y":130},{"x":54,"y":152},{"x":55,"y":129},{"x":56,"y":88},{"x":57,"y":109},{"x":58,"y":98},{"x":59,"y":113},{"x":60,"y":136},{"x":61,"y":178},{"x":62,"y":145},{"x":63,"y":108},{"x":64,"y":102},{"x":65,"y":117},{"x":66,"y":101},{"x":67,"y":116},{"x":68,"y":169},{"x":69,"y":141},{"x":70,"y":81}],"geoms":["line"],"x":"day","y":"covers"}

The line rises and falls, and it does that roughly once a week. That rise and fall is what this lesson is about: not just noticing that a series repeats, but naming the frequency it repeats at, and finding that frequency directly from the data with a tool called a periodogram.

=== step === concept
## Meet Northside Diner's ten weeks of lunch covers

Before anything else, build that series and look at its numbers directly, since every step from here on works with this same data.

```r
# Build ten weeks of Northside Diner's daily lunch covers
set.seed(2024)
day <- 1:70
baseline <- 120
fundamental <- 30 * cos(2 * pi * (day - 5) / 7)
harmonic <- 12 * cos(4 * pi * (day - 5) / 7)
noise <- rnorm(70, 0, 10)
northside_covers <- round(baseline + fundamental + harmonic + noise)

range(northside_covers)
round(mean(northside_covers), 1)
round(sd(northside_covers), 1)
#> [1]  68 178
#> [1] 119.2
#> [1] 25.4
```

The covers range from 68 on the slowest day to 178 on the busiest, averaging 119.2 a day with a standard deviation of 25.4. That's a lot of day-to-day swing for a restaurant that plans its staff and its prep roughly the same way every week.

Group those seventy days by weekday and average each group, and the swing turns out not to be random at all.

```r
# Average covers by day of week, Monday through Sunday
library(ggplot2)

day_names <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
weekday <- factor(day_names[((day - 1) %% 7) + 1], levels = day_names)
dow_means <- round(tapply(northside_covers, weekday, mean), 1)
dow_means
#>   Mon   Tue   Wed   Thu   Fri   Sat   Sun 
#> 100.1 103.6  97.1 131.6 162.1 137.7 102.2 

dow_df <- data.frame(weekday = factor(day_names, levels = day_names), covers = as.numeric(dow_means))
ggplot(dow_df, aes(weekday, covers)) +
  geom_col(fill = "#1f7a55") +
  labs(x = "day of week", y = "average covers")
```

Wednesday is the slowest day, 97.1 covers on average. Friday is the busiest by far, 162.1, with Saturday close behind at 137.7. That's a real, repeating weekly pattern, the same shape week after week, not just a few Fridays that happened to be busy.

Saying "there's a weekly pattern" is a start, but it isn't precise. The next step gives that pattern a name that can actually be measured.

=== step === concept
## A repeating wave has a frequency, a period, and an amplitude

A repeating pattern like Northside Diner's weekly rise and fall can be written as a wave: a curve that goes up, comes back down, and repeats the same shape over and over. Three numbers describe any such wave completely.

The period is how many days pass before the wave repeats itself exactly. The frequency is how many times it repeats in one day, which is just 1 divided by the period. And the amplitude is how far the wave swings above, and below, its centre, not the level it sits at.

Pull the 7-day wave out of Northside Diner's series on its own, with no noise and no second wave mixed in, and those three numbers become concrete.

```r
# Isolate the 7-day wave alone, with no noise and no second wave
wave_7day <- 30 * cos(2 * pi * (day - 5) / 7)

round(head(wave_7day, 7), 2)
#> [1] -27.03 -27.03  -6.68  18.70  30.00  18.70  -6.68

wave_df <- data.frame(day = day, wave = wave_7day)
wave_peak <- data.frame(day = 5, wave = 30)

ggplot(wave_df, aes(day, wave)) +
  geom_line(color = "#1f7a55", linewidth = 1) +
  geom_point(data = wave_peak, aes(day, wave), color = "#b04a52", size = 3) +
  geom_hline(yintercept = c(30, -30), linetype = "dashed", color = "grey60") +
  labs(x = "day", y = "covers above or below centre")
```

This wave takes 7 days to repeat, so its period is 7 days. Its frequency is 1/7, about 0.142857 cycles a day. And its amplitude is 30: the red point marks day 5, where the wave sits exactly 30 covers above its centre, and by the same symmetry it swings 30 covers below centre exactly half a cycle later, the dashed lines marking that ceiling and floor.

This one wave, on its own, is already most of the shape behind Northside Diner's Friday peak. But it isn't the whole shape. The next step adds a second wave on top of it.

=== step === concept
## Building the real shape by summing two waves

Northside Diner's real Friday peak is sharper than one 7-day wave alone can produce, and its early-week dip is flatter. That's because a second, smaller wave rides on top of the first one, a wave that repeats every 3.5 days instead of every 7.

Toggle between line and point below to see all three curves that build Northside Diner's real shape: the 7-day wave, the 3.5-day wave, and their sum.

::widget chart-plotter {"data":[{"x":1,"y":-27.03,"fill":"7-day wave"},{"x":2,"y":-27.03,"fill":"7-day wave"},{"x":3,"y":-6.68,"fill":"7-day wave"},{"x":4,"y":18.7,"fill":"7-day wave"},{"x":5,"y":30,"fill":"7-day wave"},{"x":6,"y":18.7,"fill":"7-day wave"},{"x":7,"y":-6.68,"fill":"7-day wave"},{"x":8,"y":-27.03,"fill":"7-day wave"},{"x":9,"y":-27.03,"fill":"7-day wave"},{"x":10,"y":-6.68,"fill":"7-day wave"},{"x":11,"y":18.7,"fill":"7-day wave"},{"x":12,"y":30,"fill":"7-day wave"},{"x":13,"y":18.7,"fill":"7-day wave"},{"x":14,"y":-6.68,"fill":"7-day wave"},{"x":15,"y":-27.03,"fill":"7-day wave"},{"x":16,"y":-27.03,"fill":"7-day wave"},{"x":17,"y":-6.68,"fill":"7-day wave"},{"x":18,"y":18.7,"fill":"7-day wave"},{"x":19,"y":30,"fill":"7-day wave"},{"x":20,"y":18.7,"fill":"7-day wave"},{"x":21,"y":-6.68,"fill":"7-day wave"},{"x":22,"y":-27.03,"fill":"7-day wave"},{"x":23,"y":-27.03,"fill":"7-day wave"},{"x":24,"y":-6.68,"fill":"7-day wave"},{"x":25,"y":18.7,"fill":"7-day wave"},{"x":26,"y":30,"fill":"7-day wave"},{"x":27,"y":18.7,"fill":"7-day wave"},{"x":28,"y":-6.68,"fill":"7-day wave"},{"x":29,"y":-27.03,"fill":"7-day wave"},{"x":30,"y":-27.03,"fill":"7-day wave"},{"x":31,"y":-6.68,"fill":"7-day wave"},{"x":32,"y":18.7,"fill":"7-day wave"},{"x":33,"y":30,"fill":"7-day wave"},{"x":34,"y":18.7,"fill":"7-day wave"},{"x":35,"y":-6.68,"fill":"7-day wave"},{"x":36,"y":-27.03,"fill":"7-day wave"},{"x":37,"y":-27.03,"fill":"7-day wave"},{"x":38,"y":-6.68,"fill":"7-day wave"},{"x":39,"y":18.7,"fill":"7-day wave"},{"x":40,"y":30,"fill":"7-day wave"},{"x":41,"y":18.7,"fill":"7-day wave"},{"x":42,"y":-6.68,"fill":"7-day wave"},{"x":43,"y":-27.03,"fill":"7-day wave"},{"x":44,"y":-27.03,"fill":"7-day wave"},{"x":45,"y":-6.68,"fill":"7-day wave"},{"x":46,"y":18.7,"fill":"7-day wave"},{"x":47,"y":30,"fill":"7-day wave"},{"x":48,"y":18.7,"fill":"7-day wave"},{"x":49,"y":-6.68,"fill":"7-day wave"},{"x":50,"y":-27.03,"fill":"7-day wave"},{"x":51,"y":-27.03,"fill":"7-day wave"},{"x":52,"y":-6.68,"fill":"7-day wave"},{"x":53,"y":18.7,"fill":"7-day wave"},{"x":54,"y":30,"fill":"7-day wave"},{"x":55,"y":18.7,"fill":"7-day wave"},{"x":56,"y":-6.68,"fill":"7-day wave"},{"x":57,"y":-27.03,"fill":"7-day wave"},{"x":58,"y":-27.03,"fill":"7-day wave"},{"x":59,"y":-6.68,"fill":"7-day wave"},{"x":60,"y":18.7,"fill":"7-day wave"},{"x":61,"y":30,"fill":"7-day wave"},{"x":62,"y":18.7,"fill":"7-day wave"},{"x":63,"y":-6.68,"fill":"7-day wave"},{"x":64,"y":-27.03,"fill":"7-day wave"},{"x":65,"y":-27.03,"fill":"7-day wave"},{"x":66,"y":-6.68,"fill":"7-day wave"},{"x":67,"y":18.7,"fill":"7-day wave"},{"x":68,"y":30,"fill":"7-day wave"},{"x":69,"y":18.7,"fill":"7-day wave"},{"x":70,"y":-6.68,"fill":"7-day wave"},{"x":1,"y":7.48,"fill":"3.5-day wave"},{"x":2,"y":7.48,"fill":"3.5-day wave"},{"x":3,"y":-10.81,"fill":"3.5-day wave"},{"x":4,"y":-2.67,"fill":"3.5-day wave"},{"x":5,"y":12,"fill":"3.5-day wave"},{"x":6,"y":-2.67,"fill":"3.5-day wave"},{"x":7,"y":-10.81,"fill":"3.5-day wave"},{"x":8,"y":7.48,"fill":"3.5-day wave"},{"x":9,"y":7.48,"fill":"3.5-day wave"},{"x":10,"y":-10.81,"fill":"3.5-day wave"},{"x":11,"y":-2.67,"fill":"3.5-day wave"},{"x":12,"y":12,"fill":"3.5-day wave"},{"x":13,"y":-2.67,"fill":"3.5-day wave"},{"x":14,"y":-10.81,"fill":"3.5-day wave"},{"x":15,"y":7.48,"fill":"3.5-day wave"},{"x":16,"y":7.48,"fill":"3.5-day wave"},{"x":17,"y":-10.81,"fill":"3.5-day wave"},{"x":18,"y":-2.67,"fill":"3.5-day wave"},{"x":19,"y":12,"fill":"3.5-day wave"},{"x":20,"y":-2.67,"fill":"3.5-day wave"},{"x":21,"y":-10.81,"fill":"3.5-day wave"},{"x":22,"y":7.48,"fill":"3.5-day wave"},{"x":23,"y":7.48,"fill":"3.5-day wave"},{"x":24,"y":-10.81,"fill":"3.5-day wave"},{"x":25,"y":-2.67,"fill":"3.5-day wave"},{"x":26,"y":12,"fill":"3.5-day wave"},{"x":27,"y":-2.67,"fill":"3.5-day wave"},{"x":28,"y":-10.81,"fill":"3.5-day wave"},{"x":29,"y":7.48,"fill":"3.5-day wave"},{"x":30,"y":7.48,"fill":"3.5-day wave"},{"x":31,"y":-10.81,"fill":"3.5-day wave"},{"x":32,"y":-2.67,"fill":"3.5-day wave"},{"x":33,"y":12,"fill":"3.5-day wave"},{"x":34,"y":-2.67,"fill":"3.5-day wave"},{"x":35,"y":-10.81,"fill":"3.5-day wave"},{"x":36,"y":7.48,"fill":"3.5-day wave"},{"x":37,"y":7.48,"fill":"3.5-day wave"},{"x":38,"y":-10.81,"fill":"3.5-day wave"},{"x":39,"y":-2.67,"fill":"3.5-day wave"},{"x":40,"y":12,"fill":"3.5-day wave"},{"x":41,"y":-2.67,"fill":"3.5-day wave"},{"x":42,"y":-10.81,"fill":"3.5-day wave"},{"x":43,"y":7.48,"fill":"3.5-day wave"},{"x":44,"y":7.48,"fill":"3.5-day wave"},{"x":45,"y":-10.81,"fill":"3.5-day wave"},{"x":46,"y":-2.67,"fill":"3.5-day wave"},{"x":47,"y":12,"fill":"3.5-day wave"},{"x":48,"y":-2.67,"fill":"3.5-day wave"},{"x":49,"y":-10.81,"fill":"3.5-day wave"},{"x":50,"y":7.48,"fill":"3.5-day wave"},{"x":51,"y":7.48,"fill":"3.5-day wave"},{"x":52,"y":-10.81,"fill":"3.5-day wave"},{"x":53,"y":-2.67,"fill":"3.5-day wave"},{"x":54,"y":12,"fill":"3.5-day wave"},{"x":55,"y":-2.67,"fill":"3.5-day wave"},{"x":56,"y":-10.81,"fill":"3.5-day wave"},{"x":57,"y":7.48,"fill":"3.5-day wave"},{"x":58,"y":7.48,"fill":"3.5-day wave"},{"x":59,"y":-10.81,"fill":"3.5-day wave"},{"x":60,"y":-2.67,"fill":"3.5-day wave"},{"x":61,"y":12,"fill":"3.5-day wave"},{"x":62,"y":-2.67,"fill":"3.5-day wave"},{"x":63,"y":-10.81,"fill":"3.5-day wave"},{"x":64,"y":7.48,"fill":"3.5-day wave"},{"x":65,"y":7.48,"fill":"3.5-day wave"},{"x":66,"y":-10.81,"fill":"3.5-day wave"},{"x":67,"y":-2.67,"fill":"3.5-day wave"},{"x":68,"y":12,"fill":"3.5-day wave"},{"x":69,"y":-2.67,"fill":"3.5-day wave"},{"x":70,"y":-10.81,"fill":"3.5-day wave"},{"x":1,"y":-19.55,"fill":"sum"},{"x":2,"y":-19.55,"fill":"sum"},{"x":3,"y":-17.49,"fill":"sum"},{"x":4,"y":16.03,"fill":"sum"},{"x":5,"y":42,"fill":"sum"},{"x":6,"y":16.03,"fill":"sum"},{"x":7,"y":-17.49,"fill":"sum"},{"x":8,"y":-19.55,"fill":"sum"},{"x":9,"y":-19.55,"fill":"sum"},{"x":10,"y":-17.49,"fill":"sum"},{"x":11,"y":16.03,"fill":"sum"},{"x":12,"y":42,"fill":"sum"},{"x":13,"y":16.03,"fill":"sum"},{"x":14,"y":-17.49,"fill":"sum"},{"x":15,"y":-19.55,"fill":"sum"},{"x":16,"y":-19.55,"fill":"sum"},{"x":17,"y":-17.49,"fill":"sum"},{"x":18,"y":16.03,"fill":"sum"},{"x":19,"y":42,"fill":"sum"},{"x":20,"y":16.03,"fill":"sum"},{"x":21,"y":-17.49,"fill":"sum"},{"x":22,"y":-19.55,"fill":"sum"},{"x":23,"y":-19.55,"fill":"sum"},{"x":24,"y":-17.49,"fill":"sum"},{"x":25,"y":16.03,"fill":"sum"},{"x":26,"y":42,"fill":"sum"},{"x":27,"y":16.03,"fill":"sum"},{"x":28,"y":-17.49,"fill":"sum"},{"x":29,"y":-19.55,"fill":"sum"},{"x":30,"y":-19.55,"fill":"sum"},{"x":31,"y":-17.49,"fill":"sum"},{"x":32,"y":16.03,"fill":"sum"},{"x":33,"y":42,"fill":"sum"},{"x":34,"y":16.03,"fill":"sum"},{"x":35,"y":-17.49,"fill":"sum"},{"x":36,"y":-19.55,"fill":"sum"},{"x":37,"y":-19.55,"fill":"sum"},{"x":38,"y":-17.49,"fill":"sum"},{"x":39,"y":16.03,"fill":"sum"},{"x":40,"y":42,"fill":"sum"},{"x":41,"y":16.03,"fill":"sum"},{"x":42,"y":-17.49,"fill":"sum"},{"x":43,"y":-19.55,"fill":"sum"},{"x":44,"y":-19.55,"fill":"sum"},{"x":45,"y":-17.49,"fill":"sum"},{"x":46,"y":16.03,"fill":"sum"},{"x":47,"y":42,"fill":"sum"},{"x":48,"y":16.03,"fill":"sum"},{"x":49,"y":-17.49,"fill":"sum"},{"x":50,"y":-19.55,"fill":"sum"},{"x":51,"y":-19.55,"fill":"sum"},{"x":52,"y":-17.49,"fill":"sum"},{"x":53,"y":16.03,"fill":"sum"},{"x":54,"y":42,"fill":"sum"},{"x":55,"y":16.03,"fill":"sum"},{"x":56,"y":-17.49,"fill":"sum"},{"x":57,"y":-19.55,"fill":"sum"},{"x":58,"y":-19.55,"fill":"sum"},{"x":59,"y":-17.49,"fill":"sum"},{"x":60,"y":16.03,"fill":"sum"},{"x":61,"y":42,"fill":"sum"},{"x":62,"y":16.03,"fill":"sum"},{"x":63,"y":-17.49,"fill":"sum"},{"x":64,"y":-19.55,"fill":"sum"},{"x":65,"y":-19.55,"fill":"sum"},{"x":66,"y":-17.49,"fill":"sum"},{"x":67,"y":16.03,"fill":"sum"},{"x":68,"y":42,"fill":"sum"},{"x":69,"y":16.03,"fill":"sum"},{"x":70,"y":-17.49,"fill":"sum"}],"geoms":["line","point"],"x":"day","y":"covers above or below centre"}

The 3.5-day wave has amplitude 12, a little under half the 7-day wave's 30, and it completes two full cycles inside every seven days, twice the 7-day wave's frequency. That makes it what's called a harmonic of the 7-day wave. Added together, the two waves peak on the same day, Friday: 30 from the 7-day wave plus 12 from the 3.5-day wave, 42 in total, a sharper peak than the 7-day wave gives on its own.

This is the whole idea behind splitting a series into waves: any repeating shape, however complicated, can be built by adding together enough sine and cosine waves at the right frequencies and amplitudes. Northside Diner's real series needs only two.

=== step === quiz
## Quick check: frequency, period and amplitude

The widget above also carries the 3.5-day wave, amplitude 12, completing one full cycle every 3.5 days.

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Its frequency is 2/7, about 0.286 cycles a day, twice the 7-day wave's 1/7, and its amplitude, 12, is how far it swings above and below its centre. ::ok Right. Frequency is always 1 divided by the period: 1 / 3.5 = 2/7, about 0.286 cycles a day, double the 7-day wave's 1/7. And amplitude is the swing away from centre in each direction, never a level the series sits at.
- Its frequency is 3.5 cycles a day, the same number as its period. ::no
- Its amplitude, 12, is the average number of covers the wave adds, not how far it swings. ::no Amplitude is always the swing above and below centre, never an average: this wave pushes covers 12 higher at its peak and 12 lower at its trough. And frequency is 1 divided by the period, not the period itself: a 3.5-day period gives 1 / 3.5 = 2/7, about 0.286 cycles a day, double the 7-day wave's 1/7.

=== step === concept
## spec.pgram() turns a noisy series into a list of frequencies

Northside Diner's real series isn't two clean waves. It's those two waves plus random noise, day-to-day variation with no pattern at all. Picking frequencies out of a series like that by eye, the way the last two steps did, doesn't work once noise is mixed in. What's needed is a tool that checks every candidate frequency at once and reports how much of the series' variation each one explains.

That tool is called a periodogram, and base R builds one with a function called spec.pgram(). Feed it Northside Diner's actual covers, noise included, and see what it finds.

```r
# Turn the noisy covers series into a periodogram: one ordinate per candidate frequency
pg <- spec.pgram(ts(northside_covers), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)

length(pg$freq)
#> [1] 35

top6 <- order(pg$spec, decreasing = TRUE)[1:6]
data.frame(
  frequency = round(pg$freq[top6], 6),
  period = round(1 / pg$freq[top6], 3),
  ordinate = round(pg$spec[top6], 1)
)
#>   frequency period ordinate
#> 1  0.142857  7.000  14997.4
#> 2  0.285714  3.500   3576.7
#> 3  0.442857  2.258    345.8
#> 4  0.071429 14.000    334.1
#> 5  0.271429  3.684    307.6
#> 6  0.185714  5.385    269.2
```

spec.pgram() checked 35 candidate frequencies, one for every k/70 from 1/70 up to 0.5. A series sampled once a day can never show a cycle faster than once every two days, which is why the frequencies stop at 0.5. The arguments above turn off every adjustment spec.pgram() knows how to make: taper = 0 and detrend = FALSE skip its usual tapering and trend removal, demean = TRUE only centres the series, and fast = FALSE keeps the frequency grid exactly at k/70. What comes back is a raw periodogram, untouched by any smoothing. For each frequency it returns a number called an ordinate: how strongly the series moves in step with a wave of exactly that frequency. The taller the ordinate, the more of the series' variation that frequency explains.

Two ordinates tower over the rest. Frequency 0.142857, which is 1/7, the exact frequency of the 7-day wave built into this series, has ordinate 14,997.4. Frequency 0.285714, 2/7, the exact frequency of the 3.5-day wave, has ordinate 3,576.7, a good deal smaller but still far ahead of anything else. Every other ordinate in the table sits under 350.

That's the periodogram working as intended: both real frequencies, 1/7 and 2/7, come straight out of a noisy series, with no need to know in advance where to look.

=== step === concept
## Away from the two real peaks, the periodogram is jagged

Those two tall ordinates are only 2 of the 35 the periodogram computed. Read the other 33 on their own, away from frequencies 1/7 and 2/7, and a different picture shows up: no smooth curve, no gentle slope down from the peaks, just a scatter of small numbers jumping around with no obvious pattern.

The two real peaks are left out of the chart below on purpose, since they already had their moment in the last step: the taller of the two alone stands over forty times higher than the tallest point on this floor, so on the same chart it would flatten the floor down to a line hugging zero. Toggle between line and point to see the floor's raggedness both ways.

::widget chart-plotter {"data":[{"x":0.014286,"y":175.5},{"x":0.028571,"y":34.8},{"x":0.042857,"y":49.6},{"x":0.057143,"y":140.6},{"x":0.071429,"y":334.1},{"x":0.085714,"y":172.3},{"x":0.1,"y":65},{"x":0.114286,"y":89.8},{"x":0.128571,"y":62.4},{"x":0.157143,"y":54.4},{"x":0.171429,"y":40.4},{"x":0.185714,"y":269.2},{"x":0.2,"y":135.6},{"x":0.214286,"y":59.8},{"x":0.228571,"y":67.4},{"x":0.242857,"y":3.1},{"x":0.257143,"y":80.2},{"x":0.271429,"y":307.6},{"x":0.3,"y":31},{"x":0.314286,"y":252},{"x":0.328571,"y":97},{"x":0.342857,"y":121.4},{"x":0.357143,"y":33.2},{"x":0.371429,"y":23.1},{"x":0.385714,"y":28.9},{"x":0.4,"y":10.8},{"x":0.414286,"y":113.3},{"x":0.428571,"y":35.9},{"x":0.442857,"y":345.8},{"x":0.457143,"y":25.9},{"x":0.471429,"y":184},{"x":0.485714,"y":149.7},{"x":0.5,"y":54.9}],"geoms":["line","point"],"x":"frequency","y":"ordinate"}

That's genuinely what a raw periodogram looks like away from a real cycle: no smooth decline, no story, just noise. And this isn't a sign that anything went wrong. Northside Diner's series was built from exactly two waves plus noise, nothing else, and the periodogram still came back this jagged everywhere except at those two frequencies. The next step explains why that jaggedness never goes away, no matter how much data you add.

=== step === concept
## Why a raw ordinate does not get quieter with more data

A natural guess: an ordinate looks noisy with 70 days of data, so collecting more data, say 700 days instead of 70, should calm it down, the way a sample mean gets more precise with a bigger sample. Test that guess directly. Rebuild Northside Diner's series 400 times over, with fresh random noise each time, at 70 days and then again at 700 days, and watch what happens to one ordinate with no real cycle behind it and one that has a real cycle behind it.

```r
# Rebuild the same diner series many times, and see whether a periodogram ordinate calms down
simulate_ordinates <- function(n, reps, seed, floor_freq = 0.30, peak_freq = 1 / 7) {
  set.seed(seed)
  d <- 1:n
  base_f <- 30 * cos(2 * pi * (d - 5) / 7)
  base_h <- 12 * cos(4 * pi * (d - 5) / 7)
  floor_vals <- numeric(reps)
  peak_vals <- numeric(reps)
  for (i in 1:reps) {
    series <- round(120 + base_f + base_h + rnorm(n, 0, 10))
    p <- spec.pgram(ts(series), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
    floor_vals[i] <- p$spec[which.min(abs(p$freq - floor_freq))]
    peak_vals[i] <- p$spec[which.min(abs(p$freq - peak_freq))]
  }
  c(floor_mean = mean(floor_vals), floor_sd = sd(floor_vals),
    peak_mean = mean(peak_vals), peak_sd = sd(peak_vals))
}

r70 <- simulate_ordinates(70, 400, 11)
r700 <- simulate_ordinates(700, 400, 11)
round(r70, 1)
round(r700, 1)
#> floor_mean   floor_sd  peak_mean    peak_sd 
#>       99.0       95.0    15792.8     1821.0 
#> floor_mean   floor_sd  peak_mean    peak_sd 
#>       94.7       91.6   157602.8     5622.0 
```

Look at the floor ordinate first, the one near frequency 0.30 where nothing real repeats. At 70 days, across the 400 reruns, it averages 99.0 with a standard deviation of 95.0, almost as large as the mean itself, about 96%. At 700 days, ten times the data, it averages 94.7 with a standard deviation of 91.6, still about 97% of the mean. Ten times the data bought this ordinate nothing: it's exactly as unreliable at 700 days as it was at 70.

Now look at the real peak, the ordinate at frequency 1/7. At 70 days it averages 15,792.8 with a standard deviation of 1,821.0, about 11.5% of the mean. At 700 days it averages 157,602.8 with a standard deviation of 5,622.0, about 3.6% of the mean. This one did settle down. More data made it far more reliable.

So the same fix, more data, works for a real cycle and does nothing for noise. That's because of how spec.pgram() works: more days don't hand any single ordinate more information about itself, they just add more ordinates to the list, one for every new k/n. A real cycle's ordinate keeps concentrating the same total power onto fewer and fewer neighbouring frequencies as n grows, and that concentration is what settles it down. A floor ordinate has no such concentration to fall back on. It's just noise, computed the same jittery way no matter how long the series runs.

[KEY INSIGHT]
A raw periodogram ordinate away from a real cycle does not get more reliable with more data. Only an ordinate that sits on a genuine cycle does.

=== step === quiz
## Closing quiz: reading and trusting a periodogram

A different series' periodogram comes back with one tall ordinate at frequency 0.25, and every other ordinate low and jagged, the same way Northside Diner's floor looked two steps back.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The tall ordinate points to a real cycle with period 1 / 0.25 = 4, and the jagged rest is expected, not a sign the series needs more data. ::ok Right. A tall ordinate marks a real frequency, and its period is always 1 divided by that frequency: 1 / 0.25 = 4. The ragged floor around it is exactly what a raw periodogram looks like away from a real cycle, proven two steps back, not a symptom to fix with more data.
- The jagged ordinates mean this series needs more data before the periodogram can be trusted. ::no
- Frequency 0.25 means the cycle repeats every 0.25 days. ::no Frequency and period are reciprocals, never the same number. Frequency 0.25 means the cycle repeats every 1 / 0.25 = 4 time units, not every 0.25 of one. And a jagged floor isn't a data shortage: the earlier replicate simulation showed ten times the data left a floor ordinate exactly as noisy, so a ragged floor next to one tall spike is the periodogram working correctly, not a warning sign.

=== step === tryit
## Your turn: read a period off a periodogram peak

pg, from a few steps back, still holds all 35 frequencies and their ordinates, in pg$freq and pg$spec. Find the biggest ordinate with which.max(), read off its frequency, then turn that frequency into a period.

```r
# pg still holds the periodogram from a few steps back, with pg$freq
# and pg$spec.
# Find the frequency of the biggest ordinate using which.max(), then
# print 1 divided by that frequency: the period.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*which[.]max[(]\\s*pg[$]spec\\s*[)])(?=[\\s\\S]*1\\s*/\\s*pg[$]freq)", "gate": true, "difficulty": "beginner", "ok": "Right: frequency 0.142857, period 7, the same 7-day cycle the periodogram found back in the spec.pgram() step.", "no": "Index pg$freq at which.max(pg$spec) to get the frequency, then divide 1 by that same expression to get the period: pg$freq[which.max(pg$spec)] and 1 / pg$freq[which.max(pg$spec)]."}
::solution
```r
# Find the frequency of the biggest ordinate, then its period
which.max(pg$spec)
pg$freq[which.max(pg$spec)]
1 / pg$freq[which.max(pg$spec)]
#> [1] 10
#> [1] 0.1428571
#> [1] 7
```

=== step === concept
## References

- [Shumway, R.H. & Stoffer, D.S. (2017), Time Series Analysis and Its Applications (4th ed.)](https://www.stat.pitt.edu/stoffer/tsa4/) - Springer, Ch. 4 "Spectral Analysis and Filtering": the sum-of-waves representation, the periodogram, and its large-sample noise.
- [Chatfield, C. (2003), The Analysis of Time Series: An Introduction (6th ed.)](https://www.routledge.com/The-Analysis-of-Time-Series-An-Introduction-with-R/Chatfield-Xing/p/book/9781498706954) - Chapman & Hall/CRC, Ch. 7 "Spectral Analysis": frequency, period and the raw periodogram.
- [Venables, W.N. & Ripley, B.D. (2002), Modern Applied Statistics with S (4th ed.)](http://www.stats.ox.ac.uk/pub/MASS4/) - Springer, Ch. 14 "Time Series Analysis": background for R's spec.pgram().
- [R documentation, stats::spec.pgram()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html)

=== step === complete
## Quick recap

You can now look at a repeating series and name what's really driving the repetition, not just eyeball it. To summarize:

- Any repeating series can be written as a sum of waves, each with a frequency (cycles per day), a period (days per cycle) and an amplitude (the swing above and below centre).
- spec.pgram() turns a series into one ordinate per candidate frequency, and the tallest ordinates point straight at the real cycles: 1/7 and 2/7 here.
- Away from a real cycle, an ordinate's relative noise does not shrink with more data. It stayed at about 96% to 97% of the mean whether the series ran 70 days or 700.

Next, you'll smooth the periodogram on purpose, trading away some of that noise for a steadier picture of the spectrum.

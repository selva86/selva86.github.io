---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
description: "Learn power analysis in R with power.t.test(): check if a planned study is big enough, solve for sample size, and find the smallest detectable effect."
keywords: "power analysis in R, power.t.test, sample size calculation, statistical power, effect size, Cohen's d, Type I and Type II error, hypothesis testing"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-3"
course_next: "Inference-Mini-5"
curriculum_id: "0.0.7"
lesson_access: "windowed"
catalog_blurb: "How many patients your study actually needs, worked out with one R function."
---

=== step === cover
## Power analysis: find the sample size you need

Today, let's work out exactly how many patients a study needs before you ever run it.

Say a clinic wants to test whether an 8 week exercise program lowers blood pressure. Forty patients have signed up: 20 will follow the program, 20 will carry on with usual care. The clinic expects the program group's blood pressure to drop about 10 mmHg more than the usual care group's over those 8 weeks.

Here is the whole plan the clinic is running, in four steps.

::widget process-flow {"steps": [{"title": "Recruit 40 patients", "sub": "eligible adults willing to join the 8 week study"}, {"title": "Randomize into two groups", "sub": "20 assigned to the exercise program, 20 to usual care"}, {"title": "Measure blood pressure", "sub": "record systolic BP before the program starts and again after 8 weeks"}, {"title": "Compare the average drop", "sub": "average change in the program group against average change in the usual care group"}]}

That is the whole plan. The question this lesson answers: does 40 patients give that comparison a fair shot at a reliable result?

=== step === concept
## Forty patients, two groups: is that enough?

Here is the plan again, in numbers this time.

There are forty patients in total. Twenty go into the program group, 20 into usual care. Every patient gets their blood pressure measured before the program starts and again after 8 weeks. The "change" for each patient is the after reading minus the before reading, so a bigger drop shows up as a more negative number.

The clinic expects the program group's average change to be about 10 mmHg more negative than the usual care group's average change. It also assumes that this change varies from patient to patient with a standard deviation of about 15 mmHg: some patients will drop far more than 10 mmHg, some barely move, and a few might even rise a little. That spread is normal in any real measurement on real people.

Here is what that could look like for a handful of patients. Press Run.

```r
# Simulate 8 illustrative patients (4 program, 4 usual care) to see the shape of the data
set.seed(2024)
before <- round(rnorm(8, mean = 150, sd = 8))
drop_program <- round(rnorm(4, mean = 12, sd = 3))
drop_usual   <- round(rnorm(4, mean = 3,  sd = 3))
after <- c(before[1:4] - drop_program, before[5:8] - drop_usual)

bp_patients <- data.frame(
  group  = rep(c("Program", "Usual care"), each = 4),
  before = before,
  after  = after
)
bp_patients$change <- bp_patients$after - bp_patients$before
bp_patients
#>        group before after change
#> 1    Program    158   150     -8
#> 2    Program    154   145     -9
#> 3    Program    149   142     -7
#> 4    Program    148   135    -13
#> 5 Usual care    159   154     -5
#> 6 Usual care    160   156     -4
#> 7 Usual care    154   161      7
#> 8 Usual care    149   146     -3
```

Each row is one patient: their blood pressure before, after, and the change between the two. This is only 8 patients and made up to show the shape of the data, not the real study, so do not read too much into these particular numbers. From here on, the planning numbers are the ones the clinic actually expects: a gap of 10 mmHg between the two groups' average change, with a standard deviation of about 15 mmHg on each patient's own change.

So here is the real question underneath all this. With only 20 patients in each group, if that hoped-for 10 mmHg gap is really there, will the study's own test actually catch it? Or could the trial come back with nothing to show, even though the program works?

=== step === widget
## Type I error, Type II error, and what power means

To answer that, start with what "catching it" even means for a test.

Every comparison like this starts from a **null hypothesis**, written H0: the program changes nothing, and the true difference in average drop between the two groups is zero. You look at the data and ask whether there is enough evidence against H0 to reject it.

A test like this can be wrong in two different ways.

- A **Type I error** is a false alarm: the test rejects H0 and says the program works, when really it does nothing. How often you are willing to let that happen is called the significance level, written alpha, and it is conventionally set at 0.05, a 5% false-alarm rate.
- A **Type II error** is a miss: the test fails to reject H0, when the program genuinely does work. How often that happens is written beta.

**Power** is 1 minus beta: the chance the test correctly catches a real effect when there is one to catch.

Before dragging anything, here is the test statistic the trial would produce if the drop gap really were the full 10 mmHg with 20 patients in each group.

```r
# Standardized test statistic for a 10 mmHg gap, sd 15, n = 20 per group
t_stat <- 10 / (15 * sqrt(2 / 20))
round(t_stat, 2)
#> [1] 2.11
```

15 is the assumed standard deviation, and `sqrt(2 / 20)` is how much that standard deviation shrinks once you are comparing two averages, each built from 20 patients, instead of one raw measurement. Dividing the hoped-for 10 mmHg gap by that shrunk spread turns mmHg into a standardized distance: how many of those spreads the gap represents.

The widget below plots the same kind of curve a t-test compares its statistic against. Its horizontal axis is a standardized test statistic, not mmHg directly, and it starts well below 2.11.

::widget null-distribution {"tails": 2, "max": 4, "start": 0.5, "label": "test statistic"}

Drag the slider up toward 2.11, the number computed above. Watch the shaded tail area, which is the p-value, shrink as you go, and watch the readout flip from "fail to reject H0" to "reject H0" once the tail drops under 0.05. That flip, at a statistic just past about 1.96 on either side, is what a false alarm rate of 0.05 actually buys you: reject only when the result is that far from what H0 predicts.

Now drag it back down toward zero. The tail swells past 0.05 again, and the readout goes back to "fail to reject H0", even in a story where the program genuinely works. That is what a Type II error looks like from the inside: not a mistake in the arithmetic, just not enough signal in the data to cross the significance threshold.

=== step === quiz
## Quick check: what low power really means

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Low power means the test raises false alarms too often. ::no
- Low power means the test often fails to detect a real effect that is actually there. ::ok Yes. Low power is a Type II error problem: the test misses a real signal, it does not raise false alarms. A study with power around 0.54, like the clinic's 20 per group plan, only catches a true 10 mmHg gap about half the time.
- Low power means the significance level was set too strict. ::no
- Low power means the study collected too little data to compute a p-value at all. ::no A test still runs and returns a p-value no matter how few patients you have. Low power is not about whether the test can run, it is about whether it catches a real effect when one exists. That is a Type II error, a miss, not a false alarm and not a broken calculation.

=== step === concept
## Effect size: turning a 10 point drop into a number you can compare

Power depends on how big an effect is relative to the noise around it, not on the raw number of points alone. Statisticians standardize this with an effect size, and for a two-group comparison like this one, the standard choice is Cohen's d: the raw difference divided by the standard deviation.

\[ d = \frac{\Delta}{\sigma} \]

Here \(\Delta\) is the gap you are hoping to see between the two groups, and \(\sigma\) is the standard deviation you assumed for each patient's own change.

```r
# Effect size: the hoped-for gap divided by the assumed standard deviation
delta    <- 10  # mmHg, the hoped-for average gap between groups
sd_change <- 15 # mmHg, assumed standard deviation of each patient's change
d <- delta / sd_change
round(d, 2)
#> [1] 0.67
```

Cohen suggested rough benchmarks for interpreting a d value: 0.2 is a small effect, 0.5 is medium, 0.8 is large. This trial's d, about 0.67, sits between medium and large: a decent sized effect, if it is really there.

One thing worth flagging about that 15 mmHg standard deviation: it almost always comes from a small pilot study or a similar published trial, since the real study has not happened yet. A small pilot's own effect size estimate is noisy. Run the same pilot again with different patients and you could get a noticeably different number. So treat a pilot's own d as a sanity check on your assumption, not as the number you plan the whole study around.

=== step === concept
## The four quantities behind every power calculation

Every power calculation balances four quantities against each other: how many patients you recruit (n), how big the effect is (delta and the standard deviation, or the effect size they form), how strict your false-alarm rate is (alpha, usually 0.05), and power itself (the chance of catching a real effect).

Base R's `power.t.test()` function takes any three of these and solves for the fourth. Leave one argument blank, as `NULL`, and it works out what that one has to be.

Start with the plan the clinic already has: 20 patients per group, hoping for a 10 mmHg gap with a standard deviation of 15. Leave `power` blank and see what it comes out to.

```r
# Solve for power, given n, delta, sd and sig.level
trial_power <- power.t.test(
  n         = 20,
  delta     = 10,
  sd        = 15,
  sig.level = 0.05,
  type      = "two.sample"
)
trial_power
#>      Two-sample t test power calculation 
#> 
#>               n = 20
#>           delta = 10
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.5377573
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

Read the power line: 0.5377573, about 54%. With 20 patients in each group, if the program really does lower blood pressure by 10 mmHg more than usual care, the study only has about a 54% chance of catching it. That is barely better than a coin flip. Run this exact study 100 times and you would expect it to come back significant only around 54 of those times, even though the effect is genuinely present in every single one. The other 46 times, the trial would report no significant difference, and it would be wrong to interpret that as the program not working. That is a Type II error, sitting right there in the 40 patient plan the clinic started with.

=== step === concept
## Solving for the sample size 80% power actually needs

So 20 per group is not enough. The natural next question: how many would be enough?

Flip the same function around. This time leave `n` blank and set `power` to 0.80, the conventional target most fields use: an 80% chance of catching a real effect.

```r
# Solve for the sample size that reaches 80% power
n_for_80 <- power.t.test(
  power     = 0.80,
  delta     = 10,
  sd        = 15,
  sig.level = 0.05,
  type      = "two.sample"
)
n_for_80
#>      Two-sample t test power calculation 
#> 
#>               n = 36.3058
#>           delta = 10
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

n comes out to 36.3 per group. You cannot recruit 0.3 of a patient, and rounding down would leave the study just short of its own 80% target, so always round up.

```r
# Round up to a whole number of patients, then double for both arms
ceiling(n_for_80$n)
#> [1] 37
2 * ceiling(n_for_80$n)
#> [1] 74
```

That is 37 in the program group and 37 in usual care, 74 patients in total. The clinic planned on 40. To reach 80% power for the effect it actually expects, it needs almost double that.

=== step === concept
## The smallest effect a 20 patient study could actually detect

There is a third way to use the same four numbers. Suppose the clinic is stuck at 20 patients per group, maybe that is all the budget allows, and still wants 80% power. What is the smallest gap it could reliably detect at that size? This time leave `delta` blank instead.

```r
# Solve for the smallest detectable effect at a fixed n and power
min_detectable <- power.t.test(
  n         = 20,
  power     = 0.80,
  sd        = 15,
  sig.level = 0.05,
  type      = "two.sample"
)
min_detectable
#>      Two-sample t test power calculation 
#> 
#>               n = 20
#>           delta = 13.63696
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

delta comes out to about 13.6 mmHg. At 20 patients per group, the study can reliably detect, 80% of the time, only drops of 13.6 mmHg or bigger. The clinic is hoping for 10 mmHg. Its own planned study is not sized to reliably catch the effect it is actually looking for: anything smaller than 13.6 mmHg is, at 20 per group, more likely to be missed than caught.

=== step === widget
## How power rises as the study grows

One picture pulls together every number seen so far: how power rises as the sample size grows.

The widget below sweeps n from small to large and traces power against it, for a chosen effect size in the same standardized d units as Cohen's d. Try the medium (d = 0.5) and large (d = 0.8) settings. This trial's own effect, d about 0.67, sits between them.

::widget power-curve {}

At medium, the marked point lands at n about 63 per group for 80% power. At large, it drops to about 25. This trial's own d, about 0.67, sits between 0.5 and 0.8, and sure enough, the sample size already solved for 80% power, 37 per group, lands right between those two marks.

The curve also shows why the study is worth resizing. It climbs fast at first, then flattens out. Going from n = 20, where this trial started, up toward n = 37 buys a large jump in power. Past that point, each extra patient buys less and less.

=== step === quiz
## Quick check: judging whether this study is big enough

The power curve shows n = 20 sitting well short of the 80% line for an effect this size. Here is one more number worth having: what if the program's true effect turns out to be smaller than hoped, say 8 mmHg instead of 10?

```r
# Power at n = 20 if the true effect is only 8 mmHg, not 10
round(power.t.test(n = 20, delta = 8, sd = 15, sig.level = 0.05, type = "two.sample")$power, 3)
#> [1] 0.376
```

The clinic runs its planned study at 20 patients per group. The program's true effect turns out to be only 8 mmHg, not the hoped-for 10. The study comes back with p > 0.05, not statistically significant. What does that most likely mean?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The program definitely does not work. ::no
- The test made a Type I error, a false alarm. ::no
- The study most likely missed a real, smaller effect because it was underpowered for it: a Type II error. ::ok Right. At n = 20 per group, an 8 mmHg true effect has only about 38% power, the number you just computed. Most runs of this exact study, more than 6 in 10, would come back not significant even though the program genuinely helps. A non-significant result from an underpowered study is not proof of no effect.
- The p-value calculation must have been done incorrectly. ::no A p-value above 0.05 does not mean the calculation was wrong, and it does not prove the program has no effect either. With only 20 per group, this study is underpowered for anything smaller than about 13.6 mmHg. A true 8 mmHg effect would be missed more often than caught, a Type II error, not a broken test and not proof the null hypothesis is true.

=== step === tryit
## Your turn: solve for 90% power

The clinic's board asks for a tighter target: 90% power instead of 80%, since this trial matters and they want to be more confident of catching a real effect. The hoped-for gap stays the same, 10 mmHg, and so does the assumed standard deviation, 15 mmHg. Fill in the blank and find the new n.

```r
# Solve for the sample size that reaches 90% power.
# Same delta = 10 and sig.level = 0.05 as before, but power = 0.90 this time.
# Fill in sd with the standard deviation assumed throughout this trial's
# planning, then call power.t.test() with type = "two.sample".
```
::check {"regex": "sd\\s*=\\s*15", "gate": true, "difficulty": "intermediate", "ok": "Right: n comes out to about 48.3 per group, round up to 49, 98 total. Tightening the target from 80% to 90% costs about 12 more patients per group.", "no": "Fill in the blank with the standard deviation assumed throughout this trial's planning: sd = 15."}
::solution
```r
# Solve for the sample size that reaches 90% power, with sd filled in
power.t.test(
  power     = 0.90,
  delta     = 10,
  sd        = 15,
  sig.level = 0.05,
  type      = "two.sample"
)
#>      Two-sample t test power calculation 
#> 
#>               n = 48.26431
#>           delta = 10
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.9
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

Round 48.3 up to 49 per group, 98 patients in total, almost 60 more than the clinic's original plan of 40. That is the cost of moving from an 80% chance of catching the effect to a 90% chance.

=== step === concept
## References

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum Associates.
- Cohen, J. (1992). [A power primer](https://doi.org/10.1037/0033-2909.112.1.155). *Psychological Bulletin*, 112(1), 155-159.
- R Documentation: [stats::power.t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html), power calculations for one and two sample t tests.
- CRAN [pwr package vignette](https://cran.r-project.org/web/packages/pwr/vignettes/pwr-vignette.html), power functions for ANOVA, correlation, chi-square and regression designs.
- R Documentation: [stats::t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html), the test the power calculation plans for.

=== step === complete
## The 40 patient question, answered with a number

Is 40 patients enough for this study?

Recruiting 20 per group and hoping for a 10 mmHg gap gives about 54% power, close to a coin flip. Reaching the conventional 80% power target for that same effect needs 74 patients in total, 37 per group, not 40.

The four quantities and the one function you used to get there, `power.t.test()`, work the same way for any two-group comparison you plan. Give it three of n, delta, sig.level and power, leave the fourth blank, and it tells you the number you actually need before you collect a single row of data.

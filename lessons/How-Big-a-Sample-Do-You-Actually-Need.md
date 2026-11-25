---
title: "Experimental Design and A/B Testing Lesson 5: How big a sample do you actually need"
catalog_blurb: "How to simulate your way to the smallest sample size that reaches 80% power."
description: "A sleep study sweeps candidate sample sizes until simulated power hits 80%, then the same sweep sizes a clustered trial that no closed formula solves."
keywords: "sample size, power analysis, power.t.test, power.prop.test, effect size, pilot study bias, intraclass correlation, clustered design, simulation-based power, statistical power"
post_type: "LESSON"
curriculum_id: "4.120.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "5"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: ""
course_prev: "Power-Analysis-by-Simulation-Not-Formula"
---

=== step === cover
## How big a sample do you actually need

Today let's work out how many people a study actually needs, before it ever collects a single row of data.

Here's the question we'll use throughout. A sleep lab wants to test whether a digital wind-down routine, a dimming screen plus a short breathing animation before bed, helps people fall asleep faster than no intervention at all. A wearable tracker records how many minutes each person takes to fall asleep.

Checking whether a planned study has a fair shot at catching a real effect means simulating the study thousands of times and counting how often it comes back significant. That share is the study's power.

Today we turn that around. Instead of fixing the sample size and asking what power it buys you, we fix the power we want, usually 0.80, and ask how big the sample needs to be to get there.

Here's the shape of that answer, before we plug in this study's own numbers.

::widget power-curve {}

Switch between small, medium and large effects and watch the curve shift, and the sample size marked for 80% power move with it.

=== step === concept
## Turning the power simulation around: fix power, solve for n

Here's the idea in one line. Instead of fixing a sample size and asking how much power it buys, fix the power you want and search for the smallest sample size that reaches it.

The search itself reuses the simulate-and-count loop: pick a candidate sample size n, simulate the sleep study at that n many times, run the exact test the real study will use, and record the share of simulated repeats that came back significant. That share is the estimated power at that n. Repeat this for a whole grid of candidate n values, and read off the smallest one whose power clears the target.

Let's try it on the sleep study itself. The clinician's own numbers are: a population standard deviation of 25 minutes in sleep-onset latency, and a smallest worthwhile improvement of 10 minutes, the gap the study actually cares about catching. Sweep candidate sample sizes per group from 10 up to 200, in steps of 10.

```r
# Turn the power simulation around: sweep a grid of sample sizes and estimate power at each one
set.seed(1)
mwd <- 10      # smallest worthwhile difference in minutes
sd_total <- 25 # population standard deviation in minutes
alpha <- 0.05
n_grid <- seq(10, 200, by = 10)
power_at_n <- sapply(n_grid, function(n) {
  rejected <- replicate(2000, {
    treatment <- rnorm(n, mean = mwd, sd = sd_total)
    control <- rnorm(n, mean = 0, sd = sd_total)
    t.test(treatment, control)$p.value < alpha
  })
  mean(rejected)
})
data.frame(n = n_grid, power = round(power_at_n, 3))
#>      n power
#> 1   10 0.133
#> 2   20 0.222
#> 3   30 0.340
#> 4   40 0.430
#> 5   50 0.506
#> 6   60 0.582
#> 7   70 0.650
#> 8   80 0.717
#> 9   90 0.760
#> 10 100 0.796
#> 11 110 0.840
#> 12 120 0.869
#> 13 130 0.892
#> 14 140 0.919
#> 15 150 0.940
#> 16 160 0.941
#> 17 170 0.954
#> 18 180 0.964
#> 19 190 0.976
#> 20 200 0.980
```

Each row of `treatment` and `control` is one simulated repeat of the sleep study at that n, built with the true 10-minute effect baked in by construction. `t.test()` runs the exact comparison the real study would run, and `replicate(2000, ...)` does that 2000 times per n, so `mean(rejected)` is the share of repeats that came back significant, the estimated power.

Reading down the table, power is still at 0.796 at n = 100 per group, just short of 0.80, and crosses it at n = 110, where it reaches 0.840. So on this grid, 110 per group looks like the answer.

But is 110 really the right number, or is that just this grid's resolution showing through, since it only checked every 10th value? A finer sweep next pins it down exactly, and checks it against a formula built for exactly this case.

=== step === widget
## Design 1: how many people the sleep study needs

Before zooming in, place the sleep study on the general picture the cover widget already showed. A standardized effect size, often written as Cohen's d, is just the effect divided by the standard deviation it's measured against. Here that's 10 divided by 25, d = 0.4, which sits between the widget's small (d = 0.2) and medium (d = 0.5) bands, a little closer to medium.

::widget power-curve {}

That widget uses its own fixed small, medium and large effects, so it never shows the sleep study's own numbers directly. Those come from the sweep below instead.

Sweep a finer grid centred on where the answer should sit, and check the result against the exact formula R provides for a two-sample comparison of means, `power.t.test()`.

```r
# Pin down the exact n per group the sleep study needs for 80% power, and check it against the formula
set.seed(2)
mwd <- 10
sd_total <- 25
alpha <- 0.05
n_grid <- seq(80, 160, by = 5)
power_at_n <- sapply(n_grid, function(n) {
  rejected <- replicate(3000, {
    treatment <- rnorm(n, mean = mwd, sd = sd_total)
    control <- rnorm(n, mean = 0, sd = sd_total)
    t.test(treatment, control)$p.value < alpha
  })
  mean(rejected)
})
data.frame(n = n_grid, power = round(power_at_n, 3))
#>      n power
#> 1   80 0.714
#> 2   85 0.728
#> 3   90 0.757
#> 4   95 0.792
#> 5  100 0.805
#> 6  105 0.822
#> 7  110 0.826
#> 8  115 0.859
#> 9  120 0.864
#> 10 125 0.878
#> 11 130 0.900
#> 12 135 0.906
#> 13 140 0.911
#> 14 145 0.931
#> 15 150 0.936
#> 16 155 0.941
#> 17 160 0.946

n_needed <- n_grid[min(which(power_at_n >= 0.80))]
n_needed
#> [1] 100

power.t.test(delta = mwd, sd = sd_total, sig.level = alpha, power = 0.80)
#> 
#>      Two-sample t test power calculation 
#> 
#>               n = 99.08057
#>           delta = 10
#>              sd = 25
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

The finer sweep settles the question the coarse one left open: the smallest n per group whose simulated power clears 0.80 is 100, not 110. The formula agrees almost exactly. `power.t.test()` takes the same three inputs the simulation used, `delta` for the assumed effect, `sd` for the population spread, and `sig.level` for alpha, and solves directly for the n that gives the requested `power`. It returns 99.08057, which rounds up to 100 people per group, 200 in total.

So the sleep study needs 200 people, 100 per arm, to have an 80% chance of catching a real 10-minute improvement. Simulation and formula land in the same place, which is why a design this simple can skip the sweep and go straight to the formula.

=== step === concept
## Reading the power curve's flat right-hand end

Now push that same sweep much further, out to 400 per group, and see what happens once the curve is already past the target.

```r
# Extend the sweep from step 3 out to n = 400 and watch what happens once power is already high
set.seed(3)
mwd <- 10
sd_total <- 25
alpha <- 0.05
n_grid <- seq(20, 400, by = 20)
power_at_n <- sapply(n_grid, function(n) {
  rejected <- replicate(2000, {
    treatment <- rnorm(n, mean = mwd, sd = sd_total)
    control <- rnorm(n, mean = 0, sd = sd_total)
    t.test(treatment, control)$p.value < alpha
  })
  mean(rejected)
})

plot(n_grid, power_at_n, type = "b", pch = 16,
     xlab = "sample size per group", ylab = "estimated power",
     main = "Power climbs steeply, then flattens")
abline(h = 0.80, lty = 2, col = "firebrick")
abline(v = 100, lty = 2, col = "firebrick")

data.frame(n = n_grid, power = round(power_at_n, 3))
#>      n power
#> 1   20 0.226
#> 2   40 0.440
#> 3   60 0.575
#> 4   80 0.708
#> 5  100 0.809
#> 6  120 0.856
#> 7  140 0.916
#> 8  160 0.946
#> 9  180 0.968
#> 10 200 0.975
#> 11 220 0.986
#> 12 240 0.996
#> 13 260 0.992
#> 14 280 0.999
#> 15 300 0.998
#> 16 320 1.000
#> 17 340 1.000
#> 18 360 1.000
#> 19 380 1.000
#> 20 400 1.000

cat("gain from n=100 to n=200:", round(power_at_n[n_grid == 200] - power_at_n[n_grid == 100], 3), "\n")
cat("gain from n=200 to n=400:", round(power_at_n[n_grid == 400] - power_at_n[n_grid == 200], 3), "\n")
#> gain from n=100 to n=200: 0.165 
#> gain from n=200 to n=400: 0.025 
```

Look at what the same amount of extra recruiting buys at different points on the curve. Going from n = 100 to n = 200 adds 100 more people per group and lifts power by 0.165. Going from n = 200 to n = 400 adds twice as many extra people, 200 per group, and lifts power by only 0.025, a sixth of the earlier gain.

That is the curve's flat right-hand end, and it has a plain explanation. Once a study already has a strong chance of catching the effect, there is not much room left for more subjects to improve on, since power is bounded above by 1. Near the target n, by contrast, a handful of extra subjects can move power a lot, which is exactly the steep part the earlier sweep walked through on the way to 100.

[NOTE]
Reading the flat tail honestly cuts both ways. It is not a sign the study was sized wrong, and it is not a reason to keep recruiting past the point the sweep already reached. It is a reason to stop once you are there, since every subject past it buys less than the one before.

=== step === concept
## Design 2: the same sweep on a yes or no outcome

So far the outcome has been a number, minutes to fall asleep. Real studies often care about a yes or no outcome instead. Here, call someone a responder if they fall asleep within 20 minutes of lights out. Without the routine, 35% of people respond. The clinician's smallest worthwhile lift is to 50%.

That changes the outcome from a mean to a proportion, and the test from `t.test()` to `prop.test()`. But the sweep-for-n procedure is identical: simulate, test, count, repeat across a grid of n. Let's run it.

```r
# Run the identical sweep on a two-proportion comparison: responders within 20 minutes of lights out
set.seed(4)
p1 <- 0.35
p2 <- 0.50
alpha <- 0.05
n_grid <- seq(130, 220, by = 5)
power_at_n <- sapply(n_grid, function(n) {
  rejected <- replicate(3000, {
    x1 <- rbinom(1, n, p1)
    x2 <- rbinom(1, n, p2)
    prop.test(c(x1, x2), c(n, n), correct = FALSE)$p.value < alpha
  })
  mean(rejected)
})
data.frame(n = n_grid, power = round(power_at_n, 3))
#>      n power
#> 1  130 0.707
#> 2  135 0.711
#> 3  140 0.723
#> 4  145 0.729
#> 5  150 0.765
#> 6  155 0.742
#> 7  160 0.784
#> 8  165 0.798
#> 9  170 0.810
#> 10 175 0.803
#> 11 180 0.810
#> 12 185 0.829
#> 13 190 0.848
#> 14 195 0.851
#> 15 200 0.863
#> 16 205 0.866
#> 17 210 0.887
#> 18 215 0.880
#> 19 220 0.891

n_needed <- n_grid[min(which(power_at_n >= 0.80))]
n_needed
#> [1] 170

power.prop.test(p1 = p1, p2 = p2, sig.level = alpha, power = 0.80)
#> 
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 169.3114
#>              p1 = 0.35
#>              p2 = 0.5
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

`rbinom(1, n, p1)` draws how many of n simulated responders fall asleep within 20 minutes, under the assumed rate `p1`, and the same for `p2`. `prop.test()` then compares the two counts exactly the way the real study would.

One detail matters here: `prop.test()` applies a small continuity correction by default, which `power.prop.test()`'s own formula does not assume. Setting `correct = FALSE` puts the simulation and the formula on the same footing.

With that, the two methods agree closely again. The sweep finds the smallest n per group clearing 0.80 power at 170, and `power.prop.test()`'s formula returns 169.3114, rounding up to the same 170. The sleep study would need 170 people per group, 340 in total, to reliably catch a lift from 35% to 50%. The method works the same whether the outcome is a number or a yes or no: fix the power, sweep n, read off the answer.

=== step === concept
## The effect size you power for is a judgment, not a guess

Every calculation so far leaned on one number: the 10-minute smallest worthwhile difference. Where does a number like that actually come from?

It is not an estimate of the true, unknown effect. It is the clinician's judgment of the smallest improvement that would actually change practice, the line below which a real effect would still not be worth adopting the routine for. That choice matters enormously, because the required sample size is extremely sensitive to it. Sweep the same formula across a few candidate worthwhile differences and see.

```r
# See how the required n changes as the target effect size shrinks or grows
sd_total <- 25
alpha <- 0.05
deltas <- c(5, 10, 15, 20)
n_per_delta <- sapply(deltas, function(d) ceiling(power.t.test(delta = d, sd = sd_total, sig.level = alpha, power = 0.80)$n))
data.frame(delta = deltas, n_per_group = n_per_delta)
#>   delta n_per_group
#> 1     5         394
#> 2    10         100
#> 3    15          45
#> 4    20          26
```

Halving the target difference from 10 minutes to 5 minutes does not double the required sample. It very nearly quadruples it, from 100 to 394 per group. That follows from how power scales: it depends on the sample size times the effect squared, so a target half as big needs roughly four times as many people to stay equally detectable.

This is why the effect size cannot be picked casually. Set it too small, chasing a difference so modest it would barely matter in practice, and the required sample balloons into something the study may never be able to recruit. Set it at the size that genuinely matters, as the clinician did at 10 minutes, and the sample size stays answerable.

=== step === concept
## Why a pilot study's effect size is too good to trust

After that, a tempting shortcut suggests itself. Choosing an effect size by judgment feels uncomfortable, so why not just run a small pilot study first and power the real study on whatever effect the pilot happens to observe?

Here is why that shortcut is dangerous. Simulate 1000 pilot studies, each with just 15 patients per arm, drawn from the same population where the true effect really is 10 minutes with a standard deviation of 25.

```r
# Simulate 1000 pilot studies (n = 15 per arm) and compare all observed effects to the significant-only ones
set.seed(7)
sd_total <- 25
true_effect <- 10
alpha <- 0.05
n_pilot <- 15
pilots <- replicate(1000, {
  treatment <- rnorm(n_pilot, mean = true_effect, sd = sd_total)
  control <- rnorm(n_pilot, mean = 0, sd = sd_total)
  test <- t.test(treatment, control)
  c(effect = mean(treatment) - mean(control), p = test$p.value)
})
pilots <- as.data.frame(t(pilots))
significant <- pilots[pilots$p < alpha, ]

cat("mean observed effect, all 1000 pilots:", round(mean(pilots$effect), 1), "minutes\n")
cat("pilots that reached significance:", nrow(significant), "out of 1000\n")
cat("mean observed effect, significant-only pilots:", round(mean(significant$effect), 1), "minutes\n")
#> mean observed effect, all 1000 pilots: 9.9 minutes
#> pilots that reached significance: 179 out of 1000
#> mean observed effect, significant-only pilots: 22.3 minutes
```

Across all 1000 simulated pilots, the average observed effect is 9.9 minutes, honestly close to the true 10. But with only 15 per arm, a 10-minute effect is hard to catch reliably, so only 179 of the 1000 pilots, about 18%, reached statistical significance at all.

That 18% is where the trouble starts. Among only the pilots that happened to reach significance, the average observed effect is 22.3 minutes, more than double the truth. A researcher who ran one pilot, saw it come back non-significant, and quietly reran or shelved it, would systematically end up keeping one of these lucky, inflated ones.

Feed each of those two numbers, the honest 10 and the pilot's inflated 22.3, into `power.t.test()` and see what each one recommends for the main study.

```r
# Feed the honest effect and the pilot's inflated effect into power.t.test and compare the n each one demands
set.seed(7)
sd_total <- 25
true_effect <- 10
alpha <- 0.05
n_pilot <- 15
pilots <- replicate(1000, {
  treatment <- rnorm(n_pilot, mean = true_effect, sd = sd_total)
  control <- rnorm(n_pilot, mean = 0, sd = sd_total)
  test <- t.test(treatment, control)
  c(effect = mean(treatment) - mean(control), p = test$p.value)
})
pilots <- as.data.frame(t(pilots))
significant <- pilots[pilots$p < alpha, ]
inflated_effect <- mean(significant$effect)

n_honest <- ceiling(power.t.test(delta = true_effect, sd = sd_total, sig.level = alpha, power = 0.80)$n)
n_from_pilot <- ceiling(power.t.test(delta = inflated_effect, sd = sd_total, sig.level = alpha, power = 0.80)$n)
cat("n per arm, powered on the true 10-minute effect:", n_honest, "\n")
cat("n per arm, powered on the pilot's inflated effect of", round(inflated_effect, 1), "minutes:", n_from_pilot, "\n")
#> n per arm, powered on the true 10-minute effect: 100 
#> n per arm, powered on the pilot's inflated effect of 22.3 minutes: 21 
```

Powering on the honest 10-minute effect demands 100 per arm, the same answer this lesson already found. Powering on the pilot's own, lucky 22.3-minute effect demands only 21 per arm, about a fifth as many.

[KEY INSIGHT]
A study enrolled at 21 per arm against a true 10-minute effect would run at roughly the power this lesson's own early sweep showed near that sample size, nowhere close to 0.80. It would look correctly sized on paper and be badly underpowered in practice. A pilot's job is to check feasibility, not to supply the effect size the real study gets powered on.

=== step === quiz
## Quick check: pilot studies and power

A pilot study of 15 patients per arm comes back significant, with an observed effect of 22 minutes. Why is it risky to power the main study on that 22-minute number?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Pilot studies are unbiased, since their data is just as real as any other study's data. ::no
- A 22-minute effect is impossible, since the clinician already set the smallest worthwhile difference at 10 minutes. ::no
- The 22-minute average was kept only because this pilot happened to reach significance; that selection step pulls the kept effect above the truth, whatever the pilot's size. ::ok Exactly. A tiny pilot has low power against the true 10-minute effect, so it only clears the significance bar on the draws that got lucky. Selecting on significance keeps those lucky, inflated draws and discards the modest or negative ones, which is why powering on the pilot's 22.3 recommended 21 per arm instead of the honest 100.
- The real problem is that 15 per arm is too small a pilot; a bigger pilot's own observed effect would be safe to power on. ::no A bigger pilot shrinks the noise in any one estimate, but it does not remove the bias from keeping only the pilots that happened to look significant. That selection step, not the pilot's raw size, is what inflates the kept average. The safe fix is to power on a judged effect size, never on a pilot's own observed number.

=== step === widget
## Design 3: a clustered design has no formula, so you simulate

The sleep study's own clinic network changes the picture again. Instead of one pool of patients, recruitment runs through 8 clinics of unequal size: 35, 20, 33, 17, 26, 30, 25 and 28 patients, 214 in total.

Patients seen at the same clinic tend to resemble each other a little, through shared staff, scheduling and local population, beyond what you would expect from pure chance. The share of the total variance in sleep-onset latency that sits between clinics, rather than between patients within the same clinic, is called the intraclass correlation, or ICC. Here it works out to 0.10: 10% of the total variance in latency comes from which clinic a patient happens to be at.

Because of that shared clinic effect, this study randomizes whole clinics, not individual patients: 4 clinics get the wind-down routine, 4 continue as usual. Every patient at a clinic inherits that clinic's own random shift, so the comparison carries far less independent information than the same headcount of individually randomized patients would. With clinics this unequal in size, there is no simple textbook formula for the power this buys, which is exactly when simulation earns its keep.

Build it directly: simulate each clinic's own random shift, add patient-level noise on top, run the comparison on clinic averages, since clinics are what actually got randomized, and sweep the total number of patients.

```r
# Simulate the clustered design: 8 unequal-sized clinics, cluster-randomized, then sweep total n
set.seed(9)
clinic_sizes <- sample(15:35, 8)   # the study's 8 clinics, unequal sizes
clinic_sizes
#> [1] 35 20 33 17 26 30 25 28
shares <- clinic_sizes / sum(clinic_sizes)
arm <- rep(c("control", "intervention"), 4)   # 4 clinics per arm

mwd <- 10
alpha <- 0.05
patient_sd <- sqrt(0.90 * 25^2)   # patient-level noise, holding 90% of the total variance
icc <- 0.10
clinic_sd <- sqrt(icc / (1 - icc)) * patient_sd   # between-clinic noise that gives this ICC

power_clustered <- function(total_n, reps = 3000) {
  clinic_n <- pmax(2, round(total_n * shares))
  rejected <- replicate(reps, {
    clinic_mean <- rnorm(8, mean = ifelse(arm == "intervention", mwd, 0), sd = clinic_sd) +
                   rnorm(8, mean = 0, sd = patient_sd / sqrt(clinic_n))
    t.test(clinic_mean[arm == "control"], clinic_mean[arm == "intervention"])$p.value < alpha
  })
  mean(rejected)
}
power_naive <- function(total_n) power.t.test(n = total_n / 2, delta = mwd, sd = 25, sig.level = alpha)$power

n_grid <- seq(40, 400, by = 40)
data.frame(
  total_n = n_grid,
  clustered = round(sapply(n_grid, power_clustered), 3),
  naive = round(sapply(n_grid, power_naive), 3)
)
#>    total_n clustered naive
#> 1       40     0.128 0.234
#> 2       80     0.154 0.423
#> 3      120     0.211 0.584
#> 4      160     0.211 0.710
#> 5      200     0.210 0.804
#> 6      240     0.221 0.870
#> 7      280     0.231 0.915
#> 8      320     0.237 0.946
#> 9      360     0.241 0.966
#> 10     400     0.239 0.979
```

Each simulated clinic mean is the clinic's own random shift plus the average noise of however many patients it holds, and the test runs on the 4 control clinic means against the 4 intervention clinic means, the actual randomized unit. Look at total_n = 200, exactly the number the naive, unclustered calculation from Design 1 said was enough for 80% power. The naive column confirms it, 0.804. But the clustered column, which actually accounts for the clinics, sits at only 0.210, barely a quarter of the way to the target. Pushing all the way to 400 total patients barely helps either, 0.239, still nowhere close.

Here's both curves on the same picture.

::widget chart-plotter {"data":[{"x":40,"y":0.128,"fill":"clustered"},{"x":80,"y":0.154,"fill":"clustered"},{"x":120,"y":0.211,"fill":"clustered"},{"x":160,"y":0.211,"fill":"clustered"},{"x":200,"y":0.210,"fill":"clustered"},{"x":240,"y":0.221,"fill":"clustered"},{"x":280,"y":0.231,"fill":"clustered"},{"x":320,"y":0.237,"fill":"clustered"},{"x":360,"y":0.241,"fill":"clustered"},{"x":400,"y":0.239,"fill":"clustered"},{"x":40,"y":0.234,"fill":"naive"},{"x":80,"y":0.423,"fill":"naive"},{"x":120,"y":0.584,"fill":"naive"},{"x":160,"y":0.710,"fill":"naive"},{"x":200,"y":0.804,"fill":"naive"},{"x":240,"y":0.870,"fill":"naive"},{"x":280,"y":0.915,"fill":"naive"},{"x":320,"y":0.946,"fill":"naive"},{"x":360,"y":0.966,"fill":"naive"},{"x":400,"y":0.979,"fill":"naive"}],"geoms":["line","point"],"x":"n","y":"power","code":{"line":"ggplot(df, aes(n, power, color = group)) +\n  geom_line(linewidth = 1) +\n  geom_point() +\n  geom_hline(yintercept = 0.80, linetype = 2)","point":"ggplot(df, aes(n, power, color = group)) +\n  geom_point(size = 2) +\n  geom_hline(yintercept = 0.80, linetype = 2)"}}

The naive curve climbs cleanly past 0.80 right on schedule. The clustered curve sits far below it across the whole range and is nearly flat past 120. Adding more patients to the same 8 clinics does not fix that gap, because the part of the noise that matters most here comes from having only 4 independent clinics per arm, not from how many patients sit inside them.

=== step === concept
## Design changes that buy more power than a bigger n

That leaves an obvious question. If adding patients to the same 8 clinics barely moves the clustered curve, what would actually help?

Compare two ways to spend the same recruiting budget. One keeps the 8 clinics fixed and adds more patients to each, the curve already built in the last step. Rebuild it here first.

```r
# Sweep power with the same 8 clinics fixed, adding more patients to each
set.seed(9)
clinic_sizes <- sample(15:35, 8)
shares <- clinic_sizes / sum(clinic_sizes)
arm <- rep(c("control", "intervention"), 4)
mwd <- 10
alpha <- 0.05
patient_sd <- sqrt(0.90 * 25^2)
icc <- 0.10
clinic_sd <- sqrt(icc / (1 - icc)) * patient_sd

power_more_patients <- function(total_n, reps = 3000) {
  clinic_n <- pmax(2, round(total_n * shares))
  rejected <- replicate(reps, {
    clinic_mean <- rnorm(8, mean = ifelse(arm == "intervention", mwd, 0), sd = clinic_sd) +
                   rnorm(8, mean = 0, sd = patient_sd / sqrt(clinic_n))
    t.test(clinic_mean[arm == "control"], clinic_mean[arm == "intervention"])$p.value < alpha
  })
  mean(rejected)
}

n_grid <- seq(40, 400, by = 40)
more_patients <- sapply(n_grid, power_more_patients)
round(more_patients, 3)
#>  [1] 0.128 0.154 0.211 0.211 0.210 0.221 0.231 0.237 0.241 0.239
```

Now keep patients per clinic fixed near this study's own average of 27, and add more clinics instead, holding the total patient budget the same.

```r
# Now hold patients per clinic near this study's own average, and sweep the number of clinics instead
patients_per_clinic_fixed <- 27   # close to this study's own average clinic size
power_more_clinics <- function(total_n, reps = 3000) {
  k <- max(4, round(total_n / patients_per_clinic_fixed / 2) * 2)   # total clinics, kept even
  arm_k <- rep(c("control", "intervention"), k / 2)
  rejected <- replicate(reps, {
    clinic_mean <- rnorm(k, mean = ifelse(arm_k == "intervention", mwd, 0), sd = clinic_sd) +
                   rnorm(k, mean = 0, sd = patient_sd / sqrt(patients_per_clinic_fixed))
    t.test(clinic_mean[arm_k == "control"], clinic_mean[arm_k == "intervention"])$p.value < alpha
  })
  mean(rejected)
}

set.seed(10)
more_clinics <- sapply(n_grid, power_more_clinics)
clinics_used <- sapply(n_grid, function(n) max(4, round(n / patients_per_clinic_fixed / 2) * 2))

data.frame(
  total_n = n_grid,
  clinics_if_more_clinics = clinics_used,
  more_patients_8_clinics = round(more_patients, 3),
  more_clinics_27_each = round(more_clinics, 3)
)
#>    total_n clinics_if_more_clinics more_patients_8_clinics more_clinics_27_each
#> 1       40                       4                   0.128                0.052
#> 2       80                       4                   0.154                0.052
#> 3      120                       4                   0.211                0.045
#> 4      160                       6                   0.211                0.136
#> 5      200                       8                   0.210                0.221
#> 6      240                       8                   0.221                0.221
#> 7      280                      10                   0.231                0.314
#> 8      320                      12                   0.237                0.386
#> 9      360                      14                   0.241                0.462
#> 10     400                      14                   0.239                0.458
```

At 400 total patients, keeping the same 8 clinics and adding more patients to each leaves power at 0.239. Spreading that same 400 patients across 14 clinics instead, about 27 per clinic, reaches 0.458, nearly double.

[TIP]
A new clinic contributes a fresh, independent draw of the between-clinic noise. Another patient at a clinic already in the study mostly re-samples noise that clinic has already contributed. Since the clustered design's bottleneck lives in that between-clinic noise, spending the recruiting budget on new clinics attacks it directly, while spending it on existing clinics does not. For a clustered study, the number of independent clusters is usually the lever that moves power the most, not the total headcount.

=== step === quiz
## Closing quiz: putting the sample-size machinery together

Looking back across the two-mean sweep, the two-proportion sweep, the flat power curve, and the clustered design with no formula, which statement is correct?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Once a method agrees with a closed-form formula in the simple case, as the two-mean sweep did, it is safe to assume a similar formula exists for every harder case, including clustered designs. ::no
- A power curve that goes flat near 1, as this lesson's own curve did past n = 200, means the original effect size assumption must have been wrong. ::no
- The sweep-and-count method does not depend on which test statistic is used or whether a closed-form formula exists; the same loop found 100 per arm for means, 170 per arm for proportions, and the honest, low power of a design with too few clinics. ::ok Right. The method, simulate at a candidate n, test, count, repeat across a grid, worked unchanged across every design in this lesson, with or without a matching formula.
- Powering a study on a small pilot's own observed effect is safe as long as the pilot's result was statistically significant. ::no
- Adding one more patient to an existing clinic buys roughly as much power as adding one whole new clinic, since both add one more observation to the total. ::no Each of these shortcuts failed somewhere in this lesson. A flat curve is not a sign of a wrong assumption, a formula does not always exist, a significant pilot's effect is still inflated by the very act of selecting on significance, and an extra clinic buys far more power than an extra patient at a clinic already in the study. What worked every time instead was simulating the actual design and reading the result plainly.

=== step === tryit
## Your turn: size a study by simulation

Suppose the clinic network turns out noisier between clinics than first assumed: an intraclass correlation of 0.20 instead of 0.10, with the same 8 clinics and the same patient-level noise. Edit the `icc` value below from 0.10 to 0.20 and run it again to see what happens to the clustered power across the same total-patient grid.

```r
# Re-run the clustered sweep from before, but change the intraclass correlation to 0.20
set.seed(9)
clinic_sizes <- sample(15:35, 8)               # same 8 clinics, same sizes as before
shares <- clinic_sizes / sum(clinic_sizes)
arm <- rep(c("control", "intervention"), 4)    # clinic count stays at 8, 4 per arm

mwd <- 10
alpha <- 0.05
patient_sd <- sqrt(0.90 * 25^2)                # patient-level noise, unchanged from before
icc <- 0.10                                    # <-- change this to 0.20 and run again
clinic_sd <- sqrt(icc / (1 - icc)) * patient_sd

power_clustered <- function(total_n, reps = 3000) {
  clinic_n <- pmax(2, round(total_n * shares))
  rejected <- replicate(reps, {
    clinic_mean <- rnorm(8, mean = ifelse(arm == "intervention", mwd, 0), sd = clinic_sd) +
                   rnorm(8, mean = 0, sd = patient_sd / sqrt(clinic_n))
    t.test(clinic_mean[arm == "control"], clinic_mean[arm == "intervention"])$p.value < alpha
  })
  mean(rejected)
}

n_grid <- seq(40, 400, by = 40)
data.frame(total_n = n_grid, power = round(sapply(n_grid, power_clustered), 3))
```

Press Check when you have made the edit.

::check {"regex": "(?=[\\s\\S]*icc\\s*<-\\s*0\\.2)(?=[\\s\\S]*total_n)", "gate": true, "difficulty": "beginner", "ok": "Right: raising the ICC to 0.20 pulls power down further at every total_n, from a range of 0.128 to 0.241 at ICC = 0.10 to a range of 0.096 to 0.142 here. With only 8 clinics, more between-clinic noise makes an already-insufficient design worse, and no number of added patients fixes it.", "no": "Change the icc line from 0.10 to 0.20 and keep the rest of the code, including the final data.frame(total_n = ...) line, intact."}
::solution
```r
# Same clustered sweep, with icc changed from 0.10 to 0.20
set.seed(9)
clinic_sizes <- sample(15:35, 8)
shares <- clinic_sizes / sum(clinic_sizes)
arm <- rep(c("control", "intervention"), 4)

mwd <- 10
alpha <- 0.05
patient_sd <- sqrt(0.90 * 25^2)
icc <- 0.20
clinic_sd <- sqrt(icc / (1 - icc)) * patient_sd

power_clustered <- function(total_n, reps = 3000) {
  clinic_n <- pmax(2, round(total_n * shares))
  rejected <- replicate(reps, {
    clinic_mean <- rnorm(8, mean = ifelse(arm == "intervention", mwd, 0), sd = clinic_sd) +
                   rnorm(8, mean = 0, sd = patient_sd / sqrt(clinic_n))
    t.test(clinic_mean[arm == "control"], clinic_mean[arm == "intervention"])$p.value < alpha
  })
  mean(rejected)
}

n_grid <- seq(40, 400, by = 40)
data.frame(total_n = n_grid, power = round(sapply(n_grid, power_clustered), 3))
#>    total_n power
#> 1       40 0.096
#> 2       80 0.108
#> 3      120 0.135
#> 4      160 0.133
#> 5      200 0.127
#> 6      240 0.128
#> 7      280 0.133
#> 8      320 0.141
#> 9      360 0.142
#> 10     400 0.133
```

A bigger ICC means more of the total noise sits between clinics, which is exactly the part that adding patients inside each clinic cannot shrink. With only 8 clinics, the honest answer at ICC = 0.20 is not a bigger required n. It is that the same single lever found in the last step, the number of independent clinics, is still the only one that would move this number.

=== step === complete
## Sample size is a design decision, not an afterthought

Three designs, one shared method. Pick an effect size that reflects a real, worthwhile difference, not a guess borrowed from a small pilot. Simulate the planned study at a candidate n many times, count how often it catches the effect, and sweep that across a grid of n until the target power is reached. Read the resulting curve honestly, including its flat right-hand end. And when no closed-form formula applies, as with unequal clinics, the exact same sweep still works, since nothing about it depended on having a formula in the first place.

The sleep study's three answers carry the whole lesson. A plain comparison of means needs 100 people per arm. The same comparison on a yes or no outcome needs 170 per arm. And run through 8 clinics instead of one pool, no number of added patients reaches the target at all, only more clinics do.

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences, 2nd edition](https://www.routledge.com/Statistical-Power-Analysisfor-the-Behavioral-Sciences/Cohen/p/book/9780805802832) - Cohen, J. (1988), Lawrence Erlbaum Associates. The standard reference for effect sizes and the n-power-alpha relationship used throughout this lesson.
- [Caution regarding the use of pilot studies to guide power calculations for study proposals](https://doi.org/10.1001/archpsyc.63.5.484) - Kraemer, H. C., Mintz, J., Noda, A., Tinklenberg, J., & Yesavage, J. A. (2006), Archives of General Psychiatry, 63(5), 484-489. The source for the pilot-effect-size warning this lesson simulates directly.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button, K. S., Ioannidis, J. P. A., Mokrysz, C., Nosek, B. A., Flint, J., Robinson, E. S. J., & Munafo, M. R. (2013), Nature Reviews Neuroscience, 14(5), 365-376. A field-wide look at what underpowered studies cost.
- [Power analysis for generalized linear mixed models in ecology and evolution](https://doi.org/10.1111/2041-210X.12306) - Johnson, P. C. D., Barry, S. J. E., Ferguson, H. M., & Muller, P. (2015), Methods in Ecology and Evolution, 6(2), 133-142. Simulation-based power for designs, including clustered ones, where no closed-form formula exists.
- [SIMR: an R package for power analysis of generalized linear mixed models by simulation](https://doi.org/10.1111/2041-210X.12504) - Green, P., & MacLeod, C. J. (2016), Methods in Ecology and Evolution, 7(4), 493-498. An R package built around exactly the simulate-and-sweep approach this lesson works through by hand.

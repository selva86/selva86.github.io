---
title: "Experimental Design and A/B Testing Lesson 4: Power analysis by simulation, not formula"
catalog_blurb: "Why simulating a planned study thousands of times beats guessing at a power formula."
description: "A sleep app tests a bedtime reminder by simulating its planned study thousands of times, then extends the same recipe to a design no formula can solve."
keywords: "statistical power, power analysis, simulation-based power, power.t.test, sample size, effect size, baseline covariate adjustment, Type II error, null distribution, A/B test"
post_type: "LESSON"
curriculum_id: "4.120.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "4"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "How-Big-a-Sample-Do-You-Actually-Need"
course_prev: "Factorial-Designs-and-the-Split-Plot-Trap"
---

=== step === cover
## Power analysis by simulation, not formula

Today let's understand how to find out, before you ever collect a single row of data, whether a planned study has a fair shot at catching the effect you are looking for.

Here is the example we will use throughout. NightWell is a sleep-tracking app. It wants to test a new bedtime reminder against no reminder at all. From its existing app logs, NightWell believes the reminder adds about 15 minutes of nightly sleep on average, with a standard deviation of 50 minutes across its users. The plan is to run the test on 120 users, 60 getting the reminder and 60 not, and compare the two groups with a two-sample t-test at the usual 0.05 significance level.

Before NightWell runs this study for real, it wants an honest answer to one question. If that 15-minute effect really is there, how often would a study built exactly this way actually catch it?

That question has a name. It is called statistical power, and there is a textbook formula for some of the simplest cases. But formulas run out quickly once a study design gets even slightly more realistic. So instead of reaching for a formula first, you build power the way it actually works underneath any formula: by simulating the planned study thousands of times and counting how often it succeeds.

There are only four moves in that recipe.

::widget process-flow {"steps":[{"title":"Assume","sub":"pick a true effect you want to be able to detect"},{"title":"Simulate","sub":"generate one hypothetical repeat of the planned study under that effect"},{"title":"Test","sub":"run the exact analysis the real study will use"},{"title":"Count","sub":"repeat thousands of times and count how often it rejects"}]}

Everything from here is that same loop, done once by hand first and then thousands of times at once.

=== step === concept
## What statistical power actually asks

Let's put a number on NightWell's question. Statistical power is the fraction of repeated studies, each built exactly like the one that is planned, that would correctly reject the null hypothesis when the assumed effect is genuinely there.

Read that definition again slowly, because every part of it matters. "Repeated studies" means you are not asking about the one study NightWell is about to run. You are asking about a long run of studies just like it. "Correctly reject the null hypothesis" means the test comes back significant, p below 0.05, and says there is a real difference between the two groups. And "when the assumed effect is genuinely there" means you first have to decide, as an assumption, how big a real effect you want the study to be able to catch. Here, that assumption is NightWell's own belief: a true gain of 15 minutes of nightly sleep.

So power is not a property of data you already have. It is a property of a design, asked before any data exists, under an effect you are willing to assume.

To see what one of those repeated studies looks like, simulate it. Draw 60 made-up control users and 60 made-up treatment users, where the treatment users really do sleep 15 minutes more on average, and run the exact t-test NightWell plans to run on the real data.

```r
# Simulate one repeat of the planned NightWell study and run the planned test
set.seed(1)
control <- rnorm(60, mean = 420, sd = 50)
treatment <- rnorm(60, mean = 435, sd = 50)
result <- t.test(treatment, control)
print(result)
#> 	Welch Two Sample t-test
#> 
#> data:  treatment and control
#> t = 1.8821, df = 117.48, p-value = 0.06229
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.7938433 31.2127455
#> sample estimates:
#> mean of x mean of y 
#>  440.5903  425.3808 
```

`rnorm(60, mean = 420, sd = 50)` draws 60 numbers from a normal distribution: 420 minutes of average nightly sleep for the control group, with the 50-minute spread NightWell sees across its users. The treatment group is drawn the same way, except its mean is set to 435, exactly 15 minutes above the control's 420. That 15-minute gap is baked into the simulation on purpose. It is the real effect NightWell is assuming.

`t.test()` then runs the same two-sample test NightWell's real study will run. It does not know the 15 minutes was baked in. It only sees the 60 plus 60 numbers and does its job.

Now look at the p-value. It came out at 0.06229, above the usual 0.05 cutoff. So this one simulated repeat fails to reject the null hypothesis, even though a real 15-minute effect is sitting inside the data by construction. One simulated repeat was simply unlucky. That does not mean the effect is not there. It means this one draw of 60 plus 60 users happened not to make the case strongly enough.

[NOTE]
Hold on to the t-statistic from this trial, 1.8821. It comes back in a moment. One trial, by itself, only tells you whether that one trial got lucky. The question that actually matters is how often this exact setup would succeed if you ran it over and over.

=== step === widget
## Reading one trial against the null distribution

Every t-test works by comparing its own t-statistic against a reference curve: the distribution of t-statistics you would see across many repeats if the two groups truly had no difference between them at all. That reference curve is called the null distribution, because it describes what the data would look like under the null hypothesis, the hypothesis of no effect.

The widget below draws that curve. The slider is the trial's t-statistic, and the two orange tails mark how far out, on either side of zero, a result has to sit before it counts as significant at the usual two-sided 0.05 level.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.88, "label": "observed t"}

Drag the slider to 1.88, the t-statistic that trial actually produced. The shaded area, the p-value, lands close to 0.062, the same number `t.test()` printed. That shaded area is the chance of seeing a t-statistic this far from zero, or farther, purely by chance, if the two groups had no real difference. Push the slider further out toward 4 and the tails shrink to almost nothing, because a t-statistic that extreme would almost never happen under the null. Pull it back toward zero and the tails swell, because small t-statistics are exactly what you would expect when there is no real difference at all.

This is the rule the simulation applies thousands of times next: did the trial's t-statistic land far enough into the tail to clear the 0.05 bar, or did it not?

=== step === concept
## From one trial to the empirical power

One simulated trial only tells you about one trial. To learn what NightWell's planned study can actually do, repeat the exact same simulation thousands of times and watch how often it succeeds.

`replicate()` runs the code inside its braces over and over and collects every result into one vector. Run that same draw-and-test move, 4000 times, keeping only the p-value from each repeat.

```r
# Repeat the simulated study 4000 times and count how often it rejects the null
set.seed(1)
pvals <- replicate(4000, {
  control <- rnorm(60, mean = 420, sd = 50)
  treatment <- rnorm(60, mean = 435, sd = 50)
  t.test(treatment, control)$p.value
})

empirical_power <- mean(pvals < 0.05)
empirical_power
#> [1] 0.3725
```

`pvals` now holds 4000 p-values, one from each simulated repeat of NightWell's exact study design, all built under the same assumption: a true 15-minute effect, 60 users per arm. `pvals < 0.05` turns that vector into 4000 TRUE or FALSE values, TRUE wherever that repeat's test rejected the null. `mean()` on a vector of TRUE and FALSE values treats TRUE as 1 and FALSE as 0, so the result works out to the share of repeats that came back significant.

That share, 0.3725, is the empirical power of NightWell's planned study. In plain words, if the 15-minute effect really is there, about 37 of every 100 exact repeats of this study would catch it, p below 0.05. The other 63 would come back non-significant, even though the effect is genuinely real in every single one of those 4000 repeats. That one unlucky trial from earlier was simply one draw from that 63.

That is the whole idea of power, stated as a number instead of a definition: the long-run frequency with which a specific design, under a specific assumed effect, gives you a significant result.

=== step === quiz
## Quick check: what a 37% power number actually means

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- About 37 of every 100 exact repeats of this study would detect the real 15-minute effect, and the other 63 would fail to reject the null even though the effect is genuinely there. ::ok Right. That is exactly what an empirical power of 0.3725 counts: the share of 4000 simulated repeats, each built with the true 15-minute effect baked in, whose t-test rejected the null.
- The real NightWell study, when it runs, will come back with a p-value of exactly 0.37. ::no Power describes the long-run frequency of rejections across many repeats of a design under an assumed true effect. It is not a forecast of the one p-value a single future study will produce, and a non-significant result from that study would not prove the effect is absent either, since 63 of every 100 repeats under a real effect still come back non-significant at this sample size.
- A non-significant result from the real study would prove the reminder has no effect. ::no Power describes the long-run frequency of rejections across many repeats of a design under an assumed true effect. It is not a forecast of the one p-value a single future study will produce, and a non-significant result from that study would not prove the effect is absent either, since 63 of every 100 repeats under a real effect still come back non-significant at this sample size.

=== step === widget
## Where the formula agrees: power.t.test

For a plain two-sample t-test like NightWell's, there happens to be a closed-form formula for power, no simulation required. Base R provides it as `power.t.test()`.

```r
# Compute the closed-form power for NightWell's planned design
power.t.test(n = 60, delta = 15, sd = 50, sig.level = 0.05)
#> 
#>      Two-sample t test power calculation 
#> 
#>               n = 60
#>           delta = 15
#>              sd = 50
#>       sig.level = 0.05
#>           power = 0.3706368
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
#> 
```

`delta` is the true effect you are assuming, 15 minutes. `sd` is the standard deviation within each group, 50 minutes. Feed in the same n, the same effect and the same significance level the simulation used, and the formula returns power of about 0.3706368. That earlier 4000-repeat simulation landed on 0.3725. Those two numbers agree, to within the noise you would expect from running only 4000 repeats rather than infinitely many.

That agreement is the whole reason the formula gets trusted for a design this simple. It is solving, with algebra, the exact same question the simulation answers by brute force: how often would this test reject the null if the assumed effect is real?

The same function also runs in reverse. Instead of asking for the power at a fixed n, ask for the n needed to reach a target power.

```r
# Find the sample size NightWell needs for 80% power
power.t.test(delta = 15, sd = 50, sig.level = 0.05, power = 0.80)
#> 
#>      Two-sample t test power calculation 
#> 
#>               n = 175.3851
#>           delta = 15
#>              sd = 50
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
#> 
```

R hands back 175.3851, which rounds up to 176 users per arm. At its current plan of 60 per arm, NightWell is running at about 37% power. To reach the conventional 80% target, it would need to recruit roughly three times as many users per arm.

The widget below shows the same relationship for a general case, using Cohen's d, a standardized effect size measured in standard deviations rather than minutes. A small effect is d = 0.2, a medium one is d = 0.5, and a large one is d = 0.8. On NightWell's own scale, where one standard deviation is 50 minutes, those three map to 10, 25 and 40 minutes of nightly sleep gained.

::widget power-curve {}

Toggle between small, medium and large, and watch two things move together: the curve itself shifts left as the effect grows, meaning fewer users are needed, and the n marked for 80% power drops along with it. NightWell's own 15-minute effect sits between the small and medium bands shown here, which is exactly why its honest power at 60 per arm comes out closer to small-effect territory than to a comfortable number.

=== step === concept
## Where the formula runs out: a planned covariate adjustment

`power.t.test()` only knows about one design: two independent groups compared with a plain t-test. NightWell's app, though, logs more than just the outcome. It also has each user's own pre-period average nightly sleep, recorded before the reminder was ever introduced.

A smarter analysis plan uses that extra information. Instead of a plain t-test, NightWell plans to fit `lm(post ~ group + pre)`, a linear model that adjusts the comparison between groups for each user's own starting point. This is called a covariate adjustment, and the covariate here is `pre`, the pre-period sleep average.

There is no closed-form power formula in base R for a covariate-adjusted comparison like this one. But the simulate, test and count recipe used so far does not care. It only needs to know what model to fit and which p-value to read off it, so the exact same loop answers the question unchanged.

Suppose each user's pre-period sleep is correlated with their post-period sleep at 0.6, a realistic number since people who sleep more before a study tend to keep sleeping more after it, reminder or not. Simulate both the pre-period and post-period values together, keeping that correlation and the same 15-minute true effect, then fit both the plain t-test and the covariate-adjusted model inside the same 4000-repeat loop.

```r
# Compare power with and without adjusting for each user's own baseline sleep
set.seed(2)
n_per_arm <- 60
rho <- 0.6
p_unadj <- numeric(4000)
p_adj <- numeric(4000)

for (i in seq_len(4000)) {
  group <- rep(c("control", "treatment"), each = n_per_arm)
  pre <- rnorm(2 * n_per_arm, mean = 420, sd = 50)
  noise <- rnorm(2 * n_per_arm, mean = 0, sd = 50 * sqrt(1 - rho^2))
  true_gain <- ifelse(group == "treatment", 15, 0)
  post <- 420 + rho * (pre - 420) + noise + true_gain

  p_unadj[i] <- t.test(post ~ group)$p.value
  p_adj[i] <- summary(lm(post ~ group + pre))$coefficients["grouptreatment", "Pr(>|t|)"]
}

round(c(unadjusted = mean(p_unadj < 0.05), adjusted = mean(p_adj < 0.05)), 3)
#> unadjusted   adjusted 
#>      0.378      0.534 
```

Walk through what that loop builds for each of the 4000 repeats. `pre` is each user's baseline sleep, drawn the same way as before. `post` is built from `pre` itself, scaled by the correlation `rho`, plus fresh random noise, plus the 15-minute true gain for whoever is in the treatment group. The correlation is what ties `post` to `pre`: when `rho` is 0.6, a user who started high on `pre` tends to land high on `post` too, on top of whatever the reminder itself does.

`p_unadj` is the plain t-test's p-value, the same comparison run earlier. `p_adj` is the p-value on the `group` term from `lm(post ~ group + pre)`, which asks the narrower question: once you account for where each user started, does the group they were in still make a difference?

The unadjusted power came out at 0.378, close to what the plain design gave earlier. The adjusted power came out at 0.534. Adding the baseline covariate to the analysis plan, with no change to the sample size and no change to the true effect, raised the chance of detecting it from about 38% to about 53%.

[KEY INSIGHT]
A covariate adjustment does not change what is true about the users. It changes how much of the noise in `post` the analysis can explain away before it even looks at `group`. The more that noise shrinks, the easier the real 15-minute gap is to see, which is why the adjusted model needs no more users to get noticeably more power.

The same simulate, test and count recipe would work exactly the same way if the real design added a cluster of users per household, or an outcome that was skewed rather than normal, or any other wrinkle a real study plan picks up. Only the model inside the loop changes.

=== step === quiz
## Quick check: what moves power up or down

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A bigger assumed effect, more users per arm, a less variable outcome, or a tighter covariate adjustment all raise power, because each one makes the real effect easier to tell apart from sampling noise. ::ok Right. Every one of those either makes the true effect bigger relative to the noise, or shrinks the noise itself, which is exactly what raised NightWell's power from about 38% to about 53% when the baseline covariate entered the analysis.
- Lowering the significance threshold, alpha, from 0.05 to 0.01 would raise power. ::no Lowering alpha makes the test stricter, which lowers power rather than raising it, since a smaller p-value is now required before the test will reject the null. And power is a property of the design, fixed before any data exists under an assumed effect, not a number you read off a study after checking whether it came back significant.
- Power is a property of the data already collected, so it can be computed after a study ends by checking whether its test was significant. ::no Lowering alpha makes the test stricter, which lowers power rather than raising it, since a smaller p-value is now required before the test will reject the null. And power is a property of the design, fixed before any data exists under an assumed effect, not a number you read off a study after checking whether it came back significant.

=== step === tryit
## Your turn: does the covariate still help with a weaker baseline link?

The advantage from adjusting for `pre`, seen earlier, depended on `rho`, the correlation between each user's pre-period and post-period sleep, being 0.6. Change `rho` to 0.2, a much weaker link between the two, and rerun the same comparison.

```r
# Edit rho below, then press Run to compare power with and without the covariate
set.seed(2)
n_per_arm <- 60
rho <- 0.6
p_unadj <- numeric(4000)
p_adj <- numeric(4000)

for (i in seq_len(4000)) {
  group <- rep(c("control", "treatment"), each = n_per_arm)
  pre <- rnorm(2 * n_per_arm, mean = 420, sd = 50)
  noise <- rnorm(2 * n_per_arm, mean = 0, sd = 50 * sqrt(1 - rho^2))
  true_gain <- ifelse(group == "treatment", 15, 0)
  post <- 420 + rho * (pre - 420) + noise + true_gain

  p_unadj[i] <- t.test(post ~ group)$p.value
  p_adj[i] <- summary(lm(post ~ group + pre))$coefficients["grouptreatment", "Pr(>|t|)"]
}

round(c(unadjusted = mean(p_unadj < 0.05), adjusted = mean(p_adj < 0.05)), 3)
```
::check {"regex": "rho\\s*<-\\s*0\\.2", "gate": true, "difficulty": "intermediate", "ok": "Right: with rho at 0.2, the unadjusted and adjusted powers come out at about 0.375 and 0.380, almost the same. The covariate only buys power in proportion to how strongly it actually predicts the outcome.", "no": "Change the line rho <- 0.6 to rho <- 0.2, then press Run again."}
::solution
```r
# Rerun the comparison with a weaker baseline link (rho = 0.2)
set.seed(2)
n_per_arm <- 60
rho <- 0.2
p_unadj <- numeric(4000)
p_adj <- numeric(4000)

for (i in seq_len(4000)) {
  group <- rep(c("control", "treatment"), each = n_per_arm)
  pre <- rnorm(2 * n_per_arm, mean = 420, sd = 50)
  noise <- rnorm(2 * n_per_arm, mean = 0, sd = 50 * sqrt(1 - rho^2))
  true_gain <- ifelse(group == "treatment", 15, 0)
  post <- 420 + rho * (pre - 420) + noise + true_gain

  p_unadj[i] <- t.test(post ~ group)$p.value
  p_adj[i] <- summary(lm(post ~ group + pre))$coefficients["grouptreatment", "Pr(>|t|)"]
}

round(c(unadjusted = mean(p_unadj < 0.05), adjusted = mean(p_adj < 0.05)), 3)
#> unadjusted   adjusted 
#>      0.375      0.380 
```

With a weak baseline link, the unadjusted and adjusted powers sit almost on top of each other. Compare that to the earlier run, where a correlation of 0.6 pulled them 15 percentage points apart. The covariate only helps in proportion to how much it actually predicts the outcome. A covariate that barely correlates with `post` buys almost nothing, no matter how clever the model fitting it looks.

=== step === concept
## References

- [Simulation methods to estimate design power: an overview for applied research](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/1471-2288-11-94) - Arnold, Hogan, Colford and Hubbard (2011), BMC Medical Research Methodology 11:94. The case for simulating power directly instead of reaching for a formula.
- [SIMR: an R package for power analysis of generalized linear mixed models by simulation](https://doi.org/10.1111/2041-210X.12504) - Green and MacLeod (2016), Methods in Ecology and Evolution 7(4). Simulation-based power for designs with no closed-form formula.
- [power.t.test: Power calculations for two sample and one sample t tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team, the documentation for the closed-form formula used as the trust check in this lesson.
- [Change from baseline and analysis of covariance revisited](https://doi.org/10.1002/sim.2682) - Senn (2006), Statistics in Medicine 25(24). The case for adjusting for a baseline covariate, and the precision it buys.

=== step === complete
## What this buys you

You now know how to answer the question NightWell started with, and a good deal more besides. Here is what to carry forward.

- Power is a property of a design, not of data you already have. You compute it by assuming a true effect and simulating how often a study built this way would catch it, before any user is ever recruited.
- The closed-form formula, `power.t.test()`, is a fast, trustworthy shortcut exactly where it applies: a simple two-group comparison like NightWell's plain plan. It agreed with the simulation to within simulation noise, which is exactly why the formula gets relied on for designs this simple.
- The identical simulate, test and count recipe keeps working once the real plan gets more realistic, a baseline covariate, a clustered design, a skewed outcome, by swapping in whichever model the real analysis will actually run. Nothing else about the recipe changes.

The next natural question is the mirror image of this one: instead of fixing the sample size and asking what power it buys, fix the power you want and solve for the sample size that gets you there.

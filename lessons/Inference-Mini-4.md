---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
description: "A 40-patient trial can miss a real 10 mmHg effect. Simulate the study, count how often it reaches significance, and solve for the sample size you need."
keywords: "power analysis in R, statistical power, sample size calculation, power.t.test, effect size, Cohen's d, type II error, simulate power in R"
mathjax: true
webr: true
date: "2026-09-06"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-3"
course_next: ""
curriculum_id: "0.0.7"
lesson_access: "windowed"
catalog_blurb: "How many patients a study needs before it can detect a real effect."
---

=== step === cover
## Power analysis: find the sample size you need

Today let's work out how many patients a study needs, before a single one of them signs up.

A clinic wants to test a 12-week exercise program against usual care. Blood pressure is measured on the day each patient joins and again at the end, and what gets recorded is the drop in systolic pressure in mmHg. From published trials of programs like this one, the clinic expects the exercise arm to drop about 10 mmHg further than the usual-care arm. Patients differ a lot though, and that drop varies from one patient to the next with a standard deviation of around 15 mmHg.

The budget stretches to 40 patients, 20 in each arm. At the end the two arms get compared with a t-test at the usual 0.05 threshold.

So here is the question worth asking now rather than a year from now: if the program really does lower pressure by 10 mmHg, will a study this small actually come back significant?

That question has a number for an answer, and you can compute it before spending anything. Getting it takes three steps.

::widget process-flow {"steps":[{"title":"Build the planned trial","sub":"20 patients per arm, a 10 mmHg effect, a standard deviation of 15"},{"title":"Simulate it many times","sub":"generate the data again and again with the effect present"},{"title":"Count the significant runs","sub":"the share that come back under 0.05"}]}

Everything that follows is doing those three steps on the clinic's design.

=== step === concept
## One simulated run of the planned trial

The clinic has no patients yet, so we make some. We generate each arm from a normal distribution, and we pick the two means so that the effect the clinic hopes for is true by construction.

Usual care gets a mean drop of 0 mmHg and the program gets a mean drop of 10 mmHg. Both arms get a standard deviation of 15, which is how much one patient's drop differs from another's. Then we hand the two arms to `t.test()`, exactly as the clinic would with real patients.

Press Run.

```r
# Simulate one run of the planned trial and compare the two arms
set.seed(2)
usual   <- rnorm(20, mean = 0,  sd = 15)   # drop in systolic BP, mmHg, usual care
program <- rnorm(20, mean = 10, sd = 15)   # drop in systolic BP, mmHg, exercise program

tt <- t.test(program, usual)
tt
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  program and usual
#> t = 1.3282, df = 37.557, p-value = 0.1921
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -3.706397 17.834114
#> sample estimates:
#> mean of x mean of y 
#>  9.995774  2.931916

round(mean(program) - mean(usual), 2)
#> [1] 7.06
```

`set.seed(2)` fixes the random number generator, so your 40 patients are the same as mine.

Read the two means at the bottom first. The program arm dropped 10.0 mmHg on average and the usual-care arm dropped 2.9, a gap of 7.06 mmHg. The 10 mmHg effect is in there, but 20 patients per arm are not enough to reproduce it exactly, and this particular draw came in low.

Now read `p-value = 0.1921`. That is the probability of seeing a gap at least this large if the two arms really had the same mean. It is nowhere near 0.05, so the clinic would report no significant difference and shelve the program.

Look at what just happened. The effect is real, we put it there ourselves, and the study missed it.

[NOTE]
`t.test()` runs the Welch version by default, which does not assume the two arms have the same spread. That is why the degrees of freedom come out at 37.557 instead of a whole number.

=== step === concept
## The same trial, run twelve times

One simulated trial is one draw. Another 20 patients would give different numbers, so the interesting question is what this design does across many runs, not what it did on the run we happened to see.

The code below wraps the whole trial into a function that takes the per-arm sample size, simulates both arms, and returns just the p-value. Then it runs that function 12 times.

```r
# Run the same planned trial 12 times and read the p-value each time
one_trial <- function(n) {
  usual   <- rnorm(n, mean = 0,  sd = 15)
  program <- rnorm(n, mean = 10, sd = 15)
  t.test(program, usual)$p.value
}

set.seed(7)
p12 <- replicate(12, one_trial(20))
round(p12, 3)
#>  [1] 0.337 0.024 0.001 0.520 0.058 0.067 0.000 0.015 0.206 0.165 0.059 0.003

sum(p12 < 0.05)
#> [1] 5
```

The 10 mmHg effect is present in all 12 of those trials. Every one of them.

But the p-values run from 0.000 to 0.520, and only 5 of the 12 came in under 0.05. The other 7 would have been written up as "no significant difference between the arms", which is the wrong conclusion drawn from a study that was simply too small.

Missing a real effect like that has a name. The null hypothesis here, written H0, is that the two arms have the same mean. Failing to reject it when it is false is a **Type II error**, and seven of these twelve trials made one.

So this design does not have an answer. It has a hit rate, and 12 runs are enough to see that the hit rate exists but not enough to measure it.

=== step === concept
## What statistical power is, and how to compute it by simulation

That hit rate is what statisticians call the **power** of a design: the probability that the test comes back significant when the effect really is there. Significant means p below alpha, the threshold you pick before the study starts. The clinic picked the usual 0.05.

\[ \text{power} \;=\; P(\,p \lt \alpha \;\mid\; \text{the effect is real}\,) \;=\; 1 - \beta \]

Here \(\beta\) is the Type II error rate, the probability of missing the effect. Power and beta are the same fact stated from the two ends, so a design with 0.60 power misses a real effect 40% of the time.

Estimating it is just the 12 runs again, with a bigger number. We run the planned trial 2,000 times and count the share that reach significance.

```r
# Estimate the power of the 20-per-arm design from 2,000 simulated trials
set.seed(11)
p2000 <- replicate(2000, one_trial(20))

hist(p2000, breaks = 40, col = "grey85", border = "white",
     main = "2,000 trials of the planned design, effect present in every one",
     xlab = "p-value")
abline(v = 0.05, col = "red", lwd = 3)

mean(p2000 < 0.05)
#> [1] 0.5235
```

The bars to the left of the red line are the trials that reached significance. Every trial to the right of it made a Type II error. Notice how much of the pile sits on the wrong side, and how far right some of it goes: plenty of these trials, all of them run on a program that genuinely works, came back with p above 0.4.

The share on the good side is 0.5235. That number is the power of the clinic's design, estimated by counting.

You do not have to simulate to get it. Base R solves the same quantity in one line with `power.t.test()`.

```r
# The same power from the formula instead of the simulation
power.t.test(n = 20, delta = 10, sd = 15)
#> 
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

`n` is the sample size per arm, `delta` is the true difference in means, and `sd` is the standard deviation within an arm. `sig.level` was not supplied so it defaulted to 0.05, and `power` was not supplied either, which is why power is the thing that came back: 0.5378.

Our count gave 0.5235 and the formula gives 0.5378. They land in the same place without matching exactly, for two reasons worth knowing. 2,000 runs pin a share like this down to about one percentage point either way, and `t.test()` ran the Welch version while `power.t.test()` assumes both arms share one standard deviation.

[KEY INSIGHT]
Power belongs to the design, not to the data. It is fixed by four things you choose before recruiting anyone: the effect you want to catch, the noise in the measurement, the sample size, and alpha.

=== step === widget
## Why a trial of 20 per arm detects this effect only half the time

0.54 is a strange number to land on. It is worth seeing where it comes from, because that is what tells you which quantity to change.

A t-test does not look at the 10 mmHg gap on its own. It divides that gap by its standard error, which is how much the measured gap bounces around from trial to trial. For a difference between two arms of `n` patients each, that standard error is `sd * sqrt(2/n)`.

```r
# The expected size of the t statistic for the planned trial
se_diff    <- 15 * sqrt(2 / 20)        # standard error of the difference, mmHg
expected_t <- 10 / se_diff             # the 10 mmHg effect measured in standard errors
critical_t <- qt(0.975, df = 38)       # the value t has to beat at alpha 0.05

round(c(se = se_diff, expected_t = expected_t, critical_t = critical_t), 3)
#>         se expected_t critical_t 
#>      4.743      2.108      2.024
```

So the gap the clinic expects, 10 mmHg, is worth 2.108 standard errors. And to clear 0.05 with 38 degrees of freedom, the t statistic has to reach 2.024.

Those two numbers are almost on top of each other. That is the whole story of this design.

The plot below draws the distribution the test compares against, with the observed t marked and its two-sided tail shaded. Drag the slider to move the observed t.

::widget null-distribution {"tails": 2, "start": 2.10, "label": "observed t"}

The curve is the standard normal, which sits very close to the t distribution with 38 degrees of freedom this trial uses. The axis is the t statistic, so 0 means the two arms came out level and 2 means the measured gap was twice its standard error.

The slider opens as near as it goes to our expected t of 2.108, and the shaded tail reads 0.036. That is a significant result. Now pull the slider back to 1.50, the t from a perfectly ordinary trial where the measured gap came in a bit under expectation. The tail swells to 0.134 and the result is gone.

That is what a power of 0.54 looks like from the inside. The clinic's trial has an expected t of 2.108 sitting barely above the bar of 2.024, and each actual trial scatters either side of that expectation. A little above and it clears the bar, a little below and it does not. Slightly more than half of them land on the right side, which is the 0.5378.

=== step === quiz
## Quick check: what does a power of 0.54 mean?

The clinic's planned design has a power of 0.54. Which sentence says what that number is?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There is a 54% chance that the exercise program lowers blood pressure. ::no
- If the program truly lowers pressure by 10 mmHg, about 54% of trials of this design come back with p below 0.05. ::ok Exactly. Power is a probability about the trial, computed inside a world where the effect is already assumed to be real. Nothing about it says how likely the program is to work.
- The design has a 46% Type I error rate, so nearly half its significant results are false alarms. ::no
- The true effect is probably about half the 10 mmHg the clinic hoped for. ::no Power says nothing about whether the program works or how big its effect is. It answers one question only: assuming the effect is exactly the size you specified, how often does a trial of this size and this noise reach your alpha? The 46% left over is the Type II error rate, the share of trials that miss a real effect, and it has nothing to do with false alarms.

=== step === concept
## How many patients per arm reach 80% power?

A design that finds a real effect 54% of the time is close to a coin flip. The convention most funders and journals ask for is 80%, which still misses a real effect one time in five but is the usual bar.

So the question turns around. Instead of asking what power 20 patients per arm buys, ask what sample size buys 80% power. We can get there by simulation first, running the trial 500 times at each of six sample sizes and counting the share that reach significance in each.

```r
# Simulated power at six different sample sizes per arm
set.seed(21)
n_per_arm <- seq(10, 60, by = 10)
sim_power <- sapply(n_per_arm, function(n) mean(replicate(500, one_trial(n)) < 0.05))

data.frame(n_per_arm, sim_power)
#>   n_per_arm sim_power
#> 1        10     0.316
#> 2        20     0.504
#> 3        30     0.706
#> 4        40     0.840
#> 5        50     0.910
#> 6        60     0.940
```

The 20-per-arm row, the design we started with, reads 0.504. That is the same number we counted at 0.5235 a moment ago, only from 500 runs instead of 2,000, so it wobbles a bit more. Power climbs steeply at first and then flattens out: going from 10 to 20 per arm buys 19 points, going from 50 to 60 buys 3. And 0.80 gets crossed somewhere between 30 and 40 per arm.

`power.t.test()` gives the exact crossing point. This time we supply the power we want and leave `n` out.

```r
# Solve for the sample size that reaches 80% power
power.t.test(delta = 10, sd = 15, power = 0.80)
#> 
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

Read the output as a set of five quantities: `n`, `delta`, `sd`, `sig.level` and `power`. Give the function any four of them and it returns the fifth. That is the whole interface, and it is why the same function answered a completely different question a moment ago.

Here it returns `n = 36.3058` per arm. You cannot recruit a third of a patient, so round up: **37 per arm, 74 patients in total.**

That is the answer the clinic came for. Against the 40 they budgeted, they are 34 patients short, and they now know that before writing a single consent form rather than after a year of recruitment.

=== step === concept
## What a trial of 20 per arm can detect, and what a looser alpha buys

Often 74 is not on offer. The budget is 40 patients and no amount of arithmetic will change it. Two questions are worth asking in that situation, and `power.t.test()` answers both by leaving a different argument out.

First, if we are stuck at 20 per arm, how big would the effect have to be for us to catch it reliably? Leave `delta` out and supply the power instead. Second, what happens if we relax alpha from 0.05 to 0.10?

```r
# What 20 per arm can detect, and what a looser alpha changes
mde_20    <- power.t.test(n = 20, sd = 15, power = 0.80)$delta
power_a10 <- power.t.test(n = 20, delta = 10, sd = 15, sig.level = 0.10)$power
n_a10     <- power.t.test(delta = 10, sd = 15, power = 0.80, sig.level = 0.10)$n

data.frame(
  quantity = c("smallest effect 20 per arm can detect, mmHg",
               "power at 20 per arm when alpha is 0.10",
               "n per arm for 80% power when alpha is 0.10"),
  value = round(c(mde_20, power_a10, n_a10), 2)
)
#>                                      quantity value
#> 1 smallest effect 20 per arm can detect, mmHg 13.64
#> 2      power at 20 per arm when alpha is 0.10  0.66
#> 3  n per arm for 80% power when alpha is 0.10 28.52
```

The first row is the **minimum detectable effect**, and at 13.64 mmHg it is bigger than the 10 mmHg the clinic is actually looking for. A study built like this is tuned to find something larger than the thing it set out to find, which is a useful sentence to be able to say in a planning meeting.

The other two rows show what moving alpha does. Loosening it to 0.10 lifts power at 20 per arm from 0.54 to 0.66, and drops the sample size needed for 80% power from 36.3 to 28.5, so 29 per arm instead of 37. That looks like a bargain.

[WARNING]
Alpha is the false-alarm rate. Calling a difference real when there is none is a **Type I error**, and alpha is how often you agree to make one. Moving it from 0.05 to 0.10 means that if the exercise program does nothing at all, 1 trial in 10 still comes back significant instead of 1 in 20. The extra power was not created out of nothing. It was bought with Type I errors.

=== step === concept
## Why power computed after the study tells you nothing

Suppose the clinic runs the trial anyway at 20 per arm and gets the result from the first run we simulated: a 7.06 mmHg difference and p = 0.192. A reviewer asks whether the study was big enough.

It is tempting to do this: take the difference the study actually produced, feed it back into `power.t.test()`, and report the power that comes out. This is **post-hoc power**, sometimes called observed power, and it is one of the most common mistakes in applied statistics.

```r
# Post-hoc power from the observed difference, and the numbers to report instead.
# usual, program and tt are the two arms and the t-test from the first run.
obs_diff  <- mean(program) - mean(usual)
pooled_sd <- sqrt((var(program) + var(usual)) / 2)
round(c(obs_diff = obs_diff, pooled_sd = pooled_sd), 2)
#>  obs_diff pooled_sd 
#>      7.06     16.82

power.t.test(n = 20, delta = obs_diff, sd = pooled_sd)$power
#> [1] 0.252973

round(as.numeric(tt$conf.int), 1)
#> [1] -3.7 17.8
```

Post-hoc power comes out at 0.253, and it is worthless. At a fixed sample size and a fixed alpha, post-hoc power is a one-to-one function of the p-value: a large p always produces low observed power and a small p always produces high observed power. Reporting 0.253 next to p = 0.192 is reporting the same fact twice in two different units.

It is also answering the wrong question. Power is about the effect you cared enough to design for, which was 10 mmHg. Post-hoc power uses the effect this one sample happened to produce, which was 7.06 and could just as easily have been 3 or 14.

Two numbers do belong in that report. The first is the power the design had for the effect that mattered, 0.538, fixed before any patient was seen. The second is the confidence interval printed above, from -3.7 to 17.8 mmHg.

Read that interval carefully. It contains 0, so this trial cannot rule out a program that does nothing. It also contains 10, so it cannot rule out the full effect the clinic hoped for. The honest summary is not "the program does not work". It is "this study was too small to tell".

=== step === widget
## Effect size, and why a smaller effect needs many more patients

Every number so far has been in mmHg, which is fine inside one clinic and useless across studies. A 10 mmHg effect means nothing to someone measuring cholesterol or exam scores.

The fix is to divide the effect by the noise it has to be seen through. That ratio is the standardised effect size, **Cohen's d**.

\[ d = \frac{\delta}{\sigma} = \frac{10}{15} = 0.67 \]

The clinic's effect is 0.67 standard deviations. Cohen's rough conventions put 0.2 at small, 0.5 at medium and 0.8 at large, so this trial is chasing something between medium and large.

The plot below carries those three conventional effect sizes rather than the clinic's own numbers. Switch between them and read the curve of power against sample size at alpha 0.05.

::widget power-curve {}

A medium effect, d = 0.5, needs about 63 patients per group to reach 80% power. A large effect, d = 0.8, needs about 25. Our d = 0.67 sits between those two buttons, and `power.t.test()` put the exact figure at 37 per arm.

Notice how fast that number moves. Going from d = 0.8 to d = 0.5 is a modest change in the effect and it more than doubles the patients. The reason is that n scales with \(1/d^2\), so halving the effect roughly quadruples the sample.

Watch that happen on the clinic's own design. Suppose the program only lowers pressure by 5 mmHg, not 10, with the same 15 mmHg standard deviation.

```r
# The sample size if the program only lowers pressure by 5 mmHg instead of 10
power.t.test(delta = 5, sd = 15, power = 0.80)
#> 
#>      Two-sample t test power calculation 
#> 
#>               n = 142.2466
#>           delta = 5
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

Halving the effect took d from 0.67 to 0.33 and took the sample from 37 per arm to 143, so 286 patients instead of 74. Small effects are not slightly more expensive to prove. They are several times more expensive.

=== step === quiz
## Quick check: reading a trial that came back at p = 0.19

The clinic ran the 20-per-arm trial, got a 7.06 mmHg difference and p = 0.192, and now has to write it up. What is the right thing to say?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The exercise program does not lower blood pressure, since the test came back non-significant. ::no
- Compute the power from the observed 7.06 mmHg difference, to show how underpowered the study was. ::no
- A design that finds this effect about half the time cannot settle the question either way, so the result is uninformative rather than negative. ::ok Yes. The design had 0.538 power for the effect that mattered, and the interval ran from -3.7 to 17.8 mmHg, holding both 0 and 10. Nothing was ruled out.
- Report the result at alpha 0.10, where a p of 0.192 is closer to the threshold. ::no The trial did not answer the question, and none of the other three options say so. A non-significant result from a design that misses real effects half the time is not evidence of no effect. Power computed from the observed difference only restates p. And moving alpha after seeing the data doubles the false-alarm rate to rescue a result, which is exactly backwards.

=== step === tryit
## Your turn: what does a quieter measurement buy?

The clinic cannot find 74 patients. But sample size is only one of the quantities in the calculation, and the noise is another.

Blood pressure varies enormously between people, and a lot of that 15 mmHg standard deviation is variation between patients rather than anything to do with the program. Measuring each patient against their own baseline strips out much of it. Say that careful protocol brings the standard deviation of the drop down from 15 to 12 mmHg. The effect is still 10 mmHg and alpha is still 0.05.

Write two lines: first solve for the sample size per arm that now reaches 80% power, then compute the power that the original 20 per arm now buys.

```r
# The effect is still 10 mmHg and alpha is still 0.05, but the standard
# deviation of the drop is now 12 instead of 15.
# Line 1: solve for the n per arm that reaches 80% power.
# Line 2: the power that 20 per arm buys at the new standard deviation.
# Two lines. Press Check when you have them.
```
::check {"regex": "power[.]t[.]test[\\s\\S]*sd\\s*=\\s*12", "gate": true, "difficulty": "intermediate", "ok": "Right: 23.6 per arm, so 24, which is 48 patients in total against the 74 the noisier measurement needed. And 20 per arm now buys 0.728 power, much better, though still short of 0.80.", "no": "Both lines are power.t.test calls with sd = 12. For the first, give delta and power and leave n out. For the second, give n = 20 and delta and leave power out."}
::solution
```r
# Re-solve the design when the standard deviation of the drop falls to 12 mmHg
power.t.test(delta = 10, sd = 12, power = 0.80)$n
#> [1] 23.60472

power.t.test(n = 20, delta = 10, sd = 12)$power
#> [1] 0.7284655
```

Cutting the standard deviation from 15 to 12 raised d from 0.67 to 0.83 and cut the trial from 74 patients to 48. A better measurement protocol is usually far cheaper than 26 more patients, and it is the option people forget they have.

=== step === concept
## References

- [A Power Primer](https://doi.org/10.1037/0033-2909.112.1.155) - Cohen (1992), Psychological Bulletin 112(1), 155-159. Where the small, medium and large conventions for d come from, and how Cohen meant them to be used.
- [The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis](https://doi.org/10.1198/000313001300339897) - Hoenig and Heisey (2001), The American Statistician 55(1), 19-24. The full argument for why power computed from the observed effect diagnoses nothing.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button and colleagues (2013), Nature Reviews Neuroscience 14, 365-376. What a research literature built out of underpowered studies looks like.
- [Sample Size Justification](https://doi.org/10.1525/collabra.33267) - Lakens (2022), Collabra: Psychology 8(1), 33267. How to defend the effect size your power calculation is built on, which is the hard part in practice.
- [power.t.test documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team. The five arguments, and the rule that exactly one of them is left out.

=== step === complete
## Quick recap

You started with a planned trial and no patients, and you finished with a number the clinic can budget against. Here is the whole thing in five lines.

- **Power is the share of trials that reach significance when the effect really is there.** You counted it for the clinic's design: 0.5235 across 2,000 simulated trials, and `power.t.test()` gave 0.5378.
- **40 patients was not enough.** That design buys 0.54 power for a 10 mmHg effect. It takes 74 patients, 37 per arm, to clear 0.80.
- **Five quantities are locked together**: sample size, the effect you want to detect, the noise, alpha and power. Give `power.t.test()` any four of them and it returns the missing one.
- **Sample size scales with \(1/d^2\).** Chasing 5 mmHg instead of 10 took the trial from 74 patients to 286. Cutting the noise from 15 to 12 took it down to 48.
- **Power is a planning number.** Computed after the fact from the effect the data produced, it only restates the p-value, and it cannot tell you whether the study was big enough.

The next time someone hands you a study design, you have a concrete thing to ask for: the effect worth detecting, the noise around it, and the power the design has to catch it. If nobody has worked those out, the sample size is a guess.

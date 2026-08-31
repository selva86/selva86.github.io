---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
description: "Work out the power of a study before you run it: count how often 40 patients catch a real 10 mmHg drop, then find the sample size that reaches 80% power."
keywords: "power analysis, statistical power, sample size calculation, power.t.test in R, Cohen's d, type II error, minimum detectable effect, post-hoc power"
mathjax: true
webr: true
date: "2026-08-31"
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
catalog_blurb: "How many patients a study needs before it is worth running."
---

=== step === cover
::eyebrow Inference from Zero
## Power analysis: find the sample size you need

Let's say a cardiologist, Dr. Rao, is planning a twelve week trial at her small clinic: supervised exercise for her patients with high blood pressure. Three numbers sit on her planning sheet.

She can recruit forty patients in a year, twenty into the exercise program and twenty into usual care. She wants to catch a drop of 10 mmHg in systolic pressure, because anything smaller would not change how she treats anybody. And any one patient's reading lands about 14 mmHg away from the average of the group they are in.

Those three numbers already answer a question she has not thought to ask. Suppose the program really works, exactly as well as she hopes. She runs the trial. How often would it come back saying nothing happened?

The answer is not never, and it is not anywhere close to never. A study can be right about the world and still come back empty, simply because it was too small to see what it went looking for. The share of the time it does see it is called power, and you can work it out on paper before a single patient walks in.

So here is what we are going to do with her three numbers.

::widget process-flow {"steps":[{"title":"Name the drop worth catching","sub":"10 mmHg of systolic pressure, and nothing smaller"},{"title":"Measure how noisy the readings are","sub":"patients scatter by about 14 mmHg within an arm"},{"title":"Count the trials that catch it","sub":"run the trial 5,000 times, count the significant ones"}]}

Two answers come out of it: how often 40 patients catch a real 10 point drop, and how many patients it takes to push that to 80 in every 100. Both come from one R function, and you will know what every argument in it is doing.

=== step === concept
## The trial the clinic is about to run

Let's start by writing the trial down as numbers we can draw from.

On usual care, systolic pressure in her patients sits around 150 mmHg. If the program works the way she hopes, the twenty patients on it finish week twelve around 140, ten points lower. Individual patients scatter around whichever average applies to them by about 14 mmHg either way, and that number comes from four years of her own clinic records, not from a guess.

That is enough to draw one trial. `rnorm(20, mean = 150, sd = 14)` gives twenty usual-care patients, each with a plausible week-twelve reading, and the second call gives the twenty on the program with their average sitting 10 points lower. Then `t.test()` compares the two arms the way the clinic would.

Press Run.

```r
# Draw one run of the trial and test the exercise arm against usual care
set.seed(20)
usual   <- rnorm(20, mean = 150, sd = 14)   # usual care, systolic BP at week 12
program <- rnorm(20, mean = 140, sd = 14)   # exercise program, truly 10 points lower

mean(usual) - mean(program)                 # the drop this trial measured, in mmHg
#> [1] 9.777166

t.test(program, usual, var.equal = TRUE)
#>
#> 	Two Sample t-test
#>
#> data:  program and usual
#> t = -2.0097, df = 38, p-value = 0.0516
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -19.62576034   0.07142863
#> sample estimates:
#> mean of x mean of y
#>  137.5941  147.3713
```

`set.seed(20)` fixes the random draw, so your forty patients are the same forty as mine.

The program arm came out 9.78 mmHg below usual care. The truth we built into the draw was exactly 10, so this trial landed about as close to the right answer as anyone could ask for.

Now read the p-value: 0.0516.

That number answers one narrow question. If the exercise program did nothing at all, how often would chance alone open a gap this wide between two groups of twenty? About 5.16 times in every 100. Nearly everybody calls a result significant when that figure falls below 0.05, and 0.0516 does not.

So the program worked, the trial measured it almost perfectly, and the write-up still has to say there was no significant benefit. Nothing went wrong anywhere in that chain. That is simply what a trial of forty patients buys you.

=== step === concept
## Power is the share of trials that catch a real effect

One trial is one trial. The particular forty people who walked through the door decided that 0.0516, and a different forty would have handed back something else entirely.

So let's stop arguing about this one and run the whole thing again. And again. Five thousand times, with the real 10 point drop switched on in every single run, exactly as we set it up. The only thing that changes from run to run is which patients we happen to draw.

`replicate()` does the repeating, and we keep only the p-value out of each trial.

```r
# Run the same trial 5,000 times and count how many reach p below 0.05
set.seed(7)
pvals <- replicate(5000, {
  u <- rnorm(20, mean = 150, sd = 14)
  p <- rnorm(20, mean = 140, sd = 14)
  t.test(p, u, var.equal = TRUE)$p.value
})

sum(pvals < 0.05)     # trials that cleared the 0.05 bar
#> [1] 3003
mean(pvals < 0.05)    # the same count as a share of all 5,000
#> [1] 0.6006

hist(pvals, breaks = 40, col = "grey85", border = "white",
     main = "5,000 trials, every one with a real 10 point drop",
     xlab = "p-value")
abline(v = 0.05, col = "red", lwd = 3)
```

3,003 of the 5,000 trials came back under 0.05. As a share, 0.6006.

That share is the power of this study design. Sixty times in every hundred, a clinic running this exact trial, on a program that genuinely lowers pressure by 10 points, would end the year with a significant result. The other forty times they would do everything right and report nothing.

The histogram shows where those forty misses went. The p-values pile up hard against zero, which is what a real effect does, and then a long tail spreads out to the right of the red line at 0.05. Every bar out in that tail is a year of recruiting, twelve weeks of supervised exercise, and a conclusion that the program showed no benefit.

Missing an effect that is really there has a name. It is a **Type II error**, and power is one minus how often you make one. Here that rate is 0.3994, so the clinic has a two in five chance of doing everything right and finding nothing.

[KEY INSIGHT]
Power is the share of repeats that come back significant when the effect is genuinely there. You did not have to take that definition on trust. You counted it: 3,003 out of 5,000.

=== step === concept
## The five numbers a power calculation ties together

Counting 5,000 trials is the honest way to see what power is. It is not how anybody works it out at a desk.

Base R ships `power.t.test()`, and it holds five numbers together in one relationship:

1. `n`, the number of patients in each arm
2. `delta`, the difference in means worth detecting, in the units you measured
3. `sd`, how much individual readings scatter inside an arm
4. `sig.level`, the p-value cut-off you will judge against, usually 0.05
5. `power`, the share of trials that clear that cut-off

Give it any four of the five and it solves for the one you left out. So hand it the four numbers the clinic already knows, and it hands back the fifth.

```r
# Ask for the power of the clinic design instead of simulating it 5,000 times
power.t.test(n = 20, delta = 10, sd = 14, sig.level = 0.05)
#>
#>      Two-sample t test power calculation
#>
#>               n = 20
#>           delta = 10
#>              sd = 14
#>       sig.level = 0.05
#>           power = 0.5954089
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

0.5954. The five thousand simulated trials gave 0.6006. Those two agree to two decimal places because they answer the identical question, and the only difference is that one of them took five thousand trials to get there.

Read the last line of the output before moving on, because it catches people out. `n = 20` means twenty patients in each arm. Forty in total.

The line above it says the test was two-sided. A rise in pressure would register just as readily as a drop, which is what `t.test()` did on the single trial without being asked.

=== step === quiz
## Quick check: what does power of 0.60 mean?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There is a 60% chance the exercise program really does lower blood pressure. ::no
- If the program really does lower pressure by 10 points, about 60 out of every 100 trials this size would come back significant. ::ok Exactly. Power belongs to the design, not to the result. It was settled the moment the clinic chose 20 patients per arm, a 10 point target and a spread of 14, and you can read it off before anybody is recruited.
- The p-value this trial produced can be trusted about 60% of the time. ::no
- About 40% of trials like this one would report a benefit that was never really there. ::no Power says nothing at all about whether the program works, and it is not a confidence rating attached to a p-value. It assumes the 10 point drop is real and reports how often a trial this size would catch it, which is 60 times in 100. The 40 that miss are not false alarms either. They are real effects going unreported.

=== step === concept
## Why the effect only counts relative to the noise

Two of those five numbers never act on their own. `delta` and `sd` only ever reach the calculation as a ratio, and the quickest way to see that is to double both of them at once.

```r
# Compare two designs that share an effect-to-noise ratio but not the raw numbers
power.t.test(n = 20, delta = 10, sd = 14, sig.level = 0.05)$power
#> [1] 0.5954089

power.t.test(n = 20, delta = 20, sd = 28, sig.level = 0.05)$power
#> [1] 0.5954089

# the ratio itself, for the clinic
10 / 14
#> [1] 0.7142857
```

A 20 point drop in patients who scatter by 28 mmHg is exactly as hard to detect as a 10 point drop in patients who scatter by 14. Not roughly as hard. The same number to seven decimal places.

The ratio those two designs share has a name, and it is what a published sample-size calculation is quoting when it says how big an effect the study was powered for.

\[ d = \frac{\text{delta}}{\text{sd}} = \frac{10}{14} = 0.714 \]

That is **Cohen's d**, the effect measured in standard deviations instead of in mmHg. The clinic is chasing a drop worth 0.714 standard deviations of the thing they are measuring.

So the five numbers are really four. And notice what that does to the effect size. It becomes a question about the outcome you chose to measure as much as about the treatment you are testing. Ten points is a comfortable target in a clinic whose readings scatter by 14 mmHg. Take the same program to a population whose pressure swings twice as widely, d halves, and everything downstream of it gets more expensive.

=== step === concept
## How to solve for the sample size instead of the power

So far we have handed `power.t.test()` four numbers and let it return the power. The clinic wants it the other way round. They know the power they would like, and they want the sample size that buys it.

Which power, though? The convention is 0.80, and you will find it in almost every grant application and trial protocol ever written. There is nothing mathematical behind it. Cohen proposed it as a sensible default and the field kept it, so it is a habit with a good reason behind it rather than a law. In practice it means you accept a 1 in 5 chance of missing a real effect, which is a fair trade for a low-risk exercise program and much harder to justify for a cancer drug.

To ask the question backwards, leave `n` out of the call and put `power` in instead.

```r
# Leave the sample size out and ask for the n that reaches 80% power
power.t.test(delta = 10, sd = 14, sig.level = 0.05, power = 0.80)
#>
#>      Two-sample t test power calculation
#>
#>               n = 31.75716
#>           delta = 10
#>              sd = 14
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

31.76 patients per arm. You cannot recruit three quarters of a patient, and rounding down would leave the study short of its own target, so it rounds up to 32 per arm. Sixty-four patients in total.

Let's confirm the rounded number really does clear the bar.

```r
# Check the power the clinic actually gets at the rounded-up size
power.t.test(n = 32, delta = 10, sd = 14, sig.level = 0.05)$power
#> [1] 0.803077
```

0.803, a little over target, which is exactly what rounding up should do.

That is the answer the planning sheet was really asking for, and it is not 40. Twenty-four more patients, twelve in each arm, is the whole difference between a trial that misses two times in five and one worth running.

=== step === widget
## How the required sample size moves with the effect size

The clinic sits at one point on a curve. Here is the whole curve.

Power runs up the vertical axis and the number of patients per arm runs along the bottom. The toggle switches between the three effect sizes Cohen offered as rough labels for the field, 0.2 for small, 0.5 for medium and 0.8 for large, and a red mark sits on the curve at the sample size that reaches 80% power. On the small setting there is no mark to find, because the curve has still not got there by 300 patients an arm.

::widget power-curve {}

Switch between medium and large and read the two sample sizes off. The clinic sits at 0.714, between those two settings, which is exactly why their 32 per arm landed between the two marks.

Two things about the shape of that curve matter more than any single number on it.

The first is that the curve climbs steeply through the middle and goes nearly flat once it passes 0.8. Twelve extra patients per arm took the clinic from 0.60 power to 0.80. The next twelve add about half that much, and the twelve after those about half again. That is why insisting on 95% power costs so much more than the last fifteen points look like they are worth.

The second is that the whole curve slides left as the effect grows. Halve the effect size and you roughly quadruple the sample you need, because power tracks n times d squared rather than n times d. That is the most expensive fact in study design: a treatment half as good costs four times as much to prove.

=== step === concept
## The smallest drop 40 patients could ever detect

The clinic may simply not get 64 patients. Budgets and waiting lists being what they are, forty may be a hard ceiling and not a first guess.

There is a third way to run the same function, and it is the one to reach for when the sample size cannot move. Hold `n` at 20 per arm, hold the power target at 0.80, and this time leave `delta` out. The question stops being how many patients, and becomes how big a drop those patients could reliably catch.

```r
# Fix the 40 patients and solve for the smallest drop they could reliably catch
power.t.test(n = 20, sd = 14, sig.level = 0.05, power = 0.80)
#>
#>      Two-sample t test power calculation
#>
#>               n = 20
#>           delta = 12.72783
#>              sd = 14
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

12.73 mmHg.

Hold that against the planning sheet. The clinic set out to detect a drop of 10 points. Forty patients can only reliably detect a drop of 12.73 points or more. The effect they care about sits underneath the smallest effect their study can see, and that was true before anybody was recruited, before anybody exercised, and before there was any data to analyse.

That quantity is called the **minimum detectable effect**, and it is the number to compute whenever the sample size is not yours to choose. It turns an uncomfortable constraint into a plain sentence you can say out loud in a meeting. This trial can find a drop of thirteen points. It cannot reliably find a drop of ten.

[KEY INSIGHT]
Every fixed sample size implies a smallest effect it can reliably see. When that effect is larger than the one you actually care about, the study cannot answer your question, and no amount of careful analysis afterwards will rescue it.

=== step === concept
## Why power worked out after the study tells you nothing new

Suppose the clinic runs the trial with its forty patients anyway, gets that p of 0.0516, and somebody in the meeting asks the obvious follow-up. Was the study underpowered? Let's work its power out from what actually happened.

That sounds like the sensible thing to do. The trial handed us a drop of 9.78 mmHg and two arms we can compute the spread from directly, so we would be feeding in measurements instead of hopes. Watch what comes back.

```r
# Recompute power from the drop and the spread this trial actually observed
obs_drop <- mean(usual) - mean(program)
obs_sd   <- sqrt((var(usual) + var(program)) / 2)   # pooled SD, both arms are size 20

round(c(drop = obs_drop, sd = obs_sd), 2)
#>  drop    sd
#>  9.78 15.38

power.t.test(n = 20, delta = obs_drop, sd = obs_sd, sig.level = 0.05)$power
#> [1] 0.4995412
```

0.4995. Almost exactly one half.

That is not a coincidence, and it is not new information. Observed power is computed from the observed effect, and the observed effect is the very thing that produced the p-value. So observed power is the p-value stated again and nothing more. A p-value sitting right on the 0.05 line always returns an observed power near 0.5, and a smaller p-value always returns a higher one. It could not come out any other way, and that is exactly why it explains nothing.

A non-significant result paired with a low observed power is one fact reported twice, not two facts backing each other up. The reasoning runs in a circle: the study missed, so it must have been underpowered, and we know it was underpowered because it missed.

[WARNING]
Never compute power from your own results. That calculation has a name, observed power, or post-hoc power, and it is your p-value in different arithmetic. A reviewer who knows the literature will say so. When a trial comes back with nothing, report the minimum detectable effect instead: this design could reliably find a drop of 12.73 mmHg, and it did not find one.

=== step === quiz
## Quick check: reading a trial that missed

The clinic ran the trial with its forty patients. The exercise arm finished 9.78 mmHg lower, the test returned p = 0.0516, and somebody has to write the conclusion. Which reading is the right one?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The exercise program does not lower blood pressure, and this trial has shown it. ::no
- The trial was never in a position to answer the question: forty patients could only reliably detect a drop of 12.73 mmHg, and the clinic cared about 10. ::ok Yes. The design was settled before any data existed, and it could never reliably see the drop the clinic went looking for. That sentence is the honest write-up, and it is also the one that gets the next study funded at 64 patients.
- 0.0516 is close enough to 0.05 to call the program effective. ::no
- Work the power out from the observed 9.78 point drop to find out whether the trial was big enough. ::no A trial that misses has not proved the effect is absent: forty patients here would miss a genuine 10 point drop about forty times in a hundred. Nudging 0.0516 across the line is just moving the bar after seeing the data. And recomputing power from the observed drop returns 0.4995, which is only the p-value stated again. The one number that says something new is the smallest drop this design could ever reliably find, 12.73 mmHg.

=== step === tryit
## Your turn: size the trial when the readings are noisier

One number moves now, and in practice it is the one that moves most often.

Dr. Rao looks again at who she will actually be recruiting. The 14 mmHg came from every patient on her books, and the ones eligible for this trial, the ones whose pressure is hardest to control, scatter by 18 mmHg. The drop worth catching is still 10 points and the cut-off is still 0.05. Two questions follow, and `power.t.test()` answers both.

First, what power does the planned 32 patients per arm buy once the readings are that noisy? Second, what sample size gets back to 80%?

```r
# The clinic records now put the within-arm spread at 18 mmHg, not 14.
# One: the power that n = 32 per arm buys at that spread.
# Two: the n per arm that reaches 0.80 power at that spread.
# Two calls to power.t.test. Press Check when you have them.
```
::check {"regex": "power[.]t[.]test[^)]*sd\\s*=\\s*18", "gate": true, "difficulty": "intermediate", "ok": "That is it. 32 per arm now buys only 0.590, and 80% power costs 51.84 per arm, so 52 each way and 104 patients in total. The spread rose by less than a third and the sample size needed rose by nearly two thirds.", "no": "Both calls keep delta = 10 and sig.level = 0.05 and change sd to 18. For the first, pass n = 32 and read the power back with a trailing $power. For the second, drop n from the call and pass power = 0.80 instead."}
::solution
```r
# The power that 32 patients per arm buys when the spread is 18 mmHg
power.t.test(n = 32, delta = 10, sd = 18, sig.level = 0.05)$power
#> [1] 0.5900791

# The sample size that gets back to 80% power at that spread
power.t.test(delta = 10, sd = 18, sig.level = 0.05, power = 0.80)$n
#> [1] 51.83884
```

Nothing about the treatment changed there. The program still lowers pressure by 10 points and the cut-off is still 0.05. All that happened is the clinic worked out the spread among the patients it will actually enrol rather than among all of them, and the price of the study went from 64 patients to 104. That is why the spread is worth an hour of checking against the real recruitment list before anybody commits to a number.

=== step === concept
## References

- [A Power Primer](https://doi.org/10.1037/0033-2909.112.1.155) - Cohen (1992), Psychological Bulletin 112(1), 155-159. The source of the small, medium and large labels the curve toggles between, and the paper that argues for 0.80 as a default rather than a rule.
- Statistical Power Analysis for the Behavioral Sciences, 2nd edition - Cohen (1988), Lawrence Erlbaum. The book behind that primer, and still the clearest case for doing this arithmetic before collecting data instead of after.
- [The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis](https://doi.org/10.1198/000313001300339897) - Hoenig and Heisey (2001), The American Statistician 55(1), 19-24. The paper that works through why observed power is a rewrite of the p-value.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button and colleagues (2013), Nature Reviews Neuroscience 14, 365-376. What an entire field looks like once underpowered studies become normal.
- [Power calculations for two-sample t tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team, the documentation for the function used throughout.

=== step === complete
## Quick recap

You worked out the power of a study nobody has run yet, then turned the same calculation around twice to get the two numbers a clinic actually needs. To pull it together:

- Power is the share of repeats that come back significant when the effect is real. You counted it rather than looking it up: 3,003 trials out of 5,000, which is 0.6006.
- `power.t.test()` ties five numbers together, `n`, `delta`, `sd`, `sig.level` and `power`. Give it four and it returns the fifth, whichever one you leave out.
- `delta` and `sd` only matter as a ratio. Ten points of drop against a spread of 14 is Cohen's d of 0.714, and a 20 point drop against a spread of 28 is the identical problem.
- Forty patients bought this clinic 60% power. Sixty-four buy 80%, and the whole gap is twelve extra patients in each arm.
- With the sample size fixed at forty, the smallest drop the trial could reliably catch was 12.73 mmHg, which is larger than the 10 points the clinic cared about.
- Power computed after the results are in tells you nothing the p-value has not already said. Here it came back at 0.4995 for a p of 0.0516, and it always will.

So the next time somebody hands you a study plan with the sample size already written on it, you have one question to ask: what is the smallest effect this many patients could reliably find, and is it smaller than the effect we came here for?

Congratulations, you made it through. Have a great day!

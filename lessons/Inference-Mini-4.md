---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
description: "A clinic can recruit 40 patients to test an exercise program. Run that trial 2,000 times, watch how often it misses a real drop, then size it properly."
keywords: "power analysis in R, statistical power, sample size calculation, power.t.test, minimum detectable effect, Cohen's d, post-hoc power, type II error"
mathjax: true
webr: true
date: "2026-08-23"
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
catalog_blurb: "How many patients a study needs before it can find a real effect."
---

=== step === cover
::eyebrow Inference from Zero
## Power analysis: find the sample size you need

Let's say a community clinic wants to test an exercise program.

They believe twelve weeks of it pulls systolic blood pressure down by about 10 points, and they want to check that against ordinary care. They can afford 40 patients, so twenty go on the program and twenty carry on as usual.

Now, before a single patient is recruited, somebody has to answer this: is 40 enough?

It is an easy question to skip. You recruit the people you can afford, you run the test at the end, and you take whatever comes out. The trouble is that a trial too small to see a 10-point drop will report "no significant difference" even when the drop is sitting right there in the data. The clinic then shelves a program that works, and a year of effort ends in an answer nobody can use.

Power analysis settles it up front. And we are not going to take that on faith, because we can build the clinic's trial ourselves and watch what it does. It comes down to three moves.

::widget process-flow {"steps":[{"title":"Assume the drop is real","sub":"the program truly lowers pressure by 10 points"},{"title":"Run the trial 2,000 times","sub":"same 40 patients, different people each run"},{"title":"Count how often it is found","sub":"the share that comes back significant is the power"}]}

That is all there is to it. We come out of it with the number of patients the clinic needs, and with something more useful: which of the numbers behind that answer is the one worth arguing about.

=== step === concept
## The trial the clinic wants to run

Let's get the numbers on the table first, because everything from here is built out of them.

The outcome is systolic blood pressure in mmHg, measured at week 12. Patients on usual care sit around 140. Patients on the program sit around 130, which is the 10-point drop the clinic is hoping to prove. Each arm, which is just what a trial calls one of its two groups, holds 20 patients, and inside an arm patients differ from one another by about 12 mmHg.

Those five numbers are the clinic's own assumptions about a world where the program works exactly as they expect. We are going to build that world and run their trial inside it.

Press Run.

```r
# Build one 40-patient trial in which the program really does lower pressure by 10 points
set.seed(1)
usual    <- rnorm(20, mean = 140, sd = 12)   # 20 patients on usual care
exercise <- rnorm(20, mean = 130, sd = 12)   # 20 patients on the program

round(c(usual_care = mean(usual),
        exercise   = mean(exercise),
        drop       = mean(usual) - mean(exercise)), 1)
#> usual_care   exercise       drop
#>      142.3      129.9       12.4
```

`rnorm(20, mean = 140, sd = 12)` draws 20 patients whose pressures are centred on 140 and scattered around it with a spread of 12 mmHg. `set.seed(1)` fixes which 40 patients you get, so your numbers match mine.

Notice the drop came out at 12.4 points, not 10. We built the world, so we know the truth is exactly 10, and the trial still overshot by 2.4 points purely because of who happened to walk in. That gap between what is true and what one trial reports is the thing we are here to pin down.

Now hand the two arms to a t-test, which is the analysis the clinic would run at the end of the study.

```r
# Ask the t-test whether the two arms differ
t.test(usual, exercise, var.equal = TRUE)
#>
#> 	Two Sample t-test
#>
#> data:  usual and exercise
#> t = 3.6504, df = 38, p-value = 0.0007846
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>   5.507303 19.220586
#> sample estimates:
#> mean of x mean of y
#>  142.2863  129.9223
```

We built both arms with the same 12 mmHg spread, so `var.equal = TRUE` tells the test to assume what we already know to be true here.

The line to read is `p-value = 0.0007846`. A result gets called significant when that number lands under 0.05, which is the bar the field settled on, and 0.0007846 is under it by a wide margin. So the clinic writes up a clear result and the program gets funded.

So forty patients was enough and the trial worked. Question settled?

=== step === concept
## What happens when the same trial runs 2,000 times

Not quite, because that answer came out of one particular set of 40 people. The clinic gets one run of this study with whoever actually enrols, and they have no way of knowing in advance whether their 40 will behave like these 40.

So let's build 2,000 versions of the same clinic. In every single one the program truly lowers pressure by 10 points, the spread is still 12 mmHg, and there are still 20 patients per arm. The only thing that changes from one run to the next is which 40 people walked in the door.

`run_trial()` below does one such trial and returns three things: the drop it observed, the spread it observed with the two arms pooled into one figure, and its p-value. `replicate()` calls that function 2,000 times and stacks the results into a data frame.

```r
# Run the same 40-patient trial 2,000 times and keep every p-value
run_trial <- function() {
  usual    <- rnorm(20, mean = 140, sd = 12)
  exercise <- rnorm(20, mean = 130, sd = 12)
  tt <- t.test(usual, exercise, var.equal = TRUE)
  c(drop   = mean(usual) - mean(exercise),
    spread = sqrt((var(usual) + var(exercise)) / 2),
    p      = tt$p.value)
}

set.seed(7)
sims <- as.data.frame(t(replicate(2000, run_trial())))

hist(sims$p, breaks = 40, col = "grey85", border = "white",
     main = "2,000 runs of a trial where the 10-point drop is always real",
     xlab = "p-value")
abline(v = 0.05, col = "red", lwd = 3)

sum(sims$p >= 0.05)
#> [1] 543
```

Each bar is a batch of trials, and its height says how many of the 2,000 came back with a p-value that size. Most of the pile is jammed against zero, which is what you would hope for when the effect is real. The red line marks 0.05.

Now read to the right of that line, where 543 trials landed. In every one of those the drop was genuinely present, the study was run correctly, the analysis was done correctly, and the answer that came back was "no significant difference".

That is what a trial of 40 patients actually buys.

=== step === concept
## What statistical power actually is

Let's count both sides of that red line and turn the counts into shares.

```r
# Split the 2,000 trials into the ones that found the drop and the ones that missed it
found  <- sum(sims$p <  0.05)
missed <- sum(sims$p >= 0.05)

c(found = found, missed = missed)
#>  found missed
#>   1457    543

round(c(found = found / 2000, missed = missed / 2000), 4)
#>  found missed
#> 0.7285 0.2715
```

1,457 of the 2,000 trials found the drop. 543 walked past it.

That 0.7285 is the number everything here is built on. **Statistical power** is the probability that a study comes back significant when the effect it is hunting for is genuinely there. So 40 patients gives this clinic about 73% power against a 10-point drop.

The other share is the one nobody quotes. 1 minus power is how often a real effect gets missed, 0.2715 here, or roughly 27 misses in every 100 trials. The miss has a name of its own, the **Type II error rate**, written as the Greek letter beta, and power is simply 1 minus beta.

[KEY INSIGHT]
Power is a property of the study, not of the treatment. The exercise program works identically in all 2,000 runs. What changes is whether a study of this size can see it.

=== step === quiz
## Quick check: what does 73% power mean?

The clinic's trial has 73% power against a 10-point drop. Which sentence says what that means?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 73% of the patients who go on the exercise program will see their blood pressure fall. ::no
- If the program really does lower pressure by 10 points, about 73 of every 100 trials this size come back significant, and the other 27 miss it. ::ok That is it. Power is counted over repeated trials of a given size, in a world where the effect is real, which is exactly what those 2,000 runs were.
- There is a 73% chance the exercise program works. ::no
- 73% of the trials that come back significant have got the right answer. ::no Power says nothing about patients, and nothing about whether the program works. It assumes the effect is real and then reports how often a study of this size manages to detect it. In the 2,000 runs the program worked every single time, and 543 studies still missed it.

=== step === concept
## The same answer in one line with power.t.test()

We spent 2,000 simulated trials to learn one number. There is a formula that gives it directly, and base R already carries it as `power.t.test()`, so there is nothing to install.

Hand it the three things that describe the clinic's trial: 20 patients per arm, a 10-point drop to look for, and a 12 mmHg spread between patients.

```r
# Get the same power from the formula instead of from 2,000 simulated trials
power.t.test(n = 20, delta = 10, sd = 12)
#>
#>      Two-sample t test power calculation
#>
#>               n = 20
#>           delta = 10
#>              sd = 12
#>       sig.level = 0.05
#>           power = 0.7284655
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

`power = 0.7284655`, and our 2,000 trials gave 0.7285. Same number to four decimal places. The formula gets there instantly, and the simulation is what shows you where the number came from.

Now read the NOTE at the bottom. It is the easiest line here to skim past and the most expensive one to get wrong. The 20 we passed in is 20 **per arm**. This is a 40-patient study.

=== step === concept
## The four numbers every power calculation ties together

`power.t.test()` is not really a power calculator. It is a solver for one equation with four moving parts in it:

1. **n**, how many patients are in each arm.
2. **the effect**, the drop worth catching (`delta`) measured against the spread you expect between patients (`sd`).
3. **sig.level**, the p-value bar the result has to clear, conventionally 0.05.
4. **power**, the chance of clearing that bar when the effect is real.

Fix any three of those and the fourth is already decided. R makes you say which one you want by leaving it out, so we left `power` out and it came back filled in.

Turn it around to see that the lock works in every direction. Give it the power we just computed and take `sig.level` out instead.

```r
# Hand R the power and leave the significance level out instead
power.t.test(n = 20, delta = 10, sd = 12, power = 0.7284655, sig.level = NULL)
#>
#>      Two-sample t test power calculation
#>
#>               n = 20
#>           delta = 10
#>              sd = 12
#>       sig.level = 0.04999991
#>           power = 0.7284655
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

`sig.level = 0.04999991`, which is 0.05 give or take the numerical search R ran to land on it. We learned nothing new there, and that is the point: any three of the four pin the fourth.

So the useful move is obvious. Leave out the one you actually want to know.

=== step === concept
## How to solve for the sample size you need

The clinic never asked what 40 patients buys them. They asked how many patients they need. So leave `n` out and tell R what power you want instead. The conventional target is 0.80.

```r
# Solve for the sample size that reaches 80 percent power
power.t.test(delta = 10, sd = 12, power = 0.80)
#>
#>      Two-sample t test power calculation
#>
#>               n = 23.60472
#>           delta = 10
#>              sd = 12
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

`n = 23.60472`. You cannot recruit 0.6 of a patient, and rounding down would leave the study under the power it asked for, so you always round up. That makes it 24 patients per arm, or 48 in total.

That is the answer to the clinic's question, and it is worth saying slowly. 40 patients gives them 73% power and 48 gives them 80%. Eight extra people, decided before anything begins, is the whole difference between a trial that usually finds a real 10-point drop and one that misses it more than a quarter of the time.

[WARNING]
`power.t.test()` returns n per group, every time. Read 24 as the total and you recruit 12 per arm, which lands the trial at just under 50% power. That is a coin flip, from one line read the wrong way.

=== step === tryit
## Your turn: what would 90% power cost?

The clinic sees 24 per arm and asks the obvious follow-up. Eighty percent still means one trial in five comes back empty. What would it take to get that down to one in ten?

Change one argument in the call above and read the answer.

```r
# power.t.test solves for whichever argument you leave out.
# The clinic wants 90 percent power now instead of 80, for the same
# 10-point drop and the same 12 mmHg spread between patients.
# Change one argument and read off the n it hands back.
# Press Check when you have it.
```
::check {"regex": "power\\s*=\\s*0?\\.9", "gate": true, "difficulty": "beginner", "ok": "Right: n = 31.25, so 32 per arm and 64 in total. Ten more points of power cost 16 more patients, a third again on top of the 48.", "no": "Keep delta and sd where they are, and change the power you are asking for: `power.t.test(delta = 10, sd = 12, power = 0.90)`."}
::solution
```r
# Sample size per arm for 90 percent power
power.t.test(delta = 10, sd = 12, power = 0.90)
#>
#>      Two-sample t test power calculation
#>
#>               n = 31.25372
#>           delta = 10
#>              sd = 12
#>       sig.level = 0.05
#>           power = 0.9
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

That is 32 per arm and 64 patients in total. The last bit of certainty is always the expensive one, which is a large part of why 0.80 became the habit.

=== step === concept
## Where delta and sd come from, and why sd drives the number

Everything so far has rested on two numbers we simply assumed: a 10-point drop and a 12 mmHg spread. Those two carry the whole calculation, and they come from completely different places.

`delta` is a judgement call. It is not what the clinic hopes the program achieves, and it is not what some earlier study happened to report. It is the smallest drop that would change what the clinic does, decided from treatment guidelines and what the program costs to run. Ten points is the clinic saying that anything smaller would not be worth the twelve weeks.

`sd` is a claim about the world, and somebody has to source it. It is how much patients differ from each other inside a single arm, and it comes from published data on similar patients or from the clinic's own records. It is also the easiest one to invent, and nothing warns you when it is wrong, because the calculation returns a confident number either way.

Here is the part that catches people out. The two numbers never act separately. Only their ratio ever enters the calculation:

\[ d = \frac{\text{the drop you want to catch}}{\text{the spread between patients}} = \frac{10}{12} = 0.83 \]

That ratio is called **Cohen's d**, and it is the effect measured in standard deviations instead of in mmHg. A 10-point drop among patients who vary by 12 is exactly the same detection problem as a 5-point drop among patients who vary by 6.

Hold the target at 10 points and move the spread alone.

```r
# See how the required sample size moves when only the spread changes
spreads <- c(8, 10, 12, 15, 18)

data.frame(
  sd_mmHg   = spreads,
  cohens_d  = round(10 / spreads, 2),
  n_per_arm = sapply(spreads, function(s)
                ceiling(power.t.test(delta = 10, sd = s, power = 0.80)$n))
)
#>   sd_mmHg cohens_d n_per_arm
#> 1       8     1.25        12
#> 2      10     1.00        17
#> 3      12     0.83        24
#> 4      15     0.67        37
#> 5      18     0.56        52
```

Read the last column. Patients who vary by 8 mmHg need 12 per arm. Patients who vary by 18 need 52. Same program, same 10-point target, same 80% power, and the trial went from 24 patients to 104.

[KEY INSIGHT]
The recruitment budget is decided by how alike your patients are, which is a fact about the population and has nothing to do with the treatment. When a sample size gets challenged, the spread is the number you need an answer ready for.

=== step === quiz
## Quick check: the spread doubles. What happens to n?

A second clinic runs the same program on a rougher population, where patients vary by 24 mmHg instead of 12. They still want to catch a 10-point drop at 80% power. What happens to the 24 per arm?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It doubles, to 48 per arm, because the spread doubled. ::no
- It roughly quadruples, to about 92 per arm, because the sample size moves with the square of the spread over the drop. ::ok Yes. Doubling the spread halves Cohen's d from 0.83 to 0.42, and halving d costs you four times the patients, not twice.
- It stays at 24, because the drop the clinic cares about has not changed. ::no
- It halves, to 12 per arm, since a wider spread makes the two arms easier to tell apart. ::no Read the table as a ratio rather than as five separate rows. Going from a spread of 12 to a spread of 18 is a factor of 1.5, and n went from 24 to 52, which is 1.5 squared. Double the spread and you pay four times over.

=== step === widget
## How power climbs as the sample grows

A table of sample sizes hides the shape behind it. Switch between the three effect sizes below and watch where the curve sits.

::widget power-curve {}

The horizontal axis is patients per arm and the vertical axis is power. The marked point is where each curve crosses 80%, which is the n you would recruit.

Two things in that picture matter.

The first is the shape of a single curve. It climbs steeply out of the bottom left, then flattens off near the top. Down in the middle, every extra patient buys real ground. Up near 90%, it takes a crowd to move it at all, which is what you felt when 90% power cost 16 more patients than 80% did.

The second is how far the whole curve slides when the effect changes. A large effect is caught by a couple of dozen patients per arm. A small one needs hundreds. The clinic's trial sits at d = 0.83, just past the large preset, which is why its numbers have been so comfortably small all along.

=== step === concept
## The smallest drop 40 patients could reliably catch

There is one more way to turn the solver around, and it is the most useful one when the sample size is already fixed by a budget.

Keep n at 20 per arm and the spread at 12 mmHg, ask for 80% power, and leave `delta` out instead.

```r
# Find the smallest drop 20 patients per arm can catch 80 percent of the time,
# then read this trial's power against a drop half again smaller
power.t.test(n = 20, sd = 12, power = 0.80)$delta
#> [1] 10.90957

power.t.test(n = 20, delta = 6, sd = 12)$power
#> [1] 0.3377084
```

10.9 mmHg. That is the smallest drop the clinic's 40-patient trial could reliably catch, and it has a name: the **minimum detectable effect**.

Read what it says about the study. The 10-point drop the clinic actually cares about sits just underneath that bar, which is precisely why the power came out at 73% rather than 80%. And the second line prices out what lies further down. A 6-point drop, which would still be well worth having clinically, is found by this trial 0.34 of the time, so the clinic would walk past it in two studies out of three.

That one number is the honest way to describe a fixed-budget study. You do not say "we have 40 patients". You say "we have a trial that can see 10.9 mmHg and is mostly blind below it".

=== step === concept
## Why power computed after the study is over tells you nothing

Here is the move that follows almost every null result. The trial comes back non-significant, somebody asks what the power was, and somebody else computes it from the study's own observed drop and observed spread. It is called **post-hoc power**, or observed power, and it is worth seeing exactly why it is empty.

We have 2,000 finished trials sitting in `sims`. Let's do that to every one of them: take the drop that trial happened to observe, take the spread that trial happened to observe, and compute the power those two numbers imply. A few of the 2,000 saw pressure move the wrong way, so `abs()` keeps the size of the drop each one reported and throws away the sign.

```r
# Recompute each trial's power from that trial's own drop and spread
posthoc <- mapply(function(d, s) power.t.test(n = 20, delta = abs(d), sd = s)$power,
                  sims$drop, sims$spread)

plot(sims$p, posthoc, pch = 16, cex = 0.4, col = "grey40",
     main = "Power worked out afterwards, against the p-value it came from",
     xlab = "p-value the trial reported", ylab = "post-hoc power")
abline(v = 0.05, col = "red", lwd = 2)
abline(h = 0.505, col = "blue", lwd = 2, lty = 2)

max(posthoc[sims$p >= 0.05])
#> [1] 0.504723
```

Look at what came out. The points do not scatter into a cloud, they lie along a curve. Across all 2,000 trials, every one with a smaller p-value has a higher post-hoc power, without a single exception. Post-hoc power is not fresh information about the study. It is the p-value written on a different scale.

The blue line makes that concrete. Among all 543 trials that came back non-significant, the highest post-hoc power any of them can report is 0.5047. A trial landing exactly on p = 0.05 works out to 0.5052, and everything worse than that is lower still.

So a null result is guaranteed in advance to have low post-hoc power. That is true of every single one of them, whatever the reason it came out null. Offering that number as an explanation is just restating the p-value and calling it evidence.

[WARNING]
Post-hoc power cannot separate the two reasons a trial came back null: too few patients, or too small an effect. It is computed from the same data that produced the p-value, so it can only ever agree with it.

=== step === quiz
## Quick check: the trial came back null. Now what?

The clinic ran its 40 patients and the t-test gave p = 0.31. A reviewer asks whether the study was big enough to trust that null. What belongs in the write-up?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The post-hoc power computed from the observed drop, so the reviewer can see for themselves that the study was underpowered. ::no
- The smallest drop the trial could reliably catch, 10.9 mmHg, together with the confidence interval the t-test already printed. ::ok Right. Both of those were settled before any data arrived or fall straight out of the analysis, and both tell the reviewer what the study was able to see, rather than restating what it saw.
- Nothing about sizing. Report the p-value and let the reviewer judge. ::no
- The conclusion that the exercise program does not lower blood pressure. ::no Post-hoc power is the p-value in disguise, and a null result always carries a low one, so it settles nothing. And p = 0.31 is not evidence that the program does nothing. What the reviewer needs is the size of effect the study could see and the range the data leaves open, which is the interval the t-test hands over for free.

=== step === concept
## How to get a sample size when no formula fits

`power.t.test()` earns its answer by assuming a very particular study: two arms, equal size, everybody measured at the end, a t-test to finish. Real trials rarely look like that.

The clinic's trial will not either. They expect about 15 out of every 100 patients to leave before week 12, so recruit 24 per arm and you will not be analysing 24 per arm.

When the design stops matching the formula, stop using the formula. Simulate the design you actually have, the same way we started: build the world where the effect is real, run the study thousands of times, and count the share that comes back significant. Here `runif(recruit) > 0.15` is what removes the leavers, keeping each patient with probability 0.85.

```r
# Measure by simulation how much power survives a 15 percent dropout
sim_power <- function(recruit) {
  found <- replicate(2000, {
    usual    <- rnorm(recruit, mean = 140, sd = 12)
    exercise <- rnorm(recruit, mean = 130, sd = 12)
    usual    <- usual[runif(recruit) > 0.15]      # 15 percent of them leave
    exercise <- exercise[runif(recruit) > 0.15]
    t.test(usual, exercise, var.equal = TRUE)$p.value < 0.05
  })
  mean(found)
}

set.seed(11)
recruits <- c(24, 26, 28, 30)

data.frame(recruited_per_arm = recruits,
           power = sapply(recruits, sim_power))
#>   recruited_per_arm  power
#> 1                24 0.7250
#> 2                26 0.7705
#> 3                28 0.8000
#> 4                30 0.8315
```

Recruit the 24 per arm the formula asked for and dropout takes the power back down to 0.725. The 80% the clinic paid for is gone, and it is gone for a reason the formula was never told about.

Recruit 28 per arm and it comes back to exactly 0.80. That is 56 patients enrolled to end up analysing about 48, which is the number we had all along.

[TIP]
Simulation is the general tool and the formula is the special case. Anything you can write down as R code you can size this way: dropout, unequal arms, three groups, a skewed outcome, a rank test. Build the world, run it thousands of times, count the wins.

=== step === quiz
## Quick check: which number does the clinic need to defend first?

A neighbouring clinic copies the whole plan, recruits the same 40 patients, and targets the same 10-point drop. Their patients are sicker and vary by 18 mmHg rather than 12. Which input should a reviewer press them on hardest?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The 0.05 significance level, since that is the bar the result has to clear. ::no
- The 80% power target, since a different target changes the answer. ::no
- The 18 mmHg spread, because it takes their power at 40 patients down to about 40%, and reaching 80% would need 52 per arm instead of 24. ::ok Exactly. The spread is the only input here that is a claim about the world rather than a convention or a choice, and it is the one that moved the trial from 48 patients to 104.
- The 10-point drop, since a smaller target would need more patients. ::no The target drop and the power level are decisions the clinic gets to make and defend in plain language, and the significance level is a convention nobody is really arguing about. The spread is different. It is an empirical claim, it can be wrong, and because n moves with its square, being wrong about it is expensive. At 18 mmHg the same 40 patients find a real 10-point drop only about 40% of the time.

=== step === tryit
## Your turn: size the trial for a 5-point drop

The clinic's funder pushes back. A 10-point drop is a lot to promise, and they want the trial sized so it could still catch a 5-point drop, with the same 12 mmHg spread and the same 80% power.

Work out how many patients per arm that takes.

```r
# The solve-for-n call takes delta, sd and power, and returns n per arm.
# Keep sd = 12 and power = 0.80, and size the trial for a 5-point drop
# instead of a 10-point one.
# Press Check when you have it.
```
::check {"regex": "delta\\s*=\\s*5", "gate": true, "difficulty": "intermediate", "ok": "Right: n = 91.39, so 92 per arm and 184 patients in total. Halving the drop took the trial from 48 patients to 184, because 5 over 12 is half the ratio that 10 over 12 was, and halving the ratio costs four times the patients.", "no": "Same call as before with one number changed: `power.t.test(delta = 5, sd = 12, power = 0.80)`. Leave sd and power where they are."}
::solution
```r
# Sample size per arm for a 5-point drop at 80 percent power
power.t.test(delta = 5, sd = 12, power = 0.80)
#>
#>      Two-sample t test power calculation
#>
#>               n = 91.38944
#>           delta = 5
#>              sd = 12
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

That is 92 per arm and 184 in total. Put that n beside the one for a spread of 24 mmHg and you will find the same 91.38944, because 5 over 12 and 10 over 24 are the same ratio. Only the ratio ever mattered.

=== step === tryit
## Your turn: simulate the power a 15% dropout leaves you

The funder settles on the original 10-point target, so the clinic is back to recruiting 24 patients per arm. Before signing off, they want the dropout checked directly rather than taken from a table.

Write the loop yourself. Recruit 24 per arm from the same two populations, drop each patient with probability 0.15, run the t-test on whoever is left, and report the share of 2,000 runs that came back under 0.05. Start with `set.seed(11)` so your answer matches.

```r
# Build 2,000 trials of 24 recruits per arm, using rnorm(24, mean = 140, sd = 12)
# for usual care and rnorm(24, mean = 130, sd = 12) for the program.
# Keep a patient when runif(24) > 0.15, t-test the survivors with
# var.equal = TRUE, and take the share of p-values under 0.05.
# Press Check when you have it.
```
::check {"regex": "runif[\\s\\S]*t[.]test", "gate": true, "difficulty": "advanced", "ok": "That is it: 0.725, the same number the dropout table gave for 24 per arm. Recruiting exactly the formula's number and then losing 15 percent of it is a real and very common way to end up with a trial that cannot do the job it was sized for.", "no": "Three moves inside one `replicate()`: draw both arms with `rnorm()`, cut each one down with `usual[runif(24) > 0.15]`, then test the survivors with `t.test(usual, exercise, var.equal = TRUE)` and compare its `$p.value` against 0.05. Wrap the whole thing in `mean()`."}
::solution
```r
# Simulate the power that 24 recruits per arm leave after 15 percent drop out
set.seed(11)
found <- replicate(2000, {
  usual    <- rnorm(24, mean = 140, sd = 12)
  exercise <- rnorm(24, mean = 130, sd = 12)
  usual    <- usual[runif(24) > 0.15]
  exercise <- exercise[runif(24) > 0.15]
  t.test(usual, exercise, var.equal = TRUE)$p.value < 0.05
})

mean(found)
#> [1] 0.725
```

The clinic sized for 0.80 and would have run at 0.725. Recruiting 28 per arm is what buys the target back.

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen, J. (1988), 2nd edition, Routledge. Where Cohen's d comes from, along with the 0.2, 0.5 and 0.8 conventions the presets on the power curve use.
- [The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis](https://doi.org/10.1198/000313001300339897) - Hoenig, J. M. and Heisey, D. M. (2001), The American Statistician 55(1), 19-24. The paper that works out why post-hoc power is a restatement of the p-value.
- [Beyond Power Calculations: Assessing Type S and Type M Errors](https://doi.org/10.1177/1745691614551642) - Gelman, A. and Carlin, J. (2014), Perspectives on Psychological Science 9(6), 641-651. What an underpowered study does to the effect sizes it does manage to report.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button, K. S. and colleagues (2013), Nature Reviews Neuroscience 14, 365-376. A field-wide audit of what happens when this calculation gets skipped.
- [Power calculations for two-sample t tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team, the documentation for `power.t.test()`.

=== step === complete
## Quick recap

You built statistical power out of 2,000 trials before ever meeting the formula, and then answered the clinic's question properly. To pull it together:

- Power is the share of studies that find a real effect. You counted the clinic's: 1,457 out of 2,000, or 73%.
- 1 minus power is the miss rate, the Type II error rate. At 40 patients the clinic misses a genuine 10-point drop 27 times in every 100.
- n, the effect, the significance level and power are locked together. Give R any three and it returns the fourth, which is how `power.t.test(delta = 10, sd = 12, power = 0.80)` turns "is 40 enough" into 24 per arm and 48 in total.
- Only the ratio of the drop to the spread matters, and n moves with its square. Halve that ratio and you pay four times over, which is why 92 per arm answered both the 5-point drop and the doubled spread.
- Power computed after the study is finished is the p-value in different clothing. Report the minimum detectable effect and the confidence interval instead.
- When the design leaves the formula behind, simulate it. Fifteen percent dropout cost the clinic 0.075 of power, and recruiting 28 per arm bought it back.

So when somebody hands you a study plan and asks whether the sample is big enough, you now know it is really three questions. What drop is worth catching, how much do the patients vary, and how often are you willing to miss? Answer those and the sample size answers itself.

Congratulations, you made it through. Have a great day.

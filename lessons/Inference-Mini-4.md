---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
catalog_blurb: "How many patients a study needs to find a real effect."
description: "A clinic can recruit 40 patients to test whether exercise lowers blood pressure by 10 points. Work out in R whether 40 is enough, and what it would take."
keywords: "power analysis, statistical power, sample size calculation, power.t.test, how many participants, effect size, type II error, post-hoc power, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.7"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-3"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 4 of 7
## Power analysis: find the sample size you need

Part 3 finished with Rosa working out that pinning down her average delivery time to within a minute would take about 150 deliveries. That was this same calculation run backwards, and it is the one calculation in statistics that pays for itself before you collect a single number. If you missed part 3, nothing here leans on it, because everything gets built from the beginning again.

Priya runs a small clinic on Wells Road. She has been reading about supervised exercise programs for patients with high blood pressure, and she wants to know whether one would work for hers. The plan is simple enough: put some patients on a twelve-week program, leave the others on usual care, and measure everybody's blood pressure at the end.

She can realistically recruit **40 patients**. From what she has read, a program like this might bring systolic blood pressure down by around **10 points**. So the question that decides whether she runs the study at all is this one: if the program really does work that well, will a trial with 40 patients actually show it?

Switch between a small, a medium and a large effect below, and watch how many people each group needs before a study can reliably find what it is looking for. The line under the plot reads that number off for you.

::widget power-curve {}

That is Priya's question in its general form, and by the end of this part you will be able to answer it for her actual trial, in her actual units, and defend the answer to somebody who asks where it came from.

By the end you will be able to:

- Simulate a planned study thousands of times and count how often it would find the effect it is looking for
- Get the same number in one line, and say exactly what it is counting
- Solve the question backwards: how many patients buy a given chance of success
- Name the two ways a study can be wrong, and say which one the sample size controls
- Choose the inputs honestly, including the one everybody fudges
- Refuse the request to compute power after the results are in, and say why in one sentence
- Work out power by simulation for a design no formula covers, dropouts included

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `p < 0.05` are familiar. No statistics background is assumed, and every term gets defined in plain words the moment it turns up.

=== step === concept
::eyebrow The study on paper
## What Priya is actually planning

Before anything can be calculated, the study has to be pinned down to specific numbers, because "will 40 patients be enough" is not yet a question arithmetic can answer. Here is her plan written out in full.

| The piece | Priya's version |
|---|---|
| Who | 40 patients from her own list with untreated high blood pressure |
| The split | 20 on the twelve-week exercise program, 20 on usual care |
| What gets measured | systolic blood pressure in mmHg, once, at the end of the twelve weeks |
| The comparison | the average of the 20 on the program against the average of the 20 on usual care |
| Where her patients start | around 150 mmHg |
| How much patients differ from each other | about 15 mmHg |
| The improvement she is hoping for | about 10 mmHg |

Three of those numbers do all the work, so it is worth being precise about what each one is.

**150 mmHg** is roughly where her untreated patients sit. Systolic is the top number in a blood pressure reading, and mmHg is millimetres of mercury, the unit that number comes in. Where her patients start turns out not to matter at all for this calculation, because the comparison is between two groups that both start there, but it makes the simulated patients look like real ones.

**15 mmHg** is the **spread**, the standard word for how much patients differ from one another. Priya got it from her own records: her patients are not all at 150, they are scattered around it, and a typical patient sits about 15 points away from the average. This number matters enormously, and we will come back to where it comes from and what happens when it is wrong.

**10 mmHg** is the drop she is hoping the program produces. Notice that it is a hope rather than a measurement. Nobody knows the true effect of the program on her patients, which is the entire reason she is running the trial, so this number is a supposition she is choosing. That is allowed, and it is also the input people quietly fudge, so we will spend a whole step on choosing it well.

=== step === concept
::eyebrow Suppose it works
## A world where the program works

Here is the move that makes everything else possible. We cannot know what Priya's trial will find, but we can build a pretend world where the program truly does lower blood pressure by exactly 10 points, run her trial inside that world, and watch what happens.

In this pretend world, usual-care patients average 150 mmHg, program patients average 140, and patients in both groups scatter around their average with a spread of 15. Draw 20 patients for each group and see what Priya would see at the end of twelve weeks.

```r
set.seed(1)
usual_a    <- rnorm(20, mean = 150, sd = 15)
exercise_a <- rnorm(20, mean = 140, sd = 15)

round(mean(usual_a), 1)
#> [1] 152.9

round(mean(exercise_a), 1)
#> [1] 139.9

round(mean(usual_a) - mean(exercise_a), 1)
#> [1] 13
```

`rnorm(20, mean = 150, sd = 15)` asks R for 20 patients from a world whose true average is 150 and whose spread is 15, and `set.seed(1)` pins R's random numbers down so your run comes out identical to the one printed here. The two groups become `usual_a` and `exercise_a`, which is our first imagined run of the trial, so call it **trial A**.

Trial A's exercise group came out 13.0 points below its usual-care group. The truth we planted was 10, and the trial reported 13, which is the same wandering that ran through part 3: the 20 patients who happened to land in each group were not perfectly average, so the gap between the groups was not exactly 10 either.

Now Priya has to decide what to make of that 13. She cannot see the truth, so she does what everyone does, which is run a test.

```r
t.test(usual_a, exercise_a)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  usual_a and exercise_a
#> t = 3.0599, df = 37.917, p-value = 0.004052
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>   4.38351 21.52635
#> sample estimates:
#> mean of x mean of y 
#>  152.8579  139.9029
```

The line that matters is `p-value = 0.004052`. The **p-value** answers one narrow question: if the program actually did nothing at all, how often would pure luck alone hand you a gap at least this far from zero between two groups of 20? Four times in a thousand. That is rare enough that by the usual convention, which draws its line at 0.05, Priya would call the result **significant** and conclude the program does something.

Trial A worked. She ran a study with 40 patients, the program truly helped, and her study found it. So far, so good.

=== step === concept
::eyebrow Suppose it works, again
## The same trial, run again

Trial A is one draw of 40 patients out of a world with infinitely many. Priya could have enrolled a different 40, so let us run her trial a second time in exactly the same world, with the program working exactly as well.

```r
set.seed(3)
usual_b    <- rnorm(20, mean = 150, sd = 15)
exercise_b <- rnorm(20, mean = 140, sd = 15)

round(mean(usual_b) - mean(exercise_b), 1)
#> [1] 6.7

round(t.test(usual_b, exercise_b)$p.value, 4)
#> [1] 0.1001
```

Call this one **trial B**. Same program, same true 10-point drop, same 20 patients per group, and this time the gap came out at 6.7 points with a p-value of 0.1001.

That p-value sits above 0.05, so Priya would not call it significant. She would write up a study that found no clear evidence the program helps, she would probably not run it again, and she would be wrong, because in this pretend world we planted a real 10-point drop with our own hands. Trial B did not make a mistake in its arithmetic. It enrolled 40 perfectly ordinary patients who happened to produce a smaller gap, and the test did exactly what it is supposed to do with a gap that size.

[KEY INSIGHT]
Whether a real effect shows up in a study is not settled by whether the effect is real. It depends on how big the effect is, how much patients differ from each other, and how many patients you enrolled. Two identical trials of a program that genuinely works can disagree, and one of them will be published as a negative result.

So the question is no longer whether Priya's trial can find the effect. It is how often.

=== step === concept
::eyebrow Do it twenty times
## Twenty imagined trials

One trial tells you nothing about how often, so wrap the whole business in a function and run it as many times as you like. Each run enrols a fresh 40 patients, tests them, and reports its p-value.

```r
trial_p <- function() {
  usual    <- rnorm(20, mean = 150, sd = 15)
  exercise <- rnorm(20, mean = 140, sd = 15)
  t.test(usual, exercise)$p.value
}

set.seed(42)
twenty <- replicate(20, trial_p())
round(twenty, 3)
#>  [1] 0.006 0.092 0.023 0.035 0.007 0.046 0.128 0.027 0.054 0.337 0.194 0.002
#> [13] 0.332 0.232 0.018 0.022 0.413 0.109 0.000 0.004

sum(twenty < 0.05)
#> [1] 11
```

`trial_p()` is the whole trial packed into something reusable: recruit 40 patients into two groups, test them, hand back the p-value. `replicate(20, trial_p())` runs it twenty separate times and collects the twenty answers, and the `[1]` and `[13]` down the left edge are R keeping count of where each printed line starts rather than part of the data. `sum(twenty < 0.05)` counts how many of the twenty came in under the conventional line, because R treats every TRUE as a 1.

Eleven of the twenty trials found the drop. Nine missed it. Every single one of those twenty studies was run in a world where the exercise program truly lowers blood pressure by 10 points, and nearly half of them would have been written up as showing nothing.

Look at the near misses, too. One trial came back at 0.054 and another at 0.046, and those two would be reported completely differently even though a hair separates them.

=== step === concept
::eyebrow Do it ten thousand times
## Ten thousand imagined trials

Twenty runs is enough to see the problem and not enough to measure it, so run ten thousand and take the fraction that found the drop.

```r
set.seed(7)
p_values <- replicate(10000, trial_p())

mean(p_values < 0.05)
#> [1] 0.535
```

`p_values` now holds ten thousand p-values, one from each imagined trial. `p_values < 0.05` turns that into ten thousand TRUEs and FALSEs, and taking `mean()` of those gives the fraction that are TRUE, since R counts every TRUE as 1 and every FALSE as 0.

**0.535.** In a world where the program truly works exactly as Priya hopes, her 40-patient trial would find it a little over half the time. Run it, and it is barely better than a coin flip whether twelve weeks of supervised exercise, forty patients and three months of her time produce a result she can act on.

Here is the same ten thousand trials as a picture. Press Run and each bar counts how many trials came back with a p-value in that slice.

```r
hist(p_values, breaks = 40, col = "grey85", border = "white",
     main = "10,000 imagined trials, 20 patients per group",
     xlab = "the p-value the trial reported")
abline(v = 0.05, col = "#b5631a", lwd = 3)
```

The tall pile crammed against the left edge is the trials that found the drop easily. Everything to the right of the orange line is a trial that would have been written up as showing nothing, and there is a lot of it, spread all the way out to 1. The effect was there in every single one of those runs.

=== step === concept
::eyebrow The name for it
## That number has a name

The fraction we just measured is called **statistical power**, and it is worth stating carefully because almost every misuse of it comes from a loose version of the definition.

**The power of a planned study is the probability that it comes back significant, assuming the effect you are looking for is really there and really the size you assumed.**

Every clause in that sentence is load-bearing. Read it back with Priya's numbers in place: if the exercise program truly drops blood pressure by 10 mmHg, and patients truly differ from each other by about 15, then a trial with 20 patients per group comes back significant 53.5 percent of the time. Change any one of those inputs and the number changes.

Three things power is not, all of which get said out loud in real meetings:

- **Not the probability the program works.** Power is computed *assuming* it works. It cannot tell you whether it does, because that is the thing the study is for.
- **Not a property of a result.** It belongs to a plan. Once the data are in, the study either found the effect or it did not, and we will come back to what happens when people forget this.
- **Not 1 minus the p-value, or anything else derived from your data.** Nothing in the calculation so far used a single real patient. Priya has not enrolled anybody yet.

[NOTE]
Power is always power *to detect something specific*. There is no such thing as the power of a study in general, only its power to detect a 10-point drop, or a 5-point drop, or whatever size you name. A study with poor power for a small effect can have excellent power for a large one.

=== step === quiz
::eyebrow Check yourself
## What the 53 percent is counting

Priya's planned trial has a power of 0.535 for a 10 mmHg drop. What does that number tell her?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 53.5 percent chance the exercise program works
- If the program does nothing, 53.5 percent of trials like hers would come back significant anyway
- If the program truly drops blood pressure by 10 mmHg, about 53.5 percent of trials like hers would come back significant, and the rest would miss it ::ok Exactly right, and the conditional at the front is the part that matters. The number is computed inside a world where the effect is real and exactly 10 points, so it describes what her design can do against that effect, not whether the effect exists. In the other 46.5 percent of those worlds she runs the whole trial, spends the three months, and writes up a null result about a program that works.
- Her results will be within 53.5 percent of the true effect
- Her trial will detect any real improvement 53.5 percent of the time ::no The first option asks the question the trial exists to answer, and no calculation done before enrolling anybody can answer it. The second describes something else entirely: how often a useless program looks significant by luck, which is the 5 percent we set as the threshold, not the 53.5. And the last one drops the "10 mmHg" from the sentence, which is where all the meaning lives, since the same trial has much better power against a 20-point drop and much worse power against a 3-point one.

=== step === concept
::eyebrow The shortcut
## The one line that skips the ten thousand trials

Simulating ten thousand trials is a fine way to understand power and a slow way to compute it. For a comparison of two group averages there is a formula, and R has it built in.

```r
power.t.test(n = 20, delta = 10, sd = 15, sig.level = 0.05)
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

Four arguments, each one a piece of Priya's plan. `n = 20` is the patients **in each group**, which the note at the bottom is at pains to point out, so her 40 patients go in as 20 rather than 40. `delta = 10` is the drop she wants to be able to detect. `sd = 15` is the spread among patients. `sig.level = 0.05` is the line the p-value has to come in under, and it is the default, so you can leave it out. The `alternative = two.sided` in the printout is another default she never typed, and it means the test counts a surprising gap in either direction, so a program that somehow raised blood pressure would register as well as one that lowered it.

**0.5377573**, against 0.535 from ten thousand simulated trials. Two completely different routes, one grinding through ten thousand imaginary studies and one evaluating a formula, and they land within three thousandths of each other, which is comfortably inside the wobble you get from counting ten thousand of anything. The formula is not a better answer than the simulation, it is the same answer worked out exactly rather than by brute force.

`power.t.test` will solve for whichever of its arguments you leave out, which is what makes it useful, and we are about to leave out a different one.

=== step === concept
::eyebrow Why half
## Why it comes out near half

Half seems like a strange answer when the effect is real. The reason is worth seeing, because it explains every power calculation you will ever do.

Trial A reported a gap of 13.0 and trial B reported 6.7, so the gap between the two group averages is itself a wandering quantity. Part 3 named the size of that wandering: the **standard error**, which is the typical distance between an estimate and the truth it is estimating. For a difference between two group averages of size \\(n\\) each, it is

\\[ SE = s\\sqrt{\\frac{2}{n}} \\]

where \\(s\\) is the spread among patients and \\(n\\) is the number of patients in each group. The 2 is there because two group averages each wander, and combining them adds up their wandering.

There is a second number to work out, which is how big a gap the test insists on before it will call anything significant. That is the standard error multiplied by a number read off the **t distribution**, which is the shape the wandering takes when you had to estimate the spread from the patients themselves rather than knowing it in advance.

```r
se       <- 15 * sqrt(2 / 20)
multiple <- qt(0.975, df = 38)
cutoff   <- multiple * se

round(c(se = se, multiple = multiple, cutoff = cutoff), 2)
#>       se multiple   cutoff 
#>     4.74     2.02     9.60
```

`qt()` is what reads that number off, and here it comes back as 2.02. The 0.975 leaves 2.5 percent of the wandering hanging off the right edge, and because the shape is symmetric another 2.5 percent hangs off the left, which is the 5 percent threshold split across both directions. The `df` is the **degrees of freedom**, and it is 38 rather than 40 because two group averages had to be worked out from those 40 patients before anything could be measured against them.

So the gap Priya observes will typically land about 4.74 mmHg away from the truth, and her test will only call the result significant if the observed gap comes out bigger than **9.60 mmHg**.

Now put those two facts side by side. The truth is a 10-point drop. The bar is 9.60. Priya's trial needs its observed gap to land above a bar that sits *almost exactly at the true effect*, and since the observed gap lands above the truth about half the time and below it about half the time, her trial succeeds about half the time. That is where the 0.535 comes from, and there is nothing subtle about it.

Here is the whole thing in one picture. The grey hump is what her observed gap would look like if the program did nothing, the green hump is what it looks like given the real 10-point drop, and the dashed line is the 9.60 bar.

```r
grid_mmhg <- seq(-16, 28, length.out = 400)
no_effect <- dnorm(grid_mmhg, mean = 0,  sd = se)
real_drop <- dnorm(grid_mmhg, mean = 10, sd = se)

plot(grid_mmhg, no_effect, type = "l", lwd = 2, col = "grey40",
     main = "What a trial with 20 patients per group can produce",
     xlab = "gap between the two group averages, in mmHg", ylab = "")
lines(grid_mmhg, real_drop, lwd = 2, col = "#1f7a55")

past <- grid_mmhg >= cutoff
polygon(c(cutoff, grid_mmhg[past], 28), c(0, real_drop[past], 0),
        col = "#1f7a5544", border = NA)
polygon(c(cutoff, grid_mmhg[past], 28), c(0, no_effect[past], 0),
        col = "#b5631a66", border = NA)
abline(v = cutoff, lwd = 2, lty = 2)
```

`dnorm()` gives the height of each hump at every point along the axis, `polygon()` fills the region to the right of the bar under each one, and `abline(v = cutoff)` drops the dashed line at 9.60.

The green shaded area is the power: the share of trials that land past the bar when the drop is real. It is a bit more than half the green hump. The small orange sliver is the share of trials that would clear the bar even if the program did nothing at all, and that sliver is 2.5 percent by construction, because that is what we asked for when we set the threshold at 0.05 with a two-sided test.

Everything in power analysis is a way of moving those two humps and that dashed line around.

=== step === concept
::eyebrow Check it
## The same trials, counted a different way

The picture makes a claim, so test it against the trials we already ran. Rather than asking each trial for its p-value, ask whether its observed gap cleared the 9.60 bar.

```r
set.seed(7)
diffs <- replicate(10000, {
  usual    <- rnorm(20, mean = 150, sd = 15)
  exercise <- rnorm(20, mean = 140, sd = 15)
  mean(usual) - mean(exercise)
})

mean(abs(diffs) > cutoff)
#> [1] 0.5366
```

Because the seed is the same and the patients are drawn in the same order, these are the very same ten thousand trials as before, just measured with a ruler instead of a test. `abs()` is there because a two-sided test also counts a big gap in the wrong direction, where the exercise group somehow came out worse by more than 9.60. Swap `mean(abs(diffs) > cutoff)` for `sum(diffs < -cutoff)` and you get 0: when the truth is a 10-point drop, a wrong-way gap that large never turned up in ten thousand trials.

**0.5366**, against the 0.535 those same trials gave through their p-values. The tiny difference is real and it has a cause: the fixed 9.60 bar assumes we know the spread is 15, whereas an actual `t.test` re-estimates the spread from each trial's own 40 patients, so its bar moves around a little from trial to trial. Same idea, third route to it.

=== step === concept
::eyebrow The universal currency
## Effect size: the drop measured in spreads

Priya's 10-point drop is not big or small on its own. It is big or small relative to how much patients differ from each other, which is why the spread has been in every calculation so far.

Dividing one by the other gives a number that carries the whole story:

\\[ d = \\frac{\\delta}{s} \\]

where \\(\\delta\\) is the size of the effect in real units and \\(s\\) is the spread in the same units. The result, called the **effect size** or **Cohen's d**, has no units at all, because the mmHg cancel.

```r
10 / 15
#> [1] 0.6666667
```

Priya is looking for an effect of about **0.67 standard deviations**. That is the same effect size as a study looking for a 6.7-point improvement in something whose spread is 10, or a 0.67-second improvement in something whose spread is 1 second, and every one of those studies needs the same number of participants. Effect size is the currency that lets you compare studies across fields that share nothing else, and it is why the widget on the cover talked about d = 0.2, 0.5 and 0.8 rather than about millimetres of mercury.

Those three values are Jacob Cohen's rough labels for small, medium and large, and they are conventions from a 1988 textbook rather than laws of nature. They are useful for orientation and terrible as a substitute for thinking about your own field, where a "small" effect on something that matters enormously can be the most important result of the decade.

What matters more here is how brutally the cost of a study responds to it. Hold Priya's 40 patients fixed and vary only the drop she is hoping to detect.

```r
power_at_20 <- function(drop) round(power.t.test(n = 20, delta = drop, sd = 15)$power, 3)

sapply(c(4, 6, 8, 10, 15), power_at_20)
#> [1] 0.128 0.234 0.376 0.538 0.869
```

`sapply()` runs `power_at_20()` once for each drop and collects the answers. Her 40 patients are excellent at finding a 15-point drop, coin-flip at a 10-point drop, and close to useless at a 4-point drop, where 87 trials in 100 would come back with nothing.

=== step === tryit
::eyebrow Your turn
## Power for a smaller drop

Priya's colleague thinks 10 points is optimistic, and that a realistic program might get 5 points at best.

Work out the power of her 40-patient trial against a 5-point drop. Fill in the blank and press Check.

```r
power.t.test(n = 20, delta = ____, sd = 15)$power
```
::check {"regex":"delta\\s*=\\s*5\\b","gate":true,"difficulty":"beginner","ok":"0.1755768, so about 18 percent. If the true drop is 5 points rather than 10, her trial misses it more than four times out of five. Notice she would not know which of these two worlds she is in: the same 40 patients, the same protocol, and a completely different chance of learning anything.","no":"Keep everything else the same and put the smaller drop in as the delta, so delta = 5."}
::solution
```r
power.t.test(n = 20, delta = 5, sd = 15)$power
#> [1] 0.1755768
```

=== step === concept
::eyebrow The answer she came for
## Turn the question round

`power.t.test` solves for whichever argument you leave out. So far we have handed it a sample size and asked for the power. Hand it a power instead and it hands back the sample size, which is the question Priya actually walked in with.

```r
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

The `n` comes back as 36.3058, and you cannot recruit a third of a patient, so round up.

```r
ceiling(power.t.test(delta = 10, sd = 15, power = 0.80)$n)
#> [1] 37
```

**37 patients in each group, so 74 in total.** That is the answer to the question in the email, and it is worth saying plainly: Priya's 40 patients are not enough, and she needs nearly twice as many.

Here is the whole trade laid out. Each point on this line is one `power.t.test` call for a different group size, holding the 10-point drop and the 15-point spread fixed.

```r
sizes  <- seq(10, 120, by = 5)
powers <- sapply(sizes, function(size) power.t.test(n = size, delta = 10, sd = 15)$power)

plot(sizes, powers, type = "l", lwd = 2, ylim = c(0, 1),
     main = "Power for a 10 mmHg drop when the spread is 15",
     xlab = "patients in each group", ylab = "power")
abline(h = 0.80, col = "#b5631a", lwd = 2, lty = 2)
abline(v = 37,   col = "#b5631a", lwd = 2, lty = 2)
points(37, 0.80, pch = 19, col = "#b5631a", cex = 1.4)
```

The shape of that curve is the thing to take away. It climbs steeply at the start, so the first extra patients are worth a great deal, and then it flattens out, so somewhere past 60 per group Priya would be spending real money for a percentage point or two. The dot sits where the curve crosses 80 percent, at 37 per group.

Everything else in this lesson is about the four inputs that curve depends on, and about how easy it is to feed it a number you cannot defend.

=== step === concept
::eyebrow The other kind of mistake
## Why 80 percent, and the two ways to be wrong

Nothing so far has justified aiming at 80 percent power rather than 95 or 60. To pin that down, lay out every way Priya's trial can end.

Two things could be true about the world, and two things could come out of her trial, so there are four outcomes.

| | The program truly does nothing | The program truly drops BP by 10 |
|---|---|---|
| **Trial says significant** | **Type I error.** A false alarm. | Correct, and this is what power counts. |
| **Trial says not significant** | Correct. | **Type II error.** A real effect missed. |

The two mistakes have names as plain as their descriptions. A **Type I error** is claiming something happened when nothing did. A **Type II error** is missing something that did happen.

Each has a dial. The significance threshold, written \\(\\alpha\\) and read "alpha", is the share of trials that raise a false alarm when nothing is going on, and setting it to 0.05 is exactly what makes that the rate. The widget below is part 2's picture with both tails shaded instead of one, because Priya's test counts a surprising gap in either direction: the hump is what pure luck produces when the program does nothing, and the shaded tails are the share of results at least that far out.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.95, "label": "how far out a result sits, in standard errors"}

Drag the slider and watch the shaded area shrink as the result moves further out. The line where a result stops being ordinary and starts being called significant sits at 1.96 standard errors from zero, and the nearest notch the slider offers is 1.95, where the readout says 0.051 and the verdict below it is still "fail to reject H0". Nudge it one notch right to 2.00 and the number drops to 0.046 and the verdict flips. Everything to the right of that line is the 5 percent of results that a program doing nothing at all would still produce.

The other dial is the one this lesson is about. The Type II error rate is written \\(\\beta\\), read "beta", and power is simply

\\[ \\text{power} = 1 - \\beta \\]

so 80 percent power means a 20 percent chance of missing a real effect. Which raises the obvious question: why on earth would anyone accept a one in five chance of missing the thing they are studying?

The honest answer is money and patients. Pushing from 80 to 90 percent power costs Priya about a third more patients, and pushing to 95 costs more again, so the choice of 80 is a budget decision that hardened into a convention through repetition. It is not a law and there is no mathematical argument for it. When missing the effect would be a catastrophe, as in a safety trial, people use 90 or 95 and pay for it. When a study is cheap and repeatable, 80 is generous.

What is not defensible is running at 20 or 30 percent power without saying so, which is the situation Priya is in right now with her 40 patients, and which is far more common in published research than most people assume.

=== step === quiz
::eyebrow Check yourself
## Which error is which

Priya sets her significance threshold at the conventional 0.05 and designs for 80 percent power. Which statement describes what those two numbers control?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both control how often she is wrong, so together they say she is wrong 25 percent of the time
- The 0.05 caps how often she claims an effect when there is none, and the 80 percent is how often she catches an effect that is really there ::ok That is exactly the split, and the key is that the two numbers live in different worlds. Alpha is computed in the world where the program does nothing, so it governs false alarms and nothing else. Power is computed in the world where the program truly drops blood pressure by 10 points, so it governs whether a real effect gets caught. Only one of the two worlds is real, and she never finds out which.
- The 0.05 is how often she misses a real effect and the 80 percent is how often she raises a false alarm
- The 80 percent means 80 percent of her patients will improve ::no The third option has the two errors swapped, which is the most common mix-up of the four. The first adds two rates that cannot be added, because they are conditional on opposite states of the world, so at most one of them is even relevant to the trial she actually ran. And the last confuses a property of the study design with a clinical outcome: power says nothing about how many individual patients benefit.

=== step === concept
::eyebrow The price list
## What each effect size costs

The relationship between the effect you want to catch and the patients you need to catch it is not gentle. Price it out across the range Priya might plausibly be in.

```r
n_needed <- function(drop) ceiling(power.t.test(delta = drop, sd = 15, power = 0.80)$n)

drops <- c(4, 6, 8, 10, 15)
data.frame(drop_mmhg = drops,
           per_group = sapply(drops, n_needed),
           total     = 2 * sapply(drops, n_needed))
#>   drop_mmhg per_group total
#> 1         4       222   444
#> 2         6       100   200
#> 3         8        57   114
#> 4        10        37    74
#> 5        15        17    34
```

Read down that table and the pattern jumps out. Halving the drop from 8 points to 4 takes the sample from 57 per group to 222, which is very close to four times as many. Going the other way, raising the target from 10 points to 15 cuts it from 37 to 17.

That is not a coincidence and it is not specific to blood pressure. The sample size a study needs is governed by

\\[ n \\propto \\frac{1}{d^2} \\]

which reads: the number of patients per group is proportional to one over the effect size squared. Halve the effect you want to catch and you need four times the patients. Take it to a third and you need nine times. It is the same square root that ran through part 3, wearing its other face.

[KEY INSIGHT]
Small effects are not slightly more expensive to study than large ones, they are dramatically more expensive, and the cost grows as the square. This single fact explains a lot of what looks strange about research budgets: why trials of small improvements enrol thousands of people, and why a study of 40 people reporting a subtle effect deserves a hard look before you believe it.

=== step === quiz
::eyebrow Check yourself
## Half the effect, how many patients?

Priya has her answer for a 10 mmHg drop: 37 patients per group. Her colleague now argues that a realistic program might only manage 5 mmHg, and asks how many patients that version of the study would need for the same 80 percent power.

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- About 74 per group, because halving the effect doubles the sample
- The same 37, because the sample size depends on the spread and the threshold, not on the effect
- About 55 per group, since it goes up but not by much
- About 148 per group, because the sample size goes as one over the effect size squared, so halving the effect quadruples it ::ok Right, and you can put `delta = 5` into the same call to get it exactly: 143 per group, so 286 patients in total. Quadrupling gets you to 148 because 37 was itself a rounded-up 36.31, and the last few come off because the multiplier eases as the sample grows, the same effect that stopped part 3's interval widths halving exactly. The headline is what matters: dropping the target from 10 points to 5 turns a 74-patient study into a 286-patient one, which for a single clinic is the difference between a plan and a fantasy.
- It cannot be worked out without running a pilot study first ::no The first three all assume the cost rises gently with a smaller effect, and it does not, because the effect size sits squared in the denominator. And a pilot is not needed for this arithmetic: the effect size is a number you choose as the smallest drop worth detecting, and the spread is the one input a pilot might sharpen, which is a different question from the one being asked here.

=== step === tryit
::eyebrow Your turn
## Ninety percent power

Priya's hospital committee is unimpressed by a one in five chance of missing a real effect and asks what 90 percent power would take.

`power.t.test` takes the power you want as a proportion. Fill in the blank and press Check.

```r
power.t.test(delta = 10, sd = 15, power = ____)
```
::check {"regex":"power\\s*=\\s*0?\\.9","gate":true,"difficulty":"beginner","ok":"n comes back as 48.26431, so 49 patients per group and 98 in total. Going from 80 to 90 percent power costs her 12 extra patients per group, roughly a third more, to buy back half of the misses. That is the trade in front of every committee that asks this question, and it is a real cost rather than a rounding error.","no":"The power goes in as a proportion rather than a percentage, so 90 percent is written as 0.90."}
::solution
```r
power.t.test(delta = 10, sd = 15, power = 0.90)
#> 
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

=== step === concept
::eyebrow The input everybody fudges
## Where the effect size comes from

Every number in this lesson has come out of `delta = 10`, and that 10 was Priya's hope. So where is it supposed to come from?

The wrong answer, and the common one, is to plug in the effect you are hoping for or the effect a previous small study reported. Hope is not evidence, and small published studies systematically overstate effects for a reason we will measure in a couple of steps. Either way you get a sample size that is too small, and you find out only after the study fails.

The right answer is a different question: **what is the smallest effect that would actually change what anybody does?**

For Priya that is a clinical judgement, not a statistical one. If a program that drops blood pressure by 3 points would not change how she treats anyone, and one that drops it by 8 points would, then 8 is her number and the study should be sized to catch 8. Powering it for the 15-point drop she is quietly hoping for produces a small, cheap trial that will probably miss the effect that actually matters.

There is a useful way to see this from the other direction, which is to ask what her existing 40 patients can reliably catch.

```r
power.t.test(n = 20, sd = 15, power = 0.80)$delta
#> [1] 13.63696
```

Leaving out `delta` and supplying `n` and `power` makes R solve for the effect instead. **13.6 mmHg.** That is the honest description of her current plan: a study that reliably detects a drop of 13.6 points or bigger, and gets steadily worse below that, down through the coin flip we measured at 10 to the near-hopeless 0.128 at 4. Written that way, the design either sounds fine or sounds absurd depending on how big a drop a program like this could plausibly produce, and that is the conversation worth having before anybody enrols.

[NOTE]
This reframing is the most useful thing to do with a fixed budget. When the sample size is not negotiable, do not ask what power you have, ask what effect you could detect, and then ask whether an effect that big is plausible. If it is not, the study is not underpowered so much as pointless, and knowing that beforehand is worth a great deal.

=== step === concept
::eyebrow The other input
## Where the spread comes from

The 15 has been quietly doing as much work as the 10 all lesson. It came from Priya's own records, which is the best source available: her patients, her measurement process, her clinic.

The next best sources, in order, are a published study of a similar population with a similar measurement, then a small pilot, then a guess you label as a guess. What matters is that being wrong about the spread is a silent failure. Nothing warns you, because the number never gets checked against reality until the study is over.

Suppose Priya's 15 was optimistic, and her patients actually vary by 18 points because her list includes a wider range of ages than she realised.

```r
ceiling(power.t.test(delta = 10, sd = 18, power = 0.80)$n)
#> [1] 52

round(power.t.test(n = 37, delta = 10, sd = 18)$power, 3)
#> [1] 0.655
```

A three-point error in an input she barely thought about turns a 74-patient study into a 104-patient one. Worse, if she had already committed to 37 per group on the strength of the 15, her real power would be 0.655 rather than the 0.80 she planned and reported, and she would never find out.

The spread enters the calculation squared, exactly like the effect size, which is why a modest error in it moves the sample size so much. Two practical habits fall out of that:

- **Round the spread up, not down.** If the plausible range is 15 to 18, size the study on 18, because being over-powered wastes some money whereas being under-powered wastes the whole study.
- **Report the source in the same sentence as the number.** "Assuming a standard deviation of 15 mmHg, from 120 untreated patients in our own records" is a sentence a reviewer can evaluate. "Assuming a standard deviation of 15" is one they have to take on faith.

=== step === concept
::eyebrow The trap
## Power computed after the results are in

Here is the mistake that a lesson on power exists to prevent, and it usually arrives dressed as a reasonable request.

Suppose Priya ran trial B, the one that came back with a 6.7-point gap and a p-value of 0.1001. She writes it up as no clear evidence. A reviewer replies: your result was not significant, so please report the power of your study, so we can tell whether it was too small.

The request sounds sensible. What it usually means in practice is: compute power using the effect you observed rather than the effect you planned for. Let us do exactly that and see what comes out.

```r
observed_drop   <- mean(usual_b) - mean(exercise_b)
observed_spread <- sqrt((var(usual_b) + var(exercise_b)) / 2)

round(c(drop = observed_drop, spread = observed_spread), 2)
#>   drop spread 
#>   6.69  12.54

round(power.t.test(n = 20, delta = observed_drop, sd = observed_spread)$power, 3)
#> [1] 0.376
```

`var()` gives the squared spread of each group, so averaging the two and taking the square root is the pooled spread across all 40 patients. Feeding trial B's own numbers back into `power.t.test` gives 0.376, and this quantity has a name, **observed power** or **post-hoc power**.

It looks like it says something. It does not, and here is the proof. Run 300 imagined trials, and for each one plot its p-value against the power computed from its own results.

```r
posthoc <- function() {
  usual    <- rnorm(20, mean = 150, sd = 15)
  exercise <- rnorm(20, mean = 140, sd = 15)
  drop   <- abs(mean(usual) - mean(exercise))
  spread <- sqrt((var(usual) + var(exercise)) / 2)
  c(p     = t.test(usual, exercise)$p.value,
    power = power.t.test(n = 20, delta = drop, sd = spread)$power)
}

set.seed(12)
after_the_fact <- replicate(300, posthoc())

plot(after_the_fact["p", ], after_the_fact["power", ],
     pch = 19, cex = 0.6, col = "#1f7a55",
     main = "300 trials: the p-value, and the power worked out afterwards",
     xlab = "p-value the trial reported", ylab = "power computed after the fact")
abline(v = 0.05, col = "#b5631a", lwd = 2, lty = 2)
```

Because `posthoc()` hands back two named numbers every time it runs, `replicate` stacks the 300 answers into a table with two rows, which is why `after_the_fact["p", ]` is all 300 p-values and `after_the_fact["power", ]` is the 300 powers that pair with them.

Three hundred separate trials, and the points do not scatter into a cloud. They fall on a single curve. Post-hoc power is a mathematical restatement of the p-value: a big p-value always produces a low observed power, every single time, with no exceptions and no extra information.

So the answer to "was your study too small" cannot be found in the study's own results. It was decided before the data existed, by the effect size worth detecting and the number of patients enrolled.

There is something Priya can send the reviewer, though, and it was sitting in the trial B printout all along.

```r
round(t.test(usual_b, exercise_b)$conf.int, 1)
#> [1] -1.3 14.7
#> attr(,"conf.level")
#> [1] 0.95
```

Part 3 built this by hand: the range of true drops her data are compatible with. From a 1.3-point rise to a 14.7-point drop, which is far too wide to act on in either direction, and which answers the reviewer's actual question directly rather than in code.

[KEY INSIGHT]
Never compute power from your own results. A high p-value guarantees a low observed power, so reporting one to explain the other is circular. The confidence interval is what genuinely answers the reviewer's question, because it says in the units of the decision what the study could and could not rule out.

=== step === quiz
::eyebrow Check yourself
## The reviewer asks for observed power

Priya's non-significant trial B comes back from review with a request to report the study's observed power. What should she do?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Report the 0.376 and note that the study was underpowered
- Recompute the power using the effect she originally hoped for, and report that instead, since it is more favourable
- Explain that observed power is a restatement of the p-value and carries no additional information, and report the confidence interval instead, which shows what the data can and cannot rule out ::ok Exactly, and the second half is what makes it a helpful answer rather than a refusal. The reviewer wants to know whether the study could have detected a meaningful effect, and the interval answers that directly: from a 1.3-point harm to a 14.7-point benefit, which is far too wide to act on. Reporting the power the study was DESIGNED for, alongside the effect size that design targeted, is also fair, because that number was fixed before the data existed.
- Rerun the study until the power comes out above 0.80 ::no The first option reports a number that is guaranteed to be low precisely because the p-value was high, so it dresses up one fact as two. The second is worse, because it computes a design quantity after the fact and then chooses the flattering input. And the last one describes running the study repeatedly until it says something convenient, which manufactures false alarms rather than evidence.

=== step === concept
::eyebrow The cost to everyone else
## What underpowered studies do to the published record

Underpowered studies do not only fail their own authors. They quietly corrupt the literature everyone else reads, and the mechanism is easy to demonstrate.

Go back to the pretend world where the drop is exactly 10 points, run ten thousand trials with 20 patients per group, and this time record each trial's estimated drop alongside its p-value.

```r
trial_estimate <- function(per_group) {
  usual    <- rnorm(per_group, mean = 150, sd = 15)
  exercise <- rnorm(per_group, mean = 140, sd = 15)
  c(estimate = mean(usual) - mean(exercise),
    p        = t.test(usual, exercise)$p.value)
}

set.seed(99)
runs <- replicate(10000, trial_estimate(20))

round(mean(runs["estimate", ]), 2)
#> [1] 10.05

round(mean(runs["estimate", runs["p", ] < 0.05]), 2)
#> [1] 13.48
```

`replicate` builds the same two-row table as before, so `runs["estimate", ]` is all ten thousand estimated drops and `runs["p", ]` is all ten thousand p-values. The second calculation keeps only the trials whose p-value came in under 0.05, which is to say only the ones that would plausibly get published.

Across all ten thousand trials the average estimate is **10.05**, which is the truth, as it should be. Among only the significant trials it is **13.48**, which is 35 percent too high.

Nothing was fabricated to produce that gap. A trial only clears the significance bar when its observed gap is large, so filtering on significance filters for the trials that overshot. The picture makes it obvious.

```r
hist(runs["estimate", ], breaks = 60, col = "grey85", border = "white",
     main = "The drop each of 10,000 trials would report",
     xlab = "drop the trial reported, in mmHg")
abline(v = 10, lwd = 3)
abline(v = mean(runs["estimate", runs["p", ] < 0.05]), col = "#b5631a", lwd = 3)
```

The black line is the truth at 10 and the orange line is the average of the trials that cleared significance, which is to say the average of what gets published. What separates the two lines is the whole left side of that picture: the trials that reported a modest drop, failed to clear the bar, and were filed away as showing nothing.

This effect has a name, the **winner's curse**, and it gets worse as power gets worse. Shrink the trials to 8 patients per group and watch.

```r
set.seed(99)
tiny <- replicate(10000, trial_estimate(8))

round(mean(tiny["estimate", ]), 2)
#> [1] 9.96

round(mean(tiny["estimate", tiny["p", ] < 0.05]), 2)
#> [1] 19.07

round(mean(tiny["p", ] < 0.05), 3)
#> [1] 0.228
```

At 8 patients per group the study has 23 percent power, and the trials that do reach significance report an average drop of **19.07** against a truth of 10. They are wrong by nearly a factor of two, in a consistent direction, and each one looks like a striking success.

So when Priya reads a small published trial reporting a spectacular result, the honest reaction is not "that program is amazing" but "if that trial was small, its estimate is probably inflated, and this is exactly the number I must not plug into my own power calculation." Which closes the loop with the previous step: the effect size you design for should be the smallest one worth detecting, not the biggest one somebody published.

=== step === concept
::eyebrow Lever one
## Measure everyone at the start

So far the only way to buy power has been more patients. There is a better lever, and it costs Priya one extra blood pressure reading per person.

Right now she compares final readings between two groups, so every bit of patient-to-patient variation is in her way. A patient who naturally runs at 175 and a patient who naturally runs at 130 land in the same group and add noise that has nothing to do with the program.

Instead, measure everybody at the start too, and compare **changes** rather than final levels. Each patient becomes their own reference point, and the variation between patients largely cancels out.

How much it helps depends on how strongly a patient's start and end readings track each other. Build a world where they correlate at 0.7, which is a plausible figure for the same measurement taken on the same person a few months apart, and which like every other input here is a number we are choosing so we can see what it buys. Then measure the spread of the changes directly, with twenty thousand imagined patients rather than forty, because this is a measurement of the world we just built rather than a run of Priya's trial.

```r
set.seed(8)
before <- rnorm(20000, mean = 150, sd = 15)
after  <- 150 + 0.7 * (before - 150) + rnorm(20000, mean = 0, sd = 15 * sqrt(1 - 0.7^2))

round(c(spread_before = sd(before), spread_after = sd(after),
        correlation   = cor(before, after)), 2)
#> spread_before  spread_after   correlation 
#>         15.11         14.98          0.70

round(sd(after - before), 2)
#> [1] 11.58
```

The second line builds each patient's later reading as 70 percent of their distance from the group average plus fresh noise, which is a standard way to produce two measurements that correlate at 0.7 while both keeping a spread of about 15. The printout confirms it worked: both readings are spread by about 15, they correlate at 0.70, and the **change** from one to the other is spread by only **11.58**.

That smaller spread is the whole prize, because the spread is what the sample size depends on.

```r
power.t.test(delta = 10, sd = 11.58, power = 0.80)$n
#> [1] 22.05296

ceiling(power.t.test(delta = 10, sd = 11.58, power = 0.80)$n)
#> [1] 23

round(power.t.test(n = 23, delta = 10, sd = 11.58)$power, 3)
#> [1] 0.817
```

The exact answer is 22.05 patients per group, so rounding up to 23 hands her a little more than she asked for, and that third line confirms it: 23 per group delivers 81.7 percent power rather than exactly 80.

**23 patients per group, so 46 in total,** down from 74. Same program, same effect, the same 80 percent power target comfortably met, and 28 fewer patients, bought with one extra reading per person at the start.

The stronger the correlation between the two readings, the bigger the saving, which is why this trick is worth so much for stable quantities like blood pressure, weight or exam scores, and worth much less for something that bounces around on its own. It is one of the most underused levers in study design, and it is available to almost every before-and-after comparison.

=== step === concept
::eyebrow The other levers
## What works, and what only looks like it works

Four things in the calculation can move. Three of them are legitimate to adjust and one of them is where studies go wrong.

**More patients.** The obvious lever, the expensive one, and the one that always works.

**Less noise.** Everything that shrinks the spread buys power for free: measuring at baseline as we just did, taking two readings and averaging them, standardising the measurement conditions, or narrowing who is eligible so the group is more alike. Narrowing eligibility has a cost of its own, since the answer then only applies to the narrower group.

**A bigger target effect.** Legitimate only when it is honest. Deciding that a 15-point drop is the smallest one worth acting on is a clinical judgement, and it makes the study smaller. Deciding it because 15 makes the arithmetic come out affordable is arithmetic pretending to be judgement.

**The threshold.** Loosening alpha from 0.05 to 0.10 does buy power, and it pays for that power by doubling the false alarm rate, which is why it is rarely the trade anyone wants. Tightening it costs a lot.

```r
ceiling(power.t.test(delta = 10, sd = 15, power = 0.80, sig.level = 0.01)$n)
#> [1] 55
```

Insisting on a 0.01 threshold takes Priya from 37 to 55 per group, because a stricter bar for false alarms means more evidence is needed to clear it.

A one-sided test is the borderline case, so it deserves its own paragraph. Testing only for a drop rather than for a change in either direction is cheaper:

```r
ceiling(power.t.test(delta = 10, sd = 15, power = 0.80, alternative = "one.sided")$n)
#> [1] 29
```

29 per group instead of 37, which is a real saving. It is legitimate only if a rise in blood pressure would lead to exactly the same decision as no change at all, and only if that is decided and written down before any data exist. For a study of an exercise program that could conceivably harm someone, that is a hard case to make, and switching to one-sided after seeing which way the results went is not a saving at all, it is a way of turning a p-value of 0.08 into 0.04 by hand.

The two things that genuinely do not work, and that both feel like they should:

- **Checking as you go and stopping when it turns significant.** Peeking at your data repeatedly and stopping at the first favourable moment inflates false alarms badly, because a wandering number checked often enough will eventually wander somewhere convenient. There are proper sequential designs that allow interim looks, and they build the correction into the plan in advance.
- **Dropping the awkward patients.** Removing the ones who did not comply, or whose readings looked odd, after seeing the results is not variance reduction, it is choosing the answer.

=== step === quiz
::eyebrow Check yourself
## Which saving is real

Priya's 74-patient plan is over budget, so her team proposes four ways to shrink it. Which one is a genuine, defensible saving?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Switch to a one-sided test at the end if the results happen to point the right way, since the program can only help
- Measure everyone's blood pressure at the start as well as the end, and analyse the change ::ok Yes, and what makes it real is that it shrinks the noise rather than the standard of evidence. Because a patient's start and end readings correlate, the change scores vary less between patients than the final readings do, which took the spread from about 15 to about 11.58 and the sample from 74 to 46. Nothing about the analysis got more permissive, and the decision costs one extra reading per person.
- Recruit 40 patients, look at the results, and add more only if the p-value is close to significant
- Assume the program produces a 20-point drop instead of 10, since that is what one small published trial reported ::no The other three all buy their savings from the standard of evidence rather than from the noise. Choosing the test direction after seeing the data is a way of halving a p-value by hand. Adding patients until the p-value cooperates is peeking, and it inflates false alarms unless the stopping rule was built into the design in advance. And borrowing a 20-point effect from one small published trial imports exactly the inflation the winner's curse produces, which is how a study gets designed around an effect that was never there.

=== step === concept
::eyebrow No formula, no problem
## When no formula fits, simulate the trial

`power.t.test` covers a comparison of two group averages. Real studies wander off that path constantly: three groups instead of two, an outcome that is a count or a yes-or-no, a model with covariates in it, patients who drop out.

There is a general recipe that covers all of it, and you have already run it. Simulate the study under the assumption that the effect is real, analyse each simulated study exactly the way you plan to analyse the real one, and count how often it comes back significant. That count is the power. No formula required, and it works for any design you can write down.

Take dropout, which no formula argument handles and every real trial has. Priya expects about 15 percent of patients to stop attending before the twelve weeks are up.

```r
trial_with_dropout <- function(recruited, dropout = 0.15) {
  usual    <- rnorm(recruited, mean = 150, sd = 15)
  exercise <- rnorm(recruited, mean = 140, sd = 15)
  usual    <- usual[runif(recruited) > dropout]
  exercise <- exercise[runif(recruited) > dropout]
  t.test(usual, exercise)$p.value
}

set.seed(21)
mean(replicate(5000, trial_with_dropout(37)) < 0.05)
#> [1] 0.7426
```

`runif(recruited)` draws one random number between 0 and 1 per patient, and keeping the patients whose number came in above 0.15 drops roughly 15 percent of them. The rest is the trial exactly as before.

Priya's carefully calculated 37 per group delivers **0.743**, not the 0.80 she designed for, because she powered the study for the patients she recruits rather than the patients she ends up measuring. So recruit more.

```r
set.seed(21)
mean(replicate(5000, trial_with_dropout(44)) < 0.05)
#> [1] 0.808
```

**44 per group, 88 patients in total,** restores the 80 percent. That is seven extra patients per group to cover the ones who will not finish, and it is the sort of thing that never appears in a formula and always appears in a real trial.

=== step === tryit
::eyebrow Your turn
## What if a quarter drop out

Priya's research nurse has seen more programs than Priya has and thinks 15 percent dropout is optimistic for a twelve-week exercise commitment. Closer to a quarter, she says.

`trial_with_dropout()` takes the dropout rate as its second argument. Rerun the 44-per-group plan with a quarter of patients dropping out and see what power actually survives.

```r
set.seed(21)
mean(replicate(5000, trial_with_dropout(44, dropout = ____)) < 0.05)
```
::check {"regex":"dropout\\s*=\\s*0?\\.25","gate":true,"difficulty":"intermediate","ok":"0.7588, so the plan that hit 80 percent under 15 percent dropout falls to about 76 percent when a quarter leave. Worth noticing how quietly this happens: the sample size on the protocol still says 44, the calculation behind it was correct, and the study quietly loses five points of power to something nobody wrote down. Simulating the design is how you find that before it costs you the trial.","no":"The rate goes in as a proportion rather than a percentage, so a quarter is 0.25."}
::solution
```r
set.seed(21)
mean(replicate(5000, trial_with_dropout(44, dropout = 0.25)) < 0.05)
#> [1] 0.7588
```

=== step === quiz
::eyebrow Check yourself
## So what should Priya do

Priya has 40 patients available, a program she hopes drops blood pressure by 10 mmHg, and a spread of 15 among her patients. She now knows her plan has 53.5 percent power and that 80 percent would need 74 patients. What is the defensible next move?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- Run the 40-patient trial anyway and report the power as 80 percent, since that is the standard
- Run the 40-patient trial and, if it comes back non-significant, conclude the program does not work
- Run it with 40 and stop early if the result turns significant, to save the remaining patients
- Either find a way to reach about 74 patients, or use change scores from baseline to get there with about 46, or run the 40 as an explicitly labelled pilot to pin down the spread for a properly sized trial ::ok All three of those are honest paths, and which one fits depends on her constraints rather than her statistics. The change-score design is the most attractive because it costs one extra reading per patient instead of 28 extra patients. Labelling the small version a pilot is the other legitimate option, since a pilot exists to sharpen the inputs, and a pilot is never asked to answer the main question on its own.
- Run the 40-patient trial and just be careful about how the results are described ::no The first is a false statement in a protocol. The second reads a coin flip as evidence of absence, and this whole lesson has been a demonstration that a trial like hers misses a real 10-point drop nearly half the time. Stopping early on a favourable look inflates false alarms unless the rule was built into the design in advance. And careful wording does not rescue a design that cannot answer its question, because the problem is the study rather than the sentence describing it.

=== step === concept
::eyebrow A different outcome
## The same question for a proportion

Priya's outcome is a measurement in mmHg, which is why `power.t.test` fit. Plenty of studies have a yes-or-no outcome instead, and the same reasoning applies with a different function.

Suppose her real interest is the share of patients who get below 140 mmHg, which is the threshold that would change their treatment. She expects 30 percent of usual-care patients to get there anyway, and hopes 55 percent of program patients will.

```r
power.prop.test(p1 = 0.30, p2 = 0.55, power = 0.80)
#> 
#>      Two-sample comparison of proportions power calculation 
#> 
#>               n = 60.18568
#>              p1 = 0.3
#>              p2 = 0.55
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

**61 patients per group.** Set beside the 37 the mmHg version needed, that is about two thirds more patients for the same clinic and the same program. The two designs are not a like-for-like comparison, since the 30 versus 55 percent split is its own supposition and the question has shifted slightly, but the general point survives the caveat: turning each patient's blood pressure into a yes or a no throws away everything except which side of 140 they landed on, and a study that throws information away needs more patients to make up for it.

So when a choice exists between measuring a quantity and counting successes, measuring the quantity is almost always the cheaper study. The counted version is worth the extra patients only when the yes-or-no is genuinely the thing that matters, which for a treatment threshold it sometimes is.

=== step === concept
::eyebrow The habit
## Five steps, every time

::widget process-flow {"steps":[{"title":"State the comparison","sub":"which two groups, which outcome, which test"},{"title":"Choose the smallest effect worth detecting","sub":"a decision about what matters, not a hope"},{"title":"Get the spread, and say where it came from","sub":"own records, published study, or a labelled guess"},{"title":"Pick alpha and power, and say why","sub":"0.05 and 0.80 are conventions, not laws"},{"title":"Solve for n, then add for dropout","sub":"a formula if one fits, a simulation if none does"}]}

Take them in order.

**State the comparison** first, because the rest of the calculation depends on it. Two group averages take `power.t.test`, two proportions take `power.prop.test`, and anything more complicated takes a simulation.

**Choose the smallest effect worth detecting.** This is the step that decides everything, since the sample size goes as one over its square, and it is the step people rush. It is a question about what would change a decision, not about what you hope to find or what somebody published.

**Get the spread and say where it came from.** Round it up when you are unsure, because a spread that turns out to be larger than assumed quietly drains the power you paid for.

**Pick alpha and power and say why.** If you are using 0.05 and 0.80, say so and say they are conventional. If missing the effect would be serious, use 0.90 and price it.

**Solve for n, then add for dropout.** The number you compute is the number you need to *measure*, and the number you need to *recruit* is larger by whatever share will not finish.

=== step === concept
::eyebrow Writing it down
## The paragraph you actually submit

The output of all this is not a number, it is a paragraph that a reviewer, a supervisor or an ethics board can check. Priya's version, for the change-score design:

> We will randomise 56 patients, 28 per group, to a twelve-week supervised exercise program or usual care. The primary outcome is the change in systolic blood pressure from baseline to twelve weeks. We consider a 10 mmHg difference between groups the smallest clinically meaningful effect. Assuming a standard deviation of change of 11.6 mmHg, based on a baseline-to-follow-up correlation of 0.7 and a between-patient standard deviation of 15 mmHg observed in our own records, 23 patients per group gives 82 percent power at a two-sided significance level of 0.05. The 28 per group allows for 15 percent of patients not completing the twelve weeks.

Every number in there is checkable, which is the whole point. A reader can see the target effect and judge whether it is meaningful, see where the spread came from and judge whether it is plausible, and reproduce the arithmetic in one line.

Three things that paragraph deliberately does:

- **It names the effect size as a judgement**, not as an expectation. "We consider 10 mmHg the smallest clinically meaningful effect" is a claim somebody can argue with, which is exactly what you want.
- **It sources the spread.** A reviewer who thinks 15 is optimistic can say so, and that conversation is far cheaper before the study than after.
- **It separates recruited from analysed.** 56 randomised, 46 expected at twelve weeks, and the gap explained rather than discovered by a reader doing arithmetic.

The 82 percent rather than 80 is not a typo. It is the 81.7 you computed two steps ago, which is what 23 per group actually delivers once the 22.05 gets rounded up, and quoting the power the design really has beats quoting the power you asked for.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour if you want to push past where this part stops.

- [Cohen, A power primer, 1992](https://pubmed.ncbi.nlm.nih.gov/19565683/) - four pages, the source of the small / medium / large conventions, and much more careful about them than the people who cite it.
- [Hoenig and Heisey, The abuse of power, The American Statistician, 2001](https://doi.org/10.1198/000313001300339897) - the paper that took post-hoc power apart, with the same p-value relationship you plotted, worked out algebraically.
- [Button and colleagues, Power failure: why small sample size undermines the reliability of neuroscience, 2013](https://www.nature.com/articles/nrn3475) - measures the winner's curse across a whole field and estimates typical published power. Sobering.
- [Lakens, Sample size justification, 2022](https://online.ucpress.edu/collabra/article/8/1/33267/120491/Sample-Size-Justification) - the most practical modern guide to defending a sample size, including what to do when the answer is "this is all the patients we have".
- [R documentation for power.t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - the function you used all lesson, including `type` for paired and one-sample designs and `strict` for the two-sided correction.

=== step === complete
## Part 4 complete

You started with Priya's question, which was whether 40 patients could find a 10 mmHg drop, and answered it the long way first: build a world where the program truly works, run her trial ten thousand times inside it, and count. A little over half of those trials found the effect, so her plan was close to a coin flip, and `power.t.test` returned 0.5377573 for the same design in one line.

Then you turned the question round and got the number she came for. Thirty seven patients per group, so 74 in total, for the conventional 80 percent power. Along the way the cost structure became visible: the sample size goes as one over the effect size squared, so halving the target effect quadruples the study, and the same square makes an optimistic guess about the spread expensive in a way nobody notices until it is too late.

Two traps got taken apart with real numbers rather than warnings. Computing power from your own results turned out to trace a single curve against the p-value across 300 trials, which is why it can never answer the question a reviewer is really asking, and the confidence interval can. And filtering ten thousand trials down to the significant ones pushed the average reported drop from a true 10 up to 13.48, and up to 19.07 when the trials were tiny, which is the winner's curse and the reason a spectacular result from a small study is the last number you should design your own study around.

The levers turned out to be more interesting than just recruiting harder. Measuring everyone at baseline and analysing the change took the spread from 15 to 11.58 and the study from 74 patients to 46, for the price of one extra reading each. Dropout took it back up again, and a simulation found that before it cost her the trial.

Underneath all of it sat a framework that has been quietly doing the work since part 2: a claim being tested, a threshold for rejecting it, and two distinct ways of being wrong. Part 5 takes that framework apart properly and puts it back together, so that the pieces you have been using by name have a structure to sit in.

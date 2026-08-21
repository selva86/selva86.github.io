---
title: "Power analysis: find the sample size you need"
slug: "Inference-Mini-4"
description: "A clinic can recruit 40 patients to find a 10-point drop in blood pressure. Work out whether 40 is really enough, and the exact number the study needs."
keywords: "power analysis in R, statistical power, sample size calculation, power.t.test, how many patients does a study need, minimum detectable effect, effect size"
mathjax: true
webr: true
date: "2026-08-21"
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

Today let's work out how many people a study needs before it is worth running at all.

Let's start at a community clinic that thinks it has found something good. Patients do twelve weeks of supervised exercise, three sessions a week, and the ones who stick with it walk out with their blood pressure around 10 points lower than the patients who carried on as usual.

Now the clinic wants to prove it properly, with a real trial. It can recruit 40 patients, so 20 of them go to the exercise program and 20 carry on with usual care.

Forty is what the budget allows, so forty it is.

But nobody in the room has asked the one question that decides whether the whole thing is worth running. Can 40 patients actually see a 10-point drop?

That question has an answer, and you can get it before a single patient walks through the door. Skip it and the clinic can spend twelve weeks, forty people and its entire budget on a study that was never able to find the thing it went looking for.

So how do we settle this?

We are going to build the trial ourselves, with a 10-point drop wired in by hand so that we know for certain the drop is there. Then we run that same trial over and over on fresh patients, and simply count how often it manages to notice.

::widget process-flow {"steps":[{"title":"Wire in a drop that is real","sub":"20 patients on the program, 20 on usual care, a true 10-point gap built in by hand"},{"title":"Replay the trial ten thousand times","sub":"fresh patients every run, and keep the verdict each one reports"},{"title":"Count how often it finds the drop","sub":"that share is the power, and it is the number the clinic is missing"}]}

That is the whole idea. And once we have that number for the clinic, you will be able to work out the same one for any study somebody drops on your desk.

=== step === concept
## What the clinic has to work with

Before we can ask whether 40 patients is enough, we have to be clear about what enough even means. Every sizing question comes down to the same three numbers, and the clinic already has all three of them sitting in its files.

The first is the drop worth finding. Not the drop the clinic hopes for, and not the drop it expects, but the smallest drop that would actually change what the clinic does. Here that is 10 mmHg of systolic blood pressure. mmHg stands for millimetres of mercury, which is the number a doctor reads off the cuff, and systolic is the higher of the two readings they call out.

The second is how much those readings scatter. Blood pressure is not a fixed property of a person. Measure the same patient on two different mornings and you get two different numbers. Across the clinic's own past records, patients' twelve-week changes scatter by about 15 mmHg, and that number is going to matter far more than you would expect.

The third is simply how many people the clinic can get. That is 40, split 20 and 20.

Let's put all three into R, so everything that follows can call them by name. Press Run.

```r
# Put the clinic's three planning numbers on the table
drop_worth_finding <- 10   # mmHg: the smallest fall that would change what the clinic does
spread             <- 15   # mmHg: how much twelve-week changes scatter, from clinic records
n_total            <- 40   # patients the clinic can recruit, 20 to each arm

c(drop = drop_worth_finding, spread = spread, patients = n_total)
#>     drop   spread patients 
#>       10       15       40 
```

Those three numbers are the whole input. Everything from here is arithmetic on them.

=== step === concept
## Why two groups of twenty never line up neatly

That middle number, the 15, is the one people skip past, so let's slow down on it.

Suppose the exercise program works exactly as advertised and lowers blood pressure by 10 points for every single patient. You would still not see 10 in your data. In the twenty program patients we are about to build, one falls 24 points, another falls 4, and a third goes up by 20 because they had a rough fortnight at work. The program's real effect sits underneath all of that personal variation.

The standard deviation is just a way of writing that variation down as one number. Take every patient's twelve-week change, look at how far each one lands from the average change, and the standard deviation is roughly the typical size of that distance. A standard deviation of 15 mmHg means a patient sitting 15 points either side of their group's average is completely ordinary.

Let's build the clinic's 40 patients and take a look at them. The function `rnorm(20, mean = 10, sd = spread)` draws 20 readings from a bell-shaped spread centred on 10 with a standard deviation of 15, and `set.seed(1)` fixes which 20 you get so your numbers match mine.

```r
# Simulate the 40 patients, with a real 10-point drop built into the program arm
set.seed(1)
trial <- data.frame(
  group = rep(c("usual", "program"), each = 20),
  drop  = c(rnorm(20, mean = 0,  sd = spread),    # usual care: no true drop at all
            rnorm(20, mean = 10, sd = spread))    # program: a true 10-point drop
)

usual_drops   <- trial$drop[trial$group == "usual"]
program_drops <- trial$drop[trial$group == "program"]

bins <- seq(-40, 40, by = 5)
hist(usual_drops, breaks = bins, ylim = c(0, 6), col = "grey80", border = "white",
     main = "Twelve-week blood pressure drop, 20 patients per arm",
     xlab = "Drop in blood pressure (mmHg)", ylab = "Number of patients")
hist(program_drops, breaks = bins, col = rgb(1, 0.55, 0, 0.55), border = "white", add = TRUE)
abline(v = mean(usual_drops),   col = "grey30",      lwd = 3)
abline(v = mean(program_drops), col = "darkorange3", lwd = 3)

data.frame(
  arm       = c("usual care", "exercise program"),
  mean_drop = round(c(mean(usual_drops), mean(program_drops)), 1),
  scatter   = round(c(sd(usual_drops),   sd(program_drops)),   1)
)
#>                arm mean_drop scatter
#> 1       usual care       2.9    13.7
#> 2 exercise program       9.9    13.1
```

Look at the two piles and the two thick lines marking their averages. The grey pile is usual care and the orange pile is the program, and they overlap almost completely. Plenty of patients on usual care did better than plenty of patients on the program.

Now read the table. The usual care arm was built with no true drop in it whatsoever, and it still came back averaging 2.9 points. That is pure luck, twenty people who happened to drift down a little. The program arm was built with a true drop of 10 and came back at 9.9, close but not exact.

So the gap between the two averages is 7.0 points, not the 10 that we ourselves wired in. A group average is never the truth. It is one draw that lands somewhere near it.

=== step === concept
## What it takes for the trial to call the drop real

The clinic is not going to eyeball two histograms and announce a result. It will run a statistical test, and the test that compares two group averages is the t-test.

A t-test takes the gap between the two averages, 7.0 points here, and asks one question: if the program did nothing at all, how often would ordinary luck hand you a gap this big or bigger? The answer comes back as a number between 0 and 1 called the p-value. A small p-value means luck would rarely manage this. A large one means luck does this all the time.

Then comes the rule almost every field has settled on. If the p-value falls below 0.05, the trial calls the result real and reports it as statistically significant. If it lands at 0.05 or above, the trial reports nothing at all. Nothing about 0.05 is sacred. Somebody picked it, everybody kept it, and it is still the bar this result gets judged against.

Let's put the clinic's 40 patients through it and see what comes back.

```r
# Run the clinic's planned test on its 40 patients and read the verdict
t.test(drop ~ group, data = trial)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  drop by group
#> t = 1.664, df = 37.917, p-value = 0.1044
#> alternative hypothesis: true difference in means between group program and group usual is not equal to 0
#> 95 percent confidence interval:
#>  -1.526352 15.616490
#> sample estimates:
#> mean in group program   mean in group usual 
#>              9.902927              2.857858 
```

The two arms are listed alphabetically, which is why program comes first. Their averages are the 9.9 and 2.9 you already saw, and the line that decides everything is `p-value = 0.1044`.

That is above 0.05. So the trial reports nothing. Written up honestly, this study concludes that it found no significant difference between the exercise program and usual care.

Sit with that for a second. We built these patients ourselves. We put a real 10-point drop into the program arm with our own hands, so there is no question at all about whether the effect is there. And the trial still walked away empty.

The confidence interval underneath says the same thing in another form: the true drop could plausibly be anywhere from minus 1.5 to plus 15.6 points. That range is wide enough to hold both "the program does nothing" and "the program is excellent", which is another way of saying 40 patients did not settle anything.

=== step === quiz
## Quick check: what did that one trial prove?

The trial was handed a genuine 10-point drop, ran on 40 patients, and came back with p = 0.1044. What can you conclude from that single run?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The exercise program does not lower blood pressure. ::no
- The simulation must be broken, because a drop that real should have shown up. ::no
- The trial failed to find a drop that was genuinely there, which tells you something about the trial and nothing about the program. ::ok Exactly right. The 10-point drop was wired in by hand, so it was real for every second of that run. The study simply was not big enough to see it through the scatter.
- The 0.05 bar is too strict, and a bar of 0.15 would have given the right answer. ::no A miss is not proof the program failed, it is not a bug in the data, and it is not a reason to move the bar after seeing the answer. Loosening the bar to 0.15 would just let three times as many false alarms through on programs that do nothing at all. What this run actually shows is a study too small for the drop it was chasing.

=== step === concept
## Run the same trial ten thousand times

One run cannot tell you how often a run succeeds. Maybe we were just unlucky. Maybe 40 patients works most of the time and we happened to catch the exception. To find that out, you have to run the study many times over.

That is easy here, because we are the ones building the patients. We can recruit a fresh 40, run the trial, write down the verdict, and do it all again as many times as we like. Every one of those trials has the same true 10-point drop wired into the program arm, so any failure to find it belongs to the study and to nothing else.

So let's wrap one entire study in a function and replay it ten thousand times. `replicate(10000, ...)` runs the expression ten thousand times over and collects every answer into a vector.

```r
# Replay the entire trial on fresh patients and keep the p-value from every run
run_one_study <- function(n_per_group) {
  usual   <- rnorm(n_per_group, mean = 0,  sd = spread)   # usual care: no true drop
  program <- rnorm(n_per_group, mean = 10, sd = spread)   # program: a true 10-point drop
  t.test(program, usual)$p.value
}

set.seed(2026)
p_values <- replicate(10000, run_one_study(20))

hist(p_values, breaks = 40, col = "grey85", border = "white",
     main = "10,000 replays of a trial that always has a real 10-point drop",
     xlab = "p-value the trial reported")
abline(v = 0.05, col = "red", lwd = 3)

sum(p_values < 0.05)
#> [1] 5295
```

The red line sits at 0.05, which is the bar a result has to beat. Everything piled up to the left of it is a trial that found the drop and reported it. Everything to the right is a trial that was handed a real effect and missed it.

There is a tall stack hard against the left edge, which is encouraging, and then a long low spread of failures running all the way out to 1. Counting up the successes gives 5,295.

=== step === concept
## Power is the share of trials that find the drop
::prose-only the histogram just drawn is the picture of this idea; here we only turn its count into a share and name it

5,295 out of 10,000. Write that count as a share and you have the number the clinic has been missing all along.

```r
# Turn the count of successful trials into a share, which is the power
mean(p_values < 0.05)
#> [1] 0.5295
```

That share has a name. **Power** is the probability that a study reports an effect, given that the effect is genuinely there. The clinic's planned trial has a power of 0.53.

Read that definition once more, slowly, because every word in it is doing a job. Power is about the study, not about the program. It assumes the effect is real, and then asks whether a study this size will notice it. And it is a long-run share across many possible studies, which is why we had to build ten thousand of them before we could see it.

Turn it around and it sounds worse. The trial misses 47 times in every 100, on an effect that is there every single time.

[KEY INSIGHT]
At 20 patients per arm, this clinic is planning to spend twelve weeks and its whole budget on something barely better than a coin toss. Not because the exercise program is weak, but because the study is too small to see it.

=== step === concept
## How R computes power without any simulation

Replaying the trial ten thousand times is the honest way to see what power is. However, it is not how anybody actually computes it.

For a comparison of two group averages the answer has a closed form, and base R ships it as `power.t.test()`. There is nothing to install and nothing to load. Hand it the numbers and it gives you the power straight back.

```r
# Ask R for the power of the clinic's planned trial, no simulation involved
power.t.test(n = 20, delta = drop_worth_finding, sd = spread, sig.level = 0.05)
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

Four arguments went in, and each one is a plain fact about the clinic.

- `n = 20` is the patients in **each** arm, not the total. R prints that reminder at the bottom of every result, because reading it as the whole study is the single most common way to get this wrong and end up with half the patients you needed.
- `delta = 10` is the drop worth finding, written in the outcome's own units. Here that is mmHg, not some standardised score.
- `sd = 15` is how much the readings scatter, in those same units.
- `sig.level = 0.05` is the bar the p-value has to beat.

The answer comes back as 0.5377573, so 0.54. Our ten thousand replays gave 0.5295. Those two numbers agree, and the small gap between them is exactly what you should expect. The formula is exact, while the simulation is only a tally of ten thousand runs, so it will wobble a little in the third decimal every time you rerun it with a different seed.

So one line of base R gets you what the whole simulation got you, and neither one is more correct than the other. The simulation was worth building because it shows you what power actually is. The formula is the one you will reach for from here on.

=== step === quiz
## Quick check: what does power of 0.54 promise the clinic?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There is a 54% chance the exercise program lowers blood pressure. ::no
- If the program really does lower pressure by 10 points, this trial has a 54% chance of reporting it. ::ok That is it. Power assumes the effect is there, and then asks whether a study this size will notice. It never claims the effect is there.
- About 54 out of every 100 patients on the program will see their pressure fall. ::no
- There is a 46% chance the trial raises a false alarm on a program that does nothing. ::no Power never says whether the program works, and it never counts patients. It runs the other way round: assume the drop is real, then ask how often a study this size reports it. A false alarm on a program that does nothing is a different quantity altogether, and that one is set by the 0.05 bar.

=== step === concept
## Asking R for the number of patients instead

So 40 patients buys the clinic a coin toss. The obvious next question is what it would take to do better, and the answer comes from the very same function run backwards.

Here is the move that makes `power.t.test()` worth learning. Leave out the number you want, and put in the number you want to hit. Drop `n` from the call, hand it `power = 0.80` instead, and R gives you the patients.

```r
# Ask the same function the reverse question: how many patients buy 80% power?
power.t.test(delta = drop_worth_finding, sd = spread, sig.level = 0.05, power = 0.80)
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

R says 36.3058 per arm. You cannot recruit three tenths of a patient, and rounding down would leave the study just short of its target, so you always round up. That is 37 patients in each arm, and 74 patients in total.

Why 0.80? Because that is the number the field settled on, and it is worth being clear about what you are agreeing to when you use it. Power of 80% means accepting that one study in five will come back empty even though the effect is real. Nobody ever proved that one in five is the right price. Cohen suggested it decades ago as a reasonable default and it stuck. Trials that are expensive, or that only ever get run once, often hold out for 0.90 instead.

And there is the clinic's answer. It can recruit 40. The study it wants to run needs 74. Nobody had to be recruited, consented or measured to find that out.

=== step === tryit
## Your turn: what would 90% certainty cost?

Power of 80% still means one study in five comes back empty on a drop that is real. Suppose the clinic's director hates those odds and wants to miss only one time in ten.

Work out what that costs. Same drop worth finding, same spread, same 0.05 bar, but hold out for 90% power instead of 80%. Then round up to whole patients and work out the total across both arms.

```r
# The clinic wants to miss a real 10-point drop only 1 time in 10, not 1 in 5.
# drop_worth_finding is 10 and spread is 15, both already in this session.
# Call power.t.test with the power argument set to 90% instead of 80%, and leave n out.
# One line. Press Check when you have it.
```
::check {"regex": "power\\s*=\\s*0?\\.9", "gate": true, "difficulty": "beginner", "ok": "Yes: 48.3 per arm, so 49 each and 98 patients in total. Cutting the miss rate from 1 in 5 to 1 in 10 costs the clinic 24 more patients on top of the 74 that 80% already needed.", "no": "Take the call that returned 36.3 and change one thing: power = 0.90 in place of power = 0.80. Leave n out so R still solves for it."}
::solution
```r
# How many patients per arm buy 90% power instead of 80%
power.t.test(delta = drop_worth_finding, sd = spread, sig.level = 0.05, power = 0.90)
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

That comes to 48.3 patients per arm, so 49 in each arm and 98 in total. Notice the shape of that. The last ten points of certainty cost almost as much as the whole jump from a coin toss up to 80% did. Certainty gets steadily more expensive the more of it you buy.

=== step === concept
## Give R four of the clinic's numbers, get the fifth back
::prose-only the five quantities and what each one means are clearest side by side as a table; there is nothing here that can be drawn

You have now run the same function two different ways, so it is worth stopping for a moment on what is really going on here, because this one habit covers almost every sizing question anybody will hand you.

`power.t.test()` holds five quantities that are locked to each other. Give it any four and it solves for the one you left out. That is the whole design of it.

| Argument | What it is, in the clinic's words | The clinic's value |
|---|---|---|
| `n` | Patients in each arm, never the total | 20 on offer, 37 needed |
| `delta` | The drop worth finding, in mmHg | 10 |
| `sd` | How much the readings scatter, in mmHg | 15 |
| `sig.level` | The bar the p-value has to beat | 0.05 |
| `power` | How often a study this size finds a drop that is real | 0.54 at 20 per arm, 0.80 if sized for it |

Leave out `power` and you learn what the study you can afford would do. Leave out `n` and you learn what the study you want would cost. Those are the clinic's two real questions, and it now has both answers.

Two rows in that table deserve a harder look, though. The 10 and the 15 were never measured in this trial. They were assumed before the trial even existed, and every number we computed from them carries whatever error is hiding inside them. So those two are what we push on next.

=== step === widget
## The drop only means something next to the spread

A 10-point drop sounds like a fixed amount of evidence. It is not. Ten points is easy to spot in a clinic whose readings barely move, and close to invisible in one whose readings swing all over the place. The sample size follows that comparison, not the 10 on its own.

What actually matters is the drop measured in spreads.

\[ \text{effect size} = \frac{\text{drop worth finding}}{\text{spread of the readings}} = \frac{10}{15} = 0.67 \]

That ratio is the effect size, and 0.67 says the gap between the two arms is about two thirds of one standard deviation. This particular ratio is known as Cohen's d, and the rough labels that go with it are 0.2 for a small effect, 0.5 for a medium one and 0.8 for a large one. So the clinic is chasing something a little above medium.

Move the toggle below through those three sizes and watch what happens to the curve.

::widget power-curve {}

Read the curve left to right first. More patients per arm gives you more power, and there is no surprise in that. The interesting part is what the toggle does. A large effect reaches 80% power at about 25 patients per arm. A medium one needs about 64. A small one needs nearly 400. It is the same curve every time, and nothing but that ratio slides it across the page.

That cuts both ways for the clinic. If its readings scattered by 10 instead of 15, the same 10-point drop would be an effect size of 1.0 and would need a fraction of the patients. The spread is not a background detail. It is half of the answer.

=== step === concept
## What if the program only drops it by 5 points?

The 10 was the clinic's estimate of what the program does, and estimates run optimistic. Suppose the truth is half that, a 5-point drop. What does the bill look like then?

Your instinct probably says twice as many patients. It is considerably worse than that.

Let's price four candidate drops in one go. The `sapply()` line runs that same `power.t.test()` call once for every drop in the list and collects the four answers, and `$n` picks out just the patients-per-arm number from each one.

```r
# What each candidate drop would cost in patients, all at 80% power
candidate_drops <- c(5, 7.5, 10, 15)
n_per_arm <- sapply(candidate_drops, function(d)
  power.t.test(delta = d, sd = spread, sig.level = 0.05, power = 0.80)$n)

data.frame(
  drop_mmHg      = candidate_drops,
  n_per_arm      = round(n_per_arm, 1),
  patients_total = 2 * ceiling(n_per_arm)
)
#>   drop_mmHg n_per_arm patients_total
#> 1       5.0     142.2            286
#> 2       7.5      63.8            128
#> 3      10.0      36.3             74
#> 4      15.0      16.7             34
```

Read the first and third rows together. Halving the drop from 10 points to 5 took the bill from 74 patients to 286, which is 3.9 times as many.

That is not a quirk of these particular numbers. The count you need grows with one divided by the square of what you are chasing.

\[ n \;\propto\; \frac{1}{\text{drop}^2} \]

Halve the drop and the halving gets squared, because one divided by a half squared is four. Cut the drop to a third and you need nine times the patients. Read the table the other way and the same rule pays you back, which is why a generous 15-point drop can be found with just 34 people.

[KEY INSIGHT]
Small effects are extremely expensive to study. The clinic's own table proves it. Same clinic, same equipment, same kind of patient, and the bill runs from 34 patients to 286 purely on the size of the thing being chased.

=== step === quiz
## Quick check: halve the drop, what happens to the patient count?

A trial has been sized to find a 10-point drop. The team then decides that a 5-point drop would matter too, and wants the study to catch that instead. Everything else about the design stays the same.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It halves, since the trial is now chasing something half the size. ::no
- It stays about the same, because the scatter in the readings has not changed. ::no
- It rises to roughly four times as many, because the count grows with one over the drop squared. ::ok Correct. The clinic's own table went from 74 patients for a 10-point drop to 286 for a 5-point one, which is 3.9 times as many.
- It doubles, one for one with the halving of the drop. ::no The relationship is not one for one, and it does not stand still either. Sample size grows with one over the drop squared, so halving what you are chasing multiplies the count by about four, and cutting it to a third multiplies it by about nine. That squaring is the whole reason small effects are so costly to study.

=== step === concept
## What 40 patients could actually catch

The clinic still has 40 patients and no more. The grant is closed and the budget is fixed, so that is the study it is going to run. That leaves us one last way to turn the question around.

Instead of asking how many patients a 10-point drop needs, ask what drop 40 patients can reliably find. Same five quantities, same single function, except this time `delta` is the one we leave out and `n` goes back in.

```r
# With 40 patients fixed, what is the smallest drop this trial could reliably catch?
power.t.test(n = 20, sd = spread, sig.level = 0.05, power = 0.80)
#> 
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

R comes back with 13.6 mmHg. That is the smallest drop this trial can find four times out of five, and it has a name worth carrying around, the **minimum detectable effect**. It is what a study of a fixed size is honestly capable of seeing.

Now put the two numbers side by side. The program is believed to deliver about 10 points. The trial can reliably catch about 13.6. The clinic is trying to photograph something smaller than its camera can resolve.

[WARNING]
A minimum detectable effect larger than the effect you care about is a red flag before a single patient is recruited. It means a null result will be uninterpretable: nobody will be able to tell whether the program failed or the study was simply too small to say.

=== step === concept
## Where the 10 and the 15 have to come from
::prose-only this is a sourcing decision about where two assumed inputs are allowed to come from, carried by the warning below; there is nothing here that can be drawn

Everything you have computed rests on two numbers that were assumed rather than measured. So it is worth being blunt about where each one is allowed to come from.

The drop worth finding is a clinical judgement, not a statistical one. It is the smallest change that would alter what a doctor does, and the person who sets it is the clinician, not the analyst. Ten points was chosen because a fall that size changes prescribing, not because anyone expects the program to deliver exactly ten.

The spread is an empirical fact, and you have to go and find it. The clinic's own records are the best source, since they come from the same equipment and the same kind of patient. Published trials on similar populations are the next best thing.

The tempting third option is to run a small pilot, take its numbers, and plan the main study from those. Be careful there. Twenty people give you a very noisy estimate of both the drop and the spread, and a pilot that overshoots by luck leaves you with an undersized main study, which is the exact trap you were trying to avoid. Treat a pilot as a sanity check on feasibility, not as the source of your numbers.

There is one more move to rule out, and it is the most common mistake in this whole subject. After a study comes back with nothing, it is tempting to take the drop you happened to observe, feed it back into a power calculation, and report the power you "had". That number is worthless. It is computed from the very result you are trying to explain, so it can only ever tell you what you already know. A small observed drop gives a low computed power, every single time, no matter what is true.

[WARNING]
Power analysis is a planning tool, never a post-mortem. Compute it before you collect data, from a drop worth finding and a spread you sourced independently. Computing it afterwards from your own observed result is circular and tells you nothing you did not already have.

=== step === quiz
## Quick check: what should the clinic write in its protocol?

Recruitment is capped at 40 patients and that is final. The clinic now has to write down, in advance, what this study is and is not able to do. Which line is the honest one?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- State that the trial has 80% power, since 80% is what every protocol reports. ::no
- Drop the usual care arm and put all 40 patients on the program, doubling the group that matters. ::no
- State that with 20 patients per arm the trial can reliably detect a drop of about 13.6 mmHg, and that a 10-point drop sits below what this design can catch. ::ok Exactly. That sentence is both true and useful: it tells a reader in advance precisely what a null result from this trial would and would not mean.
- Run the trial as planned, then compute the power afterwards from whatever drop turns up. ::no Two of these promise a reader something the study cannot deliver, one throws away the comparison the study exists to make, and power computed after the fact is circular. The honest protocol states the smallest drop the design can catch, states it up front, and lets the reader judge.

=== step === tryit
## Your turn: the readings scatter more than we thought

Someone finally pulls the clinic's records properly, and the twelve-week changes turn out to scatter by 20 mmHg, not 15. The drop worth finding has not moved, the 0.05 bar has not moved, and the clinic still wants 80% power.

Work out what that wider scatter does to the number of patients, then hold it up against the 74 the clinic thought it needed.

```r
# The clinic's records put the spread at 20 mmHg, not the 15 we assumed.
# Same drop worth finding (10), same bar (0.05), same 80% power target.
# Call power.t.test with the sd argument set to that wider spread, and leave n out.
# One line. Press Check when you have it.
```
::check {"regex": "sd\\s*=\\s*20", "gate": true, "difficulty": "intermediate", "ok": "Right: 63.8 per arm, so 64 each and 128 patients. Five extra points of scatter took the study from 74 patients to 128, and the exercise program never changed at all.", "no": "Reuse the call that returned 36.3 per arm and change one argument: sd = 20 in place of sd = 15. Leave n out so R solves for it."}
::solution
```r
# How many patients per arm if the readings scatter by 20 mmHg instead of 15
power.t.test(delta = drop_worth_finding, sd = 20, sig.level = 0.05, power = 0.80)
#> 
#>      Two-sample t test power calculation 
#> 
#>               n = 63.76576
#>           delta = 10
#>              sd = 20
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

Now look back at the table of candidate drops. A 7.5-point drop at a spread of 15 needed 63.8 per arm as well, which is the identical number.

That is not a coincidence. Ten points against a spread of 20 is an effect size of 0.5, and 7.5 points against a spread of 15 is also 0.5. The calculation never cared about the drop or the spread on their own. It only ever cared about the ratio between them.

=== step === tryit
## Your turn: check the 37 really buys 80%

The formula said that 37 patients per arm buys 80% power. That is a claim, and you already have everything sitting in the session to test it.

`run_one_study()` takes a number of patients per arm, builds two fresh groups with a real 10-point drop, runs the t-test and hands back the p-value. Replay it ten thousand times at 37 patients per arm, then take the share of those runs that come in under 0.05. If the formula is right, that share should land close to 0.80.

```r
# run_one_study(n) builds a fresh trial with a real 10-point drop and returns its p-value.
# Set the seed to 2026 first, so your answer matches mine.
# Replay it 10,000 times at 37 patients per arm, then take the share below 0.05.
# Three lines. Press Check when you have them.
```
::check {"regex": "run_one_study[(]\\s*37\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "It comes back at 0.7991, near enough to 0.80 to call it a match. One line of formula and ten thousand simulated trials agree, which is exactly what you want to see before spending a budget on the strength of one of them.", "no": "The same three lines as the replay you ran before, with 37 in place of 20: set.seed(2026), then p_at_37 is replicate(10000, run_one_study(37)), then mean(p_at_37 < 0.05)."}
::solution
```r
# Check by brute force that 37 patients per arm really does buy 80% power
set.seed(2026)
p_at_37 <- replicate(10000, run_one_study(37))
mean(p_at_37 < 0.05)
#> [1] 0.7991
```

Both roads lead to the same place. The closed form got there in one line and the simulation got there in ten thousand, and that agreement is what lets you trust a single `power.t.test()` call when there is no time to simulate anything.

=== step === concept
## References before you write the protocol

- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Lawrence Erlbaum. Where the small, medium and large effect size labels come from, and where the 80% convention started.
- [The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis](https://doi.org/10.1198/000313001300339897) - Hoenig and Heisey (2001), The American Statistician 55(1), 19-24. The case against computing power after the fact, worked through properly.
- [Power failure: why small sample size undermines the reliability of neuroscience](https://doi.org/10.1038/nrn3475) - Button and colleagues (2013), Nature Reviews Neuroscience 14, 365-376. What happens to an entire field when studies routinely run at the clinic's 0.53.
- [Sample Size Justification](https://doi.org/10.1525/collabra.33267) - Lakens (2022), Collabra: Psychology 8(1), 33267. How to defend the drop and the spread you fed the calculation, which is the part reviewers really push on.
- [Power calculations for two-sample t tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team, the documentation for `power.t.test()`.

=== step === complete
## What the clinic now knows about its 40 patients

The clinic walked in with 40 patients and a hunch. Here is what it walks out with.

- **Power is the share of studies that find an effect that is really there.** You built that share by hand out of ten thousand replays of a trial with a genuine 10-point drop, and only 5,295 of them noticed. That is a power of 0.53.
- **One function links five numbers.** `power.t.test()` holds the patients per arm, the drop worth finding, the spread of the readings, the 0.05 bar and the power together. Give it any four and it hands back the fifth.
- **The clinic's real answer is 74 patients.** Thirty seven per arm buys 80% power for a 10-point drop at a spread of 15, and ten thousand simulated trials came back at 0.7991 to confirm it.
- **Small effects cost far more than anybody expects.** The count grows with one over the drop squared, so halving the target from 10 points to 5 pushed the bill from 74 patients to 286.
- **Forty patients can only reliably catch about 13.6 points.** That is the honest line for the protocol, and it says plainly that a 10-point drop is out of this study's reach.

So the next time somebody asks whether a study is big enough, you have one sentence to give back:

"Tell me the smallest effect that would change your decision, and how much your measurements scatter, and I will tell you how many people you need before you recruit a single one."

That is the whole of power analysis. Congratulations, you made it through. Have a great day!

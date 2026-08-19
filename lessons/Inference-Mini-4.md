---
title: "Power analysis: find the sample size you need"
description: "A clinic wants to catch a 10 point blood pressure drop with 40 patients. Simulate the trial, read its power, then let R solve for the sample size it needs."
keywords: "power analysis in R, statistical power, sample size calculation, power.t.test, effect size, type II error, designing a study in R"
mathjax: false
webr: true
date: "2026-08-19"
post_type: "LESSON"
curriculum_id: "0.0.7"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-3"
lesson_access: "windowed"
catalog_blurb: "How to work out the sample size a study needs before it starts."
---

=== step === cover

## Power analysis: find the sample size you need

Let's suppose a clinic thinks it has found something good. Patients with high blood pressure get put on a supervised exercise program instead of the usual advice, and the staff are convinced it pulls the top number down by about 10 points.

Now they want to prove it properly. They can recruit 40 patients: 20 on the program, 20 on usual care. Everybody gets measured at the end and the two groups get compared.

Here is the question nobody in the room asks out loud. Is 40 enough?

It is an uncomfortable question. If 40 patients is too few, this study can be perfectly designed, perfectly honest, and still come back with nothing to show. The program works, the trial misses it, and a year of everybody's effort is gone.

The good part is that you can answer it before a single patient signs up.

::widget power-curve {}

Have a play with the toggle above. The curve is the whole idea in one picture. The bigger the effect you are chasing, the fewer people you need to catch it; the smaller the effect, the bigger the crowd you have to recruit. The red dot marks the group size where you finally have a good chance.

That toggle is in a general purpose unit for now, which is why it says d rather than millimetres. By the end of this lesson you will be putting the clinic's own numbers in and getting the exact head count back.

=== step === concept

## What has to happen for this trial to count as a success?

Let's write down exactly what the clinic is going to do, because the sizing question only makes sense once the plan is on paper.

Twenty patients get usual care. Twenty get the exercise program. Twelve weeks later everybody gets one blood pressure reading, systolic, in millimetres of mercury, which is the top number the nurse calls out.

That gives two averages, one per group. The clinic compares them with a t test, the standard way of asking whether two group averages sit far enough apart to take seriously. The test returns a p value, and the clinic has decided in advance to call the study a success only if that p value comes in under 0.05.

That decision is the rule of the game. A p value under 0.05 means this: if the program did nothing at all, a gap this big between the two groups would turn up less than 5% of the time by luck alone. Rare enough that the clinic is willing to act on it.

So let's play one trial and see what happens.

Adults on usual care sit around 140 mmHg, and readings bounce around that figure by roughly 15 mmHg from one person to the next. If the program really does deliver its 10 point drop, its patients sit around 130 with that same 15 point spread. Here are 40 patients drawn from exactly that world.

```r
set.seed(42)

# 20 patients on usual care, centred at 140 mmHg
trial_ctl <- rnorm(20, mean = 140, sd = 15)

# 20 patients on the exercise program, centred at 130 mmHg
trial_exr <- rnorm(20, mean = 130, sd = 15)

round(c(usual_care = mean(trial_ctl), program = mean(trial_exr)), 1)
#> usual_care    program 
#>      142.9      125.9
```

The two group averages came out 142.9 and 125.9. Neither one landed on the number it was drawn from, and that is just what 20 people look like. The averages wobble.

Now the test.

```r
t.test(trial_ctl, trial_exr)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  trial_ctl and trial_exr
#> t = 2.939, df = 36.976, p-value = 0.005645
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>   5.262257 28.625098
#> sample estimates:
#> mean of x mean of y 
#>  142.8788  125.9351
```

A p value of 0.005645, comfortably under 0.05. The trial worked. The clinic gets its result.

But that was one trial. One draw of 40 people out of all the possible groups of 40 the clinic might have recruited. The next 40 patients would give different averages and a different p value. So the honest question is not whether this trial worked. It is how often a trial like this one works.

=== step === concept

## What if we ran that same trial 2000 times?

The clinic gets one shot at this in real life. R can give us two thousand.

Here is what makes this worth doing. In every single one of these 2000 trials, the program truly works. We are building the world ourselves: usual care centred at 140, program centred at 130. There is a real 10 point drop sitting in there every time, waiting to be found. The only thing left to vary is which 40 people happen to walk through the door.

So the question becomes very sharp. In a world where the effect is definitely real, how often does this trial actually notice it?

```r
set.seed(42)

caught <- replicate(2000, {
  ctl <- rnorm(20, mean = 140, sd = 15)
  exr <- rnorm(20, mean = 130, sd = 15)
  t.test(ctl, exr)$p.value < 0.05
})

mean(caught)
#> [1] 0.5445
```

Read that slowly. `caught` holds 2000 answers, one per trial, each either TRUE or FALSE, where TRUE means that trial came back with p under 0.05. The average of a vector of TRUEs and FALSEs is just the fraction that are TRUE.

0.5445. Just over half.

In a world where the exercise program definitely works, this trial spots it 54% of the time and comes back empty the other 46%. The clinic is close to a coin toss, and nobody in the room knows it.

=== step === concept

## That fraction has a name

::prose-only the 54% was computed and printed one step ago; this step only puts a name to it, so there is nothing new to draw

That 54% is the study's **power**.

Power is the chance that a study finds an effect that is genuinely there. That is the whole definition. A study with 54% power is a study that fails roughly half the time for no reason other than being too small. The other 46% has a name of its own, the type II error rate: the chance of missing something that was really there.

Notice what is not wrong in that sentence. Nothing about the exercise program is wrong. Nothing about the t test is wrong. The analysis is correct, the data are honest, the statistics are textbook. There are simply not enough patients in the room for the test to see past the ordinary wobble between people.

Notice too when power exists. We worked it out from the design alone: 20 per group, a 10 point drop, a 15 point spread, a 0.05 cutoff. Not one patient had been recruited. Power belongs to the plan rather than to the result, which is why it is worth a morning of your time before a study rather than after it.

[KEY INSIGHT]
Power is the probability that your study comes back with a significant result **given that the effect you are looking for is real**. Low power does not make a result wrong. It makes a null result meaningless, because you were never in a position to find anything.

=== step === quiz

## What does 54% power actually mean?

The clinic's trial has 54% power against a 10 point drop. Which of these says what that number means?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 54% chance that the result this trial reports is the correct one. ::no
- There is a 54% chance the trial raises a false alarm and reports a drop that is not really there. ::no
- If the program really does lower pressure by 10 points, this trial has a 54% chance of coming back with p under 0.05. ::ok Exactly. Power is a statement about the trial, made in advance, on the assumption that the effect is real. Fifty four times out of a hundred this design catches it. The other forty six times the same real effect slips straight through.
- Power is just 1 minus the p value, so 54% is another way of saying p = 0.46. ::no Power is a statement about the trial, not about the answer the trial produced. It is the chance that a study built like this one comes back with p under 0.05 when the 10 point drop is genuinely there. The false alarm rate is a separate dial, the 0.05 itself, and the p value is a third thing again, computed only after the data arrive.

=== step === concept

## Do I have to simulate every time?

Simulating 2000 trials was honest work and it took about a second, but you do not have to do it. For a t test the answer has a formula, and base R ships it. The function is `power.t.test`, and it needs nothing installed.

Give it the same numbers we baked into the simulation and it returns the power directly. `delta` is the drop you are chasing, 10 mmHg. `sd` is the person to person spread, 15 mmHg. `n` is the group size, 20 patients per arm. `sig.level` is the 0.05 cutoff.

```r
power.t.test(n = 20, delta = 10, sd = 15, sig.level = 0.05)
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

The simulation said 0.5445. The formula says 0.5378. They agree, and the small gap is just the noise you get from running 2000 trials instead of an infinite number of them.

That is worth a pause, because it tells you the formula is not a different idea from the simulation. It is the same count, done exactly instead of by brute force. If you ever doubt a power number, you can always go back and simulate it.

Look at the last line of the output too: **n is number in each group**. Twenty per arm, forty people in total. R will keep telling you this, and it is the single easiest thing to misread in the whole calculation.

=== step === concept

## What are the four dials?

Four numbers describe the clinic's study, and power is the reading that comes out of them.

- `delta`, the drop you want to catch. 10 mmHg.
- `sd`, how much readings vary from patient to patient. 15 mmHg.
- `sig.level`, the false alarm rate you are willing to live with. 0.05.
- `n`, the group size. 20.

Here is the move that makes the whole thing useful. `power.t.test` does not only run forwards. Leave any one of those four out, tell it the power you want instead, and it solves for the one you left blank. That is the same equation read from the other end.

For the clinic the blank is obvious. They know the drop they care about, they know the spread, they will use the usual 0.05, and they want decent power. What they do not know is how many patients to recruit.

::widget process-flow {"steps": [{"title": "Name the drop", "sub": "the smallest change that would actually matter, in real units"}, {"title": "Get the spread", "sub": "how much readings vary between patients (the sd)"}, {"title": "Set alpha and power", "sub": "0.05 for false alarms, 0.80 for the catch rate"}, {"title": "Solve for n", "sub": "R fills in the one dial you left blank"}]}

Those four steps are a power analysis. Everything else in this lesson is detail hanging off them.

=== step === concept

## So how many patients does the clinic actually need?

Drop `n` from the call and put `power` in its place.

Why 0.80? Convention, mostly. Eighty percent power means you accept a one in five chance of missing a real effect, and that is the floor most ethics boards and funders have settled on. There is nothing sacred about it, and you will see 0.90 asked for when the stakes are higher.

```r
n_needed <- power.t.test(delta = 10, sd = 15, sig.level = 0.05, power = 0.80)

n_needed
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

There it is: 36.3058. Two things to do with that number before it means anything.

You cannot recruit 0.3058 of a patient, so you round up. Always up, never down, because rounding down leaves you short of the power you asked for. And 36.3058 is per group rather than the whole study, exactly as that last line says.

```r
ceiling(n_needed$n)      # patients per group
#> [1] 37
2 * ceiling(n_needed$n)  # patients in total
#> [1] 74
```

Thirty seven per arm. Seventy four patients in total.

The clinic planned on 40. They need 74. That is the payoff from an hour of work: a vague worry about whether the study is big enough has turned into a specific number they can take to a funder, a recruitment plan and an ethics committee.

=== step === quiz

## n = 36.3058, so how many patients must the clinic recruit?

R has just returned `n = 36.3058` for 80% power. How many people does the clinic need to bring through the door?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 37 patients. ::no
- 74 patients. ::ok Right. Round 36.3058 up to 37, because you cannot recruit part of a person, then double it, because R gives you the size of one group and this study has two of them.
- 36 patients. ::no
- 18 patients. ::no Two separate traps here, and the output warns you about both. R reports n per group, which is why its last line says n is number in each group, so 36.3058 means 36.3058 in the exercise arm and another 36.3058 on usual care. And a fraction of a patient does not exist, so you always round up rather than down. That makes it 37 per group and 74 people in total.

=== step === tryit

## The ethics board wants 90% power. What now?

The clinic takes its 74 patients to the ethics board and the board pushes back. For a study that could change how patients get treated, a one in five chance of missing a real benefit is too high. Make it one in ten.

One in ten missed is 90% power. Change one argument in the call below and run it.

```r
# The board wants 90% power instead of 80%.
# Change the power argument and run it.
power.t.test(delta = 10, sd = 15, sig.level = 0.05, power = 0.80)
```

::check {"regex": "power\\.t\\.test[\\s\\S]*power\\s*=\\s*0\\.9[^1-9]", "gate": true, "difficulty": "beginner", "ok": "That is it. R returns 48.26431, which rounds up to 49 per group and 98 patients in total.", "no": "Keep every other argument exactly as it is and change only power, to 0.9. The call still starts with power.t.test and still leaves n out, because n is still the thing you want R to work out for you."}

::solution

```r
answer <- power.t.test(delta = 10, sd = 15, sig.level = 0.05, power = 0.90)

ceiling(answer$n)      # per group
#> [1] 49
2 * ceiling(answer$n)  # in total
#> [1] 98
```

Look at what that cost. Going from 80% to 90% power did not add a handful of patients, it added 24 of them, on top of a study that was already 74. The closer you push power towards certainty, the more each extra point of it costs in people, money and months.

=== step === concept

## Where did the 10 and the 15 come from?

Everything so far has rested on two numbers that R never gave us. We typed them in. R has no idea what blood pressure is, what a clinic is, or what counts as an improvement. Feed it nonsense and it will hand back a beautifully formatted sample size for that nonsense.

So where do they come from?

**The spread, `sd = 15`, comes from data.** A pilot study, a published trial on similar patients, or the clinic's own records from previous years. Fifteen mmHg is the standard figure for person to person variation in adult systolic pressure, which is why it is used here. If you have no idea at all what your spread is, that is the thing to go and measure first.

**The drop, `delta = 10`, is not a measurement.** It is a judgement call, and it is the hardest part of the whole exercise. It is the smallest improvement that would actually change what the clinic does. If a 4 point drop would not change anybody's treatment, there is no reason to build a study capable of detecting a 4 point drop.

That one choice moves the answer more than anything else in the calculation.

```r
drops <- c(5, 10, 15)

sizes <- sapply(drops, function(d)
  ceiling(power.t.test(delta = d, sd = 15, sig.level = 0.05, power = 0.80)$n))

names(sizes) <- paste(drops, "mmHg")
sizes
#>  5 mmHg 10 mmHg 15 mmHg 
#>     143      37      17
```

Ask to catch a 5 point drop and you need 143 patients per group, 286 people in total. Ask for 15 and 17 per group will do it. Same clinic, same patients, same test, same spread. The only thing that changed was the size of the effect somebody decided was worth catching.

[WARNING]
The tempting move at this point is to raise `delta` until the sample size fits the budget. That is not a power analysis, it is a wish. If a 15 point drop is not plausible for this program, designing a 34 patient study around one only guarantees you will be too small for the drop you actually get.

=== step === quiz

## Halve the drop you want to catch. What happens to n?

Look at those three sample sizes again before you answer: 143 patients per group for a 5 point drop, 37 for a 10 point drop, 17 for a 15 point drop. Going from a 10 point drop to a 5 point drop halves the effect you are chasing.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It doubles, from 37 per group to about 74. ::no
- It roughly quadruples, from 37 per group to about 143. ::ok Right, and that is the most useful rule of thumb in study design. Sample size moves with the square of the drop you are chasing, so halving the effect costs you around four times the patients.
- It halves, from 37 per group to about 18. ::no
- It barely moves, because sample size is driven by the spread rather than by the drop. ::no Halving the drop does not halve or double the sample, it roughly quadruples it: 37 per group becomes 143. Sample size moves with the square of the effect you are chasing, so each time you go after something half as big you need about four times as many people. This is exactly why small effects are so expensive to study, and why studies that go looking for them so often come back empty.

=== step === concept

## What does the whole trade-off look like?

We have been reading single points off a curve. Here is the curve.

```r
curve_n <- 5:80
curve_power <- sapply(curve_n, function(n)
  power.t.test(n = n, delta = 10, sd = 15, sig.level = 0.05)$power)

plot(curve_n, curve_power, type = "l", lwd = 2, col = "#1f7a55",
     xlab = "patients per group", ylab = "power to catch a 10 mmHg drop",
     main = "How power grows as the clinic recruits more")
abline(h = 0.80, lty = 2, col = "#b3261e")
abline(v = 37, lty = 3, col = "grey40")
```

The dashed red line is the 80% target and the dotted grey line is the 37 patients per group that meets it. A few readings off that curve:

```r
readings <- round(curve_power[curve_n %in% c(10, 20, 37, 60, 80)], 2)
names(readings) <- c(10, 20, 37, 60, 80)

readings
#>   10   20   37   60   80 
#> 0.29 0.54 0.81 0.95 0.99
```

The shape is the useful part. Going from 10 patients per group to 37 buys you 0.52 of power. Going from 37 to 80, more than doubling the study again, buys you 0.18.

So the first patients you recruit are worth far more than the last ones. That is why chasing 95% power is rarely worth what it costs. It is also why a study sitting down at 0.29 power is not really a small study. It is a study that will probably tell you nothing whichever way it comes out.

=== step === concept

## What if 74 patients is out of reach?

Often it is. The clinic needs 74 and can find 40. There are three honest responses, and one dishonest one.

**1. Go after a bigger effect, but only if you believe in it.** If there is good reason to think a supervised program delivers 15 points rather than 10, then 17 per group is a legitimate design. If there is not, this is just the wish from a moment ago wearing a suit.

**2. Shrink the spread by measuring better.** That `sd = 15` is not a law of nature. Part of it is real variation between people, and part of it is sloppiness in the measurement: different cuffs, different arms, patients who walked up two flights of stairs, readings taken at different times of day. Take three readings per patient and average them, rest everybody for five minutes first, use the same arm and the same machine, and the spread comes down.

```r
tighter <- power.t.test(delta = 10, sd = 12, sig.level = 0.05, power = 0.80)

ceiling(tighter$n)
#> [1] 24
```

Getting the spread from 15 down to 12 takes the study from 37 per group to 24. That is 26 fewer people, bought with better technique rather than a bigger budget. The squaring rule is at work here too: 15 divided by 12 is 1.25, and 1.25 squared is about 1.56, which is very close to 37 divided by 24.

**3. Run the smaller study and say the number out loud.** There is nothing dishonest about running the 40 patient study at its 54% power, as long as the write up states it and the conclusion is worded to match. What is dishonest is running it, missing the effect, and then reporting "no significant difference" as though the study had been big enough to earn that sentence.

=== step === tryit

## Only 50 patients exist. What is the smallest drop you could catch?

The clinic checks its books. Over a whole year it sees about 50 patients who would qualify for this study. Not 74. Fifty.

So turn the question around. Given those 50 patients, what is the smallest drop this study could reliably catch? This time `n` is the thing you know and `delta` is the blank.

```r
# The clinic can recruit 50 patients in total.
# Fix n, leave delta out, and let R solve for the drop.
power.t.test(n = 50, sd = 15, sig.level = 0.05, power = 0.80)
```

::check {"regex": "power\\.t\\.test[\\s\\S]*\\bn\\s*=\\s*25\\b", "gate": true, "difficulty": "intermediate", "ok": "12.1 mmHg. With 50 patients the smallest drop this clinic can reliably catch is about 12 points, and the drop it actually believes in is 10. The study is too small before it even starts.", "no": "Set n to 25 rather than 50. R wants the size of one group, and 50 patients split across two arms is 25 each. Leave delta out of the call altogether so that R has something to solve for."}

::solution

```r
smallest <- power.t.test(n = 25, sd = 15, sig.level = 0.05, power = 0.80)

round(smallest$delta, 1)
#> [1] 12.1
```

This is the version of the calculation that saves the most trouble, and it is the one almost nobody runs. It does not ask how many people you need. It asks what this study could possibly see with the people you actually have.

When the answer comes back bigger than the effect you believe in, as it just did here, you have learned something genuinely valuable before recruiting a single patient. The clinic's choice is now between finding more patients, measuring more carefully, and not running this study at all. All three of those beat spending a year to produce a result nobody can interpret.

=== step === concept

## Why you must never compute power after the study

One last thing, and it is the one that catches careful people out.

Suppose the clinic runs its 40 patient trial anyway, and it comes back the way our very first simulated trial did: p = 0.005645, a 16.9 point drop. Somebody at the meeting asks a perfectly reasonable sounding question. What power did we actually have?

So they take the drop the study observed and feed it back into the same function.

```r
observed_drop <- mean(trial_ctl) - mean(trial_exr)
pooled_sd <- sqrt((var(trial_ctl) + var(trial_exr)) / 2)

round(c(observed_drop = observed_drop, pooled_sd = pooled_sd), 1)
#> observed_drop     pooled_sd 
#>          16.9          18.2
```

```r
power.t.test(n = 20, delta = observed_drop, sd = pooled_sd, sig.level = 0.05)$power
#> [1] 0.8170136
```

Eighty two percent. The very same 40 patient design we measured at 54% power now reports 82%, and nothing has changed except which numbers went in.

This is called post hoc power, or observed power, and it is empty. It is computed from the result it claims to be judging, so a small p value will always produce high observed power and a large p value will always produce low observed power. It is the p value in a different outfit. It cannot tell you whether the study was big enough, because the only effect size it knows about is the one this particular study happened to land on.

So what do you do when a study comes back not significant and somebody wants to know whether the effect is absent or the study was too small? That is a fair question, and the confidence interval answers it.

```r
round(t.test(trial_ctl, trial_exr)$conf.int, 1)
#> [1]  5.3 28.6
#> attr(,"conf.level")
#> [1] 0.95
```

The interval says the true drop is somewhere between 5.3 and 28.6 mmHg. That width is the honest report of how little a 40 patient study knows: the drop could be modest or it could be enormous, and this trial cannot separate those two. A narrow interval sitting near zero would tell you the effect really is small. A wide interval like this one tells you the study could not tell. That distinction is what people are reaching for when they compute power after the fact, and the interval hands it over properly.

=== step === concept

## References

Where the numbers, the conventions and the warnings in this lesson come from.

- [power.t.test, R stats package documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html). The reference page for the function used throughout, including the rule that n is the number per group.
- [Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences, 2nd edition. Routledge](https://doi.org/10.4324/9780203771587). The book that made power analysis standard practice, and the source of the 80% convention.
- [Hoenig, J. M. and Heisey, D. M. (2001). The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis. The American Statistician 55(1), 19-24](https://doi.org/10.1198/000313001300339897). The paper showing why observed power is just the p value restated.
- [Button, K. S. et al. (2013). Power failure: why small sample size undermines the reliability of neuroscience. Nature Reviews Neuroscience 14, 365-376](https://doi.org/10.1038/nrn3475). What happens to a whole research field when most of its studies run at low power.
- [pwr: Basic Functions for Power Analysis, CRAN](https://cran.r-project.org/package=pwr). A widely used package that extends the same calculations to ANOVA, correlation and regression.

=== step === complete

## What you can do now

The clinic asked whether 40 patients was enough. The answer was no. Forty gives them a 54% chance of catching a real 10 point drop, and they need 74 to get to 80%.

Here is what you can take to your own study.

- **Power is the chance a study finds an effect that is really there.** You compute it from the design, before any data exist.
- **Four numbers drive it:** the drop worth catching, the spread between subjects, the false alarm rate, and the group size. Fix any three of them plus a power target and `power.t.test` solves for the fourth.
- **Read `n` as per group, and round it up.** 36.3058 means 37 in each arm and 74 people in total.
- **Sample size moves with the square of the effect.** Chase something half as big and you need roughly four times the people.
- **Turn the question around when recruitment is capped.** Fix `n`, leave `delta` blank, and find out the smallest effect your study could ever detect. If that number is bigger than the effect you care about, you have your answer before you start.
- **Never compute power after the fact.** Report the confidence interval instead. Its width is the honest measure of what your study did and did not know.

---
title: "Confidence Intervals and P-Values Lesson 2: What a p-value is and is not"
catalog_blurb: "What a p-value actually tells you, and the three ways people usually misread it."
description: "A p-value is a tail probability under the null hypothesis, not the chance the null is true, not effect size, and not more convincing the smaller it gets."
keywords: "p-value, null hypothesis, hypothesis testing, statistical significance, effect size, type I error, false positive rate, binomial distribution, simulation, base rate, R"
post_type: "LESSON"
curriculum_id: "4.30.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "2"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: ""
course_prev: "What-a-Confidence-Interval-Promises.html"
---

=== step === cover
## What a p-value is and is not

Today let's understand what a p-value actually says, and what it does not, using a trading record that looks impressive on its own.

Jordan calls the next day's stock direction, up or down, for 20 trading days in a row, and gets 14 of them right. That's a 70% hit rate.

A pure guesser, someone with no real skill who just calls up or down at random, gets about half of the calls right on average, so 10 out of 20. But a pure guesser does not land on exactly 10 every single time. By chance alone, a run of guesses can land on 11, 13, or even higher. So "looks good" and "could not have happened by chance" are two different claims.

So here is the question this lesson answers: if Jordan were in fact a pure guesser with no skill at all, how often would 20 calls like that reach 14 correct or more, purely from chance? And once that number is in hand, what does it actually tell you, and what does it not?

Press Run below and see how often, out of many tries, a pure guesser's 20 calls reach 14 correct or more.

::widget luck-simulator {"trials":20,"p":0.5,"observed":14,"unit":"correct calls","seed":42}

Every bar in that chart is one pure guesser's run of 20 calls, and the question this whole lesson works out is how many of those bars reach as far as Jordan's 14.

=== step === concept
::prose-only restates the cover's numbers inside the null-hypothesis frame, no new visual needed
## Jordan's twenty calls, and what pure guessing would look like

Before you can say whether Jordan's 14 out of 20 is real skill, you have to be precise about what "no skill at all" would actually look like in this test. That precise statement is called the null hypothesis.

If Jordan has no skill at all, then every one of the 20 calls is right with probability 0.5, exactly like a fair coin toss, and one call's outcome has no bearing on the next. That is the null hypothesis for this test, written H0 and said out loud as "H naught": Jordan is a pure guesser, calling independently 20 times in a row. The alternative is that Jordan's true hit rate, the share of calls Jordan would get right over many more tries, actually sits above 0.5.

So the question from the opening page becomes precise: under H0 alone, with no real skill anywhere in the picture, how often would 20 calls land on 14 correct or more? Answering that question with an actual number starts with a simulation.

=== step === widget
## Simulating a thousand pure guessers

You already saw the simulator sitting idle on the cover. Now run it properly, not once, but many times, so you can count how often a pure guesser's luck alone reaches 14 or more.

Press Run a few thousand times and watch the share reaching 14 or more correct calls settle down.

::widget luck-simulator {"trials":20,"p":0.5,"observed":14,"unit":"correct calls","seed":42}

Run it enough times and the share of pure guessers reaching 14 or more correct calls settles in close to 5.8%, maybe 5.7% or 6.0% depending on how many times you ran it. That matches the exact figure you get from the binomial distribution, the distribution that describes exactly this kind of count: a fixed number of independent yes-or-no calls, each one right with the same probability.

R can compute that same figure exactly, without simulating anything.

```r
# Compute the exact probability of 14 or more correct calls under the null
n <- 20
x <- 14
p0 <- 0.5

p_exact <- pbinom(x - 1, n, p0, lower.tail = FALSE)
p_exact
#> [1] 0.05765915
```

`pbinom(x - 1, n, p0, lower.tail = FALSE)` adds up the probability of every count from `x` correct calls upward, out of `n` calls, when each call is right with probability `p0`. Here that is 14 and up, out of 20, at a probability of 0.5 per call. The result, 0.05765915, rounds to 0.0577, matching the simulation.

That counted proportion, the share of pure-luck outcomes that reach Jordan's result or beyond, has a name. It's called the p-value: the probability of a result this extreme or more, if the null hypothesis were true. For Jordan's test, the p-value is about 0.058, or 5.8%.

There's another way to see that same 5.8%, as the area under a smooth curve instead of a histogram's bars.

=== step === widget
## The same tail, drawn as a smooth curve

The histogram from the last step is one way to see the p-value: count bars. There's a second way that most statistical tests actually use underneath, a smooth curve instead of a jagged histogram.

A count like 14 out of 20 can be converted into a z-score, a single number that says how many standard deviations the result sits from what the null hypothesis expects. For a whole-number count like this one, the usual conversion includes a continuity correction, a small adjustment that lets a count sit more honestly on a smooth, continuous curve.

Here is that conversion for Jordan's 14 out of 20.

```r
# Convert Jordan's count to a continuity-corrected z-score
n <- 20
x <- 14
p0 <- 0.5

z_cc <- (x - 0.5 - n * p0) / sqrt(n * p0 * (1 - p0))
z_cc
#> [1] 1.565248
```

`n * p0` is 10, the number of correct calls a pure guesser expects on average out of 20. `x - 0.5 - n * p0` nudges the count halfway toward the curve before comparing it, and dividing by `sqrt(n * p0 * (1 - p0))` rescales that gap into standard-deviation units. The result, 1.565248, says Jordan's 14 correct calls sit about 1.57 standard deviations above the 10 a pure guesser would expect.

Here's that same 1.565 shown as a point on the smooth curve a pure guesser's results would follow, with the area beyond it shaded.

::widget null-distribution {"tails":1,"max":3.5,"start":1.565,"label":"observed z"}

That shaded area comes out to about 0.059, within rounding of both the simulated estimate from the histogram and the exact binomial figure, 0.0577, from the last step. Three different routes, the simulation, the exact binomial count, and this smooth-curve approximation, all land in the same place.

=== step === quiz
## Quick check: what p = 0.058 actually says

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 5.8% chance that Jordan is a pure guesser. ::no
- There is a 94.2% chance that Jordan has real stock-picking skill. ::no
- If Jordan were a pure guesser, a result of 14 correct calls out of 20 or more would happen about 5.8% of the time, from chance alone. ::ok Exactly right. The 5.8% sits entirely inside the pure-guesser world built in the last two steps. It never says anything about how likely Jordan is to actually have skill.
- Jordan's calls are right about 5.8% of the time. ::no All three of the wrong readings put the percentage somewhere it does not belong: on Jordan, on skill, or on the hit rate itself. A p-value only ever reports how often a result this extreme or more would turn up inside the pure-guesser world built by simulation, nothing else.

=== step === concept
## Not the probability the null is true, and not the probability it was luck

The p-value you just built, 0.058, already tells you something real: a pure guesser lands on 14 or more about 5.8% of the time. But two very common misreadings turn that fact into something else entirely, and both are worth taking apart with real numbers rather than just a warning.

The first misreading says: since p = 0.058 is small, there's only a small chance Jordan is a pure guesser. That puts a probability on Jordan, on the null hypothesis itself. But the simulation and the binomial figure from the last two steps never said anything about Jordan specifically. They said what a pure guesser's 20 calls would look like, nothing about how likely it is that Jordan, this one person, is a pure guesser.

To see why that gap matters, scale the question up. Picture 1,000 analysts tested the exact same way Jordan was. 100 of them are genuinely skilled, each one caught by the test about 80% of the time, the test's power. The other 900 have no real skill at all, pure guessers, and the test's own false-positive rate of 5% means 5% of them clear the bar purely by chance.

Count what that actually produces.

```r
# Count how many of the "significant" results are actually pure guessers
skilled <- 100
power <- 0.80
guessers <- 900
alpha <- 0.05

tp <- skilled * power
fp <- guessers * alpha
flagged <- tp + fp
guesser_share <- fp / flagged

tp
#> [1] 80
fp
#> [1] 45
flagged
#> [1] 125
guesser_share
#> [1] 0.36
```

`tp`, the true positives, is how many of the 100 genuinely skilled analysts the test actually catches: 80. `fp`, the false positives, is how many of the 900 pure guessers clear the 5% bar purely by chance: 45. Add those together and 125 analysts in total get flagged as significant. Of those 125, 45 are pure guessers, and 45 divided by 125 is 0.36, or 36%.

So more than a third of the analysts the test calls significant are pure guessers who got lucky, even though every single one of them individually shows p under 0.05. That 36% is not something any one p-value can ever report on its own. It depends entirely on how common real skill is among the 1,000 analysts tested, a fact the p-value has no way of knowing.

The second misreading is the mirror image of the first: p = 0.058 means there's a 94.2% chance the result was not luck. That is still a probability about the null, just computed the wrong way round. Nothing in the simulation or the 36% figure above tells you the chance that any one flagged result is luck rather than skill, only how the two groups mix together in aggregate.

=== step === concept
## Not a measure of effect size

A p-value answers one narrow question: how often would a result this extreme or more turn up under the null? It says nothing about how big the underlying effect actually is, and the easiest way to see that is to hold the effect fixed and change only the amount of data behind it.

Keep Jordan's hit rate fixed at exactly 70%, and imagine the same test run at three different sample sizes: 14 correct out of 20, 70 correct out of 100, and 700 correct out of 1000. All three represent the exact same 70% hit rate.

Compare the three p-values side by side.

```r
# Compare p-values for the same 70% hit rate at three sample sizes
p0 <- 0.5

ns <- c(20, 100, 1000)
xs <- c(14, 70, 700)

p_values <- sapply(seq_along(ns), function(i) {
  pbinom(xs[i] - 1, ns[i], p0, lower.tail = FALSE)
})

data.frame(n = ns, x = xs, p_value = p_values)
#>      n   x      p_value
#> 1   20  14 5.765915e-02
#> 2  100  70 3.925070e-05
#> 3 1000 700 8.832839e-38
```

Read down the `p_value` column. At n = 20, p is 0.058, matching Jordan's own result. At n = 100, the identical 70% hit rate gives p = 0.0000393. At n = 1000, it gives p = 8.8e-38, a number so small R writes it in scientific notation because ordinary decimal digits would run off the page.

Notice what changed between those three rows and what did not. The hit rate, the actual size of the effect, is 70% in every single row, and only n changed. So the p-value fell by more than 30 orders of magnitude for an effect that never moved at all. That is what it means to say a p-value is not a measure of effect size: it mixes together how big an effect is and how much data you collected to see it, and it cannot tell you which of the two did the work.

=== step === concept
::prose-only continues the previous step's table with no new computation; the three p-values already carry the point
## Why a smaller p past that point is not more convincing

Look again at the last two rows of that table: p = 0.0000393 at n = 100, and p = 8.8e-38 at n = 1000. Both of those already cleared the usual 0.05 threshold by an enormous margin at n = 100 alone. Moving to n = 1000 did not make the 70% hit rate any bigger, or any more certain to be above 50%. It only shrank the p-value by roughly 33 orders of magnitude, because more data makes any real effect, however large, easier to tell apart from pure chance.

So a p-value of 8.8e-38 is not stronger evidence of a bigger effect than p = 0.0000393. Both numbers are already far past the point where anyone would reject the null. Chasing a smaller p past that point tells you about the sample size, not about the size of the thing you are trying to measure.

What should go in a report instead? The hit rate itself, 70% in every one of these rows, or better still, a confidence interval around it. Those numbers carry the effect size. The p-value, on its own, never does.

=== step === quiz
## Quick check: comparing two significant results

A product team runs two separate studies. Study A tested 2,000,000 users and found a 0.1 percentage point lift, with p = 0.0001. Study B tested 40 reviewers and found a 15 percentage point lift, with p = 0.04. Which result is the stronger evidence of a change worth acting on?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Study A, because p = 0.0001 is a far smaller p-value than Study B's p = 0.04. ::no
- Study B, because a 15 percentage point lift is a far bigger effect than Study A's 0.1 percentage point lift, and Study A's tiny p-value mainly reflects its 2,000,000 users rather than a bigger effect. ::ok Exactly. A smaller p-value only tells you a result is unlikely under the null, and here it is unlikely mostly because Study A ran on 2,000,000 people. The 15-point lift in Study B is the number worth acting on.
- Study A, because its p-value of 0.0001 proves the null hypothesis is false. ::no
- Neither result means anything, because a p-value never tells you anything useful. ::no A p-value is not a stand-in for effect size, and it never proves anything false on its own, it only says how rare a result would be under the null. Here Study A's tiny p-value comes mostly from its huge sample, 2,000,000 users, while Study B's actual lift, 15 percentage points, is the number that would matter to a real decision.

=== step === tryit
## Your turn: compute the guesser share for a different split

Try the same arithmetic yourself, with a different mix of analysts. This time, among the same 1,000 analysts, suppose 300 are genuinely skilled, still caught 80% of the time, and 700 are pure guessers, still clearing the bar 5% of the time by chance. `power` and `alpha` from a few steps back are still 0.80 and 0.05.

```r
# Among the same 1,000 analysts, now 300 are genuinely skilled and
# 700 are pure guessers. power (0.80) and alpha (0.05) are already set.
# Set skilled2 <- 300 and guessers2 <- 700, then compute tp (skilled2 *
# power), fp (guessers2 * alpha), flagged (their sum), and
# guesser_share (fp / flagged), the same four steps as a few pages back.
# Six lines. Press Check when you have them.
```
::check {"regex": "700\\s*\\*\\s*alpha", "gate": true, "difficulty": "intermediate", "ok": "Right: 240 true positives, 35 false positives, 275 flagged in total, and a guesser share of 0.127, about 12.7%. That is down from 36% a few steps back, because real skill is now more common among the 1,000 analysts tested.", "no": "Reuse the same four lines from a few steps back: multiply 300 by power for the true positives, 700 by alpha for the false positives, add them for the total flagged, then divide the false positives by that total for the guesser share."}
::solution
```r
# Compute the guesser share for a different mix of skilled and guessing analysts
skilled2 <- 300
guessers2 <- 700

tp <- skilled2 * power
fp <- guessers2 * alpha
flagged <- tp + fp
guesser_share <- fp / flagged

tp
#> [1] 240
fp
#> [1] 35
flagged
#> [1] 275
guesser_share
#> [1] 0.1272727
```

Notice that Jordan's own p-value from a few steps back does not change no matter which of these two splits is actually true. A p-value never reports the mix of skilled analysts to guessers behind it, only how rare a result that size would be under the null. The 36% and the 12.7% are both facts about the population being tested, not about any single analyst's test result.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Wasserstein, R.L. and Lazar, N.A. (2016). The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108). The American Statistician, 70(2), 129-133. The six-principle statement the three misreadings in this lesson are drawn from.
- [Goodman, S. (2008). A Dirty Dozen: Twelve P-Value Misconceptions](https://doi.org/10.1053/j.seminhematol.2008.04.003). Seminars in Hematology, 45(3), 135-140. A longer catalog of misreadings beyond the three worked through here.
- [Greenland, S., Senn, S. J., Rothman, K. J., Carlin, J. B., Poole, C., Goodman, S. N., and Altman, D. G. (2016). Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3). European Journal of Epidemiology, 31(4), 337-350. Twenty-five misreadings catalogued and corrected one by one.
- [Nuzzo, R. (2014). Scientific method: Statistical errors](https://doi.org/10.1038/506150a). Nature, 506, 150-152. A widely read account of how routinely a p-value gets misread in published research.
- [Cohen, J. (1994). The Earth Is Round (p < .05)](https://doi.org/10.1037/0003-066X.49.12.997). American Psychologist, 49(12), 997-1003. A classic, forceful argument against leaning on significance testing alone.

=== step === complete
## What the p-value earns you, and what it does not

Jordan's 14 correct calls out of 20 gave a p-value of 0.058. That number says exactly one thing: a pure guesser, with no real skill at all, lands on 14 or more correct calls out of 20 about 5.8% of the time, purely from chance. Nothing stronger than that was ever claimed.

Three readings of that number fail, each in its own way. It is not the probability that the null hypothesis is true, or that Jordan's result was luck, the way the base-rate count among 1,000 analysts showed. It is not a measure of how big an effect is, the way the same 70% hit rate gave wildly different p-values at three different sample sizes. And a smaller p-value past the point of rejection is never stronger evidence of a bigger effect, it mostly just means more data went into the test.

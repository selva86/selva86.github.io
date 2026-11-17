---
title: "Confidence Intervals and P-Values Lesson 1: What a confidence interval promises"
catalog_blurb: "What the 95% on a confidence interval actually promises, and what it does not."
description: "A 95% confidence interval is not a 95% chance the truth is inside it. See what the 95% really promises, and check it with a coverage simulation you run."
keywords: "confidence interval, coverage, coverage probability, interval estimation, standard error, sampling distribution, z interval, t interval, bootstrap, confidence band, prediction band, R"
post_type: "LESSON"
curriculum_id: "4.30.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "1"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: "What-a-P-Value-Is-and-Is-Not.html"
course_prev: ""
---

=== step === cover
## What a confidence interval promises

Today let's understand what a 95% confidence interval actually promises, using an example where, for once, you get to know the real answer and check the promise against it.

Picture a help desk's ticket queue. Tickets never arrive on a tidy schedule, so what the team tracks is the gap, in minutes, between one ticket landing and the next. In real life you would never know this gap's true mean across every ticket that could ever arrive, and not knowing it is exactly why anyone builds a confidence interval in the first place. But to check whether a confidence interval's 95% label is honest, this lesson needs to know the real answer up front. So every ticket gap here is simulated from a population whose true mean is fixed at 1 minute, with most gaps short and a few running long: a skewed shape called an Exponential distribution, the same shape real waiting times and incomes often take.

Draw a small sample of 5 of those simulated gaps, and build the usual 95% confidence interval for the mean gap from that one sample. Now do that 60 times over, 60 fresh samples of 5 gaps each, 60 intervals. If the "95%" on the label means what it says, only about 3 of those 60 should miss the true mean of 1.

Here is what 60 of them actually look like.

::widget ci-coverage {"method":"z","parent":"skew","n":5}

50 of those 60 touch the true mean of 1. 10 miss it outright, and every interval was built the exact same honest way, with the exact same 95% formula. So what happened to the other 10? That is exactly what this lesson is about.

=== step === concept
## Building one confidence interval from one sample

Before asking what the 95% means, build one confidence interval the usual way, so there's something concrete to ask the question about.

Draw a single sample of 20 of the help desk's ticket gaps and press Run.

```r
# Draw one sample of 20 help-desk ticket gaps and build its 95% interval
set.seed(2026)
ticket_gaps <- rexp(20, rate = 1)

xbar <- mean(ticket_gaps)
se   <- sd(ticket_gaps) / sqrt(20)
ci   <- xbar + c(-1, 1) * 1.96 * se

round(c(xbar = xbar, se = se, lower = ci[1], upper = ci[2]), 4)
#>   xbar     se  lower  upper 
#> 1.6477 0.4039 0.8560 2.4394 
```

Four numbers came out of that, and each one has a name.

`xbar`, the sample mean, is the average of these particular 20 ticket gaps: 1.6477 minutes. It's one estimate of the true mean, built from just one sample, so it won't land exactly on the truth.

`se`, the standard error, is how much that sample mean would move around if you kept drawing fresh samples of 20 gaps and recomputing the mean each time: 0.4039 here, the sample's own spread shrunk down by the size of the sample.

The recipe behind a 95% confidence interval is simple: take the sample mean, then add and subtract a margin of error built from the standard error.

\[\bar{x} \pm 1.96 \times SE\]

The 1.96 comes from the normal distribution: it's the cutoff that leaves 2.5% in each tail, 95% in the middle. Multiplied by SE, it gives the margin of error, and the interval's two ends, 0.856 and 2.4394, are exactly xbar minus and plus that one margin: 2.4394 minus 1.6477 is 0.7917, the same margin on both sides.

As it happens, this particular interval does contain the true mean of 1. Worth noticing, because what that "95%" on the label actually buys you turns out to be narrower than it sounds.

=== step === concept
::prose-only the reasoning works directly off the interval's two endpoints already printed above; no new visual needed
## The misreading almost everyone starts with

Look at that interval again: 0.856 to 2.4394. It would be natural to say "there's a 95% probability the true mean falls inside this interval." Nearly everyone says exactly that the first time. But it isn't right, and seeing why matters more than memorising the fix.

Once xbar and se are computed from the sample of 20 gaps, the two endpoints of the interval, 0.856 and 2.4394, are fixed numbers. They don't move. The true mean, whatever it actually is, is also a fixed number, and it was fixed before anyone drew a single sample. So the true mean either sits between 0.856 and 2.4394, or it does not. There's no dice roll left to describe. A probability describes something that can still come out one way or another, and nothing about this interval is still undecided.

[KEY INSIGHT]
The 95% is not a property of this one interval. It is a property of the procedure that built it: draw a sample, compute xbar and se, add and subtract 1.96 times se. Run that procedure many times, on many fresh samples, and about 95% of the intervals it produces will contain the true mean. This interval is one outcome of that procedure, already decided, with no probability left to attach to it.

So the honest sentence does not describe this one interval at all. It describes what happens across many repeats of the whole recipe, sampling included. That's exactly the sentence the 60 ticket-gap intervals were built to test, and the 50-of-60 count is the proof of it.

=== step === quiz
## Quick check: which sentence about the interval is defensible

Three sentences, all about the same interval from a moment ago, 0.856 to 2.4394. Only one of them says what the 95% actually promises.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 95% probability that the true mean ticket gap lies inside this particular interval, 0.856 to 2.4394. ::no Not quite. Once the interval's two endpoints are computed from the sample, they are fixed numbers, and the true mean is a fixed number too, so there is no probability left to attach to this one interval.
- 95% of the ticket gaps in the sample of 20 fall inside this interval. ::no Not quite. This reading confuses the interval for the mean with the spread of the raw ticket gaps themselves, and the other common reading, that there is a 95% probability the truth lies in this one interval, is wrong too: once the interval is computed, its endpoints and the true mean are both fixed numbers, so there is no probability left to attach to it. The 95% belongs to the sampling-and-building procedure, run many times, not to this single result.
- If the sampling and interval-building were repeated many times, about 95% of the resulting intervals would contain the true mean. ::ok Right. The interval on the page is one outcome of a procedure. Run that procedure, drawing a fresh sample and building the interval the same way, many times over, and about 95% of the resulting intervals contain the true mean. That's exactly what the 60 intervals at the start of this lesson showed: 50 of 60 touching the true value.

=== step === widget
## Switching the method and the population

The same 60 samples from the start of this lesson can be run back through a different interval recipe, or through a different population, without redrawing anything. Switching either one isolates exactly what's responsible for the shortfall.

::widget ci-coverage {"method":"z","parent":"skew","n":5}

Switch the top toggle from the z interval to the bootstrap, keeping the skewed population and n = 5. The count drops to 48 of 60, no better than the z recipe's 50. Two different recipes, one built on the normal approximation, one built on resampling, and neither keeps its 95% promise on this population at this sample size.

Now switch the population toggle to the bell-shaped control instead, still at n = 5. Watch the count climb back up toward 60. On a population that actually looks like what the z formula assumes, the formula keeps its promise even at this small a sample size. The failure was never about a small sample on its own. It was about a small sample from a population whose shape the formula didn't expect.

Push the sample-size slider up with the skewed population selected again, and the shortfall shrinks without fully closing, climbing back toward 95% as n grows but never quite arriving within the 60 draws shown here. Press Run on the code beneath this widget to get exact numbers instead of a visual impression.

=== step === concept
::prose-only reading back the exact numbers the runnable code above already printed, instead of a new visual
## Quantifying the shortfall: running the check ten thousand times

60 samples is enough to see that something is wrong, but not enough to put a confident number on how wrong. The code you just ran repeats the same check 10,000 times instead of 60, for the z recipe and for a t recipe, at five different sample sizes. The t recipe uses the same formula as z, but with a cutoff slightly wider than 1.96, to pay for estimating the standard error from the sample itself rather than knowing it in advance.

On the skewed ticket-gap population, here's what came back for the z recipe: 80.9% coverage at n = 5, 87.1% at n = 10, 90.3% at n = 20, 92.4% at n = 40, and 93.6% at n = 80, climbing steadily but never touching the 95% on the label, even at the largest sample size tested.

The t recipe does a little better at every size: 88.4%, 90.6%, 91.8%, 93.2% and 93.6%, at those same five sample sizes. By n = 80 it has caught up with z exactly, because its cutoff has, by then, nearly closed in on 1.96 itself.

Run the same ten-thousand-repetition check on a bell-shaped population instead, and the t recipe sits at 94.8%, 95.1% and 95.2% for n = 5, 10 and 20, not climbing toward 95% but already there, from the smallest sample size shown.

[KEY INSIGHT]
The gap belongs to the population's skew, not to the sample size by itself. A small sample from a bell-shaped population is no problem for this formula. A small sample from a skewed population is, and growing the sample only closes the gap slowly.

=== step === tryit
## Your turn: check the coverage at a size not yet shown

The sweep above skipped straight from n = 10 to n = 20. Before running anything, guess where n = 15 should land on the z recipe, on that same skewed population. Then check it.

```r
# Reuse the coverage() recipe to check a sample size the sweep skipped
set.seed(1)

coverage <- function(n, reps = 10000, mu = 1, rule = "z") {
  hit <- replicate(reps, {
    x  <- rexp(n, rate = 1)
    se <- sd(x) / sqrt(n)
    k  <- if (rule == "z") 1.96 else qt(0.975, df = n - 1)
    ci <- mean(x) + c(-1, 1) * k * se
    ci[1] <= mu && mu <= ci[2]
  })
  mean(hit)
}

# Call coverage() to check n = 15 under the z recipe:

```
::check {"regex": "coverage[(]\\s*15\\s*,\\s*rule\\s*=\\s*\"z\"\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.893, almost exactly between the n = 10 value (0.871) and the n = 20 value (0.903) from the sweep above. The climb from one sample size to the next is smooth, not a jump.", "no": "Call the same function defined above, filling in 15 for n: coverage(15, rule = \"z\")"}
::solution
```r
# Check the coverage at n = 15 under the z recipe
coverage(15, rule = "z")
#> [1] 0.893
```

0.893, landing right between the n = 10 value of 0.871 and the n = 20 value of 0.903. The climb continues smoothly from one sample size to the next, because the same slowly-fading skew drives it at every size in between.

=== step === widget
## A confidence band is the same promise, drawn along a line

Everything so far has been about a single number, the mean ticket gap. The same 95% promise shows up again when the thing being estimated is not one number but a whole line, and it comes with a second band that is easy to confuse it with.

The widget below uses its own canned data, not the ticket gaps: points scattered around a straight line, with some noise added. Move the sample-size slider and watch two bands drawn around the fitted line.

::widget regression-intervals {}

The green band is the confidence band: a 95% interval for the true line's height, built fresh at every x value along the line. It is exactly the same kind of interval as the ticket-gap intervals, just computed once for every x instead of once for the whole sample. Push n up, and the green band collapses tightly onto the line, because more data pins down where the true line sits more precisely.

The orange band is a prediction band: an interval for where one new point might land, not for the line itself. Push n up here too, and the orange band barely moves. A new point's scatter around the line doesn't shrink just because the line has been measured more precisely. That scatter is set by the noise in the data, and more samples cannot undo noise that is already there.

[NOTE]
A confidence band answers "how well is the average known," and keeps shrinking as the data grows. A prediction band answers "where might one new case land," and stays about as wide as the data's own scatter, no matter how much data is added.

=== step === quiz
## Quick check: confidence band or prediction band?

Same question as before, now asked about the band instead of a single interval.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Under repeated sampling, about 95% of such confidence bands would contain the true line's height at that x, the same promise as the 60 ticket-gap intervals, now repeated along x. ::ok Right. A confidence band is the 60-ticket-gap promise, repeated at every x: a 95% interval for the true line's height there, so about 95% of such bands would contain it under repeated sampling.
- The confidence band is where 95% of the individual data points should fall. ::no Not quite. This confuses the confidence band with a statement about where the raw data points fall, rather than a statement about the true line's height.
- The confidence band stops narrowing past some sample size because the noise in the data sets a floor. ::no Not quite. This describes the PREDICTION band, which really does stop narrowing because it's floored by the scatter around the line. The CONFIDENCE band keeps narrowing as n grows, because it's about how precisely the line's own height is known, not about the data's spread.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Neyman, J. (1937). Outline of a theory of statistical estimation based on the classical theory of probability](https://doi.org/10.1098/rsta.1937.0005). Philosophical Transactions of the Royal Society A, 236, 333-380. The original paper that defined a confidence interval's guarantee as a property of repeated sampling, not of any one interval.
- [Hoekstra, R., Morey, R. D., Rouder, J. N., and Wagenmakers, E.-J. (2014). Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3). Psychonomic Bulletin and Review, 21(5), 1157-1164. Survey evidence that researchers and students read a single interval as a probability statement far more often than not.
- [Morey, R. D., Hoekstra, R., Rouder, J. N., Lee, M. D., and Wagenmakers, E.-J. (2016). The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8). Psychonomic Bulletin and Review, 23(1), 103-123. The exact misreading this lesson corrects, traced through where it comes from and why it persists.
- [Greenland, S., Senn, S. J., Rothman, K. J., Carlin, J. B., Poole, C., Goodman, S. N., and Altman, D. G. (2016). Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3). European Journal of Epidemiology, 31(4), 337-350. Catalogs this and related misinterpretations for applied researchers.
- [Casella, G. and Berger, R. L. (2002). Statistical Inference, 2nd edition](https://openlibrary.org/isbn/9780534243128). Duxbury. The formal treatment of interval estimation and coverage probability this lesson builds the intuition for.

=== step === complete
## Reporting a confidence interval so it survives a referee

Here's the sentence that survives contact with a careful reader, written the way you would actually report it.

"The 95% confidence interval for the mean ticket gap was 0.86 to 2.44 minutes. Under repeated sampling, about 95% of such intervals would contain the true mean."

Two sentences that sound almost the same get it wrong. "There is a 95% probability the true mean lies in this interval" puts a probability on a fixed interval that no longer has one to give. "The interval shows where 95% of the gaps fall" describes the raw data's spread, not where the mean sits. Only the first sentence says what was actually promised: not a fact about this one interval, but a fact about the procedure that built it.

The 60 intervals at the very start of this lesson are the worked proof of that sentence. 50 of them touched the true mean of 1. 10 of them didn't, not because anyone made a mistake, but because the 95% was never a promise about any one of those 60 intervals. It was a promise about the 60 of them together, and about every interval the same recipe would go on to build.

---
title: "What p-values mean"
slug: "Inference-Mini-2"
description: "A p-value is not the odds your result is noise. See what it truly measures with a real checkout test, then disprove the common misreading by simulation."
keywords: "p-value, p-value meaning, null hypothesis, statistical significance, false alarm rate, hypothesis testing in R, prop.test"
mathjax: true
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-1"
course_next: ""
curriculum_id: "0.0.2"
lesson_access: "windowed"
catalog_blurb: "What a p-value actually measures, and the mistake almost everyone makes reading it."
---

=== step === cover
## What p-values mean

A p-value is one of the most reported numbers in data work, and one of the least understood. This lesson works through one real test from beginning to end, so you know exactly what that number is telling you and what it is not.

An online store tests a new checkout page against its old one. Over one stretch, 2,000 visitors see the old page and 140 of them buy something, a rate of 7.0%. Another 2,000 visitors see the new page, and 178 buy, a rate of 8.9%. A statistical test comparing the two pages returns p = 0.03.

Here are those same counts, side by side.

::widget styled-table {"cols": ["page", "visitors", "buyers", "conversion rate"], "rows": [["Old page", 2000, 140, 0.07], ["New page", 2000, 178, 0.089]], "formats": {"conversion rate": "pct"}, "title": "Checkout page test, raw counts", "note": "2,000 visitors saw each page."}

That table holds everything the test saw: the visitors, the buyers, and the one p-value the comparison returned, 0.03.

=== step === concept
## The null hypothesis behind the checkout test

Before you can judge what p = 0.03 means, you need to state exactly what world it is being measured against. That world is called the null hypothesis, and it has to be stated precisely before anything else makes sense.

For this test, the null hypothesis says both pages truly convert at one shared rate, and the gap you saw is just an accident of which 2,000 visitors happened to land on which page. That shared rate is the pooled rate: every buyer from both pages, divided by every visitor from both pages.

Set up the counts and compute that pooled rate.

```r
# Set up the checkout counts and compute the pooled conversion rate
old_x <- 140; old_n <- 2000   # old page: 140 buyers out of 2,000 visitors
new_x <- 178; new_n <- 2000   # new page: 178 buyers out of 2,000 visitors
pooled_rate <- (old_x + new_x) / (old_n + new_n)
pooled_rate
#> [1] 0.0795
```

That pooled rate is 7.95%. Under the null hypothesis, that is the one true conversion rate for both pages, and the 7.0% and 8.9% you actually saw are just how that single rate happened to split across two separate batches of 2,000 visitors.

Now run the actual test on those same counts.

```r
# Run the two-proportion test on the checkout counts
prop.test(c(old_x, new_x), c(old_n, new_n))
#> 
#> 	2-sample test for equality of proportions with continuity correction
#> 
#> data:  c(old_x, new_x) out of c(old_n, new_n)
#> X-squared = 4.6768, df = 1, p-value = 0.03057
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.036256202 -0.001743798
#> sample estimates:
#> prop 1 prop 2 
#>  0.070  0.089 
```

The line to read is X-squared = 4.68, p-value = 0.03057. The test statistic, X-squared, measures how far the two observed rates sit from the pooled rate the null hypothesis assumes. Rounded, that p-value is 0.0306, matching the 0.03 you saw at the start.

=== step === widget
## What the shaded tail under the null actually shows

The X-squared statistic and its p-value are two views of the same picture: how far the observed gap sits from a world where nothing is going on. It helps to actually see that picture.

For a test comparing exactly two groups like this one, that X-squared statistic works out to exactly the square of a simpler, more familiar number: how many standard deviations the observed gap sits from zero, the point of no difference at all. The square root of 4.68 is about 2.16. Reading the tail area off a standard normal curve at that same distance out gives back the exact same p-value the test reported.

Drag the marker below and watch the shaded tail area, the p-value, change with it.

::widget null-distribution {"tails": 2, "max": 4, "start": 2.16, "label": "the observed gap, in standard deviations"}

Left where it starts, at 2.16, the shaded area reads about 0.031, the same story as the test's 0.0306. Push the marker further from zero and the shaded area shrinks, because a bigger gap is rarer under the null hypothesis. Pull it back toward zero and the shaded area grows, because a small gap is common when nothing real is going on.

=== step === concept
## Building that same 0.03 by simulation

The widget's curve is a mathematical shortcut. You can get to the same 0.03 without any curve at all, just by simulating the null hypothesis directly and counting.

Under the null hypothesis, both pages convert at the pooled rate, 7.95%. So build 10,000 pretend versions of this exact experiment. In each one, draw a pretend old page and a pretend new page, both from that same 7.95% rate, each with 2,000 visitors. Then count how many of those 10,000 pretend experiments produce a gap at least as large as the real one.

Compute the real gap first, then run the 10,000 pretend experiments.

```r
# Compute the real gap, then simulate 10,000 page-pairs under the pooled-rate null
obs_gap <- (new_x / new_n) - (old_x / old_n)
obs_gap
#> [1] 0.019

set.seed(1)
sim_diff <- replicate(10000, {
  sim_old <- rbinom(1, old_n, pooled_rate) / old_n   # a pretend old page at the pooled rate
  sim_new <- rbinom(1, new_n, pooled_rate) / new_n   # a pretend new page, same pooled rate
  sim_new - sim_old
})
sum(abs(sim_diff) >= abs(obs_gap))
#> [1] 296
mean(abs(sim_diff) >= abs(obs_gap))
#> [1] 0.0296
```

296 of the 10,000 pretend experiments produced a gap of 1.9 percentage points or more, which as a share is 0.0296. That is the same story as prop.test's 0.0306, this time built entirely from counting, with no formula at all.

[KEY INSIGHT] A p-value is nothing more than a count. Out of every pretend experiment where the null hypothesis is exactly true, it is the share that produces a gap at least this large.

=== step === quiz
## Quick check: what the shaded tail represents

Before moving on, check that the shaded tail and the 0.0296 you counted mean the same thing to you.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The shaded area is the chance the new page truly converts better than the old one. ::no
- The shaded area is how often a gap this large or larger would happen if both pages truly converted at the pooled 7.95% rate. ::ok Exactly. Both the widget and the 10,000 pretend experiments are answering that one question, nothing else.
- The shaded area is how much bigger the new page's conversion rate is than the old page's. ::no That describes the gap itself, not the p-value. The shaded area, and the 0.0296 you just counted, both answer one question only: how often a gap this size turns up if the pooled 7.95% rate is the one true rate for both pages.

=== step === concept
## The two probabilities people mix up

Here is where almost everyone gets p = 0.03 wrong, including plenty of people who use it every week. They read it as, there is a 3 percent chance the new page changed nothing. That is not what you computed.

::prose-only the point is a distinction between two conditional probabilities read in opposite directions; the next widget step proves it numerically

What you actually computed is \( P(\text{gap of 1.9 points or more} \mid H_0) \), the chance of seeing a gap this large, given that the null hypothesis, both pages truly converting at 7.95%, is true. The vertical bar is read as given that. What people want instead is the reverse, \( P(H_0 \mid \text{gap of 1.9 points or more}) \), the chance the null hypothesis is true, given the gap you actually saw. That is a different calculation, and the 10,000 pretend experiments you just ran never computed it.

A useful comparison: nearly every lottery jackpot winner bought a ticket, so the chance of holding a ticket, given that you won, is close to certain. But hardly anyone who buys a ticket wins the jackpot, so the chance of winning, given that you hold a ticket, is close to zero. Knowing one direction of a conditional probability tells you almost nothing about the other direction.

[KEY INSIGHT] p = 0.03 is \( P(\text{gap of 1.9 points or more} \mid H_0) \). It is never \( P(H_0 \mid \text{gap of 1.9 points or more}) \). Confusing those two is exactly what "there's a 3 percent chance it was chance" gets wrong.

=== step === widget
## Simulating ten thousand tests where nothing changed

That last claim was made in words. Here is the proof in numbers.

Build 10,000 separate checkout tests. In every single one, both the old page and the new page are drawn from the exact same pooled rate, 7.95%, so the null hypothesis is true by construction, not just assumed. Run the real prop.test on each of those 10,000 pretend tests, and count how many still come back with p below 0.05.

Run that simulation.

```r
# Simulate 10,000 checkout tests where the null hypothesis is true every single time
set.seed(1)
sim_p <- replicate(10000, {
  sim_old_x <- rbinom(1, old_n, pooled_rate)
  sim_new_x <- rbinom(1, new_n, pooled_rate)
  prop.test(c(sim_new_x, sim_old_x), c(new_n, old_n))$p.value
})
sum(sim_p < 0.05)
#> [1] 457
mean(sim_p < 0.05)
#> [1] 0.0457
```

457 of those 10,000 tests, 4.57%, crossed p below 0.05 anyway, even though the null hypothesis was true every single time by construction. That is called a false alarm, a test crossing the cutoff on data where the null was true all along. If p = 0.03 really meant a 3 percent chance the null is true, this experiment should have produced almost none. Instead it produced them at almost exactly the rate a 0.05 cutoff is built to let through.

See it happen live. Press a button below and watch the tally build.

::widget luck-simulator {"trials": 1, "p": 0.0457, "observed": 1, "unit": "false alarms", "seed": 5}

Each press below stands for one more repeat of that same experiment, one where the null hypothesis is true every time, and 4.57% is the exact rate you just found. Run it a few hundred times and watch the running share settle in right around that number.

[KEY INSIGHT] A null hypothesis that is true 10,000 times out of 10,000 still produces a p-value under 0.05 about 457 times. A p-value below 0.05 is not proof the null is false, it is exactly what a 5 percent false alarm rate looks like.

=== step === concept
## What p = 0.03 really says, and does not say

You now have everything you need to state p = 0.03 correctly, and to see exactly where the common misreading breaks.

Here is what it says. If both pages truly convert at the same pooled rate, 7.95%, a gap of 1.9 points or more between two 2,000 visitor samples turns up about 3 times in every 100 such tests, from sampling alone.

Here is what it does not say. It does not say there is a 3 percent chance the new page is genuinely better, and it does not say there is a 97 percent chance it works. You already proved why: a null hypothesis that is true every single time still crosses p below 0.05 about 4.57% of the time, which is close to but not the same number as 0.0306.

Put the test's own p-value and that false alarm rate side by side.

```r
# Compare the test's own p-value with the null-true false-alarm rate
c(test_p = round(prop.test(c(old_x, new_x), c(old_n, new_n))$p.value, 4),
  false_alarm_rate = round(mean(sim_p < 0.05), 4))
#>           test_p false_alarm_rate 
#>           0.0306           0.0457 
```

0.0306 and 0.0457 are close because both come from the same pooled rate and the same sample sizes, but they answer two different questions. 0.0306 is how rare this specific 1.9 point gap is under the null hypothesis. 0.0457 is how often the 0.05 cutoff misfires across many null-true tests in general. Neither one is the chance the null hypothesis is true.

=== step === quiz
## Quick check: a new quarter, a new p-value

Try applying all of this to a fresh number. The store reruns the checkout test the following quarter and gets p = 0.20. A colleague says there is a 20 percent chance the new page does not help. Which reading is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 20 percent chance the new page truly changed nothing. ::no
- If the new page truly changed nothing, a gap this size or bigger would still turn up in about 20 percent of tests. ::ok Right. Same rule as before, applied to a new number: p always answers how often the data would look this way under the null hypothesis, never how likely the null itself is.
- This quarter's improvement is about 20 percent smaller than last quarter's. ::no p = 0.20 says nothing about how big the improvement was this quarter, only about how often a gap like it would appear under the null hypothesis. It is not a percentage chance the null is true, and it is not a measure of how big the effect is.

=== step === tryit
## Your turn: tighten the cutoff

sim_p still holds those 10,000 p-values from tests where the null hypothesis was true every time. You already found that a 0.05 cutoff misfires 4.57% of the time. Now try a stricter cutoff, 0.01, and see whether it misfires less.

Recompute the false alarm rate using 0.01 instead of 0.05.

```r
# sim_p holds 10,000 p-values from tests where the null hypothesis
# was true every single time.
# Recompute the false-alarm rate using 0.01 as the cutoff instead of 0.05.
# One line. Press Check when you have it.
```
::check {"regex": "mean[(]sim_p\\s*<\\s*0?\\.01[)]", "gate": true, "difficulty": "beginner", "ok": "Right: 89 out of 10,000, a false alarm rate of 0.0089. A stricter cutoff means fewer false alarms, because you are only willing to accept a rarer coincidence before calling something significant.", "no": "Reuse the counting line from a few steps back and swap the cutoff: mean(sim_p < 0.01)."}
::solution
```r
# Recompute the false-alarm rate at a stricter 0.01 cutoff
sum(sim_p < 0.01)
#> [1] 89
mean(sim_p < 0.01)
#> [1] 0.0089
```

=== step === concept
## References

Sources behind the ideas in this lesson.

- [The ASA Statement on Statistical Significance and p-Values](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein, R.L. & Lazar, N.A. (2016), The American Statistician 70(2). The statistical association's own six principles on what a p-value does and does not measure.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland, S. et al. (2016), European Journal of Epidemiology 31. Twenty five common misreadings of p-values, catalogued and corrected one by one.
- [A Dirty Dozen: Twelve P-Value Misconceptions](https://doi.org/10.1053/j.seminhematol.2008.04.003) - Goodman, S. (2008), Seminars in Hematology 45(3). Twelve of the most common ways p-values get misread in practice.
- [Scientific method: statistical errors](https://doi.org/10.1038/506150a) - Nuzzo, R. (2014), Nature 506. A widely read account of how often the reversed probability mistake shows up in published research.
- [The Earth Is Round (p < .05)](https://doi.org/10.1037/0003-066X.49.12.997) - Cohen, J. (1994), American Psychologist 49(12). An early, influential case against over relying on the 0.05 cutoff.

=== step === complete
## Wrapping up: reading a p-value correctly

You built p = 0.03 twice: once from prop.test, and once by literally counting 296 out of 10,000 pretend experiments where the pooled rate was the one true rate for both pages. Both landed in the same place, about 3 in 100.

You then proved the common misreading wrong with numbers, not just words. 10,000 tests where the null hypothesis was true every single time still crossed the 0.05 cutoff 457 times, 4.57% of them. That is what a false alarm rate looks like, not what "the null is probably false" looks like.

So the next time a test hands you p = 0.03, read it the way you now know is correct: if nothing were really going on, a result this good would still show up about 3 times in 100. Nothing more, and nothing less.

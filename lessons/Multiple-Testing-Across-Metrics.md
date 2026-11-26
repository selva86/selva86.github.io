---
title: "Product Metric Design Lesson 5: Multiple Testing Across Metrics"
catalog_blurb: "How checking several metrics at once inflates your false-alarm risk, and the fix."
description: "Loop checks 3 guardrails and false-alarms 14% of the time by chance alone. Learn the family-wise error rate, then fix it with Bonferroni and Holm's method."
keywords: "multiple testing, family-wise error rate, Bonferroni correction, Holm's method, guardrail metrics, p-value threshold, multiple comparisons problem, p.adjust, A/B testing, product metrics"
post_type: "LESSON"
curriculum_id: "3.20.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "5"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Proxy-Metrics-and-Surrogacy.html"
course_prev: "Goodharts-Law-and-Metric-Gaming.html"
---

=== step === cover
## Multiple Testing Across Metrics

Today let's understand why checking several metrics at once raises your odds of a false alarm, even when every single metric is tested fairly.

Loop, a grocery delivery app, is testing a new checkout flow before it ships. The team checks the new flow against 3 guardrails: page load time, checkout error rate, and support contacts. Each guardrail gets its own statistical test, and each test uses the usual 5% significance threshold, written alpha = 0.05.

Here is the part that catches most teams off guard. Even if the new flow changes nothing at all, not page load time, not error rate, not support contacts, the chance that at least one of those 3 tests still comes back significant by pure chance is not 5%. It is 14.3%.

Below is a simulation of exactly that: thousands of launches where the flow truly changes nothing, run against this same family of 3 guardrails.

::widget multiplicity-sim {"kMax": 3, "kStart": 3, "alpha": 0.05, "nStudies": 4000, "corrections": ["none"], "seed": 29, "study": 1}

Each of those 3 guardrails is still individually fair at 5%. So why does the chart above already show a false-alarm rate so much higher than that?

=== step === concept
## What a 5% threshold actually guarantees for one guardrail

Before asking why 3 guardrails together produce a 14.3% false-alarm rate, it helps to be precise about what a single 5% threshold guarantees on its own.

Take just one of Loop's guardrails: checkout error rate. The team runs a statistical test comparing the error rate under the new flow against the error rate under the old one. That test produces a z-statistic, a number that measures how far the two error rates sit apart, measured in standard errors. The test rejects, and calls the guardrail significant, whenever that z-statistic clears 1.96 in either direction, which is exactly the point where the two-sided p-value crosses below 0.05.

A 5% threshold means exactly this: if checkout error rate truly did not change under the new flow, a z-statistic this far from zero would still turn up by pure chance in 5% of all tests. Nothing more, nothing less. It says nothing about the other 2 guardrails, because it was never testing them.

Drag the marker below and watch the p-value cross 0.05 right at a z of 1.96.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.0, "label": "checkout error rate guardrail, z-statistic"}

At z = 1.96, the shaded tail is exactly 5% of the curve. That 5%, and only that 5%, is what alpha = 0.05 guarantees for checkout error rate's own test, on its own.

=== step === concept
## Three guardrails, three independent tests: the 14.3% by hand

Now add the other 2 guardrails back in, and ask the question Loop actually cares about: not whether one particular guardrail flags a false alarm, but whether any of the 3 does.

Assume, for a moment, that the new checkout flow truly changes nothing on any of the 3 guardrails. Each test still has a 5% chance of a false alarm, on its own. If the 3 tests are independent, the chance that every single one of them avoids a false alarm is 0.95 multiplied by itself 3 times.

\(P(\text{no false alarm on any guardrail}) = (1 - 0.05)^3 = 0.857\)

The chance of at least one false alarm is the complement of that: 1 minus 0.857.

\(P(\text{at least one false alarm}) = 1 - (1 - 0.05)^3 = 0.143\)

0.143. That is the same 14.3% the simulation already showed.

Here is a shortcut that makes checking this by simulation simple. Whenever a test's null hypothesis is actually true, its p-value is not a fixed outcome, it is a value drawn uniformly at random between 0 and 1. That is exactly what `runif()` draws, so simulating 3 null p-values for Loop's 3 guardrails is as simple as drawing 3 uniform random numbers.

```r
# Compute the 14.3% false-alarm chance by hand, then look at one concrete draw of 3 null p-values
guardrails <- c("page load time", "checkout error rate", "support contacts")
alpha <- 0.05
k <- length(guardrails)

p_at_least_one <- 1 - (1 - alpha)^k
round(p_at_least_one, 4)
#> [1] 0.1426

# One simulated study: draw a p-value for each guardrail, assuming none of them actually changed
set.seed(11)
p3 <- runif(k)
names(p3) <- guardrails
round(p3, 4)
#>      page load time checkout error rate    support contacts 
#>              0.2772              0.0005              0.5106 
```

Look at the 3 numbers. page load time came back at 0.2772 and support contacts at 0.5106, both comfortably above 0.05. But checkout error rate came back at 0.0005, far below 0.05, even though nothing about checkout error rate actually changed. That is a false alarm, and it happened in this one simulated study by chance alone.

One study only shows that a false alarm can happen. Running 4000 studies shows how often it actually does.

```r
# Repeat that draw over 4000 studies and check how often at least one guardrail flags a false alarm
set.seed(11)
false_alarm <- replicate(4000, min(runif(3)) < 0.05)
round(mean(false_alarm), 4)
#> [1] 0.138
```

`min(runif(3)) < 0.05` is TRUE exactly when at least one of the 3 simulated p-values falls under 0.05, which is a false alarm somewhere in that study. Across 4000 such studies, 13.8% had at least one, close to the 14.3% the formula predicts. The small gap is just simulation noise: run it with a different seed and the share lands somewhere else near 14.3%, never anywhere close to 5%.

=== step === widget
## Watching the false-alarm rate climb past ten guardrails

3 guardrails already push the false-alarm rate to 14.3%. Loop's launch review is not stuck at 3 guardrails forever, so it is worth seeing where that number goes as more join the family.

::widget multiplicity-sim {"kMax": 25, "kStart": 3, "alpha": 0.05, "nStudies": 4000, "corrections": ["none"], "seed": 29, "study": 1}

Drag k from 1 up to 25. At k = 10, the simulated rate reads about 40.1%, matching 1 minus 0.95 raised to the 10th power. Keep dragging to k = 25, and the rate climbs to about 72.3%, the same formula with k = 25.

That is not a rare edge case for a growing company. A launch review that tracks 10 metrics, or a company-wide dashboard with 25, is an ordinary size for many teams, and at that size, a false alarm somewhere in the family is more likely than not, even when nothing anywhere actually changed.

=== step === concept
## Family-wise error: why several correct tests still produce a false alarm

Every one of Loop's 3 tests is still perfectly calibrated. Checkout error rate's own test still has exactly a 5% chance of a false alarm, and so do the other 2. Nothing about any single test's own error rate changed just because 2 more guardrails joined it.

What changed is a different quantity: the family-wise error rate, the chance that at least one test out of the whole family comes back a false alarm. That is not the same number as any one test's own error rate, and it climbs every time another guardrail joins the family, because there are now more chances for pure luck to produce one flag somewhere.

| Guardrails in the family (k) | Family-wise error rate |
|---|---|
| 1 | 5.0% |
| 3 | 14.3% |
| 10 | 40.1% |
| 25 | 72.3% |

Read the table a column at a time. The left column is just how many tests sit in the family. The right column is 1 minus 0.95 raised to that power, and it climbs steeply: tripling the family from 1 test to 3 more than doubles the false-alarm risk, and by 25 tests, the family is more likely than not to produce a false alarm somewhere.

This is not 3 broken tests, or 25 broken tests. Each one, taken alone, still does exactly what a 5% threshold guarantees. The risk comes entirely from counting a hit anywhere in the family, which is a different question than any single test was ever built to answer.

=== step === concept
## Bonferroni: dividing the risk across the family

If testing 3 guardrails at 5% each produces a 14.3% family-wise error rate, the fix has to tighten the bar each test is held to, not leave it at 5% and hope.

Bonferroni's fix is the simplest one. Instead of testing each guardrail against alpha, test it against alpha divided by k, the number of tests in the family.

\(\text{Bonferroni threshold} = \dfrac{\alpha}{k}\)

For Loop's 3 guardrails, that is 0.05 divided by 3.

```r
# Compute Bonferroni's per-test threshold, then apply it to that same study's 3 p-values
alpha <- 0.05
k <- 3
bonferroni_alpha <- alpha / k
round(bonferroni_alpha, 4)
#> [1] 0.0167

set.seed(11)
p3 <- runif(k)
names(p3) <- c("page load time", "checkout error rate", "support contacts")
p3_adjusted <- p.adjust(p3, method = "bonferroni")
round(rbind(raw = p3, bonferroni = p3_adjusted), 4)
#>            page load time checkout error rate support contacts
#> raw                0.2772              0.0005           0.5106
#> bonferroni         0.8317              0.0016           1.0000
```

0.0167 is the new bar. Each guardrail now has to clear that, not 0.05.

Look at what that does to the same study from the last step. checkout error rate's raw p-value, 0.0005, still clears 0.0167 easily, so that guardrail still flags, correctly, since it genuinely was a false alarm in this simulated study. But page load time's raw p-value, 0.2772, is nowhere near either bar, and support contacts, at 0.5106, is not close either.

`p.adjust(method = "bonferroni")` reaches the same verdict a different way. Instead of shrinking the bar, it stretches the p-values themselves, multiplying each one by k and capping the result at 1, so you can keep comparing everything against the familiar 0.05. Either way, only checkout error rate crosses the line.

=== step === widget
## Turning the correction on: the rate falls back near 5%

The curve climbed to about 72.3% by the time the family reached 25 guardrails. Now watch the fix applied to that exact curve.

::widget multiplicity-sim {"kMax": 25, "kStart": 25, "alpha": 0.05, "nStudies": 4000, "corrections": ["none", "bonferroni", "holm"], "seed": 29, "study": 1}

The widget starts at k = 25, the worst point on the curve. With no correction, the simulated rate sits at about 72.3%, matching what you read off earlier. Switch to Bonferroni, and the rate collapses to about 5%, right back to where a single test's own threshold started. Switch to Holm instead, and the rate lands in the same place.

That last part is not a coincidence. When nothing in the family is real, which is exactly the setup this widget simulates, Bonferroni and Holm reject under the identical condition: the smallest of the k p-values has to clear alpha divided by k. Neither method can tell the difference yet, because neither one has seen a guardrail that is actually broken.

=== step === concept
## Holm's step-down: the same protection, a little more power

Bonferroni treats every test in the family exactly the same: divide alpha by k, and hold every single test to that one flat bar. Holm's step-down method starts from the same idea, but it does not stop there.

Holm sorts the k p-values from smallest to largest. It compares the smallest one to alpha divided by k, exactly Bonferroni's own bar. If that one clears it, Holm moves to the second-smallest and compares it to alpha divided by (k minus 1), a slightly looser bar, since one test has already been accounted for. It keeps loosening the bar, one step at a time, for every p-value that clears the one before it.

\(\text{Holm's i-th comparison} = \dfrac{\alpha}{k - i + 1}\)

Try it on 5 illustrative p-values from a family of unrelated tests, just numbers chosen to show where the 2 methods actually part ways.

```r
# Compare Bonferroni and Holm on the same 5 illustrative p-values
five_p <- c(0.008, 0.012, 0.03, 0.04, 0.2)
bonferroni_p <- p.adjust(five_p, method = "bonferroni")
holm_p <- p.adjust(five_p, method = "holm")
round(rbind(raw = five_p, bonferroni = bonferroni_p, holm = holm_p), 4)
#>             [,1]  [,2] [,3] [,4] [,5]
#> raw        0.008 0.012 0.03 0.04  0.2
#> bonferroni 0.040 0.060 0.15 0.20  1.0
#> holm       0.040 0.048 0.09 0.09  0.2
```

Compare the two bottom rows against 0.05. Bonferroni's adjusted value for the second p-value is 0.06, just over 0.05, so it does not reject. Holm's adjusted value for that same p-value is 0.048, just under 0.05, so it does. Bonferroni rejects only 1 of the 5, while Holm rejects 2.

That difference comes from the bar each method tests against for the second-smallest p-value. Bonferroni divides alpha by k for every single one of the 5, so its bar never loosens: alpha divided by 5 is 0.01, for all of them. Holm only applies that same tight bar to the smallest p-value. Once that one clears it, Holm compares the next smallest against alpha divided by (k minus 1), which here is alpha divided by 4, or 0.0125, looser than Bonferroni's flat 0.01. 0.012 clears 0.0125, so Holm rejects it too.

That extra rejection is where Holm's "a little more power" comes from, but it only shows up once something in the family is real enough to produce a genuinely small p-value. Go back to a family where every null is true, exactly what the widget a step back simulated. There, the smallest p-value either clears alpha divided by k or it does not, and that first comparison is identical for both methods. If it fails, neither method rejects anything at all, so under a true global null, Bonferroni and Holm land on exactly the same family-wise error rate, which is why switching to Holm in that widget read the same close-to-5% number as Bonferroni.

=== step === concept
## Choosing the family: which metrics get corrected together

Every example so far assumed Loop's 3 guardrails belong together in one family. That was not an accident, and it is worth being precise about what puts tests in the same family in the first place.

::prose-only states the rule for what belongs in a family, then applies it to 2 contrasting scenarios against the table from a few steps back

A family is the set of tests that all feed one launch decision. Loop's page load time, checkout error rate, and support contacts guardrails all gate the same decision: whether this one checkout flow ships. That is why all 3 correct together, and why the family-wise error rate that matters is computed across exactly those 3, and nothing else.

Contrast that with a different team at Loop running an unrelated experiment on, say, the search results page, in that same week. That team's test also runs at alpha = 0.05, and it also carries its own 5% false-alarm risk, on its own. But it does not join the checkout flow's family, because it is not deciding whether the checkout flow ships. Correcting the checkout guardrails against the search team's test would answer a question nobody asked.

Now stretch the other direction. A company that reviews 25 metrics across every team's dashboard in one sitting, in order to decide something about the business overall, counts as one large family for that sitting, which is exactly why that count reached the 72.3% row in the earlier table. The question to ask is never how many metrics exist somewhere in the company. It is how many of them feed the specific decision actually being made right now.

=== step === quiz
## Quick check: reading the false-alarm rate correctly

Loop's launch is backed by 3 guardrails, each tested at the usual 5% threshold, and none of them actually changed under the new checkout flow. How often does at least one of the 3 look significant anyway, by pure chance?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- About 5%, since each guardrail was tested at the usual 5% threshold. ::no
- About 14%, since the chance of at least one false alarm across 3 independent 5% tests is 1 minus 0.95 cubed. ::ok Right. Each guardrail is still individually fair at 5%, but the family of 3 tests has a 1 - 0.95^3 = 14.3% chance that at least one of them flags by pure chance, exactly what the earlier simulation showed.
- About 40%, since that is the rate once the family grows to 10 guardrails. ::no
- About 95%, since that is 1 minus the per-test error rate. ::no None of those numbers answer this question. 5% is the rate for one guardrail's own test, not the family of 3. 40% is the rate once the family grows to 10 guardrails, which this one has not. And 95% comes from inverting the wrong probability: it is the chance of no false alarm on a single test, not the chance of at least one across the family. The right answer, about 14%, comes from 1 minus 0.95 cubed.

=== step === tryit
## Your turn: scaling the family to 8 guardrails

Loop decides to add 5 more guardrails to this launch decision, 8 in total. Work out both numbers for a family that size: the uncorrected chance of at least one false alarm under the null, and the Bonferroni-corrected threshold each test would need to clear instead.

```r
# Compute both the uncorrected and the Bonferroni-corrected risk for Loop's family of guardrails
alpha <- 0.05
k <- 3

p_at_least_one <- 1 - (1 - alpha)^k
bonferroni_alpha <- alpha / k
round(c(p_at_least_one = p_at_least_one, bonferroni_alpha = bonferroni_alpha), 4)
```

Change `k <- 3` to `k <- 8` above and run it again.
::check {"regex": "k\\s*<-\\s*8", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.3366 and 0.0063. With 8 guardrails in the family, the uncorrected chance of at least one false alarm climbs to about 33.7%, and Bonferroni's threshold tightens from 0.0167 to 0.05 / 8 = 0.0063.", "no": "Change the line k <- 3 to k <- 8, then run the block again."}
::solution
```r
# Same two formulas, with k changed from 3 to 8
alpha <- 0.05
k <- 8

p_at_least_one <- 1 - (1 - alpha)^k
bonferroni_alpha <- alpha / k
round(c(p_at_least_one = p_at_least_one, bonferroni_alpha = bonferroni_alpha), 4)
#>   p_at_least_one bonferroni_alpha 
#>           0.3366           0.0063 
```

Eight guardrails push the uncorrected false-alarm chance to about 33.7%, and Bonferroni's bar tightens to 0.0063. The pattern holds at any size: more guardrails means more uncorrected risk, and a correspondingly tighter bar to hold each one to.

=== step === concept
## References
::prose-only the references are text, not a visual

- Holm, S. (1979). [A Simple Sequentially Rejective Multiple Test Procedure](https://www.jstor.org/stable/4615733). Scandinavian Journal of Statistics, 6(2), 65 to 70. The step-down procedure this lesson teaches alongside Bonferroni.
- Dunn, O. J. (1961). [Multiple Comparisons Among Means](https://www.jstor.org/stable/2282330). Journal of the American Statistical Association, 56(293), 52 to 64. The paper behind the per-test alpha divided by k threshold commonly credited to Bonferroni.
- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. On guardrail metrics and why a family of them needs correcting together.
- R Core Team. [stats::p.adjust() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html). Bonferroni, Holm, and the other p-value adjustment methods used in this lesson.

=== step === complete
## Quick recap

Loop's 3 guardrails, page load time, checkout error rate, and support contacts, each ran at the usual 5% threshold. But even if the new checkout flow changed nothing at all, the chance that at least one of those 3 tests flagged anyway was 14.3%, not 5%, and that chance kept climbing with every guardrail added: about 40.1% at 10, about 72.3% at 25.

That climbing number has a name: the family-wise error rate, the chance of at least one false alarm across a whole family of tests, even though every single test in that family is individually fair.

The fix is to hold each guardrail to a tighter bar than 0.05. Bonferroni divides alpha by k, the number of tests in the family, so Loop's 3 guardrails each had to clear 0.05 divided by 3, or 0.0167, instead of 0.05. Holm's step-down gives the exact same protection when nothing in the family is real, and rejects a little more once some of the effects are, because its later comparisons use a looser bar than Bonferroni's flat one.

One more thing decides whether any of this applies: the family only includes the tests behind one launch decision. Loop's 3 guardrails correct together because they all gate the same checkout flow. A different team's unrelated experiment that same week does not join that family, even though it also runs at 5%.
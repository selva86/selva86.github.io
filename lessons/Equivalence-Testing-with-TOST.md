---
title: "Choosing Statistical Tests Lesson 6: Equivalence testing with TOST"
catalog_blurb: "Why a non-significant test doesn't prove two things are the same."
description: "A one-week test gives p = 0.738, proving nothing. TOST runs two one-sided tests against a fixed margin to show when a difference is small enough to ignore."
keywords: "TOST, equivalence testing, two one-sided tests, equivalence margin, non-significant result, power.t.test, sample size for equivalence testing, statistical equivalence, R"
post_type: "LESSON"
curriculum_id: "4.40.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "6"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: ""
course_prev: "Reporting-Effect-Size-Not-Just-Significance.html"
---

=== step === cover
## Equivalence testing with TOST

Today let's understand equivalence testing with TOST, step by step and on one real example.

TechCo runs a recommendation algorithm, algorithm A, on its product page. A new, cheaper algorithm, algorithm B, is ready to take its place, but only if it does not change how long a visitor spends on a session by more than half a minute either way. That half minute is the equivalence margin, and TechCo fixed it before looking at any data: a shift smaller than that is close enough to not matter, a shift bigger than that is not.

Here's the problem: an ordinary test tells you whether A and B are different. It does not tell you whether they are the same, or close enough to it. A non-significant result does not mean equivalence. It might just mean there is not yet enough data to tell the difference apart.

Equivalence testing is the separate method built to answer that question directly. It runs two one-sided tests against the margin, which is why it is called TOST, short for Two One-Sided Tests.

Here is the whole flow in three steps.

::widget process-flow {"steps":[{"title":"Fix the margin first","sub":"agree how small a difference has to be to count as the same, before any data are seen"},{"title":"Run two one-sided tests","sub":"test that the true difference is not below the margin, and test that it is not above it"},{"title":"Read one of four outcomes","sub":"equivalent, not equivalent, significant but trivial, or genuinely inconclusive"}]}

Everything from here on works through those three steps on TechCo's own data, and shows exactly how each of those four outcomes can come about.

=== step === concept
## Why a non-significant test doesn't prove two things are the same

TechCo's test has been running for a week. Fifty visitors have been randomised to algorithm A and fifty to algorithm B, and the obvious first move is to run an ordinary t-test on their session durations.

```r
# Draw the ongoing test's data: average session duration in minutes, algorithm A vs algorithm B
set.seed(123)
A_full <- rnorm(800, mean = 18, sd = 4)
B_full <- rnorm(800, mean = 17.9, sd = 4)

# Look at just the first 50 sessions per arm, one week into the test
A_week <- A_full[1:50]
B_week <- B_full[1:50]
week_test <- t.test(A_week, B_week)
week_diff <- mean(A_week) - mean(B_week)
round(week_diff, 2)
round(week_test$p.value, 3)
round(as.numeric(week_test$conf.int), 2)
#> [1] 0.26
#> [1] 0.738
#> [1] -1.29  1.82
```

A averages 0.26 minutes longer than B in this sample, and the t-test gives p = 0.738, nowhere near the usual 0.05 cutoff. So by the ordinary rule, there is no statistically significant difference between A and B.

But look at the 95% confidence interval: -1.29 to 1.82 minutes. That is the range of true differences between A and B that this data cannot rule out. It includes 0, no difference at all, but it also includes 1.82, more than three times TechCo's 0.5-minute margin.

A non-significant p-value only says this data could not detect a difference. It never says there is no difference, and this interval is the proof: a genuinely large difference is still sitting inside it, completely unruled out.

[NOTE]
With only fifty visitors per arm, one week into the test, this data has not yet gathered enough evidence to say anything about whether A and B are close enough to treat as the same.

=== step === concept
## Setting up and running the two one-sided tests

The margin is fixed before any data are looked at: TechCo already decided that a shift of up to 0.5 minutes, in either direction, counts as close enough to the same. TOST checks that margin with two separate one-sided tests, run on the same data.

The first test rules out the possibility that B is slower than A by more than the margin. Its null hypothesis is that the true difference is -0.5 minutes or smaller, against the alternative that it is bigger than that. The second test rules out the opposite: its null is that the true difference is 0.5 minutes or bigger, against the alternative that it is smaller.

Equivalence only gets declared when both of these one-sided tests reject their null at the usual 0.05 level. Because both have to reject together, running each of them at 0.05 keeps the overall chance of wrongly declaring equivalence at 0.05 too, not 0.10, so no correction for running two tests is needed.

By the full quarter, TechCo has 800 visitors per arm instead of 50. Running the two one-sided tests on that larger cut, and checking the same conclusion with a familiar shortcut, looks like this.

```r
# Run the two one-sided tests against the +/-0.5 minute margin, full quarter of data
margin <- 0.5
quarter_test <- t.test(A_full, B_full)
quarter_diff <- mean(A_full) - mean(B_full)
se <- quarter_test$stderr
df <- quarter_test$parameter

# Test 1: rule out that B beats A by more than the margin (diff <= -0.5)
t1 <- (quarter_diff - (-margin)) / se
p1 <- pt(t1, df, lower.tail = FALSE)

# Test 2: rule out that A beats B by more than the margin (diff >= 0.5)
t2 <- (quarter_diff - margin) / se
p2 <- pt(t2, df, lower.tail = TRUE)

round(c(diff = quarter_diff, t1 = t1, p1 = p1, t2 = t2, p2 = p2), 4)

# The equivalent shortcut: a 90% confidence interval entirely inside the margin
round(as.numeric(t.test(A_full, B_full, conf.level = 0.90)$conf.int), 2)
#>    diff      t1      p1      t2      p2 
#>  0.0230  2.6530  0.0040 -2.4197  0.0078 
#> [1] -0.30  0.35
```

The difference has narrowed to 0.023 minutes, close to nothing. Test 1 gives t1 = 2.653 and p1 = 0.004, well under 0.05, so its null is rejected: B is not slower than A by more than the margin. Test 2 gives t2 = -2.420 and p2 = 0.0078, also under 0.05, so its null is rejected too: A is not slower than B by more than the margin either. Both one-sided nulls are rejected, so TOST declares A and B equivalent at the 0.5-minute margin.

The 90% confidence interval confirms the same answer a different way: -0.30 to 0.35 minutes, sitting entirely inside +/-0.5. Running a 90% interval and checking that it fits inside the margin is mathematically the same test as running the two one-sided tests at alpha = 0.05 each, just read off a single number instead of two.

With about 1,598 degrees of freedom behind this t-test, its distribution is close enough to a standard normal that the widget below, which draws a standard normal curve, is a fair stand-in for it. Drag the slider to 2.65, test 1's own t-statistic, and watch its one-sided tail.

::widget null-distribution {"tails": 1, "start": 2.65, "label": "test 1 t-statistic"}

At 2.65, the shaded tail area reads 0.004, the same p1 computed by hand above. Drag the slider down toward zero and the tail swells, the p-value climbs, and test 1 stops rejecting its null. Drag it further out and the tail shrinks instead.

Several more cuts of TechCo's data get the same two tests, so it is worth wrapping that pair of tests into one reusable function.

```r
# Wrap the two one-sided tests into a function, so any cut of the data can reuse it
tost_outcome <- function(a, b, margin) {
  test <- t.test(a, b)
  diff <- mean(a) - mean(b)
  se <- test$stderr
  df <- test$parameter
  t1 <- (diff - (-margin)) / se
  p1 <- pt(t1, df, lower.tail = FALSE)
  t2 <- (diff - margin) / se
  p2 <- pt(t2, df, lower.tail = TRUE)
  c(diff = diff, ord_p = test$p.value, p1 = p1, p2 = p2)
}
```

=== step === quiz
## Quick check: inconclusive is not the same as "not equivalent"

Run the same two one-sided tests on the week-one cut, the one that gave the non-significant ordinary result. They come back with p1 = 0.166 and p2 = 0.381. What does that result say about algorithms A and B?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- A and B are equivalent, because neither one-sided test found a significant difference. ::no Equivalence needs BOTH one-sided nulls rejected. Here, neither is: p1 = 0.166 and p2 = 0.381 both sit well above 0.05.
- A and B differ by more than the 0.5-minute margin. ::no A real difference outside the margin would show up as one of the two one-sided tests rejecting strongly in that direction. Neither one does here.
- The result is inconclusive: this data cannot yet say A and B are equivalent, and it cannot say they differ by more than the margin either. ::ok Exactly. Neither one-sided null is rejected, so TOST has nothing to conclude either way. Inconclusive is its own honest outcome, not a stand-in for "not equivalent".
- The 0.5-minute margin must have been set too narrow. ::no Neither of the other three outcomes applies here either: equivalence needs both p1 and p2 below 0.05, and a real difference needs the ordinary test to be significant. With p1 = 0.166 and p2 = 0.381, this result is inconclusive, and that says nothing about whether the margin itself was reasonable.

=== step === concept
## The four outcomes a TOST and an ordinary test can give together

Put the ordinary test and TOST side by side and only four things can happen: the ordinary test is significant or it is not, and TOST finds equivalence or it does not. Seeing all four outcomes on real data makes the logic concrete.

Two more cuts of TechCo's test, standing in for how the same test could have turned out under different true effects, make the picture complete: one where the true gap between A and B is small enough to not matter, and one where it is genuinely large.

```r
# Add two large cuts standing in for different true effects: a trivial gap and a real one
set.seed(7)
A_triv <- rnorm(6000, mean = 18, sd = 4)
B_triv <- rnorm(6000, mean = 17.82, sd = 4)
A_real <- rnorm(6000, mean = 18, sd = 4)
B_real <- rnorm(6000, mean = 17.1, sd = 4)
```

Now run the ordinary test and TOST on all four cuts of TechCo's data: the week-one cut, the full-quarter cut, and these two new ones.

```r
# Run the same ordinary test and TOST on all four cuts of TechCo's data
cuts <- list(
  "week one, n=50"      = list(a = A_week, b = B_week),
  "full quarter, n=800" = list(a = A_full, b = B_full),
  "trivial gap, n=6000" = list(a = A_triv, b = B_triv),
  "real gap, n=6000"    = list(a = A_real, b = B_real)
)

# Label each cut by crossing the ordinary test's significance with TOST's equivalence call
outcome_label <- function(ord_p, tost_p) {
  if (ord_p < 0.05 && tost_p < 0.05) "significant but trivial"
  else if (ord_p >= 0.05 && tost_p < 0.05) "equivalent"
  else if (ord_p < 0.05 && tost_p >= 0.05) "real difference"
  else "inconclusive"
}

fmt_p <- function(p) ifelse(p < 0.0001, "< 0.0001", sprintf("%.4f", p))

build_row <- function(cut) {
  r <- tost_outcome(cut$a, cut$b, margin)
  tost_p <- max(r["p1"], r["p2"])
  data.frame(diff = sprintf("%.3f", r["diff"]),
             ord_p = fmt_p(r["ord_p"]),
             tost_p = fmt_p(tost_p),
             outcome = outcome_label(r["ord_p"], tost_p),
             stringsAsFactors = FALSE)
}

results <- do.call(rbind, lapply(cuts, build_row))
rownames(results) <- names(cuts)
results
#>                      diff    ord_p   tost_p                 outcome
#> week one, n=50      0.263   0.7379   0.3812            inconclusive
#> full quarter, n=800 0.023   0.9071   0.0078              equivalent
#> trivial gap, n=6000 0.160   0.0296 < 0.0001 significant but trivial
#> real gap, n=6000    0.906 < 0.0001   1.0000         real difference
```

Here `tost_p` is the larger of p1 and p2: the more conservative of the two one-sided tests, since both have to reject for TOST to call equivalence. Read the four rows against the rule used to label them:

- **Week one** (ord_p = 0.7379, tost_p = 0.3812): the ordinary test is not significant, and TOST does not find equivalence either. Neither question is answered. **Inconclusive.**
- **Full quarter** (ord_p = 0.9071, tost_p = 0.0078): the ordinary test is not significant, but TOST does find equivalence. **Equivalent.**
- **Trivial gap** (ord_p = 0.0296, tost_p < 0.0001): with 6,000 visitors per arm, even a real difference of about 0.16 minutes is large enough for the ordinary test to call significant. But 0.16 minutes is still safely inside the 0.5-minute margin, so TOST also calls it equivalent. **Significant but trivial.**
- **Real gap** (ord_p < 0.0001, tost_p = 1.0000): the ordinary test is overwhelmingly significant, and TOST's own tests fail to reject, meaning the true difference is not confidently inside the margin. **A real difference outside the margin.**

That is the whole decision rule: cross what the ordinary test found with what TOST found, and every pair of results lands in exactly one of those four boxes.

=== step === concept
## Why a tighter margin needs more data

A margin is a choice, and a tighter margin is a stricter bar to clear. It takes more data to show the true difference confidently sits inside a narrow band than a wide one.

The widget below carries its own three built-in effect sizes rather than TechCo's minutes, so read it first in general terms: holding everything else fixed, a smaller effect you are trying to pin down needs a bigger sample to pin down reliably.

::widget power-curve {}

Switch from the medium to the small effect and the sample size needed for 80% power jumps from a few dozen per group to a few hundred. That is the same relationship behind TechCo's own margin, just measured in minutes instead of in standardised effect sizes.

Here is that relationship on TechCo's own scale: a session duration with a standard deviation of 4 minutes, and a margin to resolve with 90% power.

```r
# How many visitors per arm does the 0.5-minute margin need for 90% power?
ceiling(power.t.test(delta = 0.5, sd = 4, sig.level = 0.05, power = 0.90)$n)

# And if the margin halves to 0.25 minutes?
ceiling(power.t.test(delta = 0.25, sd = 4, sig.level = 0.05, power = 0.90)$n)
#> [1] 1346
#> [1] 5381
```

TechCo's 0.5-minute margin needs 1,346 visitors per arm for 90% power. Halve the margin to 0.25 minutes and the requirement rises to 5,381, roughly four times as many. The sample size needed scales with one over the margin squared, so halving the margin quadruples the data needed: the same inverse-square relationship the widget's curve showed in general terms above.

This also explains how a 0.16-minute gap can be real yet still slip past a smaller sample. TechCo's actual quarter had only 800 visitors per arm, nowhere near the 1,346 that margin needs for reliable power.

```r
# At n=800 per arm, what power did TechCo actually have to detect a 0.16-minute gap?
power_800 <- power.t.test(n = 800, delta = 0.16, sd = 4, sig.level = 0.05)$power
round(100 * power_800, 1)
#> [1] 12.3
```

Only 12.3%. At TechCo's real sample size, a true difference as small as 0.16 minutes would be missed by the ordinary test about seven times out of eight. A difference that small needs 6,000 visitors per arm, not 800, before it can show up as statistically significant at all.

=== step === quiz
## Closing quiz: classify a result you haven't seen before

A new cut of TechCo's test, 1,500 visitors per arm, gives an ordinary two-sided p-value of 0.137, and the two one-sided TOST tests give p1 < 0.0001 and p2 = 0.028. Using the four-outcome rule, which of the four outcomes is this?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Inconclusive. ::no Inconclusive needs both one-sided tests to fail to reject. Here, p1 and p2 are both under 0.05, so both one-sided nulls are rejected.
- Equivalent: the ordinary test is not significant, and both one-sided tests reject, so TOST finds the true difference safely inside the 0.5-minute margin. ::ok Exactly right. Ordinary p = 0.137 means not significant, and p1 < 0.0001 together with p2 = 0.028 means both one-sided nulls are rejected, which is TOST's definition of equivalence.
- Significant but trivial. ::no That label needs the ordinary test to be significant at the same time TOST finds equivalence. Here the ordinary p is 0.137, well above 0.05, so the ordinary test is not significant.
- A real difference outside the margin. ::no A real difference needs the ordinary test to be significant, and at least one of the one-sided tests to fail to reject. Both p1 and p2 here are below 0.05, which is the opposite pattern: both one-sided nulls are rejected, and the ordinary test is not significant. That combination is TOST's equivalent outcome.

=== step === tryit
## Closing try-it: find the sample size a tighter margin needs

TechCo needs 1,346 visitors per arm for the 0.5-minute margin, found with the power.t.test() call below. Edit it so the margin is 0.25 minutes instead, then press Run to read off the new n.

```r
# Starting point: the 0.5-minute margin's sample size
ceiling(power.t.test(delta = 0.5, sd = 4, sig.level = 0.05, power = 0.90)$n)
#> [1] 1346
```
::check {"regex": "delta\\s*=\\s*0\\.25", "gate": true, "difficulty": "intermediate", "ok": "Right: delta = 0.25 needs n = 5381 per arm, four times the 1,346 the 0.5-minute margin needed.", "no": "Change the delta argument from 0.5 to 0.25 in the power.t.test() call and run it again."}
::solution
```r
# Change delta to 0.25 and read the new sample size off the output
ceiling(power.t.test(delta = 0.25, sd = 4, sig.level = 0.05, power = 0.90)$n)
#> [1] 5381
```

=== step === concept
## References

- [A comparison of the two one-sided tests procedure and the power approach for assessing the equivalence of average bioavailability](https://doi.org/10.1007/BF01068419) - Schuirmann, D.J. (1987), Journal of Pharmacokinetics and Biopharmaceutics, 15(6), 657-680. The original paper behind the two one-sided tests this lesson runs by hand.
- [Understanding equivalence and noninferiority testing](https://doi.org/10.1007/s11606-010-1513-8) - Walker, E., and Nowacki, A.S. (2011), Journal of General Internal Medicine, 26(2), 192-196. A plain walkthrough of the margin and the 90% confidence interval shortcut used in this lesson.
- [Equivalence tests: a practical primer for t-tests, correlations, and meta-analyses](https://doi.org/10.1177/1948550617697177) - Lakens, D. (2017), Social Psychological and Personality Science, 8(4), 355-362. Worked TOST examples across several common test types.
- [Equivalence testing for psychological research: a tutorial](https://doi.org/10.1177/2515245918770963) - Lakens, D., Scheel, A.M., and Isager, P.M. (2018), Advances in Methods and Practices in Psychological Science, 1(2), 259-269. Covers how to choose a defensible margin before collecting data.

=== step === complete
## What a TOST result lets you claim, and what it doesn't

- TOST answers a different question than an ordinary test: not whether there is a difference, but whether any difference is small enough to not matter.
- The margin has to be fixed before the data are seen, on subject-matter grounds. TOST runs it as two one-sided tests, and equivalence is declared only when both reject.
- A non-significant ordinary test is never, by itself, evidence of equivalence. The week-one cut proved nothing until there was more data to narrow down the true difference.
- Crossing the ordinary test with TOST gives four honest outcomes: equivalent, a real difference outside the margin, significant but trivial, or genuinely inconclusive.
- A tighter margin is a stricter bar, and it needs more data to clear. TechCo's 0.5-minute margin needed 1,346 visitors per arm; a 0.25-minute margin needed about four times that.

So when TOST declares A and B equivalent, that is a claim about this margin and nothing wider: the true difference between them is unlikely to sit outside +/-0.5 minutes. It is not a claim that the difference is exactly zero, and a looser or tighter margin, chosen after the fact, could flip the conclusion entirely. Fix the margin first, for reasons that have nothing to do with the data, and the conclusion that follows from it will hold up.

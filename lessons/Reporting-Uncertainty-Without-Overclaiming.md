---
title: "Confidence Intervals and P-Values Lesson 6: Reporting uncertainty without overclaiming"
catalog_blurb: "Turn one analysis into an honest report, without hiding results or overstating certainty."
description: "One result, written up four ways. Which numbers a report needs, how to phrase a confidence interval correctly, and what to say about a non-significant result."
keywords: "confidence interval, p-value, effect size, Cohen's d, minimum clinically important difference, reporting results, statistical significance, clinical significance, overclaiming, scientific writing, R"
post_type: "LESSON"
curriculum_id: "4.30.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "6"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: ""
course_prev: "Standard-Errors-You-Can-Trust.html"
---

=== step === cover
## Reporting uncertainty without overclaiming

Today let's learn how to report an uncertain result honestly: without hiding information, and without claiming more certainty than the data actually gives you.

Picture a clinical trial for a new antidepressant. Six hundred patients take the drug, and another six hundred patients make up the comparison group. Eight weeks later, a doctor scores every patient on a depression rating scale, where a drop of 3 points or more is the smallest change a patient would actually notice. On average, the drug group's score falls 0.90 points more than the comparison group's.

That 0.90-point gap is the whole result of this trial. But a result and its write-up are two different things, and the same 0.90-point gap can be reported four different ways, each one you might genuinely read in a paper. Pick whichever one below reads as the strongest evidence that the drug works.

::widget report-four-ways {"studies":[{"label":"Trial A","outcome":"depression score","unit":"points","n1":600,"n2":600,"m1":0,"m2":0.9,"sd":7.5,"mcid":0}],"start":0}

Pick whichever one reads as the strongest evidence to you. Then see what the other three were leaving out.

=== step === concept
## The same result, four ways to write it up

So what exactly separates those four write-ups?

The thinnest version reports only significance: "the treatment group improved significantly (p = 0.04)." That tells you the result cleared the usual bar, and nothing about how big it was.

A slightly fuller version adds a size for the effect: "the treatment group improved significantly (Cohen's d = 0.12, p = 0.04)." Cohen's d is the gap measured in standard deviations instead of the scale's own points, which is what lets you compare it against effects measured on a completely different scale. Here it works out small: 0.12 standard deviations.

A third version drops the p-value and reports the gap itself, with a range around it: "the groups differed by 0.90 points (95% CI 0.05 to 1.75)." Now you can see the actual size of the effect, in the depression scale's own units, and how uncertain that size still is.

The full report keeps everything at once: "Mean difference 0.90 points (95% CI 0.05 to 1.75), t(1198) = 2.08, p = 0.038, d = 0.12, n = 600 and 600." The "t(1198)" is the t-statistic from the test, with 1198 the degrees of freedom left over from the 1200 patients in the trial. None of this is new information. It is the same 0.90-point gap, the same interval, the same sample size, all stated at once instead of handed out one piece at a time.

The widget below is that same choice again. Pick any card and watch what the reveal does with it.

::widget report-four-ways {"studies":[{"label":"Trial A","outcome":"depression score","unit":"points","n1":600,"n2":600,"m1":0,"m2":0.9,"sd":7.5,"mcid":0}],"start":0}

Whichever card you picked, the reveal says the same thing: not one number moved between the four of them. The estimate, the interval, the sample size and the p-value were identical in every write-up. Only how much of that one result you were shown changed.

=== step === quiz
## Quick check: what changed between the four write-ups

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Nothing about the result changed. Only how much of it each write-up chose to show. ::ok Right. The estimate, the interval, the sample size and the p-value were identical in all four cards. A bare-significance claim and a full report can describe the exact same trial.
- The full report used a larger effect size than the bare significance claim. ::no
- The bare significance claim used a different p-value than the full report. ::no
- The interval-only write-up came from a smaller sample than the other write-ups. ::no All four cards came from the same 600-per-arm trial, with the same 0.90-point gap, the same 95% CI of 0.05 to 1.75, and the same p = 0.038. Nothing about the underlying result changed between write-ups. Only how much of it each version chose to report did.

=== step === concept
## Which numbers belong: the sentence and the table

So if every write-up draws on the same numbers, which of them actually belong in a results sentence?

Three things, every time:

- The estimate, in the outcome's own units: 0.90 points, not a standardised version of it.
- The interval around that estimate: 0.05 to 1.75 points.
- The sample size behind it: 600 patients in each arm.

The t-statistic and the p-value still belong in a full report, but as a supplement to those three numbers, not as the main point.

Build that sentence directly from Trial A's own numbers.

```r
# Build a results sentence from Trial A's estimate, interval and sample size
diff <- 0.90
ci_lo <- 0.05
ci_hi <- 1.75
n1 <- 600
n2 <- 600

sprintf("Mean difference %.2f points (95%% CI %.2f to %.2f), n = %d and %d.",
        diff, ci_lo, ci_hi, n1, n2)
#> [1] "Mean difference 0.90 points (95% CI 0.05 to 1.75), n = 600 and 600."
```

That one line already has everything a reader needs: how big the effect is, how uncertain that size is, and how much data it rests on.

A results table needs the same three numbers, just laid out for more than one trial at once. Here is Trial A and Trial B's numbers shown two ways: a raw print of the values, and a titled, right-aligned table with a footnote.

::widget styled-table {"cols":["trial","difference (points)","95% CI","n"],"rows":[["Trial A",0.90,"0.05 to 1.75","600 and 600"],["Trial B",6.40,"0.44 to 12.36","22 and 22"]],"formats":{"difference (points)":"1dp"},"title":"Depression-score trials: difference in points","note":"Positive values favor the treatment group."}

Switch between the two views above. The numbers never change. The report table just makes them easier to read and harder to misquote.

=== step === concept
## How to phrase an interval so it cannot be misread

Here is the sentence almost everyone writes about a 95% confidence interval, and it is wrong: "there is a 95% probability the true difference lies between 0.05 and 1.75."

The correct sentence keeps the same numbers but drops that claim: "we estimate the difference at 0.90 points (95% CI 0.05 to 1.75)." No probability statement attaches to this one interval at all.

Why not? Because once the data are collected and the interval is computed, 0.05 to 1.75 is a fixed pair of numbers. The true difference either sits inside that fixed range or it does not. There is no probability left to talk about, the same way there is no probability left in a coin that has already landed.

What the 95% actually describes is the procedure that built the interval, not this one result of it. Run that same procedure, with a fresh sample, over and over, and 95% of the intervals it produces will contain the true value. Any single interval from a single sample is just one draw from that long-run process, and this is the one your data happened to produce.

See that procedure in action. Simulate Trial A's population 200 times over, each time with a fresh batch of 600 patients per arm, build a 95% interval from each batch, and count how many of those 200 intervals actually contain the true 0.90-point difference.

```r
# Simulate 200 repeats of Trial A's trial design and count how many
# of the resulting 95% intervals actually contain the true difference
set.seed(1)
true_diff <- 0.90
sd_pop <- 7.5
n_per_arm <- 600
reps <- 200

catches <- 0
for (i in seq_len(reps)) {
  control <- rnorm(n_per_arm, mean = 0, sd = sd_pop)
  treated <- rnorm(n_per_arm, mean = true_diff, sd = sd_pop)
  ci <- t.test(treated, control, var.equal = TRUE)$conf.int
  if (ci[1] <= true_diff && true_diff <= ci[2]) catches <- catches + 1
}
catches
#> [1] 191
```

191 of the 200 simulated intervals caught the true 0.90-point difference, which is 95.5%, close to the claimed 95%. Run a different batch of 200 and the count would land somewhere else nearby, sometimes a little above 95%, sometimes a little below. What stays fixed is the long-run rate the procedure is built to hit, not any single count or any single interval.

[KEY INSIGHT]
The 95% in "95% confidence interval" is a property of the procedure that builds intervals, shown only by repeating it. It is never a probability statement about the one interval sitting in front of you.

So the one sentence to write about Trial A's interval is this: "we estimate the difference at 0.90 points (95% CI 0.05 to 1.75)." That sentence makes a claim about the estimate and names the range a careful reader should expect it to vary across. It makes no claim about where the true value sits inside that range.

=== step === widget
## Same p-value, different clinical meaning

Trial B is a second trial of the same drug, run on only 22 patients per arm instead of 600. Its mean difference comes out to 6.40 points, with a 95% CI of 0.44 to 12.36. Rounded to two decimal places, its p-value is 0.036, which rounds to the same 0.04 as Trial A's 0.038.

So by a bare p-value alone, Trial A and Trial B look identical. They are not. Bring back the 3-point threshold from the running example, the smallest change a patient would actually notice, and look at where each trial's interval sits against it.

::widget report-four-ways {"studies":[{"label":"Trial A","outcome":"depression score","unit":"points","n1":600,"n2":600,"m1":0,"m2":0.9,"sd":7.5,"mcid":3},{"label":"Trial B","outcome":"depression score","unit":"points","n1":22,"n2":22,"m1":0,"m2":6.4,"sd":9.8,"mcid":3}],"start":0}

Switch between the two trials above. Trial A's entire interval, 0.05 to 1.75, sits below the 3-point threshold. Whatever this drug is doing in Trial A, it is a real, precisely measured effect, and it is too small to matter to a patient.

Trial B's interval runs from 0.44, close to no effect at all, up to 12.36, four times past the threshold. That one trial is compatible with the drug doing almost nothing and with the drug doing a lot. A p-value has no way to tell those two situations apart, because it was never built to measure the size of anything. Only the interval, read against a real threshold, can.

=== step === concept
## What to say about a result that missed significance

Run the same test a third time, on a trial too small to reach significance at all. Trial C puts 20 patients in each arm, and the mean difference comes out to 2.00 points.

```r
# Simulate Trial C and run the same t-test as the other two trials
set.seed(7)
make <- function(n, mean, sd) mean + sd * as.numeric(scale(rnorm(n)))

control_c <- make(20, 0, 9.5)
treated_c <- make(20, 2.0, 9.5)
trial_c <- t.test(treated_c, control_c, var.equal = TRUE)

round(c(estimate = unname(diff(rev(trial_c$estimate))),
        ci_lo = unname(trial_c$conf.int[1]),
        ci_hi = unname(trial_c$conf.int[2]),
        t = unname(trial_c$statistic),
        df = unname(trial_c$parameter),
        p = unname(trial_c$p.value)), 2)
#> estimate    ci_lo    ci_hi        t       df        p 
#>     2.00    -4.08     8.08     0.67    38.00     0.51 
```

A 2.00-point difference, a 95% CI of -4.08 to 8.08, and p = 0.51. That p-value is well above 0.05, so this result is not statistically significant.

Here is where two common write-ups both go wrong. "The drug had no effect" overclaims in one direction: the interval still runs up to 8.08, well past the 3-point threshold, so an effect large enough to matter has not been ruled out. "The drug works" overclaims in the other direction: the same interval runs down to -4.08, so a genuinely harmful effect has not been ruled out either.

The honest line states what the data actually support: the estimate, the interval, and the fact that an effect above the clinical threshold could not be ruled out. For Trial C, that reads as "mean difference 2.00 points (95% CI -4.08 to 8.08), n = 20 and 20; an effect above the 3-point threshold cannot be ruled out." Not significant and not nothing are both true at once, and a results sentence has room to say both.

=== step === concept
## The sentence for an assumption you could not check
::prose-only the idea is a named gap in what Trial A's interval assumed, grounded entirely in numbers already on the page; no new visual earns its place here

Every interval built so far rests on an assumption that was never stated out loud: that each participant's outcome is independent of every other participant's.

Trial A enrolled 600 participants, and they were enrolled across several clinics. That detail was not recorded anywhere in the analysis this lesson ran. If patients at the same clinic tend to respond more alike, maybe because of a shared doctor, a shared intake process, or a shared local population, then those patients are not actually contributing 600 independent pieces of evidence. They are contributing something closer to a smaller number of independent clusters, each repeated a few times over.

Whether that is happening here could not be checked, because clinic was never recorded as part of this trial's data. That is not a flaw to shrug off, and it is not a reason to throw out the interval either. It is a fact to state.

So the honest sentence names the assumption, says plainly that it was not verified, and says what follows if it turns out to be wrong: "this interval assumes participants responded independently of one another, an assumption that was not verified here; if participants at the same clinic responded more alike than independence assumes, the true interval would be wider than 0.05 to 1.75, not narrower." A reader who sees that sentence knows exactly how far to trust the number next to it.

=== step === quiz
## Closing check: reading a reported result

Trial B's full report reads: mean difference 6.40 points, 95% CI 0.44 to 12.36, p = 0.04. The smallest change a patient would notice on this scale is 3 points.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The result is compatible with almost no effect and with an effect four times the clinically important size, so it settles very little. ::ok Right. The interval runs from 0.44, well below the 3-point threshold, to 12.36, four times above it. A single p-value cannot distinguish those two very different situations, and this result does not either.
- It proves the drug works. ::no
- It proves the drug barely works. ::no
- The study needs a bigger effect size before it can be reported honestly. ::no A p-value of 0.04 and a wide interval are not proof of anything, in either direction. The honest reading is the interval itself, 0.44 to 12.36 points, against a 3-point threshold for a change patients would notice. That range is compatible with a negligible effect and with a large one, so the result is inconclusive. It is not proof the drug works, not proof it barely works, and not a reason to distrust the effect-size number itself.

=== step === tryit
## Closing exercise: two honest sentences

Below is Trial C's simulation again, with two lines left wrong on purpose. Fix both, then press Check.

```r
# Trial C, simulated the same way as before
set.seed(7)
make <- function(n, mean, sd) mean + sd * as.numeric(scale(rnorm(n)))

control_c <- make(20, 0, 9.5)
treated_c <- make(20, 2.0, 9.5)
trial_c <- t.test(treated_c, control_c, var.equal = TRUE)

diff_c <- round(unname(diff(rev(trial_c$estimate))), 2)
lo_c <- round(trial_c$conf.int[1], 2)
hi_c <- round(trial_c$conf.int[2], 2)
n1c <- 20
n2c <- 20

# Finish this line: report Trial C honestly, with the estimate, the
# interval and the sample size, claiming neither that it works nor
# that it does nothing
report_c <- "The drug does not work, since the result was not significant."

# Finish this line: name the assumption behind Trial A's interval
# that independence across clinics was never checked, and what that
# means for how much to trust the interval
assumption_a <- "Trial A's interval is reliable because the sample size was large."

report_c
assumption_a
```
::check {"regex": "^(?=[\\s\\S]*report_c)(?=[\\s\\S]*sprintf)(?=[\\s\\S]*diff_c)(?=[\\s\\S]*lo_c)(?=[\\s\\S]*hi_c)(?=[\\s\\S]*assumption_a)(?=[\\s\\S]*independence)(?=[\\s\\S]*narrower)(?=[\\s\\S]*(?:not verified|unverified|could not be checked))(?![\\s\\S]*no effect)(?![\\s\\S]*proves)[\\s\\S]*$", "gate": true, "difficulty": "intermediate", "ok": "Right. Trial C's own numbers, not a verdict either way, and Trial A's independence assumption named instead of ignored.", "no": "report_c needs to be built with sprintf() from diff_c, lo_c and hi_c, and must not claim the drug has no effect or that anything is proved. assumption_a needs to name independence across clinics as unverified, and say the interval may be narrower than it should be if that assumption fails."}
::solution
```r
# Report Trial C with its own numbers, claiming neither that it works nor that it does nothing
report_c <- sprintf("Mean difference %.2f points (95%% CI %.2f to %.2f), n = %d and %d.",
                     diff_c, lo_c, hi_c, n1c, n2c)

# Name the unchecked assumption behind Trial A's interval
assumption_a <- sprintf("Trial A's interval assumes independence across clinics, which was not verified; if that assumption fails, the interval may be narrower than it should be.")

report_c
#> [1] "Mean difference 2.00 points (95% CI -4.08 to 8.08), n = 20 and 20."
assumption_a
#> [1] "Trial A's interval assumes independence across clinics, which was not verified; if that assumption fails, the interval may be narrower than it should be."
```

Both sentences do the same job: they state exactly what the data support, and name exactly what is still unknown. Neither one hides a number, and neither one claims more than it has earned.

=== step === concept
## References

- [The New Statistics: Why and How](https://doi.org/10.1177/0956797613504966). Cumming, G. (2014), Psychological Science, 25(1), 7-29. Makes the case, with worked examples, for reporting estimates and intervals instead of bare significance.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3). Greenland, S. et al. (2016), European Journal of Epidemiology, 31(4), 337-350. Catalogues the misreading of a confidence interval as a probability statement, among others.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108). Wasserstein, R.L. and Lazar, N.A. (2016), The American Statistician, 70(2), 129-133. The six-principle statement on what a p-value does and does not measure.
- [Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals](https://www.icmje.org/recommendations/). International Committee of Medical Journal Editors. The Statistics and Methods section sets out what a results sentence and table are expected to report.

=== step === complete
## What you can report now

Three trials, three different honest write-ups, one shared standard.

- Trial A: a precise, real effect too small to matter to a patient. The honest sentence states the estimate and the interval, and reads the interval as a property of the procedure, never as a probability about this one range.
- Trial B: the same rounded p-value as Trial A, and an interval running from almost nothing to four times the clinical threshold. The honest sentence calls that inconclusive, because the interval, not the p-value, is what actually says so.
- Trial C: not statistically significant, and still not proof that nothing is there. The honest sentence reports the estimate and interval and says plainly that an effect above the threshold could not be ruled out.

Every one of those sentences met the same standard: the estimate, in its own units; the interval around it; the sample size behind it; and, where one exists, the assumption that was never checked, named instead of hidden.

That is the whole job a results sentence has to do. Not to persuade, and not to hedge into silence. Just to say, plainly, what the data support and what they do not.

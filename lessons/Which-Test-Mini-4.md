---
title: "Fisher's exact test: when and how, with a worked example"
slug: "Which-Test-Mini-4"
description: "Fisher's exact test in R: why chi-square fails on tiny samples, how the hypergeometric distribution gives an exact p-value, and how to report the result."
keywords: "Fisher's exact test, fisher.test, small sample test, hypergeometric distribution, 2x2 contingency table, exact p-value, chi-square approximation, odds ratio"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "4"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-3"
course_next: "Which-Test-Mini-5"
curriculum_id: "0.0.28"
lesson_access: "windowed"
catalog_blurb: "Testing a 2x2 table exactly when your sample is too small for chi-square."
---

=== step === cover
## Fisher's exact test: when and how, with a worked example

A clinic runs a small trial: 8 patients receive a new treatment and 7 of them improve, while 9 patients receive no treatment and only 3 improve. That's 17 patients in total.

Seven out of eight is a striking number for so few people, and a fair question follows: could a split this uneven show up even if the treatment does nothing at all? Answering that on a sample this small is exactly what today's test is for, and its name is Fisher's exact test.

Lay out who got the treatment and who improved, and you get this table.

::widget styled-table {"cols": ["Group", "Improved", "Not"], "rows": [["Treatment", 7, 1], ["Control", 3, 6]], "title": "The pilot study, 17 patients", "note": "8 patients got the new treatment, 9 got none."}

That table, and these four numbers, are what every step from here works with.

=== step === concept
## Turning patient records into a 2x2 table

Before you can test anything, you need that table inside R.

There are two ways to build it, and you'll meet both in real projects: typing in the counts yourself, or starting from one row per patient and letting R count for you. If you already know the four counts, `matrix()` with `dimnames` builds the table directly.

```r
# Build the 2x2 table of group vs outcome from the four known counts
trial <- matrix(c(7, 3, 1, 6), nrow = 2,
                 dimnames = list(group   = c("Treatment", "Control"),
                                 outcome = c("Improved", "Not")))
trial
#>            outcome
#> group       Improved Not
#>   Treatment        7   1
#>   Control          3   6
```

The numbers fill the matrix column by column, not row by row. That's why the first column, `Improved`, is `c(7, 3)`, matching the Treatment row's 7 and the Control row's 3, and the second column, `Not`, is `c(1, 6)`.

If instead you start with one row per patient, `table()` cross-tabulates two columns of a data frame for you.

```r
# Build the same table starting from one row per patient
patients <- data.frame(
  id      = 1:17,
  group   = c(rep("Treatment", 8), rep("Control", 9)),
  outcome = c(rep("Improved", 7), rep("Not", 1), rep("Improved", 3), rep("Not", 6))
)
table(group = patients$group, outcome = patients$outcome)
#>            outcome
#> group       Improved Not
#>   Control          3   6
#>   Treatment        7   1
```

Same counts, same table. The only difference is that `table()` orders the groups alphabetically, Control before Treatment, while `matrix()` keeps whatever order you typed. Either table works with everything that follows.

=== step === concept
## Why chi-square is unreliable on a table this small

You might reach for the chi-square test first, since that's the usual test for whether two categorical variables are related. Let's see what it does with this table.

Chi-square works by comparing your counts to the counts it would expect if group and outcome were unrelated. Those expected counts come from the row and column totals alone.

```r
# Compute the counts chi-square would expect if group and outcome were unrelated
cs <- suppressWarnings(chisq.test(trial))
cs$expected
#>            outcome
#> group       Improved      Not
#>   Treatment 4.705882 3.294118
#>   Control   5.294118 3.705882
```

Every one of those four expected counts is under 5. That crosses a line statisticians agree on: once an expected count drops below 5, chi-square's own approximation stops being reliable. R tells you this itself. Running `chisq.test(trial)` without suppressing its warning prints `Chi-squared approximation may be incorrect`. That's not a coding error. It's R telling you the p-value it's about to give you might be wrong.

The number this test computes is called a p-value: if group and outcome were truly unrelated, it's the chance of seeing a split at least this uneven, purely by chance.

```r
# Read the p-value chi-square gives anyway
cs$p.value
#> [1] 0.07649937
```

[TIP]
Treat that warning as a signal to switch tests, not a problem to silence. When R says the approximation may be incorrect, it means don't trust the number it just gave you.

So chi-square gives a p-value of roughly 0.076, just above the usual 0.05 cutoff for statistical significance. But you already know that number might be wrong. What you need is a test that gives an exact answer on a table this small, with no approximation at all. That's Fisher's exact test.

=== step === widget
## Could luck alone produce a 7-out-of-8 split?

Before turning to a formula, let's just watch chance itself.

Across the whole study, 10 of the 17 patients improved, whether they got the treatment or not. That's an overall improvement rate of about 59%. Now imagine 8 patients each improving purely at that overall rate, with the treatment doing nothing at all. How often would 7 or more of them improve, just by luck?

::widget luck-simulator {"trials": 8, "p": 0.588, "observed": 7, "unit": "patients improving"}

Press the buttons and run a few thousand of these imagined groups of 8. Run it long enough and it settles at a little under 10% of the time reaching 7 or more improvements by pure luck. Already that tells you a 7-out-of-8 split isn't the norm.

That number isn't the exact right answer though, because this simulation treats each of the 8 as an independent flip at the overall rate. It doesn't account for one detail: the 17 patients are a fixed, finite group. Once several of the improved patients land in one group, fewer are left for the other. That detail matters.

=== step === concept
## The hypergeometric distribution behind fisher.test()

The button-pressing simulation gave you a feel for the answer. Now let's compute it exactly, which is exactly what `fisher.test()` does internally.

Here's the key idea. Once you fix the row totals (8 patients on treatment, 9 on none) and the column totals (10 improved, 7 not), the count in any one cell of the table is no longer free to be anything. It's constrained by those four totals, and its distribution has a name: the hypergeometric distribution.

Think of it as drawing balls from an urn without putting them back. Imagine the 17 patients as balls in an urn, 10 marked "improved" and 7 marked "not". Draw 8 of them at random, your Treatment group, and the number of "improved" balls in that draw follows the hypergeometric distribution.

The formula for exactly k improved patients out of the 8 drawn is:

\[
P(X = k) = \frac{\binom{r_1}{k}\binom{r_2}{c_1-k}}{\binom{n}{c_1}}
\]

Here \(r_1\) and \(r_2\) are the two row totals (8 and 9), \(c_1\) is the Improved column total (10), and \(n\) is the grand total (17). R has this formula built in as `dhyper()`. Let's compute the exact probability of the table you actually observed: 7 improved out of the 8 on treatment.

```r
# Compute the exact probability of exactly 7 improved out of 8 on treatment
dhyper(7, 8, 9, 10)
#> [1] 0.03455368
```

0.0346, and that's it. No curve, no approximation, no warning. Given the row and column totals, that is the exact probability of this precise table. This one number is the entire reason Fisher's exact test exists: chi-square estimates a probability from a curve, while this formula computes it exactly, because a cell count can only ever be a whole number, never a fraction.

=== step === widget
## Seeing the exact null distribution and its p-value tail

A single probability, 0.0346, tells you how likely exactly this table is. But a p-value asks a slightly different question: how likely is a result this extreme, or more extreme, in either direction? To answer that you need to see the whole distribution, not just one point on it.

Here's the general idea, used for any hypothesis test: draw the distribution of results you'd expect under the null hypothesis, the assumption that there's no real difference between the groups, then shade the area at least as far out as your actual result. That shaded area is the p-value.

::widget null-distribution {"tails": 2, "start": 2, "label": "distance from the centre"}

Drag the slider and watch the shaded area shrink as you move further from the centre, and grow as you move back toward it. That's the general shape of every hypothesis test: a distribution under the null hypothesis, and a shaded tail that is the p-value.

Fisher's exact test does exactly this, except its null distribution isn't a smooth curve like the one above. Because a cell count can only be a whole number, the null distribution for this table is one bar for every possible count from 1 to 8 improved patients on Treatment, each bar computed from the same `dhyper()` formula you just used.

```r
# Compute a bar (a probability) for every possible count from 1 to 8
probs <- dhyper(1:8, 8, 9, 10)
names(probs) <- 1:8
round(probs, 4)
#>      1      2      3      4      5      6      7      8 
#> 0.0004 0.0130 0.1037 0.3023 0.3628 0.1814 0.0346 0.0019
```

You already computed the bar at 7: 0.0346. The two-sided p-value sums every bar that is at least as small as that one, the bars for counts that are just as surprising as 7 or more so, on either side of the distribution.

```r
# Sum every bar at least as small as the bar for the observed count, 7
observed_prob <- dhyper(7, 8, 9, 10)
two_sided_p <- sum(probs[probs <= observed_prob])
two_sided_p
#> [1] 0.04977376
```

0.04977, and that's not an approximation of anything. It's an exact sum of exact probabilities, and it's the exact number `fisher.test()` returns.

The luck simulation showed that a split this uneven happens by pure chance only some of the time. The picture above turns that same idea into a shape: a null distribution with the far ends shaded. What does that shaded area represent?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The probability that the null hypothesis is true. ::no
- The chance, under the null hypothesis, of a result at least this extreme, in either direction. ::ok Exactly. Whether the distribution is a smooth curve or a set of bars over whole numbers, the shaded tail is always the same thing: how often a result this far from the centre, or farther, would show up if there truly were no difference between the groups.
- The size of the treatment's effect. ::no
- The confidence level of the test, 95%. ::no A shaded tail is never the confidence level and never the size of an effect. It is a chance: under the null hypothesis, the chance of seeing a result this extreme or more, in either direction. That's the only thing a p-value ever measures, whether it comes from a smooth curve or, like here, from summing exact bars of a hypergeometric distribution.

=== step === concept
## Running fisher.test() and reading the p-value

You've now built that 0.04977 by hand, bar by bar. In practice you'll never do that. `fisher.test()` runs the entire calculation, on any 2x2 table, in one line.

```r
# Run Fisher's exact test on the pilot study table
ft <- fisher.test(trial)
ft
#> 
#> 	Fisher's Exact Test for Count Data
#> 
#> data:  trial
#> p-value = 0.04977
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>    0.8564753 728.9937469
#> sample estimates:
#> odds ratio 
#>   11.63911 
```

There's the same 0.04977 you just built from the bars. It sits just under the conventional 0.05 line, where chi-square's unreliable 0.076 sat just above it. It's the same 17 patients and the same table, but two different conclusions, and only one of them, Fisher's, can be trusted on a table this small.

=== step === concept
## The odds ratio, the confidence interval, and a borderline call

A p-value tells you whether you can rule out chance. It says nothing about how big the effect is, or how sure you should be of its size. That's what the rest of `fisher.test()`'s output is for.

`ft$estimate` is the odds ratio: how many times higher the odds of improving are on the treatment compared to none.

```r
# Read the odds ratio fisher.test() reports
ft$estimate
#> odds ratio 
#>   11.63911 
```

About 11.6. You might expect this to match the simple cross-product odds ratio you could compute by hand.

```r
# Compare with the simple, hand-computed cross-product odds ratio
(7 * 6) / (1 * 3)
#> [1] 14
```

14, not 11.6. `fisher.test()` doesn't report that simple cross-product. It reports the conditional maximum likelihood estimate, or MLE: the odds ratio that best explains the table once you hold the row and column totals fixed, the same totals the hypergeometric distribution is built from. For small or lopsided tables like this one, the two numbers can differ by a fair amount. Report the MLE value R gives you, not one you compute by hand.

The odds ratio alone still doesn't tell you how confident to be in that 11.6. For that, read the confidence interval.

```r
# Read the 95% confidence interval around the odds ratio
ft$conf.int
#> [1]   0.8564753 728.9937469
#> attr(,"conf.level")
#> [1] 0.95
```

[WARNING]
That interval runs from 0.86 to 729, and it includes 1. An odds ratio of 1 would mean no effect at all. So even though the p-value came in just under 0.05, the confidence interval alone would not rule out "no effect".

That's not a contradiction. It's what 17 patients can and cannot tell you. The p-value says a difference this large is unlikely to be pure chance. The confidence interval says you don't yet know how large that difference really is, since anywhere from barely-there to enormous is still consistent with the data. Report the p-value, the odds ratio, and the confidence interval together. Any one of them alone leaves out important information.

=== step === concept
## Choosing a one-sided test when the direction is set in advance

Every `fisher.test()` call so far tested a two-sided question: does the treatment change the odds of improving, in either direction? But this pilot study was never really asking that. It was designed to answer one specific question, decided before a single patient was tested: does the new treatment help?

When the direction of the question is fixed in advance, before you look at the data, you can run a one-sided test instead.

```r
# Run a one-sided test: does treatment strictly increase the odds?
ft_one <- fisher.test(trial, alternative = "greater")
ft_one$p.value
#> [1] 0.03640477
ft_one$conf.int
#> [1] 1.149848      Inf
#> attr(,"conf.level")
#> [1] 0.95
```

The p-value drops to 0.0364, and the confidence interval becomes one-sided too: from 1.15 up to infinity, no longer straddling 1. Both changes happen because you're now only counting evidence in one direction, so the same data clears the bar more easily.

That's also exactly why you must fix the direction before looking at the data, never after. If you ran the two-sided test first, saw which direction looked better, and then switched to a matching one-sided test, you'd always end up with a smaller p-value, one you did not earn.

=== step === concept
## When to reach for Fisher's exact test, and its limits

You now have the whole decision in your hands. If any expected cell count in your table is under 5, like the 4.71, 3.29, 5.29 and 3.71 from the pilot study's expected counts, reach for Fisher's exact test instead of chi-square. Once your counts are comfortably above 5, chi-square is fine, and it's faster.

Fisher's exact test does have one real limit. For very large or very unevenly split tables, the exact calculation has to enumerate a huge number of possible tables, which can get slow. When that happens, `fisher.test(table, simulate.p.value = TRUE)` swaps the exact enumeration for a fast Monte Carlo estimate that comes very close to the true value.

Here's that whole decision laid out as one flow.

![Choosing between Fisher's exact test and the chi-square test for a 2x2 table.](screenshots/Fishers-Exact-Test-in-R-decision-flow.webp)

*Choosing between Fisher's exact test and the chi-square test for a 2x2 table.*

A small or sparse table calls for Fisher's exact test. A large table with healthy counts is fine with chi-square, and it runs faster. That's the whole decision.

=== step === complete
## Reporting the result
::prose-only recap of numbers already shown earlier in the lesson, no new visualizable concept

You've now covered the whole test, start to finish. Let's put it together the way you'd actually write it up.

A complete write-up of this pilot study reads like this: "Fisher's exact test found higher odds of improving under the new treatment (two-sided p = 0.050, odds ratio = 11.6, 95% CI 0.86 to 729; one-sided p = 0.036)." Every number in that sentence has a job. The p-value says the split is unlikely to be pure chance. The odds ratio says how large the effect looks. The confidence interval says how much that estimate could still be wrong, given only 17 patients.

Here's the whole path you just walked, in order:

1. Build the 2x2 table from your counts or your raw records.
2. Check whether any expected count is under 5. If so, chi-square cannot be trusted.
3. Run `fisher.test()` and read the p-value, the odds ratio, and the confidence interval together.
4. Decide one-sided or two-sided before you look at the data, never after.

That's the whole test.

=== step === quiz
## Quick check: reading a Fisher's exact test result

Suppose `fisher.test()` on a different 2x2 table comes back with a p-value of 0.04977, an odds ratio of 11.64, and a 95% confidence interval of 0.86 to 729. Which is the correct way to read that result?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Report all three numbers together: the p-value, the odds ratio, and the confidence interval, since the wide interval shows how little 17 patients can pin down the true effect, even with a borderline p-value. ::ok Exactly right. The p-value alone would make this look like a clean win. The interval running from 0.86 to 729 is the honest picture: the data rules out pure chance, barely, but says almost nothing yet about how big the real effect is.
- A p-value under 0.05 is enough on its own, so you don't need to look at the interval. ::no
- The odds ratio of 11.64 shows a large effect, regardless of what the confidence interval says. ::no
- Since the p-value clears 0.05, the confidence interval including 1 doesn't matter. ::no All three of the wrong readings drop the confidence interval, which is exactly the part of the report that keeps a borderline p-value honest. A confidence interval running from 0.86 to 729 says the sample is too small to know if the true effect is tiny or huge, even though the p-value alone looks decisive.

=== step === tryit
## Your turn: run and report a new Fisher's exact test

A marketer tests two subject lines for a newsletter. Subject A goes to 7 recipients, and 6 open it. Subject B goes to 8 recipients, and 2 open it. Nobody decided in advance which subject line would win, so this calls for a two-sided test.

Build the 2x2 table as `subj`, run `fisher.test()` on it, and store the result as `subj_ft`.

```r
# Subject A: 7 recipients, 6 opened. Subject B: 8 recipients, 2 opened.
# Build the table as `subj`, then run fisher.test() and store it as `subj_ft`.

```
::check {"regex": "subj_ft\\s*<-\\s*fisher\\.test\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "Right: p is about 0.041, the odds ratio about 14.0, and the 95% CI runs from 0.90 to 953. Same borderline pattern as the pilot study: a p-value just under 0.05, and a confidence interval too wide to say much about the true size of the effect.", "no": "Build the table with matrix(c(6, 2, 1, 6), nrow = 2, ...), with the counts in the order Opened-A, Opened-B, Not-A, Not-B. Then run subj_ft <- fisher.test(subj)."}
::solution
```r
# Build the table, run fisher.test(), and read all three numbers
subj <- matrix(c(6, 2, 1, 6), nrow = 2,
               dimnames = list(subject = c("A", "B"), opened = c("Opened", "Not")))
subj_ft <- fisher.test(subj)
subj_ft$p.value
#> [1] 0.04055944
subj_ft$estimate
#> odds ratio 
#>   13.95942 
subj_ft$conf.int
#> [1]   0.9040436 953.3729037
#> attr(,"conf.level")
#> [1] 0.95
```

p = 0.041, odds ratio 14.0, confidence interval 0.90 to 953. That's the same shape of result as the pilot study: a p-value just under 0.05, and a confidence interval too wide to say much about how big the real effect is. A complete write-up: "Subject A had higher open odds than Subject B (two-sided p = 0.041, odds ratio = 14.0, 95% CI 0.90 to 953)."

=== step === concept
## References

- [fisher.test: Fisher's Exact Test for Count Data](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/fisher.test.html) - R Documentation, the function reference for exact p-values, odds ratios and confidence intervals.
- [chisq.test: Pearson's Chi-squared Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/chisq.test.html) - R Documentation, the approximation Fisher's exact test replaces on small tables.
- [Fisher's exact test](https://en.wikipedia.org/wiki/Fisher%27s_exact_test) - background on R. A. Fisher's original 1935 exact test for a 2x2 table and the assumptions behind it.
- [Hypergeometric distribution](https://en.wikipedia.org/wiki/Hypergeometric_distribution) - the distribution behind the exact p-value, laid out in full.

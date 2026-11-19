---
title: "ANOVA and Multiple Comparisons Lesson 6: Controlling the family-wise error rate"
catalog_blurb: "Why running many hypothesis tests inflates your false-positive rate, and the fix."
description: "A 20-trait trial shows a 5% per-test rate climbing to 64% across 20 tests, then how Bonferroni and Holm correct it, and which one misses a real effect."
keywords: "family-wise error rate, Bonferroni correction, Holm step-down, multiple comparisons, multiple testing, p.adjust, type I error inflation, confirmatory study, p-value correction"
post_type: "LESSON"
curriculum_id: "4.50.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "6"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "When-False-Discovery-Rate-Beats-Bonferroni.html"
course_prev: "Asking-a-Specific-Question-of-Your-Groups.html"
---

=== step === cover
## Controlling the family-wise error rate

Today let's understand what happens to a familiar 5% risk once you stop running one test and start running twenty.

A crop-science lab is testing a new soil treatment against an untreated control. Instead of measuring one thing, the lab records 20 plant traits on the same plants: height, leaf count, root mass, chlorophyll content, and 16 others. Twelve plots get the treatment, twelve stay untreated, and every trait gets its own t-test at the usual alpha = 0.05.

That is 20 tests and 20 p-values. Here is what they look like, one point per trait, plotted against the 0.05 line each test was judged against.

::widget chart-plotter {"data":[{"x":1,"y":0.0027277,"fill":"below 0.05"},{"x":2,"y":0.0000891,"fill":"below 0.05"},{"x":3,"y":0.0000101,"fill":"below 0.05"},{"x":4,"y":0.0000004,"fill":"below 0.05"},{"x":5,"y":0.7267775,"fill":"at or above 0.05"},{"x":6,"y":0.0998812,"fill":"at or above 0.05"},{"x":7,"y":0.2353002,"fill":"at or above 0.05"},{"x":8,"y":0.8478614,"fill":"at or above 0.05"},{"x":9,"y":0.4069049,"fill":"at or above 0.05"},{"x":10,"y":0.9527592,"fill":"at or above 0.05"},{"x":11,"y":0.3470823,"fill":"at or above 0.05"},{"x":12,"y":0.3432309,"fill":"at or above 0.05"},{"x":13,"y":0.6836482,"fill":"at or above 0.05"},{"x":14,"y":0.5705312,"fill":"at or above 0.05"},{"x":15,"y":0.0365579,"fill":"below 0.05"},{"x":16,"y":0.6746173,"fill":"at or above 0.05"},{"x":17,"y":0.5833193,"fill":"at or above 0.05"},{"x":18,"y":0.4842908,"fill":"at or above 0.05"},{"x":19,"y":0.7563926,"fill":"at or above 0.05"},{"x":20,"y":0.6432733,"fill":"at or above 0.05"}],"geoms":["point"],"x":"trait","y":"p_value","code":{"point":"ggplot(df, aes(trait, p_value, color = group)) +\n  geom_point(size = 3) +\n  geom_hline(yintercept = 0.05, linetype = \"dashed\")"}}

Five of those twenty points land below the line. Whether that is five traits where the treatment genuinely worked, or something else entirely, is what the data underneath them will decide.

=== step === concept
## What a 5% risk per test becomes across 20 of them

Start with just one test. Setting alpha to 0.05 means accepting a 5% chance that this one test calls a difference real when none exists.

Now run 20 independent tests, each carrying that same 5% risk on its own. The risk for the family of 20 taken together does not stay at 5%, it compounds. The easiest way to see why is to flip the question around: what is the chance that none of the 20 tests throws a false alarm, then subtract that from 1.

The chance that one test stays quiet is 1 minus alpha, which is 0.95. The chance that all 20 stay quiet, assuming the tests are independent, is 0.95 raised to the 20th power. So the chance that at least one of the 20 throws a false alarm is 1 minus (1 minus alpha) to the power of 20.

Here is that worked out for a few family sizes.

```r
# How a 5% per-test risk compounds across k independent tests
alpha <- 0.05
k <- c(1, 5, 10, 20)
fwer <- 1 - (1 - alpha)^k
names(fwer) <- paste0("k=", k)
round(100 * fwer, 1)
#>  k=1  k=5 k=10 k=20 
#>  5.0 22.6 40.1 64.2 
```

At k = 1 the risk is just alpha, 5%. By k = 5 it has already climbed to 22.6%. At k = 10 it is 40.1%. By the time the crop trial's full set of 20 tests is counted, a family that started at a 5% risk per test carries a 64.2% chance that at least one of them throws a false alarm, even if the treatment does nothing at all, anywhere.

This quantity, the chance that a family of tests throws at least one false alarm when none of them should, has its own name: the family-wise error rate (FWER). Controlling it, instead of just the per-test alpha, is exactly what Bonferroni and Holm are built to do.

=== step === widget
## Simulating the climbing rate, and a first sign a correction works

Before trusting a formula, it helps to watch it happen. The widget below repeats the crop trial's situation thousands of times, in a world built so that nothing is real anywhere, exactly the case the formula above describes.

Start with "No correction" selected and drag k from 1 up to 20.

::widget multiplicity-sim {"corrections":["none","bonferroni","holm"],"kMax":20,"kStart":1,"alpha":0.05,"nStudies":5000,"seed":7}

With no correction, dragging k from 1 to 20 traces almost the same climbing curve the formula derived, ending close to the 64% it predicted. Now switch to Bonferroni or Holm with k still at 20, and watch that same share drop back down near alpha.

The widget's own R code underneath shows why both corrections land in the same place here. Under a genuinely true null, a test's p-value is Uniform(0, 1), meaning it is equally likely to fall anywhere between 0 and 1. Drawing k random numbers between 0 and 1, which is exactly what `runif(k)` does in that code, is the same experiment as running k null tests.

=== step === quiz
## Quick check: the inflated risk

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- About 5%, the same as the risk carried by any single one of the 20 tests. ::no
- About 64%, since 1 minus 0.95 raised to the 20th power works out close to two thirds. ::ok Right. 1 - (1 - 0.05)^20 = 0.642, the same number the formula gave two steps back and the simulation just reproduced: with 20 genuinely null tests, there is a 64% chance that at least one of them clears 0.05 by chance alone.
- Almost 100%, because with enough tests something is bound to cross 0.05 eventually. ::no
- It depends on which test statistic each of the 20 tests used. ::no Each test's own p-value lands uniformly between 0 and 1 when its null is true, whatever statistic produced it. So the chance that at least one of 20 independent null tests clears 0.05 depends only on alpha and k, through 1 - (1 - alpha)^k. That is exactly what the last two steps derived and then simulated.

=== step === concept
## The 20 traits, generated with true effects a researcher never sees

Until now the lab's 20 traits have been a black box: 20 p-values, five of them crossing 0.05, with no way to tell which of those five are genuine. In practice, no researcher gets to check the truth before running their tests. But because this is a simulation, the truth can be set up front and then checked against what the tests actually found.

Set the truth like this: traits 1 to 4 carry a real effect of 1.3 standard deviations from the treatment, and traits 5 through 20 carry no effect at all, the treatment changes nothing on those 16. Generate all 20 traits this way, 12 plots per group, and run a t-test on each one.

```r
# Simulate 20 plant traits: traits 1-4 carry a true effect of 1.3 SD, traits 5-20 carry none
set.seed(342)
n <- 12
k <- 20
effect <- 1.3

p_value <- numeric(k)
mean_gap <- numeric(k)
for (trait in 1:k) {
  true_effect <- if (trait <= 4) effect else 0
  control <- rnorm(n, mean = 0, sd = 1)
  treated <- rnorm(n, mean = true_effect, sd = 1)
  result <- t.test(treated, control)
  p_value[trait] <- result$p.value
  mean_gap[trait] <- mean(treated) - mean(control)
}

round(p_value, 4)
#>  [1] 0.0027 0.0001 0.0000 0.0000 0.7268 0.0999 0.2353 0.8479 0.4069 0.9528
#> [11] 0.3471 0.3432 0.6836 0.5705 0.0366 0.6746 0.5833 0.4843 0.7564 0.6433
```

Traits 1 through 4, the ones genuinely carrying the treatment effect, come back with by far the smallest p-values: 0.0027, 0.0001, and two so small they round to 0.0000 at four decimal places. Here are those last two with more decimal places, since rounding hides exactly how small they are.

```r
# Show those two tiny p-values with more decimal places than the rounded table above
signif(c(trait_3 = p_value[3], trait_4 = p_value[4]), 2)
#> trait_3 trait_4 
#> 1.0e-05 3.7e-07 
```

Trait 3's p-value is about 1 in 100,000, and trait 4's is smaller still. Both are among traits 1 to 4, exactly where the real effect was planted.

Now look back at the main table. Trait 15, one of the 16 traits with no real effect at all, rounds to 0.0366, comfortably under 0.05. That is the exact false alarm the opening scatter plot already showed, now with a name: trait 15. Here is how large a mean gap between its two groups produced that p-value.

```r
# The real mean gap between trait 15's two groups, the source of its false alarm
round(mean_gap[15], 3)
#> [1] -0.615
```

The treated plots on trait 15 averaged 0.615 less than the untreated ones, purely from which 12 plots happened to land in which group. Nothing about trait 15 responds to the treatment. The gap is luck, and this time luck was large enough to clear 0.05.

=== step === concept
## Bonferroni: make each test stricter by the number of tests

Bonferroni's fix is to make each individual test's bar stricter, by exactly the number of tests in the family. Instead of judging every one of the 20 p-values against 0.05, judge each one against alpha divided by k.

```r
# Compare the raw p-values against the flat Bonferroni cutoff, and against p.adjust's version
alpha <- 0.05
cutoff_bonf <- alpha / k
adj_bonf <- p.adjust(p_value, method = "bonferroni")

cutoff_bonf
#> [1] 0.0025

data.frame(trait = 1:k, raw_p = round(p_value, 4), adj_bonf = round(adj_bonf, 4), reject = adj_bonf < alpha)
#>    trait  raw_p adj_bonf reject
#> 1      1 0.0027   0.0546  FALSE
#> 2      2 0.0001   0.0018   TRUE
#> 3      3 0.0000   0.0002   TRUE
#> 4      4 0.0000   0.0000   TRUE
#> 5      5 0.7268   1.0000  FALSE
#> 6      6 0.0999   1.0000  FALSE
#> 7      7 0.2353   1.0000  FALSE
#> 8      8 0.8479   1.0000  FALSE
#> 9      9 0.4069   1.0000  FALSE
#> 10    10 0.9528   1.0000  FALSE
#> 11    11 0.3471   1.0000  FALSE
#> 12    12 0.3432   1.0000  FALSE
#> 13    13 0.6836   1.0000  FALSE
#> 14    14 0.5705   1.0000  FALSE
#> 15    15 0.0366   0.7312  FALSE
#> 16    16 0.6746   1.0000  FALSE
#> 17    17 0.5833   1.0000  FALSE
#> 18    18 0.4843   1.0000  FALSE
#> 19    19 0.7564   1.0000  FALSE
#> 20    20 0.6433   1.0000  FALSE
```

`p.adjust()` reaches the same comparison a different way. Instead of comparing the raw p-value to alpha / k, it multiplies the raw p-value by k and caps the result at 1, then compares that adjusted value to the plain alpha. Either way, the cutoff is the same 0.0025 printed above.

Bonferroni rejects traits 2, 3 and 4. Trait 1, with a raw p-value of 0.0027, narrowly fails the flat cutoff of 0.0025, even though trait 1 genuinely carries the treatment effect. And trait 15's false alarm, the one at 0.0366, is correctly left alone, its adjusted p-value of 0.7312 is nowhere near significant.

[NOTE]
Bonferroni is called conservative for exactly this reason. A cutoff this strict holds the family-wise error rate down reliably, but it can throw away a real effect that was only moderately strong, like trait 1.

=== step === concept
## Holm's step-down: the same guarantee, one threshold at a time

Holm's method keeps Bonferroni's guarantee on the family-wise error rate, but spends it more carefully. Instead of judging every p-value against the same flat alpha / k, it sorts the 20 p-values from smallest to largest and judges each one against a threshold that loosens as it works down the list.

Rank the smallest p-value first and compare it to alpha / k, exactly Bonferroni's cutoff. If it clears that bar, reject it and move to the next-smallest, now compared to alpha / (k - 1), one slot looser. Keep going, rank by rank, each threshold alpha / (k - rank + 1), until the first p-value fails to clear its threshold. Stop there. That p-value and every one ranked below it stays unrejected.

Build that step-down by hand on the trial's 20 p-values, then check it against R's own `p.adjust()`.

```r
# Build Holm's step-down by hand: sort p ascending, compare rank i to alpha/(k - i + 1), stop at first miss
ord <- order(p_value)
holm_reject <- logical(k)
for (i in 1:k) {
  trait <- ord[i]
  threshold <- alpha / (k - i + 1)
  if (p_value[trait] < threshold) {
    holm_reject[trait] <- TRUE
  } else {
    break
  }
}

data.frame(rank = 1:7, trait = ord[1:7], p = round(p_value[ord[1:7]], 5),
           threshold = round(alpha / (k - (1:7) + 1), 5), reject = holm_reject[ord[1:7]])
#>   rank trait       p threshold reject
#> 1    1     4 0.00000   0.00250   TRUE
#> 2    2     3 0.00001   0.00263   TRUE
#> 3    3     2 0.00009   0.00278   TRUE
#> 4    4     1 0.00273   0.00294   TRUE
#> 5    5    15 0.03656   0.00313  FALSE
#> 6    6     6 0.09988   0.00333  FALSE
#> 7    7     7 0.23530   0.00357  FALSE
```

Rank 1 is trait 4, far below its threshold of 0.0025, reject. Rank 2 is trait 3, below 0.00263, reject. Rank 3 is trait 2, below 0.00278, reject. Rank 4 is trait 1 at p = 0.00273, and by now the threshold has loosened to 0.00294, which 0.00273 clears, reject. That is the one Bonferroni's flat 0.0025 missed. Rank 5 is trait 15 at p = 0.03656, nowhere near its 0.00313 threshold. Stop here. Trait 15 and everything ranked below it stays unrejected.

```r
# Check the hand-built Holm result against R's own p.adjust
which(holm_reject)
#> [1] 1 2 3 4

adj_holm <- p.adjust(p_value, method = "holm")
which(adj_holm < alpha)
#> [1] 1 2 3 4
```

Both agree: Holm rejects traits 1, 2, 3 and 4, the complete set of real effects, and still leaves trait 15 alone.

[KEY INSIGHT]
Holm never rejects less than Bonferroni, and here it rejects strictly more, while still controlling the exact same family-wise error rate. There is no reason to prefer Bonferroni's flat cutoff once Holm's step-down is available.

=== step === widget
## What the extra power costs, and what it buys

Tally what each approach actually found, using nothing but the results already on this page.

With no correction, traits 1, 2, 3, 4 and 15 all cleared 0.05: 4 real effects found plus 1 false alarm. With Bonferroni, traits 2, 3 and 4 were rejected, trait 1 and trait 15 were not: 3 real effects found, 0 false alarms, but 1 real effect missed. With Holm, traits 1, 2, 3 and 4 were rejected, trait 15 was not: all 4 real effects found, 0 false alarms, nothing missed.

Here is that same tally as a chart.

::widget chart-plotter {"data":[{"x":"None","y":4,"fill":"real effect found"},{"x":"None","y":1,"fill":"false alarm"},{"x":"Bonferroni","y":3,"fill":"real effect found"},{"x":"Bonferroni","y":0,"fill":"false alarm"},{"x":"Holm","y":4,"fill":"real effect found"},{"x":"Holm","y":0,"fill":"false alarm"}],"geoms":["bar"],"x":"method","y":"count","code":{"bar":"ggplot(df, aes(factor(method), count, fill = group)) +\n  geom_col(position = \"dodge\")"}}

Holm recovers everything the uncorrected tests found among the real effects, while keeping the one correct exclusion Bonferroni also made. The cost Bonferroni pays, missing trait 1, buys nothing: Holm controls the exact same family-wise error rate and still catches that trait.

=== step === concept
## Confirmatory study or screen: which one decides the correction
::prose-only the contrast is carried entirely by the two columns below; no new computation is needed

Everything so far has treated the crop trial as settled: 20 specific traits, chosen before the data arrived, with the question being whether the treatment moved any of them. That is a confirmatory study. A false "yes" anywhere in that family, like trait 15, is the exact mistake that controlling the family-wise error rate exists to prevent.

Not every study looks like that. A lab screening 5,000 genes for a disease link, planning to retest whatever looks promising later, is a screen. There, the costly mistake runs the other way: missing a gene that was genuinely linked, because the correction held the bar so high that only the most obvious signals survived.

| | Confirmatory study (the crop trial) | Screen (a gene scan) |
|---|---|---|
| Hypotheses | A small, fixed set, decided before the data arrived | Thousands of candidates, tested at once |
| The costly mistake | A false "yes": calling a treatment effective when it does nothing | A false "no": missing a candidate that was genuinely linked |
| Family-wise control | Right fit. Holm correctly held trait 15 back while still catching every real effect | Wrong fit. Demanding the same guarantee on 5,000 tests buries real leads under a bar built for a much smaller family |

=== step === quiz
## Quick check: the right goal

The crop trial's own tally already settled this: Holm found all 4 real effects and 0 false alarms there. Now change the setting.

"A lab screens 5,000 genes for any disease link, planning to retest promising ones later. Is Bonferroni's family-wise control the right goal there too?"

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Yes, controlling the family-wise error rate is always the right goal, no matter how many genes are screened. ::no
- No, because missing a true lead is the costly mistake in a screen like this one, not a false lead that just costs one wasted follow-up test. ::ok Right. A screen like this retests anything promising, so a false lead costs one wasted follow-up test, while a missed true lead is gone for good. That is the opposite of the crop trial, where a false "yes" was the costly mistake, exactly what Holm was built to hold down.
- No, Bonferroni specifically should never be used, though some other family-wise correction would fit here instead. ::no
- Yes, but only once the number of genes screened gets small enough. ::no Controlling the family-wise error rate fits a confirmatory study, where a false "yes" is the costly mistake, which is the crop trial from the last few steps. A screen's costly mistake runs the other way: missing a true lead that never gets the follow-up test it needed. How many candidates are screened does not change which mistake is costly, only how painful holding the family-wise rate down becomes.

=== step === tryit
## Your turn: apply Holm to Bonferroni's p-values

`p_value` still holds the trial's 20 p-values from a few steps back. The code below adjusts them with Bonferroni, the same correction used there. Change the method to Holm's and see which trait gets newly flagged.

```r
# Apply a p.adjust correction to the trial's p-values and see which traits are flagged
adjusted <- p.adjust(p_value, method = "bonferroni")
which(adjusted < alpha)
```
::check {"regex": "method\\s*=\\s*\"holm\"", "gate": true, "difficulty": "intermediate", "ok": "Right. Holm flags trait 1 as well (adjusted p = 0.0464, just under 0.05), the one real effect Bonferroni's flat cutoff missed. Both still leave trait 15 alone.", "no": "Change \"bonferroni\" to \"holm\" inside p.adjust, keep everything else the same, and run it again."}
::solution
```r
# Apply a p.adjust correction to the trial's p-values and see which traits are flagged
adjusted <- p.adjust(p_value, method = "holm")
which(adjusted < alpha)
#> [1] 1 2 3 4
```

Trait 1 is now in the list, alongside 2, 3 and 4. Bonferroni's version only had 2, 3 and 4.

=== step === concept
## References
::prose-only a source list carries no runnable example

- [Bonferroni correction](https://en.wikipedia.org/wiki/Bonferroni_correction) - Bonferroni, C. E. (1936), "Teoria statistica delle classi e calcolo delle probabilita." The union-bound argument behind the flat alpha / k cutoff in the Bonferroni step.
- [Holm-Bonferroni method](https://en.wikipedia.org/wiki/Holm%E2%80%93Bonferroni_method) - Holm, S. (1979), "A Simple Sequentially Rejective Multiple Test Procedure," Scandinavian Journal of Statistics, 6(2), 65 to 70. The step-down procedure built by hand a few steps back.
- [Multiple Hypothesis Testing](https://doi.org/10.1146/annurev.ps.46.020195.003021) - Shaffer, J. P. (1995), Annual Review of Psychology, 46, 561 to 584. A survey of family-wise error rate control and its alternatives.
- [p.adjust documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html) - R Core Team. The function behind the Bonferroni and Holm adjustments used throughout this lesson.
- [Controlling the False Discovery Rate](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x) - Benjamini, Y. and Hochberg, Y. (1995), Journal of the Royal Statistical Society, Series B, 57(1), 289 to 300. The alternative built for a screen, named earlier when contrasting a confirmatory study against a screen.

=== step === complete
## Twenty tests, one false alarm, and the correction that found it anyway

Twenty traits, each tested at a per-test alpha of 0.05, carried a 64.2% chance that at least one would clear 0.05 even if nothing in the whole trial was real. The simulation confirmed it, and the trial's own data showed exactly that kind of false alarm sitting at trait 15.

- The raw count: 4 real effects, traits 1 to 4, and 1 false alarm, trait 15, cleared 0.05 out of 20.
- Bonferroni's flat alpha / 20 cutoff pulled the false-alarm rate back near 5%, but it also missed trait 1, the weakest of the four real effects.
- Holm's step-down held the same guarantee and still caught trait 1, matching the uncorrected hit rate on real effects while keeping trait 15 excluded.
- Which correction is even worth reaching for depends on the question: a confirmatory study, like this crop trial, calls for controlling the family-wise error rate; a screen calls for something else.

The next part of this course builds that something else: a correction designed for exactly the screen's version of the problem, one that controls not whether any false lead slips through, but what fraction of the flagged ones are wrong.

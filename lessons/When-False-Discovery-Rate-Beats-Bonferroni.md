---
title: "ANOVA and Multiple Comparisons Lesson 7: When false discovery rate beats Bonferroni"
catalog_blurb: "Why a gene screen should flag more candidates than Bonferroni ever lets through."
description: "A gene screen shows Bonferroni catching only 28% of 200 real effects while Benjamini-Hochberg catches 85.5%, and the honest cost that extra catch carries."
keywords: "false discovery rate, Benjamini-Hochberg, Bonferroni correction, multiple testing, p.adjust, family-wise error rate, gene expression screen, multiplicity correction"
post_type: "LESSON"
curriculum_id: "4.50.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "7"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "Marginal-Means-You-Can-Actually-Report.html"
course_prev: "Controlling-the-Family-Wise-Error-Rate.html"
---

=== step === cover
## When false discovery rate beats Bonferroni

Today let's look at a correction built for a different kind of problem: not one confirmatory test, but a screen hunting for as many real effects as it can find among thousands of candidates.

A lab has run a two-sample t-test on each of 1,000 genes, checking whether a new drug shifted how active that gene is. That is 1,000 p-values, one per gene. Here are five of them, picked from the list.

::widget styled-table {"cols":["gene","p_value"],"rows":[["Gene 3","0.00018"],["Gene 45","0.0035"],["Gene 205","0.766"],["Gene 530","0.215"],["Gene 998","0.975"]],"title":"Five of the 1,000 tests","note":"p-values from a two-sample t-test per gene"}

Look at gene 205's p-value, 0.766, next to gene 3's, 0.00018. On their own, five numbers like these do not say which genes the lab should flag as real. Deciding that, out of all 1,000, is exactly what this lesson works out, using two rules that each guarantee something different.

=== step === concept
## Why testing many things at once multiplies your error rate

Before getting to the lab's full screen, it helps to see why running many tests at once is dangerous in the first place. That danger is exactly what Bonferroni was built to fix.

Say you run one test at the usual alpha of 0.05. If nothing is really going on, there is still a 5% chance that one test comes back significant, purely by chance. Now run k of those tests, each one independent and each one carrying that same 5% risk on its own. The chance that at least one of the k comes back significant, even though none of them are real, is 1 minus the chance that every single one of them stays quiet: 1 - (1 - alpha)^k.

```r
# How a 5% per-test risk compounds as the number of independent tests grows
alpha <- 0.05
k <- c(1, 5, 10, 20, 30, 1000)
fwer <- 1 - (1 - alpha)^k
names(fwer) <- paste0("k=", k)
round(100 * fwer, 1)
#>    k=1    k=5   k=10   k=20   k=30 k=1000 
#>    5.0   22.6   40.1   64.2   78.5  100.0 
```

At k = 1 that risk is just alpha, 5%. By k = 20 it has already climbed past 64%. And at k = 1,000, the scale of the lab's actual screen, it is essentially a certainty: some test will cross 0.05 by pure luck, even if the drug does nothing anywhere.

Bonferroni's fix is to make every individual test stricter by exactly the number of tests in the family. Instead of comparing each p-value to alpha, it compares each one to alpha divided by k. Judge the smallest p-value against a bar that strict, and the chance that any of them clears it by pure luck drops back down to about alpha.

The widget below lets you watch that happen. It simulates a world where nothing is real anywhere, exactly the case the formula above describes, and counts how often at least one test still clears the bar. Start with "No correction" and drag k up from 1, then switch to Bonferroni with k left where it is.

::widget multiplicity-sim {"corrections":["none","bonferroni"],"kMax":30,"kStart":1,"alpha":0.05,"nStudies":5000,"seed":7}

With no correction, the share climbs toward the number the formula predicted. Switch to Bonferroni, and it drops back down near alpha, whatever k is set to. The widget's own R code underneath runs the same idea directly: draw k random numbers between 0 and 1 with runif(k), which is exactly what a p-value looks like under a true null, and check whether the smallest one clears the bar.

[NOTE]
This widget only models a world where every test is testing a true null, nothing real anywhere. The lab's actual screen is not like that: 200 of its 1,000 genes genuinely respond to the drug. The widget's job is just to make the multiplying danger, and Bonferroni's fix for it, concrete before the real screen arrives next.

=== step === concept
## A screen where 200 of the 1,000 tests are real

Now build the lab's actual screen. Out of the 1,000 genes, 200 genuinely respond to the drug, a real effect of size 1.1 on Cohen's d, the gap between the two group means measured in standard deviations. The other 800 do not respond at all: their treated and control groups are drawn from the exact same distribution, so any difference between them is pure noise. Every gene gets a two-sample t-test, with 25 lab samples per group.

```r
# Simulate a 1,000-gene screen: 200 genes carry a real effect, 800 do not
set.seed(42)
m <- 1000
n_real <- 200
n_null <- 800
n <- 25
delta <- 1.1

p_real <- numeric(n_real)
for (gene in 1:n_real) {
  control <- rnorm(n, mean = 0, sd = 1)
  treated <- rnorm(n, mean = delta, sd = 1)
  p_real[gene] <- t.test(control, treated)$p.value
}

p_null <- numeric(n_null)
for (gene in 1:n_null) {
  control <- rnorm(n, mean = 0, sd = 1)
  treated <- rnorm(n, mean = 0, sd = 1)
  p_null[gene] <- t.test(control, treated)$p.value
}

p <- c(p_real, p_null)
truth <- c(rep(TRUE, n_real), rep(FALSE, n_null))
table(truth)
#> truth
#> FALSE  TRUE 
#>   800   200 
```

`truth` is something no real lab ever gets to see: which genes actually respond, known here only because this is a simulation. It is what lets this lesson measure, honestly, what each method catches and what it misses later on. `p` holds all 1,000 p-values, the 200 real-effect genes first, then the 800 that do nothing.

Plot all 1,000 of them as a histogram, in bins 0.05 wide.

```r
# Plot the 1,000 p-values as a histogram, with bins 0.05 wide
h <- hist(p, breaks = seq(0, 1, 0.05),
          main = "1,000 p-values from the gene screen",
          xlab = "p-value", col = "grey85", border = "white")
h$counts[1]
#> [1] 230
```

230 of the 1,000 p-values land in that first bar, under 0.05. If every one of the 1,000 genes were doing nothing, the kind of true-null-only world the widget simulated a moment ago, you would expect only about 1,000 x 0.05 = 50 of them under 0.05 by chance alone. 230 is more than four times that, and the spike at the left edge of the histogram is the reason: the 200 real effects are pulling their p-values down near zero, piled on top of whatever chance false alarms the 800 null genes still produce on their own.

=== step === concept
## What Bonferroni finds on this screen, and what it misses

Apply Bonferroni's fix to the full screen. Bonferroni compares every one of the 1,000 p-values to alpha divided by 1,000, instead of to alpha.

```r
# Compare each of the 1,000 p-values to Bonferroni's flat cutoff, alpha / 1,000
alpha <- 0.05
sig_bonf <- p.adjust(p, method = "bonferroni") < alpha
sum(sig_bonf)
#> [1] 56
sum(sig_bonf & truth)
#> [1] 56
sum(sig_bonf & !truth)
#> [1] 0
sum(truth) - sum(sig_bonf & truth)
#> [1] 144
```

Bonferroni flags 56 genes, and every single one of them is a real effect: zero false positives, exactly the guarantee it holds. But look at the cost. 56 out of 200 real effects is only 28%. The other 144 genes that genuinely respond to the drug get no flag at all, because none of their p-values are small enough to clear a bar as strict as alpha / 1,000 = 0.00005.

[NOTE]
Bonferroni is not broken here. It is doing exactly what it was built to do: hold the chance of even one false alarm, anywhere across the 1,000 tests, down near 5%. The price for that guarantee, on a screen this size, is missing most of the real effects.

=== step === concept
## A different guarantee: the false discovery rate
::prose-only the contrast is a definition, not a computation; the numbers arrive once Benjamini-Hochberg is built two steps from here

Bonferroni's guarantee has a name: the family-wise error rate, the chance that even one false alarm shows up anywhere in the whole family of tests. Holding that down is the right goal when a single wrong flag would be costly. But on a screen like this one, where the real question is how many of the 200 real effects you can find before you follow up on them, that guarantee gets in the way more than it helps.

There is a different guarantee you can make instead, built around a different question. Instead of asking what the chance is that any flag anywhere is wrong, ask what fraction of the genes you do flag turn out to be wrong. That second quantity has its own name: the false discovery rate, or FDR.

A method that targets a 5% false discovery rate does not guarantee zero false alarms. It guarantees that, on average, about 5% of whatever list it hands back will be wrong. In exchange for accepting that known, bounded fraction of wrong flags, it can afford to flag far more candidates, and catch far more of the real ones, than a method built to avoid any false alarm at all.

=== step === concept
## Benjamini-Hochberg by hand: sorting and a sliding threshold

The method built around that guarantee is called Benjamini-Hochberg, named for the two statisticians who derived it in 1995. Here is exactly how it decides which genes to flag, worked by hand.

First, sort all 1,000 p-values from smallest to largest. A p-value's position in that sorted order is its rank, so the smallest p-value gets rank 1 and the largest gets rank 1,000.

Then, instead of comparing every p-value to the same fixed bar the way Bonferroni does, compare the p-value at rank i to a threshold that grows with its rank: (i / 1,000) x 0.05. Rank 1's threshold is tiny, (1 / 1,000) x 0.05 = 0.00005, the same as Bonferroni's flat cutoff. But rank 500's threshold is (500 / 1,000) x 0.05 = 0.025, five hundred times looser.

Here are the 10 smallest p-values from the lab's screen, sorted, next to their own threshold.

::widget styled-table {"cols":["rank","p_value","threshold","decision"],"rows":[["1","5.10e-08","0.00005","flagged"],["2","5.35e-08","0.0001","flagged"],["3","1.49e-07","0.00015","flagged"],["4","1.89e-07","0.0002","flagged"],["5","2.03e-07","0.00025","flagged"],["6","2.76e-07","0.0003","flagged"],["7","3.60e-07","0.00035","flagged"],["8","7.79e-07","0.0004","flagged"],["9","1.19e-06","0.00045","flagged"],["10","1.80e-06","0.0005","flagged"]],"title":"The 10 smallest p-values, sorted","note":"threshold = (rank / 1,000) x 0.05"}

Every one of these 10 p-values clears its own threshold easily, from rank 1's 5.10e-08 against a threshold of 0.00005, down to rank 10's 1.80e-06 against 0.0005. And every one of these 10 genes is, in truth, one of the 200 that genuinely responds to the drug. That is no surprise: the smallest p-values in any screen tend to belong to the genes with the strongest evidence against the null, and a real effect produces that kind of evidence most reliably.

=== step === concept
## Finding where the line crosses: the BH cutoff

Keep moving down the sorted list, rank by rank, each p-value compared to its own growing threshold. At some point the p-values stop clearing their threshold, because the threshold keeps growing in a straight line while a real effect's p-value is not guaranteed to shrink just as fast. Benjamini-Hochberg's rule is simple once you see it stated this way: find the largest rank where the p-value still clears its threshold, and flag that gene and every gene ranked above it.

On the lab's screen, here is exactly where that crossing happens.

::widget styled-table {"cols":["rank","p_value","threshold","decision"],"rows":[["176","0.00775","0.00880","flagged"],["177","0.00781","0.00885","flagged"],["178","0.00882","0.00890","flagged"],["179","0.00943","0.00895","not flagged"],["180","0.00970","0.00900","not flagged"],["181","0.01012","0.00905","not flagged"]],"title":"Where the line crosses","note":"rank 178 is the last rank that clears its own threshold"}

Rank 178's p-value, 0.0088, clears its threshold of 0.0089. Rank 179's p-value, 0.0094, misses its threshold of 0.00895. Once a rank fails to clear its own threshold, Benjamini-Hochberg does not keep checking further down the list for one that might still pass: rank 178 is the cutoff, and every gene ranked 179 or below stays unflagged, no matter how small some of their individual p-values might look.

[KEY INSIGHT]
This sort-then-slide pattern is why Benjamini-Hochberg can flag so many more genes than Bonferroni without losing that guarantee. Almost all of the flagged list sits at ranks with p-values far below even their own loose threshold. Only the crossing point right at the boundary, like ranks 178 and 179 here, actually gets decided close to the wire.

=== step === quiz
## Quick check: which ranks does Benjamini-Hochberg flag

At rank 100 in the sorted list of the lab's 1,000 p-values, the p-value is 0.00034. Does Benjamini-Hochberg flag this gene?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- No, because 0.00034 is bigger than Bonferroni's fixed cutoff, alpha / 1,000 = 0.00005. ::no
- Yes, because 0.00034 clears this rank's own threshold, (100 / 1,000) x 0.05 = 0.005. ::ok Right. Benjamini-Hochberg compares each ranked p-value to (rank / 1,000) x 0.05, not to one fixed cutoff. At rank 100 that threshold is 0.005, and 0.00034 is comfortably under it, so this gene is flagged, well inside the cutoff rank for the whole screen.
- No, Benjamini-Hochberg only flags genes among the 10 smallest p-values on the list. ::no
- It depends on how many of the other 999 p-values are also small. ::no No. Once the 1,000 p-values are sorted, the threshold at each rank is fixed at (rank / 1,000) x 0.05 and does not depend on any other p-value. The threshold at rank 100 is (100 / 1,000) x 0.05 = 0.005, and its p-value, 0.00034, clears it easily. Comparing it instead to the flat alpha / 1,000 = 0.00005 cutoff, the way the first option here does, is the wrong comparison: that fixed bar belongs to Bonferroni, not to the rank-based one Benjamini-Hochberg actually uses.

=== step === concept
## Running BH on the full screen, and reading its cost

Rather than sorting and comparing by hand for all 1,000 genes, check the hand-worked sort-and-threshold rule against R's own `p.adjust()`, then read what Benjamini-Hochberg actually bought on this screen.

```r
# Sort the 1,000 p-values, then find the largest rank that clears its own BH threshold
p_sorted <- sort(p)
m <- length(p_sorted)
q <- 0.05
threshold <- (1:m / m) * q
cutoff_rank <- max(which(p_sorted <= threshold))
cutoff_rank
#> [1] 178

# Check the hand-built cutoff against R's own BH adjustment
sig_bh <- p.adjust(p, method = "BH") < alpha
sum(sig_bh)
#> [1] 178
```

Both routes land on the same 178 genes. Now check those 178 against the ground truth.

```r
# How many of the flagged genes are real, and how many are not
sum(sig_bh & truth)
#> [1] 171
sum(sig_bh & !truth)
#> [1] 7

# Recall against Bonferroni, and the realized false discovery proportion
round(100 * sum(sig_bh & truth) / n_real, 1)
#> [1] 85.5
round(100 * sum(sig_bonf & truth) / n_real, 1)
#> [1] 28
round(sum(sig_bh & !truth) / sum(sig_bh), 4)
#> [1] 0.0393
```

171 of BH's 178 flagged genes are real, which is 85.5% of all 200 real effects on the screen. Bonferroni, on the exact same data, caught only 28%. The other 7 flagged genes are not real: a realized false discovery proportion of 7 / 178, 3.9%, comfortably under the 5% Benjamini-Hochberg is built to hold on average.

Stated plainly, those 7 genes will get followed up on in the lab as if they were real, and they are not. That is the honest cost of the false discovery rate's guarantee. In exchange, 171 real effects reach follow-up that Bonferroni's flat cutoff would have buried.

=== step === concept
## When each guarantee is the honest one
::prose-only the decision rule follows directly from the costs already measured in steps 4 and 9; no new computation is needed

Two guarantees, two honest answers to two different questions. Control the family-wise error rate when a single wrong claim would be costly on its own: the one comparison a regulator reads, the one pivotal result a paper's whole conclusion rests on. A false yes there is the mistake that matters, and Bonferroni, or its less conservative cousin Holm, is built to hold that down.

Control the false discovery rate when you are running many tests at once, expecting a real subset among them, and planning to follow up on whatever gets flagged anyway: a genomics screen like this one, or a dashboard checking thousands of metrics overnight for something worth a closer look. There, a handful of wrong flags is an acceptable cost for catching most of the real ones, because the follow-up step catches the wrong flags anyway, and missing a true lead for good is the costlier mistake.

=== step === quiz
## Your turn: which error rate does this study need

Two new studies come in on the same day. A clinical trial team has one pre-registered endpoint: if it gets published as a real finding and it is wrong, no one downstream will catch the mistake. Across the hall, a marketing team has run a dashboard comparing 5,000 campaign-and-segment combinations overnight. It flags a few hundred that look promising, and plans to test every flagged one properly before spending real money on it.

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Both studies should control the family-wise error rate: it is the stricter guarantee, and the stricter guarantee is always the safer choice. ::no
- The clinical trial should control the family-wise error rate, since one wrong claim there would be costly. The dashboard screen should control the false discovery rate, since it already plans to retest every flagged lead. ::ok Right. The clinical trial has one pre-registered claim a regulator will read on its own, so a false yes there is the costly mistake, exactly what the family-wise error rate controls. The dashboard screen expects a real subset among 5,000 candidates and retests whatever it flags, so a false discovery rate target lets it catch more real leads at the cost of a known, bounded fraction of wrong ones among those it was going to retest anyway.
- Both studies should control the false discovery rate: it is simply a bigger alpha, so it finds more real effects everywhere. ::no
- The clinical trial should control the false discovery rate, and the dashboard screen should control the family-wise error rate, because a screen that large needs the stricter guarantee. ::no No. The family-wise error rate is not simply the stricter guarantee reserved for big screens. It fits the clinical trial because a single wrong claim there is the costly mistake. The false discovery rate is not a bigger alpha either: it is a different guarantee about what fraction of a flagged list is wrong, and it fits the 5,000 comparisons on the dashboard because whatever gets flagged there is retested anyway.

=== step === tryit
## Your turn: find the Benjamini-Hochberg cutoff in code

`p_sorted` and `m` still hold the screen's 1,000 p-values, sorted smallest to largest, and their count. The code below compares every p-value to the same fixed bar, which is Bonferroni's idea. Change it to Benjamini-Hochberg's own rank-based threshold instead, and find the cutoff rank.

```r
# p_sorted and m already hold the screen's sorted p-values and their count
q <- 0.05

# This compares every p-value to the same fixed bar, Bonferroni's idea, not BH's.
# Change it to Benjamini-Hochberg's own rank-based threshold instead.
threshold <- q / m
cutoff_rank <- max(which(p_sorted <= threshold))
cutoff_rank
```
::check {"regex": "max\\s*[(]\\s*which\\s*[(]\\s*p_sorted\\s*<=\\s*[(]?\\s*1\\s*:\\s*m\\s*/\\s*m\\s*[)]?\\s*\\*\\s*q", "gate": true, "difficulty": "intermediate", "ok": "Right. cutoff_rank comes back as 178, matching both the hand-worked sorted table and the BH result from p.adjust().", "no": "Build the Benjamini-Hochberg threshold as (1:m / m) * q, one value per rank, compare p_sorted to it instead of a single fixed bar, and take the largest rank where that still holds with max(which(...))."}
::solution
```r
# p_sorted and m already hold the screen's sorted p-values and their count
q <- 0.05

threshold <- (1:m / m) * q
cutoff_rank <- max(which(p_sorted <= threshold))
cutoff_rank
#> [1] 178
```

178, the same cutoff rank as both the hand-worked table and `p.adjust(p, method = "BH")`.

=== step === concept
## References
::prose-only a source list carries no runnable example

- [Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x) - Benjamini, Y. and Hochberg, Y. (1995), Journal of the Royal Statistical Society, Series B, 57(1), 289 to 300. The paper behind the sort-and-slide rule built by hand in this lesson.
- [p.adjust documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html) - R Core Team. The function behind both the Bonferroni and BH adjustments used throughout.
- [A Direct Approach to False Discovery Rates](https://doi.org/10.1111/1467-9868.00346) - Storey, J. D. (2002), Journal of the Royal Statistical Society, Series B, 64(3), 479 to 498. An alternative estimate of the false discovery rate, built from the same idea.
- [Multiple Comparisons Among Means](https://doi.org/10.1080/01621459.1961.10482090) - Dunn, O. J. (1961), Journal of the American Statistical Association, 56(293), 52 to 64. An early source for the flat per-test correction Bonferroni's name is now attached to.

=== step === complete
## What to carry forward

Two corrections, run on the identical 1,000-gene screen, guaranteed two different things and delivered two different results.

- Bonferroni controls the family-wise error rate, the chance that even one false alarm shows up anywhere. It flagged 56 genes here, every one real, but caught only 28% of the 200 genes that genuinely respond.
- Benjamini-Hochberg controls the false discovery rate, the fraction of the flagged list that is wrong. It flagged 178 genes, 85.5% of the real effects, at the cost of 7 genes that are not real.
- Which one to reach for depends on what a false flag costs: a single confirmatory claim calls for the family-wise error rate, a screen that expects to follow up on whatever it flags calls for the false discovery rate.

The next time a pile of p-values lands on your desk, the first question worth asking is not which function to call. It is which of these two guarantees the situation actually needs.

---
title: "ANOVA post-hoc tests: Tukey vs Bonferroni"
slug: "Which-Test-Mini-6"
description: "A significant ANOVA never says which groups differ. Build Tukey and Bonferroni on one four-warehouse dataset, and learn which one your study has earned."
keywords: "ANOVA post-hoc tests, Tukey vs Bonferroni, Tukey HSD, Bonferroni correction, TukeyHSD in R, pairwise comparisons, family-wise error rate, multiple comparisons"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "6"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-5"
course_next: ""
curriculum_id: "0.0.38"
lesson_access: "windowed"
catalog_blurb: "Which pairs of groups actually differ, and which correction you have earned."
---

=== step === cover
::eyebrow Which Test Do I Run?
## ANOVA post-hoc tests: Tukey vs Bonferroni

Nandini runs an online store that ships from four warehouses: Chennai, Bengaluru, Hyderabad and Pune. Complaints about slow delivery keep piling up, so she pulls thirty orders from each hub and writes down how many hours each parcel took to arrive.

Then she runs an ANOVA on the four groups of delivery times. It comes back at F = 9.02, with a p-value of 0.00002.

She takes that to her operations lead, who asks the one question everybody actually cares about: so which warehouse is the slow one?

And the ANOVA has nothing to say.

All a significant F says is that the four averages are not all equal. It does not name a hub and it does not name a pair, and no amount of staring at it will make it do so. A significant ANOVA leaves the sentence half finished.

Finishing it is a separate job with its own rules. The moment you start comparing hubs two at a time you are running six tests instead of one, and six tests at five percent each do not come to five percent overall.

Post-hoc tests are for that job, and the two names you meet first are Tukey and Bonferroni. Here is the shape of what they do.

::widget process-flow {"steps":[{"title":"A significant F","sub":"the four hub averages are not all equal, and that is all"},{"title":"Six pair comparisons","sub":"four hubs make six pairs, six chances of a false alarm"},{"title":"Hold the set at 5%","sub":"raise the bar every pair clears, so the set stays at 5%"}]}

That is the whole shape of it. Everything from here is doing it on Nandini's four hubs, and then finding out which of the two corrections her study has actually earned.

=== step === concept
## The four warehouses and the F that started this

Let's get her numbers on the table first, because every calculation from here runs off them.

Thirty orders came from each of the four hubs, and for every order we have the delivery time in hours. Press Run.

```r
# Build the 120 delivery times and read the four hub averages
set.seed(292)

deliveries <- data.frame(
  hub = factor(rep(c("Chennai", "Bengaluru", "Hyderabad", "Pune"), each = 30),
               levels = c("Chennai", "Bengaluru", "Hyderabad", "Pune")),
  hours = round(c(rnorm(30, 42, 6),      # Chennai
                  rnorm(30, 38, 6),      # Bengaluru
                  rnorm(30, 41, 6),      # Hyderabad
                  rnorm(30, 36, 6)),     # Pune
                1)
)

round(tapply(deliveries$hours, deliveries$hub, mean), 2)
#>   Chennai Bengaluru Hyderabad      Pune
#>     42.52     38.66     41.02     34.91
```

`set.seed(292)` just fixes the random draws, so your 120 delivery times are the same 120 as mine. `tapply()` then splits the hours by hub and takes the mean of each group.

Chennai averages 42.52 hours and Pune 34.91, a gap of about seven and a half hours. Bengaluru and Hyderabad sit in between. Whether four averages spread that far apart are worth acting on is exactly what the ANOVA answers.

```r
# Run the one-way ANOVA on delivery hours across the four hubs
fit <- aov(hours ~ hub, data = deliveries)
summary(fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)
#> hub           3    991   330.2   9.021 2.03e-05 ***
#> Residuals   116   4247    36.6
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Read the F value first. It is 9.021, on 3 and 116 degrees of freedom. The 3 is four hubs minus one, and the 116 is 120 orders minus the four hub averages the model had to estimate. The p-value beside it is 0.0000203, so if all four warehouses really delivered at the same average speed, four group means spread this far apart would turn up about twice in every hundred thousand studies.

So the four hubs are not all the same. And that is exactly where the ANOVA stops talking.

=== step === concept
## What happens if you just t-test all six pairs

Four hubs make `choose(4, 2)` = 6 pairs: Bengaluru against Chennai, Hyderabad against Chennai, Pune against Chennai, Hyderabad against Bengaluru, Pune against Bengaluru, and Pune against Hyderabad.

So the obvious move is to t-test all six and report whichever ones come in under 0.05. `pairwise.t.test()` does exactly that, and setting `p.adjust.method = "none"` tells it to hand back the raw p-values with nothing done to them.

```r
# Compare all six pairs of hubs with plain t-tests and no correction at all
raw_matrix <- pairwise.t.test(deliveries$hours, deliveries$hub,
                              p.adjust.method = "none")
raw_matrix
#>
#> 	Pairwise comparisons using t tests with pooled SD
#>
#> data:  deliveries$hours and deliveries$hub
#>
#>           Chennai Bengaluru Hyderabad
#> Bengaluru 0.01493 -         -
#> Hyderabad 0.33790 0.13414   -
#> Pune      3.5e-06 0.01787   0.00016
#>
#> P value adjustment method: none
```

The output is a lower triangle, and you read a cell by pairing its row hub with its column hub. Bengaluru against Chennai is 0.01493. Pune against Chennai is 0.0000035. Pune against Bengaluru is 0.01787, and Pune against Hyderabad is 0.00016.

Four of the six comparisons clear 0.05.

If Nandini stops here, she walks into the operations review with four slow-hub findings. That is more than this data can support. Let's see why.

=== step === widget
## How often does something look real when nothing is

Here is the trouble with running six tests and reading each one at 0.05.

That 0.05 is a promise about a single test. If two hubs really do deliver at the same speed, a test on them will still call them different about 5% of the time, purely by luck. That is the false-alarm rate you agreed to when you picked the threshold.

The promise is per test. It was never a promise about the set.

Run k independent tests where nothing at all is real, and each one keeps its own 5% chance of a false alarm. The chance a given test stays silent is 0.95, the chance all k of them stay silent is 0.95 raised to the power k, so the chance that at least one of them goes off is

\[ 1 - (1 - \alpha)^k \]

where alpha is the per-test threshold, 0.05 here. At three tests that comes to 14.3%. At six it is 26.5%. At ten it is 40.1%. That chance of at least one false positive anywhere in the whole set is called the **family-wise error rate**, and the set of comparisons is the family.

Drag the slider below and watch it climb. It starts at k = 6, which is Nandini's six pairs.

::widget multiplicity-sim {"kMax": 20, "kStart": 6, "alpha": 0.05, "nStudies": 4000, "seed": 29, "corrections": ["none", "bonferroni"]}

The top panel runs 4,000 simulated studies in which nothing is real anywhere, so every significant result in there is a false alarm by construction. At k = 6 with no correction, 25.8% of those studies threw up at least one p-value under 0.05, right on the 26.5% the formula predicted. The bottom panel opens one of those studies and lays its six p-values out as ticks, and the shaded band is what counts as significant.

Now press Bonferroni. The band narrows to 0.05 divided by 6, and the share of studies with any false positive falls back to 4.8%, which is the 5% you meant to be running at the whole time.

That read-out also mentions Holm, which is a stepwise cousin of Bonferroni. When nothing whatsoever is real the two behave the same way, because both of them reject something only if the smallest p-value in the family clears alpha over k.

[KEY INSIGHT]
A correction changes no data and moves no group mean. It raises the bar each comparison has to clear, so that the error rate for the whole family stays at 5% instead of the per-test 5% compounding across the set.

=== step === quiz
## Quick check: what does the family-wise error rate count?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The chance that one particular pair of hubs gets called different when it is not. ::no
- The share of the six comparisons that will come back wrong. ::no
- The chance of at least one false positive anywhere across the whole set of comparisons. ::ok Exactly. It is a property of the set, not of any single pair, which is why it climbs as you add comparisons even though nothing about any individual test has changed.
- The chance that the ANOVA itself was wrong about the four averages. ::no The family-wise error rate is about the set of pairwise comparisons you run after the ANOVA, and it counts studies with at least one false positive, not the fraction of comparisons that go wrong. A single pair keeps its own 5%, and running six of them is what pushes the set to 26.5%.

=== step === concept
## Bonferroni: divide 0.05 by the number of comparisons

Bonferroni is the simplest correction there is, and it is one line of arithmetic.

You have k comparisons and you want the family to keep its 5%. So instead of judging each comparison against 0.05, judge it against 0.05 divided by k. With six pairs that bar is 0.05 / 6 = 0.00833. A pair now has to be a good deal more surprising than before to count.

There is a second way of saying the very same thing, and it is the one R prefers: leave the threshold at 0.05 and multiply each raw p-value by k, capping the result at 1 because no probability can go above 1. Comparing p times k against 0.05 and comparing p against 0.05 over k are the same comparison written two ways.

Let's do both on Nandini's numbers. First pull the six raw p-values out of that matrix into a plain named vector, which is easier to work with than a triangle.

```r
# Collect the six raw p-values, then apply Bonferroni in its two equal forms
raw_p <- c(
  "Bengaluru-Chennai"   = raw_matrix$p.value["Bengaluru", "Chennai"],
  "Hyderabad-Chennai"   = raw_matrix$p.value["Hyderabad", "Chennai"],
  "Pune-Chennai"        = raw_matrix$p.value["Pune", "Chennai"],
  "Hyderabad-Bengaluru" = raw_matrix$p.value["Hyderabad", "Bengaluru"],
  "Pune-Bengaluru"      = raw_matrix$p.value["Pune", "Bengaluru"],
  "Pune-Hyderabad"      = raw_matrix$p.value["Pune", "Hyderabad"]
)

alpha_each <- 0.05 / 6          # the bar each of the six pairs now has to clear
alpha_each
#> [1] 0.008333333

bengaluru <- unname(raw_p["Bengaluru-Chennai"])
round(c(raw = bengaluru, times_six = bengaluru * 6), 5)
#>       raw times_six
#>   0.01493   0.08960
```

Look at Bengaluru against Chennai. Its raw p-value is 0.01493, which clears the usual 0.05 comfortably. Against the Bonferroni bar of 0.00833 it does not clear at all. Written the other way round, 0.01493 times six is 0.0896, which is nowhere near 0.05.

It is one number read two ways, and the verdict is the same either way. Once you are paying for six comparisons, that pair stops being significant.

=== step === concept
## Running Bonferroni in R with pairwise.t.test

You never have to do that multiplying yourself. `pairwise.t.test()` takes the correction as an argument and applies it to every cell.

```r
# Get the same Bonferroni-adjusted p-values straight out of one function
pairwise.t.test(deliveries$hours, deliveries$hub,
                p.adjust.method = "bonferroni")
#>
#> 	Pairwise comparisons using t tests with pooled SD
#>
#> data:  deliveries$hours and deliveries$hub
#>
#>           Chennai Bengaluru Hyderabad
#> Bengaluru 0.08960 -         -
#> Hyderabad 1.00000 0.80484   -
#> Pune      2.1e-05 0.10721   0.00093
#>
#> P value adjustment method: bonferroni
```

It is the same lower triangle, with every cell already adjusted. Only two pairs survive now: Pune against Chennai at 0.000021 and Pune against Hyderabad at 0.00093. Bengaluru against Chennai has moved out to 0.0896 and Pune against Bengaluru to 0.10721. Four findings have become two.

One line in that output is worth a careful read: "Pairwise comparisons using t tests with pooled SD".

`pairwise.t.test()` is not running six separate two-sample t-tests. It estimates a single standard deviation from all 120 orders at once and uses that same number in every comparison, on the ANOVA's 116 residual degrees of freedom. Six separate calls to `t.test()` would each estimate the spread from only the sixty orders in front of them, which is why their numbers come out slightly different.

[NOTE]
Pooling is what makes each comparison sharper, because a spread estimated from 120 orders is steadier than one estimated from 60. The price is that the four hubs have to have similar spread for that single number to describe all of them fairly.

=== step === tryit
## Your turn: adjust the six raw p-values yourself

`raw_p` holds the six uncorrected p-values, one per pair of hubs. Do the Bonferroni adjustment both ways: multiply each value by six and cap it at 1 with `pmin()`, then get the same six numbers out of `p.adjust()`.

```r
# raw_p holds the six uncorrected p-values, one per pair of hubs.
# Multiply each of them by six and cap the result at 1,
# then do the same job in one call to p.adjust().
# Two lines. Press Check when you have them.
```
::check {"regex": "p[.]adjust\\s*[(]\\s*raw_p", "gate": true, "difficulty": "beginner", "ok": "That is it. Both lines print the same six numbers, because Bonferroni really is just a multiplication and a cap. Bengaluru against Chennai lands at 0.0896 either way.", "no": "The first line is pmin(raw_p * 6, 1). The second calls p.adjust on raw_p with the method argument set to bonferroni, in quotes."}
::solution
```r
# Adjust the six raw p-values by hand, then let p.adjust do the same job
round(pmin(raw_p * 6, 1), 6)
#>   Bengaluru-Chennai   Hyderabad-Chennai        Pune-Chennai Hyderabad-Bengaluru
#>            0.089605            1.000000            0.000021            0.804842
#>      Pune-Bengaluru      Pune-Hyderabad
#>            0.107209            0.000932

round(p.adjust(raw_p, method = "bonferroni"), 6)
#>   Bengaluru-Chennai   Hyderabad-Chennai        Pune-Chennai Hyderabad-Bengaluru
#>            0.089605            1.000000            0.000021            0.804842
#>      Pune-Bengaluru      Pune-Hyderabad
#>            0.107209            0.000932
```

Both lines give the same six values. Watch what happened to Hyderabad against Chennai: its raw p-value was 0.3379, and times six that would be 2.03, so the cap pulls it back to exactly 1.

=== step === concept
## Why the biggest of six gaps needs a bigger bar

Bonferroni holds the family at 5%, and it does it in one line. So why is there a second procedure at all?

Because Bonferroni was never built for this particular job. It takes any k comparisons, whatever they happen to be, and hands you a bar that works. Tukey answers a narrower and sharper question: what does the largest gap among four group means actually look like when all four groups are identical? Then it sets the bar from that.

Those are two different questions, and the difference is worth seeing for yourself.

Let's build 2,000 studies in which Nandini's four hubs are truly identical. Every study is the same size as hers, 120 orders with thirty per hub, and one single true delivery speed sits behind all four. In each study we work out all six pairwise t statistics and keep only the largest.

```r
# Simulate 2000 studies where all four hubs are identical, and keep the
# largest of the six pairwise t statistics from each one
set.seed(7)
null_max_t <- replicate(2000, {
  y      <- rnorm(120, 40, 6)                           # four hubs, one true speed
  means  <- tapply(y, deliveries$hub, mean)
  pooled <- sum((y - means[deliveries$hub])^2) / 116    # pooled variance, 116 df
  se     <- sqrt(pooled * (1 / 30 + 1 / 30))
  max(abs(outer(means, means, "-"))) / se
})

single_pair_bar <- qt(0.975, 116)
round(c(single_pair_bar   = single_pair_bar,
        share_above       = mean(null_max_t > single_pair_bar),
        largest_gap_95pct = unname(quantile(null_max_t, 0.95)),
        qtukey_bar        = qtukey(0.95, 4, 116) / sqrt(2)), 4)
#>   single_pair_bar       share_above largest_gap_95pct        qtukey_bar
#>            1.9806            0.2055            2.5841            2.6067
```

Inside the loop, `outer(means, means, "-")` builds every difference between two hub averages, `max(abs(...))` picks the biggest of them, and dividing by the standard error turns that gap into a t statistic on the usual scale.

Now read the four numbers that came back.

`single_pair_bar` is 1.9806, the t value a single two-sided test at 0.05 has to beat on 116 degrees of freedom.

`share_above` is 0.2055, which says that in 20.6% of those 2,000 studies, where nothing whatsoever was real, the largest of the six gaps beat that bar anyway. There is the family-wise error rate again, measured this time instead of derived. It lands a little under the 26.5% the formula gave. That is because six pairwise comparisons among four groups are not six independent tests. They share groups with each other and they share one pooled standard deviation, so their false alarms tend to arrive in packs rather than one at a time.

`largest_gap_95pct` is the number we came here for. Across those 2,000 null studies, 95% of the time the largest of the six t statistics stayed below 2.5841. That is the honest bar for the biggest gap among four groups, read straight off a simulation.

And `qtukey_bar` is 2.6067, which is the same bar computed exactly rather than simulated. The distribution of the largest gap among four group means, divided by the pooled standard error, has a name: the **studentized range**. `qtukey()` is its quantile function. The 4 and the 116 in that call are the number of group means being scanned and the residual degrees of freedom the pooled spread was estimated on, and dividing by the square root of 2 converts from a range to the t scale a single pairwise comparison lives on.

So Tukey's honestly significant difference is not a patch stuck on top of the t-test. It is the exact distribution of the thing you are actually looking at when you scan six comparisons and pick out the biggest one.

=== step === concept
## Reading TukeyHSD output: diff, lwr, upr and p adj

`TukeyHSD()` takes the fitted model straight off and hands back one row for every pair.

```r
# Read the Tukey table: one row per pair, with a difference, an interval
# and an adjusted p-value
tuk <- TukeyHSD(fit)
tuk
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = hours ~ hub, data = deliveries)
#>
#> $hub
#>                          diff        lwr        upr     p adj
#> Bengaluru-Chennai   -3.860000  -7.932229  0.2122291 0.0699395
#> Hyderabad-Chennai   -1.503333  -5.575562  2.5688958 0.7710609
#> Pune-Chennai        -7.613333 -11.685562 -3.5411042 0.0000207
#> Hyderabad-Bengaluru  2.356667  -1.715562  6.4288958 0.4357336
#> Pune-Bengaluru      -3.753333  -7.825562  0.3188958 0.0822307
#> Pune-Hyderabad      -6.110000 -10.182229 -2.0377709 0.0008836
```

There are four columns, and every one of them is worth reading.

- `diff` is the difference between the two hub averages in hours, first name minus second. Pune against Chennai reads -7.613333, so parcels from Pune arrive 7.61 hours sooner than parcels from Chennai.
- `lwr` and `upr` bracket that difference with a confidence interval. The family-wise part is what makes it different from an ordinary one: all six intervals together carry 95% joint coverage, so you can read every row in the table and still be at 95% overall, not 95% each.
- `p adj` is the p-value after Tukey's correction. There is nothing further to do to it.

Take the two rows that matter most here. Pune against Chennai is -7.61 hours, interval -11.69 to -3.54, adjusted p 0.0000207. Bengaluru against Chennai is -3.86 hours, interval -7.93 to 0.21, adjusted p 0.0699.

Notice where that second interval ends. It runs from -7.93 all the way up to 0.21, which means it includes zero.

The same six rows are easier to read as a picture.

```r
# Draw the six Tukey intervals against the zero line
par(mar = c(4.5, 10, 4, 2))    # widen the left margin so the pair names fit
plot(tuk, las = 1)
```

Every horizontal line is one pair's interval, and the vertical line is zero, meaning no difference at all. Pune-Chennai and Pune-Hyderabad sit entirely to the left of that line. The other four cross it.

=== step === quiz
## Quick check: what does an interval that crosses zero mean?

The interval for Bengaluru against Chennai ran from -7.93 to 0.21 hours, and its adjusted p-value was 0.0699. What does that pair of facts entitle you to say?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The two hubs deliver at the same average speed. ::no
- The interval is broken, because a difference cannot be both negative and positive. ::no
- The result contradicts the p-value, so one of the two should be reported and the other dropped. ::no Zero sitting inside the interval means exactly what an adjusted p-value above 0.05 means: this data cannot rule out a true difference of zero. It also cannot rule out a true difference of 7.93 hours, which is why "the two hubs are the same" is the wrong reading. And the interval never contradicts the p-value, because the two are computed from the same numbers.
- The data does not show a difference between those two hubs, which is not the same as showing there is none. ::ok Right. Zero is inside the interval, so a true difference of zero is compatible with this data. So is a true difference of seven hours, which is why "no difference" would be the wrong reading.

=== step === concept
## Tukey and Bonferroni on the same six pairs

Both procedures have now covered the same six comparisons on the same 120 orders, so let's put their answers side by side.

```r
# Put Tukey and Bonferroni side by side on the same six pairs
comparison <- data.frame(
  pair       = names(raw_p),
  raw_p      = round(raw_p, 6),
  tukey_p    = round(tuk$hub[names(raw_p), "p adj"], 6),
  bonferroni = round(p.adjust(raw_p, method = "bonferroni"), 6),
  row.names  = NULL
)
comparison
#>                  pair    raw_p  tukey_p bonferroni
#> 1   Bengaluru-Chennai 0.014934 0.069939   0.089605
#> 2   Hyderabad-Chennai 0.337903 0.771061   1.000000
#> 3        Pune-Chennai 0.000004 0.000021   0.000021
#> 4 Hyderabad-Bengaluru 0.134140 0.435734   0.804842
#> 5      Pune-Bengaluru 0.017868 0.082231   0.107209
#> 6      Pune-Hyderabad 0.000155 0.000884   0.000932
```

Every Tukey value is smaller than the Bonferroni value beside it. Bengaluru against Chennai is 0.069939 under Tukey and 0.089605 under Bonferroni. Pune against Hyderabad is 0.000884 against 0.000932. Row three looks like a tie only because six decimal places cannot show the gap: Tukey has 0.0000207 there against Bonferroni's 0.0000211.

Six out of six in the same direction is not a coincidence. Look at the t value each procedure demands before it will call a pair significant.

```r
# The t value each correction demands, on the same 116 residual degrees of freedom
round(c(tukey_over_6      = qtukey(0.95, 4, 116) / sqrt(2),
        bonferroni_over_6 = qt(1 - 0.05 / 12, 116)), 4)
#>      tukey_over_6 bonferroni_over_6
#>            2.6067            2.6843
```

The 12 in that second line is six comparisons times two tails, since each comparison is two-sided and splits its share of the error rate between both ends.

Tukey asks for 2.6067 and Bonferroni asks for 2.6843. Both are making the same promise, a family-wise error rate of no more than 5%. Tukey hits that 5% on the nose, because it knows the real distribution of the largest gap. Bonferroni lands somewhere under it, and coming in under is not a free bonus. You paid for it with power, which in plain terms means real differences you now fail to spot.

The reason comes down to what each procedure knows. Tukey knows there are exactly four groups and exactly six pairs built out of them, and it uses the real distribution of the largest gap among four means. Bonferroni knows only that there are six tests somewhere. It assumes the worst about how they overlap. That is what makes it safe for any six tests you could name, and stricter than it needs to be for these particular six.

[KEY INSIGHT]
When you are comparing every pair of groups, Tukey is the right tool and Bonferroni is strictly the weaker one: same promise, higher bar, less power. Bonferroni is not being more careful here. It is paying for a generality this job does not need.

=== step === concept
## What changes when only three comparisons were planned

So when is Bonferroni ever the right call?

When the family is not all six pairs.

Think back to how Nandini's study came about. Chennai is the original hub and the other three opened later, and the only question anyone raised in the planning meeting was whether each new hub is slower than Chennai. That is three comparisons, not six. Hyderabad against Bengaluru was never of interest, and neither were the other two hub-to-hub pairs.

If the family is three comparisons, then the correction should pay for three.

```r
# Correct only the three comparisons Nandini planned: each new hub against Chennai
planned <- raw_p[c("Bengaluru-Chennai", "Hyderabad-Chennai", "Pune-Chennai")]
round(p.adjust(planned, method = "bonferroni"), 6)
#> Bengaluru-Chennai Hyderabad-Chennai      Pune-Chennai
#>          0.044802          1.000000          0.000011

round(qt(1 - 0.05 / 6, 116), 4)    # the t bar a pre-fixed list of three earns
#> [1] 2.4292
```

Bengaluru against Chennai comes in at 0.0448. That one is significant.

That is the same pair that read 0.0699 under Tukey and 0.0896 under Bonferroni across all six. The data never moved, and neither did its raw p-value of 0.01493. What changed is how many comparisons the correction is paying for. The bar drops from 2.6067 to 2.4292 because a three-item list stopped buying protection against three comparisons nobody ever asked about.

That single flip is the whole trade. Tukey is built for all pairs and cannot be made cheaper than 2.6067. Bonferroni scales with the length of your list, so a genuinely short list makes it the more powerful of the two.

=== step === concept
## What planned in advance has to mean

Read that last move again and you will spot how it could be abused. Correcting for three instead of six flipped a pair to significant. So why not always claim three?

Because the smaller correction is earned by when the list was fixed, not by how short it is.

Here is that difference, measured. There are two ways of ending up with three comparisons, and we will run both of them over studies where nothing at all is real:

1. The honest way: name the three comparisons before seeing any data, then Bonferroni-correct those three.
2. The other way: compute all six, keep the three smallest p-values, then Bonferroni-correct as though three had been the plan all along.

```r
# Run 4000 studies where nothing is real, and count false alarms two ways:
# three comparisons fixed in advance, against the three smallest of six
set.seed(11)
bar_three <- 0.05 / 3

alarms <- replicate(4000, {
  y      <- rnorm(120, 40, 6)
  means  <- tapply(y, deliveries$hub, mean)
  pooled <- sum((y - means[deliveries$hub])^2) / 116
  se     <- sqrt(pooled * (1 / 30 + 1 / 30))
  gaps   <- abs(outer(means, means, "-"))[lower.tri(diag(4))]    # the six pairs
  six_p  <- 2 * pt(gaps / se, 116, lower.tail = FALSE)
  c(planned_three  = min(six_p[1:3]) < bar_three,   # the three hub-vs-Chennai pairs
    smallest_three = min(six_p) < bar_three)        # whichever three looked best
})

round(rowMeans(alarms), 4)
#>  planned_three smallest_three
#>         0.0458         0.0762
```

The honest procedure raises a false alarm in 4.6% of studies, which is the 5% it promised. The cherry-picked one does it in 7.6%, more than half again as often. And it reports the very same adjusted p-value, in the very same words, with nothing on the page to tell the two apart.

That is why "planned in advance" is a real condition rather than a formality. The number of comparisons in your correction has to be the number you were willing to run, counted before the data arrived. If you looked at all six first, you ran six, and you owe six.

[WARNING]
Choosing the correction after seeing which one makes your pair significant is not a judgement call. It is a false-alarm rate you are not reporting. Once you have seen all six p-values, the family is six.

=== step === quiz
## Quick check: which correction fits this study?

Two things happened in Nandini's week.

In March, before a single order was pulled, the team wrote the question down: is each new hub slower than Chennai? That is three comparisons, fixed on a whiteboard.

In April, with the Tukey table already on screen, her manager looked it over and said: actually, just compare the three southern hubs against each other and correct for three.

Which of those two lists has earned the three-comparison bar of 2.4292?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Both of them, since either way only three comparisons end up being reported. ::no
- The March list only, because it was fixed before the data existed, so the correction is paying for every comparison that was ever at risk. ::ok Yes. What a correction has to cover is the set of comparisons you were willing to run, and in March that set was three. In April it was six, because six had already been looked at.
- The April list only, because it is the more focused question and focus is what a correction rewards. ::no
- Neither, because Tukey is always the right procedure once an ANOVA is significant. ::no A correction pays for the comparisons that were at risk, so the March list of three genuinely costs three while the April list costs six no matter how it gets worded. And Tukey is not automatic either: it is the right choice when every pair is in play, which is exactly what the March plan was not.

=== step === concept
## What a post-hoc test inherits from the ANOVA

Both corrections here reuse two things from the fitted ANOVA: one pooled standard deviation estimated from all 120 orders, and the 116 residual degrees of freedom. That is what makes them precise. It also means they inherit the ANOVA's assumptions. If that pooled number is a poor summary of the spread, every adjusted p-value built on top of it carries the same error.

There are two checks, one line each.

```r
# Check the two assumptions the pooled bar rests on
bartlett.test(hours ~ hub, data = deliveries)
#>
#> 	Bartlett test of homogeneity of variances
#>
#> data:  hours by hub
#> Bartlett's K-squared = 0.44258, df = 3, p-value = 0.9313

shapiro.test(residuals(fit))
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.99018, p-value = 0.5508
```

`bartlett.test()` asks whether the four hubs have equal variance, and gives p = 0.9313. That is no evidence against equal spread at all. `shapiro.test()` on the residuals asks whether what is left over after removing the four hub averages looks normal, and gives W = 0.99018 with p = 0.5508, which says the same thing. So one pooled standard deviation is a fair description of all four hubs here, and both Tukey and Bonferroni are standing on solid ground.

When those checks come back badly, the job changes:

- **Badly unequal variances across the groups.** The pooled standard deviation becomes a blend of spreads that do not belong together, and the fix is the **Games-Howell** procedure, which gives every pair its own variances and its own degrees of freedom.
- **A badly non-normal outcome**, such as heavy skew or hard outliers. Then the ANOVA was the wrong starting point in the first place. Kruskal-Wallis replaces it, and **Dunn's test** is the post-hoc that goes with it.

[TIP]
Run these two checks before you read any post-hoc table, not after. A correction protects you against multiplicity, and against absolutely nothing else.

=== step === quiz
## Quick check: which bar does each situation clear?

Nandini's residual degrees of freedom stay at 116 throughout, and three t bars are in play: 2.4292 for three comparisons fixed before the data, 2.6067 for Tukey across all six pairs, and 2.6843 for Bonferroni across all six.

A pair of hubs comes back at t = 2.55. Which reading is right?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- It clears all three bars, so the pair is significant whichever correction gets used. ::no
- It clears only 2.4292, so the pair is significant only if those three comparisons were fixed before the data was pulled. ::ok Correct. 2.55 sits below both all-pairs bars and above the three-comparison one, so the verdict turns entirely on what the family was and when it was decided.
- It clears Tukey but not Bonferroni over six, so Tukey is the one to report. ::no
- If the four hubs had badly unequal spread, t = 2.55 would still clear 2.4292 and the pair could be reported as significant. ::no Line 2.55 up against the three bars and it beats 2.4292 alone, so it fails under both all-pairs procedures. And badly unequal spread breaks the pooled standard deviation that all three of those bars are built from, which puts the whole table on the wrong instrument: that situation calls for Games-Howell, not for a different threshold.

=== step === tryit
## Your turn: pull one pair out of the Tukey table

`tuk` holds the Tukey result. Its table lives in `tuk$hub`, a matrix with one row per pair and the four columns you have been reading. Pull out the single row for Pune against Chennai.

```r
# tuk holds the Tukey result. Its table is the matrix tuk$hub, whose rows
# are named for the pairs, like Pune-Chennai.
# Pull out the row for Pune against Chennai.
# One line. Press Check when you have it.
```
::check {"regex": "tuk[$]hub\\[[^P]*Pune-Chennai", "gate": true, "difficulty": "intermediate", "ok": "That is the row: a difference of -7.61 hours, an interval from -11.69 to -3.54, and an adjusted p-value of 0.000021. Four numbers, and together they are the whole verdict on that pair.", "no": "Index the matrix by its row name and leave the column slot empty so every column comes back. The shape is tuk$hub[ROW, ] where ROW is the quoted pair name Pune-Chennai."}
::solution
```r
# Pull the single Tukey row for Pune against Chennai
round(tuk$hub["Pune-Chennai", ], 6)
#>      diff       lwr       upr     p adj
#> -7.613333 -11.685562 -3.541104  0.000021
```

Read those four numbers as one sentence and you have something an operations lead can act on. Pune delivers 7.61 hours faster than Chennai on average. The plausible range for that gap runs from 3.54 hours to 11.69 hours, and even the pessimistic end of it is worth most of a working day. The adjusted p-value of 0.000021 says a gap like this is nowhere near what six comparisons could have thrown up by luck.

=== step === quiz
## Quick check: which write-up is honest?

Nandini has one sentence in the operations review for Pune against Chennai, and she used Tukey across all six pairs. Which version should she write?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Pune is significantly faster than Chennai, p less than 0.05. ::no
- Pune delivers 7.61 hours faster than Chennai on average, 95% family-wise interval -11.69 to -3.54 hours, Tukey-adjusted p = 0.0000207. ::ok That is the one. It names the pair, gives the size of the gap in hours, shows how precisely that gap is pinned down, and says which correction produced the p-value so a reader can tell what the number was paying for.
- Pune delivers 7.61 hours faster than Chennai, p = 0.0000035. ::no
- There is roughly a 0.002% chance that Pune and Chennai deliver at the same speed. ::no Three of these four leave out something a decision needs. A bare significance claim hides the size of the gap and its precision, the third reports the raw p-value instead of the corrected one, and the last turns the p-value around into a probability about the truth, which is not what any p-value measures.

=== step === concept
## References

- [Comparing Individual Means in the Analysis of Variance](https://doi.org/10.2307/3001913) - Tukey (1949), Biometrics 5(2), 99-114. Where the studentized-range procedure was published.
- [Simultaneous Statistical Inference](https://doi.org/10.1007/978-1-4613-8122-8) - Miller (1981), 2nd edition, Springer Series in Statistics. The standard reference on family-wise error control and how the procedures compare.
- [Multiple significance tests: the Bonferroni method](https://doi.org/10.1136/bmj.310.6973.170) - Bland and Altman (1995), BMJ 310, 170. Two pages, and plain about when Bonferroni is and is not the right call.
- [Compute Tukey Honest Significant Differences](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TukeyHSD.html) - R Core Team, the documentation for `TukeyHSD()`, including how it handles unequal group sizes.
- [Adjust P-values for Multiple Comparisons](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html) - R Core Team, the documentation for `p.adjust()` and every method `pairwise.t.test()` accepts.

=== step === complete
## Quick recap

You started with a significant F that named nobody, and you finished with one pair, one interval and one p-value you can defend. Here is what carried you across:

- A significant ANOVA says the group averages are not all equal, and stops there. Naming the pair is a separate job.
- Six uncorrected t-tests on four hubs gave four findings, and when nothing at all is real the largest of those six gaps still clears the single-pair bar in 20.6% of studies. A correction protects the whole family of comparisons, never a single one.
- Bonferroni divides 0.05 by the number of comparisons, or equivalently multiplies each p-value by it. Simple, general, and stricter than it needs to be for all-pairs work.
- Tukey uses the exact distribution of the largest gap among four means, the studentized range. Across all six pairs its bar is 2.6067 against Bonferroni's 2.6843, so it is the better tool for that job.
- Bonferroni wins when the family is genuinely short. Three comparisons drop the bar to 2.4292, and that is what turned Bengaluru against Chennai from 0.0699 into 0.0448.
- The shortlist has to be fixed before the data. Taking the three smallest of six and correcting for three runs at a 7.6% false-alarm rate while calling it 5%.

So when someone asks which warehouse is the slow one, the answer now sounds like this:

"Pune delivers 7.61 hours faster than Chennai on average, with a 95% family-wise interval of 3.54 to 11.69 hours and a Tukey-adjusted p-value of 0.0000207, across all six hub comparisons."

Every number in that sentence is doing a job, and the p-value has paid for all six comparisons it came from. Nicely done, and have a great day.

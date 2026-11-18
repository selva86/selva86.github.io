---
title: "ANOVA and Multiple Comparisons Lesson 1: Comparing several groups at once"
catalog_blurb: "Why six pairwise t-tests inflate your error rate, and what fixes it."
description: "A school tests four teaching methods on 24 students. See why six pairwise t-tests inflate the error rate, and how one ANOVA tests all four means at once."
keywords: "one-way ANOVA, multiple comparisons, pairwise t-tests, false positive rate, type I error inflation, between-group variation, within-group variation, sum of squares, F statistic, aov, R"
post_type: "LESSON"
curriculum_id: "4.50.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "1"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "Two-Factors-and-Their-Combined-Effect.html"
course_prev: ""
---

=== step === cover
## Comparing several groups at once

Today let's understand how to compare more than two groups at once, using a school that tried 4 different ways of teaching the same class.

A school wants to know which of 4 teaching methods works best: Lecture, Flipped classroom, Group work, and an Online module. It picks 24 students, splits them into 4 groups of 6, teaches each group with one method, and gives every student the same 100-point final exam.

Lecture's scores were 78, 82, 75, 80, 77 and 84. Flipped classroom's were 85, 88, 82, 90, 86 and 91. Group work's were 72, 76, 70, 74, 71 and 79, and Online module's were 80, 83, 79, 85, 81 and 84.

The chart below plots all 24 scores, grouped by method.

::widget chart-plotter {"data":[{"x":"Lecture","y":78},{"x":"Lecture","y":82},{"x":"Lecture","y":75},{"x":"Lecture","y":80},{"x":"Lecture","y":77},{"x":"Lecture","y":84},{"x":"Flipped classroom","y":85},{"x":"Flipped classroom","y":88},{"x":"Flipped classroom","y":82},{"x":"Flipped classroom","y":90},{"x":"Flipped classroom","y":86},{"x":"Flipped classroom","y":91},{"x":"Group work","y":72},{"x":"Group work","y":76},{"x":"Group work","y":70},{"x":"Group work","y":74},{"x":"Group work","y":71},{"x":"Group work","y":79},{"x":"Online module","y":80},{"x":"Online module","y":83},{"x":"Online module","y":79},{"x":"Online module","y":85},{"x":"Online module","y":81},{"x":"Online module","y":84}],"geoms":["boxplot"],"x":"method","y":"score"}

Look at those 4 boxes. Flipped classroom already sits above the other three, and Group work sits below them. The question now is how to test whether gaps like that are real, without testing the 4 methods two at a time.

=== step === widget
## Six pairwise comparisons, and what each one risks

With 4 methods, the obvious plan is to compare them two at a time: Lecture against Flipped classroom, Lecture against Group work, Lecture against Online module, Flipped classroom against Group work, Flipped classroom against Online module, and Group work against Online module. That is 6 separate pairs, and the obvious next step is to run a t-test on each one.

But every one of those 6 t-tests carries its own risk. At the usual significance level, alpha = 0.05, any single t-test has a 5% chance of calling two groups "significantly different" even when they are not. That 5% is called a false positive, and it is a cost every t-test carries on its own, before you even get to a second one.

The curve below shows the shape that one pairwise comparison's test statistic would take if the two methods being compared were really identical. Drag the slider to see how far out a test statistic has to sit before it counts as significant.

::widget null-distribution {"tails":2,"max":4,"start":2.0,"label":"the t-statistic from one pairwise comparison"}

With the slider at 2.00, the shaded area reads about 0.046. That is close to 0.05, and it is the price tag on a single pairwise t-test: run one comparison between two methods that are truly identical, and a result this extreme or more turns up about 1 time in 20, by chance alone.

=== step === concept
## Simulating the real risk: four identical groups, six tests

One pairwise test carries a 5% risk. 6 of them, run on the same 4 methods, carry 6 of those risks at once. To see what that does to the overall chance of a false alarm, simulate a world where the 4 teaching methods make no real difference at all, then run all 6 pairwise t-tests inside that world, over and over.

Draw 4 groups of 6 students from the exact same distribution, a mean of 80 and a standard deviation of 6, close to the real exam's own scale. Since all 4 groups come from one identical distribution, any difference between them is pure chance, by construction. Run every pairwise t-test between them, and check whether any single one comes back significant. Repeat that 10,000 times.

```r
# Simulate 4 identical groups, run all 6 pairwise t-tests, and see how often at least one comes back significant
set.seed(42)
sim_results <- replicate(10000, {
  group1 <- rnorm(6, mean = 80, sd = 6)
  group2 <- rnorm(6, mean = 80, sd = 6)
  group3 <- rnorm(6, mean = 80, sd = 6)
  group4 <- rnorm(6, mean = 80, sd = 6)
  groups <- list(group1, group2, group3, group4)
  pairs <- combn(4, 2)
  pair_p_values <- apply(pairs, 2, function(pair) {
    t.test(groups[[pair[1]]], groups[[pair[2]]])$p.value
  })
  c(any_significant = any(pair_p_values < 0.05),
    one_fixed_pair_significant = pair_p_values[1] < 0.05)
})

mean(sim_results["any_significant", ])
#> [1] 0.1926
mean(sim_results["one_fixed_pair_significant", ])
#> [1] 0.0455
```

Read the second number first. Across the 10,000 worlds, the one fixed pair, group1 against group2, came back significant 0.0455 of the time, about 4.6%. That matches the 0.046 the null distribution widget showed two steps back almost exactly, because it is the same risk: one pairwise t-test, run at alpha = 0.05, on groups that are truly identical.

Now read the first number. Looking at all 6 pairs together and asking whether any one of them came back significant, the fraction jumps to 0.1926, about 19.3%. Stacking 6 separate 5%-risk tests does not keep the overall risk at 5%. It raises the chance of at least one false alarm to nearly 1 in 5, on data where the 4 teaching methods made no real difference at all.

That is the real problem with the six-pairwise-tests plan. It is not that any one t-test is wrong. It is that running 6 of them and flagging a difference if any one comes back significant quietly swaps a 5% risk for a much bigger one.

=== step === quiz
## Quick check: why six t-tests is the wrong tool

A researcher compares 5 diets by running 10 pairwise t-tests between them, all at alpha = 0.05. None of the 5 diets actually differ from each other. What happens to the chance that at least one of those 10 pairs comes back "significant"?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The chance that at least one pair comes back significant climbs well past 5%, because each of the 10 tests adds its own 5% risk. ::ok Right. Ten separate t-tests, each carrying its own 5% risk of a false alarm, stack those risks up. Even though none of the 5 diets truly differ, the chance that at least one of the 10 pairs looks significant climbs well past 5%, the same inflation the simulation just measured at 19.3% for 6 tests.
- It stays at 5%, since every one of the 10 tests still runs at alpha = 0.05. ::no
- It drops, because running more comparisons gives the researcher more evidence overall. ::no
- It depends only on how many patients are in each diet group, not on how many tests are run. ::no Each of the 10 tests carries its own 5% chance of a false positive, and those risks add up across all 10 tests. That holds regardless of how many patients are in each diet group, which is why the chance that at least one pair looks significant climbs well past 5%, even when none of the 5 diets truly differ.

=== step === widget
## One test for all the groups at once: the idea behind ANOVA

Instead of 6 separate yes-or-no questions, one for every pair, test one question that covers all 4 methods together: do the 4 population means, the long-run average score each method would produce, all equal one shared value? That single question is what the analysis of variance, ANOVA, tests, and it runs at one error rate instead of 6.

ANOVA answers that question by comparing two kinds of variation in the same data. Between-group variation is how far the 4 method averages spread out from each other. Within-group variation is how much the scores inside any one method bounce around their own method's average. If the 4 teaching methods truly make no difference, both kinds of variation are measuring the same everyday noise, and they should come out close in size. If one or more methods genuinely pull scores up or down, the between-group variation grows larger than the within-group variation.

Switch the toggle below between the boxplot and the individual points on the real exam scores. The gap between the 4 boxes is the between-group variation ANOVA measures. The height of each box, or the spread of the dots inside one method, is the within-group variation it is measured against.

::widget chart-plotter {"data":[{"x":"Lecture","y":78},{"x":"Lecture","y":82},{"x":"Lecture","y":75},{"x":"Lecture","y":80},{"x":"Lecture","y":77},{"x":"Lecture","y":84},{"x":"Flipped classroom","y":85},{"x":"Flipped classroom","y":88},{"x":"Flipped classroom","y":82},{"x":"Flipped classroom","y":90},{"x":"Flipped classroom","y":86},{"x":"Flipped classroom","y":91},{"x":"Group work","y":72},{"x":"Group work","y":76},{"x":"Group work","y":70},{"x":"Group work","y":74},{"x":"Group work","y":71},{"x":"Group work","y":79},{"x":"Online module","y":80},{"x":"Online module","y":83},{"x":"Online module","y":79},{"x":"Online module","y":85},{"x":"Online module","y":81},{"x":"Online module","y":84}],"geoms":["boxplot","point"],"x":"method","y":"score"}

The 4 boxes sit at clearly different heights, and each box is fairly short on its own. That is exactly the pattern ANOVA is built to pick up: the gap between the groups looks large next to how much any one group's own scores wander.

=== step === concept
## The grand mean and the group means

ANOVA needs two reference points before it can measure anything: the average of every score in the whole study, called the grand mean, and the average of each method's own 6 scores, called the group means. Every number that follows is a distance measured from one of these two.

```r
# Compute the grand mean of all 24 scores, and each method's own group mean
exam_scores <- data.frame(
  method = c(rep("Lecture", 6), rep("Flipped classroom", 6), rep("Group work", 6), rep("Online module", 6)),
  score = c(78, 82, 75, 80, 77, 84,
            85, 88, 82, 90, 86, 91,
            72, 76, 70, 74, 71, 79,
            80, 83, 79, 85, 81, 84)
)

mean(exam_scores$score)
#> [1] 80.5
tapply(exam_scores$score, exam_scores$method, mean)
#> Flipped classroom        Group work           Lecture     Online module
#>          87.00000          73.66667          79.33333          82.00000
```

The grand mean, 80.5, is the average score across all 24 students, ignoring which method they were taught with. The group means tell a different story. Flipped classroom's own average is 87.000, well above the grand mean. Group work's is 73.667, well below it. Lecture sits at 79.333 and Online module at 82.000, both close to the grand mean. Those 4 distances, each group mean against 80.5, are exactly what the between-group variation measures next.

=== step === concept
## Variation between the groups: the between-group sum of squares

The between-group sum of squares, SS between, turns those 4 distances into a single number. For each method, take its group mean, subtract the grand mean, square that difference, and multiply by how many students are in that group, 6. Add the 4 results together.

```r
# Compute the between-group sum of squares by hand
group_means <- tapply(exam_scores$score, exam_scores$method, mean)
grand_mean <- mean(exam_scores$score)

ss_between <- sum(6 * (group_means - grand_mean)^2)
ss_between
#> [1] 555.3333
```

SS between comes out to 555.3333. Notice what makes it grow: a group mean sitting far from the grand mean, like Flipped classroom's 87.000 or Group work's 73.667, contributes a large squared term. A group mean sitting close to the grand mean, like Lecture's or Online module's, contributes very little. If all 4 methods had produced exactly the same average, every one of those 4 squared terms would be 0, and SS between would be 0 too.

=== step === concept
## Variation within the groups: the within-group sum of squares

SS between only looks at the 4 group means. It says nothing about how much the 6 students inside any one method differ from each other, which is exactly what the within-group sum of squares, SS within, measures. For every student, subtract that student's OWN method's mean from their score, square it, and add up all 24 of those squared terms.

```r
# Compute the within-group sum of squares by hand, and check it against the total
ss_within <- sum((exam_scores$score - group_means[exam_scores$method])^2)
ss_within
#> [1] 196.6667

ss_total <- sum((exam_scores$score - grand_mean)^2)
ss_between + ss_within
#> [1] 752
ss_total
#> [1] 752
```

SS within comes out to 196.6667. This is the noise ANOVA has to measure the between-group signal against: how much the scores bounce around inside Lecture, inside Flipped classroom, inside Group work, inside Online module, with the method held fixed. SS total, the squared distance of every one of the 24 scores from the grand mean, is 752, and it splits exactly into SS between plus SS within. Every bit of variation in the 24 scores is accounted for by one of those two sources, and none of it is left over.

=== step === concept
## From sums of squares to the F statistic

SS between and SS within cannot be compared directly, because they are built from different numbers of independent pieces of information, called degrees of freedom. SS between has 3 degrees of freedom, one less than the 4 methods being compared. SS within has 20, the 24 students minus the 4 methods. Dividing each sum of squares by its own degrees of freedom gives a mean square, the average amount of variation per degree of freedom.

```r
# Convert the sums of squares into mean squares and the F statistic, by hand and with aov()
df_between <- 4 - 1
df_within <- 24 - 4
ms_between <- ss_between / df_between
ms_within <- ss_within / df_within
f_stat <- ms_between / ms_within

ms_between
#> [1] 185.1111
ms_within
#> [1] 9.833333
f_stat
#> [1] 18.82486

anova_fit <- aov(score ~ method, data = exam_scores)
summary(anova_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> method       3  555.3  185.11   18.82 4.83e-06 ***
#> Residuals   20  196.7    9.83
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

MS between is 185.1111 and MS within is 9.833333. The F statistic is their ratio, 18.82486. Here is why that ratio is the right thing to compute. If the 4 teaching methods truly made no difference, MS between and MS within would both be estimating the same everyday variation among students, so F would sit close to 1. An F of 18.82 is nowhere near 1: the variation between the methods is almost 19 times larger than the variation inside them, far more than ordinary student-to-student noise would produce on its own. The hand computation and `aov()` agree to the decimal place that matters, F = 18.82.

=== step === concept
## What a significant F tells you, and what it does not

F = 18.82 needs a scale to be judged against, and that scale is the F distribution with 3 and 20 degrees of freedom, the same two numbers from the mean squares. The p-value is the tail area beyond 18.82 on that distribution: the chance of seeing an F this large, or larger, if the 4 population means really were all equal.

```r
# Compute the p-value as the tail area beyond the observed F, under the assumption that all 4 means are equal
pf(f_stat, df_between, df_within, lower.tail = FALSE)
#> [1] 4.834513e-06
```

That tail area is 4.834513e-06, about 5 in a million. It matches the p-value `aov()` printed in the last step, p = 4.83e-06. An F this large would almost never happen if Lecture, Flipped classroom, Group work and Online module all produced the same average score, so this result rules out "all 4 methods are equal."

What it does not do is say which method stands apart, or how many of the 4 differ from the rest. A significant F only says that somewhere among the 4 group means, at least one does not match the others. Flipped classroom's 87.000 is the highest of the 4, but this test alone has not shown that Flipped classroom specifically beats any one other method. Answering a specific question like that honestly needs a method built for comparing several pairs of groups at once, carrying one combined error rate, rather than 6 separate t-tests each carrying its own.

=== step === quiz
## Quick check: reading an ANOVA table

A one-way ANOVA comparing 4 groups returns F = 18.82 on 3 and 20 degrees of freedom, with p < 0.001. Which statement correctly describes what that result establishes?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- At least one of the 4 group means differs from the rest, and the test does not say which one. ::ok Exactly. The F test rules out all 4 means being equal at once, at one shared error rate. It stops there: it never identifies which mean, or how many of them, are the ones pulling away from the rest.
- Every pair among the 4 groups differs from every other pair. ::no
- The method with the highest group mean is proven to beat the other three. ::no
- The result would match 6 pairwise t-tests run at alpha = 0.05, since both control the same error rate. ::no A significant F only rules out all 4 means being equal at once, at one combined 5% risk. It does not say which group or groups differ, it does not prove the highest mean beats every other method, and it does not match 6 separate pairwise t-tests, which carry 6 separate 5% risks instead of one shared one.

=== step === tryit
## Your turn: run and read a one-way ANOVA

Here is a new comparison: a grower tests 3 fertilizers, A, B and C, on 5 plants each, and measures plant growth in centimetres. The starter code below builds the data and prints each fertilizer's own group mean. Finish it by calling `aov()` on growth by fertilizer, and printing its `summary()`, the same two steps you just ran on the exam scores.

```r
# Build the fertilizer data, print each group's mean, then run and read a one-way ANOVA
fertilizer_growth <- data.frame(
  fertilizer = c(rep("A", 5), rep("B", 5), rep("C", 5)),
  growth = c(14, 16, 15, 13, 17,
             19, 21, 18, 22, 20,
             15, 14, 17, 16, 13)
)

tapply(fertilizer_growth$growth, fertilizer_growth$fertilizer, mean)
#>  A  B  C
#> 15 20 15

# Now call aov() on growth by fertilizer, with data = fertilizer_growth, and print its summary().
# One line. Press Check when you have it.
```
::check {"regex": "summary[(]\\s*aov[(]\\s*growth\\s*~\\s*fertilizer", "gate": true, "difficulty": "intermediate", "ok": "Right: F = 16.67 on 2 and 12 degrees of freedom, p = 0.000344. Fertilizer B's mean growth, 20 cm, sits well above A and C's 15 cm each, and with only 2.50 mean squared variation inside each group, that gap stands out clearly as a between-group signal rather than noise.", "no": "Call aov() with growth on the left of the formula, fertilizer on the right, and data = fertilizer_growth, then wrap the whole call in summary(): summary(aov(growth ~ fertilizer, data = fertilizer_growth))."}
::solution
```r
# Run the one-way ANOVA on fertilizer growth and print its summary
summary(aov(growth ~ fertilizer, data = fertilizer_growth))
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> fertilizer   2  83.33   41.67   16.67 0.000344 ***
#> Residuals   12  30.00    2.50
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

F = 16.67 on 2 and 12 degrees of freedom, p = 0.000344. Fertilizer B pulled plant growth up to a mean of 20 cm while A and C both sit at 15 cm, and that gap is large enough, next to the noise inside each group, to count as a real difference rather than chance.

=== step === concept
## References

- Fisher, R.A. (1925). "Statistical Methods for Research Workers." Oliver and Boyd. The origin of the analysis of variance and the F ratio used throughout this lesson's hand computation.
- Montgomery, D.C. (2017). "Design and Analysis of Experiments." Wiley. The one-way ANOVA sums-of-squares decomposition, SS between and SS within, built by hand in this lesson.
- Maxwell, S.E. and Delaney, H.D. (2004). "Designing Experiments and Analyzing Data." Routledge. What a significant F does and does not establish about which groups differ.
- Agresti, A. and Franklin, C. (2013). "Statistics: The Art and Science of Learning from Data." Pearson. The inflation of false-positive risk across repeated pairwise tests.
- [aov() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team. The function used to fit the one-way ANOVA on the exam scores and the fertilizer growth data.
- [pf() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/pf.html) - R Core Team. The F distribution function used to compute the tail area beyond the observed F statistic.
- [One-Way ANOVA in R: A Complete Walkthrough](https://r-statistics.co/One-Way-ANOVA-in-R.html) - the companion reference tutorial, with more worked cases and post-hoc tests beyond this lesson.

=== step === complete
## One test, one honest answer

Stacking pairwise t-tests inflates the chance of a false alarm well past the 5% any single test carries, because each test adds its own risk on top of the others. A one-way ANOVA tests all the group means at once, at one shared error rate, by comparing how much the group means spread out against how much the scores inside each group spread out. A significant F says that somewhere among the groups, at least one mean differs from the rest, and stops there: it never says which one.

Knowing that one method differs is rarely the end of the question. The next honest step is comparing specific pairs of groups without quietly reinflating the false-positive risk the six pairwise tests carried in the first place.

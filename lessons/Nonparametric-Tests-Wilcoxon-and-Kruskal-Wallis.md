---
title: "Choosing Statistical Tests Lesson 3: Testing on ranks with Wilcoxon and Kruskal-Wallis"
catalog_blurb: "Why one outlier changes the mean but not a rank-based test's answer."
description: "A checkout-time study with one 150-second outlier shows why the Wilcoxon and Kruskal-Wallis tests work on ranks instead of means, and what that trade costs you."
keywords: "Wilcoxon rank-sum test, Mann-Whitney U, Kruskal-Wallis test, nonparametric test, rank-based test, wilcox.test, kruskal.test, median vs mean, outlier-resistant test, chi-squared distribution, R"
post_type: "LESSON"
curriculum_id: "4.40.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "3"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: "Permutation-and-Randomization-Tests.html"
course_prev: "Checking-Assumptions-and-What-Breaks-Them.html"
---

=== step === cover
## Testing on ranks with Wilcoxon and Kruskal-Wallis

Today let's understand two tests that work on the rank of a value instead of the value itself: the Wilcoxon rank-sum test and the Kruskal-Wallis test.

A company is comparing two designs for its checkout page, A and B. Design A was timed on 5 customers, in seconds: 38, 45, 52, 60 and 150. Design B was timed on 6 different customers: 30, 33, 41, 44, 48 and 55.

Design A's checkout times average 69 seconds. Design B's average 41.83 seconds, a 65% gap that makes A look much slower to check out with. But that gap is driven almost entirely by one customer on design A who took 150 seconds. Look at the middle value instead: design A's median is 52 seconds, design B's is 42.5, far closer together.

The chart below plots every one of those 11 checkout times, grouped by design.

::widget chart-plotter {"data":[{"x":"A","y":38},{"x":"A","y":45},{"x":"A","y":52},{"x":"A","y":60},{"x":"A","y":150},{"x":"B","y":30},{"x":"B","y":33},{"x":"B","y":41},{"x":"B","y":44},{"x":"B","y":48},{"x":"B","y":55}],"geoms":["boxplot","point"],"x":"design","y":"seconds"}

On the boxplot above, design A's box and whisker stretch much higher than design B's, pulled up by that single 150-second point sitting on its own near the top.

=== step === concept
## One outlier, two very different averages

Start with the two numbers that make design A look so much slower: a mean of 69 seconds against design B's 41.83.

Compute all four numbers in R to see exactly how far apart they sit.

```r
# Compare the mean and median checkout time for design A and design B
A <- c(38, 45, 52, 60, 150)
B <- c(30, 33, 41, 44, 48, 55)

mean(A)
#> [1] 69
mean(B)
#> [1] 41.83333
median(A)
#> [1] 52
median(B)
#> [1] 42.5
```

A mean adds up every value and divides by how many there are, so one unusually large value pulls it a long way. A median only looks at the middle value once the data are sorted, so it barely notices how large the largest value actually is, only that it is the largest.

See how much of that mean comes from the single slowest checkout by dropping it and recomputing.

```r
# Recompute design A's mean with the 150-second checkout removed
mean(A[A != 150])
#> [1] 48.75
```

Removing one customer out of five drags design A's mean down from 69 to 48.75, a large swing for a single dropped value. Its median, 52, would barely move if that same customer dropped out, because the middle of five sorted values rarely depends on which value sits at the very end.

That is exactly the property the Wilcoxon rank-sum test is built around: a statistic that, like the median, pays attention to where the 150 sits in the order of all the checkout times, never to how large it actually is.

=== step === concept
## From measurements to ranks

To build a test around that idea, pool every checkout time from both designs into one list of 11 numbers, sort it, and give each value a rank: 1 for the smallest, up to 11 for the largest.

R's rank() function does exactly that.

```r
# Pool A and B into one vector, then rank every value from smallest to largest
pooled <- c(A, B)
design <- c(rep("A", length(A)), rep("B", length(B)))
ranks <- rank(pooled)

data.frame(seconds = pooled, design = design, rank = ranks)
#>    seconds design rank
#> 1       38      A    3
#> 2       45      A    6
#> 3       52      A    8
#> 4       60      A   10
#> 5      150      A   11
#> 6       30      B    1
#> 7       33      B    2
#> 8       41      B    4
#> 9       44      B    5
#> 10      48      B    7
#> 11      55      B    9
```

A rank records only where a value sits once every value is sorted, never how far apart two neighbouring values actually are. Design A's 150-second checkout gets rank 11, the largest, but it would get that exact same rank 11 if it had been 160 seconds or 400. That single fact is what makes a rank-based statistic resistant to an outlier like it.

=== step === concept
## The rank-sum statistic, by hand

Sum up each design's own ranks from the table above, and those two sums turn directly into the test's statistic.

```r
# Sum each design's ranks, and confirm the two sums cover every rank exactly once
RA <- sum(ranks[design == "A"])
RB <- sum(ranks[design == "B"])

c(RA = RA, RB = RB, total = RA + RB)
#>    RA    RB total 
#>    38    28    66 
```

Design A's five ranks, 3, 6, 8, 10 and 11, sum to 38. Design B's six ranks, 1, 2, 4, 5, 7 and 9, sum to 28. Those two sums add to 66, exactly 11 times 12 over 2, the sum of every rank from 1 to 11. That check confirms no rank was missed or counted twice.

Turn each rank sum into a statistic called \(U\) by subtracting that group's own no-difference baseline, \(n\) times \((n+1)\) over 2, where \(n\) is that group's own sample size.

\[ U = R - \frac{n(n+1)}{2} \]

```r
# Subtract each design's own baseline from its rank sum to get U
UA <- RA - 5 * 6 / 2
UB <- RB - 6 * 7 / 2

c(UA = UA, UB = UB, total = UA + UB)
#>    UA    UB total 
#>    23     7    30 
```

\(U_A\) works out to 38 minus 15, 23. \(U_B\) works out to 28 minus 21, 7. Those two \(U\) values add to 30, exactly 5 times 6, design A's sample size times design B's. That is a second check: whenever it holds, nothing went wrong in the arithmetic.

=== step === concept
## What the Wilcoxon rank-sum test actually tests

\(U_A\), 23, counts something concrete. Out of all 5 times 6, 30 possible pairings between one of design A's times and one of design B's times, design A's value came out higher in 23 of them.

A high count like that says design A's checkout times tend to sit above design B's once both are pooled and sorted, a claim about where the two designs sit relative to each other, never a claim about their means.

Nothing in that count depends on how much higher the 150-second checkout sits, only that it sits highest. Swap that 150 for a 400 and \(U_A\) stays exactly 23, because in every pairing where design A's largest value already won, it would still win. That is why one extreme value cannot dominate this statistic the way it dominates a mean.

=== step === widget
## The null distribution and the p-value for U = 23

See what \(U\) would look like if design A and design B truly performed identically, so that neither design's checkout times genuinely rank higher than the other's.

Under that assumption, \(U\) averages \(n_A\) times \(n_B\) over 2, 15 here, and spreads out with a standard deviation of the square root of \(n_A\) times \(n_B\) times \((n_A+n_B+1)\), all over 12, which works out to 5.48. Standardizing the observed \(U_A\), 23, against that average and spread gives a z of about 1.46.

Drag the slider to that z and read off the two-sided tail it shades.

::widget null-distribution {"tails":2,"max":4,"start":1.46,"label":"standardized rank-sum statistic (z)"}

At z = 1.46, the shaded two-sided tail comes to about 0.144. That is close to, but not the same as, R's own exact p-value, because this normal curve only approximates the true distribution of \(U\); for a sample this small, R works out that exact distribution directly instead.

=== step === quiz
## Quick check: reading the null distribution

Suppose a different pair of designs gave a standardized rank-sum statistic of z = 1.46, the same z shaded above for design A against design B. What does that z sitting inside the shaded tail actually tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It is the probability that design A's checkout is slower than design B's. ::no
- Weak evidence that design A's checkout times tend to rank higher than design B's, not proof that their means differ. ::ok Exactly. A standardized rank-sum statistic measures how far the ranks sit from where they would land if neither design ranked higher, not how far apart two means are.
- A standardized difference between design A's and design B's means. ::no
- Proof that the two designs differ, since z sits to the right of the centre. ::no A z this far from the centre only says the shaded tail area is not huge. It never proves two groups differ, and it says nothing about their means, since the rank-sum statistic is built entirely from ranks, not raw checkout times.

=== step === concept
## Running wilcox.test() and matching the hand result

Run the actual test in R and check it against the \(U_A\) already worked out by hand.

```r
# Run the Wilcoxon rank-sum test on design A and design B
wilcox.test(A, B)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  A and B
#> W = 23, p-value = 0.1775
#> alternative hypothesis: true location shift is not equal to 0
```

W, 23, is exactly \(U_A\), design A's rank sum minus its own baseline. The p-value, 0.1775, comes in higher than the 0.144 the standardized normal curve gave, because R defaults to the exact distribution of \(U\) for a sample this small with no tied values, rather than approximating it with a normal curve.

At 0.1775, well above the usual 0.05 cutoff, the test fails to reject: these 11 checkout times do not give enough evidence that design A's times rank higher than design B's.

=== step === concept
## The mean's 65% gap, and what the test actually found

Put every number from this comparison side by side, and the mismatch becomes obvious.

```r
# Put design A and B's means, medians and the rank-sum test's p-value side by side
cat("mean   A =", mean(A), " B =", mean(B), "\n")
cat("median A =", median(A), " B =", median(B), "\n")
cat("wilcox.test p-value =", round(wilcox.test(A, B)$p.value, 4), "\n")
#> mean   A = 69  B = 41.83333 
#> median A = 52  B = 42.5 
#> wilcox.test p-value = 0.1775 
```

Design A's mean sits 65% above design B's mean, 69 seconds against 41.83. Said out loud, "design A takes 65% longer on average," that sentence sounds decisive. But it is a statement about the mean, and almost all of that 65% gap comes from one customer's 150-second checkout, the same value the rank-sum test was built to ignore.

The rank-sum test looked at the same 11 checkout times and found no significant shift, p = 0.1775, well above the usual 0.05 cutoff. That is not the test failing to notice something real. It is the test doing exactly what it is built to do: judging the two designs by where their times rank against each other, not by how far one outlier pulls a mean.

[WARNING]
Citing design A's 65% higher mean next to a Wilcoxon result that failed to reject is misleading. The honest summary pairs the test's own conclusion with the medians it is actually built around, 52 seconds against 42.5, never with the mean it was built to resist.

=== step === widget
## A third design, ranking three groups, and the Kruskal-Wallis H statistic

A rank-sum test only ever compares two groups. Add a third checkout design, C, timed on 5 more customers, 25, 29, 32, 35 and 38 seconds, and the question changes to whether any of the three designs differ, something a single rank-sum test cannot answer.

Look at all three designs' checkout times together first.

::widget chart-plotter {"data":[{"x":"A","y":38},{"x":"A","y":45},{"x":"A","y":52},{"x":"A","y":60},{"x":"A","y":150},{"x":"B","y":30},{"x":"B","y":33},{"x":"B","y":41},{"x":"B","y":44},{"x":"B","y":48},{"x":"B","y":55},{"x":"C","y":25},{"x":"C","y":29},{"x":"C","y":32},{"x":"C","y":35},{"x":"C","y":38}],"geoms":["boxplot","point"],"x":"design","y":"seconds"}

Design C's times sit noticeably lower than both A and B's, with none of design A's spread.

```r
# Add design C, pool all three groups, and rank every one of the 16 times
C <- c(25, 29, 32, 35, 38)
times <- c(A, B, C)
design3 <- c(rep("A", 5), rep("B", 6), rep("C", 5))
ranks3 <- rank(times)

data.frame(seconds = times, design = design3, rank = ranks3)
#>    seconds design rank
#> 1       38      A  7.5
#> 2       45      A 11.0
#> 3       52      A 13.0
#> 4       60      A 15.0
#> 5      150      A 16.0
#> 6       30      B  3.0
#> 7       33      B  5.0
#> 8       41      B  9.0
#> 9       44      B 10.0
#> 10      48      B 12.0
#> 11      55      B 14.0
#> 12      25      C  1.0
#> 13      29      C  2.0
#> 14      32      C  4.0
#> 15      35      C  6.0
#> 16      38      C  7.5
```

Design A's 38 and design C's 38 are tied for the same value, so instead of one taking rank 7 and the other rank 8, both get the average of those two ranks, 7.5. R's rank() function handles this automatically for any tie.

```r
# Sum each design's ranks, and confirm the three sums cover every rank once
RA <- sum(ranks3[design3 == "A"])
RB <- sum(ranks3[design3 == "B"])
RC <- sum(ranks3[design3 == "C"])

c(RA = RA, RB = RB, RC = RC, total = RA + RB + RC)
#>    RA    RB    RC total 
#>  62.5  53.0  20.5 136.0 
```

Those three sums add to 136, exactly 16 times 17 over 2, the sum of every rank from 1 to 16. That is the same kind of check already used for the two-group rank sums: if a rank got missed or doubled anywhere, the total would not land on 136.

Turn those three rank sums into one statistic, \(H\), with this formula, where \(R_i\) is a group's rank sum, \(n_i\) is its sample size, and \(N\) is the total sample size across all groups.

\[ H = \frac{12}{N(N+1)} \sum_{i} \frac{R_i^2}{n_i} - 3(N+1) \]

```r
# Compute H by hand from the three rank sums
N <- 16
H_hand <- (12 / (N * (N + 1))) * (RA^2 / 5 + RB^2 / 6 + RC^2 / 5) - 3 * (N + 1)
round(H_hand, 4)
#> [1] 7.8294
```

That hand-worked \(H\), 7.8294, uses only the plain rank sums. R's own kruskal.test() applies one small adjustment on top of it: a standard correction for tied ranks, since design A's and design C's 38s shared rank 7.5 instead of taking a rank outright. Run the real test and compare.

```r
# Run the Kruskal-Wallis test on the three designs and compare it to the hand-worked H
kruskal.test(times, design3)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  times and design3
#> Kruskal-Wallis chi-squared = 7.8409, df = 2, p-value = 0.01983
```

The tie correction nudges \(H\) from 7.8294 up to 7.8409, barely a change. Under "no real difference among the three designs," \(H\) follows a chi-squared distribution on groups minus 1 degrees of freedom, 2 here since there are three designs. R's own \(H\) clears that threshold at p = 0.0198, well below 0.05: this time, with design C added, the test does reject.

=== step === quiz
## Quick check: three groups, one statistic

A call centre times 15 calls split evenly across three new scripts, five calls each. It pools and ranks all 15 call times, and gets rank sums of 71 for script X, 58 for script Y and 11 for script Z. What is the correct next step?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Convert the three rank sums into H and compare it to a chi-squared distribution on groups minus 1 degrees of freedom. ::ok Exactly right. H folds the three rank sums into one statistic, which gets compared to a chi-squared distribution on groups minus 1 degrees of freedom, 2 here since there are three scripts.
- Run a two-sample Wilcoxon rank-sum test across all three scripts at once. ::no
- Conclude that script Z, with the smallest rank sum, is already shown to be significantly different from the other two. ::no
- Treat a significant Kruskal-Wallis result as already showing which two of the three scripts differ. ::no A Kruskal-Wallis test, like the rank-sum test, only tests whether the groups' ranks differ overall. It does not run a two-sample test across three groups at once, does not call the largest or smallest rank sum significant by itself, and a significant result only says some pair differs, never which pair.

=== step === tryit
## Your turn: pick the test and read its p-value

Two clinics are piloting a faster check-in process, and the question is whether patients wait less at one branch than the other. Branch 1 timed 5 patients, in minutes: 12, 14, 15, 16 and 40. Branch 2 timed 7 different patients: 9, 10, 11, 13, 14, 15 and 17.

Branch 1 has an obvious outlier of its own, that 40-minute wait, so this calls for the test built to shrug that off. Finish the line below and press Check.

```r
# branch1 and branch2 hold the two clinics' wait times, in minutes
branch1 <- c(12, 14, 15, 16, 40)
branch2 <- c(9, 10, 11, 13, 14, 15, 17)

# Compare the two branches with the right rank-based test
```
::check {"regex": "wilcox[.]test[(]\\s*branch1\\s*,\\s*branch2\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. wilcox.test() returns p = 0.1944, so this gap is not statistically significant. Report branch 1's median, 15 minutes, beside branch 2's median, 13 minutes, next to that p-value, never the two means.", "no": "Two independent groups compared on a continuous outcome call for wilcox.test(), not kruskal.test(), which is for three or more groups. Call it as wilcox.test(branch1, branch2)."}
::solution
```r
# Compare the two clinics' wait times with the Wilcoxon rank-sum test
wilcox.test(branch1, branch2)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  branch1 and branch2
#> W = 26, p-value = 0.1944
#> alternative hypothesis: true location shift is not equal to 0
```

Branch 1's median, 15 minutes, sits two minutes above branch 2's, 13. That is the number to say out loud beside this p-value, never the two means, since one of them is still carrying that 40-minute outlier.

=== step === concept
## References

- Wilcoxon, F. (1945). "Individual Comparisons by Ranking Methods." Biometrics Bulletin, 1(6), 80-83. The paper behind the rank-sum test worked by hand earlier in this lesson.
- Mann, H.B. and Whitney, D.R. (1947). "On a Test of Whether one of Two Random Variables is Stochastically Larger than the Other." Annals of Mathematical Statistics, 18(1), 50-60. The source of the U statistic computed by hand.
- Kruskal, W.H. and Wallis, W.A. (1952). "Use of Ranks in One-Criterion Variance Analysis." Journal of the American Statistical Association, 47(260), 583-621. The source of the H statistic computed by hand for the three-design comparison.
- [wilcox.test() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) - R Core Team. The function used to run the Wilcoxon rank-sum test.
- [kruskal.test() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html) - R Core Team. The function used to run the Kruskal-Wallis test.
- [Wilcoxon, Mann-Whitney, and Kruskal-Wallis in R](https://r-statistics.co/Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html) - the companion reference tutorial with more worked cases and code.

=== step === complete
## What a rank test gives, and what it costs

This checkout-time study produced two findings. Comparing just design A and design B's 11 checkout times, the rank-sum test found no significant shift, even though design A's mean sat 65% above design B's, because that gap was almost entirely one outlier's doing. Adding design C's 5 checkout times and comparing all three designs at once, the Kruskal-Wallis test did find a real shift, p = 0.0198.

Both tests bought the same thing: resistance to that kind of outlier, since a rank only records where a value sits in the order, never how far out it sits. And both tests made the same trade for it. A test on ranks can only say that one group's values tend to sit higher or lower than another's; it cannot hand back a difference measured in seconds, the way a difference in means can.

So whenever one of these tests runs, the number worth saying out loud beside it is the groups' medians, 52 seconds for design A against 42.5 for design B here, never their means. The medians are what the test is actually built around; the means are exactly what it was built to ignore.

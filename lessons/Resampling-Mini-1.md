---
title: "Permutation tests: exact p-values without formulas"
slug: "Resampling-Mini-1"
description: "Two classes scored 6 points apart on the same exam. Shuffle the class labels 10,000 times in R and read off an exact permutation p-value, no formula required."
keywords: "permutation test, permutation test in R, exact p-value, resampling, null distribution, shuffle test, Monte Carlo p-value, hypothesis testing without formulas"
mathjax: false
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "resampling"
course_title: "Resampling"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.31"
lesson_access: "windowed"
catalog_blurb: "See exactly how rare your result is by shuffling the data yourself."
---

=== step === cover
## Permutation tests: exact p-values without formulas

Today let's understand permutation tests, using one simple example you can run yourself.

Two classes of twelve students each sat the same exam, marked out of 100. Their teachers ran things differently: Class A's teacher tried out a fresh approach for the term, while Class B's stuck with the usual lessons. When the marks came in, Class A averaged 78 and Class B averaged 72, a gap of 6 points.

Six points sounds like the new method worked. But does it? Put those exact same 24 students into two random groups of 12, with no teaching method involved at all, and you would still get some gap between the two group averages, just from who happened to land in which group. So how do you tell a real 6-point effect apart from an ordinary 6-point accident?

Here is the whole answer, in four steps you can run on your own computer:

::widget process-flow {"steps":[{"title":"Shuffle the class labels","sub":"reassign which 12 of the 24 real scores are called Class A, the rest Class B"},{"title":"Recompute the mean gap","sub":"find the new difference between the two relabeled class averages"},{"title":"Repeat thousands of times","sub":"do the shuffle and recompute step over and over, 10,000 times in a row"},{"title":"Compare to the real gap","sub":"count how many of those shuffles land a gap of 6 points or more"}]}

That loop is the entire method. Everything from here on is just working through it, one piece at a time.

=== step === concept
## Two classes, one teaching method, and a 6-point gap

Build the 24 real exam scores in R, and see the gap between the two class averages the way R computes it.

```r
# Build the 24 real exam scores and the observed gap between the two class averages
class_a <- c(82, 70, 88, 66, 76, 90, 68, 84, 72, 86, 74, 80)
class_b <- c(76, 64, 82, 60, 70, 84, 62, 78, 66, 80, 68, 74)

exam_scores <- data.frame(
  student = 1:24,
  class   = rep(c("A", "B"), each = 12),
  score   = c(class_a, class_b)
)

exam_scores
#>    student class score
#> 1        1     A    82
#> 2        2     A    70
#> 3        3     A    88
#> 4        4     A    66
#> 5        5     A    76
#> 6        6     A    90
#> 7        7     A    68
#> 8        8     A    84
#> 9        9     A    72
#> 10      10     A    86
#> 11      11     A    74
#> 12      12     A    80
#> 13      13     B    76
#> 14      14     B    64
#> 15      15     B    82
#> 16      16     B    60
#> 17      17     B    70
#> 18      18     B    84
#> 19      19     B    62
#> 20      20     B    78
#> 21      21     B    66
#> 22      22     B    80
#> 23      23     B    68
#> 24      24     B    74

obs_diff <- mean(exam_scores$score[exam_scores$class == "A"]) -
  mean(exam_scores$score[exam_scores$class == "B"])
obs_diff
#> [1] 6
```

Every row is one student, their class, and their real exam score. `obs_diff` is Class A's average minus Class B's average, which comes out to exactly 6.

That 6-point gap is real, in the sense that it truly happened in this exam. What is not yet settled is what caused it. It could be that the new method genuinely helped Class A. Or it could be that these particular 24 students would have landed close to a 6-point gap no matter which 12 of them got called "Class A."

=== step === concept
## Could the 6-point gap be pure chance?
::prose-only builds directly on exam_scores and obs_diff from the step before; no new computation yet

To answer that, start from the opposite assumption: the new teaching method made no real difference at all. This assumption is called the **null hypothesis**. Under it, a student's exam score would have come out about the same no matter which of the two classes they had sat in.

If that is true, then the label "Class A" or "Class B" carries no real information about a student's score. It is just a tag attached to 12 of the 24 students, and it could just as easily have been attached to a different 12. The observed gap of 6 is then only one possible outcome out of many that this kind of arbitrary labeling could produce.

So the real question becomes: if you relabeled these same 24 students into two groups of 12 at random, over and over, how often would you land a gap of 6 points or more purely by chance?

=== step === concept
## Shuffling the class labels without replacement

Run one permutation: keep the same 24 real scores, and only change which 12 of them are called Class A.

```r
# One permutation: shuffle which student is called Class A or Class B
set.seed(1)
shuffled_class <- sample(exam_scores$class)

# The scores never move. Only the label next to each one does
data.frame(student = exam_scores$student[9:16],
           score = exam_scores$score[9:16],
           original_class = exam_scores$class[9:16],
           shuffled_class = shuffled_class[9:16])
#>   student score original_class shuffled_class
#> 1       9    72              A              A
#> 2      10    86              A              B
#> 3      11    74              A              A
#> 4      12    80              A              A
#> 5      13    76              B              B
#> 6      14    64              B              B
#> 7      15    82              B              A
#> 8      16    60              B              B

shuffled_diff <- mean(exam_scores$score[shuffled_class == "A"]) -
  mean(exam_scores$score[shuffled_class == "B"])

c(obs_diff = obs_diff, shuffled_diff = shuffled_diff)
#>      obs_diff shuffled_diff 
#>             6             1
```

`sample(exam_scores$class)` takes the 24 "A"/"B" tags and hands them back out in a new random order. Nothing about the scores changes: student 9 still scored 72, student 15 still scored 82. Only the label sitting next to each score moves, as the table above shows for students 9 through 16.

This is resampling **without replacement**. Every one of the 24 real labels is used exactly once in the shuffle, none dropped and none repeated, just rearranged. That is different from resampling **with replacement**, where the same label could be picked more than once and another left out entirely; a permutation test never does that.

This one shuffle happened to land a gap of just 1 point, nowhere near the real 6. Run it again with a different seed and you would get a different small number. That is expected: most random relabelings of 24 ordinary exam scores should not favor either class by much.

=== step === concept
## How often does a gap this big happen by pure chance?

Repeat that one shuffle 10,000 times, and store every gap it produces.

```r
# Repeat the shuffle-and-recompute step 10,000 times and store every gap
set.seed(2026)
B <- 10000
perm_diffs <- replicate(B, {
  shuffled <- sample(exam_scores$class)
  mean(exam_scores$score[shuffled == "A"]) - mean(exam_scores$score[shuffled == "B"])
})

# How many of the 10,000 shuffled gaps are 6 points or more, in either direction
sum(abs(perm_diffs) >= 6)
#> [1] 946
```

`perm_diffs` now holds 10,000 numbers, each one the gap a completely random relabeling produced. That spread of numbers is the **null distribution**: what the gap between two classes looks like when the class label carries no real information at all. Out of those 10,000 pure-chance relabelings, 946 landed a gap of 6 points or more, a rate of 9.46%.

The widget below repeats that exact rate as single simulated shuffles you can trigger yourself. Each "game" is one shuffle, a "win" is a shuffle that lands a gap of 6 or more, and the win rate it uses is the 9.46% you just measured directly from `exam_scores`.

::widget luck-simulator {"trials": 1, "p": 0.0946, "observed": 1, "unit": "shuffles landing a gap of 6 points or more"}

Run it a few times, in batches of 1,000. Watch how rarely a win shows up. That is what a 9.46% chance actually feels like, once you watch it play out instead of just reading the number.

=== step === quiz
## Quick check: shuffling and the null hypothesis

Which of these is what actually happens inside one shuffle of `exam_scores$class`?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The 24 real scores get reshuffled, so each student ends up with a different, randomly assigned mark ::no
- The class label attached to each score gets reshuffled, while all 24 real scores stay exactly where they are and each is used exactly once ::ok Right. sample() here only moves the "A" and "B" tags around. Every one of the 24 real marks stays fixed and appears exactly once, which is exactly what "the label carries no information" should look like.
- A fresh set of 24 scores gets drawn from the pooled data with replacement, so some real scores could be picked more than once and others left out ::no A permutation never touches the scores, and it never resamples with replacement. It keeps all 24 real marks, uses each one exactly once, and only swaps which class label sits next to which one. That is what makes it a fair stand-in for "the teaching method made no difference."

=== step === concept
## Turning the shuffle count into a p-value

Turn that 946-out-of-10,000 count into the number statisticians actually report: the p-value.

```r
# Turn the shuffle count into an exact permutation p-value
p_val <- (1 + sum(abs(perm_diffs) >= abs(obs_diff))) / (B + 1)
round(p_val, 4)
#> [1] 0.0947
```

The formula is `(1 + count) / (B + 1)`, not just `count / B`. That `+1` on both the top and the bottom counts the real, observed labeling itself as one more valid permutation among the ones considered, since it is, after all, one of the ways these 24 scores could have been split into two groups of 12. It also keeps the p-value from ever landing on exactly 0, since even the rarest observed gap is still one event out of the total.

So the exact permutation p-value for this exam is 0.0947. No t-distribution, no normal approximation, nothing looked up in a table. Just a count of shuffles, divided by how many shuffles you ran.

=== step === concept
## Reading the p-value off the null distribution

Plot all 10,000 shuffled gaps as a histogram, mark the real 6-point gap on it, and see how spread out that pile of shuffled gaps really is.

```r
# Plot the null distribution, mark the observed gap, and measure its spread
hist(perm_diffs, breaks = 30, col = "grey85", border = "white",
     main = "10,000 shuffled gaps under the null", xlab = "shuffled mean gap")
abline(v = c(-6, 6), col = "#b5631a", lwd = 2, lty = 2)

round(sd(perm_diffs), 2)
#> [1] 3.48
```

Most of that grey pile sits close to zero, which makes sense: most random relabelings do not favor either class much. The two dashed lines at -6 and 6 mark the real gap, on both sides since a method could in principle have hurt Class A instead of helping it. The p-value, 0.0947, is exactly the share of that pile sitting at or beyond those two lines.

To place 6 on a scale that works for any test, divide it by how spread out the shuffled gaps are: 6 / 3.48 is about 1.72. That is where the marker below starts.

::widget null-distribution {"tails": 2, "start": 1.72, "label": "how far the real gap sits from the center"}

The shaded area is that same idea, drawn as a smooth curve instead of a grey histogram: the share of the curve at least as far from the center as the marker, on both sides. At 1.72 it reads close to 8%, near the 9.46% you counted directly from the real shuffles. The two numbers do not match to the decimal, because this curve is a smoothed stand-in for the lumpy real histogram above it, and the real histogram is the one to trust.

Drag the marker further out and the shaded slice shrinks. Pull it back toward the center and the slice grows.

=== step === concept
## Exact enumeration versus Monte Carlo shuffling

See how fast the number of possible relabelings grows as the class size grows, and why you drew 10,000 random shuffles instead of every single one.

```r
# How many ways can n scores be split into two equal groups, as n grows
ns <- c(10, 20, 24, 30, 40)
growth_table <- data.frame(n = ns, shuffles = choose(ns, ns / 2))
growth_table
#>    n     shuffles
#> 1 10          252
#> 2 20       184756
#> 3 24      2704156
#> 4 30    155117520
#> 5 40 137846528820
```

For our 24 students, there are 2,704,156 different ways to choose which 12 are called Class A, about 2.7 million. A computer could enumerate every single one of them and get an exact p-value with zero uncertainty. At 24 students that is still doable.

But look at what happens past that. At 30 students it is already 155 million. At 40 it is over 137 billion. Enumerating every possible relabeling stops being practical long before a class gets anywhere near that size.

That is exactly why you drew `B = 10000` random shuffles instead of every possible one. It is a sample from the full set of relabelings, not the whole set, so it carries a small amount of sampling error. That error shrinks the more shuffles you draw, and it follows a known pattern: `sqrt(p * (1 - p) / B)`. With `p_val` at about 0.095 and `B` at 10,000, that works out to about 0.003, small enough that the second decimal place of the p-value can be trusted.

=== step === quiz
## Quick check: permutation tests, start to finish

You permuted `exam_scores` 10,000 times and counted 946 shuffled gaps at least as extreme as the real 6-point gap, giving a p-value of about 0.095. Which reading of that number is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A p-value above 0.05 proves the new teaching method made no real difference ::no
- Assuming the method made no real difference, a gap of 6 points or more would show up by pure chance about 9.5% of the time, which is common enough that this result alone does not rule out chance ::ok Exactly. The p-value never proves or disproves anything on its own. It only says how often a gap this size turns up under the assumption of no real effect, and 9.5% of the time is not rare.
- Running the same 10,000 shuffles again with a different set.seed() would land on exactly 0.0947 every time, since a permutation test is an exact, deterministic calculation ::no A Monte Carlo permutation test draws a random sample of shuffles out of the roughly 2.7 million that exist, so a different seed gives a slightly different count and a slightly different p-value. Only enumerating every one of those 2.7 million shuffles would be exact and deterministic. That randomness is small, about 0.003 here, which is why 10,000 shuffles is already precise enough to trust.

=== step === tryit
## Your turn: compute a one-sided permutation p-value

`exam_scores`, `obs_diff`, `perm_diffs` and `B` are still here from earlier. Compute a one-sided p-value for the claim that Class A's method genuinely raised scores, not just changed them in either direction.

```r
# exam_scores, obs_diff, perm_diffs and B are already built from earlier steps.
# Count only the shuffled gaps that are AT LEAST AS LARGE AS obs_diff (drop the
# absolute value, since a one-sided test only cares about one direction).
# Apply the same +1 correction as before, and store the result in one_sided_p.
# Two lines. Press Check when you have them.
```
::check {"regex": "perm_diffs\\s*>=\\s*obs_diff", "gate": true, "difficulty": "intermediate", "ok": "Right: 470 shuffled gaps out of 10,000 land at or beyond the real gap in that one direction. Add the +1 correction and that is 471 out of 10,001, a one-sided p-value of about 0.0471, close to half of the two-sided 0.0947 from earlier. Dropping the absolute value only counts shuffles that beat the gap in the direction Class A actually moved.", "no": "Reuse the two-sided line from earlier, but drop the abs() around perm_diffs and compare it straight to obs_diff: sum(perm_diffs >= obs_diff), then apply the same (1 + count) / (B + 1) correction."}
::solution
```r
# Count shuffles at least as extreme as obs_diff in one direction, then apply the +1 correction
one_sided_p <- (1 + sum(perm_diffs >= obs_diff)) / (B + 1)
round(one_sided_p, 4)
#> [1] 0.0471
```

=== step === concept
## References

- Good, P.I. (2005). [Permutation, Parametric and Bootstrap Tests of Hypotheses](https://link.springer.com/book/10.1007/b138696) (3rd ed.). Springer.
- Ernst, M.D. (2004). [Permutation Methods: A Basis for Exact Inference](https://doi.org/10.1214/088342304000000396). *Statistical Science*, 19(4), 676-685.
- Hothorn, T., Hornik, K., van de Wiel, M.A., Zeileis, A. (2008). [Implementing a Class of Permutation Tests: The coin Package](https://doi.org/10.18637/jss.v028.i08). *Journal of Statistical Software*, 28(8).
- Fisher, R.A. (1935). [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684). Oliver and Boyd.

=== step === complete
## Quick recap

You built a permutation test from nothing but `sample()`, `replicate()`, and `mean()`, and used it to judge a real 6-point gap between two classes. To recap:

- The null hypothesis says the class label carries no real information, so relabeling the 24 real scores at random should produce gaps a lot like the real one, if the method made no difference.
- Shuffling without replacement keeps every real score exactly once and only reassigns its class label, which is what makes a shuffle a fair stand-in for "no real effect."
- Repeating that shuffle 10,000 times builds a null distribution: 10,000 gaps that pure relabeling alone can produce.
- The p-value is a count, not a formula: `(1 + number of shuffled gaps at least as extreme as 6) / (B + 1)`, which came out to 0.0947 here.
- Exact enumeration is possible for 24 students but becomes infeasible past a few dozen, which is why Monte Carlo shuffling, with its small and well-understood sampling error, is the practical choice almost everywhere.

Next time someone hands you two numbers and asks if the gap between them is real, you know how to answer it yourself: shuffle, count, and let the data say how rare that gap really is.

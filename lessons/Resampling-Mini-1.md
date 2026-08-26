---
title: "Permutation tests: exact p-values without formulas"
slug: "Resampling-Mini-1"
description: "Two classes, a six-point gap, and no table anywhere to look it up in. Shuffle the class labels ten thousand times in R and count your way to an exact p-value."
keywords: "permutation test, permutation test in R, exact p-value, randomization test, null distribution, shuffling labels, nonparametric test, resampling in R"
mathjax: true
webr: true
date: "2026-08-26"
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
catalog_blurb: "How to get a p-value by shuffling your own data, no formula needed."
---

=== step === cover
::eyebrow Resampling
## Permutation tests: exact p-values without formulas

Let's say two classes sat the same end-of-term exam last week.

Class A was taught with a new method and averaged 78. Class B was taught the usual way and averaged 72. So the two classes came out six points apart.

Now, is six points anything?

The usual way to answer that is to pick a test out of a book, check whether your data is allowed to use that test, and read a number off a table. There is a nicer way, and it needs nothing except the sixty exam scores you already have.

Here it is. If the new method really made no difference, then which room a student sat in was only a sticker on their answer sheet. The score they wrote was going to be that score either way. So peel all sixty stickers off, deal them out again at random, and see what gap comes back.

Do that a few thousand times and you are holding every gap that pure luck can produce. Then the only thing left is counting: how many of those luck-only gaps reached six points?

::widget process-flow {"steps":[{"title":"Assume it did nothing","sub":"the class label is only a sticker on the answer sheet"},{"title":"Deal the labels again","sub":"shuffle the 60 students between the two classes, 10,000 times"},{"title":"Count the matches","sub":"how many shuffled gaps reached the real 6 points"}]}

That count, divided by the number of shuffles you ran, is your p-value. Everything from here is doing it, one line of R at a time.

=== step === concept
## The two classes and their six-point gap

Let's get the numbers on the table first, because every calculation after this is built out of them.

Sixty students sat the paper, thirty in each class, marked out of 100. Class A had the new method, class B had the usual one, and each student walked away with one whole-number score. The scores are generated below so that you and I are looking at exactly the same sixty numbers.

Press Run.

```r
# Build the two classes of exam scores and measure the gap between their averages
set.seed(31653)
exam <- data.frame(
  class = rep(c("A", "B"), each = 30),
  score = c(round(rnorm(30, 78, 10)),    # class A, taught with the new method
            round(rnorm(30, 72, 10)))    # class B, taught the usual way
)

head(exam, 4)
#>   class score
#> 1     A    75
#> 2     A    87
#> 3     A    72
#> 4     A    65

mean_A  <- mean(exam$score[exam$class == "A"])
mean_B  <- mean(exam$score[exam$class == "B"])
obs_gap <- mean_A - mean_B

c(A = mean_A, B = mean_B, gap = obs_gap)
#>   A   B gap
#>  78  72   6
```

Every row of `exam` is one student: the class they sat in and the mark they got. Pulling out `exam$score` by class and taking `mean()` gives each class its average.

So `obs_gap` is 6, and from here on that means six exam points: class A's average minus class B's.

[NOTE]
Six points is the whole question. Nobody doubts that 78 is bigger than 72. What we do not know yet is whether a gap that size is remarkable or completely ordinary.

=== step === concept
## What would have to be true for six points to mean nothing

Here's what makes the whole thing work.

To argue that the new method helped, you do not start by assuming it helped. You start by assuming the opposite: the method changed nothing at all. Not one student answered a single question differently because of which class they were in.

That assumption is called the **null hypothesis**, written H0 and said out loud as "H nought". It is the boring story, and our job is to find out whether the data makes it look ridiculous.

Under that story, the word `A` or `B` on a student's paper carries no information. It is a sticker. The 78 and the 72 came out of which thirty students happened to walk into which room, and nothing else.

Look at what the boring story has to explain.

```r
# Show how many students sat in each class and what each class averaged
data.frame(
  class    = c("A", "B"),
  students = as.numeric(table(exam$class)),
  average  = as.numeric(tapply(exam$score, exam$class, mean))
)
#>   class students average
#> 1     A       30      78
#> 2     B       30      72
```

There are thirty students in each class, so neither one had the advantage of being the bigger group. The null hypothesis has to explain 78 against 72 using nothing but the luck of who walked into which room.

Fine. Let's make it do that and see how well it manages.

=== step === concept
## One shuffle, and the gap it produced

So let's take the sticker idea completely literally.

Peel all sixty labels off the answer sheets. Drop the thirty `A` stickers and the thirty `B` stickers into a bowl, shake it, and hand them back out to the sixty students at random. Nobody's score changes. A student who wrote 87 still has 87. All that moves is which class they are counted in.

That is what `sample()` does here. It keeps the same thirty A labels and thirty B labels and deals them out to different students.

```r
# Deal the same class labels out to different students and measure the new gap
set.seed(1)
shuffled_class <- sample(exam$class)

shuffled_gap <- mean(exam$score[shuffled_class == "A"]) -
                mean(exam$score[shuffled_class == "B"])

round(shuffled_gap, 4)
#> [1] -3.5333
```

`set.seed(1)` fixes which shuffle you get, so your number is the same as mine.

Now look at what came back. Minus 3.53 points. In a world we built by hand so that the label means nothing, class B still finished 3.53 points ahead of class A.

That is the whole reason a p-value has to exist.

Luck does not hand you zero by default. It still produces gaps, and sometimes big ones, which is exactly why you cannot say anything at all about six points until you know how big luck's gaps can get.

=== step === quiz
## Quick check: what does a shuffle move?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It evens the two classes out, so the gap after a shuffle comes back as zero. ::no
- It breaks any link between the class a student sat in and the score they wrote, so whatever gap is left over is luck and nothing else. ::ok Exactly. The sixty scores never move. Only the labels do, which is how you build the boring story on purpose and then watch what it produces.
- It takes the six points away from class A, so the data no longer favours the new method. ::no
- It proves the new method made no difference. ::no A shuffle does not flatten the gap and it does not prove anything. It rebuilds the data under the boring story, where the class label is a random sticker, so any gap that turns up afterwards is luck alone. That is exactly why one shuffle still came back with 3.53 points.

=== step === concept
## Ten thousand shuffles and the null distribution they build

One shuffle told us that luck can reach 3.53 points. What it cannot tell us is how far luck usually reaches, or how far it reaches on a good day.

For that we need thousands of shuffles. `replicate()` runs the same block of code over and over and keeps the result of each run, so ten thousand shuffles and their ten thousand gaps take one call and a couple of seconds.

```r
# Repeat the shuffle 10,000 times and keep the gap that each one produced
set.seed(1)
null_gaps <- replicate(10000, {
  shuffled_class <- sample(exam$class)
  mean(exam$score[shuffled_class == "A"]) -
    mean(exam$score[shuffled_class == "B"])
})

hist(null_gaps, breaks = 40, col = "grey85", border = "white",
     main = "10,000 deals of a class label that means nothing",
     xlab = "Gap in exam points (class A minus class B)")
abline(v = obs_gap, col = "red", lwd = 3)
```

Let's read that output. The grey pile has a name: it is the **null distribution**, the set of results a statistic takes when the null hypothesis is true. Every bar is a batch of shuffled worlds where the teaching method did nothing, and the height says how often luck produced a gap that size.

You can see most of the pile sits near zero, which is what you would expect once the label is meaningless. The tails stretch out to about nine points in either direction, so luck is capable of a nine-point gap, just rarely.

The red line is our real result, six points. It is not off the chart. It sits out in the thin part of the pile, with grey still to the right of it.

How much grey is out there? Let's count it next.

=== step === concept
## Counting the shuffles that reached six points

Here is where the p-value is actually made, and it is nothing but a count.

We want the shuffles that did as well as our real classes or better, and better in either direction, because before the exam nobody promised which class would come out ahead. A six-point win for class B would have surprised us just as much as a six-point win for class A. `abs()` folds both sides together by throwing away the sign.

```r
# Count the shuffled gaps that reached the real six-point gap
sum(abs(null_gaps) >= obs_gap)
#> [1] 131

mean(abs(null_gaps) >= obs_gap)
#> [1] 0.0131
```

`abs(null_gaps) >= obs_gap` gives ten thousand TRUEs and FALSEs. `sum()` counts the TRUEs, and `mean()` turns that same count into a share, because the average of a column of ones and zeros is the proportion of ones.

So 131 of the 10,000 luck-only shuffles reached six points or more. As a share, 0.0131.

That is the p-value, near enough. No formula, no table, no assumed distribution to look anything up in. A count of shuffles that matched or beat the real classes, divided by how many shuffles you ran.

[KEY INSIGHT]
If the new method changed nothing, a gap of six points or more would still show up in about 13 of every 1,000 attempts. We got one. That sentence is the entire meaning of the number, and it is the only claim the number makes.

=== step === concept
## The p-value formula, and why the count starts at one

There is one small repair to make to 0.0131, and the reason is worth a minute.

Think about what the ten thousand shuffles are. They are ten thousand ways the sixty students could have been split into two groups of thirty. The way they actually were split is one of those ways too. It is a perfectly legitimate deal of the labels and we watched it happen, so it belongs in the pile.

Adding it to the count and to the total gives the corrected p-value:

\[ p = \frac{1 + \#\{\, |g_b| \ge |g_{\text{obs}}| \,\}}{B + 1} \]

Reading it left to right: \( g_{\text{obs}} \) is the gap in the real classes, six points. \( g_b \) is the gap from shuffle number b. The `#` sign means "the number of", so the top counts the shuffles that reached six points, plus one for the real split. B is how many shuffles you ran, and the bottom is that plus the same one.

```r
# Add the observed split to the count and to the total
B <- 10000
p_value <- (1 + sum(abs(null_gaps) >= obs_gap)) / (B + 1)

round(p_value, 4)
#> [1] 0.0132
```

0.0132 instead of 0.0131. On this data the correction changes almost nothing, which is normal.

It matters at the other end of the scale. Without the plus one, a result so extreme that no shuffle ever matched it would report a p-value of exactly zero, and zero would be a claim that the boring story is flat-out impossible. Ten thousand shuffles cannot support a claim that strong. With the correction the smallest number you can ever report is 1 divided by 10,001, which says exactly the right thing: rarer than ten thousand shuffles could measure.

[TIP]
Use the corrected formula every time. It costs one character, it can never be wrong, and it stops you publishing a p-value of zero.

=== step === widget
## Where the six-point gap sits in the null distribution

First, let's take those ten thousand grey bars and smooth them into a curve. It has the same shape, piled around zero and thinning out as you move away in either direction.

To put the real gap on that curve we need it in the curve's own units, which are not exam points. They are noise widths: how many standard deviations of the null distribution the gap sits away from zero.

```r
# Measure the real gap in standard deviations of the null distribution
round(sd(null_gaps), 3)
#> [1] 2.421

round(obs_gap / sd(null_gaps), 2)
#> [1] 2.48
```

Luck's typical gap is about 2.42 points, and six points is 2.48 of those. That is where the slider starts.

::widget null-distribution {"tails": 2, "start": 2.48, "label": "how far the six-point gap sits from zero"}

The shaded area is the p-value: the share of luck-only results that reach at least as far out as ours, counted on both sides. At 2.48 it reads about 0.013, which is where our counting landed.

Now drag it. Push the result further from zero, as if class A had won by more, and the shaded slice keeps shrinking. Pull it back toward zero and the slice swells, because a small gap is the sort of thing luck produces all the time.

So a result further from the middle leaves a smaller tail, and a smaller tail is a smaller p-value.

=== step === tryit
## Your turn: the one-sided p-value

We counted both directions, because a six-point win for class B would have surprised us just as much. Suppose you had said in advance that the new method could only help and never hurt. Then only one direction counts: the shuffles where class A came out ahead.

`null_gaps` still holds all 10,000 gaps and `obs_gap` still holds the real 6. Drop the `abs()`, count the shuffles where class A finished six points or more ahead, then turn that count into a corrected p-value.

```r
# null_gaps holds 10,000 gaps in exam points, from shuffles where
# the class label meant nothing. obs_gap is the real gap, 6.
# Count the shuffles where class A finished 6 points or more ahead,
# then write that count as a corrected p-value.
# Two lines. Press Check when you have them.
```
::check {"regex": "null_gaps\\s*>=\\s*obs_gap", "gate": true, "difficulty": "beginner", "ok": "Right: 75 of the 10,000, a corrected p-value of 0.0076. It comes out close to half the two-sided answer, because the null distribution is near enough symmetric around zero.", "no": "Take the counting line from a moment ago and drop the `abs()` from it, leaving `sum(null_gaps >= obs_gap)`. Then wrap that count in the corrected formula, `(1 + count) / (B + 1)`."}
::solution
```r
# Count only the shuffles that put class A ahead by six points or more
sum(null_gaps >= obs_gap)
#> [1] 75

round((1 + sum(null_gaps >= obs_gap)) / (B + 1), 4)
#> [1] 0.0076
```

Half of 0.0132 is 0.0066 and we got 0.0076, so the two sides are close but not identical, because the null distribution is only roughly symmetric.

Deciding one-sided before you look at the data is fine. Deciding it afterwards, once you have seen which way the gap fell, is not, because then you are picking the direction that suits you and halving your own p-value.

=== step === concept
## Exchangeability, the one assumption behind the shuffle

Every test rests on something. So it is worth being clear about what this one rests on, and the list is short.

The shuffle assumes that when the null hypothesis is true, the labels can be swapped between observations without changing anything about the data. Statisticians call this **exchangeability**. Sixty students, sixty scores, and if the method did nothing then any deal of thirty A labels and thirty B labels is as likely as any other. That is the entire assumption.

Notice what is not on the list:

- **Normality.** The scores can be skewed, lumpy, bimodal, whatever they are. The shuffle never asks.
- **Equal variance.** Class A can be far more spread out than class B and it changes nothing.
- **A large sample.** Nothing here appeals to what happens as the sample grows. Eight students per class works the same way as eight hundred.
- **A statistic with known behaviour.** We come back to this shortly, and it is the part that buys you the most.

What the assumption does demand is that the labels are genuinely interchangeable under the null. That is a fact about how the data was collected, not about the numbers themselves, and it is the one thing you have to think about rather than test.

When it holds, the shuffle is exact and needs nothing else. When it does not hold, shuffling freely gives you a confident answer to the wrong question.

=== step === concept
## When a free shuffle is the wrong shuffle

Here is a study where free shuffling falls apart, and it falls apart without any warning, which is what makes it worth seeing.

Twenty students sat a test, then went through the new method, then sat a comparable test again. Nobody is being compared to anybody else. Each student is their own control, and the number that matters is the gain: their second score minus their first.

```r
# Build the before-and-after scores for 20 students and measure the average gain
set.seed(21)
before <- round(rnorm(20, 70, 11))
after  <- before + round(rnorm(20, 4, 5))
gain   <- after - before

head(data.frame(student = 1:20, before, after, gain), 5)
#>   student before after gain
#> 1       1     79    85    6
#> 2       2     76    80    4
#> 3       3     89    88   -1
#> 4       4     56    54   -2
#> 5       5     94    97    3

gain
#>  [1]  6  4 -1 -2  3  8  6 -2  0  0 -5  2  4  9 12  4 13  4 11 11

mean(gain)
#> [1] 4.35
```

The average student gained 4.35 points. The best gained 13, one lost 5, and two did not move at all.

Now, which labels are exchangeable here? Not `before` and `after` across the whole set of forty scores, because student 5 scoring in the nineties and student 4 scoring in the fifties has nothing to do with the method. Swapping one student's score for another student's score invents a comparison the study never made.

What is exchangeable is the direction of each student's own change. If the method did nothing, a student who went up 6 was equally likely to have gone down 6, so the sign of each gain is a coin flip. That is the shuffle this design allows: keep every gain attached to its own student, and flip signs.

Let's run both and put them side by side.

```r
# Compare the right shuffle with the wrong one on the same 20 students
set.seed(1)
flip_gains <- replicate(10000, {
  signs <- sample(c(-1, 1), 20, replace = TRUE)
  mean(signs * gain)
})

all_scores <- c(before, after)
labels     <- rep(c("before", "after"), each = 20)
free_gains <- replicate(10000, {
  shuffled <- sample(labels)
  mean(all_scores[shuffled == "after"]) - mean(all_scores[shuffled == "before"])
})

p_flip <- (1 + sum(abs(flip_gains) >= mean(gain))) / 10001
p_free <- (1 + sum(abs(free_gains) >= mean(gain))) / 10001

round(c(sign_flip = p_flip, free_shuffle = p_free), 4)
#>    sign_flip free_shuffle
#>       0.0013       0.3122
```

It is the same twenty students, the same 4.35-point gain and the same ten thousand shuffles. The right shuffle reads 0.0013. The wrong one reads 0.3122, which most people would read as "nothing here" and walk away from.

The free shuffle buried the effect under the differences between students. Those differences are large, they have nothing to do with the method, and pairing was the design that removed them.

[WARNING]
The design decides what may be exchanged, and the code will not tell you when you have got it wrong. A free shuffle on paired data runs cleanly, returns a sensible-looking number, and hides a real effect.

=== step === quiz
## Quick check: which shuffle fits a before-and-after design?

Twenty students were measured before the method and again after it, so every student appears twice.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Pool all forty scores and deal out twenty before labels and twenty after labels at random, exactly as with two separate classes. ::no
- Shuffle the students into two groups of ten and compare those groups. ::no
- Keep each student's own gain attached to that student and flip its sign at random, because under the null a gain of plus 6 was as likely to have been minus 6. ::ok That is the one. Pairing is what removes the differences between students, and only a shuffle that respects the pairing keeps that advantage.
- No shuffle works on paired data, so a paired t-test is the only option left. ::no The pairing is the design's strength, and a shuffle that ignores it throws that strength away: the free shuffle mixed one student's score with another student's and read 0.3122 on a gain the sign-flip called 0.0013. Paired data does not rule out permutation, it only rules out shuffling freely.

=== step === concept
## Testing the median, a statistic with no formula

Now for the part that pays for the whole method.

Everything we have done to the mean, we can do to any number computed from the data, because the shuffle never once used a property of the mean. It shuffled labels, recomputed something, and counted. Swap what gets recomputed and the machinery does not notice.

Say the class averages worry you. One student who walks out early can drag a mean around, and the median does not care. There is no neat textbook formula for the sampling distribution of a difference in medians, which is exactly why medians are so rarely tested. The shuffle does not need one.

Watch how little has to change: `median` goes where `mean` was, and nothing else moves.

```r
# Run the same shuffle again, comparing medians instead of means
obs_median_gap <- median(exam$score[exam$class == "A"]) -
                  median(exam$score[exam$class == "B"])

set.seed(1)
null_medians <- replicate(10000, {
  shuffled_class <- sample(exam$class)
  median(exam$score[shuffled_class == "A"]) -
    median(exam$score[shuffled_class == "B"])
})

p_median <- (1 + sum(abs(null_medians) >= obs_median_gap)) / 10001

c(median_gap = obs_median_gap,
  matches    = sum(abs(null_medians) >= obs_median_gap),
  p_value    = round(p_median, 4))
#> median_gap    matches    p_value
#>     5.0000   251.0000     0.0252
```

The median score in class A is five points above class B, 251 shuffles reached five points or more, and the p-value is 0.0252.

That is weaker than the 0.0132 the means gave, and the reason is worth knowing. These are whole-number exam scores, so a median can only ever land on a whole number or a half. A statistic that moves in steps that coarse separates fewer shuffles from each other, and a test that cannot tell its shuffles apart cannot be as sharp. You trade a little of that sharpness for a statistic no single wild score can drag around.

The point stands either way: you just tested a difference in medians, and you did not look up a single thing.

=== step === tryit
## Your turn: a permutation test on the trimmed mean

The trimmed mean sits between the two. `mean(x, trim = 0.1)` throws away the lowest 10% and the highest 10% of the values and averages what is left, so it keeps the mean's fine grain while refusing to be dragged by the extremes.

`exam` is still in scope. Run the same test on a 10% trimmed mean: work out the observed gap, shuffle 10,000 times after `set.seed(1)`, and report the corrected p-value.

```r
# exam holds 60 students in two classes of 30, with columns class and score.
# Compute the gap in 10 percent trimmed means between class A and class B,
# shuffle the class labels 10,000 times after set.seed(1) collecting that gap,
# then report the corrected p-value.
# Press Check when you have it.
```
::check {"regex": "trim\\s*=\\s*0?\\.1", "gate": true, "difficulty": "intermediate", "ok": "That is it: a trimmed gap of 6.5 points, 69 shuffles reaching it, and a corrected p-value of 0.007. Trimming the tails widened the gap and sharpened the test.", "no": "Only one thing changes from the median run, and that is the statistic. Write a small helper such as trim_mean, defined as mean of s with trim = 0.1, then use it in place of median in both the observed gap and the loop."}
::solution
```r
# Run the same shuffle on a 10 percent trimmed mean
trim_mean <- function(s) mean(s, trim = 0.1)

obs_trim_gap <- trim_mean(exam$score[exam$class == "A"]) -
                trim_mean(exam$score[exam$class == "B"])

set.seed(1)
null_trimmed <- replicate(10000, {
  shuffled_class <- sample(exam$class)
  trim_mean(exam$score[shuffled_class == "A"]) -
    trim_mean(exam$score[shuffled_class == "B"])
})

p_trim <- (1 + sum(abs(null_trimmed) >= obs_trim_gap)) / 10001

c(trimmed_gap = obs_trim_gap,
  matches     = sum(abs(null_trimmed) >= obs_trim_gap),
  p_value     = round(p_trim, 4))
#> trimmed_gap     matches     p_value
#>       6.500      69.000       0.007
```

Three statistics on the same sixty students now: 0.0132 for the mean, 0.0252 for the median, 0.007 for the trimmed mean. They disagree in the third decimal because each one asks a slightly different question about the same data, and the shuffle tested all three exactly the same way.

=== step === concept
## What the t-test assumes that the shuffle does not

The t-test would have answered this question in one line, so it is fair to ask what the shuffling bought us. Run it on the sixty exam scores and see.

```r
# Run Welch's t-test on the same sixty exam scores
t.test(exam$score[exam$class == "A"], exam$score[exam$class == "B"])
#>
#> 	Welch Two Sample t-test
#>
#> data:  exam$score[exam$class == "A"] and exam$score[exam$class == "B"]
#> t = 2.5732, df = 57.777, p-value = 0.01266
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>   1.33223 10.66777
#> sample estimates:
#> mean of x mean of y
#>        78        72
```

0.01266 against our 0.0132. They agree to two decimals, and neither one is more correct than the other. The t-test got there by assuming a shape for the null distribution and reading the tail off that shape. We got there by building the null distribution out of the data and counting it.

So on sixty well-behaved scores the assumption costs nothing. Here is a study where it costs a lot.

Before the full rollout, the method was piloted on eight students per class. In class B one student walked out after ten minutes and scored 9.

```r
# Compare the two tests on the eight-per-class pilot, including the walkout score of 9
pilot <- data.frame(
  class = rep(c("A", "B"), each = 8),
  score = c(85, 87, 68, 81, 69, 79, 75, 96,
            67, 63, 66, 73, 69, 71, 79,  9)
)

round(tapply(pilot$score, pilot$class, sd), 2)
#>     A     B
#>  9.43 22.01

pilot_gap <- mean(pilot$score[pilot$class == "A"]) -
             mean(pilot$score[pilot$class == "B"])

set.seed(1)
pilot_nulls <- replicate(10000, {
  shuffled <- sample(pilot$class)
  mean(pilot$score[shuffled == "A"]) - mean(pilot$score[shuffled == "B"])
})

p_pilot_perm <- (1 + sum(abs(pilot_nulls) >= pilot_gap)) / 10001
p_pilot_t    <- t.test(pilot$score[pilot$class == "A"],
                       pilot$score[pilot$class == "B"])$p.value

round(c(gap = pilot_gap, t_test = p_pilot_t, permutation = p_pilot_perm), 4)
#>         gap      t_test permutation
#>     17.8750      0.0624      0.0116
```

The two classes are nearly 18 points apart, and the two tests disagree about whether that means anything. The t-test says 0.0624 and shrugs. The shuffle says 0.0116.

The 9 is doing all of it. Look at the two standard deviations above: 9.43 in class A and 22.01 in class B, and that whole difference is one score's doing. The t statistic is the gap divided by a term built out of those standard deviations, so a denominator that large drags the whole statistic down. The shuffle never divides by anything. It moves the 9 around with all the other scores and asks how often that produces an 18-point gap.

Take the walkout out and the disagreement goes with it.

```r
# Drop the walkout score and run both tests again
kept <- pilot[pilot$score != 9, ]

kept_gap <- mean(kept$score[kept$class == "A"]) -
            mean(kept$score[kept$class == "B"])

set.seed(1)
kept_nulls <- replicate(10000, {
  shuffled <- sample(kept$class)
  mean(kept$score[shuffled == "A"]) - mean(kept$score[shuffled == "B"])
})

round(c(gap         = kept_gap,
        t_test      = t.test(kept$score[kept$class == "A"],
                             kept$score[kept$class == "B"])$p.value,
        permutation = (1 + sum(abs(kept_nulls) >= kept_gap)) / 10001), 4)
#>         gap      t_test permutation
#>     10.2857      0.0222      0.0215
```

0.0222 and 0.0215. The two are back in step.

[KEY INSIGHT]
A t-test is a permutation test plus an assumption about the shape of the null distribution. On plenty of data with no wild values that assumption is nearly free and the two agree. On eight scores with one extreme value the assumption is doing real work, and the shuffle is the one that keeps working.

=== step === concept
## Listing every shuffle, or sampling ten thousand of them

The word usually attached to this method is **exact**, and it means something specific here. The null distribution is not an approximation of anything. It is the actual list of every way the labels could have been dealt out, with the statistic worked out for each one, and the p-value is a straight proportion of that list.

So why did we sample ten thousand instead of listing them all? Because of how many there are.

```r
# Count how many ways the class labels could be dealt out, for a few class sizes
per_class <- c(5, 10, 20, 30)

data.frame(
  students_per_class = per_class,
  possible_deals     = signif(choose(2 * per_class, per_class), 3)
)
#>   students_per_class possible_deals
#> 1                  5       2.52e+02
#> 2                 10       1.85e+05
#> 3                 20       1.38e+11
#> 4                 30       1.18e+17
```

`choose(n, k)` counts the ways of picking k things out of n, which is exactly the number of ways of choosing which students get the A labels. Five per class gives 252 deals and you could list them over lunch. Ten per class gives 185 thousand and a computer lists them instantly. Our thirty per class gives 1.18e+17, which is R's shorthand for 118 followed by fifteen zeros, and nothing is listing that.

So we drew ten thousand of those deals at random instead. That makes the p-value an estimate, and an estimate carries a margin. Since the p-value is a proportion, its margin is the usual standard error for a proportion.

```r
# Work out the margin on a p-value estimated from 10,000 random shuffles
round(sqrt(p_value * (1 - p_value) / B), 4)
#> [1] 0.0011
```

At 0.0132 and ten thousand shuffles the margin is about 0.001. Run the whole thing again with a different seed and you would land near 0.012 or 0.014, which changes nothing about what you do next. Ten thousand is the number most people use and it is enough for two decimal places. If you are reporting a p-value that sits near a threshold you care about, push it to a hundred thousand and the margin drops by roughly a factor of three.

=== step === quiz
## Quick check: reading a permutation p-value

Our sixty exam scores gave a six-point gap and a corrected p-value of 0.0132. Which sentence reads it correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 1.3% chance that the new teaching method made no difference. ::no
- If the method had made no difference, a gap of six points or more would still turn up in about 13 of every 1,000 shuffles. We got one. ::ok Exactly right. It assumes the boring story first and then reports how ordinary our data would look inside it. That is the only direction the number ever runs.
- The new method raises the class average by about 1.3 points. ::no
- With enough shuffles the p-value would eventually settle at zero, since the real split sits so far out. ::no Two of these put the probability on the truth of the method or on the size of the win, and a p-value does neither: the win is six points, and 0.0132 is how ordinary a win that size would be under luck alone. The last one is what the plus one in the formula exists to prevent. More shuffles shrink the margin around the estimate, they never take it to zero, and the floor stays at 1 divided by B plus 1.

=== step === tryit
## Your turn: turn the whole test into one function

You have now run the same four moves again and again: work out the statistic on the real groups, shuffle the labels, collect the statistic each time, then count and correct. That is a function waiting to be written.

Write `perm_test(x, y, stat, B)` where `x` and `y` are the two groups of scores, `stat` is the function to compare them with, and `B` is the number of shuffles. It should return the corrected two-sided p-value.

Here is a hint on the shuffle. Inside a function you no longer have a `class` column to sample, so pool `x` and `y` into one vector and draw a random `length(x)` of its positions to be the new first group each time.

```r
# exam holds 60 students in two classes of 30, with columns class and score.
# Fill in the body so the function returns the corrected two-sided p-value,
# then try it with stat = mean and with stat = median.
# Press Check when you have it.
perm_test <- function(x, y, stat = mean, B = 10000) {

}
```
::check {"regex": "perm_test\\s*<-\\s*function[\\s\\S]*1\\s*\\+\\s*sum", "gate": true, "difficulty": "intermediate", "ok": "Well done. One function now tests any statistic you can name, on any two groups, which is the real reach of the method.", "no": "Four lines inside the braces. `obs` is `stat(x) - stat(y)`. `pooled` is `c(x, y)`. `nulls` is a `replicate()` over B that picks `length(x)` positions and takes the difference of `stat` on the picked half and the unpicked half. The last line, the one the function returns, is `(1 + sum(abs(nulls) >= abs(obs))) / (B + 1)`."}
::solution
```r
# Wrap the whole test into one function that takes any statistic
perm_test <- function(x, y, stat = mean, B = 10000) {
  obs    <- stat(x) - stat(y)
  pooled <- c(x, y)
  n_x    <- length(x)

  nulls <- replicate(B, {
    picked <- sample(length(pooled), n_x)
    stat(pooled[picked]) - stat(pooled[-picked])
  })

  (1 + sum(abs(nulls) >= abs(obs))) / (B + 1)
}

set.seed(1)
round(c(
  mean_p   = perm_test(exam$score[exam$class == "A"], exam$score[exam$class == "B"]),
  median_p = perm_test(exam$score[exam$class == "A"], exam$score[exam$class == "B"],
                       stat = median)
), 4)
#>   mean_p median_p
#>   0.0129   0.0237
```

0.0129 and 0.0237, against the 0.0132 and 0.0252 we counted by hand. The small differences are the margin we just measured: these are ten thousand different random deals, so the estimate wobbles by a thousandth or two either way and lands in the same place.

Notice what `stat` did. Pass `mean`, pass `median`, pass `function(s) mean(s, trim = 0.1)`, pass the difference in 90th percentiles if that is what your question is about. The function never needs to know.

=== step === quiz
## Quick check: choosing the shuffle and the statistic

A physiotherapist measures walking speed for 24 patients, once before a six-week programme and once after. Most patients improve a little; two improve enormously.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Pool all 48 measurements, deal out 24 before labels and 24 after labels at random, and compare the means. ::no
- Drop the two large improvers as outliers, then run a t-test on the remaining 22 patients. ::no
- Flip the sign of each patient's own before-and-after change, use a statistic the two large gains cannot dominate such as the median or a trimmed mean, and count as usual. ::ok Both halves right. The design is paired, so only the signs are exchangeable, and swapping the statistic costs nothing because the shuffle never needed a formula for it.
- Any shuffle will do, since permutation tests make no assumptions at all. ::no A permutation test makes exactly one assumption, and it is a real one: that the labels are exchangeable under the null. Paired measurements are not freely exchangeable, so pooling all 48 mixes one patient with another and buries the effect. Discarding inconvenient patients is a separate problem again, since the two large improvers may be the most honest thing in the data. Change the statistic instead of the data.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935), chapter 2. The randomization argument in its original form: the test comes from how the experiment assigned its units, not from an assumed distribution.
- [Significance Tests Which May be Applied to Samples From any Populations](https://doi.org/10.2307/2983647) - Pitman (1937), Supplement to the Journal of the Royal Statistical Society 4(1), 119-130. The permutation test worked out as general theory.
- [Permutation Methods: A Basis for Exact Inference](https://doi.org/10.1214/088342304000000396) - Ernst (2004), Statistical Science 19(4), 676-685. A clear modern account of what exact means here, with worked two-sample and paired examples.
- [Permutation P-values Should Never Be Zero](https://doi.org/10.2202/1544-6115.1585) - Phipson and Smyth (2010), Statistical Applications in Genetics and Molecular Biology 9(1), Article 39. The source of the plus one correction.
- [Implementing a Class of Permutation Tests: The coin Package](https://doi.org/10.18637/jss.v028.i08) - Hothorn, Hornik, van de Wiel and Zeileis (2008), Journal of Statistical Software 28(8). The production implementation, for when you want exact enumeration and k-sample tests done for you.

=== step === complete
## Quick recap

You built a p-value out of sixty exam scores and nothing else. Here is the whole thing in one place.

- **The shuffle.** If the label changed nothing, the label can be dealt out again. Peel it off all sixty students, hand it back at random, and no score ever moves.
- **The pile.** Ten thousand shuffles give ten thousand gaps, and that pile is the null distribution, built out of your data rather than assumed.
- **The count.** 131 of the 10,000 shuffles reached the real six-point gap, which is a share of 0.0131.
- **The correction.** The real split is itself one valid deal, so it joins the count and the total: 0.0132, and a permutation p-value can never come out as zero.
- **The one assumption.** Exchangeability, and nothing else. No normality, no equal variance, no large sample. The design decides what may be swapped, which is why paired data gets its signs flipped rather than its scores pooled.
- **The freedom it buys.** The shuffle never used a property of the mean, so a median, a trimmed mean or anything else you can compute gets tested the same way, with no formula to look up.

The one thing this leaves open is the size of the win. 0.0132 says a six-point gap would be unusual under luck alone, and it says nothing at all about how much the new method is worth. For that you need a range around the six points rather than a verdict on it, and the bootstrap is what builds that range.

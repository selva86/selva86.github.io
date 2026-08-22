---
title: "Mann-Whitney U test: when and how to run it"
slug: "Which-Test-Mini-3"
catalog_blurb: "What to run when one extreme value drags the average around."
description: "One partner earns twenty times the rest and the t-test goes quiet. Compare two payrolls by rank instead, run the test in R, and report the gap in dollars."
keywords: "Mann-Whitney U test, wilcox.test in R, Wilcoxon rank sum test, nonparametric two sample test, ranks instead of means, outlier robust test, rank biserial correlation"
date: "2026-08-22"
post_type: "LESSON"
curriculum_id: "0.0.20"
lesson_access: "windowed"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "3"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-2"
course_next: ""
webr: true
mathjax: false
---

=== step === cover
::eyebrow Part 3 of 11
## Mann-Whitney U test: when and how to run it

Ravi runs operations at a consultancy that has just merged with a smaller rival, and he has two payrolls open on his desk. Twelve people came across from Harrow, twelve from Linden, and by Monday everybody has to sit on one pay scale.

So he does the obvious thing first. He averages each payroll and sees which number is bigger. Harrow comes to $70,292 a year and Linden to $146,625. On that number alone, Linden looks like the firm that pays more than twice as well.

Then he scrolls to the bottom of the Linden sheet and finds the founding partner on $1,150,000.

That is one person earning twenty times what a typical Linden employee earns, and every other name on that sheet is under $63,000. Here is what that one salary does to the picture when you draw both payrolls.

::widget chart-plotter {"x": "firm", "y": "salary", "geoms": ["boxplot"], "data": [{"x": "Harrow", "y": 61000}, {"x": "Harrow", "y": 63000}, {"x": "Harrow", "y": 64500}, {"x": "Harrow", "y": 66500}, {"x": "Harrow", "y": 69500}, {"x": "Harrow", "y": 70000}, {"x": "Harrow", "y": 70500}, {"x": "Harrow", "y": 72000}, {"x": "Harrow", "y": 74000}, {"x": "Harrow", "y": 76000}, {"x": "Harrow", "y": 77500}, {"x": "Harrow", "y": 79000}, {"x": "Linden", "y": 47000}, {"x": "Linden", "y": 49500}, {"x": "Linden", "y": 50500}, {"x": "Linden", "y": 53000}, {"x": "Linden", "y": 55000}, {"x": "Linden", "y": 56000}, {"x": "Linden", "y": 56500}, {"x": "Linden", "y": 58000}, {"x": "Linden", "y": 59500}, {"x": "Linden", "y": 62000}, {"x": "Linden", "y": 62500}, {"x": "Linden", "y": 1150000}]}

Both firms are squashed into a flat mark along the bottom, because the axis has to stretch all the way to $1,150,000 to fit one person on it. The average is doing the same thing to Ravi's answer, and it is why a t-test on these salaries comes back saying it cannot tell the two firms apart.

The Mann-Whitney U test gets around this by throwing the amounts away and keeping only the order. Line all 24 people up by pay, and the partner is simply the highest paid of the 24. That is all they can ever be, whether they earn $1,150,000 or a hundred times that.

By the end of this you will be able to:

- say why one extreme salary drags the average and quiets the t-test
- build the test's statistic by hand and match the number R prints
- run the test on two groups and say where its p-value comes from
- say what the test actually claims about the two firms, and when you may write "median"
- report the result with a dollar gap and a size, not a bare p-value

You need nothing beyond the ability to read a short R script. Everything else gets built from scratch, starting with the 24 salaries themselves.

=== step === concept
## The two payrolls, typed into R

Every number that follows comes out of the same 24 salaries, so let's put them into R before anything else. There are twelve for Harrow and twelve for Linden, both sorted from lowest to highest.

Press Run.

```r
# Type in both payrolls and stack them into one labelled data frame
harrow <- c(61000, 63000, 64500, 66500, 69500, 70000,
            70500, 72000, 74000, 76000, 77500, 79000)

linden <- c(47000, 49500, 50500, 53000, 55000, 56000,
            56500, 58000, 59500, 62000, 62500, 1150000)

pay <- data.frame(
  firm   = factor(rep(c("Linden", "Harrow"), each = 12),
                  levels = c("Linden", "Harrow")),
  salary = c(linden, harrow)
)

data.frame(harrow = harrow, linden = linden)
#>    harrow  linden
#> 1   61000   47000
#> 2   63000   49500
#> 3   64500   50500
#> 4   66500   53000
#> 5   69500   55000
#> 6   70000   56000
#> 7   70500   56500
#> 8   72000   58000
#> 9   74000   59500
#> 10  76000   62000
#> 11  77500   62500
#> 12  79000 1150000
```

Row 12 is the whole story. Harrow's top earner is on $79,000, a normal step up from the person below them. Linden's top earner is on $1,150,000, which is not.

The `pay` data frame stacks those same 24 salaries into a single column, with a label saying which firm each one came from. `factor()` turns the labels into a proper category, and `levels = c("Linden", "Harrow")` fixes the order R reads the two firms in, Linden first. That changes nothing about the salaries. It only decides which firm R subtracts from which when you hand it the whole data frame instead of the two vectors.

=== step === concept
## The average says Linden pays twice as much

Ravi's first instinct is everybody's first instinct: average each payroll and compare. Let's do that, and put two other summaries beside it so we can watch them disagree.

```r
# Summarise each payroll by average, middle salary and spread
firm_summary <- data.frame(
  firm   = c("Harrow", "Linden"),
  mean   = c(mean(harrow), mean(linden)),
  median = c(median(harrow), median(linden)),
  sd     = c(sd(harrow), sd(linden))
)

firm_summary
#>     firm      mean median         sd
#> 1 Harrow  70291.67  70250   5762.174
#> 2 Linden 146625.00  56250 316017.773
```

The `mean` column says Linden pays $146,625 against Harrow's $70,292, so Linden wins by more than double. The `median` column, which is just the salary sitting in the middle of each payroll, says Harrow pays $70,250 against Linden's $56,250, so Harrow wins by about $14,000. That is the same 24 people giving two opposite answers.

The `sd` column shows where the trouble comes in. Standard deviation measures how spread out a set of numbers is, and Linden's is $316,018 against Harrow's $5,762. That makes Linden look like a payroll scattered across a third of a million dollars, when eleven of its twelve salaries actually sit inside a $15,500 band.

Now let's hand the raw salaries to a t-test, which is the usual way of asking whether two groups differ on average.

```r
# Ask a t-test whether the two payrolls differ on average
t.test(linden, harrow)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  linden and harrow
#> t = 0.83661, df = 11.007, p-value = 0.4206
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -124471.9  277138.5
#> sample estimates:
#> mean of x mean of y 
#> 146625.00  70291.67 
```

The line to read is `p-value = 0.4206`. In plain words, the t-test cannot separate these two payrolls at all.

Look at the confidence interval underneath to see how badly. It runs from Linden paying $124,472 less to Linden paying $277,139 more, a range so wide that it holds every answer you could imagine, including no difference whatsoever.

How did one salary do that? The partner did it twice over. Their salary pushed Linden's average up, which makes the gap between the averages look enormous, and it pushed Linden's spread up, which is the number the t-test divides that gap by. Raise the top and the bottom of a fraction together and the fraction barely moves. That is why one huge value usually makes a t-test quieter rather than louder.

=== step === quiz
## Quick check: what one salary did to the t-test

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It made the difference between the firms significant, because $1,150,000 is a big number and big numbers push p-values down. ::no
- It broke the t-test, which is why the p-value came back as unusable as 0.4206. ::no
- It raised Linden's average and Linden's spread at the same time, and the t-test divides the gap between averages by that spread, so the test lost its ability to see anything. ::ok Exactly. One extreme value moves the top and the bottom of the same fraction, which is why an outlier tends to silence a t-test rather than excite it.
- It shifted Linden's average upward, and that is the whole of what it did to the test. ::no The partner's salary did two things at once, not one. It lifted Linden's average to $146,625, and it lifted Linden's standard deviation to $316,018. A t-test measures the gap between averages in units of that spread, so the two movements cancelled each other out and p came back at 0.4206. Nothing about the test broke, and nothing about it became more significant.

=== step === concept
## Line all 24 people up by pay and number them

Here is the move the entire test is built on, and it is simpler than its name suggests.

Stop working with the salaries. Put all 24 people into one queue sorted from lowest paid to highest paid, and give each person the number of the place they are standing in. The lowest paid person is 1, the next is 2, and the highest paid is 24. That number is called a person's **rank**.

R does this with `rank()`, which takes a set of numbers and returns each one's position in the sorted order.

```r
# Pool all 24 salaries into one queue and read off each person's place in it
pooled <- c(linden, harrow)

data.frame(firm = pay$firm, salary = pooled, place = rank(pooled))
#>      firm  salary place
#> 1  Linden   47000     1
#> 2  Linden   49500     2
#> 3  Linden   50500     3
#> 4  Linden   53000     4
#> 5  Linden   55000     5
#> 6  Linden   56000     6
#> 7  Linden   56500     7
#> 8  Linden   58000     8
#> 9  Linden   59500     9
#> 10 Linden   62000    11
#> 11 Linden   62500    12
#> 12 Linden 1150000    24
#> 13 Harrow   61000    10
#> 14 Harrow   63000    13
#> 15 Harrow   64500    14
#> 16 Harrow   66500    15
#> 17 Harrow   69500    16
#> 18 Harrow   70000    17
#> 19 Harrow   70500    18
#> 20 Harrow   72000    19
#> 21 Harrow   74000    20
#> 22 Harrow   76000    21
#> 23 Harrow   77500    22
#> 24 Harrow   79000    23
```

Look at the shape of that `place` column for a second. Linden holds places 1 to 9, then Harrow's lowest paid person takes place 10, then Linden takes 11 and 12, and Harrow holds everything from 13 upward. Nine of the bottom ten places belong to Linden.

And the partner's $1,150,000 has turned into the number 24. Twenty-four is the highest number on offer, because there are 24 people in the queue.

That is the point of the whole exercise. Watch what happens if the partner earned a hundred million instead.

```r
# Pay the partner 100 million and read their place in the queue again
linden_big     <- linden
linden_big[12] <- 100000000

rank(c(linden_big, harrow))[12]
#> [1] 24

c(mean_before = mean(linden), mean_after = mean(linden_big))
#> mean_before  mean_after 
#>      146625     8384125 
```

One number changed and the two summaries went in completely different directions. Linden's average leapt from $146,625 to $8,384,125, a figure that describes nobody on the payroll. The partner's rank sat exactly where it was, at 24, because there is still nobody above them and there are still 24 people in the queue.

[KEY INSIGHT]
Ranks put a ceiling on how much any one person can matter. However far out an extreme value sits, it can only ever be the highest number in the queue, which is worth one place. That is the property Ravi needs, and the whole test is built on it.

=== step === concept
## Who out-earns whom, across all 144 matchups

Ranks turned 24 salaries into 24 places in a queue. Now we need a single number saying which firm sits higher up that queue, and the way to build it is to run every possible head-to-head comparison.

Take one person from Linden and one from Harrow, and ask one question: does the Linden person earn more? Twelve Linden people against twelve Harrow people gives 144 such pairs, and every pair has a winner.

That question only ever uses the order. Whether one salary beats another depends on which of the two stands further along the queue, never on how far apart they are, so counting matchups is still working with places rather than amounts, even though the numbers on screen are still dollars.

`outer()` runs all 144 comparisons in a single line. Hand it two vectors and a comparison, and it returns a grid with one row per Linden person and one column per Harrow person, holding TRUE wherever the Linden person earns more.

```r
# Compare every Linden person against every Harrow person, then count Linden's wins
wins <- outer(linden, harrow, ">")

dim(wins)
#> [1] 12 12

sum(wins)
#> [1] 14
```

The grid is 12 by 12, so 144 matchups, and `sum()` counts each TRUE as 1. A Linden person won 14 of them.

Fourteen out of 144, and that count is the U statistic. It is the whole test. Now look at who those 14 wins belong to.

```r
# Count each Linden person's wins, in the order they sit on the payroll
rowSums(wins)
#>  [1]  0  0  0  0  0  0  0  0  0  1  1 12
```

Read it from the left. The nine lowest paid Linden people lose all twelve of their matchups. The next two win one apiece, against Harrow's lowest paid person. The partner, sitting in the twelfth position, wins all twelve.

So twelve of Linden's fourteen wins are one person's. Set the partner aside and the other eleven Linden people won 2 of their 132 matchups between them. That is what "Harrow pays better" looks like when you count it person by person, and it is what the average was hiding.

=== step === quiz
## Quick check: what the number 14 counts

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The 14 people whose salaries overlap between the two firms. ::no
- The number of Linden-against-Harrow pairings, out of all 144, in which the Linden person earns more. ::ok Yes. It is a count of winning matchups, which is why it can run anywhere from 0 to 144, and why 14 sits so far down that range.
- A dollar amount of some kind, since salaries are what we started with. ::no
- The partner's place in the queue of 24 salaries. ::no The grid held 144 matchups, one for every Linden person paired against every Harrow person, and 14 of them went Linden's way. It counts pairings, not people, not dollars, and not anybody's place in the queue. The partner's place in the queue is 24, and their contribution to this count is the 12 matchups they won.

=== step === concept
## What R prints, and why it says Wilcoxon

You do not have to build that count by hand every time. `wilcox.test()` does it for you, and returns a p-value with it.

```r
# Run the Mann-Whitney U test on the two payrolls
wilcox.test(linden, harrow)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  linden and harrow
#> W = 14, p-value = 0.0003713
#> alternative hypothesis: true location shift is not equal to 0
```

The line to look at is `W = 14`. That is the same 14 you counted out of the 144 matchups, and R found it without you building a grid.

The name on that output trips people up, so it is worth a sentence. Frank Wilcoxon published this test in 1945 by adding up one group's ranks. Henry Mann and Donald Whitney published it in 1947 by counting winning pairs, the way we just did. The two numbers are different views of the same thing, so R prints Wilcoxon's name and Mann and Whitney's counting statistic together.

Here is the arithmetic that ties them.

```r
# Get the same statistic from the rank sums instead of the matchups
rank_sums <- tapply(rank(pay$salary), pay$firm, sum)

rank_sums
#> Linden Harrow 
#>     92    208 

rank_sums[["Linden"]] - 12 * 13 / 2
#> [1] 14
```

Linden's twelve ranks add up to 92 and Harrow's to 208, and the two together make 300, which is what you get by adding up 1 through 24.

The number being subtracted, `12 * 13 / 2`, is 78, and that is the smallest rank sum twelve people could possibly have. It is places 1 through 12, which is what Linden would hold if every Linden salary sat below every Harrow salary. So subtracting 78 asks how far above rock bottom Linden landed, and the answer is 14, the same 14 the matchups gave.

Most of the time your data will be in a data frame rather than two vectors, and there is a formula form for that.

```r
# Run the same test straight from the data frame
wilcox.test(salary ~ firm, data = pay)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  salary by firm
#> W = 14, p-value = 0.0003713
#> alternative hypothesis: true location shift is not equal to 0
```

Read `salary ~ firm` as "salary, split by firm". It prints `W = 14` because Linden is the first level of the `firm` factor, so R counts Linden's wins. Had Harrow been first, R would have counted Harrow's 130 wins and printed `W = 130` instead. The p-value is identical either way, and only the direction of the count changes.

=== step === concept
## Where p = 0.0003713 comes from

The p-value here is not read off a curve or looked up in a table. It is counted, exactly, out of every arrangement the 24 salaries could have taken.

Suppose pay had nothing at all to do with which firm you worked at. Then which twelve of the 24 places in the queue ended up belonging to Linden was pure luck, and every possible split of the places is equally likely. `dwilcox()` gives the chance of each W under exactly that assumption, so we can draw all of them at once.

```r
# Draw every W that a pure-luck split of the queue could produce, and mark ours
plot(0:144, dwilcox(0:144, 12, 12), type = "h", col = "grey75",
     main = "Every W a pure-luck split of the 24 salaries could give",
     xlab = "W (Linden wins, out of 144 matchups)",
     ylab = "Chance of that W")
abline(v = 14, col = "red", lwd = 3)
```

The grey pile is what luck alone does. It bunches around 72, which is half of 144, because a split with no pattern in it hands each firm about half the matchups. The red line is Ravi's result at 14, far out in the left tail where the bars have almost no height left.

Now let's count that tail instead of eyeballing it.

```r
# Count the equally-likely splits, and how many are this lopsided or worse
choose(24, 12)
#> [1] 2704156

pwilcox(14, 12, 12) * choose(24, 12)
#> [1] 502

2 * pwilcox(14, 12, 12)
#> [1] 0.0003712804
```

There are 2,704,156 ways to choose which twelve of the 24 places go to Linden, and `choose(24, 12)` is that count. Of all those millions of arrangements, only 502 give Linden 14 matchup wins or fewer.

So 502 out of 2,704,156, or 0.0001856, is how often luck alone would bury Linden this deep. Doubling it covers the mirror-image case where Harrow is the firm at the bottom, and 0.0003713 is the p-value R printed.

[NOTE]
"Exact" in the output line `Wilcoxon rank sum exact test` means literally this: R enumerated the possibilities rather than approximating them. That is only practical for small groups with no repeated values, which is exactly what Ravi has.

=== step === tryit
## Your turn: pay the partner 100 million

`linden_big` holds the Linden payroll with the founding partner on $100,000,000 instead of $1,150,000. Everything else about it is unchanged.

Run a t-test on `linden_big` against `harrow` and print only its p-value, then run `wilcox.test()` on the same two vectors. Before you press Run, write down what you expect each one to do.

```r
# linden_big is the Linden payroll with the founding partner on 100 million.
# Run t.test on linden_big against harrow and print only its p-value,
# then run wilcox.test on the same two vectors.
# Two lines. Press Check when you have them.
```
::check {"regex": "wilcox[.]test\\s*[(]\\s*linden_big", "gate": true, "difficulty": "beginner", "ok": "That is it. The t-test drifted to 0.3396, further from significance than it already was, while the rank test did not move by a hair: W is still 14 and p is still 0.0003713.", "no": "Two lines. The first is t.test(linden_big, harrow)$p.value and the second is wilcox.test(linden_big, harrow)."}
::solution
```r
# Rerun both tests with the founding partner on 100 million
t.test(linden_big, harrow)$p.value
#> [1] 0.3396283

wilcox.test(linden_big, harrow)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  linden_big and harrow
#> W = 14, p-value = 0.0003713
#> alternative hypothesis: true location shift is not equal to 0
```

Multiplying one salary by almost 87 moved the t-test's p-value from 0.4206 to 0.3396, and left the rank test where it was, down to the last digit. Nothing in the queue changed, because the partner was already at the top of it.

=== step === concept
## What the test claims about the two firms

This is the part people get wrong in write-ups more than any other, so let's be precise about what a small p-value here entitles Ravi to say.

The assumption the test starts from is this: pick one Linden person at random and one Harrow person at random, and the Linden person is exactly as likely to out-earn the Harrow person as the other way round. A p-value of 0.0003713 says that assumption fits the data badly. What Ravi has earned the right to say is that Linden salaries tend to sit below Harrow salaries.

Notice that this says nothing about medians, and nothing about averages. It is a statement about which firm keeps turning up higher when you pick two people and compare them.

That distinction matters here more than usual. Look at the shape of the two payrolls, plotted on a log scale so that eleven ordinary Linden salaries and one partner can share an axis.

```r
# Plot all 24 salaries on a log scale so the partner and everyone else fit on one axis
library(ggplot2)

ggplot(pay, aes(x = firm, y = salary)) +
  geom_point(size = 3, alpha = 0.7, colour = "steelblue") +
  scale_y_log10(labels = function(x) paste0("$", format(x, big.mark = ",", scientific = FALSE))) +
  labs(title = "Every salary on both payrolls",
       x = NULL, y = "Salary (log scale)") +
  theme_minimal(base_size = 13)
```

Harrow is a tight column of twelve dots. Linden is a tight column of eleven dots with one dot floating high above the rest, and even a log scale cannot pull it back into the group.

Those are not the same shape. A rank test may be read as a statement about medians only when the two groups have the same shape and one is simply shifted sideways from the other, because in that case "tends to sit higher" and "has a higher median" become the same claim. A payroll with one salary twenty times the others is not a sideways shift of a payroll without one.

[WARNING]
"The medians differ" is not what a small p-value from this test establishes. It establishes that one group tends to sit higher than the other. Ravi's two medians do differ, and he can say so, but that is something he reads off the salaries themselves, not something this p-value proved for him.

=== step === quiz
## Quick check: may you write that the medians differ?

Ravi has p = 0.0003713 and the dot plot of both payrolls in front of him. Which sentence is he entitled to write?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The test compares medians, so a p-value this small means the two medians are significantly different. ::no
- Linden salaries tend to sit below Harrow salaries. The two medians do differ as well, but he reads that off the payrolls rather than off this p-value. ::ok Right, and that is the careful wording worth memorising. The p-value bought him "tends to sit lower"; the medians are a separate description of data he happens to also have.
- Linden's average pay is significantly lower than Harrow's, since the test found a significant difference. ::no
- Nothing at all, because the two payrolls are shaped so differently that the test result cannot be used. ::no Two of these read the p-value as a verdict on a summary number, either the median or the average, and it is neither: it is a verdict on how often one firm's people out-earn the other's. The last one throws a perfectly good result away. Different shapes limit how you word the conclusion; they do not invalidate the test.

=== step === concept
## Why a failed normality test is the wrong reason to switch

Plenty of write-ups reach this test by a route that looks sensible and is not. It goes like this: run a normality test, watch it fail, switch to ranks. A normality test checks whether a set of numbers looks like it came from the usual bell-shaped curve, and `shapiro.test()` is the one R ships. Let's run it on Ravi's data and see what it would have told him.

```r
# Test each payroll for normality
shapiro.test(harrow)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  harrow
#> W = 0.96886, p-value = 0.8985

shapiro.test(linden)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  linden
#> W = 0.34113, p-value = 1.479e-06
```

Harrow passes comfortably at 0.8985 and Linden fails at 0.000001479, so this route would have landed Ravi on the right test. It is still the wrong reason, in three separate ways.

1. **A t-test never asked the salaries to be normal.** What it asks is that the average of twelve salaries behaves like a draw from a normal curve, and with enough people that happens even when the raw numbers are lopsided. Twelve is not enough people when one of them earns twenty times the rest. So the problem is that one salary, not the verdict of a normality test.
2. **Choosing a test after looking at the data changes what the test is worth.** The 5% error rate you think you are buying assumes the test was decided before the data arrived. Pick between two tests based on a preliminary check, and the real error rate is no longer the one printed on the tin.
3. **The two tests answer different questions.** A t-test asks whether the average salaries differ. This one asks which firm's people tend to out-earn the other's. Switching between them because of a normality check quietly switches the claim you end up making.

So what counts as a good reason? There are two, and both are settled before anybody looks at the data.

- A few extreme values must not be allowed to decide the answer. Ravi knows a merged payroll almost always has a founding partner on it, and he does not want that one person choosing the pay scale for the other 23.
- The outcome is ordinal, meaning it has an order but no meaningful arithmetic. Survey answers running from "strongly disagree" to "strongly agree" are the standard case: you can rank them, but the distance from 3 to 4 is not a real quantity you can average.

=== step === concept
## What ranks cost when the salaries are well behaved

Working with ranks throws information away, so there has to be a price. Let's find out what it is by running Ravi's merger 2,000 times in a world where neither firm has a founding partner.

Both payrolls in this world are ordinary and equally spread, twelve people each, with a real $6,000 gap between the firms. Every round draws fresh salaries and runs both tests on them, and we count how often each one spots the gap.

```r
# Run 2,000 clean mergers and see how often each test finds the real 6,000 dollar gap
set.seed(42)

sim <- replicate(2000, {
  a <- rnorm(12, mean = 70000, sd = 6000)
  b <- rnorm(12, mean = 76000, sd = 6000)
  c(t_test    = t.test(a, b)$p.value,
    rank_test = wilcox.test(a, b)$p.value)
})

rowMeans(sim < 0.05)
#>    t_test rank_test 
#>    0.6525    0.6195 
```

`rnorm(12, mean = 70000, sd = 6000)` draws twelve salaries from a well behaved bell curve, so this is the t-test's home ground, the exact situation it was designed for. `rowMeans(sim < 0.05)` then reports the share of the 2,000 rounds in which each test came back under 0.05.

The t-test found the gap 65.3% of the time. The rank test found it 62.0% of the time. On the t-test's own turf, working with ranks instead of dollars costs about three detections in every hundred.

That is the whole price, and it is small. In exchange, one founding partner cannot walk in and take the answer away from you.

=== step === quiz
## Quick check: normality test failed, now what?

A colleague runs a normality test on their two groups, one group fails it, and they ask you what to do.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Always run a normality test first and switch to a rank test whenever it fails. That is what the check is for. ::no
- Always use the rank test, since it assumes nothing about normality and so can never be wrong. ::no
- Nothing, if they already had a reason for the test they picked. The reasons that hold up are that a few extreme values must not decide the answer, or that the outcome is ordinal, and both are settled before anybody sees the data. ::ok Yes. The choice rests on what the data is and what question is being asked, not on the p-value of a preliminary check.
- Transform the numbers until they pass the normality check, then run the t-test on the transformed values. ::no Letting a preliminary check choose your test, or letting it choose your transformation, means the test was picked after looking at the data, and the error rate you think you are buying no longer holds. Defaulting to ranks every time is not free either: on well behaved data it detects a real gap slightly less often than a t-test does.

=== step === concept
## When this is the wrong test to run

This test compares two independent groups. Change either of those two words and you need something else.

The first case is data that is not independent, meaning the same people measured twice. Suppose Ravi takes eight Harrow employees and compares this year's salary against last year's. Each person appears in both columns, so the columns are linked, and the right test is the signed-rank test, which `paired = TRUE` selects.

```r
# Compare the same eight people a year apart with the paired version of the test
last_year <- harrow[1:8]
this_year <- last_year + c(2000, 1500, 3000, 1000, 2500, 1200, 4000, 1800)

wilcox.test(this_year, last_year, paired = TRUE)
#> 
#> 	Wilcoxon signed rank exact test
#> 
#> data:  this_year and last_year
#> V = 36, p-value = 0.007813
#> alternative hypothesis: true location shift is not equal to 0
```

The statistic is called `V` rather than `W` because it is built differently. It ranks the eight raises by size and adds up the ranks of the ones that went upward, which comes to 36 here because all eight raises were positive.

The second case is more than two groups. Three merged firms need the Kruskal-Wallis test, which is this same rank idea stretched across any number of groups, and R runs it with `kruskal.test()`.

The third case is when the question really is about average dollars. If Ravi's board asks what the total salary bill will be, ranks cannot answer that, because a total depends on the actual amounts and the partner's $1,150,000 is genuinely part of it. It is tempting to reach for a log transform to rescue the t-test in that situation, so let's see how that goes.

```r
# Try to rescue the t-test by comparing log salaries instead
t.test(log(linden), log(harrow))
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  log(linden) and log(harrow)
#> t = 0.056455, df = 11.193, p-value = 0.956
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.5466083  0.5754496
#> sample estimates:
#> mean of x mean of y 
#>  11.17172  11.15730 
```

That comes back at p = 0.956, which is even less informative than the 0.4206 we started with. Logs pull in a long tail nicely, but the partner is not a long tail. They are one point sitting on its own, and after taking logs they are still the largest value by a wide margin, still holding Linden's average up.

=== step === concept
## The gap in dollars, and how often Linden wins

A p-value tells Ravi the difference is not a fluke. It does not tell him how much money is on the table, and that is the number the board will ask for. Add `conf.int = TRUE` and the test hands it over.

```r
# Ask the same test for the size of the gap, not just the p-value
mw <- wilcox.test(linden, harrow, conf.int = TRUE)

mw
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  linden and harrow
#> W = 14, p-value = 0.0003713
#> alternative hypothesis: true location shift is not equal to 0
#> 95.5 percent confidence interval:
#>  -19500  -8000
#> sample estimates:
#> difference in location 
#>                 -14000 
```

Linden pays about $14,000 less, and the plausible range runs from $8,000 less to $19,500 less. The interval says 95.5% rather than 95% because the test is built on whole matchups, which come in discrete steps, so R reports the level it can actually deliver rather than rounding the claim.

That $14,000 is not the difference between the two medians, even though it lands on exactly that figure here. It is the middle of all 144 pairwise gaps, which we can check by hand.

```r
# Confirm the estimate by hand: the middle of all 144 pairwise dollar gaps
gaps <- outer(linden, harrow, "-")

length(gaps)
#> [1] 144

median(gaps)
#> [1] -14000
```

Take every Linden person, subtract every Harrow person's salary, sort the 144 answers and take the middle one. That is where the $14,000 comes from, and it is called the Hodges-Lehmann estimate after the two statisticians who worked it out in 1963.

Because it is a middle value of gaps, one enormous salary cannot drag it anywhere.

```r
# Check that the estimate survives the partner earning 100 million
wilcox.test(linden_big, harrow, conf.int = TRUE)$estimate
#> difference in location 
#>                 -14000 
```

Alongside the dollar gap, report how one-sided the comparison was. The plainest version is the win share we already counted.

```r
# Express the same result as a win share and as a rank-biserial correlation
win_share <- sum(wins) / length(wins)

win_share
#> [1] 0.09722222

1 - 2 * win_share
#> [1] 0.8055556
```

A Linden person out-earns a Harrow person in 9.7% of the 144 matchups, which is about as plain a statement of size as you can make. The second number, 0.806, is the same thing on a standard scale called the rank-biserial correlation. It runs from -1 to 1, sits at 0 when the two firms split the matchups evenly, and reaches 1 when one firm wins every single one. At 0.806 Harrow is close to a clean sweep.

=== step === concept
## Ties, and the half numbers they put in W

Real salary data is full of round figures, so two people landing on exactly the same number is common rather than rare. Let's create that situation deliberately by rounding every salary to the nearest $2,500, the way a published pay band would.

```r
# Round both payrolls to the nearest 2,500 and look at the queue again
harrow_r <- round(harrow / 2500) * 2500
linden_r <- round(linden / 2500) * 2500

rank(c(linden_r, harrow_r))
#>  [1]  1.0  2.5  2.5  4.0  5.5  5.5  7.5  7.5  9.5 12.0 12.0 24.0  9.5 12.0 14.0
#> [16] 15.0 17.0 17.0 17.0 19.0 20.5 20.5 22.0 23.0
```

Half numbers have appeared. Two people rounded to $50,000 would have taken places 2 and 3, and since there is no way to say which of them comes first, `rank()` gives them both the average of those two places, 2.5. Three people on $70,000 share places 16, 17 and 18, so all three get 17.

Those halves flow straight into W.

```r
# Rebuild W from the rounded payrolls: outright wins, plus half a win for each tie
sum(outer(linden_r, harrow_r, ">"))
#> [1] 14

sum(outer(linden_r, harrow_r, "=="))
#> [1] 3

wilcox.test(linden_r, harrow_r, exact = FALSE)
#> 
#> 	Wilcoxon rank sum test with continuity correction
#> 
#> data:  linden_r and harrow_r
#> W = 15.5, p-value = 0.001186
#> alternative hypothesis: true location shift is not equal to 0
```

Linden still wins 14 matchups outright, and three more matchups are now dead heats. A tie counts as half a win to each side, so W is 14 plus half of 3, which is 15.5.

The other change is `exact = FALSE`, and it matters. The exact route counts arrangements, and once values are tied there is no clean way to enumerate them, so R falls back on a normal curve instead. The phrase "with continuity correction" in that header is R saying it nudged W by half a unit on the way across, because W moves in whole and half steps and a smooth curve does not. Setting `exact = FALSE` yourself makes that choice explicit rather than leaving R to decide for you. Here is the curve it reads the p-value off, with our result marked at 3.24 standard deviations out from the middle.

::widget null-distribution {"tails": 2, "start": 3.24, "label": "observed z"}

Drag the marker and watch the shaded area, because that area is the p-value. At 3.24 the two shaded slivers come to roughly 0.001, which is the 0.001186 R printed. Pull the marker back toward the middle and the shading swells, because a result near the centre is one luck produces all the time.

[TIP]
With tied values, use `exact = FALSE`. Ties make the exact enumeration impossible, and stating the approximation yourself is clearer than discovering afterwards which route R took.

=== step === concept
## Writing it up in one sentence

Ravi now has everything he needs, and the last job is to put it in a sentence somebody can act on. A good one carries the group sizes, the statistic, the p-value, both medians, the dollar gap with its interval, and the win share.

Build it out of the test object rather than retyping the numbers, so the sentence can never drift away from the result it describes.

```r
# Build the whole write-up straight out of the test object
mw <- wilcox.test(linden, harrow, conf.int = TRUE)

cat(paste0(
  "Linden (n = ", length(linden),
  ", median $", format(median(linden), big.mark = ","), ") against ",
  "Harrow (n = ", length(harrow),
  ", median $", format(median(harrow), big.mark = ","), "): ",
  "Mann-Whitney W = ", mw$statistic,
  ", p = ", signif(mw$p.value, 3), ". ",
  "Linden pays $", format(abs(round(mw$estimate)), big.mark = ","), " less ",
  "(95% CI $", format(abs(round(mw$conf.int[2])), big.mark = ","),
  " to $", format(abs(round(mw$conf.int[1])), big.mark = ","), "), ",
  "and out-earns Harrow in ", sum(wins), " of ", length(wins),
  " matchups (", round(100 * mean(wins), 1), "%).\n"))
#> Linden (n = 12, median $56,250) against Harrow (n = 12, median $70,250): Mann-Whitney W = 14, p = 0.000371. Linden pays $14,000 less (95% CI $8,000 to $19,500), and out-earns Harrow in 14 of 144 matchups (9.7%).
```

Every number in that sentence came out of `mw` or out of the salaries themselves. The one thing typed by hand is the `95%` label on the interval, and that is deliberate: Ravi asked for 95%, R handed back the 95.5% it could actually deliver, and claiming the level you asked for when the interval covers a little more errs in the safe direction. Nothing else is retyped, so re-running this on next quarter's payroll gives a correct sentence rather than a stale one.

Read what it does and does not claim. It says Linden pay sits lower and roughly by how much, it gives an honest range around that figure, and it says how one-sided the comparison was. It does not say the medians are significantly different, and it does not lead with the p-value.

=== step === tryit
## Your turn: report the rounded payroll properly

`linden_r` and `harrow_r` hold both payrolls rounded to the nearest $2,500, so they are the version with ties in them.

Run the test on those two, with `exact = FALSE` because of the ties and `conf.int = TRUE` for the gap, and store the result in `mw_round`. Then print one line carrying W, the p-value and the dollar gap, built out of `mw_round` rather than typed in.

```r
# linden_r and harrow_r are both payrolls rounded to the nearest 2,500.
# Store the test in mw_round, with exact = FALSE and conf.int = TRUE,
# then cat one line carrying W, the p-value and the dollar gap.
# Press Check when you have it.
```
::check {"regex": "mw_round\\s*<-\\s*wilcox[.]test", "gate": true, "difficulty": "intermediate", "ok": "Good. Rounding moved W to 15.5 and the gap to 15,000 dollars, and the conclusion is the one you already had: Linden pay sits below Harrow pay.", "no": "Start by storing the test: call wilcox.test on linden_r and harrow_r with exact = FALSE and conf.int = TRUE, and name the result mw_round. Then pull W out of mw_round$statistic, the p-value out of mw_round$p.value, and the gap out of mw_round$estimate."}
::solution
```r
# Run the test on the rounded payrolls and build the same one-line write-up
mw_round <- wilcox.test(linden_r, harrow_r, exact = FALSE, conf.int = TRUE)

cat(paste0(
  "Linden (n = 12, median $", format(median(linden_r), big.mark = ","), ") against ",
  "Harrow (n = 12, median $", format(median(harrow_r), big.mark = ","), "): ",
  "W = ", mw_round$statistic,
  ", p = ", signif(mw_round$p.value, 3), ", ",
  "Linden pays $", format(abs(round(mw_round$estimate)), big.mark = ","), " less ",
  "(95% CI $", format(abs(round(mw_round$conf.int[2])), big.mark = ","),
  " to $", format(abs(round(mw_round$conf.int[1])), big.mark = ","), ").\n"))
#> Linden (n = 12, median $56,250) against Harrow (n = 12, median $70,000): W = 15.5, p = 0.00119, Linden pays $15,000 less (95% CI $7,500 to $20,000).
```

Rounding to pay bands nudged Harrow's median from $70,250 to $70,000 and widened the interval a little, because throwing away detail always costs precision. It changed nothing about the answer.

=== step === quiz
## Quick check: which of these write-ups is honest?

Ravi has to send one sentence to the board. Which one is defensible?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Linden's mean salary is $146,625 against Harrow's $70,292, so Linden pays significantly better (p = 0.0003713). ::no
- The salaries failed a normality test, so we used a Mann-Whitney U test, which showed that the two medians are significantly different (p = 0.0003713). ::no
- Across 12 salaries per firm, Linden pay tends to sit below Harrow pay (W = 14, p = 0.0003713), by an estimated $14,000 with a 95% interval of $8,000 to $19,500. A Linden person out-earns a Harrow person in only 14 of the 144 possible pairings. We chose a rank-based test in advance so that one partner's salary could not decide the answer. ::ok That is the one. It states the claim the test supports, gives the size with a range around it, says how one-sided the comparison was, and gives a reason for the test that was settled before the data arrived.
- The Mann-Whitney U test gives p = 0.0003713, so the difference between the two firms is highly significant. ::no The first pairs the rank test's p-value with a claim about averages, and gets the direction backwards on top of that. The second reaches the test through a normality check and then reads it as a verdict on medians. The last one reports significance with no direction and no size, which leaves the board nothing to act on.

=== step === tryit
## Your turn: rebuild W without wilcox.test

Let's do it one last time, from the ranks alone.

Pool all 24 salaries with `c(linden, harrow)`, rank them, add up the twelve ranks belonging to Linden, which are the first twelve, and subtract `12 * 13 / 2`. Then check your answer against `sum(wins)`, the matchup count from the grid.

```r
# Rebuild W from the ranks alone, without calling wilcox.test.
# Rank the 24 pooled salaries, add up Linden's twelve ranks,
# subtract 12 * 13 / 2, then compare the result with sum(wins).
# Press Check when you have it.
```
::check {"regex": "rank\\s*[(][\\s\\S]*?(78|12\\s*[*]\\s*13\\s*/\\s*2)", "gate": true, "difficulty": "intermediate", "ok": "Yes: Linden's ranks add to 92, subtracting 78 leaves 14, and that is exactly the number of matchups the grid counted. Two routes, one statistic.", "no": "Three lines. Rank the pooled salaries with rank(c(linden, harrow)) and name that pooled_r, add up sum(pooled_r[1:12]) and name that linden_sum, then subtract 12 * 13 / 2 from it."}
::solution
```r
# Recover W from the rank sums, then confirm it against the counted matchups
pooled_r   <- rank(c(linden, harrow))
linden_sum <- sum(pooled_r[1:12])

linden_sum
#> [1] 92

W_by_hand <- linden_sum - 12 * 13 / 2
W_by_hand
#> [1] 14

W_by_hand == sum(wins)
#> [1] TRUE
```

Counting winning pairs and adding up ranks are two ways of measuring the same thing, which is how far up the queue one group sits. That is why one test carries two names.

=== step === concept
## References

- [On a Test of Whether one of Two Random Variables is Stochastically Larger than the Other](https://doi.org/10.1214/aoms/1177730491) - Mann and Whitney (1947), Annals of Mathematical Statistics 18(1), 50-60. The paper that introduced the matchup-counting statistic.
- [The Wilcoxon-Mann-Whitney Procedure Fails as a Test of Medians](https://doi.org/10.1080/00031305.2017.1305291) - Divine, Norton, Baron and Juarez-Colunga (2018), The American Statistician 72(3), 278-286. Works through exactly why "the medians differ" is the wrong write-up.
- [Estimates of Location Based on Rank Tests](https://doi.org/10.1214/aoms/1177704172) - Hodges and Lehmann (1963), Annals of Mathematical Statistics 34(2), 598-611. Where the median-of-pairwise-gaps estimate comes from.
- [The Simple Difference Formula: An Approach to Teaching Nonparametric Correlation](https://doi.org/10.2466/11.IT.3.1) - Kerby (2014), Comprehensive Psychology 3, 11.IT.3.1. Rank-biserial correlation read as a win share.
- [Wilcoxon Rank Sum and Signed Rank Tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) - R Core Team. The official page for the exact, correct, conf.int and paired arguments.

=== step === complete
## Part 3 complete

Ravi came in with two payrolls and one question, and the averages gave him the wrong answer.

- The average said Linden pays $146,625 against Harrow's $70,292, and a t-test on those salaries returned p = 0.4206, which is no answer at all. One partner on $1,150,000 lifted Linden's average and Linden's spread together, and the two movements cancelled.
- Lining all 24 people up by pay and numbering them capped that partner at 24, the highest place in a queue of 24, however much they earn.
- Counting all 144 head-to-head matchups gave Linden 14 wins, twelve of them the partner's own. That count is W, and R printed the same 14 with p = 0.0003713.
- Adding `conf.int = TRUE` turned it into money: Linden pays about $14,000 less, somewhere between $8,000 and $19,500, and a Linden person out-earns a Harrow person in 9.7% of matchups.
- Paying the partner a hundred million moved none of it.

So the sentence Ravi sends the board is this one. Across 12 salaries per firm, Linden pay tends to sit below Harrow pay by an estimated $14,000, with a 95% interval of $8,000 to $19,500, and a rank-based test was chosen in advance so that one salary could not decide the answer.

Reach for this test when you know beforehand that a handful of extreme values must not own the result, or when your outcome has an order but no arithmetic. Do not reach for it because a normality check went red. Have a great day.

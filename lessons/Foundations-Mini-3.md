---
title: "Law of Large Numbers vs CLT: the real difference"
slug: "Foundations-Mini-3"
description: "Flip a coin 10,000 times and the share of heads settles on 50 percent. One theorem promises that. The other says how far off just 100 flips should land."
keywords: "law of large numbers, central limit theorem, LLN vs CLT, standard error of a proportion, sampling distribution, coin flip simulation in R, convergence"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "3"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: "Foundations-Mini-2"
course_next: ""
curriculum_id: "0.0.23"
lesson_access: "windowed"
catalog_blurb: "Where the share of heads lands, and how far off it should be."
---

=== step === cover
::eyebrow Probability Foundations
## Law of Large Numbers vs CLT: the real difference

Today let's sort out the two most famous theorems in statistics, because they get mixed up constantly, and not only by beginners. Textbooks do it too.

A coin is the fastest way to see that they answer two completely different questions.

Flip a coin ten times and seven heads is nothing much. It happens all the time. Flip that same coin ten thousand times and the share of heads comes back very close to fifty percent, close enough that you have to look hard to find the gap. That settling down is the Law of Large Numbers.

Now here is the question it cannot answer. At a hundred flips, how far off should you expect to be?

Somebody hands you a coin, you flip it a hundred times, and 58 of them come back heads. Is that ordinary, or is the coin bent?

The Central Limit Theorem is the one that answers that. It gives you the spread of the misses at whatever number of flips you happen to have done.

So let's not memorise either of them. Let's watch both happen, side by side, on one ordinary coin.

::widget process-flow {"steps":[{"title":"Settle one coin","sub":"flip it 10,000 times and watch the share of heads walk in"},{"title":"Repeat a short run","sub":"do 100 flips 10,000 times over and stack up the shares"},{"title":"Read one result","sub":"measure 58 heads out of 100 against that spread"}]}

That is the whole plan. Everything after this is just doing it, with real flips.

=== step === concept
## The coin, the flips, and the share of heads

Let's get the coin onto the page first, because every number that follows comes off this one run.

We take one fair coin and flip it ten thousand times. Heads is recorded as a 1 and tails as a 0, which makes the share of heads nothing more than the mean of a column of 1s and 0s. The function `rbinom(10000, size = 1, prob = 0.5)` does the flipping: ten thousand draws, one flip each, heads half the time.

Press Run.

```r
# Flip one fair coin 10,000 times, then look at the first ten flips
set.seed(6)
flips <- rbinom(10000, size = 1, prob = 0.5)   # 1 is heads, 0 is tails

first_ten <- flips[1:10]
first_ten
#>  [1] 1 1 0 0 1 1 1 1 1 0

sum(first_ten)          # heads in the first ten flips
#> [1] 7

100 * mean(first_ten)   # the same thing as a percentage
#> [1] 70
```

`set.seed(6)` just fixes which flips you get, so your ten match mine.

Seven of the first ten came back heads. As a share that is 70%, which sits 20 percentage points above the fair value of 50. Twenty points is a wide miss in anyone's book, and still nobody would call this coin bent on that evidence.

Why not?

Because ten flips is nothing. The real question is how wide a miss ten flips is allowed to make, and that is a question about spread, not about destination. We will come back to it with an actual number.

[NOTE]
A percentage point is the plain difference between two percentages. Going from 50% to 70% is a rise of 20 percentage points. Saying it in points keeps it apart from percentage change, which would call that same move a 40% jump.

=== step === concept
## Watching one coin settle over 10,000 flips

Ten flips gave 70%. The Law of Large Numbers says that if you keep flipping the same coin, that share stops wandering and settles on 0.5.

Watching it happen takes one line. `cumsum(flips)` is the running count of heads after each flip and `seq_along(flips)` is the running count of flips, so dividing one by the other gives the share of heads as it stood at every point in the run.

```r
# Track the share of heads as the flips pile up, and plot the whole path
share <- cumsum(flips) / seq_along(flips)

plot(share, type = "l", col = "grey30", log = "x", ylim = c(0, 1),
     xlab = "Number of flips (log scale)",
     ylab = "Share of flips that came back heads",
     main = "One coin, 10,000 flips")
abline(h = 0.5, col = "red", lwd = 3, lty = 2)

round(100 * share[c(10, 100, 1000, 10000)], 2)
#> [1] 70.00 52.00 49.70 50.19
```

Let's read the output. The horizontal axis is on a log scale so the first ten flips and the last thousand both get room. Each step to the right is ten times as many flips as the step before.

Now look at the four numbers alongside the line. At ten flips the share is 70.00 and the line is still jumping all over the place. At a hundred flips it is 52.00. At a thousand, 49.70. At ten thousand, 50.19, which is one fifth of one percentage point away from fair.

That is the Law of Large Numbers in one picture. Keep drawing from the same coin and the share of heads converges on the true probability of heads. The wandering never stops completely. It just gets smaller and smaller until the plot has no room left to show it.

The word that matters there is **share**. Not the count of heads, not the lead of heads over tails, the share. That one distinction is where most of the confusion about this theorem comes from.

=== step === concept
## What the Law of Large Numbers promises, and what it does not

The law names a destination and then stops. It does not say when you arrive, it does not say how far off you are at any particular number of flips, and it does not promise any correction along the way. That last one is the one that costs people money.

So let's be blunt about it. If a coin has just come up heads ten times in a row, nothing is owed to you. The coin has no memory, and later tails do not turn up to cancel the run.

So how does the share ever come back to 0.5?

By dilution, not by repayment. Let's take the same ten thousand flips, plant ten extra heads at the front of the run, and see what survives to the end.

```r
# Plant 10 extra heads at the front of the same run, then compare counts against shares
planted <- c(rep(1, 10), flips)

heads_minus_tails <- function(x) sum(x == 1) - sum(x == 0)

c(plain = heads_minus_tails(flips), planted = heads_minus_tails(planted))
#>   plain planted
#>      38      48

round(c(plain = 100 * mean(flips), planted = 100 * mean(planted)), 2)
#>   plain planted
#>   50.19   50.24
```

Look at the counts first. The plain run finishes 38 heads ahead of tails and the planted run finishes 48 ahead, which is the same 38 plus the ten heads we pushed in at the start. All ten are still sitting there after ten thousand flips. Nothing paid them back.

Now look at the shares. 50.19% against 50.24%, a difference of five hundredths of a point. The ten extra heads were never cancelled. They were divided by a much bigger number.

[KEY INSIGHT]
The Law of Large Numbers works on the share and never on the count. A surplus of heads is not repaid by later tails, it is swamped by them. The gap in counts is free to keep growing while the gap in shares closes in on zero.

=== step === quiz
## Quick check: what does the Law of Large Numbers promise?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- After a run of heads, tails become more likely, so the two even out. ::no
- The count of heads and the count of tails close in on each other as the flips pile up. ::no
- The share of flips that come back heads closes in on the true probability of heads. ::ok Exactly, and that is the whole promise: a destination for the share, with no date attached and no correction on the way.
- Once you pass about a thousand flips, the share of heads is guaranteed to stay within a point of 50. ::no Only one of these four is a promise about the share, and the share is the only thing the law speaks about. Counts are free to drift further apart forever, a run of heads is never repaid by later tails, and the law puts no bound on the gap at any particular number of flips.

=== step === concept
## Ten thousand runs of 100 flips, stacked

That picture has a hole in it, and filling the hole is the whole reason the second theorem exists. Convergence tells you where the share is heading. It says nothing at all about where you are right now, at whatever number of flips you actually did.

And a hundred flips is exactly the size of run people argue about. Somebody flips a coin a hundred times, gets 58 heads, and the argument starts.

One long run is no help there. What we need is many short ones. So let's run the whole hundred flip experiment ten thousand times over, keeping only the number of heads from each run.

```r
# Run the whole 100-flip experiment 10,000 times and keep the heads from each run
set.seed(11)
heads_per_run <- replicate(10000, sum(rbinom(100, size = 1, prob = 0.5)))
shares100     <- heads_per_run / 100

heads_per_run[1:8]      # heads in the first eight runs
#> [1] 35 51 54 51 48 51 49 52

hist(heads_per_run, breaks = 40, col = "grey85", border = "white",
     main = "10,000 runs of 100 flips",
     xlab = "Heads in the run (out of 100)")
abline(v = 50, col = "red", lwd = 3)
```

`replicate()` does the repeating: it runs the code inside it ten thousand times over and collects one number from each. The number we collect is the head count, and because a run is a hundred flips, that count doubles as the share in percent. 54 heads is 54%.

Read the first eight runs: 35, then 51, 54, 51, 48, 51, 49, 52. The first one is a long way out and the rest sit close to 50, which is the whole story in eight numbers.

Now look at the picture underneath them. Ten thousand runs are stacked up by how many heads they produced. It is a bell centred on 50, and nearly all of it sits between 40 and 60.

That pile has a name worth learning, because everything else here is built on it. It is the **sampling distribution** of the share: not the flips, but the collection of shares you get from repeating one whole experiment over and over.

=== step === concept
## The width of the bell: the standard error

The bell has a width, and that width is not something you have to go and measure. It was fixed before a single flip was made.

Let's measure it anyway, so we have a real number to hold the formula against. The standard deviation of those ten thousand shares is what "how wide" means here, in percentage points.

```r
# Measure the spread of the 10,000 shares and set it beside the formula's prediction
observed_spread  <- 100 * sd(shares100)
predicted_spread <- 100 * sqrt(0.5 * (1 - 0.5) / 100)

c(observed = round(observed_spread, 3), predicted = predicted_spread)
#>  observed predicted
#>     4.937     5.000
```

So that is 4.937 points measured against 5.000 points predicted. The formula behind the prediction is the one number the Central Limit Theorem hands you, and it is a short one:

\[ SE = \sqrt{\frac{p(1-p)}{n}} \]

Here \(p\) is the probability of heads on a single flip and \(n\) is the number of flips in one run. For a fair coin at a hundred flips that is \(\sqrt{0.25 / 100} = 0.05\), or 5 percentage points.

That number is the **standard error** of the share. It is the typical distance between one run's share and the true value of 50. Not the largest distance and not a limit anything is forbidden to cross, just the typical one.

[KEY INSIGHT]
The standard error answers the question the first theorem refuses to touch: how far off should I expect to be. At a hundred flips it is 5 percentage points, so a run coming back 45% or 55% is doing nothing unusual at all.

=== step === tryit
## Your turn: how wide is the spread at 400 flips?

A hundred flips gives a spread of 5 points. Four hundred flips is four times the data. Does that quarter the spread, or halve it, or something else?

Answer it twice. Write the standard error at 400 flips straight from the formula, in percentage points, then get the same number back from ten thousand simulated runs of 400 flips.

```r
# p is the chance of heads on one flip and n is the number of flips in one run.
# Line one: the standard error at 400 flips from the formula, in percentage points.
# Line two: the same number from 10,000 simulated runs of 400 flips.
p <- 0.5
n <- 400
# Press Check when you have both.
```
::check {"regex": "sqrt[\\s\\S]*rbinom\\s*[(]\\s*(400|n)\\b|rbinom\\s*[(]\\s*(400|n)\\b[\\s\\S]*sqrt", "gate": true, "difficulty": "beginner", "ok": "That is it. The formula says 2.5 points and the 10,000 runs come back with 2.514. Four times the flips halved the spread, from 5.0 points down to 2.5, so four times the data bought exactly twice the precision.", "no": "The formula line is 100 * sqrt(p * (1 - p) / n), which puts the answer in percentage points. For the simulation, keep the shape of the one you have already run and move the run length: set.seed(13), then replicate(10000, mean(rbinom(n, size = 1, prob = p))), then 100 * sd() of what comes back."}
::solution
```r
# The standard error at 400 flips: first from the formula, then from 10,000 runs
100 * sqrt(p * (1 - p) / n)
#> [1] 2.5

set.seed(13)
shares400 <- replicate(10000, mean(rbinom(n, size = 1, prob = p)))
round(100 * sd(shares400), 3)
#> [1] 2.514
```

Four times the flips bought half the spread. That ratio is worth holding on to, because it is the price of precision in every experiment you will ever run.

=== step === concept
## Why the spread shrinks like 1 over the square root of n

Four hundred flips bought half the spread and not a quarter of it, and the square root sign in the formula is why. The number of flips sits underneath it, so the spread falls like 1 over the square root of the flips, not like 1 over the flips.

Here is that rate written out as a price list, in percentage points.

```r
# Tabulate the standard error of the share, in percentage points, at four run lengths
run_length <- c(10, 100, 1000, 10000)
se_points  <- 100 * sqrt(0.25 / run_length)

data.frame(flips_in_a_run        = run_length,
           standard_error_points = round(se_points, 2))
#>   flips_in_a_run standard_error_points
#> 1             10                 15.81
#> 2            100                  5.00
#> 3           1000                  1.58
#> 4          10000                  0.50
```

Every row down is ten times the flips of the row above, and every row down is roughly a third of the spread. Ten thousand flips buys a typical miss of half a percentage point. Halving that again would take forty thousand.

The top row also settles the question those first ten flips left hanging. At ten flips a standard error is 15.81 points, and 70% heads is 20 points off fair, which is 20 divided by 15.81, or 1.26 standard errors. That is utterly ordinary. Those seven heads never needed explaining.

[NOTE]
Precision is expensive and it gets more expensive as you buy more of it. Halving your typical miss costs four times the data every single time you do it, whether you are flipping coins, running a survey or sizing an experiment.

=== step === concept
## Why the shape is normal: the Central Limit Theorem

One flip is a 0 or a 1. There is no bell in that, no middle and no tails. It is about as far from a normal distribution as you can get.

Average a hundred of them and you get a bell anyway. That is the Central Limit Theorem, and stated plainly it says this: average enough independent draws from almost any distribution, and the pile of those averages comes out normal no matter what shape you started from.

Notice where the bell comes from in that sentence. It comes from the averaging and not from the coin. So a badly lopsided coin has to end up at a bell as well. Here is our fair coin next to one that lands heads only a tenth of the time, ten thousand runs of a hundred flips each, with the normal curve the formula predicts drawn over both.

```r
# Compare the pile of shares from a fair coin against a heavily lopsided one
set.seed(12)
shares_lopsided <- replicate(10000, mean(rbinom(100, size = 1, prob = 0.1)))

par(mfrow = c(1, 2))
hist(shares100, breaks = 30, freq = FALSE, col = "grey85", border = "white",
     main = "Fair coin, p = 0.5", xlab = "Share of heads in 100 flips")
curve(dnorm(x, mean = 0.5, sd = sqrt(0.5 * 0.5 / 100)),
      add = TRUE, col = "red", lwd = 2)
hist(shares_lopsided, breaks = 30, freq = FALSE, col = "grey85", border = "white",
     main = "Lopsided coin, p = 0.1", xlab = "Share of heads in 100 flips")
curve(dnorm(x, mean = 0.1, sd = sqrt(0.1 * 0.9 / 100)),
      add = TRUE, col = "red", lwd = 2)

c(fair = round(sd(shares100), 4), lopsided = round(sd(shares_lopsided), 4))
#>     fair lopsided
#>   0.0494   0.0301
```

Both piles are bells and both sit under the curve the formula drew for them. The lopsided coin's bell is the narrower of the two, and the formula says exactly why: \(\sqrt{0.1 \times 0.9 / 100}\) is 0.03, against 0.05 for the fair coin. A coin that almost always lands tails has less room to vary.

[KEY INSIGHT]
The theorem is a statement about the pile of shares and never about the flips. The flips stay 0s and 1s however many you collect. What turns normal is the collection of results you get from repeating the whole experiment.

=== step === quiz
## Quick check: what exactly turns normal?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The flips themselves, once you have collected enough of them. ::no
- The pile of shares you get from repeating the whole 100-flip run many times over. ::ok Right. Each run hands back one share, and it is those shares, stacked up, that make the bell.
- Only data that was already roughly bell shaped to begin with, which a coin is not. ::no
- The share from a single run of 100 flips, which becomes a normal number rather than a fixed one. ::no The theorem never touches your raw data and it never touches one single result. It describes what happens to the collection of results from repeating an experiment: run 100 flips again and again, stack the shares, and that stack is the bell. A coin that lands heads a tenth of the time gets there too, which is exactly why the raw shape does not matter.

=== step === widget
## So is 58 heads out of 100 suspicious?

Let's go back to the coin nobody could agree about. A hundred flips, and 58 of them came back heads.

Everything we need to settle it is now on the table. 58% is 8 points above 50, and a standard error at a hundred flips is 5 points, so the result sits 8 divided by 5, or 1.6 standard errors from fair. That is the reading you want: not "8 points off" but "1.6 standard errors off". Points on their own mean nothing until you divide them by the spread they should be measured against.

Our ten thousand runs already tell us how often a fair coin does that.

```r
# Count the runs that landed 8 points or more away from 50, in either direction
gap_from_50 <- abs(heads_per_run - 50)

sum(gap_from_50 >= 8)
#> [1] 1261

mean(gap_from_50 >= 8)
#> [1] 0.1261
```

1,261 runs out of ten thousand, or about 13 in every 100. A fair coin produces 58 heads or better, or 42 or worse, roughly one time in eight. Whatever 58 heads is, it is not rare.

The same reading comes off a smooth normal curve. Drag the slider to move the result nearer to or further from 50, and the shaded area is the share of fair coin runs that land at least that far out on either side. It opens at 1.6, which is our result.

::widget null-distribution {"tails": 2, "start": 1.6, "label": "how many standard errors the result sits from 50"}

The readout puts a name on that shaded share. It is a **p-value**: the chance a fair coin lands at least this far from 50, counting both directions. It also passes a verdict against the usual 0.05 line, which is where a hypothesis test draws its border between ordinary and rare, and the H0 it names there is the claim on trial, which here is that the coin is fair.

The curve reads 0.110 where the simulation read 0.126, and that gap is not a mistake in either one. Runs deal in whole heads, and 58 is the first count that clears 8 points, so the runs are counting everything a smooth curve would place at 57.5 and above. On the curve, 57.5 sits 1.5 standard errors out rather than 1.6.

```r
# Read the same two tails off the smooth normal curve at 1.5 standard errors
2 * pnorm(-1.5)
#> [1] 0.1336144
```

0.134 from the curve against 0.126 from the simulation, and the rest of that gap is the ordinary wobble you get from ten thousand runs. Three ways of asking one question, and three answers that all sit around one run in eight.

Now push the slider out to 3 and watch the shaded area collapse to almost nothing. That is what a genuinely suspicious result looks like, and 58 heads out of 100 is nowhere near it.

=== step === concept
## The same 58% out of 1,000 flips

Now let's change one thing and one thing only. It is the same 58% heads and the same argument about the same coin, except that the run was a thousand flips instead of a hundred, which makes it 580 heads out of 1,000.

The percentage has not moved. The yardstick has.

```r
# Read 58% heads at two run lengths: the gap, the standard error, and the distance between them
run_length_58 <- c(100, 1000)
gap_points    <- 8
se_58         <- 100 * sqrt(0.25 / run_length_58)

data.frame(flips_in_a_run = run_length_58,
           gap_points     = gap_points,
           se_points      = round(se_58, 2),
           distance_in_se = round(gap_points / se_58, 2))
#>   flips_in_a_run gap_points se_points distance_in_se
#> 1            100          8      5.00           1.60
#> 2           1000          8      1.58           5.06
```

At a hundred flips, 8 points is 1.6 standard errors and you shrug. At a thousand flips the standard error has fallen to 1.58 points, so that same 8 points is 5.06 standard errors out, and 5 standard errors is not something a fair coin does.

How rarely, exactly? No simulation is needed for this one. The number of heads in a run follows a binomial distribution, and R can add up its tails directly with `pbinom()`. Doubling the lower tail covers both sides, because a fair coin's distribution is symmetric and the upper tail weighs exactly the same as the lower one.

```r
# The exact chance a fair coin lands 8 points or more from 50, at each run length
2 * pbinom(42, size = 100, prob = 0.5)     # 42 heads or fewer, or 58 or more
#> [1] 0.1332106

2 * pbinom(420, size = 1000, prob = 0.5)   # 420 heads or fewer, or 580 or more
#> [1] 4.697109e-07
```

One time in eight, against about five times in ten million. Same percentage, same distance from fair in points, and yet two verdicts that could not be further apart.

[KEY INSIGHT]
A percentage on its own is evidence of nothing. It becomes evidence once you divide its distance from the expected value by the standard error at the sample size it came from. That one division is the whole service the Central Limit Theorem provides.

=== step === quiz
## Quick check: is 51% heads more surprising at 100 flips or at 10,000?

A coin comes back 51% heads, one point above fair. Which run makes that worth a second look?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Equally surprising in both, because 51% means the same thing whichever run it came out of. ::no
- At 100 flips, because a short run is flimsier and a miss inside it counts for more. ::no
- At 10,000 flips, because a standard error there is only half a point. ::ok Yes: 1 point off is 2.0 standard errors at 10,000 flips, and only 0.2 standard errors at 100 flips where a standard error runs a full 5 points. Read every gap against the standard error at its own run length.
- There is no way to tell without first knowing whether the coin is fair. ::no Run the same division both times. A standard error is 5 points at 100 flips and 0.5 points at 10,000, so 1 point off is 0.2 standard errors in the short run and 2.0 in the long one. A short run is not more suspicious, it is more forgiving: it has so much room to miss that one point is nothing. And you do not need to know the coin, because the standard error is worked out from the fair value of 50 before anybody flips anything.

=== step === concept
## The running share inside a shrinking band

So far we have read both theorems off this coin one result at a time. Let's put them on the same picture and see who does what.

The wandering grey line is the running share from the long run. The blue band around it is plus and minus two standard errors, worked out at every number of flips from the same formula, so it starts enormous and funnels in. Two standard errors is the usual width to draw, because it is wide enough to hold nearly every run: at a hundred flips it is exactly the 40 to 60 span that swallowed nearly all ten thousand of our short runs.

```r
# Draw the running share again with a band of plus and minus two standard errors
par(mfrow = c(1, 1))
n_seq  <- seq_along(flips)
se_seq <- 100 * sqrt(0.25 / n_seq)

plot(100 * share, type = "l", col = "grey30", log = "x", ylim = c(0, 100),
     xlab = "Number of flips (log scale)",
     ylab = "Share of heads (percent)",
     main = "A destination, and the corridor on the way to it")
lines(n_seq, 50 + 2 * se_seq, col = "blue", lwd = 2, lty = 2)
lines(n_seq, 50 - 2 * se_seq, col = "blue", lwd = 2, lty = 2)
abline(h = 50, col = "red", lwd = 2)

round(4 * se_seq[c(10, 100, 1000, 10000)], 2)   # full width of the band, in points
#> [1] 63.25 20.00  6.32  2.00
```

Now read the two pieces separately, and the difference stops being slippery.

- The red line is the Law of Large Numbers. It is the destination, 50, and the promise that the grey line ends up there.
- The blue band is the Central Limit Theorem. It is how wide the corridor is at every point along the way: 63 points across at ten flips, 20 at a hundred, 6 at a thousand, 2 at ten thousand.

The grey line never leaves the band on this run, which is what a band that wide is built to do. One experiment, two theorems, and neither one is doing the other's job.

=== step === concept
## When each theorem stops working

Coins are the easy case. Both theorems come with conditions, and on real data those conditions can fail.

The Law of Large Numbers needs the data to have a mean at all: some fixed number the values are scattered around. The Central Limit Theorem needs that mean and needs a finite variance on top of it, because the standard error is built out of the variance. Take the variance away and there is no width left to compute.

Data with very heavy tails can break both. Here is a running mean on Cauchy draws, which are famous for having no mean at all, set beside the coin.

```r
# Follow a running mean on heavy-tailed data beside the coin's running share
set.seed(14)
heavy     <- rcauchy(10000)
heavy_run <- cumsum(heavy) / seq_along(heavy)

par(mfrow = c(1, 2))
plot(100 * share, type = "l", col = "grey30", log = "x", ylim = c(0, 100),
     xlab = "Number of flips (log scale)", ylab = "Share of heads (percent)",
     main = "Coin: it settles")
abline(h = 50, col = "red", lwd = 2)
plot(heavy_run, type = "l", col = "grey30", log = "x",
     xlab = "Number of draws (log scale)", ylab = "Running mean",
     main = "Heavy tails: it never settles")
abline(h = 0, col = "red", lwd = 2)

round(heavy_run[c(100, 1000, 10000)], 3)
#> [1]  0.648  0.181 12.205
```

The coin's share is sitting on 50 by the end. The running mean on the right reads 0.648 after a hundred draws, 0.181 after a thousand, and 12.205 after ten thousand. It sat further from zero after ten thousand draws than it did after a hundred. There is no destination for it to reach, so collecting more data does not help.

Both conditions now have names, so the two theorems fit into one small table.

| | Law of Large Numbers | Central Limit Theorem |
|---|---|---|
| What converges | the sample mean or share itself | the pile of sample means or shares |
| What you get | a destination, the true value | a shape and a width, normal with a standard error |
| Needs a finite mean | yes | yes |
| Needs a finite variance | no | yes |
| What it is for | trusting an average from a large sample | judging how far off one sample can be |

Read the finite variance row and you have the practical rule. The theorem with the extra requirement is the one that fails first, so heavy tailed data can leave you an average that still converges and a standard error that means nothing.

[WARNING]
This kind of failure is silent. Nothing errors and nothing warns. Revenue per customer is the everyday version: a handful of accounts can be a thousand times the typical one, and the running average jumps every time one of them turns up. The mean exists, but the tail is heavy enough that the sample needed to settle it may be larger than the data you have. Look at the tails before quoting an average.

=== step === quiz
## Quick check: which theorem answers which question?

Somebody flips a coin 1,000 times, gets 580 heads, and you tell them it sits 5.06 standard errors from fair, while the same 58% out of 100 flips sits only 1.6 out. Which theorem did the work in that sentence?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The Law of Large Numbers, because it is the one saying the share ought to be near 50. ::no
- The Central Limit Theorem, because the reading rests on the standard error at each run length. ::ok Exactly, and that is the number it supplies. The other theorem gives you a destination and refuses to say anything about distance, which is the only quantity the sentence uses.
- Both equally, since the destination of 50 comes from one and the 58% comes from the other. ::no
- Neither, because a percentage that far from 50 speaks for itself. ::no Only one of the two hands you a number you can divide by. The first gives a destination and stops: the share heads for 50, and it will not tell you how far off a run of 100 flips is entitled to be. The 5.00 points at 100 flips and the 1.58 at 1,000 both come out of the standard error formula, and 58% is simply what the coin did. Without the second theorem you are holding a percentage with nothing to measure it against.

=== step === tryit
## Your turn: how many flips before 52% heads means anything?

A coin comes back 52% heads and you want to know when that is worth arguing about. Two points is a small gap, so it will take a long run before it counts for much.

Put the bar at three standard errors, far enough out that a fair coin rarely reaches it. How many flips does a run need before a 2 point gap is 3 standard errors from fair?

The formula runs backwards this time. You know the distance you want in points and you know how many standard errors it should be worth, so the thing you solve for is the number of flips.

```r
# gap_in_points is how far 52% sits above the fair value of 50, and
# target_se is how many standard errors out we want that gap to be worth.
# Solve the standard error formula for the number of flips, then print it.
gap_in_points <- 2
target_se     <- 3
# Press Check when you have it.
```
::check {"regex": "0?[.]25[\\s\\S]*[\\^]\\s*2|[\\^]\\s*2[\\s\\S]*0?[.]25|sqrt[\\s\\S]*min\\s*[(]|min\\s*[(][\\s\\S]*sqrt", "gate": true, "difficulty": "intermediate", "ok": "5,625 flips. Two points off is a shrug at a hundred flips and a serious result at five and a half thousand, and this is the number where it crosses over. Look at what the square root does to the price: halve the gap you want to catch and you need four times the flips, quarter it and you need sixteen times.", "no": "Work it in two moves. The standard error you need is the gap divided by the target distance, gap_in_points / target_se, which is 0.667 points. Then turn the formula around: the standard error as a fraction is that over 100, and the number of flips is 0.25 divided by its square."}
::solution
```r
# Solve the standard error formula for the number of flips at the target distance
se_wanted    <- gap_in_points / target_se        # standard error we need, in points
flips_needed <- 0.25 / (se_wanted / 100)^2

flips_needed
#> [1] 5625

100 * sqrt(0.25 / flips_needed)                  # check: the standard error there
#> [1] 0.6666667
```

The check line puts the standard error at 5,625 flips at 0.667 points, and 2 divided by 0.667 is 3 exactly. That is how sample sizes are chosen in practice: decide the gap you care about, decide how far out it has to be before you will believe it, and let the formula tell you how much data to collect.

=== step === quiz
## Quick check: what breaks first on heavy-tailed data?

Revenue per customer has a mean, but a tail heavy enough that its variance is not finite. You take the average of a large sample from it.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Both theorems fail together, so the sample average is meaningless. ::no
- The Law of Large Numbers fails first, because it is the one that needs a finite variance. ::no
- The Central Limit Theorem fails first, because with no finite variance there is no standard error to build. ::ok Right. The average still converges on the true mean, but the normal spread around it does not apply, so you keep the destination and lose the corridor.
- Neither fails, because averaging always produces a normal shape eventually. ::no Line the two requirements up side by side. A destination needs a mean, and a width needs a variance on top of that mean, so the theorem carrying the extra requirement is the one that goes first. With a finite mean the average still heads somewhere; what you lose is the standard error, and with it every interval and every test built on one. Averaging does not manufacture a bell out of nothing either, it needs a finite variance to work with.

=== step === concept
## References

- [Introduction to Probability, 2nd revised edition](https://math.dartmouth.edu/~prob/prob/prob.pdf) - Grinstead and Snell. Free full text. Chapter 8 proves the weak law and chapter 9 does the Central Limit Theorem for coin flips specifically, which is our example exactly.
- [Introduction to Probability, 2nd edition](http://probabilitybook.net/) - Blitzstein and Hwang. Free full text from the authors. Chapter 10 holds both limit theorems together and is explicit that one is about the value and the other about the fluctuation around it.
- [All of Statistics](https://doi.org/10.1007/978-0-387-21736-9) - Wasserman. Chapter 5, Convergence of Random Variables, is the clean statement of why one theorem is convergence in probability and the other is convergence in distribution.
- [MIT 18.05, Introduction to Probability and Statistics](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/) - the class readings work the normal approximation to coin flipping through with numbers.
- [The Binomial Distribution](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html) - R Core Team, the documentation for `rbinom()` and `pbinom()`, both used above.

=== step === complete
## Quick recap

You watched both theorems happen on one coin, so they should be hard to confuse from here on. To summarize:

- The Law of Large Numbers answers **where**. Keep flipping and the share of heads closes in on the true probability of heads. Our run went 70% at ten flips and 50.19% at ten thousand.
- It promises nothing else. No date, no bound at any particular run length, and no correction on the way: ten planted heads were still all there after ten thousand flips, just divided by a much bigger number.
- The Central Limit Theorem answers **how far off**. Repeat the whole experiment, stack the results, and that pile is a bell whose width is the standard error, \(\sqrt{p(1-p)/n}\). At a hundred flips that is 5 percentage points.
- The width shrinks like 1 over the square root of the flips: 15.81 points at 10, 5.00 at 100, 1.58 at 1,000, 0.50 at 10,000. Halving your typical miss costs four times the data.
- What turns normal is the pile of shares and never the flips. A coin landing heads a tenth of the time arrives at a bell just the same.
- One needs a finite mean, the other needs a finite variance as well, so heavy tailed data loses the second one first.

And here is the sentence that settles a coin argument at any run length:

"Take the gap from the fair value, divide it by the standard error at that number of flips, and read the answer in standard errors. 58% heads is 1.6 out of a hundred flips and worth a shrug. The same 58% out of a thousand flips is 5.06 out, and that coin is bent."

That is both theorems on one coin, in one sitting. Nicely done, and have a great day!

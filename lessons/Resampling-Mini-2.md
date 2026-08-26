---
title: "Bootstrap confidence intervals: for any statistic"
slug: "Resampling-Mini-2"
description: "You have 200 household incomes and need an honest range around the median. No textbook formula covers it, so build the interval by resampling your own data."
keywords: "bootstrap confidence interval, bootstrap in R, percentile bootstrap, confidence interval for a median, resampling with replacement, bootstrap distribution, sample replace TRUE"
mathjax: false
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "resampling"
course_title: "Resampling"
course_lesson: "2"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: "Resampling-Mini-1"
course_next: ""
curriculum_id: "0.0.32"
lesson_access: "windowed"
catalog_blurb: "How to put an honest range around any statistic, even when no formula exists."
---

=== step === cover
::eyebrow Resampling
## Bootstrap confidence intervals: for any statistic

Let's say you surveyed 200 households and someone asks you for the median income. You sort the incomes, take the middle one, and it comes out at 52,000 dollars.

Then comes the sensible follow-up. How sure are you? Give me a range.

So you go looking for the formula for a range around a median. You find one for a mean, and one for a proportion, and then the textbook stops. Nobody wrote one for a median.

Here is the way out, and it does sound like cheating the first time you hear it. Pretend those 200 households are the whole town. Draw a fresh survey of 200 out of them, letting the same household turn up more than once. Take the median of that. Do it ten thousand times, and read your range off the spread of the answers that come back.

That is the bootstrap, in three moves.

::widget process-flow {"steps":[{"title":"Pretend your 200 are the town","sub":"the survey you have is the only picture of it you own"},{"title":"Redraw 200, repeats allowed","sub":"recompute the median, ten thousand times over"},{"title":"Read the middle 95%","sub":"the two ends of that slice are your interval"}]}

Everything after this is just doing those three moves on real numbers, and then finding out which statistics you can drop into the middle and which ones you cannot.

=== step === concept
## The 200 households and the median we have to report

We do not have the real survey file, so let's build one that behaves the way a real one would.

Household income is lopsided. Most families sit in a broad middle band, and a few earn many times that, which stretches the top of the range a long way out. The function `rlnorm()` draws numbers with exactly that shape, and rounding to the nearest hundred makes them look like something a person wrote on a form.

Press Run.

```r
# Build the one survey we have: 200 household incomes, in dollars
set.seed(2026)
income <- round(rlnorm(200, log(52000), 0.55), -2)

c(households = length(income),
  median     = median(income),
  mean       = round(mean(income)))
#> households     median       mean
#>        200      52000      60694
```

So the survey has 200 households. Their median income is 52,000 and their mean is 60,694. That gap between the two numbers is the lopsidedness showing up, and it is easier to see in a picture than to describe.

```r
# Draw the 200 incomes and mark the median
hist(income, breaks = 25, col = "grey85", border = "white",
     main = "200 households, one survey",
     xlab = "Annual income in dollars")
abline(v = median(income), col = "red", lwd = 3)
```

Most of the households sit between roughly 30,000 and 75,000, and then a thin tail runs off to the right, out to 222,000. Those few large incomes drag the mean up to 60,694 while the median stays put at 52,000, because the household in the middle of the queue does not care how large the largest income is.

That is why the median is the number worth reporting here. It is also the number we now have to put a range around.

=== step === concept
## Why the mean gets an interval and the median does not

If your colleague had asked for the mean instead, you would have been finished in one line. Any t-test reports a 95% interval for the mean whether you ask for it or not.

```r
# The textbook interval for the mean, and the number that sets its width
round(as.numeric(t.test(income)$conf.int))
#> [1] 55715 65672

sd(income) / sqrt(200)
#> [1] 2524.733
```

55,715 to 65,672. Where did that width come from? From the second line. `sd(income) / sqrt(200)` is the standard error of the mean, 2,525 dollars, and the interval reaches just under two of those on each side of the sample mean, 60,694.

That formula exists because somebody worked out, once and for all, how far a sample mean can wander away from the mean of the population it was drawn from. The answer turned out to depend on two things you can read straight off your own data: how spread out the values are, and how many of them you have.

Now ask the same question about a median. How far does a sample median wander? That depends on how tightly the incomes are packed right around the middle of the pile. If they are packed tight, the middle barely moves when you redraw. If they are spread thin, it swings. And to know how tightly they are packed around the true middle, you would have to already know the town, which is the one thing you do not have.

[NOTE]
Statisticians have derived standard errors for the median. Every one of them needs something about the population that 200 numbers cannot tell you, which is why nobody hands you a median formula the way they hand you `sd(x) / sqrt(n)`.

=== step === concept
## What a confidence interval is actually measuring

Before we build a range, let's be clear about what a range is for.

Your 52,000 came from 200 particular households. Knock on 200 different doors in the same town and the median comes back different, and nothing tells you which way it will move. An interval is a statement about that wobble. It says how far the answer would move if the survey ran again.

So if we could run the survey again, we could simply watch that happen. Let's build a world where we can. We invented the incomes anyway, so let's invent the town they came from as well: 200,000 households drawn with the same recipe.

```r
# Build the town the survey came from: 200,000 households
set.seed(11)
town <- round(rlnorm(200000, log(52000), 0.55), -2)

c(households = length(town), median = median(town))
#> households     median
#>     200000      52000
```

The town's median income is 52,000. Our own survey of 200 happened to land on 52,000 as well, which is luck, and a different 200 doors would have handed us something else. That is the whole reason a range is worth asking for.

Now let's knock on 200 doors, take the median, and do that ten thousand times over. Each round is a genuinely fresh survey of the town.

```r
# Run 10,000 fresh surveys of 200 households and keep every median
set.seed(12)
real_medians <- replicate(10000, median(sample(town, 200)))

hist(real_medians, breaks = 40, col = "grey85", border = "white",
     main = "Medians from 10,000 fresh surveys",
     xlab = "Median income of the survey, in dollars")
abline(v = median(town), col = "red", lwd = 3)

round(quantile(real_medians, c(0.025, 0.975)))
#>  2.5% 97.5%
#> 47250 57200

round(sd(real_medians))
#> [1] 2506
```

The histogram is what those 10,000 medians look like piled up. The red line is the town's real median, and the pile is centred on it, which is reassuring. The spread is the part we came for: the standard deviation of those medians is 2,506, and the middle 95% of them run from 47,250 to 57,200.

That pile has a name. It is the sampling distribution of the median, and the interval we want is read straight off it.

There is only one problem, and it is a big one.

[WARNING]
In real life you get one survey and no town. You cannot run 10,000 more surveys, and the town is the very thing you are trying to learn about. Everything above needed a population that nobody ever has.

=== step === widget
## Treat your 200 households as the whole town

So we need that pile of medians without the town. Here is the move that gets it.

Your 200 households are not the town. But they are the only picture of the town you own, and they are not a bad one, because they were drawn from it fairly and their shape is roughly its shape. So take the picture seriously. Treat those 200 households as if they were the entire town, and draw your fresh surveys out of them.

That is the whole trick, and it has a name. The plug-in principle: you plug your sample into the place where the unknown population was supposed to go.

Drawing a survey of 200 out of 200 has one consequence you have to accept, and it is the part that feels wrong at first. You draw with replacement. Each household goes back into the bowl after being picked, so the same household can turn up twice or three times, and plenty of households never turn up at all.

Press Draw again a few times. Each tile is one household.

::widget bootstrap-sample {"n": 12, "seed": 17, "tail": "Those households did not make it into this draw at all."}

Out of twelve households, a draw picks some of them more than once, which is what the blue tiles mean, and misses others completely. The ones it misses are called out-of-bag, which is just a name for the households left sitting in the bowl. On average about a third of them get left out, and that is not a quirk of the small numbers. With 200 households, roughly 74 get left out of any given draw.

Each draw is a new survey of the same size, made only of households you actually visited. That is a bootstrap resample.

=== step === quiz
## Quick check: why draw with replacement?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Because putting each household back is faster than drawing without replacement. ::no
- Because a real survey team sometimes visits the same household twice by accident. ::no
- Because drawing 200 out of 200 without replacement would hand back the same 200 households in a new order, so every median would come out identical. ::ok Exactly. Without replacement there is nothing to vary, and the pile would be 10,000 copies of 52,000. Replacement is what makes each draw a genuinely different survey of the same size.
- Because leaving some households out of each draw corrects the bias in the median. ::no The reason is arithmetic, not realism and not correction. Draw 200 out of 200 without replacement and you get the same 200 households back every single time, so every median is identical and nothing wobbles. Replacement is what lets one draw differ from the next.

=== step === concept
## One resample, one median

Let's do one, on the real 200.

The function `sample()` does the drawing, and `replace = TRUE` is what puts each household back in the bowl after it is picked. We will draw household numbers rather than incomes directly, so we can also see who got left out.

```r
# Draw one new survey of 200 households out of our own 200
set.seed(3)
picks        <- sample(200, 200, replace = TRUE)
one_resample <- income[picks]

median(one_resample)
#> [1] 49400

200 - length(unique(picks))
#> [1] 73

max(table(picks))
#> [1] 7
```

`set.seed(3)` fixes which draw you get, so your numbers match mine.

This particular resample left 73 households out completely and picked one household seven times over. Its median came back at 49,400, against the 52,000 we started with.

That difference of 2,600 dollars is the wobble we are chasing. It is the kind of answer a redone survey might have handed you. One resample tells you the wobble exists, and nothing more than that.

=== step === concept
## Ten thousand resamples make the bootstrap distribution

One resample gives one median. Ten thousand of them give a pile you can measure.

The function `replicate()` runs the same expression over and over and keeps every answer. So the line below says: draw a resample, take its median, do that 10,000 times. It takes a few seconds.

```r
# Resample 10,000 times and keep the median of every resample
set.seed(1)
boot_medians <- replicate(10000, median(sample(income, 200, replace = TRUE)))

hist(boot_medians, breaks = 40, col = "grey85", border = "white",
     main = "10,000 resamples of our own 200 households",
     xlab = "Median income of the resample, in dollars")

round(c(mean = mean(boot_medians), sd = sd(boot_medians)))
#>  mean    sd
#> 52080  3017
```

That pile is the bootstrap distribution of the median. It is the thing we said we could not have: a picture of how far the answer moves when the survey is redone, built out of one survey and nothing else.

It sits centred at 52,080, near the 52,000 we reported, and its standard deviation is 3,017. That number is the bootstrap standard error of the median. It is the median's answer to `sd(income) / sqrt(200)`, and since no formula would produce it, we simulated it instead.

=== step === concept
## Reading the interval off the bootstrap distribution

Now for the payoff. The interval is not computed from the pile. It is read off it.

You want the middle 95%, so you cut away the lowest 2.5% and the highest 2.5% and report what is left between them. The function `quantile()` finds those two cut points.

```r
# Cut the middle 95% out of the pile of bootstrap medians
quantile(boot_medians, c(0.025, 0.975))
#>  2.5% 97.5%
#> 46300 57250
```

46,300 to 57,250. That is the 95% confidence interval for the median income of the town, and it is what you send back to your colleague.

Its proper name is the percentile bootstrap interval, because the two ends are percentiles of the bootstrap distribution and nothing more. No formula, no assumed shape, no table in the back of a book. Here it is drawn on the pile.

```r
# Mark the two interval bounds on the bootstrap distribution
boot_ci <- quantile(boot_medians, c(0.025, 0.975))

hist(boot_medians, breaks = 40, col = "grey85", border = "white",
     main = "The middle 95% of 10,000 bootstrap medians",
     xlab = "Median income of the resample, in dollars")
abline(v = boot_ci, col = "red", lwd = 3, lty = 2)
abline(v = median(income), col = "blue", lwd = 3)
```

The blue line is the median we actually measured, 52,000. The two red dashed lines are the ends of the interval. Ninety-five percent of the pile sits between them, and 2.5% of it sits outside each end.

[KEY INSIGHT]
A percentile bootstrap interval is four moves: resample with replacement, compute the statistic, repeat ten thousand times, take the 2.5% and 97.5% quantiles of the answers. The statistic in the middle can be anything you can write in R.

=== step === tryit
## Your turn: make it a 90% interval

Your colleague comes back and says a 95% interval is wider than they can fit on a slide. They want a 90% one instead.

Nothing needs recomputing. The object `boot_medians` still holds all 10,000 medians, and the confidence level is only a question of which slice of that pile you take. A 90% interval leaves 5% out at each end instead of 2.5%.

```r
# boot_medians holds 10,000 medians, one per resample.
# Take the two cut points that leave the middle 90% between them,
# so 5% of the pile is left out at each end.
# One line. Press Check when you have it.
```
::check {"regex": "0?\\.05\\s*,\\s*0?\\.95", "gate": true, "difficulty": "beginner", "ok": "That gives 46,600 to 56,700, which is 850 dollars narrower than the 95% one. You bought the extra tightness by lowering what you claim, and an interval that misses more often is the price.", "no": "Same call as before, with both cut points moved inward: `quantile(boot_medians, c(0.05, 0.95))`."}
::solution
```r
# The 5% and 95% cut points give a 90% interval
quantile(boot_medians, c(0.05, 0.95))
#>    5%   95%
#> 46600 56700
```

=== step === concept
## Does it agree when a formula does exist?

You should not trust a method because it sounds clever. You should trust it because it gives the right answer in the places where the right answer is already known.

The mean is one of those places. So put the mean through the same four moves and see whether resampling lands where the formula lands.

```r
# Put the mean through the same four moves
set.seed(2)
boot_means <- replicate(10000, mean(sample(income, 200, replace = TRUE)))

round(quantile(boot_means, c(0.025, 0.975)))
#>  2.5% 97.5%
#> 55874 65850

round(sd(boot_means))
#> [1] 2545
```

Now the textbook answers for the same statistic, side by side.

```r
# The formula answers: the t interval and the standard error
round(as.numeric(t.test(income)$conf.int))
#> [1] 55715 65672

round(sd(income) / sqrt(200))
#> [1] 2525
```

55,874 to 65,850 from resampling, against 55,715 to 65,672 from the formula. The two ends differ by about 160 and 180 dollars on an interval nearly 10,000 dollars wide. The bootstrap standard error, 2,545, sits within one percent of the textbook's 2,525.

Notice what the resampling never did. It never used the t distribution. It never assumed the incomes were normally shaped, which they very obviously are not. It drew households out of a bowl, and arrived at the same place.

That is the evidence worth having. It agrees wherever you can check it, and that is what earns it the right to be used where you cannot.

=== step === concept
## Does the bootstrap distribution match the real one?

Two endpoints agreeing on one statistic is encouraging. Since we happen to have a whole town lying around, let's ask the harder question: does the entire pile match?

We are holding two piles of 10,000 medians. One came from fresh surveys of the town. The other came from resampling the same 200 households over and over. Here they are on the same scale.

```r
# Put the town-survey medians and the bootstrap medians side by side
par(mfrow = c(1, 2))

hist(real_medians, breaks = 40, col = "grey85", border = "white",
     xlim = c(43000, 63000),
     main = "10,000 surveys of the town",
     xlab = "Median income")

hist(boot_medians, breaks = 40, col = "grey85", border = "white",
     xlim = c(43000, 63000),
     main = "10,000 resamples of our 200",
     xlab = "Median income")

par(mfrow = c(1, 1))
```

They sit in the same place, in roughly the same shape. Now let's measure them.

```r
# Compare the centre, the spread, and how many distinct values each pile holds
round(c(town = median(real_medians), bootstrap = median(boot_medians)))
#>      town bootstrap
#>     52000     52000

round(c(town = sd(real_medians), bootstrap = sd(boot_medians)))
#>      town bootstrap
#>      2506      3017

c(town = length(unique(real_medians)), bootstrap = length(unique(boot_medians)))
#>      town bootstrap
#>       312       180
```

The centres agree exactly. The spreads are close but not equal: 2,506 for the real thing against 3,017 for the bootstrap, about a fifth wider. Two things are going on there, and both are worth knowing.

The first is that our 200 households are not a perfect picture of the town. The bootstrap can only ever be as good as the sample you feed it, and this particular sample says the median is a little more slippery than it really is. A different 200 households would miss in a different direction.

The second is specific to the median. Every resample is built out of incomes we already hold, so every resampled median is one of our 200 incomes or the midpoint of two of them. That is why the third comparison is there: across 10,000 resamples the medians landed on only 180 different values, while the fresh surveys produced 312. The bootstrap pile is a coarser thing than the one it is imitating, so it was never going to match it to the last decimal.

It also errs on the wide side, which is the direction you would rather it went wrong in. An interval that is slightly too generous causes less damage than one that is too confident.

=== step === quiz
## Quick check: what the interval says and what it does not

You send back one line: the median household income is 52,000, with a 95% interval of 46,300 to 57,250. Which reading of that interval is the right one?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 95% of the households in the town earn somewhere between 46,300 and 57,250. ::no
- It is a range for the town's median. Run the whole exercise on many fresh surveys and about 95% of the intervals built this way would contain it. ::ok That is the one. The 95% belongs to the recipe, not to the two numbers you happen to be holding.
- There is a 95% probability that the town's median lies between 46,300 and 57,250. ::no
- 95% of the 200 households we surveyed earn between 46,300 and 57,250. ::no All three wrong readings put the 95% on the wrong thing. It is not a share of households, and it is not a probability attached to your one interval, which either contains the town median or does not. The 95% belongs to the procedure: repeat the survey and the whole recipe many times, and about 95 intervals in 100 would cover the true median.

=== step === concept
## Swap the statistic: the 90th percentile

Look back at the four moves that produced the interval and ask what any of them knew about medians. Nothing. The word `median` appears once, buried in the middle, and everything around it is drawing and counting.

So take it out and put something else in. Your colleague now wants to know what a household near the top of the town earns, and settles on the 90th percentile: the income that 90% of households fall below.

```r
# Swap the statistic in the slot: the 90th percentile of income
quantile(income, 0.9, names = FALSE)
#> [1] 109100

set.seed(4)
boot_p90 <- replicate(10000, quantile(sample(income, 200, replace = TRUE), 0.9, names = FALSE))

quantile(boot_p90, c(0.025, 0.975))
#>   2.5%  97.5%
#>  91470 117540
```

109,100, with an interval running from 91,470 to 117,540. The argument `names = FALSE` only stops `quantile()` from labelling its answer "90%", a label that would otherwise be carried into all 10,000 results and clutter them.

That interval is about 26,000 dollars across, where the median's was about 11,000. That is not a failure, it is honest reporting. Far fewer households sit out near the 90th percentile to pin it down, so the answer moves more when the survey is redone, and the resampling reports that without being asked to.

=== step === concept
## The ratio of the 90th percentile to the median

Now for the statistic that makes the whole case.

A common way to describe inequality in one number is to divide the 90th percentile by the median. It says how many times better off a household near the top is than the household in the middle. Statistics offices publish it. No textbook I know of gives you an interval formula for it.

It is also two statistics computed on the same data and then divided, and that is where people slip.

```r
# The 90th percentile as a multiple of the median
ratio <- quantile(income, 0.9, names = FALSE) / median(income)
round(ratio, 2)
#> [1] 2.1
```

A household at the 90th percentile earns about 2.1 times what the middle household earns. Now put a range around it.

```r
# Bootstrap the ratio, reading both parts off ONE resample
set.seed(5)
boot_ratio <- replicate(10000, {
  r <- sample(income, 200, replace = TRUE)
  quantile(r, 0.9, names = FALSE) / median(r)
})

round(quantile(boot_ratio, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#>  1.77  2.39
```

1.77 to 2.39. Report the ratio as 2.1 and say it could reasonably be anywhere from about 1.8 to about 2.4.

Look closely at the block, because the line that matters is the one that draws the resample. It is drawn once, into `r`, and both the 90th percentile and the median are read off that same `r`.

[WARNING]
Never bootstrap the two parts of a combined statistic separately. In the real data the two parts move together, since a survey that happens to catch several rich households pushes the 90th percentile and the median up at the same time. Resample them apart and you throw that link away, and the interval that comes back is wrong. Here it comes back too wide.

=== step === tryit
## Your turn: an interval for the interquartile range

Your turn, and this time write the whole thing.

The interquartile range is the distance between the 25th and the 75th percentile, which is the width of the middle half of the incomes. `IQR()` computes it in one call, and for our 200 households it comes to 38,050.

Write the four moves that put a 95% interval around it: 10,000 resamples with replacement, `IQR()` on each one, then the 2.5% and 97.5% quantiles of the answers. Start with `set.seed(6)` so your numbers match mine.

```r
# income holds the 200 household incomes.
# Build 10,000 resamples with replacement, take the IQR of each one,
# then read the 2.5% and 97.5% quantiles off the pile.
# Start with set.seed(6). Press Check when you have it.
```
::check {"regex": "IQR\\s*[(][\\s\\S]*quantile", "gate": true, "difficulty": "intermediate", "ok": "That gives 33,174 to 46,401 around an interquartile range of 38,050. Nothing changed except the name of the function in the middle, which is the entire point of the recipe.", "no": "Same shape as the median run, with `IQR` in the slot: `boot_iqr <- replicate(10000, IQR(sample(income, 200, replace = TRUE)))`, then `quantile(boot_iqr, c(0.025, 0.975))`."}
::solution
```r
# A 95% interval for the interquartile range, the same four moves
IQR(income)
#> [1] 38050

set.seed(6)
boot_iqr <- replicate(10000, IQR(sample(income, 200, replace = TRUE)))

round(quantile(boot_iqr, c(0.025, 0.975)))
#>  2.5% 97.5%
#> 33174 46401
```

=== step === concept
## How many resamples is enough?

One number in the recipe has gone unquestioned: the 10,000.

It is worth being clear about what that number does, because it is easy to hope it does more than it does. Let's build the same interval at 200 resamples, at 2,000, and at 10,000.

```r
# Build the same interval at three different resample counts
set.seed(7)
for (B in c(200, 2000, 10000)) {
  bm <- replicate(B, median(sample(income, 200, replace = TRUE)))
  cat(B, "resamples:", round(quantile(bm, c(0.025, 0.975))), "\n")
}
#> 200 resamples: 46200 57104
#> 2000 resamples: 46350 57250
#> 10000 resamples: 46350 57250
```

At 200 resamples the two ends are 46,200 and 57,104, already within a couple of hundred dollars of where they end up. By 2,000 they have arrived, and going all the way to 10,000 does not move them at all.

So the resample count is a computing choice, not a statistical one. More resamples steady the two endpoints, and steadying is all they do. They cannot make the interval narrower, because the width comes from the 200 households you surveyed and from nothing else.

[TIP]
2,000 resamples is enough to report a percentile interval, and 10,000 costs a few seconds and removes the last of the jitter. If the interval comes back wider than you can use, more resamples will not help you. More households will.

=== step === concept
## When the bootstrap gives an interval you should not trust

The recipe swallows any statistic you hand it, which is exactly why you need to know the cases where it fails without complaining. Here is the cleanest one. Ask it for the largest income in the town.

```r
# Bootstrap the largest income in the survey
max(income)
#> [1] 222000

set.seed(8)
boot_max <- replicate(2000, max(sample(income, 200, replace = TRUE)))

quantile(boot_max, c(0.025, 0.975))
#>   2.5%  97.5%
#> 172500 222000

mean(boot_max == max(income))
#> [1] 0.629
```

Look at the top end of that interval. 222,000. That is not an estimate of what the richest household in the town earns. It is the richest household in our survey, and the interval cannot reach past it, because a resample can only ever contain incomes we already hold. The last line counts how often the resamples handed back that exact number, and it was nearly two thirds of them.

The town almost certainly holds households earning more than 222,000. Our interval says otherwise, with 95% confidence. That is not a small error, and no amount of extra resampling will repair it.

That one failure is the clearest of three, and they all come from the same place:

1. **Statistics that live on the extremes.** The maximum, the minimum, the range. They depend on the far edge of the data, and the far edge is precisely what a survey of 200 knows least about.
2. **Very small samples.** With 8 or 10 observations, your picture of the population is too crude to plug in, and the interval comes back too narrow.
3. **Rows that depend on each other.** Monthly sales, daily prices, repeated visits to the same household. Resampling rows one at a time treats each row as a separate draw. When this month is tied to last month, drawing them apart destroys the structure you were trying to measure.

[KEY INSIGHT]
The bootstrap can only ever reuse values you already hold, and it assumes each row was drawn on its own. Every failure traces back to one of those two sentences.

=== step === quiz
## Practice: which of these can the bootstrap handle?

Four requests land on your desk in the same week. Only one of them can go straight through the four moves you have been writing. Which one?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The highest income in the town, from the same 200 households. ::no
- The average month-to-month change in sales, from 24 monthly figures. ::no
- The trimmed mean of the 200 incomes, with the top and bottom 5% thrown away. ::ok Yes. A trimmed mean is an ordinary function of 200 rows that were drawn on their own, so it drops into the slot exactly as the median did.
- The median income of a village, from a survey of 8 households. ::no Three of these break the recipe. The highest income leans on the far edge of the data, which a resample can never see past. The 24 monthly figures are not 24 independent rows, since each month is tied to the one before it. Eight households are too few for your sample to stand in for a village. The trimmed mean is the safe one: an ordinary function of 200 rows drawn on their own.

=== step === tryit
## Practice: the share of households under 40,000

One more, on a statistic we have not touched yet.

Your colleague asks what share of the town earns under 40,000 a year. In our survey, `income < 40000` gives a TRUE or FALSE for each household, and the mean of TRUEs and FALSEs is the share of TRUEs. So `mean(income < 40000)` is the share you want.

Write both parts: the share in our survey, and a 95% interval around it. Start with `set.seed(9)`.

```r
# income holds the 200 household incomes.
# First: the share of our households earning under 40000.
# Then: 10,000 resamples, the same share computed on each one,
# and the 2.5% and 97.5% quantiles of those answers.
# Start with set.seed(9). Press Check when you have it.
```
::check {"regex": "mean\\s*[(][\\s\\S]*40000[\\s\\S]*quantile", "gate": true, "difficulty": "intermediate", "ok": "0.32 in our survey, with an interval of 0.255 to 0.385. So somewhere between a quarter and two fifths of the town earns under 40,000, and that is as sharp as 200 households will let you be.", "no": "Two moves. Build the pile with `replicate(10000, mean(sample(income, 200, replace = TRUE) < 40000))`, then take `quantile()` of it at 0.025 and 0.975."}
::solution
```r
# The share of households under 40000, with a 95% interval
mean(income < 40000)
#> [1] 0.32

set.seed(9)
boot_share <- replicate(10000, mean(sample(income, 200, replace = TRUE) < 40000))

quantile(boot_share, c(0.025, 0.975))
#>  2.5% 97.5%
#> 0.255 0.385
```

=== step === quiz
## Practice: the interval is too wide, what now?

Your colleague looks at 46,300 to 57,250, says the range is too wide to act on, and asks you to tighten it. They still want a 95% interval for the median. Which change actually delivers one?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- Run 100,000 resamples instead of 10,000. ::no
- Report the 5% and 95% cut points instead, since they sit closer together. ::no
- Bootstrap the mean instead, because the mean has a textbook formula behind it. ::no None of the first three gives a tighter answer about the town's median. More resamples only steady the endpoints, and those had stopped moving by 2,000. The 5% and 95% cut points do print a smaller range, but it is a 90% interval now, a weaker claim wearing a nicer number. And the mean is a different statistic about a different thing. The width came from the 200 households, so only more households can shrink it.
- Survey more households. ::ok Yes. The width comes from the 200 rows you hold, and only more rows will shrink it. Everything else either polishes the endpoints without moving them, or quietly changes what you are claiming.

=== step === concept
## References

- [Bootstrap Methods: Another Look at the Jackknife](https://doi.org/10.1214/aos/1176344552) - Efron (1979), The Annals of Statistics 7(1), 1-26. The paper that introduced the method.
- [An Introduction to the Bootstrap](https://doi.org/10.1201/9780429246593) - Efron and Tibshirani (1993), Chapman and Hall. The standard text on the plug-in principle and percentile intervals.
- [Bootstrap Methods and Their Application](https://doi.org/10.1017/CBO9780511802843) - Davison and Hinkley (1997), Cambridge University Press. The reference behind R's boot package.
- [What Teachers Should Know About the Bootstrap](https://doi.org/10.1080/00031305.2015.1089789) - Hesterberg (2015), The American Statistician 69(4), 371-386. How many resamples are enough, and where percentile intervals fall short.
- [Random Samples and Permutations](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) - R Core Team, the documentation for `sample()`.

=== step === complete
## Quick recap

You started with a median and no formula, and finished with an interval you built yourself. What to keep:

- A confidence interval measures how far your answer would move if the survey ran again. The bootstrap gets at that by treating your own 200 households as the town and redrawing from them.
- The recipe is four moves: resample with replacement, compute the statistic, repeat ten thousand times, take the 2.5% and 97.5% quantiles. For our median that gave 46,300 to 57,250 around 52,000.
- It agrees with the formula wherever a formula exists. On the mean it returned 55,874 to 65,850 against the textbook's 55,715 to 65,672.
- The statistic is only a slot. The 90th percentile, the interquartile range, a ratio of the two, a share below a threshold: same four moves, different function in the middle.
- It fails on statistics that live at the extremes, on very small samples, and on rows that depend on each other.
- More resamples steady the endpoints. Only more data narrows them.

So when someone asks how sure you are about that 52,000, you have a sentence:

"The middle household earns about 52,000. Survey another 200 households in the same town and you would probably land somewhere between 46,300 and 57,250."

That is an honest answer about a statistic nobody gave you a formula for. Congratulations, you made it through. Have a great day!

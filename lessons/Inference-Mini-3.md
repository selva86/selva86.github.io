---
title: "Confidence intervals: what they really mean"
description: "A 95% confidence interval is not 95% of your data, and not a 95% chance either. Build intervals from repeated samples in R and see what the 95% counts."
keywords: "confidence interval, what does 95% confidence mean, confidence interval interpretation, t.test in R, conf.int, coverage, standard error, margin of error"
mathjax: true
webr: true
date: "2026-08-19"
post_type: "LESSON"
curriculum_id: "0.0.3"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-2"
course_next: ""
lesson_access: "windowed"
catalog_blurb: "What the 95% in a confidence interval is actually counting."
---

=== step === cover

## Confidence intervals: what they really mean

Tony runs the pizza place at the end of your street, and there is a small printed card taped to his counter.

*We are 95% confident the average delivery takes between 22 and 30 minutes.*

It sounds precise, and it sounds like a promise. But what is the 95% actually promising?

Ask around and you will get two answers. The first one says that 95% of pizzas arrive between 22 and 30 minutes. The second one says there is a 95% chance the true average sits somewhere inside 22 to 30.

Neither of those is right.

Both of those answers sound so reasonable that most people who use these intervals pick one of them and never ask any further. Today we are going to ask.

Here is what we will do instead. We are going to build Tony's shop ourselves, so that we know the true average delivery time and nobody in the story does. Then we time a day of deliveries, build the interval, and check whether it caught the truth. Then we do that a hundred times over and count.

::widget process-flow {"steps":[{"title":"Time one day","sub":"twelve deliveries, one average"},{"title":"Add a margin","sub":"the average plus and minus a margin makes a range"},{"title":"Catch or miss","sub":"the range either holds the true average or it does not"}]}

Running that loop over and over is the whole meaning of the 95%. By the end of this you will be able to say it in one sentence to anybody who asks.

=== step === concept

## What number are we actually chasing?

Tony's card talks about "the average delivery time". Before we can check whether an interval catches anything, we have to be clear about which average that is, because there are two of them and they are not the same number.

The first one is the **true average**, which is what you would get if you timed every delivery Tony will ever make. That means every Tuesday lunch and every rainy Friday night, all of them counted. That number is real, and nobody can ever see it.

The second one is the average of the deliveries you actually timed. You sit in the shop one Tuesday, time twelve orders, add them up and divide by twelve. That number you can compute, and it is not the true average. It is your one look at it.

The gap between those two numbers is the thing we have to understand.

In real life you only ever hold the second one, which is exactly what makes this hard to learn. So we are going to cheat. We will build the shop ourselves with the true average set to 26 minutes, and then walk into it as though we knew nothing.

```r
# We are building Tony's shop, so we get to know the two things
# no real shop owner ever knows.
true_mean <- 26     # the true average delivery time, in minutes
true_sd   <- 6.5    # how far a single delivery typically drifts from that

n_day <- 12         # how many deliveries we time in one day

# Tuesday: twelve orders, timed to the nearest tenth of a minute.
set.seed(7476)
day1 <- round(rnorm(n_day, mean = true_mean, sd = true_sd), 1)
day1
#>  [1] 19.8 31.2 21.9 23.4 24.8 30.7 41.6 24.2 23.1 21.4 33.2 20.2

mean(day1)
#> [1] 26.29167
```

`rnorm(12, mean = 26, sd = 6.5)` draws twelve numbers that scatter around 26, where 6.5 is the typical size of the scatter. `set.seed(7476)` fixes which twelve you get, so your numbers on screen match the ones written here exactly.

Tuesday's average came out at 26.29 minutes, and the true average is 26. So we were off by about a third of a minute, and the only reason we know we were off is that we built the shop.

=== step === concept

## Why does the answer change every day?

Tuesday gave us 26.29 minutes. Now let us go back on Wednesday and time twelve more orders, and then do the same again on Thursday.

It is the same shop and the same kitchen, with the same oven, the same bikes and the same true average of 26 minutes sitting behind all of it. What changes is that we are timing a different twelve pizzas.

```r
set.seed(944)
day2 <- round(rnorm(n_day, mean = true_mean, sd = true_sd), 1)
day3 <- round(rnorm(n_day, mean = true_mean, sd = true_sd), 1)

c(day1 = mean(day1), day2 = mean(day2), day3 = mean(day3))
#>     day1     day2     day3
#> 26.29167 23.95000 27.82500
```

The three averages came out at 26.29, then 23.95, then 27.83. Nothing about the shop changed between them. The only thing that changed is which twelve pizzas happened to get timed.

That wobble is not sloppiness, and no amount of care with the stopwatch removes it. It is simply what you pay for looking at twelve deliveries instead of all of them.

So reporting "26.29 minutes" on its own leaves out something important. That number is one draw from something that jumps around by several minutes, and a fair answer has to show that jumping instead of hiding it. A range is how you show it.

=== step === concept

## How much does a daily average wobble?

Our three days landed at 26.29, 23.95 and 27.83. If we can put a number on how far apart daily averages tend to be, we can turn that number into a range.

Two things decide how much it wobbles.

The first one is how spread out the individual deliveries are. A kitchen where every pizza takes roughly the same time gives you steady daily averages, and a chaotic kitchen does not.

The second one is how many deliveries you time. With twelve pizzas, one long bike ride across town drags the whole average up, and with two hundred that same ride barely moves it.

Put those two together and you get the **standard error**: the spread of the deliveries you timed, divided by the square root of how many you timed.

\[ \text{standard error} = \frac{s}{\sqrt{n}} \]

Here \(s\) is the standard deviation of your twelve recorded times, which is the usual measure of how much they vary among themselves, and \(n\) is how many you recorded, so 12. The result estimates the typical distance between one day's average and the truth.

```r
spread_day1 <- sd(day1)          # how much the twelve times vary among themselves
spread_day1
#> [1] 6.558888

se_day1 <- spread_day1 / sqrt(n_day)
se_day1
#> [1] 1.893388
```

That comes to about 1.89 minutes. What it claims is that a Tuesday-sized average usually sits somewhere around 1.9 minutes away from the true 26.

Notice that we got that estimate out of one Tuesday, without ever seeing another day. Because we built this shop, we can go and check it. Run two thousand days, take each day's average, and measure how far apart those averages actually spread.

```r
set.seed(99)
many_days <- replicate(2000, mean(rnorm(n_day, mean = true_mean, sd = true_sd)))
sd(many_days)
#> [1] 1.914487
```

That comes to 1.91, against the 1.89 we guessed from a single day. So the standard error does what it says it does.

=== step === concept

## Turning the wobble into a range

So we have an average of 26.29 minutes and a typical miss of about 1.89 minutes. Now stretch that into a range wide enough to usually contain the truth.

"Wide enough" is the whole design question. Stretch too little and you will miss the truth constantly. Stretch too far and you end up announcing that the average is somewhere between 5 and 50 minutes, which is safe and useless.

The interval is your average, plus and minus a margin:

\[ \text{interval} = \bar{x} \pm t^{*} \times \frac{s}{\sqrt{n}} \]

Let us read that from left to right. \(\bar{x}\) is the average of your twelve times. The \(s/\sqrt{n}\) part is the standard error we just built, 1.89 minutes. And \(t^{*}\) is a multiplier that decides how many standard errors wide to go. You get that multiplier from `qt()` in R.

```r
avg  <- mean(day1)
se   <- sd(day1) / sqrt(n_day)

crit <- qt(0.975, df = n_day - 1)    # the multiplier for a 95% interval
crit
#> [1] 2.200985

margin <- crit * se
margin
#> [1] 4.167319

c(lower = avg - margin, upper = avg + margin)
#>    lower    upper
#> 22.12435 30.45899
```

Two things in that `qt()` call look arbitrary, and neither of them is.

The `0.975` is there because a 95% interval leaves 5% out, split evenly between the two ends. So 2.5% falls off the bottom, 2.5% off the top, and 97.5% sits below the upper edge.

The `df = n_day - 1` is simply 12 minus 1. With only twelve times you had to estimate the spread from those very same twelve numbers, and that borrowed information costs you a slightly larger multiplier than a big day of data would need.

So Tuesday's interval runs from 22.12 to 30.46 minutes. That is where the card on Tony's counter comes from, rounded off to 22 and 30.

That range has a name. It is the **95% confidence interval** for the average delivery time, and the 95% is called the confidence level, the number you picked when you asked `qt()` for 0.975. So what exactly is that 95% counting?

=== step === concept

## The one-line version in R

You will never build that by hand again. `t.test()` does the whole thing from the raw times.

```r
t.test(day1)
#>
#> 	One Sample t-test
#>
#> data:  day1
#> t = 13.886, df = 11, p-value = 2.56e-08
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  22.12435 30.45899
#> sample estimates:
#> mean of x
#>  26.29167
```

Ignore the top half of that. `t.test()` always throws in a check of whether the average could be zero, which for delivery times is a silly question and gets a silly answer. The two lines we came for are under `95 percent confidence interval`, and they read 22.12435 and 30.45899. Those are exactly the numbers we built by hand, down to the last digit.

If you want only those two numbers, ask for them directly.

```r
t.test(day1)$conf.int
#> [1] 22.12435 30.45899
#> attr(,"conf.level")
#> [1] 0.95
```

`$conf.int` pulls out the pair, with a note attached telling you which confidence level produced it.

=== step === tryit

## Your turn: build the interval for Wednesday

Wednesday's twelve delivery times are sitting in `day2`. Build the 95% confidence interval for Wednesday's average.

Either route is fine. Let `t.test()` do it, or build it by hand with `mean()`, `sd()` and `qt()` the way we just did. Then look at how far Wednesday's interval sits from Tuesday's.

```r
# Wednesday's twelve delivery times, in minutes.
day2

# Your code here: build the 95% interval for Wednesday's average.
```

::check {"regex": "t[.]test\\s*[(]\\s*day2|qt\\s*[(]\\s*0?[.]975", "gate": true, "difficulty": "beginner", "ok": "That is it. Wednesday runs from 19.93 to 27.97 minutes.", "no": "Not yet. Two routes work: `t.test(day2)$conf.int`, or by hand with `mean(day2)`, `sd(day2)/sqrt(12)` and `qt(0.975, df = 11)`."}

::solution

```r
# The one-line route
t.test(day2)$conf.int
#> [1] 19.93463 27.96537
#> attr(,"conf.level")
#> [1] 0.95

# The same two numbers, built by hand
avg2    <- mean(day2)
se2     <- sd(day2) / sqrt(n_day)
margin2 <- qt(0.975, df = n_day - 1) * se2
c(lower = avg2 - margin2, upper = avg2 + margin2)
#>    lower    upper
#> 19.93463 27.96537
```

Tuesday said 22.12 to 30.46, and Wednesday says 19.93 to 27.97. It is the same shop with the same true 26 minutes underneath, and yet the two answers are noticeably different. Both of them happen to contain 26, and again, we only know that because we built the shop.

=== step === concept

## How often does this actually catch the truth?

Here is the question nobody in real life gets to ask. Tuesday's interval was 22.12 to 30.46. Did it catch the true average?

We know it did, because we set the truth to 26 ourselves. Tony cannot check this, and neither can any analyst on any real data, because checking would mean already knowing the answer you were trying to estimate.

The fair way to judge an interval is not to ask about that one interval at all. It is to ask about the recipe that produced it. We can run that recipe a hundred times and watch how it behaves.

So we take a hundred days with twelve deliveries each, and we build one interval per day, all from the same shop with the same true average of 26 minutes. Then we count how many of the hundred contain 26.

```r
set.seed(42)
intervals <- replicate(100, t.test(rnorm(n_day, mean = true_mean, sd = true_sd))$conf.int)

dim(intervals)
#> [1]   2 100

intervals[, 1:3]      # first three days: row 1 is the lower edge, row 2 the upper
#>          [,1]     [,2]    [,3]
#> [1,] 27.10001 17.20974 21.3299
#> [2,] 34.71985 27.99638 30.2788
```

Look hard at the first of those three, which runs from 27.10 to 34.72. It does not contain 26. Whoever ran the shop that day would have timed twelve deliveries carefully, run the same code as everybody else, made no mistake anywhere, and still printed an interval that misses. And they would have had no way of knowing.

Now let us count all hundred.

```r
catches <- intervals[1, ] <= true_mean & intervals[2, ] >= true_mean

sum(catches)
#> [1] 95

sum(!catches)
#> [1] 5

coverage <- mean(catches)
coverage
#> [1] 0.95
```

Ninety five of the hundred intervals caught 26, and five of them missed. That number, 0.95, is the 95%.

=== step === concept

## Watch the catches and the misses

Counting is one thing, but seeing it drawn is what makes it clear.

Every day gets one vertical line, running from its lower edge up to its upper edge. The dashed line straight across is the true average, 26 minutes, which in real life is invisible. A line that crosses the dashed line caught the truth. A line sitting entirely above it or entirely below it missed, and those are drawn in red.

```r
plot(NULL, xlim = c(0, 101), ylim = range(intervals),
     xlab = "Day", ylab = "Delivery time (minutes)",
     main = "100 days, 100 intervals, one true average")

segments(x0 = 1:100, y0 = intervals[1, ], y1 = intervals[2, ],
         col = ifelse(catches, "grey55", "firebrick"), lwd = 2)

abline(h = true_mean, lty = 2, lwd = 2)
```

Now look at what the five red lines have in common, which is nothing at all. They are not shorter or wider than the rest, they are not built from worse data, and they are not the result of a bad day in the kitchen. They are ordinary days where the twelve pizzas that happened to get timed all ran a little fast together, or all ran a little slow together.

There is also one thing this picture cannot give you. If you are standing on any one of those days holding only your own twelve numbers, nothing tells you what colour your line is.

=== step === quiz

## What is the 95% counting?

You have now watched this happen a hundred times. So when Tony's card says 95%, what exactly is being counted?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- 95% of Tony's deliveries land inside 22 to 30 minutes. ::no Look again at how the hundred lines were counted.
- There is a 95% chance the true average lies inside Tuesday's interval. ::no That is the tempting one, and it is coming up next.
- Keep building intervals this way from fresh days and about 95% of them will contain the true average. ::ok Exactly. The 95% is the hit rate of the method across repeated days, which is what the hundred lines showed: 95 catches, 5 misses.
- Tuesday's interval is accurate to within 95% of its width. ::no The 95% is not a property of your one interval at all. It is a property of the recipe, measured by running that recipe over and over on fresh days: 95 of the hundred lines contained 26, five did not.

=== step === concept

## Why not "a 95% chance the truth is in here"?

The idea that there is a 95% chance the truth sits inside Tuesday's interval is the tempting one, so let us take it apart properly instead of just calling it wrong.

Take Tuesday's interval, 22.12 to 30.46, and the true average, 26.

```r
ci1 <- t.test(day1)$conf.int
c(lower = ci1[1], upper = ci1[2])
#>    lower    upper
#> 22.12435 30.45899

ci1[1] <= true_mean & ci1[2] >= true_mean
#> [1] TRUE
```

The answer comes back TRUE. It is not 95% TRUE. It is simply TRUE.

The true average is a fixed number, 26. Tuesday's interval is a fixed pair of numbers, 22.12 and 30.46. Once both of those are fixed, nothing is left to chance, so there is nothing for a probability to be about. Every one of those hundred lines was already a plain yes or a plain no before anybody counted them.

The randomness sits earlier than that, in which twelve pizzas happened to get timed. That is what the 95% describes, and by the time you are holding your twelve numbers, the 95% has already done its work.

[NOTE]
If you genuinely want to say "there is a 95% probability the true average is between 22 and 30", that sentence is not nonsense. It is a different tool with a different name. It is called a credible interval, and it comes from Bayesian statistics, which starts by writing down what you believed about delivery times before you timed any. What `t.test()` hands you is not that.

=== step === concept

## Why not "95% of pizzas arrive in that window"?

Now let us take the other misreading, which is the more common one in an actual workplace, because it is what a customer hears when they read the card on the counter.

Tuesday's interval is a statement about the average delivery. It says nothing whatsoever about your pizza. Single pizzas scatter much more than an average of twelve does, and we can just go and look.

```r
ci1[2] - ci1[1]           # how wide Tuesday's interval is, in minutes
#> [1] 8.334638

inside <- day1 >= ci1[1] & day1 <= ci1[2]
sum(inside)               # how many of the twelve pizzas landed inside it
#> [1] 4

range(day1)               # the fastest and the slowest of the twelve
#> [1] 19.8 41.6
```

Only four of the twelve landed inside it. A window carrying the label "95%" caught a third of Tuesday's actual pizzas, while the day itself ran from 19.8 minutes all the way to 41.6.

Nothing is broken there. It is a correct answer to a different question. An average of twelve deliveries is far steadier than the twelve deliveries themselves, so a range built around the average is far narrower than the pizzas are.

If what you actually want is a range covering most individual orders, that exists too. It is called a prediction interval, and it comes out a great deal wider than 8.3 minutes.

=== step === quiz

## Which sentence is safe to write?

Here are Tuesday's numbers once more. The twelve deliveries averaged 26.3 minutes, and the 95% interval ran from 22.1 to 30.5. You have to put one line about that in a report, so which one is safe?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 95% of our deliveries take between 22.1 and 30.5 minutes. ::no That is a claim about single pizzas, and only four of the twelve were in there.
- Our best estimate of the average delivery time is 26.3 minutes, with a 95% confidence interval of 22.1 to 30.5 minutes. ::ok Yes. It reports the estimate, attaches the interval, and claims nothing beyond that. Nobody can accuse it of anything.
- There is a 95% probability the true average delivery time is between 22.1 and 30.5 minutes. ::no One of these tempting lines describes single pizzas, which the interval says nothing about, and only four of Tuesday's twelve landed inside it. The other puts a probability on a fixed number that is either inside the interval or outside it. The safe sentence reports the average, attaches the interval, and stops there.

=== step === concept

## What makes an interval narrower?

Tuesday's interval is 8.3 minutes wide. That is a fair answer, but it is not much use for planning a delivery promise. So what actually moves that width?

Look back at the margin, \(t^{*} \times s / \sqrt{n}\). There are only three things in it, and two of them belong to the shop rather than to you. The small function below rebuilds the width from those two. It takes the kitchen's typical spread as a round 6.5 minutes rather than Tuesday's exact 6.558888, so its widths land near Tuesday's 8.33 without matching it to the decimal.

```r
ci_width <- function(n, spread) {
  2 * qt(0.975, df = n - 1) * spread / sqrt(n)
}

# Same kitchen, more deliveries timed
c(n12 = ci_width(12, 6.5), n48 = ci_width(48, 6.5), n192 = ci_width(192, 6.5))
#>      n12      n48     n192
#> 8.259806 3.774807 1.850552
```

Twelve deliveries buys you about 8.3 minutes of width. Timing four times as many, which is 48, roughly halves that width. Timing four times as many again, which is 192, halves it once more.

That is the square root at work, and it is bad news for anyone hoping to buy precision cheaply. To cut your width in half you need four times the data, and to cut it to a tenth you need a hundred times the data.

The other knob is the kitchen itself.

```r
# The same twelve deliveries, out of a calmer kitchen (half the variation)
c(busy_kitchen = ci_width(12, 6.5), calm_kitchen = ci_width(12, 3.25))
#> busy_kitchen calm_kitchen
#>     8.259806     4.129903
```

Halve how much the deliveries vary and the width halves straight away, with no square root standing in the way. That is why making a chaotic process calmer usually beats measuring a chaotic process harder.

[TIP]
Those two knobs belong to the shop: how many orders you can time, and how consistent the kitchen is. There is a third knob, and it is entirely yours.

=== step === tryit

## Your turn: ask to be right more often

Everything so far has been at 95%, which is a convention and nothing deeper than that. You are allowed to ask to be right more often.

`t.test()` takes a `conf.level` argument, and if you do not set it yourself, it defaults to 0.95. Ask for a 99% interval on Tuesday's twelve deliveries instead, then compare the two widths.

Before you run it, make a guess: does asking for 99% make the interval wider or narrower?

```r
# Tuesday's twelve delivery times are in day1.
# The 95% interval, for comparison:
t.test(day1)$conf.int

# Your code here: ask the same function for a 99% interval.
```

::check {"regex": "conf[.]level\\s*=\\s*0?[.]99", "gate": true, "difficulty": "intermediate", "ok": "Right. 20.41 to 32.17, which is 11.76 minutes wide against 8.33 at 95%.", "no": "Not yet. The argument goes inside the call: `t.test(day1, conf.level = 0.99)$conf.int`."}

::solution

```r
ci95 <- t.test(day1)$conf.int
ci99 <- t.test(day1, conf.level = 0.99)$conf.int

ci99
#> [1] 20.41117 32.17216
#> attr(,"conf.level")
#> [1] 0.99

c(width95 = ci95[2] - ci95[1], width99 = ci99[2] - ci99[1])
#>   width95   width99
#>  8.334638 11.760993
```

It got wider, and that is the trade in its plainest form. You are still holding the same twelve pizzas from the same shop, with not one scrap of new information anywhere. The only thing that changed is how often you are willing to be wrong, which is about five days in a hundred at 95% and about one day in a hundred at 99%. Being wrong less often costs you about three and a half extra minutes of vagueness.

Push that all the way and you can see where it ends. Ask for 100% confidence and R gives you an interval running from minus infinity to plus infinity. That interval is always right, and it is completely useless.

=== step === quiz

## An interval that missed: did the method break?

Think about the five red lines once more, and pick one of them. It is a day whose interval ran from 27.1 to 34.7 minutes and never came near the true 26. So what went wrong on that day?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- That day's twelve deliveries must have been timed badly. ::no The data was collected exactly like every other day.
- The formula was applied wrongly on that day. ::no Same code, same function, same everything.
- Twelve deliveries is too few for the interval to be trusted. ::no Nothing went wrong. A 95% interval is a promise to miss about 5 times in 100, and you just watched it miss 5 times in 100. If misses were impossible the interval would have to be infinitely wide. Asking for 99% buys you fewer misses, and you pay for them in width.
- Nothing went wrong. About five misses per hundred is exactly what a 95% interval is built to allow. ::ok Yes. The misses are not a bug, they are the price on the ticket. And you have already seen what buying fewer of them costs: at 99% the interval went from 8.33 to 11.76 minutes wide.

=== step === concept

## How to say it in one sentence

Here is the wording that survives a careful reader, and the wording that does not.

| Safe to say | Do not say |
|---|---|
| The average delivery time is estimated at 26.3 minutes, 95% confidence interval 22.1 to 30.5. | There is a 95% chance the average is between 22.1 and 30.5. |
| We are 95% confident the average lies between 22.1 and 30.5 minutes. | 95% of deliveries take between 22.1 and 30.5 minutes. |
| The method used here catches the true average about 95 times out of 100. | This particular interval is 95% likely to be right. |
| A wider interval means less data, or a more variable kitchen. | A wider interval means a worse estimate. |

Notice that the first column never says anything about a single pizza, and never puts odds on the one interval in front of you.

And if somebody stops you and asks what the 95% actually means, this is the whole answer:

> If I kept collecting fresh days and building an interval from each one the same way, about 95 out of every 100 of those intervals would contain the true average. This is one of them, and I cannot tell you which kind.

That last sentence is the part people leave out, and it is the part that matters most.

=== step === concept

## References

- [Neyman, J. (1937). Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://royalsocietypublishing.org/doi/10.1098/rsta.1937.0005) - the paper that defines confidence in terms of long-run coverage, which is where the counting argument comes from.
- [Hoekstra, R., Morey, R. D., Rouder, J. N., Wagenmakers, E.-J. (2014). Robust Misinterpretation of Confidence Intervals](https://link.springer.com/article/10.3758/s13423-013-0572-3) - working researchers get these statements wrong at roughly the same rate as first-year students.
- [Morey, R. D., Hoekstra, R., Rouder, J. N., Lee, M. D., Wagenmakers, E.-J. (2016). The Fallacy of Placing Confidence in Confidence Intervals](https://link.springer.com/article/10.3758/s13423-015-0947-8) - a careful walk through why the probability reading fails.
- [Cumming, G. (2012). Understanding The New Statistics](https://www.routledge.com/Understanding-The-New-Statistics-Effect-Sizes-Confidence-Intervals-and-Meta-Analysis/Cumming/p/book/9780415879682) - the book-length treatment of intervals jumping around from one sample to the next.
- [R documentation: t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - what `conf.int` and `conf.level` return.

=== step === complete

## You can explain the 95% now

We built Tony's shop so the true average, 26 minutes, was ours to check against. Then we did what Tony cannot do.

We timed one Tuesday and got 26.29 minutes, then two more days and got 23.95 and 27.83, which is why a single number is never the whole answer. We measured that wobble with the standard error, stretched it into a range with a multiplier from `qt()`, and got the same two numbers out of `t.test()` in one line.

Then we ran the recipe a hundred times. Ninety five intervals caught 26 and five did not, and the five that missed looked exactly like the ones that did not.

That is the answer. The 95% is the hit rate of the method across repeated samples. It is not the share of pizzas inside the window, and it is not the odds on the interval in front of you, because that one either contains the truth or it does not, and neither you nor anybody else can tell which.

Say that out loud once, in your own words. It is a favourite interview question precisely because so few people can.

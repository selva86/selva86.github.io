---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not 95% of your data and not a 95% chance. Build intervals from a pizza shop's delivery times and see what the 95% really counts."
keywords: "confidence interval meaning, what does 95% confidence mean, confidence interval interpretation, confidence interval in R, t.test confidence interval, coverage, standard error, prediction interval"
mathjax: true
webr: true
date: "2026-08-23"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-2"
course_next: ""
curriculum_id: "0.0.3"
lesson_access: "windowed"
catalog_blurb: "What the 95% in a confidence interval is really counting."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

You order from Mario's most Friday nights, and somewhere on the shop's page there is a line that sounds reassuring: we are 95% confident the average delivery takes between 22 and 30 minutes.

It reads like a promise. So what exactly is being promised?

Ask around and you get one of two answers. Either 95% of pizzas arrive inside that window, or there is a 95% chance the shop's true average delivery time sits somewhere between 22 and 30 minutes.

Both sound sensible. Neither one is what the 95% says.

That is a strange thing to be true of a number this common, and most people nod along and never ask again. We are going to do the opposite. We will take Mario's actual delivery times and build the interval by hand, then build a kitchen whose true average we set ourselves, run a hundred nights through it, and watch which intervals catch that true average and which ones miss.

There are only three steps involved.

::widget process-flow {"steps":[{"title":"Take one sample","sub":"20 delivery times from one night at the shop"},{"title":"Turn it into an interval","sub":"a mean, plus and minus a margin"},{"title":"Repeat and count","sub":"how many of those intervals hold the true average"}]}

That is the whole idea. By the end you will have one sentence you can say out loud about any confidence interval, and you will know exactly why the other two readings are wrong.

=== step === concept
## Where the 22 to 30 minutes came from

Before we argue about what the interval means, let's see where those two numbers came from. Nobody picked them to sound good. They were computed.

Mario's has not timed every pizza it will ever send out. Nobody can. What the shop has is a record of its last 20 deliveries, in minutes, and that record is the whole basis of the claim on the page.

Press Run.

```r
# Take the shop's last 20 delivery times and turn them into a 95% interval
deliveries <- c(13, 15, 15, 16, 20, 21, 22, 24, 24, 25, 25,
                27, 27, 28, 32, 33, 33, 33, 42, 45)

c(orders = length(deliveries), mean = mean(deliveries), sd = round(sd(deliveries), 2))
#> orders   mean     sd
#>   20.0   26.0    8.6

t.test(deliveries)$conf.int
#> [1] 21.97685 30.02315
#> attr(,"conf.level")
#> [1] 0.95
```

Twenty orders, averaging 26.0 minutes, with a standard deviation of 8.6 minutes. One pizza took 13 minutes and another took 45, which is what a real kitchen on a real evening looks like.

`t.test(deliveries)$conf.int` pulls the confidence interval out of R's one-sample t-test. It hands back two numbers, 21.98 and 30.02. Round those off and you have the 22 to 30 the shop advertises. The `attr(,"conf.level")` line underneath is R telling you which level it used, and 0.95 is its default.

So the interval is not a fact about pizza. It is a pair of numbers computed from those 20 delivery times, and it moves the moment the 20 times move.

=== step === concept
## Do 95% of pizzas actually arrive between 22 and 30?

That is the first reading, and it is the easy one to settle, because we are holding the very 20 delivery times the interval was built from. If 95% of pizzas land between 22 and 30 minutes, then about 19 of these 20 should.

Let's count them and draw them.

```r
# Count how many of the 20 deliveries actually landed inside 22 to 30 minutes
inside <- deliveries >= 21.98 & deliveries <= 30.02
sum(inside)
#> [1] 8
mean(inside)
#> [1] 0.4

hist(deliveries, breaks = 8, col = "grey85", border = "white",
     main = "Mario's last 20 deliveries",
     xlab = "Delivery time in minutes")
abline(v = c(21.98, 30.02), col = "red", lwd = 3)
```

Eight out of twenty. That is 40%, and 40% is nowhere near 95%.

The histogram says the same thing in one look. The two red lines are the interval, and the bars spill well past them on both sides. The 13 and 15 minute deliveries sit off to the left, the 42 and 45 minute ones sit off to the right, and none of them is a mistake. They are ordinary Friday nights.

So that settles the first reading. The interval was never a claim about where individual deliveries land.

[NOTE]
Look at the width for a second. The delivery times themselves run from 13 to 45 minutes, a spread of 32 minutes, and yet the interval is only 8 minutes wide. Something that narrow could not possibly be describing individual pizzas.

So what is it describing? The average. Every ingredient that went into it, the mean of 26.0 and the count of 20 orders, is about the average delivery time and nothing else.

=== step === quiz
## Quick check: what is the interval a statement about?
::prose-only the histogram immediately above carries the picture, and this asks the reader to put what it showed into words

Mario's 95% interval runs from 21.98 to 30.02 minutes, and 8 of the shop's 20 deliveries landed inside it. What is that interval making a claim about?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The delivery time of your next order, which should land between 22 and 30 minutes. ::no
- The 20 orders it was built from, 95% of which should sit inside it. ::no
- The average delivery time across all of the shop's orders, and not any single delivery. ::ok That is it. The interval is built out of the mean, so it is a statement about the mean. Individual pizzas scatter much more widely, which is exactly why only 8 of the 20 landed inside it.
- The range the shop can guarantee, since it chose to advertise those numbers. ::no Three of these four talk about individual deliveries or about a guarantee. The interval only ever talks about the average delivery time, and we watched the individual times ignore it completely: 8 of 20 inside, not 19 of 20.

=== step === concept
## The sample mean moves every night

26.0 minutes was one night's answer. Tomorrow the shop takes 20 more orders and gets a different average, not because anything in the kitchen changed, but because a different 20 customers happened to order.

That is the awkward thing about a sample mean. The true average delivery time of Mario's kitchen, the one you would get from every order it will ever make, sits perfectly still. Our estimate of it wanders around.

We cannot see Mario's true average, so let's build a kitchen where we can. `rnorm(20, mean = 26, sd = 8.6)` invents 20 delivery times whose true long-run average is exactly 26 minutes, scattered around it in the bell shape of a normal distribution with a standard deviation of 8.6 minutes. Those are Mario's own two numbers, so the made-up kitchen runs at the same pace and with the same spread as the real one.

It does come out tidier than a real Friday, which has a longer tail of very late deliveries than a bell curve does, and that costs us nothing here, because what we are about to put on trial is the way an interval gets built, not the kitchen it gets built from. What we gain is that this kitchen's true average is 26 minutes and we know it, because we set it ourselves.

Now for eight nights of it. `replicate()` is how you run something more than once: hand it a count and a line of code, and it runs that line that many times and keeps all the answers. Here each answer is one night of 20 orders boiled down to its average.

```r
# Run eight nights of 20 orders through a kitchen whose true average is 26 minutes
set.seed(7)
night_means <- replicate(8, mean(rnorm(20, mean = 26, sd = 8.6)))
round(night_means, 1)
#> [1] 29.8 26.8 26.9 27.2 25.2 28.0 29.2 25.0
```

`set.seed(7)` fixes which random nights you get, so your eight numbers match mine.

Every one of those nights came out of a kitchen whose true average is 26 minutes, and not one of them reported 26. The first said 29.8, nearly four minutes high. The last said 25.0, a minute low. The truth never moved.

That wobble is not a flaw in the arithmetic. It is what sits between a sample and the truth, and an interval is what you get when you measure the wobble and allow for it.

=== step === concept
## The standard error: how far the sample mean usually lands from the truth

Those eight nights came back between 25.0 and 29.8. Run thousands of nights instead of eight and the wobble takes on a definite size, and that size has a name: the **standard error** of the mean. It is the standard deviation of the sample mean itself, the typical distance between one night's average and the truth.

Here is the useful part. You do not need thousands of nights to get it. It is the sample's own standard deviation divided by the square root of the number of orders.

\[ \text{standard error} = \frac{s}{\sqrt{n}} \]

That is a claim, so let's not take it on trust. We run 5,000 nights through the same kitchen, collect the 5,000 nightly averages, and measure how much they actually spread. Then we compute s divided by the square root of n from Mario's 20 real orders, and see whether the two agree.

```r
# Check s / sqrt(n) against the real spread of 5,000 nightly averages
set.seed(1)
many_means <- replicate(5000, mean(rnorm(20, mean = 26, sd = 8.6)))

c(spread_of_the_means = round(sd(many_means), 3),
  s_over_sqrt_n       = round(sd(deliveries) / sqrt(20), 3))
#> spread_of_the_means       s_over_sqrt_n
#>               1.909               1.922
```

1.909 against 1.922. The left number came from actually running 5,000 nights and measuring how far apart the answers landed. The right number came from 20 delivery times and a square root, with no simulation at all.

So a nightly average typically sits about 1.9 minutes from the truth. Compare that with the 8.6 minute spread of the deliveries themselves. Averaging 20 orders together cancels most of that noise, and dividing by the square root of 20 is exactly how much of it gets cancelled.

[KEY INSIGHT]
The standard error is what makes an interval possible at all. It converts the spread of individual pizzas, which you can see, into the spread of your estimate, which you cannot.

=== step === concept
## Building the interval by hand: estimate, multiplier, standard error

Every confidence interval you will ever meet is three pieces stuck together: an estimate to sit at the centre, a standard error to say how far that estimate typically strays, and a multiplier that decides how many standard errors of room to allow.

\[ \bar{x} \;\pm\; t_{0.975,\, n-1} \times \frac{s}{\sqrt{n}} \]

We already have the estimate and the standard error. The multiplier is the new piece, and `qt()` supplies it. `qt(0.975, df = 19)` asks the t distribution for the point with 97.5% of the curve below it, which leaves 2.5% above. The matching 2.5% at the other end leaves 95% sitting in the middle. The t distribution has the same bell shape as the normal, with slightly heavier tails, and it is the right curve to ask because we had to estimate the spread rather than being handed it.

Let's get all three pieces on the table.

```r
# Work out the three pieces of the interval from the 20 delivery times
n      <- length(deliveries)
x_bar  <- mean(deliveries)
s      <- sd(deliveries)
se     <- s / sqrt(n)
t_crit <- qt(0.975, df = n - 1)

c(estimate = x_bar, multiplier = round(t_crit, 3), standard_error = round(se, 3))
#>       estimate     multiplier standard_error
#>         26.000          2.093          1.922
```

The multiplier is 2.093, so the interval will reach 2.093 standard errors either side of 26.0. If you have seen 1.96 quoted for a 95% interval, 2.093 is the same idea with a small allowance added on, because we estimated the spread s from the very same 20 numbers rather than knowing it in advance. The `df = n - 1` argument, 19 here, is the degrees of freedom, and it is what sets the size of that allowance. The more orders you have, the smaller it gets, and the closer the multiplier gets to 1.96.

Now multiply and add.

```r
# Assemble the interval by hand, then compare it with what t.test reports
ci_by_hand <- c(x_bar - t_crit * se, x_bar + t_crit * se)
round(ci_by_hand, 2)
#> [1] 21.98 30.02

round(as.numeric(t.test(deliveries)$conf.int), 2)
#> [1] 21.98 30.02
```

The same two numbers. `t.test()` is not doing anything you did not just do yourself with `mean()`, `sd()` and `qt()`.

That matters more than it looks. Those few lines are a fixed recipe. Hand it any sample of delivery times and it returns an interval, the same way every time. So when we talk about the 95% from here on, the recipe is what we are talking about.

=== step === tryit
## Your turn: build the same interval at 99%

Suppose Mario's wants to be more careful and quote a 99% interval instead of a 95% one. Only the multiplier changes. Leaving 99% in the middle puts 0.5% in each tail, so you want the point with 99.5% of the curve below it.

`x_bar`, `se` and `n` are all still on the page. Swap 0.975 for 0.995 in `qt()`, then build the interval the same way you just did.

```r
# x_bar is 26.0, se is 1.922 and n is 20, all computed above.
# Ask qt() for the 99% multiplier, then build the interval around x_bar.
# Two lines. Press Check when you have them.
```
::check {"regex": "qt[(]\\s*0?\\.995", "gate": true, "difficulty": "beginner", "ok": "That gives a multiplier of 2.861 and an interval of 20.5 to 31.5 minutes. Asking for more confidence bought no better information about the kitchen, it only widened the net.", "no": "Only the multiplier changes. Use `qt(0.995, df = n - 1)`, then the same `x_bar` plus and minus `multiplier * se` you built a moment ago."}
::solution
```r
# Build the 99% interval by changing only the multiplier
t_crit_99 <- qt(0.995, df = n - 1)
round(t_crit_99, 3)
#> [1] 2.861

round(c(x_bar - t_crit_99 * se, x_bar + t_crit_99 * se), 2)
#> [1] 20.5 31.5
```

The 95% interval was 8.0 minutes wide and this one is 11.0 minutes wide, off the same 20 orders. More confidence always costs width, and that trade is the only thing the confidence level controls.

=== step === concept
## One hundred nights, one hundred intervals

We have a recipe now, and a kitchen whose true average delivery time is 26 minutes because we put it there. Those two together are what finally let us test the 95%.

The plan is simple. Run one night, which is 20 orders out of that kitchen. Push those 20 times through the recipe and write down the interval it hands back. Then do it 99 more times, a fresh 20 orders each night, and ask one question of every interval. Does it contain 26?

```r
# Run 100 separate nights through the recipe and count the intervals that hold 26
set.seed(4)
intervals <- replicate(100, t.test(rnorm(20, mean = 26, sd = 8.6))$conf.int)
dim(intervals)
#> [1]   2 100

caught <- intervals[1, ] <= 26 & intervals[2, ] >= 26
sum(caught)
#> [1] 94
mean(caught)
#> [1] 0.94
```

`replicate()` ran the whole night 100 times and stacked the answers into `intervals`, a table of 2 rows and 100 columns: the lower bound of each night on top, the upper bound underneath.

`caught` then asks each column whether its lower bound is at or below 26 and its upper bound at or above it. That is exactly the question "did this interval contain the true average", and R answers it 100 times over.

94 of the 100 intervals contained 26. Written as a share, 0.94.

There is the 95%, near enough. Run more nights and it settles closer still. The 95% is a hit rate.

=== step === concept
## Which intervals caught 26 minutes, and which missed

94 out of 100 is the number, but the picture is the thing worth carrying away. Let's draw all 100 intervals as vertical bars, one per night, with a horizontal line at the true average of 26 minutes. Any bar that fails to cross that line is a night the recipe got wrong.

```r
# Draw all 100 intervals against the true average, misses in red
plot(NULL, xlim = c(1, 100), ylim = range(intervals),
     xlab = "Night", ylab = "Interval, in minutes",
     main = "100 nights, 100 intervals, one true average")
segments(x0 = 1:100, y0 = intervals[1, ], y1 = intervals[2, ],
         col = ifelse(caught, "grey65", "red"), lwd = 2)
abline(h = 26, lwd = 2)
```

Six of the bars came out red. Every one of them was built by the same recipe from a perfectly ordinary sample of 20 orders, and every one of them sits entirely above or entirely below the truth.

Now look at the grey bars for a moment. They are all over the place. Some sit high, some sit low, some are wide and some are narrow, and not one of them is centred exactly on 26. The one thing they have in common is that each one covers the line.

Here is the part that decides the whole meaning of the 95%. Standing on any one night, holding a single bar, you cannot tell its colour. The red ones do not look broken. They came out of the same kitchen and the same recipe, and their 20 orders just happened to run high or low.

[KEY INSIGHT]
The 95% is the share of bars that cross the line. It belongs to the recipe, it is measured across many nights, and it is visible only in the picture of all 100 of them.

=== step === concept
## So what is the 95% a property of?

Now for the second reading, the one that sounds harmless: there is a 95% chance the true average is between 22 and 30.

Let's pull two of those hundred nights out and look at them closely.

```r
# Pull out one night whose interval caught 26 and one whose interval missed
hit  <- which(caught)[1]
miss <- which(!caught)[1]

data.frame(night    = c(hit, miss),
           lower    = round(intervals[1, c(hit, miss)], 2),
           upper    = round(intervals[2, c(hit, miss)], 2),
           holds_26 = caught[c(hit, miss)])
#>   night lower upper holds_26
#> 1     2 25.00 32.26     TRUE
#> 2     1 26.01 32.46    FALSE
```

Night 2 gave 25.00 to 32.26 minutes. The true average, 26, is in there. There is no 95% about it. That interval holds the truth, and we can see that it does.

Night 1 gave 26.01 to 32.46 minutes and missed by one hundredth of a minute. There is no 95% chance that 26 lies inside that one either. It lies outside. The interval is just wrong, and no amount of confidence attached to it changes that.

That is the trouble with saying there is a 95% chance the true average is between 22 and 30. Once the interval has been computed, the randomness is over. The truth is a fixed number, the two bounds are fixed numbers, and one of two things is true: the interval covers it, or it does not.

So where did the chance go? It was never in the interval. It was in the drawing of the sample. Before Mario's took those 20 orders, the recipe had a 95% chance of producing an interval that would cover the truth. That is a statement about the recipe, made before the sample lands. Afterwards you are holding one result, and the only thing you can honestly say about it is which recipe produced it.

[WARNING]
"95% of intervals built this way cover the truth" is right. "This interval has a 95% chance of covering the truth" is the same sentence with the probability moved onto a number that has already been decided.

=== step === quiz
## Quick check: is there a 95% chance the true average is between 22 and 30?
::prose-only the point is a distinction in wording, and the picture that carries it is the hundred intervals drawn just above

Mario's interval has been computed, printed, and put on the shop's page: 21.98 to 30.02 minutes. Which statement about it is defensible?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- There is a 95% chance the shop's true average delivery time is between 21.98 and 30.02 minutes. ::no
- 95% of the shop's deliveries take between 21.98 and 30.02 minutes. ::no
- There is a 5% chance the true average sits outside 21.98 to 30.02, so the shop is 95% safe quoting it. ::no The first three all place a probability on a question that has already been settled. The true average is a fixed number and this interval is now a fixed pair of numbers, so it covers that average or it fails to, the way night 1 failed by 0.01 of a minute. The 95% describes how often the recipe succeeds, counted before the sample is drawn.
- The recipe that produced 21.98 to 30.02 covers the true average on 95% of samples. This particular interval either covers it or it does not. ::ok Exactly. The 95% is attached to the procedure and measured over repeats, which is why we had to run a hundred nights before we could see it at all.

=== step === concept
## What makes an interval narrow?

Mario's interval is 8 minutes wide, which is not much use if you are deciding whether to order before a meeting starts. So you want it tighter. Look back at the recipe and you can see exactly what you have to work with, because only three things go into it.

1. **The number of orders.** n sits under a square root in the denominator of the standard error, so more orders narrow the interval, though only at the pace of that square root.
2. **The spread of the delivery times.** The sample standard deviation s sits on top. A kitchen that runs steadily gives a narrower interval than a chaotic one from the same number of orders.
3. **The confidence level you ask for.** That sets the multiplier, and it is the one knob that buys you nothing, because a wider interval is not a better estimate.

The first one is the one you can actually go out and buy, so let's watch it work. The shop collects 20 orders, then 80, then 320, then 1,280, and we average the interval width over 500 nights at each size so that luck does not drown the pattern.

```r
# Average interval width at four sample sizes, 500 nights at each
avg_width <- function(n_orders) {
  mean(replicate(500, {
    night <- rnorm(n_orders, mean = 26, sd = 8.6)
    2 * qt(0.975, n_orders - 1) * sd(night) / sqrt(n_orders)
  }))
}

set.seed(99)
sizes <- c(20, 80, 320, 1280)
data.frame(orders = sizes, interval_width = round(sapply(sizes, avg_width), 2))
#>   orders interval_width
#> 1     20           7.93
#> 2     80           3.82
#> 3    320           1.89
#> 4   1280           0.94
```

Read down the second column: 7.93 minutes, then 3.82, then 1.89, then 0.94. Each row multiplies the orders by four and cuts the width roughly in half. It comes out a shade better than half, because the multiplier is easing down toward 1.96 at the same time.

That is the square root doing its work, and it cuts both ways. To halve the width once more from 1,280 orders you would need 5,120 of them. Precision gets expensive fast.

=== step === concept
## Where a single delivery lands is a different question

Come back to the first reading for a moment, because it was asking a fair question with the wrong tool. Suppose you really do want to know when your pizza will arrive. That question has an answer. It is just not this interval.

The range for one future delivery has to carry two kinds of uncertainty instead of one. We are unsure where the true average sits, and on top of that, any single pizza scatters around that average by the kitchen's own spread. One extra term in the formula does the whole job.

\[ \bar{x} \;\pm\; t_{0.975,\, n-1} \times s \times \sqrt{1 + \tfrac{1}{n}} \]

The 1 under the square root is the pizza's own variation and the 1/n is our uncertainty about the average. With 20 orders that second piece is 0.05 against the first piece's 1. This range has a name of its own, the **prediction interval**, and it is the one you want when the question is about a single order rather than the long-run average.

```r
# Work out the range one single delivery falls in, beside the interval for the average
one_order <- c(x_bar - t_crit * s * sqrt(1 + 1/n),
               x_bar + t_crit * s * sqrt(1 + 1/n))
round(one_order, 1)
#> [1]  7.6 44.4

c(average_interval = round(diff(ci_by_hand), 1),
  one_order_range  = round(diff(one_order), 1))
#> average_interval  one_order_range
#>              8.0             36.9
```

7.6 to 44.4 minutes. That is the honest answer to "when will my pizza get here", and it is 36.9 minutes wide against the average's 8.0, more than four times as much.

Do not read the 7.6 too literally. The formula spreads the range evenly either side of 26.0, and real delivery times cannot run as far below the average as they can above it, so the low end comes out optimistic. The number to take from this is the width. Had Mario's put a 37 minute range on its page, nobody would have called it reassuring, which is probably why the average's interval is the one on the page.

=== step === concept
## Why more orders shrink the average's interval but not the one-order range

Put the two ranges side by side and let the number of orders grow. The same four sample sizes, 500 nights at each, and this time we record both widths.

```r
# Compare both widths as the number of orders grows
both_widths <- function(n_orders) {
  w <- replicate(500, {
    night <- rnorm(n_orders, mean = 26, sd = 8.6)
    t_n   <- qt(0.975, n_orders - 1)
    s_n   <- sd(night)
    c(2 * t_n * s_n / sqrt(n_orders), 2 * t_n * s_n * sqrt(1 + 1/n_orders))
  })
  rowMeans(w)
}

set.seed(99)
widths <- sapply(sizes, both_widths)
data.frame(orders           = sizes,
           average_interval = round(widths[1, ], 2),
           one_order_range  = round(widths[2, ], 2))
#>   orders average_interval one_order_range
#> 1     20             7.93           36.35
#> 2     80             3.82           34.38
#> 3    320             1.89           33.84
#> 4   1280             0.94           33.73
```

The middle column collapses from 7.93 minutes to 0.94. The right column goes from 36.35 to 33.73, and then more or less stops.

It stops because it has hit the kitchen. With 1,280 orders you know the average delivery time to within about a minute, and individual pizzas still vary by 8.6 minutes around it. That variation is a fact about how Mario's cooks and drives, not a fact about your data. Multiply 8.6 by the 1.96 the multiplier settles at, then double it to cover both sides, and you land on 33.7 minutes. That is the floor.

[KEY INSIGHT]
More data pins down an average. It never pins down the next single value. The average's interval shrinks toward zero, while the range for one delivery shrinks to the spread of the kitchen and stays there.

That is also the cleanest way to see why the first reading could never have worked. The two ranges answer different questions, and they do not even move the same way.

=== step === quiz
## Quick check: what would tighten the shop's interval?
::prose-only the two width tables immediately above carry the picture, and this asks the reader to use them

Mario's wants its 95% interval for the average delivery time narrower than the 8 minutes it currently runs to. Which change would do that?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Quote a 99% interval instead, since a higher confidence level is a stronger claim. ::no
- Base it on 80 orders instead of 20, which cuts the width roughly in half. ::ok Yes, and the table showed it: 7.93 minutes at 20 orders against 3.82 at 80. Four times the orders halves the width, because the orders enter through a square root.
- Nothing can, because the delivery times vary by 8.6 minutes and that spread is fixed. ::no
- Drop the slowest deliveries from the record so the times look steadier. ::no Only three things set the width: the number of orders, the spread of the times, and the confidence level. A higher level widens the interval rather than tightening it, the 8.6 minute spread puts a floor under the range for one delivery but not under the interval for the average, and dropping the slow orders does not tighten an estimate, it moves it somewhere it does not belong.

=== step === concept
## How to say it, and how to answer it in an interview

You do not need to memorise a textbook definition. One sentence covers it, and it is the sentence those hundred nights were run to earn.

"If Mario's kept taking samples of 20 orders and building an interval this way each time, 95% of those intervals would contain the shop's true average delivery time. This is one of them, and it runs from 22 to 30 minutes."

Say that and you cannot be wrong. It puts the 95% on the procedure, then reports the one result you actually hold.

When an interviewer asks what a 95% confidence interval means, they are listening for one thing: whether you put the probability on the interval or on the procedure. Answer with the procedure. Then, to finish the point, add that once the interval has been computed it either contains the true average or it does not.

Now here are the wordings people reach for instead, and what each one is really claiming.

| What people say | Why it is wrong |
|---|---|
| "95% of deliveries take 22 to 30 minutes." | Talks about individual pizzas. Only 8 of the shop's 20 orders landed in that window, and the range for one delivery runs 7.6 to 44.4 minutes. |
| "There is a 95% chance the true average is between 22 and 30." | Puts a probability on an interval that has already been computed. It covers the truth or it does not, and the 95% belongs to the recipe that made it. |
| "We are 95% sure the average is 26 minutes." | Confuses the estimate with the interval. 26.0 is a single number, and the interval exists precisely because that number is not exact. |
| "A 99% interval would be more accurate." | Confuses confidence with precision. Asking for 99% widened Mario's interval from 8.0 to 11.0 minutes on the same 20 orders and told you nothing new. |

[TIP]
Report the interval next to the estimate, never on its own. "26.0 minutes, 95% interval 22.0 to 30.0" gives someone the answer and how firm it is in one breath.

=== step === quiz
## Quick check: which claim can this interval support?
::prose-only a judgement about wording, deliberately put to the reader without a picture to lean on

Mario's is writing new copy for its website with one 95% interval to work from: 21.98 to 30.02 minutes for the average delivery time, built from 20 orders. Which line is the shop entitled to publish?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Our average delivery time came out at 26 minutes, and the method we used to estimate it lands the true figure inside a window like 22 to 30 in 95% of samples. ::ok Right, and notice how careful it is. It reports the estimate, then credits the 95% to the method rather than to this one window.
- 95% of our deliveries arrive within 30 minutes. ::no
- There is only a 5% chance our true average is worse than 30 minutes. ::no
- Order from us and your pizza will almost certainly arrive in under 30 minutes. ::no The three wrong lines fail in three different ways. Two of them promise something about individual deliveries, which the interval never spoke about, and the third puts a probability on the shop's true average after the interval was already computed. On top of that, 5% is the total left over on both sides of a two-sided interval, so it was never the chance of being worse than 30.

=== step === tryit
## Your turn: ask for 80% confidence and count the catches

If the 95% really is a hit rate, then asking for 80% confidence should give intervals that catch the truth about 80% of the time, and narrower ones at that.

Run the same 100 nights with `conf.level = 0.80` inside `t.test()`, then work out the share of intervals that contain 26. Keep `set.seed(4)` at the top so you get the same 100 nights as before.

```r
# The kitchen and the recipe stay the same. Only the confidence level changes.
# Rerun the 100 nights with conf.level = 0.80 inside t.test(),
# then work out the share of those intervals that contain 26.
# Press Check when you have it.
```
::check {"regex": "conf\\.level\\s*=\\s*0?\\.8", "gate": true, "difficulty": "intermediate", "ok": "82 of the 100 caught it, and the average width fell from 7.85 to 4.98 minutes. The level you ask for is the hit rate you get, and a narrower net misses more often.", "no": "Reuse the `replicate()` line from the hundred nights and add `conf.level = 0.80` as a second argument to `t.test()`. Then rebuild the same check, `intervals_80[1, ] <= 26 & intervals_80[2, ] >= 26`, and take its mean."}
::solution
```r
# Rerun the same 100 nights at 80% confidence and count the catches
set.seed(4)
intervals_80 <- replicate(100, t.test(rnorm(20, mean = 26, sd = 8.6),
                                      conf.level = 0.80)$conf.int)

caught_80 <- intervals_80[1, ] <= 26 & intervals_80[2, ] >= 26
mean(caught_80)
#> [1] 0.82

c(width_at_80 = round(mean(intervals_80[2, ] - intervals_80[1, ]), 2),
  width_at_95 = round(mean(intervals[2, ] - intervals[1, ]), 2))
#> width_at_80 width_at_95
#>        4.98        7.85
```

82 catches out of 100 against 94 at the 95% level, and the average interval shrank by nearly three minutes. Both of those come from the same small change: a smaller multiplier makes a narrower net, and a narrower net lets more nights slip through.

=== step === tryit
## Your turn: a new week of orders, and the shop's 30-minute promise

A fresh week has gone by and Mario's has 20 new delivery times. The shop wants to put "average delivery under 30 minutes" on its flyers and asks whether the data backs it up.

Build the 95% interval for the average of `next_week`, then see where 30 sits against it.

```r
# A fresh week of 20 delivery times from the shop, in minutes
next_week <- c(18, 19, 21, 22, 23, 23, 24, 25, 26, 26,
               27, 28, 29, 30, 31, 33, 34, 36, 38, 41)

# Build the 95% interval for the average of next_week,
# then decide what the shop may honestly claim about 30 minutes.
# Press Check when you have it.
```
::check {"regex": "t\\.test[(]\\s*next_week", "gate": true, "difficulty": "intermediate", "ok": "The interval runs 24.75 to 30.65 minutes around a mean of 27.7. Since 30 sits inside it, a true average of 30 minutes is still entirely consistent with this week of orders, so the flyer would be claiming more than the data can support.", "no": "One line does it: `t.test(next_week)$conf.int`. Then ask whether 30 falls inside the two numbers that come back."}
::solution
```r
# Build the interval for the new week and see where 30 falls
round(mean(next_week), 2)
#> [1] 27.7

round(as.numeric(t.test(next_week)$conf.int), 2)
#> [1] 24.75 30.65
```

The average came out at 27.7 minutes, comfortably under 30, and that is what makes the flyer tempting. The interval is the reason to hold off. It runs up to 30.65, so a kitchen whose true average is exactly 30 minutes would produce a week like this one with no trouble at all. Twenty orders is not enough to rule that out.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that introduces the confidence interval and states its meaning as a long-run property of the procedure.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Students and researchers were shown one interval and six false statements about it, and both groups endorsed several of them.
- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. A long treatment of the two readings we took apart here.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misinterpretations catalogued and corrected, several of them about confidence intervals.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You started with a line on a pizza shop's page and built the thing yourself twice: once by hand out of 20 delivery times, and once as a hundred nights whose truth you set. Here is what that leaves you with.

- An interval is three pieces: an estimate, a multiplier, and a standard error. You built Mario's by hand as 26.0 plus and minus 2.093 times 1.922, and landed on 21.98 to 30.02, exactly where `t.test()` lands.
- The 95% is a hit rate of the recipe. Across a hundred nights from a kitchen whose true average was 26 minutes, 94 intervals covered it and 6 did not, and none of the six looked broken from the inside.
- It is not 95% of your data. Only 8 of Mario's 20 deliveries landed inside the interval, because the interval describes the average and not the pizzas. The range for one pizza ran from 7.6 to 44.4 minutes.
- It is not a 95% chance about the interval in your hand. Night 1 came back with 26.01 to 32.46 and just missed. Once the numbers are computed, the chance has already been spent.
- Width is bought with orders, not with confidence. Four times the orders halves the width, while a higher confidence level only widens it.

So when someone asks what the shop's 22 to 30 minutes means, you have this:

"If the shop kept sampling 20 orders and building an interval this way, 95% of those intervals would contain its true average delivery time. This is one of them."

That is the whole answer, and you can put the hundred bars on a screen and show anyone why it is the right one. Nicely done.

---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not 95% of pizzas and not a 95% chance. Build intervals from a week of delivery times and count which ones catch the true average."
keywords: "confidence interval meaning, what does 95% confidence mean, confidence interval interpretation, confidence interval in R, standard error, coverage, prediction interval, t.test confidence interval"
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
catalog_blurb: "What the 95% in a confidence interval is actually promising."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

Bella's is the pizza place two streets over. At the bottom of every receipt they print a line about delivery: we are 95% confident your order takes between 22 and 30 minutes.

It reads like a promise. The trouble is that nobody at the table agrees on what it promises.

Ask around and you get two answers. One person says it means 95% of Bella's deliveries land between 22 and 30 minutes. Another says it means there is a 95% chance the true average delivery time sits somewhere in there.

Both of those are wrong.

The second one is wrong in a way that takes a few minutes to see properly, and almost everybody who uses these intervals at work has skipped straight past it.

So instead of handing you a definition to memorise, we are going to build these intervals ourselves out of one week of delivery times, then run a pizza place whose true average we already know, and count how often the intervals actually catch it.

::widget process-flow {"steps":[{"title":"Measure one week","sub":"twelve delivery times, one average, one interval"},{"title":"Rebuild that interval","sub":"once by resampling the week, once by the standard formula"},{"title":"Repeat a hundred times","sub":"count how many intervals caught the true average"}]}

Everything from here is doing those three things with numbers you can run yourself.

=== step === concept
## Twelve delivery times and the average they give you

Let's get some numbers on the table, because everything we build from here comes out of them.

I asked Bella's for last week's delivery times and they handed over twelve, in the order they came in: 39, 27, 20, 22, 25, 24, 33, 15, 29, 29, 27, 22 minutes.

[NOTE]
Those twelve numbers are invented for the example. Every number computed from them, from here to the end, is real output from R.

Press Run and look at what twelve orders give you.

```r
# Last week's twelve delivery times, and the average they give
orders <- c(39, 27, 20, 22, 25, 24, 33, 15, 29, 29, 27, 22)

c(n = length(orders), average = mean(orders), spread = round(sd(orders), 2))
#>       n average  spread 
#>   12.00   26.00    6.27 

stripchart(orders, method = "stack", pch = 19, col = "grey40",
           main = "Twelve deliveries from last week",
           xlab = "Minutes from order to doorstep")
abline(v = mean(orders), col = "red", lwd = 3)
```

Look at the two numbers that matter. The average of the twelve is 26.0 minutes, which is the red line in the plot. The `sd()` line gives 6.27, which is the standard deviation: roughly how far a single delivery falls from that average. So a typical order lands about six minutes either side of 26, and you can see that in the dots, which run from a 15 minute sprint to a 39 minute crawl.

Now the important part, and it is easy to slide past.

That 26.0 is not Bella's delivery time. It is last week's twelve orders averaged. If Bella's kept cooking and driving under the same conditions forever, all those delivery times would settle around some fixed number, and that fixed number is what we actually want to know. Call it the **true average**. Nobody has ever seen it and nobody ever will.

What we have is 26.0, an estimate of it, built out of twelve orders.

=== step === concept
## Why next week's twelve orders would land somewhere else

Here is the thing that makes an interval necessary at all.

Suppose Bella's had taken a different twelve orders last week. The kitchen is the same, the drivers are the same, the roads are the same. A couple of the far-flung addresses would not have called, one order would have gone out during a quiet patch instead of the rush, and the average would have come back at 24 or 28 rather than 26.

The average you get depends on which orders happen to walk in the door. So before we can say anything at all about the true average, we have to find out how much this one number of ours moves around.

The honest way to measure that would be to run next week, and the week after, and forty weeks more, then look at the spread of the forty averages. We do not have forty weeks. We have twelve numbers.

So here is the trick that gets us out of it. Write each of the twelve delivery times on a slip of paper, drop the slips in a bowl, pull one out, write it down, and put it back in the bowl. Do that twelve times and you have a brand new week of twelve orders, built entirely out of the week you already had.

Putting each slip back is the part that makes it work. Some delivery times get pulled twice, some never get pulled at all, and that jostling is exactly the kind of thing that makes one real week differ from the next.

Press Draw again a few times and watch which of the twelve get left out.

::widget bootstrap-sample {"n": 12, "seed": 7, "tail": "Those delivery times stayed in the bowl and never made it into this draw."}

The grey ones marked OOB are the slips that stayed in the bowl. OOB is short for out of bag, which is the standard name for them. Roughly a third of the twelve miss out on any given draw, and it is a different third every time.

R does the same thing in one line, with `replace = TRUE` doing the putting back.

```r
# Draw twelve slips with replacement and see where the new average lands
set.seed(4)
one_redraw <- sample(orders, size = 12, replace = TRUE)
one_redraw
#>  [1] 15 27 20 20 33 22 20 24 25 29 20 15

mean(one_redraw)
#> [1] 22.5
```

Look at what came out. The 20 minute delivery turned up four times, the 15 turned up twice, and the 39 minute crawl, last week's slowest order of the lot, never came out of the bowl at all. This resampled week averages 22.5 minutes against the 26.0 we started with.

Nothing about Bella's changed. Only the twelve slips did, and the average moved three and a half minutes.

`set.seed(4)` just fixes which draw you get, so your numbers match mine.

=== step === concept
## How far the average wanders: the standard error

One redraw told us the average can slide from 26.0 down to 22.5. Two thousand redraws will tell us how far it usually slides.

The function `replicate()` runs the same lines over and over and keeps the answer from each run. Here it draws a fresh set of twelve slips, takes their average, stores it, and does that two thousand times.

```r
# Two thousand resampled weeks, and the pile of averages they produce
set.seed(7)
boot_means <- replicate(2000, mean(sample(orders, size = 12, replace = TRUE)))

hist(boot_means, breaks = 30, col = "grey85", border = "white",
     main = "Averages from 2,000 resampled weeks",
     xlab = "Average delivery time (minutes)")
abline(v = mean(orders), col = "red", lwd = 3)

round(sd(boot_means), 2)
#> [1] 1.7
```

Let's read that plot carefully, because this pile is what an interval is made of.

Every bar is a batch of resampled weeks, and its height says how many of the two thousand came out at that average. The red line is last week's own 26.0, sitting in the middle where it should be. The pile runs from about 21 to about 32, so an average built from twelve orders carries a couple of minutes of slack either way.

That spread has a name. The standard deviation of an estimate, measured across the samples it could have come from, is called the **standard error**. Here the standard error of the average delivery time is 1.70 minutes.

Now the good news. You do not have to resample two thousand times to get that number. There is a formula for it, and it needs only two things you already have.

\[ \text{standard error} = \frac{s}{\sqrt{n}} \]

In that formula, s is the standard deviation of your delivery times, which was 6.27 minutes, and n is how many orders you measured, which was 12. Nothing else goes in. Let's put the formula next to what the resampling gave.

```r
# The resampled spread against the standard error formula
c(resampled_spread       = round(sd(boot_means), 2),
  formula_standard_error = round(sd(orders) / sqrt(12), 2))
#>       resampled_spread formula_standard_error 
#>                   1.70                   1.81 
```

Two thousand redraws gave 1.70 minutes and one line of arithmetic gave 1.81. Those are two completely different routes to the same quantity, and they agree to within a tenth of a minute.

Read the formula once more, because those two symbols are the only things that ever make an interval wide or narrow. Dividing by the square root of n means the wobble shrinks as you measure more orders. Multiplying by s means it grows when the deliveries themselves are more erratic.

[KEY INSIGHT]
The standard error is not how much delivery times vary. It is how much the AVERAGE of twelve delivery times varies from one week of orders to the next. Bella's single deliveries scatter by about 6.27 minutes. Their twelve-order average only moves by about 1.8.

=== step === quiz
## Quick check: what the standard error measures

The two thousand resampled weeks gave a spread of 1.70 minutes. What is that 1.70 measuring?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- How far a single Bella's delivery usually falls from 26 minutes. ::no
- How much the average of twelve orders moves from one week of orders to the next. ::ok That is it. The delivery times themselves scatter by 6.27 minutes, but averaging twelve of them smooths most of that away and leaves about 1.70.
- How wrong the 26.0 minute average is, so the true average must be 26.0 give or take 1.70. ::no
- How much the delivery times would spread out if Bella's hired more drivers. ::no The 1.70 is about the AVERAGE, not about single pizzas and not about how wrong you are. Single deliveries scatter by 6.27 minutes. Divide that by the square root of twelve and you get how far a twelve-order average drifts from week to week, which is all the standard error has ever measured.

=== step === concept
## Cutting the middle 95% out of the pile of averages

We have two thousand averages sitting in `boot_means` and we know roughly how wide the pile is. That is enough to carve an interval straight out of it, with no formula anywhere.

Sort the two thousand averages from smallest to largest. Walk in from the bottom until you have passed 2.5% of them, which is fifty averages, and put a mark there. Walk in from the top by the same amount and put a second mark. Between those two marks sits the middle 95% of everything the average could have been.

The function `quantile()` finds the marks for you. Hand it 0.025 and 0.975 and it returns the values that 2.5% and 97.5% of the averages fall below.

```r
# Cut off the lowest and the highest 2.5% of the 2,000 resampled averages
middle_95 <- quantile(boot_means, probs = c(0.025, 0.975))
round(middle_95, 2)
#>  2.5% 97.5% 
#> 22.75 29.50 

hist(boot_means, breaks = 30, col = "grey85", border = "white",
     main = "The middle 95% of the resampled averages",
     xlab = "Average delivery time (minutes)")
abline(v = middle_95, col = "blue", lwd = 3, lty = 2)
```

22.75 to 29.50 minutes. The two blue dashed lines in the plot are those cuts, and everything between them is the middle 95% of the pile.

That is a 95% confidence interval for Bella's true average delivery time, and notice what did not go into it. No formula, no table in the back of a textbook, no assumption about the shape of anything. All it took was two thousand redraws of the week we had and a pair of scissors 2.5% in from each end.

It already sits close to the 22 to 30 printed on the receipt. The receipt gets there another way, and that way is worth seeing, because it is the one you will actually use at work.

=== step === concept
## Where the 22 to 30 on the receipt comes from

Every confidence interval you will ever build for an average has the same three pieces:

1. the estimate you got, which here is the 26.0 minute average;
2. the standard error, which is how much that estimate wobbles, 1.81 minutes;
3. a multiplier, which says how many standard errors to reach out on each side.

Written down, the three pieces look like this.

\[ \bar{x} \pm t \times \frac{s}{\sqrt{n}} \]

Reading it left to right: start at your average, then step out a certain number of standard errors in each direction. The x with the bar over it is the average of your twelve orders, s over the square root of n is the standard error, and the t out front is the multiplier we still have to pin down.

So how many standard errors do you step out for 95%?

Most people remember 1.96. That number is correct when you already know the true spread of Bella's deliveries. You do not. You estimated the spread from the very same twelve orders you used for the average, and that estimate can be off, so the interval has to be a little more generous to cover for it.

The generous version of 1.96 is called the **t multiplier**, and it depends on how many orders you measured. The function `qt()` gives it to you. The 0.975 leaves 2.5% in each tail, and `df = 11` is twelve orders minus one.

```r
# Build the receipt's interval by hand: average plus and minus t standard errors
se         <- sd(orders) / sqrt(12)
t_mult     <- qt(0.975, df = 11)
half_width <- t_mult * se

c(average = mean(orders), t_multiplier = round(t_mult, 3),
  standard_error = round(se, 3), half_width = round(half_width, 2))
#>        average   t_multiplier standard_error     half_width 
#>         26.000          2.201          1.809          3.980 

round(c(mean(orders) - half_width, mean(orders) + half_width), 2)
#> [1] 22.02 29.98
```

2.201, not 1.96. With only twelve orders in hand, that extra 0.24 is the price of not knowing the true spread. Multiply it by the standard error of 1.809 and you reach out 3.98 minutes on each side of 26.0, which lands you on 22.02 and 29.98.

That is the receipt. Bella's rounded it to 22 and 30 and printed it.

You will rarely do those four lines by hand, because `t.test()` does the whole thing and hands you the pair.

```r
# The same interval straight from the built-in one-liner
week_ci <- t.test(orders)$conf.int
round(week_ci, 2)
#> [1] 22.02 29.98
#> attr(,"conf.level")
#> [1] 0.95
```

`t.test()` runs a whole test and `$conf.int` pulls the interval out of the result. R tags the pair with the confidence level it used, 95% unless you say otherwise, and prints that as the `attr` line underneath.

Now put the two intervals side by side. Resampling gave 22.75 to 29.50. The formula gave 22.02 to 29.98, a shade wider at both ends. Neither one is the right answer with the other as an approximation. They are two ways of measuring the same wobble, and on twelve numbers they land within a minute of each other.

=== step === tryit
## Your turn: build the interval for a quieter week

Bella's sends over another twelve delivery times, from a week when the roads were kinder. The number of orders is the same and the scatter is far smaller.

Build the 95% interval for that week. Three moves: the average, the standard error, then the average plus and minus 2.201 standard errors. Or take the shortcut and let `t.test()` do all three. Either one counts.

```r
# quiet_week holds twelve delivery times from a calmer week, in minutes.
# Build a 95% confidence interval for the average of these twelve orders,
# either by hand (average, standard error, plus and minus 2.201 standard
# errors) or with the one-line built-in.
# Press Check when you have it.
quiet_week <- c(24, 26, 22, 27, 25, 23, 28, 24, 26, 25, 23, 27)
```
::check {"regex": "t\\.test\\s*[(]\\s*quiet_week|sd\\s*[(]\\s*quiet_week\\s*[)]\\s*/\\s*sqrt", "gate": true, "difficulty": "beginner", "ok": "Yes: 23.82 to 26.18 minutes. That is less than a third of the width the first week gave, and the only thing that changed is how much the deliveries scattered.", "no": "Two ways in. The short one is `t.test(quiet_week)$conf.int`. The long one is `mean(quiet_week)` plus and minus `qt(0.975, df = 11) * sd(quiet_week) / sqrt(12)`."}
::solution
```r
# The quieter week, worked both ways
round(mean(quiet_week) + c(-1, 1) * qt(0.975, df = 11) * sd(quiet_week) / sqrt(12), 2)
#> [1] 23.82 26.18

round(t.test(quiet_week)$conf.int, 2)
#> [1] 23.82 26.18
#> attr(,"conf.level")
#> [1] 0.95
```

23.82 to 26.18, a window just under two and a half minutes wide. The first week's twelve gave nearly eight. The number of orders is twelve in both cases, so that is not what changed. What changed is s, the scatter of the deliveries, and it walked straight through the standard error into the width.

=== step === concept
## One hundred weeks, one hundred intervals

Here is the problem with everything we have built so far. We have two intervals and no way of telling whether either of them is right, because nobody knows Bella's true average delivery time.

So let's build a pizza place where we do know it.

`rnorm(12, mean = 26, sd = 6.3)` invents twelve delivery times from a kitchen whose true average is exactly 26 minutes and whose orders scatter by 6.3 minutes, which is roughly what last week's twelve looked like. We know the answer is 26 because we typed it in ourselves.

Those two numbers were picked to look like Bella's week so the figures stay familiar. That is not a claim that Bella's true average is 26. Theirs is still unknown and always will be. The 26 is true only inside this simulated kitchen, and that is exactly why it is useful, because it hands us an answer to check the intervals against.

Now run that kitchen for a hundred weeks. Each week gives twelve orders, each set of twelve gives one interval, and then we ask the only question that matters: how many of those hundred intervals have 26 inside them?

```r
# A hundred simulated weeks at a true average of 26, one interval from each
set.seed(3)
true_avg <- 26

weeks  <- replicate(100, t.test(rnorm(12, mean = true_avg, sd = 6.3))$conf.int)
caught <- weeks[1, ] <= true_avg & weeks[2, ] >= true_avg

sum(caught)
#> [1] 92
```

Ninety-two of the hundred contained the truth. Let's draw all hundred of them so you can see which ones did not.

```r
# Draw all hundred intervals against the true average of 26
plot(NULL, xlim = range(weeks), ylim = c(0, 101),
     xlab = "Interval for the average delivery time (minutes)",
     ylab = "Simulated week",
     main = "100 weeks at a true average of 26 minutes")
segments(weeks[1, ], 1:100, weeks[2, ], 1:100,
         col = ifelse(caught, "grey70", "red"), lwd = 2)
abline(v = true_avg, col = "black", lwd = 3)
```

Every horizontal line is one week's interval. The thick black line running down the middle is 26, the truth. Grey lines cross it, so those weeks caught the true average. Red lines sit entirely to one side of it, so those weeks missed, and there are eight of them.

Stay on the red ones for a moment, because they are the whole point.

Nothing went wrong in those weeks. They came out of the same recipe, the same t multiplier and the same arithmetic as all the others, and every one of them is correctly computed. They simply happened to draw a batch of unusually quick or unusually slow deliveries, and the window they built landed off to one side of the truth.

A hundred weeks is a short run. Push it to five thousand and the catch rate settles down.

```r
# The same recipe over 5,000 weeks, reported as a catch rate
catch_rate <- function(n_weeks, level = 0.95) {
  caught <- replicate(n_weeks, {
    week <- rnorm(12, mean = 26, sd = 6.3)
    ci   <- t.test(week, conf.level = level)$conf.int
    ci[1] <= 26 && ci[2] >= 26
  })
  mean(caught)
}

set.seed(3)
catch_rate(5000)
#> [1] 0.9502
```

0.9502. Ninety-five intervals in every hundred contained the true average delivery time, and five did not.

That number is the 95%.

=== step === concept
## Your interval either has the 26 in it or it does not
::prose-only the hundred drawn intervals are the evidence and they are already on the page; the idea here is about where the probability lives, which has no picture of its own

Now take that back to the receipt, which said 22 to 30.

Bella's true average delivery time is a fixed number. It does not move about. Either it is somewhere between 22 and 30 or it is not, and which of those two happened was settled the moment those twelve orders came in. There is no 95% left in it.

So where did the 95% go?

It went into the recipe. Look again at what we actually counted: not how often the truth wandered into an interval, but how often intervals built this way landed on top of the truth. Ninety-two times in a hundred the recipe worked. Eight times it handed back a perfectly reasonable-looking window that was simply wrong, and it never once told you which kind of week you were having.

That is the entire promise, and it is a promise about the method rather than about your two numbers:

About 95 out of every 100 intervals built by this recipe contain the true value.

Bella's cannot say more than that, and neither can you. Your one interval is a single draw from that hundred. It might be a grey line. It might be a red one. The 95% is the hit rate of the machine that produced it, and by the time the machine has printed your two numbers the odds are already spent.

[KEY INSIGHT]
The 95% belongs to the procedure, not to your interval. Before you collect the orders there is a 95% chance the interval you are about to build will catch the truth. After you have built it, the interval either contains the truth or it does not, and nothing in the two printed numbers tells you which.

=== step === quiz
## Quick check: is there a 95% chance the true average sits in your interval?

Bella's printed 22 to 30 minutes on your receipt at 95% confidence. Is there a 95% chance their true average delivery time is inside that window?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes. The interval was built to have a 95% chance of containing it, so 22 to 30 holds the true average with probability 0.95. ::no
- No. The true average is a fixed number that is either inside 22 to 30 or outside it. The 95% is the share of intervals built this way that catch the truth. ::ok Exactly. The chance lived in the procedure, before the orders came in. Once the two numbers are printed the answer is already yes or no, and you cannot tell which.
- No, because the true average changes from week to week, so no window could ever pin it down. ::no
- Yes, as long as the twelve orders were a fair sample of Bella's deliveries. ::no The 95% never attaches to your one interval. Bella's true average is a fixed number and your printed window either contains it or it does not, with no chance remaining in it. What the 95% counts is the recipe: build intervals this way over and over and about 95 in every 100 will land on the truth, exactly as 92 of the hundred simulated weeks did.

=== step === concept
## Do 95% of pizzas arrive between 22 and 30 minutes?

That is one of the two readings dealt with. Here is the other one, and it is the reading people actually act on.

If Bella's prints 22 to 30 on your receipt, is your pizza turning up in that window?

We can answer that with the twelve orders already in front of us. Count how many of last week's deliveries actually landed outside 22 to 30.

```r
# How many of last week's twelve deliveries fell outside the 22 to 30 window
sum(orders < 22 | orders > 30)
#> [1] 4

orders[orders < 22 | orders > 30]
#> [1] 39 20 33 15
```

Four of the twelve missed the window, and Bella's is not running a broken kitchen. A third of last week's orders fell outside the very range printed on their own receipts, because that range was never about single pizzas.

Let's push it further than twelve orders. Simulate five thousand individual deliveries from the same kitchen, the one whose true average is 26 minutes and whose orders scatter by 6.3, and see what share of them lands between 22 and 30.

```r
# Five thousand single deliveries, and the share landing inside 22 to 30
set.seed(3)
all_orders <- rnorm(5000, mean = 26, sd = 6.3)

mean(all_orders >= 22 & all_orders <= 30)
#> [1] 0.4682

hist(all_orders, breaks = 40, col = "grey85", border = "white",
     main = "5,000 single deliveries from the same kitchen",
     xlab = "Minutes from order to doorstep")
abline(v = c(22, 30), col = "blue", lwd = 3, lty = 2)
```

About 47 in every hundred. Not 95.

The two dashed lines sit well inside the pile, and deliveries spill out on both sides, down below ten minutes and up past forty-five. That is exactly what you would expect. Single deliveries scatter by 6.3 minutes while the average of twelve only wobbles by 1.8, and the interval was built out of the small number.

Now suppose you did want a window that holds a single pizza 95% of the time. It has the same shape as before with one change: the scatter of the deliveries goes in whole, rather than divided by the square root of twelve.

```r
# A window built to hold one single delivery, not the average
one_order <- mean(orders) + c(-1, 1) * qt(0.975, df = 11) * sd(orders) * sqrt(1 + 1/12)
round(one_order, 1)
#> [1] 11.6 40.4
```

11.6 to 40.4 minutes. That is the honest answer to when will my pizza get here, and it is nearly five times as wide as the one on the receipt. It has a name of its own, the **prediction interval**, and the extra `sqrt(1 + 1/12)` is in there because a single delivery has to carry its own scatter on top of our uncertainty about where the centre is.

[KEY INSIGHT]
A confidence interval is a window for the average, not for the next pizza. Bella's 22 to 30 says where their true average delivery time probably sits. It says nothing at all about whether your order shows up at 18 minutes or at 38.

=== step === quiz
## Quick check: the range you give a customer on the phone

A customer rings ten minutes after ordering and asks when the pizza will get there. You have three numbers in front of you: 26 minutes, the 22 to 30 from the receipt, and 11.6 to 40.4. Which one answers what they asked?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 22 to 30 minutes, because that is the window Bella's prints and it was built at 95% confidence. ::no
- About 26 minutes, because that is the average and an average is what people want to hear. ::no
- Somewhere between about 12 and 40 minutes, because that is the window built to hold one single delivery. ::ok Right. The caller is asking about one pizza, so the answer has to come from the window built for one pizza. It is uncomfortably wide, and that width is the truth about Bella's deliveries rather than a flaw in the arithmetic.
- None of them, because a confidence interval can never say anything about a single order. ::no The caller asked about one pizza, so the answer has to come from the window built for one pizza, which runs from 11.6 to 40.4 minutes. The 22 to 30 is a window for the true average and only about 47 in every hundred deliveries land inside it. Quoting 26 flat is worse still, since it hides all the scatter and roughly half of all orders will be slower than that.

=== step === concept
## Four times the orders, half the width

Bella's would love to print a tighter promise on the receipt. There are exactly two ways to get one, and this is the first.

Go back to the standard error. It divides by the square root of n, so to halve the wobble you need four times the orders. Twelve becomes forty-eight.

Let's build a forty-eight order week from the same simulated kitchen and put its half width next to last week's.

```r
# A 48-order week from the same kitchen, and how much narrower its interval is
set.seed(21)
big_week <- rnorm(48, mean = 26, sd = 6.3)

half_12 <- qt(0.975, df = 11) * sd(orders)   / sqrt(12)
half_48 <- qt(0.975, df = 47) * sd(big_week) / sqrt(48)

c(orders_12 = round(half_12, 2), orders_48 = round(half_48, 2))
#> orders_12 orders_48 
#>      3.98      1.97 
```

3.98 minutes each side comes down to 1.97. Four times the orders bought almost exactly half the width, which is what the square root promised. It will not come out at exactly half every time, since each new week brings its own scatter, but the square root is what drives it.

Now turn that around, because turned around is where the money goes. To halve the width again, from 1.97 down to about 1, Bella's needs 192 orders. To halve it once more, 768. Precision never gets cheaper as you go, it only gets more expensive, and there is no clever way around it, because the square root is baked into the standard error itself.

[TIP]
When somebody asks how much data they need, this is the sentence to reach for. Doubling your precision costs four times the data, and quadrupling it costs sixteen times.

=== step === concept
## Asking for 99% confidence costs you a wider interval

The second way to change the width does not need a single extra order. It changes what you are asking for.

Ninety-five is a convention, not a law. `t.test()` takes a `conf.level` argument and will hand you any level you like. Here are three of them, run on the very same twelve delivery times. The loop below calls `t.test()` once for each level in the list and prints the pair it gets back.

```r
# The same twelve orders at three different confidence levels
for (level in c(0.80, 0.95, 0.99)) {
  ci <- t.test(orders, conf.level = level)$conf.int
  cat(level * 100, "% :", round(ci[1], 1), "to", round(ci[2], 1), "minutes\n")
}
#> 80 % : 23.5 to 28.5 minutes
#> 95 % : 22 to 30 minutes
#> 99 % : 20.4 to 31.6 minutes
```

Ask for more confidence and the interval reaches further out. Ask for less and it pulls in tight. It is the same twelve orders and the same kitchen, and you get three different windows.

So what did that 80% actually buy? It bought a catch rate, and we can go and count it. Run the simulated kitchen again, the one whose true average we set to 26, but build every interval at 80% instead of 95%.

```r
# The catch rate when every interval is built at 80% instead of 95%
set.seed(3)
catch_rate(5000, level = 0.80)
#> [1] 0.799
```

0.799. Ask for 80% and 80% is what you get: about eighty intervals in every hundred land on the truth and about twenty miss it.

So the level is a dial with a price on both ends. Turn it up and your intervals get wider and catch the truth more often. Turn it down and they get tight and flattering and wrong one time in five. Ninety-five is simply where most fields settled, for no deeper reason than that somebody started there and everybody kept it.

=== step === concept
## When the 95% quietly stops being 95%

Everything so far assumed two things about Bella's twelve orders, and both of them are easy to break.

The first assumption is that the orders are independent, meaning one delivery running late tells you nothing about the next one. Break that and the interval goes badly wrong. A snowstorm makes every order late together, so twelve orders during a storm carry nowhere near twelve orders' worth of information, and the window built from them is far too narrow for what it claims.

The second assumption is that the delivery times are not too lopsided. That t multiplier of 2.201 is exactly right when the times sit roughly symmetrically around their centre. Real delivery times often do not sit that way. Most orders come back in the twenties while a few stragglers run to fifty or sixty, which drags a long tail out to the right.

Let's find out what that tail costs us. The function `rlnorm()` draws times with exactly that shape, a solid clump in the twenties and a thin tail of very late orders, and its true average works out at 28.73 minutes.

That 28.73 is worth a second look. The middle order of the week comes in at 24 minutes, and the thin tail of very late ones drags the average nearly five minutes above it. The line `24 * exp(0.6^2 / 2)` is the known arithmetic for that gap on this particular shape, so we are not guessing at the truth we are about to check against.

We run the same recipe over five thousand weeks of twelve orders and count the catches the same way as before.

```r
# Five thousand lopsided weeks, and how often the same recipe still catches the truth
set.seed(3)
true_skew_avg <- 24 * exp(0.6^2 / 2)

skew_caught <- replicate(5000, {
  week <- rlnorm(12, meanlog = log(24), sdlog = 0.6)
  ci   <- t.test(week)$conf.int
  ci[1] <= true_skew_avg && ci[2] >= true_skew_avg
})

c(true_average = round(true_skew_avg, 2), catch_rate = mean(skew_caught))
#> true_average   catch_rate 
#>       28.730        0.913 
```

0.913, not 0.95. Nearly nine intervals in every hundred miss the truth where the label says five should.

And here is the uncomfortable part. Nothing in the printed interval tells you any of this is happening. It looks exactly like the honest one: two numbers, a 95% sitting next to them. The label is a claim about the recipe, and when your data breaks what the recipe assumed, the label just carries on being printed.

[WARNING]
The 95% is only as good as the two assumptions underneath it: orders that arrive independently, and delivery times without a heavy tail. Break either one and the interval keeps its label while catching the truth less often than it says.

=== step === concept
## What to say when someone asks about the 22 to 30

You do not need to memorise a definition. You need one sentence you can say out loud in a meeting without being wrong, and here it is with Bella's numbers already in it:

"If we ran this week over and over, about 95 out of every 100 intervals built this way would contain Bella's true average delivery time. This is one of them, and it runs from 22 to 30 minutes."

Notice how that is put together. It starts with the recipe, then reports how often the recipe works, and only then points at your two numbers. It never puts a probability on the truth, and it never says anything about a single pizza.

Here are the three readings that go wrong, and what each one is confusing.

| What people say | What it confuses |
|---|---|
| "There is a 95% chance the true average is between 22 and 30." | Puts the probability on the truth. Bella's true average is a fixed number that is either in there or not. The 95% belongs to the recipe. |
| "95% of deliveries arrive between 22 and 30 minutes." | Confuses a window for the average with a window for one order. Only about 47 in every hundred deliveries land inside it, and the window for one order runs from 11.6 to 40.4. |
| "Run another week and its average will land inside 22 to 30 about 95% of the time." | Turns a statement about the true average into a forecast about next week's average. Those are different quantities, and next week's average carries a fresh wobble of its own on top. |

=== step === quiz
## Quick check: which reading of 22 to 30 is right?

Bella's receipt says 22 to 30 minutes at 95% confidence. Which of these sentences reads it correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 95% chance Bella's true average delivery time is between 22 and 30 minutes. ::no
- About 95% of Bella's deliveries arrive between 22 and 30 minutes. ::no
- If Bella's rebuilt this interval week after week, about 95 in every 100 would contain their true average delivery time. ::ok That is the one. It talks about the recipe and how often the recipe works, which is the only thing the 95% has ever counted.
- Bella's true average is 26 minutes, give or take about 4 minutes on any given order. ::no Only one of these talks about the recipe rather than about the truth or about a single pizza. The 95% counts how often intervals built this way catch the true average, which is what the hundred simulated weeks showed: 92 caught it and 8 missed. Your printed window either contains the truth or it does not, and only about 47 in every hundred deliveries land inside 22 to 30.

=== step === tryit
## Your turn: build an interval from a bigger week and judge it

`big_week` still holds the forty-eight delivery times from the simulated kitchen, the one whose true average we set to 26 minutes.

Build the 95% interval for its average. Then look at the two bounds and answer two questions for yourself: does 26 fall inside, and how does the width compare with the 22.02 to 29.98 that twelve orders gave?

```r
# big_week holds 48 delivery times from the kitchen whose true average is 26.
# Build the 95% confidence interval for the average of those 48 orders,
# then check whether 26 falls inside it.
# Press Check when you have it.
```
::check {"regex": "t\\.test\\s*[(]\\s*big_week|sd\\s*[(]\\s*big_week\\s*[)]\\s*/\\s*sqrt", "gate": true, "difficulty": "intermediate", "ok": "24.97 to 28.90 minutes. It catches 26, and it is 3.93 minutes wide against 7.96 for the twelve-order week, so four times the orders roughly halved it. Notice it is not centred on 26 either: these forty-eight orders averaged 26.93.", "no": "One line does it: `t.test(big_week)$conf.int`. By hand it is `mean(big_week)` plus and minus `qt(0.975, df = 47) * sd(big_week) / sqrt(48)`."}
::solution
```r
# The 48-order interval, and whether it catches the true average of 26
big_ci <- t.test(big_week)$conf.int
round(big_ci, 2)
#> [1] 24.97 28.90
#> attr(,"conf.level")
#> [1] 0.95

big_ci[1] <= 26 & big_ci[2] >= 26
#> [1] TRUE
```

Four times the orders took the window from just under eight minutes wide down to just under four, and this one caught the truth. That is the outcome you get about ninety-five weeks in a hundred.

=== step === quiz
## Quick check: when does the promise break?

Which of these makes an interval catch the truth less often than its own label claims?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Dropping the confidence level from 95% to 80%, because the intervals come out narrower. ::no
- Building the interval from delivery times with a long tail of very late orders. ::ok Yes. Five thousand lopsided weeks caught the truth 91.3% of the time while every one of those intervals carried on printing 95%, and nothing in the two numbers warned anybody.
- Measuring 48 orders instead of 12, because the interval comes out narrower. ::no
- Using a t multiplier of 2.201 instead of 1.96, because it makes the interval wider than it needs to be. ::no The confidence level and the number of orders both change the WIDTH while keeping the label honest: ask for 80% and you catch the truth about 80% of the time, and forty-eight orders give a narrower window that still catches at 95%. The multiplier of 2.201 is one of the things keeping the label honest on twelve orders. What actually breaks the promise is data the recipe was never built for.

=== step === concept
## References

- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defines a confidence interval by its long-run catch rate, which is the count you ran on the hundred weeks.
- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23(1), 103-123. Takes apart the "95% chance the truth is in here" reading in detail.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21(5), 1157-1164. Students and working researchers were handed six statements about one interval, and both groups failed them at similar rates.
- [Inference by eye: confidence intervals and how to read pictures of data](https://doi.org/10.1037/0003-066X.60.2.170) - Cumming and Finch (2005), American Psychologist 60(2), 170-180. How to read intervals off a plot without drawing the wrong conclusion.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built confidence intervals two different ways, then ran a kitchen whose true average you already knew and counted the catches. What to hold on to:

- A confidence interval is your estimate plus and minus a multiplier times the standard error. Bella's was 26.0 plus and minus 3.98, so 22.02 to 29.98 minutes.
- The standard error is how much your estimate wobbles, not how much the data scatters. Two thousand resampled weeks put it at 1.70 minutes and the formula put it at 1.81, while the deliveries themselves scattered by 6.27.
- The 95% is the catch rate of the recipe, not a probability about your interval. A hundred simulated weeks gave 92 catches and 8 misses, and 5,000 weeks settled at 0.9502.
- It is not a window for one pizza. Four of last week's twelve orders fell outside 22 to 30, and across 5,000 deliveries only about 47 in a hundred landed inside. The window for one order runs from 11.6 to 40.4 minutes.
- You buy width with orders and with the confidence level. Four times the orders halved it, from 3.98 down to 1.97. Asking for 99% instead of 95% pushed 22.0 to 30.0 out to 20.4 to 31.6.
- The promise holds only while the orders arrive independently and the times are not too lopsided. Five thousand lopsided weeks caught the truth 91.3% of the time and never stopped printing 95%.

So the next time somebody reads out a confidence interval and asks what the 95% means, here is your sentence:

"If we ran this week over and over, about 95 out of every 100 intervals built this way would contain the true average. This is one of them."

Say that in an interview and you are already ahead of most of the room. How many orders you have to collect before a difference worth caring about will actually show up is a topic for another day. Have a good one.

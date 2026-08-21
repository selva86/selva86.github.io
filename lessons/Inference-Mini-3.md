---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
description: "A 95% confidence interval is not where 95% of pizzas land, and it is not a 95% chance. Build one from twelve delivery times and watch what the 95 counts."
keywords: "confidence intervals, what confidence intervals mean, 95% confidence interval, confidence interval interpretation, confidence interval in R, margin of error, standard error, coverage"
mathjax: true
webr: true
date: "2026-08-21"
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
catalog_blurb: "What the 95% in a confidence interval is actually counting."
---

=== step === cover
::eyebrow Inference from Zero
## Confidence intervals: what they really mean

Let's say you order dinner from Napoli Pizza down the road. There is a flyer taped to their counter and it says this: we are 95% confident the average delivery takes between 22 and 30 minutes.

It reads like a precise promise. So what is that 95% actually promising you?

Ask around and you will hear one of two answers. The first is that 95% of pizzas arrive somewhere between 22 and 30 minutes. The second is that there is a 95% chance the shop's true average delivery time sits inside that window.

Neither one is right.

And that is not a beginner's slip. People who quote confidence intervals every week read them in exactly those two ways, mostly because nobody ever told them what the 95 is counting.

So we are not going to memorise a definition. Instead, we are going to build the pizza shop ourselves in R, which means we get to know its true average delivery time. Then we time twelve deliveries, build the interval out of them, and run that same night over and over until the 95 shows up on its own.

There are only three moves involved.

::widget process-flow {"steps":[{"title":"Time one Friday","sub":"twelve deliveries, one average, one interval"},{"title":"Run the Friday 100 times","sub":"a fresh dozen deliveries and a fresh interval each time"},{"title":"Count the catches","sub":"how many of the 100 intervals hold the true average"}]}

That is the whole idea. Everything from here is doing it, and then finding out what the number does and does not say.

=== step === concept
## The twelve deliveries behind the pizza shop's claim

Napoli Pizza did not pick 22 to 30 minutes out of a rulebook. Somebody there timed a handful of deliveries and worked the numbers out from them, and that handful is where everything starts.

Now, in real life you never get to know a shop's true average delivery time. If you knew it you would simply print it. So we are going to cheat a little, in a way that makes the whole thing visible: we build the shop ourselves and we set the truth by hand.

The shop we are building has a true average of 26 minutes, and deliveries wobble around it by about 6 minutes either way.

Press Run to time a Friday night.

```r
# Build the pizza shop and time twelve deliveries on one Friday night
set.seed(1381)
friday <- round(rnorm(12, mean = 26, sd = 6))

friday
#>  [1] 29 21 25 18 20 39 32 21 33 23 30 24

mean(friday)
#> [1] 26.25
```

`rnorm(12, mean = 26, sd = 6)` draws twelve delivery times from that shop. The `mean = 26` is the truth we built in, and `sd = 6` says a typical delivery lands about 6 minutes off it, sometimes over, sometimes under.

`round()` is there because the shop's tablet records whole minutes, and `set.seed(1381)` fixes which twelve deliveries you get so your numbers match mine.

Look at what came back. Twelve deliveries got timed, running from 18 minutes up to 39 minutes, and their average works out at 26.25 minutes.

[NOTE]
Hold on to the two numbers we just invented, 26 and 6, because they are the truth about this shop and nothing the twelve deliveries say can change them. Every claim we make from here gets marked against that 26.

=== step === concept
## Time twelve more deliveries and the average moves

Friday's twelve deliveries averaged 26.25 minutes, which sits close to the true 26. It is tempting to stop there and call 26.25 the shop's average.

Before we do that, here is a question worth asking. If the shop times twelve more deliveries next Friday, does the same 26.25 come back?

Let's find out. The code below runs another Friday at the very same shop, with the same true average of 26 minutes and the same spread of 6, and puts the two nightly averages side by side.

```r
# Time twelve more deliveries at the same shop and compare the two averages
set.seed(8)
next_friday <- round(rnorm(12, mean = 26, sd = 6))

next_friday
#>  [1] 25 31 23 23 30 25 25 19  8 22 21 28

c(first_night = mean(friday), second_night = mean(next_friday))
#>  first_night second_night
#>     26.25000     23.33333
```

Nothing about the shop changed between those two nights. It is the same kitchen, the same drivers and the same true 26 minutes sitting underneath. The only thing that differs is which twelve deliveries happened to get timed.

And the average moved almost three minutes, from 26.25 down to 23.33.

That is the problem a confidence interval exists to solve. One night's average is not the shop's average, it is one wobbly reading of it, and a single number printed on a flyer hides how much wobble there was.

=== step === concept
## How far the nightly average drifts from 26 minutes

Two nights told us the average moves. What we need now is the size of that movement, because once we can measure it we can build a margin out of it.

So let's stop guessing and run a thousand Fridays at this shop. Each one times twelve fresh deliveries and hands back that night's average, and we collect all thousand of them.

```r
# Run a thousand Friday nights and see where each night's average lands
set.seed(7)
many_averages <- replicate(1000, mean(round(rnorm(12, mean = 26, sd = 6))))

hist(many_averages, breaks = 30, col = "grey85", border = "white",
     main = "1,000 Friday nights at the same pizza shop",
     xlab = "That night's average delivery time (minutes)")
abline(v = 26, col = "red", lwd = 3)
```

`replicate(1000, ...)` simply repeats the thing inside it a thousand times and keeps every answer.

Let's read the picture. The red line is the truth, 26 minutes. The pile of nightly averages is centred right on it, which is reassuring, but the pile also has real width: plenty of Fridays came back near 24 minutes and plenty came back near 28.

Now let's put a number on that width.

```r
# Measure the typical drift, then compare it with the shortcut formula
round(c(measured = sd(many_averages), formula = 6 / sqrt(12)), 2)
#> measured  formula
#>     1.72     1.73
```

`sd()` measures how far a typical value sits from the middle of a pile. Run it on those thousand nightly averages and it says a typical Friday lands about 1.72 minutes away from 26.

That drift has a name. It is the **standard error of the average**, and you do not need a thousand Fridays to get it: divide the delivery spread by the square root of how many deliveries you timed. Here that is 6 divided by the square root of 12, which is 1.73. Our thousand simulated Fridays measured 1.72.

[KEY INSIGHT]
Two different spreads live in this shop and it is worth keeping them apart. Single deliveries are spread about 6 minutes wide. Nightly averages of twelve deliveries are spread only 1.7 minutes wide, because averaging twelve numbers cancels out most of the wobble. The standard error is always the second one.

=== step === quiz
## Quick check: what the standard error measures

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It measures how far a single delivery usually sits from 26 minutes, which is about 6 minutes. ::no
- It measures how far one night's average of twelve deliveries usually sits from 26 minutes, which is about 1.7 minutes. ::ok Exactly. It sizes the wobble of the average, not the wobble of one pizza, which is why it comes out far smaller than the 6 minutes single deliveries are spread over.
- It measures the worst delay the shop could ever produce on a single delivery. ::no
- It measures how wrong the shop's advertised 26 minutes is. ::no The standard error is not about any single delivery, and it is not a judgement on the shop. It answers one narrow question: if you time twelve deliveries and average them, how far does that average typically land from the truth? For this shop it is 6 divided by the square root of 12, which is about 1.7 minutes.

=== step === concept
## An interval is the average plus and minus a margin

We have a nightly average of 26.25 minutes, and we know a nightly average typically drifts about 1.7 minutes from the truth. Turning that into a window is now almost mechanical: take the average, then step out far enough on both sides to cover the drift.

That step out is called the **margin**, and every confidence interval for an average is built the same way.

\[ \bar{x} \pm t \times \frac{s}{\sqrt{n}} \]

Read it as four pieces. \( \bar{x} \) is the average of the deliveries you timed, \( s \) is how spread out those deliveries were, \( n \) is how many you timed, and \( s / \sqrt{n} \) is the standard error we just met. The \( t \) out front is a multiplier that decides how many standard errors wide to go.

Let's compute all four from Friday's twelve deliveries and watch the bounds fall out.

```r
# Build Friday's 95% interval from its four pieces
n_deliveries <- length(friday)
avg          <- mean(friday)
spread       <- sd(friday)
std_error    <- spread / sqrt(n_deliveries)
multiplier   <- qt(0.975, df = n_deliveries - 1)
margin       <- multiplier * std_error

round(c(avg = avg, spread = spread, std_error = std_error,
        multiplier = multiplier, margin = margin), 2)
#>        avg     spread  std_error multiplier     margin
#>      26.25       6.34       1.83       2.20       4.03

round(c(lower = avg - margin, upper = avg + margin), 2)
#> lower upper
#> 22.22 30.28
```

Two of those lines are worth a closer look. `sd(friday)` came back 6.34, which is Friday's own estimate of the shop's true spread of 6, and dividing it by the square root of 12 gives a standard error of 1.83 minutes.

`qt(0.975, df = 11)` is where the 95 enters. It asks how many standard errors you must go out to leave 2.5% of the possibilities below you and 2.5% above, which leaves 95% in the middle. The answer here is 2.20.

That 2.20 is a little bigger than the 1.96 you may have seen quoted, and the extra is the price of estimating the spread from the same twelve deliveries instead of knowing it. `df = n_deliveries - 1` is what tells R you only had twelve numbers to work with, so it charges you accordingly.

Multiply 2.20 by 1.83 and the margin comes to 4.03 minutes. Take 26.25 and step out 4.03 minutes either way, and you land on 22.22 to 30.28.

Those are the 22 and the 30 on the flyer.

=== step === concept
## The same interval, in one line of R

Working the four pieces by hand is the way to see what an interval is made of. It is not the way anyone does it twice.

`t.test()` runs that exact arithmetic for you, and `$conf.int` pulls the two bounds out of everything else it computes.

```r
# Ask R for the same interval in one line
friday_ci <- t.test(friday)$conf.int

friday_ci
#> [1] 22.22131 30.27869
#> attr(,"conf.level")
#> [1] 0.95
```

Same 22.22 and 30.28, down to the last decimal we bothered to print by hand.

Notice the `conf.level` line underneath. R is telling you it used 95% because that is the default, and that 95 is the one number in all of this we have not explained yet.

So let's go and explain it.

=== step === concept
## Which of a hundred intervals actually caught 26 minutes?

Here is the move that makes the 95 visible, and it only works because we built the shop ourselves and know the answer is 26.

We are going to run a hundred Friday nights. Each night times twelve fresh deliveries, computes its own average, and builds its own 95% interval the way we just did. Then, because we know the truth, we can walk down all hundred intervals and ask each one the same question: did it catch 26?

```r
# Run a hundred Fridays, keep every interval, and count how many caught 26
set.seed(3)
nights <- replicate(100, t.test(round(rnorm(12, mean = 26, sd = 6)))$conf.int)

caught <- nights[1, ] <= 26 & nights[2, ] >= 26

plot(NULL, xlim = c(0, 101), ylim = range(nights),
     xlab = "Friday night", ylab = "That night's interval (minutes)",
     main = "100 Fridays, 100 intervals")
segments(1:100, nights[1, ], 1:100, nights[2, ],
         col = ifelse(caught, "grey65", "red"), lwd = 2)
abline(h = 26, lwd = 3)

sum(caught)
#> [1] 94
```

`nights` is a table with two rows and a hundred columns: row 1 holds every lower bound, row 2 every upper bound. An interval caught the truth when its lower bound is at or below 26 and its upper bound is at or above it, which is all that `caught` line is checking.

Now look at the picture. Every vertical line is one Friday's interval, the thick horizontal line is the true 26 minutes, and the red lines are the intervals sitting entirely above it or entirely below it.

Six of them missed the truth. Ninety-four caught it.

Run it with a different seed and the count shifts around, because a fresh hundred Fridays is itself one roll of the dice. Run ten thousand Fridays instead of a hundred and the share settles almost exactly on 95 in every 100.

=== step === concept
## The 95% belongs to the recipe, not to the interval you got

Ninety-four out of a hundred. That is the 95, and notice where it came from: from repeating the whole night, not from studying any one interval.

Take a closer look at the six that missed.

```r
# List the nights whose interval missed the true 26 minutes
missed <- which(!caught)

data.frame(night = missed,
           lower = round(nights[1, missed], 2),
           upper = round(nights[2, missed], 2))
#>   night lower upper
#> 1    21 26.85 33.48
#> 2    29 26.32 33.01
#> 3    43 20.24 25.93
#> 4    45 22.60 25.90
#> 5    88 26.20 33.80
#> 6    89 17.92 24.25
```

Night 21 reported 26.85 to 33.48 minutes. The truth, 26, is not in there. Night 89 reported 17.92 to 24.25, and the truth is not in there either.

Nobody at the shop did anything wrong on those nights. They followed exactly the same recipe as the other ninety-four, and they simply happened to time an unlucky dozen deliveries.

[KEY INSIGHT]
The 95% is a property of the recipe, measured over repeats. It says: build intervals this way, night after night, and about 95 in every 100 will contain the truth. It says nothing about the one interval printed on the flyer, because that interval already either holds 26 or it does not.

So when the shop writes "we are 95% confident", the honest reading is this: the method that produced those two numbers gets it right about 95 times out of 100.

=== step === quiz
## Quick check: what the 95% attaches to

Napoli Pizza's flyer reports a 95% confidence interval of 22 to 30 minutes. Which sentence reads that 95% correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- 95 out of every 100 deliveries take between 22 and 30 minutes. ::no
- There is a 95% chance the shop's true average delivery time is between 22 and 30 minutes. ::no
- Build intervals this way night after night, and about 95 in every 100 of them will contain the shop's true average. ::ok That is it. The 95 counts intervals across repeats of the whole procedure, which is exactly what the hundred Fridays did, and it never attaches to the single window in your hand.
- The shop is right about its delivery times 95% of the time. ::no The 95 is not about deliveries, and it is not a chance attached to the one window on the flyer. It counts something you can only see by repeating the whole night: of a hundred intervals built this way, about ninety-five contain the truth. Ours caught 94.

=== step === concept
## Do 95% of pizzas arrive between 22 and 30 minutes?

Let's take the first of the two popular readings and settle it with data rather than with an argument.

If the flyer's window really described pizzas, then roughly 95 out of every 100 deliveries would land between 22 and 30 minutes. So let's time a whole year at the shop, two thousand deliveries in all, and count them.

```r
# Time a whole year of deliveries and count how many land between 22 and 30 minutes
set.seed(3)
year <- round(rnorm(2000, mean = 26, sd = 6))

mean(year >= 22 & year <= 30)
#> [1] 0.541
```

`year >= 22 & year <= 30` gives one TRUE or FALSE per delivery, and `mean()` over TRUE and FALSE is just the share of TRUEs.

That comes to 54%, not 95%.

So barely half the pizzas actually arrive inside the window the flyer prints, and if you order tonight there is a decent chance yours takes 35 minutes without anything having gone wrong.

The reason goes back to the two spreads we kept apart earlier. That window was built out of the standard error, which measures the wobble of a twelve-delivery average, and averages wobble far less than single pizzas do. An interval about the average was never a claim about your pizza.

=== step === tryit
## Your turn: the window that really holds 95% of pizzas

If 22 to 30 is not the range that holds 95% of deliveries, then what is?

You already have `year`, the two thousand delivery times from the whole year. Find the two times that leave 2.5% of deliveries below and 2.5% above, so that 95% of pizzas land between them. `quantile()` does exactly this: give it the data and the two shares you want.

```r
# year holds 2,000 single delivery times from the same shop.
# Find the two delivery times that leave 2.5% of the year below
# and 2.5% above, so 95% of pizzas land between them.
# One line. Press Check when you have it.
```
::check {"regex": "quantile[(]\\s*year\\s*,[^)]*\\.975", "gate": true, "difficulty": "beginner", "ok": "Right: 14 to 38 minutes. That is the window that actually holds 95% of pizzas, and it is three times wider than the 22 to 30 on the flyer, because it has to cover single deliveries rather than an average of twelve.", "no": "Give `quantile()` the data and the two shares you want as a pair: `quantile(year, c(0.025, 0.975))`."}
::solution
```r
# Find the middle 95% of single delivery times
quantile(year, c(0.025, 0.975))
#>  2.5% 97.5%
#>    14    38
```

14 to 38 minutes. If the shop wanted to make a promise about your pizza rather than about its own average, that is the window it would have to print, and it would make for a far less flattering flyer.

=== step === concept
## Is there a 95% chance the true average is in there?

That leaves the second popular reading, and it is the harder one to let go of, because it sounds so reasonable. Surely there is a 95% chance the true average lies between 22 and 30?

Let's test that claim on an interval where we already know the answer. Night 21 of our hundred Fridays reported this.

```r
# Take night 21's interval and test whether it holds the true 26 minutes
round(nights[, 21], 2)
#> [1] 26.85 33.48

nights[1, 21] <= 26 & nights[2, 21] >= 26
#> [1] FALSE
```

Night 21's interval runs from 26.85 to 33.48 minutes. The true average is 26. There is no 95% chance that 26 is in there, and there is no 5% chance either. It is simply not in there, and R says FALSE.

Now here is the uncomfortable part. Nobody standing inside night 21 could have known that. Their twelve deliveries looked perfectly ordinary, their arithmetic was correct, and their interval came out of the very same recipe as the ninety-four that worked.

[WARNING]
Once an interval is computed, the randomness is over. The truth sits fixed at 26 and never moves, your two bounds are fixed too, and one of two things is true: the truth is inside or it is outside. The 95% was spent back when the deliveries were still unrecorded, and it does not survive into the printed window.

That is why the careful phrasing is "we are 95% confident" rather than "there is a 95% probability". The confidence lives in the method that made the window, never in the window.

=== step === quiz
## Quick check: the interval that missed 26 minutes

Night 21 reported 26.85 to 33.48 minutes, and the shop's true average is 26. Which statement about that particular interval is correct?

::quiz {"correct": 4, "gate": true, "difficulty": "beginner"}
- There is still a 95% chance that 26 sits inside it, because it was built by the 95% recipe. ::no
- There is a 5% chance it is wrong, and this happens to be one of the unlucky ones. ::no
- The night was unlucky, so this one counts as an 80% interval rather than a 95% one. ::no All three of these keep a chance alive after the deliveries were already timed. Once the interval is computed the randomness is over: 26 is either inside those two numbers or it is not, and for night 21 it is not. The 95 described the recipe, and the recipe had already run.
- It does not contain 26, full stop. No chance is attached to it any more. ::ok Yes. A computed interval either holds the truth or it does not, and this one does not. The 95% described the recipe that built it, and it was already spent by the time the two numbers were printed.

=== step === concept
## What makes the interval wide or narrow

We now know what the 95% counts. The next practical question is what decides how wide the window comes out, because 22 to 30 is an eight minute range and the shop might well want something tighter.

Go back to the margin, which was the multiplier times the spread divided by the square root of how many deliveries you timed. Three things can move it:

1. **How many deliveries you time.** More deliveries means a bigger square root on the bottom, so a smaller margin.
2. **How spread out the deliveries are.** A shop where every pizza takes 25 to 27 minutes has a small spread and a tight window, whatever else it does.
3. **How much confidence you demand.** Asking for more confidence raises the multiplier, which widens the window.

The first one is the only knob most people can actually turn, so let's measure it. The code below times 12, then 48, then 192 deliveries, builds two hundred intervals at each size, and reports the average width.

```r
# Measure how wide the interval gets as you time more deliveries
set.seed(5)
average_width <- function(n) {
  mean(replicate(200, diff(t.test(round(rnorm(n, mean = 26, sd = 6)))$conf.int)))
}

data.frame(
  deliveries_timed = c(12, 48, 192),
  average_width    = round(sapply(c(12, 48, 192), average_width), 2)
)
#>   deliveries_timed average_width
#> 1               12          7.45
#> 2               48          3.50
#> 3              192          1.72
```

`diff()` on the two bounds is just upper minus lower, which is the width of the window in minutes.

Read the two columns together. Four times as many deliveries takes the width from 7.45 minutes down to 3.50, and four times again takes it down to 1.72. So every time the deliveries go up fourfold, the window halves.

That fourfold is not a coincidence, it is the square root in the formula. To make an interval twice as tight you need four times the data, which is why precision gets expensive fast.

=== step === tryit
## Your turn: rebuild Friday's interval, then ask for 99% confidence

This one is two lines, and both of them are moves you have already seen.

First, rebuild Friday's 95% bounds by hand. `avg` holds the average of the twelve deliveries, 26.25, and `margin` holds the 4.03 minutes we worked out from the multiplier and the standard error.

Then ask `t.test()` for a 99% interval on the same twelve deliveries instead of the 95% one, using its `conf.level` argument, and see what the extra confidence costs you in minutes.

```r
# friday holds the twelve delivery times, and avg and margin are
# already built from them.
# Line 1: rebuild the 95% bounds from avg and margin.
# Line 2: ask t.test for a 99% interval on friday instead.
# Press Check when you have both.
```
::check {"regex": "conf\\.level\\s*=\\s*0?\\.99", "gate": true, "difficulty": "beginner", "ok": "Right: 22.22 to 30.28 by hand, and 20.57 to 31.93 at 99%. Demanding more confidence buys you 3.31 extra minutes of width on the very same twelve deliveries.", "no": "The bounds are `avg - margin` and `avg + margin`. For the second line, pass the level straight to t.test: `t.test(friday, conf.level = 0.99)$conf.int`."}
::solution
```r
# Rebuild the 95% bounds by hand, then ask for 99% confidence instead
round(c(lower = avg - margin, upper = avg + margin), 2)
#> lower upper
#> 22.22 30.28

round(t.test(friday, conf.level = 0.99)$conf.int, 2)
#> [1] 20.57 31.93
#> attr(,"conf.level")
#> [1] 0.99

round(diff(t.test(friday, conf.level = 0.99)$conf.int) -
      diff(t.test(friday)$conf.int), 2)
#> [1] 3.31
```

It is the same twelve deliveries, the same average and the same standard error. The only thing that changed is the multiplier, and the window grew by 3.31 minutes.

=== step === concept
## A narrower interval is a weaker promise

Going up to 99% made the window wider, so going down should make it tighter. That sounds like a free win, and it is worth seeing exactly what you pay for it.

So let's rerun the very same hundred Fridays, with the very same deliveries, and ask for only 80% confidence this time.

```r
# Rerun the same hundred Fridays asking for only 80% confidence
set.seed(3)
nights80 <- replicate(100, t.test(round(rnorm(12, mean = 26, sd = 6)),
                                  conf.level = 0.80)$conf.int)

caught80 <- nights80[1, ] <= 26 & nights80[2, ] >= 26

plot(NULL, xlim = c(0, 101), ylim = range(nights),
     xlab = "Friday night", ylab = "That night's interval (minutes)",
     main = "The same 100 Fridays at 80% confidence")
segments(1:100, nights80[1, ], 1:100, nights80[2, ],
         col = ifelse(caught80, "grey65", "red"), lwd = 2)
abline(h = 26, lwd = 3)

sum(caught80)
#> [1] 79
```

The vertical scale is the same as before, so you can see the lines are visibly shorter. You can also see a lot more red.

Seventy-nine caught the truth instead of ninety-four. So the confidence level is not a dial that makes your estimate any better. It is a dial that trades width against how often you are right, and the recipe hands you whatever you ask it for.

Push it the other way and the point gets sharper. An interval running from zero to infinity minutes would catch the truth 100% of the time and tell you absolutely nothing, which is why nobody prints one.

[TIP]
A narrow interval is not a good interval and a wide one is not a bad interval. Width is mostly a report on how much data you collected. If you want a tighter window that still holds up, time more deliveries rather than lowering the level.

=== step === concept
## What happens when the delivery times are lopsided

Every interval so far came from a shop whose deliveries pile up symmetrically around 26 minutes. Real delivery times rarely look like that. A pizza cannot arrive faster than the oven can bake it, but a lost driver can turn one delivery into an hour.

So let's build that shop instead. Its deliveries never come in under 12 minutes, most of them arrive quickly, and a few run very long. Its true average is still exactly 26 minutes.

```r
# Build a lopsided shop whose true average is still 26 minutes
set.seed(15)
lopsided_year <- 12 + rexp(20000, rate = 1/14)

hist(lopsided_year, breaks = 60, col = "grey85", border = "white",
     main = "A shop where most pizzas are quick and a few run very long",
     xlab = "Delivery time (minutes)")
abline(v = 26, col = "red", lwd = 3)

round(c(average = mean(lopsided_year), median = median(lopsided_year)), 2)
#> average  median
#>   26.01   21.62
```

`rexp()` draws waiting times that are usually short with a long tail of slow ones, and adding 12 sets the floor at the baking time. The picture leans hard to the left with a tail stretching away to the right.

Notice the average is 26 minutes while the typical delivery, the median, is under 22. That gap between the two is what lopsided means.

Now here is the real question. The recipe was designed for symmetric piles, so does it still catch the truth 95 times in 100 at a shop like this?

```r
# Measure how often the same 95% recipe catches 26 at the lopsided shop
set.seed(5)
lopsided_catches <- replicate(2000, {
  night  <- 12 + rexp(12, rate = 1/14)
  bounds <- t.test(night)$conf.int
  bounds[1] <= 26 & bounds[2] >= 26
})

mean(lopsided_catches)
#> [1] 0.9135
```

91%, not 95%. We asked for 95 and the recipe gave us back 91.

That is not a disaster, and it is not nothing either. With twelve lopsided deliveries the interval over-promises a little, and the fix is the ordinary one: time more deliveries, and the gap closes as the nightly averages grow more symmetric.

[NOTE]
The 95% assumes the nightly averages pile up symmetrically. With enough deliveries they nearly always do, even from lopsided data. With only twelve of them from a long-tailed shop they do not quite, so treat a small-sample interval as approximate rather than exact.

=== step === concept
## The sentence to say when someone asks what the 95% means

You do not need a definition to recite. You need one sentence you can say in a meeting without being wrong, so here it is with Napoli Pizza's numbers filled in.

"Our method for building this window gets it right about 95 times in 100. This time it gave us 22 to 30 minutes for the shop's average delivery."

Notice how it is put. It pins the 95 on the method, it treats the window as one result of running that method, and it says nothing at all about your pizza or about the chance the truth sits inside.

Here are the three wordings it is replacing, and why each one fails.

| What people say | Why it is wrong |
|---|---|
| "95% of deliveries take between 22 and 30 minutes." | The window describes an average, not a pizza. Only 54% of this shop's deliveries land inside it, and the range that really holds 95% of them is 14 to 38 minutes. |
| "There is a 95% chance the true average is between 22 and 30." | Puts a probability on the truth. The truth is fixed at 26 and the printed window either holds it or does not, exactly as night 21 did not. |
| "We are 95% sure this particular window is right." | The same mistake in politer clothes. The 95 belongs to the recipe over repeats, so it cannot be handed to the single window in front of you. |

And if your numbers came from a small handful of lopsided measurements, add one more clause to stay honest: about 95 times in 100, though with only twelve deliveries from a long-tailed shop it runs a little under that.

=== step === quiz
## Quick check: reading another shop's interval

A second shop across the street timed 40 deliveries and reports a 95% confidence interval of 18 to 24 minutes for its average delivery time. Which reading of that holds up?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The procedure that produced 18 to 24 catches the shop's true average about 95 times in 100, and this is one run of it. ::ok Right on every count. It puts the 95 on the repeated procedure, treats 18 to 24 as one result of that procedure, and claims nothing at all about any single delivery.
- There is a 95% probability the shop's true average is between 18 and 24 minutes. ::no
- About 95% of that shop's deliveries arrive between 18 and 24 minutes. ::no
- The shop is more reliable than Napoli Pizza, because 18 to 24 is a narrower window than 22 to 30. ::no Three of these four repeat a misreading we have already taken apart: a probability pinned on the truth, a claim about single deliveries, and width read as quality. A narrower window here mostly reflects 40 deliveries timed instead of 12.

=== step === tryit
## Your turn: a 90% interval and how often it catches

You have watched a 95% recipe catch 94 of a hundred Fridays and an 80% recipe catch 79. Now predict the middle one before you run it, then check yourself.

Build the 90% interval for Friday's twelve deliveries, then rerun the same hundred Fridays at 90% confidence and count how many caught the true 26 minutes. Reuse the counting move from before: an interval caught the truth when its lower bound is at or below 26 and its upper bound is at or above it.

```r
# friday holds the twelve delivery times from the original Friday night.
# Line 1: build the 90% interval for friday.
# Then: rerun 100 Fridays at 90% confidence and count the catches.
# Press Check when you have it.
```
::check {"regex": "conf\\.level\\s*=\\s*0?\\.90?\\b", "gate": true, "difficulty": "intermediate", "ok": "Yes: Friday gives 22.96 to 29.54, and 88 of the hundred nights caught 26. Ask for 90 and the recipe delivers about 90, sitting neatly between the 79 you saw at 80% and the 94 at 95%.", "no": "Pass the level to t.test twice: `t.test(friday, conf.level = 0.90)$conf.int` for the first line, and the same `conf.level = 0.90` inside the replicate that builds the hundred nights."}
::solution
```r
# Build Friday's 90% interval, then count its catches over the same 100 nights
round(t.test(friday, conf.level = 0.90)$conf.int, 2)
#> [1] 22.96 29.54
#> attr(,"conf.level")
#> [1] 0.9

set.seed(3)
nights90 <- replicate(100, t.test(round(rnorm(12, mean = 26, sd = 6)),
                                  conf.level = 0.90)$conf.int)

sum(nights90[1, ] <= 26 & nights90[2, ] >= 26)
#> [1] 88
```

Friday's window tightened from 22.22 to 30.28 down to 22.96 to 29.54, and the catch rate fell from 94 to 88. Whatever level you ask for is the catch rate you get, and the width follows along behind it.

=== step === quiz
## Quick check: what four times the deliveries buys you

Napoli Pizza decides to time 48 deliveries next Friday instead of 12, and keeps the level at 95%. What happens to the interval, and what happens to the 95?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The window stays about 8 minutes wide, but the recipe now catches the truth more than 95 times in 100. ::no
- The window shrinks to about a quarter of its width, and the catch rate climbs with it. ::no
- The window shrinks to about half its width, from roughly 7.5 minutes to 3.5, and the catch rate stays at about 95 in 100. ::ok Exactly. More deliveries buy precision, not a better catch rate. The square root means four times the data halves the width, while the 95 stays wherever you set the level.
- Both the window and the catch rate stay the same, since the shop and its true average never changed. ::no More data does change the interval: 12, 48 and 192 deliveries gave average widths of 7.45, 3.50 and 1.72 minutes. What it does not change is the catch rate, which is fixed by the confidence level you ask for and not by how much data you have.

=== step === concept
## References

- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23, 103-123. Takes both popular readings apart in detail, with worked counterexamples.
- [Robust Misinterpretation of Confidence Intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21, 1157-1164. Where the misreadings were measured: students and working researchers alike endorsed statements the interval does not support.
- [Outline of a Theory of Statistical Estimation Based on the Classical Theory of Probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The paper that defined a confidence interval as a property of the procedure over repeats.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. A catalogue of misreadings, corrected one at a time.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and its `conf.level` argument.

=== step === complete
## Quick recap

You built a confidence interval by hand, then built a hundred more and watched which of them caught the truth. That is the whole thing. To summarise:

- An interval is an average plus and minus a margin, and the margin is a multiplier times the standard error. Friday gave 26.25 plus and minus 4.03, which is 22.22 to 30.28.
- The 95% counts intervals across repeats of the whole procedure. A hundred Fridays gave 94 catches and 6 misses.
- It is not the range 95% of pizzas land in. Only 54% of this shop's deliveries fell between 22 and 30, and the range that really holds 95% of them is 14 to 38 minutes.
- It is not a 95% chance the truth is inside your window. Night 21 reported 26.85 to 33.48, and 26 is simply not in there.
- Width reports how much data you collected. Four times the deliveries halves the window, while the catch rate stays wherever you set the level.

So when someone points at 22 to 30 and asks what the 95% means, you have a sentence ready:

"Our method for building this window gets it right about 95 times in 100. This time it gave us 22 to 30 minutes for the shop's average delivery."

Say that in a meeting and nobody can accuse you of reading it wrong. Congratulations! You made it through. Have a great day!

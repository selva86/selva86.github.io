---
title: "Confidence intervals: what they really mean"
slug: "Inference-Mini-3"
catalog_blurb: "What the 95 percent in a confidence interval is actually promising."
description: "A pizza place says it is 95 percent confident the average delivery takes 22 to 30 minutes. Build that interval yourself in R and watch which intervals miss."
keywords: "confidence intervals, what confidence intervals mean, 95 percent confidence interval, confidence interval interpretation, coverage, bootstrap confidence interval, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.3"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-2"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 3 of 7
## Confidence intervals: what they really mean

Last time, Dev ran a checkout test on 300 visitors and got a p-value of 0.37, and the thing that actually rescued his write-up was not the p-value at all. It was the interval printed underneath it, the one that said his data were compatible with anything from a small loss to a solid win. That interval is what this part is about. If you missed part 2, nothing here leans on it, because everything gets built from the beginning again.

Rosa runs a pizza place on Mill Street. Last Tuesday she timed twelve deliveries, worked out the numbers, and wrote a small card that now sits by the till: **we are 95 percent confident the average delivery takes between 22 and 30 minutes.**

It reads like a precise promise. So ask what the 95 percent is promising, and two answers come to mind straight away. Maybe it means 95 percent of pizzas arrive inside that window. Or maybe it means there is a 95 percent chance the true average sits somewhere between 22 and 30.

Neither of those is what the number says, and almost everybody who uses confidence intervals has quietly avoided asking which one it is. Here is the picture that settles it.

![One hundred horizontal confidence intervals stacked in a column, each built from a different simulated week of twelve deliveries. A vertical line marks the true average of 27 minutes. Ninety two of the intervals cross that line and eight, drawn in orange, fall entirely to one side of it and miss.](screenshots/Inference-Mini-3-interval-catcher.webp)

Every horizontal line is one week of twelve deliveries turned into one interval, exactly the way Rosa turned her Tuesday into the card by the till. The vertical line is the truth she cannot see, which in this simulated world is 27 minutes. Most of the intervals cross it. Eight of them, in orange, sit entirely off to one side and are simply wrong, and nobody holding one of those eight would have any way of knowing.

That picture is the whole idea, and by the end of this part you will have built it yourself from scratch.

By the end you will be able to:

- Build Rosa's interval from twelve raw numbers, by hand and then in one line, and get the same two bounds both ways
- Run the picture above yourself and count how many of your intervals miss
- Say what the 95 percent means in a sentence that survives someone pushing back on it, and say why both of the obvious readings fail
- Work out what makes an interval narrow, and how many deliveries Rosa would need to pin the average down to the minute
- Spot the two situations where the standard recipe quietly underdelivers, and build an interval a different way when it does

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `x >= 27` are familiar. No statistics background is assumed, and every term gets defined in plain words the moment it turns up.

=== step === concept
::eyebrow The trap
## Three readings of the same card

Put the three sentences next to each other, because at a glance they look like they are all saying the same thing.

- **Reading one.** About 95 percent of pizzas arrive between 22 and 30 minutes.
- **Reading two.** There is a 95 percent chance that the true average delivery time is between 22 and 30 minutes.
- **What the card actually claims.** The recipe Rosa used to build "22 to 30" catches the true average about 95 times out of every 100 times it is used.

Reading one is about pizzas. It makes a promise about individual deliveries, the ones customers actually wait for, and we will measure exactly how wrong it is later on: fewer than half of Rosa's pizzas land in that window.

Reading two is about this one interval. It takes the pair of numbers she computed on Tuesday and attaches a probability to them, as though the true average were still wandering about deciding whether to be inside or outside.

The third sentence is doing something stranger and more careful. It says nothing about pizzas and nothing about Rosa's particular pair of numbers. It makes a promise about the **method**, about what happens if you use that method over and over on fresh batches of deliveries.

[KEY INSIGHT]
The 95 percent is a property of the procedure, not of the two numbers it printed. It describes how often the procedure works, in the same way that a claim about a car's fuel economy describes the car rather than the particular trip you just took.

That distinction sounds like pedantry until you build the thing and watch it miss. So let us build it.

=== step === concept
::eyebrow What we are actually after
## The number Rosa does not have

Before there can be an interval there has to be something the interval is about, so name it precisely: **the average time a delivery from Rosa's takes**, over every delivery she has made and every delivery she is going to make. Call it the true average. It is a real number, it is sitting there right now, and Rosa has no way to see it, because seeing it would mean timing every delivery forever.

What she has instead is Tuesday. Twelve deliveries, twelve stopwatch readings, written on the back of an order pad.

```r
deliveries <- c(27, 33, 18, 24, 31, 22, 16, 29, 25, 34, 20, 33)

length(deliveries)
#> [1] 12

mean(deliveries)
#> [1] 26

sd(deliveries)
#> [1] 6.164414
```

`c(...)` glues those twelve numbers into one object called a vector, and `deliveries` is now the name for the whole set of them. `length()` counts how many there are, `mean()` adds them up and divides by twelve, and `sd()` reports the **standard deviation**, which is the standard word for how spread out a set of numbers is. Roughly speaking it is the typical distance between one delivery and the average, so a standard deviation of 6.16 minutes says that a delivery running five or six minutes off the average is an ordinary Tuesday rather than a crisis.

Two numbers matter from here on. The twelve deliveries averaged **26 minutes**, and they were spread out by about **6.2 minutes**.

Now, 26 is not the true average. It is the average of the twelve deliveries that happened to be the ones she timed, and that is a very different thing.

=== step === concept
::eyebrow Why one number is not enough
## Another twelve deliveries would not give 26

Here is the move that makes everything else make sense. We are going to build a pretend world where the true average is known, so that we can watch the whole business of estimating it and grade the result. In the real world nobody gets to do this, which is exactly why it is worth doing once.

In our pretend world Rosa's deliveries take **27 minutes on average**, with a spread of 6 minutes. That 27 is a number we are choosing, not one we discovered, and its only job is to be the answer we can check against.

Draw a week out of that world and see what turns up.

```r
set.seed(1)
week <- rnorm(12, mean = 27, sd = 6)
round(week, 1)
#>  [1] 23.2 28.1 22.0 36.6 29.0 22.1 29.9 31.4 30.5 25.2 36.1 29.3

mean(week)
#> [1] 28.61183
```

`rnorm(12, mean = 27, sd = 6)` asks R for twelve delivery times from a world whose true average is 27 and whose spread is 6, and `set.seed(1)` pins R's random numbers down so your run comes out identical to the one printed here. `round(week, 1)` just trims the decimals so the times are readable.

Look at what that week did. Every single one of those twelve deliveries came out of a world whose average is 27, and yet the week's own average landed at 28.6. Nothing went wrong. The world did not change its mind. Twelve deliveries simply happened to include a 36.6 and a 36.1, and up went the average.

So when Rosa's Tuesday came out at 26, that told her something about the true average without pinning it down. A different Tuesday would have given a different number.

=== step === concept
::eyebrow Twenty Tuesdays
## So do the week over and over

One week tells you as much about the wandering as one coin flip tells you about a coin. Wrap the whole business in a function and then run as many weeks as you like.

```r
week_average <- function() {
  week <- rnorm(12, mean = 27, sd = 6)
  mean(week)
}

set.seed(2026)
round(replicate(20, week_average()), 1)
#>  [1] 23.5 26.3 30.6 26.5 24.7 25.3 27.4 27.8 26.4 25.2 30.7 27.8 28.8 26.4 26.3
#> [16] 29.3 26.1 27.7 27.3 28.6
```

`week_average()` is the two lines you just read packed into something reusable: time twelve deliveries, hand back their average. `replicate(20, week_average())` runs it twenty separate times and gathers the twenty answers into one row, and the `[1]` and `[16]` down the left edge are R keeping count of where each printed line starts rather than part of the data.

Twenty weeks in a world whose true average never budged from 27, and the averages come out anywhere from 23.5 to 30.7. That is a range of more than seven minutes, produced entirely by which twelve deliveries happened to fall in each week.

The averages do cluster, though, and they cluster around 27. None of them wandered off to 15 or 40. Whatever this wobble is, it has a size, and a size is something we can measure.

=== step === concept
::eyebrow The size of the wobble
## How far the average usually wanders

Twenty weeks is enough to see the wandering but not to measure it, so run twenty thousand and take the spread of the answers.

```r
set.seed(7)
averages <- replicate(20000, week_average())

sd(averages)
#> [1] 1.730384
```

`averages` now holds twenty thousand numbers, each one the average of a different simulated week. Taking `sd()` of that pile does not measure how spread out deliveries are. It measures how spread out the weekly averages are, which is a completely different quantity and the one that matters here. It comes to about **1.73 minutes**.

Individual deliveries wobble by about 6 minutes. Averages of twelve deliveries wobble by about 1.73. Averaging calmed things down by a factor of roughly three and a half, and that factor is not a coincidence.

```r
6 / sqrt(12)
#> [1] 1.732051
```

Six divided by the square root of twelve. That is 1.732, and the simulation measured 1.730. Those agree to three decimal places, which is about as good as twenty thousand simulated weeks can be expected to do.

This quantity has a name. It is the **standard error** of the average, and it is the standard deviation of the estimate rather than of the data. In symbols,

\\[ SE = \\frac{s}{\\sqrt{n}} \\]

where \\(s\\) is the standard deviation of your numbers, so how spread out the individual deliveries are, and \\(n\\) is how many of them you have. Divide one by the square root of the other and you have the typical distance between your sample's average and the truth.

Here is the same twenty thousand weeks as a picture. Press Run and each bar counts how many weeks produced an average in that slice.

```r
hist(averages, breaks = 40, col = "grey85", border = "white",
     main = "20,000 weeks: the average of 12 deliveries",
     xlab = "the week's average delivery time, in minutes")
abline(v = 27, col = "#b5631a", lwd = 3)
```

The pile sits over 27, the true average, and thins out fast in both directions. The orange line marks the truth. Almost every week landed within about three and a half minutes of it, which is two standard errors, and that number is about to become the whole story.

=== step === quiz
::eyebrow Check yourself
## Which number moves?

Rosa keeps her twelve-delivery routine but decides to do it four Tuesdays running, so she ends up with 48 timed deliveries instead of 12. What happens to the two quantities we have been talking about?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both the spread of individual deliveries and the wobble of the average shrink, because more data makes everything tighter
- The spread of individual deliveries stays around 6 minutes, and the wobble of the average halves to about 0.87 minutes ::ok Exactly right, and the halving is the square root at work. Individual deliveries are what they are: collecting more of them describes that spread better but does not change it, so `sd` stays near 6. The standard error, though, is 6 divided by the square root of the sample size, and going from 12 to 48 multiplies the sample size by four, which multiplies the square root by two, which cuts the standard error in half. That is why 1.73 becomes 0.87.
- The spread of individual deliveries shrinks to about 3 minutes and the wobble of the average stays the same
- Neither changes, because they both come from the same underlying world ::no Those two quantities behave in opposite ways, so a rule that moves them together cannot be right. The spread of deliveries is a fact about Rosa's kitchen and her drivers, and no amount of measuring will tighten it. The wobble of the average is a fact about your estimate, and it shrinks as you gather more, because that is what averaging does.

=== step === concept
::eyebrow The recipe
## An estimate plus or minus a margin

Now we can build the interval, and it has the same three parts every confidence interval you will ever meet has: a best guess, a multiplier, and a standard error.

Start from Rosa's real Tuesday and work out its standard error. She does not know the true spread of 6, so she uses the spread she actually measured, 6.164.

```r
n      <- length(deliveries)
avg    <- mean(deliveries)
spread <- sd(deliveries)

se <- spread / sqrt(n)
se
#> [1] 1.779513
```

So her estimate of the true average is 26 minutes, and the typical distance between an estimate like that and the truth is about 1.78 minutes. An interval that stretched exactly one standard error either side of 26 would be too timid, because plenty of samples land further out than one standard error. We want to reach out far enough that the interval catches the truth 95 times in 100.

The number that says how far is the **multiplier**, and R has a function for it.

```r
t_crit <- qt(0.975, df = n - 1)
t_crit
#> [1] 2.200985
```

`qt()` reads out a cutoff from the **t distribution**, which is the shape the wandering takes when you had to estimate the spread from the data rather than knowing it. The 0.975 leaves 2.5 percent of the wandering out beyond the right edge, and since the shape is symmetric another 2.5 percent falls off the left edge, so 95 percent of it sits in the middle. The `df` is the **degrees of freedom**, which here is simply your sample size minus one, and it is what makes the multiplier bigger when you have very little data. With eleven degrees of freedom the multiplier is 2.20, whereas somebody with hundreds of deliveries would get about 1.96. Estimating the spread from twelve numbers is a shaky business, and the t distribution charges you for it.

Multiply, then add and subtract.

```r
margin <- t_crit * se
margin
#> [1] 3.916682

c(avg - margin, avg + margin)
#> [1] 22.08332 29.91668
```

There it is: **22.1 to 29.9 minutes**, which is the "22 to 30" Rosa rounded onto the card. Written out, the recipe is

\\[ \\bar{x} \\pm t_{n-1,\\,0.975} \\cdot \\frac{s}{\\sqrt{n}} \\]

where \\(\\bar{x}\\) is your sample average, \\(s\\) is your sample standard deviation, \\(n\\) is how many numbers you have, and \\(t_{n-1,\\,0.975}\\) is the multiplier `qt()` just handed back. Every one-sample confidence interval in this lesson is that expression with different numbers plugged in.

=== step === concept
::eyebrow The shortcut
## The one line that does all of it

You will not type that out every time, because R has the whole recipe built in.

```r
t.test(deliveries)
#> 
#> 	One Sample t-test
#> 
#> data:  deliveries
#> t = 14.611, df = 11, p-value = 1.503e-08
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  22.08332 29.91668
#> sample estimates:
#> mean of x 
#>        26
```

The two lines to read are `95 percent confidence interval: 22.08332 29.91668` and `mean of x 26`, and they are exactly the numbers you computed by hand a moment ago, to every decimal place, because `t.test()` runs the same three-part formula internally.

Most of the rest of that printout belongs to a hypothesis test rather than to the interval. The `p-value = 1.503e-08` is testing whether the true average delivery time might be zero minutes, which is not a question anybody has, and it is small because the answer is obviously no. R prints it because one function does both jobs. Ignore it here; part 2 covered what a p-value is and when it earns its place.

If you want the interval on its own rather than the whole report, ask for it by name.

```r
t.test(deliveries)$conf.int
#> [1] 22.08332 29.91668
#> attr(,"conf.level")
#> [1] 0.95
```

The `$conf.int` pulls out just the two bounds, and the `attr(,"conf.level")` line underneath is R reminding you which confidence level it used, since 0.95 is only the default and not a law.

=== step === tryit
::eyebrow Your turn
## Ask for 99 percent instead

Rosa wants to be more careful in the version she shows her landlord, so she asks for a 99 percent interval on the same twelve deliveries.

`t.test()` takes an argument called `conf.level` for exactly this. Fill in the blank and press Check.

```r
t.test(deliveries, conf.level = ____)$conf.int
```
::check {"regex":"conf\\.level\\s*=\\s*0?\\.99","gate":true,"difficulty":"beginner","ok":"That gives 20.5 to 31.5 minutes, about a minute and a half further out at each end than the 95 percent version, so three minutes wider in total. Nothing about Rosa's Tuesday changed. She just asked the recipe to be right more often, and the only way it can promise that is by reaching further out.","no":"The argument takes the confidence level as a proportion rather than a percentage, so 99 percent is written as 0.99."}
::solution
```r
t.test(deliveries, conf.level = 0.99)$conf.int
#> [1] 20.47318 31.52682
#> attr(,"conf.level")
#> [1] 0.99
```

=== step === concept
::eyebrow The whole point
## Now do that a hundred times

We have a recipe. The claim attached to it is that it catches the true average 95 times in 100. That claim is checkable, and checking it is the single most useful thing you can do with a confidence interval, so let us go and check it.

Back to the pretend world where the true average is 27. Draw a week, build an interval from it, and repeat a hundred times.

```r
week_interval <- function() {
  week <- rnorm(12, mean = 27, sd = 6)
  t.test(week)$conf.int
}

set.seed(3)
intervals <- replicate(100, week_interval())
dim(intervals)
#> [1]   2 100
```

`week_interval()` times twelve deliveries and hands back a pair of numbers, the interval's lower bound and its upper bound. Running it a hundred times gives a table with 2 rows and 100 columns, which is what `dim()` is reporting: row 1 holds every lower bound, row 2 holds every upper bound, and each column is one week.

Now ask each of the hundred intervals the only question that matters. Did it catch 27?

```r
catches <- intervals[1, ] <= 27 & intervals[2, ] >= 27
sum(catches)
#> [1] 92
```

`intervals[1, ]` is the whole first row, so all hundred lower bounds at once, and `intervals[2, ]` is all hundred upper bounds. An interval catches the truth when its lower bound is at or below 27 **and** its upper bound is at or above 27, which is what the `&` is checking, one week at a time. `sum()` then counts the TRUEs, because R treats every TRUE as a 1.

Ninety two of the hundred caught it. Eight did not.

Press Run on this and you get the picture from the cover, except now it is yours.

```r
plot(NA, xlim = c(18, 36), ylim = c(1, 100),
     xlab = "delivery time in minutes", ylab = "week number",
     main = "100 weeks, 100 intervals")
segments(intervals[1, ], 1:100, intervals[2, ], 1:100,
         col = ifelse(catches, "grey75", "#b5631a"), lwd = 2)
abline(v = 27, lwd = 2)
```

`plot(NA, ...)` sets up an empty pair of axes with nothing drawn on them, `segments()` then draws one horizontal line per week from its lower bound to its upper bound, and `ifelse(catches, "grey75", "#b5631a")` paints a week grey when its interval caught the truth and orange when it did not. `abline(v = 27)` drops the vertical line at the truth.

Every grey line crosses the black line. The orange ones sit off to one side, entirely missing it, and there is nothing visibly wrong with them. They are not wider or narrower or built any differently. They came from perfectly ordinary weeks that happened to contain a few slow deliveries in a row.

That is the fact worth sitting with. If Rosa's Tuesday had been one of those eight weeks, her card would say something false, she would have no way of telling, and she would not have made a single mistake.

=== step === concept
::eyebrow Counting properly
## Ten thousand weeks

Ninety two out of a hundred is not 95 out of a hundred, and before reading anything into that gap, remember that a hundred weeks is itself a small sample. Count the catches properly instead.

```r
week_catches <- function(level = 0.95) {
  week <- rnorm(12, mean = 27, sd = 6)
  half <- qt(1 - (1 - level) / 2, df = 11) * sd(week) / sqrt(12)
  abs(mean(week) - 27) <= half
}

set.seed(11)
mean(replicate(10000, week_catches()))
#> [1] 0.9514
```

`week_catches()` is the same job as before written more directly: it times twelve deliveries, works out the margin with the formula from the recipe step, and then asks whether the week's average landed within that margin of the truth, which is another way of asking whether the interval covered 27. The one new piece is `1 - (1 - level) / 2`, which turns a confidence level into the cutoff `qt()` wants. At `level = 0.95` it comes to 0.975, the number you typed by hand earlier, and at `level = 0.80` it comes to 0.90, because an 80 percent interval leaves 10 percent hanging off each end rather than 2.5. It builds the margin itself rather than calling `t.test()` because ten thousand rounds of arithmetic are much quicker than ten thousand full test reports. Taking `mean()` of ten thousand TRUEs and FALSEs gives the fraction that are TRUE, since R counts every TRUE as 1 and every FALSE as 0.

**0.9514.** Ninety five point one percent of the time, the recipe caught the true average. The hundred-week run's 92 was just the noise you get from counting a hundred of anything.

This number has a name, **coverage**, and it is the whole meaning of the 95. Coverage is the share of intervals that contain the true value when you use a procedure over and over. A recipe whose coverage comes out at 0.95 is what "95 percent confidence" means, and there is nothing else in there.

=== step === concept
::eyebrow The definition
## What the 95 percent is attached to

So here is the sentence, with nothing left out.

**A 95 percent confidence interval is the output of a procedure that, used repeatedly on fresh samples, produces intervals containing the true value 95 percent of the time.**

Notice what the subject of that sentence is. It is the procedure. The 95 percent is a fact about a method's long-run behaviour, in the same way that a claim about a goalkeeper saving 95 percent of penalties is a fact about the goalkeeper and not about any particular penalty.

Which is why reading two, the one that sounded so reasonable back at the start, does not work.

- **The true average is not moving.** It is a fixed number. Rosa's kitchen has whatever average it has.
- **Her interval is not moving either.** Once Tuesday was over, 22.1 and 29.9 were settled.
- So the true average is either inside that fixed pair of numbers or it is not, and no amount of probability language changes which. There is nothing left to be 95 percent about.

The probability lives **before** the sample is drawn, not after. Ahead of Tuesday you could honestly say "the interval I am about to build has a 95 percent chance of catching the truth", the same way you can say a coin about to be flipped has a 50 percent chance of heads. Afterwards, the coin is showing what it is showing.

[KEY INSIGHT]
Say "we are 95 percent confident the true average is between 22 and 30", which is the conventional shorthand for the long-run statement. Do not say "there is a 95 percent probability the true average is between 22 and 30", because that quietly turns a fact about the method into a fact about a number that is not random.

If it bothers you that you cannot say the natural thing, that instinct is sound and there is a whole branch of statistics built on it. A Bayesian **credible interval** does make exactly the statement reading two wanted, and it can, because it treats the unknown average as something you hold beliefs about and requires you to state those beliefs before seeing the data. Different machinery, different promise. What comes out of `t.test()` is not that.

=== step === quiz
::eyebrow Check yourself
## Say the 95 percent out loud

Rosa's interval came out at 22.1 to 29.9 minutes. Which of these states what the 95 percent means?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- There is a 95 percent probability that the true average delivery time lies between 22.1 and 29.9
- About 95 percent of Rosa's deliveries take between 22.1 and 29.9 minutes
- We have measured the true average to within 5 percent
- If Rosa repeated the whole exercise on fresh batches of twelve deliveries, about 95 percent of the intervals she built that way would contain the true average ::ok That is it, and notice that the sentence is about a run of intervals rather than about the one on her card. That is what the ten thousand simulated weeks measured, and 0.9514 came back. Her particular interval either contains the truth or it does not, and the 95 percent describes the method that produced it.
- We are 95 percent sure the next delivery will take between 22.1 and 29.9 minutes ::no The other four all attach the 95 to the wrong thing. Two of them talk about deliveries, which the interval never claimed anything about, and we are about to measure how badly that reading fails. One attaches a probability to a pair of fixed numbers, which leaves nothing for the probability to be about. And 95 percent confidence is not a 5 percent margin of error: those are separate ideas that happen to share a number.

=== step === tryit
::eyebrow Your turn
## Turn the dial down to 80

If 95 percent confidence really is nothing but the catch rate of the recipe, then asking for a different rate should hand you exactly that rate. Test it.

`week_catches()` takes a `level` argument that feeds straight into the multiplier. Ask it for 80 percent confidence and see what fraction of the ten thousand weeks get caught.

```r
set.seed(11)
mean(replicate(10000, week_catches(level = ____)))
```
::check {"regex":"level\\s*=\\s*0?\\.8","gate":true,"difficulty":"intermediate","ok":"0.8028, which is 80 percent to within the noise of ten thousand runs. The confidence level is not a description of how good your data are, it is a dial you set, and the recipe delivers whatever catch rate you dialled in. Ask for 80 and one interval in five will be wrong.","no":"The level goes in as a proportion rather than a percentage, so 80 percent is 0.80."}
::solution
```r
set.seed(11)
mean(replicate(10000, week_catches(level = 0.80)))
#> [1] 0.8028
```

=== step === concept
::eyebrow The other misreading
## Fewer than half the pizzas land inside it

Now for reading one, the one that says 95 percent of pizzas arrive between 22 and 30 minutes. This is the more tempting mistake of the two, because it is the reading a customer standing at the counter would naturally take, and it is the one Rosa's card invites.

We can measure how wrong it is exactly, because in the pretend world we know everything. Generate a hundred thousand individual deliveries and count how many fall inside her interval.

```r
set.seed(5)
all_deliveries <- rnorm(100000, mean = 27, sd = 6)

mean(all_deliveries >= 22.08 & all_deliveries <= 29.92)
#> [1] 0.47992
```

Just under **48 percent**. Barely half the pizzas arrive in the window on the card, so a customer who read it as a promise about their own order would find their pizza landing outside it more often than in it, sometimes early and often late.

Here is why, as a picture.

```r
hist(all_deliveries, breaks = 50, col = "grey85", border = "white",
     main = "100,000 individual deliveries",
     xlab = "delivery time in minutes")
abline(v = c(22.08, 29.92), col = "#b5631a", lwd = 3)
```

The two orange lines are Rosa's interval, and the mound of actual deliveries sprawls well past them on both sides. The interval was never trying to cover that mound. It was built from a standard error, which measures how far the **average of twelve** wanders, and averages wander far less than single deliveries do. That is the whole reason we divided by the square root of twelve back at the standard error step, and dividing by something makes the interval narrow, not wide.

So an interval for an average is narrow precisely because it is about an average. Read it as a range for one pizza and you will be wrong in the most predictable way possible.

=== step === concept
::eyebrow A different question
## A range for one pizza is a different interval

Suppose the question really is the customer's question. Not "where is the true average" but "how long is my pizza going to take". That question has an answer too, and it is a different interval with a different name.

An interval for a single new observation is called a **prediction interval**, and it has to swallow two separate sources of uncertainty. There is the uncertainty about where the true average sits, which is what we have been handling all along. On top of that there is the fact that any one delivery bounces around that average by roughly the full spread of the data, and no amount of extra measuring will calm that part down.

The formula picks up one extra term for it:

\\[ \\bar{x} \\pm t_{n-1,\\,0.975} \\cdot s \\sqrt{1 + \\frac{1}{n}} \\]

Compare that against the confidence interval from earlier and the difference is the \\(1 +\\) under the square root. The confidence interval had \\(s/\\sqrt{n}\\), which is \\(s\\sqrt{1/n}\\) written differently, and it shrinks toward nothing as \\(n\\) grows. The prediction interval keeps a whole \\(s\\) in there no matter how much data you gather, because the next delivery is its own event.

```r
avg + c(-1, 1) * t_crit * spread * sqrt(1 + 1 / n)
#> [1] 11.8782 40.1218
```

**12 to 40 minutes.** That is the honest answer to the customer's question, and it is nearly four times as wide as the card. Rosa could time ten thousand deliveries and that interval would barely tighten, because most of its width is the ordinary variability of making and driving a pizza, not uncertainty about the average.

Two questions, two intervals, and a factor of four between them. Choosing the wrong one is not a rounding error.

=== step === quiz
::eyebrow Check yourself
## Which interval answers which question

A customer at the counter asks Rosa how long their pizza will take. Rosa has both intervals in front of her: the 95 percent confidence interval for the average, 22.1 to 29.9 minutes, and the 95 percent prediction interval for one delivery, 11.9 to 40.1 minutes. What should she say, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Quote 22 to 30, because that is the 95 percent interval and the customer is asking about a delivery
- Quote 22 to 30, because the prediction interval is only for statisticians
- Quote something like 12 to 40, because the customer is asking about their one delivery and only the prediction interval covers where a single delivery lands ::ok Right, and the giveaway is what the customer is asking about. One pizza, theirs. The confidence interval is about the average of all deliveries, which is why fewer than half of individual pizzas fall inside it. In practice Rosa would probably quote the average and a rough range, but if she wants a range that is right 95 percent of the time for the person in front of her, it is the wide one.
- Take the average of the two intervals, since the truth is usually somewhere in the middle ::no The first two both hand a customer an interval about an average, which is exactly the mistake that leaves them disappointed about half the time, and the prediction interval is not an advanced variant of the same thing but an answer to a different question. Averaging the two is not a thing: they are not competing estimates of one quantity, they are answers to two questions, and mixing them gives an interval that answers neither.

=== step === concept
::eyebrow Width
## What makes an interval narrow

An interval that runs from 22 to 30 is not much use if Rosa wants to know whether her drivers got faster this month. So what would make it tighter?

Look at the recipe again. The width is twice the margin, which is

\\[ 2 \\cdot t_{n-1,\\,0.975} \\cdot \\frac{s}{\\sqrt{n}} \\]

so there are exactly three things in it that can move: the multiplier, which is set by the confidence level and by how much data you have, the spread \\(s\\), which is a fact about the kitchen, and the sample size \\(n\\) sitting under a square root.

Only one of those is really under Rosa's control, so measure what it buys. For each sample size we run five hundred weeks and average the widths, because a single week's width is itself noisy.

```r
average_width <- function(size) {
  widths <- replicate(500, {
    week <- rnorm(size, mean = 27, sd = 6)
    diff(t.test(week)$conf.int)
  })
  mean(widths)
}

set.seed(19)
round(sapply(c(12, 48, 192, 768), average_width), 2)
#> [1] 7.39 3.45 1.71 0.85
```

`diff()` on a pair of numbers gives the distance between them, so `diff(t.test(week)$conf.int)` is that week's interval width. `sapply()` runs `average_width()` once for each of the four sample sizes and collects the four answers.

Every step in that list multiplies the sample size by four, and every step roughly halves the width: 7.39, then 3.45, then 1.71, then 0.85. Four times the deliveries buys you half the width, and nothing else.

That is the square root doing it. Since \\(n\\) sits under \\(\\sqrt{\\phantom{n}}\\), multiplying \\(n\\) by four multiplies the square root by two, which divides the width by two.

[NOTE]
The first jump, 7.39 down to 3.45, is a fraction better than exactly halving. That is the multiplier moving too: with 12 deliveries `qt()` hands back 2.20, and with 48 it hands back 2.01, so the smallest sample was paying a penalty for its shaky estimate of the spread that the bigger samples do not pay.

=== step === concept
::eyebrow The trade
## Confidence is bought with width

The other dial is the confidence level, and it is worth seeing all three on the same twelve deliveries at once.

```r
levels_to_try <- c(0.80, 0.95, 0.99)
by_level <- sapply(levels_to_try,
                   function(level) t.test(deliveries, conf.level = level)$conf.int)
colnames(by_level) <- paste0(levels_to_try * 100, " percent")

round(by_level, 1)
#>      80 percent 95 percent 99 percent
#> [1,]       23.6       22.1       20.5
#> [2,]       28.4       29.9       31.5

round(apply(by_level, 2, diff), 1)
#> 80 percent 95 percent 99 percent 
#>        4.9        7.8       11.1
```

`sapply()` builds one interval per confidence level and stacks them into columns, `colnames()` labels those columns so the printout is readable, and `apply(by_level, 2, diff)` walks across the columns taking each one's width.

Same twelve deliveries every time. Same 26-minute average. The 80 percent interval is 4.9 minutes wide and wrong one time in five; the 99 percent interval is 11.1 minutes wide and wrong one time in a hundred. There is no setting that is both narrow and reliable, because the only way a recipe can be right more often is to hedge more.

Push that to its limit and the point is obvious. An interval of "somewhere between zero and infinity minutes" has 100 percent coverage and tells you nothing at all. Certainty is available, and it is worthless.

Which is also why an interval quoted without its level is not information. "The average is 26 plus or minus 4" is a different claim depending on whether that 4 came from the 80 percent dial or the 95 percent one, and here those two answers differ by nearly a minute and a half at each end.

=== step === concept
::eyebrow Planning ahead
## How many deliveries would Rosa need

Turn the question round. Instead of asking how wide her interval is, ask how much data would buy the width she wants.

Say Rosa wants to pin the average down to within a minute either way, so a margin of 1. Set the recipe's margin equal to 1 and solve for the sample size. If the margin is \\(t \\cdot s/\\sqrt{n}\\), then

\\[ n = \\left( \\frac{t \\cdot s}{\\text{margin}} \\right)^2 \\]

The only awkward bit is that the multiplier \\(t\\) depends on \\(n\\), which is the thing we are solving for. Since the answer is clearly going to be a decent-sized sample, use the multiplier for a large one and then check the answer afterwards.

```r
big_sample_multiplier <- qt(0.975, df = 999)
big_sample_multiplier
#> [1] 1.962341

ceiling((big_sample_multiplier * spread / 1)^2)
#> [1] 147
```

`ceiling()` rounds up, because you cannot time a fraction of a delivery. So about **150 deliveries**, using the spread of 6.16 minutes she measured on Tuesday as the best guess for the spread she would see again.

Check it, and put a few other sample sizes beside it so the shape of the trade is visible.

```r
half_width <- function(size) qt(0.975, df = size - 1) * spread / sqrt(size)

round(sapply(c(12, 50, 150, 600), half_width), 2)
#> [1] 3.92 1.75 0.99 0.49
```

At 150 deliveries the margin is 0.99 minutes, which is what she asked for. Read the rest of that row as a menu. Twelve deliveries pin the average down to about four minutes either way, fifty gets her to under two, and six hundred gets her to half a minute.

This is the calculation nobody does, and it is the one that decides whether an experiment was worth running. A study too small to answer its question does not usually announce itself: it just comes back with an interval wide enough to be compatible with almost anything, and by then the data are collected. Part 4 of this course is entirely about doing this arithmetic before you start rather than after.

=== step === quiz
::eyebrow Check yourself
## Sizing the next study

Rosa's twelve deliveries gave a margin of about 3.9 minutes. She wants a margin of about 2 minutes instead. Roughly how many deliveries does she need to time?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- About 24, because halving the margin means doubling the data
- About 12 more, so 24 in total, and then a few extra for safety
- About 48, because the sample size sits under a square root, so cutting the margin in half takes four times the data ::ok Exactly, and the check in the previous step agrees: at 50 deliveries the margin comes out at 1.75 minutes, which is a shade better than she asked for. The square root is the whole story here. Halving a margin costs four times the data, and getting to a tenth of it costs a hundred times.
- It cannot be worked out without knowing the true average ::no The first two both assume the margin falls in step with the data, and it does not, because the sample size sits under a square root rather than standing on its own. Twenty four deliveries would get her to about 2.6 minutes, not 2. And the true average is not needed for this at all: the width depends on the spread and the sample size, never on where the average happens to sit.

=== step === concept
::eyebrow The fine print
## The recipe leans on something

Everything so far ran in a world where delivery times were symmetric, a tidy mound centred on 27 with as many fast deliveries as slow ones. Real delivery times are not like that, and Rosa knows it. A pizza cannot arrive in less than about ten minutes, because somebody has to make it, but it can absolutely take an hour when the driver hits traffic or the address turns out to be a fourth-floor flat with a broken buzzer.

So the real distribution is lopsided: a bunch of ordinary deliveries and a long tail of bad ones stretching off to the right. Build a more honest version of Rosa's world and look at it.

```r
set.seed(41)
real_world <- rlnorm(200000, meanlog = log(24), sdlog = 0.45)

round(c(average = mean(real_world), middle = median(real_world)), 1)
#> average  middle 
#>    26.5    24.0

round(quantile(real_world, c(0.5, 0.9, 0.99)), 1)
#>  50%  90%  99% 
#> 24.0 42.6 68.2
```

`rlnorm()` draws from a lognormal distribution, which is the usual stand-in for waiting times because it cannot go below zero and has a long right tail. `quantile()` reads off cut points: half the deliveries come in under 24 minutes, nine in ten under 42.6, and one in a hundred takes longer than 68 minutes. The average is 26.5 while the middle value is 24, and that gap between the two is exactly what lopsidedness means. A handful of hour-long deliveries drag the average above the typical experience.

```r
hist(real_world, breaks = 100, xlim = c(0, 80), col = "grey85", border = "white",
     main = "A more honest picture of delivery times",
     xlab = "delivery time in minutes")
abline(v = mean(real_world), col = "#b5631a", lwd = 3)
```

Now run the same coverage check as before in this world, so we can see what the lopsidedness costs.

```r
truth <- mean(real_world)

skewed_catches <- function(size) {
  week <- rlnorm(size, meanlog = log(24), sdlog = 0.45)
  half <- qt(0.975, df = size - 1) * sd(week) / sqrt(size)
  abs(mean(week) - truth) <= half
}

set.seed(23)
mean(replicate(10000, skewed_catches(12)))
#> [1] 0.9307

set.seed(23)
mean(replicate(10000, skewed_catches(400)))
#> [1] 0.9488
```

At twelve deliveries the recipe catches the truth **93.1** percent of the time rather than 95, so roughly one interval in fourteen is wrong instead of one in twenty. At four hundred deliveries it is back to 94.9, which is 95 for any practical purpose.

That is the honest summary of the fine print, and it is a good deal less dramatic than the warnings usually sound. The t interval assumes the average of your sample wanders symmetrically, lopsided data at small sample sizes break that assumption a bit, and the breakage shows up as slightly-too-confident intervals. It also heals as you gather more data, because averages of larger samples turn symmetric even when the data are not. That last fact has a name, the **central limit theorem**, and it is the reason the t interval survives contact with messy real numbers at all. The fix is more deliveries, not a different branch of mathematics.

=== step === concept
::eyebrow Where it really hurts
## One catastrophic delivery

The place small samples genuinely bite is not gentle lopsidedness. It is one bad number.

Suppose there had been a thirteenth delivery on Tuesday, the one where the driver went to the wrong street and then got stuck behind a bin lorry. Ninety five minutes.

```r
with_disaster <- c(deliveries, 95)

mean(with_disaster)
#> [1] 31.30769

round(t.test(with_disaster)$conf.int, 1)
#> [1] 19.2 43.4
#> attr(,"conf.level")
#> [1] 0.95
```

One delivery, and the average jumps from 26 to 31.3 while the interval blows out from a width of 7.8 minutes to a width of 24.2. Rosa's card would now have to say "somewhere between 19 and 43 minutes", which is close to useless.

Both things happened for the same reason. The average got dragged up by the outlier, and the standard deviation got dragged up even harder, because it squares distances before averaging them and 95 is a very long way from everything else.

Meanwhile, the middle value barely notices.

```r
median(with_disaster)
#> [1] 27
```

The **median**, the value with as many numbers above it as below, moves from 26 to 27. It does not care how far away the outlier is, only that it is on the high side.

So a natural thought is to build an interval for the median instead of the average, and describe the typical delivery rather than the arithmetic mean of a set that includes a disaster. Good idea. There is one snag: there is no neat `qt()` formula for the wandering of a median. Which brings us to the tool that does not need one.

=== step === quiz
::eyebrow Check yourself
## So is the recipe broken?

Rosa's real delivery times are lopsided, with a long tail of slow ones, and the coverage check in the honest world came back at 93.1 percent on twelve deliveries instead of 95. What should she actually do about that?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Stop using confidence intervals on delivery times, because the assumption behind the multiplier does not hold
- Drop the slowest deliveries before computing, since they are the ones bending the shape
- Keep using the interval, knowing it is a little more confident than it claims at twelve deliveries, and either time more deliveries or build a bootstrap interval instead ::ok Right on all three counts. The shortfall is real but small, one interval in fourteen wrong instead of one in twenty, and it healed to 94.9 percent by four hundred deliveries because averages of bigger samples turn symmetric even when the deliveries are not. So the practical fixes are more data or a method that does not lean on the assumption, and knowing the direction of the error is itself useful: the interval is slightly too narrow, not slightly too wide.
- Widen it to a 99 percent interval, which buys back the coverage the lopsidedness took away ::no Three of these overcorrect in different ways. Abandoning the tool throws away something that was 93 percent right and gets better with data. Deleting the slow deliveries is worse than the problem it fixes, because those deliveries are real events and a study of only the convenient ones answers a question nobody asked. And turning the dial to 99 confuses two separate things: the level sets the catch rate you are aiming for, whereas skew is about the recipe missing the rate it aimed at, so a 99 percent interval on lopsided data lands slightly under 99 in exactly the same way.

=== step === widget
::eyebrow A different route entirely
## Resample the twelve you have

The wandering we have been measuring all lesson came from drawing fresh samples out of a known world, and Rosa cannot do that. She has twelve numbers and no world to draw from.

Or does she? Her twelve deliveries are the best picture of her kitchen that anybody has. So treat them as a stand-in for the whole thing and draw fresh samples out of **them**, picking twelve at a time with replacement, meaning a delivery can be picked twice or three times or not at all.

Press Draw again a few times below. Each strip is one resample of Rosa's twelve deliveries.

::widget bootstrap-sample {"n": 12, "seed": 5, "tail": "Those deliveries sat this resample out entirely, while the blue ones got picked more than once."}

Every strip has twelve slots, the same twelve deliveries go in every time, and yet each strip is a different mix, because picking with replacement means some deliveries turn up twice and others get left out. The grey slots are the ones that got left out, and the widget calls them out-of-bag, which is the standard name for the leftovers of a draw like this. There are usually four or five of them, and that is the point: each resample is a plausible alternative version of Rosa's Tuesday, built out of nothing but the data she has.

This is called the **bootstrap**, after the phrase about pulling yourself up by your own bootstraps, which is exactly what it looks like it is doing. Do it five thousand times, take the average each time, and look at where those averages land.

```r
set.seed(29)
boot_averages <- replicate(5000, mean(sample(deliveries, replace = TRUE)))

quantile(boot_averages, c(0.025, 0.975))
#>     2.5%    97.5% 
#> 22.50000 29.33333
```

`sample(deliveries, replace = TRUE)` draws twelve deliveries from Rosa's twelve, with replacement, which is one strip from the widget above. `mean()` takes that resample's average, and `replicate()` does the whole thing five thousand times. `quantile(boot_averages, c(0.025, 0.975))` then reads off the value that 2.5 percent of the resample averages fell below and the value that 97.5 percent fell below, so 95 percent of them sit between the two.

**22.5 to 29.3.** The formula gave 22.1 to 29.9. Two completely different routes, one leaning on the t distribution and one leaning on nothing but resampling, and they land within half a minute of each other at both ends.

```r
hist(boot_averages, breaks = 40, col = "grey85", border = "white",
     main = "5,000 resamples of Rosa's twelve deliveries",
     xlab = "average of the resample, in minutes")
abline(v = quantile(boot_averages, c(0.025, 0.975)), col = "#b5631a", lwd = 3)
```

The histogram is the bootstrap's version of the wandering, and the orange lines cut off the middle 95 percent of it. Compare it with the twenty-thousand-week histogram from earlier and the shapes are cousins. One was built by drawing from the real world, which nobody can do, and this one was built by drawing from the data, which anybody can.

=== step === concept
::eyebrow Where it earns its keep
## A bootstrap for something with no formula

Matching the t interval is reassuring but not a reason to use the bootstrap. The reason is the median, and everything else that has no formula.

```r
set.seed(31)
boot_medians <- replicate(5000, median(sample(deliveries, replace = TRUE)))

quantile(boot_medians, c(0.025, 0.975))
#>  2.5% 97.5% 
#>    21    32
```

One word changed, `mean` became `median`, and out comes an interval for the typical delivery: **21 to 32 minutes**. There is no `qt()` recipe for that, and there did not need to be. The same trick works for a percentile, a trimmed average, a ratio, or any other number you can compute from a sample.

Look closely at those bounds, though, because they are suspiciously round. That is not a coincidence and it is worth understanding.

The median of twelve numbers is always the midpoint of the sixth and seventh values once they are sorted, so with only twelve distinct deliveries to draw from there is a short list of values the resampled median can possibly take. The bootstrap distribution ends up as a handful of spikes rather than a smooth mound, and the percentile cuts land on those spikes. With more data the lumpiness smooths out. With twelve it is visible, and it is a fair warning that a bootstrap interval from a very small sample is a rough instrument rather than a precise one.

[NOTE]
The bootstrap is not magic and it cannot rescue a sample that is too small or unrepresentative. It resamples the data you have, so if those twelve deliveries all came from a quiet Tuesday lunchtime, every resample is a quiet Tuesday lunchtime too. It handles awkward statistics, not awkward sampling.

=== step === tryit
::eyebrow Your turn
## A 90 percent bootstrap interval

Rosa wants the same bootstrap interval for her average delivery time, but at 90 percent confidence rather than 95.

The five thousand resample averages are already sitting in `boot_averages`, so nothing needs rerunning. A 90 percent interval leaves 5 percent hanging off each end instead of 2.5, so you just need different cut points. Fill in both blanks.

```r
quantile(boot_averages, c(____, ____))
```
::check {"regex":"0?\\.05\\s*,\\s*0?\\.95","gate":true,"difficulty":"intermediate","ok":"23.1 to 28.8, which pulls in by about half a minute at each end compared with the 95 percent version. Same five thousand resamples, same data, narrower interval, and a catch rate of 90 instead of 95. The trade is exactly the one the formula made a few steps ago, which is a good sign that both routes are computing the same idea.","no":"A 90 percent interval leaves 5 percent in each tail, so the two cut points are 0.05 and 0.95."}
::solution
```r
quantile(boot_averages, c(0.05, 0.95))
#>       5%      95% 
#> 23.08333 28.83333
```

=== step === concept
::eyebrow Back to part 2
## The interval and the p-value are one calculation

Rosa installs a routing app that claims to shave minutes off every trip. She times twelve more deliveries with it running.

```r
app_times <- c(21, 26, 19, 30, 22, 17, 25, 28, 20, 24, 23, 27)

mean(deliveries)
#> [1] 26

mean(app_times)
#> [1] 23.5
```

Two and a half minutes faster on average. That looks like a result, so put an interval on it.

```r
comparison <- t.test(deliveries, app_times)

round(as.numeric(comparison$conf.int), 2)
#> [1] -1.91  6.91
```

Handing `t.test()` two vectors compares their averages, and `as.numeric()` strips off the confidence-level label so the two bounds print on one clean line. The interval for the improvement runs from **-1.91 to 6.91 minutes**. So the app might be saving nearly seven minutes a delivery, or it might be costing her two, and twelve deliveries each way cannot tell the difference.

Note that zero is inside that interval, which means "the app changes nothing" is one of the stories her data are compatible with. Now ask part 2's question of the same data.

```r
round(comparison$p.value, 3)
#> [1] 0.25
```

A p-value of 0.25, comfortably above the conventional 0.05 line. When a p-value falls below that line people call the result **significant**, so this one is not, and on evidence like this nobody would claim the app had done anything. Those two facts, zero sitting inside the interval and the p-value sitting above 0.05, are not a coincidence and not two pieces of evidence. They are the same calculation read from two ends.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.20, "label": "how far out the routing app result sits"}

The hump is what pure chance produces when the app makes no difference at all, the horizontal axis measures how far out a result sits in units of the ordinary wobble, the orange lines mark Rosa's result, and the shaded area beyond them is the p-value. Her 2.5-minute gap works out at 1.19 on that scale, which is why the slider opens at its nearest notch of 1.20, where the readout says 0.230. That is a shade smaller than the 0.25 `t.test` reported, because the widget draws the idealised bell curve while `t.test` uses the slightly wider t distribution that twelve deliveries a side earns. Beside the number the widget prints "fail to reject H0", which is the formal way of saying the same thing: H0 is the no-difference story, and her result is too ordinary to rule it out. Either way she sits well inside the crowd.

A confidence interval is that same picture turned around: instead of fixing a story and asking how surprising the data are, it fixes the data and asks which stories would not be surprised by them.

The link is exact, and you can watch it. Build the interval at a confidence level of 1 minus her p-value.

```r
round(as.numeric(t.test(deliveries, app_times,
                        conf.level = 1 - comparison$p.value)$conf.int), 3)
#> [1] 0 5
```

The lower bound lands exactly on zero. That is the duality in one line: a value sits outside your interval at level \\(1 - \\alpha\\) precisely when a test of that value would come back with a p-value below \\(\\alpha\\). The p-value tells you whether zero is in or out. The interval tells you that and what else is in there with it.

=== step === concept
::eyebrow What would settle it
## The same gap, nine times the deliveries

The interval was wide because twelve deliveries a side is very little data, not because the app does nothing. Watch what happens when the same pattern holds up over more deliveries.

Suppose Rosa keeps timing and, after a few weeks, has 108 deliveries on each setup with exactly the same mix of times repeated. That is an artificial device to hold the numbers fixed while only the sample size grows, but it isolates the thing we want to look at.

```r
big_old <- rep(deliveries, 9)
big_new <- rep(app_times, 9)

length(big_old)
#> [1] 108

round(as.numeric(t.test(big_old, big_new)$conf.int), 2)
#> [1] 1.17 3.83

round(t.test(big_old, big_new)$p.value, 5)
#> [1] 0.00028
```

`rep(deliveries, 9)` repeats the twelve times nine times over, so the averages and the spread are untouched and only the count changes.

The gap is still 2.5 minutes, exactly what it always was. But the interval has tightened from "somewhere between losing two minutes and gaining seven" to "somewhere between gaining 1.2 and gaining 3.8", zero has dropped out of it, and the p-value has fallen from 0.25 to 0.00028.

Nothing about the app changed. What changed is how much Rosa knows, and the interval says so in minutes. That is the part a p-value alone cannot do: 0.00028 tells her the gap is real, while "1.2 to 3.8 minutes" tells her whether it is worth the subscription.

=== step === quiz
::eyebrow Check yourself
## Writing up the app result

Go back to the first version, the one with twelve deliveries each way, where the interval was -1.9 to 6.9 minutes and the p-value was 0.25. Rosa is texting her business partner about whether to keep paying for the app. Which message is honest?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The app makes no difference, the result was not significant, so cancel it
- On twelve deliveries each way the app looked 2.5 minutes faster, but the data are compatible with anything from 2 minutes slower to 7 minutes faster, so we need more deliveries before deciding ::ok Yes, and the thing that makes it honest is that it reports what was actually learned, which is that the test was too small to answer the question. Naming both ends of the interval puts the size of the uncertainty in front of the reader instead of hiding it behind the word significant, and it makes the next step obvious.
- The app saves 2.5 minutes per delivery, which is worth the subscription
- Keep the app running and cancel the moment the p-value goes above 0.05 ::no None of them survive contact with the interval. Saying the app makes no difference claims something the data cannot support, since a seven-minute saving sits comfortably inside the range her numbers allow. Reporting 2.5 minutes as the answer makes the opposite error and quietly drops the uncertainty. And watching a p-value until it says what you want is the stopping-rule trap from part 1: a number checked every day will eventually wander somewhere convenient, whatever is going on underneath.

=== step === concept
::eyebrow The habit
## Four questions to ask of any interval

::widget process-flow {"steps":[{"title":"An interval for what?","sub":"the average, a proportion, a difference, or one delivery"},{"title":"At what level?","sub":"no confidence level attached means it is not a claim"},{"title":"How wide, in units you care about?","sub":"would both ends lead you to the same decision?"},{"title":"Would the recipe hold up?","sub":"small sample, lopsided data, or one big outlier"}]}

Take them in order.

**An interval for what** catches the mistake Rosa's card invites and the one that trips up most readers, which is an interval about an average being read as a range for a single thing. Fewer than half her pizzas landed inside the card's window, and that gap is entirely explained by this question going unasked.

**At what level** sounds like bookkeeping and is not. The same twelve deliveries gave a width of 4.9 minutes at 80 percent and 11.1 at 99, so a bare "plus or minus" is not enough information to act on.

**How wide, in units you care about** is where the interval beats the p-value outright. Say both ends in the units of the decision. If one end means "cancel the subscription" and the other means "roll it out everywhere", the study has not finished, whatever the p-value says.

**Would the recipe hold up** is the one that needs judgement rather than arithmetic. With a dozen lopsided measurements the coverage is a little worse than advertised, and with one 95-minute outlier in the batch the interval stops describing anything useful. Neither is a reason to distrust intervals in general, and both are a reason to look at your actual numbers before quoting one.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour if you want to push past where this part stops.

- [Neyman, Outline of a theory of statistical estimation, 1937](https://royalsocietypublishing.org/doi/10.1098/rsta.1937.0005) - the paper that invented confidence intervals, and it is worth seeing that the long-run definition was deliberate from the very first page rather than a later hedge.
- [Morey and colleagues, The fallacy of placing confidence in confidence intervals, 2016](https://link.springer.com/article/10.3758/s13423-015-0947-8) - takes the misreadings apart with a worked example where the usual intuitions give badly wrong answers.
- [Hesterberg, What teachers should know about the bootstrap, 2015](https://www.tandfonline.com/doi/full/10.1080/00031305.2015.1089789) - the clearest account of when resampling works, when it does not, and why the percentile method is only the beginning.
- [Greenland and colleagues, Statistical tests, P values, confidence intervals and power, a guide to misinterpretations](https://link.springer.com/article/10.1007/s10654-016-0149-3) - twenty five specific misinterpretations pulled apart one at a time, roughly half of them about intervals.
- [R documentation for t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the function you used all lesson, including what `conf.level`, `var.equal` and `paired` actually change.

=== step === complete
## Part 3 complete

You built Rosa's card from twelve stopwatch readings, first by hand out of an average, a multiplier and a standard error, then in one line with `t.test()`, and both routes gave 22.1 to 29.9 minutes. Then you ran the recipe a hundred times over in a world whose true average you were allowed to see, watched eight of your hundred intervals miss it entirely, and counted properly across ten thousand weeks to get 0.9514.

That number is the whole definition. The 95 percent is the catch rate of the procedure, so it belongs to the method rather than to the two numbers on the card, which is why "there is a 95 percent chance the true average is between 22 and 30" quietly attaches a probability to something that is not random. And it is not a promise about pizzas either: fewer than half of them landed inside that window, because an interval for an average is narrow precisely because averaging calms the wandering down. The customer's question needed the wide interval, 12 to 40 minutes, and no amount of extra data would tighten it much.

Along the way the width turned out to be entirely predictable. Four times the deliveries for half the width, higher confidence bought with more width, and about 150 deliveries to pin Rosa's average down to the minute. When the recipe's assumptions bent, under lopsided delivery times at twelve observations, coverage slipped to 93.1 percent and recovered by four hundred, and when one 95-minute disaster landed in the batch the bootstrap gave a way to build an interval for the median that no formula covers.

Which leaves the question that has been hovering over the last few steps. Rosa's app comparison came back with an interval running from two minutes slower to seven minutes faster, and the honest answer was that twelve deliveries a side could not settle it. So how many would? Part 4 is about answering that before you collect anything, which is the difference between an experiment that can succeed and one that was never going to.

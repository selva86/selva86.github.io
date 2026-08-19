---
title: "What p-values mean"
slug: "Inference-Mini-2"
description: "A p-value is not the chance your result was a fluke. Build one yourself from a real checkout test, then unlearn the readings almost everyone gets wrong."
keywords: "what p-values mean, p-value explained, p-value interpretation, null hypothesis, statistical significance, p-value in R, A/B test p-value"
mathjax: false
webr: true
date: "2026-08-19"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "2"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-1"
course_next: ""
curriculum_id: "0.0.2"
lesson_access: "windowed"
catalog_blurb: "What a p-value actually tells you, and the readings that are wrong."
---

=== step === cover
::eyebrow Inference from Zero
## What p-values mean

Let's say you test a new checkout page on your store.

A thousand shoppers land on the old page and 300 of them buy something. Another thousand land on the new page and 346 buy. That is 30.0% against 34.6%, so the new design is ahead by 4.6 percentage points. You run the test and it hands back p = 0.03.

You take the result to the team, and someone says the obvious thing: so there is a 3% chance the improvement was a fluke.

It does not mean that.

And that is not a beginner's slip. People who use p-values every week read them exactly that way. The real meaning is quieter and stranger: if the new page changed nothing at all, results this good would show up only 3% of the time by luck.

Little mind bending right? I know.

So we are not going to memorise that sentence. We are going to build the number ourselves, out of the actual 2,000 shoppers, and watch the 3% appear. There are only three moves in it.

::widget process-flow {"steps":[{"title":"Assume nothing changed","sub":"the new page is exactly as good as the old one"},{"title":"Replay on luck alone","sub":"shuffle the page labels 10,000 times, gap each time"},{"title":"Count the matches","sub":"how many luck-only gaps reached 4.6 points"}]}

That is the whole idea. Everything after this is just doing it, and then finding out what the number can and cannot say once you have it.

=== step === concept
## What did the checkout test actually measure?

Before anything clever, let's get the real numbers on the table, because every claim in this lesson gets checked against them.

Two thousand shoppers, split evenly. A thousand saw the old checkout page, a thousand saw the new one. Whether a person bought is recorded as a 1, and walking away is a 0.

Press Run.

```r
checkout <- data.frame(
  page   = rep(c("old", "new"), each = 1000),
  bought = c(rep(1, 300), rep(0, 700),    # old page: 300 of 1,000 shoppers bought
             rep(1, 346), rep(0, 654))    # new page: 346 of 1,000 shoppers bought
)

old_rate <- 100 * mean(checkout$bought[checkout$page == "old"])   # as a percent
new_rate <- 100 * mean(checkout$bought[checkout$page == "new"])   # as a percent
obs_gap  <- new_rate - old_rate                                   # percentage points

c(old = old_rate, new = new_rate, gap = obs_gap)
#>  old  new  gap
#> 30.0 34.6  4.6
```

`mean()` on a column of 1s and 0s is just the share of 1s, so `mean()` over the old page's rows is the old page's purchase rate. Multiplying by 100 turns 0.300 into the more familiar 30.0%.

So `obs_gap` is 4.6, and from here on that means 4.6 percentage points: the new page's rate minus the old page's rate. That one number is what the whole argument is about.

[NOTE]
4.6 percentage points is not the same thing as 4.6%. Going from 30.0% to 34.6% is a rise of 4.6 points, which is a 15% jump in purchases. Percentage points are the plain subtraction, and they are what we work in for the rest of this lesson.

=== step === concept
## What would have to be true for that gap to mean nothing?

Here is the move that makes p-values work, and it feels backwards the first time you meet it.

To argue the new page helped, you do not start by assuming it helped. You start by assuming the opposite, the most boring story anyone on that team could tell:

The new checkout page changed nothing. Not one shopper behaved differently because of it. The people who bought were always going to buy, and which page they happened to see is just a sticker somebody slapped on them afterwards.

That boring story has a name. It is the null hypothesis, written H0 and said out loud as "H nought". It is not what you believe. It is the story you are going to try to make look ridiculous.

Look at the raw counts it has to explain.

```r
table(page = checkout$page, bought = checkout$bought)
#>      bought
#> page    0   1
#>   new 654 346
#>   old 700 300
```

646 purchases in total, 346 sitting under the new label and 300 under the old. The boring story says that 346 against 300 split is nothing but the way the stickers happened to fall.

Fine. Then let's make the stickers fall again and see what they do.

=== step === concept
## What if we peel the stickers off and stick them back at random?

If the page label really is just a sticker, then we can peel all 2,000 of them off, drop them in a bowl, shake it, and stick them back on at random. Nobody's purchase changes. Only the labels move.

That is what `sample()` does here. It keeps the same 1,000 "old" and 1,000 "new" labels and deals them out to different people.

```r
set.seed(1)
shuffled_page <- sample(checkout$page)

shuffled_gap <- 100 * mean(checkout$bought[shuffled_page == "new"]) -
                100 * mean(checkout$bought[shuffled_page == "old"])
round(shuffled_gap, 3)
#> [1] -2.4
```

`set.seed(1)` just fixes which shuffle you get, so your number matches mine.

Now look at what came back. Minus 2.4 points. In a world we built by hand, where the labels are meaningless by construction, the old page still came out 2.4 points ahead.

That is the whole reason p-values have to exist. Luck does not hand you zero. Luck hands you a gap, sometimes a big one, and you cannot judge 4.6 points until you know how big luck's gaps usually get.

=== step === quiz
## Quick check: what does shuffling the labels do?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It makes the two groups identical, so the gap after a shuffle comes out at zero. ::no
- It breaks any real link between the page a shopper saw and whether they bought, so any gap left over is pure luck. ::ok That is it. The purchases never move, only the labels do. You are building the boring story on purpose so you can see what it produces.
- It removes the 46 extra purchases the new page earned, so the data no longer favours the new design. ::no
- It proves the new page had no effect. ::no Shuffling does not erase the gap and it does not prove anything. It rebuilds the data under the boring story, where the page label is a random sticker, so whatever gap turns up is luck and nothing else. That is exactly why one shuffle still handed back 2.4 points.

=== step === concept
## What do 10,000 luck-only worlds look like?

One shuffle is one world, and it told us luck can reach 2.4 points. To learn what luck usually does we need thousands of worlds, not one.

`replicate()` runs the same shuffle over and over and keeps the gap from each one. Ten thousand is plenty. It takes a few seconds.

```r
set.seed(1)
null_gaps <- replicate(10000, {
  shuffled_page <- sample(checkout$page)
  100 * mean(checkout$bought[shuffled_page == "new"]) -
    100 * mean(checkout$bought[shuffled_page == "old"])
})

hist(null_gaps, breaks = 40, col = "grey85", border = "white",
     main = "10,000 worlds where the page changed nothing",
     xlab = "Gap in percentage points (new minus old)")
abline(v = obs_gap, col = "red", lwd = 3)
```

That grey pile is the boring story drawn in full. Every bar is a batch of worlds where the new page did nothing whatsoever, and the height says how often luck produced a gap that size. Most of the pile sits near zero, which is what you would hope. The tails stretch out to about 8 points in either direction, and that is the part people underestimate.

The red line is our real result, 4.6 points. It is not off the chart. It sits out in the thin part of the pile, in territory luck reaches but does not visit often.

How often, exactly? That is now just a counting job.

=== step === concept
## So what is the p-value?

Count the luck-only worlds that did as well as the real test or better. The new page could have landed ahead or behind by chance, so we count gaps of 4.6 points or more in either direction, which is what `abs()` is there for.

```r
sum(abs(null_gaps) >= obs_gap)     # luck-only worlds that matched or beat 4.6 points
#> [1] 307
mean(abs(null_gaps) >= obs_gap)    # the same count as a share of all 10,000
#> [1] 0.0307
```

307 out of 10,000. As a share, 0.0307.

That is the p-value. No formula, no table in the back of a textbook. A count of luck-only worlds, divided by how many worlds you ran.

[KEY INSIGHT]
A p-value is the share of results, in a world where your change did nothing, that match or beat the result you actually got. Here: if the new checkout page changed nothing, a gap of 4.6 points or bigger would still turn up about 3 times in every 100 tests.

Read that sentence again and notice what it never says. It says nothing about how likely the new page is to be better. Every word of it lives inside the made-up world where the page did nothing.

=== step === widget
## What if the new page had won by more?

Take the grey pile from a moment ago and smooth it into a curve. Same shape: luck's gaps stacked around zero, thinning out as you move away in either direction.

The slider moves your real result away from zero. Its scale is not percentage points, it is noise widths: how many of luck's typical wobbles your gap sits from zero. Our 4.6-point gap works out at about 2.15 of them, which is where the slider starts.

::widget null-distribution {"tails": 2, "start": 2.15, "label": "how far the real gap sits from zero"}

The shaded orange area is the p-value: the share of luck-only results that reach out at least as far as yours, counted on both sides. At the starting position it reads about 0.03, the number we counted by hand.

Now drag it. Push your result further out, as if the new page had won by much more, and the shaded slice shrinks fast. Pull it back toward zero and the slice swells until nearly every luck-only world matches you.

So a result further from zero leaves a smaller slice, and a smaller slice is a smaller p-value. Hold on to that, because in a few minutes we are going to find out that "further from zero" is not the same thing as "a bigger win".

=== step === tryit
## Your turn: how often does luck reach 8 points?

`null_gaps` still holds all 10,000 luck-only gaps. Suppose the new page had come back 8 points ahead instead of 4.6. Count how many of those luck-only worlds reach 8 points or more in either direction, then write the same count as a share of 10,000.

```r
# null_gaps holds 10,000 gaps, in percentage points, from worlds
# where the page changed nothing.
# Count the ones that reached 8 points or more in either direction,
# then write that count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "abs[(]null_gaps[)]\\s*>=\\s*8", "gate": true, "difficulty": "beginner", "ok": "Yes: 1 world out of 10,000, a p-value of 0.0001. Luck almost never stretches to 8 points, so a gap that size would be very hard to wave away.", "no": "Reuse the counting line from two steps back and move the bar: `sum(abs(null_gaps) >= 8)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
sum(abs(null_gaps) >= 8)
#> [1] 1
mean(abs(null_gaps) >= 8)
#> [1] 1e-04
```

R prints that share as `1e-04`, which is its shorthand for 0.0001.

=== step === concept
## Is there a one-line shortcut?

Shuffling 10,000 times is the honest way to see what a p-value is. It is not how anyone computes one at their desk. For a two-page comparison like this, `prop.test()` does the job in one line with a formula instead of a bowl of stickers.

```r
prop.test(c(346, 300), c(1000, 1000))
#>
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(346, 300) out of c(1000, 1000)
#> X-squared = 4.6302, df = 1, p-value = 0.03141
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  0.004061424 0.087938576
#> sample estimates:
#> prop 1 prop 2
#>  0.346  0.300
```

Read the two arguments as "346 purchases and 300 purchases, out of 1,000 shoppers each".

The line to find is `p-value = 0.03141`. Our shuffling gave 0.0307. Two completely different roads, the same answer to two decimal places, and neither one is more correct than the other. The formula is faster. The shuffle is the one that shows you what the number actually is.

That `95 percent confidence interval` line matters more than the p-value does, and we come back to it at the end.

=== step === concept
## Why is the popular reading a different question?
::prose-only the point is a distinction between two probabilities read in opposite directions; the picture that carries it is the histogram already built two steps back

We have the number. Now the part that trips everyone.

Our p-value answers this question: if the page changed nothing, how often would luck hand us a gap of 4.6 points or more? Answer, about 3 times in 100.

The question people think it answers is this one: given the gap we saw, what is the chance the page changed nothing? That would be a wonderful thing to know. It is also a different question, and the p-value does not answer it.

Here is the same swap in a setting where your instincts are already good.

If it is raining, the pavement is almost certainly wet. Call it 100%. Now turn it around. If the pavement is wet, is it almost certainly raining? Not at all. Someone washed a car, a sprinkler ran, a pipe burst.

Two facts, two orders, two completely different numbers. "How likely is this evidence if the boring story is true" and "how likely is the boring story given this evidence" are not the same question, and flipping them is the single most common mistake made with p-values.

To answer the second one you would have to bring in something the test never asked you for: how plausible the change was before you ran it. Most checkout redesigns do nothing at all. A few help a lot. Your p-value has no idea which kind yours is, and it never claimed to.

=== step === concept
## So how do you say it correctly?

You do not need to memorise a definition. You need one sentence you can say in a meeting without being wrong. Here it is, filled in with our numbers:

"If the new page had changed nothing, a gap of 4.6 points or more would still show up in about 3% of tests. We saw one."

Notice the shape of it. It starts by assuming nothing changed, then talks about how often data like ours would appear inside that assumption. It never talks about the chance the page works.

Now put it next to what people actually say.

| What people say | Why it is wrong |
|---|---|
| "There is a 3% chance the win was a fluke." | Puts the probability on the truth. A p-value puts it on the data, inside a world where the win is already assumed to be nothing. |
| "There is a 97% chance the new page is better." | The same flip, dressed up. 1 minus the p-value is not the chance you are right. |
| "The new page lifts purchases by about 3%." | Confuses the p-value with the size of the win. The win is 4.6 points. 0.03 is how ordinary a win that size would be under luck alone. |

Keep the first sentence. Every one of the three is a version of asking a p-value a question it was never built to answer.

=== step === quiz
## Quick check: which reading of p = 0.03 is right?

The checkout test came back with a 4.6-point gap and p = 0.03. Which sentence reads it correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 3% chance the new page changed nothing. ::no
- There is a 97% chance the new page is genuinely better. ::no
- If the new page had changed nothing, a gap this big or bigger would turn up in about 3% of tests. ::ok Exactly right. It assumes the boring story first, then reports how ordinary our data would be inside it. That is the only direction a p-value ever runs.
- The new page lifts purchases by about 3%. ::no Three of these four put the probability on the truth, or on the size of the win. A p-value only ever says how often data like yours turns up when the change did nothing. The win here is 4.6 points, and 0.03 is how rare a win that size would be under luck alone.

=== step === concept
## Do two identical pages ever come back significant?

Suppose the store gets careless and ships the same page twice, painted two different colours. Both convert at exactly 32%. There is nothing to find, by construction.

One convention first, because the store is about to lean on it. Almost everybody draws a line at 0.05. A p-value under that line gets called statistically significant and the change gets shipped, and a p-value over it does not. Nothing in the arithmetic picks 0.05. It is a habit somebody started and everybody kept.

Now run that test 2,000 times, 1,000 shoppers a page each time, and look at the p-values that come back. `rbinom(1, 1000, 0.32)` is a quick way of saying "out of 1,000 shoppers who each buy with probability 0.32, how many bought this time".

```r
set.seed(9)
many_p <- replicate(2000, {
  old_buys <- rbinom(1, 1000, 0.32)
  new_buys <- rbinom(1, 1000, 0.32)
  prop.test(c(new_buys, old_buys), c(1000, 1000))$p.value
})

hist(many_p, breaks = 20, col = "grey85", border = "white",
     main = "2,000 tests of two pages that are truly identical",
     xlab = "p-value")
abline(v = 0.05, col = "red", lwd = 3)

sum(many_p < 0.05)
#> [1] 92
```

Two things to notice.

The histogram is flat. When nothing is going on, p-values do not bunch up near 1. They spread evenly across the whole range, so 0.02 turns up about as often as 0.72.

And 92 of the 2,000 tests came in under 0.05. Ninety-two announcements of a winning page, in a world where the two pages were identical every single time.

That is not a bug. That is the 0.05 line doing exactly what it was set up to do, which is to let a false alarm through about 5 times in 100. Here it let through 92 out of 2,000, which is 4.6%.

[WARNING]
A p-value under 0.05 cannot mean "the change worked", because here the change did nothing 2,000 times out of 2,000 and still cleared the bar 92 times. The threshold is a false-alarm rate you choose, not a fact about your page.

=== step === tryit
## Your turn: does a stricter bar cut the false alarms?

`many_p` holds those 2,000 p-values from tests where the two pages were truly identical, and 92 of them came in under 0.05. Suppose the store now insists on 0.01 before it will ship anything. Count how many of the 2,000 fall below 0.01, then write that count as a share.

```r
# many_p holds 2,000 p-values from tests where the two pages
# were identical.
# Count how many fall below 0.01, then write that count as a
# share of all 2,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "many_p\\s*<\\s*0?\\.01", "gate": true, "difficulty": "beginner", "ok": "Right: 12 out of 2,000, which is 0.006. Move the bar to 0.01 and the false alarms drop to roughly 1 in 100, because the bar you pick IS the false-alarm rate.", "no": "Same counting move as before with a stricter bar: `sum(many_p < 0.01)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
sum(many_p < 0.01)
#> [1] 12
mean(many_p < 0.01)
#> [1] 0.006
```

Whatever bar you choose becomes your false-alarm rate: 0.05 lets through about 5 in 100, and 0.01 about 1 in 100. Stricter is not free, though. A tighter bar also makes it harder to notice a change that really is there, which is the next thing worth seeing.

=== step === concept
## Does a smaller p-value mean a bigger win?

This one costs companies real money. A tiny p-value feels like a big win. It is not.

Watch what happens when the win never changes and only the traffic grows. The lift below is nailed at 0.6 percentage points, from 30.0% to 30.6%, far too small for the store to care about. The only thing that changes down the rows is how many shoppers saw each page.

```r
p_for_n <- function(n) {
  old_buys <- round(0.300 * n)
  new_buys <- round(0.306 * n)
  prop.test(c(new_buys, old_buys), c(n, n))$p.value
}

shoppers <- c(500, 5000, 50000, 200000)

data.frame(
  shoppers_per_page = formatC(shoppers, format = "d", big.mark = ","),
  lift_in_points    = 0.6,
  p_value           = format(signif(sapply(shoppers, p_for_n), 2),
                             scientific = FALSE, drop0trailing = TRUE)
)
#>   shoppers_per_page lift_in_points  p_value
#> 1               500            0.6     0.89
#> 2             5,000            0.6     0.53
#> 3            50,000            0.6     0.04
#> 4           200,000            0.6 0.000037
```

Read the middle column first. It never moves. The same feeble 0.6-point lift all the way down.

Now read the p-value column. At 500 shoppers a page it is 0.89, a number nobody would look at twice. At 200,000 a page it is 0.000037, the kind of number that gets a slide of its own.

Nothing about the win improved. The store just bought more traffic.

[KEY INSIGHT]
A p-value answers "can we see this at all", not "is this worth having". Given enough shoppers, a lift too small to matter will produce a p-value small enough to impress. How big the win is, is a separate question, and you have to ask it separately.

=== step === concept
## Would the same test say the same thing next week?

One habit left to break. It is natural to think of a p-value as a property of the change you made, so that running the test again would hand you roughly the same number.

It would not.

Here is the same store with the same real 4.6-point lift, genuinely present in every single run. The only thing that changes is which 200 shoppers a page happened to walk in. Twelve reruns:

```r
one_test <- function() {
  old_buys <- rbinom(1, 200, 0.300)
  new_buys <- rbinom(1, 200, 0.346)
  prop.test(c(new_buys, old_buys), c(200, 200))$p.value
}

set.seed(12)
round(replicate(12, one_test()), 3)
#>  [1] 0.001 0.915 0.392 0.672 0.832 0.512 0.743 1.000 0.009 0.534 0.054 0.529
```

Stare at those twelve numbers for a second. 0.001 in the first run. 1.000 in the eighth. The lift was identical in both.

Had the store run this once and seen 0.001, it would ship the new page and call the redesign a triumph. Run it once and see 1.000, and it would scrap the design as useless. Same truth, opposite decisions, settled entirely by which 200 shoppers turned up.

Only two of the twelve cleared 0.05. A real, worthwhile lift, missed ten times out of twelve, because 200 shoppers a page is not enough traffic to see a 4.6-point difference reliably.

[WARNING]
One p-value is a single draw from a wide spread, not a stable property of your change. A small p-value today is no promise that the next test will agree, and 1 minus the p-value is not the chance your result will repeat.

=== step === quiz
## Quick check: what does one p-value promise about the next test?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It promises the next test will land near the same p-value, since the lift itself has not changed. ::no
- Nothing dependable. Twelve reruns of the very same lift gave everything from 0.001 to 1.000, so one p-value is a single draw, not a forecast. ::ok Yes. That spread was not noise sitting on top of the answer, it was the answer itself wobbling, which is why one test rarely settles anything on its own.
- It promises the next test will clear 0.05 with probability 1 minus p, so p = 0.03 means a 97% chance of repeating. ::no
- Nothing at all, because p-values are meaningless numbers. ::no A p-value is a real and useful number: it tells you how ordinary your data would be if your change did nothing. What it cannot do is predict the next test. Those twelve reruns shared one true lift and still ran from 0.001 to 1.000, and 1 minus p is not a chance of repeating.

=== step === concept
## What should the store report instead?

The meeting is tomorrow and you have to say something about the checkout test. Lead with the two numbers that actually decide whether to ship, and let the p-value come last.

```r
ab_test   <- prop.test(c(346, 300), c(1000, 1000))
ci_points <- round(100 * ab_test$conf.int, 1)

cat("gap        :", obs_gap, "points\n")
cat("95% range  :", ci_points[1], "to", ci_points[2], "points\n")
cat("p-value    :", round(ab_test$p.value, 4), "\n")
#> gap        : 4.6 points
#> 95% range  : 0.4 to 8.8 points
#> p-value    : 0.0314
```

The gap, 4.6 points, is the size of the win in this test. That is the number the business cares about.

The range, 0.4 to 8.8 points, is the honest version of that win. It is the set of true lifts that sit comfortably with the data we collected. Ship the new page and the long-run gain could be as feeble as 0.4 points or as good as 8.8. That range is what tells you whether 2,000 shoppers was enough to bet on, and here it is telling you the answer is still pretty loose.

The p-value, 0.0314, comes last, and now you know exactly what it is. If the page changed nothing, we would see a gap this big about 3 times in 100.

[TIP]
Report the gap and the range first, the p-value last. A bare p-value hides the two things a decision actually needs: how big the win looks, and how much that answer could still move.

=== step === concept
## References

- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. The six-principle statement, including the flat "p-values do not measure the probability that the studied hypothesis is true".
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misreadings, catalogued and corrected one by one.
- [The New Statistics: Why and How](https://doi.org/10.1177/0956797613504966) - Cumming (2014), Psychological Science 25(1), 7-29. The source of the "dance of the p-values", the wobble you watched in the twelve reruns.
- [Moving to a World Beyond p less than 0.05](https://doi.org/10.1080/00031305.2019.1583913) - Wasserstein, Schirm and Lazar (2019), The American Statistician 73(sup1), 1-19.
- [Test of equal or given proportions](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html) - R Core Team, the documentation for `prop.test()`.

=== step === complete
## What you can now say out loud

You built a p-value out of nothing but a shuffle and a count, and then watched every popular reading of it come apart. Five lines worth keeping:

- A p-value is the share of luck-only worlds that match or beat your result. You counted yours: 307 out of 10,000.
- It assumes your change did nothing. Every p-value lives inside that made-up world.
- It is not the chance you are wrong. That question runs the other way, and the test never asked for what it would need to answer it.
- A smaller p-value is not a bigger win. Freeze a 0.6-point lift, buy more traffic, and p slides from 0.89 to 0.000037.
- One p-value is not a forecast. The same real lift handed back 0.001 and 1.000.

And the sentence to reuse, whenever someone asks what p = 0.03 means:

"If the new page had changed nothing, a gap this big or bigger would still show up in about 3% of tests. We saw one."

Next time a number like that lands on your desk, you will know precisely which question it answered, and which ones it did not.

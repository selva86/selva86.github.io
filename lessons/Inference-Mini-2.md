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
course_next: "Inference-Mini-3"
curriculum_id: "0.0.2"
lesson_access: "windowed"
catalog_blurb: "What a p-value actually tells you, and the readings that are wrong."
---

=== step === cover
::eyebrow Inference from Zero
## What p-values mean

Let's say you test a new checkout page on your store.

A thousand shoppers land on the old page and 300 of them buy something. Another thousand land on the new page and 346 buy. That is 30.0% against 34.6%, so the new design is ahead by 4.6 percentage points. You run a test and it hands back p = 0.03.

Now, you take the result to the team, and someone says this: so there is a 3% chance the improvement was a fluke.

The problem is it does not mean that.

And that is not just a beginner's slip. Even people who use p-values regularly read them that way. So, here is the right interpretation: if the new page changed nothing at all, results this good would show up only 3% of the time by luck.

Little mind bending right? I know.

So to trule understand and internalise p-values, we are not going to memorise anything. Instead, we are going to design and run the simulations ourselves, out of the actual 2,000 shoppers, and watch how the 3% comes and prove it ourselves. 

To do this, there are only three steps in involved.

::widget process-flow {"steps":[{"title":"Assume nothing changed","sub":"the new page is exactly as good as the old one"},{"title":"Replay on luck alone","sub":"shuffle the page labels 10,000 times, gap each time"},{"title":"Count the matches","sub":"how many luck-only gaps reached 4.6 points"}]}

That is the whole idea. Everything after this is just doing it, and then finding out what the number does and does not say experientially.

=== step === concept
## What did the checkout test actually measure?

Let's start with the problem and get the numbers on the table, because every computation we make from here on is based on them.

We want to test if the new checkout page does better. 

Two thousand shoppers took part in this experiment, split evenly between the two pages. A thousand of them saw the old checkout page and a thousand saw the new one. If a person bought something we mark that as a 1, and if they walked away we mark it as 0.

Press Run.

```r
# Create data and compute the checkout rate gap
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

So `obs_gap` is 4.6, and from here on that means 4.6 percentage points: the new page's rate minus the old page's rate.

[NOTE]
4.6 percentage points is not the same thing as 4.6%. Going from 30.0% to 34.6% is a rise of 4.6 points, which is a 15% jump in purchases. 

=== step === concept
## What would have to be true for that gap to mean nothing?

Here's what makes p-values work.

To argue the new page helped, you do not start by assuming it helped. You start by assuming the opposite: the new checkout page changed nothing. 

That is, not one shopper behaved differently on visiting the checkout page. The people who bought were always going to buy, and which checkout page they saw did nothing to inflence their behavior.

This assumption that there was no effect is called the **null hypothesis**, written H0 and said out loud as "H nought". This is going to be the base assumption to start with. And our job is to check if there is any evidence that makes it look ridiculous. 

Look at the raw counts it has to explain.

```r
# tabulate the counts of buyers and non-buyers by page
table(page = checkout$page, bought = checkout$bought)
#>      bought
#> page    0   1
#>   new 654 346
#>   old 700 300
```

So, 646 purchases in total, 346 purchases under the new checkout and 300 under the old. The null hypothesis says that 346 against 300 split is nothing significant.

Fine. Let's check it out for real. 

To do that, we will do something super intuitive: We pool all of the 2000 users in one single bucket and randomly sample 1000 + 1000 users into two groups: A and B.

That is, we are totally removing the labels of new vs old checkout users and treat all of them the same.

We do this random sampling 1000's of times. Then we measure how likely is it to get a 4.6% points increase if the groups were truly random. 

If is it highly unlikely, then we reject our null hypothesis.

Makes sense?

=== step === concept
## What if we peel the stickers off and stick them back at random?

So, If the page label (new vs old checkout) that we attached to each visitor really is just a sticker, then we can peel all 2,000 of them off. 

Put all the users in a bowl, shake it, and randomly split them at random into two groups. Now this group is not the original old vs new checkout. It is a randomly assigned mixture. And then we measure the conversion rates.

That is what `sample()` does here. It keeps the same 1,000 "old" and 1,000 "new" labels and deals them out to different people.

```r
# Shuffle the users and recalculate the gap
set.seed(1)
shuffled_page <- sample(checkout$page)

shuffled_gap <- 100 * mean(checkout$bought[shuffled_page == "new"]) -
                100 * mean(checkout$bought[shuffled_page == "old"])

round(shuffled_gap, 3)
#> [1] -2.4
```

`set.seed(1)` just fixes which shuffle you get, so your number matches mine.

Now look at what came back. Minus 2.4 points (or different based on the seed). In a world we built by hand, where the labels are meaningless by construction, the old page still came out 2.4 points ahead.

That is the whole reason p-values have to exist. 

Luck does not give you zero difference by default. Typically, Luck will still create a gap. Sometimes that gap could be a big one, and that's exactly why you cannot judge 4.6 points until you know how big luck's gaps can get.

=== step === quiz
## Quick check: what does shuffling the labels do?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It treats the two groups identical, so the gap after a shuffle comes out at zero. ::no
- It breaks any real link between the page a shopper saw and whether they bought, so any gap left over is pure luck. ::ok That is it. The purchases never move, only the labels do. You are building the boring story on purpose so you can see what it produces.
- It removes the 46 extra purchases the new page earned, so the data no longer favours the new design. ::no
- It proves the new page had no effect. ::no Shuffling does not erase the gap and it does not prove anything. It rebuilds the data under the boring story, where the page label is a random sticker, so whatever gap turns up is luck and nothing else. That is exactly why one shuffle still handed back 2.4 points.

=== step === concept
## What do 10,000 luck-only worlds look like?

We shuffled all the visitors and picked the two groups. This is one iteration that represents one world where there is truly no distinction in the behaviours of old and new checkout users. And we learnt the conversion rate difference can reach 2.4 points. 

So we can say, it is possible to see a rate difference of 2.4 by pure luck.

However, to learn what luck usually does we need thousands of worlds, not one.

The function `replicate()` in the code below runs the same shuffle over and over and stores the gap from each one. We do ten thousand iterations, which is plenty to generalize and it takes only a few seconds.

```r
# Do 10000 iterations of shuffling and recalculate gaps
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

Let's understand the output clearly. The grey pile you see is the null hypothesis outcomes. Every bar is a batch of worlds (iterations) where the new page did not impact checkout conversions, and the height says how often pure luck produced a gap that size. 

You can see most of the pile sits near zero, which is what you would hope. The tails (representing the large gaps in conversion rates that could occur purely by chance) stretch out to about 8 points in either direction. This is the part we want to understand: How rare is it to see a gap as large or larger than the 4.6 point gap we saw wearlier?

The red line is our real result, 4.6 points. It is not off the chart. It sits out in the thin part of the pile, indicating that such an occurence is indeed rare.

How often, exactly? Let's calculate that next.

=== step === concept
## So what is the p-value?

P-value by definition is the probability of obtaining test results at least as extreme as the observed results, assuming that the null hypothesis is true.

$$\text{p-value} = P(\text{Data or more extreme} \mid H_0 \text{ is true})$$

Let's connect this to the example we have at hand.

Assuming the null hypothesis is true implies our pure-luck world where all the new and old checkouts page visits are pooled in and randomly split. We have 10,000 such worlds (iterations)

So, to compute p-value, we count the pure-luck worlds that did as well or better than the real test. That is, count the number of iteration where the improvement was 4.6 or more and divide it by 10,000.

Why divide by 10000? Because that is the number iterations where null hypothesis is true.  

```r
# compute the p-value
sum(abs(null_gaps) >= obs_gap)     # luck-only worlds that matched or beat 4.6 points
#> [1] 307
mean(abs(null_gaps) >= obs_gap)    # the same count as a share of all 10,000
#> [1] 0.0307
```

307 out of 10,000. As a share, 0.0307.

That is the p-value. No formula, no table in the back of a textbook. A count of luck-only worlds that did as good or better than the test, divided by how many worlds you ran.

[KEY INSIGHT]
A p-value is the share of results, in a world where your change had no impact, that match or beat the result you actually got. Here: if the new checkout page changed nothing, a gap of 4.6 points or bigger would still turn up about 3 times in every 100 tests.

Read that sentence again and notice what it did not say. It never said anything about how likely the new page is to be better. It entirely pertains to the null hypothesis world where the new page did not have an incremental effect.

=== step === widget
## What if the new page performance was far better?

First, let's take the grey bars from the previous example and smooth it into a curve. This captures the same shape with the mean of the gaps stacked around zero, while also thinning out as you move away in either direction.

The slider simulates the scenarios when your test result moves. 

Its scale is not percentage points, it is noise widths because it is scaled to center around zero. This measures how many standard deviations your gap sits from the expected value. Our 4.6-point gap works out at about 2.15 of them, which is where the slider starts.

::widget null-distribution {"tails": 2, "start": 2.15, "label": "how far the real gap sits from zero"}

The shaded orange area is the p-value: which is the share of luck-only results that reach out at least as far as yours, counted on both sides. For our test result,  it reads at about 0.03, which is what we had calculated earlier.

Now drag it. Push your result further out, as if the new page had won out by a larger conversion rate, and the shaded slice keeps shrinking. Pull it back toward zero and the slice swells, meaning, the probability of getting as extreme a result or larger is higher and more likely.

So a result further from zero leaves a smaller slice, and a smaller slice is a smaller p-value. 

Hold on to that thought, because in a few minutes we are going to find out that "further from zero" is not the same thing as "a bigger win".

=== step === tryit
## Your turn: how often does luck reach 8 points?

The `null_gaps` still holds all 10,000 luck-only gaps. Suppose the new page had come back 8 points ahead instead of 4.6. Count how many of those luck-only worlds reach 8 points or more in either direction. Then, write the same count as a share of 10,000 (which is nothing but the p-value).

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
# Count the luck-only gaps that reach 8 points, then their share
sum(abs(null_gaps) >= 8)
#> [1] 1
mean(abs(null_gaps) >= 8)
#> [1] 1e-04
```

R prints that share as `1e-04`, which is its shorthand for 0.0001.

=== step === concept
## Is there a one-line shortcut?

Shuffling 10,000 times is the honest way to see what a p-value is. However, it is not how p-value is typically calculated. For a comparison like this, a function like `prop.test()` can do the job in one line of code.

```r
# Compare the two groups with a one-line test
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

The line to lookout for is `p-value = 0.03141`. Our shuffling gave 0.0307. 

Both the methods (shuffling and the one-liner) gives same answer to two decimal places, and neither one is more correct than the other. The formula is faster. The shuffle is the one that shows you what the number actually is.


=== step === concept
## Why is the popular reading a different question?
::prose-only the point is a distinction between two probabilities read in opposite directions; the picture that carries it is the histogram already built two steps back

We now know how to calculate the p-value, which is probability of seeing a result as extreme or larger given the null-hypothesis is true. Now, let's look at the common mistake that people make and compare it with the right approach, so we won't make that mistake in future.

What p-value answers is this: if the new checkout page had no impact, how often would pure-luck give an improvement of 4.6 points or more? The answer was about 3 times in 100.

However, the common mistake people make is the following. The question people think p-value answers is: "Given the result we saw, what is the chance the page had no impact?"

That would be a wonderful thing to know. But it is an entirely different question, and the p-value does not answer it.

Here is the same idea in a setting to make it easy to grasp.

If it is raining, the pavement is almost certainly wet. Call it 100%. Now turn it around. If the pavement is wet, is it almost certainly raining? Not at all.

Right?

Someone could have washed a car, a sprinkler could have made it wet or it could be a pipe burst.

If A caused B, it does not mean that B caused A as well. The same thing applies here too.

"How likely is this evidence if the boring story (H0) is true" and "How likely is the boring story (H0) given this evidence" are not the same question.

To answer the second one you would have to bring in something the test never asked you for: how plausible the change was (that is getting 4.6pp improvement) before you ran it. Most checkout redesigns do nothing at all. A few help a lot. 

The p-value thus computed has no idea of how good the checkout page is, and it never claimed to. 

=== step === concept
## So how do you interpret p-values and state it correctly?

You do not need to memorise a definition. You need one sentence you can say in a meeting without being wrong. Here it is, filled in with our numbers:

"If the new page had changed nothing, a gap of 4.6 points or more would still show up in about 3% of tests. We saw one."

In general: "If the null hypothesis is true, what is the probability of seeing the result (4.6 pp) or more?" 

Notice how it's put. 

It starts by assuming nothing changed, then talks about how often data like ours would appear inside that assumption. It never talks about the chance the page works.

Now here's are some common mistakes about p-values people usually make. 

| What people say | Why it is wrong |
|---|---|
| "There is a 3% chance the win was a fluke." | Puts the probability on the truth. A p-value puts it on the data, inside a world where there is no effect. |
| "There is a 97% chance the new page is better." | The same logic stated differently. 1 minus the p-value is NOT the chance you are right. |
| "The new page lifts purchases by about 3%." | Confuses the p-value with the size of the win. The win is 4.6 points. 0.03 is how ordinary a win that size would be because of luck alone. |


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

Let's suppose the store ships the same page twice by mistake. And both pages convert at exactly at the same rate of 32%. 

A common convention is, almost everybody set the threshold (α) to reject the null hypothesis at 0.05. If the computed p-value fall below 0.05, we reject the null hypothesis. That is, we reject the world where we assumed the new page did not have any effect and call it to be statistically significant.

Thereby, the change gets shipped. However, there is no fixed rule to always pick the threshold the be 0.05. It is a habit somebody started and everybody kept.

However, we may reduce α below 0.05 when dealing with high-stakes decisions, or massive datasets where standard thresholds flag too many noise findings.

Now let's run that test 2,000 times, in which 1,000 shoppers are sent to one page each time. The function `rbinom(1, 1000, 0.32)` simulates the number of people who may have bought when the underlying conversion rate is 0.32. 

It is a quick way of saying "out of 1,000 shoppers who each buy with probability 0.32, how many bought this time".

```r
# Simulate buys from two versions of checkout, compute p-values and plot
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

Here we are running 2000 experiments, where each experiment has 2000 people visiting the checkout. So, we have 2000 p-values here which are then plotted.

Two things to notice here.

The histogram is more or less flat. That is, when nothing is going on, p-values do not bunch up near 1. They spread evenly across the whole range, so 0.02 turns up about as often as 0.72.

And 92 of the 2,000 tests came in under 0.05. That is, ninety-two times we said, one page is better than the other, when that really wasn't the case.

That is not a bug. 

That is the 0.05 line doing exactly what it was set up to do, which is to let a false alarm through about 5 times in 100. Here it let through 92 out of 2,000, which is about 4.6%.

[WARNING]
A p-value under 0.05 cannot mean "the change worked", because here the change did nothing 2,000 times out of 2,000 and still cleared the bar 92 times. The threshold is just a false-alarm rate we are willing to accept, if you want to be more certain, you might want to pick an even lower threshold (α). 

Lowering 'α' effectively requires stronger evidence to reject the null hypothesis.

=== step === tryit
## Your turn: does a stricter bar reduce false alarms?

`many_p` holds those 2,000 p-values from tests where the two pages were actually identical, and the p-values of 92 of them still came in below 0.05. 

Suppose the store now insists on 0.01 before it will ship anything. Count how many of the 2,000 fall below 0.01, then write that count as a share.

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
# Count the p-values under 0.01, then their share
sum(many_p < 0.01)
#> [1] 12
mean(many_p < 0.01)
#> [1] 0.006
```

Whatever bar you choose becomes your false-alarm rate: 0.05 lets through about 5 in 100, and 0.01 about 1 in 100. 

Stricter is not to be taken for granted, though. A tighter bar also makes it harder to notice a change that really is there, which is the next thing worth seeing.

=== step === concept
## Does a smaller p-value mean a bigger effect?

This one could cost companies real money. A tiny p-value feels like a big win. It is not.

Watch what happens when only the traffic grows but the conversion rate never changes. Let's fix the lift at 0.6 percentage points, from 30.0% to 30.6%, far too small for the store to care about. The only thing that changes is how many shoppers saw each page.

```r
# Simulating p-values with traffic growth + same conversion rates 
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

Read the middle column first. The conversion rate remains constant. The same feeble 0.6-point lift for all scenarios.

Now read the p-value column. At 500 shoppers a page it is 0.89, whereas at 200,000 a page it drops to 0.000037.

How?

Because, with more experiments, we are more certain to confirm even small improvements. 

However, smaller p-value does not mean better performance. As you can see, all scenarios have the same conversion rate improvement of 0.6pp. Only the store just bought more traffic.

[KEY INSIGHT]
Given enough shoppers, a lift too small to matter will produce a p-value small enough to confirm. How big the win is, is a separate question, which we have to ask separately.

=== step === concept
## Would the same test say the same thing next week?

Let's break one more misconception. 

It is natural to think of a p-value as a property of the change you made, so that running the test again would give you roughly the same number.

It would not.

Here is the same store with the same real 4.6-point lift, genuinely present in every single run. The only thing changed here is which 200 shoppers a page happened to walk in. Let's repeat 12 times:

```r
# Simulate same scenario 12 times with 200 visitors each.
one_test <- function() {
  old_buys <- rbinom(1, 200, 0.300)
  new_buys <- rbinom(1, 200, 0.346)
  prop.test(c(new_buys, old_buys), c(200, 200))$p.value
}

set.seed(12)
round(replicate(12, one_test()), 3)
#>  [1] 0.001 0.915 0.392 0.672 0.832 0.512 0.743 1.000 0.009 0.534 0.054 0.529
```

Look at those twelve p-values for a second. 0.001 in the first run. 1.000 in the eighth. We get very different p-values, even though the lift was identical in both `new_buys` and `old_buys`.

Had the store run this once and seen 0.001, it would ship the new page and call the redesign a triumph. If they run it once again and see 1.000, they might scrap the design as useless. 

Same truth yet it gives different decisions, depends entirely on which 200 shoppers turned up.

Only two of the twelve cleared 0.05. 

Why is this happening?

Because 200 shoppers a page is not enough traffic to see a 4.6-point difference reliably.

So we must have sufficient number of participants in the test especially when the effect you want to measure is pretty small. That is a topic for another day.

[WARNING]
One p-value is a single draw from a wide spread, not a stable property of your change. A small p-value today is no promise that the next test will agree, and 1 minus the p-value is not the chance your result will repeat.

=== step === quiz
## Quick check: what does one p-value tell about the next test?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It promises the next test will land near the same p-value, since the lift itself has not changed. ::no
- Nothing dependable. Twelve reruns of the very same lift gave everything from 0.001 to 1.000, so one p-value is a single draw, not a forecast. ::ok Yes. That spread was not noise sitting on top of the answer, it was the answer itself wobbling, which is why one test rarely settles anything on its own.
- It promises the next test will clear 0.05 with probability 1 minus p, so p = 0.03 means a 97% chance of repeating. ::no
- Nothing at all, because p-values are meaningless numbers. ::no A p-value is a real and useful number: it tells you how ordinary your data would be if your change did nothing. What it cannot do is predict the next test. Those twelve reruns shared one true lift and still ran from 0.001 to 1.000, and 1 minus p is not a chance of repeating.

=== step === concept
## So what exactly should the store report instead?

The meeting is tomorrow and you have to say something about the checkout test. Lead with the two numbers that actually decide whether to ship, and let the p-value come last.

```r
# Compute confidence intervals and p-values
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

The range, 0.4 to 8.8 points, is the honest version of that win. It is the range of true lifts that could show up with the data we collected. Ship the new page and the long-run gain could be as feeble as 0.4 points or as good as 8.8. That range is what tells you whether 2,000 shoppers was enough to bet on, and here it is telling you the answer is still pretty loose.

[TIP]
Report the gap and the range first, the p-value last. A bare p-value hides the two things a decision actually needs: how big the win looks, and how much that answer could still vary.

=== step === quiz
## Quick check: the intern reads the printout

An intern runs the checkout test on a bigger store and comes back with this: "p = 0.04, so there is a 96% chance the new page is better. And it is under 0.05, so the lift is worth shipping."

Which part of that survives this lesson?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Both parts. That is the standard reading. ::no
- The 96% part is wrong, but under 0.05 does mean the lift is big enough to ship. ::no
- Neither. The p-value only says identical pages would produce a gap this size about 4 times in 100. Whether the lift is worth shipping is answered by the gap and its range, not by p. ::ok That is the whole lesson in two sentences. The p-value speaks about luck under the boring assumption, and the gap with its 95% range speaks about money.
- With a big store behind it, p = 0.04 cannot be a false alarm. ::no A p-value never gives the chance the page is better, and crossing 0.05 says nothing about size: with enough shoppers even a worthless 0.6-point lift drops to p = 0.000037. Size lives in the gap and its range.

=== step === tryit
## Your turn: run the whole read on the mobile test

The store now tests the same redesign on mobile. Two thousand shoppers per page this time: the old checkout gets 592 buys, the new one 663.

Run the one-line test, then report the same three lines the store report used: the gap in points, the 95% range, and the p-value last.

```r
# 2,000 shoppers per page on mobile: old page 592 buys, new page 663.
# Run prop.test on the two counts, then report the gap, the 95% range
# in points, and the p-value, in that order.
# Press Check when you have it.
```
::check {"regex": "prop\\.test\\s*[(]\\s*c\\s*[(]\\s*663", "gate": true, "difficulty": "intermediate", "ok": "That is the full read: a 3.55-point gap, a range from 0.6 to 6.5 points, and p = 0.0171. Solid enough to ship, with the honest spread stated.", "no": "Start exactly like the one-line shortcut: prop.test(c(663, 592), c(2000, 2000)), then pull conf.int and p.value the way the report did."}
::solution
```r
# Run the one-line test on the mobile numbers, report the three lines
mobile    <- prop.test(c(663, 592), c(2000, 2000))
ci_mobile <- round(100 * mobile$conf.int, 1)

cat("gap        :", round(100 * (663 - 592) / 2000, 2), "points\n")
cat("95% range  :", ci_mobile[1], "to", ci_mobile[2], "points\n")
cat("p-value    :", round(mobile$p.value, 4), "\n")
#> gap        : 3.55 points
#> 95% range  : 0.6 to 6.5 points
#> p-value    : 0.0171
```

=== step === quiz
## Quick check: the store tightens the bar to 0.01

After seeing 92 of 2,000 identical-page tests sneak under 0.05, the store decides nothing ships unless p is under 0.01. What did that move actually buy?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It removes false alarms: identical pages can no longer come back significant. ::no
- False alarms drop to about 12 in 2,000, and the price is that real lifts now need more shoppers to clear the stricter bar. ::ok Right, and both numbers came from this lesson: 92 of 2,000 slipped under 0.05, and 12 of 2,000 under 0.01. The bar you pick is the false-alarm rate you accept, and a stricter bar trades detection for it.
- It makes p-values stable, so the same test next week lands near the same number. ::no
- It guarantees that whatever ships has a lift big enough to matter. ::no The bar cannot do any of that: 12 of 2,000 identical-page tests still slip under 0.01, next week's p-value moves with whichever shoppers turn up, and no threshold measures size. What it does buy is a lower false-alarm rate, paid for in shoppers.

=== step === concept
## References

- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. The six-principle statement, including the flat "p-values do not measure the probability that the studied hypothesis is true".
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misreadings, catalogued and corrected one by one.
- [The New Statistics: Why and How](https://doi.org/10.1177/0956797613504966) - Cumming (2014), Psychological Science 25(1), 7-29. The source of the "dance of the p-values", the wobble you watched in the twelve reruns.
- [Moving to a World Beyond p less than 0.05](https://doi.org/10.1080/00031305.2019.1583913) - Wasserstein, Schirm and Lazar (2019), The American Statistician 73(sup1), 1-19.
- [Test of equal or given proportions](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html) - R Core Team, the documentation for `prop.test()`.

=== step === complete
## Quick recap

You built a p-value out manually from scratch, and then learnt the intuition behind all the important considerations and nuances that go with it. To summarize:

- A p-value is the share of luck-only worlds that match or beat your result. You counted yours: 307 out of 10,000.
- It assumes your change (the new checkout page) did not have an impact. Every p-value computation lives inside that made-up world.
- It is not the probability of not seeing the observed effect.
- A smaller p-value is not a bigger effect. It just makes it more certain. Freeze a 0.6-point lift, buy more traffic, and p reduces from 0.89 to 0.000037.
- One p-value is not a property of the change you made. The same real lift could give p-values of 0.001 and 1.000 with different participants.

So, whenever someone asks what p = 0.03 means:

"If the new page had no effect, an improvement this big or bigger would still show up in about 3% of tests. We saw one."

Next time you see a p-value, you will know precisely what question it answered, and which ones it did not. Congratulations! You made it through. Have a great day!

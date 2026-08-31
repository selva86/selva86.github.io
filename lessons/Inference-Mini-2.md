---
title: "What p-values mean"
slug: "Inference-Mini-2"
description: "A p-value is not the chance your result was luck. Build one by hand from a real checkout test in R, see where 0.03 comes from, and never misread one again."
keywords: "what p-values mean, p-value explained, p-value interpretation, null hypothesis, statistical significance, p-value in R, A/B test p-value, prop.test"
mathjax: true
webr: true
date: "2026-08-31"
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
catalog_blurb: "What a p-value really measures, and the three ways people misread it."
---

=== step === cover
::eyebrow Inference from Zero
## What p-values mean

A store has redesigned its checkout page and cannot tell whether the new one is any better. So for one week, every shopper who reaches the payment screen is sent to one version or the other, and by Friday a thousand shoppers have seen each one.

Here is what came back. On the old page, 300 of its 1,000 shoppers bought something. On the new page, 346 of them bought.

That is 30.0% against 34.6%, so the new design finished 4.6 percentage points ahead. You run a test on those counts and it prints p = 0.03.

Then, in the meeting, somebody says it out loud: "good, so we are only 3% likely to be wrong about this."

That is the wrong reading. It is also an easy one to fall into, because 0.03 does look like a small chance of something, and the only thing in that room anybody is uncertain about is whether the new page really won. So the number gets attached to the page, and the sentence sounds reasonable to everyone at the table.

So we are not going to memorise a better definition. We are going to build that 0.03 ourselves, out of the same 2,000 shoppers, with nothing but shuffling and counting. There are three moves to it.

::widget process-flow {"steps":[{"title":"Assume the page did nothing","sub":"the new checkout is exactly as good as the old one"},{"title":"Deal the labels out at random","sub":"reshuffle who saw which page, and measure the gap"},{"title":"Count the runs that reached 4.6","sub":"that count, over 10,000 runs, is the p-value"}]}

Notice there is no formula anywhere in that recipe. So let's carry it out, one move at a time, and then hold the number we built against the things people claim it says. By the end you will have counted your way to 0.03, checked it against what the standard test reports, and you will know exactly which question that number answered.

=== step === concept
## The checkout test and the 4.6-point gap

First, those 2,000 shoppers have to exist in R. Each row is one shopper and holds two facts: which version of the checkout page they landed on, and whether they bought. A purchase is a 1, walking away is a 0, and that is the whole coding scheme.

Press Run.

```r
# Build the two checkout pages and measure the gap between them
checkout <- data.frame(
  page   = rep(c("old", "new"), each = 1000),
  bought = c(rep(1, 300), rep(0, 700),      # old page: 300 of 1,000 shoppers bought
             rep(1, 346), rep(0, 654))      # new page: 346 of 1,000 shoppers bought
)

# The one measurement we will keep repeating: new page buyers minus old page
# buyers, converted to percentage points.
gap_points <- function(pages) {
  (sum(checkout$bought[pages == "new"]) - sum(checkout$bought[pages == "old"])) / 10
}

old_rate <- 100 * mean(checkout$bought[checkout$page == "old"])
new_rate <- 100 * mean(checkout$bought[checkout$page == "new"])
obs_gap  <- gap_points(checkout$page)

c(old = old_rate, new = new_rate, gap = obs_gap)
#>  old  new  gap
#> 30.0 34.6  4.6
```

Two things in there are worth a closer look.

First, `mean()`. Run it over a column of 1s and 0s and you get the share of 1s, so the mean over the old page's thousand rows is that page's purchase rate, 0.300. Multiply by 100 and you get the familiar 30.0%.

Second, `gap_points()`. It divides by 10 because each page was shown to exactly 1,000 shoppers, so one extra buyer is worth 0.1 of a percentage point. Counting whole buyers and then dividing keeps every answer sitting on that 0.1 grid, which will matter once we start comparing gaps with each other.

So `obs_gap` is 4.6, and from here on 4.6 always means 4.6 percentage points: the new page's purchase rate minus the old page's.

[NOTE]
4.6 percentage points is not the same thing as 4.6%. Going from 30.0% to 34.6% adds 4.6 points to the rate, but in sales it is a jump of about 15%, because 346 buyers against 300 is 15% more purchases. Percentage points compare the two rates directly, and that is what we want here.

=== step === concept
## The assumption every p-value starts from

When you want to argue the new page helped, the instinct is to start by assuming it helped. A p-value does the opposite. It starts by assuming the redesign changed nothing at all.

Take that literally for a second. It says every one of the 2,000 shoppers would have done the same thing on the other version. The people who bought were always going to buy, and the page in front of them made no difference to a single one of them.

This assumption of no effect is called the **null hypothesis**. It is written H0 and said out loud as "H nought", and we hold on to it until the data gives us a reason to drop it.

Here are the raw counts H0 has to account for.

```r
# Show the purchase counts on each page that the null hypothesis has to explain
table(page = checkout$page, bought = checkout$bought)
#>      bought
#> page    0   1
#>   new 654 346
#>   old 700 300
```

That is 646 purchases in all, 346 of them under the new page and 300 under the old. H0 says the 346 against 300 split is just the way the cards happened to fall.

If that is true, then the page label on each shopper is only a sticker. It sat on them, it did not change them. And a sticker that changes nothing can be peeled off and stuck on somebody else without harming the data one bit.

So let's do exactly that. Pool all 2,000 shoppers, take the 1,000 "old" stickers and the 1,000 "new" stickers, and deal them back out at random. Nobody's purchase moves, only the labels do.

What you get is a dataset that luck alone could have produced, which is precisely the world H0 describes.

```r
# Peel the page labels off, deal them back out at random, and remeasure the gap
set.seed(1)
shuffled_page <- sample(checkout$page)

gap_points(shuffled_page)
#> [1] -2.4
```

`set.seed(1)` fixes the random number generator so your shuffle matches mine.

Now look at that result, because this is the reason p-values have to exist at all. In a world where the labels are meaningless by construction, the old page still came out 2.4 points ahead. Luck does not hand you a clean zero. It makes gaps out of nothing, and sometimes big ones.

=== step === quiz
## Quick check: what shuffling the page labels does

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It makes the two groups identical, so the gap after a shuffle comes back as zero. ::no
- It cuts any real link between the page a shopper saw and whether they bought, while leaving every purchase where it is, so whatever gap survives is pure chance. ::ok Exactly. Not one purchase moves, only the stickers do. You are building the no-effect world on purpose, so you can see what it produces.
- It takes away the 46 extra purchases the new page earned, so the data no longer favours the new design. ::no
- It proves the new page had no effect on shoppers. ::no A shuffle does not flatten the gap and it does not settle anything by itself. It rebuilds the same 646 purchases under the assumption that the page label was a random sticker, so any gap left over is chance and nothing else. That is why the one shuffle you ran still came back at 2.4 points.

=== step === concept
## Ten thousand runs where the page changed nothing

One shuffle told us a 2.4-point gap is possible when nothing is going on. It cannot tell us how often a gap that size shows up, or whether luck ever stretches all the way to 4.6. For that we need thousands of runs, not one.

`replicate()` does the repeating. It runs the same shuffle over and over and keeps the answer each time, so 10,000 runs come back as 10,000 gaps.

```r
# Measure the gap in 10,000 runs where the page label means nothing
set.seed(1)
null_gaps <- replicate(10000, gap_points(sample(checkout$page)))

hist(null_gaps, breaks = 40, col = "grey85", border = "white",
     main = "10,000 runs where the page changed nothing",
     xlab = "Gap in percentage points (new minus old)")
abline(v = obs_gap, col = "red", lwd = 3)

# One number for how wide that pile is
sd(null_gaps)
#> [1] 2.071049
```

The grey pile is what luck on its own can do. Every bar collects the runs that landed on a similar gap, and the height of the bar says how often that happened.

Most of the pile sits over zero, and that makes sense. Deal the stickers out at random and each side usually ends up with about half of the 646 buyers. The tails run out to roughly 8 points in either direction, so on a bad day chance can travel a long way from zero. `sd()` puts a single number on that spread: a luck-only gap typically lands about 2.07 points away from zero. That spread is what one shuffle could never have told us.

The red line is our real result at 4.6 points. Look at where it lands. It is not off the edge of the chart, which would have made this easy. It sits out in the thin part of the pile, where chance only reaches now and then.

So how much of that pile is out at 4.6 or beyond? That is the number we want.

=== step === concept
## The p-value is a count divided by a total

The answer is a count. Nothing more complicated than that.

A run matches our result if its gap reached 4.6 points or more in either direction. Either direction, because before the week started we had not committed to which version would win. A 4.6-point win for the old page would have been just as impressive a piece of luck, so both tails of the pile go into the count.

```r
# Count the luck-only runs that matched or beat the real 4.6-point gap
sum(abs(null_gaps) >= obs_gap)     # how many of the 10,000 got that far
#> [1] 307
mean(abs(null_gaps) >= obs_gap)    # the same count written as a share
#> [1] 0.0307
```

That is 307 runs out of 10,000. As a share, 0.0307.

And that is the p-value. There was no formula involved and no textbook table either. It is a count of the no-effect runs that did as well as our real test or better, divided by how many runs we made.

In words: a p-value is the share of results, in a world where your change did nothing, that match or beat the result you actually got. Here is the same sentence in notation.

$$p = P(\text{a gap this big or bigger} \mid H_0 \text{ is true})$$

The vertical bar is read as "given that" or "assuming", and H0 is our no-effect assumption. So the whole expression lives inside that assumed world and never once steps outside it.

Shuffling is the honest way to see what the number is, but nobody computes p-values this way at work. For a comparison of two rates like this one, `prop.test()` does it in a single line.

```r
# Get the same p-value from the standard two-proportion test
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

Read the two arguments as "346 purchases and 300 purchases, out of 1,000 shoppers each". The line to find in the output is `p-value = 0.03141`. The rest of it reports the two purchase rates you already know and a range around the 4.6-point gap, which answers how big the win is rather than how ordinary it is.

Our shuffling gave 0.0307 and the formula gives 0.0314. They agree to two decimal places, and neither one is more correct than the other. They are two recipes for the same quantity, and the formula is just faster.

[KEY INSIGHT]
A p-value is the share of results, in a world where your change had no effect, that match or beat the result you actually got. For the checkout test: if the new page changed nothing, a gap of 4.6 points or bigger would still turn up about 3 times in every 100 tests.

=== step === concept
## Why p = 0.03 is not the chance the page did nothing
::prose-only the point is a single conditional probability read backwards, which has no picture of its own; the pile of luck-only runs already on the page is the picture it points at

Now that we have the number, look again at where it came from, because that is where every misreading falls apart.

Every one of those 10,000 runs was built by assuming the page changed nothing. That assumption was the input. It went in at the start, it was never tested, and nothing in that pile was ever free to say the redesign worked. A count made inside an assumed world cannot then turn round and judge the assumption.

So there are two questions here, and they run in opposite directions.

- How likely is data like ours, if the page changed nothing? That is the 0.03 we computed.
- How likely is it that the page changed nothing, given data like ours? On this one the p-value has nothing to say.

Here is the everyday version of the same thing. If it is raining, the pavement is almost certainly wet. Call it a near certainty.

Now turn the sentence around. The pavement is wet, so is it almost certainly raining? Not at all. Somebody washed a car, a sprinkler ran, or a pipe burst.

Conditional probabilities do not flip. Knowing the chance of wet pavement given rain tells you very little about the chance of rain given wet pavement, and to get that second one you would also need to know how often it rains where you are standing.

The p-value sits in the same spot. To answer "how likely is it that the page did nothing", you would have to know how often redesigns like this one work in the first place. Nobody asked that question, and no p-value carries the answer.

Which is why the three sentences people reach for in that meeting all fail, each in its own way.

| The sentence | Why it fails |
|---|---|
| "There is a 3% chance the win was luck." | Puts the probability on the truth. The 0.03 sits on the data, and only inside the assumed world where the page did nothing. |
| "We are 97% sure the new page is better." | The same error with a subtraction on top. One minus the p-value is not your level of confidence in the result. |
| "The new page lifts purchases by about 3%." | Reads the p-value as the size of the win. The win is 4.6 percentage points. The 0.03 is how ordinary a win that size would be on luck alone. |

=== step === widget
## Why more shoppers shrink the p-value on the same win

There is one more misreading, and this is the one that costs real money. Let's start with a picture of it.

Take the grey pile of luck-only gaps and smooth it into a curve. Same shape, same story. It heaps over zero, thins out as you move either way, and the whole area under it is 1.

What changes is the axis. It is no longer marked in percentage points but in noise widths, which is how many standard deviations from zero a result sits. We already measured that width on the shuffled gaps: 2.07 points. Divide our real gap of 4.6 by it and you get about 2.2, and that is where the slider starts.

The orange area is the p-value, the share of the curve out at your result or beyond, counted on both sides. At the starting position it reads 0.028, near enough to the 0.0307 we counted by hand, because the smooth curve stands in very well for the shuffled pile.

::widget null-distribution {"tails": 2, "max": 5, "start": 2.20, "label": "how far the real gap sits from zero, in noise widths"}

Now drag it and watch the orange. Push the result further out, as if the new page had won by more, and the shaded slice shrinks to almost nothing. Pull it back toward zero and the slice swells, because results that close to zero are the ones luck turns out all the time.

So further from zero means a smaller p-value. That much is safe.

Here is the trap. There are two completely different ways to get further from zero. You can win bigger, which is what everyone in the room assumes has happened. Or you can shrink the noise width, and you can shrink the noise width just by sending more shoppers through the test.

More traffic narrows the pile of luck-only gaps, so an unchanged win lands further out only because the axis underneath it got narrower.

So let's hold the win still and buy traffic instead. The lift is fixed at 0.6 percentage points, from 30.0% to 30.6%, far too small for the store to care about. The only thing that moves is how many shoppers saw each page.

```r
# Hold the lift at 0.6 points and change only how much traffic the test gets
p_at_traffic <- function(n) {
  old_buys <- round(0.300 * n)
  new_buys <- round(0.306 * n)
  prop.test(c(new_buys, old_buys), c(n, n))$p.value
}

shoppers <- c(500, 5000, 50000, 200000)

data.frame(
  shoppers_per_page = formatC(shoppers, format = "d", big.mark = ","),
  lift_in_points    = 0.6,
  p_value           = format(signif(sapply(shoppers, p_at_traffic), 3),
                             scientific = FALSE, drop0trailing = TRUE)
)
#>   shoppers_per_page lift_in_points  p_value
#> 1               500            0.6    0.891
#> 2             5,000            0.6    0.528
#> 3            50,000            0.6   0.0396
#> 4           200,000            0.6 0.000037
```

Read the middle column first, because it is the one that never moves. The same feeble 0.6-point lift sits in every row.

Now read the p-value column. At 500 shoppers a page it is 0.891, which nobody would look at twice. At 200,000 a page that same lift comes in at 0.000037, and a room full of people would call it overwhelming.

Between those two rows the checkout page did not get one shopper better. The store just bought more traffic.

[KEY INSIGHT]
Given enough shoppers, a lift too small to matter will produce a p-value small enough to celebrate. How big the win is, is a separate question that needs a separate number, and no p-value will ever answer it for you.

=== step === concept
## Where 0.05 comes from and what it lets through

At some point you have to actually decide something. The usual rule is a threshold, written as the Greek letter alpha and set at 0.05. If the p-value falls below it, you drop H0, call the result statistically significant, and ship the change.

So where did 0.05 come from? Nowhere in particular. Somebody proposed it, everybody adopted it, and nobody has managed to shift it since. There is no line in nature at 0.05.

What the threshold really is, is a false-alarm rate, and you can watch it behave like one. Suppose the store ships the same page twice by mistake, so both versions convert at 30% and the two are genuinely identical. Let's run that non-experiment 2,000 times.

`rbinom(1, 1000, 0.30)` does the work here. It asks: out of 1,000 shoppers who each buy with probability 0.30, how many bought this time? Two of those draws make one fake A/B test of a page against itself.

```r
# Run the old page against itself 2,000 times and collect every p-value
set.seed(9)
many_p <- replicate(2000, {
  page_a <- rbinom(1, 1000, 0.30)
  page_b <- rbinom(1, 1000, 0.30)
  prop.test(c(page_a, page_b), c(1000, 1000))$p.value
})

hist(many_p, breaks = 20, col = "grey85", border = "white",
     main = "2,000 tests of two pages that are truly identical",
     xlab = "p-value")
abline(v = 0.05, col = "red", lwd = 3)

sum(many_p < 0.05)
#> [1] 92
```

Two things in that output are worth a second look.

The histogram is flat. When nothing is going on, p-values do not bunch up near 1 the way you might hope. They spread evenly across the whole range, so 0.02 turns up about as often as 0.72. And that flatness is exactly why a fixed cutoff behaves like a rate. Slice a flat pile at 0.05 and you take about 5% of it.

Then, 92 of the 2,000 tests came in under 0.05. Ninety-two times, a room somewhere would have declared one page better than the other, when the two pages were the same page.

[WARNING]
A p-value under 0.05 cannot mean "the change worked". Here the change did nothing 2,000 times out of 2,000 and still cleared the bar 92 times, which is 4.6% of them. The threshold is not a fact about your data, it is the false-alarm rate you agreed to live with. Set it at 0.01 instead and you accept roughly 1 false alarm in 100, at the price of missing more of the changes that are genuinely there.

=== step === quiz
## Quick check: reading p = 0.03 out loud

The checkout test finished 4.6 percentage points ahead with p = 0.03. Which sentence says what that 0.03 means?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 3% chance the new page changed nothing. ::no
- There is a 97% chance the new page is genuinely better. ::no
- If the new page had changed nothing, a gap of 4.6 points or bigger would still appear in about 3% of tests. ::ok That is the one. It assumes the boring story first, then reports how ordinary our data looks inside it, and that is the only direction a p-value ever runs.
- The new page lifts purchases by about 3%. ::no Three of these four turn the p-value into something it has never been: a probability about the truth, or the size of the win. It is neither. It is the share of no-effect runs that match or beat what you saw. The win here is 4.6 percentage points, and the 0.03 is how often luck alone travels that far.

=== step === tryit
## Your turn: the p-value for a 2-point gap

`null_gaps` still holds all 10,000 gaps from the runs where the page label meant nothing, so you can move the bar and read off a different p-value without simulating anything again.

Suppose the new page had finished only 2 points ahead instead of 4.6. Count how many of those luck-only runs reach 2 points or more in either direction, then write that count as a share of 10,000. Two lines will do it.

```r
# null_gaps holds 10,000 gaps, in percentage points, from runs where the
# page label meant nothing.
# Count the ones that reach 2 points or more in either direction,
# then write that count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "abs[(]null_gaps[)]\\s*>=\\s*2", "gate": true, "difficulty": "beginner", "ok": "Right: 3,513 runs out of 10,000, a p-value of 0.3513. Luck alone reaches 2 points about a third of the time, so a 2-point win on its own would not tell you the page had done anything.", "no": "Reuse the counting line you built earlier and move the bar: sum(abs(null_gaps) >= 2), then the same line with mean() in place of sum()."}
::solution
```r
# Count the luck-only runs that reach a 2-point gap, then write it as a share
sum(abs(null_gaps) >= 2)
#> [1] 3513
mean(abs(null_gaps) >= 2)
#> [1] 0.3513
```

That is the swelling orange slice from the slider, counted out in real runs. Bring your result in toward zero and the share of chance runs that match it climbs fast, which is the same fact seen from the other side. Ordinary results are ordinary because luck produces them all the time.

=== step === concept
## References

- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. Six principles agreed by the American Statistical Association, including the flat statement that p-values do not measure the probability that the studied hypothesis is true.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misreadings, listed and corrected one at a time.
- [The New Statistics: Why and How](https://doi.org/10.1177/0956797613504966) - Cumming (2014), Psychological Science 25(1), 7-29. How far p-values scatter across repeats of one and the same true effect.
- [Test of equal or given proportions](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html) - R Core Team, the documentation for the one-line test used here.

=== step === complete
## Quick recap

You built a p-value out of 2,000 shoppers, one shuffle and a count, and then took it apart to see what it can and cannot carry.

- A p-value is a count divided by a total. Yours was 307 luck-only runs out of 10,000, which is 0.0307, and the standard test put the same quantity at 0.0314.
- Every one of those runs assumed the new page changed nothing. The assumption goes in at the start, so no p-value can ever report back on whether it holds.
- It is not the chance your win was luck, and one minus it is not your confidence in the win.
- It is not the size of the win either. Freeze a 0.6-point lift and buy traffic, and the p-value slides from 0.891 to 0.000037 without the page improving at all.
- The 0.05 line is a false-alarm rate you picked. Two identical pages cleared it 92 times in 2,000 tries.

So when somebody in the meeting asks what p = 0.03 means, one sentence survives all of this:

"If the new page had made no difference at all, roughly 3 tests in every 100 would still hand back a gap this big or bigger. Ours was one of them."

You built that number yourself instead of taking it on trust, so there is nothing mysterious left in it. Well done, and have a good day.

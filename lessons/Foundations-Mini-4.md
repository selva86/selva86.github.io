---
title: "Statistical vs practical significance: report both"
slug: "Foundations-Mini-4"
description: "With enough traffic any difference turns significant. Compute the win, its confidence interval and Cohen's d in R, and report both kinds of significance."
keywords: "statistical vs practical significance, practical significance, effect size, Cohen's d in R, confidence interval, p-value and sample size, smallest effect size of interest, prop.test in R"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "4"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: "Foundations-Mini-3"
course_next: ""
curriculum_id: "0.0.40"
lesson_access: "windowed"
catalog_blurb: "Why a real result can still be far too small to act on."
---

=== step === cover
::eyebrow Probability Foundations
## Statistical vs practical significance: report both

Let's say your site runs an A/B test on the signup button. Two million visitors see the old button, another two million see a new one, and the new button wins with p = 0.001.

That is about as strong as a result gets. So you take it to the team.

Then somebody asks how big the win was, and you go back and look. Signups went from 0.370% to 0.390%. That is two hundredths of a percentage point, or one extra signup for every five thousand visitors who walk in.

Would you rebuild the page for that?

Probably not. And the trap runs the other way too. A training programme that genuinely helps can come back from a small pilot at p = 0.08 and get thrown out on the spot.

So one number was never going to be enough. Every result gets asked two things: whether the effect is real, and whether it is big enough to change what you do. Here is what we are going to do with the button test.

::widget process-flow {"steps":[{"title":"Measure the win","sub":"how far the new button moved the signup rate"},{"title":"Measure how sure you are","sub":"the confidence interval around that win"},{"title":"Decide against a line drawn first","sub":"the smallest win worth shipping, fixed before the data arrives"}]}

We will run all three on the real numbers, and finish with the one sentence you can say in a meeting that carries all of it.

=== step === concept
## The button test, in real numbers

Let's get the numbers on the table first, because everything we compute from here uses them.

There are only four. Two million visitors were sent to each version of the button. The old button collected 7,400 signups and the new one collected 7,800. None of this is simulated, so the answer you get back is the answer the test really gave.

The R function for comparing two counts out of two totals is `prop.test()`. You hand it the two signup counts first and the two visitor totals second.

Press Run.

```r
# Set up the button test as it actually ran, and compare the two rates
visitors    <- 2000000   # visitors sent to each version of the button
old_signups <- 7400      # signups on the old button
new_signups <- 7800      # signups on the new button

button <- prop.test(c(new_signups, old_signups), c(visitors, visitors))
button
#>
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(new_signups, old_signups) out of c(visitors, visitors)
#> X-squared = 10.514, df = 1, p-value = 0.001185
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  7.890964e-05 3.210904e-04
#> sample estimates:
#> prop 1 prop 2
#> 0.0039 0.0037
```

The line to read is `p-value = 0.001185`. Against the usual 0.05 cutoff that is not a close call. It is about forty times past the bar. Said properly: if the two buttons were truly identical, a gap this big would still turn up in roughly one test in a thousand.

So the effect is real. That is the whole of what the test just told you, and it is a smaller claim than it sounds.

=== step === concept
## How big was the win?

The test answered one question. Now for the other one, which it never answers on its own: how far did the signup rate actually move?

That part is arithmetic you can do yourself. Turn each count into a rate, multiply by 100 so we are talking in familiar percentages, and subtract.

```r
# Measure the size of the win, in percentage points and in people
old_rate <- 100 * old_signups / visitors
new_rate <- 100 * new_signups / visitors
lift     <- new_rate - old_rate

c(old = old_rate, new = new_rate, lift = lift)
#>  old  new lift
#> 0.37 0.39 0.02

# the same win, counted as extra signups per five thousand visitors
5000 * (new_signups - old_signups) / visitors
#> [1] 1
```

0.370% became 0.390%. The win is `lift`, and from here on that means 0.02 percentage points.

[NOTE]
0.02 percentage points is not the same thing as 0.02%. Going from 0.370% to 0.390% is a rise of 0.02 points, which is a 5.4% increase in signups. Either way the number stays tiny: five thousand visitors have to walk in before that difference produces one extra signup.

=== step === concept
## The two questions, and which number answers which

Every result you report gets asked two questions, and mixing them up is the whole trap.

1. **Is the effect real?** Could a gap this big have come out of two identical buttons and pure luck? That is **statistical significance**, and the p-value answers it.
2. **Is the effect big enough to matter?** Would you change what you do because of it? That is **practical significance**, and the p-value has nothing to say about it at all.

Put the button test's two answers side by side and look at the distance between them.

```r
# Put the two answers side by side: how big the win is, and how sure we are
cat("how big is the win : ", lift, " percentage points\n", sep = "")
cat("how sure are we    : p = ", signif(button$p.value, 3), "\n", sep = "")
#> how big is the win : 0.02 percentage points
#> how sure are we    : p = 0.00118
```

Read the first line as a business number and the second as a statistical one. The evidence that the win exists is about as strong as evidence gets. The win itself is two hundredths of a point.

Both are true at the same time, and a report that gives you only the second one has left out the half you needed.

=== step === quiz
## Quick check: what did p = 0.001 tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 0.1% chance the win was luck. ::no
- The win is large, because a p-value that small only comes from a big effect. ::no
- If the two buttons were identical, a gap this big would still show up in about one test in a thousand. ::ok Exactly. It starts by assuming the two buttons are the same, then reports how ordinary our data would be inside that assumption. Notice it never mentions the size of the win.
- We can be 99.9% certain the new button is better. ::no Three of these four turn the p-value into something it is not: a probability about the truth, or a statement about the size of the win. It is neither. It only says how often data like ours turns up when the change did nothing, and the size of our win is a separate number entirely, 0.02 points.

=== step === concept
## Freeze the win, grow the traffic

Here is why that p-value came out so small, and it has almost nothing to do with the button.

We are going to hold the win at exactly 0.02 points and change one thing only: how many visitors saw each version. The old rate stays at 0.370% and the new one stays at 0.390% at every size, so the win never moves. Watch what the p-value does anyway.

```r
# Freeze the win at 0.02 points, change only the traffic, and watch p move
p_for_n <- function(n) {
  old_count <- 0.0037 * n            # 0.370% of n visitors
  new_count <- 0.0039 * n            # 0.390% of n visitors
  prop.test(c(new_count, old_count), c(n, n))$p.value
}

sweep_n <- c(10000, 100000, 1000000, 2000000)

sweep <- data.frame(
  visitors_per_side = formatC(sweep_n, format = "d", big.mark = ","),
  lift_in_points    = 0.02,
  p_value           = format(signif(sapply(sweep_n, p_for_n), 3),
                             scientific = FALSE, drop0trailing = TRUE)
)
sweep
#>   visitors_per_side lift_in_points p_value
#> 1            10,000           0.02   0.909
#> 2           100,000           0.02    0.49
#> 3         1,000,000           0.02  0.0222
#> 4         2,000,000           0.02 0.00118
```

Read the middle column first. It is 0.02 all the way down, because we built it that way. Every row describes the same feeble win.

Now read the p-value column. At ten thousand visitors a side the same win comes back at p = 0.909. At two million it is p = 0.00118, the result you would take to the team.

Nothing about the button changed between the first row and the last. All the company did was buy more traffic.

[KEY INSIGHT]
A p-value is a statement about how much data you collected as much as it is about the effect you found. Give it enough visitors and any difference at all, however small, will eventually clear 0.05. That is why the size of the win has to be reported as its own number.

=== step === tryit
## Your turn: find where the same win turns significant

`p_for_n` is still loaded, and it holds the win at 0.02 points for whatever traffic you give it. Somewhere between one hundred thousand visitors a side and two million, this same unchanged win crosses the 0.05 line.

Narrow it down. Run `p_for_n` over 200,000, 400,000, 600,000 and 800,000 visitors a side and round the answers to four places.

```r
# p_for_n(n) returns the p-value for the same frozen 0.02-point win at n
# visitors per side.
# Run it over 200000, 400000, 600000 and 800000, and round to 4 places.
# One line. Press Check when you have it.
```
::check {"regex": "p_for_n\\s*[()]", "gate": true, "difficulty": "beginner", "ok": "That is it: 0.3162, 0.1511, 0.0775 and 0.0411. The crossing sits between 600,000 and 800,000 visitors a side. Same win, same buttons, and the only thing that decided significance was how long the test was left running.", "no": "Reuse the sweep line and change the traffic: put the four numbers in a vector and hand them to sapply, like `round(sapply(c(200000, 400000, 600000, 800000), p_for_n), 4)`."}
::solution
```r
# Run the frozen 0.02-point win over four bigger traffic levels
more_n <- c(200000, 400000, 600000, 800000)
round(sapply(more_n, p_for_n), 4)
#> [1] 0.3162 0.1511 0.0775 0.0411
```

=== step === concept
## The confidence interval as the range of plausible wins

If the p-value cannot tell you how big the win is, something has to. `prop.test()` already computed it and printed it two lines under the p-value, in the raw proportion scale. Multiply by 100 to put it in the percentage points we have been using.

```r
# Pull out the confidence interval and read it in percentage points
ci <- 100 * button$conf.int

cat("the win   : ", lift, " points\n", sep = "")
cat("95% range : ", round(ci[1], 4), " to ", round(ci[2], 4), " points\n", sep = "")
#> the win   : 0.02 points
#> 95% range : 0.0079 to 0.0321 points
```

A **confidence interval** is the range of true wins that would sit comfortably with the data you collected. Our two million visitors a side are consistent with a real long-run win as small as 0.0079 points and as large as 0.0321.

Now notice that this one range answers both of our questions at once.

- **Is it real?** The range does not include zero. Every value in it is a win, so the effect is real. That is the same answer the p-value gave, said a different way.
- **Is it big enough?** Read where the range sits, not just which side of zero it is on. The most optimistic reading the data allows is three hundredths of a percentage point.

[KEY INSIGHT]
Whether an interval clears zero is the statistical question. Where the interval sits is the practical one. That is why the interval is worth more than the p-value: it carries both answers, and the p-value only carries one.

=== step === quiz
## Quick check: reading the interval 0.0079 to 0.0321

The button test returned a 95% confidence interval of 0.0079 to 0.0321 percentage points. Which sentence reads it correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 95% probability that the true win is 0.02 points. ::no
- The data are consistent with a true win anywhere from 0.0079 to 0.0321 points, so even the best case is a long way under a tenth of a point. ::ok Right, and the second half is the part that decides anything. The range clearing zero says the win is real. Where the range sits says it is tiny, and you would have known that even without the p-value.
- 95% of visitors fall between those two rates. ::no
- If we ran the test again, 95% of the results would land inside that range. ::no An interval is a range of plausible true values, given the data you collected. It is not a spread of visitors, not a promise about the next test, and not a probability attached to any single number inside it. Read it for two things: whether it clears zero, and where it sits.

=== step === concept
## The opposite mistake: a real effect at p = 0.08

So far we have had a real result that was too small to use. The mistake runs the other way just as often, and it costs more, because it throws away things that work.

A company pilots a new training programme on 44 employees, 22 in each group, and scores them on a 100-point assessment. The training genuinely helps. We know it helps, because we build the two groups ourselves with a real 6.4-point gap between them.

```r
# Build a small training pilot with a real 6.4-point gain, then test it
set.seed(4)
untrained <- rnorm(22, mean = 68,   sd = 9.8)   # the 22 who did not get the training
trained   <- rnorm(22, mean = 74.4, sd = 9.8)   # the 22 who did

pilot <- t.test(trained, untrained)
pilot
#>
#> 	Welch Two Sample t-test
#>
#> data:  trained and untrained
#> t = 1.8031, df = 40.538, p-value = 0.07881
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.5728836 10.0857555
#> sample estimates:
#> mean of x mean of y
#>  76.86883  72.11240
```

`t.test()` compares two averages the way `prop.test()` compared two rates. The trained group scored 76.9 against 72.1, so this pilot measured a 4.8-point gain, and it came back at p = 0.0788.

That is above 0.05. In most companies that is where the programme dies.

Look at the interval before you agree. It runs from minus 0.57 to plus 10.09 points. Yes, it includes zero, which is why the p-value missed. It also includes a ten-point gain, which would be an excellent training programme.

[WARNING]
Failing to reject is not the same as showing there is no effect. This pilot did not rule out zero, and it did not rule out a large benefit either. That is a statement about how little 22 people per group buys you, not a statement about the training.

=== step === concept
## Cohen's d, an effect size that does not grow with n

The button test and the training pilot are measured in different units, so their wins cannot be compared as they stand. Two hundredths of a percentage point against 4.8 assessment points is not a comparison, it is two unrelated numbers.

The fix is to measure each gap in standard deviations instead. Take the difference between the two averages and divide by how spread out the scores are.

\[ d = \frac{\bar{x}_1 - \bar{x}_2}{s_{pooled}} \qquad \text{where} \qquad s_{pooled} = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}} \]

That is **Cohen's d**. The top is the win. The bottom, the **pooled standard deviation**, is the two groups' spreads blended into one number, weighted by group size. The conventional reading is that 0.2 counts as a small effect, 0.5 as medium and 0.8 as large.

Here is the property that matters. Nothing in that formula counts your sample size, so collecting more data does not inflate d the way it deflates a p-value. Build it by hand and run it on both results.

```r
# Build Cohen's d by hand, then read both results in standard deviations
cohens_d <- function(x, y) {
  s_pooled <- sqrt(((length(x) - 1) * var(x) + (length(y) - 1) * var(y)) /
                   (length(x) + length(y) - 2))
  (mean(x) - mean(y)) / s_pooled
}

d_pilot <- cohens_d(trained, untrained)

# the button test scores each visitor 0 or 1, so its pooled sd is sqrt(p * (1 - p))
p_pool   <- (new_signups + old_signups) / (2 * visitors)
d_button <- (lift / 100) / sqrt(p_pool * (1 - p_pool))

cat("training pilot : ", round(d_pilot, 3), " standard deviations\n", sep = "")
cat("button test    : ", round(d_button, 4), " standard deviations\n", sep = "")
#> training pilot : 0.544 standard deviations
#> button test    : 0.0033 standard deviations
```

Now the two results can finally sit beside each other, and they land in the opposite order to their p-values.

The training pilot, the one that failed its test, is a solidly medium effect at d = 0.544. The button test, the one with p = 0.001 and four million visitors behind it, is 0.0033. That is more than a hundred and sixty times smaller, and about as close to nothing as an effect gets.

=== step === widget
## How much data a medium effect needs

The pilot did not fail because the training was weak. It failed because 22 people per group was never enough to catch an effect that size.

**Power** is the probability that a study finds an effect that is really there. It depends on how big the effect is and on how many people you measure, and the convention is to design for 80%. Set the toggle below to a medium effect and read off the sample size that buys you that.

::widget power-curve {}

A medium effect, which is what the training turned out to be, needs about 64 people per group. The pilot ran 22. At that size it had a bit better than a one in three chance of coming back under 0.05, so it was more likely to miss than to hit before a single score was recorded.

That is the fair reading of p = 0.0788. The study was too small to settle the question, and calling it a failed training programme blames the programme for the study's weakness.

=== step === quiz
## Quick check: what does p = 0.08 in the pilot mean?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The training does not work. ::no
- There is an 8% chance the training works. ::no
- The result is nearly significant, so rerun the pilot until p drops below 0.05. ::no Running a study again and again until it clears 0.05 manufactures a significant result out of luck alone, and the p-value it hands you no longer means anything. Rerunning is only sound when you set the size in advance and commit to it.
- The pilot was too small to separate this effect from luck, and its interval still allows a gain of up to 10 points. ::ok Exactly. A non-significant result from an underpowered study tells you about the study, not about the effect. With 22 per group and a medium effect, missing was always the likely outcome.

=== step === concept
## Draw the line before the data arrives

One piece is still missing. We keep saying 0.02 points is too small to ship, but too small compared to what?

If you decide that after seeing the result, you are not analysing any more, you are making excuses. So the number gets fixed first, before the test runs. It is called the **smallest effect size of interest**: the smallest win that would actually change what you do.

For the signup button the team set it at 0.05 percentage points, because below that the extra signups would not repay the cost of rebuilding and retesting the page. Now check the interval against that line.

```r
# Check the most optimistic true win against the line the team drew first
mcid <- 0.05          # smallest win worth rebuilding the page for, in points

best_case <- ci[2]    # the largest true win the data still allows
best_case < mcid
#> [1] TRUE
```

It comes back `TRUE`, and it is `TRUE` at the top of the interval, which is the strongest form the verdict can take. Even the most generous reading the data allows, 0.0321 points, falls short of the line the team drew before the test began.

So the button test gets a two-part answer, and both parts are needed: the win is real, and the win is too small to ship. That is a real decision, and you could not have reached it from p = 0.001.

[TIP]
Setting the line in advance rescues the opposite case too. If the training pilot's interval had sat entirely below the smallest gain the company cared about, p = 0.0788 or not, you could have called the programme not worth running. Instead it ran from minus 0.57 to plus 10.09, straddling the line and settling nothing. That is what "we need more data" actually looks like.

=== step === widget
## One result, four write-ups

The same analysis can be written up several ways, and they do not feel like the same strength of evidence at all. The cards below carry our button test numbers, worded the way research papers word them, because that is where reporting habits have been argued over hardest.

Pick whichever sentence looks like the strongest evidence to you, then read what the four of them are actually made of.

::widget report-four-ways {"studies":[{"label":"Signup button test","outcome":"signup rate","unit":"percentage points","n1":2000000,"n2":2000000,"m1":0,"m2":0.02,"sd":6.153,"mcid":0.05}]}

Not one number moved between those four cards. The difference is 0.02 points, the interval runs 0.0079 to 0.0321, and p is 0.001 in every one of them. What changed is how much of the result the reader was allowed to see.

The bare p-value version is the one that gets repeated in meetings, and it is the only one of the four that does not let you work out that the win is too small to ship.

=== step === concept
## The sentence to say in the meeting

You do not need to memorise any of this. You need one sentence you can say out loud without being wrong, and it has a fixed order: the effect first, the interval second, the p-value last.

Build it straight out of the stored results, so that nothing gets retyped by hand.

```r
# Print the reporting sentence straight from the stored results
cat("The new button lifted signups by ", lift, " percentage points ",
    "(95% CI ", round(ci[1], 4), " to ", round(ci[2], 4), "), p = ",
    signif(button$p.value, 3), ".\n", sep = "")
#> The new button lifted signups by 0.02 percentage points (95% CI 0.0079 to 0.0321), p = 0.00118.
```

Anyone who hears that sentence can make the decision themselves. They have the size, the uncertainty around the size, and the evidence that it is not zero, in that order.

Then one more sentence, because the numbers decide nothing on their own: "our line was 0.05 points, and the whole interval sits below it, so this is real and not worth shipping."

Three ways of saying it go wrong often enough to be worth naming.

| What people say | Why it is wrong |
|---|---|
| "There is a 99.9% chance the new button is better." | Puts the probability on the truth. A p-value puts it on the data, inside a world where the two buttons are identical. |
| "The new button lifted signups by 0.1%." | Reports the p-value as if it were the size of the win. The win is 0.02 points; 0.001 is how ordinary a win that size would be under luck alone. |
| "The result was highly significant." | Answers only the first question and stops. Highly significant with four million visitors tells you the sample was large, not that the win was. |

=== step === quiz
## Quick check: which write-up is complete?

The button test gave a 0.02-point win, a 95% interval of 0.0079 to 0.0321 points, and p = 0.00118. Which write-up lets a reader decide for themselves?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The new button performed significantly better than the old one (p = 0.00118). ::no
- The new button produced a highly significant improvement in signups across four million visitors. ::no
- Signups rose by 0.02 percentage points (95% CI 0.0079 to 0.0321), p = 0.00118, against a threshold of 0.05 points set before the test. ::ok Yes. Size, then uncertainty, then evidence, then the line it is being judged against. A reader can reach the ship or do-not-ship decision from that one sentence without asking you a single follow-up question.
- Signups rose by 0.02 percentage points, which is a 5.4% increase on the old rate. ::no Two of these report only the evidence and never the size, and the fourth reports only the size and never the uncertainty. A complete write-up carries the win, the range around the win, and the p-value, and the ones that leave a piece out are exactly the ones that hide whether the win is worth acting on.

=== step === tryit
## Your turn: run the whole workflow on a new test

A second experiment on the same site rewrote the checkout page. It ran smaller and faster: 60,000 visitors a side, 222 signups on the old checkout and 336 on the new. The team is judging it against the same 0.05-point line, which is still sitting in `mcid`.

Run the same three measurements you ran on the button. Build the test with `prop.test`, then print the win in percentage points, the confidence interval in percentage points, and the p-value.

```r
# The checkout rewrite: 60000 visitors a side, 222 signups on the old
# checkout and 336 on the new.
# Test it with prop.test, then print the win, the 95% interval in
# percentage points, and the p-value.
# Press Check when you have them.
```
::check {"regex": "prop[.]test[\\s\\S]*conf[.]int", "gate": true, "difficulty": "intermediate", "ok": "Well done. The win is 0.19 points, the interval runs 0.111 to 0.269, and p is 0.00000163. This test used a thirtieth of the traffic and still got a far smaller p-value, because this win is genuinely big: even the worst case in the interval, 0.111 points, sits above the 0.05 line. Real, and worth shipping.", "no": "Build the test first, then read the pieces off it: `rewrite <- prop.test(c(336, 222), c(60000, 60000))`, then `100 * rewrite$conf.int` for the interval in percentage points and `rewrite$p.value` for the p-value."}
::solution
```r
# Run the win, the interval and the p-value on the checkout rewrite
rw_n   <- 60000
rw_old <- 222
rw_new <- 336

rewrite <- prop.test(c(rw_new, rw_old), c(rw_n, rw_n))
rw_lift <- 100 * (rw_new - rw_old) / rw_n
rw_ci   <- 100 * rewrite$conf.int

cat("the win   : ", rw_lift, " points\n", sep = "")
cat("95% range : ", round(rw_ci[1], 3), " to ", round(rw_ci[2], 3), " points\n", sep = "")
cat("p-value   : ", signif(rewrite$p.value, 3), "\n", sep = "")
cat("worst case beats the 0.05 line: ", rw_ci[1] > mcid, "\n", sep = "")
#> the win   : 0.19 points
#> 95% range : 0.111 to 0.269 points
#> p-value   : 1.63e-06
#> worst case beats the 0.05 line: TRUE
```

0.370% became 0.560%, a win nearly ten times the button's, on a thirtieth of the traffic.

=== step === quiz
## Quick check: significant, but should you ship?

Both experiments cleared 0.05. The button test won 0.02 points with an interval of 0.0079 to 0.0321 and d = 0.0033. The checkout rewrite won 0.19 points with an interval of 0.111 to 0.269. The line, set in advance, is 0.05 points. What do you do?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Ship the checkout rewrite, whose whole interval clears the line, and drop the button change, whose whole interval falls short of it. ::ok That is the call, and notice how you made it: not from the p-values, which both cleared 0.05, but from where each interval sits against a line drawn before either test ran. The p-values only confirmed that neither win was luck.
- Ship both, because both cleared 0.05 and that is what significance is for. ::no
- Ship neither, because a p-value cannot tell you whether an effect is worth acting on. ::no
- Ship the checkout rewrite and rerun the button test, since d = 0.0033 is too small to be a real effect and something must have gone wrong. ::no d = 0.0033 is not an error, it is the finding: the button really did help, by an amount too small to be worth anything. And ruling on both tests by whether they cleared 0.05 collapses straight back into the mistake, because that is exactly the number that cannot tell a 0.02-point win from a 0.19-point one.

=== step === concept
## References

- [Using Effect Size, or Why the P Value Is Not Enough](https://doi.org/10.4300/JGME-D-12-00156.1) - Sullivan and Feinn (2012), Journal of Graduate Medical Education 4(3), 279-282. The short, readable case for reporting an effect size beside every p-value.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. Principle 5 is the one this rests on: a p-value does not measure the size or the importance of an effect.
- [Calculating and reporting effect sizes to facilitate cumulative science](https://doi.org/10.3389/fpsyg.2013.00863) - Lakens (2013), Frontiers in Psychology 4, 863. The practical guide to computing Cohen's d and its relatives, including which denominator to use.
- [Equivalence Testing for Psychological Research: A Tutorial](https://doi.org/10.1177/2515245918770963) - Lakens, Scheel and Isager (2018), Advances in Methods and Practices in Psychological Science 1(2), 259-269. How to set a smallest effect of interest in advance and test against it rather than against zero.
- [Test of equal or given proportions](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html) - R Core Team, the documentation for `prop.test()`, including how its confidence interval is built. The entry for `power.t.test()` sits alongside it.

=== step === complete
## Quick recap

You took one A/B test apart, found two different answers hiding inside it, and learned to report both.

- **Statistical significance** asks whether the effect is real. The p-value answers that and answers nothing else.
- **Practical significance** asks whether the effect is big enough to change what you do. Only the size of the win and its interval can answer that.
- Significance can be bought with traffic. The same frozen 0.02-point win went from p = 0.909 to p = 0.00118 on nothing but visitor numbers.
- A confidence interval carries both answers at once: whether it clears zero, and where it sits.
- **Cohen's d** puts a win in standard deviations, so it does not inflate with sample size. The button test came out at 0.0033 and the pilot that failed its test at 0.544.
- A non-significant small study has not shown there is no effect. The pilot's interval still allowed a 10-point gain.
- Fix the smallest win worth acting on before the data arrives, then check the whole interval against it.

So here is the sentence to carry out of here, with your own numbers in place of these:

"Signups rose by 0.02 percentage points (95% CI 0.0079 to 0.0321), p = 0.00118, against a threshold of 0.05 points set before the test."

Effect, then interval, then p-value, then the line you are judging it against. Say it in that order and nobody can mistake a real win for a useful one again. Nicely done, and enjoy the rest of your day.

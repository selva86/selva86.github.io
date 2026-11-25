---
title: "Experimental Design and A/B Testing Lesson 6: A/B tests and the cost of peeking"
catalog_blurb: "Why checking an A/B test every day inflates your false-alarm rate, and the fix."
description: "Dana checks Larkspur's A/B test every morning and stops at the first win. Simulation shows how much that habit inflates the false-alarm rate, and two fixes."
keywords: "A/B testing, peeking, repeated significance testing, false-positive rate, alpha-spending boundary, group sequential design, O'Brien-Fleming boundary, sample size, sequential monitoring, two-proportion z-test"
post_type: "LESSON"
curriculum_id: "4.120.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "6"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "Finding-the-Best-Settings-with-Fewer-Runs"
course_prev: "How-Big-a-Sample-Do-You-Actually-Need"
---

=== step === cover
## A/B tests and the cost of peeking

Today let's find out what happens when you watch an A/B test every single day instead of waiting for it to finish.

Larkspur Home Goods runs an online store, and Dana, the site's analyst, is testing a new green add-to-cart button against the current blue one. Every day for up to 30 days, 300 new visitors see the blue button and another 300 see the green one. Dana has a habit. She opens the results every morning, checks whether the green button is ahead, and the moment the test looks significant, she calls a winner and ships it.

Here's that habit, laid out one morning at a time.

::widget process-flow {"steps":[{"title":"Day 1","sub":"check the cumulative p-value"},{"title":"Day 2","sub":"check again"},{"title":"...","sub":"keep checking every morning"},{"title":"Day k","sub":"p below 0.05, stop and declare a winner"}]}

That is the whole shape of what Dana is doing. That habit has a real cost, and working out exactly how big it is, and what to do about it, is where we start.

=== step === concept
## The test Dana is actually running
::prose-only states the running example's numbers and the planned test; the first computed visual arrives next, with the single simulated look

Before looking at what checking early costs, let's be precise about the test itself.

Larkspur's store runs two versions of its add-to-cart button. Variant A is the current button, blue. Variant B is the new one, green. Every day, 300 new visitors are randomly sent to each variant, so by day 30 each variant will have seen up to 9,000 visitors in total.

To make this lesson's point as clean as possible, both buttons here truly convert at the same rate, 10%. Neither button is actually better. That's not something Dana knows. It's something we get to set up on purpose, so that anything the test calls a "win" is necessarily a false alarm, and we can measure exactly how often that happens instead of guessing.

The test Dana runs each day is a two-proportion z-test. It compares the cumulative conversion rate of variant B against variant A, using every visitor seen so far, not just that day's visitors. The test is two-sided, since Dana does not know in advance which button, if either, would do better, and she sets the usual significance level, alpha = 0.05.

That's the whole setup: two variants, 300 visitors a day each, both truly converting at 10%, checked daily with a two-sided z-test at alpha = 0.05. Now let's see what one honest look at that test costs.

=== step === widget
## What one honest look costs

Before Dana ever checks early, it's worth seeing what a single, honest look would show: the one look she originally planned, checking once, after all 30 days have run.

A two-proportion z-test compares the two variants like this.

\[ z = \frac{\hat p_B - \hat p_A}{\sqrt{\hat p (1 - \hat p)\left(\dfrac{1}{n_A} + \dfrac{1}{n_B}\right)}} \]

\(\hat p_A\) and \(\hat p_B\) are the two variants' observed conversion rates, and \(\hat p\) is their pooled rate, since under the null hypothesis the two are assumed equal. The further \(z\) sits from zero in either direction, the less the two observed rates look alike.

Let's simulate one honest run of Dana's planned day-30 test. Both variants truly convert at 10%, so whatever gap shows up is pure luck.

```r
# Simulate one honest look at Larkspur's planned day-30 result, with both buttons equally good
set.seed(55)
p_true <- 0.10     # both variants truly convert at 10%, so any "win" is a false alarm
n_total <- 9000    # 300 visitors per variant per day for 30 days
conv_b <- rbinom(1, n_total, p_true)   # green button, variant B
conv_a <- rbinom(1, n_total, p_true)   # blue button, variant A

p_pool <- (conv_b + conv_a) / (2 * n_total)
se <- sqrt(p_pool * (1 - p_pool) * (2 / n_total))
z_obs <- (conv_b / n_total - conv_a / n_total) / se
p_value <- 2 * (1 - pnorm(abs(z_obs)))

cat("conversions: B =", conv_b, " A =", conv_a, "\n")
round(c(z = z_obs, p = p_value), 3)
#> conversions: B = 932  A = 857 
#>     z     p 
#> 1.868 0.062 
```

Variant B happened to land 932 conversions against variant A's 857, enough to push \(z\) up to 1.868. The p-value that goes with it, 0.062, sits just above 0.05, so this run does not count as significant, even though variant B looks a little ahead. Both buttons are equally good by construction, and a run like this, where one of them edges ahead purely by luck, will happen often.

Here's that same \(z = 1.868\) marked against the distribution it is measured on.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.868, "label": "observed z, single look at day 30"}

Drag the slider and watch the shaded area change. That shaded area is exactly the p-value: the share of pure-luck results, under a true null, that would land as far from zero or farther. The further \(z\) sits from zero, the thinner the shaded tails get, which is why a bigger gap between the buttons would have reported a smaller p-value.

A single honest look like this spends exactly the risk Dana agreed to when she picked alpha = 0.05. Repeat the same look thousands of times, always under the same true null, and count how often it crosses the line.

```r
# Repeat that single honest look thousands of times under the true null and count false alarms
set.seed(21)
p_true <- 0.10
n_total <- 9000
alpha <- 0.05
z_crit <- qnorm(1 - alpha / 2)

false_alarm_once <- replicate(20000, {
  conv_b <- rbinom(1, n_total, p_true)
  conv_a <- rbinom(1, n_total, p_true)
  p_pool <- (conv_b + conv_a) / (2 * n_total)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_total))
  z <- (conv_b / n_total - conv_a / n_total) / se
  abs(z) > z_crit
})
round(mean(false_alarm_once), 3)
#> [1] 0.05
```

Out of 20,000 repeats, each one a fresh, honest single look at the planned day-30 result, 5.0% cross the line and get called significant, even though both buttons are exactly as good as each other in every single repeat. That matches the planned alpha of 0.05 almost exactly. One honest look, taken once, costs exactly the false-alarm rate Dana agreed to pay.

=== step === widget
## Why checking many times feels dangerous

So one honest look costs 5%. What happens if Dana looks more than once?

A first, simple way to think about this treats each daily check as if it were its own separate study on its own fresh batch of visitors, not another look at data that is still piling up. Picture k completely separate honest tests, each carrying its own alpha = 0.05 risk. The chance that at least one of those k tests comes back a false positive, even though every one of them is testing a true null, works out to

\[ 1 - (1 - \alpha)^k \]

because \((1 - \alpha)^k\) is the chance that every one of the k tests comes back clean, so one minus that is the chance that at least one of them does not.

At k = 5 separate tests, that already reaches 22.6%. By k = 30, it reaches 78.5%, nearly four tests out of five.

::widget multiplicity-sim {"kMax": 30, "kStart": 5, "alpha": 0.05, "nStudies": 4000, "corrections": ["none"], "seed": 29}

Drag the slider and watch the share of studies with at least one false positive climb. The dashed line is exactly the formula above, and the solid line is the same quantity measured by directly simulating thousands of these k-separate-test families, which is why the two track each other closely.

That climb is real, but it is not yet Dana's actual number. The formula above assumes k separate, independent studies, each on its own fresh batch of visitors. Dana's 30 daily checks are nothing like that. Each day she looks at the same accumulating data, just with 300 more visitors per variant stacked on top of what was already there. Day 2's look shares all of day 1's visitors, and day 30's look shares nearly all of day 29's. So this formula is an upper-bound intuition for why checking often is dangerous, not yet the real number for Dana's own test. Finding her actual number is next.

=== step === quiz
## Quick check: one look vs many

A colleague tells Dana: "It's fine to check the test every day, as long as you only act on it when p actually drops below 0.05." What's wrong with that reasoning?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Nothing. Acting only when p is below 0.05 keeps the overall false-alarm rate at 5%, no matter how many times you look. ::no
- Checking every day gives the accumulating data many separate chances to drift below 0.05 by pure luck at some point, even though nothing real is happening, so the overall false-alarm rate climbs well past the agreed 5%. ::ok Exactly. A single pre-planned look spends exactly alpha. But each extra look is another chance for the accumulating data to cross the line by chance alone, and those chances add up.
- The real problem is that 300 visitors a day is too small a sample. A bigger daily sample would keep the false-alarm rate from climbing. ::no A bigger daily sample makes each day's estimate more precise, but it does nothing about how many chances the test gets to cross the line. The inflation comes from how often you look, not from how much data each look has.
- Looking at the data even once invalidates the test completely, so Dana should never check results before the study is redesigned from scratch. ::no Looking at accumulating data is not forbidden by itself, and it does not ruin a test on its own. The problem is specifically stopping and declaring a winner the moment a look crosses the significance line, which is what inflates the false-alarm rate.

=== step === concept
## The exact cost of peeking this test

Now let's simulate Dana's actual procedure, not a stand-in for it. Every day for 30 days, 300 new visitors arrive for each variant, both converting at the true rate of 10%. Each day, Dana reruns the two-proportion z-test on everyone who has visited so far, and stops the moment \(|z|\) crosses 1.96, the two-sided critical value for alpha = 0.05.

```r
# Simulate Dana's actual daily-monitoring test: 300 new visitors per variant each day for 30
# days, both converting at 10%, stopping the first day the cumulative z crosses 1.96
set.seed(107)
p_true <- 0.10
n_day <- 300
days <- 30
alpha <- 0.05
z_crit <- qnorm(1 - alpha / 2)
day <- 1:days

first_stop_day <- function() {
  new_b <- rbinom(days, n_day, p_true)      # each day's new conversions, variant B
  new_a <- rbinom(days, n_day, p_true)      # each day's new conversions, variant A
  cum_b <- cumsum(new_b)
  cum_a <- cumsum(new_a)
  n_cum <- n_day * day
  p_pool <- (cum_b + cum_a) / (2 * n_cum)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_cum))
  z <- (cum_b / n_cum - cum_a / n_cum) / se
  crossed <- which(abs(z) > z_crit)
  if (length(crossed) == 0) 0 else crossed[1]
}

stop_day <- replicate(20000, first_stop_day())
check_days <- c(1, 5, 10, 15, 20, 25, 30)
false_alarm_by_day <- sapply(check_days, function(d) mean(stop_day > 0 & stop_day <= d))
data.frame(day = check_days, false_alarm_rate = round(false_alarm_by_day, 3))
#>   day false_alarm_rate
#> 1   1            0.049
#> 2   5            0.140
#> 3  10            0.190
#> 4  15            0.222
#> 5  20            0.247
#> 6  25            0.264
#> 7  30            0.279
```

`rbinom(days, n_day, p_true)` draws all 30 days of new conversions in one call, one per variant, and `cumsum()` turns that into the running total Dana would actually see each morning. The same pooled z-test from a few steps back then runs at every one of the 30 days, and `which(abs(z) > z_crit)[1]` finds the first day, if any, where it crosses the line, which is exactly the day that stops Dana from looking any further on that simulated run.

Reading down the table, 4.9% of the 20,000 simulated 30-day histories have already crossed the line by day 1, which matches the single-look number from a few steps back almost exactly, since on day 1 there is only one look to make. Keep letting Dana check, though, and the rate keeps rising. By day 5 it is 14.0%, by day 10 it is 19.0%, by day 20 it is 24.7%, and by day 30, with all 30 days of looks counted, 27.9% of these histories have crossed the line at least once. That is more than five times the 5% Dana agreed to pay.

That real number climbs nowhere near as fast as the 78.5% the independent-tests formula predicted for 30 separate looks, for exactly the reason flagged a step back: each day's look is not a fresh, independent chance, it is one more look at data that mostly already existed yesterday. Still, 27.9% is more than five times the false-alarm rate Dana thinks she is running, and that gap is the entire reason peeking is worth fixing.

=== step === concept
## Fix one: decide the sample size, and do not look

The first honest fix is the simplest one. Commit to the full 30 days and 9,000 visitors per variant before the test starts, and look exactly once, at the end, no matter what the data look like along the way.

That is the exact same procedure already simulated two steps back, the single honest look at day 30. Running it again makes the point plainly.

```r
# Commit to the full sample size up front, and look only once, at the end
set.seed(21)
p_true <- 0.10
n_total <- 9000
alpha <- 0.05
z_crit <- qnorm(1 - alpha / 2)

false_alarm_fixed <- replicate(20000, {
  conv_b <- rbinom(1, n_total, p_true)
  conv_a <- rbinom(1, n_total, p_true)
  p_pool <- (conv_b + conv_a) / (2 * n_total)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_total))
  z <- (conv_b / n_total - conv_a / n_total) / se
  abs(z) > z_crit
})
round(mean(false_alarm_fixed), 3)
#> [1] 0.05
```

Same code, same seed, same answer, 0.05. That is not a coincidence. Committing to one look at a fixed sample size and the single honest look from a few steps back are the same procedure, so of course they give the same false-alarm rate.

The cost of this fix is not statistical, it is practical. Dana cannot stop on day 6 even if variant B is already miles ahead, and she cannot stop on day 20 either, even if the gap between the two buttons has sat near zero the entire time. She has to run the full 30 days and wait for the one look she promised herself in advance.

=== step === concept
## Fix two: an alpha-spending boundary

The second honest fix lets Dana keep checking every day, but it changes what she compares each day's z to.

Instead of comparing every day's z to the same fixed 1.96, compare it to a boundary that depends on how far through the test Dana is. Early on, demand an almost impossibly large z before stopping. By the last day, relax back down to something close to the ordinary 1.96. This kind of boundary is called an alpha-spending boundary, because the overall false-alarm budget of 0.05 gets spent a little at a time across all 30 looks, instead of all at once on a single look.

One simple shape for this boundary, close to the one used in clinical trials under the name O'Brien-Fleming, is

\[ z_{\text{crit}}(d) = \frac{c}{\sqrt{d / 30}} \]

where \(d\) is the day of the look and \(c\) is a constant chosen in advance, by simulation, so that the total false-alarm budget across all 30 looks comes out close to 0.05. For this test, that constant works out to c = 2.121.

```r
# Compute the day-varying critical value: strict early, relaxed by day 30
days <- 30
c_value <- 2.121       # chosen in advance by simulation so the total budget is close to 0.05
day <- 1:days
z_crit_day <- c_value / sqrt(day / days)

round(z_crit_day[c(1, 10, 30)], 2)
#> [1] 11.62  3.67  2.12

plot(day, z_crit_day, type = "l", lwd = 2,
     xlab = "day", ylab = "critical value for |z|",
     main = "The boundary tightens early, relaxes by day 30")
abline(h = 1.96, lty = 2, col = "firebrick")
```

Read those three numbers. On day 1, the boundary sits at z above 11.62, a bar so high that one day's data will basically never cross it, however lucky that day's visitors get. By day 10, it has relaxed to 3.67, still much stricter than the ordinary 1.96. By day 30, it eases all the way down to 2.12, close to but still a touch stricter than the fixed test's 1.96, because day 30's look still has to share the budget with the 29 looks that came before it.

Now re-run the exact daily-monitoring simulation from a few steps back, but compare each day's z against this day-varying boundary instead of the fixed 1.96.

```r
# Re-run the daily-monitoring simulation, but compare each day's z to the day-varying
# boundary instead of the fixed 1.96, and check what happens to the overall false-alarm rate
set.seed(107)
p_true <- 0.10
n_day <- 300
days <- 30
c_value <- 2.121
day <- 1:days
z_crit_day <- c_value / sqrt(day / days)

crosses_boundary <- function() {
  new_b <- rbinom(days, n_day, p_true)
  new_a <- rbinom(days, n_day, p_true)
  cum_b <- cumsum(new_b)
  cum_a <- cumsum(new_a)
  n_cum <- n_day * day
  p_pool <- (cum_b + cum_a) / (2 * n_cum)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_cum))
  z <- (cum_b / n_cum - cum_a / n_cum) / se
  any(abs(z) > z_crit_day)
}

false_alarm_boundary <- replicate(20000, crosses_boundary())
round(mean(false_alarm_boundary), 3)
#> [1] 0.054
```

The overall false-alarm rate comes out at 5.4%, close to the planned 5% and nowhere near the 27.9% the fixed 1.96 threshold gave when checked every day. Dana gets to keep her daily habit, checking every single morning, while the boundary does the work of keeping the overall false-alarm rate honest. The price is that any single day's win has to clear a much higher bar than 1.96, especially early on, which is exactly what stops early noise from getting declared a winner.

=== step === concept
## Choosing between the two honest fixes

Both fixes solve the same problem, but they trade off different things.

| Fix | False-alarm rate | Can stop early? |
|---|---|---|
| Fixed sample size, one look | 5.0% | No, must run the full 30 days |
| Alpha-spending boundary | 5.4% | Yes, once the data clear that day's boundary |

Fixing the sample size in advance is the simpler of the two. It holds the false-alarm rate right at the planned level, but Dana has to commit to running the full 30 days no matter what the data show along the way.

The alpha-spending boundary costs a little more, 5.4% instead of 5.0%, but it buys back the thing Dana actually wanted, the ability to stop early when the data genuinely earn it, without wrecking the false-alarm rate in the process.

[TIP]
Both fixes share one requirement that matters more than which one you pick. The rule itself, whether it is the sample size or the boundary's shape, has to be fixed before the test starts. A boundary chosen only after looking at the data, or a fixed-sample test that gets peeked at anyway despite the plan, hands back exactly the inflation measured a few steps back. The honesty lives in the commitment made in advance, not in which specific rule gets chosen.

=== step === quiz
## Closing quiz: a new monitoring scenario

A different team at Larkspur runs a 10-week test, checking the result once a week, comparing each week's cumulative z to the ordinary fixed value of 1.96, with no day-varying boundary. What is the most accurate way to describe what is about to happen to their overall false-alarm rate, and the best fix?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Their false-alarm rate stays at 5%, since the weekly checks are still all testing the same alpha = 0.05 threshold. ::no
- Their false-alarm rate will climb to roughly 1 minus (1 minus 0.05) to the power 10, about 40%, since that is the formula for repeated looks. ::no
- Their false-alarm rate will climb well past 5%, for the same reason Dana's daily checks did: each week's look shares almost all of the previous week's data. The fix is not a bigger sample, it is deciding the stopping rule, a fixed sample size or a spending boundary, before the test starts. ::ok Right. The weekly checks are not independent studies, so the plain formula overstates the real number, the same way it did for Dana's daily test. But the real number is still well above 5%, and only a stopping rule fixed in advance brings it back down.
- Switching to a bigger weekly sample size would fix the inflation without needing any stopping rule at all. ::no A bigger sample per week makes each individual look sharper, but it does nothing about how many chances the test gets to cross the line through accumulated luck. The fix is in how many times, and under what rule, the team allows itself to stop, not in how much data each look has.

=== step === tryit
## Your turn: swap in the day-varying boundary

Here is one simulated history of Larkspur's test, stopped against the fixed z of 1.96, the way Dana originally ran it. Edit the marked line so it stops against the day-varying boundary instead, c divided by the square root of day over days, with c = 2.121, and run it again.

```r
# Re-run one simulated history of Dana's test, stopping against a FIXED z of 1.96 every day
set.seed(107)
p_true <- 0.10
n_day <- 300
days <- 30
day <- 1:days

one_history <- function() {
  new_b <- rbinom(days, n_day, p_true)
  new_a <- rbinom(days, n_day, p_true)
  cum_b <- cumsum(new_b)
  cum_a <- cumsum(new_a)
  n_cum <- n_day * day
  p_pool <- (cum_b + cum_a) / (2 * n_cum)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_cum))
  z <- (cum_b / n_cum - cum_a / n_cum) / se
  any(abs(z) > 1.96)      # change this line to use the day-varying boundary instead
}

false_alarm_rate <- mean(replicate(20000, one_history()))
false_alarm_rate
```

Press Check when you have made the edit.

::check {"regex": "(?=[\\s\\S]*2\\.121)(?=[\\s\\S]*sqrt[(]day\\s*/\\s*days[)])", "gate": true, "difficulty": "intermediate", "ok": "Right: swapping in the day-varying boundary drops the false-alarm rate from 0.279 under the fixed 1.96 to 0.0541, back near the planned 5%, while still letting the test stop early when the data clear that day's bar.", "no": "Change the line `any(abs(z) > 1.96)` to compare against the day-varying boundary instead: `any(abs(z) > 2.121 / sqrt(day / days))`."}
::solution
```r
# Same history, now stopping against the day-varying boundary instead of the fixed 1.96
set.seed(107)
p_true <- 0.10
n_day <- 300
days <- 30
day <- 1:days

one_history <- function() {
  new_b <- rbinom(days, n_day, p_true)
  new_a <- rbinom(days, n_day, p_true)
  cum_b <- cumsum(new_b)
  cum_a <- cumsum(new_a)
  n_cum <- n_day * day
  p_pool <- (cum_b + cum_a) / (2 * n_cum)
  se <- sqrt(p_pool * (1 - p_pool) * (2 / n_cum))
  z <- (cum_b / n_cum - cum_a / n_cum) / se
  any(abs(z) > 2.121 / sqrt(day / days))
}

false_alarm_rate <- mean(replicate(20000, one_history()))
false_alarm_rate
#> [1] 0.0541
```

Swapping the fixed 1.96 for the day-varying boundary drops the false-alarm rate from 0.279, the rate the earlier simulation found under constant daily checking against 1.96, down to 0.0541, close to the planned 0.05. Dana keeps her daily habit. The boundary keeps her honest.

=== step === complete
## The cost of peeking, and the honest fixes

Three numbers carry this whole lesson. A single honest look, taken once, costs exactly what Dana agreed to pay, about 5%. Checking the same accumulating test every day for 30 days, with no boundary, pushes that up to 27.9%, more than five times the agreed rate. Add a boundary calibrated in advance, strict early and relaxed by the end, and daily checking is back to costing about 5.4%, while still letting Dana stop early when the data earn it.

Peeking itself is not the sin. Checking data as it comes in is natural, and often necessary. The sin is stopping and declaring a winner the moment a look crosses the line, without having decided in advance exactly when you are allowed to do that. Decide the rule first, whether that is a fixed sample size or a spending boundary, and the test can run however often you like to look at it.

Next time, the question turns from testing one comparison honestly to finding the best settings among several at once, with as few runs as the data will allow.

=== step === concept
## References

- [Repeated Significance Tests on Accumulating Data](https://doi.org/10.2307/2343787) - Armitage, P., McPherson, C. K., and Rowe, B. C. (1969), Journal of the Royal Statistical Society, Series A (General), 132(2), 235-244. The paper that first worked out how much repeated looks inflate the false-alarm rate.
- [A Multiple Testing Procedure for Clinical Trials](https://doi.org/10.2307/2530245) - O'Brien, P. C., and Fleming, T. R. (1979), Biometrics, 35(3), 549-556. The boundary shape used in this lesson's alpha-spending fix.
- [Group Sequential Methods in the Design and Analysis of Clinical Trials](https://doi.org/10.1093/biomet/64.2.191) - Pocock, S. J. (1977), Biometrika, 64(2), 191-199. A constant-boundary alternative to the O'Brien-Fleming shape.
- [Discrete Sequential Boundaries for Clinical Trials](https://doi.org/10.2307/2336502) - Lan, K. K. G., and DeMets, D. L. (1983), Biometrika, 70(3), 659-663. The general alpha-spending-function framework behind both boundary shapes.
- [Peeking at A/B Tests: Why It Matters and What to Do About It](https://doi.org/10.1145/3097983.3097992) - Johari, R., Koomen, P., Pekelis, L., and Walsh, D. (2017), KDD '17, 1517-1525. The same peeking problem, framed for online experimentation.

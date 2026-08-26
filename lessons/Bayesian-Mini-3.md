---
title: "The Bayesian t-test: measure evidence, not just significance"
slug: "Bayesian-Mini-3"
description: "A t-test can never return a verdict of no difference. Build a Bayes factor by hand from two curves and one division, and measure the evidence both ways."
keywords: "bayesian t-test, bayes factor, BF10, BF01, evidence for the null hypothesis, ttestBF, BayesFactor package, Cauchy prior, JZS prior, bayesian t-test in R"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "3"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-2"
course_next: ""
curriculum_id: "0.0.34"
lesson_access: "windowed"
catalog_blurb: "How to measure evidence for a difference, and for no difference at all."
---

=== step === cover
::eyebrow Bayesian Decisions
## The Bayesian t-test: measure evidence, not just significance

A jury has only two verdicts to choose from. Guilty, or not guilty.

Not guilty sounds like a finding of innocence, and it is not one. It means the case was not strong enough, and the accused walks out with the question still open. However thin the evidence against him was, no court will ever announce that he is innocent.

A t-test works the same way, and it costs teams real decisions.

Here is one. A product team rewrote the onboarding tutorial in their app and timed 60 new users, 30 on each version. The test came back at p = 0.005, so the rewrite ships. A month later the same team reorders the app menu, runs the same experiment on another 60 users, and gets p = 0.93. Everyone in the room believes the reorder did nothing at all. Nobody is allowed to say so, because a t-test has no verdict for that.

So let's ask a different question of the same two experiments. Of the two stories, a real difference and no difference, which one predicted the numbers we actually got, and by how much?

The answer comes back as one ratio called the Bayes factor. For the rewrite it reads 8 to 1 in favour of a real effect. For the menu change it reads 3.8 to 1 in favour of nothing happening. Both of those are sentences you can say out loud in a meeting and be understood.

Building one takes three moves.

::widget process-flow {"steps":[{"title":"Write down both stories","sub":"no difference, and a difference of some size"},{"title":"Ask what each one predicted","sub":"how likely was this exact data under each story"},{"title":"Divide one by the other","sub":"the ratio is the Bayes factor"}]}

That is the whole test. Everything from here is doing it with real numbers and learning to read the answer in both directions.

=== step === concept
## The onboarding rewrite, and the numbers it produced

Let's get the actual numbers on the table, because every calculation from here runs on them.

The app measures one thing per user: how many minutes they take to finish their first real task after signing up. Thirty new users got the old onboarding tutorial and thirty got the rewritten one, and nobody was told which version they were on.

Press Run to build the 60 timings and look at them.

```r
# Build the 60 onboarding timings and show both arms with their group means
set.seed(261)
onboarding <- data.frame(
  version = factor(rep(c("old", "new"), each = 30), levels = c("old", "new")),
  minutes = c(round(rnorm(30, 14.0, 3.4), 1),    # 30 users on the old tutorial
              round(rnorm(30, 11.6, 3.4), 1))    # 30 users on the rewritten one
)

group_means <- tapply(onboarding$minutes, onboarding$version, mean)
round(group_means, 2)
#>   old   new
#> 13.51 10.87

stripchart(minutes ~ version, data = onboarding, method = "jitter", jitter = 0.12,
           pch = 16, col = "grey55", vertical = FALSE,
           main = "Minutes to finish the first task, 30 users per version",
           xlab = "Minutes")
points(group_means, c(1, 2), pch = 18, cex = 2.4, col = "firebrick")
```

Each grey dot is one user, and the red diamond on each row is that group's mean. The old tutorial averages 13.51 minutes and the rewrite averages 10.87, so the rewrite is 2.64 minutes faster.

Look at how much the two rows overlap, though. The old row stretches from 3.4 minutes out to 22.4, the new one from 4.4 to 16.2, and seven of the thirty users on the old tutorial still finished faster than the rewrite's average. A 2.64 minute gap between two clouds that wide is exactly the situation a test is for.

=== step === concept
## What the ordinary t-test says about the rewrite

The team runs the test everyone runs. It is one line in the familiar formula form, with `var.equal = TRUE` because the Bayesian version we are building towards assumes a single shared spread across the two groups, and we want both tests reading the same data the same way.

```r
# Run the ordinary two sample t-test on the onboarding rewrite
tt_rewrite <- t.test(minutes ~ version, data = onboarding, var.equal = TRUE)
tt_rewrite
#>
#> 	Two Sample t-test
#>
#> data:  minutes by version
#> t = 2.9065, df = 58, p-value = 0.005169
#> alternative hypothesis: true difference in means between group old and group new is not equal to 0
#> 95 percent confidence interval:
#>  0.8217949 4.4582051
#> sample estimates:
#> mean in group old mean in group new
#>          13.51333          10.87333
```

There it is. t = 2.9065 on 58 degrees of freedom, and p = 0.005169.

Read that p-value carefully, because it says something narrower than it looks. If the rewrite changed nothing whatsoever, a gap this big or bigger would still turn up in about 5 experiments out of 1,000 by luck alone. That is a statement made entirely inside the world where the rewrite did nothing.

Notice what it did not do. It never scored the world where the rewrite genuinely helped. The team ships the rewrite anyway, and they are right to. Nothing has gone wrong yet.

=== step === concept
## The menu change, and its p-value of 0.93

A month later the same team makes a second change, and this time the worry runs the other way. They reorder the app menu, and the fear is not that it helps but that moving familiar things around slows people down.

It is the same design as before, another 60 new users at 30 per version, timed in minutes.

```r
# Build the menu reorder experiment and run the same t-test on it
set.seed(334)
menu <- data.frame(
  version = factor(rep(c("old", "new"), each = 30), levels = c("old", "new")),
  minutes = c(round(rnorm(30, 13.0, 3.4), 1),    # 30 users on the old menu
              round(rnorm(30, 13.0, 3.4), 1))    # 30 users on the reordered menu
)

round(tapply(menu$minutes, menu$version, mean), 2)
#>   old   new
#> 13.23 13.14

tt_menu <- t.test(minutes ~ version, data = menu, var.equal = TRUE)
tt_menu
#>
#> 	Two Sample t-test
#>
#> data:  minutes by version
#> t = 0.085959, df = 58, p-value = 0.9318
#> alternative hypothesis: true difference in means between group old and group new is not equal to 0
#> 95 percent confidence interval:
#>  -2.005813  2.185813
#> sample estimates:
#> mean in group old mean in group new
#>             13.23             13.14
```

The two means are 13.23 and 13.14 minutes, about five seconds apart on a task that takes thirteen minutes. The t statistic is 0.085959 and the p-value is 0.9318.

So what does the team get to write in the rollout note? They cannot write "the reorder is safe", and they cannot write "the menu change had no effect". The only thing this test lets them say is "we failed to detect a difference", and that is a sentence about the test, not about the menu.

And everybody who has looked at those two means already knows the reorder did nothing.

=== step === concept
## The verdict a p-value can never return

The gap is not a flaw in how the team ran the test. It is built into what the test does, and once you see how it works you will never expect anything else from it.

A t-test starts by assuming there is no difference. It works out which t values that assumption would produce, then measures how far out on that curve your result landed. Far out means the assumption is starting to look silly. Near the middle means it is holding up fine.

Now read that description again and notice what is missing from it. The other story, the one where the rewrite genuinely saves two and a half minutes, is never scored. It is never even written down. The test measures distance from one story only, and distance from a story is not evidence for anything else.

Drag the slider below, and watch the sentence under the curve rather than the number.

::widget null-distribution {"tails": 2, "start": 2.9, "label": "how far the result sits from zero"}

It opens at 2.9, essentially where the rewrite landed, and the shaded slice out in the tails is the p-value. Pull the slider down to about 0.10, roughly where the menu change came in, and the slice swells until it covers nearly the whole curve.

Now read the verdict line underneath. It flips from "reject H0" to "fail to reject H0", and that second phrase is as far as it ever goes. There is no setting of that slider that makes it say "accept H0". That verdict does not exist.

One detail, so the number lines up with what you saw: the curve drawn here is the standard normal shape rather than the t curve on 58 degrees of freedom, so its p-value runs a hair below the 0.005169 the real test reported. The verdict line is the part worth watching.

[KEY INSIGHT]
A small p-value is evidence against no difference. A large p-value is not evidence for it. The test only ever measures distance from one story, so it only has one direction to report in, and "we found nothing" is a different claim from "there is nothing".

=== step === quiz
## Quick check: what does a large p-value let you claim?

The menu reorder came back at p = 0.9318, and everybody on the team believes the change did nothing. Which sentence is the team actually allowed to put in the rollout note?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The test proves the menu change had no effect on task time. ::no
- There is a 93% chance the two versions perform identically. ::no
- The data gave the team no reason to rule out no difference, which is not the same as showing there is none. ::ok Exactly. Failing to convict is the only outcome available here, and a rollout note that says more than that is saying more than the test did.
- The effect is only 7% likely to be real. ::no Three of those four put a probability on the truth, or claim the change was measured and found to be nothing. A p-value only says how ordinary data like this would be if there were no difference at all. 0.9318 says this data is completely ordinary in that world, and then it stops.

=== step === concept
## What a Bayes factor asks instead
::prose-only the ratio and the two forecasts it divides are the idea; both forecasts get drawn as curves as soon as they are built

So the fix is not a better p-value. The fix is to write the second story down and make it predict something too.

Both stories can do that, before any data arrives.

The first story says the two versions are identical, so the true difference in means is zero. Call it H0. It predicts small t values, and it is very specific about it.

The second story says there is a real difference of some size. Call it H1. It predicts larger t values, in either direction.

Now you have two forecasts and one actual result, and comparing forecasts against a result is something you already know how to do. Score each story by how likely it made the data you actually collected, then divide one score by the other.

\[ BF_{10} = \frac{P(\text{data} \mid H_1)}{P(\text{data} \mid H_0)} \]

That ratio is the Bayes factor. Read the subscript as the fraction itself, 1 over 0, with the difference story on top and the no difference story underneath.

A BF10 of 8 means your data was 8 times more likely under a real difference than under no difference. A BF10 of 0.25 means the reverse, that your data was 4 times more likely under no difference. A BF10 of 1 means both stories predicted your data equally well, so the experiment settled nothing at all.

One number that runs in both directions. That is the thing a p-value could not do.

=== step === concept
## The effect size, and why the alternative needs one

There is a gap in what we just wrote down, and it has to be filled before either story can predict anything.

H0 is a single exact claim: the difference is zero. H1 is not a claim yet. "There is a difference" forecasts nothing until it says how big a difference, and 2.64 minutes on its own is not an answer either, because whether 2.64 counts as big depends entirely on how much users vary among themselves.

So we take the units off. Divide the gap by how spread out the timings are, and what comes back means the same thing whether you measured minutes, clicks or rupees.

```r
# Turn the 2.64 minute gap into a unit free effect size
old_minutes <- onboarding$minutes[onboarding$version == "old"]
new_minutes <- onboarding$minutes[onboarding$version == "new"]

gap       <- mean(old_minutes) - mean(new_minutes)
pooled_sd <- sqrt((var(old_minutes) + var(new_minutes)) / 2)
delta     <- gap / pooled_sd

round(c(gap = gap, pooled_sd = pooled_sd, delta = delta), 4)
#>       gap pooled_sd     delta
#>    2.6400    3.5179    0.7504
```

The pooled standard deviation, 3.52 minutes, is the typical spread inside a group, averaged across the two of them. Dividing the 2.64 minute gap by it gives 0.75.

That 0.75 has a name. It is the effect size, written delta, and it says the two group means sit three quarters of a standard deviation apart. Now H1 has a language it can make predictions in.

=== step === concept
## The prior on the effect size, and what it claims

H1 still cannot name one single number, though. If it turned up claiming delta is exactly 0.75, it would be cheating, because we only know 0.75 by having looked at the data first.

So H1 does not pick a value. It spreads its bets across every effect size that could plausibly have shown up, and that spread is called the prior.

The standard choice for a t-test is a Cauchy distribution centred at zero with a scale of r = 0.707. It is centred at zero because before running the experiment you have no idea which direction the effect will run. It is Cauchy because its tails are heavy, so it never quite rules out a large effect the way a normal curve would.

Here is what that prior is actually claiming.

```r
# Draw the prior on the effect size and shade the middle half of its weight
r_scale <- 0.707
curve(dcauchy(x, 0, r_scale), from = -4, to = 4, n = 400, lwd = 2, col = "steelblue",
      main = "The prior on the effect size: Cauchy at 0 with r = 0.707",
      xlab = "delta (the effect size)", ylab = "density")

shade_x <- seq(-r_scale, r_scale, length.out = 100)
polygon(c(-r_scale, shade_x, r_scale), c(0, dcauchy(shade_x, 0, r_scale), 0),
        col = "lightsteelblue", border = NA)
curve(dcauchy(x, 0, r_scale), from = -4, to = 4, n = 400, lwd = 2,
      col = "steelblue", add = TRUE)
abline(v = 0.7504, col = "firebrick", lwd = 2, lty = 2)

legend("topright", bty = "n",
       legend = c("middle half of the prior weight", "our delta = 0.75"),
       fill = c("lightsteelblue", NA), border = NA,
       lty = c(NA, 2), col = c(NA, "firebrick"), lwd = c(NA, 2))
```

Read the shaded band first. Exactly half of this prior's weight sits between a delta of minus 0.707 and plus 0.707, which is the claim in plain words: an effect up to about seven tenths of a standard deviation is an ordinary sort of effect, and anything bigger is on the unusual side.

The dashed line is our 0.75. It sits just outside the shaded middle, which is a sensible place for a genuine but unremarkable effect to land.

Now look at how slowly the curve drops away out at 3 and 4. It never touches the floor. The prior thinks a huge effect is unlikely, never impossible, and that heavy tail is the reason this particular curve became the default.

=== step === tryit
## Your turn: what size of effect does this prior call ordinary?

A prior is an ordinary probability distribution, so you can put questions to it directly. `pcauchy(q, 0, 0.707)` returns the weight sitting below q.

Work out how much of the prior's weight falls between a delta of minus 0.5 and plus 0.5, then how much falls between minus 1.5 and plus 1.5.

```r
# The prior is a Cauchy centred at 0 with scale 0.707.
# Find the weight sitting between -0.5 and 0.5,
# then the weight sitting between -1.5 and 1.5.
# pcauchy(q, 0, 0.707) gives the weight below q.
# Two lines. Press Check when you have them.
```
::check {"regex": "pcauchy[\\s\\S]*1[.]5", "gate": true, "difficulty": "beginner", "ok": "Yes: 0.3919 and 0.7196. The prior puts about 39% of its weight on effects smaller than half a standard deviation, and about 72% on effects smaller than one and a half.", "no": "Subtract the weight below the lower edge from the weight below the upper one: `pcauchy(0.5, 0, 0.707) - pcauchy(-0.5, 0, 0.707)`, then the same line with 1.5 in place of 0.5."}
::solution
```r
# Read the prior as probability: the weight sitting inside each range
pcauchy(0.5, 0, 0.707) - pcauchy(-0.5, 0, 0.707)
#> [1] 0.3918719
pcauchy(1.5, 0, 0.707) - pcauchy(-1.5, 0, 0.707)
#> [1] 0.7195993
```

The remaining 28% sits out past 1.5 in one direction or the other, spread across both tails. A prior that put no weight out there would be ruling out a big effect before the experiment had even started, and this one refuses to do that.

=== step === concept
## What each story predicts about the t you would see

Both stories are written down now, so both can be asked the same question. If this story were true, what t values would an experiment like this tend to produce?

H0 answers straight away. With no difference and 58 degrees of freedom, t follows the ordinary t curve: tall in the middle, thin in the tails.

H1 needs one more move. For every effect size delta the prior allows, there is a t curve shifted away from zero in proportion to it, and H1 has to average all of them together, weighting each one by how much prior weight its delta carries. Averaging a pile of shifted curves flattens the result and pushes weight out into the tails, which is exactly what a story expecting a real effect should predict.

Press Run to draw both, with our two results marked.

```r
# Draw what each story predicts about t, and mark the two real results
t_grid   <- seq(-6, 6, length.out = 121)
under_h0 <- dt(t_grid, df = 58)
under_h1 <- sapply(t_grid, function(tv) suppressWarnings(integrate(
  function(d) dt(tv, df = 58, ncp = d * sqrt(15)) * dcauchy(d, 0, 0.707),
  lower = -Inf, upper = Inf)$value))

plot(t_grid, under_h0, type = "l", lwd = 2, col = "grey40", ylim = c(0, max(under_h0)),
     main = "What each story predicts about the t you would see",
     xlab = "t", ylab = "density")
lines(t_grid, under_h1, lwd = 2, col = "steelblue")
abline(v = 2.9065, col = "firebrick", lwd = 2)
abline(v = 0.0860, col = "darkorange", lwd = 2, lty = 2)

legend("topleft", bty = "n",
       legend = c("no difference", "a difference, averaged over the prior",
                  "the rewrite, t = 2.91", "the menu change, t = 0.09"),
       col = c("grey40", "steelblue", "firebrick", "darkorange"),
       lty = c(1, 1, 1, 2), lwd = 2)
```

`ncp` in there is R's name for how far a t curve sits from zero, and `sqrt(15)` is where the sample sizes enter: 30 times 30 divided by 60 is 15, the effective sample size for two groups of thirty. So our delta of 0.75 shifts its own curve out to 0.75 times 3.873, which is 2.91, and that is exactly where the rewrite landed.

Now read what the picture is telling you, one line at a time.

The solid red line is the rewrite at t = 2.91. Out there the blue curve sits clearly above the grey one, so the difference story predicted that result better.

The dashed orange line is the menu change at t = 0.09. Right in the middle the grey curve towers over the blue one, so the no difference story predicted that result better.

The same picture handles both results. All that is left is to measure the two heights.

=== step === concept
## The Bayes factor is the ratio of two heights

Reading a height off a curve just means asking for its density at that point. Let's take both readings at the rewrite's t of 2.9065.

```r
# Read both curves at the rewrite result and divide one height by the other
t_rewrite <- unname(tt_rewrite$statistic)

height_h1 <- suppressWarnings(integrate(
  function(d) dt(t_rewrite, df = 58, ncp = d * sqrt(15)) * dcauchy(d, 0, 0.707),
  lower = -Inf, upper = Inf)$value)
height_h0 <- dt(t_rewrite, df = 58)

round(c(under_h1 = height_h1, under_h0 = height_h0, ratio = height_h1 / height_h0), 5)
#> under_h1 under_h0    ratio
#>  0.05747  0.00720  7.98667
```

The difference story put a density of 0.05747 on that result. The no difference story put 0.00720 there. Divide the first by the second and you get 7.99.

That is the Bayes factor. The data these 60 users produced was about 8 times more likely under a real difference than under no difference at all. The evidence is 8 to 1 that the rewrite works.

The arithmetic in that block looks heavier than it is, so it is worth naming each piece. `dt(t, 58)` is the grey curve, one function call and nothing more. The `integrate()` line is the blue curve: it walks across every delta, asks the shifted t curve for its height there, weights that by the prior, and adds it all up. `suppressWarnings()` is there because R's noncentral t routine posts a precision note whenever it is asked about a far out shift, and it posts that note 35 times during this one integral. It is a note, not an error, and the answer is fine.

Wrap those few lines in a function and you have a working Bayesian t-test.

```r
# A reusable Bayesian t-test: score both stories from t and the two sample sizes
bayes_factor <- function(t, n1, n2, r = 0.707) {
  df    <- n1 + n2 - 2
  n_eff <- n1 * n2 / (n1 + n2)
  under_h1 <- suppressWarnings(integrate(
    function(d) dt(t, df, ncp = d * sqrt(n_eff)) * dcauchy(d, 0, r),
    lower = -Inf, upper = Inf)$value)
  under_h0 <- dt(t, df, ncp = 0)
  under_h1 / under_h0
}

bf10_rewrite <- bayes_factor(t_rewrite, n1 = 30, n2 = 30)
round(bf10_rewrite, 3)
#> [1] 7.987
```

Every number from here on runs through that function.

=== step === tryit
## Your turn: what is a result sitting exactly on p = 0.05 worth?

A t of 2.0 on this design lands almost exactly on the 0.05 line, the threshold that decides whether most experiments ever ship anything.

Work out its two sided p-value with `2 * pt(-2.0, df = 58)`, then put the same t through `bayes_factor()` and compare the two.

```r
# bayes_factor(t, n1, n2) is defined and ready to use.
# A result lands right on the significance line: t = 2.0, 30 users per arm.
# Compute its two sided p-value, then its Bayes factor.
# Two lines. Press Check when you have them.
```
::check {"regex": "bayes_factor[(]\\s*2(\\.0*)?\\s*,", "gate": true, "difficulty": "intermediate", "ok": "Right: p = 0.0502 and BF10 = 1.37. A result that just scrapes past the significance line is barely better than even money as evidence.", "no": "Two lines. `2 * pt(-2.0, df = 58)` for the p-value, then `bayes_factor(2.0, 30, 30)` for the Bayes factor."}
::solution
```r
# Score a borderline result both ways: the p-value and the Bayes factor
2 * pt(-2.0, df = 58)
#> [1] 0.05019047
bayes_factor(2.0, n1 = 30, n2 = 30)
#> [1] 1.37169
```

1.37 is not nothing, but it is close to nothing. The same result that clears the bar for shipping a change buys you evidence of roughly 1.4 to 1, which is a coin toss with a slight lean. The significance threshold and the strength of the evidence are two different scales, and they do not line up.

=== step === concept
## How to read a Bayes factor in both directions

When BF10 comes back below 1, you flip it over.

BF01 = 1 / BF10 is the same evidence read the other way, in favour of no difference. The convention is to quote whichever of the two sits above 1, so you end up saying "4 to 1 for no difference" rather than "0.25 to 1 for a difference". It is the same fact in an easier sentence.

The strength labels go back to Jeffreys and everyone still uses roughly his bands. Past 3 is moderate, past 10 is strong, past 30 is very strong, and anything between 1/3 and 3 is too weak to act on in either direction.

```r
# Turn Bayes factors into words using the standard evidence bands
bf_scale <- data.frame(BF10 = c(0.26, 0.80, 1.50, 7.99, 40.00))
bf_scale$BF01 <- round(1 / bf_scale$BF10, 2)
bf_scale$evidence <- cut(bf_scale$BF10,
  breaks = c(0, 1/30, 1/10, 1/3, 1, 3, 10, 30, Inf),
  labels = c("very strong for no difference", "strong for no difference",
             "moderate for no difference", "weak for no difference",
             "weak for a difference", "moderate for a difference",
             "strong for a difference", "very strong for a difference"))
bf_scale
#>    BF10 BF01                     evidence
#> 1  0.26 3.85   moderate for no difference
#> 2  0.80 1.25       weak for no difference
#> 3  1.50 0.67        weak for a difference
#> 4  7.99 0.13    moderate for a difference
#> 5 40.00 0.03 very strong for a difference
```

Find our rewrite in the fourth row. 7.99 is moderate evidence for a difference, not strong, and that is a result whose p-value was 0.005. A p-value that looks decisive by the usual convention buys a Bayes factor sitting in the middle band.

Now read the first row instead, and read it right to left. A BF10 of 0.26 is a BF01 of 3.85, which the same table calls moderate evidence for no difference. That row is not filler.

=== step === concept
## Scoring the menu change: evidence that nothing happened

The menu reorder is where the t-test ran out of road. Its t was 0.085959 and its p was 0.9318, and the only honest thing the team could write down was that they had failed to detect a difference.

The function does not care which direction the answer runs. Feed it the menu result exactly the same way.

```r
# Score the menu reorder and flip it to read as evidence for no difference
t_menu    <- unname(tt_menu$statistic)
bf10_menu <- bayes_factor(t_menu, n1 = 30, n2 = 30)
bf01_menu <- 1 / bf10_menu

round(c(t = t_menu, BF10 = bf10_menu, BF01 = bf01_menu), 4)
#>      t   BF10   BF01
#> 0.0860 0.2632 3.7994
```

BF10 comes back at 0.2632, below 1, so flip it. BF01 is 3.80.

The data those 60 users produced was 3.8 times more likely under "the menu change did nothing" than under "the menu change did something". That is moderate evidence for no difference, and it is a positive finding rather than a failure to find one.

The two curves already told you this was coming. At t = 0.09 the grey no difference curve stands nearly four times taller than the blue one, because a result sitting that close to zero is completely ordinary under no difference and mildly disappointing under a real effect.

So the team can finally write the rollout note they wanted. The reorder did not slow anyone down, and the evidence runs 3.8 to 1 that it changed nothing at all.

[NOTE]
3.8 to 1 is moderate, not conclusive. It supports no difference and it does not prove it. Sixty users is a small experiment, and if the team wants a firmer answer the move is to collect more data and watch the Bayes factor climb.

=== step === quiz
## Quick check: what can you say about the menu change?

The menu reorder came back at t = 0.086, p = 0.9318, and BF01 = 3.80. Which reading of that Bayes factor is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The Bayes factor proves the menu change had no effect. ::no
- Our data was about 3.8 times more likely under no difference than under a real difference, which is moderate evidence that the reorder changed nothing. ::ok That is the sentence. It names the number, names the direction, and stops exactly where the evidence stops.
- There is a 3.8% chance the menu change did something. ::no
- The menu change made users 3.8 times faster. ::no A Bayes factor is a ratio of two predictions. It is not a probability and it is not an effect size. 3.80 says the data was 3.8 times more likely under one story than under the other, it never reaches proof, and it says nothing at all about how much faster anyone got.

=== step === concept
## How much of the answer is the prior holding up?

There is one honest objection left to deal with. We chose r = 0.707 for the prior, and a number we picked ourselves is now sitting inside the answer.

You do not have to argue about that in a meeting. You rerun the whole thing with wider priors and show people what happens.

An r of 1 says effects around a full standard deviation are ordinary. An r of 1.414 stretches that out to about 1.4. Both are far more generous about large effects than the default is.

```r
# Rerun both experiments across three prior widths and compare
r_values <- c(0.707, 1.000, 1.414)

sensitivity <- data.frame(
  prior_r      = r_values,
  rewrite_BF10 = round(sapply(r_values, function(r) bayes_factor(t_rewrite, 30, 30, r)), 2),
  menu_BF01    = round(sapply(r_values, function(r) 1 / bayes_factor(t_menu, 30, 30, r)), 2)
)
sensitivity
#>   prior_r rewrite_BF10 menu_BF01
#> 1   0.707         7.99      3.80
#> 2   1.000         7.35      5.13
#> 3   1.414         6.23      7.05
```

Read the rewrite column first: 7.99, then 7.35, then 6.23. Doubling the width of the prior costs that result about a fifth of its evidence, and it stays inside the moderate band the whole way. The verdict does not turn on the prior.

The menu column moves the other way: 3.80, then 5.13, then 7.05. A wider prior expects bigger effects, so a result sitting right on zero disappoints it more, and the evidence for no difference goes up. All three of those still say moderate or better.

Neither conclusion depends on the number we picked, and now you have a three row table to hand to anyone who asks. The check has a name, prior sensitivity analysis, and it costs you three lines of code.

[TIP]
Report the Bayes factor at the default prior, then report the sweep beside it. Three lines, and it removes the only real argument anyone can make about your choice of prior.

=== step === concept
## The one-line version with ttestBF()

Nobody hand rolls this in daily work. The BayesFactor package has it, written by the people who worked out the mathematics, and it is a single call.

That package does not ship with the runner here, so the block below has no Run button. Install it once with `install.packages("BayesFactor")`, rebuild `old_minutes` and `new_minutes` there, and run it in R to reproduce these exact numbers.

```r-static
# The one line version of the same test, run this locally
library(BayesFactor)

bf <- ttestBF(x = old_minutes, y = new_minutes)
bf
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 7.986529 ±0%
#>
#> Against denominator:
#>   Null, mu1-mu2 = 0
#> ---
#> Bayes factor type: BFindepSample, JZS

extractBF(bf)$bf
#> [1] 7.986529
```

Read that printout downwards. The `[1] Alt., r=0.707` line is the numerator, which is the difference story carrying the same prior scale we have been using all along. The `Against denominator: Null, mu1-mu2 = 0` line names what it is being compared against. The `±0%` is the package reporting its own numerical error, which reads zero here because a two group t-test is worked out by integration rather than by sampling. The last line names the design and the prior family: two independent samples, scored under JZS, which is the standard name for the Cauchy prior setup this test uses.

The package says 7.986529, against the 7.987 we built by hand. Same test, same prior, same answer.

Two arguments are worth knowing on `ttestBF()`. Pass `paired = TRUE` for a paired design or `mu = ` for a one sample test, and pass `rscale = ` to change the prior width for the sensitivity table.

=== step === tryit
## Practice: score a pilot you have not seen yet

A third change goes out on the same 30 and 30 design, and the pilot comes back at t = 1.5.

Compute its BF10 with the function you already have, then its BF01, and decide what the pilot has settled.

```r
# bayes_factor(t, n1, n2) is defined and ready to use.
# A third pilot on the same design comes back at t = 1.5.
# Compute BF10 for that result, then BF01 as 1 divided by it.
# Two lines. Press Check when you have them.
```
::check {"regex": "bayes_factor[(]\\s*1[.]5\\s*,", "gate": true, "difficulty": "intermediate", "ok": "Yes: BF10 = 0.671 and BF01 = 1.491. Both sit inside the 1/3 to 3 band, so this pilot settles nothing in either direction, and the right call is to keep collecting.", "no": "Two lines, both using the function you already have: `bayes_factor(1.5, 30, 30)`, then `1 / bayes_factor(1.5, 30, 30)`."}
::solution
```r
# Score the third pilot in both directions
round(bayes_factor(1.5, n1 = 30, n2 = 30), 3)
#> [1] 0.671
round(1 / bayes_factor(1.5, n1 = 30, n2 = 30), 3)
#> [1] 1.491
```

Notice what did not happen there. Nothing forced a verdict out of the data. That pilot's p-value would have been 0.139, the team would have called it not significant, and "not significant" always sounds a little like a finding. "The evidence runs 1.5 to 1 towards no difference, which is nothing at all" is the more useful sentence, because it says the experiment is unfinished rather than concluded.

=== step === quiz
## Practice: which write-up of the menu result is right?

The rollout note for the menu reorder has to carry both numbers, p = 0.9318 and BF01 = 3.80. Which version says what those numbers actually measured?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The reorder showed no significant difference in task time (p = 0.9318), which proves task time was unaffected. ::no
- The reorder showed no significant difference in task time (p = 0.9318), and a Bayes factor of 3.80 in favour of no difference, so the data gives moderate evidence that task time was unchanged. ::ok Right. The p-value reports what it can report, the Bayes factor adds the direction the p-value could not give, and the word moderate keeps the claim the size the evidence actually is.
- The reorder showed no significant difference in task time (p = 0.9318), so there is a 93% chance the two versions perform identically. ::no
- The reorder changed task time by a factor of 3.80, which was not significant (p = 0.9318). ::no Only one of those four says what both numbers measured. p = 0.9318 says data like this is completely ordinary when there is no difference. BF01 = 3.80 says data like this was 3.8 times more likely under no difference than under a real one. Neither is a proof, neither is a 93% chance, and neither is the size of a change.

=== step === quiz
## Practice: what happens when the prior gets wider?

Widening the prior from r = 0.707 to r = 1.414 pulled the rewrite's BF10 down from 7.99 to 6.23, and pushed the menu's BF01 up from 3.80 to 7.05. Why do the two results move in opposite directions?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Widening the prior changes the data being scored, so the two experiments are no longer being measured on the same footing. ::no
- A wider prior makes the no difference story more likely, so every BF01 rises and every BF10 falls. ::no
- A wider prior expects larger effects, so a middling result matches it slightly less well, while a result sitting on zero disappoints it much more, and that strengthens the case for no difference. ::ok Exactly. The prior only ever describes what sizes of effect the difference story is expecting, and stretching those expectations hurts a near zero result far more than it hurts a moderate one.
- The rewrite has more data behind it than the menu change, so it is less sensitive to the prior. ::no The prior never touches your data, and it never touches the no difference story either. Both experiments here ran on the same 60 users and the same design. All that changed was how big an effect the difference story walked in expecting, and that hurts a result of t = 0.09 far more than a result of t = 2.91.

=== step === concept
## References

- [Bayesian t tests for accepting and rejecting the null hypothesis](https://doi.org/10.3758/PBR.16.2.225) - Rouder, Speckman, Sun, Morey and Iverson (2009), Psychonomic Bulletin and Review 16(2), 225-237. The JZS test computed by hand here, including the Cauchy prior and why r = 0.707 became the default.
- [Bayes Factors](https://doi.org/10.1080/01621459.1995.10476572) - Kass and Raftery (1995), Journal of the American Statistical Association 90(430), 773-795. The Bayes factor itself, and the interpretation bands.
- [The BayesFactor package](https://cran.r-project.org/package=BayesFactor) - Morey and Rouder. The CRAN page and the "Using the BayesFactor package" vignette, covering ttestBF, rscale and extractBF.
- [Bayesian inference for psychology, Part I: theoretical advantages and practical ramifications](https://doi.org/10.3758/s13423-017-1343-3) - Wagenmakers, Marsman and colleagues (2018), Psychonomic Bulletin and Review 25, 35-57. Why evidence for the null is the practical gain.
- [Theory of Probability](https://doi.org/10.1093/oso/9780198503682.001.0001) - Jeffreys (1961), 3rd edition, Oxford University Press, linked here as the Oxford Classic Texts reissue. The original labelled strength bands the table here uses.

=== step === complete
## Quick recap

You built a Bayesian t-test out of two curves and one division, and then read the answer in both directions. The lines worth keeping:

- A Bayes factor is the ratio of two predictions: how likely your data was under a real difference, over how likely it was under no difference.
- BF10 above 1 favours a difference, below 1 favours no difference, and BF01 = 1 / BF10 is the same evidence read the other way. Quote whichever sits above 1.
- The bands are 3, 10 and 30 for moderate, strong and very strong. Anything between 1/3 and 3 has settled nothing.
- The alternative story needs an effect size before it can predict anything, and the prior is how it spreads its bets across every effect size it thinks is plausible.
- The prior is a choice, so sweep it. Three widths, three lines of code, and the argument is over.
- A small Bayes factor is a real result. It is the finding a p-value can never hand you.

So the two rollout notes the team could not write at the start, they can write now.

For the onboarding rewrite: "The rewrite cut time to first task by 2.64 minutes, and the evidence runs about 8 to 1 that the effect is real."

For the menu reorder: "The reorder did not change task time, and the evidence runs about 3.8 to 1 that it changed nothing at all."

So the next time somebody tells you a result was not significant, you will know exactly what to ask them for. Have a great day!

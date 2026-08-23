---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6"
description: "Two diet trials, both significant, half a kilo against five. Build Cohen's d by hand and learn to report how big an effect is, not just whether it is real."
keywords: "effect size, Cohen's d, Cohen's d explained, Hedges g, eta squared, omega squared, Cramer's V, effect size in R, practical significance, how big is the effect"
mathjax: true
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-5"
course_next: ""
curriculum_id: "0.0.15"
lesson_access: "windowed"
catalog_blurb: "Measuring how big an effect is, not just whether it is real."
---

=== step === cover
::eyebrow Inference from Zero
## Effect size: Cohen's d and friends, explained

Two diet trials land on your desk on the same morning, and both of them came back significant.

The first one tested a low-fat plan on 1,200 volunteers. Over twelve weeks, the people on the plan lost half a kilo more than the people left on usual care. The second one tested a meal replacement plan on 60 volunteers, and those people lost five kilos more.

Both trials carry the same p under 0.05 stamp. Only one of them is worth changing your dinner for.

That is what goes wrong when you treat a test result as the verdict. A test tells you whether an effect is real. It was never built to tell you how big that effect is, and with enough volunteers even the half kilo plan clears the bar comfortably.

So let's give the size question a number of its own. We will build both trials, run both tests, then hold that half kilo gap perfectly still and watch its p-value slide from 0.63 to 0.0000013 on headcount alone. Once you have seen that happen, the fix takes one line of arithmetic.

::widget process-flow {"steps":[{"title":"Measure the gap","sub":"how many kilos the plan moved the scale"},{"title":"Divide by the spread","sub":"how much people already differ from each other"},{"title":"Report both answers","sub":"how big it is, and whether it is real"}]}

That is the whole idea. Two questions instead of one, and an answer to each: is it real, and is it big.

=== step === concept
## The two diet trials, side by side

Let's get both trials onto the table as numbers, because everything we work out from here runs on them.

Every volunteer is weighed at the start and again twelve weeks later, and we keep one number per person: kilos lost. A positive number means they lost weight and a negative one means they put some on. Trial A has 600 people on usual care and 600 on the low-fat plan. Trial B has 30 on each.

Press Run.

```r
# Build both diet trials: kilos lost over 12 weeks, arm by arm
set.seed(42)

make_arm <- function(n, mean_kg, sd_kg) {
  draw <- rnorm(n)
  mean_kg + sd_kg * (draw - mean(draw)) / sd(draw)
}

trial_a <- data.frame(
  arm     = rep(c("usual care", "low-fat"), each = 600),
  loss_kg = c(make_arm(600, 0.0, 4), make_arm(600, 0.5, 4))
)

trial_b <- data.frame(
  arm     = rep(c("usual care", "meal replacement"), each = 30),
  loss_kg = c(make_arm(30, 0.0, 4), make_arm(30, 5.0, 4))
)

a_ctl <- trial_a$loss_kg[trial_a$arm == "usual care"]
a_trt <- trial_a$loss_kg[trial_a$arm == "low-fat"]
b_ctl <- trial_b$loss_kg[trial_b$arm == "usual care"]
b_trt <- trial_b$loss_kg[trial_b$arm == "meal replacement"]

round(c(A_usual = mean(a_ctl), A_lowfat = mean(a_trt), A_gap = mean(a_trt) - mean(a_ctl),
        B_usual = mean(b_ctl), B_meal = mean(b_trt), B_gap = mean(b_trt) - mean(b_ctl)), 2)
#> A_usual A_lowfat    A_gap  B_usual   B_meal    B_gap
#>     0.0      0.5      0.5      0.0      5.0      5.0
```

The helper `make_arm()` draws one arm of people, then shifts and stretches that draw so the arm lands on exactly the average and exactly the spread we asked for. Real trials are never that tidy. We want them tidy here so every number you meet is the one the arithmetic produced, and not an accident of a single random draw.

Read the six numbers as two sets of three. In trial A, usual care averages 0.0 kg lost and the low-fat plan averages 0.5 kg, a gap of half a kilo. In trial B, usual care averages 0.0 kg again and the meal replacement plan averages 5.0 kg, a gap of five kilos.

The four vectors `a_ctl`, `a_trt`, `b_ctl` and `b_trt` hold the two arms of each trial on their own, and everything from here reaches for them.

=== step === concept
## Both trials came back significant

Now the part that started the trouble. Each trial gets the usual two-sample test, which compares the two arms and says whether a gap that size is easy to write off as luck.

```r
# Run the usual two-sample test on each trial and print what it reports
test_a <- t.test(a_trt, a_ctl)
test_b <- t.test(b_trt, b_ctl)

results <- data.frame(
  trial   = c("A low-fat", "B meal replacement"),
  per_arm = c(length(a_trt), length(b_trt)),
  gap_kg  = round(c(mean(a_trt) - mean(a_ctl), mean(b_trt) - mean(b_ctl)), 2),
  ci_low  = round(c(test_a$conf.int[1], test_b$conf.int[1]), 2),
  ci_high = round(c(test_a$conf.int[2], test_b$conf.int[2]), 2),
  p_value = format(signif(c(test_a$p.value, test_b$p.value), 2),
                   scientific = FALSE, drop0trailing = TRUE)
)
results
#>                trial per_arm gap_kg ci_low ci_high p_value
#> 1          A low-fat     600    0.5   0.05    0.95   0.031
#> 2 B meal replacement      30    5.0   2.93    7.07 0.00001
```

Look at the last column first. Trial A comes in at 0.031 and trial B at 0.00001. Both sit under the customary 0.05 line, so both trials get written up as significant and both get a press release.

The `ci_low` and `ci_high` columns are the 95% range the test hands back next to the p-value, and they say something the p-value does not. Trial A's true gap sits somewhere between 0.05 and 0.95 kg. Trial B's sits between 2.93 and 7.07 kg. Those two ranges do not come close to overlapping.

So both tests agree that the plans do something. Neither of them has a word to say about one plan being worth ten of the other. That is not a flaw in the test. It is a question nobody asked it.

=== step === concept
## Why the half kilo trial cleared the bar

Here's what makes a small p-value so easy to misread.

A p-value goes down as the evidence gets stronger, and headcount is one of the ingredients of evidence. So let's freeze the effect itself and change nothing but how many people took part. The gap stays at exactly 0.50 kg. The spread inside each arm stays at exactly 4 kg. Only the number of volunteers moves.

```r
# Hold the gap at 0.50 kg and the spread at 4 kg, change only the headcount
set.seed(42)

p_for_n <- function(n) {
  ctl <- make_arm(n, 0.0, 4)
  trt <- make_arm(n, 0.5, 4)
  t.test(trt, ctl)$p.value
}

per_arm <- c(30, 100, 600, 3000)

p_by_n <- data.frame(
  people_per_arm = per_arm,
  gap_kg         = 0.5,
  pooled_sd_kg   = 4,
  p_value        = format(signif(sapply(per_arm, p_for_n), 2),
                          scientific = FALSE, drop0trailing = TRUE)
)
p_by_n
#>   people_per_arm gap_kg pooled_sd_kg   p_value
#> 1             30    0.5            4      0.63
#> 2            100    0.5            4      0.38
#> 3            600    0.5            4     0.031
#> 4           3000    0.5            4 0.0000013
```

Read the middle two columns first, top to bottom. The gap is 0.5 kg on every row and the spread is 4 kg on every row. The half kilo diet is the same half kilo diet all four times.

Now read the last column. At 30 people an arm the same effect looks like nothing at all, p = 0.63. At 600 an arm it clears the bar at 0.031. At 3,000 an arm it comes back at 0.0000013, which anybody would read as overwhelming.

Nothing about the diet changed between the first row and the last. The trial just bought more volunteers.

[KEY INSIGHT]
Given enough people, an effect too small to care about will produce a p-value small enough to publish. The p-value moved from 0.63 to 0.0000013 while the effect sat perfectly still at half a kilo.

=== step === quiz
## Quick check: what makes a p-value small?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The size of the effect, and nothing else. Only a wider gap between the two arms can drive a p-value down. ::no
- Three things together: how wide the gap is, how much people scatter around it, and how many of them there are. Move any one of the three the right way and p falls. ::ok Exactly. Headcount is an ingredient of the p-value in its own right, which is why the same half kilo gap ran from 0.63 to 0.0000013 with the diet held completely still.
- The gap has to be wider than the spread inside the arms before p can drop below 0.05. ::no
- The number of people, and nothing else. The size of the gap plays no part. ::no A p-value blends all three: the gap, the scatter, and the headcount. That is exactly the problem. Because headcount is in the mix, a small p-value on its own cannot tell you whether the gap was worth having, and a big p-value cannot tell you the effect was absent.

=== step === concept
## Half a kilo against how much scatter?

If the test cannot tell you whether half a kilo is a lot, what can?

Not the raw number on its own. Half a kilo means nothing until you know what people were already doing. If everyone on usual care landed within a few hundred grams of each other, half a kilo would be an enormous shift. If they were scattered all over the place, half a kilo disappears into the noise.

So let's put the gap next to the scatter and look at both at once.

```r
# Set trial A's half-kilo gap against the spread inside each arm
round(c(gap_kg = mean(a_trt) - mean(a_ctl),
        sd_usual_care = sd(a_ctl),
        sd_low_fat = sd(a_trt)), 2)
#>        gap_kg sd_usual_care    sd_low_fat
#>           0.5           4.0           4.0

kg_breaks <- seq(floor(min(a_ctl, a_trt)), ceiling(max(a_ctl, a_trt)), by = 1)
tallest <- max(hist(a_ctl, breaks = kg_breaks, plot = FALSE)$counts,
               hist(a_trt, breaks = kg_breaks, plot = FALSE)$counts)

hist(a_ctl, breaks = kg_breaks, col = rgb(0.45, 0.45, 0.45, 0.55), border = "white",
     ylim = c(0, tallest),
     main = "Trial A: 600 people on each plan",
     xlab = "Kilos lost over 12 weeks")
hist(a_trt, breaks = kg_breaks, col = rgb(0.85, 0.45, 0.10, 0.55), border = "white", add = TRUE)
abline(v = c(mean(a_ctl), mean(a_trt)), col = c("grey25", "#C25E0D"), lwd = 3)
legend("topright", bty = "n", border = "white",
       fill = c(rgb(0.45, 0.45, 0.45, 0.55), rgb(0.85, 0.45, 0.10, 0.55)),
       legend = c("usual care", "low-fat plan"))
```

The standard deviation of each arm is 4 kg. That is the everyday spread among people on the same plan. Some lose eight kilos, some put on six, and the typical distance from their own arm's average is about four kilos either way.

Now the picture. The grey pile is usual care, the orange pile is the low-fat plan, and the two vertical lines are their averages. The piles sit almost entirely on top of each other, and the two lines are so close they nearly touch.

That is what half a kilo really looks like. The gap is one eighth of the ordinary variation between two people on the same diet, so pick one person from each pile and you would very often find the usual care person had done better.

And that gives us the measurement we want. The question is not how many kilos the gap is worth. It is how many spreads.

=== step === concept
## Cohen's d: the gap measured in standard deviations

That last line is the whole idea, and it has a name. **Cohen's d** is the gap between two group averages, divided by the spread inside the groups.

\[ d = \frac{\bar{x}_{plan} - \bar{x}_{usual}}{s_{pooled}} \]

The top is the plain difference in kilos. The bottom, the **pooled standard deviation**, is the two arms' spreads combined into one number, weighted by how many people each arm contributed.

\[ s_{pooled} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}} \]

Read that as an average of the two variances and nothing more exotic. Square each arm's standard deviation to get its variance, weight each variance by that arm's headcount minus one, add the two, divide by the two counts minus two, and take the square root. If both arms scatter by the same amount, the answer comes back as that amount, which is exactly what should happen.

Let's work trial A through it, one piece at a time.

```r
# Work Cohen's d for trial A by hand, one piece at a time
n_trt <- length(a_trt)
n_ctl <- length(a_ctl)

gap_kg    <- mean(a_trt) - mean(a_ctl)
s_pooled  <- sqrt(((n_trt - 1) * var(a_trt) + (n_ctl - 1) * var(a_ctl)) / (n_trt + n_ctl - 2))
d_trial_a <- gap_kg / s_pooled

round(c(gap_kg = gap_kg, pooled_sd_kg = s_pooled, d = d_trial_a), 3)
#>       gap_kg pooled_sd_kg            d
#>        0.500        4.000        0.125
```

Half a kilo over four kilos is 0.125. The low-fat plan moved people an eighth of a standard deviation.

Notice what happened to the units along the way. The top of that fraction is kilos and the bottom is kilos, so they cancel, and d comes out as a bare number with no unit on it. That is the property that makes d worth having.

A d of 0.125 means the same thing whether the study weighed people in kilos, measured blood pressure in millimetres of mercury or scored an exam out of 100. It is always the gap counted in units of how much people ordinarily differ.

=== step === concept
## Cohen's d for both trials, in one function

We are going to want that computation a few more times, so let's put it in a function instead of retyping it.

```r
# Wrap Cohen's d in a function and run it on both trials
cohens_d <- function(x, y) {
  n1 <- length(x)
  n2 <- length(y)
  s_p <- sqrt(((n1 - 1) * var(x) + (n2 - 1) * var(y)) / (n1 + n2 - 2))
  (mean(x) - mean(y)) / s_p
}

round(c(trial_A = cohens_d(a_trt, a_ctl), trial_B = cohens_d(b_trt, b_ctl)), 3)
#> trial_A trial_B
#>   0.125   1.250
```

There they are, side by side: 0.125 and 1.250.

The meal replacement plan is exactly ten times the effect of the low-fat plan. Both trials came back under 0.05 and the p-values could not tell them apart in any useful way, because trial A's bigger crowd had padded its evidence. One number, worked out in four lines, separates them cleanly.

`cohens_d(x, y)` subtracts the second group's average from the first, so the order of the arguments sets the sign. Feed it the treated arm first and a plan that helps gives a positive d. Swap them and you get 0.125 with a minus in front, which is the same effect described from the other side. So whenever you report a d, say which way it runs.

=== step === concept
## What d = 0.125 and d = 1.25 look like drawn

Numbers like 0.125 and 1.25 are easier to trust once you have seen what they look like, so let's draw them.

Both plans produced arms that spread by 4 kg, so each arm draws as a bell curve centred on that arm's average, with those 4 kg as its natural step along the axis. Cohen's d is then just how far apart two of those curves sit, counted in 4 kg steps.

```r
# Draw both trials on one axis so d becomes a distance you can see
kg_grid <- seq(-14, 20, length.out = 400)

plot(kg_grid, dnorm(kg_grid, 0.0, 4), type = "l", lwd = 3, col = "grey35",
     main = "Usual care against each diet plan",
     xlab = "Kilos lost over 12 weeks", ylab = "How common that result is")
lines(kg_grid, dnorm(kg_grid, 0.5, 4), lwd = 3, col = "#C25E0D", lty = 2)
lines(kg_grid, dnorm(kg_grid, 5.0, 4), lwd = 3, col = "#C25E0D")
legend("topright", bty = "n", lwd = 3,
       legend = c("usual care", "low-fat, d = 0.125", "meal replacement, d = 1.25"),
       col = c("grey35", "#C25E0D", "#C25E0D"), lty = c(1, 2, 1))
```

The grey curve is usual care. The dashed orange curve is the low-fat plan, and it sits so close to grey that you have to look twice to find the gap. That is d = 0.125 drawn to scale: two crowds of people who are, for any practical purpose, the same crowd.

The solid orange curve is the meal replacement plan. It has moved a full step and a quarter to the right, five kilos against a spread of four, and now the overlap is small. Most of the people on that plan did better than most of the people on usual care. That is d = 1.25.

Same axis, same spread, same picture. The only thing that changed is how far the second crowd moved, and d is the number that counts that distance.

=== step === concept
## Cohen's benchmarks, and when to ignore them

You now have a number. The next thing anybody will ask is whether that number is big, and for that there is a convention.

Jacob Cohen, who introduced d, suggested three landmarks for it, and they have stuck ever since.

| d | Cohen's label | What it means on the drawn curves |
|---|---|---|
| 0.2 | small | the two curves are nearly on top of each other |
| 0.5 | medium | a visible shift, the curves still overlap heavily |
| 0.8 | large | the curves have clearly parted company |

A small helper turns any d into its label.

```r
# Turn a d into Cohen's label, then label both trials
interpret_d <- function(d) {
  size <- abs(d)
  if (size < 0.2) "negligible"
  else if (size < 0.5) "small"
  else if (size < 0.8) "medium"
  else "large"
}

c(trial_A = interpret_d(cohens_d(a_trt, a_ctl)),
  trial_B = interpret_d(cohens_d(b_trt, b_ctl)))
#>      trial_A      trial_B
#> "negligible"      "large"
```

Trial A's 0.125 does not even reach the small mark, so it comes back negligible. Trial B's 1.25 is well past large.

Now the caveat, and it matters more than the table does. Cohen picked 0.2, 0.5 and 0.8 from what was typical in the behavioural research he knew, and he wrote that he offered them reluctantly, for people with nothing better to go on. They are not laws. What counts as big depends on what the effect costs and who it reaches.

- A d of 0.1 from a cheap public health change that reaches forty million people can prevent more illness than a d of 1.0 from a therapy almost nobody will complete.
- A d of 0.3 in a field where the published effects all run around 0.2 is a strong result.
- A d of 1.5 in a lab study on ten people is usually a sign that the trial was too small, not that the effect was enormous.

So take the labels as a starting point, then say what the effect is worth in the language of the field it came from.

=== step === quiz
## Quick check: reading a d of 0.125

The low-fat plan came back with d = 0.125. What does that number tell you about the people in that trial?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The low-fat plan moved the scale 12.5% further than usual care did. ::no
- The two crowds sit an eighth of a standard deviation apart, so plenty of people on usual care did better than plenty of people on the low-fat plan. ::ok That is it. The curves you drew sat almost exactly on top of each other, and 0.125 is that overlap written down as a number.
- There is a 12.5% chance the low-fat plan did nothing at all. ::no
- The effect is small, but the p-value of 0.031 shows it is still worth acting on. ::no Cohen's d is a distance between two crowds, measured in standard deviations, and 0.125 is an eighth of one. It is not a percentage, it is not a probability, and no p-value can rescue it: 0.031 only says the gap was hard to get by luck with 1,200 volunteers, not that the gap was worth having.

=== step === widget
## How many people does a small effect need?

All of this has a practical consequence, and it explains why trial A had to recruit 1,200 people in the first place.

A small effect is expensive. The smaller the true effect, the more volunteers you need before a test can spot it reliably. The curve below plots exactly that. The horizontal axis is how many people you put in each arm, and the vertical axis is your chance of coming back significant when the effect really is there, which is what everybody calls the power of the trial.

Switch between Cohen's three landmarks and watch the whole curve slide sideways. The marked point is the headcount that buys you an 80% chance of catching the effect, which is the usual target when a trial is designed.

::widget power-curve {}

A large effect is caught with a couple of dozen people an arm. A small one wants hundreds.

Trial A's effect was smaller than any of the three landmarks, so let's put its own d on that scale and read the exact headcounts off base R while we are there.

```r
# How many people an arm does each effect size need for 80 percent power?
d_values <- c(0.125, 0.2, 0.5, 0.8)

n_for_80 <- sapply(d_values, function(d)
  ceiling(power.t.test(delta = d, sd = 1, sig.level = 0.05, power = 0.80)$n))

data.frame(d = d_values, people_per_arm = n_for_80)
#>       d people_per_arm
#> 1 0.125           1006
#> 2 0.200            394
#> 3 0.500             64
#> 4 0.800             26

# the other direction: the chance each trial had of clearing the bar
round(c(trial_A = power.t.test(n = 600, delta = 0.125, sd = 1, sig.level = 0.05)$power,
        trial_B = power.t.test(n = 30, delta = 1.25, sd = 1, sig.level = 0.05)$power), 3)
#> trial_A trial_B
#>   0.581   0.997
```

There are the exact numbers: 26 people an arm for a large effect and 394 for a small one, fifteen times the crowd for the same 80% chance. Trial A's d of 0.125 wants 1,006 people in each arm. It ran 600, so it went in with a 58% chance of finding its own effect, barely better than a coin toss. Trial B was chasing a d of 1.25 with 30 people an arm, and it was near certain at 99.7%.

That is the whole economics of it. Trial A needed a crowd because it was hunting something tiny, and that crowd is exactly what dragged its p-value under 0.05 in the end.

=== step === tryit
## Your turn: does d change if you weigh in pounds?

Everything now hangs on d, so it had better not depend on which scale the clinic happened to own. Let's check.

One kilo is 2.205 pounds. Convert both of trial A's arms to pounds, then run `cohens_d()` on the converted arms and see what comes back.

```r
# a_ctl and a_trt hold trial A's two arms, in kilos lost.
# One kilo is 2.205 pounds.
# Convert each arm to pounds, then run cohens_d() on the two new vectors.
# Three lines. Press Check when you have them.
```
::check {"regex": "(cohens_d[\\s\\S]*2[.]205)|(2[.]205[\\s\\S]*cohens_d)", "gate": true, "difficulty": "beginner", "ok": "Right, d stays at 0.125. The gap grew to 1.10 pounds and the pooled spread grew to 8.82 pounds, so both the top and the bottom of the fraction were multiplied by the same 2.205 and the unit cancelled straight back out.", "no": "Convert each arm first, then hand the two new vectors over: a_trt_lb is a_trt times 2.205, a_ctl_lb is a_ctl times 2.205, then call cohens_d(a_trt_lb, a_ctl_lb)."}
::solution
```r
# Convert both arms of trial A to pounds and recompute Cohen's d
a_ctl_lb <- a_ctl * 2.205
a_trt_lb <- a_trt * 2.205

round(c(gap_lb = mean(a_trt_lb) - mean(a_ctl_lb),
        sd_usual_lb = sd(a_ctl_lb),
        sd_low_fat_lb = sd(a_trt_lb),
        d_in_pounds = cohens_d(a_trt_lb, a_ctl_lb)), 3)
#>        gap_lb   sd_usual_lb sd_low_fat_lb   d_in_pounds
#>         1.102         8.820         8.820         0.125
```

The gap in pounds is 1.102, and both arms now scatter by 8.820, so the pooled spread on the bottom of the fraction is 8.820 too. Every one of those numbers is 2.205 times what it was in kilos, and 1.102 divided by 8.820 is the same 0.125 as before.

This is why effect sizes travel. Two studies that measured the same thing on different scales still give comparable d values, and that is what lets people pool results across a whole pile of studies.

=== step === concept
## Hedges' g: the correction for small trials

There is one wrinkle in d worth knowing about, and it bites hardest on small trials like B.

The pooled standard deviation is an estimate, built from whoever happened to enrol. With few people that estimate tends to come out a little too small, and too small a bottom makes the whole fraction, and so d, run a little too high. Larry Hedges worked out the fix: multiply d by a factor slightly below 1, and let that factor close in on 1 as the trial grows. The corrected number is called **Hedges' g**.

```r
# Hedges' g: Cohen's d with the small-trial correction applied
hedges_g <- function(x, y) {
  n <- length(x) + length(y)
  correction <- 1 - 3 / (4 * n - 9)
  cohens_d(x, y) * correction
}

round(c(d = cohens_d(b_trt, b_ctl), g = hedges_g(b_trt, b_ctl)), 3)
#>     d     g
#> 1.250 1.234
```

Trial B has 60 people in total, so the correction factor works out at 0.987 and trims d from 1.250 down to 1.234. That is about one percent, and it changes nothing about how you would describe that plan.

The size of the trim is the point, though. It is set entirely by the headcount: about 4% at 20 people, about 1% here at 60, and under half a percent past 200, where d and g agree to two decimal places and the difference stops mattering.

[TIP]
Report g rather than d when the two arms together come to 50 people or fewer. Above about 100 the two are the same number for reporting purposes, so use whichever your field expects.

=== step === concept
## Three plans instead of two: eta squared

A year later the same team goes back and follows all three groups: the people who stayed on usual care, the people on the low-fat plan and the people on the meal replacement plan, thirty of each.

And now Cohen's d has nothing to divide. With three groups there is no single gap any more, there are three of them, so the question has to be put differently. Out of all the variation in kilos lost across these ninety people, how much of it comes down to which plan they were on? That share is called **eta squared**, written as the Greek letter eta with a two on it.

An analysis of variance splits the total variation into exactly those two piles, so we can read the share straight off it.

```r
# Follow all three plans for a year, then ask how much of the variation the plan explains
set.seed(7)

followup <- data.frame(
  plan = rep(c("usual care", "low-fat", "meal replacement"), each = 30),
  loss_kg = c(make_arm(30, 0.0, 4), make_arm(30, 0.5, 4), make_arm(30, 5.0, 4)),
  kept_it_off = rep(rep(c("yes", "no"), 3), c(6, 24, 13, 17, 21, 9))
)

fit <- aov(loss_kg ~ plan, data = followup)
anova_table <- summary(fit)[[1]]
anova_table
#>             Df Sum Sq Mean Sq F value    Pr(>F)
#> plan         2    455   227.5  14.219 4.539e-06 ***
#> Residuals   87   1392    16.0
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

ss_between <- anova_table$"Sum Sq"[1]
ss_total   <- sum(anova_table$"Sum Sq")
ms_error   <- anova_table$"Mean Sq"[2]
df_between <- anova_table$Df[1]

eta_squared   <- ss_between / ss_total
omega_squared <- (ss_between - df_between * ms_error) / (ss_total + ms_error)

round(c(eta_squared = eta_squared, omega_squared = omega_squared), 3)
#>   eta_squared omega_squared
#>         0.246         0.227
```

The `Sum Sq` column holds the two piles of variation. The 455 on the `plan` row is the part explained by which plan someone was on. The 1392 on the `Residuals` row is everything else, which is people on the same plan differing from each other. Add the two and you get 1847, the total.

Eta squared is just the first pile over the whole thing, 455 divided by 1847, which comes to 0.246. About a quarter of the variation in weight lost is down to the plan, and the other three quarters is people being different from each other.

Omega squared is eta squared with the same kind of small-sample correction that g applies to d. Eta squared runs a little high because it flatters whatever groups you happened to sample, so omega squared takes an allowance off and lands at 0.227. Cohen's benchmarks on this scale are 0.01 for small, 0.06 for medium and 0.14 for large, so a quarter of the variation is a large effect by any reading.

[NOTE]
Eta squared reads exactly like an R-squared, because it is one. Both answer the same question, what share of the variation this thing accounts for, and both run from 0 to 1.

=== step === concept
## Cramer's V and r: the rest of the family

The follow-up recorded two more things about each of those ninety people: whether they kept the weight off, a plain yes or no, and how many hours a week they exercised.

Neither of those is a group average, so neither d nor eta squared fits. The shape of the columns picks the measure for you.

Plan against kept-it-off is two categorical columns, and the effect size for that pair is **Cramer's V**. It starts from the chi-squared statistic, which measures how far a table of counts sits from the table you would expect if the two columns had nothing to do with each other, and rescales it onto a 0 to 1 range that stops growing with headcount. Kilos lost against exercise hours is two continuous columns, and the effect size there is **Pearson's r**, the ordinary correlation. That one already runs on a fixed scale from minus one to one, so it needs no rescaling at all.

```r
# Cramer's V for two categorical columns, Pearson r for two continuous ones
kept_table <- table(plan = followup$plan, kept_it_off = followup$kept_it_off)
kept_table
#>                   kept_it_off
#> plan               no yes
#>   low-fat          17  13
#>   meal replacement  9  21
#>   usual care       24   6

chi <- suppressWarnings(chisq.test(kept_table))
n_people <- sum(kept_table)
k_smaller <- min(dim(kept_table))
cramers_v <- sqrt(as.numeric(chi$statistic) / (n_people * (k_smaller - 1)))

followup$exercise_hours <- 6 + 0.30 * followup$loss_kg + make_arm(90, 0, 1.0)
r_loss_hours <- cor(followup$loss_kg, followup$exercise_hours)

round(c(cramers_v = cramers_v, r = r_loss_hours, r_squared = r_loss_hours^2), 3)
#> cramers_v         r r_squared
#>     0.411     0.796     0.634
```

Cramer's V comes back at 0.411 for plan against keeping it off, which is a strong link, and the table shows you why. 21 of the 30 on meal replacement kept it off, against 6 of the 30 on usual care.

Pearson's r for kilos lost against exercise hours is 0.796. Square it and you get 0.634, which lands on exactly the same explained-variation scale as eta squared. So exercise hours account for 63% of the variation in kilos lost and the plan accounts for 25%, and because both are shares of the same total you can set them side by side and say which matters more.

Here is the whole family on one card.

| Measure | Use it when | Small | Medium | Large |
|---|---|---|---|---|
| Cohen's d, Hedges' g | two groups, one number measured on each person | 0.2 | 0.5 | 0.8 |
| Eta squared, omega squared | three or more groups, one number measured on each person | 0.01 | 0.06 | 0.14 |
| Cramer's V | two categorical columns | 0.10 | 0.30 | 0.50 |
| Pearson's r | two continuous columns | 0.10 | 0.30 | 0.50 |

The V benchmarks in that row are for the smallest tables, the two by twos. Wider tables need a smaller V for the same strength of link, so report the size of the table next to it.

=== step === concept
## How to state a result as two answers

All of this comes down to one sentence you can say out loud in a meeting. Let's build it out of trial A, the awkward one.

```r
# Report trial A as two answers: how big the effect is, and whether it is real
report_test <- t.test(a_trt, a_ctl)
report_d <- cohens_d(a_trt, a_ctl)

cat("gap        :", round(mean(a_trt) - mean(a_ctl), 2), "kg\n")
cat("95% range  :", round(report_test$conf.int[1], 2), "to",
    round(report_test$conf.int[2], 2), "kg\n")
cat("Cohen's d  :", round(report_d, 3), interpret_d(report_d), "\n")
cat("p-value    :", round(report_test$p.value, 3), "\n")
#> gap        : 0.5 kg
#> 95% range  : 0.05 to 0.95 kg
#> Cohen's d  : 0.125 negligible
#> p-value    : 0.031
```

Read those four lines out in order and you have said it:

"The low-fat plan lost people half a kilo more than usual care, somewhere between 0.05 and 0.95 kg once you allow for sampling. That is a Cohen's d of 0.125, which is negligible. The p-value is 0.031."

Notice the shape of it. The size comes first, in kilos, because kilos are what the person across the table cares about. The range comes next, so nobody mistakes half a kilo for an exact figure. Then d, which says how big that gap is against the ordinary variation between people. The p-value comes last, doing the one job it can do, which is to say the gap was hard to get by luck.

Two questions, two answers. Is it real, yes. Is it big, no.

[TIP]
Order matters when you say this out loud. Lead with the p-value and everybody hears a win. Lead with the effect and its range, and the p-value drops into place as the footnote it always was.

=== step === quiz
## Quick check: a huge trial with a tiny d

A colleague brings you a study of 40,000 people. The p-value is 0.003 and Cohen's d is 0.03. How would you report it?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The p-value is well under 0.05, so this is a strong finding and worth acting on. ::no
- A d of 0.03 that small means the p-value must be wrong, so the result should be thrown out. ::no
- The effect is hard to explain by luck and far too small to act on, and both halves get said out loud. ::ok Exactly right, and that is the whole habit. With 40,000 people even a d of 0.03 clears the bar easily, so the small p-value is telling you about the headcount as much as the diet.
- With 40,000 people a p-value cannot be trusted, so only the effect size counts. ::no The two numbers answer two different questions and neither one cancels the other. The p-value says a gap this size would be hard to get by luck, which is true here. The d says the two crowds are three hundredths of a standard deviation apart, which is nothing anybody would notice. Report both and let the reader weigh them.

=== step === tryit
## Your turn: d and g for a 12-person rerun

The correction inside Hedges' g gets stronger as a trial gets smaller, so let's shrink one and watch it work.

Take the first 12 people from each arm of trial B, then run both `cohens_d()` and `hedges_g()` on those two shorter vectors and compare the answers.

```r
# b_trt and b_ctl hold trial B's two arms, 30 people each.
# Take the first 12 people from each arm with head(), then run
# cohens_d() and hedges_g() on the two shorter vectors.
# Press Check when you have them.
```
::check {"regex": "head[(]\\s*b_(trt|ctl)\\s*,\\s*12\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: d = 1.267 and g = 1.223. Cutting each arm from 30 people to 12 drags the correction factor from 0.987 down to 0.966, so g now sits about 3.5% under d instead of about 1%.", "no": "Build the two short vectors first, then pass them on: small_trt is head(b_trt, 12), small_ctl is head(b_ctl, 12), then call cohens_d(small_trt, small_ctl) and hedges_g(small_trt, small_ctl)."}
::solution
```r
# Recompute d and g on only the first 12 people in each arm of trial B
small_trt <- head(b_trt, 12)
small_ctl <- head(b_ctl, 12)

round(c(d = cohens_d(small_trt, small_ctl), g = hedges_g(small_trt, small_ctl)), 3)
#>     d     g
#> 1.267 1.223
```

Two things moved at once here, and they are worth separating.

Cohen's d went up, from 1.250 to 1.267, because 12 people are not the same as 30 people. This smaller slice happens to have a slightly wider gap and a slightly wider spread than the full arms did. That wobble is sampling, and it is exactly what makes small trials unreliable.

Hedges' g went the other way, down to 1.223, because the correction factor fell from 0.987 to 0.966 when the total headcount dropped from 60 to 24. The smaller the trial, the harder g pulls d back toward zero, which is the correction doing its job.

=== step === quiz
## Quick check: which measure fits which question?

A colleague has the year-one follow-up open in front of them: which plan each person was on, whether they kept the weight off, and their weekly exercise hours. They want to know how strongly the plan is linked to whether people kept it off.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Cohen's d, since the point is to compare groups against each other. ::no
- Eta squared, since there are three plans rather than two. ::no
- Cramer's V, since both of those columns hold categories rather than numbers. ::ok Yes. Plan is a category and kept-it-off is a category, and V is the measure built for a table of counts. It came back at 0.411, a strong link.
- Pearson's r, since the answer wanted is a single number between 0 and 1. ::no The shape of the two columns picks the measure, not what the answer should look like. Two categorical columns give Cramer's V. Three or more groups measured on a number give eta squared. Two groups measured on a number give d. Two continuous columns give r.

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Routledge. Where 0.2, 0.5 and 0.8 come from, and where Cohen himself warns against leaning on them.
- [Calculating and reporting effect sizes to facilitate cumulative science](https://doi.org/10.3389/fpsyg.2013.00863) - Lakens (2013), Frontiers in Psychology 4:863. A practical guide to d, g and eta squared, including which one to report when.
- [Effect size, confidence interval and statistical significance: a practical guide for biologists](https://doi.org/10.1111/j.1469-185X.2007.00027.x) - Nakagawa and Cuthill (2007), Biological Reviews 82, 591-605. The case for reporting effect sizes with intervals rather than p-values alone.
- [The New Statistics: Why and How](https://doi.org/10.1177/0956797613504966) - Cumming (2014), Psychological Science 25(1), 7-29. The argument for leading with the size of an effect and its uncertainty.
- [New effect size rules of thumb](https://doi.org/10.22237/jmasm/1257035100) - Sawilowsky (2009), Journal of Modern Applied Statistical Methods 8(2), 597-599. An extended set of landmarks, including very small and very large.

=== step === complete
## Quick recap

You started with two diet trials that a test could not tell apart, and you can now separate them with a single number. What you built along the way:

- A p-value blends the gap, the spread and the headcount. You held a half kilo effect perfectly still and watched p slide from 0.63 to 0.0000013 on volunteers alone.
- Cohen's d is the gap divided by the pooled standard deviation, so it carries no unit. Trial A came out at 0.125, trial B at 1.250, exactly ten times as much.
- Drawn to scale, d is how far apart two bell curves sit. At 0.125 they lie almost on top of each other, and at 1.25 they barely share any ground.
- Cohen's 0.2, 0.5 and 0.8 are a starting point, not a verdict. A tiny d that reaches millions of people can beat a large one that nobody will stick with.
- The shape of the data picks the measure: two groups give d or g, three or more give eta squared, two categorical columns give Cramer's V, two continuous columns give r.

And the sentence it was all for, said about trial A:

"The low-fat plan lost people half a kilo more than usual care, somewhere between 0.05 and 0.95 kg. That is a Cohen's d of 0.125, which is negligible. The p-value is 0.031."

Is it real, and is it big. Two questions, two numbers, and from now on you report both. Have a great day.

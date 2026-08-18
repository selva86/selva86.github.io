---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6-v2"
catalog_blurb: "How to say whether a real difference is also a big one."
description: "Two diet trials both passed the test: one moved half a kilo, the other moved five. Compute Cohen's d and its cousins in R and report size, not just luck."
keywords: "effect size, Cohen's d, Hedges g, eta squared, omega squared, Cramer's V, effect size in R, practical significance, p-value versus effect size, bootstrap interval, statistics for beginners, R"
date: "2026-08-19"
post_type: "LESSON"
curriculum_id: "0.0.15"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-5"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 6 of 7
## Effect size: Cohen's d and friends, explained

Part 5 ended by pointing at a number it had introduced and then walked away from: not whether the effect was real, but how big it was. This part is that number. If you missed the earlier parts, nothing here leans on them, because every piece gets built from the beginning.

Farah Haddad runs the nutrition clinic at a community health centre. There is room in the timetable for exactly one weight-loss programme, and two trials are open on her desk.

**Trial A** tested a diet called Lean Plate. Five hundred people on the plan, five hundred on usual care. The plan group lost **0.59 kg** more on average, and the trial reported **p = 0.019**.

**Trial B** tested time-restricted eating, where people eat only inside an eight-hour window. Twenty-two people on the plan, twenty-two on usual care. The plan group lost **5.42 kg** more, and the trial reported **p = 0.00002**.

Both trials passed. Both get written up as working. But half a kilo is a heavy lunch, and five and a half kilos is a different pair of trousers, and the word "significant" sits on both of them without flinching.

Here is what Farah is actually choosing between. Four bars, four average results, in kilograms.

::widget chart-plotter {"geoms":["bar"],"x":"arm","y":"kg_lost","data":[{"x":"A: usual care","y":0.39},{"x":"A: Lean Plate","y":0.98},{"x":"B: usual care","y":0.21},{"x":"B: fasting","y":5.63}]}

Trial A's two bars are almost the same height. Trial B's are not close. Yet the smaller p-value came from the trial with one twentieth of the people. Something is going on that a p-value was never built to tell you about, and this part is about the number that does tell you.

By the end you will be able to:

- Say in one sentence why a p-value cannot tell you how big an effect is
- Compute Cohen's d from two groups in R, and say what its units are
- Read a d against the usual benchmarks, and say when those benchmarks mislead
- Put an interval around an effect size instead of quoting a bare number
- Pick the right effect size for three groups, for a table of counts, or for two numeric columns

**What you need first:** you can read a simple R script, so a variable, a function call and a vector like `c(1, 2, 3)` look familiar. No statistics background is assumed, and every term is defined in plain words the moment it appears.

=== step === concept
::eyebrow The question a p-value answers
## What did the p-value actually answer?

Start with what a p-value is, because everything today is defined against it.

Suppose the Lean Plate diet does nothing at all. Not "a little", not "a bit less than claimed", but genuinely nothing: it makes no difference to anyone's weight. Even in that world, the two groups in the trial would not come out exactly equal. People differ. Some lose weight in a fortnight for reasons nobody recorded, and some gain it. So a gap of some size shows up every time, out of nothing but the luck of who ended up in which group.

**The p-value is the share of that luck-only world in which the gap comes out at least as big as the one you saw.** Small p means the result would be a rare accident if the plan did nothing. That is all it means.

Notice what is missing from that sentence. There is no kilogram in it. There is no "how much", no "worth doing", no "big". It is a statement about how *surprising* the result is, not about how *large* it is.

Let us build Farah's two trials so you can run every number in this lesson yourself.

```r
set.seed(11)

# Trial A: the Lean Plate diet, 500 people in each arm
n_a <- 500
trial_a <- data.frame(
  arm     = rep(c("usual care", "Lean Plate"), each = n_a),
  kg_lost = c(rnorm(n_a, mean = 0.4, sd = 4.0),
              rnorm(n_a, mean = 0.9, sd = 4.0))
)

# Trial B: time-restricted eating, 22 people in each arm
n_b <- 22
trial_b <- data.frame(
  arm     = rep(c("usual care", "time-restricted"), each = n_b),
  kg_lost = c(rnorm(n_b, mean = 0.4, sd = 4.0),
              rnorm(n_b, mean = 5.4, sd = 4.0))
)

# One vector per arm, so every later step can reach for them
a_ctrl <- trial_a$kg_lost[trial_a$arm == "usual care"]
a_plan <- trial_a$kg_lost[trial_a$arm == "Lean Plate"]
b_ctrl <- trial_b$kg_lost[trial_b$arm == "usual care"]
b_plan <- trial_b$kg_lost[trial_b$arm == "time-restricted"]

# The verdict each trial reported
round(c(trial_a = t.test(a_plan, a_ctrl)$p.value,
        trial_b = t.test(b_plan, b_ctrl)$p.value), 5)
#> trial_a trial_b 
#> 0.01918 0.00002
```

[NOTE]
Farah's two trials are stand-ins, generated here in R to the shape the two real reports had: the same headcounts, the same average gaps, the same person-to-person variation. Everything printed in this lesson is real output from the code beside it, so you can change a number and watch what moves.

Both p-values clear the usual 0.05 bar. Trial A says a gap this big would turn up by luck about 19 times in a thousand. Trial B says twice in a hundred thousand. Both trials get to say the word "significant", and neither number told you a single thing about kilograms.

=== step === concept
::eyebrow The uncomfortable part
## Why did the half-kilo plan pass at all?

Trial A found 0.59 kg. That is small. So how did it pass?

Because a p-value has a second ingredient nobody talks about: the number of people. Take Trial A's gap of 0.59 kg and Trial A's person-to-person variation, hold both of them absolutely fixed, and change only the headcount. Here is what the p-value does.

```r
gap_a <- mean(a_plan) - mean(a_ctrl)
round(gap_a, 2)
#> [1] 0.59

# How much a gap wobbles: it shrinks as the headcount grows
v_gap  <- var(a_ctrl) + var(a_plan)
sizes  <- c(25, 50, 100, 250, 500, 1000)
se     <- sqrt(v_gap / sizes)
t_stat <- gap_a / se

# pt() turns a t statistic into a p-value, the same conversion t.test() does inside
p_by_n <- data.frame(
  n_per_arm = sizes,
  p_value   = round(2 * pt(-abs(t_stat), df = 2 * sizes - 2), 4)
)
p_by_n
#>   n_per_arm p_value
#> 1        25  0.6023
#> 2        50  0.4600
#> 3       100  0.2954
#> 4       250  0.0978
#> 5       500  0.0192
#> 6      1000  0.0009
```

Read the two columns together. The diet is identical on every row. The gap is 0.59 kg on every row. The spread of results between people is identical on every row. The only thing that changes is how many people were recruited, and the p-value falls from 0.60 to 0.0009.

At 25 people per arm the same diet looks like nothing. At 500 it is significant. At 1,000 it is very significant. Nothing about the diet improved. Farah's clinic just got a bigger budget.

```r
library(ggplot2)

ggplot(p_by_n, aes(n_per_arm, p_value)) +
  geom_hline(yintercept = 0.05, linetype = "dashed", colour = "#c0392b") +
  geom_line(colour = "#2c7fb8", linewidth = 1) +
  geom_point(size = 3, colour = "#2c7fb8") +
  scale_x_log10(breaks = sizes) +
  labs(title = "Same 0.59 kg gap, same spread, only the headcount changes",
       subtitle = "Below the dashed line at 0.05 the trial gets called significant",
       x = "people per arm (log scale)", y = "p-value") +
  theme_minimal(base_size = 13)
```

[KEY INSIGHT]
A p-value mixes two things that have nothing to do with each other: how big the effect is, and how many people you asked. Given enough people, an effect too small to care about will pass. Given too few, an effect worth acting on will fail. So "did it pass?" and "is it big?" have to be answered by two different numbers.

=== step === quiz
::eyebrow Check yourself
## What does p = 0.048 buy you?

A colleague emails Farah about a third trial and writes: "Good news, the new plan came out at p = 0.048." Nothing else is in the email.

Which of these is the correct reading of that number, on its own?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 4.8 percent chance the plan does nothing. ::no A p-value is a share of a luck-only world, not a success rate and not a quantity of kilograms. Its size is driven as much by the headcount as by the effect, which is exactly what the last step showed, so on its own it can never answer "how big".
- The effect is small, because 0.048 is a small number. ::no A p-value is a share of a luck-only world, not a success rate and not a quantity of kilograms. Its size is driven as much by the headcount as by the effect, which is exactly what the last step showed, so on its own it can never answer "how big".
- If the plan did nothing, a result at least this good would turn up about 4.8 percent of the time. It says nothing about the size of the effect. ::ok Exactly. That is the whole content of the number, and the second sentence is the part that matters today. The email told Farah that the result is hard to explain away as luck, and told her nothing at all about whether the plan is worth an hour of clinic time.
- The plan works 95.2 percent of the time. ::no A p-value is a share of a luck-only world, not a success rate and not a quantity of kilograms. Its size is driven as much by the headcount as by the effect, which is exactly what the last step showed, so on its own it can never answer "how big".

=== step === concept
::eyebrow The simplest effect size there is
## How big is the gap, in kilos?

So we need a number that answers "how big". The first one is embarrassingly simple, and people skip past it far too fast: the raw difference between the two averages.

```r
gap_b <- mean(b_plan) - mean(b_ctrl)
round(c(trial_a = gap_a, trial_b = gap_b), 2)
#> trial_a trial_b 
#>    0.59    5.42
```

There it is. Trial A moved people by 0.59 kg. Trial B moved them by 5.42 kg. Farah's patients do not care about p-values, and they care very much about that second number.

An **effect size** is any number that describes how big a difference or a relationship is, on a scale that does not grow just because you recruited more people. The raw gap qualifies. Recruiting another thousand people would sharpen the estimate of it, but it would not push it up.

[TIP]
If your reader understands the units, the raw difference is the best effect size you can report. Kilograms, minutes, pounds sterling, percentage points. Never replace a number your reader can picture with one they cannot.

So why is there anything more to learn? Because a raw gap only travels as far as its units do. Farah cannot compare 5.42 kg against a colleague's trial measured in body-mass index, or against a diabetes trial measured in blood sugar. And, as the next step shows, a gap in kilograms does not even mean the same thing in two different clinics.

=== step === concept
::eyebrow The missing ingredient
## Why kilos alone will not travel

Here is the part that makes effect size click, so take it slowly.

Imagine two clinics running the same trial and getting the same result: the plan group loses 0.5 kg more than the control group.

In the first clinic, the people are remarkably alike. Everybody's fortnight lands within about a kilogram of everybody else's, in both arms. A half-kilo gap in that clinic is enormous. It shifts almost the whole group.

In the second clinic, people are all over the place. Some lose 8 kg, some gain 6, for reasons that have nothing to do with the diet. A half-kilo gap in that clinic disappears into the noise. You could not pick a dieter out of a line-up.

Same 0.5 kg. Completely different meaning. The thing that changed is the **spread**: how far apart people are from each other inside a single arm. Statistics measures spread with the **standard deviation**, which is roughly the typical distance between one person's result and their group's average.

```r
library(ggplot2)

kg_grid <- seq(-14, 14, by = 0.05)
spread_demo <- rbind(
  data.frame(kg = kg_grid, height = dnorm(kg_grid, mean = 0.0, sd = 1),
             arm = "usual care", world = "A clinic where the spread is 1 kg"),
  data.frame(kg = kg_grid, height = dnorm(kg_grid, mean = 0.5, sd = 1),
             arm = "the plan",   world = "A clinic where the spread is 1 kg"),
  data.frame(kg = kg_grid, height = dnorm(kg_grid, mean = 0.0, sd = 4),
             arm = "usual care", world = "Farah clinic, where the spread is 4 kg"),
  data.frame(kg = kg_grid, height = dnorm(kg_grid, mean = 0.5, sd = 4),
             arm = "the plan",   world = "Farah clinic, where the spread is 4 kg")
)

ggplot(spread_demo, aes(kg, height, colour = arm)) +
  geom_line(linewidth = 1.1) +
  facet_wrap(~ world, ncol = 1, scales = "free_y") +
  labs(title = "The same half-kilo gap, in two different clinics",
       x = "kilograms lost", y = "how common", colour = NULL) +
  theme_minimal(base_size = 13)
```

Each curve shows how common each result is in one arm. Run it and look at the two panels. In the top panel the two curves are clearly two curves. In the bottom panel they are almost one blob with a slight lean. The distance between their peaks is 0.5 kg in both.

That is the whole idea: **a gap only means something next to the spread it sits in.** So measure the gap in units of spread, and you have a number that survives leaving the clinic.

=== step === concept
::eyebrow The main event
## What is Cohen's d?

Cohen's d is the mean gap divided by the spread. That is the entire idea, and the rest of this step is just being careful about which spread.

\[ d = \frac{\bar{x}_1 - \bar{x}_2}{s_p} \]

Reading it out loud: \(\bar{x}_1\) is the average of the first group (the plan arm), \(\bar{x}_2\) is the average of the second group (the control arm), so the top is the raw gap you already computed. The \(s_p\) on the bottom is the **pooled standard deviation**, and "pooled" just means one spread built from both arms together instead of picking one arm's spread arbitrarily.

\[ s_p = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}} \]

Here \(n_1\) and \(n_2\) are how many people are in each arm, and \(s_1\) and \(s_2\) are each arm's own standard deviation. Squaring a standard deviation gives the **variance**, which is what `var()` returns in R, and variance is the thing that averages sensibly. So the formula says: take each arm's variance, weight it by how many people that arm contributed, average the two, and take the square root to get back to kilograms.

On Trial A:

```r
s_pooled_a <- sqrt(((n_a - 1) * var(a_ctrl) + (n_a - 1) * var(a_plan)) /
                   (n_a + n_a - 2))
round(s_pooled_a, 2)
#> [1] 3.99

d_a <- gap_a / s_pooled_a
round(d_a, 3)
#> [1] 0.148
```

Follow the arithmetic once, on real numbers. The typical distance between one Trial A person and their arm's average is 3.99 kg. The gap between the two arms is 0.59 kg. Divide one by the other: 0.148.

**And now the units.** The 3.99 on the bottom is in kilograms and the 0.59 on top is in kilograms, so they cancel, and d has no units at all. What d counts is *spreads*. Trial A's diet moved people by about a seventh of one ordinary spread. That sentence would mean exactly the same thing if the trial had been measured in pounds, or in stones, or in blood sugar, which is precisely why d travels and kilograms do not.

=== step === concept
::eyebrow The reveal
## The two trials, in d

Now put both of Farah's trials on that one scale.

```r
s_pooled_b <- sqrt(((n_b - 1) * var(b_ctrl) + (n_b - 1) * var(b_plan)) /
                   (n_b + n_b - 2))
d_b <- gap_b / s_pooled_b

round(c(trial_a = d_a, trial_b = d_b), 2)
#> trial_a trial_b 
#>    0.15    1.45

round(d_b / d_a, 1)
#> [1] 9.8
```

Trial B's effect is **9.8 times** the size of Trial A's. Nearly ten to one. And the two p-values said only that both had cleared the same bar.

```r
library(ggplot2)

both_trials <- rbind(
  data.frame(trial = paste0("Trial A: Lean Plate, d = ", round(d_a, 2)), trial_a),
  data.frame(trial = paste0("Trial B: time-restricted, d = ", round(d_b, 2)), trial_b)
)
both_trials$group <- ifelse(both_trials$arm == "usual care",
                            "usual care", "the new plan")

ggplot(both_trials, aes(kg_lost, fill = group)) +
  geom_density(alpha = 0.45, colour = NA) +
  facet_wrap(~ trial, ncol = 1) +
  labs(title = "Both trials passed. Only one of them separated the arms.",
       x = "kilograms lost", y = "how common", fill = NULL) +
  theme_minimal(base_size = 13)
```

Run it and look at the two panels. In Trial A the two shapes sit almost on top of each other. In Trial B they have pulled apart into two visible humps. That separation is what d is measuring, and it is the picture Farah needed on day one.

[NOTE]
Trial B's shapes look bumpy because they are drawn from 22 real people per arm, not from a formula. That bumpiness is not a flaw in the plot. It is a preview of a problem we come back to at step 14: with 22 people, you do not know d very precisely either.

=== step === tryit
::eyebrow Your turn
## Your turn: d for the walking programme

There is a third plan on Farah's desk. A twelve-week walking programme was trialled at a neighbouring clinic on twelve people, against twelve on usual care, and the report gives every individual result rather than a summary.

Below is the whole calculation with one piece missing. The pooled spread has already been worked out for you and stored in `s_pooled_w`. Fill in the blank so that `d_walk` is the gap measured in pooled spreads, then press Check.

```r
walk_ctrl <- c( 1.2, -2.6,  3.4, -0.7,  2.9,  0.3,  4.1, -3.2,  1.8,  0.6,  3.8, -1.4)
walk_prog <- c( 3.1,  0.7,  5.8,  4.0, -1.7,  6.6,  1.9,  3.5,  5.2,  0.0,  4.4,  2.3)
n_w <- 12

s_pooled_w <- sqrt(((n_w - 1) * var(walk_ctrl) + (n_w - 1) * var(walk_prog)) /
                   (n_w + n_w - 2))

d_walk <- (mean(walk_prog) - mean(walk_ctrl)) / ____

round(c(gap = mean(walk_prog) - mean(walk_ctrl),
        pooled_sd = s_pooled_w,
        d = d_walk), 3)
```
::check {"regex":"/\\s*s_pooled_w","gate":true,"difficulty":"beginner","ok":"That is it. The walkers lost 2.133 kg more than the controls, the pooled spread is 2.469 kg, and dividing one by the other gives d = 0.864. So the walking programme moved people by about seven eighths of one ordinary spread, which is nearly six times Trial A and still well short of Trial B. Notice that the raw gap here (2.13 kg) is much smaller than Trial B (5.42 kg), yet the two are closer in d than those raw numbers suggest, because the walking trial had a much tighter spread to divide by.","no":"The divisor has to be the spread the two arms share, and it is already sitting in the variable s_pooled_w. Dividing by the number of people, or by one arm sd alone, would answer a different question. Put s_pooled_w in the blank."}
::solution
```r
walk_ctrl <- c( 1.2, -2.6,  3.4, -0.7,  2.9,  0.3,  4.1, -3.2,  1.8,  0.6,  3.8, -1.4)
walk_prog <- c( 3.1,  0.7,  5.8,  4.0, -1.7,  6.6,  1.9,  3.5,  5.2,  0.0,  4.4,  2.3)
n_w <- 12

s_pooled_w <- sqrt(((n_w - 1) * var(walk_ctrl) + (n_w - 1) * var(walk_prog)) /
                   (n_w + n_w - 2))

d_walk <- (mean(walk_prog) - mean(walk_ctrl)) / s_pooled_w

round(c(gap = mean(walk_prog) - mean(walk_ctrl),
        pooled_sd = s_pooled_w,
        d = d_walk), 3)
#>       gap pooled_sd         d 
#>     2.133     2.469     0.864
```

=== step === concept
::eyebrow What d feels like
## How often does a Lean Plate dieter beat a control?

"A seventh of a spread" is honest but hard to picture. Here is a translation anybody understands.

Pick one person at random from the plan arm and one at random from the control arm. How often does the plan person lose more weight? If the plan does nothing, the answer is 50 percent, a coin flip. The bigger the effect, the further above 50 that number climbs. It is called the **probability of superiority**, and when both groups have roughly bell-shaped results with similar spread it comes straight out of d:

\[ \Pr(\text{plan person loses more}) = \Phi\left(\frac{d}{\sqrt{2}}\right) \]

\(\Phi\) is the running total under the standard bell curve, which is what `pnorm()` gives you in R: hand it a number, and it returns the share of the curve lying to the left of it.

```r
# Farah's walking programme again, the same twelve pairs as two steps back
walk_ctrl <- c( 1.2, -2.6,  3.4, -0.7,  2.9,  0.3,  4.1, -3.2,  1.8,  0.6,  3.8, -1.4)
walk_prog <- c( 3.1,  0.7,  5.8,  4.0, -1.7,  6.6,  1.9,  3.5,  5.2,  0.0,  4.4,  2.3)
n_w        <- 12
s_pooled_w <- sqrt(((n_w - 1) * var(walk_ctrl) + (n_w - 1) * var(walk_prog)) /
                   (n_w + n_w - 2))
d_walk     <- (mean(walk_prog) - mean(walk_ctrl)) / s_pooled_w

round(pnorm(c(trial_a = d_a, trial_b = d_b, walking = d_walk) / sqrt(2)), 3)
#> trial_a trial_b walking 
#>   0.542   0.847   0.729
```

Now the three plans are in a language Farah can use in a consultation.

- **Trial A, Lean Plate.** 54 times in 100 instead of 50. Four extra wins per hundred coin flips. That is what a significant result with p = 0.019 bought.
- **Trial B, time-restricted.** 85 times in 100. Most people on the plan beat most people off it.
- **Walking.** 73 times in 100.

[KEY INSIGHT]
Trial A is not nothing. It is real, and 54 against 50 is a genuine tilt. It is just very small, and the p-value could never have told her that, because a p-value has no idea what 54 against 50 feels like.

=== step === concept
::eyebrow Reading the number
## Small, medium, large: whose sizes are these?

You will meet three numbers everywhere effect sizes are discussed: 0.2 is small, 0.5 is medium, 0.8 is large. They come from Jacob Cohen, the psychologist whose 1988 book popularised d.

Here they are next to Farah's clinic, where the pooled spread is 3.99 kg, so one spread is roughly 4 kg.

| Cohen's label | d | in kilograms | plan person beats control |
|---|---|---|---|
| small | 0.2 | 0.80 kg | 56 in 100 |
| medium | 0.5 | 2.00 kg | 64 in 100 |
| large | 0.8 | 3.19 kg | 71 in 100 |
| Trial A, Lean Plate | 0.15 | 0.59 kg | 54 in 100 |
| Walking programme | 0.86 | 2.13 kg | 73 in 100 |
| Trial B, time-restricted | 1.45 | 5.42 kg | 85 in 100 |

The top three rows convert Cohen's labels at Farah's spread of 3.99 kg. The bottom three carry each trial's own gap, which is why the walking programme reaches d = 0.86 on 2.13 kg: its people were far more alike, so it had a tighter spread to divide by.

Now the honest part, and it matters more than the table. Cohen picked those three numbers by looking at the psychology research of his day and describing what a typical small, medium and large study looked like. He said in print that they were arbitrary, offered them only for fields with nothing better to go on, and warned against exactly the use they get put to.

Because the right benchmark depends entirely on the field:

- In a large drug trial, d = 0.2 can be worth licensing, because the outcome is survival and the treatment is cheap.
- In education, d = 0.4 is often treated as a good year's progress, so 0.8 would be extraordinary.
- In a lab study of reaction times under tightly controlled conditions, d = 0.8 is unremarkable, because the spread is tiny by design.

[WARNING]
"Large by Cohen's benchmark" is not a reason to do anything. It is a reason to ask two more questions: what does that d mean in the units my reader lives in, and how sure am I of the d itself? Steps 13 and 14 are those two questions.

=== step === quiz
::eyebrow Check yourself
## When does a large d still not mean act?

A primary school sends Farah a study of a new reading app. Fourteen children used the app, fourteen did not, and the report says d = 0.9, above Cohen's "large" line.

The head teacher wants to buy it for the whole school. What is the right response?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, buy it. 0.9 is above 0.8, so this is a large effect by the standard benchmark. ::no Neither number settles it on its own. A benchmark label is a rough rule of thumb borrowed from another field, and a bare d with no interval and no translation back into reading-test points cannot tell a head teacher whether the money is well spent. Fourteen children per group is also very few.
- Ask two things first: how many reading-test points 0.9 spreads actually is, and how precisely 0.9 was pinned down by fourteen children per group. ::ok Right on both counts. Translating d back into the units the school cares about is what turns it into a decision, and with fourteen children per arm the d itself could be almost anywhere, which is exactly what step 14 measures. Neither question needs a statistician, and either one can change the answer.
- Reject it, because d cannot be trusted below 30 people per group, so the study is meaningless. ::no Neither number settles it on its own, and this overcorrects. A small study is imprecise, not worthless, and there is no magic headcount at which a number switches from meaningless to trustworthy. The useful move is to ask what 0.9 means in reading-test points and how precisely it was measured.
- Buy it, because once you have a large effect size the p-value no longer matters. ::no Neither number settles it on its own. A benchmark label is a rough rule of thumb borrowed from another field, and a bare d with no interval and no translation back into reading-test points cannot tell a head teacher whether the money is well spent. Fourteen children per group is also very few.

=== step === concept
::eyebrow A small correction
## Hedges' g, the small-sample fix

Cohen's d has a quiet flaw. When the groups are small, it runs slightly too big. Not because of any mistake in the arithmetic, but because the pooled spread on the bottom is itself estimated from few people, and small samples tend to underestimate spread. A too-small divisor makes a too-large d.

Larry Hedges worked out the correction in 1981. Multiply d by a factor a shade under 1:

\[ g = d \times \left( 1 - \frac{3}{4\,df - 1} \right), \qquad df = n_1 + n_2 - 2 \]

Here \(df\) is the **degrees of freedom**, which for two groups is simply the total headcount minus 2. The corrected number is called **Hedges' g**. In R it is one line:

```r
J_b <- 1 - 3 / (4 * (n_b + n_b - 2) - 1)
round(c(J = J_b, d = d_b, g = J_b * d_b), 3)
#>     J     d     g 
#> 0.982 1.449 1.423
```

With 22 per arm the factor is 0.982, so Trial B's 1.449 comes down to 1.423. Barely anything, and that is the point: the fix is small, cheap, and always in the right direction.

Watch what it does at Trial A's headcount:

```r
J_a <- 1 - 3 / (4 * (n_a + n_a - 2) - 1)
round(J_a, 4)
#> [1] 0.9992
```

0.9992. Nothing at all. The correction bites when the groups are small, 1.8 percent at Trial B's 22 per arm and more below that, and by Trial A's 500 it has vanished. So apply it on small groups, and stop thinking about it on large ones.

[TIP]
Report g rather than d whenever your groups are small, and say which one you used. Many papers write "Cohen's d" when they computed g, which is harmless when the groups are large and misleading when they are not.

=== step === concept
::eyebrow How sure are we?
## How sure are we of d itself?

Trial B's d is 1.449, and its corrected g is 1.423. Both were measured on 22 people per arm, so if the trial were run again on 22 different people, both would come out different. So how different? The question is easiest to ask about d, and the answer carries straight over to g, because g is only d multiplied by that fixed factor of 0.982.

There is a way to find out using nothing but the data you already have, and it is called the **bootstrap**. The idea is honest and slightly cheeky. Your 22 dieters are your best picture of the kind of people this plan attracts. So build a new pretend trial by drawing 22 people *from those same 22, with replacement*, which means the same person can be drawn twice and some are not drawn at all. Do the same for the controls. Compute d on that pretend trial. Then do it two thousand times, and look at the spread of answers you get.

```r
set.seed(7)
n_reps <- 2000
boot_d <- numeric(n_reps)

for (i in 1:n_reps) {
  ctrl_i <- sample(b_ctrl, n_b, replace = TRUE)
  plan_i <- sample(b_plan, n_b, replace = TRUE)
  s_i    <- sqrt(((n_b - 1) * var(ctrl_i) + (n_b - 1) * var(plan_i)) /
                 (n_b + n_b - 2))
  boot_d[i] <- (mean(plan_i) - mean(ctrl_i)) / s_i
}

round(quantile(boot_d, c(0.025, 0.975)), 2)
#>  2.5% 97.5% 
#>  0.86  2.30
```

`quantile(boot_d, 0.025)` returns the value that 2.5 percent of the two thousand answers fall below, and `0.975` the value that 2.5 percent fall above. Cutting those two tails off leaves the middle 95 percent, and that range is the **95 percent confidence interval** for d: the set of values for d that this data is comfortable with.

For Trial B it runs from 0.86 to 2.30. So the honest sentence is not "d is 1.45". It is "d is about 1.45, and the data is consistent with anything from 0.86 to 2.30". Even the low end is past Cohen's "large" line, so Farah's conclusion survives.

```r
library(ggplot2)

boot_frame <- data.frame(d = boot_d)
ci_b <- quantile(boot_d, c(0.025, 0.975))

ggplot(boot_frame, aes(d)) +
  geom_histogram(bins = 40, fill = "#8fb8d8", colour = "white") +
  geom_vline(xintercept = as.numeric(ci_b), linetype = "dashed", linewidth = 0.8) +
  geom_vline(xintercept = d_b, colour = "#c0392b", linewidth = 1.1) +
  labs(title = "2,000 re-runs of Trial B, each one re-measured in d",
       subtitle = "Red is the d we got. The dashed lines cut off the middle 95 percent.",
       x = "Cohen's d", y = "how many of the 2,000 re-runs") +
  theme_minimal(base_size = 13)
```

The histogram is wide, and it should be. Twenty-two people per arm does not pin a number down.

=== step === tryit
::eyebrow Your turn
## Your turn: an interval for the walking d

The walking programme came out at d = 0.864, past Cohen's "large" line. It was measured on twelve people per arm.

The bootstrap below is already written and already run 2,000 times. All that is missing is the last line: the two cut-off points that leave the middle 95 percent between them. Fill in both blanks and press Check.

```r
set.seed(7)
boot_walk <- numeric(2000)

for (i in 1:2000) {
  ctrl_i <- sample(walk_ctrl, n_w, replace = TRUE)
  prog_i <- sample(walk_prog, n_w, replace = TRUE)
  s_i    <- sqrt(((n_w - 1) * var(ctrl_i) + (n_w - 1) * var(prog_i)) /
                 (n_w + n_w - 2))
  boot_walk[i] <- (mean(prog_i) - mean(ctrl_i)) / s_i
}

round(quantile(boot_walk, c(____, ____)), 2)
```
::check {"regex":"0\\.025\\s*,\\s*0\\.975","gate":true,"difficulty":"intermediate","ok":"Correct: to keep the middle 95 percent you cut 2.5 percent off each end, which is 0.025 and 0.975. The answer comes back as 0.13 to 1.87, and it is worth sitting with. The walking programme scored a large d by the benchmark, but the data is equally comfortable with 0.13, which is smaller than Trial A, and with 1.87, which is enormous. Twelve people per arm bought Farah almost no information about the size of the effect, and the bare 0.864 hid that completely.","no":"Ninety-five percent in the middle means 5 percent left over, split evenly between the two tails, so 2.5 percent gets cut off each end. Write the two cut-off points as decimals, the lower one first."}
::solution
```r
set.seed(7)
boot_walk <- numeric(2000)

for (i in 1:2000) {
  ctrl_i <- sample(walk_ctrl, n_w, replace = TRUE)
  prog_i <- sample(walk_prog, n_w, replace = TRUE)
  s_i    <- sqrt(((n_w - 1) * var(ctrl_i) + (n_w - 1) * var(prog_i)) /
                 (n_w + n_w - 2))
  boot_walk[i] <- (mean(prog_i) - mean(ctrl_i)) / s_i
}

round(quantile(boot_walk, c(0.025, 0.975)), 2)
#>  2.5% 97.5% 
#>  0.13  1.87
```

Compare the two intervals. Trial B ran from 0.86 to 2.30, and every value in it is worth acting on. Walking runs from 0.13 to 1.87, which contains both "barely worth mentioning" and "the best thing on the desk". Same benchmark label, completely different amount of knowledge.

=== step === concept
::eyebrow Beyond two groups
## Three groups: eta-squared

Cohen's d has one hard requirement: exactly two groups. Farah's clinic ran a follow-up with three arms, so d has nothing to say about it, and the question changes shape.

With three or more groups, it becomes: **of all the variation in weight lost, what share lines up with which arm people were in?** That share is called **eta-squared**, written \(\eta^2\).

The follow-up put 120 people across the three arms and recorded three things about each of them: kilograms lost, how many days they logged a food diary, and whether they finished the programme. This step uses the first. The other two come back in the two steps after it. Like the trials, it is built in R here, so every number you see is one you can run.

```r
set.seed(23)
arm_labels  <- rep(c("usual care", "Lean Plate", "time-restricted"), each = 40)
days_logged <- round(rnorm(120, mean = 45, sd = 15))
days_logged[days_logged < 0] <- 0
arm_boost   <- c("usual care" = 0.3, "Lean Plate" = 1.6,
                 "time-restricted" = 3.6)[arm_labels]

followup <- data.frame(
  arm         = factor(arm_labels,
                       levels = c("usual care", "Lean Plate", "time-restricted")),
  days_logged = days_logged,
  kg_lost     = as.numeric(arm_boost) + 0.14 * (days_logged - 45) +
                rnorm(120, mean = 0, sd = 2.6)
)
finish_rate       <- c("usual care" = 0.85, "Lean Plate" = 0.72,
                       "time-restricted" = 0.50)[arm_labels]
followup$finished <- ifelse(runif(120) < finish_rate, "finished", "dropped out")

round(tapply(followup$kg_lost, followup$arm, mean), 2)
#>      usual care      Lean Plate time-restricted 
#>            0.47            1.27            3.71
```

The tool that splits variation into "between the arms" and "within the arms" is analysis of variance, `aov()` in R. Its table is where the two ingredients come from.

```r
fit <- aov(kg_lost ~ arm, data = followup)
summary(fit)
#>              Df Sum Sq Mean Sq F value   Pr(>F)    
#> arm           2  228.1  114.06   13.36 5.97e-06 ***
#> Residuals   117  999.3    8.54                     
```

The `Sum Sq` column is total squared distance, and it splits in two. The `arm` row, 228.1, is the part explained by which arm someone was in. The `Residuals` row, 999.3, is the part left over, the differences between people inside the same arm. Eta-squared is the first as a share of the whole:

\[ \eta^2 = \frac{SS_{\text{between}}}{SS_{\text{between}} + SS_{\text{within}}} \]

There is one wrinkle. Eta-squared runs a little high, for the same reason d does: it is computed from the sample, and the sample flatters itself. **Omega-squared**, written \(\omega^2\), is the bias-corrected twin, and it subtracts off the share the arms would appear to explain even if they explained nothing at all.

\[ \omega^2 = \frac{SS_{\text{between}} - df_{\text{between}} \times MS_{\text{within}}}{SS_{\text{between}} + SS_{\text{within}} + MS_{\text{within}}} \]

\(MS_{\text{within}}\) is the `Mean Sq` from the Residuals row, 8.54, and \(df_{\text{between}}\) is the 2 in the `Df` column.

```r
tab        <- summary(fit)[[1]]
ss_between <- tab[1, "Sum Sq"]
ss_within  <- tab[2, "Sum Sq"]
df_between <- tab[1, "Df"]
ms_within  <- tab[2, "Mean Sq"]

eta_sq   <- ss_between / (ss_between + ss_within)
omega_sq <- (ss_between - df_between * ms_within) /
            (ss_between + ss_within + ms_within)

round(c(eta_squared = eta_sq, omega_squared = omega_sq), 3)
#>   eta_squared omega_squared 
#>         0.186         0.171
```

So about 17 to 19 percent of the differences in weight lost line up with which arm someone was in. The other four fifths is people being people. Report \(\omega^2\) when you can; the gap between the two shrinks as the study grows.

=== step === concept
::eyebrow Beyond numeric outcomes
## Counts in a table: Cramer's V

Now relax a different requirement. Weight lost is a number. But Farah also wants to know whether the three arms differ in **whether people stuck with the programme at all**, and "finished" against "dropped out" is not a number, it is a label. So there is no mean, no spread, and no d.

What you have instead is a table of counts.

```r
finish_tbl <- table(followup$arm, followup$finished)
finish_tbl
#>                  
#>                   dropped out finished
#>   usual care                5       35
#>   Lean Plate               13       27
#>   time-restricted          21       19
```

The usual test for a table like this is the chi-squared test, which measures how far the counts sit from what you would expect if the two things were unrelated. And it has exactly the disease we met at step 3: multiply every count by ten and the chi-squared statistic multiplies by ten too, while the pattern in the table has not changed one bit.

**Cramer's V** is that statistic scaled back down into a size. It runs from 0, no association whatsoever, to 1, perfect association.

\[ V = \sqrt{\frac{\chi^2}{n \,(k - 1)}} \]

Here \(\chi^2\) is the chi-squared statistic, \(n\) is the total number of people in the table, and \(k\) is the smaller of the two dimensions, so for a table with 3 rows and 2 columns, \(k = 2\).

```r
chi <- chisq.test(finish_tbl)
round(c(chi_squared = as.numeric(chi$statistic), p_value = chi$p.value), 4)
#> chi_squared     p_value 
#>     14.5869      0.0007

cramers_v <- sqrt(as.numeric(chi$statistic) /
                  (sum(finish_tbl) * (min(dim(finish_tbl)) - 1)))
round(cramers_v, 3)
#> [1] 0.349
```

V = 0.349, a moderate association. And unlike the 14.59, that 0.349 would not move if the clinic had recruited ten times as many people with the same drop-out pattern.

Now look back at the table, because this is the finding Farah would otherwise have missed. Time-restricted eating had by far the biggest effect on weight, and it also lost 21 of its 40 people. Roughly half the group never finished. An effect size measured on the people who stayed is not an effect size on the people you would enrol.

=== step === concept
::eyebrow Beyond groups entirely
## Two numeric columns: r

Last relaxation. Sometimes there are no groups at all, just two numbers measured on the same people. Farah has a pair: every person's weight lost, and the number of days they logged their food diary.

The measure here is **Pearson's correlation**, written \(r\). It runs from -1 to +1: 0 means the two move independently, +1 means they rise together in a perfect straight line, and -1 means one rises exactly as the other falls. Being already unit-free and already bounded, r *is* an effect size. There is nothing to convert.

```r
library(ggplot2)

ggplot(followup, aes(days_logged, kg_lost)) +
  geom_point(alpha = 0.65, size = 2.4, colour = "#2c7fb8") +
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE, colour = "#c0392b") +
  labs(title = "Days logged against kilograms lost, all 120 people",
       x = "days the food diary was logged", y = "kilograms lost") +
  theme_minimal(base_size = 13)
```

```r
r <- cor(followup$days_logged, followup$kg_lost)
round(c(r = r, r_squared = r^2), 3)
#>         r r_squared 
#>     0.513     0.263
```

r = 0.513: people who logged more days lost more weight, and the tie is a solid one. Squaring it gives **r-squared**, 0.263, which reads as a share exactly like eta-squared did: about 26 percent of the differences in weight lost line up with differences in days logged.

[WARNING]
r measures how tightly two things move together. It does not say that one causes the other. People who log their diary for longer are probably more motivated in a dozen ways that no column here records, and Farah handing out more diary pages would not, by itself, move anybody's weight.

=== step === quiz
::eyebrow Check yourself
## Which effect size fits which data?

A colleague at the same health centre has average hours of sleep for staff on four different shift patterns, and wants a single number for how much the shift pattern matters.

Which effect size fits?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Cohen's d, because it is the standard measure for comparing groups. ::no Match the measure to the shape of the data. d needs exactly two groups, Cramer's V needs an outcome that is a label rather than a number, and r needs two numeric columns and no groups at all. Sleep hours across four shift patterns is a numeric outcome with more than two groups.
- Eta-squared, because there are more than two groups and the outcome is a number. ::ok Exactly. Sleep hours is numeric and there are four groups, so the question becomes what share of the variation in sleep lines up with shift pattern, which is what eta-squared reports. Report omega-squared beside it if you can, since it corrects the same small upward bias that Hedges' g corrects for d.
- Cramer's V, because there are four categories. ::no Match the measure to the shape of the data. d needs exactly two groups, Cramer's V needs an outcome that is a label rather than a number, and r needs two numeric columns and no groups at all. Sleep hours across four shift patterns is a numeric outcome with more than two groups.
- Pearson's r, because it works for any two variables. ::no Match the measure to the shape of the data. d needs exactly two groups, Cramer's V needs an outcome that is a label rather than a number, and r needs two numeric columns and no groups at all. Sleep hours across four shift patterns is a numeric outcome with more than two groups.

=== step === concept
::eyebrow The habit
## How to write it down

Farah has to put one line in the minutes. Here is the shape that answers both questions at once, in the order a reader needs them.

1. **The raw difference, in the units of the thing.** The number your reader can picture.
2. **The standardised effect size, named.** Cohen's d, or Hedges' g for small groups, or eta-squared, or Cramer's V, or r. Say which one you used.
3. **An interval around it.** A bare effect size hides how much you know, exactly as a bare p-value hides how big the effect is.
4. **The p-value, last.** It answers whether luck is a good explanation, and it goes at the end because that is the smallest of the four questions.

Farah's recommendation, written that way:

> Time-restricted eating produced 5.42 kg more weight loss than usual care over the trial period, a Cohen's d of 1.45 with a 95 percent interval of 0.86 to 2.30, or a Hedges' g of 1.42 after the small-sample correction, p = 0.00002. The Lean Plate trial was also statistically significant, but its effect was 0.59 kg, d = 0.15, which puts a plan dieter ahead of a control 54 times in 100. On effect size, time-restricted eating is the clear recommendation. Against that, 21 of its 40 follow-up participants dropped out, and drop-out was related to arm at a moderate Cramer's V of 0.35, so the plan should be offered with a check-in in week two.

Read the two questions back out of it. Is it real? Yes, and the p-value at the end says so. Is it big? Yes, and the g with its interval says so. And then a third thing that neither number could have told her on its own, sitting right there in the drop-out table.

[KEY INSIGHT]
"Significant" and "big" are two separate answers to two separate questions. A report that gives you only one of them has given you half the result, and there is no way to work out the other half from what you were handed.

=== step === concept
::eyebrow Go deeper
## References

Five sources worth an hour if you want to push past where this part stops.

- [Cohen, Statistical Power Analysis for the Behavioral Sciences, 2nd edition, 1988](https://doi.org/10.4324/9780203771587) - where 0.2, 0.5 and 0.8 come from, including Cohen's own warning that he chose them for want of anything better.
- [Hedges, Distribution theory for Glass's estimator of effect size and related estimators, 1981](https://doi.org/10.3102/10769986006002107) - the paper behind the small-sample correction in step 13.
- [Lakens, Calculating and reporting effect sizes to facilitate cumulative science, 2013](https://doi.org/10.3389/fpsyg.2013.00863) - the practical companion to this lesson: formulas for t-tests, ANOVA and correlations, with worked examples and the reasoning behind each choice.
- [Sullivan and Feinn, Using effect size, or why the p value is not enough, 2012](https://doi.org/10.4300/JGME-D-12-00156.1) - four pages on the same argument as step 3, written for people who read medical papers.
- [Wasserstein and Lazar, The ASA statement on p-values, 2016](https://doi.org/10.1080/00031305.2016.1154108) - the American Statistical Association's six principles, one of which is that a p-value does not measure the size of an effect.

=== step === complete
## Part 6 complete

Farah started with two trials that carried the same stamp. Trial A moved people 0.59 kg with p = 0.019, and Trial B moved them 5.42 kg with p = 0.00002. The word "significant" sat on both and told her nothing about the difference between them.

The reason turned out to be structural. A p-value mixes the size of an effect with the number of people you asked, and you watched it happen: the same 0.59 kg gap with the same spread went from p = 0.60 at 25 people per arm to p = 0.0009 at 1,000, with the diet identical on every row.

So you built the number that answers the other question. The raw gap first, in kilograms, because it is the one a patient can picture. Then Cohen's d, the gap measured in pooled spreads, 0.148 for Trial A and 1.449 for Trial B, a ten-to-one ratio that two identical verdicts had hidden. Then a translation anybody understands: a Lean Plate dieter beats a control 54 times in 100, a time-restricted dieter 85 times in 100.

Then three ways of being careful with it. Cohen's small, medium and large are a borrowed rule of thumb its own author called arbitrary. Hedges' g pulls d back down when the groups are small, by 1.8 percent at 22 per arm and by nothing worth mentioning at 500. And the bootstrap put an interval around d itself, which is where the walking programme gave itself away: a "large" 0.864 whose honest range ran from 0.13 to 1.87, because twelve people per arm buys almost no precision.

Then the rest of the family. Eta-squared and omega-squared for three or more groups, 0.186 and 0.171 in the follow-up. Cramer's V for a table of counts, 0.349, which is how you found that the winning plan also lost half its participants. And r for two numeric columns, 0.513, with r-squared, 0.263, reading as a share the same way eta-squared does.

Part 7 is the last one, and it goes back to the verdict itself. A test can be wrong in two directions: it can call an effect real when nothing is there, and it can miss an effect that is. Those two mistakes trade off against each other, and part 7 puts you at the dial.

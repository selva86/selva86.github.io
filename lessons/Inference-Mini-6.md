---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6"
catalog_blurb: "How to say how big an effect is, not just whether it exists."
description: "Two diet trials, both significant: one lost half a kilo, the other five. Build Cohen's d from scratch in R and learn to say how big an effect really is."
keywords: "effect size, Cohen's d, Hedges g, eta squared, omega squared, Cramer's V, confidence interval for effect size, practical significance, standardized mean difference, statistics for beginners, R"
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

Part 5 ended on a number it introduced and then walked away from. Nadia's loaves came in two thirds of a spread below label weight, and that quantity has a name, the **effect size**. Today is about reading it, reporting it, and knowing when two thirds of a spread is a lot. If you missed the earlier parts, nothing here leans on them, because every piece gets built from the beginning.

Dr. Amara Osei has **1,900 patients** on her list and has to recommend one weight programme. Two published trials sit on her desk.

The **SlimTrack app trial** followed 1,566 people. The app group lost **half a kilo** more than the control group, p = 0.020. The **coach programme trial** followed 60 people. The coach group lost **five kilos** more, p = 0.000042.

Both are significant. Both got the same stamp.

Half a kilo and five kilos are not the same advice though. For a patient who needs to lose ten kilos, half a kilo is no use at all, and with more than fifteen hundred participants a difference that small clears the bar comfortably. So the stamp cannot be the thing Amara decides on.

She does have a number in her head for what would change her advice: a programme has to deliver about **4 kg** before she would recommend it over doing nothing, which is roughly five percent of body weight for her patients. Hold onto that 4, because the panel below asks for it.

Here is the app trial as four different papers wrote it up. Pick whichever one reads as the strongest evidence, then look at what all four turn out to have in common.

::widget report-four-ways {"studies": [{"label": "SlimTrack app trial", "outcome": "weight lost at six months", "unit": "kg", "n1": 786, "n2": 780, "m1": 0.6, "m2": 1.1, "sd": 4.25, "mcid": 4}], "alpha": 0.05}

The panel scores each write-up on three questions: how big is it, how precise is it, and does it matter. Only the last card answers all three, and its answer to the third is that the whole interval sits below the 4 kg Amara set. Two of the cards also carry a number we have not met yet, **d = 0.12**. Building that number from nothing, and then finding out where it misleads, is what today does.

By the end you will be able to:

- Say what a significant result does and does not tell you, and why size is a separate question
- Compute Cohen's d from raw data or from a published summary table, and say what one d means in human terms
- Put an interval on an effect size, and correct a small-sample d with Hedges' g
- Name the four ways a d gets inflated, and check whether any of them bit
- Pick and compute the right effect size for the design: two averages, several averages, two continuous measurements, two categorical ones
- Report an effect the way a careful person does, and decide with it rather than with a label

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `p < 0.05` are familiar. No statistics background is assumed, and every term is defined in plain words the moment it appears.

=== step === concept
::eyebrow The verdict
## Both trials passed the test

A statistical test answers one question: could this result plausibly have come from nothing at all? When the answer is no, the result is called **significant**, and the number that decides it is the **p-value**, which counts how often a world with no real difference would throw up evidence at least this strong. The smaller the p, the harder the result is to explain away as luck.

Both trials published summaries rather than raw data, which is what a paper normally gives you. That is enough. Group averages, group spreads and group sizes rebuild the whole test.

```r
# SlimTrack app trial: control lost 0.6 kg (sd 4.3), app group lost 1.1 kg (sd 4.2).
app_n1 <- 786
app_n2 <- 780
app_sp <- sqrt(((app_n1 - 1) * 4.3^2 + (app_n2 - 1) * 4.2^2) / (app_n1 + app_n2 - 2))
app_se <- app_sp * sqrt(1 / app_n1 + 1 / app_n2)
app_t  <- (1.1 - 0.6) / app_se
app_p  <- 2 * pt(-abs(app_t), df = app_n1 + app_n2 - 2)

# Coach programme trial: control lost 1.2 kg (sd 4.1), coach group lost 6.2 kg (sd 4.6).
coach_n1 <- 29
coach_n2 <- 31
coach_sp <- sqrt(((coach_n1 - 1) * 4.1^2 + (coach_n2 - 1) * 4.6^2) / (coach_n1 + coach_n2 - 2))
coach_se <- coach_sp * sqrt(1 / coach_n1 + 1 / coach_n2)
coach_t  <- (6.2 - 1.2) / coach_se
coach_p  <- 2 * pt(-abs(coach_t), df = coach_n1 + coach_n2 - 2)

round(c(app = app_t, coach = coach_t), 4)
#>    app  coach
#> 2.3275 4.4332

signif(c(app = app_p, coach = coach_p), 4)
#>       app     coach
#> 2.006e-02 4.191e-05
```

`app_sp` is the two groups' spreads combined into one number, and every line beneath it leans on that one value. Step 7 opens it up and gives it a name, because the rest of today is built on it. For now take it as the yardstick the test used.

So p = 0.020 and p = 0.000042. Both under 0.05, both significant, and Amara has learned exactly one thing about each programme: it does something. Not how much.

=== step === concept
::eyebrow Size, take one
## The first honest answer is in kilos

The plainest measure of how big an effect is, is the difference itself, in the units you already understand. Most treatments of effect size hurry past that, so let us not.

```r
diff_app   <- 1.1 - 0.6
diff_coach <- 6.2 - 1.2

ci_app   <- diff_app   + c(-1, 1) * qt(0.975, app_n1 + app_n2 - 2) * app_se
ci_coach <- diff_coach + c(-1, 1) * qt(0.975, coach_n1 + coach_n2 - 2) * coach_se

round(c(difference = diff_app, lower = ci_app[1], upper = ci_app[2]), 4)
#> difference      lower      upper
#>     0.5000     0.0786     0.9214

round(c(difference = diff_coach, lower = ci_coach[1], upper = ci_coach[2]), 4)
#> difference      lower      upper
#>     5.0000     2.7423     7.2577
```

Those lower and upper numbers are a **confidence interval**, which is the range of true differences that would not look surprising given this data. So the app trial's real effect sits somewhere around 0.08 to 0.92 kg, whereas the coach trial's sits somewhere around 2.74 to 7.26 kg. Intervals get proper treatment at step 15, where we put one around the effect size itself.

Read those two lines as a patient would. One programme is worth between a tenth of a kilo and a kilo. The other is worth between three kilos and seven. Amara can tell those apart without any further arithmetic, which means the honest answer here is kilos, and nothing that follows is an upgrade on kilos.

That is worth saying flatly, because the usual mistake is to treat a standardized effect size as the grown-up version of a raw difference. It is not. It is a translation you reach for when the raw units stop working, and the next step is about when exactly that happens.

=== step === concept
::eyebrow Size, take two
## Where kilos stop working

Kilos work here because everybody at the table knows what a kilo is. Raw units fail in three specific situations, and those three are the only reason standardized effect sizes exist at all.

| The situation | What goes wrong | An example from Amara's desk |
|---|---|---|
| The scale means nothing to you | 4 points is big or small depending entirely on the questionnaire | A trial that reports a **wellbeing score out of 60** rather than kilos |
| Two studies measured the same thing differently | You cannot subtract kilos from body-mass index points | A trial that reports **BMI change**, not weight change |
| You want to pool many studies at once | Every study contributes a number on its own scale | A review of 27 weight programmes, half in kilos, half in pounds, some in BMI |

In all three the fix is the same: stop asking how many kilos, and start asking how many kilos compared with how much people differ from each other anyway. That ratio has no units left in it, so a questionnaire and a bathroom scale can finally be put side by side.

Before we build it, one check on the half of the story you already have.

=== step === quiz
::eyebrow Check yourself
## What significant bought you

The app trial reported p = 0.020. Which of these does that let Amara say?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The app makes a large difference to weight ::no A p-value counts how surprising the data would be in a world where the app changes nothing at all. That is a claim about existence, not about size, and it says nothing about how many kilos are involved. With 1,566 participants half a kilo is enough to clear the bar, which is exactly why a second and separate number is needed.
- The data would be surprising if the app made no difference at all ::ok That is all a p-value ever claims. It says how badly "nothing is going on" survives contact with the data, and it stays completely silent on how big the something is.
- There is a 2 percent chance the app does nothing ::no A p-value counts how surprising the data would be in a world where the app changes nothing at all. That is a claim about existence, not about size, and it says nothing about how many kilos are involved. With 1,566 participants half a kilo is enough to clear the bar, which is exactly why a second and separate number is needed.
- The effect is 98 percent likely to matter to patients ::no A p-value counts how surprising the data would be in a world where the app changes nothing at all. That is a claim about existence, not about size, and it says nothing about how many kilos are involved. With 1,566 participants half a kilo is enough to clear the bar, which is exactly why a second and separate number is needed.

=== step === concept
::eyebrow Building it
## Measure the gap against how much people differ anyway

Think about what makes half a kilo unimpressive. The reported spreads say that in both trials people varied hugely among themselves, by around four kilos either side of their group's average, and that happened in the control groups too, where nothing was being done to anybody. Against that background noise, a half-kilo shift between two groups is barely audible.

So put the gap next to the noise and look at them together.

```r
round(c(gap = diff_app, spread = app_sp, gap_in_spreads = diff_app / app_sp), 4)
#>            gap         spread gap_in_spreads
#>         0.5000         4.2505         0.1176

round(c(gap = diff_coach, spread = coach_sp, gap_in_spreads = diff_coach / coach_sp), 4)
#>            gap         spread gap_in_spreads
#>         5.0000         4.3658         1.1453
```

The two spreads are almost identical, about four and a quarter kilos, which says people in these two trials wobbled by roughly the same amount. What differs is the gap. Divide one by the other and the app trial's gap is about a tenth of the ordinary person-to-person wobble, while the coach trial's is slightly more than the whole of it.

That last column is the effect size we are after. It has no units, because kilos cancel kilos. Two questions remain: which spread should go on the bottom, and what does a number like 1.15 actually mean for a patient.

=== step === concept
::eyebrow The denominator
## One spread from two groups

Each trial has two spreads, one per group, and the effect size wants a single yardstick. The obvious move is to average them. The right move is nearly that, and the difference matters when the groups are different sizes.

What you actually do is pool the **variance**, which is the spread squared, weighting each group by how many people it had, then take the square root at the end. The result is called the **pooled standard deviation**, written \( s_p \).

\[ s_p = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}} \]

Reading it left to right: \( s_1 \) and \( s_2 \) are the two groups' standard deviations, so \( s_1^2 \) and \( s_2^2 \) are their variances; \( n_1 \) and \( n_2 \) are the two group sizes; each variance is multiplied by its group size minus one, the two are added, and the total is divided by the combined size minus two. The weights are group sizes because a spread measured on 780 people is a better estimate than one measured on 29, and it deserves to count for more.

Watch it work on the coach trial, whose two spreads were 4.1 and 4.6.

```r
ss_control   <- (coach_n1 - 1) * 4.1^2
ss_programme <- (coach_n2 - 1) * 4.6^2
pooled_variance <- (ss_control + ss_programme) / (coach_n1 + coach_n2 - 2)

round(c(ss_control = ss_control, ss_programme = ss_programme), 2)
#>   ss_control ss_programme
#>       470.68       634.80

round(sqrt(pooled_variance), 4)
#> [1] 4.3658

mean(c(4.1, 4.6))
#> [1] 4.35
```

4.3658 against a plain average of 4.35. Close here, because the two groups are nearly the same size and their spreads are similar, and not close at all when one group is four times the other.

And that 4.3658 is the debt from step 2 coming due. It is exactly `coach_sp`, the number the t-test used back there without ever naming it. The test needed it to reach a verdict, and we need it to get a size.

=== step === concept
::eyebrow The definition
## Cohen's d, written down

Now the whole thing in one line. **Cohen's d** is the gap between the two group averages, measured in pooled standard deviations.

\[ d = \frac{\bar{x}_2 - \bar{x}_1}{s_p} \]

\( \bar{x}_1 \) is the control group's average, \( \bar{x}_2 \) is the programme group's average, and \( s_p \) is the pooled standard deviation from the last step. Read out loud: how many ordinary person-to-person spreads separate the two group averages.

Here it is as a function, because we will use it on five different trials before the day is out.

```r
cohens_d_from_summary <- function(m1, m2, s1, s2, n1, n2) {
  spread <- sqrt(((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / (n1 + n2 - 2))
  (m2 - m1) / spread
}

# control mean, programme mean, control sd, programme sd, control n, programme n
round(cohens_d_from_summary(1.2, 6.2, 4.1, 4.6, 29, 31), 4)
#> [1] 1.1453
```

Six numbers in, one number out, and every one of the six sits in the results table of a published paper. That is worth noticing on its own: you never need a paper's raw data to compute its effect size.

There is a shortcut for the days when a paper prints only its t statistic and its group sizes. Multiply t by \( \sqrt{1/n_1 + 1/n_2} \) and you get d exactly. For the coach trial that is 4.4332 times 0.2583, which is 1.1453 again.

=== step === concept
::eyebrow The reveal
## The two trials, finally separated

Both trials came back significant. Run both through the same function and see what the p-values were hiding.

```r
d_app   <- cohens_d_from_summary(0.6, 1.1, 4.3, 4.2, 786, 780)
d_coach <- cohens_d_from_summary(1.2, 6.2, 4.1, 4.6, 29, 31)

round(c(app = d_app, coach = d_coach), 4)
#>    app  coach
#> 0.1176 1.1453

signif(c(app = app_p, coach = coach_p), 4)
#>       app     coach
#> 2.006e-02 4.191e-05
```

Look at the two rows together. On the verdict, both trials say yes. On the size, one is 0.12 and the other is 1.15, so the coach programme's effect is nearly ten times the app's, measured on the one scale that lets them be compared.

And notice which trial has the smaller p-value. The coach trial, on 60 people. The app trial needed 1,566 people to detect its effect, and the size of that effect is precisely why. A p-value falls as the effect grows, and it also falls as the sample grows, so it cannot tell you which of the two is happening. The effect size can.

=== step === quiz
::eyebrow Check yourself
## Change the units, change the d?

An American journal republishes the coach trial with every weight converted to pounds. What happens to d?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It is multiplied by 2.2, the same as the weights ::no Both the top and the bottom of the fraction are measured in the same units, so converting the data multiplies the gap by 2.2 and the pooled spread by 2.2 as well. The two cancel and d comes out identical, which is the entire reason for dividing by a spread in the first place.
- It gets smaller, because the numbers all get bigger ::no Both the top and the bottom of the fraction are measured in the same units, so converting the data multiplies the gap by 2.2 and the pooled spread by 2.2 as well. The two cancel and d comes out identical, which is the entire reason for dividing by a spread in the first place.
- Nothing, because the gap and the spread scale by the same factor ::ok Kilos cancel kilos. That is what makes d comparable across a bathroom scale, a questionnaire and a blood test, and it is the property the raw difference does not have.
- It changes only if the sample size changes too ::no Both the top and the bottom of the fraction are measured in the same units, so converting the data multiplies the gap by 2.2 and the pooled spread by 2.2 as well. The two cancel and d comes out identical, which is the entire reason for dividing by a spread in the first place.

=== step === concept
::eyebrow Seeing it
## What one d looks like

One line to settle the pounds question for good, because a claim like that is easy to check.

```r
lb <- 2.20462
d_coach_lb <- cohens_d_from_summary(1.2 * lb, 6.2 * lb, 4.1 * lb, 4.6 * lb, 29, 31)

round(c(kilograms = d_coach, pounds = d_coach_lb), 6)
#> kilograms    pounds
#>  1.145272  1.145272
```

Identical to six decimal places. Now for what those numbers look like.

A d is a distance between two piles of people. Weight change tends to pile up around a group's average and thin out on either side, which draws the bell-shaped curve `dnorm()` produces below. Draw the control group as one of those curves and the programme group as the same curve shifted along by d, and the shaded region is where the two groups are indistinguishable.

```r
draw_two_groups <- function(d, label) {
  x <- seq(-4, 5.5, length.out = 400)
  control   <- dnorm(x)
  programme <- dnorm(x, mean = d)
  plot(x, control, type = "n", xlab = "weight lost, in spreads",
       ylab = "", yaxt = "n", main = paste0(label, ", d = ", round(d, 2)))
  polygon(c(x, rev(x)), c(pmin(control, programme), rep(0, length(x))),
          col = "#dfe5ee", border = NA)
  lines(x, control, lwd = 2, col = "#2563a8")
  lines(x, programme, lwd = 2, col = "#b5631a")
  abline(v = c(0, d), lty = 2, col = c("#2563a8", "#b5631a"))
}

par(mfrow = c(1, 2))
draw_two_groups(d_app, "App trial")
draw_two_groups(d_coach, "Coach trial")
```

Press Run and compare the two panels. On the left the two curves sit almost exactly on top of each other, and the dashed lines marking the two group averages are so close they nearly touch. On the right the piles have visibly pulled apart, though even there they still overlap a great deal, which is a useful corrective: a d of 1.15 is a big effect by any standard, and plenty of coach patients still did worse than plenty of control patients.

=== step === concept
::eyebrow Saying it
## Three ways to say a d out loud

"One point one five pooled standard deviations" is not a sentence you can say to a patient. Three translations fix that, and each is a single line of arithmetic on d rather than a rule of thumb. All three read their answer off the two bell curves you just drew, so they hold as long as both groups are shaped roughly like that and spread by roughly the same amount.

```r
say_it_out_loud <- function(d) {
  c(overlap             = 2 * pnorm(-abs(d) / 2),
    beats_a_control     = pnorm(d / sqrt(2)),
    above_control_mean  = pnorm(d))
}

round(say_it_out_loud(d_app), 4)
#>            overlap    beats_a_control above_control_mean
#>             0.9531             0.5331             0.5468

round(say_it_out_loud(d_coach), 4)
#>            overlap    beats_a_control above_control_mean
#>             0.5669             0.7910             0.8740
```

Take them one at a time, for the coach trial.

- **Overlap, 0.5669.** The two groups have about 57 percent of their area in common. Shade the picture from the last step and that is the grey area.
- **Beats a control patient, 0.7910.** Pick one coach patient and one control patient at random, and the coach patient has lost more about 79 times in 100. This one is called the probability of superiority, and it is the translation patients understand fastest.
- **Above the control average, 0.8740.** Eighty-seven percent of coach patients did better than the typical control patient.

Now the app trial. Its probability of superiority is 0.5331, so if you pick one patient from each group, the app user has lost more about 53 times in 100. A coin flip is 50. That is what half a kilo buys, and Amara can now say it in a sentence a patient will follow.

=== step === tryit
::eyebrow Your turn
## A third trial from its published table

A third paper lands on the desk. The **MealBox trial**: 64 control patients lost 0.9 kg with a standard deviation of 4.0, and 66 MealBox patients lost 3.4 kg with a standard deviation of 4.5.

Fill in the two averages and press Check, then run it to see the effect size.

```r
cohens_d_from_summary(____, ____, 4.0, 4.5, 64, 66)
```
::check {"regex":"0\\.9\\s*,\\s*3\\.4","gate":true,"difficulty":"intermediate","ok":"d = 0.5867, which sits between the app trial's 0.12 and the coach trial's 1.15, and closer to the coach end. In plain terms, pick one MealBox patient and one control patient at random and the MealBox patient has lost more about 66 times in 100. The trial is also significant, t = 3.3442 with p = 0.0011, but you knew that would not tell you any of this.","no":"The function takes the control average first and the programme average second, so it wants 0.9 and then 3.4. The two standard deviations and the two group sizes are already filled in for you."}
::solution
```r
d_mealbox <- cohens_d_from_summary(0.9, 3.4, 4.0, 4.5, 64, 66)
round(d_mealbox, 4)
#> [1] 0.5867
```

=== step === quiz
::eyebrow Check yourself
## Reading a d

The MealBox trial's d is 0.59. Which reading of that number is right?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- 59 percent of MealBox patients lost weight ::no d is a ratio of two things measured in kilos: the gap between the group averages on top, and the ordinary person-to-person spread on the bottom. It is not a percentage of anything, and it carries no information at all about how likely the result is to be real. That second question is the p-value's job, and it is a separate question.
- The programme works 59 percent of the time ::no d is a ratio of two things measured in kilos: the gap between the group averages on top, and the ordinary person-to-person spread on the bottom. It is not a percentage of anything, and it carries no information at all about how likely the result is to be real. That second question is the p-value's job, and it is a separate question.
- The result is 59 percent likely to be real ::no d is a ratio of two things measured in kilos: the gap between the group averages on top, and the ordinary person-to-person spread on the bottom. It is not a percentage of anything, and it carries no information at all about how likely the result is to be real. That second question is the p-value's job, and it is a separate question.
- The average MealBox patient lost about six tenths of a typical person-to-person spread more than the average control patient ::ok That is the definition read out loud. Every other reading smuggles in a percentage or a probability that d simply does not contain.

=== step === concept
::eyebrow The catch
## Your d is an estimate too

Three papers, three effect sizes, and Amara is one step away from a mistake most readers make: treating a published d as a fact. It is not a fact. It is an estimate computed from a sample, exactly like the group averages that went into it, and estimates come with uncertainty.

The uncertainty has a formula. The **standard error** of d, meaning the typical amount a d bounces around from sample to sample, is

\[ SE(d) \approx \sqrt{\frac{n_1+n_2}{n_1 n_2} + \frac{d^2}{2(n_1+n_2)}} \]

Two terms, two sources of doubt. The first, \( (n_1+n_2)/(n_1 n_2) \), is there because you do not know the two true averages, only the sample ones. The second, \( d^2/(2(n_1+n_2)) \), is there because you do not know the true spread either, and it grows with d because a bigger effect leans harder on that spread. Both shrink as the groups grow, and nothing else shrinks them.

```r
se_of_d <- function(d, n1, n2) sqrt((n1 + n2) / (n1 * n2) + d^2 / (2 * (n1 + n2)))

se_app   <- se_of_d(d_app, 786, 780)
se_coach <- se_of_d(d_coach, 29, 31)

round(c(d = d_app, se = se_app, lower = d_app - 1.96 * se_app, upper = d_app + 1.96 * se_app), 4)
#>      d     se  lower  upper
#> 0.1176 0.0506 0.0185 0.2168

round(c(d = d_coach, se = se_coach, lower = d_coach - 1.96 * se_coach, upper = d_coach + 1.96 * se_coach), 4)
#>      d     se  lower  upper
#> 1.1453 0.2787 0.5990 1.6915
```

Read the coach trial's row again. Its effect size is somewhere between 0.60 and 1.69. That range covers everything from a moderate effect to an enormous one, which is what sixty people buys you, and it is a far less confident statement than the bare "d = 1.15" in the abstract.

The app trial's interval is narrow, 0.02 to 0.22, because 1,566 people pin a number down. So one trial is small and precise and the other is large and vague, and neither abstract said so.

=== step === concept
::eyebrow Where the interval comes from
## The same interval, by resampling

That formula appeared out of nowhere, which is unsatisfying. So here is the same uncertainty built by hand, with no formula at all, on data Amara can see.

A year ago she ran her own small comparison in the clinic. Thirty-six patients, twelve on usual care, twelve given the app, twelve funded onto the coach programme, with weight lost at six months recorded for each.

Here is how the resampling works. Take those twelve coach patients and draw twelve of them **with replacement**, meaning after each pick you throw the name back in, so some patients get picked twice and others get left out entirely. That gives you a clinic that could plausibly have walked through the door instead. Do it ten thousand times, compute d each time, and the spread of the answers is the uncertainty.

Press Draw again a few times to watch one resample happen.

::widget bootstrap-sample {"n": 12, "seed": 7, "tail": "Those patients are missing from this resample, and the next draw will miss different ones."}

That is one draw. Here are Amara's actual numbers, and then ten thousand draws.

```r
kg_lost <- c(0.5, 0.2, 4.6, 0.8, -1.1, 1.7, 0.1, 0.4, -3.6, -5.2, -2.5, 1.9,
             3.7, 1.7, -3.0, 7.2, 0.1, -1.3, 1.8, 3.8, -1.0, 0.9, 4.9, 1.3,
             5.8, 3.6, 6.7, 3.3, 3.6, 2.6, 5.3, 3.7, 10.8, 6.8, 8.4, 5.7)
minutes <- c(35, 107, 119, 100, 54, 92, 53, 87, 44, 86, 44, 64,
             112, 81, 106, 118, 150, 142, 94, 125, 49, 84, 94, 81,
             167, 111, 195, 172, 125, 86, 86, 128, 151, 167, 156, 127)
arm <- factor(rep(c("usual", "app", "coach"), each = 12),
              levels = c("usual", "app", "coach"))

usual <- kg_lost[arm == "usual"]
app   <- kg_lost[arm == "app"]
coach <- kg_lost[arm == "coach"]

# The same d as before, this time from raw numbers rather than a summary table.
cohens_d <- function(treated, control) {
  n1 <- length(control)
  n2 <- length(treated)
  spread <- sqrt(((n1 - 1) * var(control) + (n2 - 1) * var(treated)) / (n1 + n2 - 2))
  (mean(treated) - mean(control)) / spread
}

round(tapply(kg_lost, arm, mean), 4)
#>   usual     app   coach
#> -0.1833  1.6750  5.5250

round(cohens_d(coach, usual), 4)
#> [1] 2.2684
```

Usual care lost nothing at all on average, the app arm lost about 1.7 kg, and the coach arm lost 5.5 kg. Coach against usual comes out at d = 2.27, which is bigger than the published trial's 1.15. Leave that gap alone for now. Step 27 explains it, and the explanation is worth more than the number.

```r
set.seed(5)
boot_d <- replicate(10000, {
  coach_again <- sample(coach, replace = TRUE)
  usual_again <- sample(usual, replace = TRUE)
  cohens_d(coach_again, usual_again)
})

round(quantile(boot_d, c(0.025, 0.975)), 4)
#>   2.5%  97.5%
#> 1.6338 3.4074

d_clinic  <- cohens_d(coach, usual)
se_clinic <- se_of_d(d_clinic, 12, 12)
round(c(lower = d_clinic - 1.96 * se_clinic, upper = d_clinic + 1.96 * se_clinic), 4)
#>  lower  upper
#> 1.2427 3.2941
```

`quantile(boot_d, c(0.025, 0.975))` throws away the lowest 2.5 percent and the highest 2.5 percent of the ten thousand answers and reports what is left, which is a 95 percent interval built by brute force. It lands on 1.63 to 3.41, and the formula from the last step lands on 1.24 to 3.29. Two completely different routes arrive at the same message: twelve patients per arm cannot pin an effect size down.

```r
hist(boot_d, breaks = 40, col = "#dbe7f3", border = "white",
     main = "", xlab = "d from each resampled clinic")
abline(v = quantile(boot_d, c(0.025, 0.975)), lwd = 2, lty = 2, col = "#b5631a")
abline(v = d_clinic, lwd = 2, col = "#2563a8")
```

=== step === tryit
::eyebrow Your turn
## Bootstrap the app arm

Amara's app arm looked promising: 1.7 kg lost against nothing at all in usual care. Do to it what we just did to the coach arm.

Fill in the arm being resampled and press Check, then run it.

```r
set.seed(9)
boot_app <- replicate(10000, {
  app_again   <- sample(____, replace = TRUE)
  usual_again <- sample(usual, replace = TRUE)
  cohens_d(app_again, usual_again)
})

round(cohens_d(app, usual), 4)
round(quantile(boot_app, c(0.025, 0.975)), 4)
```
::check {"regex":"sample\\s*[(]\\s*app\\s*,","gate":true,"difficulty":"intermediate","ok":"d = 0.6756, and the interval runs from -0.0931 to 1.5482. Stop on that lower end for a second. It is below zero, which means twelve patients per arm cannot rule out the possibility that the app did nothing whatsoever, even though the d in front of you looks respectable. A number that the usual labels would call medium is sitting on an interval that includes nothing at all.","no":"The vector holding the twelve app patients is called `app`, so `sample(app, replace = TRUE)` is the line you want. `usual` is already filled in on the row below."}
::solution
```r
set.seed(9)
boot_app <- replicate(10000, {
  app_again   <- sample(app, replace = TRUE)
  usual_again <- sample(usual, replace = TRUE)
  cohens_d(app_again, usual_again)
})

round(cohens_d(app, usual), 4)
#> [1] 0.6756

round(quantile(boot_app, c(0.025, 0.975)), 4)
#>    2.5%   97.5%
#> -0.0931  1.5482
```

=== step === concept
::eyebrow Inflator one
## Small samples push d up

An interval that includes zero is bad enough. There is something worse hiding in a small sample, and it is not random: d does not just bounce around when the groups are small, it bounces around a point that is too high.

The way to see that is to build a world where you know the truth. Set the real effect to exactly 0.5, run ten thousand studies of ten patients per group, and look at what the average study reports.

```r
set.seed(101)
small_studies <- replicate(10000, {
  control   <- rnorm(10, mean = 0, sd = 1)
  programme <- rnorm(10, mean = 0.5, sd = 1)
  cohens_d(programme, control)
})

round(mean(small_studies), 4)
#> [1] 0.523

set.seed(101)
bigger_studies <- replicate(10000, {
  control   <- rnorm(50, mean = 0, sd = 1)
  programme <- rnorm(50, mean = 0.5, sd = 1)
  cohens_d(programme, control)
})

round(mean(bigger_studies), 4)
#> [1] 0.4996
```

`rnorm(10, mean = 0.5, sd = 1)` draws ten patients from a world where the programme really does move the average by half a spread, so every one of these ten thousand studies is honest, correctly run, and free of any funny business.

At ten per group the average study reports 0.523 rather than 0.500, which is about five percent too high. At fifty per group it reports 0.4996, and the bias has vanished into the noise. The reason is in the denominator: with ten people you are estimating the spread from ten people, that estimate runs a shade low on average, and dividing by something too small makes d too big.

```r
hist(small_studies, breaks = 40, col = "#dbe7f3", border = "white",
     main = "", xlab = "d reported by each 10-per-group study")
abline(v = 0.5, lwd = 2, col = "#2563a8")
abline(v = mean(small_studies), lwd = 2, lty = 2, col = "#b5631a")
```

The solid line is the truth and the dashed line is where the studies average out. They sit close together, and the dashed one is the one further to the right.

=== step === concept
::eyebrow The fix
## Hedges' g, the correction

Because the bias is systematic, it can be removed. Multiply d by a correction factor slightly below one, and what comes out is called **Hedges' g**.

\[ J = 1 - \frac{3}{4(n_1+n_2-2)-1}, \qquad g = J \times d \]

\( J \) depends on nothing but the two group sizes. When the groups are large, \( 4(n_1+n_2-2)-1 \) is enormous, so J is a whisker under one and g is d. When the groups are tiny, J bites.

```r
hedges_J <- function(n1, n2) 1 - 3 / (4 * (n1 + n2 - 2) - 1)

round(c(J = hedges_J(786, 780), g = hedges_J(786, 780) * d_app), 5)
#>       J       g
#> 0.99952 0.11758

round(c(J = hedges_J(29, 31), g = hedges_J(29, 31) * d_coach), 5)
#>       J       g
#> 0.98701 1.13040

round(mean(small_studies * hedges_J(10, 10)), 4)
#> [1] 0.5009
```

The app trial barely moves, from 0.11763 to 0.11758, because 1,566 people leave nothing to correct. The coach trial drops from 1.1453 to 1.1304 on 60 people. And the ten thousand tiny studies, which averaged 0.523 uncorrected, average 0.5009 once every one of them is multiplied by J. The correction works.

So report g rather than d whenever a group has fewer than about twenty people, and expect the two to be identical when the groups are large. It costs one line and it is never wrong to apply.

=== step === concept
::eyebrow Inflator two
## A small trial that got published is a biased trial

Hedges' g fixes a bias in the arithmetic. The next one is a bias in which studies you get to read, and no correction factor touches it.

Go back to the ten-per-group world where the true effect is 0.5. Most of those studies are too small to reach significance. The ones that do reach it are, by definition, the ones that got a lucky draw, and a lucky draw means a large d. Those are also the ones that get published.

```r
set.seed(202)
tiny_trials <- replicate(10000, {
  control   <- rnorm(10, mean = 0, sd = 1)
  programme <- rnorm(10, mean = 0.5, sd = 1)
  c(d = cohens_d(programme, control),
    p = t.test(programme, control, var.equal = TRUE)$p.value)
})

d_values  <- tiny_trials["d", ]
p_values  <- tiny_trials["p", ]
published <- d_values[p_values < 0.05]

round(100 * mean(p_values < 0.05), 2)
#> [1] 18.79

round(c(all_studies = mean(d_values), only_significant = mean(published)), 4)
#>      all_studies only_significant
#>           0.5257           1.2287
```

Only 19 percent of these honest little studies came back significant. Across all ten thousand the average d is 0.53, near the truth. Across the significant ones alone it is **1.23**, nearly two and a half times the real effect. Nobody cheated. The filter did all of it.

```r
edges <- seq(min(d_values), max(d_values), length.out = 45)
hist(d_values, breaks = edges, col = "#e2e8f0", border = "white",
     main = "", xlab = "d reported by each 10-per-group study")
hist(published, breaks = edges, col = "#e6a17a", border = "white", add = TRUE)
abline(v = 0.5, lwd = 2, col = "#2563a8")
abline(v = mean(published), lwd = 2, lty = 2, col = "#b5631a")
```

The shaded subset is what a journal would print, and it sits almost entirely to the right of the truth.

Now, does that bite the coach trial? Run the same simulation at the coach trial's actual design, 30 per group with a true effect of 1.1453.

```r
set.seed(303)
coach_sized <- replicate(10000, {
  control   <- rnorm(30, mean = 0, sd = 1)
  programme <- rnorm(30, mean = 1.1453, sd = 1)
  c(d = cohens_d(programme, control),
    p = t.test(programme, control, var.equal = TRUE)$p.value)
})

d_big <- coach_sized["d", ]
p_big <- coach_sized["p", ]

round(100 * mean(p_big < 0.05), 2)
#> [1] 99.17

round(c(all_studies = mean(d_big), only_significant = mean(d_big[p_big < 0.05])), 4)
#>      all_studies only_significant
#>           1.1636           1.1697
```

Ninety-nine percent of those studies reach significance, so the filter has almost nothing to filter, and the published average is 1.1697 against 1.1636 overall. There is no inflation worth the name.

That is the honest version of a warning usually handed out as a blanket rule. A small significant study is suspect; a study large enough that it was always going to reach significance is not. Which raises the obvious question: how large is large enough?

=== step === concept
::eyebrow The lever
## What a d costs to detect

Part 4 built this machinery, so we will not rebuild it. **Power** is the chance a study detects a real effect, and it rises with sample size and falls as the effect you are chasing gets smaller. The widget shows the shape.

::widget power-curve {}

Slide between the three effect sizes and watch the curve slide left. A large effect reaches 80 percent power on a handful of people. A small one needs a crowd.

Now the two trials on Amara's desk, at their own effect sizes.

```r
round(c(app = power.t.test(delta = d_app, sd = 1, power = 0.80)$n,
        coach = power.t.test(delta = d_coach, sd = 1, power = 0.80)$n), 1)
#>    app  coach
#> 1135.4   13.0

round(c(app_trial   = power.t.test(n = 780, delta = d_app, sd = 1)$power,
        coach_trial = power.t.test(n = 30, delta = d_coach, sd = 1)$power), 4)
#>   app_trial coach_trial
#>      0.6412      0.9918
```

To have an 80 percent chance of catching an effect the size of the app's, you need about 1,135 people in each group. To catch one the size of the coach programme's, you need 13.

Then look at what the two trials actually had. The app trial's 780 per arm was not enough for its own effect, so it ran at 64 percent power, meaning a trial that size misses an effect like this about a third of the time. The coach trial's 30 per arm ran at 99 percent. The enormous study was underpowered and the tiny one was not, purely because of the size of what each was chasing.

That is also why the last step's warning does not touch the coach trial. At 99 percent power there is no filter left to bias anything.

=== step === quiz
::eyebrow Check yourself
## Which published d would you distrust

A colleague forwards Amara four more weight-programme papers. She knows only each one's d, its group sizes and its p-value. Which has the strongest reason to be inflated?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- d = 1.4 from nine people per group, p = 0.04 ::ok That one has tiny groups and a p-value that only just scraped in, which is exactly what the simulation produced: at nine per group a study needs a lucky draw to reach significance at all, and a lucky draw is a large d. Hedges' g would shave a little off it, and the selection effect would still be there afterwards.
- d = 1.4 from 400 people per group ::no The two things that inflate a published d are tiny groups, which bias the arithmetic upward, and a study that could only have been published if it got lucky. Large groups remove both problems at once, and an interval that stays well away from zero shows the estimate was pinned down rather than scraped in.
- d = 0.2 from 2,000 people per group ::no The two things that inflate a published d are tiny groups, which bias the arithmetic upward, and a study that could only have been published if it got lucky. Large groups remove both problems at once, and an interval that stays well away from zero shows the estimate was pinned down rather than scraped in.
- d = 1.4 reported with a 95 percent interval of 1.1 to 1.7 ::no The two things that inflate a published d are tiny groups, which bias the arithmetic upward, and a study that could only have been published if it got lucky. Large groups remove both problems at once, and an interval that stays well away from zero shows the estimate was pinned down rather than scraped in.

=== step === concept
::eyebrow Inflator three, part one
## Divided by which spread?

Here is the part that catches experienced readers. "Cohen's d" is not one calculation. It names a family, and which member you get depends on what went in the denominator, which papers frequently do not say.

| Version | Divides by | Use it when |
|---|---|---|
| Pooled d | both groups' spreads combined | the standard two-group comparison |
| Glass's delta | the control group's spread only | the programme changes the spread as well as the average |
| Change-score d | the spread of the individual changes | almost never, for reasons the next step gives |

Here are all three, on Amara's clinic. For the third one we need her before-and-after weights, so here are the coach arm's twelve patients weighed at the start and again at six months.

```r
before <- c(79.5, 88.2, 95.4, 77.0, 94.5, 92.4, 93.1, 106.5, 76.2, 108.5, 82.3, 77.3)
after  <- c(73.7, 84.6, 88.7, 73.7, 90.9, 89.8, 87.8, 102.8, 65.4, 101.7, 73.9, 71.6)

round(c(pooled_d       = cohens_d(coach, usual),
        glass_delta    = (mean(coach) - mean(usual)) / sd(usual),
        change_score_d = mean(before - after) / sd(before - after)), 4)
#>       pooled_d    glass_delta change_score_d
#>         2.2684         2.1743         2.2995
```

Three numbers, all called Cohen's d somewhere in the literature. The first two are close, because the coach arm and the usual-care arm happen to have similar spreads. The third is a different animal wearing the same name: it compares the coach patients with their own earlier selves, not with anybody else, so it is not answering the question the other two answer.

It also happens to be the one that goes badly wrong, which is the next step.

=== step === concept
::eyebrow Inflator three, part two
## The before-and-after trap

Watch what happens when the change-score version is used to describe a programme's effect.

```r
change <- before - after
round(change, 1)
#>  [1]  5.8  3.6  6.7  3.3  3.6  2.6  5.3  3.7 10.8  6.8  8.4  5.7

round(c(mean_change = mean(change), spread_of_changes = sd(change)), 4)
#>       mean_change spread_of_changes
#>            5.5250            2.4027
```

Those twelve numbers are the coach arm's `kg_lost` values, which is the point: the two records describe the same twelve people. On average they lost 5.5 kg, and the losses themselves varied by about 2.4 kg from patient to patient.

Now the two ways to standardize that 5.5.

```r
spread_between_people <- sqrt((var(before) + var(after)) / 2)

round(c(sd_before = sd(before), sd_after = sd(after), pooled = spread_between_people), 4)
#> sd_before  sd_after    pooled
#>   11.1432   12.0522   11.6066

round(c(change_score_d   = mean(change) / sd(change),
        between_person_d = mean(change) / spread_between_people), 4)
#>   change_score_d between_person_d
#>           2.2995           0.4760
```

**2.30 and 0.48**, from one set of twenty-four weights. The change-score version divides 5.525 by 2.4027, the spread of the losses. The between-person version divides the same 5.525 by 11.6066, the spread of the patients themselves, who ran from 76 kg to 108 kg before the programme started.

The second denominator is the honest one for describing a programme's effect, because it is the same kind of spread a two-group trial divides by, so the answer is comparable to one. The first denominator measures something else entirely: how consistently the programme worked. A programme that took exactly 5.5 kg off every single patient would have a change spread near zero and a change-score d near infinity, which tells you it is reliable, not that it is powerful.

So when you standardize a before-and-after result, divide by the spread between people. And when you read one, check which was used, because 2.30 and 0.48 are the same result.

=== step === quiz
::eyebrow Check yourself
## Which d did that paper report

Another paper in Amara's pile followed 20 people before and after, and reports "Cohen's d = 2.3" for an average loss of 5 kg. The starting weights in that group ran from 70 kg to 115 kg. What is the most likely explanation?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- The programme really is that effective ::no Do the rough arithmetic on the starting weights. A group running from 70 to 115 kg has a between-person spread somewhere around 11 or 12 kg, so a 5 kg average loss standardized that way lands near 0.4, nowhere near 2.3. The only denominator small enough to produce 2.3 is the spread of the individual changes, which is a measure of how consistent the programme was rather than how big its effect is.
- The sample was too small for d to be meaningful ::no Do the rough arithmetic on the starting weights. A group running from 70 to 115 kg has a between-person spread somewhere around 11 or 12 kg, so a 5 kg average loss standardized that way lands near 0.4, nowhere near 2.3. The only denominator small enough to produce 2.3 is the spread of the individual changes, which is a measure of how consistent the programme was rather than how big its effect is.
- They divided by the spread of the individual changes, not the spread between people ::ok Exactly the trap. You have just seen the identical pair of numbers on Amara's own coach arm: 2.2995 one way and 0.4760 the other, from one set of weights. A d above 2 from a before-and-after study should make you check the denominator every time.
- They used Hedges' g by mistake ::no Do the rough arithmetic on the starting weights. A group running from 70 to 115 kg has a between-person spread somewhere around 11 or 12 kg, so a 5 kg average loss standardized that way lands near 0.4, nowhere near 2.3. The only denominator small enough to produce 2.3 is the spread of the individual changes, which is a measure of how consistent the programme was rather than how big its effect is.

=== step === concept
::eyebrow Inflator four
## Who you sampled changes your d

The last one needs nobody to make a mistake at all. Take one programme that reliably takes 5 kg off people, and run it in three different clinics.

```r
gap <- 5
spreads <- c(narrow = 2.5, trial_like = 4.4, wide = 9.0)

round(gap / spreads, 4)
#>     narrow trial_like       wide
#>     2.0000     1.1364     0.5556

round(2 * pnorm(-(gap / spreads) / 2), 4)
#>     narrow trial_like       wide
#>     0.3173     0.5699     0.7812
```

Same 5 kg, three effect sizes: 2.00, 1.14 and 0.56. The first clinic recruited a narrow group of similar patients, the third took everybody who walked in, and the programme did the identical thing in all three.

```r
draw_clinic <- function(spread, label) {
  x <- seq(-25, 30, length.out = 400)
  plot(x, dnorm(x, mean = 0, sd = spread), type = "l", lwd = 2, col = "#2563a8",
       xlab = "kilos lost", ylab = "", yaxt = "n",
       main = paste0(label, ", d = ", round(5 / spread, 2)))
  lines(x, dnorm(x, mean = 5, sd = spread), lwd = 2, col = "#b5631a")
}

par(mfrow = c(1, 3))
draw_clinic(2.5, "narrow")
draw_clinic(4.4, "trial-like")
draw_clinic(9.0, "wide")
```

The gap between the two curves is exactly 5 kilos in every panel. What changes is how wide the curves are, and d only measures the gap relative to the width. So d is not a property of the treatment. It is a property of the treatment **and** the people you gave it to, and two studies of the same programme in different populations are not directly comparable however identical their methods.

=== step === concept
::eyebrow The running example
## Why Amara's own d is bigger than the trial's

Which brings us back to the oddity from step 16. Amara's clinic produced d = 2.27 for coach against usual care, and the published trial produced 1.15. That is twice the effect size. Did her patients do twice as well?

```r
round(c(gap_kg = mean(coach) - mean(usual),
        spread = sqrt((11 * var(coach) + 11 * var(usual)) / 22),
        d      = cohens_d(coach, usual)), 4)
#> gap_kg spread      d
#> 5.7083 2.5165 2.2684

round(c(gap_kg = 5.0, spread = coach_sp, d = d_coach), 4)
#> gap_kg spread      d
#> 5.0000 4.3658 1.1453
```

Look at the kilos first. 5.71 against 5.00, which is almost the same programme doing almost the same thing. Now the spreads: 2.52 in her clinic against 4.37 in the trial. Her patients varied among themselves a little over half as much as the trial's volunteers did, so dividing by that smaller spread roughly doubles the effect size.

Her clinic is a single practice, in one town, with patients who are more like each other than a national trial's recruits are. That is the last step happening for real, in her own data, with nobody doing anything wrong.

What it means practically: she cannot write "our clinic achieved d = 2.27, double the published effect", because those two numbers are measured against different yardsticks. Her kilos are comparable. Her d is not.

=== step === tryit
::eyebrow Your turn
## Glass's delta on the clinic data

One more denominator, and this time you pick it. **Glass's delta** divides the gap by the control group's spread alone rather than the pooled one, which is what you want when the programme changes how much people vary as well as how much they lose.

Fill in the spread it should divide by and press Check.

```r
(mean(coach) - mean(usual)) / ____
```
::check {"regex":"sd\\s*[(]\\s*usual\\s*[)]","gate":true,"difficulty":"intermediate","ok":"2.1743, against the pooled version's 2.2684. Close, because in this clinic the two arms happen to vary by similar amounts, 2.40 and 2.63. When a programme really does change the spread, the two versions come apart, and Glass's delta is the one to trust because an untouched control group gives you a yardstick the treatment cannot have bent.","no":"Glass's delta uses the control group only, and here the control group is `usual`, so the denominator is `sd(usual)`."}
::solution
```r
round((mean(coach) - mean(usual)) / sd(usual), 4)
#> [1] 2.1743
```

=== step === concept
::eyebrow The rule
## When kilos beat d

You have now met every way a d can mislead you. It is an estimate, and its interval is usually wider than the abstract makes it sound. It runs high in small samples, it runs high again when a study only got published because it was significant, and it runs high a third time when the people studied resembled each other closely. On top of all that it moves outright depending on which spread you divided by. Put those together and a practical rule comes out of them.

- **Lead with the raw difference and its interval** whenever the units mean something to your reader. Kilos, minutes, points on a scale everyone knows. This is the number a decision gets made on.
- **Add the standardized version** so your result can be compared with studies on other scales, or pooled into a review.
- **Always say which spread you divided by**, and whether it was a between-person spread. Without that, your d is not reproducible.
- **Say who was in your sample**, because a narrow group inflates d and a wide one deflates it, and the reader cannot correct for what you do not tell them.

Amara decides her practice notes will lead with kilos and carry d in brackets. That settles how to report a two-group comparison. Her clinic file, though, has three arms in it, and a column of active minutes, and a yes-or-no column about keeping the weight off, and none of those is a two-group comparison at all.

=== step === concept
::eyebrow The family
## One idea in four costumes

Every effect size in common use is one of two things: a **signal-to-noise ratio**, which is what d is, or a **share of variance explained**, which is what the rest of the family reports. Both answer the same question, how much of what you see is the thing you care about, and which one you use is decided by the shape of your data.

::widget process-flow {"steps":[{"title":"Two averages","sub":"d, or g when the groups are small"},{"title":"Several averages","sub":"eta squared, or omega squared for the population"},{"title":"Two continuous measurements","sub":"r, and r squared as a share of variance"},{"title":"Two categorical variables","sub":"Cramer V, or a risk difference in plain counts"}]}

Amara's clinic file has all four questions in it. Three arms rather than two, so d does not fit. A column of weekly active minutes to set against kilos lost, which is two continuous measurements. And a yes-or-no column recording who kept the weight off at twelve months, which is two categorical variables. Take them one at a time.

=== step === concept
::eyebrow Several groups
## Three groups: eta squared

With three arms there is no single gap to measure, so the question changes shape. Instead of "how far apart are the two averages", you ask **how much of the variation in weight loss is explained by which arm somebody was in**.

Everybody in the clinic lost a different amount, from a 5.2 kg gain to a 10.8 kg loss. Some of that spread is because the three programmes differ. The rest is because people differ. Split the total variation into those two piles, and the share sitting in the first pile is **eta squared**.

\[ \eta^2 = \frac{SS_{between}}{SS_{total}} \]

\( SS \) means sum of squares, which is variation added up: \( SS_{between} \) is how much the three group averages differ from the overall average, and \( SS_{total} \) is how much all 36 patients differ from it. `aov()` computes both.

```r
fit <- aov(kg_lost ~ arm)
summary(fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> arm          2  203.4  101.72    14.6 2.87e-05 ***
#> Residuals   33  230.0    6.97                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

sums <- summary(fit)[[1]][["Sum Sq"]]
round(c(between = sums[1], within = sums[2], eta_squared = sums[1] / sum(sums)), 4)
#>     between      within eta_squared
#>    203.4439    229.9617      0.4694
```

```r
stripchart(kg_lost ~ arm, method = "jitter", vertical = TRUE, pch = 19,
           col = "#2563a8", ylab = "kilos lost at six months", xlab = "")
points(1:3, tapply(kg_lost, arm, mean), pch = 4, cex = 2, lwd = 3, col = "#b5631a")
```

Eta squared is 0.4694, so which arm a patient was in accounts for about 47 percent of the variation in how much weight they lost. The other 53 percent is people being people, and the plot shows it: the three clouds sit at clearly different heights, and every one of them is tall.

=== step === concept
::eyebrow The correction, again
## Eta squared is optimistic too

Eta squared has the same flaw d had. It describes the sample in front of you, including the part of the group difference that was luck, so it runs high as a guess about the wider world. **Omega squared** subtracts an estimate of that luck.

\[ \omega^2 = \frac{SS_{between} - df_{between} \times MS_{error}}{SS_{total} + MS_{error}} \]

\( df_{between} \) is the number of groups minus one, so 2 here, and \( MS_{error} \) is the average leftover variation per patient, the 6.97 in the `aov` printout. Multiply them and you get roughly how much between-group variation you would expect from pure chance, then take it off the top.

```r
dfs <- summary(fit)[[1]][["Df"]]
mean_square_error <- sums[2] / dfs[2]
omega_squared <- (sums[1] - dfs[1] * mean_square_error) / (sum(sums) + mean_square_error)

round(c(eta_squared = sums[1] / sum(sums), omega_squared = omega_squared), 4)
#>   eta_squared omega_squared
#>        0.4694        0.4303
```

47 percent becomes 43 percent. The gap between them shrinks as the sample grows, exactly like the gap between d and g, and for the same underlying reason. Report omega squared when you are making a claim about the world, eta squared when you are describing this dataset and nothing beyond it.

=== step === quiz
::eyebrow Check yourself
## Eta squared or omega squared

Why is omega squared smaller than eta squared here?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Omega squared uses fewer groups ::no Both use all three arms and all 36 patients. The difference is what they are describing. Eta squared answers "in this dataset, what share of the variation lines up with the arm", and some of that share is chance, because with twelve patients per arm the group averages would differ a bit even if all three programmes were identical. Omega squared estimates how much of the share is chance and removes it.
- Eta squared counts the grouping's share of the variation in this particular sample, luck included ::ok With twelve patients per arm the three averages would differ somewhat even if the programmes were identical, and eta squared happily counts that accident as explained variation. Omega squared takes it back off, which is why it is the honest number to quote about the wider world.
- Omega squared is a corrected p-value ::no Both use all three arms and all 36 patients. The difference is what they are describing. Eta squared answers "in this dataset, what share of the variation lines up with the arm", and some of that share is chance, because with twelve patients per arm the group averages would differ a bit even if all three programmes were identical. Omega squared estimates how much of the share is chance and removes it.
- The two differ only when the sample is large ::no Both use all three arms and all 36 patients. The difference is what they are describing. Eta squared answers "in this dataset, what share of the variation lines up with the arm", and some of that share is chance, because with twelve patients per arm the group averages would differ a bit even if all three programmes were identical. Omega squared estimates how much of the share is chance and removes it.

=== step === concept
::eyebrow Two measurements
## Two continuous things: r and R squared

Amara also logged weekly active minutes for every patient. Now there are no groups at all, just two numbers per person, and the question becomes whether they move together.

The **correlation**, written r, is already an effect size. It runs from -1 to 1, it has no units, and it says how tightly the two measurements track each other. The panel below plots her 36 patients and works r out from them.

::widget chart-plotter {"data": [{"x": 35, "y": 0.5}, {"x": 107, "y": 0.2}, {"x": 119, "y": 4.6}, {"x": 100, "y": 0.8}, {"x": 54, "y": -1.1}, {"x": 92, "y": 1.7}, {"x": 53, "y": 0.1}, {"x": 87, "y": 0.4}, {"x": 44, "y": -3.6}, {"x": 86, "y": -5.2}, {"x": 44, "y": -2.5}, {"x": 64, "y": 1.9}, {"x": 112, "y": 3.7}, {"x": 81, "y": 1.7}, {"x": 106, "y": -3}, {"x": 118, "y": 7.2}, {"x": 150, "y": 0.1}, {"x": 142, "y": -1.3}, {"x": 94, "y": 1.8}, {"x": 125, "y": 3.8}, {"x": 49, "y": -1}, {"x": 84, "y": 0.9}, {"x": 94, "y": 4.9}, {"x": 81, "y": 1.3}, {"x": 167, "y": 5.8}, {"x": 111, "y": 3.6}, {"x": 195, "y": 6.7}, {"x": 172, "y": 3.3}, {"x": 125, "y": 3.6}, {"x": 86, "y": 2.6}, {"x": 86, "y": 5.3}, {"x": 128, "y": 3.7}, {"x": 151, "y": 10.8}, {"x": 167, "y": 6.8}, {"x": 156, "y": 8.4}, {"x": 127, "y": 5.7}], "geoms": ["point"], "x": "minutes", "y": "kg_lost"}

Patients who logged more active minutes lost more weight. `cor.test` gives the number, and an interval around it.

```r
cor.test(minutes, kg_lost)
#> 
#> 	Pearson's product-moment correlation
#> 
#> data:  minutes and kg_lost
#> t = 4.7762, df = 34, p-value = 3.344e-05
#> alternative hypothesis: true correlation is not equal to 0
#> 95 percent confidence interval:
#>  0.3853568 0.7964059
#> sample estimates:
#>      cor 
#> 0.633668 

round(cor(minutes, kg_lost)^2, 4)
#> [1] 0.4015
```

r = 0.63, with an interval from 0.39 to 0.80. Square it and you get **R squared = 0.4015**, which is the share of variation in weight loss that lines up with active minutes, and that is the same kind of number eta squared was. So r = 0.63 does not mean 63 percent of anything. It means 40 percent.

One warning that belongs on the same page as the number. This is an association inside one clinic, and Amara did not assign minutes to anybody. Patients who were losing weight may well have felt like moving more. The effect size measures the strength of a pattern; it says nothing about which way the arrow points.

=== step === concept
::eyebrow Two categories
## Two categorical things, and the number that beats Cramer's V

The last column is a yes or no: did the patient keep the weight off at twelve months? Two categorical variables now, the arm and the outcome, and the natural summary is a table of counts.

For a table like that the standard effect size is **Cramer's V**, which rescales the chi-squared statistic onto a 0 to 1 range so it stops depending on how many patients you had.

\[ V = \sqrt{\frac{\chi^2}{n(k-1)}} \]

\( \chi^2 \) is the chi-squared statistic, n is the total number of patients, and k is the smaller of the number of rows and the number of columns, so 2 here.

```r
kept_off <- matrix(c(2, 10, 5, 7, 9, 3), nrow = 3, byrow = TRUE,
                   dimnames = list(c("usual", "app", "coach"),
                                   c("kept it off", "regained")))
kept_off
#>       kept it off regained
#> usual           2       10
#> app             5        7
#> coach           9        3

test <- chisq.test(kept_off)
cramers_v <- sqrt(as.numeric(test$statistic) / (sum(kept_off) * (min(dim(kept_off)) - 1)))
round(c(chi_squared = as.numeric(test$statistic), cramers_v = cramers_v), 4)
#> chi_squared   cramers_v
#>      8.3250      0.4809
```

V = 0.48, on a scale where 0 is no association and 1 is a perfect one. It is a strength, and it is honest, and it is also nearly useless to a patient asking what their chances are.

Now look at what does answer that question.

```r
round(c(coach = 9 / 12, usual = 2 / 12, risk_difference = 9 / 12 - 2 / 12), 4)
#>           coach           usual risk_difference
#>          0.7500          0.1667          0.5833

round(as.numeric(fisher.test(kept_off[c("coach", "usual"), ])$conf.int), 2)
#> [1]   1.54 190.85
```

Nine of twelve coach patients kept it off against two of twelve on usual care, so 75 percent against 17 percent, a **risk difference of 58 percentage points**. That is a sentence Amara can say in a consulting room, and no rescaled statistic improves on it.

Now the second line, which is where the honesty comes in. It is the exact interval for the odds ratio, which for this table is 15, and it runs from 1.54 to 190.85. An effect size that looks overwhelming, computed on twenty-four people, has pinned down almost nothing.

=== step === concept
::eyebrow One family
## They convert into each other

d, r and eta squared look like different measures. They are the same information in different clothes, and you can prove it on Amara's own two arms.

The textbook conversion from d to r is \( r = d/\sqrt{d^2+4} \). That 4 assumes the two groups are exactly the same size, and it is an approximation even then. The exact version keeps the real group sizes in it:

\[ r = \frac{d}{\sqrt{d^2 + \frac{N(N-2)}{n_1 n_2}}} \]

with N the total sample size. Here are both, against the ground truth, which is simply correlating the outcome with a 0-or-1 column saying which arm each patient was in.

```r
d <- cohens_d(coach, usual)
N <- 24

round(c(shortcut = d / sqrt(d^2 + 4),
        exact    = d / sqrt(d^2 + N * (N - 2) / (12 * 12))), 4)
#> shortcut    exact
#>   0.7501   0.7641

outcome  <- c(usual, coach)
on_coach <- rep(c(0, 1), each = 12)
round(cor(on_coach, outcome), 4)
#> [1] 0.7641

two_group_fit <- aov(outcome ~ factor(on_coach))
two_sums <- summary(two_group_fit)[[1]][["Sum Sq"]]
round(c(eta_squared = two_sums[1] / sum(two_sums), r_squared = cor(on_coach, outcome)^2), 4)
#> eta_squared   r_squared
#>      0.5839      0.5839
```

The exact formula hits `cor()` on the nose at 0.7641, and the shortcut misses by 0.014. Then eta squared and r squared come out identical at 0.5839, because with two groups they are literally the same calculation.

So there is one quantity underneath, and four ways of writing it down. Which one you report is a question about your reader, not about your data.

=== step === tryit
::eyebrow Your turn
## Pick the effect size the design calls for

Amara wants to know how much of the variation in **weekly active minutes** is explained by which arm a patient was in. Three groups, one continuous outcome, so the design picks the measure for you: eta squared.

Fill in the outcome variable and press Check.

```r
minutes_fit <- aov(____ ~ arm)
minutes_sums <- summary(minutes_fit)[[1]][["Sum Sq"]]
round(minutes_sums[1] / sum(minutes_sums), 4)
```
::check {"regex":"aov\\s*[(]\\s*minutes\\s*~","gate":true,"difficulty":"intermediate","ok":"0.4569, so which arm somebody was in explains about 46 percent of the variation in active minutes, which is close to the 47 percent it explained for weight lost. The population version, omega squared, comes out at 0.4171. Notice that no part of the choice was a matter of taste: three groups and a continuous outcome give you eta squared, and nothing else fits.","no":"The outcome here is the minutes column, so the model is `aov(minutes ~ arm)`. The grouping variable on the right is already filled in."}
::solution
```r
minutes_fit  <- aov(minutes ~ arm)
minutes_sums <- summary(minutes_fit)[[1]][["Sum Sq"]]
minutes_dfs  <- summary(minutes_fit)[[1]][["Df"]]
minutes_mse  <- minutes_sums[2] / minutes_dfs[2]

round(c(eta_squared   = minutes_sums[1] / sum(minutes_sums),
        omega_squared = (minutes_sums[1] - minutes_dfs[1] * minutes_mse) /
                        (sum(minutes_sums) + minutes_mse)), 4)
#>   eta_squared omega_squared
#>        0.4569        0.4171
```

=== step === concept
::eyebrow The labels
## Small, medium, large, and what Cohen actually meant

Sooner or later somebody will tell you that 0.2 is small, 0.5 is medium and 0.8 is large. Those numbers come from Jacob Cohen, who put them forward as rough conventions for researchers who had no better frame of reference, and who warned that they were meant relative to each other rather than as a standard. They have since been quoted as a standard roughly everywhere.

Here is what they actually describe, using the translations from step 12.

```r
benchmarks <- c(small = 0.2, medium = 0.5, large = 0.8)

round(2 * pnorm(-benchmarks / 2), 4)
#>  small medium  large
#> 0.9203 0.8026 0.6892

round(pnorm(benchmarks / sqrt(2)), 4)
#>  small medium  large
#> 0.5562 0.6382 0.7142
```

| Label | d | Overlap between the groups | Chance the treated person did better |
|---|---|---|---|
| Small | 0.2 | 92 percent | 56 in 100 |
| Medium | 0.5 | 80 percent | 64 in 100 |
| Large | 0.8 | 69 percent | 71 in 100 |

A "large" effect still leaves the two groups overlapping by more than two thirds, and the treated person wins only 71 times in 100. Read that again, because "large" sounds like a much stronger claim than it is.

The modern criticism, argued hardest by Funder and Ozer, is twofold: real effects in most fields run well below Cohen's thresholds, so the labels end up grading almost everything as a failure, and a genuinely small effect that repeats across millions of people can matter enormously. By the labels the coach trial is large and the app trial does not even reach small. That is true, and it is not yet a decision.

=== step === concept
::eyebrow Size is not importance
## A small effect that matters and a large one that does not

Amara has to choose. She can put the app in front of all **1,900 patients** on her list, at no cost per patient, or she can fund **40 places** on the coach programme, which is what the budget covers. Multiply each effect by the people it can reach.

```r
app_total   <- 1900 * c(expected = 0.5, lower = 0.0786, upper = 0.9214)
coach_total <- 40 * c(expected = 5.0, lower = 2.7423, upper = 7.2577)

round(app_total, 1)
#> expected    lower    upper
#>    950.0    149.3   1750.7

round(coach_total, 1)
#> expected    lower    upper
#>    200.0    109.7    290.3
```

```r
totals <- c(as.numeric(app_total["expected"]), as.numeric(coach_total["expected"]))
lower  <- c(as.numeric(app_total["lower"]),    as.numeric(coach_total["lower"]))
upper  <- c(as.numeric(app_total["upper"]),    as.numeric(coach_total["upper"]))

bars <- barplot(totals, names.arg = c("app, all 1,900", "coach, 40 places"),
                col = c("#2563a8", "#b5631a"), ylim = c(0, 1900),
                ylab = "total kilos lost across the group")
arrows(bars, lower, bars, upper, angle = 90, code = 3, length = 0.08, lwd = 2)
```

The effect size everyone would call negligible delivers about 950 kg across the practice. The one everyone would call large delivers about 200 kg, because it only reaches 40 people. On expectation the app wins by nearly five to one.

Read the error bars before you take that as a rule, though. The app's total could be anywhere from 149 kg to 1,751 kg, and the bottom of that range is below the coach programme's expected 200. The coach programme's own range, 110 to 290 kg, is narrow by comparison. So the app has the bigger expected haul and far more uncertainty attached to it.

And there is a patient this arithmetic cannot see. Someone who needs to lose ten kilos gets nothing usable from half a kilo, whatever the total across the practice says. Reach makes small effects matter in aggregate; it does not make them matter to an individual. Both of those are true at once, and a version of this that keeps only one of them is misleading.

=== step === quiz
::eyebrow Check yourself
## Real, big, important

Which set of facts would justify recommending the app to the whole list rather than funding coach places?

::quiz {"correct": 4, "gate": true, "difficulty": "advanced"}
- The app trial had far more participants ::no Sample size, a p-value and a standardized effect size all describe a study. None of them contains the two things a decision turns on: how many people the option can reach, and what each place costs. That is why the arithmetic in the last step multiplied the effect by the reach before comparing anything.
- The app trial's p-value was significant ::no Sample size, a p-value and a standardized effect size all describe a study. None of them contains the two things a decision turns on: how many people the option can reach, and what each place costs. That is why the arithmetic in the last step multiplied the effect by the reach before comparing anything.
- The coach programme's d is large, so it must be the better choice ::no Sample size, a p-value and a standardized effect size all describe a study. None of them contains the two things a decision turns on: how many people the option can reach, and what each place costs. That is why the arithmetic in the last step multiplied the effect by the reach before comparing anything.
- The app reaches every patient at no cost per place, and its total, though uncertain, covers more kilos than 40 coach places can deliver ::ok Reach times effect, with the uncertainty carried along rather than dropped. That is a decision, and notice how much of it comes from outside the trials: the 1,900 patients on the list and the 40 places in the budget appear in no paper anywhere.

=== step === concept
::eyebrow The decision
## What Amara decides
::prose-only the reasoning itself is the content, and every number in it has already been computed and plotted in the preceding steps

She does both, and she can say why.

The app goes to the whole list, because it costs nothing per place and half a kilo across 1,900 people is worth having. She writes down that the total is uncertain, somewhere between 149 and 1,751 kg, and that she is not going to claim the middle of that range as a fact.

The 40 funded coach places go to the patients who need a large loss, because for them a five kilo difference is the only one of the two that clears the bar she set at the beginning, which was about 4 kg.

And she records one thing about her own clinic, so that nobody quotes it back at her later. Her coach arm produced d = 2.27 against the trial's 1.15, and that is not evidence her clinic runs the programme better. It is because her patients resemble each other more than the trial's volunteers did, which shrinks the denominator. In kilos the two results agree: 5.7 in her clinic, 5.0 in the trial.

Three separate answers, in order: it is real, it is this big, and it is worth doing for these patients. The first came from a p-value, the second from an effect size, and the third from neither.

=== step === concept
::eyebrow Writing it up
## The paragraph she writes

Here is what goes in the practice file.

> Two published trials of weight programmes were compared. The SlimTrack app group lost 0.50 kg more than control (95 percent CI 0.08 to 0.92 kg; d = 0.12, 95 percent CI 0.02 to 0.22, standardized by the pooled within-group spread of 4.25 kg, n = 786 and 780). The coach programme group lost 5.00 kg more than control (95 percent CI 2.74 to 7.26 kg; d = 1.15, 95 percent CI 0.60 to 1.69, same standardizer, n = 29 and 31 trial volunteers). Applied to this practice, the app covers 1,900 patients for an expected 950 kg total (149 to 1,751 kg) and the 40 funded coach places an expected 200 kg (110 to 290 kg). Our own 36-patient clinic comparison gave a larger d of 2.27 for coach against usual care, on a similar raw difference of 5.7 kg; that is a narrower patient mix rather than a better result, so it should not be compared with the trial's d. Recommendation: offer the app list-wide and reserve the coach places for patients needing a loss above 4 kg.

Six sentences, and four things it does on purpose.

- **It leads with the raw difference and its interval.** Kilos first, every time, because kilos are what a patient and a budget both understand.
- **It gives the standardized version and says which spread that used.** Without the denominator, d = 1.15 is not reproducible by anybody.
- **It states the sample the number came from**, trial volunteers in one case and her own patients in the other, so a reader can judge whether the two are comparable. They are not, and it says so.
- **It separates what was measured from what is being recommended.** Everything up to the last sentence is measurement, and the recommendation stands on its own where she can be asked to defend it.

=== step === quiz
::eyebrow Check yourself
## Which write-up is finished

The cover asked which of four write-ups looked like the strongest evidence. This one asks something harder: which of these four descriptions of the coach trial is a finished effect-size report?

::quiz {"correct": 4, "gate": true, "difficulty": "advanced"}
- The coach programme had a large effect, d = 1.15 ::no A finished report answers four questions: how big in real units, how precise, standardized by what, and measured on whom. A label answers none of them. A p-value answers none of them either, since it speaks to existence rather than size. And a bare d with an interval still leaves a reader unable to reproduce the number or judge whether their own patients resemble the sample.
- The coach group lost 5.00 kg more than control, p < 0.001 ::no A finished report answers four questions: how big in real units, how precise, standardized by what, and measured on whom. A label answers none of them. A p-value answers none of them either, since it speaks to existence rather than size. And a bare d with an interval still leaves a reader unable to reproduce the number or judge whether their own patients resemble the sample.
- d = 1.15, 95 percent CI 0.60 to 1.69 ::no A finished report answers four questions: how big in real units, how precise, standardized by what, and measured on whom. A label answers none of them. A p-value answers none of them either, since it speaks to existence rather than size. And a bare d with an interval still leaves a reader unable to reproduce the number or judge whether their own patients resemble the sample.
- The coach group lost 5.00 kg more than control (95 percent CI 2.74 to 7.26), d = 1.15 standardized by the pooled within-group spread, in 60 trial volunteers ::ok That one carries the size in real units, the interval, the denominator and the sample. A reader can act on it, reproduce it, and judge whether their own patients look anything like those sixty volunteers.

=== step === concept
::eyebrow The habit
## Four questions for any effect you are shown

Part 5 closed with four questions to ask of any test. Here are the four to ask of any effect, and they are deliberately not the same four.

::widget process-flow {"steps":[{"title":"How big, in real units?","sub":"the raw difference and its interval, before any standardizing"},{"title":"Divided by which spread?","sub":"pooled, control only, or the changes, which is a different question"},{"title":"From how many people?","sub":"small samples inflate, narrow samples inflate, neither announces itself"},{"title":"What does that size buy?","sub":"reach and cost, which no effect size contains"}]}

**How big, in real units?** If a report gives you a d and no raw difference, the most useful number is missing. Ask for it.

**Divided by which spread?** Pooled, control only, or the spread of the changes. You saw 2.30 and 0.48 come out of one set of twelve patients, so this is not a detail.

**From how many people?** Fewer than about twenty per group and the arithmetic itself runs high, which Hedges' g fixes. A small study that only got published because it was significant runs high again, which nothing fixes. A narrow sample runs high a third time, and that one is invisible unless the paper describes who it recruited.

**What does that size buy?** Multiply by the people it reaches, subtract what it costs, and carry the interval through the whole calculation. This is the question the effect size cannot answer and the only one anybody actually needs answered.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour if you want to push past where this part stops.

- [Lakens, Calculating and reporting effect sizes to facilitate cumulative science, 2013](https://doi.org/10.3389/fpsyg.2013.00863) - the practical companion to today, with worked formulas for every measure here, including the before-and-after standardizer problem and intervals around effect sizes.
- [Funder and Ozer, Evaluating effect size in psychological research: sense and nonsense, 2019](https://doi.org/10.1177/2515245919847202) - the paper that takes the small, medium and large labels apart, and argues that small effects which repeat are the ones that add up.
- [Kelley and Preacher, On effect size, 2012](https://doi.org/10.1037/a0028086) - the careful definition of what an effect size actually is, and why one dataset legitimately supports several of them.
- [Cumming, The new statistics: why and how, 2014](https://doi.org/10.1177/0956797613504966) - the case for leading a report with estimates and intervals rather than with a verdict, which is the reporting rule from step 29 argued at length.
- [Ben-Shachar, Ludecke and Makowski, effectsize: estimation of effect size indices and standardized parameters, 2020](https://doi.org/10.21105/joss.02815) - the R package that computes every index in this part, for use outside the browser once you know what it is doing.

=== step === complete
## Part 6 complete

You started with two trials that carried the same stamp and ended with a decision that used neither stamp. The app trial's half a kilo and the coach trial's five kilos became d = 0.1176 and d = 1.1453, computed from published summary tables with no raw data anywhere, and those two numbers said in one line what two p-values could not say at all.

Then the new tool got taken apart. The coach trial's d turned out to be anywhere from 0.60 to 1.69, and ten thousand resamples of Amara's own clinic agreed with the formula that said so. Ten thousand honest little studies with a true effect of 0.5 averaged 0.523 because small samples squeeze the denominator, and Hedges' g pulled them back to 0.5009. Run that same world again and look only at the studies that reached significance, and their average d was 1.2287, nearly two and a half times the truth, and the same simulation run at the coach trial's real design showed no such inflation, which is how you check rather than assume. One set of twelve before-and-after weights produced 2.2995 or 0.4760 depending only on which spread went underneath. And Amara's own d of 2.27 turned out to be the trial's 1.15 measured on a narrower group of people.

The family filled itself in from there. Three arms gave eta squared 0.4694 and omega squared 0.4303, active minutes against kilos gave r = 0.63 and 40 percent of the variation, twenty-four patients and a yes-or-no column gave Cramer's V of 0.48 and an odds-ratio interval running from 1.54 to 190.85. Then the exact conversion put d and r on top of each other at 0.7641, which is the whole family turning out to be one idea.

The last move was the one the labels cannot make. Half a kilo across 1,900 patients is 950 kg, five kilos across 40 funded places is 200 kg, and neither the p-values nor the d values contained the 1,900 or the 40. So the answer came out in three parts: it is real, it is this big, and it is worth doing for these patients.

One part of the course remains. Take the habit from the last step with you into it, because every question left is a question about a number somebody is asking you to act on.

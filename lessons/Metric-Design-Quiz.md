---
title: "Product Metric Design Lesson 9: Quiz"
catalog_blurb: "Eight questions on one case: every skill from this section, checked in order."
description: "Nimbus's RoundUp Boost test moves four metrics at once. Review the OEC, guardrails, Goodhart's Law, multiple testing, surrogacy and metric sensitivity."
keywords: "metric design quiz, overall evaluation criterion, guardrail metrics, goodhart's law, multiple testing, family-wise error rate, surrogate endpoint, metric sensitivity, delta method, ratio metric, A/B testing, product metrics"
post_type: "LESSON"
curriculum_id: "3.20.9"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "9"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
lesson_kind: "quiz"
course_next: ""
course_prev: "Ratio-Metrics-and-the-Delta-Method.html"
---

=== step === cover
## Quiz

Today let's put every skill from this section to work on one single case.

Nimbus is a budgeting app. It is A/B testing RoundUp Boost, a redesigned round-up savings prompt, against its current prompt, with 10,000 users seeing each version.

Four numbers from that one test carry every question. Round-up opt-in rate rose from 20% in control to 26% in the RoundUp Boost variant, and failed-payment rate rose from 2.0% to 2.4%. Customer complaint rate, a guardrail with a 0.5-point threshold fixed before the test started, rose from 1.0% to 1.9%. And 90-day active-saver retention, the lagging true outcome, is not yet known when the launch decision has to be made.

This quiz carries that one test through eight questions, one skill at a time.

- Classifying a metric by who produced it and how soon you know it.
- Combining several metrics into one Overall Evaluation Criterion fixed before a test runs.
- Reading a guardrail's breach against its own fixed threshold.
- Spotting Goodhart's Law once a metric becomes a scored target, tested briefly on Nimbus's own support team rather than the launch test itself.
- Computing the family-wise error rate across several guardrails checked together.
- Judging whether a fast proxy meets the conditions to stand in for a slow true outcome.
- Comparing two metrics' sensitivity to the same real lift through their own spread.
- Seeing why a ratio metric needs its own standard error formula, not the usual one.

The last two steps are live R, where you recompute Nimbus's launch OEC and the ratio metric's two standard errors yourself.

=== step === quiz
## Classifying Nimbus's complaint rate as input or output, leading or lagging

A metric can be sorted along two independent lines: who produced it, and how soon you know it. A metric is an input metric when the team sets its value directly, something like how many prompts are shown or how big a discount is, and an output metric when it is a result of what users actually do, something the team can only influence, not set.

Separately, a metric is leading when it is known quickly, within days of the action that produced it, and lagging when it is only known after a long delay.

Nimbus's customer complaint rate is not something the team sets. It is a result of how users reacted, and it arrives within days of a purchase.

How should it be classified?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- An input metric, known quickly: the team sets how the product behaves, so its results are known fast too. ::no
- An input metric, known only after a long delay: the team sets it, but complaints take a while to roll in. ::no
- An output metric, known quickly: it is a result of user behaviour the team does not set directly, and it arrives within days of a purchase. ::ok Right. Nimbus does not set the complaint rate directly, so it is an output. And because a complaint usually follows a purchase within days rather than months, it is leading, not lagging.
- An output metric, known only after a long delay: it is a result of user behaviour, but complaints take months to surface. ::no Complaint rate is a result of user behaviour, not something the team sets, so it is an output metric, not an input one. But it does not take a long delay either: Nimbus already said it arrives within days of a purchase, which makes it leading, not lagging.

=== step === quiz
## Reading Nimbus's Overall Evaluation Criterion

Nimbus needs one number that says whether RoundUp Boost should ship, not four numbers pulling in different directions. The Overall Evaluation Criterion, or OEC, is built by taking each metric's percent change, multiplying it by a weight fixed before the test ran, and summing the results.

For this test, round-up opt-in rate rose 30% relative to control, carrying a weight of 0.6, so it contributes 0.6 times 30, or +18. Failed-payment rate rose 20% relative to control, carrying a weight of -0.4 since a rising failed-payment rate is a cost, so it contributes -0.4 times 20, or -8. Added together, Nimbus's OEC for this test comes to +18 plus -8, or +10.

What does that +10 OEC actually tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It tells you every metric that went into it improved, since the total is positive. ::no
- It tells you the weighted, pre-fixed combination favours the variant, nothing more: failed-payment rate actually got worse, and a positive score by itself does not settle whether to launch. ::ok Right. The OEC is a weighted sum fixed in advance, and +10 just means the variant comes out ahead once opt-in rate's gain and failed-payment rate's cost are combined at those pre-fixed weights. It does not mean every metric improved, since failed-payment rate's own contribution is negative, and a positive score is not a launch decision on its own.
- It tells you the 0.6 and -0.4 weights were estimated from this test's own data, the way a regression coefficient is. ::no
- It tells you Nimbus should ship RoundUp Boost, since a positive OEC is enough on its own to launch. ::no Three of these four either credit every metric with improving, treat the weights as something the test itself estimated, or treat a positive score as a launch decision by itself. The weights were fixed before the test, from business judgement, not estimated from the data, and whether to launch depends on more than the OEC alone.

=== step === quiz
## A winning OEC blocked by one breach

A guardrail is a metric that can block a launch on its own, no matter how good the OEC looks, because it protects something the team is not willing to trade away. Its threshold is fixed before the test runs, from a real cost like handling expense or user trust, not chosen after seeing the result.

Nimbus set customer complaint rate, the metric classified two questions back, as a guardrail with a threshold of 0.5 percentage points. In this test it rose from 1.0% to 1.9%, a rise of 0.9 points, which breaches that 0.5-point threshold. Meanwhile, the OEC from the last question came to +10, favouring the variant.

Does RoundUp Boost ship?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Yes, since the +10 OEC favours the variant and that is the number that decides a launch. ::no
- No, but only because the breach is large enough to matter; a smaller breach, say 0.1 points over the threshold, would not have blocked the launch. ::no
- No. The complaint rate breached its own fixed threshold, 0.9 points against 0.5, and that blocks the launch regardless of what the +10 OEC says. ::ok Right. A guardrail breach blocks a launch on its own terms, set against its own threshold, independent of how the OEC comes out. The +10 OEC does not buy back a guardrail breach, however favourable it looks.
- No, but a guardrail breach would only matter here if the OEC had also come out negative. ::no Three of these four either let a positive OEC overrule the breach, treat the breach as only mattering past some size, or treat the breach as conditional on the OEC also losing. None of that is how a guardrail works: once complaint rate crosses its own fixed 0.5-point threshold, the launch is blocked, whatever the OEC says and however large the breach is past that line.

=== step === quiz
## A scored metric that improves while the real outcome worsens

Step back from the launch test for a moment, to Nimbus's own support team. The team is scored on tickets closed per hour, and that number has been rising steadily. But repeat-contact rate within 7 days, how often the same user has to contact support again about the same issue, nobody is scored on it, and it has been rising too, right alongside tickets closed per hour.

What does that pairing actually tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Tickets closed per hour is rising, so the team has genuinely gotten better at supporting users. ::no
- The two trends are unrelated: tickets closed per hour and repeat-contact rate just happen to be rising in the same weeks by coincidence. ::no
- This is a likely gamed win under Goodhart's Law, not proof of genuine improvement. Once tickets closed per hour became the scored target, closing tickets faster, even without truly resolving them, is exactly what would make both numbers rise together. ::ok Right. Goodhart's Law is what happens once a measure becomes a target: people find ways to move the number that do not require the underlying thing it was meant to track to improve. A scored metric rising next to a worsening or equally rising unscored outcome is the signature of exactly that, not evidence the team is doing better work.
- Repeat-contact rate is rising only because harder problems are arriving this month, unrelated to how fast tickets are being closed. ::no Three of these four either credit the scored metric with genuine improvement, write off the pairing as coincidence, or blame some other cause entirely. But a scored metric rising while an unscored outcome that should move with real improvement rises too, or worsens, is the exact signature of Goodhart's Law: once a number becomes the target, it can be moved without the real thing it stands for improving at all.

=== step === quiz
## Four guardrails, one family-wise error rate

RoundUp Boost's launch check runs four guardrails together: failed-payment rate, complaint rate, crash rate and support contact rate, each tested at the usual significance threshold, alpha = 0.05. That threshold means each individual guardrail has a 5% chance of flagging a breach purely by chance, even if nothing about it actually changed.

Suppose none of the four guardrails actually changed. What is the chance that at least one of them still flags a breach, purely by chance?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 5%, the same chance as any one guardrail on its own. ::no
- About 18.5%, from 1 minus 0.95 raised to the 4th power: the chance all four stay quiet, 0.95^4, is about 81.5%, so the chance at least one flags is the rest. ::ok Right. Each guardrail has a 95% chance of staying quiet on its own, and with four tested together, the chance all four stay quiet is 0.95 to the 4th power, about 81.5%. The chance at least one flags is whatever is left over, about 18.5%, well above the 5% any single guardrail carries alone.
- About 40%, the rate you would get checking ten guardrails together instead of four. ::no
- 95%, since that is the chance any one guardrail stays quiet. ::no Three of these four either stop at one guardrail's own 5% rate, quote the right kind of number but for the wrong count of guardrails, or report the chance a guardrail stays quiet instead of the chance one flags. With four guardrails tested together, the chance at least one flags by pure chance climbs to about 18.5%, well past what any single 5% threshold suggests on its own.

=== step === quiz
## A proxy that moved without the true outcome following

A fast proxy metric is only a valid stand-in for a slow true outcome once four conditions hold.

1. The treatment has a real, measurable effect on the proxy.
2. The treatment has a real, measurable effect on the true outcome itself.
3. The proxy has a real, measurable effect on the true outcome.
4. The proxy fully captures the treatment's effect on the true outcome, so that once you know the proxy's result, the treatment itself adds nothing more.

Round-up opt-in rate has historically correlated with 90-day active-saver retention at r = 0.55, and in this test it rose clearly and significantly. But retention's own 95% confidence interval, measured on the same test, crosses zero.

What is the right read of this?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Since opt-in rate historically correlates with retention at r = 0.55, that correlation alone is enough to call this a retention win. ::no
- The second condition lacks support here: retention's own confidence interval crosses zero, so this specific test has not shown the treatment affected the true outcome, whatever opt-in rate did. ::ok Right. The historical correlation speaks to the third condition, that the proxy and the true outcome move together in general, but it says nothing about whether this specific treatment moved the true outcome. That is the second condition, and retention's interval crossing zero means it has not yet been shown to hold.
- Opt-in rate's own rise was clear and significant, so retention must have moved too, even though its own interval has not confirmed it yet. ::no
- Since retention's interval crosses zero, the surrogate relationship between opt-in rate and retention has now been proven false. ::no Three of these four either lean on the historical correlation alone, assume the proxy's own significant move guarantees the true outcome moved too, or read a non-significant result as proof of zero effect. None of those are right. A confidence interval crossing zero means the treatment's effect on retention has not yet been shown to differ from zero in this test, not that it has been shown to be exactly zero, and it is specifically the second condition, that the treatment moves the true outcome, that this test leaves unsupported.

=== step === quiz
## Choosing the metric that can actually be powered

What decides how much traffic a test needs to detect a real lift is not how much the business cares about a metric, but how noisy that metric is relative to the lift: its own standard deviation. A smaller standard deviation makes the same real lift stand out more clearly, which is what Cohen's d captures: the lift divided by the metric's own standard deviation.

Round-up opt-in rate is a 0/1 metric per user, so its standard deviation can never exceed 0.5, and near Nimbus's own pooled rate of about 23% it works out to about 0.42. Suppose the exact same real underlying improvement showed up as a 6 percentage point rise in opt-in rate, matching what this test already saw, or as a $3 per user per month rise in dollars saved, a wide, right-skewed metric with a standard deviation of about $60 because a handful of heavy savers pull it far above everyone else.

Which metric needs less traffic to detect that same real lift?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Dollars saved per user per month, since a dollar figure carries more information than a 0/1 metric like opt-in rate. ::no
- Both need the same amount of traffic, since the underlying improvement being tested is identical either way. ::no
- Round-up opt-in rate. Its standard deviation, about 0.42, sits well below dollars saved's roughly $60, so the same lift standardises to a far larger Cohen's d through opt-in rate, about 0.14 against about 0.05, and a larger Cohen's d needs less traffic to detect. ::ok Right. Cohen's d is the lift divided by the metric's own standard deviation, and a bounded 0/1 metric like opt-in rate has a far smaller standard deviation than a wide, right-skewed dollar metric. The same real lift stands out more clearly through opt-in rate, so a test on opt-in rate needs far less traffic to reach the same power.
- Opt-in rate needs more traffic, since a percentage is naturally noisier than a dollar amount. ::no Three of these four either credit the dollar metric with carrying more information, assume an identical underlying change needs identical traffic regardless of metric, or assume a percentage is inherently noisier than a dollar figure. None of that is how detectability works. What decides the traffic a test needs is Cohen's d, the lift standardised by the metric's own spread, and a metric's spread has nothing to do with its units or how much the business cares about it.

=== step === quiz
## What the naive standard error assumes about a ratio metric

Round-ups completed per prompt shown is a ratio metric: Nimbus pools every prompt shown across every user, and every round-up completed in response, into one rate, total round-ups over total prompts. But users differ. Some users see far more prompts than others, and each user has their own personal chance of completing a round-up whenever they see one.

The usual, naive way to compute this rate's standard error treats every single prompt as its own independent trial at one shared rate, the same formula you would use for an ordinary proportion.

What does that naive formula actually assume, and why can it fail here?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- It assumes every prompt behaves as an independent, identically distributed trial, no matter which user it came from, which breaks once users genuinely differ from each other in how often they see prompts and how likely they are to act on one. ::ok Right. Pooling treats every prompt as its own independent trial at one shared rate, when prompts really arrive clustered inside a much smaller number of independent users, each with their own personal propensity to complete a round-up. That gap, between the unit the formula assumes and the unit the data actually varies at, is exactly what understates the true standard error.
- It assumes the sample, the total count of prompts, is too small to trust. ::no
- It assumes the point estimate, the pooled rate itself, is wrong. ::no
- It assumes nothing extra: the pooled rate already accounts for how many prompts each user saw, since it sums across every one of them. ::no Three of these four either blame the sample size, blame the point estimate itself, or claim summing across users is enough to account for how differently they behave. None of that is the real assumption. The naive formula treats every prompt as an independent trial at one shared rate, and that is exactly what breaks once users, not prompts, are the thing that genuinely varies.

=== step === concept
## Computing Nimbus's OEC in R

Let's confirm the OEC from two questions back directly in R, using the same percent changes and weights.

```r
# Combine round-up opt-in rate's and failed-payment rate's percent changes with their fixed weights into one OEC
pct_change <- c(opt_in_rate = 30, failed_payment_rate = 20)
weight <- c(opt_in_rate = 0.6, failed_payment_rate = -0.4)

contribution <- pct_change * weight
oec_score <- sum(contribution)

contribution
#>         opt_in_rate failed_payment_rate
#>                  18                  -8
oec_score
#> [1] 10
```

`pct_change` holds each metric's percent change relative to control, and `weight` holds the fixed weight Nimbus set for each one before the test ran, positive for a metric that counts as a win and negative for one that counts as a cost. Multiplying the two element by element gives each metric's own contribution: opt-in rate contributes 18, failed-payment rate contributes -8. Summing those two numbers gives `oec_score`, 10, exactly the OEC from the earlier question.

=== step === concept
## Computing the ratio metric's two standard errors in R

Let's build the round-ups completed per prompt shown metric from the last question for real, so every number in this comparison is something you can check yourself. About 180 Nimbus users each see the RoundUp Boost prompt a different number of times over a week, and each user has their own personal chance of completing a round-up whenever they see one.

```r
# Simulate about 180 Nimbus users, each with their own prompt count and their own round-up propensity
set.seed(2026)
n_users <- 180
prompts_shown <- 1 + rpois(n_users, 6)
roundup_propensity <- rbeta(n_users, 0.5, 3.0)
round_ups_completed <- rbinom(n_users, prompts_shown, roundup_propensity)

total_prompts <- sum(prompts_shown)
total_roundups <- sum(round_ups_completed)
R_hat <- total_roundups / total_prompts

c(total_prompts = total_prompts, total_roundups = total_roundups)
#>  total_prompts total_roundups 
#>           1200            175 
round(100 * R_hat, 2)
#> [1] 14.58
```

`prompts_shown` draws each user's prompt count from a Poisson distribution with mean 6, plus 1 so nobody sees zero prompts. `roundup_propensity` draws each user's own personal chance of completing a round-up from a Beta distribution, a distribution of values between 0 and 1, so some users complete round-ups often and some rarely. `round_ups_completed` then draws, for each user, how many of their prompts turned into a completed round-up, using that user's own propensity. Pooled across all 180 users, that is 1,200 total prompts and 175 total round-ups, for a pooled rate, `R_hat`, of 14.58%.

Now the naive standard error, the one that treats every prompt as an independent trial at that one shared rate.

```r
# Treat every prompt as an independent trial at the pooled rate, the naive formula for a proportion
SE_naive <- sqrt(R_hat * (1 - R_hat) / total_prompts)
SE_naive
#> [1] 0.01018847
```

And now the delta-method standard error, built from how prompts and round-ups vary user to user instead of prompt to prompt.

```r
# Compute the delta-method standard error from the variance of round-ups, the variance of prompts, and their covariance
Xbar <- mean(prompts_shown)
var_roundups <- var(round_ups_completed)
var_prompts <- var(prompts_shown)
cov_prompts_roundups <- cov(prompts_shown, round_ups_completed)

numerator <- var_roundups - 2 * R_hat * cov_prompts_roundups + R_hat^2 * var_prompts
SE_delta <- sqrt(numerator / (n_users * Xbar^2))

c(naive_se = SE_naive, delta_se = SE_delta)
#>   naive_se   delta_se
#> 0.01018847 0.01635930
```

The naive standard error comes to 0.0102. The delta-method standard error, built from how much users genuinely differ from each other rather than treating every prompt as interchangeable, comes to 0.0164, about 1.6 times wider. That gap is the cost of the naive formula's broken independence assumption from the last question: once the real unit of variation is the user, not the prompt, the honest standard error on this rate is noticeably wider than the naive formula reports.

=== step === complete
## Section complete

This quiz carried eight skills through one running case, Nimbus's RoundUp Boost test and a brief detour into its own support team. You classified a metric by who produced it and how soon it is known, combined several metrics into one weighted OEC fixed before a test runs, read a guardrail breach against its own threshold regardless of the OEC, and spotted Goodhart's Law in a scored metric rising next to a worsening outcome. You computed a family-wise error rate across several guardrails tested together, judged whether a fast proxy met the conditions to stand in for a slow true outcome, compared two metrics' sensitivity to the same real lift through their own spread, and saw why a ratio metric needs the delta method's standard error instead of the usual proportion formula.

Section 3 picks up from here, on designing and powering the experiment itself.

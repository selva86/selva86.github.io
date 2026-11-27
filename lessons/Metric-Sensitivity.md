---
title: "Product Metric Design Lesson 7: Metric Sensitivity"
catalog_blurb: "Why a noisier metric needs far more traffic to prove the same real lift."
description: "A grocery app's checkout test needs 10 times more traffic to prove the same lift on revenue per session than on completion rate. See why, with Cohen's d."
keywords: "metric sensitivity, effect size, Cohen's d, statistical power, sample size, power.t.test, A/B testing, variance, standard deviation, product metrics"
post_type: "LESSON"
curriculum_id: "3.20.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "7"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Ratio-Metrics-and-the-Delta-Method.html"
course_prev: "Proxy-Metrics-and-Surrogacy.html"
---

=== step === cover
## Metric Sensitivity

Today let's understand why some metrics can hide a real improvement that another metric would catch easily.

Picture a grocery delivery app's checkout page. The team adds a short delivery-time estimate banner to it and runs an A/B test with 10,000 checkout sessions in each arm, every week.

There are two metrics on the table to judge the banner. Checkout completion rate, the share of sessions that end in an order, is expected to rise from 30% to 31.5%. Revenue per session, the average dollars each session brings in, is expected to rise from $18.60 to $19.53. That $18.60 figure is nothing but 30% of sessions buying, multiplied by a $62 average order.

Both numbers describe the exact same banner, the exact same test, and the exact same 1.5 percentage point rise in completions. So here is the question this lesson answers: why would a team ever throw out the metric the business cares about most, revenue, in favor of one it cares about less, completion rate?

Here is what 10,000 simulated checkout sessions look like under each metric.

![10,000 simulated checkout sessions: completion packed between 0 and 1, revenue per session spread wide and right-skewed.](screenshots/Metric-Sensitivity-cover-histograms.png)

*10,000 simulated checkout sessions: completion packed between 0 and 1, revenue per session spread wide and right-skewed.*

Build that same simulation in R now, and reproduce this picture yourself.

```r
# Simulate 10,000 checkout sessions for each candidate metric, then plot their shapes side by side
set.seed(1)
completion <- rbinom(10000, 1, 0.30)

set.seed(2)
buy <- rbinom(10000, 1, 0.30)
purchase_amount <- rlnorm(10000, meanlog = 3.0354, sdlog = 1.4776)
revenue_session <- ifelse(buy == 1, purchase_amount, 0)

par(mfrow = c(1, 2))
hist(completion, breaks = c(-0.5, 0.5, 1.5), col = "#2563a8",
     main = "Checkout completion", xlab = "0 = no, 1 = yes")
hist(revenue_session, breaks = 60, xlim = c(0, 400), col = "#1f7a55",
     main = "Revenue per session", xlab = "dollars")
```

Completion sits packed tightly between 0 and 1, since every session either finishes or it does not. Revenue per session, though, spreads out much further to the right: most sessions earn nothing, and a handful of large orders stretch the tail past the edge of this chart.

=== step === concept
## How spread out a metric's values are

Every one of those 10,000 simulated sessions is a single data point. To compare the two metrics fairly, you need one number that says how much a typical session's value wanders away from its own average. That number is the standard deviation.

Compute it for both vectors.

```r
# How far each metric's own values spread from session to session
round(sd(completion), 2)
round(sd(revenue_session), 0)
#> [1] 0.46
#> [1] 90
```

Completion's standard deviation comes out to 0.46. That is not a coincidence: a metric that can only take the value 0 or 1 can never spread very far from its own mean, no matter where that mean sits.

Revenue per session's standard deviation comes out to 90, about 200 times larger, even though its own mean, $18.60, is smaller than completion's mean of 0.30. The handful of large orders in the histogram above are doing all of that work. Most sessions sit at 0, but the rare $600 or $3,000 order pulls the spread out a long way.

=== step === concept
## Standardizing the lift: Cohen's d

A 1.5 percentage point rise in completion and a 93 cent rise in revenue per session are not directly comparable sizes, because the two metrics do not vary the same amount from session to session. To compare them fairly, divide each metric's expected lift by its own standard deviation. That ratio has a name: Cohen's d, the size of a change measured in units of that metric's own spread.

Compute d for both metrics.

```r
# Standardize each metric's lift by its own spread: lift divided by standard deviation
delta_completion <- 0.015
d_completion <- delta_completion / 0.46
round(d_completion, 3)
#> [1] 0.033

delta_revenue <- 0.015 * 62
d_revenue <- delta_revenue / 90
round(d_revenue, 3)
#> [1] 0.01
```

Completion rate's expected lift is 1.5 percentage points, which is 0.015 as a fraction, divided by its standard deviation of 0.46, giving d = 0.033.

Revenue per session's expected lift comes from that exact same 1.5 percentage point rise in completion, multiplied through the $62 average order: 0.015 times 62, which is 93 cents. Divide that 93 cents by revenue's own standard deviation of 90, and d comes out to 0.01, about a third the size of completion's d. The same real improvement reads three times smaller once it passes through revenue's noisier lens than when it passes through completion's tighter one.

=== step === widget
## Why small effect sizes need so much more data

A smaller d is not just a smaller number on paper. It changes how many sessions you need to prove it is real. This widget shows that relationship directly: how the sample size a test needs for 80% power changes as the effect size changes.

::widget power-curve {}

Toggle from large (d = 0.8) down to medium (d = 0.5) and down again to small (d = 0.2), and watch the sessions needed for 80% power climb into the hundreds, even at the widget's smallest preset. Each step down roughly quadruples the sessions needed, because power depends on the sample size times d squared, not on d alone.

Now compare that smallest preset, d = 0.2, to this lesson's own numbers. Completion rate's d is 0.033 and revenue per session's d is 0.01, both far smaller than even that widget's smallest preset, which already needs several hundred sessions per arm. Neither of this lesson's two real metrics comes anywhere close to the easy end of this curve.

=== step === quiz
## Quick check: cutting the effect size in half

Two metrics measure the same real change, but metric Y's standardized effect size is half metric X's. How does metric Y's required sample size for the same power compare to metric X's?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- About twice as large, since the sample size scales directly with the effect size. ::no
- About the same. Metric Y just needs to run for more calendar time, not more sessions. ::no
- About four times as large. ::ok Right. Required sample size scales as 1 over d squared, so halving d roughly quadruples the sessions a test needs for the same power, the same pattern the widget above just showed.
- About eight times as large, since effect size works on a cubed scale. ::no Required sample size does not scale directly with d, and it does not scale with d cubed either. It scales as 1 over d squared, so halving d roughly quadruples the sessions needed, not doubles them or multiplies them by eight.

=== step === concept
## The real sample size each metric needs

Cohen's d is useful for comparing metrics side by side, but a team planning an actual test needs a number in sessions, not in standardized units. R's `power.t.test` function takes each metric's own real lift and its own real standard deviation, and returns exactly that.

Run it for both metrics.

```r
# Sample size each metric needs for 80% power, each in its own real units
power.t.test(delta = 0.015, sd = 0.46, power = 0.8)
power.t.test(delta = 0.93, sd = 90, power = 0.8)
#>
#>      Two-sample t test power calculation
#>
#>               n = 14763.83
#>           delta = 0.015
#>              sd = 0.46
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
#>
#>
#>      Two-sample t test power calculation
#>
#>               n = 147014.3
#>           delta = 0.93
#>              sd = 90
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

Read the n in each result as the number of sessions needed in each arm of the test, not the total across both arms. Completion rate's call returns n = 14763.83, so round up to 14,764 sessions per arm. Revenue per session's call returns n = 147014.3, so round up to 147,015 sessions per arm.

Both calls ask for the exact same thing: 80% power, meaning the test correctly detects a real effect 80% of the time it truly exists, at the usual 5% false-alarm rate. The delta argument is each metric's own real expected lift, 0.015 for completion rate and 93 cents for revenue per session. The sd argument is each metric's own real standard deviation. Nothing about which metric the business cares about more enters this calculation at all.

147,015 against 14,764 is almost exactly ten times more sessions, for the exact same underlying improvement in the exact same test. That ten times gap is not a coincidence either. It is what you would expect from completion's d of 0.033 against revenue's d of 0.01, about three times apart, since required sample size scales as 1 over d squared, and three squared is about nine.

=== step === concept
## Turning sample size into calendar time

A sample size on its own does not tell a team whether a test is realistic to run. The team in this example gets 10,000 checkout sessions per arm every week, so divide each metric's required sessions by that weekly rate to see how many weeks each test actually needs.

Compute both.

```r
# Convert each required sample size into calendar time at 10,000 sessions per arm per week
n_completion <- ceiling(power.t.test(delta = 0.015, sd = 0.46, power = 0.8)$n)
n_revenue <- ceiling(power.t.test(delta = 0.93, sd = 90, power = 0.8)$n)
n_completion
n_revenue
#> [1] 14764
#> [1] 147015

round(n_completion / 10000, 1)
round(n_revenue / 10000, 1)
#> [1] 1.5
#> [1] 14.7
```

Completion rate needs about 1.5 weeks of the team's normal traffic to reach 80% power. Revenue per session needs about 14.7 weeks, which is roughly three and a half months.

Most experimentation teams do not keep a single test running for three and a half months. New features queue up behind it, the product keeps changing underneath the test, and the team waiting on an answer has to wait through all of it. So revenue per session is not just slower to prove here. It is impractical to prove at all within any timeline this team would actually tolerate, no matter how long they let it run.

=== step === widget
## Comparing two metrics' practical cost side by side

Seeing 1.5 weeks against 14.7 weeks as numbers is one thing. Seeing them side by side as bars is another.

::widget chart-plotter {"data":[{"x":"Completion rate","y":1.5},{"x":"Revenue per session","y":14.7}],"geoms":["bar"],"x":"metric","y":"weeks"}

Completion rate's bar barely clears the bottom of the chart. Revenue per session's bar stands about ten times taller, the same ratio between 147,015 and 14,764 sessions, just easier to see at a glance.

=== step === quiz
## Quick check: choosing between the two metrics

Between this lesson's completion rate and revenue per session, both showing the same real improvement, which one reaches 80% power on less traffic, and why?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Revenue per session, because it carries more information per session. ::no
- Neither. Sample size depends only on how much traffic you have, not on which metric you choose. ::no
- Completion rate, because its standard deviation is smaller, so the same lift stands out as a larger standardized effect size. ::ok Right. A smaller standard deviation means the same real lift divides into a larger d, and a larger d needs far fewer sessions to reach 80% power. That is the same gap between 14,764 and 147,015 sessions per arm.
- They need the same traffic, because the real underlying change is identical in both cases. ::no Completion rate reaches 80% power on far less traffic, because its own standard deviation is much smaller. A metric with more information per session, or a metric that shares the exact same real underlying change, can still need far more traffic if its own spread is wide enough to swamp that lift. Sample size always depends on the traffic you have and the metric's own standard deviation together.

=== step === tryit
## Your turn: capping revenue's spread

Suppose the team redesigns checkout so that no single order can run away with the total, capping the rare large orders. That redesign cuts revenue per session's standard deviation from 90 to 45, while the 93 cent lift itself stays exactly the same.

Edit the sd argument below from 90 to 45, then read off the new required sessions per arm and the new weeks needed at 10,000 sessions per arm per week.

```r
# Revenue per session's sample size and weeks needed, with its sd argument ready to edit
revenue_power2 <- power.t.test(delta = 0.93, sd = 90, power = 0.8)
n_revenue2 <- ceiling(revenue_power2$n)
n_revenue2

round(n_revenue2 / 10000, 1)
```
::check {"regex": "sd\\s*=\\s*45", "gate": true, "difficulty": "beginner", "ok": "Right: about 36,755 sessions per arm and about 3.7 weeks, down from 147,015 sessions and 14.7 weeks. Halving the standard deviation quarters the required sample, because required n scales as 1 over sd squared for a fixed lift.", "no": "Change only the sd argument in the power.t.test call to 45; leave delta and power as they are."}
::solution
```r
# Revenue per session's power.t.test call with the redesign's smaller standard deviation
revenue_power45 <- power.t.test(delta = 0.93, sd = 45, power = 0.8)
n_revenue45 <- ceiling(revenue_power45$n)
n_revenue45
#> [1] 36755

round(n_revenue45 / 10000, 1)
#> [1] 3.7
```

36,755 sessions per arm, about 3.7 weeks at this team's traffic, down from 147,015 sessions and 14.7 weeks. The lift never changed. Only the metric's own standard deviation did, and that alone was enough to turn an impractical fourteen and a half week test into one the team could comfortably run inside a month.

=== step === concept
## References
::prose-only the references are text, not a visual

- Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Lawrence Erlbaum Associates. The source of the small, medium and large d = 0.2, 0.5 and 0.8 convention this lesson's sample-size widget uses.
- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. Standard reference on sample size, power and metric sensitivity in industry A/B testing.
- Deng, A., Xu, Y., Kohavi, R., and Walker, T. (2013). [Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data](https://doi.org/10.1145/2433396.2433413). WSDM 2013. Introduces CUPED, a technique that uses pre-experiment data to reduce a metric's own standard deviation and so make it more sensitive to a real effect.
- R Core Team. [power.t.test documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html), base R stats package. The function used throughout this lesson to turn a lift, a standard deviation and a target power into a required sample size.

=== step === complete
## Before you adopt a metric, check whether it can be powered

Only adopt a metric for a test once you have checked whether its own spread lets it detect the lift that actually matters, inside the traffic and time you actually have. To recap:

- Completion rate's standard deviation came out to 0.46, tiny because every session is just a 0 or a 1. Revenue per session's standard deviation came out to 90, about 200 times larger, driven entirely by a handful of large orders.
- The same 1.5 percentage point lift standardizes to d = 0.033 for completion rate and d = 0.01 for revenue per session, about three times smaller once it passes through the noisier metric.
- `power.t.test` turned those d's into real sessions: about 14,764 per arm for completion rate against about 147,015 for revenue per session, roughly ten times more, for the exact same underlying improvement.
- At this team's traffic of 10,000 sessions per arm per week, that is 1.5 weeks against 14.7 weeks, the difference between a test that finishes next week and one that would run for three and a half months.

None of that gap depended on which metric the business cared about more. It depended only on each metric's own variance, and that is the question to ask before adopting any metric: not whether it matters, but whether it can be measured in the time you actually have.

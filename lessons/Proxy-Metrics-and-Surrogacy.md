---
title: "Product Metric Design Lesson 6: Proxy Metrics and Surrogacy"
catalog_blurb: "When a fast proxy metric is safe to trust, and when it quietly breaks."
description: "CTR correlates with 90-day retention at r = 0.582, but a test that lifted CTR 14.73 points barely moved retention at all. Learn Prentice's four surrogacy conditions."
keywords: "proxy metrics, surrogate endpoints, Prentice's criteria, A/B testing, CTR, 90-day retention, surrogate index, correlation vs causation, product metrics, metric validity"
post_type: "LESSON"
curriculum_id: "3.20.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "6"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Metric-Sensitivity.html"
course_prev: "Multiple-Testing-Across-Metrics.html"
---

=== step === cover
## Proxy Metrics and Surrogacy

Today let's understand when a fast stand-in metric can be trusted to speak for a slow, important outcome, and when it can't.

Picture a streaming app's recommendations team. They have built a new recommendation algorithm and want to know if it improves 90-day retention, the share of viewers still watching three months later. The trouble is that 90-day retention takes 90 days to measure, and the team cannot wait that long before deciding whether to ship.

So instead, they look at a faster stand-in: day-1 click-through rate (CTR), the share of recommended videos a viewer clicks on their very first day. Day-1 CTR is readable the morning after a test starts, long before any 90-day retention number exists.

Before trusting that stand-in, it helps to see how the two numbers have moved together in the past, across 4,000 users who used the app before this new algorithm ever existed.

::widget chart-plotter {"data":[{"x":45.3,"y":38.1},{"x":16.7,"y":16.9},{"x":31.8,"y":13.4},{"x":40.6,"y":36},{"x":18.9,"y":17.2},{"x":20.7,"y":28.9},{"x":50.4,"y":32.2},{"x":20.1,"y":18.6},{"x":62.1,"y":41.4},{"x":21.1,"y":9.7},{"x":38.7,"y":48.5},{"x":55.6,"y":42.8},{"x":11.2,"y":20},{"x":24.6,"y":20.4},{"x":31.7,"y":21.9},{"x":42.2,"y":20},{"x":12,"y":27.7},{"x":5.7,"y":-1},{"x":11.5,"y":-4},{"x":39.8,"y":46.1},{"x":11.2,"y":25.7},{"x":-4.5,"y":7.8},{"x":12.6,"y":23.5},{"x":47,"y":48.5},{"x":57.8,"y":42.9},{"x":36.6,"y":40.9},{"x":29.5,"y":27.1},{"x":16.2,"y":5.2},{"x":31.1,"y":40.7},{"x":14.4,"y":4.1},{"x":37.6,"y":42},{"x":41.2,"y":12.1},{"x":25.8,"y":44.9},{"x":30.2,"y":31.8},{"x":31.2,"y":13.3},{"x":8.5,"y":4.4},{"x":12.5,"y":6.9},{"x":24.9,"y":16.7},{"x":-1.9,"y":-6.4},{"x":19.1,"y":20.3},{"x":34.8,"y":17.9},{"x":12.5,"y":31.4},{"x":37.6,"y":40.7},{"x":21.4,"y":22.9},{"x":35.2,"y":13.3},{"x":39.3,"y":32.9},{"x":10.1,"y":13.8},{"x":50.3,"y":62.6},{"x":24,"y":21.7},{"x":39.6,"y":37.8},{"x":20.9,"y":35.4},{"x":34,"y":25.3},{"x":53.4,"y":53.9},{"x":34.7,"y":28.8},{"x":14.9,"y":7.2},{"x":36.5,"y":50.1},{"x":27,"y":28.4},{"x":21.6,"y":23.3},{"x":-1.6,"y":10.4},{"x":39.3,"y":32.6},{"x":22.6,"y":9.2},{"x":19.1,"y":29.5},{"x":18.2,"y":15.6},{"x":35.6,"y":36.7},{"x":15.7,"y":-4},{"x":37.8,"y":42.7},{"x":36.6,"y":12.4},{"x":35.9,"y":23.3},{"x":44.8,"y":15.4},{"x":48.2,"y":38.8},{"x":13.9,"y":2.7},{"x":18.1,"y":8.4},{"x":28,"y":6},{"x":24.6,"y":28.5},{"x":11,"y":15.3},{"x":49.8,"y":19.5},{"x":41.5,"y":25.4},{"x":43.2,"y":12.2},{"x":13.5,"y":30.7},{"x":11.7,"y":9.1},{"x":51.7,"y":34.4},{"x":31.6,"y":35.1},{"x":35.8,"y":35.7},{"x":27,"y":31.1},{"x":14.2,"y":4.5},{"x":51.4,"y":15.4},{"x":31.3,"y":15.1},{"x":9.2,"y":21.4},{"x":46.9,"y":30.8},{"x":34.4,"y":42.4},{"x":47,"y":45.4},{"x":35.1,"y":15.8},{"x":51.3,"y":35.7},{"x":30.9,"y":38.7},{"x":4.5,"y":14.1},{"x":23.2,"y":18.9},{"x":11.3,"y":30.5},{"x":8.7,"y":8.5},{"x":40.8,"y":19.3},{"x":34.1,"y":17.1},{"x":35.1,"y":36.7},{"x":40.1,"y":54.3},{"x":24.1,"y":18.8},{"x":54.1,"y":40.7},{"x":28,"y":30},{"x":17.1,"y":10.4},{"x":25.9,"y":6.9},{"x":34.1,"y":39.5},{"x":43.3,"y":25.7},{"x":9.5,"y":36.3},{"x":23.4,"y":24.6},{"x":37.8,"y":36},{"x":28.4,"y":45.8},{"x":26.8,"y":32.4},{"x":-2.8,"y":-2.6},{"x":22.8,"y":16.8},{"x":6.6,"y":11.8},{"x":62.6,"y":44.2},{"x":5.7,"y":20.8},{"x":20.1,"y":29.5},{"x":13.4,"y":25.5},{"x":27,"y":20.4},{"x":18.8,"y":20.9},{"x":11,"y":19.7},{"x":28.4,"y":40.1},{"x":19.2,"y":22.2},{"x":14.3,"y":15.1},{"x":10.6,"y":-5.9},{"x":7.2,"y":22.4},{"x":30.9,"y":39.1},{"x":44.7,"y":29.1},{"x":27,"y":24.4},{"x":17.2,"y":31.5},{"x":54,"y":26.3},{"x":51.6,"y":55.3},{"x":18.6,"y":-0.4},{"x":27.6,"y":28.1},{"x":37.5,"y":42.7},{"x":17.8,"y":24.7},{"x":21.7,"y":25.6},{"x":17.8,"y":25.1},{"x":23.6,"y":8.6},{"x":13.8,"y":17.1},{"x":33,"y":22.9},{"x":18.2,"y":-2.8},{"x":50.3,"y":39.2},{"x":32.5,"y":22.8},{"x":25,"y":14.5},{"x":41.5,"y":44.4},{"x":19.5,"y":0.4}],"geoms":["point"],"x":"ctr","y":"retention"}

Each dot above is one of those users: day-1 CTR on the X axis, 90-day retention on the Y axis. The dots climb from lower left to upper right, so a user with a higher CTR tends to also have higher retention. That climbing pattern is the historical relationship this lesson is going to test against one real experiment.

=== step === concept
## Why use a proxy metric instead of waiting?

A product team deciding whether to ship a change usually has to decide within days or weeks, not months. Leaving a test running longer than necessary has its own cost, since engineers are waiting on the answer before moving to the next thing.

90-day retention cannot give that fast answer. By definition, it needs 90 days of waiting before the number even exists, no matter how large the test is.

Day-1 CTR does not have that problem. Every viewer's first day has already happened by the next morning, so the recommendations team can read day-1 CTR long before any 90-day retention number is ready.

That is the whole reason a proxy metric exists: a metric that is quick to measure, used in place of a true outcome metric that takes too long to measure directly, while that true outcome is still unknown. But being quick to measure does not, on its own, make a proxy trustworthy.

=== step === concept
## Which metric correlates best with the true outcome?

The recommendations team did not pick day-1 CTR out of habit. Before settling on it, they checked three early candidates against 90-day retention, using the same 4,000 historical users as the chart above: day-1 CTR, day-1 session count (how many times a user opened the app on day one), and day-1 likes (how many recommended videos a user liked on day one).

For each candidate, compute its Pearson correlation coefficient with 90-day retention: a single number between -1 and 1 that says how closely two things moved together historically. The closer that number sits to 1, the more consistently a high value on one metric came with a high value on the other.

Here is that computation for all three candidates, run against the historical sample.

```r
# Simulate the historical sample, then correlate each early candidate with 90-day retention
set.seed(42)
n <- 4000
interest <- rnorm(n, 50, 20)              # each user's underlying interest level
ctr <- 0.60 * interest + rnorm(n, 0, 8)
sessions <- 0.30 * interest + rnorm(n, 0, 14)
likes <- 0.12 * interest + rnorm(n, 0, 18)
retention <- 0.50 * interest + rnorm(n, 0, 10)

round(cor(ctr, retention), 3)
#> [1] 0.582
round(cor(sessions, retention), 3)
#> [1] 0.286
round(cor(likes, retention), 3)
#> [1] 0.088
```

Day-1 CTR correlates with 90-day retention at 0.582, session count at 0.286, and likes at only 0.088. The same comparison, laid out as a grid, makes the gap between the three even easier to read.

::widget correlation-heatmap {"vars":["ctr","sessions","likes","retention"],"matrix":[[1,0.348,0.106,0.582],[0.348,1,0.055,0.286],[0.106,0.055,1,0.088],[0.582,0.286,0.088,1]]}

Read the bottom row, against retention. CTR is, by a wide margin, the strongest of the three candidates historically, which is exactly why the team picked it as their proxy.

But notice what that correlation can and cannot tell you. It says CTR and retention moved together across those 4,000 historical users, under whatever mix of changes produced that data in the past. It says nothing yet about what happens to retention when you deliberately change CTR with one specific treatment, like a new algorithm. A correlation measured across many different users over time is not the same thing as a guarantee about what one particular change will do.

=== step === concept
## The four conditions that make a proxy a valid surrogate

A strong historical correlation, like CTR's 0.582 with retention, is a good reason to try a proxy. It is not, by itself, a reason to trust it for every treatment you might test. Statisticians have a precise name for a proxy whose validity has actually been checked: a surrogate.

A proxy metric becomes a valid surrogate for a specific treatment only when four conditions all hold together. These are called Prentice's criteria, after the statistician who first set them out formally.

1. The treatment moves the proxy. Whatever change you are testing, a new algorithm, a new page, a new feature, has to actually move the proxy metric. If the treatment leaves CTR unchanged, CTR cannot tell you anything about the treatment's effect on anything else.
2. The treatment moves the true outcome. The treatment also has to actually move the outcome you really care about, in this case 90-day retention. If retention never moves either way, there is nothing for the proxy to stand in for.
3. The proxy and the true outcome are related. There has to be some real relationship between the proxy and the true outcome, the kind of thing a correlation like 0.582 is evidence for.
4. The treatment's whole effect on the true outcome runs through the proxy. This is the strict one. It says the only way this particular treatment can reach the true outcome is by moving the proxy first. If the treatment reaches retention through some other route that has nothing to do with CTR, the proxy will move, the treatment will work, and the proxy will still have told you the wrong story about why it worked.

Conditions 1 to 3 are checkable with ordinary data: a test here, a correlation there. Condition 4 is the hardest one, because it is a claim about every possible route a treatment's effect could take, not just the ones the historical data happened to capture. A historical correlation, no matter how strong, can never rule out a new route opening up.

=== step === widget
## What the test did to the proxy metric

The recommendations team ran an A/B test on the new algorithm. Half of a fresh batch of users kept seeing the old recommendations, the control group, and half saw the new algorithm's recommendations, the treatment group. Start by checking the first of Prentice's four conditions: did the treatment actually move the proxy, day-1 CTR?

Here is each group's mean day-1 CTR, with an error bar showing one standard error either side of each mean.

::widget chart-plotter {"data":[{"x":"Control","y":29.84},{"x":"Treatment","y":44.58}],"geoms":["bar"],"x":"group","y":"ctr","code":{"bar":"df$se <- c(0.33, 0.33)\nggplot(df, aes(group, ctr)) +\n  geom_col(fill = \"#2563a8\") +\n  geom_errorbar(aes(ymin = ctr - se, ymax = ctr + se), width = 0.2)"}}

Control sits at 29.84, treatment at 44.58. That gap looks real on the chart, but a chart alone is not something you can act on, so run the actual test.

```r
# Simulate the A/B test's day-1 CTR by group, then test the difference between means
set.seed(42)
n <- 4000
group <- rep(c("control", "treatment"), each = n / 2)
interest2 <- rnorm(n, 50, 20)
ctr_ab <- 0.60 * interest2 + rnorm(n, 0, 8) + ifelse(group == "treatment", 15, 0)

t.test(ctr_ab[group == "treatment"], ctr_ab[group == "control"])
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  ctr_ab[group == "treatment"] and ctr_ab[group == "control"]
#> t = 31.906, df = 3997.7, p-value < 2.2e-16
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  13.82873 15.63950
#> sample estimates:
#> mean of x mean of y 
#>  44.57598  29.84186 
```

Read `mean of x` as the treatment group's mean and `mean of y` as the control group's mean, since that is the order they were passed into `t.test()`. The gap is 44.58 minus 29.84, which is 14.73 points. The p-value is reported as p-value < 2.2e-16, far below any usual threshold, so this is not a result you would expect to see by chance if the algorithm did nothing to CTR.

That answers condition 1 clearly. The treatment moved the proxy, by a large and statistically significant amount.

=== step === widget
## What the test did to the true outcome

CTR moved. Now check condition 2 directly: did the treatment move the true outcome, 90-day retention, without using the proxy as a go-between at all?

::widget chart-plotter {"data":[{"x":"Control","y":24.87},{"x":"Treatment","y":24.71}],"geoms":["bar"],"x":"group","y":"retention","code":{"bar":"df$se <- c(0.32, 0.32)\nggplot(df, aes(group, retention)) +\n  geom_col(fill = \"#1f7a55\") +\n  geom_errorbar(aes(ymin = retention - se, ymax = retention + se), width = 0.2)"}}

Control sits at 24.87, treatment at 24.71, nearly flat and, if anything, slightly lower for the treatment group. Run the same kind of test on retention to see whether that gap is real.

```r
# Simulate the same A/B test's 90-day retention by group, then test the difference between means
retention_ab <- 0.50 * interest2 + rnorm(n, 0, 10)

t.test(retention_ab[group == "treatment"], retention_ab[group == "control"])
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  retention_ab[group == "treatment"] and retention_ab[group == "control"]
#> t = -0.34687, df = 3997.6, p-value = 0.7287
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -1.0447534  0.7306429
#> sample estimates:
#> mean of x mean of y 
#>  24.70912  24.86617 
```

The gap is 24.71 minus 24.87, which is -0.16 points. But look at the 95 percent confidence interval: it runs from -1.04 to 0.73. That range includes zero, which means a gap of exactly zero, no effect on retention at all, is still a perfectly plausible explanation for what was measured here. The p-value backs that up: 0.7287, nowhere near low enough to rule out pure chance.

Condition 2 is the one that fails to get clear support from this test. The treatment moved the proxy with no ambiguity at all, but it did not show a convincing move in the true outcome retention was built to measure.

=== step === quiz
## Quick check: did the true outcome really move?

The new algorithm's effect on 90-day retention came out at -0.16, with a 95 percent confidence interval running from -1.04 to 0.73. What does that result actually show about whether the algorithm moved retention at all?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The effect is -0.16, so retention did move, just by a smaller amount than CTR did, in the opposite direction. ::no
- The confidence interval runs from -1.04 to 0.73, which crosses zero, so this test gives no evidence that retention moved at all. ::ok Right. A confidence interval that crosses zero means a true effect of exactly zero is still consistent with what was measured. The point estimate alone, -0.16, is not enough to call that a real movement.
- Retention is naturally a noisier metric than CTR, which is why its test came back weaker. ::no
- The p-value of 0.7287 means there is a 73% chance the algorithm truly has no effect on retention. ::no None of those readings hold up. A point estimate alone does not prove a real effect once the interval around it crosses zero. Retention is not being singled out as "noisier" here, the same kind of test was used for both metrics, and this one simply failed to clear the bar. And a p-value never states the probability that a hypothesis is true, it states how often a result this extreme would turn up if the treatment truly did nothing.

=== step === concept
## Why the historical relationship overpredicted the actual lift

CTR moved by a clear, large, significant amount. Retention's own test gave no clear evidence of a real move.

If CTR is a valid surrogate for retention under this treatment, those two results should roughly agree once you account for the historical relationship between them. Do they?

The historical sample already showed that retention tends to rise by about 0.5642 points for every one-point rise in CTR, the slope of the regression line relating the two. Apply that same slope to the 14.73-point CTR shift this test actually produced, and see what it would naively predict for retention.

```r
# Compute the historical slope relating CTR to retention, then project what that CTR shift alone would predict for retention
hist_slope <- unname(coef(lm(retention ~ ctr))[2])
round(hist_slope, 4)
#> [1] 0.5642

ctr_shift <- mean(ctr_ab[group == "treatment"]) - mean(ctr_ab[group == "control"])
round(ctr_shift, 2)
#> [1] 14.73

projected <- hist_slope * ctr_shift
round(projected, 2)
#> [1] 8.31
```

The historical relationship projects an 8.31-point lift in retention from a CTR shift this size. Compare that to what the test actually measured.

```r
# Compare the naive projection against the retention shift actually measured in the test
actual <- mean(retention_ab[group == "treatment"]) - mean(retention_ab[group == "control"])
round(actual, 2)
#> [1] -0.16

round(projected / actual, 1)
#> [1] -52.9
```

8.31 points projected, -0.16 points actually measured, not even in the same direction. The ratio comes out to about -52.9, a sign this is not a muted version of the historical prediction, it is a different outcome entirely.

This is condition 4 failing in front of you. Conditions 1 and 3 both held: the treatment clearly moved the proxy, and the proxy is genuinely related to the true outcome historically. What broke is condition 4, the requirement that the treatment's whole effect on retention run through CTR.

The historical 0.5642 slope was built from users who, on their own, both clicked more and retained more, probably because they were simply more interested in the app to begin with. The new algorithm's CTR gain did not come from making users more interested. It came instead from flashier thumbnails that earned more clicks on day one, a channel that has nothing to do with the shared driver the historical slope was measuring.

So the proxy moved for a reason the historical relationship never captured, and the projection built on that relationship missed badly.

=== step === concept
## What to check before you trust a proxy
::prose-only a practical checklist grounded in the running example, not a new visual

That gap between an 8.31-point projection and a measured effect of -0.16 is exactly the kind of mistake a team wants to catch before shipping on a proxy result alone. Two checks make that easier.

First, re-check the proxy's slope against the true outcome every so often on past launches, rather than trusting one old correlation forever. The relationship between CTR and retention measured years ago, under whatever mix of changes produced that data, is not guaranteed to still describe how users behave today.

Second, treat an unusually large proxy move with suspicion, especially one caused by a change that does not touch the content itself. A flashier thumbnail, a brighter button, or a louder notification can move a click-through metric a great deal without changing anything about whether the user actually wants to keep using the product. When a proxy moves that much, that fast, from a change like that, it is a reason to wait for the true outcome before deciding, not a reason to celebrate early.

=== step === quiz
## Quick check: spotting an invalid surrogate

Try this on a new case. A checkout redesign lifts a proxy metric that has a strong historical correlation, r = 0.6, against 90-day repeat purchase. Before calling this redesign a long-term win, what should the team check?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Nothing more is needed. A historical correlation of 0.6 is already strong evidence that the long-term win is real. ::no
- Check whether 90-day repeat purchase itself moved in this test, since a strong historical correlation does not guarantee that this particular redesign's effect runs through the same channel the correlation was built on. ::ok Right. A 0.6 historical correlation satisfies condition 3, that the proxy and the true outcome are related, but it says nothing about condition 4 for this specific redesign. Only checking 90-day repeat purchase directly can confirm the redesign's effect actually reaches it.
- Collect more historical data on the proxy to push the correlation even higher before deciding. ::no
- Switch to a different proxy metric that has an even higher historical correlation with repeat purchase. ::no A higher correlation, old or new, is still a historical number about how two metrics moved together in the past. It cannot tell you whether this specific redesign's effect on the proxy runs through the same channel as 90-day repeat purchase. The only way to know is to check whether repeat purchase itself moved.

=== step === tryit
## Your turn: project the true outcome from the proxy

Try the same projection on a different number. Suppose a second A/B test, on an unrelated feature, lifted day-1 CTR by 20 points. Using the historical slope of 0.5642, write the line that computes what that CTR shift alone would naively project for retention. Then compare it to the 0.8-point retention shift this second test actually measured.

```r
# hist_slope is the historical slope relating CTR to retention: 0.5642
hist_slope <- 0.5642

# This second test lifted day-1 CTR by 20 points
ctr_shift <- 20

# Its actual measured retention shift came in at 0.8 points
actual_shift <- 0.8

# Your line: compute the naive projected retention shift from the proxy's shift
# Then divide your projection into the actual shift to see how many times smaller it is
# Two lines. Press Check when you have them.
```
::check {"regex": "projected\\s*<-\\s*(hist_slope\\s*[*]\\s*ctr_shift|ctr_shift\\s*[*]\\s*hist_slope)", "gate": true, "difficulty": "beginner", "ok": "Right: about 11.28 projected against 0.8 actual, the projection is about 14 times too large, the same kind of gap the lesson's own test showed.", "no": "Write one line: projected <- hist_slope * ctr_shift. Then divide projected into actual_shift to see the ratio."}
::solution
```r
# Project the retention shift the historical slope alone would predict, then compare to what was actually measured
projected <- hist_slope * ctr_shift
round(projected, 2)
#> [1] 11.28

round(projected / actual_shift, 1)
#> [1] 14.1
```

The naive projection comes out to 11.28 points. The actual measured shift was 0.8, so the projection overshoots by a factor of about 14. Whatever caused this second test's CTR lift, it likely moved CTR through a channel that has nothing to do with the shared driver the historical slope was built on, the same pattern as the lesson's own algorithm test.

=== step === concept
## References
::prose-only the references are text, not a visual

- Prentice, R. L. (1989). [Surrogate Endpoints in Clinical Trials: Definition and Operational Criteria](https://doi.org/10.1002/sim.4780080407). Statistics in Medicine, 8(4), 431 to 440. The paper that set out the four conditions this lesson teaches.
- Freedman, L. S., Graubard, B. I., and Schatzkin, A. (1992). [Statistical Validation of Intermediate Endpoints for Chronic Diseases](https://doi.org/10.1002/sim.4780110204). Statistics in Medicine, 11(2), 167 to 178. A formal statistical test built on Prentice's conditions.
- Athey, S., Chetty, R., Imbens, G., and Kang, H. (2019). [The Surrogate Index: Combining Short-Term Proxies to Estimate Long-Term Treatment Effects More Rapidly and Precisely](https://www.nber.org/papers/w26463). NBER Working Paper No. 26463. On combining several short-term proxies into one index when a single proxy is not enough.
- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. On choosing and validating metrics for online experiments.

=== step === complete
## From a correlated proxy to a validated surrogate

A proxy metric earns the name surrogate only once its effect on the true outcome has actually been checked for a given treatment, not from a historical correlation alone, however strong. To recap:

- Day-1 CTR correlated with 90-day retention at 0.582 historically, far ahead of session count at 0.286 and likes at 0.088. That made it the strongest candidate, and nothing more.
- A valid surrogate needs all four of Prentice's conditions: the treatment moves the proxy, the treatment moves the true outcome, the proxy and the true outcome are related, and the treatment's whole effect on the true outcome runs through the proxy.
- The new algorithm clearly moved CTR, by 14.73 points, but retention's own test gave no clear evidence of a real move, with a 95 percent confidence interval crossing zero.
- The historical slope projected an 8.31-point retention lift from that CTR move. The actual measured shift was -0.16, not even in the same direction, because the algorithm's flashier thumbnails moved CTR through a channel the historical correlation never captured.

So a strong correlation gets a proxy a seat at the table. Only a direct check on the true outcome, for this specific treatment, earns it the right to speak for that outcome on its own. The next lesson asks a different question about a metric: whether it is even sensitive enough to detect an effect at all, correlated with anything or not.

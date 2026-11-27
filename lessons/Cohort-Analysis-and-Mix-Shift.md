---
title: "Product Sense and Metric Diagnosis Lesson 4: Cohort Analysis and Mix Shift"
catalog_blurb: "How to tell a mix shift from a real drop in any cohort table."
description: "Thornfield's blended retention falls from 44% to 26% while both channels hold steady. Learn to spot a mix shift and tell it apart from a real drop in R."
keywords: "cohort analysis, mix shift, retention rate, weighted average, segment analysis, product metrics, composition effect, product data science, cohort retention in R"
post_type: "LESSON"
curriculum_id: "3.10.4"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "4"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
course_next: "Opportunity-Sizing.html"
course_prev: "Funnel-Decomposition.html"
---

=== step === cover
## Cohort Analysis and Mix Shift

Today let's understand why one blended number can fall even when nothing inside it has actually gotten worse.

Thornfield is a daily habit tracking app. Every month it signs up 1,000 new users, and tracks what share of them are still active 30 days later, its Month-1 retention rate. Over the last four months, that rate has fallen: 44.0%, then 38.0%, then 32.0%, then 26.0%.

Dev, Thornfield's Head of Growth, asks Reiko, a product analyst, to find out why. Did the people who signed up each month actually get worse at sticking around, or is something else behind the fall?

To answer that, this lesson works through one method, in four parts.

::widget process-flow {"steps":[{"title":"The rate inside each cohort","sub":"whether any group actually behaves differently"},{"title":"The mix between cohorts","sub":"how much of the total each group makes up"},{"title":"The blended rate","sub":"the one number computed from both"},{"title":"Mix shift or a real change","sub":"which of the two is actually moving"}]}

Each one gets checked in turn, using Thornfield's own numbers.

=== step === concept
## Thornfield's retention, falling every month

Dev's question is a fair one. For four months running, Thornfield's Month-1 retention rate has gone down, and he wants to know whether the app is actually losing people faster than before.

Here is exactly what that rate is made of. Each of the four months, Thornfield signs up 1,000 new users. Of each month's 1,000 signups, the number still active 30 days later has come in at 440, then 380, then 320, then 260.

Divide each month's retained users by that month's 1,000 signups, and you get the rate everyone has been watching: 44.0%, 38.0%, 32.0%, 26.0%.

So the fall itself is not in question. What is still open is why it is happening. Maybe the people signing up each month are genuinely less likely to stick around than before. Or maybe who is signing up is changing, and that alone is enough to pull the blended rate down.

=== step === concept
## Why one blended number needs two checks
::prose-only the channel split that separates the two checks appears as a table in the next step; this step only names what to look for

A cohort is everyone who signed up in the same period. In Thornfield's case, everyone who joined in the same calendar month is one cohort, so each of its four months is its own cohort of 1,000 new users.

Month-1 retention is the share of a cohort still active 30 days after they signed up. It is a single percentage, computed once a month, and it is the number Dev has been watching fall.

But a single percentage like that can hide two very different things. One is whether a cohort's own rate of staying active has actually changed, the real behavior of the people inside it. The other is how much of that month's total signups came from each group in the first place, its share of the mix.

A blended rate can move because the first thing changed, because the second thing changed, or because both did at once. Telling them apart means checking each one on its own, split by where each month's users came from.

=== step === widget
## Reading retention by channel, month by month

Thornfield's signups come from two channels: Organic, people who find the app on their own, and Paid Social, people who arrive through a paid social ad. Each month, every one of the 1,000 signups falls into exactly one of these two groups.

Splitting Thornfield's four months by channel shows each channel's own signups, its own retained users, and the Month-1 retention rate that comes from dividing one by the other.

::widget styled-table {"cols":["Month","Organic signups","Organic retained","Organic rate","Paid Social signups","Paid Social retained","Paid Social rate"],"rows":[[1,800,400,0.5,200,40,0.2],[2,600,300,0.5,400,80,0.2],[3,400,200,0.5,600,120,0.2],[4,200,100,0.5,800,160,0.2]],"formats":{"Organic rate":"pct","Paid Social rate":"pct"},"title":"Thornfield Month-1 retention by channel","note":"Neither channel changes its own rate across the four months."}

Look at the two rate columns. Organic's own retention rate stays at 50% in every single month, and Paid Social's own rate stays at 20% in every single month. Neither channel's own behavior has changed at all.

That rules out the first of the two things a blended rate can hide. Whatever is pulling Thornfield's overall rate down from 44.0% to 26.0%, it is not that Organic users or Paid Social users individually became less likely to stick around.

=== step === concept
## The mix behind the headline: how signups split by channel

Since neither channel's own rate moved, the fall has to be coming from somewhere else: how much of each month's 1,000 signups came from each channel in the first place.

The code below builds Thornfield's four months of raw counts and computes each month's Paid Social share of the total signups.

```r
# Build Thornfield's four months of raw channel counts and find Paid Social's signup share
thornfield <- data.frame(
  month = 1:4,
  organic_signups = c(800, 600, 400, 200),
  organic_retained = c(400, 300, 200, 100),
  paid_signups = c(200, 400, 600, 800),
  paid_retained = c(40, 80, 120, 160)
)

total_signups <- thornfield$organic_signups + thornfield$paid_signups
paid_share <- thornfield$paid_signups / total_signups
organic_share <- thornfield$organic_signups / total_signups

round(paid_share * 100, 1)
#> [1] 20 40 60 80
round(organic_share * 100, 1)
#> [1] 80 60 40 20
```

`paid_share` is Paid Social's signups divided by that month's total signups, and `organic_share` is the same thing for Organic. Paid Social starts at 20% of signups in month 1 and climbs to 80% by month 4, while Organic falls from 80% down to 20% over the same four months.

This is what a mix shift is: a change in the composition of a month's signups, not in how any one channel's users behave. Thornfield is not retaining Paid Social users worse than before. It is simply getting a lot more of its signups from the channel that was always the weaker one.

=== step === widget
## Watching the mix shift and the blended rate move together

Here are all three rates together across the four months: Organic's flat 50%, Paid Social's flat 20%, and the blended rate that Dev has been watching fall.

::widget chart-plotter {"data":[{"x":1,"y":50,"fill":"Organic"},{"x":2,"y":50,"fill":"Organic"},{"x":3,"y":50,"fill":"Organic"},{"x":4,"y":50,"fill":"Organic"},{"x":1,"y":20,"fill":"Paid Social"},{"x":2,"y":20,"fill":"Paid Social"},{"x":3,"y":20,"fill":"Paid Social"},{"x":4,"y":20,"fill":"Paid Social"},{"x":1,"y":44,"fill":"Blended"},{"x":2,"y":38,"fill":"Blended"},{"x":3,"y":32,"fill":"Blended"},{"x":4,"y":26,"fill":"Blended"}],"geoms":["line","point"],"x":"month","y":"retention pct"}

Organic's line runs flat across the top, at 50. Paid Social's line runs flat along the bottom, at 20. The blended line starts closer to Organic's line in month 1, then drifts steadily down toward Paid Social's line by month 4.

That drift is not Paid Social or Organic changing. It is the blended line being pulled toward whichever line currently carries more weight. In month 1, Organic supplied 80% of the signups, so the blended rate sat close to Organic's own rate. By month 4, Paid Social supplied 80% of the signups, so the blended rate sat close to Paid Social's own rate instead.

=== step === quiz
## Quick check: what actually changed at Thornfield

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Both Organic and Paid Social users became less likely to stick around. ::no
- Paid Social's own retention rate fell as its share of signups grew. ::no
- The share of signups coming from Paid Social, whose own rate was always lower, grew from 20% to 80%, while neither channel's own rate moved. ::ok Right. Organic held steady at 50% and Paid Social held steady at 20% in every one of the four months. What moved was the mix: Paid Social supplied 20% of signups in month 1 and 80% by month 4, and since its own rate was always the lower of the two, shifting more signups onto it pulled the blended rate down too.
- Thornfield's product got worse for everyone who signed up, no matter which channel brought them in. ::no Not quite. Both channels held their own rate steady across all four months, as the table above showed, and the chart showed the blended line sitting between those two flat, unmoving lines the whole time. What changed was the mix: Paid Social, the channel with the lower rate, made up a growing share of each month's signups, and that shift alone was enough to pull the blended rate down.

=== step === concept
## The blended rate is a weighted average

There is a simple formula behind everything the chart just showed. The blended rate is Organic's share of signups times Organic's own rate, plus Paid Social's share of signups times Paid Social's own rate.

The code below applies that formula directly, using the shares already computed and the two rates pinned at their real, unchanging values, 50% for Organic and 20% for Paid Social.

```r
# Reproduce the blended rate from the weighted average formula, with both rates pinned
organic_rate <- 0.50
paid_rate <- 0.20

blended_check <- organic_share * organic_rate + paid_share * paid_rate
round(blended_check * 100, 1)
#> [1] 44 38 32 26

blended_actual <- (thornfield$organic_retained + thornfield$paid_retained) / total_signups
round(blended_actual * 100, 1)
#> [1] 44 38 32 26
```

`blended_check` uses only the shares and the two fixed rates, nothing from the actual retained counts. `blended_actual` computes the same rate directly from the raw retained counts recorded each month. The two match exactly, month by month.

That match is the whole mechanism in one line of code. With `organic_rate` and `paid_rate` held fixed, the only thing left that can move `blended_check` is `organic_share` and `paid_share`, Thornfield's changing mix. Nothing in the formula leaves room for either channel's own behavior to be the explanation.

=== step === quiz
## Quick check: Varro's drop, mix shift or something real

Varro is a budgeting app. Over three months, its blended Month-1 retention rate fell from 37.5% to 34.5% to 31.5%. Here is the same breakdown by channel that ruled out a real change at Thornfield, this time for Varro's two channels, Referral and Paid Search.

| Month | Referral share | Referral rate | Paid Search share | Paid Search rate | Blended rate |
|---|---|---|---|---|---|
| 1 | 50% | 45.0% | 50% | 30.0% | 37.5% |
| 2 | 50% | 45.0% | 50% | 24.0% | 34.5% |
| 3 | 50% | 45.0% | 50% | 18.0% | 31.5% |

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Varro's fall is a mix shift, the same kind as Thornfield's, since a blended rate fell in both cases. ::no
- Varro's fall is a real drop inside Paid Search. Both channels' shares stay pinned at 50% every month, so the only thing that changed was Paid Search's own rate, falling from 30.0% to 18.0%. ::ok Right. Unlike Thornfield, the mix at Varro never moved: Referral and Paid Search each supplied exactly half of signups in all three months. With the shares pinned, the only thing left that could pull the blended rate down is a channel's own rate, and Paid Search's fell from 30.0% to 18.0% while Referral's stayed at 45.0%.
- Both Referral and Paid Search got worse at retaining users. ::no
- There is not enough information here to tell a mix shift apart from a real drop. ::no Look at the shares first, not the rates. Referral and Paid Search each hold exactly 50% of signups in every one of the three months, so the mix never shifts. With the shares pinned like that, a falling blended rate has only one place left to come from: a real fall in one channel's own rate, and that is Paid Search's, down from 30.0% to 18.0%.

=== step === tryit
## Your turn: confirm it in R

Varro's three months of raw signup and retention counts, by channel, are below. Run the block to see three of the four numbers already computed: each channel's share of signups, and Referral's own retention rate.

```r
# Varro's three months of raw signup and retention counts by channel
varro <- data.frame(
  month = 1:3,
  referral_signups = c(500, 500, 500),
  referral_retained = c(225, 225, 225),
  paid_search_signups = c(500, 500, 500),
  paid_search_retained = c(150, 120, 90)
)

varro_total <- varro$referral_signups + varro$paid_search_signups

referral_share <- varro$referral_signups / varro_total
paid_search_share <- varro$paid_search_signups / varro_total
referral_rate <- varro$referral_retained / varro$referral_signups

round(referral_share * 100, 1)
#> [1] 50 50 50
round(paid_search_share * 100, 1)
#> [1] 50 50 50
round(referral_rate * 100, 1)
#> [1] 45 45 45

paid_search_rate <- NA
round(paid_search_rate * 100, 1)
#> [1] NA
```

Both shares are already confirmed at 50% a month, pinned the entire time, and Referral's own rate is confirmed flat at 45.0%. The one quantity still missing is Paid Search's own rate.

Replace the `NA` with the same kind of division used for `referral_rate`: Paid Search's retained users divided by its own signups. Then press Check.

::check {"regex": "paid_search_rate\\s*<-\\s*varro\\$paid_search_retained\\s*/\\s*varro\\$paid_search_signups", "gate": true, "difficulty": "intermediate", "ok": "Right. Paid Search's own rate falls from 30.0% to 24.0% to 18.0%, the only one of the four quantities that moved. With both shares pinned at 50%, that fall by itself is enough to explain why Varro's blended rate fell too.", "no": "Divide Paid Search's own retained counts by its own signups, the same way referral_rate was built: paid_search_rate <- varro$paid_search_retained / varro$paid_search_signups."}
::solution
```r
# Varro's three months of raw signup and retention counts by channel
varro <- data.frame(
  month = 1:3,
  referral_signups = c(500, 500, 500),
  referral_retained = c(225, 225, 225),
  paid_search_signups = c(500, 500, 500),
  paid_search_retained = c(150, 120, 90)
)

varro_total <- varro$referral_signups + varro$paid_search_signups

referral_share <- varro$referral_signups / varro_total
paid_search_share <- varro$paid_search_signups / varro_total
referral_rate <- varro$referral_retained / varro$referral_signups

round(referral_share * 100, 1)
#> [1] 50 50 50
round(paid_search_share * 100, 1)
#> [1] 50 50 50
round(referral_rate * 100, 1)
#> [1] 45 45 45

paid_search_rate <- varro$paid_search_retained / varro$paid_search_signups
round(paid_search_rate * 100, 1)
#> [1] 30 24 18
```

Paid Search's own rate falls from 30.0% in month 1 to 24.0% in month 2 to 18.0% in month 3, while its share of signups never leaves 50%. That is the opposite pattern from Thornfield: here the mix stayed fixed, and a channel's own behavior is exactly what moved.

=== step === concept
## References
::prose-only the references are text, not a visual

- Simpson, E. H. (1951). [The Interpretation of Interaction in Contingency Tables](https://doi.org/10.1111/j.2517-6161.1951.tb00088.x). Journal of the Royal Statistical Society, Series B. The original result behind a population average moving when the mix between subgroups shifts, even though no subgroup's own rate changes.
- Mixpanel documentation, [Retention report](https://docs.mixpanel.com/docs/reports/retention). How a product analytics tool builds and reads a cohort retention table.
- Amplitude documentation, [Build your first cohort](https://amplitude.com/docs/en/quick-guides/build-your-first-cohort). Splitting a user base into cohorts by signup period and acquisition channel.
- Croll, A. and Yoskovitz, B. (2013). [Lean Analytics](https://www.oreilly.com/library/view/lean-analytics/9781098168179/). O'Reilly Media. The chapter on segmenting a metric before trusting its aggregate trend.

=== step === complete
## Quick recap

Thornfield's blended Month-1 retention fell from 44.0% to 26.0% across four months, and neither of its two channels was the cause. Organic held steady at 50% and Paid Social held steady at 20% in every one of those months. What moved was the mix: Paid Social's share of signups grew from 20% to 80%, and since its own rate was always the lower of the two, shifting more weight onto it pulled the blended rate down with it.

Varro showed the opposite pattern. Its two channels, Referral and Paid Search, kept an even 50% share of signups every month, so the mix never shifted. The real mover there was Paid Search's own rate, falling from 30.0% to 18.0% while Referral stayed fixed at 45.0%.

Together, those two cases are the test. Whenever a blended rate moves, check each segment's own rate first, then check its share of the total. If the rates hold steady and only the shares move, it is a mix shift. If the shares hold steady and a rate moves, it is a real change inside that segment.

The next lesson in this course looks at how to size the ceiling on a feature's impact before it is even built.

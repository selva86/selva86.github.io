---
title: "Causal Inference from Data Lesson 3: Propensity scores and inverse probability weights"
catalog_blurb: "Weighting by a propensity score to recover the effect a naive comparison overstates."
description: "A gym offers a free trainer session to members who already visit more, so a raw comparison is unfair. See how weighting by a propensity score fixes it."
keywords: "propensity score, inverse probability weighting, IPW, covariate balance, standardized mean difference, confounding, causal inference, R"
post_type: "LESSON"
curriculum_id: "4.130.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "3"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Matching-and-What-It-Throws-Away"
course_prev: "Drawing-the-Assumptions-You-Cannot-Test"
---

=== step === cover
## Propensity scores and inverse probability weights

Today let's look at what happens when a business hands out an offer unevenly, and work out how to still get a fair read on whether that offer worked.

Meridian Fitness has 300 new members. In each member's first month, the gym recorded how many times they visited: that's month1_visits. Then, leaning toward the members who had already visited more, Meridian offered some of them a free one-on-one trainer session. Four months later, the gym recorded month4_visits: how many times that same member visited in month 4.

Here are 7 of those 300 members, chosen to span the full range of month-1 visits.

::widget styled-table {"cols": ["member", "month1_visits", "offered", "month4_visits"], "rows": [[35, 1, 0, 12.4], [43, 3, 0, 10.3], [6, 7, 1, 15.7], [30, 10, 0, 13.9], [23, 14, 1, 18.7], [235, 15, 1, 18.5], [288, 2, 1, 11.1]], "title": "Meridian Fitness: who got offered the trainer session", "note": "7 of the 300 Meridian Fitness members, spanning the range of month-1 visits."}

Look at month1_visits next to offered. There is a clear lean: the members who visited 14 or 15 times both got the offer, and the members who visited only once or three times both did not. But it is not a strict rule. Member 288 visited only twice, yet got the offer anyway.

So before the session ever happened, were these members already different from each other, just based on how often they used to show up?

=== step === concept
## Why comparing the two groups directly is unfair

The 7 spotlight members hinted at something: members who visited more in month 1 were also more likely to get offered the session. That same month1_visits also affects how much a member visits in month 4, offer or no offer, since people who show up a lot tend to keep showing up. A variable like this, one that affects both who receives a treatment and the outcome you are trying to measure, is called a confounder. Comparing offered members to not-offered members directly mixes the session's real effect together with this confounder's effect, and there is no way to tell how much of the gap is which.

Let's build the full 300-member dataset and compute that naive gap for real.

```r
# Build the 300-member data and compute the naive gap in month4_visits
set.seed(42)
n <- 300
month1_visits <- pmin(rpois(n, 7), 20)
offered <- rbinom(n, 1, plogis(-2.5 + 0.3 * month1_visits))
month4_visits <- 10 + 3 * offered + 0.4 * month1_visits + rnorm(n, 0, 2)
members <- data.frame(member = seq_len(n), month1_visits, offered, month4_visits)

naive_gap <- mean(members$month4_visits[members$offered == 1]) -
  mean(members$month4_visits[members$offered == 0])
round(naive_gap, 2)
#> [1] 3.65
```

rpois(n, 7) draws 300 random counts that scatter around a typical value of 7, one for each member's month-1 visits, and pmin(..., 20) caps that count at 20 so nobody's number looks impossible. Then rbinom(n, 1, p) flips a weighted coin for each member to decide offered, 1 or 0, where the chance of landing on 1 is plogis(-2.5 + 0.3 * month1_visits), a formula that climbs the more a member already visited.

month4_visits is then built directly from a formula: 10, plus 3 if the member was offered, plus 0.4 times month1_visits, plus some random noise from rnorm(n, 0, 2) standing in for everything else that nudges a visit count up or down. Because we built it ourselves, we know the session's true effect is exactly 3, the number we used to generate the data. In the real world you would never know that true number. Here, knowing it lets us check whether a method's estimate actually lands close to it.

That naive gap comes out to 3.65, not 3. It overstates the session's real effect, because the members who got offered were already the kind of members who visited more, even before the session happened.

=== step === concept
## The propensity score: a fitted probability of being offered

The propensity score is exactly what it sounds like: the probability that a given member was offered the session, based only on what you know about them before the offer. For Meridian, that information is just month1_visits, so the propensity score here is P(offered given month1_visits). We do not know this probability. We have to estimate it from the data, the same way we estimate anything else.

A logistic regression does exactly that: it fits a model that always outputs a number between 0 and 1, which you can read as a probability. In R, you fit one with glm() and family = binomial.

Let's fit it on all 300 members and see what it estimates.

```r
# Fit the propensity score: a model of who gets offered, based on month1_visits
fit <- glm(offered ~ month1_visits, data = members, family = binomial)
round(coef(fit), 4)
#>   (Intercept) month1_visits 
#>       -3.2531        0.4019 
```

Those two numbers feed into one formula, the same plogis() we used to build the data a moment ago: ps_hat = plogis(-3.2531 + 0.4019 * month1_visits). The more a member visited in month 1, the higher that probability climbs toward 1.

Notice these numbers, -3.2531 and 0.4019, are close to but not the same as the -2.5 and 0.3 we used to generate offered in the first place. With just 300 members, the model cannot recover the exact formula; it only estimates one from the data it has. That is exactly the situation you are in with real data: you never know the true formula, only the model's best estimate of it.

fitted(fit) reads that probability straight off the model, for every one of the 300 members. Let's add it to our spotlight table and see what it gives each of our 7 members.

```r
# Add the fitted propensity score to the spotlight table
members$ps_hat <- fitted(fit)

spot <- members[match(c(35, 43, 6, 30, 23, 235, 288), members$member), ]
rownames(spot) <- NULL
spot$ps_hat <- round(spot$ps_hat, 3)
spot$month4_visits <- round(spot$month4_visits, 1)
spot[, c("member", "month1_visits", "offered", "month4_visits", "ps_hat")]
#>   member month1_visits offered month4_visits ps_hat
#> 1     35             1       0          12.4  0.055
#> 2     43             3       0          10.3  0.114
#> 3      6             7       1          15.7  0.392
#> 4     30            10       0          13.9  0.683
#> 5     23            14       1          18.7  0.915
#> 6    235            15       1          18.5  0.941
#> 7    288             2       1          11.1  0.079
```

Member 35 visited once and was not offered; the model gives them a propensity of 0.055, a 5.5% chance. Member 30 visited 10 times and was also not offered, despite a propensity of 0.683, a 68.3% chance, which is exactly the kind of thing that happens when an offer leans on a probability rather than a fixed rule. And member 288 is the one worth watching closely: with only 2 visits, their estimated chance of being offered was just 7.9%. But they were offered anyway.

=== step === concept
## Turning a propensity score into a weight

A propensity score alone does not fix anything. It has to become a weight first.

The rule is simple: weight = 1 / ps_hat if the member was offered, and weight = 1 / (1 - ps_hat) if they were not. Either way, you are dividing by the chance of the thing that actually happened to that member.

A member who looked very likely to be offered, and was, gets a weight close to 1, since that was already the likely outcome. A member who looked very unlikely to be offered, and was offered anyway, gets a large weight, because that one member now has to stand in for every other member who looked just as unlikely but was not offered.

Let's add that weight to the spotlight table.

```r
# Add each spotlight member's inverse-probability weight
ps_hat_precise <- members$ps_hat[match(spot$member, members$member)]
spot$weight <- ifelse(spot$offered == 1, 1 / ps_hat_precise, 1 / (1 - ps_hat_precise))
spot$weight <- round(spot$weight, 2)
spot[, c("member", "month1_visits", "offered", "month4_visits", "ps_hat", "weight")]
#>   member month1_visits offered month4_visits ps_hat weight
#> 1     35             1       0          12.4  0.055   1.06
#> 2     43             3       0          10.3  0.114   1.13
#> 3      6             7       1          15.7  0.392   2.55
#> 4     30            10       0          13.9  0.683   3.15
#> 5     23            14       1          18.7  0.915   1.09
#> 6    235            15       1          18.5  0.941   1.06
#> 7    288             2       1          11.1  0.079  12.58
```

Member 35's weight is 1.06, barely above 1, since someone with 1 visit was already unlikely to be offered, so little needs correcting. Member 288's weight is 12.58, by far the largest in the table. A member with only 2 visits had an estimated chance under 8% of being offered; since they were offered anyway, weighting makes their outcome count for about twelve and a half members like them, to make up for how rare that combination was.

=== step === concept
## The weighted estimate lands closer to the truth

Weighting is not just a spotlight-table trick. Apply it to every one of the 300 members, and the comparison between offered and not-offered members changes.

Let's weight all 300 members and compute the weighted version of the gap.

```r
# Weight every one of the 300 members and recompute the gap between the groups
members$weight <- ifelse(members$offered == 1, 1 / members$ps_hat, 1 / (1 - members$ps_hat))

weighted_estimate <- mean(members$offered * members$month4_visits * members$weight) -
  mean((1 - members$offered) * members$month4_visits * members$weight)

round(c(naive = naive_gap, weighted = weighted_estimate, true_effect = 3), 2)
#>       naive    weighted true_effect 
#>        3.65        2.92        3.00 
```

The first half of that calculation multiplies every offered member's month4_visits by their own weight, then averages across all 300 members; the not-offered members contribute 0 to this half, since multiplying by offered zeroes them out. The second half does the same for the not-offered members, using their weight instead. Subtracting the two gives the weighted estimate: 2.92.

Why does this land closer to 3, the true effect? Weighting up a rare combination, like member 288's, and weighting down a common one reshapes the crowd: it makes month1_visits spread out the same way among offered members as it does among not-offered members. Statisticians call this reshaped version of the data a pseudo-population, the same 300 members, just counted different amounts, so that the one thing that used to differ between the groups no longer does.

Once month1_visits is balanced between the two groups, whatever gap remains between them is no longer explained by month1_visits. The naive gap was 3.65. The weighted gap is 2.92, much closer to the true effect of 3, because weighting removed most, though not all, of the confounding month1_visits was causing.

=== step === quiz
## Quick check: what the inverse-probability weight is doing

Before moving on, check what you would say the weighting actually did.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The weight tells you how much extra effect the session had for that one member. ::no
- Weighting makes month1_visits spread out similarly in both groups, so the comparison is no longer confounded by it. ::ok Exactly. The weight never changes a member's own outcome. It changes how much each member counts, enough to make month1_visits line up between the two groups, which is what removes its influence on the comparison.
- Weighting proves the session has no effect by itself. ::no Weighting does not prove anything about whether the session worked. It only removes one specific source of bias, from month1_visits, from the comparison that follows next.

=== step === widget
## Checking covariate balance before and after weighting

So far we have watched one number, the estimate, move from 3.65 to 2.92. But there is a more direct way to check whether the weighting actually did its job: look at whether month1_visits itself is now balanced between the two groups. The number for that is called the standardized mean difference, or SMD: the gap between the two groups' averages on a variable, divided by how spread out that variable typically is.

A rule of thumb many practitioners use is that an SMD under 0.1 counts as good balance.

Let's compute the SMD on month1_visits, before and after weighting.

```r
# Check whether weighting balanced month1_visits between the two groups
smd <- function(x, g, w = NULL) {
  if (is.null(w)) {
    m1 <- mean(x[g == 1]); m0 <- mean(x[g == 0])
  } else {
    m1 <- sum(x[g == 1] * w[g == 1]) / sum(w[g == 1])
    m0 <- sum(x[g == 0] * w[g == 0]) / sum(w[g == 0])
  }
  v1 <- var(x[g == 1]); v0 <- var(x[g == 0])
  (m1 - m0) / sqrt((v1 + v0) / 2)
}

smd_before <- smd(members$month1_visits, members$offered)
smd_after  <- smd(members$month1_visits, members$offered, members$weight)
round(c(before = smd_before, after = smd_after), 2)
#> before  after 
#>   0.97   0.01 
```

Before weighting, the two groups differ by 0.97 standard deviations on month1_visits, nearly a full standard deviation apart, and nowhere close to the 0.1 rule of thumb. After weighting, that gap shrinks to 0.01. On month1_visits at least, the weighted comparison now looks as if the two groups had been split at random.

Here is the same idea shown a different way, on a different, simulated population, using matching instead of weighting to do the rebalancing.

::widget matching-overlap {}

This widget builds 600 of its own units, fits its own propensity score, and matches each treated unit to the untreated unit with the closest score, rather than weighting every unit the way we did. Switch between Before matching and After matching, and watch its two histograms move from piled up at opposite ends to lined up on top of each other. Its own standardized mean difference drops from 0.74 to 0.01, the same kind of drop our own weighting produced on month1_visits. In this widget, treated plays the part of our offered members, and control plays not-offered.

=== step === widget
## Why a propensity near zero or one is dangerous

Member 288's weight of 12.58 was not a one-off curiosity. It points at a real danger in this method: a propensity score close to 0 or close to 1 can create a weight large enough to run the whole estimate by itself.

Let's see exactly how much one member's weight can move the final number.

```r
# See how extreme one member's weight is, and how much it moves the estimate
round(c(mean_weight = mean(members$weight), median_weight = median(members$weight)), 2)
#>   mean_weight median_weight 
#>          2.00          1.64 

extreme <- members[members$month1_visits == 2 & members$offered == 1, ]
extreme$ps_hat <- round(extreme$ps_hat, 3)
extreme$weight <- round(extreme$weight, 2)
extreme[, c("member", "ps_hat", "weight")]
#>     member ps_hat weight
#> 288    288  0.079  12.58

members_dropped <- members[members$member != 288, ]
estimate_dropped <- mean(members_dropped$offered * members_dropped$month4_visits * members_dropped$weight) -
  mean((1 - members_dropped$offered) * members_dropped$month4_visits * members_dropped$weight)

round(c(with_member_288 = weighted_estimate, without_member_288 = estimate_dropped), 2)
#>    with_member_288 without_member_288 
#>               2.92               2.47 
```

The average weight across all 300 members is 2.00, and the typical, or median, weight is 1.64. Member 288's weight of 12.58 is six to eight times that, by far the largest in the data. Drop that single member from the 300, recompute the same weighted estimate on the remaining 299, and it moves from 2.92 to 2.47, a swing of 0.45 from just one member.

Here is every one of the 300 members plotted by their own ps_hat and weight.

::widget chart-plotter {"data": [{"x":0.763,"y":1.31},{"x":0.763,"y":1.31},{"x":0.224,"y":1.29},{"x":0.59,"y":1.69},{"x":0.491,"y":2.04},{"x":0.392,"y":2.55},{"x":0.59,"y":1.69},{"x":0.162,"y":1.19},{"x":0.491,"y":1.96},{"x":0.491,"y":1.96},{"x":0.392,"y":1.64},{"x":0.491,"y":2.04},{"x":0.763,"y":1.31},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.763,"y":4.22},{"x":0.878,"y":1.14},{"x":0.162,"y":1.19},{"x":0.392,"y":2.55},{"x":0.392,"y":2.55},{"x":0.763,"y":1.31},{"x":0.162,"y":1.19},{"x":0.915,"y":1.09},{"x":0.828,"y":1.21},{"x":0.162,"y":1.19},{"x":0.392,"y":2.55},{"x":0.301,"y":1.43},{"x":0.763,"y":4.22},{"x":0.301,"y":3.32},{"x":0.683,"y":3.15},{"x":0.59,"y":2.44},{"x":0.59,"y":1.69},{"x":0.301,"y":1.43},{"x":0.491,"y":1.96},{"x":0.055,"y":1.06},{"x":0.683,"y":1.46},{"x":0.079,"y":1.09},{"x":0.224,"y":1.29},{"x":0.763,"y":4.22},{"x":0.491,"y":1.96},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.114,"y":1.13},{"x":0.878,"y":1.14},{"x":0.301,"y":1.43},{"x":0.828,"y":1.21},{"x":0.683,"y":3.15},{"x":0.491,"y":1.96},{"x":0.828,"y":5.81},{"x":0.491,"y":2.04},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.59,"y":1.69},{"x":0.114,"y":1.13},{"x":0.59,"y":1.69},{"x":0.491,"y":2.04},{"x":0.162,"y":6.18},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.491,"y":2.04},{"x":0.878,"y":1.14},{"x":0.59,"y":1.69},{"x":0.392,"y":2.55},{"x":0.683,"y":3.15},{"x":0.224,"y":1.29},{"x":0.224,"y":1.29},{"x":0.59,"y":2.44},{"x":0.491,"y":1.96},{"x":0.224,"y":1.29},{"x":0.114,"y":1.13},{"x":0.162,"y":1.19},{"x":0.224,"y":4.47},{"x":0.392,"y":1.64},{"x":0.224,"y":1.29},{"x":0.491,"y":2.04},{"x":0.079,"y":1.09},{"x":0.301,"y":1.43},{"x":0.392,"y":1.64},{"x":0.055,"y":1.06},{"x":0.392,"y":1.64},{"x":0.162,"y":1.19},{"x":0.301,"y":1.43},{"x":0.491,"y":1.96},{"x":0.59,"y":2.44},{"x":0.392,"y":2.55},{"x":0.224,"y":1.29},{"x":0.162,"y":6.18},{"x":0.162,"y":1.19},{"x":0.301,"y":1.43},{"x":0.491,"y":2.04},{"x":0.037,"y":1.04},{"x":0.224,"y":1.29},{"x":0.763,"y":1.31},{"x":0.763,"y":4.22},{"x":0.59,"y":1.69},{"x":0.301,"y":3.32},{"x":0.392,"y":2.55},{"x":0.59,"y":2.44},{"x":0.491,"y":1.96},{"x":0.491,"y":1.96},{"x":0.224,"y":1.29},{"x":0.224,"y":1.29},{"x":0.301,"y":1.43},{"x":0.763,"y":4.22},{"x":0.828,"y":1.21},{"x":0.59,"y":2.44},{"x":0.59,"y":1.69},{"x":0.392,"y":1.64},{"x":0.055,"y":1.06},{"x":0.491,"y":1.96},{"x":0.683,"y":1.46},{"x":0.59,"y":1.69},{"x":0.392,"y":2.55},{"x":0.392,"y":1.64},{"x":0.392,"y":1.64},{"x":0.055,"y":1.06},{"x":0.301,"y":3.32},{"x":0.491,"y":1.96},{"x":0.59,"y":1.69},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.392,"y":2.55},{"x":0.392,"y":2.55},{"x":0.491,"y":2.04},{"x":0.301,"y":1.43},{"x":0.763,"y":1.31},{"x":0.828,"y":1.21},{"x":0.224,"y":1.29},{"x":0.491,"y":1.96},{"x":0.763,"y":1.31},{"x":0.491,"y":2.04},{"x":0.491,"y":1.96},{"x":0.763,"y":1.31},{"x":0.683,"y":3.15},{"x":0.392,"y":1.64},{"x":0.59,"y":1.69},{"x":0.162,"y":1.19},{"x":0.59,"y":1.69},{"x":0.491,"y":1.96},{"x":0.162,"y":1.19},{"x":0.114,"y":8.75},{"x":0.392,"y":1.64},{"x":0.59,"y":2.44},{"x":0.59,"y":1.69},{"x":0.59,"y":1.69},{"x":0.162,"y":1.19},{"x":0.763,"y":4.22},{"x":0.224,"y":1.29},{"x":0.162,"y":1.19},{"x":0.491,"y":1.96},{"x":0.301,"y":1.43},{"x":0.59,"y":2.44},{"x":0.301,"y":1.43},{"x":0.491,"y":1.96},{"x":0.59,"y":1.69},{"x":0.224,"y":1.29},{"x":0.079,"y":1.09},{"x":0.162,"y":6.18},{"x":0.491,"y":2.04},{"x":0.763,"y":1.31},{"x":0.392,"y":1.64},{"x":0.491,"y":2.04},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.301,"y":1.43},{"x":0.162,"y":1.19},{"x":0.224,"y":4.47},{"x":0.59,"y":1.69},{"x":0.301,"y":1.43},{"x":0.301,"y":3.32},{"x":0.392,"y":2.55},{"x":0.301,"y":1.43},{"x":0.162,"y":1.19},{"x":0.59,"y":2.44},{"x":0.392,"y":2.55},{"x":0.59,"y":1.69},{"x":0.59,"y":2.44},{"x":0.763,"y":1.31},{"x":0.683,"y":1.46},{"x":0.301,"y":3.32},{"x":0.224,"y":1.29},{"x":0.59,"y":2.44},{"x":0.59,"y":1.69},{"x":0.763,"y":4.22},{"x":0.59,"y":1.69},{"x":0.162,"y":1.19},{"x":0.224,"y":1.29},{"x":0.224,"y":4.47},{"x":0.59,"y":1.69},{"x":0.162,"y":6.18},{"x":0.162,"y":1.19},{"x":0.114,"y":1.13},{"x":0.114,"y":1.13},{"x":0.392,"y":2.55},{"x":0.162,"y":1.19},{"x":0.59,"y":1.69},{"x":0.59,"y":1.69},{"x":0.683,"y":1.46},{"x":0.392,"y":1.64},{"x":0.683,"y":1.46},{"x":0.301,"y":3.32},{"x":0.162,"y":1.19},{"x":0.301,"y":3.32},{"x":0.828,"y":1.21},{"x":0.392,"y":1.64},{"x":0.224,"y":4.47},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.491,"y":2.04},{"x":0.301,"y":1.43},{"x":0.114,"y":1.13},{"x":0.392,"y":1.64},{"x":0.683,"y":1.46},{"x":0.392,"y":1.64},{"x":0.301,"y":1.43},{"x":0.392,"y":1.64},{"x":0.683,"y":1.46},{"x":0.392,"y":2.55},{"x":0.162,"y":6.18},{"x":0.392,"y":2.55},{"x":0.828,"y":1.21},{"x":0.301,"y":1.43},{"x":0.59,"y":2.44},{"x":0.301,"y":1.43},{"x":0.224,"y":4.47},{"x":0.114,"y":1.13},{"x":0.224,"y":1.29},{"x":0.301,"y":3.32},{"x":0.162,"y":1.19},{"x":0.301,"y":3.32},{"x":0.079,"y":1.09},{"x":0.941,"y":1.06},{"x":0.59,"y":1.69},{"x":0.162,"y":1.19},{"x":0.683,"y":1.46},{"x":0.392,"y":1.64},{"x":0.301,"y":1.43},{"x":0.114,"y":1.13},{"x":0.392,"y":2.55},{"x":0.114,"y":1.13},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.392,"y":2.55},{"x":0.162,"y":1.19},{"x":0.162,"y":1.19},{"x":0.392,"y":1.64},{"x":0.763,"y":1.31},{"x":0.301,"y":3.32},{"x":0.224,"y":1.29},{"x":0.224,"y":1.29},{"x":0.392,"y":1.64},{"x":0.079,"y":1.09},{"x":0.59,"y":1.69},{"x":0.162,"y":6.18},{"x":0.392,"y":1.64},{"x":0.392,"y":2.55},{"x":0.491,"y":2.04},{"x":0.491,"y":2.04},{"x":0.162,"y":1.19},{"x":0.301,"y":1.43},{"x":0.763,"y":1.31},{"x":0.392,"y":1.64},{"x":0.162,"y":1.19},{"x":0.683,"y":3.15},{"x":0.224,"y":1.29},{"x":0.763,"y":1.31},{"x":0.683,"y":3.15},{"x":0.162,"y":1.19},{"x":0.59,"y":1.69},{"x":0.392,"y":2.55},{"x":0.162,"y":1.19},{"x":0.683,"y":1.46},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.301,"y":1.43},{"x":0.392,"y":2.55},{"x":0.301,"y":1.43},{"x":0.392,"y":1.64},{"x":0.114,"y":8.75},{"x":0.224,"y":1.29},{"x":0.878,"y":1.14},{"x":0.301,"y":1.43},{"x":0.162,"y":1.19},{"x":0.392,"y":2.55},{"x":0.079,"y":12.58},{"x":0.301,"y":1.43},{"x":0.114,"y":1.13},{"x":0.683,"y":1.46},{"x":0.59,"y":2.44},{"x":0.301,"y":1.43},{"x":0.301,"y":3.32},{"x":0.301,"y":3.32},{"x":0.162,"y":1.19},{"x":0.59,"y":1.69},{"x":0.491,"y":1.96},{"x":0.162,"y":1.19},{"x":0.114,"y":1.13}], "geoms": ["point", "histogram"], "x": "ps_hat", "y": "weight"}

Switch to the point view and look for the one point sitting far above all the others, up near weight 12.58, at ps_hat 0.079. That is member 288. Switch to the histogram, and you can see why propensity scores near 0 or 1 are rare to begin with: most of the 300 members sit somewhere in the comfortable middle, and only a handful sit out near either edge. The members out at the edges are exactly the ones whose weight can run away, so a careful weighted analysis always checks for them before trusting the final number.

=== step === quiz
## Quick check: reading balance and spotting an unstable weight

One more check, connecting the last two steps.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A balanced SMD guarantees the weighted estimate is exactly right. ::no
- A weight of 12.58 just means that member visited the gym a lot. ::no A weight is not a measurement of how much someone visited. It is a correction for how rare their combination of month1_visits and offered status was, and a large one is a warning sign about stability, not a fact about their behavior.
- An SMD near 0 shows the groups are balanced on average, but a single weight like 12.58 can still make the estimate unstable. ::ok Right. Balance and stability are two different questions. The SMD check says the groups now look alike on month1_visits on average, but it says nothing about whether one member's weight is large enough to swing the estimate by itself, which is exactly what member 288's weight can do.

=== step === tryit
## Your turn: compute a member's propensity weight

Try this yourself on a brand new member, one who was never part of the 300: 5 visits in month 1, and offered the session.

```r
# A new member, not one of the 300: 5 visits in month 1, who WAS offered
# the trainer session.
new_member_month1_visits <- 5

# Use fit's coefficients, coef(fit), to compute this member's ps_hat with
# plogis(), then their inverse-probability weight, 1 / ps_hat.
# Two lines. Press Check when you have them.
```
::check {"regex": "plogis[(][\\s\\S]*new_member_month1_visits[\\s\\S]*1\\s*/\\s*", "gate": true, "difficulty": "intermediate", "ok": "Right: a propensity of about 0.224 and a weight of about 4.47. Elevated above the typical 1 to 3, since a 5-visit member had just over a 1-in-5 estimated chance of being offered, but nowhere near as extreme as member 288's 12.58.", "no": "Compute ps_hat with plogis(coef(fit)[1] + coef(fit)[2] * new_member_month1_visits), then divide 1 by that to get the weight."}
::solution
```r
# Compute the new member's propensity score, then their inverse-probability weight
ps_hat_new <- plogis(unname(coef(fit)[1]) + unname(coef(fit)[2]) * new_member_month1_visits)
weight_new <- 1 / ps_hat_new
round(c(ps_hat = ps_hat_new, weight = weight_new), 3)
#>  ps_hat  weight 
#>   0.224   4.467 
```

=== step === concept
## References
::prose-only the sources are text, not a visual

- [The central role of the propensity score in observational studies for causal effects](https://doi.org/10.1093/biomet/70.1.41) - Rosenbaum, P.R., Rubin, D.B. (1983), Biometrika, 70(1), 41-55. The paper that introduced the propensity score and its balancing property.
- [Marginal structural models and causal inference in epidemiology](https://doi.org/10.1097/00001648-200009000-00011) - Robins, J.M., Hernan, M.A., Brumback, B. (2000), Epidemiology, 11(5), 550-560. The paper behind the inverse probability weighting used in this lesson.
- [An introduction to propensity score methods for reducing the effects of confounding in observational studies](https://doi.org/10.1080/00273171.2011.568786) - Austin, P.C. (2011), Multivariate Behavioral Research, 46(3), 399-424. A practical guide to fitting, weighting and checking balance with the standardized mean difference.
- [Causal Inference: What If](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - Hernan, M.A., Robins, J.M. (2020), Chapman and Hall/CRC. A free, rigorous text covering propensity scores and weighting in full.

=== step === complete
## What you can now ask of any weighted or matched estimate

Here is Meridian's honest answer. The trainer session raises month-4 visits by about 3, not the naive 3.65, once the comparison is reweighted so that month1_visits no longer differs between the offered and not-offered members.

But a weighted estimate is only as trustworthy as two checks you ran along the way. Did the covariate balance actually improve, the way the standardized mean difference showed it did here, dropping from 0.97 to 0.01? And is any single member's weight, like member 288's 12.58, large enough to be quietly running the result by itself?

Ask both questions of any weighted or matched estimate you come across, including your own, before you trust the number it hands back.

Next: matching, which answers the same confounding problem by throwing away the units that cannot be matched, instead of reweighting all of them.

---
title: "Causal Inference from Data Lesson 4: Matching and what it throws away"
catalog_blurb: "What a matched estimate gains over a naive comparison, and what it leaves out."
description: "A reminder goes to Fernview's less-engaged users, so a direct comparison is unfair. See how pairing each user with its closest match fixes it, and the cost."
keywords: "nearest-neighbour matching, caliper matching, matching with replacement, confounding, covariate balance, standardized mean difference, causal inference, R"
post_type: "LESSON"
curriculum_id: "4.130.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "4"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Difference-in-Differences-and-Its-One-Assumption"
course_prev: "Propensity-Scores-and-Inverse-Probability-Weights"
---

=== step === cover
## Matching and what it throws away

Today let's look at what happens when you compare two groups by pairing each one up with its closest match, instead of fitting a model over everyone, and see exactly what that pairing leaves out.

Fernview runs a free tier with 200 users. In each user's first week, Fernview recorded how many times they opened the app: that's sessions_week1. Then, leaning toward the users who had fewer sessions in week 1, Fernview sent some of them a re-engagement reminder. Three weeks later, Fernview recorded sessions_week4: how many times that same user opened the app in week 4.

Here are 7 of those 200 users, chosen to span the full range of week-1 sessions.

::widget styled-table {"cols": ["user", "sessions_week1", "reminder", "sessions_week4"], "rows": [[24, 1, 1, 9.57], [35, 2, 0, 8.39], [3, 2, 1, 5.49], [44, 3, 1, 10.34], [2, 9, 0, 10.04], [42, 10, 1, 12.82], [116, 13, 0, 13.20]], "title": "Fernview: who got the reminder", "note": "7 of the 200 Fernview users, spanning the range of week-1 sessions."}

Look at sessions_week1 next to reminder. Users 24 and 3, who had only 1 and 2 sessions in week 1, both got the reminder. User 116, who already had 13 sessions, did not. But it is not a strict rule: user 42 had 10 sessions in week 1, well above average, and still got the reminder.

So before the reminder ever landed, were these users already different from each other, just based on how much they were already using the app?

=== step === concept
## Why comparing reminder users to everyone else is unfair

The 7 spotlight users hinted at something: users with fewer sessions in week 1 were also more likely to get the reminder. That same sessions_week1 also affects sessions_week4 on its own, since a user who already opens the app a lot in week 1 tends to keep opening it, reminder or not. A variable like this, one that affects both who receives a treatment and the outcome you are trying to measure, is called a confounder. Comparing reminder users to non-reminder users directly mixes the reminder's real effect together with this confounder's effect, and there is no way to tell how much of the gap is which.

This is simulated data, so the real effect of the reminder on sessions_week4 is known by construction: 2 sessions. A real dataset would never hand you that number. Matching is one way to recover it as closely as possible, without knowing it in advance.

Let's build the full 200-user dataset and compute the naive gap for real.

```r
# Build Fernview's 200 free-tier users and compute the naive before/after gap
set.seed(43)
n <- 200
sessions_week1 <- pmin(rpois(n, 6), 16)
reminder <- rbinom(n, 1, plogis(3.2 - 0.7 * sessions_week1))
sessions_week4 <- round(5 + 2 * reminder + 0.5 * sessions_week1 + rnorm(n, 0, 1.5), 2)
users <- data.frame(user = 1:n, sessions_week1, reminder, sessions_week4)

table(users$reminder)
#> 
#>   0   1 
#> 127  73 

naive_gap <- mean(users$sessions_week4[users$reminder == 1]) -
  mean(users$sessions_week4[users$reminder == 0])
round(naive_gap, 2)
#> [1] 0.53
```

`pmin(rpois(n, 6), 16)` draws a session count for each user from a Poisson distribution centred on 6, capped at 16 so no single user runs away with an implausible count. `plogis()` turns the expression inside it into a probability between 0 and 1, so reminder is a coin flip whose odds shift with sessions_week1: a user with fewer sessions in week 1 gets a higher chance of the reminder. `table(users$reminder)` confirms the split: 127 users with no reminder, 73 with one.

The naive gap, the plain difference in sessions_week4 between the 73 reminder users and the 127 non-reminder users, comes out to 0.53. That badly understates the true effect of 2. sessions_week1 pulls in two directions at once here: it lowers the chance a user gets the reminder, since Fernview already targets the less-engaged users, but it raises sessions_week4 on its own, since an engaged user in week 1 tends to stay engaged. Part of the real +2 effect gets cancelled out by the groups' pre-existing difference in sessions_week1.

=== step === concept
## Matching: comparing by construction instead of by model

One way to fix a comparison like this is to fit a model of who is more likely to get the reminder, based on sessions_week1, and use that model to reweight every user. That is exactly what a propensity score does. Matching takes a more direct route instead: it pairs each reminder user with the non-reminder user whose sessions_week1 is closest to its own, and compares the two users' sessions_week4 only within that pair. A single non-reminder user can be the nearest match for more than one reminder user; this is called matching with replacement.

Let's hand-match four of the spotlight reminder users to their nearest non-reminder user.

```r
# Hand-match each spotlight reminder user to its nearest non-reminder user by sessions_week1
treated <- users[users$reminder == 1, ]
control <- users[users$reminder == 0, ]

spotlight_ids <- c(3, 44, 42, 24)
for (id in spotlight_ids) {
  u <- users[users$user == id, ]
  dist <- abs(control$sessions_week1 - u$sessions_week1)
  nearest <- which.min(dist)
  cat(sprintf("user %d | sessions_week1 %d | nearest control sessions_week1 %d | distance %d\n",
              id, u$sessions_week1, control$sessions_week1[nearest], dist[nearest]))
}
#> user 3 | sessions_week1 2 | nearest control sessions_week1 2 | distance 0
#> user 44 | sessions_week1 3 | nearest control sessions_week1 3 | distance 0
#> user 42 | sessions_week1 10 | nearest control sessions_week1 10 | distance 0
#> user 24 | sessions_week1 1 | nearest control sessions_week1 2 | distance 1
```

`treated` holds the 73 reminder users, and `control` holds the 127 non-reminder users. For each spotlight user, `abs(control$sessions_week1 - u$sessions_week1)` measures how far every non-reminder user sits from this one on sessions_week1, and `which.min()` picks the closest.

Three of the four spotlight users, 3, 44, and 42, land an exact match: a non-reminder user with the identical sessions_week1. User 24 does not. Its sessions_week1 is 1, and the nearest non-reminder user available sits at sessions_week1 2, a distance of 1.

=== step === concept
## Nearest-neighbour matching across all 73 reminder users

Pairing users one at a time works for a small spotlight, but Fernview has 73 reminder users in total. The same rule, pair each reminder user with its nearest non-reminder user by sessions_week1, and compare their sessions_week4 within the pair, runs the same way across all 73. Average the 73 paired gaps together, and that average is the matched estimate for the whole dataset.

Let's run that match across every reminder user and compute the result.

```r
# Match every reminder user to their nearest non-reminder user, and average the paired gaps
match_idx <- sapply(treated$sessions_week1, function(x) which.min(abs(control$sessions_week1 - x)))
match_dist <- sapply(treated$sessions_week1, function(x) min(abs(control$sessions_week1 - x)))

paired_estimate <- mean(treated$sessions_week4 - control$sessions_week4[match_idx])
round(paired_estimate, 2)
#> [1] 1.88
```

`match_idx` holds, for each of the 73 reminder users, the row position of its nearest non-reminder match in `control`. `match_dist` holds how far away that nearest match actually is, for each of the 73 pairs. `control$sessions_week4[match_idx]` lines up each reminder user's matched partner's sessions_week4, so `treated$sessions_week4 - control$sessions_week4[match_idx]` is 73 paired differences, one per reminder user.

The matched estimate is 1.88. That is already much closer to the true effect of 2 than the naive gap of 0.53 was. Matching, by comparing each reminder user only to a non-reminder user with a similar sessions_week1, removes most of the confounding that sessions_week1 was causing. But 1.88 is not exactly 2 either, and some of the 73 pairs, like user 24's, are built from a worse match than others.

=== step === concept
## The caliper: refusing a bad match, and what gets dropped

Some of those 73 pairs are good matches, like user 3's, matched at distance 0. Some are not, like user 24's, matched at distance 1. A caliper sets a maximum allowed distance for any match: pairs farther apart than the caliper get excluded instead of counted.

A common rule of thumb sets the caliper at 0.2 standard deviations of the matching variable, here sessions_week1.

Let's compute it and see which pairs it removes.

```r
# Set the caliper at 0.2 standard deviations of sessions_week1, and see what it discards
caliper <- 0.2 * sd(users$sessions_week1)
round(caliper, 2)
#> [1] 0.52

within_caliper <- match_dist <= caliper
discarded <- treated[!within_caliper, c("user", "sessions_week1", "sessions_week4")]
discarded$nearest_distance <- match_dist[!within_caliper]
discarded
#>     user sessions_week1 sessions_week4 nearest_distance
#> 24    24              1           9.57                1
#> 164  164              1           6.52                1
#> 186  186              1           6.08                1

calipered_estimate <- mean(treated$sessions_week4[within_caliper] -
                              control$sessions_week4[match_idx[within_caliper]])
round(calipered_estimate, 2)
#> [1] 2.01
```

The caliper here is 0.52. Of the 73 reminder users, exactly 3 fall outside it: users 24, 164, and 186, every one of them with sessions_week1 of 1. For each of these three, the nearest non-reminder user available sits at sessions_week1 2, a distance of 1, which is farther than the 0.52 caliper allows. There simply is no non-reminder user at sessions_week1 1 anywhere in this dataset, so these three reminder users have no acceptable match and are discarded.

Recomputing the matched estimate on the remaining 70 pairs gives 2.01. That is closer to the true effect of 2 than the 1.88 from keeping all 73. The three discarded pairs were exactly the worst matches in the whole dataset, each one a reminder user compared to a non-reminder user who was not really like them. Dropping them removed exactly the noise that was pulling the estimate away from 2.

=== step === quiz
## Quick check: why discarding helped here

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Discarding the 3 users made no real difference; the estimate only changed because of rounding. ::no
- The 3 discarded users were the worst-matched pairs in the dataset, so removing them moved the estimate from 1.88 to 2.01, closer to the true effect of 2. ::ok Exactly right. The caliper did not just shrink the sample. It removed the specific pairs that were pulling the estimate away from the truth.
- Discarding units from a matched comparison always makes the resulting estimate more accurate. ::no
- The caliper's only purpose is to make the matched sample smaller. ::no A caliper is not just a sample-size knob. It excludes any match beyond a set distance, and here it excluded the 3 reminder users whose nearest non-reminder match was genuinely far away on sessions_week1. That is why the estimate moved from 1.88 to 2.01, closer to the true effect of 2, and not simply because fewer units were left.

=== step === widget
## The balance table that justifies the match

A matched comparison is only trustworthy if the matching actually balanced the variable it was matched on. The standard way to check that is the standardized mean difference, or SMD: the gap between the two groups' average sessions_week1, measured in units of their combined standard deviation. An SMD near 0 means the two groups look alike on that variable. An SMD far from 0 means they do not.

Here is that check run on Fernview's own match.

::widget styled-table {"cols": ["stage", "mean_sessions_week1_reminder", "mean_sessions_week1_control", "smd"], "rows": [["Before matching", 4.4, 6.94, -1.14], ["After matching", 4.54, 4.54, 0]], "title": "Checking balance on sessions_week1", "note": "SMD: the gap in average sessions_week1 between the reminder and non-reminder groups, in units of the combined standard deviation."}

Before matching, the 73 reminder users average 4.4 sessions in week 1, against 6.94 for all 127 non-reminder users: an SMD of -1.14, a large imbalance. After matching, the 70 matched reminder users average 4.54, and so do their 70 matched non-reminder partners: an SMD of 0.00. The match landed on exactly 0 here because sessions_week1 is a small integer count, so most of the 70 matched pairs share the identical value rather than merely a close one.

=== step === widget
## Seeing the same balance shift on a different population

The shift from an SMD of -1.14 to 0.00 was not a coincidence specific to Fernview's 200 users. The same pattern shows up whenever matching succeeds: a confounded comparison starts out unbalanced, and nearest-neighbour matching brings the matched groups back into balance.

The widget below builds its own 600 simulated units, independent of Fernview's data, fits a propensity model, and nearest-neighbour matches them by that score. Its treated units map onto Fernview's reminder users, and its control units map onto the non-reminder users.

Here is that same before and after shift, built fresh on its own 600 units.

::widget matching-overlap {}

Toggle between before and after matching. Before, the treated and control histograms sit apart, piled up at different propensity scores, the same kind of imbalance the -1.14 SMD captured for sessions_week1. After matching, the two histograms line up, and the widget's own printed SMD drops toward 0, the same shift just measured for Fernview above.

=== step === concept
## What the matched estimate describes, and what it still depends on

The 2.01 estimate was computed from 70 of the original 73 reminder users. The 3 users with sessions_week1 of 1, the lowest week-1 engagement among anyone who got the reminder, are left out of it entirely. If Fernview asked specifically how the reminder affects its very-lowest-engagement users, the 2.01 estimate does not answer that question, because none of those users are in it.

Let's confirm that split in numbers.

```r
# Confirm the 2.01 estimate comes from 70 of the original 73 reminder users
n_discarded <- sum(!within_caliper)
n_matched <- sum(within_caliper)
c(discarded = n_discarded, matched = n_matched, total_reminder_users = nrow(treated))
#>            discarded              matched total_reminder_users 
#>                    3                   70                   73 
round(calipered_estimate, 2)
#> [1] 2.01
```

There is a second limit, separate from the dropped users. Matching on sessions_week1 only guarantees that sessions_week1 is balanced between the matched groups, which is what the SMD of 0.00 showed. It gives no information at all about any other variable that might also affect both who gets the reminder and sessions_week4. Choosing sessions_week1 as the variable to match on was a judgment about what confounds this comparison, made before matching ever ran, and matching itself never checks whether that judgment was right.

=== step === quiz
## Quick check: does a balanced SMD mean matching found all the confounding

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- An SMD of 0.00 proves the matched comparison has no confounding left at all. ::no
- The matched estimate is unconfounded because it compares real matched pairs instead of a fitted model's predictions. ::no
- An SMD of 0.00 on sessions_week1 shows the matched groups are balanced on that one variable. It says nothing about balance on any other variable that was never matched on. ::ok Exactly. Balance is always balance on a specific variable, not a certificate that every confounder has been handled.
- Since sessions_week1 was the only confounder in this dataset, an SMD of 0.00 does mean the comparison is unconfounded. ::no Balance on sessions_week1 is balance on sessions_week1, nothing more. An SMD of 0.00 does not prove there is no confounding left, and it does not make a matched comparison inherently more trustworthy than a modelled one just because it used real pairs. If any other variable affects both who gets the reminder and sessions_week4, matching on sessions_week1 alone never checks for it, let alone fixes it.

=== step === tryit
## Your turn: match a new user and compute their own paired estimate

A 201st Fernview user, not part of the original 200, had sessions_week1 of 9. This user got the reminder and later logged sessions_week4 of 11.5.

```r
# A new user outside the original 200: find their nearest match and the paired estimate
new_sessions_week1 <- 9
new_reminder <- 1
new_sessions_week4 <- 11.5

# control already holds the 127 non-reminder users, with their own sessions_week1
# and sessions_week4 columns

# Your turn: find the nearest non-reminder user by absolute distance on sessions_week1,
# confirm that distance is within the caliper, then compute the paired difference
# in sessions_week4. Three lines. Press Check when you have them.
```
::check {"regex": "abs\\s*[(][^)]*sessions_week1[^)]*[)][\\s\\S]*(caliper|0\\.52|0\\.2\\s*\\*\\s*sd)[\\s\\S]*new_sessions_week4\\s*-\\s*control\\$sessions_week4", "gate": true, "difficulty": "intermediate", "ok": "Right: the nearest non-reminder user shares sessions_week1 of 9, so the distance is 0, well inside the 0.52 caliper. This one pair's own matched estimate is 11.5 minus 10.04, 1.46.", "no": "Reuse the caliper logic from earlier in this lesson: compute abs(control$sessions_week1 - new_sessions_week1), find the smallest one with which.min(), check that smallest distance against caliper, then subtract that matched user's sessions_week4 from new_sessions_week4."}
::solution
```r
# Match the new user by hand and compute their paired estimate
distance_to_controls <- abs(control$sessions_week1 - new_sessions_week1)
nearest <- which.min(distance_to_controls)
nearest_distance <- distance_to_controls[nearest]
nearest_distance
#> [1] 0
nearest_distance <= caliper
#> [1] TRUE
paired_difference <- new_sessions_week4 - control$sessions_week4[nearest]
round(paired_difference, 2)
#> [1] 1.46
```

Unlike the 3 discarded users whose sessions_week1 was 1, this new user's nearest match is an exact one, well inside the 0.52 caliper. So this user is matched, not discarded, and this one pair's own paired difference is 1.46.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Constructing a Control Group Using Multivariate Matched Sampling Methods That Incorporate the Propensity Score](https://doi.org/10.1080/00031305.1985.10479383) - Rosenbaum, P.R., Rubin, D.B. (1985), The American Statistician, 39(1), 33-38. The paper that introduced caliper matching on the propensity score.
- [Matching Methods for Causal Inference: A Review and a Look Forward](https://doi.org/10.1214/09-STS313) - Stuart, E.A. (2010), Statistical Science, 25(1), 1-21. A survey of nearest-neighbour and caliper matching, and how to check balance after matching.
- [Matching as Nonparametric Preprocessing for Reducing Model Dependence in Parametric Causal Inference](https://doi.org/10.1093/pan/mpl013) - Ho, D.E., Imai, K., King, G., Stuart, E.A. (2007), Political Analysis, 15(3), 199-236. The paper behind treating matching as a preprocessing step before any model is fit.
- [Why Propensity Scores Should Not Be Used for Matching](https://doi.org/10.1017/pan.2019.11) - King, G., Nielsen, R. (2019), Political Analysis, 27(4), 435-454. A case for matching directly on the confounders instead of on a fitted propensity score.

=== step === complete
## What you can now ask of any matched estimate

Fernview's honest answer is this: the reminder raises sessions_week4 by about 2.01 sessions, not the naive 0.53, once reminder users are compared only to the non-reminder user closest to them on sessions_week1. That number held up only after checking which users the matching had to drop, 3 of the original 73, and why: their nearest available match was farther away than the caliper allowed.

You can ask the same three questions of any matched estimate you come across from here on. What variable was it matched on? How many units did matching discard, and what did those units look like? And did the balance check, the SMD, actually improve after matching, or is the estimate just assumed to be fair because it came from real pairs instead of a model?

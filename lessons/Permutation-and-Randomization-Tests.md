---
title: "Choosing Statistical Tests Lesson 4: Permutation and randomization tests"
catalog_blurb: "Turn a gap between two groups into an exact p-value by counting, not assuming."
description: "An onboarding email test shows how a permutation test turns a count of relabelings into an exact p-value, and why shuffling the wrong unit still fails."
keywords: "permutation test, randomization test, exact p-value, Monte Carlo p-value, sign test, exchangeability, cluster-robust permutation, combn, sample function in R, R"
post_type: "LESSON"
curriculum_id: "4.40.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "4"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: "Reporting-Effect-Size-Not-Just-Significance.html"
course_prev: "Nonparametric-Tests-Wilcoxon-and-Kruskal-Wallis.html"
---

=== step === cover
## Permutation and randomization tests

Today let's understand permutation and randomization tests, a way to get a p-value by actually counting instead of looking one up in a table.

Say an onboarding team is testing a new welcome email against the old one. They measure how many minutes each user is active on the product in their first week. A small pilot sends the new email to 3 users and the old email to another 3. The new email's 3 users log 40, 50 and 60 minutes. The old email's 3 users log 10, 20 and 30 minutes. The new email's average comes to 50 minutes, the old email's to 20 minutes, a gap of 30 minutes.

That 30-minute gap could mean the new email genuinely works better. Or it could be nothing more than how these particular 6 users happened to land, 3 and 3, into the two groups. A permutation test settles that by counting how often a gap this big turns up when the only thing separating the two groups is a random split of the same 6 numbers.

The chart below is the kind of picture that count builds toward.

::widget null-distribution {"tails": 2, "max": 3, "start": 1.5, "label": "gap, standardized"}

Its x-axis is standardized, meaning it is measured in how many standard deviations a result sits from zero, so one curve can stand in for a gap of any size or unit. Drag the marker and watch the shaded tail shrink as it moves away from zero. That shaded share is exactly what a p-value measures: how much of the chance-alone curve lies as far out, or further, than the result being judged.

=== step === concept
## The onboarding pilot, the null, and its 20 possible relabelings

Before trusting that 30-minute gap, state precisely what it is being tested against. The claim being tested is called the **null hypothesis**, written H0: the new email made no real difference, so which 3 of the 6 users happened to get it is beside the point.

If H0 is true, the "new" and "old" labels are just stickers stuck on 6 fixed numbers, and any other way of handing 3 of those stickers to "new" was just as likely as the one that actually happened.

Press Run to lay out the pilot and check the real gap in R.

```r
# Lay out the pilot's six users and compute each email's average minutes active
pilot <- data.frame(
  user    = 1:6,
  minutes = c(40, 50, 60, 10, 20, 30),
  email   = rep(c("new", "old"), each = 3)
)
pilot
#>   user minutes email
#> 1    1      40   new
#> 2    2      50   new
#> 3    3      60   new
#> 4    4      10   old
#> 5    5      20   old
#> 6    6      30   old

means <- tapply(pilot$minutes, pilot$email, mean)
means
#> new old 
#>  50  20 

gap <- means[["new"]] - means[["old"]]
gap
#> [1] 30
```

`tapply()` splits `minutes` by `email` and applies `mean()` to each group, so `means` holds the new email's average and the old email's average from one call. `gap` is just their difference, the same 30 minutes as a moment ago.

Now count every other way those 6 stickers could have landed. Choosing which 3 of the 6 users get the "new" sticker is a combinations problem, and `combn(6, 3)` lists every one of those choices as a column.

```r
# List every way to choose 3 of the 6 users for the "new" label
combos <- combn(6, 3)
dim(combos)
#> [1]  3 20

combos[, 1:5]
#>      [,1] [,2] [,3] [,4] [,5]
#> [1,]    1    1    1    1    1
#> [2,]    2    2    2    2    3
#> [3,]    3    4    5    6    4
```

20 columns, each one a different set of 3 user numbers. The column `1 2 3` is the real split, users 1 to 3 getting "new". Every other column is a relabeling nobody actually ran, but one H0 says was exactly as likely as the real one.

=== step === concept
## The exact p-value: one relabeling in twenty

Put every one of those 20 relabelings through the same calculation: call 3 of the users "new," the other 3 "old," and take the gap in means.

```r
# Recompute the gap in means for every one of the 20 relabelings
gaps <- sapply(1:ncol(combos), function(i) {
  new_idx <- combos[, i]
  mean(pilot$minutes[new_idx]) - mean(pilot$minutes[-new_idx])
})
round(gaps, 2)
#>  [1]  30.00  -3.33   3.33  10.00   3.33  10.00  16.67 -23.33 -16.67 -10.00
#> [11]  10.00  16.67  23.33 -16.67 -10.00  -3.33 -10.00  -3.33   3.33 -30.00
```

The first of those 20 gaps, 30, is the real split. The other 19 are the gaps that would have shown up under every other way of handing out the two labels, and most of them sit much closer to zero.

A permutation p-value is just a count over this list: how many of the 20 relabelings reach a gap as big as, or bigger than, the one that actually happened.

```r
# Count how many of the 20 relabelings reach a gap of 30 or more
sum(gaps >= 30)
#> [1] 1

sum(gaps >= 30) / 20
#> [1] 0.05
```

Exactly 1 of the 20, the real split itself, reaches 30 or more. So the one-sided exact p-value is 1/20 = 0.05. That is not a lookup in any table. It is a literal count over a list sitting in full view above.

The same logic runs in both directions. Counting relabelings that reach a gap of 30 or more in EITHER direction, favoring either email by that much, gives a two-sided answer instead.

```r
# Count relabelings that reach a gap of 30 or more in either direction
sum(abs(gaps) >= 30)
#> [1] 2

sum(abs(gaps) >= 30) / 20
#> [1] 0.1
```

2 of the 20 reach 30 or more in absolute value: the real split, and its mirror image where users 4, 5 and 6 get "new" instead. So the two-sided exact p-value is 2/20 = 0.10, exactly double the one-sided answer. That doubling is not a coincidence. Every relabeling has a matching mirror relabeling sitting the same distance from zero on the other side.

[KEY INSIGHT]
A permutation p-value is a count divided by a total, nothing else. No normal curve, no table, no formula standing in for something that could just be enumerated directly.

=== step === quiz
## Quick check: updating the one-sided count

Suppose this pilot had come out a little less lopsided: instead of just 1 of the 20 relabelings reaching a gap of 30 or more, 3 of them did. What would the one-sided exact p-value be?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 1/20 = 0.05 ::no
- 3/20 = 0.15 ::ok Right. The p-value is always that count over the full 20, so updating the count to 3 updates the answer to 3/20 = 0.15.
- 6/20 = 0.30 ::no
- 3/19 ::no A one-sided p-value counts relabelings on the side of zero the real result leans toward, divided by all 20 relabelings, the one that actually happened included. Doubling the count answers a two-sided question nobody asked here, and dropping the real split out of the denominator leaves only 19, when it belongs in the count the same as any other relabeling.

=== step === widget
## The sign test: eight matched pairs and a coin flip

Run the same idea on a different design. Instead of 6 separate users split into two groups, take 8 pairs of similar users: in each pair, one user gets the new email, the other gets the old, and you just record which email that pair's user was more active under. 7 of the 8 pairs favor the new email.

Under H0, the new email makes no real difference, so within any one pair, which user happens to look more active is as good as a coin flip, right half the time either way, and independent from pair to pair. That makes the number of pairs favoring the new email, out of 8 coin flips, follow a distribution with a name: Binomial(8, 0.5). This particular test, counting wins on a matched pair instead of comparing raw numbers directly, is called the **sign test**.

Because this reference distribution has a known closed form, there is no need to simulate anything to get the exact answer. One line of arithmetic gives it directly.

```r
# Compute the exact chance that 7 or 8 of 8 fair coin flips favor the new email
probs <- dbinom(7:8, 8, 0.5)
probs
#> [1] 0.03125000 0.00390625

sum(probs)
#> [1] 0.03515625
```

`dbinom(7:8, 8, 0.5)` gives the chance of exactly 7, then exactly 8, heads out of 8 fair flips. Adding them gives the chance of 7 or 8, about 0.0352, or 9 times in 256. That is the sign test's one-sided p-value: if the new email truly made no difference, a result this lopsided would still turn up about 3.5% of the time by coin-flip luck alone.

Press Run below and watch how often pure chance alone matches or beats 7 out of 8.

::widget luck-simulator {"trials": 8, "p": 0.5, "observed": 7, "unit": "of 8 pairs favoring the new email", "seed": 11}

Run it a few thousand times and the share reaching 7 or 8 should settle in close to that same 0.0352 computed above. That agreement is reassuring, not required. The exact answer was already sitting in a closed-form formula, so the simulator here is only double-checking a number that could already be computed directly.

=== step === concept
## What exchangeability means, and why random assignment creates it

Both pilots so far leaned on the same quiet assumption, worth naming properly. Two observations are **exchangeable** under H0 if swapping their labels does not change the joint distribution of the data. In other words, relabeling them is something that could just as well have happened.

In the 6-user pilot, every user's "new" or "old" sticker was handed out at random. Nothing about a user's own tendency to be active decided which sticker they got. That is exactly what makes every user exchangeable with every other: any of the 20 ways to deal out the stickers was, under H0, just as likely as the one that actually happened, which is the only reason counting over those 20 relabelings gives a valid p-value.

The 8-pair pilot earns the same property a different way. Within a pair, which user got the new email was also decided at random, so under H0 either user in the pair was just as likely to be the one logged as favoring the new email. That is why treating each pair's result as a fair coin flip was not an assumption pulled from nowhere. It followed directly from how the emails were assigned.

[TIP]
Exchangeability is not a property of the data on its own. It is earned by how the data were collected, here by random assignment. Change how the groups were formed and exchangeability can disappear even though the numbers look exactly the same.

=== step === concept
## Too many relabelings to count: sampling instead of enumerating

The real rollout does not stop at 6 users. It sends the new email to 15 users and the old one to another 15, 30 in total. The same counting idea still applies in principle: list every way to choose 15 of the 30 users for "new," and count how many relabelings reach a gap as big as the real one.

In principle. In practice, that list is far too long to write out.

```r
# How many ways are there to choose 15 of 30 users for the "new" label
choose(30, 15)
#> [1] 155117520
```

Over 155 million relabelings. Nothing is going to enumerate all of those just to answer one question. So instead of listing every relabeling, sample a large number of them at random and count among just those.

Press Run to generate the rollout's 30 users and compare a sampled permutation test against a `t.test()` on the same data.

```r
# Simulate the rollout, then compare a Monte Carlo permutation p-value to a t-test
set.seed(42)
new_email <- rnorm(15, mean = 52, sd = 18)
old_email <- rnorm(15, mean = 40, sd = 18)
rollout <- data.frame(minutes = c(new_email, old_email),
                       email = rep(c("new", "old"), each = 15))

observed_gap <- mean(new_email) - mean(old_email)
round(observed_gap, 2)
#> [1] 26.96

set.seed(123)
mc_gaps <- replicate(2000, {
  shuffled <- sample(rollout$email)
  mean(rollout$minutes[shuffled == "new"]) - mean(rollout$minutes[shuffled == "old"])
})
mc_p <- sum(abs(mc_gaps) >= abs(observed_gap)) / 2000
mc_p
#> [1] 0.001

t.test(minutes ~ email, data = rollout)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  minutes by email
#> t = 3.4112, df = 26.055, p-value = 0.00212
#> alternative hypothesis: true difference in means between group new and group old is not equal to 0
#> 95 percent confidence interval:
#>  10.71747 43.20913
#> sample estimates:
#> mean in group new mean in group old 
#>          60.71621          33.75291 
```

`replicate(2000, ...)` repeats the same move 2,000 times: shuffle the 30 email labels with `sample()`, then recompute the gap. Each repeat is one relabeling the 30 users could have received under H0, just not all 155 million of them, only a random 2,000. The Monte Carlo p-value, `mc_p`, is the same kind of count as before: how many of those 2,000 sampled relabelings reach a gap as extreme as the real 26.96 minutes, divided by 2,000.

Only 2 of the 2,000 did, for a Monte Carlo p-value of 0.001. Welch's t-test, run on the exact same 30 users, lands at p = 0.00212. Different method, same conclusion: both say this gap is very unlikely to be nothing more than noise.

=== step === widget
## The null distribution a t-test assumes, next to the one this test built

A t-test does not build its p-value by shuffling and counting. It assumes the gap in means, once standardized into a t-statistic, follows a known smooth curve, the t-distribution, fixed by a formula before a single relabeling is ever run. The histogram of 2,000 shuffled gaps from a moment ago is the opposite of that: nothing but the actual outcomes of actually reshuffling this data, 2,000 times over.

::widget null-distribution {"tails": 2, "max": 3, "start": 2.0, "label": "t statistic"}

Drag the slider as far right as it goes, to 3 standard deviations from zero, and the shaded tail is already thin. The rollout's own t-statistic, 3.41, sits further out still, past the edge of this scale entirely, which says the same thing another way: a gap this large would be rare even by the t-test's own generous theoretical curve, let alone by the histogram of actual relabelings that produced an even smaller p-value.

=== step === concept
## Why a permutation test on clustered data is still the wrong answer

Picture the same 30-user rollout organized a different way: not just individuals, but 6 weekly cohorts of 5 users each, 3 cohorts getting the new email for the whole week, the other 3 keeping the old one.

Each week carries its own circumstances beyond the email itself: which account manager was on call, how much organic traffic showed up, a product update that landed that week. Call this a **cohort effect**: a shift that moves every user in that week's cohort up or down together, with nothing to do with which email they got.

That cohort effect is exactly what breaks shuffling the 30 individual labels. Swapping which individual users are called "new" or "old" treats a user in week 1 as exchangeable with a user in week 4. But if week 1 happened to have an unusually strong cohort effect, every one of its 5 users carries that boost regardless of email, so they are not actually exchangeable with users from a different week. The unit that was actually randomly assigned here is the cohort, not the individual, and the shuffle has to match the unit of assignment: swap which 3 of the 6 cohorts got "new," the same 20 relabelings already counted for the 6-user pilot, just applied to cohorts instead of individual users.

Press Run to see the cost of shuffling the wrong unit, measured rather than argued. The code below builds 300 separate null worlds, each one with no true difference between the emails, a fixed assignment of 3 cohorts to "new," and a real random effect shared within each cohort. In each world, it runs both kinds of permutation test and checks whether that world's test wrongly rejects at the 5% level, something that should happen about 5% of the time if a test is well calibrated.

```r
# Simulate many null worlds with a per-cohort effect and compare how often each permutation test wrongly rejects
set.seed(7)
user_cohort <- rep(1:6, each = 5)
assigned_label <- rep(c("new", "old"), each = 3)[user_cohort]
cohort_combos <- combn(6, 3)

n_sims <- 300
reject_user <- logical(n_sims)
reject_cohort <- logical(n_sims)

for (i in 1:n_sims) {
  cohort_effect <- rnorm(6, mean = 0, sd = 12)
  y <- cohort_effect[user_cohort] + rnorm(30, mean = 0, sd = 6)
  observed <- mean(y[assigned_label == "new"]) - mean(y[assigned_label == "old"])

  user_perm_gaps <- replicate(200, {
    shuffled_label <- sample(assigned_label)
    mean(y[shuffled_label == "new"]) - mean(y[shuffled_label == "old"])
  })
  p_user <- mean(user_perm_gaps >= observed)

  cohort_perm_gaps <- sapply(1:ncol(cohort_combos), function(k) {
    new_cohorts <- cohort_combos[, k]
    is_new <- user_cohort %in% new_cohorts
    mean(y[is_new]) - mean(y[!is_new])
  })
  p_cohort <- mean(cohort_perm_gaps >= observed)

  reject_user[i] <- p_user <= 0.05
  reject_cohort[i] <- p_cohort <= 0.05
}

round(mean(reject_user), 3)
#> [1] 0.333

round(mean(reject_cohort), 3)
#> [1] 0.06
```

`user_cohort` marks which of the 6 cohorts each of the 30 users belongs to, and `assigned_label` fixes cohorts 1 to 3 as "new" and 4 to 6 as "old," matching the real design. Inside the loop, `cohort_effect` is this world's random per-cohort shift, and `y` is each user's outcome: their cohort's shift, plus their own personal noise. No email effect is built in anywhere, only the cohort effect, so any rejection here is a false one.

`user_perm_gaps` shuffles the 30 individual labels 200 times and recomputes the gap each time, the same move made at a bigger scale earlier. `cohort_perm_gaps` instead enumerates all 20 ways to relabel the 6 cohorts, the same exact enumeration from the very first pilot, just one level up.

Over 300 such null worlds, shuffling individual users wrongly rejects 33.3% of the time, more than six times the 5% it is supposed to allow. Shuffling cohorts wrongly rejects 6% of the time, close to the nominal rate it is actually built to control.

[WARNING]
A permutation test is only as valid as the unit it shuffles. Shuffle a smaller unit than the one that was actually randomized, and a shared effect within each real unit leaks through as if it were evidence of a treatment effect, inflating how often the test raises a false alarm.

=== step === quiz
## Quick check: what breaks a permutation test

A grocery chain is testing a new price on a snack item. It picks 10 stores at random: 5 keep the old price, 5 switch to the new one. Every shopper who buys the snack at a store pays whatever price that store was assigned, and the chain compares how many units sold per store. Which shuffle gives this test a valid null?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Shuffle individual shoppers' purchases between the two price groups, for a finer-grained null. ::no
- Shuffle which 5 of the 10 stores got the new price. ::ok Right. Random assignment happened at the store level, so the store is the exchangeable unit here, the same way the cohort was a moment ago. Shuffle which 5 of the 10 stores got the new price.
- Shuffle both the shoppers and the stores, to be safe. ::no
- Skip shuffling and compare the 10 stores' average sales with a t-test instead. ::no Shoppers inside the same store share whatever that store's traffic, layout and staff did to sales that week, so they are not exchangeable with shoppers from a different store. A permutation test still needs a shuffle to build its null, and the unit to shuffle is always the unit that was randomly assigned, here the store, never the shopper.

=== step === tryit
## Your turn: write your own permutation test

The pilot's 6 values and labels are still just numbers and stickers. Write the loop that turns them into a Monte Carlo permutation test: shuffle the labels, recompute the gap, and repeat it 2,000 times.

```r
# Shuffle the pilot's six labels, recompute the gap, and repeat it 2000 times
minutes <- c(40, 50, 60, 10, 20, 30)
email <- rep(c("new", "old"), each = 3)

set.seed(1)
n_reps <- 2000
mc_gaps <- numeric(n_reps)

for (i in 1:n_reps) {
  # Shuffle email with sample() and store the result in shuffled.
  # Then take the gap between the two groups' means under that shuffle
  # and store it in mc_gaps[i].
}

mean(mc_gaps >= 30)
```
::check {"regex": "sample[(][\\s\\S]*mc_gaps\\x5Bi\\x5D", "gate": true, "difficulty": "intermediate", "ok": "Right. mean(mc_gaps >= 30) should land close to 0.05, the same 1-in-20 chance this split reached by direct enumeration earlier, since sample() lands on each of the 20 distinct relabelings about equally often over 2,000 tries.", "no": "Inside the loop, shuffle email with sample() and store the result in shuffled. Then take the gap between the two groups' means under that shuffle and store it in mc_gaps[i]. Run 2,000 times, and mean(mc_gaps >= 30) should settle in close to 0.05."}
::solution
```r
# Complete the loop: shuffle the labels, recompute the gap, and repeat it 2000 times
minutes <- c(40, 50, 60, 10, 20, 30)
email <- rep(c("new", "old"), each = 3)

set.seed(1)
n_reps <- 2000
mc_gaps <- numeric(n_reps)

for (i in 1:n_reps) {
  shuffled <- sample(email)
  mc_gaps[i] <- mean(minutes[shuffled == "new"]) - mean(minutes[shuffled == "old"])
}

mean(mc_gaps >= 30)
#> [1] 0.045
```

=== step === concept
## References

- Fisher, R.A. (1935). *The Design of Experiments*. The original statement of the randomization test, built from the actual random assignment of an experiment rather than from an assumed distribution.
- Good, P.I. (2005). *Permutation, Parametric and Bootstrap Tests of Hypotheses*. A fuller treatment of permutation and randomization tests, including the Monte Carlo approach used for the rollout above.
- Edgington, E. & Onghena, P. (2007). *Randomization Tests*. The standard reference on randomization tests across experimental designs, including matched pairs like the 8-pair pilot's sign test.
- Lehmann, E.L. & Romano, J.P. (2005). *Testing Statistical Hypotheses*. The formal treatment of exchangeability behind every relabeling counted in this lesson.
- Nichols, T. & Holmes, A. (2002). "Nonparametric permutation tests for functional neuroimaging." The cluster-level permutation problem, the same mismatch between the unit assigned and the unit shuffled that broke the cohort-level test above.
- [combn() documentation](https://stat.ethz.ch/R-manual/R-devel/library/utils/html/combn.html) - R Core Team. The function used to enumerate every relabeling in this lesson.
- [sample() documentation](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) - R Core Team. The function behind every shuffle in this lesson, from the 6-user pilot to the cohort simulation.
- [t.test() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team. The formula-based test checked against the Monte Carlo permutation p-value.
- [dbinom() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html) - R Core Team. The closed-form distribution behind the sign test's exact p-value.

=== step === complete
## What a permutation p-value is, and is not

Every number in this lesson came from the same two moves: build every relabeling the null hypothesis says is equally likely, then count how many reach as far as the result that actually happened.

With 6 users, that count was exact and total: 1 relabeling out of 20 reached a gap of 30 or more, for a one-sided p-value of 0.05. With 8 matched pairs, the count had a name and a formula already attached to it, the sign test, since its reference distribution was Binomial(8, 0.5). With 30 users, enumerating every relabeling stopped being possible, so 2,000 of them were sampled instead, landing close to what a t-test gave by formula.

What made every one of those counts valid was exchangeability: the fact that random assignment made any relabeling, at the right unit, just as likely as the one that happened. That is also the one way this test silently fails. Reorganize the 30 users into 6 cohorts and shuffle individuals instead of cohorts, and a false positive rate of 5% quietly becomes 33%, because users sharing a cohort were never actually exchangeable with users from a different one.

A permutation p-value is exact when it can be, sampled when it has to be, and only ever as trustworthy as the unit it shuffles.

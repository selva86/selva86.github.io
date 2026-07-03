---
title: "Experimentation: Quiz"
description: "A graded check on the experimentation section: statistical power and sample size, CUPED variance reduction, peeking and sample-ratio mismatch, interference and cluster/switchback designs, multi-armed bandits, Thompson sampling, and off-policy evaluation."
keywords: "R quiz, experimentation, statistical power, sample size, CUPED, peeking, sample ratio mismatch, SRM, interference, cluster randomization, switchback, multi-armed bandit, thompson sampling, off-policy evaluation, IPS, doubly robust, ds-experimentation"
post_type: "LESSON"
curriculum_id: "6.170.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "8"
course_total: "8"
course_landing: "R-Experimentation-Course.html"
lesson_kind: "quiz"
course_prev: "Contextual-Bandits-and-Off-Policy-Evaluation.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built the experimentation toolkit end to end: sizing a test so it can see the effect it hunts, sharpening it with CUPED, keeping it honest against peeking and sample-ratio mismatch, designing around interference with clusters and switchbacks, earning during the test with multi-armed bandits and Thompson sampling, and valuing a new policy from a logged campaign. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## What 80% power means
A checkout test is designed with 80% power against a lift from 4.0% to 4.6%. Which reading is correct?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is an 80% chance the redesign truly lifts conversion. ::no Power says nothing about whether the redesign works. It is a property of the test: assume a specific real lift, then ask how often the test would detect it.
- If the redesign truly lifts conversion from 4.0% to 4.6%, the test has an 80% chance of coming back significant. ::ok Correct: power is conditional on a specific assumed effect, and answers how often this design detects it. A different assumed lift gives a different power.
- The test will declare a false winner only 20% of the time. ::no That confuses the two errors. False winners are governed by alpha (5% here); the 20% is the miss rate beta, the chance a real lift slips through.
- Power is fixed at 80% regardless of the effect size. ::no Power rises with the true effect and the sample size. Halve the effect and the same design's power drops sharply.

=== step === quiz
::eyebrow Question 2 of 10
## The 1 over d-squared trap
Meera sizes a test for a 0.6-percentage-point lift, then the product team says 0.3pp is more realistic. Roughly what happens to the required sample size per arm?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- It stays the same: alpha and power did not change. ::no Required sample depends on the effect size too, and it is the strongest of the three levers. A smaller lift is harder to see, so n must rise.
- It doubles: half the effect needs twice the visitors. ::no Sample size does not scale linearly with the effect. It scales with 1 over the effect squared.
- It quadruples: sample size scales with 1 over d-squared, so halving the effect multiplies n by four. ::ok Correct: n is proportional to 1/d^2, so a halved effect quadruples the requirement. That inverse square is the central planning fact of experimentation.
- It falls: a smaller effect is easier to detect. ::no A smaller effect is harder to detect, not easier, so the required sample goes up, not down.

=== step === quiz
::eyebrow Question 3 of 10
## The wrong CUPED covariate
CUPED shrinks variance by adjusting for a pre-experiment covariate. A teammate proposes adjusting by the number of site visits measured DURING the test, because it correlates 0.9 with the outcome. What is wrong?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The treatment can change during-test visits, so adjusting by them subtracts part of the real effect and biases the estimate. ::ok Correct: CUPED is unbiased only for a covariate fixed before randomization. A during-test covariate can be moved by the treatment, so adjusting it away bleeds real effect into the correction. That is the "P" (pre-experiment) in CUPED.
- Nothing: a higher correlation always means a bigger, better variance cut. ::no The 1 minus rho-squared arithmetic only holds for a covariate the treatment cannot touch. Timing first, correlation second.
- During-test visits are measured too noisily for the correlation to be trusted. ::no Noise is not the issue; timing is. A during-test covariate can be measured perfectly and still bias the estimate, because the treatment can move it.
- CUPED only works on binary covariates, not counts. ::no CUPED works on any numeric covariate; the failure here is timing, not the covariate's type.

=== step === quiz
::eyebrow Question 4 of 10
## Peeking
A six-week test recomputes its p-value every morning and ships the moment it dips under 0.05. Simulating a null (do-nothing) redesign on that calendar, what does the false-winner rate look like versus a single committed look?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Unchanged at 5%: looking at data cannot change the false-winner rate. ::no Each look is a fresh chance for a random wobble to cross the bar, and stopping on the first green banner is one-sided. The daily ritual inflates the rate far past 5%.
- Much higher: a single look holds near 5%, but stopping on any green morning across dozens of looks pushes it to roughly 30%. ::ok Correct: the 5% guarantee belongs to ONE committed look at the planned sample size. Daily peeking with a stop-on-green rule drives the null false-winner rate toward 30% in a six-week test.
- Lower: more looks means more evidence, so fewer false winners. ::no More looks under a stop-on-green rule means more chances to be fooled, not more reliable evidence. The rate goes up.
- Exactly the Bonferroni-corrected value of 0.05 divided by the number of looks. ::no Bonferroni is one valid FIX for multiple looks; it is not what an uncorrected peeking rule produces. Uncorrected, the rate climbs toward 30% here.

=== step === quiz
::eyebrow Question 5 of 10
## Sample-ratio mismatch
A test designed for a 50/50 split logs 18,321 control and 17,565 variant visitors, and a chi-square test against 50/50 returns p = 7e-05. What does that mean, and can you fix it at analysis time?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The randomizer or logging pipeline is broken (SRM), and the result cannot be rescued: find the cause, fix it, and rerun. ::ok Correct: a p far below the 0.001 SRM bar says the split is broken, not coin-flip wobble. Missing sessions are never lost at random, so you cannot reweight or trim back to 50/50; the metric is unreadable until the bug is fixed and the test rerun.
- The imbalance is only 51/49, which is visually tiny, so it is safe to ignore. ::no At experiment sample sizes, an imbalance far too small to see by eye is still far too large to be chance. That is why the check must be a test, not a glance.
- It means the variant genuinely converts better, since it has fewer visitors. ::no The visitor COUNTS are the denominators, not the metric. An imbalance in the counts signals a broken split; it says nothing about which arm converts better.
- Reweight the arms back to 50/50 and the estimate becomes valid again. ::no You cannot, because you do not know which control sessions the variant pipeline would have dropped. Non-random deletion cannot be undone by reweighting.

=== step === quiz
::eyebrow Question 6 of 10
## Interference
In a referral test, treated members send coupons to control friends, lifting control spend. The randomizer is healthy and the SRM check passes. What does the standard treated-minus-control comparison do to the true effect?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Overstates it: the treated arm gets credit for every coupon it sends. ::no The coupons land in CONTROL, so control spend rises. Subtracting an inflated baseline pulls the measured difference down, not up.
- Understates it: the leak lifts the control baseline, so the measured gap shrinks and a real effect can look non-significant. ::ok Correct: the comparison needs an untouched baseline, and the leak contaminated it upward. A genuinely profitable program can die in review. The opposite leak (treatment draining shared inventory control also needs) overstates instead; the direction follows the plumbing.
- Nothing: randomization makes the arms comparable, so spillover averages out. ::no Randomization balances who STARTS in each arm; it cannot stop a coupon crossing arms after assignment. A one-way leak does not average away.
- It only affects the variance, not the estimate. ::no A systematic one-way leak shifts the estimate itself, not just its noise.

=== step === quiz
::eyebrow Question 7 of 10
## The design effect
A referral test randomizes 40 cities of about 1,000 members each, with an intraclass correlation of 0.04. Why can Meera's 40,000 members be worth only about 1,000 independent ones, and what lifts that ceiling?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The design effect 1 + (m-1)*rho is about 41 with m=1000, so effective n is 40000/41 which flattens toward K/rho = 40/0.04 = 1000; only more CITIES lift it. ::ok Correct: a tiny ICC times a huge cluster size gives a design effect of 41, and the effective sample flattens at K/rho. Recruiting more members inside existing cities buys almost nothing; only more clusters (cities) raise the ceiling.
- Because member-level data is always less reliable than city-level data. ::no Member data is not intrinsically unreliable; the issue is that cluster-mates share shocks, so their observations are partly redundant. The design effect prices exactly that redundancy.
- Because a 0.04 correlation is negligible and can be ignored. ::no With 1,000 members per cluster, that "negligible" 0.04 inflates the variance about 41-fold. Ignoring it manufactures false winners.
- Adding more members per city raises the effective sample proportionally. ::no It barely moves, because the effective sample is already near the K/rho ceiling. More cities, not more members, is the lever.

=== step === quiz
::eyebrow Question 8 of 10
## Analyze at the level you randomized
Cities got the coin flips, but an analyst feeds all 40,000 member rows into a plain two-sample t-test. On a null (A/A) experiment, what happens?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Nothing: with a tiny ICC the member-level test is fine. ::no Ignoring clustering with a large cluster size stretches the test statistic by sqrt(design effect), so a naive z of 1.96 is really worth far less. The false-winner rate balloons.
- The member-level test manufactures false winners (about one in four here), while the correct city-level test holds at 5%. ::ok Correct: analyze at the level you randomized. A member-level test on a cluster-randomized experiment reports standard errors that are far too small; collapsing to city means (or a model that carries the cluster structure) restores the honest 5%.
- The member-level test is more powerful and therefore better. ::no Its extra "power" is an illusion from understated standard errors; it is buying detections with false positives, not real sensitivity.
- Both tests give identical answers because the data is the same. ::no The data is the same but the unit of analysis differs. Only the level you randomized carries independent information.

=== step === quiz
::eyebrow Question 9 of 10
## Thompson sampling
Thompson sampling keeps a Beta belief curve per arm and picks by drawing one imagined rate from each. Why does its exploration fade on its own, and what does it still NOT fix?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- It fades because epsilon is scheduled to shrink, and it fixes the biased-tally problem. ::no Thompson sampling has no epsilon at all, and it does NOT fix biased tallies. Both halves are wrong.
- It never fades; it explores at a fixed rate like epsilon-greedy. ::no It fades automatically: every open or ignore narrows a curve, and narrower curves win fewer imagined worlds, so a clearly-worse arm almost stops getting traffic.
- It fades because narrowing belief curves win fewer imagined worlds, but it still leaves biased final tallies, and is still hurt by delayed rewards and drift. ::ok Correct: the posterior width IS the exploration rate, and it shrinks as fast as the data justify. But adaptive sampling starves abandoned arms, freezing their tallies, so a publishable lift still needs a fixed split; delayed rewards and drift also survive the upgrade.
- It fades because the arms run out of traffic, and it fixes drift by construction. ::no Exploration fades from shrinking uncertainty, not exhausted traffic, and drift is explicitly one of the things it does not fix.

=== step === quiz
::eyebrow Question 10 of 10
## Off-policy evaluation
Meera scores next year's policy from this year's log. The naive average of matched rows reads 0.625, but inverse-propensity scoring reads 0.596 (truth 0.604). Why is the naive average biased, and what does the doubly robust estimator add?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The naive average is unbiased; IPS is the one introducing error with its weights. ::no The naive average is biased because the old policy decided which rows exist, so matched rows are not a fair sample of the new policy. IPS reweights each row by 1/propensity to correct exactly that.
- The old policy steered which rows exist, so matched rows over-represent the audiences both policies agree on; IPS reweights by 1/propensity to fix it, and doubly robust adds a reward model so it stays honest if EITHER the model or the propensities are right. ::ok Correct: the matched set is a distorted sample (here 22/78 versus a 60/40 list). IPS restores the list's true weighting; DR anchors on a reward model and reweights only the residuals, so it is unbiased if the model OR the propensities are right, and carries less variance.
- Doubly robust needs both the model and the propensities to be right, so it is strictly worse than IPS. ::no The opposite: DR is unbiased if EITHER is right, which is strictly more robust than IPS (which needs the propensities right).
- The bias comes from too few simulated worlds; more draws fix it. ::no The bias is selection by the old policy, not simulation noise. More draws cannot add evidence about rows the old policy rarely produced.

=== step === concept
::eyebrow Run it: size a test, then price CUPED
## Two levers on the same test
Size a two-proportion A/B test with `power.prop.test`, then apply CUPED's 1 minus rho-squared variance cut to see how a pre-period covariate shrinks the required sample.

```r
n_raw <- power.prop.test(p1 = 0.04, p2 = 0.046, power = 0.80)$n   # 80% power, alpha 0.05
rho   <- 0.6                                                      # pre-period correlation
c(per_arm_raw = ceiling(n_raw),
  per_arm_cuped = ceiling(n_raw * (1 - rho^2)))
#>   per_arm_raw per_arm_cuped
#>         17943         11484
```

The raw test needs about 17,943 visitors per arm. A pre-period covariate correlated 0.6 with the outcome cuts the variance by 1 minus 0.36, so the same power arrives at 11,484 per arm, roughly a third fewer, with no bias and no extra traffic.

=== step === concept
::eyebrow Run it: a bandit earns while it learns
## Thompson sampling versus an even split
Run a three-arm Thompson bandit for 2,000 rounds and compare its regret with an even split that sends a third of traffic to each arm.

```r
set.seed(1)
rates <- c(A = 0.30, B = 0.50, C = 0.55); best <- max(rates); T <- 2000
opens <- c(A = 0, B = 0, C = 0); sends <- c(A = 0, B = 0, C = 0); regret <- 0
for (t in 1:T) {
  draw <- rbeta(3, opens + 1, sends - opens + 1)   # one imagined rate per arm
  pick <- which.max(draw)                          # send to the imagined winner
  opens[pick] <- opens[pick] + rbinom(1, 1, rates[pick])
  sends[pick] <- sends[pick] + 1
  regret <- regret + best - rates[pick]            # opens forgone vs the best arm
}
rbind(sends = sends, est_rate = round(opens / sends, 2))
#>            A      B       C
#> sends    11.00 143.00 1846.00
#> est_rate  0.09   0.48    0.56

round(c(thompson_regret = unname(regret), even_split_regret = T * mean(best - rates)), 1)
#>   thompson_regret even_split_regret
#>               9.9             200.0
```

Thompson sampling concentrated 1,846 of 2,000 sends on the truly best arm C and paid about 10 opens of regret, where an even split would forgo 200. It earned while it learned, and its exploration of B faded as C pulled clear, with no exploration rate to tune.

=== step === complete
## Section complete
Strong work. You can now run an experiment from design to decision: size it against the effect worth detecting and the 1 over d-squared reality, sharpen it with CUPED, defend it against peeking and sample-ratio mismatch, design around interference with clusters and switchbacks and always analyze at the level you randomized, reach for a bandit when the payoff lands during the campaign, upgrade to Thompson sampling for evidence-priced exploration, and value the next idea from the log the last one left behind. Every experiment your team runs from here, you can size, defend, and learn from.

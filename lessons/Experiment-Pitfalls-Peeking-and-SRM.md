---
title: "Experimentation Lesson 3: Experiment Pitfalls, Peeking and SRM"
catalog_blurb: "Spot peeking, broken randomization and interference before they hand you false winners."
description: "Why peeking at a running A/B test inflates false winners, how a chi-square test catches sample ratio mismatch, and how interference biases results in R."
keywords: "peeking, optional stopping, sample ratio mismatch, SRM check, A/B testing pitfalls, sequential testing, alpha spending, chi-square test, interference, network effects, SUTVA, false positive rate"
post_type: "LESSON"
curriculum_id: "6.170.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "3"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: "Cluster-and-Switchback-Experiments.html"
course_prev: "Variance-Reduction-with-CUPED.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Experiment Pitfalls, Peeking and SRM

Lesson 2 closed with a warning: decide the analysis before the results exist. This lesson is about what happens when you do not, and about two more ways a perfectly sized, CUPED-tightened experiment can still hand you a wrong answer.

Meera's one-page checkout test from Lesson 1 is finally live: 4.0% baseline conversion, a hoped-for 4.6%, 17,943 visitors per arm, six weeks. Every morning her dashboard recomputes the significance test on the traffic so far. On day 9 of 42 it shows p = 0.04 with a green banner: significant. Her product manager asks the obvious question: why wait five more weeks?

This lesson covers the three ways online experiments lie: **peeking** (that green banner), **sample-ratio mismatch** (a broken randomizer or logging pipeline deleting sessions from one arm), and **interference** (users leaking treatment onto each other). By the end you will be able to:

- Explain why checking a running test repeatedly inflates false winners, and measure the inflation by simulation
- Decide what to do when a mid-test p-value dips under 0.05, and name the honest ways to look early
- Run a sample-ratio-mismatch check with a chi-square test and read it at the 0.001 bar
- Say why even a small mismatch invalidates the result, and which way interference bends an estimate

**Prerequisites:** Lessons 1 and 2 of this course ([Designing Experiments for Power](Designing-Experiments-for-Power.html), [Variance Reduction with CUPED](Variance-Reduction-with-CUPED.html)) for power, the planned sample size and the analysis-plan discipline; plus the p-value and the two-proportion comparison ([Reading an Experiment](Reading-an-Experiment.html)). The chi-square test appears here as a tool and is explained where it lands; [Chi-Square Goodness of Fit Test in R](Chi-Square-Goodness-of-Fit-Test-in-R.html) has the full treatment.

Below is the machinery behind Meera's dashboard: where the test statistic lands when the redesign does nothing, with the p-value as the shaded tail. Drag the slider: at z = 1.75 the banner stays grey, at 1.96 it turns green. Keep that flip in mind. The whole first pitfall is how often a NULL experiment wanders across it when you hand it 42 chances.

::widget null-distribution {"tails":2,"start":1.75,"label":"observed z today"}

=== step === concept
::eyebrow Pitfall 1: peeking
## A winner every morning, if you wait for one

Start with what the dashboard actually did. Day 9: p = 0.04, green. Day 10: p = 0.09, grey again. Day 11: p = 0.13. Nothing broke. With only 3,870 visitors per arm so far, the two conversion estimates wobble, and the p-value wobbles with them. The trouble is not that Meera looked; it is what a look invites: **stop the moment the banner turns green**. Statisticians call this peeking, or optional stopping, and it is the most common way honest teams manufacture false winners.

Recall the deal from Lesson 1. Setting \(\alpha = 0.05\) buys exactly this promise: if the redesign does nothing, a significance test run ONCE, at the planned sample size, flags a false winner 5% of the time. The promise says nothing about a test recomputed every morning. Each look is a fresh chance for a random wobble to cross the bar, and the stop rule is one-sided: Meera stops when the banner is green, never when it turns grey again the next day. The data get 42 attempts; the null hypothesis gets none.

How bad can it get? If the \(k\) looks were independent tests, the chance that at least one dips under \(\alpha\) would be

\[ P(\text{at least one false winner in } k \text{ looks}) = 1 - (1 - \alpha)^k \]

where \(k\) is the number of looks and \(\alpha\) is the per-look significance level. Read the growth:

| Looks \(k\) | 1 | 6 | 42 |
|---|---|---|---|
| False-winner chance if looks were independent | 5% | 26.5% | 88.4% |

Daily looks are not independent, though: day 10's test contains every visitor from day 9, so consecutive p-values are strongly correlated, and the true inflation is smaller than this table claims. How much smaller is an empirical question, and you already own the right tool for it: simulate. One thing, however, holds exactly: keep a null test running and peeking indefinitely and the false-winner rate keeps climbing toward certainty, a classical result proved by Armitage, McPherson and Rowe back in 1969.

=== step === concept
::eyebrow Feel it
## Two thousand null experiments, checked every morning

Lesson 1's habit was to run the experiment 2,000 times before running it once. Do the same here, with one twist: make **both arms identical**. A true conversion rate of 4.0% on each side, an A/A test, so every green banner is a false winner by construction. Each simulated experiment runs Meera's actual calendar, 430 visitors per arm per day for 42 days, with the two-proportion z-test recomputed on the running totals every morning, exactly like the dashboard.

```r
set.seed(42)
n_day <- 430    # checkout visitors per arm per day, about 3,000 per arm per week
days  <- 42     # the planned six weeks
p     <- 0.04   # BOTH arms convert at 4.0%: the redesign does nothing, by construction

one_aa <- function() {
  buys_a <- cumsum(rbinom(days, n_day, p))   # running conversions, control
  buys_b <- cumsum(rbinom(days, n_day, p))   # running conversions, variant
  n  <- (1:days) * n_day                     # running visitors per arm
  pa <- buys_a / n; pb <- buys_b / n
  se <- sqrt(pa * (1 - pa) / n + pb * (1 - pb) / n)
  2 * pnorm(-abs((pb - pa) / se))            # the p-value the dashboard shows each day
}

looks <- replicate(2000, one_aa())           # 2,000 null experiments, 42 daily looks each
```

`looks` is now a 42-by-2,000 grid: one column per null experiment, one row per morning. Score three levels of discipline on the same 2,000 experiments. The patient team looks once, at day 42. A second team checks every Monday, six looks. The dashboard team treats any green morning as the verdict.

```r
one_look <- mean(looks[42, ] < 0.05)                                       # look once, at the end
weekly   <- mean(apply(looks[c(7, 14, 21, 28, 35, 42), ] < 0.05, 2, any))  # six Monday looks
daily    <- mean(apply(looks < 0.05, 2, any))                              # react to any morning
round(c(one_look = one_look, six_weekly_looks = weekly, daily_looks = daily), 3)
#>         one_look six_weekly_looks      daily_looks
#>            0.043            0.143            0.302
```

One committed look delivers what \(\alpha\) promised: 4.3%, sampling wobble around the promised 5%. Six weekly looks nearly triple it to 14.3%. And the morning ritual turns a 1-in-20 error rate into 30.2%, almost one null redesign in three shipped as a winner. Correlation between looks did soften the independent-looks table (88% became 30%), but the verdict stands.

[KEY INSIGHT]
The daily p-value is not one verdict updating; it is 42 separate verdicts, and shipping on the first green one means your real false-winner rate is whatever the simulation says, not the 0.05 written in the plan. Day 9's p = 0.04 answers a question nobody meant to ask: did the dashboard ever dip?

=== step === quiz
::eyebrow Check yourself
## Day 9: the banner is green

Meera's checkout test is planned for 17,943 visitors per arm, about six weeks. On day 9 the dashboard shows p = 0.04 and a green significant banner. Her product manager wants to ship today and bank five weeks of traffic. What is the right call?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Ship it: the result crossed the 0.05 bar that was fixed at design time, and stopping early saves traffic ::no Stopping on the first green banner is exactly what the simulation priced: in a null world the dashboard dips under 0.05 at least once in about 30% of six-week tests. The 5% guarantee belongs to ONE look at the planned sample size, not to the best of 42 looks.
- Keep running to the planned sample size and test once at the end: day 9 is one of 42 chances for a null test to flash green ::ok Right. The design bought a 5% false-winner rate for a single committed look. If the 0.6-percentage-point lift is real, the 80%-power design will still see it at week six; if it is not, shipping today is how a do-nothing redesign gets celebrated.
- The test is contaminated now that someone has looked: throw the data away and restart ::no Looking changes nothing about the visitors or their conversions. Peeking only corrupts the test when a look becomes a STOP decision. Meera can watch the dashboard all six weeks, as long as the shipping decision waits for the planned look.

=== step === concept
::eyebrow The honest fixes
## If you must look, pay for each look

The cheapest fix costs nothing: decide the sample size in advance (Lesson 1), let the test run, look once. The dashboard can stay up as a health monitor; it just cannot be a stop button. That is the **fixed-horizon** discipline, and for most tests it is all you need.

Sometimes, though, early stopping has real value: a redesign that is losing money should be pulled fast, not politely observed for six weeks. There is an honest way to look early: **make every look stricter**, so that the whole procedure, all looks combined, still spends only 5% in total. The 2,000 null experiments you already simulated can price it. Ask: what bar would only 5% of null experiments EVER cross across six weekly looks? That is the 5th percentile of each experiment's best (smallest) p-value:

```r
weekly_p <- looks[c(7, 14, 21, 28, 35, 42), ]   # the six p-values a Monday checker sees
min_p    <- apply(weekly_p, 2, min)             # the best p each null experiment ever shows
round(quantile(min_p, 0.05), 4)
#>     5%
#> 0.0157
```

Demand p below 0.016 at every Monday look and the six-look procedure is back to an honest 5% overall:

```r
c(at_0.016 = mean(apply(weekly_p < 0.016, 2, any)),
  bonferroni = mean(apply(weekly_p < 0.05 / 6, 2, any)))
#>   at_0.016 bonferroni
#>     0.0515     0.0295
```

The second number is the Bonferroni correction, \(\alpha\) divided by the number of looks: valid, but it lands at 3% instead of 5% because it pretends the looks are independent when they share most of their data, and that overpayment comes straight out of power. What you just derived by simulation is the core idea of **group-sequential designs**: Pocock's classical bar for equally spaced looks sits right where your simulation put it, near 0.016, while the O'Brien-Fleming design spends the same budget unevenly, making early stops nearly impossible so the final look keeps almost full strength. The always-on version, **always-valid p-values** (the mSPRT of Johari and colleagues, in the references), is what serious A/B platforms compute so the number on a live dashboard is legitimate at every moment. All of these buy the same thing at the same price: every legitimate early exit is paid for with a stricter bar somewhere else.

=== step === concept
::eyebrow Pitfall 2: sample-ratio mismatch
## Check the denominator before the metric

Meera resists the banner, and week six arrives. The final screen: variant conversion 4.5%, control 4.0%, p = 0.019. Before anyone celebrates, read the two numbers everybody skips, the **denominators**: 18,321 visitors logged in control, 17,565 in variant. The design promised a 50/50 split. Is 51.1% against 48.9% ordinary coin-flip wobble across 35,886 visitors, or a broken split?

That question has an exact test, the **chi-square goodness-of-fit test**, which measures how far a set of observed counts sits from the counts a claimed distribution expects. With \(O_i\) the observed count in arm \(i\) and \(E_i\) the expected count (here 35,886 / 2 = 17,943 in each arm), the statistic is

\[ \chi^2 = \sum_i \frac{(O_i - E_i)^2}{E_i} \]

big when observed counts stray far from expectation, near zero when they match, compared against the chi-square distribution with degrees of freedom equal to the number of arms minus one. One line in R:

```r
visitors <- c(control = 18321, variant = 17565)
round(prop.table(visitors), 3)   # the split the log actually shows
#> control variant
#>   0.511   0.489

chisq.test(visitors, p = c(0.5, 0.5))
#>  Chi-squared test for given probabilities
#>
#> data:  visitors
#> X-squared = 15.926, df = 1, p-value = 6.585e-05
```

A fair 50/50 randomizer splitting 35,886 visitors produces an imbalance this large about 7 times in 100,000. The split is broken, and this failure has a name: **sample-ratio mismatch**, or SRM. Production experimentation platforms run this exact test on every experiment automatically, and they alarm at a stricter bar than usual: the convention is **p below 0.001**, so that across thousands of experiments an alarm means a near-certain bug rather than noise. Real SRM bugs usually land far below the bar anyway, like this one.

Where did 378 visitors go missing? Never at random. The usual suspects, all documented cases from the SRM literature:

- The variant page crashes on older phones **before the analytics event fires**, so those sessions never enter the log
- A redirect adds half a second to one arm only, and impatient visitors bail before being counted
- A bot filter runs in one arm's logging pipeline but not the other's
- Returning visitors get re-randomized instead of keeping their original arm

Notice what your eye said a moment ago: 51.1% against 48.9% looks like nothing. At experiment sample sizes, an imbalance far too small to see is still far too large to be chance. That is why the check must be a test, not a glance.

=== step === concept
::eyebrow The missing are not random
## How missing sessions manufacture a lift

Why is a 2% hole in one arm fatal rather than cosmetic? Because sessions that vanish from a pipeline never vanish at random, and non-random deletion moves the metric itself. Here is the cleanest way to see it. Take one batch of 18,000 raw sessions, no experiment anywhere, and run the SAME sessions through two logging pipelines: one logs everything, one silently drops bot traffic. Say bots are 8% of raw sessions, and bots never buy. Any difference between the two reported conversion rates is manufactured by the pipeline, because the sessions are literally identical.

```r
set.seed(9)
n_raw  <- 18000
is_bot <- rbinom(n_raw, 1, 0.08)                             # 8% of raw sessions are bots
buys   <- rbinom(n_raw, 1, ifelse(is_bot == 1, 0, 0.0435))   # bots never buy

round(c(logs_everything = mean(buys), drops_bots = mean(buys[is_bot == 0])), 4)
#> logs_everything      drops_bots
#>          0.0388          0.0422
```

Same sessions, zero true difference, and the bot-dropping pipeline reports conversion 0.34 percentage points higher: more than half of the 0.6pp lift Meera's entire six-week test was designed to detect, created by a logging filter. The mechanism is plain arithmetic. Deleting sessions that never convert shrinks the denominator while the numerator stays put, so the rate climbs. And the very same deletion dents the visitor count, which is exactly what the chi-square alarm hears:

```r
chisq.test(c(18000, sum(is_bot == 0)), p = c(0.5, 0.5))
#>  Chi-squared test for given probabilities
#>
#> data:  c(18000, sum(is_bot == 0))
#> X-squared = 60.683, df = 1, p-value = 6.706e-15
```

[WARNING]
An experiment with SRM cannot be rescued at analysis time. You cannot reweight the arms back to 50/50 or trim the bigger arm, because you do not know WHICH control sessions the variant pipeline would have dropped, and dropping at random is precisely what the bug did not do. Meera's week-six p = 0.019 is unreadable: maybe the redesign converts better, or maybe its crash on old phones deleted the shoppers least likely to buy. Find the cause, fix it, rerun the test. The Fabijan taxonomy in the references is the standard debugging checklist.

=== step === tryit
::eyebrow Your turn
## Audit the playlist test

The music app from Lesson 2 shipped its playlist experiment on a designed 50/50 split of sessions. The log shows **24,318 control sessions and 23,318 variant sessions**, and the playlist arm is showing a healthy lift in minutes listened. Before anyone reads that lift, run the SRM check: pass the two observed counts and the split the design promised. Fill in the four blanks.

```r
# Designed split: 50/50. Logged: 24,318 control sessions, 23,318 variant.
# Broken randomizer, or coin-flip wobble?
chisq.test(c(____, ____), p = c(____, ____))
```
::check {"regex":"chisq\\.test\\s*\\(\\s*c\\s*\\(\\s*(24318\\s*,\\s*23318|23318\\s*,\\s*24318)\\s*\\)\\s*,\\s*p\\s*=\\s*c\\s*\\(\\s*0?\\.50?\\s*,\\s*0?\\.50?\\s*\\)","gate":true,"difficulty":"intermediate","ok":"X-squared = 20.99, p-value = 4.6e-06, far below the 0.001 SRM bar. About a thousand variant sessions are missing non-randomly: no metric from this test can be trusted until the cause is found, fixed, and the test rerun.","no":"Two pieces: the observed counts c(24318, 23318) and the designed split p = c(0.5, 0.5). The test asks how surprising these counts would be if the true split really were 50/50."}
::solution
```r
chisq.test(c(24318, 23318), p = c(0.5, 0.5))
#>  Chi-squared test for given probabilities
#>
#> data:  c(24318, 23318)
#> X-squared = 20.993, df = 1, p-value = 4.611e-06
```

The verdict: a fair 50/50 split produces a gap this size about 5 times in a million. Roughly a thousand variant sessions are missing, not at random, so the minutes-listened lift is unreadable until the cause is found and the test rerun.

=== step === concept
::eyebrow Pitfall 3: interference
## When one visitor's treatment changes another's outcome

The checkout bug gets fixed, the rerun comes back clean, the redesign ships. Meera's next test is where the third pitfall lives. The plan: a referral banner, give 15 dollars, get 15 dollars, shown to a random half of the 40,000 loyalty members, with spend per member over the month as the metric. Asha lands in the treated arm, sees the banner, and sends a coupon to her friend Rohan. Rohan is a loyalty member too, and the randomizer put him in **control**. He spends his 15 dollars. A control member's outcome just changed because of a treatment he never saw.

Every comparison in this course so far leaned on an assumption so natural it was never said out loud: each member's outcome depends only on their OWN assignment. It has a name, **SUTVA**, the stable unit treatment value assumption. In symbols, if \(z_1, \dots, z_n\) are all the members' arm assignments and \(Y_i\) is member \(i\)'s outcome, SUTVA says

\[ Y_i(z_1, \dots, z_n) = Y_i(z_i) \]

member \(i\)'s spend is a function of member \(i\)'s own arm alone. The coupon in Rohan's inbox just falsified it. Here is the leak, end to end:

::widget process-flow {"steps":[{"title":"Assignment","sub":"the randomizer treats Asha and holds her friend Rohan in control"},{"title":"The leak","sub":"Asha sees the banner and sends Rohan a 15 dollar coupon"},{"title":"Contamination","sub":"Rohan, a control member, spends more because of the treatment"},{"title":"The verdict bends","sub":"control spend rises too, so the measured gap shrinks"}]}

Which way does the bias point? It depends entirely on what leaks:

- **The leak helps control** (coupons, shared discounts, copied habits): the control baseline rises, the measured gap shrinks, and the test **understates** the true effect. A genuinely profitable referral program can die in review as not significant.
- **The treatment starves control** (shared inventory, a shared ad budget, drivers on a delivery platform): treated members buy the popular shoes first and control members meet an out-of-stock page, so control falls and the test **overstates**. Ship that winner and the promised lift shrinks at full rollout, because there is no control arm left to take from.

And here is what makes interference the nastiest of the three pitfalls: **no alarm goes off**. The randomizer is healthy, the denominators match, the SRM check passes, and peeking discipline is beside the point. Nothing in the data announces the leak. You catch it by looking at the world, not the dashboard: whenever units share coupons, stock, budgets, feeds or friends, the individual member is the wrong unit to randomize. The fix is not a correction at analysis time; it is a different design, and it is the whole subject of the next lesson.

=== step === quiz
::eyebrow Check yourself
## Which way does the leak bend the verdict?

In the referral test, coupons sent by treated members land on control members and lift control spend. The randomizer is healthy and the SRM check passes. What does the standard treated-versus-control comparison do to the true effect of the referral program?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Overstates it: the treated arm gets credit for every coupon it sends ::no The coupons LAND in control, so it is control spend that rises. The comparison subtracts control from treated, and an inflated baseline pulls the measured difference DOWN, not up.
- Understates it: control members were partly treated, so the baseline rises and the measured gap shrinks ::ok Right. The comparison needs an untouched baseline, and the leak contaminated it upward, so a genuinely profitable program can come back not significant. The opposite leak, treatment draining shared inventory that control also needs, overstates instead. The direction follows the plumbing, which is why you map who shares what before trusting the number.
- Nothing: randomization made the arms comparable, so spillover averages out across thousands of members ::no Randomization balances who STARTS in each arm; it cannot stop a coupon from crossing arms after assignment. Averaging over more members does not cancel a leak that flows systematically one way, from treated senders to control receivers.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Kohavi, Tang and Xu (2020), Trustworthy Online Controlled Experiments](https://experimentguide.com/) - the industry playbook; its pitfalls chapters cover peeking, SRM and Twyman's law (the more surprising a result, the more likely it is an error) with production war stories.
- [Fabijan et al. (2019), Diagnosing Sample Ratio Mismatch in Online Controlled Experiments, KDD](https://dl.acm.org/doi/10.1145/3292500.3330722) - the SRM taxonomy from Microsoft: real root causes, the p below 0.001 convention, and a debugging checklist.
- [Johari, Koomen, Pekelis and Walsh (2017), Peeking at A/B Tests, KDD](https://dl.acm.org/doi/10.1145/3097983.3097992) - always-valid p-values, the fix that lets a live dashboard be watched continuously.
- [Evan Miller, How Not To Run an A/B Test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html) - the essay that made peeking famous among practitioners, with worked false-winner arithmetic.
- [Lakens, Improving Your Statistical Inferences: Sequential Analysis](https://lakens.github.io/statistical_inferences/10-sequential.html) - an open textbook chapter on doing it properly: Pocock and O'Brien-Fleming bounds, alpha spending, and stopping rules.

=== step === complete
## Lesson 3 complete

Meera's day-9 green banner was one of 42 chances to be fooled: in a null world, the morning ritual flags a false winner 30% of the time, against the 4.3% a single committed look costs. The week-six result died for a different reason: a 51.1/48.9 split that eyeballs call fine and the chi-square test calls broken, at p around 7 in 100,000, because the variant's crash was deleting exactly the sessions least likely to buy. And the referral test never triggered an alarm at all: coupons leaking from Asha to Rohan lifted the control baseline and shrank the measured gap while every automated check stayed green.

The discipline that survives all three: fix the sample size and the analysis plan in advance and look once, or pay for extra looks with a stricter bar; test the denominators before the metric, alarming at 0.001; and ask who shares what with whom before trusting the unit of randomization. Peeking and SRM have statistical fixes. Interference does not; it needs a different design. Next, Lesson 4: Cluster and Switchback Experiments, randomizing groups and time blocks so the units that interfere stay on the same side of the split.

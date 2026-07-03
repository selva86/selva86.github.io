---
title: "Experimentation Lesson 2: Variance Reduction with CUPED"
catalog_blurb: "Get tighter A/B results from the traffic you already have."
description: "CUPED from scratch: shrink the variance of an A/B estimate with pre-experiment data, zero bias, the 1 minus rho squared identity, and stratification in R."
keywords: "CUPED, variance reduction, A/B testing, pre-experiment data, covariate adjustment, regression adjustment, stratification, experiment sensitivity, online experiments, R"
post_type: "LESSON"
curriculum_id: "6.170.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "2"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: "Experiment-Pitfalls-Peeking-and-SRM.html"
course_prev: "Designing-Experiments-for-Power.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Variance Reduction with CUPED

Lesson 1 ended with an ugly bill. At Meera's traffic, an 80%-power test of a 0.6pp checkout lift costs six weeks, and a 0.3pp lift costs twenty-three. This lesson is about the lever that does not appear on that bill: the noise itself.

Meera's next test runs on the store's loyalty program: a personalized "Picked for you" shelf, shown to 2,000 randomly chosen members for a month while 2,000 others see the current site. The metric is spend per member over the test month (baseline about $68, and it varies wildly from member to member). The hoped-for lift is about $2.50 per member, worth roughly $100,000 a month if the shelf rolls out to all 40,000 members.

One new fact changes everything: loyalty members are logged in, so Meera already knows what **each member spent in the month before the test**. CUPED (Controlled-experiment Using Pre-Experiment Data, invented at Microsoft in 2013 and now standard in most large experimentation platforms) uses that pre-period data to cancel noise the experiment never needed to carry, with zero bias.

By the end of this lesson you will be able to:

- Say where the spread in an A/B metric comes from, and why last month's data predicts most of it
- Apply the CUPED adjustment in base R and report the tighter confidence interval
- Predict the variance cut from the pre-period correlation, using the 1 minus rho squared identity
- Spot the covariates that would bias the estimate, and the ones that would not help at all

**Prerequisites:** Lesson 1 of this course ([Designing Experiments for Power](Designing-Experiments-for-Power.html)) for power, standard errors and sample-size arithmetic; correlation as a number between -1 and 1 ([Correlation in R](Correlation-in-R.html)); and the two-sample comparison itself ([Comparing groups with t-tests](Comparing-Groups-with-t-tests.html)).

::widget cuped-variance {}

=== step === concept
::eyebrow Where the noise lives
## The noise you already knew about

Meet three of Meera's members. Asha buys shoes for her whole family: $182 last month. Dev is a once-a-season browser: $9. Priya sits near the middle: $48. Here is what the three of them spent across two ordinary back-to-back months, no experiment anywhere in sight:

| Member | Last month | This month |
|---|---|---|
| Asha | $182 | $146 |
| Priya | $48 | $51 |
| Dev | $9 | $35 |

Look at the two kinds of gaps. Within one member, month to month, spend wobbles by a few tens of dollars. Between members, the gap is enormous: Asha and Dev sit more than $130 apart in both months. The member-to-member spread is what makes \(\sigma\) (sigma, the standard deviation of the metric, about $40 across Meera's full membership) so large, and Lesson 1 showed that the required sample size grows with \(\sigma^2 / \Delta^2\), where \(\Delta\) (Delta) is the raw lift you want to detect, $2.50 for the shelf. A $2.50 signal hiding in a $40-wide crowd is exactly why tests need thousands of members.

But that spread is not mystery noise. Heavy spenders stay heavy, light spenders stay light. Below are 24 of Meera's members, last month's spend against this month's, and the pattern is a rising line: the correlation is about 0.7. Most of "this month's spread" was already written down in last month's column.

::widget chart-plotter {"data":[{"x":13,"y":21},{"x":132,"y":102},{"x":20,"y":36},{"x":20,"y":42},{"x":9,"y":35},{"x":33,"y":55},{"x":32,"y":63},{"x":25,"y":131},{"x":37,"y":41},{"x":56,"y":46},{"x":23,"y":35},{"x":15,"y":28},{"x":23,"y":47},{"x":41,"y":44},{"x":36,"y":69},{"x":24,"y":28},{"x":99,"y":89},{"x":52,"y":43},{"x":59,"y":76},{"x":32,"y":28},{"x":48,"y":51},{"x":182,"y":146},{"x":86,"y":65},{"x":32,"y":50}],"geoms":["point"],"x":"last_month","y":"this_month"}

The part of this month's spend that last month already predicted is not noise the experiment has to live with. It is pre-existing differences between members, and anything predictable can be subtracted.

=== step === concept
::eyebrow The adjustment
## Subtract the predictable part

Start with Asha, not with algebra. Suppose that across all members, every extra pre-period dollar comes with about 0.6 extra dollars this month (that 0.6 is a slope we will estimate in a moment), and the average pre-period spend is about $54. Asha's $182 sits $128 above that average, so before the shelf even existed, we expected her to land about \(0.6 \times 128 \approx \$77\) above a typical member this month. CUPED simply subtracts that expected surplus from her outcome. Dev sits $45 below average, so CUPED adds back \(0.6 \times 45 \approx \$27\) to his:

| Member | Raw this-month spend | Predictable part | CUPED-adjusted spend |
|---|---|---|---|
| Asha | $146 | +$77 | $69 |
| Priya | $51 | -$4 | $55 |
| Dev | $35 | -$27 | $62 |

Raw, the three sat $111 apart. Adjusted, they huddle within $14 of each other. Nothing about the shelf's effect was touched; we only removed the spread that last month had already explained.

Now the same thing in symbols. Call the outcome \(Y\) (this month's spend) and the pre-period covariate \(X\) (last month's spend). The slope is

\[ \theta = \frac{\operatorname{Cov}(Y, X)}{\operatorname{Var}(X)} \]

where \(\operatorname{Cov}(Y, X)\) (the covariance) measures how strongly the two move together in their original dollar units, \(\operatorname{Var}(X)\) is the covariate's variance, and \(\theta\) (theta) is exactly the least-squares slope you would get from regressing \(Y\) on \(X\): the extra outcome dollars that ride along with one extra covariate dollar. The adjusted outcome for each member is

\[ Y^{\text{cuped}} = Y - \theta \, (X - \bar{X}) \]

with \(\bar{X}\) the average pre-period spend across everyone. Subtracting the *centered* term \((X - \bar{X})\), rather than \(X\) itself, means the average adjustment is zero, so the metric keeps its scale: adjusted spend still averages about $68 and still reads in dollars.

Why is this bias-free? Because \(X\) was measured **before anyone was randomized**. The shelf cannot reach back in time and change last month's spend, and randomization gave both arms the same distribution of \(X\). We are subtracting a quantity whose average is the same in treatment and control, and subtracting the same thing from both sides of a comparison cannot move the difference. The lift estimate stays honest; only its wobble shrinks.

=== step === quiz
::eyebrow Check yourself
## A tempting, terrible covariate

A teammate looks at Meera's plan and offers an upgrade: "Last-month spend only correlates 0.7 with the outcome. The number of store visits **during the test month** correlates 0.9. Adjust by that instead." What is wrong with the upgrade?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong: the stronger the correlation, the bigger the variance cut, so 0.9 beats 0.7 ::no The variance arithmetic is real, but it only holds for a covariate the treatment cannot touch. Visits during the test fail that condition, and the bias they introduce is worse than any variance they remove.
- The shelf itself can change how often members visit during the test, so adjusting by visits subtracts part of the real effect: the estimate becomes biased ::ok Exactly. A good shelf might work precisely BY drawing extra visits. Adjust those away and the lift estimate shrinks toward zero for the worst possible reason. The covariate must be locked in before randomization; that is the P in CUPED.
- Visit counts measured during the test are too noisy for the correlation to hold up ::no Noise is not the issue, timing is. A during-test covariate can be measured perfectly and still poison the estimate, because the treatment can move it.

=== step === concept
::eyebrow See it work
## Watch the interval shrink

Time to run Meera's test. We will simulate it, exactly as in Lesson 1, so that we know the truth: the shelf's true lift is **exactly $2.50** by construction, and we get to watch two estimators chase it, one raw, one CUPED. First, build the 4,000 members: last month's spend, then this month's spend, which is partly predicted by last month (that is where the correlation comes from) plus fresh noise plus the lift for the treated arm.

```r
set.seed(46)
n_arm <- 2000
pre   <- round(rlnorm(2 * n_arm, meanlog = 3.7, sdlog = 0.75), 2)  # last month's spend
arm   <- rep(0:1, each = n_arm)          # 0 = current site, 1 = "Picked for you" shelf
spend <- round(0.6 * pre + rlnorm(2 * n_arm, meanlog = 3.3, sdlog = 0.7) + 2.5 * arm, 2)

round(c(control_mean = mean(spend[arm == 0]), sd = sd(spend),
        cor_with_pre = cor(spend, pre)), 2)
#> control_mean           sd cor_with_pre
#>        67.70        39.55         0.69
```

A $68 baseline, a $40 spread, and a pre-period correlation of 0.69: Meera's world, in numbers. Here is the ordinary analysis, the difference in arm means with its standard error (Lesson 1's machinery):

```r
d_raw  <- mean(spend[arm == 1]) - mean(spend[arm == 0])
se_raw <- sqrt(var(spend[arm == 1]) / n_arm + var(spend[arm == 0]) / n_arm)
round(c(lift = d_raw, se = se_raw,
        ci_lo = d_raw - 1.96 * se_raw, ci_hi = d_raw + 1.96 * se_raw), 2)
#>  lift    se ci_lo ci_hi
#>  2.18  1.25 -0.27  4.64
```

The confidence interval runs from -$0.27 to $4.64. It contains zero, so after a month and 4,000 members the honest raw verdict is *maybe*. And remember, the true lift is $2.50; the estimate 2.18 missed it only by sampling wobble. Now the CUPED version of the same data: estimate the slope, subtract the predictable part, and rerun the identical comparison on the adjusted spend.

```r
theta   <- cov(spend, pre) / var(pre)     # the slope of spend on pre-period spend
spend_c <- spend - theta * (pre - mean(pre))

d_c  <- mean(spend_c[arm == 1]) - mean(spend_c[arm == 0])
se_c <- sqrt(var(spend_c[arm == 1]) / n_arm + var(spend_c[arm == 0]) / n_arm)
round(c(theta = theta, lift = d_c, se = se_c,
        ci_lo = d_c - 1.96 * se_c, ci_hi = d_c + 1.96 * se_c), 2)
#> theta  lift    se ci_lo ci_hi
#>  0.59  2.55  0.90  0.79  4.32
```

Same members, same month, same truth. The interval is now $0.79 to $4.32: zero is out, the verdict is *the shelf works*. The standard error fell from 1.25 to 0.90 because the adjustment removed the spread that last month's spend had already explained.

[KEY INSIGHT]
CUPED did not nudge the estimate toward significance. Raw (2.18) and CUPED (2.55) are both unbiased estimates of the same true $2.50; run the simulation a thousand times and both average out to 2.50. The only thing CUPED changes is the wobble around the truth, and a smaller wobble is precisely what lets the same data speak more clearly.

=== step === concept
::eyebrow The exact price of noise
## The 1 minus rho squared identity

How much variance does the adjustment remove? There is an exact answer, and it is one line. If \(\rho\) (rho) is the correlation between the outcome \(Y\) and the pre-period covariate \(X\), then

\[ \operatorname{Var}\!\left(Y^{\text{cuped}}\right) = \left(1 - \rho^2\right) \operatorname{Var}(Y) \]

The variance of the adjusted metric is the raw variance times \(1 - \rho^2\), because \(\rho^2\) is exactly the share of the outcome's variance the covariate can explain, and that is the share CUPED deletes. Standard errors scale with the square root, so the CI narrows by a factor of \(\sqrt{1 - \rho^2}\). Our simulation obeys the identity to the second decimal:

```r
round(c(observed_ratio = se_c / se_raw,
        predicted = sqrt(1 - cor(spend, pre)^2)), 2)
#> observed_ratio      predicted
#>           0.72           0.72
```

Toggle the correlation strength below and watch what each level of \(\rho\) buys. At 0.3 the CI barely moves; at 0.85 it collapses to half its width. The interactive computes the exact factor and hands you the matching base R.

::widget cuped-variance {}

The identity converts directly into Lesson 1's currency: sample size. A variance cut of \(\rho^2\) means the same power at \((1 - \rho^2)\) times the members, equivalently \(1 / (1 - \rho^2)\) times the effective sample for free. Size Meera's shelf test both ways, using the $39.60 spread we measured and `power.t.test()` from Lesson 1:

```r
rho <- 0.7
n_raw   <- power.t.test(delta = 2.5, sd = 39.6, power = 0.80)$n
n_cuped <- power.t.test(delta = 2.5, sd = 39.6 * sqrt(1 - rho^2), power = 0.80)$n
round(c(per_arm_raw = n_raw, per_arm_cuped = n_cuped))
#>   per_arm_raw per_arm_cuped
#>          3940          2010
```

Eighty percent power costs 3,940 members per arm raw, and 2,010 with CUPED: the pre-period column just paid for half the experiment. The scaling is worth memorizing at both ends. A weak covariate (\(\rho = 0.2\)) cuts variance by only 4%, barely worth the code; a strong one (\(\rho = 0.9\)) cuts 81%, five experiments for the price of one. Hunting for a strongly correlated pre-period covariate is one of the most valuable hours an experimenter can spend, and the best candidate is almost always the same metric, measured before the test.

=== step === tryit
::eyebrow Your turn
## CUPED a music app's test

Transfer the pattern to a new company. A music app is testing a new playlist algorithm on 1,000 members; the outcome `minutes` is minutes listened during the test, and `pre_min` is each member's minutes in the month before. Build the CUPED adjustment: the slope first, then the centered subtraction. Fill in the four blanks.

```r
# pre_min = minutes listened last month; minutes = minutes during the test.
set.seed(11)
pre_min <- rlnorm(1000, meanlog = 4, sdlog = 0.6)
minutes <- 30 + 0.9 * pre_min + rnorm(1000, 0, 25)

# theta is the slope of the outcome on the pre-period covariate: cov over var.
theta <- ____ / ____
min_c <- minutes - theta * (____ - mean(____))
```
::check {"regex":"cov\\s*\\(\\s*(minutes\\s*,\\s*pre_min|pre_min\\s*,\\s*minutes)\\s*\\)\\s*/\\s*var\\s*\\(\\s*pre_min\\s*\\)[\\s\\S]*minutes\\s*-\\s*theta\\s*\\*\\s*\\(\\s*pre_min\\s*-\\s*mean\\s*\\(\\s*pre_min\\s*\\)","gate":true,"difficulty":"intermediate","ok":"theta = cov(minutes, pre_min) / var(pre_min), then subtract theta times the centered pre-period. Here the correlation is about 0.85, so the adjusted spread is 0.53 of the raw spread: the same precision from roughly a third of the members.","no":"Two pieces: theta <- cov(minutes, pre_min) / var(pre_min), and the centered subtraction min_c <- minutes - theta * (pre_min - mean(pre_min)). The covariate in every blank is pre_min, the PRE-period metric."}
::solution
```r
set.seed(11)
pre_min <- rlnorm(1000, meanlog = 4, sdlog = 0.6)
minutes <- 30 + 0.9 * pre_min + rnorm(1000, 0, 25)

theta <- cov(minutes, pre_min) / var(pre_min)
min_c <- minutes - theta * (pre_min - mean(pre_min))
round(c(sd_raw = sd(minutes), sd_cuped = sd(min_c),
        ratio = sd(min_c) / sd(minutes),
        predicted = sqrt(1 - cor(minutes, pre_min)^2)), 2)
#>    sd_raw  sd_cuped     ratio predicted
#>     46.61     24.87      0.53      0.53
```

=== step === concept
::eyebrow Same trick, other clothes
## Stratification and the lm() one-liner

Meera shows the CUPED result to her boss, who distrusts formulas but trusts segments: "Just compare shelf members to control members *within* light, medium and heavy spenders, then average the three answers." That instinct has a name, **stratification**: split members into strata by a pre-period label, estimate the lift inside each stratum, and combine the estimates weighted by stratum size. Comparing Asha only to other heavy spenders means the huge between-segment spread never enters the comparison. It is CUPED's cousin for categorical covariates. Run the boss's version, with terciles of pre-period spend as the three strata, on the members you simulated earlier:

```r
stratum <- cut(pre, quantile(pre, c(0, 1/3, 2/3, 1)),
               labels = c("light", "medium", "heavy"), include.lowest = TRUE)
d_s <- tapply(spend[arm == 1], stratum[arm == 1], mean) -
       tapply(spend[arm == 0], stratum[arm == 0], mean)
w   <- as.numeric(table(stratum)) / length(stratum)
vt  <- tapply(spend[arm == 1], stratum[arm == 1], var)
vc  <- tapply(spend[arm == 0], stratum[arm == 0], var)
nt  <- as.numeric(table(stratum[arm == 1]))
nc  <- as.numeric(table(stratum[arm == 0]))
se_s <- sqrt(sum(w^2 * (vt / nt + vc / nc)))
round(c(lift = sum(w * d_s), se = se_s), 2)
#> lift   se
#> 1.93 1.07
```

The stratified standard error, 1.07, lands between raw (1.25) and CUPED (0.90). Three coarse buckets capture part of what the pre-period knows, but a continuous covariate carries more information than any handful of bins, which is why platforms reach for CUPED when the covariate is numeric and for stratification when it is naturally categorical (country, platform, new vs returning), or when they balance arms at assignment time.

There is also a one-line version of CUPED that you already know from the regression lessons: put the covariate in a linear model next to the treatment indicator.

```r
round(summary(lm(spend ~ arm + pre))$coefficients["arm", 1:2], 2)
#>   Estimate Std. Error
#>       2.55       0.90
```

Identical to CUPED to two decimals: estimate 2.55, standard error 0.90. CUPED *is* regression adjustment wearing production clothes (Lin 2013, in the references, is the careful account of why this is safe in randomized experiments). The full scoreboard for one month of Meera's data:

```r
round(c(raw = se_raw, three_buckets = se_s, cuped = se_c), 2)
#>           raw three_buckets         cuped
#>          1.25          1.07          0.90
```

=== step === concept
::eyebrow Limits
## When CUPED cannot help

CUPED is a discount, not a miracle, and it has exactly three failure modes worth knowing cold:

1. **No pre-period.** A member who joined last week has no last-month spend. The standard fix is to set their covariate to the overall mean \(\bar{X}\), which makes their adjustment exactly zero: they keep their raw variance, and CUPED helps only the returning share of the sample. A test on brand-new signups gets nothing from CUPED, because nothing pre-dates them.
2. **A weak covariate.** At \(\rho = 0.2\) the cut is \(1 - 0.2^2\), just 4%. Harmless, but not worth engineering effort. If the same metric measured pre-period correlates weakly (a highly volatile metric, a long gap between periods), look for a better window before looking for a cleverer formula.
3. **A covariate the treatment can move.** The quiz case. Anything measured after randomization is off the table, however strong its correlation, because adjusting by it bleeds real effect into the correction.

[WARNING]
Decide the covariate, and the fact that you will adjust at all, in the analysis plan BEFORE results exist. Trying five covariates after the fact and reporting the prettiest interval is not variance reduction, it is fishing, the exact family of sins Lesson 3 is about. Locked in advance, CUPED is bias-free; chosen by outcome, nothing is.

And keep Lesson 1's arithmetic in view: at \(\rho = 0.7\) CUPED halves the required sample. It turns Meera's 23-week nightmare into 11 weeks, not into 2. When a design is hopeless, the answer is still a bigger effect, more traffic, or a humbler question.

=== step === quiz
::eyebrow Check yourself
## Pick the covariate

Meera's next experiment is a loyalty-points revamp, with spend per member as the outcome again. Three covariates are on the table: **(a)** last-month spend, correlation 0.7 with the outcome; **(b)** account age in days, correlation 0.2; **(c)** sessions during the test month, correlation 0.9. Which one should she adjust by, and what does it buy?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Sessions during the test: at rho 0.9 the identity promises an 81% variance cut, the biggest on offer ::no The identity only applies to covariates the treatment cannot touch, and a points revamp can easily change how often members visit DURING the test. Timing first, correlation second: (c) is the biased choice from this lesson's quiz, back for a second try.
- Last-month spend: 1 minus 0.7 squared removes about half the variance, so the test needs roughly half the members, and the lift estimate itself stays unbiased ::ok Right on all three counts. Pre-period, strongly correlated, and the adjustment narrows the interval by a factor of sqrt(0.51), about 0.71, without moving the estimate on average. The best covariate is almost always the outcome metric itself, measured before the test.
- Account age: it is barely related to spend, which makes it the safest adjustment ::no It is safe (it is pre-period), but safety was never the scarce resource; last-month spend is equally untouchable by the treatment. At rho 0.2 the cut is 4%. Safety comes from timing; the SIZE of the win comes from correlation.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Deng, Xu, Kohavi and Walker (2013), Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data, WSDM](https://dl.acm.org/doi/10.1145/2433396.2433413) - the paper that introduced CUPED at Microsoft, with the identity and the original Bing results.
- [Kohavi, Tang and Xu (2020), Trustworthy Online Controlled Experiments](https://experimentguide.com/) - the industry playbook; its sensitivity chapter covers variance reduction as run in production.
- [Lin (2013), Agnostic notes on regression adjustments to experimental data, Annals of Applied Statistics](https://doi.org/10.1214/12-AOAS583) - the careful theory of when and why regression adjustment is safe in randomized experiments.
- [Microsoft Experimentation Platform, Deep dive into variance reduction](https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/articles/deep-dive-into-variance-reduction/) - the team that invented CUPED on deploying it: covariate choice, missing pre-periods, and pitfalls.

=== step === complete
## Lesson 2 complete

Same members, same month, same truth: the raw analysis said *maybe* (-$0.27 to $4.64) and CUPED said *the shelf works* ($0.79 to $4.32), because subtracting the predictable part of each member's spend removed the noise the pre-period had already explained. You can now build the adjustment in three lines of base R, predict its payoff exactly with \(1 - \rho^2\), get the same answer from `lm(spend ~ arm + pre)`, and refuse the covariates that would poison it: anything the treatment can move, anything without a pre-period, anything barely correlated.

You also just made experiments cheaper, which makes running them carelessly more tempting than ever. Next, Lesson 3: Experiment Pitfalls, Peeking and SRM. The three ways online experiments lie: checking the p-value every morning until it dips, randomizers that quietly break, and users who interfere with each other's treatments.

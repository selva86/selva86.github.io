---
title: "Experimentation Lesson 2: Variance Reduction with CUPED"
catalog_blurb: "Detect smaller effects from the same sample by removing predictable noise."
description: "CUPED from scratch: use pre-experiment data to shrink an A/B estimate's variance with zero bias, the 1 minus rho-squared identity, and stratification, in base R."
keywords: "CUPED, variance reduction, pre-experiment data, covariate adjustment, ANCOVA, A/B testing, controlled experiments, regression adjustment, stratification, experiment sensitivity, R"
post_type: "LESSON"
curriculum_id: "6.170.2"
webr: true
mathjax: true
lesson_access: "free"
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

In Lesson 1, Meera hit a wall: at her store's traffic, a small checkout lift needed weeks of collecting data before the test had enough power to see it. This lesson is about the escape hatch. There is a way to make the very same experiment far more sensitive, using data you already collected before the test even started, and it changes nothing about how you randomize.

By the end you will be able to:

- Explain where the noise in an A/B metric comes from, and why data from before the test predicts most of it
- Apply the CUPED adjustment in base R, and report the tighter confidence interval it buys
- Predict the variance cut from a single number (the correlation) and translate it into the sample size you save
- Recognize when the adjustment is invalid or useless, so you never fool yourself with it

**Prerequisites:** Lesson 1 ([Designing Experiments for Power](Designing-Experiments-for-Power.html)) for power and the standard error of a difference in means; the A/B test and the p-value ([A/B Testing and Experiment Design](AB-Testing-and-Experiment-Design.html), [Reading an Experiment](Reading-an-Experiment.html)); and a two-sample comparison in a little base R ([Comparing groups with t-tests](Comparing-Groups-with-t-tests.html)).

::widget cuped-variance {}

=== step === concept
::eyebrow The problem
## Where the noise in your metric comes from

Meera's next test is not about conversion. She wants to know whether a new "Picked for you" shelf lifts **spend per member** over the test month. She shows it to 4,000 randomly chosen loyalty members, 2,000 per arm, and hopes for about a **$2.50** lift per member, worth roughly $100,000 a month across her 40,000-member base.

Here is the trouble. Members are wildly different from each other. Look at three of them, and at what each spent the month before the test:

| Member | Last month | This month |
|---|---|---|
| Priya | $60 | $54 |
| Sam | $17 | $37 |
| Dana | $28 | $56 |

Priya is a big spender every month; Sam is a small one. That gap between members has nothing to do with the shelf, yet it dwarfs a $2.50 effect. Across all 4,000 members, spend swings by about $39 (one standard deviation) from person to person. It is like trying to hear a whisper in a stadium.

But notice something in the table. For Priya and Sam, this month looks a lot like last month. The member-to-member spread is not random churn; it is **stable**, and last month's spend already tells us most of it. Only Dana surprises us: normally a small spender, she splurged this month. That leftover surprise is the part we truly cannot predict.

=== step === concept
::eyebrow The signal in the past
## Last month predicts this month

Plot every member's spend the month **before** the test against their spend **during** it. Each dot is one member. The two are strongly related: members who spent a lot before tend to spend a lot now.

::widget chart-plotter {"data":[{"x":28,"y":56},{"x":37,"y":34},{"x":36,"y":46},{"x":14,"y":35},{"x":72,"y":54},{"x":37,"y":48},{"x":28,"y":43},{"x":44,"y":45},{"x":61,"y":56},{"x":29,"y":29},{"x":27,"y":45},{"x":60,"y":54},{"x":17,"y":37},{"x":70,"y":90},{"x":56,"y":58},{"x":29,"y":33},{"x":47,"y":72},{"x":39,"y":56}],"geoms":["point"],"x":"last_month","y":"this_month","code":{"point":"ggplot(members, aes(last_month, this_month)) +\n  geom_point()"}}

The strength of that relationship is one number, the correlation \(\rho\) (rho), which runs from 0 (no relationship) to 1 (perfect). Here \(\rho\) is about **0.70**. That is the whole opportunity: about half of the outcome's variance (\(\rho^2 \approx 0.49\)) is already explained by a number Meera knew before the test began. If we could subtract that predictable part out of each member's result, the metric would get quieter, and a quieter metric is a more sensitive test. That subtraction is exactly what CUPED does.

=== step === quiz
::eyebrow Check yourself
## Why is the past so useful?

Meera notices that each member's spend last month correlates 0.70 with their spend this month. Why does that fact help her measure the shelf's effect?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Because a 0.70 correlation means the shelf is already working ::no The correlation is between last month and this month for the SAME member; it says nothing about the shelf. It is measured before the test even matters.
- Because we can predict, and then subtract, the large chunk of each member's spend that their history already explains, leaving a less noisy metric ::ok Right. The predictable part is noise for our purposes (it has nothing to do with the shelf), and we can strip it out, which is exactly what makes the test more sensitive.
- Because it means Meera can drop the big spenders and shrink the sample ::no Dropping members would throw away data and could bias the result. CUPED keeps everyone; it only removes the predictable part of each person's outcome.

=== step === concept
::eyebrow The method
## The CUPED adjustment

CUPED (Controlled-experiment Using Pre-Experiment Data) replaces each member's raw outcome with an adjusted one: the outcome minus the part their pre-period covariate predicts. Let:

- \(Y\) be the outcome (this month's spend),
- \(X\) be the pre-period covariate (last month's spend),
- \(\bar{X}\) be the average of \(X\) across all members.

The adjusted metric is

\[ Y_{\text{cuped}} = Y - \theta\,(X - \bar{X}) \]

where \(\theta\) (theta) is how many extra outcome-dollars each covariate-dollar predicts, the slope of \(Y\) on \(X\):

\[ \theta = \frac{\mathrm{Cov}(Y, X)}{\mathrm{Var}(X)} \]

Here \(\mathrm{Cov}(Y,X)\) is the covariance (how \(Y\) and \(X\) move together) and \(\mathrm{Var}(X)\) is the variance of the covariate. For Meera, \(\theta \approx 0.60\): every dollar a member spent above average last month predicts about 60 cents above average this month.

Work it on Priya. The average member spent \(\bar{X} \approx \$53\) last month; Priya spent $60, about $7 above average. So \(\theta(X - \bar{X}) = 0.60 \times 7 \approx \$4\) of her spend was expected from her history. CUPED subtracts it: her adjusted spend is about \(54 - 4 = \$50\). We do this for every member. Because we subtract the centered term \((X - \bar{X})\), which averages to zero, the overall mean of the metric barely moves, so the estimate of the shelf's effect stays honest. Only the noise shrinks.

=== step === quiz
::eyebrow Check yourself
## Which covariate is allowed?

Meera has two numbers that both correlate with a member's test-month spend. Which one is safe to use as the CUPED covariate \(X\)?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each member's spend the month BEFORE the test ::ok Correct. It was fixed before anyone was assigned an arm, so the shelf cannot have touched it. Subtracting it cannot distort the effect you are measuring.
- Each member's number of support chats DURING the test, which correlates even more strongly ::no This is measured after treatment starts, so the shelf can change it. Adjusting for a post-treatment variable soaks up part of the real effect and biases your answer, no matter how strong the correlation.
- Either one works, as long as the correlation with spend is high ::no Correlation strength is not the test. The covariate must be measured BEFORE randomization; a strong post-treatment covariate is the classic way to bias a CUPED result.

=== step === concept
::eyebrow See it work
## The same test, before and after

Let us run Meera's experiment in code. First we simulate 4,000 members: their pre-period spend, then this month's spend built to correlate about 0.70 with it, plus a true $2.50 lift for the shelf arm. Each lesson runs in a fresh R session, so build the data once here.

```r
set.seed(481)
n     <- 4000
arm   <- rep(0:1, each = n / 2)                       # 0 = old store, 1 = new shelf
pre   <- rlnorm(n, 3.7, 0.75)                         # $ each member spent the month BEFORE
spend <- 0.6 * pre + rlnorm(n, 3.3, 0.70) + 2.5 * arm # this month's spend; true lift = $2.50
g     <- n / 2

# raw estimate: plain difference in mean spend, with its 95% interval
raw_lift <- mean(spend[arm == 1]) - mean(spend[arm == 0])
raw_se   <- sqrt(var(spend[arm == 1]) / g + var(spend[arm == 0]) / g)
round(c(lift = raw_lift, se = raw_se,
        lo = raw_lift - 1.96 * raw_se, hi = raw_lift + 1.96 * raw_se), 2)
#>  lift    se    lo    hi
#>  2.07  1.22 -0.33  4.46
```

The raw interval runs from **-0.33 to 4.46**. It straddles zero, so the plain test cannot even tell whether the shelf helped or hurt. Now apply CUPED with last month's spend and re-measure:

```r
theta <- cov(spend, pre) / var(pre)          # slope of this month on last month
adj   <- spend - theta * (pre - mean(pre))   # strip the predictable part, keep the mean

cup_lift <- mean(adj[arm == 1]) - mean(adj[arm == 0])
cup_se   <- sqrt(var(adj[arm == 1]) / g + var(adj[arm == 0]) / g)
round(c(lift = cup_lift, se = cup_se,
        lo = cup_lift - 1.96 * cup_se, hi = cup_lift + 1.96 * cup_se), 2)
#> lift   se   lo   hi
#> 2.10 0.87 0.39 3.80
```

[KEY INSIGHT]
The point estimate barely moved ($2.07 to $2.10), but the confidence interval shrank from a width of 4.8 to 3.4 and now sits entirely above zero. The shelf always helped; CUPED did not change the answer, it sharpened it enough to see. That is variance reduction: same data, same randomization, a clearer result.

=== step === widget
::eyebrow How much it buys
## The one minus rho-squared rule

How much CUPED helps depends only on \(\rho\), the pre-period correlation. Drag the toggle and watch the confidence interval collapse as the correlation grows.

::widget cuped-variance {}

The exact rule is clean. With the best coefficient \(\theta\), the adjusted metric's variance is the original variance scaled by \(1 - \rho^2\):

\[ \mathrm{Var}(Y_{\text{cuped}}) = (1 - \rho^2)\,\mathrm{Var}(Y) \]

So the standard error, and the width of the confidence interval, shrink by \(\sqrt{1 - \rho^2}\). At Meera's \(\rho = 0.70\) that factor is \(\sqrt{1 - 0.49} \approx 0.71\), a 29% narrower interval, which matches the run above ($1.22 down to $0.87). And there is an even more useful way to read it: a variance cut of \(1 - \rho^2\) is worth the same as multiplying your sample by \(\frac{1}{1 - \rho^2}\). Tie it back to Lesson 1's sample-size math:

```r
# how many members per arm does each design need for 80% power?
rho <- cor(pre, spend)
round(power.t.test(delta = 2.5, sd = sd(spend),                  power = 0.8)$n)  # raw metric
round(power.t.test(delta = 2.5, sd = sd(spend) * sqrt(1 - rho^2), power = 0.8)$n)  # CUPED metric
#> [1] 3761
#> [1] 1896
```

The raw metric needs about **3,760 members per arm** for 80% power; CUPED needs about **1,900**, almost exactly half. Meera only ran 2,000 per arm, which is why the raw test came back inconclusive and CUPED did not: at \(\rho = 0.70\), CUPED is like doubling her sample for free.

=== step === tryit
::eyebrow Your turn
## Apply CUPED yourself

A music app runs its own test: a new Discover tab (arm 1) versus the old home screen (arm 0), measuring listening **minutes** this week. For each user it also has last week's minutes, the pre-period covariate. Form the adjusted metric by subtracting the predictable part. Fill in the centered covariate.

```r
set.seed(11)
m      <- 3000
group  <- rep(0:1, each = m / 2)                          # 0 = old home, 1 = Discover tab
before <- rlnorm(m, 4.6, 0.6)                             # minutes listened the week BEFORE
mins   <- 0.7 * before + rlnorm(m, 3.9, 0.6) + 6 * group  # this week; true lift = 6 minutes
g      <- m / 2

theta  <- cov(mins, before) / var(before)
adj    <- mins - theta * (____)                           # center the pre-period covariate
c(raw_se   = sqrt(var(mins[group == 1]) / g + var(mins[group == 0]) / g),
  cuped_se = sqrt(var(adj[group == 1])  / g + var(adj[group == 0])  / g))
```
::check {"regex":"before\\s*-\\s*mean","gate":true,"difficulty":"intermediate","ok":"That is it: center the covariate on its own mean, before - mean(before), so the metric's average does not move while its noise drops. The standard error falls from about 2.4 to about 1.4.","no":"Subtract the covariate's mean to center it: before - mean(before). That keeps the metric's mean unchanged while removing the predictable part."}
::solution
```r
set.seed(11)
m      <- 3000
group  <- rep(0:1, each = m / 2)
before <- rlnorm(m, 4.6, 0.6)
mins   <- 0.7 * before + rlnorm(m, 3.9, 0.6) + 6 * group
g      <- m / 2

theta  <- cov(mins, before) / var(before)
adj    <- mins - theta * (before - mean(before))
c(raw_se   = sqrt(var(mins[group == 1]) / g + var(mins[group == 0]) / g),
  cuped_se = sqrt(var(adj[group == 1])  / g + var(adj[group == 0])  / g))
#>   raw_se cuped_se
#>    2.416    1.400
```

Last week's minutes predict this week's even more strongly than Meera's spend did (correlation about 0.81), so the standard error drops further, from 2.4 to 1.4.

=== step === concept
::eyebrow Two cousins
## Stratification, and the one-line way

CUPED regresses out a **continuous** covariate. Its close cousin, **stratification**, does the same with a **categorical** one: split members into buckets by a pre-period variable, measure the lift inside each bucket, then average the buckets by size. Removing the between-bucket differences removes variance, just like CUPED. Bucket Meera's members into thirds by last month's spend:

```r
# post-stratify: bucket members by last month's spend into thirds, compare WITHIN each
stratum <- cut(pre, quantile(pre, c(0, 1/3, 2/3, 1)),
               labels = c("light", "medium", "heavy"), include.lowest = TRUE)

strat_lift <- 0
strat_var  <- 0
for (s in levels(stratum)) {
  in_s   <- stratum == s
  weight <- mean(in_s)                                   # share of members in this third
  lift_s <- mean(spend[in_s & arm == 1]) - mean(spend[in_s & arm == 0])
  var_s  <- var(spend[in_s & arm == 1]) / sum(in_s & arm == 1) +
            var(spend[in_s & arm == 0]) / sum(in_s & arm == 0)
  strat_lift <- strat_lift + weight * lift_s             # size-weighted average of the thirds
  strat_var  <- strat_var  + weight^2 * var_s
}
round(c(stratified_se = sqrt(strat_var), raw_se = raw_se, cuped_se = cup_se), 3)
#> stratified_se        raw_se      cuped_se
#>         1.029         1.223         0.868
```

Three coarse buckets already cut the standard error from 1.22 to 1.03. They land short of CUPED (0.87) because three buckets throw away most of what the exact pre-period number knows. And here is the practical shortcut: CUPED is just a regression that adjusts for the covariate, so one line of `lm` does the whole job:

```r
# CUPED == a regression that controls for the pre-period covariate
round(summary(lm(spend ~ arm + pre))$coef["arm", c("Estimate", "Std. Error")], 3)
#>   Estimate Std. Error
#>      2.096      0.868
```

The `arm` coefficient (2.096) and its standard error (0.868) reproduce the manual CUPED result exactly. In practice, regression adjustment (also called ANCOVA) is how CUPED is usually run, and it makes adding a second or third pre-period covariate trivial.

=== step === concept
::eyebrow Know the limits
## When it helps, and when it cannot

CUPED is close to free sensitivity, but only when its conditions hold.

[WARNING]
The covariate must be measured BEFORE randomization. Adjusting for anything the treatment could have changed (a during-test metric) biases the effect toward zero, the single most common way to misuse CUPED.

- **You need per-unit history.** Brand-new members with no pre-period have nothing to adjust with; a common fix is to impute their covariate at the mean, which simply means no adjustment for them.
- **Weak correlation, weak gain.** At \(\rho = 0.2\) the variance cut is only \(1 - 0.04 = 4\%\). CUPED shines when a stable per-unit metric (spend, sessions, prior conversions) strongly predicts the outcome.
- **Choose the covariate in advance.** Fix \(X\) and the adjustment plan before you look at the results, so you are not fishing for the covariate that flatters your favorite outcome.

Within those limits, variance reduction is one of the highest-payoff moves in an experimentation program: the same traffic, a much sharper answer.

=== step === quiz
::eyebrow Check yourself
## Pick the best covariate

You are about to run an A/B test on test-week revenue and can adjust for one pre-period covariate. Three are available. Which gives the biggest **valid** variance reduction?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Pre-period revenue, correlation 0.2 with the outcome ::no It is valid (measured before the test), but weak: it cuts only about 4% of the variance (\(1 - 0.2^2\)), so barely helps.
- Pre-period revenue, correlation 0.7 with the outcome ::ok Right. It is pre-treatment (valid) and strongly correlated, so it cuts about half the variance. Strong plus pre-experiment is the winning combination.
- The first three days of in-test revenue, correlation 0.9 with the outcome ::no Highest correlation, but it is measured DURING the test, so it is post-treatment and biases the effect. Correlation cannot rescue a covariate with the wrong timing.

=== step === concept
::eyebrow Go deeper
## References

- [Deng, Xu, Kohavi and Walker (2013), Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED), WSDM](https://doi.org/10.1145/2433396.2433413) - the paper that introduced CUPED at Microsoft, with the variance-reduction derivation.
- [Kohavi, Tang and Xu (2020), Trustworthy Online Controlled Experiments](https://experimentguide.com/) - the industry playbook; its sensitivity chapter covers running variance reduction in production.
- [Lin (2013), Agnostic notes on regression adjustments to experimental data, Annals of Applied Statistics](https://doi.org/10.1214/12-AOAS583) - why regression adjustment (the `lm` form of CUPED) is safe in a randomized experiment.
- [Freedman (2008), On regression adjustments to experimental data, Advances in Applied Mathematics](https://doi.org/10.1016/j.aam.2007.10.001) - the cautionary counterpoint on small-sample adjustment, worth knowing before you lean on it.

=== step === complete
## Lesson 2 complete

You turned data Meera already had into a sharper experiment: last month's spend predicted this month's, and subtracting that predictable part shrank the confidence interval by \(\sqrt{1 - \rho^2}\), with no bias and no extra traffic. You saw it three ways, the manual adjustment, the one-line regression, and its categorical cousin stratification, and you know the guardrails: the covariate must be from before the test, and it only helps as much as it correlates.

Up next, Lesson 3: Experiment Pitfalls, Peeking and SRM. Now that your tests are sensitive, you will learn the three ways an online experiment can quietly lie to you, and how to catch each one before it hands you a false winner.

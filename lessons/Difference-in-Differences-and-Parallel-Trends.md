---
title: "Causal Inference for Decisions Lesson 3: Difference-in-Differences and Parallel Trends"
catalog_blurb: "Measure a policy's effect by comparing the before-and-after change in two groups."
description: "One group gets a policy, another does not. Compare each group's before-and-after change, difference away unmeasured confounding, and test parallel trends in R."
keywords: "difference-in-differences, DiD, parallel trends, causal inference, natural experiment, treatment effect, event study, two-way fixed effects, R"
post_type: "LESSON"
curriculum_id: "6.180.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "3"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Staggered-DiD-and-the-Negative-Weights-Problem.html"
course_prev: "Inverse-Probability-Weighting-and-Doubly-Robust.html"
---

=== step === cover
::eyebrow Lesson 3 of 11
## Difference-in-Differences and Parallel Trends

In Lessons 1 and 2 you fought confounding by modelling it: estimate each unit's propensity to be treated, then match or reweight until the groups balance. That works only for confounders you actually measured. But some things you can never put in a model: the local economy, management culture, a hundred quiet differences between one place and another.

Here is a real case where that mattered. On 1 April 1992, **New Jersey** raised its minimum wage from $4.25 to $5.05 an hour. Neighbouring **Pennsylvania** left its wage alone. Standard economics predicted New Jersey would shed fast-food jobs. Economists David Card and Alan Krueger measured full-time-equivalent (FTE) employment at hundreds of restaurants in both states, once in February (before) and once in November (after). If you simply compared the two states afterwards you would be fooled, because New Jersey's restaurants were never quite like Pennsylvania's to begin with.

Difference-in-differences (DiD) is the move that rescues this: instead of comparing the two groups, compare their two *changes*. By the end of this lesson you will be able to:

- Explain why a naive after-only comparison, and a naive before-after comparison, are each biased
- Compute the DiD effect two ways: a 2x2 table of means, and one line of `lm(y ~ treat*post)`
- State the parallel-trends assumption, and see why it constrains the groups' trends, not their levels
- Probe parallel trends with pre-policy data, and recognise when DiD is not safe to use

**Prerequisites:** Lessons 1 and 2 (confounding, potential outcomes, the average treatment effect, and why a naive comparison can mislead); you can fit `lm` and read its coefficients.

::widget did-parallel {}

=== step === concept
::eyebrow The setup
## Two groups, two periods, one number each

Every DiD study has the same skeleton, and ours is the fast-food example. There are **two groups**: the **treated** group that got the policy (New Jersey stores) and a **control** group that did not (Pennsylvania stores). There are **two periods**: **before** the policy (February 1992) and **after** it (November 1992). And there is **one outcome** measured in each: average FTE employment per store. That gives four numbers, a 2x2 grid, and DiD is built entirely from those four.

Every lesson runs in a fresh R session, so we build the data here. These are simulated stores patterned on the real study: New Jersey restaurants run a little smaller to start, a mild 1992 slowdown pulls employment down in both states, and we plant a **true policy effect of +2.75 FTE** in New Jersey after the change, so we can later check whether DiD finds it.

```r
set.seed(2024)
n <- 400                                     # fast-food stores per state
state <- rep(c("PA", "NJ"), each = n)        # PA = control, NJ = treated
treat <- as.integer(state == "NJ")           # 1 = New Jersey, 0 = Pennsylvania
base  <- ifelse(treat == 1, 20.4, 23.3) + rnorm(2 * n, 0, 7)   # Feb-1992 FTE per store
trend  <- -2.1                               # economy-wide dip through 1992 (BOTH states)
effect <- 2.75                               # the TRUE effect of NJ's wage hike (NJ, after)

emp <- data.frame(
  store = rep(1:(2 * n), 2),
  state = rep(state, 2),
  treat = rep(treat, 2),
  post  = rep(0:1, each = 2 * n)             # 0 = Feb 1992 (before), 1 = Nov 1992 (after)
)
emp$fte <- rep(base, 2) + emp$post * trend +
           emp$post * emp$treat * effect + rnorm(nrow(emp), 0, 2.5)

cell <- tapply(emp$fte, list(state = emp$state, post = emp$post), mean)
round(cell, 1)
#>      post
#> state    0    1
#>    NJ 20.4 20.9
#>    PA 23.6 21.5
```

Read the grid slowly. New Jersey went from 20.4 to 20.9 FTE, a whisker up. Pennsylvania went from 23.6 to 21.5, a clear drop of about two. Those four means are the whole dataset now. Everything that follows is a way of subtracting them.

=== step === concept
::eyebrow The trap
## Why the obvious comparisons are both wrong

There are two tempting shortcuts, and each one lies.

The first is the **after-only comparison**: look at the two groups in November and take the difference. The second is the **before-after comparison**: ignore Pennsylvania and just watch New Jersey change over time. Let us compute both.

```r
after_only  <- cell["NJ","1"] - cell["PA","1"]   # NJ vs PA, AFTER the policy only
before_after <- cell["NJ","1"] - cell["NJ","0"]  # NJ after vs NJ before, ignoring PA
round(c(after_only = after_only, before_after = before_after), 2)
#> after_only before_after
#>      -0.60         0.56
```

The after-only number is **-0.60**: in November, New Jersey stores employed slightly *fewer* people than Pennsylvania stores. Taken at face value, that says the wage hike cost jobs. But it is contaminated, because New Jersey stores were already smaller in February (20.4 vs 23.6). You are measuring a pre-existing gap, not the policy.

The before-after number is **+0.56**: New Jersey barely moved, so this says the policy did almost nothing. But that ignores the 1992 slowdown. Without the wage hike, New Jersey would probably have fallen too, just like Pennsylvania did. Standing still while everyone else drops is not "nothing"; it is a gain hiding in plain sight.

[KEY INSIGHT]
The after-only comparison is polluted by a *level* difference between the groups. The before-after comparison is polluted by a *time trend* that hits everyone. DiD's whole idea is that you can cancel BOTH pollutants at once by taking a difference of differences.

=== step === widget
::eyebrow The core idea
## The difference of differences

Here is the move. Take the treated group's change over time, then subtract the control group's change over the same time. New Jersey's change contains the time trend plus the policy effect; Pennsylvania's change contains the time trend alone. Subtract, and the shared trend cancels, leaving the policy effect by itself.

```r
nj_change <- cell["NJ","1"] - cell["NJ","0"]   # treated group's before -> after change
pa_change <- cell["PA","1"] - cell["PA","0"]   # control group's before -> after change
round(c(nj_change = nj_change, pa_change = pa_change,
        did = nj_change - pa_change), 2)
#> nj_change pa_change       did
#>      0.56     -2.04      2.60
```

New Jersey changed by +0.56. Pennsylvania changed by -2.04. The difference of those differences is **+2.60 FTE**, almost exactly the +2.75 we planted. The naive answers were -0.60 and +0.56; the double difference recovers the truth both of them missed.

Formally, with \(\bar Y_{g,t}\) the mean outcome for group \(g\) in period \(t\), the estimator is

\[ \widehat{\text{DiD}} = \big(\bar Y_{\text{NJ,after}} - \bar Y_{\text{NJ,before}}\big) - \big(\bar Y_{\text{PA,after}} - \bar Y_{\text{PA,before}}\big). \]

The widget below draws exactly this geometry on a clean illustrative example. The solid lines are the two groups; the dashed line is where the treated group *would* have landed if it had simply followed the control's trend. Toggle between the naive after-only gap and the DiD gap, and watch the number change.

::widget did-parallel {}

=== step === concept
::eyebrow The assumption
## Parallel trends: what makes the subtraction legal

The dashed line in that widget is the load-bearing idea of the whole method. It is the **counterfactual**: the path New Jersey would have taken with no wage hike. We can never observe it, because New Jersey did get the hike. DiD's trick is to *borrow* it from the control group: we assume New Jersey would have changed by the same amount Pennsylvania actually did.

That assumption has a name, **parallel trends**. Writing \(Y^{0}_{g,t}\) for the outcome group \(g\) would have had at time \(t\) if untreated (its "no-policy" potential outcome), parallel trends says the two groups would have moved together absent the policy:

\[ E\big[Y^{0}_{\text{NJ,after}} - Y^{0}_{\text{NJ,before}}\big] = E\big[Y^{0}_{\text{PA,after}} - Y^{0}_{\text{PA,before}}\big]. \]

Read it in plain words: *without* the wage hike, New Jersey's employment change would have equalled Pennsylvania's. If that holds, Pennsylvania's -2.04 is a fair stand-in for New Jersey's missing counterfactual, and the leftover +2.60 is the policy.

[KEY INSIGHT]
Parallel trends is a claim about *trends*, not *levels*. The groups are allowed to start at completely different heights (New Jersey at 20.4, Pennsylvania at 23.6). DiD subtracts each group's own starting point away. What must match is the *slope* they would have followed without treatment, not where they began.

=== step === quiz
::eyebrow Check yourself
## Different levels, same method?

A reviewer objects: "Your New Jersey stores averaged 20.4 FTE before the policy and your Pennsylvania stores averaged 23.6. The groups are not comparable, so your difference-in-differences estimate is invalid." Is the reviewer right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes. DiD requires the treated and control groups to have equal outcomes before the policy, so a 20.4 vs 23.6 gap breaks it ::no This is the most common DiD misconception. DiD never requires equal starting levels; the `treat` term in the model absorbs the constant gap. It requires equal *trends* absent treatment, which is a different thing.
- No. DiD allows different starting levels; each group is differenced against its own baseline. What it needs is parallel trends, that the groups would have CHANGED by the same amount without the policy ::ok Exactly. The double difference removes each group's fixed level, so a level gap is harmless. The real assumption is about the counterfactual trend, and that is what you must defend.
- No, because with 400 stores per group the sample is large enough that any level difference averages out ::no Sample size does not cure a level difference, and it does not need curing. Even with a million stores, DiD would still difference each group against its own baseline. The level gap is not a problem to average away; it is simply irrelevant to the method.

=== step === tryit
::eyebrow In R
## The whole thing in one line

You computed the double difference by hand from four means. In practice you fit one regression instead, because it hands you a standard error and extends to covariates for free. The model is

\[ Y_{it} = \beta_0 + \beta_1\,\text{treat}_i + \beta_2\,\text{post}_t + \beta_3\,(\text{treat}_i \times \text{post}_t) + \varepsilon_{it}, \]

where \(\text{treat}_i\) is 1 for New Jersey stores and \(\text{post}_t\) is 1 in November. The interaction coefficient \(\beta_3\) is the difference-in-differences. Complete the formula: regress `fte` on the two indicators **and their interaction**.

```r
model <- lm(fte ~ ____, data = emp)   # the two indicators AND their interaction
round(coef(model), 2)
```
::check {"regex":"treat\\s*\\*\\s*post|post\\s*\\*\\s*treat","gate":true,"difficulty":"intermediate","ok":"That is it. In R, treat * post expands to treat + post + treat:post, so one term gives you all three coefficients. The treat:post interaction is 2.60, the same double difference you found by hand.","no":"Use treat * post. The star is R shorthand that adds both main effects AND the interaction term treat:post, which is the DiD estimate."}
::solution
```r
model <- lm(fte ~ treat * post, data = emp)
round(coef(model), 2)
#> (Intercept)       treat        post  treat:post
#>       23.58       -3.19       -2.04        2.60
```

Every coefficient tells a piece of the story. The **intercept** (23.58) is Pennsylvania before, the reference cell. **`treat`** (-3.19) is how much lower New Jersey started, the level gap the last quiz was about. **`post`** (-2.04) is Pennsylvania's time trend, the 1992 slowdown. And **`treat:post`** (2.60) is the extra change unique to New Jersey after the policy: the difference-in-differences, matching your by-hand answer exactly.

=== step === concept
::eyebrow Kicking the tyres
## Probing parallel trends before you trust it

Parallel trends is an assumption about a counterfactual, so you can never prove it. But you can *interrogate* it. The standard check: if you have several periods of data *before* the policy, look at whether the two groups were already moving in parallel back then. If they tracked each other for months and only split apart when the policy landed, the assumption is credible. If they were already diverging before anything happened, it is not.

Suppose we had monthly employment for a few months on either side of the April change. Plotting each group's average over time turns the assumption into something you can see. This is called an **event study**.

```r
library(ggplot2)
set.seed(7)
periods <- -3:2                          # months relative to the April-1992 hike
stores  <- 300
grid <- expand.grid(period = periods, store = 1:stores, state = c("PA", "NJ"))
grid$treat <- as.integer(grid$state == "NJ")
grid$post  <- as.integer(grid$period >= 0)
grid$fte <- with(grid,
  ifelse(treat == 1, 20.4, 23.3) - 0.5 * period +   # a shared, parallel downward drift
  post * treat * 2.75 +                             # NJ breaks upward AT the policy
  rnorm(nrow(grid), 0, 3))
ev <- aggregate(fte ~ period + state, grid, mean)   # group means per month

p <- ggplot(ev, aes(period, fte, colour = state)) +
  geom_vline(xintercept = -0.5, linetype = "dashed") +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  annotate("text", x = -0.5, y = 25, label = "wage hike", hjust = 1.1, size = 3.5) +
  labs(x = "months relative to the policy", y = "FTE employment per store",
       colour = "state", title = "Parallel before, divergent after")
print(p)
```

Before the dashed line, the two lines slope downward together, roughly parallel, both caught in the same slowdown. Then at the policy, New Jersey breaks upward while Pennsylvania keeps drifting down. That is the pattern that makes a DiD believable: shared history, then a split that lines up with the treatment. A failed check looks the opposite: the gap between the lines already widening or shrinking before the policy, which means something other than the policy is moving the groups apart.

=== step === quiz
::eyebrow Check yourself
## Reading a broken pre-trend

You run the event-study plot and find that, in the two years *before* the wage hike, New Jersey's fast-food employment was already climbing steadily while Pennsylvania's was flat. The gap between them was widening month after month, before any policy. What should you conclude about your DiD estimate?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Parallel trends is in doubt: the groups were diverging before treatment, so Pennsylvania's change is not a fair counterfactual, and the DiD will attribute pre-existing divergence to the policy ::ok Right. If the lines were separating before anything happened, they would likely have kept separating anyway, and DiD would credit that ongoing drift to the wage hike. A failed pre-trend is the single most important red flag for a DiD study.
- No problem: pre-trends do not matter because DiD only uses the before and after periods, not the trend between them ::no Pre-trends are exactly the evidence for or against the assumption DiD rests on. A two-period DiD silently ASSUMES parallel trends; extra pre-periods are how you check that assumption, and here it fails.
- It strengthens the result: a rising pre-trend in New Jersey shows the treated group was already healthy, which makes the positive effect more believable ::no It does the opposite. A rising New Jersey pre-trend means New Jersey would likely have risen even without the policy, so some of your +2.60 is just that pre-existing climb, not the wage hike. Divergence before treatment inflates the estimate.

=== step === concept
::eyebrow The fine print
## When difference-in-differences breaks

DiD is powerful precisely because it asks for so little: no need to measure every confounder, just a control group and the parallel-trends assumption. But that assumption, and a few cousins, can fail. Run this mental checklist before trusting any DiD:

::widget process-flow {"steps":[{"title":"Find a clean control","sub":"a group left untreated but otherwise moving like the treated one"},{"title":"Check pre-trends","sub":"plot several pre-policy periods and confirm the groups moved in parallel"},{"title":"Estimate the double difference","sub":"fit lm(y ~ treat*post) and read the treat:post interaction"},{"title":"Stress-test the assumptions","sub":"spillovers, changing store composition, and staggered timing"}]}

The four ways it goes wrong:

- **Non-parallel trends.** The whole method rests on the control's change standing in for the treated's counterfactual. If they were never on parallel paths, the estimate is biased, and no amount of data fixes it.
- **Spillovers (interference).** If Pennsylvania stores near the border lose workers to higher-paying New Jersey, the control is contaminated by the treatment, and the two changes are no longer independent.
- **Compositional change.** If the weakest New Jersey stores closed after the hike, the November sample is a different, hardier set of stores than February's, so part of the "gain" is just survivors being counted.
- **Staggered timing.** Real policies rarely switch on for everyone at one instant. When units adopt at different times, a single `treat*post` is not enough, and the popular two-way fixed-effects fix can even put *negative* weights on some comparisons.

[WARNING]
That last one is subtle and important enough to be its own lesson. When treatment rolls out in waves, already-treated units get used as controls for later-treated ones, and the math can silently flip signs. That is exactly where we go next.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take difference-in-differences further:

- [Card and Krueger (1994), Minimum Wages and Employment (NBER working paper)](https://www.nber.org/papers/w4509) - the natural experiment this lesson is built on, and the paper that made DiD famous.
- [Cunningham, Causal Inference: The Mixtape, DiD chapter (free online)](https://mixtape.scunning.com/09-difference_in_differences) - the clearest from-scratch walk-through, with R and Stata code.
- [Angrist and Pischke, Mastering 'Metrics (chapter 5)](https://www.masteringmetrics.com/) - the intuition for DiD and fixed effects, gently and rigorously.
- [Roth, Sant'Anna, Bilinski and Poe (2023), What's Trending in Difference-in-Differences? (arXiv)](https://arxiv.org/abs/2201.01194) - the modern synthesis on parallel-trends testing and the staggered-timing problems.
- [Goodman-Bacon (2021), DiD with Variation in Treatment Timing (NBER working paper)](https://www.nber.org/papers/w25018) - the decomposition behind the negative-weights problem, your bridge to Lesson 4.

=== step === complete
## Lesson 3 complete

You turned a policy puzzle into a clean effect by refusing to compare groups directly. Instead you compared their *changes*: New Jersey's +0.56 against Pennsylvania's -2.04, a double difference of +2.60 that both naive shortcuts missed. You saw that `lm(y ~ treat*post)` computes it in one line, with the `treat:post` interaction as the estimate. And you learned the one assumption the whole method leans on, parallel trends, why it constrains slopes and not levels, and how to interrogate it with pre-policy data before you trust it.

Next, Lesson 4: Staggered DiD and the Negative-Weights Problem. When units adopt a policy at different times, the tidy two-group, two-period picture falls apart, and the standard two-way fixed-effects estimator can quietly put negative weights on some comparisons, biasing the answer in a way that took the field years to notice. You will see how it happens, and what to use instead.

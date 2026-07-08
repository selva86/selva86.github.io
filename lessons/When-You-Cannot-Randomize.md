---
title: "Causal Inference Lesson 5: When You Cannot Randomize"
catalog_blurb: "Estimate a causal effect when you cannot run a randomized experiment."
description: "You cannot always randomize. See how matching and difference-in-differences recover a causal effect from observational data, and the assumption each one buys."
keywords: "difference-in-differences, matching, causal inference in R, parallel trends, natural experiment, confounding, observational data, selection bias, average treatment effect"
post_type: "LESSON"
curriculum_id: "6.10.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "5"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: ""
course_prev: "Reading-an-Experiment.html"
---

=== step === cover
::eyebrow Lesson 5 of 5
## When You Cannot Randomize

In Lesson 4 you turned Riverside Books' A/B test into an honest, bounded conclusion. That test was clean because Riverside got to flip a coin: each visitor was randomly shown the old page or the new panel, so the two groups were alike in every way except the one thing being tested. Randomization is what made the causal claim easy.

Most real questions do not come with a coin flip. The change already happened before anyone thought to test it. Or randomizing would be impossible, unfair, or absurd: you cannot randomly assign customers to "loves reading" or "does not," and you cannot give half your city free shipping while charging the other half just to measure it. When you cannot randomize, you are left with data the world handed you, and a hard job: recover a causal effect anyway, honestly.

This lesson gives you the two workhorse tools for exactly that, and, just as importantly, teaches you to name the price each one charges. Every method below buys a causal answer with one assumption you can never fully prove. The map below is the whole lesson.

By the end of this lesson you will be able to:

- Explain why comparing two groups that **chose** themselves is biased, and measure that bias against the truth
- Build a **matched** comparison group in R, and state the assumption it rests on
- Compute a **difference-in-differences** estimate, read the counterfactual it draws, and state the assumption *it* rests on
- Pick a method by the assumption you can actually defend, and scope your causal claim honestly

**Prerequisites:** you finished [Lesson 1](Correlation-Causation-and-Potential-Outcomes.html) (confounding, potential outcomes \(Y(0)\) and \(Y(1)\), what a causal effect is) and [Lessons 3 to 4](Reading-an-Experiment.html) (a randomized A/B test, the confidence interval). You can run R and take a mean. Every new term is defined as it appears.

::widget process-flow {"steps":[{"title":"You cannot randomize","sub":"the change already happened, or a fair coin flip is impossible"},{"title":"Matching","sub":"build a comparison group that looks like the treated one"},{"title":"Difference-in-differences","sub":"compare the change over time, treated versus untreated"},{"title":"Name the price","sub":"each method buys a causal answer with one assumption you must defend"}]}

=== step === concept
::eyebrow The trap
## Comparing groups that chose themselves

Here is Riverside's new problem. It launched a free **membership** (early access to sales, a nicer wish-list), and the numbers look great: members spend far more than non-members. Marketing wants to credit the membership. But nobody was *assigned* to join. Customers who signed up were the keen ones, the people who already spent more. So the two groups were never alike, and the raw gap mixes two things: any real effect of the membership, plus the head start the joiners already had.

We can see the trap exactly, because we will build the data ourselves and secretly plant a known truth. Each customer has a `prior` (last year's spend) and a `spend` (this year's). We set the real membership effect to exactly **$5**, and let members be the higher-`prior` customers to begin with. Each lesson runs in its own fresh R session, so we build everything inline.

```r
# Riverside launched a free membership. Members later spent more, but customers
# CHOSE to join, so the two groups were never alike to begin with.
control <- data.frame(prior = c(40, 45, 50, 55, 60, 70, 80, 90))  # non-members: last year's spend
control$spend <- control$prior                 # with no membership, this year just tracks last year

member <- data.frame(prior = c(55, 60, 70, 80, 90))               # joiners: already bigger spenders
member$spend  <- member$prior + 5              # membership adds exactly $5 (the truth we planted)

naive <- mean(member$spend) - mean(control$spend)   # the tempting comparison
c(member_avg = mean(member$spend), nonmember_avg = mean(control$spend), naive_gap = naive)
#>    member_avg nonmember_avg     naive_gap
#>         76.00         61.25         14.75
```

The naive gap is **$14.75**, almost three times the true $5. Written as a formula, the comparison you were tempted to make is not the effect alone:

\[ \underbrace{\bar Y_{\text{members}} - \bar Y_{\text{non-members}}}_{\text{naive gap } = \$14.75} \;=\; \underbrace{\tau}_{\text{true effect } = \$5} \;+\; \underbrace{\text{selection bias}}_{\text{joiners already spent more}}, \]

where \(\bar Y\) is a group's average spend and \(\tau\) (tau) is the causal effect we want. The extra $9.75 is **selection bias**: the difference in what the two groups would have spent even with no membership at all. The picture makes the head start obvious.

```r
library(ggplot2)
grp <- rbind(
  data.frame(group = "non-members", prior = control$prior),
  data.frame(group = "members",     prior = member$prior)
)
ggplot(grp, aes(prior, group)) +
  geom_point(size = 3.4, colour = "#1f7a55", alpha = 0.75) +
  labs(x = "Prior-year spend ($)", y = NULL,
       title = "Members were bigger spenders BEFORE they ever joined",
       subtitle = "A coin flip would have mixed the two rows together; self-selection did not") +
  theme_minimal(base_size = 13)
```

=== step === concept
::eyebrow The first tool
## Matching: compare like with like

If the problem is that members and non-members are not comparable, the fix is to *make* them comparable. **Matching** does the simplest possible version: for each treated unit, find an untreated unit that looks like it on the things you measured, and compare only within those look-alike pairs. Match a member who spent $70 last year to a non-member who also spent about $70, and the head start cancels, because both would have spent about the same without any membership.

Here it is from scratch, no special package: for every member, pick the non-member with the closest `prior` spend, and take that look-alike's outcome as the member's stand-in for "what would have happened without joining."

```r
# For each member, find the non-member with the closest prior-year spend,
# and use that look-alike's outcome as the "what if they had not joined" value.
matched_ctrl <- sapply(member$prior, function(p) {
  control$spend[which.min(abs(control$prior - p))]   # the nearest non-member's spend
})
pairs <- data.frame(member_prior = member$prior,
                    member_spend = member$spend,
                    matched_control_spend = matched_ctrl,
                    pair_effect = member$spend - matched_ctrl)
pairs
#>   member_prior member_spend matched_control_spend pair_effect
#> 1           55           60                    55           5
#> 2           60           65                    60           5
#> 3           70           75                    70           5
#> 4           80           85                    80           5
#> 5           90           95                    90           5
```

Every pair now differs by exactly the effect, and averaging the pair effects gives the honest number:

```r
att <- mean(pairs$pair_effect)   # the average effect for the members who actually joined
att
#> [1] 5
```

Matching recovered the true **$5**. The inflated $14.75 was the confounder talking; comparing like with like silenced it.

```r
library(ggplot2)
ests <- data.frame(
  label = c("Naive difference", "Matched, like for like", "True planted effect"),
  value = c(14.75, 5, 5)
)
ests$label <- factor(ests$label, levels = rev(ests$label))   # keep the reading order top to bottom
ggplot(ests, aes(value, label)) +
  geom_col(fill = "#1f7a55", width = 0.6) +
  geom_text(aes(label = value), hjust = -0.15, size = 4.2) +
  xlim(0, 17) +
  labs(x = "Estimated membership effect ($)", y = NULL,
       title = "Comparing like with like collapses the inflated gap") +
  theme_minimal(base_size = 13)
```

That is the whole idea, but it works only under a strong assumption. Matching balanced the groups on `prior` spend, and on anything else you fed it, and on **nothing else**. Formally, matching needs

\[ \{Y(0), Y(1)\} \perp T \mid X, \qquad 0 < \Pr(T = 1 \mid X) < 1, \]

read as: once you condition on the measured covariates \(X\), which treatment \(T\) a unit got (\(1\) = joined, \(0\) = did not) carries no more information about its potential outcomes \(Y(0), Y(1)\), and both groups actually overlap on \(X\) (there is *someone* to match to). The first part is called **unconfoundedness** or **ignorability**; the second is **overlap**.

[WARNING]
Matching can only balance what you measured. If members also differ on something you never recorded, say they simply love reading more, that hidden driver stays baked into your $5, and matching will not warn you. Randomization balances the unmeasured things for free; matching does not.

=== step === quiz
::eyebrow Check yourself
## What did matching actually buy?

Riverside matched members to non-members on prior spend, and the estimated effect fell from $14.75 to $5. A colleague concludes: "Matching removed the confounding, so $5 is the true causal effect, done." What is the honest caveat?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Matching balanced prior spend and anything else you measured, but not what you did not; if members also differ on some unmeasured trait, that difference is still inside the $5 ::ok Exactly. Matching buys unconfoundedness *given the measured covariates*. It is a real improvement over the naive gap, but it is only as trustworthy as the list of things you matched on. A hidden common cause survives it.
- Matching is invalid here because the two groups had different average prior spend to begin with ::no Matching does not require the groups to start out balanced; correcting that imbalance is its whole job. Its real limit is narrower: it can only balance the covariates you actually measured.
- The $5 must be wrong, because a matched estimate is always smaller than the naive one ::no There is no such rule. Matching moved the estimate down here only because the confounder inflated the naive gap; when the confounder points the other way, matching moves the estimate up. It corrects, it does not always shrink.

=== step === concept
::eyebrow The second tool
## Difference-in-differences: use before and after

Matching needs look-alike individuals. But some changes hit a whole group at once, with no per-person control to match to. Riverside just switched on **free shipping** in its **West** market on a known date, and left its **East** market on the old policy. You cannot match a West customer to a West customer who did not get free shipping, because every West customer got it.

The trick is to bring in **time**. Compare West's spend *before and after* the launch, then subtract off East's *before-and-after* change over the same window. East never got free shipping, so its change is a clean picture of the season, the economy, everything that would have nudged West too. Whatever West did *beyond* that is the effect. That is **difference-in-differences (DiD)**: a difference over time, minus a difference over time.

```r
# Free shipping launched in WEST on a known date; EAST kept the old policy and shows
# the trend West would have followed anyway. Four customers per cell, means built exact.
cell <- function(mu) mu + c(-3, -1, 1, 3)          # 4 customers; their mean is exactly mu
did <- data.frame(
  region = rep(c("East", "East", "West", "West"), each = 4),
  period = factor(rep(c("before", "after", "before", "after"), each = 4),
                  levels = c("before", "after")),   # ordered so the table reads before then after
  spend  = c(cell(42), cell(46), cell(50), cell(60))
)

m <- tapply(did$spend, list(did$region, did$period), mean)   # the four group means
m
#>      before after
#> East     42    46
#> West     50    60
```

Read the four numbers. East drifted up $4 on its own (42 to 46). West rose $10 (50 to 60), but $4 of that was just the same drift that lifted East. The difference-in-differences strips the shared drift out:

\[ \widehat{\text{DiD}} = \big(\bar Y^{\,\text{West}}_{\text{after}} - \bar Y^{\,\text{West}}_{\text{before}}\big) - \big(\bar Y^{\,\text{East}}_{\text{after}} - \bar Y^{\,\text{East}}_{\text{before}}\big), \]

where each \(\bar Y\) is one of the four group means above. Plugging in: \((60 - 50) - (46 - 42) = 10 - 4 = 6\).

```r
did_hand <- (m["West","after"] - m["West","before"]) - (m["East","after"] - m["East","before"])
did_hand
#> [1] 6
```

So free shipping is worth about **$6** per customer, not the $10 a naive before-and-after on West alone would have claimed, and not the $14 you would get comparing West to East after the fact. The picture shows why: East's line is the ruler.

```r
library(ggplot2)
# Four observed means, plus the COUNTERFACTUAL: where West would have landed if it had
# only followed East's +4 change. The gap from that dashed point to West's real value is the effect.
plot_df <- data.frame(
  period = factor(c("before","after","before","after"), levels = c("before","after")),
  region = c("East","East","West","West"),
  spend  = c(42, 46, 50, 60)
)
counterfactual <- data.frame(period = factor(c("before","after"), levels = c("before","after")),
                             spend = c(50, 54))     # West's start, then start + East's +4 change
ggplot(plot_df, aes(period, spend, colour = region, group = region)) +
  geom_line(linewidth = 1.1) + geom_point(size = 3.2) +
  geom_line(data = counterfactual, aes(period, spend, group = 1),
            linetype = "dashed", colour = "grey45", inherit.aes = FALSE) +
  annotate("text", x = 2, y = 57, label = "effect = $6", hjust = 1.05) +
  scale_colour_manual(values = c(East = "#b5631a", West = "#1f7a55")) +
  labs(x = NULL, y = "Average monthly spend ($)",
       title = "West rose more than East, and the extra rise is the effect",
       subtitle = "Dashed line: where West would have landed if it had only tracked East") +
  theme_minimal(base_size = 13)
```

=== step === concept
::eyebrow Under the hood
## It is really just one regression

You do not compute difference-in-differences by hand in practice. It falls straight out of a single regression, which is handy, because a regression also hands you the standard error and confidence interval you met in Lesson 4, for free.

First, a reminder of what "fit a regression" even means, since DiD leans on it. A regression finds the line that makes the total **squared** error as small as possible: for each point it measures the vertical miss to the line, squares it, and picks the slope and intercept that shrink the sum of those squares. Drag the line below and watch the squares, and their total, grow and shrink; the "Snap" button jumps to the least-squares answer.

::widget ols-fit {}

Now the DiD trick. Code two 0/1 flags: `treated` (is this the West market?) and `post` (is this after the launch?). Regress spend on both flags **and their interaction**. The interaction coefficient, the effect of being West *and* after at the same time, is exactly the difference-in-differences.

```r
did$treated <- as.integer(did$region == "West")   # 1 = the free-shipping (West) market
did$post    <- as.integer(did$period == "after")   # 1 = after the launch date
fit <- lm(spend ~ treated * post, data = did)
coef(fit)
#>  (Intercept)      treated         post treated:post
#>           42            8            4            6
```

Every coefficient is a piece of the story. The intercept ($42) is East before the launch. `treated` ($8) is how much higher West started. `post` ($4) is the shared drift East shows. And `treated:post` is **$6**, the same difference-in-differences, now with a standard error attached (run `summary(fit)` or `confint(fit)` to see it, exactly as in Lesson 4). One line of `lm` gives you the estimate *and* its uncertainty.

=== step === concept
::eyebrow The price
## What difference-in-differences buys: parallel trends

Difference-in-differences used East as the ruler for West. That only works if East really is a fair ruler, and that is the assumption you are buying. It is called **parallel trends**: absent the treatment, the two groups would have changed by the same amount. In symbols,

\[ \mathbb{E}\!\left[\,Y_{\text{after}}(0) - Y_{\text{before}}(0) \mid \text{West}\,\right] \;=\; \mathbb{E}\!\left[\,Y_{\text{after}}(0) - Y_{\text{before}}(0) \mid \text{East}\,\right], \]

where \(Y(0)\) is the spend a group *would* have had with **no** free shipping. In plain words: without the launch, West's change would have equaled East's change. Notice the trap, this is about the world where West was *not* treated, which we never observe, so parallel trends can never be fully proven. You can only make it *credible*, and the usual way is to look at the periods **before** the launch: if the two markets moved in step back then, it is reasonable they would have kept doing so.

```r
library(ggplot2)
# Support (never prove) parallel trends: look at the months BEFORE free shipping.
# If East and West moved in step before the launch, the assumption is believable.
pre <- data.frame(
  month  = rep(1:4, 2),
  region = rep(c("East", "West"), each = 4),
  spend  = c(39, 40, 41, 42,     # East drifts up $1 a month
             47, 48, 49, 50)     # West drifts up $1 a month, in parallel
)
ggplot(pre, aes(month, spend, colour = region)) +
  geom_line(linewidth = 1.1) + geom_point(size = 2.6) +
  scale_colour_manual(values = c(East = "#b5631a", West = "#1f7a55")) +
  labs(x = "Month before the launch", y = "Average monthly spend ($)",
       title = "Before free shipping, the two markets moved in parallel",
       subtitle = "Parallel PRE-trends make the parallel-trends assumption credible") +
  theme_minimal(base_size = 13)
```

[WARNING]
If West was already pulling away from East *before* free shipping, say West was booming and East was flat, then difference-in-differences mistakes that pre-existing divergence for an effect. The method cannot tell a real treatment effect from two groups that were already drifting apart. Always plot the pre-trends before you trust the number.

=== step === quiz
::eyebrow Check yourself
## Which assumption is doing the work?

Difference-in-differences gave a $6 effect for free shipping in the West market. Which single assumption is carrying that causal claim, and what would break it?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Parallel trends: without free shipping, West would have changed by the same amount East did. It breaks if West was already pulling ahead of East before the launch, because then that pre-existing divergence gets counted as the effect ::ok Right. DiD subtracts East's change as a stand-in for West's missing counterfactual change, which is only fair if the two would have trended together. A diverging pre-trend is exactly what invalidates it.
- That West and East had the same average spend before the launch; if the before levels differ, DiD is invalid ::no DiD is fine with different starting levels, because it compares *changes*, not levels, so a constant gap between the groups cancels out. What it needs is that those changes would have matched.
- That customers were randomly assigned to the West or East market; without random assignment DiD cannot be used ::no DiD exists precisely because there was no random assignment. It never assumes it. What it assumes instead is that the untreated groups would have *trended* together over time.

=== step === tryit
::eyebrow Your turn
## Compute a difference-in-differences

Riverside's **North** store launched a loyalty-points program; its **South** store did not, and serves as the control. Average monthly spend went **30 to 38** at North and **28 to 31** at South. Finish the difference-in-differences: subtract the control store's own change (the second difference) from North's change, so any trend hitting both stores cancels.

```r
# North store launched loyalty points; South store did not (the control).
north_before <- 30; north_after <- 38
south_before <- 28; south_after <- 31
# Fill in the SECOND difference so this is a difference-in-differences:
did_estimate <- (north_after - north_before) - ____
did_estimate
```
::check {"regex":"south_after\\s*-\\s*south_before","gate":true,"difficulty":"intermediate","ok":"Right, $5. North rose $8, but South rose $3 on its own, so only $8 minus $3 = $5 is left for loyalty points to explain, AND only if the two stores would otherwise have trended together (parallel trends again).","no":"You need the control store's own change as the second difference: (south_after - south_before). Subtract it from North's change so any shared trend cancels out."}
::solution
```r
north_before <- 30; north_after <- 38
south_before <- 28; south_after <- 31
did_estimate <- (north_after - north_before) - (south_after - south_before)
did_estimate
#> [1] 5
```

=== step === concept
::eyebrow The payoff
## Which method, and what it costs you

You now have three ways to compare a treated group to an untreated one, and the whole point of this lesson is that they differ not in arithmetic but in the **assumption** each one quietly charges. Line them up:

| Method | What it assumes | When it breaks |
|---|---|---|
| Naive comparison | the two groups were already alike | almost always: they chose their own group |
| Matching | no *unmeasured* common cause, and the groups overlap | a hidden driver you never measured |
| Difference-in-differences | parallel trends: equal change without treatment | the groups were already drifting apart |

None of these assumptions can be fully tested from the data you have, which is the permanent difference between a randomized experiment and an observational one. Randomization *earns* comparability; matching and difference-in-differences *assume* it, in a specific, nameable way. That is not a reason to avoid them, they are often the only tools you get, it is a reason to always say out loud which assumption you are leaning on, show the evidence for it (balance tables for matching, pre-trend plots for DiD), and scope the claim to what that assumption supports.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cunningham, Causal Inference: The Mixtape (free online)](https://mixtape.scunning.com/) - a friendly, worked treatment of matching and difference-in-differences with real studies and R/Stata code.
- [Stuart (2010), Matching Methods for Causal Inference: A Review and a Look Forward](https://doi.org/10.1214/09-STS313) - the standard survey of how matching works and exactly where it fails.
- [MatchIt: Getting Started (R package vignette)](https://kosukeimai.github.io/MatchIt/articles/MatchIt.html) - the practical R toolkit for doing matching properly, well past the from-scratch version here.
- [Card and Krueger (1994), Minimum Wages and Employment (NBER working paper)](https://www.nber.org/papers/w4509) - the famous natural experiment that put difference-in-differences on the map.
- [Angrist and Pischke, Mostly Harmless Econometrics](https://www.mostlyharmlesseconometrics.com/) - the reference on these designs and the assumptions they demand.

=== step === complete
## Lesson 5 complete

You can now attack a causal question even when a coin flip is off the table. You saw why comparing groups that chose themselves is biased, and measured that bias ($14.75 naive versus a true $5) against a planted truth. You built a **matched** comparison from scratch to recover the honest effect, and named its price: no *unmeasured* confounders, plus overlap. You computed **difference-in-differences** on Riverside's free-shipping rollout, read the $6 effect off the counterfactual East drew, saw it fall out of a single regression, and named *its* price: parallel trends. And you lined all three methods up by the assumption each one charges, because that ledger, not the arithmetic, is what separates a defensible causal claim from a hopeful one.

That closes **Causal Inference in R**. Across five lessons you went from "correlation is not causation" and the potential-outcomes idea, through causal diagrams, designing and reading a randomized experiment, to recovering causal effects when you cannot randomize at all. The through-line: a causal claim is only ever as strong as the assumption behind it, so state it, defend it, and scope it. Take that discipline into every "did it work?" question you meet next.

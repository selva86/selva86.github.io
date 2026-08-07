---
title: "Baseline Imbalance in Peer Review"
slug: Baseline-Imbalance-in-Peer-Review
description: "A reviewer says your groups differ at baseline. How to check baseline balance in R with standardized differences, decide whether to adjust, and word the reply."
keywords: "baseline imbalance reviewer comment, groups differ at baseline, adjust for baseline differences, baseline characteristics not balanced, reviewer says baseline imbalance, covariate adjustment"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 40
auto_link_terms: baseline imbalance|groups differ at baseline|baseline differences between groups|standardized mean difference|baseline balance|adjust for baseline
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Baseline imbalance is when the groups you compare already differ on some characteristic before the treatment or exposure could act, so part of the outcome gap might be that head start rather than the effect you are testing. Whether it matters depends entirely on whether the imbalanced characteristic predicts the outcome, so the honest answer is to check the ones that do and report what adjusting for them changes.</p>

## What the reviewer wrote

> The two arms appear to differ at baseline on several characteristics. The authors may wish to confirm that these differences do not account for the reported effect.

> The groups are not comparable at baseline. Age and disease severity both differ, and the analysis makes no adjustment for either.

> The manuscript is well written and the question is timely. My concern is with Table 1: the intervention arm is younger and has more men, and since both are associated with the outcome, I am not persuaded that the unadjusted difference in Table 2 reflects the intervention rather than the composition of the arms.

## What they actually mean

The reviewer is saying the groups were not on equal footing before the thing you are studying, so a difference in the outcome could reflect who ended up in each group rather than the treatment itself. What they want is for you to show the groups were similar on outcome-relevant characteristics, or to adjust for the ones that were not and report what that adjustment does.

What they are not asking for is a significance test on every row of Table 1. That reading is common and it is backwards: as the practice at the end shows, a significant baseline difference is not the signal that you must adjust, and a non-significant one is not permission to skip it. The trigger for adjustment is whether a characteristic predicts the outcome, not the p-value attached to its imbalance. One more distinction settles which version of the problem you have. In an observational study the groups were never randomised, so baseline imbalance is [confounding](/Unadjusted-Confounding-in-Peer-Review.html) and the response is the adjustment argument below. In a randomised trial the imbalance arose by chance, and the design changes what you owe the reviewer.

## Why they are asking

If a characteristic differs between the groups and it predicts the outcome, then part of the outcome gap is the head start, and reading the whole gap as the treatment effect overstates it, understates it, or in the worst case flips its sign. The size of the distortion tracks how strongly the imbalanced characteristic predicts the outcome. A large imbalance on something irrelevant to the outcome does nothing at all, whereas a modest imbalance on a strong predictor can move the estimate a long way, which is why the check has two parts rather than one: is the characteristic imbalanced, and does it predict the outcome.

The design decides how worried to be. Randomisation balances characteristics between arms in expectation, so any observed imbalance is a chance event and the design itself answers most of the objection (Senn, 1994, *Statistics in Medicine*). An observational comparison carries no such guarantee, and there the reviewer is right to ask before any causal reading is allowed. The mechanics of adjusting a group comparison for a covariate are covered in [ANCOVA in R](/ANCOVA-in-R.html); this chapter is about deciding whether the imbalance matters and how to report it.

## How to check it

Take a finding from `mtcars`: cars with a straight engine (`vs = 1`) are far more fuel-efficient than those with a V-shaped engine (`vs = 0`). A reviewer objects that the two groups of cars were never comparable to begin with. Start with the unadjusted difference.

```r
fit <- lm(mpg ~ vs, data = mtcars)
round(coef(summary(fit)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  16.6167     1.0797 15.3899        0
#> vs            7.9405     1.6324  4.8644        0
```

Straight-engine cars average 7.94 mpg more, and the difference is clearly significant. Now check the baseline. The way journals present balance is a Table 1 carrying a standardized mean difference for each characteristic, which is the difference in group means divided by the pooled standard deviation, so it does not shrink or grow with the sample size the way a p-value does (Austin, 2009, *Statistics in Medicine*). It is a few lines of base R.

```r
covs <- c("disp", "hp", "wt", "drat", "gear")
smd_tab <- t(sapply(covs, function(v) {
  x0 <- mtcars[[v]][mtcars$vs == 0]
  x1 <- mtcars[[v]][mtcars$vs == 1]
  c(V_shaped = mean(x0),
    straight = mean(x1),
    SMD      = (mean(x1) - mean(x0)) / sqrt((var(x0) + var(x1)) / 2))
}))
round(smd_tab, 2)
#>      V_shaped straight   SMD
#> disp   307.15   132.46 -2.04
#> hp     189.72    91.36 -2.14
#> wt       3.69     2.61 -1.32
#> drat     3.39     3.86  0.95
#> gear     3.56     3.86  0.42
```

Each SMD is the straight-engine mean minus the V-shaped mean, in pooled standard deviations. Displacement, horsepower and weight are all past 1.3 in absolute value, so the groups are markedly different at baseline. The convention is to treat anything above about 0.1 as imbalanced (Austin, 2009), which flags every row here, but that threshold is a convention rather than a law. Read a large SMD as a prompt to ask whether the variable predicts the outcome, not as a verdict, because that second question is what decides whether the imbalance bites.

## What to do about it

### You are fine

The imbalance sits on a characteristic that does not drive the outcome, or the study was randomised. Take the number of forward gears. It is imbalanced across the groups, at an SMD of 0.42, but only moderately related to fuel economy, correlating with `mpg` at 0.48. Add it to the model.

```r
round(coef(summary(lm(mpg ~ vs + gear, data = mtcars))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   6.1983     3.7657  1.6460   0.1106
#> vs            7.0568     1.4981  4.7105   0.0001
#> gear          2.9302     1.0234  2.8632   0.0077
```

The engine-shape estimate moves only from 7.94 to 7.06 mpg and stays significant, so the gear imbalance is not what produced the result. Report the balance table and this adjusted model side by side so the reviewer can see the estimate held. In a randomised trial the argument is shorter still: randomisation balances characteristics in expectation, so a baseline difference is a chance event, and CONSORT asks for the balance table (item 15) rather than a significance test on it (Senn, 1994). Whether every imbalanced characteristic behaves as gently as gear depends on how strongly it predicts the outcome, which is the next case.

### It is fixable

A strongly prognostic characteristic is imbalanced. Displacement is imbalanced at an SMD of -2.04 and it predicts fuel economy hard, correlating with `mpg` at -0.85. Adjust for it.

```r
round(coef(summary(lm(mpg ~ vs + disp, data = mtcars))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  27.9493     2.2012 12.6975   0.0000
#> vs            1.4950     1.6513  0.9054   0.3727
#> disp         -0.0369     0.0067 -5.4944   0.0000
```

Once displacement is in the model, the engine-shape advantage falls from 7.94 mpg to 1.50 and is no longer distinguishable from zero, because most of the apparent gap was that the straight-engine cars simply had smaller engines. The fix is to report this rather than bury it. Present the unadjusted and adjusted estimates together and reword the claim so it credits engine size, not engine shape. In an observational study STROBE item 16(a) asks for exactly that pairing; in a randomised trial the adjustment should have been pre-specified on prognostic grounds rather than chosen because the covariate came out imbalanced (EMA guideline on adjustment for baseline covariates, 2015; Assmann et al., 2000, *Lancet*), a point the practice returns to. When the groups barely overlap on the covariate, a single regression term is not enough and [matching or a propensity score](/Matching-and-the-Propensity-Score.html) is the better tool.

### It is a real problem

Sometimes the groups differ so much on a key characteristic that they share almost no common range, and then no adjustment can compare like with like, because the model has to extrapolate into a region where one group has no data. To illustrate with numbers, imagine a two-arm study where the treated patients have baseline severity scores of 8 to 10 and the controls score 1 to 4, with almost no overlap. A regression that adjusts for severity will still print a treatment coefficient, but that number rests on assuming the severity-to-outcome relationship holds where you never observed both arms, and it can swing from something like +2.1 to -0.4 as you change the functional form. No reanalysis rescues this, because the data do not contain the comparison the reviewer wants made. The honest paths are to restrict the analysis to the overlapping range and report the narrower question you can actually answer, or to state in the Limitations that the arms are not comparable and the contrast is not identifiable from these data.

## How to word your response

### If you are fine

> The reviewer notes that the groups differ at baseline. We now present standardized mean differences for all baseline characteristics (Table 1). The number of forward gears differs between the groups but is only weakly related to the outcome, and adding it to the model leaves the group estimate essentially unchanged, from 7.94 to 7.06 mpg. We report the adjusted model alongside the unadjusted one (Results, page X) so that the stability is visible to the reader.

### If it is fixable

> We thank the reviewer for this point. The two groups differ substantially in engine displacement at baseline, and displacement is a strong predictor of fuel economy. After adjusting for it, the difference attributed to engine configuration falls from 7.94 to 1.50 mpg and is no longer statistically distinguishable from zero (p = 0.37). We have revised the Results (page X) to present the unadjusted and adjusted estimates together, and have reworded the conclusion so that it no longer credits engine shape with an effect that is carried by engine size.

### If it is a real problem

> We agree that the groups are not comparable on baseline severity, which ranges from 8 to 10 in the treated arm and 1 to 4 in the controls, with almost no overlap. Because no region of common support exists, a covariate-adjusted estimate would rest on extrapolation rather than data, and we do not report one as though it were reliable. We have restricted the primary analysis to the overlapping range (Methods, page X), reported how many participants fall outside it, and stated in the Limitations that the full-sample contrast is not identifiable from these data.

## Practice

A reviewer writes: *"Dose is strongly associated with tooth length and is unlikely to be balanced across the two supplement groups. The unadjusted comparison of OJ against VC is therefore probably biased by dose, and the authors should adjust for it."* You run the check:

```r
ex_alloc <- table(ToothGrowth$supp, ToothGrowth$dose)
ex_unadj <- lm(len ~ supp, data = ToothGrowth)
ex_adj   <- lm(len ~ supp + dose, data = ToothGrowth)
ex_alloc
round(coef(summary(ex_unadj)), 4)
round(coef(summary(ex_adj)), 4)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The allocation table shows dose is perfectly balanced: ten guinea pigs at each of the three doses in both the OJ and the VC group. So the reviewer's premise is wrong, and there is no dose imbalance to correct. The supplement effect is -3.7000 units (VC minus OJ) in the unadjusted model and stays at exactly -3.7000 after adjusting for dose, because a covariate that is balanced across the groups cannot shift the point estimate. What does change is the standard error, which falls from 1.9318 to 1.0936, so the p-value moves from 0.0604 to 0.0013 and dose enters with a coefficient of 9.7636 (p < 0.001).

This is the "you are fine" outcome. The reviewer assumed adjustment was needed to remove bias, yet here it removes none, because randomised balance means dose was never confounding the comparison. Adjusting for dose is still worth doing, not to fix imbalance but to soak up outcome variance and sharpen a borderline estimate into a clear one, which is a precision gain rather than a bias correction. That is exactly why trial statisticians pre-specify adjustment for strong prognostic covariates whatever the observed balance turns out to be (EMA guideline, 2015). The right reply is to show the balanced allocation table, note that no imbalance exists to adjust away, and report the dose-adjusted estimate as the more precise one where the adjustment was planned in advance.

</details>

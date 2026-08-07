---
title: "Reviewer says my control group is not comparable"
slug: Non-Comparable-Control-Groups-in-Peer-Review
description: "A reviewer says your control group is not comparable to the treatment group. Check covariate overlap in R, decide whether adjustment can fix it, then reply."
keywords: "control group not comparable reviewer comment, groups are not comparable, non-comparable control group, reviewer says control group not comparable, lack of common support, no overlap between groups"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 42
auto_link_terms: control group not comparable|control group is not comparable|non-comparable control group|groups are not comparable|common support|region of overlap|lack of overlap
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">A control group is non-comparable when it is not a fair stand-in for what the treated group would have looked like untreated, so the difference you report mixes the treatment effect with whatever else separates the two groups. Whether you can rescue the comparison turns on overlap: where the groups cover the same range of the characteristics that drive the outcome you can adjust, and where they do not, no adjustment can compare like with like.</p>

## What the reviewer wrote

> The control group differs from the treatment group in ways that may bear on the outcome. The authors should establish that the two groups are genuinely comparable.

> These groups are not comparable. The controls were drawn from a different setting entirely, and I do not see how the reported contrast can be attributed to the intervention.

> I enjoyed the paper and the question matters. My reservation is the comparison group: the treated patients come from the tertiary unit while the controls come from routine primary care, and since the two populations differ on almost everything that predicts the outcome, I am not sure the adjustment on offer can carry that much weight.

## What they actually mean

The reviewer is questioning whether your control group can stand in for the treated group in the world where the treatment never happened. That is a stronger claim than saying the groups differ on one measured variable, because two groups can be non-comparable in a way no single covariate captures: they were recruited differently, or they sit in different regions of the characteristics that matter, so the untreated group tells you little about how the treated group would have fared. What the reviewer wants is evidence that a fair comparison exists, either because the groups overlap on the characteristics that drive the outcome or because the design assigned them at random.

This sits next to two objections it is easy to confuse it with. [Baseline imbalance](/Baseline-Imbalance-in-Peer-Review.html) is a difference on a measured characteristic you can put in the model, and [confounding](/Unadjusted-Confounding-in-Peer-Review.html) is such a difference that also moves your estimate; both are handled by adjustment. Non-comparability is the harder version where adjustment may not be available at all, because the groups occupy different parts of the covariate space and the model has no overlapping data to learn the correction from. So the reviewer is not simply asking for another covariate in the model, and reaching straight for one can bury the real question, which is whether the two groups overlap enough for any adjustment to mean something.

## Why they are asking

If the control group comes from a different population, the gap you measured is the treatment effect plus the gap between the two populations, and nothing in the data separates the two. Adjustment works by comparing treated and control units that share the same covariate values, so it can only remove a difference in a region where both groups actually appear. Where the groups overlap, that comparison is real. Where they do not, the model fills the gap by extending the covariate-outcome relationship into territory where one group has no data, and the estimate it returns leans on the shape you assumed rather than on anything you observed. This requirement is called overlap, or common support, and it is a precondition for adjustment rather than a nicety (Rosenbaum and Rubin, 1983, *Biometrika*). The mechanics of building a comparable comparison, matching and the propensity score, are covered in [Matching and the Propensity Score](/Matching-and-the-Propensity-Score.html); here the question is whether a fair comparison exists at all and what to report when it does not.

## How to check it

Take a comparison from `mtcars`. Four-cylinder cars average far better fuel economy than eight-cylinder cars, and a reviewer objects that the two sets of cars are nothing alike, so the gap says more about the kind of car than about the cylinders. Start with the unadjusted difference.

```r
cars48 <- mtcars[mtcars$cyl %in% c(4, 8), ]
cars48$large <- cars48$cyl == 8
round(coef(summary(lm(mpg ~ large, data = cars48))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  26.6636     1.0680 24.9656        0
#> largeTRUE   -11.5636     1.4272 -8.1024        0
```

Four-cylinder cars run 11.56 mpg better, and the difference is large and clearly significant. The comparability question is whether the two groups occupy the same range on the characteristics that drive fuel economy, weight chief among them, so the check compares the weight ranges and finds the band both groups share.

```r
wt4 <- cars48$wt[!cars48$large]
wt8 <- cars48$wt[cars48$large]
rng <- rbind(`4cyl` = range(wt4), `8cyl` = range(wt8))
colnames(rng) <- c("min_wt", "max_wt")
rng
lo <- max(min(wt4), min(wt8))
hi <- min(max(wt4), max(wt8))
c(support_lo = lo, support_hi = hi,
  cars_in_overlap = sum(cars48$wt >= lo & cars48$wt <= hi))
#>      min_wt max_wt
#> 4cyl  1.513  3.190
#> 8cyl  3.170  5.424
#>      support_lo      support_hi cars_in_overlap
#>            3.17            3.19            2.00
```

The four-cylinder cars span 1.51 to 3.19 thousand pounds and the eight-cylinder cars span 3.17 to 5.42, so the only weight they have in common is the sliver between 3.17 and 3.19, which holds two of the twenty-five cars. Below that band every car is a four-cylinder and above it every car is an eight-cylinder, so for almost the whole range there is no eight-cylinder car of the same weight to set against a four-cylinder car, and no four-cylinder car to set against an eight-cylinder one. There is no fixed cutoff for how much overlap is enough, but two cars out of twenty-five means the comparison would rest almost entirely on cars that have no counterpart in the other group. What you do next depends on how much common ground the check leaves you.

## What to do about it

### You are fine

The groups cover the same ground on the characteristics that matter, or the design assigned them at random so comparability holds by construction. In the `ToothGrowth` experiment the guinea pigs given orange juice and those given vitamin C received the same three doses by design, ten animals at each, so the two supplement groups sit on an identical dose range.

```r
oj_dose <- ToothGrowth$dose[ToothGrowth$supp == "OJ"]
vc_dose <- ToothGrowth$dose[ToothGrowth$supp == "VC"]
lo_d <- max(min(oj_dose), min(vc_dose))
hi_d <- min(max(oj_dose), max(vc_dose))
c(support_lo = lo_d, support_hi = hi_d,
  obs_in_overlap = sum(ToothGrowth$dose >= lo_d & ToothGrowth$dose <= hi_d),
  obs_total = nrow(ToothGrowth))
#>     support_lo     support_hi obs_in_overlap      obs_total
#>            0.5            2.0           60.0           60.0
```

Every dose that appears in one group appears in the other, so all sixty animals fall inside the shared range and each orange-juice observation has vitamin-C counterparts at the same dose. A comparison like this needs no extrapolation, because the model never has to guess what a control would have looked like at a dose no control received. The strongest version of this case is a randomised trial, where assignment itself makes the groups comparable in expectation, and the reporting guidelines then ask you to describe how the groups were formed rather than to test them for balance (von Elm et al., 2007, *STROBE*). To show a reviewer you are here, report how the comparison group was assembled and show that it covers the same range as the treated group on the variables that predict the outcome.

### It is fixable

The groups overlap over part of the range but not all of it, and you can restrict the comparison to the region they share. Compare the four-cylinder cars against the six-cylinder cars instead, and the raw gap is 6.92 mpg.

```r
cars46 <- mtcars[mtcars$cyl %in% c(4, 6), ]
cars46$six <- cars46$cyl == 6
round(coef(summary(lm(mpg ~ six, data = cars46))), 4)
lo6 <- max(min(cars46$wt[cars46$six]), min(cars46$wt[!cars46$six]))
hi6 <- min(max(cars46$wt[cars46$six]), max(cars46$wt[!cars46$six]))
common <- cars46[cars46$wt >= lo6 & cars46$wt <= hi6, ]
c(support_lo = lo6, support_hi = hi6, n_common = nrow(common))
round(coef(summary(lm(mpg ~ six, data = common))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  26.6636     1.1080 24.0650   0.0000
#> sixTRUE      -6.9208     1.7767 -3.8952   0.0013
#> support_lo support_hi   n_common
#>       2.62       3.19       6.00
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  22.8667     0.6852 33.3742   0.0000
#> sixTRUE      -2.3000     0.9690 -2.3737   0.0765
```

The four- and six-cylinder cars share the weight band from 2.62 to 3.19, which holds six cars, three of each kind. Restricting the comparison to those six, the gap falls from 6.92 mpg to 2.30 and is no longer significant at the conventional level (p = 0.08), because most of the raw deficit came from setting light four-cylinder cars against heavy six-cylinder cars that had no light counterpart. A fair comparison exists only among cars of similar weight, and among those the difference is smaller and less certain. Report the restricted estimate and say plainly that it answers a narrower question than the full-sample one, since it speaks only to the overlapping range. Trimming throws away data, so where you can, [matching or a propensity score](/Matching-and-the-Propensity-Score.html) keeps more of the sample by pairing comparable units rather than discarding the rest.

### It is a real problem

The groups barely overlap at all, and no adjustment can manufacture the comparison the data do not contain. Return to the four- against eight-cylinder cars, where the shared weight band held only two cars. You can still put weight in the model, and it will still print a number.

```r
round(coef(summary(lm(mpg ~ large + wt, data = cars48))), 4)
ff <- function(f) unname(coef(lm(f, data = cars48))["largeTRUE"])
round(c(linear    = ff(mpg ~ large + wt),
        quadratic = ff(mpg ~ large + wt + I(wt^2)),
        cubic     = ff(mpg ~ large + poly(wt, 3))), 2)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  34.0598     2.1498 15.8430   0.0000
#> largeTRUE    -6.0191     1.8676 -3.2229   0.0039
#> wt           -3.2358     0.8633 -3.7481   0.0011
#>    linear quadratic     cubic
#>     -6.02     -4.42     -6.36
```

The adjusted gap is 6.02 mpg, down from the raw 11.56, which looks like a clean correction until you remember there were only two cars in the overlap. Because the two groups scarcely share a weight, that coefficient rests on extending the weight-mpg line from the four-cylinder cars into the heavy range where only eight-cylinder cars live, and from the eight-cylinder cars into the light range where only four-cylinder cars live. Change the shape of that line and the estimate moves with it: weight as a straight term gives 6.02, a quadratic gives 4.42, and a cubic gives 6.36, a spread driven by the assumed functional form rather than by data in the gap. When the answer depends on an assumption the data cannot check, the comparison is not identifiable, and reporting the adjusted number as though it were solid would overstate what the study can support. The honest paths are to restrict the claim to the narrow range where the groups do overlap and report that smaller question, or to state in the Limitations that the comparison group is not comparable and the contrast cannot be estimated from these data.

## How to word your response

### If you are fine

> The reviewer asks us to establish that the comparison group is comparable to the treated group. The two groups were assembled to cover the same range of the characteristics that predict the outcome, and we now report that overlap directly: every value of the key covariate present in one group is present in the other, so no part of the estimate rests on extrapolation (Methods, page X). Because a like-with-like comparison is available across the whole range, the reported contrast does not depend on assumptions about regions where one group is absent, and we have added the covariate-overlap summary so the reader can see this.

### If it is fixable

> We thank the reviewer for pressing on comparability. The full-sample comparison did include treated and control units with no counterpart in the other group, and we agree that this stretch was doing part of the work. We have restricted the primary comparison to the region where the two groups overlap on the outcome-relevant covariates; within that region the difference falls from 6.92 to 2.30 units and is no longer significant at the conventional level (Results, page X). We now report this restricted estimate as the primary result, state that it speaks to the overlapping range rather than the whole sample, and give the full-sample figure alongside it.

### If it is a real problem

> We agree with the reviewer that the two groups are not comparable. They overlap on only a narrow slice of the characteristics that drive the outcome, and a covariate-adjusted estimate over the full range would rest on extrapolation rather than on data, moving by several units as the functional form is varied. We do not report such an estimate as though it were reliable. We have restricted the analysis to the overlapping range and reported the narrower contrast it supports (Methods, page X), and we state in the Limitations that outside that range the comparison group provides no basis for the comparison and the effect is not identifiable from these data.

## Practice

A reviewer writes: *"July and September are not comparable months. Ozone chemistry, temperature and sunlight all differ between them, so the difference you report is not a clean comparison and should not be presented as one."* Before deciding what the comparison can support, you check how much the two months overlap on temperature, the main driver of ozone.

```r
ex_jul_sep <- airquality[airquality$Month %in% c(7, 9) & !is.na(airquality$Ozone), ]
ex_jul_sep$july <- ex_jul_sep$Month == 7
coef(summary(lm(Ozone ~ july, data = ex_jul_sep)))
ex_lo <- max(min(ex_jul_sep$Temp[ex_jul_sep$july]), min(ex_jul_sep$Temp[!ex_jul_sep$july]))
ex_hi <- min(max(ex_jul_sep$Temp[ex_jul_sep$july]), max(ex_jul_sep$Temp[!ex_jul_sep$july]))
c(support_lo = ex_lo, support_hi = ex_hi,
  days_in_overlap = sum(ex_jul_sep$Temp >= ex_lo & ex_jul_sep$Temp <= ex_hi),
  days_total = nrow(ex_jul_sep))
coef(summary(lm(Ozone ~ july + Temp, data = ex_jul_sep)))
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The raw difference looks like the reviewer is right to worry: July ozone runs 27.67 units higher than September (p = 0.0006), and the two months plainly differ. But the overlap check tells a different story. The two months share the temperature band from 73 to 92 degrees, and 43 of the 55 days fall inside it, so a wide region of common support exists rather than the near-total separation that would sink the comparison.

This is the "it is fixable" outcome, and it is a case where the obvious move is the wrong one. The reviewer's framing invites you to abandon the comparison as hopeless, yet because the months overlap so heavily on temperature you can compare like with like across most of the range. Adjusting for temperature, the July-versus-September gap falls from 27.67 to 7.41 units and is no longer significant (p = 0.22), while temperature enters at 2.90 units per degree (p < 0.001), which says the raw gap was mostly the weather rather than the calendar. The right reply is to report the temperature-adjusted comparison, note the substantial overlap that makes it credible, and let the shrunken, non-significant month effect stand as the finding, rather than either presenting the raw gap or discarding the comparison altogether.

</details>

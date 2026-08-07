---
title: "Mixed Models in Peer Review"
slug: Mixed-Models-in-Peer-Review
description: "A reviewer says you should have used a mixed model. Check in R whether the random effect is warranted, decide if it changes your result, and word the reply."
keywords: "a mixed model should have been used, mixed model reviewer comment, random effect peer review, use a mixed model response to reviewer, multilevel model reviewer, random intercept reviewer response"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 55
auto_link_terms: mixed model objection|random effect reviewer|use a mixed model reviewer|random intercept response|multilevel model reviewer comment|too few groups random effect
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A mixed model, also called a multilevel or mixed-effects model, folds the grouping structure of your data into the model as a random effect, so that measurements taken on the same subject, site, or litter are no longer treated as unrelated. A reviewer who asks for one is usually right that the grouping needs handling. Whether it actually changes your result depends on how much of the variation sits between the groups rather than within them, and that is a number you can read off in one line.</p>

## What the reviewer wrote

> The authors have fitted an ordinary regression, but each participant contributed several measurements. A mixed-effects model with a random intercept for participant would be more appropriate here.

> Observations are nested within clinics. This needs a multilevel model, not OLS.

> The analysis is reasonable as far as it goes, though I was left wondering whether the repeated sampling of the same plots across the season has been accounted for, since the standard errors in Table 3 seem rather small for a study of this size, and I would expect a random effect for plot to widen them.

## What they actually mean

The reviewer wants the grouping put into the model. Your rows arrive in clusters, and within a cluster they resemble each other more than they resemble rows from other clusters. What is in doubt is rarely the estimate itself. It is whether the precision you reported is honest, given that some of your observations carry overlapping information. A random intercept for the cluster is the default tool, but the reviewer naming it does not make it the only acceptable answer, only that the dependence must be handled somehow. When the objection is phrased as an effective-sample-size or precision complaint rather than as a request for a named model, the companion chapter [Non-Independent Observations in Peer Review](/Non-Independent-Observations-in-Peer-Review.html) works the same problem from the intraclass correlation.

## Why they are asking

An ordinary regression counts every row as a full, independent piece of evidence, and for anything that varies between the clusters that count is too generous. Suppose a treatment is given to whole litters and then every pup is weighed: the model sees hundreds of pups, but the treatment was only ever assigned a couple of dozen times, so the real evidence lives at the litter level. Ignoring that makes the standard error too small and the p-value too optimistic. A between-cluster effect can then look convincing on thin evidence. A random intercept repairs it by splitting the leftover variation into a between-group part and a within-group part, then spending the right amount of information on each comparison. The estimate itself usually barely moves, because clustering does not bias it; what moves is the uncertainty around it (Pinheiro and Bates, 2000). Journals expect the analysis to match the design, and STROBE item 12 asks authors to describe all the statistical methods they used, which for clustered data means saying how the clustering was handled (von Elm et al., 2007). The mechanics of fitting and reading one of these models are covered in [Multilevel Models in R](/Multilevel-Models-in-R.html), so the rest of this chapter stays on whether you need it and what to say.

## How to check it

The question is not whether your data have groups, but whether those groups carry enough variation to matter. Fit the model the reviewer is asking for, then look at two things: how the between-group variation compares with the within-group variation, and whether adding the random effect improves the fit at all. The orthodontic growth data follows 27 children, each measured four times as they grow, so every child is a cluster of four correlated measurements.

```r
library(nlme)
mm <- lme(distance ~ age + Sex, random = ~ 1 | Subject, data = Orthodont)
VarCorr(mm)
#> Subject = pdLogChol(1)
#>             Variance StdDev
#> (Intercept) 3.266784 1.807425
#> Residual    2.049456 1.431592
```

The between-child standard deviation, 1.81, is larger than the residual standard deviation, 1.43, so a good share of the leftover variation is differences between children rather than scatter within a child. That is a strong hint the grouping matters. To turn the hint into a test, compare the model against the same fit stripped of its random effect.

```r
gls0 <- gls(distance ~ age + Sex, data = Orthodont, method = "ML")
mmML <- lme(distance ~ age + Sex, random = ~ 1 | Subject, data = Orthodont, method = "ML")
anova(gls0, mmML)
#>      Model df      AIC      BIC    logLik   Test  L.Ratio p-value
#> gls0     1  4 488.6836 499.4121 -240.3418
#> mmML     2  5 444.8565 458.2671 -217.4282 1 vs 2 45.82714  <.0001
```

The likelihood-ratio test pits the ordinary regression (`gls0`) against the mixed model (`mmML`), and the random intercept improves the fit by a wide margin with a tiny p-value, so for this dataset the mixed model is clearly warranted. One caution on reading that figure: the test asks whether a variance is zero, and zero sits at the very edge of what a variance can be, so the reported p-value is conservative and the real evidence for the random effect is if anything a little stronger (Self and Liang, 1987). There is no universal cutoff for the variance split, because a between-group share that is trivial in one design can dominate another, so read it next to where your predictor of interest sits relative to the groups.

## What to do about it

### You are fine

Not every grouping earns a random effect. Sometimes the between-group variation is so slight that the mixed model collapses back to the ordinary regression you already ran, and the check says so plainly. Imagine a reviewer treats cars with the same cylinder count as a cluster and asks for a random intercept for the number of cylinders.

```r
mt <- transform(mtcars, cyl = factor(cyl))
mt_g <- gls(mpg ~ wt + hp, data = mt, method = "ML")
mt_m <- lme(mpg ~ wt + hp, random = ~ 1 | cyl, data = mt, method = "ML")
round(anova(mt_g, mt_m)[["p-value"]][2], 3)
#> [1] 0.801
round(rbind(ols = coef(mt_g), mixed = fixef(mt_m)), 4)
#>       (Intercept)      wt      hp
#> ols       37.2273 -3.8778 -0.0318
#> mixed     36.8141 -3.7834 -0.0313
```

The likelihood-ratio test returns p = 0.80, so the random intercept does not improve the fit, and the coefficients for weight and horsepower are almost the same with or without it. Adding the structure the reviewer asked for changes nothing, so the ordinary regression stands. There is a second way to land here. If your published analysis already handled the grouping some other way, whether as a set of indicator variables, with cluster-robust standard errors, or with a GEE, the reply is not to refit anything but to point the reviewer at the term that already does the job. Either way the reply rests on a number, because "we checked and it did not matter" only persuades once a value is attached to it.

### It is fixable

The common case is that the random effect is warranted, you refit, and the conclusion you cared about survives the wider standard errors. Return to the orthodontic data and set the ordinary regression beside the mixed model, coefficient by coefficient.

```r
round(summary(lm(distance ~ age + Sex, data = Orthodont))$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  17.7067     1.1122 15.9203        0
#> age           0.6602     0.0978  6.7532        0
#> SexFemale    -2.3210     0.4449 -5.2171        0
round(summary(mm)$tTable, 4)
#>               Value Std.Error DF t-value p-value
#> (Intercept) 17.7067    0.8339 80 21.2330  0.0000
#> age          0.6602    0.0616 80 10.7163  0.0000
#> SexFemale   -2.3210    0.7614 25 -3.0483  0.0054
```

The estimates do not move at all, because the balanced design means clustering leaves the coefficients untouched: age still adds 0.66 mm per year and the sex gap stays at 2.32 mm. The standard errors move in opposite directions. Age is measured within each child, so pulling out the between-child differences sharpens it, and its standard error falls from 0.0978 to 0.0616. Sex is a comparison between children, so the honest standard error is larger than the naive one, rising from 0.4449 to 0.7614, and its t-value drops from 5.22 to 3.05. Even after that correction the sex difference clears the usual bar at p = 0.0054. The finding holds, and the fix is simply to report the mixed model as the primary analysis. Since nlme prints a p-value here but lme4 does not, [Mixed Model Inference in R](/Mixed-Model-Inference-in-R.html) covers how to get one when your fit does not show it.

### It is a real problem

Sometimes respecting the grouping removes the result. When a between-cluster effect rested on counting the within-cluster replicates as independent, the honest standard error can be wide enough to erase it. The rat-pup data assigns a dose to each whole litter and then weighs every pup, so the treatment is a litter-level variable measured on 27 litters, not on 322 pups.

```r
rp <- RatPupWeight
rp$Treatment <- factor(as.character(rp$Treatment), levels = c("Control", "Low", "High"))
round(summary(lm(weight ~ Treatment, data = rp))$coefficients, 4)
#>               Estimate Std. Error  t value Pr(>|t|)
#> (Intercept)     6.3247     0.0539 117.3695        0
#> TreatmentLow   -0.3964     0.0770  -5.1507        0
#> TreatmentHigh  -0.4392     0.0936  -4.6935        0
round(summary(lme(weight ~ Treatment, random = ~ 1 | Litter, data = rp))$tTable, 4)
#>                 Value Std.Error  DF t-value p-value
#> (Intercept)    6.4533    0.1716 295 37.5983  0.0000
#> TreatmentLow  -0.4287    0.2435  24 -1.7609  0.0910
#> TreatmentHigh -0.3944    0.2696  24 -1.4632  0.1564
```

Treated as 322 independent pups, both doses cut weight with p-values below 0.001. Once the model knows those pups come from 27 litters, the picture changes. The low-dose effect keeps almost the same size, going from -0.40 to -0.43 g, but its standard error more than triples, from 0.0770 to 0.2435, and its p-value climbs to 0.09. The high-dose effect walks the same road to p = 0.16. None of this is a trick of the estimate, since both effects stay near half a gram; the data simply do not hold enough independent litters to pin the effect down at the strength the naive analysis claimed. The honest path is to report the mixed model, state that the dose effect is no longer significant once litter is accounted for, and revise any conclusion that leaned on it. If the design confounds dose with litter so completely that no model can separate them, that belongs in the limitations rather than in a p-value.

## How to word your response

### If you are fine

> We thank the reviewer for the suggestion, and we refitted the model with a random intercept for the grouping they identified. The random-effect variance is negligible, a likelihood-ratio test does not support keeping it (p = 0.80), and the coefficients of interest are unchanged from the ordinary regression. We have therefore retained the original model and now report this check in the Methods (page X), so that a reader can see the clustering was tested rather than overlooked.

### If it was fixable

> The reviewer is right that our participants each contributed several measurements, which the original model treated as independent. We have refitted the analysis as a mixed model with a random intercept for participant. The estimated effects are essentially unchanged, but their standard errors now reflect the repeated-measures structure: the within-participant effect is estimated more precisely, while the between-participant contrast is estimated less precisely, as expected. The effect we report remains significant under the mixed model (p = 0.005), and we now present that model as our primary analysis in Table 2, with the change of method described in the Methods (page X).

### If it is a real problem

> We agree with the reviewer. Although we recorded 322 measurements, the treatment was assigned to only 27 groups, and the comparison rests on that smaller number of independent units. Refitting with a random intercept for group leaves the estimated effect close to its original size but widens its standard error, so that it is no longer significant at conventional levels. We have revised the Results to report the mixed-model estimate with its confidence interval, and we no longer describe this effect as statistically significant (Results, page X; Methods, page X).

## Practice

A reviewer writes: *"The two wool types are a grouping factor, and breaks measured on the same wool are not independent. The authors should refit with a mixed model that includes a random intercept for wool before drawing any conclusions about tension."* You are testing whether loom tension affects the number of warp breaks, and you run:

```r
ex_dat   <- warpbreaks
ex_ols   <- lm(breaks ~ tension, data = ex_dat)
ex_fixed <- lm(breaks ~ tension + wool, data = ex_dat)
nlevels(ex_dat$wool)
round(summary(ex_ols)$coefficients, 4)
round(summary(ex_fixed)$coefficients, 4)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The instinct is to do what the reviewer asked and add a random intercept for wool, and that is the wrong move. The reason is the count on the first line: wool has only two levels. A random effect works by estimating the variance of the group means, and you cannot estimate a variance from two groups with any reliability, so the standard advice is that a factor with only a handful of levels, fewer than five or so, belongs in the model as a fixed effect rather than a random one (Gelman and Hill, 2007).

Put in as a fixed effect, wool does almost nothing to the tension conclusions. The tension coefficients are identical to four decimal places whether or not wool is included, at -10.0000 for medium and -14.7222 for high, and their standard errors barely stir, from 3.9602 to 3.8724. Wool itself is not significant, with woolB at -5.7778 and p = 0.0736. So this is a "you are fine" case: the dependence the reviewer worried about is real in principle, but it is fully absorbed by a one-line fixed effect that leaves the finding intact, and forcing a two-level random effect would be less defensible than the model you already have. The reply is to add wool as a fixed effect, show that the tension estimates are unchanged, and explain why two groups are too few to support a random intercept.

</details>

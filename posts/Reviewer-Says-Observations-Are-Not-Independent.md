---
title: "Reviewer says my observations are not independent"
slug: Reviewer-Says-Observations-Are-Not-Independent
description: "A reviewer says your observations are not independent, from clustering or repeated measures. Check the intraclass correlation in R, decide if it matters, reply."
keywords: "observations are not independent reviewer comment, clustered data peer review, repeated measures reviewer response, reviewer says observations not independent, mixed model response to reviewer"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 33
auto_link_terms: non-independence objection|clustered data reviewer|repeated measures reviewer|intraclass correlation response|random intercept response|pseudoreplication
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Clustered or repeated-measures data break the assumption that every row is a fresh, independent observation. This rarely moves the estimate itself, but it shrinks the amount of independent information in your sample, so the standard errors and p-values from an ordinary model come out too small whenever the effect you care about varies between the clusters rather than within them.</p>

## What the reviewer wrote

> The design involves repeated measurements on the same participants, yet the analysis appears to treat every observation as independent. This should be addressed before the results can be interpreted.

> Your 84 data points come from only 12 animals. The effective sample size is much smaller than the degrees of freedom in Table 2 imply.

> I also note that patients were recruited across several clinics, and I wondered whether outcomes within a clinic might be more alike than outcomes between clinics, and whether that has any bearing on the confidence intervals reported in the Results.

## What they actually mean

Your observations fall into groups, and within a group they resemble each other more than they resemble observations in other groups. Measurements on the same patient, animals from the same litter, or repeated readings on the same plant all share something the model does not know about. When two observations are correlated like this, the second adds less than a full observation's worth of new information, so the real amount of independent data is smaller than the row count says.

The reviewer is not claiming your estimate is biased, and is not asking you to add another covariate. What is in doubt is the precision the model reported: the standard errors, the confidence intervals, and the p-values, all of which were computed as if you had more independent observations than you really do. This is a different problem from autocorrelation, where the dependence follows the time order within a single series; here the dependence comes from the grouping structure of the data, not from time.

## Why they are asking

An ordinary regression, t-test or ANOVA assumes the observations are independent, and it uses the full row count when it works out how precise the estimates are. When the observations cluster, that row count is an overstatement. The usual way to measure the overstatement is the intraclass correlation, the share of the leftover variation that sits between clusters rather than within them, taken together with the average cluster size. The two combine into the design effect, `1 + (m - 1) * ICC` for clusters of size `m`, and dividing the sample size by the design effect gives the effective number of independent observations (Kish, Survey Sampling, 1965).

The consequences depend on where your predictor lives. For a predictor that changes between clusters, such as a treatment given to whole clinics or a diet fed to whole animals, ignoring the clustering makes the standard error too small, the confidence interval too narrow, and the p-value too optimistic, so an effect can look significant when the between-cluster evidence is thin. Analysing grouped data as though it were independent in this way is what Hurlbert (1984) named pseudoreplication. For a predictor that changes within clusters, such as a measurement repeated on the same subject over time, the clustering often does no harm and can even sharpen the estimate. Reporting guidelines expect the issue to be handled on its face: the CONSORT extension for cluster randomised trials asks authors to report the intraclass correlation and how clustering was accounted for (Campbell et al., BMJ 2012), and STROBE item 12 asks you to describe the statistical methods used to account for the design.

The standard fix is a model that contains the grouping, most often a mixed model with a random intercept for the cluster. The mechanics of fitting one are covered in [Random Intercepts and Slopes with lme4 in R](/Random-Intercepts-and-Slopes-in-R.html); this chapter is about deciding whether you have a problem and what to say.

## How to check it

Two numbers settle it: how strong the within-cluster correlation is, and how much it shrinks your sample. Fit a model with a random intercept for the grouping factor and read the variance it assigns to the cluster against the residual. The chick-growth data, where each chick is weighed repeatedly as it grows, is a clear example.

```r
library(lme4)
mm <- lmer(weight ~ Time + Diet + (1 | Chick), data = ChickWeight)
vc <- as.data.frame(VarCorr(mm))[, c("grp", "vcov")]
vc$vcov <- round(vc$vcov, 1)
vc
#>        grp  vcov
#> 1    Chick 525.4
#> 2 Residual 799.4
icc <- as.numeric(vc$vcov[vc$grp == "Chick"] / sum(vc$vcov))
round(icc, 3)
#> [1] 0.397
```

About 40 percent of the variation left after diet and time is between chicks rather than within them. Now turn that into an effective sample size.

```r
n_i  <- table(ChickWeight$Chick)
deff <- 1 + (mean(n_i) - 1) * icc
round(c(clusters = length(n_i), mean_size = mean(n_i),
        design_effect = deff, effective_n = sum(n_i) / deff), 1)
#>      clusters     mean_size design_effect   effective_n 
#>          50.0          11.6           5.2         111.4 
```

The 578 rows carry about as much independent information as 111 observations would, because each chick contributes roughly twelve correlated weighings. A standard error computed from the full row count is therefore about `sqrt(5.2)`, or 2.3 times, too small. There is no universal threshold for the intraclass correlation: a value of 0.01 can matter when clusters are large, and a value of 0.3 can be harmless when the predictor varies within clusters, so read the ICC through the design effect and the design rather than against a fixed cutoff.

## What to do about it

### You are fine

The clustering is weak, or the effect you care about is measured within clusters and the correction leaves it standing. The loblolly-pine data has 14 trees each measured at six ages, so age varies within a tree.

```r
naive_lob <- lm(height ~ age, data = Loblolly)
mixed_lob <- lmer(height ~ age + (1 | Seed), data = Loblolly)
round(summary(naive_lob)$coefficients["age", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>     2.5905     0.0409    63.2717     0.0000 
round(summary(mixed_lob)$coefficients["age", ], 4)
#>   Estimate Std. Error    t value 
#>     2.5905     0.0392    66.1359 
v_lob <- as.data.frame(VarCorr(mixed_lob))
round(v_lob$vcov[1] / sum(v_lob$vcov), 3)
#> [1] 0.089
```

The intraclass correlation is only 0.09, and the mixed model returns the same slope with a slightly smaller standard error than the naive fit, so accounting for the clustering does nothing to weaken the age effect. If your reported analysis already used a mixed model, cluster-robust standard errors, or a GEE, you are in this case for a different reason: the objection is already met, and the reply is to point the reviewer at the term in the model that handles it. Either way, report the intraclass correlation so the claim rests on a number.

### It is fixable

The correlation is real and your predictor varies between clusters, so the naive standard errors are too small, but the fix is a one-line change of model and the conclusion survives it. Compare the diet effects in the chick data before and after adding the random intercept.

```r
naive_cw <- lm(weight ~ Time + Diet, data = ChickWeight)
round(summary(naive_cw)$coefficients[, 1:2], 4)
#>             Estimate Std. Error
#> (Intercept)  10.9244     3.3607
#> Time          8.7505     0.2218
#> Diet2        16.1661     4.0858
#> Diet3        36.4994     4.0858
#> Diet4        30.2335     4.1075
round(summary(mm)$coefficients[, 1:2], 4)
#>             Estimate Std. Error
#> (Intercept)  11.2438     5.7887
#> Time          8.7172     0.1755
#> Diet2        16.2100     9.4643
#> Diet3        36.5433     9.4643
#> Diet4        30.0129     9.4708
```

The diet estimates barely move: diet 3 goes from 36.50 to 36.54. Their standard errors roughly double, from 4.09 to 9.46 for diet 3, which is the 2.3-fold correction the design effect predicted. Diet 3 and diet 4 keep t values above 3 and stay clearly significant, so the main finding holds; the diet-2 contrast, whose t value falls from 3.96 to 1.71, no longer clears the usual bar. The remedy is to fit the mixed model, report it as the primary analysis, and adjust any claim that leaned on the weakest contrast. [Mixed Model Inference in R](/Mixed-Model-Inference-in-R.html) covers how to get p-values and confidence intervals from the fit, since lme4 does not print them by default.

### It is a real problem

Sometimes the correction removes the finding: when the whole result rested on treating correlated observations as independent, respecting the clustering can leave you with no significant effect. The carbon-dioxide uptake data compares chilled and control plants, with the treatment applied to whole plants that were each measured at seven concentrations.

```r
naive_co2 <- lm(uptake ~ Treatment, data = CO2)
mixed_co2 <- lmer(uptake ~ Treatment + (1 | Plant), data = CO2)
round(summary(naive_co2)$coefficients, 4)
#>                  Estimate Std. Error t value Pr(>|t|)
#> (Intercept)       30.6429     1.5911 19.2589   0.0000
#> Treatmentchilled  -6.8595     2.2502 -3.0485   0.0031
round(summary(mixed_co2)$coefficients, 4)
#>                  Estimate Std. Error t value
#> (Intercept)       30.6429     3.0371 10.0895
#> Treatmentchilled  -6.8595     4.2951 -1.5970
```

The estimated chilling effect is identical in the two models, -6.86, because clustering does not bias the estimate. What changes is the standard error, which widens from 2.25 to 4.30 once the model recognises that the evidence comes from 12 plants and not 84 measurements, and the t value falls from -3.05 to -1.60. The naive p-value of 0.003 came from counting each plant seven times, and there is no clever repair, because the data do not hold enough independent units to support the claim at the strength first reported. The honest path is to report the mixed-model result, state plainly that the between-cluster comparison is weaker than the raw analysis suggested, and revise the conclusion. If the design confounds the treatment with the cluster entirely, so that no model can separate them, that belongs in the limitations.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. Each tree was measured at six ages, and our model already includes a random intercept for tree, so the correlation between repeated measurements is accounted for. The intraclass correlation is small (0.09) and the estimated age effect is unchanged from an ordinary regression, so the repeated-measures structure does not affect our conclusion. The model specification and the intraclass correlation are now stated in the Methods (page X).

### If it was fixable

> The reviewer is correct that our design has repeated weighings within each chick, and the original model treated them as independent. We have refitted the analysis as a mixed model with a random intercept for chick. The estimated diet effects are almost identical, but their standard errors roughly double, from about 4 to about 9 for the largest effect, once the within-chick correlation is included. The two larger diet effects remain clearly significant, while the smallest contrast is now borderline, and we have softened that particular claim. The revised model appears in Table 2, and the change of method is described in the Methods (page X).

### If it is a real problem

> We agree with the reviewer. Although we recorded 84 measurements, they come from only 12 plants, and the comparison between chilled and control plants rests on that smaller number of independent units. Refitting with a random intercept for plant leaves the estimated difference unchanged but widens its standard error, and the effect is no longer significant at conventional levels. We have revised the Results to report the mixed-model estimate and its confidence interval, and we no longer describe this comparison as statistically significant on its own (Results, page X; Methods, page X).

## Practice

A reviewer writes: *"These 180 reaction-time measurements come from just 18 participants, each measured on ten consecutive days. Treating them as 180 independent observations badly overstates the sample size, and the reported effect of sleep deprivation cannot be trusted as analysed."* You run the check:

```r
ex_naive <- lm(Reaction ~ Days, data = sleepstudy)
ex_mixed <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
ex_vc <- as.data.frame(VarCorr(ex_mixed))
round(ex_vc$vcov[1] / sum(ex_vc$vcov), 3)
round(summary(ex_naive)$coefficients["Days", ], 4)
round(summary(ex_mixed)$coefficients["Days", ], 4)
c(subjects = length(unique(sleepstudy$Subject)), rows = nrow(sleepstudy))
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Everything the reviewer says about the counts is true. There are 18 participants and 180 rows, and the intraclass correlation is 0.589, so more than half the leftover variation is between participants. A design-effect calculation on those numbers looks alarming, and a reader who stops there would concede the point.

The point should not be conceded, because the effect under test is the change in reaction time per day of sleep deprivation, and days vary within each participant, not between them. Refitting with a random intercept for subject leaves the slope unchanged at 10.47 milliseconds per day, and its standard error falls from 1.2382 to 0.8042, so the t value rises from 8.45 to 13.02. Accounting for the clustering makes the effect more precise, not less, which puts this in the first outcome: you are fine, and the reply is to report the mixed model, note that the estimate is unchanged and the standard error smaller, and explain that a within-subject effect is not weakened by between-subject correlation.

It is easy to read a high intraclass correlation as automatic evidence that a result is inflated. Whether that is true depends on where the predictor sits: a predictor that varies between clusters loses precision when the clustering is modelled, while a within-subject predictor like this one does not.

</details>

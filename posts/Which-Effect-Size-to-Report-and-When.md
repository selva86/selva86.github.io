---
title: "Which Effect Size to Report, and When"
slug: Which-Effect-Size-to-Report-and-When
description: "Effect size is a family, not one number. How to choose between a raw difference, Cohen's d, an odds ratio or a standardized beta, and report the right one."
keywords: "which effect size to report, choosing an effect size, standardized vs unstandardized effect size, Cohen's d or mean difference, odds ratio or risk ratio, effect size for regression"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 4
handbook_chapter: 14
auto_link_terms: which effect size to report|choosing an effect size|which effect size to use|standardized effect size|unstandardized effect size|raw effect size
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">An effect size is the magnitude of your result, but "effect size" names a family of numbers rather than one. Which member you report is settled partly by the analysis you ran and partly by a judgement call: report the effect in the outcome's own units when a reader can interpret them, and add a standardized, unitless version when the number has to be compared across studies.</p>

## The decision you are making

You have run the analysis and now have to say how large the result is. The difficulty is that a mean difference, a standardized mean difference, a correlation, an odds ratio and a hazard ratio are all effect sizes, and they are not interchangeable. Report the wrong one and you either hide the magnitude a reader wants or inflate it past what the data support.

Two decisions are folded together here. The first is made for you by the analysis: a two-group comparison has a natural effect size, a regression has another, a binary outcome another again, and you rarely get to reach across those families. The second needs judgement, because within a family you can usually report the effect in the outcome's own units or in a standardized form that strips the units out, and that choice turns on whether the reader can interpret the units and on whether the number has to travel to a meta-analysis.

This chapter is about that choice, not the arithmetic. Computing Cohen's d, eta-squared, Cramer's V and the rest is covered in [Effect Size in R](/Effect-Size-in-R.html), which also assumes you have already decided to report a size at all. If a reviewer is telling you that you gave p-values and nothing else, whether to add an effect size is [Missing Effect Sizes in Peer Review](/Missing-Effect-Sizes-in-Peer-Review.html); here you have accepted that you need one and are working out which it should be.

## What the options are

Start from what you ran, because it fixes the family. Each row below gives the effect size in the outcome's own units, then the standardized version that removes those units.

| Analysis you ran | In the outcome's own units | Standardized version |
|---|---|---|
| Two groups, continuous outcome | Difference in means, with a CI | Cohen's d (Hedges' g when the sample is small) |
| Regression, one predictor | The unstandardized slope | Standardized (beta) coefficient |
| Predictors on different scales | Each slope in its own units | Standardized coefficients, now comparable |
| Correlation or shared variance | r, or R-squared | already unitless |
| Three or more group means | The group means and their differences | Eta-squared or omega-squared |
| Binary outcome from a 2x2 | Risk difference, risk ratio | Odds ratio |
| Time to an event | (no natural unit form) | Hazard ratio |

The column you lean on is the middle one wherever the units carry meaning. A gap of 7 mpg, or 4 mmHg, or 12 percentage points tells a reader something they can weigh against what they already know, whereas the same gap written as d = 0.6 does not, which is why Baguley (2009) argues that a simple effect size in meaningful units should be the default and the standardized form the supplement. The right-hand column earns its place in two situations. One is when the units are arbitrary, as with a summed questionnaire score or a latent scale, so a standard-deviation yardstick is the only interpretable one available. The other is when the number has to be pooled with other work, because a meta-analysis needs everything on a common scale, and that is the case Lakens (2013) has in mind when he recommends reporting the standardized value alongside the raw one whenever a result might later be combined.

## How to decide

Three cases cover almost everything, and in each one the decision shows up in the output rather than in the abstract.

Start with the common one: two groups and a measured outcome. In `mtcars`, compare fuel economy between automatic and manual cars, and set the raw difference and the standardized one side by side.

```r
res <- t.test(mpg ~ am, data = mtcars)
auto <- mtcars$mpg[mtcars$am == 0]
man  <- mtcars$mpg[mtcars$am == 1]
sp <- sqrt(((length(auto) - 1) * var(auto) + (length(man) - 1) * var(man)) /
             (length(auto) + length(man) - 2))
d <- (mean(man) - mean(auto)) / sp
round(c(raw_diff = mean(man) - mean(auto),
        ci_low  = -res$conf.int[2],
        ci_high = -res$conf.int[1],
        cohens_d = d), 2)
#> raw_diff   ci_low  ci_high cohens_d 
#>     7.24     3.21    11.28     1.48 
```

Both numbers are correct. The raw difference says manual cars average 7.24 mpg more, with a 95% interval from 3.21 to 11.28, and anyone who knows what a mile per gallon is can decide on the spot whether that gap matters. Cohen's d of 1.48 says the same gap is about one and a half pooled standard deviations, which is useful only once you have a feel for the spread. Because mpg is a unit people already understand, lead with 7.24 and its interval and keep d as the second number. The 0.2, 0.5 and 0.8 cut points for small, medium and large that you might attach to the d come from Cohen (1988), who offered them for fields with no better yardstick and warned against reading them as fixed, so a d of 1.48 is "large" by that convention while the 7.24 mpg is the number that actually settles the practical question.

Now a case where the raw coefficients mislead. Fit fuel economy on weight and horsepower together. Weight is in thousands of pounds and horsepower in horsepower, so the two slopes live on different scales and cannot be ranked as they stand. Standardizing puts both in standard-deviation units and makes the comparison fair.

```r
raw <- lm(mpg ~ wt + hp, data = mtcars)
std <- lm(scale(mpg) ~ scale(wt) + scale(hp), data = mtcars)
round(cbind(raw = coef(raw), standardized = coef(std)), 3)
#>                raw standardized
#> (Intercept) 37.227        0.000
#> wt          -3.878       -0.630
#> hp          -0.032       -0.361
```

Read the raw column on its own and weight looks about a hundred times more important than horsepower, since -3.878 dwarfs -0.032, but that gap is an artefact of the units: a one-unit change in weight is a full 1,000 pounds, while a one-unit change in horsepower is a single unit. The standardized column removes the units, and once both are measured in standard deviations weight (-0.63) still matters more than horsepower (-0.36), but now by less than a factor of two. So report the raw coefficient when you have a single slope whose units mean something, and reach for the standardized coefficients when the whole point is to rank predictors measured on different scales.

The third case is where the family itself changes. When the outcome is binary rather than measured, a mean difference has no meaning, and you are choosing among a risk difference, a risk ratio and an odds ratio. Take engine shape in `mtcars` (`vs`, where 1 is a straight engine) across the two transmission types, purely to lay the three numbers next to each other.

```r
tab <- table(am = mtcars$am, vs = mtcars$vs)
tab
p1 <- mean(mtcars$vs[mtcars$am == 1]); n1 <- sum(mtcars$am == 1)
p0 <- mean(mtcars$vs[mtcars$am == 0]); n0 <- sum(mtcars$am == 0)
rr <- p1 / p0
se <- sqrt((1 - p1) / (p1 * n1) + (1 - p0) / (p0 * n0))
round(c(risk_diff = p1 - p0, risk_ratio = rr,
        rr_low = exp(log(rr) - 1.96 * se), rr_high = exp(log(rr) + 1.96 * se),
        odds_ratio = (p1 / (1 - p1)) / (p0 / (1 - p0))), 2)
#>    vs
#> am   0  1
#>   0 12  7
#>   1  6  7
#>  risk_diff risk_ratio     rr_low    rr_high odds_ratio 
#>       0.17       1.46       0.67       3.17       2.00 
```

All three summaries describe the same 2x2 table and none is wrong, yet they read differently. A straight engine turns up in 54% of manual cars and 37% of automatics, so the risk difference is 17 percentage points and the risk ratio is 1.46, meaning manuals are about one and a half times as likely. The odds ratio is 2.00, larger again, and the pull is to report it because the bigger number looks like the stronger finding. An odds ratio and a risk ratio only agree when the outcome is rare, and here, where more than a third of every group has the outcome, the odds ratio sits well above the risk ratio and is easy for a reader to misread as one (Davies, Crombie and Tavakoli, 1998). Report the odds ratio when your analysis hands it to you directly, as logistic regression does, and prefer the risk ratio or risk difference when the outcome is common and you want a number a clinician or a reader can act on. The interval here is wide (0.67 to 3.17) because the illustrative table has only 32 cars; the choice of which measure to report and the precision of the estimate are separate questions, and only the second improves when you collect more data.

## What reviewers will ask about this later

Reporting the effect size well closes one question and opens the specific ones that follow it. The most common is the interval. An effect size on its own, without the range your data are consistent with, invites [Missing Confidence Intervals in Peer Review](/Missing-Confidence-Intervals-in-Peer-Review.html), and the reporting guidelines that ask for a size ask for its precision in the same sentence. If the reason you are here at all is that a reviewer saw only p-values, the companion objection is [Missing Effect Sizes in Peer Review](/Missing-Effect-Sizes-in-Peer-Review.html), which is about whether to report a size rather than which one.

Two more follow directly from the choices above. If you reported an odds ratio for an outcome you created by cutting a continuous variable at a threshold, expect [Dichotomising Continuous Variables in Peer Review](/Dichotomising-Continuous-Variables-in-Peer-Review.html), because an effect size is only as defensible as the outcome it is measured on. And if you computed effect sizes across many comparisons and led with the largest, a reviewer reads that as selection, which is [Multiple Comparisons in Peer Review](/Multiple-Comparisons-in-Peer-Review.html). How the numbers sit together in the running text, including decimal places and order, is [Reporting Statistics in R](/Reporting-Statistics-in-R.html).

## How to report it

Effect sizes belong in the Results, next to the test they come from, and the guidelines are specific about what to include. CONSORT asks for the estimated effect size and its precision, such as a 95% confidence interval, for every primary and secondary outcome (item 17a; Schulz, Altman and Moher, 2010), and the SAMPL guidelines ask the same of observational work (Lang and Altman, 2015). For the two-group comparison, lead with the units and keep the standardized value as a supplement.

> Manual-transmission cars averaged 7.24 mpg more than automatics (95% CI 3.21 to 11.28; Cohen's d = 1.48). We report the difference in miles per gallon first, as the quantity a reader can interpret directly, and include the standardized effect for comparison with other studies.

When the outcome has no natural unit, or you are ranking predictors on different scales, the standardized coefficient carries the report, and it helps to say why.

> Because the predictors are measured on different scales, we report standardized regression coefficients so their contributions can be compared directly: weight (beta = -0.63) was the stronger predictor of fuel economy, ahead of horsepower (beta = -0.36).

When the outcome is binary, name the measure you are reporting, give its interval, and where the outcome is common say so, so a reader does not take an odds ratio for a risk ratio.

> Straight engines were more common in manual than automatic cars (54% vs 37%; risk ratio 1.46, 95% CI 0.67 to 3.17). We report the risk ratio in preference to the odds ratio (2.00) because the outcome is common, a case in which the odds ratio overstates the relative risk and is readily misread as one.

Across all three, the number a reader can act on comes first, and the standardized or ratio form that lets another researcher reuse the result comes second. If a table leaves room for only one, keep the interpretable number and its interval, and give the standardized form where the text or an appendix can carry it.

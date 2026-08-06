---
title: "Nonlinear Relationships in Peer Review"
slug: Nonlinear-Relationships-in-Peer-Review
description: "A reviewer says the relationship in your regression is not linear. How to test linearity in R, decide whether the curvature matters, and word your response."
keywords: "relationship is not linear reviewer, linearity assumption peer review, reviewer says nonlinear relationship, test linearity in R, curvature reviewer comment, functional form misspecification"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 36
auto_link_terms: relationship is not linear|linearity assumption reviewer|nonlinear relationship objection|curved relationship regression|functional form misspecification
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Linear regression assumes the outcome changes at a constant rate as a predictor changes. When a reviewer says the relationship is not linear, they are saying that rate is not constant, so a single straight-line slope is the wrong summary of it. Most of the time you can model the curve and keep your finding, but not always, and the check below tells you which.</p>

## What the reviewer wrote

> The authors assume a linear association between age and the outcome. It would strengthen the paper to confirm that this functional form is appropriate.

> Figure 2 shows an obviously curved relationship, yet a linear model is fitted throughout. This is not appropriate.

> The analysis is generally sound, though I would note that the effect of dose is unlikely to be constant across its whole range, and the authors may wish to reconsider whether a linear term captures it, particularly at the upper end where the data are sparse.

## What they actually mean

The reviewer is questioning the shape of the relationship between a predictor and the outcome. Your model assumes that a one-unit increase in the predictor shifts the outcome by the same amount everywhere, and the reviewer suspects the true change is larger in one part of the range than another.

It is easy to read this as a complaint about normality or about noisy data, and it is neither. It is about the mean of the outcome: does the average bend as the predictor moves, or does it follow a straight line? Residuals can be perfectly normal and the variance perfectly constant while the line still curves through the middle of the data.

There is one thing to get straight before you panic. A linear model only has to be linear in its coefficients, not in the predictors, so you can add a squared term, a log, or a spline and still be fitting an ordinary linear regression. The reviewer is not asking you to abandon the model. They are asking you to replace the straight-line term with one that can curve.

## Why they are asking

When the relationship curves and you force a straight line through it, the line sits above the data in some ranges and below it in others. That shows up as a pattern in the residuals plotted against the fitted values, which is the standard picture reviewers have in mind. The mechanics of reading that plot are covered in [Regression Diagnostics in R](/Regression-Diagnostics-in-R.html).

The cost is not only a worse fit. The slope you report becomes an average of a rate that is actually changing, so it can be too shallow, too steep, or, if the relationship rises and then falls, close to zero while the real effect is large. Because the shape of one predictor is part of how the whole model is specified, getting it wrong can also pull the other coefficients off their correct values. And predictions are least reliable exactly where the curve is sharpest, which is often the tail the paper cares about most.

## How to check it

The visual check is the residuals-versus-fitted plot. The numeric version, which is easier to report and to reason about, is to add a squared term for the predictor in question and test whether it improves the fit. If it does, a straight line was leaving structure behind.

```r
fit    <- lm(mpg ~ hp + wt, data = mtcars)
fit_hp <- lm(mpg ~ hp + I(hp^2) + wt, data = mtcars)
anova(fit, fit_hp)
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ hp + wt
#> Model 2: mpg ~ hp + I(hp^2) + wt
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)  
#> 1     29 195.05                              
#> 2     28 159.52  1     35.53 6.2366 0.01867 *
```

The squared term improves the fit with p = 0.019, so the horsepower relationship in `mpg ~ hp + wt` is not straight. There is no magic threshold here, because this is a hypothesis test rather than a fixed cutoff. With a large sample a tiny, unimportant curve can come back significant; with a small one a real curve can be missed. So read the p-value alongside how much the curve actually changes the fitted values over the range you care about, rather than on its own. The version that checks the whole model's functional form at once, instead of one predictor, is Ramsey's RESET test (Ramsey, 1969).

## What to do about it

### You are fine

Your curvature test comes back non-significant, or the curve is real but too small to change anything you conclude.

Here is what a clean check looks like, on a different predictor in the same data:

```r
fit_drat  <- lm(mpg ~ drat, data = mtcars)
fit_dratq <- lm(mpg ~ drat + I(drat^2), data = mtcars)
anova(fit_drat, fit_dratq)
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ drat
#> Model 2: mpg ~ drat + I(drat^2)
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     30 603.57                           
#> 2     29 600.24  1    3.3272 0.1607 0.6914
```

The squared term does nothing (p = 0.69), and the residual sum of squares barely moves, from 603.57 to 600.24. A straight line is an adequate description of this relationship, so you report the test and move on.

There is also an immaterial case. In a large sample the test will flag curves so slight that the straight-line fit and the curved fit agree to the second decimal across the whole observed range. When that happens, keep the simpler model, and say that although a nonlinear term was statistically detectable it changed no fitted value or conclusion by a meaningful amount.

### It is fixable

The curve is real and large enough to matter, but the remedy is to model it, not to abandon the analysis. Add the squared term you tested with.

Compare the model before and after. The straight-line version:

```r
round(summary(fit)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2273     1.5988 23.2847   0.0000
#> hp           -0.0318     0.0090 -3.5187   0.0015
#> wt           -3.8778     0.6327 -6.1287   0.0000
```

The same model with the curve allowed in:

```r
round(summary(fit_hp)$coefficients, 5)
#>             Estimate Std. Error  t value Pr(>|t|)
#> (Intercept) 41.07660    2.13097 19.27604  0.00000
#> hp          -0.11584    0.03467 -3.34088  0.00238
#> I(hp^2)      0.00022    0.00009  2.49732  0.01867
#> wt          -3.03001    0.67407 -4.49510  0.00011
```

The squared term is significant and the model's R-squared rises from 0.83 to 0.86. The substantive finding is unchanged: horsepower still lowers fuel economy, and the negative `hp` term with the small positive `hp^2` term describes an effect that is strong at low horsepower and flattens as horsepower climbs. What did move is the weight coefficient, from -3.88 to -3.03. Forcing the horsepower term straight had been pushing the weight estimate off as well, so a misspecified curve is not confined to its own predictor; it can bias the ones you were not even asked about.

You do not need to keep adding powers. A cubic term here adds nothing (p = 0.08), so a single squared term captures the bend. Where a polynomial feels arbitrary, a log transform or a spline is often cleaner, and the options are laid out in [Polynomial and Spline Regression in R](/Polynomial-and-Spline-Regression-in-R.html) and [GAMs, Splines and Smooths](/GAMs-Splines-and-Smooths.html). Report the curved model as your main specification and show the linear one alongside so the reviewer can see what changed.

### It is a real problem

The curve does not just need modelling, it changes what you can claim. The clearest version is a relationship that rises and then falls. Suppose a study reports that a training dose has no effect on performance, because the fitted linear slope is near zero and not significant. In reality performance improves up to a moderate dose and declines beyond it, so the near-zero slope is the average of a real gain and a real loss cancelling out. The conclusion of no effect is wrong, and no careful wording rescues it. (These numbers are illustrative; built-in teaching data rarely contains a clean reversal.)

The honest response has two parts. First, model the actual shape and report it: the effect is positive, then negative, with a peak in between. Second, be candid about what the study can support. If the design did not place enough observations near the turning point, you can show that the relationship curves but you cannot pin down where it peaks with any precision, and you should say exactly that. A spline or a segmented regression replaces the misleading single slope, but the real repair is to stop reporting a constant effect that does not exist. When the reviewer's point overturns the headline claim, it is the claim that has to change, not the presentation of it.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. We tested for a nonlinear association by adding a quadratic term for each predictor and comparing the models against the linear specification; none improved the fit (for the predictor in question, F = 0.16, p = 0.69), and the residuals-versus-fitted plot shows no systematic curvature (Figure S1). We are satisfied that the linear specification is appropriate and have added this check to the Methods (page X).

### If it was fixable

> The reviewer is correct that the relationship between horsepower and fuel economy is not constant across its range. We have refitted the model with a quadratic term, which is significant (p = 0.02) and raises the R-squared from 0.83 to 0.86. The direction and significance of the effect are unchanged, and the coefficient for weight also stabilises once the curvature is modelled. We now report the nonlinear specification as our primary model, with the linear model shown alongside it for comparison (Methods, page X; Table 2).

### If it is a real problem

> We are grateful for this point, as it changed our conclusion. Allowing the relationship to curve shows that the effect is positive at lower doses and negative at higher ones, so the near-zero linear slope we originally reported was averaging two opposing effects. We have removed the statement that dose had no effect and replaced it with a description of the nonlinear pattern. Because our sampling near the peak is sparse, we now state that we can establish the presence of a reversal but not its precise location, and we have added this as a limitation (Results, page X; Limitations, page X).

## Practice

A reviewer writes: *"The scatter of sepal length against petal width looks curved to me. A linear term seems inappropriate here."* You run the check:

```r
ex_fit  <- lm(Sepal.Length ~ Petal.Width, data = iris)
ex_curv <- lm(Sepal.Length ~ Petal.Width + I(Petal.Width^2), data = iris)
anova(ex_fit, ex_curv)
round(summary(ex_curv)$coefficients, 4)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The added squared term does not improve the fit: F = 0.14 with p = 0.7086, and the residual sum of squares falls only from 33.815 to 33.783. In the fitted curve the `I(Petal.Width^2)` coefficient is -0.0314 with p = 0.7086, while the linear `Petal.Width` term is 0.9615 and significant at p < 0.001. There is no curvature to model here.

So the check clears the relationship, and the reviewer is mistaken. The tempting move is to defer and add a quadratic term anyway, but that inserts a coefficient indistinguishable from zero and slightly widens the standard errors on everything else for no gain. The right reply is a polite disagreement backed by the test: report the non-significant curvature check and the clean residual plot, keep the linear term, and say plainly that you tested the reviewer's concern and it was not borne out.

</details>

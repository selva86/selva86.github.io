---
title: "Too Many Predictors in Peer Review"
slug: Too-Many-Predictors-in-Peer-Review
description: "A reviewer says your model has too many predictors for the sample size and is overfit. Count the coefficients, measure the optimism gap, then word your reply."
keywords: "too many predictors reviewer, too many predictors for the sample size, overfitting reviewer comment, model too complex reviewer, events per variable, overfit model peer review, predictors to sample size ratio"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 58
auto_link_terms: too many predictors|too many predictors for the sample size|overfitting objection|model is overfit reviewer|events per variable|predictor to sample size ratio|reviewer says overfit
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Too many predictors means a model estimates more coefficients than the data can pin down, so it fits the noise in your particular sample and the fitted relationships fail to hold in a new one. A reviewer who raises it is asking whether your sample is large enough to support every term you put in the model. The question that settles the objection is not how many predictors you have, but how much the model's apparent accuracy shrinks when it is asked to predict data it has not seen.</p>

## What the reviewer wrote

> The regression in Table 2 includes a large number of covariates relative to the sample size. The authors might comment on the risk of overfitting and the stability of the coefficient estimates.

> With 32 observations and ten predictors this model is overfit. The number of variables needs to be reduced.

> The analysis is generally sound and the writing is clear, though I did notice that the final model carries a fair few predictors for a dataset of this size, and I wondered whether the reported R-squared might be optimistic as a result and whether the model would replicate in an independent sample.

## What they actually mean

The reviewer is not counting predictors for its own sake. The concern is overfitting: when a model has too many free parameters for the amount of data, it begins to describe the accidents of your particular sample rather than the pattern that would repeat. A model like that reports a flattering fit and a set of coefficients that would move sharply if you collected the data again. A common misreading is to treat the comment as a demand to delete variables until some ratio is satisfied, when what the reviewer actually wants is evidence that the model you fitted is stable, and deleting variables is only one way to provide it.

## Why they are asking

When a model estimates too many coefficients from too little data, several things go wrong together. The coefficients become unstable, so their signs and sizes depend on which observations happened to land in your sample. The standard errors understate that instability, because the model has spent its degrees of freedom fitting noise, so effects look more certain than they are. And the in-sample fit you report, the R-squared or the classification accuracy, runs ahead of anything the model can achieve on new data, because part of it is the model memorising the sample. For a linear model the usual rule of thumb is ten to fifteen observations per predictor; for logistic and Cox regression the guidance is stated as events per variable, with at least ten outcome events for each coefficient estimated (Peduzzi et al., 1996). These are guides, not tests, and the mechanics of choosing and comparing models live in [Model Selection in R](/Model-Selection-in-R.html), so this chapter stays on whether your model is overfit and what to say about it.

## How to check it

The diagnostic has two parts and neither needs a package. First count the coefficients the model estimates, not the variables you typed, because a factor with k levels costs k minus one coefficients and every interaction or polynomial term adds more. Then measure how much the fit shrinks out of sample. The `mtcars` data hold 32 cars, and a model of fuel economy on all ten available predictors is the kind of full model that draws this objection.

```r
full <- lm(mpg ~ ., data = mtcars)
n <- nrow(mtcars)
p <- length(coef(full)) - 1
c(n = n, predictors = p, obs_per_predictor = round(n / p, 1))
#>                 n        predictors obs_per_predictor 
#>              32.0              10.0               3.2 
```

Three observations per predictor is well below any rule of thumb. That is a reason to look, not a verdict, so the second block measures the thing the ratio only gestures at. Leave-one-out cross-validation refits the model without each car in turn and predicts the one left out; for a linear model the base-R shortcut is the PRESS statistic, which turns those held-out errors into a predictive R-squared you can set beside the ordinary one. The idea is covered in [Cross-Validation Strategies](/Cross-Validation-Strategies.html); here it is one line.

```r
press <- sum((residuals(full) / (1 - hatvalues(full)))^2)
tss   <- sum((mtcars$mpg - mean(mtcars$mpg))^2)
c(apparent_r2   = round(summary(full)$r.squared, 3),
  predictive_r2 = round(1 - press / tss, 3))
#>   apparent_r2 predictive_r2 
#>         0.869         0.654 
```

The model explains 87% of the variance in the sample it was fitted on and 65% of it out of sample. That 21-point drop is the optimism: the part of the reported fit that belongs to this particular set of 32 cars rather than to cars in general. There is no fixed cutoff for how large a gap is too large, just as there is no hard line at ten observations per predictor; a few points is ordinary and twenty is a model leaning on its sample. So the practical read is to report both numbers, because the ratio shows how thin the data are for the model and the predictive R-squared shows how much that thinness cost you in fit that will not replicate.

## What to do about it

### You are fine

The same check can clear a model the rule of thumb would flag. The `swiss` data record fertility and five socioeconomic predictors across 47 French-speaking provinces, which works out to 9.4 observations per predictor, just under the usual line.

```r
sw <- lm(Fertility ~ ., data = swiss)
sw_p     <- length(coef(sw)) - 1
sw_press <- sum((residuals(sw) / (1 - hatvalues(sw)))^2)
sw_tss   <- sum((swiss$Fertility - mean(swiss$Fertility))^2)
c(obs_per_predictor = round(nrow(swiss) / sw_p, 1),
  apparent_r2       = round(summary(sw)$r.squared, 3),
  predictive_r2     = round(1 - sw_press / sw_tss, 3))
#> obs_per_predictor       apparent_r2     predictive_r2 
#>             9.400             0.707             0.608 
```

The ratio sits below ten, but the fit barely moves out of sample: 0.707 fitted, 0.608 predicted, a ten-point drop on a model that explains most of the variance either way. A model this stable is not overfit in any way that matters, and the reply is to show the small gap rather than to start deleting predictors to meet a threshold the data have already passed on the measure that counts. When your own check looks like this, you demonstrate that you are fine by reporting the predictive R-squared next to the apparent one, so the reader can see the model holds up.

### It is fixable

When the gap is real, as it was for the full `mtcars` model, the fix is to spend your limited data on fewer, better-chosen predictors. The wrong way to choose them is to let an automatic stepwise search keep whichever variables fit this sample best, which manufactures the exact overfitting the reviewer objected to. The right way is to decide on subject-matter grounds, before looking at the p-values, which predictors the question needs. Fuel economy is mostly weight, engine speed and transmission, so a model with those three carries 10.7 observations per predictor.

```r
reduced <- lm(mpg ~ wt + qsec + am, data = mtcars)
rpress  <- sum((residuals(reduced) / (1 - hatvalues(reduced)))^2)
c(obs_per_predictor = round(nrow(mtcars) / 3, 1),
  apparent_r2       = round(summary(reduced)$r.squared, 3),
  predictive_r2     = round(1 - rpress / tss, 3))
#> obs_per_predictor       apparent_r2     predictive_r2 
#>            10.700             0.850             0.795 
```

The apparent R-squared falls only from 0.869 to 0.850, so dropping seven predictors cost less than two points of in-sample fit. The predictive R-squared rises from 0.654 to 0.795. The smaller model predicts new cars better than the larger one while claiming less, because the seven predictors it dropped were fitting noise that did not carry over, so giving up two points of apparent fit bought back fourteen points of predictive fit. Deleting predictors is not the only remedy. Where every predictor is genuinely needed, penalized methods such as ridge and lasso keep them all but shrink the coefficients toward zero, trading a little bias for the stability the raw model lacks; both are covered in [Ridge Regression in R](/Ridge-Regression-With-R.html) and [Lasso Regression in R](/Lasso-Regression-With-R.html).

### It is a real problem

Sometimes no reduction saves the model, because the data were too thin for the question from the start. Picture a study of 90 patients in which 12 had the outcome of interest, fitted with a logistic regression that adjusts for eight predictors. Twelve events across eight coefficients is 1.5 events per variable, far below the ten the guideline asks, and cutting to three predictors only reaches four events per variable, still short, while each cut discards an adjustment the clinical question may have needed. More events would fix this and nothing else will. The honest options are narrow and you should say which one you took. If prediction was the goal, fit a penalized model such as [lasso](/Lasso-Regression-With-R.html) and report it as one, with the shrinkage stated, since a penalized fit is defensible where an unpenalized one is not. If explanation was the goal, pre-specify the single most important predictor or a small theory-driven set and report the rest as unpowered. If neither rescues the analysis, present the model as exploratory and state plainly that the sample cannot support a confirmatory multivariable model, which the TRIPOD reporting guideline for prediction models treats as a required disclosure when it asks authors to justify the study size and the number of events per candidate predictor (Collins et al., 2015).

## How to word your response

### If you are fine

> The reviewer raises the number of predictors relative to our sample size and the possibility that the fit is optimistic. The ratio is indeed modest, at 9.4 observations per predictor, so we checked overfitting directly by comparing the model's in-sample fit with its leave-one-out predictive fit. The R-squared falls only from 0.71 to 0.61, so the model's accuracy holds up on data it was not fitted to and the estimates are stable. We have added this comparison to the Methods (page X) and retained the full model, as the data support it.

### If it was fixable

> We thank the reviewer for the concern about overfitting. On checking, our full model was optimistic: it explained 87% of the variance in sample but 65% under leave-one-out cross-validation, a gap consistent with too many predictors for 32 observations. We have refitted with a smaller model containing the three predictors the question requires, chosen on substantive grounds rather than by their p-values. Its in-sample fit is almost unchanged at 85%, while its cross-validated fit rises to 80%, which shows the reduction removed noise rather than signal. The reduced model is now our primary analysis, with the cross-validation results reported in the Methods (page X).

### If it is a real problem

> The reviewer is correct that our model carries too many predictors for the number of outcome events, at roughly 1.5 events per variable against the ten commonly recommended. We cannot resolve this by adding data within the present study, and reducing the predictor set far enough would discard adjustments the question requires. We have therefore refitted with penalized (lasso) regression, which retains the predictors while shrinking their coefficients toward zero to control overfitting, and we now report the model on that basis (Methods, page X). We have also reframed the finding as exploratory and added a limitation stating that the event count cannot support a confirmatory multivariable model.

## Practice

A reviewer writes: *"With 50 countries and only four predictors, the model is comfortably within the usual limits, so overfitting is not a concern here."* You would rather check the reassurance than accept it, so you run the same two-part diagnostic on the `LifeCycleSavings` data, which regress a country's savings rate on four economic predictors:

```r
ex_fit <- lm(sr ~ ., data = LifeCycleSavings)
ex_p     <- length(coef(ex_fit)) - 1
ex_press <- sum((residuals(ex_fit) / (1 - hatvalues(ex_fit)))^2)
ex_tss   <- sum((LifeCycleSavings$sr - mean(LifeCycleSavings$sr))^2)
c(obs_per_predictor = round(nrow(LifeCycleSavings) / ex_p, 1),
  apparent_r2       = round(summary(ex_fit)$r.squared, 3),
  predictive_r2     = round(1 - ex_press / ex_tss, 3))
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Run it and the ratio is 12.5 observations per predictor, comfortably above ten, exactly as the reviewer says. The obvious reading is "you are fine," and it is wrong. The apparent R-squared is 0.338 and the predictive R-squared is 0.188, so the model loses nearly half its explanatory power out of sample despite passing the ratio rule with room to spare. An adequate observations-per-predictor ratio bounds one failure mode but does not guarantee a stable model: a model with a weak underlying signal can still overfit, because more of its apparent fit is noise it happened to absorb. So this is not the "you are fine" case the ratio suggests. Because the fit is weak to begin with, the reply is to report the predictive R-squared beside the apparent one so the optimism is visible, and to stabilize the four coefficients with a penalized fit rather than defend the unpenalized model as if the ratio had settled the matter.

</details>

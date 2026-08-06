---
title: "Model Fit Statistics in Peer Review"
slug: Model-Fit-Statistics-in-Peer-Review
description: "A reviewer says model fit statistics are not reported and asks how much variance the model explains. How to check fit in R and word the reply for each case."
keywords: "model fit statistics not reported, reviewer wants goodness of fit, how much variance does the model explain, report R-squared in a paper, no measure of model fit, AIC not reported, model fit reviewer comment"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 52
auto_link_terms: model fit statistics|goodness of fit statistics|model fit not reported|measure of model fit|overall model fit|proportion of variance explained
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A reviewer who asks for model fit statistics wants the one thing your coefficient table does not give them: a sense of how well the whole model describes the data, not just whether each predictor is significant. Most of the time this is a reporting gap you can close in a sentence, because you already fit the model and the numbers are sitting in the output. This chapter shows how to pull the fit statistics in R, read what they mean, and word the reply for each of the three situations you might be in.</p>

## What the reviewer wrote

> It would strengthen the paper to include some indication of how well the model fits the data overall, in addition to the coefficient estimates.

> No goodness-of-fit statistics are reported anywhere. How much of the variation in the outcome does this model actually explain?

> The regression is clearly described and the coefficients are plausible. I note, though, that Table 3 gives the estimates and their standard errors but no R-squared, AIC, or other summary of overall fit, so it is hard to judge how much the model is really doing.

## What they actually mean

The request is for a summary of the model as a whole, not for anything more about the individual predictors. A coefficient table answers "is this predictor associated with the outcome, and in which direction". It says nothing about the question the reviewer is now asking, which is how much of the outcome the whole model accounts for. Those are separate questions, and a table of significant coefficients can sit on top of a model that explains very little. This is commonly misread as a request to recheck assumptions or add more predictors, when in almost every case the reviewer only wants a fit statistic you have already computed to appear in the paper.

## Why they are asking

A coefficient can be significant while the model explains almost none of the outcome, because significance depends on sample size as much as on the strength of the relationship. Give a test enough data and a real but tiny effect will cross p < 0.05, so a column of asterisks is not evidence that the model is useful. A reader deciding whether to trust or act on the model needs to know how much of the outcome it captures, and reporting that is a standard expectation: the APA's Journal Article Reporting Standards list a measure of overall model fit among the results a regression should give (Appelbaum et al., 2018). Fit statistics also let the reader check the model against the obvious alternative, since a regression that predicts the outcome no better than its own mean is worth knowing about before any coefficient is interpreted. How R-squared, adjusted R-squared and the F-statistic are read off a fitted model is covered in [Reading lm output in R](/Read-lm-Output-in-R.html).

## How to check it

For a linear model the fit statistics are already in `summary()`; you do not compute anything new, you read the last three lines. Fit `mpg` on weight and horsepower in `mtcars` and look at the bottom of the output.

```r
model <- lm(mpg ~ wt + hp, data = mtcars)
summary(model)
#> 
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#> 
#> Residuals:
#>    Min     1Q Median     3Q    Max 
#> -3.941 -1.600 -0.182  1.050  5.854 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 37.22727    1.59879  23.285  < 2e-16 ***
#> wt          -3.87783    0.63273  -6.129 1.12e-06 ***
#> hp          -0.03177    0.00903  -3.519  0.00145 ** 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 2.593 on 29 degrees of freedom
#> Multiple R-squared:  0.8268,	Adjusted R-squared:  0.8148 
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12
```

The multiple R-squared of 0.8268 says the two predictors together account for about 83% of the variation in fuel economy, and the adjusted R-squared of 0.8148 is the same figure after a penalty for the number of predictors. The F-statistic of 69.21, with a p-value of 9.109e-12, tests the whole model against a model with no predictors at all, and here it rejects that null decisively. What counts as a "good" R-squared has no universal cutoff and varies widely by field, so a value that would embarrass a physicist is ordinary in behavioural work; report the number and let the reader judge it against their own field rather than against a textbook threshold.

## What to do about it

### You are fine

If the model fits well and you simply left the numbers out of the manuscript, this is a two-minute fix: report the R-squared, the adjusted R-squared and the F-test, and point the reviewer to the table. The `mpg` model above is in exactly this position, with 83% of the variance explained and an F-test that rejects the null model outright. In my experience the reviewer usually wants a fit number to be present at all, rather than wanting a particular value.

One version of this objection hides a sharper worry, that a high R-squared is only high because the model has many predictors. Adjusted R-squared and AIC are built to answer that, because both penalise complexity. Compare the two-predictor model with the kitchen-sink model that uses every column in `mtcars`.

```r
full <- lm(mpg ~ ., data = mtcars)
round(c(simple_R2 = summary(model)$r.squared,
        simple_adjR2 = summary(model)$adj.r.squared,
        full_R2 = summary(full)$r.squared,
        full_adjR2 = summary(full)$adj.r.squared), 4)
#>    simple_R2 simple_adjR2      full_R2   full_adjR2 
#>       0.8268       0.8148       0.8690       0.8066 
AIC(model, full)
#>       df      AIC
#> model  4 156.6523
#> full  12 163.7098
```

Adding eight more predictors lifts the multiple R-squared from 0.8268 to 0.8690, which it always will, because R-squared never falls when you add a term. The adjusted R-squared moves the other way, from 0.8148 down to 0.8066, and the AIC rises from 156.65 to 163.71, where lower is better. So the larger model fits this sample slightly better and is expected to predict slightly worse, and the two-predictor model is the one to keep. If a reviewer suspects overfitting, the adjusted R-squared and AIC are the two numbers to set beside the raw R-squared, because both already carry the penalty for extra predictors that the raw figure ignores.

### It is fixable

Sometimes the reviewer asks for R-squared and your model does not have one. Logistic regression, Poisson models and most other generalised linear models are fit by maximum likelihood rather than least squares, so there is no proportion-of-variance to report. The fix is not to argue the point but to report the statistics that model class does use: a pseudo-R-squared, the AIC, and the residual deviance. McFadden's pseudo-R-squared comes straight out of the deviances the model already stores.

```r
logit <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
round(1 - logit$deviance / logit$null.deviance, 3)
#> [1] 0.555
AIC(logit)
#> [1] 25.23255
```

McFadden's pseudo-R-squared here is 0.555 and the AIC is 25.23. A pseudo-R-squared is not a proportion of variance and does not read on the same scale as the linear-model version, so it runs much lower for an equally good model and a value near 0.4 already reflects a strong fit; report it under its own name so no reader mistakes it for an ordinary R-squared. How the deviance and AIC lines are read off a logistic fit is covered in [Reading logistic regression output in R](/Read-Logistic-Output-in-R.html).

### It is a real problem

Sometimes the fit statistic is missing because it is bad, and reporting it will show that. Picture a model where a single predictor is significant at p = 0.002 but the R-squared is 0.04, so the model accounts for four percent of the outcome and predicts it barely better than the mean does. (Those numbers are illustrative; a clean built-in dataset rarely produces a failure this stark.) The significant coefficient is still a real association, but a paper that presents the model as explaining the outcome is claiming something the fit does not support. The honest response is to report the fit as it stands, say plainly that the model has low explanatory power, and scale the conclusion back to what the data carry: the predictor is associated with the outcome, and the model as a whole leaves most of it unexplained. If the paper's claim depended on the model explaining the outcome well, that claim has to change, and reporting a weak fit statistic yourself reads far better than having a reviewer compute it for you.

## How to word your response

### If you are fine

> The reviewer asks for an indication of overall model fit. We had reported the coefficients but not the fit statistics, and have now added them: the model accounts for 83% of the variance in fuel economy (R-squared = 0.83, adjusted R-squared = 0.81), and the overall F-test is significant (F(2, 29) = 69.2, p < 0.001). To show the fit is not an artefact of predictor count, we also report the adjusted R-squared and AIC for a fuller candidate model, which fit the sample slightly better but were not retained. These figures now appear in Table 3 and the first paragraph of the Results (page X).

### If it was fixable

> The reviewer requests an R-squared for the logistic model. Because the model is fit by maximum likelihood, an ordinary R-squared does not apply. We now report McFadden's pseudo-R-squared (0.56), the residual deviance, and the AIC (25.2) instead, and we note in the text that the pseudo-R-squared is on a different scale from a linear-model R-squared and is not directly comparable to one. These are added to the model table and described in the Methods (page X).

### If it is a real problem

> We thank the reviewer for asking us to report model fit. On adding it we agree that the model has limited explanatory power: it accounts for a small share of the variance (R-squared = 0.04), even though the predictor is significantly associated with the outcome. We now report the fit statistic in full (Results, page X) and have revised the Abstract and Discussion to describe the predictor as associated with the outcome rather than as explaining it, which is the stronger claim the data actually support (page X).

## Practice

A reviewer writes: *"The model reports no measure of fit. I ran the numbers myself, and the R-squared is only about 0.36, which suggests the model is too weak to support the paper's claim about the transmission effect."* Your model stands in as `mpg` regressed on transmission type (`am`) in `mtcars`. Run the block, decide which of the three outcomes applies, and work out what you write back.

```r
ex_model <- lm(mpg ~ am, data = mtcars)
summary(ex_model)
```

<details><summary>Click to reveal solution</summary>

The obvious move is to treat an R-squared of 0.36 as a failing grade and concede the model is too weak. That is the wrong read here. Manual-transmission cars average 7.245 mpg more than automatics (standard error 1.764), which is 4.106 standard errors from zero and significant at p = 0.000285, and the model's F-test carries the same p-value. The adjusted R-squared is 0.3385.

This is the first outcome, "you are fine". The paper's claim is about the size of the transmission difference, which this one-predictor model estimates precisely and significantly; the modest R-squared only says that transmission alone does not explain most of what makes cars differ in fuel economy, which is expected and does not bear on that specific claim. You report the R-squared and the F-test, note that the model is deliberately simple, and hold the conclusion. A low R-squared would count as a real problem only if the claim depended on the model explaining most of the outcome, and here it does not.

</details>

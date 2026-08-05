---
title: "Reviewer says multicollinearity was not checked"
slug: Reviewer-Says-Multicollinearity-Not-Checked
description: "A reviewer flagged correlated predictors in your regression. How to check multicollinearity in R, decide whether it actually matters, and word your response."
keywords: "multicollinearity reviewer comment, correlated predictors peer review, VIF response to reviewer, reviewer says predictors correlated, multicollinearity not addressed"
mathjax: false
webr: true
date: 2026-08-05
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 35
auto_link_terms: multicollinearity objection|correlated predictors reviewer|VIF response
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Multicollinearity inflates standard errors but leaves the coefficients themselves unbiased. So if your predictors are correlated and your results are still significant, you have cleared a higher bar than usual rather than a lower one, and that is usually the whole answer to this objection.</p>

## What the reviewer wrote

> The authors do not report any assessment of multicollinearity among the predictor variables.

> Several of the independent variables appear likely to be highly correlated (e.g. engine displacement and weight). The authors should address the stability of the coefficient estimates.

> Table 3 includes both total income and disposable income as predictors. It is unclear how the reported coefficients should be interpreted given the relationship between these measures, and I would encourage the authors to reconsider the specification.

## What they actually mean

The reviewer thinks two or more of your predictors carry overlapping information, and that the model therefore cannot separate their individual effects.

It is easy to read this as a complaint about model fit, and it is not one. Collinearity does not make your predictions worse and it does not make your model fit badly. Both are unaffected. What the reviewer is questioning is the **individual coefficients**: their size, their sign, and their standard errors.

This distinction matters because it determines whether you have a problem at all. If your paper's claim is about prediction or overall fit, collinearity is close to irrelevant and you can say so. If your claim is "variable X has an effect of this size, independent of Y", then the reviewer is pointing at the exact thing your claim depends on.

The third phrasing above is the one to watch. When a reviewer names two specific variables that are obviously versions of each other, they are not asking you to run a diagnostic. They are telling you the specification is wrong.

## Why they are asking

When predictors are correlated, the data contain little information about how to divide the shared effect between them. The fitting procedure still returns an answer, but it is an unstable one.

The visible symptom is inflated standard errors. Coefficients that would be significant on their own become non-significant when their correlated partner is in the model. Signs can flip. Small changes to the sample can move estimates a long way.

What does **not** happen is bias. The coefficients remain unbiased estimates, and both the predictions and R-squared are untouched. Collinearity widens the range of plausible values around a coefficient without shifting where that range is centred, which is why a significant result in a collinear model is still trustworthy. The correlation made significance harder to reach, so reaching it anyway means more, not less.

The mechanics are covered in [Multicollinearity in R](/Multicollinearity-in-R.html). This chapter is about deciding whether you have a problem and what to say.

## How to check it

The variance inflation factor for a predictor is one divided by one minus the R-squared from regressing that predictor on all the others. That is computable in base R with no packages.

```r
fit <- lm(mpg ~ disp + hp + wt, data = mtcars)
vif <- sapply(c("disp","hp","wt"), function(v) {
  others <- setdiff(c("disp","hp","wt"), v)
  r2 <- summary(lm(reformulate(others, v), data = mtcars))$r.squared
  1 / (1 - r2)
})
round(vif, 2)
#> disp   hp   wt 
#> 7.32 2.74 4.84
```

A VIF of 7.32 means the standard error for `disp` is about 2.7 times larger (the square root of 7.32) than it would be if `disp` were uncorrelated with the others.

The thresholds you will see quoted are 5 and 10. Both are conventions rather than results, and neither has a theoretical basis. A VIF of 11 with a large sample and a significant coefficient is less of a problem than a VIF of 6 with a small sample and a marginal one. Report the number and reason about it rather than treating the threshold as a verdict.

If you would rather paste your own model output and get the interpretation, the [VIF interpreter](/tools/vif-interpreter.html) does that.

## What to do about it

### You are fine

Your coefficients of interest are significant despite the inflation, or your paper's claim is about prediction rather than individual effects.

The full model shows this:

```r
round(summary(fit)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.1055     2.1108 17.5788   0.0000
#> disp         -0.0009     0.0103 -0.0905   0.9285
#> hp           -0.0312     0.0114 -2.7245   0.0110
#> wt           -3.8009     1.0662 -3.5649   0.0013
```

Both `hp` and `wt` remain significant even with VIFs of 2.74 and 4.84 working against them. Since the correlation made significance harder to reach and they reached it anyway, there is nothing here that needs fixing. Report the VIFs alongside the model and say that the coefficients of interest held up.

### It is fixable

One predictor is redundant and dropping it costs nothing. Here `disp` has the highest VIF and a p-value of 0.93, which is the signature of a variable carrying no information the others do not already have.

```r
fit2 <- lm(mpg ~ hp + wt, data = mtcars)
round(summary(fit2)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2273     1.5988 23.2847   0.0000
#> hp           -0.0318     0.0090 -3.5187   0.0015
#> wt           -3.8778     0.6327 -6.1287   0.0000
```

The standard error on `wt` fell from 1.0662 to 0.6327, and on `hp` from 0.0114 to 0.0090. Meanwhile the coefficients hardly moved at all: `wt` went from -3.80 to -3.88. So the original estimates were sitting in roughly the right place the whole time. What the redundant predictor was costing you was precision, and dropping it bought that precision back without changing the answer.

Report both models so the reviewer can see the comparison. Dropping a variable is a specification change and should be visible, not silent.

Other fixes worth considering: combining the correlated predictors into a single index where they measure the same construct, or centring interaction terms, which removes collinearity that is purely an artifact of the product term.

### It is a real problem

The coefficient you are making a claim about is non-significant, has an implausible sign, or is unstable across specifications, and you cannot drop its partner because both are theoretically necessary.

This is not fixable by diagnostics. The data do not contain the information needed to separate the two effects, and no technique will conjure it. Ridge regression will stabilise the estimates at the cost of introducing bias, which trades one problem for another and does not license the causal claim you wanted.

The honest response is to change the claim. Report the joint effect of the correlated block rather than the individual coefficients, state that the design cannot separate them, and say what data would. Reviewers accept this readily. What they do not accept is an individual coefficient interpreted as though the collinearity were not there.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. We computed variance inflation factors for all predictors in the model; the maximum was 4.84 (Table S2). Both coefficients central to our argument remain significant at conventional levels despite this inflation, and since multicollinearity affects the precision of estimates rather than their expected values, we do not believe it threatens the reported conclusions. The VIFs are now reported in the Methods (page X) and the supplementary table.

### If it was fixable

> The reviewer is correct that engine displacement and weight carry overlapping information. We have re-estimated the model excluding displacement, which had the highest variance inflation factor (7.32) and was not significant (p = 0.93). The remaining coefficients are substantively unchanged (weight: -3.80 to -3.88) while their standard errors fall by roughly 40%, confirming that the original estimates were imprecise rather than biased. Both specifications are now reported in Table 3 (page X), with the reduced model as the primary specification.

### If it is a real problem

> We agree with the reviewer. Total and disposable income are sufficiently collinear in our sample (VIF = 12.4) that the model cannot separate their individual contributions, and we accept that the coefficient for disposable income should not be interpreted in isolation. We have revised the analysis to report the joint effect of the income block and have removed the claim about the independent contribution of disposable income from the Abstract and Discussion. We now state explicitly that separating these effects would require a sample with greater variation in the ratio between them (Limitations, page X).

A concession that states plainly what was removed from the paper and what data would answer the original question tends to be accepted without argument, because it shows you understood the objection rather than working around it.

## Practice

A reviewer writes: *"The model in Table 2 includes several plausibly correlated covariates. Please assess collinearity."* You run the check and get this:

```r
ex_fit <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width, data = iris)
ex_vif <- sapply(c("Sepal.Width","Petal.Length","Petal.Width"), function(v) {
  ex_o <- setdiff(c("Sepal.Width","Petal.Length","Petal.Width"), v)
  1 / (1 - summary(lm(reformulate(ex_o, v), data = iris))$r.squared)
})
round(ex_vif, 2)
round(summary(ex_fit)$coefficients, 4)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Petal length and petal width return VIFs of 15.10 and 14.23, both well past the conventional threshold of 10. Going by the usual rule of thumb, this model looks like it is in serious trouble.

Then look at the coefficients: both are significant at p < 0.001, with t values of 12.50 and -4.36. The inflation is real and large, and the estimates came through it comfortably anyway, which puts you in the first case above. Report the VIFs, say that the coefficients of interest remain significant, and explain that collinearity affects precision rather than expected values.

It would be a mistake to drop petal width just because its VIF is 14. It is significant, it is theoretically meaningful, and removing it would change what the remaining coefficients estimate. A high VIF tells you to look more closely, not to delete something.

A VIF of 14 attached to a clearly significant coefficient is less worrying than a VIF of 6 attached to a marginal one, whatever the textbook threshold says, because what actually matters is whether the inflation was enough to obscure the effect you care about.

</details>

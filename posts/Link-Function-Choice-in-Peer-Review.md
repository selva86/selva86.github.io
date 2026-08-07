---
title: "Link Function Choice in Peer Review"
slug: Link-Function-Choice-in-Peer-Review
description: "A reviewer says your link function or error distribution is not justified. Check the family and link in R, decide if the result changes, and word the reply."
keywords: "link function not justified, error distribution not justified, justify link function reviewer, glm distribution reviewer comment, overdispersion peer review, link function choice"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 56
auto_link_terms: link function objection|error distribution reviewer|justify your link function|glm family reviewer comment|overdispersion reviewer|link function not justified
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A generalized linear model rests on two choices you make when you fit it: the distribution family, which says how the response scatters around its mean, and the link function, which says how the predictors combine to produce that mean. A reviewer who asks you to justify them is really asking whether the model matches the kind of outcome you measured. Whether the answer changes your result depends less on the link, which rarely does much, than on the family, whose variance assumption you can check in a single line.</p>

## What the reviewer wrote

> The choice of a log link with Poisson errors is reasonable, but the manuscript does not explain why this family was preferred over the alternatives, and some justification would strengthen the methods.

> Why a Poisson model? The outcome is clearly overdispersed. This should be a negative binomial.

> The results in Table 2 are interesting, though I found the modelling somewhat under-described: the reader is told a generalized linear model was fitted but not which error distribution or link function was assumed, nor why those are appropriate for an outcome of this type, and I think this needs to be spelled out before the effect sizes can really be interpreted.

## What they actually mean

Two separate decisions are hiding inside the one comment, and authors often answer the wrong one. The error distribution, or family, is the random part of the model: it says whether your outcome is a count, a yes-or-no, a proportion, or something continuous, and it fixes the relationship between the mean and the variance. The link function is the systematic part: it sets the scale on which the predictors add up before they are mapped back to that mean. A reviewer who writes "link function" often means the whole specification, family included, so read the comment as a request to show that both suit the outcome you measured, not only the link. The distribution is where trouble usually lives, because getting the mean-variance relationship wrong is what corrupts your standard errors.

## Why they are asking

A generalized linear model earns its standard errors from the variance the family assumes. Choose a family whose variance is too small for the data, and every standard error comes out too narrow, so p-values look stronger than the evidence supports and confidence intervals sit too tight. The classic case is count data: a Poisson model assumes the variance equals the mean, and when the real variance is several times larger, that assumption manufactures significance the data do not contain. The link function goes wrong in a different way, because an identity link on a bounded outcome can predict impossible values, such as a probability above one or a negative count, and even a link that stays in range can fit the curve poorly. None of this biases the coefficients much; what it distorts is the uncertainty around them, which is exactly what a reviewer leans on when reading your effect. Journals expect the analysis to match the data, and STROBE item 12 asks authors to describe all the statistical methods they used, which for a generalized linear model means naming the family and link and saying why they suit the outcome (von Elm et al., 2007). The mechanics of fitting these models live in [Logistic Regression in R](/Logistic-Regression-With-R.html) and [Poisson Regression in R](/Poisson-Regression-in-R.html), so this chapter stays on whether your choice holds up and what to say about it.

## How to check it

The objection names two things, so check both and let the numbers say which one actually bites. Start with the family, because the variance assumption is the choice that moves your standard errors. The `warpbreaks` data records the number of warp breaks on 54 pieces of loom, a count, so a Poisson model is the natural starting point. The Poisson family assumes the variance equals the mean, and you can test that by comparing the model's Pearson residuals against its residual degrees of freedom: a dispersion statistic near one supports the assumption, while a value well above one says the data vary more than Poisson allows.

```r
pois <- glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)
dispersion <- sum(residuals(pois, type = "pearson")^2) / pois$df.residual
round(dispersion, 2)
#> [1] 4.26
```

A dispersion of 4.26 is not a borderline call, because the data carry more than four times the variance the Poisson family assumes, so the standard errors from this model are far too small and its p-values cannot be read as they stand. The statistic has no formal cutoff, so treat the common thresholds near 1.5 or 2 as informal conventions rather than tests; a value of 4.26 is well past any of them, and the standard reference for modelling this extra variation is McCullagh and Nelder (1989). Now turn to the link. Within the Poisson family you could connect the predictors to the mean through the default log link or through a square-root link, and comparing the two by AIC shows how much the choice is worth here.

```r
log_link  <- glm(breaks ~ wool + tension, family = poisson(link = "log"),  data = warpbreaks)
sqrt_link <- glm(breaks ~ wool + tension, family = poisson(link = "sqrt"), data = warpbreaks)
AIC(log_link, sqrt_link)
#>           df      AIC
#> log_link   4 493.0560
#> sqrt_link  4 495.3462
```

The two links land within two AIC points of each other, so the link is barely doing anything here, whereas the dispersion of 4.26 is doing a great deal. That pattern is common: a reviewer writes "link function" and the real fault is the distribution behind it. Running both checks lets you say which one you looked at and what you found, rather than guessing at the one the reviewer happened to name.

## What to do about it

### You are fine

Often the choice a reviewer wants justified is the one the whole field already uses, and the justification is that the standard choice fits while the alternative would change nothing. A binary outcome is the clearest example. Suppose you modelled whether a car has a straight engine from its fuel economy with a logistic regression, and a reviewer asks why the logit link rather than a probit. Fit both and compare.

```r
logit  <- glm(vs ~ mpg, family = binomial(link = "logit"),  data = mtcars)
probit <- glm(vs ~ mpg, family = binomial(link = "probit"), data = mtcars)
round(c(logit = AIC(logit), probit = AIC(probit)), 2)
#>  logit probit 
#>  29.53  29.43 
round(coef(summary(logit))["mpg", ], 4)
#>   Estimate Std. Error    z value   Pr(>|z|) 
#>     0.4304     0.1584     2.7169     0.0066 
round(coef(summary(probit))["mpg", ], 4)
#>   Estimate Std. Error    z value   Pr(>|z|) 
#>     0.2461     0.0825     2.9822     0.0029 
```

The two fits are separated by a tenth of an AIC point, and fuel economy predicts engine type at p = 0.0066 under the logit and p = 0.0029 under the probit, so the reviewer's substantive worry has no teeth. The raw coefficients look different, 0.43 against 0.25, but only because the two links measure the linear predictor on different scales, not because the models disagree; converted to fitted probabilities they trace nearly the same curve (Agresti, 2013). The reply is to state that the logit is the conventional and canonical link for a binomial outcome, that a probit gives an all-but-identical fit, and that the conclusion does not depend on the choice.

### It is fixable

The more common situation is that the family really is wrong, as the dispersion of 4.26 told us for the `warpbreaks` count, and the repair is to move to a family that models the extra variation. A quasi-Poisson model keeps the same log link and the same coefficients but scales the standard errors by the dispersion it estimates, which is the least disruptive fix available. Refit and put the key effect side by side.

```r
qpois <- glm(breaks ~ wool + tension, family = quasipoisson, data = warpbreaks)
round(coef(summary(pois))["tensionH", ], 4)
#>   Estimate Std. Error    z value   Pr(>|z|) 
#>    -0.5185     0.0640    -8.1065     0.0000 
round(coef(summary(qpois))["tensionH", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -0.5185     0.1320    -3.9269     0.0003 
```

The coefficient for high tension does not budge, staying at -0.5185, because overdispersion does not bias the estimate; what changes is its standard error, which doubles from 0.0640 to 0.1320 once the model stops pretending the data are pure Poisson. The effect that had looked significant at an absurd margin is still significant at p = 0.0003, because a genuine effect this large survives an honest standard error. So the family was wrong and the repair widened the uncertainty, but the finding held anyway. A negative binomial model, covered in [Negative Binomial Regression in R](/Negative-Binomial-Regression-in-R.html), is the other standard choice when you would rather model the extra variance explicitly than absorb it into a scale factor.

### It is a real problem

Sometimes the honest standard error is the one that takes the result away, and the same `warpbreaks` refit shows how. Alongside the tension effect, the Poisson model reported that wool type B had significantly fewer breaks, and the corrected family treats that second claim very differently.

```r
round(coef(summary(pois))["woolB", ], 4)
#>   Estimate Std. Error    z value   Pr(>|z|) 
#>    -0.2060     0.0516    -3.9943     0.0001 
round(coef(summary(qpois))["woolB", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -0.2060     0.1065    -1.9349     0.0587 
```

Under the Poisson model the wool effect looked convincing, at p = 0.0001. Once the family is corrected the coefficient is unchanged at -0.2060, but its standard error doubles, and the honest p-value rises to 0.0587, just the wrong side of the conventional 0.05 line. The apparent significance came entirely from the Poisson variance assumption, which the dispersion of 4.26 had already shown the data did not meet. When this happens the correct response is to report the effect under the right family and withdraw any claim that leaned on the inflated version, not to hunt for a family that hands the significance back. A harder version of the same situation is when no standard family fits at all, which is common with counts that carry far more zeros than any Poisson or negative binomial expects. There the answer is a different class of model, such as the zero-inflated and hurdle models in [Zero-Inflated Models in R](/Zero-Inflated-Models-in-R.html), or, when even those do not fit, a stated limitation rather than a forced result.

## How to word your response

### If you are fine

> The reviewer asks us to justify the logit link used in our binary model. The logit is the conventional and canonical link for a binomial outcome, and to confirm the choice is not driving our results we refitted with a probit link. The fit is all but identical, differing by 0.1 in AIC, and the association we report remains significant under both links. We have added a sentence to the Methods (page X) that states the family and link and notes the conclusion is unchanged under the alternative.

### If it was fixable

> We thank the reviewer for pressing on the distribution. The reviewer is correct that our count outcome is overdispersed relative to the Poisson assumption, with an estimated dispersion of 4.3, well above one. We have refitted using a quasi-Poisson family, which retains the log link but estimates standard errors that reflect the excess variation. The coefficient of interest is unchanged and remains significant under the corrected model (p = 0.0003). We now report the quasi-Poisson model as our primary analysis, with the dispersion diagnostic and the change of family described in the Methods (page X).

### If it is a real problem

> The reviewer is right that our Poisson model understated the variability in the data. Once we account for the overdispersion, with a dispersion of 4.3, using a quasi-Poisson family, the effect of wool type is no longer significant at conventional levels (p = 0.059), although the estimate itself is essentially unchanged. The original significance was an artifact of the Poisson variance assumption rather than a feature of the data. We have revised the Results to report the effect under the corrected family and no longer describe it as statistically significant (Results, page X; Methods, page X).

## Practice

A reviewer writes: *"The authors fitted a Poisson model to the insect counts without checking it. Count data of this kind are typically overdispersed, and a Poisson model will therefore overstate the significance of the treatment effects. The analysis should be redone with an appropriate distribution."* You are testing whether the insecticide spray affects the number of insects counted, and you run:

```r
ex_fit  <- glm(count ~ spray, family = poisson, data = InsectSprays)
ex_disp <- sum(residuals(ex_fit, type = "pearson")^2) / ex_fit$df.residual
round(ex_disp, 2)
ex_qp   <- glm(count ~ spray, family = quasipoisson, data = InsectSprays)
round(coef(summary(ex_fit))["sprayC", ], 4)
round(coef(summary(ex_qp))["sprayC", ], 4)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The reviewer's general point is sound, and agreeing on reflex is the trap. Run the check and the dispersion comes back at 1.51, mild overdispersion rather than the four-fold excess that wrecks an analysis. Refitting with a quasi-Poisson family confirms the cost is almost nothing: the spray C coefficient is identical at -1.9402, its standard error widens only from 0.2139 to 0.2626, and the effect stays significant with a test statistic near 7.4 and a p-value that rounds to zero under both models. So this is a "you are fine" outcome dressed up to look like a problem. The reviewer is right that a Poisson model can overstate significance, and here it does not, because the treatment effects are enormous and the overdispersion is slight. The correct reply is not to concede that the analysis is invalid but to report the dispersion, show that a quasi-Poisson refit leaves every conclusion in place, and offer to present that model if the editor prefers.

</details>

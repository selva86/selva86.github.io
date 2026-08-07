---
title: "Zero-Inflation in Peer Review"
slug: Zero-Inflation-in-Peer-Review
description: "A reviewer says your count outcome has too many zeros or needs a zero-inflated model. Check whether the zeros exceed what your model expects, then reply."
keywords: "zero-inflation not considered, excess zeros reviewer, zero-inflated model reviewer comment, count data too many zeros, zero inflation peer review, negative binomial vs zero-inflated"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 57
auto_link_terms: zero-inflation objection|excess zeros reviewer|zero-inflated model reviewer comment|zero inflation not considered|count model excess zeros|reviewer says zero-inflated
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Zero-inflation means a count outcome carries more zeros than the distribution you fitted can produce, so a Poisson or negative binomial model that fits the rest of the data still gets the number of zeros wrong. A reviewer who raises it is asking whether a second process, one that generates zeros on its own, is at work in your data. The question that settles the objection is not how many zeros you have, but whether that count exceeds the number your model already expects.</p>

## What the reviewer wrote

> The outcome is a count with a substantial proportion of zeros. The authors may wish to consider whether a zero-inflated or hurdle model would represent the data more faithfully than the Poisson regression reported here.

> Half of these counts are zero. A standard Poisson model is not appropriate and this needs a zero-inflated model.

> Table 3 is clear and the covariate effects are plausible, but I was left wondering about the distribution of the outcome, which from Figure 1 appears to pile up heavily at zero, and I think the manuscript would be stronger if the authors either justified the Poisson assumption against this feature of the data or moved to a model that accommodates the excess zeros directly.

## What they actually mean

The reviewer is not objecting to the presence of zeros. A count model is built to produce them. The objection is that there may be more zeros than your fitted distribution can account for, which happens when some of the zeros come from a different source than the rest of the counts. A common misreading is to treat the raw proportion of zeros as the problem and reach straight for a zero-inflated model, when the real test is whether the zeros you observe outrun the ones your model already predicts. Read the comment as a request to show that the model's implied number of zeros matches what the data hold, rather than as an instruction to adopt a two-part model on sight.

## Why they are asking

If a separate process is generating zeros and you ignore it, the model is fitting one mechanism to two. Where the damage lands depends on how bad the mismatch is. Mild excess usually surfaces as overdispersion, where the variance runs ahead of the mean and the standard errors come out too small, so effects look more certain than the data support. A larger excess can bend the coefficients themselves. The model stretches its single mean to cover a spike of zeros it was never shaped to fit, and that pull drags every predictor's estimated effect toward the spike. Counts of rare events are where this bites hardest: visits that never happened, defects that never occurred, species never seen at a site. Reporting standards are relevant too, since STROBE item 12 asks authors to describe all the statistical methods they used, and the distribution you assume for a count outcome is one of those methods (von Elm et al., 2007). The mechanics of fitting a model for excess zeros live in [Zero-Inflated and Hurdle Models in R](/Zero-Inflated-and-Hurdle-Models-in-R.html), so this chapter stays on whether you need one and what to say about it.

## How to check it

The diagnostic is a comparison, and it needs no special package. Fit the count model you actually used, then set the zeros the data contain against the zeros the model expects, which you get by adding up each observation's fitted probability of a zero. The `quine` data record how many days each of 146 Australian schoolchildren was absent from school in a year, a count, so a Poisson regression on the pupil characteristics is the conventional starting model.

```r
library(MASS)
fit <- glm(Days ~ Eth + Sex + Age + Lrn, family = poisson, data = quine)
observed <- sum(quine$Days == 0)
expected <- sum(dpois(0, fitted(fit)))
c(observed = observed, expected = round(expected, 2))
#> observed expected 
#>     9.00     0.01 
```

Nine children were never absent, and the fitted Poisson expects almost none, so the data hold zeros the model is unable to produce. The dispersion statistic tells you why the fit is this poor.

```r
round(sum(residuals(fit, type = "pearson")^2) / fit$df.residual, 1)
#> [1] 13.2
```

A dispersion of 13.2, where Poisson assumes 1, says the outcome varies more than thirteen times as widely as the model permits, so the missing zeros are one face of that excess width rather than proof on their own of a separate zero process. There is no formal cutoff for how large the zero gap must be, and the formal test that does exist is contested, so the practical read is the size of the gap together with whether a second, zero-only process is even plausible in your design. Here it is not close. The gap is wide and the whole distribution is too broad, which is the pattern a negative binomial is built to correct.

## What to do about it

### You are fine

The check can come back clean even when zeros dominate the data, and `esoph` is the case that proves it. These 88 rows cross-tabulate oesophageal-cancer cases by age, alcohol and tobacco use, and the case count is zero in 29 of them, a third of the data.

```r
efit <- glm(ncases ~ agegp + alcgp + tobgp, family = poisson, data = esoph)
c(observed = sum(esoph$ncases == 0),
  expected = round(sum(dpois(0, fitted(efit))), 1))
#> observed expected 
#>     29.0     29.8 
```

Twenty-nine zeros looks like textbook zero-inflation until you compare it with the 29.8 the model expects. The Poisson reproduces the zeros almost exactly, because they are not mysterious: they sit in the low-risk strata, the youngest ages and the lowest alcohol and tobacco levels, where a count of zero is what the covariates already predict. When the observed and expected zero counts agree like this, there is nothing left to explain, and the reply is to show the two numbers and note that the covariates account for the zeros on their own. A zero-inflated model fitted to these data would estimate a zero-generating process the data give no evidence for.

### It is fixable

When the zeros really do outrun the Poisson, as they did for `quine`, the first move is almost never a zero-inflated model. It is a negative binomial. The most common cause of excess zeros is ordinary overdispersion, and the negative binomial carries a spare parameter that lets the whole distribution, zeros included, spread out to match the data.

```r
nb <- glm.nb(Days ~ Eth + Sex + Age + Lrn, data = quine)
c(observed = observed,
  poisson  = round(sum(dpois(0, fitted(fit))), 2),
  negbin   = round(sum(dnbinom(0, mu = fitted(nb), size = nb$theta)), 1))
#> observed  poisson   negbin 
#>     9.00     0.01     6.20 
```

The negative binomial lifts the expected number of zeros from essentially none to 6.2, close to the nine observed, without any second process or extra machinery. It manages that by fixing the overdispersion the Poisson ignored, and the same model's dispersion falls back to about 1.

```r
round(sum(residuals(nb, type = "pearson")^2) / nb$df.residual, 1)
#> [1] 1
```

So the excess zeros were mostly the tail of a distribution the Poisson had drawn too narrow, and widening it recovers six of the nine. The negative binomial is the right primary model here, and the [Negative Binomial Regression in R](/Negative-Binomial-Regression-in-R.html) tutorial covers the fit. A small gap remains, 6.2 against nine, and whether that residual is worth a more complex model depends on the reason for it.

### It is a real problem

Sometimes the negative binomial closes the dispersion and still leaves a stack of zeros it cannot reach, which is the signature of a genuine second process. Picture a study counting how many clinic visits each patient made in a year, modelled on age and diagnosis. A negative binomial brings the expected zeros from 40 up to 70, and the data still hold 130, because a large group of patients were never eligible to visit at all, having moved away or been enrolled only on paper. Those are structural zeros, generated by a different mechanism from the patients who could have visited and happened not to. No single count distribution will reproduce them while two processes are in play. The numbers here are illustrative, because built-in data rarely holds an excess this stubborn. The honest response is a two-part model that separates the two processes, either a hurdle model or a zero-inflated model, both covered in [Zero-Inflated and Hurdle Models in R](/Zero-Inflated-and-Hurdle-Models-in-R.html). When the study is too small to estimate a second process reliably, the correct path is not to force one but to report the negative binomial, state that excess zeros remain, and name the likely structural source as a limitation, so the reader can weigh it.

## How to word your response

### If you are fine

> The reviewer suggests a zero-inflated model in place of our Poisson regression, given the number of zero counts. The outcome does contain many zeros, 29 of 88 observations, and we checked whether they exceed what the model expects. Summing the fitted zero probabilities, the Poisson predicts 29.8 zeros against the 29 observed, so the zeros are fully accounted for by the covariates and there is no excess for a zero-inflated model to capture. We have added this comparison to the Methods (page X) and note that the zeros concentrate in the low-risk strata, exactly as the model implies.

### If it was fixable

> We thank the reviewer for questioning the distribution of our count outcome. On checking, the data do hold more zeros than a Poisson allows: the fitted model expects almost none, while nine are observed, and the outcome is overdispersed with a dispersion statistic of about 13. We have refitted with a negative binomial model, which lets the distribution spread to match the data, raises the expected number of zeros to 6.2 against the nine observed, and brings the dispersion back to roughly 1. We now report the negative binomial as our primary analysis, with the zero comparison and the dispersion diagnostic described in the Methods (page X).

### If it is a real problem

> The reviewer is right that our count outcome carries excess zeros a single distribution does not capture. After moving to a negative binomial the model still under-predicts the zeros, and we believe the reason is substantive: a subset of the sample could not have experienced the event at all, which is a different process from a low but non-zero rate. We have therefore fitted a hurdle model that separates the probability of a zero from the count among those at risk, and we report it as the primary analysis (Methods, page X). Where the event was structurally impossible we now say so directly, so the estimate is read against the population it actually describes.

## Practice

A reviewer writes: *"The outcome has far more zeros than a Poisson can produce, and a zero-inflated model is required to handle them."* Your outcome is the number of major scientific discoveries recorded in each year from 1860 to 1959, and you run:

```r
ex_counts <- as.numeric(discoveries)
ex_pois <- glm(ex_counts ~ 1, family = poisson)
ex_nb   <- glm.nb(ex_counts ~ 1)
c(observed = sum(ex_counts == 0),
  poisson  = round(sum(dpois(0, fitted(ex_pois))), 1),
  negbin   = round(sum(dnbinom(0, mu = fitted(ex_nb), size = ex_nb$theta)), 1))
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Run it and the counts do show excess: 9 years recorded no major discovery, while the Poisson expects only 4.5, so the reviewer is right that a plain Poisson is wrong. The obvious next step, and the trap, is to do what the comment literally asks and fit a zero-inflated model. Fit a negative binomial instead and it expects 8.6 zeros, all but identical to the nine observed, because the estimated dispersion parameter (theta of 5.46) shows the counts are simply overdispersed: the variance of 5.08 runs well above the mean of 3.1. This is the fixable outcome, not a real problem: the excess is genuine but the fix is a negative binomial, not the zero-inflated model the reviewer named. The reply is to report the zero comparison under both models, adopt the negative binomial, and note that once overdispersion is modelled the excess zeros disappear, so a two-part model is not warranted.

</details>

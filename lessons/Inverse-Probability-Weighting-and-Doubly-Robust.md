---
title: "Causal Inference for Decisions Lesson 2: Inverse-Probability Weighting and Doubly-Robust Estimation"
catalog_blurb: "Reweight to fix confounding, with a safety net if a model is wrong."
description: "When people choose their own treatment, a naive comparison is confounded. Reweight by the propensity score, check overlap, and add a doubly-robust safety net in R."
keywords: "inverse probability weighting, IPW, IPTW, doubly robust, AIPW, propensity score, positivity, overlap, causal inference, ATE, R"
post_type: "LESSON"
curriculum_id: "6.180.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "2"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Difference-in-Differences-and-Parallel-Trends.html"
course_prev: "Matching-and-the-Propensity-Score.html"
---

=== step === cover
::eyebrow Lesson 2 of 11
## Inverse-Probability Weighting and Doubly-Robust Estimation

In Lesson 1 you fixed a confounded comparison by matching: pair each treated patient with an untreated look-alike on their propensity score, then compare only fair matches. It worked, the naive 52-metre headline dissolved back to the real 25. But matching is wasteful. It throws away every control who fails to find a partner, and it stumbles when a treated patient has no close twin at all.

We are still with the cardiac-rehab study from Lesson 1: **400 heart-attack patients**, some enrolled in an optional rehab program and some did not, and the outcome is how much further each could walk in six minutes three months later. Fitter patients were both more likely to enroll AND more likely to recover on their own, so the raw gap between enrollees and non-enrollees, **52 metres**, badly overstates the **25-metre** effect we actually built into the data.

This lesson gives you two sharper tools and then fuses them. First, **inverse-probability weighting**: instead of discarding controls, reweight every patient so the treated and untreated groups look alike, no data left behind. Then the **doubly-robust** estimator, which combines weighting with a second model so that you only have to get ONE of the two right. Toggle the panel below: it is the same overlap picture from Lesson 1, treated patients piled at high propensity scores, controls at low. Weighting operates on exactly this picture.

By the end of this lesson you will be able to:

- Reweight the sample by inverse propensity to rebuild a pseudo-randomized population, and compute the effect
- Read the weights to judge whether the estimate can be trusted, and state the positivity (overlap) requirement
- Estimate the same effect a second way, by modelling the outcome, and see why each single method fails if its model is wrong
- Combine both into the doubly-robust (AIPW) estimator and watch it stay correct when either model, but not both, is misspecified

**Prerequisites:** Lesson 1 (the propensity score, confounding, potential outcomes, and the average treatment effect); you can fit `glm` and `lm`, read their `predict` outputs, and you know what a weighted average is.

::widget matching-overlap {}

=== step === concept
::eyebrow The idea
## Reweight the sample instead of throwing data away

Matching's instinct was to find, for each treated patient, one control who looks like them, and ignore the rest. Weighting keeps a different instinct: keep everyone, but turn the volume up on the units that are under-represented and down on the ones that are over-represented, until the two groups balance.

The dial is the **propensity score** \(e(x)\) from Lesson 1, the probability a patient with covariates \(x\) enrolls. Give every patient a weight equal to one divided by the probability of the treatment they actually received. A treated patient gets \(1/e(x)\); a control gets \(1/(1-e(x))\):

\[ w_i = \frac{T_i}{e(x_i)} + \frac{1-T_i}{1-e(x_i)}, \]

where \(T_i = 1\) if patient \(i\) enrolled and \(0\) if not. Why one-over-probability? Picture a very fit patient. Fit patients almost all enroll, so a fit patient who did NOT is a rare bird. That single unusual control has to stand in for all the fit controls the data is short of, so weighting counts them several times over. A few concrete patients from our study make it tangible:

| Patient | Baseline | Enrolled? | Propensity \(e(x)\) | Weight |
|---|---|---|---|---|
| 1 | 419 m | no | 0.76 | 4.12 |
| 2 | 383 m | yes | 0.64 | 1.56 |
| 5 | 431 m | yes | 0.79 | 1.27 |

Patient 1 was very fit (419 m), had a 76% chance of enrolling, but did not. As a control that makes them precious: their weight is one over their chance of NOT enrolling (about one in four), which works out to 4.12, so they count for about four ordinary controls. Patient 2 enrolled with a middling 64% chance, a fairly typical enrollee, so their weight \(1/0.64 = 1.56\) is close to one.

[KEY INSIGHT]
Matching keeps a handful of controls and discards the rest. Weighting keeps ALL of them and just adjusts how loudly each one speaks. The reweighted world is a **pseudo-population** in which enrollment no longer depends on fitness, a rebuilt version of the randomized trial we were never allowed to run.

=== step === concept
::eyebrow The estimator
## From weights to an effect

Every lesson opens a fresh R session, so we rebuild the study exactly as in Lesson 1, same seed, same 25-metre true effect planted in the data.

```r
set.seed(2024)
n <- 400
baseline <- round(rnorm(n, 350, 70))                                  # 6-min walk at discharge, metres
rehab    <- rbinom(n, 1, plogis(0.15 + 1.1 * (baseline - 350) / 70))  # 1 = enrolled in rehab
improve  <- round(40 + 25 * rehab + 0.45 * (baseline - 350) + rnorm(n, 0, 25))  # 3-month gain, metres
study    <- data.frame(baseline, rehab, improve)
```

Now estimate each patient's propensity with the same logistic model from Lesson 1, and turn it into a weight.

```r
ps <- predict(glm(rehab ~ baseline, family = binomial, data = study), type = "response")
w  <- ifelse(study$rehab == 1, 1 / ps, 1 / (1 - ps))   # weight = 1 / prob of the treatment received
head(data.frame(baseline = study$baseline, rehab = study$rehab,
                ps = round(ps, 2), weight = round(w, 2)))
#>   baseline rehab   ps weight
#> 1      419     0 0.76   4.12
#> 2      383     1 0.64   1.56
#> 3      342     0 0.49   1.96
#> 4      335     0 0.46   1.86
#> 5      431     1 0.79   1.27
#> 6      440     1 0.81   1.23
```

The estimate itself is now just a weighted average. Take the weighted mean gain of the enrollees, subtract the weighted mean gain of the non-enrollees, and because the weights rebuilt a balanced pseudo-population, that difference estimates the effect. This targets the **average treatment effect** (ATE) from Lesson 1, the effect averaged over everyone.

```r
m1 <- weighted.mean(study$improve[study$rehab == 1], w[study$rehab == 1])  # weighted mean, enrollees
m0 <- weighted.mean(study$improve[study$rehab == 0], w[study$rehab == 0])  # weighted mean, non-enrollees
round(c(control = m0, treated = m1, effect = m1 - m0), 1)
#>  control  treated   effect
#>     41.2     69.3     28.1
```

The raw group means were 26.4 and 78.5, a 52.1-metre gap. After weighting they are 41.2 and 69.3, a gap of **28.1 metres**, most of the way back to the true 25. Weighting did the same job matching did in Lesson 1, without discarding a single patient. A shortcut worth knowing: weighted least squares returns the identical number, so in day-to-day work you fit one line.

```r
round(coef(lm(improve ~ rehab, data = study, weights = w))["rehab"], 1)
#> rehab
#>  28.1
```

For the record, the version that divides by the sample size \(n\) rather than by the weight totals is the classic **Horvitz-Thompson** estimator,

\[ \hat\tau_{\text{IPW}} = \frac{1}{n}\sum_{i=1}^{n} \frac{T_i\,Y_i}{e(x_i)} \; - \; \frac{1}{n}\sum_{i=1}^{n} \frac{(1-T_i)\,Y_i}{1-e(x_i)}, \]

with \(Y_i\) the observed gain of patient \(i\). The weighted-mean version above is the stabilized (Hajek) cousin that normalizes by the weight totals. You will compute the Horvitz-Thompson form yourself next.

=== step === tryit
::eyebrow In R
## Compute the estimate yourself

You just saw the stabilized estimate, 28.1 metres. The Horvitz-Thompson estimator is even more direct: divide each patient's outcome by the probability they received their own treatment, then average over all \(n\) patients. The non-enrollees are already divided by \(1-e(x)\), their probability of not enrolling. Fill in the denominator for the enrollees, which is their probability of enrolling.

```r
# Horvitz-Thompson IPW: divide each outcome by the prob of the treatment received, then average
tau_ht <- mean(study$rehab * study$improve / ____) -
          mean((1 - study$rehab) * study$improve / (1 - ps))
round(tau_ht, 1)
```
::check {"regex":"improve\\s*/\\s*ps","gate":true,"difficulty":"intermediate","ok":"That is it. Dividing an enrollee's outcome by ps up-weights the ones who were unlikely to enroll, and the Horvitz-Thompson estimate lands at 24.9 metres, almost exactly the true 25. The two IPW flavours (24.9 and 28.1) bracket the truth and both leave the confounded 52.1 far behind.","no":"An enrollee's outcome is divided by their probability of enrolling, which is their propensity: study$improve / ps. (The non-enrollees below are divided by 1 - ps, their probability of NOT enrolling.)"}
::solution
```r
tau_ht <- mean(study$rehab * study$improve / ps) -
          mean((1 - study$rehab) * study$improve / (1 - ps))
round(tau_ht, 1)
#> [1] 24.9
```

Both IPW estimators do the job. Horvitz-Thompson is exactly unbiased in expectation; the stabilized version trades a hair of bias for steadier behaviour when weights vary a lot, which is exactly the trouble the next step is about.

=== step === quiz
::eyebrow Check yourself
## What the weights actually do

In our study the biggest weight, **4.12**, went to a fit patient (baseline 419 m) who did not enroll. Why does inverse-probability weighting hand that particular patient so much weight?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because that patient is an outlier whose outcome should count for less, and a large weight shrinks their influence ::no A large weight INCREASES influence, it does not shrink it. This patient counts as roughly four ordinary controls precisely so their information is amplified, not muted.
- Because fit patients almost all enroll, so a fit patient who did NOT is rare, and weighting counts them several times over to stand in for all the fit controls the data is missing ::ok Exactly. IPW amplifies the under-represented kind of unit so the reweighted control group matches the treated group's fitness mix. Nobody is discarded; the rare look-alikes are turned up.
- Because weighting corrects for confounders you never measured, and this patient carried the most unmeasured risk ::no Weighting only balances the confounders inside the propensity model, here baseline fitness. Just like matching, it does nothing about confounders you never recorded; that assumption is unchanged from Lesson 1.

=== step === concept
::eyebrow The catch
## When a weight explodes: positivity and overlap

Reweighting has a failure mode that matching quietly hid. A weight is one divided by a probability, so if a patient was almost certain to receive the treatment they got, that probability sits near 1, its complement near 0, and the weight blows up.

```r
1 / (1 - c(0.90, 0.99, 0.999))   # a control's weight as their chance of enrolling approaches 1
#> [1]   10  100 1000
```

A single control with a propensity of 0.999 would count as a thousand people and drown out everyone else. This is the **positivity** assumption, also called **overlap**: every patient must have a real, non-trivial chance of landing in either group. Where it fails, IPW hands the answer to a tiny number of extreme units, and no amount of clever code repairs it.

So how healthy is our study? Look at the spread of weights and the effective sample size.

```r
round(summary(w), 2)                 # the spread of the weights
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    1.03    1.33    1.63    1.98    2.24    7.93
round(sum(w)^2 / sum(w^2))           # Kish effective sample size, out of 400
#> [1] 316
```

The biggest weight is **7.9** (one fit control speaking for about eight), and the **effective sample size is 316 of 400**: after reweighting we retain most of our data's worth of information. That is comfortable overlap. Toggle the widget below to see why, the treated and control propensity histograms sit on top of each other across the whole range, with no treated patient stranded in a zone where no control exists.

::widget matching-overlap {}

[WARNING]
When weights DO explode, you have honest moves: **trim or cap** extreme weights (accepting a little bias), switch to the **stabilized (Hajek)** weights you already met (they tame the variance), or **restrict to the region of common support** and report that you did. What you must never do is let three patients quietly decide the result. Always inspect the weight distribution before you trust an IPW estimate.

=== step === quiz
::eyebrow Check yourself
## Reading the overlap

A colleague fits a propensity model and finds that 30 of the treated patients have propensity scores above 0.98, with almost no control patients up there. What is the right read?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Good news: scores near 1 mean the model predicts treatment almost perfectly, so the estimate will be very accurate ::no A model that predicts treatment almost perfectly is exactly the danger. Those 30 patients have a tiny 1 minus e, so their inverse weights would explode, and there are no real controls near them to compare against. Near-perfect prediction signals a positivity violation, not accuracy.
- This is a positivity (overlap) violation: those patients sit in a region with no comparable controls, so any effect there is an extrapolation, and their inverse weights will be enormous ::ok Right. With no controls near propensity 0.98, there is nothing to weight against; IPW would lean on a few extreme weights and invent a comparison the data cannot support. Trim, restrict to common support, or report the limitation.
- Positivity is guaranteed the moment you fit a logistic model, so there is nothing to check ::no Fitting a model never guarantees overlap; overlap is a property of the DATA, not the model. A logistic fit will happily produce scores of 0.98 with no controls nearby. You have to inspect the score distributions and the weights yourself.

=== step === concept
::eyebrow A second road
## The other way: model the outcome, not the treatment

Every tool so far, matching and weighting, has modelled the **treatment**: who was likely to enroll. There is a completely different route to the same effect, model the **outcome** instead. Fit a regression of the gain on treatment and the confounder, then use it to predict, for every patient, both of their potential outcomes: the gain the model expects if they had enrolled, and the gain if they had not. Average the within-patient differences. This is **g-computation**, or the outcome-regression approach.

Write \(\hat\mu_1(x)\) for the model's predicted gain when enrolled and \(\hat\mu_0(x)\) when not. The outcome-model estimate is the average predicted effect,

\[ \hat\tau_{\text{reg}} = \frac{1}{n}\sum_{i=1}^{n}\big[\hat\mu_1(x_i) - \hat\mu_0(x_i)\big]. \]

```r
out_model <- lm(improve ~ rehab + baseline, data = study)
mu1 <- predict(out_model, transform(study, rehab = 1))   # everyone's predicted gain IF enrolled
mu0 <- predict(out_model, transform(study, rehab = 0))   # everyone's predicted gain IF not
round(mean(mu1 - mu0), 1)
#> [1] 25.6
```

**25.6 metres**, again close to the true 25 and nowhere near 52. Two different philosophies, weight the treatment or model the outcome, landing in the same place is reassuring. (With this simple linear model the average predicted effect is just the `rehab` coefficient; the predict-both-worlds recipe earns its keep once the model has interactions, or you want the effect for one subgroup.) But each road leans on its own model being correct, and that is the crack the next idea slips through.

=== step === widget
::eyebrow The best of both
## Doubly-robust estimation: a second chance

Here is the tension. Inverse-probability weighting is trustworthy only if your **propensity** model is right. The outcome-regression estimate is trustworthy only if the **outcome** model is right. In a real study you are guessing at both specifications, and you do not know which, if either, you got wrong. The **doubly-robust** estimator, also called **augmented inverse-probability weighting** (AIPW), fuses them so that you only need ONE of the two to be correct.

The recipe reads as a short pipeline: start from the outcome-model estimate, then add a correction that reweights the outcome model's own mistakes (its residuals) by the inverse propensity.

::widget process-flow {"steps":[{"title":"Fit two models","sub":"a propensity model e(x) and an outcome model for each arm"},{"title":"Predict both worlds","sub":"mu1 and mu0 for every patient from the outcome model"},{"title":"Correct with weights","sub":"reweight each leftover residual by inverse propensity"},{"title":"Average","sub":"the mean over all patients is the doubly-robust effect"}]}

Written out, with \(Y_i\) the observed gain again,

\[ \hat\tau_{\text{AIPW}} = \frac{1}{n}\sum_{i=1}^{n}\Big[\, \hat\mu_1(x_i) - \hat\mu_0(x_i) \;+\; \frac{T_i\,(Y_i - \hat\mu_1(x_i))}{e(x_i)} \;-\; \frac{(1-T_i)\,(Y_i - \hat\mu_0(x_i))}{1-e(x_i)} \,\Big]. \]

Read the two pieces. The first, \(\hat\mu_1 - \hat\mu_0\), is exactly the outcome-model estimate from the last step. The second is an inverse-probability-weighted average of the outcome model's **residuals**, \(Y_i - \hat\mu\), the part of each patient the model failed to explain. If the outcome model is perfect, those residuals are zero and the correction vanishes, leaving the correct outcome estimate. If the outcome model is wrong but the propensity model is right, that weighted-residual term mops up the leftover bias and rescues the answer. Either model can carry the estimate.

```r
aipw_hat <- mean( mu1 - mu0
  + study$rehab       * (study$improve - mu1) / ps
  - (1 - study$rehab) * (study$improve - mu0) / (1 - ps) )
round(aipw_hat, 1)
#> [1] 25.4
```

**25.4 metres.** With both models sensible, AIPW simply agrees with everything else. The point of the machinery only shows up when one of the two models is broken, which we are about to do on purpose.

=== step === tryit
::eyebrow The payoff
## Break a model on purpose

Time to earn the name "doubly robust." We will sabotage each model in turn and watch what survives. A **wrong propensity model** that ignores baseline fitness (a constant chance of enrolling for everyone) and a **wrong outcome model** that also ignores it (gain depends only on treatment). Each, used on its own, reproduces the confounded 52.1.

```r
ps_wrong  <- rep(mean(study$rehab), nrow(study))   # propensity ignores fitness (WRONG)
out_wrong <- lm(improve ~ rehab, data = study)     # outcome ignores fitness (WRONG)
mu1_w <- predict(out_wrong, transform(study, rehab = 1))
mu0_w <- predict(out_wrong, transform(study, rehab = 0))

round(c(
  ipw_wrong_ps = mean(study$rehab * study$improve / ps_wrong) -
                 mean((1 - study$rehab) * study$improve / (1 - ps_wrong)),
  gcomp_wrong  = mean(mu1_w - mu0_w)), 1)
#> ipw_wrong_ps  gcomp_wrong
#>         52.1         52.1
```

Both broken methods hand back **52.1**, the very bias we set out to kill. Now feed the BROKEN propensity model, together with the CORRECT outcome model (`mu1`, `mu0` from the last step), into AIPW. Fill in the denominator that applies the wrong propensity to the enrollees' residuals.

```r
# AIPW with a WRONG propensity model but the CORRECT outcome model
dr <- mean( mu1 - mu0
  + study$rehab       * (study$improve - mu1) / ____
  - (1 - study$rehab) * (study$improve - mu0) / (1 - ps_wrong) )
round(dr, 1)
```
::check {"regex":"mu1\\)\\s*/\\s*ps_wrong","gate":true,"difficulty":"intermediate","ok":"There it is: 25.6 metres, even though the propensity model is deliberately broken. The correct outcome model carried the estimate home. Use ps_wrong throughout to see AIPW survive a wrong propensity model.","no":"Apply the SAME broken model, ps_wrong, to the enrollees: (study$improve - mu1) / ps_wrong. The whole point is to prove AIPW survives even when the propensity model is wrong, so do not quietly swap in the correct ps here."}
::solution
```r
dr <- mean( mu1 - mu0
  + study$rehab       * (study$improve - mu1) / ps_wrong
  - (1 - study$rehab) * (study$improve - mu0) / (1 - ps_wrong) )
round(dr, 1)
#> [1] 25.6

# the full picture: AIPW under every combination of right / wrong models
aipw <- function(e, m1, m0) mean(m1 - m0 +
          study$rehab * (study$improve - m1) / e -
          (1 - study$rehab) * (study$improve - m0) / (1 - e))
round(c(
  both_right = aipw(ps,       mu1,   mu0),
  wrong_ps   = aipw(ps_wrong, mu1,   mu0),
  wrong_out  = aipw(ps,       mu1_w, mu0_w),
  both_wrong = aipw(ps_wrong, mu1_w, mu0_w)), 1)
#> both_right   wrong_ps  wrong_out both_wrong
#>       25.4       25.6       28.2       52.1
```

Read that last row. Propensity model wrong but outcome model right: **25.6**. Outcome model wrong but propensity model right: **28.2**. Either single correct model drags the estimate home to roughly 25. Only when BOTH are wrong does AIPW collapse back to the confounded **52.1**, because then there is nothing left to lean on. That is double robustness: two shots at the truth, and you need only one to land.

[WARNING]
Doubly robust is not the same as assumption-free. You still need **positivity** (weights that do not explode), and you still need **no unmeasured confounding**, the load-bearing assumption from Lesson 1: if a confounder is missing from BOTH models, neither can save you and AIPW is biased like everything else. Two chances at the nuisance models is not a licence to skip the causal thinking.

In practice you would not hand-roll the estimator. The `WeightIt` package builds the weights and `marginaleffects` computes the doubly-robust effect with proper standard errors in a few lines (this needs a full R install, so read it, do not run it here):

```r-static
library(WeightIt)
w.out <- weightit(rehab ~ baseline, data = study, method = "glm", estimand = "ATE")

library(marginaleffects)
fit <- lm(improve ~ rehab * baseline, data = study, weights = w.out$weights)  # outcome model on the weighted data
avg_comparisons(fit, variables = "rehab", wts = w.out$weights)                # the doubly-robust ATE, with a CI
```

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Hernan and Robins, Causal Inference: What If (free PDF)](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - the rigorous treatment of IP weighting (ch. 12) and doubly-robust estimators (ch. 13), plus positivity and exchangeability.
- [Chesnaye et al. (2022), An introduction to inverse probability of treatment weighting (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8757413/) - the gentlest applied walk-through of IPTW, weights, and balance; start here.
- [Austin and Stuart (2015), Moving towards best practice when using IPTW (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4626409/) - practical guidance on stabilized weights, trimming, and diagnostics.
- [Funk et al. (2011), Doubly Robust Estimation of Causal Effects (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3070495/) - the clearest applied introduction to why AIPW gives you two chances at the truth.
- [WeightIt: weighting for covariate balance (R package)](https://ngreifer.github.io/WeightIt/) - the tool that fits the weights and the doubly-robust estimate in a couple of lines.

=== step === complete
## Lesson 2 complete

You reweighted a confounded study back into balance without discarding a single patient, and pulled the naive 52.1 metres back toward the true 25. You met the positivity requirement in its sharpest form, a weight is one over a probability, so overlap is not optional. You estimated the same effect a second way by modelling the outcome, then fused the two into the doubly-robust AIPW estimator and watched it survive a deliberately broken model, because one correct model is enough.

Next, Lesson 3: Difference-in-Differences and Parallel Trends. When you cannot model every confounder, sometimes you can difference them away instead, comparing the before-and-after change in a treated group against the change in a control group, and letting the two groups' shared trend cancel the confounding you could never measure.

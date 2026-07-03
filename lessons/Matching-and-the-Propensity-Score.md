---
title: "Causal Inference for Decisions Lesson 1: Matching and the Propensity Score"
catalog_blurb: "Fairly compare treated and untreated groups when you could not randomize."
description: "When people choose their own treatment, a naive group comparison is confounded. Estimate a propensity score, match on it, and recover the real effect in R."
keywords: "propensity score, matching, causal inference, confounding, potential outcomes, standardized mean difference, observational study, ATT, glm, R"
post_type: "LESSON"
curriculum_id: "6.180.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "1"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Inverse-Probability-Weighting-and-Doubly-Robust.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 11
## Matching and the Propensity Score

A hospital offers an optional cardiac-rehab program to patients recovering from a heart attack. Three months later, the patients who enrolled walk **52 metres** further in six minutes than the patients who did not. A press release writes itself: rehab adds 52 metres. Except it did not. The patients who signed up were fitter and more motivated to begin with, so they would have recovered better even with no program at all. Part of that 52-metre gap is the rehab; part is just who chose to enroll.

This is the central problem of learning from data you did not get to randomize. When people pick their own treatment, the treated and untreated groups differ for reasons that have nothing to do with the treatment. This lesson gives you the first and most intuitive tool for fixing it: estimate how likely each person was to be treated (their **propensity score**), pair each treated person with an untreated look-alike, and compare only fair matches. Toggle the panel below to feel the whole idea in miniature: two groups that start out mismatched, snapped into alignment.

By the end of this lesson you will be able to:

- Explain why a naive difference between a treated and an untreated group is biased when people self-select
- State what a causal effect actually is, using potential outcomes, and split the naive gap into a real effect plus selection bias
- Estimate a propensity score with `glm`, match on it, and recover an effect a raw comparison gets badly wrong
- Read the standardized mean difference to check that matching worked, and name what matching still cannot fix

**Prerequisites:** you can fit a logistic regression with `glm(..., family = binomial)` and read its predicted probabilities, and you know why a randomized experiment removes confounding.

::widget matching-overlap {}

=== step === concept
::eyebrow The trap
## You cannot just compare the two groups

Let us build the hospital's data so the trap is impossible to wave away. Four hundred patients; each has a **baseline** fitness at discharge (metres walked in six minutes) and either enrolled in rehab or did not. We plant a **true** rehab effect of exactly **25 metres**, so we know the honest answer and can watch the naive comparison miss it. Crucially, fitter patients (higher baseline) are both more likely to enroll AND recover more on their own, which is the confounding.

```r
set.seed(2024)
n <- 400
baseline <- round(rnorm(n, 350, 70))                                 # 6-min walk at discharge, metres
rehab    <- rbinom(n, 1, plogis(0.15 + 1.1 * (baseline - 350) / 70)) # 1 = enrolled in rehab
improve  <- round(40 + 25 * rehab + 0.45 * (baseline - 350) + rnorm(n, 0, 25))  # 3-month gain, metres
study    <- data.frame(baseline, rehab, improve)

table(study$rehab)                                    # how many enrolled
#>
#>   0   1
#> 189 211
round(tapply(study$improve, study$rehab, mean), 1)    # mean gain in each group
#>    0    1
#> 26.4 78.5
```

The enrolled group gained **78.5 m** on average, the others **26.4 m**. Subtract, and you get the headline.

```r
naive <- mean(study$improve[study$rehab == 1]) - mean(study$improve[study$rehab == 0])
round(naive, 1)
#> [1] 52.1
```

A 52.1-metre gap, more than double the 25 metres we actually built in. Why is it so inflated? Because we are not comparing rehab against no-rehab. We are comparing *the kind of patient who enrolls* against *the kind who does not*, and those two kinds of patient were different before rehab entered the picture. The next step draws exactly why that ruins the comparison.

=== step === widget
::eyebrow The mechanism
## Confounding, drawn

A picture makes the problem precise. Call the treatment **X** (enrolled in rehab), the outcome **Y** (three-month gain), and baseline fitness **Z**. In our study, baseline fitness is a **confounder**: it points an arrow at X (fitter patients enroll more) and an arrow at Y (fitter patients recover more), while X also affects Y (rehab genuinely helps). Because Z feeds both X and Y, some of the X-to-Y association you observe is really Z leaking through a side route, the **backdoor path** X ← Z → Y.

Switch the widget to **confounder** and read the verdict: when a variable causes both the treatment and the outcome, you must **control for it**, or the effect you read off is wrong. (The other two shapes, collider and mediator, are traps in the opposite direction, and later lessons return to them. For now, baseline fitness is a clean confounder.)

::widget causal-dag {}

Matching is one way to "control for Z": instead of comparing all treated to all controls, we will compare treated and control patients who have the *same* baseline fitness, closing the backdoor.

=== step === concept
::eyebrow What we are really after
## The comparison you wish you had

To say the naive gap is "wrong" we need to say what "right" would be. The clean way is **potential outcomes**. For each patient \(i\), imagine two parallel worlds: \(Y_i(1)\) is the gain they would record if they enrolled in rehab, and \(Y_i(0)\) is the gain the *same* patient would record if they did not. That patient's true rehab effect is the difference between their own two worlds,

\[ \tau_i = Y_i(1) - Y_i(0). \]

Here is the catch that defines the whole field, the **fundamental problem of causal inference**: a patient either enrolls or does not, so you only ever observe *one* of \(Y_i(1)\) and \(Y_i(0)\). The other is a counterfactual you can never measure.

| Patient | Enrolled? | Gain if enrolled, \(Y(1)\) | Gain if not, \(Y(0)\) | Effect \(\tau_i\) |
|---|---|---|---|---|
| Anaya | yes | **74 m** (observed) | ? never seen | ? |
| Ben | no | ? never seen | **22 m** (observed) | ? |

Since we cannot get an individual's two worlds, we aim for an average. The **average treatment effect on the treated** (ATT) is what rehab did, on average, for the patients who actually took it, with \(T = 1\) meaning treated:

\[ \mathrm{ATT} = E\big[\,Y(1) - Y(0) \mid T = 1\,\big]. \]

Now watch what the naive difference of observed group means actually equals. Adding and subtracting the term \(E[Y(0)\mid T=1]\) (how the treated *would* have done untreated) splits it cleanly:

\[ \underbrace{E[Y \mid T{=}1] - E[Y \mid T{=}0]}_{\text{naive 52.1 m}} = \underbrace{E[Y(1){-}Y(0)\mid T{=}1]}_{\text{ATT, the real effect}} + \underbrace{E[Y(0)\mid T{=}1] - E[Y(0)\mid T{=}0]}_{\text{selection bias}}. \]

The second term is the whole trouble: it asks whether the treated and control groups would have differed *even with no treatment*. In our study they would, because the treated started fitter, so \(E[Y(0)\mid T{=}1] > E[Y(0)\mid T{=}0]\) and the bias is positive. That extra 27 metres of "bias" is exactly what pushed 25 up to 52. Kill the selection bias and the naive number collapses back onto the ATT.

=== step === quiz
::eyebrow Check yourself
## Why the 52 metres is not the effect

In our data the enrolled patients had a mean baseline of **381 m** versus **322 m** for the others, and the raw outcome gap was **52.1 m** against a true effect of **25 m**. Which statement correctly explains the gap?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The 52.1 m gap is rehab's causal effect; the program simply works very well ::no That is the trap. The gap is the ATT plus selection bias. Because the enrolled patients started 59 m fitter and would have improved more anyway, part of the 52 m is that head start, not rehab.
- The enrolled patients started fitter and would have improved more even without rehab, so part of the 52 m is that baseline head start, not the program ::ok Exactly. The naive difference equals the real effect plus a selection-bias term. Here the treated group's higher baseline makes E[Y(0)|T=1] larger than E[Y(0)|T=0], inflating 25 up to 52.
- The gap would shrink to 25 m if we simply collected more patients ::no More data shrinks variance, not bias. Confounding is systematic: a bigger sample estimates the same biased 52 m more precisely. You need to adjust for baseline, not collect more of it.

=== step === concept
::eyebrow The key idea
## The propensity score

Matching patient to patient on baseline fitness works when you have one confounder. Real studies have dozens (age, prior surgeries, medication, distance from the clinic), and you cannot find an exact twin across all of them. Rosenbaum and Rubin's insight was to collapse every confounder into a single number: the **propensity score**, the probability that a patient with covariates \(x\) ends up treated,

\[ e(x) = P(T = 1 \mid X = x). \]

You already know how to estimate a probability from predictors: a logistic regression. Fit the treatment (not the outcome) on the confounders, and read off each patient's fitted probability of enrolling.

```r
ps_model <- glm(rehab ~ baseline, family = binomial, data = study)
study$ps <- predict(ps_model, type = "response")   # each patient's chance of enrolling
head(round(study[, c("baseline", "rehab", "ps")], 3))
#>   baseline rehab    ps
#> 1      419     0 0.757
#> 2      383     1 0.642
#> 3      342     0 0.489
#> 4      335     0 0.462
#> 5      431     1 0.789
#> 6      440     1 0.812
```

Read row 1: a very fit patient (419 m) had a 0.76 chance of enrolling but happened not to, an unusually good control to compare a treated patient against. The magic is the **balancing property**: among patients who share the same propensity score, the treated and the untreated have, on average, the same distribution of the original confounders. So comparing a treated and a control patient with equal scores is like comparing two people plucked from the same mini-randomized experiment. One number stands in for the whole tangle of confounders.

=== step === concept
::eyebrow Putting it to work
## Match on the score, and the imbalance collapses

The simplest recipe is **nearest-neighbour matching**: walk through each treated patient, and pair them with the control whose propensity score is closest. That throws away nothing about the treated group (so the estimate targets the ATT) and reuses the controls that actually resemble treated patients. It only works where the two groups **overlap**, the region of "common support" where both treated and control patients exist; a treated patient so extreme that no control comes close cannot be matched honestly, and you should not pretend otherwise.

How do you *check* that matching balanced a confounder? Compare its group means on a scale that ignores units, the **standardized mean difference** (SMD). For a covariate with treated mean \(\bar{X}_t\), control mean \(\bar{X}_c\), and group variances \(s_t^2, s_c^2\),

\[ d = \frac{\bar{X}_t - \bar{X}_c}{\sqrt{\tfrac{1}{2}\left(s_t^2 + s_c^2\right)}}. \]

It is the gap in means measured in standard deviations. A common rule of thumb: \(|d| < 0.1\) is good balance, meaning the groups are close enough on that covariate to compare fairly. Toggle the widget between **before** and **after** matching: the mismatched treated and control piles slide into alignment, and the SMD printed underneath drops from badly imbalanced toward zero.

::widget matching-overlap {}

=== step === tryit
::eyebrow In R
## Recover the real effect

Now do it on our study. The propensity score `study$ps` already exists from two steps ago. Pair each treated patient with the nearest-propensity control by filling in the function that returns the index of the smallest distance, then average the paired differences to estimate the ATT.

```r
trt  <- which(study$rehab == 1)
ctrl <- which(study$rehab == 0)
# pair each treated patient with the control closest in propensity score
match_id <- sapply(trt, function(i) ctrl[which.____(abs(study$ps[ctrl] - study$ps[i]))])
att <- mean(study$improve[trt] - study$improve[match_id])
round(att, 1)
```
::check {"regex":"which\\.min","gate":true,"difficulty":"intermediate","ok":"That is it. which.min returns the index of the nearest control, and the matched difference lands near the true 25 m, not the naive 52 m.","no":"You want the index of the SMALLEST distance: which.min(abs(...)). which.max would pick the worst possible match."}
::solution
```r
trt  <- which(study$rehab == 1)
ctrl <- which(study$rehab == 0)
match_id <- sapply(trt, function(i) ctrl[which.min(abs(study$ps[ctrl] - study$ps[i]))])

att   <- mean(study$improve[trt] - study$improve[match_id])
naive <- mean(study$improve[trt]) - mean(study$improve[ctrl])
round(c(true = 25, naive = naive, matched = att), 1)
#>    true   naive matched
#>    25.0    52.1    27.0

# did matching actually balance baseline fitness?
smd <- function(a, b) (mean(a) - mean(b)) / sqrt((var(a) + var(b)) / 2)
round(c(before = smd(study$baseline[trt], study$baseline[ctrl]),
        after  = smd(study$baseline[trt], study$baseline[match_id])), 2)
#> before  after
#>   0.93   0.04
```

Matching pulls the estimate from **52.1 m** back to **27.0 m**, within a whisker of the true 25. And the diagnostic confirms *why* it worked: baseline fitness went from a severe imbalance (SMD **0.93**) to essentially balanced (SMD **0.04**). The comparison is now fair on the thing that was fooling us.

=== step === quiz
::eyebrow Check yourself
## Reading the balance number

After matching, the standardized mean difference on baseline fitness fell from 0.93 to 0.04. What can you legitimately conclude?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The matched estimate is now guaranteed to be unbiased ::no Balance on baseline only removes the bias from baseline. If some *other* confounder you never measured (say, genetic risk) still differs between the groups, the estimate can remain biased. Balance is necessary, not sufficient.
- Baseline fitness is now well balanced between the groups, so it can no longer explain the outcome gap, though only for the covariates you actually measured ::ok Right. SMD 0.04 means the groups are matched on baseline, so it is no longer confounding the comparison. But matching can only balance what you measured; unmeasured confounders are untouched.
- Balance near zero means the two groups are identical, so rehab must have no effect ::no Balance is on the *confounders*, not the *outcome*. The groups being comparable is exactly what lets the remaining outcome difference (27 m) be read as rehab's effect, not evidence of no effect.

=== step === concept
::eyebrow The honest limits
## What matching cannot do

Matching bought us a fair comparison on baseline fitness. It is not a truth machine, and two assumptions do the heavy lifting.

[WARNING]
Matching only balances confounders you **measured**. It leans on **no unmeasured confounding** (also called ignorability): the assumption that, once you match on the recorded covariates, treated and control patients are comparable. If motivated patients enroll for reasons you never wrote down, that imbalance survives matching and quietly biases the result. There is no statistical test for it; it is an argument you must make from domain knowledge.

The second assumption is **overlap** (positivity): every kind of patient must have some real chance of being in either group. A treated patient whose propensity score is 0.99, with no control anywhere near, has no honest match, and forcing one invents a comparison the data cannot support. Always inspect the score distributions before trusting the estimate.

In practice you would not hand-roll the loop above. The **MatchIt** package does the propensity model, the matching, and the balance diagnostics in a couple of lines (this needs a full R install, so read it, do not run it here):

```r-static
library(MatchIt)
m <- matchit(rehab ~ baseline, data = study, method = "nearest")
summary(m)                       # standardized mean differences, before and after
matched_data <- match.data(m)    # the paired sample, ready for an outcome model
```

One more sanity check worth knowing: matching is not the only adjustment. Regressing the outcome on treatment *and* the confounder, `lm(improve ~ rehab + baseline)`, recovers a rehab coefficient of **25.6 m** here, agreeing with matching. When two different adjustments land in the same place, you can trust the answer more. When they disagree, something (often overlap or an unmeasured confounder) deserves a closer look.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Austin (2011), An Introduction to Propensity Score Methods (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3144483/) - the clearest applied primer; walks through matching, weighting, stratification, and adjustment.
- [Stuart (2010), Matching Methods for Causal Inference: A Review](https://doi.org/10.1214/09-STS313) - the authoritative survey of where nearest-neighbour matching sits among the alternatives.
- [MatchIt: Getting Started (Ho, Imai, King and Stuart)](https://kosukeimai.github.io/MatchIt/) - the R package that runs everything in this lesson, plus balance diagnostics, in a few lines.
- [Hernan and Robins, Causal Inference: What If (free PDF)](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - the rigorous treatment of confounding, exchangeability, and positivity, the assumptions matching leans on.
- [Cunningham, Causal Inference: The Mixtape - Matching and Subclassification](https://mixtape.scunning.com/05-matching_and_subclassification) - a friendly, worked companion with code.

=== step === complete
## Lesson 1 complete

You saw a 52-metre headline dissolve into 25 metres of real effect once you stopped comparing the kind of patient who enrolls with the kind who does not. You defined a causal effect with potential outcomes, split the naive gap into the ATT plus selection bias, estimated a propensity score with `glm`, matched treated patients to their control look-alikes, and confirmed with the standardized mean difference that baseline fitness was finally balanced.

Next, Lesson 2: Inverse-Probability Weighting and Doubly-Robust estimation. Instead of discarding unmatched controls, you will *reweight* every patient by their propensity to rebuild a pseudo-randomized sample, meet the overlap requirement in a sharper form, and learn the doubly-robust estimator that still works if either the propensity model or the outcome model is right, a genuine second chance at an unbiased answer.

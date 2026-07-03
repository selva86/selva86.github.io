---
title: "Causal Inference for Decisions: Quiz"
description: "A graded check on the causal inference for decisions section: matching and propensity scores, IPW and doubly-robust, difference-in-differences, staggered DiD, regression discontinuity, instrumental variables, synthetic control, uplift, double machine learning, sensitivity analysis, and mediation."
keywords: "R quiz, causal inference, propensity score, matching, IPW, doubly robust, difference-in-differences, parallel trends, staggered DiD, regression discontinuity, instrumental variables, synthetic control, uplift, double machine learning, E-value, mediation, ds-causal-decisions"
post_type: "LESSON"
curriculum_id: "6.180.12"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "12"
course_total: "12"
course_landing: "R-Causal-Decisions-Course.html"
lesson_kind: "quiz"
course_prev: "Mediation-Analysis.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built the full observational-causal toolkit: matching and propensity scores, inverse-probability weighting and doubly-robust estimation, difference-in-differences and its staggered-rollout trap, regression discontinuity, instrumental variables, synthetic control, uplift modeling, double machine learning, sensitivity analysis, and mediation. Running through all of them is one discipline: state the assumption, then stress-test it. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 12
## Why a naive comparison misleads
In an observational study, people who chose a treatment are compared to those who did not, and the treated group did better. Why can this gap not be read as the causal effect?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because the sample is too small; with enough units the gap becomes the causal effect. ::no Sample size shrinks variance, not bias. A confounded gap converges to the same wrong number with more data.
- Because the naive gap equals the causal effect PLUS a selection-bias term: the two groups may differ in ways that affect the outcome even without treatment. ::ok Correct: E[Y|T=1] − E[Y|T=0] = ATT + (E[Y(0)|T=1] − E[Y(0)|T=0]). The second term is selection bias, nonzero whenever the groups would have differed untreated.
- Because randomized experiments are the only valid way to estimate any effect. ::no Observational methods (matching, IPW, DiD, IV, and more) recover effects under stated assumptions; the issue is confounding, not the impossibility of observational inference.
- Because the outcome was measured with error. ::no Measurement error is a separate problem. Even perfectly measured outcomes give a biased gap when the groups self-selected.

=== step === quiz
::eyebrow Question 2 of 12
## Propensity-score matching
You match each treated unit to a control with a similar propensity score, and the standardized mean difference on a key covariate falls from 0.9 to 0.03. What have you established?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- That covariate is now balanced between the matched groups, so it can no longer confound the comparison, but only for the covariates you actually measured. ::ok Correct: an SMD near zero means the groups are comparable on that covariate. Matching balances only what you fed the propensity model; unmeasured confounders are untouched.
- The matched estimate is now guaranteed unbiased. ::no Balance on measured covariates does not rule out an unmeasured confounder. Balance is necessary, not sufficient.
- The treatment has no effect, since the groups are now the same. ::no Balance is on the confounders, not the outcome. Comparable groups are exactly what let the remaining outcome gap be read as the effect.
- The propensity model must be a random forest for matching to work. ::no A simple logistic propensity model is standard; the estimator's validity turns on balance and overlap, not on the model class.

=== step === quiz
::eyebrow Question 3 of 12
## IPW, overlap, and double robustness
Inverse-probability weighting reweights units by 1/propensity. Which statement is correct?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- IPW needs no assumptions, since reweighting fixes any imbalance. ::no IPW still needs no-unmeasured-confounding and positivity (overlap). It fixes measured imbalance only.
- A propensity near 1 for some treated units is ideal, since the model predicts treatment well. ::no That is a positivity violation: 1/(1−p) explodes, so a few extreme weights dominate. Near-perfect prediction is a red flag, not accuracy.
- The doubly-robust (AIPW) estimator stays consistent if EITHER the propensity model or the outcome model is correct, and weights can explode when overlap is poor. ::ok Correct on both: double robustness needs only one of the two models right, and IPW's variance blows up as propensities approach 0 or 1.
- Doubly-robust estimation removes the need for overlap. ::no Positivity is still required; if some units have no chance of either arm, no estimator can compare them honestly.

=== step === quiz
::eyebrow Question 4 of 12
## Difference-in-differences
A reviewer rejects a DiD study because the treated group started at a different outcome level than the control group. Are they right?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes: DiD requires the treated and control groups to have equal outcomes before treatment. ::no The most common DiD misconception. DiD never requires equal levels; the group fixed effect absorbs a constant gap.
- No: DiD differences each group against its own baseline, so a level gap is harmless. What it requires is parallel trends: equal CHANGES absent treatment. ::ok Correct. The double difference removes each group's level. The assumption is about the counterfactual trend (slope), not the starting height.
- No, because with a large sample the level difference averages out. ::no Sample size does not cure or need to cure a level gap; DiD differences it away regardless.
- Yes, unless you add the level gap back as a covariate. ::no No such correction is needed; the level gap is irrelevant to the double difference.

=== step === quiz
::eyebrow Question 5 of 12
## Staggered adoption
Units adopt a treatment at different times, and you fit two-way fixed effects (unit + time dummies + one treatment indicator). The effect grows over time. What is the danger?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- TWFE can use already-treated units as controls for later-treated ones; when the effect is still growing, that forbidden comparison gets negative weight and biases the estimate, often downward. ::ok Correct: TWFE is a weighted average of all 2x2 DiDs, and the "late vs already-treated-early" comparison can carry negative weights. Use a group-time estimator with clean (never-treated) controls.
- Nothing: TWFE with unit and time effects is always unbiased under parallel trends. ::no Parallel trends can hold perfectly and TWFE still be biased under staggered timing with dynamic effects; that is the whole negative-weights result.
- The bias comes from too few units; more units fix it. ::no It is structural bias, not variance. More units tighten the estimate around the wrong number.
- The fix is to drop the time fixed effects. ::no Dropping time effects reintroduces confounding by common shocks; the fix is clean group-time comparisons, not fewer controls.

=== step === quiz
::eyebrow Question 6 of 12
## Regression discontinuity
A scholarship is awarded to everyone scoring at or above a cutoff. An RDD reads the effect off the jump in the outcome at the cutoff. What does that estimate, and what governs the bias-variance tradeoff?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- The average effect for all applicants, with the bandwidth controlling only precision. ::no RDD identifies a LOCAL effect at the cutoff, not the population average, and the bandwidth trades bias against variance, not just precision.
- The effect for the lowest-scoring applicants, with a wider bandwidth always safer. ::no It is the effect at the cutoff (borderline applicants), and wider is not safer: it adds bias by borrowing points where the outcome-score curve bends.
- The local effect for units right at the cutoff; a narrow bandwidth is less biased but noisier, a wide one is more precise but biased if the relationship curves. ::ok Correct: RDD gives a local average treatment effect at the threshold, and the bandwidth balances bias (wide) against variance (narrow).
- The effect is global as long as you also run a placebo test. ::no A placebo test checks validity; it does not extend an RDD's reach beyond the cutoff. The effect stays local.

=== step === quiz
::eyebrow Question 7 of 12
## Instrumental variables
An instrument recovers a causal effect despite an unmeasured confounder. A proposed instrument strongly predicts the treatment. Is that enough to make it valid?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Yes: a high first-stage F means the instrument is relevant, which is what validity requires. ::no Relevance is only one of three conditions. A strong first stage says nothing about exclusion or independence.
- No: it must also satisfy exclusion (affect the outcome only through the treatment) and independence (be unrelated to the confounder); relevance alone is not enough, and a weak instrument biases the estimate toward OLS. ::ok Correct. Validity needs relevance AND exclusion AND independence, and weak instruments (low first-stage F) pull the estimate back toward the confounded OLS.
- Yes, as long as the sample is large. ::no Sample size cannot rescue a violated exclusion or independence assumption, nor a weak first stage.
- No, because instruments only work in randomized experiments. ::no Instruments are used precisely in observational settings; the point is finding an as-good-as-random lever on the treatment.

=== step === quiz
::eyebrow Question 8 of 12
## Synthetic control
You build a synthetic control (a weighted blend of donor units) for one treated unit, but the synthetic sits a steady 4 units above the treated unit throughout the PRE-treatment period. What should you conclude?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The synthetic is a poor twin: a large pre-treatment gap means the donor pool cannot reproduce this unit, so no post-treatment gap can be read as an effect. ::ok Correct. A near-zero pre-period gap is the license to interpret the post-period gap. A large pre-gap voids the comparison; report the poor fit and stop, or find better donors.
- Subtract the 4-unit pre-gap from the post-gap, difference-in-differences style. ::no That assumes the gap is a stable, parallel offset. A synthetic that misses by 4 pre-policy has shown it is a bad twin; you cannot assume the miss stays constant.
- The large gap proves the effect is large. ::no A gap present before treatment cannot be an effect. It is evidence the twin is wrong.
- Add more pre-periods and the gap will vanish. ::no More pre-periods do not fix a donor pool that cannot span the treated unit; they may make the poor fit clearer.

=== step === quiz
::eyebrow Question 9 of 12
## Uplift and heterogeneous effects
A retention email lifts renewal by +0.15 on average. An uplift model finds the bottom quartile of predicted uplift has a NEGATIVE actual effect. What follows?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A positive average means every customer benefits, so email everyone. ::no An average is a blend. A positive mean is fully consistent with a subgroup being hurt ("sleeping dogs").
- Some customers are hurt by the email, so targeting the high-uplift customers and sparing the bottom captures more value than a full-list blast. ::ok Correct. Heterogeneous effects mean the average hides who is helped and who is harmed; target by predicted uplift and stop before the negatively-affected tail.
- The uplift model is broken, since a real effect cannot be negative for anyone. ::no Negative individual effects are common and real (a reminder can prompt a cancellation). The quartile check, validated by randomization, confirms it.
- Send to the bottom quartile too, since the offer is cheap. ::no Cost is not the issue: the email itself lowers their renewal, so contacting them is negative-value at any price.

=== step === quiz
::eyebrow Question 10 of 12
## Double machine learning
DML uses flexible ML for the nuisance models (propensity and outcome), with orthogonal scores and cross-fitting. Which threat does DML NOT protect against?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- A wildly nonlinear baseline outcome function g(X). ::no That is exactly what DML handles: a flexible learner bends to g's shape, and orthogonality keeps its small errors from biasing the effect.
- The nuisance models overfitting the rows they are scored on. ::no Cross-fitting handles this: every residual comes from a model that never saw that row.
- An unmeasured confounder: a variable that drives both treatment and outcome but is not in X. ::ok Correct. DML fixes the bias ML introduces (regularization and overfitting), not the bias from a confounder you never measured. No-unmeasured-confounding and overlap are assumptions DML inherits.
- Slightly-wrong nuisance estimates. ::no Neyman orthogonality makes the score first-order insensitive to small nuisance errors; that is one of DML's central guarantees.

=== step === quiz
::eyebrow Question 11 of 12
## Sensitivity analysis
An observational study reports an E-value of 2.5 for its lower confidence limit. What does that number mean?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- An unmeasured confounder would need an association of at least 2.5 (on the risk-ratio scale) with BOTH the treatment and the outcome to explain the result away; whether such a confounder exists is a separate, judgment call. ::ok Correct. The E-value quantifies how strong confounding would have to be, judged against the strength of the confounders you did measure. It never proves the effect is causal.
- The effect is 2.5 times larger than a null effect, so it is significant. ::no The E-value is not an effect size or a significance measure; it is the minimum confounding strength needed to nullify the result.
- A confounder of any strength above 1 would overturn the result. ::no A weak confounder (near 1 on either arm) cannot; it would take one reaching 2.5 on BOTH arms.
- E-values above 2 prove the absence of confounding. ::no No E-value proves confounding is absent. It only describes how much would be required to matter.

=== step === quiz
::eyebrow Question 12 of 12
## Mediation
A perfectly randomized A/B test estimates the indirect effect of a treatment through a mediator (treatment to mediator to outcome). Is the indirect effect causally valid because the treatment was randomized?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Yes: randomization removes all confounding in the study, including for the mediator. ::no Randomization breaks confounding only for the randomized variable (the treatment). The mediator was observed, not assigned.
- No: randomizing the treatment does not randomize the mediator, so a hidden trait driving both the mediator and the outcome still biases the mediator-to-outcome step; mediation needs sequential ignorability, an extra untestable assumption. ::ok Correct. The mediator-outcome relationship can be confounded even in a flawless A/B test, which is why mediation rests on stronger assumptions than the treatment effect alone.
- Yes, provided the indirect effect is statistically significant. ::no Significance controls variance, not bias. A hidden mediator-outcome confounder biases the indirect effect at any sample size.
- No, because indirect effects can never be estimated. ::no They can be estimated (product method, bootstrap CI); they simply require sequential ignorability to be causal.

=== step === concept
::eyebrow Run it: inverse-probability weighting
## Undo confounding by reweighting
Treatment here is confounded by `x`, which drives both who is treated and the outcome. The naive gap is biased; weighting each unit by 1 over the probability of the treatment it received rebuilds a balanced pseudo-population and recovers the true effect of 3.

```r
set.seed(1)
n <- 2000
x <- rnorm(n)
treat <- rbinom(n, 1, plogis(0.7 * x))     # confounded assignment
y <- 3 * treat + 2 * x + rnorm(n)           # true effect = 3
naive <- mean(y[treat == 1]) - mean(y[treat == 0])
ps <- glm(treat ~ x, binomial)$fitted.values
w  <- ifelse(treat == 1, 1 / ps, 1 / (1 - ps))
ipw <- weighted.mean(y[treat == 1], w[treat == 1]) -
       weighted.mean(y[treat == 0], w[treat == 0])
round(c(true = 3, naive = naive, ipw = ipw), 2)
#>  true naive   ipw
#>  3.00  4.37  3.09
```

The naive gap of 4.37 is inflated by confounding; inverse-probability weighting pulls it back to 3.09, essentially the true 3, using only the measured covariate `x`.

=== step === concept
::eyebrow Run it: difference-in-differences
## Cancel confounding with a double difference
Two groups, two periods. The treated group starts at a lower level (a harmless level gap) and a common time trend lifts everyone. A naive after-comparison is biased; the difference-in-differences, read as the `treat:post` interaction, recovers the true effect of 5.

```r
set.seed(2)
m <- 500
d <- expand.grid(unit = 1:m, post = 0:1)
d$treat <- as.integer(d$unit > m / 2)
base <- ifelse(d$treat == 1, 18, 22)        # treated start lower
d$y <- base + 4 * d$post + 5 * (d$treat * d$post) + rnorm(nrow(d), 0, 4)  # trend +4, effect +5
cell <- tapply(d$y, list(treat = d$treat, post = d$post), mean)
did  <- (cell["1","1"] - cell["1","0"]) - (cell["0","1"] - cell["0","0"])
round(c(true = 5,
        naive_post = cell["1","1"] - cell["0","1"],
        did = unname(did),
        lm_interaction = unname(coef(lm(y ~ treat * post, d))["treat:post"])), 2)
#>           true     naive_post            did lm_interaction
#>           5.00           0.43           4.23           4.23
```

The naive after-only comparison (0.43) is wrecked by the level gap; the double difference recovers 4.23, near the true 5, and `lm(y ~ treat*post)` returns the identical number as its interaction coefficient.

=== step === complete
## Section complete
Strong work. You can now run the full observational-causal playbook: recover an effect from confounded data by matching or weighting, add a doubly-robust safety net, difference away unmeasured confounders with difference-in-differences (and avoid the staggered-rollout trap), read an effect off a cutoff or an instrument, build a synthetic control when only one unit was treated, open up an average into per-unit uplift, use machine learning for the nuisances without biasing the effect, and, above all, stress-test the assumption every one of these rests on. State the assumption, then measure how much your conclusion depends on it: that discipline is what separates a defensible causal claim from a correlation in disguise.

---
title: "Survival Analysis: Quiz"
description: "A graded check on the survival analysis section: censoring, Kaplan-Meier and the log-rank test, Cox proportional hazards, checking PH, parametric/AFT models, competing risks, and survival model evaluation."
keywords: "R quiz, survival analysis, censoring, Kaplan-Meier, log-rank, Cox proportional hazards, hazard ratio, competing risks, cumulative incidence, C-index, Brier score, ds-survival"
post_type: "LESSON"
curriculum_id: "6.150.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "8"
course_total: "8"
course_landing: "R-Survival-Analysis-Course.html"
lesson_kind: "quiz"
course_prev: "Survival-ML-and-Evaluation.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have worked through time-to-event analysis end to end: what censoring really means, the Kaplan-Meier curve and the log-rank test, the Cox model and its hazard ratio, checking the proportional-hazards assumption, committing to a parametric shape, handling competing risks with cumulative incidence, and scoring a survival model honestly. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## What a censored row means
A patient enrolls, attends every visit, and is still alive when the study closes at 18 months. Their row reads `time = 18, status = 0`. What does it tell you about their survival time?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Only that their true survival time is longer than 18 months: the 18 is a floor, not a death time. ::ok Correct: right-censoring means the event had not happened by last contact, so all you know is T > 18. That "at least" is real, usable information.
- Their survival time is exactly 18 months, so you can treat 18 as a death time. ::no That invents a death that never happened and biases survival downward; it is the mistake survival methods exist to avoid.
- Their outcome is missing, so the row should be dropped. ::no Censored is not missing. Dropping survivors keeps mostly early deaths and biases every estimate low.
- Nothing, because you never saw the event. ::no You saw that they survived at least 18 months, which constrains the estimate; that is exactly what Kaplan-Meier uses.

=== step === quiz
::eyebrow Question 2 of 10
## The survival function and the hazard
S(t) is the survival function and h(t) is the hazard. Which pair of statements is correct?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- S(t) is the probability of the event by time t; h(t) is a probability between 0 and 1. ::no S(t) is the probability of surviving PAST t (not the event by t), and the hazard is a rate, which can exceed 1.
- S(t) = P(T > t) is the probability of surviving past t; h(t) is the instantaneous event rate among those still at risk, and can exceed 1. ::ok Correct: S(t) is a probability that starts at 1 and never rises; the hazard is a rate per unit time (a speedometer for risk), not a probability.
- S(t) and h(t) are the same quantity on different scales. ::no They are linked but distinct: S(t) = exp(-integral of h). One is a probability, the other a rate.
- The median survival is where the hazard equals 0.5. ::no The median is where S(t) crosses 0.5, not where the hazard hits any particular value.

=== step === quiz
::eyebrow Question 3 of 10
## Reading a Kaplan-Meier curve
On a Kaplan-Meier curve you see a vertical tick where the curve stays perfectly flat. What does that tick represent?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A censored patient, last seen alive, who then leaves the at-risk set without the curve dropping. ::ok Correct: a death makes the curve step down; a tick with no drop is a censoring. The patient holds the curve up while observed, then exits the risk pool.
- A death, which is why the curve is marked at that time. ::no A death is a step DOWN, not a flat tick. The flat curve across the mark means nobody died there.
- A time point where no data was collected. ::no The tick is real data: a patient known alive at that time who then left follow-up.
- A confidence-interval boundary. ::no Ticks mark censoring events, not interval boundaries.

=== step === quiz
::eyebrow Question 4 of 10
## What the log-rank test says
A log-rank test comparing two treatment arms returns p = 0.02. Which reading is correct?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- There is a 2% chance the two arms are truly identical. ::no The p-value is the probability of a gap this large IF the arms were identical, not the probability that they are.
- The new arm extends median survival by a significant amount, and the test reports that amount. ::no The log-rank test reports no effect size at all; it only asks whether the whole curves differ. Medians come from survfit, not the test.
- If the arms were truly identical, a difference this large would arise only about 2% of the time, so there is good evidence they differ. ::ok Correct: that is what a log-rank p-value means, evidence against the null of identical survival, with the size of the effect left to a model like Cox.
- A p above 0.05 would prove the two arms are equally effective. ::no A non-significant test never proves equality; it just fails to detect a difference.

=== step === quiz
::eyebrow Question 5 of 10
## What a hazard ratio means
A Cox model reports a hazard ratio of 0.35 for a new drug versus standard care. Which statement is correct?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A new-drug patient has a 35% chance of dying during the study. ::no A hazard ratio is not a probability; it rescales the risk RATE, not a chance of an event.
- At any given moment, a new-drug patient's instantaneous risk of dying is about a third of a standard-drug patient's. ::ok Correct: the hazard ratio multiplies the instantaneous risk. 0.35 means roughly a third of the baseline hazard at every time, which pushes the survival curve up.
- New-drug patients survive about 35% as long. ::no That reads the HR as a ratio of survival times; it is a ratio of hazards. Here the new arm actually survives longer.
- The drug fails 0.35 times as often per patient, a probability. ::no HR is a rate multiplier, not a per-patient probability of failure.

=== step === quiz
::eyebrow Question 6 of 10
## The proportional-hazards assumption
A single Cox hazard ratio summarizes a two-year trial in one number. What does the proportional-hazards assumption commit you to, and how would you check it?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- That the ratio of the two hazards stays constant over all follow-up (the curves never cross); check it with Schoenfeld residuals via `cox.zph`. ::ok Correct: proportional hazards means one fixed multiplier for the whole period. A trend in the Schoenfeld residuals (small `cox.zph` p) flags a violation, where the effect drifts over time.
- That the survival difference in months is the same at every time; check it with a t-test. ::no PH fixes the ratio of hazards, not the difference in survival times, and it is checked with `cox.zph`, not a t-test.
- That age has a linear effect on survival time; check it with a residual histogram. ::no PH is about the hazard ratio being constant over time, unrelated to how age maps to survival time.
- Nothing testable: a hazard ratio is always valid. ::no If the hazards cross, one constant ratio is a fiction; that is exactly why you test the assumption.

=== step === quiz
::eyebrow Question 7 of 10
## Parametric and AFT models
You fit a Weibull `survreg` model and its accelerated-failure-time coefficient exponentiates to a time ratio of 1.6 for the new drug; Lesson 3's Cox model gave a hazard ratio of 0.36 for the same drug. A colleague says the two models disagree. What do you tell her?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- She is right: 1.6 means 60% more risk, so the models genuinely conflict. ::no `survreg` speaks TIME (a time ratio above 1 means longer survival), while a hazard ratio speaks RISK (below 1 means less risk). Both say the drug helps, in opposite dialects.
- They agree: a time ratio above 1 and a hazard ratio below 1 both mean benefit, and for a Weibull they are two readings of one model (HR = TR^(-k)). ::ok Correct: for the Weibull family the AFT and PH views are the same model. The time ratio 1.6 converts to a hazard ratio near 0.36, matching Cox; they run in opposite directions by construction.
- One of the two fits must have failed to converge. ::no Both are sound; they report the same benefit on different scales (time vs hazard).
- The parametric model is always wrong because it assumes a shape. ::no Committing to a shape is a trade-off, not an error; when the shape fits (check it against KM), the parametric model agrees with Cox and can extrapolate beyond the data.

=== step === quiz
::eyebrow Question 8 of 10
## Competing risks
In a transplant cohort you estimate the cumulative incidence of relapse by treating every death-in-remission as a censored observation and reading `1 - S_KM(t)`. Why is that relapse estimate too high?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Censoring a competing death treats that patient as if they could still relapse later, so they stay in the at-risk pool and the relapse curve is inflated; the cumulative incidence function fixes it. ::ok Correct: a death in remission ends any chance of relapse, but censoring keeps the patient eligible, so 1 - KM over-attributes relapses. Summed across causes, the naive curves can exceed 100%. The CIF weights each cause by the survivors truly at risk.
- It is correct; censoring competing events is the standard, unbiased approach. ::no That is the very move that inflates it; the bias is structural and does not vanish with more data.
- It is too high only because the sample is small. ::no The overcount is a bias present at any sample size, not sampling noise.
- The relapse hazard was computed on the wrong time scale. ::no The time scale is fine; the error is treating a competing event as censoring.

=== step === quiz
::eyebrow Question 9 of 10
## Cause-specific vs Fine-Gray
A new supportive-care protocol sharply cuts death-in-remission but does nothing to the biology of relapse (the cause-specific relapse hazard is unchanged). Compared with before, what happens to the two relapse models?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Both stay the same, since the relapse mechanism did not change. ::no Only the cause-specific model tracks the mechanism. Saving patients from competing death leaves more alive to relapse, so the cumulative incidence, and the Fine-Gray HR, must move.
- Both move together, because they estimate the same quantity. ::no They answer different questions: a rate among those at risk versus what drives cumulative incidence.
- The cause-specific relapse HR is roughly unchanged, but the relapse cumulative incidence rises and the Fine-Gray subdistribution HR shifts. ::ok Correct: the rate among those still at risk is untouched (cause-specific), but fewer competing deaths means more patients survive to relapse, raising the CIF and moving the Fine-Gray HR. Same rate, different incidence.
- Only the cause-specific HR moves; the Fine-Gray HR is unchanged. ::no It is the reverse: the cause-specific hazard is fixed by assumption; the cumulative incidence, which Fine-Gray targets, is what a change in competing mortality moves.

=== step === quiz
::eyebrow Question 10 of 10
## Scoring a survival model
Model A has the higher C-index; Model B has the lower (better) time-dependent Brier score at 24 months, both on the same held-out patients. What is the most accurate reading?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Model A is simply better, since a higher C-index always wins. ::no The C-index measures only ranking (discrimination); it says nothing about whether the predicted probabilities are numerically right.
- One of the scores must be wrong, because the better model should win both. ::no Discrimination and calibration are different properties; a model can rank well yet report probabilities that are off, and vice versa.
- Model A ranks patients better, but Model B's predicted probabilities are more accurate; which you prefer depends on whether you need ordering or trustworthy numbers. ::ok Correct: the C-index rewards getting the ORDER right; the Brier score rewards getting the NUMBERS right. They can disagree, so report both and choose by the decision at hand.
- The two measure the same thing, so the difference is rounding. ::no They measure different things: discrimination versus calibration/accuracy. Disagreement is expected.

=== step === concept
::eyebrow Run it: Kaplan-Meier and the log-rank test
## Two arms, one test
Build two arms with different survival, estimate their Kaplan-Meier medians, and test the gap with the log-rank test.

```r
library(survival)
set.seed(1)
n   <- 60
arm <- factor(rep(c("A", "B"), each = 30))
t   <- rexp(n, ifelse(arm == "B", 0.05, 0.12))   # arm B has the lower hazard (lives longer)
cen <- runif(n, 0, 30)
time   <- pmin(t, cen)
status <- as.integer(t <= cen)                    # 1 = event, 0 = censored
survfit(Surv(time, status) ~ arm)                 # median survival per arm
survdiff(Surv(time, status) ~ arm)                # the log-rank test
```

Arm B's median (about 15 months) is roughly triple arm A's (about 5), and the log-rank test returns p near 0.007: the curves genuinely differ.

=== step === concept
::eyebrow Run it: a Cox hazard ratio and its C-index
## Effect size, then how well it ranks
Fit a Cox model on a single predictor, read its hazard ratio, and score how well it ranks patients with Harrell's C-index.

```r
library(survival)
set.seed(2)
n <- 200
x <- rnorm(n)
t <- rexp(n, 0.05 * exp(0.8 * x))                 # higher x means more hazard
cen <- runif(n, 0, 40)
time   <- pmin(t, cen)
status <- as.integer(t <= cen)
cox <- coxph(Surv(time, status) ~ x)
round(exp(coef(cox)), 2)                           # hazard ratio per 1-unit x
round(concordance(cox)$concordance, 3)             # C-index: fraction of pairs ranked correctly
```

Each unit of `x` multiplies the hazard by about 2.9, and the model's C-index of about 0.75 says it orders which patient fails first correctly three times out of four.

=== step === complete
## Section complete
Strong work. You can now handle time-to-event data honestly: read a censored row as a floor, build and interpret a Kaplan-Meier curve, test two arms with the log-rank test, fit and read a Cox hazard ratio while checking its proportional-hazards assumption, commit to a parametric shape when you need smooth curves or extrapolation, count competing events with the cumulative incidence function and choose between cause-specific and Fine-Gray models, and score any survival model with discrimination and calibration. Every model you fit from here, you can defend with a number.

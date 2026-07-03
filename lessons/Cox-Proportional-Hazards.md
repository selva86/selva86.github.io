---
title: "Survival Analysis Lesson 3: Cox Proportional Hazards"
catalog_blurb: "Estimate how much each factor multiplies the risk, adjusting for the others."
description: "Fit the Cox proportional hazards model in R: read the hazard ratio from coxph output, see how the partial likelihood skips the baseline hazard, and adjust for age."
keywords: "Cox proportional hazards, hazard ratio, coxph, partial likelihood, survival analysis in R, semiparametric model, proportional hazards assumption, adjusted hazard ratio, coxph output"
post_type: "LESSON"
curriculum_id: "6.150.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "3"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Checking-Proportional-Hazards.html"
course_prev: "Kaplan-Meier-and-the-Log-Rank-Test.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Cox Proportional Hazards

In Lesson 2 the log-rank test looked at Dr. Rao's two survival curves and returned p = 0.02: the new drug and the standard drug genuinely differ. A real result, but a frustrating one. It never said **how much** better the new drug is, and it could not answer the first question any cardiologist asks: is the new arm really doing better, or were those patients just younger to begin with?

This lesson fixes both gaps with one model. The Cox proportional hazards model turns "the arms differ" into a single number, the **hazard ratio**, and lets you adjust that number for age, sex, or anything else you measured. Move the slider below to feel what a hazard ratio does to a survival curve.

By the end of this lesson you will be able to:

- Read a hazard ratio: say exactly what HR = 0.35 means, and what it does not mean
- Write down the Cox model, and explain why it is called "semiparametric": it never has to guess the shape of the baseline hazard
- Fit `coxph()` in R, read every column of its output, and adjust a treatment effect for a second variable like age

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (right-censoring, the `Surv()` outcome, and the hazard h(t) as the risk of the moment) and [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the at-risk set and the log-rank test). You can run R and read a coefficient table.

::widget hazard-ratio {}

=== step === concept
::eyebrow The one number
## One number for how much: the hazard ratio

Recall the hazard from Lesson 1: \(h(t)\) is the risk of the moment, the rate at which patients who have survived to month \(t\) are dying right now. Dr. Rao has one such hazard for the standard arm, \(h_{\text{std}}(t)\), and one for the new arm, \(h_{\text{new}}(t)\). The cleanest way to compare two hazards is to divide them. That ratio is the **hazard ratio**:

\[ \text{HR} = \frac{h_{\text{new}}(t)}{h_{\text{std}}(t)}. \]

Read it as a multiplier on risk. An HR of 0.35 means a new-drug patient's instantaneous risk of dying is about **a third** of a standard-drug patient's at the same moment. HR = 1 means identical risk, the drug does nothing. HR = 2 would mean the new arm dies at twice the rate, a drug that harms. So the whole verdict on a treatment collapses into one number: below 1 protective, above 1 harmful, and how far from 1 says how strong.

But look again at the definition. The ratio has a \(t\) in it, so in principle it could drift: the drug might help a lot early and little later. The Cox model makes one clean assumption to avoid that mess, called **proportional hazards**: the ratio is the same at every time \(t\). One drug's hazard is a fixed multiple of the other's, forever. Toggle the hazard ratio below and watch what that buys you.

::widget hazard-ratio {}

The dashed grey line is the baseline arm. When you set HR below 1 the solid curve lifts **above** it (lower risk, longer survival); above 1 it drops **below** (higher risk). The one thing the curves never do is cross. That single unmoving gap is the proportional-hazards assumption made visible, and it is exactly what lets a whole survival comparison ride on one number.

[KEY INSIGHT]
A hazard ratio is a ratio of rates, not a probability and not a survival time. HR = 0.35 does not mean "a 35% chance of dying" and it does not mean "survives 35% as long." It means the risk of dying in any given instant is scaled to 0.35 of the baseline. Everything else, the survival curve, the median, follows from that scaling.

=== step === concept
::eyebrow The model
## The Cox model, written down

Sir David Cox's 1972 model writes one patient's hazard as a shared baseline curve times a personal multiplier built from their covariates \(x_1, \dots, x_p\) (arm, age, and so on):

\[ h(t \mid x) = h_0(t)\,\exp\!\left(\beta_1 x_1 + \beta_2 x_2 + \cdots + \beta_p x_p\right). \]

Take it one piece at a time. \(h_0(t)\), the **baseline hazard**, is the risk-of-the-moment curve for a reference patient whose covariates are all zero; it can be any shape at all and carries everything about how risk changes with time. The exponential term is the patient's personal multiplier: the \(\beta_k\) are the coefficients the model learns, and \(x_k\) are that patient's values. Because everyone shares the same \(h_0(t)\), the ratio of any two patients' hazards is just the ratio of their multipliers, and the baseline cancels clean out. That is why the model is "proportional": the time part is common to all, so only the constant multiplier separates people.

The coefficients read as hazard ratios directly. Raise one covariate \(x_k\) by a single unit and the hazard is multiplied by \(\exp(\beta_k)\), so

\[ \text{HR for } x_k = \exp(\beta_k). \]

A positive \(\beta_k\) gives an HR above 1 (that variable raises risk); a negative \(\beta_k\) gives an HR below 1 (protective); \(\beta_k = 0\) gives HR = 1 (no effect). This is why every `coxph` printout hands you both `coef` (that is \(\beta_k\)) and `exp(coef)` (that is the HR) side by side.

[KEY INSIGHT]
Here is the trick that makes Cox the workhorse of survival analysis. It never estimates \(h_0(t)\). In Lesson 1 we had to assume a constant hazard to draw a survival curve; guess that shape wrong and every number inherits the error. Cox refuses to guess. It leaves \(h_0(t)\) completely unspecified and still recovers all the \(\beta\) coefficients. A model that fixes the covariate part with a formula but leaves the time part shape-free is called **semiparametric**. The next step shows the sleight of hand that pulls it off.

=== step === concept
::eyebrow The estimation trick
## How Cox fits without the baseline: the partial likelihood

How can you estimate the \(\beta\) coefficients without ever knowing \(h_0(t)\)? Cox's answer reuses the exact at-risk bookkeeping you built in Lesson 2. Walk forward in time and stop at each moment a death happens. At that instant there is a set of patients still at risk (alive and uncensored). Ask one question: **given that one of these at-risk patients just died, what is the probability it was this particular one?**

Under the model, a patient's share of the risk is proportional to their multiplier \(\exp(\beta' x)\), where \(\beta' x\) is just shorthand for the full sum \(\beta_1 x_1 + \cdots + \beta_p x_p\) from the last step. So if patient \(i\) is the one who died at time \(t_i\), the probability it was them rather than anyone else in the at-risk set \(R(t_i)\) is

\[ L_i(\beta) = \frac{\exp(\beta' x_i)}{\displaystyle\sum_{j \in R(t_i)} \exp(\beta' x_j)}. \]

Look at what vanished. The baseline hazard \(h_0(t_i)\) multiplies every hazard in that fraction, top and bottom, so it cancels. The time shape is gone; only the covariate multipliers remain. Multiply these fractions across every death time and you get the **partial likelihood**, and the \(\beta\) that makes it largest is the estimate \(\hat\beta\). "Partial" because it throws away the exact timing of deaths and keeps only their *order*, which is all it needs.

Make it concrete. Suppose three patients are at risk when one dies, aged 75, 65, and 55, and the fitted age effect is \(\beta = 0.125\) per year (the real value you will fit in two steps). Each patient's risk score is \(\exp(0.125 \times (\text{age} - 65))\):

```r
# Three patients at risk when one dies; risk score uses the fitted age effect.
age_at_risk <- c(75, 65, 55)
eta   <- 0.125 * (age_at_risk - 65)      # log-hazard relative to a 65-year-old
share <- exp(eta) / sum(exp(eta))        # chance the death was each of them
round(rbind(age = age_at_risk, risk_score = exp(eta), share = share), 2)
#>              [,1]  [,2]  [,3]
#> age        75.00 65.00 55.00
#> risk_score  3.49  1.00  0.29
#> share       0.73  0.21  0.06
```

The 75-year-old carries 73% of the risk in this little set, so if they are the one who died, the model is happy and the fraction is large. Fitting slides \(\beta\) up or down to make the patients who actually died look like the high-risk ones. That is all `coxph` is doing under the hood.

=== step === concept
::eyebrow In R
## Fit it in R: coxph on one predictor

Time to fit the real thing. Each lesson runs in a fresh R session, so we rebuild Dr. Rao's trial first, now with an `age` column alongside the arm and outcome. Then `coxph()` fits the model with the same `Surv(time, status) ~ predictors` formula you already know:

```r
library(survival)

# Dr. Rao's 30 patients: months = follow-up, status = 1 died / 0 censored.
std_months <- c(2.7, 3.2, 4.5, 5.5, 6.1, 7.0, 8.3, 9.4, 11.5, 12.6, 13.5, 15.8, 18.0, 24.0, 24.0)
std_status <- c(1,   1,   1,   1,   1,   1,   1,   0,   1,    1,    1,    1,    0,    0,    0)
std_age    <- c(67,  71,  69,  74,  66,  75,  65,  65,  71,   63,   66,   55,   62,   61,   56)
new_months <- c(9.0, 24.0, 19.2, 24.0, 13.0, 22.5, 24.0, 16.4, 24.0, 20.8, 15.0, 24.0, 18.0, 21.0, 23.0)
new_status <- c(1,   0,    1,    0,    1,    1,    0,    1,    0,    1,    0,    0,    1,    1,    1)
new_age    <- c(57,  63,   68,   53,   58,   63,   69,   62,   55,   63,   68,   59,   60,   57,   57)

trial <- data.frame(
  months = c(std_months, new_months),
  status = c(std_status, new_status),
  arm    = factor(rep(c("standard", "new"), each = 15), levels = c("standard", "new")),
  age    = c(std_age, new_age)
)

cox_arm <- coxph(Surv(months, status) ~ arm, data = trial)
summary(cox_arm)
#>           coef exp(coef) se(coef)     z Pr(>|z|)
#> armnew -1.0370    0.3545   0.4629 -2.24   0.0251 *
#>
#>        exp(coef) exp(-coef) lower .95 upper .95
#> armnew    0.3545      2.821    0.1431    0.8784
#>
#> Concordance= 0.677
#> Score (logrank) test = 5.41  on 1 df,   p=0.02
```

Read the printout column by column, because every survival paper you ever open reports exactly these:

- `coef` is \(\hat\beta = -1.04\). It is negative, so being in the new arm lowers the hazard. On its own the raw coefficient is hard to feel, which is why the next column exists.
- `exp(coef)` is the **hazard ratio, 0.35**. New-drug patients face about a third of the standard arm's risk at any moment. The mirror column `exp(-coef) = 2.82` says the same thing flipped: the standard arm dies at 2.8 times the new arm's rate.
- `lower .95` and `upper .95` give the 95% confidence interval for the HR, **0.14 to 0.88**. It sits entirely below 1, so the protective effect is statistically clear, and `Pr(>|z|) = 0.025` is the matching p-value. It comes from `z`, which is just `coef` divided by its standard error `se(coef)`: the same coefficient-over-uncertainty test you would run on any regression.
- `Concordance = 0.68` is the share of patient pairs the model ranks correctly (the higher-risk patient dies first); 0.5 is a coin flip, so 0.68 is modest, honest discrimination.

[KEY INSIGHT]
Look at the last line: the score test is 5.41 with p = 0.02. That is not a coincidence, it is **exactly** the log-rank chi-square from Lesson 2. A Cox model with a single two-group covariate contains the log-rank test as its score test. Cox does not replace what you learned last lesson; it swallows it whole and hands you an effect size on top.

=== step === quiz
::eyebrow Check yourself
## What does HR = 0.35 actually mean?

Dr. Rao's Cox model reports a hazard ratio of 0.35 for the new drug against the standard drug. A colleague offers four readings. Which one is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A new-drug patient has a 35% chance of dying during the trial ::no A hazard ratio is not a probability. It rescales the risk RATE, not a chance of an event. The 35% chance-of-dying reading confuses a ratio of hazards with an absolute probability, which the HR never gives.
- New-drug patients survive about 35% as long as standard-drug patients ::no That reads the HR as a ratio of survival TIMES, which it is not. It is the ratio of hazards. In fact the new arm survives LONGER (its median was 22.5 vs 11.5 months), the opposite of "35% as long."
- At any given moment, a new-drug patient's risk of dying is about a third of a standard-drug patient's ::ok Exactly. The hazard ratio scales the instantaneous risk: 0.35 means roughly a third of the baseline hazard at every time point. Lower hazard throughout is what pushes the survival curve up and the median out.
- The new drug is 0.35 times more likely to fail than the standard drug ::no "0.35 times more likely" is vague and wrong-signed. HR = 0.35 means the risk is multiplied BY 0.35 (cut to about a third), i.e. 65% lower, not 35% "more" of anything.

=== step === concept
::eyebrow The whole point
## Adjusting for age: a hazard ratio for each factor

Now answer the cardiologist's question. The new-arm patients happen to be a little younger (their mean age is 61 against the standard arm's 66), and age is itself a risk. So is the new drug's edge real, or just youth? Put both variables in the same model and Cox gives each its own hazard ratio, each already **adjusted** for the other:

```r
cox_adj <- coxph(Surv(months, status) ~ arm + age, data = trial)
summary(cox_adj)
#>            coef exp(coef) se(coef)      z Pr(>|z|)
#> armnew -1.02871   0.35747  0.48999 -2.099  0.03578 *
#> age     0.12511   1.13328  0.04582   2.730  0.00632 **
#>
#>        exp(coef) exp(-coef) lower .95 upper .95
#> armnew    0.3575     2.7974    0.1368    0.9339
#> age       1.1333     0.8824    1.0359    1.2398
```

Two hazard ratios, each holding the other variable fixed:

- **arm HR = 0.36.** Compare two patients of the *same age*, one on each drug: the new-drug patient still has about a third of the hazard. The number barely moved from the unadjusted 0.35, which is the answer Dr. Rao needed: the drug's benefit is real, not an artifact of the new arm being younger.
- **age HR = 1.13 per year.** Compare two patients on the *same drug* one year apart in age: the older one has 1.13 times the hazard, a 13% higher risk for each year. Over a decade that compounds to \(1.13^{10} \approx 3.5\) times the risk. Its confidence interval (1.04 to 1.24) sits above 1, so age is a genuine, strong predictor in its own right.

This is the payoff the log-rank test could never give you. It compared two whole groups and stopped. Cox isolates the effect of each factor while the others are held constant, so you can separate the drug from the age, report a number for each, and put a confidence interval on both.

=== step === tryit
::eyebrow Your turn
## Build the adjusted model

`trial` is already in memory with `months`, `status`, `arm`, and `age`. Write the Cox model that estimates the drug effect **while adjusting for age**, so you get a hazard ratio for each. Add the second predictor to the right of the `~`.

```r
coxph(Surv(months, status) ~ arm + ____, data = trial)
```
::check {"regex":"~\\s*arm\\s*\\+\\s*age|~\\s*age\\s*\\+\\s*arm","gate":true,"difficulty":"intermediate","ok":"That is the adjusted model: arm HR 0.36 (still protective, holding age fixed) and age HR 1.13 per year. Extra predictors go on the right of the ~, separated by +.","no":"Add age as a second predictor on the right of the ~ , separated by a plus: coxph(Surv(months, status) ~ arm + age, data = trial)."}
::solution
```r
coxph(Surv(months, status) ~ arm + age, data = trial)
```

=== step === quiz
::eyebrow Check yourself
## The assumption you just relied on

Cox reported a single hazard ratio of 0.36 for the new drug across the entire two years of follow-up. What has the proportional-hazards assumption committed you to by summarizing the whole trial in that one number?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- That the new arm's survival advantage, measured in months, is the same at every time point ::no That describes a constant GAP between the curves, which proportional hazards does not claim. It fixes the RATIO of the hazards, not the difference in survival times; the month-gap between two curves under a constant HR actually changes over time.
- That the new drug's hazard stays a fixed multiple of the standard drug's at every time point, so the ratio never drifts ::ok Right. Proportional hazards means one constant multiplier for all of follow-up: the drug cannot help a lot early and little later. That is a real assumption, and Lesson 4 shows how to test whether it holds.
- That age must have a linear effect on survival time in months ::no Proportional hazards is about the hazard RATIO being constant over time, not about how age maps to survival time. Age linearity in the log-hazard is a separate modeling choice, unrelated to the PH assumption itself.
- Nothing: a hazard ratio is always valid regardless of how the two hazards behave over time ::no The single HR is only meaningful IF the hazards stay proportional. If the curves crossed, one constant ratio would be a fiction that hides the real time-varying story, which is exactly why the assumption must be checked.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [Cox (1972), Regression Models and Life-Tables, JRSS B 34:187](https://doi.org/10.1111/j.2517-6161.1972.tb00899.x) - the original paper that introduced the proportional-hazards model and the partial likelihood.
- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical R reference for `coxph`, written by the package's author, with the output columns explained.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a clear, worked treatment of the Cox model and the hazard ratio with the same notation used here.
- [Bradburn, Clark, Love and Altman (2003), Survival Analysis Part II, British Journal of Cancer 89:431](https://doi.org/10.1038/sj.bjc.6601119) - a clinician-friendly walk through multivariable Cox models and how to report and read hazard ratios.

=== step === complete
## Lesson 3 complete

You can now put one number on a treatment effect. The **hazard ratio** compares two hazards as a multiplier on risk, so HR = 0.35 for Dr. Rao's new drug means about a third of the standard arm's instantaneous risk at any moment. The **Cox model** \(h(t\mid x) = h_0(t)\exp(\beta' x)\) gives each covariate its own hazard ratio, \(\exp(\beta_k)\), while leaving the baseline hazard shape-free; the **partial likelihood** fits those coefficients using only the order of deaths, so the baseline cancels and never has to be guessed. Reading `coxph` output, you found the drug's benefit holds after adjusting for age (HR 0.36) and that age is its own strong risk factor (HR 1.13 per year), the effect-size-plus-adjustment the log-rank test never gave.

But every one of those numbers rests on one assumption you have not yet tested: that the hazard ratio really is constant over the whole two years. If the new drug's edge grows or fades with time, a single HR is a comfortable fiction. Next, Lesson 4: checking proportional hazards, where you use Schoenfeld residuals and `cox.zph` to see whether the assumption holds, spot what a violation looks like, and handle it with time-varying effects.

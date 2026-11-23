---
title: "Mixed Effects and Longitudinal Models Lesson 5: GEE or mixed model, two different questions"
slug: "GEE-or-Mixed-Model-Two-Different-Questions"
description: "A mixed model and GEE fit the same clustered binary data and report different coefficients. See why both are right, and what each one actually measures."
keywords: "GEE, generalized estimating equations, subject-specific effect, population-averaged effect, mixed model in R, geeglm, cluster-robust standard error, sandwich estimator, working correlation, logistic mixed model"
mathjax: false
webr: true
post_type: "LESSON"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "5"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_prev: "Reading-Variance-Components-and-the-ICC"
course_next: "Correlated-Residuals-Inside-a-Group"
curriculum_id: "4.90.5"
lesson_access: "pro"
catalog_blurb: "Why a mixed model and GEE answer different questions on the same data."
---

=== step === cover
## GEE or mixed model, two different questions

Today let's look at two methods that fit the exact same data and are both correct, yet hand back two different numbers for the very same treatment effect.

Thirty clinics take part in a trial of a new treatment protocol. Fifteen clinics run the new protocol, and fifteen keep the standard care they have always used. Each clinic enrolls ten patients, so the trial covers three hundred patients in total. Eight weeks later, every patient's treatment either succeeded or it did not, recorded as a 1 or a 0.

Here is every one of those three hundred patients, already grouped into each clinic's own share of successes, split by arm.

::widget chart-plotter {"data": [{"x":"New protocol","y":0.9},{"x":"New protocol","y":0.1},{"x":"New protocol","y":0.9},{"x":"New protocol","y":0.8},{"x":"New protocol","y":0.6},{"x":"New protocol","y":0.5},{"x":"New protocol","y":0.8},{"x":"New protocol","y":0.2},{"x":"New protocol","y":0.9},{"x":"New protocol","y":0.5},{"x":"New protocol","y":0.9},{"x":"New protocol","y":1},{"x":"New protocol","y":0.6},{"x":"New protocol","y":0.7},{"x":"New protocol","y":0.7},{"x":"Standard care","y":0.4},{"x":"Standard care","y":0.2},{"x":"Standard care","y":0.1},{"x":"Standard care","y":0},{"x":"Standard care","y":0.9},{"x":"Standard care","y":0.5},{"x":"Standard care","y":0},{"x":"Standard care","y":0.1},{"x":"Standard care","y":0.7},{"x":"Standard care","y":0.8},{"x":"Standard care","y":0.4},{"x":"Standard care","y":0.4},{"x":"Standard care","y":0.1},{"x":"Standard care","y":0.4},{"x":"Standard care","y":0.1}], "geoms": ["point", "boxplot"], "x": "Arm", "y": "Success rate", "code": {}}

Build that same trial in R now, and reproduce this picture yourself.

```r
# Build the clinic trial and plot each clinic's own success rate by arm
set.seed(42)
n_clinics <- 30
n_patients <- 10
clinic <- factor(rep(1:n_clinics, each = n_patients))
treatment <- rep(c(1, 0), each = n_clinics / 2 * n_patients)
clinic_effect <- rnorm(n_clinics, mean = 0, sd = 1)
logit_p <- -0.5 + 1 * treatment + clinic_effect[clinic]
success <- rbinom(n_clinics * n_patients, 1, plogis(logit_p))
trial <- data.frame(clinic = clinic, treatment = treatment, success = success)

library(dplyr)
library(ggplot2)

clinic_rate <- trial %>%
  group_by(clinic, treatment) %>%
  summarise(success_rate = mean(success), .groups = "drop") %>%
  mutate(arm = ifelse(treatment == 1, "New protocol", "Standard care"))

arm_rate <- trial %>%
  group_by(treatment) %>%
  summarise(success_rate = mean(success), .groups = "drop") %>%
  mutate(arm = ifelse(treatment == 1, "New protocol", "Standard care"))

ggplot(clinic_rate, aes(x = arm, y = success_rate)) +
  geom_jitter(width = 0.1, size = 2.6, alpha = 0.7, color = "steelblue") +
  geom_point(data = arm_rate, shape = 18, size = 5, color = "firebrick") +
  labs(x = NULL, y = "Clinic's own success rate")
```

Each blue dot is one clinic's own success rate. The two red diamonds are the overall rate for each arm: 0.34 for standard care, 0.673 for the new protocol, so the new protocol does look better on average.

But look at the blue dots themselves. Among the standard-care clinics alone, one sits at a success rate of 0.0 and another at 0.9. Among the new-protocol clinics, one sits at 0.1 and another reaches 1.0. Clinics in the same arm do not land anywhere near each other, and some clinics from different arms overlap completely.

That spread, sitting right there in the plot above, is why this lesson needs two different methods instead of one.

=== step === concept
## Two questions about the same effect

When you ask how much the new protocol helps, you are actually asking one of two different questions, and they are not the same question wearing two names.

- Subject-specific: if one particular clinic's own patients switched from standard care to the new protocol, how much would that clinic's own log odds of success move?
- Population-averaged: across the whole population of clinics, some that start low and some that start high, how much higher is the overall success probability under the new protocol than under standard care?

If the two arms differed by a fixed number of percentage points, these two questions would have the same answer. They do not, because a logistic model does not work on probabilities directly. It works on log odds, and the function that turns a log odds back into a probability, `plogis()`, is curved rather than straight.

Take two toy clinics that have nothing to do with the trial above. Clinic A starts at a baseline success probability of 0.2 under standard care, and clinic B starts at 0.8. Watch what the exact same log-odds bump of 1, the size this lesson's trial was built around, does to each of their probabilities.

```r
# Give two toy clinics with different baselines the SAME log-odds bump
pA <- 0.2
pB <- 0.8
log_odds_bump <- 1

pA_new <- plogis(qlogis(pA) + log_odds_bump)
pB_new <- plogis(qlogis(pB) + log_odds_bump)

round(c(A_before = pA, A_after = pA_new, A_change = pA_new - pA), 3)
#> A_before  A_after A_change 
#>    0.200    0.405    0.205 
round(c(B_before = pB, B_after = pB_new, B_change = pB_new - pB), 3)
#> B_before  B_after B_change 
#>    0.800    0.916    0.116 
```

`qlogis()` turns a probability into a log odds, and `plogis()` turns a log odds back into a probability. Adding the bump in between is exactly what a treatment coefficient in a logistic model does to a clinic's own log odds. The same bump of 1 moves clinic A's probability up by 0.205, but moves clinic B's probability up by only 0.116, even though both clinics received the identical log-odds effect.

A clinic that starts near 0.5 has the most room for a log-odds bump to move its probability. A clinic that already starts near 0 or near 1 has less room, because a probability cannot go below 0 or above 1. Average that bump across a population of clinics sitting at all sorts of starting probabilities, as the thirty clinics in this trial do, and the average probability shift comes out smaller than the shift any single clinic gets in log odds.

That gap between a subject-specific effect and a population-averaged effect is exactly what the next two models go on to measure, on the real clinic trial.

=== step === concept
## Fitting the subject-specific model: a GLMM

The subject-specific question, how much moving one clinic's own patients onto the new protocol changes their own log odds, is exactly what a mixed logistic model answers. Fit one now on the full trial, with a random intercept for clinic.

```r
# Fit the mixed logistic model and read off the subject-specific treatment effect
library(lme4)
glmm_fit <- glmer(success ~ treatment + (1 | clinic), data = trial, family = binomial)

fixef(glmm_fit)
#> (Intercept)   treatment 
#>  -0.8913038   1.8099390 

round(sqrt(diag(vcov(glmm_fit))), 3)
#> (Intercept)   treatment 
#>       0.391       0.553 

VarCorr(glmm_fit)
#>  Groups Name        Std.Dev.
#>  clinic (Intercept) 1.2713  

exp(fixef(glmm_fit)["treatment"])
#> treatment 
#>  6.110075 
```

The treatment coefficient is 1.810, with a standard error of 0.553. That coefficient is a log odds ratio, subject-specific by construction: it says how much a single clinic's own log odds of success move when that clinic switches from standard care to the new protocol, holding that clinic's own baseline fixed. Exponentiate it, and the new protocol multiplies a clinic's own odds of success by about 6.11.

The `(1 | clinic)` term is the random intercept, one adjustment per clinic, and its standard deviation, 1.271, is the GLMM's own measure of how much the thirty clinics' baseline log odds genuinely differ from each other, on top of the treatment effect. Hold on to that number. GEE, the method this lesson is building toward, will never produce it.

=== step === widget
## How much should a clinic's own rate be trusted?

That clinic standard deviation of 1.271 is not just a number to report. It controls how much the mixed model trusts any one clinic's own raw rate against the shared pattern across all thirty clinics, an idea called partial pooling.

This widget swaps in its own eight clinics, each measuring a different, continuous outcome rather than a yes-or-no success, so its numbers will not match the trial above. But the pooling behavior is exactly the one the random intercept you just fit was doing to all thirty clinics at once.

::widget shrinkage-pool {}

Slide the dial from "no pooling" toward "complete pooling" and watch clinic E, which has only 2 patients, get pulled 12.8 points toward the grand mean, while clinic D, which has 40 patients, barely moves, pulled by only 0.2. A clinic with just 2 patients is almost pure guesswork on its own, so the model leans hard on everything else it knows about the other clinics. A clinic with 40 patients already has a fairly reliable number of its own, so there is little left to correct.

That is partial pooling, and it is exactly what the `(1 | clinic)` random intercept did to every one of the trial's thirty clinics: pulling each one's own rate toward the shared pattern by an amount that depends on how much evidence that particular clinic actually has.

=== step === concept
## Building the population-averaged estimate without a package

[NOTE]
geepack, the package built specifically for GEE, is not yet available to run in this browser. Everything below that calls it directly is shown as real output from a local R session, labelled to run on your own machine.

The population-averaged question, how much higher the overall success probability is across the whole population of clinics, is what GEE answers, and under the simplest working correlation, independence, you do not even need the geepack package to get GEE's own answer. GEE's estimating equations under independence work out to be exactly a plain logistic regression that ignores clinic altogether, confirmed against a real local `geeglm()` call. Fit that pooled model on the same three hundred rows now.

```r
# Fit the pooled logistic regression, ignoring which clinic each patient came from
pooled_fit <- glm(success ~ treatment, data = trial, family = binomial)

coef(pooled_fit)
#> (Intercept)   treatment 
#>  -0.6632942   1.3865944 

round(summary(pooled_fit)$coefficients[, "Std. Error"], 3)
#> (Intercept)   treatment 
#>       0.172       0.245 

exp(coef(pooled_fit)["treatment"])
#> treatment 
#>    4.0012 
```

The treatment coefficient here is 1.387, exponentiating to an odds ratio of 4.00. Put it beside the mixed model's 1.810 and 6.11 from a moment ago. Same three hundred rows, same treatment, two different coefficients.

Neither one is a mistake. The mixed model's 1.810 is subject-specific, the pooled model's 1.387 is population-averaged, and the gap between them is exactly the curved-link gap the two toy clinics showed earlier in this lesson.

=== step === quiz
## Quick check: why two numbers from the same 300 rows

A different clustered trial fits the same binary outcome two ways on its own data: a GLMM returns a log odds ratio of 2.10, and a pooled regression with a GEE-style robust standard error returns a log odds ratio of 1.55. Which statement reads that correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Both numbers are valid. They differ because the logistic link is curved, so a subject-specific effect and a population-averaged effect are genuinely different quantities, not because either model is wrong. ::ok Right. A GLMM's coefficient and a pooled or GEE coefficient answer two different questions about the same treatment, and a curved link lets both answers be true at once.
- One of the two numbers must be wrong, because the same data cannot hold two different real effects. ::no
- With enough data, the two numbers would eventually converge to the same value. ::no Neither number is wrong, and more data will not make them agree. A GLMM's coefficient answers how much the log odds move for one group's own members, while a pooled or GEE coefficient answers how much the overall probability moves across the whole population of groups. For a straight-line link these would be the same question, but the logistic link is curved, so they stay two different, equally real numbers no matter how much data you collect.

=== step === concept
## Correcting the standard error for clustering

The pooled model's standard error of 0.245 came from treating all three hundred rows as independent, but they are not: patients at the same clinic share more with each other than patients at different clinics do. Correct it with a cluster-robust sandwich estimator, the same move you would reach for even without a GEE package at all.

```r
# Correct the pooled model's standard error for clustering by clinic
library(sandwich)
library(lmtest)

coeftest(pooled_fit, vcov = vcovCL(pooled_fit, cluster = trial$clinic))
#>
#> z test of coefficients:
#>
#>             Estimate Std. Error z value Pr(>|z|)   
#> (Intercept) -0.66329    0.32768 -2.0242 0.042949 * 
#> treatment    1.38659    0.44665  3.1045 0.001906 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The coefficient, 1.387, has not moved. Only the standard error has, from a naive 0.245 to a cluster-robust 0.447, almost twice as large, because the naive version was overstating how much independent information three hundred clustered rows actually carry.

Here is the real GEE package confirming the same thing two different ways.

```r-static
# Run this locally: geeglm() under independence matches the pooled fit exactly
library(geepack)

gee_indep <- geeglm(success ~ treatment, id = clinic, data = trial,
                     family = binomial, corstr = "independence")
summary(gee_indep)$coefficients
#>              Estimate   Std.err     Wald    Pr(>|W|)
#> (Intercept) -0.6632942 0.3221733 4.238706 0.039512265
#> treatment    1.3865944 0.4391389 9.970000 0.001591115

gee_exch <- geeglm(success ~ treatment, id = clinic, data = trial,
                    family = binomial, corstr = "exchangeable")
summary(gee_exch)$coefficients
#>              Estimate   Std.err     Wald    Pr(>|W|)
#> (Intercept) -0.6632942 0.3221733 4.238706 0.039512265
#> treatment    1.3865944 0.4391389 9.970000 0.001591115
summary(gee_exch)$corr
#>       Estimate    Std.err
#> alpha 0.2462071 0.07689892
```

Under independence, `geeglm()` returns the exact coefficient, 1.387, that the plain `glm()` gave you, with a standard error of 0.439, matching your hand-built sandwich correction almost exactly. Ask for exchangeable instead, GEE's guess that any two patients at the same clinic correlate equally no matter which two you pick, and `geeglm()` estimates that correlation at 0.246 but returns the identical coefficient and standard error.

The working correlation was only ever a guess about the correlation structure used to weight the estimating equations. GEE's coefficient and its corrected standard error stay trustworthy even when that guess is not exactly right, which is the whole reason practitioners reach for GEE over a model that requires the correlation structure to be correct.

=== step === widget
## Four standard errors, one clustered design

The naive-to-corrected jump you just made by hand, 0.245 to 0.447, is one example of something you can now watch happen more generally. This version uses its own continuous outcome instead of a yes-or-no success, with thirty clusters of ten observations each, the same shape as the clinic trial.

::widget cluster-icc-sim {"k":30,"m":10,"tau":4,"iccMax":0.6,"levels":13,"start":6,"sims":3000,"seed":11}

It opens at an intraclass correlation of 0.30. At that setting, "Ordinary OLS" and "Robust (HC1)" both sit at about 0.11, while "Cluster-robust" and "Cluster means / mixed model" both sit at about 0.24, roughly twice as large. Drag the dial up to 0.60 and the gap widens further: the first two barely move, to about 0.12, while the last two climb to about 0.32. Drag it back toward zero and all four bars draw close together, because with little clustering left, there is little left to correct for.

That is the same split you worked out by hand a moment ago. A method that assumes independent rows, robust to unequal variance or not, understates the uncertainty once rows are clustered. Only a method that accounts for the clustering itself, whether that is a cluster-robust sandwich or a mixed model's own random intercept, reports it honestly.

=== step === quiz
## Quick check: what GEE's working correlation can and cannot do

Which model tells you how much the clinics genuinely vary from each other, and why?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The GLMM, because it is the only one of the two that estimates a variance component for the clinic random intercept. ::ok Right. The GLMM's clinic standard deviation, 1.271, is a genuine variance component. GEE's working correlation is a different kind of number entirely, and it never estimates how much the clinics vary.
- GEE, because its working correlation estimate of 0.246 already is the between-clinic variance. ::no
- Neither model gives you that number; a third model would be needed. ::no The GLMM already gives you that number: its clinic standard deviation, 1.271, is a genuine variance component, estimated from how far the clinics' own intercepts spread around the population intercept. GEE's alpha, 0.246, is a correlation parameter inside its working correlation matrix, a bookkeeping device for weighting the estimating equations correctly. It is not a variance, and it does not even need to be right for GEE's coefficient to stay valid, which is exactly GEE's main attraction.

=== step === tryit
## Your turn: find the population-averaged effect for a new clustered trial

A call centre chain tests a new sales script. Ten call centres try the new script, and ten keep the standard one, each with eight agents, a hundred and sixty agent-shifts in total. The outcome is whether a call converted to a sale, yes or no.

Build that trial, and fit the subject-specific model the same way you just did for the clinics.

```r
# Build the call-centre trial and fit the subject-specific (GLMM) model
set.seed(99)
n_center <- 20
n_agents <- 8
center <- factor(rep(1:n_center, each = n_agents))
script <- rep(c(1, 0), each = n_center / 2 * n_agents)
center_effect <- rnorm(n_center, mean = 0, sd = 0.8)
logit_p2 <- -0.3 + 0.9 * script + center_effect[center]
converted <- rbinom(n_center * n_agents, 1, plogis(logit_p2))
calls <- data.frame(center = center, script = script, converted = converted)

library(lme4)
glmm_calls <- glmer(converted ~ script + (1 | center), data = calls, family = binomial)

fixef(glmm_calls)
#> (Intercept)      script 
#>  -0.7669754   1.0121002 

exp(fixef(glmm_calls)["script"])
#>   script 
#> 2.751373 
```

That is the subject-specific answer: moving one centre's own agents from the standard script to the new one multiplies their own odds of a conversion by about 2.75.

Now find the population-averaged answer the same way you did for the clinics. Fit the pooled logistic regression, ignoring which centre each row came from, then correct its standard error for clustering with `vcovCL()` and `coeftest()`. Two lines.

```r
# calls still holds the 160-row trial, with center as the clustering variable
library(sandwich)
library(lmtest)
# Line 1: fit the pooled logistic regression of converted on script
# Line 2: correct its standard error for clustering and print the result
```
::check {"regex": "glm[(]\\s*converted\\s*~\\s*script[\\s\\S]*family\\s*=\\s*binomial[\\s\\S]*(?:vcovCL[(][\\s\\S]*coeftest[(]|coeftest[(][\\s\\S]*vcovCL[(])", "gate": true, "difficulty": "intermediate", "ok": "Right. The pooled coefficient comes out to 0.820, an odds ratio of 2.27, next to the GLMM's 2.75: the same subject-specific versus population-averaged gap you saw for the clinics. The naive standard error, 0.325, undersold the clustering again; vcovCL() corrects it to 0.497.", "no": "Fit the pooled model the same way as the clinic trial: glm(converted ~ script, data = calls, family = binomial). Then wrap it in coeftest(), passing vcov = vcovCL(pooled_calls, cluster = calls$center) to correct for the fact that agents share a centre."}
::solution
```r
# Pooled logistic regression, then its cluster-robust standard error
pooled_calls <- glm(converted ~ script, data = calls, family = binomial)
coeftest(pooled_calls, vcov = vcovCL(pooled_calls, cluster = calls$center))
#>
#> z test of coefficients:
#>
#>             Estimate Std. Error z value Pr(>|z|)  
#> (Intercept) -0.61904    0.41271 -1.4999  0.13363  
#> script       0.81971    0.49658  1.6507  0.09879 .
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

0.820 and 0.497. The pooled, population-averaged coefficient comes in lower than the GLMM's 1.012, exactly the attenuation the toy clinics predicted, and the naive standard error of 0.325 again understated the true uncertainty until clustering was taken into account.

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Longitudinal data analysis using generalized linear models](https://doi.org/10.1093/biomet/73.1.13) - Liang, K.Y. and Zeger, S.L. (1986), Biometrika, 73(1), 13-22. The paper that introduced GEE and the sandwich standard error corrected by hand in this lesson.
- [Models for longitudinal data: a generalized estimating equation approach](https://doi.org/10.2307/2531734) - Zeger, S.L., Liang, K.Y. and Albert, P.S. (1988), Biometrics, 44(4), 1049-1060. Extends GEE to binary outcomes like the one fitted in this lesson.
- Hardin, J.W. and Hilbe, J.M. (2012). *Generalized Estimating Equations*, 2nd edition. CRC Press. A full treatment of GEE's working correlation structures, including the independence and exchangeable structures used here.
- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01) - Bates, D., Machler, M., Bolker, B. and Walker, S. (2015), Journal of Statistical Software, 67(1). The paper behind the glmer() function used to fit this lesson's subject-specific model.
- [The R Package geepack for Generalized Estimating Equations](https://doi.org/10.18637/jss.v015.i02) - Halekoh, U., Hojsgaard, S. and Yan, J. (2006), Journal of Statistical Software, 15(2). The package behind geeglm(), the real GEE implementation this lesson checked its hand-built pooled model against.

=== step === complete
## What GEE and a mixed model each actually told you

Thirty clinics, one trial, two models, two honest numbers for the very same treatment effect.

The mixed model's coefficient, 1.810, is subject-specific: exponentiated, it says that moving one clinic's own patients onto the new protocol multiplies their odds of success by about 6.11. The pooled model's coefficient, 1.387, is population-averaged: exponentiated, it says the overall odds of success across the whole population of clinics rise by a factor of about 4.00. Both numbers are correct. They differ because the logistic link is curved, so a shift that looks identical in log odds does not look identical in probability for a clinic that starts low versus one that starts high, exactly what the two toy clinics showed near the start of this lesson.

The pooled model's naive standard error, 0.245, assumed all three hundred rows were independent, which they were not: patients at the same clinic share more with each other than patients at different clinics do. Correcting it with a sandwich estimator pushed it up to 0.447, matching a real `geeglm()` almost exactly, whichever working correlation it assumed. That is GEE's real advantage: its coefficient and its corrected standard error stay trustworthy even when its guess about the within-clinic correlation is not exactly right.

What GEE cannot give you is the one number the mixed model estimated for free: 1.271, the standard deviation of the clinics' own random intercepts, a genuine measure of how much the clinics differ from each other. If that is the number you need, the mixed model is the only one of the two that has it.

The next part of this course asks what is left inside a single clinic's own patients once that random intercept is already in the model.

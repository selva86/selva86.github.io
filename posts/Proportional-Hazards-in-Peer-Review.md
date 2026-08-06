---
title: "Proportional Hazards in Peer Review"
slug: Proportional-Hazards-in-Peer-Review
description: "A reviewer asked you to test the proportional hazards assumption in your Cox model. Check it in R with cox.zph, decide whether it matters, and word your reply."
keywords: "test the proportional hazards assumption, proportional hazards reviewer comment, cox.zph response to reviewer, proportional hazards not tested peer review, Schoenfeld residuals reviewer"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 37
auto_link_terms: proportional hazards objection|proportional hazards reviewer|cox.zph response|proportional hazards not tested|time-varying coefficient response
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">A Cox model reports one hazard ratio per predictor, and that single number is only trustworthy if the predictor's effect stays constant across the whole follow-up. That constancy is the proportional hazards assumption. When a reviewer asks you to test it, they want to know whether any of your hazard ratios are secretly the average of an effect that changed over time, and the check takes one line of R.</p>

## What the reviewer wrote

> The authors fit a Cox proportional hazards model but do not report whether the proportional hazards assumption holds. Please verify the assumption and report the diagnostics.

> The proportional hazards assumption has not been tested. Given the long follow-up, a constant hazard ratio for the treatment effect seems unlikely.

> Relatedly, several of the survival curves in Figure 2 appear to converge after the second year, which raises the question of whether the hazard ratios in Table 3 can be read as constant over the full study period.

The registers vary but the request is the same. The third one is the one to read carefully, because the reviewer has already spotted the likely violation in your own figure and is being polite about it.

## What they actually mean

The reviewer is not questioning whether your Cox model fits or whether your predictors matter. They are questioning whether it is legitimate to summarise each predictor's effect with a single hazard ratio.

A Cox model assumes that a predictor multiplies the baseline hazard by the same factor at every point in time. If a treatment helps a great deal early and less later, or if two survival curves cross, that single factor is an average across two different periods and describes neither of them well.

So the ask has three parts: run the diagnostic, report it, and if it fails, say what you did about the specific predictor that failed. It is easy to read one significant result on a control covariate as a verdict on the whole analysis, when it usually points at a single variable you can handle on its own.

## Why they are asking

When a predictor's effect changes over time, the constant hazard ratio the model prints is a weighted average of the early and late effects, weighted by when the events happened. That has two consequences.

The number can misdescribe both periods at once. A drug that halves the hazard for a year and then does nothing might be reported as a modest overall reduction that matches neither the first year nor the rest. The confidence interval and p-value attached to that averaged effect can also mislead about whether there is any effect at all, because a strong early effect and a null late effect can average out to something that looks weak.

The stakes depend on which predictor fails. When the violating predictor is the one your paper is about, the reported result is the thing in question. When it is a covariate you only adjusted for, your effect of interest can be completely untouched.

The mechanics of fitting and reading a Cox model are covered in [Survival Analysis in R](/R-Survival-Analysis-Course.html). This chapter is about the assumption test and what to say when it fails.

## How to check it

The standard test is `cox.zph` from the `survival` package, which ships with every R installation. It works from the scaled Schoenfeld residuals: for each predictor it tests whether those residuals trend against time, which is what a changing effect looks like (Grambsch and Therneau, 1994).

```r
library(survival)
fit <- coxph(Surv(time, status) ~ trt + karno + age, data = veteran)
cox.zph(fit)
#>         chisq df       p
#> trt     0.284  1 0.59439
#> karno  12.003  1 0.00053
#> age     2.100  1 0.14735
#> GLOBAL 19.102  3 0.00026
```

Each row is one predictor and the last row is a global test across all of them. A small p-value is evidence that the predictor's effect is not constant over time. Here `karno`, the Karnofsky performance score, fails hard (p = 0.00053), while treatment and age are fine, and the global test fails because of `karno` alone.

The cutoff of 0.05 is as arbitrary here as anywhere. Two things bend it. In a large sample, `cox.zph` will flag time trends far too small to change any conclusion, so a significant result in a big study needs a look at the size of the trend and not only its p-value. In a small sample it can miss a real violation. Plotting the result with `plot(cox.zph(fit))` draws the residual trend for each predictor against time, and a clear slope is more convincing evidence than the number by itself.

## What to do about it

### You are fine

Either the test passes, or the only predictor that fails is one you adjusted for rather than one you are making a claim about.

A clean pass looks like this, on a lung-cancer model with age, sex, and performance status:

```r
fit_ok <- coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)
cox.zph(fit_ok)
#>         chisq df    p
#> age     0.188  1 0.66
#> sex     2.305  1 0.13
#> ph.ecog 2.054  1 0.15
#> GLOBAL  4.464  3 0.22
```

Every predictor and the global test sit comfortably above 0.05, so there is nothing to fix. Report the global p-value and, if the reviewer named a specific predictor, its individual p-value, and state that the assumption holds.

The subtler version of fine is a single failing covariate you included only as an adjustment. If your effect of interest satisfies the assumption and a control variable does not, your headline estimate is not the thing under question, and you can say so while still handling the failing variable with one of the fixes below.

### It is fixable

The failing predictor is a nuisance covariate you adjusted for but do not need a hazard ratio for. Stratifying on it gives each of its levels its own baseline hazard, which drops the proportional hazards assumption for that variable entirely while leaving your other estimates in place.

In the veteran data, cell type violates the assumption:

```r
fit_ct <- coxph(Surv(time, status) ~ trt + age + celltype, data = veteran)
cox.zph(fit_ct)
#>           chisq df     p
#> trt       0.892  1 0.345
#> age       1.231  1 0.267
#> celltype  9.213  3 0.027
#> GLOBAL   12.598  5 0.027
```

Cell type is a categorical prognostic variable, not the treatment effect the trial is about. Stratifying on it removes the violation:

```r
fit_str <- coxph(Surv(time, status) ~ trt + age + strata(celltype), data = veteran)
cox.zph(fit_str)
#>        chisq df    p
#> trt     1.68  1 0.20
#> age     1.24  1 0.27
#> GLOBAL  3.94  2 0.14
```

The global test now passes at 0.14 and nothing individual flags. The estimates you care about barely moved:

```r
round(cbind(before = coef(fit_ct)[c("trt", "age")],
            after  = coef(fit_str)[c("trt", "age")]), 4)
#>     before  after
#> trt 0.1790 0.1592
#> age 0.0041 0.0021
```

The treatment log hazard ratio went from 0.1790 to 0.1592, a hazard ratio of 1.20 down to 1.17, and age hardly changed, so stratifying bought a valid model without disturbing the answer. The price is that you no longer get a hazard ratio for cell type, which is acceptable here because you were not reporting one.

If the failing variable is continuous, or you do want to keep its effect in the model, the other standard remedy is a time-varying coefficient, which lets the effect change across follow-up instead of forcing it flat (Therneau and Grambsch, 2000). That moves you into the next case, because a time-varying effect is worth reporting rather than hiding.

### It is a real problem

The predictor that fails is the one your paper is about, and its effect genuinely changes over time. Stratification does not help, because you cannot stratify on the variable whose hazard ratio is your result.

Karnofsky score in the veteran data is this case. The constant model reports one hazard ratio for it:

```r
round(summary(fit)$coefficients["karno", ], 4)
#>      coef exp(coef)  se(coef)         z  Pr(>|z|) 
#>   -0.0344    0.9661    0.0052   -6.5828    0.0000 
```

That reads as a 3.4% drop in hazard per Karnofsky point, held constant for the whole study. Splitting follow-up at 90 days and letting the effect differ before and after tells a different story:

```r
vet_split <- survSplit(Surv(time, status) ~ ., data = veteran, cut = 90,
                       episode = "tgroup")
fit_split <- coxph(Surv(tstart, time, status) ~ trt + age + karno:strata(tgroup),
                   data = vet_split)
round(summary(fit_split)$coefficients, 4)
#>                                 coef exp(coef) se(coef)       z Pr(>|z|)
#> trt                          -0.0054    0.9946   0.1918 -0.0284   0.9774
#> age                          -0.0056    0.9945   0.0092 -0.6035   0.5462
#> karno:strata(tgroup)tgroup=1 -0.0498    0.9514   0.0064 -7.7804   0.0000
#> karno:strata(tgroup)tgroup=2  0.0007    1.0007   0.0098  0.0665   0.9470
```

In the first 90 days each Karnofsky point cuts the hazard by about 5% (hazard ratio 0.9514, p < 0.0001). After 90 days the effect is gone (hazard ratio 1.0007, p = 0.95). The single value of 0.966 averaged a strong early effect and no late effect, and it fits neither window. The honest response is to report the two periods rather than the pooled hazard ratio, and to say in the text that performance status predicts early survival but not late survival.

This is not automatically bad news for the paper. A time-varying effect is a finding in its own right, and reporting it tends to read as more careful, not less. Reporting the single hazard ratio unchanged, after a reviewer has asked about the assumption, is the one answer that will not survive a second round, because the reviewer can run the same split you just did.

## How to word your response

### If you are fine

> The reviewer is right that we did not report a test of the proportional hazards assumption. We have now checked it using scaled Schoenfeld residuals for every covariate. The global test was not significant (p = 0.22) and no individual covariate showed a time-varying effect, so the assumption is supported and the reported hazard ratios can be interpreted as constant over follow-up. The test and its p-values now appear in the Methods and in Supplementary Table S3 (Methods, page X).

### If it was fixable

> We thank the reviewer for this point. Testing the proportional hazards assumption showed that cell type violated it (p = 0.03), while the treatment effect and age did not. Because cell type was an adjustment covariate and not a quantity of interest, we refit the model stratified by cell type, which removes the assumption for that variable. The global test is satisfied in the stratified model (p = 0.14) and the treatment hazard ratio is essentially unchanged (1.20 to 1.17). The stratified model is now the primary specification in Table 3 (Methods, page X).

### If it is a real problem

> The reviewer is correct. The proportional hazards assumption fails for performance status (p < 0.001), which is central to our analysis. On investigation the effect is strongly time-dependent: performance status reduces the hazard by roughly 5% per point in the first 90 days (HR 0.95) and has no detectable effect thereafter (HR 1.00). We have therefore replaced the single hazard ratio with time-specific estimates and revised the Results and Discussion to state that performance status predicts early rather than late survival. The time-varying model and a description of the effect now appear in Table 3 and the Results (Results, page X).

Each version reports the actual p-value and, where it matters, the actual hazard ratios. A response that says only that the assumption "was checked and holds", with no numbers, tends to come back with a request for the numbers you left out.

## Practice

A reviewer writes: *"The Cox model in Table 2 assumes proportional hazards, but this is never verified. Please test the assumption for each covariate."* Your model adjusts for age, ECOG status, and the physician's Karnofsky score, and the effect you are reporting is the sex difference in survival. You run the check:

```r
ex_fit <- coxph(Surv(time, status) ~ sex + age + ph.ecog + ph.karno, data = lung)
cox.zph(ex_fit)
```

One covariate comes back at p = 0.02. Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The physician's Karnofsky score (`ph.karno`) is the one that flags, at p = 0.02. On its own that looks like a violation, and the instinct is to worry about the whole model. That instinct is wrong here, for three reasons the rest of the output makes plain. The global test passes (p = 0.12). The covariate your paper is actually about, sex, satisfies the assumption comfortably (p = 0.19). And `ph.karno` is an adjustment covariate, not the effect you are reporting.

So this is the first outcome, not the third. You report that the global test was non-significant, that the effect of interest meets the assumption, and that the single flag is on a control variable. If you want to close the door completely, refit letting `ph.karno`'s effect vary with time and show that the sex estimate does not move: the sex hazard ratio goes from 0.564 (p = 0.0007) to 0.559 (p = 0.0006), a change of no practical consequence.

A single control-covariate flag at p = 0.02, with the global test passing and the reported effect unchanged whether or not you model its time dependence, does not undermine the sex comparison, and a reviewer will accept that stated plainly.

</details>

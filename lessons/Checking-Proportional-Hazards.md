---
title: "Survival Analysis Lesson 4: Checking Proportional Hazards"
catalog_blurb: "Check whether a hazard ratio holds over time, and fix it when it drifts."
description: "Test the proportional hazards assumption in R with cox.zph and Schoenfeld residuals: see what a violation looks like and repair a model whose effect changes over time."
keywords: "proportional hazards assumption, cox.zph, Schoenfeld residuals, checking proportional hazards in R, PH assumption test, time-varying covariates, coxph diagnostics, survival analysis in R, hazard ratio over time"
post_type: "LESSON"
curriculum_id: "6.150.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "4"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Parametric-and-AFT-Models.html"
course_prev: "Cox-Proportional-Hazards.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Checking Proportional Hazards

In Lesson 3, Dr. Rao's Cox model handed back a single, confident number: a hazard ratio of 0.36 for the new drug, holding age fixed. One number for the whole two-year trial. It is a beautifully compact summary, and it hides a promise in the fine print: that the drug's edge is exactly the same in month 1 and in month 23. The new arm cannot pull ahead early and fade late; the ratio of the two hazards must stay pinned near 0.36 the entire time.

That promise has a name, **proportional hazards**, and it is an assumption, not a fact. This lesson holds it to account.

By the end of this lesson you will be able to:

- Say exactly what the proportional-hazards assumption commits you to, and what a violation looks like
- Read a Schoenfeld residual plot and run `cox.zph()` to test the assumption, then reach an honest verdict
- Repair a model whose effect changes over time, turning one misleading hazard ratio into an early one and a late one

**Prerequisites:** [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model, the hazard ratio, and reading `coxph` output) and [Lesson 1](Survival-Data-and-Censoring.html) (the hazard h(t) and right-censoring). You can run R and read a coefficient table.

Move the slider below: under proportional hazards the two survival curves pull apart but never cross. That single unbroken gap is the promise you are about to test.

::widget hazard-ratio {}

=== step === concept
::eyebrow The promise
## The promise you have to keep

Write the assumption down so we can test it. Dr. Rao has two hazards, the risk-of-the-moment for each arm, \(h_{\text{new}}(t)\) and \(h_{\text{std}}(t)\). Proportional hazards says their ratio is a single constant, the same at every time \(t\):

\[ \frac{h_{\text{new}}(t)}{h_{\text{std}}(t)} = \text{HR} \quad\text{for every } t. \]

There is no \(t\) left on the right-hand side. The number 0.36 is meant to hold in the first week and the last month alike. On the log scale it says the gap between the two log-hazards is a flat horizontal line, \(\log h_{\text{new}}(t) - \log h_{\text{std}}(t) = \log(\text{HR})\), constant forever.

So what does a **violation** look like? It is any effect that changes with time. A drug that works wonders early and wears off. A surgery that is dangerous in the first month (the operation itself) but protective for years after. In each, the hazard ratio drifts: it might start at 0.3 and climb past 1. When that happens the two survival curves can **cross**, and no single number can honestly describe an effect that begins protective and ends harmful.

Toggle the widget: every setting pulls the solid curve away from the dashed baseline by one fixed multiple, and the curves never touch. That never-crossing picture is exactly what proportional hazards assumes. Real data does not always agree.

::widget hazard-ratio {}

[KEY INSIGHT]
Proportional hazards is a claim about time: one fixed multiplier for the entire follow-up. If the true effect grows, shrinks, or reverses as the months pass, a single hazard ratio is a comfortable fiction. Everything in this lesson is machinery for catching that fiction.

=== step === concept
::eyebrow The diagnostic
## Schoenfeld residuals: one dot per death

How do you test a promise about every instant of time? You cannot reliably eyeball two hazard curves; real data is too noisy. David Schoenfeld's 1982 trick turns the question into a scatter you *can* read.

Go back to the at-risk set from Lesson 2. At each moment a patient dies, look at the covariate you care about, say the treatment arm, and ask: given who was still at risk right then and the risk each of them carried under the model, what covariate value did we *expect* the person who died to have? The **Schoenfeld residual** is the observed value minus that risk-weighted expected value, computed at each death time \(t_i\):

\[ s_i = x_i - \bar{x}(t_i), \qquad \bar{x}(t_i) = \sum_{j \in R(t_i)} x_j\,\pi_j(t_i), \]

where \(x_i\) is the covariate of the patient who died, \(R(t_i)\) is the at-risk set, and \(\pi_j(t_i)\) is patient \(j\)'s model-given share of the risk (the same \(\exp(\beta' x_j)\) weights from the partial likelihood, rescaled to sum to one). One residual per death, one dot on a plot.

Here is the payoff. If the hazard ratio really is constant, these residuals carry **no information about time**: plotted against \(t\), they scatter in a flat, patternless band around zero. But if the effect drifts, the residuals drift with it, so the band **tilts or bends**. The formal test regresses the (scaled) residuals on a function of time \(g(t)\) and asks whether the slope is zero. A flat band means the slope is zero means the assumption holds.

Toggle the three shapes below to train your eye on what a residual band can do. A flat, even band around zero is a model behaving itself; read against time, that steady band is what a healthy proportional-hazards model produces. A band that fans out or bends is structure the model missed, and for Schoenfeld residuals against time that structure is an effect drifting, the exact signature of a violation.

::widget residual-plot {"start":"curved"}

=== step === quiz
::eyebrow Check yourself
## Reading the residuals

You fit a Cox model and plot the Schoenfeld residuals for the treatment covariate against time. Instead of a flat band around zero, the dots start clearly below zero and climb steadily to well above zero by the end of follow-up. What does that upward trend tell you?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The treatment's effect is drifting over time, so proportional hazards is violated for that covariate ::ok Right. A Schoenfeld residual that trends with time means the covariate's effect is not constant: it grows (or shrinks) as follow-up goes on. That is a proportional-hazards violation for that term, and the single hazard ratio no longer tells the whole story.
- The model fits well; a rising line is what a healthy Schoenfeld plot looks like ::no A HEALTHY Schoenfeld plot is a flat, patternless band around zero. A clear trend is the opposite of healthy, it is the signal that the effect changes over time.
- The residuals are non-normal, so you should transform the survival times ::no Schoenfeld residuals say nothing about the normality of the outcome. The question they answer is whether the effect is constant over time; a trend flags drift, not non-normality.
- There is one influential outlier dragging the line up ::no A single outlier moves one dot, not the whole band from below zero to above it. A steady climb across every death is a systematic time trend in the effect, not one stray point.

=== step === concept
::eyebrow In R
## cox.zph on Dr. Rao's trial

Enough theory; run the test. The `survival` package folds the whole Schoenfeld machinery into one function, `cox.zph()`. You hand it a fitted Cox model and it returns the trend test for every covariate plus a GLOBAL test for the model as a whole. Each lesson starts a fresh R session, so we rebuild Dr. Rao's trial and refit the adjusted model from Lesson 3 first:

```r
library(survival)

# Dr. Rao's 30 patients, exactly as Lesson 3 built them.
std_months <- c(2.7, 3.2, 4.5, 5.5, 6.1, 7.0, 8.3, 9.4, 11.5, 12.6, 13.5, 15.8, 18.0, 24.0, 24.0)
std_status <- c(1,1,1,1,1,1,1,0,1,1,1,1,0,0,0)
std_age    <- c(67,71,69,74,66,75,65,65,71,63,66,55,62,61,56)
new_months <- c(9.0,24.0,19.2,24.0,13.0,22.5,24.0,16.4,24.0,20.8,15.0,24.0,18.0,21.0,23.0)
new_status <- c(1,0,1,0,1,1,0,1,0,1,0,0,1,1,1)
new_age    <- c(57,63,68,53,58,63,69,62,55,63,68,59,60,57,57)
trial <- data.frame(
  months = c(std_months, new_months),
  status = c(std_status, new_status),
  arm    = factor(rep(c("standard","new"), each = 15), levels = c("standard","new")),
  age    = c(std_age, new_age))

cox_adj <- coxph(Surv(months, status) ~ arm + age, data = trial)
cox.zph(cox_adj)
#>        chisq df     p
#> arm     4.44  1 0.035
#> age     1.14  1 0.287
#> GLOBAL  5.82  2 0.055
```

Read it like any diagnostic table, from the bottom up:

- **GLOBAL** is the one-line verdict for the whole model: chi-square 5.82 on 2 degrees of freedom, p = 0.055. The null hypothesis is "proportional hazards holds", so a small p is evidence *against* it. Here p sits just above the usual 0.05 line, so the global test does not quite reject.
- **arm** on its own has p = 0.035, a whisker below 0.05, hinting the drug's effect may drift a little across the two years. **age** is a flat 0.287, no sign of trouble.

So what is the verdict? Honestly, borderline. With only 30 patients, `cox.zph` has very little to work with and its p-values wobble; one term grazing 0.05 while the global test does not reject is a *yellow flag*, not a red one. The right move is to look at the Schoenfeld plot for `arm` with `plot(cox.zph(cox_adj))`, judge whether the trend is real or noise, and, in a small trial, report the caveat rather than tear up a defensible model. Lesson 3's hazard ratio survives, but now you have actually *checked* it instead of hoping.

=== step === tryit
::eyebrow Your turn
## Run the PH test

`cox_adj` is still in memory, the adjusted Cox model for Dr. Rao's trial. Test its proportional-hazards assumption in one line: wrap the fitted model in the function that returns the per-covariate and GLOBAL trend tests. Fill in the blank.

```r
# cox_adj is already fitted. Test whether its hazard ratios hold over time.
____(cox_adj)
```
::check {"regex":"cox\\.zph\\s*\\(\\s*cox_adj","gate":true,"difficulty":"intermediate","ok":"That is the test. cox.zph() returns a trend test for each covariate plus a GLOBAL row; here arm grazes 0.05 (p = 0.035) and the global test sits at 0.055, a borderline result you weigh together with the plot and the small sample.","no":"Wrap the fitted model in cox.zph(): the line reads cox.zph(cox_adj). It returns the per-covariate and GLOBAL proportional-hazards tests."}
::solution
```r
cox.zph(cox_adj)
```

=== step === concept
::eyebrow When one number lies
## When one hazard ratio lies

Dr. Rao's trial was borderline and small, so the stakes felt low. Here is a case where getting this wrong would be a disaster. Picture a second study in the same clinic: an aggressive **early-benefit therapy** against standard care. The therapy protects patients strongly in the first months, but its advantage fades and then reverses, with standard care overtaking it late. We can build exactly that, simulate it, and fit the naive Cox model:

```r
# A different comparison in the same clinic: an early-benefit therapy vs standard care.
set.seed(7)
n <- 120
t_std <- rexp(n, rate = 1/11)                   # standard care: steady, constant risk
t_new <- rweibull(n, shape = 2.4, scale = 13)   # therapy: very low risk early, rising later
time0 <- c(t_std, t_new)
grp   <- factor(rep(c("standard", "therapy"), each = n),
                levels = c("standard", "therapy"))
early <- data.frame(time   = round(pmin(time0, 24), 2),   # 2-year administrative cutoff
                    status = as.integer(time0 <= 24),
                    grp    = grp)

cox_e <- coxph(Surv(time, status) ~ grp, data = early)
summary(cox_e)$conf.int
#>            exp(coef) exp(-coef) lower .95 upper .95
#> grptherapy     0.985      1.016     0.754     1.286
```

Read that hazard ratio: 0.985, a confidence interval straddling 1, a p-value near 0.9. Taken at face value, the therapy does **nothing**, indistinguishable from standard care. A team could kill a genuinely useful early treatment on the strength of that one number. Now run the check:

```r
cox.zph(cox_e)
#>        chisq df       p
#> grp     56.9  1 4.5e-14
#> GLOBAL  56.9  1 4.5e-14

plot(cox.zph(cox_e))   # the residuals for grp climb steadily from below zero to above it
```

p = 0.000000000000045. This is not borderline; the proportional-hazards assumption is shattered. The Schoenfeld plot shows the residuals for `grp` marching from strongly negative early to strongly positive late, the treatment effect visibly flipping sign as follow-up wears on. The "no effect" hazard ratio was never a finding. It was an **average of a strong early benefit and a strong late harm**, and the two cancelled into a meaningless 0.98.

=== step === quiz
::eyebrow Check yourself
## What is really going on?

The naive model reported a hazard ratio of 0.98 (p = 0.9) for the early-benefit therapy, yet `cox.zph` returned p < 0.001 against proportional hazards. Which reading is correct?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- The two agree the therapy has no real effect; the tiny cox.zph p just confirms a good fit ::no A small cox.zph p is evidence AGAINST proportional hazards, not confirmation of a good fit. The two results do not agree; together they reveal that the single hazard ratio is hiding a time-varying effect.
- The therapy's effect changes over time, protective early and harmful late, and the single hazard ratio averaged those opposite effects into a near-1 "no effect" that is true for neither period ::ok Exactly. With hazards that cross, the one number averages a strong early benefit against a strong late harm into a meaningless 0.98. Splitting follow-up recovers the real story: a protective HR early and a harmful HR late.
- The hazard ratio of 0.98 is the trustworthy summary; cox.zph is oversensitive and can be ignored ::no cox.zph is not oversensitive here: p is 4.5e-14, about as decisive as statistics gets. When PH is violated this badly, the single hazard ratio is the untrustworthy number, not the test.
- cox.zph tests whether the therapy works, and p < 0.001 means it works very well ::no cox.zph does not test whether the treatment works; it tests whether the treatment's effect is CONSTANT over time. A tiny p means the effect drifts, and says nothing about whether it is beneficial on average.

=== step === concept
::eyebrow The fix
## Fixing it: let the effect change with time

If one number cannot describe an effect that flips, use more than one. The cleanest fix is to stop pretending the coefficient is constant and let it depend on time. Formally, replace the fixed \(\beta\) with a coefficient that moves:

\[ \beta(t) = \beta + \theta\,g(t), \]

where \(g(t)\) is some simple function of time (a straight line, \(\log t\), or a step). Proportional hazards is the special case \(\theta = 0\), a flat \(\beta(t)\); a nonzero \(\theta\) is exactly the drift `cox.zph` detected. The most interpretable choice of \(g(t)\) is a **step**: cut follow-up into windows and fit a separate hazard ratio in each. Split the early-therapy data at month 8, roughly where the early benefit gives way to late harm, and refit:

```r
esplit <- survSplit(Surv(time, status) ~ ., data = early,
                    cut = 8, episode = "period")
esplit$win <- factor(ifelse(esplit$period == 1, "early", "late"),
                     levels = c("early", "late"))
esplit$therapy_early <- as.integer(esplit$grp == "therapy" & esplit$win == "early")
esplit$therapy_late  <- as.integer(esplit$grp == "therapy" & esplit$win == "late")

cox_tv <- coxph(Surv(tstart, time, status) ~ therapy_early + therapy_late,
                data = esplit)
summary(cox_tv)$conf.int
#>               exp(coef) exp(-coef) lower .95 upper .95
#> therapy_early     0.329      3.039     0.211     0.514
#> therapy_late      2.173      0.460     1.495     3.159
```

Now the truth is legible. In the first eight months the therapy's hazard ratio is **0.33**, a two-thirds cut in risk; after month eight it is **2.17**, more than double the risk. The near-1 average from the last step was hiding two large, opposite effects. `survSplit` did the bookkeeping: it chops each patient's follow-up at the cut point so the early rows feed the early coefficient and the late rows feed the late one, all inside one honest model.

Two lighter fixes exist for when you do not need a full time-varying model. `strata()` lets a nuisance variable (like study site) carry its own baseline hazard instead of a proportional effect, and `coxph`'s `tt()` argument fits a smooth \(\beta(t)\) directly. But when an effect genuinely reverses, as here, reporting an early hazard ratio and a late one is the clearest thing you can put in front of a clinician.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [Grambsch and Therneau (1994), Proportional hazards tests and diagnostics based on weighted residuals, Biometrika 81:515](https://doi.org/10.1093/biomet/81.3.515) - the paper behind `cox.zph`: scaled Schoenfeld residuals and the trend test you just ran.
- [Schoenfeld (1982), Partial residuals for the proportional hazards regression model, Biometrika 69:239](https://doi.org/10.1093/biomet/69.1.239) - the original residual, the raw material of the whole diagnostic.
- [Therneau and Grambsch (2000), Modeling Survival Data: Extending the Cox Model, Springer](https://doi.org/10.1007/978-1-4757-3294-8) - the definitive treatment of checking and extending proportional hazards, by the survival package's author.
- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical R reference for `cox.zph`, `survSplit`, `tt()`, and `strata()`, with worked examples.

=== step === complete
## Lesson 4 complete

You no longer take a hazard ratio on trust. Proportional hazards is a **promise about time**, that one multiplier holds for the whole follow-up, and you now have the tools to hold it to account. **Schoenfeld residuals** turn the promise into a scatter you can read: a flat band means the effect is steady, a trend means it is drifting. `cox.zph()` runs that test for every covariate and for the model as a whole, and you learned to read its verdict honestly, treating Dr. Rao's borderline 0.055 with a small-sample grain of salt and the early-therapy's 4.5e-14 as a settled violation. When the assumption breaks, a single hazard ratio can be a flat lie, a 0.98 "no effect" that was really a protective 0.33 early and a harmful 2.17 late, and you fixed it by letting \(\beta(t)\) change with time.

Every model so far, Kaplan-Meier and Cox alike, has refused to name the shape of the baseline hazard. Next, Lesson 5: Parametric and AFT models, where you commit to a shape, a Weibull or exponential curve, fit survival with `survreg`, and see when that assumption buys you sharper predictions than Cox can give, and when it costs you.

---
title: "Survival Analysis Lesson 6: Competing Risks and Cumulative Incidence"
catalog_blurb: "Measuring one risk correctly when a competing event can happen first."
description: "Why 1 minus Kaplan-Meier overcounts a risk when events compete, how the cumulative incidence function fixes it, and the Fine-Gray model, worked in R with survival."
keywords: "competing risks in R, cumulative incidence function, Fine-Gray model, cause-specific hazard, subdistribution hazard, multi-state survfit, one minus Kaplan-Meier overcounting, non-relapse mortality, survival analysis"
post_type: "LESSON"
curriculum_id: "6.150.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "6"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Survival-ML-and-Evaluation.html"
course_prev: "Parametric-and-AFT-Models.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Competing Risks and Cumulative Incidence

Every lesson so far quietly assumed each patient faces exactly one way to have the event. Lesson 5 made you say it out loud, and it is time to break it. Dr. Rao has moved to the transplant unit. Her patients had a stem-cell transplant for leukemia, and the question the ward cares about is relapse: does the cancer come back? But there is a second exit. A patient can die in remission first, of an infection or a graft complication, before relapse ever gets its chance. Those two events compete, and the moment they do, the trusty "1 minus Kaplan-Meier" from Lesson 2 starts reporting relapse numbers that are simply too big.

By the end of this lesson you will be able to:

- Explain why one competing event removes a patient from the other's risk, and why that breaks 1 minus Kaplan-Meier
- Estimate the cumulative incidence function (CIF) for each cause in R, the honest replacement
- Choose between a cause-specific model and a Fine-Gray model by the question you are actually asking

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (the survival function and censoring), [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the KM staircase and 1 minus S), and [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model and the hazard ratio). You can read a coefficient table and run R.

The stacked bands below are the whole lesson in one picture: at every month, the fraction still in remission, the fraction who have relapsed, and the fraction who have died, always summing to 100%. Drag the time point and watch the split.

::widget competing-risks {}

=== step === concept
::eyebrow The setup
## Two exits, and only one can be first

Meet Ms. Anand, six months past her transplant and, so far, in remission. Two futures are open to her, and they are racing. The leukemia could relapse. Or an infection could take her while she is still in remission. Whichever arrives first closes the door on the other: a patient who dies in remission can never go on to relapse, and a patient who relapses has left the "died in remission" pool for good. That is what makes them **competing risks**, not two separate survival problems you can study one at a time.

It helps to name the three fates precisely, because the whole lesson turns on keeping them straight.

| Outcome for a patient | What it means here | How we code it |
|---|---|---|
| Event of interest | Relapse of the leukemia | `relapse` |
| Competing event | Death in remission (infection, graft complication) | `death` |
| Censored | Still in remission at the last clinic visit | `censored` |

[KEY INSIGHT]
A competing event does not just "happen alongside" the event you care about. It removes the patient from the risk set for your event, permanently. Ignore that and every count you make will be off in a predictable direction: too high.

Hold onto Ms. Anand. Everything below is really about how to count patients like her without double-booking their fate.

=== step === concept
::eyebrow The trap
## Why "1 minus Kaplan-Meier" overcounts

Here is the natural, and wrong, first instinct. To estimate the cumulative incidence of relapse, treat relapse as the event and treat everything else, including death in remission, as ordinary censoring. Then read off \(1 - S_{\text{KM}}(t)\), exactly as you did for a single endpoint in Lesson 2.

The flaw is in what censoring *means*. When Kaplan-Meier censors a patient at month 20, it assumes that patient is still out there, still able to relapse later; they were simply lost to view. That is true for someone who moved away. It is a fiction for someone who died in remission at month 20. They cannot relapse at month 30. Treating their death as censoring quietly keeps them in the pool of people who might yet relapse, and the estimator inflates the relapse curve to compensate.

Let us watch it break. First, Dr. Rao's cohort of 300 transplant patients, built right here so this page is self-contained (run this once; later blocks reuse `bmt`):

```r
library(survival)
set.seed(7)
n   <- 300
grp <- factor(rep(c("young", "older"), each = 150), levels = c("young", "older"))

# Cause-specific hazards per month. The relapse RATE is about equal in the two groups;
# death-in-remission is far more common in the older group.
h_relapse <- ifelse(grp == "older", 0.020, 0.022)
h_death   <- ifelse(grp == "older", 0.030, 0.008)

t_relapse <- rexp(n, h_relapse)          # if this time comes first, the patient relapses
t_death   <- rexp(n, h_death)            # if this comes first, the patient dies in remission
t_first   <- pmin(t_relapse, t_death)    # only the first event is ever observed
cause     <- ifelse(t_relapse <= t_death, "relapse", "death")

t_cens <- runif(n, 6, 60)                # random dropout, with a hard stop at month 60
time   <- pmin(t_first, t_cens, 60)
status <- ifelse(t_first <= pmin(t_cens, 60), cause, "censored")
event  <- factor(status, levels = c("censored", "relapse", "death"))  # censored MUST be level 1
bmt    <- data.frame(time = round(time, 1), event = event, grp = grp)
table(bmt$event)
#>
#> censored  relapse    death
#>       96      105       99
```

Now run the naive recipe for both causes and add the two "1 minus KM" numbers at 36 months:

```r
km_relapse <- survfit(Surv(time, event == "relapse") ~ 1, data = bmt)  # death treated as censoring
km_death   <- survfit(Surv(time, event == "death")   ~ 1, data = bmt)  # relapse treated as censoring

naive_relapse <- 1 - summary(km_relapse, times = 36)$surv
naive_death   <- 1 - summary(km_death,   times = 36)$surv
round(c(naive_relapse = naive_relapse, naive_death = naive_death,
        sum = naive_relapse + naive_death), 3)
#> naive_relapse   naive_death           sum
#>         0.535         0.504         1.039
```

Read that last number. The naive method says 53.5% have relapsed and 50.4% have died by month 36, which totals **103.9%** of the cohort. More than everyone. It is not a rounding wrinkle; it is the estimator promising more events than there are patients. Plot the two naive curves and their sum, and the impossibility is visible: the dashed total sails straight past the 100% line.

```r
grid <- seq(0, 55, by = 1)
nr <- 1 - summary(km_relapse, times = grid)$surv
nd <- 1 - summary(km_death,   times = grid)$surv

plot(grid, nr, type = "s", col = "#c05a3c", lwd = 2, ylim = c(0, 1.1),
     xlab = "months since transplant", ylab = "estimated cumulative probability",
     main = "Naive 1 - KM double-counts")
lines(grid, nd, type = "s", col = "#3a6ea5", lwd = 2)
lines(grid, nr + nd, type = "s", col = "grey30", lwd = 2, lty = 2)
abline(h = 1, lty = 3)
legend("topleft", bty = "n", lwd = 2, lty = c(1, 1, 2),
       col = c("#c05a3c", "#3a6ea5", "grey30"),
       legend = c("naive relapse", "naive death", "their sum (impossible over 1)"))
```

The two curves are each computed as if the other cause did not exist, so together they promise a world where more than 100% of patients can have an event. That is the tell that you have counted competing events wrong.

=== step === quiz
::eyebrow Check yourself
## Spot the mistake

A colleague reports that "by two years, 45% of transplant patients have relapsed," computed as \(1 - S_{\text{KM}}(t)\) with relapse as the event and every death in remission treated as a censored observation. Why is that number too high?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is not too high; censoring deaths is the standard way to handle them, so the estimate is correct ::no That is exactly the move that inflates it. Kaplan-Meier censoring assumes a censored patient can still have the event later, which a patient who died in remission cannot.
- Censoring the deaths treats those patients as if they could still relapse later, so they stay in the at-risk pool and the relapse curve is pushed up ::ok Right. A death in remission ends any chance of relapse, but censoring pretends the patient is still eligible, so the estimator over-attributes relapses to keep the curve consistent. Add the two naive curves and they can exceed 100%.
- It is too high only because the sample is small; with more patients 1 minus KM would give the right cumulative incidence ::no Sample size does not fix it. The bias is structural: treating a competing death as censoring is wrong at any n, and 1 minus KM stays biased upward as the cohort grows.
- The relapse rate was estimated on the wrong time scale ::no The time scale is fine. The error is treating a competing event as censoring, which misstates who is still at risk, not how time is measured.

=== step === concept
::eyebrow The fix
## The cumulative incidence function

The honest estimator keeps every cause in view at once and lets them share the patients. It is the **cumulative incidence function**, or CIF: for cause \(k\), \(F_k(t)\) is the probability that a patient has had event \(k\), and had it *first*, by time \(t\).

The formula says exactly how to count without double-booking. Writing \(h_k(u)\) for the **cause-specific hazard** of event \(k\) (the instantaneous rate of event \(k\) among patients still event-free at time \(u\)) and \(S(u^-)\) for the **overall survival**, the probability of being still event-free, having escaped *every* cause, just before time \(u\),

\[ F_k(t) = \int_0^t S(u^-)\, h_k(u)\, \mathrm{d}u. \]

Read it in words. At each instant \(u\), the chance of newly relapsing is "still in remission right up to \(u\)" times "relapses right now". The \(S(u^-)\) factor is the whole fix: a patient who already died in remission is not in \(S(u^-)\) anymore, so they contribute nothing to the relapse tally from that moment on. Each cause is weighted by the shrinking pool of people actually still at risk, which is why the pieces fit together instead of overflowing:

\[ S(t) + \sum_k F_k(t) = 1 \qquad \text{for all } t. \]

Event-free, plus relapsed, plus died in remission, equals the whole cohort, at every single time. Drag the time point in the widget below and read the three shares: they always sum to 100%, because the CIF shares one fixed budget of patients across the competing fates instead of giving each cause the whole cohort to itself.

::widget competing-risks {}

=== step === concept
::eyebrow In R
## Estimate the CIF with survfit

You already know `survfit`. The one change that turns it from a Kaplan-Meier curve into a competing-risks estimator is the status you hand it: give it a **factor** with a level per state (censoring first), not a 0/1 indicator. `survfit` then fits a multi-state model and returns the CIF for every state at once. We built `bmt` in the setup block above; fit the CIF on it:

```r
cif <- survfit(Surv(time, event) ~ 1, data = bmt)   # event is a factor => competing-risks CIF
summary(cif, times = c(12, 24, 36))
#> Call: survfit(formula = Surv(time, event) ~ 1, data = bmt)
#>
#>  time n.risk n.event Pr((s0)) Pr(relapse) Pr(death)
#>    12    178     103    0.650       0.183     0.166
#>    24     85      60    0.405       0.320     0.275
#>    36     33      31    0.230       0.400     0.369
```

`Pr((s0))` is the starting state, still in remission. The other two columns are the CIFs. At 36 months the CIF of relapse is **0.400**: forty percent of the *whole cohort* has relapsed first. Compare that with the naive `0.535` from a few steps ago. The 13.5-point gap is exactly the overcount, the relapses the naive method wrongly credited to patients who had actually died in remission. And read across the row: 0.230 in remission, 0.400 relapsed, 0.369 died, which sums to 0.999, the whole cohort, as promised.

Lay the two relapse estimates on one plot and the correction is unmistakable, the naive dashed curve floating above the solid CIF:

```r
cif_relapse <- summary(cif, times = grid)$pstate[, "relapse"]  # grid from the plot earlier

plot(grid, nr, type = "s", col = "#c05a3c", lwd = 2, lty = 2, ylim = c(0, 0.7),
     xlab = "months since transplant", ylab = "cumulative incidence of relapse",
     main = "Naive 1 - KM (dashed) vs the CIF (solid)")
lines(grid, cif_relapse, type = "s", col = "#c05a3c", lwd = 2)
legend("topleft", bty = "n", lwd = 2, lty = c(2, 1), col = "#c05a3c",
       legend = c("naive 1 - KM, overcounts", "cumulative incidence function"))
```

=== step === tryit
::eyebrow Your turn
## Make survfit count competing risks

The single most common competing-risks bug in R is handing `survfit` a logical status like `event == "relapse"`, which silently collapses death back into censoring and gives you the naive KM again. The fix is to pass the whole multi-level **factor** as the status. Fill in the blank so the fit returns the CIFs.

```r
cif <- survfit(Surv(time, ____) ~ 1, data = bmt)
summary(cif, times = 24)$pstate     # should show Pr((s0)), Pr(relapse), Pr(death)
```
::check {"regex":"Surv\\(\\s*time,\\s*event\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Exactly. Passing the whole factor event (not a logical such as event == relapse) tells survfit to track every state at once, which is what produces the CIF. Its pstate has one column per state and each row sums to 1.","no":"Give survfit the whole factor as the status: Surv(time, event). A logical like event == relapse turns the competing death back into censoring and you are back to a naive KM curve."}
::solution
```r
cif <- survfit(Surv(time, event) ~ 1, data = bmt)
summary(cif, times = 24)$pstate
```

=== step === concept
::eyebrow Modeling
## Two hazards, two questions

Estimating the CIF for the cohort was step one. Now Dr. Rao wants a covariate effect: do older patients relapse differently? Here competing risks force a decision most survival tutorials skip, because there are two honest ways to model it and they answer two different questions.

The **cause-specific hazard** model is just a Cox model on one cause, with the competing event treated as censoring for *this fit only*. It asks: among patients still in remission and therefore still able to relapse, does age change the instantaneous **rate** of relapse? This is the right tool for a question about biology, about the disease mechanism itself.

The **Fine-Gray subdistribution hazard** model asks the other question: does age change the **cumulative incidence**, the actual fraction who end up relapsing? It gets there with a deliberately strange trick. Instead of removing patients who died in remission, it keeps them in the risk set (with a weight that decays over time), so that their inability to relapse is baked directly into the model. The result is a hazard ratio that maps straight onto the CIF you plotted.

\[ h_k^{\text{cause-specific}}(t)=\text{rate among those still event-free}, \qquad h_k^{\text{sub}}(t)=\text{rate that drives } F_k(t). \]

Why would these two ever disagree? Because incidence depends on more than rate. If older patients die in remission far more often, many of them are gone before relapse can happen, so *fewer of them ever relapse* even if their relapse rate, moment for moment, is identical to the young. Same rate, lower incidence. The cause-specific model will say "age barely matters for relapse"; the Fine-Gray model will say "older patients clearly relapse less". Both are true, about different questions.

| You want to know | Model | What it treats competing deaths as |
|---|---|---|
| Does age change the relapse rate (mechanism)? | Cause-specific Cox | Censored |
| Does age change who ends up relapsing (incidence, risk to quote a patient)? | Fine-Gray subdistribution | Kept in the risk set, down-weighted over time |

[WARNING]
There is no single "hazard ratio for a competing risk". Report which one you fit. A cause-specific HR and a Fine-Gray subdistribution HR for the same cause and covariate are different numbers answering different questions, and quoting one as if it were the other is a genuine error, not a rounding difference.

=== step === concept
::eyebrow In R
## Both models, side by side

Watch the divergence happen on Dr. Rao's data. Our two groups were built with almost the same relapse rate but very different death-in-remission rates, so this is exactly the case where the two models part ways.

First the cause-specific Cox for relapse. Competing deaths are censored, so this is an ordinary `coxph` with a logical event:

```r
cs_relapse <- coxph(Surv(time, event == "relapse") ~ grp, data = bmt)
cs_relapse
#> Call:
#> coxph(formula = Surv(time, event == "relapse") ~ grp, data = bmt)
#>
#>             coef exp(coef) se(coef)      z    p
#> grpolder -0.1186    0.8881   0.1985 -0.598 0.55
#>
#> Likelihood ratio test=0.36  on 1 df, p=0.5489
#> n= 300, number of events= 105
```

The relapse **rate** in older patients is 0.89 times that of the young, with p = 0.55: no real difference. Among people still in remission, age is not changing how fast relapse arrives.

Now the Fine-Gray model. `finegray()` expands the data into the special risk sets and weights, then you fit a weighted `coxph` on its `fgstart`, `fgstop`, `fgstatus` and `fgwt` columns:

```r
pd <- finegray(Surv(time, event) ~ grp, data = bmt, etype = "relapse")
fg_relapse <- coxph(Surv(fgstart, fgstop, fgstatus) ~ grp, weight = fgwt, data = pd)
fg_relapse
#> Call:
#> coxph(formula = Surv(fgstart, fgstop, fgstatus) ~ grp, data = pd,
#>     weights = fgwt)
#>
#>             coef exp(coef) se(coef) robust se      z      p
#> grpolder -0.3708    0.6902   0.1981    0.1842 -2.013 0.0441
#>
#> Likelihood ratio test=3.55  on 1 df, p=0.05943
#> n= 2735, number of events= 105
```

The subdistribution hazard ratio is 0.69, p = 0.044: older patients have a **meaningfully lower cumulative incidence of relapse**. Not because their disease is calmer, the rate said it is not, but because so many of them die in remission first that relapse never gets its turn. The CIFs confirm it directly:

```r
cifg <- survfit(Surv(time, event) ~ grp, data = bmt)
summary(cifg, times = 36)
#> ...
#>                grp=young
#>     time  n.risk n.event Pr((s0)) Pr(relapse) Pr(death)
#>       36   19.00   89.00    0.281       0.495     0.223
#>
#>                grp=older
#>     time  n.risk n.event Pr((s0)) Pr(relapse) Pr(death)
#>       36   14.00  105.00    0.177       0.310     0.513
```

By 36 months, 49.5% of the young have relapsed versus 31.0% of the older, while death in remission runs the other way, 22.3% versus 51.3%. The Fine-Gray HR of 0.69 is that 31.0-versus-49.5 gap expressed as a hazard, and the cause-specific HR of 0.89 is the near-tie in the underlying rate. Two numbers, both correct, and now you know which sentence each one is allowed to say.

=== step === quiz
::eyebrow Check yourself
## Which model moves?

Suppose a new supportive-care protocol sharply cuts death in remission (non-relapse mortality) but does nothing to the biology of relapse, so the cause-specific relapse hazard is unchanged. Compared with the old protocol, what happens to the two relapse models?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- Both the cause-specific HR and the Fine-Gray HR for relapse stay essentially the same, since the relapse mechanism did not change ::no Only the cause-specific model is about the mechanism. Saving patients from death in remission leaves more of them alive to relapse, so the cumulative incidence of relapse, and the Fine-Gray HR, must move.
- Both move together in the same direction, because they are two estimates of the same quantity ::no They are not the same quantity. One is a rate among those at risk, the other drives the cumulative incidence; this scenario is designed to move one and not the other.
- The cause-specific relapse HR is roughly unchanged, but the cumulative incidence of relapse rises and the Fine-Gray HR shifts accordingly ::ok Exactly. The rate of relapse among those still at risk is untouched, so the cause-specific model barely moves. But fewer competing deaths means more patients survive long enough to relapse, so the relapse CIF goes up and the Fine-Gray subdistribution HR changes with it. Same rate, different incidence.
- The Fine-Gray HR is unchanged and only the cause-specific HR moves ::no It is the reverse. The cause-specific hazard is what stayed fixed by assumption; the cumulative incidence, which the Fine-Gray model targets, is what a change in competing mortality moves.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take competing risks further:

- [Therneau, "Multi-state models and competing risks" (survival package vignette, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf) - the canonical R reference, by the package author, for the exact `survfit` and `finegray` machinery used here.
- [Fine and Gray (1999), "A Proportional Hazards Model for the Subdistribution of a Competing Risk", JASA 94(446)](https://doi.org/10.1080/01621459.1999.10474144) - the original paper that defined the subdistribution hazard and the model that bears their name.
- [Putter, Fiocco and Geskus (2007), "Tutorial in biostatistics: competing risks and multi-state models", Statistics in Medicine 26(11)](https://doi.org/10.1002/sim.2712) - the clearest full tutorial linking cause-specific hazards, the CIF, and regression.
- [Austin, Lee and Fine (2016), "Introduction to the Analysis of Survival Data in the Presence of Competing Risks", Circulation 133(6)](https://doi.org/10.1161/CIRCULATIONAHA.115.017719) - a short, applied guide to choosing cause-specific versus Fine-Gray by the clinical question.

=== step === complete
## Lesson 6 complete

You retired the assumption that had been hiding since Lesson 1. When events **compete**, one event removes a patient from the other's risk set, so treating a competing death as censoring inflates the estimate: the naive relapse and death curves summed to 103.9% of Dr. Rao's cohort, an impossibility. The **cumulative incidence function** \(F_k(t) = \int_0^t S(u^-) h_k(u)\,\mathrm{d}u\) fixes it by weighting each cause's hazard by the survivors still at risk, so the event-free fraction plus every cause's CIF sums to one; in R, a `survfit` with a **factor** status returns all of them at once (relapse CIF 0.400, not the naive 0.535). And for covariate effects you learned to pick the hazard by the question: the **cause-specific** Cox for the relapse rate (HR 0.89, unchanged by age) versus the **Fine-Gray** subdistribution model for the relapse incidence (HR 0.69, clearly lower in older patients, because death reached them first).

One thread still runs through the whole course: every model so far was one you specified by hand, a Cox form, a Weibull, a Fine-Gray. Next, Lesson 7: Survival ML and evaluation, where a random survival forest learns the shape for you, and you learn to score any survival model honestly with Harrell's C-index and the time-dependent Brier score, so the certificate rests on models you can actually trust.

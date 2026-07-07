---
title: "Survival Analysis Lesson 6: Competing Risks and Cumulative Incidence"
catalog_blurb: "Measuring one risk correctly when a competing event can happen first."
description: "Why 1-minus-Kaplan-Meier overcounts when events compete, how the cumulative incidence function shares the risk, and cause-specific vs Fine-Gray models in R."
keywords: "competing risks, cumulative incidence function, CIF, Fine-Gray model, cause-specific hazard, survfit competing risks, subdistribution hazard, 1 minus Kaplan-Meier, survival analysis in R"
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

Every lesson so far has tracked a single kind of exit: a patient either has the event, or is censored. Dr. Rao's newest study breaks that neat picture. She is following 200 leukemia patients after a bone-marrow transplant, and each one now has two different ways to leave the study, where only one can happen first.

The leukemia can come back, a **relapse**. Or the patient can **die in remission** from a transplant complication, an infection or graft-versus-host disease, before the leukemia ever returns. Take Anika: she dies of an infection in month 8, still in full remission. She can now never relapse. That one fact, that a patient claimed by one event is gone from the other forever, is what makes these events **compete**, and it quietly breaks the Kaplan-Meier estimator you have trusted for five lessons.

By the end of this lesson you will be able to:

- Explain why a competing event is not the same as a censored patient
- See why "1 minus Kaplan-Meier" overcounts a cause's incidence, and by how much
- Estimate the cumulative incidence function for each cause in R, and fit both a cause-specific and a Fine-Gray model

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (right-censoring, `Surv()`, the hazard), [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the Kaplan-Meier curve and 1 minus KM as incidence), and [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model and the hazard ratio). You can run R and read a coefficient table.

::widget competing-risks {}

=== step === concept
::eyebrow The idea
## Two exits, and only one can be first

Line up what can happen to one of Dr. Rao's patients after the transplant. As the months pass they sit in remission, and then one of three things ends their follow-up: the leukemia relapses, or they die in remission, or the study simply ends while they are still healthy (that last one is ordinary right-censoring from Lesson 1). Relapse and death-in-remission are the two **competing events**: mutually exclusive endpoints racing each other, where whichever arrives first settles the patient's fate and rules the other one out.

Here is the crucial difference from everything so far. When a patient is censored, we stop watching, but the event could still be coming: censoring says "unknown, maybe later." When Anika dies in remission, relapse is not unknown, it is impossible. She has left the pool of people who could ever relapse, permanently. A competing event does not hide the outcome of interest, it forecloses it.

[KEY INSIGHT]
Censoring pauses the clock on an event that might still happen. A competing event stops that clock forever. Treating the second like the first is the mistake this whole lesson is about.

The stacked chart below is the honest bookkeeping. At any month it splits the cohort into three shares, still event-free on top, already relapsed, already dead, and the three always add up to the whole. Drag the time toggle and watch relapse and death both grow while the event-free slice shrinks: every patient one event takes is a patient the other can no longer claim.

::widget competing-risks {}

=== step === quiz
::eyebrow Check yourself
## Is a competing death just censoring?

Anika dies of an infection in month 8, in full remission, never having relapsed. Dr. Rao wants to estimate the incidence of **relapse** across her cohort. How should Anika be handled?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- As a relapse, because a death is still an event and the analysis needs every event counted ::no A death in remission is not a relapse; counting it as one would inflate the very thing you are trying to measure. Relapse and death-in-remission are different endpoints.
- As censored at month 8, exactly like a patient we simply stopped following, because we no longer observe her relapse status ::no This is the central mistake of the lesson. Censoring assumes the event could still happen later; Anika can never relapse, so treating her as censored pretends she is still at risk of relapse when she is not.
- As a competing event: she leaves the relapse risk set for good and can never contribute a future relapse ::ok Exactly. A competing event removes the patient from the pool that could still relapse, permanently. That is what separates it from censoring, and it is why the naive estimator you meet next goes wrong.
- Dropped from the dataset entirely, since she did not have the event of interest ::no Dropping her throws away real information (she was at risk of relapse up to month 8) and biases the estimate. She belongs in the analysis, correctly coded as a competing event, not deleted.

=== step === concept
::eyebrow The trap
## Why "1 minus Kaplan-Meier" overcounts

In Lesson 2 you turned a Kaplan-Meier curve into an incidence with one subtraction: if \(S(t)\) is the probability of surviving event-free past time \(t\), then \(1 - S(t)\) is the probability the event has happened by \(t\). That is exactly right when there is only one event. The temptation is to reuse it here, once per cause: to get the relapse incidence, run Kaplan-Meier for relapse and treat every death-in-remission as a censored observation. It feels reasonable. It is wrong, and in a specific, predictable direction.

To see why, name the pieces. The **cause-specific hazard** for cause \(k\) is

\[ h_k(t) = \lim_{\Delta t \to 0} \frac{1}{\Delta t}\, P\!\left(t \le T < t + \Delta t,\ \text{cause}=k \ \middle|\ T \ge t\right), \]

the instantaneous rate of failing from cause \(k\) among patients still event-free at time \(t\). Here \(T\) is the time of the first event, and "cause = k" records which event it was. The chance of still being event-free at all, accounting for **every** cause together, is the overall survival

\[ S(t) = \exp\!\left(-\int_0^t \big(h_{\text{relapse}}(u) + h_{\text{death}}(u)\big)\,\mathrm{d}u\right). \]

Now look at what Kaplan-Meier-for-relapse does when it censors the deaths. It builds a survival curve as if death removed patients only temporarily, leaving them eligible to relapse later. So its "survival" is driven by \(h_{\text{relapse}}\) alone, ignoring that \(h_{\text{death}}\) was busy removing many of those same patients for good. The curve stays too high, and \(1 - \text{that curve}\) climbs too far. The dead are quietly counted as future relapses that can never occur.

[WARNING]
"1 minus Kaplan-Meier," applied one cause at a time, overcounts every cause. Push it far enough and the separate cause incidences can sum past 1, which is impossible: you would be claiming more than 100% of the cohort had an event. You will see exactly that in a moment.

=== step === quiz
::eyebrow Check yourself
## Spot the mistake

A colleague analyzes Dr. Rao's data and reports: "By 36 months, 69% of patients have relapsed and 55% have died in remission." He got both numbers from separate Kaplan-Meier curves, censoring the other event each time. What is the giveaway that something is broken?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is broken; running Kaplan-Meier once per cause is the standard way to get each incidence ::no It is a common habit, but it is exactly the error here. Censoring the competing event overcounts each cause, and this example shows the damage.
- The two figures add to 124%, which is impossible: no more than 100% of patients can have had an event ::ok Right. 69% + 55% = 124%. Because each Kaplan-Meier curve treated the other event as if those patients could still fail from this cause, both numbers are inflated, and their impossible total is the smoking gun.
- The numbers are fine individually, but he should have reported a hazard ratio instead ::no A hazard ratio compares groups; it would not fix a single-cohort incidence that is already overcounted. The problem is the estimator, not the summary you choose.
- Relapse and death cannot both be measured in the same cohort ::no They can and should be, together. The fix is not to drop one, it is to estimate them jointly so the shares add up correctly.

=== step === concept
::eyebrow The fix
## The cumulative incidence function

The honest estimator fixes the exact flaw you just spotted: it weights each cause's hazard by the chance of still being event-free, using the **all-cause** survival, so patients who have already left (by either event) stop contributing. That estimator is the **cumulative incidence function** (CIF). For cause \(k\),

\[ F_k(t) = \int_0^t S(u^-)\, h_k(u)\,\mathrm{d}u. \]

Read it left to right. To relapse in the small interval around time \(u\), a patient must do two things: still be event-free just before \(u\), which happens with probability \(S(u^-)\) (the little minus means "an instant before \(u\)"), and then relapse right then, at rate \(h_k(u)\). Multiply those and add up over all instants up to \(t\), and you have the probability of having relapsed by \(t\). The all-cause \(S(u^-)\) is the whole fix: because it already folds in death, a patient killed by the competing event has an \(S(u^-)\) that keeps dropping without ever adding to the relapse total. The risk is shared, not double-counted.

That sharing is what makes the pieces add up. The event-free survivors plus everyone who has failed from each cause must be the entire cohort, so

\[ S(t) + F_{\text{relapse}}(t) + F_{\text{death}}(t) = 1 \quad \text{for every } t. \]

[KEY INSIGHT]
The stacked chart from the start of the lesson was these three quantities all along: the top band is \(S(t)\), the two lower bands are \(F_{\text{relapse}}(t)\) and \(F_{\text{death}}(t)\), and they tile the whole square because they must sum to 1. "1 minus Kaplan-Meier" broke that budget; the CIF respects it.

=== step === concept
::eyebrow In R
## Estimate the CIF with survfit

The `survival` package computes the CIF for you, and the switch that turns Kaplan-Meier into competing risks is small: make the status a **factor** with one level per cause, instead of a 0/1 flag. `survfit` then sees the several event types and returns one incidence curve per cause automatically.

First, build Dr. Rao's cohort. Each lesson runs in a fresh R session, so we simulate it right here (run this once). Two hidden clocks tick for every patient, a relapse time and a death-in-remission time; whichever is smaller, and beats the end of follow-up, decides how they leave. Older patients have a faster death clock, which will matter later.

```r
library(survival)
set.seed(7)
n <- 200
older     <- rbinom(n, 1, 0.5)                       # 1 = patient is 50 or older
t_relapse <- rexp(n, rate = 0.030)                   # clock 1: time to leukemia relapse
t_death   <- rexp(n, rate = 0.015 + 0.030 * older)   # clock 2: death in remission (older die faster)
t_cens    <- runif(n, 24, 60)                        # end of follow-up, in months
obs_time  <- pmin(t_relapse, t_death, t_cens)        # we only see the first thing that happens
cause <- ifelse(t_relapse <= pmin(t_death, t_cens), "relapse",
         ifelse(t_death   <= t_cens,                "death", "censor"))
bmt <- data.frame(
  months = round(obs_time, 1),
  agegrp = factor(ifelse(older == 1, "50plus", "under50"), levels = c("under50", "50plus")),
  event  = factor(cause, levels = c("censor", "relapse", "death"))   # 1st level = censored
)
table(bmt$event)
#> 
#>  censor relapse   death 
#>      27      96      77 
```

The `event` column is a factor whose first level, `censor`, is what `survival` reads as "no event yet"; the other two levels are the competing causes. Hand that to `survfit` with a `~ 1` (no groups), and `summary(..., times = )$pstate` reports the probability of being in each state at the times you ask for:

```r
cif <- survfit(Surv(months, event) ~ 1, data = bmt)
cif$states
#> [1] "(s0)"    "relapse" "death"
round(summary(cif, times = c(12, 24, 36))$pstate, 3)
#>       (s0) relapse death
#> [1,] 0.520   0.235 0.245
#> [2,] 0.280   0.380 0.340
#> [3,] 0.137   0.476 0.387
```

`(s0)` is the starting state, still in remission and event-free. Read across any row and the three probabilities sum to 1: at 24 months, 28.0% are still event-free, 38.0% have relapsed, and 34.0% have died in remission. That relapse figure, 38.0%, is the honest one. Watch what the naive method claims instead.

=== step === tryit
::eyebrow Your turn
## Make survfit count competing risks

Here is the one line that decides whether you get a competing-risks CIF or a naive Kaplan-Meier. The outcome inside `Surv()` must be the multi-state **factor** (`event`), so `survfit` knows there are several causes. Pass a logical like `event == "relapse"` instead and it collapses back to a two-state Kaplan-Meier that censors the deaths, the very thing that overcounts. Fill in the blank with the column that keeps all the causes.

```r
crfit <- survfit(Surv(months, ____) ~ 1, data = bmt)
crfit$states   # should list (s0), relapse and death, not just two states
```
::check {"regex":"event\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That returns a real competing-risks fit: three states, one cumulative incidence curve per cause. The factor outcome is the whole trick.","no":"Pass the factor column that holds every cause: the answer is event. A logical test for a single cause would drop back to a naive Kaplan-Meier."}
::solution
```r
crfit <- survfit(Surv(months, event) ~ 1, data = bmt)
crfit$states
```

=== step === concept
::eyebrow The proof
## See the overcount, live

Now put the two methods side by side on Dr. Rao's real cohort. The naive way runs Kaplan-Meier once per cause, censoring the other event, and reports \(1 - S(t)\):

```r
# Naive "1 minus KM": run KM for each cause, treating the OTHER event as censoring.
km_relapse <- survfit(Surv(months, event == "relapse") ~ 1, data = bmt)
km_death   <- survfit(Surv(months, event == "death")   ~ 1, data = bmt)
naive_relapse <- 1 - summary(km_relapse, times = 36)$surv
naive_death   <- 1 - summary(km_death,   times = 36)$surv
round(c(relapse = naive_relapse, death = naive_death,
        total = naive_relapse + naive_death), 3)
#> relapse   death   total 
#>   0.691   0.553   1.244 
```

There it is: a total of 1.244, claiming 124% of the cohort had an event. The CIF, computed from the same data, keeps the books straight:

```r
round(summary(cif, times = 36)$pstate, 3)
#>       (s0) relapse death
#> [1,] 0.137   0.476 0.387
```

Relapse incidence is really 47.6%, not the naive 69.1%, a 21-point overcount from a single misused estimator. And the three honest shares, 13.7% event-free, 47.6% relapsed, 38.7% dead, sum to 1.000. Same patients, same code style; one respects that a dead patient cannot relapse, and the other does not.

=== step === concept
::eyebrow Modeling
## Two hazards, two questions

So far we described the whole cohort. The real work is comparing groups: does age change a patient's relapse experience? With competing risks there are two honest ways to ask that, and they answer genuinely different questions.

The **cause-specific hazard** model takes the relapse hazard \(h_{\text{relapse}}(t)\) from before and puts a Cox model on it, treating deaths as censored. Its hazard ratio answers a question about **rate**: among patients still alive and in remission, does age change how fast relapse strikes? This is the model for biology and mechanism, "does age make the leukemia itself more aggressive?"

The **Fine-Gray** model instead defines a **subdistribution hazard** \(\bar h_k(t)\), whose one strange, deliberate move is to keep patients who died of the competing event *in the risk set* rather than removing them. Its coefficient links straight to the cumulative incidence,

\[ F_k(t) = 1 - \exp\!\left(-\int_0^t \bar h_k(u)\,\mathrm{d}u\right), \]

so its hazard ratio answers a question about **incidence**: does age change the share of patients who actually end up relapsing? This is the model for prognosis and prediction, "of everyone who walks in, what fraction will relapse?"

[KEY INSIGHT]
Cause-specific asks about the rate among those still at risk; Fine-Gray asks about the eventual incidence in everyone. They can point in opposite directions, because anything that raises the competing death rate leaves fewer patients alive to ever relapse, and so lowers the relapse incidence even when the relapse rate itself has not budged. Pick the model by the question, not by habit.

=== step === concept
::eyebrow In R
## Both models, side by side

Fit both on the `agegrp` column already in `bmt`. The cause-specific model is an ordinary `coxph` with the competing deaths censored (`event == "relapse"`). The Fine-Gray model needs one extra step: `finegray()` expands the data into the special risk sets that keep the competing-event patients in, adding a weight (`fgwt`) and a start/stop interval, and then you fit a weighted `coxph` on that expanded frame:

```r
# Cause-specific: does age change the relapse RATE (deaths censored)?
cs <- coxph(Surv(months, event == "relapse") ~ agegrp, data = bmt)

# Fine-Gray: does age change the relapse INCIDENCE (competing deaths kept in)?
fg_data <- finegray(Surv(months, event) ~ agegrp, data = bmt, etype = "relapse")
fg <- coxph(Surv(fgstart, fgstop, fgstatus) ~ agegrp, weight = fgwt, data = fg_data)

round(rbind(
  cause_specific = summary(cs)$coef[, c("exp(coef)", "Pr(>|z|)")],
  fine_gray      = summary(fg)$coef[, c("exp(coef)", "Pr(>|z|)")]
), 3)
#>                exp(coef) Pr(>|z|)
#> cause_specific     1.002    0.991
#> fine_gray          0.690    0.051
```

The two models flatly disagree, and both are right. The cause-specific hazard ratio is 1.00 (p = 0.99): among patients still in remission, being 50 or older does nothing to the relapse rate, exactly how we built the data, with an identical relapse clock for both ages. Yet the Fine-Gray subdistribution ratio is 0.69: older patients relapse noticeably *less* often overall. Nothing about the leukemia changed; older patients simply die of transplant complications first, so many never reach the relapse they were equally prone to. The rate is flat, the incidence is lower, and only asking both questions tells the full story.

=== step === quiz
::eyebrow Check yourself
## Which model moves, and why?

Dr. Rao tries a new supportive-care protocol that sharply cuts deaths in remission (fewer infections) but has no effect on the leukemia itself. Compared with the old protocol, how do the two relapse models respond?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- The cause-specific relapse HR stays about 1 (the relapse rate is untouched), while the Fine-Gray relapse HR rises above 1, because more patients now survive long enough to relapse ::ok Exactly. The protocol never touched the relapse rate, so the cause-specific model, which conditions on being still at risk, barely moves. But keeping patients alive lets more of them reach relapse, so the relapse incidence, and the Fine-Gray HR, goes up.
- Both HRs fall, because preventing deaths must reduce every bad outcome including relapse ::no Preventing the competing death does not reduce relapse; for incidence it does the opposite. More survivors means more chances to relapse, so the relapse CIF and its Fine-Gray HR rise, not fall.
- Both HRs stay identical, since the protocol did not change the relapse hazard ::no The relapse hazard is unchanged, so the cause-specific HR holds, but the Fine-Gray HR reads incidence, and incidence rises when fewer patients are removed by the competing death. The two models diverge precisely here.
- Neither model can be used once a treatment affects the competing event ::no Both remain valid; in fact this is exactly the situation they were designed to separate. The cause-specific model isolates the rate, the Fine-Gray model captures the incidence shift.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take competing risks further:

- [Putter, Fiocco and Geskus (2007), Tutorial in biostatistics: competing risks and multi-state models, Statistics in Medicine 26:2389](https://doi.org/10.1002/sim.2712) - the clearest end-to-end tutorial on the CIF and the multi-state view, with the estimators used here.
- [Fine and Gray (1999), A Proportional Hazards Model for the Subdistribution of a Competing Risk, JASA 94:496](https://doi.org/10.1080/01621459.1999.10474144) - the original paper defining the subdistribution hazard you fit with `finegray()`.
- [survival package vignette: Multi-state models and competing risks (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/compete.pdf) - the canonical R reference for multi-state `survfit` and `finegray`, by the package author.
- [Austin, Lee and Fine (2016), Introduction to the Analysis of Survival Data in the Presence of Competing Risks, Circulation 133:601](https://doi.org/10.1161/CIRCULATIONAHA.115.017719) - an applied, clinician-facing guide to when cause-specific and Fine-Gray models each apply.

=== step === complete
## Lesson 6 complete

You learned to count correctly when events compete. A **competing event** (death in remission) is not censoring: it removes a patient from the relapse risk set forever, so "1 minus Kaplan-Meier" per cause overcounts, badly enough that the separate incidences summed to an impossible 124% on Dr. Rao's cohort. The **cumulative incidence function** \(F_k(t) = \int_0^t S(u^-) h_k(u)\,\mathrm{d}u\) fixes it by weighting each cause's hazard with the all-cause survival, so the event-free share and both cause incidences sum to exactly 1; you estimated it with a multi-state `survfit` on a factor outcome and read the honest 47.6% relapse incidence off `$pstate`. Finally you saw the two modeling questions competing risks forces you to separate: the **cause-specific** hazard ratio (age 1.00, the relapse rate) and the **Fine-Gray** subdistribution ratio (age 0.69, the relapse incidence), which disagreed because older patients die before they can relapse.

Next, Lesson 7: Survival ML and Evaluation. You will move from these classical models to machine-learned survival predictions, random survival forests, and, just as important, how to score any survival model honestly, with Harrell's C-index and the time-dependent Brier score, before you trust its numbers. That final lesson closes the course and your Survival Analysis certificate.

---
title: "Survival and Event History Analysis Lesson 7: Competing risks and why Kaplan-Meier overstates"
catalog_blurb: "Why death without relapse is not ordinary censoring, and how to measure it correctly."
description: "A 400-patient transplant cohort shows why death without relapse is not censoring, and how the cumulative incidence function fixes what Kaplan-Meier overstates."
keywords: "competing risks, cumulative incidence function, Kaplan-Meier estimator, cause-specific hazard, subdistribution hazard, Fine-Gray model, survfit, survival analysis, R"
post_type: "LESSON"
curriculum_id: "4.140.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "7"
course_total: "7"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: ""
course_prev: "Parametric-Survival-Models-and-When-to-Prefer-Them"
---

=== step === cover
## Competing risks and why Kaplan-Meier overstates

Today let's understand what happens when a patient can be stopped by one of two different things, and why counting both of them the same way is a mistake.

A transplant program has followed 400 patients for up to 60 months after a bone marrow transplant. Each patient can have one of two things happen to them: the original disease can come back, which is called a relapse, or the patient can die from complications of the transplant itself, without the disease ever coming back. Only one of those two things can happen to any one patient, and once it happens, it rules the other one out for that patient for good.

Here are 8 of the 400 patients, taken straight from the data.

::widget styled-table {"cols":["patient","month","outcome"],"rows":[[1,1.4,"death without relapse"],[2,11.9,"relapse"],[3,1.0,"death without relapse"],[4,60.0,"event-free"],[5,11.7,"relapse"],[6,60.0,"event-free"],[7,60.0,"event-free"],[8,11.7,"death without relapse"]],"formats":{"month":"1dp"},"title":"8 patients from the 400-patient transplant cohort","note":"month counts from the transplant to whichever of the three outcomes came first. event-free means neither relapse nor death without relapse had happened by month 60."}

Two of these eight relapsed, three died without their disease coming back, and three reached month 60 with neither event behind them.

=== step === concept
## What makes a competing risk different from censoring

Relapse and death without relapse are what statisticians call competing risks. Only one of them can happen to a given patient, and whichever happens first rules the other one out for that patient forever.

That is a sharper claim than censoring. A patient who is still alive and relapse-free when the study ends is censored: the study simply stopped watching before anything happened to them, so a relapse could still be waiting for them past that point, if only someone kept watching. A patient who died without relapsing is nothing like that. Death closed the book on that patient's story, not because nobody kept watching, but because the thing that would have let them relapse no longer exists.

Build the 400-patient cohort now. Each patient gets two hidden countdowns, one to relapse and one to death without relapse, both random. Whichever countdown runs out first, as long as it does so by month 60, decides what happens to that patient. A patient whose countdowns both run past month 60 is still event-free when follow-up ends.

```r
# Simulate 400 transplant patients and see how they split across the three outcomes
set.seed(2026)
t_relapse <- rexp(400, 0.0095)
t_death <- rexp(400, 0.0130)
time <- pmin(t_relapse, t_death, 60)
cause <- ifelse(t_relapse <= t_death & t_relapse <= 60, 1,
          ifelse(t_death < t_relapse & t_death <= 60, 2, 0))
df <- data.frame(time = time, cause = cause)
table(df$cause)
#>
#>   0   1   2 
#> 100 137 163 
round(100 * prop.table(table(df$cause)), 2)
#>
#>     0     1     2 
#> 25.00 34.25 40.75 
```

`cause` holds 0 for event-free, 1 for relapse, and 2 for death without relapse. Of the 400 patients, 100 reached month 60 without either event (25.0%), 137 relapsed (34.25%), and 163 died without relapsing (40.75%).

Death without relapse is already the single most common outcome in this cohort, ahead of relapse itself. Keep that fact in mind, because the more often the competing event happens, the more a method that ignores it will get wrong.

=== step === concept
## The naive estimate, and the assumption it hides

The most tempting way to estimate the chance of relapse is to run an ordinary Kaplan-Meier curve on relapse alone, and treat every patient who died without relapsing exactly like any other censored patient, someone the study simply lost track of before their relapse happened.

Here is that same product-limit idea, step by step, on a different two-arm drug trial.

::widget km-curve {}

This is not the transplant cohort. It is a separate drug trial, used here only to remind you what a Kaplan-Meier curve does underneath: it multiplies in a drop at every event and leaves a tick at every censored time, before that exact machine gets pointed at relapse versus death below.

Point that same machine at the transplant cohort now, counting only an actual relapse as the event and recoding everything else, including every death without relapse, as censored.

```r
# Fit the naive relapse-only Kaplan-Meier, with death without relapse treated as censoring
library(survival)
fit_km <- survfit(Surv(time, cause == 1) ~ 1, data = df)
naive_1_minus_km <- round(1 - summary(fit_km, times = c(12, 24, 36, 48, 60))$surv, 4)
names(naive_1_minus_km) <- c(12, 24, 36, 48, 60)
naive_1_minus_km
#>     12     24     36     48     60 
#> 0.1196 0.2236 0.2920 0.4053 0.4759 
```

That is the estimated chance of relapsing by each month, climbing from 0.1196 at month 12 to 0.4759 by month 60. In words, this naive estimate says that by month 60 about 48% of the cohort will have relapsed.

Every one of those five numbers rests on one assumption: that a patient coded as censored, death without relapse included, was still free to relapse later if only the study had kept watching them. For an administratively censored patient that assumption is reasonable. For a patient who died of transplant complications, it is not, because that patient cannot relapse, ever.

[KEY INSIGHT]
Treating a death without relapse as censoring assumes the dead patient could still have gone on to relapse. That assumption is exactly what makes a competing risk different from censoring, and exactly why this naive estimate overstates the true chance of relapse.

=== step === quiz
## Quick check: what 1-KM assumes about a patient who died

A patient in this cohort dies without relapsing at month 20. What does treating that patient's time as censored for relapse assume about them?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- That this patient, had they lived, could still have gone on to relapse later. ::ok Right. Censoring only makes sense for a patient who could, in principle, still go on to have the event later. A patient who died without relapsing cannot.
- That relapse and death only need to be statistically independent of each other for the calculation to be valid. ::no
- That the patient's chance of ever relapsing was already zero, so excluding them changes nothing. ::no Both of those miss the point. Independence between relapse and death is not what the naive Kaplan-Meier needs; it needs every censored patient to still be a candidate for the event, which this patient is not. And the naive calculation does not exclude this patient at all: it keeps them in the risk set right up to month 20 and only then drops them, exactly as if they might still have relapsed afterward.

=== step === concept
## The cumulative incidence function shares the probability correctly

Fixing the naive estimate means giving up on treating relapse by itself. Instead, track all three things that can happen to a patient, staying event-free, relapsing, or dying without relapse, as one single model with three possible destinations that share the same probability.

Fit that three-destination model on the same 400 patients and read off each destination's share at the same five months.

```r
# Fit the multi-state Aalen-Johansen estimate: event-free, relapse and death together
cause_factor <- factor(df$cause, 0:2, c("censor", "relapse", "death"))
fit_ms <- survfit(Surv(time, cause_factor) ~ 1, data = df)
cif <- summary(fit_ms, times = c(12, 24, 36, 48, 60))
cbind(month = cif$time, round(cif$pstate, 4))
#>      month   (s0) relapse  death
#> [1,]    12 0.7625  0.1125 0.1250
#> [2,]    24 0.5725  0.1950 0.2325
#> [3,]    36 0.4350  0.2425 0.3225
#> [4,]    48 0.3100  0.3075 0.3825
#> [5,]    60 0.2500  0.3425 0.4075
rowSums(round(cif$pstate, 4))
#> [1] 1 1 1 1 1
```

The column labelled `(s0)` is the survival package's own name for the starting state, state zero, rather than the `censor` label you gave it when you built `cause_factor`. It means exactly what you would expect: the share of patients still event-free at that month.

Read row 3, month 36: 0.4350 of the cohort is still event-free, 0.2425 has relapsed, and 0.3225 has died without relapsing. `rowSums()` confirms every row adds to exactly 1, at every one of the five months, because this model shares the whole cohort's probability across all three destinations instead of looking at relapse in isolation.

That three-column table is the cumulative incidence function for every state at once, built from what is called the Aalen-Johansen estimate, the multi-state version of the same product-limit idea behind the naive Kaplan-Meier curve above. The relapse column is the number this lesson has been after: the true chance of relapsing by each month, with death without relapse properly accounted for instead of assumed away.

=== step === concept
## The gap widens as death without relapse gets more common

The naive estimate and the true cumulative incidence tell two different stories about the same 400 patients. At month 12 they sit close together, 0.1196 against 0.1125, a gap of only 0.0071. But as death without relapse keeps accumulating, that gap does not stay small.

Here are both series plotted together across all five months.

::widget chart-plotter {"data":[{"x":12,"y":0.1196,"fill":"naive 1-KM"},{"x":24,"y":0.2236,"fill":"naive 1-KM"},{"x":36,"y":0.2920,"fill":"naive 1-KM"},{"x":48,"y":0.4053,"fill":"naive 1-KM"},{"x":60,"y":0.4759,"fill":"naive 1-KM"},{"x":12,"y":0.1125,"fill":"true CIF"},{"x":24,"y":0.1950,"fill":"true CIF"},{"x":36,"y":0.2425,"fill":"true CIF"},{"x":48,"y":0.3075,"fill":"true CIF"},{"x":60,"y":0.3425,"fill":"true CIF"}],"geoms":["point","line"],"x":"month","y":"probability","code":{"point":"ggplot(gap_df, aes(month, probability, colour = group)) +\n  geom_point(size = 2.2)","line":"ggplot(gap_df, aes(month, probability, colour = group)) +\n  geom_line(linewidth = 1)"}}

Switch to the line geom and watch the two series pull apart as the months go by. At month 24 the naive estimate reads 0.2236 against a true 0.1950, a gap of 0.0286. By month 36 it is 0.2920 against 0.2425, a gap of 0.0495. By month 48 it is 0.4053 against 0.3075, a gap of 0.0978, and by month 60 it is 0.4759 against 0.3425, a gap of 0.1334, close to nineteen times wider than it was at month 12.

That growth is not a coincidence. Death without relapse keeps happening throughout the 60 months, and every death the naive estimate miscounts as a still-could-relapse censoring adds a little more overcount on top of the last. By month 60, death without relapse (163 patients) has overtaken relapse itself (137 patients) as the cohort's most common outcome, which is exactly when the naive estimate's overcount is largest.

=== step === concept
## Two hazards, two different questions

Relapse has two different hazards attached to it, and they are easy to confuse because they share a name and a unit, events per person-month, but they answer different questions. The group of patients still being watched for an event at a given moment is called that moment's risk set, and the two hazards disagree about who belongs in it.

The cause-specific hazard asks a narrow question: of the patients who are alive and relapse-free right now, how fast are they relapsing? Its risk set holds only patients who have not yet had either event, so the moment a patient dies without relapsing, that patient leaves the risk set for good, exactly as they would if they had relapsed instead.

The subdistribution hazard asks a wider question: of the entire original cohort, what fraction will eventually relapse? To answer that, its risk set keeps a patient even after they die without relapsing. That patient is never going to relapse, but keeping them in the denominator is exactly the bookkeeping that makes the subdistribution hazard transform directly into the cumulative incidence function from two steps back, with no extra correction needed.

Compute both risk sets directly from the data at month 36, alongside the cause-specific hazard itself, and see how different the two risk sets are.

```r
# The cause-specific hazard of relapse, and the two risk sets compared at month 36
n_relapse <- sum(df$cause == 1)
total_person_months <- sum(df$time)
cause_specific_hazard <- n_relapse / total_person_months
data.frame(
  n_relapse = n_relapse,
  total_person_months = round(total_person_months, 1),
  cause_specific_hazard = round(cause_specific_hazard, 4)
)
#>   n_relapse total_person_months cause_specific_hazard
#> 1       137             12944.5                0.0106

cause_specific_risk_set <- sum(df$time > 36)
already_dead_without_relapse <- sum(df$time <= 36 & df$cause == 2)
subdistribution_risk_set <- cause_specific_risk_set + already_dead_without_relapse
data.frame(cause_specific_risk_set, already_dead_without_relapse, subdistribution_risk_set)
#>   cause_specific_risk_set already_dead_without_relapse subdistribution_risk_set
#> 1                      174                          129                      303
```

`total_person_months` adds up every month all 400 patients were followed for, 12944.5 in total. 137 relapses over that many person-months of follow-up gives a cause-specific hazard of 0.0106 per person-month, or about 12.7 per 100 person-years.

At month 36, the cause-specific risk set holds 174 patients, exactly those still alive and relapse-free at that point. The subdistribution risk set is nearly twice as large, 303, because it adds back the 129 patients who had already died without relapsing by month 36 and keeps them sitting in the denominator instead of dropping them out.

A related complication, named here but not built, is frailty: unobserved differences between patients, some frailer than others, that raise a patient's risk of every cause at once instead of singling out one cause the way a true competing risk does. Frailty and competing risks are easy to tangle together, but they are not the same idea.

=== step === widget
## Reading the cumulative incidence bands

Here is the same three-way split, event-free, relapse and death, drawn as stacked bands you can read at any chosen month.

::widget competing-risks {}

This widget draws its own 250-patient cohort rather than the 400-patient transplant data above, built from a single hazard of 0.08 split 60% to relapse and 40% to death. But it stacks the exact same three outcomes, event-free, relapse and death, so the reading skill transfers directly.

Toggle the time point to t = 5, 10 and 20, and read off the three shares at each one. They always sum to 1, for the same reason the transplant cohort's cumulative incidence rows summed to 1 two steps back: every patient has to be in exactly one of the three states at any given time, no more and no less.

=== step === quiz
## Quick check: why the gap is 13 points wide at month 60

By month 60 the naive estimate reads 0.4759 and the true cumulative incidence reads 0.3425, a gap of 0.1334. What explains why the gap has grown to that size by month 60?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- By month 60, death without relapse has become more common than relapse itself, so the naive estimate's overcount keeps compounding the longer follow-up runs. ::ok Right. Every death the naive estimate miscounts as still-could-relapse censoring adds to the overcount, and death without relapse only gets more common as the months go by, which is why the gap keeps growing rather than settling down.
- The cumulative incidence function is less accurate than Kaplan-Meier in large samples. ::no
- The gap is simulation noise that would shrink with more patients. ::no Neither of those matches what is actually happening. The cumulative incidence function is not less accurate; it is the one of the two that correctly shares probability across all three outcomes, which is why it does not overcount. And the gap is not noise: it grows in a predictable, one-directional way as death without relapse accumulates, and running the simulation with more patients would not shrink it, since the overcounting is a property of the naive method itself, not of sample size.

=== step === tryit
## Your turn: compare the two risk sets at a new time point

`df` still holds all 400 patients. Two steps back you compared the cause-specific and subdistribution risk sets at month 36, getting 174 and 303. Do the same comparison at month 48 instead.

```r
# Compare the two risk sets at month 48, straight from df
cause_specific_48 <- NA
cause_specific_48
#> [1] NA

already_dead_48 <- NA
already_dead_48
#> [1] NA

subdistribution_48 <- NA
subdistribution_48
#> [1] NA
```

Replace the first `NA` with `sum(df$time > 48)`, the count of patients still at risk of relapse past month 48. Replace the second `NA` with `sum(df$time <= 48 & df$cause == 2)`, the count already dead without relapse by month 48. Replace the third `NA` with the sum of those two. Press Check when you have all three.

::check {"regex": "(?=[\\s\\S]*sum[(]df\\$time\\s*>\\s*48[)])(?=[\\s\\S]*sum[(]df\\$time\\s*<=\\s*48\\s*&\\s*df\\$cause\\s*==\\s*2[)])(?=[\\s\\S]*cause_specific_48\\s*\\+\\s*already_dead_48)", "gate": true, "difficulty": "intermediate", "ok": "Right. cause_specific_48 is 124, already_dead_48 is 153, and their sum, subdistribution_48, is 277, more than twice the cause-specific count of 124. That is the same pattern you saw at month 36, where 174 against 303 was also roughly a doubling.", "no": "Count directly from df: cause_specific_48 is sum(df$time > 48), already_dead_48 is sum(df$time <= 48 & df$cause == 2), and subdistribution_48 is cause_specific_48 + already_dead_48."}
::solution
```r
# Compare the two risk sets at month 48, straight from df
cause_specific_48 <- sum(df$time > 48)
cause_specific_48
#> [1] 124

already_dead_48 <- sum(df$time <= 48 & df$cause == 2)
already_dead_48
#> [1] 153

subdistribution_48 <- cause_specific_48 + already_dead_48
subdistribution_48
#> [1] 277
```

124 patients are still being watched for a relapse past month 48. The other risk set adds back the 153 who had already died without relapsing by then, giving 277, more than twice the cause-specific count, the same doubling pattern you already saw at month 36.

=== step === concept
## References
::prose-only the references are a text list of sources, not a visual

- [Survival Analysis: Techniques for Censored and Truncated Data](https://doi.org/10.1007/b97377) - Klein and Moeschberger (2003), 2nd edition, Springer. Its dedicated competing-risks chapter covers the bone marrow transplant relapse-versus-death setting this lesson's running example is modeled on.
- [The Statistical Analysis of Failure Time Data](https://doi.org/10.1002/9781118032985) - Kalbfleisch and Prentice (2002), 2nd edition, Wiley. Covers the cumulative incidence function and cause-specific hazards for competing risks.
- [A Proportional Hazards Model for the Subdistribution of a Competing Risk](https://doi.org/10.1080/01621459.1999.10474144) - Fine and Gray (1999), Journal of the American Statistical Association, 94(446), 496-509. The original subdistribution-hazard paper.
- [Tutorial in biostatistics: competing risks and multi-state models](https://doi.org/10.1002/sim.2712) - Putter, Fiocco and Geskus (2007), Statistics in Medicine, 26(11), 2389-2430.
- [Multi-state models and competing risks](https://search.r-project.org/CRAN/packages/survival/vignettes/compete.pdf) - Therneau, Crowson and Atkinson. CRAN vignette for the survival package, documenting the survfit() syntax used in this lesson directly.

=== step === complete
## Recap: competing risks, and what you can do with them now

A competing event like death without relapse is not ordinary censoring, because it rules out the event of interest for good instead of just hiding it past the end of follow-up. Treating it as censoring, the way the naive 1-KM estimate did, assumes a dead patient could still have gone on to relapse, and that assumption is exactly why it overstated the true chance of relapse: 0.4759 against a true 0.3425 by month 60.

The fix was a single multi-state `survfit()` call that shares probability correctly across all three destinations, event-free, relapse and death, so every row sums to 1 instead of overcounting relapse. The gap between the naive estimate and that true cumulative incidence grew from 0.0071 at month 12 to 0.1334 at month 60, widening as death without relapse kept becoming the cohort's more common outcome.

The cause-specific hazard and the subdistribution hazard both describe relapse, but they disagree about who stays in the risk set: the cause-specific hazard drops a patient the moment they die without relapsing, while the subdistribution hazard keeps them in the denominator, which is exactly what lets it match the cumulative incidence directly. Knowing which of the two a number in front of you is actually answering is the difference between reading a competing-risks analysis correctly and overstating it the same way the naive estimate did.

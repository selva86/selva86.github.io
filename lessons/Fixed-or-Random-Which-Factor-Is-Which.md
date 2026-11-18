---
title: "ANOVA and Multiple Comparisons Lesson 4: Fixed or random, which factor is which"
catalog_blurb: "Why treating a randomly sampled factor as fixed makes your confidence intervals too narrow."
description: "Four fixed doses tested across twenty random clinics, analysed two ways, so you see exactly why the random factor changes the F-test and the standard error."
keywords: "fixed effects, random effects, expected mean squares, F-test denominator, dose-by-clinic interaction, intraclass correlation, mixed-effects model, partial pooling, two-way ANOVA, clinical trial design"
post_type: "LESSON"
curriculum_id: "4.50.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "4"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "Asking-a-Specific-Question-of-Your-Groups.html"
course_prev: "When-an-Effect-Depends-on-Another.html"
---

=== step === cover
## Fixed or random, which factor is which

Today let's work out which parts of a study design you get to call fixed on purpose, and which ones are genuinely random, because that one decision changes which statistical test is the correct one to run.

A pharmaceutical company is testing a new blood pressure drug. It picks four exact doses to test: 0 milligrams, which is the placebo, then 10, 20 and 30 milligrams. The trial runs at twenty clinics, drawn at random from a much larger pool of clinics that could have taken part.

Each clinic enrols two patients at every one of the four doses, 160 patients in all. Every patient's result is the same measurement: the drop in diastolic blood pressure, in mmHg, two weeks after starting treatment.

Here is each patient's drop in blood pressure, grouped by the dose they received, pooled across all twenty clinics.

::widget chart-plotter {"data":[{"x":"0 mg","y":4.72},{"x":"0 mg","y":4.55},{"x":"0 mg","y":3.33},{"x":"0 mg","y":6.46},{"x":"0 mg","y":2.56},{"x":"0 mg","y":3.41},{"x":"0 mg","y":4.18},{"x":"0 mg","y":4.51},{"x":"0 mg","y":1.44},{"x":"0 mg","y":1.36},{"x":"0 mg","y":2.17},{"x":"0 mg","y":2.32},{"x":"0 mg","y":1.26},{"x":"0 mg","y":1.24},{"x":"0 mg","y":-0.69},{"x":"0 mg","y":0.71},{"x":"0 mg","y":6.94},{"x":"0 mg","y":10.48},{"x":"0 mg","y":1.57},{"x":"0 mg","y":3.22},{"x":"0 mg","y":1.56},{"x":"0 mg","y":1.59},{"x":"0 mg","y":4.1},{"x":"0 mg","y":2.87},{"x":"0 mg","y":1.62},{"x":"0 mg","y":1.15},{"x":"0 mg","y":1.99},{"x":"0 mg","y":0.44},{"x":"0 mg","y":1.77},{"x":"0 mg","y":3.32},{"x":"0 mg","y":6.09},{"x":"0 mg","y":4.92},{"x":"0 mg","y":-0.43},{"x":"0 mg","y":0.81},{"x":"0 mg","y":1.45},{"x":"0 mg","y":-1.34},{"x":"0 mg","y":-0.44},{"x":"0 mg","y":1.01},{"x":"0 mg","y":1.41},{"x":"0 mg","y":1.87},{"x":"10 mg","y":1.7},{"x":"10 mg","y":0.81},{"x":"10 mg","y":0.89},{"x":"10 mg","y":1.35},{"x":"10 mg","y":1.87},{"x":"10 mg","y":3.55},{"x":"10 mg","y":2.22},{"x":"10 mg","y":2.27},{"x":"10 mg","y":2.79},{"x":"10 mg","y":0.86},{"x":"10 mg","y":2.09},{"x":"10 mg","y":0.43},{"x":"10 mg","y":7.04},{"x":"10 mg","y":5.45},{"x":"10 mg","y":3.37},{"x":"10 mg","y":2.52},{"x":"10 mg","y":6.81},{"x":"10 mg","y":5.94},{"x":"10 mg","y":2.38},{"x":"10 mg","y":4.38},{"x":"10 mg","y":4.85},{"x":"10 mg","y":3.86},{"x":"10 mg","y":8.5},{"x":"10 mg","y":7.92},{"x":"10 mg","y":2.83},{"x":"10 mg","y":3.76},{"x":"10 mg","y":-0.2},{"x":"10 mg","y":1.39},{"x":"10 mg","y":3.6},{"x":"10 mg","y":4.49},{"x":"10 mg","y":3.98},{"x":"10 mg","y":5.15},{"x":"10 mg","y":1.62},{"x":"10 mg","y":5.4},{"x":"10 mg","y":1.53},{"x":"10 mg","y":0.41},{"x":"10 mg","y":0.25},{"x":"10 mg","y":2.56},{"x":"10 mg","y":2.8},{"x":"10 mg","y":2.26},{"x":"20 mg","y":5.29},{"x":"20 mg","y":4.48},{"x":"20 mg","y":2.68},{"x":"20 mg","y":2.6},{"x":"20 mg","y":4.48},{"x":"20 mg","y":3.31},{"x":"20 mg","y":6.02},{"x":"20 mg","y":5.85},{"x":"20 mg","y":-0.96},{"x":"20 mg","y":-1.79},{"x":"20 mg","y":4.87},{"x":"20 mg","y":4.26},{"x":"20 mg","y":4.51},{"x":"20 mg","y":2.81},{"x":"20 mg","y":2.86},{"x":"20 mg","y":5.11},{"x":"20 mg","y":6.92},{"x":"20 mg","y":7.12},{"x":"20 mg","y":0.32},{"x":"20 mg","y":-1.53},{"x":"20 mg","y":4.11},{"x":"20 mg","y":6.68},{"x":"20 mg","y":8.56},{"x":"20 mg","y":9.54},{"x":"20 mg","y":-1.73},{"x":"20 mg","y":-1.48},{"x":"20 mg","y":1.41},{"x":"20 mg","y":1.03},{"x":"20 mg","y":1.1},{"x":"20 mg","y":1.6},{"x":"20 mg","y":3.22},{"x":"20 mg","y":6.78},{"x":"20 mg","y":2.85},{"x":"20 mg","y":2.64},{"x":"20 mg","y":2.69},{"x":"20 mg","y":2.19},{"x":"20 mg","y":-1.95},{"x":"20 mg","y":-0.18},{"x":"20 mg","y":5.25},{"x":"20 mg","y":4.07},{"x":"30 mg","y":8.31},{"x":"30 mg","y":7.5},{"x":"30 mg","y":-0.46},{"x":"30 mg","y":-1.06},{"x":"30 mg","y":6.08},{"x":"30 mg","y":5.42},{"x":"30 mg","y":2.43},{"x":"30 mg","y":1.61},{"x":"30 mg","y":3.8},{"x":"30 mg","y":5.9},{"x":"30 mg","y":2.22},{"x":"30 mg","y":3.56},{"x":"30 mg","y":7.15},{"x":"30 mg","y":7.96},{"x":"30 mg","y":2.14},{"x":"30 mg","y":2},{"x":"30 mg","y":8.68},{"x":"30 mg","y":7.17},{"x":"30 mg","y":4.57},{"x":"30 mg","y":3.26},{"x":"30 mg","y":7.3},{"x":"30 mg","y":9.2},{"x":"30 mg","y":10.25},{"x":"30 mg","y":10.24},{"x":"30 mg","y":0.28},{"x":"30 mg","y":4.06},{"x":"30 mg","y":5.62},{"x":"30 mg","y":4.47},{"x":"30 mg","y":2.62},{"x":"30 mg","y":0.78},{"x":"30 mg","y":3.38},{"x":"30 mg","y":4.64},{"x":"30 mg","y":1.87},{"x":"30 mg","y":3.4},{"x":"30 mg","y":0.8},{"x":"30 mg","y":-1.77},{"x":"30 mg","y":-1.79},{"x":"30 mg","y":-0.93},{"x":"30 mg","y":5.74},{"x":"30 mg","y":6.44}],"geoms":["boxplot"],"x":"dose","y":"drop"}

The boxes climb as the dose goes up. The question this lesson answers is whether that climb is something you can trust, or something that depends on which twenty clinics happened to run the trial.

=== step === concept
## What makes a factor fixed, and what makes it random
::prose-only worked through the running example's own doses and clinics

A factor in a study design is fixed when you chose its exact levels on purpose, and the question you care about is only ever about those same levels. The four doses in this trial, 0, 10, 20 and 30 milligrams, are fixed. The company picked these exact amounts deliberately, and the result it wants is about these four doses, not some other set a different company might have tried.

A factor is random when its levels are themselves a sample, drawn from a larger population you want to generalize past. The twenty clinics are random. They were drawn from a much bigger pool of clinics that could have taken part, and the company does not care about these twenty clinics specifically. It cares about how the drug performs across clinics in general.

Here is a simple test that tells the two apart. Imagine running the whole trial again from scratch. Would you pick the same levels on purpose, or would a fresh random draw hand you different ones?

For dose, you would pick the same four amounts again, because those are the exact doses the company wants data on. For clinic, a second trial would draw a different random set of twenty clinics, not necessarily the same twenty. That difference, the same levels on purpose against a fresh random draw of them, is what separates a fixed factor from a random one.

This sounds like a small distinction. It is not: it decides which number belongs in the denominator of an F-test.

=== step === concept
## The shared dataset: four doses crossed with twenty clinics

Before either analysis can run, here is the dataset both of them will use. Twenty clinics each enrol two patients at every one of the four doses, 20 times 4 times 2, which is 160 patients. Every patient's outcome is the same measurement: the drop in diastolic blood pressure, in mmHg.

The code below builds this dataset from scratch. It gives every dose its own typical effect, every clinic its own tendency to run a little higher or lower than average, and a dose-by-clinic interaction: a few clinics respond more sharply to a higher dose than others do, and a few respond less, for reasons this dataset does not try to explain. On top of all of that sits ordinary patient-to-patient noise. `set.seed(42)` fixes these numbers, and they are the real numbers every later step in this lesson reads off.

```r
# Build 160 patients: 4 doses x 20 clinics x 2 patients each
set.seed(42)
dose_levels <- c(0, 10, 20, 30)
dose_mean   <- c(2.0, 2.9, 3.5, 3.9)
n_dose <- 4; n_clinic <- 20; n_rep <- 2

clinic_effect <- rnorm(n_clinic, 0, 1.4)
interaction_effect <- matrix(rnorm(n_dose * n_clinic, 0, 1.7), nrow = n_dose, ncol = n_clinic)

dose   <- rep(dose_levels, each = n_clinic * n_rep)
clinic <- rep(rep(1:n_clinic, each = n_rep), times = n_dose)

drop  <- numeric(160)
noise <- rnorm(160, 0, 1.1)
for (i in 1:160) {
  di <- which(dose_levels == dose[i])
  ci <- clinic[i]
  drop[i] <- dose_mean[di] + clinic_effect[ci] + interaction_effect[di, ci] + noise[i]
}
bp <- data.frame(dose = factor(dose), clinic = factor(clinic), drop = drop)

dim(bp)
#> [1] 160   3
head(transform(bp, drop = round(drop, 2)))
#>   dose clinic drop
#> 1    0      1 4.72
#> 2    0      1 4.55
#> 3    0      2 3.33
#> 4    0      2 6.46
#> 5    0      3 2.56
#> 6    0      3 3.41
```

Each row is one patient: which of the four doses they received, which of the twenty clinics they attended, and how much their diastolic pressure dropped.

=== step === concept
## Analysing it as if clinic were just another fixed factor

Run a standard two-way ANOVA on this data, treating dose and clinic exactly alike, and here is what it reports.

```r
# Treat clinic as an ordinary fixed factor and read off the F-ratio for dose
fit <- aov(drop ~ dose * clinic, data = bp)
summary(fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> dose         3   51.3   17.09  15.102 7.09e-08 ***
#> clinic      19  635.8   33.46  29.568  < 2e-16 ***
#> dose:clinic 57  422.1    7.41   6.544 2.71e-14 ***
#> Residuals   80   90.5    1.13                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Four numbers matter here. The mean square for dose is 17.091, on 3 degrees of freedom. The mean square for the dose-by-clinic interaction is 7.405, on 57 degrees of freedom. And the residual mean square, the ordinary patient-to-patient noise left over once dose, clinic and their interaction are all accounted for, is 1.132, on 80 degrees of freedom.

The F-ratio R printed for dose divides the first of those by the last: 17.091 divided by 1.132 is F(3, 80) = 15.10, with p below 0.0001. By the usual 0.05 cutoff, that is a strongly significant result. Dose, it seems, has a real effect on the drop in blood pressure.

That F-ratio is correct arithmetic. R did exactly what `aov()` always does: it tested every term against the residual mean square, the same way it would if clinic were a second factor the company had deliberately chosen, the way dose is. The trouble is that clinic is not that kind of factor. It is a random sample of clinics, and a random factor changes which mean square belongs in the denominator.

=== step === concept
## Analysing it with clinic as a random sample

Here are the same mean squares, with the correct denominator picked out for a random clinic effect, and the F-ratio recomputed.

```r
# Pull the mean squares from the table, then test dose against the interaction instead of the residual
tab <- summary(fit)[[1]]
ms_dose  <- tab[1, "Mean Sq"]
ms_inter <- tab[3, "Mean Sq"]

F_random <- ms_dose / ms_inter
p_random <- pf(F_random, df1 = 3, df2 = 57, lower.tail = FALSE)
round(c(F = F_random, p = p_random), 4)
#>      F      p 
#> 2.3079 0.0861 
```

Imagine running this exact trial again, drawing a fresh random sample of twenty different clinics. The patient-to-patient noise, 1.132, would look about the same: that is just how much two patients at the same dose and the same clinic differ from each other, and a new sample of clinics does not change that. But the dose-by-clinic interaction mean square, 7.405, would come out differently, because which clinics respond more sharply to a higher dose and which respond less is exactly the thing that changes when the sample of clinics changes.

That is why, once clinic is random, dose has to be tested against the interaction mean square instead of the residual. The interaction mean square is the piece that carries the extra uncertainty a fresh sample of clinics would introduce. The residual does not.

Divide 17.091 by 7.405 instead of by 1.132, and F drops from 15.10 to F(3, 57) = 2.31. The p-value rises to 0.086. At the usual 0.05 cutoff, dose is no longer significant. The exact same 160 patients and the exact same drug now sit behind a defensible analysis that no longer supports the company's claim.

=== step === concept
## Why the standard error got wider

The same swap shows up in a number that matters just as much as the F-test: the standard error of a dose mean. Each of the four dose means averages 40 patients, 20 clinics times 2 patients per clinic. Treating clinic as fixed, that standard error is the square root of the residual mean square over 40: the square root of 1.132 divided by 40, which is 0.168 mmHg. Treating clinic as random, it is the square root of the interaction mean square over 40 instead: the square root of 7.405 divided by 40, which is 0.430 mmHg.

0.430 is 2.56 times wider than 0.168. That is not a rounding difference. It is the honest price of admitting that a fresh sample of twenty clinics would have given a somewhat different answer.

The fixed-clinic standard error only counts patient-to-patient noise. Computing it that way treats the twenty clinics tested as if they were the only twenty clinics that matter, which is exactly what a random factor does not let you do.

This same force, a standard error that looks too narrow once you stop pretending a random factor is fixed, shows up in any study built from patients inside clinics, students inside classrooms, or measurements inside subjects. The widget below runs its own two-arm version of that structure. It is not the twenty clinics above; it has its own 20 clusters of 8 patients each, 160 in total, matching this trial's size by coincidence. Its dial raises the intraclass correlation, a number between 0 and 1 for how much more alike two patients from the *same* cluster are than two patients from different clusters.

::widget cluster-icc-sim {"k":20,"m":8}

At an intraclass correlation of zero, all four standard errors agree, because there is nothing cluster-specific to correct for. Raise the dial, and the ordinary one keeps reporting the same narrow number while the cluster-aware ones grow, the same widening you just computed by hand for this trial's own clinics, 0.168 to 0.430.

=== step === widget
## The mixed-effects model, built for exactly this situation

A mixed-effects model is the tool built for exactly this situation. Instead of an analyst picking a denominator by hand, it estimates the dose effect and the clinic-to-clinic variance directly, in one fit, which is what `lme4::lmer()` does when you give it a random effect for clinic. One thing it does along the way, called partial pooling, is worth seeing on its own before anything gets fitted.

This widget's own eight clinics, labelled A through H, stand in for the twenty above. They are a smaller, separate, hardcoded dataset built only to show the pooling mechanism plainly, not literal data from this trial. Each clinic starts out with its own raw mean, computed from as few as two patients for clinic E, or as many as forty for clinic D.

::widget shrinkage-pool {}

With no pooling, clinic E's raw mean swings far from the group's grand mean, on almost no evidence: two patients are not enough to trust on their own. With complete pooling, every clinic collapses to one shared number, throwing away whatever is genuinely different between clinics. Partial pooling, in between, pulls clinic E hard toward the grand mean while barely touching clinic D, because clinic D already has forty patients backing up its own raw mean. That is what a mixed-effects model does automatically to a random clinic effect: small, noisy clinics borrow strength from the whole group, and large, well-measured ones barely move.

=== step === quiz
## Quick check: why the standard error got wider, and what fixes it

You just saw the honest standard error for a dose mean grow from 0.168 to 0.430 mmHg once clinic's randomness was properly counted. Why does that happen, and what tool is built to handle it directly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The wider standard error is just noise the simulation added, not a real effect in the data. ::no
- Treating clinic as fixed drops the dose-by-clinic interaction variance out of the standard error, understating how much a fresh sample of clinics would shift a dose mean. The mixed-effects model is built to estimate that variance directly. ::ok Exactly right. The interaction mean square is the piece a fresh sample of clinics would change, and a mixed-effects model estimates the clinic variance behind it directly, instead of leaving it out.
- The random analysis simply had fewer degrees of freedom, 57 against 80, so collecting more patients per clinic would close the gap. ::no
- Entering clinic as a fixed blocking factor in the model already corrects for this. ::no None of the other readings survive. The gap is not simulation noise, since it comes straight from the algebra of expected mean squares. More patients per clinic would not close it either, since the issue is which clinics you sampled, not how many patients sit inside each one. And entering clinic as a fixed blocking factor is exactly the mistake this lesson just walked through: it tests dose against the residual, the same narrow comparison that gave the too-confident answer in the first place. Only treating clinic as the random factor it is, and testing against the interaction mean square, fixes it.

=== step === quiz
## Quick check: fixed, random, and the right denominator

A lab wants to know whether an assay's reading depends on which machine runs it. It owns three specific machines and tests on only those three, chosen on purpose: a fixed factor. Each machine is run by ten technicians, drawn at random from the lab's much larger pool of technicians: a random factor. What should the F-test for the machine effect use as its denominator?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The residual, or within-cell, mean square, the same denominator you would use if both machine and technician were fixed. ::no
- The machine-by-technician interaction mean square, because that is the piece that would come out differently with a fresh sample of technicians. ::ok Right. Technician is the random factor here, so the machine effect, which is crossed with it, has to be tested against their interaction, not the residual.
- The technician mean square, since technician is the random factor in this design. ::no
- There is nothing valid to test here, because a fixed factor crossed with a random one cannot be compared at all. ::no A fixed factor crossed with a random one can absolutely be tested, just not against the residual. The residual only carries noise within one machine-technician combination, not the extra wobble a fresh sample of technicians would add. Technician's own mean square answers a different question, how much technicians vary overall, not whether machine matters. The interaction is the one piece that would change if you drew a new sample of technicians, which is exactly why machine belongs over it.

=== step === tryit
## Your turn: compute the honest F-ratio

`ms_dose`, `ms_interaction` and `ms_residual` are the three mean squares you just saw. Edit the line below so `F_dose` divides by the correct one for a random clinic effect.

```r
# Edit the line below so F_dose uses the correct mean square for a random clinic effect
ms_dose        <- 17.091
ms_interaction <- 7.405
ms_residual    <- 1.132

F_dose <- ms_dose / ms_residual
F_dose
```
::check {"regex": "ms_dose\\s*/\\s*(ms_interaction|7\\.405)", "gate": true, "difficulty": "beginner", "ok": "Right: F_dose comes out at 2.308, matching the 2.31 you already saw once the interaction mean square is the denominator.", "no": "Divide ms_dose by ms_interaction, not ms_residual. Dividing by the residual gives back the fixed-clinic answer, 15.10, the one this lesson just showed is too optimistic."}
::solution
```r
# Divide ms_dose by the mean square that would change with a fresh sample of clinics
ms_dose        <- 17.091
ms_interaction <- 7.405
ms_residual    <- 1.132

F_dose <- ms_dose / ms_interaction
F_dose
#> [1] 2.308035
```

That 2.308 matches the F you already saw once the correct denominator is in play.

=== step === concept
## References

- Montgomery, D.C. (2017). "Design and Analysis of Experiments." Wiley. Expected mean squares for Model II (random) and Model III (mixed) designs, the formal basis for swapping the F-test's denominator.
- Searle, S.R., Casella, G. and McCulloch, C.E. (1992). "Variance Components." Wiley. The standard reference for random-effects ANOVA and how its expected mean squares are derived.
- Kutner, M.H., Nachtsheim, C.J., Neter, J. and Li, W. (2004). "Applied Linear Statistical Models." McGraw-Hill. The chapter deriving F-tests for random and mixed-effects models by hand.
- Pinheiro, J.C. and Bates, D.M. (2000). "Mixed-Effects Models in S and S-PLUS." Springer, and [the lme4 package](https://cran.r-project.org/web/packages/lme4/index.html) it led to, the mixed-effects model this lesson names but does not fit.
- [R documentation: aov](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the function fitting every two-way ANOVA table in this lesson.
- [R documentation: the F distribution](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Fdist.html) - R Core Team, the `pf()` function used to turn the recomputed F-ratio into a p-value.

=== step === complete
## What fixed and random decide, and where it goes from here
::prose-only the step is a one-screen recap in prose; no new visual is needed beyond what earlier steps already showed

You have now seen the same 160 patients support two different, defensible F-tests for the exact same dose effect, and only one of them answers the question this trial actually asked.

- Dose is fixed: the company chose these four amounts on purpose, and every conclusion is only ever about these four doses.
- Clinic is random: the twenty clinics were drawn from a larger pool, so the real interest is in dosing in general, not in these twenty clinics alone.
- Treating clinic as fixed anyway tests dose against the residual mean square and returns F(3, 80) = 15.10, p below 0.0001.
- Treating clinic as what it actually is, random, tests dose against the dose-by-clinic interaction mean square instead, and F(3, 57) drops to 2.31, p = 0.086: no longer significant at the usual 0.05 cutoff.
- The honest standard error of a dose mean grows from 0.168 to 0.430 mmHg, 2.56 times wider, once a fresh sample of clinics is allowed to matter.

[KEY INSIGHT]
Whether a factor is fixed or random is a question about what you want your answer to generalize to, decided before you ever open the data, not something the arithmetic can discover on its own.

The mixed-effects model is the tool built for exactly this situation: instead of a denominator picked by hand, it estimates the dose effect and the clinic-to-clinic variance directly, in one fit. A model that estimates both of those variance components at once, rather than borrowing one factor's mean square as a stand-in for the other, is what a reader meets next.

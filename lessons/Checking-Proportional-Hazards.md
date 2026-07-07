---
title: "Survival Analysis Lesson 4: Checking Proportional Hazards"
catalog_blurb: "How to tell whether one hazard ratio holds for the whole follow-up."
description: "Test the proportional hazards assumption behind a Cox model in R: read Schoenfeld residuals and cox.zph, spot a violation, and fit time-varying hazard ratios."
keywords: "proportional hazards assumption, Schoenfeld residuals, cox.zph, checking proportional hazards in R, time-varying covariates, non-proportional hazards, survival analysis, Cox model diagnostics"
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

In Lesson 3 Dr. Rao's Cox model handed her one clean number: a hazard ratio of 0.36 for her new drug, still protective after adjusting for age. One number for the whole two years. It was only trustworthy because of a quiet promise buried in the model: that the drug's edge stays a fixed multiple of the baseline risk at every moment of follow-up.

This lesson tests that promise. You will see what happens when it fails, learn the residual that makes the failure visible, run the one-line test that puts a p-value on it, and repair a broken model so it tells the truth about time.

By the end of this lesson you will be able to:

- Say what proportional hazards actually claims, and recognize a violation when you see one
- Read a Schoenfeld residual plot and run `cox.zph()` to get an honest verdict, covering which variable is at fault
- Fix a violation by letting a hazard ratio change over time, and know when to stratify instead

**Prerequisites:** [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model \(h(t\mid x)=h_0(t)\exp(\beta'x)\), the hazard ratio \(\exp(\beta)\), and reading `coxph` output), plus [Lesson 1](Survival-Data-and-Censoring.html) (the hazard, censoring, `Surv()`) and [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the at-risk set). You can run R and read a coefficient table.

::widget hazard-ratio {}

=== step === concept
::eyebrow The promise you are about to test
## What proportional hazards really claims

Start with the assumption itself, stated plainly. A hazard ratio compares two groups' risk-of-the-moment. **Proportional hazards** is the claim that this ratio is one fixed number that never changes with time. Surgery patients, say, might carry \(\text{HR}=1.5\) times the hazard of medical patients, and the claim is that it is 1.5 at month 1, at month 12, and at month 30, forever.

Written with the two hazards, for a covariate value that raises the log-hazard by \(\beta\):

\[ \frac{h_1(t)}{h_0(t)} = e^{\beta} \quad\text{for every time } t. \]

The \(t\) has dropped out of the right side. That is the whole assumption: the ratio has no \(t\) in it. And it has a clean visual consequence for survival curves, the one you toggled on the cover. If one hazard is a constant multiple of the other, then one survival curve is the other raised to a power:

\[ S_1(t) = S_0(t)^{\text{HR}}. \]

Raising a curve that lives between 0 and 1 to a power pulls it up (if \(\text{HR}<1\)) or down (if \(\text{HR}>1\)), but it can never make the two curves touch or swap places. Under proportional hazards, **the survival curves never cross.**

[KEY INSIGHT]
Proportional hazards is a promise about time: one group's risk stays the same multiple of the other's from start to finish. The single hazard ratio you report in a paper is only meaningful if that promise holds. If it does not, the number is an average over a story that changed, and this lesson is about catching exactly that.

=== step === concept
::eyebrow A treatment whose benefit flips
## When the assumption breaks

Dr. Rao's next question is not about a drug. Her registry compares **surgery** against **medical therapy** for the same heart condition, and here the promise is in real danger. Surgery is dangerous up front: the operation itself kills some patients in the first few months. But the patients who come through it do very well for years afterward. Medical therapy is the mirror image: gentle at first, but the underlying disease keeps taking a steady toll.

So surgery's hazard is *higher* than medical therapy's early on and *lower* than it later. The ratio flips. That is a proportional-hazards violation in its purest form, and it shows up as survival curves that cross. Let us build that cohort and look. We create all 320 patients right here, in this session:

```r
library(survival)
set.seed(101)

# 320 patients, surgery vs medical therapy. Surgery is risky in the first
# 6 months (the operation), then protective; medical therapy has a lower,
# steadier hazard. Age raises the hazard in both periods, proportionally.
n        <- 320
age      <- round(rnorm(n, 63, 9))
surgery  <- rbinom(n, 1, 0.5)                          # 1 = surgery, 0 = medical
age_mult <- exp(0.045 * (age - 63))
h_early  <- ifelse(surgery == 1, 0.070, 0.022) * age_mult   # hazard, months 0 to 6
h_late   <- ifelse(surgery == 1, 0.006, 0.028) * age_mult   # hazard, after month 6

# draw a survival time from this two-piece (piecewise-exponential) hazard
target  <- -log(runif(n))                              # a unit-exponential threshold
cum6    <- h_early * 6                                  # cumulative hazard by month 6
event_t <- ifelse(target <= cum6,
                  target / h_early,                     # death within the early window
                  6 + (target - cum6) / h_late)         # death later
time    <- pmin(event_t, 36)                            # follow-up capped at 36 months
status  <- as.integer(event_t <= 36)                   # 1 = died, 0 = censored

cohort <- data.frame(
  time   = round(time, 1),
  status = status,
  arm    = factor(ifelse(surgery == 1, "surgery", "medical"), levels = c("medical", "surgery")),
  age    = age
)
table(cohort$arm, cohort$status)                        # deaths (1) and censored (0) per arm
#>          
#>            0   1
#>   medical  58 115
#>   surgery  83  64
```

Now read the survival curves as a table of numbers. Watch the surgery figure start **below** medical therapy (the operation is dangerous) and end **above** it (its survivors thrive):

```r
km <- survfit(Surv(time, status) ~ arm, data = cohort)
km_at <- summary(km, times = c(2, 6, 12, 18, 24))
data.frame(arm = sub("arm=", "", km_at$strata), month = km_at$time, survival = round(km_at$surv, 2))
#>        arm month survival
#> 1  medical     2     0.95
#> 2  medical     6     0.84
#> 3  medical    12     0.71
#> 4  medical    18     0.58
#> 5  medical    24     0.47
#> 6  surgery     2     0.86
#> 7  surgery     6     0.66
#> 8  surgery    12     0.65
#> 9  surgery    18     0.64
#> 10 surgery    24     0.62
```

At month 6 surgery survival is 0.66 against medical therapy's 0.84: surgery is losing badly. By month 24 it is 0.62 against 0.47: surgery is winning comfortably. The two curves cross somewhere around month 14. No single hazard ratio can describe a gap that starts negative and ends positive.

=== step === concept
::eyebrow One hazard ratio hides the story
## Fit a Cox model and it papers over the flip

Watch what a standard Cox model does with this data. It does not complain. It dutifully returns one hazard ratio for surgery, averaged over the whole crossing story:

```r
cox_fit <- coxph(Surv(time, status) ~ arm + age, data = cohort)
summary(cox_fit)
#>   n= 320, number of events= 179
#>
#>                 coef exp(coef)  se(coef)      z Pr(>|z|)
#> armsurgery -0.419069  0.657659  0.157232 -2.665  0.00769 **
#> age         0.047265  1.048400  0.009269  5.099 3.41e-07 ***
#>
#>            exp(coef) exp(-coef) lower .95 upper .95
#> armsurgery    0.6577     1.5205    0.4832     0.895
#> age           1.0484     0.9538    1.0295     1.068
#>
#> Concordance= 0.601  (se = 0.022 )
```

The model reports \(\text{HR}=0.66\) for surgery, with a confidence interval below 1 and a significant p-value. Taken at face value it reads "surgery lowers the hazard by about a third." That summary is not just imprecise, it is **actively misleading**. Surgery does not gently lower risk by a third across the board. It roughly triples risk in the first six months and then cuts it to a small fraction. The 0.66 is the numerical average of a harm and a benefit that never coexisted, a compromise that describes no patient at any time.

[WARNING]
A Cox model will always hand you a hazard ratio, even when a single ratio is a fiction. The model does not know whether the proportional-hazards promise holds; checking it is your job, not the software's. Everything from here is how to do that job.

=== step === quiz
::eyebrow Check yourself
## Which picture is a violation?

You plot two arms' Kaplan-Meier survival curves to eyeball the proportional-hazards assumption. Which pattern is a clear sign that the assumption is broken?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The curves cross: one arm survives better early, the other better later ::ok Right. Crossing means the hazard ratio has flipped from above 1 to below 1 (or the reverse), and one constant multiplier can never do that. It is the textbook signature of non-proportional hazards.
- The curves run roughly parallel with a steady gap between them ::no A steady, consistent separation is exactly what proportional hazards predicts, not a violation: the two arms keep the same risk ratio the whole way through.
- One curve stays entirely above the other for all of follow-up ::no One curve sitting above the other, never touching, is consistent with a constant hazard ratio. That is precisely the never-crossing picture from the cover widget, the assumption HOLDING, not failing.
- Both curves eventually descend toward zero survival ::no Given long enough follow-up almost every survival curve trends toward zero. That says nothing about whether the two hazards stay proportional along the way.

=== step === concept
::eyebrow A clue at every death
## Schoenfeld residuals: one clue per death

To test the assumption we need something more sensitive than eyeballing curves. Schoenfeld residuals are that something. They give one small clue at each death.

Here is the idea in words first. Freeze the study at the exact moment a patient dies. There is a set of patients still at risk (alive, uncensored), the same at-risk set you built in Lesson 2. The Cox model, using its fitted coefficients, has an *expectation* for the average covariate value among whoever was about to die: risk-weighted, so higher-risk patients count more. The **Schoenfeld residual** for a covariate is simply the covariate value of the patient who *actually* died, minus that expected value.

For covariate \(x_k\), at the death happening at time \(t_i\):

\[ r_{ik} = x_{k}(\text{the patient who died at } t_i) \; - \; \bar{x}_k(t_i), \qquad \bar{x}_k(t_i) = \frac{\sum_{j \in R(t_i)} x_{kj}\, e^{\beta' x_j}}{\sum_{j \in R(t_i)} e^{\beta' x_j}}. \]

Read the pieces: \(R(t_i)\) is the at-risk set at that death, \(e^{\beta' x_j}\) is patient \(j\)'s risk score from Lesson 3, and \(\bar{x}_k(t_i)\) is therefore the risk-weighted average covariate value the model expected. A residual near zero means "no surprise, the patient who died looked like the model expected." Under a correct proportional-hazards model these residuals have mean zero and, crucially, **no trend over time**. If the effect of a covariate drifts as time passes, the residuals drift with it.

That is not a claim to take on faith. Compute the residuals for our model and average the surgery column separately for early deaths and late deaths:

```r
sch <- residuals(cox_fit, type = "schoenfeld")
dim(sch)                                            # one row per death, one column per covariate
#> [1] 179   2

death_time <- as.numeric(rownames(sch))             # each residual is stamped with its death time
round(mean(sch[death_time < 6,  "armsurgery"]), 3)  # deaths in the first 6 months
#> [1] 0.337
round(mean(sch[death_time > 12, "armsurgery"]), 3)  # deaths after 12 months
#> [1] -0.255
```

Surgery is coded 1 and medical 0, so a *positive* surgery residual means the patient who died was, more often than the model expected, a surgery patient. Early on the residuals average **+0.337**: early deaths lean surgical, because surgery is dangerous early. After a year they average **-0.255**: late deaths lean medical, because by then surgery is protective. The residuals slide from positive to negative as time passes. That downward march is the violation, made numeric.

=== step === widget
::eyebrow Reading the picture
## Reading the residual plot

Every residual diagnostic in statistics is read the same way, so it is worth building the instinct on a general one before we point it at time. In the plot below, the dots are residuals and the blue line is their smoothed trend. A **flat, patternless band** hugging zero means the model's assumption holds. **Any systematic shape**, a slope, a funnel, a bend, is the model telling you something is wrong. Toggle the three scenarios and watch the trend line.

::widget residual-plot {}

A Schoenfeld residual plot is exactly this picture with time on the horizontal axis. Flat over time means the hazard ratio is constant (proportional hazards holds); a smooth that slopes or bends means the coefficient is drifting as time passes. Now draw the real one for our surgery model. `cox.zph()` computes the scaled residuals; plotting it shows them against time with a smooth, and the dashed line marks zero:

```r
ph_arm <- cox.zph(cox_fit)
plot(ph_arm[1])              # [1] = the first term, arm; time is on the x-axis
abline(h = 0, lty = 2)       # the reference line the smooth should hug if PH holds
```

The smooth for surgery starts well above zero and slides steadily below it, the same positive-early, negative-late march you just computed by hand, now drawn as a clear downward slope. (The plot is on a rescaled axis, so the heights are not literally +0.337 and -0.255, but the direction is exactly the drift you found.) That is not a flat band. The assumption is broken for surgery.

=== step === quiz
::eyebrow Check yourself
## What does the slope mean?

In the scaled Schoenfeld residual plot for the surgery effect, the smoothed line slopes clearly downward, from positive early to negative late. What is that slope telling you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The surgery coefficient is not statistically significant ::no The slope is about how the effect changes over *time*, not about whether the effect is significant. A drifting residual and a significant coefficient are separate things; here surgery is both significant and non-proportional.
- Surgery has no effect on survival ::no Quite the opposite: surgery has a large effect that *reverses* over time. A residual plot that sloped would be impossible if surgery did nothing; a null effect gives a flat band around zero.
- The surgery effect changes with time, harmful early and protective later, so proportional hazards is violated for surgery ::ok Exactly. A residual trend means the coefficient is not constant: \(\beta\) is drifting. The single hazard ratio cannot be trusted, because there is no single ratio to report.
- The residuals are normally distributed, so the model fits well ::no A flat band, not a slope, is the "all is well" sign for this plot, and it is checking proportionality over time, not normality. A slope is the warning, not the reassurance.

=== step === concept
::eyebrow The slope as a test
## cox.zph: turning the plot into a p-value

Eyeballing a slope is a judgment call. `cox.zph()` makes it a formal test. Under the hood it does the obvious thing: it correlates the scaled Schoenfeld residuals with a function of time and asks whether that correlation is significantly different from zero. A flat smooth means zero correlation, proportional hazards holds; a real slope means non-zero correlation, and the test returns a small p-value.

It reports one row per covariate plus a GLOBAL row for the model as a whole:

```r
cox.zph(cox_fit)
#>        chisq df       p
#> arm    48.06  1 4.1e-12
#> age     3.52  1   0.061
#> GLOBAL 51.49  2 6.6e-12
```

Read it row by row. The null hypothesis in every row is "this effect is proportional over time," so a **small p-value is evidence against proportionality**:

- **arm: p = 4.1e-12.** Overwhelming evidence that the surgery effect is not constant over time. This is the violation we already saw in the curves and the residual slope, now with a number on it.
- **age: p = 0.061.** No strong evidence of a problem. Age's effect looks roughly proportional; older patients carry a steadily higher hazard throughout, which is believable. This is the reassuring shape.
- **GLOBAL: p = 6.6e-12.** A combined test across all covariates. It is tiny here because arm alone wrecks it.

[KEY INSIGHT]
A small `cox.zph` p-value is easy to misread. It does **not** say the covariate is an important predictor, and it does **not** say the whole model is worthless. It says one specific thing: the hazard ratio for that covariate does not hold still over time. It flags *which* variable broke the promise, so you know exactly what to fix.

=== step === tryit
::eyebrow Your turn
## Run the test yourself

Your fitted Cox model is in memory as `cox_fit`. Call the function that tests whether its hazard ratios stay proportional across the whole follow-up, and print the per-term and GLOBAL rows.

```r
# Test the proportional-hazards assumption for the fitted model cox_fit
____(cox_fit)
```
::check {"regex":"cox\\.zph\\s*\\(\\s*cox_fit","gate":true,"difficulty":"beginner","ok":"That is the test. arm p = 4e-12 (a clear violation), age p = 0.06 (roughly proportional), GLOBAL p = 7e-12. cox.zph is the one call to reach for after every coxph fit.","no":"Use cox.zph() on the model object: cox.zph(cox_fit). It computes the scaled Schoenfeld residuals and tests each for a trend with time."}
::solution
```r
cox.zph(cox_fit)
```

=== step === quiz
::eyebrow Check yourself
## Reading the cox.zph table

`cox.zph(cox_fit)` reports arm p = 4e-12, age p = 0.06, and GLOBAL p = 7e-12. Which reading is correct?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- Arm is a highly significant predictor of survival, and age barely matters ::no This confuses two different p-values. `cox.zph` does not test whether a covariate predicts survival; it tests whether that covariate's effect is *constant over time*. Arm's tiny p-value flags a proportionality problem, not predictive strength.
- Strong evidence that the arm effect is non-proportional (its hazard ratio drifts over time); age looks roughly proportional ::ok Right. Small p means "reject proportional hazards for this term." Arm's effect changes over time and needs fixing; age's does not, so the model's age part is fine as is.
- The whole Cox model is invalid and must be discarded ::no Only the arm term violates the assumption; age is fine. You repair the offending term (next), you do not throw away a model that is mostly sound.
- Age should be dropped from the model because its p-value is near 0.05 ::no The 0.06 is a proportionality p-value, not a variable-selection one. It says age's effect is roughly constant over time, which is a reason to KEEP age as an ordinary term, not to drop it.

=== step === concept
::eyebrow So it broke. Now what?
## Three honest responses to a violation

A violation is a finding, not a dead end. Once `cox.zph` names the guilty covariate, you have three standard repairs, and which one you pick depends on whether you *care* about that covariate's effect:

- **Stratify** it, with `strata()`. This lets each level of the variable have its own baseline hazard shape, so the proportional-hazards assumption is never imposed on it. The catch: a stratified variable gets **no hazard ratio at all**. This is the right move for a **nuisance** control you must adjust for but do not need to report, for example the enrolling hospital, or a study site with its own risk profile.
- **Let its effect vary with time**, by estimating a separate hazard ratio in each time window. You keep the estimates, and you get the honest early-vs-late story instead of a fictional average. This is the right move for a variable you **care about**, like our surgery arm.
- **Shorten the horizon** or report time-specific effects. Sometimes the assumption holds fine over the first year and only breaks later; analyzing a window where it holds, and being explicit about it, is a legitimate and honest choice.

Surgery is the whole point of Dr. Rao's study, so stratifying it away would delete the very number she needs. We want the second repair: two hazard ratios, one for the dangerous early window and one for the durable later one.

=== step === concept
::eyebrow The counting-process trick
## Split the timeline at the danger line

To give surgery a different hazard ratio before and after month 6, we first cut each patient's follow-up at month 6 into two rows. A patient who lives past month 6 contributes person-time to *both* windows: one row for months 0 to 6, another for month 6 onward. `survSplit` does this bookkeeping, producing the **counting-process format** with a start time, a stop time, and a status for each row:

```r
# Cut every patient's follow-up at month 6 into two intervals: (0, 6] and (6, stop].
cox_split <- survSplit(Surv(time, status) ~ ., data = cohort,
                       cut = 6, episode = "tgroup")
cox_split$tgroup <- factor(cox_split$tgroup, labels = c("0-6mo", "6+mo"))
cox_split$surg   <- as.integer(cox_split$arm == "surgery")   # 0/1 indicator for the interaction

head(cox_split[, c("tstart", "time", "status", "arm", "age", "tgroup")], 5)
#>   tstart time status     arm age tgroup
#> 1      0  3.1      1 surgery  60  0-6mo
#> 2      0  6.0      0 surgery  68  0-6mo
#> 3      6 36.0      0 surgery  68   6+mo
#> 4      0  6.0      0 medical  57  0-6mo
#> 5      6  9.2      1 medical  57   6+mo
```

Look at the surgery patient in rows 2 and 3. They survived past month 6, so their follow-up splits: row 2 covers months 0 to 6 (censored at the boundary, `status` 0, since they did not die *in* that window), and row 3 covers month 6 to 36. The patient in row 1 died at month 3.1, inside the first window, so they get a single row. The count of patients is unchanged; only the way we count their time has changed, from 320 rows to 563. No data is invented; each patient's timeline is just chopped at the cut point so the model can give each piece its own coefficient.

=== step === concept
::eyebrow The payoff
## Two honest hazard ratios

Now fit a Cox model on the split data and let surgery's effect differ by window. The term `surg:strata(tgroup)` says: estimate the surgery hazard ratio *separately* within each time stratum, while `age` keeps a single proportional effect:

```r
cox_tv <- coxph(Surv(tstart, time, status) ~ age + surg:strata(tgroup), data = cox_split)
round(summary(cox_tv)$coefficients, 4)
#>                             coef exp(coef) se(coef)       z Pr(>|z|)
#> age                       0.0494    1.0507   0.0093  5.2922    0e+00
#> surg:strata(tgroup)0-6mo  0.9520    2.5909   0.2393  3.9788    1e-04
#> surg:strata(tgroup)6+mo  -1.8080    0.1640   0.2890 -6.2564    0e+00
```

There is the truth the single number hid. In the first six months surgery carries a hazard ratio of **2.59**: it roughly *triples* the risk of death, the operative danger. After month 6 the hazard ratio is **0.16**: surgery cuts the risk to about a sixth of medical therapy's, the durable payoff. The fictional 0.66 from earlier was just the average of these two, describing neither. Confirm the repair worked by re-running the test on the new model:

```r
cox.zph(cox_tv)
#>                    chisq df     p
#> age                 3.19  1 0.074
#> surg:strata(tgroup) 1.77  2 0.413
#> GLOBAL              4.88  3 0.181
```

Every p-value is now comfortably above 0.05. By letting surgery have its own hazard ratio in each window, we have described the effect honestly, and the proportional-hazards assumption holds for what remains.

[KEY INSIGHT]
The fix did not "make the violation go away", it *told the story the violation was pointing at*. A single HR of 0.66 became a candid "3x more dangerous for six months, then 6x safer." That is the difference between a model that passes a diagnostic and a model that informs a decision.

=== step === tryit
::eyebrow Your turn
## Build the time-varying model

`cox_split` is in memory, with a `surg` indicator (1 for surgery) and a `tgroup` factor marking the two time windows. Complete the model so surgery gets a separate hazard ratio in each window: the surgery effect must interact with the time-period strata. Fill in the strata variable.

```r
coxph(Surv(tstart, time, status) ~ age + surg:strata(____), data = cox_split)
```
::check {"regex":"strata\\s*\\(\\s*tgroup","gate":true,"difficulty":"intermediate","ok":"That is the repair: interacting surg with strata(tgroup) gives a hazard ratio per window, 2.59 early and 0.16 late. The time-period strata is what lets one coefficient split into two.","no":"The time windows live in the tgroup factor, so the surgery effect must interact with strata(tgroup): surg:strata(tgroup). That estimates a separate surgery hazard ratio in each period."}
::solution
```r
coxph(Surv(tstart, time, status) ~ age + surg:strata(tgroup), data = cox_split)
```

=== step === concept
::eyebrow One idea, two names
## Time-varying effects vs time-varying covariates

The `(tstart, time, status)` counting-process format you just used is the workhorse for anything that changes with time in survival analysis, and it covers two ideas that are easy to confuse:

- A **time-varying effect** (also called a time-varying *coefficient*) is what we just fixed: the covariate value is fixed (a patient had surgery or did not), but its *effect*, the hazard ratio, changes over time. \(\beta\) becomes \(\beta(t)\). Proportional hazards is the special case \(\beta(t) = \beta\), a flat line.
- A **time-varying covariate** is when the covariate's *value itself* changes during follow-up, for example a lab result remeasured at each clinic visit, or a patient who receives a transplant partway through the study. Each new value gets its own `(tstart, time]` row, exactly like the split above, so the model uses the right value during the right interval.

[NOTE]
Both are expressed with the same start-stop rows, which is why `survSplit` and the counting-process format are worth knowing well. The `survival` package also offers the `tt()` argument for a smooth \(\beta(t)\) instead of discrete windows, and `strata()` for the nuisance case; the split-into-windows approach here is the most transparent place to start.

=== step === quiz
::eyebrow Check yourself
## The right repair

Your `cox.zph` flags the treatment arm, the exact variable your study exists to estimate, as non-proportional. Which response preserves the answer you actually need?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- Split follow-up into time windows and estimate a separate hazard ratio in each, reporting the early and late effects ::ok Right. This keeps the treatment's hazard ratios and tells the honest time-varying story, which is exactly what a violation on your key variable calls for.
- Stratify the model on the treatment arm ::no Stratifying gives each arm its own baseline hazard but produces NO hazard ratio for the treatment, deleting the very number your study is about. Stratification is for nuisance controls you do not need to report.
- Drop the treatment arm from the model ::no Removing the variable you are trying to estimate is not a fix; it throws away the entire point of the analysis and leaves the time-varying effect unreported.
- Switch to logistic regression on survival at 12 months ::no Collapsing to a single time point discards the censoring and the timing that survival analysis exists to use, and it still hides the early-vs-late reversal inside one yes/no outcome.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Grambsch and Therneau (1994), Proportional hazards tests and diagnostics based on weighted residuals, Biometrika 81(3):515](https://doi.org/10.1093/biomet/81.3.515) - the paper behind `cox.zph`, defining the scaled Schoenfeld residual test you used.
- [Therneau, Crowson and Atkinson, Using time dependent covariates and time dependent coefficients in the Cox model (survival vignette)](https://cran.r-project.org/web/packages/survival/vignettes/timedep.pdf) - the canonical R walkthrough of `survSplit`, `strata`, `tt`, and the counting-process format.
- [Therneau and Grambsch (2000), Modeling Survival Data: Extending the Cox Model (Springer)](https://doi.org/10.1007/978-1-4757-3294-8) - the definitive book on Cox diagnostics and time-varying effects.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a gentle companion treatment of survival analysis and the proportional-hazards model.

=== step === complete
## Lesson 4 complete

You can now check the promise every Cox model quietly makes. **Proportional hazards** says one hazard ratio holds for all of follow-up (\(S_1(t)=S_0(t)^{\text{HR}}\), curves that never cross), and when it fails the single HR becomes an average that describes no one, as surgery's fictional 0.66 hid a 2.59 early harm and a 0.16 late benefit. **Schoenfeld residuals** put a clue at every death, and their trend over time (the +0.337 to -0.255 slide you computed) is what a violation looks like. **`cox.zph`** turns that slope into a per-covariate and GLOBAL test, flagging exactly which variable broke the promise. And when the guilty variable is one you care about, **splitting follow-up into windows** recovers an honest hazard ratio for each period, while `strata()` is reserved for nuisance controls.

Every model so far, from Kaplan-Meier to Cox, has refused to name the shape of the baseline hazard. Next, Lesson 5: parametric and accelerated-failure-time models, where you assume a shape for survival time itself (Weibull, exponential) and gain the power to extrapolate beyond your data, and see when that trade is worth making.

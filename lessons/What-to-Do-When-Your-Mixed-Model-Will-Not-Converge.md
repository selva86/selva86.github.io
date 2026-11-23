---
title: "Mixed Effects and Longitudinal Models Lesson 7: What to do when your mixed model will not converge"
slug: "What-to-Do-When-Your-Mixed-Model-Will-Not-Converge"
description: "Four real lme4 warnings, each traced to its own cause: a true zero variance, too complex a structure, mismatched predictor scales, or near-perfect separation."
keywords: "convergence warning, boundary singular fit, isSingular, glmer, lme4, random effects structure, rescaling predictors, near-perfect separation, large eigenvalue ratio, degenerate Hessian, mixed model, logistic regression, GLMM troubleshooting"
mathjax: false
webr: true
post_type: "LESSON"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "7"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_prev: "Correlated-Residuals-Inside-a-Group"
course_next: ""
curriculum_id: "4.90.7"
lesson_access: "pro"
catalog_blurb: "Diagnose and fix the four real reasons a mixed model's fit will not converge."
---

=== step === cover
## What to do when your mixed model will not converge

Today let's work out what an lme4 convergence warning is actually telling you, and the fix that matches each one.

Picture a driving school with 6 instructors and 72 learner drivers, 12 per instructor. Each driver logs some hours of supervised practice before their test, somewhere between 5 and 40, and then passes or fails on the first attempt.

The natural model for this kind of data gives each instructor their own starting pass rate on top of the hours effect: `glmer(pass ~ hours + (1 | instructor), family = binomial)`. Fit models like this often enough, and sooner or later lme4 prints a warning instead of a clean result.

There are only four real reasons that happens, and the same four steps get you from a warning to a fix every time.

::widget process-flow {"steps":[{"title":"Read the warning","sub":"the exact wording lme4 printed"},{"title":"Check what is extreme","sub":"a variance near zero, a correlation at the boundary, or a coefficient and its standard error both huge"},{"title":"Match it to a cause","sub":"zero variance, too complex a structure, mismatched scales, or near-perfect separation"},{"title":"Apply the fix and refit","sub":"confirm the warning clears and the estimate holds"}]}

That is the order this lesson follows: one cause at a time, each one's own warning, and the fix that matches it.

=== step === concept
## Why a mixed model's fit can fail to settle

`glmer()` and `lmer()` do not solve for an intercept and a set of variances in one shot. They search for the parameters that fit the data best, nudging the current guess a little at each round, checking whether that helped, and stopping once another nudge barely changes anything.

That kind of search behaves exactly the way any iterative search can. Slide the learning rate below and watch a ball search for the bottom of a loss curve the same way.

::widget gradient-descent {}

A learning rate set too small makes the ball crawl down so slowly it barely moves in a reasonable number of steps. One set correctly makes it settle cleanly at the bottom. One set too large makes it overshoot and bounce from side to side before settling. And one set far too large sends it further from the bottom on every step instead of closer.

lme4's own search behaves the same way, just with no slider to drag. A convergence warning means that search did not settle the way the correctly sized step did: it stopped either right on the edge of what it is allowed to estimate, or somewhere its own checks flag as unreliable. There are four distinct reasons that happens, each with its own signature in the printed warning and its own fix.

=== step === widget
## What a variance component of exactly zero looks like

A random intercept lets each instructor's own pass rate sit above or below the grand average by some amount. How far that amount is allowed to range, across every instructor, is a single number lme4 estimates: the random intercept's variance.

The widget below uses its own 8 clinics, not the driving school, just to make that pooling mechanic easy to see. Slide the dial from "no pooling" to "complete pooling" and watch what happens to each clinic's own estimate.

::widget shrinkage-pool {}

At complete pooling, every clinic's estimate collapses onto the same grand-mean number, because the model is no longer allowed to tell the clinics apart at all. That is exactly what happens to a random intercept whose variance is genuinely zero: if instructors truly do not differ, lme4 pushes that variance down to zero, and every instructor's own intercept collapses onto the same overall number too. That is cause one's own signature: a variance pushed all the way to zero collapses every group's estimate onto one shared number.

=== step === quiz
## Quick check: is a singular fit broken?

A model prints `boundary (singular) fit: see help('isSingular')` instead of a clean result. Which statement reads that warning correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Some variance or correlation parameter landed right at the edge of what it is allowed to be, the same way the pooling dial's slider hits its own edge at complete pooling. ::ok Right. A boundary or singular fit is lme4 reporting exactly where a parameter landed, not announcing that the search crashed.
- The search failed to run at all, so nothing in the printed output can be trusted. ::no
- A model that prints no warning at all is automatically the correct one. ::no Neither extreme is right. A boundary or singular fit is lme4 correctly reporting a variance or correlation parameter sitting right at the edge of what it can estimate, not proof the search failed. And the reverse is not true either: printing no warning at all does not, by itself, guarantee the fit is correct.

=== step === concept
## Cause 1: a variance component that is genuinely zero

Time to see these four causes on the real driving-school example. Set up the 72 drivers first: 6 instructors, 12 learner drivers each, and each driver's hours of supervised practice before the test.

```r
# Set up 72 drivers across 6 instructors, with hours of supervised practice
set.seed(42)
instructor <- factor(rep(1:6, each = 12))
hours <- round(runif(72, 5, 40), 1)
true_int <- rnorm(6, 0, 0.6)[instructor]   # a real instructor effect, used from cause 3 on
table(instructor)
#> instructor
#>  1  2  3  4  5  6 
#> 12 12 12 12 12 12 
```

Cause one is the simplest case: suppose passing really depends only on hours, with no real difference between instructors at all. Build that outcome, and fit the model you would reach for by default, a random intercept per instructor.

```r
# Cause 1: pass1 depends only on hours, no real instructor effect
library(lme4)
set.seed(1)
pass1 <- rbinom(72, 1, plogis(-3 + 0.14 * hours))

fit1 <- glmer(pass1 ~ hours + (1 | instructor), family = binomial)
#> boundary (singular) fit: see help('isSingular')
VarCorr(fit1)
#>  Groups     Name        Std.Dev.  
#>  instructor (Intercept) 1.6667e-08
isSingular(fit1)
#> [1] TRUE
round(fixef(fit1), 4)
#> (Intercept)       hours 
#>     -3.1360      0.1536 
```

The warning names exactly what happened, `isSingular()` confirms it, and `VarCorr()` shows why. The instructor standard deviation, 1.6667e-08, is as close to zero as a number gets without being exactly zero. lme4 tried to let instructors differ and found nothing worth keeping.

If there is truly nothing there, dropping the random intercept altogether should not change the hours effect at all. Refit with a plain `glm()`, no random intercept in sight.

```r
# Compare against a plain glm() with no random intercept at all
fit1_glm <- glm(pass1 ~ hours, family = binomial)
round(coef(fit1_glm), 4)
#> (Intercept)       hours 
#>     -3.1360      0.1536 
c(glmer_hours = unname(round(fixef(fit1)["hours"], 4)),
  glm_hours   = unname(round(coef(fit1_glm)["hours"], 4)))
#> glmer_hours   glm_hours 
#>      0.1536      0.1536 
```

Both hours coefficients land on exactly 0.1536. The singular fit was not lme4 failing. It was lme4 correctly reporting that the random intercept had nothing left to explain, and a model without it gives the identical answer.

=== step === concept
## Cause 2: a random-effects structure too complex for six groups

A different kind of driver cohort might show a real, if small, difference between instructors in both pass rate and how much an extra hour buys. Build that cohort, and fit a model that asks for a random intercept and a random slope for hours, correlated with each other, instructor by instructor.

```r
# Cause 2: pass2 has a real instructor effect in both intercept and slope
set.seed(2)
inst_int <- rnorm(6, 0, 0.6)[instructor]
inst_slope <- rnorm(6, 0, 0.05)[instructor]
pass2 <- rbinom(72, 1, plogis(-3 + inst_int + (0.14 + inst_slope) * hours))

fit2 <- glmer(pass2 ~ hours + (1 + hours | instructor), family = binomial)
#> boundary (singular) fit: see help('isSingular')
VarCorr(fit2)
#>  Groups     Name        Std.Dev. Corr   
#>  instructor (Intercept) 0.707104        
#>             hours       0.062799 -1.000 
round(fixef(fit2), 4)
#> (Intercept)       hours 
#>     -3.3392      0.1634 
```

The same warning prints again, but this time the near-zero number from cause one is nowhere in sight. Both standard deviations, 0.707 and 0.063, are perfectly reasonable sizes. What is actually pinned to the boundary is the correlation between the intercept and the slope, -1.000, as far negative as a correlation can go.

Six instructors is not enough data to estimate an intercept, a slope, and how those two co-vary, all at the same time. Drop the random slope and keep just the random intercept.

```r
# Simplify to a random intercept only
fit2_simple <- glmer(pass2 ~ hours + (1 | instructor), family = binomial)
VarCorr(fit2_simple)
#>  Groups     Name        Std.Dev.
#>  instructor (Intercept) 0.54056 
round(fixef(fit2_simple), 4)
#> (Intercept)       hours 
#>     -2.8967      0.1356 
```

No warning this time. The instructor standard deviation lands at 0.541, close to the 0.6 instructors were actually simulated with, and the hours coefficient, 0.136, sits close to the more complex model's 0.163. Six instructors could support one random intercept. They could not support an intercept, a slope, and their correlation all together.

=== step === concept
## Cause 3: predictors on wildly different scales

Add one more predictor: each driver's lifetime minutes driven before this course, somewhere between 500 and 150,000, a completely different scale from hours. Fit it alongside hours in the usual random-intercept model.

```r
# Cause 3: pass3 adds lifetime_minutes, on a wildly different scale than hours
set.seed(3)
lifetime_minutes <- round(runif(72, 500, 150000))
pass3 <- rbinom(72, 1, plogis(-3 + true_int + 0.14 * hours + 0.00002 * lifetime_minutes))

fit3 <- glmer(pass3 ~ hours + lifetime_minutes + (1 | instructor), family = binomial)
#> Warning messages:
#> 1: Some predictor variables are on very different scales: consider rescaling. 
#> You may also use (g)lmerControl(autoscale = TRUE) to improve numerical stability. 
#> 2: In checkConv(attr(opt, "derivs"), opt$par, ctrl = control$checkConv,  :
#>   unable to evaluate scaled gradient
#> 3: In checkConv(attr(opt, "derivs"), opt$par, ctrl = control$checkConv,  :
#>   Model failed to converge: degenerate  Hessian with 1 negative eigenvalues
#>   See ?lme4::convergence and ?lme4::troubleshooting.
round(fixef(fit3), 5)
#>      (Intercept)            hours lifetime_minutes 
#>         -5.09822          0.19000          0.00003 
```

Two different warnings show up this time, and neither mentions a boundary or a singular fit. The first names the problem outright: some predictors are on very different scales. The second says the fit failed to converge because of a degenerate Hessian, the matrix lme4 uses internally to check whether its search has actually settled, with a negative eigenvalue where it should never find one.

Hours moves by single units. Lifetime minutes moves by tens of thousands. That gap makes lme4's internal arithmetic for checking convergence unreliable, even though the model itself is a perfectly reasonable one to fit.

The fix is arithmetic, not a change to the model. Divide lifetime_minutes by 1000, so it moves on a scale closer to hours, and refit.

```r
# Rescale lifetime_minutes so it sits closer to hours' own scale
lifetime_min_k <- lifetime_minutes / 1000
fit3_scaled <- glmer(pass3 ~ hours + lifetime_min_k + (1 | instructor), family = binomial)
round(fixef(fit3_scaled), 4)
#>    (Intercept)          hours lifetime_min_k 
#>        -5.0982         0.1900         0.0310 
```

No warning this time, and the estimates did not actually change, only their scale did. Hours still comes out at 0.190 and the intercept at -5.098, exactly as before. The lifetime-minutes effect, 0.031 per thousand minutes, is exactly 1000 times the original 0.00003 per minute. The warning on the unscaled model was about the arithmetic lme4 does internally to check convergence, not about anything wrong with the model.

=== step === concept
## Cause 4: near-perfect separation

One more predictor: a mock-test score between 40 and 100. This time, build it so passing is decided almost entirely by one cutoff: nearly every learner who scored 85 or above passed, and nearly every learner below 85 failed.

```r
# Cause 4: pass4 has a near-perfect cutoff on score at 85
set.seed(4)
score <- round(runif(72, 40, 100))
pass4 <- rbinom(72, 1, plogis(-40 + true_int * 3 + 0.5 * score))

fit4 <- glmer(pass4 ~ score + (1 | instructor), family = binomial)
#> Warning message:
#> In checkConv(attr(opt, "derivs"), opt$par, ctrl = control$checkConv,  :
#>   Model is nearly unidentifiable: large eigenvalue ratio
#>  - Rescale variables?
round(coef(summary(fit4)), 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -70.6094    52.4713 -1.3457   0.1784
#> score         0.8972     0.6715  1.3362   0.1815
```

This warning names neither a boundary nor a scale problem. It reports a large eigenvalue ratio, a different internal check flagging a result as unreliable, and its own suggestion is to rescale. But score already sits on an ordinary 40-to-100 scale, nothing like the thousands-versus-units gap cause three showed, so rescaling it would not change anything real.

Look past the warning's own suggestion to the coefficient table instead. The score coefficient, 0.897, looks like a strong effect. But its standard error, 0.671, is almost as large as the coefficient itself, and the p-value, 0.181, is nowhere near significant despite that large-looking number.

Compare that to a milder version of the same idea, where score still predicts passing, just without a near-perfect cutoff anywhere.

```r
# A milder version of the same score effect, with no sharp cutoff
set.seed(44)
pass4_mild <- rbinom(72, 1, plogis(-6 + true_int * 3 + 0.08 * score))
fit4_mild <- glmer(pass4_mild ~ score + (1 | instructor), family = binomial)
round(coef(summary(fit4_mild)), 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -8.6020     2.3193 -3.7089   2e-04
#> score         0.1025     0.0275  3.7243   2e-04
```

R prints that p-value as `2e-04`, its shorthand for 0.0002. Here the score coefficient is smaller, 0.103, but its standard error, 0.0275, is a fraction of the coefficient, and the p-value is clearly significant. The milder version is honestly estimated. The sharp-cutoff version is not, and a coefficient and standard error that are both unusually large together, not the warning's own wording, is what gives that away.

The honest fix here is not rescaling, which is exactly what the warning suggests. Once passing is decided almost entirely by one cutoff, there is almost no information left in the data about how steep the score effect really is on either side of it. That calls for more learners scoring near 85, where the real information about the slope lives, or a coarser claim about score instead of a precise one.

=== step === quiz
## Quick check: matching a new warning to its cause

A different driving school's model prints `boundary (singular) fit: see help('isSingular')`. Its VarCorr() output shows the instructor intercept's standard deviation at 0.58, the hours slope's standard deviation at 0.07, and a correlation between the two of 1.000. Which cause produced this warning?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Cause two: six instructors cannot support a random slope correlated with its own intercept. Neither standard deviation is near zero, so it is the structure, not a true-zero variance, that sits at the boundary. ::ok Right. Both standard deviations, 0.58 and 0.07, are perfectly reasonable sizes. What is pinned to the boundary is the correlation itself, 1.000, exactly the signature cause two left on the real driving-school data too.
- Cause one: a variance component that is genuinely zero, since any boundary or singular fit means some variance has collapsed to zero. ::no
- Cause four: near-perfect separation, since a slope standard deviation of 0.07 paired with a correlation of 1.000 looks like a coefficient and its standard error both inflated together. ::no Cause one does not fit here because neither standard deviation, 0.58 nor 0.07, is anywhere near zero, and a true-zero-variance case looks like an instructor SD of 1.67e-08, not 0.58. Cause four does not fit either, because separation shows up in a fixed-effect coefficient and its standard error, not in a random-effects correlation. What is actually at the boundary here is the correlation between the intercept and the slope, 1.000, which is cause two's signature: a random-effects structure too complex for six instructors to support.

=== step === tryit
## Your turn: fix a wildly scaled predictor

Build one more version of this data: the same instructors and hours, with one new predictor added, each driver's lifetime miles driven before this course, somewhere between 200 and 60,000.

```r
# Add miles_driven, a predictor on a wildly different scale than hours
set.seed(2)
miles_driven <- round(runif(72, 200, 60000))
pass_tryit <- rbinom(72, 1, plogis(-3 + true_int + 0.14 * hours + 0.00003 * miles_driven))
sum(pass_tryit)
#> [1] 48
```

The call below fits that model, but hours and miles_driven sit on wildly different scales, the same kind of gap behind cause three's warning. Rescale miles_driven the same way cause three's fix rescaled lifetime_minutes, then press Run.

```r
# fit_tryit below warns: "Some predictor variables are on very different scales: consider rescaling."
# Edit it so the model fits without that warning.
fit_tryit <- glmer(pass_tryit ~ hours + miles_driven + (1 | instructor), family = binomial)
round(fixef(fit_tryit), 4)
```
::check {"regex": "miles_driven\\s*[/]\\s*1000", "gate": true, "difficulty": "beginner", "ok": "Right. Dividing miles_driven by 1000 before fitting is exactly the move that cleared cause three's scale warning on lifetime_minutes, and it clears this one the same way.", "no": "Add a line before the glmer() call that rescales miles_driven, the same way cause three's fix rescaled lifetime_minutes: miles_driven <- miles_driven / 1000."}
::solution
```r
# Rescale miles_driven before fitting, the same move that fixed cause three's scale warning
miles_driven <- miles_driven / 1000
fit_tryit <- glmer(pass_tryit ~ hours + miles_driven + (1 | instructor), family = binomial)
round(fixef(fit_tryit), 4)
#> (Intercept)       hours miles_driven 
#>     -3.9275      0.1977      0.0089 
```

No warning once miles_driven moves onto a scale closer to hours. The intercept and the hours coefficient did not change at all, and the miles_driven coefficient simply absorbed the factor of 1000 that moved with its scale.

=== step === concept
## References
::prose-only a list of citations carries no teaching objective

- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01). Bates, Machler, Bolker and Walker (2015), Journal of Statistical Software 67(1). The paper behind `lmer()` and `glmer()`, fitted and refitted throughout this lesson.
- [lme4 package documentation](https://cran.r-project.org/package=lme4), `?lme4::convergence` and `?lme4::troubleshooting`. Bates, Machler, Bolker and Walker. The reference lme4's own convergence warnings point to.
- [Random effects structure for confirmatory hypothesis testing: Keep it maximal](https://doi.org/10.1016/j.jml.2012.11.001). Barr, Levy, Scheepers and Tily (2013), Journal of Memory and Language 68(3), 255-278. The debate behind cause two, how complex a random-effects structure a dataset can actually support.
- [On the existence of maximum likelihood estimates in logistic regression models](https://doi.org/10.1093/biomet/71.1.1). Albert and Anderson (1984), Biometrika 71(1), 1-10. The paper behind cause four, near-perfect and complete separation in a binomial fit.
- [Generalized linear mixed models: a practical guide for ecology and evolution](https://doi.org/10.1016/j.tree.2008.10.008). Bolker, Brooks, Clark, Geange, Poulsen, Stevens and White (2009), Trends in Ecology & Evolution 24(3), 127-135. A practical guide to the GLMM fitting this lesson's four causes all arise from.

=== step === complete
## The order to try things in, and when simplifying changes the question

Four real warnings turned up on the same 72 drivers, and each one had its own fix. An instructor standard deviation of 1.6667e-08 meant dropping a random intercept that genuinely had nothing to explain. And a correlation pinned at -1.000 meant dropping a random slope that six instructors could not support, while the instructor standard deviation itself, 0.541, stayed perfectly reasonable.

A scale warning cleared the moment lifetime_minutes was divided by 1000, with every estimate landing exactly where it started. And a coefficient and standard error both inflated together, 0.897 and 0.671, gave away a near-perfect cutoff that rescaling alone could never fix.

That gives you an order to try things in. Read the warning's exact wording first. Check which number is actually extreme: a variance near zero, a correlation at the boundary, a scale gap between predictors, or a coefficient and its standard error both unusually large together. Match that number to its cause, apply the one fix that matches, and refit to confirm the warning clears and the estimate holds.

Two judgment calls sit underneath that order, and no warning message can make them for you. A singular fit can be the honest answer, not an error, whenever a variance truly is zero: there was nothing wrong with cause one's model, only with trusting a term that had nothing left to estimate. And simplifying a random-effects structure is honest exactly when the data cannot support it, the way six instructors could not support cause two's slope. But it stops being honest the moment the term you drop is the one you actually came to estimate: dropping a random slope you need to compare against is a different decision from dropping one you only added out of habit.

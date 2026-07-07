---
title: "Advanced Regression Lesson 13: Random Slopes and GLMMs"
catalog_blurb: "How to let each group have its own trend, plus yes/no outcomes."
description: "Fit random-slope mixed models in R with lme4, test them, fix singular and convergence warnings, and read a binomial GLMM for yes/no grouped data on the odds scale."
keywords: "random slopes, mixed models, GLMM, generalized linear mixed model, lme4, lmer, glmer, singular fit, convergence, partial pooling, random effects, binomial, odds ratio, R"
post_type: "LESSON"
curriculum_id: "6.130.13"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "13"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: ""
course_prev: "Mixed-Models-Random-Intercepts.html"
---

=== step === cover
::eyebrow Lesson 13 of 13
## Random Slopes and GLMMs

In Lesson 12 you gave each of Dr. Reyes's eight clinics its own baseline recovery level: one **random intercept** per clinic, all drawn from a shared bell curve. But every clinic was forced to share the *same* slope for therapy sessions, giving eight parallel lines. That is often too rigid. At some clinics an extra therapy session lifts recovery a lot; at others it barely moves the needle.

This lesson lets the **slope** vary by clinic too, so the lines fan out instead of running parallel. Then it goes one step further: when the outcome is a yes/no or a count rather than a 0-100 score, the **generalized** linear mixed model (GLMM) carries everything you know onto that new scale.

By the end of this lesson you will be able to:

- See why one shared slope (parallel lines) is too rigid, and fit a **random-slopes** model with `lmer`
- Read the three numbers a random slope adds: the spread of intercepts, the spread of slopes, and their correlation
- Test whether the random slope earns its keep, and watch partial pooling steady the noisy small-clinic slopes
- Diagnose and fix the two warnings every mixed-model user meets: **singular fits** and **convergence failures**
- Fit a **GLMM** for a yes/no outcome with `glmer` and read its effect as an odds ratio

**Prerequisites:** [Lesson 12 on random intercepts](Mixed-Models-Random-Intercepts.html) (variance components, the ICC, partial pooling), an [ordinary linear model](OLS-Regression-from-Scratch.html), and the [logit link and odds](Logistic-Regression-With-R.html) for the GLMM half.

::widget shrinkage-pool {}

=== step === concept
::eyebrow The data, rebuilt
## One shared slope, eight clinics

We are back with Dr. Anna Reyes and her eight walk-in clinics. Every lesson runs in its own session, so we rebuild her network right here. Alongside each patient's therapy `sessions` and 0-100 `recovery` score, we now record two more things: the patient's baseline illness `severity` (standardised), and whether, at a one-year follow-up, they `recovered` fully (1) or not (0). We use `severity` when we reach troubleshooting, and `recovered` for the GLMM at the end.

```r
library(lme4)
set.seed(3)

clinic_names <- c("Ashby","Brook","Cedar","Dale","Elm","Fern","Gale","Hill")
n_per   <- c(18, 34, 15, 40, 12, 30, 16, 25)          # patients seen at each clinic
clinic  <- factor(rep(clinic_names, n_per))
N       <- length(clinic)                             # 190 patients in all

u_int   <- setNames(rnorm(8, 0, 7),   clinic_names)   # each clinic's baseline shift
w_slope <- setNames(rnorm(8, 0, 0.7), clinic_names)   # each clinic's own extra slope
sessions <- pmin(14L, rpois(N, 6))                    # therapy sessions attended
severity <- round(scale(rnorm(N))[, 1], 2)            # standardised illness severity

recovery <- 50 + u_int[as.character(clinic)] +
            (1.4 + w_slope[as.character(clinic)]) * sessions +
            (-2) * severity + rnorm(N, 0, 6)
recovery <- round(pmin(100, pmax(0, recovery)), 1)    # keep it on the 0-100 scale

v_log     <- setNames(rnorm(8, 0, 1.0), clinic_names) # clinic shift on the log-odds
eta       <- -1.3 + v_log[as.character(clinic)] + 0.25 * sessions
recovered <- rbinom(N, 1, plogis(eta))                # full recovery at follow-up? 1/0

recov <- data.frame(clinic, sessions, severity, recovery, recovered)
head(recov)
#>   clinic sessions severity recovery recovered
#> 1  Ashby        4    -0.31     50.7         0
#> 2  Ashby        6    -0.44     42.6         0
#> 3  Ashby        4     1.46     40.3         0
#> 4  Ashby        5    -0.73     39.3         0
#> 5  Ashby        9    -0.48     70.3         0
#> 6  Ashby        4    -0.04     38.3         0
```

The question that drives this lesson: **does an extra therapy session help every clinic by the same amount?** Lesson 12's random-intercept model assumed yes. Let us look.

=== step === concept
::eyebrow The evidence
## Some clinics respond much more than others

Fit a plain line, `recovery ~ sessions`, separately inside each clinic and read off just the slope. `lmList` from `lme4` does exactly that, running one ordinary regression per clinic:

```r
library(lme4)
round(coef(lmList(recovery ~ sessions | clinic, data = recov))[, "sessions"], 2)
#> Ashby Brook Cedar  Dale   Elm  Fern  Gale  Hill
#>  2.96  2.80  0.09  0.08  1.53  1.37  1.07  1.20
```

These are not the same number. At **Ashby** an extra session is worth almost **3 recovery points**; at **Dale** and **Cedar** it is worth essentially **nothing** (0.08, 0.09). A single shared slope would paper over a real, clinically important difference. Plotted, the per-clinic lines fan out like a hand of cards rather than running parallel:

```r
library(ggplot2)
ggplot(recov, aes(sessions, recovery, colour = clinic)) +
  geom_point(alpha = 0.35, size = 1.4) +
  geom_smooth(method = "lm", se = FALSE, linewidth = 0.9) +
  labs(title = "One line per clinic: the slopes fan out",
       x = "therapy sessions", y = "recovery score")
```

A random *intercept* could only slide these lines up and down; it could never tilt them. We need to let the slope itself vary.

=== step === quiz
::eyebrow Check yourself
## What does a random intercept assume?

Lesson 12's model was `recovery ~ sessions + (1 | clinic)`. Given the fanned lines you just saw, what is that model quietly assuming, and why is it a problem here?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- That every clinic has the SAME sessions slope and only a different intercept: eight parallel lines. Here the slopes plainly differ, so it is wrong. ::ok Right. `(1 | clinic)` varies only the intercept, so all eight lines share one slope. The per-clinic slopes ran from 0.08 to 2.96, so forcing them equal misrepresents clinics like Ashby and Dale.
- That every clinic has the same intercept but its own slope ::no It is the reverse. The `1` in `(1 | clinic)` is the intercept, so a random intercept gives each clinic its own baseline and ONE shared slope, not its own slope.
- That the clinics are independent, so their patients can be pooled into one regression ::no A random intercept explicitly does NOT pool them into one line; it gives each its own intercept and absorbs the within-clinic correlation. The limitation here is the shared slope, not pooling.
- Nothing is wrong: a random intercept already lets each clinic respond to sessions differently ::no It does not. A random intercept shifts lines up and down but keeps them parallel. Letting the response to sessions differ is exactly what a random SLOPE adds.

=== step === tryit
::eyebrow Your turn
## Let the slope vary too

To give each clinic its own slope for `sessions`, put `sessions` inside the random-effects term next to the `1`. The term `(1 + sessions | clinic)` reads *"let the intercept AND the sessions slope vary by clinic."* Fill in the random term.

```r
library(lme4)
m_slope <- lmer(recovery ~ sessions + ____, data = recov)
summary(m_slope)
```
::check {"regex":"\\(\\s*1\\s*\\+\\s*sessions\\s*\\|\\s*clinic\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. (1 + sessions | clinic) gives every clinic its own intercept AND its own sessions slope, the two drawn together from a shared 2-D normal.","no":"The random-slope term is (1 + sessions | clinic): the 1 is the intercept, sessions is the varying slope, and | clinic says vary both by clinic."}
::solution
```r
library(lme4)
m_slope <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov)
summary(m_slope)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: recovery ~ sessions + (1 + sessions | clinic)
#>    Data: recov
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev. Corr
#>  clinic   (Intercept) 58.6375  7.6575
#>           sessions     0.8101  0.9001   -0.48
#>  Residual             44.4003  6.6634
#> Number of obs: 190, groups:  clinic, 8
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  48.7622     3.1252  15.603
#> sessions      1.3868     0.4056   3.419
```

=== step === concept
::eyebrow Reading the fit
## Three new numbers, and a matrix behind them

The random-effects block now carries three quantities instead of one. Pull them out with names:

```r
library(lme4)
m_slope <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov)
vc <- as.data.frame(VarCorr(m_slope))
setNames(round(vc$sdcor, 2), c("sd_intercept","sd_slope","corr_int_slope","sd_residual"))
#>   sd_intercept       sd_slope corr_int_slope    sd_residual
#>           7.66           0.90          -0.48           6.66
```

Formally, for patient \(i\) at clinic \(j\) who attended \(x_{ij}\) sessions:

\[ y_{ij} = \beta_0 + u_j + (\beta_1 + w_j)\,x_{ij} + \varepsilon_{ij}, \qquad \varepsilon_{ij} \sim \mathcal{N}(0, \sigma^2), \]

\[ \begin{pmatrix} u_j \\ w_j \end{pmatrix} \sim \mathcal{N}\!\left( \begin{pmatrix} 0 \\ 0 \end{pmatrix},\ \begin{pmatrix} \tau_0^2 & \rho\,\tau_0\tau_1 \\ \rho\,\tau_0\tau_1 & \tau_1^2 \end{pmatrix} \right). \]

Reading each estimate in plain words:

- \(\beta_1 = 1.39\) is the **average slope**: across the network, an extra session adds about 1.4 recovery points. Its standard error, 0.41, is nearly double the 0.24 the random-intercept model reported. Honestly admitting that the slope varies makes us less certain about its average, which is exactly as it should be.
- \(\tau_1 = 0.90\) (`sd_slope`) is the **spread of clinic slopes** around that average. Clinic slopes scatter by roughly 0.9 points-per-session, so a typical clinic sits somewhere between about 0.5 and 2.3.
- \(\tau_0 = 7.66\) (`sd_intercept`) is the familiar **spread of clinic baselines** from Lesson 12.
- \(\rho = -0.48\) (`corr_int_slope`) is the **intercept-slope correlation**: clinics that start higher tend to climb more gently. It is the off-diagonal of the 2 by 2 matrix \(\Sigma\).

[KEY INSIGHT]
A random intercept estimated ONE variance. A random slope estimates a whole 2 by 2 covariance matrix \(\Sigma\): a variance for the intercepts, a variance for the slopes, and the correlation between them. That correlation is free information, telling you whether high-baseline groups tend to respond more or less.

=== step === quiz
::eyebrow Check yourself
## What does sd_slope = 0.90 tell you?

The fit reported a slope spread of \(\tau_1 = 0.90\) and an intercept-slope correlation of \(\rho = -0.48\). Which reading is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The average clinic slope is 0.90 points per session ::no 0.90 is the SPREAD of slopes across clinics (their standard deviation), not the average. The average slope is the fixed effect, 1.39.
- Every clinic's slope is exactly 0.90 away from 1.39 ::no A standard deviation is a typical spread, not a fixed gap. Slopes scatter around 1.39 by about 0.90 on average; some are closer, some further.
- Clinic slopes typically sit within about 0.90 of the average 1.39, and clinics with higher baselines tend to have gentler slopes ::ok Right. sd_slope = 0.90 is the spread of the per-clinic slopes around the mean 1.39, and rho = -0.48 says a higher intercept goes with a lower slope: high-baseline clinics climb more gently.
- rho = -0.48 means sessions and recovery are negatively correlated ::no rho is the correlation between each clinic's random INTERCEPT and its random SLOPE, not between sessions and recovery (which is positive). It links a clinic's baseline to its steepness.

=== step === quiz
::eyebrow Before we pool
## Why not just fit each clinic separately?

You already have eight per-clinic slopes from `lmList` (0.08 to 2.96). Why prefer one random-slopes `lmer` over just reporting those eight separate `lm` fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because `lmer` is quicker to type than eight `lm` calls ::no Convenience is not the point. The eight separate fits give genuinely worse slope estimates for small clinics, and `lmer` fixes that by pooling.
- Because a clinic with few patients gives a wildly noisy slope, and the random-slopes model shrinks those toward the average instead of trusting them blindly ::ok Right. Elm (12 patients) or Cedar (15) estimate a slope from very little data. Separate `lm` fits trust each noisy slope fully; partial pooling pulls the shakiest ones toward the network average, exactly as it did for intercepts in Lesson 12.
- Because separate `lm` fits cannot include a slope at all ::no They can; that is exactly what `lmList` just did. The issue is not whether they estimate a slope but how reliably: small clinics get noisy, unpooled slopes.
- Because the random-slopes model returns identical slopes to the eight separate fits, just in one table ::no They are NOT identical. Pooling deliberately shrinks the separate slopes toward the mean, most for the smallest clinics, which is the whole benefit.

=== step === concept
::eyebrow Is it worth it?
## Test the random slope with a likelihood-ratio test

Letting the slope vary cost two extra parameters: a slope variance \(\tau_1^2\) and the correlation \(\rho\). Did the data actually need them? Compare the random-intercept model against the random-slope model with `anova`, which runs a likelihood-ratio test:

```r
library(lme4)
m_int   <- lmer(recovery ~ sessions + (1 | clinic),            data = recov)
m_slope <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov)
anova(m_int, m_slope)
#> refitting model(s) with ML (instead of REML)
#> Data: recov
#> Models:
#> m_int: recovery ~ sessions + (1 | clinic)
#> m_slope: recovery ~ sessions + (1 + sessions | clinic)
#>         npar    AIC    BIC  logLik -2*log(L)  Chisq Df Pr(>Chisq)
#> m_int      4 1307.0 1320.0 -649.48    1299.0
#> m_slope    6 1303.3 1322.8 -645.68    1291.3 7.6121  2    0.02224 *
```

The p-value is 0.022, below 0.05, and the AIC drops from 1307 to 1303. The random slope earns its keep: clinics really do differ in how much sessions help, by more than sampling noise alone would produce. (`anova` quietly refits both models with maximum likelihood instead of REML, because REML likelihoods are not comparable across models with different fixed-effect setups; here the fixed part is identical, so it is simply being careful.)

[NOTE]
Testing whether a variance is zero (\(\tau_1^2 = 0\)) sits on the boundary of the allowed range, since a variance cannot go below zero. That makes this p-value mildly conservative: the true evidence is, if anything, a touch stronger than 0.022. When a random slope is borderline, favour keeping it if theory says the effect should vary.

=== step === widget
::eyebrow The payoff
## Partial pooling steadies the slopes too

Everything you learned about shrinkage in Lesson 12 applies here, now to slopes. A clinic with plenty of patients stays close to its own raw slope; a small clinic's slope is pulled toward the network average of 1.39. Slide the pooling dial to feel it, then read the real pulled slopes underneath:

::widget shrinkage-pool {}

```r
library(lme4)
m_slope <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov)
raw    <- coef(lmList(recovery ~ sessions | clinic, data = recov))[, "sessions"]
pooled <- coef(m_slope)$clinic[, "sessions"]
data.frame(n      = as.integer(table(recov$clinic)),
           raw    = round(raw, 2),
           pooled = round(pooled, 2),
           pulled = round(pooled - raw, 2))
#>        n  raw pooled pulled
#> Ashby 18 2.96   2.10  -0.86
#> Brook 34 2.80   2.56  -0.24
#> Cedar 15 0.09   0.59   0.50
#> Dale  40 0.08   0.39   0.31
#> Elm   12 1.53   1.41  -0.12
#> Fern  30 1.37   1.40   0.03
#> Gale  16 1.07   1.29   0.22
#> Hill  25 1.20   1.36   0.16
```

Read the `pulled` column. Cedar's raw slope of 0.09 is nudged up to 0.59 and Dale's 0.08 up to 0.39: both looked suspiciously flat on limited within-clinic evidence, so the model leans them toward the average. Ashby's steep 2.96 is reeled in hardest, down to 2.10. The extreme, less-certain slopes move most; the well-supported ones barely budge.

=== step === quiz
::eyebrow Check yourself
## Which slope was pulled most?

In the table, Ashby's slope moved the most (2.96 down to 2.10). Brook's raw slope is almost as steep (2.80) yet it barely moved (down to 2.56). What best explains the difference?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Ashby is both far from the average slope and backed by fewer patients (18 vs Brook's 34), so the model trusts its steep slope less ::ok Right. Shrinkage grows with distance from the mean AND with how little data supports the estimate. Ashby and Brook are about equally extreme, but Ashby's smaller sample makes its slope less certain, so it is pulled harder.
- Ashby has more patients than Brook, so it gets adjusted more ::no Ashby has FEWER patients (18 vs 34). More data means LESS shrinkage, not more, which is exactly why Brook holds its ground.
- Ashby's slope is negative, so it is corrected toward positive ::no Both slopes are positive and steep (2.96 and 2.80). Neither is being corrected for sign; they are being shrunk toward the average slope of 1.39.
- Random slopes are shrunk by a fixed 30% for every clinic ::no The pull is not a fixed fraction. It depends on each clinic's sample size and how far its raw slope sits from the network average, so it differs clinic to clinic.

=== step === concept
::eyebrow The geometry
## Eight lines that finally fan out

`coef()` combines the fixed effects with each clinic's own intercept and slope, giving a genuine fitted line per clinic. Predict across the range of sessions and plot them:

```r
library(lme4)
library(ggplot2)
m_slope <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov)

grid <- expand.grid(clinic = clinic_names, sessions = 0:14)
grid$fit <- predict(m_slope, newdata = grid)

ggplot(grid, aes(sessions, fit, colour = clinic)) +
  geom_line(linewidth = 1) +
  labs(title = "Eight fitted lines, no longer parallel",
       x = "therapy sessions", y = "predicted recovery")
```

Compare these to the parallel lines a random intercept would have drawn. Ashby climbs steeply, Dale and Cedar stay nearly flat, and the lines cross: at zero sessions Ashby is not the best clinic, but by twelve sessions it has overtaken several. That crossing is impossible with a shared slope, and it is exactly the story the raw per-clinic fits told, now smoothed by partial pooling.

=== step === concept
::eyebrow Trouble, part 1
## The singular fit

Emboldened, you might ask for the "maximal" model: let BOTH the `sessions` and `severity` slopes vary by clinic. Try it, and `lmer` pushes back:

```r
library(lme4)
m_max <- lmer(recovery ~ sessions + severity + (1 + sessions + severity | clinic),
              data = recov)
#> boundary (singular) fit: see help('isSingular')
isSingular(m_max)
#> [1] TRUE
```

`boundary (singular) fit` means the model landed on the edge of what it can estimate: some variance was driven to zero, or some correlation to exactly plus or minus one. Look at the estimated correlations among the random effects:

```r
library(lme4)
m_max <- lmer(recovery ~ sessions + severity + (1 + sessions + severity | clinic),
              data = recov)
vc <- as.data.frame(VarCorr(m_max))
vc$sdcor <- round(vc$sdcor, 3)
vc[!is.na(vc$var2), c("grp","var1","var2","sdcor")]
#>      grp        var1     var2  sdcor
#> 4 clinic (Intercept) sessions -0.435
#> 5 clinic (Intercept) severity -0.386
#> 6 clinic    sessions severity  0.999
```

The `sessions`-`severity` slope correlation is pinned at **0.999**. With only eight clinics there is not enough information to estimate a full 3 by 3 covariance matrix (three variances plus three correlations, six numbers, from eight groups). The model is over-specified.

[WARNING]
A singular fit is not a crash, and the estimates are not garbage, but the random-effects structure is more than your data can support. Do not just wave the warning away: simplify the model until it goes away on its own.

=== step === tryit
::eyebrow Your turn
## Simplify until it converges

The cure is to ask for less. `severity`'s effect barely varies across clinics, so drop its random slope and keep only the one the data clearly supports, `sessions`. `severity` stays in as a fixed effect. Fill in the reduced random term.

```r
library(lme4)
m_fix <- lmer(recovery ~ sessions + severity + ____, data = recov)
isSingular(m_fix)
```
::check {"regex":"\\(\\s*1\\s*\\+\\s*sessions\\s*\\|\\s*clinic\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. Keeping only (1 + sessions | clinic) asks for a random structure the eight clinics can actually support, and the fit is no longer singular.","no":"Drop the severity random slope and keep (1 + sessions | clinic); severity stays as a fixed effect in the formula."}
::solution
```r
library(lme4)
m_fix <- lmer(recovery ~ sessions + severity + (1 + sessions | clinic), data = recov)
isSingular(m_fix)
#> [1] FALSE
```

No warning, and `isSingular` is `FALSE`. A lighter-touch alternative keeps both random slopes but drops the *correlations* between them by writing a double bar, `(1 + sessions + severity || clinic)`: fewer parameters, and often enough to clear a singular fit while still letting each slope vary.

=== step === concept
::eyebrow Trouble, part 2
## When it will not converge

The other warning you will meet is `Model failed to converge`, often with the hint `Rescale variables?`. It usually means the optimizer could not settle on a stable maximum, and the fix is rarely to abandon the model. Work down this ladder:

**1. Put predictors on a comparable scale.** An optimizer struggles when one predictor ranges 0 to 14 and another 0 to 10000. Centre and scale first; it changes nothing about the science, only the numerics:

```r
library(lme4)
recov$sessions_z <- scale(recov$sessions)[, 1]      # centre and scale to mean 0, sd 1
m_z <- lmer(recovery ~ sessions_z + (1 + sessions_z | clinic), data = recov)
isSingular(m_z)
#> [1] FALSE
```

**2. Try a different optimizer.** lme4 lets you swap the engine; `bobyqa` often succeeds where the default stalls:

```r
library(lme4)
m_b <- lmer(recovery ~ sessions + (1 + sessions | clinic), data = recov,
            control = lmerControl(optimizer = "bobyqa"))
isSingular(m_b)
#> [1] FALSE
```

**3. Simplify the random structure**, just as you did for the singular fit: drop a random slope, or drop its correlations with `||`.

**4. As a last diagnostic, refit with every optimizer** using `allFit(m)` and check whether they agree. If all optimizers land in the same place, a lone convergence warning is usually a false alarm you can safely step past.

[TIP]
Order matters: rescale first (it is free and clears most warnings), then swap optimizer, then simplify the model. Reach for `allFit` only to confirm a borderline case, not as a first move.

=== step === quiz
::eyebrow Check yourself
## Your first move on a convergence warning

You fit a mixed model with several predictors on very different scales (age in years, income in dollars, a 0-14 count) and get `Model failed to converge; Rescale variables?`. What is the sensible FIRST thing to try?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Delete the random effects and fall back to a plain `lm` ::no That throws away the grouping the model exists to handle. Convergence warnings are usually numerical, not a sign that mixed models are wrong for the data.
- Centre and scale the predictors so they share a comparable range, then refit ::ok Right. The warning even suggests it ("Rescale variables?"). Scaling is free, changes no conclusions, and clears the majority of convergence warnings caused by predictors on wildly different scales.
- Collect more data until the warning disappears ::no More data can help eventually, but it is not the immediate, free fix. Rescaling the predictors you already have is the first move and usually enough.
- Lower your significance threshold to accept the model as is ::no The threshold has nothing to do with whether the optimizer converged. Ignoring the warning risks trusting unstable estimates; address the cause instead.

=== step === concept
::eyebrow Generalizing
## When the outcome is yes or no

So far the outcome has been a 0-100 score with residuals assumed normal. But Dr. Reyes also recorded a plain yes/no: at the one-year follow-up, did the patient report a full recovery (`recovered` = 1) or not (0)? You cannot model a yes/no with a straight line, because a line would happily predict probabilities above 1 and below 0.

The fix is the same one ordinary logistic regression uses: pass the linear predictor through the **logit link**, which squashes any number into a probability between 0 and 1. A mixed model wearing that link is a **generalized linear mixed model (GLMM)**. For patient \(i\) at clinic \(j\):

\[ \operatorname{logit}(p_{ij}) = \log\frac{p_{ij}}{1 - p_{ij}} = \beta_0 + u_j + \beta_1 x_{ij}, \qquad u_j \sim \mathcal{N}(0, \tau^2), \]

where \(p_{ij}\) is the probability that the patient reports full recovery, \(x_{ij}\) their number of sessions, \(\beta_1\) the average effect of a session on the log-odds, and \(u_j\) each clinic's random intercept, now living on the log-odds scale. Everything you know about random effects carries straight over; only the link and the outcome distribution (binomial, not normal) change. The S-curve below is that link: drag the threshold to see how a straight log-odds line becomes a bounded probability.

::widget logistic-curve {}

=== step === tryit
::eyebrow Your turn
## Fit the GLMM

`glmer` is `lmer`'s generalized sibling: the same formula grammar, plus a `family` that names the outcome's distribution and link. For a yes/no outcome that is `family = binomial` (which uses the logit link by default). Fill it in.

```r
library(lme4)
g <- glmer(recovered ~ sessions + (1 | clinic), data = recov, family = ____)
summary(g)
```
::check {"regex":"binomial","gate":true,"difficulty":"beginner","ok":"Right. family = binomial puts a logit link on a yes/no outcome, turning the mixed model into a logistic GLMM with a per-clinic random intercept.","no":"For a 0/1 outcome use family = binomial, which applies the logit link by default."}
::solution
```r
library(lme4)
g <- glmer(recovered ~ sessions + (1 | clinic), data = recov, family = binomial)
summary(g)
#> Generalized linear mixed model fit by maximum likelihood (Laplace
#>   Approximation) [glmerMod]
#>  Family: binomial  ( logit )
#>
#> Random effects:
#>  Groups Name        Variance Std.Dev.
#>  clinic (Intercept) 5.572    2.361
#> Number of obs: 190, groups:  clinic, 8
#>
#> Fixed effects:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -2.43097    1.04938  -2.317 0.020527 *
#> sessions     0.35225    0.09455   3.726 0.000195 ***
```

=== step === concept
::eyebrow Reading a GLMM
## From log-odds to odds ratios

`glmer` reports fixed effects on the **log-odds** scale, which is hard to feel. Exponentiate to get **odds ratios**, the natural way to read a logistic model:

```r
library(lme4)
g <- glmer(recovered ~ sessions + (1 | clinic), data = recov, family = binomial)
round(exp(fixef(g)), 2)
#> (Intercept)    sessions
#>        0.09        1.42
```

Each extra therapy session multiplies a patient's **odds** of reporting full recovery by **1.42**, a 42% increase in the odds per session, at a fixed clinic. Two differences from `lmer` are worth noting. First, `glmer` prints a `z value` and a p-value (0.0002 for sessions), because on the binomial scale those tests are well defined, unlike the deliberately p-value-free `lmer`. Second, the random effects have only a variance, with no `Residual` row:

```r
library(lme4)
g <- glmer(recovered ~ sessions + (1 | clinic), data = recov, family = binomial)
as.data.frame(VarCorr(g))[, c("grp", "sdcor")]
#>      grp    sdcor
#> 1 clinic 2.361198
```

The clinic random-intercept standard deviation is 2.36 **on the log-odds scale**: clinics differ a great deal in their baseline recovery odds. There is no residual variance term because a binomial outcome's spread is fixed once you know its mean (a coin's variance is set the moment you know its probability), so the tidy \(\tau^2/(\tau^2+\sigma^2)\) ICC from Lesson 12 does not carry over unchanged to a GLMM.

=== step === quiz
::eyebrow Check yourself
## What does an odds ratio of 1.42 mean?

The GLMM reported `exp(sessions) = 1.42`. Which statement is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Each session raises the probability of full recovery by 42 percentage points ::no An odds ratio is not a change in probability. Odds and probability differ, and the same odds ratio moves probability by different amounts depending on where you start.
- Each session adds 1.42 to the recovery score ::no There is no recovery score here; the outcome is yes/no. 1.42 multiplies the ODDS of a "yes", it does not add points to anything.
- Each extra session multiplies the odds of reporting full recovery by 1.42, about a 42% rise in the odds, at a fixed clinic ::ok Right. The exponential of a logistic coefficient is an odds ratio: the odds get multiplied by 1.42 per session. Its effect on the probability depends on the baseline, but the odds multiplier is constant.
- The model is 1.42 times more accurate than a plain logistic regression ::no 1.42 is the odds ratio for sessions, not a measure of accuracy or a comparison between two models.

=== step === quiz
::eyebrow Putting it together
## Choose the model

A sleep researcher measures **reaction time** on **18 volunteers** across **10 nights** of sleep restriction. Reaction time is a continuous score, and she expects sleep loss to slow some people far more than others. Which model fits the design?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `lm(rt ~ night)` on all 180 rows ::no That ignores the grouping entirely: each volunteer's 10 nights are correlated, and it also forces one shared slope, denying that people differ in how fast they slow down.
- `lmer(rt ~ night + (1 + night | subject))` ::ok Right. night is the fixed effect, and (1 + night | subject) gives each volunteer their own baseline AND their own slowing rate, exactly the "some people slow more than others" the researcher expects, while respecting the repeated measures.
- `lmer(rt ~ night + (1 | subject))` ::no A random intercept alone allows different baselines but forces one shared slope, so it cannot capture that some volunteers slow far more than others. That is precisely what a random SLOPE adds.
- `glmer(rt ~ night + (1 + night | subject), family = binomial)` ::no Reaction time is a continuous score, not a yes/no, so the binomial family and logit link are wrong. Use `lmer`; reserve `glmer` for yes/no or count outcomes.

=== step === concept
::eyebrow Handle with care
## Where random slopes and GLMMs bite

Five cautions before you trust one of these models in the wild:

- **Random slopes are hungry for data.** Estimating how a slope VARIES needs both enough groups and enough spread of the predictor within each group. With few groups, or a predictor that barely moves inside a group, expect singular fits. Eight clinics was workable here; five would be shaky.
- **Keep the random structure your data can support.** The maximal model is a fine goal, but if it will not converge, simplify: drop the correlations with `||`, then drop the least-supported random slope. A model that runs beats a maximal model that does not.
- **A GLMM's ICC is not** \(\tau^2/(\tau^2+\sigma^2)\). There is no residual variance on the response scale, so the clean Lesson-12 formula does not apply. Report the random-effect standard deviation on the log-odds scale, or use a purpose-built approximation.
- **`glmer` is slower and approximate.** It integrates over the random effects numerically (Laplace by default). For a stubborn single-intercept model, `nAGQ = 10` sharpens the approximation at the cost of speed.
- **Random effects are assumed exchangeable draws.** As in Lesson 12, treat a grouping as random only when its levels are interchangeable samples from a population you want to generalize to; a handful of fixed categories you care about individually belong in the fixed part.

[WARNING]
The commonest mistake is over-specifying random effects and then ignoring the singular-fit warning. If `lmer` or `glmer` warns, believe it: pare the random structure back to what the data can actually estimate.

=== step === concept
::eyebrow Go deeper
## References

- [Bates, Machler, Bolker and Walker (2015), Fitting Linear Mixed-Effects Models Using lme4 (JSS 67:1)](https://doi.org/10.18637/jss.v067.i01) - the definitive reference for `lmer` and `glmer` syntax, including the `(1 + x | g)` and `||` random-effects grammar used here.
- [Barr, Levy, Scheepers and Tily (2013), Random effects structure for confirmatory hypothesis testing: Keep it maximal (Journal of Memory and Language 68:255)](https://doi.org/10.1016/j.jml.2012.11.001) - the case for including the random slopes your design justifies, and the errors that follow from leaving them out.
- [Bolker et al. (2009), Generalized linear mixed models: a practical guide for ecology and evolution (Trends in Ecology and Evolution 24:127)](https://doi.org/10.1016/j.tree.2008.10.008) - a clear, applied tour of GLMMs: choosing families and links, fitting, and interpreting.
- [Bolker, GLMM FAQ](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html) - the community reference for troubleshooting: singular fits, convergence warnings, `allFit`, and when to worry.

=== step === complete
## Lesson 13 complete

You can now let a group's whole *relationship* vary, not just its baseline. A **random slope**, `lmer(y ~ x + (1 + x | g))`, gives each group its own intercept and slope drawn together from a 2 by 2 covariance \(\Sigma\); a likelihood-ratio test says whether it earns its place, and partial pooling steadies the noisy small-group slopes just as it did the intercepts. When the model resists, you can now read a **singular fit** or a **convergence warning** and fix it by rescaling, switching optimizer, or simplifying the random structure. And with `glmer` and a `family`, every one of these ideas carries onto yes/no and count outcomes as a **GLMM**, read on the odds scale.

That closes the Advanced Regression and GLMs course. You began with a line too easily tilted by a single outlier and end with models that give hundreds of groups their own honest, pooled story on whatever scale the outcome demands. From here two doors open: **GLMMs for counts** (Poisson and negative-binomial random-effects models for rates and events), and the fully **Bayesian multilevel model**, where partial pooling becomes a prior and the same clinics get full posterior uncertainty. You have the foundation for both.

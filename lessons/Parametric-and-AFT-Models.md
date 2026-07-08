---
title: "Survival Analysis Lesson 5: Parametric and AFT Models"
catalog_blurb: "Assume a shape for survival time to predict beyond your last follow-up."
description: "Fit Weibull and exponential survival models in R with survreg, read the accelerated failure time (AFT) time ratio, predict survival beyond your follow-up, and see when a parametric fit beats Cox."
keywords: "parametric survival models, accelerated failure time, AFT model in R, Weibull survival model, exponential survival, survreg, time ratio, survival extrapolation, survival analysis, Cox vs parametric"
post_type: "LESSON"
curriculum_id: "6.150.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "5"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Competing-Risks-and-Cumulative-Incidence.html"
course_prev: "Checking-Proportional-Hazards.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Parametric and AFT Models

For four lessons, every model Dr. Rao fit has refused to say one thing. Kaplan-Meier drew a staircase but stopped dead at the last observed death. Cox handed her a hazard ratio but shrugged when she asked what the baseline hazard actually looked like. Both were deliberately silent about the *shape* of survival time, and that silence has a cost: neither can tell a patient "you have about 26 months," and neither can say anything at all about the world past the end of the study.

This lesson breaks the silence. You will **commit to a shape** for the survival time itself, a smooth curve with a formula, and in return you get to predict real survival times, read a treatment's effect as "the drug multiplies your time by 1.65," and extend the survival curve confidently past the last follow-up.

By the end of this lesson you will be able to:

- Fit **exponential** and **Weibull** survival models with `survreg`, and read the Weibull shape to say whether risk rises, falls, or holds steady over time
- Interpret an **accelerated failure time (AFT)** coefficient as a **time ratio** that stretches the whole survival curve by one constant factor
- Predict a median survival time and a survival probability **beyond the follow-up window**, and choose a distribution (and know when a parametric fit beats Cox, and when it is risky)

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (the survival function \(S(t)\), the hazard \(h(t)\), right-censoring, `Surv()`), [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the empirical staircase and its median), [Lesson 3](Cox-Proportional-Hazards.html) (the hazard ratio \(e^{\beta}\), and that Cox never names the baseline hazard), and [Lesson 4](Checking-Proportional-Hazards.html) (the proportional-hazards promise \(S_1=S_0^{\text{HR}}\)). You can run R and read a coefficient table.

::widget km-curve {}

=== step === concept
::eyebrow Two questions Cox cannot answer
## Where the Cox model stops

Dr. Rao's new drug works. Lesson 3 proved it: her Cox model put the hazard ratio well below 1, protective even after adjusting for age. But two clinical questions keep coming back, and the Cox model cannot answer either one.

**First, a patient wants a number, not a ratio.** "Doctor, how long do I have?" A hazard ratio of 0.47 says nothing about *months*. To answer, you need an actual survival time, and for that you need the whole survival curve, not just a comparison of two hazards.

**Second, the trial closed at 36 months, but people live longer than that.** Roughly what fraction of drug patients are still alive at 5 years? Cox's baseline survival is a nonparametric staircase that simply *ends* at the last observed event; ask it about month 60 and it has nothing to say. There is no step out there to read.

Both gaps have the same fix: instead of leaving the survival time's shape unspecified, we will **assume it follows a specific distribution**. First, meet the data. We build Dr. Rao's 400-patient trial right here, because each lesson runs in its own fresh R session:

```r
library(survival)
set.seed(2024)

n   <- 400
trt <- rbinom(n, 1, 0.5)                    # 1 = new drug, 0 = standard care
age <- round(rnorm(n, 60, 9))

# the truth we simulate: the drug and youth MULTIPLY survival time
scale_i <- exp(3.0 + 0.5 * trt - 0.02 * (age - 60))
t_event <- rweibull(n, shape = 1.5, scale = scale_i)   # each patient's true event time

# follow-up: the study closes at 36 months, with some earlier dropout
dropout <- runif(n, 8, 60)
seen    <- pmin(dropout, 36)                 # last month we could still observe this patient
time    <- pmin(t_event, seen)               # what we record: event or last contact
status  <- as.integer(t_event <= seen)       # 1 = died, 0 = censored (still alive)

trial <- data.frame(
  time   = round(time, 1),
  status = status,
  arm    = factor(ifelse(trt == 1, "drug", "standard"), levels = c("standard", "drug")),
  age    = age
)
head(trial, 5)
#>   time status      arm age
#> 1 30.2      0     drug  60
#> 2 36.0      0 standard  64
#> 3  8.4      1     drug  53
#> 4 16.0      1     drug  62
#> 5  7.8      1 standard  69
table(trial$arm, trial$status)               # censored (0) and deaths (1) per arm
#>          
#>             0   1
#>   standard  46 152
#>   drug      99 103
```

Read a couple of rows so the table is concrete. Row 3 is a 53-year-old drug patient who died at month 8.4 (`status` 1). Row 2 is a 64-year-old on standard care who was still alive when the study closed at month 36, so we censor them (`status` 0): we know only that they lived *at least* 36 months. The `table` shows the drug arm is much more heavily censored (99 of 202 still alive at the end) precisely because those patients survive longer, exactly the good problem a parametric model helps us describe.

[KEY INSIGHT]
Kaplan-Meier and Cox are *nonparametric* about the baseline: they never write down a formula for how survival time is distributed. That makes them robust, but it is also why they cannot extrapolate or report a survival time. A parametric model trades a distributional assumption for the power to do both.

=== step === concept
::eyebrow Choosing the shape
## Every parametric model starts by picking a shape

A parametric survival model commits to a named distribution for the survival time \(T\). Which one? Look at what a survival time *is*: it is strictly positive (nobody survives for negative months) and usually right-skewed (most patients cluster at shorter times, a few live much longer). That rules out the symmetric bell of a normal model and points to a family of positive, right-skewed shapes.

The widget below shows this same logic from the world of regression: the *shape* of an outcome decides which distribution family fits it. Toggle to **Gamma**, the panel labelled "spend, claim size, time-to-complete." A time-to-complete is exactly a survival time: positive, right-skewed, a long tail of slow finishers. That is the shape we are looking for.

::widget glm-family-shapes {}

Survival analysis plays this same game with its own positive-support families. The three you will meet most often, in increasing flexibility:

- **Exponential**, the simplest: a single rate, a constant hazard.
- **Weibull**, the workhorse: adds a shape knob so the hazard can rise or fall over time.
- **Log-normal** and **log-logistic**, for hazards that rise then fall.

Committing to one lets us write the two curves from Lesson 1 as formulas. If \(T\) is the survival time, the **survival function** \(S(t)=\Pr(T>t)\) is the probability of living past \(t\), the **density** \(f(t)\) is how event times pile up, and the **hazard** \(h(t)=f(t)/S(t)\) is the risk of the moment. Censoring slots in cleanly: a patient who *dies* at \(t\) contributes \(f(t)\) to the likelihood, and a patient *censored* at \(t\) (alive when last seen) contributes \(S(t)\), the probability of surviving at least that long. Fitting just finds the distribution's parameters that make the observed deaths and survivals most likely.

=== step === concept
::eyebrow The simplest parametric model
## The exponential model: one constant hazard

Start with the simplest possible shape: a **constant hazard**. The exponential model says the risk of the moment never changes, \(h(t)=\lambda\) for some fixed rate \(\lambda>0\). Integrate that flat hazard and the survival curve is a clean exponential decay:

\[ h(t)=\lambda, \qquad S(t)=e^{-\lambda t}. \]

Here \(\lambda\) (lambda) is the constant hazard rate, and \(t\) is time in months. A larger \(\lambda\) means a steeper decay and shorter lives. In R, `survreg` fits it. Notice it models covariates on the **log-time** scale, so a positive coefficient means *longer* survival:

```r
exp_fit <- survreg(Surv(time, status) ~ arm + age, data = trial, dist = "exponential")
summary(exp_fit)
#>                Value Std. Error     z       p
#> (Intercept)  4.56047    0.45470 10.03 < 2e-16
#> armdrug      0.64913    0.12768  5.08 3.7e-07
#> age         -0.02552    0.00727 -3.51 0.00045
#>
#> Scale fixed at 1
#>
#> Exponential distribution
#> Loglik(model)= -1085.9   Loglik(intercept only)= -1106.1
#> n= 400
```

The `armdrug` coefficient is positive (0.649), confirming the drug extends survival, and `age` is negative, so older patients have shorter times. The line **`Scale fixed at 1`** is the whole personality of the exponential: it has no shape parameter to estimate, the hazard is locked flat.

[WARNING]
A constant hazard is a strong claim: it says a patient's risk of dying next month is the same whether they enrolled yesterday or have already survived three years. For most diseases that is simply false, risk climbs as the illness progresses. The exponential is a useful baseline and a building block, but rarely the final model. We need a shape that can bend.

=== step === quiz
::eyebrow Check yourself
## What does "constant hazard" mean?

Dr. Rao fits an exponential model, so its hazard is constant at \(h(t)=\lambda\). Which statement correctly describes what that assumes?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The number of patients still alive stays constant over time ::no With a constant hazard, patients keep dying, so the number alive falls steadily and \(S(t)=e^{-\lambda t}\) decays. What stays constant is the rate of dying, not the count of survivors.
- A patient's risk in the next month is the same whether they just enrolled or have already survived two years ::ok Right. A constant hazard is "memoryless": the risk of the moment does not depend on how long a patient has already lived. It is a strong, often unrealistic, assumption.
- Every patient survives for exactly the same length of time ::no Survival times still vary widely; they follow an exponential distribution. A constant hazard constrains the risk *rate*, not the individual outcomes.
- The survival curve \(S(t)\) is a flat horizontal line ::no \(S(t)=e^{-\lambda t}\) is a decaying curve, not flat. It is the hazard \(h(t)=\lambda\) that is flat over time.

=== step === concept
::eyebrow A shape that can bend
## The Weibull model: a hazard that rises or falls

The Weibull distribution keeps the exponential's simplicity but adds one knob: a **shape parameter** \(a\) that lets the hazard change over time. Its survival and hazard functions are

\[ S(t)=e^{-(t/b)^{a}}, \qquad h(t)=\frac{a}{b}\left(\frac{t}{b}\right)^{a-1}, \]

where \(b>0\) is the **scale** (a stretch of the time axis, in months) and \(a>0\) is the **shape**. The shape is the whole story of how risk evolves:

- \(a>1\): the hazard **rises** with time, risk accelerates as the disease runs (the usual case).
- \(a=1\): the hazard is **flat**, and the Weibull collapses back to the exponential.
- \(a<1\): the hazard **falls**, high early risk that eases (think early post-surgery mortality).

Run this to see all three shapes at once. It plots the Weibull hazard \(h(t)\) for a falling, flat, and rising shape:

```r
# Weibull hazard h(t) = (a/b) (t/b)^(a-1), three shapes at the same scale b = 20
haz <- function(x, a, b = 20) (a / b) * (x / b)^(a - 1)
curve(haz(x, 0.6), 0.1, 40, ylim = c(0, 0.15), lwd = 2, col = "tomato",
      xlab = "months", ylab = "hazard h(t)")
curve(haz(x, 1.0), 0.1, 40, add = TRUE, lwd = 2, col = "grey40")
curve(haz(x, 1.5), 0.1, 40, add = TRUE, lwd = 2, col = "steelblue")
legend("topright", c("a = 0.6  falling", "a = 1  flat (exponential)", "a = 1.5  rising"),
       col = c("tomato", "grey40", "steelblue"), lwd = 2, bty = "n")
```

Now fit the Weibull to Dr. Rao's trial and let the data choose the shape:

```r
wb_fit <- survreg(Surv(time, status) ~ arm + age, data = trial, dist = "weibull")
summary(wb_fit)
#>              Value Std. Error     z       p
#> (Intercept)  4.1949     0.2932 14.31 < 2e-16
#> armdrug      0.5028     0.0832  6.04 1.5e-09
#> age         -0.0198     0.0047 -4.20 2.6e-05
#> Log(scale)  -0.4420     0.0519 -8.52 < 2e-16
#>
#> Scale= 0.643
#>
#> Weibull distribution
#> Loglik(model)= -1056.1   Loglik(intercept only)= -1084.3
#> n= 400
```

The exponential's `Scale fixed at 1` is now a *fitted* `Scale= 0.643`. That is not the Weibull scale \(b\); it is `survreg`'s parameter \(\sigma\) (sigma), and the shape is its reciprocal, \(a=1/\sigma\):

```r
round(1 / wb_fit$scale, 3)   # Weibull shape a = 1 / Scale
#> [1] 1.556
```

A shape of **1.556** is comfortably above 1, so the hazard *rises* with time: Dr. Rao's patients face growing risk the longer their disease runs. And because the shape is not 1, the constant-hazard exponential was the wrong model. The data asked for a bendable curve.

=== step === concept
::eyebrow The interpretation that makes it click
## Reading AFT coefficients as time ratios

Why is `survreg` on the log-time scale, and what do those coefficients *mean*? Because `survreg` fits an **accelerated failure time (AFT)** model, which describes survival time directly:

\[ \log T = \beta_0 + \beta_1 x_1 + \dots + \sigma W. \]

Read it piece by piece. \(\log T\) is the log of the survival time, the \(x\)'s are the covariates (arm, age), \(\beta_0\) is the intercept, and \(\sigma W\) is random scatter (\(W\) is a standard noise term, \(\sigma\) its size). Because the left side is \(\log T\), a covariate acts by **adding** to log-time, which is the same as **multiplying** the time itself. Exponentiate a coefficient and you get a **time ratio**: the factor by which that covariate stretches or shrinks survival time.

```r
round(exp(coef(wb_fit)), 3)   # exp(coef) = time ratios
#> (Intercept)     armdrug         age 
#>      66.349       1.653       0.980 
```

The drug's time ratio is **1.653**. A drug patient's survival time is multiplied by about 1.65: they live roughly 65% longer than an otherwise-identical standard-care patient. Age's time ratio is 0.980, so each additional year of age shrinks survival time by about 2%. And the effect is precise, not a fluke:

```r
round(exp(confint(wb_fit)), 3)   # 95% confidence intervals for the time ratios
#>              2.5 %  97.5 %
#> (Intercept) 37.349 117.865
#> armdrug      1.404   1.946
#> age          0.971   0.989
```

The drug's time ratio is between 1.40 and 1.95 with 95% confidence, comfortably above 1. Now here is the phrase "accelerated failure time" made literal. A time ratio does not just move the median, it stretches **every** point of the survival curve by the same factor. Compute the 25th, 50th, and 75th percentile survival times for a 60-year-old in each arm and take their ratios:

```r
newpt <- data.frame(
  arm = factor(c("standard", "drug"), levels = c("standard", "drug")),
  age = c(60, 60)
)
q <- predict(wb_fit, newpt, type = "quantile", p = c(0.25, 0.5, 0.75))
rownames(q) <- c("standard", "drug"); colnames(q) <- c("q25", "q50", "q75")
round(q, 1)
#>          q25  q50  q75
#> standard 9.1 16.0 25.0
#> drug    15.0 26.5 41.3
round(q["drug", ] / q["standard", ], 3)   # the same factor at every percentile
#>   q25   q50   q75 
#> 1.653 1.653 1.653 
```

Every quantile scales by exactly **1.653**, the drug's time ratio. That is what an AFT model *is*: the treatment runs the survival clock slower (or faster) by one constant factor, stretching the entire curve. Nothing about early-versus-late, just a rescaling of time.

=== step === quiz
::eyebrow Check yourself
## Reading a time ratio

Dr. Rao's Weibull AFT model gives the new drug a **time ratio of 1.65**. Which interpretation is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A drug patient's survival time is multiplied by about 1.65, so they live roughly 65% longer than a comparable standard-care patient ::ok Right. In an AFT model \(e^{\beta}\) is a time ratio, and 1.65 stretches survival time (every quantile) by that factor. Above 1 means longer life, so the drug is protective.
- A drug patient's hazard is multiplied by 1.65, so the drug raises the risk of death ::no That confuses a time ratio with a hazard ratio, and it flips the sign. A time ratio of 1.65 stretches survival *time*; because it is above 1, the drug *lowers* risk, it does not raise it.
- A drug patient dies about 1.65 months sooner ::no A time ratio is multiplicative, not a fixed number of months, and 1.65 means *longer* life, not sooner death. It scales the whole curve rather than subtracting a constant.
- Only the median survival is multiplied by 1.65; other survival times are unaffected ::no An AFT time ratio scales *every* quantile by the same factor, not just the median, as the 25th, 50th, and 75th percentiles all scaling by 1.653 showed.

=== step === tryit
::eyebrow Your turn
## Fit the Weibull model

Dr. Rao's `trial` data frame is in memory. Fit an accelerated failure time model with the Weibull distribution, then print its shape. Fill in the distribution argument.

```r
# Fit a Weibull AFT model, then read its shape (a = 1 / Scale)
wb <- survreg(Surv(time, status) ~ arm + age, data = trial, dist = ____)
round(1 / wb$scale, 3)
```
::check {"regex":"dist\\s*=\\s*.weibull","gate":true,"difficulty":"beginner","ok":"That fits the Weibull AFT model. Its shape prints as 1.556, above 1, so the hazard rises with time: risk grows the longer the disease runs.","no":"Set the distribution argument to the Weibull family: dist takes the family name as a quoted string. It generalizes the exponential by adding a shape parameter."}
::solution
```r
wb <- survreg(Surv(time, status) ~ arm + age, data = trial, dist = "weibull")
round(1 / wb$scale, 3)
```

=== step === concept
::eyebrow The payoff
## Predicting real survival times, even past the follow-up

Here is what committing to a shape buys back: actual survival times, and answers beyond the data. First the median survival time for a 60-year-old in each arm, the number a patient actually wants:

```r
round(predict(wb_fit, newpt, type = "quantile", p = 0.5), 1)   # median survival, months
#>    1    2 
#> 16.0 26.5 
```

A standard-care patient's median survival is 16.0 months; a drug patient's is 26.5. (And 16.0 times the time ratio 1.653 is 26.5, the scaling again.) Now the question Cox could not touch: what fraction is still alive at **60 months**, well past the 36-month close of the study? With a fitted Weibull we just read the formula \(S(t)=e^{-(t/b)^{a}}\), where the scale \(b=e^{x'\beta}\) comes from the linear predictor and \(a\) is the shape:

```r
a <- 1 / wb_fit$scale                                  # Weibull shape
b <- exp(predict(wb_fit, newpt, type = "linear"))      # Weibull scale, one per patient
round(b, 1)
#>    1    2 
#> 20.3 33.5 
Sfun <- function(t) round(exp(-(t / b)^a), 3)          # S(t) = exp(-(t/b)^a)
data.frame(arm = newpt$arm, S_at_36mo = Sfun(36), S_at_60mo = Sfun(60))
#>        arm S_at_36mo S_at_60mo
#> 1 standard     0.087     0.004
#> 2     drug     0.327     0.084
```

At 5 years the model estimates about 8.4% of drug patients still alive against 0.4% of standard-care patients, a genuine extrapolation the nonparametric staircase could never give. Plot it to see the whole story: the Kaplan-Meier steps (the data), the smooth Weibull fit laid over them, and the fit continuing confidently past the follow-up line at month 36:

```r
km <- survfit(Surv(time, status) ~ arm, data = trial)
plot(km, col = c("grey40", "steelblue"), lwd = 2, mark.time = FALSE,
     xlab = "months", ylab = "S(t)", xlim = c(0, 60))
tt <- seq(0, 60, 0.5)
for (a_arm in c("standard", "drug")) {
  lp <- predict(wb_fit, data.frame(arm = factor(a_arm, levels = c("standard", "drug")), age = 60),
                type = "linear")
  lines(tt, exp(-(tt / exp(lp))^a), lty = 2, lwd = 2,
        col = ifelse(a_arm == "drug", "steelblue", "grey40"))
}
abline(v = 36, col = "grey70", lty = 3)   # study closed here; the dashed curves past it are extrapolation
legend("topright", c("Kaplan-Meier (data)", "Weibull fit + extrapolation"),
       lty = c(1, 2), lwd = 2, bty = "n")
```

The dashed Weibull curves track the KM staircases closely inside the data, then glide smoothly past month 36 where the staircases simply stop. That extension is the payoff, and, as we will see, also the risk.

=== step === concept
::eyebrow One model, two lenses
## AFT and PH are the same Weibull

You now have two ways to describe the drug's effect: the AFT **time ratio** of 1.65 (from this lesson) and the Cox **hazard ratio** from Lesson 3. They sound like different worlds, one multiplies time, the other multiplies risk. For the Weibull, they are the *same model seen from two angles*. In fact the Weibull is the only distribution that is both an AFT model and a proportional-hazards model, and the two are linked by a clean formula:

\[ \text{HR} = e^{-\beta/\sigma} = (\text{time ratio})^{-a}. \]

A covariate that stretches time (time ratio above 1) must lower the hazard (HR below 1); they are two descriptions of one effect. Check it. Compute the hazard ratio the Weibull *implies* from its AFT coefficients, and fit a separate Cox model to the same data for comparison:

```r
cox_fit <- coxph(Surv(time, status) ~ arm + age, data = trial)
round(exp(coef(cox_fit)), 3)                                    # Cox hazard ratios
#>  armdrug     age 
#>    0.466   1.031 
round(exp(-coef(wb_fit)[c("armdrug", "age")] / wb_fit$scale), 3)   # Weibull-implied HR
#>  armdrug     age 
#>    0.457   1.031 
```

The Weibull's implied drug hazard ratio is **0.457**, and Cox, fit independently with no distributional assumption, gets **0.466**. Nearly identical. The drug's time ratio of 1.65 and its hazard ratio of about 0.46 are not two competing answers, they are one effect in two vocabularies. Toggle the widget to feel the hazard-ratio view: an HR below 1 pulls the survival curve *up*, exactly the "lives longer" story the time ratio told.

::widget hazard-ratio {}

[KEY INSIGHT]
When the true survival time really is Weibull, the AFT and Cox descriptions agree because they are describing the same thing. The AFT view gives you interpretable survival *times* and extrapolation; the Cox view gives you a robust hazard ratio without committing to a shape. Same effect, different currency.

=== step === quiz
::eyebrow Check yourself
## Time ratio 1.65, hazard ratio 0.46

From one Weibull fit, Dr. Rao reads a drug time ratio of 1.65, and its implied hazard ratio of 0.457 matches a Cox HR of 0.47. Which statement is correct?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- The models contradict each other: the time ratio (1.65) says the drug helps while the hazard ratio (0.46) says it harms ::no Both say the drug helps. A time ratio above 1 means longer life, and a hazard ratio below 1 means lower risk, so they agree. The confusion comes from reading them on the same scale; they are inverse views.
- They agree: for a Weibull, the AFT time ratio (above 1, longer life) and the PH hazard ratio (below 1, lower risk) are two views of the same effect, linked by \(\text{HR}=e^{-\beta/\sigma}\) ::ok Right. The Weibull is both an AFT and a proportional-hazards model, so the time ratio and hazard ratio are the same effect in two vocabularies, and Cox recovers the same number without assuming a shape.
- The close match proves the Weibull distribution is correct, so extrapolation past follow-up is now guaranteed safe ::no Two lenses on the *same* fit agreeing does not validate the shape, and no fit statistic guarantees extrapolation. Trust in the far tail comes from checking the shape against the data, not from the AFT and PH views matching.
- Cox and Weibull will always return the same hazard ratio on any data set ::no Only when the survival time truly is Weibull (proportional hazards holds) do they coincide. On non-Weibull data the parametric HR and the Cox HR can diverge, which is one way to catch a bad distributional assumption.

=== step === concept
::eyebrow Choosing wisely
## Which distribution, and when to trust it

Dr. Rao has fit three shapes now. Which to report? Compare them with the **AIC** (Akaike Information Criterion), which rewards fit and penalizes extra parameters; lower is better:

```r
ln_fit <- survreg(Surv(time, status) ~ arm + age, data = trial, dist = "lognormal")
round(AIC(exp_fit, wb_fit, ln_fit), 1)     # lower AIC = better trade of fit vs complexity
#>         df    AIC
#> exp_fit  3 2177.7
#> wb_fit   4 2120.2
#> ln_fit   4 2157.2
```

The Weibull wins decisively (2120 against 2157 and 2178). The exponential is far behind, its forced constant hazard fits Dr. Rao's rising-risk data poorly, and the log-normal, with its rise-then-fall hazard, fits worse than the Weibull here. AIC gives an honest, data-driven vote.

So when does a parametric model beat Cox, and when does it burn you?

- **Reach for parametric when** you need a survival *time* or probability, when you must **extrapolate** past the data, when you want the interpretable time-ratio statement, or when the shape is well understood and a smooth curve is more efficient than a staircase.
- **Stay with Cox when** you only need a hazard ratio and do not want to bet on a shape. Cox is robust precisely because it assumes nothing about the baseline.

[WARNING]
Extrapolation is a loan against your assumption. The 5-year survival estimate is only as trustworthy as the Weibull shape being right out there in the tail, where you have no data to check it. A tiny p-value on a coefficient says nothing about whether the *distribution* is correct far past your last observation. Always overlay the fit on the KM curve (as we did) and compare distributions before you extend a curve into territory you never observed.

When `survreg`'s handful of shapes is too rigid, richer families exist. This runs locally (it needs a package beyond the browser session):

```r-static
library(flexsurv)
# generalized gamma nests the Weibull, gamma and log-normal in one family,
# so you can let the data choose among them and formally test the Weibull shape.
fs <- flexsurvreg(Surv(time, status) ~ arm + age, data = trial, dist = "gengamma")
fs
```

=== step === tryit
::eyebrow Your turn
## Predict a survival probability

Use Dr. Rao's fitted `wb_fit` to estimate the probability that a 60-year-old **drug** patient survives past 24 months. The scale `b` and shape `a` for this patient are set up for you; fill in the Weibull survival function \(S(t)=e^{-(t/b)^{a}}\) at \(t=24\).

```r
a  <- 1 / wb_fit$scale
b  <- exp(predict(wb_fit,
        data.frame(arm = factor("drug", levels = c("standard", "drug")), age = 60),
        type = "linear"))
# S(t) = exp( -(t / b)^a ). Fill in the survival probability at t = 24 months:
S24 <- ____
round(S24, 3)
```
::check {"regex":"24\\s*/\\s*b.*\\^\\s*a","gate":true,"difficulty":"intermediate","ok":"That returns 0.551: the model puts a 60-year-old drug patient's chance of surviving past 2 years at about 55%. You just read a real probability straight off a fitted survival curve.","no":"Plug t = 24 into S(t) = exp(-(t/b)^a): write exp(-(24 / b)^a). The scale b and shape a are already defined above."}
::solution
```r
a  <- 1 / wb_fit$scale
b  <- exp(predict(wb_fit,
        data.frame(arm = factor("drug", levels = c("standard", "drug")), age = 60),
        type = "linear"))
S24 <- exp(-(24 / b)^a)
round(S24, 3)
```

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [survival: Survival Analysis (CRAN package page)](https://cran.r-project.org/package=survival) - the reference manual and vignettes for `survreg` and the parametric distributions you fit here.
- [Wei (1992), The accelerated failure time model, Statistics in Medicine 11(14-15):1871](https://doi.org/10.1002/sim.4780111409) - the classic argument for AFT as a useful, interpretable alternative to Cox regression.
- [Jackson (2016), flexsurv: A Platform for Parametric Survival Modeling in R, J Stat Software 70(8)](https://doi.org/10.18637/jss.v070.i08) - flexible parametric families (generalized gamma, splines) beyond `survreg`, and how to compare them.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a gentle textbook companion on survival analysis and these models.

=== step === complete
## Lesson 5 complete

You can now make a survival model name the shape it was hiding. The **exponential** assumes one constant, memoryless hazard (\(S(t)=e^{-\lambda t}\), `Scale fixed at 1`); the **Weibull** adds a shape \(a\) so the hazard can rise (\(a>1\)), fall (\(a<1\)), or stay flat (\(a=1\)), and Dr. Rao's data chose \(a=1.556\), a rising risk. `survreg` fits both on the **accelerated failure time** scale, where \(e^{\beta}\) is a **time ratio**: the drug's 1.65 stretches *every* survival quantile by the same factor (16.0 to 26.5 months at the median). That shape is what lets you **predict** real survival times and extend the curve past the 36-month follow-up (about 8% of drug patients alive at 5 years), and it ties the AFT and Cox worlds together, the time ratio 1.65 and the hazard ratio 0.46 being one effect in two vocabularies. Choose the distribution by AIC, and never trust the far tail more than the shape that draws it.

Next, Lesson 6: competing risks and cumulative incidence. When patients can fail from more than one cause, the familiar "1 minus Kaplan-Meier" quietly overcounts, and you will see why, and what to compute instead.

---
title: "Survival Analysis Lesson 5: Parametric and AFT Models"
catalog_blurb: "Commit to a curve shape and predict survival beyond the end of follow-up."
description: "Fit Weibull survival models in R with survreg, read AFT coefficients as time ratios, check the shape against Kaplan-Meier, and predict past follow-up."
keywords: "parametric survival analysis in R, accelerated failure time model, AFT model in R, survreg, Weibull survival model, exponential survival, time ratio, survival extrapolation, flexsurv, Weibull vs Cox"
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

In Lesson 4 you put the Cox model's one promise on trial. This lesson confronts the one thing every tool so far has refused to do: say what the survival curve actually looks like. Kaplan-Meier hands Dr. Rao a jagged staircase that stops dead at 24 months, the end of her follow-up. Cox deliberately leaves the baseline hazard blank. So when her newest patient, Mr. Sharma, 65 years old and weighing his options, asks the question every patient asks, "how long, doctor?", neither model can give him a smooth curve, a personal median, or any number at all beyond month 24.

A parametric model can, because it commits. It assumes the event times follow a named distribution, a Weibull or an exponential, and estimates that distribution's two or three parameters from the data. Commit to a shape and you get smooth survival curves, a predicted median for Mr. Sharma specifically, and careful answers past the end of the data.

By the end of this lesson you will be able to:

- Say what a parametric survival model commits to, and read the Weibull shape: falling, constant, or rising risk
- Read `survreg` output as accelerated time, where exp(coef) multiplies survival time itself, and reconcile it with Lesson 3's hazard ratio
- Predict a specific patient's median survival, check the fitted shape against the Kaplan-Meier staircase, and judge when extrapolating past follow-up is defensible

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (the survival function S(t), the hazard, right-censoring), [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the KM staircase and its median), and [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model and its hazard ratio of 0.36). You can run R and read a coefficient table.

Below is the staircase you have drawn since Lesson 2: jagged, and silent past the last observation. By the end of this lesson you will lay a smooth curve over it, one with a name, a formula, and an opinion about month 30.

::widget km-curve {}

=== step === concept
::eyebrow The idea
## Name the shape

Think about what the Kaplan-Meier staircase really is: a model with no opinions. It assumes nothing about the shape of risk, and it pays for that humility three times over. The curve can only move at observed death times, so between deaths it pretends risk is zero. Its estimate wobbles hard in a 30-patient trial like Dr. Rao's. And at the last observation it simply ends, with nothing to say about any later month.

The parametric move is to spend one assumption and buy all three problems back. Assume the survival times were drawn from a named probability distribution, a formula with two or three unknown parameters, then estimate those parameters from the 30 patients. Now the whole curve is smooth, every month has an estimate, and the formula extends as far as you dare trust it.

Which named shapes are candidates? Survival times are strictly positive (nobody survives negative months) and usually right-skewed: events pile up early-to-middle and a long tail of durable survivors stretches right. Toggle the widget below, a menu of density shapes for exactly this kind of outcome. Focus on the Gamma panel: positive, humped near the typical value, long right tail. That silhouette is what a duration looks like. (Beta, bounded between 0 and 1, is for proportions, not times; Tweedie is for costs with a pile of zeros. If you took the Advanced Regression course, you have seen this pick-the-shape move before.) Survival analysis keeps its own menu with the duration silhouette: the exponential, the Weibull, the log-normal.

::widget glm-family-shapes {}

And censoring, the thing that breaks ordinary regression (Lesson 1), slots into the fitting machinery cleanly. Parametric models are fit by maximum likelihood, which asks: which parameter values make the data we actually saw most probable? Each patient contributes exactly what we know about them. A patient who died at time \(t_i\) contributes the density \(f(t_i)\), the probability of an event right there. A patient censored at \(t_i\) contributes the survival function \(S(t_i)\), the probability of lasting beyond \(t_i\), which is all we know:

\[ L = \prod_{\text{deaths}} f(t_i) \;\times \prod_{\text{censored}} S(t_i). \]

No throwing censored patients away, no pretending they died. Every row of the data tells the likelihood precisely as much as it knows, and nothing more.

[KEY INSIGHT]
Kaplan-Meier estimates the whole curve point by point and stops at the data's edge. A parametric model estimates two or three numbers, and the named formula does the rest: smoothness, per-patient medians, and predictions beyond the data all flow from the shape you committed to. That is also the risk. If the shape is wrong, everything it bought is wrong with it.

=== step === concept
::eyebrow The workhorse
## One knob for the shape of risk

Start with the simplest possible commitment. The **exponential** distribution says the hazard, the risk-of-the-moment from Lesson 1, is one flat constant at every age of follow-up. A thing that fails this way is called **memoryless**: a light bulb that has burned for a year is exactly as likely to fail tonight as a brand-new one. For bulbs that is roughly true. For Dr. Rao's patients it is plainly false; risk climbs as the disease advances.

The **Weibull** distribution fixes that with one extra number. It has a scale \(\lambda\) (lambda) and a shape \(k\), and its hazard and survival functions are

\[ h(t) = \frac{k}{\lambda}\left(\frac{t}{\lambda}\right)^{k-1}, \qquad S(t) = \exp\!\left[-\left(\frac{t}{\lambda}\right)^{k}\right]. \]

Both parameters have plain meanings. The scale \(\lambda\) is a characteristic lifetime in months: whatever the shape, by time \(t = \lambda\) exactly \(1 - e^{-1} \approx 63\%\) of subjects have had the event. The shape \(k\) bends the hazard, and its three regimes each tell a different everyday story:

- \(k < 1\): risk starts high and falls. Hip implants: most failures happen in the first months after surgery (loosening, infection), and an implant that settles in rarely fails later.
- \(k = 1\): risk is flat. This is the exponential, the memoryless light bulb, as a special case.
- \(k > 1\): risk grows with time. Machine bearings wearing out, and, plausibly, Dr. Rao's patients as the disease progresses.

Run the block to draw all three regimes with the same characteristic lifetime:

```r
# The Weibull hazard: one scale (lambda, months) and one shape (k)
h <- function(t, k, lam) (k / lam) * (t / lam)^(k - 1)

curve(h(x, 0.6, 12), from = 0.2, to = 24, ylim = c(0, 0.3),
      lwd = 2, col = "steelblue", xlab = "months", ylab = "hazard h(t)",
      main = "Three Weibull hazard shapes")
curve(h(x, 1.0, 12), add = TRUE, lwd = 2, col = "grey40")
curve(h(x, 2.2, 12), add = TRUE, lwd = 2, col = "firebrick")
legend("topleft", bty = "n", lwd = 2,
       col = c("steelblue", "grey40", "firebrick"),
       legend = c("k = 0.6  risk falls (early failures)",
                  "k = 1.0  constant risk (exponential)",
                  "k = 2.2  risk rises (wear-out)"))
```

One family, three lives of risk, selected by a single knob the data can estimate.

[NOTE]
The menu has more entries. The log-normal and log-logistic allow a hazard that rises and then falls, a pattern seen after surgery, where risk peaks in recovery and then eases. The Weibull cannot bend that way, and later in this lesson you will let the data referee between shapes.

=== step === quiz
::eyebrow Check yourself
## Which shape is that?

A hospital tracks how long hip implants last before needing replacement. Failures pile up in the first few months after surgery (loosening, infection), and an implant that survives its first year almost never fails afterward. Which Weibull shape fits this story?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Shape k below 1: the hazard starts high and falls, a burst of early failures followed by calm ::ok Right. Failures cluster early exactly because the risk-of-the-moment is highest at the start; survivors face ever-lower risk. That falling hazard is the k below 1 regime.
- Shape k above 1: lots of early failures means the risk must be rising ::no This confuses many early EVENTS with rising RISK. Failures cluster early here because the hazard starts high and then falls; k above 1 is the wear-out story, where risk grows with age, the opposite of this one.
- Shape k equal to 1: failures happen throughout, so risk is constant ::no k equal to 1 is the memoryless case: a year-old implant would be exactly as risky as a fresh one. Here age clearly changes risk, so the hazard is not flat.
- No Weibull fits: a Weibull hazard can only increase ::no The shape knob covers all three regimes. With k below 1 the Weibull hazard falls; only k above 1 makes it rise.

=== step === concept
::eyebrow The second idea
## Accelerated time: effects stretch the clock

Now bring in covariates. Cox let the drug multiply the hazard. The parametric tradition uses a different, arguably more human dial: it lets a covariate stretch or shrink time itself. This is the **accelerated failure time** view, AFT for short.

Concrete first. The saying goes that one dog year equals seven human years: a 10-year-old dog is "as old as" a 70-year-old person, the same life run at seven times the speed. An AFT model says a covariate does that to disease time. If Dr. Rao's drug carries a **time ratio** of 1.6, a patient on the drug reaches every milestone of the disease 1.6 times later. What took 10 months on standard care takes 16 on the drug. The clock of the illness runs slower.

Formally, an AFT model is ordinary regression on the logarithm of survival time \(T\):

\[ \log T = \beta_0 + \beta_1\,\text{arm} + \beta_2\,\text{age} + \sigma\,W, \]

where the \(\beta\)s (betas) are coefficients on the log-time scale, \(\sigma\) (sigma) is a spread parameter, printed as Scale in R output, and \(W\) is a standardized error term whose distribution picks the family (an extreme-value \(W\) makes \(T\) Weibull). Because the outcome is log time, exponentiating a coefficient multiplies time: \(\text{TR} = e^{\beta}\) is the time ratio, also called the acceleration factor. TR above 1 stretches survival time, good news; TR below 1 compresses it. In curve language, \(S_{\text{drug}}(t) = S_{\text{std}}(t/\text{TR})\): the drug arm's survival at 16 months equals the standard arm's at 10.

Here is the coincidence that makes the Weibull the workhorse of parametric survival: for the Weibull family, and only the Weibull family (with its exponential special case), the AFT model and the proportional-hazards model are the same model in different clothes. Stretching time by TR is exactly the same curve as multiplying the hazard by

\[ \text{HR} = \text{TR}^{-k} = e^{-\beta/\sigma}, \]

where \(k = 1/\sigma\) is the Weibull shape. Toggle the widget below and read the gap between the curves both ways. Vertically, one curve's risk is a fixed multiple of the other's at every instant: the hazard-ratio reading, Lesson 3's language. Horizontally, one curve reaches every survival level later by a fixed stretch factor: the time-ratio reading. Same two curves, two dialects.

::widget hazard-ratio {}

[KEY INSIGHT]
A Cox coefficient speaks hazard: the drug multiplies the risk of dying right now by 0.36. An AFT coefficient speaks time: the drug multiplies survival time by 1.6. Patients and clinicians usually find the time sentence easier to grasp and repeat. Mind the directions, though: they run opposite ways. A helpful drug has a time ratio ABOVE 1 but a hazard ratio BELOW 1.

=== step === concept
::eyebrow In R
## survreg on Dr. Rao's trial

Time to fit one. The `survival` package's `survreg()` fits parametric AFT models; `dist = "weibull"` is the default and our shape of choice, since the disease's risk plausibly climbs with time. Each lesson starts a fresh R session, so rebuild the trial exactly as Lessons 3 and 4 built it:

```r
library(survival)

# Dr. Rao's 30 patients, exactly as Lessons 3 and 4 built them.
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

wfit <- survreg(Surv(months, status) ~ arm + age, data = trial,
                dist = "weibull")
summary(wfit)
#> Call:
#> survreg(formula = Surv(months, status) ~ arm + age, data = trial,
#>     dist = "weibull")
#>               Value Std. Error     z       p
#> (Intercept)  6.4729     1.2397  5.22 1.8e-07
#> armnew       0.4906     0.2034  2.41  0.0158
#> age         -0.0597     0.0190 -3.14  0.0017
#> Log(scale)  -0.8007     0.1853 -4.32 1.6e-05
#>
#> Scale= 0.449
#>
#> Weibull distribution
#> Loglik(model)= -73   Loglik(intercept only)= -80
#>   Chisq= 13.93 on 2 degrees of freedom, p= 0.00095
#> Number of Newton-Raphson Iterations: 5
#> n= 30
```

Read the table with AFT eyes: every coefficient lives on the log-time scale.

- **armnew = 0.4906** (p = 0.016). Exponentiate: \(e^{0.4906} = 1.63\). On the new drug, survival time stretches by 63%, holding age fixed. That is the time ratio from the last step, estimated from real data.
- **age = -0.0597**. Each extra year of age multiplies survival time by \(e^{-0.0597} = 0.94\), about 6% less time per year, holding arm fixed.
- **Scale = 0.449**. That is \(\sigma\). R estimates it on the log scale, which is the `Log(scale)` row above: \(e^{-0.8007} = 0.449\). So the Weibull shape is \(k = 1/0.449 = 2.23\). Well above 1: a rising, wear-out hazard, exactly the regime the disease story predicted.

One small block translates the fit into all three languages at once:

```r
sigma <- wfit$scale
round(c(time_ratio_drug = exp(coef(wfit))[["armnew"]],
        shape_k         = 1 / sigma,
        implied_HR      = exp(-coef(wfit)[["armnew"]] / sigma)), 3)
#> time_ratio_drug         shape_k      implied_HR
#>           1.633           2.227           0.335
```

Look at that implied hazard ratio: 0.335. Lesson 3's Cox model, which refused to commit to any shape at all, estimated 0.357 for the same drug in the same patients (we reported it as 0.36). Two completely different roads, one effect. When the committed shape fits, the parametric model agrees with Cox and then keeps going, saying things Cox cannot.

=== step === tryit
::eyebrow Your turn
## Answer Mr. Sharma

Mr. Sharma is 65 and weighing the two arms. The staircase cannot answer him; your fitted Weibull can. On a `survreg` fit, `predict()` returns time quantiles: ask it for the 50% quantile, the predicted **median** survival time, for a 65-year-old on each arm. Fill in the blank.

```r
newpat <- data.frame(
  arm = factor(c("standard", "new"), levels = c("standard", "new")),
  age = 65)

predict(wfit, newdata = newpat, type = "____", p = 0.5)
```
::check {"regex":"type\\s*=\\s*.quantile","gate":true,"difficulty":"intermediate","ok":"That is it: asking for the 0.5 quantile of each fitted time distribution returns the predicted medians, 11.3 months on standard care and 18.5 on the drug. And 18.5 divided by 11.3 is 1.63, the time ratio made flesh.","no":"Ask for a time QUANTILE: set type to quantile (with p = 0.5, the median). A survreg prediction is a time, and the median is the 50 percent quantile of the fitted time distribution."}
::solution
```r
newpat <- data.frame(
  arm = factor(c("standard", "new"), levels = c("standard", "new")),
  age = 65)
predict(wfit, newdata = newpat, type = "quantile", p = 0.5)
#>        1        2
#> 11.34978 18.53843
```

=== step === concept
::eyebrow Trust, then verify
## Does the Weibull actually fit?

Everything the parametric model buys rests on the shape being right, so check it the honest way: lay the fitted smooth curve over the Kaplan-Meier staircase and look. If the smooth curve rides the steps, the commitment was sound. If it cuts corners systematically, too high early and too low late, or the reverse, the shape is wrong and every prediction it makes is decoration.

The overlay uses a small trick: `survreg` predicts time quantiles, so hand it a grid of survival levels and plot predicted time against level. One flip to keep straight: quantiles count from the event side. At a survival level of 0.90, 10% of patients have had the event, so that point on the curve is the 0.10 quantile. Hence `p = 1 - s` below.

```r
km <- survfit(Surv(months, status) ~ arm, data = trial)
plot(km, col = c("grey40", "firebrick"), lwd = 2,
     xlab = "months", ylab = "fraction still event-free",
     main = "The staircase vs the committed shape")

s <- seq(0.995, 0.005, by = -0.005)   # survival levels: 99.5% down to 0.5%
pat_std <- data.frame(arm = factor("standard", levels = c("standard", "new")), age = 65)
pat_new <- data.frame(arm = factor("new",      levels = c("standard", "new")), age = 65)
lines(predict(wfit, newdata = pat_std, type = "quantile", p = 1 - s), s,
      lty = 2, lwd = 2, col = "grey40")
lines(predict(wfit, newdata = pat_new, type = "quantile", p = 1 - s), s,
      lty = 2, lwd = 2, col = "firebrick")
legend("bottomleft", bty = "n", lwd = 2, col = c("grey40", "firebrick"),
       legend = c("standard: KM steps + Weibull (dashed)",
                  "new drug: KM steps + Weibull (dashed)"))
```

The dashed Weibull curves track both staircases well: same starting plunge, same ordering, same neighborhood for the medians. (One honest footnote: the dashed curves are drawn for a 65-year-old, while each staircase pools its arm's actual ages, so small gaps are expected even from a perfect shape.)

Eyes first, then a number. The **AIC** (Akaike information criterion) scores each candidate distribution's fit with a penalty for extra parameters; lower is better, and gaps of 2 or less are within noise:

```r
dists <- c("exponential", "weibull", "lognormal")
round(sapply(dists, function(d)
  AIC(survreg(Surv(months, status) ~ arm + age, data = trial, dist = d))), 1)
#> exponential     weibull   lognormal
#>       165.2       154.1       153.1
```

The exponential loses by 11 points: decisive evidence that a flat, memoryless hazard is the wrong story for this disease, just as Scale told us (k = 2.23). The log-normal edges the Weibull by 1.0 point, and a 1-point gap on 30 patients is a coin flip, not a verdict. We stay with the Weibull for its translation superpower, the only family that speaks both time ratios and hazard ratios, and we note honestly that a log-normal fit would predict similarly here.

=== step === concept
::eyebrow The payoff
## Month 30, and other things Cox cannot say

Dr. Rao's follow-up ended at 24 months, but her hospital board asks a fair question: what fraction of patients on the new drug will still be event-free at month 30? The staircase is silent; it ended. Cox is silent; it has no baseline shape to extend. The Weibull has a formula, and formulas do not stop. Two ingredients: the model's **linear predictor** for a patient, the fitted \(\beta_0 + \beta_1\,\text{arm} + \beta_2\,\text{age}\) sum, is exactly \(\log\lambda\), the log of that patient's characteristic lifetime. Exponentiate it to get \(\lambda\), then plug month 30 into the survival formula from the Weibull step:

```r
pat <- data.frame(
  arm = factor(c("standard", "new"), levels = c("standard", "new")),
  age = 65)
lp <- predict(wfit, newdata = pat, type = "lp")   # linear predictor = log(lambda) per patient
round(exp(-(30 / exp(lp))^(1 / wfit$scale)), 3)   # Weibull S(30) = exp(-(t/lambda)^k)
#>     1     2
#> 0.002 0.132
```

For a 65-year-old: about 13% on the drug, essentially zero on standard care. Be clear-eyed about what you just did. Months 24 to 30 contain no data at all; the 13% is the formula's opinion, and it deserves exactly as much trust as the shape check in the last step earned, thinning the further past the data you push. Quote it with its assumption attached: "if the Weibull pattern we validated through month 24 continues."

So when do you reach for a parametric model, and when for Cox?

| You need | Reach for |
|---|---|
| A shape-free estimate of a hazard ratio | Cox |
| Smooth per-patient curves and medians | Parametric |
| Any statement beyond the last observation | Parametric, shape check attached |
| Stable estimates from a small trial, shape roughly right | Parametric |
| Effects in time language patients can repeat | Parametric (AFT) |
| A hazard no simple family matches | Cox, or flexible splines below |

And when the fixed menu feels too rigid, the `flexsurv` package fits everything `survreg` does plus spline-based shapes that bend where the data demands. Run this one on your own machine:

```r-static
# On your own machine: flexible parametric fits beyond the survreg menu
library(flexsurv)
ffit <- flexsurvreg(Surv(months, status) ~ arm + age, data = trial,
                    dist = "gengamma")   # generalized gamma: nests Weibull and log-normal
ffit
plot(ffit)   # KM staircase with the fitted curve and its confidence band, one line
```

=== step === quiz
::eyebrow Check yourself
## Two models, two numbers

Your `survreg` output says exp(coef) = 1.63 for the new drug. Lesson 3's Cox model said the hazard ratio is 0.36. A colleague objects: "one model says 1.63, the other says 0.36; they cannot both be right, so I would not trust that month-30 extrapolation either." What do you tell her?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- She is right about the numbers: 1.63 means 63% more risk, so the two models genuinely disagree about the drug ::no survreg speaks TIME, not risk. Its 1.63 multiplies survival time (longer is better) while a hazard ratio multiplies instantaneous risk (lower is better). Both numbers say the drug helps, in opposite dialects.
- The two agree: 1.63 stretches time and 0.36 cuts hazard, and under the Weibull HR = TR to the power minus k = 1.63^(-2.23), about 0.34, right beside Cox's 0.36. The month-30 number stands or falls on the shape check, not on this comparison ::ok Exactly. Time ratios and hazard ratios run in opposite directions, and for a Weibull fit they are two readings of one model: HR = TR^(-k) = 0.335 here, agreeing with Cox's shape-free 0.357. Whether to trust month 30 is a separate question, answered by how well the committed shape tracked the KM staircase.
- They estimate the same quantity, so one of the two fits must simply have failed to converge ::no Both fits are sound and both summarize the same benefit. They are different scales, not competing estimates: one multiplies time, the other multiplies hazard, and under the Weibull each converts exactly into the other.
- The extrapolation is trustworthy regardless, because both models found the drug significant at p below 0.05 ::no Significance says the effect is unlikely to be zero. It says nothing about whether the Weibull shape keeps holding past month 24, and that, not any p-value, is what an extrapolation leans on.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical reference for `survreg`, its distributions, and prediction, by the package's author.
- [Jackson (2016), flexsurv: A Platform for Parametric Survival Modeling in R, Journal of Statistical Software 70(8)](https://doi.org/10.18637/jss.v070.i08) - the tool to reach for when the survreg menu is too rigid: spline-based and custom parametric survival models.
- [Rodriguez, Survival Models lecture notes, ch. 7 (Princeton)](https://grodri.github.io/glms/notes/c7.pdf) - a free, rigorous walk through parametric survival likelihoods and the AFT formulation.
- [Kleinbaum and Klein (2012), Survival Analysis: A Self-Learning Text, Springer](https://doi.org/10.1007/978-1-4419-6646-9) - the gentlest full-length treatment; its parametric chapter works through Weibull, AFT, and the PH-AFT link with worked examples.

=== step === complete
## Lesson 5 complete

You made the commitment the first four lessons refused, and collected on it. A **parametric** model names the distribution of event times and estimates a few parameters by maximum likelihood, with deaths contributing \(f(t)\) and censored patients \(S(t)\), so censoring costs nothing. The **Weibull** covers three lives of risk with one shape knob: falling (k below 1), constant (k = 1, the exponential), rising (k above 1). The **AFT** reading turns coefficients into time ratios, the drug stretched survival time by 1.63, each extra year of age multiplied it by 0.94, and because the Weibull speaks both dialects, that 1.63 converts exactly to a hazard ratio of 0.335, landing beside the Cox model's shape-free 0.357. You predicted Mr. Sharma's medians (11.3 vs 18.5 months), verified the shape against the staircase by eye and by AIC, and pushed one careful step beyond the data to month 30 with the assumption stated out loud.

One assumption has been hiding in every lesson so far: each patient faces only ONE way to have the event. Real patients do not oblige. A transplant patient can relapse, or die of infection before relapse ever gets the chance, and the moment two events compete, the familiar 1-minus-KM starts overcounting risk. Next, Lesson 6: Competing risks and cumulative incidence, where you meet the estimator that gets it right, and the Fine-Gray idea behind regression on it.

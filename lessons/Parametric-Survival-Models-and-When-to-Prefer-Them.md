---
title: "Survival and Event History Analysis Lesson 6: Parametric survival models and when to prefer them"
catalog_blurb: "How to fit exponential, Weibull and log-normal models and know which one to trust."
description: "Pulse's 200 annual subscribers are tracked for just 15 months, but exponential, Weibull and log-normal fits, made with survreg(), predict survival at month 24."
keywords: "parametric survival model, exponential distribution, Weibull distribution, log-normal distribution, survreg, hazard function, AIC, Kaplan-Meier, survival analysis, R"
post_type: "LESSON"
curriculum_id: "4.140.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "6"
course_total: "7"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "Competing-Risks-and-Why-Kaplan-Meier-Overstates"
course_prev: "Covariates-That-Change-During-Follow-Up"
---

=== step === cover
## Parametric survival models and when to prefer them

Today let's understand three models that can do something a Cox model cannot: put an actual number on how many subscribers will still be around months after your own data runs out.

Pulse, a subscription company, sells an annual plan. It has 200 subscribers on that plan, and it has followed every one of them for 15 months, one full renewal cycle. For each subscriber, Pulse knows exactly one of two things: the month they cancelled, or that they were still subscribed when the 15 months ended.

Here are 10 of those 200 subscribers, taken straight from the data.

::widget styled-table {"cols": ["subscriber", "status", "month"], "rows": [[1, "cancelled", 6.5], [2, "subscribed", 15.0], [3, "cancelled", 7.2], [4, "subscribed", 15.0], [5, "cancelled", 7.3], [6, "cancelled", 9.0], [7, "subscribed", 15.0], [8, "cancelled", 8.2], [9, "subscribed", 15.0], [10, "cancelled", 3.5]], "formats": {"month": "1dp"}, "title": "Ten of the 200 Pulse annual subscribers", "note": "status is cancelled if the plan ended before month 15 for that subscriber, subscribed if they were still on the plan when the 15-month window closed."}

Subscriber 1 cancelled at month 6.5. Subscriber 2 was still subscribed when the 15 months closed, so their row just says 15.0, the month the window ended, not a cancellation month. That difference, knowing exactly when someone cancelled against only knowing they had not cancelled yet, matters throughout this lesson.

Pulse wants one number nobody in this table can give directly: what fraction of all 200 subscribers will still be subscribed at month 24, nine months past the end of its own follow-up. Getting that number takes a model that commits to a full shape for cancellation risk, not just these raw cancellation months on their own.

=== step === concept
## What the Cox model's unspecified baseline cannot give you

A Cox model is the tool you would reach for first to compare two groups of subscribers, say annual against monthly. But Pulse has not asked that yet. Before comparing any groups, it is worth seeing what a Cox model can and cannot say about this cohort on its own, with no groups at all.

Here is a widget showing the Cox model's own trick: it writes every hazard as a baseline hazard times a ratio, and leaves the baseline's own shape completely unspecified.

::widget hazard-ratio {}

This widget uses its own small, canned example, not Pulse's data: a baseline hazard for one group, and a toggle for a hazard ratio applied to a second group. Push the toggle and the second curve moves up or down, always by the same ratio, at every single month. That ratio is all a Cox model estimates. The shape of the baseline curve itself, rising, falling or flat, is never pinned down.

For Pulse's 200 subscribers, with no groups to compare, fitting a Cox model and asking for its survival estimate shows exactly what that unspecified baseline costs.

```r
# Build Pulse's 200-subscriber annual cohort, then fit a Cox model with no covariates and check how far its survival estimate reaches
library(survival)

set.seed(614)
event_time <- rweibull(200, shape = 2.4, scale = 16)
time <- pmin(event_time, 15)
status <- as.integer(event_time <= 15)
pulse_annual <- data.frame(time = time, status = status)

cox_fit <- coxph(Surv(time, status) ~ 1, data = pulse_annual)
summary(survfit(cox_fit), times = c(10, 15, 20, 24))
#> Call: survfit(formula = cox_fit)
#>
#>  time n.risk n.event survival std.err lower 95% CI upper 95% CI
#>    10    148      52    0.741  0.0310        0.682        0.804
#>    15     96      52    0.481  0.0353        0.417        0.556
```

status is 1 when a subscriber cancelled and 0 when they were still subscribed at month 15, so time and status together are what Surv() needs. Out of the 200 subscribers, 104 cancelled during the 15 months, 52% of the cohort, and the other 96 were still on the plan when it closed.

Look at what summary(survfit(...)) returned. It has rows for month 10 and for month 15, but nothing at all for month 20 or month 24, even though both were asked for. That is not a bug. The last subscriber in this cohort actually cancelled at month 14.98, just under the 15-month mark, and survfit() cannot report a survival estimate past the last month it actually observed a cancellation. Ask it for month 20 or month 24 and there is simply no row to give back, because the Cox model's baseline hazard was never given a shape to extend past that point.

That is the gap this lesson closes. A model that commits to a full shape for the hazard, not just a ratio between two groups, can keep going past month 15 and put a real number on month 24.

=== step === concept
## The exponential model: a hazard that never changes

A parametric model is one that commits to a full shape for the hazard function ahead of time, then fits a small number of parameters to make that shape match the data. The simplest possible shape is a flat line.

The exponential model says the hazard is one constant number, lambda, the same at every single month.

\[
h(t) = \lambda
\]

That one assumption has a very specific meaning for Pulse's subscribers. It says a subscriber who joined one month ago carries exactly the same cancellation risk right now as a subscriber who has already made it to month 14. Having already stuck around for a while changes nothing about the risk going forward.

R's survreg() fits this model, and dist = "exponential" tells it which shape to assume.

```r
# Fit an exponential survreg() model to the Pulse cohort and read off its constant hazard
exp_fit <- survreg(Surv(time, status) ~ 1, data = pulse_annual, dist = "exponential")
lambda <- 1 / exp(coef(exp_fit))
round(unname(lambda), 4)
#> [1] 0.0424
```

survreg() reports its intercept on a log scale, which is why `1 / exp(coef(exp_fit))` is needed to get lambda itself, 0.0424. That one number is now the entire hazard function. Plotted across the whole 24 months, it is exactly what the assumption promised: a flat line.

```r
# Plot the exponential's hazard, the same value at every month from 1 to 24
library(ggplot2)
hazard_exp <- data.frame(month = 1:24, hazard = lambda)
ggplot(hazard_exp, aes(month, hazard)) +
  geom_line(colour = "#2b6cb0", linewidth = 1) +
  ylim(0, 0.25) +
  labs(x = "month", y = "hazard", title = "Exponential hazard: constant at 0.0424")
```

Whether this flat line is actually a reasonable description of how Pulse's subscribers cancel is a separate question, settled next by comparing it against the data directly, not by how reasonable it looks on its own.

=== step === concept
## The Weibull model: a hazard that moves with time

The exponential's flat hazard is a strong assumption, and real risk rarely stays perfectly flat. The Weibull model relaxes it by adding one more parameter, a shape, usually called gamma.

\[
h(t) = \frac{\gamma}{\sigma}\left(\frac{t}{\sigma}\right)^{\gamma - 1}
\]

sigma is a scale parameter, and gamma controls the hazard's direction. When gamma equals 1, that formula collapses straight back to the exponential's flat line. When gamma is above 1, the hazard climbs as t grows. When gamma is below 1, it falls.

```r
# Fit a Weibull survreg() model and convert its output to the gamma/sigma parameterisation
weib_fit <- survreg(Surv(time, status) ~ 1, data = pulse_annual, dist = "weibull")
weib_gamma <- 1 / weib_fit$scale
weib_sigma <- exp(coef(weib_fit))
round(c(gamma = weib_gamma, sigma = unname(weib_sigma)), 3)
#>  gamma  sigma 
#>  2.453 16.844 
```

survreg() stores the shape as its own scale parameter, the reciprocal of gamma, which is why gamma here is `1 / weib_fit$scale`. 2.453 is comfortably above 1, so this fitted hazard climbs rather than staying flat or falling.

```r
# Plot the Weibull's hazard: it keeps climbing across the whole 24 months
hazard_weib <- data.frame(month = 1:24, hazard = (weib_gamma / weib_sigma) * ((1:24) / weib_sigma)^(weib_gamma - 1))
ggplot(hazard_weib, aes(month, hazard)) +
  geom_line(colour = "#c0392b", linewidth = 1) +
  ylim(0, 0.25) +
  labs(x = "month", y = "hazard", title = "Weibull hazard: climbing throughout follow-up")
```

Notice that this hazard never turns back down. For any gamma above 1, the Weibull's hazard keeps rising for as long as a subscriber has not yet cancelled, and it rises faster each month than the one before. For Pulse's subscribers, that says cancellation risk does not just exist, it builds the longer someone has been on the annual plan, which fits a renewal-driven pattern: the closer a subscriber gets to their 12-month renewal date, the more likely they are to let the plan lapse.

=== step === quiz
## Quick check: reading the Weibull's shape parameter

A different subscription dataset gets fit with a Weibull model, and its shape parameter comes out well below 1. What does that say about how its hazard moves over time?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The hazard rises faster the longer a subscriber stays on the plan. ::no
- The hazard falls as time passes: a subscriber who has already stayed a long time has a lower risk of cancelling right now than one who just joined. ::ok Right. A shape below 1 means the hazard keeps dropping the longer someone has already survived, the opposite of the exponential's flat hazard and the opposite of a hazard that speeds up.
- A shape below 1 just means survreg() found a poor fit, and the model needs to be refit with a different distribution. ::no A Weibull shape parameter is not a fit diagnostic. A shape below 1 describes a real, fitted hazard that falls over time, and it says nothing about whether the model fits well or badly. That question gets answered separately, by AIC and by checking the fit against the Kaplan-Meier curve.

=== step === concept
## The log-normal model: a hazard that rises, then falls

The exponential's hazard never moves, and the Weibull's only ever moves in one direction. A log-normal model can do something neither of those can: describe a hazard that climbs for a while and then levels off.

There is a cost to that extra flexibility. The log-normal's hazard has no closed-form formula, unlike the exponential's and the Weibull's. But it can still be computed exactly, as the ratio of the density to the survival function at each month.

\[
h(t) = \frac{f(t)}{S(t)}
\]

f(t) is the log-normal density at month t, and S(t) is the log-normal survival probability at month t, the share who have not yet cancelled by then. R's dlnorm() and plnorm() compute each one directly.

```r
# Fit a log-normal survreg() model, then compute its hazard as density over survival across a grid of months
lnorm_fit <- survreg(Surv(time, status) ~ 1, data = pulse_annual, dist = "lognormal")
lnorm_mu <- unname(coef(lnorm_fit))
lnorm_sigma <- lnorm_fit$scale
round(c(mu = lnorm_mu, sigma = lnorm_sigma), 3)
#>    mu sigma 
#> 2.675 0.596 

months <- 1:24
haz_lnorm <- dlnorm(months, lnorm_mu, lnorm_sigma) / (1 - plnorm(months, lnorm_mu, lnorm_sigma))
round(haz_lnorm[c(6, 12, 18, 24)], 4)
#> [1] 0.0399 0.0848 0.0971 0.0980
```

Compare those four numbers against each other. From month 6 to month 12 the hazard more than doubles, 0.0399 to 0.0848. From month 12 to month 18 it barely moves, 0.0848 to 0.0971. From month 18 to month 24 it is almost flat, 0.0971 to 0.0980. The climb that was steep early on has already nearly leveled off by month 24, a shape the Weibull's hazard cannot produce at all.

```r
# Plot the log-normal's hazard: climbing hard early, then leveling off
hazard_lnorm <- data.frame(month = months, hazard = haz_lnorm)
ggplot(hazard_lnorm, aes(month, hazard)) +
  geom_line(colour = "#27ae60", linewidth = 1) +
  ylim(0, 0.25) +
  labs(x = "month", y = "hazard", title = "Log-normal hazard: climbs, then levels off")
```

Three different shapes now sit on the table: flat, climbing without end, and climbing before leveling off. Which one actually belongs to Pulse's subscribers is what the next two steps check.

=== step === concept
## Which shape actually matches the data

Three fitted hazards, three different stories about cancellation risk. Plotting all three on one chart makes the difference between flat, rising and rising-then-leveling obvious at a glance.

```r
# Plot all three fitted hazards together: flat, rising, and rising then leveling off
hazard_all <- data.frame(
  month = rep(months, 3),
  hazard = c(rep(lambda, 24),
             (weib_gamma / weib_sigma) * (months / weib_sigma)^(weib_gamma - 1),
             haz_lnorm),
  model = rep(c("Exponential", "Weibull", "Log-normal"), each = 24)
)

ggplot(hazard_all, aes(month, hazard, colour = model)) +
  geom_line(linewidth = 1) +
  labs(x = "month", y = "hazard", colour = "model")
```

AIC turns that picture into a number: it rewards a model for fitting well and penalises it for every extra parameter it needed to get there, so a lower AIC is the better-supported model.

```r
# Compare the three fits with AIC
AIC(exp_fit, weib_fit, lnorm_fit)
#>           df      AIC
#> exp_fit    1 867.3210
#> weib_fit   2 796.2660
#> lnorm_fit  2 789.8426
```

Read the three numbers. The exponential's AIC, 867.3, sits about 70 points above either of the other two, which rules out a flat hazard decisively. The Weibull and the log-normal are close to each other, 796.3 against 789.8, with the log-normal's coming out a shade lower in this particular sample.

[NOTE]
A shade lower is not a landslide. An AIC gap of about 6 points between two models that both fit far better than a third is a real but modest edge, not proof that one family is right and the other wrong. Fitting well on paper and matching the data directly are two different checks, and the second one, against the Kaplan-Meier curve, comes next.

=== step === widget
## Checking the fits against the Kaplan-Meier curve

AIC compares the fits to each other. It says nothing about comparing them to the data directly. The Kaplan-Meier curve, a survival estimate built directly from the data with no distributional assumption at all, is exactly that direct comparison: a model whose predicted survival probabilities sit close to the Kaplan-Meier curve, at the same months, is a model that fits the data, not just one that beat its competitors on a score.

::widget chart-plotter {"data": [{"x":2,"y":1.000,"fill":"Kaplan-Meier"},{"x":4,"y":0.985,"fill":"Kaplan-Meier"},{"x":6,"y":0.935,"fill":"Kaplan-Meier"},{"x":8,"y":0.825,"fill":"Kaplan-Meier"},{"x":10,"y":0.740,"fill":"Kaplan-Meier"},{"x":12,"y":0.620,"fill":"Kaplan-Meier"},{"x":14,"y":0.515,"fill":"Kaplan-Meier"},{"x":2,"y":0.9187,"fill":"Exponential"},{"x":4,"y":0.8439,"fill":"Exponential"},{"x":6,"y":0.7753,"fill":"Exponential"},{"x":8,"y":0.7122,"fill":"Exponential"},{"x":10,"y":0.6543,"fill":"Exponential"},{"x":12,"y":0.6011,"fill":"Exponential"},{"x":14,"y":0.5522,"fill":"Exponential"},{"x":2,"y":0.9946,"fill":"Weibull"},{"x":4,"y":0.9710,"fill":"Weibull"},{"x":6,"y":0.9236,"fill":"Weibull"},{"x":8,"y":0.8513,"fill":"Weibull"},{"x":10,"y":0.7570,"fill":"Weibull"},{"x":12,"y":0.6470,"fill":"Weibull"},{"x":14,"y":0.5297,"fill":"Weibull"},{"x":2,"y":0.9996,"fill":"Log-normal"},{"x":4,"y":0.9847,"fill":"Log-normal"},{"x":6,"y":0.9309,"fill":"Log-normal"},{"x":8,"y":0.8413,"fill":"Log-normal"},{"x":10,"y":0.7341,"fill":"Log-normal"},{"x":12,"y":0.6252,"fill":"Log-normal"},{"x":14,"y":0.5241,"fill":"Log-normal"}], "geoms": ["point","line"], "x": "month", "y": "survival", "code": {"point": "ggplot(fits, aes(month, survival, colour = group)) +\n  geom_point(size = 2)", "line": "ggplot(fits, aes(month, survival, colour = group)) +\n  geom_line()"}}

Read the exponential's points first. At month 2 it predicts 0.9187 still subscribed, against the Kaplan-Meier's 1.000, a visible gap this early. By month 8 that gap has widened to 0.7122 against 0.825, more than 10 points of survival probability off the real curve.

Now read the Weibull's and the log-normal's points. Both track the Kaplan-Meier curve closely at every one of the 7 months shown, within a few hundredths of it the whole way, with the log-normal sitting fractionally closer at most of them, consistent with its slightly lower AIC above.

That confirms the AIC comparison above. The exponential's flat hazard is visibly wrong, not just a weaker score on paper. The Weibull and the log-normal both pass this check, which means the real question is not which one is right and which one is wrong, but which one to trust for a prediction past month 15, once the data to check against runs out.

=== step === concept
## What the right shape buys, and the wrong one costs

Every check so far has stayed inside the 15 months Pulse actually followed its subscribers. Extrapolating past that, to month 24, is where a correctly shaped model's prediction and a wrongly shaped one's prediction come apart.

```r
# Extrapolate the exponential and Weibull fits to month 24, nine months past the 15-month follow-up window
surv_exp_24 <- exp(-lambda * 24)
surv_weib_24 <- exp(-(24 / weib_sigma)^weib_gamma)
round(c(exponential = unname(surv_exp_24), weibull = unname(surv_weib_24)), 4)
#> exponential     weibull 
#>      0.3613      0.0923 
```

The exponential says 36.1% of the 200 subscribers are still subscribed at month 24. The Weibull says 9.2%. Those are nowhere near each other. The exponential's flat hazard assumes month 20 is exactly as risky as month 2, so it understates how much cancellation risk has piled up by month 24. The Weibull's hazard kept climbing throughout the fitted data, and extending that same climb another nine months is what drags its prediction all the way down to 9.2%.

There is no data past month 15 to check which of 36.1% or 9.2% actually turns out closer to the truth. What can be checked is which model's assumption already matched the data that does exist: a flat hazard did not, by AIC or against the Kaplan-Meier curve, while a climbing one did. That is the cost of getting the shape wrong, paid out here as a prediction that is off by a factor of four.

A correctly shaped model also pays off a second way, in how precisely it can pin down a number the Kaplan-Meier curve can only estimate roughly.

```r
# Compare the standard error on median survival time: the Weibull fit against the Kaplan-Meier estimate
km_fit <- survfit(Surv(time, status) ~ 1, data = pulse_annual)
km_tab <- summary(km_fit)$table
km_median <- unname(km_tab["median"])
km_lcl <- unname(km_tab["0.95LCL"])
km_se <- (km_median - km_lcl) / 1.96

weib_median_pred <- predict(weib_fit, newdata = data.frame(1), type = "quantile", p = 0.5, se.fit = TRUE)
weib_median <- unname(weib_median_pred$fit)
weib_se <- unname(weib_median_pred$se.fit)

round(c(km_median = km_median, km_se = km_se, weib_median = weib_median, weib_se = weib_se), 3)
#>   km_median       km_se weib_median     weib_se 
#>      14.636       0.673      14.506       0.584 
```

The two median estimates agree closely, 14.636 months against 14.506. But their standard errors do not. The Kaplan-Meier's is 0.673, built step by step from the data with no assumption about the hazard's shape past each observed cancellation. The Weibull's is 0.584, tighter, because it borrows strength from every subscriber in the whole cohort through one assumed shape, rather than estimating one stair-step at a time.

That narrower standard error is only trustworthy because the Weibull's shape already checked out against this cohort's own data, both by AIC and against the Kaplan-Meier curve. A tight standard error built around the wrong shape would be worse than an honest, wider one.

=== step === quiz
## Quick check: choosing among the three fits

Given the AIC comparison, the Kaplan-Meier match, and each model's own hazard shape, which model would you trust for a month-24 prediction, and why?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The exponential, because it is the simplest model to explain to the rest of the team. ::no
- The Weibull: its AIC beats the exponential's by about 70 points, its predicted probabilities tracked the Kaplan-Meier curve closely, and its hazard keeps climbing, matching a cancellation risk that never really eases off. ::ok Right. The exponential is ruled out decisively, about 70 AIC points behind either of the other two. The log-normal's AIC comes out only marginally ahead of the Weibull's here, but its hazard was already leveling off by month 24, while the Weibull's kept climbing, which fits a subscription whose cancellation risk never really lets up.
- The log-normal, because it has the most flexible hazard shape of the three. ::no A flexible shape is not, by itself, a reason to prefer a model. The log-normal's AIC is close to the Weibull's here, but what should decide between two close fits is whether the shape matches what you know about the process, not how many parameters shape its curve.

=== step === tryit
## Your turn: read the shape parameter and confirm the choice

weib_fit already exists from a few steps back. Pull its shape parameter as 1 divided by its scale, the same calculation used earlier, and check whether it sits above or below 1.

```r
# gamma_check should pull the Weibull's shape parameter from weib_fit,
# then test whether it is above 1.
# Two lines: gamma_check <- 1 / weib_fit$scale, then gamma_check > 1.
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*weib_fit\\$scale)(?=[\\s\\S]*>\\s*1)[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: gamma comes out at 2.453, above 1. That is the same rising hazard the AIC comparison and the Kaplan-Meier check both backed, and it is why the Weibull's month-24 prediction and its narrower standard error are the ones worth trusting, not the exponential's.", "no": "Pull the shape parameter as 1 divided by weib_fit$scale, then compare the result to 1 with the > operator."}
::solution
```r
# Pull the Weibull's shape parameter from weib_fit, then check whether it is above or below 1
gamma_check <- 1 / weib_fit$scale
round(gamma_check, 3)
#> [1] 2.453
gamma_check > 1
#> [1] TRUE
```

2.453, above 1. That single number is consistent with everything the earlier steps already showed: the AIC comparison that ruled out a flat hazard, the Kaplan-Meier check that the Weibull passed, and the month-24 prediction and tighter standard error that a correctly shaped model buys over a Cox fit's unspecified baseline.

=== step === concept
## References

::prose-only the references are a text list of sources, not a visual

- [The Statistical Analysis of Failure Time Data](https://doi.org/10.1002/9781118032985) - Kalbfleisch and Prentice (2002), 2nd edition, Wiley. The standard reference for parametric and semiparametric failure-time models, including the exponential, Weibull and log-normal families used in this lesson.
- [Survival Analysis: Techniques for Censored and Truncated Data](https://doi.org/10.1007/b97377) - Klein and Moeschberger (2003), 2nd edition, Springer. Its chapters on parametric methods cover fitting and comparing these same hazard families.
- [Modelling Survival Data in Medical Research](https://doi.org/10.1201/b18041) - Collett (2015), 3rd edition, CRC Press. A practical walkthrough of choosing between a parametric and a semiparametric model.
- [A Package for Survival Analysis in R](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - Therneau, the survival package's own vignette, documenting survreg() and the distributions it supports.
- [Statistical Models and Methods for Lifetime Data](https://doi.org/10.1002/9781118033005) - Lawless (2003), 2nd edition, Wiley. Covers AIC-based comparison of competing parametric lifetime distributions, the method used to compare the three fits in this lesson.

=== step === complete
## Recap: parametric models, and what's next

Three parametric models, one shared idea: commit to a full shape for the hazard, and that commitment buys an answer a Cox model cannot give. The exponential assumes a flat hazard, lambda = 0.0424 for every month. The Weibull lets the hazard climb or fall through a shape parameter, gamma, which came out at 2.453 here, comfortably above 1, so Pulse's cancellation risk climbs the longer a subscriber stays. The log-normal lets it climb and then level off.

AIC ruled the exponential out by about 70 points, and the Kaplan-Meier check confirmed it: a flat hazard simply does not match this cohort. Between the Weibull and the log-normal, AIC gave a narrow edge to the log-normal, but the Weibull's climbing hazard was the one that matched the renewal-driven story in the data, and it is the one this lesson carried forward.

That choice paid off twice past the 15-month follow-up window. At month 24, the Weibull predicted 9.2% of subscribers still subscribed, against the exponential's 36.1%, a difference the flat hazard's wrong assumption created. And the Weibull's standard error on median survival time, 0.584, came out tighter than the Kaplan-Meier's own 0.673, because it borrowed strength from the whole cohort through one assumed shape instead of one stair-step at a time.

The next lesson in this course takes on a different problem survival data can hide: a subject who dies of something else can never have the event you are actually studying, and treating that as ordinary censoring overstates how often the event you care about would have happened.

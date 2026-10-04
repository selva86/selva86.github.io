---
title: "Intervention, Causal Impact, and Anomaly Detection Lesson 1: Intervention analysis for a known event"
catalog_blurb: "Code a known-date event as a regressor, then test if its effect is real."
description: "Code a price change, policy change or redesign as a step, pulse or ramp regressor, fit it alongside ARIMA errors, and read an honest effect and p-value."
keywords: "intervention analysis, interrupted time series, step regressor, pulse regressor, ramp regressor, regression with ARIMA errors, Arima xreg, autocorrelated residuals, structural break, forecast package R"
post_type: "LESSON"
curriculum_id: "5.140.1"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-intervention"
course_title: "Intervention, Causal Impact, and Anomaly Detection"
course_lesson: "1"
course_total: "5"
course_landing: "Intervention-Causal-Impact-and-Anomaly-Detection-Course.html"
course_next: "Causal-Impact-of-an-Event.html"
course_prev: ""
---

=== step === cover
## Intervention analysis for a known event

Today let's work out whether something that happened on a known date actually changed a number you track every day, or whether the change you are looking at was there anyway.

Fernglen Tea Co. is a direct-to-consumer tea subscription retailer. For 100 days it tracked its daily new signups, and on day 61 it raised its subscription price from $18 to $24. The 60 days before the price rise averaged 96.08 signups a day. The 40 days after averaged 92.08.

Here is the whole 100-day series, colored by whether the day fell before or after the price rise.

::widget chart-plotter {"data":[{"x":1,"y":97,"fill":"pre"},{"x":2,"y":92,"fill":"pre"},{"x":3,"y":92,"fill":"pre"},{"x":4,"y":98,"fill":"pre"},{"x":5,"y":99,"fill":"pre"},{"x":6,"y":91,"fill":"pre"},{"x":7,"y":83,"fill":"pre"},{"x":8,"y":91,"fill":"pre"},{"x":9,"y":88,"fill":"pre"},{"x":10,"y":82,"fill":"pre"},{"x":11,"y":88,"fill":"pre"},{"x":12,"y":101,"fill":"pre"},{"x":13,"y":115,"fill":"pre"},{"x":14,"y":106,"fill":"pre"},{"x":15,"y":96,"fill":"pre"},{"x":16,"y":84,"fill":"pre"},{"x":17,"y":91,"fill":"pre"},{"x":18,"y":91,"fill":"pre"},{"x":19,"y":99,"fill":"pre"},{"x":20,"y":107,"fill":"pre"},{"x":21,"y":109,"fill":"pre"},{"x":22,"y":96,"fill":"pre"},{"x":23,"y":95,"fill":"pre"},{"x":24,"y":86,"fill":"pre"},{"x":25,"y":87,"fill":"pre"},{"x":26,"y":90,"fill":"pre"},{"x":27,"y":87,"fill":"pre"},{"x":28,"y":93,"fill":"pre"},{"x":29,"y":91,"fill":"pre"},{"x":30,"y":88,"fill":"pre"},{"x":31,"y":95,"fill":"pre"},{"x":32,"y":92,"fill":"pre"},{"x":33,"y":91,"fill":"pre"},{"x":34,"y":102,"fill":"pre"},{"x":35,"y":97,"fill":"pre"},{"x":36,"y":99,"fill":"pre"},{"x":37,"y":92,"fill":"pre"},{"x":38,"y":96,"fill":"pre"},{"x":39,"y":98,"fill":"pre"},{"x":40,"y":97,"fill":"pre"},{"x":41,"y":111,"fill":"pre"},{"x":42,"y":109,"fill":"pre"},{"x":43,"y":99,"fill":"pre"},{"x":44,"y":96,"fill":"pre"},{"x":45,"y":98,"fill":"pre"},{"x":46,"y":98,"fill":"pre"},{"x":47,"y":86,"fill":"pre"},{"x":48,"y":98,"fill":"pre"},{"x":49,"y":97,"fill":"pre"},{"x":50,"y":93,"fill":"pre"},{"x":51,"y":94,"fill":"pre"},{"x":52,"y":101,"fill":"pre"},{"x":53,"y":96,"fill":"pre"},{"x":54,"y":106,"fill":"pre"},{"x":55,"y":109,"fill":"pre"},{"x":56,"y":110,"fill":"pre"},{"x":57,"y":104,"fill":"pre"},{"x":58,"y":101,"fill":"pre"},{"x":59,"y":93,"fill":"pre"},{"x":60,"y":94,"fill":"pre"},{"x":61,"y":96,"fill":"post"},{"x":62,"y":95,"fill":"post"},{"x":63,"y":91,"fill":"post"},{"x":64,"y":89,"fill":"post"},{"x":65,"y":90,"fill":"post"},{"x":66,"y":92,"fill":"post"},{"x":67,"y":87,"fill":"post"},{"x":68,"y":86,"fill":"post"},{"x":69,"y":102,"fill":"post"},{"x":70,"y":99,"fill":"post"},{"x":71,"y":91,"fill":"post"},{"x":72,"y":87,"fill":"post"},{"x":73,"y":81,"fill":"post"},{"x":74,"y":89,"fill":"post"},{"x":75,"y":92,"fill":"post"},{"x":76,"y":96,"fill":"post"},{"x":77,"y":100,"fill":"post"},{"x":78,"y":95,"fill":"post"},{"x":79,"y":96,"fill":"post"},{"x":80,"y":90,"fill":"post"},{"x":81,"y":94,"fill":"post"},{"x":82,"y":103,"fill":"post"},{"x":83,"y":98,"fill":"post"},{"x":84,"y":92,"fill":"post"},{"x":85,"y":81,"fill":"post"},{"x":86,"y":74,"fill":"post"},{"x":87,"y":81,"fill":"post"},{"x":88,"y":89,"fill":"post"},{"x":89,"y":99,"fill":"post"},{"x":90,"y":107,"fill":"post"},{"x":91,"y":96,"fill":"post"},{"x":92,"y":98,"fill":"post"},{"x":93,"y":88,"fill":"post"},{"x":94,"y":88,"fill":"post"},{"x":95,"y":88,"fill":"post"},{"x":96,"y":92,"fill":"post"},{"x":97,"y":98,"fill":"post"},{"x":98,"y":97,"fill":"post"},{"x":99,"y":89,"fill":"post"},{"x":100,"y":87,"fill":"post"}],"x":"day","y":"signups","geoms":["line"],"code":{"line":"ggplot(signups_df, aes(day, signups, colour = period)) +\n  geom_line()"}}

Signups do dip a little right where the color changes at day 61. But the series was already bouncing up and down before the price ever moved, day to day and week to week. So the question this lesson answers is: how much of that dip is the price rise, and how much is just the series doing what it always does?

=== step === concept
## Why a plain before/after average is not enough

96.08 minus 92.08 is 4.01. It is tempting to call that 4.01-signup drop the price rise's effect and move on. But Fernglen's signups were never a flat, featureless number to begin with, and some of that gap could just as easily come from how the series already behaves.

Build the series the way it was actually generated, and you can see exactly what else is mixed into that gap.

```r
# Build Fernglen's 100 days of signups and compare the before/after averages
set.seed(42)
day     <- 1:100
dow     <- rep(1:7, length.out = 100)                 # 1 = Monday ... 7 = Sunday
weekly  <- c(0, -3, -2, 0, 4, 9, 7)[dow]               # signups run highest on Saturday
step    <- as.numeric(day > 60)                        # 0 before the price rise, 1 from day 61 on

ar_err  <- arima.sim(n = 100, model = list(ar = 0.55), sd = 5)  # noise that carries over from one day to the next
signups <- round(95 + weekly - 6 * step + ar_err)
signups <- pmax(signups, 0)

round(c(pre_mean = mean(signups[1:60]), post_mean = mean(signups[61:100]),
        naive_gap = mean(signups[61:100]) - mean(signups[1:60])), 2)
#>  pre_mean post_mean naive_gap 
#>     96.08     92.08     -4.01 
```

`weekly` adds a day-of-week swing that was there every single day, before the price rise and after it alike, peaking on Saturday. `ar_err` is noise with a memory: a day that comes in high tends to be followed by another day that also comes in high, instead of every day being its own fresh, unrelated draw. Both of those were baked into `signups` on purpose, on top of the real -6 signups a day that the price rise itself was built to cause.

So the -4.01 gap you just computed is a mix of three things: the weekly pattern landing slightly differently across the two periods, the noise's own memory nudging each period's average up or down, and whatever the price rise actually did. Separating those three, and reading the price rise's own share out on its own, needs a regressor that tells the model exactly when the price rise happened.

=== step === widget
## Three ways to code a known-date event: step, pulse, ramp

Building `signups` needed one ingredient you have not met properly yet: `step`, a vector of 0s for the 60 days before the price rise and 1s for the 40 days from day 61 on. That is how you tell a regression model "something happened here, starting on this day." It turns out there are three different shapes for that, and which one you pick depends on how the event's effect behaves once it starts.

- A **step regressor** is 0 before the event and 1 from the event day on. Use it when the effect is meant to last: a price rise, a permanent policy change.
- A **pulse regressor** is 0 everywhere except a single 1 on the event day itself. Use it when the effect is a one-off jolt that does not carry forward: a single day's email blast, a one-time promotion.
- A **ramp regressor** is 0 before the event, then counts 1, 2, 3 and upward from the event day. Use it when the effect builds in gradually instead of arriving all at once: a feature rollout, a slow change in behaviour.

Here is all three built around day 61, purely to compare their shape.

```r
# Compare the three regressor shapes around day 61
compare_days <- 50:90
step_demo  <- as.numeric(compare_days > 60)
pulse_demo <- as.numeric(compare_days == 61)
ramp_demo  <- ifelse(compare_days <= 60, 0, pmin(compare_days - 60, 20))

data.frame(day = compare_days, step = step_demo, pulse = pulse_demo, ramp = ramp_demo)[9:14, ]
#>    day step pulse ramp
#> 9   58    0     0    0
#> 10  59    0     0    0
#> 11  60    0     0    0
#> 12  61    1     1    1
#> 13  62    1     0    2
#> 14  63    1     0    3
```

The step jumps to 1 on day 61 and stays there. The pulse fires once, on day 61 alone, then drops straight back to 0. The ramp also starts on day 61, but instead of jumping it counts upward, one more each day, which is where it gets its name.

::widget chart-plotter {"data":[{"x":50,"y":0,"fill":"step"},{"x":51,"y":0,"fill":"step"},{"x":52,"y":0,"fill":"step"},{"x":53,"y":0,"fill":"step"},{"x":54,"y":0,"fill":"step"},{"x":55,"y":0,"fill":"step"},{"x":56,"y":0,"fill":"step"},{"x":57,"y":0,"fill":"step"},{"x":58,"y":0,"fill":"step"},{"x":59,"y":0,"fill":"step"},{"x":60,"y":0,"fill":"step"},{"x":61,"y":1,"fill":"step"},{"x":62,"y":1,"fill":"step"},{"x":63,"y":1,"fill":"step"},{"x":64,"y":1,"fill":"step"},{"x":65,"y":1,"fill":"step"},{"x":66,"y":1,"fill":"step"},{"x":67,"y":1,"fill":"step"},{"x":68,"y":1,"fill":"step"},{"x":69,"y":1,"fill":"step"},{"x":70,"y":1,"fill":"step"},{"x":71,"y":1,"fill":"step"},{"x":72,"y":1,"fill":"step"},{"x":73,"y":1,"fill":"step"},{"x":74,"y":1,"fill":"step"},{"x":75,"y":1,"fill":"step"},{"x":76,"y":1,"fill":"step"},{"x":77,"y":1,"fill":"step"},{"x":78,"y":1,"fill":"step"},{"x":79,"y":1,"fill":"step"},{"x":80,"y":1,"fill":"step"},{"x":81,"y":1,"fill":"step"},{"x":82,"y":1,"fill":"step"},{"x":83,"y":1,"fill":"step"},{"x":84,"y":1,"fill":"step"},{"x":85,"y":1,"fill":"step"},{"x":86,"y":1,"fill":"step"},{"x":87,"y":1,"fill":"step"},{"x":88,"y":1,"fill":"step"},{"x":89,"y":1,"fill":"step"},{"x":90,"y":1,"fill":"step"},{"x":50,"y":0,"fill":"pulse"},{"x":51,"y":0,"fill":"pulse"},{"x":52,"y":0,"fill":"pulse"},{"x":53,"y":0,"fill":"pulse"},{"x":54,"y":0,"fill":"pulse"},{"x":55,"y":0,"fill":"pulse"},{"x":56,"y":0,"fill":"pulse"},{"x":57,"y":0,"fill":"pulse"},{"x":58,"y":0,"fill":"pulse"},{"x":59,"y":0,"fill":"pulse"},{"x":60,"y":0,"fill":"pulse"},{"x":61,"y":1,"fill":"pulse"},{"x":62,"y":0,"fill":"pulse"},{"x":63,"y":0,"fill":"pulse"},{"x":64,"y":0,"fill":"pulse"},{"x":65,"y":0,"fill":"pulse"},{"x":66,"y":0,"fill":"pulse"},{"x":67,"y":0,"fill":"pulse"},{"x":68,"y":0,"fill":"pulse"},{"x":69,"y":0,"fill":"pulse"},{"x":70,"y":0,"fill":"pulse"},{"x":71,"y":0,"fill":"pulse"},{"x":72,"y":0,"fill":"pulse"},{"x":73,"y":0,"fill":"pulse"},{"x":74,"y":0,"fill":"pulse"},{"x":75,"y":0,"fill":"pulse"},{"x":76,"y":0,"fill":"pulse"},{"x":77,"y":0,"fill":"pulse"},{"x":78,"y":0,"fill":"pulse"},{"x":79,"y":0,"fill":"pulse"},{"x":80,"y":0,"fill":"pulse"},{"x":81,"y":0,"fill":"pulse"},{"x":82,"y":0,"fill":"pulse"},{"x":83,"y":0,"fill":"pulse"},{"x":84,"y":0,"fill":"pulse"},{"x":85,"y":0,"fill":"pulse"},{"x":86,"y":0,"fill":"pulse"},{"x":87,"y":0,"fill":"pulse"},{"x":88,"y":0,"fill":"pulse"},{"x":89,"y":0,"fill":"pulse"},{"x":90,"y":0,"fill":"pulse"},{"x":50,"y":0,"fill":"ramp"},{"x":51,"y":0,"fill":"ramp"},{"x":52,"y":0,"fill":"ramp"},{"x":53,"y":0,"fill":"ramp"},{"x":54,"y":0,"fill":"ramp"},{"x":55,"y":0,"fill":"ramp"},{"x":56,"y":0,"fill":"ramp"},{"x":57,"y":0,"fill":"ramp"},{"x":58,"y":0,"fill":"ramp"},{"x":59,"y":0,"fill":"ramp"},{"x":60,"y":0,"fill":"ramp"},{"x":61,"y":1,"fill":"ramp"},{"x":62,"y":2,"fill":"ramp"},{"x":63,"y":3,"fill":"ramp"},{"x":64,"y":4,"fill":"ramp"},{"x":65,"y":5,"fill":"ramp"},{"x":66,"y":6,"fill":"ramp"},{"x":67,"y":7,"fill":"ramp"},{"x":68,"y":8,"fill":"ramp"},{"x":69,"y":9,"fill":"ramp"},{"x":70,"y":10,"fill":"ramp"},{"x":71,"y":11,"fill":"ramp"},{"x":72,"y":12,"fill":"ramp"},{"x":73,"y":13,"fill":"ramp"},{"x":74,"y":14,"fill":"ramp"},{"x":75,"y":15,"fill":"ramp"},{"x":76,"y":16,"fill":"ramp"},{"x":77,"y":17,"fill":"ramp"},{"x":78,"y":18,"fill":"ramp"},{"x":79,"y":19,"fill":"ramp"},{"x":80,"y":20,"fill":"ramp"},{"x":81,"y":20,"fill":"ramp"},{"x":82,"y":20,"fill":"ramp"},{"x":83,"y":20,"fill":"ramp"},{"x":84,"y":20,"fill":"ramp"},{"x":85,"y":20,"fill":"ramp"},{"x":86,"y":20,"fill":"ramp"},{"x":87,"y":20,"fill":"ramp"},{"x":88,"y":20,"fill":"ramp"},{"x":89,"y":20,"fill":"ramp"},{"x":90,"y":20,"fill":"ramp"}],"x":"day","y":"value","geoms":["line"],"code":{"line":"ggplot(regressors_df, aes(day, value, colour = type)) +\n  geom_line()"}}

Fernglen's price rise is meant to be permanent: the new $24 price stays in effect for good, not for one day and not as a slow build. That is exactly what the step regressor is for, which is why `step` was already the one baked into `signups` a moment ago.

=== step === concept
## Fit the naive regression and read a "significant" drop

With `step` defined, fitting a regression of `signups` on it is one line. The regressor's coefficient reads off the intervention's estimated effect directly.

```r
# Fit signups on the step regressor and read off the price rise's estimated effect
fit_lm <- lm(signups ~ step)
summary(fit_lm)
#> 
#> Call:
#> lm(formula = signups ~ step)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -18.0750  -4.3313  -0.0833   3.9250  18.9167 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  96.0833     0.9141 105.111  < 2e-16 ***
#> step         -4.0083     1.4453  -2.773  0.00664 ** 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 7.081 on 98 degrees of freedom
#> Multiple R-squared:  0.07277,	Adjusted R-squared:  0.06331 
#> F-statistic: 7.691 on 1 and 98 DF,  p-value: 0.006644
```

The intercept, 96.0833, is just the pre-period mean again: with `step` at 0, the fitted value is the intercept alone. The `step` row is the number that matters: a coefficient of -4.0083, a standard error of 1.4453, a t-value of -2.773, and a p-value of 0.00664.

By the usual rule of thumb, a p-value under 0.05 counts as statistically significant. 0.00664 clears that bar easily. So on the face of it, this looks like solid evidence that the price rise cost Fernglen close to 4 signups a day. Before you write that in a report, though, there is one assumption this regression is quietly leaning on, and it is worth checking.

=== step === concept
## Why that significance cannot be trusted yet

`lm()` assumes every one of its 100 residuals is an independent piece of information, unrelated to the residual next to it. If that holds, 100 days really do behave like 100 separate pieces of evidence, and the standard error it reports is honest. But `signups` was built with noise that carries over from one day to the next, so that assumption is worth checking directly instead of taking on faith.

`acf()` on the residuals checks exactly this: how correlated is each residual with the one right before it.

```r
# Check whether the naive regression's residuals are still correlated with their own past
resid_acf <- acf(resid(fit_lm), plot = FALSE)
round(resid_acf$acf[2], 4)
#> [1] 0.5593
```

That second value in `resid_acf$acf` is the **lag-1 autocorrelation**: how correlated each residual is with the residual exactly one day before it. 0.5593 is a long way from 0. In plain terms, a day whose signups came in higher than the model expected tends to be followed by another day that also comes in higher than expected, and the same holds on the low side.

That is a real problem for the standard error you just read. `lm()`'s formula for that 1.4453 standard error assumes 100 independent observations. But with residuals this correlated, the 100 days carry less independent information than that count suggests, closer to what you would get from a smaller, genuinely independent sample. A standard error computed as if you had the full, independent 100 is too small for what you actually have, and a standard error that is too small makes a p-value look smaller, and a result look more significant, than it really is. That is this lesson's central warning: a step coefficient's p-value is only as honest as the independence assumption behind its standard error, and here that assumption just failed.

=== step === concept
## The fix: regression with ARIMA errors

If the residuals carry their own autocorrelation, the fix is to stop assuming they are independent and model that correlation directly. **Regression with ARIMA errors** does exactly that: it keeps the same `step` regressor, but instead of treating the leftover error as plain independent noise, it lets the error itself follow an ARIMA process, here the simplest one, an AR(1): each day's error is partly a carryover of the previous day's error, plus something fresh. `Arima()` from the `forecast` package fits both pieces, the regressor's effect and the AR(1) error, at the same time.

```r
# Fit the step regressor with an AR(1) error process instead of an independent one
library(forecast)
fit_arima <- Arima(signups, xreg = cbind(step = step), order = c(1, 0, 0))
fit_arima
#> Series: signups 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept     step
#>       0.5578    95.8441  -3.5420
#> s.e.  0.0826     1.6453   2.5139
#> 
#> sigma^2 = 34.71:  log likelihood = -317.91
#> AIC=643.82   AICc=644.24   BIC=654.24
```

Read the three coefficients in order. `ar1`, 0.5578, is the AR(1) term: it is the model's own estimate of exactly the day-to-day carryover the ACF just measured at 0.5593, close enough to confirm the model found the same pattern. `intercept`, 95.8441, is close to the naive 96.0833 but not identical, since it is now estimated jointly with the AR(1) term instead of being a plain pre-period mean. `step`, -3.5420, is the honest estimate of the price rise's effect, with its own standard error of 2.5139, noticeably wider than the naive 1.4453.

A bigger standard error changes the test. Divide the coefficient by its standard error for the t-value, and turn that into a p-value the same way as before.

```r
# Pull the step coefficient's honest standard error and test it properly
step_coef <- unname(coef(fit_arima)["step"])
step_se   <- unname(sqrt(diag(fit_arima$var.coef))["step"])
t_stat <- step_coef / step_se
p_val  <- 2 * pnorm(-abs(t_stat))

round(c(t = t_stat, p = p_val), c(2, 4))
#>       t       p 
#> -1.4100  0.1589 
```

t falls from -2.77 to -1.41, and the p-value climbs from 0.0066 to 0.1589, above the usual 0.05 cutoff. The same data, the same regressor, and a coefficient that barely moved, -3.54 against -4.01, no longer counts as statistically significant once the error term is modeled honestly.

The 95% interval around the coefficient tells the same story a different way.

```r
# Compare the naive interval against the honest one
round(step_coef + c(-1.96, 1.96) * step_se, 2)   # the honest interval, from fit_arima
#> [1] -8.47  1.39
round(unname(coef(fit_lm)["step"]) + c(-1.96, 1.96) * summary(fit_lm)$coefficients["step", "Std. Error"], 2)   # the naive interval, from fit_lm
#> [1] -6.84 -1.18
```

The naive interval, -6.84 to -1.18, never touches 0: by that account, a real drop looks certain. The honest interval, -8.47 to 1.39, spans 0 comfortably: a drop is still the best guess, but a true effect of 0, or even a small positive one, is well within reach of what the data can rule out. That gap between the two intervals is the entire reason regression with ARIMA errors exists: the first one answers the question lm() is built to answer, and the second one answers the question Fernglen actually asked.

=== step === widget
## Why the naive interval looked narrower than it should

The widget below is not Fernglen's signups. It is its own small, built-in regression, with a slider for the sample size n, so you can watch a confidence interval behave as the data grows.

::widget regression-intervals {}

Slide n up and the confidence band, the one around the fitted line, keeps collapsing in on it. That happens because every additional point in this widget's data is genuinely new, independent information, so more of them pin the line down tighter and tighter, the way lm()'s standard error formula assumes they always will.

Fernglen's 100 days do not behave like that. With a lag-1 residual autocorrelation of 0.56, each new day is partly a repeat of the day before it, not a fully new, independent fact. So adding more days like these does not buy down the uncertainty the way the slider's picture suggests it would. That is exactly why the step coefficient's honest standard error, 2.51, sits well above the naive 1.45 instead of shrinking toward it: the data never had 100 independent days' worth of information to offer in the first place.

=== step === quiz
## Quick check: reading the naive result against the honest one

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The residuals are autocorrelated (lag-1 of 0.56), so the naive standard error (1.45) understates the real uncertainty. Modeling that with an AR(1) error term raises the standard error to 2.51, turning p = 0.0066 into p = 0.159, so the price rise's effect on signups is no longer statistically significant at the 5% level. ::ok Exactly right. The coefficient barely moved, -4.01 to -3.54, but its honest standard error did not, and that is what flipped the verdict.
- The -4.01 coefficient itself is wrong, and a different regressor is needed to fix it. ::no
- lm() cannot fit a step regressor at all, which is why the result cannot be trusted. ::no
- Collecting more days of data, however correlated, would shrink the standard error back down on its own. ::no None of these hold up. lm() fit the step regressor without any trouble, and the coefficient itself barely moved. What actually fails is the independence assumption behind the naive standard error, and more autocorrelated days do not behave like more independent ones. Modeling the AR(1) error directly, not swapping regressors or collecting more data, is what turns 1.45 into the honest 2.51.

=== step === concept
## The pulse regressor: a one-off email blast

Fernglen also ran a one-day email blast, on day 75, completely separate from the price rise. Since its effect is meant to show up on exactly one day and then vanish, this calls for a pulse regressor instead of a step.

```r
# Build a one-day email blast as a pulse regressor and fit it alongside an AR(1) error
pulse <- as.numeric(day == 75)

set.seed(7)
ar_err2 <- arima.sim(n = 100, model = list(ar = 0.5), sd = 5)
signups_pulse <- round(95 + weekly + 40 * pulse + ar_err2)

signups_pulse[73:77]
#> [1]  95  94 135 100  98

fit_pulse <- Arima(signups_pulse, xreg = cbind(pulse = pulse), order = c(1, 0, 0))
fit_pulse
#> Series: signups_pulse 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept    pulse
#>       0.6198    98.6239  37.8305
#> s.e.  0.0773     1.3956   4.5838
#> 
#> sigma^2 = 29.94:  log likelihood = -310.58
#> AIC=629.15   AICc=629.57   BIC=639.57
```

Day 75 itself spikes to 135 signups, against 94 the day before and 100 the day after: a single, obvious one-day jump. The `pulse` coefficient, 37.8305 with a standard error of 4.5838, picks that spike up almost exactly.

Notice what that coefficient means, and what it does not. It is not a new, permanent baseline the way the step coefficient was: it is the size of a single day's jolt, on the one day the pulse regressor equals 1, with no claim about any other day. Code a one-off event as a step by mistake, and the model would have to explain day 75's spike as if it lasted forever, which it plainly did not.

=== step === concept
## The ramp regressor: a gradual onboarding rollout

A third event, also starting on day 61: Fernglen rolled out a new onboarding flow for new subscribers, and its effect did not arrive all at once. It built in gradually over its first 20 days and then held steady, which is exactly what a ramp regressor is built to code.

```r
# Build a 20-day onboarding ramp and fit it alongside an AR(1) error
ramp <- c(rep(0, 60), pmin(1:40, 20))

set.seed(11)
ar_err3 <- arima.sim(n = 100, model = list(ar = 0.5), sd = 5)
signups_ramp <- round(95 + weekly + 0.9 * ramp + ar_err3)

fit_ramp <- Arima(signups_ramp, xreg = cbind(ramp = ramp), order = c(1, 0, 0))
fit_ramp
#> Series: signups_ramp 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept    ramp
#>       0.4426    95.5958  0.9666
#> s.e.  0.0895     1.2897  0.1227
#> 
#> sigma^2 = 35.51:  log likelihood = -318.97
#> AIC=645.94   AICc=646.36   BIC=656.36
```

The `ramp` coefficient, 0.9666 with a standard error of 0.1227, is not a one-time jump or a single day's spike. It is a rate: about 0.97 extra signups a day for every step the ramp has climbed. `ramp` itself climbs from 1 to 20 over the rollout's first 20 days and then holds at 20, so to get the effect once the rollout is fully in place, multiply the coefficient by that 20-day plateau.

```r
# Effect once the rollout is fully in place, 20 days after it starts
ramp_coef <- coef(fit_ramp)["ramp"]
ramp_coef * 20
#>     ramp 
#> 19.33249 
```

19.33 extra signups a day, once the full 20 days have passed, a gradual climb to that number rather than the step's immediate jump on day 61 or the pulse's single spike on day 75. Three events, three different shapes, three different ways of reading the same kind of coefficient.

=== step === quiz
## Quick check: choosing the right shape, trusting the right number

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- A permanent policy change calls for a step regressor, 0 before the change date and 1 from it on, since the effect is meant to last. But the regressor's shape only decides what effect is being modeled; the residuals still need to be checked for serial correlation before the coefficient's p-value can be trusted. ::ok Exactly right. Picking step over pulse or ramp gets the shape of the effect right. It says nothing yet about whether the standard error attached to that effect is honest.
- A pulse regressor, because the policy change happens on a single calendar day. ::no
- A ramp regressor, because policy effects always build up gradually. ::no
- No further check is needed once the right regressor shape is chosen. ::no None of these hold up. A pulse would drop the effect back to 0 the very next day, which does not match a change that is meant to last, and a ramp would wrongly soften an effect that actually started immediately on the change date. Whichever shape fits the effect, the residuals still need checking for serial correlation before its coefficient's p-value can be trusted, which is a separate question from the regressor's shape.

=== step === tryit
## Your turn: read the ramp partway through, not just at the plateau

`ramp_coef` is still around, 0.9666, the extra signups a day for every step the onboarding ramp has climbed. The code below reads the effect once the rollout is fully in place, 20 days in. Edit it to read the effect on day 70 instead, which per `ramp`'s own definition is only 10 days into the rollout, not 20.

```r
# The effect once the rollout is fully in place, 20 days after it starts
ramp_coef * 20
```
::check {"regex": "ramp_coef\\s*[*]\\s*10\\b", "gate": true, "difficulty": "intermediate", "ok": "Right: about 9.67 extra signups a day on day 70, well short of the 19.33 full plateau, because the ramp is only halfway up its 20-day climb by then.", "no": "Change the 20 to a 10: day 70 is 10 days after the rollout started on day 61, so ramp[70] is 10, not 20. ramp_coef * 10 is the line you want."}
::solution
```r
# Effect on day 70, 10 days into the 20-day ramp
ramp_coef * 10
#>     ramp 
#> 9.666246 
```

=== step === concept
## References

- [Intervention analysis with applications to economic and environmental problems](https://doi.org/10.1080/01621459.1975.10480264) - Box and Tiao (1975), Journal of the American Statistical Association, 70(349), 70-79. The original statistical treatment of a known intervention date, and the source of the step, pulse and ramp vocabulary this lesson builds on.
- [Time Series Analysis with Applications in R](https://doi.org/10.1007/978-0-387-75959-3) - Cryer and Chan (2008), 2nd edition, Springer. The chapter on intervention analysis and outliers covers the same regressor shapes with further worked examples.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/dynamic.html) - Hyndman and Athanasopoulos. The chapter on dynamic regression models covers fitting a regressor alongside an ARIMA error in full generality.
- [Automatic time series forecasting: the forecast package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software, 27(3), 1-22. The paper behind the `forecast` package and its `Arima()` function used throughout this lesson.

=== step === complete
## Quick recap

- Code a known-date event as a regressor shaped like its effect: a step for an effect meant to persist, a pulse for a one-off jump, a ramp for a gradual build.
- Fit that regressor inside `Arima(xreg = )` rather than a plain `lm()`, so the error term can follow an AR(1) process instead of being assumed independent.
- Check the residuals for autocorrelation before trusting any coefficient's p-value. Here it was 0.56, and modeling it honestly turned a naive standard error of 1.45 into 2.51, which turned p = 0.0066 into p = 0.159.
- Read the coefficient as the effect and its honest standard error as how much that effect could still move, never the coefficient alone.

The next lesson in this course asks the same question about a known event a different way: building a counterfactual forecast of what would have happened without it, and reading the gap as the effect, instead of fitting a regressor's coefficient.

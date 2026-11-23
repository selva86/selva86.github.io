---
title: "Generalized Linear Models Lesson 2: Three link functions, and why the choice rarely matters"
catalog_blurb: "Why three link functions that look so different almost never change your conclusion."
description: "Fit the same failure data with logit, probit and cloglog links to see why their coefficients land on different scales but the model's predictions barely move."
keywords: "link function, logit, probit, complementary log-log, cloglog, generalized linear model, glm, odds ratio, hazard rate, binomial regression, R"
post_type: "LESSON"
curriculum_id: "4.80.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "2"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "Modeling-Counts-with-Poisson-Regression"
course_prev: "Logistic-Regression-from-the-Odds-Up"
---

=== step === cover
## Three link functions, and why the choice rarely matters

Today let's understand the three most common link functions used to fit a binomial model, and why picking one over another rarely changes the story your data tells.

Say you are testing circuit boards for reliability. You take 20 boards and expose them to an overvoltage of 10 volts above their rated spec, for a fixed test window, and you count how many fail inside that window. Then you repeat the test at 12, 14, 16 and 18 volts above spec, 20 boards each time.

Here is what you saw. At 10 volts, 2 of the 20 boards failed. At 12 volts, 6 failed. At 14 volts, 12 failed. At 16 volts, 17 failed. And at 18 volts, 19 out of 20 failed. As a failure rate, that is 0.10, 0.30, 0.60, 0.85 and 0.95.

Plot that failure rate against voltage and here is what you get.

::widget chart-plotter {"data": [{"x": 10, "y": 0.10}, {"x": 12, "y": 0.30}, {"x": 14, "y": 0.60}, {"x": 16, "y": 0.85}, {"x": 18, "y": 0.95}], "geoms": ["point", "line"], "x": "voltage", "y": "p"}

That rising shape is what you get whenever a quantity is squeezed between 0 and 1: slow near the bottom, steep through the middle, slow again near the top. More than one function traces a curve shaped roughly like that one, and three of them, called logit, probit and cloglog, are what this page compares side by side.

=== step === concept
## What a link function is for

A GLM fits a straight line: b0 + b1 times x. But a straight line has no limit on either end. Push voltage far enough up or down and b0 + b1 * voltage will shoot past 1 or below 0, and no failure rate can ever be a number like that.

A link function fixes this. It is a function, call it g, that takes a probability, which only ever lives between 0 and 1, and stretches it out onto the whole real line, from minus infinity to plus infinity. You fit your straight line to g(p) instead of to p itself. Then, to get a probability back out, you apply the inverse of g to the fitted line.

Three different functions do that stretching job for a binomial model: logit, probit and complementary log-log, which everyone shortens to cloglog.

The logit of p is log(p / (1 - p)), the log of the odds that the event happens. If p is 0.10, the odds of failing are 0.10 / 0.90, about 0.111 to 1, and the log of that odds is the logit.

The probit of p is qnorm(p). The function qnorm() answers a specific question: at what point on the standard normal curve does exactly p of the area sit to the left of it? qnorm(0.10) asks where the standard normal curve has 10% of its area below it, and the answer is a negative number, since 10% of the curve sits in its left tail.

The cloglog of p is log(-log(1 - p)).

Compute each of the three links for the five failure rates from the cover, and watch how differently they treat the very same five numbers.

```r
# Convert the five observed failure rates to their logit, probit and cloglog values
p <- c(0.10, 0.30, 0.60, 0.85, 0.95)
voltage <- c(10, 12, 14, 16, 18)

logit_p <- log(p / (1 - p))
probit_p <- qnorm(p)
cloglog_p <- log(-log(1 - p))

data.frame(voltage, p, logit = round(logit_p, 4), probit = round(probit_p, 4), cloglog = round(cloglog_p, 4))
#>   voltage    p   logit  probit cloglog
#> 1      10 0.10 -2.1972 -1.2816 -2.2504
#> 2      12 0.30 -0.8473 -0.5244 -1.0309
#> 3      14 0.60  0.4055  0.2533 -0.0874
#> 4      16 0.85  1.7346  1.0364  0.6403
#> 5      18 0.95  2.9444  1.6449  1.0972
```

Look at the row for voltage 10, where p = 0.10. The logit is -2.1972, the probit is -1.2816 and the cloglog is -2.2504. Three different numbers, computed from the exact same probability. Each link stretches that 0.10 out onto the real line in its own way, and that difference in scale is going to matter a lot once you start reading coefficients off a fitted model.

=== step === widget
## Logit, probit and cloglog, in their own standard form

Before fitting anything, it helps to see what each link's inverse function looks like on its own, stripped down to its standard form: no data, no coefficients, just the function itself plotted against a linear predictor, call it eta, running from -4 to 4.

The inverse of logit is plogis(eta). The inverse of probit is pnorm(eta), the standard normal curve itself. And the inverse of cloglog is 1 - exp(-exp(eta)).

::widget chart-plotter {"data": [{"x": -4, "y": 0.018, "fill": "logit"}, {"x": -3.5, "y": 0.0293, "fill": "logit"}, {"x": -3, "y": 0.0474, "fill": "logit"}, {"x": -2.5, "y": 0.0759, "fill": "logit"}, {"x": -2, "y": 0.1192, "fill": "logit"}, {"x": -1.5, "y": 0.1824, "fill": "logit"}, {"x": -1, "y": 0.2689, "fill": "logit"}, {"x": -0.5, "y": 0.3775, "fill": "logit"}, {"x": 0, "y": 0.5, "fill": "logit"}, {"x": 0.5, "y": 0.6225, "fill": "logit"}, {"x": 1, "y": 0.7311, "fill": "logit"}, {"x": 1.5, "y": 0.8176, "fill": "logit"}, {"x": 2, "y": 0.8808, "fill": "logit"}, {"x": 2.5, "y": 0.9241, "fill": "logit"}, {"x": 3, "y": 0.9526, "fill": "logit"}, {"x": 3.5, "y": 0.9707, "fill": "logit"}, {"x": 4, "y": 0.982, "fill": "logit"}, {"x": -2.1972, "y": 0.1, "fill": "logit"}, {"x": 2.9444, "y": 0.95, "fill": "logit"}, {"x": -4, "y": 0.0, "fill": "probit"}, {"x": -3.5, "y": 0.0002, "fill": "probit"}, {"x": -3, "y": 0.0013, "fill": "probit"}, {"x": -2.5, "y": 0.0062, "fill": "probit"}, {"x": -2, "y": 0.0228, "fill": "probit"}, {"x": -1.5, "y": 0.0668, "fill": "probit"}, {"x": -1, "y": 0.1587, "fill": "probit"}, {"x": -0.5, "y": 0.3085, "fill": "probit"}, {"x": 0, "y": 0.5, "fill": "probit"}, {"x": 0.5, "y": 0.6915, "fill": "probit"}, {"x": 1, "y": 0.8413, "fill": "probit"}, {"x": 1.5, "y": 0.9332, "fill": "probit"}, {"x": 2, "y": 0.9772, "fill": "probit"}, {"x": 2.5, "y": 0.9938, "fill": "probit"}, {"x": 3, "y": 0.9987, "fill": "probit"}, {"x": 3.5, "y": 0.9998, "fill": "probit"}, {"x": 4, "y": 1.0, "fill": "probit"}, {"x": -1.2816, "y": 0.1, "fill": "probit"}, {"x": 1.6449, "y": 0.95, "fill": "probit"}, {"x": -4, "y": 0.0181, "fill": "cloglog"}, {"x": -3.5, "y": 0.0297, "fill": "cloglog"}, {"x": -3, "y": 0.0486, "fill": "cloglog"}, {"x": -2.5, "y": 0.0788, "fill": "cloglog"}, {"x": -2, "y": 0.1266, "fill": "cloglog"}, {"x": -1.5, "y": 0.2, "fill": "cloglog"}, {"x": -1, "y": 0.3078, "fill": "cloglog"}, {"x": -0.5, "y": 0.4548, "fill": "cloglog"}, {"x": 0, "y": 0.6321, "fill": "cloglog"}, {"x": 0.5, "y": 0.8077, "fill": "cloglog"}, {"x": 1, "y": 0.934, "fill": "cloglog"}, {"x": 1.5, "y": 0.9887, "fill": "cloglog"}, {"x": 2, "y": 0.9994, "fill": "cloglog"}, {"x": 2.5, "y": 1.0, "fill": "cloglog"}, {"x": 3, "y": 1.0, "fill": "cloglog"}, {"x": 3.5, "y": 1.0, "fill": "cloglog"}, {"x": 4, "y": 1.0, "fill": "cloglog"}, {"x": -2.2504, "y": 0.1, "fill": "cloglog"}, {"x": 1.0972, "y": 0.95, "fill": "cloglog"}], "geoms": ["point", "line"], "x": "eta", "y": "p", "code": {"point": "ggplot(df, aes(eta, p, color = group)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 1.6) +\n  labs(x = \"linear predictor (eta)\", y = \"probability\", color = \"link\")", "line": "ggplot(df, aes(eta, p, color = group)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 1.6) +\n  labs(x = \"linear predictor (eta)\", y = \"probability\", color = \"link\")"}}

Logit and probit are symmetric S-curves, both centred on eta = 0, where they each cross p = 0.5. Cloglog is not. It crosses p = 0.5 at eta = -0.3665, not at 0, and its rise from eta = 0 toward 2 climbs far faster than its earlier rise from eta = -4 toward 0.

The two extra points marked on each curve are the voltage 10 and voltage 18 etas you worked out by hand: -2.1972, -1.2816 and -2.2504 for voltage 10, and 2.9444, 1.6449 and 1.0972 for voltage 18. Each sits exactly on its own link's curve at p = 0.10 or p = 0.95, which is just a sanity check that the hand-computed numbers and these curves agree.

=== step === quiz
## Quick check: reading the standard curves

Look again at the cloglog curve above next to logit and probit.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- cloglog is just logit rescaled by a constant, the way probit nearly is. ::no
- cloglog is not symmetric around any centre the way logit and probit are. It climbs toward 1 faster than it falls toward 0, and that lopsidedness is a property of the function itself, not of any fitted data. ::ok Right. Look at eta = -4 to 0 versus eta = 0 to 4 on the cloglog curve: it crawls up near 0 and then shoots up fast, while logit and probit are mirror images of themselves around eta = 0. That asymmetry is baked into the cloglog formula before any data ever touches it.
- The curves differ only because they would be fit with different coefficients, not because the functions themselves differ. ::no
- cloglog only works when every probability in the data is below 0.5. ::no cloglog is not a rescaled logit or probit, and it is not restricted to small probabilities either. It is a genuinely different, asymmetric function, true for any dataset you fit it to, which is exactly why its curve looks different in the chart above before a single coefficient is estimated.

=== step === concept
## Fitting the same failures three ways

With the links defined, fit the actual failure counts under all three of them and see what each one hands back. R's glm() takes the link as an argument, so the same model formula works for all three, only the family argument changes.

```r
# Fit the same 5-voltage failure data under three different link functions
rates <- data.frame(voltage = c(10, 12, 14, 16, 18), n = rep(20, 5), fail = c(2, 6, 12, 17, 19))

fit_logit   <- glm(cbind(fail, n - fail) ~ voltage, family = binomial(link = "logit"),   data = rates)
fit_probit  <- glm(cbind(fail, n - fail) ~ voltage, family = binomial(link = "probit"),  data = rates)
fit_cloglog <- glm(cbind(fail, n - fail) ~ voltage, family = binomial(link = "cloglog"), data = rates)

coef(fit_logit)
coef(fit_probit)
coef(fit_cloglog)
#> (Intercept)     voltage 
#>  -8.6097416   0.6448207 
#> (Intercept)     voltage 
#>  -5.0159974   0.3751832 
#> (Intercept)     voltage 
#>  -5.6719201   0.3874761 
```

cbind(fail, n - fail) is how you hand a binomial glm() a count of successes and failures out of a total, rather than one row per board. Look at the voltage coefficient in each fit: 0.6448 for logit, 0.3752 for probit, 0.3875 for cloglog. Three different fits on the exact same data, and three different numbers for how much one extra volt moves the linear predictor.

Coefficients are one thing. What actually matters in practice is whether the three models agree on the probability of failure itself.

```r
# Compare each link's fitted failure probability against the observed rate
observed <- rates$fail / rates$n

data.frame(
  voltage = rates$voltage,
  observed,
  logit = round(fitted(fit_logit), 4),
  probit = round(fitted(fit_probit), 4),
  cloglog = round(fitted(fit_cloglog), 4)
)
#>   voltage observed  logit probit cloglog
#> 1      10     0.10 0.1033 0.1031  0.1528
#> 2      12     0.30 0.2949 0.3037  0.3022
#> 3      14     0.60 0.6029 0.5935  0.5420
#> 4      16     0.85 0.8465 0.8382  0.8164
#> 5      18     0.95 0.9524 0.9588  0.9748
```

At voltage 14, the observed failure rate was 0.60. Logit predicts 0.6029, probit predicts 0.5935, and cloglog predicts 0.5420. Logit and probit sit almost on top of each other at every voltage you tested; cloglog drifts a little further off, most visibly in the middle of the range, but it is still in the same neighbourhood. Three fits with three different coefficients, yet none of them disagrees badly with what you actually saw.

=== step === concept
## Why the coefficients differ but the conclusion barely does

The coefficients from the last step, 0.6448, 0.3752 and 0.3875, look close to each other as plain numbers. They are not reporting the same thing, and reading any of them without knowing which link produced it will mislead you.

Logit's coefficient is a log odds ratio. Exponentiate it and you get a plain odds ratio: how much the odds of failing multiply for one extra volt.

```r
# Read each link's voltage coefficient on its own correct scale
exp(coef(fit_logit)["voltage"])
coef(fit_probit)["voltage"]
exp(coef(fit_cloglog)["voltage"])
#>  voltage 
#> 1.905645 
#>   voltage 
#> 0.3751832 
#>  voltage 
#> 1.473258 
```

exp(0.6448) is 1.9056, so under the logit fit, the odds of a board failing multiply by about 1.9056 for every extra volt above spec. Probit's coefficient, 0.3752, has no such ratio reading. It is a shift measured in standard normal units, a z-score, and exponentiating it would not turn it into anything meaningful. And cloglog's exponentiated coefficient, exp(0.3875) = 1.4733, is neither a probit-style z-shift nor a logit-style odds ratio. What that 1.4733 actually measures is a real, nameable quantity.

Here is the part that actually settles the question of whether the choice of link matters. Each fit implies a voltage where the predicted failure probability crosses 0.50, and you can solve for it directly from the intercept and the coefficient.

```r
# Solve each fit for the voltage where its predicted failure probability is 0.5
v50_logit   <- -coef(fit_logit)[["(Intercept)"]] / coef(fit_logit)[["voltage"]]
v50_probit  <- -coef(fit_probit)[["(Intercept)"]] / coef(fit_probit)[["voltage"]]
v50_cloglog <- (log(log(2)) - coef(fit_cloglog)[["(Intercept)"]]) / coef(fit_cloglog)[["voltage"]]

round(c(logit = v50_logit, probit = v50_probit, cloglog = v50_cloglog), 3)
#>   logit  probit cloglog 
#>  13.352  13.369  13.692 
```

Logit and probit cross 0.5 at eta = 0, so their 50%-failure voltage just solves -intercept / coefficient. Cloglog crosses 0.5 at eta = -0.3665 instead, so its equation uses that number in place of zero. The three answers: 13.352, 13.369 and 13.692 volts. The whole spread between the lowest and the highest is only 0.34 volts. So even though the three coefficients live on three different scales and mean three different things, all three models point to almost the same voltage as the one where a board is as likely to fail as not. That is the real answer to whether the choice of link matters here: for this question, it barely does.

=== step === widget
## Where the three fits separate

All three fits agreed closely on the five voltages you actually tested, 10 to 18. That agreement does not have to hold once you move outside the range you have data for, and extending the three fitted curves out to voltage 6 and voltage 22 shows exactly where they start to pull apart.

::widget chart-plotter {"data": [{"x": 6, "y": 0.0087, "fill": "logit"}, {"x": 8, "y": 0.0307, "fill": "logit"}, {"x": 10, "y": 0.1033, "fill": "logit"}, {"x": 12, "y": 0.2949, "fill": "logit"}, {"x": 14, "y": 0.6029, "fill": "logit"}, {"x": 16, "y": 0.8465, "fill": "logit"}, {"x": 18, "y": 0.9524, "fill": "logit"}, {"x": 20, "y": 0.9864, "fill": "logit"}, {"x": 22, "y": 0.9962, "fill": "logit"}, {"x": 6, "y": 0.0028, "fill": "probit"}, {"x": 8, "y": 0.022, "fill": "probit"}, {"x": 10, "y": 0.1031, "fill": "probit"}, {"x": 12, "y": 0.3037, "fill": "probit"}, {"x": 14, "y": 0.5935, "fill": "probit"}, {"x": 16, "y": 0.8382, "fill": "probit"}, {"x": 18, "y": 0.9588, "fill": "probit"}, {"x": 20, "y": 0.9936, "fill": "probit"}, {"x": 22, "y": 0.9994, "fill": "probit"}, {"x": 6, "y": 0.0346, "fill": "cloglog"}, {"x": 8, "y": 0.0735, "fill": "cloglog"}, {"x": 10, "y": 0.1528, "fill": "cloglog"}, {"x": 12, "y": 0.3022, "fill": "cloglog"}, {"x": 14, "y": 0.542, "fill": "cloglog"}, {"x": 16, "y": 0.8164, "fill": "cloglog"}, {"x": 18, "y": 0.9748, "fill": "cloglog"}, {"x": 20, "y": 0.9997, "fill": "cloglog"}, {"x": 22, "y": 1.0, "fill": "cloglog"}], "geoms": ["point", "line"], "x": "voltage", "y": "p", "code": {"point": "ggplot(df, aes(voltage, p, color = group)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 1.6) +\n  labs(x = \"overvoltage (volts above rated spec)\", y = \"predicted probability of failure\", color = \"link\")", "line": "ggplot(df, aes(voltage, p, color = group)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 1.6) +\n  labs(x = \"overvoltage (volts above rated spec)\", y = \"predicted probability of failure\", color = \"link\")"}}

Inside the tested range, logit and probit barely separate. At voltage 14, the biggest gap between them anywhere in the data, logit predicts 0.6029 against probit's 0.5935, a gap of only 0.0094. Cloglog already sits further off at that same voltage, 0.5420, a gap of 0.0609 from logit.

Move outside the tested range and the gap grows. At voltage 8, logit predicts 0.0307, probit predicts 0.0220, and cloglog predicts 0.0735, more than three times probit's number. The three links do not just disagree more the further out you go. They disagree in a direction that depends on each link's own shape, the same asymmetry you saw earlier in each link's standard-form curve.

=== step === concept
## When cloglog is the principled choice

You have now seen cloglog as the odd one out twice: its standard curve is asymmetric, and its fitted values drift from logit and probit's outside the tested range. None of that tells you when you should actually pick it. The real reason comes from what kind of process you think generated the data.

Model "a board fails inside the test window" as a process with a constant hazard rate, call it lambda: the chance per unit time that a surviving board fails, which stays the same number throughout the window. Under a constant hazard, the chance of failing by the end of one unit of time is 1 - exp(-lambda), a standard result from survival analysis.

Now let log(lambda) = b0 + b1 * voltage, so the linear predictor models the log of the hazard rate directly. Substitute that into 1 - exp(-lambda) and you get 1 - exp(-exp(eta)), which is exactly the cloglog inverse function you plotted earlier. So a cloglog glm() is not an arbitrary third option. It is precisely the model you get when you assume a constant hazard rate and let voltage shift that rate on the log scale.

```r
# Check that cloglog's own inverse gives exactly the chance of failing under a constant hazard rate
lambda <- exp(predict(fit_cloglog, type = "link"))
hazard_p <- 1 - exp(-lambda)

round(hazard_p - fitted(fit_cloglog), 10)
#> 1 2 3 4 5 
#> 0 0 0 0 0 
```

Every one of those differences is exactly zero. hazard_p, built from the constant-hazard formula, and fitted(fit_cloglog), built straight from the glm() object, are the same five numbers. That confirms the algebra: fitting with link = "cloglog" is mathematically the same thing as fitting a constant-hazard model on the log scale.

That also settles what exp(0.3875) actually measures, the number that had no clean reading earlier. Under the constant-hazard view, each extra volt multiplies the per-volt failure hazard by about 1.4733. Not an odds ratio, not a z-shift, but a hazard ratio, because that is the quantity cloglog's coefficient actually lives on.

So should you always reach for cloglog when your outcome is secretly a time-to-event? Check first whether it even fits better.

```r
# Compare all three fits by AIC, which measures fit alone, not mechanism
AIC(fit_logit, fit_probit, fit_cloglog)
#>             df      AIC
#> fit_logit    2 18.03642
#> fit_probit   2 18.09141
#> fit_cloglog  2 19.32767
```

On this exact dataset, cloglog fits worse by AIC than either logit or probit, 19.328 against 18.036 and 18.091. AIC does not account for whether failing inside a fixed window might be a time-to-event process; it only measures how well each curve tracks these five points. So the decision to use cloglog should follow from the mechanism you believe generated the data, a constant hazard rate turning into failures over a fixed window, and not from which link happens to minimize AIC on one sample.

=== step === quiz
## Quiz: reading a coefficient on the right scale

The cloglog fit's voltage coefficient is 0.3875, so exp(0.3875) = 1.4733. Which statement correctly describes what that number measures?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It's an odds ratio the same way exp of a logit coefficient is, so the odds of failing rise about 47% per volt. ::no
- It can't be trusted, since the three links disagree once you move past the tested voltages. ::no
- Treating a board's failure as a constant hazard rate, each extra volt multiplies that hazard rate by about 1.4733. ::ok Right. Under cloglog, log(lambda) is the linear predictor, so exponentiating the voltage coefficient scales the hazard rate itself: each extra volt multiplies the constant per-volt chance of failing by about 1.4733, not the odds and not a plain percentage.
- It's the extra percentage of boards expected to fail per additional volt. ::no None of the other three readings are right. 1.4733 is not an odds ratio, that reading belongs to logit's own coefficient. The links disagreeing far from the tested range does not undo what this coefficient means at the range it was fit on. And it is not a percentage of boards failing either. It is a multiplier on a hazard rate, the exact quantity exp(0.3875) measures in a cloglog fit.

=== step === tryit
## Your turn: fit the cloglog model and read its prediction

Using what you now know about family = binomial(link = ...) and predict(), fill in the two lines yourself.

```r
# rates still holds the voltage, n and fail columns from a few steps back.
# Fit a cloglog-linked model: glm(cbind(fail, n - fail) ~ voltage,
# family = binomial(link = "cloglog"), data = rates)
# Then predict the failure probability at voltage = 15 using predict(),
# with type = "response".
# Two lines. Press Check when you have them.
```
::check {"regex": "glm[(][\\s\\S]*link\\s*=\\s*\"cloglog\"[\\s\\S]*predict[(][\\s\\S]*voltage\\s*=\\s*15[\\s\\S]*type\\s*=\\s*\"response\"", "gate": true, "difficulty": "intermediate", "ok": "Right: predict() gives 0.6835, so under this cloglog fit, a board run at 15 volts above spec has about a 68 percent chance of failing inside the test window.", "no": "Fit it with family = binomial(link = \"cloglog\"), data = rates, then call predict(fit, newdata = data.frame(voltage = 15), type = \"response\")."}
::solution
```r
# Fit the cloglog model and predict the failure probability at voltage 15
fit <- glm(cbind(fail, n - fail) ~ voltage, family = binomial(link = "cloglog"), data = rates)

predict(fit, newdata = data.frame(voltage = 15), type = "response")
#>         1 
#> 0.6835304 
```

=== step === concept
## References
::prose-only a list of citations carries no visualizable concept

- Chambers, E.A. & Cox, D.R. (1967). [Discrimination between alternative binary response models](https://doi.org/10.1093/biomet/54.3-4.573). Biometrika, 54(3-4), 573-578. Compares logit, probit and other links fit to the same binary data.
- Prentice, R.L. (1976). [A Generalization of the Probit and Logit Methods for Dose Response Curves](https://doi.org/10.2307/2529262). Biometrics, 32(4), 761-768. A dose-response setting much like the voltage data in this lesson.
- Cox, D.R. (1972). [Regression Models and Life-Tables](https://doi.org/10.1111/j.2517-6161.1972.tb00899.x). Journal of the Royal Statistical Society, Series B, 34(2), 187-202. The hazard-rate idea behind why cloglog is the principled link for a time-to-event outcome.
- Agresti, A. (2013). Categorical Data Analysis, 3rd edition. Wiley, ISBN 978-0-470-46363-5. Section 5.2 covers alternative link functions for binary responses.

=== step === complete
## The whole comparison: three links, one conclusion

You stress-tested 20 circuit boards at each of five voltages, 10 to 18 above spec, and saw a failure rate climbing from 0.10 to 0.95. Logit, probit and cloglog each stretch that climb out onto a straight line in their own way, and standing on their own, logit and probit are symmetric curves centred at eta = 0, while cloglog is asymmetric and crosses 0.5 at eta = -0.3665.

Fitting the same five voltages under all three links gave three different coefficients, 0.6448, 0.3752 and 0.3875 per volt, each living on its own scale: an odds ratio for logit, a plain z-shift for probit, and for cloglog, a hazard ratio once you read it correctly. Despite that, all three fits put the 50%-failure voltage within 0.34 volts of each other, 13.352 to 13.692, and their predicted curves barely separate across the five voltages you actually tested.

Where they do separate is outside that range, from voltage 6 to 22, and the reason to pick cloglog over the other two is not that it separates less, or that it fits better by AIC, since here it does not. It is that failing inside a fixed test window is, mechanically, a constant-hazard process, and cloglog is the one link whose coefficient is built to measure exactly that hazard rate.

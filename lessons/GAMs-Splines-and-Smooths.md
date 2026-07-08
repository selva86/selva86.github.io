---
title: "Advanced Regression Lesson 6: GAMs, Splines and Smooths"
catalog_blurb: "How to fit a smooth curve when a relationship bends, without guessing its shape."
description: "A straight line cannot bend. Generalized additive models fit a smooth curve from penalized splines, letting the data pick its shape without overfitting."
keywords: "GAM, generalized additive model, splines, smooth term, penalized regression, mgcv, effective degrees of freedom, nonlinear regression, basis functions, R"
post_type: "LESSON"
curriculum_id: "6.130.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "6"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "GAMs-Choosing-Smoothness.html"
course_prev: "Lasso-and-Elastic-Net.html"
---

=== step === cover
::eyebrow Lesson 6 of 13
## GAMs, Splines and Smooths

Priya runs an ice-cream cart outside a train station. She has logged 120 days: the day's high temperature and how many ice creams she sold. She fits the obvious model, `sales ~ temp`, and it tells her something absurd: temperature has almost no effect (correlation -0.08, not significant). Yet she knows temperature is the single biggest thing that moves her sales.

The temperature is not the problem. The straight line is. Sales climb as it warms, peak on a pleasant 24 degree afternoon, then fall again when it is too hot to stand on the platform. That is a hill, and a straight line cannot climb a hill and come back down. This lesson gives your regression the ability to bend.

Lesson 5 handed Maya a short list of the channels that matter. Every model in this course so far, ordinary least squares, robust, quantile, ridge and lasso, has fit the same fundamental shape: a straight line (or a flat plane). Today the truth bends, and we let the model bend with it.

By the end of this lesson you will be able to:

- Diagnose why a straight-line model fails on a relationship that bends
- Explain a smooth as a spline: a flexible curve built by adding up simple building-block curves
- Understand how a wiggliness penalty lets the data choose the right flexibility, so you never guess a polynomial degree
- Fit a GAM in R, and read the effective degrees of freedom (edf) that tell you how much the curve bent

**Prerequisites:** you can fit and read an [`lm()`](OLS-Regression-from-Scratch.html) (coefficients, R-squared, significance), you know the [bias-variance tradeoff](The-Bias-Variance-Tradeoff.html) (underfit vs overfit), and you have met a penalty that trades fit for simplicity in [ridge regression](Ridge-Regression-and-Shrinkage.html).

Drag the smoothness dial below. Watch the fit go from a stiff line that misses the bend, to an honest curve that tracks the true shape (dashed), to a wild overfit that chases every noisy point. Finding that middle, automatically, is what a GAM does.

::widget spline-smoother {}

=== step === concept
::eyebrow The problem
## A straight line cannot bend

Let us reproduce Priya's frustration in code. We build her 120 days inline (each lesson runs in a fresh R session, so all the data lives right here), then fit the straight line she tried.

```r
library(ggplot2)
set.seed(7)
n <- 120
ice <- data.frame(
  temp     = round(runif(n, 12, 36), 1),   # daily high temperature, Celsius
  humidity = round(runif(n, 30, 90)),      # percent relative humidity
  weekend  = rbinom(n, 1, 0.3)             # 1 on Saturday and Sunday
)
# true sales: a hill that peaks near 24 C, plus a weekend bump and day-to-day noise
base <- 135 - 0.22 * (ice$temp - 24)^2
ice$sales <- round(pmax(0, base + 10 * ice$weekend - 0.12 * ice$humidity + rnorm(n, 0, 8)))

fit_lin <- lm(sales ~ temp, data = ice)
round(coef(summary(fit_lin)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  123.815      4.179  29.631    0.000
#> temp          -0.140      0.166  -0.841    0.402
```

The slope on `temp` is -0.14 with a p-value of 0.40. Read literally, the model says: for every extra degree, sales change by essentially nothing, and we cannot even be sure of the direction. The overall fit is just as bleak.

```r
round(c(correlation = cor(ice$temp, ice$sales),
        r_squared   = summary(fit_lin)$r.squared), 3)
#> correlation   r_squared
#>      -0.077       0.006
```

An R-squared of 0.006 means the line explains six-tenths of one percent of the variation in sales. Now look at why. Plot the days and lay the best straight line over them.

```r
ggplot(ice, aes(temp, sales)) +
  geom_point(alpha = 0.5) +
  geom_smooth(method = "lm", se = FALSE) +      # the best straight line
  labs(x = "temperature (C)", y = "ice creams sold")
```

The points make a clear hill: low at both cold and sweltering days, high in the comfortable middle. The straight line runs flat through the crest, because the rising left half and the falling right half cancel out to a slope of nearly zero. The relationship is strong; the line is just the wrong shape to see it. We need a model that can follow the bend.

=== step === concept
::eyebrow The idea
## A smooth is a sum of simple curves

Here is the trick that lets a regression bend. Instead of one rigid line, we build the curve out of a handful of simple **building-block curves**, each a gentle bump sitting over a different stretch of the x-axis. Give each block a weight, add them up, and their sum is a flexible curve. That summed curve is called a **spline**, and the blocks are its **basis functions**.

Formally, a smooth term \(f(x)\) is written as a weighted sum of \(k\) basis functions:

\[ f(x) = \sum_{j=1}^{k} \beta_j\, b_j(x) \]

Reading each symbol: \(b_j(x)\) is the \(j\)-th building-block curve (a fixed, known bump), \(\beta_j\) is the weight the model learns for it, and \(k\) is how many blocks we use. The blocks are fixed in advance; fitting the smooth just means finding the weights \(\beta_j\), which is the same least-squares problem you already know, only with these bumps as the predictors instead of raw `temp`.

You have actually seen one kind of basis before: a polynomial. Writing \(f(x) = \beta_1 x + \beta_2 x^2 + \beta_3 x^3\) uses the powers of \(x\) as its blocks. Polynomials can bend, but a single global polynomial is a blunt tool: crank the degree up and it develops wild swings near the edges of the data, and one formula is forced to describe the whole range at once. Splines use **local** bumps instead, so each part of the curve is shaped mostly by the nearby data. Here are six spline blocks for Priya's temperature range.

```r
library(splines)
library(tidyr)
B <- as.data.frame(bs(ice$temp, df = 6))   # six spline building-block curves
names(B) <- paste0("b", 1:6)
B$temp <- ice$temp
basis_long <- pivot_longer(B, cols = starts_with("b"),
                           names_to = "piece", values_to = "value")
ggplot(basis_long, aes(temp, value, colour = piece)) +
  geom_line(linewidth = 1) +
  labs(title = "Six building blocks; a spline is their weighted sum",
       x = "temperature (C)", y = "basis value")
```

Each coloured curve is one \(b_j(x)\), switched on over its own slice of temperature. The fitted smooth is these six curves scaled by their learned weights and added together. More blocks (a larger \(k\)) means a more flexible curve that can wiggle in more places, which is exactly the knob we have to get right.

=== step === widget
::eyebrow Feel it
## The flexibility dial

That knob, the number of basis functions, controls how flexible the smooth can be, and it is a bias-variance tradeoff dressed in new clothes. Drag it and watch.

::widget spline-smoother {}

With too few blocks (slide left), the smooth is almost a straight line: it cannot reach the bends, so it **underfits**, high bias. With too many (slide right), the smooth becomes flexible enough to detour toward individual noisy points, wandering away from the true dashed curve: it **overfits**, high variance. Somewhere in the middle it tracks the real shape without chasing noise. The whole game of fitting a smooth is landing on that middle, and next you will see the tool that finds it for you.

=== step === quiz
::eyebrow Check yourself
## When flexibility goes too far

You slide the smoothness dial all the way up, giving the spline the most basis functions it allows. The fitted curve now passes almost exactly through the training points. Is that the best model of Priya's sales?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: a curve that hugs the points has captured the relationship most fully ::no That is the definition of overfitting. Hitting every point means the curve is tracing the random noise of these particular 120 days, not the real temperature effect, so it will predict new days worse, not better.
- No: that curve is chasing the noise; the honest fit is calmer, tracking the trend without hitting every point ::ok Right. Maximum flexibility drives the training error toward zero, but those extra wiggles are fit to noise. The best smooth balances following the real bend against staying calm between points.
- No: more basis functions make the curve underfit, not overfit ::no It is the other way round. More basis functions make the smooth MORE flexible, which leads to overfitting. Too FEW basis functions is what causes underfitting.

=== step === concept
::eyebrow The engine
## Let the penalty choose the wiggliness

Picking the number of basis functions by hand is fiddly and easy to get wrong. A GAM sidesteps the whole problem with the idea you already met in ridge and lasso: a **penalty**. Give the smooth plenty of basis functions (a generous upper limit), then punish the fit for being wigglier than the data justifies. The fit minimizes

\[ \underbrace{\sum_{i=1}^{n}\bigl(y_i - f(x_i)\bigr)^2}_{\text{fit the data}} \;+\; \lambda \underbrace{\int f''(x)^2\,dx}_{\text{total wiggliness}} \]

The first term is the usual squared error, pulling the curve toward the points. The second is the penalty. Inside it, \(f''(x)\) is the curve's second derivative, its **curvature**: it is zero where the curve is straight and large where it bends sharply. Squaring and integrating over the whole range adds up the total wiggliness of the curve. The knob \(\lambda\) (lambda) sets how hard we punish that wiggliness.

When \(\lambda\) is large, any curvature is expensive, so the fit flattens toward a straight line. When \(\lambda\) is zero, wiggliness is free and the curve bends to hit every point. The right \(\lambda\) sits in between, and here is the payoff: you do not pick it by eye. `mgcv` estimates \(\lambda\) from the data automatically (it uses a criterion called GCV or REML), choosing just enough flexibility to fit the signal and no more.

[KEY INSIGHT]
This is what "penalized spline" means and why a GAM feels almost tuning-free: you set a generous ceiling on flexibility, and the wiggliness penalty, with \(\lambda\) chosen from the data, dials the actual smoothness down to what the data supports. Same bargain as ridge, now spent on curvature instead of coefficient size.

=== step === concept
::eyebrow In R
## Fit the smooth with mgcv

Enough theory. The `mgcv` package fits GAMs, and the whole idea comes down to one piece of notation: wrap a predictor in `s()` to say "fit a smooth of this," instead of using it raw for a straight line.

```r
library(mgcv)
g <- gam(sales ~ s(temp), data = ice)   # s(temp) = fit a penalized smooth of temp
summary(g)
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 120.4250     0.7677   156.9   <2e-16 ***
#>
#> Approximate significance of smooth terms:
#>           edf Ref.df     F p-value
#> s(temp) 5.969  7.119 18.37  <2e-16 ***
#>
#> R-sq.(adj) =  0.517   Deviance explained = 54.2%
```

Compare that to the straight line. The linear model explained 0.6% of the variation and called `temp` insignificant. This GAM, using the very same predictor, explains **54%** and finds the smooth of temperature wildly significant (p below 2e-16). Nothing changed about Priya's data; we only gave the model permission to bend. The smooth term found the hill the straight line was blind to.

=== step === concept
::eyebrow Reading the fit
## Plot the curve, and read the edf

A fitted GAM is best understood by drawing the curve it learned. We ask the model to predict across the temperature range, with a rough confidence band, and lay it over the data.

```r
grid <- data.frame(temp = seq(12, 36, length.out = 200))
pr <- predict(g, newdata = grid, se.fit = TRUE)
grid$fit <- pr$fit
grid$lo  <- pr$fit - 2 * pr$se.fit    # a rough 95% band
grid$hi  <- pr$fit + 2 * pr$se.fit

ggplot(ice, aes(temp, sales)) +
  geom_point(alpha = 0.4) +
  geom_ribbon(data = grid, aes(temp, ymin = lo, ymax = hi),
              inherit.aes = FALSE, alpha = 0.2) +
  geom_line(data = grid, aes(temp, fit), inherit.aes = FALSE, linewidth = 1) +
  labs(x = "temperature (C)", y = "ice creams sold")
```

There is the hill: sales rise from about 103 on a cold 12 degree day to a peak near 129 around 24 degrees, then slide back to about 106 in the sweltering mid-30s. The band is narrow where days are plentiful and flares at the sparse extremes, an honest picture of where the model is sure.

Now the one number to read off the summary: **edf**, the *effective degrees of freedom*. It measures how wiggly the fitted curve actually turned out. An edf near 1 means the smooth spent one straight line's worth of flexibility, so it is essentially a line; a larger edf means real curvature. Priya's `s(temp)` has edf 5.97, confirming a genuine, several-times-bending shape. To see the other extreme, fit a smooth of humidity on its own:

```r
round(summary(gam(sales ~ s(humidity), data = ice))$s.table, 3)
#>             edf Ref.df     F p-value
#> s(humidity)   1      1 0.176   0.676
```

edf = 1.00. The penalty found no curvature worth keeping in humidity's effect and collapsed the smooth all the way to a straight line. That is the beauty of it: a GAM will happily report that a relationship is linear when it is, so you never pay for flexibility you do not use.

=== step === quiz
::eyebrow Check yourself
## What edf tells you

You fit `gam(y ~ s(x))` and the summary reports **edf = 1.0** for the smooth term. What does that tell you about the relationship between `x` and `y`?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The smooth failed to fit and the term should be dropped ::no edf = 1 is a perfectly good fit; it simply means the fitted shape is a straight line. The term can stay (or you could write `x` as a plain linear term and get the same thing).
- The penalty flattened the smooth to a straight line: x's effect is essentially linear ::ok Right. edf counts how much wiggliness the fit used, and edf near 1 is one straight line's worth. The data gave no reason to bend, so a linear term would do the same job.
- edf = 1 means the model explains 100% of the variance ::no edf is effective degrees of freedom, a measure of the fitted curve's flexibility, not a share of variance explained. Deviance explained and R-squared measure fit; edf measures shape.

=== step === tryit
::eyebrow Your turn
## Add a second smooth: the additive part

So far, one predictor. The "additive" in Generalized Additive Model is the rule for handling many: give each predictor its own smooth and **add them up**.

\[ \mathbb{E}[y] = \beta_0 + f_1(x_1) + f_2(x_2) + \dots + f_p(x_p) \]

Each \(f_j\) is a penalized smooth (or, if a predictor is best left straight, a plain linear term). Because the terms add rather than tangle together, you can plot and interpret each effect on its own, which is what keeps a GAM readable even as it bends. (The "Generalized" half means, just like a GLM, you can also swap in a different family and link, a Poisson for counts, say; later lessons use it.)

Give Priya's model both a temperature smooth and a humidity smooth, plus a plain weekend bump. Fill in the smooth of humidity, then check.

```r
g2 <- gam(sales ~ s(temp) + s(____) + weekend, data = ice)
summary(g2)$s.table
```
::check {"regex":"s\\s*\\(\\s*humidity","gate":true,"difficulty":"intermediate","ok":"That fits one smooth per predictor and adds them. Notice temp bends hard (edf 3.5) while humidity stays nearly straight (edf 1.6).","no":"Wrap humidity in a smooth: s(humidity). Each predictor gets its own s() term, and the GAM adds them up."}
::solution
```r
g2 <- gam(sales ~ s(temp) + s(humidity) + weekend, data = ice)
summary(g2)
#> Parametric coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 119.5419     0.8976 133.179   <2e-16 ***
#> weekend       3.0278     1.7166   1.764   0.0805 .
#>
#> Approximate significance of smooth terms:
#>               edf Ref.df      F p-value
#> s(temp)     3.497  4.337 31.423  <2e-16 ***
#> s(humidity) 1.634  2.037  4.102  0.0177 *
#>
#> R-sq.(adj) =  0.545   Deviance explained = 56.9%
```

Each term reads on its own: temperature bends strongly (edf 3.5), humidity is nearly linear (edf 1.6), and weekends add about 3 sales. That mix, some terms curved, some straight, all added together, is the everyday shape of a GAM.

[WARNING]
A GAM is the right reach when a relationship is smooth but nonlinear and you want to see the shape. It is the wrong tool for a sharp jump or step (a smooth cannot capture a cliff), for extrapolating past the edge of your data (a penalized smooth goes wild outside its range), and it assumes effects simply add, so a true interaction between predictors needs an explicit interaction term, not two separate smooths.

=== step === concept
::eyebrow Go deeper
## References

- [An Introduction to Statistical Learning, ch. 7 (free PDF)](https://www.statlearning.com/) - "Moving Beyond Linearity": the gentle, visual introduction to splines and GAMs.
- [The Elements of Statistical Learning, ch. 5 and 9 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full math of smoothing splines and additive models.
- [mgcv on CRAN (package and manual)](https://cran.r-project.org/web/packages/mgcv/index.html) - the reference for the package you used here: `s()`, penalties, and how lambda is chosen.
- [Noam Ross, GAMs in R (free interactive course)](https://noamross.github.io/gams-in-r-course/) - a hands-on tour of fitting and checking GAMs with mgcv.
- [Hastie and Tibshirani (1986), Generalized Additive Models](https://doi.org/10.1214/ss/1177013604) - the original paper that introduced the method.

=== step === complete
## Lesson 6 complete

You gave regression the ability to bend. When Priya's straight line saw nothing (R-squared 0.006, temperature not significant), a GAM using the same predictor explained 54% of her sales, because it fit the hill instead of a line. The machinery: a smooth is a spline, a weighted sum of simple basis functions; more basis functions mean more flexibility; and a wiggliness penalty, with its strength lambda chosen from the data, dials that flexibility down to exactly what the data supports. You fit one with `gam(sales ~ s(temp))` in mgcv, read the edf to see how much each term bent, and stacked several smooths into one additive, interpretable model.

Next, Lesson 7: Choosing smoothness. You set `k` generously here and trusted the penalty, but how do you know `k` was large enough? What happens when two smooth predictors carry the same information (concurvity), and how do you tell mgcv itself whether the fit is trustworthy? You will learn to read `gam.check()` and diagnose a smooth the way you diagnose a linear model's residuals.

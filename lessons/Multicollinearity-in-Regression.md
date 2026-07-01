---
title: "Regression Modeling Lesson 4: Multicollinearity in Regression"
catalog_blurb: "Why correlated predictors make coefficients unstable, and how to detect and fix it."
description: "Two predictors that move together make regression coefficients unstable and even flip their sign. Detect multicollinearity with the correlation matrix and the VIF, and fix it in R."
keywords: "multicollinearity, VIF, variance inflation factor, correlated predictors, collinearity, regression, unstable coefficients, lm, correlation matrix, R"
post_type: "LESSON"
curriculum_id: "6.20.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "4"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Heteroskedasticity-and-Autocorrelation.html"
course_prev: "Influence-and-Leverage.html"
---

=== step === cover
::eyebrow Lesson 4 of 8
## Multicollinearity in Regression

In Lesson 3 you watched a single *row* hijack a regression: one freak heatwave day halved Priya's slope. This lesson is a quieter sabotage from a different direction, two *columns* that secretly say the same thing.

Priya, still running her iced-coffee cart, wants a sharper model. Her weather app shows two numbers every morning: the actual temperature and the "feels like" temperature. "Feels like is what customers really experience," she reasons, "so let me add it." She drops both into her regression, and the slope on temperature, a rock-solid **+1.9 cups per degree** since Lesson 1, suddenly turns **negative**. The model now claims hotter days sell *fewer* cups. Nothing about her data changed. She just added one well-meaning column.

By the end of this lesson you will be able to:

- Explain what multicollinearity is, and why it makes coefficients unstable while leaving predictions intact
- Detect it with a correlation matrix, and know the one case that matrix misses
- Compute the variance inflation factor (VIF) in R and read it against the usual cutoffs
- Decide what to do about it, including when the honest answer is "nothing"

**Prerequisites:** Lessons 1 to 3 (you can fit a line with `lm()`, read its coefficients and standard errors, and you know what R-squared means). Every new term is defined as it appears.

The scatter below is the whole problem in one picture: each dot is one day, actual temperature on the bottom, "feels like" up the side. They fall almost perfectly on a line. Two columns carrying one piece of information.

::widget chart-plotter {"data":[{"x":21.5,"y":23.8},{"x":24.5,"y":26.7},{"x":33.9,"y":37.7},{"x":25.4,"y":30.2},{"x":31.2,"y":35},{"x":29,"y":30.5},{"x":27.1,"y":29.6},{"x":29.3,"y":32.3},{"x":23.5,"y":25.9},{"x":22.7,"y":24.8},{"x":33.4,"y":35.9},{"x":26.9,"y":30.4},{"x":24.5,"y":27.7},{"x":31.4,"y":33.6},{"x":23.8,"y":27.5},{"x":17.5,"y":19.1},{"x":23.6,"y":27.1},{"x":19.1,"y":21},{"x":27.1,"y":30.7},{"x":22.7,"y":25.2},{"x":20,"y":22.1},{"x":22.5,"y":24.8},{"x":25.6,"y":28.7},{"x":30.3,"y":34.2},{"x":29.9,"y":31.9},{"x":32.6,"y":35.4},{"x":24.4,"y":27.2},{"x":33.9,"y":37.4}],"geoms":["point"],"x":"temp","y":"feels_like"}

=== step === concept
::eyebrow The setup
## A second thermometer

Priya logged four weeks of trading: each day's high temperature in Celsius, the "feels like" reading off her weather app, and cups sold. A fresh R session starts empty, so we build that table right here.

```r
set.seed(22)
n <- 28
temp       <- round(runif(n, 16, 34), 1)              # the day's high, in Celsius
feels_like <- round(temp + 3 + rnorm(n, 0, 0.9), 1)   # the weather-app "feels like"
cups       <- round(8 + 1.9 * temp + rnorm(n, 0, 4))  # sales, driven by the REAL temperature
coffee     <- data.frame(temp, feels_like, cups)
head(coffee)
#>   temp feels_like cups
#> 1 21.5       23.8   52
#> 2 24.5       26.7   62
#> 3 33.9       37.7   76
#> 4 25.4       30.2   69
#> 5 31.2       35.0   67
#> 6 29.0       30.5   64
```

Look at how we built it, because it is the whole reason the trouble appears. Cups depend on the **real** temperature. `feels_like` is just that same temperature plus about three degrees of "mugginess" and a sprinkle of noise. It carries no information of its own about sales; it is a near-copy of `temp` wearing a different label.

First, the model Priya trusted from Lesson 1, temperature alone:

```r
round(summary(lm(cups ~ temp, data = coffee))$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    9.388      5.232   1.794    0.084
#> temp           1.902      0.196   9.710    0.000
```

Each extra degree buys her about **1.9** more cups. The small standard error (0.196) and the large t-value (9.7) say that estimate is rock solid: this is exactly the relationship she has counted on for three lessons. This is the baseline we are about to break.

=== step === concept
::eyebrow The shock
## Add both, and the slope flips

Now Priya does the well-meaning thing and adds `feels_like` next to `temp`.

```r
round(summary(lm(cups ~ temp + feels_like, data = coffee))$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    6.190      4.868   1.271    0.215
#> temp          -1.134      1.161  -0.977    0.338
#> feels_like     2.851      1.077   2.647    0.014
```

Read the `temp` row and wince. The slope that was a confident **+1.90** is now **-1.13**: the model is claiming that, holding "feels like" fixed, a hotter day *loses* her cups. Its standard error has ballooned from 0.196 to **1.161**, almost six times bigger, and its p-value of 0.34 now says "this could easily be zero." Meanwhile `feels_like`, which is nothing but temperature in disguise, has walked off with a big positive coefficient and all the statistical credit.

Nothing in the data is broken. The two columns are nearly identical, so the regression has no stable way to divide the effect between them. It can describe the very same fitted line as "+1.9 on temp," or "-1.1 on temp and +2.9 on feels-like," or a thousand other split-the-difference combinations, and they all fit about equally well. With no firm reason to prefer one split, the estimates wobble and their standard errors explode. That instability, caused by predictors that are strongly linearly related to each other, is **multicollinearity**.

[KEY INSIGHT]
Multicollinearity wrecks the *coefficients*, their size, sign, and standard errors. It barely touches the *fit*: the model's predictions and overall R-squared stay almost where they were (you will confirm this near the end). The damage is entirely in your ability to read what each predictor does, which is very often the whole reason you ran the regression.

=== step === quiz
::eyebrow Check yourself
## What exactly broke?

Adding `feels_like` flipped the temperature coefficient to -1.13 and inflated its standard error nearly six-fold. A colleague glances at the output and says, "Your model is broken now, the predictions must be garbage." Is she right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: an unstable, sign-flipped coefficient means the model fits badly and predicts badly ::no Coefficients and predictions are different things. The fitted line barely moved; what became unstable is only the way the *credit* is split between two near-identical columns. The forecast for any given day, and the R-squared, are essentially unchanged.
- No: the fitted line and its predictions barely moved; only the individual coefficients and their standard errors became unreliable ::ok Exactly. Multicollinearity is a disease of interpretation, not of fit. The forecast for any particular day is fine. What you can no longer trust is the size or sign of one predictor's coefficient.
- No, because multicollinearity can never affect a fitted model in any way at all ::no It does affect the model, just not where she thinks. The coefficients and their standard errors genuinely become unreliable; it is the predictions and the overall fit that survive, not "nothing."

=== step === concept
::eyebrow Why it happens
## The model cannot split the credit

Here is the intuition, then the math. A regression coefficient answers one very specific question: *holding every other predictor fixed, how much does the response change when this predictor goes up by one?* That question only has a clean answer if you can actually vary one predictor while the others stay put. But `temp` and `feels_like` move together almost perfectly, so "raise temperature one degree while keeping feels-like fixed" describes days that barely exist in Priya's data. The model is being asked to measure an effect it has hardly ever seen in isolation, so its answer is mostly guesswork, and guesswork comes with a large standard error.

The standard first check is a **correlation matrix**: the Pearson correlation \(r\) between every pair of columns, where \(r\) runs from \(-1\) to \(+1\) and values near \(\pm 1\) mean two columns move in near-lockstep. Below, the deep-green cell is the culprit.

::widget correlation-heatmap {"vars":["temp","feels_like","cups"],"data":{"temp":[21.5,24.5,33.9,25.4,31.2,29,27.1,29.3,23.5,22.7,33.4,26.9,24.5,31.4,23.8,17.5,23.6,19.1,27.1,22.7,20,22.5,25.6,30.3,29.9,32.6,24.4,33.9],"feels_like":[23.8,26.7,37.7,30.2,35,30.5,29.6,32.3,25.9,24.8,35.9,30.4,27.7,33.6,27.5,19.1,27.1,21,30.7,25.2,22.1,24.8,28.7,34.2,31.9,35.4,27.2,37.4],"cups":[52,62,76,69,67,64,55,68,49,53,65,61,60,67,60,38,57,43,56,57,45,50,53,72,65,78,53,70]}}

`temp` and `feels_like` correlate at **0.99**: almost perfectly redundant. Now the formula that turns that redundancy into a number you can act on. The **variance inflation factor**, or VIF, for predictor \(j\) is

\[ \text{VIF}_j = \frac{1}{1 - R_j^2} \]

where \(R_j^2\) is the R-squared you get by regressing predictor \(j\) on *all the other predictors* (not on the response). Read it as a question: how well can the other columns already predict this one? If they predict it perfectly, \(R_j^2 \to 1\) and \(\text{VIF}_j \to \infty\). The name is literal. The variance of the coefficient estimate is multiplied by exactly this factor, so its standard error is multiplied by \(\sqrt{\text{VIF}_j}\). A VIF of 43 means the standard error is about \(\sqrt{43} \approx 6.6\) times larger than it would be if that predictor were uncorrelated with the rest, almost exactly the six-fold blow-up you just saw on `temp`.

=== step === concept
::eyebrow Measuring it
## Putting a number on it in R

You do not need a special package to get a VIF; the definition is a one-line recipe. Regress the suspect predictor on the other predictor(s), take the R-squared, and invert one minus it.

```r
# VIF for temp: how well does feels_like alone predict temp?
r2_temp <- summary(lm(temp ~ feels_like, data = coffee))$r.squared
round(r2_temp, 3)
#> [1] 0.977
round(1 / (1 - r2_temp), 1)   # VIF for temp
#> [1] 43.2
```

An R-squared of 0.977 means `feels_like` already explains 98% of `temp`: they really are nearly the same column. That gives a VIF of **43**. With only two predictors, each explains the other equally well, so `feels_like` has the identical VIF:

```r
r2_feels <- summary(lm(feels_like ~ temp, data = coffee))$r.squared
round(1 / (1 - r2_feels), 1)   # VIF for feels_like
#> [1] 43.2
```

How big is too big? The rules of thumb every analyst carries:

- **VIF around 1** means the predictor is uncorrelated with the others. Ideal.
- **VIF above 5** is worth a look; redundancy is creeping in.
- **VIF above 10** is serious multicollinearity; that coefficient is hard to trust.

A VIF of 43 is far past every alarm. In day-to-day work you would not compute it by hand, of course; one call to `car::vif()` reports the VIF for every predictor at once:

```r-static
library(car)
vif(lm(cups ~ temp + feels_like, data = coffee))
#>       temp feels_like
#>       43.2       43.2
```

[NOTE]
Why bother with the VIF when the correlation matrix already flagged these two? Because a correlation matrix only sees *pairs*. A predictor can be an almost perfect combination of *several* others while showing only mild correlation with each one alone, so the matrix looks innocent and the VIF still screams. That hidden, multi-column redundancy is exactly what the VIF catches and pairwise correlations cannot.

=== step === tryit
::eyebrow Your turn
## Compute a VIF the right way

The one trap in the VIF recipe: the auxiliary regression predicts the suspect predictor from the **other predictors**, never from the response. Fill in the blank with the correct response variable for the VIF of `temp`.

```r
# VIF for temp uses the R-squared of temp regressed on the OTHER predictors.
r2 <- summary(lm(____ ~ feels_like, data = coffee))$r.squared
round(1 / (1 - r2), 1)
```
::check {"regex":"temp\\s*~","gate":true,"difficulty":"intermediate","ok":"Right. The VIF for temp comes from regressing temp on the other predictors, lm(temp ~ feels_like). That gives R-squared 0.977 and a VIF of 43.","no":"Use the suspect predictor as the response: lm(temp ~ feels_like). Never put cups (the response of the real model) here; the VIF only looks at how the predictors relate to each other."}
::solution
```r
r2 <- summary(lm(temp ~ feels_like, data = coffee))$r.squared
round(1 / (1 - r2), 1)
#> [1] 43.2
```

=== step === concept
::eyebrow What to do
## Fix it, or decide you do not need to

You have three honest moves, in rough order of how often they are the right one.

**1. Drop one of the redundant predictors.** If two columns carry the same information, keep the one you can interpret and act on, and delete the other. Here `feels_like` adds nothing `temp` did not already have, so drop it and the coefficient snaps back to sanity:

```r
round(coef(lm(cups ~ temp, data = coffee)), 3)
#> (Intercept)        temp
#>       9.388       1.902
```

**2. Combine them.** When the correlated predictors are facets of one underlying thing (height in inches and height in centimeters, or several survey questions probing the same attitude), replace them with a single index, an average or a principal component, rather than throwing information away.

**3. Leave it alone, on purpose.** The move people forget. Multicollinearity only hurts when you need to read individual coefficients. If you only care about the *prediction*, or the correlated variables are controls you will never interpret, you can ignore it entirely. Check that the prediction really is untouched:

```r
both <- lm(cups ~ temp + feels_like, data = coffee)   # VIF 43, unstable coefficients
one  <- lm(cups ~ temp, data = coffee)                # clean, single predictor
round(c(R2_both = summary(both)$r.squared, R2_one = summary(one)$r.squared), 3)
#> R2_both  R2_one
#>   0.831   0.784
round(cor(predict(both), predict(one)), 3)            # do the day-by-day forecasts agree?
#> [1] 0.971
```

The two models forecast almost the same thing (their predictions correlate 0.97) and the overall fit barely changes, even though one carries a wild `-1.13` coefficient and the other a clean `+1.90`. If Priya only wants tomorrow's cup count, the messy model is fine. If she wants to *explain* how temperature drives sales, she must fix the collinearity first.

[KEY INSIGHT]
There is no test that says "multicollinearity is present, therefore act." The VIF tells you the coefficients are unstable; whether that matters depends entirely on whether you came to **predict** or to **explain**. Diagnose with the VIF, decide with your goal.

For the rare case where every correlated predictor is genuinely needed and none can be dropped or combined, **ridge regression** deliberately shrinks the coefficients to tame the instability, a tool you will meet later in the track.

=== step === quiz
::eyebrow Check yourself
## Predict, or explain?

A bank builds a model to **forecast** loan defaults. Two of its inputs, a customer's annual income and their average monthly bank balance, have a VIF of 14. Accuracy on held-out data is strong, and the bank only needs the predicted default risk, never the individual coefficients. What is the right call?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Drop income or balance immediately, because any VIF above 10 must be removed ::no The cutoffs flag instability in the *coefficients*; they are not a command to delete a column. Here nobody reads the coefficients, so their instability costs the bank nothing.
- Conclude the model is unusable until the VIF falls below 10 ::no Multicollinearity does not damage predictive accuracy, and the held-out performance is strong. A purely predictive model can carry a high VIF with no harm.
- Leave the model as it is: the goal is prediction, not interpretation, so unstable coefficients do not matter here ::ok Exactly. The VIF warns that the income and balance coefficients are unreliable, but the bank never reads them. Predictions are unaffected, so the high VIF is a non-issue for this use. It would matter only if someone needed to interpret each predictor's separate effect.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take multicollinearity and the VIF further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - section 3.3.3 explains collinearity and the VIF in plain terms, with the same formula you used here.
- [The Elements of Statistical Learning, ch. 3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the deeper treatment, including ridge regression as a principled remedy for correlated predictors.
- [car: Companion to Applied Regression (CRAN)](https://cran.r-project.org/package=car) - the package whose `vif()` is the standard one-line VIF in everyday R work.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - Lesson 12 is a free, worked walk-through of detecting multicollinearity with variance inflation factors.

=== step === complete
## Lesson 4 complete

You can now spot the second way a regression goes wrong: not one rogue row, but two columns that say the same thing. **Multicollinearity** is strong linear relationship between predictors; it leaves the fit and the predictions alone but makes individual coefficients unstable, blowing up their standard errors and even flipping their signs. You detect it with a correlation matrix for the obvious pairs, and with the **VIF** (\(1/(1-R_j^2)\), read against the 5 and 10 cutoffs) for the redundancy a pairwise view misses. And you fix it by judgement, not reflex: drop a redundant column, combine related ones, reach for ridge, or, if you only need predictions, do nothing at all.

Next, Lesson 5: Heteroskedasticity and Autocorrelation. So far the trouble has been in the predictors, one bad row, then two redundant columns. Next it moves into the *errors* themselves: what happens when the residuals fan out or march in step, why that quietly corrupts your standard errors, and how to spot and correct it.

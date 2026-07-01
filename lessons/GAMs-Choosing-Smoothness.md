---
title: "Advanced Regression Lesson 7: Choosing the Smoothness"
catalog_blurb: "How to check a smooth curve is flexible enough and worth trusting."
description: "You set k generously and trust the penalty, but is the fit sound? Read gam.check to size k, spot concurvity between smooths, and check a GAM's residuals."
keywords: "gam.check, choosing k, basis dimension, concurvity, mgcv, GAM diagnostics, effective degrees of freedom, k-index, penalized spline, R"
post_type: "LESSON"
curriculum_id: "6.130.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "7"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Count-Models-Poisson-and-Negative-Binomial.html"
course_prev: "GAMs-Splines-and-Smooths.html"
---

=== step === cover
::eyebrow Lesson 7 of 13
## Choosing the Smoothness

Priya's ice-cream cart is back, and last lesson ended well. A straight line saw nothing in her sales, but a GAM, given permission to bend, found the temperature hill and explained more than half the variation. The recipe was one line, `s(temp)`, and a promise: set the flexibility ceiling generously, and the wiggliness penalty will dial the curve down to just what the data supports.

That promise hides two questions we never actually checked. Was the ceiling high enough, or did the penalty quietly run out of room? And once a GAM hands you a set of bending curves, can you trust their shapes at all? This lesson is the diagnostic half of GAMs: sizing the smoothness, and deciding whether to believe the fit.

By the end of this lesson you will be able to:

- Tell apart `k`, the flexibility ceiling you set, and the effective degrees of freedom the penalty actually spends, and spot when the ceiling is too low
- Read `gam.check` to decide whether `k` is large enough, and raise it when it is not
- Recognize concurvity, the smooth-term version of collinearity, and measure it before you trust a curve
- Check a GAM's residuals the way you check a linear model's, so a bad fit cannot slip past

**Prerequisites:** you can [fit a GAM and read its edf](GAMs-Splines-and-Smooths.html) (last lesson), you know the [bias-variance tradeoff](The-Bias-Variance-Tradeoff.html), and you can read a [linear model's residuals](OLS-Regression-from-Scratch.html).

Drag the smoothness dial once more. Everything in this lesson is about landing on that middle setting on purpose, and being able to prove you landed there.

::widget spline-smoother {}

=== step === concept
::eyebrow The two numbers
## k is a ceiling; edf is the bill

Priya kept logging, and her book now covers 200 days of one summer with a new column: the day of the season, 1 to 120. Sales still follow temperature, but they also rise and fall across the summer as festivals, school holidays and a seaside week come and go, a pattern with several bumps in it. We rebuild the fuller dataset inline (a fresh session, so all her data lives right here) and fit the whole thing at once.

```r
library(mgcv)
set.seed(7)
n <- 200
ice <- data.frame(
  day      = round(runif(n, 1, 120)),      # day of the 120-day summer
  temp     = round(runif(n, 12, 36), 1),   # daily high temperature (Celsius)
  humidity = round(runif(n, 30, 90)),      # percent relative humidity
  weekend  = rbinom(n, 1, 0.3)             # 1 on Saturday and Sunday
)
hill   <- -0.22 * (ice$temp - 24)^2                 # the temperature hill, peak near 24C
season <- 14 * sin(ice$day / 120 * 6 * pi)          # a wiggly across-summer pattern
ice$sales <- round(pmax(0, 150 + hill + season +
              10 * ice$weekend - 0.12 * ice$humidity + rnorm(n, 0, 7)))

g <- gam(sales ~ s(temp) + s(day) + s(humidity) + weekend, data = ice)
round(summary(g)$s.table, 3)
#>               edf Ref.df      F p-value
#> s(temp)     3.429  4.251 47.585       0
#> s(day)      8.861  8.994 55.475       0
#> s(humidity) 1.000  1.000 16.654       0
```

Look at the `edf` column, the *effective degrees of freedom*: it counts how much each smooth actually bent. Temperature spent 3.4, the seasonal `day` term spent 8.9, humidity collapsed to 1.0, a straight line. That is the penalty doing its job, buying curvature only where the data pays for it.

Now the number you set without thinking. When you write `s(day)`, `mgcv` lays down a fixed set of building-block curves, `k` of them (default `k = 10`), and one is used up to anchor the smooth, leaving a ceiling of `k - 1 = 9` on how wiggly it can get. The penalty then chooses an edf somewhere *below* that ceiling:

\[ 1 \;\le\; \mathrm{edf} \;\le\; k-1 \]

Here \(\mathrm{edf}\) is the flexibility actually used and \(k-1\) is the most on offer. An edf near 1 means the smooth barely bent (essentially a line); an edf pressed up near \(k-1\) means the penalty wanted all the flexibility you gave it, and perhaps more. Think of `k` as a credit limit and edf as the bill. Temperature's bill (3.4) sits comfortably under its limit (9): plenty of room. But look again at `day`: edf 8.9 against a ceiling of 9. That smooth spent almost every basis function it was allowed, and that is the warning sign this whole lesson is built to read.

=== step === quiz
::eyebrow Check yourself
## Read the ceiling

You fit a smooth with `s(x)`, so `mgcv` uses the default `k = 10` and the ceiling is `k' = 9`. The summary reports **edf = 8.9** for that term. What is that number telling you?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The penalty spent almost all the flexibility you allowed (edf 8.9 against a ceiling of 9), so k may be too small; raise it and check again ::ok Right. An edf sitting right against k' is the classic not-enough-room signal. The penalty would have bent the curve further if the basis had let it, so you raise k and refit to find out.
- edf 8.9 is high, so the smooth is overfitting; lower k to rein it in ::no Backwards. A high edf pressed against its ceiling means too LITTLE flexibility was on offer, not too much. Lowering k forces the curve straighter and makes an underfit worse; it does not cure an overfit.
- Nothing to worry about: edf is below k', which is all that matters ::no edf is ALWAYS below k' by construction, so "below k'" tells you nothing on its own. What matters is HOW FAR below. Sitting right up against the ceiling is precisely the case that needs a bigger k.

=== step === concept
::eyebrow The diagnostic
## gam.check: is k big enough?

Reading the edf-against-ceiling hint by eye is good instinct, but `mgcv` gives you a proper test. The function `gam.check()` does two jobs in one call: it prints a **basis-size table** telling you whether each `k` is large enough, and it draws four **residual-diagnostic plots** (we read those next). Its sister `k.check()` returns just the table, which is all we need for the first job. Because the test compares your residuals against a randomly shuffled reference, we set a seed so the numbers repeat.

```r
set.seed(1)                 # k.check uses a randomized reference; seed it for a repeatable result
round(k.check(g), 2)
#>             k'  edf k-index p-value
#> s(temp)      9 3.43    1.00    0.50
#> s(day)       9 8.86    0.98    0.33
#> s(humidity)  9 1.00    0.96    0.34
```

Four columns. `k'` is the ceiling (basis size minus the one anchoring function); `edf` is how much bent, as before. The `k-index` measures whether there is still pattern left in the residuals that a wigglier smooth could have caught: values near or above **1** are healthy, and clearly **below 1** means leftover structure the current fit is too stiff to follow. The `p-value` is a formal test of that same idea; a small one flags a smooth that is too stiff for its data.

[KEY INSIGHT]
Raise `k` when EITHER signal fires: a k-index below 1 with a small p-value, OR an edf sitting right against its `k'`. Here `day` shows the second kind: its k-index (0.98) and p-value (0.33) look calm, but edf 8.86 is glued to the ceiling of 9. That alone is reason enough to give it more room and re-check. `k` is only ever an upper bound you are testing, never a setting you trust blind.

=== step === tryit
::eyebrow Your turn
## Give the smooth more room

The `day` smooth is pinned at its ceiling (edf 8.86, k' = 9), so we cannot yet know its true shape: the penalty may be straining against a limit we set too low. Raise the basis size for the `day` term well past 9 and re-run the check. Fill in a larger `k`.

```r
g_ok <- gam(sales ~ s(temp) + s(day, k = ____) + s(humidity) + weekend,
            data = ice)
set.seed(1); round(k.check(g_ok), 2)
```
::check {"regex":"k\\s*=\\s*([2-9][0-9])","gate":true,"difficulty":"intermediate","ok":"Any generous k works. With k = 30 the day smooth spends edf 14.8 against a ceiling of 29, comfortably clear, and deviance explained rises from 83.5% to 85.3%. The ceiling really was holding it back.","no":"Set a bigger basis for the day term, for example k = 30. It must be well above the old ceiling of 9 so the penalty has room to spare."}
::solution
```r
g_ok <- gam(sales ~ s(temp) + s(day, k = 30) + s(humidity) + weekend,
            data = ice)
set.seed(1); round(k.check(g_ok), 2)
#>             k'   edf k-index p-value
#> s(temp)      9  3.40    1.01    0.54
#> s(day)      29 14.81    1.09    0.88
#> s(humidity)  9  1.00    0.96    0.34
```

With room to breathe, the `day` smooth settles at edf 14.8, well under its new ceiling of 29, and its k-index climbs to 1.09. Those extra wiggles were real seasonal structure, not noise: deviance explained rises from 83.5% to 85.3%. Temperature and humidity did not move, because they never needed more room. That is the whole loop: check, raise, re-check, until no smooth is straining against its ceiling.

=== step === widget
::eyebrow The other half of gam.check
## Reading the residual plots

Sizing `k` asks whether the curve is flexible enough. The residual plots ask a different question: are the model's *assumptions* holding? `gam.check` draws four, and the two you read first are the same ones you know from a linear model. The **residuals-versus-fitted** plot should show a formless, even band around zero: no funnel, no arc. The **Q-Q plot** should track its diagonal, telling you the residuals are roughly normal.

Toggle the three shapes below. A healthy fit scatters flat and even. A funnel means the spread grows with the prediction (non-constant variance), so the standard errors, and every p-value you just read off the summary, are wrong. A U-shaped arc means the model missed a bend, a hint that some smooth needs more room or a term is missing.

::widget residual-plot {}

For a GAM the fix usually routes back through smoothness. A leftover arc in one predictor's residuals often means its `k` is too small, exactly what `gam.check`'s basis table would also flag, so the two diagnostics agree. A funnel points somewhere else, at the scale of the response itself, a job for a different error family that the next lessons take up.

=== step === quiz
::eyebrow Check yourself
## Name the trouble

You check a fitted model and its residuals-versus-fitted plot fans open from left to right: a tight cluster at low fitted values, a wide spray at high ones. The Q-Q plot is roughly straight. What has the plot caught, and does it threaten the p-values from the summary?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A missed curve: the model needs a smooth term or a bigger k to capture a bend it is currently ignoring ::no A missed bend shows up as a U-shaped ARC in the residuals, not a fan. A widening spread is about the SIZE of the errors along the range, not a shape the mean curve failed to follow.
- Non-constant variance: the errors grow with the fitted value, so the standard errors and every p-value built on them are unreliable until you address it ::ok Right. A funnel is the signature of non-constant variance. The fitted curve itself may be fine, but the uncertainty around it is mis-stated, so the significance tests cannot be trusted as they stand. A transform or a different error family is the fix.
- Nothing: a fan is what a healthy, constant-variance residual plot looks like ::no A healthy plot is an even band of roughly constant width. A fan is the textbook picture of NON-constant variance, the opposite of what the assumptions want.

=== step === concept
::eyebrow The hidden trap
## Concurvity: collinearity for curves

There is one failure a healthy-looking fit can still hide. Suppose Priya also logs the "feels-like" temperature her weather app shows, which is really just the actual temperature nudged a little by humidity. She adds a smooth of it to the model, alongside the smooth of temperature.

```r
set.seed(7)
ice$feels_like <- ice$temp + 0.1 * ice$humidity + rnorm(n, 0, 0.5)   # the app's apparent temp
gc <- gam(sales ~ s(temp) + s(feels_like), data = ice)
round(summary(gc)$s.table, 3)
#>                 edf Ref.df      F p-value
#> s(temp)       3.144  3.908 21.129   0.000
#> s(feels_like) 1.000  1.000  0.279   0.598
```

Something looks off. Temperature is wildly significant, but `feels_like`, which we know carries almost the same information, has been flattened to a straight, insignificant line (p = 0.60). Swap the two terms' order in the formula and the roles flip. The model cannot tell the pair apart, so it hands the whole effect to one and starves the other. This is **concurvity**: the smooth-term version of the collinearity you meet with correlated predictors in ordinary regression. It happens whenever one smooth can be closely reproduced by the others.

`mgcv` measures it directly. `concurvity()` reports, for each smooth, how much of it the *other* smooths can reconstruct, on a scale from 0 (independent) to 1 (completely redundant).

```r
round(concurvity(gc, full = TRUE), 2)
#>          para s(temp) s(feels_like)
#> worst       0    0.94          0.94
#> observed    0    0.80          0.93
#> estimate    0    0.90          0.88
```

Read the `worst` row, the pessimistic upper bound (the `observed` and `estimate` rows are gentler estimates of the same thing). Both smooths score **0.94**, near the top of the scale: almost everything one curve does, the other could do too. That is why the individual shapes and p-values above are not to be trusted, and why one of the two terms should go.

=== step === quiz
::eyebrow Check yourself
## What 0.94 means

`concurvity()` reports a worst-case score of **0.94** between `s(temp)` and `s(feels_like)`. What does that tell you, and what should you do?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The two smooths carry almost the same information, so the model cannot separate their effects; their individual shapes and p-values are unreliable. Drop one, or combine them ::ok Right. Concurvity runs from 0 to 1, and 0.94 is near total overlap. Keeping both leaves you with two untrustworthy curves. Pick the one that is cheaper to measure or easier to explain, and drop the other.
- The two predictors are strongly correlated with sales, so both are clearly important and should stay ::no Concurvity measures overlap BETWEEN the smooth terms, not their correlation with the RESPONSE. A high value is a warning that the two step on each other, not a badge of importance.
- 0.94 is acceptable; concurvity only signals a real problem once it climbs past 1 ::no Concurvity is bounded between 0 and 1, so it never exceeds 1. A value near 1 IS the problem. As a rule of thumb, start worrying once the worst-case score climbs past about 0.8.

=== step === concept
::eyebrow Putting it together
## A GAM you can trust

Three checks stand between a fitted GAM and a trustworthy one. Run them in order every time:

1. **Is each `k` big enough?** Use `gam.check` / `k.check`: no smooth's edf should sit against its `k'`, and k-indices should be near 1. Raise `k` and re-check any that strain.
2. **Do the residuals behave?** The residuals-versus-fitted band is flat and even (no funnel, no arc) and the Q-Q plot tracks its line.
3. **Is concurvity low?** No smooth should be largely reconstructable from the others (worst-case well under about 0.8).

Priya's sensible model, temperature plus the seasonal day term with room to bend plus humidity, passes all three. Its `k.check` came back clean a moment ago; here is its concurvity, with the redundant `feels_like` left out.

```r
round(concurvity(g_ok, full = TRUE)["worst", ], 2)
#>        para     s(temp)      s(day) s(humidity)
#>        0.38        0.36        0.39        0.37
```

Every worst-case score sits below 0.4, comfortably clear: temperature, season and humidity each carry their own information. A sized-right, residual-clean, low-concurvity GAM is one whose bending curves you can actually read and report to Priya, which was the entire point of letting the model bend in the first place.

=== step === concept
::eyebrow Go deeper
## References

- [Simon Wood, Generalized Additive Models: An Introduction with R (2nd ed.)](https://doi.org/10.1201/9781315370279) - the definitive book, by mgcv's own author; its chapters on smoothness selection and model checking are the source for everything here.
- [mgcv reference: choosing the basis dimension k](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/choose.k.html) - the official guidance on picking k and reading the k-index test that gam.check reports.
- [mgcv reference: concurvity](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/concurvity.html) - what the measure is, how to read the worst / observed / estimate rows, and its limits.
- [Noam Ross, GAMs in R (free interactive course)](https://noamross.github.io/gams-in-r-course/) - chapter 2 walks through gam.check, basis size and concurvity with worked examples.
- [An Introduction to Statistical Learning, ch. 7 (free PDF)](https://www.statlearning.com/) - "Moving Beyond Linearity": the gentle grounding for effective degrees of freedom and how smoothness trades bias for variance.

=== step === complete
## Lesson 7 complete

Last lesson you gave Priya's regression the ability to bend; this lesson you learned to trust the bend. `k` is only a ceiling on flexibility and edf is what the penalty actually spends, so an edf pinned against its `k'` (Priya's day smooth at 8.9 of 9) means the ceiling is too low. `gam.check` and `k.check` size every `k`, and through their residual plots they check the old assumptions of constant variance and normality. And `concurvity` guards against the quiet trap of two smooths carrying the same information, which flattens one curve and makes both untrustworthy. Sized right, residual-clean, low concurvity: that is a GAM you can read out loud.

Next, Lesson 8: counts. Priya's sales are whole numbers that pile up near zero on the coldest days, and a straight-line or smooth model of them can happily predict impossible negative sales. Poisson regression, and its overdispersed cousin the negative binomial, build a GLM that respects what a count actually is.

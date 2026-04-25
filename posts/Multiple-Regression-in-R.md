---
title: "Multiple Regression in R: How to Build, Interpret, and Refine a Real Model"
slug: Multiple-Regression-in-R
description: "Build, interpret, and refine a multiple regression in R. Add predictors, read partial coefficients, test significance, and drop weak variables step by step."
keywords: "multiple regression in R, multiple linear regression R, lm() multiple predictors, partial regression coefficients, interpret regression coefficients, VIF R, dummy variables in R, model refinement R, standardized coefficients R, anova model comparison R"
auto_link_terms: "multiple regression in R|multiple linear regression|multiple regression model|partial regression coefficient|partial coefficients|interpret regression coefficients|model refinement|standardized coefficients|multiple predictors"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: "2.3.4"
post_type: C
sidebar_section: Statistics
sidebar_title: Multiple Regression
sidebar_order: 9
difficulty: Intermediate
---

# Multiple Regression in R: How to Build, Interpret, and Refine a Real Model

<p class="lead">Multiple regression in R extends <code>lm()</code> to include more than one predictor, so each coefficient measures the independent effect of its variable while holding the others constant. This lets you separate the real signal from confounders and build a model that actually generalizes.</p>

This tutorial uses base R plus a touch of `dplyr` and `ggplot2`. Every code block runs in your browser, so you can edit a formula and rerun without leaving this page.

## When does a single predictor lie to you?

Predicting `mpg` from `wt` alone on the `mtcars` dataset gives you one slope. Add `hp` and `qsec` to the model and every coefficient shifts, because each predictor now has to earn its keep after the others explain what they can. That is the whole point of multiple regression, and you can see the shift in a single `lm()` call.

Run the block below to fit a 3-predictor model on `mtcars` and read its summary table.

```r title="Fit a 3-predictor model on mtcars"
library(dplyr)

mtcars_df <- mtcars
model1 <- lm(mpg ~ wt + hp + qsec, data = mtcars_df)
summary(model1)
#> Call:
#> lm(formula = mpg ~ wt + hp + qsec, data = mtcars_df)
#>
#> Residuals:
#>    Min     1Q Median     3Q    Max
#> -3.876 -1.587 -0.591  1.522  5.731
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 27.61053    8.41993   3.279  0.00278 **
#> wt          -4.35880    0.75270  -5.791 3.22e-06 ***
#> hp          -0.01782    0.01498  -1.190  0.24418
#> qsec         0.51083    0.43922   1.163  0.25463
#>
#> Residual standard error: 2.578 on 28 degrees of freedom
#> Multiple R-squared:  0.8348,  Adjusted R-squared:  0.8171
#> F-statistic: 47.15 on 28 DF,  p-value: 4.506e-12
```

The model explains roughly 82% of the variance in fuel economy (adjusted R²). Each kilo of weight (`wt` is in thousand-pound units) drops `mpg` by about 4.4 miles per gallon, *holding hp and qsec constant*. The other two coefficients are in the right direction but their p-values say we can't distinguish them from noise once `wt` is in the model. That is already a useful real-world conclusion: when you control for weight, raw horsepower stops looking like the main mileage killer.

![Anatomy of a multiple regression formula in R](screenshots/Multiple-Regression-in-R-formula-anatomy.webp)

*Figure 1: Each term on the right-hand side of the formula contributes one partial coefficient.*

[KEY INSIGHT]
**Every coefficient in a multiple regression is a partial effect.** It estimates how the response changes per unit change in that predictor, *while every other predictor in the model is held fixed*. That word "partial" is what separates multiple regression from a stack of simple regressions.

**Try it:** Fit a model that predicts `mpg` from `wt` and `cyl` on `mtcars`. Save it to `ex_model_wt_cyl` and print the coefficient on `wt`.

```r title="Your turn: fit mpg ~ wt + cyl"
# Try it: fit a 2-predictor model on mtcars
ex_model_wt_cyl <- # your code here

coef(ex_model_wt_cyl)["wt"]
#> Expected: a number near -3.19
```

<details>
<summary>Click to reveal solution</summary>

```r title="mpg ~ wt + cyl solution"
ex_model_wt_cyl <- lm(mpg ~ wt + cyl, data = mtcars)
coef(ex_model_wt_cyl)["wt"]
#>        wt
#> -3.190972
```

**Explanation:** Once `cyl` is in the model, the `wt` coefficient shrinks from its simple-regression value of about -5.34 to about -3.19, because heavier cars also tend to have more cylinders.

</details>

## How do you read the partial coefficients?

"Holding the other predictors constant" sounds like a textbook caveat, but it is literally the mechanism that changes the numbers. Fit the same predictor on its own and again with another predictor next to it, and the coefficient will shift whenever the two predictors share information.

```r title="Compare simple vs two-predictor coefficients"
model_wt    <- lm(mpg ~ wt,        data = mtcars_df)
model_wt_hp <- lm(mpg ~ wt + hp,   data = mtcars_df)

coef(model_wt)
#> (Intercept)          wt
#>    37.28513    -5.34447

coef(model_wt_hp)
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295
```

The slope on `wt` collapsed from -5.34 to -3.88 once `hp` joined the model. That happened because heavier cars tend to have more horsepower, so the simple model was crediting `wt` for an effect that really came from both. Multiple regression splits the credit. This is the partial-coefficient idea in action and the reason you cannot interpret coefficients in isolation.

Once you trust the model, you can use it to predict `mpg` for a new car. `predict()` gives you the point estimate; passing `interval = "confidence"` adds a confidence band for the *mean* response at that combination of inputs.

```r title="Predict with a confidence interval"
new_car <- data.frame(wt = 3.0, hp = 100, qsec = 17.0)
preds <- predict(model1, newdata = new_car, interval = "confidence")
preds
#>        fit      lwr      upr
#> 1 21.34069 19.83928 22.84211
```

The model expects a car with these specs to deliver about 21.3 mpg, and we are 95% confident the *average* mpg for cars with this profile lies between roughly 19.8 and 22.8.

[NOTE]
**Confidence intervals and prediction intervals answer different questions.** A confidence interval covers uncertainty in the *mean* response at given predictor values; a prediction interval (use `interval = "prediction"`) covers uncertainty for a *single new observation* and is always wider.

**Try it:** Fit `mpg ~ qsec` and then `mpg ~ qsec + wt` on `mtcars`. Compare the `qsec` coefficient in the two fits.

```r title="Your turn: how does qsec change?"
# Try it: refit with and without wt
ex_qsec_only <- # your code here
ex_qsec_wt   <- # your code here

c(simple = coef(ex_qsec_only)["qsec"], with_wt = coef(ex_qsec_wt)["qsec"])
#> Expected: simple is positive (~+1.4), with_wt is much smaller
```

<details>
<summary>Click to reveal solution</summary>

```r title="qsec coefficient comparison solution"
ex_qsec_only <- lm(mpg ~ qsec, data = mtcars)
ex_qsec_wt   <- lm(mpg ~ qsec + wt, data = mtcars)

c(simple = coef(ex_qsec_only)["qsec"],
  with_wt = coef(ex_qsec_wt)["qsec"])
#>  simple.qsec with_wt.qsec
#>     1.412125     0.918656
```

**Explanation:** Quarter-mile time `qsec` looks like it adds about 1.4 mpg per second on its own, but most of that "effect" was really weight in disguise. Adding `wt` shrinks the partial coefficient on `qsec` to about 0.9.

</details>

## How do you tell which predictors actually matter?

The summary table from `lm()` is built for this question. Read it column by column: **Estimate** is the coefficient, **Std. Error** is its standard error, **t value** is Estimate ÷ Std. Error, and **Pr(>|t|)** is the p-value testing whether the true coefficient is zero. Stars are a quick visual cue for that p-value.

For machine-readable output, pull just the coefficient table and add `confint()` to bracket each estimate with a 95% confidence interval.

```r title="Coefficient table with confidence intervals"
summary(model1)$coefficients
#>                Estimate  Std. Error    t value     Pr(>|t|)
#> (Intercept) 27.61053267  8.41993406  3.2792863 2.775702e-03
#> wt          -4.35879720  0.75270213 -5.7908240 3.219528e-06
#> hp          -0.01782227  0.01498367 -1.1894364 2.441819e-01
#> qsec         0.51083369  0.43922248  1.1630416 2.546286e-01

confint(model1)
#>                   2.5 %     97.5 %
#> (Intercept) 10.36202449 44.8590409
#> wt          -5.90065111 -2.8169433
#> hp          -0.04851447  0.0128699
#> qsec        -0.38887293  1.4105403
```

Two things to read at a glance: only `wt`'s confidence interval excludes zero, which is why only `wt` is statistically significant. The intervals for `hp` and `qsec` straddle zero, which is the same story the p-value told you. The bottom line of the full `summary()`, the F-statistic, asks a different question: is the *whole model* better than an intercept-only model? Here the F p-value is essentially zero, so the model as a whole is useful even though two of its three predictors aren't pulling weight individually.

Fit a wider model and you can find a predictor that fails the test outright.

```r title="Spot a non-significant predictor in a wider model"
model_full <- lm(mpg ~ wt + hp + qsec + drat + gear, data = mtcars_df)
round(summary(model_full)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  16.5367    14.8492  1.1136   0.2756
#> wt           -3.8957     1.0617 -3.6692   0.0011
#> hp           -0.0205     0.0156 -1.3120   0.2012
#> qsec          0.7113     0.4828  1.4733   0.1527
#> drat          1.0698     1.5658  0.6832   0.5005
#> gear          0.6500     1.3724  0.4736   0.6396
```

`drat` and `gear` both have p-values around 0.5–0.6 and tiny t-values, which makes them the obvious candidates to drop.

[WARNING]
**Statistical significance is not the same as practical importance.** A predictor with a t-value of 6 can still move the response by a microscopic amount, and a noisy predictor with p = 0.10 might actually be the one that drives the business decision. Always read the *size* of the coefficient (in its real units) alongside its p-value.

**Try it:** Print the names of predictors in `model_full` whose p-value is below 0.05.

```r title="Your turn: list significant predictors"
# Try it: extract significant predictors from model_full
ex_pvals <- summary(model_full)$coefficients[, "Pr(>|t|)"]
ex_sig   <- # your code here

ex_sig
#> Expected: only "wt"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Significant predictors solution"
ex_pvals <- summary(model_full)$coefficients[, "Pr(>|t|)"]
ex_sig   <- names(ex_pvals)[ex_pvals < 0.05 & names(ex_pvals) != "(Intercept)"]
ex_sig
#> [1] "wt"
```

**Explanation:** Only `wt` clears the 0.05 threshold. We exclude `(Intercept)` because we don't usually treat its p-value as a "predictor matters" question.

</details>

## How do you add categorical predictors (factors)?

Categorical variables enter the formula as factors. R automatically expands a factor with k levels into k-1 dummy variables. Each dummy's coefficient is the average difference from the *reference level*, holding the other predictors constant.

Start with `am`, which is 0 (automatic) or 1 (manual) in `mtcars`. Convert it to a factor inline so R treats it categorically rather than numerically.

```r title="Fit a model with a 2-level factor"
model_am <- lm(mpg ~ wt + factor(am), data = mtcars_df)
round(summary(model_am)$coefficients, 4)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   37.3216     3.0546 12.2180   0.0000
#> wt            -5.3528     0.7882 -6.7910   0.0000
#> factor(am)1   -0.0236     1.5456 -0.0153   0.9879
```

The intercept is the predicted `mpg` for an automatic car with `wt = 0`, which is a useful anchor even though no real car weighs zero. `factor(am)1` is the average bump for *manual* cars over automatics at the same weight, which here is essentially zero. The data is telling you that once you control for weight, transmission stops mattering, even though raw `mpg` differs noticeably between manuals and automatics.

A factor with three or more levels produces multiple dummies, one per non-reference level.

```r title="Fit a model with a 3-level factor"
model_cyl <- lm(mpg ~ wt + factor(cyl), data = mtcars_df)
round(summary(model_cyl)$coefficients, 4)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   33.9908     1.8878 18.0058   0.0000
#> wt            -3.2056     0.7539 -4.2519   0.0002
#> factor(cyl)6  -4.2556     1.3861 -3.0701   0.0048
#> factor(cyl)8  -6.0709     1.6523 -3.6741   0.0010
```

The reference level is 4-cylinder (the lowest level by default). `factor(cyl)6` says a 6-cylinder car gets about 4.3 mpg less than a 4-cylinder car *at the same weight*. The 8-cylinder penalty is even larger at about 6.1 mpg.

[NOTE]
**The reference level is the first factor level alphabetically or numerically.** Use `relevel(factor(x), ref = "...")` or `factor(x, levels = c(...))` to make a different level the reference. The fitted values don't change; only the labels and meanings of the dummy coefficients do.

```r title="Change the reference level with relevel()"
model_cyl_8 <- lm(mpg ~ wt + relevel(factor(cyl), ref = "8"), data = mtcars_df)
round(summary(model_cyl_8)$coefficients, 4)
#>                                    Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                         27.9199     1.8460 15.1248   0.0000
#> wt                                  -3.2056     0.7539 -4.2519   0.0002
#> relevel(factor(cyl), ref = "8")4     6.0709     1.6523  3.6741   0.0010
#> relevel(factor(cyl), ref = "8")6     1.8153     1.4286  1.2706   0.2145
```

Now the dummies measure how much *better* a 4- or 6-cylinder car is than an 8-cylinder car at the same weight. The 6.07 mpg gain for 4-cylinder over 8-cylinder is exactly the mirror image of the -6.07 you saw before; the model is the same fit, just relabeled.

**Try it:** Fit `mpg ~ wt + factor(cyl)` after re-leveling so `"6"` is the reference. Save the fit to `ex_cyl_ref6` and print its coefficient names.

```r title="Your turn: relevel cyl to 6 as reference"
# Try it: change reference level to 6 cylinders
ex_cyl_ref6 <- # your code here

names(coef(ex_cyl_ref6))
#> Expected: dummies for "4" and "8" but no "6"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Relevel cyl to 6 solution"
ex_cyl_ref6 <- lm(mpg ~ wt + relevel(factor(cyl), ref = "6"), data = mtcars)
names(coef(ex_cyl_ref6))
#> [1] "(Intercept)"
#> [2] "wt"
#> [3] "relevel(factor(cyl), ref = \"6\")4"
#> [4] "relevel(factor(cyl), ref = \"6\")8"
```

**Explanation:** With 6-cylinder as the baseline, R generates dummies for 4 and 8 only.

</details>

## How do you refine the model by dropping weak predictors?

A clean refinement workflow beats blind stepwise selection. The recipe: fit the wide model, drop the predictor with the highest p-value, refit, and check that adjusted R² did not drop in any meaningful way. Repeat until every survivor is justified.

![Model refinement workflow](screenshots/Multiple-Regression-in-R-refinement-workflow.webp)

*Figure 2: Drop the predictor with the highest p-value, refit, and watch adjusted R² before committing.*

Recall `model_full` from earlier had `gear` with the largest p-value. Drop it and compare.

```r title="Drop the weakest predictor and refit"
model_step1 <- lm(mpg ~ wt + hp + qsec + drat, data = mtcars_df)

c(full   = summary(model_full)$adj.r.squared,
  step1  = summary(model_step1)$adj.r.squared)
#>      full     step1
#> 0.8079997 0.8137327
```

Adjusted R² actually went *up* slightly (0.808 to 0.814). That is the signal that `gear` was hurting more than it helped; once it leaves, the remaining predictors absorb its variance more efficiently. Now you can compare the two models formally with `anova()`.

```r title="Compare nested models with anova()"
anova(model_step1, model_full)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + hp + qsec + drat
#> Model 2: mpg ~ wt + hp + qsec + drat + gear
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     27 168.41
#> 2     26 166.95  1     1.461 0.2275 0.6373
```

The F-test compares the residual sum of squares between the two nested models. A p-value of 0.64 means the wider model does not fit significantly better, so dropping `gear` was the right call.

[TIP]
**Theory beats automated stepwise selection.** Functions like `step()` will happily drop or keep variables based purely on AIC, but that ignores domain knowledge. Drop a variable only when (a) it is statistically weak *and* (b) you cannot defend keeping it on theoretical grounds. A noisy variable that is theoretically central to your question stays in.

**Try it:** Drop the next-weakest predictor from `model_step1` and store the result as `ex_step2`. Compare adjusted R² to `model_step1`.

```r title="Your turn: drop one more predictor"
# Try it: continue refining
ex_step2 <- # your code here

c(step1 = summary(model_step1)$adj.r.squared,
  step2 = summary(ex_step2)$adj.r.squared)
#> Expected: step2 is similar to step1 (within ~0.01)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop next-weakest predictor solution"
# In model_step1, drat had the largest p-value
ex_step2 <- lm(mpg ~ wt + hp + qsec, data = mtcars)

c(step1 = summary(model_step1)$adj.r.squared,
  step2 = summary(ex_step2)$adj.r.squared)
#>     step1     step2
#> 0.8137327 0.8170643
```

**Explanation:** `drat` had the largest p-value in `model_step1`, so it goes next. Adjusted R² nudges up again, confirming the drop was free. We have circled back to the original `model1` from the first section, by the way.

</details>

## How do you rank predictor importance with standardized coefficients?

Raw coefficients live in different units. `wt` is in thousands of pounds, `hp` is in horsepower, `qsec` is in seconds. You cannot compare -4.4 (per 1000 lb) to -0.018 (per horsepower) and conclude one matters more. To rank importance, put every predictor (and the response) on a common scale by standardizing them: subtract the mean and divide by the standard deviation. Now every coefficient is in standard-deviation units.

```r title="Fit a model on standardized predictors"
mtcars_scaled <- as.data.frame(scale(mtcars_df))
model_std <- lm(mpg ~ wt + hp + qsec, data = mtcars_scaled)
round(coef(model_std), 4)
#> (Intercept)          wt          hp        qsec
#>      0.0000     -0.6611     -0.1402      0.1230
```

The intercept is exactly zero (a side effect of standardizing) and the partial coefficients are now directly comparable. A 1-SD increase in `wt` drops `mpg` by about 0.66 SD, *holding hp and qsec constant*. By absolute value, `wt` is roughly 5 times more impactful than `hp` and 5 times more than `qsec`. That is the kind of comparison the unscaled model cannot give you.

**Try it:** Standardize `mtcars` and rank the three predictors `wt`, `hp`, `qsec` by the absolute value of their standardized coefficients.

```r title="Your turn: rank predictors by standardized coefficient"
# Try it: produce a ranked vector
ex_scaled <- as.data.frame(scale(mtcars))
ex_model  <- # your code here
ex_ranked <- # your code here (sort by |coef|, exclude intercept)

ex_ranked
#> Expected: wt first, then qsec, then hp (or wt, hp, qsec, order of last two close)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rank by standardized coefficient solution"
ex_scaled <- as.data.frame(scale(mtcars))
ex_model  <- lm(mpg ~ wt + hp + qsec, data = ex_scaled)
coefs     <- coef(ex_model)[-1]
ex_ranked <- sort(abs(coefs), decreasing = TRUE)
ex_ranked
#>        wt        hp      qsec
#> 0.6611 0.1402 0.1230
```

**Explanation:** Sorting by absolute value gives `wt` clearly on top, then `hp` and `qsec` close together. In a real report you would round these to two decimals and present them as a horizontal bar chart.

</details>

## How do you add interaction effects?

So far every coefficient has measured an effect that is the same at every level of every other predictor. Sometimes that assumption is wrong. The slope of `mpg` on `wt` may genuinely differ between automatic and manual cars; that is what an *interaction* captures.

Use `*` in the formula to fit both main effects and the interaction in one shot. `wt * factor(am)` is shorthand for `wt + factor(am) + wt:factor(am)`.

```r title="Fit an interaction between wt and transmission"
model_int <- lm(mpg ~ wt * factor(am), data = mtcars_df)
round(summary(model_int)$coefficients, 4)
#>                 Estimate Std. Error t value Pr(>|t|)
#> (Intercept)      31.4161     3.0201 10.4023   0.0000
#> wt               -3.7859     0.7858 -4.8181   0.0000
#> factor(am)1      14.8784     4.2640  3.4892   0.0016
#> wt:factor(am)1   -5.2984     1.4447 -3.6675   0.0010
```

Read the rows like this. For automatic cars (`am = 0`), the slope of `mpg` on `wt` is the bare `wt` coefficient: -3.79. For manual cars (`am = 1`), the slope is `-3.79 + (-5.30) = -9.09`. In other words, manuals lose mileage much faster as they get heavier than automatics do. Both effects are statistically significant, with p-values well under 0.01.

A picture makes this concrete. Color points by transmission and let `ggplot2` fit a separate line per group.

```r title="Visualize the interaction with ggplot2"
library(ggplot2)

ggplot(mtcars_df, aes(x = wt, y = mpg, color = factor(am))) +
  geom_point(size = 2.5) +
  geom_smooth(method = "lm", se = FALSE) +
  scale_color_manual(values = c("0" = "#4C72B0", "1" = "#DD8452"),
                     labels = c("automatic", "manual"),
                     name = "transmission") +
  labs(x = "weight (1000 lb)", y = "mpg",
       title = "wt:am interaction, slopes differ by transmission") +
  theme_minimal()
```

The two regression lines visibly cross. Light cars do better with a manual transmission, heavy cars do better with an automatic. That crossover is the practical meaning of a significant interaction term, and it is the sort of insight a "no-interaction" multiple regression would miss entirely.

[KEY INSIGHT]
**An interaction term encodes "the effect of X on Y depends on Z."** When the interaction p-value is significant, you cannot describe X's effect in a single number. You have to report it conditional on the other predictor (e.g., "the wt slope is -3.8 for automatics and -9.1 for manuals").

**Try it:** Without re-fitting, write the slope of `mpg` on `wt` for *manual* cars implied by `model_int`.

```r title="Your turn: read the manual-car slope"
# Try it: combine main effect + interaction
ex_main_wt   <- coef(model_int)["wt"]
ex_int_wt_am <- coef(model_int)["wt:factor(am)1"]
ex_manual_slope <- # your code here

ex_manual_slope
#> Expected: about -9.08
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual-car slope solution"
ex_main_wt   <- coef(model_int)["wt"]
ex_int_wt_am <- coef(model_int)["wt:factor(am)1"]
ex_manual_slope <- ex_main_wt + ex_int_wt_am
ex_manual_slope
#>        wt
#> -9.084268
```

**Explanation:** For manual cars (`am = 1`), the slope of `mpg` on `wt` equals the main effect of `wt` *plus* the interaction term. For automatic cars (`am = 0`) the interaction term drops out and the slope is just the main effect.

</details>

## Practice Exercises

These capstone exercises mix multiple ideas from the tutorial. They use the prefix `my_` to keep them isolated from the tutorial state above.

### Exercise 1: Refine a 4-predictor model on mtcars

Fit a multiple regression of `mpg` on `wt`, `hp`, `disp`, and `drat` using `mtcars`. Drop the least significant predictor one at a time until every survivor has p < 0.10. Save the final model to `my_final_model`.

```r title="Exercise 1: refine to p < 0.10"
# Exercise 1: refine until every predictor has p < 0.10
# Hint: fit the wide model, then drop the worst offender, refit, repeat

my_final_model <- # your code here

summary(my_final_model)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
# Step 1: fit wide model
my_wide <- lm(mpg ~ wt + hp + disp + drat, data = mtcars)
round(summary(my_wide)$coefficients[, "Pr(>|t|)"], 3)
#> (Intercept)          wt          hp        disp        drat
#>       0.000       0.001       0.022       0.929       0.633

# disp has the largest p-value, drop it
my_step1 <- lm(mpg ~ wt + hp + drat, data = mtcars)
round(summary(my_step1)$coefficients[, "Pr(>|t|)"], 3)
#> (Intercept)          wt          hp        drat
#>       0.000       0.000       0.014       0.560

# drat is now the worst, drop it
my_final_model <- lm(mpg ~ wt + hp, data = mtcars)
round(summary(my_final_model)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2273     1.5988 23.2847   0.0000
#> wt           -3.8778     0.6327 -6.1289   0.0000
#> hp           -0.0318     0.0090 -3.5187   0.0015
```

**Explanation:** `disp` and `drat` carry information that overlaps too much with `wt` and `hp` to add anything once those two are in the model. The clean final model has just `wt` and `hp`.

</details>

### Exercise 2: Test whether species adds predictive value on iris

Using the `iris` dataset, fit `Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width` (call it `my_no_species`) and `Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width + Species` (call it `my_with_species`). Compare them with `anova()` and decide whether species contributes beyond the other predictors.

```r title="Exercise 2: does species add value?"
# Exercise 2: test whether species contributes beyond Sepal.Width, Petal.Length, Petal.Width
my_no_species   <- # your code here
my_with_species <- # your code here

anova(my_no_species, my_with_species)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_no_species   <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width,
                      data = iris)
my_with_species <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width + Species,
                      data = iris)

anova(my_no_species, my_with_species)
#> Analysis of Variance Table
#>
#> Model 1: Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width
#> Model 2: Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width + Species
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)
#> 1    146 14.445
#> 2    144 13.556  2   0.88905 4.7211 0.01036
```

**Explanation:** The F-test is significant at p ≈ 0.01, so the model *with* species fits significantly better than the one without. Species adds predictive information beyond what the three flower measurements already supply.

</details>

### Exercise 3: Read the per-cylinder slope from an interaction

Fit `mpg ~ wt * factor(cyl)` on `mtcars`. Save the model to `my_cyl_int`. Report the wt slope separately for 4-, 6-, and 8-cylinder cars by combining the main effect with the relevant interaction term.

```r title="Exercise 3: per-cylinder wt slope"
# Exercise 3: extract wt slope per cylinder group
my_cyl_int <- # your code here

# main effect plus the appropriate interaction
my_slopes <- # your code here  # named vector with slopes for cyl 4, 6, 8

my_slopes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_cyl_int <- lm(mpg ~ wt * factor(cyl), data = mtcars)
co <- coef(my_cyl_int)

my_slopes <- c(
  cyl4 = co["wt"],
  cyl6 = co["wt"] + co["wt:factor(cyl)6"],
  cyl8 = co["wt"] + co["wt:factor(cyl)8"]
)
unname(round(my_slopes, 3))
#> [1] -5.647 -2.780 -2.193
```

**Explanation:** 4-cylinder cars lose 5.6 mpg per 1000 lb of extra weight, 6-cylinder cars lose 2.8, and 8-cylinder cars lose 2.2. Heavier cylinder counts already have heavier engines, so each additional pound of body weight matters less in relative terms. The interaction term is doing real work here.

</details>

## Putting It All Together

This walkthrough builds a multiple regression on `mtcars` end to end: fit a wide model, prune it down, standardize to rank importance, and add an interaction where the data calls for one. Each step uses only ideas covered above.

```r title="End-to-end workflow step 1: fit a wide model"
my_model_wide <- lm(mpg ~ wt + hp + qsec + drat + gear + carb, data = mtcars_df)
round(summary(my_model_wide)$coefficients[, c("Estimate", "Pr(>|t|)")], 4)
#>             Estimate Pr(>|t|)
#> (Intercept)  17.0307   0.2799
#> wt           -3.7765   0.0040
#> hp           -0.0237   0.2042
#> qsec          0.6803   0.1851
#> drat          0.6997   0.6605
#> gear          0.7780   0.5759
#> carb         -0.1949   0.7782
```

Three weak candidates jump out: `drat`, `gear`, and `carb` all have p-values above 0.5. Drop the worst, refit, repeat.

```r title="Step 2: drop weakest predictors one at a time"
my_model_mid <- lm(mpg ~ wt + hp + qsec, data = mtcars_df)
round(summary(my_model_mid)$coefficients[, c("Estimate", "Pr(>|t|)")], 4)
#>             Estimate Pr(>|t|)
#> (Intercept)  27.6105   0.0028
#> wt           -4.3588   0.0000
#> hp           -0.0178   0.2442
#> qsec          0.5108   0.2546

c(wide = summary(my_model_wide)$adj.r.squared,
  mid  = summary(my_model_mid)$adj.r.squared)
#>      wide       mid
#> 0.7919388 0.8170643
```

After three drops we are back to the model from section 1, with adjusted R² up to 0.817. `wt` is the only predictor with p < 0.05, but `hp` and `qsec` are theoretically defensible (engine power and acceleration matter for fuel economy), so keep them. Now standardize to compare their importance.

```r title="Step 3: standardize and rank importance"
mtcars_scaled <- as.data.frame(scale(mtcars_df))
my_final <- lm(mpg ~ wt + hp + qsec, data = mtcars_scaled)
my_ranked <- sort(abs(coef(my_final)[-1]), decreasing = TRUE)
round(my_ranked, 3)
#>    wt    hp  qsec
#> 0.661 0.140 0.123
```

`wt` is roughly 5 times more impactful than the other two on a standardized basis. Finally, ask whether the relationship between `wt` and `mpg` actually depends on transmission type by adding an interaction.

```r title="Step 4: check for an interaction with transmission"
my_int <- lm(mpg ~ wt * factor(am) + hp + qsec, data = mtcars_df)
round(summary(my_int)$coefficients, 4)
#>                 Estimate Std. Error t value Pr(>|t|)
#> (Intercept)      14.6710     6.7311  2.1798   0.0385
#> wt               -2.4399     0.7886 -3.0941   0.0046
#> factor(am)1      11.9416     2.7727  4.3068   0.0002
#> hp               -0.0246     0.0102 -2.4007   0.0238
#> qsec              0.7770     0.3273  2.3736   0.0252
#> wt:factor(am)1   -4.1397     1.0245 -4.0407   0.0004
```

The interaction term `wt:factor(am)1` is highly significant, so transmission really does change the slope of `mpg` on `wt` even after controlling for `hp` and `qsec`. The full story now reads: weight is the dominant driver of fuel economy, horsepower and quarter-mile time contribute smaller but real effects, and that weight effect is much steeper for manuals than automatics. That is a more complete and more useful answer than the original "wt is significant" you would have gotten from a simple regression.

## Summary

![Multiple regression in R, core concepts](screenshots/Multiple-Regression-in-R-overview-mindmap.webp)

*Figure 3: The five moves that turn an `lm()` call into a trustworthy multiple regression.*

The five moves you now know:

1. **Build with `lm()`.** Use formula syntax `y ~ x1 + x2 + x3` and pass the data frame.
2. **Read coefficients as partial effects.** Each coefficient is the effect of its predictor *holding all the others fixed*; the same variable's coefficient will shift as you add or drop other predictors.
3. **Decode `summary()`.** Look at coefficient size, p-value, adjusted R², and the F-statistic at the bottom for overall model significance.
4. **Handle factors and interactions.** Convert categorical predictors with `factor()`; use `*` for interactions when one predictor's effect plausibly depends on another.
5. **Refine deliberately.** Drop the highest-p-value predictor first, refit, watch adjusted R², and use `anova()` to formally compare nested models. Standardize to rank importance.

## References

1. James, G., Witten, D., Hastie, T., & Tibshirani, R., *An Introduction to Statistical Learning*, 2nd Edition. Chapter 3: Linear Regression. [Link](https://www.statlearning.com/)
2. Wickham, H., & Grolemund, G., *R for Data Science*, 2nd Edition. Chapter on Model building. [Link](https://r4ds.hadley.nz/)
3. R Core Team, `lm()` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
4. Dalgaard, P., *Introductory Statistics with R*, 2nd Edition. Chapter 11: Multiple regression. Springer.
5. Venables, W. N., & Ripley, B. D., *Modern Applied Statistics with S* (MASS), 4th Edition. Chapter 6: Linear statistical models. Springer.
6. Kutner, M. H., Nachtsheim, C. J., & Neter, J., *Applied Linear Regression Models*, 4th Edition. Chapters 6–7. McGraw-Hill.
7. UCLA Office of Advanced Research Computing, Regression with R. [Link](https://stats.oarc.ucla.edu/r/dae/)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the single-predictor foundation that multiple regression generalizes.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), every diagnostic check your multiple regression model still needs.
- [Logistic Regression in R](Logistic-Regression-With-R.html), when the response variable is binary instead of continuous.

---
title: "Linear Regression Exercises in R: 15 Practice Problems with Solutions"
slug: Linear-Regression-Exercises-in-R
description: "15 linear regression exercises in R with full runnable solutions: fit lm(), interpret coefficients, check assumptions, predict new data, compare models."
keywords: "linear regression exercises in R, lm() practice problems, R regression exercises, linear regression solutions R, fit linear model R, regression diagnostics exercises, multiple regression exercises, linear regression problems with solutions"
auto_link_terms: "linear regression exercises|linear regression practice problems|linear regression problems|linear regression solutions|linear regression practice in R|lm() exercises"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-26
curriculum_id: E6.1
post_type: EX
sidebar_section: "Practice Exercises"
sidebar_title: "Linear Regression (15 problems)"
fr_parent: Simple-Linear-Regression-in-R.html
difficulty: Intermediate
---

# Linear Regression Exercises in R: 15 Practice Problems with Solutions

<p class="lead">These 15 linear regression exercises in R walk you from a one-line <code>lm()</code> fit to multiple predictors, diagnostic checks, and prediction intervals, with full runnable solutions so you can build reliable regression habits in one sitting.</p>

Every problem uses base R or built-in datasets like `mtcars`, `cars`, and `iris`, so you can run each block right in the page and tweak the inputs without leaving this tab.

## What does a complete linear regression workflow look like in R?

Every exercise below is one stop on the same three-step loop: fit, interpret, check. You build a model with `lm()`, you read its numbers with `summary()`, and you verify its assumptions with residual plots. Before the fifteen problems, here is that loop end-to-end in one block so the moving parts are concrete. Everything after this reuses the same function family, with one extra knob per exercise.

```r title="Fit, interpret, check on mtcars"
# Fit a one-predictor linear regression
wt_fit <- lm(mpg ~ wt, data = mtcars)

# Interpret: coefficients and overall fit
coef(wt_fit)
#> (Intercept)          wt
#>  37.285126   -5.344472

summary(wt_fit)$r.squared
#> [1] 0.7528328

# Check: residuals vs fitted (assumption: no pattern)
plot(wt_fit, which = 1)
```

Three lines do the work. The intercept of `37.29` is the predicted `mpg` when `wt = 0` (a fictional zero-weight car, useful as a math anchor, not a physical claim). The slope of `-5.34` says each extra 1,000 lb of weight subtracts about 5.3 mpg. The R² of `0.75` says weight alone explains roughly 75% of the variation in fuel economy across these 32 cars. The residuals-vs-fitted plot is your assumption check: if you see a clear curve or fan, the linear form is wrong, even when R² looks good.

| `summary(model)` field | What it tells you |
|---|---|
| `Estimate` | The fitted coefficient ($\hat\beta_j$) for that predictor |
| `Std. Error` | Sampling uncertainty around the coefficient |
| `t value` | `Estimate / Std. Error`, the test statistic for $H_0: \beta_j = 0$ |
| `Pr(>|t|)` | Two-sided p-value for that t-test |
| `Multiple R-squared` | Share of variance in $y$ explained by the model |
| `Adjusted R-squared` | R² penalised for each added predictor |
| `F-statistic` | Joint test that all slopes are zero (model vs intercept-only) |

[KEY INSIGHT]
**Every regression number in R is a transformation of fitted values and residuals.** R², the F-statistic, t-tests, and confidence intervals all flow from the same two vectors: `fitted(model)` and `residuals(model)`. Once you understand that pair, the rest of the output stops feeling like magic.

**Try it:** Fit a linear regression of stopping distance on speed using the built-in `cars` dataset. Save the model to `ex_fit` and print its coefficients. The intercept will look surprising, and that is the lesson.

```r title="Your turn: fit dist on speed"
# Fit lm(dist ~ speed, data = cars), save to ex_fit
ex_fit <- # your code here

# Print coefficients
coef(ex_fit)
#> Expected: (Intercept)  speed
#>           ~ -17.6      ~ 3.93
```

<details>
<summary>Click to reveal solution</summary>

```r title="cars dist ~ speed solution"
ex_fit <- lm(dist ~ speed, data = cars)
coef(ex_fit)
#> (Intercept)       speed
#>  -17.579095    3.932409
```

**Explanation:** The negative intercept, `-17.6` ft, has no physical meaning, a car at 0 mph stops in 0 ft, not negative ft. It is just the math intercept of the best straight line fit through the data range, where `speed` ranges from 4 to 25 mph. The slope of `3.93` is the meaningful number: each extra mph of speed adds about 3.9 ft of stopping distance.

</details>

## How do you read the numbers inside summary(lm())?

The `summary()` output of an `lm` model is a dashboard, not a paragraph. It has five regions, each answering a different question, and reading them in order keeps you from cherry-picking the friendly numbers and missing the warning ones. This block reuses `wt_fit` from above so you can look at one familiar fit instead of meeting a new one.

```r title="Unpack summary(wt_fit)"
summary(wt_fit)
#>
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -4.5432 -2.3647 -0.1252  1.4096  6.8727
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2851     1.8776  19.858  < 2e-16 ***
#> wt           -5.3445     0.5591  -9.559 1.29e-10 ***
#>
#> Residual standard error: 3.046 on 30 degrees of freedom
#> Multiple R-squared:  0.7528, Adjusted R-squared:  0.7446
#> F-statistic: 91.38 on 1 and 30 DF,  p-value: 1.294e-10
```

Read it top to bottom. The **Residuals** quartile summary should look symmetric around zero, which it roughly does here. The **Coefficients** table tells you the slope of `wt` is `-5.34` with a standard error of `0.56`, giving a t-statistic of `-9.56` and a p-value far below `0.05`, strong evidence the slope is not zero. The **Residual standard error** of `3.05` is the typical size of a prediction error in mpg units. **R² of `0.75`** says the model explains 75% of mpg variance. The **F-statistic** of `91.4` with p ≈ `1e-10` is the global test that some slope is non-zero, useful in multi-predictor models where individual t-tests can mislead.

| Common misreading | Reality |
|---|---|
| "R² is low so the model is useless" | A low R² can still beat the no-predictor baseline; pair it with the F-test and residuals |
| "p < 0.05 means the effect is large" | The p-value is about evidence the slope ≠ 0, not about effect size; read the `Estimate` for size |
| "The intercept must be physically interpretable" | Often the intercept is just a math anchor outside the data range |

[WARNING]
**With correlated predictors, individual t-tests can flip while the F-test stays significant.** When `hp` and `cyl` move together in `mtcars`, adding both to a model can make each one look insignificant on its own t-test even though the overall F-test is highly significant. Read the F-statistic before you delete predictors based on a single p-value.

**Try it:** Pull just the adjusted R² from `ex_fit` (the cars model). Use `summary(ex_fit)$adj.r.squared`. The single number is what you would report when comparing this model to a richer one.

```r title="Your turn: extract adjusted R-squared"
# Extract adjusted R-squared from ex_fit
ex_adj_r2 <- # your code here

ex_adj_r2
#> Expected: about 0.644
```

<details>
<summary>Click to reveal solution</summary>

```r title="adj R-squared from ex_fit"
ex_adj_r2 <- summary(ex_fit)$adj.r.squared
ex_adj_r2
#> [1] 0.6438102
```

**Explanation:** `summary(model)` returns a list with `r.squared` and `adj.r.squared` as named elements. Adjusted R² penalises each added predictor; for one predictor on 50 rows the penalty is small, so the adjusted (`0.644`) is only slightly below the multiple R² (`0.651`). Always report adjusted R² when comparing models with different predictor counts.

</details>

## What changes when you move from one predictor to many?

A simple regression has one slope. A multiple regression has one slope per predictor, and each slope means something subtly different: the change in $y$ for a one-unit change in that predictor *while every other predictor is held constant*. That conditioning is the source of most multiple-regression confusion. The clearest way to see it is to fit a simple model and a multiple model on the same data and compare the slope of the shared predictor.

```r title="Simple vs multiple regression on mtcars"
# Multiple regression: predict mpg from weight, horsepower, and cylinders
mt_multi <- lm(mpg ~ wt + hp + cyl, data = mtcars)
coef(mt_multi)
#> (Intercept)          wt          hp         cyl
#>  38.7517874  -3.1669731  -0.0180381  -0.9416168

# Simple regression slope of wt was -5.34; multiple slope is -3.17
coef(wt_fit)["wt"]
#>        wt
#> -5.344472
```

The slope of `wt` shrank from `-5.34` (alone) to `-3.17` (with `hp` and `cyl` controlled). That is not a contradiction. Some of the apparent effect of weight in the simple model was actually weight standing in for engine size: heavy cars also tend to have more cylinders and more horsepower. Once `hp` and `cyl` are in the model, weight only gets credit for the variation that is *unique* to it. This is the partial-effect interpretation in one picture.

Interaction terms add another layer: instead of asking "what is the effect of weight?", you ask "does the effect of weight depend on the value of another predictor?". The `*` operator in a formula expands to "main effects plus interaction" automatically.

```r title="Interaction: does mpg slope of wt depend on transmission?"
mt_inter <- lm(mpg ~ wt * am, data = mtcars)
coef(mt_inter)
#> (Intercept)          wt          am       wt:am
#>   31.416055   -3.785908   14.878422   -5.298360

# Slope of wt for automatic cars (am = 0): -3.79
# Slope of wt for manual cars   (am = 1): -3.79 + (-5.30) = -9.08
```

The model says weight hurts manual transmissions more than automatics: each extra 1,000 lb subtracts `3.8` mpg from an automatic but `9.1` mpg from a manual. That is what the interaction coefficient is doing: it modifies the slope of `wt` by `-5.30` whenever `am = 1`. If the interaction were not significant, you would drop the `*` and use `+` instead.

[TIP]
**Use update() to add or drop predictors without retyping the formula.** Once you have a base fit, `mt_step <- update(wt_fit, . ~ . + hp + cyl)` adds two predictors and `update(mt_multi, . ~ . - cyl)` drops one. The dot reads as "keep what was on this side." Cleaner than copy-pasting the formula and faster to iterate.

**Try it:** Fit a multiple regression of `Sepal.Length` on `Petal.Length` and `Petal.Width` using the built-in `iris` dataset. Save it to `ex_iris` and report just the `Petal.Width` coefficient. The sign will tell you something about iris geometry.

```r title="Your turn: iris multi-fit"
# Fit lm(Sepal.Length ~ Petal.Length + Petal.Width, data = iris)
ex_iris <- # your code here

# Pull just the Petal.Width coefficient
coef(ex_iris)["Petal.Width"]
#> Expected: about -0.32
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris fit and Petal.Width coefficient"
ex_iris <- lm(Sepal.Length ~ Petal.Length + Petal.Width, data = iris)
coef(ex_iris)["Petal.Width"]
#> Petal.Width
#>  -0.3187919
```

**Explanation:** Petal length alone correlates positively with sepal length (longer petals tend to come on flowers with longer sepals). But once `Petal.Length` is in the model, `Petal.Width` flips negative: holding petal length fixed, wider petals are associated with slightly *shorter* sepals. This sign-flip is a textbook example of why partial slopes can surprise you, and why you should always check correlations among predictors before interpreting coefficients in isolation.

</details>

## How do you check assumptions and predict on new data?

Linear regression rests on four assumptions: linearity, independence, equal-variance residuals (homoscedasticity), and approximately normal residuals. R bundles four diagnostic plots into one call so you can scan all of them at once. Reading them well is mostly pattern recognition; the goal is to spot a problem, not to compute a metric.

```r title="Four diagnostic panels in one view"
par(mfrow = c(2, 2))
plot(mt_multi)
par(mfrow = c(1, 1))  # reset
```

Each panel answers one question. **Residuals vs Fitted** (top-left) tests linearity: a flat horizontal smoother is good; a clear curve means the linear form is missing something. **Q-Q Residuals** (top-right) tests normality: points hugging the diagonal line are good; systematic curvature in the tails is a flag. **Scale-Location** (bottom-left) tests equal variance: the smoother should be roughly flat; an upward fan means residual size grows with fitted value. **Residuals vs Leverage** (bottom-right) flags influential points: anything past Cook's distance contour bands is worth a second look.

Once the model passes inspection, prediction is one function: `predict()`. The choice between a confidence interval and a prediction interval is the choice between two different questions.

```r title="Predict mpg with confidence vs prediction intervals"
new_car <- data.frame(wt = 3.0, hp = 120, cyl = 6)

# Confidence interval: where is the AVERAGE mpg for cars with this spec?
predict(mt_multi, newdata = new_car, interval = "confidence")
#>        fit      lwr      upr
#> 1 21.65993 20.41252 22.90734

# Prediction interval: where is THIS individual car's mpg likely to fall?
predict(mt_multi, newdata = new_car, interval = "prediction")
#>        fit      lwr      upr
#> 1 21.65993 16.16927 27.15059
```

Both intervals share the point estimate of `21.7` mpg. The confidence interval is narrow (`20.4` to `22.9`) because it asks about the average mpg of all 3,000-lb, 120-hp, 6-cyl cars, averaging shrinks uncertainty. The prediction interval is much wider (`16.2` to `27.2`) because it asks about one individual car, which has its own irreducible noise on top of the model's coefficient uncertainty. A common mistake in published reports is to quote the narrower confidence interval when the audience cares about a single new prediction.

[NOTE]
**Shapiro-Wilk on residuals is a quick check, but trust the Q-Q plot more on large samples.** `shapiro.test(residuals(mt_multi))` returns a p-value for the null hypothesis "residuals are normal." With 30 rows of `mtcars` the test has low power; with 3,000 rows it rejects tiny, harmless deviations. Use it as a sanity check, but let the Q-Q plot drive the decision.

**Try it:** Predict the mpg of a hypothetical 3,200-lb, 100-hp, 4-cylinder car using `mt_multi`. Use a 95% prediction interval so you can see the range of plausible values for a single car of that spec.

```r title="Your turn: predict with prediction interval"
# Build a 1-row data frame with the new car spec
ex_newcar <- # your code here

# Predict with prediction interval
predict(mt_multi, newdata = ex_newcar, interval = "prediction")
#> Expected: fit ~ 27, lwr ~ 22, upr ~ 32
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict 4-cyl car mpg with PI"
ex_newcar <- data.frame(wt = 3.2, hp = 100, cyl = 4)
predict(mt_multi, newdata = ex_newcar, interval = "prediction")
#>        fit      lwr      upr
#> 1 27.05891 21.69683 32.42098
```

**Explanation:** The model predicts about `27.1` mpg, with a 95% prediction interval from `21.7` to `32.4` mpg. The interval is wide because (1) the residual standard error of the model is around 2.5, (2) we are asking about a single car not an average, and (3) the new spec sits near the high-mpg end of the training data, where extrapolation widens the interval further. This is the right interval to quote if a customer asked "what mpg can I expect from a car like this?".

</details>

## Practice Exercises

Fifteen problems in four blocks: simple regression, multiple regression and interpretation, assumptions and diagnostics, and prediction with intervals. Each exercise uses an `my_*` variable name so you can run all 15 in sequence without overwriting tutorial state. Solutions hide behind a click, try first, peek second.

### Exercise 1: Fit a simple linear regression

Fit a simple linear regression of `mpg` on `wt` using `mtcars`. Save the model to `my_fit1`. Then extract just the slope of `wt`.

```r title="Exercise 1 starter"
# Fit lm(mpg ~ wt, data = mtcars), save to my_fit1
my_fit1 <- # your code here

# Extract the slope of wt
coef(my_fit1)["wt"]
#> Expected: about -5.34
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_fit1 <- lm(mpg ~ wt, data = mtcars)
coef(my_fit1)["wt"]
#>        wt
#> -5.344472
```

**Explanation:** The slope of `-5.34` says each 1,000-lb increase in weight is associated with a `5.3` mpg drop in fuel economy. `coef()` returns a named numeric vector; subscript by name with `["wt"]` to pull just the slope.

</details>

### Exercise 2: Read R² and residual standard error

From `my_fit1`, extract the multiple R² and the residual standard error. Report both as a single rounded line.

```r title="Exercise 2 starter"
# Use summary(my_fit1) to pull r.squared and sigma
my_r2 <- # your code here
my_rse <- # your code here

cat("R^2:", round(my_r2, 3), " RSE:", round(my_rse, 2), "\n")
#> Expected: R^2: 0.753 RSE: 3.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_r2  <- summary(my_fit1)$r.squared
my_rse <- summary(my_fit1)$sigma
cat("R^2:", round(my_r2, 3), " RSE:", round(my_rse, 2), "\n")
#> R^2: 0.753  RSE: 3.05
```

**Explanation:** `summary(model)$r.squared` and `summary(model)$sigma` are the two scalars you want. R² of `0.75` says weight explains 75% of mpg variance; the residual SE of `3.05` mpg is the typical prediction error on the training data. Together they sketch the fit's power and its noise floor.

</details>

### Exercise 3: Test whether the slope is significantly different from zero

Pull the p-value of the `wt` slope from the coefficients table of `my_fit1`. Compare it to `0.05` and print a one-line verdict.

```r title="Exercise 3 starter"
# coefficients matrix is summary(my_fit1)$coefficients
# row "wt", column "Pr(>|t|)" holds the p-value
my_p <- # your code here

cat("p =", signif(my_p, 3),
    "->", ifelse(my_p < 0.05, "reject H0: slope = 0", "fail to reject"), "\n")
#> Expected: p ~ 1.29e-10 -> reject H0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_p <- summary(my_fit1)$coefficients["wt", "Pr(>|t|)"]
cat("p =", signif(my_p, 3),
    "->", ifelse(my_p < 0.05, "reject H0: slope = 0", "fail to reject"), "\n")
#> p = 1.29e-10 -> reject H0: slope = 0
```

**Explanation:** The coefficients table is a numeric matrix with named rows (predictors) and named columns (`Estimate`, `Std. Error`, `t value`, `Pr(>|t|)`). Subscripting by both names is the cleanest way to grab a single cell. The tiny p-value here means the slope is essentially never zero in this sample.

</details>

### Exercise 4: Plot the regression line with ggplot2

Make a scatter plot of `mpg` vs `wt` from `mtcars` and overlay the linear regression fit using `geom_smooth(method = "lm")`. Add an informative title. Load `ggplot2` first.

```r title="Exercise 4 starter"
library(ggplot2)

# Build the plot: aes(x = wt, y = mpg), geom_point + geom_smooth(method = "lm")
my_plot4 <- # your code here

my_plot4
#> Expected: scatter with downward-sloping fit line + 95% CI ribbon
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
library(ggplot2)
my_plot4 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "lm", se = TRUE, color = "steelblue") +
  labs(title = "Fuel Economy vs Weight in mtcars",
       x = "Weight (1000 lb)",
       y = "Miles per gallon")
my_plot4
```

**Explanation:** `geom_smooth(method = "lm")` fits the same `lm(mpg ~ wt)` you already fit and draws the line plus a 95% confidence ribbon for the *mean* response (the narrower of the two intervals from earlier). The ribbon is narrowest near the centre of the data and widens at the extremes, that is the visual signature of regression uncertainty.

</details>

### Exercise 5: Predict mpg for a 3,500-lb car

Use `predict()` with a 1-row `newdata` frame to estimate mpg for a car weighing 3,500 lb (`wt = 3.5`). Add a 95% prediction interval.

```r title="Exercise 5 starter"
# Build new data frame with wt = 3.5
my_newdata5 <- # your code here

predict(my_fit1, newdata = my_newdata5, interval = "prediction")
#> Expected: fit ~ 18.6, lwr ~ 12.0, upr ~ 25.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
my_newdata5 <- data.frame(wt = 3.5)
predict(my_fit1, newdata = my_newdata5, interval = "prediction")
#>        fit      lwr      upr
#> 1 18.57916 12.27733 24.881
```

**Explanation:** The point prediction is `18.6` mpg. The 95% prediction interval, `12.3` to `24.9`, is wide because individual cars vary around the regression line by about 3 mpg (the residual SE), and that noise gets baked into the interval. Report this range, not just the point estimate, when communicating a single-car prediction.

</details>

### Exercise 6: Fit a multiple regression and report adjusted R²

Fit a multiple regression of `mpg` on `wt`, `hp`, and `cyl` using `mtcars`. Save it to `my_multi`. Report the adjusted R² rounded to three decimals.

```r title="Exercise 6 starter"
# Fit lm(mpg ~ wt + hp + cyl, data = mtcars)
my_multi <- # your code here

round(summary(my_multi)$adj.r.squared, 3)
#> Expected: about 0.823
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
my_multi <- lm(mpg ~ wt + hp + cyl, data = mtcars)
round(summary(my_multi)$adj.r.squared, 3)
#> [1] 0.823
```

**Explanation:** Adjusted R² of `0.82` is a real jump from the simple model's `0.74`. Adding `hp` and `cyl` captures variation that weight alone could not. Always compare adjusted R² (not raw R²) when models have different numbers of predictors, because raw R² mechanically rises with each added column.

</details>

### Exercise 7: Compare nested models with anova()

Run a nested-model F-test that compares `my_fit1` (just `wt`) against `my_multi` (`wt + hp + cyl`). Pull the p-value and decide whether the larger model adds significant predictive value.

```r title="Exercise 7 starter"
# Run anova(my_fit1, my_multi) and capture the result
my_anova <- # your code here

my_anova
#> Expected: F-test p-value far below 0.05 -> larger model wins
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
my_anova <- anova(my_fit1, my_multi)
my_anova
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt
#> Model 2: mpg ~ wt + hp + cyl
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)
#> 1     30 278.32
#> 2     28 161.81  2    116.51 10.081 0.0005107 ***
```

**Explanation:** The F-statistic of `10.1` with p ≈ `0.0005` rejects the null hypothesis that the two extra predictors add nothing. The residual sum of squares dropped from `278` to `162`, and the F-test asks whether that drop is bigger than chance given the extra parameters. Use `anova()` to compare *nested* models only, both models must use the same data and one must be a subset of the other.

</details>

### Exercise 8: Interpret a coefficient in plain English

The `hp` coefficient in `my_multi` is roughly `-0.018`. Write a one-sentence plain-English interpretation that includes the phrase "holding wt and cyl constant." Then verify the number with `coef()`.

```r title="Exercise 8 starter"
# Pull the hp coefficient
my_hp_slope <- # your code here

# Plain-English template: "Holding wt and cyl constant, each extra horsepower
# is associated with a change of <slope> mpg."
cat("Slope of hp =", round(my_hp_slope, 4), "\n")
#> Expected: -0.0180
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
my_hp_slope <- coef(my_multi)["hp"]
cat("Slope of hp =", round(my_hp_slope, 4), "\n")
#> Slope of hp = -0.018
```

**Plain-English interpretation:** Holding weight and cylinder count constant, each extra horsepower is associated with a `0.018` mpg drop in fuel economy. So a 100-hp jump (with the same weight and cylinders) costs about 1.8 mpg. The "holding others constant" phrase is mandatory in multiple regression, without it the slope means something different.

</details>

### Exercise 9: Fit an interaction model and compute conditional slopes

Fit `mpg ~ wt * am` on `mtcars` and save to `my_inter`. Then compute the conditional slope of `wt` for manual cars (`am = 1`) by adding the main effect and the interaction term.

```r title="Exercise 9 starter"
my_inter <- # your code here

main_wt   <- coef(my_inter)["wt"]
inter_wt  <- coef(my_inter)["wt:am"]
slope_man <- # your code here

cat("Slope of wt for manual cars:", round(slope_man, 2), "\n")
#> Expected: about -9.08
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
my_inter <- lm(mpg ~ wt * am, data = mtcars)

main_wt   <- coef(my_inter)["wt"]
inter_wt  <- coef(my_inter)["wt:am"]
slope_man <- main_wt + inter_wt
cat("Slope of wt for manual cars:", round(slope_man, 2), "\n")
#> Slope of wt for manual cars: -9.08
```

**Explanation:** With an interaction, the effect of `wt` depends on `am`. For automatic cars (`am = 0`) the slope is the main effect `-3.79`. For manual cars (`am = 1`) it is `main + interaction = -3.79 + (-5.30) = -9.08`. This is why interactions matter: assuming a single global slope when one truly differs by group will systematically mis-predict one of the groups.

</details>

### Exercise 10: Detect multicollinearity by hand

Compute the variance inflation factor (VIF) of `wt` in `my_multi` from scratch. Fit `wt ~ hp + cyl`, pull its R², then compute `1 / (1 - R²)`. A VIF above 5 (some say 10) is a multicollinearity warning.

```r title="Exercise 10 starter"
# Fit the auxiliary regression
aux_fit <- # your code here
aux_r2  <- summary(aux_fit)$r.squared

my_vif_wt <- # your code here

cat("VIF for wt:", round(my_vif_wt, 2), "\n")
#> Expected: about 4.84
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
aux_fit <- lm(wt ~ hp + cyl, data = mtcars)
aux_r2  <- summary(aux_fit)$r.squared
my_vif_wt <- 1 / (1 - aux_r2)
cat("VIF for wt:", round(my_vif_wt, 2), "\n")
#> VIF for wt: 4.84
```

**Explanation:** A VIF of `4.84` says the standard error of the `wt` coefficient is about `sqrt(4.84) = 2.2x` larger than it would be if `wt` were uncorrelated with the other predictors. That is moderate; below the conventional `5` threshold but high enough to matter for inference. The `car::vif()` function does this automatically for every predictor in a fitted multi-regression.

</details>

### Exercise 11: Plot residuals vs fitted and spot patterns

Plot residuals vs fitted values for `my_multi`. Use the built-in diagnostic with `plot(my_multi, which = 1)`. Read the smoother: a flat horizontal line means linearity holds, a curve means it does not.

```r title="Exercise 11 starter"
# Plot only the residuals vs fitted panel
# Hint: which = 1 selects panel 1
# your code here
#> Expected: scatter with red smoother roughly flat, mild curve at the right tail
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 11 solution"
plot(my_multi, which = 1)
```

**Explanation:** The red smoother line in the residuals-vs-fitted plot is mostly flat for `my_multi`, suggesting the linear form is a reasonable fit. A few high-mpg cars (Toyota Corolla, Fiat 128) sit above zero, hinting that the model slightly under-predicts the most efficient cars, a sign that adding a non-linear term in `hp` or `wt` could help. No giant U-shape, no fan, no smoking gun.

</details>

### Exercise 12: Test residual normality with Shapiro-Wilk

Run `shapiro.test()` on the residuals of `my_multi`. Interpret the p-value relative to the sample size: with only 32 observations, even substantial deviations from normality may not be detected.

```r title="Exercise 12 starter"
my_shapiro <- # your code here
my_shapiro
#> Expected: W ~ 0.94, p ~ 0.07 -> borderline, do not reject normality at 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 12 solution"
my_shapiro <- shapiro.test(residuals(my_multi))
my_shapiro
#>
#>  Shapiro-Wilk normality test
#>
#> data:  residuals(my_multi)
#> W = 0.94299, p-value = 0.09635
```

**Explanation:** With p ≈ `0.10`, you fail to reject the null hypothesis that residuals are normally distributed at the conventional `0.05` cut-off. But the test has low power on 32 rows; a Q-Q plot is more informative here. With thousands of rows, this same test would reject for tiny, harmless deviations, the lesson is to read Shapiro alongside the Q-Q plot, not in isolation.

</details>

### Exercise 13: Find the most influential observation

Compute Cook's distance for every row in `my_multi` and identify the most influential car. The row label of `mtcars` is the car name, so `which.max()` plus `rownames()` gets you the answer.

```r title="Exercise 13 starter"
my_cooks <- # your code here

top_idx <- which.max(my_cooks)
cat("Most influential car:", rownames(mtcars)[top_idx],
    "with Cook's D =", round(my_cooks[top_idx], 3), "\n")
#> Expected: Toyota Corolla or Chrysler Imperial as the top influence
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 13 solution"
my_cooks <- cooks.distance(my_multi)
top_idx  <- which.max(my_cooks)
cat("Most influential car:", rownames(mtcars)[top_idx],
    "with Cook's D =", round(my_cooks[top_idx], 3), "\n")
#> Most influential car: Toyota Corolla with Cook's D = 0.219
```

**Explanation:** Toyota Corolla, with Cook's D of `0.22`, has the largest single-row influence on the fitted coefficients of `my_multi`. The conventional "investigate" threshold is `4/n = 4/32 = 0.125`, which Toyota Corolla exceeds. That does not mean delete it, influential does not mean wrong. It means refit without that row and see if your coefficients change meaningfully; if they do, your conclusions depend on a single observation, which is worth disclosing.

</details>

### Exercise 14: 95% confidence interval for the mean mpg

Predict the **mean** mpg for a hypothetical car with `wt = 3.0`, `hp = 110`, `cyl = 6`, using `my_multi`. Report the 95% confidence interval, the right interval to quote when the audience cares about the average car of that spec (not a single car).

```r title="Exercise 14 starter"
my_newcar14 <- # your code here

predict(my_multi, newdata = my_newcar14, interval = "confidence", level = 0.95)
#> Expected: fit ~ 22.5, narrow interval (~ 21 to 24)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 14 solution"
my_newcar14 <- data.frame(wt = 3.0, hp = 110, cyl = 6)
predict(my_multi, newdata = my_newcar14, interval = "confidence", level = 0.95)
#>        fit     lwr      upr
#> 1 22.49146 21.23147 23.75145
```

**Explanation:** The 95% confidence interval, `21.2` to `23.8`, is the range you would quote for the *average* mpg of all 3,000-lb, 110-hp, 6-cyl cars in the population. It is narrow because averaging across many such cars cancels their individual noise. This is the right interval for a fleet-level summary: "on average, cars like this get 22.5 mpg, plus or minus 1.3."

</details>

### Exercise 15: 95% prediction interval for a single new car

Same car spec as Exercise 14 (`wt = 3.0`, `hp = 110`, `cyl = 6`). This time return a 95% **prediction** interval, the right interval to quote when the audience asks "what mpg can I expect from one specific car like this?"

```r title="Exercise 15 starter"
predict(my_multi, newdata = my_newcar14, interval = "prediction", level = 0.95)
#> Expected: fit ~ 22.5, much wider interval (~ 17 to 28)

# Why is this wider than Exercise 14?
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 15 solution"
predict(my_multi, newdata = my_newcar14, interval = "prediction", level = 0.95)
#>        fit      lwr      upr
#> 1 22.49146 17.13961 27.84331
```

**Explanation:** The 95% prediction interval, `17.1` to `27.8`, is much wider than the confidence interval (`21.2` to `23.8`) from Exercise 14 because it adds in the irreducible variation of a *single* car around the regression mean. Mathematically, the prediction interval's variance is `Var(mean) + sigma^2`, while the confidence interval is just `Var(mean)`. The single-car interval will always be wider; using the narrower confidence interval to make a single-car promise is a classic over-claiming mistake.

</details>

## Complete Example: predicting fuel economy on a held-out car

This worked example chains the moves from the 15 exercises into one realistic workflow: explore the data with correlations, fit a multi-predictor model, run a nested-model F-test, check assumptions, and predict mpg with both intervals for a new spec. Read it as the report you would write at the end of an analyst task.

```r title="End-to-end mpg prediction workflow"
# 1. Look at correlations to choose predictors
round(cor(mtcars[, c("mpg", "wt", "hp", "cyl", "disp")]), 2)
#>         mpg    wt    hp   cyl  disp
#> mpg    1.00 -0.87 -0.78 -0.85 -0.85
#> wt    -0.87  1.00  0.66  0.78  0.89
#> hp    -0.78  0.66  1.00  0.83  0.79
#> cyl   -0.85  0.78  0.83  1.00  0.90
#> disp  -0.85  0.89  0.79  0.90  1.00

# 2. Fit two candidate models
final_simple <- lm(mpg ~ wt, data = mtcars)
final_multi  <- lm(mpg ~ wt + hp + cyl, data = mtcars)

# 3. Compare with a nested-model F-test
anova(final_simple, final_multi)["Pr(>F)"][2, ]
#> [1] 0.0005106555

# 4. Check assumptions on the chosen model
shapiro.test(residuals(final_multi))$p.value
#> [1] 0.0963522

# 5. Predict for a new car: confidence and prediction intervals
new_car <- data.frame(wt = 2.8, hp = 105, cyl = 4)
predict(final_multi, newdata = new_car, interval = "confidence")
#>        fit      lwr      upr
#> 1 26.51762 24.74937 28.28586
predict(final_multi, newdata = new_car, interval = "prediction")
#>        fit      lwr      upr
#> 1 26.51762 21.13042 31.90481
```

The workflow follows a clear sequence. The correlation matrix shows `wt`, `hp`, and `cyl` all correlate strongly with `mpg`, but they also correlate with each other (e.g. `cor(cyl, disp) = 0.90`), which is why we keep `cyl` and skip `disp`. The nested F-test (p ≈ `0.0005`) says the multi-predictor model is significantly better than weight alone. Shapiro on residuals (p ≈ `0.10`) does not flag a normality problem at 32 observations. For the new spec (light, low-power, 4-cylinder), the model predicts `26.5` mpg with a confidence interval of `24.7-28.3` for the *average* such car and a prediction interval of `21.1-31.9` for a *single* such car. A short report sentence: "The fitted multiple regression (R² = 0.84, adj R² = 0.82) predicts 26.5 mpg for a 2,800-lb, 105-hp, 4-cylinder car, with a 95% prediction interval of 21.1 to 31.9 mpg."

## Summary

The fifteen exercises drilled the same five-step workflow shown here, with one extra knob per problem.

![Linear regression workflow](screenshots/Linear-Regression-Exercises-in-R-workflow.webp)
*Figure 1: The fit-interpret-check loop the 15 exercises drill into.*

| Step | Function | Key output | Common gotcha |
|---|---|---|---|
| Fit | `lm(y ~ x, data)` | A model object, `coef()` and `fitted()` ready | Forgetting `data =` and pulling from the global env |
| Interpret | `summary(model)` | Estimate, p-value, R², F-stat | Reading p < 0.05 as "large effect" |
| Compare | `anova(small, big)` | Nested-model F-test | Comparing non-nested models (use AIC instead) |
| Diagnose | `plot(model)` | Four panels: linearity, normality, equal var, leverage | Trusting Shapiro on small/large samples without the Q-Q plot |
| Predict | `predict(model, newdata, interval)` | Point + CI or PI | Quoting CI when audience needs PI |

Five habits this set of exercises locks in:

1. Read `summary()` top to bottom in order, not by cherry-picking R² or one p-value.
2. In multiple regression, every slope means "with the others held constant", always.
3. A nested F-test, not raw R², decides whether added predictors earn their place.
4. Diagnostic plots are about patterns, not point values; a flat smoother is the goal.
5. Confidence intervals describe averages, prediction intervals describe single new cases. They are not interchangeable.

## References

1. Kutner, M., Nachtsheim, C., Neter, J., Li, W., *Applied Linear Statistical Models*, 5th ed., McGraw-Hill (2005). The standard graduate-level reference for the OLS framework, t-tests on slopes, and prediction-vs-confidence intervals. [Publisher page](https://www.mheducation.com/highered/product/applied-linear-statistical-models-kutner-nachtsheim/M9780073108742.html)
2. Faraway, J. J., *Linear Models with R*, 2nd ed., Chapman & Hall/CRC (2014). Concise R-first treatment, including the `mtcars`-style worked examples and diagnostic-plot reading. [Publisher page](https://www.routledge.com/Linear-Models-with-R/Faraway/p/book/9781439887332)
3. R Core Team, `lm()` reference, base R `stats` package documentation. The authoritative source on what `lm()` returns and how `summary.lm`, `predict.lm`, and `anova()` operate. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
4. James, G., Witten, D., Hastie, T., Tibshirani, R., *An Introduction to Statistical Learning with Applications in R*, 2nd ed., Springer (2021). Chapter 3 covers simple and multiple regression with the same partial-effect interpretation used here. [Free PDF](https://www.statlearning.com/)
5. Fox, J., Weisberg, S., *An R Companion to Applied Regression*, 3rd ed., SAGE (2019). Source of the `car::vif()` and `car::Anova()` functions used in extended diagnostics. [Publisher page](https://us.sagepub.com/en-us/nam/an-r-companion-to-applied-regression/book246125)
6. Wickham, H., Çetinkaya-Rundel, M., Grolemund, G., *R for Data Science*, 2nd ed., O'Reilly (2023). Chapter 22 ("Models") frames model fitting in the same fit-interpret-check loop used in these exercises. [Free online](https://r4ds.hadley.nz/)
7. Robinson, D., Hayes, A., Couch, S., `broom` package vignette, "Introduction to broom." Helpful when you outgrow `summary()` and need tidy data frames of coefficients and fit statistics. [CRAN page](https://cran.r-project.org/web/packages/broom/vignettes/broom.html)

## Continue Learning

- [Linear Regression in R: Fit Your First Model With lm() and Understand Every Number](Simple-Linear-Regression-in-R.html), the canonical parent lesson that walks through `lm()` output line by line. Read this first if any of the t-test or R² discussion above felt rushed.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), a deeper dive into the four diagnostic panels and the formal tests behind each. The right next step after Exercises 11-13.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html), leverage, influence, Cook's distance, and DFBETAS in detail. Read this when an exercise like 13 surfaces an influential point and you need to decide what to do about it.

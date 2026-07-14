---
title: "Top 25 Regression Problems to Solve in R"
slug: "Top-25-Regression-Problems-in-R"
description: "Regression practice problems in R: 25 worked exercises on lm fitting, coefficient interpretation, residual diagnostics, prediction intervals and model comparison."
keywords: "regression practice problems R, regression exercises, lm in R, linear regression R, coefficient interpretation, residual diagnostics, prediction interval, adjusted r-squared, AIC, anova F-test"
mathjax: true
webr: true
date: "2026-07-15"
post_type: "EX"
sidebar_title: "Top 25 Regression Problems"
sidebar_order: 145
fr_parent: "Linear-Regression.html"
auto_link_terms: "linear regression|multiple linear regression|residual diagnostics|prediction interval|adjusted r-squared|akaike information criterion"
auto_link_case_sensitive: false
target_keyword: "regression practice problems R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Top 25 Regression Problems to Solve in R

<p class="lead">A featured collection of 25 regression practice problems that walk from fitting your first <code>lm()</code> and reading its output, through coefficient interpretation traps, categorical predictors, residual diagnostics, and prediction intervals, to model comparison. Every problem ships an expected result and a hidden worked solution.</p>

These problems use only built-in datasets, so you can run every one without downloading anything. Work top to bottom: the arc builds from mechanics to judgment. Each problem states the task, shows the exact output to aim for, gives two graduated hints, and hides a full solution with a written explanation. Reveal the solution only after your own attempt matches (or fails to match) the expected result.

```r title="Run this once before any exercise"
# All problems use built-in datasets: mtcars, iris, trees, faithful.
# lm(), summary(), predict(), anova(), AIC() and shapiro.test() all live in stats.
library(stats)
```

## Section 1. Fitting and reading lm output (5 problems)

Before you can interpret a model you have to fit one and read what `lm()` prints back. This section drills the four numbers every regression report hands you: coefficients, R-squared, the coefficient table, and the residual standard error.

### Exercise 1.1: Fit a simple linear regression and read the coefficients

**Task:** Regress fuel economy on weight for the `mtcars` dataset by modelling `mpg` as a function of `wt` (weight in thousands of pounds), then print the fitted model so you can read the intercept and slope. Save the fitted model object to `ex_1_1`.

**Expected result:**

```
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt  
#>      37.285       -5.344  
```

**Difficulty:** Beginner

[HINTS]
Fitting a straight-line model needs a formula that puts the response on the left of the tilde and the predictor on the right.
Call `lm(mpg ~ wt, data = mtcars)` and print the object to see the coefficients.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lm(mpg ~ wt, data = mtcars)
ex_1_1
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Coefficients:
#> (Intercept)           wt  
#>      37.285       -5.344  
```

**Explanation:** The formula `mpg ~ wt` reads as "model mpg using wt". The slope of `-5.344` says each additional 1000 lb of weight is associated with about 5.3 fewer miles per gallon, holding nothing else. Printing an `lm` object shows only the call and coefficients; the richer report (standard errors, R-squared, F-test) lives in `summary()`, which you reach next.

</details>

### Exercise 1.2: Pull the R-squared out of a model summary

**Task:** Using the same `mpg ~ wt` model on `mtcars`, extract the coefficient of determination (R-squared) as a single number rather than reading it off the printed summary. Save that number to `ex_1_2` and print it.

**Expected result:**

```
#> [1] 0.7528328
```

**Difficulty:** Beginner

[HINTS]
The summary of a model is itself a list, and the fit statistic you want is stored under a name, not printed only as text.
Call `summary()` on the model and pull the `$r.squared` element.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- summary(lm(mpg ~ wt, data = mtcars))$r.squared
ex_1_2
#> [1] 0.7528328
```

**Explanation:** `summary.lm()` returns a list with named components, so `$r.squared` gives the value programmatically instead of copying it by eye. Here weight alone explains about 75% of the variance in mpg. Prefer this over screen-scraping the printout: it keeps reports reproducible and lets you compare many models in a loop. The paired `$adj.r.squared` penalises extra predictors.

</details>

### Exercise 1.3: Read the full coefficient table of a two-predictor model

**Task:** A data analyst wants the estimate, standard error, t value and p value for every term in the two-predictor model `mpg ~ wt + hp` fitted on `mtcars`. Extract the coefficient matrix from the model summary and save it to `ex_1_3`.

**Expected result:**

```
#>                Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.22727012 1.59878754 23.284689 2.565459e-20
#> wt          -3.87783074 0.63273349 -6.128695 1.119647e-06
#> hp          -0.03177295 0.00902971 -3.518712 1.451229e-03
```

**Difficulty:** Intermediate

[HINTS]
The four-column table you see printed under "Coefficients" is stored as a matrix inside the summary object.
Wrap the model in `summary()` then `coef()`, or read `summary(model)$coefficients`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- coef(summary(lm(mpg ~ wt + hp, data = mtcars)))
ex_1_3
#>                Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.22727012 1.59878754 23.284689 2.565459e-20
#> wt          -3.87783074 0.63273349 -6.128695 1.119647e-06
#> hp          -0.03177295 0.00902971 -3.518712 1.451229e-03
```

**Explanation:** `coef()` on a summary returns the coefficient table as a numeric matrix, which is far easier to subset than the printed block. Notice the `wt` slope shrank from `-5.34` to `-3.88` once `hp` entered: the two predictors share information, so the simple-regression slope was partly absorbing horsepower. Both p values are tiny, so each predictor adds signal beyond the other.

</details>

### Exercise 1.4: Extract the residual standard error

**Task:** Report the residual standard error of the `mpg ~ wt + hp` model on `mtcars`, the typical size of a prediction miss in miles per gallon, as a single number obtained directly from the fitted model. Save the value to `ex_1_4` and print it.

**Expected result:**

```
#> [1] 2.593412
```

**Difficulty:** Beginner

[HINTS]
The number labelled "Residual standard error" at the foot of a summary is the estimated standard deviation of the errors.
Fit the model and pass it to `sigma()`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- sigma(lm(mpg ~ wt + hp, data = mtcars))
ex_1_4
#> [1] 2.593412
```

**Explanation:** `sigma()` returns $\hat{\sigma} = \sqrt{\text{RSS}/(n - p)}$, the residual standard error, without parsing the printed summary. Roughly speaking, actual mpg values sit about 2.6 units away from the fitted line on average. Unlike R-squared, sigma keeps the original units, which makes it the more honest yardstick when you care about prediction accuracy rather than variance explained.

</details>

## Section 2. Coefficient interpretation traps (4 problems)

A slope only means something once you know the units and the transform behind it. This section covers the four interpretation traps that catch people most: rescaled units, semi-log models, log-log elasticities, and standardized coefficients.

### Exercise 2.1: See how rescaling a predictor's units rescales its slope

**Task:** The `wt` column in `mtcars` is in thousands of pounds, but a colleague wants weight expressed in single pounds. Refit `mpg` on weight measured in pounds using `I(wt * 1000)` and compare the slope with the original. Save the coefficient vector to `ex_2_1`.

**Expected result:**

```
#>  (Intercept) I(wt * 1000) 
#> 37.285126167 -0.005344472 
```

**Difficulty:** Intermediate

[HINTS]
Multiplying a predictor by a constant divides its slope by the same constant, while the intercept and the fit are untouched.
Fit `lm(mpg ~ I(wt * 1000), data = mtcars)` and read `coef()`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- coef(lm(mpg ~ I(wt * 1000), data = mtcars))
ex_2_1
#>  (Intercept) I(wt * 1000) 
#> 37.285126167 -0.005344472 
```

**Explanation:** The slope went from `-5.344` per 1000 lb to `-0.005344` per single pound, exactly one thousandth, because $\beta$ carries the inverse units of its predictor. The intercept, the R-squared and every fitted value are identical: rescaling a predictor is cosmetic, not statistical. The lesson is that a coefficient's magnitude is meaningless until you name its units, which is why "per 1000 lb" belongs in every write-up.

</details>

### Exercise 2.2: Interpret a slope from a log-transformed response

**Task:** A fuel-economy analyst suspects weight has a multiplicative effect on mpg, so they model `log(mpg) ~ wt` on `mtcars`. Fit that semi-log regression and extract the coefficients so you can back-transform the slope into a percentage change. Save the coefficient vector to `ex_2_2`.

**Expected result:**

```
#> (Intercept)          wt 
#>   3.8319136  -0.2717847 
```

**Difficulty:** Intermediate

[HINTS]
When the response is logged, a slope of b means the response is multiplied by e-to-the-b for each one-unit rise in the predictor.
Fit `lm(log(mpg) ~ wt, data = mtcars)` and read the coefficients; then think about `exp()` of the slope.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- coef(lm(log(mpg) ~ wt, data = mtcars))
ex_2_2
#> (Intercept)          wt 
#>   3.8319136  -0.2717847 
# exp(-0.2717847) = 0.762, i.e. about a 24% drop in mpg per 1000 lb
```

**Explanation:** With a logged response the slope is a proportional effect: each extra 1000 lb multiplies mpg by $e^{-0.2718} \approx 0.762$, roughly a 24% fall. For small slopes the raw coefficient itself approximates the percentage change (here about `-27%` versus the exact `-24%`), and the gap widens as the slope grows. Reaching for `exp()` rather than reading the coefficient literally is the habit that keeps semi-log interpretation honest.

</details>

### Exercise 2.3: Estimate an elasticity with a log-log model

**Task:** A forester studying black cherry trees expects timber `Volume` to scale with trunk `Girth` by a power law, so a log-log fit gives the elasticity directly. Using the built-in `trees` dataset, fit `log(Volume) ~ log(Girth)` and save the coefficients to `ex_2_3`.

**Expected result:**

```
#> (Intercept)  log(Girth) 
#>   -2.353325    2.199970 
```

**Difficulty:** Advanced

[HINTS]
When both sides are logged, the slope is an elasticity: the percent change in the response per one percent change in the predictor.
Fit `lm(log(Volume) ~ log(Girth), data = trees)` and read the `log(Girth)` coefficient.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- coef(lm(log(Volume) ~ log(Girth), data = trees))
ex_2_3
#> (Intercept)  log(Girth) 
#>   -2.353325    2.199970 
```

**Explanation:** In a log-log model the slope is an elasticity: a 1% rise in girth is associated with about a 2.2% rise in volume. That is more than proportional, which matches geometry, since volume grows roughly with the square of a linear dimension. Elasticities are unit-free, so they travel across datasets and are the natural currency in economics and allometry. The intercept here is only the log-volume at unit girth and is rarely interpreted on its own.

</details>

### Exercise 2.4: Compare predictors fairly with standardized coefficients

**Task:** Because `wt` and `hp` live on wildly different scales, their raw slopes in `mpg ~ wt + hp` cannot be compared for importance. Standardize both predictors with `scale()` inside the `mtcars` model so the slopes become comparable, and save the standardized coefficient vector to `ex_2_4`.

**Expected result:**

```
#> (Intercept)   scale(wt)   scale(hp) 
#>   20.090625   -3.794292   -2.178444 
```

**Difficulty:** Intermediate

[HINTS]
Putting predictors on a common standard-deviation scale makes each slope a "per one standard deviation" effect.
Wrap each predictor in `scale()`, as in `lm(mpg ~ scale(wt) + scale(hp), data = mtcars)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- coef(lm(mpg ~ scale(wt) + scale(hp), data = mtcars))
ex_2_4
#> (Intercept)   scale(wt)   scale(hp) 
#>   20.090625   -3.794292   -2.178444 
```

**Explanation:** After standardizing, each slope is the mpg change per one standard deviation of the predictor, so `wt` (`-3.79`) outranks `hp` (`-2.18`) in influence, which the raw units hid. The intercept becomes the mean mpg (`20.09`) because both predictors are now centered at zero. A caution: standardized coefficients rank importance only within this sample and model, and they can shift when predictors are correlated, so treat them as a guide, not a verdict.

</details>

## Section 3. Categorical predictors and interactions (4 problems)

Factors enter a regression as dummy variables, and their coefficients are always differences from a baseline. This section covers dummy coding, changing the reference level, fitting interactions, and testing whether an interaction is real.

### Exercise 3.1: Fit a categorical predictor and read the dummy coefficients

**Task:** Treat cylinder count as a category rather than a number by modelling `mpg ~ factor(cyl)` on `mtcars`, which has 4, 6 and 8 cylinder cars. Fit the model and save the coefficient vector to `ex_3_1`, then read each slope as a contrast against the baseline group.

**Expected result:**

```
#>  (Intercept) factor(cyl)6 factor(cyl)8 
#>    26.663636    -6.920779   -11.563636 
```

**Difficulty:** Intermediate

[HINTS]
A factor with k levels becomes k minus one dummy columns, and the level left out becomes the baseline folded into the intercept.
Fit `lm(mpg ~ factor(cyl), data = mtcars)` and read `coef()`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- coef(lm(mpg ~ factor(cyl), data = mtcars))
ex_3_1
#>  (Intercept) factor(cyl)6 factor(cyl)8 
#>    26.663636    -6.920779   -11.563636 
```

**Explanation:** With default treatment coding the 4-cylinder group is the baseline, so the intercept `26.66` is the mean mpg for 4-cylinder cars. The other coefficients are differences from that baseline: 6-cylinder cars average `6.92` mpg less, 8-cylinder cars `11.56` mpg less. A dummy coefficient is never an absolute mean for its own group; forgetting the baseline is the single most common misread of categorical regression output.

</details>

### Exercise 3.2: Change the reference level with relevel

**Task:** A reviewer wants the 8-cylinder engine as the comparison baseline instead of the 4-cylinder default. On a copy of `mtcars`, turn `cyl` into a factor releveled to reference `"8"`, refit `mpg` on it, and save the new coefficient vector to `ex_3_2`.

**Expected result:**

```
#> (Intercept)        cyl4        cyl6 
#>   15.100000   11.563636    4.642857 
```

**Difficulty:** Intermediate

[HINTS]
The baseline is just whichever factor level sorts first, and you can promote any level to that spot without touching the data values.
Build the factor with `relevel(factor(cyl), ref = "8")`, then refit.

```r title="Your turn"
mtcars2 <- mtcars
# make cyl a factor with "8" as the reference level, then fit
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mtcars2 <- mtcars
mtcars2$cyl <- relevel(factor(mtcars2$cyl), ref = "8")
ex_3_2 <- coef(lm(mpg ~ cyl, data = mtcars2))
ex_3_2
#> (Intercept)        cyl4        cyl6 
#>   15.100000   11.563636    4.642857 
```

**Explanation:** `relevel()` moves `"8"` to the front, so the intercept `15.10` is now the 8-cylinder mean and the other slopes are gains relative to it: 4-cylinder cars average `11.56` mpg more, 6-cylinder cars `4.64` more. The model fit is unchanged, only the framing of the contrasts. Choosing a meaningful baseline (often a control group or the most common level) makes the coefficient table tell the story you actually want to report.

</details>

### Exercise 3.3: Fit an interaction so slopes differ by group

**Task:** In the `iris` dataset the relationship between `Sepal.Width` and `Sepal.Length` may differ across species. Fit `Sepal.Width ~ Sepal.Length * Species` so each species gets its own slope, and save the coefficient vector to `ex_3_3`. Read how the interaction terms adjust the baseline slope.

**Expected result:**

```
#>                    (Intercept)                   Sepal.Length 
#>                     -0.5694327                      0.7985283 
#>              Speciesversicolor               Speciesvirginica 
#>                      1.4415786                      2.0157381 
#> Sepal.Length:Speciesversicolor  Sepal.Length:Speciesvirginica 
#>                     -0.4788090                     -0.5666378 
```

**Difficulty:** Advanced

[HINTS]
The star operator expands to both main effects and their product, letting the predictor's slope change from one group to the next.
Fit `lm(Sepal.Width ~ Sepal.Length * Species, data = iris)` and read the interaction rows.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- coef(lm(Sepal.Width ~ Sepal.Length * Species, data = iris))
ex_3_3
#>                    (Intercept)                   Sepal.Length 
#>                     -0.5694327                      0.7985283 
#>              Speciesversicolor               Speciesvirginica 
#>                      1.4415786                      2.0157381 
#> Sepal.Length:Speciesversicolor  Sepal.Length:Speciesvirginica 
#>                     -0.4788090                     -0.5666378 
```

**Explanation:** `Sepal.Length * Species` fits a separate line per species. The `Sepal.Length` coefficient `0.799` is the slope for the baseline species (setosa); the interaction terms bend it, so versicolor's slope is $0.799 - 0.479 = 0.320$ and virginica's is $0.799 - 0.567 = 0.232$. Pooling all species into one slope would mask that every group actually shows a positive width-length link, the classic Simpson's paradox that interactions exist to expose.

</details>

### Exercise 3.4: Test whether an interaction term is significant

**Task:** Continuing the `iris` model `Sepal.Width ~ Sepal.Length * Species`, isolate the coefficient row for the `Sepal.Length:Speciesversicolor` interaction so you can judge its estimate, standard error, t value and p value. Save that single row to `ex_3_4`.

**Expected result:**

```
#>      Estimate    Std. Error       t value      Pr(>|t|) 
#> -0.4788089551  0.1336524912 -3.5824918089  0.0004647939 
```

**Difficulty:** Intermediate

[HINTS]
The coefficient table is a matrix, so you can pull one predictor's whole row by name.
Index `coef(summary(model))["Sepal.Length:Speciesversicolor", ]`.

```r title="Your turn"
m <- lm(Sepal.Width ~ Sepal.Length * Species, data = iris)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(Sepal.Width ~ Sepal.Length * Species, data = iris)
ex_3_4 <- coef(summary(m))["Sepal.Length:Speciesversicolor", ]
ex_3_4
#>      Estimate    Std. Error       t value      Pr(>|t|) 
#> -0.4788089551  0.1336524912 -3.5824918089  0.0004647939 
```

**Explanation:** Row-indexing the coefficient matrix by term name returns the four summary numbers for just that interaction. The p value of `0.00046` is well below `0.05`, so versicolor's slope is reliably shallower than setosa's; the interaction is not noise. When a factor has several levels, prefer `anova()` or `car::Anova()` to test the whole interaction at once, since scanning individual dummy rows inflates the chance of a false positive.

</details>

## Section 4. Diagnostics reading: residuals, leverage, influence (5 problems)

A fitted line is only trustworthy if its residuals behave. This section reads the three diagnostic lenses that matter: residual patterns and normality, leverage (unusual predictor values), and influence (points that actually move the fit).

### Exercise 4.1: Find the cars the model most under-predicts

**Task:** For the `mpg ~ wt` model on `mtcars`, a residual is how far actual mpg sits above the fitted line, so the largest positive residuals flag cars that beat the model. Compute the residuals and save the three largest, with their car names, to `ex_4_1`.

**Expected result:**

```
#>          Fiat 128    Toyota Corolla Chrysler Imperial 
#>          6.872711          6.421979          5.981074 
```

**Difficulty:** Intermediate

[HINTS]
A residual is observed minus fitted, and you want the most positive ones, so sorting in decreasing order surfaces them.
Take `residuals(model)`, then `sort(..., decreasing = TRUE)` and keep the top three with `head()`.

```r title="Your turn"
m <- lm(mpg ~ wt, data = mtcars)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(mpg ~ wt, data = mtcars)
ex_4_1 <- head(sort(residuals(m), decreasing = TRUE), 3)
ex_4_1
#>          Fiat 128    Toyota Corolla Chrysler Imperial 
#>          6.872711          6.421979          5.981074 
```

**Explanation:** `residuals()` returns observed minus fitted for every car, keeping the row names, so sorting exposes the biggest positive misses: the Fiat 128 gets about 6.9 mpg more than its weight predicts. Large residuals are not errors to delete; they are prompts to ask what the single-predictor model omits, such as engine size or aerodynamics. Inspecting the extremes by name is often the fastest route to the next useful variable.

</details>

### Exercise 4.2: Flag high-leverage observations with hat values

**Task:** Leverage measures how unusual a car's predictor values are, regardless of its mpg. For the `mpg ~ wt + hp` model on `mtcars`, compute the hat values and save the three highest, with car names, to `ex_4_2`. Compare them against the rule-of-thumb cutoff of $2p/n$.

**Expected result:**

```
#>       Maserati Bora Lincoln Continental      Ford Pantera L 
#>              0.3942              0.2090              0.2044 
#> cutoff 2p/n = 2 * 3 / 32 = 0.1875
```

**Difficulty:** Advanced

[HINTS]
Leverage comes from the diagonal of the hat matrix and depends only on the predictors, never on the response.
Use `hatvalues(model)`, sort decreasing, and keep the top three; the average leverage is p over n.

```r title="Your turn"
m <- lm(mpg ~ wt + hp, data = mtcars)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(mpg ~ wt + hp, data = mtcars)
ex_4_2 <- head(sort(hatvalues(m), decreasing = TRUE), 3)
round(ex_4_2, 4)
#>       Maserati Bora Lincoln Continental      Ford Pantera L 
#>              0.3942              0.2090              0.2044 
# cutoff 2p/n = 2 * 3 / 32 = 0.1875
```

**Explanation:** Hat values sum to $p$ (here 3, counting the intercept), so average leverage is $p/n = 3/32 \approx 0.094$ and points above $2p/n = 0.1875$ deserve a look. The Maserati Bora at `0.394` sits far out in weight-horsepower space. High leverage is only a risk, not a problem by itself: a high-leverage point that lies on the trend barely moves the fit. To see which ones actually matter, combine leverage with the residual, which is exactly what Cook's distance does next.

</details>

### Exercise 4.3: Rank influential points with Cook's distance

**Task:** Cook's distance combines leverage and residual size to measure how much each car actually moves the fitted `mpg ~ wt + hp` model on `mtcars`. Compute Cook's distance for every observation and save the three most influential, with car names, to `ex_4_3`.

**Expected result:**

```
#> Chrysler Imperial     Maserati Bora    Toyota Corolla 
#>            0.4236            0.2720            0.2084 
```

**Difficulty:** Advanced

[HINTS]
Influence asks how far the whole fit would shift if one point were dropped, blending leverage and residual into one number.
Use `cooks.distance(model)`, sort decreasing, and take the top three.

```r title="Your turn"
m <- lm(mpg ~ wt + hp, data = mtcars)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(mpg ~ wt + hp, data = mtcars)
ex_4_3 <- head(sort(cooks.distance(m), decreasing = TRUE), 3)
round(ex_4_3, 4)
#> Chrysler Imperial     Maserati Bora    Toyota Corolla 
#>            0.4236            0.2720            0.2084 
```

**Explanation:** Cook's distance measures the shift in all fitted values when a point is removed, so it catches cars that are both unusual and off-trend. The Chrysler Imperial tops the list even though the Maserati Bora had higher leverage, because the Imperial pairs moderate leverage with a large residual. A common flag is $D_i > 4/n = 0.125$ here, but treat it as a prompt to investigate rather than an automatic delete: influential points are frequently the most informative rows in the data.

</details>

### Exercise 4.4: Test residual normality with Shapiro-Wilk

**Task:** Ordinary least squares inference leans on roughly normal residuals, so test that assumption for the `mpg ~ wt` model on `mtcars`. Run a Shapiro-Wilk test on the model residuals and save the full test object to `ex_4_4`, then read the W statistic and p value.

**Expected result:**

```
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(m)
#> W = 0.94508, p-value = 0.1044
```

**Difficulty:** Intermediate

[HINTS]
You are testing a distributional assumption about the errors, so feed the model's residuals, not the raw response, into a normality test.
Call `shapiro.test(residuals(model))`.

```r title="Your turn"
m <- lm(mpg ~ wt, data = mtcars)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(mpg ~ wt, data = mtcars)
ex_4_4 <- shapiro.test(residuals(m))
ex_4_4
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(m)
#> W = 0.94508, p-value = 0.1044
```

**Explanation:** The null hypothesis is that residuals are normal; a p value of `0.10` gives no reason to reject it, so the normality assumption is defensible here. Two cautions matter: in small samples the test has little power to detect non-normality, while in large samples it flags trivial departures as significant. Pair it with a Q-Q plot, and remember that mild non-normality mostly threatens prediction intervals rather than the coefficient estimates themselves.

</details>

### Exercise 4.5: Read a residuals-versus-fitted diagnostic plot

**Task:** The residuals-versus-fitted plot is the first diagnostic every analyst reads for non-linearity and non-constant variance. For the `mpg ~ wt` model on `mtcars`, plot residuals against fitted values with a horizontal reference line at zero, save the model to `ex_4_5`, and describe the pattern you see.

**Expected result:**

```
#> A scatterplot of residuals (y) against fitted values (x) for mpg ~ wt,
#> with a dashed horizontal reference line at 0. Points curve from positive
#> at the extremes toward negative in the middle, hinting at mild curvature
#> that a straight line misses.
```

**Difficulty:** Intermediate

[HINTS]
The diagnostic you want plots what the model got wrong (residuals) against what it predicted (fitted values).
Use `fitted()` and `residuals()` in `plot()`, then add `abline(h = 0, lty = 2)`.

```r title="Your turn"
ex_4_5 <- lm(mpg ~ wt, data = mtcars)
# plot residuals against fitted values with a reference line
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- lm(mpg ~ wt, data = mtcars)
plot(fitted(ex_4_5), residuals(ex_4_5),
     xlab = "Fitted mpg", ylab = "Residual",
     main = "Residuals vs Fitted: mpg ~ wt")
abline(h = 0, lty = 2)
#> A scatterplot with a dashed line at 0; residuals curve rather than scatter flat.
```

**Explanation:** A well-specified linear model shows residuals scattered flat around zero with no shape. Here the points bow, sitting above the line at both ends of the fitted range and below it in the middle, a signature of missing curvature that a term like `I(wt^2)` or a log transform can absorb. Reading this plot before trusting p values is essential, because curvature and funnel shapes quietly break the constant-variance and linearity assumptions that the standard errors depend on.

</details>

## Section 5. Prediction versus confidence intervals (4 problems)

A point prediction is rarely enough; the interval around it is the honest part. This section separates the two intervals people confuse most: the confidence interval for the mean response and the wider prediction interval for a single new case.

### Exercise 5.1: Predict a new value from a fitted model

**Task:** A park ranger models geyser eruption length from the wait since the last eruption using `eruptions ~ waiting` on the `faithful` dataset. Predict the eruption length (in minutes) for a wait of 80 minutes and save the single fitted value to `ex_5_1`.

**Expected result:**

```
#>       1 
#> 4.17622 
```

**Difficulty:** Beginner

[HINTS]
To score a model on a new case you hand it a small data frame whose column names match the predictors in the formula.
Fit the model, then call `predict(model, newdata = data.frame(waiting = 80))`.

```r title="Your turn"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_1 <- predict(m, newdata = data.frame(waiting = 80))
ex_5_1
#>       1 
#> 4.17622 
```

**Explanation:** `predict()` plugs the new `waiting` value into the fitted line $\hat{y} = -1.874 + 0.0756 \times \text{waiting}$, returning about `4.18` minutes for an 80-minute wait. The `newdata` column name must match the formula exactly, or `predict()` silently returns fitted values for the training rows instead. A bare point estimate hides all uncertainty, which is why the next problems attach intervals to this same number.

</details>

### Exercise 5.2: Build a confidence interval for the mean response

**Task:** The ranger wants a confidence interval for the average eruption length across all 80-minute waits, not just a point guess, from the `faithful` model `eruptions ~ waiting`. Produce the fit with a 95% confidence interval for the mean response and save the result to `ex_5_2`.

**Expected result:**

```
#>       fit      lwr      upr
#> 1 4.17622 4.104848 4.247592
```

**Difficulty:** Intermediate

[HINTS]
The interval for an average response is narrow because it only accounts for uncertainty in the fitted line, not in individual cases.
Add `interval = "confidence"` to your `predict()` call.

```r title="Your turn"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_2 <- predict(m, newdata = data.frame(waiting = 80),
                  interval = "confidence")
ex_5_2
#>       fit      lwr      upr
#> 1 4.17622 4.104848 4.247592
```

**Explanation:** A confidence interval answers "where is the mean eruption length for 80-minute waits?" and spans only about `4.10` to `4.25`, because it reflects uncertainty in the estimated line alone. It narrows as the sample grows and is tightest near the mean of `waiting`. This interval is the right one for statements about a group average, but it badly understates the spread you would see for any single future eruption, which is the job of the prediction interval.

</details>

### Exercise 5.3: Contrast a prediction interval with a confidence interval

**Task:** For a single future eruption after an 80-minute wait, the ranger needs a realistic range, not the interval for the average, using the `faithful` model `eruptions ~ waiting`. Produce the 95% prediction interval, save it to `ex_5_3`, and note how much wider it is than the confidence interval from the previous problem.

**Expected result:**

```
#>       fit      lwr      upr
#> 1 4.17622 3.196089 5.156351
```

**Difficulty:** Advanced

[HINTS]
A single new case carries its own irreducible scatter on top of the uncertainty in the line, so its interval must be wider.
Switch the argument to `interval = "prediction"`.

```r title="Your turn"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_3 <- predict(m, newdata = data.frame(waiting = 80),
                  interval = "prediction")
ex_5_3
#>       fit      lwr      upr
#> 1 4.17622 3.196089 5.156351
```

**Explanation:** The point estimate `4.18` is identical, but the prediction interval spans `3.20` to `5.16`, far wider than the confidence interval's `4.10` to `4.25`. The reason is variance: a prediction interval adds the residual variance $\sigma^2$ for an individual case to the variance of the fitted mean, so its half-width is built on $\sqrt{\sigma^2 + \text{Var}(\hat{y})}$. Confusing the two is a classic error; use confidence intervals for averages and prediction intervals for single new observations.

</details>

### Exercise 5.4: Predict across several new inputs at once

**Task:** The ranger wants fitted eruption lengths with confidence intervals for three representative waits (60, 75 and 90 minutes) in a single call to the `faithful` model `eruptions ~ waiting`. Produce a matrix of fit, lower and upper bounds for all three and save it to `ex_5_4`.

**Expected result:**

```
#>        fit      lwr      upr
#> 1 2.663661 2.587644 2.739678
#> 2 3.798080 3.736159 3.860002
#> 3 4.932499 4.830151 5.034847
```

**Difficulty:** Intermediate

[HINTS]
`predict()` is vectorised over rows, so a newdata frame with several rows returns one interval per row in one shot.
Pass `data.frame(waiting = c(60, 75, 90))` with `interval = "confidence"`.

```r title="Your turn"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m <- lm(eruptions ~ waiting, data = faithful)
ex_5_4 <- predict(m, newdata = data.frame(waiting = c(60, 75, 90)),
                  interval = "confidence")
ex_5_4
#>        fit      lwr      upr
#> 1 2.663661 2.587644 2.739678
#> 2 3.798080 3.736159 3.860002
#> 3 4.932499 4.830151 5.034847
```

**Explanation:** One `predict()` call scores every row of `newdata`, returning a matrix with a row per input, which is how you build a whole prediction table without looping. Notice the intervals are tightest for the 75-minute wait, closest to the mean of `waiting`, and widen toward the extremes: confidence bands flare as you move away from the center of the data. Extrapolating far past the observed wait range would widen them further and should be treated with suspicion.

</details>

## Section 6. Model comparison: adjusted R-squared, AIC, F-test (4 problems)

Adding predictors always raises R-squared, so honest comparison needs metrics that penalise complexity or test it formally. This section covers adjusted R-squared, AIC, and the nested-model F-test.

### Exercise 6.1: Compare models by adjusted R-squared

**Task:** Decide whether adding horsepower earns its place by comparing the simple model `mpg ~ wt` with `mpg ~ wt + hp` on `mtcars` using adjusted R-squared, which penalises extra terms. Extract both adjusted R-squared values into a named vector and save it to `ex_6_1`.

**Expected result:**

```
#>        m1        m2 
#> 0.7445939 0.8148396 
```

**Difficulty:** Intermediate

[HINTS]
Plain R-squared can only rise when you add predictors, so use the version that docks you for each extra term.
Pull `summary(model)$adj.r.squared` from each fit and combine into one named vector.

```r title="Your turn"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_1 <- c(m1 = summary(m1)$adj.r.squared,
            m2 = summary(m2)$adj.r.squared)
ex_6_1
#>        m1        m2 
#> 0.7445939 0.8148396 
```

**Explanation:** Adjusted R-squared rose from `0.745` to `0.815` when `hp` entered, so horsepower explains genuinely new variance rather than padding the fit. Unlike ordinary R-squared, the adjusted version can fall when a useless predictor is added, because its penalty for parameters outweighs a trivial gain in fit. That makes it a safe quick screen, though it only ranks models on the same response and is not a formal significance test, which the F-test provides.

</details>

### Exercise 6.2: Compare models by AIC

**Task:** Score the same two `mtcars` models, `mpg ~ wt` and `mpg ~ wt + hp`, on the Akaike information criterion, which trades goodness of fit against parameter count so that lower is better. Produce the AIC table for both fits and save it to `ex_6_2`.

**Expected result:**

```
#>    df      AIC
#> m1  3 166.0294
#> m2  4 156.6523
```

**Difficulty:** Intermediate

[HINTS]
This criterion rewards fit and punishes parameters, and you read it in the opposite direction from R-squared: smaller wins.
Pass both fitted models to `AIC(m1, m2)`.

```r title="Your turn"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_2 <- AIC(m1, m2)
ex_6_2
#>    df      AIC
#> m1  3 166.0294
#> m2  4 156.6523
```

**Explanation:** AIC estimates out-of-sample prediction error up to a constant, so only differences matter; the two-predictor model wins by about 9.4 AIC units, a gap large enough (a difference above ~10 is decisive) to prefer it clearly. The `df` column counts estimated parameters, including the error variance. Unlike the F-test, AIC can compare non-nested models, which is why it is the workhorse for stepwise selection, though it still assumes the same response and dataset across candidates.

</details>

### Exercise 6.3: Run a nested-model F-test with anova

**Task:** Formally test whether horsepower belongs in the model by comparing the nested pair `mpg ~ wt` and `mpg ~ wt + hp` on `mtcars` with an analysis-of-variance F-test. Produce the anova comparison table and save it to `ex_6_3`, then read the F statistic and its p value.

**Expected result:**

```
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt
#> Model 2: mpg ~ wt + hp
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)   
#> 1     30 278.32                                
#> 2     29 195.05  1    83.274 12.381 0.001451 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Advanced

[HINTS]
This test compares two models where one is a special case of the other, asking whether the extra term cut the residual sum of squares by more than chance.
Pass both fits, simpler first, to `anova(m1, m2)`.

```r title="Your turn"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
ex_6_3 <- anova(m1, m2)
ex_6_3
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt
#> Model 2: mpg ~ wt + hp
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)   
#> 1     30 278.32                                
#> 2     29 195.05  1    83.274 12.381 0.001451 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Explanation:** The F-test asks whether adding `hp` reduces the residual sum of squares by more than random noise would. Here $F = 12.38$ on 1 and 29 degrees of freedom gives $p = 0.0015$, so horsepower's contribution is real. This test is exact for nested linear models fitted on identical rows, and for a single added term its p value matches that predictor's t-test p value. Use it when one model strictly contains the other; reach for AIC when they do not.

</details>

### Exercise 6.4: Test a whole block of dummy variables at once

**Task:** Cylinder count enters as two dummy columns, so its overall contribution needs one joint test, not two separate reads. On `mtcars`, compare `mpg ~ wt + hp` with `mpg ~ wt + hp + factor(cyl)` using anova and save the comparison table to `ex_6_4`, then judge whether cylinders add signal beyond weight and horsepower.

**Expected result:**

```
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + hp + factor(cyl)
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)  
#> 1     29 195.05                              
#> 2     27 160.78  2     34.27 2.8776 0.07364 .
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Difficulty:** Intermediate

[HINTS]
A factor with three levels adds two coefficients, and the joint test evaluates them together rather than one dummy row at a time.
Fit both models and compare them with `anova(m2, m3)`.

```r title="Your turn"
m2 <- lm(mpg ~ wt + hp, data = mtcars)
m3 <- lm(mpg ~ wt + hp + factor(cyl), data = mtcars)
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m2 <- lm(mpg ~ wt + hp, data = mtcars)
m3 <- lm(mpg ~ wt + hp + factor(cyl), data = mtcars)
ex_6_4 <- anova(m2, m3)
ex_6_4
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ wt + hp
#> Model 2: mpg ~ wt + hp + factor(cyl)
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)  
#> 1     29 195.05                              
#> 2     27 160.78  2     34.27 2.8776 0.07364 .
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

**Explanation:** The two cylinder dummies use 2 degrees of freedom, and the F-test judges them jointly: $F = 2.88$ with $p = 0.074$ falls just short of the `0.05` line, so cylinders add only weak evidence once weight and horsepower are present. Testing the block together is the correct move, because scanning the two individual dummy p values separately would multiply the chance of a false positive and could not answer "does cylinder count matter at all?" in one number.

</details>

## What to do next

You have fit, interpreted, diagnosed, predicted and compared. Keep the momentum with these related hubs:

- [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) for a broader drill on simple and multiple regression mechanics.
- [Multiple Regression Exercises in R](Multiple-Regression-Exercises-in-R.html) to go deeper on many-predictor models and multicollinearity.
- [Logistic Regression Exercises in R](Logistic-Regression-Exercises-in-R.html) when your response is a yes or no outcome instead of a number.
- [Cross-Validation Exercises in R](Cross-Validation-Exercises-in-R.html) to measure how well these models actually predict on unseen data.

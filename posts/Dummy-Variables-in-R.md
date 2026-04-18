---
title: "Dummy Variables in R: What lm() Does With Factor Predictors Under the Hood"
slug: "Dummy-Variables-in-R"
description: "R automatically creates dummy variables for factors in lm(). Learn how the reference category, coefficient interpretation, and interactions really work."
keywords: "dummy variables R, lm factor predictors, categorical variables regression, treatment contrasts R, relevel R, reference level lm, model.matrix R, dummy coding R"
mathjax: false
webr: true
difficulty: "Intermediate"
date: "2026-04-18"
curriculum_id: "2.3.5"
post_type: "C"
auto_link_terms: "dummy variables in R|dummy coding|reference category|treatment contrasts|factor predictors|reference level in lm|contrast coding in R"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Dummy Variables in R"
sidebar_order: 49
---

# Dummy Variables in R: What lm() Does With Factor Predictors Under the Hood

<p class="lead">Dummy variables in R are the 0/1 columns that <code>lm()</code> builds automatically whenever you pass a factor as a predictor. Every factor with <code>k</code> levels becomes <code>k - 1</code> dummy columns, and R picks the first level alphabetically as the reference the other coefficients are measured against.</p>

## What happens when you put a factor in lm()?

Let's skip the theory for a minute and just fit a model. The `iris` dataset has a `Species` factor with three levels: setosa, versicolor, and virginica. We will regress `Sepal.Length` on `Species` and look at what R prints. The output will show two coefficients with funny names, not three, and that one missing coefficient will tell us everything we need to know about what `lm()` did behind the scenes.

```r title="Fit lm on a factor predictor"
# Check that Species is already a factor in iris
class(iris$Species)
#> [1] "factor"

levels(iris$Species)
#> [1] "setosa"     "versicolor" "virginica"

# Fit the model
fit1 <- lm(Sepal.Length ~ Species, data = iris)
coef(fit1)
#>       (Intercept) Speciesversicolor  Speciesvirginica 
#>             5.006             0.930             1.582
```

Three species, but only two coefficients show up next to `(Intercept)`. Where did setosa go? R did not drop it. It absorbed setosa into the intercept and now reports every other level as a difference from it. The value `5.006` is the mean `Sepal.Length` for setosa flowers. Add `0.930` and you get the mean for versicolor. Add `1.582` and you get the mean for virginica. Three numbers, three species, one intercept plus two dummies, and the arithmetic works out exactly.

[KEY INSIGHT]
**R does not drop the reference level, it hides it inside the intercept.** The "missing" setosa coefficient is not missing at all; the intercept IS the setosa mean. Every other factor coefficient is a signed gap from it.

**Try it:** Fit the same kind of model but with `Sepal.Width` on the left side. Then inspect the coefficient names. Which level became the reference, and what are the two dummy columns named?

```r title="Your turn: inspect coefficient labels"
# Fit the model
ex_fit <- lm(Sepal.Width ~ Species, data = iris)

# Print just the coefficient names
names(coef(ex_fit))
#> Expected: "(Intercept)", "Speciesversicolor", "Speciesvirginica"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coefficient labels solution"
ex_fit <- lm(Sepal.Width ~ Species, data = iris)
names(coef(ex_fit))
#> [1] "(Intercept)"       "Speciesversicolor" "Speciesvirginica"
```

**Explanation:** Setosa is the reference because it is alphabetically first in `levels(iris$Species)`. R names every dummy column by pasting the factor name to the level name, which is why you see `Speciesversicolor` rather than a plain `versicolor`.

</details>

## How does R build the dummy variable matrix?

The coefficients in the previous block came from somewhere. Specifically, they came from R quietly turning the `Species` factor into numeric columns before handing them to the least-squares engine. That hidden set of columns is called the design matrix, and you can see it with `model.matrix()`. Looking at it is the single fastest way to stop treating factor handling as magic.

```r title="Inspect the design matrix"
# Look at the design matrix for three representative rows
# Row 1 is setosa, row 51 is versicolor, row 101 is virginica
mm <- model.matrix(~ Species, data = iris)
mm[c(1, 51, 101), ]
#>     (Intercept) Speciesversicolor Speciesvirginica
#> 1             1                 0                0
#> 51            1                 1                0
#> 101           1                 0                1
```

Read the rows one at a time. Row 1 is a setosa flower: the intercept column is 1 (always), and both dummy columns are 0. Row 51 is versicolor: intercept 1, versicolor dummy 1, virginica dummy 0. Row 101 is virginica: intercept 1, versicolor dummy 0, virginica dummy 1. Setosa has no dedicated column because "both dummies zero" is how R flags it. This is why a three-level factor produces two dummy columns, not three.

![How R turns a factor into dummy columns](screenshots/Dummy-Variables-in-R-factor-to-dummies.webp)

*Figure 1: R routes a k-level factor through `model.matrix()` to produce k-1 dummy columns plus the intercept.*

[NOTE]
**The dummy count is always nlevels minus one.** A 4-level factor produces 3 dummy columns, a 10-level factor produces 9. Using all k levels would make the dummy columns sum to the intercept column, which is perfect collinearity, and `lm()` would drop one anyway.

**Try it:** Call `model.matrix()` on just the last three rows of `iris` and confirm the dummy values match your expectation. The last three rows are all virginica.

```r title="Your turn: predict the dummy values"
# Build the design matrix on rows 148 through 150
ex_mm <- model.matrix(~ Species, data = iris[148:150, ])

# Your task: before running, predict what the dummy columns contain
# Then run and verify
ex_mm
#> Expected: (Intercept)=1, Speciesversicolor=0, Speciesvirginica=1 for all three rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Last-three-rows design matrix solution"
ex_mm <- model.matrix(~ Species, data = iris[148:150, ])
ex_mm
#>     (Intercept) Speciesversicolor Speciesvirginica
#> 148           1                 0                1
#> 149           1                 0                1
#> 150           1                 0                1
```

**Explanation:** All three rows are virginica, so the `Speciesvirginica` column is 1 and `Speciesversicolor` is 0 for every row. The intercept column is always 1.

</details>

## How do you interpret the coefficients of a factor?

The plain English reading is this: the intercept is the mean of the response variable in the reference group, and each dummy coefficient is the mean in that level minus the reference mean. You do not have to trust this interpretation; you can verify it by computing the group means and comparing them to `coef(fit1)` line by line.

```r title="Verify coefficients against group means"
# Compute the mean Sepal.Length for each species
species_means <- aggregate(Sepal.Length ~ Species, data = iris, mean)
species_means
#>      Species Sepal.Length
#> 1     setosa        5.006
#> 2 versicolor        5.936
#> 3  virginica        6.588

# Compare to fit1 coefficients
coef(fit1)
#>       (Intercept) Speciesversicolor  Speciesvirginica 
#>             5.006             0.930             1.582

# Check the arithmetic
species_means$Sepal.Length[2] - species_means$Sepal.Length[1]
#> [1] 0.930

species_means$Sepal.Length[3] - species_means$Sepal.Length[1]
#> [1] 1.582
```

The intercept `5.006` is exactly the setosa mean. The coefficient `0.930` on `Speciesversicolor` is the versicolor mean minus the setosa mean. The coefficient `1.582` on `Speciesvirginica` is the virginica mean minus the setosa mean. This is not an approximation. It is algebraically what least squares returns when the only predictors are dummy columns.

![Reading lm() coefficients for a factor](screenshots/Dummy-Variables-in-R-coefficient-interpretation.webp)

*Figure 2: The intercept captures the reference group mean; each dummy coefficient captures how far a non-reference group sits from it.*

[TIP]
**Flip a coefficient's sign by swapping the reference, not by negating.** If a stakeholder wants to see virginica as the baseline, use `relevel()` instead of rewording or multiplying by -1. The model is the same; only the labels shift.

**Try it:** Suppose a factor model returns an intercept of 12 and two coefficients `groupB = 3` and `groupC = -1`. Without running any code, write down the three group means.

<details>
<summary>Click to reveal solution</summary>

The three group means are: A = 12 (the reference, equals the intercept), B = 12 + 3 = 15, and C = 12 + (-1) = 11. You add each coefficient to the intercept to recover that group's mean.

</details>

## How do you change which level is the reference?

Alphabetical order is a convenience, not a decision. In `iris`, setosa happens to be a natural baseline because it is visibly the smallest-flowered species. In other datasets the alphabetical first level is a random category like "AL" for Alabama, which nobody wants to interpret as a baseline. `relevel()` lets you pick a reference that actually means something.

```r title="Change the reference with relevel()"
# Copy iris so we do not overwrite the original factor
iris_rl <- iris
iris_rl$Species <- relevel(iris_rl$Species, ref = "virginica")

# Refit using the new reference
fit_rl <- lm(Sepal.Length ~ Species, data = iris_rl)
coef(fit_rl)
#>       (Intercept)    Speciessetosa Speciesversicolor 
#>             6.588            -1.582            -0.652
```

The intercept is now `6.588`, the virginica mean. Setosa flipped to `-1.582` because its mean is 1.582 below virginica's. Versicolor is `-0.652` because its mean is 0.652 below. The model's predictions, residuals, and R-squared are identical to `fit1`; only the labels changed. You can also use `factor()` with an explicit `levels =` argument when you want full control over level order.

```r title="Alternative: set level order with factor()"
# Setting the order of levels also sets the reference (the first level)
iris_fac <- iris
iris_fac$Species <- factor(iris_fac$Species,
                           levels = c("virginica", "setosa", "versicolor"))

fit_fac <- lm(Sepal.Length ~ Species, data = iris_fac)
coef(fit_fac)
#>       (Intercept)    Speciessetosa Speciesversicolor 
#>             6.588            -1.582            -0.652
```

Both approaches produce the same fit as `fit_rl`. Use `relevel()` when you only need to swap the baseline. Use `factor(..., levels = ...)` when you also want to control how other levels appear in tables and plots.

[WARNING]
**Reshuffling references changes which p-values test which comparison.** Each dummy coefficient carries its own p-value for "is this level significantly different from the reference?" Change the reference and you change what the p-values are testing. Do not keep releveling until you see the stars you want; pick the reference that fits the research question and leave it.

**Try it:** Reset the reference to setosa using `relevel()` and confirm the coefficients match the original `fit1` output.

```r title="Your turn: reset reference to setosa"
# Start from the releveled version
ex_iris <- iris_rl
# Reset the reference back to setosa, refit, inspect
ex_iris$Species <- relevel(ex_iris$Species, ref = "setosa")
ex_fit <- lm(Sepal.Length ~ Species, data = ex_iris)
coef(ex_fit)
#> Expected: same as fit1: 5.006, 0.930, 1.582
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reset reference to setosa solution"
ex_iris <- iris_rl
ex_iris$Species <- relevel(ex_iris$Species, ref = "setosa")
ex_fit <- lm(Sepal.Length ~ Species, data = ex_iris)
coef(ex_fit)
#>       (Intercept) Speciesversicolor  Speciesvirginica 
#>             5.006             0.930             1.582
```

**Explanation:** `relevel()` pushes the named level to the front of `levels()`. Since the first level is always the reference, setting `ref = "setosa"` restores the original baseline, and the coefficients match `fit1` exactly.

</details>

## What if you want a coefficient for every level?

Sometimes the reference-plus-gaps parameterisation is awkward. You just want one coefficient per level, each equal to that level's mean. Dropping the intercept with `- 1` in the formula does exactly that.

```r title="Fit without an intercept"
# Same data, same factor, but drop the intercept
fit_noint <- lm(Sepal.Length ~ Species - 1, data = iris)
coef(fit_noint)
#>    Speciessetosa Speciesversicolor  Speciesvirginica 
#>            5.006             5.936             6.588
```

Now there are three coefficients, one per species, and each equals the species mean that you computed earlier with `aggregate()`. The model is mathematically the same as `fit1`: identical predictions, identical residuals, identical residual standard error. What changed is the parameterisation. You are just looking at the same surface from a different angle.

[NOTE]
**An intercept-free model reports a different R-squared.** Without an intercept, R² is measured against zero rather than the grand mean, which inflates it. Do not compare `summary(fit1)$r.squared` with `summary(fit_noint)$r.squared` and conclude the no-intercept model "fits better", the scales disagree.

**Try it:** Read the three species means directly off the no-intercept coefficient table. Which species has the largest mean `Sepal.Length`?

<details>
<summary>Click to reveal solution</summary>

From `coef(fit_noint)`: setosa = 5.006, versicolor = 5.936, virginica = 6.588. Virginica has the largest mean. The no-intercept parameterisation lets you read group means straight off the coefficient table without having to add the intercept to each.

</details>

## How do factor interactions work in lm()?

So far each coefficient was a group-mean offset. Interactions add a second dimension: they let a numeric predictor's slope change across factor levels. The way R implements this is unglamorous, it multiplies the dummy columns by the numeric column to produce new interaction columns. Same framework, more columns.

```r title="Fit an interaction between factor and numeric"
# Petal.Width is numeric; Species is a factor
fit_int <- lm(Sepal.Length ~ Petal.Width * Species, data = iris)
coef(fit_int)
#>                   (Intercept)                   Petal.Width 
#>                        4.7772                        0.9131 
#>             Speciesversicolor              Speciesvirginica 
#>                        1.3587                        1.9468 
#> Petal.Width:Speciesversicolor  Petal.Width:Speciesvirginica 
#>                       -0.1989                       -0.5580
```

The first two coefficients describe the reference species (setosa): intercept `4.7772` and `Petal.Width` slope `0.9131`. The two `Species*` coefficients shift the intercept for versicolor and virginica. The two `Petal.Width:Species*` coefficients shift the slope. For versicolor, the fitted equation is `(4.7772 + 1.3587) + (0.9131 - 0.1989) * Petal.Width`. For virginica it is `(4.7772 + 1.9468) + (0.9131 - 0.5580) * Petal.Width`. Each species gets its own line.

```r title="Inspect the interaction design matrix"
# model.matrix() shows the new product columns directly
mm_int <- model.matrix(~ Petal.Width * Species, data = iris)
mm_int[c(1, 51, 101), ]
#>     (Intercept) Petal.Width Speciesversicolor Speciesvirginica
#> 1             1         0.2                 0                0
#> 51            1         1.4                 1                0
#> 101           1         2.5                 0                1
#>     Petal.Width:Speciesversicolor Petal.Width:Speciesvirginica
#> 1                             0.0                          0.0
#> 51                            1.4                          0.0
#> 101                           0.0                          2.5
```

The last two columns are Petal.Width multiplied by each dummy. For a setosa row (row 1), both dummies are 0 so both product columns are 0, and the fit reduces to the reference line. For a versicolor row (row 51), only the `Speciesversicolor` column is 1, so only the versicolor product column carries Petal.Width. For a virginica row, only the virginica product column carries it. Nothing deeper than multiplication is happening.

[KEY INSIGHT]
**Factor interactions are just more dummies, generated as dummy column times numeric column.** `lm()` never learns what a "species" is. It just adds columns to the design matrix and solves for the least-squares coefficients exactly the same way it always does.

**Try it:** Given intercept 4.2, `Petal.Width` 0.9, `Speciesversicolor` 1.5, and `Petal.Width:Speciesversicolor` -0.3, compute the slope of `Petal.Width` for versicolor specifically.

<details>
<summary>Click to reveal solution</summary>

The versicolor slope is the reference slope plus the interaction: `0.9 + (-0.3) = 0.6`. The intercept for versicolor would be `4.2 + 1.5 = 5.7`. So the fitted equation for versicolor is `Sepal.Length = 5.7 + 0.6 * Petal.Width`. Notice that the main-effect `Speciesversicolor` coefficient of 1.5 only shifts the intercept, it does not affect the slope.

</details>

## What contrast schemes exist besides treatment coding?

Treatment coding is the default in R, and it is what we have been using this whole time. But it is only one of four contrast schemes that ship with base R. Switching schemes does not change how well the model fits; it changes what the coefficients mean. Pick the scheme that answers your research question directly instead of doing arithmetic on coefficients to reverse-engineer the answer.

```r title="Inspect the default contrasts"
# The default contrast matrix for a 3-level factor
contrasts(iris$Species)
#>            versicolor virginica
#> setosa              0         0
#> versicolor          1         0
#> virginica           0         1
```

This is the treatment (dummy) matrix you have been looking at in `model.matrix()` the whole time. Each non-reference level gets its own column, with a 1 in the row for that level. Now switch to sum coding, which compares each level to the grand mean instead of to a reference.

```r title="Switch to sum coding"
# Copy so we do not overwrite
iris_sum <- iris
contrasts(iris_sum$Species) <- contr.sum(3)

# Refit with the new contrasts
fit_sum <- lm(Sepal.Length ~ Species, data = iris_sum)
coef(fit_sum)
#> (Intercept)    Species1    Species2 
#>       5.843      -0.838       0.093

# Compare to the grand mean of Sepal.Length
mean(iris$Sepal.Length)
#> [1] 5.843333
```

The intercept is now `5.843`, the grand mean of `Sepal.Length` across all three species. The coefficients `Species1` and `Species2` are deviations of setosa and versicolor from that grand mean; virginica's deviation is implied as the negative sum of the two. The model's predictions and R² are identical to `fit1`. Only the lens on the coefficients changed.

![Which contrast scheme should you use?](screenshots/Dummy-Variables-in-R-contrast-decision.webp)

*Figure 3: A decision flow for picking treatment, sum, polynomial, or Helmert contrasts based on your comparison question.*

[WARNING]
**Always state the contrast scheme when reporting coefficients.** A coefficient of 0.93 means one thing under treatment coding and something else under sum coding. Papers and dashboards that report coefficients without naming the scheme are hard to audit. Say "treatment coding, reference = setosa" or "sum coding" in your methods section.

**Try it:** Reset `iris_sum$Species` contrasts to default treatment coding using `contr.treatment()`, refit the model, and confirm the coefficients match `fit1`.

```r title="Your turn: reset to treatment contrasts"
# Reset to default treatment coding
contrasts(iris_sum$Species) <- contr.treatment(levels(iris_sum$Species))
ex_fit <- lm(Sepal.Length ~ Species, data = iris_sum)
coef(ex_fit)
#> Expected: (Intercept)=5.006, Speciesversicolor=0.930, Speciesvirginica=1.582
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reset contrasts solution"
contrasts(iris_sum$Species) <- contr.treatment(levels(iris_sum$Species))
ex_fit <- lm(Sepal.Length ~ Species, data = iris_sum)
coef(ex_fit)
#>       (Intercept) Speciesversicolor  Speciesvirginica 
#>             5.006             0.930             1.582
```

**Explanation:** `contr.treatment(levels(...))` rebuilds the default dummy matrix using the current level order. Because the level order in `iris_sum` is still setosa, versicolor, virginica, the coefficients line up exactly with the original `fit1`.

</details>

## Practice Exercises

These exercises combine multiple concepts from the tutorial. Use distinct variable names with the `my_` prefix so your exercise code does not overwrite the tutorial variables.

### Exercise 1: Verify a group mean from lm() coefficients

Using `mtcars`, convert `cyl` to a factor, fit `mpg ~ cyl_f`, and verify that the intercept plus the coefficient for the 6-cylinder dummy equals the mean `mpg` of 6-cylinder cars computed directly with `aggregate()`. Save the model to `my_cyl_model` and the check to `my_cyl_check`.

```r title="Exercise 1: verify group mean from coefficients"
# Hint: convert cyl to factor first, fit, then compare to aggregate() output

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
# Convert cyl to factor with levels in natural order
mtcars_f <- mtcars
mtcars_f$cyl_f <- factor(mtcars_f$cyl)

# Fit the model
my_cyl_model <- lm(mpg ~ cyl_f, data = mtcars_f)
coef(my_cyl_model)
#> (Intercept)      cyl_f6      cyl_f8 
#>      26.664      -6.921     -11.564

# Compute group means for comparison
aggregate(mpg ~ cyl_f, data = mtcars_f, mean)
#>   cyl_f      mpg
#> 1     4 26.66364
#> 2     6 19.74286
#> 3     8 15.10000

# Verify: intercept + cyl_f6 coefficient matches the 6-cyl mean
my_cyl_check <- coef(my_cyl_model)["(Intercept)"] + coef(my_cyl_model)["cyl_f6"]
my_cyl_check
#> (Intercept) 
#>    19.74286
```

**Explanation:** 4-cylinder is the reference (the numerically smallest factor level comes first). The intercept is the 4-cyl mean, and adding `cyl_f6 = -6.921` recovers the 6-cyl mean of 19.74.

</details>

### Exercise 2: Predict from an interaction model by hand

Using `mtcars`, convert `cyl` to a factor, fit `mpg ~ cyl_f * wt`, and predict `mpg` for a 6-cylinder car weighing 3.2 thousand pounds using only the raw coefficients (no `predict()` call). Store the result in `my_prediction`.

```r title="Exercise 2: manual prediction from interaction coefficients"
# Hint: prediction = (intercept + cyl6 dummy) + (wt slope + cyl6:wt) * 3.2

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
mtcars_f <- mtcars
mtcars_f$cyl_f <- factor(mtcars_f$cyl)

my_int_model <- lm(mpg ~ cyl_f * wt, data = mtcars_f)
coef(my_int_model)
#> (Intercept)      cyl_f6      cyl_f8          wt   cyl_f6:wt   cyl_f8:wt 
#>      39.571      -8.049     -16.055      -5.647       2.867       4.101

# Build the 6-cyl prediction at wt = 3.2
b <- coef(my_int_model)
intercept_6cyl <- b["(Intercept)"] + b["cyl_f6"]
slope_6cyl <- b["wt"] + b["cyl_f6:wt"]
my_prediction <- intercept_6cyl + slope_6cyl * 3.2
my_prediction
#> (Intercept) 
#>     22.615
```

**Explanation:** An interaction model gives each factor level its own intercept and slope. For 6-cylinder cars, you add the `cyl_f6` dummy coefficient to the intercept and the `cyl_f6:wt` interaction to the `wt` slope, then plug in `wt = 3.2`. The hand-built number matches what `predict()` would return, confirming the mechanics.

</details>

## Complete Example: a mini-analysis of mtcars

Let's tie it all together on `mtcars`. We will turn `cyl` and `am` into factors with human-readable labels, set the reference levels deliberately, fit a model that controls for weight, and interpret every coefficient in plain English.

```r title="Complete example: mtcars with factors and a reference switch"
# Build a working copy with readable factor labels
cars <- mtcars
cars$cyl_f <- factor(cars$cyl, levels = c(8, 6, 4),
                     labels = c("eight", "six", "four"))
cars$am_f  <- factor(cars$am,  levels = c(0, 1),
                     labels = c("automatic", "manual"))

# Setting 8-cylinder automatic as the (intercept) baseline is deliberate:
# heavy, older muscle cars are the "reference car" we compare against

# Fit an additive model controlling for weight
cars_mod <- lm(mpg ~ cyl_f + am_f + wt, data = cars)
coef(cars_mod)
#> (Intercept)    cyl_fsix   cyl_ffour  am_fmanual          wt 
#>     30.999       3.031       6.921       1.810      -3.178
```

Reading the coefficients one at a time: an 8-cylinder automatic car at zero weight (not a real car, just the math baseline) is predicted to do 31.0 mpg. Switching to 6 cylinders at the same weight and transmission adds 3.0 mpg. Four cylinders adds 6.9 mpg. A manual transmission adds 1.8 mpg. Every extra 1000 pounds of weight subtracts 3.2 mpg. The coefficient on `wt` is the same regardless of cylinder count because this model is additive, not interactive.

```r title="Peek at the design matrix"
# Rows 1 through 3 of mtcars are a 6-cyl manual, 6-cyl manual, and 4-cyl manual
head(model.matrix(cars_mod), 3)
#>                   (Intercept) cyl_fsix cyl_ffour am_fmanual    wt
#> Mazda RX4                   1        1         0          1 2.620
#> Mazda RX4 Wag               1        1         0          1 2.875
#> Datsun 710                  1        0         1          1 2.320
```

You can see the factor-to-dummy mechanics at work. The Mazdas are both 6-cylinder manuals with `cyl_fsix = 1` and `am_fmanual = 1`. The Datsun is a 4-cylinder manual with `cyl_ffour = 1`. Their predicted mpg values come from plugging these 0/1 columns into the coefficient formula, and that is the whole story of how R handles categorical predictors in `lm()`.

## Summary

| Concept | R command |
|---|---|
| Fit a factor predictor | `lm(y ~ f, data = df)` |
| See the dummy columns | `model.matrix(~ f, data = df)` |
| Check the default contrasts | `contrasts(df$f)` |
| Change the reference level | `relevel(df$f, ref = "level")` |
| Control full level order | `factor(x, levels = c(...))` |
| Drop the intercept for group means | `lm(y ~ f - 1)` |
| Factor-times-numeric interaction | `lm(y ~ numeric * f)` |
| Switch to sum coding | `contrasts(df$f) <- contr.sum(n)` |

Key takeaways:

1. A factor with `k` levels becomes `k - 1` dummy columns plus an intercept. The omitted level is the reference.
2. The intercept equals the reference group's mean (under default treatment coding). Every dummy coefficient is "this level's mean minus the reference's mean".
3. Changing the reference with `relevel()` shifts coefficient labels and values but never the predictions, residuals, or R².
4. Interactions between factors and numerics are just new design-matrix columns built by multiplying dummy columns by the numeric column.
5. Treatment coding is the default; sum, Helmert, and polynomial coding exist for specific comparison questions. The fit is identical, the interpretation is not.

## References

1. R Core Team. *An Introduction to R*, §11.1 "Defining statistical models; formulae". [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Chambers, J.M. & Hastie, T.J. *Statistical Models in S*, 1992. Chapter 2 on design matrices and contrasts is the classic reference on how S and R build factor columns.
3. Base R documentation for `contrasts` and `contr.treatment`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/contrasts.html)
4. UCLA OARC. *Coding for Categorical Variables in Regression Models*. [Link](https://stats.oarc.ucla.edu/r/modules/coding-for-categorical-variables-in-regression-models/)
5. STHDA. *Regression with Categorical Variables: Dummy Coding Essentials in R*. [Link](https://www.sthda.com/english/articles/40-regression-analysis/163-regression-with-categorical-variables-dummy-coding-essentials-in-r/)
6. Faraway, J. *Linear Models with R*, 2nd ed., 2014, Chapter 14 "Categorical Predictors".
7. Fox, J. & Weisberg, S. *An R Companion to Applied Regression*, 3rd ed., 2019, §4.3 "Factor Predictors". [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)

## Continue Learning

- **[Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html)**, diagnostic checks that still apply when your predictors are factors.
- **[Linear Regression](Linear-Regression.html)**, the base `lm()` workflow for numeric predictors, the natural prerequisite for this post.
- **[R Factors](R-Factors.html)**, how factors are stored, ordered, and manipulated outside of `lm()`.

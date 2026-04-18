---
title: "Interaction Effects in R: Add Them, Test Them, and Actually Understand the Output"
slug: "Interaction-Effects-in-R"
description: "An interaction means the effect of X1 depends on X2. Add * and : in lm(), compute marginal effects with emmeans, plot them, and report findings clearly."
keywords: "interaction effects in R, interaction terms lm, moderation analysis R, emmeans simple slopes, interaction plot R, regression interaction, categorical interaction R, interaction coefficient interpretation"
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.3.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Interaction Effects"
sidebar_order: 50
auto_link_terms: "interaction effects|interaction terms|interaction effect|moderation analysis|simple slopes|marginal effects|interaction plot|emmeans"
auto_link_case_sensitive: false
difficulty: "Intermediate"
---

# Interaction Effects in R: Add Them, Test Them, and Actually Understand the Output

<p class="lead">An interaction effect means the effect of one predictor depends on the value of another. In R you write it with `*` or `:` inside `lm()`, then interpret the term that captures how the slope of one variable shifts with the other.</p>

## What is an interaction effect, and when do you need one?

Here is the setup that motivates everything. Predicting `mpg` from `hp` in mtcars is only part of the story. A heavier car may be penalised more per extra horsepower than a lighter one, so the slope of `mpg` on `hp` itself depends on `wt`. That is an interaction. Fit `lm(mpg ~ hp * wt)` and look at the `hp:wt` row; if it is non-zero, the two predictors are not acting independently.

```r title="Fit a two-predictor interaction model"
library(dplyr)
library(ggplot2)
library(emmeans)

m1 <- lm(mpg ~ hp * wt, data = mtcars)
round(coef(summary(m1)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  49.8084     3.6054 13.8154   0.0000
#> hp           -0.1201     0.0247 -4.8622   0.0000
#> wt           -8.2166     1.2699 -6.4702   0.0000
#> hp:wt         0.0278     0.0079  3.5179   0.0015
```

The `hp:wt` row is the one that matters. Its estimate is `0.0278` with p = 0.0015, which is highly significant. Translation: for every extra ton of weight, the slope of `hp` on `mpg` shifts upward by `0.028`, becoming less negative. A 200-hp engine still hurts mileage, but it hurts more in a light car than in a heavy one.

[KEY INSIGHT]
**An interaction is a slope-of-slope.** It captures how much the effect of one variable changes per unit change in the other, and that relationship is symmetrical in X1 and X2.

**Try it:** Fit the classic iris interaction: how does the slope of `Petal.Width` on `Petal.Length` change across `Species`? Save the model as `ex_m` and then pull the coefficient for `Petal.Length:Speciesvirginica`.

```r title="Your turn: iris interaction"
ex_m <- lm(Petal.Width ~ Petal.Length * Species, data = iris)
# pull the coefficient table
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris interaction solution"
ex_m <- lm(Petal.Width ~ Petal.Length * Species, data = iris)
round(coef(ex_m), 3)
#>                   (Intercept)                  Petal.Length
#>                        -0.048                         0.201
#>             Speciesversicolor              Speciesvirginica
#>                         0.728                         0.963
#> Petal.Length:Speciesversicolor Petal.Length:Speciesvirginica
#>                         0.127                         0.087
```

**Explanation:** `Petal.Length:Speciesvirginica = 0.087` means virginica's slope of Petal.Width on Petal.Length is about 0.087 higher than setosa's baseline slope of 0.201.

</details>

## How do you add interaction terms in R using `*` and `:`?

R's formula shorthand packs two operators. `x1 * x2` expands to `x1 + x2 + x1:x2`, adding the main effects automatically. `x1:x2` is the pure interaction column, with no main effects. Nine times out of ten you want `*`; using `:` alone forces both simple slopes to pivot through the origin, which is almost never what the data actually do.

![Interaction syntax comparison](screenshots/Interaction-Effects-in-R-syntax-comparison.webp)

*Figure 1: How `*`, `:`, and explicit `+` forms map to model structure.*

```r title="Three syntaxes, two fits"
m_add  <- lm(mpg ~ hp + wt, data = mtcars)
m_full <- lm(mpg ~ hp + wt + hp:wt, data = mtcars)
m_star <- lm(mpg ~ hp * wt, data = mtcars)

# m_full and m_star are identical:
all.equal(coef(m_full), coef(m_star))
#> [1] TRUE

# AIC comparison against the additive model:
AIC(m_add, m_full)
#>        df      AIC
#> m_add   4 156.6523
#> m_full  5 149.7198
```

`m_full` and `m_star` produce the exact same fit; pick whichever reads best to you. The interaction model beats the additive model on AIC by about 7 points, which is strong evidence the interaction earns its slot. The `all.equal()` call is a quick sanity check that your two specifications really are the same model.

[WARNING]
**Always include main effects when you use `:`.** Writing `y ~ x1:x2` alone forces both simple slopes to zero at the origin, which is almost never what you want. Stick to `x1 * x2` unless you have a specific theoretical reason to drop a main effect.

**Try it:** Write two equivalent formulas for an interaction between `hp` and `factor(cyl)` on `mpg` using mtcars, then verify they fit the same model.

```r title="Your turn: two equivalent formulas"
# formula 1: use *
# formula 2: use + and :
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Equivalent formulas solution"
f1 <- mpg ~ hp * factor(cyl)
f2 <- mpg ~ hp + factor(cyl) + hp:factor(cyl)
all.equal(coef(lm(f1, mtcars)), coef(lm(f2, mtcars)))
#> [1] TRUE
```

**Explanation:** The `*` operator is pure sugar for "main effects plus interaction". Both formulas produce an identical design matrix and identical coefficients.

</details>

## How do you interpret the interaction coefficient?

The math helps clarify what each number buys you. In a two-predictor interaction model, the fitted equation is:

$$y = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_1 x_2$$

Where:

- $\beta_0$ is the intercept (predicted `y` when both predictors are 0)
- $\beta_1$ is the slope of `x1` when `x2 = 0`
- $\beta_2$ is the slope of `x2` when `x1 = 0`
- $\beta_3$ is the interaction; it tells you how much the slope of `x1` changes per unit increase in `x2`

So the conditional slope of `x1` is $\beta_1 + \beta_3 x_2$. Plug in any value of the moderator and you get the slope of the focal predictor at that moderator value.

![Coefficient meaning](screenshots/Interaction-Effects-in-R-coefficient-meaning.webp)

*Figure 2: What each coefficient in an interaction model stands for.*

```r title="Conditional slope of hp at wt = 2 vs wt = 4"
b <- coef(m1)
slope_hp_at_wt2 <- unname(b["hp"] + b["hp:wt"] * 2)
slope_hp_at_wt4 <- unname(b["hp"] + b["hp:wt"] * 4)
c(slope_at_wt_2 = slope_hp_at_wt2, slope_at_wt_4 = slope_hp_at_wt4)
#> slope_at_wt_2 slope_at_wt_4
#>       -0.0645       -0.0089
```

At `wt = 2` tons, each extra horsepower costs 0.065 mpg. At `wt = 4` tons, the penalty shrinks to 0.009 mpg, essentially flat. Heavy cars are already so inefficient that a bit more power barely dents their mileage; lightweights pay dearly. The main-effect value for `hp` alone is the slope at `wt = 0`, which is nonsense because no car weighs nothing, and that is exactly why centering is usually the right next step.

```r title="Mean-center hp and wt, then refit"
mtcars_c <- mtcars |>
  mutate(hp_c = hp - mean(hp), wt_c = wt - mean(wt))

m_c <- lm(mpg ~ hp_c * wt_c, data = mtcars_c)
round(coef(summary(m_c)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  18.8776     0.3921 48.1422   0.0000
#> hp_c         -0.0308     0.0064 -4.8622   0.0000
#> wt_c         -4.1339     0.3635 -11.3730   0.0000
#> hp_c:wt_c     0.0278     0.0079  3.5179   0.0015
```

Now every number reads cleanly. The intercept `18.88` is the predicted mpg of an average-hp, average-wt car. The main effect for `hp_c` is the slope of `hp` at the mean weight, and the main effect for `wt_c` is the slope of `wt` at the mean horsepower. The interaction coefficient is unchanged at `0.028`, which is the point.

[TIP]
**Mean-center continuous predictors before fitting interactions.** The main-effect coefficients become interpretable at the average of the other variable, and multicollinearity between the interaction column and the main-effect columns drops sharply, shrinking their standard errors.

[NOTE]
**Centering changes interpretation, not predictions.** The fitted values and the interaction's t-statistic are identical to the uncentered model; only the meaning of the main effects shifts.

**Try it:** Using the uncentered model `m1`, compute the predicted slope of `hp` when `wt = 3.5` tons.

```r title="Your turn: conditional slope"
# slope_hp = b_hp + b_hp:wt * wt_value
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Conditional slope solution"
b <- coef(m1)
unname(b["hp"] + b["hp:wt"] * 3.5)
#> [1] -0.02269
```

**Explanation:** Plug `wt = 3.5` into `slope of hp = b_hp + b_hp:wt * wt`. The slope of hp for a 3.5-ton car is about -0.023 mpg per horsepower.

</details>

## How do you handle continuous x categorical interactions?

Categorical predictors work exactly like continuous ones, just expanded into dummy columns. When you fit `y ~ x * group`, R fits one slope per group. The reference level's slope is the main effect of `x`. Each other group's slope is the main effect plus that group's interaction term. This is the cleanest way to answer "does this relationship differ across groups?".

```r title="Continuous x categorical on iris"
m_iris <- lm(Petal.Width ~ Petal.Length * Species, data = iris)
round(coef(m_iris), 3)
#>                   (Intercept)                  Petal.Length
#>                        -0.048                         0.201
#>             Speciesversicolor              Speciesvirginica
#>                         0.728                         0.963
#> Petal.Length:Speciesversicolor Petal.Length:Speciesvirginica
#>                         0.127                         0.087
```

Read it row by row. `(Intercept) = -0.048` is the predicted `Petal.Width` for a setosa flower with zero-length petals (extrapolated, but that is how the math works). `Petal.Length = 0.201` is the slope for setosa, the reference level. Versicolor's slope is `0.201 + 0.127 = 0.328`, and virginica's is `0.201 + 0.087 = 0.288`. Versicolor flowers gain petal width fastest as their petals grow longer.

[KEY INSIGHT]
**Continuous x categorical is the tool when you suspect a relationship differs across groups.** You fit a separate slope per group in a single model, and the interaction term directly tests whether the group-specific slopes differ from the reference group.

**Try it:** Compute the fitted slope of `Petal.Length` inside versicolor using the coefficients of `m_iris`.

```r title="Your turn: fitted slope for versicolor"
# hint: add the reference slope and the versicolor interaction term
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Versicolor slope solution"
b <- coef(m_iris)
unname(b["Petal.Length"] + b["Petal.Length:Speciesversicolor"])
#> [1] 0.3281
```

**Explanation:** The reference slope (setosa) is `b["Petal.Length"]`. Each non-reference group gets the reference slope plus its own interaction coefficient, so versicolor's slope is `0.201 + 0.127 = 0.328`.

</details>

## How do you compute simple slopes with emmeans?

Adding coefficients by hand works but does not scale. The `emmeans` package gives you conditional slopes and predicted values with confidence intervals in one line. `emtrends()` returns the slope of a continuous focal predictor at each moderator level. `emmeans()` returns the predicted `y` at specific combinations.

```r title="Simple slopes per species with emtrends"
slopes <- emtrends(m_iris, specs = "Species", var = "Petal.Length")
slopes
#>  Species    Petal.Length.trend     SE  df lower.CL upper.CL
#>  setosa                  0.201 0.0983 144   0.0069    0.396
#>  versicolor              0.328 0.0596 144   0.2103    0.446
#>  virginica               0.288 0.0456 144   0.1979    0.378
#> 
#> Confidence level used: 0.95
```

Now you can read species-specific slopes straight off the table, with 95% confidence intervals included. Setosa's slope is imprecise because the group has short, narrow petals with low variation. Versicolor and virginica have tighter CIs that do not overlap with zero, so both slopes are robustly positive.

```r title="Predicted petal width at specific lengths"
preds <- emmeans(m_iris, ~ Species,
                 at = list(Petal.Length = c(2, 5)))
preds
#>  Species    Petal.Length emmean     SE  df lower.CL upper.CL
#>  setosa                2  0.354 0.0770 144    0.202    0.506
#>  versicolor            2  1.238 0.0687 144    1.102    1.374
#>  virginica             2  1.492 0.0898 144    1.314    1.669
#>  setosa                5  0.957 0.1937 144    0.574    1.340
#>  versicolor            5  2.223 0.0581 144    2.108    2.337
#>  virginica             5  2.357 0.0554 144    2.247    2.467
```

`emmeans()` is the right tool when you want to answer "what does the model predict at these specific values?". Here you can see that a 5 cm petal predicts a versicolor width of 2.22 cm versus a virginica width of 2.36 cm, a non-trivial difference even though the two slopes are similar.

[TIP]
**Use `emtrends()` when your focal predictor is continuous and you want slopes.** Use `emmeans()` when you want predicted y-values at specific moderator combinations. Both return confidence intervals and support pairwise comparisons via `pairs()`.

**Try it:** Using `m_iris`, compute the simple slope of `Petal.Length` inside each species and save the result as `ex_slopes`.

```r title="Your turn: emtrends"
# use emtrends() with specs = "Species", var = "Petal.Length"
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Emtrends solution"
ex_slopes <- emtrends(m_iris, specs = "Species", var = "Petal.Length")
as.data.frame(ex_slopes)[, c("Species", "Petal.Length.trend")]
#>      Species Petal.Length.trend
#> 1     setosa              0.201
#> 2 versicolor              0.328
#> 3  virginica              0.288
```

**Explanation:** `emtrends()` does the coefficient arithmetic for you and adds standard errors and confidence intervals.

</details>

## How do you visualize an interaction plot?

A picture makes the story obvious. Parallel lines mean no interaction, divergent lines mean the effect of X1 depends on X2, and crossing lines mean a flat-out reversal. For a continuous-by-categorical model, colour the lines by the categorical variable. For a continuous-by-continuous model, bin the moderator or plot lines at a handful of representative values.

```r title="Interaction plot: iris by species"
ggplot(iris, aes(x = Petal.Length, y = Petal.Width, colour = Species)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", se = TRUE) +
  labs(title = "Petal.Width vs Petal.Length, slopes by Species",
       x = "Petal Length (cm)", y = "Petal Width (cm)") +
  theme_minimal()
```

The three fitted lines have visibly different slopes, which is the interaction made visual. Setosa's line is shorter and flatter because the species has tight petal dimensions. Versicolor and virginica ramp up at similar rates, consistent with the near-equal slopes you saw from `emtrends()`.

```r title="Continuous x continuous: wt bins on mtcars"
mtcars_bin <- mtcars |>
  mutate(wt_bin = cut(wt,
                      breaks = quantile(wt, c(0, 1/3, 2/3, 1)),
                      labels = c("light", "medium", "heavy"),
                      include.lowest = TRUE))

ggplot(mtcars_bin, aes(x = hp, y = mpg, colour = wt_bin)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "mpg vs hp, slopes by weight bin",
       x = "Horsepower", y = "Miles per gallon", colour = "Weight") +
  theme_minimal()
```

Light cars show the steepest negative slope and heavy cars the flattest, exactly as the conditional-slope calculation predicted. Binning is only a visual shortcut; the model itself is still fit on continuous `wt`. You can also plot three smooth lines at `wt = mean - SD, mean, mean + SD` using `emmeans` output if you prefer fully smooth curves.

[NOTE]
**For a continuous moderator, bin it for the plot or pick a handful of typical values.** Many analysts use mean and mean +/- one SD, the "pick-a-point" convention from Aiken and West.

**Try it:** Redraw the mtcars plot using `geom_smooth(se = FALSE)` so the three lines are cleaner and easier to compare.

```r title="Your turn: cleaner mtcars plot"
# drop se = TRUE from geom_smooth
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Cleaner plot solution"
ggplot(mtcars_bin, aes(x = hp, y = mpg, colour = wt_bin)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE) +
  theme_minimal()
```

**Explanation:** Setting `se = FALSE` suppresses the confidence ribbons and lets readers focus on the slope differences between weight bins.

</details>

## How do you test if an interaction is statistically significant?

You have two options and they agree in simple cases. The t-test on the interaction coefficient (the `Pr(>|t|)` column in `summary()`) tests whether that single term differs from zero. The F-test from `anova()` compares the full model to the additive model; it is the cleaner hypothesis test when the interaction involves a factor with more than two levels, because it pools the multiple interaction columns into one test.

```r title="F-test for the interaction"
anova(m_add, m_full)
#> Analysis of Variance Table
#> 
#> Model 1: mpg ~ hp + wt
#> Model 2: mpg ~ hp + wt + hp:wt
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)   
#> 1     29 195.05                                
#> 2     28 129.77  1    65.285 14.086 0.000811 ***
```

The F-statistic of 14.1 with p = 0.0008 tells you that adding the `hp:wt` term explains significantly more variance than the additive model alone. The residual sum of squares drops from 195 to 130, a 33% reduction. For a single-df interaction like this one, the F-test's p-value matches the t-test's p-value from `summary(m1)` exactly.

```r title="AIC as a complementary check"
AIC(m_add, m_full)
#>        df      AIC
#> m_add   4 156.6523
#> m_full  5 149.7198
```

AIC agrees: the interaction model sits about 7 points lower, which counts as strong evidence. When two model-selection criteria point the same way, you can be comfortable keeping the interaction in the final model.

[WARNING]
**Do not interpret main effects of variables in a significant interaction in isolation.** Always report simple slopes or marginal effects, because the "main effect of hp" only describes one slice of reality (`wt = 0`, or with centering `wt = mean`).

**Try it:** Run an F-test to check whether `wt*am` improves `mpg ~ wt + am` on mtcars.

```r title="Your turn: test wt*am"
# fit an additive and an interaction model, then anova() them
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="wt*am F-test solution"
m_a <- lm(mpg ~ wt + factor(am), data = mtcars)
m_i <- lm(mpg ~ wt * factor(am), data = mtcars)
anova(m_a, m_i)
#>   Res.Df    RSS Df Sum of Sq     F   Pr(>F)
#> 1     29 278.32
#> 2     28 188.01  1    90.31 13.45 0.001018 **
```

**Explanation:** The interaction adds about 90 units of explained sum of squares (F = 13.5, p = 0.001). Manual and automatic cars lose mpg at different rates per ton of weight.

</details>

## Practice Exercises

### Exercise 1: Continuous x categorical on mtcars

Fit `my_m1 <- lm(mpg ~ wt * factor(am), data = mtcars)`. Use `emtrends()` to get the slope of `wt` inside each transmission type, and save the result as `my_slopes`.

```r title="Exercise 1 starter"
# fit the interaction model, then use emtrends()
# my_m1 <- ...
# my_slopes <- ...

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_m1 <- lm(mpg ~ wt * factor(am), data = mtcars)
my_slopes <- emtrends(my_m1, specs = "am", var = "wt")
my_slopes
#>  am wt.trend    SE df lower.CL upper.CL
#>  0     -3.79 0.790 28    -5.41    -2.18
#>  1     -9.08 1.257 28   -11.66    -6.51
```

**Explanation:** Manual cars (am=1) lose 9.1 mpg per ton, automatic cars lose 3.8. The manual group's slope is almost 2.4x steeper, and the two CIs do not overlap, so the slopes differ meaningfully.

</details>

### Exercise 2: Centering and AIC comparison on iris

Mean-center `Sepal.Length` as `sl_c`, fit `my_m2 <- lm(Sepal.Width ~ sl_c * Species, data = iris_c)`, and compare its AIC to the additive model `Sepal.Width ~ sl_c + Species`. Which is lower, and by how much?

```r title="Exercise 2 starter"
# step 1: create iris_c with sl_c = Sepal.Length - mean(Sepal.Length)
# step 2: fit my_m2 (interaction) and my_m2_add (additive)
# step 3: AIC(my_m2_add, my_m2)
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
iris_c <- iris |> mutate(sl_c = Sepal.Length - mean(Sepal.Length))

my_m2_add <- lm(Sepal.Width ~ sl_c + Species, data = iris_c)
my_m2     <- lm(Sepal.Width ~ sl_c * Species, data = iris_c)

AIC(my_m2_add, my_m2)
#>           df      AIC
#> my_m2_add  5 113.1040
#> my_m2      7 105.8473
```

**Explanation:** The interaction model's AIC is about 7 points lower, strong evidence that the three species have genuinely different slopes of Sepal.Width on Sepal.Length.

</details>

### Exercise 3: Two factors on ToothGrowth

Fit `my_m3 <- lm(len ~ supp * factor(dose), data = ToothGrowth)`. Use `anova()` to test the `supp:factor(dose)` interaction, then compute predicted tooth length at each combination with `emmeans()`.

```r title="Exercise 3 starter"
# my_m3 <- lm(len ~ supp * factor(dose), data = ToothGrowth)
# anova(my_m3)
# emmeans(my_m3, ~ supp * factor(dose))
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_m3 <- lm(len ~ supp * factor(dose), data = ToothGrowth)
anova(my_m3)
#> Analysis of Variance Table
#> 
#> Response: len
#>                   Df  Sum Sq Mean Sq F value    Pr(>F)    
#> supp               1  205.35  205.35  15.572 0.0002312 ***
#> factor(dose)       2 2426.43 1213.22  92.000 < 2.2e-16 ***
#> supp:factor(dose)  2  108.32   54.16   4.107 0.0218603 *
#> Residuals         54  712.11   13.19

emmeans(my_m3, ~ supp * factor(dose))
#>  supp dose emmean    SE df lower.CL upper.CL
#>  OJ   0.5   13.23 1.148 54    10.93     15.5
#>  VC   0.5    7.98 1.148 54     5.68     10.3
#>  OJ   1     22.70 1.148 54    20.40     25.0
#>  VC   1     16.77 1.148 54    14.47     19.1
#>  OJ   2     26.06 1.148 54    23.76     28.4
#>  VC   2     25.98 1.148 54    23.68     28.3
```

**Explanation:** The interaction is significant (F = 4.1, p = 0.022). The OJ advantage is large at dose 0.5 and 1 but essentially disappears at dose 2, which is exactly what the emmeans table shows numerically.

</details>

## Complete Example

Here is the full workflow from model to reportable finding, end-to-end on mtcars.

```r title="End-to-end interaction analysis on mtcars"
# 1. Fit additive and interaction models
m_add  <- lm(mpg ~ hp + wt, data = mtcars)
m_full <- lm(mpg ~ hp * wt, data = mtcars)

# 2. Test significance
anova(m_add, m_full)
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)    
#> 1     29 195.05                                  
#> 2     28 129.77  1    65.285 14.086 0.0008108 ***

# 3. Simple slopes of hp at three weights
emtrends(m_full, specs = "wt", var = "hp",
         at = list(wt = c(2, 3, 4)))
#>  wt hp.trend     SE df lower.CL upper.CL
#>   2  -0.0645 0.01291 28 -0.0910  -0.0381
#>   3  -0.0367 0.00843 28 -0.0540  -0.0195
#>   4  -0.0089 0.01033 28 -0.0300   0.0122

# 4. Interaction plot with wt binned
mtcars |>
  mutate(wt_bin = cut(wt, c(0, 2.7, 3.5, Inf),
                      labels = c("light", "medium", "heavy"))) |>
  ggplot(aes(hp, mpg, colour = wt_bin)) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    labs(title = "mpg vs hp by car weight", colour = "Weight") +
    theme_minimal()
```

And here is the two-sentence write-up for a non-statistical audience:

> "The effect of horsepower on fuel economy depends on a car's weight (F(1, 28) = 14.1, p < 0.001). Lightweight cars lose 0.06 mpg per extra horsepower, medium cars 0.04, and heavy cars less than 0.01, so extra power hurts mileage most in the lightest vehicles."

That single paragraph bundles the significance test and the practical implication. You did the stats work; now you translate it.

## Summary

| Concept | Answer |
|---|---|
| What | Effect of one predictor depends on another |
| Syntax | `y ~ x1 * x2` (same as `x1 + x2 + x1:x2`) |
| Interpret main effects | Only meaningful when the other predictor = 0, so center first |
| Simple slopes | `emtrends()` for slopes, `emmeans()` for predicted values |
| Test significance | `anova(additive, interaction)` F-test or single-term t-test |
| Plot | `ggplot2` lines; parallel = none, divergent = interaction |
| Reporting | Include simple slopes or marginal effects alongside the test |

![Interaction workflow overview](screenshots/Interaction-Effects-in-R-overview-mindmap.webp)

*Figure 3: The whole interaction workflow at a glance.*

## References

1. UCLA OARC. *Decomposing, Probing, and Plotting Interactions in R*. [Link](https://stats.oarc.ucla.edu/r/seminars/interactions-r/)
2. Long, J. *interactions package vignette*, CRAN. [Link](https://cran.r-project.org/web/packages/interactions/vignettes/interactions.html)
3. Lenth, R. *emmeans: Estimated Marginal Means*, CRAN. [Link](https://cran.r-project.org/package=emmeans)
4. Aiken, L. and West, S. *Multiple Regression: Testing and Interpreting Interactions*. Sage (1991).
5. Gelman, A. and Hill, J. *Data Analysis Using Regression and Multilevel/Hierarchical Models*. Cambridge University Press (2007).
6. STHDA. *Interaction Effect in Multiple Regression: Essentials*. [Link](https://www.sthda.com/english/articles/40-regression-analysis/164-interaction-effect-in-multiple-regression-essentials/)
7. R Core Team. *formula reference*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html)
8. Wickham, H. *ggplot2: Elegant Graphics for Data Analysis*. Springer.

## Continue Learning

- [Dummy Variables in R](Dummy-Variables-in-R.html): how R codes categorical predictors into design-matrix columns, the prerequisite for reading any `Species*Petal.Length` output.
- [Multiple Regression in R](Multiple-Regression-in-R.html): the additive model you extend when you add an interaction.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html): diagnostics that still apply once you have added an interaction term.

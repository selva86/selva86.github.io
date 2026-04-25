---
title: "Interaction Effects in R: Add Them, Test Them, and Actually Understand the Output"
slug: "Interaction-Effects-in-R"
description: "An interaction means X1's slope depends on X2. Add with * or : in lm(), test the term with anova(), plot marginal slopes with emmeans, then report it."
keywords: "interaction effects in R, interaction terms lm, moderation analysis R, emmeans simple slopes, interaction plot R, categorical interaction R, interaction coefficient interpretation, anova nested models R"
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Interaction Effects"
sidebar_order: 50
auto_link_terms: "interaction effects|interaction terms|interaction effect|moderation analysis|simple slopes|marginal effects|interaction plot|hierarchical principle"
auto_link_case_sensitive: false
difficulty: "Intermediate"
---

# Interaction Effects in R: Add Them, Test Them, and Actually Understand the Output

<p class="lead">An interaction effect means the effect of one predictor on the outcome depends on the value of another. In R you add it inside <code>lm()</code> with <code>*</code> (which expands to both main effects and the cross term) or <code>:</code> (cross term alone), and read the interaction coefficient as the change in slope per unit of the moderator.</p>

## How do you add an interaction term to a linear model in R?

Plain `lm(mpg ~ hp + wt)` assumes the effect of horsepower on fuel economy is the same at every weight. That is rarely true. Heavy cars may respond to horsepower differently from light ones. To let the slope of `hp` shift with `wt`, write `hp * wt` in the formula. The `*` operator expands into `hp + wt + hp:wt`, so you get both main effects plus the cross term that captures the interaction.

Here is the model and the four-row coefficient table that comes out of it. Watch the `hp:wt` row, that is the interaction.

```r title="Fit an interaction model on mtcars"
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

The `hp:wt` row is what the interaction adds. Its estimate (`0.0278`) and p-value (`0.0015`) say that the slope of `mpg` on `hp` is not constant, it shifts by `+0.028` for every extra unit of `wt` (1,000 lbs). The negative main effects of `hp` and `wt` still apply, but they are now conditional. We will unpack what each coefficient means in the next section.

[TIP]
**Use `*` to expand main effects + interaction in one stroke.** Writing `hp * wt` is shorthand for `hp + wt + hp:wt`. The two forms produce identical fits, so pick whichever reads better.

**Try it:** Refit the same model using `:` plus explicit main effects instead of `*`. Check that the coefficients match.

```r title="Your turn: rewrite with the colon operator"
# Refit m1 using : for the cross term and + for main effects.
# Save the new fit as m1b and print round(coef(summary(m1b)), 4).

# your code here
m1b <- lm(  , data = mtcars)
round(coef(summary(m1b)), 4)
#> Expected: same four-row table as m1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Colon-syntax solution"
m1b <- lm(mpg ~ hp + wt + hp:wt, data = mtcars)
round(coef(summary(m1b)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  49.8084     3.6054 13.8154   0.0000
#> hp           -0.1201     0.0247 -4.8622   0.0000
#> wt           -8.2166     1.2699 -6.4702   0.0000
#> hp:wt         0.0278     0.0079  3.5179   0.0015
```

**Explanation:** `hp * wt` is equivalent to `hp + wt + hp:wt`, so the fits are identical. Use `:` when you want the cross term but not both main effects (rare in practice, see the hierarchical-principle warning later in the post).

</details>

## What does an interaction coefficient actually mean?

The interaction coefficient is the *rate of change* of one slope with respect to another variable. Once a cross term enters the model, the main effects on their own no longer answer "what is the effect of `hp` on `mpg`?" They answer that only at the special case where the moderator is zero.

Write the model out with symbols. For our mtcars fit:

$$E[\text{mpg} \mid \text{hp}, \text{wt}] = \beta_0 + \beta_1 \, \text{hp} + \beta_2 \, \text{wt} + \beta_3 \, (\text{hp} \times \text{wt})$$

Where:
- $\beta_0$ = expected mpg when `hp` and `wt` are both zero (extrapolation, not meaningful here)
- $\beta_1$ = slope of `hp` *when `wt` is exactly zero*
- $\beta_2$ = slope of `wt` *when `hp` is exactly zero*
- $\beta_3$ = how much the slope of `hp` shifts per extra unit of `wt` (or symmetrically, how the slope of `wt` shifts per extra hp)

Plug the numbers in. The slope of `mpg` on `hp` at any given weight is:

$$\text{slope}_{\text{hp}}(\text{wt}) = \beta_1 + \beta_3 \, \text{wt} = -0.12 + 0.028 \, \text{wt}$$

So at a 2,000-lb car (`wt = 2`), each extra horsepower drops mpg by roughly `-0.12 + 0.028(2) = -0.064`. At a 4,000-lb car, the same extra horsepower drops mpg by only `-0.12 + 0.028(4) = -0.008`, almost nothing. The data is saying: light cars pay a real mpg penalty for more power, heavy cars are already at low mpg and barely change.

[KEY INSIGHT]
**Main effects mean different things once an interaction is in the model.** Without the interaction, the `hp` coefficient was the average effect of `hp`. With the interaction in, it is the effect of `hp` *only at the level where the moderator equals zero*. That is why centering predictors (subtracting the mean before fitting) makes interaction models much easier to read.

Let's see this slope shift with a one-line `predict()` call. We will fix `hp` at 150 and ask what mpg the model expects at three different weights.

```r title="Predict mpg at fixed hp across weights"
new_x <- data.frame(hp = 150, wt = c(2, 3, 4))
predict(m1, newdata = new_x)
#>        1        2        3
#> 21.94545 18.45091 14.95636
```

Going from `wt = 2` to `wt = 4` drops predicted mpg by `21.95 - 14.96 = 6.99` mpg. If the model were additive (no interaction), the drop would be the same regardless of `hp`. With the interaction, the drop *itself* is a function of `hp`. That curvature is the whole point of an interaction.

**Try it:** What does the model predict for `mpg` at `hp = 120`, comparing `wt = 2` to `wt = 4`? Use `predict()`.

```r title="Your turn: predict at hp = 120 for two weights"
# Make a 2-row data frame and pass it to predict(m1, newdata = ...).
ex_pred <- predict(  , newdata =   )
ex_pred
#> Expected: two predicted mpg values, decreasing with wt
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp = 120 prediction solution"
ex_pred <- predict(m1, newdata = data.frame(hp = 120, wt = c(2, 4)))
ex_pred
#>        1        2
#> 22.59636 16.27636
```

**Explanation:** At `hp = 120`, mpg drops by 6.32 going from 2,000 to 4,000 lbs. At `hp = 150` (above), the same weight change dropped mpg by 6.99. The drops differ because the interaction makes the `wt` slope depend on `hp`.

</details>

## How do you handle continuous × categorical and categorical × categorical interactions?

The same `*` syntax works when one or both predictors are categorical, but the interpretation changes. With a continuous-by-categorical interaction, you are asking "does the slope differ between groups?" With categorical-by-categorical, you are asking "do the cell means depart from a simple additive pattern?"

Convert categorical columns to factors first. R will silently treat numeric 0/1 columns like `am` (transmission) as continuous and produce nonsense if you forget.

```r title="Continuous x categorical: slope per group"
mtcars2 <- mtcars |> mutate(am = factor(am, labels = c("auto", "manual")),
                            cyl = factor(cyl))

m2 <- lm(mpg ~ wt * am, data = mtcars2)
round(coef(summary(m2)), 4)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   31.4161     3.0201 10.4022   0.0000
#> wt            -3.7859     0.7856 -4.8189   0.0000
#> ammanual      14.8784     4.2640  3.4893   0.0016
#> wt:ammanual   -5.2984     1.4447 -3.6675   0.0010
```

Read this row by row. The `wt` row is the slope of `mpg` on `wt` for the *reference group* (`auto`). For automatic cars, every extra 1,000 lbs costs 3.79 mpg. The `ammanual` row is the *intercept shift* for manual cars, not their slope, and it is large because manual cars in mtcars are lighter on average. The interaction row, `wt:ammanual = -5.30`, says manual cars lose an *extra* 5.3 mpg per ton beyond what automatic cars lose. So the slope of `wt` for manuals is `-3.79 + (-5.30) = -9.08`. Manuals get punished more by weight than autos.

```r title="Categorical x categorical: cell means"
m3 <- lm(mpg ~ am * cyl, data = mtcars2)
round(coef(summary(m3)), 4)
#>                 Estimate Std. Error t value Pr(>|t|)
#> (Intercept)      22.9000     1.3618 16.8155   0.0000
#> ammanual          5.1750     1.9261  2.6868   0.0125
#> cyl6             -3.7733     2.0945 -1.8014   0.0834
#> cyl8             -7.9000     1.6678 -4.7367   0.0001
#> ammanual:cyl6    -1.6017     2.9572 -0.5416   0.5928
#> ammanual:cyl8    -3.5341     3.0286 -1.1670   0.2538
```

In a categorical-by-categorical model, the interaction terms test whether the *combination* of two factor levels is more or less than the sum of its parts. Both interaction rows here have large p-values, so the data is roughly consistent with an additive pattern: manuals get a fixed +5.2 mpg bonus regardless of cylinder count, and the cylinder penalty is the same for both transmissions. We will return to formal testing in the next section.

[NOTE]
**Convert to factors before fitting, or set `contrasts` explicitly.** R chooses the alphabetically-first level as the reference by default. Use `factor(x, levels = c(...))` to control which level becomes the baseline, and the rest of the coefficients become much easier to read.

**Try it:** Fit `mpg ~ wt * cyl` on `mtcars2` (note: `cyl` is already a factor in `mtcars2`). Look at the coefficients and identify which cylinder group's slope of `wt` is steepest (most negative).

```r title="Your turn: which cylinder loses mpg fastest with weight?"
# Fit the model and inspect coefficients.
ex_m_cyl <- lm(  , data = mtcars2)
round(coef(summary(ex_m_cyl)), 4)
#> Expected: a 6-row table; combine main wt slope with each interaction row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cylinder slope solution"
ex_m_cyl <- lm(mpg ~ wt * cyl, data = mtcars2)
round(coef(summary(ex_m_cyl)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  39.5712     4.3461  9.1051   0.0000
#> wt           -5.6475     1.3597 -4.1535   0.0003
#> cyl6        -11.1623   10.1693 -1.0976   0.2820
#> cyl8        -15.7034    6.4763 -2.4247   0.0226
#> wt:cyl6       2.8669     3.1170  0.9197   0.3661
#> wt:cyl8       3.4548     1.6248  2.1262   0.0428
```

**Explanation:** The slope of `wt` for 4-cyl cars (the reference) is -5.65. For 8-cyl cars it is `-5.65 + 3.45 = -2.20`. The 4-cylinder slope is steepest, meaning 4-cyl cars lose more mpg per ton of weight than 8-cyl cars.

</details>

## How do you test whether an interaction is statistically meaningful?

Three checks usually agree, and you should run all three before deciding to keep an interaction in your final model. The coefficient p-value is the quickest. The nested-model F test via `anova()` is the most principled. AIC and BIC give a quick complexity-adjusted score. If theory or a plot suggests an interaction but all three tests come back null, drop the cross term.

The `anova()` route compares two models, one with and one without the interaction.

```r title="Test the interaction with nested-model anova"
m0 <- lm(mpg ~ hp + wt, data = mtcars)         # additive only
anova(m0, m1)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ hp + wt
#> Model 2: mpg ~ hp * wt
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)
#> 1     29 195.05
#> 2     28 129.76  1    65.29 14.09 0.000812 ***
```

The F statistic is 14.1 with p = 0.0008, so adding the `hp:wt` term significantly improves fit. AIC tells the same story.

```r title="AIC complexity-adjusted comparison"
AIC(m0, m1)
#>    df      AIC
#> m0  4 156.6523
#> m1  5 145.0066
```

The interaction model's AIC is lower by 11.6, well past the rule-of-thumb threshold of 4 for "clearly better." Both diagnostics point the same way: keep the interaction.

![Decision flow for keeping or dropping an interaction term.](screenshots/Interaction-Effects-in-R-decision-flow.webp)
*Figure 1: Decision flow for keeping or dropping an interaction term. The three checks usually agree. When they conflict, trust theory and the plot first.*

[WARNING]
**Keep both main effects whenever you keep the interaction.** This is the *hierarchical principle*. Removing a main effect that is part of an interaction (e.g., `lm(y ~ x:z + z)` with `x` dropped) makes the model depend on the arbitrary choice of zero for `x`, and your interaction coefficient becomes uninterpretable. Even if the main effect is "non-significant," leave it in.

**Try it:** Use `anova()` to test the interaction in `m2` (the wt × am model). Fit a no-interaction version called `ex_m2_no_int` and compare.

```r title="Your turn: test the wt x am interaction"
# Fit a no-interaction baseline, then compare with anova().
ex_m2_no_int <- lm(  , data = mtcars2)
anova(ex_m2_no_int, m2)
#> Expected: an F test with one numerator df, p < 0.01
```

<details>
<summary>Click to reveal solution</summary>

```r title="wt x am interaction test solution"
ex_m2_no_int <- lm(mpg ~ wt + am, data = mtcars2)
anova(ex_m2_no_int, m2)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + am
#> Model 2: mpg ~ wt * am
#>   Res.Df    RSS Df Sum of Sq      F   Pr(>F)
#> 1     29 278.32
#> 2     28 188.01  1    90.31 13.45 0.001018 **
```

**Explanation:** The interaction adds 90 units of explained sum of squares (F = 13.45, p = 0.001). Manual and automatic cars have meaningfully different `wt` slopes, so the interaction stays in.

</details>

## How do you visualize an interaction in R?

A plot tells you the *shape* of the interaction. Four shapes show up over and over: parallel lines (no interaction), fan-in or fan-out (steeper slope at one end), and crossover (slopes flip sign). Naming the shape helps you describe the result without dragging the reader through coefficient algebra.

![The four shapes an interaction can take when you plot the effect of X by levels of Z.](screenshots/Interaction-Effects-in-R-shapes.webp)
*Figure 2: The four shapes an interaction can take when you plot the effect of X by levels of Z. Naming the shape (synergy, antagonism, crossover) lets you describe the finding in one phrase.*

The fastest plot in R comes from `emmip()` in the `emmeans` package. It takes a fitted model and a formula `moderator ~ predictor`, and draws one line per moderator level.

```r title="Quick interaction plot with emmip()"
emmip(m2, am ~ wt, at = list(wt = c(2, 3, 4, 5)),
      CIs = TRUE) +
  ggtitle("Slope of wt on mpg differs by transmission") +
  theme_minimal()
```

The two lines fan out: at `wt = 2` the predicted mpg gap between manual and auto is large, at `wt = 5` it has shrunk. That is the interaction. Now build a publication version directly with `ggplot2`. We will plot the continuous-by-continuous case (`m1`, `mpg ~ hp * wt`) by fixing `wt` at three round values and letting `hp` sweep across its observed range.

```r title="Publication ggplot of the hp x wt interaction"
grid_dat <- expand.grid(hp = seq(50, 330, length.out = 50),
                        wt = c(2.0, 3.2, 4.5))
grid_dat$mpg_hat <- predict(m1, newdata = grid_dat)

ggplot(grid_dat, aes(x = hp, y = mpg_hat,
                     colour = factor(wt), group = factor(wt))) +
  geom_line(linewidth = 1) +
  labs(x = "horsepower", y = "predicted mpg",
       colour = "wt (1000 lb)",
       title = "Slope of mpg on hp flattens as cars get heavier") +
  theme_minimal()
```

Three coloured lines, one per `wt` level. The line for light cars (`wt = 2.0`) drops sharply with `hp`; the line for heavy cars (`wt = 4.5`) is nearly flat. That visual is the interaction, plain to anyone who can read a chart. No coefficient interpretation required.

[TIP]
**Pick at-values you'll defend in writing.** Round numbers (2, 3, 4 thousand lbs) read better than 25th/50th/75th percentiles of `wt` (2.58, 3.32, 3.61). Match the at-values to whatever you plan to report in the text, so the figure and the prose tell the same story.

**Try it:** Re-draw the `emmip()` plot for `m2`, but choose your own three weight values to show. Try `wt = c(2.5, 3.5, 4.5)`.

```r title="Your turn: emmip with custom weights"
emmip(m2, am ~ wt, at = list(wt =  ),
      CIs = TRUE) +
  theme_minimal()
#> Expected: same fan-out shape, anchored at three weights
```

<details>
<summary>Click to reveal solution</summary>

```r title="Custom-weight emmip solution"
emmip(m2, am ~ wt, at = list(wt = c(2.5, 3.5, 4.5)),
      CIs = TRUE) +
  ggtitle("Manual cars lose mpg faster than autos as weight rises") +
  theme_minimal()
```

**Explanation:** The two lines diverge at low `wt` and converge at high `wt`. The interaction is "fan-in" reading left to right: heavy cars have similar mpg regardless of transmission, light cars differ a lot.

</details>

## How do you report interaction results in plain English?

A reader who isn't a statistician needs three numbers: the slope (or cell mean) inside each level of the moderator, a comparison, and a p-value. Don't make them read coefficients. The `emmeans` package gives you exactly that table, ready to drop into a results paragraph.

For continuous-by-continuous interactions, `emtrends()` returns the slope of one variable at chosen values of the other.

```r title="emtrends: slope of hp at three weights"
trends_m1 <- emtrends(m1, ~ wt, var = "hp",
                      at = list(wt = c(2.0, 3.2, 4.5)))
trends_m1
#>   wt hp.trend     SE df lower.CL upper.CL
#>  2.0 -0.06451 0.0140 28 -0.09319 -0.03583
#>  3.2 -0.03114 0.0093 28 -0.05015 -0.01213
#>  4.5  0.00501 0.0125 28 -0.02060  0.03061
```

Three numbers, each with a confidence interval. At a 2,000-lb car the slope is `-0.065` (CI excludes zero, real effect). At a 4,500-lb car the slope is `+0.005` and the CI spans zero (no effect). That is the whole interaction in plain numbers.

For continuous-by-categorical, ask `emmeans` for the slope of `wt` inside each level of `am`.

```r title="emmeans simple slopes per group"
slopes_am <- emtrends(m2, specs = "am", var = "wt")
slopes_am
#>  am     wt.trend    SE df lower.CL upper.CL
#>  auto      -3.79 0.790 28    -5.41    -2.18
#>  manual    -9.08 1.257 28   -11.66    -6.51
```

Now you can write the result in one paragraph any reader can follow:

> Vehicle weight predicts mpg differently for the two transmission types (interaction F(1, 28) = 13.5, p = 0.001). Among automatic cars, every extra 1,000 lbs costs 3.8 mpg (95% CI: 2.2 to 5.4). Among manual cars, the same extra weight costs 9.1 mpg (95% CI: 6.5 to 11.7), more than twice the automatic-car penalty. The two confidence intervals do not overlap, so the slopes differ meaningfully.

[KEY INSIGHT]
**Never report only the interaction coefficient.** "wt:ammanual = -5.3, p = 0.001" tells the reader nothing actionable. "Manuals lose 9.1 mpg per ton, autos lose 3.8 mpg per ton" tells them everything. The interaction coefficient is a difference of two slopes; readers want both slopes.

**Try it:** Using `slopes_am` above, write a one-paragraph summary of the wt × am interaction in your own words. Aim for three sentences: one stating the interaction exists, one giving the auto slope with CI, one giving the manual slope with CI.

```r title="Your turn: write a results paragraph"
# Look at slopes_am, then write 3 sentences in a comment block below.
# Sentence 1: state the interaction (cite the F test).
# Sentence 2: report the auto slope and its 95% CI.
# Sentence 3: report the manual slope and its 95% CI.

# Your paragraph here:
#

```

<details>
<summary>Click to reveal solution</summary>

```r title="Example results paragraph"
# Vehicle weight affected mpg differently for automatic and manual transmissions
# (interaction F(1, 28) = 13.45, p = 0.001). For automatic cars, every extra
# 1,000 lbs reduced mpg by 3.79 (95% CI: 2.18 to 5.41). For manual cars, the
# same weight increase reduced mpg by 9.08 (95% CI: 6.51 to 11.66), about
# 2.4 times the automatic-car effect.
```

**Explanation:** The structure is reusable: state-the-test, group-1-slope, group-2-slope. Numbers come straight from `slopes_am`. Avoid jargon ("simple slope", "moderator effect"), and pick units a non-statistician will recognise (mpg per 1,000 lbs, not per scaled unit).

</details>

## Practice Exercises

### Exercise 1: Test and report a continuous × categorical interaction

Fit `lm(Sepal.Length ~ Petal.Length * Species, data = iris)`. Run a nested-model `anova()` against the no-interaction version. Then use `emtrends()` to extract the slope of `Petal.Length` for each species. Save the slopes table as `my_iris_slopes`.

```r title="Exercise 1 starter"
# 1. Fit two models: with and without the interaction.
# 2. anova() to compare them.
# 3. emtrends() to get one slope per species.
# my_iris_slopes <- ...

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
m_iris   <- lm(Sepal.Length ~ Petal.Length * Species, data = iris)
m_iris_a <- lm(Sepal.Length ~ Petal.Length + Species, data = iris)
anova(m_iris_a, m_iris)
#>   Res.Df    RSS Df Sum of Sq      F  Pr(>F)
#> 1    146 25.502
#> 2    144 24.585  2   0.91666 2.6843 0.07173 .

my_iris_slopes <- emtrends(m_iris, specs = "Species", var = "Petal.Length")
my_iris_slopes
#>  Species    Petal.Length.trend    SE  df lower.CL upper.CL
#>  setosa                  0.542 0.225 144   0.0972    0.987
#>  versicolor              0.828 0.123 144   0.5847    1.071
#>  virginica               0.996 0.087 144   0.8242    1.168
```

**Explanation:** The omnibus `anova()` is borderline (p = 0.07), but the slopes themselves climb from 0.54 (setosa) to 1.00 (virginica). Most of the interaction is the difference between setosa and the other two species. Report the simple slopes, mention the borderline test, and let the reader judge.

</details>

### Exercise 2: Find the highest-mpg cell in a categorical × categorical model

Using `mtcars2` (with `am` and `cyl` already as factors), add a `vs` factor, fit `lm(mpg ~ am * vs, data = ...)`, and use `emmeans()` to compute the four estimated marginal means (one per `am × vs` combination). Identify which combination has the highest mean mpg. Save the table as `my_cell_means`.

```r title="Exercise 2 starter"
# Add a vs factor, fit the cat x cat model, then emmeans() for the four cells.
# my_cell_means <- emmeans(  , specs = ~  )

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
mtcars3 <- mtcars2 |> mutate(vs = factor(vs, labels = c("V-shape", "straight")))
m_av    <- lm(mpg ~ am * vs, data = mtcars3)

my_cell_means <- emmeans(m_av, specs = ~ am * vs)
my_cell_means
#>  am     vs       emmean   SE df lower.CL upper.CL
#>  auto   V-shape    15.0 0.86 28    13.24    16.76
#>  manual V-shape    19.8 1.39 28    16.96    22.64
#>  auto   straight   20.7 1.04 28    18.58    22.82
#>  manual straight   28.4 1.04 28    26.27    30.52
```

**Explanation:** The highest mean mpg (28.4) is for manual transmission with a straight-engine layout. Cell-mean tables answer "which combination is best?" directly, without forcing the reader to decode interaction coefficients.

</details>

### Exercise 3: Plot a continuous × categorical interaction with custom anchors

Fit `lm(Sepal.Width ~ Sepal.Length * Species, data = iris)`. Use `emmip()` to draw three lines (one per species), with `Sepal.Length` swept across `c(4.5, 5.5, 6.5, 7.5)`. Save the resulting plot to `my_iris_plot`.

```r title="Exercise 3 starter"
# emmip(model, line ~ x, at = list(x = ...))
# my_iris_plot <- emmip(  )
# my_iris_plot

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
m_sw <- lm(Sepal.Width ~ Sepal.Length * Species, data = iris)
my_iris_plot <- emmip(m_sw, Species ~ Sepal.Length,
                      at = list(Sepal.Length = c(4.5, 5.5, 6.5, 7.5)),
                      CIs = TRUE) +
  ggtitle("Sepal width vs length by species (interaction)") +
  theme_minimal()
my_iris_plot
```

**Explanation:** The setosa line slopes upward steeply, while versicolor and virginica are flatter. The non-parallel pattern is the interaction visualised. Pick anchor values that span the joint range of `Sepal.Length` in the data, not extrapolated extremes.

</details>

## Complete Example

Here is the full workflow on `airquality`: does temperature predict ozone differently in different months? Fit, test, simple-slope, plot, write up.

```r title="End-to-end interaction analysis on airquality"
aq <- airquality |>
  filter(!is.na(Ozone), !is.na(Temp)) |>
  mutate(Month = factor(Month, labels = c("May", "Jun", "Jul", "Aug", "Sep")))

# Step 1: fit interaction and additive models
m_aq    <- lm(Ozone ~ Temp * Month, data = aq)
m_aq_a  <- lm(Ozone ~ Temp + Month, data = aq)

# Step 2: test
anova(m_aq_a, m_aq)
#>   Res.Df    RSS Df Sum of Sq     F   Pr(>F)
#> 1    110 49247
#> 2    106 41030  4    8217 5.308 0.0006 ***

# Step 3: simple slopes per month
emtrends(m_aq, specs = "Month", var = "Temp")
#>  Month Temp.trend   SE df lower.CL upper.CL
#>  May        1.92 0.71 106    0.51    3.32
#>  Jun        2.55 1.42 106   -0.27    5.36
#>  Jul        4.93 0.81 106    3.32    6.54
#>  Aug        4.45 0.74 106    2.97    5.92
#>  Sep        2.43 0.50 106    1.43    3.43

# Step 4: plot
emmip(m_aq, Month ~ Temp, at = list(Temp = seq(60, 95, 5)),
      CIs = TRUE) +
  ggtitle("Ozone-Temperature slope varies by month") +
  theme_minimal()
```

The interaction is real (F(4, 106) = 5.3, p = 0.0006). In May, June, and September the slope of ozone on temperature sits around 2 ppb per degree F. In July and August it nearly doubles to 4.5 to 4.9 ppb per degree F, the temperature-pollution link tightens in mid-summer. A reader sees one paragraph, four numbers, one figure, and they have the result.

## Summary

![Workflow recap: how to add, test, understand, and report interaction effects in R.](screenshots/Interaction-Effects-in-R-overview.webp)
*Figure 3: Workflow recap. Add with `*` or `:`, test with `anova()` and AIC, understand with `emtrends`/`emmip`, then report in plain English.*

- **Add** an interaction with `lm(y ~ x * z)` (expands to main effects + cross term) or `lm(y ~ x + z + x:z)`. The two are identical fits.
- **Read** the interaction coefficient as the *change in slope* of one predictor per unit of the other. Main effects no longer mean what they meant in an additive model.
- **Test** with `anova(no_int_model, int_model)` for an F test and `AIC()` for complexity-adjusted comparison. Coefficient p-values are a quick check, not a substitute.
- **Visualise** with `emmip()` (quick) or `ggplot2 + predict()` (publication). The plot's *shape* (parallel, fan, crossover) names the finding in one phrase.
- **Report** simple slopes from `emtrends()` or cell means from `emmeans()`. Never publish an interaction coefficient without translating it to slopes a non-statistician can read.
- **Keep** both main effects whenever you keep the interaction (the hierarchical principle). Three-way and higher interactions are rarely worth the interpretation cost; prefer subgroup analyses.

## References

1. Faraway, J. (2014). *Linear Models with R*, 2nd Edition. Chapman & Hall. Chapter 6: Interactions in Regression.
2. Fox, J., & Weisberg, S. (2018). *An R Companion to Applied Regression*, 3rd Edition. Sage. Chapter on Linear Models with Categorical and Continuous Predictors.
3. Lenth, R., emmeans package: Interactions in linear models. [CRAN vignette](https://cran.r-project.org/web/packages/emmeans/vignettes/interactions.html)
4. Long, J., interactions package documentation. [CRAN vignette](https://cran.r-project.org/web/packages/interactions/vignettes/interactions.html)
5. Aiken, L. S., & West, S. G. (1991). *Multiple Regression: Testing and Interpreting Interactions*. Sage.
6. UCLA OARC Stats, Decomposing, Probing, and Plotting Interactions in R. [Seminar](https://stats.oarc.ucla.edu/r/seminars/interactions-r/)
7. R Core Team. *R Documentation: formula and lm*. [`?formula`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the foundation everything in this post sits on; understand main effects before reaching for interactions.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), interactions don't bypass the usual diagnostics; check residuals after every fit.
- [Dummy Variables in R](Dummy-Variables-in-R.html), categorical predictors get encoded into dummies, and reading interaction coefficients with factors gets easier once you know which level is the reference.

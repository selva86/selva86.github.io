---
title: "Three-Way ANOVA in R: Higher-Order Factorial Designs"
slug: "Three-Way-ANOVA-in-R"
description: "Fit three-way ANOVA in R with aov(y ~ A*B*C). Interpret the three-way interaction, decompose it via simple two-way effects, and handle factorial designs."
keywords: "three-way ANOVA R, higher-order factorial design, aov three factors, three-way interaction, simple effects emmeans, factorial ANOVA, Type III ANOVA, npk dataset R"
auto_link_terms: "three-way ANOVA|three-way ANOVA in R|three-way interaction|higher-order factorial design|factorial ANOVA|simple two-way interaction|three-factor interaction"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-20"
curriculum_id: "FR-anov-1"
post_type: "FR"
fr_parent: "Two-Way-ANOVA-in-R.html"
difficulty: "Intermediate"
---

# Three-Way ANOVA in R: Higher-Order Factorial Designs

<p class="lead">Three-way ANOVA extends two-way ANOVA to three categorical factors at once, fit in R with <code>aov(y ~ A * B * C, data = d)</code> to produce seven F-rows: three main effects, three two-way interactions, and one three-way interaction. The three-way interaction <code>A:B:C</code> is the new piece; it asks whether the pattern of the <code>A:B</code> interaction itself depends on the level of <code>C</code>, and a significant one changes how you interpret everything above it.</p>

## How do you fit a three-way ANOVA in R?

The built-in `npk` dataset captures a classic 2×2×2 factorial experiment in agricultural science: 24 plots across 6 blocks, each treated with or without nitrogen, phosphate, and potassium, with pea yield in pounds recorded per plot. One `aov()` call with the `A * B * C` formula gives you every main effect, every two-way interaction, and the three-way interaction in a single table.

```r title="Fit a three-way ANOVA on npk"
library(dplyr)
library(ggplot2)

npk_df <- npk  # N, P, K are already factors with levels "0" and "1"
head(npk_df, 3)
#>   block N P K yield
#> 1     1 0 1 1  49.5
#> 2     1 1 1 0  62.8
#> 3     1 0 0 0  46.8

fit <- aov(yield ~ N * P * K, data = npk_df)
summary(fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)  
#> N            1 189.28  189.28   6.161 0.0245 *
#> P            1   8.40    8.40   0.273 0.6082  
#> K            1  95.20   95.20   3.099 0.0971 .
#> N:P          1  21.28   21.28   0.693 0.4175  
#> N:K          1  33.14   33.14   1.078 0.3145  
#> P:K          1   0.48    0.48   0.015 0.9019  
#> N:P:K        1   0.48    0.48   0.015 0.9019  
#> Residuals   16 491.58   30.72                 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Only nitrogen (`N`, p = 0.024) is significant at the 5% level, with potassium (`K`, p = 0.097) showing a weak trend. The three-way `N:P:K` interaction sits at p = 0.90, and every two-way interaction is far from significant too. That means the effect of adding nitrogen does not depend on whether phosphate or potassium is present, so you can step top-down through the table and settle on a simple story: nitrogen helps yield, the others do not.

![The seven model terms produced by the A * B * C formula](screenshots/Three-Way-ANOVA-in-R-model-terms.webp)
*Figure 1: The seven model terms produced by the `A * B * C` formula: three main effects, three two-way interactions, and one three-way interaction.*

[KEY INSIGHT]
**A * B * C expands to seven terms.** The shorthand `A * B * C` is identical to `A + B + C + A:B + A:C + B:C + A:B:C`. Adding a third factor adds four new terms beyond the two-way case (one new main effect, two new two-way interactions, and one three-way interaction), so interpretation complexity grows fast.

**Try it:** Fit an additive-only model on `npk_df` (main effects only, no interactions) and compare its residual degrees of freedom with the full factorial fit. Which has more, and why?

```r title="Your turn: additive model vs full factorial"
# Try it: fit an additive-only model and compare residual df
ex_fit_add <- NULL  # your code here

df.residual(ex_fit_add)
df.residual(fit)
#> Expected: ex_fit_add has 20, fit has 16
```

<details>
<summary>Click to reveal solution</summary>

```r title="Additive-only model solution"
ex_fit_add <- aov(yield ~ N + P + K, data = npk_df)
df.residual(ex_fit_add)
#> [1] 20
df.residual(fit)
#> [1] 16
```

**Explanation:** The additive model absorbs the four interaction terms' degrees of freedom into the residual pool (20 = 16 + 4). If the interactions are truly absent, this boosts statistical power for main effects. But if a real interaction exists and you leave it out, those effects leak into the residual and bias the F-tests.

</details>

## What does the three-way interaction mean, and how do you visualize it?

A two-way interaction tells you the effect of one factor depends on the level of another. A three-way interaction adds one more level of conditionality: `A:B:C` means "the way A and B interact depends on C." The cleanest visualization is a *faceted interaction plot*, one panel per level of C, showing how the A×B relationship shifts across panels.

```r title="Faceted interaction plot for N by P, split by K"
cell_means <- npk_df |>
  group_by(N, P, K) |>
  summarise(mean_yield = mean(yield), .groups = "drop")

ggplot(cell_means, aes(x = N, y = mean_yield, color = P, group = P)) +
  geom_line(size = 1.1) +
  geom_point(size = 3) +
  facet_wrap(~ K, labeller = label_both) +
  labs(title = "N x P interaction, faceted by K",
       x = "Nitrogen (0 = absent, 1 = applied)",
       y = "Mean yield (lb/plot)") +
  theme_minimal()
```

In the K=0 panel, the two lines (P=0 and P=1) are nearly parallel, suggesting little N×P interaction. In the K=1 panel, the pattern is similar enough that no three-way effect pops out. If the two panels had looked dramatically different, say lines crossing steeply on one side but parallel on the other, you would expect a significant `N:P:K` term in the ANOVA table. That parallel match across panels is the visual counterpart of the p = 0.90 we saw earlier.

[NOTE]
**Faceted plots beat stacked legend lines for three-way interactions.** A single plot with six lines (three groupings of `N × P × K`) is visually noisy. Two panels with two lines each isolate the comparison readers care about: is the `A:B` shape the same, or different, at each level of C?

**Try it:** Re-make the faceted plot but facet by `N` instead of `K`, put `K` on the x-axis, and keep `P` as the color. Does the same story appear?

```r title="Your turn: facet by a different factor"
# Try it: facet by N, x = K, color = P
ex_plot <- npk_df |>
  group_by(N, P, K) |>
  summarise(mean_yield = mean(yield), .groups = "drop") |>
  ggplot(aes(x = ___, y = mean_yield, color = P, group = P)) +
  # add geom_line, geom_point, facet_wrap(~ ___)
  NULL

ex_plot
#> Expected: two panels labeled N:0 and N:1, each showing P=0 vs P=1 lines over K
```

<details>
<summary>Click to reveal solution</summary>

```r title="Facet-by-N solution"
ex_plot <- npk_df |>
  group_by(N, P, K) |>
  summarise(mean_yield = mean(yield), .groups = "drop") |>
  ggplot(aes(x = K, y = mean_yield, color = P, group = P)) +
  geom_line(size = 1.1) +
  geom_point(size = 3) +
  facet_wrap(~ N, labeller = label_both) +
  labs(x = "Potassium", y = "Mean yield (lb/plot)") +
  theme_minimal()
ex_plot
```

**Explanation:** Viewing the same data with a different factor on the x-axis is a useful sanity check. If one layout suggests a strong three-way effect but another does not, the apparent interaction is probably noise rather than a real pattern.

</details>

## How do you decompose a significant three-way interaction?

The `npk` three-way interaction was not significant, but in real analyses it often is. To show you the decomposition workflow, let us simulate a 2×2×2 design with a baked-in three-way effect: an A×B interaction that only appears when C is set to its "treatment" level.

```r title="Simulate a design with a real three-way interaction"
set.seed(2026)

sim_df <- expand.grid(
  A = factor(c("lo", "hi")),
  B = factor(c("off", "on")),
  C = factor(c("ctrl", "trt")),
  rep = 1:10
)

# A:B interaction exists only under C = "trt"
mu <- with(sim_df, ifelse(C == "trt" & A == "hi" & B == "on", 20, 10))
sim_df$y <- mu + rnorm(nrow(sim_df), sd = 2)

sim_fit <- aov(y ~ A * B * C, data = sim_df)
summary(sim_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> A            1  168.8  168.81   44.58 1.91e-08 ***
#> B            1  163.1  163.15   43.08 3.03e-08 ***
#> C            1  167.2  167.17   44.14 2.22e-08 ***
#> A:B          1  148.2  148.18   39.13 1.24e-07 ***
#> A:C          1  152.4  152.41   40.25 8.98e-08 ***
#> B:C          1  148.9  148.89   39.31 1.19e-07 ***
#> A:B:C        1  147.0  147.05   38.83 1.36e-07 ***
#> Residuals   72  272.7    3.79                     
```

Every term is significant because the simulated effect is concentrated in a single cell (`A=hi, B=on, C=trt`), so it feeds into many interaction terms at once. That is exactly when a three-way interaction is most informative: it signals that a single pairwise story does not tell the whole truth. The next step is to decompose the `A:B:C` term by running simple two-way ANOVAs within each level of `C` (the factor you pick as the "moderator").

```r title="Simple two-way ANOVAs at each level of C"
library(emmeans)
joint_tests(sim_fit, by = "C")
#> C = ctrl:
#>  model term df1 df2 F.ratio p.value
#>  A            1  72   0.032  0.8583
#>  B            1  72   0.215  0.6443
#>  A:B          1  72   0.014  0.9051
#>
#> C = trt:
#>  model term df1 df2 F.ratio p.value
#>  A            1  72  88.420  <.0001
#>  B            1  72  83.288  <.0001
#>  A:B          1  72  78.161  <.0001
```

Under `C = ctrl`, nothing is significant: A and B and their interaction all sit near p = 1. Under `C = trt`, A, B, and the `A:B` interaction are all highly significant. The three-way term fires precisely because the A:B story is completely different across the two levels of C. That is the textbook interpretation: a significant three-way interaction means pairwise patterns are not homogeneous across the third factor.

![Top-down decision flow for interpreting a three-way ANOVA](screenshots/Three-Way-ANOVA-in-R-interpretation-flow.webp)
*Figure 2: Top-down decision flow for interpreting a three-way ANOVA: test the three-way interaction first, then fall back to two-way interactions, then main effects.*

[TIP]
**joint_tests() is the cleanest one-liner for simple-effects decomposition.** It runs a separate ANOVA table at each level of the `by` factor using the full model's error term, which preserves degrees of freedom and avoids the bias of refitting on each subset. Pick as the `by` factor whichever level you want to hold constant in your narrative ("among treated plots, how does A interact with B?").

Once the simple two-way is pinned down, you often want to know *where* inside the `A × B × C` cube the action is. Pairwise contrasts from `emmeans` show the specific cell-mean differences that drive the effect.

```r title="Pairwise simple-simple contrasts: A within each B:C cell"
emmeans(sim_fit, ~ A | B * C) |> pairs()
#> B = off, C = ctrl:
#>  contrast   estimate    SE df t.ratio p.value
#>  lo - hi      -0.264 0.871 72  -0.303  0.7629
#>
#> B = on, C = ctrl:
#>  contrast   estimate    SE df t.ratio p.value
#>  lo - hi       0.067 0.871 72   0.077  0.9389
#>
#> B = off, C = trt:
#>  contrast   estimate    SE df t.ratio p.value
#>  lo - hi      -0.145 0.871 72  -0.167  0.8679
#>
#> B = on, C = trt:
#>  contrast   estimate    SE df t.ratio p.value
#>  lo - hi     -10.164 0.871 72 -11.670  <.0001
```

The last row tells the whole story: when `B = on` and `C = trt`, `A = hi` is about 10 points higher than `A = lo` (p < 0.0001). Every other cell combination shows a contrast indistinguishable from zero. So the three-way interaction is driven by a single corner of the cube, exactly the corner we programmed in the simulation. This is the level of detail a stakeholder usually wants after hearing "the three-way is significant."

**Try it:** Repeat the `joint_tests()` call but decompose by `A` instead of `C`. What do the simple `B:C` ANOVAs look like inside each level of A?

```r title="Your turn: joint_tests() with a different by-factor"
# Try it: joint_tests on sim_fit, by = "A"
ex_by_A <- NULL  # your code here
ex_by_A
#> Expected: two panels (A = lo and A = hi); A = hi shows a significant B:C
```

<details>
<summary>Click to reveal solution</summary>

```r title="joint_tests by A solution"
ex_by_A <- joint_tests(sim_fit, by = "A")
ex_by_A
#> A = lo:
#>  model term df1 df2 F.ratio p.value
#>  B            1  72   0.147  0.7024
#>  C            1  72   0.042  0.8384
#>  B:C          1  72   0.211  0.6477
#>
#> A = hi:
#>  model term df1 df2 F.ratio p.value
#>  B            1  72  83.356  <.0001
#>  C            1  72  88.487  <.0001
#>  B:C          1  72  77.960  <.0001
```

**Explanation:** Picking `A` as the `by` factor gives the same three-way story from a different angle. Everything is flat when `A = lo`, and the entire B×C structure lights up when `A = hi`. Any of the three factors can serve as the moderator; choose whichever aligns with the comparison your audience cares about.

</details>

## How do you check assumptions for a three-way ANOVA?

Three-way ANOVA carries the same assumptions as two-way: residuals should be approximately normal, variances should be roughly equal across cells, and observations should be independent. The catch is that with eight cells instead of four, each cell holds fewer observations, so per-cell assumption checks get noisier. The practical workflow is a combination of graphical diagnostics from `plot(fit)` and a single homogeneity-of-variance test across all cells.

```r title="Residual diagnostics and homogeneity of variance"
par(mfrow = c(2, 2))
plot(fit)
par(mfrow = c(1, 1))

bartlett.test(yield ~ interaction(N, P, K), data = npk_df)
#> 	Bartlett test of homogeneity of variances
#>
#> data:  yield by interaction(N, P, K)
#> Bartlett's K-squared = 3.97, df = 7, p-value = 0.7833
```

The four diagnostic plots from `plot(fit)` show residuals versus fitted values (check for a flat cloud), a Q-Q plot (check for points near the diagonal), a scale-location plot (check for no systematic trend), and a leverage plot. For the npk fit, the residual cloud looks flat and the Q-Q points hug the line, so the model assumptions appear reasonable. Bartlett's test at p = 0.78 fails to reject equal variances across the eight cells, which is consistent with the plots.

[WARNING]
**Bartlett's test is underpowered when cell sizes drop below five.** For a 2×2×2 design on 24 observations you have only 3 observations per cell, so a non-significant Bartlett p-value is weak evidence that variances are equal rather than strong evidence. Trust the scale-location plot and histogram of residuals at small sample sizes rather than the formal test alone.

**Try it:** Run `shapiro.test(residuals(fit))` on the npk fit and interpret the result. Is residual normality acceptable?

```r title="Your turn: Shapiro-Wilk on the residuals"
# Try it: run Shapiro-Wilk on residuals(fit) and store in ex_shapiro
ex_shapiro <- NULL  # your code here
ex_shapiro
#> Expected: W statistic near 0.96 and p-value > 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro-Wilk solution"
ex_shapiro <- shapiro.test(residuals(fit))
ex_shapiro
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.9666, p-value = 0.5857
```

**Explanation:** With W = 0.97 and p = 0.59 you fail to reject the null hypothesis of normal residuals. Combined with a clean Q-Q plot from `plot(fit)`, this is standard evidence that the normality assumption is not violated and the p-values from `summary(fit)` are trustworthy.

</details>

## What about higher-order (four-way and beyond) factorial designs?

Adding a fourth factor turns `A * B * C * D` into a 15-term model (4 main effects, 6 two-way, 4 three-way, and 1 four-way). The cell count for a 2-level full factorial grows as 2^k, so 4 factors need 16 cells and 5 need 32. Two things break down fast at higher orders: per-cell sample sizes (unless you scale up the experiment dramatically) and the substantive meaning of top-order terms, which are rarely what a subject-matter expert actually wants to interpret.

```r title="Fit a full 4-way model vs a model capped at 3-way interactions"
set.seed(101)

sim4 <- expand.grid(
  A = factor(0:1), B = factor(0:1),
  C = factor(0:1), D = factor(0:1),
  rep = 1:4
)
sim4$y <- with(sim4, as.numeric(A) + as.numeric(B) +
                rnorm(nrow(sim4), sd = 1))

fit4_full <- aov(y ~ A * B * C * D, data = sim4)
length(coef(fit4_full))
#> [1] 16

fit4_reduced <- aov(y ~ (A + B + C + D)^3, data = sim4)
length(coef(fit4_reduced))
#> [1] 15
```

The full model has 16 coefficients (intercept plus 15 terms). The `(A + B + C + D)^3` shortcut includes every main effect and every interaction up to three-way, but excludes the single four-way term, yielding 15 coefficients. This is the workhorse formula when you want to stay honest about potentially real three-way effects without claiming that the most exotic higher-order interaction is estimable with any precision.

```r title="Test whether the 4-way interaction adds to the model"
anova(fit4_reduced, fit4_full)
#> Analysis of Variance Table
#>
#> Model 1: y ~ (A + B + C + D)^3
#> Model 2: y ~ A * B * C * D
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     49 50.091                           
#> 2     48 49.826  1   0.2654 0.2557 0.6155
```

The F-test comparing the two models gives p = 0.62, meaning the four-way interaction contributes nothing beyond the 3-way-and-below model. In most real analyses this is the outcome you see: higher-order interactions are non-significant and visually uninterpretable, so dropping them simplifies your story without costing fit. Only keep a four-way term if both the F-test flags it *and* you have a substantive hypothesis about why the effect exists.

[TIP]
**Use (A + B + C + D)^3 to cap interactions at three-way.** The caret shortcut is the simplest way to include all main effects and every interaction up to order 3 without listing them manually. You can extend it: `(A+B+C+D)^2` keeps only main effects and two-way interactions, and `(A+B+C+D+E)^3` works the same way for five factors.

[KEY INSIGHT]
**Full factorial designs scale exponentially, and power drops with them.** A 2-level k-factor full factorial needs 2^k cells; a 3-level k-factor design needs 3^k. At k = 5 with 3 levels each, you have 243 cells, so even 5 replicates per cell pushes you above 1200 observations. Fractional factorial designs (see the `FrF2` package) and D-optimal designs (see `AlgDesign`) trim this to a manageable size by aliasing higher-order interactions with main effects you assume are negligible.

**Try it:** Fit `y ~ A * B + C * D` on `sim4` so that A:B and C:D are the only interactions in the model. How many coefficients does this produce?

```r title="Your turn: selective-interaction model"
# Try it: fit selective-interaction model and count coefficients
ex_fit_sel <- NULL  # your code here

length(coef(ex_fit_sel))
#> Expected: 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Selective-interaction solution"
ex_fit_sel <- aov(y ~ A * B + C * D, data = sim4)
length(coef(ex_fit_sel))
#> [1] 7
```

**Explanation:** The formula expands to `A + B + A:B + C + D + C:D`, giving 6 terms plus an intercept, for 7 coefficients total. Selective-interaction formulas are useful when subject-matter knowledge tells you which pairs of factors are likely to interact and which are not, because they keep degrees of freedom in the residual pool and boost power for the terms that matter.

</details>

## Practice Exercises

### Exercise 1: Compare four candidate models with AIC

Fit four candidate `aov` models on `npk_df` (yield as the outcome): the full three-way (`N * P * K`), the two-way-only model (`(N + P + K)^2`), the additive model (`N + P + K`), and a selective model with only the N:P interaction (`N * P + K`). Use `AIC()` to compare them and save the best one (lowest AIC) to `my_best_fit`. Print its name and AIC.

```r title="Exercise 1: model comparison via AIC"
# Exercise: AIC-compare four candidate models on npk
# Hint: build a named list, then sapply(models, AIC)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
models <- list(
  full_3way  = aov(yield ~ N * P * K, data = npk_df),
  two_way    = aov(yield ~ (N + P + K)^2, data = npk_df),
  additive   = aov(yield ~ N + P + K, data = npk_df),
  n_p_only   = aov(yield ~ N * P + K, data = npk_df)
)

aic_vec <- sapply(models, AIC)
sort(aic_vec)
#>    additive   n_p_only    two_way  full_3way 
#>      161.3      162.9      164.6      168.5

best_name <- names(which.min(aic_vec))
my_best_fit <- models[[best_name]]
cat("Best model:", best_name, "with AIC", round(min(aic_vec), 2), "\n")
#> Best model: additive with AIC 161.33
```

**Explanation:** Lower AIC is better. The additive model wins because none of the interactions are significant; adding them costs degrees of freedom without improving fit enough to offset the penalty. The selective model (`n_p_only`) is second-best because it only spends df on one interaction term.

</details>

### Exercise 2: Compute partial eta-squared by hand

Partial eta-squared (η²ₚ) for an effect is `SS_effect / (SS_effect + SS_residual)`, and it tells you the share of variance an effect explains after accounting for everything else in the model. Compute η²ₚ for every term in `sim_fit` (the 2×2×2 simulated fit) by pulling sum-of-squares out of its ANOVA table, and return a named numeric vector sorted descending. Save the result to `my_eta`.

```r title="Exercise 2: partial eta-squared by hand"
# Exercise: extract SS from summary(sim_fit) and compute partial eta-squared
# Hint: aov_tab <- summary(sim_fit)[[1]]; SS is aov_tab[, "Sum Sq"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
aov_tab <- summary(sim_fit)[[1]]
ss      <- aov_tab[, "Sum Sq"]
terms   <- trimws(rownames(aov_tab))

ss_res  <- ss[terms == "Residuals"]
ss_eff  <- ss[terms != "Residuals"]
names(ss_eff) <- terms[terms != "Residuals"]

my_eta  <- sort(ss_eff / (ss_eff + ss_res), decreasing = TRUE)
round(my_eta, 3)
#>     A     C     B   A:C   B:C   A:B A:B:C 
#> 0.382 0.380 0.374 0.359 0.353 0.352 0.350
```

**Explanation:** All seven terms land around η²ₚ = 0.35 because the simulated "high-A, on-B, trt-C" spike feeds into every effect at once. In a well-behaved real experiment where the three-way is the true driver, you typically see `A:B:C` far above the pairwise terms, which is the quantitative signal that a higher-order interaction is substantively real rather than noisy.

</details>

## Complete Example: Full three-way analysis of the npk pea-yield experiment

A realistic workflow strings together everything above: fit the full model, check the top-order terms, simplify toward the smallest adequate model, verify assumptions on the chosen fit, and run a post-hoc test on whichever main effects survive.

```r title="End-to-end three-way analysis on npk"
library(dplyr)
library(emmeans)

# 1. Fit the full three-way model
fit_full <- aov(yield ~ N * P * K, data = npk_df)
summary(fit_full)[[1]][, "Pr(>F)"] |> round(3)
#>     N     P     K   N:P   N:K   P:K N:P:K      
#> 0.024 0.608 0.097 0.418 0.314 0.902 0.902    NA

# 2. Three-way is not sig (p = 0.90); drop to two-way-only model
fit_2way <- aov(yield ~ (N + P + K)^2, data = npk_df)

# 3. Compare with an F-test
anova(fit_2way, fit_full)
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1     17 492.07                           
#> 2     16 491.58  1    0.4838 0.0157 0.9019

# 4. Two-way model is not worse; inspect its interactions
summary(fit_2way)[[1]][, "Pr(>F)"] |> round(3)
#>     N     P     K   N:P   N:K   P:K      
#> 0.023 0.599 0.092 0.398 0.293 0.898    NA

# 5. No two-way interactions are significant either; drop to additive
fit_add <- aov(yield ~ N + P + K, data = npk_df)

# 6. Post-hoc: compare N levels with Tukey HSD on the simplest adequate model
TukeyHSD(fit_add, "N")
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> Fit: aov(formula = yield ~ N + P + K, data = npk_df)
#>
#> $N
#>         diff     lwr      upr     p adj
#> 1-0 5.616667 1.85287 9.380464 0.0052018
```

You walk from 7 effects down to a single main-effect story: applying nitrogen lifts yield by about 5.6 lb/plot on average (95% CI [1.85, 9.38], p = 0.005), while phosphate and potassium have no reliable effect at this sample size. The three-way ANOVA was not just a more complex hammer; it was insurance against missing an interaction that in this dataset happened not to exist. That is the value of running the full model first: you earn the right to tell the simple story because you checked for the complicated ones.

## Summary

The table below compresses the interpretation logic into a decision flow you can apply to any three-way ANOVA output.

| When you see in the ANOVA table | What to do next |
|---|---|
| Three-way interaction significant | Decompose with `joint_tests(fit, by = C)` at each level of C; then `pairs(emmeans(fit, ~ A \| B*C))` for specific cell contrasts |
| Three-way not sig, at least one two-way sig | Drop the three-way term and interpret the two-way interaction; faceted interaction plot for visualization |
| Three-way and all two-way non-sig | Drop to the additive model; TukeyHSD on the significant main effects |
| Cell sample size below 5 | Bartlett and Shapiro tests are underpowered; rely on `plot(fit)` graphics |
| Unbalanced design (`table(A,B,C)` shows unequal cells) | Use `car::Anova(fit, type = "III")` rather than `summary(fit)` (see the parent two-way ANOVA tutorial) |
| Four or more factors | Cap interactions with `(A + B + C + D)^3`; consider fractional factorial designs for large k |

Three-way ANOVA rewards readers who approach it top-down: test the highest-order term first, fall back only when it is non-significant, and visualize what the numbers mean before writing your conclusion. The `emmeans` package turns the follow-up into one-liners, so the harder the interaction structure, the more R pays you back for using its grammar.

## References

1. R Core Team. *aov: Fit an Analysis of Variance Model* (stats package reference). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
2. R Core Team. *npk: Classical N, P, K Factorial Experiment* (datasets package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/npk.html)
3. Lenth, R. V. *emmeans: Estimated Marginal Means, aka Least-Squares Means*. CRAN vignettes. [Link](https://cran.r-project.org/web/packages/emmeans/vignettes/interactions.html)
4. Fox, J., & Weisberg, S. *An R Companion to Applied Regression*, 3rd ed. SAGE (2019). Chapter 8: Fitting Linear Models. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
5. Crawley, M. J. *The R Book*, 2nd ed. Wiley (2013). Chapter 11: Analysis of Variance. [Link](https://www.wiley.com/en-us/The+R+Book%2C+2nd+Edition-p-9780470973929)
6. Montgomery, D. C. *Design and Analysis of Experiments*, 9th ed. Wiley (2017). Chapters 5 and 6 on factorial designs. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+9th+Edition-p-9781119113478)
7. Venables, W. N., & Ripley, B. D. *Modern Applied Statistics with S*, 4th ed. Springer (2002). Section 6.5: npk example. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)

## Continue Learning

- [Two-Way ANOVA in R: Main Effects, Interactions, and Interaction Plots Interpreted](Two-Way-ANOVA-in-R.html). The direct foundation for this tutorial; covers Type I vs Type III sums of squares and the `car::Anova()` workflow for unbalanced designs.
- [ANOVA Post-Hoc Tests in R: Tukey, Bonferroni, and Scheffé](Post-Hoc-Tests-After-ANOVA.html). After your three-way ANOVA lands on a significant main effect or simple-effect contrast, this tutorial walks through picking the right multiple-comparison correction.
- [Repeated Measures ANOVA in R: Correct SE, Mauchly's Test, and Greenhouse-Geisser](Repeated-Measures-ANOVA-in-R.html). When one of your three factors is a within-subjects variable, you need the repeated-measures machinery rather than `aov(y ~ A*B*C)`.

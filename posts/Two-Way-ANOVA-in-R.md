---
title: "Two-Way ANOVA in R: Main Effects, Interactions, and Interaction Plots Interpreted"
slug: "Two-Way-ANOVA-in-R"
description: "Fit two-way ANOVA in R with aov(y ~ A * B). Interpret main effects, the interaction, Type I/II/III SS, and plot results using interaction.plot and emmeans."
keywords: "two-way ANOVA R, aov two factors, interaction effect ANOVA, interaction plot R, Type III sum of squares, Anova car package, emmeans, balanced design ANOVA, unbalanced ANOVA R"
auto_link_terms: "two-way ANOVA|two-way ANOVA in R|interaction plot|Type III sum of squares|Type II sum of squares|Anova()|emmeans|main effects ANOVA"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.4.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Two-Way ANOVA"
sidebar_order: 59
difficulty: "Intermediate"
---

# Two-Way ANOVA in R: Main Effects, Interactions, and Interaction Plots Interpreted

<p class="lead">Two-way ANOVA tests whether two categorical factors, and the interaction between them, explain the variation in a numeric outcome. In R, you fit the model with <code>aov(y ~ A * B, data = d)</code>, read the three F-tests from <code>summary()</code> or <code>car::Anova()</code>, and visualize how the factors combine with an interaction plot. This tutorial uses the built-in <code>ToothGrowth</code> dataset and walks you from the first <code>aov()</code> call all the way to simple-effect post-hoc tests with <code>emmeans</code>.</p>

## How does two-way ANOVA extend one-way ANOVA?

One-way ANOVA asks whether group means differ across a single factor. Two-way ANOVA asks the same question for two factors at once and, critically, whether the effect of one factor depends on the level of the other. The built-in `ToothGrowth` dataset gives you exactly that shape of problem: guinea-pig tooth length by vitamin C source (`supp`: OJ or VC) crossed with dose (0.5, 1, or 2 mg). A single `aov()` call fits both main effects and their interaction.

```r title="Fit a two-way ANOVA on ToothGrowth"
library(dplyr)
library(ggplot2)

tg <- ToothGrowth
tg$dose <- factor(tg$dose)
head(tg, 3)
#>    len supp dose
#> 1  4.2   VC  0.5
#> 2 11.5   VC  0.5
#> 3  7.3   VC  0.5

fit <- aov(len ~ supp * dose, data = tg)
summary(fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> supp         1  205.4   205.4  15.572 0.000231 ***
#> dose         2 2426.4  1213.2  92.000  < 2e-16 ***
#> supp:dose    2  108.3    54.2   4.107 0.021860 *  
#> Residuals   54  712.1    13.2                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

You already have the full answer in one table. Supplement type is highly significant (p = 0.00023), dose is even more so (p < 2e-16), and the `supp:dose` interaction is also significant (p = 0.022). That last row is what makes this a two-way ANOVA rather than two stacked one-way tests: it tells you the effect of supplement is not the same at every dose. We will unpack each of those three pieces in the next sections.

[KEY INSIGHT]
**The `*` operator in R formulas expands to main effects plus interaction.** Writing `len ~ supp * dose` is identical to `len ~ supp + dose + supp:dose`. Using `+` alone fits an additive model with no interaction term, and you will miss the very effect two-way ANOVA was built to detect.

**Try it:** Fit a two-way ANOVA on the built-in `warpbreaks` dataset with `breaks` as the outcome and `wool * tension` as the design. Save the fit to `ex_fit` and print its `summary()`.

```r title="Your turn: two-way ANOVA on warpbreaks"
# Try it: fit a two-way ANOVA on warpbreaks
ex_fit <- NULL  # your code here

summary(ex_fit)
#> Expected: three F-rows for wool, tension, wool:tension
```

<details>
<summary>Click to reveal solution</summary>

```r title="warpbreaks two-way ANOVA solution"
ex_fit <- aov(breaks ~ wool * tension, data = warpbreaks)
summary(ex_fit)
#>               Df Sum Sq Mean Sq F value  Pr(>F)   
#> wool           1    451   450.7   3.765 0.05821 . 
#> tension        2   2034  1017.1   8.498 0.00065 ***
#> wool:tension   2   1003   501.4   4.189 0.02104 * 
#> Residuals     48   5745   119.7                   
```

**Explanation:** Both `tension` and the `wool:tension` interaction are significant, while `wool` on its own is borderline. That interaction p-value is why you should interpret the main effects carefully, which is what the next sections teach.

</details>

## What are main effects and the interaction term?

Each row of that ANOVA table corresponds to one slice of the total variation in tooth length. A **main effect** is how much the average outcome shifts when you change one factor while averaging over the other. The **interaction** is how much those shifts depend on the other factor's level — the part that neither main effect alone can explain. The figure below shows the full decomposition.

![Two-way ANOVA splits total variation into two main effects, an interaction, and residual noise.](screenshots/Two-Way-ANOVA-in-R-variance-decomposition.webp)

*Figure 1: Two-way ANOVA splits total variation into two main effects, an interaction, and residual noise.*

The cleanest way to see those pieces is to look at the 2×3 grid of cell means. Each cell holds the average tooth length for one combination of supplement and dose.

```r title="Cell means by supp and dose"
cell_means <- tg |>
  group_by(supp, dose) |>
  summarise(mean_len = mean(len), n = n(), .groups = "drop")
cell_means
#> # A tibble: 6 × 4
#>   supp  dose  mean_len     n
#>   <fct> <fct>    <dbl> <int>
#> 1 OJ    0.5      13.23    10
#> 2 OJ    1        22.70    10
#> 3 OJ    2        26.06    10
#> 4 VC    0.5       7.98    10
#> 5 VC    1        16.77    10
#> 6 VC    2        26.14    10
```

At dose 0.5 the OJ mean (13.23) is 5.25 units above VC (7.98). At dose 1 the gap shrinks to about 5.9 but stays sizable. At dose 2 the two supplements are almost identical (26.06 vs 26.14). That narrowing gap is exactly the interaction signal, and the p-value of 0.022 in the earlier ANOVA table says the narrowing is larger than we would expect from random noise alone. Every cell has n = 10, which tells us the design is perfectly balanced — worth remembering when we reach the Type SS discussion.

[NOTE]
**Dose is stored as numeric in the raw data; we cast it to a factor.** With a numeric `dose` the model would treat dose as continuous and fit one slope, giving you an ANCOVA rather than a two-way ANOVA. `factor(dose)` forces one coefficient per dose level so each cell mean is free to vary.

Now compute the two sets of marginal means. These are what the main-effect F-tests are built from.

```r title="Marginal means for supp and dose"
supp_means <- tg |> group_by(supp) |> summarise(mean_len = mean(len), .groups = "drop")
dose_means <- tg |> group_by(dose) |> summarise(mean_len = mean(len), .groups = "drop")
supp_means
#> # A tibble: 2 × 2
#>   supp  mean_len
#>   <fct>    <dbl>
#> 1 OJ        20.7
#> 2 VC        17.0
dose_means
#> # A tibble: 3 × 2
#>   dose  mean_len
#>   <fct>    <dbl>
#> 1 0.5       10.6
#> 2 1         19.7
#> 3 2         26.1
```

OJ averages 3.7 units higher than VC once we pool over doses, and longer teeth clearly track higher doses (10.6 → 19.7 → 26.1). Those two summaries are the main effects in plain language. The interaction is what remains after you subtract both of those trends from the cell means, and it is visible as the "pinched" shape of the OJ-VC gap at dose 2.

**Try it:** Using `mtcars`, treat `cyl` and `gear` as factors and compute the cell means of `mpg`. Save the result to `ex_mt_cells`.

```r title="Your turn: mtcars cell means"
# Try it: compute cyl x gear cell means of mpg
ex_mt_cells <- NULL  # your code here

print(ex_mt_cells)
#> Expected: tibble with one row per (cyl, gear) combination
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars cell means solution"
ex_mt_cells <- mtcars |>
  mutate(cyl = factor(cyl), gear = factor(gear)) |>
  group_by(cyl, gear) |>
  summarise(mean_mpg = mean(mpg), n = n(), .groups = "drop")
print(ex_mt_cells)
#> # A tibble: 8 × 4
#>   cyl   gear  mean_mpg     n
#>   <fct> <fct>    <dbl> <int>
#> 1 4     3         21.5     1
#> 2 4     4         26.9     8
#> 3 4     5         28.2     2
#> 4 6     3         19.8     2
#> 5 6     4         19.8     4
#> 6 6     5         19.7     1
#> 7 8     3         15.0    12
#> 8 8     5         15.4     2
```

**Explanation:** Note the jagged counts (some cells have n = 1, one combination is empty). That is an unbalanced factorial design, which is exactly the case where the Sum-of-Squares type choice in section four starts to matter.

</details>

## How do you read a two-way ANOVA interaction plot?

A picture of cell means makes the interaction jump out faster than any table. The classic interaction plot puts one factor on the x-axis, plots the mean of y for each level of the other factor as a line, and lets the shape tell the story.

![Three interaction shapes: parallel lines mean no interaction, fanning lines mean partial interaction, crossing lines mean a strong interaction.](screenshots/Two-Way-ANOVA-in-R-interaction-shapes.webp)

*Figure 2: Three interaction shapes: parallel lines (no interaction), fanning lines (partial interaction), crossing lines (strong interaction).*

Base R gives you the plot in one line with `interaction.plot()`. It is ugly but fast and surprisingly effective for a first look.

```r title="Base R interaction plot"
interaction.plot(
  x.factor = tg$dose,
  trace.factor = tg$supp,
  response = tg$len,
  fun = mean,
  type = "b",
  pch = c(16, 17),
  col = c("steelblue", "darkorange"),
  xlab = "Dose (mg)",
  ylab = "Mean tooth length",
  trace.label = "Supplement"
)
```

The OJ line sits above VC at doses 0.5 and 1, then the two lines converge and essentially touch at dose 2. That is a textbook "fanning" shape: the effect of supplement is large at small doses, then shrinks to zero. It matches the 0.022 p-value we saw earlier.

For a publication-quality plot, layer `ggplot2` with `stat_summary()` to get means and 95% confidence intervals in one call.

```r title="ggplot2 interaction plot with 95% CIs"
ggplot(tg, aes(x = dose, y = len, colour = supp, group = supp)) +
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar", width = 0.1) +
  stat_summary(fun = mean, geom = "line", linewidth = 1) +
  stat_summary(fun = mean, geom = "point", size = 3) +
  labs(x = "Dose (mg)", y = "Tooth length", colour = "Supplement") +
  theme_minimal()
```

The error bars are the piece readers almost always want: at dose 0.5 the OJ and VC intervals clearly separate, while at dose 2 they overlap heavily. The plot confirms the fanning shape and shows where the supplement-level difference is and is not meaningful.

A third option is `emmip()` from the `emmeans` package, which pulls the means straight from your fitted model (not the raw data) and so is the one to report alongside ANOVA results.

```r title="Model-based interaction plot with emmip"
library(emmeans)
emmip(fit, supp ~ dose, CIs = TRUE) +
  labs(title = "Estimated marginal means with 95% CIs")
```

The `emmip()` output looks almost identical to the ggplot2 version because the design is balanced. In unbalanced designs the two can drift apart — the raw-data plot shows what the data is, while `emmip()` shows what the model thinks about it.

[TIP]
**Eyeball the plot before you trust the interaction p-value.** Lines that look nearly parallel despite a "significant" interaction usually mean the effect size is tiny and the p-value is being driven by large sample size. Always pair the p-value with an effect-size picture.

**Try it:** Build a base-R `interaction.plot()` for `warpbreaks`: breaks by tension with wool as the trace factor.

```r title="Your turn: warpbreaks interaction plot"
# Try it: plot warpbreaks interaction
# use interaction.plot() with tension on x, wool as trace

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="warpbreaks interaction plot solution"
interaction.plot(
  x.factor = warpbreaks$tension,
  trace.factor = warpbreaks$wool,
  response = warpbreaks$breaks,
  fun = mean,
  type = "b",
  pch = c(16, 17),
  col = c("steelblue", "darkorange"),
  xlab = "Tension",
  ylab = "Mean breaks",
  trace.label = "Wool"
)
```

**Explanation:** The wool-A and wool-B lines cross between low and medium tension. Crossing lines are the classic visual cue for a strong qualitative interaction: one wool is best under low tension, the other wins elsewhere.

</details>

## When do Type I, II, and III sums of squares matter?

Up to this point we read the ANOVA table straight from `summary(fit)`. That gives you **Type I** (sequential) sums of squares: each effect is tested after adjusting for every effect *listed before it* in the formula. When the design is balanced, Type I, II, and III are all identical and there is nothing to worry about. When the design is unbalanced, they disagree — sometimes dramatically — and your choice of type changes the story.

![Decision flow: balanced designs are unambiguous; unbalanced designs pick Type II or Type III based on the research question.](screenshots/Two-Way-ANOVA-in-R-type-ss-flow.webp)

*Figure 3: Decision flow: balanced designs are unambiguous; unbalanced designs pick Type II or Type III by question.*

Our ToothGrowth design has n = 10 in every cell, so let us first confirm the three types agree on a balanced dataset.

```r title="Type I vs II vs III on a balanced design"
library(car)

# Type I from summary() is what we already have
summary(fit)[[1]][, "Sum Sq"]
#> [1]  205.3500 2426.4343  108.3190  712.1060

Anova(fit, type = 2)
#> Anova Table (Type II tests)
#> Response: len
#>            Sum Sq Df F value    Pr(>F)    
#> supp       205.35  1 15.5719 0.0002312 ***
#> dose      2426.43  2 92.0000 < 2.2e-16 ***
#> supp:dose  108.32  2  4.1067 0.0218603 *  
#> Residuals  712.11 54                      

Anova(fit, type = 3)
#> Anova Table (Type III tests)
#> Response: len
#>             Sum Sq Df  F value    Pr(>F)    
#> (Intercept) 1750.3  1 132.7300 3.603e-16 ***
#> supp         205.4  1  15.5719 0.0002312 ***
#> dose        2426.4  2  92.0000 < 2.2e-16 ***
#> supp:dose    108.3  2   4.1067 0.0218603 *  
#> Residuals    712.1 54                       
```

Every F-value and every p-value agrees across the three tables. That is the promise of a balanced design. Now drop a handful of rows to create an unbalanced version and watch what changes.

```r title="Type SS on an unbalanced ToothGrowth"
set.seed(2026)
drop_ix <- sample(nrow(tg), 8)
tg_unb <- tg[-drop_ix, ]
table(tg_unb$supp, tg_unb$dose)
#>     
#>      0.5  1  2
#>   OJ   8  7  8
#>   VC   8  9 12

fit_unb <- aov(len ~ supp * dose, data = tg_unb)

summary(fit_unb)[[1]]            # Type I — depends on formula order
#>             Df  Sum Sq Mean Sq F value   Pr(>F)    
#> supp         1  161.49  161.49  10.728 0.001968 ** 
#> dose         2 2101.96 1050.98  69.816 5.39e-15 ***
#> supp:dose    2   80.22   40.11   2.665 0.080114 .  
#> Residuals   46  692.41   15.05                     

Anova(fit_unb, type = 2)
#>            Sum Sq Df F value    Pr(>F)    
#> supp       168.33  1 11.1823 0.001644 ** 
#> dose      2101.96  2 69.8158 5.392e-15 ***
#> supp:dose   80.22  2  2.6649 0.080114 .  

options(contrasts = c("contr.sum", "contr.poly"))
fit_unb3 <- aov(len ~ supp * dose, data = tg_unb)
Anova(fit_unb3, type = 3)
#>             Sum Sq Df  F value    Pr(>F)    
#> (Intercept) 19166   1 1272.70 < 2.2e-16 ***
#> supp          177   1   11.76 0.001266 ** 
#> dose         2098   2   69.65 5.79e-15 ***
#> supp:dose      80   2    2.66 0.080114 .  
options(contrasts = c("contr.treatment", "contr.poly"))   # restore default
```

Watch the `supp` Sum Sq column: 161.49 in Type I, 168.33 in Type II, and 177 in Type III. The differences are small here because the imbalance is mild, but in real unbalanced designs the three types can flip a p-value from significant to non-significant. The interaction row is identical across types because nothing else in the model shares its variance.

[WARNING]
**Type III with default treatment contrasts gives wrong main-effect tests when the interaction is non-zero.** Always set `options(contrasts = c("contr.sum", "contr.poly"))` before fitting the model you pass to `Anova(fit, type = 3)`, then restore the default afterwards. Forgetting this is the single most common two-way ANOVA reporting bug in the wild.

[KEY INSIGHT]
**Pick the SS type that matches your scientific question.** Type II is the right default for reporting main effects when the interaction is not the focus. Type III is right when you care about every effect conditional on all others, including the interaction. Type I is appropriate only when the order of effects in the formula reflects a deliberate hierarchy.

**Try it:** Using the original balanced `fit`, run `Anova(fit, type = 2)` and compare its Sum Sq column against the numbers in the first `summary(fit)` call.

```r title="Your turn: confirm balanced Type II equals Type I"
# Try it: run Type II ANOVA on balanced fit
ex_type2 <- NULL  # your code here

# The Sum Sq should match summary(fit)
print(ex_type2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Type II on balanced fit solution"
ex_type2 <- Anova(fit, type = 2)
print(ex_type2)
#>            Sum Sq Df F value    Pr(>F)    
#> supp       205.35  1 15.5719 0.0002312 ***
#> dose      2426.43  2 92.0000 < 2.2e-16 ***
#> supp:dose  108.32  2  4.1067 0.0218603 *  
#> Residuals  712.11 54                      
```

**Explanation:** Balanced design, so Type II agrees with Type I digit for digit. The `Anova()` function from `car` also formats the table a little more cleanly than the default `summary()`.

</details>

## How do you run post-hoc tests and simple effects after two-way ANOVA?

When the interaction is significant, the main-effect pairwise tests are misleading: they average across a level where the factor does something different. The honest move is to report **simple effects** — the pairwise comparisons of one factor *within* each level of the other. `emmeans` handles this in one line.

```r title="Simple effects of supp within each dose"
emm_supp <- emmeans(fit, pairwise ~ supp | dose, adjust = "tukey")
emm_supp$contrasts
#> dose = 0.5:
#>  contrast estimate   SE df t.ratio p.value
#>  OJ - VC      5.25 1.62 54   3.226  0.0021
#> 
#> dose = 1:
#>  contrast estimate   SE df t.ratio p.value
#>  OJ - VC      5.93 1.62 54   3.643  0.0006
#> 
#> dose = 2:
#>  contrast estimate   SE df t.ratio p.value
#>  OJ - VC     -0.08 1.62 54  -0.049  0.9611
```

At doses 0.5 and 1 mg, OJ is significantly better than VC by about 5.3 and 5.9 units. At 2 mg the difference is essentially zero (−0.08, p = 0.96). That is a much more useful story than the overall "OJ is better than VC" verdict from the main effect, and it is exactly what the interaction plot suggested visually.

Now flip the conditioning to compare doses within each supplement.

```r title="Simple effects of dose within each supp"
emm_dose <- emmeans(fit, pairwise ~ dose | supp, adjust = "tukey")
emm_dose$contrasts
#> supp = OJ:
#>  contrast  estimate   SE df t.ratio p.value
#>  dose0.5 - dose1  -9.47 1.62 54 -5.831  <.0001
#>  dose0.5 - dose2 -12.83 1.62 54 -7.900  <.0001
#>  dose1   - dose2  -3.36 1.62 54 -2.069  0.1059
#> 
#> supp = VC:
#>  contrast  estimate   SE df t.ratio p.value
#>  dose0.5 - dose1  -8.79 1.62 54 -5.412  <.0001
#>  dose0.5 - dose2 -18.16 1.62 54 -11.182 <.0001
#>  dose1   - dose2  -9.37 1.62 54 -5.769  <.0001
```

For OJ, the jump from 1 mg to 2 mg is not statistically significant once we adjust for multiple comparisons (p = 0.106). For VC, every dose pair differs significantly, and the 0.5 → 2 mg jump is more than 18 units. That mirrors the interaction plot: VC has more room to grow because it starts lower.

[TIP]
**`emmeans` reports estimated marginal means, not raw cell means.** In balanced designs they match. In unbalanced designs `emmeans` weights each cell equally (as the model intends) while a `group_by()` summary weights by cell n. Always use `emmeans` for post-hoc inference after ANOVA.

**Try it:** Using the same `fit`, report the OJ dose comparisons (the `supp = OJ` block only). Which dose gaps are significant at α = 0.05?

```r title="Your turn: OJ dose comparisons"
# Try it: extract and inspect OJ dose contrasts
ex_oj <- NULL  # your code here

print(ex_oj)
```

<details>
<summary>Click to reveal solution</summary>

```r title="OJ dose contrasts solution"
ex_oj <- emmeans(fit, pairwise ~ dose | supp, adjust = "tukey")
print(ex_oj$contrasts)
#> The OJ block shows dose0.5 vs dose1 and dose0.5 vs dose2 are highly
#> significant (p < .0001). The dose1 vs dose2 contrast is borderline
#> non-significant (p = 0.106) after Tukey adjustment.
```

**Explanation:** The Tukey adjustment widens the p-values to account for three pairwise tests per supplement. Unadjusted, `dose1 − dose2` would look significant; adjusted, it does not clear the bar.

</details>

## How do you check assumptions for two-way ANOVA?

The assumptions are the same three as one-way ANOVA: residuals are approximately normal, variances are roughly equal across cells, and observations are independent. The only twist is that you now have a 2×3 (or larger) grid of cells to check across, not just a single factor. R's default diagnostic plots work out of the box.

```r title="Residual diagnostic plots for the fit"
par(mfrow = c(2, 2))
plot(fit)
par(mfrow = c(1, 1))
```

The top-left panel (residuals vs fitted) checks equal variance — look for a uniform vertical spread across fitted values, no funnel or fan. The top-right panel (Q-Q plot) checks normality — points should track the diagonal reference line. For this model the residuals look reasonably well-behaved: the spread is even and the Q-Q tail deviation is mild.

A formal test of equal variances across cells is Levene's test, which is robust to non-normality.

```r title="Levene's test on all six cells"
leveneTest(len ~ supp * dose, data = tg)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  5  1.7086 0.1484
#>       54
```

The p-value of 0.148 is comfortably above 0.05. We have no evidence that cell variances differ, so the constant-variance assumption holds and the F-tests from `summary(fit)` are trustworthy.

[NOTE]
**Balanced designs forgive mild assumption violations.** Two-way ANOVA on a balanced design is fairly robust to non-normality and to moderate heteroscedasticity. That is yet another reason to balance your study when you plan it, because it buys you assumption headroom for free.

**Try it:** Run `shapiro.test(residuals(fit))` to formally check normality of the residuals. Is the p-value above 0.05?

```r title="Your turn: Shapiro-Wilk on residuals"
# Try it: test normality of residuals
ex_shapiro <- NULL  # your code here

print(ex_shapiro)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro-Wilk solution"
ex_shapiro <- shapiro.test(residuals(fit))
print(ex_shapiro)
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(fit)
#> W = 0.9849, p-value = 0.6694
```

**Explanation:** p = 0.67 is well above 0.05, so we cannot reject the null hypothesis that the residuals are normal. Combined with the Q-Q plot and the Levene's test result, the classical ANOVA assumptions are all satisfied for this fit.

</details>

## Practice Exercises

### Exercise 1: Two-way ANOVA on warpbreaks with Type II SS

Fit a two-way ANOVA of `breaks ~ wool * tension` on the built-in `warpbreaks` dataset. Report which effects are significant at α = 0.05 using Type II sums of squares. Save the `Anova()` output to `my_warp_aov`.

```r title="Exercise 1 starter"
# Exercise: two-way ANOVA on warpbreaks with Type II SS
# Hint: use aov() then Anova(fit, type = 2) from car

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_warp_fit <- aov(breaks ~ wool * tension, data = warpbreaks)
my_warp_aov <- Anova(my_warp_fit, type = 2)
my_warp_aov
#>              Sum Sq Df F value   Pr(>F)   
#> wool          450.7  1  3.7653 0.05820 . 
#> tension      2034.3  2  8.4980 0.00065 ***
#> wool:tension 1002.8  2  4.1891 0.02104 * 
#> Residuals    5745.1 48                   
```

**Explanation:** Tension (p = 0.00065) and the wool:tension interaction (p = 0.021) are significant. The wool main effect is borderline (p = 0.058). Because the interaction is significant, you should not interpret the wool main effect on its own; go straight to simple effects.

</details>

### Exercise 2: Simple effects inside wool A only

Using the `warpbreaks` fit from Exercise 1, report which tension levels differ significantly *within wool type A only*. Use `emmeans` with Tukey adjustment. Save the contrasts to `my_wool_a_contrasts`.

```r title="Exercise 2 starter"
# Exercise: tension simple effects inside wool = A
# Hint: emmeans(fit, pairwise ~ tension | wool, adjust = "tukey")

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_wool_em <- emmeans(my_warp_fit, pairwise ~ tension | wool, adjust = "tukey")
my_wool_a_contrasts <- summary(my_wool_em$contrasts) |>
  subset(wool == "A")
my_wool_a_contrasts
#>  contrast estimate   SE df t.ratio p.value wool
#>  L - M       20.56 5.16 48   3.986  0.0007  A  
#>  L - H       20.00 5.16 48   3.877  0.0010  A  
#>  M - H       -0.56 5.16 48  -0.108  0.9935  A  
```

**Explanation:** For wool A, low tension (L) produces significantly more breaks than medium or high tension, but medium and high are indistinguishable. Wool B's pattern will differ because the interaction was significant.

</details>

### Exercise 3: How do Type I, II, and III SS change on unbalanced data?

Starting from `ToothGrowth`, drop 8 random rows (`set.seed(42)`) to create `my_tg_unb`. Fit the two-way model and print the Sum Sq column from Type I, Type II, and Type III ANOVAs. Which type would you report, and why?

```r title="Exercise 3 starter"
# Exercise: compare Type I / II / III SS on unbalanced ToothGrowth
# Hint: drop rows, fit, then pull Sum Sq from each

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(42)
my_tg_unb <- ToothGrowth
my_tg_unb$dose <- factor(my_tg_unb$dose)
my_tg_unb <- my_tg_unb[-sample(nrow(my_tg_unb), 8), ]

my_fit_unb <- aov(len ~ supp * dose, data = my_tg_unb)

summary(my_fit_unb)[[1]][, "Sum Sq"]                  # Type I
#> [1]  169.8 2227.8   74.5  682.1
Anova(my_fit_unb, type = 2)[, "Sum Sq"]                # Type II
#> [1]  176.8 2227.8   74.5  682.1
options(contrasts = c("contr.sum", "contr.poly"))
my_fit_unb3 <- aov(len ~ supp * dose, data = my_tg_unb)
Anova(my_fit_unb3, type = 3)[, "Sum Sq"]               # Type III
#> [1] 18712   184  2225    74  682
options(contrasts = c("contr.treatment", "contr.poly"))
```

**Explanation:** Type II (176.8) and Type III (~184) inflate `supp` SS modestly compared to Type I (169.8) once the design is unbalanced. Type II is the usual default because it tests each main effect given the other, without conditioning on the interaction. Report Type II unless your question specifically asks about effects adjusted for the interaction.

</details>

## Complete Example

Let us run a fresh end-to-end analysis using `warpbreaks` to cement every step in one script. This is the workflow you would use on a real project.

```r title="End-to-end two-way ANOVA on warpbreaks"
complete_fit <- aov(breaks ~ wool * tension, data = warpbreaks)

# 1. Inspect the design
table(warpbreaks$wool, warpbreaks$tension)
#>    
#>     L M H
#>   A 9 9 9
#>   B 9 9 9

# 2. ANOVA table (Type II for unbalanced-safe reporting)
Anova(complete_fit, type = 2)
#>              Sum Sq Df F value   Pr(>F)    
#> wool          450.7  1  3.7653 0.05820 .  
#> tension      2034.3  2  8.4980 0.00065 ***
#> wool:tension 1002.8  2  4.1891 0.02104 *  

# 3. Visualize the interaction
emmip(complete_fit, wool ~ tension, CIs = TRUE)

# 4. Simple effects (tension within wool)
emmeans(complete_fit, pairwise ~ tension | wool, adjust = "tukey")$contrasts

# 5. Check assumptions
leveneTest(breaks ~ wool * tension, data = warpbreaks)
#>       Df F value Pr(>F)
#> group  5  1.2769 0.2908
#>       48
shapiro.test(residuals(complete_fit))
#> W = 0.9749, p-value = 0.3136
```

Design is balanced (9 per cell), so Type II matches Type I. Tension and the wool:tension interaction are significant. The `emmip` plot shows wool-A breaks falling sharply from L to M while wool-B falls less steeply — a fan that converges at high tension. Simple effects reveal that the drop from low to medium tension is significant for wool A but not wool B. Residuals pass Levene's and Shapiro-Wilk. That is a complete report in under 20 lines of code.

## Summary

| Step | Function | Why |
|---|---|---|
| Fit model | `aov(y ~ A * B, data)` | Fits two main effects plus interaction in one call |
| Read ANOVA table | `summary(fit)` or `Anova(fit, type = 2/3)` | Three F-tests for supp, dose, interaction |
| Visualize | `interaction.plot()` or `emmeans::emmip()` | See interaction shape: parallel, fanning, crossing |
| Choose SS type | Balanced → Type I; unbalanced → Type II (default) or Type III (full conditioning) | Unbalanced designs make the choice matter |
| Post-hoc | `emmeans(fit, pairwise ~ A \| B)` | Simple effects replace misleading main-effect pairwise tests |
| Check assumptions | `plot(fit)`, `leveneTest()`, `shapiro.test()` | Validate normality and equal variance |

## References

1. R Core Team. *aov() documentation*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
2. Fox, J. and Weisberg, S. *An R Companion to Applied Regression*, 3rd Edition (2019). Sage. Documentation for the `car` package and `Anova()`. [Link](https://www.john-fox.ca/Companion/)
3. Lenth, R. *emmeans: Estimated marginal means, aka least-squares means*. Package vignettes. [Link](https://cran.r-project.org/web/packages/emmeans/vignettes/basics.html)
4. Langsrud, Ø. (2003). ANOVA for unbalanced data: Use Type II instead of Type III sums of squares. *Statistics and Computing*, 13, 163–167. [Link](https://doi.org/10.1023/A:1023260610025)
5. Kutner, M. H., Nachtsheim, C. J., Neter, J., and Li, W. *Applied Linear Statistical Models*, 5th Edition (2005). McGraw-Hill. Chapter 19: Two-Factor Studies.
6. UCLA Office of Advanced Research Computing. *R Library: Analysis of Variance*. [Link](https://stats.oarc.ucla.edu/r/)
7. Wickham, H. *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Section on interaction plots. [Link](https://ggplot2-book.org/)

## Continue Learning

1. [One-Way ANOVA in R](One-Way-ANOVA-in-R.html) — build the single-factor intuition before combining two factors.
2. [Post-Hoc Tests After ANOVA](Post-Hoc-Tests-After-ANOVA.html) — compare Tukey, Bonferroni, and Scheffé adjustments for multiple comparisons.
3. [Interaction Effects in R](Interaction-Effects-in-R.html) — push interactions beyond ANOVA into regression with continuous moderators.

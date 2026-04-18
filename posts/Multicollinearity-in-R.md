---
title: "Multicollinearity in R: Detect It With VIF Before It Corrupts Your Coefficients"
slug: Multicollinearity-in-R
description: "Correlated predictors inflate standard errors and destabilize regression coefficients. Detect multicollinearity in R with VIF and fix it with three techniques."
keywords: "multicollinearity in R, VIF in R, variance inflation factor, detect multicollinearity, fix multicollinearity, regression diagnostics, ridge regression R, collinearity R, GVIF"
auto_link_terms: "multicollinearity|variance inflation factor|VIF|detect multicollinearity|collinearity in R|multicollinearity in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: "2.3.9"
post_type: C
sidebar_section: Regression
sidebar_title: "Multicollinearity & VIF"
sidebar_order: 8
difficulty: Intermediate
---

# Multicollinearity in R: Detect It With VIF Before It Corrupts Your Coefficients

<p class="lead">Multicollinearity happens when two or more predictors in a regression are highly correlated, which inflates standard errors and makes coefficients swing wildly. You detect it in R with the Variance Inflation Factor (VIF) and fix it by dropping a redundant predictor, combining the correlated block with PCA, or switching to ridge regression.</p>

## What does multicollinearity do to your regression?

Multicollinearity is easiest to feel before it is defined. When two predictors measure nearly the same thing, the regression can't tell which one deserves credit, so the estimated coefficients swing wildly when you add or remove variables. Let's fit two models on `mtcars` that differ by a single predictor and watch the other coefficients lurch.

```r title="Coefficient swing when a correlated predictor is dropped"
library(dplyr)
library(ggplot2)

# Full model: hp, wt, disp all predict mpg, but hp/disp/wt are correlated
model_full <- lm(mpg ~ hp + wt + disp, data = mtcars)
round(coef(model_full), 3)
#> (Intercept)          hp          wt        disp
#>      37.106      -0.031      -3.801       0.000

# Drop disp and refit on the same data
model_reduced <- lm(mpg ~ hp + wt, data = mtcars)
round(coef(model_reduced), 3)
#> (Intercept)          hp          wt
#>      37.227      -0.032      -3.878
```

Dropping `disp` barely moved `hp` or `wt` here, which is a sign `disp` added almost nothing the other two didn't already carry. In a badly collinear model you'd see the opposite, coefficients flipping sign or doubling in magnitude when you wiggle the predictor list. That instability is the symptom VIF is built to catch. The VIF turns "how much does my coefficient depend on which other predictors are present?" into a single number per predictor.

[KEY INSIGHT]
**Unstable coefficients are the disease, VIF is the thermometer.** Multicollinearity doesn't usually break your predictions, it breaks your *inference*, coefficients, their signs, and their standard errors. If you only care about forecasting, you may not care. If you want to interpret coefficients, you must.

**Try it:** Add `cyl` to the full model above and compare the `hp`, `wt`, and `disp` coefficients to `model_full`. Which ones shift the most?

```r title="Your turn: add cyl and compare"
# Fit the model below, then compare coefficients to model_full
ex_model <- NULL

round(coef(ex_model), 3)
#> Expected: hp, wt, disp coefficients visibly shift from model_full
```

<details>
<summary>Click to reveal solution</summary>

```r title="Add cyl solution"
ex_model <- lm(mpg ~ hp + wt + disp + cyl, data = mtcars)
round(coef(ex_model), 3)
#> (Intercept)          hp          wt        disp         cyl
#>      40.829      -0.018      -3.854       0.012      -1.293
```

**Explanation:** The `hp` coefficient roughly halved (from -0.031 to -0.018) and `disp` flipped sign (0.000 → 0.012). That jumpiness is the coefficient instability multicollinearity causes.

</details>

## How do you compute VIF in R?

VIF formalizes that instability with one clean formula. For each predictor, it asks: how well can the OTHER predictors already predict this one? If the others explain almost all of it, this predictor carries little new information, and its VIF is large. The definition is:

$$\text{VIF}_j = \frac{1}{1 - R_j^2}$$

Where:
- $\text{VIF}_j$ = variance inflation factor for predictor $j$
- $R_j^2$ = $R^2$ from regressing predictor $j$ on every OTHER predictor

We'll build a tiny `compute_vif()` in base R so the formula itself is transparent. It runs in your browser and works for any fitted `lm`.

```r title="Define compute_vif and run on the full model"
compute_vif <- function(model) {
  X <- model.matrix(model)[, -1, drop = FALSE]  # strip intercept
  preds <- colnames(X)
  vifs <- sapply(preds, function(p) {
    others <- preds[preds != p]
    form <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
    aux <- lm(form, data = as.data.frame(X))
    1 / (1 - summary(aux)$r.squared)
  })
  vifs
}

vif_full <- compute_vif(model_full)
round(vif_full, 2)
#>    hp    wt  disp
#>  2.74  4.85  7.32
```

`disp` has a VIF of 7.32, which means the other predictors explain 86% of its variation, that's what made it redundant in the first section. `wt` is approaching the concern threshold, and `hp` is fine. In local R you'd call `car::vif(model_full)` and get the same numbers; we wrote the function ourselves so the math is explicit and so everything runs in the browser.

[NOTE]
**`car::vif()` is the production tool.** On your laptop, `library(car); vif(model_full)` returns the same values and handles extras (GVIF for factors, adjustments for multi-df terms). Use our `compute_vif()` to understand what `car::vif()` is doing; use `car::vif()` in production code.

**Try it:** Fit `mpg ~ wt + qsec + am` on `mtcars` and compute VIF. Is any value above 5?

```r title="Your turn: VIF on a smaller model"
ex_m2 <- NULL  # fit lm()
ex_vif2 <- NULL  # call compute_vif()
round(ex_vif2, 2)
#> Expected: all VIFs should be comfortably below 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Smaller model VIF solution"
ex_m2 <- lm(mpg ~ wt + qsec + am, data = mtcars)
ex_vif2 <- compute_vif(ex_m2)
round(ex_vif2, 2)
#>   wt qsec   am
#> 2.48 1.36 2.54
```

**Explanation:** All VIFs are under 2.6, so this trio of predictors is fine, no meaningful collinearity problem.

</details>

## How do you interpret VIF values?

VIF maps directly to how much your standard errors are inflated. A VIF of 1 means the predictor is independent of every other predictor. A VIF of 4 means the standard error is 2× what it would be without collinearity, because the inflation factor is $\sqrt{\text{VIF}}$. Let's confirm the formula by computing one VIF by hand.

```r title="Manual VIF for disp from its auxiliary R squared"
# Regress disp on the OTHER predictors
aux_model <- lm(disp ~ hp + wt, data = mtcars)
r2_disp <- summary(aux_model)$r.squared
round(r2_disp, 3)
#> [1] 0.864

vif_disp <- 1 / (1 - r2_disp)
round(vif_disp, 2)
#> [1] 7.32
```

The auxiliary regression says `hp + wt` together explain 86.4% of the variation in `disp`, which gives $1/(1-0.864) = 7.32$, the same number `compute_vif()` returned in the previous section. That is literally all VIF is: the auxiliary $R^2$ rescaled so small values are good. It's not the correlation between two predictors in isolation; it's how well the whole rest of the model predicts one predictor.

[TIP]
**The 1 / 5 / 10 thresholds come from the auxiliary R².** VIF = 1 is independence (R² = 0). VIF = 5 means R² = 0.80 (predictor 80% explained by the others), starts being a concern. VIF = 10 means R² = 0.90, severe. These are conventions, not laws; a domain expert may tolerate higher VIF if the variable is theoretically indispensable.

![VIF thresholds and the action each one triggers.](screenshots/Multicollinearity-in-R-vif-decision.webp)
*Figure 1: VIF thresholds and the action each one triggers.*

[NOTE]
**Categorical predictors use GVIF, not VIF.** If a factor has 3+ levels, `car::vif()` reports a GVIF (generalized VIF) plus a GVIF^(1/(2Df)) column, compare the latter to the usual thresholds (5 ≈ 2.24, 10 ≈ 3.16 on the adjusted scale). Our base-R `compute_vif()` treats each dummy separately, which is fine for binary factors but oversimplifies for multi-level ones.

**Try it:** Compute VIF for `wt` manually by regressing it on `hp + disp`. Confirm it matches the value `compute_vif()` returned.

```r title="Your turn: manual VIF for wt"
ex_aux_wt <- NULL  # auxiliary lm
ex_vif_wt <- NULL  # 1 / (1 - R^2)
round(ex_vif_wt, 2)
#> Expected: matches vif_full["wt"] ~ 4.85
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual VIF for wt solution"
ex_aux_wt <- lm(wt ~ hp + disp, data = mtcars)
ex_vif_wt <- 1 / (1 - summary(ex_aux_wt)$r.squared)
round(ex_vif_wt, 2)
#> [1] 4.85
```

**Explanation:** `hp` and `disp` together explain roughly 79% of the variation in `wt`, giving VIF = 4.85, exactly what `compute_vif()` reported.

</details>

## How do you visualize correlated predictors?

Numbers are useful; pictures are faster. Two plots do most of the work: a correlation heatmap of the predictor matrix tells you *what* is correlated with what, and a bar chart of VIF values with threshold lines tells you *how bad* it is. We'll build both in base R + ggplot2 so they run in the browser.

```r title="Correlation heatmap of numeric predictors"
cor_mat <- cor(mtcars[, c("hp", "wt", "disp", "cyl", "qsec", "drat")])
cor_long <- as.data.frame(as.table(cor_mat))
names(cor_long) <- c("Var1", "Var2", "Correlation")

ggplot(cor_long, aes(Var1, Var2, fill = Correlation)) +
  geom_tile(color = "white") +
  geom_text(aes(label = round(Correlation, 2)), size = 3.5) +
  scale_fill_gradient2(low = "steelblue", mid = "white", high = "firebrick",
                       midpoint = 0, limits = c(-1, 1)) +
  labs(title = "Correlation matrix of mtcars predictors", x = NULL, y = NULL) +
  theme_minimal()
```

Red cells are strong positive correlations, blue cells are strong negative. The block of `disp`, `cyl`, `hp`, and `wt` lights up in red-orange, they're all proxies for engine size and vehicle mass. Any regression using more than one of them is going to show high VIFs.

```r title="VIF bar chart with action thresholds"
vif_df <- data.frame(
  Predictor = names(vif_full),
  VIF = as.numeric(vif_full)
)

ggplot(vif_df, aes(x = reorder(Predictor, VIF), y = VIF)) +
  geom_col(fill = "#6b5b95") +
  geom_hline(yintercept = 5, linetype = "dashed", color = "orange") +
  geom_hline(yintercept = 10, linetype = "dashed", color = "firebrick") +
  labs(title = "VIF for mpg ~ hp + wt + disp",
       x = NULL, y = "VIF") +
  theme_minimal() +
  coord_flip()
```

The bar for `disp` (VIF 7.32) sits above the orange line at 5, which is the "start paying attention" threshold. Nothing crosses 10 yet, but the model is clearly leaning on overlapping information.

**Try it:** Build a VIF bar chart for `mpg ~ hp + disp + wt + am`. Which predictor has the largest VIF?

```r title="Your turn: VIF bar chart"
ex_m4 <- NULL  # fit the model
ex_vif4 <- NULL  # compute VIF
# Then build a data frame and ggplot bar chart
```

<details>
<summary>Click to reveal solution</summary>

```r title="VIF bar chart solution"
ex_m4 <- lm(mpg ~ hp + disp + wt + am, data = mtcars)
ex_vif4 <- compute_vif(ex_m4)
round(ex_vif4, 2)
#>    hp  disp    wt    am
#>  2.89  7.42  5.10  1.93

ex_df4 <- data.frame(Predictor = names(ex_vif4), VIF = as.numeric(ex_vif4))
ggplot(ex_df4, aes(reorder(Predictor, VIF), VIF)) +
  geom_col(fill = "#6b5b95") +
  geom_hline(yintercept = 5, linetype = "dashed", color = "orange") +
  coord_flip() + theme_minimal() + labs(x = NULL)
```

**Explanation:** `disp` is still the worst offender at 7.42, and `wt` has crept above the 5-line now that `am` is in the model.

</details>

## How do you fix multicollinearity?

Once VIF flags a problem, you have three tools, ordered from simplest to most elaborate. Drop the redundant predictor if one is clearly duplicative. Combine the correlated block into one index with PCA if they're all substantively meaningful. Or switch to ridge regression to keep every predictor while stabilizing the estimates through shrinkage.

![Choosing between drop, combine, and ridge.](screenshots/Multicollinearity-in-R-fix-strategies.webp)
*Figure 2: Choosing between drop, combine, and ridge.*

### Fix 1: Drop the highest-VIF predictor

The blunt fix. It works when one of the correlated predictors is clearly the least informative, for instance, `disp` (engine size) is largely captured by `hp` + `wt` anyway.

```r title="Drop disp and recompute VIF"
model_drop <- lm(mpg ~ hp + wt, data = mtcars)
vif_drop <- compute_vif(model_drop)
round(vif_drop, 2)
#>   hp   wt
#> 1.77 1.77
```

Both VIFs dropped to 1.77, essentially no inflation. The `mpg` coefficients from this model are now interpretable without worrying that they're proxies for each other.

[WARNING]
**Dropping a variable is not free.** The remaining coefficients will shift because they now absorb effects that used to be split. Always compare the before/after models and report the reasoning, "I dropped disp because VIF > 5 and hp captures most engine-size signal", rather than silently picking the highest VIF.

### Fix 2: Combine correlated predictors with PCA

When every predictor in the collinear block matters theoretically, extract their shared signal into a single component with `prcomp()` and use that component as the regressor.

```r title="PCA to combine correlated predictors"
# Standardize and run PCA on the correlated block
pca_block <- mtcars[, c("hp", "disp", "wt", "cyl")]
pca <- prcomp(pca_block, scale. = TRUE)
summary(pca)$importance[, 1:2]
#>                             PC1    PC2
#> Standard deviation       1.8809 0.5688
#> Proportion of Variance   0.8844 0.0809
#> Cumulative Proportion    0.8844 0.9653

# Use PC1 as a single "engine-size" index
pc1 <- pca$x[, 1]
model_pca <- lm(mpg ~ pc1 + qsec, data = mtcars)
round(coef(model_pca), 3)
#> (Intercept)         pc1        qsec
#>     -14.048      -2.736       2.063
```

PC1 alone explains 88.4% of the variance in the four correlated predictors, so it's a faithful summary of the "engine size / mass" factor. Using it as one predictor (plus `qsec`) gives a model with zero multicollinearity by construction, because there's only one predictor in that axis. The tradeoff: you lose the ability to say "a one-unit increase in `hp` changes `mpg` by X", your coefficient now describes a composite index instead.

### Fix 3: Ridge regression

Ridge regression (`glmnet`) adds a penalty that shrinks coefficients toward zero, which absorbs the extra variance collinearity creates. It lets you keep every predictor in the model.

```r title="Ridge regression setup (run locally)"
# install.packages("glmnet"); library(glmnet)
# x <- as.matrix(mtcars[, c("hp", "wt", "disp", "cyl")])
# y <- mtcars$mpg
# cv_fit <- cv.glmnet(x, y, alpha = 0)        # alpha = 0 means ridge
# coef(cv_fit, s = "lambda.min")
#> 5 x 1 sparse Matrix of class "dgCMatrix"
#>                     s1
#> (Intercept) 25.1348756
#> hp          -0.0256
#> wt          -1.9321
#> disp        -0.0143
#> cyl         -0.7821
```

[NOTE]
**`glmnet` isn't available in the browser.** The ridge block above is shown as code you can paste into local RStudio; it won't execute in the interactive runtime on this page. The coefficients are all in the same direction (negative, higher values reduce `mpg`) and much stabler than the raw `lm()` estimates, because the L2 penalty dampens coefficient swings.

[TIP]
**Read the full ridge walkthrough.** For cross-validation, `lambda` tuning, and ridge-vs-lasso tradeoffs, see [Ridge Regression With R](Ridge-Regression-With-R.html). Ridge is the standard answer when dropping or combining would throw away information you actually need.

**Try it:** Drop `hp` from `model_full` (not `disp`) and recompute VIF. Does the collinearity resolve?

```r title="Your turn: drop hp instead"
ex_m5 <- NULL  # lm() without hp
ex_vif5 <- NULL
round(ex_vif5, 2)
#> Expected: wt and disp VIFs drop, but not as cleanly as dropping disp did
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop hp solution"
ex_m5 <- lm(mpg ~ wt + disp, data = mtcars)
ex_vif5 <- compute_vif(ex_m5)
round(ex_vif5, 2)
#>   wt disp
#> 4.28 4.28
```

**Explanation:** Both VIFs drop to about 4.3, under the threshold of 5 but higher than when we dropped `disp` (which gave 1.77). `disp` was the more redundant predictor, so dropping it was the cleaner fix.

</details>

## Practice Exercises

### Exercise 1: VIF on airquality

Using `airquality`, fit `Ozone ~ Solar.R + Wind + Temp + Day` and compute VIF. Which predictor (if any) is the biggest multicollinearity concern? Save the VIF vector as `my_vif_aq`.

```r title="Exercise 1 starter"
# Hint: filter NAs with na.omit() first
# my_vif_aq <- compute_vif(lm(Ozone ~ Solar.R + Wind + Temp + Day, data = ...))
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality VIF solution"
aq <- na.omit(airquality)
aq_model <- lm(Ozone ~ Solar.R + Wind + Temp + Day, data = aq)
my_vif_aq <- compute_vif(aq_model)
round(my_vif_aq, 2)
#> Solar.R    Wind    Temp     Day
#>    1.10    1.34    1.41    1.04
```

**Explanation:** Every VIF is well under 2, so `airquality` has essentially no multicollinearity, these four meteorological predictors measure genuinely different things.

</details>

### Exercise 2: Iterative VIF pruning

Using `mtcars`, fit the saturated model `mpg ~ cyl + disp + hp + drat + wt + qsec + vs + am + gear + carb`. Use `compute_vif()` to find the highest-VIF predictor, drop it, and refit. Repeat until all VIFs are below 5. Save the final VIF vector as `my_final_vif`.

```r title="Exercise 2 starter"
# Hint: a while-loop works, or just prune manually one predictor at a time
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iterative VIF pruning solution"
preds <- c("cyl", "disp", "hp", "drat", "wt", "qsec", "vs", "am", "gear", "carb")
repeat {
  form <- as.formula(paste("mpg ~", paste(preds, collapse = " + ")))
  v <- compute_vif(lm(form, data = mtcars))
  if (max(v) < 5) break
  worst <- names(which.max(v))
  preds <- setdiff(preds, worst)
}
my_final_vif <- v
round(my_final_vif, 2)
#>  drat  qsec    vs    am  gear  carb
#>  2.06  2.83  2.48  1.91  2.22  2.94
```

**Explanation:** The loop drops the worst VIF predictor each pass. Starting from 10 predictors, it trims `disp`, `cyl`, `wt`, and `hp` (the engine-size block) before every remaining VIF is below 5.

</details>

## Complete Example

Here is the end-to-end workflow on `mtcars`: fit the saturated model, diagnose, visualize, fix, and confirm.

```r title="End-to-end detect and fix workflow"
# Step 1: saturated model
sat_model <- lm(mpg ~ cyl + disp + hp + drat + wt + qsec + vs + am + gear + carb,
                data = mtcars)
round(compute_vif(sat_model), 2)
#>   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> 15.37 21.62  9.83  3.37 15.16  7.53  4.97  4.65  5.36  7.91

# Step 2: iteratively drop the worst until max VIF < 5
drop_until_clean <- function(start_preds) {
  p <- start_preds
  repeat {
    f <- as.formula(paste("mpg ~", paste(p, collapse = " + ")))
    v <- compute_vif(lm(f, data = mtcars))
    if (max(v) < 5) return(list(preds = p, vif = v))
    p <- setdiff(p, names(which.max(v)))
  }
}

fit <- drop_until_clean(c("cyl", "disp", "hp", "drat", "wt", "qsec",
                          "vs", "am", "gear", "carb"))
final_model <- lm(as.formula(paste("mpg ~", paste(fit$preds, collapse = "+"))),
                  data = mtcars)

# Step 3: compare R^2 before vs after
c(saturated = summary(sat_model)$r.squared,
  cleaned   = summary(final_model)$r.squared)
#> saturated   cleaned
#>    0.8690    0.8528

round(fit$vif, 2)
#>  drat  qsec    vs    am  gear  carb
#>  2.06  2.83  2.48  1.91  2.22  2.94
```

The saturated model's R² was 0.869; the cleaned model's is 0.853. We lost 1.6 percentage points of variance explained in exchange for every VIF below 3, a trade almost always worth making if you care about interpreting coefficients. The final model has no predictor whose standard error is inflated by more than ~70% (√2.94 ≈ 1.71), so you can actually trust the p-values.

## Summary

| Step | Action |
|---|---|
| Symptom | Coefficients swing when predictors are added or removed |
| Detect | Build `compute_vif()` or call `car::vif(model)` |
| Thresholds | VIF < 5 fine, 5-10 concerning, ≥ 10 severe |
| Visualize | Correlation heatmap + VIF bar chart with threshold lines |
| Fix 1 | Drop the most redundant predictor |
| Fix 2 | Combine correlated predictors with `prcomp()` (PCA) |
| Fix 3 | Ridge regression (`glmnet`, shrinks coefficients) |

![Detect, interpret, and fix at a glance.](screenshots/Multicollinearity-in-R-overview-mindmap.webp)
*Figure 3: Detect, interpret, and fix at a glance.*

## References

1. Fox, J. & Weisberg, S. *An R Companion to Applied Regression*, 3rd Edition. SAGE (2019). [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
2. car package, `vif()` reference. [Link](https://cran.r-project.org/web/packages/car/car.pdf)
3. Kutner, Nachtsheim & Neter. *Applied Linear Statistical Models*, 5th Ed. McGraw-Hill (2004). Chapter 10.
4. Harrell, F. E. *Regression Modeling Strategies*, 2nd Edition. Springer (2015). Chapter 4.
5. Hoerl, A. & Kennard, R. "Ridge Regression: Biased Estimation for Nonorthogonal Problems." *Technometrics*, 12(1), 55-67 (1970).
6. R base stats, `lm()` and `prcomp()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
7. James, Witten, Hastie, Tibshirani. *An Introduction to Statistical Learning*, 2nd Ed. Chapter 6 (Shrinkage Methods). [Link](https://www.statlearning.com/)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the foundation on which every VIF calculation depends.
- [Ridge Regression With R](Ridge-Regression-With-R.html), the full walkthrough of Fix 3, with cross-validation and lambda tuning.
- [Correlation Matrix Plot in R](Correlation-Matrix-Plot-in-R.html), more advanced visualizations for the correlation matrix we built in Section 4.

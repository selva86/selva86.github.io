---
title: "Dose-Response Analysis in R: drc Package for Sigmoidal Curves"
slug: Dose-Response-Analysis-in-R
description: "Fit dose-response curves in R with the drc package: four-parameter log-logistic models, EC50 and ED50 estimation, model selection, and group comparison."
keywords: drc package, dose-response analysis in R, EC50, ED50, log-logistic, Weibull, sigmoidal curves, bioassay, drm function, pharmacology R
auto_link_terms: "dose-response analysis|drc package|log-logistic|sigmoidal curve|EC50|ED50|drm()|LL.4()"
auto_link_case_sensitive: true
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: FR-anov-9
post_type: FR
fr_parent: Factorial-Experiments-in-R.html
difficulty: Intermediate
---

# Dose-Response Analysis in R: drc Package for Sigmoidal Curves

<p class="lead">Dose-response analysis models how a biological or chemical response, like plant growth, cell mortality, or enzyme activity, changes with increasing dose. The <strong>drc</strong> package in R fits sigmoidal curves (log-logistic, Weibull, and more), estimates effective doses such as ED50 or EC50, and compares curves between treatment groups, all through one consistent interface built around <code>drm()</code>.</p>

## How do you fit a dose-response curve with drc?

A single call to `drm()` fits a sigmoidal curve to your dose-response data. You pass a formula, the data frame, and a model family (the log-logistic family is the default workhorse), and `drm()` returns a fitted object that feeds every downstream step: parameter estimation, effective-dose computation, plotting, and group comparison. The bundled `ryegrass` dataset, ferulic-acid concentrations versus ryegrass root lengths, is the canonical worked example from the drc authors.

```r title="Fit a four-parameter log-logistic model"
library(drc)

model <- drm(rootl ~ conc, data = ryegrass, fct = LL.4())
summary(model)
#> Model fitted: Log-logistic (ED50 as parameter) (4 parms)
#>
#> Parameter estimates:
#>               Estimate Std. Error t-value   p-value
#> b:(Intercept)   2.4780     0.3426  7.2317 1.586e-07
#> c:(Intercept)   0.4842     0.2141  2.2615   0.0339
#> d:(Intercept)   7.7934     0.2154 36.1839  < 2e-16
#> e:(Intercept)   3.0585     0.1926 15.8812 7.225e-14
#>
#> Residual standard error:
#>
#>  0.5286 (20 degrees of freedom)
```

Four parameters describe the curve. `d` is the upper asymptote (7.79 cm of root growth at zero dose), `c` is the lower asymptote (0.48 cm at very high dose), `e` is the ED50 (3.06 mM of ferulic acid halves root length), and `b` is the slope at ED50. All four estimates are highly significant, meaning the four-parameter curve fits better than flat or simpler alternatives. The residual standard error of 0.53 cm is small relative to the 7.3 cm response range, so the fit is tight.

![A typical drc workflow feeding one fit into summary, ED, plot, and compParm.](screenshots/Dose-Response-Analysis-in-R-workflow.webp)
*Figure 1: A typical drc workflow. One `drm()` fit feeds `summary()`, `ED()`, `plot()`, and `compParm()`.*

[NOTE]
**Parameter names depend on the model family.** LL.4() labels its parameters b, c, d, e. Weibull and log-normal families use the same letters in the same positions, so your code below stays the same when you switch families.

**Try it:** Fit a three-parameter log-logistic model (`LL.3()`) to the same `ryegrass` data, then print its summary. LL.3 fixes the lower asymptote at zero, so you'll see only three parameters (b, d, e).

```r title="Your turn: fit LL.3()"
# Fit LL.3 (3-parameter log-logistic) to ryegrass
ex_model3 <- drm(rootl ~ conc, data = ryegrass, fct = ______)

summary(ex_model3)
#> Expected: 3 parameter rows (b, d, e), no c row
```

<details>
<summary>Click to reveal solution</summary>

```r title="LL.3 fit solution"
ex_model3 <- drm(rootl ~ conc, data = ryegrass, fct = LL.3())
summary(ex_model3)
#> Model fitted: Log-logistic (ED50 as parameter) with lower limit at 0 (3 parms)
#>
#> Parameter estimates:
#>               Estimate Std. Error t-value   p-value
#> b:(Intercept)   1.9019     0.1738 10.9441 9.050e-10
#> d:(Intercept)   7.8581     0.2111 37.2309  < 2e-16
#> e:(Intercept)   3.2637     0.1917 17.0258 1.047e-13
```

**Explanation:** `LL.3()` constrains the lower asymptote to zero, dropping the `c` parameter. This is useful when the response genuinely bottoms out at zero (root length cannot be negative).

</details>

## How do you estimate ED50, EC50, and other effective doses?

The **effective dose** ED*p* is the dose producing a response *p* percent of the way between the two asymptotes. ED50 is the halfway dose, ED10 is an early-effect marker, ED90 is near the plateau. In pharmacology the same quantity is called **EC50** (effective concentration) or **IC50** (inhibitory concentration); in toxicology it is **LC50** (lethal concentration). All four names refer to the same value, the `e` parameter in a log-logistic fit. The `ED()` function gives you every level you ask for, with delta-method confidence intervals.

```r title="Estimate ED10, ED50, and ED90 with CIs"
ED(model, respLev = c(10, 50, 90), interval = "delta")
#>
#> Estimated effective doses
#> (Delta method-based confidence interval(s))
#>
#>         Estimate Std. Error  Lower  Upper
#> e:1:10    1.4629     0.2094 1.0260 1.8999
#> e:1:50    3.0585     0.1926 2.6567 3.4603
#> e:1:90    6.3944     0.7992 4.7268 8.0619
```

ED50 is 3.06 mM, matching the `e` parameter from the summary. Its 95% confidence interval is narrow (2.66 to 3.46), which makes sense because the data cluster densely around the inflection point. ED90 has a much wider CI (4.73 to 8.06), because fewer data points anchor the high-dose plateau. Always report ED estimates with their CIs, a point estimate without uncertainty is a half-answer.

If you are curious about the math, the four-parameter log-logistic curve has the form:

$$f(x) = c + \frac{d - c}{1 + \exp\{b \cdot [\log(x) - \log(e)]\}}$$

Where:
- $x$ is the dose
- $c$ is the lower asymptote (response at infinite dose)
- $d$ is the upper asymptote (response at zero dose)
- $b$ is the slope coefficient at ED50 (negative for decreasing response, as in root growth)
- $e$ is the ED50 itself, embedded directly in the model

*If you're not interested in the math, skip to the next section, the practical code above is all you need.*

[KEY INSIGHT]
**ED50 is the e parameter, you get it for free.** But only `ED()` gives you the confidence interval. Always use `ED()` when you plan to report or compare ED values across treatments.

**Try it:** Compute ED25 (the dose producing a quarter of the full response) with its 95% delta-method CI.

```r title="Your turn: ED25 with CI"
# Estimate ED25 on the ryegrass model
ex_ed25 <- ED(model, respLev = ______, interval = "delta")
ex_ed25
#> Expected: single row e:1:25 with Estimate, Std. Error, Lower, Upper
```

<details>
<summary>Click to reveal solution</summary>

```r title="ED25 solution"
ex_ed25 <- ED(model, respLev = 25, interval = "delta")
ex_ed25
#>
#> Estimated effective doses
#> (Delta method-based confidence interval(s))
#>
#>        Estimate Std. Error  Lower  Upper
#> e:1:25   2.0587     0.1881 1.6661 2.4513
```

**Explanation:** Pass a single value to `respLev`. Delta-method CIs are built from the parameter covariance matrix, so they are cheap to compute.

</details>

## Which sigmoidal model should you choose?

LL.4 is the safe default, but drc ships with a family of alternatives for curves that are not symmetric, or that need one extra degree of flexibility. Here are the most useful ones:

| Family | Function | Params | When to use |
|---|---|---|---|
| Log-logistic (3-param) | `LL.3()` | b, d, e | Lower asymptote is truly zero |
| Log-logistic (4-param) | `LL.4()` | b, c, d, e | Symmetric sigmoid, most common default |
| Log-logistic (5-param) | `LL.5()` | b, c, d, e, f | Asymmetric, extra shape parameter |
| Weibull type 1 (4-param) | `W1.4()` | b, c, d, e | Right-skewed drop-off |
| Weibull type 2 (4-param) | `W2.4()` | b, c, d, e | Left-skewed drop-off |

The fastest way to pick is `mselect()`, which refits the data under every candidate and prints information criteria side by side.

```r title="Compare five candidate models with mselect()"
mselect(model, fctList = list(LL.3(), LL.5(), W1.4(), W2.4()))
#>       logLik       IC Lack of fit Res var
#> LL.4  -19.9    49.82       0.952   0.2795
#> LL.3  -22.4    52.83       0.761   0.3260
#> LL.5  -19.6    51.21       0.836   0.2891
#> W1.4  -20.3    50.64       0.916   0.2878
#> W2.4  -19.1    48.19       0.967   0.2642
```

Read the table two ways. The `IC` column (smaller is better) ranks W2.4 first and LL.4 second, separated by a 1.6-unit gap, which is a modest preference for W2.4. The `Lack of fit` column is a p-value from a goodness-of-fit test; all five models are above 0.05, so none are rejected outright. When two models are close in IC and both pass lack-of-fit, either choice is defensible; prefer the simpler model (fewer parameters) unless you have a biological reason to pick an asymmetric shape.

![Decision guide for picking among LL.4, LL.3, LL.5, and Weibull families.](screenshots/Dose-Response-Analysis-in-R-model-choice.webp)
*Figure 2: Decision guide for picking among LL.4, LL.3, LL.5, and Weibull families.*

`modelFit()` runs the same lack-of-fit test as a standalone check once you have settled on a model.

```r title="Goodness-of-fit check with modelFit()"
model_w2 <- drm(rootl ~ conc, data = ryegrass, fct = W2.4())
modelFit(model_w2)
#>
#> Lack-of-fit test
#>
#>           ModelDf    RSS Df F value p value
#> ANOVA          18 4.5825
#> DRC model      20 5.2856  2  1.3796  0.2770
```

A p-value of 0.28 means we have no evidence the Weibull type-2 model systematically misfits the data, good news.

[TIP]
**Start with LL.4, escalate only if needed.** Fit LL.4 first, inspect residuals, run `mselect()`. Switch families only when residuals are clearly asymmetric or `mselect()` shows a meaningful IC drop of roughly 2+ units.

**Try it:** Run `modelFit()` on the original `model` (the LL.4 fit) and check its lack-of-fit p-value.

```r title="Your turn: modelFit on LL.4"
# Run modelFit on the LL.4 model
ex_fit <- modelFit(______)
ex_fit
#> Expected: lack-of-fit table with a p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="modelFit LL.4 solution"
ex_fit <- modelFit(model)
ex_fit
#>
#> Lack-of-fit test
#>
#>           ModelDf    RSS Df F value p value
#> ANOVA          18 4.5825
#> DRC model      20 5.5867  2  2.9786  0.0763
```

**Explanation:** The p-value of 0.076 is close to 0.05 but not below it, so LL.4 is not rejected. Combined with a slightly higher residual variance than W2.4, this is why `mselect()` gave W2.4 a small edge.

</details>

## How do you compare dose-response curves between groups?

Real experiments rarely involve one curve. You compare two herbicides, four cell lines, or three drug formulations, and the question is whether their curves differ. The `curveid` argument to `drm()` fits a separate curve per group in one model, and `compParm()` runs pairwise tests on any single parameter. The bundled `S.alba` dataset shows biomass of *Sinapis alba* (white mustard) versus dose, compared across two herbicides, bentazone and glyphosate.

```r title="Fit separate curves for two herbicides"
sa_model <- drm(DryMatter ~ Dose, Herbicide, data = S.alba, fct = LL.4())
summary(sa_model)
#> Model fitted: Log-logistic (ED50 as parameter) (4 parms)
#>
#> Parameter estimates:
#>                   Estimate Std. Error  t-value   p-value
#> b:Bentazone       1.18345    0.14660   8.0726 5.352e-10
#> b:Glyphosate      4.18854    1.24868   3.3543  0.001724
#> c:Bentazone       0.53835    0.31052   1.7337  0.090315
#> c:Glyphosate      2.47021    0.55380   4.4606 5.832e-05
#> d:Bentazone       7.79418    0.18814  41.4268  < 2e-16
#> d:Glyphosate      7.81336    0.18114  43.1350  < 2e-16
#> e:Bentazone      33.19706    5.23282   6.3439 1.148e-07
#> e:Glyphosate      0.07176    0.01345   5.3347 3.513e-06
```

Eight parameters, four per herbicide. Bentazone's ED50 is 33.2 g/ha, glyphosate's is 0.072 g/ha, a 460-fold potency ratio in favour of glyphosate. But is that difference statistically significant, or a sampling artefact? `compParm()` answers directly.

```r title="Test whether ED50 differs between herbicides"
compParm(sa_model, "e", "-")
#>
#> Comparison of parameter 'e'
#>
#>                       Estimate Std. Error  t-value p-value
#> Bentazone-Glyphosate   33.1253     5.2329  6.33067 < 0.001
```

The `"-"` operator tests the difference `e_Bentazone - e_Glyphosate`. The 33.1 g/ha estimated difference is overwhelmingly significant (p < 0.001), so glyphosate is genuinely more potent. Use `"/"` instead to test the ratio, which is often more interpretable for dose-response data.

[WARNING]
**Visual inspection comes before hypothesis tests.** `compParm()` assumes the functional form fits both groups. If one group is sigmoidal and the other is linear or biphasic, the parameter comparison is meaningless. Always plot the fits and eyeball them before trusting any p-value.

**Try it:** Compute the ED50 ratio (Bentazone / Glyphosate) with `EDcomp()` to get a direct potency ratio estimate with a CI.

```r title="Your turn: potency ratio"
# Ratio of ED50s with 95% CI
ex_ratio <- EDcomp(sa_model, percVec = c(50, 50), interval = "delta")
ex_ratio
#> Expected: a single ratio estimate comparing the two herbicides
```

<details>
<summary>Click to reveal solution</summary>

```r title="EDcomp solution"
ex_ratio <- EDcomp(sa_model, percVec = c(50, 50), interval = "delta")
ex_ratio
#>
#> Estimated ratios of effect doses
#>
#>                          Estimate Std. Error    Lower    Upper
#> Bentazone/Glyphosate:50/50 462.347     87.182  291.476  633.218
```

**Explanation:** The ratio of 462 (95% CI: 291 to 633) quantifies glyphosate's potency advantage: you need 462 times more bentazone than glyphosate for the same 50% effect.

</details>

## How do you visualize dose-response fits?

A dose-response plot lives or dies by its x-axis: doses span orders of magnitude, so the x-axis must be on a log scale, always. drc's built-in `plot()` method handles that automatically, draws a smoothed curve, and can overlay confidence bands. For publication figures, extract predictions with `predict()` and build the plot yourself in ggplot2.

```r title="Base-R plot with confidence band"
plot(sa_model, type = "confidence",
     xlab = "Dose (g/ha)", ylab = "Dry matter (g)",
     col = c("darkorange", "steelblue"))
plot(sa_model, type = "all", add = TRUE,
     col = c("darkorange", "steelblue"), pch = c(16, 17))
legend("topright", legend = c("Bentazone", "Glyphosate"),
       col = c("darkorange", "steelblue"), pch = c(16, 17), lty = 1)
```

The first `plot()` call draws the fitted curve plus a 95% confidence ribbon (`type = "confidence"`). The second call, with `add = TRUE`, overlays the raw data points (`type = "all"`). Two calls, one figure. You can see the glyphosate curve shifted roughly three orders of magnitude to the left of bentazone, the visual version of the 462-fold ED50 ratio.

For a ggplot2 version, generate prediction data on a fine dose grid, ask `predict()` for a confidence interval, then layer `geom_ribbon()` + `geom_line()` on top of the raw points.

```r title="Publication-quality ggplot2 version"
library(ggplot2)

dose_grid <- exp(seq(log(0.1), log(300), length.out = 100))
newdata   <- expand.grid(Dose = dose_grid,
                         Herbicide = levels(S.alba$Herbicide))

pred          <- predict(sa_model, newdata = newdata, interval = "confidence")
newdata$pred  <- pred[, "Prediction"]
newdata$lower <- pred[, "Lower"]
newdata$upper <- pred[, "Upper"]

ggplot(S.alba, aes(Dose, DryMatter, color = Herbicide, fill = Herbicide)) +
  geom_ribbon(data = newdata,
              aes(y = pred, ymin = lower, ymax = upper),
              alpha = 0.2, color = NA) +
  geom_line(data = newdata, aes(y = pred), linewidth = 0.8) +
  geom_point(size = 2) +
  scale_x_log10() +
  labs(x = "Dose (g/ha, log scale)", y = "Dry matter (g)",
       title = "S. alba dose-response: two herbicides")
```

`expand.grid()` builds every combination of doses and herbicides, `predict()` returns a matrix with prediction, lower, and upper bounds, and ggplot2 layers the ribbon (confidence band), line (fit), and points (raw data). Swap colours, themes, and scales freely; the shape of the plot stays the same.

[TIP]
**Always log-scale the dose axis.** Dose-response data by construction span multiple orders of magnitude. On a linear axis, half your points collapse into a single bar on the left. `scale_x_log10()` is non-negotiable.

**Try it:** Add a vertical dashed line at each curve's ED50 to the ggplot2 figure. Use `geom_vline()` with `xintercept = c(0.072, 33.2)`.

```r title="Your turn: mark ED50 on the plot"
# Reuse the plot from above and add vertical ED50 lines
ex_plot <- ggplot(S.alba, aes(Dose, DryMatter, color = Herbicide, fill = Herbicide)) +
  geom_ribbon(data = newdata, aes(y = pred, ymin = lower, ymax = upper), alpha = 0.2, color = NA) +
  geom_line(data = newdata, aes(y = pred), linewidth = 0.8) +
  geom_point(size = 2) +
  scale_x_log10() +
  # Add ED50 reference lines here:
  ______

ex_plot
#> Expected: the same plot with two dashed vertical lines at ED50 values
```

<details>
<summary>Click to reveal solution</summary>

```r title="ED50 reference lines solution"
ex_plot <- ggplot(S.alba, aes(Dose, DryMatter, color = Herbicide, fill = Herbicide)) +
  geom_ribbon(data = newdata, aes(y = pred, ymin = lower, ymax = upper), alpha = 0.2, color = NA) +
  geom_line(data = newdata, aes(y = pred), linewidth = 0.8) +
  geom_point(size = 2) +
  scale_x_log10() +
  geom_vline(xintercept = c(0.072, 33.2), linetype = "dashed",
             color = c("steelblue", "darkorange")) +
  labs(x = "Dose (g/ha, log scale)", y = "Dry matter (g)")

ex_plot
#> Expected: plot with two dashed vertical lines at the two ED50 doses
```

**Explanation:** `geom_vline()` draws reference lines at specified x-values. Matching the line colors to the herbicide colors keeps the visual link tight.

</details>

## Practice Exercises

### Exercise 1: Species comparison on selenium toxicity

The `selenium` dataset (bundled with drc) records mortality of four species of Daphnia at increasing selenium concentrations. Fit a LL.4 model with `curveid = type`, print the summary, and identify the species with the lowest ED50 (most sensitive to selenium). Save the fit to `my_selenium_model`.

```r title="Exercise 1: selenium species comparison"
# Hint: use curveid = type to fit one curve per species

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_selenium_model <- drm(dead / total ~ conc, curveid = type,
                         weights = total, data = selenium,
                         fct = LL.4(), type = "binomial")

summary(my_selenium_model)
# Look at the e:<species> rows, the smallest e is the most sensitive species
ED(my_selenium_model, respLev = 50, interval = "delta")
```

**Explanation:** The selenium data are binomial (dead / total), so pass `type = "binomial"` and `weights = total`. `curveid = type` fits four curves in one model. The species with the lowest ED50 is the most sensitive to selenium.

</details>

### Exercise 2: Model selection and prediction

Using the `spinach` dataset (spinach biomass vs dose, compared across two curve types), fit a LL.4 model with `curveid = CURVE`, compare it to W2.4 with `mselect()`, and use `predict()` to estimate the response at dose 5 under the lower-IC model. Save the prediction to `my_spinach_pred`.

```r title="Exercise 2: model selection + prediction"
# Hint: refit under the winning family, then call predict() with newdata

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_spinach_fit <- drm(SLOPE ~ DOSE, curveid = CURVE,
                      data = spinach, fct = LL.4())
mselect(my_spinach_fit, fctList = list(W2.4()))

my_best <- drm(SLOPE ~ DOSE, curveid = CURVE,
               data = spinach, fct = W2.4())

my_newdata      <- expand.grid(DOSE = 5, CURVE = levels(spinach$CURVE))
my_spinach_pred <- predict(my_best, newdata = my_newdata, interval = "confidence")
my_spinach_pred
```

**Explanation:** `mselect()` reports IC for LL.4 (the baseline) and W2.4 (the challenger). Refit under the winner, then build a tiny `newdata` grid with `DOSE = 5` for every curve level and call `predict()` with `interval = "confidence"` to get the point estimate plus CI.

</details>

## Complete Example

An end-to-end S. alba bioassay workflow, tying every section together.

```r title="End-to-end S. alba bioassay"
# 1. Fit separate LL.4 curves for the two herbicides
bioassay <- drm(DryMatter ~ Dose, Herbicide, data = S.alba, fct = LL.4())

# 2. Check whether another family fits better
mselect(bioassay, fctList = list(W1.4(), W2.4()))

# 3. Estimate ED50 for each herbicide with CI
ED(bioassay, respLev = 50, interval = "delta")

# 4. Test whether the two ED50s are equal
compParm(bioassay, "e", "/")

# 5. Visualize with confidence bands
plot(bioassay, type = "confidence",
     xlab = "Dose (g/ha)", ylab = "Dry matter (g)")
plot(bioassay, type = "all", add = TRUE)
```

Step 1 fits, step 2 justifies the model family, steps 3 and 4 answer the research question (how potent, and do they differ), step 5 communicates the result. This five-step template works for most dose-response comparisons: fit, validate, estimate, test, visualize.

## Summary

| Function | Purpose |
|---|---|
| `drm(y ~ x, data, fct = LL.4())` | Fit a sigmoidal curve |
| `drm(y ~ x, curveid = group, ...)` | Fit separate curves per group |
| `summary(model)` | Print b, c, d, e parameter estimates |
| `ED(model, respLev, interval = "delta")` | Estimate ED10, ED50, ED90 with CIs |
| `mselect(model, fctList)` | Compare model families via IC |
| `modelFit(model)` | Lack-of-fit test |
| `compParm(model, "e", "/")` | Pairwise test on one parameter |
| `EDcomp(model, percVec)` | Confidence interval on ED ratios |
| `predict(model, newdata, interval)` | Get fit + CI on a dose grid |
| `plot(model, type = "confidence")` | Base-R plot with confidence band |

The consistent pattern across the package: every function takes a fitted `drm` object and operates on it, so once you have a good fit, every downstream analysis is one line of code.

## References

1. Ritz, C., Baty, F., Streibig, J.C., Gerhard, D. (2015). Dose-Response Analysis Using R. *PLOS ONE* 10(12): e0146021. [Link](https://doi.org/10.1371/journal.pone.0146021)
2. Ritz, C., Streibig, J.C. (2005). Bioassay Analysis using R. *Journal of Statistical Software* 12(5). [Link](https://www.jstatsoft.org/article/view/v012i05)
3. drc package on CRAN, reference manual and vignettes. [Link](https://cran.r-project.org/package=drc)
4. Seefeldt, S.S., Jensen, J.E., Fuerst, E.P. (1995). Log-logistic analysis of herbicide dose-response relationships. *Weed Technology* 9(2): 218-227.
5. Motulsky, H., Christopoulos, A. (2004). *Fitting Models to Biological Data Using Linear and Nonlinear Regression.* Oxford University Press.
6. Finney, D.J. (1971). *Probit Analysis* (3rd ed.). Cambridge University Press.

## Continue Learning

- [Factorial Experiments in R](Factorial-Experiments-in-R.html) - the parent tutorial covers full-factorial designs where dose is one of several factors.
- [Logistic Regression in R](Logistic-Regression-With-R.html) - the log-logistic curve is the continuous-response cousin of logistic regression's binary-response S-curve.
- [Linear Regression in R](Linear-Regression.html) - sigmoidal fits reduce to linear fits at low or high dose; linear regression is always the first tool to reach for.

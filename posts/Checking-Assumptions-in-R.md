---
title: "Checking Model Assumptions in R: One Workflow"
slug: "Checking-Assumptions-in-R"
description: "A clear, runnable workflow for checking model assumptions in R: linearity, normality, equal variance, independence, influential points, and collinearity."
keywords: "checking model assumptions in R, linear regression assumptions R, regression diagnostics R, residual plots R, breusch-pagan test R, durbin-watson test R, shapiro test residuals, VIF in R, homoscedasticity test R"
auto_link_terms: "checking model assumptions|model assumptions in R|checking assumptions in R|regression assumptions|regression diagnostics|diagnostic plots|residuals vs fitted|residual plots|homoscedasticity|heteroscedasticity|Breusch-Pagan test|Durbin-Watson test|multicollinearity|Cook's distance"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-12.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Checking Model Assumptions"
sidebar_order: "173"
difficulty: "Intermediate"
---

<p class="lead">Checking model assumptions means testing whether the conditions behind a linear regression actually hold for your data before you trust its coefficients and p-values. This guide gives you one repeatable workflow of residual plots and quick tests that you can run on every model you fit in R.</p>

## Why should you check a linear model's assumptions?

When you call `lm()`, R always hands back coefficients, standard errors, and p-values. It does this no matter how badly a straight line fits your data. Those numbers are only trustworthy when a few background conditions hold, so before you report a model, you spend two minutes earning the right to trust it.

Let's fit a model we will use for the rest of this guide. We predict a car's fuel economy (`mpg`) from its weight (`wt`) and horsepower (`hp`) in the built-in `mtcars` data. We use base R plus two small helper packages, `broom` to print tidy model tables and `lmtest` for the diagnostic tests.

```r title="Fit the working model and view coefficients"
library(broom)
library(lmtest)

model <- lm(mpg ~ wt + hp, data = mtcars)
tidy(model)
#> # A tibble: 3 × 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)  37.2      1.60        23.3  2.57e-20
#> 2 wt           -3.88     0.633       -6.13 1.12e- 6
#> 3 hp           -0.0318   0.00903     -3.52 1.45e- 3
```

The `estimate` column says each extra 1000 lbs of weight costs about 3.88 mpg, and every p-value is tiny. On the surface this looks like a strong model. Let's confirm that with a one-number summary of fit.

```r title="Check the overall fit"
glance(model)[, c("r.squared", "adj.r.squared", "sigma", "nobs")]
#> # A tibble: 1 × 4
#>   r.squared adj.r.squared sigma  nobs
#>       <dbl>         <dbl> <dbl> <int>
#> 1     0.827         0.815  2.59    32
```

The model explains about 83% of the variation in `mpg` (`r.squared` = 0.827). That is a genuinely good fit. But a high R-squared tells you nothing about whether the p-values above are honest, and that is exactly the gap this workflow fills.

[KEY INSIGHT]
**A high R-squared does not prove a model is valid.** R-squared measures how much variation the fit captures; the assumption checks below measure whether the standard errors and p-values built on that fit can be believed.

If you are new to fitting models, the [linear regression](Linear-Regression.html) tutorial covers `lm()` from the ground up. Here we assume you have a fitted model and want to know if you can trust it.

**Try it:** Fit a simpler model that predicts `mpg` from weight alone, then print its coefficient table.

```r title="Your turn: fit a one-predictor model"
# Goal: fit mpg on wt only, then print its tidy() coefficients.
# Fill in the blank below, then run.
# ex_simple <- lm(mpg ~ ___, data = mtcars)
# tidy(ex_simple)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-predictor model solution"
ex_simple <- lm(mpg ~ wt, data = mtcars)
tidy(ex_simple)
#> # A tibble: 2 × 5
#>   term        estimate std.error statistic  p.value
#>   <chr>          <dbl>     <dbl>     <dbl>    <dbl>
#> 1 (Intercept)    37.3      1.88      19.9  8.24e-19
#> 2 wt             -5.34     0.559     -9.56 1.29e-10
```

**Explanation:** With `hp` removed, the weight coefficient absorbs some of horsepower's effect and grows to -5.34. Dropping a real predictor changes what the remaining ones mean.

</details>

## What are the four assumptions, and how do you check them at once?

Every linear model makes four promises. A handy way to remember them is the word **LINE**: **L**inearity, **I**ndependence, **N**ormality, and **E**qual variance. The important thing is that all four are statements about the model's *errors*, not about the raw columns of your data.

An error is the gap between what actually happened and what the model predicted. You never see the true errors, but you see their stand-ins, the residuals: `residual = observed value - fitted value`. In symbols, the model says:

$$y_i = \beta_0 + \beta_1 x_{1i} + \dots + \beta_k x_{ki} + \varepsilon_i$$

Here $y_i$ is the observed value for row $i$, the $x_{1i} \dots x_{ki}$ are that row's predictor values, the $\beta$ terms are the coefficients `lm()` estimated, and $\varepsilon_i$ is that row's error. The model assumes the errors $\varepsilon_i$ are independent of each other, average out to zero, share one constant variance $\sigma^2$, and follow a roughly normal shape. Every check in this guide is just a different way of looking at the residuals to see if those promises are kept.

The fastest way to see all four at once is to hand the fitted model to base R's `plot()`. It draws four diagnostic panels.

![The one assumption-checking workflow: fit, read the plots, confirm with tests, check robustness, then fix and re-check.](screenshots/Checking-Assumptions-in-R-workflow.webp)
*Figure 1: The one workflow. Read the four plots, confirm with tests, check robustness, then fix and re-check.*

```r title="Draw all four diagnostic plots"
par(mfrow = c(2, 2))
plot(model)
par(mfrow = c(1, 1))
```

Running that gives you the four-panel picture below. Each panel maps to one part of the workflow.

![The four base-R diagnostic plots for the mpg model: Residuals vs Fitted, Normal Q-Q, Scale-Location, and Residuals vs Leverage.](screenshots/Checking-Assumptions-in-R-diagnostic-panel.webp)
*Figure 2: The four base-R diagnostic plots for mpg ~ wt + hp, produced by plot(model).*

Here is which panel answers which question. We walk through each one in its own section next.

| Diagnostic plot | Checks | You want to see |
|---|---|---|
| Residuals vs Fitted | Linearity | A flat, patternless band |
| Normal Q-Q | Normality | Points hugging the diagonal |
| Scale-Location | Equal variance | A flat line, even spread |
| Residuals vs Leverage | Influential points | No point far to the right |

[KEY INSIGHT]
**Assumptions live in the residuals, not the predictors.** You do not need your x-variables to be normal or evenly spread. You need the leftover errors, after the model has done its work, to be well behaved.

**Try it:** Pull the residuals and fitted values out of the model into your own variables, then look at the first few residuals.

```r title="Your turn: extract residuals and fitted values"
# Goal: store residuals(model) and fitted(model), then print the first residuals.
# Fill in the blanks below, then run.
# ex_resid <- residuals(___)
# ex_fit   <- fitted(___)
# head(round(ex_resid, 2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract residuals solution"
ex_resid <- residuals(model)
ex_fit   <- fitted(model)
head(round(ex_resid, 2))
#>         Mazda RX4     Mazda RX4 Wag        Datsun 710    Hornet 4 Drive Hornet Sportabout 
#>             -2.57             -1.58             -2.48              0.13              0.37 
#>           Valiant 
#>             -2.37 
```

**Explanation:** `residuals()` returns one number per row: how far that car's real `mpg` sits above or below the model's prediction. Every check that follows reads these numbers.

</details>

## How do you check linearity?

Linearity asks a simple question: is a straight line the right shape for this relationship? If the true pattern curves but you fit a line, the model will over-predict in some regions and under-predict in others, and the residuals will show it.

The tool is the **Residuals vs Fitted** plot (the top-left panel). You plot each residual against the value the model predicted. If a line is the right shape, the residuals scatter randomly above and below zero with no drift. If the relationship curves, the residuals form a U or an arch.

```r title="Plot residuals against fitted values"
plot(model, which = 1)
```

Run that and look at the red trend line. For our model it dips in the middle and rises at both ends, a gentle bowl shape. That hints the straight line is missing some curvature. A quick numeric check confirms the hunch. The RESET test asks whether adding squared and cubed versions of the fitted values would improve the model; if they would, the plain line is too simple.

```r title="Test linearity with the RESET test"
resettest(model, power = 2:3, type = "fitted")
#> 	RESET test
#> 
#> data:  model
#> RESET = 7.2384, df1 = 2, df2 = 27, p-value = 0.003041
```

The p-value is 0.003, well below 0.05. That is evidence of mild curvature: the relationship between these predictors and `mpg` bends a little, and a straight line does not fully capture it. This is not a disaster, and we will straighten it out in the fixes section. For now, note it down.

[TIP]
**A curved residual band or a small RESET p-value points to the same fix.** When the shape is off, you usually add a squared term or model the response on a transformed scale, both shown later in this guide.

**Try it:** Run the RESET test on the simpler `mpg ~ wt` model. Does the one-predictor version also show curvature?

```r title="Your turn: RESET test on the simple model"
# Goal: run resettest() on lm(mpg ~ wt, data = mtcars).
# Fill in the blank below, then run.
# resettest(lm(mpg ~ wt, data = mtcars), power = 2:3, type = "___")
```

<details>
<summary>Click to reveal solution</summary>

```r title="RESET on the simple model solution"
resettest(lm(mpg ~ wt, data = mtcars), power = 2:3, type = "fitted")
#> 	RESET test
#> 
#> data:  lm(mpg ~ wt, data = mtcars)
#> RESET = 5.1315, df1 = 2, df2 = 28, p-value = 0.01263
```

**Explanation:** The p-value is 0.013, still under 0.05. The `mpg`-versus-weight curve bends too, which is a well-known feature of fuel-economy data.

</details>

## How do you check that the residuals have constant variance?

Constant variance, or homoscedasticity, means the residuals are equally spread across the whole range of predictions. The model should be about as accurate for light cars as for heavy ones. When the spread grows as predictions get larger, you get a funnel shape, and that is called heteroscedasticity.

Why care? Heteroscedasticity does not bias your coefficients, but it makes the standard errors wrong, and every p-value and confidence interval the model reports is computed from those standard errors, so they become unreliable too. The picture below shows the two cases side by side so you know what you are looking for.

![Two residual-vs-fitted plots: a healthy even band on the left and a heteroscedastic funnel that widens on the right.](screenshots/Checking-Assumptions-in-R-good-vs-bad.webp)
*Figure 3: A healthy residual plot (left) versus a heteroscedastic funnel (right).*

The **Scale-Location** plot (bottom-left panel of `plot(model)`) is built for this. It puts the size of each residual on the y-axis, so a rising trend means the spread is growing.

```r title="Plot the Scale-Location diagnostic"
plot(model, which = 3)
```

Eyeballing a plot is a good start, but a formal test removes the guesswork. The Breusch-Pagan test checks whether residual size is related to the fitted values. A small p-value means the variance is not constant.

```r title="Test equal variance with Breusch-Pagan"
bptest(model)
#> 	studentized Breusch-Pagan test
#> 
#> data:  model
#> BP = 0.88072, df = 2, p-value = 0.6438
```

The p-value is 0.64, far above 0.05, so there is no evidence of a variance problem. Our model passes this check cleanly: the spread of errors is steady across light and heavy cars.

[WARNING]
**Heteroscedasticity leaves your coefficients looking fine while your p-values are wrong.** The estimates stay unbiased, so nothing looks obviously broken; only the standard errors are off, which is why this check is easy to skip and dangerous to skip.

**Try it:** The `cars` dataset (stopping distance versus speed) is a classic funnel. Run the Breusch-Pagan test on it and see how the p-value compares.

```r title="Your turn: Breusch-Pagan on the cars data"
# Goal: run bptest() on lm(dist ~ speed, data = cars).
# Fill in the blank below, then run.
# bptest(lm(dist ~ speed, data = ___))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Breusch-Pagan on cars solution"
bptest(lm(dist ~ speed, data = cars))
#> 	studentized Breusch-Pagan test
#> 
#> data:  lm(dist ~ speed, data = cars)
#> BP = 3.2149, df = 1, p-value = 0.07297
```

**Explanation:** At 0.073 the p-value sits just above 0.05, so the test is borderline. The residual plot for this model shows a clear funnel, which is why plots and tests are best read together.

</details>

## How do you check that the residuals are normal?

Normality asks whether the residuals follow the familiar bell curve. This matters most for small samples, where the t-tests and confidence intervals `lm()` reports lean on the normal shape. With large samples the model is forgiving, because averages tend toward normal on their own.

The tool is the **Normal Q-Q** plot (top-right panel). It sorts your residuals and plots them against the values you would expect from a perfect normal distribution. If the residuals are normal, the points fall along the straight diagonal. Curved-away tails mean skew or heavy outliers.

```r title="Plot the Normal Q-Q diagnostic"
plot(model, which = 2)
```

The matching test is Shapiro-Wilk, which returns a single p-value. A small p-value means the residuals depart from normal.

```r title="Test normality with Shapiro-Wilk"
shapiro.test(residuals(model))
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(model)
#> W = 0.92792, p-value = 0.03427
```

The p-value is 0.034, just under 0.05, so there is a mild departure from normality. Looking back at the Q-Q plot, only a couple of high-mileage cars at the top pull away from the line. With 32 rows, Shapiro-Wilk is sensitive enough to flag a small wobble, so this is a "keep an eye on it" result, not a red alert.

[NOTE]
**Normality is the least critical of the four assumptions at moderate sample sizes.** A borderline Shapiro-Wilk p-value on 30-plus rows rarely changes your conclusions; read it alongside the Q-Q plot rather than treating 0.05 as a hard line.

**Try it:** Confirm the test behaves by feeding it 100 values you know are normal. Set a seed first so your result matches.

```r title="Your turn: Shapiro-Wilk on known-normal data"
# Goal: set.seed(1), then run shapiro.test() on rnorm(100).
# Fill in the blanks below, then run.
# set.seed(1)
# shapiro.test(rnorm(___))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro-Wilk on normal data solution"
set.seed(1)
shapiro.test(rnorm(100))
#> 	Shapiro-Wilk normality test
#> 
#> data:  rnorm(100)
#> W = 0.9956, p-value = 0.9876
```

**Explanation:** The p-value is 0.99, nowhere near significant, which is exactly what you want when the data really is normal. A high p-value is the "no problem here" signal.

</details>

## How do you check that the residuals are independent?

Independence means one row's error tells you nothing about the next row's error. This assumption is usually fine for a plain sample of unrelated observations, but it breaks for data collected in order, such as measurements over time or along a spatial path, where neighbours tend to be similar.

The standard test is Durbin-Watson, which looks for correlation between each residual and the one before it. Its statistic runs from 0 to 4, and a value near 2 means no autocorrelation. Values near 0 mean strong positive autocorrelation.

```r title="Test independence with Durbin-Watson"
dwtest(model)
#> 	Durbin-Watson test
#> 
#> data:  model
#> DW = 1.3624, p-value = 0.02061
#> alternative hypothesis: true autocorrelation is greater than 0
```

The statistic is 1.36 with a p-value of 0.02, which looks like a problem. Here is the judgment call that separates a mechanical check from a real one: `mtcars` rows are just car models listed in a book, not a time sequence, so "the next row" has no real meaning. A significant Durbin-Watson result on unordered data is an artifact of the arbitrary row order, not a genuine violation. This check only carries weight when your rows have a true order.

[KEY INSIGHT]
**A test is only as meaningful as the question behind it.** Durbin-Watson answers "do neighbouring rows correlate?" That question only matters when "neighbouring" means something, so run it for time-ordered or spatially-ordered data and ignore it otherwise.

**Try it:** The statistic's distance from 2 measures the size of the autocorrelation. Compute how far our Durbin-Watson value sits from 2.

```r title="Your turn: distance of DW from 2"
# Goal: store dwtest(model), then compute how far its statistic is from 2.
# Fill in the blanks below, then run.
# dw <- dwtest(model)
# round(2 - unname(dw$___), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Durbin-Watson distance solution"
dw <- dwtest(model)
round(2 - unname(dw$statistic), 3)
#> [1] 0.638
```

**Explanation:** The statistic sits 0.638 below 2. The further below 2, the stronger the positive autocorrelation would be, if the row order were meaningful here.

</details>

## How do you find influential outliers?

Not every unusual point matters. A point is *influential* only when it both sits far from the others in predictor space (high leverage) and has a large residual. Such a point can single-handedly tilt the fitted line toward itself, so the whole model bends to accommodate one observation.

The **Residuals vs Leverage** plot (bottom-right panel) shows leverage on the x-axis, so influential points appear in the far right. The one-number summary is **Cook's distance**, which combines leverage and residual size into a single score per row.

```r title="Plot residuals against leverage"
plot(model, which = 5)
```

A common rule of thumb flags any row whose Cook's distance is above `4 / n`, where `n` is the number of rows. Let's list the cars that clear that bar.

```r title="Flag influential points with Cook's distance"
cd <- cooks.distance(model)
n <- nrow(mtcars)
round(sort(cd[cd > 4 / n], decreasing = TRUE), 3)
#> Chrysler Imperial     Maserati Bora    Toyota Corolla          Fiat 128 
#>             0.424             0.272             0.208             0.157 
```

Four cars clear the threshold, with the Chrysler Imperial the most influential at 0.424. Flagging a point is not the same as deleting it. The right move is to investigate: is it a data-entry error, or a genuine but unusual car? We test its actual impact in the fixes section by refitting without it.

[WARNING]
**Never delete points just to make the diagnostics look better.** Removing an inconvenient observation to pass a test is data manipulation; only drop a point when you can show it is a genuine error, and always report that you did.

**Try it:** Find the single most influential car by name using `which.max()` on the Cook's distances.

```r title="Your turn: name the most influential point"
# Goal: return the row name with the largest Cook's distance.
# Fill in the blank below, then run.
# names(which.max(cooks.distance(___)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Most influential point solution"
names(which.max(cooks.distance(model)))
#> [1] "Chrysler Imperial"
```

**Explanation:** `which.max()` finds the position of the biggest Cook's distance, and `names()` turns that position back into the car's name.

</details>

## How do you check for multicollinearity between predictors?

The last check is the one that is about the predictors rather than the residuals. Multicollinearity happens when two or more predictors carry nearly the same information. When weight and horsepower move together, the model cannot tell whose effect is whose, so the coefficients become unstable and their standard errors balloon.

The measure is the **Variance Inflation Factor** (VIF). For each predictor, you regress it on all the other predictors and read off that helper model's R-squared. The formula turns that into an inflation factor:

$$\text{VIF}_j = \frac{1}{1 - R_j^2}$$

A VIF of 1 means the predictor shares nothing with the others; a common rule of thumb treats anything above 5 as worth investigating and above 10 as a real problem. You can compute it directly in base R with a short helper.

```r title="Compute VIF from base R"
vif_manual <- function(model) {
  preds <- attr(terms(model), "term.labels")
  d <- model.frame(model)
  sapply(preds, function(p) {
    r2 <- summary(lm(reformulate(setdiff(preds, p), response = p), data = d))$r.squared
    1 / (1 - r2)
  })
}
round(vif_manual(model), 3)
#>    wt    hp 
#> 1.767 1.767 
```

Both predictors sit at 1.77, comfortably below 5. Weight and horsepower are correlated, but not so tightly that the model struggles to separate them. In everyday work you would reach for the `car` package's one-liner instead of the helper above. Run this in your local R session, since `car` is not part of the in-browser toolkit:

```r-static title="The car package shortcut (run locally)"
library(car)
round(vif(model), 3)
#>    wt    hp 
#> 1.767 1.767
```

[NOTE]
**One command can draw every diagnostic at once.** In a local R session, `performance::check_model(model)` produces an annotated panel of all the checks in this guide, which is handy once you know how to read each one on its own.

**Try it:** Add `disp` (engine displacement) as a third predictor and recompute the VIFs. Displacement is closely tied to weight, so watch what happens.

```r title="Your turn: VIF with a third predictor"
# Goal: run vif_manual() on lm(mpg ~ wt + hp + disp, data = mtcars).
# Fill in the blank below, then run.
# round(vif_manual(lm(mpg ~ wt + hp + ___, data = mtcars)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="VIF with three predictors solution"
round(vif_manual(lm(mpg ~ wt + hp + disp, data = mtcars)), 3)
#>    wt    hp  disp 
#> 4.845 2.737 7.325 
```

**Explanation:** Displacement's own VIF is 7.3, and adding it raises weight's VIF to 4.8, because engine size and weight measure overlapping things. This is when you would consider dropping one of the two.

</details>

## What should you do when an assumption is violated?

Our workflow flagged two real issues on `mpg ~ wt + hp`: mild curvature (the RESET test) and slightly non-normal residuals (Shapiro-Wilk). Here are the three moves that fix the large majority of problems, starting with the one that fixes ours.

**Move 1: transform the response.** When the relationship curves or the residuals are skewed, modelling the response on a log scale often straightens everything at once. Let's refit with `log(mpg)` and re-run the two checks that failed.

```r title="Refit on a log scale and re-test linearity"
logmod <- lm(log(mpg) ~ wt + hp, data = mtcars)
resettest(logmod, power = 2:3, type = "fitted")
#> 	RESET test
#> 
#> data:  logmod
#> RESET = 1.2278, df1 = 2, df2 = 27, p-value = 0.3088
```

```r title="Re-test normality on the log model"
shapiro.test(residuals(logmod))
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(logmod)
#> W = 0.95973, p-value = 0.2701
```

Both p-values jumped above 0.05: RESET went from 0.003 to 0.31, and Shapiro-Wilk from 0.034 to 0.27. The curvature and the skew are gone. Better still, the fit improved rather than suffered.

```r title="Confirm the fit held up"
glance(logmod)[, c("r.squared", "adj.r.squared")]
#> # A tibble: 1 × 2
#>   r.squared adj.r.squared
#>       <dbl>         <dbl>
#> 1     0.869         0.860
```

Adjusted R-squared rose from 0.815 to 0.860. One small change to the response scale repaired both violations and told a cleaner story about the data.

**Move 2: use robust standard errors.** Sometimes you cannot or do not want to transform, yet the variance is not constant. You can keep the model and just correct the standard errors so the p-values stay honest. The `sandwich` package supplies heteroscedasticity-consistent errors that `coeftest()` reads. To see it work, here is a dataset built with strong, deliberate heteroscedasticity.

```r title="Fit a heteroscedastic model, naive errors"
library(sandwich)
set.seed(7)
x <- runif(100, 1, 10)
y <- 2 + 3 * x + rnorm(100, mean = 0, sd = (x / 2)^2.5)
hmod <- lm(y ~ x)
coeftest(hmod)
#> t test of coefficients:
#> 
#>             Estimate Std. Error t value  Pr(>|t|)    
#> (Intercept)  2.54541    5.06442  0.5026 0.6163676    
#> x            3.13493    0.82568  3.7968 0.0002541 ***
```

Now recompute the same model with robust standard errors and compare.

```r title="Recompute with robust standard errors"
coeftest(hmod, vcov = vcovHC(hmod, type = "HC1"))
#> t test of coefficients:
#> 
#>             Estimate Std. Error t value Pr(>|t|)   
#> (Intercept)   2.5454     4.2329  0.6013 0.549001   
#> x             3.1349     1.0866  2.8852 0.004811 **
```

The estimate for `x` is identical at 3.13; only its standard error changed, from 0.83 up to 1.09. The naive version was overstating the model's certainty. Robust errors leave the coefficients alone and just report the wider, more honest uncertainty.

**Move 3: investigate influential points, do not just delete them.** Our Cook's distance check flagged the Chrysler Imperial. The honest test is to refit without it and see whether the conclusions actually move.

```r title="Refit without the flagged point"
m2 <- lm(mpg ~ wt + hp, data = mtcars[rownames(mtcars) != "Chrysler Imperial", ])
round(rbind(full = coef(model), dropped = coef(m2)), 3)
#>         (Intercept)     wt     hp
#> full         37.227 -3.878 -0.032
#> dropped      38.579 -4.420 -0.031
```

The weight coefficient shifts from -3.88 to -4.42 when the car is removed. That is a noticeable nudge, but the story is unchanged: weight still has a strong, negative, significant effect. Since the point does not flip any conclusion and is a real car, you keep it and note its influence.

[TIP]
**Re-run the whole workflow after any fix.** Repairing one assumption can disturb another, so treat the checks as a loop: change the model, then walk back through linearity, variance, normality, and the rest before you trust the new version.

### The whole workflow in one function

Once you have done this a few times, package it so you never have to remember the order again. This small function runs every check and returns a tidy table of p-values plus the influence count and worst VIF.

```r title="Package the workflow into one function"
check_assumptions <- function(m) {
  n <- nrow(model.frame(m))
  infl <- sum(cooks.distance(m) > 4 / n)
  vifs <- tryCatch(max(vif_manual(m)), error = function(e) NA)
  data.frame(
    check = c("Linearity (RESET)", "Equal variance (BP)",
              "Normality (Shapiro)", "Independence (DW)",
              "Influential pts (>4/n)", "Max VIF"),
    value = round(c(resettest(m, power = 2:3, type = "fitted")$p.value,
                    bptest(m)$p.value,
                    shapiro.test(residuals(m))$p.value,
                    dwtest(m)$p.value,
                    infl, vifs), 3),
    row.names = NULL
  )
}
check_assumptions(model)
#>                    check value
#> 1      Linearity (RESET) 0.003
#> 2    Equal variance (BP) 0.644
#> 3    Normality (Shapiro) 0.034
#> 4      Independence (DW) 0.021
#> 5 Influential pts (>4/n) 4.000
#> 6                Max VIF 1.767
```

For the four test rows, a value below 0.05 is a flag worth reading a plot about; the last two rows are counts, not p-values. Run `check_assumptions(logmod)` and you will see the first three flags clear.

## Practice Exercises

These combine several checks from the guide. Use the distinct variable names shown so your work does not overwrite the tutorial's `model`.

### Exercise 1: Run the workflow on a new model

Fit a model of stopping distance on speed with `lm(dist ~ speed, data = cars)`, then run the four core checks (RESET, Breusch-Pagan, Shapiro-Wilk, Durbin-Watson) and read off which assumption is most clearly violated.

```r title="Your turn: diagnose the cars model"
# Fit cars_mod, then collect the four p-values into one named vector.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Diagnose the cars model solution"
cars_mod <- lm(dist ~ speed, data = cars)
round(c(
  linearity    = unname(resettest(cars_mod, power = 2:3, type = "fitted")$p.value),
  variance     = unname(bptest(cars_mod)$p.value),
  normality    = unname(shapiro.test(residuals(cars_mod))$p.value),
  independence = unname(dwtest(cars_mod)$p.value)), 4)
#>    linearity     variance    normality independence 
#>       0.2220       0.0730       0.0215       0.0952 
```

**Explanation:** Normality is the clearest violation at 0.0215, with variance close behind at 0.073. Linearity and independence are fine. The next exercise fixes it.

</details>

### Exercise 2: Fix the cars model with a transform

The stopping-distance model has non-normal, funnel-shaped residuals. Physics suggests distance grows with the square of speed, so a square-root transform of `dist` is a natural fix. Refit as `sqrt(dist) ~ speed` and re-run the two checks that were weakest.

```r title="Your turn: transform and re-check"
# Fit cars_fix on sqrt(dist), then re-run bptest() and shapiro.test().
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Transform and re-check solution"
cars_fix <- lm(sqrt(dist) ~ speed, data = cars)
bptest(cars_fix)
#> 	studentized Breusch-Pagan test
#> 
#> data:  cars_fix
#> BP = 0.011192, df = 1, p-value = 0.9157
shapiro.test(residuals(cars_fix))
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(cars_fix)
#> W = 0.97332, p-value = 0.3143
```

**Explanation:** Both p-values leap upward, Breusch-Pagan to 0.92 and Shapiro-Wilk to 0.31. The square-root scale flattened the funnel and normalised the residuals in one move.

</details>

### Exercise 3: Write a pass/fail helper

Write a function `all_ok(m)` that returns `TRUE` only when the RESET, Breusch-Pagan, and Shapiro-Wilk tests all have p-values above 0.05. Test it on the original `model` and on `logmod` from the fixes section.

```r title="Your turn: a pass/fail helper"
# Build all_ok(m), then run it on model and logmod.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Pass/fail helper solution"
all_ok <- function(m) {
  ps <- c(resettest(m, power = 2:3, type = "fitted")$p.value,
          bptest(m)$p.value,
          shapiro.test(residuals(m))$p.value)
  all(ps > 0.05)
}
c(raw = all_ok(model), log = all_ok(logmod))
#>   raw   log 
#> FALSE  TRUE 
```

**Explanation:** The raw model fails because linearity and normality were flagged; the log model passes all three. This is the same conclusion the fixes section reached, now automated.

</details>

## Frequently Asked Questions

### Which assumption matters most?

Constant variance and linearity usually matter most, because they directly bend your coefficients or corrupt your standard errors. Independence matters intensely but only for ordered data. Normality is the most forgiving, especially once you have a few dozen rows.

### Do I really need both the plots and the tests?

Yes, they cover each other's blind spots. Tests give an objective p-value but can flag trivial departures in large samples or miss real ones in small samples. Plots show the shape and severity a p-value hides. Read them together, as the `cars` example showed, where a borderline test sat next to an obvious funnel.

### My Shapiro-Wilk test is significant. Is my model ruined?

Probably not. On 30 or more rows the test is sensitive to tiny wobbles, and linear regression is robust to mild non-normality. Look at the Q-Q plot: if only a couple of points stray at the tails, you are usually fine. Worry when the whole pattern curves away from the line.

### What counts as a "good enough" VIF?

A VIF of 1 is ideal. Below 5 is generally comfortable. Between 5 and 10 is a yellow flag worth a second look, and above 10 signals serious multicollinearity where you should drop or combine predictors.

### Can I check assumptions before fitting the model?

No, and that is the key idea of this guide. Three of the four assumptions are about the model's residuals, which only exist after you fit. Fit first, then diagnose, then fix and refit if needed.

## Summary

Checking model assumptions is one short loop you run on every linear model: read the four diagnostic plots, confirm with a quick test, scan for influential points and collinearity, then fix and re-check anything that fails.

| Assumption | Diagnostic plot | Confirming test | Passes when | If it fails |
|---|---|---|---|---|
| Linearity | Residuals vs Fitted | RESET (`resettest`) | p > 0.05, flat band | Transform or add a term |
| Equal variance | Scale-Location | Breusch-Pagan (`bptest`) | p > 0.05, even spread | Transform or robust errors |
| Normality | Normal Q-Q | Shapiro-Wilk (`shapiro.test`) | p > 0.05, points on line | Transform, or ignore if mild |
| Independence | Residual order | Durbin-Watson (`dwtest`) | statistic near 2 | Use a time-series model |
| No influential points | Residuals vs Leverage | Cook's distance | none above 4/n | Investigate, rarely remove |
| No multicollinearity | (none) | VIF | below 5 | Drop or combine predictors |

![A recap of each assumption, its diagnostic plot, and its confirming test.](screenshots/Checking-Assumptions-in-R-recap.webp)
*Figure 4: Each assumption, its diagnostic plot, and its confirming test.*

The habit to build is simple. Fit the model, glance at `plot(model)`, confirm the two or three checks that matter for your data, and only trust the p-values once the residuals have earned it.

## References

1. Zeileis, A. and Hothorn, T. lmtest package (Breusch-Pagan, Durbin-Watson, RESET). CRAN. [Link](https://cran.r-project.org/web/packages/lmtest/index.html)
2. Zeileis, A. sandwich package (heteroscedasticity-consistent covariance). CRAN. [Link](https://cran.r-project.org/web/packages/sandwich/index.html)
3. James, G., Witten, D., Hastie, T., and Tibshirani, R. An Introduction to Statistical Learning, chapter 3 on potential problems in regression. [Link](https://www.statlearning.com/)
4. R Core Team. plot.lm reference: the four diagnostic plots. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html)
5. R Core Team. shapiro.test reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/shapiro.test.html)
6. NIST/SEMATECH e-Handbook of Statistical Methods: examining residuals. [Link](https://www.itl.nist.gov/div898/handbook/pri/section2/pri24.htm)
7. Robinson, D. broom vignette: tidying model output with `tidy()` and `glance()`. [Link](https://cran.r-project.org/web/packages/broom/vignettes/broom.html)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html): fit and interpret the model this guide diagnoses.
- [Assumptions of Linear Regression](Assumptions-of-Linear-Regression.html): a deeper reference that walks through every classical assumption in turn.
- [Outlier Treatment With R](Outlier-Treatment-With-R.html): what to do once Cook's distance flags an influential point.

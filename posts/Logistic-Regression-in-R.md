---
title: "Logistic Regression in R: From glm() to Odds Ratios, ROC, and AUC"
slug: "Logistic-Regression-in-R"
description: "Logistic regression in R for binary outcomes: fit with glm(family=binomial), interpret log-odds and odds ratios, evaluate with ROC/AUC via the pROC package."
keywords: "logistic regression in R, glm binomial, odds ratio interpretation, ROC curve R, AUC pROC, binary classification R, log-odds, confusion matrix, deviance, logistic regression tutorial"
auto_link_terms: "logistic regression in R|logistic regression|binomial family|odds ratio|log-odds|ROC curve|pROC package|binary classification"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-19"
curriculum_id: "2.3.10"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Logistic Regression (glm + ROC)"
sidebar_order: 47
difficulty: "Intermediate"
---

# Logistic Regression in R: From glm() to Odds Ratios, ROC, and AUC

<p class="lead">Logistic regression is a classification method that models the probability a binary outcome equals 1 as a linear combination of predictors passed through the sigmoid function. In R you fit it with <code>glm(family = binomial)</code>, interpret the coefficients as log-odds (or exponentiate for odds ratios), then evaluate the classifier with confusion matrices, ROC curves, and AUC.</p>

## How do you fit a logistic regression in R?

The workhorse function for logistic regression in R is `glm()`, called with `family = binomial`. Give it a binary outcome, a set of predictors, and a data frame, and it returns a fitted model with coefficients, standard errors, z-values, and p-values. We will use the built-in `mtcars` dataset and model whether a car has automatic transmission (`am = 0`) or manual (`am = 1`) from weight (`wt`) and horsepower (`hp`).

The `summary()` call below is the one output worth reading end-to-end, because every interpretation later in this post comes back to numbers you can already see here.

```r title="Fit the first logistic model"
fit_simple <- glm(am ~ wt + hp, data = mtcars, family = binomial)
summary(fit_simple)
#> Call:
#> glm(formula = am ~ wt + hp, family = binomial, data = mtcars)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) 18.86630    7.44356   2.534   0.0113 *
#> wt          -8.08348    3.06868  -2.634   0.0084 **
#> hp           0.03626    0.01773   2.044   0.0409 *
#>
#> Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 10.059  on 29  degrees of freedom
#> AIC: 16.059
```

The `wt` coefficient is negative, so heavier cars are less likely to have a manual transmission (when you hold horsepower constant). The `hp` coefficient is positive, so for two cars of the same weight, the one with more horsepower is more likely to be manual. Both z-values are bigger than 2 in absolute value, and both p-values sit under 0.05, which means each predictor carries signal beyond noise. The drop from a null deviance of 43.2 to a residual deviance of 10.1 tells you the model explains a lot of the variability in transmission type.

[NOTE]
**`family = binomial` is idiomatic; `family = "binomial"` works too.** Both forms pass the same family object under the hood. We use the unquoted form throughout because that is what you will see in R documentation and textbooks.

**Try it:** Fit a simpler model `ex_fit` using only `wt` as a predictor, then check whether the weight coefficient is still negative and significant.

```r title="Your turn: fit a single-predictor model"
# Try it: fit ex_fit with only wt
ex_fit <- glm(am ~ wt, data = mtcars, family = binomial)

# Check:
summary(ex_fit)$coefficients
#> Expected: Estimate for wt is negative, p-value < 0.01
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single-predictor solution"
ex_fit <- glm(am ~ wt, data = mtcars, family = binomial)
summary(ex_fit)$coefficients
#>              Estimate Std. Error   z value    Pr(>|z|)
#> (Intercept)  12.04037   4.510430  2.669672 0.007590...
#> wt           -4.02397   1.436416 -2.801429 0.005088...
```

**Explanation:** Weight alone still has a strong negative effect on the probability of a manual transmission. Notice the coefficient (−4.02) is smaller in magnitude than in the two-predictor model (−8.08), because here `wt` has to do all the work of explaining `am` by itself.

</details>

## Why does linear regression fail for binary outcomes?

It is tempting to slap `lm()` on a 0/1 outcome and call it a day. That fails for two reasons, and you can see the first one with one line of code: the predictions blow past the `[0, 1]` range that a probability has to live in.

Let's fit the linear model on the same predictors and check what it says about a hypothetical very light, very powerful car.

```r title="Linear regression on a binary outcome misbehaves"
lm_fit <- lm(am ~ wt + hp, data = mtcars)
lm_preds <- predict(lm_fit, newdata = data.frame(wt = c(1.5, 2.5, 5.5),
                                                 hp = c(250, 150, 100)))
lm_preds
#>         1         2         3
#> 1.1804617 0.4963420 -0.5328797
```

Prediction 1 says 118% probability of manual transmission; prediction 3 says −53%. Neither number means anything as a probability. That is the first problem. The second problem is that the errors are not homoscedastic or normally distributed on a 0/1 outcome, which breaks the standard `lm()` inference machinery. Both issues go away when we wrap the linear combination in a function that takes any real number and returns a value between 0 and 1. That function is the sigmoid.

```r title="Plot the sigmoid curve"
x_grid <- seq(-6, 6, length.out = 200)
plot(x_grid, 1 / (1 + exp(-x_grid)), type = "l", lwd = 2,
     xlab = "Linear predictor z", ylab = "Probability p",
     main = "The sigmoid squashes any z into [0, 1]")
abline(h = c(0, 1), lty = 3)
abline(h = 0.5, v = 0, lty = 3, col = "grey")
```

The curve asymptotes to 0 on the left, to 1 on the right, and crosses 0.5 exactly when the linear predictor is 0. Logistic regression keeps a plain linear combination of predictors underneath, feeds the result through this curve, and reads off a probability.

![Predictors flow through the linear combiner and sigmoid, producing a probability and then a class label.](screenshots/Logistic-Regression-in-R-sigmoid-flow.webp)
*Figure 1: How logistic regression turns predictor values into a class label.*

Stated as math, the model says the log-odds of the outcome are linear in the predictors:

$$\log\left(\frac{p}{1 - p}\right) = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \dots$$

Where:
- $p$ = probability that the outcome equals 1
- $\frac{p}{1-p}$ = the odds of the outcome
- $\log\bigl(\tfrac{p}{1-p}\bigr)$ = the log-odds (also called the logit)
- $\beta_0, \beta_1, \dots$ = the coefficients R estimates for you

If you solve that for $p$, you get back the sigmoid: $p = 1 / (1 + e^{-z})$ where $z = \beta_0 + \beta_1 x_1 + \dots$.

[KEY INSIGHT]
**Logistic regression is linear in the log-odds, not in the probability.** That is the trick that lets the model stay simple and interpretable while respecting the [0, 1] constraint on probability. Every coefficient tells you how the log-odds change per unit change in that predictor, holding the others constant.

**Try it:** Write a function `ex_sigmoid(z)` that returns `1 / (1 + exp(-z))`, then test it on `0` and `2` to confirm the shape of the curve.

```r title="Your turn: code the sigmoid"
# Try it: define ex_sigmoid()
ex_sigmoid <- function(z) {
  # your code here
}

# Test:
ex_sigmoid(0)
ex_sigmoid(2)
#> Expected: 0.5 and about 0.881
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sigmoid solution"
ex_sigmoid <- function(z) {
  1 / (1 + exp(-z))
}
ex_sigmoid(0)
#> [1] 0.5
ex_sigmoid(2)
#> [1] 0.8807971
```

**Explanation:** At `z = 0` the sigmoid returns exactly 0.5, which is the decision boundary. At `z = 2` it returns about 0.88, so a modestly positive linear predictor already produces a high probability of the positive class.

</details>

## How do you interpret coefficients as odds ratios?

The raw R output reports coefficients on the log-odds scale, which is not how a human thinks. Exponentiating turns them into **odds ratios**: numbers that say how much the odds of the positive outcome multiply per one-unit increase in the predictor.

The conversions between probability, odds, and log-odds are worth keeping in your head because they come up every time you read a logistic regression table.

![A ladder showing probability 0.75 becoming odds of 3, then log-odds of 1.10, and exp(coef) giving the odds ratio.](screenshots/Logistic-Regression-in-R-odds-ladder.webp)
*Figure 2: Probability, odds, and log-odds are three views of the same thing.*

The cleanest way to get odds ratios with confidence intervals is `broom::tidy()` with `exponentiate = TRUE` and `conf.int = TRUE`. That gives you a single tibble with estimates, CIs, and p-values.

```r title="Exponentiate coefficients to odds ratios"
library(broom)
or_table <- tidy(fit_simple, exponentiate = TRUE, conf.int = TRUE)
or_table
#> # A tibble: 3 × 7
#>   term          estimate  std.error statistic p.value   conf.low   conf.high
#>   <chr>            <dbl>      <dbl>     <dbl>   <dbl>      <dbl>       <dbl>
#> 1 (Intercept) 1.56e+08   7.44          2.53   0.0113   1.70e+02  5.97e+15
#> 2 wt          3.08e-04   3.07         -2.63   0.00844  1.14e-07  5.99e-02
#> 3 hp          1.04e+00   0.0177        2.04   0.0409   1.00e+00  1.08e+00
```

Read the `estimate` column as odds ratios. For `wt`, each extra 1000 lbs of weight multiplies the odds of a manual transmission by about 0.0003, which is a massive decrease. For `hp`, each extra horsepower multiplies those odds by about 1.04, a 4% increase. The 95% CI for `hp` runs from 1.00 to 1.08, so the effect is positive but its size is uncertain. The intercept's odds ratio is huge, but that is the odds when `wt = 0` and `hp = 0`, which is not a car anyone has ever built.

[TIP]
**`broom::tidy(fit, exponentiate = TRUE, conf.int = TRUE)` is the one-liner you want.** It beats stitching together `exp(coef(fit))`, `exp(confint(fit))`, and `summary(fit)$coefficients` by hand. One call, tidy output, ready for `knitr::kable()` or `gt`.

[WARNING]
**An odds ratio is not a probability ratio.** If the odds ratio is 2, the probability does not necessarily double. Near `p = 0.5` a doubling of odds is a noticeable jump; near `p = 0.01` or `p = 0.99` the probability barely moves. Always translate odds ratios back to probabilities at the values you care about before making claims about real-world effect sizes.

**Try it:** Pull the odds ratio for `hp` out of `or_table` and store it in `ex_or_hp`, then write one sentence describing what it means.

```r title="Your turn: extract the hp odds ratio"
# Try it: get the odds ratio for hp
ex_or_hp <- # your code here

ex_or_hp
#> Expected: about 1.04
```

<details>
<summary>Click to reveal solution</summary>

```r title="Odds ratio extraction solution"
ex_or_hp <- or_table$estimate[or_table$term == "hp"]
ex_or_hp
#> [1] 1.036924
```

**Explanation:** Each additional horsepower multiplies the odds of a manual transmission by about 1.04, holding weight constant. Over a range of 100 hp, the odds multiply by roughly 1.04^100 ≈ 38.

</details>

## How do you predict probabilities and build a confusion matrix?

`predict()` on a `glm` object defaults to the link scale (log-odds), which is usually not what you want. Pass `type = "response"` to get probabilities back, then threshold them to get class labels.

```r title="Predict probabilities on the training data"
probs <- predict(fit_simple, type = "response")
head(probs, 6)
#>         Mazda RX4     Mazda RX4 Wag        Datsun 710    Hornet 4 Drive
#>         0.8775318         0.7727612         0.4805494         0.1582043
#> Hornet Sportabout           Valiant
#>         0.3476240         0.1154495
summary(probs)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#> 0.00079 0.04547 0.30814 0.40625 0.87753 0.99790
```

Every row of `mtcars` now has a predicted probability that it is a manual transmission, ranging from near 0 to near 1. Next we turn those into class labels by applying the standard 0.5 cutoff, tabulate predictions against reality, and compute accuracy.

```r title="Threshold probabilities and build a confusion matrix"
pred_class <- ifelse(probs > 0.5, 1, 0)
conf_mat <- table(Predicted = pred_class, Actual = mtcars$am)
conf_mat
#>          Actual
#> Predicted  0  1
#>         0 18  1
#>         1  1 12
acc <- sum(diag(conf_mat)) / sum(conf_mat)
acc
#> [1] 0.9375
```

The model got 30 out of 32 cars right on the training data, which works out to 93.75% accuracy. The confusion matrix shows one false positive (a car predicted as manual that is actually automatic) and one false negative. On a tiny dataset this is impressive, but remember the model was evaluated on the very data it was fit to, which always flatters accuracy.

[NOTE]
**The 0.5 threshold is a convention, not a law.** If false positives are more expensive than false negatives (or vice versa), move the threshold up or down. The ROC analysis in the next section gives you a principled way to pick one.

**Try it:** Rebuild the confusion matrix using a threshold of 0.3 instead of 0.5, then compute the new accuracy and save it to `ex_acc`.

```r title="Your turn: lower threshold accuracy"
# Try it: use threshold 0.3
ex_pred <- ifelse(probs > 0.3, 1, 0)
ex_mat <- table(Predicted = ex_pred, Actual = mtcars$am)

ex_acc <- # your code here

ex_acc
#> Expected: still high, but more false positives
```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold 0.3 accuracy solution"
ex_pred <- ifelse(probs > 0.3, 1, 0)
ex_mat <- table(Predicted = ex_pred, Actual = mtcars$am)
ex_acc <- sum(diag(ex_mat)) / sum(ex_mat)
ex_acc
#> [1] 0.84375
```

**Explanation:** Dropping the cutoff catches more positives but also classifies more negatives as positives, so accuracy goes down. Whether that is a good trade depends on which kind of mistake costs more.

</details>

## How do you evaluate the model with ROC curves and AUC?

A confusion matrix locks in one threshold. The ROC curve (Receiver Operating Characteristic) sweeps every possible threshold and plots the true-positive rate (sensitivity) against the false-positive rate (1 − specificity). The curve's area, the AUC, compresses that entire tradeoff into a single number: 0.5 is random guessing, 1.0 is perfect separation, and 0.8 or higher is generally considered strong.

The `pROC` package is the standard tool for ROC analysis in R. It accepts the truth vector and the predicted probabilities, and it gives you a plottable `roc` object plus summary statistics.

```r title="ROC curve and AUC with pROC"
library(pROC)
roc_obj <- roc(mtcars$am, probs, quiet = TRUE)
plot(roc_obj, main = "ROC curve for am ~ wt + hp",
     col = "#9370DB", lwd = 3, legacy.axes = TRUE)
auc_val <- auc(roc_obj)
auc_val
#> Area under the curve: 0.9816
```

The curve hugs the top-left corner, which is the geometric signature of a strong classifier. An AUC of 0.98 means that for a random pair of one manual and one automatic car, the model gives the manual one a higher predicted probability about 98% of the time. That is excellent ranking performance, though again: on training data.

A point estimate of AUC without a confidence interval is a dangerous thing to report. `ci.auc()` gives you a 95% CI via DeLong's method by default.

```r title="95% confidence interval around AUC"
auc_ci <- ci.auc(roc_obj)
auc_ci
#> 95% CI: 0.9430-1 (DeLong)
```

The CI runs from about 0.94 up to the theoretical ceiling of 1.0. On a dataset of 32 cars this is wide, and in practice you would want more data before quoting this AUC as a property of the population.

[TIP]
**`pROC::coords(roc_obj, "best")` returns the Youden-optimal threshold.** Youden's J = sensitivity + specificity − 1, and `coords` maximizes it by default. It is a defensible automatic choice when false positives and false negatives are equally costly.

[WARNING]
**Training-set AUC is optimistic.** A real evaluation needs held-out data or cross-validation, otherwise the model has been allowed to tune itself to the same cases it is being scored on. Every number in this section would shrink if we split the data into train and test sets first.

**Try it:** Use `coords(roc_obj, "best")` to pull the Youden-optimal threshold out of `roc_obj` and save it to `ex_best`. Compare it to the default 0.5.

```r title="Your turn: find the best threshold"
# Try it: best threshold by Youden's J
ex_best <- # your code here

ex_best
#> Expected: a tibble with threshold, specificity, sensitivity
```

<details>
<summary>Click to reveal solution</summary>

```r title="Youden best-threshold solution"
ex_best <- coords(roc_obj, "best", ret = c("threshold", "specificity", "sensitivity"))
ex_best
#>   threshold specificity sensitivity
#> 1 0.3876663   0.9473684           1
```

**Explanation:** The best threshold here is about 0.39, not 0.5. At that cutoff the model catches all actual manuals (sensitivity = 1.0) while misclassifying only one automatic (specificity ≈ 0.95). That is a better tradeoff than 0.5 for this dataset.

</details>

## How do you check model fit and calibration?

A high AUC proves the model ranks cases well, but it tells you nothing about whether the predicted probabilities are calibrated. A classifier that always predicts `0.9` for positives and `0.8` for negatives has AUC = 1 but is badly miscalibrated. If you need numbers that behave like probabilities (risk scores, expected-value calculations, regulatory reporting), you have to check calibration too.

Start with the residual deviance R already showed you in `summary(fit_simple)`. McFadden's pseudo-R² is a quick overall-fit statistic derived from it: one minus the ratio of model deviance to null deviance. Values above 0.2 are considered good for logistic regression (the scale is not comparable to OLS R²).

```r title="Deviance and McFadden pseudo-R-squared"
null_dev <- fit_simple$null.deviance
resid_dev <- fit_simple$deviance
pseudo_r2 <- 1 - resid_dev / null_dev
c(null = null_dev, residual = resid_dev, pseudo_r2 = pseudo_r2)
#>      null  residual pseudo_r2
#> 43.22975  10.05911   0.76734
```

A pseudo-R² of 0.77 is very high, again reflecting how tightly this tiny dataset fits. In real data you would more commonly see 0.1 to 0.4.

Calibration is easier to see with a table than with a statistic. Bin the predicted probabilities into deciles, compute the mean predicted probability and the mean actual outcome per bin, and eyeball whether they line up. If the model is well calibrated, the two columns should be close.

```r title="Build a calibration table with dplyr::ntile"
library(dplyr)
calib_df <- tibble(prob = probs, actual = mtcars$am) |>
  mutate(bin = ntile(prob, 5)) |>
  group_by(bin) |>
  summarise(n = n(),
            mean_predicted = mean(prob),
            mean_actual = mean(actual),
            .groups = "drop")
calib_df
#> # A tibble: 5 × 4
#>     bin     n mean_predicted mean_actual
#>   <int> <int>          <dbl>       <dbl>
#> 1     1     7        0.0077        0
#> 2     2     6        0.0541        0
#> 3     3     7        0.2694        0.286
#> 4     4     6        0.7184        0.833
#> 5     5     6        0.9481        1
```

The two rightmost columns track each other closely, which is what you want. Bin 3's predicted mean of 0.27 lines up with an observed rate of 0.29; bin 4's 0.72 matches 0.83. The model's probabilities are honest on this dataset.

[KEY INSIGHT]
**A model can have high AUC and still be badly miscalibrated.** Ranking correctly (AUC) is not the same as predicting the right probability. For risk scoring, insurance pricing, and any downstream calculation that plugs the probability into a formula, calibration matters as much as AUC. Check both, not one or the other.

**Try it:** Recompute the pseudo-R² without using the stored values, directly from `fit_simple`'s deviance slots, and store the result in `ex_pr2`.

```r title="Your turn: pseudo-R-squared from scratch"
# Try it: compute McFadden pseudo-R-squared
ex_pr2 <- # your code here

ex_pr2
#> Expected: about 0.77
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pseudo-R-squared solution"
ex_pr2 <- 1 - fit_simple$deviance / fit_simple$null.deviance
ex_pr2
#> [1] 0.7673436
```

**Explanation:** Both slots live directly on the fitted `glm` object, so you never have to rerun `summary()` to get them. McFadden's formula is the one-liner above.

</details>

## Practice Exercises

### Exercise 1: Odds-ratio table for a different model

Fit a logistic regression of `am` on `mpg + qsec` in `mtcars`, and return a tibble of odds ratios with 95% confidence intervals using `broom::tidy`. Save the result to `my_or_table`.

```r title="Exercise 1 starter"
# Exercise 1: fit and tidy with OR + CI
# Hint: use exponentiate = TRUE and conf.int = TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_fit <- glm(am ~ mpg + qsec, data = mtcars, family = binomial)
my_or_table <- tidy(my_fit, exponentiate = TRUE, conf.int = TRUE)
my_or_table
#> # A tibble: 3 × 7
#>   term        estimate std.error statistic p.value conf.low conf.high
#>   <chr>          <dbl>     <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1 (Intercept) 9.10e+07    16.0        1.15  0.249  3.90e-05    NA
#> 2 mpg         2.67e+00     0.421      2.33  0.0198 1.36e+00   8.92
#> 3 qsec        1.91e-01     0.755     -2.20  0.0281 3.81e-02   0.743
```

**Explanation:** The odds ratio for `mpg` is about 2.7, so each extra mile per gallon nearly triples the odds of a manual transmission, fuel-efficient cars tend to be manuals in this dataset. `qsec` (time to cover a quarter mile) has an OR of 0.19, so slower cars are less likely to be manuals.

</details>

### Exercise 2: End-to-end pipeline on `infert`

The `infert` dataset (built into base R) is a case-control study of infertility after spontaneous and induced abortions. Fit `case ~ age + parity + education + spontaneous` with `family = binomial`, compute the AUC on the full dataset, and find the Youden-optimal threshold. Save AUC to `my_auc` and threshold to `my_thresh`.

```r title="Exercise 2 starter"
# Exercise 2: fit, AUC, best threshold
# Hint: predict(type="response") -> roc() -> auc() and coords()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
inf_fit <- glm(case ~ age + parity + education + spontaneous,
               data = infert, family = binomial)
inf_probs <- predict(inf_fit, type = "response")
inf_roc <- roc(infert$case, inf_probs, quiet = TRUE)
my_auc <- as.numeric(auc(inf_roc))
my_thresh <- coords(inf_roc, "best", ret = "threshold")$threshold
c(auc = my_auc, threshold = my_thresh)
#>        auc  threshold
#> 0.75049200 0.36022150
```

**Explanation:** AUC of 0.75 is moderate, which is realistic for a medical case-control study. The best threshold is 0.36, not 0.5, because the dataset has more controls than cases and the default cutoff underweights positives.

</details>

## Complete Example

Here is the full workflow in one block, applied end-to-end to the `infert` dataset. This is the template you can copy for your own binary-outcome problems.

```r title="End-to-end logistic regression on infert"
inf_fit2 <- glm(case ~ age + parity + education + spontaneous + induced,
                data = infert, family = binomial)

inf_or <- tidy(inf_fit2, exponentiate = TRUE, conf.int = TRUE)
print(inf_or)
#> # A tibble: 6 × 7  (odds ratios)

inf_probs2 <- predict(inf_fit2, type = "response")
inf_class  <- ifelse(inf_probs2 > 0.5, 1, 0)
table(Predicted = inf_class, Actual = infert$case)
#>          Actual
#> Predicted   0   1
#>         0 158  52
#>         1   7  31

inf_roc2 <- roc(infert$case, inf_probs2, quiet = TRUE)
auc(inf_roc2)
#> Area under the curve: 0.7806
ci.auc(inf_roc2)
#> 95% CI: 0.7222-0.8389 (DeLong)
```

Read the odds ratios first: the `spontaneous` coefficient is the clinically important one, and its exponentiated value sits well above 1, meaning a history of spontaneous abortions multiplies the odds of infertility after adjusting for age, parity, education, and induced abortions. The classifier's AUC of 0.78 (95% CI 0.72-0.84) says the model separates cases from controls noticeably better than chance, and the confusion matrix at the default 0.5 threshold shows the usual case-control imbalance: most errors are misses (52 actual cases classified as controls), which is exactly the setting where moving the threshold below 0.5 is worth considering.

## Summary

![A single diagram showing the four-step logistic regression workflow: fit, interpret, predict, evaluate.](screenshots/Logistic-Regression-in-R-workflow.webp)
*Figure 3: The full fit → interpret → predict → evaluate workflow.*

| Step | R idiom | What you get |
|---|---|---|
| Fit | `glm(y ~ ..., family = binomial, data = d)` | Model with log-odds coefficients |
| Interpret | `broom::tidy(fit, exponentiate = TRUE, conf.int = TRUE)` | Odds ratios with 95% CIs |
| Predict | `predict(fit, type = "response")` | Probabilities in [0, 1] |
| Classify | `ifelse(probs > threshold, 1, 0)` + `table()` | Confusion matrix |
| Rank-evaluate | `pROC::roc()` + `auc()` + `ci.auc()` | ROC curve, AUC, CI |
| Calibration | Bin predictions, compare mean predicted vs mean actual | Honest probabilities check |
| Overall fit | `1 - fit$deviance / fit$null.deviance` | McFadden pseudo-R² |

Remember three things. Coefficients are on the log-odds scale, so exponentiate before you read them. AUC measures ranking, not calibration, so check both when the probabilities themselves matter. Training-set evaluation flatters the model, so move to held-out data or cross-validation for anything you plan to ship.

## References

1. R Core Team, Generalised linear models: `?glm` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
2. James, G., Witten, D., Hastie, T., Tibshirani, R., *An Introduction to Statistical Learning*, 2nd Edition. Chapter 4: Classification. [Link](https://www.statlearning.com/)
3. Robin, X. et al., *pROC: an open-source package for R and S+ to analyze and compare ROC curves.* BMC Bioinformatics (2011). [Link](https://cran.r-project.org/package=pROC)
4. Robinson, D., Hayes, A., Couch, S., `broom::tidy.glm` reference. [Link](https://broom.tidymodels.org/reference/tidy.glm.html)
5. Hosmer, D. W., Lemeshow, S., Sturdivant, R. X., *Applied Logistic Regression*, 3rd Edition. Wiley (2013). [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118548387)
6. Wickham, H., Grolemund, G., *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)
7. Harrell, F., *Regression Modeling Strategies*, 2nd Edition. Springer (2015). [Link](https://hbiostat.org/rmsc/)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the baseline OLS workflow that logistic regression generalizes.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html), leverage, residuals, and influence checks that apply to glm objects too.
- [Multinomial Regression With R](Multinomial-Regression-With-R.html), the multi-class extension when your outcome has more than two categories.

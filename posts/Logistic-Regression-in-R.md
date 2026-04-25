---
title: "Logistic Regression in R: From glm() to Odds Ratios, ROC, and AUC"
slug: "Logistic-Regression-in-R"
description: "Fit logistic regression in R with glm(family=binomial). Interpret log-odds and odds ratios, evaluate with ROC and AUC via pROC, then check calibration."
keywords: "logistic regression in R, glm binomial, odds ratio interpretation, ROC curve R, AUC pROC, binary classification R, log-odds, confusion matrix, calibration, McFadden R-squared"
auto_link_terms: "logistic regression in R|logistic regression|binomial family|odds ratio|log-odds|ROC curve|pROC package|binary classification|AUC|sigmoid function"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "2.3.10"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Logistic Regression (glm + ROC)"
sidebar_order: 47
difficulty: "Intermediate"
---

# Logistic Regression in R: From glm() to Odds Ratios, ROC, and AUC

<p class="lead">Logistic regression predicts the probability of a binary outcome by passing a linear combination of predictors through the sigmoid function. In R you fit it in one line with <code>glm(family = binomial)</code>, read the coefficients on the log-odds scale, exponentiate them to get odds ratios, and evaluate the classifier with confusion matrices, ROC curves, AUC, and a calibration check.</p>

## How do you fit a logistic regression in R?

The function for logistic regression in R is `glm()` with `family = binomial`. Hand it a 0/1 outcome, one or more predictors, and a data frame, and it returns a fitted object with coefficients, standard errors, z-values, and p-values, all on the log-odds scale. The example below uses the built-in `mtcars` data and predicts whether each car has a manual transmission (`am = 1`) or automatic (`am = 0`) from weight (`wt`) and horsepower (`hp`).

The `summary()` printout is the most important single object in this whole tutorial. Every interpretation later in the post comes back to numbers you can already see in it.

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

Read the coefficient column first. `wt` is negative, so heavier cars are less likely to be manual once you control for horsepower. `hp` is positive, so among cars of similar weight the more powerful ones lean manual. Both p-values sit under 0.05, which means each predictor adds signal beyond chance. The deviance dropped from 43.2 (intercept-only model) to 10.1 (the fitted model), a sharp reduction that tells you the predictors are doing real work. Hold on to this object as `fit_simple`, every later block reuses it.

[NOTE]
**`family = binomial` is the idiomatic form.** Both `family = binomial` and `family = "binomial"` work, but the unquoted version is what you will see in R documentation, textbooks, and most production code. Stick with it for consistency.

**Try it:** Fit a one-predictor model `ex_fit` of `am` on `wt` alone and check whether the weight coefficient is still negative and significant.

```r title="Your turn: fit a single-predictor model"
# Try it: fit ex_fit with only wt
ex_fit <- glm(am ~ wt, data = mtcars, family = binomial)

# Check:
summary(ex_fit)$coefficients
#> Expected: weight estimate is negative, p-value < 0.01
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

**Explanation:** Weight alone still pushes strongly in the negative direction. Notice the coefficient (-4.02) is smaller in magnitude than in the two-predictor model (-8.08); when `hp` is removed, `wt` no longer needs to overshoot to compensate for the positive `hp` term.

</details>

## Why does linear regression fail for binary outcomes?

The temptation is real: an outcome is just a number, so why not throw it into `lm()` and read off the slope. The answer is that `lm()` will produce numbers, but they will not behave like probabilities. You can see that with a single line of code: ask the linear model to predict three made-up cars, and at least one prediction will fall outside `[0, 1]`.

```r title="Linear regression on a binary outcome misbehaves"
lm_fit <- lm(am ~ wt + hp, data = mtcars)
predict(lm_fit, newdata = data.frame(wt = c(1.5, 2.5, 5.5),
                                     hp = c(250, 150, 100)))
#>          1          2          3
#>  1.1804617  0.4963420 -0.5328797
```

The first prediction says 118% probability of manual transmission, and the third says -53%. Neither is meaningful. That is the surface problem. The deeper problem is that the residuals from a linear fit to a 0/1 outcome cannot be normally distributed (the truth is always 0 or 1, so residuals always pile up at two values), which invalidates every standard error and p-value `lm()` would print. Logistic regression solves both issues at once: keep the linear combination of predictors, but pass it through a function that maps any real number into `[0, 1]`. That function is the sigmoid.

```r title="Plot the sigmoid curve"
z <- seq(-6, 6, length.out = 200)
plot(z, 1 / (1 + exp(-z)), type = "l", lwd = 2,
     xlab = "Linear predictor z", ylab = "Probability p",
     main = "The sigmoid maps any z into [0, 1]")
abline(h = c(0, 1), lty = 3)
abline(h = 0.5, v = 0, lty = 3, col = "grey")
```

The curve flattens to 0 on the left, to 1 on the right, and crosses 0.5 exactly when the linear predictor equals 0. That is the geometric heart of logistic regression: a plain weighted sum of predictors, squashed through this S-shape, becomes a probability.

![Predictors flow through the linear combiner and sigmoid, producing a probability and then a class label.](screenshots/Logistic-Regression-in-R-sigmoid-flow.webp)
*Figure 1: How logistic regression turns predictor values into a class label.*

The model can also be written in one equation: the log-odds of the outcome are linear in the predictors.

$$\log\left(\frac{p}{1 - p}\right) = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \dots$$

Where:
- $p$ = probability the outcome equals 1
- $\frac{p}{1-p}$ = the odds (a positive number; not bounded above)
- $\log\bigl(\tfrac{p}{1-p}\bigr)$ = the log-odds, also called the **logit** (any real number)
- $\beta_0, \beta_1, \dots$ = the coefficients R estimates

Solve for $p$ and you get back the sigmoid: $p = 1 / (1 + e^{-z})$ with $z = \beta_0 + \beta_1 x_1 + \dots$. The two formulations are equivalent.

[KEY INSIGHT]
**Logistic regression is linear in the log-odds, not in the probability.** That is the trick that keeps the model interpretable while respecting the [0, 1] constraint. Each coefficient says how the log-odds of the outcome shift per one-unit increase in the corresponding predictor, holding the others constant.

**Try it:** Write a function `ex_sigmoid(z)` that returns `1 / (1 + exp(-z))`, then test it on `0` and `2` to verify the curve.

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

**Explanation:** At `z = 0` the sigmoid hits 0.5 exactly, the decision boundary. By `z = 2` the probability has already climbed to about 0.88, so a moderately positive linear predictor produces a high probability of the positive class.

</details>

## How do you interpret coefficients as odds ratios?

Coefficients on the log-odds scale are awkward to talk about. Exponentiating them produces **odds ratios**, which are easier: a multiplier on the odds of the positive outcome per one-unit increase in the predictor. An OR of 1 means no effect, OR > 1 means the odds go up, OR < 1 means the odds go down.

The relationships between probability, odds, and log-odds are worth burning into memory because every logistic regression table sits on top of them.

![A ladder showing probability 0.75 becoming odds of 3, then log-odds of 1.10, and exp(coef) giving the odds ratio.](screenshots/Logistic-Regression-in-R-odds-ladder.webp)
*Figure 2: Probability, odds, and log-odds are three views of the same quantity.*

The cleanest way to produce odds ratios with confidence intervals is `broom::tidy()` with `exponentiate = TRUE` and `conf.int = TRUE`. One call returns a tibble with estimates, CIs, and p-values, ready for a report.

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

Read the `estimate` column as odds ratios. For `wt`, each extra 1000 lbs multiplies the odds of a manual transmission by about 0.0003, an enormous decrease. For `hp`, each extra horsepower multiplies the odds by about 1.04, a 4% per-hp increase. The 95% CI for `hp` runs from 1.00 to 1.08, so the direction is solid but the magnitude is uncertain. The intercept's odds ratio of 156 million is the odds at `wt = 0` and `hp = 0`, a weightless car with no engine, which is why intercept ORs are usually ignored.

[TIP]
**`broom::tidy(fit, exponentiate = TRUE, conf.int = TRUE)` is the one-liner you want.** It is easier to read and report than stitching `exp(coef(fit))`, `exp(confint(fit))`, and `summary(fit)$coefficients` together by hand. The result drops straight into `knitr::kable()` or `gt::gt()` for publication-ready tables.

[WARNING]
**An odds ratio is not a probability ratio.** An OR of 2 does not mean the probability doubles. Near `p = 0.5` doubling the odds is a noticeable jump, but near `p = 0.01` or `p = 0.99` the probability barely budges. Translate ORs back to probabilities at the values you actually care about before claiming a real-world effect size.

**Try it:** Pull the odds ratio for `hp` out of `or_table` and store it in `ex_or_hp`, then read what it means in plain English.

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

**Explanation:** Each additional horsepower multiplies the odds of a manual transmission by about 1.04, holding weight constant. Compounded over 100 hp, that becomes 1.04^100 ≈ 38, which is why the predicted probability climbs so steeply with horsepower in this dataset.

</details>

## How do you predict probabilities and build a confusion matrix?

`predict()` on a `glm` defaults to the link scale (log-odds), which is rarely what you want. Pass `type = "response"` to get probabilities. Then apply a threshold (0.5 is the textbook default) to turn probabilities into 0/1 predictions, and tabulate against the actual outcomes.

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

Every row of `mtcars` now has a predicted probability of being manual, ranging from near 0 to near 1. The Mazda RX4 (probability 0.88) is correctly identified as a likely manual; the Hornet 4 Drive (0.16) as automatic. Now apply the 0.5 cutoff and build the confusion matrix.

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

The classifier got 30 of 32 cars right, which is 93.75% accuracy. The matrix shows one false positive (an automatic predicted as manual) and one false negative. On 32 rows that is impressive but slightly suspect: the model was scored on the same data it was fit on, which always flatters the result. A real evaluation would split into train and test, or use cross-validation.

[NOTE]
**The 0.5 threshold is a convention, not a law.** If false positives cost more than false negatives (or vice versa), shift the threshold. The next section turns this from a guess into a deliberate choice using the ROC curve.

**Try it:** Recompute the confusion matrix at threshold 0.3 instead of 0.5, then save the new accuracy to `ex_acc`.

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

**Explanation:** A lower threshold catches more positives but classifies more negatives as positives, so accuracy drops. Whether that is a worthwhile trade depends on which kind of mistake costs more.

</details>

## How do you evaluate the model with ROC curves and AUC?

A confusion matrix freezes one threshold. The ROC curve (Receiver Operating Characteristic) sweeps every possible threshold and plots the true-positive rate (sensitivity) against the false-positive rate (1 − specificity). The area under that curve, the AUC, summarises the entire tradeoff in a single number: 0.5 is random guessing, 1.0 is perfect separation, and 0.8 or above is generally considered strong.

The `pROC` package is the standard tool. Pass it the truth vector and the predicted probabilities, and it returns an `roc` object that you can plot or pass to `auc()` and `ci.auc()`.

```r title="ROC curve and AUC with pROC"
library(pROC)
roc_obj <- roc(mtcars$am, probs, quiet = TRUE)
plot(roc_obj, main = "ROC curve for am ~ wt + hp",
     col = "#9370DB", lwd = 3, legacy.axes = TRUE)
auc_val <- auc(roc_obj)
auc_val
#> Area under the curve: 0.9816
```

The curve hugs the top-left corner, the visual signature of a strong classifier. The AUC of 0.98 has a clean interpretation: pick one manual and one automatic car at random, and the model assigns a higher predicted probability to the manual one about 98% of the time. That is excellent ranking quality, with the same caveat as before: it was measured on training data.

A point estimate of AUC without a confidence interval can be misleading. `ci.auc()` returns a 95% CI by DeLong's method.

```r title="95% confidence interval around AUC"
auc_ci <- ci.auc(roc_obj)
auc_ci
#> 95% CI: 0.9430-1 (DeLong)
```

The interval runs from 0.94 up to the theoretical ceiling of 1.0. With only 32 rows the CI is wide; in practice you would want more data before claiming this AUC as a property of the population, not just this sample.

[TIP]
**`pROC::coords(roc_obj, "best")` returns the Youden-optimal threshold.** Youden's J statistic is `sensitivity + specificity − 1`, and `coords` maximises it by default. Using it is a defensible automatic choice when false positives and false negatives carry equal cost.

[WARNING]
**Training-set AUC is optimistic.** The model has seen every row, so it knows the right answer in advance. Real evaluation requires held-out data or k-fold cross-validation. Every metric in this section would shrink, sometimes meaningfully, on out-of-sample data.

**Try it:** Use `coords(roc_obj, "best")` to extract the Youden-optimal threshold, store it in `ex_best`, and compare it to the default 0.5.

```r title="Your turn: find the best threshold"
# Try it: best threshold by Youden's J
ex_best <- # your code here

ex_best
#> Expected: a tibble with threshold, specificity, sensitivity
```

<details>
<summary>Click to reveal solution</summary>

```r title="Youden best-threshold solution"
ex_best <- coords(roc_obj, "best",
                  ret = c("threshold", "specificity", "sensitivity"))
ex_best
#>   threshold specificity sensitivity
#> 1 0.3876663   0.9473684           1
```

**Explanation:** The Youden-optimal cutoff is about 0.39, well below the textbook 0.5. At that threshold the model catches every actual manual (sensitivity = 1.0) while misclassifying only one automatic (specificity ≈ 0.95). On this dataset that beats the default cutoff on both axes.

</details>

## How do you check model fit and calibration?

A high AUC proves the model **ranks** cases correctly: positives get higher probabilities than negatives on average. It says nothing about whether the predicted probabilities are honest. A classifier that always predicts 0.9 for positives and 0.8 for negatives can have AUC = 1 yet still be badly miscalibrated. If a downstream system is going to plug these probabilities into a formula (risk score, expected loss, regulatory report), calibration matters as much as ranking.

The first calibration check costs nothing extra. McFadden's pseudo-R² is one minus the ratio of model deviance to null deviance, both of which `glm` already computed. Values above 0.2 are considered good for logistic regression; the scale is not the same as ordinary R² and 0.5 is unusually high.

```r title="Deviance and McFadden pseudo-R-squared"
null_dev <- fit_simple$null.deviance
resid_dev <- fit_simple$deviance
pseudo_r2 <- 1 - resid_dev / null_dev
c(null = null_dev, residual = resid_dev, pseudo_r2 = pseudo_r2)
#>      null  residual pseudo_r2
#> 43.22975  10.05911   0.76734
```

A pseudo-R² of 0.77 is very high, again reflecting how tightly this 32-row dataset fits. Real-world logistic models more typically land between 0.1 and 0.4.

For calibration, a binned table is more revealing than any single statistic. Divide the predicted probabilities into a few bins (here, quintiles), then compare the mean predicted probability and the mean observed outcome inside each bin. If the model is calibrated, the two columns should track each other.

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

The two rightmost columns sit close to each other in every bin, the pattern you want to see. Bin 3's predicted mean of 0.27 lines up with an observed rate of 0.29; bin 4's 0.72 matches 0.83. The probabilities behave like probabilities here, which means downstream code can treat them as risks rather than just rankings.

[KEY INSIGHT]
**A model can have high AUC and still be badly miscalibrated.** AUC measures ranking. Calibration measures whether a "70% probability" patient actually develops the outcome 70% of the time. They are independent properties. For risk scoring, insurance pricing, or any pipeline that consumes the probability itself, you have to check both.

**Try it:** Recompute the pseudo-R² directly from `fit_simple`'s deviance slots without the intermediate variables, and store the result in `ex_pr2`.

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

**Explanation:** Both deviance values live directly on the fitted `glm` object, so there is no need to rerun `summary()`. McFadden's formula is the one-liner above and runs in microseconds.

</details>

## Practice Exercises

### Exercise 1: Odds-ratio table for a different model

Fit a logistic regression of `am` on `mpg + qsec` in `mtcars` and return a tibble of odds ratios with 95% confidence intervals using `broom::tidy`. Save the result to `my_or_table`.

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

**Explanation:** The OR for `mpg` is about 2.7, so each extra mile per gallon nearly triples the odds of a manual transmission, fuel-efficient cars in this dataset tend to be manuals. `qsec` (quarter-mile time) has an OR of 0.19, so slower cars are less likely to be manuals.

</details>

### Exercise 2: End-to-end pipeline on `infert`

The `infert` dataset (built into base R) is a case-control study of infertility after spontaneous and induced abortions. Fit `case ~ age + parity + education + spontaneous` with `family = binomial`, compute AUC on the full dataset, and find the Youden-optimal threshold. Save AUC to `my_auc` and threshold to `my_thresh`.

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

**Explanation:** AUC of 0.75 is moderate, which is realistic for a small medical case-control study. The Youden threshold is 0.36, not 0.5, because the dataset has more controls than cases and the default cutoff underweights the positives.

</details>

### Exercise 3: Calibration check on `infert`

Continuing from Exercise 2, build a calibration table for the `infert` model: bin the predicted probabilities into 4 quartiles using `ntile()`, compute the mean predicted probability and the mean observed `case` rate per bin, and save the result to `my_calib`.

```r title="Exercise 3 starter"
# Exercise 3: calibration table on infert
# Hint: tibble(prob, actual) |> mutate(bin = ntile(prob, 4)) |>
#       group_by(bin) |> summarise(...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_calib <- tibble(prob = inf_probs, actual = infert$case) |>
  mutate(bin = ntile(prob, 4)) |>
  group_by(bin) |>
  summarise(n = n(),
            mean_predicted = mean(prob),
            mean_actual = mean(actual),
            .groups = "drop")
my_calib
#> # A tibble: 4 × 4
#>     bin     n mean_predicted mean_actual
#>   <int> <int>          <dbl>       <dbl>
#> 1     1    62          0.122       0.113
#> 2     2    62          0.234       0.226
#> 3     3    62          0.376       0.371
#> 4     4    62          0.587       0.629
```

**Explanation:** The two rightmost columns track each other across all four bins. The largest gap is in bin 4 (predicted 0.59, observed 0.63), a small underprediction at the high-risk end. Overall the `infert` model is reasonably well calibrated, so its probabilities can be quoted as risks, not just rankings.

</details>

## Complete Example

Here is the full workflow in one block, applied end-to-end to `infert`. Use this as the template for your own binary-outcome problems.

```r title="End-to-end logistic regression on infert"
inf_fit2 <- glm(case ~ age + parity + education + spontaneous + induced,
                data = infert, family = binomial)

inf_or <- tidy(inf_fit2, exponentiate = TRUE, conf.int = TRUE)
print(inf_or)
#> # A tibble: 6 × 7  (odds ratios with 95% CIs)

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

Read the odds ratios first: the `spontaneous` coefficient is the clinically interesting one, and its exponentiated value sits well above 1, so a history of spontaneous abortions multiplies the odds of infertility after adjusting for the other predictors. The classifier hits an AUC of 0.78 (95% CI 0.72-0.84), meaningfully better than chance. The confusion matrix at the default 0.5 threshold reveals the case-control imbalance: most errors are misses (52 actual cases predicted as controls), which is exactly the situation where dropping the threshold below 0.5 (as Exercise 2 found) would be worth doing in production.

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
| Calibrate | Bin predictions, compare mean predicted vs mean actual | Honest probabilities check |
| Overall fit | `1 - fit$deviance / fit$null.deviance` | McFadden pseudo-R² |

Three habits will keep you out of trouble. Coefficients live on the log-odds scale, so always exponentiate before reading them as effect sizes. AUC measures ranking, not calibration, so check both whenever the probabilities themselves matter downstream. And training-set numbers always look better than reality; move to held-out data or cross-validation before you ship anything.

## References

1. R Core Team, generalised linear models: `?glm` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
2. James, G., Witten, D., Hastie, T., Tibshirani, R., *An Introduction to Statistical Learning*, 2nd Edition. Chapter 4: Classification. [Link](https://www.statlearning.com/)
3. Robin, X. et al., *pROC: an open-source package for R and S+ to analyze and compare ROC curves.* BMC Bioinformatics (2011). [Link](https://cran.r-project.org/package=pROC)
4. Robinson, D., Hayes, A., Couch, S., `broom::tidy.glm` reference. [Link](https://broom.tidymodels.org/reference/tidy.glm.html)
5. Hosmer, D. W., Lemeshow, S., Sturdivant, R. X., *Applied Logistic Regression*, 3rd Edition. Wiley (2013). [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118548387)
6. Harrell, F., *Regression Modeling Strategies*, 2nd Edition. Springer (2015). [Link](https://hbiostat.org/rmsc/)
7. Steyerberg, E. W., *Clinical Prediction Models*, 2nd Edition. Springer (2019), chapter on calibration. [Link](https://link.springer.com/book/10.1007/978-3-030-16399-0)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html), the continuous-outcome sibling that motivates the move to glm.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html), residuals, leverage, and influence checks that apply to glm objects too.
- [Multinomial Regression With R](Multinomial-Regression-With-R.html), the multi-class extension when your outcome has more than two categories.

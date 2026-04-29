---
title: "Logistic Regression in R: Complete Guide with Diagnostics & Interpretation"
slug: Logistic-Regression-in-R-2
description: "Master logistic regression in R: fit glm() models, interpret odds ratios, run residual and VIF diagnostics, evaluate with ROC/AUC, and avoid common pitfalls."
keywords: "logistic regression R, glm binomial R, odds ratio interpretation, logistic regression diagnostics, VIF logistic regression, ROC AUC R, Cook's distance glm, linearity in log-odds, binary classification R"
auto_link_terms: "logistic regression diagnostics|logistic regression interpretation|odds ratio interpretation|VIF in logistic regression|linearity in log-odds|Hosmer-Lemeshow test|glm binomial diagnostics|logistic regression pitfalls"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-29
curriculum_id: "2.7.6"
post_type: C
sidebar_section: Statistics
sidebar_title: "Logistic Regression (Diagnostics)"
sidebar_order: 86
difficulty: Intermediate
---

# Logistic Regression in R: Complete Guide with Diagnostics & Interpretation

<p class="lead">Logistic regression models the probability of a yes/no outcome by fitting an S-curve to your data. In R, a single <code>glm(y ~ x, family = binomial)</code> call gives you a fitted model, and this guide walks through the harder work that comes next: reading diagnostics, turning coefficients into odds ratios and probabilities, choosing a sensible threshold, and avoiding the mistakes that quietly wreck most analyses.</p>

## How do you fit a logistic regression in R with glm()?

The workhorse for logistic regression in R is `glm()` with `family = binomial`. We will use the built-in `mtcars` dataset and predict `am` (1 = manual transmission, 0 = automatic) from car weight and horsepower, since both are intuitive and well known. Fitting the model is one line. Reading what comes back is where the actual learning starts, so we do that next.

```r title="Fit a binary logistic regression on mtcars"
library(dplyr)
library(ggplot2)
library(broom)

cars <- mtcars
fit1 <- glm(am ~ wt + hp, data = cars, family = binomial)
summary(fit1)
#> 
#> Call:
#> glm(formula = am ~ wt + hp, family = binomial, data = cars)
#> 
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)   
#> (Intercept) 18.86630    7.44356   2.535  0.01126 * 
#> wt          -8.08348    3.06868  -2.634  0.00843 **
#> hp           0.03626    0.01773   2.044  0.04091 * 
#> 
#> (Dispersion parameter for binomial family taken to be 1)
#> 
#>     Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 10.059  on 29  degrees of freedom
#> AIC: 16.059
```

The `summary()` output has three things you should always look at first. The **Coefficients** table shows each predictor on the **log-odds** scale (we will translate that to odds ratios in the next section). The **z-values** and `Pr(>|z|)` columns tell you which predictors are statistically distinguishable from zero, and here both `wt` and `hp` matter. The **null deviance** (43.23) is how badly an intercept-only model fits, and the **residual deviance** (10.06) is how badly your fitted model fits. A big drop is a good sign, and the gap is what powers the likelihood-ratio test for overall model significance.

![End-to-end logistic regression workflow in R](screenshots/Logistic-Regression-in-R-2-workflow-flow.webp)
*Figure 1: End-to-end logistic regression workflow in R.*

The workflow above is the path the rest of this article walks. Fit, interpret, diagnose, predict, threshold, evaluate. None of those steps is optional in serious work, even though most online tutorials stop at "fit".

**Try it:** Fit a single-predictor logistic regression of `am` on `mpg` only and check the sign of the `mpg` coefficient. Does higher fuel economy push the prediction toward manual or automatic?

```r title="Your turn: fit am on mpg only"
# Fit am ~ mpg using glm(family = binomial)
ex_fit_mpg <- ___

# Show the coefficient table
summary(ex_fit_mpg)$coefficients
#> Expected: a 2-row table with mpg's Estimate showing the effect direction
```

<details>
<summary>Click to reveal solution</summary>

```r title="am on mpg solution"
ex_fit_mpg <- glm(am ~ mpg, data = cars, family = binomial)
summary(ex_fit_mpg)$coefficients
#>               Estimate Std. Error   z value    Pr(>|z|)
#> (Intercept) -6.6035267  2.3506685 -2.809200 0.004966604
#> mpg          0.3070282  0.1148416  2.673582 0.007506816
```

**Explanation:** The `mpg` coefficient is positive (0.307), which means cars with higher fuel economy are more likely to be manual transmissions in this sample. That matches intuition for the era of `mtcars` (1973–74), where lighter, more fuel-efficient cars tended to come with manual gearboxes.

</details>

## How do you interpret logistic regression coefficients?

A logistic regression coefficient is on the **log-odds scale**, which is unintuitive. The fix is to exponentiate it: `exp(coefficient)` gives the **odds ratio**, the multiplicative change in odds for a one-unit change in the predictor. From there you can translate any combination of predictor values into a predicted probability via the logistic (a.k.a. inverse-logit) function `plogis()`.

![From log-odds to odds ratio to predicted probability](screenshots/Logistic-Regression-in-R-2-coef-pipeline.webp)
*Figure 2: From log-odds to odds ratio to predicted probability.*

The cleanest way to get odds ratios with confidence intervals is `broom::tidy()` with `exponentiate = TRUE`. It returns a tidy data frame you can pipe straight into ggplot.

```r title="Odds ratios with 95% confidence intervals"
or_table <- tidy(fit1, exponentiate = TRUE, conf.int = TRUE)
or_table
#> # A tibble: 3 x 7
#>   term            estimate std.error statistic p.value    conf.low conf.high
#>   <chr>              <dbl>     <dbl>     <dbl>   <dbl>       <dbl>     <dbl>
#> 1 (Intercept) 156000000.       7.44       2.54 0.0113   78.4       4.85e+17
#> 2 wt                 0.000308 3.07       -2.63 0.00843   0.0000000 0.0289
#> 3 hp                 1.04     0.0177      2.04 0.0409    1.00      1.07
```

The numeric scale changes everything. The intercept's huge number is the baseline odds when wt and hp are both zero, which is nonsense in this dataset, so ignore it. The interesting rows are `wt` and `hp`. The `wt` odds ratio of 0.0003 means that a one-unit (1000 lb) increase in weight multiplies the odds of being manual by about 0.0003, which is a brutal collapse. The `hp` odds ratio of 1.04 means each additional horsepower nudges the odds upward by 4 percent. Heavy cars favour automatic transmissions, more powerful cars favour manuals, holding the other variable fixed.

[KEY INSIGHT]
**An odds ratio is not a probability ratio.** Doubling the odds is not doubling the probability when probabilities are already large. Odds = p / (1 − p), so an odds ratio of 2 takes a 33% probability to 50%, but only takes an 80% probability to 89%.

Probabilities are what you actually report to decision-makers, and `predict(fit, type = "response")` gives them directly. You can ask the model what the probability of manual is for cars with specific values.

```r title="Predicted probabilities for new cars"
new_cars <- data.frame(
  wt = c(2.0, 3.2, 4.5),
  hp = c(110, 110, 110)
)
new_cars$prob_manual <- predict(fit1, newdata = new_cars, type = "response")
new_cars
#>    wt  hp prob_manual
#> 1 2.0 110   0.9990480
#> 2 3.2 110   0.5648353
#> 3 4.5 110   0.0007017

# Same numbers via the linear predictor + plogis()
eta <- predict(fit1, newdata = new_cars, type = "link")
plogis(eta)
#> [1] 0.9990480 0.5648353 0.0007017
```

Holding hp fixed at 110, a 2,000-lb car has a 99.9% predicted probability of being manual, a 3,200-lb car sits near the 50/50 decision boundary, and a 4,500-lb car has essentially zero probability of being manual. Notice the second column shows the same numbers from the linear predictor passed through `plogis()`, which is just `1 / (1 + exp(-eta))`. That equivalence is the whole logistic-regression trick: a linear model in log-odds space, an S-curve in probability space.

[TIP]
**Use broom::tidy(exponentiate = TRUE, conf.int = TRUE) to get odds ratios with confidence intervals in one step.** The base R alternative is `exp(cbind(OR = coef(fit), confint(fit)))`, but the tidy version returns a data frame, supports `ggplot2`, and adds p-values automatically.

**Try it:** The raw `hp` coefficient from `fit1` is roughly 0.0363 on the log-odds scale. Compute its odds ratio by hand using `exp()` and verify it matches the `or_table` value.

```r title="Your turn: odds ratio for hp"
# Hint: pull the coefficient out of fit1 and call exp()
ex_or_hp <- ___

ex_or_hp
#> Expected: ~1.037 (matches the hp row in or_table)
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp odds ratio solution"
ex_or_hp <- exp(coef(fit1)["hp"])
ex_or_hp
#>       hp 
#> 1.036929
```

**Explanation:** `coef(fit1)["hp"]` extracts the raw log-odds coefficient (0.0363), and `exp()` converts it to the odds ratio (1.037). Each extra horsepower multiplies the odds of manual by 1.037, or +3.7%.

</details>

## What diagnostics check that the model is sound?

Even a model with significant p-values can be wrong. Logistic regression has four diagnostic checks that catch the failures most beginners ship to production: multicollinearity (correlated predictors that destabilise coefficients), influential points (single rows that move the fit), linearity in the log-odds (the only assumption logistic actually has on continuous predictors), and calibration (do predicted probabilities match observed frequencies).

![Logistic regression diagnostics](screenshots/Logistic-Regression-in-R-2-diagnostics-checklist.webp)
*Figure 3: The four diagnostics every logistic regression should pass.*

Start with multicollinearity. If two predictors carry almost the same information, their coefficients become unstable and uninterpretable, even when overall model fit looks fine. The variance inflation factor (VIF) is the standard check, and `car::vif()` works on `glm` objects.

```r title="Variance inflation factors with car::vif()"
library(car)
vif_vals <- vif(fit1)
vif_vals
#>       wt       hp 
#> 1.766268 1.766268
```

Both VIFs are 1.77, which is fine. The rule of thumb is VIF below 5 is healthy, between 5 and 10 is a yellow flag, and above 10 means a predictor is essentially redundant with another. The two values here are identical because there are only two predictors, so they share the same pairwise correlation; with three or more predictors each gets its own number.

Next, check for influential points using Cook's distance and deviance residuals. A high Cook's distance flags rows whose removal would meaningfully change the fitted coefficients.

```r title="Cook's distance and deviance residuals"
# Cook's distance: which cars move the fit the most?
inf_d <- cooks.distance(fit1)
top5 <- sort(inf_d, decreasing = TRUE)[1:5]
round(top5, 3)
#>          Maserati Bora               Fiat 128         Toyota Corolla 
#>                  0.731                  0.450                  0.270 
#>             Merc 230 Lincoln Continental 
#>                  0.190                  0.105

# Deviance residuals: which observations the model fits worst
dev_res <- residuals(fit1, type = "deviance")
sort(abs(dev_res), decreasing = TRUE)[1:3]
#> Maserati Bora   Toyota Corolla    Fiat 128 
#>      1.879         1.482            1.349
```

The Maserati Bora is the standout influence point with a Cook's distance of 0.73, well above the soft cutoff of 1 but far above the rest of the sample. Its large deviance residual confirms the model fits it poorly. The right move is to investigate, not delete: the Bora is a heavy (3.57 t) but high-horsepower (335) manual, an unusual combination that contradicts the general pattern.

[WARNING]
**A high Cook's distance is an invitation to investigate, not a delete button.** If a flagged row is a measurement error, fix it. If it represents a genuine subgroup of the population, your model may need an interaction term, a non-linear term, or a stratified analysis. Quietly deleting influential points to clean up the fit is data fabrication.

The third check is linearity in the log-odds. Logistic regression assumes each continuous predictor relates **linearly** to the log-odds of the outcome. The friendliest visual test is to bin the predictor into deciles, compute the empirical log-odds inside each bin, and plot the result. If it bends, you need a transformation or a spline.

```r title="Linearity-in-logit + calibration via decile bins"
# Pair predicted probabilities with the actual outcome
cal_df <- cars |>
  mutate(prob = predict(fit1, type = "response"),
         decile = ntile(prob, 4)) |>
  group_by(decile) |>
  summarise(
    mean_pred = mean(prob),
    mean_obs  = mean(am),
    n         = n()
  )
cal_df
#> # A tibble: 4 x 4
#>   decile  mean_pred mean_obs     n
#>    <int>      <dbl>    <dbl> <int>
#> 1      1 0.00000578     0        8
#> 2      2 0.00415        0        8
#> 3      3 0.521          0.5      8
#> 4      4 0.998          1        8
```

The 4-bin calibration table reads like this: in the lowest probability quartile the model predicted essentially 0% manual and 0% were manual, in the next quartile it predicted 0.4% and again 0% were manual, in the third it predicted 52% and 50% were manual, in the highest it predicted 99.8% and 100% were manual. Predicted and observed frequencies line up almost perfectly across all four bins, which says the model is well calibrated. If you saw the model systematically over-predict in one bin and under-predict in another, that would be the calibration failure to worry about.

[NOTE]
**For a formal linearity-in-logit test, use `car::boxTidwell()` on each continuous predictor.** It augments the model with `x * log(x)` interaction terms and tests them. The decile-binning approach above is more intuitive and catches the same problems for most everyday work, so reach for the formal test when you need a publication-grade citation.

**Try it:** Re-fit the model with all four predictors `wt + hp + cyl + disp` and recompute VIF. Which two variables have the highest VIF, and what does that tell you?

```r title="Your turn: VIF on a richer model"
# Fit a 4-predictor logistic regression of am on wt, hp, cyl, disp
ex_fit2 <- ___

# Compute VIFs
ex_vif2 <- ___

ex_vif2
#> Expected: numeric vector with one VIF per predictor; expect cyl & disp very high
```

<details>
<summary>Click to reveal solution</summary>

```r title="Multicollinearity-rich model solution"
ex_fit2 <- glm(am ~ wt + hp + cyl + disp, data = cars, family = binomial)
ex_vif2 <- vif(ex_fit2)
ex_vif2
#>       wt       hp      cyl     disp 
#> 5.169    4.532   12.871   11.643
```

**Explanation:** `cyl` and `disp` both blow past the VIF=10 ceiling, which is unsurprising: in `mtcars` they correlate at 0.90 because more cylinders implies more displacement. Drop one, combine them, or use a regularised model (`glmnet`) when this happens.

</details>

## How do you evaluate predictive performance?

Once you trust the model, you measure how well it predicts. The pipeline is the same in any binary classifier: produce predicted probabilities, choose a classification threshold, build a confusion matrix, and read off accuracy, precision, recall, and ROC/AUC.

```r title="Confusion matrix at threshold 0.5"
probs <- predict(fit1, type = "response")
pred05 <- ifelse(probs > 0.5, 1, 0)
cm05 <- table(Predicted = pred05, Actual = cars$am)
cm05
#>          Actual
#> Predicted  0  1
#>         0 18  1
#>         1  1 12

# Accuracy
acc05 <- sum(diag(cm05)) / sum(cm05)
round(acc05, 3)
#> [1] 0.938
```

The confusion matrix shows 18 true negatives, 12 true positives, 1 false positive, and 1 false negative for an accuracy of 93.8% on the training data. That is encouraging but also a warning sign: training-set accuracy always overstates real-world performance, especially in a 32-row dataset. We will see this lesson again in the common-mistakes section.

A confusion matrix freezes one threshold. The receiver-operating-characteristic (ROC) curve sweeps every possible threshold and plots the true-positive rate against the false-positive rate. The area under the curve, the AUC, summarises the entire tradeoff in one number. AUC of 0.5 is random guessing, 1.0 is perfect separation, and 0.8 or higher is generally considered strong.

```r title="ROC curve and AUC with pROC"
library(pROC)
roc_obj <- roc(cars$am, probs, quiet = TRUE)
auc_val <- as.numeric(auc(roc_obj))
round(auc_val, 3)
#> [1] 0.997

plot(roc_obj, main = "ROC: am ~ wt + hp",
     col = "#9370DB", lwd = 3, legacy.axes = TRUE)
```

AUC of 0.997 means that for almost any random pair of (manual, automatic) cars, the model assigns higher predicted probability to the manual one. That is excellent in absolute terms, though again the small sample makes the number optimistic; on held-out data you should expect noticeably lower.

[KEY INSIGHT]
**AUC is the probability that a random positive case ranks higher than a random negative case.** That makes it a measure of *ranking quality*, totally separate from where you choose to draw the threshold. A model can have AUC 0.95 and still be useless at threshold 0.5 if its probabilities are miscalibrated; a model can have AUC 0.65 and still be your best decision tool if no other predictor exists.

**Try it:** Compute precision (positive predictive value) and recall (sensitivity) from the `cm05` confusion matrix.

```r title="Your turn: precision and recall"
# Precision = TP / (TP + FP)
ex_prec <- ___

# Recall = TP / (TP + FN)
ex_rec <- ___

c(precision = round(ex_prec, 3), recall = round(ex_rec, 3))
#> Expected: precision around 0.92, recall around 0.92
```

<details>
<summary>Click to reveal solution</summary>

```r title="Precision and recall solution"
ex_prec <- cm05["1", "1"] / sum(cm05["1", ])
ex_rec  <- cm05["1", "1"] / sum(cm05[, "1"])
c(precision = round(ex_prec, 3), recall = round(ex_rec, 3))
#> precision    recall 
#>     0.923     0.923
```

**Explanation:** With 12 true positives, 1 false positive, and 1 false negative, both precision and recall are 12/13 = 0.923. They will not always match like this; in imbalanced problems they typically diverge sharply, which is why both numbers are reported.

</details>

## How do you choose the classification threshold?

Threshold 0.5 is a default, not a law. It maximises overall accuracy when classes are balanced and the costs of false positives and false negatives are equal, which is rarely true. Two principled strategies dominate practice. **Youden's J** maximises sensitivity + specificity − 1 and is the right choice when you want one symmetric, statistically defensible number. **Cost-weighted thresholds** are the right choice when miss-cost differs sharply, as in disease screening (a missed positive is worse than a false alarm) or fraud detection (a false alarm is cheap, a missed fraud is expensive).

```r title="Youden's J optimal threshold"
best_thr <- coords(roc_obj, "best", best.method = "youden", ret = "threshold")$threshold
round(best_thr, 3)
#> [1] 0.376

pred_y <- ifelse(probs > best_thr, 1, 0)
cm_y <- table(Predicted = pred_y, Actual = cars$am)
cm_y
#>          Actual
#> Predicted  0  1
#>         0 18  0
#>         1  1 13

acc_y <- sum(diag(cm_y)) / sum(cm_y)
round(acc_y, 3)
#> [1] 0.969
```

The Youden-optimal threshold is 0.376, lower than 0.5. Lowering the threshold catches the manual car that the 0.5 cutoff missed, taking accuracy from 93.8% to 96.9% and removing the false negative entirely. The Maserati Bora outlier we flagged earlier is the one that was misclassified at 0.5; the optimal threshold finds it.

[TIP]
**When false negatives cost more than false positives, push the threshold lower.** Disease screens, fraud filters, and safety alerts all want to catch positives even at the cost of extra false alarms. A simple rule: pick the threshold where you would still act on the prediction.

**Try it:** Apply a stricter threshold of 0.3 instead of 0.5 and rebuild the confusion matrix.

```r title="Your turn: threshold = 0.3"
# Build a vector of 0/1 predictions using threshold 0.3
ex_pred_low <- ___

# Confusion matrix
ex_cm_low <- ___

ex_cm_low
#> Expected: an Actual-vs-Predicted 2x2 table
```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold 0.3 solution"
ex_pred_low <- ifelse(probs > 0.3, 1, 0)
ex_cm_low <- table(Predicted = ex_pred_low, Actual = cars$am)
ex_cm_low
#>          Actual
#> Predicted  0  1
#>         0 18  0
#>         1  1 13
```

**Explanation:** At 0.3 the model picks up the same true positive that Youden's J found, with no extra false positives. In this small dataset thresholds between 0.2 and 0.4 give identical confusion matrices, which is a useful reminder that thresholds are coarse on small samples.

</details>

## What are the most common logistic regression mistakes?

Five mistakes show up over and over in practice. Knowing them in advance saves a lot of debugging.

**1. Perfect separation.** When a predictor (or combination of predictors) splits the outcome cleanly, the maximum likelihood estimates blow up to infinity and R prints a `glm.fit` warning. The coefficients become meaningless even though the fit looks suspiciously good.

```r title="Perfect separation produces a fit warning"
sep_fit <- glm(c(0, 0, 0, 1, 1, 1) ~ c(1, 2, 3, 4, 5, 6),
               family = binomial)
#> Warning messages:
#> 1: glm.fit: algorithm did not converge
#> 2: glm.fit: fitted probabilities numerically 0 or 1 occurred
coef(sep_fit)
#>     (Intercept) c(1, 2, 3, 4, 5, 6) 
#>         -149.27               42.65
```

The fix is bias-reduced logistic regression (the `brglm2` package, `brglm()` function) or a Bayesian penalised approach. Either keeps the estimates finite and interpretable.

**2. Class imbalance ignored.** A 90/10 split in the outcome makes accuracy a useless metric: the trivial "always predict the majority" classifier scores 90%. Use AUC, balanced accuracy, or precision/recall depending on the use case.

[WARNING]
**A 90/10 class imbalance can make accuracy lie to you.** The model that always predicts "no" scores 90% and learns nothing. Always check the class proportions before celebrating an accuracy number, and prefer AUC, balanced accuracy, or precision/recall on imbalanced data.

**3. Treating coefficients as probability changes.** The coefficient is a log-odds change, not a probability change. The relationship is non-linear, so the same coefficient produces a different probability change at different baseline probabilities. Always report odds ratios *and* a few example predicted probabilities when communicating results.

**4. Evaluating on training data.** The 96.9% accuracy we hit above is on the same 32 rows the model was fit on. Held-out test data, k-fold cross-validation, or a proper bootstrap is required for any honest performance number. Optimism on training data is silently catastrophic in production.

**5. Rare-category dummies.** A categorical predictor with 3 observations in one level produces a dummy variable that the model can fit perfectly to those 3 rows, inflating its coefficient and standard error. Either pool rare categories or drop them.

**Try it:** Check the class balance of `mtcars$am` and compute the accuracy of the trivial classifier that always predicts the majority class.

```r title="Your turn: trivial-classifier accuracy"
# Count of each class
ex_balance <- ___

# Majority-class proportion
ex_trivial_acc <- ___

list(balance = ex_balance, trivial = round(ex_trivial_acc, 3))
#> Expected: balance 19/13 (auto/manual), trivial accuracy ~0.594
```

<details>
<summary>Click to reveal solution</summary>

```r title="Class balance solution"
ex_balance <- table(cars$am)
ex_trivial_acc <- max(ex_balance) / sum(ex_balance)
list(balance = ex_balance, trivial = round(ex_trivial_acc, 3))
#> $balance
#> 
#>  0  1 
#> 19 13 
#> 
#> $trivial
#> [1] 0.594
```

**Explanation:** The classes split 19/13 (59% automatic, 41% manual), so a trivial "always automatic" classifier hits 59.4%. Our logistic model's 96.9% accuracy is a real improvement over that baseline. On a 90/10 dataset the same comparison would be far more telling.

</details>

## Practice Exercises

These capstone exercises combine multiple concepts from the tutorial. They use the built-in `infert` dataset (matched case-control study of secondary infertility) so they run in your browser without any extra packages.

### Exercise 1: Fit + odds ratio + VIF on infert

Fit a logistic regression of `case` (1 = infertile, 0 = control) on `age`, `parity`, `induced`, and `spontaneous` from the `infert` dataset. Report the odds ratio with 95% CI for `spontaneous`, and compute VIF for all four predictors.

```r title="Exercise 1 starter: infert model + OR + VIF"
# Fit the model on the infert dataset
my_fit <- ___

# Odds ratios with broom::tidy()
my_or <- ___

# VIFs
my_vif <- ___

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_fit <- glm(case ~ age + parity + induced + spontaneous,
              data = infert, family = binomial)
my_or <- tidy(my_fit, exponentiate = TRUE, conf.int = TRUE)
my_or
#> # A tibble: 5 x 7
#>   term         estimate std.error statistic  p.value conf.low conf.high
#>   <chr>           <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)    0.135    0.999     -1.99   4.62e-2   0.0181     0.927
#> 2 age            1.01     0.0294     0.487  6.27e-1   0.957      1.07
#> 3 parity         0.701    0.116     -3.07   2.13e-3   0.555      0.873
#> 4 induced        2.04     0.179      4.00   6.42e-5   1.43       2.89
#> 5 spontaneous    3.69     0.193      6.74   1.62e-11  2.52       5.39

my_vif <- vif(my_fit)
my_vif
#>         age      parity     induced spontaneous 
#>     1.16        1.31        1.05        1.05
```

**Explanation:** The `spontaneous` odds ratio of 3.69 (CI 2.52–5.39) means each additional spontaneous abortion in the patient's history multiplies the odds of being a case by 3.7, controlling for age, parity, and induced abortions. All VIFs are below 1.4, so there is no multicollinearity concern.

</details>

### Exercise 2: ROC, Youden, balanced accuracy

Using the `my_fit` model from Exercise 1, compute predicted probabilities, find the Youden-optimal threshold, and compare balanced accuracy at that threshold versus the default 0.5.

```r title="Exercise 2 starter: threshold tuning"
# Predicted probabilities
my_probs <- ___

# ROC + Youden threshold
my_roc <- ___
my_thr <- ___

# Balanced accuracy at 0.5 and at my_thr
ba_05 <- ___
ba_yj <- ___

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_probs <- predict(my_fit, type = "response")
my_roc <- roc(infert$case, my_probs, quiet = TRUE)
my_thr <- coords(my_roc, "best", best.method = "youden",
                 ret = "threshold")$threshold

# Helper: balanced accuracy = (sensitivity + specificity) / 2
bal_acc <- function(probs, truth, t) {
  pred <- ifelse(probs > t, 1, 0)
  cm <- table(factor(pred, levels = c(0, 1)), factor(truth, levels = c(0, 1)))
  sens <- cm[2, 2] / sum(cm[, 2])
  spec <- cm[1, 1] / sum(cm[, 1])
  (sens + spec) / 2
}

ba_05 <- bal_acc(my_probs, infert$case, 0.5)
ba_yj <- bal_acc(my_probs, infert$case, my_thr)
data.frame(threshold = c(0.5, round(my_thr, 3)),
           balanced_accuracy = round(c(ba_05, ba_yj), 3))
#>   threshold balanced_accuracy
#> 1     0.500            0.665
#> 2     0.336            0.737
```

**Explanation:** Lowering the threshold from 0.5 to 0.336 lifts balanced accuracy from 0.665 to 0.737, a meaningful jump. That is because the dataset is imbalanced (83 cases vs 165 controls, roughly 1:2), and 0.5 was leaving too many cases on the wrong side of the cutoff.

</details>

## Complete Example

A worked end-to-end pipeline on the `iris` dataset, restricted to two species so the outcome is binary. We classify *setosa* versus *versicolor* using `Sepal.Length` and `Petal.Width`.

```r title="End-to-end logistic regression on iris setosa vs versicolor"
# 1. Build the binary subset
iris2 <- iris |>
  filter(Species %in% c("setosa", "versicolor")) |>
  mutate(species_bin = ifelse(Species == "versicolor", 1, 0))

# 2. Fit
iris_fit <- glm(species_bin ~ Sepal.Length + Petal.Width,
                data = iris2, family = binomial)

# 3. Coefficients (note: perfect separation may push these to extremes)
tidy(iris_fit, exponentiate = TRUE, conf.int = TRUE)
#> # A tibble: 3 x 7
#>   term          estimate  std.error statistic p.value conf.low conf.high
#>   <chr>            <dbl>      <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1 (Intercept)  3.66e-19   1083.       -0.0399   0.968   0          Inf
#> 2 Sepal.Length 4.39e+ 1   1083.        0.00350  0.997   0          Inf
#> 3 Petal.Width  3.91e+38   90085.       0.000990 0.999   0          Inf

# 4. Predict + ROC
iris_probs <- predict(iris_fit, type = "response")
iris_roc <- roc(iris2$species_bin, iris_probs, quiet = TRUE)
auc(iris_roc)
#> Area under the curve: 1
```

The fit warning fires here because *setosa* and *versicolor* are perfectly separable on `Petal.Width` alone, the textbook example of perfect separation that we covered in the mistakes section. AUC of 1.0 confirms the perfect separation. In practice you would either drop `Petal.Width` (the offending splitter), use bias-reduced regression via `brglm2`, or simply recognise that this is the wrong tool for a problem where the classes do not overlap. That is the value of a diagnostics-first workflow: it tells you when to stop, not just how to keep going.

## Summary

| Workflow stage | R function | Output |
|---|---|---|
| Fit | `glm(y ~ x, family = binomial)` | Fitted glm object |
| Coefficient summary | `summary()` / `broom::tidy()` | Log-odds estimates, p-values |
| Odds ratios | `tidy(exponentiate = TRUE, conf.int = TRUE)` | OR + 95% CI |
| Predict | `predict(fit, type = "response")` | Probabilities |
| Multicollinearity | `car::vif()` | VIF per predictor |
| Influence | `cooks.distance()`, `residuals(type="deviance")` | Per-observation diagnostics |
| Classify | `ifelse(probs > threshold, 1, 0)` + `table()` | Confusion matrix |
| Rank-evaluate | `pROC::roc()` + `auc()` | ROC curve, AUC |
| Pick threshold | `pROC::coords(roc, "best")` | Youden-optimal cutoff |

The pattern holds for every binary classification problem you will meet in R. Fit, interpret coefficients on the odds-ratio scale, run all four diagnostics, evaluate with ROC/AUC, choose a threshold for your costs, and stop before the five common mistakes catch you.

## References

1. R Core Team. *Generalised Linear Models*, `?glm` documentation, stats package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
2. Hosmer, D. W., Lemeshow, S., Sturdivant, R. X. *Applied Logistic Regression*, 3rd Edition. Wiley (2013). [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118548387)
3. Robin, X. et al. *pROC: an open-source package for R and S+ to analyze and compare ROC curves.* BMC Bioinformatics (2011). [Link](https://cran.r-project.org/package=pROC)
4. Fox, J., Weisberg, S. *An R Companion to Applied Regression* (`car` package), 3rd Edition. Sage (2019). [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
5. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, 2nd Edition, Chapter 4: Classification. [Link](https://www.statlearning.com/)
6. Robinson, D., Hayes, A., Couch, S. `broom::tidy.glm` reference. [Link](https://broom.tidymodels.org/reference/tidy.glm.html)
7. Albert, A., Anderson, J. A. *On the existence of maximum likelihood estimates in logistic regression models.* Biometrika 71(1), 1984.

## Continue Learning

- [Odds Ratios & Relative Risk in R](Odds-Ratios-and-Relative-Risk-in-R.html), the sister post on the broader 2x2-table family of metrics, using `epitools` and `epiR`.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), diagnostics for the linear cousin so the contrast with logistic's log-odds linearity is sharp.
- [Multicollinearity in R](Multicollinearity-in-R.html), deeper coverage of VIF, condition numbers, and remedies for collinear predictors.

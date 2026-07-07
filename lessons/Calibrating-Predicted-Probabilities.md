---
title: "Imbalanced Classification Lesson 5: Calibrating Predicted Probabilities"
catalog_blurb: "Make a predicted 0.7 actually mean a 70% chance."
description: "A model can rank well and still lie about its probabilities. Read a reliability diagram, then use Platt and isotonic calibration in R so a 0.7 really means 70%."
keywords: "probability calibration, reliability diagram, Platt scaling, isotonic regression, Brier score, expected calibration error, calibrated probabilities, R"
post_type: "LESSON"
curriculum_id: "6.80.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "5"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: "Why-AUC-Is-Not-Enough.html"
course_prev: "ROC-PR-Lift-and-Gains-Curves.html"
---

=== step === cover
::eyebrow Lesson 5 of 6
## Calibrating Predicted Probabilities

In Lesson 4 you read the curves that judge a model across every threshold. Every one of them quietly trusted the score itself: that a transaction the model rates 0.8 really is fraud about 80% of the time. This lesson checks that assumption, and repairs it when it fails.

Think of a weather forecaster. When she says "70% chance of rain," you want it to actually rain on roughly 70 of every 100 such days. A model that says "0.7 chance of fraud" deserves the same test. When it passes, we call it **calibrated**, and only then can a probability be read at face value.

By the end you will be able to:

- Explain what a calibrated probability is, and why a great AUC does not guarantee one
- Read a reliability diagram and tell an over-confident model from an under-confident one
- Put a single number on calibration with the Brier score and expected calibration error
- Repair a miscalibrated model in R with Platt scaling and isotonic regression, the leak-free way

**Prerequisites:** you can fit a classifier in R and know a train/test split ([Train, Validation, Test and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)), and you know a classifier outputs a probability score (Lesson 3). In Lesson 2 you oversampled the rare class to lift recall; this lesson cleans up the probabilities that trick left behind.

::widget calibration-curve {}

=== step === concept
::eyebrow What it means
## What a calibrated probability means

A calibrated probability is one you can take at face value. Formally, a model is calibrated when, among all the transactions it scores at some value \(p\), the fraction that turn out to be fraud is exactly \(p\):

\[ P(Y = 1 \mid \hat p = p) = p \qquad \text{for every } p. \]

Here \(\hat p\) is the model's predicted probability of fraud and \(Y\) is the true outcome (1 for fraud, 0 for legit). In words: gather every transaction the model rated 0.30; if the model is calibrated, about 30% of them really were fraud. That is exactly how you would grade the weather forecaster, and exactly the standard a risk score must meet before anyone acts on the number.

Calibration is a *different job* from ranking. Lesson 4's AUC only asked whether fraud tends to outscore legit; it never asked what the scores actually were. So a model can rank beautifully and still be badly miscalibrated. To watch that happen, we rebuild the fraud detector, oversampled exactly the way Lesson 2 did it.

```r
# The bank's fraud detector, rebuilt from scratch (each lesson is a fresh R session).
# Fraud is rare and spends a little differently. Build the three sets we will need.
set.seed(42)
make_txns <- function(n_legit, n_fraud) {
  legit <- data.frame(amount  = round(rlnorm(n_legit, 3.3, 0.8), 2),
                      foreign = rbinom(n_legit, 1, 0.04),
                      class   = 0)
  fraud <- data.frame(amount  = round(rlnorm(n_fraud, 3.9, 0.9), 2),
                      foreign = rbinom(n_fraud, 1, 0.30),
                      class   = 1)
  d <- rbind(legit, fraud)
  d[sample(nrow(d)), ]                       # shuffle the rows
}
train <- make_txns(1900, 100)   # 5% fraud - the model is fit on this
calib <- make_txns(950,  50)    # 5% fraud - HELD OUT, to learn the calibration fix later
test  <- make_txns(950,  50)    # 5% fraud - untouched, for the honest final check
table(train$class)
#> 
#>    0    1 
#> 1900  100
```

Now the miscalibration. In Lesson 2 you oversampled the rare fraud rows to lift recall, and I warned it distorts the probabilities. Here is that distortion in the open: balance the training rows 50/50, fit a plain logistic regression, and ask what it predicts.

```r
# Balance the TRAINING rows 50/50 by duplicating fraud (Lesson 2's oversampling), then fit.
set.seed(1)
min_i     <- which(train$class == 1)
extra     <- sample(min_i, sum(train$class == 0) - length(min_i), replace = TRUE)
train_bal <- train[c(seq_len(nrow(train)), extra), ]

fit    <- glm(class ~ amount + foreign, data = train_bal, family = binomial)
p_cal  <- predict(fit, calib, type = "response")   # scores on the held-out calibration set
p_test <- predict(fit, test,  type = "response")   # scores on the untouched test set

# The model trained as if fraud were common, so on average it "sees" it everywhere.
round(c(mean_predicted = mean(p_test), actual_fraud_rate = mean(test$class)), 3)
#> mean_predicted actual_fraud_rate 
#>          0.416             0.050
```

The model predicts fraud with an average probability of 0.42, on a set where only 5% of transactions really are fraud, more than eight times too high. That is *over-confidence*, and next we draw it.

=== step === widget
::eyebrow See the gap
## The reliability diagram

The tool for seeing calibration is the **reliability diagram**. Sort the predictions into bins (0.0 to 0.1, 0.1 to 0.2, and so on), and for each bin plot one point: the mean predicted probability across the horizontal axis, the fraction that were actually fraud up the vertical. Perfect calibration lands every point on the 45-degree diagonal, because there predicted equals observed.

Drag the slider on the widget below to tilt a model from under- to over-confident and watch the curve bow away from the diagonal. Below the diagonal lies over-confidence (the model claims more certainty than it earns); above it, under-confidence.

Now the real thing, on our fraud model. Bin its test-set predictions and plot observed against predicted.

```r
# Bin the predictions, then in each bin compare mean predicted probability with the
# fraction that were ACTUALLY fraud. A calibrated model sits on the diagonal.
reliability <- function(p, y, nbins = 10) {
  b <- cut(p, breaks = seq(0, 1, length.out = nbins + 1), include.lowest = TRUE)
  d <- data.frame(predicted = tapply(p, b, mean),
                  observed  = tapply(y, b, mean),
                  n         = as.integer(table(b)))
  d[!is.na(d$predicted), ]
}

rel_raw <- reliability(p_test, test$class)
plot(rel_raw$predicted, rel_raw$observed, type = "b", pch = 19,
     xlim = 0:1, ylim = 0:1,
     xlab = "mean predicted probability", ylab = "observed fraud rate",
     main = "Reliability: the raw, over-confident model")
abline(0, 1, lty = 2)              # the diagonal = perfect calibration
round(rel_raw, 3)
#>           predicted observed   n
#> (0.2,0.3]     0.299    0.000   1
#> (0.3,0.4]     0.347    0.015 657
#> (0.4,0.5]     0.438    0.054 204
#> (0.5,0.6]     0.538    0.106  47
#> (0.6,0.7]     0.652    0.150  20
#> (0.7,0.8]     0.738    0.083  12
#> (0.8,0.9]     0.854    0.256  43
#> (0.9,1]       0.937    0.562  16
```

Every point sits well below the diagonal. A transaction the model rates around 0.65 is truly fraud only about 15% of the time, and even its most confident scores, above 0.9, are right only 56% of the time. The model is confidently wrong about its own confidence.

::widget calibration-curve {}

=== step === quiz
::eyebrow Check yourself
## Read the diagram

A model's reliability curve sits **above** the diagonal for every bin: in the group it rated around 0.3, about 55% turned out to be fraud. What is this model doing?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It is over-confident: it claims more certainty than the outcomes justify ::no Above the diagonal is the opposite case. There, events happen MORE often than predicted, so the model is too cautious, not too bold.
- It is under-confident: the real fraud rate is higher than its cautious scores suggest ::ok Right. Above the diagonal means events happen MORE often than predicted, so the model is hedging. It should push its probabilities up.
- It is perfectly calibrated: a curve is a curve ::no Only the 45-degree diagonal is calibrated. A curve above or below it is a systematic gap between predicted and observed.

=== step === concept
::eyebrow Score it
## Put a number on it: Brier and ECE

A picture is convincing, but you also want a single number to compare models and to track a fix. Two are standard.

The **Brier score** is just the mean squared error of the probabilities against the 0/1 outcome:

\[ \text{BS} = \frac{1}{n}\sum_{i=1}^{n} (\hat p_i - y_i)^2 . \]

Lower is better; a perfect model that says 1.0 for every fraud and 0.0 for every legit scores 0. It rewards being both right *and* honest about certainty.

The **expected calibration error (ECE)** targets calibration directly. Reuse the reliability bins, take the gap between mean predicted and observed frequency in each bin, and average those gaps weighted by how many points fall in each bin:

\[ \text{ECE} = \sum_{b=1}^{B} \frac{n_b}{n}\,\bigl|\, \text{obs}_b - \text{pred}_b \,\bigr| , \]

where \(n_b\) is the count in bin \(b\) and \(\text{obs}_b, \text{pred}_b\) are its observed and mean-predicted values. An ECE of 0 means every bin lands on the diagonal.

```r
brier <- function(p, y) mean((p - y)^2)          # mean squared gap; lower is better

# ECE: average bin gap between predicted and observed, weighted by bin size.
ece <- function(p, y, nbins = 10) {
  b <- cut(p, breaks = seq(0, 1, length.out = nbins + 1), include.lowest = TRUE)
  total <- 0
  for (lvl in levels(b)) {
    ix <- which(b == lvl)
    if (length(ix) == 0) next
    total <- total + length(ix) * abs(mean(p[ix]) - mean(y[ix]))
  }
  total / length(p)
}

round(c(brier = brier(p_test, test$class), ece = ece(p_test, test$class)), 3)
#> brier   ece 
#> 0.180 0.366
```

Hold on to those two numbers. A calibrated model should drive both down without touching how the model ranks transactions.

=== step === concept
::eyebrow Fix one: a sigmoid
## Platt scaling

The first repair is **Platt scaling**: learn a small S-shaped curve that squashes the model's scores back toward the truth. Concretely, fit a one-variable logistic regression whose input is the model's score (its log-odds) and whose output is the calibrated probability:

\[ p_{\text{cal}} = \sigma(a\,s + b), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}, \]

where \(s\) is the model's raw score, \(\sigma\) is the logistic (sigmoid) function, and \(a\) and \(b\) are the two numbers the calibration fit learns. The intercept \(b\) can shift every prediction down at once, which is exactly what an over-confident, base-rate-inflated model needs.

The one rule that matters: fit \(a\) and \(b\) on the **held-out calibration set**, never on the rows the model trained on (the next step shows why).

```r
logit <- function(p) qlogis(pmin(pmax(p, 1e-6), 1 - 1e-6))   # log-odds, clamped off 0 and 1
z_cal  <- logit(p_cal)
z_test <- logit(p_test)

platt   <- glm(calib$class ~ z_cal, family = binomial)       # fit on the CALIBRATION set
p_platt <- predict(platt, data.frame(z_cal = z_test), type = "response")   # apply to test

round(c(brier_raw = brier(p_test, test$class),
        brier_platt = brier(p_platt, test$class),
        ece_raw = ece(p_test, test$class),
        ece_platt = ece(p_platt, test$class)), 3)
#> brier_raw brier_platt   ece_raw ece_platt 
#>     0.180       0.042     0.366     0.014
```

One sigmoid, fit from two numbers, collapses both scores: the Brier score more than halves and the calibration error nearly vanishes. The predictions now sit near the true 5% base rate instead of the inflated 0.42 they started at.

=== step === concept
::eyebrow Fix two: any monotonic shape
## Isotonic regression

Platt assumes the fix is an S-curve. **Isotonic regression** assumes less: it learns *any* non-decreasing map from score to probability, so it can bend into shapes a sigmoid cannot. Formally it finds the function \(g\) that minimises squared error subject to never going downhill:

\[ \min_{g \text{ non-decreasing}} \sum_{i=1}^{n} \bigl(g(\hat p_i) - y_i\bigr)^2 . \]

The classic solver is *pool adjacent violators*: walk the scores in order, and wherever the running average would dip, merge those points into one flat step. The result is a staircase you read new scores through.

```r
ord     <- order(p_cal)                                      # sort scores ascending
iso_fit <- isoreg(p_cal[ord], calib$class[ord])              # non-decreasing fit on calibration
keep    <- !duplicated(p_cal[ord])                           # unique breakpoints for the step map
iso_map <- approxfun(p_cal[ord][keep], iso_fit$yf[keep],
                     method = "constant", rule = 2)          # a reusable step function
p_iso   <- iso_map(p_test)                                   # read the test scores through it

round(c(raw = brier(p_test, test$class),
        platt = brier(p_platt, test$class),
        isotonic = brier(p_iso, test$class)), 3)
#> raw platt isotonic 
#> 0.180 0.042    0.041
```

Both fixes work; here they nearly tie. Notice what neither one touched.

[KEY INSIGHT]
Platt (a rising sigmoid) and isotonic (a non-decreasing staircase) are both **monotonic**: they never swap the order of two scores, only relabel their values. So calibration cannot change how the model ranks transactions, which means the ROC curve and AUC from Lesson 4 are exactly the same before and after. Calibration fixes *what the number means*, not *who outscores whom*.

[WARNING]
Isotonic is more flexible, so it overfits on small calibration sets, its staircase memorises noise. As a rule of thumb, prefer Platt when the calibration set is small (a few hundred points or fewer) and isotonic when it is large. And no calibrator can rescue a model that ranks badly: calibration adjusts probabilities, it does not add skill.

=== step === tryit
::eyebrow Your turn
## Score the calibrated model

You have three sets of test-set predictions in memory: `p_test` (raw), `p_platt` (Platt), and `p_iso` (isotonic). Calibration must be judged on the untouched test set. Fill the blank so the second line scores the **Platt-calibrated** predictions, then compare.

```r
brier_raw   <- mean((p_test - test$class)^2)
brier_platt <- mean((____ - test$class)^2)   # score the CALIBRATED predictions
round(c(raw = brier_raw, platt = brier_platt), 3)
```
::check {"regex":"p_platt","gate":true,"difficulty":"beginner","ok":"That is the calibrated vector. Its Brier score drops far below the raw one, on data neither the model nor the calibrator ever saw.","no":"You want the Platt-calibrated predictions: the object is p_platt. Drop it into the blank."}
::solution
```r
brier_raw   <- mean((p_test - test$class)^2)
brier_platt <- mean((p_platt - test$class)^2)
round(c(raw = brier_raw, platt = brier_platt), 3)
#> raw platt 
#> 0.180 0.042
```

=== step === concept
::eyebrow The one pitfall
## Fit the calibrator on held-out data

Here is the mistake that quietly fakes a perfect result: calibrate on the same rows the model trained on. The model already fits those rows too well, so its scores there look almost right, and a calibrator fit on them will report a near-diagonal reliability curve. Then it collapses on live data, precisely the leakage pattern Lesson 2 warned about with resampling.

The discipline is a three-way split: train the model, fit the calibrator on a separate held-out slice, and report calibration on a test set neither has seen. That is why every fit above used `calib` to learn the map and `test` to judge it.

In a full tidymodels workflow you would not hand-roll this. The **probably** package fits Platt and isotonic calibration inside resampling, so the held-out discipline is automatic. Run this one in a local R session:

```r-static
library(probably)   # tidymodels calibration; install from CRAN in a local session
# `preds` holds a truth column plus a .pred_fraud probability column.
cal <- cal_estimate_logistic(preds, truth = class, estimate = .pred_fraud)   # Platt
preds_cal <- cal_apply(preds, cal)
# cal_estimate_isotonic(...) swaps in the isotonic fit; cal_plot_reliability(...) draws the curve.
```

::widget process-flow {"steps":[{"title":"Split three ways","sub":"a training set, a held-out calibration set, and an untouched test set"},{"title":"Fit the model on train","sub":"this is the model whose probabilities need repairing"},{"title":"Fit the calibrator on the calibration set","sub":"learn the score-to-probability map on rows the model never trained on"},{"title":"Evaluate on the test set","sub":"measure calibration on rows neither the model nor the calibrator has seen"}]}

=== step === quiz
::eyebrow Check yourself
## The tempting shortcut

A teammate fits isotonic regression on the very rows the model was trained on. The reliability diagram now sits almost perfectly on the diagonal, and the AUC is unchanged. What actually happened?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model is calibrated and ready to ship ::no The near-perfect diagonal is an illusion of in-sample fitting. On the training rows the model is already over-fit, so its calibration curve there flatters itself and then drifts on live data.
- Calibration leaked: fit on training rows, it looks perfect there and will drift live; and AUC is unchanged because a monotonic map never reorders scores ::ok Exactly. In-sample calibration flatters itself, and calibration never changes ranking, so the flat AUC is expected, not a bug.
- Something is broken: calibrating should have raised the AUC too ::no Calibration is monotonic by design, so it leaves the ranking, and therefore the ROC curve and AUC, untouched. An unchanged AUC is correct, not a fault.

=== step === concept
::eyebrow Go deeper
## References

- [Platt (1999), Probabilistic Outputs for Support Vector Machines](https://www.microsoft.com/en-us/research/publication/probabilistic-outputs-for-support-vector-machines-and-comparisons-to-regularized-likelihood-methods/) - the original sigmoid-calibration method that bears his name.
- [Niculescu-Mizil and Caruana (2005), Predicting Good Probabilities With Supervised Learning, ICML](https://doi.org/10.1145/1102351.1102430) - the empirical study of which models are miscalibrated and when Platt beats isotonic.
- [Guo et al. (2017), On Calibration of Modern Neural Networks](https://arxiv.org/abs/1706.04599) - reliability diagrams, ECE, and why high-accuracy models are often over-confident.
- [scikit-learn User Guide: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) - a clear, visual walkthrough of reliability curves and sigmoid vs isotonic.
- [probably (tidymodels) calibration reference](https://probably.tidymodels.org/) - the R package that fits Platt and isotonic calibration leak-free inside resampling.

=== step === complete
## Lesson 5 complete

You now know what a probability is supposed to mean, and how to make a model's probabilities mean it:

- **Calibrated** = among the cases scored \(p\), a fraction \(p\) are positive. Ranking (AUC) is a different job.
- The **reliability diagram** shows the gap; the **Brier score** and **ECE** put a number on it.
- **Platt** (a sigmoid) and **isotonic** (a monotonic staircase) repair it, fit on a **held-out** calibration set, and both leave the ranking untouched.

You have now met accuracy, recall and precision, the ROC and PR curves, thresholds, and calibration. Each exposes something a single headline number would hide.

Next, Lesson 6: Why AUC Is Not Enough. It pulls the whole course together, showing how one AUC score can look excellent while hiding poor calibration, a bad operating threshold, and a cost the model never accounted for.

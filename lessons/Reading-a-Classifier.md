---
title: "Classification Lesson 6: Reading a Classifier"
catalog_blurb: "Why accuracy alone misleads, and the metrics that show if a classifier works."
description: "Read a classifier honestly: the confusion matrix, accuracy versus precision and recall, the F1 score, ROC and PR curves, and why accuracy alone can fool you."
keywords: "confusion matrix, precision, recall, F1 score, ROC curve, AUC, precision-recall curve, classification metrics, class imbalance, sensitivity, specificity, R"
post_type: "LESSON"
curriculum_id: "6.30.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: ""
course_prev: "Decision-Boundaries-and-Model-Geometry.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Reading a Classifier

Dana feels fine. But the clinic's new screening model just flagged her: her blood panel scored 0.62, and anything at or above 0.50 gets called "at risk". Should the clinic worry? And the deeper question: how would you even know whether this model is any good?

You have spent five lessons building classifiers. This last one teaches you to judge one. A classifier can be right, and wrong, in more than one way at once, and a single accuracy number hides almost all of it. By the end you will be able to:

- Build and read a **confusion matrix**: the four ways a yes/no prediction can land
- Compute and define **accuracy, precision, recall, and F1**, and say which one your problem needs
- See why **accuracy alone misleads** when one class is rare, the trap that fools beginners
- Move the **threshold** to trade precision against recall, and read an **ROC** and a **precision-recall** curve

**Prerequisites:** you can run R and read its output; you have met classifiers that output a score or probability (logistic regression, plus kNN, LDA/QDA and trees from Lessons 1 to 5); and you know a training set from a test set.

::widget roc-curve {}

=== step === concept
::eyebrow From a score to a decision
## The confusion matrix

In Lesson 5 you saw that every classifier draws a boundary. Up close, that boundary is just a number: the model gives each patient a **risk score** between 0 and 1, and a **threshold** \(t\) turns the score into a verdict. Predict "at risk" when \(\hat p \ge t\), "cleared" otherwise. The clinic uses \(t = 0.50\), which is why Dana's 0.62 got her flagged.

Once you fix a threshold, every prediction lands in one of exactly four boxes, depending on what the patient actually was:

- **True positive (TP):** sick, and flagged. A catch.
- **False positive (FP):** healthy, but flagged. A false alarm.
- **False negative (FN):** sick, but cleared. A dangerous miss.
- **True negative (TN):** healthy, and cleared. Correct all-clear.

Lay those four counts in a grid and you have the **confusion matrix**, the source every other number comes from. Here is last month's screening: 200 people, of whom 20 truly had the disease.

```r
# Last month the clinic screened 200 people; 20 of them truly had the disease.
# Each person's verdict lands in one of the four outcomes:
actual <- factor(rep(c("disease", "healthy"), c(20, 180)),
                 levels = c("disease", "healthy"))
pred   <- factor(c(rep("at risk", 16), rep("cleared", 4),    # the 20 WITH disease: 16 caught, 4 missed
                   rep("at risk", 30), rep("cleared", 150)),  # the 180 healthy: 30 false alarms, 150 cleared
                 levels = c("at risk", "cleared"))
table(Prediction = pred, Actual = actual)
#>           Actual
#> Prediction disease healthy
#>    at risk      16      30
#>    cleared       4     150
```

Read it like a map: the diagonal (16 and 150) is where the model was right; the off-diagonal (30 false alarms, 4 missed cases) is where it was wrong, and the two kinds of wrong are not equally bad.

=== step === quiz
::eyebrow Check yourself
## Spot the dangerous error

In the matrix above, look at the 4 patients sitting in the "cleared" row under the "disease" column. What are they, and why do they matter most for a screening test?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- False negatives: sick people the model cleared. In screening, a missed case is the most dangerous error. ::ok Right. They had the disease but were sent home reassured. For a screening test, a false negative (a missed case) is usually the costliest mistake, which is why recall will matter so much here.
- False positives: healthy people the model wrongly flagged ::no Those are the 30 in the "at risk" row under "healthy". A false positive is a false alarm (annoying, more tests), not a missed case. The 4 you were asked about are sick people who were cleared.
- True negatives: healthy people correctly cleared ::no True negatives are the 150 correctly cleared healthy people. The 4 in question were actually sick but cleared, which is the opposite of correct.

=== step === concept
::eyebrow Four numbers from four boxes
## Accuracy, precision, recall, F1

The confusion matrix has four counts. The headline metrics are just ratios of them, each answering a different question. Let \(TP, FP, FN, TN\) be the four cell counts.

**Accuracy:** of all predictions, what fraction were correct?
\[ \text{accuracy} = \frac{TP + TN}{TP + FP + FN + TN} \]

**Precision:** of everyone the model **flagged**, what fraction were truly sick? (How much to trust an alarm.)
\[ \text{precision} = \frac{TP}{TP + FP} \]

**Recall** (also called sensitivity or the true-positive rate): of everyone who was **truly sick**, what fraction did the model catch?
\[ \text{recall} = \frac{TP}{TP + FN} \]

Precision and recall pull in opposite directions, so we often want one number that balances them. The **F1 score** is their harmonic mean, which stays low unless *both* are high:
\[ F_1 = 2 \cdot \frac{\text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}} \]

Read the four numbers straight off the clinic's matrix:

```r
TP <- 16; FP <- 30; FN <- 4; TN <- 150     # read straight off the confusion matrix

accuracy  <- (TP + TN) / (TP + FP + FN + TN)
precision <- TP / (TP + FP)                  # of those FLAGGED, how many were sick
recall    <- TP / (TP + FN)                  # of those SICK, how many we caught
f1        <- 2 * precision * recall / (precision + recall)

round(c(accuracy = accuracy, precision = precision, recall = recall, F1 = f1), 3)
#> accuracy precision    recall        F1
#>    0.830     0.348     0.800     0.485
```

So the model catches 80% of sick patients (good recall), but only about a third of its alarms are real (poor precision): most flagged people are healthy. One accuracy number, 0.83, told you none of that.

In a real project you would not compute these by hand. The tidymodels **yardstick** package reads a data frame of truth and estimate and returns them for you:

```r-static
library(yardstick)
# yardstick needs truth and prediction on the SAME labels
# ("at risk" = predicted disease, "cleared" = predicted healthy):
results <- data.frame(
  truth     = factor(rep(c("disease", "healthy"), c(20, 180))),
  predicted = factor(c(rep("disease", 16), rep("healthy", 4),
                       rep("disease", 30), rep("healthy", 150)),
                     levels = c("disease", "healthy"))
)
metric_set(accuracy, precision, recall, f_meas)(results, truth, predicted)
```

=== step === concept
::eyebrow The trap
## Why accuracy alone misleads

Here is the mistake that fools everyone once. Build a model that does nothing at all: it clears *every* patient, never flagging a single one. On last month's data it is wrong only about the 20 sick people it missed, so it is right on 180 of 200.

```r
# A do-nothing model that CLEARS everyone, never flagging a single patient:
lazy_correct <- (actual == "healthy")   # a blanket "cleared" call is right only for healthy people
mean(lazy_correct)                        # ...its accuracy
#> [1] 0.9
```

Ninety percent accuracy, and it never caught a single case of the disease. Its recall is 0 out of 20. The number looks great precisely *because* the disease is rare: when one class dominates, you can score high accuracy by always guessing the majority. This is the **accuracy paradox**.

[KEY INSIGHT]
When classes are imbalanced, accuracy is dominated by the majority class and can hide total failure on the minority class, which is usually the class you care about (the sick patient, the fraud, the rare defect). Lead with precision and recall, not accuracy.

=== step === tryit
::eyebrow Your turn
## Compute recall

A second clinic ran its own screening. Of its truly sick patients, it caught 45 and missed 5 (so TP = 45, FN = 5). Fill in the formula for recall, then check it.

```r
TP <- 45; FN <- 5
recall <- ____
recall
```
::check {"regex":"TP\\s*/\\s*\\(\\s*TP\\s*\\+\\s*FN\\s*\\)","gate":true,"difficulty":"beginner","ok":"Recall = TP / (TP + FN) = 45 / 50 = 0.9. The clinic caught 90% of its sick patients.","no":"Recall is caught-over-truly-sick: TP / (TP + FN). Type it as TP / (TP + FN)."}
::solution
```r
TP <- 45; FN <- 5
recall <- TP / (TP + FN)   # 45 / 50 = 0.9
recall
```

=== step === widget
::eyebrow The dial you control
## The threshold, the ROC curve, and AUC

Nothing forced the threshold to be 0.50. Lower it and the model flags more people: it catches more true cases (recall rises) but raises more false alarms (precision falls). Raise it and the reverse happens. Every threshold is a different operating point, a different confusion matrix.

The **ROC curve** plots that whole trade in one picture: true-positive rate (recall) on the y-axis against false-positive rate on the x-axis, sweeping the threshold from high to low. The **false-positive rate** is \(FP/(FP+TN)\): of all the healthy people, the fraction the model wrongly flagged. A model that ranks sick above healthy hugs the top-left corner; random guessing rides the diagonal. The single number **AUC** (area under the curve) is the chance the model scores a random sick patient above a random healthy one: 1.0 is perfect, 0.5 is a coin flip.

Drag the threshold below and watch the confusion matrix recount while the operating point slides along the curve.

::widget roc-curve {}

=== step === concept
::eyebrow When positives are rare
## The precision-recall curve

ROC has a blind spot: when the negative class is huge, even a big pile of false positives barely moves the false-positive rate, so the ROC curve can look flattering on a badly imbalanced problem. The **precision-recall (PR) curve** does not let that hide. It plots precision against recall across thresholds, and because precision has false positives in its denominator, it reacts sharply when alarms are mostly wrong.

The dashed line is the no-skill baseline: a model with no signal sits at precision equal to the prevalence, the fraction of people who are actually sick (here 0.10, since 20 of 200 have the disease). Run it on a 10%-prevalence version of the screen:

```r
set.seed(7)
score  <- c(rbeta(20, 6, 3), rbeta(180, 2, 8))   # 20 sick (scores skew high), 180 healthy (skew low)
actual <- rep(c(1, 0), c(20, 180))                # 1 = disease, 0 = healthy: 10% prevalence

thr <- seq(0, 1, by = 0.05)
pr  <- t(sapply(thr, function(t) {
  flag <- score >= t
  tp <- sum(flag & actual == 1); fp <- sum(flag & actual == 0); fn <- sum(!flag & actual == 1)
  c(recall = tp / (tp + fn), precision = if (tp + fp > 0) tp / (tp + fp) else 1)
}))

plot(pr[, "recall"], pr[, "precision"], type = "b", lwd = 2,
     xlim = c(0, 1), ylim = c(0, 1), xlab = "recall", ylab = "precision",
     main = "Precision-recall curve (10% prevalence)")
abline(h = mean(actual == 1), lty = 2)           # no-skill baseline = prevalence
```

A good classifier stays high and to the right (high precision even at high recall). Watch precision sag as you push recall toward 1: catching the last few sick patients costs a flood of false alarms. For a rare-positive problem (disease, fraud, defects), trust the PR curve over the ROC curve.

=== step === quiz
::eyebrow Check yourself
## Read past the headline number

A hospital reports a model that detects a disease present in **2% of patients**, with **98% accuracy**. You dig in and find its **recall is 0.05**. What is actually going on, and what should you do?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model is excellent: 98% accuracy is hard to beat, ship it ::no That 98% is the accuracy paradox. A model that simply calls everyone healthy already scores 98% here, and catches nobody. Accuracy is meaningless when one class is 2%.
- Accuracy is inflated by the 98% healthy majority; the model misses 95% of sick patients. Optimize recall, lower the threshold, and judge it with a precision-recall curve. ::ok Exactly. With recall 0.05 it catches almost no real cases; the high accuracy just reflects the rare positive class. Lead with recall and PR, and move the threshold to catch more cases (accepting more false alarms).
- Nothing is wrong: recall is always a bit lower than accuracy ::no There is no rule that recall tracks accuracy. Here recall (0.05) and accuracy (0.98) disagree wildly precisely because the classes are imbalanced, which is the whole warning sign.

=== step === concept
::eyebrow Go deeper
## References

- [Fawcett (2006), An introduction to ROC analysis, Pattern Recognition Letters](https://doi.org/10.1016/j.patrec.2005.10.010) - the canonical, readable explanation of ROC space, the curve, and AUC.
- [Saito & Rehmsmeier (2015), The precision-recall plot is more informative than the ROC plot on imbalanced datasets, PLOS ONE](https://doi.org/10.1371/journal.pone.0118432) - the evidence behind preferring PR over ROC when positives are rare.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - classification, the confusion matrix, sensitivity and specificity, gently.
- [yardstick: tidymodels metrics](https://yardstick.tidymodels.org/) - the R package that computes every metric here on real model output.

=== step === complete
## Course complete

You can now read a classifier honestly. A confusion matrix splits predictions into true and false positives and negatives; accuracy, precision, recall and F1 each answer a different question off those four counts; accuracy alone lies when one class is rare; and the threshold, the ROC curve and the precision-recall curve let you tune and compare the trade between catching cases and raising false alarms.

That closes the Classification course: kNN and the curse of dimensionality, Naive Bayes, discriminant analysis, decision trees, model geometry, and now evaluation. You have a full toolkit for turning a labeled dataset into a trustworthy classifier and proving it is trustworthy.

Classification is a graded module in the Data Scientist track. Pass the assessment and it goes on your verified certificate, with a portfolio build to match.

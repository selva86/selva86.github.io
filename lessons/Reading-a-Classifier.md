---
title: "Classification Lesson 6: Reading a Classifier"
catalog_blurb: "How to grade a classifier honestly when accuracy alone can mislead."
description: "Read a classifier's scorecard in R: the confusion matrix, accuracy, precision, recall, F1, the ROC and precision-recall curves, and why accuracy alone can badly mislead."
keywords: "confusion matrix, precision, recall, F1 score, ROC curve, AUC, precision-recall curve, accuracy paradox, sensitivity, specificity, classification metrics, R"
post_type: "LESSON"
curriculum_id: "6.30.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Classification-Quiz.html"
course_prev: "Decision-Boundaries-and-Model-Geometry.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Reading a Classifier

In Lesson 5 you learned to *see* a classifier as the boundary it draws. But a boundary that looks tidy is not the same as a boundary that works, and to tell them apart you need numbers. This lesson is the scorecard: how to grade a trained classifier honestly, and why the most obvious number, accuracy, can hide a nearly useless model.

Meet our running example. The **Riverbend Clinic** runs a quick blood-marker model to screen walk-in patients for a thyroid condition that only about **1 patient in 8** actually has. When Dana walks in, the model reads her marker and returns a single number: a **risk score of 0.61**. Is that a "yes"? Only once we pick a cutoff. And once the clinic starts flagging patients, every prediction lands in one of four buckets, and those four numbers decide whether the screen is trustworthy or dangerous.

By the end of this lesson you will be able to:

- Read a **confusion matrix** and name which of its four cells hurts most in a given problem
- Compute and interpret **accuracy, precision, recall, specificity and F1**, and explain the **accuracy paradox**
- Explain how a **threshold** turns a score into a label, and how moving it trades precision against recall
- Read an **ROC curve** and its **AUC**, and a **precision-recall curve**, and know when each tells the honest story
- Choose a threshold from the real **cost** of a false alarm versus a missed case

**Prerequisites:** you can run R and read its output, and you have met logistic regression giving a probability \(P(\text{class} \mid x)\) and the idea of a decision boundary (Lesson 5).

::widget roc-curve {}

The panel above is the whole scorecard in miniature: a confusion matrix, an ROC curve and one AUC number, all reacting to a single threshold dial (on illustrative scores for now). By the end of this lesson every part of it will make sense. Slide it if you like; then let us build it up from scratch.

=== step === concept
::eyebrow The key shift
## A classifier hands you a score, not a verdict

Here is the idea that everything else hangs on. A trained classifier like the Riverbend model does not really output "sick" or "healthy". It outputs a **score**: a number, usually a probability between 0 and 1, saying how confident it is. Dana's score was 0.61. To turn that score into an actual decision, *you* must pick a **threshold** \(t\) and apply a simple rule:

\[ \text{predict positive} \quad\text{when}\quad \hat{p}(x) \ge t \]

Here \(\hat{p}(x)\) is the model's estimated probability that patient \(x\) is sick, and \(t\) is the cutoff you choose. The default is \(t = 0.5\): flag anyone the model thinks is more likely sick than not. With that cutoff Dana (0.61) is flagged; a patient scoring 0.30 is cleared.

The crucial part: **the threshold is a knob, not a fact.** The model's scores are fixed once it is trained, but you can slide the cutoff anywhere from 0 to 1, and every choice produces a different set of predictions, and therefore a different scorecard. The widget below shows exactly that. Each dot is a patient positioned by score; slide the vertical cutoff and watch dots cross from one predicted label to the other.

::widget logistic-curve {}

Move the cutoff left and you flag more patients: you catch more of the truly sick, but you also raise more false alarms. Move it right and the opposite happens. That single trade is the engine of this entire lesson. First, though, we need to count the outcomes.

=== step === concept
::eyebrow The running data
## The patients we will grade on

Every lesson starts a fresh R session, so we build the Riverbend screen right here. We simulate 500 screened patients. Each truly has the condition or not (the condition is uncommon: its **prevalence**, the fraction of all screened patients who truly have it, is about 12%), and each has a blood **marker** that runs higher in sick patients but overlaps heavily with the healthy ones, so no single marker value is a perfect giveaway.

```r
set.seed(2024)
n <- 500

# 1 = truly has the condition, 0 = healthy. The condition is uncommon.
disease <- rbinom(n, 1, 0.12)
# The marker skews higher for sick patients, but the two clouds OVERLAP.
marker  <- rnorm(n, mean = 45 + 15 * disease, sd = 11)
clinic  <- data.frame(disease = disease, marker = round(marker, 1))

table(disease = clinic$disease)
#> disease
#>   0   1
#> 438  62
```

Of the 500 patients, **62 truly have the condition** and **438 are healthy**. That imbalance is not a nuisance to clean up; it is the whole point, and it is what will make accuracy lie to us later.

Now we fit a real classifier, a logistic regression, and read off each patient's risk score. This is the model from Lesson 5, but this time we care about the *number* it produces, not the boundary it draws.

```r
fit <- glm(disease ~ marker, data = clinic, family = binomial)   # a real classifier
clinic$score <- predict(fit, type = "response")                  # each patient's risk, 0 to 1

round(head(clinic$score), 3)
#> [1] 0.375 0.072 0.193 0.041 0.081 0.008
```

Six patients, six risk scores. And Dana, whose marker read 72?

```r
round(predict(fit, data.frame(marker = 72), type = "response"), 2)
#>    1
#> 0.61
```

There is her 0.61. The model has an opinion about every patient; now we decide what to do with those opinions.

=== step === concept
::eyebrow The four outcomes
## The confusion matrix

Apply the default cutoff of 0.5 and every patient falls into exactly one of four cells, depending on what the model **predicted** and what was **actually** true. That 2x2 table is the **confusion matrix**, and it is the raw material for every metric in this lesson.

The four cells have names worth saying slowly, in the clinic's own terms:

- **True positive (TP):** flagged, and truly sick. A catch.
- **False positive (FP):** flagged, but actually healthy. A false alarm (one wasted confirmatory test).
- **False negative (FN):** cleared, but actually sick. A missed case (a sick patient sent home).
- **True negative (TN):** cleared, and truly healthy. A correct all-clear.

Let us build it for the Riverbend screen:

```r
clinic$pred <- ifelse(clinic$score >= 0.5, 1, 0)     # default cutoff: flag if risk >= 50%
table(predicted = clinic$pred, actual = clinic$disease)
#>          actual
#> predicted   0   1
#>         0 432  50
#>         1   6  12
```

Read the cells against the definitions above: **12** true positives (sick and flagged), **6** false positives (healthy but flagged), **50** false negatives (sick but cleared), **432** true negatives (healthy and cleared). Sit with that 50 for a moment. The widget below is the same four-cell picture with a live threshold dial, so you can watch the counts move; then we turn these four numbers into metrics.

::widget roc-curve {}

=== step === quiz
::eyebrow Check yourself
## The cell that should worry the clinic

Of the four cells in the Riverbend matrix, one holds **50 patients** and is the clinic's nightmare. Which cell is it, and what does it mean?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The 6 false positives: healthy patients who were wrongly flagged ::no Those are false alarms, a real cost (a wasted confirmatory test) but not the dangerous one here, and there are only 6 of them. The 50 sit in a different cell.
- The 50 false negatives: truly sick patients the screen cleared and sent home ::ok Right. A false negative is a sick patient told they are fine, so their treatment is delayed. In a screening test this is usually the costliest error, and the screen is making it 50 times.
- The 432 true negatives: healthy patients correctly cleared ::no Those are correct calls (healthy and cleared), exactly what you want the screen to do. The dangerous cell is the one full of missed sick patients.

=== step === concept
::eyebrow The number that lies
## Accuracy, and why it can fool you

The most tempting single number is **accuracy**: the fraction of all predictions the model got right.

\[ \text{accuracy} = \frac{TP + TN}{TP + TN + FP + FN} \]

Every symbol is a count from the confusion matrix: the numerator is the two "correct" cells (true positives plus true negatives), the denominator is all 500 patients. Compute it for Riverbend:

```r
accuracy <- mean(clinic$pred == clinic$disease)
round(accuracy, 3)
#> [1] 0.888
```

**88.8%.** That sounds like a strong screen. But now watch what a lazy model does, one that ignores the marker entirely and simply **clears every patient**:

```r
# The "flag no one" model: predict healthy for everybody.
flag_no_one <- mean(0 == clinic$disease)
round(flag_no_one, 3)
#> [1] 0.876
```

A model that does *nothing*, that never catches a single sick patient, already scores **87.6%**, just because 88% of patients are healthy and it is right about all of them. Our real model's 88.8% barely clears that do-nothing bar, yet we know from the matrix it missed 50 of the 62 sick patients. This is the **accuracy paradox**: when one class dominates, accuracy is dragged toward the majority and can look excellent while the model fails at the job that matters.

[KEY INSIGHT]
Accuracy answers "what fraction did we get right?" On an imbalanced problem that is the wrong question, because you can score high by always guessing the common class. Always compare accuracy against the "predict the majority" baseline (here 87.6%) before trusting it.

=== step === quiz
::eyebrow Check yourself
## The 88% brag

A rival clinic advertises that its screen is "88% accurate." You know the condition affects only about 12% of patients. Why is that 88% almost meaningless on its own?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because a useful screen must always score above 95% ::no There is no universal accuracy cutoff; what counts as good depends entirely on the problem and its base rate. The issue is not the number 88, it is what 88 is being measured against.
- Because a model that simply clears every patient already scores about 88% (it is right on the 88% who are healthy), so beating that bar means almost nothing ::ok Exactly. With 12% prevalence a do-nothing model scores ~88% yet catches zero sick patients. The accuracy figure tells you almost nothing about whether the screen actually works; you need precision and recall to find out.
- Because accuracy cannot be computed when the classes are imbalanced ::no Accuracy is perfectly well defined here; the problem is that it is misleading, not that it is uncomputable. The fix is to report metrics that focus on the rare, important class.

=== step === concept
::eyebrow Splitting the question
## Precision and recall

Accuracy blurs two very different questions into one. To grade a screen honestly we separate them, and both focus on the positive (sick) class.

**Recall** (also called **sensitivity** or the true positive rate) asks: *of everyone who is truly sick, what fraction did we catch?*

\[ \text{recall} = \frac{TP}{TP + FN} \]

The denominator \(TP + FN\) is every truly sick patient (caught plus missed), so recall is the catch rate.

**Precision** asks the opposite: *of everyone we flagged, what fraction were truly sick?*

\[ \text{precision} = \frac{TP}{TP + FP} \]

Here the denominator \(TP + FP\) is everyone we flagged (rightly or wrongly), so precision is how much to trust a positive flag. Compute both for Riverbend:

```r
TP <- sum(clinic$pred == 1 & clinic$disease == 1)    # flagged AND truly sick
FP <- sum(clinic$pred == 1 & clinic$disease == 0)    # flagged but healthy (false alarm)
FN <- sum(clinic$pred == 0 & clinic$disease == 1)    # cleared but truly sick (missed case)
TN <- sum(clinic$pred == 0 & clinic$disease == 0)    # cleared AND truly healthy

precision <- TP / (TP + FP)      # of everyone we flagged, how many were truly sick
recall    <- TP / (TP + FN)      # of everyone truly sick, how many did we catch
round(c(precision = precision, recall = recall), 3)
#> precision    recall
#>     0.667     0.194
```

Now the truth is out. Precision **0.67**: when the screen flags someone, it is right about two times in three, not bad. But recall **0.19**: the screen catches fewer than 1 in 5 of the truly sick patients. That is the number the 88.8% accuracy hid completely. For a disease screen, a recall of 0.19 is a failure, no matter how good the accuracy looked.

=== step === tryit
::eyebrow Your turn
## Compute recall by hand

A second clinic runs its own screen. Of the patients who truly had the condition, there were **45** in total, and the screen **caught 36** of them. Compute the recall (the catch rate) by filling in the blank.

```r
sick_total <- 45     # patients who truly have the condition
caught     <- 36     # of them, the number the screen flagged
recall <- ____
recall
```
::check {"regex":"caught\\s*/\\s*sick_total|36\\s*/\\s*45","gate":true,"difficulty":"beginner","ok":"Right: recall is caught / total sick = 36 / 45 = 0.80, so this second screen catches 80% of the truly sick. Far better than Riverbend's 0.19.","no":"Recall is (caught) divided by (total truly sick). Type caught / sick_total."}
::solution
```r
sick_total <- 45
caught     <- 36
recall <- caught / sick_total
recall
#> [1] 0.8
```

=== step === concept
::eyebrow One number, honestly
## F1: when you must report a single score

Sometimes you need one number, not two. The naive move is to average precision and recall, but a plain average lets a model hide a terrible score behind a great one (precision 1.0 and recall 0.0 would average to a respectable 0.5). The **F1 score** fixes that by using the **harmonic mean**, which is dragged down hard by the smaller of the two:

\[ F_1 = 2 \cdot \frac{\text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}} \]

The harmonic mean is close to the *smaller* input, so F1 is only high when precision **and** recall are both high. Compute it for Riverbend, where precision was 0.67 but recall only 0.19:

```r
f1 <- 2 * precision * recall / (precision + recall)
round(f1, 3)
#> [1] 0.3
```

**0.30.** The decent precision cannot rescue the dismal recall, and F1 says so, sitting far closer to 0.19 than to 0.67. That is exactly the honesty a single-number summary should have on an imbalanced problem.

[NOTE]
F1 weighs precision and recall equally. When one genuinely matters more (in screening, recall usually does), report them separately, or use a weighted \(F_\beta\) score that tilts toward the one you care about. One number is convenient, but two numbers tell the truth.

=== step === widget
::eyebrow The dial
## The threshold trades precision for recall

Nothing about the Riverbend model is broken; its 0.5 threshold is simply badly placed for this problem. Because the threshold is a knob, we can slide it and re-score. Before we do, one more pair of definitions we will need for the next step. **Specificity** is recall for the *negative* class, the fraction of healthy patients correctly cleared, and the **false positive rate** is its complement:

\[ \text{specificity} = \frac{TN}{TN + FP}, \qquad \text{FPR} = 1 - \text{specificity} = \frac{FP}{FP + TN} \]

Now sweep the threshold from strict (0.8) to lenient (0.2) and watch precision and recall move in opposite directions:

```r
metrics_at <- function(t) {
  pred <- as.integer(clinic$score >= t)
  tp <- sum(pred == 1 & clinic$disease == 1)
  fp <- sum(pred == 1 & clinic$disease == 0)
  fn <- sum(pred == 0 & clinic$disease == 1)
  c(threshold = t,
    precision = round(tp / (tp + fp), 2),
    recall    = round(tp / (tp + fn), 2))
}
t(sapply(c(0.2, 0.35, 0.5, 0.65, 0.8), metrics_at))
#>      threshold precision recall
#> [1,]      0.20      0.39   0.60
#> [2,]      0.35      0.52   0.34
#> [3,]      0.50      0.67   0.19
#> [4,]      0.65      0.70   0.11
#> [5,]      0.80      1.00   0.05
```

Read it as a see-saw. Lower the threshold to 0.20 and recall jumps to **0.60** (we catch far more sick patients) but precision drops to **0.39** (more of our flags are false alarms). Raise it to 0.80 and precision hits **1.00** (every flag is correct) but recall collapses to **0.05** (we catch almost no one). There is no free lunch: **every threshold buys recall with precision, or precision with recall.** The widget makes the trade tangible. Drag the threshold and watch the confusion matrix recount while the operating point slides along the curve.

::widget roc-curve {}

=== step === quiz
::eyebrow Check yourself
## Which way does it move?

Riverbend lowers its flag threshold from 0.50 to 0.20 to catch more sick patients. Reading the sweep table, what happens to precision and recall?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both precision and recall rise, so lowering the threshold is a free win ::no A lower threshold can never raise both; the trade is unavoidable. The table shows recall rising while precision falls.
- Recall rises (0.19 to 0.60, more sick patients caught) but precision falls (0.67 to 0.39, more flagged patients turn out healthy) ::ok Right. A lower threshold flags more patients, so it catches more true cases (recall up) at the price of more false alarms (precision down). That see-saw is the whole reason the threshold is a decision, not a default.
- Recall falls and precision rises, because a lower threshold is stricter ::no A lower threshold is more lenient, not stricter: it flags more people. That raises recall and lowers precision, the opposite of this option.

=== step === concept
::eyebrow Every threshold at once
## The ROC curve and AUC

Picking one threshold means picking one row of that sweep. The **ROC curve** shows *all* of them at once. It plots the true positive rate (recall) on the vertical axis against the false positive rate on the horizontal axis, tracing out the model's behaviour as the threshold slides from 1 down to 0:

\[ \text{TPR} = \frac{TP}{TP + FN}, \qquad \text{FPR} = \frac{FP}{FP + TN} \]

Each point on the curve is one threshold's (FPR, TPR) pair. A perfect model hugs the top-left corner (catch everyone, false-alarm no one); a useless coin-flip model rides the diagonal. Build it by hand for Riverbend, sweeping 101 thresholds:

```r
thr <- seq(0, 1, by = 0.01)
roc <- t(sapply(thr, function(t) {
  pred <- clinic$score >= t
  c(FPR = sum(pred & clinic$disease == 0) / sum(clinic$disease == 0),   # false positive rate
    TPR = sum(pred & clinic$disease == 1) / sum(clinic$disease == 1))   # true positive rate = recall
}))

plot(roc[, "FPR"], roc[, "TPR"], type = "l", lwd = 2,
     xlab = "false positive rate", ylab = "true positive rate (recall)",
     main = "ROC curve: the Riverbend screen at every threshold")
abline(0, 1, lty = 2)                       # the diagonal = a coin flip
```

To collapse the whole curve into one number, take the **area under it**, the **AUC**. AUC ranges from 0.5 (the diagonal, no better than chance) to 1.0 (perfect), and it has a beautifully concrete meaning: **the probability that a randomly chosen sick patient scores higher than a randomly chosen healthy one.** It measures how well the model *ranks*, with no threshold involved at all.

```r
o   <- order(roc[, "FPR"])
auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)
round(auc, 3)
#> [1] 0.821
```

**AUC 0.82.** Here is the twist that ties the lesson together: this is a *decent* ranker. Given one sick and one healthy patient, it scores the sick one higher 82% of the time. The model is not broken; its scores are informative. What was broken was the **default 0.5 threshold**, which sits in a bad spot for such an imbalanced problem.

[KEY INSIGHT]
AUC grades the model's *ranking*, independent of any threshold. A good AUC (0.82) with poor recall-at-0.5 is not a contradiction: it means the model ranks well but the cutoff is badly placed. The remedy is to move the threshold, not to throw away the model.

=== step === concept
::eyebrow When ROC flatters
## The precision-recall curve

ROC has a blind spot on rare positives. Its horizontal axis is the false positive rate, \(FP / (FP + TN)\), and when healthy patients vastly outnumber sick ones, that denominator is huge, so even hundreds of false alarms barely nudge the FPR. The ROC curve can look reassuring while the model floods the clinic with false positives.

The **precision-recall curve** does not have that blind spot, because precision, \(TP / (TP + FP)\), reacts directly to false alarms. It plots precision against recall across every threshold:

```r
pr <- t(sapply(thr, function(t) {
  pred <- clinic$score >= t
  tp <- sum(pred & clinic$disease == 1)
  fp <- sum(pred & clinic$disease == 0)
  fn <- sum(!pred & clinic$disease == 1)
  c(recall    = tp / (tp + fn),
    precision = ifelse(tp + fp == 0, 1, tp / (tp + fp)))
}))

plot(pr[, "recall"], pr[, "precision"], type = "l", lwd = 2, ylim = c(0, 1),
     xlab = "recall", ylab = "precision",
     main = "Precision-recall curve: Riverbend screen")
abline(h = mean(clinic$disease), lty = 2)   # a no-skill model sits at the prevalence, 0.124
```

The dashed line marks the **no-skill baseline**: a model with no ability at all sits at precision equal to the prevalence, here **0.124**. A useful model's PR curve arches above it. Because that baseline is so low on a rare-positive problem, the PR curve makes the difficulty honest in a way ROC does not: to push recall up, precision on this screen falls fast.

[NOTE]
Rule of thumb: on roughly balanced classes, ROC and AUC are fine. When the positive class is rare and the false alarms are what hurt (fraud, disease screening, rare-event detection), report the precision-recall curve too, and compare against the prevalence baseline, not against 0.5.

=== step === quiz
::eyebrow Check yourself
## Two true things at once

The Riverbend model has AUC **0.82** (a decent ranker), yet at the 0.50 threshold it catches only **12 of 62** sick patients. How can both be true?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The AUC must be miscalculated; a 0.82 AUC guarantees good recall ::no AUC and recall-at-a-threshold measure different things. A high AUC never promises that any particular cutoff, least of all the default 0.5, gives good recall.
- AUC measures how well the scores RANK sick patients above healthy ones across all thresholds; it says nothing about whether 0.50 is the right cutoff. The model ranks well, but its default threshold is badly placed for this imbalanced problem ::ok Exactly. AUC is threshold-free: it asks whether a random sick patient outscores a random healthy one, and here that happens 82% of the time. A well-ranking model can still have a poor default operating point, which you fix by moving the threshold.
- It cannot be true; good AUC and poor recall are contradictory ::no They are not contradictory. AUC summarizes ranking over every threshold; recall is pinned to one threshold. A model that ranks well can still be read at a badly chosen cutoff.

=== step === concept
::eyebrow The decision
## Choosing the threshold from costs

So which threshold *should* Riverbend use? There is no universal answer; it depends on what the two errors cost. In screening, a **missed case** (false negative) is far worse than a **false alarm** (false positive): a sick patient sent home may go untreated for months, while a false alarm costs one extra confirmatory test. Put rough numbers on it and let the data pick the threshold that minimizes total cost.

```r
cost_fn <- 20   # a missed case: a sick patient sent home, treatment delayed
cost_fp <- 1    # a false alarm: one extra confirmatory test

expected_cost <- function(t) {
  pred <- clinic$score >= t
  fp <- sum(pred & clinic$disease == 0)
  fn <- sum(!pred & clinic$disease == 1)
  cost_fp * fp + cost_fn * fn
}

costs <- sapply(thr, expected_cost)
c(best_threshold = thr[which.min(costs)],
  cost_there     = min(costs),
  cost_at_0.5    = expected_cost(0.5))
#> best_threshold     cost_there    cost_at_0.5
#>           0.04         308.00        1006.00
```

Because a miss costs 20 times a false alarm, the cost-minimizing threshold plunges to **0.04**, a third of the default. At that cutoff the screen catches **60 of the 62** sick patients (recall 0.97), at the price of flagging 328 patients in total (268 of them false alarms). Total cost **308**, versus **1006** at the default 0.50. For a first-pass screen whose job is to miss no one and send the flagged on for a cheap confirmatory test, that is exactly the right trade.

| Prefer a lower threshold (chase recall) when... | Prefer a higher threshold (chase precision) when... |
|---|---|
| A missed positive is far costlier than a false alarm | A false alarm is costly, disruptive, or scary |
| The flagged cases get a cheap second check | Each flag triggers an expensive or irreversible action |
| Screening: catch everyone, confirm later | Confirming: only act when you are confident |

[WARNING]
There is no "correct" threshold in the abstract. 0.5 is a default, not a law. The right cutoff comes from the relative cost of the two errors, so decide it deliberately, and report the metrics at the threshold you will actually use, not at 0.5.

=== step === tryit
::eyebrow Your turn
## Pick the cheaper threshold

Using Riverbend's costs (a missed case costs 20, a false alarm costs 1), compare two thresholds. From the sweep, threshold **0.50** gives **6** false alarms and **50** missed cases; threshold **0.20** gives **58** false alarms and **25** missed cases. The 0.50 cost is worked out for you; fill in the 0.20 cost, then see which is cheaper.

```r
cost_fn <- 20; cost_fp <- 1
# threshold 0.50 -> 6 false alarms, 50 missed cases
cost_050 <- cost_fp * 6 + cost_fn * 50
# threshold 0.20 -> 58 false alarms, 25 missed cases
cost_020 <- ____
c(cost_050 = cost_050, cost_020 = cost_020)
```
::check {"regex":"cost_fp\\s*\\*\\s*58\\s*\\+\\s*cost_fn\\s*\\*\\s*25|58\\s*\\+\\s*cost_fn\\s*\\*\\s*25|58\\s*\\+\\s*500","gate":true,"difficulty":"intermediate","ok":"Right: 1*58 + 20*25 = 558, cheaper than 1006 at the 0.50 cutoff. When misses cost far more than false alarms, the lower threshold wins.","no":"Weight each error by its cost: cost_fp * (false alarms) + cost_fn * (missed cases), so cost_fp * 58 + cost_fn * 25."}
::solution
```r
cost_fn <- 20; cost_fp <- 1
cost_050 <- cost_fp * 6  + cost_fn * 50
cost_020 <- cost_fp * 58 + cost_fn * 25
c(cost_050 = cost_050, cost_020 = cost_020)
#> cost_050 cost_020
#>     1006      558
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Fawcett (2006), "An introduction to ROC analysis", Pattern Recognition Letters](https://doi.org/10.1016/j.patrec.2005.10.010) - the standard, readable reference on ROC curves and AUC, with all the geometry.
- [Saito and Rehmsmeier (2015), "The Precision-Recall Plot Is More Informative than the ROC Plot on Imbalanced Datasets", PLOS ONE](https://doi.org/10.1371/journal.pone.0118432) - the paper behind this lesson's warning about ROC on rare positives.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - classification, the confusion matrix, sensitivity/specificity and ROC, with R labs.
- [Google Machine Learning Crash Course: Classification (ROC and AUC)](https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc) - a clear, visual walkthrough of thresholds, ROC and AUC.
- [yardstick reference (tidymodels)](https://yardstick.tidymodels.org/) - the R package that computes every metric here (accuracy, precision, recall, f_meas, roc_auc, pr_auc) for real projects.

=== step === complete
## Lesson 6 complete

You can now read a classifier's scorecard. You start from the truth that a classifier outputs a **score**, and a **threshold** you choose turns it into a label. You count the four outcomes in a **confusion matrix**, and you know that **accuracy** can lie on imbalanced data (the accuracy paradox), so you reach for **precision** (trust in a flag), **recall** (the catch rate), and **F1** (an honest single number). You read the whole threshold sweep as an **ROC curve** with its rank-quality summary **AUC**, you switch to a **precision-recall curve** when positives are rare, and you set the threshold deliberately from the **cost** of a false alarm versus a missed case. On the Riverbend screen you watched a model that looked 88.8% accurate turn out to catch only 12 of 62 sick patients at the default cutoff, then rescued it by moving the threshold to catch 60 of 62.

That completes the Classification course: you can build classifiers, see their boundaries, and now grade them honestly. Next, take the **section quiz** to lock it in. Beyond it, the track turns to the problems this lesson kept hinting at: **imbalanced classification** (how to train, not just evaluate, when positives are rare) and **calibrating probabilities** so a predicted 0.7 really means a 70% chance.

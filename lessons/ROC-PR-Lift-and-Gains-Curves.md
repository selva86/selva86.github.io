---
title: "Imbalanced Classification Lesson 4: ROC, PR, Lift and Gains Curves"
catalog_blurb: "Read ROC, PR, lift and gains curves and know which to trust."
description: "An ROC curve can look excellent while the model is wrong most of the time. Read ROC, precision-recall, lift and cumulative gains curves in R, and pick the right one."
keywords: "ROC curve, precision recall curve, lift curve, cumulative gains, AUC, imbalanced classification, model evaluation, R"
post_type: "LESSON"
curriculum_id: "6.80.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "4"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_prev: "Thresholds-Under-Asymmetric-Costs.html"
course_next: "Calibrating-Predicted-Probabilities.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## ROC, PR, Lift and Gains Curves

In Lesson 3 you slid one decision threshold to balance the cost of a missed fraud against the cost of a false alarm. But a single threshold is just one snapshot of a model. This lesson zooms out to four curves that judge a classifier across every threshold at once, and to the single most important lesson in this whole course: which curve you can trust when the thing you care about, fraud, is rare.

By the end you will be able to:

- Read an ROC curve and its AUC as a threshold-free score of a model
- See why a great-looking ROC can hide a bad model when positives are rare, and read a precision-recall curve instead
- Read lift and cumulative gains curves to decide how far down a ranked list to act

**Prerequisites:** you can run R, and you know a classifier outputs a probability score that a threshold turns into a yes/no decision (Lesson 3).

::widget roc-curve {}

=== step === concept
::eyebrow The setup
## One threshold is just one snapshot

Here is the running example for the whole lesson. Overnight, a bank's model scores 1,000 card transactions for fraud, giving each a probability between 0 and 1. Only 40 of those 1,000 are actually fraud. That 4% is what we mean by a **rare positive**: the class you care about is vastly outnumbered by the 960 ordinary, legitimate transactions.

Let us build that exact situation so every number below is real, not asserted. Fraud tends to score high, legitimate transactions tend to score low, and, as in real life, the two overlap.

```r
set.seed(1)
n_pos <- 40; n_neg <- 960                       # 40 frauds hidden among 960 legit = 4%
scores   <- c(rbeta(n_pos, 6, 4), rbeta(n_neg, 2, 6))  # fraud skews high, legit low, overlapping
is_fraud <- c(rep(1, n_pos), rep(0, n_neg))     # the ground truth: 1 = fraud, 0 = legit
prevalence <- mean(is_fraud)                    # the base rate of fraud

flagged <- scores >= 0.5                         # investigate everything scoring 0.5 or higher
TP <- sum(flagged & is_fraud == 1); FP <- sum(flagged & is_fraud == 0)
FN <- sum(!flagged & is_fraud == 1); TN <- sum(!flagged & is_fraud == 0)
c(TP = TP, FP = FP, FN = FN, TN = TN)
#>  TP  FP  FN  TN 
#>  28  59  12 901

round(c(precision = TP/(TP+FP), recall = TP/(TP+FN), FPR = FP/(FP+TN)), 3)
#> precision    recall       FPR 
#>     0.322     0.700     0.061
```

At a 0.5 cutoff the model raises 87 alerts (28 + 59). Three numbers describe what happened, written with true positives \(TP\), false positives \(FP\), false negatives \(FN\) and true negatives \(TN\):

- **Precision** \( = \dfrac{TP}{TP+FP} \): of everything you flagged, the fraction that was truly fraud. Here \(28/87 = 0.32\).
- **Recall**, also called the true positive rate, \( = \dfrac{TP}{TP+FN} \): of all the actual fraud, the fraction you caught. Here \(28/40 = 0.70\).
- **False positive rate** \( = \dfrac{FP}{FP+TN} \): of all the legitimate transactions, the fraction you falsely flagged. Here \(59/960 = 0.06\).

Move the cutoff and all three shift together. So "which cutoff is the model?" is the wrong question. The curves answer the right one.

=== step === widget
::eyebrow The whole sweep
## The ROC curve sweeps every threshold

Instead of committing to one cutoff, slide it from strict (only the very highest scores get flagged) all the way to lenient (almost everything gets flagged), and at each stop plot two numbers: recall (the true positive rate) up the vertical axis, and the false positive rate along the horizontal. Join the dots and you have the **ROC curve** (the name comes from wartime radar operators; the history does not matter here).

Drag the threshold below. The filled dot is your current operating point. Watch it climb the curve as you lower the cutoff: you catch more fraud (recall rises) but pay in false alarms (false positive rate rises). The dashed diagonal is a coin flip, a model with no skill. The harder the curve bulges toward the top-left corner, the better the model.

::widget roc-curve {}

One number summarizes the entire curve: the **AUC**, the area under it. It has a clean meaning: the probability that the model gives a randomly chosen fraud a higher score than a randomly chosen legitimate transaction. \( \text{AUC} = 0.5 \) is that coin flip; \( \text{AUC} = 1.0 \) is a perfect ranker. AUC is threshold-free, which is exactly its appeal, and, as the next steps show, exactly its blind spot. (The panel above uses a small, balanced set of scores so the mechanic is easy to watch; next we return to our 4%-fraud model.)

=== step === quiz
::eyebrow Check yourself
## What does an AUC of 0.95 tell you?

Our fraud model scores an AUC of 0.95. A colleague glances at it and says, "Great, so it is right 95% of the time." Are they correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, AUC 0.95 means about 95% of its predictions are correct ::no AUC is not accuracy. Accuracy depends on a chosen threshold and on the class balance; AUC depends on neither. A model can have AUC 0.95 and be wrong most times it fires.
- No, it means that given one random fraud and one random legit transaction, the model scores the fraud higher 95% of the time ::ok Exactly. AUC scores ranking, not correctness. A model can rank beautifully (AUC 0.95) and, as you are about to see, still be wrong on most of its fraud alerts.
- No, it means the model's precision is 0.95 ::no Precision is a threshold-dependent count of how many alerts were right. AUC is a threshold-free ranking measure. They are different questions and, on rare positives, they disagree sharply.

=== step === concept
::eyebrow The catch
## Why ROC can flatter a rare-positive model

An AUC of 0.95 looks like an A. So let us actually act on the model at the 0.5 cutoff and count what a fraud analyst would see in the morning.

```r
# Rank quality across ALL thresholds: sweep the cutoff, collect (FPR, TPR), take the area.
grid <- seq(0, 1, by = 0.01)
roc <- t(sapply(grid, function(t)
  c(FPR = sum(scores >= t & is_fraud == 0) / n_neg,
    TPR = sum(scores >= t & is_fraud == 1) / n_pos)))
o   <- order(roc[, "FPR"])
auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)
round(auc, 3)
#> [1] 0.948

# Now the analyst's-eye view at the 0.5 cutoff:
c(alerts = TP + FP, real_fraud = TP, false_alarms = FP, precision = round(TP/(TP+FP), 3))
#>       alerts   real_fraud false_alarms    precision 
#>       87.000       28.000       59.000        0.322
```

The ranking is genuinely strong (AUC 0.948). But look at the inbox: 87 alerts, only 28 real frauds, 59 false alarms. Precision is 0.32, so **two of every three fraud alerts are wrong**. How did a 0.95 model do that?

The culprit is the **base rate**, or prevalence: the fraction of all cases that are actually positive, \( \pi = 40/1000 = 0.04 \). The ROC curve's horizontal axis is the false positive rate, and a tiny-looking rate of 0.06 is applied to 960 legitimate transactions, which produces 59 false alarms, more than the 28 true frauds caught. ROC divides false positives by the enormous pool of negatives, so on rare positives it makes a flood of false alarms look like a trickle.

[KEY INSIGHT]
ROC and AUC ignore prevalence by construction. When positives are rare, a beautiful ROC curve can sit on top of a model whose alerts are mostly wrong. To see that, you have to put false positives next to true positives, not next to the sea of true negatives. That is exactly what precision does.

=== step === concept
::eyebrow The honest picture
## The precision-recall curve

The fix is to swap the axes for the two numbers that both concern the flags you actually raise: **recall** (of all the fraud, how much did I catch?) along the horizontal, and **precision** (of what I flagged, how much was real?) up the vertical. Sweep the threshold again, plot that pair at every stop, and you get the **precision-recall (PR) curve**.

```r
# Same sweep, but track recall and precision, the two numbers about the alerts you raise.
pr <- t(sapply(grid, function(t) {
  p  <- scores >= t
  tp <- sum(p & is_fraud == 1); fp <- sum(p & is_fraud == 0); fn <- sum(!p & is_fraud == 1)
  c(recall = tp / (tp + fn), precision = if (tp + fp == 0) 1 else tp / (tp + fp))
}))
plot(pr[, "recall"], pr[, "precision"], type = "l", lwd = 2,
     xlim = c(0, 1), ylim = c(0, 1), xlab = "recall", ylab = "precision",
     main = "Precision-recall curve")
abline(h = prevalence, lty = 2)      # the no-skill baseline sits at the prevalence
prevalence
#> [1] 0.04
```

Read two things off this curve. First, it slopes down: pushing recall up (catch more fraud) drags precision down (more false alarms), the same trade Lesson 3 made you pay, now drawn in full. Second, the dashed baseline sits at the prevalence, 0.04, because a model that flags at random is right only 4% of the time. Our curve rides well above that line, so the model has real skill, but nowhere near the near-perfect impression the ROC gave. When positives are rare, the PR curve is the honest picture.

=== step === tryit
::eyebrow Your turn
## Trade recall for precision

Precision of 0.32 at the 0.5 cutoff is rough. The obvious lever is to only flag the transactions the model is most sure about. Raise the cutoff to 0.8, then recompute precision and recall. Fill in the blank.

```r
strict <- scores >= ____           # only flag the most suspicious transactions
tp <- sum(strict & is_fraud == 1)
fp <- sum(strict & is_fraud == 0)
fn <- sum(!strict & is_fraud == 1)
round(c(precision = tp/(tp+fp), recall = tp/(tp+fn)), 3)
```
::check {"regex":"0\\.8","gate":true,"difficulty":"intermediate","ok":"See the trade: precision jumps to 0.80 but recall collapses to 0.10. A stricter cutoff buys cleaner alerts and misses far more fraud.","no":"Set the threshold to 0.8, that is, scores >= 0.8, then read the two numbers."}
::solution
```r
strict <- scores >= 0.8            # only flag the most suspicious transactions
tp <- sum(strict & is_fraud == 1)
fp <- sum(strict & is_fraud == 0)
fn <- sum(!strict & is_fraud == 1)
round(c(precision = tp/(tp+fp), recall = tp/(tp+fn)), 3)
#> precision    recall 
#>       0.8       0.1
```

Being strict cleans up the alerts (four of every five are now real fraud) but you catch only one fraud in ten. That is the PR curve's whole message in two numbers: there is no single "accuracy," only a trade you must set on purpose.

=== step === concept
::eyebrow A different question
## Lift: how much better than guessing?

Sometimes you are not choosing a yes/no threshold at all. Your team has capacity to review the riskiest 100 transactions by hand, and the question is simply: is that worth doing? **Lift** answers it. Rank every transaction by score, highest first, walk down the ranked list, and at each depth compute the precision so far, then divide by the prevalence:

\[ \text{lift}(d) = \frac{\text{precision within the top } d \text{ of the list}}{\pi} \]

A lift of 1 is no better than picking at random; a lift of 5 means that slice of the list is five times as fraud-dense as the population.

```r
ranked <- order(scores, decreasing = TRUE)    # riskiest transactions first
hit    <- is_fraud[ranked]                     # 1 wherever a reviewed item was fraud
depth  <- seq_along(hit) / length(hit)         # fraction of the list reviewed
lift   <- (cumsum(hit) / seq_along(hit)) / prevalence   # fraud density vs the base rate
plot(depth, lift, type = "l", lwd = 2, xlab = "fraction of transactions reviewed",
     ylab = "lift", main = "Lift curve")
abline(h = 1, lty = 2)                         # 1 = no better than random
round(lift[floor(0.10 * length(hit))], 2)      # lift within the riskiest 10%
#> [1] 7.5
```

Reviewing the riskiest 10% of transactions gives a lift of 7.5: that slice is 7.5 times as fraud-rich as reviewing transactions at random. The curve starts high, because the very top scores are nearly all fraud, and sags toward 1 as you descend into the legitimate mass. Lift tells a team whether a "review the top N" policy earns its cost.

=== step === concept
::eyebrow How deep to go
## Cumulative gains: how much do you catch?

Lift asks "how concentrated is this slice?" The **cumulative gains** curve asks the question a manager actually cares about: if I review the top x% of the ranked list, what fraction of all the fraud do I catch? Plot the fraction of transactions reviewed against the fraction of total fraud captured.

```r
gains <- cumsum(hit) / sum(hit)                # fraction of ALL fraud caught so far
plot(depth, gains, type = "l", lwd = 2, xlim = c(0, 1), ylim = c(0, 1),
     xlab = "fraction of transactions reviewed",
     ylab = "fraction of fraud caught", main = "Cumulative gains curve")
abline(0, 1, lty = 2)                          # random review: catch x% by reviewing x%
round(gains[floor(0.20 * length(hit))], 2)     # reviewing the riskiest 20%
#> [1] 0.9
```

Reviewing the riskiest 20% of transactions catches 90% of the fraud. The dashed diagonal is random review (work 20% of the list, catch 20% of the fraud); every bit of bulge above it is time and money saved. This is the curve you put in front of a budget decision, because it converts a model's ranking straight into "review this many, catch this much."

=== step === quiz
::eyebrow Check yourself
## Pick the right tool

Your fraud team can investigate 5% of transactions per day and wants to catch as much fraud as possible within that budget. Which curve most directly answers "is reviewing 5% enough?"

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The ROC curve, because AUC is the industry-standard headline number ::no AUC summarizes ranking across every threshold at once; it does not tell you what fraction of fraud a fixed 5% review catches. It is the wrong resolution for a budget question.
- The precision-recall curve, because precision is what matters on rare positives ::no Close, and PR is the right lens for the false-alarm trade at a chosen threshold. But "how much fraud do I catch by reviewing the top 5%?" is a depth-versus-capture question, which PR does not read off directly.
- The cumulative gains curve, because it maps review depth straight to the fraction of fraud caught ::ok Right. Find 5% on the horizontal axis, read the fraction of fraud captured off the vertical. That is precisely the budget question, answered.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Fawcett (2006), An introduction to ROC analysis, Pattern Recognition Letters](https://doi.org/10.1016/j.patrec.2005.10.010) - the canonical primer on ROC curves and AUC.
- [Davis and Goadrich (2006), The Relationship Between Precision-Recall and ROC Curves, ICML](https://doi.org/10.1145/1143844.1143874) - the paper on why PR separates models that ROC cannot on skewed data.
- [Saito and Rehmsmeier (2015), PLOS ONE](https://doi.org/10.1371/journal.pone.0118432) - shows the PR plot is more informative than ROC on imbalanced datasets, with clear examples.
- [yardstick (tidymodels) reference](https://yardstick.tidymodels.org/) - the R package that computes ROC, PR, lift and gain curves from your predictions.
- [Google Machine Learning Crash Course: ROC and AUC](https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc) - a gentle, visual refresher on ROC.

=== step === complete
## Lesson 4 complete

You can now read the whole curve family, and, more importantly, tell which one to trust for the decision in front of you:

| The decision you face | The curve to read | What it gives you |
|---|---|---|
| Compare two models' ranking, classes roughly balanced | ROC and AUC | one threshold-free score of ranking quality |
| Positives are rare, false alarms are costly | Precision-recall | the honest precision-vs-recall trade |
| "Is reviewing the top slice worth it?" | Lift | how many times better than random that slice is |
| "How deep do we go to catch X% of positives?" | Cumulative gains | fraction of positives caught at each review depth |

In practice you would not hand-roll these. tidymodels' yardstick computes all four from a data frame of the truth plus the predicted probability:

```r-static
# Run this in a local R session (yardstick installs from CRAN).
library(yardstick)
scored <- tibble::tibble(truth = factor(is_fraud, levels = c(1, 0)), prob = scores)
roc_auc(scored, truth, prob)                 # the single AUC number
autoplot(roc_curve(scored, truth, prob))     # ROC
autoplot(pr_curve(scored, truth, prob))      # precision-recall
autoplot(lift_curve(scored, truth, prob))    # lift
autoplot(gain_curve(scored, truth, prob))    # cumulative gains
```

Every one of these curves quietly assumes a score of 0.8 behaves like a real 0.8. Next, Lesson 5, Calibrating Predicted Probabilities: reliability diagrams and the fixes (Platt and isotonic) that make a predicted 0.7 mean an actual 70%.

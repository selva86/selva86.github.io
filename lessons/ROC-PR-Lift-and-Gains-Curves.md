---
title: "Imbalanced Classification Lesson 4: ROC, PR, Lift and Gains Curves"
catalog_blurb: "Which evaluation curve tells the truth when positives are rare."
description: "ROC, precision-recall, cumulative gains and lift are four questions asked of one score-ranked list. See why PR beats ROC on rare positives, and read all four in R."
keywords: "ROC curve, precision-recall curve, AUC, AUPRC, average precision, lift curve, cumulative gains curve, imbalanced classification, rare positive, R"
post_type: "LESSON"
curriculum_id: "6.80.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "4"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: "Calibrating-Predicted-Probabilities.html"
course_prev: "Thresholds-Under-Asymmetric-Costs.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## ROC, PR, Lift and Gains Curves

In Lesson 3 you stood at one threshold and priced its mistakes. But one threshold is one snapshot. This lesson steps back and looks at the model across *every* threshold at once, through four famous curves: the ROC curve, the precision-recall curve, the cumulative gains curve, and the lift curve.

Here is the running story. Overnight, **SecureBank**'s model scored a full day of **3000** card transactions for fraud. Only about **1 in 20** is actually fraud (the rest are ordinary purchases), and the bank's fraud team can hand-review only a slice of the day. Four questions hang over that morning: does the model *rank* fraud above legit? When it raises an alarm, can you trust it? If you review the riskiest 10%, how much fraud do you catch? And how much better is that than reviewing at random? Each of the four curves answers exactly one of them.

By the end of this lesson you will be able to:

- See ROC, PR, gains and lift as four questions asked of one score-ranked list
- Read an ROC curve and its AUC, and explain why a great AUC can hide a poor model when positives are rare
- Read a precision-recall curve against the right baseline, and summarize it with AUPRC
- Read cumulative gains and lift curves to decide how far down a ranked list to act

**Prerequisites:** a classifier outputs a probability score and a threshold turns it into a label ([Thresholds Under Asymmetric Costs](Thresholds-Under-Asymmetric-Costs.html)), and you have met the confusion matrix, precision, recall and AUC at an intro level ([Reading a Classifier](Reading-a-Classifier.html)). We re-define every term as it appears.

::widget roc-curve {}

=== step === concept
::eyebrow The organizing idea
## One ranked list, four questions

Strip away the jargon and a scored classifier gives you just one thing: a **ranked list**. Sort SecureBank's 3000 transactions from the highest fraud score to the lowest, and every curve in this lesson is a different question asked of that one list. ROC, PR, gains and lift do not need four different models; they re-read the same ranking four ways.

So let us build that list. Each lesson runs in a fresh R session, so we create the day of scored transactions right here (run this once). We simulate 3000 transactions, mark each as fraud or legit (fraud is rare, about 5%), and give each a model **score** between 0 and 1 that runs higher for fraud but overlaps heavily with legit, exactly what a good-but-imperfect model produces.

```r
set.seed(2024)
n <- 3000
# 1 = fraud (the rare positive, about 5%), 0 = an ordinary legit purchase.
fraud <- rbinom(n, 1, 0.05)
# The model's fraud score: higher on fraud, but the two clouds overlap heavily.
score <- plogis(rnorm(n, mean = -2.7 + 2.6 * fraud, sd = 1.2))
txn   <- data.frame(fraud = fraud, score = round(score, 4))

table(fraud = txn$fraud)
#> fraud
#>    0    1
#> 2852  148
```

Of the 3000 transactions, **148 are truly fraud** and **2852 are legit**. That fraction of positives has a name we will use constantly, the **prevalence** (also called the base rate): the share of all cases that are truly positive.

```r
prevalence <- mean(txn$fraud)
round(prevalence, 3)
#> [1] 0.049
```

About **0.049**, just under 5%. Hold onto that number. On a rare-positive problem it is the single fact that decides which curve tells the truth.

=== step === concept
::eyebrow Question one
## The ROC curve: does the model rank fraud above legit?

The first curve asks about **ranking**. Slide a threshold \(t\) from 1 down to 0, and at each stop label a transaction "fraud" when its score is at least \(t\). Two rates track what happens:

\[ \text{TPR} = \frac{TP}{TP + FN}, \qquad \text{FPR} = \frac{FP}{FP + TN} \]

Here \(TP\) (true positives) is fraud we flagged, \(FN\) (false negatives) is fraud we missed, \(FP\) (false positives) is legit we flagged by mistake, and \(TN\) (true negatives) is legit we correctly let through. The **true positive rate** (TPR, the same thing as recall) is the fraction of real fraud we catch; the **false positive rate** (FPR) is the fraction of legit transactions we wrongly flag. The **ROC curve** plots TPR on the vertical axis against FPR on the horizontal, one point per threshold. Build it by hand for SecureBank:

```r
thr <- seq(0, 1, by = 0.005)                     # every threshold from 0 to 1
roc <- t(sapply(thr, function(t) {
  pred <- txn$score >= t
  c(FPR = sum(pred & txn$fraud == 0) / sum(txn$fraud == 0),   # false positive rate
    TPR = sum(pred & txn$fraud == 1) / sum(txn$fraud == 1))   # true positive rate (recall)
}))

plot(roc[, "FPR"], roc[, "TPR"], type = "l", lwd = 2,
     xlab = "false positive rate", ylab = "true positive rate (recall)",
     main = "ROC: the SecureBank fraud model")
abline(0, 1, lty = 2)                            # the diagonal = a coin flip
```

A perfect model hugs the top-left corner (catch all fraud, zero false alarms); a useless coin-flip rides the dashed diagonal. To collapse the whole curve into one number, take the **area under it**, the **AUC**:

```r
o   <- order(roc[, "FPR"])
auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)
round(auc, 3)
#> [1] 0.927
```

**AUC 0.927.** It has a concrete meaning worth memorizing: it is the probability that a randomly chosen fraud scores higher than a randomly chosen legit transaction. So this model ranks a fraud above a legit **93% of the time**, with no threshold involved at all. On a report card, 0.927 looks like a clean A.

[KEY INSIGHT]
AUC grades the model's **ranking**, independent of any threshold. It answers "does fraud tend to outscore legit?" and nothing else. Keep that narrow meaning in mind, because in three steps it is going to flatter this model in a dangerous way.

=== step === widget
::eyebrow Feel the sweep
## Every threshold is one point on the curve

Before we push further, feel the mechanism. In the panel below, drag the threshold. The confusion matrix on the right recounts, and the operating point slides along the ROC curve: lower the threshold and you climb up and to the right (catch more, but false-alarm more); raise it and you slide back down. Each spot on the curve is one confusion matrix. (The panel uses its own small illustrative scores, so its AUC is not SecureBank's; the point is the *motion*.)

::widget roc-curve {}

Picking a threshold means choosing one point on that curve. The curve shows you the whole menu at once, and the AUC scores how good the menu is.

=== step === concept
::eyebrow Question one has a blind spot
## Why ROC flatters a rare positive

Here is the trap. Take a sensible operating threshold of 0.30 and count what actually happens on the day:

```r
t0   <- 0.30
pred <- txn$score >= t0
TP <- sum(pred & txn$fraud == 1); FP <- sum(pred & txn$fraud == 0)
FN <- sum(!pred & txn$fraud == 1); TN <- sum(!pred & txn$fraud == 0)

c(flagged   = TP + FP,
  recall    = round(TP / (TP + FN), 3),
  FPR       = round(FP / (FP + TN), 3),
  precision = round(TP / (TP + FP), 3))
#>   flagged    recall       FPR precision
#>   275.000     0.703     0.060     0.378
```

Read those four numbers slowly. The team flags **275** transactions. Recall is **0.703**, so it catches 104 of the 148 frauds, and the FPR is only **0.060**, which on the ROC curve is a lovely spot near the top-left. But **precision is 0.378**: of the 275 flagged, only 104 are real fraud and **171 are false alarms**. Nearly two of every three investigations are a wild goose chase.

How can the ROC curve look so healthy while precision is so poor? Look at what sits under each rate:

\[ \text{FPR} = \frac{FP}{FP + TN} = \frac{171}{171 + 2681}, \qquad \text{precision} = \frac{TP}{TP + FP} = \frac{104}{104 + 171} \]

The FPR's denominator is **every legit transaction** (2852 of them). Against that huge pool, 171 false alarms barely register, an FPR of 0.06, so the ROC axis hardly moves. Precision's denominator is only **what you flagged** (275), so it feels all 171 false alarms directly. When negatives vastly outnumber positives, the ROC can sit near the corner while the alarms you actually act on are mostly wrong.

[WARNING]
ROC and AUC are blind to prevalence. Their axes are rates within each class, so a flood of false alarms that is small *relative to the many negatives* barely dents the curve, even when it swamps the few real positives you care about. On a rare positive, a great AUC is not a promise that a flag can be trusted.

=== step === quiz
::eyebrow Check yourself
## The 0.93 that hides a mess

SecureBank's model has **AUC 0.927**, yet at the 0.30 threshold fewer than **2 in 5** of the flagged transactions are actually fraud. How can both be true at once?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The AUC must be miscomputed; a 0.927 AUC guarantees precise flags ::no AUC and precision measure different things. A high AUC never promises that any particular threshold gives trustworthy flags, especially on a rare positive.
- AUC only grades ranking (does fraud outscore legit?); precision asks how many flags are real, and its small denominator feels every false alarm the huge-denominator FPR hides ::ok Exactly. The model ranks well (fraud outscores legit 93% of the time), but with 2852 legit transactions, 171 false alarms is a tiny FPR yet a precision-wrecking share of the 275 flags. Ranking quality and flag trustworthiness are different questions.
- It cannot be true; good AUC and poor precision are contradictory ::no They are not. AUC summarizes ranking over all thresholds; precision is pinned to one threshold and reacts to the volume of false alarms, which prevalence hides from the FPR.

=== step === concept
::eyebrow Question two
## The precision-recall curve

If precision is the number that stays honest on a rare positive, plot *it*. The **precision-recall curve** plots precision against recall across every threshold:

\[ \text{precision} = \frac{TP}{TP + FP}, \qquad \text{recall} = \frac{TP}{TP + FN} \]

Precision is how much you can trust a flag (of what you flagged, how much was real); recall is the catch rate (of all the fraud, how much you caught). Build the curve the same way, sweeping every threshold:

```r
pr <- t(sapply(thr, function(t) {
  pred <- txn$score >= t
  tp <- sum(pred & txn$fraud == 1); fp <- sum(pred & txn$fraud == 0)
  fn <- sum(!pred & txn$fraud == 1)
  c(recall    = tp / (tp + fn),
    precision = ifelse(tp + fp == 0, 1, tp / (tp + fp)))
}))

plot(pr[, "recall"], pr[, "precision"], type = "l", lwd = 2, ylim = c(0, 1),
     xlab = "recall", ylab = "precision",
     main = "Precision-recall: the same model")
abline(h = prevalence, lty = 2)                  # no-skill baseline = prevalence (0.049)
```

Two things are different from the ROC curve, and both matter. First, the curve slopes **down**: to catch more fraud (push recall right) you must lower the threshold and flag more, so more of your flags are wrong (precision falls). Second, the "no-skill" baseline is **not** the diagonal at 0.5. A model with no ability flags transactions blindly, so its precision equals the prevalence, the dashed line at **0.049**. A useful model's PR curve arches above that floor.

[NOTE]
The PR baseline moves with the problem. At 5% prevalence a coin-flipping model scores precision 0.05, so beating 0.05 is the bar, and "precision 0.4" is genuinely far above random. Always compare a PR curve to the prevalence line, never to 0.5.

=== step === concept
::eyebrow One number, honestly
## AUPRC: the honest summary

Just as AUC summarized the ROC curve, the **area under the precision-recall curve** (AUPRC, also called average precision) summarizes this one. Compute it the same trapezoid way, then lay all three headline numbers side by side:

```r
op    <- order(pr[, "recall"])
auprc <- sum(diff(pr[op, "recall"]) *
             (head(pr[op, "precision"], -1) + tail(pr[op, "precision"], -1)) / 2)

round(c(baseline = prevalence, auprc = auprc, roc_auc = auc), 3)
#>  baseline     auprc   roc_auc
#>     0.049     0.609     0.927
```

Now the two summaries tell very different stories about the **same model**. ROC-AUC is **0.927**, the flattering A. AUPRC is **0.609**, measured against a no-skill floor of **0.049**. The model is genuinely strong (0.609 is roughly twelve times the 0.049 a random model would score), but 0.609 is nowhere near the 0.927 that ROC advertised. That gap is the whole point: on a rare positive, ROC-AUC quietly grades on a curve, while AUPRC grades against the hard floor of the base rate.

[KEY INSIGHT]
For a rare-positive problem, report AUPRC next to ROC-AUC, and always read AUPRC against the prevalence, not against 0.5. A no-skill model's AUPRC **equals** the prevalence, so a model is only impressive to the extent its AUPRC clears that line.

=== step === quiz
::eyebrow Check yourself
## Where does the PR baseline sit?

Fraud is about 5% of SecureBank's transactions. On the precision-recall curve, where does a "no-skill" model (one with no ability, flagging transactions at random) sit?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- At precision 0.5, the same neutral middle a random model has on an ROC curve ::no 0.5 is the ROC coin-flip line, not the PR baseline. On a PR curve a random model sits at the prevalence, which depends on the problem.
- At precision 0, because a random model catches no fraud ::no A random model still flags some real fraud by luck; its precision is not zero. It equals the share of positives in the flagged pile, which for random flagging is the prevalence.
- At precision equal to the prevalence, about 0.049 ::ok Right. Flag at random and the fraction of your flags that are truly fraud is just the overall fraud rate, the prevalence. So the PR no-skill line sits at 0.049 here, and a useful model must arch above it.

=== step === concept
::eyebrow Question three
## The cumulative gains curve: how much fraud in the top slice?

The bank's fraud team cannot review all 3000 transactions; they can hand-check maybe a few hundred. So the real question is not about a threshold at all, it is about **depth**: if we sort by score and review the riskiest slice, how much of the day's fraud do we catch?

That is the **cumulative gains curve**. Walk down the ranked list; at each depth, plot the fraction of *all* fraud captured so far against the fraction of the list reviewed:

```r
ord   <- order(txn$score, decreasing = TRUE)     # rank riskiest first
gains <- cumsum(txn$fraud[ord]) / sum(txn$fraud) # share of ALL fraud caught so far
depth <- seq_along(ord) / nrow(txn)              # share of transactions reviewed

plot(depth, gains, type = "l", lwd = 2,
     xlab = "fraction of transactions reviewed (ranked by score)",
     ylab = "fraction of all fraud caught",
     main = "Cumulative gains: SecureBank")
abline(0, 1, lty = 2)                            # reviewing at random = the diagonal
```

The dashed diagonal is what random review gets you: check 20% of transactions blindly and you find 20% of the fraud. A good model bows sharply above it, because the fraud is concentrated at the top of its ranking. Read off the value at 10% depth:

```r
i10 <- round(0.10 * nrow(txn))
round(gains[i10], 3)
#> [1] 0.723
```

Reviewing only the **top 10%** of the day's transactions (300 of them) catches **72%** of all the fraud. That is the number a capacity-limited team actually plans around, and no single threshold or AUC told it to you directly.

=== step === concept
::eyebrow Question four
## The lift curve: how much better than random?

The gains curve says "72% of fraud in the top 10%." The **lift curve** turns that into a multiplier: how many times better than random targeting is each depth? Lift is just gains divided by depth:

\[ \text{lift}(d) = \frac{\text{gains}(d)}{d} \]

where \(d\) is the fraction of the list you review and \(\text{gains}(d)\) is the fraction of fraud you catch there. There is a second reading that ties the whole lesson together. If you flag the top fraction \(d\), then recall is \(\text{gains}(d)\), and the precision of that flagged slice works out to \(\pi \cdot \text{gains}(d)/d\), where \(\pi\) is the prevalence. So:

\[ \text{lift}(d) = \frac{\text{gains}(d)}{d} = \frac{\text{precision}(d)}{\pi} \]

Lift is precision measured in units of the base rate: "how many times more concentrated is fraud here than in the population." Compute and plot it:

```r
lift <- gains / depth                            # times better than reviewing at random

plot(depth, lift, type = "l", lwd = 2,
     xlab = "fraction reviewed (ranked by score)",
     ylab = "lift (times better than random)",
     main = "Lift curve: SecureBank")
abline(h = 1, lty = 2)                           # random targeting = lift of 1

round(lift[i10], 2)
#> [1] 7.23
```

The dashed line at 1 is random targeting. In the top 10%, lift is **7.23**: fraud is about seven times as concentrated in the model's riskiest decile as in the population at large. That single number is exactly what a marketing team means by "our model gives 7x lift in the top decile," and it is why lift and gains curves are the language of any ranked-and-targeted campaign, fraud queues, churn saves, or direct mail alike.

=== step === tryit
::eyebrow Your turn
## Size the top 20%

Tomorrow the fraud team has more hands and can review the **top 20%** of ranked transactions. Using the same ranked list, fill in the index so `caught` becomes the fraction of *all* the day's fraud that reviewing the top 20% captures.

```r
ord    <- order(txn$score, decreasing = TRUE)
top20  <- ord[1:round(0.20 * nrow(txn))]     # the 600 riskiest transactions
caught <- sum(txn$fraud[____]) / sum(txn$fraud)
round(caught, 3)
```
::check {"regex":"top20","gate":true,"difficulty":"intermediate","ok":"Right: summing the fraud flags among top20 gives 0.872, so reviewing the riskiest 20% catches about 87% of the day's fraud (a lift of 0.872 / 0.20 = 4.4x over random).","no":"You want the fraud values at the top-20% positions: index txn$fraud with top20, so sum(txn$fraud[top20])."}
::solution
```r
ord    <- order(txn$score, decreasing = TRUE)
top20  <- ord[1:round(0.20 * nrow(txn))]
caught <- sum(txn$fraud[top20]) / sum(txn$fraud)
round(caught, 3)
#> [1] 0.872
```

=== step === quiz
::eyebrow Check yourself
## Reading a lift of 7

SecureBank reports that its model has a **lift of 7.23 in the top decile** (the top 10% of ranked transactions). What does that actually mean?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Reviewing the top 10% by score catches about 7.23 times as much fraud as reviewing a random 10% would ::ok Exactly. Lift is gains divided by depth: the top decile holds 72.3% of the fraud versus 10% for random review, so 0.723 / 0.10 = 7.23 times better. It is a concentration multiplier over random targeting.
- The model catches 7.23% of all fraud in the top decile ::no That confuses lift with a percentage. The gains (fraud caught) in the top decile is 72.3%; lift is that 72.3% divided by the 10% depth, giving 7.23 times, not 7.23%.
- The model is 7.23 times more accurate than a random classifier ::no Lift is not about accuracy. It compares fraud concentration in a ranked slice to random targeting of the same size, which is a very different quantity from overall accuracy.

=== step === concept
::eyebrow Putting it together
## Which curve for which job

The four curves are one ranked list read four ways. Which one to reach for depends on the decision in front of you:

| Curve | The question it answers | Reach for it when... |
|---|---|---|
| **ROC + AUC** | Does the model rank positives above negatives? | Classes are roughly balanced, or both errors matter and you want a threshold-free ranking score |
| **PR + AUPRC** | Of what you flag, how much is real, as you chase recall? | The positive class is rare and false alarms are what hurt (fraud, disease screening, rare-event detection) |
| **Cumulative gains** | If I act on the top slice, how many positives do I capture? | You have a fixed budget or review capacity and need to pick a depth |
| **Lift** | How many times better than random is targeting the top slice? | You are ranking-and-targeting and want a concentration multiplier to report |

[WARNING]
All four curves judge only the model's **ranking**, the order of the scores. None of them checks whether a score of 0.7 really means a 70% chance of fraud. A model can top every curve here and still hand you probabilities you cannot take at face value. Fixing *that* is the next lesson.

=== step === quiz
::eyebrow Check yourself
## Pick the honest curve

A hospital screens for a disease present in about 2% of patients, and wants to judge how trustworthy a positive screen is as it tries to catch more cases. Which curve is the honest choice, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The ROC curve, because AUC is the universal standard and works for any problem ::no ROC is fine for ranking, but at 2% prevalence its FPR hides the flood of false alarms; it will look reassuring while most positive screens are wrong. That is exactly the rare-positive blind spot.
- The precision-recall curve, because at 2% prevalence precision (of those flagged, how many are real) reacts to false alarms that the ROC's FPR hides, and its baseline is the 0.02 prevalence ::ok Right. With a rare positive and a focus on how much a flag can be trusted, PR against the prevalence baseline tells the honest story where ROC flatters.
- The lift curve, because it is the most modern and always the most informative ::no Lift is for sizing a targeted top slice, not for judging how trustworthy a positive screen is. The question here is about precision on a rare positive, which is the PR curve's job.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Saito and Rehmsmeier (2015), "The Precision-Recall Plot Is More Informative than the ROC Plot on Imbalanced Datasets", PLOS ONE](https://doi.org/10.1371/journal.pone.0118432) - the paper behind this lesson's core warning, with the exact rare-positive comparison.
- [Davis and Goadrich (2006), "The Relationship Between Precision-Recall and ROC Curves", ICML](https://doi.org/10.1145/1143844.1143874) - proves how a point in ROC space maps to PR space, and why a good ROC curve need not be a good PR curve.
- [Fawcett (2006), "An introduction to ROC analysis", Pattern Recognition Letters](https://doi.org/10.1016/j.patrec.2005.10.010) - the standard, readable reference on ROC curves and AUC.
- [yardstick reference (tidymodels)](https://yardstick.tidymodels.org/) - the R package that computes roc_curve, pr_curve, gain_curve and lift_curve for real projects, so you rarely sweep thresholds by hand.

=== step === complete
## Lesson 4 complete

You now see ROC, PR, gains and lift as four questions asked of one score-ranked list. You read the **ROC curve** and its **AUC 0.927** as a threshold-free measure of ranking, then watched it flatter SecureBank's model: at a sensible cutoff the FPR was a tidy 0.06 while precision was only 0.378, because the false-positive rate hides false alarms in the huge pool of legit transactions. You switched to the **precision-recall curve**, read it against the **prevalence** baseline (0.049, not 0.5), and summarized it with **AUPRC 0.609**. Then you turned the same ranking into a plan: the **cumulative gains curve** said the riskiest 10% holds 72% of the fraud, and the **lift curve** said that is 7.23 times better than random review.

Every one of these curves trusted the *order* of the scores but never asked whether a 0.7 really means a 70% chance. Next, Lesson 5: **Calibrating Predicted Probabilities**. You will read a reliability diagram, put a number on how honest your probabilities are, and repair them so a predicted 0.7 truly means 70%.

---
title: "Imbalanced Classification Lesson 6: Why AUC Is Not Enough"
catalog_blurb: "What a single AUC score hides, and which numbers to check instead."
description: "A high AUC can still hide a weak model: it ignores calibration, precision on a rare class, and how it behaves at your real threshold. What to check instead."
keywords: "AUC, ROC AUC, why AUC is not enough, calibration, precision recall, PR curve, class imbalance, model evaluation, R"
post_type: "LESSON"
curriculum_id: "6.80.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: ""
course_prev: "Calibrating-Predicted-Probabilities.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Why AUC Is Not Enough

The bank's data team ships two fraud detectors. Both score **AUC 0.90** on the same test set. The slide deck says "great model" and picks one at random. In production, one detector saves the bank millions and the other floods the review team with false alarms and misprices every risk decision.

One number could not tell them apart. This lesson is about everything a single AUC hides, and the handful of numbers that would have caught the difference.

By the end you will be able to:

- Say exactly what one AUC number measures, and what it does not
- See why AUC is blind to whether a predicted 0.7 really means 70%
- See why a high AUC can sit on top of terrible precision when the positive class is rare
- Report the metric that matches the decision, instead of trusting AUC alone

**Prerequisites:** you can fit a classifier and read a confusion matrix. From earlier in this course: the ROC curve, precision and recall ([ROC, PR, Lift and Gains Curves](ROC-PR-Lift-and-Gains-Curves.html)), reliability diagrams ([Calibrating Predicted Probabilities](Calibrating-Predicted-Probabilities.html)), and why accuracy lies on a rare class ([Class Imbalance and Resampling](Class-Imbalance-and-Resampling.html)).

::widget roc-curve {}

=== step === concept
::eyebrow The idea
## What one AUC number actually means

Start with what AUC is doing right, because it is a genuinely useful number. Take one real fraud transaction and one real legit transaction at random. Ask your model to score both. AUC is simply **the probability that the fraud gets the higher score**.

That is the whole definition. Write \(s(x)\) for the score a model gives a transaction \(x\). With \(x^{+}\) a random actual-fraud case and \(x^{-}\) a random actual-legit case,

\[ \text{AUC} = P\big(s(x^{+}) > s(x^{-})\big) \]

An AUC of 1.0 means every fraud outscores every legit (perfect ranking); 0.5 means the model orders them no better than a coin flip. It equals the area under the ROC curve you met in Lesson 4, and it is also the Mann-Whitney U statistic, so you can compute it by hand from scores and labels, no package required:

```r
# AUC = the chance a random positive is scored above a random negative.
set.seed(1)
n     <- 1000
fraud <- rbinom(n, 1, 0.5)                              # a balanced toy set, to define AUC cleanly
score <- plogis(rnorm(n, mean = ifelse(fraud == 1, 1, -1)))

auc <- function(score, y) {                             # Mann-Whitney form, base R only
  pos  <- score[y == 1]; neg <- score[y == 0]
  wins <- outer(pos, neg, ">")                          # every positive-vs-negative pair
  ties <- outer(pos, neg, "==")
  (sum(wins) + 0.5 * sum(ties)) / length(wins)          # fraction of pairs ranked correctly
}
round(auc(score, fraud), 2)
#> [1] 0.92
```

[KEY INSIGHT]
AUC measures **ranking only**: can the model put positives above negatives? It says nothing about the actual score values, nothing about the class balance, and nothing about the one threshold you will deploy at. Those three blind spots are the rest of this lesson.

=== step === concept
::eyebrow Blind spot 1
## AUC cannot see calibration

Here is the first thing AUC throws away. Take a well-calibrated model A, whose score really is the probability of fraud, and build model B by squeezing every score toward 0.5: \(s_B = 0.5 + 0.25\,(s_A - 0.5)\). That is a **strictly increasing** transform, so it never changes the *order* of any two scores. And AUC depends only on order.

So A and B have the **exact same AUC**, to every decimal, even though B's probabilities are now badly wrong:

```r
set.seed(2)
n      <- 2000
x      <- rnorm(n)
p_true <- plogis(1.4 * x)             # the real probability of fraud
y      <- rbinom(n, 1, p_true)

pA <- p_true                          # Model A: honest, calibrated probabilities
pB <- 0.5 + (pA - 0.5) * 0.25         # Model B: same ranking, squashed toward 0.5

auc(pA, y) - auc(pB, y)               # a monotone squeeze keeps the ranking, so AUC is identical
#> [1] 0
```

But if you *use* those probabilities, say expected loss = probability times transaction amount, B is a disaster. The Brier score (mean squared error of the probabilities, lower is better) exposes what AUC could not:

```r
brier <- function(p, y) mean((p - y)^2)   # how far the probabilities sit from the outcomes
brier(pB, y) > brier(pA, y)               # TRUE: B's probabilities are worse, yet AUC called it a tie
#> [1] TRUE
```

A **reliability diagram** shows the damage directly: bin the predictions, then plot how often each bin actually turned out to be fraud against what it claimed. A calibrated model sits on the diagonal. Drag the slider to push a model over- or under-confident and watch the curve bow away, all while its AUC would not move a hair.

::widget calibration-curve {}

=== step === quiz
::eyebrow Check yourself
## Same AUC, different probabilities

Models A and B both report **AUC 0.90**. Your team ranks accounts by expected loss, computed as *predicted probability times balance*, so the probability value itself drives money. A is calibrated; B's scores are squashed toward 0.5. Which do you trust for this, and what did AUC tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Either one is fine; an equal AUC means their probabilities are equally good ::no AUC only compares rankings. It is invariant to any monotone squeeze of the scores, so equal AUC says nothing about whether a 0.7 means 70%.
- Model A, because it is calibrated, and AUC could not see the difference, it scored them equal ::ok Right. AUC judged only the ranking, which the squeeze preserved. When the probability itself is the input to a decision, you must check calibration separately.
- Model B, because pulling scores toward 0.5 makes it more cautious and safer ::no Pulling scores toward 0.5 does not add caution, it just makes the probabilities wrong. B's Brier score is worse even though its AUC is identical.

=== step === concept
::eyebrow Blind spot 2
## A high AUC can hide awful precision

The second blind spot bites hardest on exactly the problems this course is about: rare positives. Fraud is maybe 2% of transactions. Watch a genuinely good-ranking model post a shiny AUC:

```r
# The bank's real base rate: about 2% of transactions are fraud.
set.seed(7)
N     <- 10000
y     <- rbinom(N, 1, 0.02)                       # roughly 200 fraud, 9800 legit
sig   <- rnorm(N, mean = ifelse(y == 1, 2, 0))    # a real signal: fraud scores higher
score <- plogis(sig)

round(auc(score, y), 2)                            # looks excellent
#> [1] 0.92
```

Now set a threshold that catches 80% of the fraud, the kind of recall a fraud team wants, and look at **precision**: of everything you flag, how much is truly fraud?

```r
thr       <- quantile(score[y == 1], 0.20)        # 80% of fraud scores above this cut
flag      <- score >= thr
recall    <- sum(flag & y == 1) / sum(y == 1)
precision <- sum(flag & y == 1) / sum(flag)
round(c(recall = recall, precision = precision), 2)
#>    recall precision
#>      0.80      0.12
```

Recall 0.80, precision about 0.12. Roughly **seven of every eight fraud alerts are false alarms**, and yet the AUC was 0.92. The reason is arithmetic: ROC's false-positive rate is \(\text{FP} / N_{\text{legit}}\), and \(N_{\text{legit}}\) is enormous, so even a "small" false-positive rate is a flood of alerts in raw counts. Precision divides by the flags you actually raised, so it feels the imbalance that AUC averages away. Slide the threshold on the widget below and watch precision and recall trade off, the trade one AUC number quietly summarizes.

::widget roc-curve {}

[NOTE]
This is why Lesson 4 preferred the **precision-recall curve** on rare positives. PR-AUC moves when precision collapses; ROC-AUC often does not.

=== step === concept
::eyebrow Blind spot 3
## AUC averages over thresholds you will never use

AUC is the area under the whole ROC curve, which means it is an **average of the true-positive rate across every possible threshold**, from "flag nothing" to "flag everything". Formally it weights all operating points equally:

\[ \text{AUC} = \int_{0}^{1} \text{TPR}\,(\text{FPR})\; d(\text{FPR}) \]

But you never deploy "every threshold". You deploy **one**. A fraud team can only review, say, the riskiest 3% of transactions it has people to investigate. The number that matters is the recall *inside that budget*, not the average over thresholds nobody will ever set:

```r
# The fraud team can review only the top 3% of transactions they flag.
budget <- 0.03
cutoff <- quantile(score, 1 - budget)             # flag the riskiest 3% by score
flag   <- score >= cutoff
round(c(alerts_reviewed = mean(flag),
        fraud_caught    = sum(flag & y == 1) / sum(y == 1)), 2)
#> alerts_reviewed    fraud_caught
#>            0.03            0.50
```

At the 3% you can actually action, this AUC-0.92 model catches only about **half** the fraud. A rosy global average, a sobering local reality. Two models can tie on AUC and still differ wildly right here, in the low-alert corner where the business lives, because AUC spent most of its area on thresholds you would never choose. (Slide the operating point on the ROC widget above to feel it: the whole curve earns the AUC, but you only ever stand at one dot on it.)

[WARNING]
An AUC is computed over all thresholds; a decision happens at one. Always report the metric at the operating point you will deploy, not just the area over points you will not.

=== step === quiz
::eyebrow Check yourself
## What would you check first?

A colleague hands you a fraud model and one number: **AUC 0.93**. Before you agree to deploy it, which single follow-up tells you the most about whether it is actually useful?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Its overall accuracy on the test set ::no On a 2% fraud problem, a model that flags nothing is 98% accurate. Accuracy is the metric this whole course warned you about.
- Its precision and recall at the alert budget you can actually review ::ok Exactly. That is the operating point you will deploy at, and it exposes the false-alarm rate and the catch rate that AUC averages over and hides.
- A second AUC computed on more data ::no More data tightens the same summary; it does not tell you how the model behaves at your threshold or whether its probabilities are calibrated.

=== step === concept
::eyebrow The fix
## Report the metric that matches the decision

None of this means AUC is useless. It is a fine one-line summary of *ranking quality*, and a good sanity check. It is just the wrong thing to report as the *only* thing. Pick the metric from the decision you are actually making:

- **Triaging a ranked list under a budget?** Report precision at your budget (precision at k) and recall at that budget, plus PR-AUC when positives are rare.
- **Feeding the probability into a cost or expected-loss calculation?** Report calibration: a reliability curve, and a Brier score or log-loss.
- **Acting at a fixed threshold?** Report precision and recall at that cutoff, priced by the cost of a miss versus a false alarm (Lesson 3).

The flow below turns "what is the decision?" into "what should I report?".

::widget process-flow {"steps":[{"title":"Name the decision","sub":"who acts on the score, at what threshold or review budget"},{"title":"Ranking and triage","sub":"report precision at your budget and PR-AUC, not ROC-AUC alone"},{"title":"Using the probability","sub":"report calibration: a reliability curve plus Brier or log-loss"},{"title":"Fixed threshold","sub":"report precision and recall at that cutoff, priced by cost"}]}

=== step === tryit
::eyebrow Your turn
## Precision at the operating point

You still have `score` and `y` (the real fraud labels) from the imbalanced model. A reviewer flags every transaction scoring at least 0.9. Fill in the blank so `precision` is the fraction of those flags that are truly fraud, the deployable number AUC never showed you.

```r
flag      <- score >= 0.9
precision <- sum(flag & y == 1) / sum(____)
round(precision, 3)
```
::check {"regex":"sum\\(\\s*flag\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. Precision divides the true fraud you flagged by ALL the flags you raised, sum(flag).","no":"Precision is (fraud correctly flagged) / (everything flagged). The denominator is the total number of flags: sum(flag)."}
::solution
```r
flag      <- score >= 0.9
precision <- sum(flag & y == 1) / sum(flag)   # true fraud flagged / all flags
round(precision, 3)
```

=== step === concept
::eyebrow Go deeper
## References

- [Hand (2009), Measuring classifier performance: a coherent alternative to the area under the ROC curve, Machine Learning 77](https://doi.org/10.1007/s10994-009-5119-5) - the classic argument that AUC can be incoherent, and what to do instead.
- [Saito and Rehmsmeier (2015), The Precision-Recall Plot Is More Informative than the ROC Plot on Imbalanced Datasets, PLOS ONE](https://doi.org/10.1371/journal.pone.0118432) - exactly why ROC-AUC flatters a model on rare positives.
- [Davis and Goadrich (2006), The Relationship Between Precision-Recall and ROC Curves, ICML](https://doi.org/10.1145/1143844.1143874) - the formal link between the two curve families.
- [Niculescu-Mizil and Caruana (2005), Predicting Good Probabilities With Supervised Learning, ICML](https://doi.org/10.1145/1102351.1102430) - why good ranking does not imply good probabilities, and how to calibrate.

=== step === complete
## Module complete

You can now say precisely what a single AUC number does and does not tell you. It measures ranking, and only ranking, so it is blind to three things that decide whether a model is worth deploying:

1. **Calibration:** a monotone squeeze leaves AUC untouched while wrecking the probabilities. Check it with a reliability curve and Brier or log-loss.
2. **Precision on a rare class:** a high ROC-AUC can sit on top of one-in-eight precision. Check PR-AUC and precision at your budget.
3. **Your operating point:** AUC averages over thresholds you will never use. Check recall and precision at the one you will.

That closes the Imbalanced Classification course: you handled many classes, rebalanced a rare one, moved the threshold under real costs, read the full curve family, calibrated the probabilities, and now you know which number to trust when. Imbalanced Classification is a graded module in the Data Scientist track. Pass the assessment and it goes on your verified certificate, with a portfolio project to match.

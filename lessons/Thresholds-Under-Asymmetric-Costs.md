---
title: "Imbalanced Classification Lesson 3: Thresholds Under Asymmetric Costs"
description: "A missed fraud costs far more than a false alarm, so leave the data alone and move the decision threshold. Find the cost-optimal cutoff in R, step by step."
keywords: "classification threshold, asymmetric costs, cost-sensitive classification, decision threshold, false negative cost, expected cost, imbalanced classification, R"
mathjax: true
webr: true
curriculum_id: "6.80.3"
post_type: "LESSON"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "3"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: "ROC-PR-Lift-and-Gains-Curves.html"
course_prev: "Class-Imbalance-and-Resampling.html"
lesson_access: "pro"
catalog_blurb: "Set the cutoff by what each error costs, not a default 0.5."
---

=== step === cover
::eyebrow Lesson 3 of 6
## Thresholds Under Asymmetric Costs

SecureBank's fraud model looks at a $900 online purchase and returns one number: a 34% chance it is fraud. The model has done its job. Now a human decision is left: flag it, or let it through? Answer "flag it only if the chance is above 50%" and the bank waves through every fraud the model rated under a coin flip. Each one it waves through is a $500 chargeback.

In Lesson 2 you rebalanced the training data to catch more fraud, and paid for it in precision and distorted probabilities. This lesson does not touch the data or retrain anything. It moves one dial, the decision threshold, and lets the cost of each mistake decide where that dial should sit.

By the end you will be able to:

- Explain why the default 0.5 cutoff is arbitrary, and that moving it changes predictions with no retraining
- Read an asymmetric cost matrix and decide which way to move the threshold
- Price a set of predictions in R and sweep the threshold to find the cheapest cutoff
- Use the cost-optimal threshold formula to pick a cutoff directly

**Prerequisites:** you can fit a classifier that outputs a probability ([Logistic Regression Done Properly](Logistic-Regression-Done-Properly.html)), and you know precision, recall and a confusion matrix ([Class Imbalance and Resampling](Class-Imbalance-and-Resampling.html)).

Drag the threshold below and watch the flagged points, and the mistakes, change.

::widget logistic-curve {}

=== step === concept
::eyebrow The idea
## The score, not the label

A classifier does not really output "fraud" or "legit". It outputs a **probability**: SecureBank's model gives that $900 purchase a fraud probability of \(p = 0.34\). The yes/no label only appears when you compare that probability to a cutoff.

That is the decision rule, and it is the whole game:

\[ \hat{y} = 1 \iff p \ge t \]

Read that as: predict fraud exactly when the probability is at least the cutoff. Here \(p\) is the model's predicted probability of the positive class (fraud), \(t\) is the **threshold** you choose, \(\hat{y} = 1\) means "predict fraud" (the little hat marks it as the model's guess, not the truth), and the \(\iff\) symbol means "exactly when". Most software defaults to \(t = 0.5\), so people forget it is a choice at all. It is not a law of the model; it is a knob. Slide the threshold on the curve in the previous step and the same fixed S-curve keeps its shape while the cutoff line, and the set of flagged transactions, moves.

[KEY INSIGHT]
Training fixes the probabilities. The threshold is a separate, after-the-fact decision. You can change it in one line, with no retraining, and it is the single lever that trades missed fraud against false alarms.

=== step === concept
::eyebrow Why the cutoff matters
## Not all mistakes cost the same

At \(t = 0.5\) that $900 purchase (scored 0.34) is let through. If it really was fraud, the bank eats a **$500 chargeback**. Flagging a legit purchase instead is not free either, a review call and a briefly annoyed customer, but it is nowhere near as expensive. Put real numbers on the four outcomes:

| Model decides | Actually legit | Actually fraud |
|---|---|---|
| **Flag** (predict fraud) | false positive: **$100** | true positive: $0 |
| **Allow** (predict legit) | true negative: $0 | false negative: **$500** |

A **false positive** (FP) is a legit transaction we flagged, a false alarm. A **false negative** (FN) is a real fraud we let through, a miss. Here a miss costs five times a false alarm. That imbalance in the *costs* (not the class counts of Lesson 2) is what "asymmetric costs" means.

[NOTE]
When the two errors cost the same, 0.5 is a sensible cutoff. The moment one error is more expensive than the other, 0.5 is almost never the right place to stand, and the more lopsided the costs, the further you should move.

=== step === quiz
::eyebrow Check yourself
## Which way do you move it?

A missed fraud costs SecureBank $500; a false alarm costs $100. You are still using the default cutoff of 0.5. To act on those costs, which way should you move the threshold?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Lower it, so the model flags more transactions ::ok Right. A miss is five times costlier than a false alarm, so you accept more false alarms to catch more fraud. Lowering the cutoff flags anything above a smaller probability.
- Raise it, so the model flags fewer transactions ::no That moves the wrong way: raising the bar flags fewer transactions, so you catch LESS fraud and make more of the expensive misses.
- Leave it at 0.5; the threshold has nothing to do with costs ::no 0.5 is only a default. The threshold is exactly the knob that trades false alarms against missed fraud, so the costs are what should set it.

=== step === widget
::eyebrow See the trade
## Every cutoff is a different confusion matrix

There is no cutoff that makes both errors disappear. Lowering the threshold catches more real positives (fewer false negatives) but flags more negatives too (more false positives). Drag the threshold below. The confusion matrix on the right recounts, and the operating point slides along the curve of every possible threshold at once.

Each position is one confusion matrix. Choosing a threshold means choosing one point on that curve, and the costs tell you which point is worth standing on.

::widget roc-curve {}

=== step === concept
::eyebrow Put a number on it
## Price the whole batch

To choose well, stop eyeballing and add up the money. At a threshold \(t\), the total cost of a batch of predictions is just the mistakes times their prices:

\[ \text{Cost}(t) = C_{FN}\cdot \text{FN}(t) + C_{FP}\cdot \text{FP}(t) \]

where \(C_{FN}\) and \(C_{FP}\) are the dollar costs of a miss and a false alarm, and \(\text{FN}(t)\) and \(\text{FP}(t)\) are how many of each you make at that cutoff. Let us compute it on a real batch. Each lesson runs in a fresh R session, so we build the scored transactions right here (run this once).

```r
# SecureBank's model already scored a batch of 28 card transactions.
# score  = the model's estimated P(fraud); actual = what really happened (1 = fraud).
score <- c(0.01, 0.01, 0.02, 0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05,
           0.05, 0.06, 0.07, 0.08, 0.09, 0.11, 0.13, 0.15, 0.16, 0.22,   # 20 legit
           0.19, 0.27, 0.41, 0.55, 0.68, 0.80, 0.89, 0.96)               # 8 fraud
actual <- c(rep(0, 20), rep(1, 8))
table(actual)
#> actual
#>  0  1 
#> 20  8
```

Now put the prices in and write the cost as a function of the threshold:

```r
cost_FN <- 500   # dollars per missed fraud (a chargeback the bank refunds)
cost_FP <- 100   # dollars per false alarm (a review call + an annoyed customer)

total_cost <- function(t) {
  flag <- score >= t                 # flag "fraud" when the score clears the cutoff t
  FN <- sum(!flag & actual == 1)     # real fraud we let through
  FP <- sum( flag & actual == 0)     # legit transactions we flagged
  FN * cost_FN + FP * cost_FP
}

total_cost(0.50)                     # the price of the default cutoff
#> [1] 1500
```

The default cutoff misses three of the eight frauds. Three chargebacks at $500 is **$1,500** for this one batch. The question is whether a different cutoff does better.

=== step === concept
::eyebrow The payoff
## The cost-optimal cutoff

You could try every threshold and keep the cheapest. You can also derive the best one directly. Look at a single transaction the model scores at probability \(p\), and weigh the two choices by their expected cost:

- **Flag it.** You are wrong only if it was actually legit, which happens with probability \(1 - p\). Expected cost: \((1 - p)\,C_{FP}\).
- **Let it through.** You are wrong only if it was actually fraud, which happens with probability \(p\). Expected cost: \(p\,C_{FN}\).

Flagging is the cheaper move exactly when \((1 - p)\,C_{FP} < p\,C_{FN}\). Solve that for \(p\) and the cutoff falls out:

\[ t^* = \frac{C_{FP}}{C_{FP} + C_{FN}} \]

For SecureBank that is \(100 / (100 + 500) = 0.167\), not 0.5. Now confirm it by brute force: sweep every cutoff and price each one.

```r
# Try every cutoff between the scores and price each one.
grid <- seq(0.005, 0.995, by = 0.01)
cost <- sapply(grid, total_cost)

grid[which.min(cost)]                # the cheapest cutoff
#> [1] 0.165
min(cost)                            # its total cost
#> [1] 100
```

```r
t_star <- cost_FP / (cost_FP + cost_FN)   # the closed-form optimum
t_star
#> [1] 0.1666667
```

The brute-force sweep bottoms out at 0.165, right where the formula points (0.167). Standing there instead of at 0.5 changes everything about this batch:

```r
# Same model, same scores. Only the cutoff moved.
rbind(
  "cutoff 0.50" = c(caught = sum(score >= 0.50 & actual == 1),
                    missed = sum(score <  0.50 & actual == 1),
                    alarms = sum(score >= 0.50 & actual == 0)),
  "cutoff 0.17" = c(caught = sum(score >= 0.17 & actual == 1),
                    missed = sum(score <  0.17 & actual == 1),
                    alarms = sum(score >= 0.17 & actual == 0))
)
#>             caught missed alarms
#> cutoff 0.50      5      3      0
#> cutoff 0.17      8      0      1
```

[KEY INSIGHT]
Moving the cutoff from 0.50 to 0.17 caught all eight frauds instead of five, at the price of one false alarm. Total cost fell from $1,500 to $100. Same model, same data, no retraining, one number changed.

=== step === tryit
::eyebrow Your turn
## Write the optimal-cutoff formula

The cost-optimal threshold is the false-alarm cost divided by the sum of both error costs. Fill in the denominator, then check it.

```r
cost_FP <- 100    # a false alarm
cost_FN <- 500    # a missed fraud
t_star <- cost_FP / (____)   # the cost-optimal cutoff
t_star
```
::check {"regex":"cost_F[PN]\\s*\\+\\s*cost_F[PN]","gate":true,"difficulty":"beginner","ok":"Right: cost_FP / (cost_FP + cost_FN) = 100 / 600 = 0.167. As the miss cost grows, that fraction shrinks toward 0, pushing the cutoff down.","no":"The denominator is the SUM of both costs: cost_FP + cost_FN. So t_star = cost_FP / (cost_FP + cost_FN)."}
::solution
```r
cost_FP <- 100
cost_FN <- 500
t_star <- cost_FP / (cost_FP + cost_FN)
t_star
#> [1] 0.1666667
```

=== step === quiz
::eyebrow Check yourself
## Push the costs to an extreme

A hospital screens for a serious disease. A missed case (false negative) is catastrophic, while a false alarm just triggers a cheap follow-up test, so \(C_{FN}\) is enormous next to \(C_{FP}\). Using \(t^* = C_{FP} / (C_{FP} + C_{FN})\), where does the optimal threshold go?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Toward 0, so you flag almost everyone for follow-up ::ok Exactly. As \(C_{FN}\) dwarfs \(C_{FP}\), the fraction \(C_{FP}/(C_{FP}+C_{FN})\) shrinks toward 0. You set a very low bar: catch every possible case and accept many false alarms, because a miss is the disaster.
- Toward 1, so you flag almost no one ::no That is the opposite of what the costs demand. Flagging almost no one maximizes the catastrophic misses. The huge \(C_{FN}\) pushes \(t^*\) DOWN, not up.
- It stays at 0.5 regardless of the costs ::no 0.5 is optimal only when the two errors cost the same. Here they differ by a huge factor, so \(t^*\) moves far off 0.5.

=== step === concept
::eyebrow Know your tool
## When moving the threshold is the right fix

Threshold-moving is the cheapest tool in the imbalance toolkit: no retraining, no new data, one number. But it rests on assumptions worth stating out loud.

1. **It needs trustworthy probabilities.** \(t^*\) is only truly optimal if the model's scores are calibrated, so a predicted 0.2 really does mean a 20% chance. Resampling (Lesson 2) and many models distort that. When the probabilities are off, the sweep still finds a good cutoff empirically, but the formula's value can be wrong. Fixing the probabilities themselves is Lesson 5.
2. **It needs known, stable costs.** If a chargeback is $500 today and $50 next quarter, so is the optimal cutoff. Revisit \(t^*\) when the costs change.
3. **Pick the threshold on validation data, never the test set.** Sweeping thresholds is a form of tuning. Choose the cutoff on a validation split, then report performance on an untouched test set, exactly the discipline from Lesson 2.

[WARNING]
Threshold-moving changes *decisions*, not the *model*. If the ranking of scores is poor (a low AUC), no cutoff will save it, and you need a better model, more data, or the class weights and resampling from earlier lessons. Moving the threshold only helps when the model already separates the classes reasonably well.

=== step === concept
::eyebrow Go deeper
## References

- [Elkan (2001), The Foundations of Cost-Sensitive Learning (IJCAI)](https://cseweb.ucsd.edu/~elkan/rescale.pdf) - the paper that derives the optimal threshold from a cost matrix, the source of the \(t^*\) formula.
- [Provost and Fawcett (2001), Robust Classification for Imprecise Environments, Machine Learning 42](https://doi.org/10.1023/A:1007601015854) - how to choose an operating point when costs and class rates are uncertain.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - a gentle treatment of thresholds, confusion matrices and the sensitivity/specificity trade-off.
- [probably: post-processing class probabilities (tidymodels)](https://probably.tidymodels.org/) - the R package that tunes a classification threshold for your chosen metric, the production version of the sweep you did here.

=== step === complete
## Lesson 3 complete

You saw that a classifier outputs probabilities, that the 0.5 cutoff is an arbitrary default, and that when a miss costs far more than a false alarm you move that cutoff down. You priced a batch in R, swept the threshold to the cheapest point, and derived the same answer directly with \(t^* = C_{FP}/(C_{FP}+C_{FN})\), cutting this batch's cost from $1,500 to $100 without retraining.

One cutoff is one point on a curve. Next you will study the whole curve.

Next, Lesson 4: ROC, PR, Lift and Gains Curves. You will see every threshold at once, and learn why a precision-recall curve tells the truth about a rare positive where an ROC curve can flatter it.

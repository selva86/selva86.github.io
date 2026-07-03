---
title: "Robustness and Drift Lesson 4: Out-of-Distribution and Novelty Detection"
catalog_blurb: "Flag inputs unlike anything the model trained on, before you trust its score."
description: "A model answers even for inputs unlike anything it trained on. Flag them with a Mahalanobis novelty score, a chi-square cutoff, and the false-alarm tradeoff."
keywords: "out-of-distribution detection, novelty detection, Mahalanobis distance, anomaly detection, chi-square threshold, OOD, false positive rate, model monitoring, R"
post_type: "LESSON"
curriculum_id: "6.190.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "4"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "Group-Robustness-and-DRO.html"
course_prev: "Adapting-to-Drift-Reweighting-and-Retraining.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Out-of-Distribution and Novelty Detection

Lessons 2 and 3 watched the whole stream of transactions. The Population Stability Index and the KS test asked "has the population moved?", and when it had, you reweighted or retrained. Those tools answer a question about the crowd.

This lesson asks a sharper question about a single face in that crowd: is *this one* transaction unlike anything Nadia's fraud model ever trained on? A drift alarm can stay silent while one genuinely strange input slips through, and the model will score it anyway, with a confidence it has not earned.

Drag the cutoff in the panel below. Two piles of novelty scores sit side by side, ordinary transactions and genuinely strange ones, and a single line decides which get flagged. Move it and watch two numbers fight each other: false alarms on the left, catches on the right.

By the end of this lesson you will be able to:

- Score how unusual a single input is with the **Mahalanobis distance**, and say why it beats plain straight-line distance
- Turn that score into a flag with a **chi-square threshold**, and read the false-positive rate a cutoff buys
- Navigate the **false-positive vs detection-rate tradeoff** the threshold controls
- Know when the method **breaks**, and why a flag means "do not trust the model here", not "this is fraud"

**Prerequisites:** you finished [Lesson 3](Adapting-to-Drift-Reweighting-and-Retraining.html), you can fit and read a classifier, and you know roughly what a covariance and a normal distribution are.

::widget ood-detect {}

=== step === concept
::eyebrow The problem
## A model will answer anything you ask it

Here is the uncomfortable truth about Nadia's fraud model, or any trained classifier: it never says "I have never seen anything like this." Hand it any row of numbers and it returns a crisp probability, whether that row looks like its training data or like nothing on Earth.

Let us watch it happen. We rebuild Nadia's world from scratch (each lesson runs in its own R session). Legitimate customers show a pattern: the longer an account has existed, the more it tends to spend, because trust and spending grow together. So `account_age` and `amount` move together, a correlation of about 0.8.

```r
set.seed(1)
n <- 2000
account_age <- pmax(round(rnorm(n, 500, 150)), 1)                        # days since the account signed up
amount      <- pmax(round(90 + 0.34 * account_age + rnorm(n, 0, 40)), 5) # dollars on this order
train <- data.frame(account_age = account_age, amount = amount)
train$fraud <- rbinom(n, 1, plogis(-3.2 - 0.004 * (account_age - 500) + 0.006 * (amount - 260)))
round(c(cor = cor(train$account_age, train$amount), fraud_rate = mean(train$fraud)), 2)
#>        cor fraud_rate
#>       0.80       0.04
```

Now train the fraud model and ask it about a transaction it has never seen the likes of: a brand-new account (120 days old) placing a large order ($360). Old accounts spend $360 all the time, and new accounts exist all the time, but a new account spending $360 almost never happens in the training data.

```r
fraud_model <- glm(fraud ~ account_age + amount, data = train, family = binomial)
new_big <- data.frame(account_age = 120, amount = 360)   # young account, large order
round(predict(fraud_model, new_big, type = "response"), 3)
#>     1
#> 0.476
```

The model reports **47.6% fraud** for this transaction, twelve times its 4% base rate, and delivers that number with a completely straight face. But it is extrapolating a straight-line rule far outside anything it was fit on. Nothing in that `0.476` tells Nadia the model is guessing.

[KEY INSIGHT]
A classifier always outputs a score; it has no built-in sense of "this input is unlike my training." Novelty detection is the missing signal: a separate check that asks whether an input is close enough to the training data for the prediction to be trusted at all.

=== step === concept
::eyebrow The score
## How far from normal? The Mahalanobis distance

To flag the strange transaction, put a number on *how unusual* it is. The natural idea: measure how far the new point sits from the cloud of training points. But "far" needs care, because straight-line (Euclidean) distance to the center is wrong twice over.

First, the features live on different scales: account age runs into the hundreds of days, order amounts into the hundreds of dollars, so a raw distance is dominated by whichever number happens to be bigger. Second, and more subtly, the features are **correlated**. Points hug a diagonal ridge (old-and-big, young-and-small). A point can sit close to the center yet fall far off that ridge, and it is exactly those off-the-ridge points that are novel.

The **Mahalanobis distance** fixes both at once. Write \(x\) for the new point (a vector of its feature values), \(\mu\) for the mean of the training data (the center of the cloud), and \(\Sigma\) for its covariance matrix (a small table holding each feature's variance and the covariance between them). The squared Mahalanobis distance is

\[ D^2(x) = (x - \mu)^{\top}\, \Sigma^{-1}\, (x - \mu). \]

The inverse covariance \(\Sigma^{-1}\) is the whole trick. It rescales every direction by how much the training data actually spreads that way and rotates the axes onto the cloud's own diagonal, so \(D^2\) measures distance in "standard deviations along the cloud's natural shape." A point one ridge-step out scores small; a point that breaks the correlation scores large. (Plain Euclidean distance is the special case \(\Sigma = I\): all features independent and unit-scaled.)

In R, `mahalanobis()` does the algebra. First estimate the center and shape:

```r
feats <- c("account_age", "amount")
mu <- colMeans(train[, feats])   # the centre of the training cloud
S  <- cov(train[, feats])        # variances on the diagonal, the covariance off it
round(S)
#>             account_age amount
#> account_age       24203   8436
#> amount             8436   4651
```

That off-diagonal `8436` is the positive covariance: age and amount rise together. Now score two transactions, a routine one and our young-account-big-order one:

```r
mahal <- function(df) mahalanobis(df[, feats], center = mu, cov = S)   # squared Mahalanobis distance
probe <- data.frame(account_age = c(550, 120), amount = c(280, 360),
                    row.names = c("routine", "young+big"))
round(cbind(probe, D2 = mahal(probe)), 2)
#>           account_age amount    D2
#> routine           550    280  0.11
#> young+big         120    360 37.30
```

The routine transaction scores `0.11`; the young-account-big-order one scores `37.30`, hundreds of times larger. Compare that to what a scale-corrected but correlation-blind straight-line distance would have said:

```r
sds <- sqrt(diag(S))
zsq <- sweep(sweep(probe[, feats], 2, mu), 2, sds, "/")^2   # standardized coordinates, squared
round(cbind(scaled_euclidean = sqrt(rowSums(zsq)), mahalanobis = sqrt(mahal(probe))), 2)
#>           scaled_euclidean mahalanobis
#> routine               0.45        0.34
#> young+big             2.84        6.11
```

Straight-line distance rates the strange point a mild `2.84` standard deviations out, a shrug. Mahalanobis, which knows age and amount should move together, rates it `6.11`, a genuine alarm. The picture shows why: the point lands inside each axis' range but well outside the joint ellipse.

```r
library(ggplot2)
probe$label <- c("routine", "young + big")
ggplot(train, aes(account_age, amount)) +
  geom_point(colour = "grey72", alpha = 0.5, size = 0.9) +
  stat_ellipse(type = "norm", level = 0.99, colour = "steelblue", linewidth = 1) +
  geom_point(data = probe, aes(account_age, amount), colour = "firebrick", size = 3) +
  geom_text(data = probe, aes(label = label), colour = "firebrick", vjust = -1, size = 3.4) +
  labs(title = "The training cloud and its 99% ellipse",
       subtitle = "the young+big point sits inside each axis range but outside the joint ellipse",
       x = "account age (days)", y = "order amount ($)")
```

=== step === quiz
::eyebrow Check yourself
## Why is it flagged?

The `young+big` transaction is a 120-day-old account (on the young side, but real accounts that age exist) placing a $360 order (an amount older accounts spend every day). Neither value is off the charts on its own. So why does the Mahalanobis detector score it a glaring `37.30`?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Because Mahalanobis judges the pair against the training correlation: new accounts almost never spend that much, so the combination is far out even though each value alone is common ::ok Exactly. The inverse covariance encodes "age and amount rise together." Given how young this account is, $360 is astronomically more than such accounts ever spend, so the joint point breaks the ridge and scores high, though a per-feature range check waves both values through.
- Because $360 is an unusually large order that any outlier check would catch ::no $360 is ordinary: older accounts spend that routinely, and the `routine` probe ($280 at 550 days) scored only 0.11. It is the pairing with a young account, not the amount, that is strange.
- Because a 120-day-old account is inherently suspicious ::no Account age alone is not the flag. The same young account placing a small, ridge-consistent order would score low. Mahalanobis reacts to the joint pattern, not to either feature by itself.

=== step === concept
::eyebrow The cutoff
## From a distance to a flag: the chi-square line

A score of `37.30` is clearly high and `0.11` is clearly low, but production needs a rule, not a judgment call: flag the transaction when \(D^2\) exceeds some threshold. How far is too far?

Here a clean fact rescues you. If the training data is roughly multivariate normal (one elliptical Gaussian blob), then the squared Mahalanobis distance of a genuine inlier follows a **chi-square distribution** with degrees of freedom equal to the number of features:

\[ D^2 \;\sim\; \chi^2_{p}, \qquad p = \text{number of features}. \]

That gives you a principled cutoff for free. Pick a percentile of \(\chi^2_p\), and the fraction of genuine inliers that land beyond it is exactly one minus that percentile, which is your **false-positive rate**: the share of ordinary transactions you will wrongly flag. `qchisq()` returns the cutoff.

```r
thr <- qchisq(0.99, df = 2)                      # 99th percentile of chi-square, p = 2 features
round(c(threshold = thr, false_positive_rate = mean(mahal(train) > thr)), 3)
#>           threshold false_positive_rate
#>               9.210               0.007
```

The 99th-percentile cutoff is `9.21`, and it wrongly flags `0.007` of the real training data, about the 1% the percentile promised. (A touch under, because account age is not perfectly Gaussian, so the chi-square approximation is close but not exact. The cutoff is a principled starting point, not a guarantee.)

[NOTE]
The degrees of freedom is the feature count \(p\), not the sample size. With two features here, `df = 2`; with ten features you would use `df = 10`. Get that wrong and every threshold is off.

=== step === tryit
::eyebrow Your turn
## Set the cutoff for a false-alarm budget

Nadia can tolerate wrongly flagging at most about **1%** of genuine transactions for review. Fill in the chi-square percentile that delivers that false-positive rate, then read the realized rate off the training data.

```r
thr <- qchisq(____, df = 2)
mean(mahal(train) > thr)      # should land near 0.01
```
::check {"regex":"0\\.99","gate":true,"difficulty":"intermediate","ok":"That is it: the 99th percentile leaves about 1% of genuine inliers above the line, so qchisq(0.99, df = 2) is the cutoff for a 1% false-positive budget. The realized rate here is 0.007, a hair under, because the data is not perfectly Gaussian.","no":"A 1% false-positive rate means you keep the lowest 99% of genuine scores below the line: use the 99th percentile, qchisq(0.99, df = 2). The 0.95 cutoff would flag about 5%."}
::solution
```r
thr <- qchisq(0.99, df = 2)   # 99th percentile -> about 1% of inliers exceed it
mean(mahal(train) > thr)
#> [1] 0.007
```

=== step === widget
::eyebrow The tradeoff
## Strict misses, loose cries wolf

The threshold is a single dial, and turning it trades two things that pull against each other. Tighten it (a high percentile) and you almost never bother an analyst with a false alarm, but you also let subtle novelties slip through unflagged. Loosen it and you catch everything odd, at the cost of drowning the team in false positives on perfectly ordinary transactions.

There is no "correct" setting, only the balance that fits the cost of a missed novelty against the cost of a wasted review. Drag the cutoff below between loose, medium and strict, and read both rates at once: the false-positive rate on genuine inliers, and the detection rate on true out-of-distribution points.

::widget ood-detect {}

=== step === concept
::eyebrow The tradeoff, measured
## What the dial costs, on Nadia's data

Feel is good; numbers are better. Take a batch of genuinely novel transactions, newer accounts spending well above what their age predicts, and sweep the same three cutoffs across them. For each, record how many real inliers we wrongly flag (false positives) and how many true novelties we catch (detection).

```r
set.seed(7)
novel <- data.frame(account_age = rnorm(500, 260, 55),   # newer accounts...
                    amount      = rnorm(500, 310, 45))    # ...spending well above their ridge
round(sapply(c(loose = 0.95, medium = 0.99, strict = 0.999), function(p) {
  cut <- qchisq(p, df = 2)
  c(false_positive = mean(mahal(train) > cut),
    detection      = mean(mahal(novel) > cut))
}), 3)
#>                loose medium strict
#> false_positive 0.052  0.007  0.001
#> detection      0.830  0.674  0.424
```

Read the two rows together. Going from loose to strict, false positives fall from 5.2% to 0.1%, a real win for the analysts' inbox. But detection falls with it, from 83% down to 42%: the strict cutoff quietly lets more than half the true novelties through. Every step tighter buys fewer false alarms by paying in missed catches. That is the whole decision, and it belongs to whoever owns the cost of each error, not to a default.

=== step === concept
::eyebrow Know the edges
## Where this breaks, and what a flag really means

Mahalanobis novelty detection rests on one strong assumption: the training data is a single elliptical Gaussian blob. When that holds it is fast, needs no labels, and comes with a principled chi-square cutoff. When it does not, it fails quietly, so know the edges.

| Failure mode | What goes wrong | Reach for instead |
|---|---|---|
| Several clusters (multimodal) | the mean sits between clusters, in a gap where no real data lives, so genuine points look "far" | **kNN distance** to training points, or a per-cluster / mixture model |
| Non-elliptical shape | curved or heavy-tailed data breaks the single-ellipse picture | **isolation forest**, kernel density, or a deep reconstruction score |
| Many features (high-dim) | the covariance is hard to estimate and everything looks equidistant | dimensionality reduction first, or a tree-based detector |

[WARNING]
A flag is not a fraud verdict. Out-of-distribution means only that the model has no basis for its prediction here, not that the input is malicious. Our `young+big` transaction may be a real customer behaving in a new way. Auto-declining every flagged transaction as fraud punishes exactly your most novel, and sometimes best, customers.

[KEY INSIGHT]
Treat a novelty flag as an **abstain signal**: the model should decline to decide, and the input should route to a human, a fallback rule, or a request for more information. The value of OOD detection is knowing *when not to trust the score*, which is precisely what a bare classifier can never tell you.

=== step === quiz
::eyebrow Check yourself
## The "no false alarms" mandate

Nadia's manager issues an order: "Set the novelty cutoff so strict we never raise a false alarm, and auto-decline anything it does flag as fraud." Nadia pushes back on both halves. What is the strongest correction?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The plan is fine: the strictest cutoff wastes the least analyst time, and a flagged input is by definition anomalous, so auto-declining it is safe ::no Both halves are wrong. The strictest cutoff also catches the fewest true novelties (here 99.9% cut detection to 42%), and an out-of-distribution input is not the same as fraud.
- Only the auto-decline is wrong; a near-zero false-positive cutoff is otherwise the right default because false alarms are the main cost ::no The cutoff half is also wrong: pushing false positives toward zero pushes detection down with it, so real novelties sail through unflagged. There is no free lunch on that dial.
- Both halves are wrong: a near-zero-false-alarm cutoff also collapses the detection rate, and an OOD flag means "the model has no basis here, so escalate", not "this is fraud, auto-decline" ::ok Exactly. The threshold trades false positives against detection, so demanding zero false alarms guarantees you miss most novelties. And a flag is an abstain signal, so route it to a human or a fallback rather than auto-rejecting a possibly legitimate new customer.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Chandola, Banerjee and Kumar (2009), Anomaly Detection: A Survey, ACM Computing Surveys](https://doi.org/10.1145/1541880.1541882) - the field map: how distance, density and model-based novelty methods relate.
- [Lee, Lee, Lee and Shin (2018), A Simple Unified Framework for Detecting Out-of-Distribution Samples and Adversarial Attacks](https://arxiv.org/abs/1807.03888) - the exact idea you built (Mahalanobis distance as a novelty score) applied inside deep networks.
- [Hendrycks and Gimpel (2017), A Baseline for Detecting Misclassified and Out-of-Distribution Examples in Neural Networks](https://arxiv.org/abs/1610.02136) - shows why a classifier's own confidence is not enough, motivating a separate detector.
- [Liu, Ting and Zhou (2008), Isolation Forest, IEEE ICDM](https://doi.org/10.1109/ICDM.2008.17) - the go-to alternative when your training data is not one Gaussian blob.
- [R `mahalanobis` (stats package docs)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mahalanobis.html) - the function used here, with its exact arguments.

=== step === complete
## Lesson 4 complete

You can now ask the sharp, single-input question the drift monitors could not. Score how unusual a transaction is with the **Mahalanobis distance**, which measures distance in the training cloud's own shape so it catches points that break the correlation even when each feature looks ordinary. Turn that score into a flag with a **chi-square cutoff**, whose percentile sets your false-positive rate directly. Tune the **false-positive vs detection-rate tradeoff** to the real cost of each error. And treat a flag as an **abstain signal**, not a fraud verdict, while remembering the method assumes one Gaussian blob and breaks on multimodal or high-dimensional data.

So far every failure has been about the data moving or an input being strange. Next, Lesson 5: Group Robustness and DRO. A model can post excellent *average* accuracy while quietly failing an entire subgroup, and a spurious feature that helps most users can reverse for a minority. You will measure worst-group accuracy and meet distributionally robust optimization, which trades a little average accuracy to lift the group the average was hiding.

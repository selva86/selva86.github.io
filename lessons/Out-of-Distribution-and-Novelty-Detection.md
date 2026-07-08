---
title: "Robustness and Drift Lesson 4: Out-of-Distribution and Novelty Detection"
catalog_blurb: "Flag inputs unlike anything the model saw, and tune the false-alarm rate."
description: "Drift watches the stream; novelty detection judges one input. Score it by Mahalanobis distance, set a chi-square threshold, and trade false alarms for catches."
keywords: "out-of-distribution detection, novelty detection, OOD, Mahalanobis distance, novelty score, anomaly threshold, chi-square threshold, false positive rate, detection rate, R"
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

In Lesson 3, Nadia's monitor did its job: the Population Stability Index caught the whole stream of transactions drifting, and you learned the two fixes, reweight or retrain. But drift is a question about the *crowd*. It asks whether the population as a whole has moved.

This lesson asks a sharper, lonelier question about a *single* transaction: is **this one** unlike anything the model ever trained on? A drift monitor would happily wave through one bizarre payment hiding among a thousand ordinary ones, because on average the batch still looks fine. Novelty detection is the per-input alarm that catches the individual oddity.

The widget below shows the score you are about to build. The pile on the left is ordinary transactions; the pile on the right is genuinely strange ones. Toggle the cutoff between loose, medium and strict and watch the two numbers move: every novelty detector lives on that one dial, and by the end of this lesson you will set it on purpose.

By the end of this lesson you will be able to:

- Explain why a trained model returns a confident answer even on an input unlike anything it saw, and why that is dangerous
- Score how unusual a single input is with the **Mahalanobis distance**, and say why it beats a per-feature or straight-line (Euclidean) check
- Turn that score into a calibrated flag with a **chi-square threshold**, and read the **false-positive versus detection-rate** tradeoff the threshold sets
- Name where a single-Gaussian novelty score breaks, and what to reach for instead

**Prerequisites:** you finished [Lesson 3: Adapting to Drift](Adapting-to-Drift-Reweighting-and-Retraining.html) (drift is a stream-level question; PSI and the two-sample tests look at one feature at a time), you can fit and read a logistic regression, and you know what a covariance and a correlation are.

::widget ood-detect {}

=== step === concept
::eyebrow Why we need a second opinion
## The model that cannot say "I have never seen this"

Here is the uncomfortable truth about Nadia's fraud model, and about almost every model in production: **it will answer any question you ask it, even a nonsensical one.** Hand a logistic regression a transaction from a planet it has never visited and it will still compute a tidy probability and hand it back with a straight face. It has no way to say "this input is unlike my training data, so do not trust me here."

Let us watch it happen. We rebuild Nadia's world from scratch (each lesson runs in its own R session). Every transaction has two features: `account_age`, the days since the customer signed up, and `amount`, the size of the order in dollars. In her real customer base these two move together, because older accounts tend to place bigger orders, so the features carry a positive correlation of about 0.79.

```r
set.seed(1)
n <- 2000
account_age <- pmax(round(rnorm(n, 500, 180)), 5)                          # days since sign-up
amount      <- round(pmax(50 + 0.42 * account_age + rnorm(n, 0, 60), 1), 1) # order size, dollars
train <- data.frame(account_age = account_age, amount = amount,
                    fraud = rbinom(n, 1, plogis(-5.2 + 0.006 * amount)))
model <- glm(fraud ~ account_age + amount, data = train, family = binomial)

young_big <- data.frame(account_age = 90, amount = 360)   # a brand-new account, a large order
round(unname(predict(model, young_big, type = "response")), 3)
#> [1] 0.065
```

The model reads that transaction, a 90-day-old account placing a 360-dollar order, and calmly returns a fraud probability of **0.065**. Approve it. No hesitation, no warning.

But look at what that transaction actually is. Nadia's accounts range from days old to over three years (age runs 5 to 1186 days), and orders routinely top 600 dollars, so *taken one at a time* neither number is strange. What is strange is the **pairing**: in the training data a barely-90-day-old account almost never places a 360-dollar order, because young accounts and big orders rarely go together. The model has essentially no examples like this, so its 0.065 is not a measurement, it is an extrapolation dressed up as one.

[KEY INSIGHT]
A trained classifier interpolates confidently and extrapolates confidently, and from the outside the two look identical. It cannot flag its own blind spots. Novelty detection is a separate model whose only job is to answer "have we seen anything like this before?"

=== step === concept
::eyebrow The plan
## Novelty detection in three moves

We need a signal that is independent of the fraud model and answers one question: how far is this new point from the region where the training data actually lived? Every novelty detector, from the simplest to the deep-learning kind, follows the same three moves.

::widget process-flow {"steps":[{"title":"Fit the shape","sub":"summarise where the training data lived: its centre and its spread"},{"title":"Score the point","sub":"measure how far a new input sits from that region, the novelty score"},{"title":"Threshold","sub":"flag the point when its score crosses a cutoff you choose"}]}

Those three moves hide three real decisions, and the rest of this lesson is about making each one well: what "shape" to fit (a single blob, here), how to measure "far" (this is where a naive distance fails), and where to put the cutoff (the false-alarm dial from the cover). We take them in order.

=== step === concept
::eyebrow The obvious idea, and why it fails
## Distance, measured naively, misses the point

The natural first move is a per-feature rule: flag a transaction if any feature is too many standard deviations from its average. Let us try exactly that on the suspicious young-and-big transaction, scoring each feature on its own.

```r
mu  <- colMeans(train[, c("account_age", "amount")])       # centre of the training cloud
sds <- apply(train[, c("account_age", "amount")], 2, sd)   # spread of each feature
round((unlist(young_big) - mu) / sds, 2)                   # how many SDs out, per feature
#> account_age      amount
#>       -2.19        0.99
```

Each feature, on its own, is unremarkable. The account is 2.19 standard deviations young, and the order amount is not even one standard deviation above average (0.99). A per-feature rule with the usual "flag beyond 3 standard deviations" cutoff waves this transaction straight through, exactly as the fraud model did.

The straight-line (Euclidean) distance has the same blind spot, plus one more. It would combine those two deviations but still land short of any sensible cutoff, and worse, it treats a one-day change in `account_age` as interchangeable with a one-dollar change in `amount`, when the two features live on completely different scales.

Both naive checks miss the same thing: they look at the features **one at a time** and never ask whether the *combination* is plausible. The whole signal here is in the combination. A young account is fine. A big order is fine. A young account *and* a big order, together, is the anomaly, because in the training data those two almost never co-occur.

[KEY INSIGHT]
Anomalies often hide in the correlation between features, not in any single feature. A detector that scores features independently is blind to exactly the novelties that matter most.

=== step === concept
::eyebrow The right ruler
## Mahalanobis distance

The fix is a distance that knows the *shape* of the training cloud: how spread out each feature is, and how the features move together. That is the **Mahalanobis distance**, and it is the single most useful idea in this lesson.

Start with the intuition. Picture the training transactions as a tilted, elliptical cloud: the tilt is the positive correlation (age and amount rise together), and the width in each direction is that feature's spread. Euclidean distance draws *circles* of "equally far" around the centre. Mahalanobis draws *ellipses* that match the cloud, stretched along the correlation and squeezed across it. A point can be Euclidean-close to the centre yet Mahalanobis-far, because it sits off the ellipse, in a direction the data never goes.

Now the formalism. Write \(x\) for the new point's two features, \(\mu\) (mu) for the mean vector of the training features (the centre of the cloud), and \(S\) for their covariance matrix (a 2-by-2 table holding each feature's variance on the diagonal and the covariance between them off it). The squared Mahalanobis distance is

\[ D^2(x) \;=\; (x - \mu)^{\top}\, S^{-1}\, (x - \mu). \]

Read it piece by piece. The vector \(x - \mu\) is how far the point is from the centre in each feature. Multiplying by \(S^{-1}\), the inverse of the covariance matrix, is the crucial step: it divides out each feature's scale (so dollars and days become comparable) **and** undoes the correlation (so a point off the ellipse's tilt is penalised). If you set the off-diagonal of \(S\) to zero, ignoring correlation, \(D^2\) collapses to the plain sum of squared per-feature z-scores, the naive check from the last step. The off-diagonal is the whole difference.

Let us compute it on two transactions: a `routine` one on the ridge (an older account, a mid-sized order) and our `young_big` outlier.

```r
S <- cov(train[, c("account_age", "amount")])              # covariance matrix (the cloud's shape)
probes <- rbind(routine = c(520, 280), young_big = c(90, 360))
colnames(probes) <- c("account_age", "amount")
round(mahalanobis(probes, center = mu, cov = S), 2)        # squared Mahalanobis distance
#>   routine young_big
#>      0.04     24.57
```

The routine transaction scores 0.04, right at the centre. The young-and-big transaction scores **24.57**. To prove the correlation term is doing all the work, score the same two points while ignoring it, using just the summed squared z-scores from before.

```r
z <- scale(probes, center = mu, scale = sds)   # per-feature z-scores, correlation ignored
round(rowSums(z^2), 2)                          # squared distance that ignores the tilt
#>   routine young_big
#>      0.05      5.77
```

Ignore the correlation and the outlier scores only **5.77**. Account for it and the same point scores **24.57**, more than four times as far. Same transaction, same two features: the only difference is whether the ruler knows that young accounts and big orders do not go together.

We can see the whole picture at once. Here is the training cloud with the ellipse that Mahalanobis treats as "equally novel", and our two probe points laid on it.

```r
library(ggplot2)
probe_pts <- data.frame(account_age = c(520, 90), amount = c(280, 360),
                        kind = c("routine", "young + big"))
ggplot(train, aes(account_age, amount)) +
  geom_point(alpha = 0.12, colour = "grey55") +
  stat_ellipse(type = "norm", level = 0.99, colour = "firebrick", linewidth = 0.9) +
  geom_point(data = probe_pts, aes(colour = kind), size = 4) +
  labs(title = "The 99% novelty boundary is an ellipse, not a circle",
       x = "account age (days)", y = "order amount (dollars)", colour = NULL)
```

The routine point sits comfortably inside the ellipse; the young-and-big point sits far outside it, out in a direction the training data simply never went, even though a box drawn around each feature's ordinary range would contain it.

=== step === quiz
::eyebrow Check yourself
## Why is it flagged?

The young-and-big transaction has an `account_age` 2.19 standard deviations below average and an `amount` just 0.99 standard deviations above it, yet its Mahalanobis distance is huge (24.57, well past any sensible cutoff). Which explanation is right?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The 360-dollar order is simply a very large amount, so the amount feature alone triggers the flag ::no At 0.99 standard deviations above the mean, a 360-dollar order is thoroughly ordinary; plenty of transactions are far larger. No single feature is extreme here.
- A 90-day-old account is inherently suspicious, so the young age alone triggers the flag ::no A young account on its own is common and scores low; the same 90-day account placing a *small* order would sail through. Age alone is not the signal.
- The *pairing* is off: young accounts and big orders are positively correlated in training, so this combination is rare, and Mahalanobis distance measures exactly that joint implausibility ::ok Exactly. Each feature is ordinary alone; it is their combination that never occurs in training. Mahalanobis distance, through the inverse covariance, scores that off-the-ellipse direction as far, which a per-feature check cannot see.

=== step === concept
::eyebrow From a score to a decision
## A threshold you can trust: the chi-square cutoff

A distance is not yet a decision. We need a line: score above it, flag the transaction; below it, let the transaction pass. Picking that line by eye ("24 seems high?") is guesswork. There is a principled choice.

Here is the one fact to take on trust. If the training features really do follow a (multivariate) normal distribution, then the squared Mahalanobis distance of an ordinary in-distribution point is not just "some number", it follows a known distribution: the **chi-square distribution** with degrees of freedom equal to the number of features. We have two features, so \(D^2 \sim \chi^2_2\).

That hands us a calibrated cutoff for free. If we set the threshold at the 99th percentile of \(\chi^2_2\), then by construction only about **1%** of genuine, in-distribution transactions will land above it. The percentile you choose *is* the false-positive rate you agree to pay: the fraction of honest customers you accept wrongly flagging. In R, `qchisq` gives that percentile.

```r
thr <- qchisq(0.99, df = 2)      # 2 features, so 2 degrees of freedom
round(thr, 2)
#> [1] 9.21
score <- function(pts) mahalanobis(pts, center = mu, cov = S)
round(mean(score(train[, c("account_age", "amount")]) > thr), 3)   # realised false-positive rate
#> [1] 0.005
```

The cutoff is **9.21**. The routine transaction (0.04) is far below it; the young-and-big transaction (24.57) is far above it, so it is flagged, exactly as we wanted. And when we score all of Nadia's real training transactions, **0.5%** land above the line, close to the 1% the theory promised. It is a touch under because `account_age` is not perfectly normal, so treat the chi-square false-positive rate as a good approximation, not a guarantee, and always sanity-check it on real data as we just did.

=== step === widget
::eyebrow The dial
## False alarms versus catches

The threshold is a dial, and it has two ends. Tighten it (a higher percentile, a bigger cutoff) and you flag fewer honest customers, but you also miss the subtler novelties whose scores are only moderately high. Loosen it and you catch almost every oddity, but you drown the fraud team in false alarms on perfectly good transactions.

There is no single right setting, only the tradeoff. Toggle the cutoff below between loose, medium and strict, and read both numbers off the two score histograms: the false-positive rate on genuine inliers (the pile on the left) and the detection rate on true out-of-distribution points (the pile on the right).

::widget ood-detect {}

A strict cutoff is right when a false alarm is expensive, because you do not want to freeze a good customer's account over nothing. A loose cutoff is right when a miss is expensive, because a novel input you fail to flag reaches a model that has no basis to judge it. Nadia's job is to decide which of those two errors hurts more, and to set the dial accordingly.

=== step === concept
::eyebrow On real batches
## Measuring the tradeoff on Nadia's data

Let us make that tradeoff concrete on held-out data rather than a slider. We draw two fresh batches: `test_in`, more ordinary traffic from the same distribution as training, and `test_ood`, a novel wave of younger accounts placing larger orders (say a promotion that pulled in new customers who behave unlike the old ones). Then we score both and count what crosses the 9.21 line.

```r
set.seed(7)
gen_in <- function(m) {                                        # fresh in-distribution traffic
  a <- pmax(round(rnorm(m, 500, 180)), 5)
  data.frame(account_age = a, amount = round(50 + 0.42 * a + rnorm(m, 0, 60), 1))
}
test_in  <- gen_in(2000)
test_ood <- data.frame(account_age = pmax(round(rnorm(2000, 200, 50)), 5),   # younger accounts...
                       amount      = round(rnorm(2000, 330, 60), 1))          # ...ordering big
round(c(false_positive = mean(score(test_in)  > thr),
        detection      = mean(score(test_ood) > thr)), 3)
#> false_positive      detection
#>          0.004          0.721
```

At the 99% cutoff the detector flags **0.4%** of the ordinary traffic (false positives, close to the promised 1%) and catches **72%** of the genuinely novel transactions. Now sweep the cutoff and watch the tradeoff move.

```r
for (p in c(0.95, 0.99, 0.999)) {
  cutoff <- qchisq(p, df = 2)
  cat(sprintf("percentile %.3f  cutoff %5.2f  FPR %.3f  detection %.3f\n",
              p, cutoff, mean(score(test_in) > cutoff), mean(score(test_ood) > cutoff)))
}
#> percentile 0.950  cutoff  5.99  FPR 0.041  detection 0.891
#> percentile 0.990  cutoff  9.21  FPR 0.004  detection 0.721
#> percentile 0.999  cutoff 13.82  FPR 0.000  detection 0.446
```

Read the two right-hand columns against each other. Loosen to the 95th percentile and detection climbs to **89%**, but false positives quadruple to about 4%. Tighten to the 99.9th percentile and false positives all but vanish, but detection falls to **45%**, so you now miss more than half the novelties. That is the dial from the widget, in numbers, on real batches.

=== step === tryit
::eyebrow In R
## Set the strict cutoff

`score()` and the two batches are already in memory from the last step. Your turn: set the strict cutoff at the **99.9th percentile** of the chi-square distribution with 2 degrees of freedom, then read the detection rate it buys on the novel batch. Fill in the percentile.

```r
thr_strict <- qchisq(____, df = 2)          # the strict, 99.9th-percentile cutoff
round(mean(score(test_ood) > thr_strict), 3)
```
::check {"regex":"0\\.999","gate":true,"difficulty":"intermediate","ok":"That strict cutoff catches only about 45% of the novel batch, down from 72% at the 99% line. You bought near-zero false alarms by missing more than half the novelties: the whole tradeoff, made by one number.","no":"The strict cutoff is the 99.9th percentile: qchisq(0.999, df = 2). The 0.95 (loose) and 0.99 (medium) cutoffs are looser."}
::solution
```r
thr_strict <- qchisq(0.999, df = 2)
round(mean(score(test_ood) > thr_strict), 3)
#> [1] 0.446
```

=== step === concept
::eyebrow Honest limits
## When the score lies

Every method in this lesson rested on one assumption: that the training data is a single, roughly Gaussian blob, one cloud with one centre. When that holds, Mahalanobis distance is an excellent novelty score. When it does not, the score can lie, and in a dangerous direction.

Suppose Nadia's customers are really *two* separate kinds: a cluster of small, young accounts and a cluster of large, established ones, with a wide empty gap between them. Fit one Gaussian to all of it and the fitted centre lands in the middle of that gap, where no real customer lives.

```r
set.seed(3)
cluster1 <- data.frame(account_age = rnorm(600, 200, 40), amount = rnorm(600, 120, 25)) # small, young
cluster2 <- data.frame(account_age = rnorm(600, 900, 40), amount = rnorm(600, 520, 25)) # big, established
bimodal  <- rbind(cluster1, cluster2)                        # two separate kinds of customer

gap <- data.frame(account_age = 560, amount = 330)           # sits in the empty gap between them
round(mahalanobis(gap, colMeans(bimodal), cov(bimodal)), 2)
#> [1] 0.02
sum(abs(bimodal$account_age - 560) < 60)                     # real customers anywhere near it?
#> [1] 0
```

A transaction sitting dead in that empty gap scores a Mahalanobis distance of **0.02**, about as "normal" as it is possible to be, even though **not one** real customer sits within 60 days of it. The single-Gaussian score calls the emptiest region the *most* typical. A fraudster who engineered a transaction to land in that gap would be waved through as utterly unremarkable.

[WARNING]
A low novelty score means "close to the fitted shape", not "close to real data". If the training data is multimodal, heavy-tailed, or high-dimensional, a single-Gaussian Mahalanobis score can badly misjudge the gaps. Check the one-blob assumption before you trust the number.

When that assumption fails, you reach for methods that model *local* density instead of one global centre: k-nearest-neighbour distance, the local outlier factor, or the isolation forest, which is the subject of the next section on anomaly detection. The three-move recipe (fit a shape, score the distance, threshold it) stays exactly the same; only the "shape" you fit gets richer.

[NOTE]
One more distinction worth keeping straight. A flag means "the model has no basis to judge this input", not "this input is fraud". Out-of-distribution is not a synonym for bad. The right response to a novelty flag is usually to *abstain and escalate*, routing the transaction to a human or a fallback rule, rather than to auto-decline a possibly perfectly good customer.

=== step === quiz
::eyebrow Check yourself
## Reading a flag

Nadia's detector flags a transaction: its Mahalanobis distance is well above the 99% cutoff. Her teammate says "great, auto-decline it, it must be fraud." What is the right way to read that flag?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Auto-decline it: a high novelty score is direct evidence of fraud, so blocking it protects the business ::no Out-of-distribution is not the same as fraudulent. The score says only that the input is unlike the training data, so the *fraud model* cannot be trusted on it, not that the transaction is bad. Auto-declining risks freezing a genuine but unusual customer.
- Treat it as "the model has no basis here" and escalate: route it to a human or a fallback rule rather than trusting either the fraud score or a blanket decline ::ok Right. A novelty flag is a statement about the model's competence, not the customer's guilt. The safe response is to abstain and hand off, precisely because the reason for the flag is that the usual model is unreliable on this input.
- Ignore it: novelty scores are only meaningful in batches, like drift, so a single flagged transaction carries no information ::no The opposite of Lesson 3. Drift is the batch-level question; novelty detection is exactly the per-input signal, and a single high score is what it is designed to surface.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Pimentel, Clifton, Clifton and Tarassenko (2014), A review of novelty detection, Signal Processing](https://doi.org/10.1016/j.sigpro.2013.12.026) - a broad, readable survey of novelty-detection methods and where each one fits.
- [Hendrycks and Gimpel (2017), A Baseline for Detecting Misclassified and Out-of-Distribution Examples in Neural Networks (ICLR)](https://arxiv.org/abs/1610.02136) - the canonical demonstration that a classifier's own confidence is not enough to flag out-of-distribution inputs, exactly the gap this lesson fills.
- [Lee, Lee, Lee and Shin (2018), A Simple Unified Framework for Detecting Out-of-Distribution Samples and Adversarial Attacks (NeurIPS)](https://arxiv.org/abs/1807.03888) - the paper that made the Mahalanobis distance a standard out-of-distribution score, here for deep networks.
- [scikit-learn User Guide: Novelty and Outlier Detection](https://scikit-learn.org/stable/modules/outlier_detection.html) - a practitioner's tour of the alternatives (one-class SVM, isolation forest, local outlier factor) for when one Gaussian is not enough.

=== step === complete
## Lesson 4 complete

You built a second opinion for Nadia's model, one that judges a single input instead of the whole stream. The recipe is three moves: **fit the training shape** (a Gaussian, summarised by its mean and covariance), **score each new point** by its Mahalanobis distance (the covariance-aware ruler that catches novelties hiding in the correlation between features, which any per-feature check misses), and **threshold** it with the chi-square cutoff (whose percentile is the false-positive rate you accept). You saw the dial in numbers, where tightening it trades catches for calm, and you saw where a single-Gaussian score lies, so a flag means "abstain and escalate", never "auto-decline".

Next, Lesson 5: Group Robustness and DRO. Novelty detection catches the input that looks *strange*. The next failure is the opposite and more unsettling one: transactions that look completely ordinary, on which the model is confident and correct on average, yet quietly wrong for an entire group of real customers. You will learn to find that hidden failure and to train against it.

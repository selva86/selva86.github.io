---
title: "Anomaly Detection Lesson 4: Autoencoders for Anomaly Detection"
catalog_blurb: "Catch fraud that looks normal on every feature but breaks the usual pattern."
description: "Use reconstruction error to flag anomalies: an autoencoder rebuilds normal data well but off-pattern points badly. The linear case is PCA, built from scratch in R."
keywords: "autoencoder, anomaly detection, reconstruction error, PCA, novelty detection, unsupervised, outlier detection, prcomp, R"
post_type: "LESSON"
curriculum_id: "6.200.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "4"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Time-Series-Anomaly-Detection.html"
course_prev: "Local-Outlier-Factor-and-One-Class-SVM.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Autoencoders for Anomaly Detection

Every detector so far scored a point by asking a version of the same question: where does this point sit? The isolation forest asked how few cuts fence it off; LOF asked how sparse its neighbourhood is; the one-class SVM asked which side of a boundary it lands on. This lesson asks something genuinely different. Not "where is the point?" but "can a model that has only ever seen normal data even rebuild it?"

That is the idea behind an **autoencoder**: squeeze each point through a narrow bottleneck and rebuild it. Trained on normal charges, it rebuilds normal charges almost perfectly, but it cannot rebuild a point that does not fit the pattern. The size of the rebuilding mistake, the **reconstruction error**, becomes the anomaly score. All lesson we follow one card, belonging to a shopper named Maya, whose charges track a simple rule of about \$8.50 per item. A \$78 charge for just 5 items looks ordinary on each number alone, yet it is impossible for her, and reconstruction error is exactly what catches it. And in the simplest (linear) case this turns out to be exactly PCA, so you can build a working detector in a few lines of base R.

By the end of this lesson you will be able to:

- Describe the autoencoder pipeline: encode to a bottleneck, decode, and score by reconstruction error
- Explain why reconstruction error catches a charge that is normal on every single feature but breaks the relationship between features
- Use the linear-autoencoder = PCA fact: reconstruction error is the distance to the subspace normal data lives on
- Compute reconstruction error in R with `prcomp` and turn it into an anomaly flag
- Name the assumptions that make it work: clean-ish training data, a bottleneck narrower than the input, and feature scaling

**Prerequisites:** you can run R and read base R (`scale`, `prcomp`, `rowSums`, indexing), and you have done [Lesson 1: What Is an Anomaly?](What-is-an-Anomaly.html) (global vs local outliers, the base-rate trap) and [Lesson 3: LOF and One-Class SVM](Local-Outlier-Factor-and-One-Class-SVM.html) (novelty detection: learn normal once, judge new points). No PCA background is needed; the one fact we use is built up here.

::widget autoencoder-recon {}

=== step === concept
::eyebrow The idea
## A compressor that only knows normal

Picture Maya's normal spending as a habit. Her charges follow a pattern: a bigger basket costs more, roughly a fixed price per item. Because of that pattern, you barely need two numbers to describe a normal charge. Tell me the basket size and I can guess the amount; the pattern fills in the rest. A normal charge is almost one number of real information dressed up as two.

An **autoencoder** turns that observation into a machine, in three parts:

1. The **encoder** squeezes each charge down to a tiny summary, its **bottleneck code** (here, a single number).
2. The **bottleneck** is deliberately too narrow to store everything. It can only keep the dominant pattern, not the fine detail or the noise.
3. The **decoder** rebuilds the full charge from that summary alone.

You train the whole thing on normal charges only, tuning the encoder and decoder so the rebuilt charge comes back as close to the original as possible. Because the bottleneck is a squeeze, the network is forced to spend its tiny budget on the pattern that normal charges share. The gap between the original charge and its rebuild is the **reconstruction error**, and that gap is the whole game.

::widget process-flow {"steps":[{"title":"Encode","sub":"squeeze the charge into one summary number"},{"title":"Bottleneck","sub":"too narrow to hold noise, only the main pattern fits"},{"title":"Decode","sub":"rebuild the full charge from that one number"},{"title":"Score","sub":"reconstruction error = gap between original and rebuild"}]}

=== step === concept
::eyebrow The key idea
## Reconstruction error is the anomaly score

Here is why the squeeze does the work. Normal charges all lie close to the same pattern, so the bottleneck code captures them and the decoder rebuilds them with almost no error. An anomaly is a charge that does not fit the pattern. The encoder is forced to describe it with the same tiny code built for normal charges, and the decoder rebuilds a normal-looking charge that does not match. The mistake is large. So you do not need labels at all: you just flag the charges the model rebuilds badly.

Geometrically, the pattern the model learns is a low-dimensional shape the normal data lives on, its **manifold**. In our two-feature card, that manifold is a line: amount rising with basket size. Reconstruction snaps each charge onto that line, and the reconstruction error is simply how far the charge sits off it. Toggle the widget between a normal point and the anomaly and watch the red residual, the reconstruction error, stay tiny on the line and blow up off it.

::widget autoencoder-recon {}

[KEY INSIGHT]
Train on normal, then score by rebuilding: a small reconstruction error means the point sits on the manifold the model learned (normal), a large one means it sits off the manifold (anomaly). The bottleneck is what makes this possible, because a model that could copy every input perfectly would rebuild anomalies perfectly too, and tell you nothing.

=== step === concept
::eyebrow Why bother
## The fraud that hides in plain sight

This is where reconstruction error earns its keep. A per-feature rule (flag any charge with an extreme amount, or an extreme item count) can only see one column at a time. Reconstruction error sees the two columns together. Let us build Maya's card and plant a fraud that is designed to slip past every single-feature check: a \$78 charge rung up as only 5 items.

```r
set.seed(1)
n <- 120
items  <- rpois(n, 5) + 2                          # basket size: how many items
amount <- round(8.5 * items + rnorm(n, 0, 4), 2)   # dollars, tracking basket size
maya   <- data.frame(items, amount, kind = "normal")
maya   <- rbind(maya, data.frame(items = 5, amount = 78, kind = "FRAUD"))  # $78 for 5 items
tail(maya, 2)
#>     items amount   kind
#> 120     8  72.83 normal
#> 121     5  78.00  FRAUD

# would a per-feature outlier rule catch it? z-score each feature of the fraud:
nm <- maya$kind == "normal"
round(c(z_amount = (78 - mean(maya$amount[nm])) / sd(maya$amount[nm]),
        z_items  = ( 5 - mean(maya$items[nm]))  / sd(maya$items[nm])), 2)
#> z_amount  z_items
#>     0.99    -1.02
```

Look at those z-scores. The fraud's amount is 0.99 standard deviations above the mean, its item count is 1.02 below. Neither is remotely an outlier; both sit well inside the normal band, inside any sensible IQR or z-score fence. A rule that watches `amount` alone waves it through. A rule that watches `items` alone waves it through.

But \$78 for 5 items is impossible for Maya. Five items should cost about \$42; \$78 is nearly double. The two values are each ordinary, yet their **combination** is off the pattern. That is a broken feature relationship, and it is invisible to any one-column rule. Reconstruction error is built to see exactly this.

=== step === concept
::eyebrow The formal picture
## Reconstruction error, and why the linear case is PCA

Now the precise version. Write a data point as a vector \(x \in \mathbb{R}^p\) ( \(p = 2\) here: items and amount ). The **encoder** is a function \(f\) that maps \(x\) to a shorter code \(z = f(x) \in \mathbb{R}^k\) with \(k < p\) (our bottleneck, \(k = 1\) ). The **decoder** is a function \(g\) that maps the code back to a full-size rebuild \(\hat{x} = g(z)\). The **reconstruction error** of the point is the squared distance between the original and its rebuild:

\( e(x) = \lVert x - \hat{x} \rVert^2 = \lVert x - g(f(x)) \rVert^2 \)

Training picks \(f\) and \(g\) to make the average error small on the normal data \(x_1, \dots, x_n\):

\( \min_{f,\,g}\ \dfrac{1}{n} \sum_{i=1}^{n} \lVert x_i - g(f(x_i)) \rVert^2 \)

Now make the encoder and decoder **linear**. Let \(\mu\) be the mean of the normal data and let \(W\) be a \(p \times k\) matrix whose columns are orthonormal directions. Encode by projecting onto those directions, \(z = W^{\top}(x - \mu)\), and decode by mapping back, \(\hat{x} = \mu + W z\). Substituting gives

\( \hat{x} = \mu + W W^{\top} (x - \mu) \)

which is the **orthogonal projection** of \(x\) onto the \(k\)-dimensional subspace through \(\mu\) spanned by the columns of \(W\). The error \(e(x) = \lVert (x - \mu) - W W^{\top}(x - \mu) \rVert^2\) is then just the squared distance from \(x\) to that subspace. Minimizing the average of that error over the normal data is precisely what **PCA** does: the best \(W\) is the top \(k\) principal directions. So a linear autoencoder IS PCA, the bottleneck is the top principal components, and the reconstruction error is the distance to the subspace normal data varies along. That is why you can build the detector with `prcomp`.

=== step === tryit
::eyebrow Your turn
## Build the detector in R

Let us score Maya's card. Standardize the two features (they are on different scales, dollars versus a count), fit the 1-component bottleneck with `prcomp`, decode, and measure the error. The one decision that matters is `rank.`, how many principal directions the bottleneck keeps. Fill in the blank so the bottleneck is an actual squeeze.

```r
X     <- scale(maya[, c("items", "amount")])   # standardize (items vs dollars)
pca   <- prcomp(X, rank. = ____)               # bottleneck: keep how many of the 2 directions?
recon <- sweep(pca$x %*% t(pca$rotation), 2, pca$center, "+")   # decode from the code
maya$recon_error <- rowSums((X - recon)^2)     # reconstruction error per charge
head(maya[order(-maya$recon_error), c("kind", "items", "amount", "recon_error")], 4)
```
::check {"regex":"rank\\.\\s*=\\s*1","gate":true,"difficulty":"intermediate","ok":"Right: rank. = 1 keeps one of the two directions, so the bottleneck actually squeezes. The fraud reconstructs with error about 1.99, more than ten times the typical normal error near 0.12.","no":"The bottleneck has to be NARROWER than the input. With 2 features, keep 1 direction: rank. = 1. Keep both (rank. = 2) and nothing is squeezed out, so every charge rebuilds perfectly, every error is 0, and no anomaly can ever stand out."}
::solution
```r
X     <- scale(maya[, c("items", "amount")])
pca   <- prcomp(X, rank. = 1)
recon <- sweep(pca$x %*% t(pca$rotation), 2, pca$center, "+")
maya$recon_error <- rowSums((X - recon)^2)
head(maya[order(-maya$recon_error), c("kind", "items", "amount", "recon_error")], 4)
#>       kind items amount recon_error
#> 121  FRAUD     5  78.00   1.9928170
#> 1   normal     6  60.61   0.1382046
#> 106 normal     5  51.32   0.1182792
#> 10  normal     4  42.69   0.1172992
```

The fraud sits at the very top with a reconstruction error of **1.99**, while every normal charge hovers near **0.12**, well over a tenfold gap. The single-feature z-scores could not separate this charge from the crowd; the distance-to-the-line could, because the fraud is the one point that does not lie on Maya's amount-per-item line.

=== step === quiz
::eyebrow Check yourself
## Why did the fraud reconstruct so badly?

The fraud (\$78 for 5 items) scored a reconstruction error of about 1.99, more than ten times any normal charge, even though its amount and item count were each unremarkable (z-scores of 0.99 and -1.02). Which statement best explains why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because \$78 is the largest, most extreme charge on the card, so it is furthest from everything ::no It is not extreme at all: its amount z-score is 0.99 and its item z-score is -1.02, both well inside the normal range. Reconstruction error is not measuring distance-from-everything; a global distance rule ranked charges like this as ordinary.
- Because \$78 for 5 items breaks Maya's normal amount-per-item relationship, so the point sits off the 1-D line the bottleneck learned and cannot be rebuilt from a single number ::ok Exactly. The bottleneck code carries only the shared pattern (amount tracks basket size). A charge off that line gets rebuilt as an on-line charge, and the leftover gap, the distance to the line, is the large error. That is the broken feature relationship no single-column rule could see.
- It would have been flagged even more strongly if the bottleneck had kept both components instead of one ::no The opposite. Keep both of the two directions and the "bottleneck" reconstructs every point perfectly, so every error is zero and nothing can be flagged. The squeeze is what creates the signal; a model that can copy any input tells you nothing.

=== step === concept
::eyebrow From a score to a decision
## Turn the error into a flag, and mind the limits

A score is not yet a decision. To act, pick a threshold: learn what a typical normal error looks like and flag any charge whose error runs well past it. A sensible choice is a high quantile of the errors on data you trust is normal.

```r
thr <- quantile(maya$recon_error[maya$kind == "normal"], 0.99)   # a high normal-error cutoff
maya$flag <- maya$recon_error > thr
table(flag = maya$flag, kind = maya$kind)
#>        kind
#> flag    FRAUD normal
#>   FALSE     0    118
#>   TRUE      1      2
```

The fraud is caught. So are 2 of the 120 normal charges: false alarms, and not a bug but the honest cost of a 99th-percentile cutoff (about 1% of 120 is roughly 1 to 2). Tighten the threshold and fewer normal charges spill over, but a borderline fraud can slip through. That trade is the tuning, and Lesson 1's base-rate warning still holds: at a 1-in-a-thousand fraud rate, judge the flag by precision and recall, never accuracy.

Three more honest limits are worth stating plainly:

- **The training data must be (mostly) normal.** The model learns "normal" from what you feed it. Train on a set salted with fraud and the bottleneck learns to rebuild that fraud too, so it stops flagging it.
- **The bottleneck must be narrower than the input.** You saw this in the try-it: keep every dimension and reconstruction is perfect for everyone, so there is no signal. The squeeze is the method.
- **Scale your features first.** Reconstruction error is a squared distance, so without `scale` the feature with the larger raw range (dollars) would dominate and drown out the other.

[WARNING]
The linear autoencoder here is PCA, which can only bend its manifold into a flat subspace (a line, a plane). Real data often lives on a curved manifold. That is when you reach for a **nonlinear** autoencoder, a small neural network with the same encode-bottleneck-decode shape but nonlinear layers, so the manifold can curve. Same score (reconstruction error), richer shape. It needs a deep-learning toolkit and does not run in the browser, so here it is for reference only:

```r-static
# A NONLINEAR autoencoder (Keras): same encode -> bottleneck -> decode idea, but the
# layers are nonlinear, so the learned manifold can curve. Run this locally, not here.
library(keras3)
input  <- layer_input(shape = ncol(X))
code   <- input |> layer_dense(8, "relu") |> layer_dense(2, "relu")   # narrow bottleneck
output <- code  |> layer_dense(8, "relu") |> layer_dense(ncol(X))     # decode back to p
ae <- keras_model(input, output) |> compile(optimizer = "adam", loss = "mse")
ae |> fit(X_normal, X_normal, epochs = 50, verbose = 0)               # train on NORMAL rows only
recon_error <- rowSums((X - predict(ae, X))^2)                        # same score, curved manifold
```

=== step === quiz
::eyebrow Check yourself
## The retraining trap

Maya's bank wants the detector to stay current, so an engineer sets it to retrain every night on **all** of the previous day's transactions, including any fraud that slipped through undetected. Over the weeks, what happens to its ability to catch that recurring kind of fraud?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It gets worse: the bottleneck starts treating the recurring fraud as part of the normal pattern, so those charges reconstruct well and stop being flagged ::ok Right. An autoencoder defines "normal" entirely from its training data. Feed the fraud back in night after night and the model learns to rebuild it, its reconstruction error drops, and the flag goes silent. This is why the training set must be curated to be clean-ish, not just "all recent data."
- It gets better: more data always sharpens the reconstruction, so the anomaly score only improves ::no More data helps only if it is clean. Reconstruction-based detection assumes the training set represents NORMAL. Contaminate it with the very fraud you want to catch and you teach the model that the fraud is normal.
- It stays the same: reconstruction error depends only on the charge being scored, not on the training data ::no The error depends entirely on the manifold learned from the training data. Change what the model trains on and you move the manifold, which changes every point's error. That is exactly why contamination is dangerous.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Sakurada and Yairi (2014), Anomaly Detection Using Autoencoders with Nonlinear Dimensionality Reduction (MLSDA)](https://doi.org/10.1145/2689746.2689747) - the canonical paper that uses reconstruction error as the anomaly score and compares linear (PCA) against nonlinear autoencoders.
- [Baldi and Hornik (1989), Neural Networks and Principal Component Analysis, Neural Networks 2(1)](https://doi.org/10.1016/0893-6080(89)90014-2) - the original proof that a linear autoencoder with squared loss recovers the PCA subspace, the fact this lesson leans on.
- [Goodfellow, Bengio and Courville (2016), Deep Learning, ch. 14: Autoencoders (free online)](https://www.deeplearningbook.org/contents/autoencoders.html) - the modern treatment of encoders, bottlenecks and undercomplete autoencoders.
- [Chandola, Banerjee and Kumar (2009), Anomaly Detection: A Survey, ACM Computing Surveys 41(3)](https://doi.org/10.1145/1541880.1541882) - where reconstruction-based detection sits among the alternatives you have met.
- [An Introduction to Statistical Learning, ch. 12 (free PDF)](https://www.statlearning.com/) - the gentle companion on PCA, the method the linear case reduces to.

=== step === complete
## Lesson 4 complete

You now have a fourth detector with a genuinely different mechanism. Instead of asking where a point sits, an autoencoder asks whether a model that only knows normal can rebuild it. Trained on normal data, it rebuilds normal points cheaply and off-manifold points badly, and that **reconstruction error** is the anomaly score, sharp enough to catch a fraud that is normal on every single feature but breaks the relationship between them. You saw that the linear case is exactly PCA (the error is the distance to the subspace normal data lives on), built it in a few lines with `prcomp`, turned the score into a flag, and named the assumptions that keep it honest: clean-ish training data, a real bottleneck, and scaled features.

Four detectors down: isolation (global), density (local), boundary (novelty), and reconstruction (off-manifold). Every one so far has treated each point on its own. Next, Lesson 5: **Time-Series Anomaly Detection**, where order and time matter, a value can be perfectly normal on its own yet anomalous for a Tuesday afternoon, and you will strip out trend and seasonality before you can even see the anomaly.

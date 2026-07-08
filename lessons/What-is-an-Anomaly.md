---
title: "Anomaly Detection Lesson 1: What Is an Anomaly?"
catalog_blurb: "What makes a data point anomalous, and why accuracy is the wrong score."
description: "What counts as an anomaly in R: global vs local vs contextual outliers, distance vs density, and why a 99%-accurate fraud flag can still be mostly false alarms."
keywords: "anomaly detection, outlier detection, local outlier factor, contextual anomaly, base rate, precision and recall, imbalanced classification, R"
post_type: "LESSON"
curriculum_id: "6.200.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-anomaly"
course_title: "Anomaly and Outlier Detection"
course_lesson: "1"
course_total: "7"
course_landing: "R-Anomaly-Detection-Course.html"
course_next: "Isolation-Forest-and-Extended-Isolation-Forest.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## What Is an Anomaly?

Picture Maya's debit card: dozens of small $20 charges at the same two coffee shops, then one Tuesday a $2,400 charge from an electronics store 300 miles from home. Your eye jumps to that last one before any model runs. Turning that "does not fit" feeling into a number is the whole job of anomaly detection, and it is what this course teaches.

One of the dots in the picture below behaves the same way. It is not like the others, not because someone labelled it, but because it sits alone in a sparse pocket while the rest crowd together.

Before we can catch anomalies with isolation forests, density scores or autoencoders, we need to pin down what an anomaly actually is, and why it is so easy to fool yourself into thinking you have caught them.

By the end of this lesson you will be able to:

- Say what makes a data point an anomaly (and why unusual is not the same as bad)
- Score "unusual" two ways, by distance and by density, and see why distance alone misses some outliers
- Tell global, local and contextual outliers apart
- Explain the base-rate trap: why a 99%-accurate detector of rare events can still be almost useless, and what to measure instead

**Prerequisites:** you can run R and read base R (vectors, `data.frame`, `table`, `mean`, `sd`). No prior anomaly-detection knowledge is assumed.

::widget lof-density {}

=== step === concept
::eyebrow The idea
## An anomaly is a point that breaks the pattern

Back to Maya's card. Her everyday charges tell a steady story: most days she spends $3 to $60 at cafes and the grocery store a few miles from home. The $2,400 charge from the cover breaks that story, and you did not need a model to feel it. That feeling has a definition.

An **anomaly** (or **outlier**) is a data point that does not fit the pattern of the rest of the data. Formally, you build a model of what "normal" looks like, then an anomaly is any point that model assigns a low probability, or a high "distance from normal" score. Everything in this course is a different way to build that model of normal.

[KEY INSIGHT]
Anomalous means unusual, not wrong. Maya's $2,400 charge might be a laptop she genuinely bought, or a thief testing her card. Anomaly detection finds the points worth a second look; deciding what they mean is a separate step. Confusing "rare" with "fraud" is the first mistake to avoid.

So the question becomes concrete: how do we measure "does not fit the pattern"? There are two classic answers, and the difference between them matters.

=== step === concept
::eyebrow Answer 1
## Distance: how far from the middle?

The simplest measure of "unusual" is distance from the center. For a single number like a charge amount, the **z-score** tells you how many standard deviations a value sits from the mean:

\( z = \dfrac{x - \mu}{\sigma} \)

where \(x\) is one charge, \(\mu\) is the mean of Maya's charges, and \(\sigma\) is their standard deviation (the typical spread). A common rule of thumb flags anything with \(|z| > 3\), meaning more than three standard deviations from the middle.

Let us build Maya's card as a small labelled dataset and try it. Each lesson runs in a fresh R session, so we create the data right here (run this once):

```r
set.seed(1)
# 60 everyday charges (~$22), then 3 larger ones to scrutinise
amount <- round(c(rlnorm(60, meanlog = log(22), sdlog = 0.45), 2400, 950, 380), 2)
label  <- c(rep("normal", 60), "review", "review", "review")
card   <- data.frame(amount, label)
nrow(card)
#> [1] 63
```

Now score every charge by its z, and look at the most extreme:

```r
mu <- mean(card$amount); sigma <- sd(card$amount)
card$z <- round((card$amount - mu) / sigma, 2)
card[order(-abs(card$z))[1:4], ]
#>     amount  label     z
#> 61 2400.00 review  7.20
#> 62  950.00 review  2.70
#> 63  380.00 review  0.92
#> 14    8.12 normal -0.23
```

The $2,400 charge screams (z = 7.2). But watch what a strict global cutoff actually catches:

```r
subset(card, abs(z) > 3)
#>    amount  label   z
#> 61   2400 review 7.2
```

Only the $2,400 charge clears \(|z| > 3\). The $950 and $380 charges are odd for Maya, yet a single global threshold lets them straight through.

[NOTE]
A z-score assumes the data forms one bell-shaped cluster, and the outliers themselves inflate \(\mu\) and \(\sigma\), hiding smaller ones. Robust versions swap in the median and MAD (the median absolute deviation, a spread measure the outliers cannot inflate), and the multivariate version is the Mahalanobis distance. But all of them share the same blind spot, which the next idea fixes.

=== step === widget
::eyebrow Answer 2
## Density: how alone is the point?

A global distance cutoff asks "how far from the overall center?" Density asks a smarter question: "how crowded is this point compared to its own neighbours?" A point deep inside a cluster is as crowded as everyone around it. A point in a sparse pocket, whose few neighbours are themselves packed tight, is far lonelier than its surroundings, even if it is not the farthest from the center.

Slide **k** below (the number of neighbours each point looks at) and read the Local Outlier Factor off each dot's colour. The highlighted point never has the largest distance from the middle, yet it lights up, because it is locally sparse. That is exactly the outlier a global cutoff misses.

::widget lof-density {}

This is why "distance from the middle" and "density in the neighbourhood" are two genuinely different lenses. Maya's $380 charge is unremarkable in size, but it is sparse among her dozens of $20 coffees, so density flags it while distance shrugs.

=== step === concept
::eyebrow Three flavours
## Global, local and contextual outliers

Those two lenses map onto the three kinds of outlier you will meet again and again. Grounding each on Maya's card:

| Kind | What makes it odd | On Maya's card |
|---|---|---|
| **Global** | far from every normal point | a $2,400 laptop charge, 300 miles from home |
| **Local** | ordinary overall, but sparse for its own neighbourhood | a $380 charge sitting among dozens of $20 coffees |
| **Contextual** | normal in one setting, odd in another | $300 is routine in December, but odd in mid-July |

[NOTE]
Global outliers fall to distance methods; local outliers need density (the widget you just used). Contextual outliers need a **context variable** (here, the month) because the same value flips from normal to suspicious when the context changes. Lesson 5 handles the contextual case for time series.

The takeaway: "anomaly" is not one thing. Which method you reach for depends on which kind you expect.

=== step === quiz
::eyebrow Check yourself
## What makes an outlier local?

A point can be an anomaly even when it is **not** the farthest from the center of the data. What makes it a *local* outlier?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It sits in a sparser pocket than the points immediately around it, even if other points are farther from the center ::ok Right. Local outliers are defined by comparing a point's density to its neighbours' density, so a point can be a local outlier without being an extreme global value. That is the gap density methods fill.
- It has the largest distance from the overall mean ::no That describes a GLOBAL outlier, the kind a distance cutoff already catches. A local outlier can sit at a perfectly ordinary distance from the center yet be sparse compared to its immediate neighbours, and cluster size is not the test either.
- It always belongs to the smallest cluster

=== step === concept
::eyebrow Why this is hard
## The base-rate trap

Here is the trap that catches almost everyone. Zoom out from Maya's card to her whole bank. Anomalies are, by definition, **rare**: suppose 0.5% of the bank's transactions are truly fraud. Screen 10,000 of them:

```r
set.seed(2)
N <- 10000
actual <- rbinom(N, 1, 0.005)   # each charge is fraud with probability 0.5%
sum(actual)                     # how many are actually fraud
#> [1] 51
mean(actual == 0)               # accuracy of a model that flags NOTHING
#> [1] 0.9949
```

Read that second number again. A lazy model that flags **nothing** is already 99.49% accurate, because almost nothing is fraud. So "99% accurate" can mean "did literally no work." Now run a genuinely useful detector, one that catches 90% of fraud but false-alarms on 5% of clean charges:

```r
flag <- ifelse(actual == 1, rbinom(N, 1, 0.90), rbinom(N, 1, 0.05))
cm <- table(actual = factor(actual, 0:1), flagged = factor(flag, 0:1))
cm
#>       flagged
#> actual    0    1
#>      0 9460  489
#>      1    4   47
```

The detector caught 47 of 51 frauds (great), but it also raised 489 false alarms. Score it three ways, where \(TP\) is true positives (fraud caught), \(FP\) false positives (false alarms), \(FN\) false negatives (fraud missed), and \(TN\) true negatives:

\( \text{accuracy} = \dfrac{TP+TN}{TP+TN+FP+FN}, \quad \text{precision} = \dfrac{TP}{TP+FP}, \quad \text{recall} = \dfrac{TP}{TP+FN} \)

```r
tp <- cm["1","1"]; fp <- cm["0","1"]; fn <- cm["1","0"]; tn <- cm["0","0"]
round(c(accuracy = (tp + tn) / N, precision = tp / (tp + fp), recall = tp / (tp + fn)), 3)
#>  accuracy precision    recall
#>     0.951     0.088     0.922
```

[KEY INSIGHT]
The useful detector scores **95.1% accuracy**, which is *lower* than the do-nothing model's 99.5%. By accuracy, doing nothing wins. Yet only about 9% of its alerts are real (precision 0.088) while it still catches 92% of fraud (recall 0.922). Accuracy is the wrong score for rare events; precision and recall tell the truth.

The reason is Bayes' rule. The chance a flagged charge is really fraud is

\( P(\text{fraud} \mid \text{flag}) = \dfrac{P(\text{flag} \mid \text{fraud})\,P(\text{fraud})}{P(\text{flag})} \)

and when the base rate \(P(\text{fraud})\) is tiny, the denominator is swamped by false alarms from the huge clean majority. No amount of recall rescues precision if the base rate is low enough.

=== step === widget
::eyebrow The dial you control
## Precision and recall trade off

Precision and recall are not fixed; they slide against each other as you move the **threshold**, the score above which you raise an alert. Lower the threshold to catch more fraud (recall up) and you also flag more clean charges (precision down). There is no free lunch, only a choice.

Drag the threshold below. Watch the confusion matrix re-count, the precision and recall numbers move, and the operating point slide along the ROC curve, which shows every threshold at once. Accuracy would collapse this whole picture into one misleading number.

::widget roc-curve {}

Where you set the dial depends on the cost of a miss versus the cost of a false alarm. Blocking a real customer is expensive; so is letting fraud through. That trade-off is a business decision the single "accuracy" number hides completely.

=== step === quiz
::eyebrow Check yourself
## "99% accurate, so it is great?"

A vendor demos a fraud detector: **99% accurate** on 10,000 transactions where 0.5% are fraud. Your manager is thrilled. Why might it still be nearly useless?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- 99% accuracy is excellent for any problem, so the manager is right ::no Accuracy is dominated by the huge normal class. A model that flags NOTHING already scores 99.5% here, so 99% can mean the detector did almost no work. And no detector scores 100% on overlapping real data. Judge it by precision (are the alerts real?) and recall (is fraud being caught?) instead.
- At a 0.5% base rate a detector can hit 99% accuracy while almost every alert it raises is a false alarm, so its precision can be tiny ::ok Exactly. Accuracy is dominated by the huge normal class. You must see precision (are the alerts real?) and recall (is fraud being caught?) before trusting it.
- The detector must be broken, because a real one would score 100%

=== step === tryit
::eyebrow Your turn
## Measure precision yourself

Precision answers the question that matters to an analyst buried in alerts: **of the transactions we flagged, what fraction were actually fraud?** Here is one week of alerts, each later confirmed by a human. Fill in the blank so `precision` is the share of alerts that were truly fraud.

```r
confirmed <- c(1, 0, 0, 1, 0, 0, 0, 1, 0, 0)   # 1 = confirmed fraud, 0 = false alarm
# precision = (alerts that were real fraud) / (all alerts)
precision <- ____ / length(confirmed)
precision
```
::check {"regex":"sum\\(\\s*confirmed\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Correct. sum(confirmed) counts the true frauds among the alerts, so precision here is 3/10 = 0.3: seven of every ten alerts were false alarms.","no":"You want the COUNT of real frauds among the alerts, over the total alerts. The count of 1s is sum(confirmed)."}
::solution
```r
confirmed <- c(1, 0, 0, 1, 0, 0, 0, 1, 0, 0)
precision <- sum(confirmed) / length(confirmed)
precision
#> [1] 0.3
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Chandola, Banerjee and Kumar (2009), Anomaly Detection: A Survey, ACM Computing Surveys](https://doi.org/10.1145/1541880.1541882) - the map of the whole field: definitions, outlier types, and method families.
- [Breunig, Kriegel, Ng and Sander (2000), LOF: Identifying Density-Based Local Outliers, SIGMOD](https://doi.org/10.1145/342009.335388) - the paper behind the density lens you used, and the idea of a local outlier.
- [Liu, Ting and Zhou (2008), Isolation Forest, IEEE ICDM](https://doi.org/10.1109/ICDM.2008.17) - the method Lesson 2 builds, isolating anomalies instead of modelling normal.
- [Aggarwal (2017), Outlier Analysis, 2nd ed. (Springer)](https://doi.org/10.1007/978-3-319-47578-3) - the standard book-length treatment, from distances to high-dimensional detection.

=== step === complete
## Lesson 1 complete

You now have the two things every anomaly method needs: a clear idea of what "does not fit" means (distance versus density, global versus local versus contextual), and an honest way to score a detector (precision and recall, never accuracy alone, when anomalies are rare).

Next, Lesson 2: Isolation Forests. Instead of modelling what normal looks like, you will isolate the odd points directly, with random splits that fence off an anomaly in far fewer cuts than a crowded point, and turn that path length into an anomaly score.

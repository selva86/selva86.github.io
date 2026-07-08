---
title: "Robustness and Drift Lesson 2: Detecting Distribution Shift"
catalog_blurb: "How to catch data drift from the inputs alone, before the labels arrive."
description: "Labels arrive late in production. Catch distribution shift from the features alone with the PSI, the KS two-sample test, and a classifier two-sample test in R."
keywords: "distribution shift detection, population stability index, PSI, Kolmogorov-Smirnov test, classifier two-sample test, data drift, model monitoring, R"
post_type: "LESSON"
curriculum_id: "6.190.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "2"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "Adapting-to-Drift-Reweighting-and-Retraining.html"
course_prev: "Kinds-of-Distribution-Shift.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Detecting Distribution Shift

In Lesson 1, Nadia's fraud detector quietly broke when fraudsters changed tactics. The damage was real, but its accuracy only revealed it **weeks later**, once the chargebacks came in and the true fraud labels finally caught up. In production that lag is normal: labels are slow, expensive, or never arrive at all.

So you cannot sit and watch accuracy. You have to notice the world moving from the **inputs alone**, the transaction features streaming in today, long before anyone confirms which were fraud. Slide the monitor below: as the weeks pass, this week's live feature drifts away from what the model trained on, and a single number climbs until it trips an alarm.

By the end of this lesson you will be able to:

- Compute and read the **Population Stability Index (PSI)** on a feature, using the 0.1 and 0.2 thresholds
- Run and interpret a **Kolmogorov-Smirnov two-sample test** comparing training data to live data
- Build a **classifier two-sample test**, training a model to tell training from live and reading its AUC as a drift score
- Pick the right detector and know each one's blind spot

**Prerequisites:** you finished [Lesson 1](Kinds-of-Distribution-Shift.html), you can fit and read a classifier, and you know what a histogram, a p-value, and AUC are.

::widget drift-monitor {}

=== step === concept
::eyebrow The problem
## You cannot wait for the labels

Drift detection reframes the question. You are not asking "did the model get this transaction right?", because the answer arrives too late. You are asking a question you *can* answer today from features alone:

> Does the data coming in now look like the data the model trained on?

That is a **two-sample question**. Hold a fixed **reference sample**, the feature values the model learned from, and a **current window**, a recent batch of live values. If those two samples plausibly came from the same distribution, you are stable. If they clearly did not, something moved.

Let us set up Nadia's monitor concretely. We watch one feature, the purchase `amount`, standardized so the average transaction sits at 0 and one unit means one standard deviation (that is why the numbers below hover around zero and can go negative, they are no longer raw dollars). We build the training reference, a later week that is genuinely unchanged, and a later week whose amounts have all crept up by about 0.6 standard deviations (bigger baskets: the covariate shift from Lesson 1, where the inputs move but the labelling rule does not). Each lesson runs in a fresh R session, so we create all three right here.

```r
set.seed(1)
n <- 2000
ref     <- rnorm(n, mean = 0,   sd = 1)   # what the model trained on
stable  <- rnorm(n, mean = 0,   sd = 1)   # a later week: inputs unchanged
drifted <- rnorm(n, mean = 0.6, sd = 1)   # a later week: baskets grew
round(c(ref = mean(ref), stable = mean(stable), drifted = mean(drifted)), 3)
#>     ref  stable drifted
#>  -0.014   0.016   0.584
```

We now have a truth to detect: `stable` really is drawn like `ref`, and `drifted` really is not. A good detector should stay quiet on `stable` and fire on `drifted`. We will run three of them, from the simplest to the most powerful.

=== step === concept
::eyebrow Detector one
## PSI: compare the histograms, bin by bin

The **Population Stability Index** is the workhorse of production monitoring, and the idea is exactly what you just watched in the cover: chop the feature into bins, then measure how far the current fractions have moved from the reference fractions.

**Intuition.** Slice the reference into 10 equal-sized buckets (its deciles). In the training data, by construction, 10% of transactions land in each bucket. Now drop the current window into those same buckets. If it also puts about 10% in each, nothing moved. If it piles up in the high buckets and empties the low ones, the inputs have shifted.

**The formula.** With \(B\) bins, let \(e_i\) be the fraction of the **reference** sample in bin \(i\) (expected) and \(o_i\) the fraction of the **current** sample in the same bin (observed). The index is

\[ \mathrm{PSI} = \sum_{i=1}^{B} \left(o_i - e_i\right)\,\ln\!\frac{o_i}{e_i}. \]

Each bin contributes a gap \((o_i - e_i)\) weighted by the log-ratio \(\ln(o_i/e_i)\) of how the proportions changed. A bin that barely moves adds almost nothing; a bin that empties or overflows adds a lot. The sum is a single non-negative number: 0 means the two histograms match perfectly.

**In R**, it is a few lines of base R. Bin on the reference's quantiles, tally both samples, and apply the formula.

```r
psi <- function(reference, current, bins = 10) {
  cuts <- as.numeric(quantile(reference, probs = seq(0, 1, length.out = bins + 1)))
  cuts[1] <- -Inf; cuts[length(cuts)] <- Inf     # let live values fall outside the training range
  e <- as.numeric(table(cut(reference, cuts))) / length(reference)
  o <- as.numeric(table(cut(current,   cuts))) / length(current)
  e <- pmax(e, 1e-4); o <- pmax(o, 1e-4)          # guard against log(0) in an empty bin
  sum((o - e) * log(o / e))
}
round(c(stable = psi(ref, stable), drifted = psi(ref, drifted)), 3)
#>  stable drifted
#>   0.007   0.348
```

The convention, from decades of credit-scorecard monitoring, reads the number like a traffic light:

- **PSI < 0.1** stable, no meaningful shift.
- **0.1 to 0.2** a moderate shift, keep watching.
- **PSI > 0.2** a significant shift, investigate and likely retrain.

The `stable` window scores **0.007** (green), and `drifted` scores **0.348**, well past the 0.2 alarm. PSI caught it, with no labels anywhere in sight.

=== step === quiz
::eyebrow Check yourself
## Read the PSI

A monitor reports **PSI = 0.09** on the `amount` feature this week, up from 0.02 last week. Fraud labels for this week will not arrive for a month. What is the right read?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Alarm: 0.09 is above zero, so the model has already lost accuracy and must be retrained today ::no The whole point of PSI is that it works without labels. It is telling you something real about the inputs; here it says "stable but drifting up, keep an eye on it."
- Below the 0.1 line, so no significant shift yet, but the jump from 0.02 is worth watching next week ::ok Right. 0.09 is still in the "stable" band (< 0.1), so no action is forced, but the trend from 0.02 toward 0.1 is exactly the early warning PSI exists to give.
- Ignore it entirely: without labels, PSI tells you nothing useful ::no The whole point of PSI is that it works without labels. It is telling you something real about the inputs; here it says "stable but drifting up, keep an eye on it."

=== step === concept
::eyebrow Detector two
## The KS test: the biggest gap between two curves

PSI needs you to choose bins. The **Kolmogorov-Smirnov (KS) two-sample test** needs no bins at all, and it comes with a p-value, so you can ask whether a gap is bigger than sampling noise would explain.

**Intuition.** For any sample, the **empirical cumulative distribution function (ECDF)** \(\hat{F}(t)\) is simply the fraction of values at or below \(t\). Draw the ECDF of the reference and the ECDF of the current window on the same axes. If the samples match, the two curves lie on top of each other. If they differ, the curves separate. The KS statistic is the size of the **largest vertical gap** between them:

\[ D = \max_{t}\,\bigl|\,\hat{F}_{\text{ref}}(t) - \hat{F}_{\text{cur}}(t)\,\bigr|. \]

Here \(t\) ranges over all possible feature values, and \(D\) (between 0 and 1) is the worst disagreement anywhere along the axis. A small \(D\) means the curves hug; a large \(D\) means they pull apart. See the gap for yourself, then read the test.

```r
library(ggplot2)
d <- data.frame(amount = c(ref, drifted),
                window = rep(c("reference", "current"), each = n))
ggplot(d, aes(amount, colour = window)) +
  stat_ecdf(linewidth = 1) +
  labs(title = "Reference vs current: the KS gap is the widest vertical distance",
       y = "cumulative fraction")
```

`ks.test()` computes \(D\) and its p-value for you. The null hypothesis is "both samples came from the same distribution," so a tiny p-value is evidence of drift.

```r
ks_stable  <- ks.test(ref, stable)
ks_drifted <- ks.test(ref, drifted)
round(c(stable_D = unname(ks_stable$statistic),
        drifted_D = unname(ks_drifted$statistic)), 3)
#>  stable_D drifted_D
#>     0.021     0.246
signif(c(stable_p = ks_stable$p.value, drifted_p = ks_drifted$p.value), 3)
#>  stable_p  drifted_p
#>  7.70e-01   8.93e-53
```

For `stable`, \(D = 0.021\) and the p-value is **0.77**: the tiny gap is exactly what two samples from the same distribution look like, so we do not reject. For `drifted`, \(D = 0.246\) with a p-value near zero: a gap that large is essentially impossible by chance. Drift, confirmed.

[NOTE]
With thousands of live rows, KS becomes *too* sensitive: a shift too small to matter can still return a microscopic p-value. In production, watch the effect size \(D\) itself (is the gap big enough to care about?), not just whether p cleared 0.05.

=== step === tryit
::eyebrow In R
## Run the test yourself

You suspect this week's live traffic has drifted. To find out, you compare it against the training reference with a KS test. You have two windows in memory: `stable` (a week you know matches) and `drifted` (the suspect week). Fill the blank with the window that represents the drifted live traffic, then read the result.

```r
ks_live <- ks.test(ref, ____)
ks_live
```
::check {"regex":"ks\\.test\\(\\s*ref\\s*,\\s*drifted","gate":true,"difficulty":"intermediate","ok":"That is the comparison that matters: the live window against the training reference. D jumps to 0.25 with a vanishingly small p-value, so you reject 'same distribution' and declare drift.","no":"Compare the reference against the suspect live window: ks.test(ref, drifted). Testing ref against stable would just confirm a week you already know is fine."}
::solution
```r
ks_live <- ks.test(ref, drifted)
ks_live
#>
#>  Asymptotic two-sample Kolmogorov-Smirnov test
#>
#> data:  ref and drifted
#> D = 0.2455, p-value < 2.2e-16
#> alternative hypothesis: two-sided
```

=== step === widget
::eyebrow Detector three
## The classifier two-sample test: can a model tell them apart?

PSI and KS look at **one feature at a time**. But drift often hides in the *combination* of features: each feature's own histogram looks unchanged, yet their joint pattern has shifted. For that you need a detector that sees all features together, and there is a beautifully simple one.

**The trick.** Pool the reference rows and the current rows into one table and give them a throwaway label: 0 if a row came from the reference, 1 if it came from the current window. Now train any classifier to predict that label, and score it on held-out rows with AUC.

- If the two samples are drawn from the **same** distribution, no feature or combination separates them, so the best any classifier can do is guess. AUC sits at about **0.5**.
- If they **differ**, the classifier finds the tell and scores rows from the current window higher. AUC climbs **above 0.5**, and how far above measures how strong the drift is.

That is the **classifier two-sample test (C2ST)**, and its score is exactly the AUC you already know: the probability the model ranks a random current-window row above a random reference row. Slide the threshold below to feel how AUC summarizes separability into one number, then read what the same idea does to Nadia's `amount`.

In R, it is a `glm`, a held-out split, and the AUC computed by hand (the Mann-Whitney form, no extra package).

```r
auc <- function(score, label) {                 # AUC = P(current row scores above reference row)
  r  <- rank(score)
  n1 <- sum(label == 1); n0 <- sum(label == 0)
  (sum(r[label == 1]) - n1 * (n1 + 1) / 2) / (n1 * n0)
}
c2st <- function(reference, current) {
  d   <- data.frame(x = c(reference, current),
                    cur = c(rep(0, length(reference)), rep(1, length(current))))
  i   <- sample(nrow(d), floor(0.7 * nrow(d)))   # 70% train, 30% held out
  fit <- glm(cur ~ x, data = d[i, ], family = binomial)
  p   <- predict(fit, d[-i, ], type = "response")
  auc(p, d[-i, "cur"])
}
set.seed(7)
round(c(stable = c2st(ref, stable), drifted = c2st(ref, drifted)), 3)
#>  stable drifted
#>   0.526   0.656
```

On `stable` the classifier manages **0.526**, a hair above 0.5 by luck, as good as guessing. On `drifted` it reaches **0.656**: it genuinely learned to tell the two weeks apart, which is only possible because they differ. With one feature, C2ST just echoes KS. Its power shows with many features, where it is the only one of the three that catches drift living in the joint distribution.

[KEY INSIGHT]
Because the "no drift" AUC is about 0.5 rather than exactly 0.5, judge the score against a baseline, not the raw 0.5 line. Reshuffle the pooled labels a few times, recompute AUC, and treat anything above that noise band as real drift.

::widget roc-curve {}

=== step === quiz
::eyebrow Check yourself
## Which detector catches it?

A recommender monitors two features: `session_length` and `items_viewed`. Each feature's own histogram this month matches last month's almost exactly (PSI ~0.02, KS p ~0.6 on each). Yet users who view many items now have very short sessions, the opposite of before. Which detector flags this, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Per-feature PSI, because a large enough shift always shows up in at least one feature's bins ::no You can absolutely catch joint drift without labels; that is what the classifier two-sample test is for. Waiting for labels is the delay this whole lesson exists to avoid.
- Nothing can catch it without labels, so you must wait for the engagement labels to confirm the drop ::no You can absolutely catch joint drift without labels; that is what the classifier two-sample test is for. Waiting for labels is the delay this whole lesson exists to avoid.
- The classifier two-sample test, because it uses both features at once and can learn their changed joint pattern ::ok Exactly. C2ST trains on all features together, so it detects a changed relationship between them even when each one's marginal histogram is untouched. PSI and KS, being one feature at a time, miss joint drift.

=== step === concept
::eyebrow Choosing well
## Three detectors, three blind spots

None of these is "the" drift test; they answer slightly different questions, and a real monitor uses more than one.

| Detector | Works on | Catches | Misses / gotcha |
|---|---|---|---|
| **PSI** | one feature, binned | shifts in a single feature's distribution | needs a bin choice; joint drift; no built-in p-value (uses fixed 0.1 / 0.2 cutoffs) |
| **KS test** | one continuous feature | any change in one feature's shape, with a p-value | continuous only (not categorical); over-sensitive at large n; joint drift |
| **Classifier two-sample test** | all features at once | joint / multivariate drift, categorical or continuous | needs a held-out AUC and a ~0.5 baseline; says *that* it drifted, not *where* |

Three habits keep a monitor honest:

- **Watch effect size, not just p-values.** With big samples, KS will reject almost anything. A large \(D\) or a PSI past 0.2 is what should move you, not a small p alone.
- **Correct for many features.** Running KS on 200 features means ~10 false alarms at the 0.05 level by chance. Adjust the threshold (a Bonferroni or false-discovery correction) or lean on the single C2ST.
- **A drift alarm is not a performance alarm.** These detectors prove the **inputs** moved, not that accuracy fell. As Lesson 1 showed, harmless covariate shift can trip them while the model is fine. Drift detection tells you *where to look*; whether to act is a judgment about which shift you are facing.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Rabanser, Gunnemann and Lipton (2019), Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift](https://arxiv.org/abs/1810.11953) - a careful benchmark of drift detectors, including the classifier two-sample test, and what actually works.
- [Lopez-Paz and Oquab (2017), Revisiting Classifier Two-Sample Tests](https://arxiv.org/abs/1610.06545) - the paper that formalized using a trained classifier's accuracy as a two-sample test.
- [ks.test: the two-sample Kolmogorov-Smirnov test in R (stats package docs)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/ks.test.html) - the function you used, with its assumptions and the tie warning.
- [Gama, Zliobaite, Bifet, Pechenizkiy and Bouchachia (2014), A Survey on Concept Drift Adaptation, ACM Computing Surveys](https://doi.org/10.1145/2523813) - the broad reference on detecting and adapting to drift.

=== step === complete
## Lesson 2 complete

You can now catch distribution shift with no labels in hand: the Population Stability Index reading a feature's binned histogram against the 0.1 / 0.2 lines, the Kolmogorov-Smirnov test measuring the largest gap between two cumulative curves with a p-value, and the classifier two-sample test turning "did the data move?" into "can a model tell the two samples apart?" You also saw where each one is blind, and why a drift alarm flags the inputs, not the accuracy.

Detecting drift is only half the job. Next, Lesson 3: Adapting to drift. You will correct covariate shift by importance-weighting the training data with a density ratio, and set principled retraining triggers, a monitored metric crossing a control limit, instead of retraining blindly on a schedule.

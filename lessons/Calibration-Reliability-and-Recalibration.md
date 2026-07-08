---
title: "Uncertainty Quantification Lesson 5: Calibration, Reliability and Recalibration"
catalog_blurb: "Test whether a predicted probability is honest, and fix it when it is not."
description: "Calibration in R: read a reliability diagram, measure miscalibration with ECE and the Brier score, then recalibrate with Platt scaling and isotonic regression."
keywords: "calibration, reliability diagram, expected calibration error, ECE, Brier score, Platt scaling, isotonic regression, probability calibration, recalibration, over-confident model, discrimination vs calibration, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "5"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "The-Bootstrap-and-Jackknife-Plus.html"
course_prev: "Quantile-and-Distributional-Regression.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Calibration, Reliability and Recalibration

For four lessons you have been building things that report a number and asking it to be honest: a prediction interval that really covers 90% of the time, a quantile band whose width breathes with the data. Every one of those promises rested on a probability meaning what it says. This lesson finally puts that assumption on trial.

Meet Nadia. She built the rain model behind a bike-courier app: every morning it gives each neighborhood a probability of rain, and the dispatcher pays for extra rain-gear couriers wherever that number tops 0.6. So the number is not decoration, it spends real money. If the model says "0.90 chance of rain" on mornings when it actually rains only about eight times in ten, Nadia is over-provisioning gear she did not need. Her model is good at *ranking* the wet mornings above the dry ones, and yet its probabilities can still be lies. Telling those two things apart, and repairing the second without touching the first, is the whole lesson.

By the end you will be able to:

- Say exactly what a *calibrated* probability is, and read a reliability diagram to spot an over-confident or under-confident model
- Put a single number on miscalibration with the expected calibration error and the Brier score, in R
- Recalibrate a model with Platt scaling and isotonic regression, on a held-out set, and prove the fix worked while its ranking power stayed identical

**Prerequisites:** [Lessons 1 to 4](Prediction-Intervals-You-Can-Trust.html) of this course (prediction intervals, coverage, and the held-out-split idea you met in conformal). Base R: `glm()`, `plogis()`/`qlogis()`, `predict()`, logical indexing, and writing a small function. Every new term is defined as it appears.

::widget calibration-curve {}

=== step === concept
::eyebrow Where we left off
## A predicted probability is a promise

In Lesson 4 you priced Rohan's homes, a number outcome, and asked whether an interval covered it. Nadia's world is different in one way that changes everything: her outcome is a yes/no event (did it rain?), and her model reports a *probability*. There is no interval to check. Instead there is a subtler promise to keep.

A probability is **calibrated** when it matches long-run reality. Take every morning where the model said "0.70 chance of rain." If it truly rained on about 70% of those mornings, the 0.70 was honest. If it rained on only 55% of them, the model was over-confident: it said 0.70 but the world delivered 0.55. Calibration is that simple, and that demanding, promise: *of all the times you say q, a fraction q should come true.*

Let us build Nadia's world so we can test it. Each lesson runs in a fresh R session, so we create the data right here (run this once). We simulate an honest rain chance from the morning's humidity, draw whether it actually rained, and then, crucially, give the model a score that **ranks mornings correctly but is too extreme**, the single most common way real models (boosted trees, neural nets, naive Bayes) go wrong.

```r
set.seed(11)
n        <- 4000
humidity <- runif(n, 0, 1)                    # 0 = bone dry air, 1 = saturated
true_lo  <- -0.3 + 4.6 * (humidity - 0.5)     # the honest log-odds of rain
true_p   <- plogis(true_lo)                    # the honest probability
rain     <- rbinom(n, 1, true_p)               # did it actually rain? 1 = yes

# Nadia's model: SAME ranking as the truth, but over-confident (log-odds stretched 1.6x)
model_p  <- plogis(1.6 * true_lo)

dat  <- data.frame(humidity, model_p, rain)
cal  <- dat[1:2000, ]     # a held-out CALIBRATION set (we will need it later)
test <- dat[2001:4000, ]  # a separate set for honest scoring
round(range(model_p), 3)
#> [1] 0.015 0.961
c(base_rate = round(mean(test$rain), 3))
#> base_rate
#>     0.456
```

The model issues the full range of confidences, from 0.015 to 0.961, and it rains on about 46% of test mornings overall. Stretching the log-odds by 1.6 keeps the *order* of the mornings exactly as the truth had it (a bigger honest chance is still a bigger score), so the model ranks perfectly well. What it breaks is the *values*: high scores are pushed too high and low scores too low. Now we need a way to see that.

=== step === widget
::eyebrow The picture
## What a reliability diagram shows

To check the promise you cannot look at one prediction, a single "0.70" morning either rained or did not. You have to gather all the mornings with a similar prediction and ask what fraction of *them* rained. That is a **reliability diagram**: chop the predictions into bins (0 to 0.1, 0.1 to 0.2, and so on), and for each bin plot the mean predicted probability on the x-axis against the observed frequency of rain on the y-axis.

A perfectly calibrated model lands every point on the 45-degree diagonal, because in each bin the predicted probability equals the observed frequency. Formally, calibration is the statement

\[ \mathbb{P}\!\left(Y = 1 \;\middle|\; \hat p = q\right) \;=\; q \qquad \text{for every } q, \]

read as: among all cases the model assigns probability \(q\) (here \(\hat p\) is the model's predicted probability and \(Y\) is the 0/1 outcome), the fraction that turn out positive is exactly \(q\). When a model strays off the diagonal it does so in one of two ways. Drag the slider below from **over-confident** to **under-confident** and watch the curve bow:

::widget calibration-curve {}

- **Over-confident** (the curve bows below the diagonal on the right, above it on the left): the model exaggerates, pushing predictions toward 0 and 1, so its high claims overstate the true chance and its low claims understate it. This is Nadia's model.
- **Under-confident** (the curve bows the other way): the model hedges toward the middle, so a stated 0.70 actually happens more than 70% of the time.

The runnable panel beside the chart fits a real logistic model, bins its predictions, and draws this exact curve. Next we draw it for Nadia.

=== step === concept
::eyebrow In R
## Read Nadia's reliability curve

Let us compute the diagram for the raw model on the test set. We write one small helper that bins the predictions and, for each bin, returns the mean prediction, the observed rain frequency, and the bin's size.

```r
reliability <- function(p, y, bins = 10) {
  cut_pts <- seq(0, 1, length.out = bins + 1)
  b       <- cut(p, cut_pts, include.lowest = TRUE)   # which bin each prediction falls in
  data.frame(
    predicted = tapply(p, b, mean),   # mean predicted probability in the bin
    observed  = tapply(y, b, mean),   # fraction that actually rained
    n         = tapply(y, b, length)) # how many mornings in the bin
}
rel <- reliability(test$model_p, test$rain)
round(rel, 3)
#>           predicted observed   n
#> [0,0.1]       0.048    0.092 532
#> (0.1,0.2]     0.148    0.307 218
#> (0.2,0.3]     0.249    0.365 137
#> (0.3,0.4]     0.349    0.460 124
#> (0.4,0.5]     0.454    0.500 126
#> (0.5,0.6]     0.552    0.590 117
#> (0.6,0.7]     0.650    0.610 136
#> (0.7,0.8]     0.754    0.623 167
#> (0.8,0.9]     0.854    0.770 200
#> (0.9,1]       0.935    0.885 243
```

Read the two columns against each other. Down in the `[0,0.1]` bin the model predicted 0.048 but 0.092 of those mornings rained: it was *too low*. Up in the `(0.7,0.8]` bin it predicted 0.754 but only 0.623 rained: *too high*. Low predictions understate, high predictions overstate, exactly the over-confident signature. Plotting `predicted` against `observed` makes the bow obvious against the diagonal:

```r
plot(rel$predicted, rel$observed, type = "b", pch = 19, col = "#1a73e8",
     xlim = 0:1, ylim = 0:1,
     xlab = "mean predicted probability", ylab = "observed rain frequency",
     main = "Reliability: Nadia's raw model")
abline(0, 1, lty = 2)              # the diagonal = perfect calibration
```

Run it. The line sits above the diagonal on the left and dips below it on the right, sagging away from the honest 45 degrees precisely where Nadia's dispatcher is spending money.

=== step === quiz
::eyebrow Check yourself
## Over-confident or under-confident?

In the `(0.7,0.8]` bin, Nadia's model predicted an average of **0.754** but only **0.623** of those mornings actually rained. On mornings the model calls high, is it over-confident or under-confident, and what does that mean for the dispatcher's "gear if above 0.6" rule?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Over-confident: its high claims overstate the true chance, so the dispatcher orders rain gear on more mornings than really need it ::ok Right. Predicted 0.75 but observed 0.62 means the model exaggerates on the high end, so a "0.7 chance" morning rains less often than promised, and the app over-provisions.
- Under-confident: 0.623 is still a high number, so the model is hedging and should be pushed even higher ::no Look at the direction: the model said 0.754 and reality delivered 0.623, so it claimed MORE than happened. That is over-confidence (overstating), not hedging. Under-confidence would be predicted BELOW observed.
- Neither: a gap of about 0.13 is too small to call, the model is essentially calibrated here ::no A systematic 0.13 overstatement across a bin of 167 mornings is exactly the miscalibration we are hunting, and it repeats in every high bin. It is a real, spendable error, not noise.

=== step === concept
::eyebrow Put a number on it
## Expected calibration error, and the Brier score

Eyeballing a curve is a start, but Nadia needs a single number to track. The **expected calibration error** (ECE) is the natural one: the average gap between predicted and observed across the bins, weighted by how many predictions land in each bin. With \(B\) bins, bin \(b\) holding \(n_b\) of the \(n\) predictions,

\[ \text{ECE} \;=\; \sum_{b=1}^{B} \frac{n_b}{n}\,\bigl|\, \text{obs}_b - \text{pred}_b \,\bigr|, \]

where \(\text{pred}_b\) is the mean predicted probability in bin \(b\) and \(\text{obs}_b\) is the observed frequency there. It is 0 for a perfectly calibrated model and grows as the curve pulls away from the diagonal. We already have every piece in `reliability()`:

```r
ece <- function(p, y, bins = 10) {
  r <- reliability(p, y, bins)
  r <- r[!is.na(r$observed), ]                 # drop any empty bin
  sum(r$n / sum(r$n) * abs(r$observed - r$predicted))
}
round(ece(test$model_p, test$rain), 4)
#> [1] 0.0771
```

An ECE of 0.077 means Nadia's stated probabilities are off by about 8 percentage points on average, weighted across the mornings, a lot when each point of that error is dispatch money. A second, complementary number is the **Brier score**, the mean squared distance between the predicted probability and the 0/1 outcome:

\[ \text{Brier} \;=\; \frac{1}{n}\sum_{i=1}^{n} \left(\hat p_i - y_i\right)^2 . \]

Where ECE only asks whether the probabilities are honest *on average within a bin*, the Brier score is a **proper scoring rule**: it rewards being both honest and confident in the right places, and it is minimized only by the true probabilities. Lower is better on both.

```r
brier <- function(p, y) mean((p - y)^2)
round(brier(test$model_p, test$rain), 4)
#> [1] 0.1799
```

Hold onto 0.0771 and 0.1799. They are the "before" that recalibration has to beat.

=== step === tryit
::eyebrow Your turn
## Measure the over-confidence where it costs money

The dispatcher acts on mornings the model rates above 0.6. So the number that matters to Nadia is concrete: of exactly those mornings, what fraction actually rained? `test$rain` is 1 for a rainy morning, and `test$model_p` is the model's claim. Fill in the blank to compute the observed rain frequency among the mornings the model rated above 0.6.

```r
# fraction of ACTUALLY rainy mornings, among those the model rated > 0.6
obs_high <- ____
round(obs_high, 3)
```
::check {"regex":"mean\\(\\s*test\\$rain\\[\\s*test\\$model_p\\s*>\\s*0\\.6\\s*\\]\\s*\\)","gate":true,"difficulty":"beginner","ok":"0.745. The model averaged a claim near 0.82 on those same mornings, so it overstated the chance by about 8 points on exactly the days the dispatcher spends. Coverage of a subset is the mean of a TRUE/FALSE vector restricted to it: mean(test$rain[test$model_p > 0.6]).","no":"You want the mean of the 0/1 rain outcome, restricted to the high-confidence mornings. Subset test$rain by the condition test$model_p > 0.6, then take its mean: mean(test$rain[test$model_p > 0.6])."}
::solution
```r
obs_high <- mean(test$rain[test$model_p > 0.6])
round(obs_high, 3)
#> [1] 0.745
```

=== step === concept
::eyebrow The trap
## Why a great AUC does not save you

Here is where most people go wrong. Nadia's model is genuinely *good* at telling wet mornings from dry ones. The standard measure of that skill is the **AUC** (area under the ROC curve): the probability that a randomly chosen rainy morning is scored higher than a randomly chosen dry one. A tiny base-R computation gives it via ranks:

```r
auc <- function(p, y) {
  n1 <- sum(y == 1); n0 <- sum(y == 0)
  r  <- rank(p)                                   # rank the scores, ties averaged
  (sum(r[y == 1]) - n1 * (n1 + 1) / 2) / (n1 * n0)
}
round(auc(test$model_p, test$rain), 4)
#> [1] 0.8174
```

0.82 is a solidly discriminating model. And yet we just saw it is badly miscalibrated. How can both be true? Because **AUC only reads the ranking**. It asks whether wet mornings score higher than dry ones, never whether the scores equal the right probabilities. Squash, stretch, or bend the scores any way you like, as long as the *order* is preserved the AUC does not move a hair. That is exactly why over-confidence is invisible to it: stretching the log-odds by 1.6 kept the order intact.

[KEY INSIGHT]
**Discrimination** (does the model rank cases correctly? measured by AUC or accuracy) and **calibration** (do the probabilities match reality? measured by ECE or Brier) are *different goals*. A model can ace one and fail the other. To see the two come apart completely, look at a model that predicts the base rate, the overall rain frequency, for every single morning:

```r
base_p <- rep(mean(cal$rain), nrow(test))         # same number for everyone
c(ECE = round(ece(base_p, test$rain), 4),
  AUC = round(auc(base_p, test$rain), 4))
#>    ECE    AUC
#> 0.0085 0.5000
```

This lazy model is *beautifully* calibrated (ECE near 0: on average it states the true rain rate) and *completely* useless (AUC 0.5: it cannot tell any morning from any other). Calibration without discrimination is worthless, and, as Nadia's model shows, discrimination without calibration is dangerous. You want both, and AUC will never tell you about the second one.

=== step === quiz
::eyebrow Check yourself
## Is a high AUC enough?

A teammate ships a churn model with **AUC 0.91** and says: "the AUC is excellent, so the predicted probabilities are trustworthy, we can act on the numbers directly." Its reliability curve, though, bows well below the diagonal on the high end. Who is right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The teammate is right: an AUC of 0.91 is high enough that the probabilities must be close to correct ::no AUC measures only ranking, not whether the numbers are honest. A model can rank almost perfectly (AUC 0.91) and still be badly over-confident, which is exactly what a curve bowing below the diagonal shows.
- The teammate is wrong: AUC certifies the ranking, but the bowing curve shows the probabilities themselves are miscalibrated, so acting on their values (thresholds, expected costs) will misfire ::ok Exactly. Discrimination and calibration are separate. A high AUC guarantees good ordering, nothing about whether "0.8" means 0.8. Before trusting the values, check and if needed fix calibration.
- The teammate is wrong, but only because AUC above 0.9 is impossible in practice, so the number must be an error ::no AUC of 0.91 is perfectly achievable. The real issue is not the AUC value, it is that AUC cannot see calibration at all, so a high one does not license trusting the probabilities.

=== step === concept
::eyebrow The fix
## Recalibration, and the golden rule of a held-out set

Good news: because the ranking is already fine, we do not need a new model. We only need to *relabel* the scores, learning a function that maps each raw score to the probability that actually holds there. Since the ranking must be preserved (we do not want to undo the discrimination we have), that function must be **monotone**: it may stretch and bend the scores but never reorder them. Learn a good monotone map and the curve snaps back onto the diagonal while the AUC stays put. That relabeling is **recalibration**.

There is one non-negotiable rule about *where* you learn it. You must fit the calibration map on a **held-out calibration set**: data the model did not train on and that you will not use to report the final score. Fit it on the model's own training data and the map learns the model's memorized quirks, reporting rosy calibration that evaporates on new mornings, the same leakage trap that made us split off a calibration set for conformal in Lessons 2 and 3. That is exactly why we carved out `cal` back at the start.

::widget process-flow {"steps":[{"title":"Split off a calibration set","sub":"held-out rows the model never trained on"},{"title":"Fit the calibrator on it","sub":"learn a monotone map from raw score to honest probability"},{"title":"Apply it, then score on a separate test set","sub":"so the reported calibration is honest, not leaked"}]}

Two classic ways to learn that map follow: a parametric one (Platt) and a nonparametric one (isotonic).

=== step === concept
::eyebrow Method 1
## Platt scaling: a logistic recalibration

**Platt scaling** assumes the fix has a simple shape: a logistic (S-shaped) squashing of the model's log-odds. You fit an ordinary logistic regression whose single predictor is the model's own score on the log-odds scale, and whose response is the true outcome. Writing \(s\) for a raw score and \(\sigma(z) = 1/(1+e^{-z})\) for the logistic function, the calibrated probability is

\[ g(s) \;=\; \sigma\!\left(a + b\,\operatorname{logit}(s)\right), \qquad \operatorname{logit}(s) = \log\frac{s}{1-s}, \]

and the intercept \(a\) and slope \(b\) are fit by logistic regression on the calibration set. The slope \(b\) is the key: our model over-stretched the log-odds by 1.6, so a slope near \(1/1.6 \approx 0.63\) would exactly undo it. Let us fit it and see.

```r
cal$logodds <- qlogis(cal$model_p)                       # the model's score as log-odds
platt <- glm(rain ~ logodds, data = cal, family = binomial)
round(coef(platt), 3)
#> (Intercept)     logodds
#>       0.065       0.577
```

The fitted slope is 0.58, close to the 0.63 that would perfectly reverse the 1.6x stretch (not exact, because the calibrator learns from noisy 0/1 rain, not the hidden true probabilities, an honest limit of any calibration). A slope below 1 shrinks the over-confident log-odds back toward the middle. Apply it to the test set and look at one headline morning, the model's most confident "0.90 chance of rain":

```r
test$platt_p <- predict(platt, newdata = data.frame(logodds = qlogis(test$model_p)),
                        type = "response")
round(ece(test$platt_p, test$rain), 4)
#> [1] 0.032
round(predict(platt, newdata = data.frame(logodds = qlogis(0.90)), type = "response"), 3)
#>     1
#> 0.791
```

The ECE fell from 0.077 to 0.032, less than half. And Platt now reports that a raw "0.90" morning really carries about a **0.79** chance of rain, honest arithmetic Nadia's dispatcher can finally trust.

=== step === tryit
::eyebrow Your turn
## What the fix does to the decision

Recalibration is not an academic tidy-up, it changes what the app *does*. The raw model flagged **746** of the 2000 test mornings as "gear needed" (probability above 0.6). Now that Platt has pulled the over-confident high scores down toward the truth, how many mornings clear the same 0.6 line? `test$platt_p` holds the calibrated probabilities. Fill in the blank.

```r
# how many test mornings does the CALIBRATED model still flag (prob > 0.6)?
flagged_platt <- ____
flagged_platt
```
::check {"regex":"sum\\(\\s*test\\$platt_p\\s*>\\s*0\\.6\\s*\\)","gate":true,"difficulty":"intermediate","ok":"690, down from 746. About 56 mornings that the over-confident model pushed above the line fall back under it once the probabilities are honest, so Nadia stops paying for gear on days that did not warrant it. Counting how many values clear a threshold is the sum of a TRUE/FALSE vector: sum(test$platt_p > 0.6).","no":"You want the count of calibrated probabilities above 0.6. test$platt_p > 0.6 is a TRUE/FALSE vector; its sum counts the TRUEs: sum(test$platt_p > 0.6)."}
::solution
```r
flagged_platt <- sum(test$platt_p > 0.6)
flagged_platt
#> [1] 690
```

=== step === concept
::eyebrow Method 2
## Isotonic regression: let the data choose the shape

Platt assumes the miscalibration is a smooth logistic squashing. But what if the true reliability curve has kinks Platt's S cannot follow? **Isotonic regression** drops the shape assumption entirely and fits the *best possible monotone step function*, the non-decreasing map that minimizes squared error to the outcomes:

\[ \hat g \;=\; \arg\min_{g \,\text{ non-decreasing}} \; \sum_{i=1}^{n} \bigl(g(s_i) - y_i\bigr)^2 . \]

Base R computes it with `isoreg()` (the pool-adjacent-violators algorithm). We sort the calibration scores, fit the isotonic values, and turn them into a lookup we can apply to new scores with `approxfun()`:

```r
o        <- order(cal$model_p)                           # isoreg wants x in order
iso_fit  <- isoreg(cal$model_p[o], cal$rain[o])
iso_map  <- approxfun(cal$model_p[o], iso_fit$yf,        # a step function score -> prob
                      method = "constant", rule = 2, ties = "ordered")
test$iso_p <- iso_map(test$model_p)
round(ece(test$iso_p, test$rain), 4)
#> [1] 0.0279
```

Isotonic drives the ECE down to 0.028, a touch better than Platt's 0.032 here, because it can bend to the data's exact shape instead of assuming an S. That flexibility is a double-edged sword: with few calibration points a step function chases noise and overfits, whereas Platt's two parameters stay steady. Isotonic shines when you have thousands of held-out points (Nadia has 2000); Platt is the safer default on a few hundred.

=== step === concept
::eyebrow Weigh it up
## Which one, and where recalibration stops

Line up all three on the same test set. The `auc` column is the one to stare at.

```r
compare <- data.frame(
  model = c("raw", "Platt", "isotonic"),
  ECE   = round(c(ece(test$model_p, test$rain),
                  ece(test$platt_p, test$rain),
                  ece(test$iso_p,   test$rain)), 4),
  Brier = round(c(brier(test$model_p, test$rain),
                  brier(test$platt_p, test$rain),
                  brier(test$iso_p,   test$rain)), 4),
  AUC   = round(c(auc(test$model_p, test$rain),
                  auc(test$platt_p, test$rain),
                  auc(test$iso_p,   test$rain)), 4))
compare
#>      model    ECE  Brier    AUC
#> 1      raw 0.0771 0.1799 0.8174
#> 2    Platt 0.0320 0.1742 0.8174
#> 3 isotonic 0.0279 0.1747 0.8153
```

Both fixes cut the ECE and the Brier score sharply, and the AUC barely moves: 0.8174 to 0.8174 for Platt (identical, because a logistic map is monotone) and 0.8153 for isotonic (a whisker of wobble from tied steps). That is the promise of recalibration made concrete: **it makes the probabilities honest without spending or gaining a single point of ranking power.**

[WARNING]
Recalibration is a relabeling, not a rescue. Three limits to respect:

- It **cannot improve discrimination.** A monotone map preserves the ranking, so if the underlying model ranks poorly (AUC near 0.5), calibrating it just gives you honest but useless probabilities. Fix ranking by improving the model; fix calibration by recalibrating.
- It is **population-specific.** A map fit on one season or one city calibrates *that* distribution. Ship the model somewhere the base rate differs and you must recalibrate again.
- It **needs enough held-out data**, and always data the model never trained on. Too few points and isotonic overfits; the wrong data and the calibration is leaked and fake.

Pick Platt for small calibration sets or a smooth sigmoidal bow; pick isotonic when you have plenty of held-out data and the miscalibration might be an odd shape.

=== step === quiz
::eyebrow Check yourself
## Choose the method

You have a model whose reliability curve is a smooth, stretched-S over-confidence, and only about **200** labeled points to calibrate on. Which recalibration method is the safer choice, and what will it do to the model's AUC?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Platt scaling, because its two parameters are stable on a small set and its S-shape matches the smooth bow, and the AUC will be unchanged because Platt is a monotone map ::ok Exactly. With few points, isotonic's step function would chase noise; Platt's smooth two-parameter fit stays steady and matches a sigmoidal bow. And since any calibration map is monotone, the ranking, so the AUC, is untouched.
- Isotonic regression, because it is more flexible, and the extra flexibility will also raise the AUC by fitting the data better ::no Two errors. On only 200 points isotonic tends to overfit, and no calibration map can raise AUC: monotone relabeling never changes the ranking. Flexibility here buys noise, not discrimination.
- Either one, because both are calibration methods they will give the same result and the AUC will drop toward 0.5 ::no They differ (isotonic risks overfitting on 200 points; Platt is steadier), and recalibration does not push AUC toward 0.5. It leaves the ranking, and thus the AUC, essentially unchanged.

=== step === concept
::eyebrow Go deeper
## References

- [Niculescu-Mizil and Caruana (2005), Predicting Good Probabilities With Supervised Learning (ICML)](https://doi.org/10.1145/1102351.1102430) - the careful empirical comparison of Platt scaling and isotonic regression across many learners, and which model families need calibrating; the standard reference for the two methods you just used.
- [Zadrozny and Elkan (2002), Transforming Classifier Scores into Accurate Multiclass Probability Estimates (KDD)](https://doi.org/10.1145/775047.775151) - the paper that brought isotonic regression to probability calibration.
- [Guo, Pleiss, Sun and Weinberger (2017), On Calibration of Modern Neural Networks (ICML)](https://arxiv.org/abs/1706.04599) - reliability diagrams, expected calibration error, and why modern high-accuracy models are so often over-confident.
- [scikit-learn User Guide: Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) - a clear, worked reference implementation of both sigmoid (Platt) and isotonic calibration with reliability curves, if you want to see the same ideas in another ecosystem.

=== step === complete
## Lesson 5 complete

You put a model's probabilities on trial and learned to repair them. A probability is **calibrated** when, of all the times you say \(q\), a fraction \(q\) come true; a **reliability diagram** shows the promise kept or broken, and **ECE** and the **Brier score** put a number on it. You saw the trap that fools most practitioners: a high **AUC** certifies ranking, never honesty, so discrimination and calibration are genuinely different goals, one provable with a base-rate model that is perfectly calibrated and perfectly useless. Then you fixed Nadia's over-confident model two ways, **Platt scaling** (a logistic squashing of the log-odds) and **isotonic regression** (the best monotone step function), always on a held-out set, cutting the ECE by more than half while the AUC stood still, and you even watched 56 needless gear-days fall off the dispatcher's ledger.

Next, Lesson 6: The Bootstrap and the Jackknife+. So far every interval and probability leaned on a model's assumptions. Now you will get uncertainty almost for free by *resampling the data itself*, turning one dataset into a whole sampling distribution, and turn leave-one-out residuals into a predictive interval with a coverage guarantee.

---
title: "Machine Learning in Production Lesson 5: Monitoring and drift"
catalog_blurb: "Spot when a live model's inputs or accuracy drift, and when to retrain."
description: "Model monitoring and drift in R: why a launched model decays, detect data drift with PSI, tell it from concept drift, and know when to retrain."
keywords: "model monitoring, data drift, concept drift, population stability index, PSI in R, when to retrain, MLOps monitoring, model decay, distribution shift, model performance monitoring"
post_type: "LESSON"
curriculum_id: "6.120.5"
webr: true
mathjax: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "5"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: "An-ML-System-Design-Checklist.html"
course_prev: "Batch-vs-Real-Time-Inference.html"
---

=== step === cover
::eyebrow Lesson 5 of 6
## Monitoring and drift

Dev's meal-kit cancellation model launched three months ago at about 79% accuracy, and everyone moved on. This morning the retention team notices something odd: the discount emails the model targets are landing on subscribers who were never going to leave, while the ones quietly cancelling get nothing. Nobody changed a line of code. The model did not break. The world it was trained on did.

That is drift, and it is the quietest failure in machine learning: no error, no crash, just decisions getting worse while every dashboard stays green. This lesson is about catching it before your users do.

By the end of this lesson you will be able to:

- Explain why a model that was accurate at launch decays even though its code never changes
- Detect data drift by comparing live inputs to what the model trained on, and put a number on it with the population stability index (PSI)
- Tell data drift from concept drift, and decide when a monitoring signal means it is time to retrain

**Prerequisites:** Lesson 4 (predictions flowing in [batch or real time](Batch-vs-Real-Time-Inference.html)), and you can [fit a model and read `predict` output](Your-First-End-to-End-Model-in-R.html).

::widget drift-monitor {}

=== step === concept
::eyebrow Why models decay
## A model is a snapshot of a world that keeps moving

When Dev trained the cancellation model, it learned the patterns in one specific slice of time: last quarter's subscribers, last quarter's prices, last quarter's reasons for leaving. Training freezes those patterns into fixed coefficients. From that moment the model is a photograph, and photographs do not update themselves.

Then the world moves. Two months after launch a cheaper rival, FreshBox, opens for business. Boxes get discounted to compete, so the typical price a subscriber pays drifts down. And the reason people cancel changes: where idle weeks used to be the main signal, now even loyal, long-tenure customers leave, lured by the cheaper option. The model never saw any of this. It keeps applying last quarter's rules to this quarter's world, and quietly gets them wrong.

::widget process-flow {"steps":[{"title":"Train on the launch world","sub":"the model freezes the patterns it saw into fixed coefficients"},{"title":"Deploy and walk away","sub":"the coefficients never update on their own"},{"title":"The world shifts","sub":"a cheaper rival launches, prices fall, churn reasons change"},{"title":"The model is blind to it","sub":"it applies old rules to new inputs it was never trained on"},{"title":"Decisions quietly degrade","sub":"accuracy slips while nothing errors or crashes"}]}

We do not have to take this on faith. Let us rebuild Dev's model from scratch, then score it on a fresh batch from the launch-era world and on a batch from the world three months later, and read the two accuracies side by side.

```r
# Dev's meal-kit cancellation model, rebuilt from scratch. Each lesson runs in a
# fresh R session, so we simulate the subscribers it trained on, inline.
clip <- function(x, lo, hi) pmax(lo, pmin(hi, x))
set.seed(1)
n <- 1500
launch <- data.frame(
  weeks_since   = rpois(n, 3),                              # weeks since last order
  boxes_ordered = rpois(n, 8) + 1,                          # lifetime boxes
  spend_per_box = round(clip(rnorm(n, 15, 3.5), 6, 24), 1)  # dollars per box
)
# The world at launch: idle weeks drive cancellation; price does not matter yet.
launch$cancelled <- rbinom(n, 1,
  plogis(-3.5 + 1.15 * launch$weeks_since - 0.06 * launch$boxes_ordered))
model <- glm(cancelled ~ weeks_since + boxes_ordered + spend_per_box,
             data = launch, family = binomial)

accuracy <- function(batch)
  mean((predict(model, batch, type = "response") > 0.5) == batch$cancelled)

# A fresh batch from the world the model launched in
set.seed(11)
launch_batch <- data.frame(
  weeks_since = rpois(500, 3), boxes_ordered = rpois(500, 8) + 1,
  spend_per_box = round(clip(rnorm(500, 15, 3.5), 6, 24), 1))
launch_batch$cancelled <- rbinom(500, 1,
  plogis(-3.5 + 1.15 * launch_batch$weeks_since - 0.06 * launch_batch$boxes_ordered))

# Three months later: FreshBox (cheaper) has launched. Boxes are cheaper (spend drifts
# down) and even loyal customers now leave, so price starts to predict churn.
set.seed(12)
later_batch <- data.frame(
  weeks_since = rpois(500, 3), boxes_ordered = rpois(500, 8) + 1,
  spend_per_box = round(clip(rnorm(500, 12.5, 3.5), 6, 24), 1))
later_batch$cancelled <- rbinom(500, 1,
  plogis(-2.55 + 1.15 * later_batch$weeks_since - 0.06 * later_batch$boxes_ordered
         + 0.07 * later_batch$spend_per_box))

round(c(launch = accuracy(launch_batch), later = accuracy(later_batch)), 2)
#> launch  later
#>   0.79   0.65
```

Same model, same code, fourteen points of accuracy gone. Nothing alerted, because from the code's point of view nothing happened. The only way to catch this is to watch for it on purpose. The rest of the lesson is how.

=== step === quiz
::eyebrow Check yourself
## What actually got worse?

Dev's model scored 0.79 at launch and 0.65 three months later, with no code change in between. A teammate says "the model must have a bug that crept in." What is the accurate way to describe what happened?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model developed a bug: its accuracy dropped, so its code must have changed or corrupted ::no The coefficients are byte-for-byte identical to launch day. Nothing in the model changed. Accuracy can fall with zero code changes, and that is exactly what makes drift dangerous.
- The model is unchanged, but the world it scores has shifted away from the data it was trained on, so its frozen rules now fit worse ::ok Exactly. The model is a fixed snapshot; the incoming subscribers, their prices, and their reasons for leaving have moved. Same rules, new world, worse fit. That is drift.
- The model overfit the training data, and overfitting always surfaces a few months after launch ::no Overfitting is a training-time problem you would have caught at launch on held-out data. Here the model was genuinely good at launch (0.79) and decayed later because the inputs changed, not because it memorized.

=== step === concept
::eyebrow The direct signal
## Watch performance, and know why it arrives late

The most honest way to know if a model still works is to check its answers against reality. As real outcomes arrive, whether each scored subscriber actually cancelled, you recompute the metric on that fresh batch and watch it over time. Here is that scoreboard for Dev's model, week by week, as the world drifts:

```r
# As real outcomes arrive, re-score each new week's batch and track accuracy.
simulate_week <- function(seed, drift) {
  set.seed(seed)
  d <- data.frame(
    weeks_since = rpois(300, 3), boxes_ordered = rpois(300, 8) + 1,
    spend_per_box = round(clip(rnorm(300, 15 - 2.5 * drift, 3.5), 6, 24), 1))
  d$cancelled <- rbinom(300, 1,
    plogis((-3.5 + 0.95 * drift) + 1.15 * d$weeks_since - 0.06 * d$boxes_ordered
           + (0.07 * drift) * d$spend_per_box))
  d
}
# drift climbs from 0 (launch world) to 1 (fully shifted) across eight weeks
weekly <- data.frame(week = 1:8)
weekly$accuracy <- sapply(1:8, function(w) round(accuracy(simulate_week(100 + w, (w - 1) / 7)), 3))
weekly
#>   week accuracy
#> 1    1    0.817
#> 2    2    0.783
#> 3    3    0.777
#> 4    4    0.753
#> 5    5    0.720
#> 6    6    0.737
#> 7    7    0.667
#> 8    8    0.573
```

The slide is unmistakable, and this is the ground truth: it measures the exact thing you care about, whether the predictions were right. But it has a catch that makes it insufficient on its own.

[WARNING]
Performance monitoring needs labels, and labels are late. You only learn whether a subscriber "really cancelled" after they do, which can be weeks after the model scored them. So this week's accuracy cannot even be computed until this week's outcomes land. By the time the scoreboard turns red, the model has already been making bad calls for weeks. You need a warning that does not wait for the truth.

=== step === concept
::eyebrow The early warning
## Data drift: watch the inputs, not the late labels

Since the labels are late, watch the thing that arrives immediately: the inputs. Every subscriber the model scores today hands over their features right now, no waiting. **Data drift** is when the distribution of an input feature moves away from the distribution the model trained on. You can measure it the same day the traffic arrives, weeks before the true outcomes come back.

Take the price feature. At launch, spend per box was centred around $15. After FreshBox forces discounts, this week's traffic centres lower. Drag the control below: the dashed outline is what the model trained on (the reference), the solid bars are live traffic. As the weeks pass, the live distribution pulls away, and a single number, the PSI, climbs until it trips an alert.

::widget drift-monitor {}

The model has not been told anything is wrong, and no outcome label has arrived yet. But the inputs alone already show that today's subscribers do not look like the ones the model learned from. That is your early warning, bought weeks before performance monitoring could say a word.

=== step === concept
::eyebrow Putting a number on it
## PSI: one number for how far the inputs moved

"The distribution moved" is a picture; to alert on it automatically you need a number. The **population stability index (PSI)** compares two distributions of the same feature, the training reference and the live sample, bin by bin, and sums how different they are.

Chop the feature's range into \(B\) bins (usually ten, cut at the reference deciles). For each bin \(i\), let \(e_i\) be the fraction of the **reference** (training) data that falls in it and \(o_i\) the fraction of the **live** data. PSI is:

\[ \text{PSI} = \sum_{i=1}^{B} (o_i - e_i)\,\ln\!\left(\frac{o_i}{e_i}\right) \]

Read it bin by bin: take how much the live share differs from the reference share, \((o_i - e_i)\), and weight it by the log ratio \(\ln(o_i / e_i)\) of the two shares. When the distributions match, every \(o_i = e_i\), each term is zero, and PSI is zero. The more the shares diverge, the larger PSI grows. The industry-standard reading:

- \(\text{PSI} < 0.1\): stable, the inputs still look like training.
- \(0.1 \le \text{PSI} < 0.2\): moderate drift, keep watching.
- \(\text{PSI} \ge 0.2\): significant drift, the live inputs no longer match training, act.

[NOTE]
If a bin is empty in one sample, its share is zero and \(\ln\) of zero blows up. In practice you floor each share at a tiny value (like \(10^{-4}\)) before taking the ratio. You will use exactly that guard in the code next.

=== step === tryit
::eyebrow In R
## Compute PSI yourself

Here is PSI in plain base R, no packages. Build the training reference and this week's live sample, bin both at the reference deciles, then sum the per-bin terms. One piece of the formula is blanked out: fill it so each bin's live share \(o_i\) is compared against its reference share \(e_i\).

```r
# PSI compares this week's live inputs to the training reference, bin by bin.
set.seed(1)
reference <- rnorm(1500, 15, 3.5)   # spend-per-box the model trained on
live      <- rnorm(500, 12.5, 3.5)  # this week's live traffic: cheaper boxes

# 10 bins cut at the reference deciles, open at the ends so live tails still land
cuts <- quantile(reference, probs = seq(0, 1, 0.1))
cuts[1] <- -Inf; cuts[length(cuts)] <- Inf
expected <- as.numeric(table(cut(reference, cuts))) / length(reference)  # e_i
observed <- as.numeric(table(cut(live,      cuts))) / length(live)       # o_i

# PSI = sum of (o - e) * log(o / e), each share floored so log never blows up
psi <- sum((observed - expected) * log(pmax(observed, 1e-4) / pmax(____, 1e-4)))
round(psi, 3)
```
::check {"regex":"pmax\\(\\s*expected","gate":true,"difficulty":"intermediate","ok":"That is it: each bin divides the live share by the EXPECTED (reference) share, so PSI measures how far live has pulled from training. Here it lands at 0.473, well past the 0.2 alert line.","no":"The denominator is the reference share, expected. Fill the blank with expected so the ratio reads pmax(observed, 1e-4) / pmax(expected, 1e-4)."}
::solution
```r
set.seed(1)
reference <- rnorm(1500, 15, 3.5)
live      <- rnorm(500, 12.5, 3.5)
cuts <- quantile(reference, probs = seq(0, 1, 0.1))
cuts[1] <- -Inf; cuts[length(cuts)] <- Inf
expected <- as.numeric(table(cut(reference, cuts))) / length(reference)
observed <- as.numeric(table(cut(live,      cuts))) / length(live)
psi <- sum((observed - expected) * log(pmax(observed, 1e-4) / pmax(expected, 1e-4)))
round(psi, 3)
#> [1] 0.473
```

=== step === concept
::eyebrow The subtler failure
## Concept drift: when the inputs look fine but the rule changed

Data drift is not the only way a model goes wrong, and PSI will not catch the other way. **Concept drift** is when the relationship between the inputs and the outcome changes, even if the inputs themselves look exactly as before.

Picture a different scenario at Dev's company. Suppose FreshBox does not change anyone's prices or ordering habits, so every input distribution stays put and every PSI stays green. But it changes *why* people leave: now a long-tenure, high-spend customer, exactly the kind the old model marked "safe", is the one most tempted to defect to the cheaper rival. The inputs are unchanged; the meaning of those inputs has flipped. In the language of probability, the input distribution \(P(x)\) is stable but the conditional \(P(\text{cancel} \mid x)\) has moved.

| | Data drift | Concept drift |
|---|---|---|
| What changes | the input distribution \(P(x)\) | the input-to-outcome rule \(P(y \mid x)\) |
| Example | prices fall, so spend-per-box shifts down | loyal customers now leave, not stay |
| Caught by | input monitoring (PSI), no labels needed | performance monitoring, needs labels |
| Warning speed | immediate | delayed, waits for outcomes |

[KEY INSIGHT]
This is why you monitor both. Input monitoring (PSI) is fast but blind to concept drift. Performance monitoring catches everything but arrives late. Together, the fast-but-partial signal and the complete-but-slow signal cover each other's gap.

=== step === concept
::eyebrow Closing the loop
## When to retrain

Monitoring is only useful if it drives an action, and the action is almost always the same: retrain the model on recent data so it relearns the world as it is now. The skill is deciding *when* to pull that trigger.

Two triggering styles, often combined:

- **Triggered retraining:** set thresholds on your monitors, PSI \(\ge 0.2\) on a key feature, or accuracy dropping past a set floor, and retrain automatically when one trips. It reacts exactly when something moves, but you must tune the thresholds so noise does not cry wolf.
- **Scheduled retraining:** retrain on a fixed cadence (nightly, weekly, monthly) regardless of alerts, sized to how fast your world usually moves. Simple and predictable, but it can retrain needlessly when nothing changed, or too late when something changes fast.

Whichever fires, one rule protects you: retrain on **recent** data, and only on labels you trust. Because labels are late, a batch of "recent" outcomes may still be incomplete, and retraining on half-finished or mislabelled data can bake in a worse model than the one you have. Validate the fresh labels first, retrain, then compare the new model against the live one before you promote it.

::widget process-flow {"steps":[{"title":"Monitor inputs and performance","sub":"track PSI on key features and accuracy as labels arrive"},{"title":"A threshold trips","sub":"PSI passes 0.2, or accuracy falls below its floor"},{"title":"Retrain on recent, trusted labels","sub":"relearn the current world; check the labels are complete first"},{"title":"Validate against the live model","sub":"promote the new model only if it genuinely beats the old one"},{"title":"Redeploy and keep watching","sub":"the loop never ends, because the world will move again"}]}

=== step === quiz
::eyebrow Check yourself
## Read the monitors

Six weeks after a fix, Dev checks the dashboards. Every input feature's PSI is low and green, spend, weeks-since, and boxes all look just like training. But weekly accuracy has fallen from 0.80 to 0.68. What is the most likely diagnosis, and the right response?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong: since every PSI is green, the inputs match training, so the model is fine and the accuracy dip is just noise ::no A twelve-point accuracy drop is not noise, and green PSI only rules out data drift. Stable inputs while accuracy falls is the signature of the other failure mode, not an all-clear.
- Data drift: the inputs must have shifted, and the PSI monitors are simply miscalibrated and missing it ::no If PSI is genuinely low across features, the input distributions really are stable. Reaching for data drift here ignores what the monitors are telling you.
- Concept drift: inputs are stable but the input-to-outcome rule has changed, which PSI cannot see; retrain on recent, trusted labels to relearn the new relationship ::ok Exactly. Stable inputs plus falling accuracy means \(P(y \mid x)\) moved while \(P(x)\) held. Only performance monitoring caught it, and the fix is to retrain on fresh, validated labels so the model learns the current rule.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative, free places to take monitoring and drift further:

- [Huyen, "Data Distribution Shifts and Monitoring" (2022)](https://huyenchip.com/2022/02/07/data-distribution-shifts-and-monitoring.html) - the clearest practitioner map of covariate, label, and concept drift, and how to monitor each in production.
- [Google, "Rules of Machine Learning" (Zinkevich)](https://developers.google.com/machine-learning/guides/rules-of-ml) - Rule 8 on model freshness and the training-serving skew section are exactly the decay this lesson is about.
- [Fiddler, "Measuring Data Drift with the Population Stability Index"](https://www.fiddler.ai/blog/measuring-data-drift-population-stability-index) - the PSI formula, the 0.1 and 0.2 thresholds, and the empty-bin guard, in one place.
- [Evidently AI: data drift detection](https://docs.evidentlyai.com/metrics/customize_data_drift) - open-source docs for running drift checks (PSI and many alternatives) on your own tables.

=== step === complete
## Lesson 5 complete

You can now see the quiet failure coming. A trained model is a snapshot of a past world, and as that world moves its accuracy decays with no error to warn you. You watch for it two ways: performance monitoring, which recomputes the metric as real labels arrive (the ground truth, but late), and input monitoring, which compares live features against training with PSI (immediate, but blind to concept drift). Data drift moves the inputs; concept drift moves the rule connecting inputs to outcomes; you need both monitors to cover both. And when a threshold trips, you retrain on recent, trusted labels and promote the new model only if it truly beats the old one.

Next, Lesson 6: **An ML system design checklist.** You have built, versioned, served, and now monitored a model. The final lesson steps back and turns the whole course into a checklist, the questions to answer before any model ships.

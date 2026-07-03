---
title: "Robustness and Drift Lesson 1: Kinds of Distribution Shift"
catalog_blurb: "The three ways live data drifts from training, and which one breaks your model."
description: "A deployed model rots when its data drifts. Meet the three kinds of distribution shift, covariate, label and concept, and see which one truly breaks a model."
keywords: "distribution shift, covariate shift, label shift, concept shift, dataset shift, concept drift, model monitoring, machine learning, R"
post_type: "LESSON"
curriculum_id: "6.190.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "1"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "Detecting-Distribution-Shift.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Kinds of Distribution Shift

Nadia builds a fraud detector for a payments company. It learns from a year of labelled card transactions and, at launch, catches fraud well enough to ship. Six months later it is missing a wave of fraud it should have caught, yet not one line of code changed and no server ever threw an error. What changed was the world the model lives in.

When the data a model meets in production drifts away from the data it trained on, we call it **distribution shift**. This lesson names the three kinds, and shows which one is merely a nuisance and which one silently makes a good model wrong, all on Nadia's detector.

By the end of this lesson you will be able to:

- Name the three kinds of distribution shift by which part of the data changed
- Explain why some shifts leave a good model working while one kind breaks it
- Diagnose, from a described change in the real world, which shift you are facing

**Prerequisites:** you can fit and read a classifier (such as a logistic regression), and you know what a decision threshold and a held-out set are.

::widget process-flow {"steps":[{"title":"Train on the past","sub":"the model learns a rule from data you have already labelled"},{"title":"Deploy on the present","sub":"it starts scoring fresh, live transactions"},{"title":"The world moves","sub":"customers, prices and fraud tactics drift away from the training data"},{"title":"Predictions rot, no alarm","sub":"nothing errors; accuracy just decays until you measure it"}]}

=== step === concept
::eyebrow The setup
## Train here, deploy there

A model only ever sees its training data. Nadia's detector learned from transactions each labelled fraud or legit over the past year. Write one transaction as a pair: its features \(x\) (here, the purchase amount) and its label \(y\) (1 for fraud, 0 for legit). Together they are drawn from a **joint distribution** \(P(x, y)\), the full pattern of what transactions look like and how often each one is fraud.

That joint splits into three pieces we will need by name:

- \(P(x)\): how the features are spread out, how big purchases tend to be.
- \(P(y)\): the **base rate**, the fraction of all transactions that are fraud.
- \(P(y \mid x)\): the **rule** linking them, "given a purchase of this size, how likely is fraud." This is exactly what a classifier learns.

Let us build Nadia's world and fit her model, so we have something concrete to break. Each lesson runs in a fresh R session, so we create the data right here.

```r
set.seed(1)
n <- 4000
amount <- rnorm(n)                              # purchase size, standardized (a z-score)
fraud  <- rbinom(n, 1, plogis(1.5 * amount))    # launch rule: bigger amounts, more fraud
launch <- data.frame(amount, fraud)

model  <- glm(fraud ~ amount, data = launch, family = binomial)

# accuracy: the share of transactions the 0.5 cut-off labels correctly
acc <- function(m, d) mean((predict(m, d, type = "response") > 0.5) == d$fraud)
round(acc(model, launch), 3)
#> [1] 0.737
```

The model labels about 74% of transactions correctly, good enough to ship. Hold on to `model` and `acc`; we will point them at three different futures and see what happens.

=== step === widget
::eyebrow The three kinds
## Three ways the world can move

If deployment data can differ from training data, what exactly differs? There are only three moving parts, \(P(x)\), \(P(y)\), and \(P(y \mid x)\), and each one moving has a name:

- **Covariate shift:** \(P(x)\) changes. The kinds of transactions change, but the fraud rule is intact.
- **Label shift:** \(P(y)\) changes. Fraud becomes more (or less) common overall.
- **Concept shift:** \(P(y \mid x)\) changes. The very relationship the model learned is now different.

Toggle between them below. Watch which curve moves and which one stays put, then read what it does to the model. We will take each in turn on Nadia's detector over the next three steps.

::widget shift-types {}

=== step === concept
::eyebrow Shift one
## Covariate shift: the inputs move, the rule holds

December arrives. Shoppers spend more, so the average transaction amount climbs. That is a change in \(P(x)\): the features drift to the right. But a large purchase is still exactly as fraud-prone as it always was. The rule \(P(y \mid x)\) has not moved an inch.

Feed the December-style transactions (bigger amounts, same rule) to Nadia's unchanged model:

```r
set.seed(4)
amount_hi <- rnorm(n, mean = 1.2)                  # P(x) slides right: bigger baskets
fraud_hi  <- rbinom(n, 1, plogis(1.5 * amount_hi)) # the SAME rule P(y|x) generates fraud
round(acc(model, data.frame(amount = amount_hi, fraud = fraud_hi)), 3)
#> [1] 0.828
```

Accuracy did not fall. It even rose to **0.828**, because the busier region happens to be easier to call. The model's decision rule was correct, and it stays correct when only \(P(x)\) moves.

[KEY INSIGHT]
Covariate shift moves *where* your data lands, not *what* the right answer is. A correctly specified model, one whose shape matches the true \(P(y \mid x)\), keeps making the right call.

There is an honest catch. Real models are rarely specified perfectly. If yours was only locally accurate (say it fit a straight line to a curved rule), covariate shift can push inputs into a region where that approximation was never any good, and accuracy can drop there. The truer your model of \(P(y \mid x)\), the more covariate shift it shrugs off.

=== step === concept
::eyebrow Shift two
## Label shift: the base rate moves

Now a data breach dumps stolen cards into the network. Overnight, fraud becomes far more common than it was at launch. That is a change in \(P(y)\), the base rate, while what a fraudulent transaction looks like, \(P(x \mid y)\), is unchanged. Fraud is more common, but fraud still looks like fraud.

Here is the subtle part. The model still **ranks** transactions by risk perfectly well, the riskier ones still score higher. What breaks is the **threshold**. Nadia's 0.5 cut-off was the right dividing line for the fraud rate the model trained on; when fraud becomes much more common, that same cut-off now flags too few of the real cases. By Bayes' rule the score the model *should* output (its posterior probability of fraud, \(P(y \mid x)\)) is proportional to how fraud-like the inputs look times how common fraud is: \(P(y \mid x) \propto P(x \mid y)\,P(y)\). Change only the base rate \(P(y)\) and every honest score shifts, even though \(P(x \mid y)\) never moved.

[WARNING]
Label shift usually does not call for a new model, it calls for a new threshold. Re-estimate the base rate on recent data and move the cut-off, or recalibrate the probabilities. Retraining the features from scratch would be wasted effort, because the feature-to-label pattern \(P(x \mid y)\) has not changed.

=== step === quiz
::eyebrow Check yourself
## Name that shift

A clinic's readmission classifier was trained mostly on patients under 60. A new hospital partnership brings in many patients over 70, so the age mix of incoming data shifts older. For any given patient profile, the chance of readmission is unchanged. Which shift is this?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Covariate shift: the mix of inputs P(x) moved, but the rule P(y given x) did not ::ok Right. An older age mix means P(x) moved. Because the profile-to-readmission rule is unchanged, a correctly specified model still predicts well; you may just have fewer training examples in the older region.
- Concept shift: the model's learned relationship has changed ::no The relationship (patient profile to readmission risk) is stated to be unchanged. Only the frequency of older patients moved, and that is P(x), not P(y given x).
- Label shift: the outcome being predicted became more common ::no Label shift is a change in the base rate of the OUTCOME (the readmission rate itself). Here what changed is the input mix, the ages coming in, which is P(x).

=== step === concept
::eyebrow Shift three
## Concept shift: the rule itself changes

Fraudsters adapt. To dodge alerts that watch big purchases, they switch to swarms of tiny transactions. Now it is the **small** amounts that are fraudulent. The relationship \(P(y \mid x)\) has flipped: the very pattern Nadia's model learned is now backwards.

This is the dangerous one. Under covariate and label shift the model's learned rule was still true, only its inputs or its threshold were off. Under concept shift the rule is **false**. A model confidently applying an out-of-date rule is not merely less accurate, it can do worse than guessing.

[WARNING]
Concept shift is the only kind that makes a correctly specified model wrong. No reweighting of old data and no threshold tweak can rescue it, because the thing you need to relearn, \(P(y \mid x)\), has genuinely changed. It demands fresh labels and retraining.

Let us watch it happen to Nadia's model.

=== step === tryit
::eyebrow In R
## Flip the rule, watch it collapse

The launch rule made fraud rise with the amount: `plogis(1.5 * amount)`. Concept shift flips that sign, so small amounts become the fraudulent ones. Fill the blank with the flipped coefficient, `-1.5`, so the relationship reverses, then score Nadia's **unchanged** model on this new world.

```r
set.seed(7)
amount2 <- rnorm(n)
# concept shift: the rule reverses, small amounts are the fraudulent ones now
fraud2  <- rbinom(n, 1, plogis(____ * amount2))
round(acc(model, data.frame(amount = amount2, fraud = fraud2)), 3)
```
::check {"regex":"-\\s*1\\.5","gate":true,"difficulty":"intermediate","ok":"There it is: 0.268, worse than a coin flip. The model applies its old rule (big amounts are risky) to a world where the opposite is now true, so it is confidently wrong.","no":"Flip the sign: use -1.5 so the block reads plogis(-1.5 * amount2). A minus reverses the rule, making small amounts the fraudulent ones."}
::solution
```r
set.seed(7)
amount2 <- rnorm(n)
fraud2  <- rbinom(n, 1, plogis(-1.5 * amount2))   # the rule flips: small amounts now fraud
round(acc(model, data.frame(amount = amount2, fraud = fraud2)), 3)
#> [1] 0.268
```

=== step === quiz
::eyebrow Check yourself
## Which shift can make a model worse than guessing?

You just saw Nadia's model score **0.268**, below the accuracy of flipping a coin. Of the three shifts, which one can drop a correctly built model below chance, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Covariate shift, because the model meets inputs it was never trained on ::no Covariate shift moves P(x), not the rule. A correctly specified model keeps its rule; here accuracy even rose to 0.828. It does not turn the model backwards.
- Concept shift, because the rule P(y given x) itself reversed, so the model's learned rule is now wrong ::ok Exactly. Only concept shift changes the answer key. The model applies an out-of-date rule to a world that flipped, so it can score below chance. Covariate and label shift leave the rule intact.
- Label shift, because more fraud simply means more mistakes ::no Label shift moves the base rate P(y); the model still ranks correctly, and a threshold fix recovers it. It does not invert the rule, so it will not push a good model below chance.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Quinonero-Candela, Sugiyama, Schwaighofer and Lawrence, Dataset Shift in Machine Learning (MIT Press, 2009)](https://mitpress.mit.edu/9780262170055/dataset-shift-in-machine-learning/) - the canonical book that formalized these categories.
- [Moreno-Torres et al. (2012), A unifying view on dataset shift in classification](https://doi.org/10.1016/j.patcog.2011.06.019) - where the covariate, prior-probability, and concept naming is laid out precisely.
- [Dive into Deep Learning: Environment and Distribution Shift](https://d2l.ai/chapter_linear-classification/environment-and-distribution-shift.html) - a free, worked chapter that also covers the correction methods.
- [Amazon SageMaker Model Monitor documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html) - how drift is watched for in a real production system.

=== step === complete
## Lesson 1 complete

You can now name the three kinds of distribution shift by which part of \(P(x, y)\) moved: covariate shift in \(P(x)\), label shift in \(P(y)\), and concept shift in \(P(y \mid x)\). You saw a correctly built model shrug off covariate shift, need only a new threshold for label shift, and genuinely break under concept shift, where it fell below chance.

One problem remains. In production the labels arrive late, or never, so you cannot simply compute accuracy to notice any of this. Next, Lesson 2: Detecting distribution shift, where you learn to catch drift from the features alone, using the population stability index, a two-sample test, and a classifier trained to tell training data from today's.

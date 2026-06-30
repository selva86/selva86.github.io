---
title: "ML Workflow Lesson 2: The Bias-Variance Tradeoff"
catalog_blurb: "Why a more flexible model is not always a more accurate one."
description: "Master the bias-variance tradeoff: why simple models underfit, flexible ones overfit, the U-shaped test-error curve, and how to measure it honestly in R."
keywords: "bias-variance tradeoff, overfitting, underfitting, model complexity, generalization error, train test error, bias variance decomposition, machine learning, R"
post_type: "LESSON"
curriculum_id: "6.10.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-ml-workflow"
course_title: "The Machine Learning Workflow in R"
course_lesson: "2"
course_total: "4"
course_landing: "R-ML-Workflow-Course.html"
course_next: "Train-Validation-Test-and-Data-Leakage.html"
course_prev: "Framing-a-Problem-as-ML.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## The Bias-Variance Tradeoff

In Lesson 1 we turned a fuzzy business question into a precise prediction problem. Now we meet the single idea that decides whether your model actually works on new data.

Maya, a real-estate analyst, wants to predict a home's sale price from its size. Her first model is a flat rule: "every house is worth about $380k." It is steady, and steadily wrong. Her second model is a wildly flexible curve that passes through every single house she has on record. It is perfect on her records, and useless on the next house that comes up for sale. Both failed, in opposite ways. The space between them is what this lesson is about.

By the end you will be able to:

- Name **bias** and **variance** as two separate sources of a model's error
- Explain why making a model more flexible trades one for the other, giving the famous U-shaped error curve
- Spot overfitting and underfitting from the gap between training and test error, and measure it in R

**Prerequisites:** you can run R and read its output, and you know what a training set and a test set are (Lesson 1).

::widget bias-variance-target {}

=== step === concept
::eyebrow The two ways to miss
## A model can be wrong in two different ways

Think of the dartboard above. The bullseye is the truth: a home's real price. Each dart is one model's prediction. Now picture something subtle but important: we never train on "the" data, we train on *one sample* of homes that happened to land in our spreadsheet. Draw a different sample next month and we would fit a slightly different model, throwing a slightly different dart.

That gives two completely separate ways to miss:

- **Bias** is *aim*. If every dart lands in the same spot but that spot is off to one side, the model is consistently, systematically wrong. Maya's flat "$380k for everyone" rule has high bias: it ignores size, so it is always too high for tiny homes and too low for mansions, no matter which sample she trains on.
- **Variance** is *spread*. If the darts scatter all over the board, the model is wildly sensitive to which exact homes it saw. Maya's wiggly curve has high variance: feed it next month's listings and it draws a completely different shape.

Slide the two controls below. Move **bias** to shove the cluster off the bullseye; move **variance** to scatter the darts. Watch the readout split the total error into a bias part and a variance part.

::widget bias-variance-target {"bias":1.2,"variance":0.4}

The goal, the tight cluster on the bullseye, needs *both* low. The trouble is that the usual ways of lowering one tend to raise the other.

=== step === concept
::eyebrow Putting numbers on it
## The error splits into exactly three pieces

That "two ways to miss" intuition is not hand-waving, it is an exact equation. Pick one specific house, say a 2,000 sq ft home, and call its true price \(f(x_0)\). The model we trained on one particular sample predicts \(\hat f(x_0)\). Now imagine redrawing the training sample over and over and refitting each time; the *average* of all those predictions is \(\mathbb{E}[\hat f(x_0)]\), where \(\mathbb{E}[\cdot]\) just means "average over many training samples."

The expected squared error at that house then breaks into three terms that do not overlap:

\[ \underbrace{\mathbb{E}\big[(y_0 - \hat f(x_0))^2\big]}_{\text{expected error}} = \underbrace{\big(\mathbb{E}[\hat f(x_0)] - f(x_0)\big)^2}_{\text{bias}^2} + \underbrace{\mathbb{E}\big[(\hat f(x_0) - \mathbb{E}[\hat f(x_0)])^2\big]}_{\text{variance}} + \underbrace{\sigma^2}_{\text{noise}} \]

Reading it left to right: **bias** is how far the *average* prediction sits from the truth (the dashed line on the dartboard). **Variance** is how much individual predictions bounce around that average (the spread of the darts). And \(\sigma^2\) is the **irreducible noise**: the slice of price driven by things size can never explain, a motivated seller, a brand-new kitchen, plain luck.

[KEY INSIGHT]
You can trade bias for variance, but you cannot send both to zero at once, and the noise term \(\sigma^2\) sets a hard floor that no model, however clever, ever beats.

=== step === quiz
::eyebrow Check yourself
## Aim or spread?

A model gives almost the same prediction no matter which sample of homes it is trained on, but that prediction is consistently about $40k too low. In bias-variance terms, what does this model have?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- High variance, low bias ::no Variance is how much predictions JUMP between different training samples. This model barely jumps, it is very consistent. Its problem is being consistently wrong.
- High bias, low variance ::ok Exactly. Stable across samples (low variance) but systematically off target (high bias): the tight-but-off-the-bullseye dartboard, the signature of a too-simple model.
- High bias and high variance ::no Not high variance: the predictions are stable from sample to sample. Only the aim is off, which is bias.

=== step === concept
::eyebrow The dial that controls both
## Complexity trades bias for variance

So what moves a model along the bias-variance line? **Complexity**: how flexible a shape the model is allowed to draw. A straight line is rigid (it can only tilt). A high-degree polynomial is flexible (it can wiggle through anything).

- **Too simple** (low complexity): the model cannot bend to the real pattern, so it has **high bias**. Both training and test error stay high. This is **underfitting**.
- **Too flexible** (high complexity): the model bends to fit every random bump in the training sample, so it has **high variance**. Training error keeps falling, but test error climbs because those bumps were noise, not signal. This is **overfitting**.

Because complexity pushes bias down while pulling variance up, the error you actually care about, error on *new* data, traces a **U**: it falls as the model gets flexible enough to catch the real pattern, bottoms out at a sweet spot, then rises as the model starts memorizing noise.

Drag the complexity slider below to feel it. The training curve slides down forever; the test curve dips, then turns back up. Then press Run to fit the very same polynomials to noisy data in R and see the two curves come out of real numbers.

::widget bias-variance {"start":3}

=== step === concept
::eyebrow Watch it happen
## Overfitting, live

Does this only bite when you are predicting a number like price? Not at all. Maya also asks a yes/no question about the same homes: will this listing **sell fast** (within 30 days) or **sell slow**? That is a classification problem, and the exact same tradeoff governs it.

Below is a real model fit in your browser. Each dot is a past listing, placed by two features; blue listings sold slow, orange sold fast. Drag the complexity slider. At low complexity the boundary is a smooth line that captures the broad trend. Crank it up and watch the boundary carve tiny islands around individual oddball listings: training accuracy marches toward 100%, while the test accuracy (the hollow points it never trained on) peaks and then falls. That falling test score is variance, made visible.

::widget decision-region {"dataset":"two-blobs-diag","control":"max-depth","min":1,"max":10,"start":3,"showTest":true,"noise":"planted","seed":7,"labels":{"c0":"sells slow","c1":"sells fast"},"metrics":["train_acc","test_acc","verdict"]}

A shallow model underfits. A deep one memorizes. The sweet spot sits in the middle, and you cannot find it by looking at training accuracy alone.

=== step === quiz
::eyebrow Check yourself
## Which model ships?

You fit two models on the same data and score both on the same held-out test set, measuring error with RMSE (the typical prediction error, in thousands of dollars; lower is better). Model A: training RMSE 14, test RMSE 27. Model B (simpler): training RMSE 18, test RMSE 16. Which one should Maya put into production, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Model A, because its training error (14) is the lowest, so it learned the data best ::no That is the overfitting trap. The huge gap between A's training (14) and test (27) error shows it memorized noise; on new homes it does worse than the simpler model.
- Model B, because its test error (16) is lowest, so it will generalize better to new homes ::ok Right. Test error is the price you pay on data the model has never seen. B's small train-to-test gap means it overfits less and generalizes better, even though its training error is higher.
- Neither, because you cannot compare models of different complexity ::no You can, and you should, as long as you judge them on the SAME held-out test set, which is exactly what these numbers are.

=== step === concept
::eyebrow Now in R
## Measure the tradeoff on Maya's homes

Time to make the U-curve concrete. Each lesson runs in a fresh R session, so we build Maya's dataset right here: 120 homes whose price follows a gentle curve in size (rising, then flattening as size hits the point where buyers stop paying more), plus real-world noise. We hold out 40 of them as a test set the model never sees while fitting.

```r
set.seed(1)
n     <- 120
size  <- round(runif(n, 800, 3500))                  # house size, square feet
truth <- 120 + 0.20 * size - 0.000035 * size^2       # the real price curve, $1000s
price <- round(truth + rnorm(n, 0, 18))              # truth + real-world noise
houses <- data.frame(size = size, price = price)

set.seed(7)
test_id <- sample(n, 40)             # hold out 40 homes to judge the model honestly
train   <- houses[-test_id, ]
test    <- houses[ test_id, ]
c(train_homes = nrow(train), test_homes = nrow(test))
#> train_homes  test_homes
#>          80          40
```

Now fit three models of rising flexibility (a straight line, a gentle degree-3 curve, and a frantic degree-15 curve) and score each one on the homes it trained on versus the held-out homes. RMSE is the typical prediction error in thousands of dollars: lower is better.

```r
rmse <- function(actual, predicted) sqrt(mean((actual - predicted)^2))

for (d in c(1, 3, 15)) {
  fit <- lm(price ~ poly(size, d), data = train)
  tr  <- rmse(train$price, predict(fit))
  te  <- rmse(test$price,  predict(fit, newdata = test))
  cat(sprintf("degree %2d   train RMSE %5.1f   test RMSE %5.1f\n", d, tr, te))
}
#> degree  1   train RMSE  26.2   test RMSE  22.5
#> degree  3   train RMSE  17.8   test RMSE  16.5
#> degree 15   train RMSE  14.5   test RMSE  26.9
```

Read the three rows as the whole lesson in one table. The **straight line** (degree 1) is off on both train and test (26.2 and 22.5): it is too rigid to follow the curve, the classic high-bias **underfit**. The **degree-3 curve** is the sweet spot: lowest test error (16.5). The **degree-15 curve** has the lowest *training* error of all (14.5) yet the worst *test* error (26.9): it chased the noise, the classic high-variance **overfit**. Training error alone would have picked the worst model.

=== step === tryit
::eyebrow Your turn
## Judge a flexible model honestly

Here is an even more flexible degree-12 model. The dangerous move is to trust its training error. Your job: finish the line that scores it on the **held-out** homes, the 40 it never saw during fitting. Fill in the blank so `predict()` runs on the test set.

```r
flex <- lm(price ~ poly(size, 12), data = train)

train_rmse <- rmse(train$price, predict(flex))            # error on homes it trained on
test_rmse  <- rmse(test$price,  predict(flex, ____))      # error on held-out homes
c(train = round(train_rmse, 1), test = round(test_rmse, 1))
```
::check {"regex":"newdata\\s*=\\s*test","gate":true,"difficulty":"intermediate","ok":"That is honest evaluation. The test error (20.1) is much worse than the training error (15.5), the overfitting gap laid bare.","no":"Tell predict() to use the held-out homes: predict(flex, newdata = test). Evaluating on train alone is exactly how overfitting hides."}
::solution
```r
flex <- lm(price ~ poly(size, 12), data = train)

train_rmse <- rmse(train$price, predict(flex))
test_rmse  <- rmse(test$price,  predict(flex, newdata = test))
c(train = round(train_rmse, 1), test = round(test_rmse, 1))
#> train  test
#>  15.5  20.1
```

=== step === concept
::eyebrow So what do you do
## Finding the sweet spot

The U-curve has a bottom, but it is invisible if you only look at training error, which always smiles on more complexity. A few honest moves get you near the minimum:

- **Always judge on data the model did not train on.** The train-to-test gap is your overfitting gauge. A small gap with low test error is the goal.
- **Use a validation set or cross-validation to tune complexity**, instead of peeking at the test set repeatedly. That is the subject of Lesson 3, and it is how you choose the degree without fooling yourself.
- **Prefer the simplest model within noise of the best.** If degree 3 and degree 5 score the same on held-out data, ship degree 3: less variance, easier to explain, less to break.
- **Get more data when you can.** More training homes shrink variance, which lets you afford a more flexible model before it starts overfitting, nudging the whole sweet spot rightward.

[KEY INSIGHT]
"More flexible" is not "more accurate." The model that wins on new data is the one that balances bias and variance, not the one that fits the training data best.

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 2 (free PDF)](https://www.statlearning.com/) - the clearest first treatment of the bias-variance tradeoff, with the U-curve picture.
- [The Elements of Statistical Learning, ch. 7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full derivation of the error decomposition and model assessment.
- [Belkin et al. (2019), "Reconciling modern machine learning and the bias-variance trade-off"](https://arxiv.org/abs/1812.11118) - the "double descent" result showing where the classic U-curve story needs an update for huge models.
- [tidymodels: rsample documentation](https://rsample.tidymodels.org/) - the R tooling for the honest resampling you will use in Lesson 3.

=== step === complete
## Lesson 2 complete

You can now name the two halves of a model's error, explain why complexity trades one for the other, and read overfitting straight off the gap between training and test error, in a dartboard, a U-curve, and a real RMSE table in R.

Next, Lesson 3: Train, validation, test, and data leakage. You will learn how to split your data so the test set stays honest, and the cardinal sins (leakage) that quietly inflate your scores and wreck the model in production.

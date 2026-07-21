---
title: "Gradient Boosting in R: Quiz"
description: "A short, graded check on the boosting section: how boosting works, the learning rate, early stopping, key hyperparameters, monotonic constraints, and prediction intervals."
keywords: "R quiz, gradient boosting, learning rate, early stopping, monotonic constraints, ds-boosting"
post_type: "LESSON"
curriculum_id: "6.40.7"
webr: true
lesson_access: "pro"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Gradient-Boosting-Course.html"
lesson_kind: "quiz"
course_prev: "Quantile-Regression-Forests-and-Prediction-Intervals.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built boosting from scratch, met LightGBM and CatBoost, learned which hyperparameters matter, used early stopping and learning curves, added monotonic constraints, and produced prediction intervals. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## How boosting builds
Gradient boosting builds its model by:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Training many deep trees independently and averaging them. ::no That is bagging / random forests, not boosting.
- Adding trees one at a time, each fitting the errors the model still makes. ::ok Correct: each new tree targets the residual (the gradient of the loss), correcting what is left.
- Fitting a single very large tree. ::no Boosting is an ensemble of many small trees, added sequentially.
- Selecting the best one tree out of thousands. ::no It combines the trees; it does not pick just one.

=== step === quiz
::eyebrow Question 2 of 6
## The learning rate
Lowering the learning rate (shrinkage) usually:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Needs more trees but tends to generalise better. ::ok Correct: small steps mean each tree contributes a little, so you add more rounds but overfit less.
- Lets you use far fewer trees. ::no Smaller steps need *more* rounds to reach the same fit.
- Has no effect on the number of trees needed. ::no Learning rate and tree count trade off directly.
- Always lowers accuracy. ::no A small rate with enough trees often raises accuracy.

=== step === quiz
::eyebrow Question 3 of 6
## Early stopping
Early stopping halts training when:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The training error reaches zero. ::no Training error keeps falling; that is not the signal to stop.
- A fixed wall-clock time passes. ::no Time limits are unrelated to the model's generalisation.
- Validation performance stops improving for a set number of rounds. ::ok Correct: you stop where the held-out curve bottoms out, before it starts climbing again.
- The first tree is added. ::no One tree is far too few; you watch the validation curve.

=== step === quiz
::eyebrow Question 4 of 6
## The knobs that matter
Which trio of hyperparameters has the biggest effect in gradient boosting?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Random seed, column name, file format. ::no None of those govern model capacity.
- Number of trees, learning rate, and tree depth. ::ok Correct: these three set how much the ensemble can learn and how fast.
- Font size, colour palette, plot width. ::no Those are display settings, not model parameters.
- Only the number of trees. ::no Trees interact with the learning rate and depth; tuning one alone is not enough.

=== step === quiz
::eyebrow Question 5 of 6
## Monotonic constraints
A monotonic constraint is useful when:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- A relationship must run one direction for business or trust reasons (e.g. higher debt never lowers predicted risk). ::ok Correct: the constraint forces the model to honour a known, sensible direction.
- You want the model to train faster. ::no Constraints are about shape, not speed.
- You need to drop a feature. ::no A constraint shapes a feature's effect; it does not remove it.
- You want more wiggly predictions. ::no Constraints make the response smoother and more predictable, not wigglier.

=== step === quiz
::eyebrow Question 6 of 6
## Beyond a point estimate
A quantile regression forest is valuable because it gives you:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A faster single prediction. ::no Speed is not the point; the output is richer, not faster.
- A guarantee the prediction is correct. ::no No model guarantees correctness.
- A prediction interval, a range of likely outcomes, not just one number. ::ok Correct: estimating quantiles turns a point forecast into an honest range that expresses uncertainty.
- A classification label. ::no Quantile forests are about the spread of a numeric outcome.

=== step === concept
::eyebrow Run it: boosting by hand
## Five rounds of residual-fitting
Run this tiny boosting loop: start at the mean, then add five shallow stumps, each fitting what is left over. Watch the error fall.

```r
set.seed(1)
x <- sort(runif(80, 0, 6)); y <- sin(x) + rnorm(80, 0, 0.2)
library(rpart)
pred <- rep(mean(y), length(y)); lr <- 0.3
for (i in 1:5) {
  resid <- y - pred
  stump <- rpart(resid ~ x, control = rpart.control(maxdepth = 1))
  pred <- pred + lr * predict(stump)
}
round(sqrt(mean((y - pred)^2)), 3)
```

Each stump nudges the prediction toward the leftover signal; that sequential correction is boosting in one loop.

=== step === concept
::eyebrow Run it: a prediction interval
## A range, not a point
Quantiles turn a cloud of predicted outcomes into a 90% interval.

```r
set.seed(2)
draws <- rnorm(2000, mean = 12, sd = 3)
quantile(draws, c(0.05, 0.5, 0.95))
```

The 5th and 95th percentiles bracket the middle 90% of likely outcomes, exactly what a quantile model reports instead of a lone number.

=== step === complete
## Section complete
Strong work. You understand how boosting corrects its own errors, how the learning rate trades off with tree count, when to stop early, why monotonic constraints matter, and how quantiles turn a point forecast into an interval. Next: the tidymodels workflow.

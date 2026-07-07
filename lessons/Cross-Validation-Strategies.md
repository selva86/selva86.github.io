---
title: "Model Evaluation Lesson 1: Cross-Validation Strategies"
catalog_blurb: "Estimate a model's real error honestly, instead of trusting one lucky split."
description: "Cross-validation in R from scratch: why one train/test split misleads, how k-fold, repeated CV and LOOCV work, and how to choose the number of folds."
keywords: "cross-validation, k-fold cross-validation, LOOCV, repeated cross-validation, resampling, model evaluation, RMSE, bias variance, choosing k, R"
post_type: "LESSON"
curriculum_id: "6.70.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "1"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "Grouped-Blocked-and-Time-Aware-CV.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Cross-Validation Strategies

You already know the golden rule of honest evaluation: never judge a model on the data it trained on. Hold out a test set, and its score stands in for how the model will do on the future. But there is a crack in that plan.

Sam, an analyst at a used-car marketplace, is checking a model that predicts a car's fuel economy from its weight and horsepower. He holds out a quarter of his cars, scores the model, and gets a typical error of **3.3 mpg**. He reshuffles, holds out a different quarter, and gets **1.6 mpg**. Same cars, same model, and the verdict just doubled. Which number does he report? Cross-validation is the fix, and this lesson builds it straight out of that problem.

By the end you will be able to:

- Explain why a single train/test split gives a luck-of-the-draw score
- Run **k-fold cross-validation** and read its result
- Weigh **LOOCV** and **repeated k-fold**, and choose a sensible number of folds

**Prerequisites:** you can fit a model with `lm()` and call `predict()`, and you know what a held-out test set is (Lesson: [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)).

::widget cv-folds {}

=== step === concept
::eyebrow The problem
## One split is a coin flip

Let us watch Sam's problem happen for real. The data is `mtcars`: 32 cars that Motor Trend road-tested in 1974, each with its fuel economy (`mpg`), weight (`wt`, in thousands of pounds) and horsepower (`hp`).

```r
head(mtcars[, c("mpg", "wt", "hp")])
#>                    mpg    wt  hp
#> Mazda RX4         21.0 2.620 110
#> Mazda RX4 Wag     21.0 2.875 110
#> Datsun 710        22.8 2.320  93
#> Hornet 4 Drive    21.4 3.215 110
#> Hornet Sportabout 18.7 3.440 175
#> Valiant           18.1 3.460 105
```

Sam holds out 8 of the 32 cars (a quarter), fits an ordinary regression on the other 24, and measures the typical prediction error on the 8 he held out. That error is the **RMSE** (root-mean-square error), reported in mpg: an RMSE of 2.5 means the model is off by about 2.5 mpg on a typical car. Then he does it again with a different random 8, and again, six times over:

```r
rmse_of <- function(actual, predicted) sqrt(mean((actual - predicted)^2))

split_rmse <- function(seed) {
  set.seed(seed)
  holdout <- sample(nrow(mtcars), 8)                 # 8 cars set aside to test on
  fit     <- lm(mpg ~ wt + hp, data = mtcars[-holdout, ])
  rmse_of(mtcars$mpg[holdout], predict(fit, mtcars[holdout, ]))
}
round(sapply(1:6, split_rmse), 2)                    # six different random hold-out sets
#> [1] 2.52 3.28 1.60 2.23 2.36 1.99
```

Every number came from the same 32 cars and the same model. The only thing that changed was which 8 cars happened to land in the hold-out set, yet the estimated error swings from **1.60** to **3.28** mpg, more than double. With only 8 cars deciding the score, one unlucky pair of gas-guzzlers can wreck it. A single split does not really measure the model; it measures the model plus the luck of the draw.

=== step === quiz
::eyebrow Check yourself
## Why did the score change?

Sam ran the exact same model on the exact same 32 cars six times and got six different error estimates, from 1.60 to 3.28 mpg. What is the main reason the number moved?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The model learned something different each time, so it really is a different model ::no The model form never changed (`mpg ~ wt + hp`) and it was refit the same way each time. What changed was the DATA it was scored on, not the model.
- Each run held out a different random 8 cars, so the score reflects which cars happened to be in the test set ::ok Exactly. With only 8 cars judging the model, the estimate rides on the luck of the draw: an easy hold-out flatters it, a hard one punishes it.
- The test set of 8 cars is simply too small to fit a model on ::no The model is fit on the other 24 cars, not the 8. The 8 are only for scoring. The trouble is that 8 scoring cars give a noisy estimate, not that they are too few to train on.

=== step === widget
::eyebrow The fix
## Rotate the holdout: k-fold cross-validation

The wobble comes from letting one small hold-out set decide everything. So do not let it. **k-fold cross-validation** splits the cars into `k` equal groups, called *folds*. Then it takes turns: fold 1 is held out while folds 2 to `k` train the model and score it; then fold 2 is held out while the rest train; and so on, until every fold has been the hold-out exactly once. That gives `k` scores, and their average is the cross-validated error.

The beauty is that nothing is wasted and nothing is special. Every car trains the model in `k - 1` of the rounds and tests it in exactly one. No single lucky or unlucky split can dominate, because you average over all of them.

Step through the folds below. Watch the hold-out fold (highlighted) rotate through the data while the rest train, and see the `k` fold-scores collapse into one steadier average.

::widget cv-folds {"k":5}

=== step === concept
::eyebrow The math
## The cross-validated error, precisely

Here is that idea written exactly. Number the rows \(1\) to \(n\) (for Sam, \(n = 32\) cars). Split them into \(k\) folds \(F_1, F_2, \dots, F_k\) of roughly equal size, so \(|F_j|\) is the number of cars in fold \(j\).

For each fold \(j\), train the model on every car *except* those in \(F_j\); call that fitted model \(\hat f_{-j}\), where the \(-j\) means "fold \(j\) left out." Score it on the held-out fold with the root-mean-square error

\[ \mathrm{RMSE}_j \;=\; \sqrt{\frac{1}{|F_j|}\sum_{i \in F_j}\big(y_i - \hat f_{-j}(x_i)\big)^2}, \]

where \(y_i\) is car \(i\)'s true mpg, \(x_i\) its weight and horsepower, and \(\hat f_{-j}(x_i)\) the prediction from the model that never saw car \(i\). The cross-validated error is simply the average of the \(k\) fold scores:

\[ \mathrm{CV}_k \;=\; \frac{1}{k}\sum_{j=1}^{k}\mathrm{RMSE}_j. \]

[KEY INSIGHT]
One number, \(\mathrm{CV}_k\), built from \(k\) honest hold-out scores. Because every car is a test case exactly once, the estimate no longer hangs on a single lucky split.

=== step === tryit
::eyebrow Your turn
## Build 5-fold CV by hand

Let us turn that formula into code and pin down Sam's real number. The setup gives each of the 32 cars a random fold label from 1 to 5. Inside the loop, the held-out fold is `fold == f`; the training set is *everything else*. Fill in the blank so the model trains on the other four folds.

```r
n    <- nrow(mtcars)
set.seed(7)
k    <- 5
fold <- sample(rep(1:k, length.out = n))     # give each car a fold label 1..5
scores <- numeric(k)

for (f in 1:k) {
  train <- mtcars[____, ]                     # the other four folds
  valid <- mtcars[fold == f, ]                # this fold, held out
  fit   <- lm(mpg ~ wt + hp, data = train)
  scores[f] <- rmse_of(valid$mpg, predict(fit, valid))
}
round(mean(scores), 2)
```
::check {"regex":"fold\\s*!=\\s*f","gate":true,"difficulty":"intermediate","ok":"Right: the training set is every car whose fold label is NOT f, the complement of the hold-out. Sam's honest error comes out to 2.77 mpg, one number instead of a range.","no":"The training set is everything the hold-out is not: mtcars[fold != f, ]. Using fold == f would train on the very rows you are trying to score."}
::solution
```r
n    <- nrow(mtcars)
set.seed(7)
k    <- 5
fold <- sample(rep(1:k, length.out = n))
scores <- numeric(k)

for (f in 1:k) {
  train <- mtcars[fold != f, ]
  valid <- mtcars[fold == f, ]
  fit   <- lm(mpg ~ wt + hp, data = train)
  scores[f] <- rmse_of(valid$mpg, predict(fit, valid))
}
round(scores, 2)          # one RMSE per fold
#> [1] 3.73 1.79 2.61 2.67 3.07
round(mean(scores), 2)    # the cross-validated RMSE
#> [1] 2.77
```

Read the two lines together. The five folds individually score anywhere from 1.79 to 3.73 mpg, the same kind of wobble a single split showed. But their average, **2.77 mpg**, is one steady estimate that used every car for both training and testing. Sam finally has a number he can report.

=== step === concept
::eyebrow The extreme
## LOOCV: hold out just one car

What if you push `k` as far as it will go, all the way to `k = n`? Then each fold is a single car: train on the other 31, predict that one, record the error, and repeat 32 times. This is **leave-one-out cross-validation (LOOCV)**, the `k = n` extreme. Because each model trains on almost all the data (31 of 32 cars), LOOCV wrings the most out of a small dataset.

```r
n   <- nrow(mtcars)
loo <- numeric(n)
for (i in 1:n) {
  fit    <- lm(mpg ~ wt + hp, data = mtcars[-i, ])    # train on all but car i
  loo[i] <- mtcars$mpg[i] - predict(fit, mtcars[i, ]) # its held-out residual
}
round(sqrt(mean(loo^2)), 2)                           # LOOCV RMSE, from 32 fits
#> [1] 2.78
```

That is **2.78 mpg**, right next to the 2.77 the 5-fold run gave. But notice the cost: LOOCV refit the model 32 times, once per car. With 32 cars that is nothing; with 320,000 rows it is 320,000 fits.

For a plain linear model there is a lovely shortcut that needs no refitting at all. Fit once, then car \(i\)'s leave-one-out residual is its ordinary residual \(e_i\) divided by \(1 - h_{ii}\), where \(h_{ii}\) is the car's *leverage* (how unusual its weight and horsepower are, read straight off the fit with `hatvalues()`):

\[ e_{i}^{\,\text{LOO}} \;=\; \frac{e_i}{1 - h_{ii}}. \]

```r
full  <- lm(mpg ~ wt + hp, data = mtcars)
short <- residuals(full) / (1 - hatvalues(full))   # each car's LOO residual, no refit
round(sqrt(mean(short^2)), 2)
#> [1] 2.78
```

The same **2.78**, from a single fit. The shortcut is exact for linear models; most other models have no such trick and really must refit `n` times.

[KEY INSIGHT]
LOOCV is k-fold taken to its limit, \(k = n\). It trains on nearly all the data every time, but pays for it with \(n\) model fits (unless a shortcut like the linear one exists).

=== step === quiz
::eyebrow Check yourself
## Is LOOCV always the best choice?

A colleague argues: "LOOCV trains on almost all the data every time, so it is nearly unbiased. It must give the best error estimate, always use it." Where does that reasoning fall short?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It is correct: LOOCV is nearly unbiased, so it is always the best estimator of test error ::no Low bias is only half the story. An estimator can be nearly unbiased yet still noisy, and LOOCV also costs n model fits, which is often the deciding factor.
- LOOCV is actually badly biased, because training on n-1 rows is far too little data ::no Training on n-1 of n rows is barely less than the full set, so LOOCV's bias is tiny. Its bias is not the weakness; its variance and cost are.
- Nearly unbiased, yes, but its n near-identical models make the estimate high-variance, and it costs n fits; 5- or 10-fold often estimates test error at least as well, for far less compute ::ok Right. LOOCV's n training sets differ by a single row, so their scores are highly correlated and averaging them barely reduces variance. Moderate k is the usual sweet spot.

=== step === concept
::eyebrow Squeezing out the last wobble
## Repeated k-fold cross-validation

k-fold already tamed the wild single-split swing. But one small thing still nudges the answer: the *random* assignment of cars to folds. Shuffle the cars into folds a different way and you get a slightly different \(\mathrm{CV}_k\). Watch:

```r
cv_rmse <- function(seed, k = 5) {
  n    <- nrow(mtcars)
  set.seed(seed)
  fold <- sample(rep(1:k, length.out = n))
  scores <- numeric(k)
  for (f in 1:k) {
    fit <- lm(mpg ~ wt + hp, data = mtcars[fold != f, ])
    scores[f] <- rmse_of(mtcars$mpg[fold == f], predict(fit, mtcars[fold == f, ]))
  }
  mean(scores)
}
round(c(split_a = cv_rmse(1), split_b = cv_rmse(2), split_c = cv_rmse(3)), 2)
#> split_a split_b split_c
#>    2.68    2.37    2.84
```

Three different fold shufflings, three answers from 2.37 to 2.84. Much smaller than the single-split swing, but still there. **Repeated k-fold** removes it the same way k-fold removed the single-split luck: run the whole k-fold procedure many times, each with a fresh shuffling, and average.

```r
reps <- sapply(1:50, cv_rmse)          # 50 whole 5-fold runs, each shuffled differently
round(c(repeated_mean = mean(reps), sd_between_splits = sd(reps)), c(2, 3))
#> repeated_mean sd_between_splits
#>         2.680             0.125
```

The average over 50 runs, **2.68 mpg**, barely changes if you do it all again: the spread between individual runs is only 0.125 mpg. Repeated k-fold earns its keep on small datasets like this one, where a single shuffling can still swing the estimate.

=== step === concept
::eyebrow The estimate has its own bias and variance
## Choosing k: the estimate's own tradeoff

You now have three schemes, 5-fold, 10-fold, and LOOCV. Which `k` should you actually pick? The surprising answer is that the *error estimate itself* has a bias and a variance, and \(k\) trades one against the other.

**Bias of the estimate.** With \(k\) folds, each model trains on a fraction \((k-1)/k\) of the data. Small \(k\) means smaller training sets: 2-fold trains on only half the cars. If the model would clearly do better with more data, its cross-validated error comes out slightly *pessimistic*, an over-estimate, because every fold's model was handicapped. As \(k\) rises toward \(n\) (LOOCV), each model trains on nearly the full dataset, so that bias shrinks almost to nothing.

**Variance of the estimate.** Here it flips. \(\mathrm{CV}_k\) is an average of \(k\) fold scores. For an average of \(k\) scores that each have variance \(\sigma^2\) and share an average pairwise correlation \(\rho\),

\[ \mathrm{Var}\!\left(\mathrm{CV}_k\right) \;=\; \frac{\sigma^2}{k} \;+\; \frac{k-1}{k}\,\rho\,\sigma^2. \]

Read the two terms. The first, \(\sigma^2/k\), is the familiar "averaging shrinks noise" term. The second is the catch: when the fold scores are *correlated* (\(\rho > 0\)), averaging cannot drive the variance to zero. LOOCV is the worst case, its \(n\) models are each trained on datasets that differ by a single row, so they are almost identical and their scores are highly correlated (\(\rho\) close to 1). The second term takes over and the estimate stays noisy, no matter how large \(n\) is. A moderate \(k\) keeps the folds more different from one another, so \(\rho\) is lower and the average is steadier.

Put the two ideas together with the cost of running it:

| Scheme | Data each model sees | Bias of estimate | Variance of estimate | Cost |
|---|---|---|---|---|
| Small k (2 to 3) | little (1/2 to 2/3) | higher (pessimistic) | lower | cheap (k fits) |
| **k = 5 or 10** | **most (80 to 90%)** | **low** | **low** | **moderate** |
| LOOCV (k = n) | nearly all | lowest | higher | expensive (n fits) |

[KEY INSIGHT]
The middle row wins in practice. **5- or 10-fold** sits where the bias is already small, the variance is low, and the cost is reasonable. That is why they are the near-universal defaults.

One honest caveat, plain in Sam's own numbers: for a *stable* model with *enough* data, the schemes barely disagree (you will see all three side by side in a moment). The tradeoff above bites hardest when data is scarce or the model is flexible and unstable, exactly when getting the estimate right matters most.

=== step === quiz
::eyebrow Check yourself
## Which scheme fits the job?

One teammate is tuning a slow-to-train gradient boosting model on 200,000 rows and needs a trustworthy error estimate without waiting all week. Another has a tiny pilot dataset of 45 patients and one quick logistic model. Which resampling choice suits each?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Big slow model: 5- or 10-fold (a handful of fits, low-variance estimate). Tiny dataset: repeated k-fold or LOOCV (use every row and average away the shuffle luck) ::ok Right. Fold count is a compute budget: few folds for an expensive model on ample data; and on tiny data, repeated k-fold or LOOCV squeezes the most from scarce rows and steadies the estimate.
- Big slow model: LOOCV, because it is most accurate. Tiny dataset: a single 80/20 split, since it is fast enough ::no Backwards. LOOCV on 200,000 rows is 200,000 fits, hopeless for a slow model; and a single split on 45 rows is exactly the coin-flip wobble this lesson exists to fix.
- Both: a single train/test split, since cross-validation only works for linear models ::no Cross-validation is model-agnostic, it just refits and scores, and a single split is the least reliable option for both, especially the 45-row set.

=== step === concept
::eyebrow In practice
## Putting it to work, and where it breaks

A small reusable helper turns cross-validation into a one-liner. Here is the whole family on Sam's cars, side by side:

```r
loocv_rmse <- function() {
  n <- nrow(mtcars); r <- numeric(n)
  for (i in 1:n) {
    fit  <- lm(mpg ~ wt + hp, data = mtcars[-i, ])
    r[i] <- mtcars$mpg[i] - predict(fit, mtcars[i, ])
  }
  sqrt(mean(r^2))
}
round(c(five_fold = cv_rmse(1, 5), ten_fold = cv_rmse(1, 10), loocv = loocv_rmse()), 2)
#> five_fold  ten_fold     loocv
#>      2.68      2.55      2.78
```

Three honest estimates, all within about 0.2 mpg of each other, just as the last step promised for a stable model with enough data. In everyday work you rarely hand-roll the loop: `rsample::vfold_cv()` builds the folds for you, and `caret` or `tidymodels` run the whole resample-and-score cycle, but the loop above is exactly what they do underneath.

A few rules of thumb to carry away:

- **Default to 5- or 10-fold.** It is the bias-variance-cost sweet spot for almost every problem.
- **Repeat it on small data.** A few repeats of 10-fold steady the estimate when a single shuffle still swings it.
- **Reach for LOOCV only when data is precious** (you cannot spare a 20% fold) or the model has a cheap leave-one-out shortcut, like the linear one you saw.
- **Stratify for classification**, so every fold keeps the same class balance, which is vital when the positive class is rare.

[WARNING]
Every scheme here shuffled cars into folds *at random*, which quietly assumes the rows are independent. They often are not: repeated measurements on the same patient, sales from the same store, or readings ordered in time all break that assumption. Random folds then leak information across the split and hand you an estimate that is too good to be true. Fixing that, grouped, blocked, and time-aware cross-validation, is Lesson 2.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - the clearest first treatment of the validation set, LOOCV, and k-fold, including why LOOCV is higher-variance than k-fold.
- [The Elements of Statistical Learning, ch. 7.10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - cross-validation inside the full model-assessment picture, with the bias-variance-of-the-estimate argument in detail.
- [Kohavi (1995), A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection](http://ai.stanford.edu/~ronnyk/accEst.pdf) - the classic empirical study that made stratified 10-fold the default.
- [rsample (tidymodels) documentation](https://rsample.tidymodels.org/) - the R tooling for folds: `vfold_cv`, `loo_cv`, and repeated CV, so you never hand-roll the loop in production.

=== step === complete
## Lesson 1 complete

You can now explain why a single train/test split is a coin flip, run k-fold cross-validation to turn `k` honest hold-out scores into one steady estimate, weigh LOOCV and repeated k-fold, and choose \(k\) from the bias-variance-cost tradeoff of the estimate itself. Sam has a number he can trust: about 2.7 mpg, not a range from 1.6 to 3.3.

Next, Lesson 2: Grouped, Blocked, and Time-Aware Cross-Validation. Every scheme here assumed the rows were independent and shuffled them freely. When cars share a factory, patients repeat visits, or readings march through time, that shuffle leaks the answer across the split. You will learn to resample so the estimate stays honest even when the rows are not.

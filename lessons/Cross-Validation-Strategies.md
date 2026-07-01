---
title: "Model Evaluation Lesson 1: Cross-Validation Strategies"
catalog_blurb: "How to estimate a model's real accuracy instead of trusting one lucky split."
description: "Learn cross-validation in R: why one train/test split gives an unreliable score, and how k-fold, repeated k-fold and LOOCV give an honest estimate of accuracy."
keywords: "cross-validation, k-fold cross-validation, LOOCV, repeated cross-validation, resampling, model evaluation, train test split, bias variance, mtcars, R"
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

You have data on 32 cars, and you want to predict a car's fuel economy (its miles per gallon) from its weight. You fit a model on 24 of them, test it on the other 8, and get an average error of about 3.4 mpg. Good enough? A colleague reruns it with a different random 8 cars in the test set and gets 5.2 mpg. Same model, same 32 cars. Which number is real?

Neither, quite. The score you get from one train/test split is part skill, part luck of the draw. This lesson shows you how to take the luck out, so the number you report is one you can trust.

By the end you will be able to:

- Explain why a single train/test split gives an unreliable score
- Run k-fold cross-validation and know why its average is more honest
- Choose k wisely, and know where repeated CV and leave-one-out fit in

**Prerequisites:** you can fit a model with `lm()` and call `predict()`, you know what a train/test split is, and you have met the idea that an estimate can be biased or noisy.

::widget cv-folds {}

=== step === concept
::eyebrow The problem
## One split is a coin flip

Let us make the luck visible. We will predict `mpg` from a car's weight (`wt`) using `mtcars` (32 real cars, built into R), but instead of splitting once, we will split 200 different ways and look at the test error each time.

```r
# Predict a car's fuel economy (mpg) from its weight, using mtcars (32 cars).
rmse_split <- function(seed) {
  set.seed(seed)
  i   <- sample(nrow(mtcars), 24)          # 24 cars to train, 8 held out to test
  fit <- lm(mpg ~ wt, data = mtcars[i, ])
  sqrt(mean((mtcars$mpg[-i] - predict(fit, mtcars[-i, ]))^2))   # test error, in mpg
}

errs <- sapply(1:200, rmse_split)          # the SAME model on 200 different splits
round(range(errs), 2)                       # the smallest and largest score we could report
#> [1] 1.12 5.23
round(sd(errs), 2)                          # how much the score wobbles, in mpg
#> [1] 0.79
round(mean(errs), 2)                        # the average across all 200 splits
#> [1] 3.18
```

Read those numbers slowly. The exact same model on the exact same 32 cars scores anywhere from **1.12 to 5.23 mpg**, purely depending on which 8 cars happened to land in the test set. With only 8 cars judging the model, one lucky (or unlucky) draw swings the verdict. Report a single split and you are quoting one spin of that wheel.

Notice, though, that the *average* of all those splits, 3.18, is rock steady. That average is the whole idea behind cross-validation.

=== step === concept
::eyebrow The idea
## Rotate the holdout: k-fold CV

Here is the fix. Instead of holding out one test set and wasting the rest, k-fold cross-validation gives every car a turn in the test seat.

Shuffle the 32 cars and deal them into k equal piles, called folds. Then loop k times: hold out one fold as the validation set, train on the other k-1 folds, and record the error. After k rounds every car has been validated exactly once, and you have k scores. Average them, and that average is your cross-validated error.

For \(k\) folds with validation error \(e_i\) on fold \(i\), the cross-validated error is their mean:

\[ \text{CV}_k = \frac{1}{k} \sum_{i=1}^{k} e_i \]

Averaging is what buys the stability. A single fold's score \(e_i\) is noisy, just like our coin-flip split. But the noise in the k folds partly cancels when you average, so \(\text{CV}_k\) wobbles far less than any one \(e_i\) does.

[KEY INSIGHT]
A single split throws away most of your data to test on a handful of rows. k-fold reuses every row for both training and testing, once each, then averages. You get an estimate that uses all the data and stops depending on one lucky draw.

Step through the widget below: watch each fold take its turn as the validation slice while the rest train, and see the k scores collect into one steady average.

::widget cv-folds {"k":5}

=== step === quiz
::eyebrow Check yourself
## Where does each car end up?

You run 5-fold cross-validation on the 32 cars. How many times does each individual car sit in a validation fold?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Exactly once ::ok Right. The folds partition the cars, so each car is held out for validation in exactly one round, and helps train the model in the other four.
- Five times, once in every fold ::no Each car belongs to only ONE fold. It validates once (when its fold is held out) and trains in the other four rounds. "5 folds" is not "each car used 5 times."
- Four times, once per training round ::no Four is how often each car helps TRAIN. It is validated exactly once, in the single round when its own fold is the holdout.

=== step === concept
::eyebrow The real trade-off
## Choosing k: the bias-variance of the estimate itself

So which k should you use? This is the subtle part, and it is what separates people who run CV from people who understand it. The choice of k is itself a bias-variance trade-off, not about the model, but about the error estimate.

- **Small k (say k = 2).** Each model trains on only half the data, so it is weaker than the model you will finally ship on all the data. Its errors read a bit too high: the estimate is **pessimistically biased**. Upside: the two folds are large, so the estimate is stable (low variance).
- **Large k (say k = n).** Each model trains on almost all the data, so it behaves like your final model: **low bias**. Downside: the k training sets overlap almost completely, so the k models are nearly identical and their scores move together. Averaging correlated scores removes little noise, so the estimate is **higher variance**. It also costs k separate fits.

With per-fold variance \(\sigma^2\) and average correlation \(\rho\) between the fold scores, the variance of the CV estimate looks like:

\[ \rho\,\sigma^2 + \frac{1-\rho}{k}\,\sigma^2 \]

More folds shrink the second term but not the first, and larger k pushes \(\rho\) up. That tug-of-war is why the extremes both disappoint and the middle wins.

[WARNING]
More folds is not automatically better. Past k = 5 or 10 you pay more compute for an estimate that can actually get noisier, not cleaner. Decades of practice land on **k = 5 or k = 10** as the sweet spot for most problems.

Toggle the widget between 4, 5 and 10 folds and watch the validation slice shrink as k climbs: fewer cars judge each round, which is exactly the extra variance the math warns about.

::widget cv-folds {"k":10}

=== step === concept
::eyebrow The extreme
## LOOCV: when k equals n

Push k all the way to n and you get leave-one-out cross-validation (LOOCV): with 32 cars, that is 32 folds of one car each. Train on 31, predict the 1 you left out, repeat 32 times, average the 32 errors.

```r
# Leave-one-out CV: n = 32 fits, each leaving out exactly one car.
n   <- nrow(mtcars)
loo <- numeric(n)
for (i in 1:n) {
  fit    <- lm(mpg ~ wt, data = mtcars[-i, ])          # train on the other 31 cars
  loo[i] <- mtcars$mpg[i] - predict(fit, mtcars[i, ])  # error on the 1 held-out car
}
sqrt(mean(loo^2))          # LOOCV RMSE, in mpg
#> [1] 3.201673
```

LOOCV trains on almost the full dataset every time, so it is nearly unbiased. But those 32 training sets differ by only one car, so the 32 models are almost identical and their errors are highly correlated, exactly the high-variance case from the last step. And it costs n fits, which hurts on large data.

For a linear model there is a beautiful shortcut: you can read LOOCV straight off a single fit, using each point's leverage \(h_i\) (how much that row pulls the fitted line toward itself). The leave-one-out error for row \(i\) is just its ordinary residual \(e_i\) inflated by \(1 - h_i\):

\[ \text{CV}_{(n)} = \sqrt{\frac{1}{n}\sum_{i=1}^{n} \left(\frac{e_i}{1 - h_i}\right)^2} \]

```r
full <- lm(mpg ~ wt, data = mtcars)           # one fit on all 32 cars
h    <- hatvalues(full)                        # leverage of each car
sqrt(mean((residuals(full) / (1 - h))^2))      # same LOOCV RMSE, no loop
#> [1] 3.201673
```

Same 3.201673, from a single fit instead of 32. The shortcut only exists for linear models, but it is a lovely reminder that LOOCV is a real, computable quantity, not a black box.

=== step === quiz
::eyebrow Check yourself
## Is more always better?

A teammate says: "Always use leave-one-out CV. It trains on the most data, so it gives the most accurate error estimate." Are they right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, more training data always means a more accurate estimate ::no More training data lowers the estimate's bias, but that is only half the picture. LOOCV's n near-identical models make the average noisy (high variance), and it costs n fits.
- No, LOOCV has low bias but high variance and high cost; 5- or 10-fold usually estimates test error at least as well, far more cheaply ::ok Exactly. The near-identical training sets make the fold scores highly correlated, so their average stays noisy. Empirically 5- or 10-fold matches or beats LOOCV for a fraction of the compute.
- No, LOOCV is biased because it only ever tests one point at a time ::no Testing one point at a time is fine, every point does get tested, and LOOCV is actually nearly UNBIASED. Its weakness is variance and cost, not bias.

=== step === concept
::eyebrow Squeeze out the last of the luck
## Repeated k-fold CV

One run of 5-fold CV still made one random choice: how it dealt the cars into folds. A different shuffle gives slightly different folds and a slightly different answer. Repeated k-fold removes that last wrinkle by running the whole procedure several times with fresh shuffles and averaging everything.

```r
cv_once <- function(k = 5) {
  n    <- nrow(mtcars)
  fold <- sample(rep(1:k, length.out = n))      # deal a random fold label to each car
  err  <- numeric(k)
  for (f in 1:k) {
    fit    <- lm(mpg ~ wt, data = mtcars[fold != f, ])   # train on the other folds
    va     <- mtcars[fold == f, ]                         # validate on fold f
    err[f] <- sqrt(mean((va$mpg - predict(fit, va))^2))
  }
  mean(err)                                       # this run's 5-fold CV score
}

set.seed(1)
cv_once()      # one 5-fold run
#> [1] 3.159606
cv_once()      # run it again: different shuffle, different number
#> [1] 3.266468

reps <- replicate(50, cv_once())    # repeat the whole 5-fold CV 50 times
mean(reps)                           # repeated 5-fold CV: the steady estimate
#> [1] 3.107866
```

Two single runs gave 3.16 and 3.27, close but not identical, because the fold shuffle differs. Averaging 50 runs settles on 3.11, and would barely move if you ran it again. Repeated CV is cheap insurance on small or noisy datasets, where the fold shuffle matters most.

=== step === tryit
::eyebrow Your turn
## Split the folds correctly

Here is the heart of every k-fold loop: for the current fold `f`, the validation set is the rows *in* fold f, and the training set is everything *else*. Fill in the blank so `tr` holds the training cars (every row NOT in fold f).

```r
# Fill the blank: train on every fold EXCEPT the current one.
k    <- 5
fold <- sample(rep(1:k, length.out = nrow(mtcars)))
f    <- 1
tr <- mtcars[____, ]        # rows NOT in fold f  ->  the training set
va <- mtcars[fold == f, ]   # rows IN fold f      ->  the validation set
c(train = nrow(tr), validation = nrow(va))
```
::check {"regex":"fold\\s*!=\\s*f","gate":true,"difficulty":"beginner","ok":"That is it: fold != f selects every car whose fold is not the current one, which is exactly the training set.","no":"The training set is the complement of the holdout. Use fold != f (not fold == f) to keep every row that is NOT in fold f."}
::solution
```r
k    <- 5
fold <- sample(rep(1:k, length.out = nrow(mtcars)))
f    <- 1
tr <- mtcars[fold != f, ]   # rows NOT in fold f  ->  the training set
va <- mtcars[fold == f, ]
c(train = nrow(tr), validation = nrow(va))
#>      train validation
#>         25          7
```

=== step === concept
::eyebrow In practice
## Let a package build the folds

You now understand k-fold from the inside, which is the point. In real projects you do not hand-roll the loop, you let a resampling package deal the folds, respect grouping, and keep everything reproducible. In the tidymodels world that is `rsample`:

```r-static
library(rsample)

# 10-fold CV, repeated 5 times, in one line
folds <- vfold_cv(mtcars, v = 10, repeats = 5)

# For classification: keep each fold's class balance with strata
folds <- vfold_cv(diamonds, v = 10, strata = cut)
```

[KEY INSIGHT]
For classification, use **stratified folds** (the `strata` argument): each fold keeps the same class proportions as the whole dataset. Without it, a rare class can vanish from a fold entirely and wreck that fold's score, especially on imbalanced data.

One caution before you trust any of this: plain k-fold assumes the rows are independent and interchangeable. When rows are grouped (many readings from the same patient) or ordered in time (yesterday predicts today), a random split leaks information across folds and flatters your score. That is a whole strategy of its own, and it is exactly where Lesson 2 goes next.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - the clearest first read on the validation-set approach, LOOCV and k-fold, with the bias-variance of the estimate.
- [The Elements of Statistical Learning, ch. 7.10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the rigorous treatment of cross-validation and why it estimates test error.
- [Kohavi (1995), A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection (IJCAI)](https://www.ijcai.org/Proceedings/95-2/Papers/016.pdf) - the classic experiments behind "use stratified 10-fold."
- [rsample (tidymodels) documentation](https://rsample.tidymodels.org/) - how to build folds, repeats and stratified resamples in real R code.

=== step === complete
## Lesson 1 complete

You can now take the luck out of a model's score. A single split is a coin flip; k-fold rotates the holdout so every row is tested once, then averages for a steady estimate. You know the choice of k is a bias-variance trade in the estimate itself, why 5 or 10 usually beats leave-one-out, and how repeated k-fold squeezes out the last of the shuffle luck.

Next, Lesson 2: Grouped, blocked and time-aware CV. When rows share a group or sit in time order, a random split quietly leaks the answer across folds. You will learn to resample so the score you report is the score you will actually get.

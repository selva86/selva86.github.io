---
title: "ML Interview Questions in R: 25 Solved Problems"
slug: "ML-Interview-Questions-in-R"
description: "Machine learning interview questions in R, solved and runnable: bias-variance, data leakage, cross-validation, regularization, tree tuning, and classification metrics."
keywords: "machine learning interview questions R, ML coding interview, bias variance R, data leakage R, cross validation mistakes, classification metrics R, regularization R"
mathjax: true
webr: true
date: "2026-07-14"
post_type: "EX"
sidebar_title: "ML Interview Questions"
sidebar_order: 145
fr_parent: "Machine-Learning-Exercises-in-R.html"
auto_link_terms: "cross-validation|data leakage|regularization|confusion matrix|bias-variance tradeoff|decision tree"
auto_link_case_sensitive: false
target_keyword: "machine learning interview questions R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ML Interview Questions in R: 25 Solved Problems

<p class="lead">A featured collection of the machine learning questions interviewers actually ask, worked end to end in runnable R. Each problem isolates one idea that trips candidates up: bias-variance, data leakage, cross-validation done wrong, regularization, tree tuning, and picking a classification threshold. Every solution is hidden until you have tried it yourself.</p>

These are conceptual traps, not package trivia. The code stays in base R, `rpart`, and `MASS` so you can reason about what the numbers mean rather than memorising an API. Read each task, write your answer in the "Your turn" box, run it, then open the solution and compare.

```r title="Run this once before any exercise"
library(MASS)     # ridge regression via lm.ridge()
library(rpart)    # classification and regression trees
# Each problem sets its own seed, so they run in any order and stand alone.
```

## Section 1. Bias, variance, and model complexity (4 problems)

The single most common ML interview theme. Interviewers want to see that you know why a more flexible model is not automatically better.

### Exercise 1.1: Watch training error fall as polynomial degree grows

**Task:** A candidate argues that whichever model fits the training data best is the best model. Using `set.seed(1)` and a 50-point sample from a noisy sine curve, fit polynomials of degree 1, 3, 5, and 9 with `lm()` and record each model's training mean squared error. Save the named vector to `ex_1_1`.

**Expected result:**

```
#>   deg1   deg3   deg5   deg9 
#> 0.3195 0.0732 0.0682 0.0658 
```

**Difficulty:** Beginner

[HINTS]
Training error keeps dropping as you add flexibility, so this number alone can never tell you which model will generalise.
Loop the degrees with `sapply()`, fit each as `lm(y ~ poly(x, d))`, and take `mean(residuals(fit)^2)`.

```r title="Your turn"
set.seed(1)
x <- runif(50)
y <- sin(2 * pi * x) + rnorm(50, 0, 0.3)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
x <- runif(50)
y <- sin(2 * pi * x) + rnorm(50, 0, 0.3)

degrees <- c(1, 3, 5, 9)
ex_1_1 <- sapply(degrees, function(d) round(mean(residuals(lm(y ~ poly(x, d)))^2), 4))
names(ex_1_1) <- paste0("deg", degrees)
ex_1_1
#>   deg1   deg3   deg5   deg9 
#> 0.3195 0.0732 0.0682 0.0658 
```

**Explanation:** Training error is monotonically non-increasing in model complexity, so degree 9 "wins" on the training set every time. That is exactly why it is a useless model-selection criterion: the drop from degree 5 to degree 9 is the model memorising noise, not signal. The correct move is to judge models on data they did not see, which the next problem does.

</details>

### Exercise 1.2: Split training and test error to expose overfitting

**Task:** The right way to compare complexities is on held-out data. Using `set.seed(42)`, generate 60 training points and 2000 test points from the same noisy sine function, fit polynomials of degree 1 through 10, and record both the training and test mean squared error for each degree. Save the resulting data frame to `ex_1_2`.

**Expected result:**

```
#>    degree train_mse test_mse
#> 1       1     0.311    0.302
#> 2       2     0.305    0.305
#> 3       3     0.082    0.097
#> 4       4     0.079    0.100
#> 5       5     0.070    0.096
#> 6       6     0.070    0.097
#> 7       7     0.069    0.097
#> 8       8     0.069    0.097
#> 9       9     0.066    0.100
#> 10     10     0.063    0.103
```

**Difficulty:** Intermediate

[HINTS]
Training error falls smoothly, but test error should bottom out and then creep back up as the model starts fitting noise.
Build a helper that draws `data.frame(x, y)`, then loop degrees storing `mean((train$y - predict(fit))^2)` and the same on the test set.

```r title="Your turn"
set.seed(42)
f <- function(x) sin(2 * pi * x)
gen <- function(n) { x <- runif(n); data.frame(x = x, y = f(x) + rnorm(n, 0, 0.3)) }
train <- gen(60); test <- gen(2000)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
f <- function(x) sin(2 * pi * x)
gen <- function(n) { x <- runif(n); data.frame(x = x, y = f(x) + rnorm(n, 0, 0.3)) }
train <- gen(60); test <- gen(2000)

degrees <- 1:10
ex_1_2 <- data.frame(degree = degrees, train_mse = NA_real_, test_mse = NA_real_)
for (i in seq_along(degrees)) {
  fit <- lm(y ~ poly(x, degrees[i]), data = train)
  ex_1_2$train_mse[i] <- round(mean((train$y - predict(fit))^2), 3)
  ex_1_2$test_mse[i]  <- round(mean((test$y - predict(fit, test))^2), 3)
}
ex_1_2
#>    degree train_mse test_mse
#> 1       1     0.311    0.302
#> ...
#> 10     10     0.063    0.103
```

**Explanation:** Test error is the honest signal. It falls sharply from degree 1 to 3 (fixing underfitting), flattens in the sweet spot, then rises past degree 8 as the extra terms chase noise. Training error never shows this turn, which is the whole reason you hold out data. A common interview mistake is quoting training accuracy as if it were performance.

</details>

### Exercise 1.3: Measure variance directly with a resampling experiment

**Task:** The bias-variance tradeoff is easiest to see when you repeat the experiment. Using `set.seed(7)`, draw 200 fresh 30-point datasets, and for each one predict the response at `x = 0.5` from both a degree-1 model and a degree-9 model. Report the variance of those 200 predictions for each model and save the named vector to `ex_1_3`.

**Expected result:**

```
#>  var_simple var_complex 
#>      0.0081      0.0283 
```

**Difficulty:** Advanced

[HINTS]
Variance here means how much a model's prediction at a fixed point jumps around when you swap in a new training sample.
Loop 200 times: draw new data, fit both models, store `predict(fit, data.frame(x = 0.5))`, then take `var()` of each vector.

```r title="Your turn"
set.seed(7)
f <- function(x) sin(2 * pi * x)
x0 <- 0.5; reps <- 200
pred_simple <- numeric(reps); pred_complex <- numeric(reps)
# fill pred_simple and pred_complex over reps draws, then:
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
f <- function(x) sin(2 * pi * x)
x0 <- 0.5; reps <- 200
pred_simple <- numeric(reps); pred_complex <- numeric(reps)
for (r in 1:reps) {
  x <- runif(30); y <- f(x) + rnorm(30, 0, 0.3); d <- data.frame(x, y)
  pred_simple[r]  <- predict(lm(y ~ poly(x, 1), data = d), data.frame(x = x0))
  pred_complex[r] <- predict(lm(y ~ poly(x, 9), data = d), data.frame(x = x0))
}
ex_1_3 <- round(c(var_simple = var(pred_simple), var_complex = var(pred_complex)), 4)
ex_1_3
#>  var_simple var_complex 
#>      0.0081      0.0283 
```

**Explanation:** Expected test error decomposes as $\mathbb{E}[(y-\hat{f})^2] = \text{Bias}^2 + \text{Variance} + \sigma^2$. This experiment isolates the variance term: the degree-9 model's prediction swings roughly 3.5 times more than the degree-1 model's because flexible models bend to fit each sample's noise. The simple model has higher bias but lower variance, and the best model trades one against the other.

</details>

### Exercise 1.4: Draw a learning curve over training-set size

**Task:** Interviewers ask "more data or a better model?" A learning curve answers it. Using `set.seed(11)` and a linear signal with unit noise, fit `lm(y ~ x)` on training sets of size 5, 10, 20, 40, and 80, and record test RMSE on a fixed 2000-point test set. Save the data frame to `ex_1_4`.

**Expected result:**

```
#>    n test_rmse
#> 1  5     2.685
#> 2 10     1.025
#> 3 20     1.034
#> 4 40     1.005
#> 5 80     0.992
```

**Difficulty:** Intermediate

[HINTS]
As training size grows, test error should fall and then flatten out near the irreducible noise floor, here a standard deviation of 1.
Regenerate a training set at each size inside the loop, fit, and compute `sqrt(mean((test$y - predict(fit, test))^2))`.

```r title="Your turn"
set.seed(11)
f <- function(x) 2 * x + 1
test <- data.frame(x = runif(2000)); test$y <- f(test$x) + rnorm(2000, 0, 1)
sizes <- c(5, 10, 20, 40, 80)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
f <- function(x) 2 * x + 1
test <- data.frame(x = runif(2000)); test$y <- f(test$x) + rnorm(2000, 0, 1)

sizes <- c(5, 10, 20, 40, 80)
ex_1_4 <- data.frame(n = sizes, test_rmse = NA_real_)
for (i in seq_along(sizes)) {
  tr <- data.frame(x = runif(sizes[i])); tr$y <- f(tr$x) + rnorm(sizes[i], 0, 1)
  fit <- lm(y ~ x, data = tr)
  ex_1_4$test_rmse[i] <- round(sqrt(mean((test$y - predict(fit, test))^2)), 3)
}
ex_1_4
#>    n test_rmse
#> 1  5     2.685
#> ...
#> 5 80     0.992
```

**Explanation:** The curve plunges from n = 5 to n = 10, then flattens at about 1.0, which is the noise standard deviation you built in. Once a model sits on that floor, more data barely helps and the answer to "more data or better model?" flips to "a model that can capture more signal." A flat, high curve signals high bias; a large train-test gap signals high variance.

</details>

## Section 2. Train/test discipline and data leakage (4 problems)

Leakage is the bug that produces a 0.99 validation score and a model that fails in production. These problems reproduce the classic traps.

### Exercise 2.1: Make a clean, reproducible train/test split

**Task:** Every workflow starts here. Using `set.seed(123)`, split `mtcars` into a 70% training set and a 30% test set by sampling row indices, then confirm the two sets do not overlap. Save a named vector of the total, train, test, and overlap row counts to `ex_2_1`.

**Expected result:**

```
#>   total   train    test overlap 
#>      32      22      10       0 
```

**Difficulty:** Beginner

[HINTS]
The overlap count must be zero: a row that appears in both sets leaks the answer into evaluation.
Use `sample(n, round(0.7 * n))` for the training indices and index the test set with the negative of those indices.

```r title="Your turn"
set.seed(123)
n <- nrow(mtcars)
train_idx <- sample(n, size = round(0.7 * n))
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
n <- nrow(mtcars)
train_idx <- sample(n, size = round(0.7 * n))
train <- mtcars[train_idx, ]
test  <- mtcars[-train_idx, ]
ex_2_1 <- c(total = n, train = nrow(train), test = nrow(test),
            overlap = length(intersect(rownames(train), rownames(test))))
ex_2_1
#>   total   train    test overlap 
#>      32      22      10       0 
```

**Explanation:** Indexing the test set with `-train_idx` guarantees a disjoint partition, and `set.seed()` makes the split reproducible so results are comparable across runs. The overlap check looks trivial but catches a real bug: sampling with `replace = TRUE`, or re-sampling test rows separately, can silently place the same observation in both sets and inflate your score.

</details>

### Exercise 2.2: Prove that scaling before the split leaks information

**Task:** A subtle leak: computing a feature's mean and standard deviation on the full dataset before splitting lets test statistics influence training. Using `set.seed(5)`, scale a held-out test feature two ways, once with statistics from the whole dataset and once with training-only statistics, and compare the resulting means. Save the named comparison vector to `ex_2_2`.

**Expected result:**

```
#>          mean_all_data        mean_train_only test_scaled_mean_wrong test_scaled_mean_right 
#>                 10.095                 10.444                 -0.288                 -0.415 
```

**Difficulty:** Intermediate

[HINTS]
The full-data mean is contaminated by the test rows, so any transform built from it has already seen the test set.
Compute `mean()` and `sd()` on the full data (the wrong way) and on the training rows only (the right way), then scale the test feature with each.

```r title="Your turn"
set.seed(5)
d <- data.frame(x = rnorm(100, mean = 10, sd = 3))
idx <- sample(100, 70)
train <- d[idx, , drop = FALSE]; test <- d[-idx, , drop = FALSE]
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
d <- data.frame(x = rnorm(100, mean = 10, sd = 3))
idx <- sample(100, 70)
train <- d[idx, , drop = FALSE]; test <- d[-idx, , drop = FALSE]

mu_all <- mean(d$x); sd_all <- sd(d$x)          # WRONG: uses test rows
test_wrong <- (test$x - mu_all) / sd_all
mu_tr <- mean(train$x); sd_tr <- sd(train$x)    # RIGHT: training only
test_right <- (test$x - mu_tr) / sd_tr

ex_2_2 <- c(mean_all_data = round(mu_all, 3), mean_train_only = round(mu_tr, 3),
            test_scaled_mean_wrong = round(mean(test_wrong), 3),
            test_scaled_mean_right = round(mean(test_right), 3))
ex_2_2
#>          mean_all_data        mean_train_only test_scaled_mean_wrong test_scaled_mean_right 
#>                 10.095                 10.444                 -0.288                 -0.415 
```

**Explanation:** The full-data mean (10.095) differs from the training-only mean (10.444) because the test rows moved it, and any preprocessing built on that number has already peeked at the test set. In production, the scaler must be fit on training data and merely applied to new rows, since at prediction time you do not have the future data to average over. The right way is to learn `mu` and `sd` on the training fold and reuse them everywhere.

</details>

### Exercise 2.3: Catch a leaky feature that is built from the target

**Task:** The most damaging leak is a feature computed from the label itself. Using `set.seed(99)`, build a binary classification set where one predictor is a noisy copy of the target, then compare test accuracy of a logistic model with and without that leaky feature. Save the named accuracy vector to `ex_2_3`.

**Expected result:**

```
#>    with_leak without_leak 
#>        0.892        0.683 
```

**Difficulty:** Advanced

[HINTS]
A feature that is the target plus a little noise makes the model look brilliant offline and collapse in production, where that feature does not exist yet.
Write an accuracy helper that fits `glm(..., family = binomial)`, thresholds the predicted probability at 0.5, and compares to the true label.

```r title="Your turn"
set.seed(99)
n <- 400
x1 <- rnorm(n); x2 <- rnorm(n)
p <- plogis(0.8 * x1 - 0.5 * x2)
y <- rbinom(n, 1, p)
leaky <- y + rnorm(n, 0, 0.4)          # feature derived from the target
d <- data.frame(y = y, x1 = x1, x2 = x2, leaky = leaky)
idx <- sample(n, 0.7 * n); tr <- d[idx, ]; te <- d[-idx, ]
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
n <- 400
x1 <- rnorm(n); x2 <- rnorm(n)
p <- plogis(0.8 * x1 - 0.5 * x2)
y <- rbinom(n, 1, p)
leaky <- y + rnorm(n, 0, 0.4)
d <- data.frame(y = y, x1 = x1, x2 = x2, leaky = leaky)
idx <- sample(n, 0.7 * n); tr <- d[idx, ]; te <- d[-idx, ]

acc <- function(form) {
  m <- glm(form, data = tr, family = binomial)
  pr <- as.integer(predict(m, te, type = "response") > 0.5)
  mean(pr == te$y)
}
ex_2_3 <- c(with_leak = round(acc(y ~ x1 + x2 + leaky), 3),
            without_leak = round(acc(y ~ x1 + x2), 3))
ex_2_3
#>    with_leak without_leak 
#>        0.892        0.683 
```

**Explanation:** The leaky feature lifts accuracy from 0.68 to 0.89 because it is essentially the answer key. In interviews this shows up as "we hit 99% offline but 60% live": a feature was populated after the outcome was known, or joined from a table that includes the label. The fix is to audit every feature for whether it would be available at prediction time, before the event you are predicting has happened.

</details>

### Exercise 2.4: Show why feature selection must live inside the split

**Task:** Selecting features on the whole dataset before cross-validation is a leak that mints spurious signal. Using `set.seed(2024)`, build 500 pure-noise features and a noise target, pick the 5 features most correlated with the target using all rows, then estimate 5-fold cross-validation error for that leaked selection versus the null variance. Save the named comparison to `ex_2_4`.

**Expected result:**

```
#> leaked_selection    null_baseline 
#>            0.580            0.846 
```

**Difficulty:** Advanced

[HINTS]
When the target is pure noise, an honest error estimate cannot beat the variance of the target, so anything lower is leakage.
Rank features by `abs(cor(X, y))` on the full data, then run manual k-fold on just those columns and compare the mean fold error to `var(y)`.

```r title="Your turn"
set.seed(2024)
n <- 100; p <- 500
X <- matrix(rnorm(n * p), n, p)
y <- rnorm(n)                       # target unrelated to X
cors <- abs(cor(X, y))
top  <- order(cors, decreasing = TRUE)[1:5]
folds <- sample(rep(1:5, length.out = n))
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2024)
n <- 100; p <- 500
X <- matrix(rnorm(n * p), n, p)
y <- rnorm(n)
cors <- abs(cor(X, y))
top  <- order(cors, decreasing = TRUE)[1:5]
folds <- sample(rep(1:5, length.out = n))

cv_err <- function(cols) {
  mean(sapply(1:5, function(k) {
    tr <- folds != k; te <- !tr
    fit <- lm(y[tr] ~ X[tr, cols, drop = FALSE])
    pr  <- cbind(1, X[te, cols, drop = FALSE]) %*% coef(fit)
    mean((y[te] - pr)^2)
  }))
}
ex_2_4 <- c(leaked_selection = round(cv_err(top), 3), null_baseline = round(var(y), 3))
ex_2_4
#> leaked_selection    null_baseline 
#>            0.580            0.846 
```

**Explanation:** The target is random noise, so no feature carries real signal, yet the leaked cross-validation error (0.58) sits well below the null variance (0.85). Choosing the top-correlated features using all rows lets the test folds vote on their own selection, an optimistic bias sometimes called the selection winner's curse. The cure is to run feature selection inside each training fold, so the held-out fold never influences which columns survive.

</details>

## Section 3. Cross-validation, done right and wrong (4 problems)

Cross-validation is the workhorse of honest evaluation, and also where candidates quietly reintroduce optimism.

### Exercise 3.1: Implement k-fold cross-validation by hand

**Task:** Interviewers often ask you to code k-fold from scratch rather than call a library. Using `set.seed(321)`, assign the rows of `mtcars` to 5 folds, fit `lm(mpg ~ wt + hp)` on each training portion, and record the per-fold RMSE plus the overall cross-validation RMSE. Save the named vector to `ex_3_1`.

**Expected result:**

```
#>   fold1   fold2   fold3   fold4   fold5 cv_rmse 
#>   2.794   2.930   2.057   2.894   2.890   2.713 
```

**Difficulty:** Intermediate

[HINTS]
Each row must serve as test data exactly once, so build a fold label vector and rotate which fold is held out.
Use `sample(rep(1:5, length.out = nrow(d)))` for the labels and average the five fold RMSEs for the overall estimate.

```r title="Your turn"
set.seed(321)
d <- mtcars; k <- 5
folds <- sample(rep(1:k, length.out = nrow(d)))
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(321)
d <- mtcars; k <- 5
folds <- sample(rep(1:k, length.out = nrow(d)))
rmse_k <- sapply(1:k, function(i) {
  tr <- d[folds != i, ]; te <- d[folds == i, ]
  fit <- lm(mpg ~ wt + hp, data = tr)
  sqrt(mean((te$mpg - predict(fit, te))^2))
})
ex_3_1 <- c(round(rmse_k, 3), cv_rmse = round(mean(rmse_k), 3))
names(ex_3_1)[1:5] <- paste0("fold", 1:5)
ex_3_1
#>   fold1   fold2   fold3   fold4   fold5 cv_rmse 
#>   2.794   2.930   2.057   2.894   2.890   2.713 
```

**Explanation:** The cross-validation estimate is the average of the fold RMSEs, and the spread across folds (2.06 to 2.93) is itself informative: wide spread on a small dataset like `mtcars` means the estimate is noisy, which is why 5 or 10 folds beat a single split. Averaging over folds uses every row for both training and testing without ever testing on a row the model trained on.

</details>

### Exercise 3.2: Never tune and report on the same data

**Task:** Choosing the best of many models on a tuning set and then quoting that same score is optimistic. Using `set.seed(808)`, create 20 noise features and a noise target with three splits (train, tune, test), pick the single feature with the lowest tune-set error, then compare its tune error to its honest test error. Save the named vector to `ex_3_2`.

**Expected result:**

```
#> chosen_feature       tune_mse       test_mse 
#>          9.000          0.810          1.104 
```

**Difficulty:** Advanced

[HINTS]
Picking the minimum over 20 candidates on the tune set captures noise, so the tune score is biased low compared to a fresh test set.
Fit 20 one-feature models on the train split, evaluate each on the tune split, take `which.min()`, then score that winner on the untouched test split.

```r title="Your turn"
set.seed(808)
n <- 300
X <- matrix(rnorm(n * 20), n, 20); colnames(X) <- paste0("X", 1:20)
y <- rnorm(n)
d <- data.frame(y = y, X)
i1 <- 1:100; i2 <- 101:200; i3 <- 201:300   # train / tune / test
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(808)
n <- 300
X <- matrix(rnorm(n * 20), n, 20); colnames(X) <- paste0("X", 1:20)
y <- rnorm(n)
d <- data.frame(y = y, X)
i1 <- 1:100; i2 <- 101:200; i3 <- 201:300

tune_err <- sapply(1:20, function(j) {
  fit <- lm(y ~ ., data = d[i1, c("y", paste0("X", j))])
  mean((d$y[i2] - predict(fit, d[i2, ]))^2)
})
best <- which.min(tune_err)
fit_best <- lm(y ~ ., data = d[i1, c("y", paste0("X", best))])
ex_3_2 <- c(chosen_feature = best,
            tune_mse = round(min(tune_err), 3),
            test_mse = round(mean((d$y[i3] - predict(fit_best, d[i3, ]))^2), 3))
ex_3_2
#> chosen_feature       tune_mse       test_mse 
#>          9.000          0.810          1.104 
```

**Explanation:** Feature 9 wins purely by chance, and its tune error (0.81) undershoots its true test error (1.10) because the minimum over 20 candidates rewards whichever noise pattern happened to fit the tune set. The lesson: the data used to choose a model cannot also be used to report its performance. Reserve a final test set you touch once, or use nested cross-validation so tuning happens inside an inner loop.

</details>

### Exercise 3.3: Compute leave-one-out CV with the hat-matrix shortcut

**Task:** For linear models you can get leave-one-out cross-validation without refitting n times. Using `mtcars` and `lm(mpg ~ wt + hp)`, compute LOOCV RMSE with the leverage shortcut and confirm it matches the brute-force loop that refits the model leaving out each row. Save the named vector to `ex_3_3`.

**Expected result:**

```
#>    shortcut brute_force 
#>      2.7755      2.7755 
```

**Difficulty:** Intermediate

[HINTS]
There is an algebraic identity that turns n refits into a single fit plus the diagonal of the hat matrix.
The i-th leave-one-out residual equals `residuals(fit)[i] / (1 - hatvalues(fit)[i])`, so RMSE is `sqrt(mean((resid / (1 - h))^2))`.

```r title="Your turn"
fit <- lm(mpg ~ wt + hp, data = mtcars)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt + hp, data = mtcars)
h <- hatvalues(fit)
loocv_rmse <- sqrt(mean((residuals(fit) / (1 - h))^2))

brute <- sqrt(mean(sapply(1:nrow(mtcars), function(i) {
  m <- lm(mpg ~ wt + hp, data = mtcars[-i, ])
  (mtcars$mpg[i] - predict(m, mtcars[i, ]))^2
})))
ex_3_3 <- c(shortcut = round(loocv_rmse, 4), brute_force = round(brute, 4))
ex_3_3
#>    shortcut brute_force 
#>      2.7755      2.7755 
```

**Explanation:** The two numbers match exactly because the leverage identity is algebra, not approximation: dividing each residual by one minus its leverage recovers the leave-one-out residual from a single fit. This turns an O(n) set of refits into one fit, which matters when n is large. It only holds for ordinary least squares, so for other models you still cross-validate the slow way.

</details>

### Exercise 3.4: Stratify folds so class balance is preserved

**Task:** With imbalanced classes, random folds can leave a fold short of the minority class. Using `set.seed(2020)` and a target that is 10% positive, build 5 folds by sampling separately within each class, then report the class proportions in each fold. Save the rounded proportion table to `ex_3_4`.

**Expected result:**

```
#>     class
#> fold neg pos
#>    1 0.9 0.1
#>    2 0.9 0.1
#>    3 0.9 0.1
#>    4 0.9 0.1
#>    5 0.9 0.1
```

**Difficulty:** Intermediate

[HINTS]
The point of stratification is that every fold mirrors the overall class ratio, here roughly 10% positive.
Loop over the class levels, assign fold labels within each class with `sample(rep(1:k, length.out = ...))`, then check with `prop.table(table(fold, class), margin = 1)`.

```r title="Your turn"
set.seed(2020)
y <- factor(rep(c("pos", "neg"), times = c(50, 450)))   # 10% positive
k <- 5
folds <- integer(length(y))
# assign folds within each class, then:
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2020)
y <- factor(rep(c("pos", "neg"), times = c(50, 450)))
k <- 5
folds <- integer(length(y))
for (cl in levels(y)) {
  idx <- which(y == cl)
  folds[idx] <- sample(rep(1:k, length.out = length(idx)))
}
ex_3_4 <- round(prop.table(table(fold = folds, class = y), margin = 1), 3)
ex_3_4
#>     class
#> fold neg pos
#>    1 0.9 0.1
#> ...
#>    5 0.9 0.1
```

**Explanation:** Stratifying within each class guarantees every fold holds about 10% positives, so no fold trains or tests on a distorted distribution. With plain random folds and only 50 positives across 5 folds, an unlucky draw could hand one fold 4 positives and another 16, making per-fold metrics wobble. Stratification is standard for classification and essential when the minority class is small.

</details>

## Section 4. Regularization (3 problems)

Ridge and lasso are constant interview territory. These problems make the shrinkage visible instead of abstract.

### Exercise 4.1: Watch ridge shrink coefficients toward zero

**Task:** Ridge regression adds an L2 penalty that pulls coefficients toward zero as the penalty grows. Fit `lm.ridge(mpg ~ wt + hp + disp)` on `mtcars` across lambda values 0, 1, 10, and 50, and report the coefficient matrix so you can watch the shrinkage. Save the rounded matrix to `ex_4_1`.

**Expected result:**

```
#>                 wt      hp    disp
#>  0 37.1055 -3.8009 -0.0312 -0.0009
#>  1 36.2361 -3.3525 -0.0286 -0.0050
#> 10 33.4454 -2.2650 -0.0231 -0.0116
#> 50 29.0981 -1.3736 -0.0163 -0.0096
```

**Difficulty:** Intermediate

[HINTS]
At lambda 0 you recover ordinary least squares; as lambda climbs, each slope is dragged toward zero.
Pass a vector of lambda values to `lm.ridge()` and read the whole path with `coef()`.

```r title="Your turn"
lambdas <- c(0, 1, 10, 50)
fit <- lm.ridge(mpg ~ wt + hp + disp, data = mtcars, lambda = lambdas)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lambdas <- c(0, 1, 10, 50)
fit <- lm.ridge(mpg ~ wt + hp + disp, data = mtcars, lambda = lambdas)
ex_4_1 <- round(coef(fit), 4)
ex_4_1
#>                 wt      hp    disp
#>  0 37.1055 -3.8009 -0.0312 -0.0009
#> ...
#> 50 29.0981 -1.3736 -0.0163 -0.0096
```

**Explanation:** Each row is the fitted model at one penalty strength, and the `wt` coefficient marches from -3.80 toward -1.37 as lambda rises. Ridge trades a little bias for a large drop in variance, which is why it helps when predictors are correlated or n is small. Note the intercept (first, unlabelled column) is not penalised, since shrinking it would just bias the overall level of the predictions.

</details>

### Exercise 4.2: Show ridge taming unstable coefficients under collinearity

**Task:** When two predictors are nearly identical, ordinary least squares produces wild, unstable coefficients. Using `set.seed(4)`, build `x2` as `x1` plus tiny noise, then compare the `x1` and `x2` coefficients from `lm()` against ridge at lambda 5. Save the rounded comparison matrix to `ex_4_2`.

**Expected result:**

```
#>           x1     x2
#> ols   11.085 -9.098
#> ridge  0.987  0.964
```

**Difficulty:** Advanced

[HINTS]
Near-duplicate predictors make the least-squares solution explode into large offsetting coefficients that swap sign on tiny data changes.
Fit both `lm(y ~ x1 + x2)` and `lm.ridge(y ~ x1 + x2, lambda = 5)`, then `rbind` the two coefficient pairs.

```r title="Your turn"
set.seed(4)
n <- 100
x1 <- rnorm(n); x2 <- x1 + rnorm(n, 0, 0.01)     # x2 nearly equals x1
y  <- 2 * x1 + rnorm(n, 0, 0.5)
d  <- data.frame(y, x1, x2)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(4)
n <- 100
x1 <- rnorm(n); x2 <- x1 + rnorm(n, 0, 0.01)
y  <- 2 * x1 + rnorm(n, 0, 0.5)
d  <- data.frame(y, x1, x2)

ols   <- coef(lm(y ~ x1 + x2, data = d))[c("x1", "x2")]
ridge <- coef(lm.ridge(y ~ x1 + x2, data = d, lambda = 5))[c("x1", "x2")]
ex_4_2 <- round(rbind(ols = ols, ridge = ridge), 3)
ex_4_2
#>           x1     x2
#> ols   11.085 -9.098
#> ridge  0.987  0.964
```

**Explanation:** OLS splits the true effect of 2 into a huge positive and huge negative pair (11.1 and -9.1) because the two predictors are almost interchangeable, so their difference is barely constrained. Ridge shares the effect evenly (about 0.99 each, summing near 2) and stays stable across resamples. This is the interview answer to "why does multicollinearity matter and how does regularization help?"

</details>

### Exercise 4.3: Trace the coefficient norm along the lambda path

**Task:** A compact way to summarise regularization strength is the size of the whole coefficient vector. Standardise `mpg`, `wt`, `hp`, and `disp` from `mtcars`, fit ridge across lambda values 0, 1, 5, 25, and 100, and report the L2 norm of the coefficient vector at each lambda. Save the data frame to `ex_4_3`.

**Expected result:**

```
#>     lambda coef_l2_norm
#> 0        0       0.7119
#> 1        1       0.6426
#> 5        5       0.5541
#> 25      25       0.4334
#> 100    100       0.2535
```

**Difficulty:** Intermediate

[HINTS]
The coefficient norm should shrink monotonically as the penalty grows, which is regularization made into a single number.
Drop the intercept column from `coef(fit)`, then compute `sqrt(rowSums(co^2))` across the lambda rows.

```r title="Your turn"
d <- as.data.frame(scale(mtcars[, c("mpg", "wt", "hp", "disp")]))
lambdas <- c(0, 1, 5, 25, 100)
fit <- lm.ridge(mpg ~ wt + hp + disp, data = d, lambda = lambdas)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- as.data.frame(scale(mtcars[, c("mpg", "wt", "hp", "disp")]))
lambdas <- c(0, 1, 5, 25, 100)
fit <- lm.ridge(mpg ~ wt + hp + disp, data = d, lambda = lambdas)
co <- coef(fit)[, c("wt", "hp", "disp")]
ex_4_3 <- data.frame(lambda = lambdas, coef_l2_norm = round(sqrt(rowSums(co^2)), 4))
ex_4_3
#>     lambda coef_l2_norm
#> 0        0       0.7119
#> ...
#> 100    100       0.2535
```

**Explanation:** The norm falls from 0.71 to 0.25 as lambda climbs, which is the geometric picture of ridge: it constrains the coefficient vector inside an ever-smaller ball. Standardising first matters, because the penalty acts on raw coefficient size, so features on larger scales would otherwise be penalised less. This is also why you should scale before any penalised model, ridge or lasso.

</details>

## Section 5. Trees and tuning intuition (4 problems)

Decision trees are interview favourites because a single hyperparameter, the complexity penalty, makes the bias-variance dial tangible.

### Exercise 5.1: Fit a classification tree and read its confusion matrix

**Task:** Start with a baseline tree. Fit `rpart(Species ~ .)` on the full `iris` dataset as a classification tree, predict the class for every row, and build the confusion matrix of predicted versus actual species. Save the resulting table to `ex_5_1`.

**Expected result:**

```
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         49         5
#>   virginica       0          1        45
```

**Difficulty:** Beginner

[HINTS]
Setosa is linearly separable, so the errors will all sit between the two similar species, versicolor and virginica.
Use `predict(fit, iris, type = "class")` to get labels, then `table(predicted, actual)`.

```r title="Your turn"
fit <- rpart(Species ~ ., data = iris, method = "class")
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- rpart(Species ~ ., data = iris, method = "class")
pred <- predict(fit, iris, type = "class")
ex_5_1 <- table(predicted = pred, actual = iris$Species)
ex_5_1
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         49         5
#>   virginica       0          1        45
```

**Explanation:** All 50 setosa are perfect while the six errors fall between versicolor and virginica, whose petals overlap, exactly where you would expect a tree to struggle. Reading this on the training data measures fit, not generalisation, so treat 6 errors as a floor: on unseen data a tree this size usually does slightly worse. The off-diagonal cells tell you which classes the model confuses, which no single accuracy number reveals.

</details>

### Exercise 5.2: See the complexity parameter control tree size

**Task:** The `cp` parameter is a tree's regularization dial: a larger `cp` forbids splits that do not improve fit enough, yielding a smaller tree. Grow `rpart(mpg ~ .)` regression trees on `mtcars` at `cp` values 0.3, 0.1, 0.05, and 0.01, and count the leaves in each. Save the data frame to `ex_5_2`.

**Expected result:**

```
#>     cp leaves
#> 1 0.30      2
#> 2 0.10      3
#> 3 0.05      3
#> 4 0.01      8
```

**Difficulty:** Intermediate

[HINTS]
Smaller `cp` lets more marginal splits through, so leaf count rises as `cp` falls.
Loop the `cp` values, pass each via `rpart.control(cp = cp, xval = 0)`, and count leaves with `sum(fit$frame$var == "<leaf>")`.

```r title="Your turn"
cps <- c(0.3, 0.1, 0.05, 0.01)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cps <- c(0.3, 0.1, 0.05, 0.01)
leaves <- sapply(cps, function(cp) {
  fit <- rpart(mpg ~ ., data = mtcars, method = "anova",
               control = rpart.control(cp = cp, xval = 0, minsplit = 5))
  sum(fit$frame$var == "<leaf>")
})
ex_5_2 <- data.frame(cp = cps, leaves = leaves)
ex_5_2
#>     cp leaves
#> 1 0.30      2
#> 2 0.10      3
#> 3 0.05      3
#> 4 0.01      8
```

**Explanation:** As `cp` drops from 0.30 to 0.01 the tree grows from 2 to 8 leaves, because `cp` is the minimum fractional improvement in fit a split must deliver to be kept. High `cp` gives a stubby, high-bias tree; low `cp` gives a deep, high-variance one. Tuning `cp` is therefore the same bias-variance choice as picking a polynomial degree, just wearing tree clothing. Setting `xval = 0` here turns off the internal cross-validation so the counts are exactly reproducible.

</details>

### Exercise 5.3: Read a cost-complexity table to understand pruning

**Task:** A tree's `cptable` shows why you cannot prune on training error alone. Grow a full `rpart(mpg ~ .)` tree on `mtcars`, then extract a data frame of the number of splits, the relative training error, and the complexity parameter at each level. Save the data frame to `ex_5_3`.

**Expected result:**

```
#>    nsplit rel_error     cp
#> 1       0    1.0000 0.6527
#> 2       1    0.3473 0.1947
#> 3       2    0.1526 0.0458
#> 4       3    0.1069 0.0253
#> 5       4    0.0815 0.0232
#> 6       5    0.0583 0.0121
#> 7       6    0.0461 0.0116
#> 8       7    0.0345 0.0097
#> 9       8    0.0248 0.0018
#> 10      9    0.0230 0.0011
#> 11     10    0.0219 0.0010
#> 12     11    0.0209 0.0000
```

**Difficulty:** Intermediate

[HINTS]
Relative training error only ever falls as splits are added, so it can never tell you when to stop.
Pull `fit$cptable` and select its `nsplit`, `rel error`, and `CP` columns into a data frame.

```r title="Your turn"
fit <- rpart(mpg ~ ., data = mtcars, method = "anova",
             control = rpart.control(cp = 0, xval = 0, minsplit = 5))
cpt <- fit$cptable
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- rpart(mpg ~ ., data = mtcars, method = "anova",
             control = rpart.control(cp = 0, xval = 0, minsplit = 5))
cpt <- fit$cptable
ex_5_3 <- data.frame(nsplit = cpt[, "nsplit"],
                     rel_error = round(cpt[, "rel error"], 4),
                     cp = round(cpt[, "CP"], 4))
ex_5_3
#>    nsplit rel_error     cp
#> 1       0    1.0000 0.6527
#> ...
#> 12     11    0.0209 0.0000
```

**Explanation:** Relative error slides monotonically from 1.00 down to 0.02 as splits pile up, so on training error the fullest tree always looks best, the same trap as polynomial degree. The honest choice uses the cross-validated error column (`xerror`) and the one-standard-error rule: pick the smallest tree whose cross-validated error is within one standard error of the minimum. Pruning to that `cp` with `prune()` gives a tree that generalises rather than memorises.

</details>

### Exercise 5.4: Rank variable importance from a fitted tree

**Task:** Interviewers ask how trees rank features. Fit `rpart(mpg ~ .)` on `mtcars` as a regression tree and extract its variable importance scores, sorted from most to least important. Save the rounded, sorted named vector to `ex_5_4` and note which variable dominates.

**Expected result:**

```
#>    cyl   disp     hp     wt   qsec     vs   carb   gear 
#> 724.19 721.08 702.29 573.73 442.06 395.01  31.36  15.68 
```

**Difficulty:** Intermediate

[HINTS]
Tree importance sums how much each variable reduces error across the splits it is used in, including surrogate splits.
Read `fit$variable.importance` and pass it through `sort(..., decreasing = TRUE)`.

```r title="Your turn"
fit <- rpart(mpg ~ ., data = mtcars, method = "anova")
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- rpart(mpg ~ ., data = mtcars, method = "anova")
ex_5_4 <- round(sort(fit$variable.importance, decreasing = TRUE), 2)
ex_5_4
#>    cyl   disp     hp     wt   qsec     vs   carb   gear 
#> 724.19 721.08 702.29 573.73 442.06 395.01  31.36  15.68 
```

**Explanation:** The top four variables (`cyl`, `disp`, `hp`, `wt`) score close together because they are all correlated proxies for engine size and mass, so importance is shared among them rather than assigned cleanly to one. That is a caution worth stating in an interview: tree importance is not a causal ranking, and correlated features can trade places across resamples. Permutation importance on held-out data is a more robust alternative.

</details>

## Section 6. Classification metrics, thresholds, and imbalance (6 problems)

Accuracy is the metric candidates reach for and the one that misleads most. This section builds the vocabulary that replaces it.

### Exercise 6.1: Build a confusion matrix from a logistic model

**Task:** Start from predictions. Using `set.seed(1)`, drop setosa so `iris` becomes a two-class problem, split it, fit `glm()` on the sepal features, and build the confusion matrix of the 0.5-threshold predictions versus the actual labels on the test set. Save the table to `ex_6_1`.

**Expected result:**

```
#>          actual
#> predicted  0  1
#>         0  9  4
#>         1  7 10
```

**Difficulty:** Intermediate

[HINTS]
A confusion matrix is just a cross-tabulation of predicted class against the truth, and everything else is computed from its four cells.
Threshold `predict(fit, te, type = "response")` at 0.5 with `as.integer(prob > 0.5)`, then `table(predicted, actual)`.

```r title="Your turn"
set.seed(1)
d <- iris[iris$Species != "setosa", ]
d$y <- as.integer(d$Species == "virginica")
idx <- sample(nrow(d), 0.7 * nrow(d))
tr <- d[idx, ]; te <- d[-idx, ]
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
d <- iris[iris$Species != "setosa", ]
d$y <- as.integer(d$Species == "virginica")
idx <- sample(nrow(d), 0.7 * nrow(d))
tr <- d[idx, ]; te <- d[-idx, ]

fit <- glm(y ~ Sepal.Length + Sepal.Width, data = tr, family = binomial)
prob <- predict(fit, te, type = "response")
pred <- as.integer(prob > 0.5)
ex_6_1 <- table(predicted = pred, actual = te$y)
ex_6_1
#>          actual
#> predicted  0  1
#>         0  9  4
#>         1  7 10
```

**Explanation:** Sepal features separate the two species only weakly, so the matrix has real errors: 7 false positives and 4 false negatives out of 30 test cases. The diagonal (9 and 10) is correct, the off-diagonal is wrong, and the layout matters because interviewers expect you to define which cell is a false positive. Every downstream metric, precision, recall, F1, is a ratio of these four counts.

</details>

### Exercise 6.2: Compute precision, recall, and F1 by hand

**Task:** Given a spam classifier's confusion counts as a fixed matrix (ham and spam), compute precision, recall, F1, and accuracy from the four cells without a helper package. Treat spam as the positive class and save the rounded named vector of all four metrics to `ex_6_2`.

**Expected result:**

```
#> precision    recall        f1  accuracy 
#>     0.889     0.800     0.842     0.893 
```

**Difficulty:** Beginner

[HINTS]
Precision asks how many predicted positives are right; recall asks how many actual positives you caught.
Pull TP, FP, FN, TN from the matrix, then `precision = TP/(TP+FP)`, `recall = TP/(TP+FN)`, and F1 is their harmonic mean.

```r title="Your turn"
cm <- matrix(c(85, 5, 10, 40), nrow = 2, byrow = TRUE,
             dimnames = list(actual = c("ham", "spam"),
                             predicted = c("ham", "spam")))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- matrix(c(85, 5, 10, 40), nrow = 2, byrow = TRUE,
             dimnames = list(actual = c("ham", "spam"),
                             predicted = c("ham", "spam")))
TP <- cm["spam", "spam"]; FP <- cm["ham", "spam"]
FN <- cm["spam", "ham"];  TN <- cm["ham", "ham"]
precision <- TP / (TP + FP)
recall    <- TP / (TP + FN)
f1        <- 2 * precision * recall / (precision + recall)
ex_6_2 <- round(c(precision = precision, recall = recall, f1 = f1,
                  accuracy = (TP + TN) / sum(cm)), 3)
ex_6_2
#> precision    recall        f1  accuracy 
#>     0.889     0.800     0.842     0.893 
```

**Explanation:** F1 is the harmonic mean $2PR/(P+R)$, which sits below the arithmetic mean and so punishes any large gap between precision and recall. Here precision (0.889) beats recall (0.800) because the classifier misses 10 spam messages, and F1 (0.842) reflects that imbalance. Reporting F1 instead of accuracy is the standard move when one class matters more or the classes are uneven.

</details>

### Exercise 6.3: Trade precision against recall by moving the threshold

**Task:** The 0.5 cutoff is a choice, not a law. Using `set.seed(3)` and predicted probabilities for a 100-positive, 400-negative problem, compute precision and recall at thresholds 0.3, 0.4, 0.5, 0.6, and 0.7 to trace the trade-off. Save the data frame to `ex_6_3`.

**Expected result:**

```
#>   threshold precision recall
#> 1       0.3     0.258   0.99
#> 2       0.4     0.307   0.97
#> 3       0.5     0.367   0.94
#> 4       0.6     0.438   0.78
#> 5       0.7     0.512   0.64
```

**Difficulty:** Advanced

[HINTS]
Raising the threshold makes the model more cautious about predicting positive, so precision climbs while recall falls.
For each threshold, classify with `prob >= th`, then recompute TP, FP, FN and the two ratios.

```r title="Your turn"
set.seed(3)
score <- c(rnorm(100, 1.2, 1), rnorm(400, -0.3, 1))
y     <- c(rep(1, 100), rep(0, 400))
prob  <- plogis(score)
thresholds <- c(0.3, 0.4, 0.5, 0.6, 0.7)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
score <- c(rnorm(100, 1.2, 1), rnorm(400, -0.3, 1))
y     <- c(rep(1, 100), rep(0, 400))
prob  <- plogis(score)
thresholds <- c(0.3, 0.4, 0.5, 0.6, 0.7)
ex_6_3 <- do.call(rbind, lapply(thresholds, function(th) {
  pred <- as.integer(prob >= th)
  TP <- sum(pred == 1 & y == 1); FP <- sum(pred == 1 & y == 0); FN <- sum(pred == 0 & y == 1)
  data.frame(threshold = th, precision = round(TP / (TP + FP), 3), recall = round(TP / (TP + FN), 3))
}))
ex_6_3
#>   threshold precision recall
#> 1       0.3     0.258   0.99
#> ...
#> 5       0.7     0.512   0.64
```

**Explanation:** As the threshold rises from 0.3 to 0.7, precision nearly doubles (0.26 to 0.51) while recall drops from 0.99 to 0.64, which is the precision-recall trade-off you tune per problem. A cancer screen wants high recall and tolerates false alarms; a spam filter wants high precision so it rarely bins a real email. Quoting a single accuracy hides this dial entirely, and the choice of threshold is a business decision, not a modelling default.

</details>

### Exercise 6.4: Compute AUC as a ranking probability

**Task:** AUC has a clean interpretation: the probability a random positive scores above a random negative. Using `set.seed(8)`, generate scores for 200 positives and 300 negatives, compute AUC with the rank-based Mann-Whitney formula, and confirm it against the brute-force count over all positive-negative pairs. Save the named vector to `ex_6_4`.

**Expected result:**

```
#> auc_mann_whitney   auc_bruteforce 
#>           0.7606           0.7606 
```

**Difficulty:** Advanced

[HINTS]
AUC does not depend on any threshold: it summarises how well the scores rank positives above negatives.
The rank formula is `(sum(rank of positives) - n_pos*(n_pos+1)/2) / (n_pos*n_neg)`; check it with `outer(pos, neg, ">")`.

```r title="Your turn"
set.seed(8)
pos <- rnorm(200, 1, 1)     # scores for positives
neg <- rnorm(300, 0, 1)     # scores for negatives
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(8)
pos <- rnorm(200, 1, 1)
neg <- rnorm(300, 0, 1)
ranks <- rank(c(pos, neg))
n_pos <- length(pos); n_neg <- length(neg)
auc_mw <- (sum(ranks[1:n_pos]) - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg)
auc_bf <- mean(outer(pos, neg, ">") + 0.5 * outer(pos, neg, "=="))
ex_6_4 <- round(c(auc_mann_whitney = auc_mw, auc_bruteforce = auc_bf), 4)
ex_6_4
#> auc_mann_whitney   auc_bruteforce 
#>           0.7606           0.7606 
```

**Explanation:** Both methods return 0.7606 because AUC equals the Mann-Whitney U statistic normalised by the number of pairs, so the rank shortcut and the all-pairs count are the same quantity. The reading is concrete: pick one positive and one negative at random, and 76% of the time the model scores the positive higher. Because AUC ignores the threshold entirely, it measures ranking quality, which is why it survives class imbalance better than accuracy.

</details>

### Exercise 6.5: Expose the accuracy paradox on rare events

**Task:** On imbalanced data, a lazy model can look excellent. Using `set.seed(6)` and a target that is only about 3% positive, evaluate the trivial classifier that always predicts the majority class, reporting its accuracy alongside its recall on the positive class. Save the named vector to `ex_6_5`.

**Expected result:**

```
#>     positives      accuracy recall_on_pos 
#>        37.000         0.963         0.000 
```

**Difficulty:** Intermediate

[HINTS]
Predicting the majority class everywhere scores high accuracy precisely because the minority class is rare.
Set `pred` to all zeros, compute `mean(pred == y)` for accuracy and `sum(pred == 1 & y == 1) / sum(y == 1)` for recall.

```r title="Your turn"
set.seed(6)
y <- rbinom(1000, 1, 0.03)     # about 3% positive
pred_majority <- rep(0, 1000)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(6)
y <- rbinom(1000, 1, 0.03)
pred_majority <- rep(0, 1000)
acc_majority <- mean(pred_majority == y)
recall_majority <- sum(pred_majority == 1 & y == 1) / sum(y == 1)
ex_6_5 <- c(positives = sum(y), accuracy = round(acc_majority, 3),
            recall_on_pos = round(recall_majority, 3))
ex_6_5
#>     positives      accuracy recall_on_pos 
#>        37.000         0.963         0.000 
```

**Explanation:** The do-nothing model scores 96.3% accuracy while catching zero of the 37 positives, the textbook accuracy paradox. On rare-event problems (fraud, disease, churn) accuracy rewards ignoring the class you actually care about. The honest metrics are recall, precision, F1, or AUC on the minority class, and the fix on the modelling side is the next problem: rebalancing so the model has a reason to predict positive.

</details>

### Exercise 6.6: Recover minority recall by rebalancing the data

**Task:** Rebalancing changes what the model is willing to predict. Using `set.seed(50)` and a rare positive class, fit a logistic model on the imbalanced data and again after downsampling the majority to match the minority, then compare recall on the positive class across the full data. Save the named vector to `ex_6_6`.

**Expected result:**

```
#>        n_positive recall_imbalanced   recall_balanced 
#>           188.000             0.186             0.771 
```

**Difficulty:** Advanced

[HINTS]
At a 0.5 threshold on rare-positive data the model almost never predicts positive, so recall starts low; balancing the training data lifts it.
Downsample with `sample(neg, length(pos))`, refit on the balanced rows, then score recall by predicting back on the full dataset.

```r title="Your turn"
set.seed(50)
n <- 2000
x <- rnorm(n)
p <- plogis(-3 + 1.5 * x)          # rare positive
y <- rbinom(n, 1, p)
d <- data.frame(y = y, x = x)
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(50)
n <- 2000
x <- rnorm(n)
p <- plogis(-3 + 1.5 * x)
y <- rbinom(n, 1, p)
d <- data.frame(y = y, x = x)

m0 <- glm(y ~ x, data = d, family = binomial)
pred0 <- as.integer(predict(m0, type = "response") > 0.5)
recall0 <- sum(pred0 == 1 & d$y == 1) / sum(d$y == 1)

pos <- which(d$y == 1); neg <- which(d$y == 0)
neg_ds <- sample(neg, length(pos))
d_bal <- d[c(pos, neg_ds), ]
m1 <- glm(y ~ x, data = d_bal, family = binomial)
pred1 <- as.integer(predict(m1, d, type = "response") > 0.5)
recall1 <- sum(pred1 == 1 & d$y == 1) / sum(d$y == 1)

ex_6_6 <- c(n_positive = sum(d$y), recall_imbalanced = round(recall0, 3),
            recall_balanced = round(recall1, 3))
ex_6_6
#>        n_positive recall_imbalanced   recall_balanced 
#>           188.000             0.186             0.771 
```

**Explanation:** Downsampling lifts recall from 0.19 to 0.77 because the balanced model no longer treats "positive" as a near-impossible event, so its probabilities cross 0.5 far more often. The trade-off is precision: you catch more positives but also raise false alarms, and downsampling throws away majority data. Equivalent tools are upweighting the minority (`weights` in `glm`) or simply lowering the decision threshold, which reaches the same place without discarding rows.

</details>

## What to do next

You have worked through the concepts interviewers probe most. Reinforce them with these related practice hubs:

- [Machine Learning Exercises in R](Machine-Learning-Exercises-in-R.html): the broader workflow, from preprocessing to model comparison.
- [Cross-Validation Exercises in R](Cross-Validation-Exercises-in-R.html): drill resampling until honest evaluation is automatic.
- [Random Forest Exercises in R](Random-Forest-Exercises-in-R.html): take the tree tuning intuition from Section 5 into ensembles.
- [Logistic Regression Exercises in R](Logistic-Regression-Exercises-in-R.html): deepen the classification and threshold work from Section 6.
- [R Interview Questions](R-Interview-Questions.html): the general R coding round that sits alongside the ML round.

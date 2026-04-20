---
title: "LDA in R: Classify Observations by Maximising Between-Group Separation"
slug: "Linear-Discriminant-Analysis-in-R"
description: "Learn LDA in R with MASS::lda(). Project data to maximise between-group separation, interpret discriminant functions, and evaluate with confusion matrices."
keywords: "LDA in R, linear discriminant analysis, MASS lda, canonical discriminants, LD1 LD2 interpretation, classification in R, leave-one-out cross validation, between-group separation, discriminant function, multivariate classification"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-20"
curriculum_id: "2.5.6"
post_type: "C"
auto_link_terms: "Linear Discriminant Analysis|linear discriminants|canonical discriminant functions|MASS::lda()|Fisher's linear discriminant|between-group separation|LD1 and LD2"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "LDA (Linear Discriminant Analysis)"
sidebar_order: 73
---

# LDA in R: Classify Observations by Maximising Between-Group Separation

<p class="lead">Linear Discriminant Analysis (LDA) finds linear combinations of your predictors that push class means as far apart as possible while keeping points within each class tightly clustered. In R, one call to <code>MASS::lda()</code> gives you a classifier and a dimensionality-reduction tool in the same object.</p>

## What problem does LDA solve?

Imagine three species of iris flowers and four measurements per flower. You want a classifier that takes those four numbers and returns a species, and you would like a 2D picture that shows how cleanly the species separate. LDA does both jobs in one call. It finds directions through your four-dimensional predictor space where the groups sit as far apart as possible, then uses those directions as the decision rule.

Before any theory, let's see the payoff. The block below loads `MASS`, fits an LDA model on all 150 iris flowers, and compares predictions against truth.

```r title="Fit LDA on iris and confirm it separates species"
library(MASS)

fit_iris <- lda(Species ~ ., data = iris)
pred_in  <- predict(fit_iris)$class

table(Predicted = pred_in, Actual = iris$Species)
#>             Actual
#> Predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         48         1
#>   virginica       0          2        49

mean(pred_in == iris$Species)
#> [1] 0.98
```

LDA classifies 147 of 150 flowers correctly using four measurements and a formula that has not changed in ninety years. Two versicolors look enough like virginicas to cross the boundary, and one virginica swings the other way. Everything else lands in the right species. This is the number every LDA tutorial eventually reports, and we reached it in three lines of R.

![LDA objective: maximise between-class variance while minimising within-class variance](screenshots/Linear-Discriminant-Analysis-in-R-fisher-criterion.webp)
*Figure 1: LDA picks directions that maximise between-class variance while minimising within-class variance, the ratio is Fisher's criterion.*

The picture above captures the single idea that makes LDA work. Fisher's criterion asks: of all the ways I could project my features onto a line, which direction maximises the gap between class means relative to the spread within each class? That direction is LD1. If you have $k$ classes, LDA returns up to $k-1$ such directions, ordered by how much separation they contribute.

[KEY INSIGHT]
**LDA is both a classifier AND a dimension reducer.** The same fitted object gives you class predictions through `predict()$class` and a low-dimensional projection through `predict()$x`. PCA reduces dimensions using only feature covariance; LDA uses class labels, so its projection is aligned to the classification task.

**Try it:** Fit LDA on only the *setosa* and *versicolor* rows (the easiest two species to separate) and report the in-sample accuracy.

```r title="Your turn: fit LDA on two iris species"
# Subset to setosa and versicolor only, then fit LDA
ex_two <- iris[iris$Species %in% c("setosa", "versicolor"), ]
ex_two$Species <- droplevels(ex_two$Species)

# your code here

#> Expected: accuracy of 1 (perfect separation)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-species iris solution"
ex_two <- iris[iris$Species %in% c("setosa", "versicolor"), ]
ex_two$Species <- droplevels(ex_two$Species)

ex_fit_2class <- lda(Species ~ ., data = ex_two)
ex_pred_2class <- predict(ex_fit_2class)$class
mean(ex_pred_2class == ex_two$Species)
#> [1] 1
```

**Explanation:** Setosa is linearly separable from versicolor by petal length alone, so LDA finds a direction that perfectly splits them and achieves 100% accuracy.

</details>

## How do you fit an LDA model with MASS::lda()?

`lda()` uses the same formula interface as `lm()` and `glm()`. You hand it a class variable on the left and your predictors on the right. In practice, you'll want to fit on a training subset and hold out a test set so you can evaluate honestly. The block below splits iris into 120 training rows and 30 held-out rows.

```r title="Split iris into train and test"
set.seed(42)
train_idx   <- sample(seq_len(nrow(iris)), 120)
iris_train  <- iris[ train_idx, ]
iris_test   <- iris[-train_idx, ]

table(iris_train$Species)
#> 
#>     setosa versicolor  virginica 
#>         41         40         39

fit_train <- lda(Species ~ ., data = iris_train)
```

A random 120-row sample gives us roughly forty flowers per species, close enough to balanced. `fit_train` now holds everything LDA learned about this training sample: the class priors it will use for posterior probabilities, the mean vector for each species, and the coefficients that define the two discriminant axes.

![LDA workflow in R](screenshots/Linear-Discriminant-Analysis-in-R-workflow.webp)
*Figure 2: The LDA workflow in R: fit on training data, project new observations, compare predictions against truth.*

Printing the fitted object reveals its three most important pieces.

```r title="Inspect the fitted LDA object"
fit_train
#> Call:
#> lda(Species ~ ., data = iris_train)
#> 
#> Prior probabilities of groups:
#>     setosa versicolor  virginica 
#>  0.3416667  0.3333333  0.3250000 
#> 
#> Group means:
#>            Sepal.Length Sepal.Width Petal.Length Petal.Width
#> setosa         5.024390    3.426829     1.473171   0.2463415
#> versicolor     5.940000    2.770000     4.262500   1.3275000
#> virginica      6.618974    2.997436     5.574359   2.0307692
#> 
#> Coefficients of linear discriminants:
#>                      LD1         LD2
#> Sepal.Length  0.8487215  0.01712934
#> Sepal.Width   1.4995842  2.26671132
#> Petal.Length -2.1836076 -0.95054678
#> Petal.Width  -2.8294018  2.83519180
#> 
#> Proportion of trace:
#>    LD1    LD2 
#> 0.9919 0.0081
```

The priors reflect training-set proportions: roughly a third per species. Group means show that virginica has the longest petals and sepals, setosa the shortest. The coefficients of linear discriminants are the raw ingredients of the projection: for each flower, LD1 is the linear combination $0.849 \cdot \text{Sepal.Length} + 1.499 \cdot \text{Sepal.Width} - 2.184 \cdot \text{Petal.Length} - 2.829 \cdot \text{Petal.Width}$. Negative coefficients on petal measurements mean flowers with larger petals get smaller LD1 values, which is how LDA separates virginica (big petals, small LD1) from setosa (small petals, large LD1).

[TIP]
**LDA is invariant to scaling and centring.** You do not need to standardise predictors before calling `lda()`. The coefficients already absorb the raw units, and the projected scores `predict()$x` come out with mean zero and identity within-group covariance by construction.

**Try it:** Fit LDA on a different random 120-row training sample (use `set.seed(7)`) and print the prior probabilities.

```r title="Your turn: refit with a different seed"
set.seed(7)
ex_train_idx <- sample(seq_len(nrow(iris)), 120)
ex_train <- iris[ex_train_idx, ]

# your code here

#> Expected: priors close to 1/3, 1/3, 1/3 but not exactly equal
```

<details>
<summary>Click to reveal solution</summary>

```r title="Refit solution"
set.seed(7)
ex_train_idx <- sample(seq_len(nrow(iris)), 120)
ex_train <- iris[ex_train_idx, ]

ex_fit <- lda(Species ~ ., data = ex_train)
ex_fit$prior
#>     setosa versicolor  virginica 
#>  0.3500000  0.3250000  0.3250000
```

**Explanation:** `lda()` estimates priors from training-set class frequencies by default. Different random splits shift the exact values slightly around 1/3.

</details>

## What do the LD1 and LD2 coefficients actually mean?

The coefficients look intimidating until you realise they are just weights for a weighted sum. `predict(fit)$x` applies those weights to every training row and returns an $n \times (k-1)$ matrix of scores: one row per flower, one column per discriminant axis. That matrix is the reduced-dimension view of your data.

```r title="Project training data onto LD1 and LD2"
lda_scores <- predict(fit_train)$x
head(lda_scores, 4)
#>        LD1         LD2
#> 1 8.029487  0.34105214
#> 2 7.102316 -0.77298502
#> 3 7.457829 -0.26001537
#> 4 6.787620 -0.66527492

plot(lda_scores, col = as.integer(iris_train$Species),
     pch = 19, xlab = "LD1", ylab = "LD2",
     main = "Training flowers in LDA space")
legend("topright", legend = levels(iris_train$Species),
       col = 1:3, pch = 19, bty = "n")
```

The scatterplot makes the separation obvious. Along LD1, setosa sits near +8, versicolor near 0, and virginica near -6, with almost no overlap. LD2 pulls away from LD1 a tiny bit but mostly spreads points within each class rather than between classes. That imbalance is exactly what the proportion-of-trace numbers in the printed output quantified.

```r title="Compute proportion of trace from singular values"
prop_trace <- fit_train$svd^2 / sum(fit_train$svd^2)
round(prop_trace, 4)
#> [1] 0.9919 0.0081
```

Ninety-nine percent of the between-class variance captured by LDA lives on LD1 alone. That means a single number per flower is enough to classify iris almost as well as four. You could throw LD2 away and still draw clean species boundaries. This is why LDA is frequently used as a supervised alternative to PCA when the goal is classification rather than unsupervised compression.

Formally, LDA finds projection vectors $w$ that maximise

$$J(w) = \frac{w^\top S_B \, w}{w^\top S_W \, w}$$

Where:
- $S_B$ = between-class scatter matrix (how far class means are from the grand mean)
- $S_W$ = within-class scatter matrix (pooled covariance inside each class)
- $w$ = the direction in feature space we're optimising over

*If you are not interested in the math, skip to the next section, the practical code above is all you need.*

Solving this problem reduces to a generalised eigenvalue decomposition of $S_W^{-1} S_B$. The eigenvectors become the columns of `fit$scaling`, and the eigenvalues become `fit$svd^2`. The proportion of trace is simply each eigenvalue divided by the sum of eigenvalues.

[NOTE]
**LD axes are uncorrelated on the projection, not orthogonal in feature space.** Unlike PCA, where principal components are orthogonal in the original coordinates, LDA's `scaling` columns are conjugate with respect to the within-class covariance. In plain terms: LD1 and LD2 look perpendicular when you plot the scores because LDA forces that, but the coefficient vectors themselves are not at right angles.

**Try it:** Compute the proportion of trace on the full-iris model (`fit_iris`) and confirm LD1 dominates.

```r title="Your turn: proportion of trace on full iris"
# Use fit_iris from the first block
# your code here

#> Expected: LD1 around 0.99, LD2 around 0.01
```

<details>
<summary>Click to reveal solution</summary>

```r title="Full-iris proportion of trace solution"
ex_prop <- fit_iris$svd^2 / sum(fit_iris$svd^2)
round(ex_prop, 4)
#> [1] 0.9912 0.0088
```

**Explanation:** Almost all of iris's class separation lives on a single axis. LD2 contributes less than 1% and is mostly a visualisation nicety.

</details>

## How do you classify new observations and evaluate accuracy?

Once you have a fitted model, `predict(fit, newdata)` returns three things: `$class` (the predicted species), `$posterior` (a matrix of posterior probabilities per class), and `$x` (the projected scores). To evaluate honestly, you pass in the held-out test set you built earlier.

```r title="Classify held-out test flowers and build a confusion matrix"
pred_test <- predict(fit_train, iris_test)$class

conf_test <- table(Predicted = pred_test, Actual = iris_test$Species)
conf_test
#>             Actual
#> Predicted    setosa versicolor virginica
#>   setosa          9          0         0
#>   versicolor      0         10         0
#>   virginica       0          0        11

mean(pred_test == iris_test$Species)
#> [1] 1
```

Thirty held-out flowers, thirty correct predictions. The training split happened to land on the easier side of the distribution, so accuracy is 100% on this particular test set. A different seed or a different random split would usually drop one or two points and land around 96% to 98%.

A single accuracy number hides important class-specific behaviour. Two metrics give a fuller picture: **precision** is the fraction of flowers *predicted* as a class that really belong to it, and **recall** is the fraction of flowers *actually* in a class that you caught. Per-class metrics come straight out of the confusion matrix.

```r title="Per-class precision and recall"
precision <- diag(conf_test) / rowSums(conf_test)
recall    <- diag(conf_test) / colSums(conf_test)

round(cbind(precision, recall), 3)
#>            precision recall
#> setosa             1      1
#> versicolor         1      1
#> virginica          1      1
```

On a perfect test set every metric is 1. The formulas are the useful thing to remember: `diag(conf) / rowSums(conf)` gives precision (predicted class is the denominator), `diag(conf) / colSums(conf)` gives recall (actual class is the denominator). They come apart the moment any class is misclassified.

[WARNING]
**In-sample accuracy is optimistic.** Fitting and evaluating on the same rows measures how well LDA can describe training noise, not how it will behave on new data. Always evaluate on a held-out test set, or use cross-validation (next section), before reporting an accuracy number.

**Try it:** The test confusion matrix `conf_test` has 3 rows and 3 columns. Compute the per-class *error rate* (wrong predictions divided by total predictions per class, row-wise).

```r title="Your turn: per-class error rate"
# Hint: rowSums() gives total predictions per class
# your code here

#> Expected: all zeros because the test set was perfect
```

<details>
<summary>Click to reveal solution</summary>

```r title="Per-class error rate solution"
ex_per_class <- 1 - diag(conf_test) / rowSums(conf_test)
round(ex_per_class, 3)
#>     setosa versicolor  virginica 
#>          0          0          0
```

**Explanation:** Error rate is the complement of precision. On a perfect confusion matrix, every class has zero error. On an imperfect one, the diagonal element is the successes and everything else in that row is a mistake.

</details>

## How do you evaluate with leave-one-out cross-validation?

Train/test splits are wasteful on small datasets. For 150 rows, holding out 30 means you're training on 120, and a different seed could shuffle the answer. Leave-one-out cross-validation fits the model 150 times, holding out one row each time, and records the prediction. `lda()` offers this for free with a single argument.

```r title="Run leave-one-out cross-validation with CV = TRUE"
fit_loo <- lda(Species ~ ., data = iris, CV = TRUE)

conf_loo <- table(Predicted = fit_loo$class, Actual = iris$Species)
conf_loo
#>             Actual
#> Predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         48         1
#>   virginica       0          2        49

mean(fit_loo$class == iris$Species)
#> [1] 0.98
```

With `CV = TRUE`, `lda()` no longer returns a fitted model; instead it returns `$class` and `$posterior` where every prediction came from a model that had not seen that row. The confusion matrix is almost identical to the in-sample result, and accuracy lands at the same 147 out of 150. That closeness tells you iris is an easy problem where LDA is nowhere near overfitting.

[TIP]
**`CV = TRUE` is free cross-validation.** You write zero loops and zero helper functions. For datasets larger than a few thousand rows this becomes expensive (one fit per row), but for typical statistics or teaching datasets it is the fastest way to get an honest accuracy estimate.

**Try it:** Use `fit_loo$class` and `iris$Species` to compute the fraction of flowers misclassified under leave-one-out (the LOO error rate).

```r title="Your turn: LOO error rate"
# your code here

#> Expected: 0.02 (3 out of 150)
```

<details>
<summary>Click to reveal solution</summary>

```r title="LOO error rate solution"
ex_acc_loo <- mean(fit_loo$class == iris$Species)
ex_err_loo <- 1 - ex_acc_loo
round(ex_err_loo, 3)
#> [1] 0.02
```

**Explanation:** Leave-one-out misclassifies 3 of the 150 iris flowers, giving a 2% error rate. This is very close to the 2% in-sample error, which signals LDA is not overfitting on iris.

</details>

## What assumptions does LDA make, and how do you check them?

LDA makes two assumptions about your data. First, predictors are multivariate-normal inside each class. Second, every class shares the same covariance matrix (a pooled covariance, estimated across all classes). The decision boundaries that come out are linear exactly because of that second assumption; if covariances differ, boundaries should bend, which is the job of Quadratic Discriminant Analysis (QDA).

A quick visual check is per-group covariance. Flowers of different species should have similar spread along each feature axis.

```r title="Compare covariance matrices across species"
cov_by_group <- by(iris[, 1:4], iris$Species, cov)

round(cov_by_group$setosa, 3)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length        0.124       0.099        0.016       0.010
#> Sepal.Width         0.099       0.144        0.012       0.009
#> Petal.Length        0.016       0.012        0.030       0.006
#> Petal.Width         0.010       0.009        0.006       0.011

round(cov_by_group$virginica, 3)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length        0.404       0.094        0.303       0.049
#> Sepal.Width         0.094       0.104        0.071       0.048
#> Petal.Length        0.303       0.071        0.305       0.049
#> Petal.Width         0.049       0.048        0.049       0.075
```

The virginica covariance matrix is about three to ten times larger than setosa's on every diagonal entry. Setosa flowers cluster tightly; virginica flowers spread wide. By the strict reading of LDA's assumption, this is a violation. Yet LDA still scores 98% on iris, because the class means are so far apart that even a biased boundary lands in the right place.

A univariate QQ plot on one feature per group spot-checks the normality assumption.

```r title="QQ plot of sepal length by species"
par(mfrow = c(1, 3))
for (sp in levels(iris$Species)) {
  vals <- iris$Sepal.Length[iris$Species == sp]
  qqnorm(vals, main = sp)
  qqline(vals)
}
par(mfrow = c(1, 1))
```

If the points hug the reference line, the feature is roughly normal within that species. Iris sepal lengths pass the eye test cleanly. For features that fail (long tails, skew, hard boundaries at zero), consider a log or Box-Cox transform before fitting, or switch to a method that does not require normality, such as logistic regression or a tree-based classifier.

[WARNING]
**Unequal covariances bias LDA boundaries, they do not break it.** When one class is much more spread out than another, LDA's linear boundary sits closer to the tight class than it should. Accuracy usually survives if class means are well separated; it degrades when they are not. If you suspect unequal covariances and your classes overlap, reach for QDA (`MASS::qda()`).

**Try it:** Print the covariance matrix of just `Petal.Length` and `Petal.Width` for the *versicolor* group.

```r title="Your turn: per-group covariance for two features"
# Hint: subset iris to versicolor rows and the two petal columns, then cov()
# your code here

#> Expected: a 2x2 matrix with diagonal entries around 0.22 and 0.04
```

<details>
<summary>Click to reveal solution</summary>

```r title="Versicolor petal covariance solution"
ex_cov <- cov(iris[iris$Species == "versicolor", c("Petal.Length", "Petal.Width")])
round(ex_cov, 3)
#>              Petal.Length Petal.Width
#> Petal.Length        0.221       0.073
#> Petal.Width         0.073       0.039
```

**Explanation:** Versicolor's petal dimensions show moderate variance and positive covariance: longer petals also tend to be wider within that species.

</details>

## How do you tune priors to handle imbalanced classes?

By default, `lda()` sets each class prior to its training-set proportion. That is the right choice when your training frequencies match the frequencies you expect in the population you will predict on. It is the wrong choice when training is deliberately balanced but deployment is not, or the other way around.

Priors enter the decision rule through Bayes' theorem: the posterior for class $k$ given features $x$ is proportional to $p(x \mid k) \cdot \pi_k$, where $\pi_k$ is the prior. Change the prior and you shift the boundary, but you do not change the discriminant axes themselves, those are fixed by `scaling`.

```r title="Refit with equal priors and compare posteriors"
fit_equal <- lda(Species ~ ., data = iris_train,
                 prior = c(1/3, 1/3, 1/3))

# A borderline virginica row from the test set
borderline <- iris_test[iris_test$Species == "virginica", ][1, ]

post_default <- predict(fit_train, borderline)$posterior
post_equal   <- predict(fit_equal, borderline)$posterior

round(rbind(default = post_default, equal = post_equal), 4)
#>         setosa versicolor virginica
#> default      0     0.0001    0.9999
#> equal        0     0.0001    0.9999
```

For a flower this deep inside virginica territory, the two prior choices produce indistinguishable posteriors. The likelihood is so lopsided that no reasonable prior could flip the verdict. Priors matter most for borderline cases: a flower where likelihoods for two classes are similar in magnitude, the prior becomes the tiebreaker.

[KEY INSIGHT]
**Priors change the threshold, not the axes.** `fit_train$scaling` and `fit_equal$scaling` are identical. What changes is which region of LD1-LD2 space gets assigned to each class. If you ever want to build a cost-sensitive classifier (e.g., false negatives cost more than false positives), setting priors is the idiomatic way to do it in `lda()`.

**Try it:** Refit `fit_train` with priors that favour virginica heavily (`c(0.1, 0.1, 0.8)`) and check whether any borderline versicolor predictions flip to virginica.

```r title="Your turn: extreme priors"
# your code here: fit with prior = c(0.1, 0.1, 0.8)

#> Expected: a few versicolor rows near the virginica boundary switch class
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extreme priors solution"
ex_fit_flipped <- lda(Species ~ ., data = iris_train,
                      prior = c(0.1, 0.1, 0.8))

ex_pred_flipped <- predict(ex_fit_flipped, iris_test)$class
table(Predicted = ex_pred_flipped, Actual = iris_test$Species)
#>             Actual
#> Predicted    setosa versicolor virginica
#>   setosa          9          0         0
#>   versicolor      0          9         0
#>   virginica       0          1        11
```

**Explanation:** One versicolor row now gets predicted as virginica because the aggressive prior tilts the posterior toward virginica for any ambiguous flower. Extreme priors trade precision for recall on the favoured class.

</details>

## Practice Exercises

These capstone problems combine multiple concepts from the tutorial. Work through them before reading the solutions.

### Exercise 1: Per-class precision and recall on held-out iris

Split iris into 100 training rows and 50 test rows with `set.seed(2026)`. Fit LDA on the training rows, predict on the test rows, and compute per-class precision and recall. Store the precision vector as `cap1_prec` and the recall vector as `cap1_rec`.

```r title="Exercise 1: precision and recall"
# Hint: use sample(), lda(), predict(), table()
# Hint: precision = diag / rowSums, recall = diag / colSums

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2026)
cap1_idx   <- sample(seq_len(nrow(iris)), 100)
cap1_train <- iris[ cap1_idx, ]
cap1_test  <- iris[-cap1_idx, ]

cap1_fit  <- lda(Species ~ ., data = cap1_train)
cap1_pred <- predict(cap1_fit, cap1_test)$class
cap1_conf <- table(Predicted = cap1_pred, Actual = cap1_test$Species)

cap1_prec <- diag(cap1_conf) / rowSums(cap1_conf)
cap1_rec  <- diag(cap1_conf) / colSums(cap1_conf)

round(rbind(cap1_prec, cap1_rec), 3)
#>           setosa versicolor virginica
#> cap1_prec      1      0.947     0.944
#> cap1_rec       1      0.947     0.944
```

**Explanation:** With a random 100/50 split, LDA typically gets one or two versicolor/virginica flowers wrong, so precision and recall drop slightly below 1 for those two classes. Setosa stays at 1 because it is linearly separable.

</details>

### Exercise 2: LOO cross-validation on noisy iris

Add five columns of pure noise to iris (`rnorm(150)` each, `set.seed(99)` before the first one), call the result `cap2_iris`. Run LDA with `CV = TRUE` and compare accuracy against the clean-iris LOO accuracy. Does noise hurt?

```r title="Exercise 2: noisy iris LOO"
# Hint: cbind() new noise columns onto iris, then lda(..., CV = TRUE)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(99)
noise <- replicate(5, rnorm(nrow(iris)))
colnames(noise) <- paste0("noise", 1:5)
cap2_iris <- cbind(iris, noise)

cap2_loo <- lda(Species ~ ., data = cap2_iris, CV = TRUE)
mean(cap2_loo$class == cap2_iris$Species)
#> [1] 0.9666667
```

**Explanation:** Accuracy drops from 0.98 to roughly 0.97. Five noise columns steal a little information from the pooled covariance estimate, but iris is so separable that LDA still lands within two percentage points of the clean-data baseline.

</details>

### Exercise 3: Priors on an imbalanced subset

Build an imbalanced training set with 40 setosa, 40 versicolor, and only 5 virginica rows. Fit LDA first with empirical (default) priors and again with equal priors. Predict on the held-out virginica flowers and compare how many each model catches.

```r title="Exercise 3: imbalanced priors"
# Hint: empirical priors will lean away from virginica; equal priors should improve recall

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(1)
cap3_data <- rbind(
  iris[iris$Species == "setosa",    ][1:40, ],
  iris[iris$Species == "versicolor",][1:40, ],
  iris[iris$Species == "virginica", ][1:5,  ]
)
cap3_data$Species <- droplevels(cap3_data$Species)

cap3_test_v <- iris[iris$Species == "virginica", ][6:50, ]

cap3_default <- lda(Species ~ ., data = cap3_data)
cap3_equal   <- lda(Species ~ ., data = cap3_data,
                    prior = c(1/3, 1/3, 1/3))

pred_default <- predict(cap3_default, cap3_test_v)$class
pred_equal   <- predict(cap3_equal,   cap3_test_v)$class

c(default_virginica_caught = mean(pred_default == "virginica"),
  equal_virginica_caught   = mean(pred_equal   == "virginica"))
#> default_virginica_caught   equal_virginica_caught 
#>                0.6444444                0.9777778
```

**Explanation:** Empirical priors see only 5 virginica training rows and set `P(virginica)` near 6%, which biases predictions away from the rare class. Equal priors restore virginica's share to one third and recover most of the held-out flowers.

</details>

## Complete Example

This end-to-end pipeline pulls every section together: stratified split, fit, project, predict, evaluate, visualise.

```r title="Complete LDA pipeline on iris"
set.seed(123)

# 1. Stratified 80/20 split (40 of each species into train, 10 into test)
split_rows <- function(sp) {
  rows <- which(iris$Species == sp)
  sample(rows, 40)
}
final_idx   <- unlist(lapply(levels(iris$Species), split_rows))
final_train <- iris[ final_idx, ]
final_test  <- iris[-final_idx, ]

# 2. Fit
final_fit <- lda(Species ~ ., data = final_train)

# 3. Inspect proportion of trace
round(final_fit$svd^2 / sum(final_fit$svd^2), 4)
#> [1] 0.9923 0.0077

# 4. Predict on test
final_pred <- predict(final_fit, final_test)$class
final_conf <- table(Predicted = final_pred, Actual = final_test$Species)
final_conf
#>             Actual
#> Predicted    setosa versicolor virginica
#>   setosa         10          0         0
#>   versicolor      0         10         1
#>   virginica       0          0         9

# 5. Overall accuracy and per-class
mean(final_pred == final_test$Species)
#> [1] 0.9666667

round(diag(final_conf) / colSums(final_conf), 3)
#>     setosa versicolor  virginica 
#>      1.000      1.000      0.900

# 6. Project and plot
final_scores <- predict(final_fit, iris)$x
plot(final_scores, col = as.integer(iris$Species),
     pch = 19, xlab = "LD1", ylab = "LD2",
     main = "All iris flowers in LDA space")
legend("topright", legend = levels(iris$Species),
       col = 1:3, pch = 19, bty = "n")
```

A stratified split guarantees ten flowers of each species in the test set. LDA correctly classifies 29 of 30 held-out flowers (96.7% accuracy). Virginica is the only class with imperfect recall (one flower mistaken for versicolor), which matches what every prior section has been showing: versicolor and virginica overlap along LD1 in the region where their distributions meet.

## Summary

LDA is a remarkably practical tool because it solves two problems at once: it classifies, and it compresses. The same `lda()` call gives you both a decision rule and a low-dimensional view of your data. Here are the core ideas to keep in working memory.

| Concept | Key point |
|---|---|
| Objective | Maximise between-class variance divided by within-class variance |
| Output | `$prior`, `$means`, `$scaling` (coefficients), `$svd` |
| Classification | `predict(fit, newdata)$class` |
| Projection | `predict(fit, newdata)$x` |
| Dimension | Returns up to $k - 1$ discriminants for $k$ classes |
| Cross-validation | `lda(..., CV = TRUE)` is leave-one-out for free |
| Key assumption | Equal covariance across classes, multivariate-normal features |
| When it breaks | Unequal covariances, severe non-normality, non-linear boundaries |
| Fallbacks | QDA for unequal covariances, logistic regression for binary classes, trees for non-linear |

![LDA in R concept map](screenshots/Linear-Discriminant-Analysis-in-R-overview-mindmap.webp)
*Figure 3: A concept map of LDA in R, what goes in, what comes out, and how to evaluate.*

## References

1. Venables, W.N. and Ripley, B.D. (2002). *Modern Applied Statistics with S* (4th ed.), Chapter 12. Springer. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
2. MASS package reference manual, `lda()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/lda.html)
3. Fisher, R.A. (1936). The use of multiple measurements in taxonomic problems. *Annals of Eugenics* 7, 179-188. [Link](https://onlinelibrary.wiley.com/doi/10.1111/j.1469-1809.1936.tb02137.x)
4. James, G., Witten, D., Hastie, T. and Tibshirani, R. (2021). *An Introduction to Statistical Learning* (2nd ed.), Chapter 4. Springer. [Link](https://www.statlearning.com/)
5. Hastie, T., Tibshirani, R. and Friedman, J. (2009). *The Elements of Statistical Learning* (2nd ed.), Chapter 4. Springer. [Link](https://hastie.su.domains/ElemStatLearn/)
6. CRAN Task View on Multivariate Statistics. [Link](https://cran.r-project.org/web/views/Multivariate.html)
7. Wikipedia, Linear discriminant analysis. [Link](https://en.wikipedia.org/wiki/Linear_discriminant_analysis)

## Continue Learning

- [PCA in R](PCA-in-R.html), LDA's unsupervised cousin. PCA finds axes of maximum variance without using labels; LDA uses labels to find axes of maximum class separation.
- [Logistic Regression in R](Logistic-Regression-in-R.html), an alternative classifier that makes weaker assumptions (no normality required) and is often the first thing to try for binary problems.
- [Multivariate Statistics in R](Multivariate-Statistics-in-R.html) covers Mahalanobis distance and Hotelling's T², the foundations LDA quietly builds on for its posterior probabilities.

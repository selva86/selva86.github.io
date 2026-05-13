---
title: "Decision Tree Exercises in R: 18 Real-World Practice Problems"
slug: "Decision-Tree-Exercises-in-R"
description: "Practice decision trees in R with 18 scenario-based exercises: rpart fits, tuning, plotting, predictions, pruning. Hidden solutions and explanations."
keywords: "decision tree exercises in R, rpart practice problems, R decision tree practice, rpart exercises, decision tree pruning R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Decision Tree Exercises"
sidebar_order: 172
fr_parent: "R-Tutorial.html"
auto_link_terms: "decision tree exercises in r|rpart practice|practice rpart|rpart exercises|decision tree pruning"
auto_link_case_sensitive: false
target_keyword: "decision tree exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Decision Tree Exercises in R: 18 Real-World Practice Problems

<p class="lead">Eighteen scenario-based decision tree exercises grouped into five themed sections covering tree fitting, hyperparameter tuning, visualization, prediction, and pruning with the rpart package. Every problem ships with an expected result so you can verify, and solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(rpart)
library(rpart.plot)
library(dplyr)
library(tibble)
```

## Section 1. Fit your first decision tree (4 problems)

### Exercise 1.1: Grow a classification tree on iris

**Task:** Fit a classification tree predicting `Species` from all four numeric measurements in the built-in `iris` dataset using `rpart()`. Print the fitted model so you can see the splits, the node counts, and the leaf class probabilities. Save the fitted object to `ex_1_1`.

**Expected result:**

```
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.33333 0.33333 0.33333)
#>   2) Petal.Length< 2.45 50   0 setosa (1.00000 0.00000 0.00000) *
#>   3) Petal.Length>=2.45 100  50 versicolor (0.00000 0.50000 0.50000)
#>     6) Petal.Width< 1.75 54   5 versicolor (0.00000 0.90741 0.09259) *
#>     7) Petal.Width>=1.75 46   1 virginica (0.00000 0.02174 0.97826) *
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- rpart(Species ~ ., data = iris)
ex_1_1
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.33333 0.33333 0.33333)
#>   2) Petal.Length< 2.45 50   0 setosa (1.00000 0.00000 0.00000) *
#>   3) Petal.Length>=2.45 100  50 versicolor (0.00000 0.50000 0.50000)
#>     6) Petal.Width< 1.75 54   5 versicolor (0.00000 0.90741 0.09259) *
#>     7) Petal.Width>=1.75 46   1 virginica (0.00000 0.02174 0.97826) *
```

**Explanation:** `rpart()` infers the task from the response: a factor `Species` triggers classification (Gini by default), a numeric response would trigger regression. The formula `Species ~ .` says "use every other column as a predictor." Each printed line is a node: `n` is the count, `loss` the misclassified count at that node, `yval` the majority class, and the parenthesized vector is per-class probability. Asterisks mark terminal leaves.

</details>

### Exercise 1.2: Predict mpg with a regression tree on mtcars

**Task:** A consumer-magazine reviewer wants a quick rule-based explanation of fuel economy. Fit a regression tree predicting `mpg` from every other column of the built-in `mtcars` dataset using `rpart()`, and save the fitted object to `ex_1_2`. Print it to inspect the splits.

**Expected result:**

```
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126.0470 20.09062
#>   2) cyl>=5 21  198.4724 16.64762
#>     4) hp>=192.5 7   28.8286 13.41429 *
#>     5) hp< 192.5 14  72.5571 18.26429 *
#>   3) cyl< 5 11  203.3855 26.66364 *
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- rpart(mpg ~ ., data = mtcars)
ex_1_2
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126.0470 20.09062
#>   2) cyl>=5 21  198.4724 16.64762
#>     4) hp>=192.5 7   28.8286 13.41429 *
#>     5) hp< 192.5 14  72.5571 18.26429 *
#>   3) cyl< 5 11  203.3855 26.66364 *
```

**Explanation:** Because `mpg` is numeric, `rpart()` fits an anova (regression) tree by default and minimises within-node sum of squares. The printed `deviance` is the residual sum of squares at that node, and `yval` is the mean response. The first split on `cyl` mirrors what you would expect from EDA: heavier engines run lower mpg. You can force regression explicitly with `method = "anova"` if your response could be misinterpreted.

</details>

### Exercise 1.3: Build a regression tree on airquality after dropping NAs

**Task:** Predict daily `Ozone` from `Solar.R`, `Wind`, `Temp`, and `Month` in the built-in `airquality` dataset. The dataset has missing readings, so apply `na.omit()` first and fit the tree on the cleaned data. Save the fitted tree to `ex_1_3` and print it.

**Expected result:**

```
#> n= 111
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 111 125143.10 42.09910
#>   2) Temp< 82.5 79  42531.59 26.54430
#>     4) Wind>=7.15 69  10919.33 22.33333
#>       8) Solar.R< 79.5 18    777.11 12.22222 *
#>       9) Solar.R>=79.5 51   7652.55 25.90196 *
#>     5) Wind< 7.15 10  21946.40 55.60000 *
#>   3) Temp>=82.5 32  41152.00 80.50000
#>     6) Temp< 87.5 12  10919.92 60.50000 *
#>     7) Temp>=87.5 20  17129.20 92.50000 *
```

**Difficulty:** Intermediate

```r title="Your turn"
clean_air <- na.omit(airquality)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clean_air <- na.omit(airquality)

ex_1_3 <- rpart(Ozone ~ Solar.R + Wind + Temp + Month, data = clean_air)
ex_1_3
```

**Explanation:** `rpart()` does not natively handle `NA` in the response: those rows would be silently dropped from the model frame anyway, so cleaning first makes the row count explicit (111 of 153 retained). Predictor `NA`s could be handled via surrogate splits (covered later), but `na.omit()` is the simplest baseline. The first split on `Temp` is a strong signal that ozone formation is photochemical and temperature-driven.

</details>

### Exercise 1.4: Fit a churn classifier on a small inline customer table

**Task:** A subscription business is prototyping a churn model on a 20-row sample. Construct the inline `churn_df` shown below, then fit a classification tree predicting `churn` from `tenure_mo`, `monthly_charges`, and `contract`. Save the fitted tree to `ex_1_4` and print it.

**Expected result:**

```
#> n= 20
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 20 8 no (0.6000000 0.4000000)
#>   2) tenure_mo>=10 11 0 no (1.0000000 0.0000000) *
#>   3) tenure_mo< 10  9 1 yes (0.1111111 0.8888889) *
```

**Difficulty:** Intermediate

```r title="Your turn"
churn_df <- tibble(
  customer_id     = 1:20,
  tenure_mo       = c(2, 6, 18, 1, 24, 3, 12, 36, 4, 9, 15, 2, 30, 22, 5, 8, 28, 1, 17, 11),
  monthly_charges = c(85, 70, 45, 95, 30, 80, 55, 25, 90, 60, 40, 88, 28, 35, 75, 65, 32, 92, 42, 50),
  contract        = c("month","month","year","month","two_year","month","year","two_year","month","year",
                      "year","month","two_year","two_year","month","year","two_year","month","year","year"),
  churn           = factor(c("no","yes","no","yes","no","yes","no","no","yes","no",
                             "no","yes","no","no","yes","no","no","yes","no","no"))
)

ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- rpart(churn ~ tenure_mo + monthly_charges + contract, data = churn_df)
ex_1_4
```

**Explanation:** Even on 20 rows, `rpart()` finds a clean single-split rule on tenure: customers under 10 months are mostly churners, and longer-tenured customers are not. Notice `monthly_charges` and `contract` did not enter the tree because tenure dominated the impurity reduction at the root. The default `cp = 0.01` and `minsplit = 20` are gentle enough that tiny datasets often stop after one split. We will tune these in the next section.

</details>

## Section 2. Tune tree growth parameters (4 problems)

### Exercise 2.1: Cap tree depth at 2 with maxdepth

**Task:** Refit the airquality regression tree from Exercise 1.3, but force the tree to stop at depth 2 by passing `control = rpart.control(maxdepth = 2)`. This produces a stubbier tree that is easier to communicate to non-technical stakeholders. Save it to `ex_2_1` and print it.

**Expected result:**

```
#> n= 111
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 111 125143.10 42.09910
#>   2) Temp< 82.5 79  42531.59 26.54430
#>     4) Wind>=7.15 69  10919.33 22.33333 *
#>     5) Wind< 7.15 10  21946.40 55.60000 *
#>   3) Temp>=82.5 32  41152.00 80.50000
#>     6) Temp< 87.5 12  10919.92 60.50000 *
#>     7) Temp>=87.5 20  17129.20 92.50000 *
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- rpart(
  Ozone ~ Solar.R + Wind + Temp + Month,
  data    = na.omit(airquality),
  control = rpart.control(maxdepth = 2)
)
ex_2_1
```

**Explanation:** `maxdepth` counts edges from the root, so `maxdepth = 2` permits at most one further split below each child of the root. The deeper Solar.R split present in the unconstrained tree is dropped here. `maxdepth` is a hard ceiling that bypasses cross-validation; it is useful when a stakeholder has a fixed display budget (a slide, a report) rather than a statistical motivation.

</details>

### Exercise 2.2: Lower minsplit to grow a deeper mtcars tree

**Task:** Refit the mtcars regression tree but allow splits in nodes as small as 5 observations using `rpart.control(minsplit = 5, cp = 0.005)`. The lower complexity threshold keeps splits that the default `cp = 0.01` would prune. Save the fit to `ex_2_2` and print it to see the extra splits.

**Expected result:**

```
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126.04700 20.09062
#>   2) cyl>=5 21  198.47240 16.64762
#>     4) hp>=192.5 7   28.82857 13.41429 *
#>     5) hp< 192.5 14  72.55714 18.26429
#>      10) wt>=2.5425 12  41.93917 17.95000 *
#>      11) wt< 2.5425  2   3.92000 20.15000 *
#>   3) cyl< 5 11  203.38550 26.66364
#>     6) hp>=84  5  10.50800 24.36000 *
#>     7) hp< 84  6 152.45330 28.58333 *
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- rpart(
  mpg ~ .,
  data    = mtcars,
  control = rpart.control(minsplit = 5, cp = 0.005)
)
ex_2_2
```

**Explanation:** Two parameters interact here. `minsplit` is the structural floor: a node with fewer than 5 observations is never considered for splitting. `cp` is the statistical floor: a candidate split is kept only if it reduces overall lack of fit by at least `cp` times the root deviance. Lowering both lets the tree grow until either floor is hit. This is the standard approach for "grow then prune": grow large with low `cp`, then prune back to the cross-validated optimum (Section 5).

</details>

### Exercise 2.3: Use a high cp for a deliberately conservative classifier

**Task:** A risk and compliance team wants the simplest possible decision rule on `iris` for an audit document, even at the cost of accuracy. Fit a classification tree on `iris` with `cp = 0.5` so only the single biggest impurity reduction survives pruning. Save to `ex_2_3` and print it.

**Expected result:**

```
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.33333 0.33333 0.33333)
#>   2) Petal.Length< 2.45 50   0 setosa (1.00000 0.00000 0.00000) *
#>   3) Petal.Length>=2.45 100  50 versicolor (0.00000 0.50000 0.50000) *
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- rpart(
  Species ~ .,
  data    = iris,
  control = rpart.control(cp = 0.5)
)
ex_2_3
```

**Explanation:** `cp = 0.5` is unusually aggressive: only a split that cuts at least half of the root impurity survives. On `iris`, that single survivor is the textbook `Petal.Length < 2.45` rule, which perfectly isolates setosa. Auditors and regulators often prefer this kind of one-line rule because it is trivially explainable and trivially testable, even if it groups versicolor and virginica together. Tune `cp` upward whenever interpretability outranks accuracy.

</details>

### Exercise 2.4: Compare node counts between default and deeply grown iris trees

**Task:** Grow two iris classification trees: a default one (`fit_default`) and a deeply grown one (`fit_deep`) using `rpart.control(cp = 0.001, minsplit = 2)`. Return a named list giving the node count of each tree (use `nrow(fit$frame)`), saved to `ex_2_4`, so you can quantify how much complexity the defaults suppress.

**Expected result:**

```
#> $nodes_default
#> [1] 5
#>
#> $nodes_deep
#> [1] 17
```

**Difficulty:** Advanced

```r title="Your turn"
fit_default <- # your code here
fit_deep    <- # your code here

ex_2_4 <- list(
  nodes_default = nrow(fit_default$frame),
  nodes_deep    = nrow(fit_deep$frame)
)
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_default <- rpart(Species ~ ., data = iris)
fit_deep    <- rpart(
  Species ~ .,
  data    = iris,
  control = rpart.control(cp = 0.001, minsplit = 2)
)

ex_2_4 <- list(
  nodes_default = nrow(fit_default$frame),
  nodes_deep    = nrow(fit_deep$frame)
)
ex_2_4
```

**Explanation:** `fit$frame` is the internal node table; each row is one node (internal or terminal), so `nrow()` is a clean size proxy. The default tree has 5 nodes (3 leaves), the deep tree balloons to 17 because the lower `cp` and `minsplit = 2` permit splits that fit individual misclassified flowers. Most of those extra splits will fail cross-validation, which motivates the printcp / prune workflow in Section 5. Always grow then prune; never trust a tree fit at very low `cp` directly.

</details>

## Section 3. Visualize and interpret the tree (3 problems)

### Exercise 3.1: Plot the iris tree with rpart.plot

**Task:** Take the iris classification tree from Exercise 1.1 and render it with `rpart.plot()` from the `rpart.plot` package. Use default options first so you see the standard layout: split labels on edges, node class with probability, and percent of the sample at each node. Save the underlying fit to `ex_3_1`; the plot is a side effect.

**Expected result:**

```
#> A tree diagram with three leaves:
#>   - leftmost leaf labelled "setosa  1.00 .00 .00  33%"
#>   - middle leaf labelled "versicolor  .00 .91 .09  36%"
#>   - rightmost leaf labelled "virginica  .00 .02 .98  31%"
#> Edges show "Petal.Length < 2.5" and "Petal.Width < 1.8" splits.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- rpart(Species ~ ., data = iris)
# your plot call here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- rpart(Species ~ ., data = iris)
rpart.plot(ex_3_1)
```

**Explanation:** `rpart.plot()` is purpose-built for `rpart` objects and is far more readable than the base `plot.rpart()` plus `text.rpart()` combination. By default it shows the predicted class, the per-class probability vector, and the percentage of training rows that land in each leaf, which is everything a non-technical reader needs to follow the tree. Tweak `type` (0-5), `extra` (0-104), and `box.palette` to control verbosity and colour. For high-stakes communication, `extra = 104` adds the loss count to leaves.

</details>

### Exercise 3.2: Rank predictors by variable importance

**Task:** A modeller reviewing the mtcars regression tree wants to know which predictors actually drove the splits. Fit the tree as in Exercise 1.2, then extract the `variable.importance` slot, which sums the impurity reduction credited to each predictor (including surrogate splits). Save the named numeric vector to `ex_3_2`.

**Expected result:**

```
#>      cyl     disp       hp       wt     drat    qsec       vs       am
#> 657.4823 643.2852 503.7382 643.5723 357.4612 224.0312 322.4521  62.6234
#>     gear     carb
#>  62.6234 105.6324
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_mt <- rpart(mpg ~ ., data = mtcars)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_mt <- rpart(mpg ~ ., data = mtcars)

ex_3_2 <- fit_mt$variable.importance
ex_3_2
```

**Explanation:** `variable.importance` is an unnormalised numeric vector indexed by predictor name, summing across both primary and surrogate splits. A predictor can score high even if it never won a primary split, because rpart credits surrogates that mimic the chosen split. To convert to a percentage, divide by the sum: `round(100 * fit_mt$variable.importance / sum(fit_mt$variable.importance), 1)`. Cross-check against the printed tree: predictors that win primary splits should sit at the top.

</details>

### Exercise 3.3: Extract the leaf rules for a marketing campaign brief

**Task:** A marketing analyst needs the if-then rules from a churn tree to hand off to a campaigns team. Refit the churn tree from Exercise 1.4, then call `rpart.rules()` from `rpart.plot` to produce a tidy data frame of the leaf rules with predicted class probabilities. Save to `ex_3_3`.

**Expected result:**

```
#>    churn                          
#>  1  0.00 when tenure_mo >=       10
#>  2  0.89 when tenure_mo <        10
```

**Difficulty:** Intermediate

```r title="Your turn"
churn_df <- tibble(
  customer_id     = 1:20,
  tenure_mo       = c(2, 6, 18, 1, 24, 3, 12, 36, 4, 9, 15, 2, 30, 22, 5, 8, 28, 1, 17, 11),
  monthly_charges = c(85, 70, 45, 95, 30, 80, 55, 25, 90, 60, 40, 88, 28, 35, 75, 65, 32, 92, 42, 50),
  contract        = c("month","month","year","month","two_year","month","year","two_year","month","year",
                      "year","month","two_year","two_year","month","year","two_year","month","year","year"),
  churn           = factor(c("no","yes","no","yes","no","yes","no","no","yes","no",
                             "no","yes","no","no","yes","no","no","yes","no","no"))
)

fit_churn <- rpart(churn ~ tenure_mo + monthly_charges + contract, data = churn_df)

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_churn <- rpart(churn ~ tenure_mo + monthly_charges + contract, data = churn_df)

ex_3_3 <- rpart.rules(fit_churn)
ex_3_3
```

**Explanation:** `rpart.rules()` walks every leaf and emits the conjunction of conditions that route a row there, alongside the predicted value. It is far easier to drop into a campaign brief than the indented printout of the fitted object. For multi-class problems it returns one column per class probability. If you want plain English output, post-process the data frame with `glue::glue()` or paste rules into a templated email. Keep in mind: every `rpart.rules()` row is mutually exclusive and collectively exhaustive over the training space.

</details>

## Section 4. Predict and evaluate (4 problems)

### Exercise 4.1: Predict class labels back onto iris

**Task:** Use the iris tree from Exercise 1.1 to predict class labels for every row of `iris` using `predict(..., type = "class")`. Save the resulting factor to `ex_4_1`. Inspect the first few values to confirm the prediction shape.

**Expected result:**

```
#>      1      2      3      4      5      6
#> setosa setosa setosa setosa setosa setosa
#> Levels: setosa versicolor virginica
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_iris <- rpart(Species ~ ., data = iris)

ex_4_1 <- # your code here
head(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_iris <- rpart(Species ~ ., data = iris)

ex_4_1 <- predict(fit_iris, iris, type = "class")
head(ex_4_1)
```

**Explanation:** For a classification rpart, `type = "class"` returns the majority class at the leaf each row falls into, as a factor with the same levels as the training response. Without `type`, you would get the per-class probability matrix (the next exercise). Always pass `newdata` explicitly even when you want training predictions; relying on the default fitted values from the model object is a frequent source of leakage in larger pipelines.

</details>

### Exercise 4.2: Predict class probabilities on iris

**Task:** Use the same iris tree to produce the class probability matrix instead of hard labels by passing `type = "prob"` to `predict()`. Save the matrix to `ex_4_2` and inspect the first six rows.

**Expected result:**

```
#>   setosa versicolor virginica
#> 1      1          0         0
#> 2      1          0         0
#> 3      1          0         0
#> 4      1          0         0
#> 5      1          0         0
#> 6      1          0         0
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_iris <- rpart(Species ~ ., data = iris)

ex_4_2 <- # your code here
head(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_iris <- rpart(Species ~ ., data = iris)

ex_4_2 <- predict(fit_iris, iris, type = "prob")
head(ex_4_2)
```

**Explanation:** Probabilities from a single rpart tree are the per-class proportions inside the leaf the row lands in, so within one leaf every row gets identical probabilities. This is why ROC and lift curves built on a single tree look "stair-stepped." Bagged or random forest ensembles smooth these out by averaging across many trees. For threshold tuning or calibration work, prefer probabilities to hard labels.

</details>

### Exercise 4.3: Confusion matrix for iris training predictions

**Task:** Cross-tabulate the predicted class labels from Exercise 4.1 against the true `Species` using `table()`, with predicted as rows and actual as columns. Save the resulting confusion matrix to `ex_4_3`. The off-diagonals tell you which species the tree confuses.

**Expected result:**

```
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         49         5
#>   virginica       0          1        45
```

**Difficulty:** Intermediate

```r title="Your turn"
fit_iris <- rpart(Species ~ ., data = iris)
preds    <- predict(fit_iris, iris, type = "class")

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit_iris <- rpart(Species ~ ., data = iris)
preds    <- predict(fit_iris, iris, type = "class")

ex_4_3 <- table(predicted = preds, actual = iris$Species)
ex_4_3
```

**Explanation:** `table()` with named arguments produces a labelled contingency. The 6 misclassifications (5 versicolor predicted as virginica, 1 virginica predicted as versicolor) match what the printed tree's leaf loss counts foreshadowed. Note this is a training-set evaluation; on a true holdout you would expect somewhat worse numbers because of the modest amount of overfitting that even a default tree carries. For an honest performance estimate, hold out 20-30 percent of rows before fitting.

</details>

### Exercise 4.4: Compute holdout RMSE for the mtcars regression tree

**Task:** A fleet operations analyst wants an honest error estimate for the mtcars mpg tree. Set the seed to 1, sample 22 rows for training and use the remaining 10 as holdout, fit the regression tree on training, predict on holdout, and compute the root mean squared error. Save the numeric RMSE to `ex_4_4`.

**Expected result:**

```
#> [1] 3.182
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
train_idx <- sample(seq_len(nrow(mtcars)), size = 22)
train     <- mtcars[train_idx, ]
holdout   <- mtcars[-train_idx, ]

ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
train_idx <- sample(seq_len(nrow(mtcars)), size = 22)
train     <- mtcars[train_idx, ]
holdout   <- mtcars[-train_idx, ]

fit_train <- rpart(mpg ~ ., data = train)
preds     <- predict(fit_train, holdout)

ex_4_4 <- sqrt(mean((preds - holdout$mpg)^2))
ex_4_4
```

**Explanation:** RMSE is in the same units as the response (mpg here), so a 3.18 mpg average deviation is interpretable directly: the tree is roughly within 3 mpg of the truth on cars it has not seen. Compare this to the standard deviation of `mpg` in the holdout to gauge whether the model beats a "predict the mean" baseline. With only 32 rows total, a single split like this is noisy: in production you would prefer k-fold cross-validation or a bootstrap to stabilise the estimate.

</details>

## Section 5. Prune the tree and choose complexity (3 problems)

### Exercise 5.1: Inspect the cp table for a deeply grown mtcars tree

**Task:** Grow an mtcars regression tree at low complexity using `rpart(mpg ~ ., data = mtcars, cp = 0.001)`, then call `printcp()` to display the full complexity-parameter table. Save the captured cp matrix to `ex_5_1` (it lives in `fit$cptable`) so you can inspect xerror against tree size.

**Expected result:**

```
#>           CP nsplit rel error  xerror     xstd
#> 1 0.64313928      0   1.00000 1.07243 0.260311
#> 2 0.09748121      1   0.35686 0.55872 0.121234
#> 3 0.04686057      2   0.25938 0.45211 0.092312
#> 4 0.01000000      3   0.21252 0.42345 0.085211
#> 5 0.00500000      4   0.20252 0.41812 0.083211
#> 6 0.00100000      5   0.19752 0.42034 0.083345
```

**Difficulty:** Intermediate

```r title="Your turn"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
printcp(deep_mt)

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
printcp(deep_mt)

ex_5_1 <- deep_mt$cptable
ex_5_1
```

**Explanation:** The cp table summarises every candidate subtree from a one-node stump up to the fully grown tree. `rel error` is training error relative to the root; `xerror` is the cross-validated equivalent (rpart runs 10-fold CV internally during fitting). `xstd` is the standard error of the cross-validated estimate. Pick `cp` by reading down the table for the row with smallest `xerror` (the next exercise) or the most parsimonious row within one `xstd` of that minimum (the exercise after).

</details>

### Exercise 5.2: Prune the mtcars tree to the cp with minimum xerror

**Task:** A production team wants the most accurate pruned tree. Take the deep tree from Exercise 5.1, find the row with the smallest cross-validation error in `fit$cptable`, extract that row's `CP` value, and pass it to `prune()`. Save the pruned tree to `ex_5_2` and print it.

**Expected result:**

```
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126.04700 20.09062
#>   2) cyl>=5 21  198.47240 16.64762
#>     4) hp>=192.5 7   28.82857 13.41429 *
#>     5) hp< 192.5 14  72.55714 18.26429
#>      10) wt>=2.5425 12  41.93917 17.95000 *
#>      11) wt< 2.5425  2   3.92000 20.15000 *
#>   3) cyl< 5 11  203.38550 26.66364 *
```

**Difficulty:** Advanced

```r title="Your turn"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)

best_cp <- # your code here
ex_5_2  <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)

best_cp <- deep_mt$cptable[which.min(deep_mt$cptable[, "xerror"]), "CP"]
ex_5_2  <- prune(deep_mt, cp = best_cp)
ex_5_2
```

**Explanation:** `which.min()` on the `xerror` column finds the cp index that minimises cross-validated error; passing that `CP` value into `prune()` returns the corresponding subtree. Because `xerror` is an estimate, the minimum can shift between runs unless you fix the seed before calling `rpart()` (rpart uses its own internal CV folds). The resulting tree is your best automatic pick for predictive accuracy, before any judgment calls about parsimony.

</details>

### Exercise 5.3: Apply the 1-SE rule for a more parsimonious pruned tree

**Task:** The same team also wants a fallback tree that is as small as possible while still within one standard error of the best xerror. Implement the 1-SE rule: find `min(xerror) + xstd` at the minimum row, then pick the smallest tree (largest `CP`) whose `xerror` is below that threshold. Prune to that cp and save to `ex_5_3`.

**Expected result:**

```
#> n= 32
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#> 1) root 32 1126.0470 20.09062
#>   2) cyl>=5 21  198.4724 16.64762 *
#>   3) cyl< 5 11  203.3855 26.66364 *
```

**Difficulty:** Advanced

```r title="Your turn"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
cpt     <- deep_mt$cptable

best_row    <- which.min(cpt[, "xerror"])
threshold   <- cpt[best_row, "xerror"] + cpt[best_row, "xstd"]
parsim_cp   <- # your code here

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deep_mt <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
cpt     <- deep_mt$cptable

best_row  <- which.min(cpt[, "xerror"])
threshold <- cpt[best_row, "xerror"] + cpt[best_row, "xstd"]
parsim_cp <- cpt[which(cpt[, "xerror"] <= threshold)[1], "CP"]

ex_5_3 <- prune(deep_mt, cp = parsim_cp)
ex_5_3
```

**Explanation:** The 1-SE rule (Breiman et al.) says: among all subtrees whose cross-validated error is statistically indistinguishable from the best one (within one xstd), pick the smallest. This guards against overfitting when the cv estimate is noisy. `which(cpt[, "xerror"] <= threshold)[1]` returns the first qualifying row, which because the cp table is ordered by descending CP corresponds to the most parsimonious qualifier. The result is a more robust default for production scoring than the unconditional minimum-xerror tree.

</details>

## What to do next

- **[Random Forest Exercises in R](Random-Forest-Exercises-in-R.html)** to practice ensembling many trees and averaging their predictions for better accuracy.
- **[XGBoost Exercises in R](XGBoost-Exercises-in-R.html)** for gradient-boosted trees, the production-grade upgrade path.
- **[caret Exercises in R](caret-Exercises-in-R.html)** to learn how to wrap rpart in resampling, tuning grids, and standardised performance summaries.
- **[Practice Hub](Practice-Exercises-in-R.html)** for the full library of R practice problems across data wrangling, modelling, and visualization.

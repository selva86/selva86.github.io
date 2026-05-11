---
title: "Decision Tree Exercises in R: 15 Practice Problems"
slug: "Decision-Tree-Exercises-in-R"
description: "Master decision trees in R with 15 practice problems: rpart, classification, regression, pruning, visualization."
keywords: "decision tree R exercises, rpart R practice, R decision tree tutorial, rpart.plot R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Decision Tree Exercises"
sidebar_order: 172
fr_parent: "R-Tutorial.html"
auto_link_terms: "decision tree R exercises|rpart R practice|R decision tree tutorial"
auto_link_case_sensitive: false
target_keyword: "decision tree R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Decision Tree Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on decision trees with rpart: classification, regression, pruning, visualization.</p>

```r
library(rpart)
library(rpart.plot)
```

### Exercise 1: Classification tree

<details><summary>Show solution</summary>

```r
rpart(Species ~ ., data = iris)
```

</details>

### Exercise 2: Regression tree

<details><summary>Show solution</summary>

```r
rpart(mpg ~ ., data = mtcars)
```

</details>

### Exercise 3: Plot a tree

<details><summary>Show solution</summary>

```r
fit <- rpart(Species ~ ., data = iris)
rpart.plot(fit)
```

</details>

### Exercise 4: Adjust cp

<details><summary>Show solution</summary>

```r
rpart(Species ~ ., data = iris, control = rpart.control(cp = 0.01))
```

</details>

### Exercise 5: Adjust minsplit

<details><summary>Show solution</summary>

```r
rpart(Species ~ ., data = iris, control = rpart.control(minsplit = 5))
```

</details>

### Exercise 6: Predict probabilities

<details><summary>Show solution</summary>

```r
fit <- rpart(Species ~ ., data = iris)
head(predict(fit, iris, type = "prob"))
```

</details>

### Exercise 7: Predict class

<details><summary>Show solution</summary>

```r
fit <- rpart(Species ~ ., data = iris)
head(predict(fit, iris, type = "class"))
```

</details>

### Exercise 8: Variable importance

<details><summary>Show solution</summary>

```r
fit <- rpart(Species ~ ., data = iris)
fit$variable.importance
```

</details>

### Exercise 9: Pruning with printcp

<details><summary>Show solution</summary>

```r
fit <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
printcp(fit)
```

</details>

### Exercise 10: Prune to best cp

<details><summary>Show solution</summary>

```r
fit <- rpart(mpg ~ ., data = mtcars, cp = 0.001)
best_cp <- fit$cptable[which.min(fit$cptable[,"xerror"]), "CP"]
prune(fit, cp = best_cp)
```

</details>

### Exercise 11: Surrogate splits

<details><summary>Show solution</summary>

```r
fit <- rpart(Species ~ ., data = iris,
             control = rpart.control(usesurrogate = 2))
```

</details>

### Exercise 12: Tree depth

<details><summary>Show solution</summary>

```r
rpart(Species ~ ., data = iris, control = rpart.control(maxdepth = 3))
```

</details>

### Exercise 13: Cross-validated error

<details><summary>Show solution</summary>

```r
fit <- rpart(mpg ~ ., data = mtcars)
fit$cptable
```

</details>

### Exercise 14: Compare default vs deep tree

<details><summary>Show solution</summary>

```r
f1 <- rpart(Species ~ ., data = iris)
f2 <- rpart(Species ~ ., data = iris, control = rpart.control(cp = 0.001, minsplit = 2))
list(nodes_default = nrow(f1$frame), nodes_deep = nrow(f2$frame))
```

</details>

### Exercise 15: Custom split criteria (Gini)

<details><summary>Show solution</summary>

```r
rpart(Species ~ ., data = iris, parms = list(split = "gini"))
```

</details>

## What to do next

- **Random-Forest-Exercises** (shipped) — ensemble of trees.
- **XGBoost-Exercises** (shipped) — gradient-boosted trees.

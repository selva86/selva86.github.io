---
title: "Classification Lesson 4: Decision Trees for Classification"
catalog_blurb: "How a single tree splits data into readable rules, and where it overfits."
description: "Grow a classification tree in R from scratch: how it splits on Gini and entropy, how to read and prune it with rpart, and why one tree overfits."
keywords: "decision tree, classification tree, rpart, Gini impurity, entropy, information gain, pruning, cost complexity, overfitting, CART, R"
post_type: "LESSON"
curriculum_id: "6.30.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "4"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Decision-Boundaries-and-Model-Geometry.html"
course_prev: "Discriminant-Analysis-LDA-and-QDA.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## Decision Trees for Classification

Lesson 3 drew smooth, curved boundaries by modelling each class as a Gaussian cloud. A decision tree throws all of that out. It asks a short series of plain yes/no questions, "is the petal shorter than 2.5 cm?", and carves the feature space into rectangular boxes, one label per box. It is the most readable classifier there is: the whole model is a flowchart you can follow by hand.

By the end of this lesson you will be able to:

- Explain how a tree splits data into axis-aligned rectangles with a sequence of yes/no questions, and read a fitted tree
- Define node impurity (Gini and entropy) and how a tree picks the split that lowers it most
- Grow, read and prune a classification tree in R, and explain why an unpruned tree overfits

**Prerequisites:** you can run R and read its output, you know what a training set and a classifier are, and you have met the earlier classifiers in this course (kNN, Naive Bayes, LDA/QDA).

::widget tree-diagram {"root":"petal length below 2.5 cm?","l":"petal width below 1.0 cm?","r":"petal width below 1.75 cm?","leaves":["setosa","versicolor","versicolor","virginica"]}

=== step === concept
::eyebrow The idea
## A tree is a flowchart of questions

Picture identifying a wild iris with a ruler. You measure the flower and walk down a field guide: "Is the petal shorter than 2.5 cm? If yes, it is a setosa. If no, is the petal narrower than 1.75 cm? If yes, versicolor; if no, virginica." That field guide IS a decision tree. Each question is a **split**, each endpoint is a **leaf**, and the label a leaf predicts is simply the majority class of the training flowers that land there.

We will use a real, famous dataset: 150 irises measured by the botanist Edgar Anderson, 50 each of three species, with four measurements per flower in centimetres. It is built into R, so a fresh session already has it.

```r
# 150 real irises: 3 species, 4 measurements (cm). Built into R.
data(iris)
head(iris, 4)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
#> 4          4.6         3.1          1.5         0.2  setosa
table(iris$Species)
#>
#>     setosa versicolor  virginica
#>         50         50         50
```

The tree below is the flowchart we will actually grow from this data in a moment. The whole job is choosing the right question at each split, which is the next step.

::widget tree-diagram {"root":"petal length below 2.5 cm?","l":"petal width below 1.0 cm?","r":"petal width below 1.75 cm?","leaves":["setosa","versicolor","versicolor","virginica"]}

=== step === concept
::eyebrow How it chooses
## The best split makes the purest groups

At each node the tree tries every feature and every threshold, and keeps the one split that makes the two resulting groups as **pure** as possible, meaning each group is dominated by a single species. A group of all setosa is perfectly pure; a 50/50 mix of versicolor and virginica is as impure as it gets.

Two formulas measure impurity for a node whose class proportions are \(p_i\) (the fraction of the node that is class \(i\)). **Gini impurity** is \(G = 1 - \sum_i p_i^2\), and **entropy** is \(H = -\sum_i p_i \log_2 p_i\). Both are zero when the node is pure (one \(p_i\) equals 1) and largest when the classes are evenly mixed. They almost always pick the same split; Gini is the default in `rpart` because it is a touch cheaper to compute.

```r
# Impurity of a node, computed straight from its class proportions
gini    <- function(p) 1 - sum(p^2)
entropy <- function(p) -sum(p * log2(p))

# A node holding 9 versicolor and 1 virginica (10 flowers)
p <- c(9, 1) / 10
c(gini = gini(p), entropy = entropy(p))
#>      gini   entropy
#> 0.1800000 0.4689956
```

The tree scores a candidate split by the size-weighted impurity of its two children, and keeps the split with the biggest drop from the parent. That drop has a name: **information gain** = parent impurity minus the weighted impurity of the children.

[KEY INSIGHT]
A split is good when it lowers the weighted impurity of the children below the parent's. The tree is greedy: it grabs the largest purity gain available right now, then repeats on each child until the children are pure (or it is told to stop).

::widget gini-split {"feature":"petal width below 1.75 cm?","parent":[10,10],"left":[9,1],"right":[1,9],"labels":{"stay":"versicolor","churn":"virginica"}}

=== step === quiz
::eyebrow Check yourself
## Which split does the tree take?

A node holds 10 irises: 5 versicolor and 5 virginica (Gini 0.5). The tree weighs two candidate splits. Split A makes children {5 versicolor, 0 virginica} and {0 versicolor, 5 virginica}. Split B makes {4 versicolor, 1 virginica} and {1 versicolor, 4 virginica}. Which does the greedy tree prefer?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Split A: both children are pure (Gini 0), the biggest possible drop in impurity ::ok Right. Split A drives the weighted child impurity to 0, the largest gain on offer, so the greedy tree takes it. Split B's children are still mixed (Gini 0.32 each).
- Split B: spreading both classes into each child generalises better ::no The tree maximises purity, not balance. Split B leaves both children mixed, a smaller impurity drop, so the greedy tree passes it over for Split A.
- Neither: a 5/5 node is already balanced, so no split can improve it ::no Balanced is the opposite of pure. A 5/5 node has the highest possible impurity (Gini 0.5); a split that separates the classes improves it a great deal, which is exactly what Split A does.

=== step === tryit
::eyebrow In R
## Grow the tree in two lines

The `rpart` package fits a classification tree for you. The formula `Species ~ .` means "predict Species from every other column", and `method = "class"` tells it this is classification, not regression. Fill in the response variable, the column the tree should learn to predict.

```r
library(rpart)
tree <- rpart(____ ~ ., data = iris, method = "class")
tree
```
::check {"regex":"Species","gate":true,"difficulty":"beginner","ok":"That fits the tree. Read the printed branches: it splits first on Petal.Length, then on Petal.Width, exactly the field guide from the cover.","no":"Predict the species: fill in Species, so the formula reads Species ~ . (Species from all other columns)."}
::solution
```r
library(rpart)
tree <- rpart(Species ~ ., data = iris, method = "class")
tree
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.333 0.333 0.333)
#>   2) Petal.Length< 2.45 50  0 setosa (1.000 0.000 0.000) *
#>   3) Petal.Length>=2.45 100 50 versicolor (0.000 0.500 0.500)
#>     6) Petal.Width< 1.75 54  5 versicolor (0.000 0.907 0.093) *
#>     7) Petal.Width>=1.75 46  1 virginica (0.000 0.022 0.978) *
```

=== step === concept
::eyebrow Read it
## Reading the tree, and predicting

Every line of that printout is a node: its rule, how many training flowers reached it (`n`), how many it gets wrong (`loss`), and the class it predicts (`yval`). The parenthesised triple, like `(0.333 0.333 0.333)`, is the share of setosa, versicolor and virginica at that node. A `*` marks a leaf. Read it top to bottom and you get the field guide in words:

- **Petal.Length < 2.45 cm** -> setosa (all 50 setosa, 0 wrong; setosa is trivially separable)
- otherwise **Petal.Width < 1.75 cm** -> versicolor (54 flowers, 5 wrong)
- otherwise -> virginica (46 flowers, 1 wrong)

That readability is the tree's superpower. Unlike the covariance matrices of Lesson 3, you can hand this rule to a botanist and they can follow it with a ruler. To label new flowers, `predict` walks each one down the tree:

```r
pred <- predict(tree, iris, type = "class")
table(predicted = pred, actual = iris$Species)
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         49         5
#>   virginica       0          1        45
mean(pred == iris$Species)
#> [1] 0.96
```

[NOTE]
This 96% is **resubstitution accuracy**: scoring the tree on the very flowers it learned from. A model always flatters itself on its training data, so treat this as a ceiling, not an honest estimate. The real test comes from data the tree never saw, which is the trap we look at next.

=== step === widget
::eyebrow The shape of the rule
## A tree's boundary is rectangles

Here is the deepest difference from Lesson 3. LDA and QDA drew one smooth line or curve across the whole plane. A tree can only ask `feature < threshold`, so every split is a horizontal or vertical cut, and the decision boundary is always a staircase of **axis-aligned rectangles**. It can approximate any shape, but only in boxy steps.

Below is a real tree, grown live on two overlapping classes like versicolor and virginica (the two iris species whose petals genuinely overlap, while setosa splits off cleanly). Drag the depth slider. At shallow depth the boundary is a couple of clean boxes. Push it deep and watch the training accuracy climb toward 100% while the test accuracy (the hollow points it never trained on) peaks and then falls, as the tree carves tiny rectangles around individual noisy points.

::widget decision-region {"dataset":"two-blobs-diag","control":"max-depth","min":1,"max":10,"start":3,"showTest":true,"noise":"planted","seed":7,"labels":{"c0":"versicolor","c1":"virginica"},"metrics":["train_acc","test_acc","verdict"]}

A shallow tree underfits. A deep tree memorises. The sweet spot is in the middle, and you cannot find it by looking at training accuracy alone.

=== step === concept
::eyebrow The fix
## Why it overfits, and how pruning helps

Left unchecked, a tree keeps splitting until every leaf is pure, growing a separate rectangle around each noisy flower. It scores perfectly on the training set and poorly on new data: classic **overfitting**, the high-variance failure you saw on the slider. The cure is **pruning**: grow the tree, then cut back the splits that buy purity on the training data without earning their keep on new data.

`rpart` prunes by **cost-complexity**. It charges every split a price `cp` (the complexity parameter) and keeps a split only if it lowers impurity by more than that price. A bigger `cp` means a smaller, simpler tree. The `cptable` lists every candidate tree, from a stump upward, with its relative training error:

```r
# A ladder of candidate trees: each row adds one more split
round(tree$cptable[, c("CP", "nsplit", "rel error")], 2)
#>     CP nsplit rel error
#> 1 0.50      0      1.00
#> 2 0.44      1      0.50
#> 3 0.01      2      0.06
```

You read it for the point where extra splits stop paying off, then `prune` to that `cp`. Pruning to `cp = 0.45`, for instance, keeps only the single strongest split:

```r
stump <- prune(tree, cp = 0.45)
stump
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.333 0.333 0.333)
#>   2) Petal.Length< 2.45 50  0 setosa (1.000 0.000 0.000) *
#>   3) Petal.Length>=2.45 100 50 versicolor (0.000 0.500 0.500) *
```

[KEY INSIGHT]
Pruning trades a little training accuracy for a lot of stability. A well-pruned tree often matches a giant one on new data with a fraction of the leaves, and it stays readable.

[WARNING]
Even pruned, a single tree is fragile: change a handful of training rows and its greedy splits can cascade into a completely different tree. That stubborn high variance is the limit of one tree, and the reason the next part of this track combines many trees into ensembles (random forests, boosting) that average the wobble away.

=== step === tryit
::eyebrow Your turn
## Prune an overgrown tree

First grow a deliberately overgrown tree by setting the complexity price to zero and letting it split down to tiny nodes (run this once). Then cut it back. Fill in the function that trims a tree by its complexity parameter.

```r
library(rpart)
big <- rpart(Species ~ ., data = iris, method = "class",
             control = rpart.control(cp = 0, minsplit = 2))
```

```r
# Cut the overgrown tree back to a simpler, sturdier one.
simple <- ____(big, cp = 0.02)
simple
```
::check {"regex":"prune","gate":true,"difficulty":"beginner","ok":"That trims the bushy tree back to the same compact 3-leaf field guide. A simpler tree that generalises better, with no loss on this clean data.","no":"Use prune(big, cp = 0.02): cost-complexity pruning cuts the splits whose price exceeds the gain."}
::solution
```r
simple <- prune(big, cp = 0.02)
simple
#> n= 150
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 150 100 setosa (0.333 0.333 0.333)
#>   2) Petal.Length< 2.45 50  0 setosa (1.000 0.000 0.000) *
#>   3) Petal.Length>=2.45 100 50 versicolor (0.000 0.500 0.500)
#>     6) Petal.Width< 1.75 54  5 versicolor (0.000 0.907 0.093) *
#>     7) Petal.Width>=1.75 46  1 virginica (0.000 0.022 0.978) *
```

=== step === quiz
::eyebrow Check yourself
## Which tree do you ship?

You grow a classification tree with the complexity price turned off (`cp = 0`). It labels 100% of the training flowers correctly but only 91% of held-out flowers. A pruned version of the same tree scores 96% on both. What happened, and which do you deploy?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The unpruned tree overfit (it memorised training noise); ship the pruned tree, which generalises better ::ok Exactly. The 100/91 gap is the overfitting signature; the pruned tree's matched 96/96 is the honest, more reliable model. Fewer leaves, better on data that matters.
- The pruned tree underfits; ship the unpruned tree, since 100% training accuracy is the goal ::no Training accuracy is never the goal; accuracy on new data is. The unpruned tree's 91% on held-out flowers is worse than the pruned tree's 96%. Chasing 100% on training data is exactly how you overfit.
- They are equally good, so deploy whichever trains faster ::no They are not equal on the measure that counts: 91% vs 96% on held-out data. Speed does not decide it; generalisation does, and the pruned tree wins.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous treatment of trees, with the R labs that mirror this lesson.
- [The Elements of Statistical Learning, ch. 9 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - CART with the full impurity and pruning math.
- [rpart vignette: recursive partitioning in R](https://cran.r-project.org/web/packages/rpart/vignettes/longintro.pdf) - the package you used here, including the cost-complexity pruning you just ran.
- [Breiman, Friedman, Olshen and Stone (1984), Classification and Regression Trees](https://doi.org/10.1201/9781315139470) - the founding CART book that defined the method.

=== step === complete
## Lesson 4 complete

You can now build a classification tree from scratch. A tree asks a sequence of yes/no questions, keeping at each split the question that most lowers impurity (Gini or entropy), until each leaf is pure enough to vote its majority class. You grew one on the iris flowers with `rpart`, read its rules like a field guide, saw its boundary is a staircase of axis-aligned rectangles (not the smooth curves of LDA and QDA), watched a deep tree overfit, and pruned it back with cost-complexity to a simpler, sturdier model. You also saw the limit: one tree, even pruned, stays high-variance.

Next, Lesson 5: Decision Boundaries and Model Geometry. You will put all four classifiers side by side, kNN, Naive Bayes, LDA/QDA and the tree, and see how each one's assumptions show up as the shape of the boundary it draws, linear, curved or boxy, and what that tells you about which model to trust.

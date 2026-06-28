---
title: "Random Forests Lesson 1: Decision Trees from scratch"
catalog_blurb: "Grow a single decision tree and see how it splits."
description: "Build the decision tree that a random forest is made of: how it splits, how to grow one in R, and the overfitting flaw that motivates the whole forest."
keywords: "decision tree, random forest, gini impurity, overfitting, rpart, CART, R"
post_type: "LESSON"
curriculum_id: "6.3.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "random-forest"
course_title: "Random Forests, from the ground up"
course_lesson: "1"
course_total: "3"
course_landing: "Random-Forest-Course.html"
course_next: "RF-Course-Lesson-2.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Decision Trees from scratch
A random forest is hundreds of decision trees voting together. So before we can understand the forest, we need to understand one tree: how it thinks, how to grow it in R, and the single flaw that makes a forest necessary.

By the end of this lesson you will be able to:

- Explain how a decision tree splits data to make a prediction
- Grow a tree in R and read what it learned
- See, live, why one deep tree overfits, the problem the whole forest exists to fix

**Prerequisites:** you can run R, and you know what a training and test set are.

::widget tree-diagram {}

=== step === concept
::eyebrow The idea
## A tree is a flowchart of questions

To predict whether a customer churns, a decision tree asks a sequence of yes/no questions and follows the answers down to a verdict. "Is tenure below 8 months? If yes, are monthly charges above 70? If yes, predict churn."

Each question splits the data into two cleaner groups. The tree keeps splitting until each final group (a leaf) is mostly one class, then it predicts that class. The art is choosing which question to ask at each split. The tree below shows exactly that path.

::widget tree-diagram {"root":"tenure under 8 mo?","l":"charges over $70?","r":"support calls over 3?","leaves":["churns","stays","churns","stays"]}

=== step === concept
::eyebrow How it chooses
## The best split is the purest split

At every node the tree tries every feature and every threshold, and keeps the split that makes the two resulting groups as pure as possible. Purity is measured by Gini impurity: 0 means a group is all one class, 0.5 means a 50/50 mix.

For a node with class proportions \(p_i\), Gini impurity is \(G = 1 - \sum_i p_i^2\). With two classes it simplifies to \(G = 2p(1-p)\): zero when the node is pure (\(p = 0\) or \(p = 1\)) and largest at \(p = 0.5\). A candidate split is scored by the size-weighted Gini of its two children, and the tree keeps the split with the biggest drop from the parent's Gini.

[KEY INSIGHT]
A split is good when it lowers the weighted Gini of the children below the Gini of the parent. The tree is greedy: it grabs the biggest purity gain available right now, then repeats on each child.

That greed is what makes trees fast to grow, and, as you will see in a moment, what makes a single tree dangerous.

::widget gini-split {}

=== step === quiz
::eyebrow Check yourself
## Which split is better?

A node has 8 customers: 4 who churn and 4 who stay (Gini 0.5). Split A makes children {4 churn} and {4 stay}. Split B makes {3 churn, 1 stay} and {1 churn, 3 stay}. Which split does the greedy tree prefer?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Split A: both children are pure, Gini 0 ::ok Right. Split A drives the weighted child Gini to 0, the biggest possible purity gain, so the greedy tree takes it.
- Split B: it keeps both classes represented in each child ::no The tree wants PURER children, not balanced ones. Split B's children are still mixed (Gini 0.375 each); Split A's are pure.
- They are equally good

=== step === tryit
::eyebrow In R
## Grow one in two lines

First, a small self-contained churn dataset to grow the tree on. Each lesson runs in a fresh R session, so we build the data right here (run this once):

```r
set.seed(42)
n <- 800
train <- data.frame(
  tenure        = round(runif(n, 0, 60)),       # months as a customer
  monthly       = round(runif(n, 20, 120), 1),  # monthly charge
  total_spend   = round(runif(n, 50, 6000)),
  support_calls = rpois(n, 1.5),
  contract      = factor(sample(c("monthly", "annual"), n, TRUE)),
  has_addons    = rbinom(n, 1, 0.4),
  paperless     = rbinom(n, 1, 0.6),
  senior        = rbinom(n, 1, 0.16)
)
risk <- plogis(-1.2 + 1.6 * (train$tenure < 8) + 1.1 * (train$monthly > 85) +
               0.35 * train$support_calls - 0.03 * train$tenure)
train$churned <- factor(ifelse(runif(n) < risk, "yes", "no"))
table(train$churned)
```

In R, the `rpart` package fits a tree for you. Setting `cp = 0` removes the complexity penalty, so the tree grows as deep as the data allows, exactly the overfitting case we want to study next. Fill in the blank.

```r
library(rpart)
deep <- rpart(churned ~ ., data = train,
              control = rpart.control(____))
deep
```
::check {"regex":"cp\\s*=\\s*0","gate":true,"difficulty":"beginner","ok":"That grows an unpruned tree, it will chase every quirk in the training data.","no":"Set the complexity parameter to zero: cp = 0 (no pruning)."}
::solution
```r
library(rpart)
deep <- rpart(churned ~ ., data = train,
              control = rpart.control(cp = 0))
```

=== step === widget
::eyebrow The key experiment
## Watch a tree overfit, live

Here is a real decision tree, fit in your browser on two overlapping groups. Drag the depth slider. Watch the training accuracy climb toward 100% while the test accuracy (the hollow points it never trained on) peaks and then falls as the boundary carves tiny islands around individual noise points.

::widget decision-region {"dataset":"two-blobs-diag","control":"max-depth","min":1,"max":10,"start":3,"showTest":true,"noise":"planted","seed":7,"labels":{"c0":"stays","c1":"churns"},"metrics":["train_acc","test_acc","verdict"]}

A shallow tree underfits. A deep tree memorizes. Somewhere in the middle is a sweet spot, but it is narrow and you cannot see it without a test set.

=== step === concept
::eyebrow The flaw
## One tree is unstable

A deep tree does not just overfit, it is also fragile. Change a handful of training rows and the greedy splits cascade differently, producing a completely different tree with completely different predictions.

[WARNING]
High variance is the core weakness of a single decision tree: low bias (it can fit anything) bought at the price of wild sensitivity to the exact training sample.

=== step === quiz
::eyebrow Check yourself
## Quick question

You grow a single deep tree and measure it: 100% accuracy on the training data, 71% on the held-out test data. What is happening?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The tree has high bias and is underfitting ::no A 100/71 gap is the classic overfitting signature, not underfitting. An underfit model scores poorly on BOTH sets.
- The tree has high variance and is overfitting ::ok Exactly. It memorized the training data (100%) but that did not generalize (71%). Low bias, high variance.
- The training set is simply too small to learn from

=== step === concept
::eyebrow The big idea
## So why ever use a tree?

Because of a beautiful trick. The errors of many different overfit trees tend to cancel out, while the real signal they all pick up reinforces. Average enough diverse trees and the variance collapses, leaving the low bias behind.

That ensemble of trees is the random forest, and building it properly, making the trees different on purpose, is exactly what Lesson 2 is about. Drag the slider below to feel it: average more overfit trees and watch the jagged boundary smooth out while accuracy climbs.

::widget forest-averaging {"seed":7,"min":1,"max":80,"start":1,"labels":{"c0":"stays","c1":"churns"}}

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Breiman (2001), Random Forests, Machine Learning 45(1)](https://doi.org/10.1023/A:1010933404324) - the original paper that defined the method.
- [The Elements of Statistical Learning, ch. 9 and 15 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - decision trees and forests, with the full math.
- [An Introduction to Statistical Learning, ch. 8 (free PDF)](https://www.statlearning.com/) - the gentler companion on tree methods.
- [rpart vignette: recursive partitioning in R](https://cran.r-project.org/web/packages/rpart/vignettes/longintro.pdf) - the package you used to grow a tree here.

=== step === complete
## Lesson 1 complete

You understand the building block, and precisely why a single tree is not enough. That motivation is the whole point of a forest.

Next, Lesson 2: From one tree to a forest. You will watch averaging crush variance, see why bootstrap samples make trees differ, and meet the one trick that makes a forest beat plain bagging.

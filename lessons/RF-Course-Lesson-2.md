---
title: "Random Forests Lesson 2: From one tree to a forest"
catalog_blurb: "Why combining many trees predicts better than any one."
description: "Why averaging many decision trees crushes variance, how bootstrap samples make trees differ, and the random-feature trick that makes a forest beat plain bagging."
keywords: "random forest, bagging, bootstrap, decorrelation, variance reduction, ensemble, R"
post_type: "LESSON"
curriculum_id: "6.3.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "random-forest"
course_title: "Random Forests, from the ground up"
course_lesson: "2"
course_total: "3"
course_landing: "Random-Forest-Course.html"
course_next: "RF-Course-Lesson-3.html"
course_prev: "RF-Course-Lesson-1.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## From one tree to a forest

A single tree overfits and wobbles. The fix is almost embarrassingly simple, and it is one of the most powerful ideas in machine learning.

In Lesson 1 you saw one deep tree hit 96% on training data but only 66% on test, and shift wildly when the data changed. Now you will turn that weakness into a strength.

- Watch averaging crush a tree's variance, live
- See why bootstrap samples make trees differ
- Meet the one trick that makes a forest beat plain bagging

**Prerequisites:** Lesson 1 (decision trees, and why one deep tree overfits).

::widget forest-averaging {"seed":7,"min":1,"max":80,"start":1,"labels":{"c0":"stays","c1":"churns"}}

=== step === concept
::eyebrow The idea
## The wisdom of crowds

Ask one noisy expert and you get a noisy answer. Ask hundreds and average them, and the random errors cancel while the real signal survives. That is the whole trick behind a forest.

[KEY INSIGHT]
If each tree has variance \(\sigma^2\) and the trees are independent, the average of \(B\) of them has variance \(\sigma^2 / B\). More trees, steadier predictions: the random errors average away.

The catch is hiding in one word: independent. Hold that thought.

=== step === widget
::eyebrow The key experiment
## Build a forest, tree by tree

Each tree below is grown deep (the jagged, overfitting kind from Lesson 1) on its own random resample. Drag the slider to average more of them, and watch the boundary smooth out while accuracy climbs.

::widget forest-averaging {"seed":7,"min":1,"max":80,"start":1,"labels":{"c0":"stays","c1":"churns"}}

No single tree got better. You did not prune or tune them. The average simply cancels their individual mistakes.

=== step === concept
::eyebrow The catch
## Clones do not help

Averaging only cancels errors if the trees make different mistakes. Grow a hundred identical trees and their average is just that same tree again. No variance reduction at all.

So the real engineering problem of a random forest is: how do we force the trees to be different on purpose? There are two tricks, and a forest uses both.

::prose-only The clones-vs-diverse trees are demonstrated live in the random-features widget a few steps below; a separate diagram here would duplicate it.

=== step === concept
::eyebrow Trick 1
## Give each tree different data

Before growing a tree, draw a bootstrap sample: pick rows from the training set at random with replacement, until you have a set the same size. Some rows appear twice, others not at all.

[NOTE]
On average each bootstrap leaves out about 37% of the rows. A tree never sees its left-out rows, so they make a built-in test set for that tree. Those are the out-of-bag rows, and they power the free OOB error you will meet in Lesson 3.

Different data in means a different tree out. But there is a sneakier source of sameness left to kill.

::widget bootstrap-sample {"seed":7,"tail":"Each tree gets its own draw, so no two trees see the same data."}

=== step === concept
::eyebrow Trick 2, the motivation
## Bootstrap is not enough

Suppose one feature, say tenure, is much more predictive than the rest. Then every tree, even on its own bootstrap sample, will choose tenure for its very first split. The trees end up looking nearly identical near the top.

Statisticians call this correlation between the trees, and it is poison for averaging: remember the variance only divides by B when the trees are independent. Correlated trees barely reduce variance.

With pairwise correlation \(\rho\), the averaged variance is \(\rho\sigma^2 + \frac{1-\rho}{B}\sigma^2\). The second term shrinks as you add trees, but the first does not: \(\rho\sigma^2\) is a floor you cannot average away. The only way down is to lower \(\rho\), which is exactly what the next trick does.

=== step === widget
::eyebrow The trick that names it
## Random features

Here is the fix that makes it a random forest: at each split, the tree may only consider a random handful of features, not all of them. The dominant feature cannot win every time, so the trees diverge. Toggle below and watch what each tree picks for its first split.

::widget decorrelation {}

=== step === quiz
::eyebrow Check yourself
## Quick question

Why does a random forest let each split consider only a random subset of the features?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- To make each individual tree more accurate ::no Each tree actually gets slightly weaker. The point is the forest, not the tree.
- To decorrelate the trees so averaging cuts more variance ::ok Exactly. Restricting features stops the dominant one from winning every split, so the trees disagree more, and uncorrelated errors cancel better when averaged.
- To make training faster by ignoring features

=== step === concept
::eyebrow Putting it together
## The whole forest, in three rules

That is it. A random forest is just these three ideas stacked:

1. **Bootstrap:** grow each tree on its own random resample of the rows.
2. **Random features:** at each split, only consider a random subset (mtry) of the features.
3. **Average:** let all the trees vote; the majority (or mean) is the forest's answer.

[KEY INSIGHT]
Each tree is a low-bias, high-variance learner. Bootstrap and random features make them diverse; averaging cancels the variance. You keep the low bias and throw away most of the variance, with almost no tuning.

::widget process-flow {}

=== step === tryit
::eyebrow Your turn
## Grow the forest in R

First, the churn data to grow the forest on. Each lesson runs in a fresh R session, so we build it right here (run this once):

```r
set.seed(42)
n <- 800
train <- data.frame(
  tenure        = round(runif(n, 0, 60)),
  monthly       = round(runif(n, 20, 120), 1),
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
```

You have the recipe. In R, `randomForest` does all three steps in one call. Fill in the number of trees so the forest averages 200 of them.

```r
library(randomForest)
rf <- randomForest(churned ~ ., data = train,
                   ntree = ____,   # how many trees to average
                   mtry = 3)       # random features per split
```
::check {"regex":"ntree\\s*=\\s*200","gate":true,"difficulty":"beginner","ok":"That averages 200 decorrelated trees: bootstrap, random features and voting, all in one call.","no":"Set ntree = 200 to average 200 trees."}
::solution
```r
rf <- randomForest(churned ~ ., data = train,
                   ntree = 200, mtry = 3)
```

=== step === concept
::eyebrow Go deeper
## References

- [Breiman (2001), Random Forests, Machine Learning 45(1)](https://doi.org/10.1023/A:1010933404324) - bootstrap + random features, the full method.
- [Breiman (1996), Bagging Predictors, Machine Learning 24(2)](https://doi.org/10.1007/BF00058655) - where bootstrap aggregation began.
- [The Elements of Statistical Learning, ch. 15 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the variance-of-an-average and decorrelation math.

=== step === complete
## Lesson 2 complete

You now understand why a random forest works, not just what it does. Next, you will build and tune a real one.

Up next, Lesson 3: Training, tuning and reading a forest in R. OOB error, tuning mtry and trees on a live model, reading variable importance, and the code to do it for real, ending in your Machine Learning certificate.

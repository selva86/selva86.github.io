---
title: "Random Forests Lesson 3: Train, tune and read a forest in R"
description: "Score a forest with out-of-bag error, tune mtry and num.trees on a live model, read variable importance, and know where random forests shine and where they do not."
keywords: "random forest R, ranger, OOB error, mtry tuning, variable importance, tidymodels"
post_type: "LESSON"
curriculum_id: "6.3.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "random-forest"
course_title: "Random Forests, from the ground up"
course_lesson: "3"
course_total: "3"
course_landing: "Random-Forest-Course.html"
course_next: ""
course_prev: "RF-Course-Lesson-2.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Train, tune and read a forest in R

You understand why a forest works. Now you will build one for real, tune it without a test set, and learn to read what it tells you.

The story so far: a single tree overfits (Lesson 1); bootstrap, random features and averaging fix it (Lesson 2). This lesson turns that understanding into working R and the few knobs that actually matter.

- Get a free test set from the forest itself (OOB error)
- Tune mtry and trees on a live model and see the sweet spot
- Read variable importance, and know the limits

**Prerequisites:** Lessons 1 and 2 (trees, and how bootstrap + random features build a forest).

::widget oob-tuner {}

=== step === concept
::eyebrow A free test set
## Out-of-bag error

Remember the ~37% of rows each tree never saw (its bootstrap left them out)? Here is the payoff. To score the forest, run every row through only the trees that did not train on it, and average. No data held back, no separate test split needed.

[KEY INSIGHT]
OOB error is an honest, almost-free estimate of test performance, computed during training. On most problems it lands very close to a proper cross-validation, for a fraction of the work.

::widget bootstrap-sample {"seed":23,"tail":"Those rows trained no tree here, so they are a free test set."}

=== step === concept
::eyebrow In R
## Train one in five lines

The ranger package fits a fast forest and reports OOB error directly. Run it.

```r
library(ranger)
set.seed(42)
rf <- ranger(
  churned ~ .,            # predict churn from all columns
  data        = train,
  num.trees   = 500,      # more is safer, never overfits
  mtry        = 3,        # features tried per split (about sqrt of p)
  importance  = "impurity"
)
rf$prediction.error       # the out-of-bag error
```

Two numbers in that call decide everything: `num.trees` and `mtry`. Let us feel what they do.

=== step === widget
::eyebrow The tuning bench
## Turn the two knobs

This is a live forest on the churn data. Drag trees to move along the OOB curve; drag mtry to shift the whole curve up or down. Find the lowest the error will go.

::widget oob-tuner {}

=== step === concept
::eyebrow What you just felt
## The only knobs worth turning

1. **num.trees: more is safe.** Error falls then flattens. Use as many as you can afford (300 to 1000). Extra trees never overfit, they just cost time.
2. **mtry: the one real dial.** Too low starves each tree; too high re-correlates them. Start near \(\sqrt{p}\) for classification (\(p/3\) for regression) and search a small range around it.
3. **min.node.size: light touch.** Larger values grow shallower trees. The default is usually fine; nudge it only if a forest overfits a small, noisy dataset.

=== step === tryit
::eyebrow Your turn
## Set mtry by the rule of thumb

You have 8 predictors and a classification problem. Fill in `mtry` with the \(\sqrt{p}\) starting value (round to a whole number), then check it.

```r
rf <- ranger(churned ~ ., data = train,
             num.trees = 500,
             mtry = ____)
```
::check {"regex":"mtry\\s*=\\s*3","gate":true,"difficulty":"beginner","ok":"That is it: round(sqrt(8)) = 3.","no":"sqrt(8) is about 2.83, which rounds to 3. Set mtry = 3."}
::solution
```r
rf <- ranger(churned ~ ., data = train,
             num.trees = 500,
             mtry = 3)   # round(sqrt(8)) = 3
```

=== step === concept
::eyebrow Reading the forest
## Which features mattered?

Because every tree records how much each split improved purity, a forest can rank features for free. Sum those gains across all trees and you get variable importance, the first thing to look at after training. The chart below shows a typical ranking for the churn model: tenure dominates, then monthly and total spend.

[WARNING]
Importance says a feature was useful for splitting, not that it causes the outcome, and impurity importance can inflate high-cardinality features. For decisions that matter, confirm with permutation importance or SHAP.

::widget importance-bars {}

=== step === quiz
::eyebrow Check yourself
## Quick question

You raise `num.trees` from 100 to 500 and the OOB error barely moves. What does that tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model is broken and needs fewer trees ::no A flat curve is healthy, not broken: it means the forest has converged.
- The forest has converged; extra trees only cost compute, they do not hurt accuracy ::ok Right. Past convergence more trees neither help nor hurt accuracy. And error will not reach zero: it settles at the forest's floor for this data and mtry.
- You should keep adding trees until the error reaches zero

=== step === concept
::eyebrow Know your tool
## Where forests shine, where they do not

A random forest is the strongest model you can train with almost no tuning. But it is not magic, and knowing the edges is what separates a practitioner from a button-pusher.

**Strengths:** strong accuracy out of the box with minimal tuning; handles mixed numeric and categorical features; robust to outliers and irrelevant features; free OOB error and feature importance.

**Limits:** less interpretable than a single tree; cannot extrapolate beyond the training range; big models are memory-heavy and slower to predict; gradient boosting often edges it out when carefully tuned.

=== step === concept
::eyebrow Go deeper
## References

- [Breiman (2001), Random Forests, Machine Learning 45(1)](https://doi.org/10.1023/A:1010933404324) - the original method: OOB error and variable importance.
- [Wright & Ziegler (2017), ranger: A Fast Implementation of Random Forests, JSS](https://doi.org/10.18637/jss.v077.i01) - the package this lesson uses.
- [ranger documentation](https://imbs-hl.github.io/ranger/) - arguments, OOB error, and importance modes.
- [tidymodels: rand_forest()](https://parsnip.tidymodels.org/reference/rand_forest.html) - the same model inside a tidymodels workflow.

=== step === complete
## Module complete

You built a random forest from the ground up, the tree, the forest, and the tuning, and you can read what it tells you. That is the real thing.

You learned: a single tree (greedy Gini splits, high variance), the forest (bootstrap plus random features plus averaging turns that variance into accuracy), and the practice (OOB error to score, mtry and trees to tune, importance to interpret).

Random Forests is one of the graded modules in the Data Scientist track. Pass the assessment and it goes on your verified certificate, with a portfolio build to match.

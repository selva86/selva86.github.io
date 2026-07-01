---
title: "Interpretability Lesson 2: Permutation and Drop-Column Importance"
catalog_blurb: "How to measure feature importance for any model, and where it misleads."
description: "Permutation and drop-column importance in R: measure how much any model relies on each feature by shuffling or removing it, and where correlated features mislead."
keywords: "permutation importance, drop-column importance, feature importance, model-agnostic importance, variable importance, random forest, interpretable machine learning, XAI, R"
post_type: "LESSON"
curriculum_id: "6.110.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "2"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: "SHAP-Values.html"
course_prev: "Global-vs-Local-Explanations.html"
---

=== step === cover
::eyebrow Lesson 2 of 6
## Permutation and Drop-Column Importance

In Lesson 1 you read a global feature-importance ranking off a churn model, and you did it the easy way: the model was a logistic regression, so each feature had a coefficient, and the size of the coefficient told you how much the feature mattered.

Then your team swapped in a **random forest**, because it predicts churn better. It has no coefficients. Hundreds of trees vote; there is no single number per feature to read. So the old recipe is dead, and yet the product lead still wants the same answer: *which features drive this model?*

This lesson answers that for **any** model, even a black box, with two model-agnostic methods, and then shows the honest ways they can quietly mislead you.

By the end you will be able to:

- Compute **permutation importance** in R: shuffle one feature and measure how far accuracy falls
- Compute **drop-column importance** in R: retrain without a feature and measure the same fall, and say when each method is worth its cost
- Spot the trap that fools both: why a genuinely important feature can look worthless when a correlated twin is present

**Prerequisites:** you can fit and use a model in R such as a [random forest](Random-Forest-Course.html), you know what a train/test split and accuracy are, and you have done [Lesson 1: Global vs Local Explanations](Global-vs-Local-Explanations.html).

::widget importance-bars {"items":[{"label":"tenure","value":0.087},{"label":"monthly charge","value":0.033},{"label":"support calls","value":0.020},{"label":"contract","value":0.007},{"label":"add-ons","value":0.002},{"label":"senior","value":0.000}]}

=== step === concept
::eyebrow The problem
## A model with no coefficients

Here is the same churn data from Lesson 1, but this time we fit a **random forest** instead of a logistic regression. Each row is a customer; `churned` is "yes" if they left. Build it and fit once.

```r
library(randomForest)
set.seed(42)
n <- 500
churn <- data.frame(
  tenure        = round(runif(n, 0, 60)),       # months as a customer
  monthly       = round(runif(n, 20, 120), 1),  # monthly charge (dollars)
  support_calls = rpois(n, 1.5),                # support calls last quarter
  contract      = rbinom(n, 1, 0.5),            # 1 = on a 1-year contract
  addons        = rbinom(n, 1, 0.4),            # has paid add-ons
  senior        = rbinom(n, 1, 0.16)            # senior-citizen flag
)
# who leaves depends mostly on short tenure, high charges, and support calls
lp <- -1.0 - 0.06 * churn$tenure + 0.02 * churn$monthly +
       0.35 * churn$support_calls - 0.5 * churn$contract
churn$churned <- factor(ifelse(rbinom(n, 1, plogis(lp)) == 1, "yes", "no"))

set.seed(1)
i <- sample(nrow(churn), 350)
train <- churn[i, ]                              # fit the model here
test  <- churn[-i, ]                             # judge it here

rf <- randomForest(churned ~ ., data = train, ntree = 120)
base_acc <- mean(predict(rf, test) == test$churned)   # accuracy on unseen customers
round(base_acc, 3)
#> [1] 0.789
```

The forest predicts the held-out customers correctly about 79% of the time. Good enough. But `coef(rf)` does not exist, and there is no \(\beta_j\) to scale. To rank features for a model like this, we cannot look **inside** it. We have to poke it from the **outside** and watch how it reacts. That is what "model-agnostic" means: a method that only needs to feed the model inputs and read its outputs, so it works on a forest, a neural net, or anything else.

=== step === concept
::eyebrow The first method
## Permutation importance: shuffle one column

Here is a simple, powerful idea. If a feature really matters to the model, then destroying the information in that column should hurt the model. If the feature is useless, destroying it should change nothing.

How do you destroy the information in one column without changing anything else? You **shuffle** it. Take the `tenure` column and randomly reassign its values across customers, so Ravi (3 months) now carries someone else's tenure and someone else carries his. Every other column stays exactly as it was, so the only thing you have broken is the link between `tenure` and who actually churned.

| customer | tenure (real) | tenure (shuffled) | monthly | churned |
|---|---|---|---|---|
| Ravi | 3 | 30 | 105 | yes |
| Meera | 48 | 12 | 60 | yes |
| Sara | 30 | 55 | 40 | no |
| Tom | 12 | 3 | 88 | no |
| Uma | 55 | 48 | 35 | no |

Now score the model on this scrambled data and see how much accuracy it lost. That loss **is** the permutation importance of `tenure`. Writing \(\hat{f}\) for the fitted model, \(s(\hat{f}, X, y)\) for its accuracy on features \(X\) and true labels \(y\), and \(X^{\pi(j)}\) for the same data with column \(j\) randomly permuted,

\[ \text{PI}_j = s(\hat{f}, X, y) - s(\hat{f}, X^{\pi(j)}, y). \]

In words: original accuracy minus accuracy-after-shuffling-feature-\(j\). A big drop means the model leaned hard on that feature; a drop near zero means it barely used it.

=== step === concept
::eyebrow Read the ranking
## One shuffle per feature, ranked

Now do that for every feature: shuffle it, score, record the drop, put the original column back, move to the next. The forest is never refit, we only scramble-and-score, which is what makes permutation importance cheap.

```r
# copy-on-modify: shuffling `data` inside the function never touches the real test set
perm_importance <- function(model, data, feat) {
  data[[feat]] <- sample(data[[feat]])            # break this feature's link to churn
  base_acc - mean(predict(model, data) == data$churned)
}

set.seed(1)
features <- setdiff(names(test), "churned")        # the six predictors, not the label
imp <- sapply(features, function(f) perm_importance(rf, test, f))
round(sort(imp, decreasing = TRUE), 3)
#>        tenure       monthly support_calls      contract        addons        senior
#>         0.087         0.033         0.020         0.007         0.002        -0.003
```

Read top to bottom: shuffling **tenure** costs the model about 9 points of accuracy, **monthly charge** a few, **support calls** a little, and the rest essentially nothing. `senior` even comes out slightly negative, which just means shuffling it happened to help by luck; treat that as "zero, the model does not use it." Here is the ranking as a chart.

::widget importance-bars {"items":[{"label":"tenure","value":0.087},{"label":"monthly charge","value":0.033},{"label":"support calls","value":0.020},{"label":"contract","value":0.007},{"label":"add-ons","value":0.002},{"label":"senior","value":0.000}]}

[NOTE]
Two habits keep this honest. **Score on the test set**, not the training set: on training data a model can memorize, and shuffling then punishes memorized noise as if it were signal. And because the shuffle is random, **repeat it a few times and average**, so a single lucky shuffle does not decide a feature's rank. Your exact numbers will wobble run to run; the ordering is what is stable.

=== step === quiz
::eyebrow Check yourself
## What does a zero mean?

You add a column `income` to the data, refit, and its permutation importance comes out at essentially **0**: shuffling it does not change accuracy. A teammate concludes *income has no real effect on who churns.* Is that a safe conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: zero permutation importance means the feature is irrelevant to churn ::no Permutation importance measures how much THIS fitted model leans on the column, not whether the feature matters in reality. If the model never learned to use income, or another column already carries its signal, income can be genuinely predictive and still score zero here.
- No: it only shows this model does not rely on income; income could still matter, the model just is not using it ::ok Exactly. Permutation importance is a fact about the model in front of you, not about the world. A zero says "the model ignores this column", which is not the same as "this feature is useless."
- No, because you have to shuffle every column at once, not one at a time ::no Shuffling one column at a time is correct: that is precisely what isolates a single feature. The mistake is reading "the model does not use it" as "reality does not need it."

=== step === tryit
::eyebrow Your turn
## Measure it yourself

Compute the permutation importance of `monthly` by hand. We have shuffled the `monthly` column for you; fill in the importance, which is the baseline accuracy minus the model's accuracy on the shuffled data.

```r
shuffled <- transform(test, monthly = sample(monthly))   # monthly scrambled, all else intact
perm_monthly <- ____                                     # the fall in accuracy when monthly is shuffled
round(perm_monthly, 3)
```
::check {"regex":"base_acc\\s*-\\s*mean\\(\\s*predict\\(\\s*rf\\s*,\\s*shuffled","gate":true,"difficulty":"intermediate","ok":"That is it: base_acc minus the shuffled-data accuracy is exactly how far the model falls when monthly loses its signal, which is monthly's permutation importance.","no":"Importance is the DROP: base_acc - mean(predict(rf, shuffled) == test$churned)."}
::solution
```r
shuffled <- transform(test, monthly = sample(monthly))
perm_monthly <- base_acc - mean(predict(rf, shuffled) == test$churned)
round(perm_monthly, 3)
#> [1] 0.033
```

=== step === concept
::eyebrow The second method
## Drop-column importance: retrain without it

Permutation asks "what if this feature turned to noise?" Drop-column asks the blunter question: *what if this feature had never existed?* You delete the column entirely, **retrain** the model on what remains, and measure how much worse it does. `select(-tenure)` is the deletion; watch the column go.

::widget table-transform {"code":"df %>% select(-tenure)","caption":"Drop-column starts by removing the whole feature, then refits the model on the columns that are left.","before":{"cols":["customer","tenure","monthly","churned"],"rows":[["Ravi",3,105,"yes"],["Meera",48,60,"yes"],["Sara",30,40,"no"],["Tom",12,88,"no"],["Uma",55,35,"no"]]},"after":{"cols":["customer","monthly","churned"],"rows":[["Ravi",105,"yes"],["Meera",60,"yes"],["Sara",40,"no"],["Tom",88,"no"],["Uma",35,"no"]]}}

Formally, with \(\hat{f}_{\text{full}}\) the model trained on all features and \(\hat{f}_{-j}\) the model retrained on every feature except \(j\),

\[ \text{DC}_j = s(\hat{f}_{\text{full}}) - s(\hat{f}_{-j}), \]

the drop in accuracy from doing without feature \(j\) altogether. In R, refit once per feature and compare:

```r
library(randomForest)
drop_imp <- function(feat) {
  keep <- setdiff(names(train), feat)                   # every column except `feat`
  m <- randomForest(churned ~ ., data = train[, keep], ntree = 120)
  base_acc - mean(predict(m, test) == test$churned)     # how much worse without it
}
sapply(c("tenure", "monthly", "contract"), drop_imp)
#>   tenure  monthly contract
#>    0.060    0.027    0.007
```

The story matches permutation: losing `tenure` hurts most, `contract` barely registers. Drop-column is the more direct answer, but notice the cost. Permutation shuffled-and-scored on **one** already-trained model. Drop-column trains a **brand-new** model for **every** feature.

| | Permutation | Drop-column |
|---|---|---|
| Question | What if this feature became noise? | What if this feature never existed? |
| Cost | One fit, then cheap re-scoring per feature | One full retrain **per feature** |
| Best when | The model is expensive to train, or you have many features | You have few features and can afford the refits |

=== step === quiz
::eyebrow Check yourself
## Which one can you afford?

Your model takes an hour to train and has 200 features. Permutation and drop-column agree on the top few features, but you can only run one on the full set. Which is the practical choice, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Drop-column, because retraining is the only trustworthy way to measure importance ::no Drop-column retrains the model once per feature: 200 retrains of an hour-long model is roughly 200 hours. It is a fine method, but not the one you reach for on a slow model with many features.
- Permutation, because it reuses the single trained model and only reshuffles-and-scores, so it costs one fit plus cheap re-scoring ::ok Right. Permutation never retrains: you pay for one fit, then each feature is just a shuffle and a scoring pass. That is why it scales to a slow model with hundreds of features, where drop-column would take days.
- Neither, they cost the same, so pick whichever you like ::no They do not cost the same. Permutation reuses the fitted model; drop-column refits once per feature. At 200 features and an hour per fit, that difference is the whole decision.

=== step === concept
::eyebrow Where both mislead
## The correlated-feature trap

Now the honesty. Both methods share a blind spot, and it is the one that turns a careful analyst into a confidently wrong one. Suppose your data has a second column, `tenure_copy`, that is almost identical to `tenure`, say a billing-system field that tracks nearly the same thing. Watch what happens to tenure's importance.

```r
library(randomForest)
set.seed(7)
train$tenure_copy <- train$tenure + round(rnorm(nrow(train), 0, 2))   # a near-duplicate
test$tenure_copy  <- test$tenure  + round(rnorm(nrow(test),  0, 2))

rf2   <- randomForest(churned ~ ., data = train, ntree = 120)
base2 <- mean(predict(rf2, test) == test$churned)

set.seed(3)
c(tenure      = base2 - mean(predict(rf2, transform(test, tenure      = sample(tenure)))      == test$churned),
  tenure_copy = base2 - mean(predict(rf2, transform(test, tenure_copy = sample(tenure_copy))) == test$churned))
#>      tenure tenure_copy
#>       0.033       0.027
```

Tenure alone scored **0.087**, the clear number-one feature. Add a near-twin and each of them scores only about **0.03**. Nothing about churn changed; we just gave the model a spare copy. When you shuffle `tenure`, the forest quietly leans on `tenure_copy` instead and barely loses accuracy, so tenure looks unimportant. Shuffle `tenure_copy` and it leans back on `tenure`. The credit for one strong signal got **split** between two columns, and drop-column has the same disease: delete either twin and the other stands in.

::widget importance-bars {"items":[{"label":"monthly charge","value":0.033},{"label":"tenure","value":0.033},{"label":"tenure_copy","value":0.027},{"label":"support calls","value":0.020},{"label":"contract","value":0.007},{"label":"add-ons","value":0.002}]}

[KEY INSIGHT]
Correlated features share credit, so a genuinely important feature can be masked into looking unimportant. Low permutation or drop-column importance therefore does **not** mean "safe to remove", it might mean "a correlated twin is covering for it." Before trusting a low score, check whether the feature is highly correlated with another.

To read these importances honestly: score on held-out data, average over several shuffles, remember the number is the model's reliance and not the truth, and watch out for correlated features splitting the credit.

=== step === quiz
::eyebrow Check yourself
## Two low bars

After adding `tenure_copy`, both `tenure` and `tenure_copy` show low importance, where tenure alone was the top feature. A teammate says: *two low-importance features, so we can safely drop both to simplify the model.* What actually happens if you do?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- He is right: two features that both score low can both be removed with no harm ::no Drop both and you strip out tenure's signal entirely, and accuracy falls hard. Each looked low ONLY because the other could stand in during the shuffle; together they are essential.
- Accuracy drops, because their importance was split between them: either could cover for the other, but removing BOTH removes the shared signal ::ok Exactly. Individually each twin looks droppable because its partner masks the loss. Remove both and there is nothing left to cover the gap, so the model loses the single strongest predictor it had.
- Nothing changes, because a duplicate column carries no real information ::no The duplicate is nearly a copy of a top feature, so it carries almost all of tenure's signal. That is the whole point: the shared signal is real, it is just double-counted across two columns.

=== step === concept
::eyebrow Go deeper
## References

- [Molnar, Interpretable Machine Learning: Permutation Feature Importance](https://christophm.github.io/interpretable-ml-book/feature-importance.html) - the standard, careful explanation, including the correlated-feature and train-vs-test caveats you met here.
- [Breiman (2001), Random Forests, Machine Learning 45(1)](https://doi.org/10.1023/A:1010933404324) - the paper that introduced permutation importance as a way to rank features in a forest.
- [Strobl et al. (2008), Conditional variable importance for random forests, BMC Bioinformatics](https://doi.org/10.1186/1471-2105-9-307) - why correlated predictors distort importance, and a conditional method that addresses it.
- [vip: Variable Importance Plots (R package)](https://koalaverse.github.io/vip/articles/vip.html) - a ready-made R tool for permutation and other model-agnostic importance, once you want it off by hand.

=== step === complete
## Lesson 2 complete

You can now measure global importance for **any** model, not just a linear one. **Permutation importance** shuffles a feature and reads the accuracy drop, cheaply, on one fitted model. **Drop-column importance** retrains without the feature for a more direct but pricier answer. And you know the honest limits: the number is the model's reliance rather than ground truth, it should be scored on held-out data and averaged over shuffles, and correlated features can split the credit so that low importance never automatically means safe-to-drop.

Next, Lesson 3: **SHAP values.** Global rankings tell you what the model uses overall; SHAP goes back to the local question from Lesson 1 and splits a single prediction into per-feature contributions that sum **exactly** to it, with correlated features handled far more gracefully than a raw shuffle.

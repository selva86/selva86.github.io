---
title: "tidymodels Lesson 4: Resample with rsample"
catalog_blurb: "Estimate how good your model really is, instead of trusting one lucky split."
description: "Judge an R model honestly with rsample: cross-validation folds, the bootstrap, running a workflow across every resample, and reading the mean with its spread."
keywords: "rsample, cross-validation in R, k-fold cross-validation, vfold_cv, bootstrap resampling, tidymodels, fit_resamples, collect_metrics, out-of-bag, honest model evaluation"
post_type: "LESSON"
curriculum_id: "6.50.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "4"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Measure-with-yardstick.html"
course_prev: "Bundle-Steps-with-workflows.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Resample with rsample

The risk committee has one question about your loan-default model: how accurate is it, really? In Lesson 3 you bundled the recipe and the model into a workflow, split the 240 applications 75/25, scored the held-out quarter, and got 82% accuracy. You write that down. Then a colleague reshuffles the very same data, takes a fresh 75/25 split, and gets 76%. Same model, same applicants, same code. Which number do you put in the report?

The honest answer is neither, because a single split rests its whole verdict on one slice of luck. This lesson replaces that one coin-flip with **resampling**: score the model on many splits and read the average, with a measure of how much it wobbles. The `rsample` package builds those splits for you.

By the end of this lesson you will be able to:

- Explain why one train/test split gives an unreliable estimate of how good a model is
- Build cross-validation folds and bootstrap resamples with rsample
- Run your whole workflow across every resample and read the average score and its spread

**Prerequisites:** you can run R and use the `|>` pipe, and you can [bundle a recipe and a model into a workflow and fit it](Bundle-Steps-with-workflows.html) (Lesson 3).

::widget cv-folds {"k":5}

=== step === concept
::eyebrow The problem
## One split is a roll of the dice

Let us prove the wobble rather than assert it. Here is the lender's loan book again, rebuilt right here so this page runs on its own. Each row is one applicant; `defaulted` is what we are trying to predict.

```r
set.seed(7)
n <- 240
loans <- data.frame(
  income   = round(runif(n, 22000, 98000)),   # annual income, dollars
  age      = round(runif(n, 21, 60)),
  employed = round(runif(n, 2, 160)),          # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
risk <- with(loans, plogis(-1.1 + 1.4 * (income < 45000) +
             1.0 * (employed < 20) + 0.6 * (home == "rent")))
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"))
table(loans$defaulted)
#>
#>  no yes
#> 151  89
```

Now fit the **same** logistic model on twenty different random 75/25 splits and record the accuracy each time. Nothing about the model changes between runs. Only the luck of which rows land in the test set changes.

```r
acc_of_one_split <- function(seed) {
  set.seed(seed)
  i  <- sample(nrow(loans), 0.75 * nrow(loans))   # pick 180 rows to train on
  tr <- loans[i, ]; te <- loans[-i, ]             # the other 60 are the test set
  m  <- glm(defaulted ~ ., data = tr, family = binomial)
  p  <- ifelse(predict(m, te, type = "response") > 0.5, "yes", "no")
  mean(p == te$defaulted)                         # accuracy on the held-out rows
}
accs <- sapply(1:20, acc_of_one_split)
round(range(accs), 3)   # the lowest and highest accuracy we saw
#> [1] 0.567 0.750
round(sd(accs), 3)      # how much it swings from split to split
#> [1] 0.053
```

Read that again. The identical model scored as low as **57%** and as high as **75%**, purely because of which applicants happened to sit in the test set. If you had run it once and stopped, you would have walked into that meeting with a number that was off by up to nine points in either direction, and no way to know it.

=== step === quiz
::eyebrow Check yourself
## Why does the score swing?

You fit the same logistic-regression model twenty times and its test accuracy ranged from 57% to 75%. What is the swing actually telling you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The model is unstable and retrains itself differently each run ::no The model spec never changed, and `glm` is deterministic given its training rows. What changed is the test set you graded it on, not the model.
- 240 rows is simply too few to fit any model at all ::no More data would tighten the swing, but it is not the cause. Even with plenty of data, scoring on one small slice gives a noisy estimate. The lesson is about the estimate, not the sample size.
- The accuracy you measure depends on which rows land in the test set, so a single number is a noisy estimate ::ok Exactly. The test accuracy is itself a random quantity: change the held-out rows and you change the score. One split hands you one noisy draw of it, which is why averaging many is the fix.

=== step === concept
::eyebrow The idea
## Use every row as a test row

Cross-validation kills the luck by not choosing one split at all. Split the data into \(k\) equal parts, called folds. Take fold 1 as the validation set, train on the other \(k-1\) folds, and score. Then let fold 2 be the validation set and repeat, and so on, until every fold has had exactly one turn as the holdout. You get \(k\) scores, and every row is validated exactly once.

The single number you report is their average. If \(e_j\) is the score on fold \(j\), the cross-validated estimate is

\[ \widehat{\text{Err}}_{\text{CV}} = \frac{1}{k} \sum_{j=1}^{k} e_j \]

and because it is an average of \(k\) draws, its standard error, how much that average itself would wobble if you reran it, is

\[ \mathrm{SE} = \frac{s}{\sqrt{k}} \]

where \(s\) is the standard deviation of the \(k\) fold scores and \(k\) is the number of folds. The \(\sqrt{k}\) in the denominator is the whole point: averaging more folds shrinks the noise in your estimate. Step through the folds below and watch the per-fold scores collapse into one steadier CV mean.

::widget cv-folds {"k":5}

[NOTE]
More folds means less bias (each model trains on more of the data) but more compute (you fit the model \(k\) times). Five and ten are the usual choices; ten-fold is the common default.

=== step === concept
::eyebrow The tool
## Make the folds with rsample

`rsample` turns "split the data" into tidy objects you can hold and reuse. First carve off a final test set with `initial_split` and never touch it until the very end. Then make the folds out of the **training** part only. Passing `strata = defaulted` keeps the yes/no balance steady in every fold, so no fold is accidentally all non-defaulters.

```r
library(rsample)
set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)   # 179 rows to build and cross-validate on
test  <- testing(split)    # 61 rows locked away for the final check
folds <- vfold_cv(train, v = 5, strata = defaulted)
folds
#>  5-fold cross-validation using stratification
#> # A tibble: 5 x 2
#>   splits           id
#>   <list>           <chr>
#> 1 <split [142/37]> Fold1
#> 2 <split [143/36]> Fold2
#> 3 <split [143/36]> Fold3
#> 4 <split [144/35]> Fold4
#> 5 <split [144/35]> Fold5
```

The `folds` tibble has one row per fold, and each `<split [142/37]>` says "142 rows to train on, 37 held out to score." Those two halves of any single fold have names: `analysis()` is the part you train on, `assessment()` is the part you score on. (rsample avoids "train/test" here so you do not confuse a fold's inner split with the final test set you locked away.)

```r
first <- folds$splits[[1]]
first
#> <Analysis/Assess/Total>
#> <142/37/179>
nrow(analysis(first))     # rows used to TRAIN inside fold 1
#> [1] 142
nrow(assessment(first))   # rows held out to SCORE fold 1
#> [1] 37
```

=== step === tryit
::eyebrow Your turn
## Ask for ten folds

Five folds gave five scores. Ten-fold cross-validation, the common default, gives ten. Change the fold count so `vfold_cv` builds ten folds from the training set.

```r
set.seed(1)
folds10 <- vfold_cv(train, v = ____, strata = defaulted)   # ten folds
nrow(folds10)
```
::check {"regex":"v\\s*=\\s*10","gate":true,"difficulty":"beginner","ok":"Right. v = 10 makes ten folds, so the model is fit ten times and you average ten scores: less bias, a bit more compute.","no":"Set the number of folds with v = 10."}
::solution
```r
set.seed(1)
folds10 <- vfold_cv(train, v = 10, strata = defaulted)
nrow(folds10)   # one row per fold
#> [1] 10
```

=== step === concept
::eyebrow The payoff
## Run the workflow across every fold

Now the moment it pays off. `fit_resamples` takes your whole workflow and your folds, and for each fold it preps the recipe on that fold's analysis rows, fits the model, scores on the assessment rows, and hands back every fold's metrics. You write one line; it does the loop.

```r
library(recipes)
library(parsnip)
library(workflows)
library(tune)
library(yardstick)

rec  <- recipe(defaulted ~ ., data = train) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())
spec <- logistic_reg() |> set_engine("glm") |> set_mode("classification")
wf   <- workflow() |> add_recipe(rec) |> add_model(spec)

set.seed(3)
cv_results <- fit_resamples(wf, folds, metrics = metric_set(accuracy, roc_auc))
collect_metrics(cv_results)
#> # A tibble: 2 x 6
#>   .metric  .estimator  mean     n std_err .config
#>   <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1 accuracy binary     0.648     5  0.0275 pre0_mod0_post0
#> 2 roc_auc  binary     0.613     5  0.0481 pre0_mod0_post0
```

There it is: cross-validated accuracy **0.648**, with a standard error of **0.0275** across the five folds. That single, steady number sits right in the middle of the wild 0.567-to-0.750 range a single split was handing you, and now it comes with an honest sense of its own precision. (The table carries a second row, `roc_auc`, another way to score a classifier; read the `accuracy` row for now and we will unpack `roc_auc` in Lesson 5.)

[WARNING]
Notice you passed the whole **workflow**, not pre-baked data. That is deliberate. `fit_resamples` re-preps the recipe inside each fold, learning the normalization and dummy coding from that fold's analysis rows only. The assessment rows never touch preprocessing, so the leakage you closed in Lesson 3 stays closed, on every fold. Resampling baked data instead would let each fold's holdout leak into its own scaling, and quietly inflate the score.

=== step === quiz
::eyebrow Check yourself
## What does the standard error mean?

`collect_metrics` reports accuracy `mean = 0.648` with `std_err = 0.0275` over five folds. What does that 0.0275 tell you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It is the model's average prediction error, so it gets about 2.75% of cases wrong ::no That confuses two different things. The accuracy (0.648) already measures how often the model is right. The standard error is about the estimate 0.648, not about individual predictions.
- It means 2.75% of the held-out applicants were misclassified ::no Misclassification is captured by accuracy itself. The standard error does not count wrong predictions; it measures the spread of the five fold scores.
- It is the uncertainty of the 0.648 itself: rerun the folds and the cross-validated mean would typically move by about that much ::ok Exactly. The standard error is the wobble of the estimate, not the model's error. A small one says 0.648 is a firm number you can report; a large one warns you to add folds or get more data before trusting it.

=== step === widget
::eyebrow The other resample
## The bootstrap: sample with replacement

Cross-validation is one way to resample. The **bootstrap** is the other, and it makes its splits differently. Instead of cutting the data into folds, it draws a sample the same size as the training set **with replacement**: some rows get picked two or three times, and some are not picked at all. The rows left out, about 37% of them on average, become that resample's held-out set, the **out-of-bag** rows.

::widget bootstrap-sample {"seed":7,"tail":"Each bootstrap draws 179 rows with replacement, so duplicates crowd in and about a third of the rows sit out as the out-of-bag set."}

In rsample, `bootstraps()` builds them just like `vfold_cv` built folds. Look at the analysis and assessment sizes: every analysis set is the full 179 (padded with duplicates), and each out-of-bag set is a different size near a third.

```r
set.seed(2)
boots <- bootstraps(train, times = 30)
boots
#> # Bootstrap sampling
#> # A tibble: 30 x 2
#>    splits           id
#>    <list>           <chr>
#>  1 <split [179/63]> Bootstrap01
#>  2 <split [179/65]> Bootstrap02
#>  3 <split [179/70]> Bootstrap03
#>  4 <split [179/57]> Bootstrap04
#>  5 <split [179/74]> Bootstrap05
#> # i 25 more rows
```

```r
b1 <- boots$splits[[1]]
nrow(analysis(b1))     # the bootstrap sample, same size as train (with repeats)
#> [1] 179
nrow(assessment(b1))   # the out-of-bag rows left out this draw
#> [1] 63
```

You hand `boots` to `fit_resamples` exactly as you handed it `folds`. So when do you reach for which? Use **k-fold cross-validation** as your default for an honest estimate of test performance, since every row is scored exactly once. Reach for the **bootstrap** when you want many resamples to study how stable an estimate is, or to build confidence intervals, which is why it powers the out-of-bag error inside a random forest.

=== step === quiz
::eyebrow Check yourself
## How is the bootstrap's holdout formed?

In 5-fold cross-validation, every row is held out exactly once, in its own fold. In a bootstrap resample of the same 179 training rows, how is the held-out (assessment) set formed instead?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A fixed 20% of the rows, the same share every time, like a small test split ::no The held-out fraction is not fixed: the assessment sizes above were 63, 65, 70, 57, 74. It floats around a third because it depends on which rows the random draw happened to skip.
- The rows not drawn in this sample, the out-of-bag rows, a different set of roughly a third each draw ::ok Right. The bootstrap draws with replacement until it has a full-size sample; whatever rows it never picked, about 37% on average, are that resample's out-of-bag holdout, and a fresh draw leaves out a different set.
- Every row is held out exactly once across the resamples, just like cross-validation ::no That is the defining property of k-fold cross-validation, not the bootstrap. With replacement, some rows are held out many times and some never, so the once-each guarantee does not hold.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [rsample package documentation (tidymodels)](https://rsample.tidymodels.org/) - the official reference for `initial_split()`, `vfold_cv()`, `bootstraps()`, `analysis()`, and `assessment()`.
- [Tidy Modeling with R, ch. 10: Resampling for evaluating performance](https://www.tmwr.org/resampling) - Kuhn and Silge on why one split is not enough and how `fit_resamples` works, end to end.
- [Get Started: Evaluate your model with resampling](https://www.tidymodels.org/start/resampling/) - the official walk-through that runs a workflow across folds and collects the metrics.
- [An Introduction to Statistical Learning, ch. 5: Resampling Methods (free PDF)](https://www.statlearning.com/) - the textbook treatment of cross-validation and the bootstrap, with the math behind the estimates.

=== step === complete
## Lesson 4 complete

You no longer report a model's accuracy from one lucky split. You build folds or bootstrap resamples with rsample, run the whole workflow across them with `fit_resamples`, and read a cross-validated mean that comes with an honest standard error. That single change is the difference between a number you hope is right and one you can defend.

Next, Lesson 5: Measure with yardstick. You averaged accuracy here, but accuracy is rarely the metric that matters. You will choose the right metrics for the job, compute them as a set, and read them across all your resamples at once.

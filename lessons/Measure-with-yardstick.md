---
title: "tidymodels Lesson 5: Measure with yardstick"
catalog_blurb: "Pick metrics that fit your goal and read them across folds."
description: "Choose the right metrics for an R model with yardstick: confusion matrix, precision, recall, F1, ROC and AUC, metric sets, and reading them across resampling folds."
keywords: "yardstick, tidymodels metrics, confusion matrix in R, precision and recall, roc_auc, metric_set, sensitivity specificity, f_meas, collect_metrics, classification metrics R"
post_type: "LESSON"
curriculum_id: "6.50.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "5"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Tune-with-the-tune-package.html"
course_prev: "Resample-with-rsample.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Measure with yardstick

In Lesson 4 you handed the risk committee a number: the loan-default model scores **0.648 accuracy**, cross-validated, give or take a little. It felt solid. Then someone at the table tries something lazy: a "model" that simply stamps **no default** on every single applicant. On this loan book that scores about **63%** too, higher than a fair few real models, and it catches exactly **zero** defaulters. If a do-nothing rule can match your model on accuracy, then accuracy was never the yardstick that mattered.

This lesson is about choosing the yardstick on purpose. The `yardstick` package gives you a whole toolbox of metrics; the skill is knowing which one answers your question.

By the end you will be able to:

- Read a confusion matrix and say why accuracy alone can flatter a useless model
- Compute precision, recall and specificity, and pick the one that matches the business cost
- Tell a hard-class metric from a probability metric, and read an ROC curve and its AUC
- Bundle your chosen metrics into a metric set and read them across every resample

**Prerequisites:** you can run R and use the `|>` pipe, and you can [bundle a recipe and a model into a workflow and resample it](Resample-with-rsample.html) (Lesson 4).

::widget roc-curve {}

=== step === concept
::eyebrow The trap
## When accuracy flatters a useless model

Here is the lender's loan book again, rebuilt right here so this page runs on its own. Each row is one applicant; `defaulted` is what we are trying to predict. We set the factor levels so that **yes** (a default) comes first, because that is the outcome the bank cares about catching.

```r
library(dplyr)
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
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"), levels = c("yes", "no"))
table(loans$defaulted)
#>
#> yes  no
#>  89 151
```

Of 240 applicants, **89 defaulted** and **151 did not**. The classes are lopsided: only about 37% of applicants are defaulters. That imbalance is exactly what lets accuracy lie. Watch what the do-nothing rule scores:

```r
mean(loans$defaulted == "no")   # accuracy if we predict "no default" for everyone
#> [1] 0.629
```

Predicting "no default" for everybody is right 62.9% of the time, purely because most applicants really do repay. It is a model with zero skill and a respectable-looking score. Now fit a genuine model, a logistic regression, on a training split and measure its accuracy on held-out applicants:

```r
library(rsample)
library(parsnip)
library(yardstick)

set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)
test  <- testing(split)

logit_spec <- logistic_reg() |> set_engine("glm") |> set_mode("classification")
fit        <- logit_spec |> fit(defaulted ~ ., data = train)

preds <- augment(fit, new_data = test)   # adds .pred_class, .pred_yes, .pred_no
accuracy(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.656
```

The real model scores **0.656**. It beat the do-nothing rule (0.629) by barely two points. If you reported only that number, the committee would think the model is roughly as good as guessing "no" every time. Accuracy is not wrong here, it is just answering the wrong question. To see what the model is really doing, we have to look at *which* applicants it gets right and wrong.

[NOTE]
`augment()` takes a fitted model and a data frame and adds the model's predictions as new columns: `.pred_class` (the predicted label at the usual 0.5 cutoff) and `.pred_yes` / `.pred_no` (the predicted probability of each class). Every yardstick metric reads one or more of those columns.

=== step === concept
::eyebrow The four outcomes
## The confusion matrix

A classifier can be right or wrong in two different ways each, so there are four possible outcomes. Laying them in a 2-by-2 table is called a **confusion matrix**. `yardstick::conf_mat()` builds it from the truth column and the predicted-class column:

```r
conf_mat(preds, truth = defaulted, estimate = .pred_class)
#>           Truth
#> Prediction yes no
#>        yes   7  5
#>        no   16 33
```

Read it in plain loan terms. Down the rows is what the model *predicted*; across the columns is the *truth*:

- **7** applicants it flagged as "yes" who really did default. A caught default. We call this a **true positive (TP)**.
- **5** it flagged as "yes" who actually repaid. A false alarm, a **false positive (FP)**: the bank hassles or declines a good customer.
- **16** it cleared as "no" who went on to default. A missed default, a **false negative (FN)**: the bank makes a loan it never gets back.
- **33** it cleared as "no" who really repaid. A correct approval, a **true negative (TN)**.

Those two mistakes are not equal. A false positive costs a little goodwill and a lost loan. A false negative, the 16 missed defaults, costs real money on loans that go bad. The whole reason accuracy misled us is that it treats all four cells as interchangeable and adds up only the diagonal.

The widget below is a small generic classifier so you can *feel* how the four cells work. Slide the threshold and watch every count re-tally. Your loan model's own matrix above is just one snapshot of this, taken at the 0.5 cutoff.

::widget roc-curve {}

[NOTE]
yardstick treats the **first** level of the outcome factor as the "positive" class, the event you are trying to detect. That is why we built `defaulted` with `levels = c("yes", "no")`: it makes a default the positive class, so precision and recall below measure catching defaulters, not clearing good applicants.

=== step === quiz
::eyebrow Check yourself
## Which mistake costs the bank?

The loan model made two kinds of error: 5 false positives (good applicants it flagged) and 16 false negatives (defaulters it cleared). Which one is the expensive mistake, the one that actually loses money on a bad loan?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A non-defaulter predicted to default (a false positive) ::no That is a false alarm: the bank reviews or declines a good applicant. It costs some goodwill and a missed loan, but not a loan loss.
- A defaulter predicted not to default (a false negative) ::ok Right. The bank approves a loan that is never repaid. The missed default, the false negative, is usually far more expensive than a false alarm, which is exactly why we will not settle for accuracy.
- A non-defaulter predicted not to default (a true negative) ::no That is a correct call: a good applicant approved. Nothing goes wrong in that cell.

=== step === concept
::eyebrow Two honest questions
## Precision and recall

Once you have the four cells, you can ask two very different questions, and each has its own metric. Let \(TP\), \(FP\) and \(FN\) be the true-positive, false-positive and false-negative counts from the confusion matrix.

**Precision** answers "when the model flags an applicant as a default, how often is it right?"

\[ \text{precision} = \frac{TP}{TP + FP} = \frac{7}{7 + 5} = 0.583 \]

**Recall** (also called **sensitivity**) answers the opposite: "of all the applicants who really defaulted, how many did the model catch?"

\[ \text{recall} = \frac{TP}{TP + FN} = \frac{7}{7 + 16} = 0.304 \]

There is a third that watches the other class. **Specificity** answers "of all the applicants who really repaid, how many did the model correctly clear?", using \(TN\) (true negatives) and \(FP\):

\[ \text{specificity} = \frac{TN}{TN + FP} = \frac{33}{33 + 5} = 0.868 \]

yardstick has a function for each, and they read the same two columns `conf_mat` did:

```r
precision(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary         0.583

recall(preds, truth = defaulted, estimate = .pred_class)   # same as sens()
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.304

spec(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 spec    binary         0.868
```

Now the model's real behaviour is visible. Its **specificity is 0.868**, so it clears good applicants well, and its **precision is 0.583**, so a bit more than half its flags are genuine. But its **recall is only 0.304**: it catches under a third of the applicants who actually default. That failure was completely hidden inside the 0.656 accuracy. The chart makes the gap obvious, accuracy and specificity stand tall while recall sits on the floor.

::widget chart-plotter {"data":[{"x":"accuracy","y":0.656},{"x":"precision","y":0.583},{"x":"recall","y":0.304},{"x":"specificity","y":0.868}],"geoms":["bar"],"x":"metric","y":"score"}

=== step === tryit
::eyebrow Your turn
## Compute the metric that matters

For a lender, the number that keeps the risk team awake is recall: the share of real defaulters the model actually catches. Complete the call so it computes recall on the test predictions.

```r
library(yardstick)
____(preds, truth = defaulted, estimate = .pred_class)
```
::check {"regex":"recall\\s*\\(|sens\\s*\\(","gate":true,"difficulty":"beginner","ok":"Recall is 0.304: the model catches about three of every ten real defaulters. That, not accuracy, is the number the risk team should track.","no":"Use the recall() function: recall(preds, truth = defaulted, estimate = .pred_class). (sens() gives the same value.)"}
::solution
```r
recall(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.304
```

=== step === concept
::eyebrow One number, honestly
## F1: balancing precision and recall

Sometimes you want a single score that rewards a model only when precision *and* recall are both decent. Averaging them the usual way is too forgiving: a model with precision 0.95 and recall 0.05 would average to a cosy 0.50 while catching almost nothing. The **F1 score** fixes this by taking the *harmonic* mean, which is dragged down hard by the smaller of the two:

\[ F_1 = \frac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}} = \frac{2 \cdot 0.583 \cdot 0.304}{0.583 + 0.304} = 0.400 \]

Because recall (0.304) is so weak, F1 lands at 0.400, well below the halfway point between the two. yardstick computes it with `f_meas()`:

```r
f_meas(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 f_meas  binary           0.4
```

F1 is the go-to single number when the positive class is rare and both error types matter, which is precisely the loan-default situation. It refuses to be fooled by a high score on one side alone.

=== step === quiz
::eyebrow Check yourself
## Reading precision, recall and F1

The loan model scores precision **0.58**, recall **0.30**, and F1 **0.40**. In plain terms, what is it doing?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- When it does flag an applicant it is right more often than not, but it flags far too few of the real defaulters ::ok Exactly. Precision 0.58 means a slim majority of flags are genuine; recall 0.30 means it misses about seven of every ten defaulters. F1 stays low because the harmonic mean is pulled toward that weak recall.
- It catches almost every defaulter but raises a flood of false alarms ::no That is the opposite pattern: high recall, low precision. Here recall (0.30) is the weak number, so it MISSES most defaulters rather than over-flagging them.
- It is a strong model overall, since F1 (0.40) is close to its precision ::no F1 0.40 sits well below precision 0.58; the harmonic mean is dragged toward the smaller value (recall), which is a warning sign, not reassurance.

=== step === widget
::eyebrow The hidden dial
## Every hard-class metric hides a threshold

Here is something the metrics so far quietly assumed. Accuracy, precision, recall and F1 all read `.pred_class`, the predicted *label*. But that label was not handed down from on high: it was made by cutting the predicted probability at **0.5**. Score above 0.5, call it "yes"; below, call it "no". Move that cutoff and every one of those metrics changes.

Slide the threshold in the widget below. Push it down and the model flags more applicants: recall climbs (you catch more defaulters) but precision falls (more false alarms). Push it up and the trade reverses. The single operating point traces out a curve as you sweep, and that curve is the subject of the next step.

::widget roc-curve {}

[KEY INSIGHT]
There is no universally correct threshold. A bank chasing missed defaults would lower it to raise recall; a lender worried about rejecting good customers would raise it to protect precision. The right cutoff is a business decision, not a statistical one.

=== step === concept
::eyebrow Score every threshold at once
## The ROC curve and AUC

If the "best" threshold depends on the business, it would be useful to have a metric that does not commit to any single one. That is the **ROC curve**. As you sweep the threshold from high to low, you plot the **true-positive rate** (recall, the defaulters you catch) against the **false-positive rate** (the good applicants you wrongly flag). Each threshold is one point; the whole sweep is the curve you just watched form.

The single number that summarizes the whole curve is the **AUC**, the area under it. It has a clean interpretation. If \(\hat{p}_+\) is the model's predicted default-probability for a randomly chosen real defaulter and \(\hat{p}_-\) the same for a randomly chosen non-defaulter, then

\[ \text{AUC} = P(\hat{p}_+ > \hat{p}_-) \]

the probability that the model scores a true defaulter higher than a true non-defaulter. An AUC of 1.0 is a perfect ranker; 0.5 is a coin flip. Crucially, it never fixes a threshold, so it measures how well the model *ranks* applicants by risk, not how it labels them.

Here is the vital yardstick detail. A hard-class metric like `accuracy` reads the label column `.pred_class`. A probability metric like `roc_auc` must read the *probability* column, `.pred_yes`, because it needs a score to sweep, not a pre-made label:

```r
roc_auc(preds, truth = defaulted, .pred_yes)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary         0.625
```

The loan model's AUC is **0.625**: better than a coin flip, but only modestly. Notice we passed `.pred_yes`, not `.pred_class`. Hand `roc_auc` the label column instead and it errors, because a fixed 0/1 label has no ranking left to sweep.

=== step === quiz
::eyebrow Check yourself
## Which column does AUC need?

You want to score the loan model with `roc_auc`. Which column does yardstick need, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The predicted class `.pred_class`, because AUC compares predicted labels against the truth ::no roc_auc never looks at a hard label. Hand it `.pred_class` and yardstick errors: a 0/1 label has no ordering to sweep a threshold across.
- The predicted probability `.pred_yes`, because AUC sweeps every threshold and needs a score to rank applicants by ::ok Right. AUC is threshold-free: it ranks applicants by predicted probability and asks how often a real defaulter outranks a non-defaulter, so it needs the probability column, not the 0.5-thresholded label.
- Either column works; yardstick figures out what you meant ::no It does not guess. Class metrics (accuracy, recall) take `.pred_class`; probability metrics (roc_auc, log-loss) take a probability column. Mixing them up is a common error.

=== step === concept
::eyebrow Compute them together
## Bundle metrics into a metric set

You rarely want one metric in isolation; you want a small dashboard of them. `metric_set()` bundles any mix of metrics into a single function you can call once. Because our set mixes hard-class metrics (accuracy, sensitivity, specificity) with a probability metric (roc_auc), we hand the resulting function *both* the class column and the probability column, and it routes each metric to the one it needs:

```r
loan_metrics <- metric_set(accuracy, sens, spec, roc_auc)

loan_metrics(preds, truth = defaulted, estimate = .pred_class, .pred_yes)
#> # A tibble: 4 x 3
#>   .metric  .estimator .estimate
#>   <chr>    <chr>          <dbl>
#> 1 accuracy binary         0.656
#> 2 sens     binary         0.304
#> 3 spec     binary         0.868
#> 4 roc_auc  binary         0.625
```

One call, four numbers, chosen on purpose: overall accuracy, how many defaulters we catch (sens), how many good applicants we clear (spec), and how well we rank risk (roc_auc). That `loan_metrics` object is now a reusable yardstick you can point at any set of predictions.

=== step === concept
::eyebrow The honest picture
## Read the metrics across every resample

A metric set truly earns its keep when you combine it with the resampling from Lesson 4. One test split gave the numbers above, but you already know one split is a roll of the dice. So hand your metric set to `fit_resamples`, which scores the workflow on every fold, and `collect_metrics` averages each metric with its standard error. This is the same loan workflow you built in Lesson 4, now measured with the yardstick we chose:

```r
library(recipes)
library(workflows)
library(tune)

rec <- recipe(defaulted ~ ., data = train) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())
wf  <- workflow() |> add_recipe(rec) |> add_model(logit_spec)

set.seed(1)
folds <- vfold_cv(train, v = 5, strata = defaulted)

set.seed(3)
cv <- fit_resamples(wf, folds, metrics = loan_metrics)
collect_metrics(cv)
#> # A tibble: 4 x 6
#>   .metric  .estimator  mean     n std_err .config
#>   <chr>    <chr>      <dbl> <int>   <dbl> <chr>
#> 1 accuracy binary     0.648     5  0.0275 pre0_mod0_post0
#> 2 roc_auc  binary     0.613     5  0.0481 pre0_mod0_post0
#> 3 sens     binary     0.258     5  0.0400 pre0_mod0_post0
#> 4 spec     binary     0.876     5  0.0259 pre0_mod0_post0
```

Now the committee gets the honest story, all four metrics at once, each with a mean and a spread. Accuracy holds at **0.648** (exactly the figure from Lesson 4). But look at **sensitivity: 0.258**. Averaged across five folds, the model catches barely a quarter of defaulters. That is the finding accuracy was hiding all along, and now it comes with a standard error so you know how firm it is.

The standard error matters because the per-fold scores swing. Here are the AUC values fold by fold; the 0.0481 standard error is summarizing that spread, from a weak 0.52 up to a much healthier 0.78:

::widget chart-plotter {"data":[{"x":"Fold1","y":0.571},{"x":"Fold2","y":0.538},{"x":"Fold3","y":0.779},{"x":"Fold4","y":0.661},{"x":"Fold5","y":0.517}],"geoms":["bar"],"x":"fold","y":"roc_auc"}

[WARNING]
Choose the metric that matches the decision *before* you look at the scores. Fishing through a metric set for the one that makes the model look best, and reporting only that, is a quiet way to lie to yourself. Here the decision (catch defaulters) points to recall, and recall says the model needs work.

=== step === tryit
::eyebrow Your turn
## Build the report's metric set

The risk team has decided the report will lead with recall (catching defaulters) and back it with AUC (how well the model ranks risk). Complete the metric set so it bundles exactly those two, then it is scored on the test predictions.

```r
report_metrics <- metric_set(recall, ____)
report_metrics(preds, truth = defaulted, estimate = .pred_class, .pred_yes)
```
::check {"regex":"metric_set\\s*\\(\\s*recall\\s*,\\s*roc_auc\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That is the report's yardstick: recall for how many defaulters you catch, roc_auc for how well you rank risk. One object, reusable on any predictions.","no":"Add roc_auc as the second metric: metric_set(recall, roc_auc). roc_auc is the probability metric, which is why the call also passes the .pred_yes column."}
::solution
```r
report_metrics <- metric_set(recall, roc_auc)
report_metrics(preds, truth = defaulted, estimate = .pred_class, .pred_yes)
#> # A tibble: 2 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.304
#> 2 roc_auc binary         0.625
```

=== step === concept
::eyebrow The other half of yardstick
## And it measures regression too

Everything so far has been classification, but yardstick uses the exact same grammar for a numeric outcome. Predicting a house price instead of a yes/no label? The metrics change to `rmse` (root mean squared error, in the units of the outcome), `mae` (mean absolute error) and `rsq` (R-squared, the share of variance explained), but `metric_set` and the truth-and-estimate call are identical:

```r
library(tibble)
set.seed(10)
homes <- tibble(
  area  = round(runif(60, 700, 2600)),                       # square feet
  price = round(40000 + 95 * area + rnorm(60, 0, 25000))     # sale price, dollars
)
home_fit    <- lm(price ~ area, data = homes)
home_scored <- homes |> mutate(.pred = predict(home_fit))

reg_metrics <- metric_set(rmse, mae, rsq)
reg_metrics(home_scored, truth = price, estimate = .pred)
#> # A tibble: 3 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 rmse    standard   22998.
#> 2 mae     standard   19422.
#> 3 rsq     standard       0.838
```

Same idea, different yardsticks: on average the price predictions are off by about 19,400 dollars (mae), and the model explains 84% of the variation in price (rsq). You will lean on these in the regression course; the point here is that the yardstick workflow you just learned, choose, bundle, resample, carries straight over.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [yardstick package documentation (tidymodels)](https://yardstick.tidymodels.org/) - the reference for every metric used here, with its formula and required columns.
- [yardstick: Metric types](https://yardstick.tidymodels.org/articles/metric-types.html) - the class-metric vs probability-metric distinction, and why a mixed metric set needs both columns.
- [Tidy Modeling with R, ch. 9: Judging model effectiveness](https://www.tmwr.org/performance) - Kuhn and Silge on choosing metrics and reading them across resamples, end to end.
- [Fawcett (2006), An introduction to ROC analysis](https://doi.org/10.1016/j.patrec.2005.10.010) - the canonical, readable explanation of ROC curves and AUC.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - sensitivity, specificity and the ROC curve in the wider context of classification.

=== step === complete
## Lesson 5 complete

You no longer report a single accuracy number and hope. You read the confusion matrix, choose precision, recall, specificity or F1 to match the actual cost of each mistake, tell a hard-class metric from a threshold-free probability metric like AUC, and bundle your choices into a metric set you can read across every resample, with an honest spread.

The loan model told you as much: 0.65 accuracy looked fine until recall of 0.26 revealed it catches barely a quarter of defaulters. Knowing that is the difference between a model that scores well and one that does its job.

Next, Lesson 6: Tune with the tune package. A weak recall is often a tuning problem. You will search over a model's hyperparameters with resampling, use a metric set exactly like this one to score every candidate, and let the data pick the settings that lift the number you actually care about.

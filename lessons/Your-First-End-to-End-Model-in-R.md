---
title: "ML Workflow Lesson 4: Your First End-to-End Model in R"
catalog_blurb: "Take one dataset from raw rows to a fitted, checked, reproducible model."
description: "Build a machine learning model in R end to end: split the data, fit a classifier, predict on held-out customers, and evaluate it with precision and recall."
keywords: "end-to-end machine learning in R, ML workflow, train test split, logistic regression, glm, predict, confusion matrix, precision and recall, reproducibility, set.seed, churn model"
post_type: "LESSON"
curriculum_id: "6.10.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-ml-workflow"
course_title: "The Machine Learning Workflow in R"
course_lesson: "4"
course_total: "4"
course_landing: "R-ML-Workflow-Course.html"
course_next: ""
course_prev: "Train-Validation-Test-and-Data-Leakage.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Your First End-to-End Model in R

Three lessons of groundwork come together here. You learned to frame a business question as a prediction task (Lesson 1), why a more flexible model can still fail on new data (Lesson 2), and how to set aside honest data with no leaks (Lesson 3). Now you build the whole thing: one model, start to finish.

Remember Priya from Lesson 1? She runs retention at FreshBox, the meal-kit subscription, and wanted to catch customers who are about to cancel so a small win-back offer reaches only them. Back then we only framed her problem. Today we actually build her model: split, fit, predict, evaluate, and make every number reproducible.

By the end of this lesson you will be able to:

- Run a complete workflow on one dataset: split, fit, predict, evaluate
- Fit a classifier on the training rows and score customers it has never seen
- Judge the model with a confusion matrix and the metric that matches Priya's decision, not just accuracy
- Make the entire run reproducible with a fixed seed and one script

**Prerequisites:** you can run R and read its output, and you have the three earlier lessons: [Framing a Problem as ML](Framing-a-Problem-as-ML.html), [The Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html), and [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html).

The five stages below are the whole journey. We walk through each one on Priya's real data.

::widget process-flow {"steps":[{"title":"Set the seed","sub":"fix the randomness so every run is identical"},{"title":"Split","sub":"hold out a test set before touching the data"},{"title":"Fit","sub":"learn the model on the training rows only"},{"title":"Predict","sub":"score the held-out customers the model never saw"},{"title":"Evaluate","sub":"measure with a metric that matches the decision"}]}

=== step === concept
::eyebrow The data
## One table, and a seed before anything else

Priya's raw data is one table: one row per FreshBox customer, holding the handful of facts she knows at decision time. Each lesson here runs in a fresh session, so we build that table inline. The very first line is `set.seed`, before a single random number is drawn, because reproducibility starts at the first random call, not at the end.

```r
set.seed(2025)                                    # reproducibility from the first line
n <- 900
customers <- data.frame(
  days_since_last = round(runif(n, 1, 60)),       # recency: days since last order
  orders_90d      = rpois(n, 6),                  # frequency: orders in the last 90 days
  avg_basket      = round(rnorm(n, 55, 15), 1),   # monetary: average order value ($)
  tenure_mo       = round(runif(n, 1, 48))        # months a subscriber
)
# who actually cancelled next month: risk rises with recency, falls with frequency and tenure
lp <- -0.6 + 0.055 * customers$days_since_last - 0.28 * customers$orders_90d -
      0.02 * customers$tenure_mo
customers$churned <- factor(ifelse(runif(n) < plogis(lp), "yes", "no"),
                            levels = c("no", "yes"))
table(customers$churned)
#> 
#>  no yes 
#> 643 257
```

Nine hundred customers, of whom 257 churned. The four features are the classic customer-health signals: how recently someone ordered, how often, how much, and how long they have been a subscriber. `churned` (yes or no) is the target Priya wants to predict. That last column is decided by a rule we will never hand the model, exactly as real churn is decided by the world, not by us.

=== step === concept
::eyebrow Reproducibility
## What set.seed actually does

A computer's "random" numbers are not truly random: they come from a formula with a starting point. `set.seed` fixes that starting point. Give it the same number and you get the same sequence of draws, every time, on any machine. Watch:

```r
set.seed(1); sample(1:20, 4)
#> [1] 4 7 1 2
set.seed(1); sample(1:20, 4)   # same seed, the very same "random" draw
#> [1] 4 7 1 2
set.seed(99); sample(1:20, 4)  # a different seed, a different draw
#> [1] 16  1 12  3
```

Same seed, same four numbers. Change the seed and the draw changes. This is why every reproducible analysis pins its seed: it turns "random" into "random but repeatable," so your result is something a colleague can recreate exactly rather than merely something close.

=== step === quiz
::eyebrow Check yourself
## What makes a run reproducible?

Priya emails her script to a teammate. He runs it and gets slightly different coefficients and a different recall every single time he reruns it. What one change makes every run land on identical numbers?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Call set.seed() before the random split, so the same rows are drawn every time ::ok Right. The split (and the simulated data) come from random draws; fixing the seed makes those draws repeatable, so every run produces the exact same train and test rows, and therefore the same numbers.
- Collect more customers, so the estimates settle down and stop moving ::no More data steadies an estimate, but two runs still differ every time: without a fixed seed the split is freshly random on each run.
- Fit the model twice and average the two fits ::no Refitting on the same rows gives the same fit. The run-to-run wobble comes from the random split, which only a fixed seed removes.

=== step === concept
::eyebrow Look first
## Before you model, look

Good practice is to eyeball the data before fitting anything. This is only a look, not a decision: we are not choosing features or transforms from it, so nothing about the test customers leaks into the model. We just want to know whether there is any visible signal to learn.

Each dot below is a FreshBox customer. The horizontal axis is recency (days since their last order) and the vertical axis is frequency (orders in the last 90 days). The colour marks what actually happened: one colour for customers who churned, another for those who stayed. Press Run to draw the real chart.

::widget chart-plotter {"data":[{"x":34,"y":7,"fill":"churned"},{"x":13,"y":1,"fill":"churned"},{"x":40,"y":4,"fill":"churned"},{"x":50,"y":6,"fill":"churned"},{"x":59,"y":6,"fill":"churned"},{"x":57,"y":6,"fill":"churned"},{"x":50,"y":1,"fill":"churned"},{"x":57,"y":3,"fill":"churned"},{"x":46,"y":2,"fill":"churned"},{"x":47,"y":8,"fill":"stayed"},{"x":53,"y":5,"fill":"stayed"},{"x":15,"y":5,"fill":"stayed"},{"x":10,"y":8,"fill":"stayed"},{"x":44,"y":4,"fill":"stayed"},{"x":3,"y":3,"fill":"stayed"},{"x":49,"y":14,"fill":"stayed"},{"x":36,"y":11,"fill":"stayed"},{"x":14,"y":6,"fill":"stayed"}],"x":"days_since_last","y":"orders_90d","geoms":["point"],"code":{"point":"ggplot(df, aes(days_since_last, orders_90d, colour = group)) +\n  geom_point(size = 2.6)"}}

The churned customers lean toward the lower right: more days since their last order, fewer recent orders. But the two groups overlap, plenty of stayers sit right among them. That overlap is the whole reason Priya needs a model: no single cutoff cleanly separates churn from stay, so we want something that weighs all four features together and outputs a graded probability instead of a hard rule.

=== step === concept
::eyebrow Split
## Hold out an honest test set

Straight from Lesson 3: before we fit anything, we hide a slice of customers to judge the finished model on. The model trains as if those rows do not exist, and they become our stand-in for the future customers Priya will actually face. We hold out 30% for the test set and keep 70% to train on.

```r
set.seed(7)
test_id <- sample(nrow(customers), 0.3 * nrow(customers))  # 30% held out
test    <- customers[test_id, ]
train   <- customers[-test_id, ]
c(train = nrow(train), test = nrow(test))
#> train  test 
#>   630   270
```

One quick sanity check: a good split keeps the same class balance in both halves, so the test set is a fair sample of the whole.

```r
round(c(train = mean(train$churned == "yes"),
        test  = mean(test$churned  == "yes")), 3)
#> train  test 
#> 0.287 0.281
```

About 28% churn in each half. The split is honest and representative, and `test` will not be touched again until the very end.

=== step === concept
::eyebrow The model
## A model that outputs a probability

Priya does not want a bare yes or no; she wants a churn *probability* for each customer, so she can rank who is most at risk. Logistic regression does exactly that, in two moves.

First it combines the four features into a single score, a weighted sum:

\[ z = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_3 + \beta_4 x_4 \]

where \(x_1,\dots,x_4\) are the four features (recency, frequency, basket, tenure), each \(\beta_j\) (beta) is a weight the model learns, and \(\beta_0\) is a baseline offset. A large positive \(z\) means high risk; a large negative \(z\) means low risk. But \(z\) can be any number, and a probability must sit between 0 and 1. So the second move squashes \(z\) through the logistic (sigmoid) function:

\[ P(\text{churn}) = \sigma(z) = \frac{1}{1 + e^{-z}} \]

where \(e \approx 2.718\) is Euler's number and \(\sigma\) (sigma) is the name of this S-shaped squashing function. When \(z = 0\), \(\sigma(0) = 0.5\); as \(z\) climbs, the probability rises toward 1, and as \(z\) falls, it drops toward 0. Drag the threshold on the curve below to see how a continuous probability becomes a yes or no call, and how the mistakes trade off as you move it.

::widget logistic-curve {}

=== step === concept
::eyebrow Fit
## Learn the weights on the training rows only

Fitting means letting the model choose the weights (\(\beta_0\) through \(\beta_4\)) that best match the training customers. In R, `glm` with `family = binomial` fits exactly the logistic model from the last step. We fit on `train` alone, never on `test`, so the test set stays the honest stranger from Lesson 3.

```r
fit <- glm(churned ~ days_since_last + orders_90d + avg_basket + tenure_mo,
           family = binomial, data = train)
round(coef(fit), 3)
#>     (Intercept) days_since_last      orders_90d      avg_basket       tenure_mo 
#>          -0.867           0.047          -0.197          -0.004          -0.012
```

Read the signs, they tell Priya's story. `days_since_last` has a positive weight (+0.047): the longer since a customer's last order, the higher their churn risk. `orders_90d` (-0.197) and `tenure_mo` (-0.012) are negative: frequent, long-standing customers churn less. And `avg_basket` sits near zero (-0.004), so how much someone spends per order barely predicts whether they leave. The model discovered all of that from the training data alone.

[KEY INSIGHT]
A model is only as honest as the data it was fit on. Because we fit on `train` only, its coefficients, and every score we take from it next, owe nothing to the test customers we are about to grade it against.

=== step === concept
::eyebrow Predict
## Score the customers the model never saw

Now the honest test. We hand the fitted model the held-out customers and ask, for each one, its probability of churning. `predict` with `type = "response"` returns that probability; we then call anyone above a 0.5 cut a predicted churner.

```r
test$prob <- predict(fit, newdata = test, type = "response")  # P(churn) for each held-out customer
test$pred <- factor(ifelse(test$prob > 0.5, "yes", "no"), levels = c("no", "yes"))
head(data.frame(prob = round(test$prob, 2), predicted = test$pred, actual = test$churned))
#>   prob predicted actual
#> 1 0.18        no     no
#> 2 0.09        no    yes
#> 3 0.43        no     no
#> 4 0.22        no     no
#> 5 0.09        no     no
#> 6 0.57       yes    yes
```

The `newdata = test` argument is the whole game: we score the rows the model never trained on. Look at customer 2, the model gave them only a 9% churn chance, yet they actually churned. No model is perfect, and the next steps are about measuring exactly how often it is right, and in which direction it errs.

=== step === tryit
::eyebrow Your turn
## Predict one real customer

A single customer just tripped Priya's alarm: 45 days since their last order, only 2 orders in the last 90 days, a $60 average basket, and 10 months as a subscriber. Should the win-back coupon go out? Finish the line so `predict` scores this new customer with the fitted model. Fill in the blank.

```r
new_cust <- data.frame(days_since_last = 45, orders_90d = 2, avg_basket = 60, tenure_mo = 10)
round(predict(fit, ____, type = "response"), 3)
```
::check {"regex":"newdata\\s*=\\s*new_cust","gate":true,"difficulty":"intermediate","ok":"A 0.625 churn probability, well above a typical customer, so yes: this is exactly who the coupon is for.","no":"Point predict at the new customer with newdata = new_cust, the same argument you used to score the test set."}
::solution
```r
new_cust <- data.frame(days_since_last = 45, orders_90d = 2, avg_basket = 60, tenure_mo = 10)
round(predict(fit, newdata = new_cust, type = "response"), 3)
#>     1 
#> 0.625
```

=== step === concept
::eyebrow Evaluate
## Score it: the confusion matrix

A single accuracy number hides the mistakes that matter. The confusion matrix shows all four outcomes at once: for the held-out customers, what the model said versus what actually happened.

```r
cm <- table(actual = test$churned, predicted = test$pred)
cm
#>       predicted
#> actual  no yes
#>    no  181  13
#>    yes  45  31
```

Read it as four boxes. The model correctly cleared 181 stayers and correctly flagged 31 churners. It also made two kinds of error: 13 false alarms (customers it flagged who actually stayed) and, more painfully for Priya, 45 misses (churners it failed to flag). Three standard metrics summarise this, each answering a different question. Writing \(TP\) for the churners caught (31), \(FP\) for the false alarms (13), \(FN\) for the misses (45), and \(TN\) for the stayers correctly cleared (181):

\[ \text{accuracy} = \frac{TP + TN}{TP + TN + FP + FN}, \qquad \text{precision} = \frac{TP}{TP + FP}, \qquad \text{recall} = \frac{TP}{TP + FN} \]

Accuracy is the share of all calls that were right. Precision asks: of the customers we flagged, how many really churned? Recall asks: of the customers who really churned, how many did we catch? These are not the same question, and Priya cares far more about one of them.

```r
accuracy <- mean(test$pred == test$churned)
round(accuracy, 3)
#> [1] 0.785
```

=== step === tryit
::eyebrow Your turn
## Compute the recall yourself

Recall is the metric Priya lives by: of the customers who truly churned, what fraction did the model catch? From the confusion matrix `cm`, the churners caught are `cm["yes", "yes"]`, and all real churners are the whole "yes" row, `sum(cm["yes", ])`. Fill in the denominator.

```r
# recall = churners caught / all real churners
recall <- cm["yes", "yes"] / ____
round(recall, 3)
```
::check {"regex":"sum.*cm.*yes","gate":true,"difficulty":"intermediate","ok":"0.408: the model catches only about 41% of the customers who actually churn. That low recall is the problem we fix next.","no":"The denominator is every real churner, the entire yes row of the matrix. Sum that row."}
::solution
```r
recall <- cm["yes", "yes"] / sum(cm["yes", ])
round(recall, 3)
#> [1] 0.408
```

=== step === concept
::eyebrow The trap
## Is 78.5% accuracy good?

That sounds fine, until you meet the laziest possible model: always predict "stays." Since most customers do stay, that alone scores surprisingly well.

```r
baseline_acc <- mean(test$churned == "no")     # accuracy of always guessing "stays"
precision    <- cm["yes", "yes"] / sum(cm[, "yes"])
recall       <- cm["yes", "yes"] / sum(cm["yes", ])
round(c(baseline_acc = baseline_acc, model_acc = accuracy,
        precision = precision, recall = recall), 3)
#> baseline_acc    model_acc    precision       recall 
#>        0.719        0.785        0.705        0.408
```

The always-"stays" baseline is already 71.9% accurate, so our model's 78.5% is only a modest lift. Worse, its recall is 0.408: it catches fewer than half the customers who actually churn, and those are precisely the people Priya's coupon needs to reach. Accuracy flattered a model that is missing most of the churn.

The fix here is not a fancier model, it is a better threshold. We called anyone above 0.5 a churner. Lower that bar to 0.3, flagging every customer with at least a 30% chance of leaving, and recall climbs steeply.

```r
pred_30 <- factor(ifelse(test$prob > 0.3, "yes", "no"), levels = c("no", "yes"))
cm_30   <- table(actual = test$churned, predicted = pred_30)
recall_30    <- cm_30["yes", "yes"] / sum(cm_30["yes", ])
precision_30 <- cm_30["yes", "yes"] / sum(cm_30[, "yes"])
round(c(recall_30 = recall_30, precision_30 = precision_30), 3)
#> recall_30 precision_30 
#>     0.776        0.484
```

Now the model catches 77.6% of churners, up from 41%. The price is precision, down to 0.484, so about half of Priya's coupons go to people who would have stayed anyway. For her that is a fine trade: a wasted coupon costs a couple of dollars, a lost customer costs far more. The threshold is a business dial, not a fixed law.

[KEY INSIGHT]
There is no single "good" score. The right metric, and the right threshold, come from the cost of each kind of mistake. Choose them to match the decision, exactly as you learned to choose a metric back in Lesson 1.

=== step === quiz
::eyebrow Check yourself
## Which metric should Priya optimise?

A win-back coupon costs FreshBox about $3. A customer who churns unnoticed is worth hundreds in lost subscription revenue. Given those costs, which metric should Priya push hardest to improve?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Accuracy, because one number neatly summarises how often the model is right ::no Accuracy hides the error that hurts most: the lazy "everyone stays" model already scores 71.9% while catching zero churners, useless to Priya.
- Precision, so almost every flagged customer is truly about to churn ::no High precision means few wasted coupons, but coupons are cheap. Chasing precision makes the model cautious and lets real churners slip through unflagged.
- Recall, so she catches as many about-to-churn customers as possible ::ok Right. A missed churner is the expensive mistake, so Priya wants to catch as many as she can, even at the cost of a few wasted cheap coupons. That is why she lowered the threshold to lift recall.

=== step === concept
::eyebrow Reproduce
## Same seed, same answer

Every number in this lesson, the split, the coefficients, the recall, came from random draws. Without a fixed seed, rerunning the script would reshuffle the split and nudge every result. The seed makes the randomness repeatable, so you, Priya, and a colleague on another laptop all get identical numbers.

```r
set.seed(7); a <- sample(nrow(customers), 5)
set.seed(7); b <- sample(nrow(customers), 5)
identical(a, b)
#> [1] TRUE
```

Two draws, same seed, provably identical. That is reproducibility in one line.

[TIP]
Reproducibility is a habit, not an afterthought. Save the whole pipeline as one script (say `churn_model.R`) with `set.seed` at the top, and end an analysis with `sessionInfo()`, which records your R and package versions so anyone can recreate your exact environment months later.

=== step === concept
::eyebrow The whole thing
## Priya's model, end to end, in one script

Here is everything you built, top to bottom, as the single reproducible script Priya would save. Read it as the five stages from the cover: seed, split, fit, predict, evaluate. Run it and you get her headline number, the recall at the threshold she chose.

```r
# churn_model.R  -  the whole pipeline, reproducible start to finish
set.seed(2025)                                    # 1. fix the randomness
n <- 900
customers <- data.frame(
  days_since_last = round(runif(n, 1, 60)),
  orders_90d      = rpois(n, 6),
  avg_basket      = round(rnorm(n, 55, 15), 1),
  tenure_mo       = round(runif(n, 1, 48))
)
lp <- -0.6 + 0.055 * customers$days_since_last - 0.28 * customers$orders_90d -
      0.02 * customers$tenure_mo
customers$churned <- factor(ifelse(runif(n) < plogis(lp), "yes", "no"),
                            levels = c("no", "yes"))

set.seed(7)                                       # 2. split off an honest test set
test_id <- sample(nrow(customers), 0.3 * nrow(customers))
train   <- customers[-test_id, ]
test    <- customers[test_id, ]

fit <- glm(churned ~ days_since_last + orders_90d + avg_basket + tenure_mo,
           family = binomial, data = train)       # 3. fit on train only

test$prob <- predict(fit, newdata = test, type = "response")           # 4. predict
test$pred <- factor(ifelse(test$prob > 0.3, "yes", "no"),              # threshold Priya chose
                    levels = c("no", "yes"))

cm     <- table(actual = test$churned, predicted = test$pred)          # 5. evaluate
recall <- cm["yes", "yes"] / sum(cm["yes", ])
round(recall, 3)
#> [1] 0.776
```

One short script, and it never leaks, never fakes a number, and lands on the same 0.776 every single run. That is a complete, honest, reproducible model.

=== step === concept
::eyebrow Honest limits
## A first model, not the last word

Priya has a working, honest, reproducible model. It is a starting point, not the finish line, and a good data scientist says so out loud. Three limits are worth naming:

- **One split gives a noisy score.** Your test set was a single random 30% of customers. A different seed would hand you a slightly different accuracy and recall. The cure is cross-validation: rotate the held-out slice several times and average, for a steadier estimate. That is the heart of the next sections.
- **Logistic regression draws a straight boundary** (it is linear in the log-odds, the \(z\) from earlier). If churn depends on the features in a curvier way, a tree, a forest, or a boosted model may do better. The Classification and Boosting courses build those.
- **One threshold is one policy.** We picked 0.3 to favour recall. The right cut depends on the real cost of a missed churner versus a wasted coupon, a business decision to revisit as those costs change.

[NOTE]
None of these are reasons not to ship. They are the honest caveats that turn a model into a decision you can defend, and they are the exact questions the rest of the Data Scientist track answers.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this workflow further:

- [An Introduction to Statistical Learning, ch. 2 and 4 (free PDF)](https://www.statlearning.com/) - assessing model accuracy, and logistic regression as a classifier, at a gentle pace.
- [The Elements of Statistical Learning, ch. 7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - model assessment and selection: the rigorous account of test error and why a held-out estimate matters.
- [R for Data Science, 2nd edition (Wickham, Cetinkaya-Rundel, Grolemund)](https://r4ds.hadley.nz/) - the end-to-end data-analysis workflow in R, from raw data to a communicated result.
- [tidymodels](https://www.tidymodels.org/) - the modern R framework that turns this hand-rolled pipeline into reusable, leak-safe steps (rsample splits, parsnip fits, yardstick metrics) you will use next.

=== step === complete
## Lesson 4 complete

You built a machine learning model end to end: you fixed a seed so the run is reproducible, split the data honestly, fit a classifier on the training rows, predicted on customers it had never seen, and judged it with the confusion matrix and the metric that fits Priya's decision. Then you packaged the whole thing into one script that anyone can rerun to the same numbers.

That is the entire Machine Learning Workflow course. You now have the skeleton every project shares. From here, the model-specific courses go deeper into the pieces you just used: Regression digs into fitting continuous outcomes, Classification unpacks logistic regression and its rivals, and both lean on cross-validation to turn today's single, noisy test score into a steadier estimate. Same five stages, sharper tools.

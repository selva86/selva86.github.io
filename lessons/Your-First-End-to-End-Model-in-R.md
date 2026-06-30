---
title: "ML Workflow Lesson 4: Your First End-to-End Model in R"
catalog_blurb: "Take one dataset from raw rows to a fitted, evaluated, reproducible model."
description: "Build your first end-to-end machine learning model in R: split one dataset, fit a model, predict on held-out data, evaluate honestly, and make it reproducible."
keywords: "end to end machine learning, first ML model in R, train test split, glm logistic regression, model evaluation, confusion matrix, precision recall, set.seed reproducibility, R"
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

Three lessons of groundwork, and now the payoff: you build a model from raw rows to a graded verdict, all in one sitting.

Remember Lena from Lesson 1? She runs Fern & Co, a small online plant shop, and her regulars keep quietly drifting away. She has a budget for $5 win-back coupons but cannot afford to mail all 9,000 customers, so she needs to know **who is about to lapse**. In Lesson 1 you turned that into a machine learning problem. In Lesson 2 you saw how a model can be too simple or too clever. In Lesson 3 you learned to split data honestly and keep the answer from leaking in. This lesson finally **builds the thing**: one table of Lena's customers, taken from raw data to a fitted, evaluated, reproducible model.

By the end you will be able to:

- Run a full pipeline on one dataset: split, fit, predict, evaluate
- Make the whole run reproducible with `set.seed` and a single script
- Fit a model on the training rows, predict on held-out data, and grade it honestly with a metric that fits Lena's decision

**Prerequisites:** you can run R and read its output, and you have done the first three lessons of this course: [Framing a problem as ML](Framing-a-Problem-as-ML.html), [The Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html), and [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html).

Here is the whole journey on one map. Every step from here lives in one of these five boxes.

::widget process-flow {"steps":[{"title":"Set the seed","sub":"fix the randomness so every run gives the exact same result"},{"title":"Split","sub":"hold out a test set BEFORE touching the data"},{"title":"Fit","sub":"learn the model on the training rows only"},{"title":"Predict","sub":"score the held-out test rows the model never saw"},{"title":"Evaluate","sub":"grade it with a metric that matches the decision"}]}

=== step === concept
::eyebrow Reproducibility from day one
## One table, and a seed before anything else

Every supervised model learns from one rectangle: one row per thing you are predicting, one column per feature, plus the column you want to predict. For Lena that rectangle is one row per customer. We will use four features she genuinely has on the day she scores someone, and the label `will_lapse`.

| Column | What it is | Known at prediction time? |
|---|---|---|
| `days_since_last` | days since the customer's last order (recency) | yes, computed today |
| `orders_90d` | orders in the last 90 days (frequency) | yes, settled history |
| `avg_basket` | average order value in dollars (money) | yes, settled history |
| `tenure_mo` | months the customer has been with Fern & Co | yes |
| `will_lapse` | the label: did this customer lapse? (`yes` / `no`) | the answer we predict |

A model needs random numbers (to split the data, and inside many algorithms), and random means *different every run*, which would make your results impossible to reproduce. The fix is the first habit of any honest analysis: call `set.seed()` once at the top. It fixes R's random-number generator to a known starting point, so the "random" choices come out identical every time you run the script. We build Lena's table inline (each lesson is its own fresh R session), seeded so your numbers match the lesson exactly.

```r
set.seed(2026)                                  # fix randomness: same result every run
n <- 600                                        # a working sample of Lena's customers
customers <- data.frame(
  days_since_last = round(runif(n, 1, 120)),    # recency: days since last order
  orders_90d      = rpois(n, 3),                # frequency: orders in the last 90 days
  avg_basket      = round(rgamma(n, 4, 0.12)),  # money: average order value, $
  tenure_mo       = round(runif(n, 1, 48))      # months as a customer
)
# whether each customer lapses: risk rises with recency, falls with frequency and tenure
risk <- plogis(-1.6 + 0.06 * customers$days_since_last -
               0.8 * customers$orders_90d - 0.03 * customers$tenure_mo)
customers$will_lapse <- factor(ifelse(runif(n) < risk, "yes", "no"))

table(customers$will_lapse)
#> 
#>  no yes 
#> 384 216
```

About a third of these customers lapse, which matches the lopsided reality from Lesson 1: lapsing is the rarer event. Hold that imbalance in mind; it decides which metric we trust later.

=== step === concept
::eyebrow Stage 1 of the pipeline
## Split first, before you look or model

Lesson 3 drilled in the rule: the only honest verdict comes from data the model has never seen. So before we explore, before we fit, we carve off a **test set** and pretend it does not exist until the very end. This is a capstone, not a tuning marathon, so we keep it to a simple two-way split: 70% to train on, 30% held out to grade on.

Notice the seed again. A fresh `set.seed()` right before the split means *this exact split* is reproducible: rerun the script tomorrow and the same 180 customers land in the test set.

```r
set.seed(7)                                     # reproducible split
test_id <- sample(nrow(customers), 0.30 * nrow(customers))   # 30% held out
train   <- customers[-test_id, ]                # everything else to learn from
test    <- customers[test_id, ]                 # sealed until the final grade

c(train = nrow(train), test = nrow(test))
#> train  test 
#>   420   180
```

We will fit on `train`, then unseal `test` exactly once to grade the finished model. That is the whole discipline from Lesson 3, in three lines.

=== step === quiz
::eyebrow Check yourself
## What does the seed actually buy you?

You add `set.seed(7)` on the line just before you split the data. What does that line do for your analysis?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It makes the model more accurate by choosing a better split ::no The seed does not change *which* split is good or bad. It only makes the split you do get the **same** one every time. Accuracy comes from the model and the data, not the seed.
- It makes the random split reproducible: the same rows are held out every run ::ok Right. The seed fixes R's random-number generator, so `sample()` returns the identical test rows each time you run the script. Anyone with your code and seed reproduces your exact numbers.
- It is only needed for the model fitting, not for splitting ::no Any step that uses randomness needs it, and splitting is the first such step. Without a seed before `sample()`, your test set changes on every run and your results are not reproducible.

=== step === widget
::eyebrow Stage between split and fit
## Look before you model

Before fitting anything, plot the data. A quick look tells you whether there is a signal worth modelling and saves you from chasing a model when there is nothing to learn. Each point below is one customer: recency on the x-axis, recent orders on the y-axis, coloured by whether they lapsed. Press Run to draw the real chart.

::widget chart-plotter {"data":[{"x":5,"y":6,"fill":"stay"},{"x":12,"y":5,"fill":"stay"},{"x":8,"y":7,"fill":"stay"},{"x":20,"y":4,"fill":"stay"},{"x":15,"y":5,"fill":"stay"},{"x":3,"y":8,"fill":"stay"},{"x":25,"y":4,"fill":"stay"},{"x":10,"y":6,"fill":"stay"},{"x":95,"y":1,"fill":"lapse"},{"x":110,"y":0,"fill":"lapse"},{"x":78,"y":2,"fill":"lapse"},{"x":102,"y":1,"fill":"lapse"},{"x":88,"y":0,"fill":"lapse"},{"x":70,"y":1,"fill":"lapse"},{"x":115,"y":2,"fill":"lapse"},{"x":60,"y":1,"fill":"lapse"}],"geoms":["point"],"x":"days_since_last","y":"orders_90d","code":{"point":"ggplot(df, aes(days_since_last, orders_90d, colour = group)) +\n  geom_point(size = 2)"}}

The two colours separate cleanly: customers who lapsed sit to the right (many days since their last order) and low down (few recent orders), while the loyal ones cluster top-left. That separation is exactly what a model turns into a rule. If the colours were hopelessly mixed, no model could help, and you would want to know that *before* spending an afternoon tuning one.

=== step === concept
::eyebrow Stage 2 of the pipeline
## Fit the model on the training rows

Fitting (or "training") means handing the model the training rows and letting it learn the pattern that links the features to the label. For a yes/no target the standard first model is **logistic regression**, the same `glm()` you met in Lesson 3. It estimates a probability of lapsing for each customer.

It does this by computing a weighted sum of the features and squeezing it into the 0-to-1 range with the logistic (sigmoid) function. Writing \(p\) for the estimated probability of lapse, \(x_1,\dots,x_k\) for the \(k\) features, \(\beta_1,\dots,\beta_k\) for the weights the model learns and \(\beta_0\) for the intercept:

\[ p \;=\; \frac{1}{1 + e^{-(\beta_0 + \beta_1 x_1 + \cdots + \beta_k x_k)}} \]

The bigger the weighted sum, the closer \(p\) gets to 1; the more negative, the closer to 0. Training is just choosing the weights \(\beta\) that best match the labels in the training data. The formula `will_lapse ~ .` reads as "predict `will_lapse` from every other column," and `family = binomial` is what makes `glm()` a logistic regression.

```r
fit <- glm(will_lapse ~ ., data = train, family = binomial)
round(coef(fit), 3)
#>     (Intercept) days_since_last      orders_90d      avg_basket       tenure_mo 
#>          -0.625           0.065          -0.887          -0.011          -0.048
```

Read the signs, not the exact values. The weight on `days_since_last` is **positive**: more days since the last order pushes the lapse probability up. The weights on `orders_90d` and `tenure_mo` are **negative**: more recent orders and longer tenure pull it down. The model has rediscovered, from the data alone, the pattern you saw by eye in the scatter. (Why a probability bends through a sigmoid, and how to read these weights as odds, is the whole next course; here we just need a working first model.)

=== step === tryit
::eyebrow Your turn
## Predict on the held-out test set

The model was fit on `train`. Now score the customers it has **never seen**, the held-out `test` set, exactly as you would score a fresh batch of real applicants. `predict()` with `type = "response"` returns a lapse probability for each test customer. Point it at the held-out set by filling in the blank.

```r
prob <- predict(fit, ____, type = "response")   # score the HELD-OUT customers
round(head(prob), 2)
```
::check {"regex":"newdata\\s*=\\s*test","gate":true,"difficulty":"intermediate","ok":"That is honest scoring: the held-out test customers give a trustworthy preview of how Lena's model will do on next week's real customers.","no":"Aim predict() at the held-out rows with newdata = test. Leaving it off scores the training data again, which (as Lesson 3 showed) flatters the model."}
::solution
```r
prob <- predict(fit, newdata = test, type = "response")
round(head(prob), 2)
#>  298  467  415  476  218  392 
#> 0.71 0.36 0.16 0.76 0.08 0.85
```

=== step === concept
::eyebrow Stage 3 of the pipeline
## Grade it honestly

A probability is not yet a decision. Turn each one into a class with a threshold (the usual starting point is 0.5: above it, predict lapse), then compare the predictions to what actually happened in the test set. The **confusion matrix** is that comparison, a 2-by-2 tally of right and wrong calls.

```r
pred <- factor(ifelse(prob > 0.5, "yes", "no"), levels = c("no", "yes"))
cm <- table(prediction = pred, actual = test$will_lapse)
cm
#>           actual
#> prediction  no yes
#>        no  111  18
#>        yes  18  33
```

From those four counts you compute three numbers. Let \(TP\) be true positives (predicted lapse, really lapsed), \(FP\) false positives (predicted lapse, actually stayed), \(FN\) false negatives (predicted stay, actually lapsed), and \(N\) the total test customers:

\[ \text{accuracy} = \frac{\text{correct}}{N} \qquad \text{precision} = \frac{TP}{TP + FP} \qquad \text{recall} = \frac{TP}{TP + FN} \]

**Accuracy** is the share of all calls that were right. **Precision** asks: of everyone we flagged as lapsing, how many truly did (are we wasting coupons)? **Recall** asks: of everyone who truly lapsed, how many did we catch (are we missing customers)?

```r
TP <- cm["yes", "yes"]; FP <- cm["yes", "no"]; FN <- cm["no", "yes"]
c(accuracy  = round(mean(pred == test$will_lapse), 2),
  precision = round(TP / (TP + FP), 2),
  recall    = round(TP / (TP + FN), 2))
#>  accuracy precision    recall 
#>      0.80      0.65      0.65
```

About 80% of calls are right, a clear edge over the roughly 72% you would get by betting nobody lapses. But look at recall: the model catches about two-thirds of the customers who actually lapse, so a third still slip through. Whether that is good enough is not a statistics question, it is Lena's business question.

=== step === quiz
::eyebrow Check yourself
## Which number should Lena act on?

A wasted $5 coupon costs Lena almost nothing. Losing a regular customer who quietly lapsed costs her hundreds of dollars in future orders. Her model scores 80% accuracy, 65% precision, 65% recall on the test set. Which metric should she work to improve, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Accuracy, because 80% means most predictions are right ::no Accuracy is dominated by the many non-lapsers, so a model that flags almost no one can still score high while missing the customers Lena most wants to keep. It hides the expensive mistake.
- Precision, so every coupon she sends is perfectly targeted ::no Chasing precision means flagging only the surest cases and missing many real lapsers, which is the costly error here. Precision matters more when the *action* is expensive; a $5 coupon is not.
- Recall, because the costly mistake is missing a real lapser ::ok Right. A missed lapser costs far more than a wasted coupon, so Lena wants to catch as many real lapsers as possible. She would lower the 0.5 threshold to raise recall, accepting some extra wasted coupons (lower precision) in return.

=== step === concept
::eyebrow Stage that wraps all the others
## Make it reproducible: a seed and a script

You now have a complete model. The last habit turns a one-off result into something you, a colleague, or future-you can trust and rerun: **reproducibility**. Two pieces carry it.

First, the **seed**. Because you fixed it before the split, the "random" choices are not really random, they are repeatable. Prove it: draw the test rows twice with the same seed and they are identical.

```r
set.seed(7); first  <- sample(nrow(customers), 5)
set.seed(7); second <- sample(nrow(customers), 5)
identical(first, second)
#> [1] TRUE
```

Second, the **script**. Keep the whole pipeline (build or load data, set the seed, split, fit, predict, evaluate) in one `.R` file that runs top to bottom with no manual steps in between. Anyone who runs it with the same seed gets your exact numbers. Record the environment too, so a package update years later cannot silently change the result:

```r
R.version.string
#> [1] "R version 4.6.0 (2026-04-24)"
```

[TIP]
`sessionInfo()` prints your R version and every loaded package's version. Paste its output (or `renv::snapshot()` for a full lockfile) alongside your script, and your analysis becomes genuinely reproducible: same code, same seed, same packages, same answer.

[KEY INSIGHT]
A result you cannot reproduce is not a finding, it is an anecdote. The seed makes the randomness repeatable; the script makes the steps repeatable; recording versions makes the tools repeatable. Together they are the difference between a model you trust and a lucky run you cannot explain.

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [An Introduction to Statistical Learning (free PDF)](https://www.statlearning.com/) - chapters 4 and 5 cover logistic regression and honest evaluation with held-out data, the two pillars of this lesson.
- [R for Data Science (2e)](https://r4ds.hadley.nz/) - the whole-game data workflow in R, from importing and tidying to transforming, visualising and communicating, the scaffolding any model sits inside.
- [tidymodels: get started](https://www.tidymodels.org/start/) - the modern R framework that wraps split, fit, predict and evaluate into one consistent pipeline you will grow into.
- [The Turing Way: guide to reproducible research](https://book.the-turing-way.org/reproducible-research/reproducible-research) - why seeds, scripts and recorded environments matter, and how to do reproducibility well.

=== step === complete
## Lesson 4 complete

You took one dataset from raw rows to a graded model, the full pipeline: seed the run, split off an honest test set, look at the data, fit a model on the training rows, predict on the held-out rows, and grade it with the metric that fits the decision. Lena now has a working lapse model and, just as important, the discipline to trust and reproduce it.

That completes the Machine Learning Workflow course. You have the scaffolding every project hangs on. Next come the models themselves: the Regression course opens up the `glm()` you just used (coefficients, odds, assumptions), and the Classification course goes deeper into reading a classifier like the one you just built. The workflow you learned here does not change, only the model that slots into the middle of it.

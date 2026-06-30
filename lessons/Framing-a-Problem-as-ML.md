---
title: "ML Workflow Lesson 1: Framing a problem as machine learning"
catalog_blurb: "Turn a vague business question into a well-posed prediction problem."
description: "Turn a business question into a supervised ML task: pick the target, the unit of analysis, the features known at prediction time, and the metric that fits."
keywords: "machine learning workflow, framing a problem, CRISP-DM, supervised learning, target variable, classification vs regression, prediction time, data leakage, model metrics, R"
post_type: "LESSON"
curriculum_id: "6.10.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-ml-workflow"
course_title: "The Machine Learning Workflow in R"
course_lesson: "1"
course_total: "4"
course_landing: "R-ML-Workflow-Course.html"
course_next: "The-Bias-Variance-Tradeoff.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## Framing a problem as machine learning

Welcome to the first stop on the Data Scientist path. Before any model, before any code, comes the move that decides whether the whole project succeeds: turning a fuzzy business question into a precise machine learning problem. Get this right and the modeling is almost mechanical. Get it wrong and the fanciest algorithm just hands you a confident wrong answer.

Meet Lena. She runs Fern & Co, a small online plant shop. Lately her regulars quietly drift away: they buy every few weeks, then one month they simply stop. Lena has a budget for $5 win-back coupons, but she cannot afford to mail one to all 9,000 customers. Her real question is plain: **who is about to lapse, so I send the coupon only to them?**

That sentence is not yet a machine learning problem. This lesson turns it into one.

By the end you will be able to:

- Translate a business decision into a supervised learning task
- Define the target you are predicting, and tell classification from regression
- Keep only the features you will actually have when you predict, and pick a metric that matches the decision

**Prerequisites:** you can run R, call a function, and load a package with `library()`. No machine learning is assumed; every term is defined as it appears.

::widget process-flow {"steps":[{"title":"Business understanding","sub":"name the decision and what a good answer is worth"},{"title":"Data understanding","sub":"find the data and check whether you can trust it"},{"title":"Data preparation","sub":"build one clean, labeled table to learn from"},{"title":"Modeling","sub":"fit candidate models to that table"},{"title":"Evaluation","sub":"judge them on a metric that matches the decision"},{"title":"Deployment","sub":"put the model to work, then watch and refresh it"}]}

That six-phase map is CRISP-DM, the standard lifecycle of a data project. This whole lesson lives in phase one, where most projects are quietly won or lost.

=== step === concept
::eyebrow The first move
## Start from the decision, not the algorithm

Beginners reach for a model first ("let us try a random forest"). Experienced practitioners start at the other end, with the decision the model has to serve. For Lena that decision is concrete and repeating: each week, choose which customers get a $5 coupon.

Everything else follows from that one decision. Before writing a line of code, answer four questions in plain language:

1. **What decision will this inform?** Who gets a coupon this week.
2. **What are we predicting?** Whether a customer is about to lapse. (the *target*)
3. **From what, and known when?** Facts about each customer we already have today. (the *features*)
4. **How will we judge a good answer?** Whether the coupons land on the right people, given what a wrong guess costs. (the *metric*)

[KEY INSIGHT]
A machine learning problem is well-framed when those four answers are written down and agree with each other. The target must be something you can act on, the features must be things you will actually have, and the metric must reward the decision you care about. The rest of this lesson fills in each one, in order.

=== step === concept
::eyebrow The shape of the problem
## Turn it into supervised learning

Lena wants to predict something (will a customer lapse?) from things she already knows (their past behavior). That is exactly what **supervised learning** does: it learns a rule mapping inputs to a known answer by studying past examples where the answer is already on record.

Three words, defined once and reused for the rest of the course:

- A **feature** is one input you know about each customer: orders in the last 90 days, days since the last order, average basket size.
- The **label** (or **target**) is the answer you want to predict: did this customer lapse?
- A **labeled example** is one past customer for whom you know both the features and what actually happened.

Stack those into one rectangle, one row per customer, and you have the **analysis table**: the single object every supervised model learns from. Deciding what one row stands for, here one customer at one snapshot date, is the **unit of analysis**, and it is a real choice. Pick the wrong grain (say, one row per order instead of per customer) and every later step inherits the mistake.

Here is Lena's snapshot for eight customers. The features are known today; `orders_next_30d` is what happened afterward, which we only know because these are *past* customers, and it is what we will turn into the label.

```r
# Fern & Co: a snapshot of 8 customers taken today.
# Features are known NOW; orders_next_30d happened AFTER (used to build the label).
customers <- data.frame(
  customer        = c("C-118","C-205","C-331","C-407","C-512","C-630","C-744","C-885"),
  orders_90d      = c(3, 1, 5, 0, 2, 4, 1, 0),    # orders in the last 90 days
  days_since_last = c(12, 64, 4, 90, 28, 7, 51, 120),
  avg_basket      = c(34, 22, 58, 0, 41, 47, 19, 0),
  orders_next_30d = c(1, 0, 2, 0, 1, 2, 0, 0)     # the future outcome
)
customers
```

The label does not exist yet; we build it from `orders_next_30d`. A customer who placed zero orders in the next 30 days has lapsed. Press Run below to add that one column.

::widget table-transform {"code":"customers %>% mutate(will_lapse = if_else(orders_next_30d == 0, \"yes\", \"no\"))","caption":"mutate() adds the target label: a customer with zero orders in the next 30 days has lapsed. One new column, every row kept.","before":{"cols":["customer","orders_90d","days_since_last","avg_basket","orders_next_30d"],"rows":[["C-118",3,12,34,1],["C-205",1,64,22,0],["C-331",5,4,58,2],["C-407",0,90,0,0],["C-512",2,28,41,1],["C-630",4,7,47,2],["C-744",1,51,19,0],["C-885",0,120,0,0]]},"after":{"cols":["customer","orders_90d","days_since_last","avg_basket","orders_next_30d","will_lapse"],"rows":[["C-118",3,12,34,1,"no"],["C-205",1,64,22,0,"yes"],["C-331",5,4,58,2,"no"],["C-407",0,90,0,0,"yes"],["C-512",2,28,41,1,"no"],["C-630",4,7,47,2,"no"],["C-744",1,51,19,0,"yes"],["C-885",0,120,0,0,"yes"]]}}

=== step === concept
::eyebrow One fork in the road
## Classification or regression?

The target you just built decides the *kind* of problem you have, and it is a fork with only two roads.

When the target is a **category** (yes/no, or one of several classes), you have a **classification** problem. Lena predicting lapse / not-lapse is classification.

When the target is a **number** on a continuous scale, you have a **regression** problem. If Lena instead asked "how many dollars will this customer spend next month?", the same data becomes a regression problem.

| If the target is... | The task is... | Fern & Co version | Typical metric |
|---|---|---|---|
| a category (yes/no) | classification | will this customer lapse? | precision, recall, AUC |
| a number (amount, count) | regression | how much will they spend next month? | MAE, RMSE |

Same customers, same features. Change the question and you change the task, the model family, and the yardstick you grade with. So pin the target down before anything else.

=== step === quiz
::eyebrow Check yourself
## Which kind of problem is it?

A streaming service wants to predict, for each user, how many hours they will watch next week. What kind of supervised learning problem is that?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Classification, because each user is sorted into a group ::no The output here is a number of hours on a continuous scale, not a category. Sorting into fixed groups would be classification; predicting an amount is regression.
- Regression, because the target is a number on a continuous scale ::ok Right. "How many hours" is a continuous number, so it is regression. Had they asked "will the user cancel, yes or no?", that would be classification.
- Neither, because there is no labeled data ::no There is labeled data: past weeks where you know how many hours each user actually watched. Those known answers are exactly what supervised learning trains on.

=== step === tryit
::eyebrow Your turn
## Define the target in R

You still have Lena's `customers` table from a moment ago. Turn the raw outcome `orders_next_30d` into the label `will_lapse`: a customer who placed zero orders in the next 30 days has lapsed (`"yes"`), otherwise not (`"no"`). Wrapping it in `factor()` tells R this column is a category, not free text. Fill in the condition.

```r
customers$will_lapse <- factor(ifelse(____, "yes", "no"))
table(customers$will_lapse)
```
::check {"regex":"orders_next_30d\\s*==\\s*0","gate":true,"difficulty":"beginner","ok":"That is the label: zero orders in the window means the customer lapsed. table() then shows the class balance, four lapsed and four stayed.","no":"A lapsed customer placed no orders in the window. The condition is customers$orders_next_30d == 0."}
::solution
```r
customers$will_lapse <- factor(ifelse(customers$orders_next_30d == 0, "yes", "no"))
table(customers$will_lapse)
```

=== step === concept
::eyebrow The timing trap
## Use only features you will have at prediction time

Here is the rule that quietly sinks more projects than any modeling mistake: **every feature must be knowable at the exact moment you make the prediction.**

Lena scores a customer **today** to decide about a coupon. So a feature is only fair if its value is already settled today. Lay the problem out along time:

::widget process-flow {"steps":[{"title":"Feature window (the past)","sub":"orders, visits and tickets up to today, all known"},{"title":"Prediction moment (today)","sub":"score the customer using only what is known now"},{"title":"Outcome window (next 30 days)","sub":"what happens here becomes the label, unknown at scoring"}]}

- The **feature window** is the past: orders, visits and support tickets up to today. Fair game, you have them.
- The **prediction moment** is today, the snapshot, when the model must answer using only what is known so far.
- The **outcome window** is the next 30 days. Whatever happens there becomes the label, but it is unknown at scoring time, so it can never be a feature.

A feature that secretly peeks into the outcome window causes **leakage**. It makes a model look brilliant in testing and then fail in production, because that future information simply will not exist when you actually run it. We hunt leakage properly in Lesson 3; for now, hold the rule: features come from before the prediction moment, never after.

=== step === quiz
::eyebrow Check yourself
## Spot the leaked feature

Lena's team lists four candidate features for the lapse model, each described as measured "as of the scoring date." One of them cannot honestly be known at scoring time. Which is the leak?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Number of orders in the previous 90 days ::no That is settled history at scoring time, a perfectly fair feature.
- Days since the customer's last order ::no You compute this from past orders on the scoring date, so it is fair.
- Whether the customer redeemed a win-back coupon in the next two weeks ::ok Right. A coupon redeemed *after* you score lives in the outcome window, so you cannot know it when you predict. Worse, you only send that coupon to people you already flagged, so the feature is built from the answer itself. Classic leakage.
- Average basket size over the customer's order history ::no A historical average is known at scoring time, so it is fine.

=== step === concept
::eyebrow Judging a good answer
## Pick a metric that matches the decision

A model outputs a guess; a **metric** scores how good the guesses are. Choose the wrong metric and you will faithfully optimize for the wrong thing.

The obvious choice, **accuracy** (the fraction of customers labeled correctly), is a trap here. Our 8-row snapshot was balanced to keep the counting clear, but across Lena's full base of 9,000, lapsing is rare: only about 1 in 12 customers lapse in a given month. A lazy model that predicts "nobody lapses" is then about 92% accurate and completely useless: it never flags anyone, so Lena sends no coupons. High accuracy, zero value.

The fix is to score the decision, not the average. Call the customers Lena flags as likely to lapse the **positive** cases. Each prediction then falls into one of four outcomes:

- a **true positive** (TP): a flagged customer who really does lapse,
- a **false positive** (FP): a flagged customer who would have stayed (a wasted coupon),
- a **false negative** (FN): a real lapser the model missed (a lost customer).

Two metrics built from those counts score the decision directly:

\[ \text{precision} = \frac{TP}{TP + FP} \qquad \text{recall} = \frac{TP}{TP + FN} \]

**Precision** asks: of everyone we couponed, how many were truly about to lapse? (Are we wasting coupons?) **Recall** asks: of everyone who truly lapsed, how many did we catch? (Are we missing customers?) The two trade off: flag more people and you catch more lapsers (higher recall) but waste more coupons (lower precision). Drag the threshold below to feel that trade; the counts recount and the operating point slides along the curve.

::widget roc-curve {}

You can also compute these by hand. Here is how Lena's flagged list scored on eight customers:

```r
# How Lena's coupon list did, scored against what actually happened.
actual    <- c("lapse","stay","lapse","lapse","stay","stay","lapse","lapse")
predicted <- c("lapse","stay","lapse","stay","lapse","stay","lapse","lapse")

cm <- table(predicted, actual)
cm

TP <- cm["lapse", "lapse"]; FP <- cm["lapse", "stay"]; FN <- cm["stay", "lapse"]
c(precision = round(TP / (TP + FP), 2),
  recall    = round(TP / (TP + FN), 2))
```

=== step === quiz
::eyebrow Check yourself
## Which metric should Lena prioritize?

A wasted $5 coupon costs Lena almost nothing. Losing a regular customer who quietly lapsed costs her hundreds of dollars in future orders. Given those stakes, which metric should her lapse model favor?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Accuracy, to get the most predictions right overall ::no Accuracy is dominated by the many non-lapsers and rewards a model that flags no one. It ignores the lopsided costs Lena actually faces.
- Recall, to catch as many real lapsers as possible ::ok Right. Missing a lapser is the expensive error, so Lena wants to catch as many as she can even if a few coupons are wasted. She tunes the threshold for high recall and accepts lower precision.
- Precision, so every coupon is perfectly targeted ::no Maximizing precision means flagging only the surest cases and missing many real lapsers, the costly mistake here. Precision matters more when the action itself is expensive.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [An Introduction to Statistical Learning (free PDF)](https://www.statlearning.com/) - chapter 2 covers supervised learning and the classification-versus-regression split cleanly.
- [Google: Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) - hard-won, practical rules for framing a problem, choosing a metric, and avoiding leakage.
- [Provost and Fawcett, Data Science for Business](https://www.oreilly.com/library/view/data-science-for/9781449374273/) - the book that popularized starting from the business decision and the CRISP-DM lifecycle.
- [Kaufman et al. (2012), Leakage in Data Mining (ACM)](https://doi.org/10.1145/2382577.2382579) - the canonical paper on why a feature must be available at prediction time.

=== step === complete
## Lesson 1 complete

You can now take a fuzzy business question and frame it as a machine learning problem: name the decision, define a target you can act on, choose the unit of analysis, gather only the features you will have at prediction time, and pick a metric that rewards the decision you care about. That checklist is the part beginners skip and experienced practitioners never do.

Next, Lesson 2: The Bias-Variance Tradeoff. With the problem well-posed, we turn to what can go wrong inside the model itself, why it can be too simple or too clever, and the single curve that explains underfitting, overfitting, and the sweet spot between them.

---
title: "ML Workflow Lesson 1: Framing a Problem as Machine Learning"
catalog_blurb: "Turn a vague business question into a well-posed prediction problem."
description: "Turn a fuzzy business question into a well-posed supervised task: choose the unit of analysis, the target, the features, and a metric that fit the decision."
keywords: "framing a machine learning problem, CRISP-DM, supervised learning, target variable, unit of analysis, data leakage, evaluation metric, precision and recall, churn prediction in R"
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
## Framing a Problem as Machine Learning

Priya runs the retention team at FreshBox, a meal-kit subscription. Her boss drops by with a familiar worry: "Customers keep canceling. Can we do something about it?"

That sentence is a business problem. It is not yet a machine learning problem, and no model on earth can be pointed at it as written. The most valuable, and most skipped, skill in applied machine learning is the translation: turning a vague question into a precise prediction task a model can actually learn. Get the framing wrong and even a brilliant algorithm answers the wrong question. This whole first lesson is that translation.

By the end you will be able to:

- Explain why a business question is not yet a machine learning problem, and name the four decisions that turn it into one
- Define a precise, computable target and say whether the problem is supervised, and classification or regression
- Keep only the features you will actually have at prediction time, and spot one that would leak the answer
- Choose a metric that matches the decision, and explain why plain accuracy can be worse than useless

**Prerequisites:** you can run R and read its printed output, and you know that a data frame is rows and typed columns. No prior machine learning is assumed.

::widget process-flow {"steps":[{"title":"Business understanding","sub":"what decision are we trying to improve?"},{"title":"Data understanding","sub":"what data exists, and at what grain?"},{"title":"Data preparation","sub":"build one row per unit: label plus features"},{"title":"Modeling","sub":"fit candidate models to the training rows"},{"title":"Evaluation","sub":"score on a metric that matches the decision"},{"title":"Deployment","sub":"put predictions where the decision is made"}]}

=== step === concept
::eyebrow The gap
## A business question is not yet a machine learning problem

"Customers keep canceling, can we do something?" hides a dozen unstated choices. Do something for whom, when? Predict what, exactly? Measured how? A model needs each of these pinned down before it can learn anything useful.

To make the question learnable, Priya has to answer four concrete questions:

1. **The unit of analysis.** What does a single example look like? One customer? One customer each week? One delivery?
2. **The target.** What exactly are we predicting, and do we even have the answer for past examples to learn from?
3. **The features.** What will we actually know at the moment we make each prediction, and nothing we would not?
4. **The metric.** How will we score a prediction, in a way that reflects what a mistake really costs?

[KEY INSIGHT]
Framing is deciding these four things on purpose. Every one of them is a modeling choice, made before a single model is fit, and a wrong choice here cannot be rescued by a better algorithm later.

The rest of this lesson answers all four for FreshBox, one at a time.

=== step === concept
::eyebrow The map
## The whole journey: CRISP-DM in six phases

Before the four decisions, it helps to see where framing sits in the larger arc. The industry-standard map for a data project is **CRISP-DM** (the Cross-Industry Standard Process for Data Mining): six phases you cycle through, not a straight line.

- **Business understanding:** what decision are we trying to improve, and what would success look like?
- **Data understanding:** what data do we actually have, and at what grain (one row per what)?
- **Data preparation:** build the analysis table, one row per unit, with the target and the features.
- **Modeling:** fit candidate models to the training rows.
- **Evaluation:** score them on a metric that reflects the real decision.
- **Deployment:** put the predictions where the decision is actually made (here, a weekly call list).

::widget process-flow {"steps":[{"title":"Business understanding","sub":"what decision are we trying to improve?"},{"title":"Data understanding","sub":"what data exists, and at what grain?"},{"title":"Data preparation","sub":"build one row per unit: label plus features"},{"title":"Modeling","sub":"fit candidate models to the training rows"},{"title":"Evaluation","sub":"score on a metric that matches the decision"},{"title":"Deployment","sub":"put predictions where the decision is made"}]}

Framing lives in the first two phases, and it quietly decides everything downstream. The good news: those two phases boil down to the four decisions from the last step. Let us line them up.

=== step === concept
::eyebrow The spine
## The four framing decisions

Here are the four decisions again, in the order you make them. This is the spine of the lesson: one step each from here on.

::widget process-flow {"steps":[{"title":"Unit of analysis","sub":"what does one row represent?"},{"title":"Target","sub":"what exactly are we predicting, and is it labeled?"},{"title":"Features","sub":"what will we know at the moment we predict?"},{"title":"Metric","sub":"which score reflects the cost of a mistake?"}]}

Notice the order is not arbitrary. You cannot define the target until you know what one row is; you cannot pick features until you know the target; and the metric only makes sense once you know what you are predicting and what the decision costs. Get the first one wrong and the rest inherit the mistake.

=== step === quiz
::eyebrow Check yourself
## What has to come first?

Priya wants to turn "customers keep canceling" into a machine learning problem. Which set of questions must she answer **first**, before any model is chosen?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Which algorithm should we use: a random forest, or a neural network? ::no Algorithm choice comes later, in the modeling phase, and it is nearly interchangeable compared to framing. A great algorithm pointed at a badly framed problem still answers the wrong question.
- What is one row, what exactly are we predicting, what will we know when we predict it, and how will we score it? ::ok Exactly. Those are the four framing decisions: unit, target, features, metric. They define the problem the model will solve, before any model exists.
- How many GPUs and how much cloud budget will the training need? ::no Infrastructure matters eventually, but it answers "how do we build it," not "what are we predicting and why." Framing has to come first.

=== step === concept
::eyebrow Decision 1
## The unit of analysis: what is one row?

The **unit of analysis** is what a single row of your training table represents, one example the model learns from. It sounds obvious until you try to write it down, and it is the choice everything else hangs on.

For FreshBox, the decision is "each week, phone the customers most likely to cancel soon." The natural unit is **one active subscriber, described as of a snapshot date** (say, this Monday). A different choice, one row per *delivery* or per *cancellation event*, would answer a different question and line up with a different action.

Each lesson runs in a fresh R session, so we build FreshBox's data right here. These are 1000 past subscribers: for each we have some snapshot features, and, because they are historical, we already know what happened next.

```r
set.seed(2024)
n <- 1000
cust <- data.frame(
  customer_id           = 1:n,
  tenure_months         = round(runif(n, 1, 48)),      # how long they have subscribed
  boxes_skipped_last_mo = rpois(n, 0.7),               # deliveries skipped recently
  support_tickets_90d   = rpois(n, 0.5),               # complaints in the last 90 days
  weeks_since_login     = round(rexp(n, 0.6), 1),      # app disengagement
  plan                  = sample(c("small", "large"), n, TRUE, c(0.6, 0.4)),
  days_to_cancel        = NA_real_                      # filled in below for the churners
)
# For these PAST customers we already know what happened next: some canceled,
# and we recorded how many days after the snapshot. NA means still subscribed.
risk    <- -2.6 - 0.09 * cust$tenure_months + 0.95 * cust$boxes_skipped_last_mo +
            0.90 * cust$support_tickets_90d + 0.45 * cust$weeks_since_login
cancels <- rbinom(n, 1, plogis(risk)) == 1
cust$days_to_cancel[cancels] <- pmin(90, round(rexp(sum(cancels), 1 / 22)) + 1)

nrow(cust)          # one row per customer: the unit of analysis
#> [1] 1000
head(cust, 3)
#>   customer_id tenure_months boxes_skipped_last_mo support_tickets_90d
#> 1           1            40                     1                   0
#> 2           2            16                     0                   1
#> 3           3            33                     0                   0
#>   weeks_since_login  plan days_to_cancel
#> 1               0.5 small             NA
#> 2               0.2 small             NA
#> 3               1.2 small             NA
```

One thousand rows, one per customer. `days_to_cancel` is `NA` for anyone still subscribed and a number for those who later canceled. That column is how we will build the answer to learn from, next.

=== step === quiz
::eyebrow Check yourself
## What does one row mean?

In the `cust` table we just built, a single row represents which of these?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- One meal-kit delivery ::no A delivery-level table would have many rows per customer and would fit a per-delivery decision. Our decision is per-customer ("phone this subscriber"), so the row must be a customer.
- One active subscriber, described as of the snapshot date ::ok Right. The unit matches the action: we act on customers (call them), so one row is one customer, summarized as of the moment we would score them.
- One cancellation event ::no That would only include customers who churned, so we could never learn to tell future churners from stayers. We need a row for every active subscriber, churner or not.

=== step === concept
::eyebrow Decision 2
## The target: what are we predicting, and do we have the answer?

The **target** (also called the label, or \(y\)) is the thing the model predicts. This is where a problem becomes **supervised learning**: we have past examples where the answer is already known, and we want a rule that reproduces it on new cases.

Formally, supervised learning fits a function \(\hat f\) that maps a customer's features \(\mathbf{x}\) (their tenure, skipped boxes, and so on) to a prediction of the target \(y\), learned from labeled past examples \(\{(\mathbf{x}_1, y_1), \dots, (\mathbf{x}_n, y_n)\}\). Here \(\mathbf{x}\) is one row of features, \(y\) is whether that customer churned, and \(n = 1000\) is how many labeled customers we have to learn from.

Two forks decide what kind of target you have:

- **Do you have labels at all?** If yes, it is **supervised** (learn to predict a known answer). If you only have features and want to find natural groupings, that is **unsupervised** learning (clustering), a different tool for a different question.
- **Is the target a category or a number?** A category ("churns" vs "stays") makes it **classification**. A number ("how many boxes next quarter") makes it **regression**.

We do have the answer for past customers: `days_to_cancel` records who canceled and when. Here are a few who did.

```r
# a few customers who did cancel, and how many days after the snapshot
head(subset(cust, !is.na(days_to_cancel),
            select = c(customer_id, tenure_months, boxes_skipped_last_mo, days_to_cancel)), 4)
#>    customer_id tenure_months boxes_skipped_last_mo days_to_cancel
#> 21          21             3                     1              6
#> 23          23            33                     1              2
#> 32          32            15                     1             44
#> 37          37             4                     0             11
```

Look at customer 32: they canceled, but 44 days after the snapshot. Whether they count as a "churn" depends entirely on the window we choose, which is exactly the next decision.

=== step === quiz
::eyebrow Check yourself
## Which kind of problem is this?

Priya decides to predict, for each subscriber, whether they will cancel within 30 days, recorded as `yes` or `no`, and she has that answer for thousands of past customers. What kind of learning problem is this?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Unsupervised learning, because we are grouping similar customers together ::no There is no grouping here: we have a known answer (churned or not) for past customers and want to predict it. A known label to reproduce means supervised, not unsupervised.
- Supervised classification, because we predict a category (yes or no) from labeled past examples ::ok Exactly. Labeled examples make it supervised; a yes/no target makes it classification. If the target were a number, like weeks-until-cancel, it would be regression instead.
- Supervised regression, because we predict a number ::no It would be regression if the target were a number (weeks until cancel, say). But "cancel within 30 days: yes or no" is a category, so this is classification.

=== step === tryit
::eyebrow Your turn
## Define the target precisely

A precise target is a rule a computer can evaluate, not a vague word. "Churn" becomes: **the customer canceled within 30 days of the snapshot.** Fill in the blank so the label uses a 30-day window. Anyone with no cancellation (`NA`) counts as `no`.

```r
cust$churn <- ifelse(!is.na(cust$days_to_cancel) &
                     cust$days_to_cancel <= ____, "yes", "no")
table(cust$churn)
```
::check {"regex":"30","gate":true,"difficulty":"beginner","ok":"That is a computable target: 920 stay, 80 churn. Notice customer 32 (44 days) lands in 'no', because 44 is outside the 30-day window. Change the window and you change the problem.","no":"Fill in 30: a customer churns if they cancel within 30 days of the snapshot. The window is part of the definition, not an afterthought."}
::solution
```r
cust$churn <- ifelse(!is.na(cust$days_to_cancel) &
                     cust$days_to_cancel <= 30, "yes", "no")
table(cust$churn)
#>
#>  no yes
#> 920  80
```

=== step === concept
::eyebrow Decision 3
## The features: only what you will know at prediction time

A **feature** is an input the model is allowed to use. The rule that trips up more real projects than any other is simple to state: **a feature must be knowable at the exact moment you make the prediction**, and never later.

When Priya scores a customer on Monday morning, she knows their tenure, how many boxes they skipped, their support tickets, how long since they logged in, and their plan. She does **not** yet know `days_to_cancel`, because that only exists once a customer has actually canceled. Using it to predict churn would be looking into the future: the model would score a perfect 100% in testing and then fail completely in production, where that column is empty for everyone still active. That failure mode is called **leakage**, and Lesson 3 is devoted to it. For now, the framing move is to keep only the honest columns.

```r
features <- c("tenure_months", "boxes_skipped_last_mo",
              "support_tickets_90d", "weeks_since_login", "plan")

# What is left over is NOT a feature: we only learn it AFTER a customer
# churns, so feeding it to the model would be looking into the future.
setdiff(names(cust), c(features, "customer_id", "churn"))
#> [1] "days_to_cancel"
```

[WARNING]
`days_to_cancel` is allowed to build the target (that is history), but it is forbidden as a feature (that is the future). The same column can be legitimate for one job and a leak for another. Always ask: would I actually have this value at the instant I need to predict?

=== step === quiz
::eyebrow Check yourself
## Spot the leak

You are choosing features to score a customer at the Monday snapshot. Which one must you throw out, because you would not actually have it at that moment?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Boxes skipped in the last month ::no That is known at the snapshot: it summarizes past behavior up to Monday. Perfectly fair to use as a feature.
- The reason the customer gave when they canceled ::ok Right. A cancellation reason only exists once the customer has already churned, so it is not available at prediction time. Using it leaks the answer and inflates your test score.
- The number of months the customer has been subscribed ::no Tenure is known at the snapshot and is a fair, useful feature. It does not depend on anything that happens after you predict.

=== step === concept
::eyebrow Decision 4
## The metric: match the score to the decision

The last decision is how you score a prediction, and it is where good framing quietly wins or loses. The trap is defaulting to **accuracy**, the fraction of predictions that are correct, because on a rare event it is deeply misleading.

Let \(\pi\) be the **base rate**, the fraction of customers who actually churn. A model that ignores everything and predicts "will not churn" for all 1000 customers is correct on every non-churner, so its accuracy is exactly \(1 - \pi\), with no skill whatsoever.

```r
mean(cust$churn == "yes")     # base rate: churn is rare
#> [1] 0.08
mean("no" == cust$churn)      # accuracy of "predict nobody churns"
#> [1] 0.92
```

Ninety-two percent accuracy, and it would tell Priya to call no one. Accuracy is the wrong headline because it rewards a useless model. The fix is to score the thing the decision actually cares about. Priya's decision is concrete: **the team can phone 100 customers a week**, so what matters is who lands in that top-100 list. Two metrics measure that directly, where \(k = 100\) is the call budget:

\[ \text{precision} = \frac{\text{churners among the 100 we call}}{100}, \qquad \text{recall} = \frac{\text{churners among the 100 we call}}{\text{all churners}} \]

Precision asks "of the calls we make, how many were worth it?"; recall asks "of the customers about to leave, how many did we reach?". Choosing a call budget is really choosing a **threshold** on a risk score: call everyone above it. The widget below lets you slide that threshold and watch precision and recall trade off against each other, one number never telling the whole story.

::widget roc-curve {}

Now score FreshBox's actual decision. The `glm` call below fits a quick risk score, one number from 0 to 1 per customer; how it works is the subject of later lessons, so treat it as a black box here. We rank every customer by that score, call the 100 highest, and measure precision and recall on that list.

```r
fit <- glm(churn == "yes" ~ tenure_months + boxes_skipped_last_mo +
           support_tickets_90d + weeks_since_login,
           data = cust, family = binomial)
cust$risk_score <- predict(fit, type = "response")

# The team can phone 100 customers a week. Call the 100 highest-risk.
called <- order(cust$risk_score, decreasing = TRUE)[1:100]

c(churners_reached = sum(cust$churn[called] == "yes"),
  precision_at_100 = round(mean(cust$churn[called] == "yes"), 2),
  recall_at_100    = round(sum(cust$churn[called] == "yes") / sum(cust$churn == "yes"), 2))
#>  churners_reached  precision_at_100     recall_at_100
#>             38.00              0.38              0.48
```

[KEY INSIGHT]
Calling 100 random customers would reach about 8 churners (the base rate). Ranking by the model and calling the top 100 reaches 38, nearly five times as many, and covers 48% of everyone about to leave. That lift is the number Priya can defend to her boss, and accuracy never showed it.

=== step === quiz
::eyebrow Check yourself
## Why is 92% not the win it looks like?

A model that predicts "will not churn" for every customer scores 92% accuracy on FreshBox's data. Why is that the wrong thing to celebrate?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because 92% is actually a low accuracy, and good churn models score above 99% ::no The problem is not that 92% is low. The problem is that 92% is high and still worthless, because it comes from never predicting a churn at all.
- Because churn is rare (8%), so "predict nobody churns" is 92% accurate while catching zero of the customers Priya needs to call ::ok Exactly. On a rare event, accuracy is dominated by the easy majority class. The decision needs precision and recall on the call list, which expose the do-nothing model as useless.
- Because accuracy can only be trusted when it is above 95% ::no There is no universal cutoff. Accuracy misleads here specifically because the classes are imbalanced and the decision is capacity-limited, not because of where the number sits.

=== step === concept
::eyebrow Putting it together
## The FreshBox framing spec

Four decisions, all made before a model was chosen. Written down, they turn "customers keep canceling" into a problem a model can solve, and a result Priya can act on.

| Decision | FreshBox answer |
|---|---|
| **Unit of analysis** | One active subscriber, as of the Monday snapshot |
| **Target** | `churn` = canceled within 30 days (supervised, classification) |
| **Features** | Tenure, boxes skipped, support tickets, weeks since login, plan, all known at the snapshot |
| **Metric** | Precision and recall among the 100 customers the team can call |

Every downstream step, which model, which features to engineer, how to tune, is now well defined. That is what framing buys you: not a model yet, but a target worth modeling.

=== step === quiz
::eyebrow Check yourself
## Frame a new problem

A clinic wants to cut missed appointments. A staffer can phone the 50 patients most likely to miss tomorrow's slots and offer to reschedule. Which framing fits that decision?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Unit = one patient; target = the patient's lifetime no-show rate; metric = overall accuracy ::no Two mistakes: the action is per-appointment (call about tomorrow's slot), not per-patient-lifetime, and accuracy misleads when no-shows are rare and the call list is capped.
- Unit = one scheduled appointment; target = will this appointment be a no-show (yes/no); metric = precision and recall among the 50 flagged ::ok Right. The unit matches the action (one upcoming appointment), the target is a precise yes/no you can label from history, and precision/recall on the 50 calls reflect the capacity-limited decision, exactly the FreshBox pattern.
- Unit = one day; target = the number of no-shows that day; metric = overall accuracy ::no Predicting a daily count does not tell the staffer WHICH patients to phone, so it does not serve the decision. The grain has to match the action: one appointment.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Provost and Fawcett, Data Science for Business](https://www.oreilly.com/library/view/data-science-for/9781449374273/) - the book that hammers "start from the decision," with chapters on framing and expected value.
- [CRISP-DM, the cross-industry standard process](https://en.wikipedia.org/wiki/Cross-industry_standard_process_for_data_mining) - the six-phase lifecycle this lesson follows, with the original references.
- [Google, Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) - hard-won field rules on framing a problem, choosing a metric, and avoiding leakage.
- [An Introduction to Statistical Learning, ch. 2 (free PDF)](https://www.statlearning.com/) - supervised vs unsupervised, classification vs regression, and how to measure accuracy honestly.

=== step === complete
## Lesson 1 complete

You can now turn a fuzzy business question into a well-posed prediction problem: fix the unit of analysis, define a precise and labeled target, keep only the features you will truly have at prediction time, and score the model on a metric that matches the decision. That framing spec is the foundation every later step is built on.

Next, Lesson 2: The Bias-Variance Tradeoff. You have a well-posed problem; now we meet the single idea that decides whether your model actually works on new data, and why a more flexible model is not always a more accurate one.

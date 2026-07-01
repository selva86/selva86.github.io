---
title: "Machine Learning in Production Lesson 4: Batch vs real-time inference"
catalog_blurb: "Match the way you serve a model to the decision it drives."
description: "Batch vs real-time inference in R: score everyone on a schedule or one customer on demand, the trade-offs, and how to pick the serving pattern that fits the decision."
keywords: "batch inference, real-time inference, online inference, model serving, MLOps in R, predict on a schedule, feature store, batch scoring R, prediction latency, staleness"
post_type: "LESSON"
curriculum_id: "6.120.4"
webr: true
mathjax: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "4"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: "Monitoring-and-Drift.html"
course_prev: "Serving-a-Model-with-plumber.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## Batch vs real-time inference

In Lesson 3, Dev put his meal-kit cancellation model behind a [live API](Serving-a-Model-with-plumber.html): the billing system POSTs one customer and a cancellation probability comes straight back. That is one way to serve a model. But it is not the only one, and it is often not the right one.

Sometimes you do not need an answer the instant a customer acts. Sometimes you would rather score **every** subscriber overnight in one big job and just look up the answer in the morning. Those are the two serving patterns, **real-time** and **batch**, and picking the wrong one costs you either freshness or a lot of needless machinery.

By the end of this lesson you will be able to:

- Explain what batch (offline) and real-time (online) inference are, and how each gets a prediction to whoever needs it
- Run a batch job in R that scores a whole table of customers in a single call and stores the result
- Choose the right pattern for a given decision, and name the hybrid that uses both

**Prerequisites:** Lesson 3 (the live prediction API), and you can [fit a model and read `predict` output](Your-First-End-to-End-Model-in-R.html).

::widget process-flow {"steps":[{"title":"Real-time inference","sub":"score one customer the instant a decision is needed"},{"title":"Batch inference","sub":"score everyone on a schedule, store it, look it up later"}]}

=== step === concept
::eyebrow One pattern
## Real-time inference: one prediction, the moment it is needed

The API you built in Lesson 3 is **real-time** (also called **online**) inference: a system asks for a prediction about **one** case, right now, and waits for the answer.

Picture the moment. A subscriber clicks "Cancel my plan." Before the page even finishes loading, the app POSTs that customer to the model and asks "how likely are they to actually leave?" If the answer is high, it shows a save offer, a discount, a pause option, in the same breath. The decision cannot wait until tonight; the customer is leaving **now**. So the prediction is computed on demand, on the freshest possible input, and must come back in milliseconds.

Strip away the web plumbing and the model is doing something you already know how to do: turning one row of customer data into a probability. Let us rebuild Dev's model inline (each lesson runs in its own fresh R session) and score that one leaving customer.

```r
# Dev's cancellation model, rebuilt from scratch (one row per subscriber)
set.seed(1)
n <- 200
subscribers <- data.frame(
  boxes_ordered = rpois(n, 8) + 1,
  weeks_since   = rpois(n, 3),
  spend_per_box = round(runif(n, 6, 22), 1)
)
p <- plogis(-1.4 + 0.18 * subscribers$weeks_since - 0.02 * subscribers$boxes_ordered)
subscribers$cancelled <- rbinom(n, 1, p)

model <- glm(cancelled ~ boxes_ordered + weeks_since + spend_per_box,
             data = subscribers, family = binomial)

# The customer who just clicked Cancel: 3 boxes, 6 weeks since last order, $12.50 a box
one_customer <- data.frame(boxes_ordered = 3, weeks_since = 6, spend_per_box = 12.5)
unname(predict(model, one_customer, type = "response"))
#> [1] 0.3768709
```

About a 38% chance this customer cancels, the same number the plumber endpoint returned in Lesson 3. That is real-time inference in one line: one row in, one fresh probability out, delivered on demand. The flow below is the whole round trip.

::widget process-flow {"steps":[{"title":"A customer acts","sub":"clicks Cancel on the subscription page, right now"},{"title":"The app calls the model API","sub":"POST that one customer to /predict (Lesson 3)"},{"title":"The model scores one row","sub":"using the customer state as it is this second"},{"title":"A prediction returns in milliseconds","sub":"cancel risk comes straight back"},{"title":"The app acts immediately","sub":"high risk, so show a save offer before they leave"}]}

=== step === concept
::eyebrow The other pattern
## Batch inference: score everyone on a schedule

Now flip the picture. Dev's retention team does not sit and wait for cancel clicks. Every morning they want a list: "which subscribers are most at risk this week, so we can email them a discount?" Nobody needs a millisecond answer, and the audience is everyone, not one person.

That is **batch** (also called **offline**) inference. A job runs on a **schedule**, say 2am nightly, loads the entire subscriber table at once, scores every row in one pass, and writes a prediction for each customer into a table. The predictions just sit there. When the retention team arrives, they read the table. When the dashboard refreshes, it reads the table. No model runs at read time; the answer was computed hours ago and stored.

Here is what the scheduled job looks like as a script you would hand to a scheduler (cron, Airflow, or the `targets` pipeline from Lesson 1). It runs on a server, not in this page, so it is shown for reading:

```r-static
# score_all.R  -  the nightly batch job, run on a schedule (not in the browser)
library(readr)
model       <- readRDS("cancellation-model.rds")   # the versioned model (Lesson 2)
subscribers <- read_csv("subscribers.csv")          # everyone, pulled fresh from the warehouse
subscribers$cancel_prob <- predict(model, subscribers, type = "response")
write_csv(subscribers, "nightly_scores.csv")        # the table consumers read tomorrow
```

::widget process-flow {"steps":[{"title":"A schedule fires","sub":"a nightly job starts at 2am, no human needed"},{"title":"Load every subscriber","sub":"pull the whole customer table from the warehouse"},{"title":"Score them all in one call","sub":"a single vectorized predict, not one request each"},{"title":"Write predictions to a table","sub":"one risk score per customer, saved for the day"},{"title":"Consumers look them up","sub":"the retention team reads the table each morning"}]}

=== step === tryit
::eyebrow In R
## Score the whole table in one call

The heart of that batch job is one line, and it is the same `predict` you just used for one customer, handed the **entire** table instead of a single row. Because `predict` is **vectorized** (it takes a whole table of rows at once, not one row at a time), a single call scores all 200 subscribers. That is the efficiency of batch: you pay the setup cost once, not once per customer.

Fill in the blank so `predict` scores every row of `subscribers`, not just one.

```r
# Batch scoring: score the WHOLE table in one call, not one row at a time
scored <- subscribers
scored$cancel_prob <- round(predict(model, ____, type = "response"), 3)

# the highest-risk subscribers, the list the retention team wants
head(scored[order(-scored$cancel_prob),
            c("boxes_ordered", "weeks_since", "spend_per_box", "cancel_prob")], 5)
```
::check {"regex":"predict\\(\\s*model\\s*,\\s*subscribers","gate":true,"difficulty":"intermediate","ok":"That is batch inference: one vectorized call scores every row of the table at once. Pass the whole data frame, not a single customer.","no":"Pass the whole table as the newdata argument: predict(model, subscribers, type = \"response\"). One call, every row."}
::solution
```r
scored <- subscribers
scored$cancel_prob <- round(predict(model, subscribers, type = "response"), 3)
head(scored[order(-scored$cancel_prob),
            c("boxes_ordered", "weeks_since", "spend_per_box", "cancel_prob")], 5)
#>     boxes_ordered weeks_since spend_per_box cancel_prob
#> 106             7           8          21.5       0.493
#> 141            10           8          12.4       0.480
#> 124             6           8           8.1       0.468
#> 155             9           7          18.3       0.441
#> 140             9           7          15.9       0.437
```

=== step === concept
::eyebrow The deliverable
## Batch delivers a table, not a live answer

Notice what real-time and batch actually hand over. Real-time hands over a **service**: something calls it and waits. Batch hands over a **stored table**: a file (or a database row) that already holds the answer, which anyone can read later without touching the model at all.

Write today's scores to a file, and hours later a consumer just reads it back, no model, no R session, no waiting:

```r
# Batch's product is a stored table. Write today's top-risk list where consumers can read it:
top <- head(scored[order(-scored$cancel_prob),
            c("boxes_ordered", "weeks_since", "spend_per_box", "cancel_prob")], 5)
write.csv(top, "nightly_scores.csv", row.names = FALSE)

# Hours later, the retention team simply reads the file:
read.csv("nightly_scores.csv")
#>   boxes_ordered weeks_since spend_per_box cancel_prob
#> 1             7           8          21.5       0.493
#> 2            10           8          12.4       0.480
#> 3             6           8           8.1       0.468
#> 4             9           7          18.3       0.441
#> 5             9           7          15.9       0.437
```

[KEY INSIGHT]
A real-time prediction is computed when it is asked for. A batch prediction is computed ahead of time and looked up when it is needed. That single difference, compute-on-demand versus compute-ahead-and-store, drives every trade-off in this lesson.

=== step === quiz
::eyebrow Check yourself
## What does a stored score know?

Dev's 2am batch job scored every subscriber this morning. At 3pm, one subscriber who looked low-risk at 2am suddenly cancels two boxes and files a complaint. A dashboard reads the batch table right now and shows that subscriber. What cancellation risk does it display?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The updated, higher risk: the batch table always reflects a customer's latest state ::no Nothing recomputed the score at 3pm. The number in the table is frozen at what the 2am job produced; the fresh events change it only in tonight's run.
- This morning's lower risk: the score is frozen until the next scheduled run, so it is now stale ::ok Right. A batch prediction is a stored number, at most one refresh interval old. The 3pm events are invisible to it until the job reruns tonight. That staleness is the defining cost of batch inference.
- No score at all: batch predictions expire the moment the input changes ::no They do not expire, they simply sit there going stale until the next run overwrites them. A confidently stale answer, not a missing one, is the real hazard.

=== step === concept
::eyebrow How to choose
## Match the pattern to the decision

You now have both patterns. The skill is choosing, and the trick is to look at the **decision** the prediction serves, not at the model. Three questions settle almost every case:

- **When is the decision made?** On a schedule or in bulk points to batch. The instant a user acts points to real-time.
- **How fresh must the input be?** If the decision hinges on something that just happened (a click, an item added to a cart, a swipe), you need real-time. If it rides on slow-changing traits (tenure, lifetime spend), a nightly batch score is plenty.
- **How fast must the answer come back?** Milliseconds means real-time. "By tomorrow morning" means batch is fine, and cheaper.

Put a number on the freshness cost. If a batch job reruns every \(T\) hours, then a prediction it produced is, by the time a decision reads it, on average \(T/2\) hours old, and at most \(T\) old just before the next run. Here \(T\) is the refresh interval: for a nightly job \(T = 24\), so scores are up to a full day stale. Real-time inference has staleness near zero, because it scores at the moment of the request. That is exactly the trade you are making.

::widget process-flow {"steps":[{"title":"When is the decision made?","sub":"on a schedule, batch; the moment a user acts, real-time"},{"title":"How fresh must the input be?","sub":"reacts to a just-now event, real-time; slow-changing, batch"},{"title":"How fast must the answer be?","sub":"milliseconds, real-time; tomorrow is fine, batch"},{"title":"Pick the pattern that fits","sub":"most decisions point clearly to one"}]}

=== step === quiz
::eyebrow Check yourself
## Which pattern for each decision?

Two decisions at Dev's company. **(A)** The checkout page must decide, before the payment goes through, whether to block a suspicious card swipe, using the details of that swipe. **(B)** Each Monday, marketing wants the 500 subscribers most likely to cancel this week, to mail them a discount. Which serving pattern fits each?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both real-time: a fresh prediction is always better than a stored one ::no Freshness is not free. (B) has no latency pressure and a known audience computed once a week, so a standing real-time service for a Monday email is wasted machinery. Match the pattern to the decision, not to a preference for fresh.
- A is real-time, B is batch: the swipe needs a millisecond answer on input unknown until that instant; the mailing list is a scheduled, bulk, no-rush job ::ok Exactly. (A) is the textbook real-time case: unknown input, an answer needed before the payment completes. (B) is textbook batch: a known set, scored on a schedule, read later.
- A is batch, B is real-time: score every possible swipe overnight, and query the model live for each subscriber on Monday ::no You cannot enumerate every possible card swipe in advance, the input does not exist until the swipe happens, which is why it must be real-time. And a weekly bulk list is exactly what batch is for.

=== step === concept
::eyebrow Where each bites, and the hybrid
## The costs, and using both at once

Neither pattern is free, and knowing where each hurts is what keeps a system out of trouble.

**Batch** is cheap and simple: no always-on server, just a scheduled script and a table. It is also efficient. Serving \(N\) predictions one request at a time costs about \(N(o + s)\), where \(o\) is the per-request overhead (accepting the connection, parsing the input, waking the model) and \(s\) is the actual scoring time; a batch job pays that overhead once and amortizes it, about \(o + Ns\). When \(o\) dwarfs \(s\), batch is dramatically cheaper per prediction. The cost is **staleness** (the \(T/2\) above) and **waste**: you score everyone, including the millions who will never trigger the decision.

**Real-time** is always fresh and computes only what is asked for. The cost is a running service: it must stay up, answer in milliseconds under load, and scale to traffic spikes, which is real operational weight (recall from Lesson 3 that one plumber process handles one request at a time).

Often the best answer is **both**. Precompute the heavy, slow-changing features in a nightly batch job and store them; then at request time, combine those stored features with the one fresh event and score in milliseconds. This is what a **feature store** does, splitting an *offline store* (batch) from an *online store* (real-time). You get real-time freshness on the part that just changed without recomputing everything on every call.

::widget process-flow {"steps":[{"title":"Batch, ahead of time","sub":"precompute the heavy, slow-changing features nightly"},{"title":"Store them for fast lookup","sub":"one quick read per customer, ready to serve"},{"title":"Real-time, on request","sub":"combine the stored features with the live event"},{"title":"Score and respond in milliseconds","sub":"fresh answer, without recomputing everything"}]}

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Huyen, "Machine learning is going real-time" (2020)](https://huyenchip.com/2020/12/27/real-time-machine-learning.html) - the clearest essay on when batch is enough and when you truly need online prediction.
- [Google, "Rules of Machine Learning" (Zinkevich)](https://developers.google.com/machine-learning/guides/rules-of-ml) - 43 production ML rules, including serving and the training/serving skew that batch pipelines invite.
- [Feast documentation: feature stores](https://docs.feast.dev/) - the offline-store / online-store split is exactly the batch / real-time split, and the mechanism behind the hybrid.
- [The `targets` R package manual](https://books.ropensci.org/targets/) - how to build the scheduled, only-reruns-what-changed pipeline your nightly batch job would live in.

=== step === complete
## Lesson 4 complete

You can now tell the two serving patterns apart and, more importantly, choose between them. Real-time inference scores one case on demand, freshest input, millisecond answer, at the price of an always-on service. Batch inference scores everyone on a schedule and stores the result for lookup, cheap and simple, at the price of staleness up to one refresh interval. The decision the prediction serves, its timing, freshness, and latency, tells you which to reach for, and a feature-store hybrid lets you have both where it counts.

Next, Lesson 5: **Monitoring and drift.** Predictions are flowing now, in batch, in real time, or both. But a model that was accurate at launch quietly decays as the world shifts underneath it. You will learn to watch the inputs and the performance after launch, and to know when it is time to retrain.

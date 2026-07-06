---
title: "Machine Learning in Production Lesson 4: Batch vs real-time inference"
catalog_blurb: "Match the way you serve a model to the decision it drives."
description: "Batch vs real-time inference in R: score every subscriber overnight in one job or answer one at a time behind a live API, and how to pick the right pattern."
keywords: "batch inference, real-time inference, online inference, model serving, batch prediction, predict in R, staleness, latency, MLOps in R, feature store"
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

In Lesson 3 you put Dev's meal-kit cancellation model behind a [live API](Serving-a-Model-with-plumber.html): the billing system POSTs one customer, the model answers in a fraction of a second. That is one way to serve a model, called **real-time**, and it is perfect when a system is waiting on a single answer right now.

But the very same model does another job every week that looks nothing like that. Every Monday, marketing wants a list of all the subscribers likely to cancel this week, so they can email them a win-back offer. Nobody is sitting there waiting. The list just needs to be ready by 9am.

Same model, two completely different jobs. This lesson is about the second way to serve a model, **batch**, and, more importantly, how to look at a decision and know which way fits.

By the end of this lesson you will be able to:

- Explain batch and real-time (online) inference, and run each one in R
- Use three questions, who is waiting, how fresh, and how much it costs, to choose the right pattern for a decision
- Quantify how stale a batch prediction gets, and reach for the precompute-and-cache hybrid when you want both

**Prerequisites:** Lesson 3 (the live prediction API) and you can [fit a model and read `predict` output](Your-First-End-to-End-Model-in-R.html).

::widget process-flow {"steps":[{"title":"Who is waiting?","sub":"a person on a page, or nobody right now"},{"title":"How fresh must it be?","sub":"seconds old, or is last night fine"},{"title":"Batch or real-time","sub":"those two answers pick the pattern for you"}]}

=== step === concept
::eyebrow The whole lesson in one picture
## The same model, two very different jobs

Hold the two jobs side by side. They use identical code to make a prediction, `predict(model, customer)`, and yet almost everything around that one line is different.

| | Monday retention email | Cancel-subscription page |
|---|---|---|
| Who needs it | marketing, once a week | a customer, mid-click |
| Who is waiting | nobody | a person, on the page |
| How many at a time | all 24,000 subscribers | this one customer |
| How soon | by Monday 9am | within a fraction of a second |
| Freshness needed | last night is fine | must reflect right now |

The email job scores everyone in advance and stores the answers. The cancel page scores one person the instant they act. Those are the two serving patterns, and the columns above are exactly the questions that will tell you which to use. Let us build each one, then come back to the questions.

=== step === concept
::eyebrow Pattern one
## Batch inference: score the whole table at once

**Batch inference** (also called offline inference) means: take a whole table of cases, run the model over every row in one go, and save the predictions. Nothing is computed on demand. When someone needs an answer later, they read it from the saved table, the way you would look up a phone number.

The picture to keep in your head is simple. You start with a table of subscribers, one row each. Batch scoring adds one new column, the prediction, to every row. That is the entire idea. Press Run below to add a `cancel_prob` column to a handful of customers, then press "Show what changed" to see the new column appear.

::widget table-transform {"code":"df %>% mutate(cancel_prob = round(plogis(-1.4 + 0.18 * weeks_since - 0.02 * boxes_ordered), 2))","caption":"Batch scoring adds one prediction column to every row of the table.","before":{"cols":["boxes_ordered","weeks_since","spend_per_box"],"rows":[[3,6,12.5],[12,1,8],[5,4,15.2],[9,7,9.9],[2,2,20]]},"after":{"cols":["boxes_ordered","weeks_since","spend_per_box","cancel_prob"],"rows":[[3,6,12.5,0.41],[12,1,8,0.19],[5,4,15.2,0.31],[9,7,9.9,0.42],[2,2,20,0.25]]}}

A logistic model turns each row's numbers into a probability with exactly that shape, a value between 0 and 1. Batch inference just does it for every row.

=== step === concept
::eyebrow Batch, for real
## One call scores the entire base

That toy table had five rows. Dev's real base has 24,000 subscribers, and the beauty of `predict` is that scoring one row and scoring all of them is the *same call*: hand it the whole data frame and it returns a probability for every row in one pass.

Each lesson starts in a fresh R session, so we rebuild the exact model from Lessons 1 to 3, then create tonight's base of subscribers to score. (In real life the model was trained once and stored; here we refit it inline so the page is self-contained.)

```r
# 1. The cancellation model from Lessons 1 to 3, refit here (200 past customers)
set.seed(1)
n <- 200
customers <- data.frame(
  boxes_ordered = rpois(n, 8) + 1,
  weeks_since   = rpois(n, 3),
  spend_per_box = round(runif(n, 6, 22), 1)
)
p <- plogis(-1.4 + 0.18 * customers$weeks_since - 0.02 * customers$boxes_ordered)
customers$cancelled <- rbinom(n, 1, p)
model <- glm(cancelled ~ boxes_ordered + weeks_since + spend_per_box,
             data = customers, family = binomial)

# 2. Tonight's job: the current base of active subscribers, no outcome yet (that is what we predict)
set.seed(7)
subscribers <- data.frame(
  customer_id   = 1:24000,
  boxes_ordered = rpois(24000, 8) + 1,
  weeks_since   = rpois(24000, 3),
  spend_per_box = round(runif(24000, 6, 22), 1)
)

# 3. Batch score: ONE predict call adds a probability for all 24,000 rows
subscribers$cancel_prob <- round(predict(model, subscribers, type = "response"), 3)

nrow(subscribers)
#> [1] 24000
head(subscribers[, c("customer_id", "boxes_ordered", "weeks_since", "spend_per_box", "cancel_prob")])
#>   customer_id boxes_ordered weeks_since spend_per_box cancel_prob
#> 1           1            16           3          19.4       0.272
#> 2           2             8           5          10.0       0.333
#> 3           3             6           5          11.0       0.332
#> 4           4             5           1          11.2       0.184
#> 5           5             7           6          11.9       0.380
#> 6           6            11           4           7.5       0.289
```

One line, `predict(model, subscribers, ...)`, scored twenty-four thousand people. No web request, no waiting, just a single vectorized pass. That is the engine of every batch job.

=== step === concept
::eyebrow Batch is a pipeline
## Score on a schedule, store the answers, read them later

A batch job is not a live service. It is a **scheduled pipeline**: at a fixed time (say Sunday at 2am, a tool like cron or `targets` triggers it), it pulls the base, scores everyone, and writes the results to a table. The people who need predictions never touch the model. They read the stored table.

::widget process-flow {"steps":[{"title":"Sunday 2am","sub":"a scheduler pulls every active subscriber"},{"title":"Score all at once","sub":"one predict call over the whole table"},{"title":"Write a table","sub":"save each customer id and its risk"},{"title":"Monday 9am","sub":"marketing reads the table, sends the offers"}]}

The "write a table, read it later" split is the heart of batch. Writing the predictions out and reading them back is exactly what happens between Sunday night and Monday morning:

```r
# Sunday night: the job writes the predictions table
predictions <- subscribers[, c("customer_id", "cancel_prob")]
write.csv(predictions, "cancellation-risk.csv", row.names = FALSE)

# Monday morning: marketing's tool just loads the table, the model is nowhere in sight
monday <- read.csv("cancellation-risk.csv")
head(monday)
#>   customer_id cancel_prob
#> 1           1       0.272
#> 2           2       0.333
#> 3           3       0.332
#> 4           4       0.184
#> 5           5       0.380
#> 6           6       0.289
```

In production that table is a database or a cloud file rather than a CSV, but the shape is identical: the predictions are computed once, stored, and looked up cheaply as many times as you like.

=== step === tryit
::eyebrow Your turn
## Build the Monday campaign list

Marketing does not want all 24,000 rows. They want the **at-risk** ones: subscribers whose cancellation probability is at least 0.5, so they can send those people a win-back offer. That is a plain filter on the scored table.

`subset(data, condition)` keeps only the rows where the condition is TRUE. Fill in the cutoff so `campaign` holds only the subscribers at 0.5 risk or higher.

```r
# The Monday campaign list: keep only the at-risk subscribers
campaign <- subset(subscribers, cancel_prob >= ____)
nrow(campaign)
```
::check {"regex":"0*\\.5","gate":true,"difficulty":"intermediate","ok":"That is the batch payoff: scored once overnight, then a one-line filter turns 24,000 predictions into a targeted list of 101 people to email.","no":"Use the 0.5 cutoff: cancel_prob >= 0.5 keeps only the subscribers at or above 50% risk."}
::solution
```r
campaign <- subset(subscribers, cancel_prob >= 0.5)
nrow(campaign)
#> [1] 101
```

=== step === concept
::eyebrow Pattern two
## Real-time inference: score one customer on demand

**Real-time inference** (also called online inference) is the opposite shape. Nothing is precomputed. A request arrives for one case, the model scores it on the spot, and the answer goes straight back, usually in milliseconds. This is exactly the plumber API from Lesson 3.

Picture the cancel-subscription page. A customer clicks "Cancel", and before the page reloads it wants to show a save-offer tuned to how likely this person is to actually leave.

::widget process-flow {"steps":[{"title":"Customer clicks Cancel","sub":"on the subscription page, right now"},{"title":"App sends one customer","sub":"a POST to the model API, as JSON"},{"title":"Score one row","sub":"the model returns a risk in milliseconds"},{"title":"Show a save-offer","sub":"tailored to that risk, before they leave"}]}

Strip away the web layer and the endpoint is just the function from Lesson 3: one customer in, one probability out, computed the instant it is asked for.

```r
# The endpoint's job: score exactly one customer, on demand
score_customer <- function(boxes_ordered, weeks_since, spend_per_box) {
  newdata <- data.frame(boxes_ordered, weeks_since, spend_per_box)
  unname(predict(model, newdata, type = "response"))
}

# The customer now clicking Cancel: 3 boxes, last order 6 weeks ago, $12.50 a box
score_customer(boxes_ordered = 3, weeks_since = 6, spend_per_box = 12.5)
#> [1] 0.3768709
```

About a 38% chance, computed right now for this one person, the same number the API returned in Lesson 3. Batch scored everyone ahead of time; real-time scores one person the moment they act.

=== step === quiz
::eyebrow Check yourself
## Does the nightly batch job retrain the model?

Dev's batch job runs every night and writes fresh cancellation probabilities for all 24,000 subscribers. A teammate says, "So the model relearns from the newest data on every run." Are they right?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No. The batch job re-scores every subscriber with the already-fitted model; retraining on new data is a separate, much less frequent job. ::ok Exactly. Inference is applying a fixed model; training is building it. Batch just means you run inference over many rows at once, on a schedule. The coefficients do not change.
- Only the subscribers who are brand new since the last run get scored. ::no Each run scores the whole base, not only new customers, and none of it refits the model.
- Yes. Running inference in batch means the model refits on the latest data each night before it scores. ::no This is the key confusion to avoid: inference (scoring with a fixed model) is not training (refitting the model). Batch is about scoring many rows at once, on a schedule; the model itself is untouched.

=== step === concept
::eyebrow Question 1
## Who is waiting? (latency)

Now the useful part: how to choose. The first question is the sharpest. **Is a person or a system waiting on this specific prediction?**

On the cancel page, a human is staring at the screen. If the save-offer takes three seconds to appear, they have already left. That job has a **latency budget**, the time it is allowed to take, of maybe a couple hundred milliseconds. Only real-time can meet it, because the answer has to be computed for this exact customer, now.

The Monday email has no one waiting. If the scoring job takes twenty minutes, or an hour, nobody notices, as long as it finishes before 9am. No latency budget, so batch is the natural fit.

[KEY INSIGHT]
If something is waiting on the answer, lean real-time. If nothing is waiting, lean batch. "Is anyone waiting?" is the single most useful question, and it usually settles the matter on its own.

=== step === concept
::eyebrow Question 2
## How fresh must it be? (staleness)

The second question is about time. A batch prediction is a **photograph**: it captures a subscriber the moment the job ran, and it stays frozen until the next run replaces it. Between runs, the real customer keeps living, but the stored score does not move.

We can put a number on how out-of-date it gets. Call \(T\) the number of hours between batch runs (a nightly job has \(T = 24\)). Write \(\bar{s}\) for the **average staleness**, the typical age of a prediction at the moment it is actually used. If the thing the prediction depends on can change at any time within the interval, then on average a used prediction is half an interval old:

\[ \bar{s} = \frac{T}{2}, \qquad \text{worst case } = T \]

So a nightly job serves predictions that are, on average, \(24/2 = 12\) hours old, and up to 24 hours old just before the next run. Re-run every 6 hours instead and the average staleness drops to \(6/2 = 3\) hours. Real-time sits at the other extreme: it computes the answer at the moment of use, so \(\bar{s} \approx 0\).

Staleness only *matters*, though, when the inputs move fast compared to \(T\). Dev's `boxes_ordered` creeps up slowly over months, so a day-old score of it is perfectly fine. But "items in the cart right now" changes by the second, and no nightly batch can ever be fresh enough for it.

=== step === quiz
::eyebrow Check yourself
## From daily to hourly

Dev moves the retention scoring from once a day to once an hour, and changes nothing else, same model, same subscribers. What does that actually buy him?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The scores are fresher: their average age drops from about 12 hours to about 30 minutes. ::ok Right. Average staleness is T/2, so going from T = 24h to T = 1h takes the typical prediction's age from 12 hours to about half an hour. Same model, fresher answers.
- Nothing changes: a stored batch score is current until you delete it. ::no A stored score is frozen at the instant it was written. Between runs the customer moves on and the score does not, which is exactly the staleness the shorter interval reduces.
- The model gets more accurate, because scoring it hourly retrains it more often. ::no Scoring is not training. Running the same fixed model more often changes freshness, not accuracy.

=== step === concept
::eyebrow Question 3
## How much will it cost? (throughput)

The third question is about money and machines. Batch is cheap per prediction because it pays its fixed costs once. Real-time buys you instant answers, but you pay for a server that must sit running around the clock, ready for a request that might come at 3am, sized for your busiest minute even though most minutes are quiet.

Put \(o\) for the per-request overhead a live service adds to every call, the network round-trip, parsing the request, and its slice of that always-on server, \(s\) for the time to score one row, and \(N\) for the number of predictions. The two patterns cost, roughly:

\[ \text{batch} \approx o + N s \qquad\qquad \text{real-time} \approx N(o + s) \]

Batch pays the overhead \(o\) once for the whole run and then just scores; real-time pays \(o\) again on every single call. You saw this concretely two steps back: `predict(model, subscribers)` scored 24,000 people in one local pass with zero network overhead. Serving those same 24,000 as live requests would mean 24,000 round-trips. When \(N\) is large and no one is waiting, batch wins on cost by a wide margin.

=== step === quiz
::eyebrow Check yourself
## Pick the pattern

A card payment must be approved or declined the instant the customer taps "Pay", using the details of that exact transaction. Which serving pattern fits?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Batch: millions of payments a day means the efficient choice is one big overnight scoring job. ::no Throughput is not the deciding axis here. Someone is waiting at the terminal and the decision needs this transaction's live details, so an overnight score is both too slow and too stale.
- Batch: real-time inference is only ever needed for recommendations and ads. ::no Real-time is for any decision with someone (or something) waiting on a fresh, case-specific answer, and a payment approval is the textbook case.
- Real-time: someone is waiting at checkout and the decision needs this transaction's live details, so it must be scored on demand. ::ok Right. A person is waiting (latency) and the answer depends on what is happening right now (freshness). Both questions point to real-time; the sheer volume does not change that.

=== step === concept
::eyebrow The best of both
## You do not always have to choose

Batch and real-time are not a strict either/or. A common, powerful pattern is to **precompute in batch and serve in real-time**: score everyone overnight, write each answer into a fast key-value store, and let the live page simply *look up* the stored risk in milliseconds. No model runs at request time at all, yet the page answers instantly.

::widget process-flow {"steps":[{"title":"Score nightly (batch)","sub":"compute every subscriber risk overnight"},{"title":"Cache the answer","sub":"write each risk to a fast key-value store"},{"title":"Look it up (real-time)","sub":"the cancel page reads the risk in a few ms"}]}

This gives you real-time *serving* speed with batch *freshness*, and it is a genuine spectrum, not two boxes:

- **Batch**: score everything on a schedule (freshest input is the last run).
- **Precompute and cache**: batch scores, fast lookups serve them.
- **Streaming / near-real-time**: re-score as new events arrive, seconds behind.
- **On-demand real-time**: compute at the moment of the request, freshest possible.

The precompute trick works only when the answer does not depend on something that just happened in *this* session. If it does, for example a risk that hinges on the item added to the cart ten seconds ago, you are back to needing true real-time.

=== step === concept
::eyebrow Know the trade-offs
## Where each one breaks

No pattern is free. Choosing well means knowing what each one costs you, not just what it gives.

| | Batch | Real-time | Precompute and cache |
|---|---|---|---|
| Latency | minutes to hours | milliseconds | milliseconds |
| Freshness | as old as the last run | always current | as old as the last run |
| Cost per prediction | very low (amortized) | high (always-on server) | low, plus a store to run |
| Ops burden | a scheduled job | a live, scalable service | both a job and a store |
| Blind spot | a brand-new case has no score yet | a slow model blocks the user | stale between runs, like batch |

Two failure modes are worth naming. Batch is **blind to anything new**: a subscriber who joined this morning has no row in last night's table, so they get no offer until tomorrow. Real-time is **operationally heavy**: the service has to stay up, handle traffic spikes, and answer fast, and if the model is slow to load or run, every user feels it. The right choice is the one whose blind spot you can live with for the decision at hand.

=== step === tryit
::eyebrow Synthesis
## The call list

The retention team can only phone a handful of people a day, so they want the **highest-risk** subscribers first. That means sorting the scored table by `cancel_prob`, from highest to lowest, and taking the top few. `order(x)` returns the row positions that sort `x` ascending, so a leading minus sign, `order(-x)`, sorts descending.

Fill in the blank so `top8` holds the eight subscribers with the highest cancellation risk.

```r
# The 8 highest-risk subscribers, for the save-team to call first
top8 <- head(subscribers[order(____), ], 8)
top8[, c("customer_id", "cancel_prob")]
```
::check {"regex":"-\\s*subscribers\\$cancel_prob|cancel_prob.*decreasing\\s*=\\s*(TRUE|T)","gate":true,"difficulty":"intermediate","ok":"That is a complete batch product: score the whole base once, sort by risk, and hand the team a ranked call list. All of it reads from the stored predictions, never the live model.","no":"Sort by descending risk with order(-subscribers$cancel_prob) (the minus flips ascending to descending)."}
::solution
```r
top8 <- head(subscribers[order(-subscribers$cancel_prob), ], 8)
top8[, c("customer_id", "cancel_prob")]
#>       customer_id cancel_prob
#> 6404         6404       0.667
#> 243           243       0.627
#> 3135         3135       0.622
#> 15595       15595       0.597
#> 164           164       0.593
#> 15186       15186       0.593
#> 4907         4907       0.591
#> 9953         9953       0.591
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Chip Huyen, Machine learning is going real-time (2020)](https://huyenchip.com/2020/12/27/real-time-machine-learning.html) - a clear tour of the batch-to-real-time spectrum and why teams move along it.
- [Google, Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) - hard-won serving advice, including keeping training and serving consistent.
- [Feast: feature store concepts](https://docs.feast.dev/getting-started/concepts/overview) - the offline store (batch) and online store (real-time) split, which is the precompute-and-serve hybrid in production form.
- [Vertex AI: batch and online predictions](https://cloud.google.com/vertex-ai/docs/predictions/overview) - how a managed platform frames the exact same two patterns.

=== step === complete
## Lesson 4 complete

You now have both ways to serve Dev's model and, more importantly, a way to choose between them. Batch scores a whole table on a schedule and stores the answers for cheap lookup, the Monday email; real-time scores one case on demand, the instant it is needed, the cancel page. Three questions decide it: who is waiting (latency), how fresh it must be (staleness, on average \(T/2\) hours for a batch job), and how much it costs at scale. And when you want low latency and reasonable freshness at once, precompute in batch and serve from a cache.

Next, Lesson 5: **Monitoring and drift.** Predictions are now flowing, in batch and in real time. But a model that was right at launch does not stay right forever, the world it learned from keeps shifting under it. You will learn how to watch the inputs and the accuracy of a live model, and how to know when it is time to retrain.

---
title: "Machine Learning in Production Lesson 6: An ML system design checklist"
catalog_blurb: "The questions to settle before a model ships, from data to rollback."
description: "The go-live checklist for an ML model in R: reframe it as a decision, set a cost-based threshold, catch data leakage, and plan serving and monitoring."
keywords: "ML system design, model deployment checklist, production readiness, cost-based threshold, data leakage, training-serving skew, model monitoring, fallback, model card, MLOps in R"
post_type: "LESSON"
curriculum_id: "6.120.6"
webr: true
mathjax: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "6"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: ""
course_prev: "Monitoring-and-Drift.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## An ML system design checklist

Dev's meal-kit cancellation model is finished. It was built in a reproducible pipeline, versioned, wrapped in a serving endpoint, and wired to a drift monitor. On held-out data it looks good. So Dev's boss asks the only question left: is it safe to turn on?

A model that scores well in a notebook is not the same thing as a system that is safe to run. Between the two sits a short list of design questions, the same six every time, that decide whether a model helps or quietly does harm once it touches real subscribers and real money. This lesson turns everything you built across this course into that checklist.

By the end of this lesson you will be able to:

- Reframe a model as a weekly decision, and hold it to the baseline it must beat
- Set the operating threshold from what a wrong call actually costs, not the default 0.5
- Catch a feature that leaks the future or goes missing at serving time
- Specify how the model serves, what happens when it cannot, and what you watch after launch

**Prerequisites:** the rest of this course, you can [fit a model and read `predict`](Your-First-End-to-End-Model-in-R.html), you know [batch vs real-time serving](Batch-vs-Real-Time-Inference.html) and [monitoring with PSI](Monitoring-and-Drift.html), and you can read a confusion matrix.

::widget process-flow {"steps":[{"title":"Decide","sub":"what action a score triggers, and the baseline to beat"},{"title":"Cost","sub":"what a wrong call costs, and the cutoff that fits"},{"title":"Data","sub":"where each feature comes from when you serve"},{"title":"Serve","sub":"batch or real time, how fast, and the fallback"},{"title":"Monitor","sub":"what you log and watch, and what trips an alarm"},{"title":"Document","sub":"one page that records every answer above"}]}

=== step === concept
::eyebrow Why a checklist
## A validated model is not yet a system

In Lesson 5 you watched a launched model decay as the world drifted, with no error to warn you. That is one of many ways a model that passed every offline check still fails in production. The others are just as quiet: a metric that does not match the decision, a feature that is missing when you actually score someone, a serving path with no plan for when the model is down.

None of these show up in a notebook, because a notebook has the whole labelled dataset in memory and no real users. Production has neither. So before you ship, you answer a fixed set of questions, the same six every time, each one a way a model has burned somebody before.

[KEY INSIGHT]
Shipping a model is not "is the accuracy high enough?" It is "have we answered every question on the checklist?" A high score with an unanswered question on the list is how good models cause bad outcomes.

The six questions, and where each one draws on this course:

1. **Decide** - what action does a score trigger, and what baseline must it beat?
2. **Cost** - what does a wrong call cost, and what threshold minimizes it?
3. **Data** - where does each feature come from at serving time (Lessons 1-2)?
4. **Serve** - batch or real time, how fast, and what is the fallback (Lessons 3-4)?
5. **Monitor** - what do you log and watch, and what trips an alarm (Lesson 5)?
6. **Document** - the one page that records every answer above.

We will walk them in order, on Dev's model, and end with the page that records the answers.

=== step === concept
::eyebrow Question 1
## What decision does the model drive, and against what baseline?

A model does not "predict churn." It drives an action. Dev's model exists so that, every Monday, the retention team can send a small save-offer, an $8 discount, to the subscribers most likely to cancel this month. The subject is an active subscriber, the action is the discount email, the timing is a weekly batch. Naming those three turns a vague "churn model" into a concrete decision you can judge.

And a decision is only worth shipping if it beats what the team does without it. That is the **baseline**: the simplest rule already available. Here the honest baselines are blunt, offer everyone, offer no one, or offer anyone idle a few weeks. The model has to make cheaper decisions than those, or it is not earning its complexity.

To judge any of this we need the model's decisions in front of us. Each lesson runs in its own R session, so we rebuild Dev's model and score the current 8,000 active subscribers inline. Each row is one subscriber: their features, the model's risk score, and whether they actually cancelled the next month (the outcome we later observed).

```r
set.seed(1)
n <- 8000
subs <- data.frame(
  weeks_since   = rpois(n, 3),        # weeks since their last order
  boxes_ordered = rpois(n, 8) + 1     # lifetime boxes ordered
)
# the world: idle weeks raise cancellation risk, a bigger box history lowers it
subs$churned <- rbinom(n, 1,
  plogis(-4.2 + 0.9 * subs$weeks_since - 0.05 * subs$boxes_ordered))
model      <- glm(churned ~ weeks_since + boxes_ordered, data = subs, family = binomial)
subs$score <- predict(model, type = "response")   # each subscriber's risk score, 0 to 1

round(mean(subs$churned), 3)                       # base monthly cancellation rate
#> [1] 0.2
head(subs[order(-subs$score), c("weeks_since", "boxes_ordered", "score", "churned")], 4)
#>      weeks_since boxes_ordered     score churned
#> 989           12            10 0.9974107       1
#> 2589          11             8 0.9942589       1
#> 6661          10             5 0.9878240       1
#> 3473          10             7 0.9867943       1
```

About one active subscriber in five cancels in a given month, and the model's highest-risk subscribers really did cancel. Good signs, but "the scores look sensible" is not the bar. The bar is the next question: do the decisions those scores drive cost less than the baseline?

=== step === quiz
::eyebrow Check yourself
## When is the model "good enough to ship"?

On held-out data Dev's model reaches an AUC of about 0.85 (a ranking score, where 1.0 is a perfect ordering of churners above stayers and 0.5 is a coin flip), and the team is impressed. Before flipping it on, what is the right bar for "good enough to ship"?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A high AUC settles it: 0.85 is strong, so the model is ready ::no AUC measures how well the model RANKS subscribers, not whether its weekly decisions beat what you already do. A model can post a great AUC and still lose to a one-line rule once real costs are counted.
- Its weekly save-offer decisions must cost less than the baseline the team uses today ::ok Right. A shipped model is judged as a DECISION against the incumbent. If "offer everyone" is cheaper than the model's calls, it is not ready, however good the AUC looks.
- It must catch every churner, since each miss is expensive ::no No model catches everyone, and chasing 100% recall just means offering to everyone, which is a baseline, not a model. The bar is beating the baseline on total cost.

=== step === concept
::eyebrow Question 2, part 1
## What does a wrong call cost?

The model makes two kinds of mistake, and they do not cost the same. A **false positive** is a save-offer sent to a subscriber who was going to stay anyway: Dev wastes the $8 discount. A **false negative** is a churner the model misses, no offer, and they cancel: Dev loses their future margin, about $120. A miss costs roughly fifteen times a false alarm.

The threshold is the dial that trades one for the other. Slide it in the widget below: as you lower the classification threshold, the model flags more subscribers, so false negatives (missed churners) fall while false positives (wasted offers) rise. There is no threshold with zero of both; there is only the trade, and the right point on it depends on the two costs.

::widget roc-curve {}

Write the cost of a whole week's decisions as one number. Let \( \text{FP}(t) \) be the count of false positives at threshold \( t \), \( \text{FN}(t) \) the count of false negatives, and let \( C_{FP} \) and \( C_{FN} \) be the dollar cost of each. Then the expected weekly cost is

\[ \text{Cost}(t) = \text{FP}(t)\,C_{FP} + \text{FN}(t)\,C_{FN}. \]

With Dev's numbers, \( C_{FP} = 8 \) and \( C_{FN} = 120 \). Three blunt policies pin down the range:

```r
cost_fp <- 8      # a wasted save-offer: a discount to someone who would have stayed
cost_fn <- 120    # a missed churner: no offer, and they cancel

expected_cost <- function(threshold) {
  offer  <- subs$score >= threshold          # we act when risk is at or above the threshold
  wasted <- sum(offer  & subs$churned == 0)   # false positives
  missed <- sum(!offer & subs$churned == 1)   # false negatives
  wasted * cost_fp + missed * cost_fn
}

c(offer_everyone = expected_cost(0),   # threshold 0: everyone gets an offer
  cutoff_0.5     = expected_cost(0.5), # the textbook default
  offer_no_one   = expected_cost(1))   # threshold 1: nobody does
#> offer_everyone     cutoff_0.5   offer_no_one
#>          51200         129576         192000
```

Look at that middle number. The textbook 0.5 cutoff, $129,576, is worse than blindly offering everyone ($51,200), because at 0.5 the model withholds offers from thousands of real churners and eats the $120 miss on each. The default threshold is not neutral; here it is close to the worst thing you could do.

=== step === concept
::eyebrow Question 2, part 2
## Pick the threshold the costs point to

If 0.5 is arbitrary, what is not? Sweep every threshold, compute the weekly cost at each, and keep the cheapest.

```r
grid  <- seq(0.02, 0.95, by = 0.01)
costs <- sapply(grid, expected_cost)
best  <- grid[which.min(costs)]

c(best_threshold = best,
  best_cost      = min(costs),
  cost_at_0.5    = expected_cost(0.5))
#> best_threshold      best_cost    cost_at_0.5
#>            0.1        40656.0       129576.0
```

The cost-minimizing threshold is **0.10**, and it costs $40,656 a week against $129,576 at the default 0.5, about a third of the cost. Plot the whole curve and the reason is plain: cost falls steeply as the threshold drops from 0.5, bottoms out near 0.10, then rises again as offers start reaching too many safe subscribers.

```r
plot(grid, costs, type = "l", lwd = 2,
     xlab = "classification threshold", ylab = "expected weekly cost ($)")
abline(v = best, lty = 2)               # the cost-minimizing cutoff, 0.10
abline(v = 0.5,  lty = 3, col = "grey") # the arbitrary default
```

There is even a shortcut. For a well-calibrated probability, the cost-optimal cutoff has a closed form: you offer whenever the expected saving beats the cost of offering, which works out to

\[ t^\star = \frac{C_{FP}}{C_{FP} + C_{FN}}. \]

Here that is \( 8 / (8 + 120) = 0.0625 \), in the same low neighbourhood the sweep found. Both say the same thing: when a miss dwarfs a false alarm, the right threshold sits far below 0.5.

=== step === tryit
::eyebrow Try it
## Compute the shortcut threshold

The closed form says the cost-optimal cutoff for a calibrated probability is \( t^\star = C_{FP} / (C_{FP} + C_{FN}) \): you act whenever the expected saving outweighs the cost of acting. Fill in the denominator so the cutoff uses BOTH costs.

```r
cost_fp <- 8     # a wasted save-offer
cost_fn <- 120   # a missed churner
t_star <- cost_fp / (____)
round(t_star, 3)
```
::check {"regex":"cost_fp\\s*\\+\\s*cost_fn","gate":true,"difficulty":"intermediate","ok":"That is it: the cutoff is C_FP / (C_FP + C_FN) = 8 / 128 = 0.062. Because a miss costs 15x a false alarm, the cutoff sits far below 0.5, and the cost sweep landed nearby at 0.10.","no":"Both costs go in the denominator. Write cost_fp / (cost_fp + cost_fn)."}
::solution
```r
cost_fp <- 8
cost_fn <- 120
t_star <- cost_fp / (cost_fp + cost_fn)
round(t_star, 3)
#> [1] 0.062
```

=== step === quiz
::eyebrow Check yourself
## Why not just use 0.5?

A teammate ships the model at the default 0.5 cutoff, "because that is the standard threshold." Given Dev's costs (a miss is $120, a false alarm $8), what is wrong with that choice?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing: 0.5 is the mathematically correct cutoff for any classifier ::no 0.5 is only optimal when a false positive and a false negative cost the same. Here a miss costs fifteen times a false alarm, so the cost-optimal cutoff sits far below 0.5.
- 0.5 ignores the 15-to-1 cost gap; the cost-minimizing cutoff is about 0.10, and 0.5 costs roughly three times as much ::ok Exactly. The threshold should fall out of the costs, not a convention. Dropping it toward 0.10 catches far more churners, and the wasted $8 offers are cheap next to a $120 miss.
- 0.5 is too cautious; with expensive misses you should raise the threshold to be more selective ::no Backwards. Expensive misses push the threshold DOWN, to cast a wider net, not up. Raising it would miss even more churners.

=== step === concept
::eyebrow Question 3
## Where does each feature come from at serving time?

A model can only use, in production, information that exists at the moment it scores someone. Two failures hide here. **Training-serving skew** is when a feature is computed one way in your training table and a different way in the live system, so the model sees numbers it was never fit on. **Leakage** is worse: a feature that secretly encodes the outcome, so it is unavailable, or meaningless, at the moment you actually need to predict.

Leakage announces itself as an accuracy that looks too good. Suppose Dev adds a feature `sent_cancel_survey`, a flag set when the company emails a departing subscriber a "sorry to see you go" survey. It is only ever sent after someone cancels. Add it and watch:

```r
set.seed(2)
# sent_cancel_survey is set only AFTER a subscriber cancels (plus a little noise)
subs$sent_cancel_survey <- ifelse(subs$churned == 1, 1, rbinom(nrow(subs), 1, 0.02))

leaky       <- glm(churned ~ weeks_since + boxes_ordered + sent_cancel_survey,
                   data = subs, family = binomial)
leaky_score <- predict(leaky, type = "response")

acc <- function(score) mean((score >= 0.5) == subs$churned)
c(honest = round(acc(subs$score),  3),
  leaky  = round(acc(leaky_score), 3))
#> honest  leaky
#>  0.841  0.983
```

The leaky model looks far better, 0.983 against 0.841. But `sent_cancel_survey` is a *consequence* of cancelling, not a cause you know in advance. When Dev scores a current subscriber on Monday to decide whether to offer, that subscriber has not cancelled yet, so the flag is always 0. The model that dazzled offline would collapse in production. The fix is a rule you apply to every feature: could I have known this value at the moment I need the prediction? If not, it cannot be an input.

[WARNING]
A sudden jump in offline accuracy when you add a feature is a red flag, not a trophy. The first question is not "how did it get so good?" but "does this feature exist, with this meaning, at serving time?"

=== step === quiz
::eyebrow Check yourself
## Ship the more accurate model?

Adding `sent_cancel_survey` lifts offline accuracy from 0.84 to 0.98. Should Dev ship the more accurate model?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: 0.98 is far better than 0.84, and more accurate is better ::no The jump is the warning sign, not the win. The flag is only known after a subscriber cancels, so when you score a current subscriber its value is always 0. The model cannot use it for real.
- No: the flag is set only after a cancellation, so it leaks the outcome; it is absent when you actually score someone, and the model would fall apart in production ::ok Exactly. It is a consequence of churn, not a cause known in advance. Training on it inflates offline accuracy and produces a model that cannot run. Drop it, and check every feature is knowable at serve time.
- Yes, as long as the pipeline collects the flag faster ::no You cannot collect it before the cancellation it describes, however fast the pipeline is. A feature caused by the outcome can never be ready in time to predict that outcome.

=== step === concept
::eyebrow Question 4
## How does it serve, and what happens when it cannot?

Lessons 3 and 4 gave you the serving patterns; the checklist asks you to commit to one and write down its limits. For Dev's weekly save-offer the decision is not urgent and touches every subscriber at once, so **batch** scoring, one job on a schedule, fits. A real-time API would add cost and moving parts the decision does not need.

| | Batch | Real time |
|---|---|---|
| When to use | decisions in bulk, on a schedule | one decision, on demand |
| Dev's case | score all 8,000 every Monday | not needed here |
| Latency budget | minutes to hours | tens of milliseconds |
| Main risk | staleness between runs | an outage blocks live traffic |

Every serving path also needs an answer to one more question: what happens when the model is unavailable or unsure? A service times out, a new version fails to load, a feature goes missing. Without a plan the system silently makes no decision, which is itself a decision: that subscriber gets no offer. So define a **fallback**: a simple, trusted rule that keeps decisions flowing when the model cannot.

```r
# When the model is up, use its score and the cost-optimal cutoff. When it is down,
# fall back to the pre-model heuristic the team already trusts: offer anyone idle
# 4 or more weeks. A degraded decision beats no decision.
score_or_fallback <- function(subscriber, model_up = TRUE) {
  if (model_up) return(predict(model, subscriber, type = "response") >= best)
  subscriber$weeks_since >= 4
}

# the model is down: fall back to the heuristic for the first six subscribers
score_or_fallback(subs[1:6, ], model_up = FALSE)
#> [1] FALSE FALSE FALSE  TRUE FALSE  TRUE
```

The fallback is cruder than the model, and that is the point: its job is to fail gracefully, not to be optimal. Log every time it fires, so you know how often you are running on the backup rule.

=== step === quiz
::eyebrow Check yourself
## The model times out

Dev also exposes the model behind a live endpoint for an in-app "should we show a retention banner?" check. During a traffic spike the model service times out, and the team never specified a fallback. What happens, and what should the design doc have said?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing bad: if the model times out the subscriber simply is not scored, which is harmless ::no A silent no-score is a decision by default: no banner, no offer, so a real churner slips through exactly when load is high. "Do nothing" is not a safe default, just an unmonitored one.
- Fall back to a simple trusted rule and log that the fallback fired, so a model outage degrades gracefully instead of dropping decisions ::ok Right. Every serving path needs a defined answer for when the model is down or unsure. A cheap heuristic keeps decisions flowing, and logging it tells you how often it happened.
- Block the page until the model responds, however long that takes ::no Blocking on a slow model turns a model problem into a user-facing outage. Serving has a latency budget; past it you fall back, you do not wait.

=== step === concept
::eyebrow Question 5, part 1
## Log every prediction

You cannot monitor what you did not record. The first half of the monitoring question is a logging plan: for every score the model produces, write down enough to reconstruct and audit the decision later. At minimum, who was scored, when, by which model version, the score, and the action taken.

```r
# One row per prediction: enough to audit a decision and to monitor drift later.
ix <- c(4, 1, 3, 989, 12, 6661)   # a spread of subscribers
predictions_log <- data.frame(
  subscriber_id = ix,
  scored_at     = "2026-07-07",
  model_version = "cancel-v3",              # which model made the call
  score         = round(subs$score[ix], 3),
  decision      = ifelse(subs$score[ix] >= best, "offer", "hold")
)
print(predictions_log, row.names = FALSE)
#>  subscriber_id  scored_at model_version score decision
#>              4 2026-07-07     cancel-v3 0.466    offer
#>              1 2026-07-07     cancel-v3 0.063     hold
#>              3 2026-07-07     cancel-v3 0.117    offer
#>            989 2026-07-07     cancel-v3 0.997    offer
#>             12 2026-07-07     cancel-v3 0.024     hold
#>           6661 2026-07-07     cancel-v3 0.988    offer
```

The `model_version` column is the quiet hero: when accuracy dips next month, it lets you ask "which model made these calls?" and compare versions. Logging the score, not just the decision, means you can later recompute what a different threshold would have done, without rescoring anyone.

=== step === concept
::eyebrow Question 5, part 2
## Watch it, and wire each alarm to an action

Logging is the record; monitoring is reading it on purpose. From Lesson 5 you already have the two signals: **input monitoring**, which compares live features against training with PSI and warns immediately, and **performance monitoring**, which recomputes accuracy as real cancellations come back, the ground truth but late. Drag the control below to remember what drift looks like, and how PSI climbs until it trips its alert.

::widget drift-monitor {}

A monitor no one acts on is decoration. The checklist item is not "watch the dashboards" but a written **alarm-to-action rule**: for each signal, the threshold that trips it and the exact response.

- PSI on a key feature at or above 0.2 -> investigate the input, retrain if the shift is real.
- Weekly accuracy below 0.78 (a floor set from the launch number) -> retrain on recent, validated labels.
- Fallback firing on more than 5% of requests -> page the on-call engineer; the model service is unhealthy.

Writing the response next to the threshold is what turns monitoring from a wall of charts into a system that reacts.

=== step === concept
::eyebrow Question 6
## Write it down before you ship

Every answer so far lives in one place: a one-page design doc, sometimes called a **model card**. It is not paperwork for its own sake. It is the artifact that lets a teammate, or you in six months, see what the model decides, what it costs to be wrong, where its data comes from, how it serves, and what is watched, without reading the code. Toggle between the source and the rendered page:

::widget doc-structure {"title":"ML system design doc","blocks":[{"type":"yaml","text":"title: Cancel-save targeting\nowner: Dev, retention analytics\nversion: cancel-v3"},{"type":"prose","text":"## Decision\n\nScore every active subscriber weekly. Send an 8 dollar save-offer when risk is 0.10 or higher. Baseline to beat: offer everyone."},{"type":"prose","text":"## Cost and threshold\n\nA miss costs 120 dollars, a false alarm 8. The 0.10 cutoff minimizes total cost, read off the cost curve, not the default 0.5."},{"type":"prose","text":"## Data and serving\n\nInputs known at serve time only: weeks since last order, lifetime boxes. Nightly batch scoring. If the service is down, offer anyone idle 4 or more weeks."},{"type":"prose","text":"## Monitoring\n\nLog every score and decision. Watch input PSI and weekly accuracy. PSI at or above 0.2, or accuracy below 0.78, triggers a retrain."}]}

If you cannot fill a section, that is the checklist doing its job: it just found a question you have not answered yet, before your users did.

=== step === quiz
::eyebrow Check yourself
## Which question got skipped?

Dev's doc names the decision, the costs and threshold, the data, and the serving pattern, and the model ships. Six weeks later the retention team says the offers "feel off," but no one can tell whether anything actually changed. Which checklist question was skipped, and why does it bite now?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The threshold: it should have been re-derived from fresh costs every week ::no The threshold was set correctly from the costs, and the costs did not change. The problem is that no one can SEE whether the inputs or the accuracy moved. That is a monitoring gap, not a threshold one.
- Monitoring: nothing logs the scores, tracks input drift, or watches accuracy, so a drifting world degrades the model invisibly with no alarm to catch it ::ok Exactly. Without logged predictions and drift or performance monitors wired to an alarm, the model decays silently, the Lesson 5 failure. Monitoring plus a written alarm-to-action rule is the item that closes the loop.
- The serving pattern: real-time serving always drifts faster than batch ::no Serving pattern is about latency and freshness, not drift detection. Batch or real time, you still need monitoring to notice the world moving. The pattern choice cannot catch drift.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative, free places to take production readiness further:

- [Breck et al., "The ML Test Score: A Rubric for ML Production Readiness" (Google, 2017)](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) - a 28-point rubric across data, model, infrastructure, and monitoring; this lesson is the short version.
- [Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (NeurIPS 2015)](https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) - the classic on why the model is the small part and the surrounding system is where the risk lives.
- [Google, "Rules of Machine Learning" (Zinkevich)](https://developers.google.com/machine-learning/guides/rules-of-ml) - 43 battle-tested rules; the launch and training-serving-skew sections map straight onto this checklist.
- [Huyen, "Machine Learning Systems Design" (free)](https://huyenchip.com/machine-learning-systems-design/toc.html) - the same questions as a full framework, from business objective to deployment.

=== step === complete
## Lesson 6 complete

You now have the checklist. Before any model ships, you run the same six questions: what decision it drives and the baseline it must beat; what a wrong call costs and the threshold that follows; where each feature comes from at serving time; how it serves and what happens when it cannot; what you log and watch and what trips each alarm; and the one page that records every answer.

That is also the whole course. You made a model reproducible, versioned it, served it, monitored it for drift, and now you can decide, deliberately, whether it is safe to turn on. Run this checklist on the next model you build, and you will catch the quiet failures before your users do.

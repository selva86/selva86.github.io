---
title: "Machine Learning in Production Lesson 6: An ML system design checklist"
catalog_blurb: "The questions to answer before a model ships."
description: "A pre-ship ML system design checklist in R: beat a baseline, catch data leakage, set a cost-aware threshold, and plan versioning, serving and monitoring."
keywords: "ML system design, machine learning checklist, model deployment checklist, data leakage, training-serving skew, baseline model, cost-sensitive threshold, model card, MLOps in R, production readiness"
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

Over five lessons, Dev built a real production model: a meal-kit cancellation predictor that is reproducible, [versioned on a board](Versioning-Models-with-vetiver-and-pins.html), [served behind a URL](Serving-a-Model-with-plumber.html), and [watched for drift](Monitoring-and-Drift.html). Every one of those was a decision. This final lesson turns those decisions into a **checklist**: the questions to answer before any model, yours or a teammate's, is allowed to ship.

Most models that fail in production do not fail because the math was wrong. They fail because a question on this list went unasked.

By the end of this lesson you will be able to:

- Explain why a model that scores well in a notebook can still fail in production, and name the five phases a pre-ship review covers
- Run the three technical gates that catch the most common ship-blockers: a missing baseline, data leakage, and a mis-set decision threshold
- Record every answer in a model card, so the person who inherits the model inherits the reasoning too

**Prerequisites:** the rest of this course, especially [monitoring and drift](Monitoring-and-Drift.html), and you can [fit a model and read `predict` output](Your-First-End-to-End-Model-in-R.html).

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Cancellation model - pre-ship checklist\nowner: retention team\nstatus: ready to ship?"},{"type":"prose","text":"## Before it ships\n\nBeats a baseline. No leaked features. Threshold set to the **cost** of a miss. Reproducible, versioned, served, and monitored. Signed off, or sent back."},{"type":"code","text":"acc |> ggplot(aes(rule, accuracy)) +\n  geom_col()","chart":[{"x":"Baseline","y":63},{"x":"Model","y":81}]}]}

=== step === concept
::eyebrow Why a checklist
## A model that works in a notebook is not a model that ships

Dev's model scores well on held-out data. On his laptop, in his R session, it is finished. But a model in a notebook and a model in production are different objects. In the notebook it is asked one question, "are your predictions accurate on this test set?", and it answers yes. In production it is asked a dozen more that the notebook never poses: will the inputs still arrive next month? does a high score actually mean the right business action? who notices when it decays? who owns it?

Skip any of those and the model can be flawless on the test set and still lose money the week it launches. So before anything ships, you walk it through five phases. Each phase is a small set of questions; the rest of this lesson works through the ones that most often go unasked.

::widget process-flow {"steps":[{"title":"Frame","sub":"is ML the right tool, and does it beat a simple baseline?"},{"title":"Data","sub":"no leakage, and every feature is available at prediction time"},{"title":"Evaluate","sub":"a metric that maps to the decision, at a cost-aware threshold"},{"title":"Ship","sub":"reproducible, versioned, and served so other systems can call it"},{"title":"Watch","sub":"monitor for drift, retrain on time, and know who owns it"}]}

=== step === concept
::eyebrow Phase 1 - Frame
## Question 1: does it beat a baseline?

The first honest question about any model is not "how accurate is it?" but "how accurate is it *compared to the dumbest thing that could work?*" A raw accuracy number means nothing on its own. You only learn whether a model earns its complexity by measuring it against a trivial rule.

The simplest baseline for a yes/no problem is: **always guess the majority class**, ignore every feature. Let us rebuild Dev's model from scratch (each lesson runs in its own fresh R session, so we build the data inline) and put it next to that baseline.

```r
# Dev's meal-kit subscribers, rebuilt inline. One row per subscriber;
# `cancelled` is 1 if they cancelled their subscription this month.
set.seed(1)
n <- 2000
clip <- function(x, lo, hi) pmax(lo, pmin(hi, x))
subs <- data.frame(
  weeks_since   = rpois(n, 3),                               # weeks since last order
  boxes_ordered = rpois(n, 8) + 1,                           # lifetime boxes
  spend_per_box = round(clip(rnorm(n, 15, 3.5), 6, 24), 1)   # dollars per box
)
subs$cancelled <- rbinom(n, 1,
  plogis(-3.4 + 1.1 * subs$weeks_since - 0.06 * subs$boxes_ordered))

# Split into a training set and a held-out test set we judge everything on.
set.seed(7)
test_rows <- sample(nrow(subs), 600)
train <- subs[-test_rows, ]
test  <- subs[test_rows, ]

model <- glm(cancelled ~ weeks_since + boxes_ordered + spend_per_box,
             data = train, family = binomial)

# The model, scored on data it never saw:
model_acc <- mean((predict(model, test, type = "response") > 0.5) == test$cancelled)

# The baseline every model must beat: always guess the majority class, use no features.
majority  <- as.integer(mean(train$cancelled) > 0.5)   # here 0: "nobody cancels"
base_acc  <- mean(test$cancelled == majority)

round(c(baseline = base_acc, model = model_acc), 3)
#> baseline    model
#>    0.632    0.805
```

The baseline is not zero and it is not 50%. Because most subscribers do not cancel, always guessing "stays" is already right 63% of the time. So the model's 80.5% is not an 80-point achievement; it is **18 points of real lift over a rule a child could write**. That gap, not the raw number, is what tells you the model is worth its keep.

[KEY INSIGHT]
Always report a model next to a baseline. A number in isolation ("80% accurate") is unreadable; a number against a baseline ("80% vs a 63% majority-class rule") tells you exactly how much the model actually adds.

=== step === quiz
::eyebrow Check yourself
## Is 80% enough to ship?

Dev shows the model to his manager: "It is right 80.5% of the time on data it never saw." The manager says "over 80%, great, ship it." Running the Frame checklist, what is the right response?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Agree: 80.5% is a high accuracy, so the model is clearly good enough to ship on that number alone ::no A raw accuracy is unreadable on its own. On this problem, always guessing "stays" already scores 63%, so 80.5% has to be judged against that, not against 100% or against your gut feeling about what sounds high.
- Compare it to the baseline first: the majority-class rule already gets 63.2%, so the model adds about 18 points of real lift, and that gap is what justifies shipping it ::ok Exactly. The model earns its place because it beats the trivial baseline by a wide margin (0.805 vs 0.632). The 18-point lift is the real result; the raw 80.5% by itself says nothing.
- Reject it: 80.5% is below 90%, and a model under 90% accuracy is never production quality ::no 90% is an arbitrary bar with no meaning here. A model is worth shipping when it beats the relevant baseline by enough to justify its cost, not when it clears a round number someone picked.

=== step === concept
::eyebrow Phase 2 - Data
## Question 2: will every feature exist at prediction time?

This is the question that sinks more models than any other, and it hides because it never shows up in offline accuracy. **Data leakage** is when a feature carries information that would not actually be available at the moment you make a real prediction. The model looks brilliant in testing and collapses in production, because in production that feature is missing, empty, or means something different.

Picture a tempting feature for Dev's model: `refund_issued`, whether the subscriber was given a refund. It is strongly tied to cancelling. But a refund is only ever issued *after* someone cancels; it is a consequence of the outcome, not a fact you know while the subscriber is still deciding. It sits in the historical training table, yet it will be blank for every live customer you score. Watch what adding it does to the test accuracy.

```r
# A refund is issued only AFTER a subscriber cancels, so it will be blank when we
# score a live customer. But it exists in the historical table. Add it and re-score.
train$refund_issued <- rbinom(nrow(train), 1, ifelse(train$cancelled == 1, 0.92, 0.03))
test$refund_issued  <- rbinom(nrow(test),  1, ifelse(test$cancelled  == 1, 0.92, 0.03))

leaky <- glm(cancelled ~ weeks_since + boxes_ordered + spend_per_box + refund_issued,
             data = train, family = binomial)
leaky_acc <- mean((predict(leaky, test, type = "response") > 0.5) == test$cancelled)

round(c(honest = model_acc, leaky = leaky_acc), 3)
#> honest  leaky
#>  0.805  0.942
```

Accuracy leaps from 0.805 to 0.942. It looks like a breakthrough. It is a mirage: the model is peeking at the answer. Ship it and every live prediction arrives with `refund_issued` empty, so the model loses its crutch and does far worse than the honest 0.805 you could have had.

[WARNING]
A sudden jump to near-perfect accuracy from adding one feature is the classic signature of leakage, not of genius. The related trap is **training-serving skew**: a feature that exists at serving time but is computed differently there than in training (a different unit, a delayed value, a different default). For every feature, ask the same question: will this be available, and mean the same thing, at the instant of a real prediction?

=== step === quiz
::eyebrow Check yourself
## The suspicious jump

A teammate adds a new feature to a fraud model and its test accuracy jumps from 0.86 to 0.98. He wants to ship the "improved" model today. What should the Data checklist make you do first?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Ship it: 0.98 is far better than 0.86, so the new feature is clearly a strong, real signal worth deploying immediately ::no A near-perfect jump from one feature is exactly the pattern that should raise suspicion, not celebration. Deploy it and, if it is leakage, the accuracy evaporates the moment that feature is missing or different in production.
- Keep the new feature and drop the weaker old ones, since this one feature so obviously carries most of the signal about fraud ::no That reads leakage as importance. If the feature is a leak (it encodes the outcome, or is only known after the fact), it is not signal at all, and building the model around it makes the collapse worse.
- Check whether that feature would actually be available, unchanged, at prediction time; a jump that large is the signature of leakage, and if it is a leak the 0.98 is a fantasy ::ok Right. The size and suddenness of the jump is the tell. Before trusting it, confirm the feature exists at the moment of a real prediction and means the same thing it did in training. If it does not, it is leakage and the honest 0.86 is the real number.

=== step === tryit
::eyebrow Phase 3 - Evaluate
## Question 3: is the threshold set to the cost of a mistake?

A classifier outputs a probability; a *decision* needs a cutoff. Score above the threshold, send the retention discount; below it, do nothing. The lazy default is 0.5, but 0.5 silently assumes both mistakes cost the same. They rarely do.

For Dev, the two mistakes are not equal. Miss a real canceller (a **false negative**) and the company loses a subscriber worth about \$40. Send a needless discount to someone who was going to stay (a **false positive**) and it costs about \$8. Missing is five times as expensive as over-flagging, so the cutoff should lean toward flagging more, well below 0.5. The total cost at a threshold \(t\) is:

\[ \text{cost}(t) = c_{\text{FN}}\cdot \text{FN}(t) + c_{\text{FP}}\cdot \text{FP}(t) \]

where \(\text{FN}(t)\) is the number of missed cancellers and \(\text{FP}(t)\) the number of needless discounts at that cutoff, and \(c_{\text{FN}} = 40\), \(c_{\text{FP}} = 8\) are their dollar costs. Fill in the missing cost term so `total_cost` adds the false-positive dollars, then read off the threshold that costs the least.

```r
# Cost of each mistake: missing a real canceller loses a $40 subscriber;
# a needless discount to someone who would have stayed costs $8.
cost_fn <- 40; cost_fp <- 8
p <- predict(model, test, type = "response")

total_cost <- function(t) {
  flag <- p > t                              # send a discount when the score exceeds t
  fn <- sum(!flag & test$cancelled == 1)     # missed cancellers  (false negatives)
  fp <- sum(flag  & test$cancelled == 0)     # needless discounts (false positives)
  cost_fn * fn + cost_fp * ____              # total dollars lost at threshold t
}

grid <- seq(0.1, 0.9, by = 0.05)
best <- grid[which.min(sapply(grid, total_cost))]
c(best_threshold = best, cost_at_best = total_cost(best), cost_at_0.5 = total_cost(0.5))
```
::check {"regex":"cost_fp\\s*\\*\\s*fp\\b","gate":true,"difficulty":"intermediate","ok":"That is it. Weighting false positives by their $8 cost and false negatives by $40, the cheapest cutoff is 0.3, not 0.5: it costs $1,872 versus $2,760, saving $888 by flagging more aggressively because a miss hurts five times as much.","no":"The false-positive term mirrors the false-negative one: multiply the count fp by its cost, so the line reads cost_fn * fn + cost_fp * fp."}
::solution
```r
cost_fn <- 40; cost_fp <- 8
p <- predict(model, test, type = "response")

total_cost <- function(t) {
  flag <- p > t
  fn <- sum(!flag & test$cancelled == 1)
  fp <- sum(flag  & test$cancelled == 0)
  cost_fn * fn + cost_fp * fp
}

grid <- seq(0.1, 0.9, by = 0.05)
best <- grid[which.min(sapply(grid, total_cost))]
c(best_threshold = best, cost_at_best = total_cost(best), cost_at_0.5 = total_cost(0.5))
#> best_threshold   cost_at_best    cost_at_0.5
#>            0.3         1872.0         2760.0
```

=== step === concept
::eyebrow Phases 4 and 5 - Ship and Watch
## The other half of the checklist is operational, and you already built it

Frame, Data, and Evaluate are about whether the model is *right*. The last two phases are about whether the model can *live*: can it be rebuilt, found, called, and trusted over time? This is the half that a notebook never forces you to think about, and it is exactly what the first five lessons of this course built. The checklist just names each piece and asks "is it done?"

- **Reproducible?** The model comes out of a pipeline that reruns only what changed, not a script someone ran by hand once ([Lesson 1](Reproducible-Pipelines-with-targets.html)).
- **Versioned?** The exact model is registered so you always know which one is live and can roll back ([Lesson 2](Versioning-Models-with-vetiver-and-pins.html)).
- **Served?** It sits behind an API, batch or real time, so other systems reach it without loading R ([Lessons 3](Serving-a-Model-with-plumber.html) and [4](Batch-vs-Real-Time-Inference.html)).
- **Monitored, and owned?** Input drift and accuracy are tracked, a retrain trigger is set, and a named person is on the hook when it decays ([Lesson 5](Monitoring-and-Drift.html)).

::widget process-flow {"steps":[{"title":"Reproduce (Lesson 1)","sub":"a targets pipeline reruns only the steps that changed"},{"title":"Version (Lesson 2)","sub":"register the model on a board so you know which one is live"},{"title":"Serve (Lessons 3-4)","sub":"an API, batch or real time, so other systems can call it"},{"title":"Monitor (Lesson 5)","sub":"track input drift with PSI and accuracy as labels arrive"},{"title":"Retrain and own","sub":"retrain on recent trusted labels; name an owner and a rollback"}]}

=== step === concept
::eyebrow The artifact
## Write the answers down: the model card

A checklist you run once and forget is worthless the day you move teams. The answers belong in one document that travels with the model: a **model card**. It records what the model is for, what it must not be used for, the metric and threshold you chose and why, the retrain trigger, and who owns it. When the model misbehaves at 2 a.m. six months from now, the model card is what tells the on-call engineer whether it is behaving as designed or genuinely broken.

Toggle the card below between its source and its rendered form. Notice it is not a pile of code, it is the *decisions* from this whole checklist, captured so the next person inherits the reasoning and not just the weights.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Meal-kit cancellation model\nversion: 1.0\nowner: retention team"},{"type":"prose","text":"## Intended use\n\nScore active subscribers weekly and flag likely cancellers so retention can send a discount. **Not** for pricing, and not for one-off manual judgements about a single customer.\n\n## Metric and threshold\n\nRanked against a 63% majority-class baseline; the model scores 81%. Discount is sent above a **0.3** score, chosen because a missed canceller costs five times a needless discount.\n\n## Limits and upkeep\n\nRetrain when spend-per-box drift (PSI) passes 0.2 or weekly accuracy falls below 0.75. Roll back to the previous pinned version if the new model does not beat it."},{"type":"code","text":"cost |> ggplot(aes(threshold, dollars)) +\n  geom_col()","chart":[{"x":"t = 0.5","y":2760},{"x":"t = 0.3","y":1872}]}]}

=== step === quiz
::eyebrow Check yourself
## Which question did they skip?

Another team ships a model that scored beautifully in testing. On day one in production it runs without error, but its predictions are close to random, far worse than the offline numbers promised. Nothing crashed; nothing drifted (it is day one). Which checklist question did they most likely skip?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Data: a feature that inflated the offline score is missing or different at prediction time (leakage or training-serving skew), so the live model runs without its crutch ::ok Right. Strong offline, near-random on day one, with no crash and no time for drift, is the fingerprint of leakage or training-serving skew. A feature that made testing look great is not truly available, or not the same, at real prediction time.
- Watch: the model has drifted because the world changed since it was trained, so its accuracy has decayed ::no Drift takes time; this is day one. The model is failing immediately, before the world has moved at all, which points to a data problem baked in before launch, not decay after it.
- Frame: they never compared the model to a baseline, which is why it performs poorly in production ::no A missing baseline means you cannot tell if a model is worth shipping, but it does not make a model that tested well suddenly collapse in production. An offline-to-online gap this sharp is a data-availability failure, not a framing one.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative, free places to take ML system design further:

- [Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (NeurIPS 2015)](https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/) - the paper that showed the model is a tiny box inside a large system, and named the debt the rest of this checklist guards against.
- [Breck et al., "The ML Test Score" (Google 2017)](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) - a concrete, scored production-readiness rubric; a longer, industrial version of this lesson's checklist.
- [Google, "Rules of Machine Learning" (Zinkevich)](https://developers.google.com/machine-learning/guides/rules-of-ml) - hard-won engineering rules, including "do a simple baseline first" and watching for training-serving skew.
- [Kuhn & Silge, "Tidy Modeling with R" (free book)](https://www.tmwr.org/) - the R side of the workflow: spending a data budget, resampling honestly, and deploying with vetiver.

=== step === complete
## Lesson 6 complete

You have a checklist now, not just a model. Before anything ships, you ask the five phases: **Frame** it against a baseline so the accuracy number means something; guard the **Data** against leakage and training-serving skew so the offline score survives contact with production; **Evaluate** it at a threshold set by the real cost of each mistake, not a lazy 0.5; **Ship** it reproducible, versioned, and served; and **Watch** it with drift monitors, a retrain trigger, and a named owner. Then you write every answer into a model card so the reasoning outlives you.

That completes **Machine Learning in Production**. You took a model the whole way: reproducible pipeline, versioned artifact, live API, batch and real-time serving, drift monitoring, and now the pre-ship review that ties it all together. You are no longer just training models. You are shipping systems.

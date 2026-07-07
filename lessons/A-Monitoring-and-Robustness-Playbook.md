---
title: "Robustness and Drift Lesson 7: A Monitoring and Robustness Playbook"
description: "A deployment playbook for a live model: what to log, which drift, out-of-distribution, worst-group and adversarial alarms to wire, and when to roll back."
keywords: "model monitoring, ML in production, data drift, distribution shift, worst-group accuracy, retraining trigger, automatic rollback, adversarial robustness, PSI, R"
mathjax: true
webr: true
curriculum_id: "6.190.7"
post_type: "LESSON"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "7"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: ""
course_prev: "Adversarial-Robustness.html"
lesson_access: "pro"
catalog_blurb: "What to log, which alarms to wire, and when to roll back."
---

=== step === cover
::eyebrow Lesson 7 of 7
## A Monitoring and Robustness Playbook

Six lessons, six ways a deployed model quietly fails: the inputs drift, a strange request arrives, a subgroup is sacrificed to the average, an adversary aims at the boundary. You now know how to *detect* each one. This final lesson turns that pile of detectors into a single thing you can actually run in production: a **playbook**.

Meet Nadia one last time. Her fraud model, `fraud-v3`, is live, scoring every transaction the moment it happens. But "live" is not "done." The true fraud labels for today's transactions will not arrive for weeks, an adversary is probing the filter right now, and a new customer segment is behaving in ways the model never saw in training. Nadia needs a plan for what to watch, and, when something trips, a rule for who or what responds. The monitor below is where that plan begins: slide it forward and watch a single number climb until it trips an alarm.

By the end of this lesson you will be able to:

- Specify **what a live model must log** so every downstream check is even possible
- Assemble the section's detectors into a **layered alarm stack**, and know each layer's cadence and blind spot
- Write a **severity-to-response policy**, and state precisely when an alarm should **page a human** versus **roll back automatically**
- Run a **pre-deploy gate** that pairs a worst-group accuracy floor with an adversarial evasion ceiling before any model ships

**Prerequisites:** you finished Lessons 1 to 6 of this course, covering [drift kinds](Kinds-of-Distribution-Shift.html), [detecting drift](Detecting-Distribution-Shift.html) (PSI), [reweighting and retraining triggers](Adapting-to-Drift-Reweighting-and-Retraining.html), [out-of-distribution detection](Out-of-Distribution-and-Novelty-Detection.html), [group robustness](Group-Robustness-and-DRO.html), and [adversarial robustness](Adversarial-Robustness.html). You can fit and read a logistic regression and read a control chart.

::widget drift-monitor {}

=== step === concept
::eyebrow The foundation
## What to log

Every check in this playbook reads from one place: the **prediction log**. If a field is not logged when a transaction is scored, it is gone, and no monitor can ever recover it. So the playbook starts before any alarm, with the humble question of what to write down for each scored request.

Four things, and each earns its place:

1. **The inputs** the model actually saw (`amount`, `mrisk`). Drift and out-of-distribution checks compare these against training.
2. **The prediction and its score** (`pred`, `score`). The 0-to-1 score, not just the yes/no call, is what lets you watch confidence and calibration.
3. **The model version and batch** (`model`, `batch`). When you run two models or roll back, you must be able to say *which* model made a call and *when*.
4. **A slot for the label** (`label`), left empty now. The ground truth, was this transaction really fraud, arrives weeks later and is joined back on. Every performance metric waits on this join.

Each lesson runs in its own R session, so we build Nadia's world from scratch: her training data, the deployed `fraud-v3` model fit on it, and one live week of scored, logged transactions. Notice the new-market segment sends larger baskets, and today's labels are all `NA`.

```r
set.seed(11)
rule  <- function(a, m) plogis(-1.6 + 1.4 * a + 1.3 * m)   # true fraud risk, fixed
ntr   <- 5000
train <- data.frame(amount = rnorm(ntr), mrisk = rnorm(ntr))   # standardized features
train$fraud <- rbinom(ntr, 1, rule(train$amount, train$mrisk))
model <- glm(fraud ~ amount + mrisk, family = binomial, data = train)   # deployed fraud-v3

set.seed(40)
n      <- 4000
region <- sample(c("core", "new_market"), n, TRUE, c(0.8, 0.2))
amount <- rnorm(n, mean = ifelse(region == "new_market", 1.7, 0.6))   # this week's live inputs
mrisk  <- rnorm(n, mean = 0.1)
live   <- data.frame(amount, mrisk, region)
live$score <- predict(model, live, type = "response")
log_week <- data.frame(
  batch = "2026-W40", model = "fraud-v3",
  amount = round(live$amount, 2), mrisk = round(live$mrisk, 2), region = live$region,
  pred  = as.integer(live$score > 0.5),
  score = round(live$score, 3),
  label = NA_integer_)                       # true outcome confirmed weeks later
head(log_week, 3)
#>      batch    model amount mrisk     region pred score label
#> 1 2026-W40 fraud-v3   1.95 -0.77       core    1 0.543    NA
#> 2 2026-W40 fraud-v3   1.95  1.46 new_market    1 0.952    NA
#> 3 2026-W40 fraud-v3   1.17  0.64       core    1 0.701    NA
```

[KEY INSIGHT]
Logging is not paperwork, it is the whole game. A field you did not log is a check you cannot run. Log the inputs, the score, the model version, and reserve the slot for the late label, and every alarm below becomes possible.

=== step === concept
::eyebrow Assembling the detectors
## The layered alarm stack

A production monitor is not one test, it is a **stack of layers**, ordered by how fast they can speak. The fastest layers need no labels and fire within the hour; the sharpest layer needs labels and speaks weeks late. A real playbook runs all of them, because each catches what the others miss. Here is the whole section, arranged as a stack:

| Layer | Runs | Needs labels? | Catches | From |
|---|---|---|---|---|
| Out-of-distribution score | per request | no | a single input unlike anything in training | Lesson 4 |
| Input drift (PSI, KS) | hourly / daily | no | the feature distribution moving | Lesson 2 |
| Performance | when labels arrive | **yes** | accuracy or log-loss actually falling | Lesson 1 |
| Worst-group | when labels arrive | **yes** | a subgroup failing under a healthy average | Lesson 5 |
| Adversarial / threat | pre-deploy + spot checks | no | evasion within a stated threat model | Lesson 6 |

The two top layers cost nothing but compute and speak immediately, so they run first and constantly. Each is compared against a **control limit**: for a metric \(M_t\) in window \(t\), you alarm when

\[ M_t \;>\; \mathrm{UCL} \;=\; \mu_0 + k\,\sigma_0, \]

where \(\mu_0\) and \(\sigma_0\) are the metric's mean and standard deviation during a calm baseline and \(k\) is typically 3. PSI hands you the limit directly from convention (\(\mathrm{UCL} = 0.2\)). Let us read the two label-free layers on Nadia's live week: the PSI on `amount`, and the out-of-distribution rate as the share of transactions past the 99% shell of the training distribution (the Mahalanobis distance from Lesson 4).

```r
psi <- function(ref, cur, bins = 10) {
  cuts <- as.numeric(quantile(ref, seq(0, 1, length.out = bins + 1)))
  cuts[1] <- -Inf; cuts[length(cuts)] <- Inf
  e <- as.numeric(table(cut(ref, cuts))) / length(ref)
  o <- as.numeric(table(cut(cur, cuts))) / length(cur)
  sum((pmax(o, 1e-4) - pmax(e, 1e-4)) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))
}
psi_amount <- psi(train$amount, live$amount)                 # input drift, no labels
mu <- colMeans(train[, c("amount", "mrisk")])
S  <- cov(train[, c("amount", "mrisk")])
d2 <- mahalanobis(live[, c("amount", "mrisk")], mu, S)        # squared distance from training centre
ood_rate <- mean(d2 > qchisq(0.99, df = 2))                  # share past the 99% shell
round(c(psi_amount = psi_amount, ood_rate = ood_rate), 3)
#> psi_amount   ood_rate
#>      0.545      0.051
```

The PSI reads **0.545**, far past its 0.2 line: the inputs have clearly moved. The out-of-distribution rate is **5.1%**, up from the ~1% you would expect if nothing shifted. Both label-free layers are lit, and not one fraud label was needed to see it.

[NOTE]
Order the stack by latency, not by importance. The label-free layers are the least conclusive (they flag the inputs, not the damage) but they are all you have for weeks, so they run first and buy you time. The performance layer is the most conclusive and the slowest, so it confirms rather than warns.

=== step === quiz
::eyebrow Check yourself
## What did the drift alarm prove?

Nadia's stack lights up: PSI on `amount` is **0.545**, well past 0.2. The fraud labels for this week will not land for a month. A teammate says: "PSI is above the line, so accuracy has already dropped. Roll `fraud-v3` back right now." What is the right read?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- PSI above 0.2 is a direct measurement that accuracy fell, so an immediate rollback is the right call ::no PSI above its line is a real early warning, but it measures the INPUTS moving, not the model failing. Reverting on a proxy alone is how teams roll back on harmless covariate shift.
- The inputs have clearly moved, but that is a proxy, not proof of harm: it warrants a look (page a human), not an automatic rollback, until a label-based metric confirms real damage ::ok Exactly. PSI is a fast, label-free early warning. It says the world changed, investigate, which could be a benign covariate shift or the first sign of real trouble. You escalate to a human; you do not auto-revert on a proxy alone.
- Ignore it: without labels the PSI number is meaningless and tells you nothing actionable ::no Too far the other way. PSI is genuinely informative about the inputs and is exactly the early warning you want weeks before labels. It just is not, by itself, a verdict on accuracy.

=== step === concept
::eyebrow The slow, sharp layer
## Performance and worst-group

Weeks pass and last month's labels finally arrive, so the two label-based layers can speak. This is where the average lies. Compute overall accuracy and it may look fine; break it out by segment and a group can be quietly drowning. We saw exactly this in Lesson 5, and now we wire it into the stack.

We build the most recent **labeled** week, `back`, whose true outcomes are known. The catch: for the new-market segment the real fraud pattern shifted (a subgroup concept shift the model never trained on), so `fraud-v3` is out of step there.

```r
set.seed(30)
nb   <- 4000
regb <- sample(c("core", "new_market"), nb, TRUE, c(0.8, 0.2))
amtb <- rnorm(nb, mean = ifelse(regb == "new_market", 1.7, 0.6))
mrkb <- rnorm(nb, mean = 0.1)
lin  <- -1.6 + 1.4 * amtb + 1.3 * mrkb + ifelse(regb == "new_market", -1.9, 0)   # rule shifted for new market
back <- data.frame(amount = amtb, mrisk = mrkb, region = regb,
                   label = rbinom(nb, 1, plogis(lin)))
back$pred <- as.integer(predict(model, back, type = "response") > 0.5)   # last labeled week
acc    <- function(d) mean(d$pred == d$label)
by_grp <- tapply(seq_len(nrow(back)), back$region, function(i) acc(back[i, ]))
round(by_grp, 3)                          # accuracy per group
#>       core new_market
#>      0.779      0.638
worst <- min(by_grp)
round(c(overall = acc(back), worst = worst), 3)
#> overall   worst
#>   0.751   0.638
```

Overall accuracy is a passable **0.751**. But the core segment runs at **0.779** while new-market sits at **0.638**, more than fourteen points worse. A single headline number would have hidden a segment the model is actively failing. The worst-group layer exists precisely to refuse that comfort.

[WARNING]
Never let a single average metric be your only performance alarm. A model can hold a healthy overall accuracy while a growing subgroup collapses beneath it. Always monitor the *worst* group, not just the mean.

=== step === concept
::eyebrow The heart of the playbook
## From alarm to action

An alarm that nobody acts on is worse than no alarm, it just trains everyone to ignore the dashboard. The playbook's core is not the detectors, it is the **response policy**: a rule that maps each alarm to exactly one of three outcomes, `ok`, `page a human`, or `auto-rollback`.

The dividing line is **precision**: how often an alarm, when it fires, reflects real harm. A label-free drift alarm is *low precision*, because benign covariate shift trips it too (Lesson 1); a confirmed, label-based worst-group breach is *high precision*, because it is a direct measurement of the model failing. Make that formal. Let \(p = \Pr(\text{real degradation} \mid \text{alarm})\) be the alarm's precision, \(C_{\text{stay}}\) the cost of leaving a degraded model serving, and \(C_{\text{roll}}\) the cost and risk of reverting to the previous model. Automatic rollback is justified only when the expected cost of staying beats the cost of reverting:

\[ p \cdot C_{\text{stay}} \;>\; C_{\text{roll}}. \]

A high-precision labeled breach (\(p\) near 1) with a known-good previous model on the shelf clears this easily, so it can revert without waking anyone. A low-precision proxy (\(p\) small) does not clear it: reverting on every drift blip is expensive and often wrong, so it pages a human to judge. That reasoning becomes a tiny function:

```r
UCL_PSI <- 0.2; OOD_MAX <- 0.03; WG_FLOOR <- 0.80
decide <- function(psi, ood, worst_group_acc, perf_confirmed) {
  if (perf_confirmed && worst_group_acc < WG_FLOOR) return("auto-rollback")   # high precision, labeled
  if (psi > UCL_PSI || ood > OOD_MAX)               return("page a human")    # low precision, proxy
  "ok"
}
c(drift_only = decide(psi_amount, ood_rate, worst, perf_confirmed = FALSE),
  labels_in  = decide(psi_amount, ood_rate, worst, perf_confirmed = TRUE))
#>     drift_only       labels_in
#> "page a human" "auto-rollback"
```

Same model, same day, two different answers depending on what you know. While only the label-free layers have spoken, the drift trips a **page a human**. Weeks later, once labels confirm the worst-group collapse, the same situation escalates to **auto-rollback**. The policy encodes the whole lesson of this course: act in proportion to how sure you are.

=== step === tryit
::eyebrow Your turn
## Wire the auto-rollback rule

The auto-rollback branch is the sharpest tool in the playbook, so its condition must be exact: revert automatically only when a **confirmed** worst-group accuracy falls **below the floor** `WG_FLOOR`. Fill in the blank with that condition, then run the policy on the labeled reading.

```r
decide <- function(psi, ood, worst_group_acc, perf_confirmed) {
  if (perf_confirmed && ____) return("auto-rollback")
  if (psi > UCL_PSI || ood > OOD_MAX) return("page a human")
  "ok"
}
decide(psi_amount, ood_rate, worst, perf_confirmed = TRUE)
```
::check {"regex":"worst_group_acc\\s*<\\s*WG_FLOOR","gate":true,"difficulty":"intermediate","ok":"That is the rule: a confirmed worst-group accuracy below the floor is a high-precision, label-based verdict, so it earns an automatic rollback. With the new-market group at 0.638 against a 0.80 floor, the policy returns auto-rollback.","no":"Auto-rollback fires when the confirmed worst-group accuracy is under the floor: worst_group_acc < WG_FLOOR. It must read the worst group against WG_FLOOR, not the overall average."}
::solution
```r
decide <- function(psi, ood, worst_group_acc, perf_confirmed) {
  if (perf_confirmed && worst_group_acc < WG_FLOOR) return("auto-rollback")
  if (psi > UCL_PSI || ood > OOD_MAX) return("page a human")
  "ok"
}
decide(psi_amount, ood_rate, worst, perf_confirmed = TRUE)
#> [1] "auto-rollback"
```

=== step === quiz
::eyebrow Check yourself
## Human or automatic?

Your policy sends some alarms to a person and lets others revert on their own. Which alarm is the right one to trust with an **automatic** rollback, no human in the loop?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A PSI breach on one input feature, labels not yet in ::no That is a low-precision proxy: a harmless covariate shift trips it too. Automating it just automates false reverts. It pages a human.
- A single out-of-distribution request scoring past the 99% shell ::no One strange request is a per-item flag, not evidence the model is failing in aggregate. It never justifies reverting the whole model on its own.
- A confirmed, label-based worst-group accuracy below the floor, with a known-good previous model available to revert to ::ok Exactly. This is high precision (a direct measurement of failure, not a proxy) and reversible (a good previous model exists), so the expected-cost rule clears and it can revert without waking anyone. Automatic rollback belongs to conclusive, label-based, reversible alarms only.
- Any alarm at all, since automating every response removes slow humans from the loop ::no Automating a low-precision alarm just automates false alarms and needless reverts. The whole point of the policy is to match the response to the alarm's precision, not to automate everything.

=== step === concept
::eyebrow Before it ever ships
## The pre-deploy gate

Monitoring watches a model after it is live. A **pre-deploy gate** decides whether it should go live at all, and it is where two lessons that are not about drift earn their place in the playbook. Before any model, the first release or a retrained replacement, is promoted, it must clear two bars this course taught you to check:

- A **worst-group floor**: the weakest segment must reach at least `WG_FLOOR` accuracy (Lesson 5), so you never ship a model that works only on average.
- An **adversarial ceiling**: under a stated **threat model**, the evasion rate must stay under `EVADE_MAX` (Lesson 6). Nadia's threat model is precise: a fraudster controls the reported `amount` but cannot fake the merchant-side `mrisk`, so the attack lowers `amount` by a budget of one to slip under the boundary.

Run the gate on `fraud-v3` as it stands today.

```r
EVADE_MAX  <- 0.40
fraud_rows <- back[back$label == 1, c("amount", "mrisk")]        # real fraud we must still catch
eps <- 1.0
dir <- sign(coef(model)["amount"])                              # attacker lowers reported amount
attacked   <- transform(fraud_rows, amount = amount - eps * dir)
evade_rate <- mean(predict(model, attacked, type = "response") < 0.5)
ready_to_ship <- function(worst_group_acc, evade_rate)
  worst_group_acc >= WG_FLOOR && evade_rate <= EVADE_MAX
round(c(worst_group = worst, evade_rate = evade_rate), 3)
#> worst_group  evade_rate
#>       0.638       0.605
ready_to_ship(worst, evade_rate)
#> [1] FALSE
```

`fraud-v3` fails both bars: the worst group sits at **0.638** (under the 0.80 floor) and **60.5%** of real fraud slips through under a budget-one nudge (over the 0.40 ceiling). The adversarial weakness was there at launch and a real gate would have blocked it; the worst-group gap opened up in production. Together they say the same thing: this model is not fit to be live, and its replacement does not ship until it clears both.

=== step === widget
::eyebrow Putting it together
## The playbook, assembled

Every piece now snaps into one loop. **Log** every request. **Detect** with the layered stack, fast label-free layers now, the sharp label-based layers when the join lands. **Confirm** a breach across two windows before acting, so a single noisy batch cannot trigger a rollback. **Decide** with the precision policy: a proxy pages a human, a confirmed reversible breach rolls back. **Act**, then reset the reference and keep watching.

A playbook is honest about its own limits, so hold four in view:

- **Alert fatigue.** Every threshold trades false alarms against missed harm. Set limits too low and the team drowns in pages and learns to ignore them; the two-window confirmation and the precision policy exist to keep the signal worth reading.
- **Feedback loops.** A fraud model that blocks a transaction never learns whether it was really fraud, and its own actions reshape tomorrow's data. Your monitoring changes the very distribution you are monitoring.
- **Label lag.** The label-free layers are proxies precisely because the truth arrives late. Pair a fast input-drift trigger with a slow performance trigger; never mistake the fast one for a verdict.
- **A decaying rollback target.** Automatic rollback assumes a known-good previous model still exists and still works. That safety net drifts too, so the model you would revert to must be re-validated, not trusted forever.

::widget process-flow {"steps":[{"title":"Log","sub":"every request: inputs, score, model version, a slot for the late label"},{"title":"Detect","sub":"per-request OOD and label-free drift now; performance and worst-group when labels land"},{"title":"Confirm","sub":"a breach two windows running, not one noisy batch"},{"title":"Decide","sub":"a proxy alarm pages a human; a confirmed reversible breach rolls back"},{"title":"Act","sub":"reweight, retrain on the trigger, or roll back; then reset the reference"}]}

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Sculley et al. (2015), Hidden Technical Debt in Machine Learning Systems (NeurIPS)](https://proceedings.neurips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) - the classic argument that the model is the small part and monitoring, feedback loops, and configuration are where the real cost lives.
- [Zinkevich, Rules of Machine Learning: Best Practices for ML Engineering (Google)](https://developers.google.com/machine-learning/guides/rules-of-ml) - battle-tested rules for launching and monitoring a model, from a team that has shipped many.
- [Klaise et al. (2020), Monitoring and Explainability of Models in Production](https://arxiv.org/abs/2007.06299) - drift detectors and outlier detection wired into a real serving stack, the practical version of this lesson's stack.
- [Amershi et al. (2019), Software Engineering for Machine Learning: A Case Study](https://www.microsoft.com/en-us/research/publication/software-engineering-for-machine-learning-a-case-study/) - the nine-stage ML lifecycle and the operational realities of keeping deployed models healthy.

=== step === complete
## Lesson 7 complete

You have turned six detectors into one playbook. You know **what to log** (inputs, score, model version, and a slot for the late label), because a field you did not log is a check you cannot run. You built the **layered alarm stack**, ordered by latency: per-request out-of-distribution and label-free drift speaking first, performance and worst-group confirming weeks later. You wrote a **response policy** that acts in proportion to certainty, a low-precision proxy pages a human, a confirmed reversible breach rolls back, made precise by the expected-cost rule \(p \cdot C_{\text{stay}} > C_{\text{roll}}\). And you ran a **pre-deploy gate** that refuses to ship a model until its worst group clears a floor and its evasion rate stays under a ceiling within a stated threat model.

That completes **Robustness, Drift and Distribution Shift**. You began by naming the ways a deployed model breaks and end holding the plan that keeps it honest in the wild: log everything, watch in layers, and match every response to how sure you are.

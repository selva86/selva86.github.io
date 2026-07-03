---
title: "Robustness and Drift Lesson 3: Adapting to Drift: Reweighting and Retraining"
catalog_blurb: "Correct shifted inputs by reweighting, and retrain only when the data says to."
description: "Drift detected, now fix it: reweight training data by a density ratio to correct covariate shift, and set a control-limit trigger so you retrain only when needed."
keywords: "covariate shift, importance weighting, density ratio, model retraining, control limit, concept drift adaptation, PSI, model monitoring, R"
post_type: "LESSON"
curriculum_id: "6.190.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "3"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "Out-of-Distribution-and-Novelty-Detection.html"
course_prev: "Detecting-Distribution-Shift.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Adapting to Drift: Reweighting and Retraining

In Lesson 2, Nadia's monitor finally earned its keep. With no fraud labels in hand, the Population Stability Index caught the purchase `amount` creeping up and tripped the alarm. But an alarm is not a fix. Knowing the inputs moved tells you nothing about **what to do next**.

There are exactly two moves, and this lesson is about choosing between them and executing each one in R:

- **Reweight** the data you already have, no new labels needed, when only the inputs drifted.
- **Retrain** on fresh labels, when the world's actual rule changed, and do it on a *trigger*, not a calendar.

Slide the monitor below: as the weeks pass, the live inputs pull away from what Nadia's model trained on and the PSI climbs past its alarm line. That moment, when the alarm fires, is where this lesson begins.

By the end you will be able to:

- Decide which fix a shift needs: **covariate shift** you reweight, **concept shift** you retrain
- Correct covariate shift by **importance-weighting** the training data with a **density ratio**
- Estimate those weights the easy way, as the **odds of a domain classifier** (the Lesson 2 trick, reused)
- Set a **control-limit retraining trigger** so you retrain when the data demands it, not on a schedule

**Prerequisites:** you finished [Lesson 2](Detecting-Distribution-Shift.html) (PSI and its 0.1 / 0.2 lines, the classifier two-sample test, covariate vs concept shift), and you can fit and read a logistic regression.

::widget drift-monitor {}

=== step === concept
::eyebrow The fork in the road
## Two shifts, two fixes

Lesson 1 split the ways a deployed model can break. Two of them matter here, and they call for opposite responses.

**Covariate shift** means the inputs moved but the rule did not: \(P(x)\), how common each feature value is, changes, while \(P(y \mid x)\), the chance of fraud given those features, stays fixed. For Nadia, customers started making bigger purchases, so the distribution of `amount` shifted up, but a transaction of a given size is still exactly as likely to be fraud as it always was. The map from features to fraud is intact; you just have fewer training examples in the region where traffic now lives. You do **not** need new labels to fix this. You reweight.

**Concept shift** means the rule itself moved: \(P(y \mid x)\) changed. Fraudsters found a new trick, so transactions that used to look safe are now fraud. No reweighting of old data can teach the new rule, because that old data was labelled under the old rule. You need **fresh labels** and a **retrain**.

| | Covariate shift | Concept shift |
|---|---|---|
| What moved | the inputs, `P(x)` | the rule, `P(y|x)` |
| Nadia's version | bigger baskets | a new fraud tactic |
| New labels needed? | no | yes |
| The fix | **reweight** the training data | **retrain** on fresh data |

[KEY INSIGHT]
Reweighting is cheap and label-free but only corrects covariate shift. Retraining is powerful but costs fresh labels and compute. The whole game is spending the cheap fix when it is enough, and the expensive one only when you must.

We take them in that order: reweighting first, then when and how to retrain.

=== step === concept
::eyebrow Reweighting, the idea
## Make the model care about today's data

Your fraud model was trained to make as few mistakes as possible **on the training data**. Concretely, `glm` chose its coefficients to minimise the average loss over last quarter's transactions, where most `amount` values sat near the old average. Rows from the now-common big-basket region were rare back then, so the fit barely cared about getting them right.

Production has flipped that. The big-basket region is where most transactions now live, and it is exactly the region the model paid least attention to. The fix is a one-line idea: **weight each training row by how much it looks like today's traffic.** A training transaction that resembles current production counts for more; one from a region production abandoned counts for less.

We can make that precise. Write \(\ell(x)\) for the model's loss on a transaction with features \(x\), \(p_{\text{train}}(x)\) for how common those feature values were in training, and \(p_{\text{prod}}(x)\) for how common they are now. What we actually care about is the loss on production, and a clean identity turns it into a weighted average over the data we already have:

\[ \underbrace{\mathbb{E}_{x \sim p_{\text{prod}}}\big[\ell(x)\big]}_{\text{what we want}} \;=\; \mathbb{E}_{x \sim p_{\text{train}}}\big[\, w(x)\,\ell(x)\,\big], \qquad w(x) = \frac{p_{\text{prod}}(x)}{p_{\text{train}}(x)}. \]

The multiplier \(w(x)\) is the **importance weight**, or **density ratio**: how many times more common a feature value is in production than it was in training. Weight every training row by \(w(x)\), and its average loss becomes an honest estimate of the production loss, though not one production label was used.

[KEY INSIGHT]
Importance weighting does not invent production data. It re-balances the training data you already have so its average speaks for the distribution you now face.

=== step === concept
::eyebrow Where do the weights come from?
## The weights are just a classifier's odds

The identity needs \(w(x) = p_{\text{prod}}(x) / p_{\text{train}}(x)\), a ratio of two densities we do not know and, with many features, cannot reliably estimate. Here is the trick that makes the method practical, and you already built it in Lesson 2.

Pool the training rows and the production rows and label each by where it came from: \(0\) for training, \(1\) for production. Train any classifier to predict that label and call its output \(c(x) = P(\text{row is from production} \mid x)\). If you pooled equal numbers from each side, Bayes' rule collapses the density ratio into the classifier's **odds**:

\[ w(x) = \frac{p_{\text{prod}}(x)}{p_{\text{train}}(x)} = \frac{c(x)}{1 - c(x)}. \]

That is the **classifier two-sample test** from Lesson 2, put to work: there it told you *whether* the data moved; here its per-row probability tells you *how much* each training row looks like production, which is exactly the weight you need.

Let us build Nadia's two windows from scratch (each lesson runs in its own R session) and estimate the weights. The true fraud risk is a fixed curve in `amount`; training amounts sit near zero, and production amounts have crept up by about 1.2 standard deviations.

```r
set.seed(1)
fraud_rule <- function(x) plogis(-1.2 + 1.8 * x - 1.1 * x^2)  # true risk P(y|x), never changes
n <- 4000
train <- data.frame(amount = rnorm(n, 0.0, 1))               # last quarter: amounts near 0
train$fraud <- rbinom(n, 1, fraud_rule(train$amount))
prod  <- data.frame(amount = rnorm(n, 1.2, 1))               # now: baskets crept up
prod$fraud  <- rbinom(n, 1, fraud_rule(prod$amount))          # labels exist only to score, later
round(c(train_mean = mean(train$amount), prod_mean = mean(prod$amount)), 2)
#> train_mean  prod_mean
#>       0.00       1.19
```

Now the domain classifier and the weights. Notice it never sees `fraud`, only `is_prod`: reweighting needs no fraud labels at all.

```r
pool <- data.frame(amount  = c(train$amount, prod$amount),
                   is_prod = c(rep(0, n), rep(1, n)))
dom  <- glm(is_prod ~ amount, data = pool, family = binomial)
c_tr <- predict(dom, newdata = train, type = "response")     # P(looks like production | x)
w    <- c_tr / (1 - c_tr)                                     # density ratio = classifier odds
w    <- w / mean(w)                                           # normalise to average weight 1
round(summary(w), 2)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    0.01    0.23    0.49    1.00    1.14   39.38
```

Half the training rows now carry a weight below 0.49, while a few big-basket rows carry weights above 30. The model is about to hear a very different story about which transactions matter.

=== step === concept
::eyebrow The payoff
## Refit weighted, then score on production

Fit the fraud model twice, once as usual and once with the weights, then score both on the production window (whose labels we finally touch, only to grade). The weighted fit minimises the reweighted training loss, which by the identity targets production.

```r
logloss <- function(fit, d) {
  p <- pmin(pmax(predict(fit, newdata = d, type = "response"), 1e-6), 1 - 1e-6)
  -mean(d$fraud * log(p) + (1 - d$fraud) * log(1 - p))
}
acc <- function(fit, d) mean((predict(fit, newdata = d, type = "response") > 0.5) == d$fraud)

fit_uw <- glm(fraud ~ amount, data = train, family = binomial)
fit_iw <- suppressWarnings(glm(fraud ~ amount, data = train, family = binomial, weights = w))
round(rbind(unweighted = coef(fit_uw), weighted = coef(fit_iw)), 3)
#>            (Intercept) amount
#> unweighted      -1.598  0.671
#> weighted        -0.925 -0.270
```

Look at the `amount` coefficient: it flipped sign, from \(+0.67\) to \(-0.27\). That is not a bug, it is the whole point. The true risk **bends**: fraud rises with amount for small baskets, then falls again for very large ones (that is the \(-1.1\,x^2\) term). A straight-line logistic model can only track one slope. Unweighted, it fits the crowded training region near zero, where the slope is positive. Reweighted toward the big-basket region where production now lives, it learns the locally negative slope instead. Now score them:

```r
round(c(unweighted = logloss(fit_uw, prod), weighted = logloss(fit_iw, prod)), 3)
#> unweighted   weighted
#>      0.635      0.532
round(c(unweighted = acc(fit_uw, prod), weighted = acc(fit_iw, prod)), 3)
#> unweighted   weighted
#>      0.653      0.770
```

Production accuracy climbs from **65% to 77%** and log-loss drops, with no new labels, just a reweighting of the data Nadia already had.

[WARNING]
Reweighting is not free, and it has hard limits. It only works where the two distributions **overlap**: if production visits feature values training never had, \(w(x)\) explodes and the estimate rests on almost nothing. And leaning hard on a few high-weight rows shrinks your **effective sample size**, \(n_{\text{eff}} = \left(\sum_i w_i\right)^2 / \sum_i w_i^2\), the honest count of rows left after weighting.

```r
round(c(n_train = n, effective_n = sum(w)^2 / sum(w^2)), 0)
#>     n_train effective_n
#>        4000        1092
```

Four thousand training rows now pull the weight of about **1,092**. Reweighting bought a better-aimed fit by spending most of its data. And crucially, none of this can rescue you from *concept* shift: if the fraud rule itself changed, the labels on your old data are simply wrong, and no weighting of wrong labels makes them right.

=== step === quiz
::eyebrow Check yourself
## When does reweighting help?

Nadia's teammate proposes importance weighting as a catch-all: "whenever the monitor alarms, reweight the training data and refit, no need to relabel anything." For which alarm does this actually fix the model?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Any drift at all: reweighting corrects both covariate and concept shift, so it is a safe default for every alarm ::no Reweighting only re-balances rows the OLD rule labelled. If the rule changed (concept shift), those labels are wrong and no weighting fixes them. It corrects covariate shift only.
- Covariate shift: the inputs moved but the fraud rule held, so reweighting the old, still-correctly-labelled data toward production is exactly the fix ::ok Right. When the rule P(y|x) is intact, the old labels are still valid, and reweighting aims the fit at the region production now occupies. No new labels needed.
- Neither: without fresh labels you can never improve a drifting model, so any alarm forces a retrain ::no Too pessimistic. Under covariate shift the old labels are still correct, and reweighting demonstrably helped here (65% to 77%) with no new labels.

=== step === concept
::eyebrow The other fix
## Retrain on a trigger, not a calendar

When the alarm is concept shift, reweighting cannot save you and you must retrain on freshly labelled data. That raises the real operational question: **when?**

The lazy answer is a calendar: retrain on the first of every month. It is wrong in both directions. If nothing drifted, you burn compute and risk swapping a fine model for a worse one trained on a noisier recent sample. If a shift hits in week one, you limp for three more weeks until the calendar comes around. Retraining should be **event-driven**: fire it when a monitored metric crosses a line you set in advance. That line is a **control limit**, borrowed from decades of factory quality control.

Write \(M_t\) for the metric in week \(t\), say the weekly PSI you built in Lesson 2. The trigger is simply

\[ M_t \;>\; \text{UCL}, \]

where UCL is the **upper control limit**. For PSI the field convention hands you one directly: UCL \(= 0.2\). For a metric with no convention (a rolling loss, say), set the limit from a calm baseline period: UCL \(= \mu_0 + k\,\sigma_0\), where \(\mu_0\) and \(\sigma_0\) are the metric's mean and standard deviation while things were stable, and \(k\) is typically \(3\).

Watch it happen. We track PSI weekly against a fixed reference; the world is stable for ten weeks, then `amount` starts drifting up.

```r
set.seed(2)
psi <- function(ref, cur, bins = 10) {
  cuts <- as.numeric(quantile(ref, seq(0, 1, length.out = bins + 1)))
  cuts[1] <- -Inf; cuts[length(cuts)] <- Inf
  e <- as.numeric(table(cut(ref, cuts))) / length(ref)
  o <- as.numeric(table(cut(cur, cuts))) / length(cur)
  sum((pmax(o, 1e-4) - pmax(e, 1e-4)) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))
}
ref <- rnorm(3000, 0, 1)                                  # the training reference
week_psi <- sapply(1:20, function(wk) {
  mu <- if (wk <= 10) 0 else (wk - 10) * 0.07            # drift begins in week 11
  psi(ref, rnorm(3000, mu, 1))
})
round(week_psi, 3)
#>  [1] 0.007 0.009 0.008 0.009 0.005 0.004 0.007 0.006 0.007 0.010 0.005 0.010
#> [13] 0.044 0.057 0.122 0.153 0.195 0.234 0.328 0.472
```

Plot the weekly metric against its control limit and the trigger reads straight off the chart.

```r
library(ggplot2)
ggplot(data.frame(week = 1:20, psi = week_psi), aes(week, psi)) +
  geom_line(colour = "grey45") +
  geom_point(size = 2) +
  geom_hline(yintercept = 0.2, linetype = "dashed", colour = "firebrick") +
  annotate("text", x = 5, y = 0.23, label = "control limit (UCL 0.2)", colour = "firebrick") +
  labs(title = "Retrain on a trigger, not a calendar",
       subtitle = "weekly PSI sits flat, then breaches the control limit",
       x = "weeks since launch", y = "weekly PSI")
```

PSI hugs zero for eleven weeks, so a monthly retrain in week 4 or week 8 would have been wasted effort. Then it climbs and clears the 0.2 line in week 18: *that* is when to spend a retrain.

=== step === widget
::eyebrow The loop
## The adaptation loop

Put both fixes together and monitoring becomes a loop, not a one-off. Each live batch is scored, a breach triggers a diagnosis, the diagnosis picks reweight or retrain, and the fresh model is validated before it ever ships. Then the reference resets and the loop runs again.

::widget process-flow {"steps":[{"title":"Monitor","sub":"score PSI on every batch of live inputs"},{"title":"Trigger","sub":"a metric clears its control limit, two weeks running"},{"title":"Diagnose","sub":"inputs moved, reweight; the rule moved, retrain"},{"title":"Validate","sub":"test the new model on a fresh labelled holdout"},{"title":"Redeploy","sub":"promote it, reset the reference, keep watching"}]}

[NOTE]
A trigger is a trade-off, not a certainty. Set the limit too low and normal noise fires false alarms and needless retrains; set it too high and real drift runs unchecked. And a retrain needs fresh labels, which in fraud arrive weeks late, so the honest setup pairs a fast, label-free input-drift trigger (like PSI) with a slower performance trigger that fires once the labels confirm real damage. Requiring two windows in a row over the limit, rather than one, is a cheap guard against a single noisy week.

=== step === tryit
::eyebrow In R
## Find the retrain trigger

You have `week_psi`, the twenty weekly PSI values from before. Apply the PSI control limit as the retraining trigger and report the first week whose PSI breaches it. Fill in the limit, then read off the week.

```r
first_breach <- which(week_psi >= ____)[1]
first_breach
```
::check {"regex":"week_psi\\s*>=\\s*0\\.2","gate":true,"difficulty":"intermediate","ok":"That is the trigger: the first week PSI clears the 0.2 control limit is week 18, so retraining fires there, not on any calendar date. In production you would demand two consecutive breaches (weeks 18 and 19) before pulling the trigger, to shrug off a single noisy week.","no":"Use the PSI alarm convention as the control limit: which(week_psi >= 0.2)[1]. The 0.1 line is only 'watch'; 0.2 is the 'act' line."}
::solution
```r
first_breach <- which(week_psi >= 0.20)[1]
first_breach
#> [1] 18
```

=== step === quiz
::eyebrow Check yourself
## How often should you retrain?

A manager mandates: "retrain the fraud model on the first of every month, no exceptions, that keeps it fresh." Nadia pushes back. What is the strongest reason a fixed monthly schedule is the wrong default?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It is not wrong: a regular calendar retrain is best practice, because training more often always yields a better model ::no More training is neither free nor always better, a retrain on a noisier recent sample can be worse, and a monthly cadence still leaves weeks of exposure when drift lands early. Freshness is not the same as correctness.
- A schedule is fine as long as it is frequent enough, so the fix is simply to retrain daily instead of monthly ::no Daily retrains multiply compute and the risk of promoting a worse model, and they still ignore the real question: did anything drift? A trigger retrains when needed, which may be far less or far more often than daily.
- A calendar ignores whether anything actually drifted: it wastes retrains when the data is stable and reacts too late when a shift lands mid-cycle ::ok Exactly. The schedule is decoupled from reality. A control-limit trigger ties retraining to a monitored metric, so you act exactly when the data crosses the line, not on an arbitrary date.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Shimodaira (2000), Improving predictive inference under covariate shift by weighting the log-likelihood function](https://doi.org/10.1016/S0378-3758%2800%2900115-4) - the paper that showed weighting each training row by the density ratio corrects covariate shift for a misspecified model.
- [Bickel, Bruckner and Scheffer (2009), Discriminative Learning Under Covariate Shift, JMLR](https://www.jmlr.org/papers/v10/bickel09a.html) - estimating the importance weights by training a classifier to tell training from production, the trick you used here.
- [Gama, Zliobaite, Bifet, Pechenizkiy and Bouchachia (2014), A Survey on Concept Drift Adaptation, ACM Computing Surveys](https://doi.org/10.1145/2523813) - the broad map of adaptation strategies, including when and how to retrain.
- [Klaise, Van Looveren, Cox, Vacanti and Coca (2020), Monitoring and explainability of models in production](https://arxiv.org/abs/2007.06299) - a practical account of drift monitors and retraining triggers in a real serving stack.

=== step === complete
## Lesson 3 complete

You now hold both moves for after the alarm. When only the inputs drifted (covariate shift), **reweight**: estimate each training row's density ratio as a domain classifier's odds, refit weighted, and watch production accuracy recover with no new labels, mindful that overlap and effective sample size set the limits. When the rule itself changed (concept shift), reweighting cannot help, so **retrain**, and fire that retrain on a **control-limit trigger** tied to a monitored metric, never on a calendar.

Next, Lesson 4: Out-of-Distribution and Novelty Detection. Drift asks whether the whole stream has moved; novelty detection asks a sharper question about a single input: is *this* transaction unlike anything the model ever trained on? You will build a novelty score and set the threshold that trades false alarms against catching the genuinely strange.

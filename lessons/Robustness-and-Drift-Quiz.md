---
title: "Robustness and Drift: Quiz"
description: "A graded check on the robustness, drift and distribution-shift section: kinds of shift, PSI and drift detection, importance weighting, Mahalanobis novelty detection, worst-group accuracy and DRO, adversarial robustness and FGSM, and the monitoring playbook."
keywords: "R quiz, distribution shift, covariate shift, concept drift, population stability index, PSI, importance weighting, out-of-distribution, Mahalanobis distance, worst-group accuracy, DRO, adversarial robustness, FGSM, model monitoring, ds-robustness-drift"
post_type: "LESSON"
curriculum_id: "6.190.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "8"
course_total: "8"
course_landing: "R-Robustness-and-Drift-Course.html"
lesson_kind: "quiz"
course_prev: "A-Monitoring-and-Robustness-Playbook.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have followed a deployed model through every way the world turns on it: the inputs drift, a strange request arrives, a subgroup is quietly failed, an adversary aims at the boundary, and finally the whole thing is wired into a monitoring playbook. One discipline ran through all of it, match your response to how sure you are, and never mistake a proxy for proof. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## Which shift breaks the model?
A fraud model is retrained and redeployed. Three months later the *inputs* look different from training, but you are unsure which kind of shift you are seeing. Which one can silently destroy accuracy even when the inputs themselves look unremarkable?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Covariate shift: the feature distribution P(X) moves, but the input-to-label rule P(Y|X) is unchanged. ::no Covariate shift alone leaves the true rule intact, so a well-specified model often survives it. It is the least dangerous of the three, and PSI catches it early.
- Label shift: the base rate P(Y) moves while P(X|Y) holds. ::no Label shift changes the mix of classes but not the relationship the model learned; recalibrating the threshold or prior usually repairs it. It is not the silent accuracy-killer here.
- Concept shift: the rule P(Y|X) itself changes, so the same input now maps to a different outcome. ::ok Correct. When the input-to-label rule changes, the model's learned mapping is simply wrong now, and the inputs can look perfectly ordinary while accuracy falls. This is why a label-free input check can stay silent as real damage accrues.
- There is no difference: all distribution shift affects accuracy identically. ::no The three kinds have very different consequences. Distinguishing them is exactly what tells you whether to recalibrate, reweight, or retrain.

=== step === quiz
::eyebrow Question 2 of 10
## What PSI actually measures
The Population Stability Index on a feature reads 0.35, well past the 0.2 rule of thumb. A colleague concludes the model's accuracy has dropped. What is the accurate reading?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- PSI measures how far a feature's distribution has moved from a reference, using no labels. A high value proves the inputs changed, not that accuracy fell. ::ok Correct. PSI compares binned input distributions; it is a label-free early warning about the feature, and benign covariate shift can push it past 0.2 while the model is fine. It flags "investigate," not "accuracy dropped."
- A PSI above 0.2 is a direct measurement that accuracy has dropped. ::no PSI never touches the labels or the predictions' correctness. It quantifies input movement only; harm has to be confirmed by a label-based metric.
- PSI can only be computed once the true labels arrive. ::no The opposite: PSI needs no labels, which is why it is one of the fastest layers in the stack and speaks weeks before performance can.
- A low PSI guarantees the model is still accurate. ::no A low PSI says the inputs look stable, but concept shift can change P(Y|X) with the inputs unmoved, so PSI can read low while accuracy quietly falls.

=== step === quiz
::eyebrow Question 3 of 10
## Detecting shift without labels
You want to know whether this week's feature vectors differ from training, but no labels have arrived. You train a classifier to tell "training" rows from "this-week" rows and it reaches an AUC of 0.84. What does that tell you?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Nothing: a classifier needs the real outcome labels to say anything about drift. ::no This is the classifier two-sample test, and it deliberately uses only a "which period did this row come from" label, which you always have. No outcome labels are needed.
- The two periods are distinguishable well above chance, so the input distribution has moved; an AUC near 0.5 would have meant no detectable shift. ::ok Correct. If a model can separate old from new rows far better than a coin flip, the distributions differ. AUC around 0.5 means the two samples look interchangeable, so no shift is detectable.
- An AUC of 0.84 means 84% of the model's fraud predictions are now wrong. ::no The classifier here predicts the time period, not fraud. Its AUC measures how distinguishable the two samples are, and says nothing directly about fraud accuracy.
- The result is meaningless unless the classifier is the same model you deployed. ::no The two-sample classifier is a separate diagnostic; any reasonable classifier that separates the periods signals drift. It need not be the production model.

=== step === quiz
::eyebrow Question 4 of 10
## Importance weighting and its cost
Under covariate shift you reweight training rows by the density ratio (how much more likely each row is under production than under training) so the fit matches the new input mix. What is the catch you must watch?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- A few rows can receive huge weights, so the effective sample size collapses and the estimate gets noisy; when the shift is large, reweighting is no substitute for fresh labeled data. ::ok Correct. Importance weighting corrects the input mix without new labels, but extreme weights on a handful of rows shrink the effective sample size (roughly the sum of weights squared over the sum of squares), so the fix is limited and eventually you must retrain on real labeled data.
- Reweighting requires the production labels, so it cannot be done before they arrive. ::no The point of importance weighting is that it needs only the input distributions, so it works in the label-free window. Its limitation is variance, not a label requirement.
- Reweighting fixes concept shift as well as covariate shift. ::no When the rule P(Y|X) itself changed, no reweighting of inputs recovers it; the mapping is wrong. Importance weighting addresses covariate shift, not concept shift.
- The weights should be capped at exactly 1 so no row dominates. ::no Capping all weights at 1 would discard the correction entirely. The real practice is to watch the effective sample size and, if it collapses, prefer retraining, not to flatten the weights.

=== step === quiz
::eyebrow Question 5 of 10
## Why Mahalanobis, not per-feature
A transaction has a 120-day-old account (young, but real) placing a \$360 order (an amount older accounts spend routinely). Each value is ordinary on its own, yet the Mahalanobis novelty score is huge. Why?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because \$360 is an extreme order size that any range check would flag. ::no The amount is ordinary for older accounts, and a routine probe scored near zero. It is not the amount alone.
- Because Mahalanobis distance judges the pair against the training covariance: young accounts almost never spend that much, so the combination sits far off the correlation ridge even though each value alone is common. ::ok Correct. The inverse covariance encodes "age and amount rise together," so a point that breaks that joint pattern scores high while a per-feature range check waves both values through.
- Because the account age of 120 days is inherently suspicious. ::no Age alone is not the flag; the same young account making a ridge-consistent small order would score low. It is the joint pattern that is strange.
- Because Mahalanobis distance ignores the covariance and just scales each feature. ::no That describes scaled Euclidean distance. Mahalanobis uses the inverse covariance precisely to account for the correlation between features.

=== step === quiz
::eyebrow Question 6 of 10
## The novelty cutoff tradeoff
You flag inputs whose squared Mahalanobis distance exceeds a chi-square cutoff. Your manager wants the strictest possible cutoff so you "never raise a false alarm." What is wrong with that?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Pushing the false-positive rate toward zero also pushes the detection rate down, so the strictest cutoff quietly lets most true novelties through. The threshold trades false alarms against catches; there is no free lunch. ::ok Correct. The chi-square percentile sets the false-positive rate directly, but a tighter cutoff sweeps fewer genuine novelties too. You choose the balance from the cost of a miss versus a false alarm, not by demanding zero of one side.
- Nothing: the strictest cutoff is always best because false alarms waste analyst time. ::no It minimizes false alarms at the cost of collapsing detection, so real novelties sail through unflagged. The right cutoff balances the two error costs.
- A stricter cutoff raises the false-positive rate. ::no A stricter (higher-percentile) cutoff lowers the false-positive rate; its cost is a lower detection rate, which is the actual problem.
- The chi-square cutoff has nothing to do with the false-positive rate. ::no The percentile of the chi-square you pick is exactly the false-positive rate on genuine inliers; that is what makes the cutoff principled.

=== step === quiz
::eyebrow Question 7 of 10
## The average hides a group
A model posts 0.88 overall accuracy but 0.11 on an international segment that is 10% of orders and has the same base rate as everyone else. What is the correct reading?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The 90% majority carries the size-weighted average, so it stays high while the model actively fails the minority; 0.11 is worse than a coin flip, the signature of a feature the model reads backwards for that group. ::ok Correct. Average accuracy is a blend dominated by the majority, so a minority can crater without moving it. Worst-group accuracy is the metric that refuses that comfort, and a spurious feature reversing sign for the group explains the sub-coin-flip number.
- The international group is too small to matter, so the low number is a rounding artifact. ::no It is a real, measured 0.11 on a real segment. Small size is why the average hides it, not a reason to dismiss it.
- 0.88 overall proves every group is served well on average. ::no An average says nothing about the worst group. That is the entire reason worst-group accuracy exists as a separate alarm.
- The fix is simply to collect more international data. ::no If a spurious feature reverses for that group, more data of the same kind teaches the same backwards rule. The fix is to stop relying on the reversing feature (for example, group reweighting / DRO).

=== step === quiz
::eyebrow Question 8 of 10
## Accurate is not robust
A spam filter is 84% accurate on real mail and calls one junk email spam at 0.81. Nudging each feature by half a unit flips it to "not spam" at 0.34. How can a confident, usually-correct model be this fragile?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- A probability of 0.81 was never really confident, so the flip is expected. ::no 0.81 is a confident, correct call. The flip happens despite the confidence, because confidence in probability is not distance in input space.
- The decision boundary sits close to the point in input space, and a step along the gradient (the weight vector) is the most efficient direction across it, so a small crafted nudge crosses it even though the model is accurate on natural mail. ::ok Correct. Large weights make the score steep, so a point can read 0.81 and still be a short hop from the 0.5 boundary. The adversary moves along the gradient, the fastest way across, so a tiny budget goes a long way. Accuracy and robustness are different properties.
- The model is overfit; more training data would remove the flip. ::no Even a perfectly fit, well-regularized linear model has a boundary, and any point near it can be pushed across. Adversarial fragility is geometry, not memorization.
- Adversarial examples only exist for image models, not tabular ones. ::no The same gradient logic applies to any differentiable model. Tabular attacks trade invisibility for validity, but the boundary-crossing mechanism is identical.

=== step === quiz
::eyebrow Question 9 of 10
## What adversarial training buys
You harden the spam filter with adversarial training against an FGSM attack on the one feature the attacker controls. Evasion falls from 0.56 to 0.34 and clean accuracy falls from 0.84 to 0.77. Which reading is correct?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- It taught the model to lean on the feature the attacker cannot fake, cutting evasion at a deliberate clean-accuracy cost; robustness is defined against a stated threat model, not in the abstract. ::ok Correct. Perturbing the attackable feature during training made it look untrustworthy, so the fit down-weighted it and shifted onto the untamperable signal. Evasion dropped, clean accuracy paid a little, and the number only means anything alongside "against this attack, this budget, this feature."
- It made the model strictly better: more robust and more accurate at once. ::no Clean accuracy fell from 0.84 to 0.77. Adversarial training buys robustness with clean accuracy; a uniform improvement is exactly what the tradeoff rules out.
- It removed adversarial examples entirely. ::no Evasion is 0.34, not 0. A larger budget or an attack on a feature you assumed safe can still win. Adversarial training raises the cost of an attack within one threat model; it does not make a model unbreakable.
- The threat model is irrelevant once you have done adversarial training. ::no The threat model is the whole point: it defines what the attacker can change, and both the defense and the reported evasion rate are meaningless without it.

=== step === quiz
::eyebrow Question 10 of 10
## Human or automatic?
Your monitoring playbook routes each alarm to `ok`, `page a human`, or `auto-rollback`. Which alarm is the right one to trust with an automatic rollback, no human in the loop?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A PSI breach on one input feature, labels not yet in. ::no This is a low-precision proxy: benign covariate shift trips PSI too, so an automatic revert would fire on false alarms. Drift alone pages a human.
- A single out-of-distribution request scoring past the 99% shell. ::no One strange request is a per-item flag (hold or route that request), not evidence the whole model degraded. Rolling the model back over one outlier is a huge overreaction.
- A confirmed, label-based worst-group accuracy below the floor, with a known-good previous model available to revert to. ::ok Correct. This is high precision (a direct measurement of failure, not a proxy) and reversible (a good previous model exists), so the expected-cost rule clears and it can revert without waking anyone. Automatic rollback belongs to conclusive, label-based, reversible alarms only.
- Any alarm at all, since automating every response removes slow humans from the loop. ::no Automating a low-precision alarm just automates false alarms and needless reverts. The policy exists to match the response to the alarm's precision, not to automate everything.

=== step === concept
::eyebrow Run it: detect the drift
## PSI flags a moved distribution, no labels needed
The Population Stability Index bins a reference sample, then measures how far a current sample's mass has moved across those bins. A stable stream scores near zero; a mean shift of a fraction of a standard deviation lights it up, all without a single label.

```r
psi <- function(ref, cur, bins = 10) {
  cuts <- as.numeric(quantile(ref, seq(0, 1, length.out = bins + 1)))
  cuts[1] <- -Inf; cuts[length(cuts)] <- Inf
  e <- as.numeric(table(cut(ref, cuts))) / length(ref)
  o <- as.numeric(table(cut(cur, cuts))) / length(cur)
  sum((pmax(o, 1e-4) - pmax(e, 1e-4)) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))
}
set.seed(1)
ref     <- rnorm(2000, 0, 1)
stable  <- rnorm(2000, 0, 1)       # same distribution as the reference
drifted <- rnorm(2000, 0.6, 1)     # mean shifted by 0.6 sd
round(c(stable = psi(ref, stable), drifted = psi(ref, drifted)), 3)
#>  stable drifted
#>   0.007   0.348
```

The stable stream scores **0.007**, far below the 0.2 line; the drifted one scores **0.348**, well past it. PSI saw the move with no access to the outcome, which is exactly why it runs first in the alarm stack.

=== step === concept
::eyebrow Run it: lift the worst group
## DRO trades a little average for a lot of worst-group
A spurious feature (`night`) helps the 90% majority and reverses sign for the 10% minority, so ordinary training (ERM) fails the minority. Reweighting the loss so each group counts equally (a practical DRO surrogate) disarms the shortcut on its own, and the worst group jumps.

```r
set.seed(4)
n <- 3000
segment <- ifelse(runif(n) < 0.9, "domestic", "international")   # 90 / 10 split
risk    <- rnorm(n)                                             # a genuine shared signal
fraud   <- rbinom(n, 1, plogis(1.2 * risk))
night   <- ifelse(segment == "domestic", 2 * fraud - 1, 1 - 2 * fraud) + rnorm(n, 0, 0.5)  # reverses for the minority
d <- data.frame(fraud, risk, night, segment)
worst <- function(fit) {
  p   <- as.integer(predict(fit, d, type = "response") > 0.5)
  dom <- d$segment == "domestic"
  min(mean(p[dom] == fraud[dom]), mean(p[!dom] == fraud[!dom]))
}
erm <- glm(fraud ~ risk + night, binomial, d)                  # minimizes average loss
w   <- ifelse(d$segment == "international", 9, 1)               # 10% minority x 9 = equal group weight
dro <- glm(fraud ~ risk + night, binomial, d, weights = w)     # minimizes the worst group's loss
round(c(erm_worst = worst(erm), dro_worst = worst(dro)), 2)
#> erm_worst dro_worst
#>      0.11      0.66
```

ERM's worst group sits at a sub-coin-flip **0.11**; equal-group weighting lifts it to **0.66**. You never told the fit which feature was the villain, reweighting the rows made it stop trusting the reversing shortcut by itself.

=== step === complete
## Section complete
Strong work. You can now name the three kinds of distribution shift and say which recalibrate, reweight, or retrain; detect a moving input distribution with PSI, the KS test, and a classifier two-sample test, all before labels arrive; correct covariate shift with importance weighting and know when its effective sample size collapses; flag a single strange input with a Mahalanobis novelty score and a chi-square cutoff you tune against the false-positive-versus-detection tradeoff; expose a failing subgroup with worst-group accuracy and lift it with DRO; craft and defend against an FGSM attack within a stated threat model; and wire all of it into a monitoring playbook that logs everything, watches in layers, and matches every response to how sure you are. Above all: never mistake a fast, label-free proxy for proof of harm.

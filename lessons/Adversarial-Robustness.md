---
title: "Robustness and Drift Lesson 6: Adversarial Robustness"
catalog_blurb: "How a tiny nudge can flip a confident prediction, and how to defend."
description: "A logistic spam filter can be 84% accurate yet flip a confident call under a tiny nudge. Build the FGSM attack in R, then defend it with adversarial training."
keywords: "adversarial robustness, adversarial examples, FGSM, fast gradient sign method, perturbation budget, epsilon, adversarial training, evasion attack, threat model, R"
post_type: "LESSON"
curriculum_id: "6.190.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "6"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "A-Monitoring-and-Robustness-Playbook.html"
course_prev: "Group-Robustness-and-DRO.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Adversarial Robustness

Lesson 5 watched a model fail a whole group of ordinary customers by accident. Every failure in this course so far, drifting data, a strange input, a sacrificed subgroup, has been unintentional. This lesson introduces the first failure with a **mind behind it**: an adversary who studies your model and crafts an input designed to fool it.

Meet Leo. He runs the spam filter for a mailing service, and by every honest measure it works: on real inbox traffic it is right about **84%** of the time, and it flags one particular junk email as spam with probability **0.81**, confident and correct. Then a spammer who has read the same textbook you are about to read makes a change to that email so small it barely registers, and the same filter waves it through as **not spam**, just as confidently.

Nothing about the model was broken. It is accurate and brittle at the same time, and those two things turn out to be almost unrelated. Toggle the panel below from the original point to a tiny perturbation and watch a confident prediction cross the line.

By the end of this lesson you will be able to:

- Define an **adversarial example** and explain how a model can be accurate on normal data yet flip on a tiny crafted nudge
- See why the attack direction is simply the **gradient** of the model's score, and build the **fast gradient sign method (FGSM)** in R
- Reason about the **perturbation budget** \(\epsilon\) and how attack success grows with it
- Harden a model with **adversarial training**, read the robustness-versus-accuracy tradeoff, and tie robustness to a **threat model**

**Prerequisites:** you finished [Lesson 5: Group Robustness and DRO](Group-Robustness-and-DRO.html), you can fit and read a logistic regression, and you are comfortable with a gradient as "the direction that changes an output fastest."

::widget adversarial-perturb {}

=== step === concept
::eyebrow The core idea
## Accurate is not robust

An **adversarial example** is an input that a human reads one way, that the model *should* read the same way, but that has been nudged just enough to make the model read it the opposite way. The nudge is deliberate and tiny. The prediction it produces is confident and wrong.

The word to sit with is *deliberate*. A drifting feature or an out-of-distribution input is the world changing on its own. An adversarial example is someone with access to your model (or a copy of it) solving a small optimization problem: "what is the least I can change about this input to flip the answer?" Accuracy measures how the model does on inputs drawn from nature. Robustness measures how it does on inputs drawn by an opponent. A model can be superb at the first and hopeless at the second.

Each lesson runs in its own R session, so we build Leo's world from scratch. His filter reads two standardized features of every email: `link_ratio`, how link-heavy the message is (the spammer writes this), and `sender_risk`, the sending domain's server-side risk score (computed from Leo's logs). Higher means spammier. Real spam depends on both.

```r
set.seed(3)
n <- 1000
link_ratio  <- rnorm(n)   # how link-heavy the email is (standardized)
sender_risk <- rnorm(n)   # the sending domain's server-side risk score (standardized)
# The TRUE label: genuine spam is driven by BOTH signals.
spam <- rbinom(n, 1, plogis(2.2 * link_ratio + 2.2 * sender_risk))
emails <- data.frame(spam, link_ratio, sender_risk)

clf <- glm(spam ~ link_ratio + sender_risk, family = binomial, data = emails)
round(mean((predict(clf, type = "response") > 0.5) == emails$spam), 2)   # accuracy on real email
#> [1] 0.84
```

The filter is 84% accurate. Now take one ordinary spam email and ask the filter how sure it is:

```r
email <- data.frame(link_ratio = 0.35, sender_risk = 0.30)     # one junk email
round(as.numeric(predict(clf, email, type = "response")), 3)   # P(spam): confident, and correct
#> [1] 0.811
```

[KEY INSIGHT]
Accuracy and robustness are different properties, not two ends of one scale. Leo's filter is accurate *because* the boundary it learned separates real spam from real mail well. It is fragile *because* that same boundary can sit a hair away from a confident point, and an adversary is allowed to aim straight at it.

=== step === concept
::eyebrow The mechanism
## Why a small nudge is enough

To see how 0.81 becomes 0.34 under a tiny push, look at what the model actually computes. A logistic regression turns an input \(\mathbf{x}\) (here the two features) into a **score**, a single number that is a weighted sum,

\[ s(\mathbf{x}) \;=\; \mathbf{w}^\top \mathbf{x} + b \;=\; w_1\,\text{link\_ratio} + w_2\,\text{sender\_risk} + b, \]

where \(w_1, w_2\) are the feature weights and \(b\) is the intercept. It then squashes the score into a probability with the logistic function \(\sigma\):

\[ P(\text{spam}) \;=\; \sigma(s) \;=\; \frac{1}{1 + e^{-s}}. \]

The **decision boundary** is the set of inputs where \(s = 0\), the line at which \(P(\text{spam}) = 0.5\). An email is called spam when it sits on the positive side of that line.

Here is the whole trick in one line of calculus. The direction in feature space that raises the score fastest is the **gradient** of \(s\) with respect to the input, and for a linear score that gradient is just the weight vector, a constant:

\[ \nabla_{\mathbf{x}}\, s \;=\; \mathbf{w}. \]

So to *lower* the spam score as fast as possible, an attacker moves the input along \(-\mathbf{w}\). Look at the weights and the distance to the boundary:

```r
w <- coef(clf)[c("link_ratio", "sender_risk")]   # the two feature weights
round(w, 2)
#> link_ratio sender_risk
#>       2.14        2.08
```

Both weights are positive and near 2. Leo's confident email scores \(s \approx 1.45\), which feels far from the boundary at \(s = 0\), but "far" in score is not far in *input* space: because the weights are large, a small move in the features produces a large move in the score. The point is only about half a feature-unit from the line. The model is confident and close to the edge at the same time, and the attacker knows exactly which way the edge is.

=== step === quiz
::eyebrow Check yourself
## Confident, accurate, and fragile

Leo's filter is **84% accurate** and calls the email spam at **0.81**, yet nudging each feature by half a unit flips it to "not spam" at **0.34**. What best explains how a confident, usually-correct model can be this fragile?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The decision boundary sits close to the point in input space, and a step along the weight vector (the gradient) is the most efficient direction across it, so a small coordinated nudge crosses it even though the model is accurate on natural email ::ok Exactly. Confidence in probability does not mean distance in input space: large weights make the score steep, so a point can read 0.81 and still be a short hop from the 0.5 boundary. The attacker moves along the gradient, the single fastest way across, so a small budget goes a long way.
- The model is overfit and undertrained; more training data or stronger regularization would remove the flip ::no This is not overfitting. Even a perfectly fit, well-regularized linear model has a boundary, and any point near that boundary can be pushed across it. Adversarial fragility is a property of the geometry, not of memorizing the training set; accuracy and robustness are different things.
- A probability of 0.81 is not really confident, so the model was never sure and the flip is expected ::no 0.81 is a confident, correct call, and the model was right. The flip does not happen because the model was unsure; it happens because the boundary is a short, well-signposted walk away in input space, whatever the probability reads.

=== step === widget
::eyebrow The attack
## The Fast Gradient Sign Method

Now name the attack. The **fast gradient sign method (FGSM)** takes the gradient of the model's **loss** \(L\) with respect to the input and steps every feature by a fixed amount \(\epsilon\) in the direction that *increases* the loss:

\[ \mathbf{x}_{\text{adv}} \;=\; \mathbf{x} \;+\; \epsilon\,\operatorname{sign}\!\left(\nabla_{\mathbf{x}} L\right). \]

Three ideas are packed into that formula. \(\epsilon\) (epsilon) is the **budget**, the most any single feature is allowed to move. The **sign** throws away the size of the gradient and keeps only its direction per feature, so every feature moves by exactly \(\pm\epsilon\); that is what makes the attack an \(L_\infty\) attack (no feature moves more than \(\epsilon\)) and what makes it *fast*, one gradient evaluation and done. For a true-spam email, increasing the loss means decreasing the spam score, and since \(\nabla_{\mathbf{x}} s = \mathbf{w}\), the recipe simplifies to stepping each feature *against* the sign of its weight: \(\mathbf{x}_{\text{adv}} = \mathbf{x} - \epsilon\,\operatorname{sign}(\mathbf{w})\).

This is exactly the panda-to-gibbon trick from the famous image example (Goodfellow and colleagues, 2015): add a perturbation of magnitude \(\epsilon\) to every pixel, invisible to a person, and a network that was 58% sure of "panda" becomes 99% sure of "gibbon." Toggle the budget below and watch the same thing happen on a two-feature model. The panel builds the attack in base R for you as well.

::widget adversarial-perturb {}

=== step === tryit
::eyebrow Your turn
## Attack Leo's email

Turn the formula into the attack. Give every feature the same small budget `eps`, then step each one **against the sign of its weight** to drive the spam score down. Fill in the two blanks with the FGSM direction, then read how far the prediction moves.

```r
eps <- 0.5                                        # a small budget, applied to EVERY feature
w   <- coef(clf)[c("link_ratio", "sender_risk")]  # the gradient direction is the weights
evaded <- data.frame(link_ratio  = email$link_ratio  - eps * ____,
                     sender_risk = email$sender_risk - eps * ____)
round(c(before = as.numeric(predict(clf, email,  type = "response")),
        after  = as.numeric(predict(clf, evaded, type = "response"))), 3)
```
::check {"regex":"sign\\(\\s*w","gate":true,"difficulty":"intermediate","ok":"That is FGSM. Stepping each feature by eps against sign(w) lowers the score the fastest way possible, and the email drops from 0.811 (spam) to 0.341 (not spam), a confident, correct call turned into a confident, wrong one by a nudge of 0.5 per feature.","no":"You want the direction that lowers the spam score fastest: move against the sign of each weight. Both weights are positive, so use sign(w[\"link_ratio\"]) and sign(w[\"sender_risk\"]) in the blanks (each returns 1, so the attack subtracts eps from each feature)."}
::solution
```r
eps <- 0.5
w   <- coef(clf)[c("link_ratio", "sender_risk")]
evaded <- data.frame(link_ratio  = email$link_ratio  - eps * sign(w["link_ratio"]),
                     sender_risk = email$sender_risk - eps * sign(w["sender_risk"]))
round(c(before = as.numeric(predict(clf, email,  type = "response")),
        after  = as.numeric(predict(clf, evaded, type = "response"))), 3)
#> before  after
#>  0.811  0.341
```

=== step === concept
::eyebrow How far can it go
## The perturbation budget epsilon

The whole attack is governed by one dial, the budget \(\epsilon\). Formally it caps the change in the \(L_\infty\) sense: the adversarial input must stay inside a small box around the original,

\[ \lVert \mathbf{x}_{\text{adv}} - \mathbf{x} \rVert_\infty \;=\; \max_j\, \lvert x_{\text{adv},j} - x_j \rvert \;\le\; \epsilon, \]

which reads: no single feature moves by more than \(\epsilon\). A bigger budget flips more inputs but is easier to notice; a smaller budget is stealthier but flips fewer. To see the tradeoff, attack every true-spam email at a range of budgets and measure the **evasion rate**, the fraction the filter now waves through as "not spam":

```r
spam_only <- emails[emails$spam == 1, c("link_ratio", "sender_risk")]   # the real spam
budget <- c(0, 0.25, 0.5, 0.75, 1.0)
evade_rate <- sapply(budget, function(e) {
  a <- data.frame(link_ratio  = spam_only$link_ratio  - e * sign(w["link_ratio"]),
                  sender_risk = spam_only$sender_risk - e * sign(w["sender_risk"]))
  mean(predict(clf, a, type = "response") < 0.5)   # fraction now called "not spam"
})
round(setNames(evade_rate, paste0("eps=", budget)), 2)
#> eps=0 eps=0.25 eps=0.5 eps=0.75 eps=1
#>  0.16     0.32    0.55     0.73  0.84
```

Read the row. At \(\epsilon = 0\) the filter already misses 16% of spam; that is its honest natural error, no attack involved. As the budget grows the adversary drives evasion up smoothly, past half the spam at \(\epsilon = 0.5\) and to **84%** at \(\epsilon = 1\). There is no magic threshold where the model suddenly breaks; robustness degrades gracefully as you hand the attacker more room.

[NOTE]
Here every feature was fair game, the worst case, and the honest one for images, where an attacker really can touch every pixel. In a tabular system like Leo's the attacker rarely controls everything, and that gap is exactly where the defense lives.

=== step === concept
::eyebrow Fighting back
## Threat models and adversarial training

Two questions decide how defensible a model is. First, **what can the attacker actually change?** This is the **threat model**, and it is the most important line you will write. Leo's spammer composes the email, so they control `link_ratio` freely, but `sender_risk` is computed on Leo's servers from the sending domain's history: a throwaway domain scores risky and there is no cheap way to fake a long clean record. In this threat model the attacker has one lever, not two.

Second, **how do you train against it?** The standard defense is **adversarial training**: instead of minimizing loss on clean data, minimize it on the *worst* input within the budget. That is a min-max objective,

\[ \min_{\theta}\ \mathbb{E}_{(\mathbf{x},y)}\ \Big[\, \max_{\lVert \boldsymbol{\delta} \rVert_\infty \le \epsilon}\, L\!\left(\theta;\, \mathbf{x} + \boldsymbol{\delta},\, y\right) \Big], \]

where \(\theta\) are the model parameters and \(\boldsymbol{\delta}\) is the perturbation the attacker is allowed. The inner maximization is the strongest attack; the outer minimization trains the model to survive it. In practice you approximate the inner attack with FGSM, add those adversarial copies to the training set (keeping their true labels), and refit. Here we perturb only `link_ratio`, because that is all the threat model grants the attacker:

```r
eps <- 1.0
dir <- sign(coef(clf)["link_ratio"])
# Adversarial training: add a link_ratio-perturbed copy of every email (true label kept), then refit.
adv_copies <- transform(emails, link_ratio = link_ratio - eps * dir * (2 * spam - 1))
adv_train  <- rbind(emails, adv_copies)
robust <- glm(spam ~ link_ratio + sender_risk, family = binomial, data = adv_train)

evade <- function(model) {                     # the link_ratio-only attack, same budget
  a <- data.frame(link_ratio = spam_only$link_ratio - eps * dir, sender_risk = spam_only$sender_risk)
  mean(predict(model, a, type = "response") < 0.5)
}
round(c(clean_plain  = mean((predict(clf,    type = "response") > 0.5) == emails$spam),
        clean_robust = mean((predict(robust, emails, type = "response") > 0.5) == emails$spam),
        evade_plain  = evade(clf),
        evade_robust = evade(robust)), 2)
#> clean_plain clean_robust evade_plain evade_robust
#>        0.84         0.77        0.56         0.34
```

The evasion rate falls from **0.56 to 0.34**, and clean accuracy slips from **0.84 to 0.77**. That drop is the price, paid on purpose. And notice the single-lever attack already evades less than the everything-goes attack did (0.56 versus 0.84 at the same budget), because the threat model took a weapon away. Now look at *how* the defense worked:

```r
round(rbind(plain = coef(clf), robust = coef(robust)), 2)
#>        (Intercept) link_ratio sender_risk
#> plain         0.08       2.14        2.08
#> robust        0.04       0.34        1.36
```

Adversarial training collapsed the `link_ratio` weight from **2.14 to 0.34** and leaned harder on `sender_risk`. You never told it which feature was attackable; feeding it emails whose `link_ratio` had been scrambled taught it that `link_ratio` is unreliable, so it shifted its trust onto the one signal the attacker cannot touch.

[KEY INSIGHT]
Robustness is always robustness *against a threat model*. The most effective defense here was not a clever loss but an honest answer to "what can the adversary change?", followed by training the model to rely on what they cannot.

=== step === quiz
::eyebrow Check yourself
## What adversarial training bought

After adversarial training, evasion fell from **0.56 to 0.34**, clean accuracy fell from **0.84 to 0.77**, and the `link_ratio` weight collapsed from **2.14 to 0.34**. Which reading is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It taught the model to lean on sender_risk, the feature the attacker cannot fake, cutting evasion at a deliberate clean-accuracy cost; robustness is defined against a threat model, not in the abstract ::ok Exactly. Perturbing link_ratio during training made that feature look untrustworthy, so the fit down-weighted it and shifted onto the untamperable sender_risk. Evasion dropped, clean accuracy paid a little, and none of it means anything without naming what the attacker can change.
- It made the model strictly better: more robust and more accurate at once ::no Clean accuracy fell from 0.84 to 0.77. Adversarial training buys robustness with clean accuracy; a uniform improvement is exactly what this tradeoff rules out, which is why you only pay it when an attacker is a real threat.
- It removed adversarial examples entirely and solved the robustness problem ::no Evasion is 0.34, not 0. A larger budget, or an attacker who found a way to influence sender_risk, would still get through. Adversarial training raises the cost of an attack within one threat model; it does not make a model unbreakable.

=== step === concept
::eyebrow The honest limits
## Where robustness still leaks

Adversarial training helped, but treat it as a rate limiter, not a lock. Three limits keep this an open problem:

- **Transferability.** An adversary rarely needs your exact model. Examples crafted on a *substitute* model they trained themselves often transfer and fool yours, so "the attacker cannot see my weights" is weak protection. This is what makes black-box attacks practical.
- **No complete defense.** Adversarial training hardens a model against the specific attack and budget you trained on. A stronger or differently shaped attack (a larger \(\epsilon\), a different norm, an attack on a feature you assumed was safe) can still win. Robustness is a moving target, not a checkbox.
- **Images versus tables.** The classic "imperceptible" story needs many dimensions: thousands of pixels each nudged by a hair add up to a boundary-crossing shove no human sees. Leo's two features cannot hide a change that way, so tabular adversaries trade invisibility for *validity*, making cheap changes to the inputs they control that still describe a real, sendable email.

[WARNING]
Never let a robustness result travel without its threat model. "Evasion dropped to 0.34" is meaningful only alongside "against an FGSM attack of budget 1.0 on link_ratio." Change the budget, the norm, or the controllable features and the number changes with it.

[NOTE]
Everything here used a linear model so the gradient is exactly the weights and you can see every step. Real attacks on deep networks use the same idea with iterative, stronger versions (PGD and its relatives); the concepts, gradient direction, budget, min-max training, carry over unchanged.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Szegedy et al. (2014), Intriguing Properties of Neural Networks](https://arxiv.org/abs/1312.6199) - the paper that first found adversarial examples and named the phenomenon.
- [Goodfellow, Shlens and Szegedy (2015), Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572) - introduces FGSM and the panda-to-gibbon example; the linear view you used here.
- [Madry et al. (2018), Towards Deep Learning Models Resistant to Adversarial Attacks](https://arxiv.org/abs/1706.06083) - frames adversarial training as the min-max problem and introduces PGD, the stronger iterative attack.
- [Tsipras et al. (2019), Robustness May Be at Odds with Accuracy](https://arxiv.org/abs/1805.12152) - the clean-accuracy cost you paid, explained and made precise.
- [Ilyas et al. (2019), Adversarial Examples Are Not Bugs, They Are Features](https://arxiv.org/abs/1905.02175) - why the vulnerability exists: models lean on predictive but non-robust features, exactly the link_ratio story.

=== step === complete
## Lesson 6 complete

You can now explain why a model is **accurate and brittle at the same time**: accuracy is measured on inputs from nature, robustness on inputs from an opponent, and a confident point can sit a short, well-signposted walk from the decision boundary. You built the **fast gradient sign method**, stepping each feature by a budget \(\epsilon\) against the sign of the gradient (which for a linear model is just the weights), and flipped a confident spam call from 0.81 to 0.34. You traced how **attack success grows with the budget**, and hardened the filter with **adversarial training**, watching it trade a little clean accuracy to lean on the one feature the attacker could not fake. Above all, you learned to state a **threat model** first, because robustness has no meaning without one.

Next, Lesson 7: A Monitoring and Robustness Playbook. You will assemble this whole section, drift, out-of-distribution inputs, group failures, and adversarial attacks, into a single deployment checklist: what to log, which alarms to wire, and when an alert should page a human instead of quietly rolling back.

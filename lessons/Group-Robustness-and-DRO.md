---
title: "Robustness and Drift Lesson 5: Group Robustness and DRO"
catalog_blurb: "Why average accuracy can hide a failing subgroup, and how to lift it."
description: "A model can score 88% on average while failing a subgroup. Measure worst-group accuracy, see a spurious feature reverse for a minority, and fix it with DRO."
keywords: "group robustness, distributionally robust optimization, DRO, worst-group accuracy, spurious correlation, subgroup failure, group reweighting, ERM, R"
post_type: "LESSON"
curriculum_id: "6.190.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-robustness-drift"
course_title: "Robustness, Drift and Distribution Shift"
course_lesson: "5"
course_total: "7"
course_landing: "R-Robustness-and-Drift-Course.html"
course_next: "Adversarial-Robustness.html"
course_prev: "Out-of-Distribution-and-Novelty-Detection.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Group Robustness and DRO

Lesson 4 asked whether a single input was too strange to trust. This lesson asks something the last four never did: what if the model is failing an entire group of ordinary, in-distribution customers, and its headline accuracy looks great anyway?

Nadia's fraud model serves two kinds of shopper. Nine in ten orders are **domestic**; one in ten come from **international** customers living half a world away. On the last quarter's data the model posts **88% accuracy**, and everyone signs off. Then the complaints start, and every one of them is from an international customer whose perfectly normal order was blocked as fraud.

The 88% was never a lie. It was an average, and the average belongs to the majority. Toggle the panel below between the model everyone shipped (ERM) and the fix you will build (DRO), and watch the shortest bar, the worst-off group, rise.

By the end of this lesson you will be able to:

- Measure **worst-group accuracy** and explain why it can crater while the **average** stays high
- Trace the failure to a **spurious feature** that helps the majority but reverses sign for a minority
- Train a group-reweighted (**DRO**) model in R and read the deliberate average-vs-worst tradeoff
- Judge when protecting the worst group is worth the cost, and where DRO itself breaks

**Prerequisites:** you finished [Lesson 4](Out-of-Distribution-and-Novelty-Detection.html), you can fit and read a logistic regression, and you know what accuracy means.

::widget worst-group {}

=== step === concept
::eyebrow The problem
## The average is a majority vote

An accuracy number printed over a whole dataset answers a question you did not ask. It tells you how the model does on a *typical* row, and typical means whatever the crowd is made of. When 90% of Nadia's orders are domestic, "overall accuracy" is, to a very close approximation, "domestic accuracy" wearing a disguise.

Make that precise. Split the customers into groups \(g\) (here domestic and international). Write \(n_g\) for the number of rows in group \(g\), \(n\) for the total, and \(\mathrm{acc}_g\) for the accuracy computed *within* group \(g\) (the fraction of that group's rows the model gets right). The overall average accuracy is just a size-weighted blend of the per-group accuracies:

\[ \mathrm{acc}_{\text{avg}} \;=\; \sum_{g} \frac{n_g}{n}\,\mathrm{acc}_g. \]

The **worst-group accuracy** is the honest, adversarial summary, the minimum across groups:

\[ \mathrm{acc}_{\text{worst}} \;=\; \min_{g}\,\mathrm{acc}_g. \]

Now see the trap. International is only \(n_g/n = 0.1\) of the rows, so its accuracy enters the average multiplied by a tiny \(0.1\). If domestic sits at \(0.96\) and international collapses from \(0.9\) all the way to \(0.11\), the average barely twitches (it falls by about \(0.1 \times 0.8 \approx 0.08\), from \(0.96\) to \(0.88\)), while \(\mathrm{acc}_{\text{worst}}\) tells the true story: \(0.11\).

[KEY INSIGHT]
Average accuracy is a headline the majority writes. Worst-group accuracy is the number a failing minority feels. When groups differ in size, only the second one can tell you a subgroup is in freefall.

=== step === concept
::eyebrow Where it comes from
## A shortcut that reverses for the minority

A model does not fail a group out of spite. It fails because it grabbed a **shortcut**, also called a **spurious feature**: a feature that predicts the label cheaply in most of the data, so minimizing overall error rewards leaning on it, even when that feature means the *opposite* thing for a smaller group.

Here is Nadia's shortcut, made concrete. For every order we record how deep into the server's overnight window (12am to 4am) it landed, as one number, `night_score`: high means placed in the dead of the server's night. For **domestic** customers, awake during the server's daytime, a dead-of-night order is a classic fraud tell, so their fraud clusters at high `night_score`. But **international** customers live twelve hours ahead: the server's 2am is their 2pm lunch break. Their perfectly ordinary orders land at high `night_score`, and their rare fraud, committed in *their* night, lands low. The very same feature points one way for the majority and the exact opposite way for the minority.

Each lesson runs in its own R session, so we rebuild Nadia's world from scratch. `risk` is a genuine signal both groups share; `night_score` is the reversing shortcut.

```r
set.seed(4)
n <- 3000
segment     <- ifelse(runif(n) < 0.9, "domestic", "international")   # 90% vs 10%
risk        <- rnorm(n)                                             # a genuine shared signal
fraud       <- rbinom(n, 1, plogis(1.2 * risk))                    # the TRUE label
# night_score: high = ordered in the server's dead-of-night window.
# For domestic, high co-occurs with fraud; for international it reverses.
night_score <- ifelse(segment == "domestic", 2 * fraud - 1, 1 - 2 * fraud) + rnorm(n, 0, 0.5)
orders <- data.frame(fraud, risk, night_score, segment)

round(prop.table(table(orders$segment)), 2)   # the 90/10 split
#>      domestic international
#>           0.9           0.1
round(mean(orders$fraud), 2)                   # base fraud rate, both groups
#> [1] 0.5
```

=== step === concept
::eyebrow The measurement
## The headline hides the crash

Now fit the model everyone shipped: an ordinary logistic regression that minimizes error over *all* the rows. Then measure it the honest way, one accuracy per group, not one number for everyone. The helper `gacc` returns domestic accuracy, international accuracy, their worst, and the overall average, so you can see the headline and the truth side by side.

```r
gacc <- function(fit) {
  p   <- as.integer(predict(fit, orders, type = "response") > 0.5)
  dom <- orders$segment == "domestic"
  c(domestic     = mean(p[dom]  == fraud[dom]),
    international = mean(p[!dom] == fraud[!dom]),
    worst        = min(mean(p[dom] == fraud[dom]), mean(p[!dom] == fraud[!dom])),
    average      = mean(p == fraud))
}

erm <- glm(fraud ~ risk + night_score, family = binomial, data = orders)
round(gacc(erm), 2)
#>      domestic international         worst       average
#>          0.96          0.11          0.11          0.88
```

There it is. The model is right **96%** of the time on domestic customers and a catastrophic **11%** of the time on international ones, worse than a coin flip on a problem that is roughly 50/50. The `average` reads a comfortable **0.88**, exactly the number that got the model approved. The disaster is invisible until you condition on the group.

[NOTE]
This gap is not a train-test artifact. We are measuring on the very data the model was fit on, and the split is still 0.96 versus 0.11. It is a *between-group* failure baked into what the model learned, not the usual memorize-the-training-set overfitting.

=== step === quiz
::eyebrow Check yourself
## Read the split

Nadia's model scores **0.88 average** but only **0.11 on international customers**, a group that is 10% of orders and has the same 50/50 fraud rate as everyone else. What is the most accurate reading?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The 90% domestic majority carries the average, so it stays high while the model actively fails international, because it leaned on a feature that reverses for that group ::ok Exactly. The average is a size-weighted blend dominated by the majority, so a minority can crater without moving it. And 0.11 is not mere ignorance of the group; it is worse than a coin flip, the signature of a feature the model reads backwards for these customers.
- The international group is simply too small for the model to learn, so collecting more international orders will lift the average ::no Size is not the wound. The model has plenty of signal; it is using a shortcut that points the wrong way for this group. More data of the same kind teaches the same backwards rule, and the average is already high, so it would barely move.
- This is ordinary overfitting: the 0.88-vs-0.11 gap is a train-test gap that a held-out set would close ::no It is measured on the training data itself, and it is a gap between GROUPS, not between train and test. A model that never saw the spurious feature still splits about 0.69/0.67 here, so the failure is structural, not memorization.

=== step === concept
::eyebrow The objective
## From ERM to DRO: change what you minimize

Why did a competent training procedure walk straight into this? Because of exactly *what* it was told to minimize. Standard training does **empirical risk minimization** (ERM): it picks the parameters \(\theta\) that make the average loss over all \(n\) examples as small as possible,

\[ \hat{\theta}_{\text{ERM}} \;=\; \arg\min_{\theta}\ \frac{1}{n}\sum_{i=1}^{n} \ell\!\left(\theta;\, x_i, y_i\right), \]

where \(\ell\) is the per-example loss and \((x_i, y_i)\) is one order's features and label. Averaging over everyone means the 10% minority can contribute at most a tenth of the objective, so the optimizer happily reads `night_score` backwards for them if that sharpens the other 90%. The average has no idea a group is being sacrificed.

**Distributionally robust optimization** (DRO) changes the target. Instead of the average loss, minimize the loss of the *worst* group, a min-max objective:

\[ \hat{\theta}_{\text{DRO}} \;=\; \arg\min_{\theta}\ \max_{g \in \mathcal{G}}\ \frac{1}{n_g}\sum_{i:\,g_i = g} \ell\!\left(\theta;\, x_i, y_i\right), \]

where \(\mathcal{G}\) is the set of groups. A practical and surprisingly effective surrogate is simply to **reweight** the training loss so each group counts equally, giving group \(g\) a weight \(w_g \propto 1/n_g\):

\[ \min_{\theta}\ \sum_{i} w_{g_i}\,\ell\!\left(\theta;\, x_i, y_i\right), \qquad w_g \propto \frac{1}{n_g}. \]

[KEY INSIGHT]
With a 90/10 split, equal group weight means the international rows each count \(0.9/0.1 = 9\) times a domestic row. You are not adding data; you are telling the loss that failing the small group hurts just as much as failing the big one.

=== step === tryit
::eyebrow Your turn
## Set the upweight and fit it

Turn the reweighting idea into a model. Fill in the weight that makes the international segment (about 10% of rows) pull the same total weight as the domestic segment (about 90%), then fit the DRO model and compare it to ERM group by group.

```r
w   <- ifelse(orders$segment == "international", ____, 1)
dro <- glm(fraud ~ risk + night_score, family = binomial,
           data = orders, weights = w)
round(rbind(ERM = gacc(erm), DRO = gacc(dro)), 2)
```
::check {"regex":"9\\s*,\\s*1","gate":true,"difficulty":"intermediate","ok":"Right: international is about 1/9 of the rows, so a weight of 9 makes the two segments contribute equal total weight to the loss. Worst-group accuracy jumps from 0.11 to 0.66.","no":"Make both segments count equally. International is ~10% of rows and domestic ~90%, so multiply the international rows by about 9 (9 x 10% = 90%). Put 9 in the blank."}
::solution
```r
w   <- ifelse(orders$segment == "international", 9, 1)   # 10% minority x 9 balances the 90% majority
dro <- glm(fraud ~ risk + night_score, family = binomial,
           data = orders, weights = w)
round(rbind(ERM = gacc(erm), DRO = gacc(dro)), 2)
#>     domestic international worst average
#> ERM     0.96          0.11  0.11    0.88
#> DRO     0.71          0.66  0.66    0.70
```

=== step === concept
::eyebrow Why it works
## The shortcut dies on its own

Look at what reweighting bought and what it cost. Worst-group accuracy leapt from **0.11 to 0.66**; domestic accuracy slipped from **0.96 to 0.71**; the average fell from **0.88 to 0.70**. That drop is not a bug, it is the price, paid on purpose, to stop failing a whole group of real customers.

The most revealing part is the coefficients. You never told the model which feature was the villain, yet reweighting the rows made it disarm the shortcut by itself:

```r
round(rbind(ERM = coef(erm), DRO = coef(dro)), 2)
#>     (Intercept) risk night_score
#> ERM        0.00 1.05        1.99
#> DRO       -0.04 1.08        0.05

# What if we had simply deleted the spurious feature instead?
core_only <- glm(fraud ~ risk, family = binomial, data = orders)
round(gacc(core_only), 2)
#>      domestic international         worst       average
#>          0.69          0.67          0.67          0.69
```

Under ERM, `night_score` carries a hefty weight of **1.99**, the model trusts the shortcut. Under DRO it falls to **0.05**, effectively switched off, because a feature that helps one group and hurts the other equally can no longer earn its keep once both groups count the same. And notice the `core_only` model, the one we would get by *manually* dropping `night_score`, lands at **0.69/0.67**, almost exactly where DRO lands. Reweighting rediscovered "ignore the reversing feature" without anyone knowing in advance which feature to drop.

[WARNING]
The average accuracy genuinely fell. DRO buys worst-group performance with majority performance; there is no setting where every group improves at once. Ship it only when a failing subgroup is a real cost you have decided to pay down.

[NOTE]
DRO needs the **group labels** at training time, which you must have and be allowed to use. And with a tiny, noisy worst group it can chase that group's quirks and overfit it, so keep an eye on the worst group's own validation accuracy, not just its training accuracy.

=== step === quiz
::eyebrow Check yourself
## What reweighting did

After DRO, international rose to 0.66, domestic fell from 0.96 to 0.71, and the `night_score` coefficient dropped from 1.99 to about 0.05. Which statement is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It stopped the model relying on a shortcut that only worked for the majority, trading some majority accuracy for a large gain on the minority; the near-zero coefficient shows the reversing feature was effectively switched off ::ok Exactly. Once both groups count equally in the loss, a feature that helps one and hurts the other cannot pay its way, so its coefficient collapses to about zero, and the model leans on the genuine `risk` signal that works for everyone, at a deliberate cost to majority accuracy.
- It found a strictly better model that lifts every group at once ::no Domestic accuracy fell from 0.96 to 0.71. DRO buys worst-group accuracy by spending majority accuracy; a uniform improvement is exactly what this tradeoff rules out.
- It deleted the night_score column from the data ::no The column is untouched. Reweighting the ROWS made the fit choose a coefficient near zero on its own, without you ever telling it which feature was spurious, which is the whole point.

=== step === widget
::eyebrow A wider lens
## Worst-group accuracy is one metric among several

Worst-group accuracy is the right alarm for "is any group being failed?", but it is a single number, and group fairness has more than one definition, which usually pull against each other. Compare the same model across two groups on three common yardsticks: the **selection rate** (how often it predicts the positive class), the **true-positive rate** (how often it catches the truly positive), and the **false-positive rate** (how often it wrongly flags the negative). Toggle the definitions below and watch a model satisfy one notion of fairness while violating another.

::widget fairness-metrics {}

The lesson generalizes past accuracy: robustness is about equalizing *whatever performance measure matters* across the groups you care about, and part of the engineering is choosing which measure that is. You usually cannot satisfy every definition at once, so pick the one tied to the real-world harm you are trying to prevent.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Sagawa, Koh, Hashimoto and Liang (2020), Distributionally Robust Neural Networks for Group Shifts](https://arxiv.org/abs/1911.08731) - the Group-DRO paper: worst-group accuracy, group reweighting, and why regularization matters for it.
- [Geirhos et al. (2020), Shortcut Learning in Deep Neural Networks](https://arxiv.org/abs/2004.07780) - the mechanism behind the whole lesson: models latching onto features that work in-sample but generalize wrong.
- [Duchi and Namkoong (2021), Learning Models with Uniform Performance via Distributionally Robust Optimization](https://arxiv.org/abs/1810.08750) - the theory under the min-max objective you wrote.
- [Buolamwini and Gebru (2018), Gender Shades](https://proceedings.mlr.press/v81/buolamwini18a.html) - a real, deployed system with strong average accuracy that failed badly on a subgroup.
- [Hardt, Price and Srebro (2016), Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) - the fairness metrics behind the wider-lens widget, and why they conflict.

=== step === complete
## Lesson 5 complete

You can now catch a failure that a headline number is built to hide. Measure **worst-group accuracy** as the minimum across groups, and know why the size-weighted **average** stays high while a minority sinks. Trace the failure to a **spurious feature** that reverses sign for a group, and see it in the coefficients. Train a group-reweighted **DRO** model, read the deliberate average-vs-worst tradeoff, and recognize that reweighting disarms the shortcut on its own, without you naming it. And weigh the costs: DRO needs group labels, spends majority accuracy, and can overfit a tiny worst group.

Every failure so far, drifting data, a strange input, a sacrificed group, has been unintentional. Next, Lesson 6: Adversarial Robustness. You will meet an adversary who perturbs an input too little for a human to notice, yet enough to flip a confident prediction, and see why a model can be accurate and brittle at the same time.

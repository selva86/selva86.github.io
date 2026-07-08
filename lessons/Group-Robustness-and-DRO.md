---
title: "Robustness and Drift Lesson 5: Group Robustness and DRO"
catalog_blurb: "Why average accuracy can hide a whole subgroup the model is failing."
description: "A fraud model can be 88% accurate overall yet fail a whole customer segment worse than a coin flip. Measure worst-group accuracy and fix it with DRO in R."
keywords: "group robustness, distributionally robust optimization, DRO, group DRO, worst-group accuracy, spurious feature, spurious correlation, reweighting, ERM, fairness, R"
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

In Lesson 4, Nadia's fraud model met an input unlike anything it had trained on, and you learned to flag it. That was a *strange* transaction. This lesson is about the opposite and more unsettling failure: transactions that look completely ordinary, on which the model is confident, correct on average, and quietly wrong for an entire group of real customers.

Nadia's model is right about **88%** of the time overall. Her manager is happy. Then she splits that number by customer segment and finds that for **international** customers, the model is right only **11%** of the time, worse than flipping a coin. Nothing looks broken. The average hid a group in freefall.

By the end of this lesson you will be able to:

- Explain how a strong **average** accuracy can conceal a subgroup the model fails, and compute **worst-group accuracy**
- Spot a **spurious feature** whose relationship with the label reverses for a minority, and see why it is the cause
- Change the training objective from average loss (**ERM**) to worst-group loss (**DRO**), and implement it as **reweighting** in R
- Read the **worst-group versus average tradeoff** as a deliberate choice, and name where DRO stops working

**Prerequisites:** you finished [Lesson 4: Out-of-Distribution and Novelty Detection](Out-of-Distribution-and-Novelty-Detection.html), you can fit and read a logistic regression, and you are comfortable with a weighted average. No fairness or robustness theory is assumed; every term is defined here.

::widget worst-group {}

=== step === concept
::eyebrow The setup
## One model, two very different customers

Each lesson runs in its own R session, so we rebuild Nadia's world from scratch. Her fraud model reads two standardized features of every transaction. The first, `risk`, is a genuine, causal fraud signal built from the account's own history: higher means genuinely riskier, for everyone. The second, `night_score`, measures how far into the server's night the transaction landed. It looks useful, and for most customers it is.

The catch is the customer base. **Ninety percent** of transactions are **domestic**, in the same timezone as Nadia's servers. The other **ten percent** are **international**, many hours ahead. That single fact is about to matter enormously.

```r
set.seed(4)
n <- 3000
segment <- ifelse(runif(n) < 0.9, "domestic", "international")  # 90% domestic, 10% international
risk    <- rnorm(n)                                            # a genuine fraud signal (standardized)
fraud   <- rbinom(n, 1, plogis(1.2 * risk))                    # the TRUE driver of fraud: risk

# night_score: a "transaction at night" score. For DOMESTIC customers, fraud tends to happen at
# odd hours, so a fraudulent row gets a high score (2*1-1 = +1) and a clean row a low score.
# For INTERNATIONAL customers the server's night is their afternoon, so the mapping FLIPS
# (1 - 2*1 = -1): their fraud happens in what the server calls broad daylight.
night_score <- ifelse(segment == "domestic", 2*fraud - 1, 1 - 2*fraud) + rnorm(n, 0, 0.5)

tx <- data.frame(fraud, risk, night_score, segment)
table(segment)
#> segment
#>      domestic international
#>          2712           288
```

Now Nadia trains the model she has trained a hundred times, a logistic regression on both features, and checks its overall accuracy the way her dashboard does.

```r
erm <- glm(fraud ~ risk + night_score, family = binomial, data = tx)
round(mean((predict(erm, type = "response") > 0.5) == fraud), 2)   # overall accuracy
#> [1] 0.88
```

Eighty-eight percent. On paper this is a good model, and if Nadia stops reading here, it ships.

=== step === concept
::eyebrow The metric that tells the truth
## Split the average, meet the worst group

An average is a single number standing in for a whole crowd, and a crowd can hide a lot. Overall accuracy weights each customer equally, so a segment that is only 10% of the data can be in freefall while the headline barely moves. The honest thing to do is to stop averaging over everyone and measure the model **inside each group**.

For a group \(g\), its **group accuracy** is the fraction of that group's transactions the model gets right,

\[ \mathrm{acc}_g \;=\; \frac{1}{n_g} \sum_{i \in g} \mathbf{1}\!\left[\hat{y}_i = y_i\right], \]

where \(n_g\) is the number of transactions in group \(g\), \(y_i\) and \(\hat{y}_i\) are the true and predicted labels of transaction \(i\), and \(\mathbf{1}[\cdot]\) is 1 when the prediction is correct and 0 otherwise. The overall accuracy is just the size-weighted blend of these, \(\mathrm{acc}_{\text{avg}} = \sum_g \frac{n_g}{n}\,\mathrm{acc}_g\), which is exactly why the big group dominates it. The number that cannot hide a failing group is the **worst-group accuracy**, the smallest group accuracy of all,

\[ \mathrm{acc}_{\text{wg}} \;=\; \min_{g}\; \mathrm{acc}_g. \]

Compute both group accuracies on Nadia's model:

```r
gacc <- function(fit) {
  hit <- (predict(fit, tx, type = "response") > 0.5) == fraud   # TRUE where the model is right
  c(domestic      = mean(hit[segment == "domestic"]),
    international  = mean(hit[segment == "international"]),
    worst         = min(mean(hit[segment == "domestic"]), mean(hit[segment == "international"])),
    average       = mean(hit))
}
round(gacc(erm), 2)
#>     domestic international       worst     average
#>         0.96          0.11        0.11        0.88
```

There it is. The domestic group is at **0.96**, the international group at **0.11**, and the average of **0.88** sat comfortably in between, closer to the big group. The bars in the panel show the same split: the majority and the average stand tall while the minority and the worst group sit together on the floor at 0.11. Worst-group accuracy is **0.11**, and it is the number Nadia's dashboard should have shown all along.

[KEY INSIGHT]
Average accuracy answers "how often is the model right?" Worst-group accuracy answers "how badly does the model fail the group it fails most?" For anyone in that group, only the second question matters.

::widget worst-group {}

=== step === quiz
::eyebrow Check yourself
## Reading the split

Nadia's model is **88%** accurate overall but only **11%** on the international segment, which is 10% of her customers. What is the right conclusion to draw?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The 0.88 is a size-weighted average that the 90% domestic majority dominates; the international group sits at 0.11, worse than a coin flip, so the model has a worst-group failure the headline hid ::ok Exactly. The average is a blend weighted by group size, so a small group in freefall barely moves it. The 0.11 is not noise around 0.88; it is a whole segment the averaged number was quietly carrying.
- The model is simply broken or undertrained; no genuinely good model scores 0.11 anywhere, so the fix is to retrain it from scratch ::no It is not broken in the usual sense: it scores 0.96 on 90% of the data, which is why the average looks great. Retraining the same objective on the same features reproduces the same 0.11. The problem is which group the objective is willing to sacrifice, not a training bug.
- This is ordinary overfitting; the 0.88-versus-0.11 gap is just the train-test gap, and more regularization will close it ::no Overfitting is a gap between training and held-out data. This is a gap between two groups measured the same way, and you will see it comes from a feature that means opposite things for the two groups, which regularization alone does not fix.

=== step === concept
::eyebrow The cause
## A feature that reverses for the minority

Why would a model that nails 96% of one group get 89% of another group actively *wrong*? Because it leaned on `night_score`, and `night_score` does not mean the same thing for both segments. Measure how it relates to fraud inside each group:

```r
c(domestic     = cor(night_score[segment == "domestic"],     fraud[segment == "domestic"]),
  international = cor(night_score[segment == "international"], fraud[segment == "international"]))
#>     domestic international
#>         0.89        -0.89
```

Read those two numbers slowly. For domestic customers, a higher `night_score` goes with more fraud: a strong **positive** correlation of **+0.89**. For international customers, a higher `night_score` goes with *less* fraud, an equally strong **negative** correlation of **-0.89**, because their legitimate daytime activity happens during the server's night. The feature points in exactly opposite directions for the two groups.

A feature like this is called a **spurious feature**: it is predictive in the training data (for most of it) without being a stable, causal driver of the outcome. Now look at what the model did with it:

```r
round(coef(erm), 2)
#> (Intercept)        risk night_score
#>        0.00        1.05        1.99
```

The model gave `night_score` a large **positive** weight of **1.99**, even larger than the genuine `risk` signal at 1.05. That positive weight is right for the 90% and precisely backwards for the 10%. On an international transaction, the higher the `night_score`, the more the model adds to its fraud estimate, exactly when it should subtract, because a high `night_score` is their legitimate daytime. It reads their signal upside down and lands at 0.11.

[KEY INSIGHT]
A spurious feature does not fail everywhere. It helps the majority (that is why the model keeps it) while hurting a minority for whom the correlation runs the other way. The average rewards the help and barely feels the harm.

=== step === quiz
::eyebrow Check yourself
## Why this group, and not that one

You have the pieces: `night_score` correlates **+0.89** with fraud for domestic customers and **-0.89** for international customers, and the model gave it a weight of **1.99**. Which explanation of the international group's 0.11 accuracy is correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- International customers are just intrinsically harder to predict, and with only 288 of them there is too little data for any model to do better ::no The genuine signal `risk` works fine for them; a model using `risk` alone reaches about 0.67 on this group, as you will see. The failure is not a shortage of learnable structure or of data. It is a feature the model actively reads backwards for them.
- The model relied on `night_score`, whose fraud correlation is reversed for international customers, so its positive weight of 1.99 is exactly wrong for that group and pushes its predictions the wrong way ::ok Right. The model learned one rule, "high night_score means fraud", that is true for 90% of the data and false for the other 10%. Applied to the international group it is not merely useless, it is inverted, which is how accuracy drops below 50%.
- It is random sampling bad luck; a different random seed would make the 0.11 disappear ::no The reversal is built into how the two groups differ (server-night is international daytime), not into one random draw. Change the seed and the exact numbers wiggle, but a strong positive correlation for the majority and a strong negative one for the minority remain, so the failure returns.

=== step === concept
::eyebrow The objective, named
## ERM: the model was doing its job

Here is the uncomfortable part. The model was not malfunctioning. It was doing precisely what you asked. Standard training minimizes the **average loss** over the whole dataset, a rule called **empirical risk minimization (ERM)**:

\[ \hat{\theta}_{\text{ERM}} \;=\; \arg\min_{\theta}\; \frac{1}{n} \sum_{i=1}^{n} \ell\!\left(\theta;\, x_i,\, y_i\right), \]

where \(\theta\) is the set of model parameters (here the logistic-regression coefficients), \(\ell\) is the loss on a single transaction (how wrong the prediction is), and \(x_i, y_i\) are the features and true label of transaction \(i\). The sum runs over all \(n\) transactions with equal weight, so the objective is a **majority vote**: whatever lowers the total loss wins, no matter which rows it helps and which it hurts.

Now the spurious feature makes brutal sense. A weight on `night_score` that is right for 2712 domestic rows and wrong for 288 international rows still lowers the average loss, so ERM adopts it and never looks back. Sacrificing the small group is not a bug in the optimizer; it is the optimum of the objective you handed it.

[KEY INSIGHT]
If the objective averages over everyone, it will trade a large gain on a big group for a large loss on a small one every single time. To protect a group, you have to change the objective, not just the model.

=== step === concept
::eyebrow The fix, as an objective
## DRO: optimize for the worst group

If averaging is the problem, stop averaging. **Distributionally robust optimization (DRO)** replaces "do well on average" with "do well even in the worst case". In its group form, **Group DRO**, the worst case is the worst group: instead of minimizing the mean loss, minimize the loss of whichever group currently has it hardest.

\[ \hat{\theta}_{\text{DRO}} \;=\; \arg\min_{\theta}\; \max_{g \in \mathcal{G}}\; R_g(\theta), \qquad R_g(\theta) \;=\; \mathbb{E}_{(x,y)\sim P_g}\!\left[\ell(\theta;\, x, y)\right]. \]

Unpack the two moving parts. \(R_g(\theta)\) is the **risk of group \(g\)**, its expected loss, where \(P_g\) is that group's own data distribution and \(\mathcal{G}\) is the set of groups (here domestic and international). The inner \(\max_g\) picks the *worst* group under the current parameters; the outer \(\min_\theta\) tunes the parameters to make that worst group as good as possible. It is a **min-max**: you are no longer optimizing for the average customer, you are optimizing for the customer the model treats worst.

More generally, DRO minimizes the loss over a whole **set** of plausible distributions \(\mathcal{Q}\) (an "uncertainty set"), \(\min_\theta \max_{Q \in \mathcal{Q}} \mathbb{E}_{(x,y)\sim Q}[\ell]\). Group DRO is the special, very usable case where that set is "any of my named groups". The philosophy is the same: prepare for the worst distribution you might face, not the average one.

=== step === concept
::eyebrow From objective to code
## The practical version: reweight the minority

Solving the min-max exactly needs a special optimizer, but there is a simple, effective proxy that turns any ordinary trainer into a robust one: **reweighting**. Instead of counting every transaction once, count the minority group's transactions *more*, so the objective can no longer buy a big average gain by sacrificing them. This is a **weighted ERM**,

\[ \hat{\theta} \;=\; \arg\min_{\theta}\; \sum_{i=1}^{n} w_i\; \ell\!\left(\theta;\, x_i,\, y_i\right), \]

where \(w_i\) is the weight on transaction \(i\), set larger for rows in the small group. A standard choice makes each group's total weight roughly equal, \(w_g \propto 1 / n_g\), so no group can be outvoted by sheer count. With 2712 domestic and 288 international rows, the size ratio is about 9, so weighting each international row by 9 nearly levels the two groups:

```r
w <- ifelse(segment == "international", 9, 1)   # upweight the 10% minority about 9x
tapply(w, segment, sum)                          # total weight now sitting on each segment
#>     domestic international
#>         2712          2592
```

The international segment went from 288 votes to 2592, almost matching the domestic 2712. Under this reweighted objective, a coefficient that helps domestic customers but wrecks international ones is no longer a good trade, because the international loss now counts almost as much as the domestic loss. In the next step you will hand those weights to the same `glm` and watch the worst group come back to life.

=== step === tryit
::eyebrow Your turn
## Fit the robust model

Turn the reweighting into one line. You want to upweight the segment the average is failing, the **international** one, so fill the blank with the segment name that should get the weight of 9. Then read the group accuracies with the same `gacc` you built earlier.

```r
dro <- glm(fraud ~ risk + night_score, family = binomial, data = tx,
           weights = ifelse(segment == ____, 9, 1))   # upweight the failing minority
round(gacc(dro), 2)
```
::check {"regex":"ifelse.*international","gate":true,"difficulty":"intermediate","ok":"That is Group DRO by reweighting. Counting each international transaction 9 times stops the objective from trading their accuracy away, and the worst group climbs from 0.11 to 0.66, past a coin flip and into a usable model, without you touching the features or the model class.","no":"Upweight the group the model is FAILING, the minority. Put \"international\" in the blank so ifelse(segment == \"international\", 9, 1) gives each international row a weight of 9 and each domestic row a weight of 1."}
::solution
```r
dro <- glm(fraud ~ risk + night_score, family = binomial, data = tx,
           weights = ifelse(segment == "international", 9, 1))
round(gacc(dro), 2)
#>     domestic international       worst     average
#>         0.71          0.66        0.66        0.70
```

=== step === quiz
::eyebrow Check yourself
## What just happened to the numbers

Reweighting lifted the worst group from **0.11 to 0.66**, while the average slipped from **0.88 to 0.70** and the domestic group fell from **0.96 to 0.71**. Which reading of that trade is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- DRO deliberately spent average accuracy to rescue the worst group; it is not a free win but a values decision about which failures are unacceptable ::ok Exactly. The worst group went from unusable to usable, and the bill was paid in average and majority accuracy. Whether that trade is worth it is a judgement about who the model must not fail, and DRO is the knob that lets you make it on purpose instead of by accident.
- DRO made the model strictly better everywhere; both average and worst-group accuracy went up ::no Average accuracy fell from 0.88 to 0.70 and the domestic group fell from 0.96 to 0.71. That is the whole point of the tradeoff: you cannot usually lift the worst group for free. A method that improved every number at once would not be making a choice at all.
- DRO deleted the night_score feature, which is why the numbers moved ::no The feature is still in the model; reweighting only changed how much its errors count. You will see its coefficient shrink toward zero rather than vanish, and crucially the method was never told which feature was spurious. It rebalanced the groups, not the columns.

=== step === concept
::eyebrow Why it worked
## The spurious weight collapses, and the honest cost

Reweighting did not know which feature was the troublemaker. So how did it fix one? By making the international errors expensive, it removed the reason the model liked `night_score` in the first place. Compare the coefficients before and after:

```r
round(rbind(ERM = coef(erm), DRO = coef(dro)), 2)
#>     (Intercept) risk night_score
#> ERM        0.00 1.05        1.99
#> DRO       -0.04 1.08        0.05
```

The `night_score` weight collapsed from **1.99 to 0.05**, effectively switched off, while the genuine `risk` signal was left almost untouched (1.05 to 1.08). The model taught itself to distrust the feature that pointed different ways for different groups and to lean on the one that means the same thing for everyone. You can confirm that is what happened by simply dropping `night_score` and fitting on `risk` alone:

```r
core_only <- glm(fraud ~ risk, family = binomial, data = tx)
round(rbind(DRO = gacc(dro), risk_only = gacc(core_only)), 2)
#>           domestic international worst average
#> DRO           0.71         0.66  0.66    0.70
#> risk_only     0.69         0.67  0.67    0.69
```

The two rows nearly match. **DRO recovered the drop-the-spurious-feature model without ever being told which feature was spurious**, which is exactly why it is useful: in a real model with hundreds of features you rarely know which one betrays a group.

[WARNING]
The average cost is real and permanent, not a rounding artifact. Overall accuracy genuinely fell from 0.88 to 0.70. DRO does not find a hidden model that is better for everyone; it moves you, on purpose, to a point that is worse on average and far better for the group you refuse to abandon.

=== step === concept
::eyebrow The honest limits
## Where DRO stops helping

Reweighting rescued Nadia's international customers, but treat it as a sharp tool with a narrow grip, not a cure. Four limits decide whether it applies to your problem at all:

- **You need the group labels.** Every line here assumed a `segment` column. If you do not know who belongs to the vulnerable group, you cannot upweight them, and discovering the groups (or doing DRO without labels) is a harder, separate problem.
- **Reweighting is a proxy, not exact Group DRO.** A fixed weight of 9 is a static guess. True Group DRO chases whichever group is worst *during* training, and on messier data the fixed-weight shortcut can under- or over-correct.
- **Turn the knob too far and everyone loses.** Weight the minority heavily enough and the model overfits its 288 rows, so both groups slide. The worst-group curve is not monotonic; there is a best weight, not an infinite one.
- **Real groups are intersectional.** Domestic-versus-international is one axis. Slice by device, by age of account, by country, and the number of groups explodes; protecting the worst of many is much harder than protecting the worst of two.

This is also where group robustness meets **fairness**. Worst-group accuracy is one way to ask "does the model treat groups comparably?", but fairness has several definitions that pull against each other. The panel below compares the same model across two groups on three of them, selection rate, true-positive rate, and false-positive rate. Switch the definition and watch: a model can satisfy one notion of "fair" and violate another, and no reweighting makes all of them hold at once.

::widget fairness-metrics {}

[NOTE]
Robustness and fairness overlap but are not the same. Worst-group accuracy asks the model to be competent for everyone; fairness metrics ask it to be even-handed in specific, often incompatible, ways. DRO is a lever for the first; the second usually forces an explicit choice among definitions.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Sagawa, Koh, Hashimoto and Liang (2020), Distributionally Robust Neural Networks for Group Shifts](https://arxiv.org/abs/1911.08731) - the Group-DRO paper: worst-group accuracy and the reweighting idea you used here, with the spurious-correlation framing.
- [Geirhos et al. (2020), Shortcut Learning in Deep Neural Networks](https://arxiv.org/abs/2004.07780) - why models latch onto spurious features like `night_score` in the first place, across vision and language.
- [Duchi and Namkoong (2021), Learning Models with Uniform Performance via Distributionally Robust Optimization](https://arxiv.org/abs/1810.08750) - the min-max theory behind DRO and its uncertainty sets, made rigorous.
- [Buolamwini and Gebru (2018), Gender Shades](https://proceedings.mlr.press/v81/buolamwini18a.html) - a real deployed system strong on average yet failing a subgroup badly; the worst-group problem outside a toy dataset.
- [Hardt, Price and Srebro (2016), Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) - the fairness definitions behind the wider-lens panel, and why they conflict.

=== step === complete
## Lesson 5 complete

You can now see past a comforting average. You learned to split accuracy by group and read **worst-group accuracy**, the number that refuses to hide a failing segment. You traced Nadia's 0.11 to a **spurious feature** whose fraud correlation reversed for international customers, and you named why the model kept it: **ERM** minimizes average loss, so sacrificing a small group is the optimum, not a bug. You changed the objective to **DRO**, minimizing the worst group's risk, and implemented it as **reweighting** in one line of `glm`, watching the worst group climb from 0.11 to 0.66 as the spurious coefficient collapsed toward zero. Above all, you learned that the fix is a **deliberate trade**: a little average accuracy spent, on purpose, so the model no longer abandons a group.

Every failure in this course so far, a drifting feature, a strange input, a sacrificed subgroup, has been the world changing on its own or an accident of the objective. Next, Lesson 6: Adversarial Robustness introduces the first failure with a **mind behind it**, an opponent who studies your model and crafts an input designed to fool it, and you will build that attack, and a defense, in R.

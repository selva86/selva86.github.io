---
title: "Regression Modeling Lesson 7: Logistic Regression Done Properly"
catalog_blurb: "Model a yes-or-no outcome as a probability and read what drives it."
description: "Predict a yes-or-no outcome the right way: why linear regression fails, the logit link and odds ratios, and fitting and reading glm(family = binomial) in R."
keywords: "logistic regression, glm, binomial, logit, log-odds, odds ratio, probability, binary outcome, sigmoid, decision threshold, classification, R"
post_type: "LESSON"
curriculum_id: "6.20.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "7"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "GLMs-Beyond-Logistic.html"
course_prev: "Inference-and-Prediction-in-Regression.html"
---

=== step === cover
::eyebrow Lesson 7 of 8
## Logistic Regression Done Properly

In Lesson 6 you separated the two jobs a regression can do: *explaining* which predictors matter, and *predicting* a number for a new day, each with its own kind of interval. Every one of those models answered a question whose answer was a number: how many cups will Priya sell?

This lesson changes the question. Priya, still running her iced-coffee cart, no longer wants a cup count. She wants to know one yes-or-no thing each morning: **will I sell out today?** On a freezing day, almost never. On a scorcher, almost certainly. The honest answer is not "yes" or "no" but a **probability**, a number between 0 and 1 that slides smoothly from one to the other as the day heats up. The curve below is exactly that answer, and building it correctly is what this lesson is about.

By the end you will be able to:

- Explain why ordinary linear regression is the wrong tool for a yes/no outcome
- Turn a probability into odds and log-odds, and back again through the S-shaped logistic curve
- Fit a logistic regression in R with `glm()`, and read its coefficients as odds ratios
- Turn the model into a probability, pick a decision threshold, and judge whether it was done properly

**Prerequisites:** Lessons 1 to 6 (you can fit a line with `lm()`, read its coefficient table, and you know a probability is a number between 0 and 1). Every new term is defined as it appears.

::widget logistic-curve {}

=== step === concept
::eyebrow The new question
## The outcome is now yes or no

For six lessons the thing on the left of the `~` was a *count*: cups sold, a number that could be 48 or 63 or 71. Now it is a *label*: `soldout` is 1 on days Priya ran out and 0 on days she had cups left over. There is no in-between. You cannot sell out 0.6 of the way.

A fresh R session starts empty, so we build four weeks and a bit of her trading right here. Each row is one day: its high temperature, whether it was a weekend, and whether she sold out.

```r
set.seed(7)
n <- 60
temp    <- round(runif(n, 16, 34), 1)          # each day's high, in Celsius
weekend <- rbinom(n, 1, 2/7)                    # 1 on Saturdays and Sundays
# nature's hidden rule: hotter days (and weekends) are likelier to sell out
lp      <- -14 + 0.5 * temp + 1.2 * weekend     # the true log-odds, which we never see
soldout <- rbinom(n, 1, 1 / (1 + exp(-lp)))     # 1 = sold out, 0 = cups left over
coffee  <- data.frame(temp, weekend, soldout)
table(coffee$soldout)
#> 
#>  0  1 
#> 36 24
```

Twenty-four sell-out days, thirty-six with cups to spare. Our whole job is to turn a day's temperature into the *probability* of that `1`. The rule that generated the data is hidden inside `lp` (do not worry about it yet; that expression is precisely what the lesson will teach you to read). What matters now is the shape of the target: a column of 0s and 1s, nothing else.

=== step === concept
::eyebrow The tempting mistake
## Why you can't just fit a line

The obvious move is the tool you already own: fit a straight line with `lm()`, treating `soldout` as if it were a number. Watch what it does at the cold end of the range.

```r
straight <- lm(soldout ~ temp, data = coffee)
round(coef(straight), 3)
#> (Intercept)        temp 
#>      -1.178       0.062 
round(predict(straight, data.frame(temp = c(16, 18, 33, 34))), 3)
#>      1      2      3      4 
#> -0.179 -0.054  0.883  0.946
```

Read the first prediction and stop. For a 16-degree day the line forecasts a probability of **-0.179**. A negative probability is not just unlikely, it is *meaningless*: a probability lives between 0 and 1 and cannot leave that box. But a straight line has no floor and no ceiling. Push the temperature low enough and it dives below 0; push it high enough and it climbs past 1. The scatter makes the mismatch obvious: the data sit in two flat rows at 0 and 1, and no single straight line can hug both while staying inside the box between them.

::widget chart-plotter {"data":[{"x":33.8,"y":1},{"x":23.2,"y":0},{"x":18.1,"y":0},{"x":17.3,"y":0},{"x":20.4,"y":0},{"x":30.3,"y":1},{"x":22.1,"y":0},{"x":33.5,"y":1},{"x":19,"y":0},{"x":24.3,"y":0},{"x":19.1,"y":0},{"x":20.2,"y":0},{"x":29.9,"y":1},{"x":17.7,"y":0},{"x":24.2,"y":1},{"x":17.5,"y":0},{"x":26.1,"y":1},{"x":16.2,"y":0},{"x":33.7,"y":1},{"x":21.7,"y":0},{"x":27.5,"y":1},{"x":21.3,"y":0},{"x":33.9,"y":1},{"x":32.3,"y":1},{"x":33.8,"y":1},{"x":17.2,"y":0},{"x":27.3,"y":0},{"x":24.8,"y":1},{"x":33.5,"y":1},{"x":22.5,"y":1},{"x":28.2,"y":1},{"x":20.7,"y":0},{"x":19.3,"y":0},{"x":19.3,"y":0},{"x":22.8,"y":0},{"x":31.2,"y":1},{"x":25,"y":0},{"x":30.2,"y":0},{"x":31.1,"y":0},{"x":24.2,"y":0},{"x":30.4,"y":1},{"x":22.9,"y":0},{"x":29.7,"y":1},{"x":23.9,"y":0},{"x":32.3,"y":1},{"x":21.8,"y":0},{"x":17.5,"y":0},{"x":30.7,"y":0},{"x":32.2,"y":1},{"x":33.4,"y":1},{"x":26.3,"y":0},{"x":29,"y":0},{"x":29.9,"y":1},{"x":27.3,"y":0},{"x":29,"y":1},{"x":23,"y":0},{"x":18.9,"y":0},{"x":19.4,"y":0},{"x":23,"y":0},{"x":20.9,"y":1}],"geoms":["point"],"x":"temp","y":"sold_out"}

[WARNING]
There are two separate problems with fitting `lm()` to a 0/1 outcome. The visible one is impossible predictions (below 0, above 1). The quieter one is that a yes/no outcome cannot possibly have the constant-variance, bell-shaped errors that `lm()` assumes, so its standard errors and p-values are untrustworthy even where the predictions happen to land inside the box. We need a model built for probabilities from the start.

=== step === quiz
::eyebrow Check yourself
## What actually broke?

Priya's `lm()` predicted -0.179 for a cold day. A friend shrugs: "A negative number just means very unlikely, round it up to 0 and the model is fine." Is the friend right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: -0.179 just means "very unlikely", so clip it to 0 and move on ::no Clipping hides the symptom, not the disease. A probability can never be negative or above 1, yet a straight line marches past both bounds without limit, so it will keep producing impossible values for any cold-enough or hot-enough day. And a 0/1 outcome cannot have the equal-variance, bell-shaped errors `lm()` assumes, so its standard errors are wrong too. The tool is a poor fit, not the display.
- No: a straight line has no floor or ceiling, so it predicts impossible probabilities, and a yes/no outcome also breaks the equal-variance error assumption `lm()` relies on ::ok Exactly. Both problems are baked into using a line for a bounded, binary outcome. That is why we switch to a model designed to output a probability between 0 and 1.
- No: the temperature signal is simply too weak for any model to fit ::no The signal is strong, hot days really do sell out. The trouble is the shape of the model (an unbounded line for a bounded outcome), not the strength of the relationship.

=== step === concept
::eyebrow The key trick
## Odds, and the log-odds

Here is the idea that rescues everything. We cannot let a line loose on a probability, because a probability is trapped between 0 and 1 and a line is not. So instead of modeling the probability directly, we first *stretch* it onto a scale that runs the whole number line, model that with a line, and stretch back at the end. The stretching happens in two steps.

**Step one: odds.** The **odds** of selling out is the probability it happens divided by the probability it does not:

\[ \text{odds} = \frac{p}{1-p} \]

where \(p\) is the probability of selling out. This is the language of betting. If \(p = 0.75\), the odds are \(0.75 / 0.25 = 3\): three sell-out days for every one quiet day, "3 to 1 on". Odds fix the ceiling problem: as \(p\) climbs toward 1 the odds shoot off toward infinity. But odds still cannot go below 0.

**Step two: the log-odds, or logit.** Take the natural logarithm of the odds:

\[ \operatorname{logit}(p) = \log\frac{p}{1-p} \]

The log is the final stretch. A log turns a number between 0 and 1 into a *negative* number, and a number above 1 into a positive one, so the log-odds runs all the way from minus infinity to plus infinity. See the two transformations on five example probabilities:

```r
p <- c(0.05, 0.25, 0.5, 0.75, 0.95)            # five example probabilities
data.frame(p, odds = round(p / (1 - p), 2), log_odds = round(log(p / (1 - p)), 2))
#>      p  odds log_odds
#> 1 0.05  0.05    -2.94
#> 2 0.25  0.33    -1.10
#> 3 0.50  1.00     0.00
#> 4 0.75  3.00     1.10
#> 5 0.95 19.00     2.94
```

Notice the symmetry. A fifty-fifty day (\(p = 0.5\)) has odds of exactly 1 and log-odds of exactly 0, the natural centre. Probabilities below a half give negative log-odds, above a half give positive, and the scale has no top and no bottom. That unbounded log-odds is the thing we are finally allowed to fit a straight line to.

=== step === quiz
::eyebrow Check yourself
## Odds are not probability

On a warm afternoon the model reports the odds of selling out as 3. Priya's new hire writes "probability = 3" on the whiteboard. What is the actual probability of selling out?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- 3, or 300 percent: the odds are the probability ::no A probability can never exceed 1, so 3 cannot be one. Odds and probability are different scales: odds are the ratio \(p/(1-p)\), running from 0 to infinity, while probability runs from 0 to 1.
- 0.75: odds of 3 mean three sell-out days for every one quiet day, so p = 3 / (3 + 1) ::ok Right. To convert odds back to a probability, use \(p = \text{odds}/(1+\text{odds}) = 3/4 = 0.75\). Three-to-one on is a 75 percent chance.
- 0.3: just shift the decimal point on the odds ::no There is no shift-the-decimal rule. Convert odds to probability with \(p = \text{odds}/(1+\text{odds})\), which gives \(3/4 = 0.75\), not 0.3.

=== step === concept
::eyebrow The S-curve
## The logistic function turns a line back into a probability

Now we can state logistic regression in one line. We fit a straight line to the **log-odds** of selling out:

\[ \log\frac{p}{1-p} = \eta, \qquad \eta = \beta_0 + \beta_1 x \]

Here \(\eta\) (the Greek letter eta) is the log-odds, \(x\) is the day's temperature, \(\beta_0\) is the intercept and \(\beta_1\) is the slope, exactly the two numbers `lm()` gives you, except now they live on the log-odds scale instead of the cups scale.

That equation predicts a log-odds, but Priya wants a probability. So we run \(\eta\) back through the inverse of the logit, the **logistic function** (also called the sigmoid):

\[ p = \frac{1}{1 + e^{-\eta}} \]

This is the S-curve on the cover, and it is doing one job: taking any number the line produces, from a very negative \(\eta\) to a very positive one, and gently squashing it into the interval between 0 and 1. A huge negative \(\eta\) gives \(p\) near 0; \(\eta = 0\) gives exactly \(p = 0.5\); a huge positive \(\eta\) gives \(p\) near 1. The bound can never be broken, because the sigmoid physically cannot output a number outside 0 to 1. Drag the threshold on the curve below and watch how a smooth probability, not a straight line, tracks the data.

::widget logistic-curve {}

=== step === tryit
::eyebrow In R
## Fit it with glm()

You do not fit this by least squares. R has a dedicated function, `glm()` (generalized linear model), which fits by **maximum likelihood**: it searches for the coefficients that make the exact pattern of 0s and 1s Priya actually observed as probable as possible. One argument switches `glm()` from ordinary regression into logistic regression: `family = binomial`. "Binomial" is the distribution of a yes/no outcome, so it tells `glm()` to expect 0s and 1s and to fit on the log-odds scale. Fill in the blank.

```r
fit <- glm(soldout ~ temp, data = coffee, family = ____)
round(coef(fit), 3)
```
::check {"regex":"binomial","gate":true,"difficulty":"intermediate","ok":"That is it. family = binomial is the single switch that makes glm() fit a logistic regression: a straight line on the log-odds scale, squashed through the sigmoid into a probability.","no":"Set family = binomial. That one argument is what turns glm() from ordinary least squares into logistic regression for a 0/1 outcome."}
::solution
```r
fit <- glm(soldout ~ temp, data = coffee, family = binomial)
round(coef(fit), 3)
#> (Intercept)        temp 
#>     -10.642       0.392
```

=== step === concept
::eyebrow Reading the output
## What the coefficient table says

`summary()` gives the same shape of table you have read since Lesson 1, an estimate, a standard error, and a test for each coefficient. The only change is the scale.

```r
round(summary(fit)$coef, 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -10.642      2.471  -4.306        0
#> temp           0.392      0.091   4.282        0
```

The `temp` estimate is **0.392**. Read it exactly as you would a linear slope, but on the log-odds scale: **each extra degree adds 0.392 to the log-odds** of selling out. The sign is what you check first, and it is positive, so hotter days really do raise the chance of selling out, just as the scatter promised.

The test column is labelled `z value` and `Pr(>|z|)` rather than `t value` and `Pr(>|t|)`, because logistic regression uses a normal (z) approximation instead of the t distribution, but you read it the same way: a z of 4.28 with a p-value of essentially 0 says this slope is very unlikely to be a fluke of these 60 days. The temperature effect is real. What the 0.392 is *worth* in plain language is the next step.

=== step === concept
::eyebrow Making it readable
## Odds ratios: exponentiate the coefficient

A change of "0.392 in log-odds per degree" means nothing to Priya. To make it speak, undo the logarithm: raise \(e\) to the coefficient. Because the log-odds is a *log* of the odds, exponentiating a slope turns an *addition* on the log-odds scale into a *multiplication* on the odds scale. That multiplier, \(e^{\beta_1}\), is called the **odds ratio**.

```r
round(exp(coef(fit)), 3)
#> (Intercept)        temp 
#>       0.000       1.479
```

The odds ratio for `temp` is **1.479**. Read it as: *each extra degree multiplies the odds of selling out by about 1.48*, a 48 percent increase in the odds per degree. Ten degrees warmer is not ten times 48 percent; it is 1.48 multiplied by itself ten times (\(1.48^{10} \approx 50\)), because the effect compounds on the odds scale. That single number, "warmer by a degree, roughly one-and-a-half times the odds", is how a logistic model is reported in practice.

[NOTE]
Ignore the intercept's odds ratio of 0.000 here. The intercept is the log-odds at `temp = 0`, a zero-degree day far below any temperature in Priya's data, so exponentiating it just gives the (astronomically small) odds of selling out in the freezing cold. It is a mathematical anchor for the line, not a number to interpret on its own.

=== step === tryit
::eyebrow In R
## Turn the model into a probability

The coefficients live on the log-odds scale, so to get a probability you push the log-odds back through the sigmoid. `plogis()` is R's name for that logistic function \(1/(1+e^{-\eta})\). Here is the whole round trip by hand for a 30-degree day:

```r
b <- unname(coef(fit))                 # b[1] = intercept, b[2] = the temp slope
round(b[1] + b[2] * 30, 3)             # the log-odds for a 30-degree day
#> [1] 1.107
round(plogis(b[1] + b[2] * 30), 3)     # the same thing as a probability
#> [1] 0.752
```

A 30-degree day has a log-odds of 1.107, which the sigmoid turns into a **0.752** chance of selling out. You will not do this by hand in practice; `predict()` does it for a whole table of new days at once, *if* you ask for the probability rather than the default log-odds. Fill in the `type` so it returns probabilities.

```r
newday <- data.frame(temp = c(20, 28, 34))
round(predict(fit, newday, type = ____), 3)
```
::check {"regex":"[\"']response[\"']","gate":true,"difficulty":"intermediate","ok":"Right. type = response runs the log-odds through the sigmoid and returns probabilities: 0.057 on a 20-degree day, 0.580 at 28, 0.935 at 34. The default (type = link) would hand back the raw log-odds instead.","no":"Use type = \"response\". Without it, predict() returns the log-odds (the linear predictor); \"response\" applies the sigmoid so you get a probability between 0 and 1."}
::solution
```r
newday <- data.frame(temp = c(20, 28, 34))
round(predict(fit, newday, type = "response"), 3)
#>     1     2     3 
#> 0.057 0.580 0.935
```

=== step === widget
::eyebrow Probability to decision
## Choosing a threshold

The model outputs a probability, but Priya's actual decision is binary: brew an extra batch, or don't. To get from a probability to a yes/no call you pick a **threshold** and predict "sold out" whenever the probability clears it. The default is 0.5, but 0.5 is a choice, not a law. Every threshold produces a **confusion matrix**, a 2 by 2 count of how the predictions line up against what really happened.

```r
prob <- predict(fit, type = "response")    # a fitted probability for each of the 60 days
table(prediction = ifelse(prob >= 0.5, "sold out", "cups left"),
      actual     = coffee$soldout)
#>            actual
#> prediction   0  1
#>   cups left 30  5
#>   sold out   6 19
```

At 0.5 the model misses **5** real sell-out days (it said "cups left" when she actually sold out, the **false negatives**) and cries wolf on **6** quiet days (**false positives**). Lower the bar to 0.3 and it flags more days as "sold out":

```r
table(prediction = ifelse(prob >= 0.3, "sold out", "cups left"),
      actual     = coffee$soldout)
#>            actual
#> prediction   0  1
#>   cups left 29  4
#>   sold out   7 20
```

The false negatives drop from 5 to 4, but the false positives rise from 6 to 7. That is the whole trade: a lower threshold catches more real sell-outs at the price of more false alarms. Which way Priya leans depends on her costs, not on statistics: a wasted batch is cheap, a sold-out disappointed queue is not, so she might well set the bar below 0.5. Drag the threshold below and watch the false positives and false negatives trade off against each other.

::widget logistic-curve {}

[NOTE]
The full picture of "the model at every threshold at once" is the ROC curve, and the single number that summarizes it is the AUC. Those belong to reading a *classifier*, which you study in the Classification track; here the point is narrower and important: the fitted probability is fixed by the model, but the yes/no decision is a separate dial you set by hand.

=== step === quiz
::eyebrow Check yourself
## Which way does the threshold move?

Priya lowers her decision threshold from 0.5 to 0.3 so she is quicker to brew a backup batch. What happens to the **false negatives**, the sell-out days her model fails to flag?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Fewer false negatives: a lower bar flags more days as "sold out", so the model misses fewer real sell-out days, at the cost of more false alarms ::ok Exactly. Lowering the threshold makes the model quicker to shout "sold out", so more genuine sell-out days get caught (fewer false negatives) while more quiet days get flagged by mistake (more false positives).
- More false negatives: a lower threshold is stricter, so it flags fewer days ::no A lower threshold is more lenient, not stricter: it takes less probability to trigger a "sold out" call, so more days get flagged and fewer real sell-outs slip through. False negatives go down, not up.
- Nothing changes: the threshold only affects the fitted probabilities, not the predictions ::no The fitted probabilities are fixed by the model. The threshold is precisely the dial that turns those probabilities into yes/no predictions, so moving it changes every count in the confusion matrix.

=== step === concept
::eyebrow Done properly
## Is the coefficient even real?

"Done properly" is the difference between fitting a model and trusting one. The commonest mistake is to read a big odds ratio as a big discovery. Add `weekend` to the model and see the trap.

```r
fit2 <- glm(soldout ~ temp + weekend, data = coffee, family = binomial)
round(summary(fit2)$coef, 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -10.983      2.562  -4.287    0.000
#> temp           0.399      0.093   4.291    0.000
#> weekend        0.591      0.879   0.672    0.501
round(exp(coef(fit2)), 3)
#> (Intercept)        temp     weekend 
#>       0.000       1.490       1.806
```

The `weekend` odds ratio is **1.806**: on this reading a weekend nearly *doubles* the odds of selling out. It is tempting to announce that weekends drive sales. But look one column over: its p-value is **0.501**. With only a handful of weekend days in 60, the estimate is so uncertain that the data cannot tell this "doubling" apart from no effect at all. The size of an odds ratio is a claim; the p-value is the evidence for it, and here the evidence is absent. A coefficient is only real when both agree.

Three more checks separate a proper logistic model from a careless one:

- **The line is linear on the log-odds, not on the probability.** The straight-line assumption still applies, just one scale up. If temperature's effect bends (say it barely matters until a heat threshold, then jumps), a single `temp` slope will miss it, exactly as a straight line misses a curve in ordinary regression.
- **Watch for perfect separation.** If some temperature split the days perfectly (every hot day sold out, every cool day did not), the maximum-likelihood fit tries to push a coefficient to infinity and the estimates and standard errors blow up. R warns about "fitted probabilities numerically 0 or 1"; treat it as a red flag, not a triumph.
- **A probability is calibrated uncertainty, not a verdict.** A predicted 0.75 means she should sell out on about three of every four such days, not that she *will* sell out. Model deviance (`fit$deviance`, the logistic stand-in for residual sum of squares) and AIC (a model-fit score that rewards a good fit but penalizes each extra predictor) let you compare models on how well those probabilities fit, without ever pretending a probability is a certainty.

=== step === quiz
::eyebrow Check yourself
## A big ratio, weak evidence

The two-predictor model gives `weekend` an odds ratio of 1.81 (weekends nearly double the odds of selling out) but a p-value of 0.50. Should Priya conclude that weekends drive her sell-outs?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: an odds ratio of 1.81 is a large effect, so weekends clearly matter ::no Effect size and evidence are two different things. The 1.81 is this sample's best guess, but its p-value of 0.50 and wide standard error say the true effect could easily be nothing. With so few weekend days, the estimate is mostly noise; a large ratio built on weak evidence is not a finding.
- No: a p-value of 0.50 means the data cannot tell this odds ratio apart from 1 (no effect), so the apparent weekend boost may well be noise ::ok Exactly. "Done properly" means reading the ratio and its evidence together. A large odds ratio with a p-value of 0.50 is a shrug, not a discovery; she would need far more weekend data before trusting it.
- No, because any odds ratio above 1 always means the predictor has no effect ::no An odds ratio above 1 points to a positive effect, not "no effect". The reason to hold off is the weak evidence (p = 0.50), not the direction of the ratio.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take logistic regression further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - section 4.3 builds logistic regression from the odds and the logit exactly as we did here, with the same `glm()` output.
- [The Elements of Statistical Learning, ch. 4 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the rigorous treatment: maximum likelihood, the logit link, and how logistic regression sits inside the wider GLM family you meet next.
- [Logistic Regression in R (UCLA OARC)](https://stats.oarc.ucla.edu/r/dae/logit-regression/) - a worked, copy-and-run R walkthrough of fitting `glm()`, reading coefficients, and turning them into odds ratios and predicted probabilities.
- [R documentation: glm()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - the reference for the exact function you used, including every `family` and link option, the doorway to Lesson 8.

=== step === complete
## Lesson 7 complete

You can now model a yes-or-no outcome the right way. The chain is worth holding in one piece: a straight line cannot stay inside 0 and 1, so logistic regression models the **log-odds** with a line, \(\log\frac{p}{1-p} = \beta_0 + \beta_1 x\); the **logistic (sigmoid)** function squashes that line back into a probability; `glm(family = binomial)` fits it; **exponentiating** a coefficient turns it into an **odds ratio** you can say out loud; `predict(type = "response")` returns probabilities; a **threshold** turns those probabilities into decisions; and "properly" means weighing an effect's size against its evidence, not reading a big odds ratio as proof.

Next, Lesson 8: GLMs Beyond Logistic. Logistic regression is one member of a whole family. Swap the yes/no outcome for a *count* (how many cups) or a *skewed positive amount* (how much revenue) and the same recipe, a link function plus a matching distribution, gives you Poisson and Gamma regression. Once you see logistic as a special case, the rest of the family falls into place.

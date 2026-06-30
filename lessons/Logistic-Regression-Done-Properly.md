---
title: "Regression Modeling Lesson 7: Logistic Regression Done Properly"
catalog_blurb: "Model a yes-or-no outcome as a probability and read what drives it."
description: "Model a yes/no outcome in R with logistic regression: the logit link and S-curve, fit glm(), read odds ratios, predict probabilities, and pick a threshold."
keywords: "logistic regression, glm binomial, logit link, odds ratio, log-odds, sigmoid, predict probability, classification threshold, confusion matrix, logistic regression in R"
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

In Lesson 6 you put honest error bars on a regression's two jobs, explaining and predicting. But every model in this course so far has predicted a *number*: how many cups Priya sells. Now she has a question that is not a number at all.

A customer walks up to the cart. **Will this one person buy an iced coffee, yes or no?** The answer is not 30 or 49, it is a probability between 0 and 1, and that probability climbs with the temperature, near zero on a freezing morning, near certainty in a heatwave. A straight line is the wrong tool for that S-shaped story. Logistic regression is the right one.

By the end of this lesson you will be able to:

- Explain why a straight line cannot model a yes/no probability, and how the logit link fixes it
- Fit a logistic regression with `glm()` and read its coefficients as odds ratios
- Turn the model into predicted probabilities, then pick a threshold to make a decision, and know where it breaks

**Prerequisites:** Lessons 1 to 6 (you can fit a line with `lm()` and read its coefficients, standard errors and p-values). You can run R. Every new term, odds, log-odds, logit, odds ratio, threshold, is defined as it appears.

::widget logistic-curve {}

The curve above is the whole lesson in one picture: a probability that bends smoothly from 0 to 1, with a cutoff you can slide. By the end you will know exactly where it comes from and how to read it.

=== step === concept
::eyebrow The problem
## Why a straight line can't model a yes/no

Priya logs a stretch of single customers: the day's temperature and whether that person bought. The outcome is coded 1 for "bought" and 0 for "did not." Plotted against temperature, every point sits on one of two rails, the bottom (0) or the top (1), with cold days mostly on the floor and hot days mostly on the ceiling.

::widget chart-plotter {"data":[{"x":6,"y":0},{"x":8,"y":0},{"x":11,"y":0},{"x":13,"y":0},{"x":15,"y":1},{"x":17,"y":0},{"x":19,"y":1},{"x":21,"y":0},{"x":23,"y":1},{"x":25,"y":1},{"x":27,"y":1},{"x":29,"y":1},{"x":31,"y":1},{"x":33,"y":1}],"geoms":["point"],"x":"temp","y":"bought"}

Now imagine fitting an ordinary least-squares line through those rails, the kind from Lesson 1. It would slope up, which feels right, but it cannot stop at the rails. Extended to a frosty 2 degrees it predicts a *negative* probability of buying; pushed to a blazing 40 it predicts a probability above 1. Both are nonsense: a probability has to live between 0 and 1, and a line does not know that.

[KEY INSIGHT]
The target is a probability, which is trapped between 0 and 1. A straight line is unbounded, so it will always eventually predict impossible probabilities. We need a model whose output is squeezed into [0, 1] by construction.

=== step === concept
::eyebrow The fix
## Odds, log-odds, and the logit link

The trick is to not model the probability directly. We bend it through two steps first, so that a straight line can do its work on a scale that has no ceiling.

**Step one: odds.** Gamblers never say "70% chance," they say "7 to 3." That is the **odds**: the chance it happens divided by the chance it does not,

\[ \text{odds} = \frac{p}{1-p} \]

where \(p\) is the probability of the "yes" outcome (buying). At \(p = 0.5\) the odds are 1 (even money); as \(p\) climbs toward 1 the odds shoot off to infinity; as \(p\) falls toward 0 the odds sink toward 0. So odds live in \([0, \infty)\). We have removed the upper ceiling, but there is still a floor at 0.

**Step two: take the logarithm.** The natural log of the odds is called the **log-odds**, or the **logit**:

\[ \operatorname{logit}(p) = \ln\!\left(\frac{p}{1-p}\right) \]

where \(\ln\) is the natural logarithm. The log stretches \([0, \infty)\) across the *entire* number line \((-\infty, \infty)\): a tiny probability gives a large negative log-odds, \(p = 0.5\) gives 0, a near-certain probability gives a large positive one. Now there is no ceiling and no floor, so a straight line can finally fit without breaking any rules. That is exactly what logistic regression does:

\[ \ln\!\left(\frac{p}{1-p}\right) = \beta_0 + \beta_1\,\text{temp} + \beta_2\,\text{member} \]

Here \(\beta_0\) is the intercept (the log-odds when every predictor is 0), and \(\beta_1, \beta_2\) are the slopes, the change in log-odds per unit of each predictor. To turn that linear part back into a probability, invert the two steps. Solving for \(p\) gives the **sigmoid** (the S-curve):

\[ p = \frac{1}{1 + e^{-(\beta_0 + \beta_1\,\text{temp} + \beta_2\,\text{member})}} \]

where \(e\) is Euler's number (about 2.718). No matter how large or how negative the linear part gets, this curve is mathematically pinned between 0 and 1. That is the "logistic" in logistic regression. Drag the slider below to feel the S-curve in action.

::widget logistic-curve {}

=== step === concept
::eyebrow In R
## Fit it with glm() and read the table

A fresh R session starts empty, so we build Priya's log of single visits first: 200 customers, each with the day's `temp`, whether they are a loyalty `member` (1) or not (0), and whether they `bought` (1) or not (0). Run this once.

```r
set.seed(1)
n <- 200
visits <- data.frame(
  temp   = round(runif(n, 5, 35), 1),     # the day's high temperature (deg C)
  member = rbinom(n, 1, 0.4)              # 1 = loyalty member, 0 = not
)
# the true buying probability rises with temp and for members; we draw a yes/no from it
visits$bought <- rbinom(n, 1, plogis(-6 + 0.25 * visits$temp + 0.9 * visits$member))
table(bought = visits$bought)
#> bought
#>   0   1
#> 105  95
```

Fitting is one call. It is `glm()` (generalized linear model), the sibling of `lm()`, with one extra argument: `family = binomial` tells R the outcome is a yes/no count, so it should fit on the logit scale instead of the straight-line scale.

```r
fit <- glm(bought ~ temp + member, data = visits, family = binomial)
round(coef(summary(fit)), 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -5.4457     0.7600 -7.1652    0e+00
#> temp          0.2280     0.0315  7.2314    0e+00
#> member        1.6429     0.4215  3.8981    1e-04
```

The table reads almost exactly like `lm()`'s, with one crucial difference: **the estimates are on the log-odds scale, not the cup scale.** The `temp` coefficient of 0.228 means each extra degree adds 0.228 to the log-odds of buying. That is real, the `z value` (the logistic cousin of the t-value) is 7.2 with a vanishingly small p-value, so temperature genuinely drives buying. But "adds 0.228 to the log-odds" is not something you can say out loud to Priya. The next step fixes that.

=== step === concept
::eyebrow Done properly
## Read the coefficients as odds ratios

Log-odds are the scale the math likes; odds ratios are the scale humans understand. Exponentiate a coefficient and it stops *adding* on the log scale and starts *multiplying* on the odds scale:

\[ e^{\beta_1} = \frac{\text{odds at } x+1}{\text{odds at } x} \]

So \(e^{\beta_1}\) is the **odds ratio**: the factor by which the odds of buying are multiplied for a one-unit rise in that predictor, holding the others fixed. Exponentiate the whole table, with its confidence interval, in one line.

```r
round(exp(cbind(OR = coef(fit), confint.default(fit))), 3)
#>                OR  2.5 % 97.5 %
#> (Intercept) 0.004  0.001  0.019
#> temp        1.256  1.181  1.336
#> member      5.170  2.263 11.810
```

Now it speaks plainly. Each extra degree multiplies the odds of buying by **1.256**, about a 26% rise in the odds per degree, and we are 95% confident that multiplier is between 1.18 and 1.34. A loyalty `member` has about **5.2 times** the odds of buying that a non-member has at the same temperature. Because the interval for each runs entirely above 1, both effects are clearly positive.

[WARNING]
An odds ratio multiplies the *odds*, not the *probability*. Doubling the odds does not double the probability: going from odds 1 to 2 lifts probability from 0.50 to 0.67, but going from odds 0.01 to 0.02 barely moves probability at all. Always translate back to a probability (next step) before you make a real decision.

=== step === quiz
::eyebrow Check yourself
## What does the member coefficient mean?

The fitted model reports a `member` coefficient of **1.643** on the log-odds scale (its exponential is about 5.2). A customer asks Priya what that means. Which statement is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Members are 1.643 times as likely to buy as non-members ::no That treats the raw log-odds coefficient as a ratio. The coefficient 1.643 is on the *log-odds* scale; you must exponentiate it before it becomes a ratio. The ratio is exp(1.643), about 5.2, and even that is a ratio of *odds*, not of probabilities.
- The probability of buying goes up by 1.643 for a member ::no A probability can never rise by 1.643, it cannot even exceed 1. Logistic coefficients are not added to a probability; they are added to the log-odds, then turned back into a probability through the S-curve.
- A member has about 5.2 times the odds of buying that a non-member has, at the same temperature ::ok Exactly. The odds ratio is exp(1.643) = 5.17. It multiplies the odds, holds temperature fixed, and is a statement about odds, which you would still convert to a probability for any single customer.

=== step === tryit
::eyebrow Your turn
## Predict probabilities for new customers

Priya wants the actual probability of a sale for four situations, not the log-odds. `predict()` defaults to the log-odds scale; you have to ask for `type = "response"` to get a probability back. Fill in the blank, then check it.

```r
new <- data.frame(temp = c(12, 25, 25, 32),
                  member = c(0, 0, 1, 1))
new$p_buy <- round(predict(fit, newdata = new, type = ____), 3)   # we want a probability
new
```
::check {"regex":"[\"']response[\"']","gate":true,"difficulty":"intermediate","ok":"Right. type = response returns probabilities: 0.062 on a cold non-member day, 0.563 for a non-member at 25 degrees, 0.870 for a member at 25, and 0.971 for a member on a hot day. Same model, finally on a scale Priya can act on.","no":"Ask for the probability scale: type = \"response\" (in quotes). The default, type = \"link\", returns the log-odds, which Priya cannot use directly."}
::solution
```r
new <- data.frame(temp = c(12, 25, 25, 32),
                  member = c(0, 0, 1, 1))
new$p_buy <- round(predict(fit, newdata = new, type = "response"), 3)
new
#>   temp member p_buy
#> 1   12      0 0.062
#> 2   25      0 0.563
#> 3   25      1 0.870
#> 4   32      1 0.971
```

=== step === widget
::eyebrow From probability to decision
## Pick a threshold, then read the confusion matrix

A probability is an answer to "how likely," but a decision needs a yes or a no. To get there you choose a **threshold**: predict "will buy" when the probability is at or above it, "will not" below. The obvious choice is 0.5, but it is just a dial, and where you set it changes who you get right and who you get wrong.

Slide the threshold below. Watch the **operating point** (where your current cutoff lands) travel along the **ROC curve**, the path traced by every possible cutoff, plotting the share of real buyers you catch against the share of non-buyers you wrongly flag, while the **confusion matrix** (the four-way tally of predicted-versus-actual) re-counts. Lower the cutoff and you catch more true buyers (fewer false negatives) at the cost of more false alarms (more false positives); raise it and the trade reverses.

::widget roc-curve {}

Here is that same tally for Priya's real fitted model at the default 0.5 cutoff, with its overall accuracy.

```r
p_hat <- predict(fit, type = "response")     # P(buy) for every visit in the data
pred  <- ifelse(p_hat >= 0.5, 1, 0)          # classify at the 0.5 cutoff
table(predicted = pred, actual = visits$bought)
#>          actual
#> predicted  0  1
#>         0 84 19
#>         1 21 76
mean(pred == visits$bought)                  # accuracy at this threshold
#> [1] 0.8
```

The model is right 80% of the time, but the 19 false negatives (real buyers it missed) and 21 false positives (no-shows it flagged) are not equally costly to Priya, and the threshold is the knob that balances them.

=== step === quiz
::eyebrow Check yourself
## Choosing the cutoff

Priya would rather slightly over-prepare than miss a real customer, so missing a true buyer (a false negative) costs her more than a false alarm. Starting from the default 0.5 cutoff, what should she do, and what is the side effect?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Lower the threshold below 0.5: she will catch more true buyers, but flag more non-buyers as well ::ok Exactly. A lower cutoff classifies more customers as "will buy," which raises the true-positive rate (fewer missed buyers) and unavoidably raises the false-positive rate too. That is the threshold trade, and it is the right call when a miss costs more than a false alarm.
- Raise the threshold above 0.5: a stricter cutoff is always the safer, more accurate choice ::no A higher cutoff predicts "will buy" less often, so it *increases* false negatives, exactly the error she most wants to avoid. Stricter is not universally safer; it depends on which mistake is costlier.
- Leave it at 0.5, because 0.5 is the statistically correct threshold for any logistic model ::no 0.5 is a default, not a law. The right threshold depends on the relative cost of the two errors. Logistic regression gives you a probability; the cutoff is a business decision layered on top.

=== step === concept
::eyebrow Done properly
## Where logistic regression breaks

Logistic regression is sturdy, but "done properly" means knowing its limits as well as its formulas.

- **It is linear on the logit, not on the probability.** A constant odds ratio per degree does not mean a constant change in probability per degree. Near the steep middle of the S-curve a degree moves the probability a lot; out at the flat tails it barely registers. Read effects as odds ratios, but make decisions from predicted probabilities.
- **Perfect separation blows it up.** If some predictor splits the classes flawlessly (say every customer above 30 degrees bought and every one below did not), the best-fit coefficients run to infinity and their standard errors explode. R will often warn that fitted probabilities of 0 or 1 occurred; that is the symptom, and penalized methods (such as Firth's correction, via the `logistf` package) are the fix.
- **A probability is calibrated uncertainty, not certainty.** A predicted 0.62 does not promise this customer buys; it says that across many identical-looking customers, about 62% do. Treat it as a bet with a known edge, never as a verdict.
- **Significance is not size, and neither is causation.** As in Lesson 6, a tiny p-value on a coefficient means the effect is *real*, not that it is *large* (read size from the odds ratio) and not that it is *causal* (that comes from how the data was gathered).

[KEY INSIGHT]
Done properly, logistic regression is four habits: model the log-odds, *report* coefficients as odds ratios, *decide* from predicted probabilities, and choose the threshold from the cost of each error, not from the number 0.5.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take logistic regression further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous treatment of logistic regression, the logit, and reading the coefficients.
- [The Elements of Statistical Learning, ch. 4 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full maximum-likelihood math behind how `glm` actually fits the model.
- [R documentation: glm()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - the function you used, with the meaning of the `family = binomial` argument.
- [UCLA OARC: Logit regression in R](https://stats.oarc.ucla.edu/r/dae/logit-regression/) - a careful worked example of fitting, then interpreting odds ratios and predicted probabilities.

=== step === complete
## Lesson 7 complete

You can now model a yes/no outcome the right way. A probability is trapped in [0, 1], so logistic regression models its **log-odds** as a straight line and bends the result back through the **S-curve**, keeping every prediction between 0 and 1. You fit it with `glm(..., family = binomial)`, *report* its coefficients as **odds ratios** (`exp(beta)`, a multiplier on the odds), *predict* with `type = "response"` to get probabilities Priya can act on, and turn those probabilities into decisions by choosing a **threshold** from the cost of each error rather than defaulting to 0.5. And you know where it breaks: separation, the logit-not-probability scale, and probability as calibrated uncertainty.

Next, Lesson 8: GLMs Beyond Logistic. Logistic regression is one member of a whole family. When the outcome is a *count* (how many complaints this week) or a *rate*, a different link and family fit better. You will meet Poisson and the wider generalized linear model, and learn to match the model to the response.

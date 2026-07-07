---
title: "Regression Modeling Lesson 6: Inference and Prediction in Regression"
catalog_blurb: "Whether an effect is real, and how far a single prediction can miss."
description: "Confidence intervals and t-tests for regression coefficients, confidence versus prediction intervals for a new day, and why explaining differs from predicting."
keywords: "confidence interval, prediction interval, regression inference, t-test coefficient, confint, predict lm, explain vs predict, standard error, R"
post_type: "LESSON"
curriculum_id: "6.20.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "6"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Logistic-Regression-Done-Properly.html"
course_prev: "Heteroskedasticity-and-Autocorrelation.html"
---

=== step === cover
::eyebrow Lesson 6 of 8
## Inference and Prediction in Regression

In Lesson 5 you learned to make a standard error honest even when the errors misbehave. Now you get to spend it. A trustworthy standard error is the raw material for the two questions every regression is really asked: *is this relationship real*, and *what will happen next*.

We come back to Priya's original iced-coffee cart from Lesson 1, the clean 12-day log where the line's assumptions hold, so the numbers `lm()` prints are trustworthy as they stand. On that honest fit you will answer both of Priya's questions with numbers, not hand-waving.

By the end of this lesson you will be able to:

- Wrap a coefficient in a confidence interval and run the t-test that asks whether it is really non-zero
- Predict a brand-new day two different ways: a confidence interval for the average, and a prediction interval for one specific day
- Explain why a prediction interval is always wider, and why explaining a relationship and predicting a value are two different jobs

**Prerequisites:** Lessons 1 to 5. You can fit a line with `lm()` and read its coefficients, standard errors and p-values. Every new term is defined as it appears.

::widget regression-intervals {}

=== step === concept
::eyebrow The framing
## Two jobs, two questions

A fitted line quietly does two jobs at once, and confusing them is the single most common regression mistake. Priya has one model, `lm(cups ~ temp)`, but two very different things she wants from it:

| Priya asks... | The job | The tool |
|---|---|---|
| Is warmer weather really driving my sales, and how sure can I be? | **Explain** the relationship | a test and a confidence interval on the slope |
| How many cups will tomorrow's forecast 25-degree day bring? | **Predict** a new value | a prediction interval for one new day |

The first question is about the *slope*: a number describing the whole relationship. The second is about a *single future day*: one dot that has not happened yet. They use different intervals, and mixing them up leads either to false confidence or to pointless caution.

[KEY INSIGHT]
Explaining asks "what is the true effect, and how precisely do we know it?" Predicting asks "what value will the next observation take, and how wide is that bet?" Both are built from one number you already have, the standard error. This lesson uses it twice.

=== step === concept
::eyebrow Set the stage
## Priya's 12 days, and the line

A fresh R session starts empty, so we rebuild Priya's original 12-day log and fit the line exactly as Lesson 1 did.

```r
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),  # each day's high, Celsius
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60))  # cups sold that day
fit <- lm(cups ~ temp, data = coffee)
round(summary(fit)$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.818      2.851   0.287     0.78
#> temp           1.944      0.119  16.336     0.00
```

Read the `temp` row, because it carries the whole story. The **Estimate**, 1.944, is the slope: each extra degree buys Priya about two more cups. Right beside it sits the **Std. Error**, 0.119, the give-or-take on that slope that you learned to trust in Lesson 5. The last two columns, the t-value and the p-value, are built entirely from those first two, and unpacking them is the first half of this lesson.

(The intercept, 0.818, is the predicted sales at 0 degrees, a temperature Priya never trades in, so we leave it be and focus on the slope.)

=== step === concept
::eyebrow Explain, part 1
## A confidence interval for the slope

Here is the key idea behind everything that follows. If Priya had worked a *different* 12 days, she would have logged slightly different points, and `lm()` would have returned a slightly different slope. The slope estimate \(\hat\beta_1\) is itself a random quantity, and its standard error \(\operatorname{SE}(\hat\beta_1)\) is the typical amount it wobbles from one sample to the next. R printed it: 0.119.

A single number like 1.944 hides that wobble. A **confidence interval** puts it back, by adding a margin on each side:

\[ \hat\beta_1 \;\pm\; t_{0.975,\;n-2}\;\operatorname{SE}(\hat\beta_1) \]

where \(\hat\beta_1\) is the estimated slope (1.944), \(\operatorname{SE}(\hat\beta_1)\) is its standard error (0.119), and \(t_{0.975,\;n-2}\) is a critical value from a t-distribution with \(n-2\) degrees of freedom. The \(n-2\) is the sample size minus the two numbers the line already spent estimating itself, its slope and its intercept. With \(n=12\) days, that is 10 degrees of freedom, and the critical value is \(t_{0.975,10}=2.228\). R hands you the whole interval with one function:

```r
round(confint(fit), 3)
#>              2.5 % 97.5 %
#> (Intercept) -5.535  7.171
#> temp         1.679  2.209
```

And it is exactly the formula above, done by hand:

```r
b  <- coef(fit)[["temp"]]                       # 1.944 (double bracket drops the name)
se <- summary(fit)$coef["temp", "Std. Error"]   # 0.119
round(b + c(-1, 1) * qt(0.975, df = 10) * se, 3)
#> [1] 1.679 2.209
```

[KEY INSIGHT]
We are 95% confident that the true cups-per-degree effect lies between **1.68 and 2.21**. Now notice what the interval does *not* contain: zero. A slope of zero would mean temperature does nothing to sales, and the data has ruled that out with room to spare.

=== step === quiz
::eyebrow Check yourself
## Reading the interval

Priya's 95% confidence interval for the slope is \([1.68,\ 2.21]\) cups per degree. Which reading is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- We are 95% confident that the true effect of temperature on sales lies between 1.68 and 2.21 cups per degree ::ok Exactly. The interval is a plausible range for the one unknown TRUE slope, built to capture it 95% of the time. Because it excludes zero, the effect is convincingly real.
- On 95% of Priya's days, sales rose by between 1.68 and 2.21 cups per degree ::no That describes the spread of the daily data, which is not what a confidence interval measures. The interval is about the single unknown slope of the true line, not about how individual days scatter.
- There is a 95% chance the slope R computed, 1.944, falls between 1.68 and 2.21 ::no The estimate 1.944 is a fixed number and always sits in the middle of its own interval; there is no chance involved. The uncertainty is about the unknown TRUE slope, which the interval is trying to pin down.

=== step === widget
::eyebrow Explain, part 2
## Is the effect real? Testing the slope

The confidence interval already hints at the answer, but the formal question is worth stating on its own: could the entire temperature-sales relationship be a fluke of 12 lucky days? The **hypothesis test** asks exactly that. It starts from a deliberately skeptical assumption, the null hypothesis:

\[ H_0:\ \beta_1 = 0 \qquad \text{(temperature has no effect on sales)} \]

and measures how far Priya's data departs from it, using the **t-statistic**:

\[ t = \frac{\hat\beta_1 - 0}{\operatorname{SE}(\hat\beta_1)} = \frac{1.944}{0.119} = 16.34 \]

Read \(t\) as a signal-to-noise ratio: the estimated effect divided by its own wobble. A big \(|t|\) means the slope sits many standard errors away from zero, so a true zero is hard to believe. The **p-value** turns that into a probability: the chance of seeing a \(t\) at least this extreme *if* \(H_0\) were true, which is the shaded tail area under the t-distribution with \(n-2=10\) degrees of freedom. That is precisely the `Pr(>|t|)` column R printed, and you can reproduce it from the t-value alone:

```r
2 * pt(-16.336, df = 10)   # both tails of the t-distribution, df = n - 2
#> [1] 1.536038e-08
```

Drag the observed t below and watch the tail area, the p-value, shrink as t grows. Priya's t of 16.3 sits far off the right edge of this chart, which is why her p-value is essentially zero.

::widget null-distribution {"tails":2,"start":2.05,"label":"observed t"}

[KEY INSIGHT]
A confidence interval and a test are two views of one fact: **the 95% interval excludes 0 exactly when p is below 0.05.** Priya's interval \([1.68, 2.21]\) misses zero by a mile, and her p-value (0.0000000154) is far below 0.05. Same verdict, reported two ways.

=== step === tryit
::eyebrow Your turn
## Get both intervals at once

Priya wants the 95% confidence intervals for *every* coefficient in her model, not just the slope. One function does the whole table. Fill in the blank.

```r
# 95% confidence intervals for every coefficient in the fitted model.
____(fit)
```
::check {"regex":"confint\\s*\\(","gate":true,"difficulty":"beginner","ok":"Right. confint(fit) returns the lower and upper 95% bounds for each coefficient, the same interval as b +/- t * SE, done for you.","no":"Use confint(fit). It reads the estimates and standard errors from the fit and returns each coefficient's 95% interval."}
::solution
```r
confint(fit)
```

=== step === quiz
::eyebrow Check yourself
## What a tiny p-value means

Priya's slope has a very small p-value, about 0.000000015. Her friend concludes that the temperature effect must therefore be huge. Is that right?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No. The tiny p-value says the effect is very unlikely to be zero, not that it is large. The SIZE of the effect is the slope itself, about 1.9 cups per degree; the p-value only measures how sure we are that it is not zero ::ok Exactly. Significance and size are separate questions. A tiny p can come from a small but very precisely measured effect; here the slope happens to be both clearly non-zero AND a healthy 1.9 cups per degree, but the p-value alone never tells you the magnitude.
- Yes. The smaller the p-value, the larger the effect, so a p of 0.000000015 signals a very large slope ::no A small p-value reflects how strongly the data rules out a zero slope, not how big the slope is. A huge sample can make a trivially small effect highly significant; magnitude and significance are different things.
- Yes. A tiny p-value proves temperature causes the sales, and a proven cause is by definition a large effect ::no A p-value speaks to whether an effect is distinguishable from zero, not to causation and not to size. Even granting the effect is real, its magnitude is the slope, read separately.

=== step === concept
::eyebrow Predict, the setup
## Predicting a brand-new day

So much for explaining. Now the other job. Tomorrow's forecast says 25 degrees, and Priya has to decide how many cups to load into the van tonight. The fitted line answers in a single step: plug the temperature into the equation.

\[ \hat y_0 = \hat\beta_0 + \hat\beta_1 x_0 = 0.818 + 1.944 \times 25 = 49.4 \]

where \(x_0 = 25\) is tomorrow's temperature and \(\hat y_0\) is the predicted cups. In R:

```r
predict(fit, newdata = data.frame(temp = 25))
#>        1 
#> 49.41088 
```

About 49 cups. But that is a single bare guess with no margin at all, and Priya cannot stock a van on a point. She actually has two different follow-up questions hiding inside "how many cups," and they have two genuinely different answers.

=== step === concept
::eyebrow Predict, question 1
## A confidence interval for the average

The first question is about the long run: *on average*, across all the 25-degree days Priya will ever work, how many cups does she sell? That is a question about the **mean response**, the true height of the line at 25 degrees. Our only uncertainty here is that we do not know the true line exactly; we estimated it from just 12 points. That uncertainty is modest, and it shrinks as data piles up.

\[ \hat y_0 \;\pm\; t_{0.975,\,n-2}\; s\sqrt{\tfrac{1}{n} + \tfrac{(x_0 - \bar x)^2}{S_{xx}}} \]

where \(s\) is the residual standard error (2.098, the typical size of a daily miss from Lesson 2), \(\bar x\) is the average temperature (23.4), and \(S_{xx} = \sum_i (x_i - \bar x)^2\) is the total spread of the temperatures. Ask R for it with `interval = "confidence"`:

```r
predict(fit, newdata = data.frame(temp = 25), interval = "confidence")
#>        fit      lwr      upr
#> 1 49.41088 47.99767 50.82409
```

The *average* 25-degree day brings between **48.0 and 50.8** cups, a tight band of give or take about 1.4 cups. If Priya opened a hundred stalls on hundred 25-degree days, their mean sales would land in this narrow range. But she is not opening a hundred stalls. She is opening one, tomorrow.

=== step === widget
::eyebrow Predict, question 2
## A prediction interval for one day

The second question is the one Priya actually has to answer: how many cups will she sell on *one specific* 25-degree day, tomorrow? This is a question about a single **new observation**, and it carries a second source of uncertainty the average did not. Even if we knew the true line perfectly, tomorrow still rolls its own dice: a passing tour group, a sudden shower, a slow Monday. That noise never averages away.

So the **prediction interval** adds one more term under the root. Set the two formulas side by side:

\[ \underbrace{\hat y_0 \pm t_{0.975,10}\, s\sqrt{\tfrac{1}{n} + \tfrac{(x_0-\bar x)^2}{S_{xx}}}}_{\text{average day (confidence)}} \qquad \underbrace{\hat y_0 \pm t_{0.975,10}\, s\sqrt{1 + \tfrac{1}{n} + \tfrac{(x_0-\bar x)^2}{S_{xx}}}}_{\text{one new day (prediction)}} \]

They are identical except for the lone \(1\) added inside the second root. That \(1\) is the new day's own variance \(s^2\), the irreducible noise no model can remove, and it dwarfs the rest. Ask R with `interval = "prediction"`:

```r
predict(fit, newdata = data.frame(temp = 25), interval = "prediction")
#>        fit      lwr      upr
#> 1 49.41088 44.52735 54.29441
```

A single 25-degree day could bring anywhere from **44.5 to 54.3** cups, about give or take 4.9, roughly three and a half times wider than the average band. *This* is the interval Priya stocks the van by. Slide the sample size below: the green confidence band collapses onto the line as data grows, but the orange prediction band barely moves, because it is floored by the noise, not the sample size.

::widget regression-intervals {}

=== step === concept
::eyebrow Where the width comes from
## Proving the two widths by hand

It is worth seeing that those two intervals are not magic; they come straight from the formulas. Build each standard error by hand and watch it match `predict` exactly.

```r
n    <- 12
s    <- summary(fit)$sigma            # residual standard error, 2.098
xbar <- mean(coffee$temp)             # 23.417
Sxx  <- sum((coffee$temp - xbar)^2)   # 310.92
x0   <- 25
se_mean <- s * sqrt(1/n + (x0 - xbar)^2 / Sxx)       # uncertainty about the LINE only
se_new  <- s * sqrt(1 + 1/n + (x0 - xbar)^2 / Sxx)   # + the new day's own noise
round(c(se_mean = se_mean, se_new = se_new), 3)
#>  se_mean   se_new 
#>    0.634    2.192 
```

The standard error for one new day (2.192) is more than three times the one for the average (0.634), and nearly all of that gap is the single \(1\) we added inside the root. Turn each into an interval with \(\hat y_0 \pm 2.228 \times \operatorname{SE}\), and you land back on the exact bounds `predict` reported: \([48.0, 50.8]\) for the average, \([44.5, 54.3]\) for one day. The formula and the function agree, because they are the same thing.

=== step === quiz
::eyebrow Check yourself
## Which interval, which decision?

Priya has to decide how much stock to bring for *tomorrow*, a single forecast 25-degree day. Which interval should she plan around?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The confidence interval for the mean, [48.0, 50.8], because it is the more precise, up-to-date estimate ::no That band describes the AVERAGE of many 25-degree days, not any single one. Stocking to it would leave Priya short on a busy day and over-stocked on a slow one; a single day swings far more than the average does.
- The prediction interval for a new day, [44.5, 54.3], because tomorrow is one specific day with its own noise ::ok Exactly. A single day carries the irreducible noise on top of the line's uncertainty, so the prediction interval is the honest range for one tomorrow. Plan for the wide band, not the narrow one.
- Neither; the point prediction of 49.4 is the single best number, so she should just bring 49 cups ::no A point estimate has no margin at all, so it is wrong almost every day by some amount. The whole reason for an interval is to plan for that spread; 49 is the center of the bet, not the bet itself.

=== step === tryit
::eyebrow Your turn
## Predict a hotter day

A heatwave is forecast: 30 degrees tomorrow. Priya wants the range a *single* new 30-degree day could land in. Complete the call with the interval type that accounts for one new day's own noise.

```r
# The range for ONE new 30-degree day (not the average).
predict(fit, newdata = data.frame(temp = 30), interval = ____)
```
::check {"regex":"prediction","gate":true,"difficulty":"intermediate","ok":"Right. interval = \"prediction\" gives the range for a single new day, here about [54.0, 64.3] cups, wide enough to plan stock by.","no":"Use interval = \"prediction\" (in quotes). That adds the new day's own noise; interval = \"confidence\" would give the much narrower band for the average."}
::solution
```r
predict(fit, newdata = data.frame(temp = 30), interval = "prediction")
```

=== step === concept
::eyebrow The two edges
## Extrapolation, and explaining versus predicting

Two cautions close the loop, both visible in the bands you have been sliding.

First, **both intervals are narrowest at the average temperature and flare out toward the edges** (the \((x_0 - \bar x)^2\) term in every formula). Push past the data entirely and the model is guessing. Priya's log runs 15 to 31 degrees; ask it about a 40-degree day it never saw:

```r
round(predict(fit, newdata = data.frame(temp = 40), interval = "prediction"), 2)
#>     fit   lwr   upr
#> 1 78.57 72.01 85.12
range(coffee$temp)   # the temperatures the model actually observed
#> [1] 15 31
```

R returns a confident-looking 78.6 cups, but 40 degrees is far beyond anything in the data. That number is arithmetic, not evidence; the interval's math cannot warn you that you have left the map. **Extrapolation** is where prediction quietly breaks.

Second, keep the two jobs distinct:

| | Explaining | Predicting |
|---|---|---|
| The question | Is the effect real, and how big? | What will one new value be? |
| The tool | slope test + confidence interval | prediction interval |
| Shrinks with more data? | yes, the estimate sharpens | no, floored by the noise |

[KEY INSIGHT]
A tight, wildly significant slope (great explaining) can still sit inside a wide prediction interval (humble predicting), because individual days are noisy no matter how well you know the line. And explaining a relationship is not the same as proving it causes anything: that needs the study design of a later course, not a smaller p-value. Know which job you are doing, and reach for the matching interval.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take regression inference and prediction further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the "Assessing the Accuracy of the Coefficient Estimates" section covers coefficient confidence intervals, the t-test, and the confidence-versus-prediction-interval distinction you used here.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/lesson/3) - free, worked lessons on inference for the slope and on confidence versus prediction intervals, with the same formulas.
- [predict.lm: R documentation for interval = "confidence" and "prediction"](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - the exact function you called, with what each interval means.
- [Shmueli (2010), "To Explain or to Predict?", Statistical Science 25(3)](https://doi.org/10.1214/10-STS330) - the canonical paper on why explaining and predicting are genuinely different modeling goals.

=== step === complete
## Lesson 6 complete

You put a trustworthy standard error to work in both directions. For **explaining**, you wrapped the slope in a confidence interval (\(\hat\beta_1 \pm t\,\operatorname{SE}\)) and ran the coefficient t-test (\(t = \hat\beta_1 / \operatorname{SE}\), with its p-value the tail area under the t-distribution), and saw that the interval excluding zero and the p-value below 0.05 are one verdict. For **predicting**, you learned the two intervals that answer two different questions at a new temperature: a narrow confidence interval for the average day, and a wider prediction interval for one specific day, wider by exactly the irreducible noise term that never averages away. And you saw both bands flare past the data, where prediction turns into extrapolation.

Next, Lesson 7: Logistic Regression, Done Properly. Every model so far predicted a *count* of cups, a number that can slide anywhere. But what if the outcome is a yes or no, did this customer buy or not? A straight line breaks on that question, and you will meet the S-shaped curve built to answer it.

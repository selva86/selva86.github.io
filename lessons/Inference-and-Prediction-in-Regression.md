---
title: "Regression Modeling Lesson 6: Inference and Prediction in Regression"
catalog_blurb: "Confidence vs prediction intervals, and whether a coefficient is real."
description: "Tell a confidence interval from a prediction interval, test whether a regression slope is real with its t-value and p-value, and see why explaining differs from predicting."
keywords: "confidence interval, prediction interval, regression inference, coefficient t-test, p-value, predict in R, explaining vs predicting, standard error of the slope, confint, lm prediction interval"
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

In Lesson 5 you learned to *trust* a standard error: when a regression's errors misbehave, you fix the standard error so it tells the truth. Now you will put that honest number to work, because it powers the two questions Priya actually cares about, and they are not the same question.

Priya's fitted line says each warmer degree buys about two more cups. But she needs to know two different things. First, the **explaining** question: is that effect *real*, or could a flat no-effect world produce a slope this big by luck, and how precisely do I know it? Second, the **predicting** question: tomorrow's forecast is 25 degrees, so how many cups will I *actually* sell, and how wide should my bet be? This lesson gives each question its own answer, and shows why mixing them up will leave Priya either out of stock or buried in melting ice.

By the end of this lesson you will be able to:

- Test whether a coefficient is real: state the null hypothesis, read its t-value and p-value, and read its confidence interval
- Build and read a confidence interval for the average and a prediction interval for a single new day, and explain why the second is always wider
- Pick the right interval for a real decision, and tell the job of explaining apart from the job of predicting

**Prerequisites:** Lessons 1 to 5 (you can fit a line with `lm()`, and read its coefficients, standard error and p-value). You can run R. Every new term is defined as it appears.

::widget regression-intervals {}

The tight inner band and the wide outer band above are the whole lesson in one picture. By the end you will know exactly what each one means and when to use it.

=== step === concept
::eyebrow The two jobs
## The two jobs: explaining and predicting

A regression quietly does two different jobs, and a point estimate hides both behind a single number. Priya's slope of "about 2 cups per degree" is one such number; her prediction of "about 49 cups tomorrow" is another. Each is the *center* of an answer, with no sense of how sure it is. The rest of this lesson is about putting honest error bars on each one.

A fresh R session starts empty, so we rebuild Priya's clean 12-day log (the one from Lessons 1 to 4, where the line's assumptions hold) and fit the line again.

```r
# Priya's log: the day's high temperature (deg C) and iced coffees sold.
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60)
)
fit <- lm(cups ~ temp, data = coffee)
round(coef(fit), 3)
#> (Intercept)        temp
#>       0.818       1.944
```

There is the line: predicted cups equal \(0.818 + 1.944 \cdot \text{temp}\). The scatter below is the single object both jobs work on. **Explaining** asks about the *slope* of that line (the relationship): how steep, how certain, is it real. **Predicting** asks about a *point on or near* that line (a future value): where will the next day land, and how far off could it be. Same line, two completely different questions.

::widget chart-plotter {"data":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}],"geoms":["point"],"x":"temp","y":"cups"}

=== step === concept
::eyebrow The explaining job
## Is the slope real? Testing a coefficient

Priya measured 1.944 cups per degree. But she measured it on *one* particular run of 12 days. Hand her a different 12 days from the same cart and the slope would come back a little different, maybe 1.8, maybe 2.1. The slope is an estimate, and estimates wobble from sample to sample. Inference is the discipline of asking: given that wobble, is the slope I see real evidence of an effect, or could pure noise have produced it?

We measure the wobble with the **standard error** of the slope, \(\operatorname{SE}(\hat\beta_1)\): the typical sample-to-sample spread of the slope estimate \(\hat\beta_1\) (the little hat means "estimated from data"). The formal test sets up a sceptic's world, the **null hypothesis**, written

\[ H_0: \beta_1 = 0 \]

read as "the *true* slope \(\beta_1\) is zero, temperature has no effect on cups at all." Then it asks how many standard errors our estimate sits away from that zero. That ratio is the **t-statistic**:

\[ t = \frac{\hat\beta_1}{\operatorname{SE}(\hat\beta_1)} \]

A big \(|t|\) means the estimate is many standard errors clear of zero, which would be a freak accident if the true slope really were zero. The **p-value** is exactly that freak-accident probability: the chance of seeing a slope at least this far from zero *if* \(H_0\) were true. Small p, strong evidence against "no effect." Drag the observed t below and watch its tail area (the p-value) shrink as t grows.

::widget null-distribution {"tails":2,"max":5,"start":2,"label":"observed t"}

R computes all of this for you in the coefficient table. Each row gets its estimate, its standard error, its t-value and its p-value.

```r
round(summary(fit)$coef, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.818      2.851   0.287    0.780
#> temp           1.944      0.119  16.336    0.000
```

Look at the `temp` row. The slope is 16.3 standard errors away from zero (t = 16.336), so far out it is literally off the right edge of the widget above, and its p-value is 0.000 (really \(1.5 \times 10^{-8}\)). A no-effect world would essentially never produce a slope this strong, so we reject \(H_0\): temperature genuinely drives sales. (The intercept row tells the opposite story, t = 0.29, p = 0.78, but recall from Lesson 1 the intercept is cups at 0 degrees, an extrapolation with no real meaning here.)

How *precise* is that slope? Turn the test around into a range. The **confidence interval** for the slope is the estimate give-or-take a margin of standard errors:

\[ \hat\beta_1 \pm t^{*}\,\operatorname{SE}(\hat\beta_1) \]

where \(t^{*}\) is the critical value from the t-distribution with \(n - 2\) degrees of freedom (here \(t^{*} = 2.23\) for 95% confidence on 10 degrees of freedom). `confint()` does it directly.

```r
round(confint(fit), 3)
#>               2.5 %  97.5 %
#> (Intercept) -5.535   7.171
#> temp         1.679   2.209
```

We are 95% confident the true slope lies between **1.68 and 2.21** cups per degree. Notice it does not contain zero, which is the same verdict the p-value gave: a 95% interval that excludes zero always matches a p-value below 0.05. The interval just says *more*, it also tells Priya the effect is somewhere between "a bit under two cups" and "a bit over two cups" a degree, not merely "not zero."

[WARNING]
A tiny p-value means the effect is *real*, not that it is *large* or that it is *causal*. With enough data a trivially small slope can be highly significant. Read the size from the coefficient and its confidence interval; read causality from how the data was collected, never from the p-value alone.

=== step === quiz
::eyebrow Check yourself
## What does the p-value say?

Priya's `summary()` reports the temperature slope as 1.944 with a standard error of 0.119, a t-value of 16.3, and a p-value of about \(1.5 \times 10^{-8}\). Which statement reads that p-value correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- If temperature truly had no effect (a real slope of zero), a sample slope this far from zero would be astronomically unlikely, so we reject the idea that temperature does nothing ::ok Exactly. The p-value is computed *assuming* the null is true and measures how surprising the data would be in that world. A vanishingly small p means "this slope would almost never happen by chance," which is strong evidence against the no-effect hypothesis.
- There is only about a 1-in-65-million chance that the true slope is actually zero ::no A common but wrong reading. The p-value is the probability of the data given that the null is true, not the probability that the null is true given the data. It says nothing directly about how likely "slope = 0" is; it only says this slope would be a near-impossible fluke if the slope really were zero.
- The slope of 1.944 is pinned down to within 0.00000002 cups per degree ::no That confuses the p-value with precision. Precision is the standard error (0.119) and the 95% confidence interval [1.68, 2.21]. The p-value is a measure of evidence against zero, not a margin on the estimate.

=== step === concept
::eyebrow The predicting job
## Two intervals for a prediction

Now the other job. Tomorrow's forecast is 25 degrees, and the line's best guess is \(0.818 + 1.944 \times 25 \approx 49.4\) cups, exactly the `predict()` answer from Lesson 1. But "49.4" alone is a tightrope with no net. Priya needs a *range*. Here is the subtlety that trips up almost everyone: there are two different ranges, answering two different questions.

The first question is about the **average**: across *all* 25-degree days, where does the mean number of cups sit? That uncertainty is only about where the *line* is, and it is captured by the **confidence interval for the mean response**. The second question is about *one specific tomorrow*: where will this single 25-degree day actually land? That has to include the day's own random ups and downs (a tour group, a drizzle), and it is captured by the wider **prediction interval**. In R it is a single argument:

```r
new_day <- data.frame(temp = 25)
round(predict(fit, newdata = new_day, interval = "confidence"), 2)
#>     fit   lwr   upr
#> 1 49.41 48.00 50.82
round(predict(fit, newdata = new_day, interval = "prediction"), 2)
#>     fit   lwr   upr
#> 1 49.41 44.53 54.29
```

Same center (49.41), wildly different widths. The confidence interval for the average 25-degree day spans under 3 cups, [48.0, 50.8]. The prediction interval for *tomorrow* spans nearly 10 cups, [44.5, 54.3], about three and a half times wider. Both come from the same standard error \(s\) (the residual spread), scaled differently:

\[ \operatorname{SE}_{\text{mean}} = s\sqrt{\tfrac{1}{n} + \tfrac{(x_0 - \bar x)^2}{S_{xx}}}, \qquad \operatorname{SE}_{\text{pred}} = s\sqrt{1 + \tfrac{1}{n} + \tfrac{(x_0 - \bar x)^2}{S_{xx}}} \]

where \(x_0\) is the new temperature (25), \(\bar x\) the average temperature in the data, \(n\) the number of days, and \(S_{xx} = \sum_i (x_i - \bar x)^2\) the spread of the temperatures. The two formulas are identical except for that lone \(1\) under the prediction root. Drag the sample size in the widget and watch what that single \(1\) does.

::widget regression-intervals {}

=== step === concept
::eyebrow Why the gap never closes
## Why the prediction interval is wider

That extra \(1\) is the whole story, and it comes from a clean split of where a new day's error comes from. The uncertainty in a single new observation breaks into two independent pieces:

\[ \underbrace{\operatorname{Var}(\text{new } y_0)}_{\text{prediction}} = \underbrace{\operatorname{Var}(\hat y_0)}_{\text{where the line is}} + \underbrace{\sigma^2}_{\text{the day's own noise}} \]

The first piece, \(\operatorname{Var}(\hat y_0)\), is our uncertainty about the *line* itself, the height of the mean at \(x_0\). The second, \(\sigma^2\), is the **irreducible noise**: the scatter of individual days around the line that no straight line could ever remove (Priya's weekends, weather, passing crowds).

Here is the consequence you felt on the slider. As you collect more data and \(n\) grows, the first piece shrinks toward zero, you can pin down *where the line is* as precisely as you like, so the green confidence band collapses onto the line. But the second piece, \(\sigma^2\), never moves. A single future day carries its own randomness no matter how much history you have. So the orange prediction band stops at a floor of roughly \(\pm t^{*}\sigma\) and refuses to shrink further.

[KEY INSIGHT]
More data makes you sure about the *average*, never about the *next individual*. The confidence interval can shrink to nothing; the prediction interval is floored by the world's own noise. That floor is a feature, not a flaw: it is the model being honest that one new day is partly unpredictable.

=== step === tryit
::eyebrow Your turn
## Bracket tomorrow honestly

Priya is loading the cart for tomorrow's 25-degree forecast and wants the range her *actual* sales could fall in, not the range of the long-run average. That is the prediction interval. Fill in the blank with the right interval type, then check it.

```r
new_day <- data.frame(temp = 25)
predict(fit, newdata = new_day, interval = ____)   # the range a SINGLE new day could land in
```
::check {"regex":"[\"']prediction[\"']","gate":true,"difficulty":"intermediate","ok":"Right. interval = prediction returns [44.5, 54.3]: the band for one specific new day, which must include the day's own noise. Priya should stock for the upper end, not the point estimate of 49.","no":"For a single future day you need the prediction interval. Set interval = \"prediction\" (in quotes). The confidence interval would give the much narrower range for the AVERAGE 25-degree day."}
::solution
```r
new_day <- data.frame(temp = 25)
round(predict(fit, newdata = new_day, interval = "prediction"), 2)
#>     fit   lwr   upr
#> 1 49.41 44.53 54.29
```

=== step === quiz
::eyebrow Check yourself
## Which interval stocks the cart?

Tomorrow's forecast is 25 degrees. Priya wants to load enough cups that she neither sells out nor hauls home a pile of melted ice. The model gives a point prediction of 49.4 cups, a confidence interval of [48.0, 50.8], and a prediction interval of [44.5, 54.3]. Which should she stock by?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The confidence interval [48.0, 50.8], because it is the tightest and most precise range the model offers ::no That interval is for the *average* 25-degree day, not for this one specific tomorrow. It deliberately ignores a single day's own ups and downs, so stocking 51 would leave her short on any busier-than-average day. Tightest is not the point; *right question* is.
- The prediction interval [44.5, 54.3], because a single real tomorrow carries the day-to-day noise, so she should prep near the top, around 54 ::ok Exactly. One specific day can land anywhere in the prediction band, so to avoid stockouts she plans for its upper end. The prediction interval is the one that answers "where will this one day actually fall."
- The point prediction of 49.4 alone, since it is the model's single best estimate ::no A bare point estimate gives her no margin at all. Roughly half of real 25-degree days will sell more than 49.4, so stocking exactly that runs her out one day in two. A decision needs an interval, and for one day it is the prediction interval.

=== step === concept
::eyebrow Tying it together
## Explaining versus predicting, reconciled

These really are two jobs, and a model can be strong at one while weak at the other. Priya's line *explains* beautifully: the slope is tightly estimated and overwhelmingly significant, so she can say with confidence that warmth drives sales and roughly by how much. Yet its *predictions* for a single day still carry a 10-cup band, because individual days are genuinely noisy. High explanatory confidence and wide prediction bands live happily together.

[KEY INSIGHT]
Explaining is about the *line* (the slope, its test, its confidence interval); predicting is about a *future point* (its prediction interval). A significant coefficient does not promise sharp predictions, and a sharp prediction does not prove a cause. Match the tool to the job: confidence interval and t-test to understand a relationship, prediction interval to commit to a number.

And both jobs inherit Lesson 1's cliff: trust them only inside the range of the data. Asked about a record 40-degree day, the slope's confidence interval and the prediction interval are *both* extrapolations, quietly assuming the straight line still holds where Priya has no evidence at all. Honest inference and honest prediction stop at the edge of the data.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take inference and prediction further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the clearest first treatment of coefficient tests, confidence intervals, and the confidence-versus-prediction-interval distinction.
- [The Elements of Statistical Learning, ch. 3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full sampling theory behind the standard errors and t-tests on least-squares coefficients.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - free, worked lessons that walk through the confidence interval for the mean response versus the prediction interval for a new observation.
- [R documentation: predict.lm()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - the function you used, with the exact meaning of its `interval = "confidence"` and `interval = "prediction"` arguments.

=== step === complete
## Lesson 6 complete

You now run a regression's two jobs without confusing them. **Explaining:** the slope is an estimate that wobbles, so you test it against the null of no effect (\(t = \hat\beta_1 / \operatorname{SE}\), with the p-value as the tail area) and report its confidence interval, reading "real" from the test and "how big" from the interval. **Predicting:** a new value needs an interval too, and there are two, a narrow confidence interval for the average response and a wider prediction interval for a single new day, wider because one day carries irreducible noise that more data can never average away. The skill is matching the interval to the question: the line, or the next point.

Next, Lesson 7: Logistic Regression Done Properly. Every model so far predicted a *number* of cups. But many questions are yes-or-no (did this customer buy, will this loan default), and a straight line is the wrong tool for a probability. You will meet the logit link that bends the line into an S-curve and keeps every prediction safely between 0 and 1.

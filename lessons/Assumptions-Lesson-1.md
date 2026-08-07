---
title: "Assumptions Lesson 1: When residuals are not normal"
catalog_blurb: "What non-normal residuals do to your intervals, and when it actually matters."
description: "A reviewer says your residuals are not normal. Drag the skewness dial and watch what breaks, what does not, and where the real damage hides."
keywords: "normality assumption, non-normal residuals, Shapiro-Wilk, QQ plot, central limit theorem, confidence interval coverage, peer review, R"
post_type: "LESSON"
curriculum_id: "4.5.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "handbook-assumptions"
course_title: "Model assumptions, from the ground up"
course_lesson: "1"
course_total: "7"
course_landing: "tutorials/publishing.html"
course_next: "Assumptions-Lesson-2.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## When residuals are not normal

Reviewer 2 has written one sentence: "The authors do not appear to have verified the normality assumption." You have three weeks and a model that took a month to fit.

Before you touch the model, it is worth finding out what this assumption actually protects. Drag the dial below from none to severe and watch the two numbers underneath it. One of them barely moves.

By the end of this lesson you will be able to:

- Say which quantity the normality assumption is about, and which it is not
- Explain what a 95% interval promises, in a way you can count
- Predict what heavy skew does to your intervals, and be right
- Read a QQ plot and a Shapiro-Wilk result without over-reading either
- Name the situation where non-normality really does damage a result

**Prerequisites:** you can run R and read [lm() output](/Linear-Regression.html), you know what a [residual](/Regression-Assumptions-and-Residuals.html) is, and you know what a [confidence interval](/Confidence-Intervals-in-R.html) claims.

::widget assumption-dial {"assumption":"normality","levels":11,"start":0}

=== step === concept
::eyebrow First, the thing itself
## The assumption is about the errors, not your data

A reviewer who says "your data are not normal" and a reviewer who says "your residuals are not normal" are asking about different things, and only the second one is asking about an assumption of your model.

Linear regression says that each observed value sits on a straight line plus a nudge:

\\[ y_i = \\beta_0 + \\beta_1 x_i + \\varepsilon_i \\]

Here \\(y_i\\) is the outcome for observation \\(i\\), \\(x_i\\) is the predictor, \\(\\beta_0\\) and \\(\\beta_1\\) are the intercept and slope the model is estimating, and \\(\\varepsilon_i\\) is the error: everything about observation \\(i\\) that the line does not explain.

The normality assumption is a claim about \\(\\varepsilon_i\\) and nothing else. Your outcome `y` can be wildly skewed and every assumption can still hold, because the skew might live entirely in `x`. This trips up more papers than any other part of the topic.

[KEY INSIGHT]
Nobody ever assumed your data were normal. The assumption is that the leftovers are.

=== step === concept
::eyebrow What you can actually see
## Residuals are your only view of the errors

The errors \\(\\varepsilon_i\\) are invisible. They belong to the true relationship, and if you knew them you would not need to fit anything. What you get instead is the residual: the gap between what you observed and what your fitted line predicted.

Let us make a small dataset where we know the truth, so we can check our reasoning against it later. Thirty seconds of ad spend and revenue for 120 campaigns, where the errors are deliberately skewed: most campaigns land a little under the line, a few land far above it.

```r
set.seed(42)
n <- 120
x <- runif(n, 0, 10)
y <- 3 + 1.5 * x + (rexp(n, rate = 1) - 1)

sales <- data.frame(ad_spend = x, revenue = y)
fit <- lm(revenue ~ ad_spend, data = sales)
round(coef(summary(fit)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    3.051      0.182  16.767        0
#> ad_spend       1.516      0.030  50.429        0
```

We built the data with a true slope of 1.5, and the model recovered 1.516. That is the first thing worth noticing: the estimate is fine. Skewed errors did not bias it.

The residuals carry the skew, though, and you can see it without any test at all.

```r
r <- residuals(fit)
cat("mean:", round(mean(r), 3), " median:", round(median(r), 3), "\n")
cat("largest positive:", round(max(r), 2), " largest negative:", round(min(r), 2), "\n")
#> mean: 0  median: -0.24
#> largest positive: 2.82  largest negative: -1.1
```

The mean is zero because least squares forces it to be. The median sits below zero, and the biggest overshoot is nearly three times the biggest undershoot. That lopsidedness is the skew.

::widget residual-plot {"shape":"healthy"}

=== step === quiz
::eyebrow Check yourself
## Which one is the assumption about?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- The outcome variable `y` must be normally distributed ::no This is the most common misreading. A skewed `y` is perfectly compatible with all the assumptions, because the skew may come from `x`.
- The predictor `x` must be normally distributed ::no No assumption is made about the predictor's distribution at all. `x` can be binary, uniform, or anything else.
- The error term must be normally distributed ::ok Exactly. The assumption is about the unexplained part, and residuals are our estimate of it.
- Both `x` and `y` must be normally distributed ::no Neither is assumed normal. Only the errors.

=== step === concept
::eyebrow The promise being tested
## What a 95% interval actually promises

To judge whether a broken assumption matters, you need something countable. "The interval is valid" is not countable. This is:

Run the whole study many times. Each run gives a confidence interval. **Coverage** is the share of those intervals that contain the true value. A 95% interval promises coverage of 0.95, and that is the promise normality is supposed to protect.

We can check it, because we invented the data and know the true slope is exactly 1.5.

```r
set.seed(1)
hits <- 0
reps <- 500

for (i in seq_len(reps)) {
  xi <- runif(40, 0, 10)
  yi <- 3 + 1.5 * xi + (rexp(40, rate = 1) - 1)
  ci <- confint(lm(yi ~ xi))["xi", ]
  if (ci[1] <= 1.5 && 1.5 <= ci[2]) hits <- hits + 1
}

cat("coverage:", hits / reps, "\n")
#> coverage: 0.956
```

Five hundred studies, every one of them with badly skewed errors, at a modest sample size of 40. Coverage came out at 0.956 against a promise of 0.95.

[NOTE]
That is not a rounding artifact or a lucky seed. It is the result this whole lesson turns on, and the next step shows it holding across the full range of severity.

::widget assumption-dial {"assumption":"normality","levels":11,"start":0}

=== step === widget
::eyebrow Now move it yourself
## Drag the dial and watch what refuses to move

The dial sets how skewed the errors are, from perfectly normal on the left to severely skewed on the right. Behind it, thousands of complete studies run at every severity level, and two things get measured.

**Coverage** is the promise from the last step: the share of 95% intervals that contain the truth. **Fit** is R-squared, the number your reader looks at.

Drag it all the way to severe, then back. Watch coverage.

::widget assumption-dial {"assumption":"normality","levels":11,"start":0,"bars":30}

Coverage moves by about one percentage point across the entire range. A reader who was told "your residuals are not normal, therefore your intervals are wrong" has been told something the simulation does not support.

=== step === concept
::eyebrow Why it holds
## The Central Limit Theorem is doing the work

Your slope estimate is not one draw from the error distribution. It is a weighted sum of all \\(n\\) of them:

\\[ \\hat{\\beta}_1 = \\beta_1 + \\frac{\\sum_i (x_i - \\bar{x})\\,\\varepsilon_i}{\\sum_i (x_i - \\bar{x})^2} \\]

Read the second term slowly. The numerator adds up every error, each multiplied by how far its \\(x\\) sits from the average \\(\\bar{x}\\). It is a sum of many independent things.

The Central Limit Theorem says that a sum of many independent things tends toward a normal distribution, whatever shape the individual things had. So even when each \\(\\varepsilon_i\\) is violently skewed, the estimate built by adding them up is close to normal. The t-interval is built on the distribution of the estimate, not on the distribution of the errors, which is why it survives.

That is the whole mechanism. It is also why the protection gets weaker as \\(n\\) gets smaller: fewer things in the sum means less help from the theorem.

=== step === quiz
::eyebrow Check yourself
## What did the dial actually show?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Coverage collapsed and R-squared collapsed with it ::no Neither collapsed. If this matched your intuition before the dial, that is exactly the point of moving it yourself.
- Coverage barely moved, and R-squared barely moved ::ok Correct, and it is the reason this objection is usually the mildest of the seven. The Central Limit Theorem protects the interval.
- Coverage held but R-squared fell sharply ::no R-squared is untouched here. The generative model holds signal and error variance fixed as severity rises.
- Coverage collapsed while R-squared held steady ::no That is the signature of unequal variance, which is lesson 2. Normality behaves differently, which is why they are separate lessons.

=== step === concept
::eyebrow The picture reviewers ask for
## Reading a QQ plot without over-reading it

A QQ plot sorts your residuals and plots them against the values you would expect if they really were normal. Perfect normality puts every point on the diagonal line. Skew bends the ends away from it.

The bend is the signal. A few points drifting off at the extremes is ordinary and means nothing; both tails curving away in the same direction means skew.

```r
qqnorm(residuals(fit), main = "")
qqline(residuals(fit))
```

What a QQ plot cannot tell you is whether the departure matters. It shows shape, not consequence. The dial showed consequence, and the two answers were different.

::widget residual-plot {"shape":"curve"}

=== step === concept
::eyebrow The test, and its trap
## Shapiro-Wilk answers a question you did not ask

Shapiro-Wilk tests the null hypothesis that the residuals came from a normal distribution. A small p-value says "these are probably not normal".

```r
shapiro.test(residuals(fit))
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  residuals(fit)
#> W = 0.88425, p-value = 3.325e-08
```

That p-value is emphatic, and we already know the answer is correct, because we built the errors from an exponential distribution.

Here is the trap. The test answers "are these exactly normal?" and the answer for real data is always no. With a large sample it will find the tiniest departure and return a tiny p-value; with a small sample it will miss a large departure and return a comfortable one. So it is most likely to alarm you when your sample is large, which is precisely when the Central Limit Theorem has made the problem least important.

[WARNING]
Reporting Shapiro-Wilk as a pass or fail gate inverts the actual risk. Small n is where normality matters most and where the test has the least power to detect a problem.

=== step === tryit
::eyebrow Your turn
## Check a real model

`mtcars` is built into R. Fit fuel consumption on weight, then look at whether the residuals are skewed, using the same two-line check from earlier rather than a formal test.

```r
fit2 <- lm(mpg ~ wt, data = mtcars)
r2 <- residuals(fit2)

# your code: print the mean, the median, and the largest residual each way
```

::check {"regex":"median\\s*\\(","gate":true,"difficulty":"beginner","ok":"Yes. The median sitting well away from a mean of zero is the quickest skew check you can do, and it needs no test.","no":"Use median() on the residuals and compare it against the mean, then compare max() with min()."}

::solution

```r
fit2 <- lm(mpg ~ wt, data = mtcars)
r2 <- residuals(fit2)

cat("mean:", round(mean(r2), 3), " median:", round(median(r2), 3), "\n")
cat("largest positive:", round(max(r2), 2), " largest negative:", round(min(r2), 2), "\n")
#> mean: 0  median: -0.08
#> largest positive: 6.87  largest negative: -4.54
```

The median sits just below a mean of zero and the biggest overshoot beats the biggest undershoot, so there is mild right skew. Mild is the operative word: with n = 32 and a departure this small, nothing in the previous steps suggests the intervals are in trouble.

=== step === concept
::eyebrow When it does bite
## The case where non-normality really does damage a result

Everything so far has been about the interval for a coefficient. Prediction intervals for a single new observation are a different matter, and this is where the honest warning lives.

A prediction interval is built from the error distribution itself, not from a sum of errors, so the Central Limit Theorem never gets involved. Watch where the misses land.

```r
set.seed(3)
lo <- 0
hi <- 0
reps <- 500

for (i in seq_len(reps)) {
  xi <- runif(60, 0, 10)
  di <- data.frame(x = xi, y = 3 + 1.5 * xi + (rexp(60, rate = 1) - 1))
  p  <- predict(lm(y ~ x, data = di), data.frame(x = 5), interval = "prediction")
  ynew <- 3 + 1.5 * 5 + (rexp(1, rate = 1) - 1)
  if (ynew < p[2]) lo <- lo + 1
  if (ynew > p[3]) hi <- hi + 1
}

cat("missed below:", lo / reps, "  missed above:", hi / reps, "\n")
#> missed below: 0   missed above: 0.054
```

Total coverage is about 95%, exactly as promised. Every single miss is on the same side.

The interval is the right width and in the wrong place. Anyone using its lower bound is being misled, because values never fall below it, and all of the risk sits above the top. A symmetric interval cannot describe an asymmetric error, and no sample size fixes that.

::widget assumption-dial {"assumption":"normality","levels":11,"start":8}

=== step === quiz
::eyebrow Check yourself
## Where does non-normality actually hurt?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- It biases the coefficient estimates ::no It does not. Our fitted slope was 1.516 against a true 1.5, with errors drawn from an exponential distribution.
- It always invalidates the confidence interval for a slope ::no The dial and the 500-study simulation both showed coverage holding at roughly its nominal level.
- It inflates R-squared ::no R-squared was unaffected throughout.
- It makes a symmetric prediction interval sit in the wrong place ::ok Right. Coverage looked correct while every miss fell on one side, and that is the failure the total number hides.

=== step === concept
::eyebrow Answering the reviewer
## What to write back

The reviewer asked a fair question badly. Your response has to show the check, then say what it implies, without either dismissing them or over-conceding.

If your sample is reasonably large and the departure is skew rather than something extreme, the honest answer is that the estimate and its interval are robust here, and you say why:

> We have added a QQ plot of the residuals as Supplementary Figure S2. The residuals show mild right skew. Because inference on the coefficients relies on the sampling distribution of the estimates rather than on the errors themselves, and n = 120, the confidence intervals are robust to a departure of this size. We have noted this explicitly in the Methods.

If you are quoting prediction intervals for individual observations, concede that part, because the previous step showed it is a real problem:

> The reviewer is right that our prediction intervals assume symmetric errors. We have replaced them with bootstrap intervals, which do not, and the revised bounds appear in Table 3.

[TIP]
Never answer this one by transforming the outcome without saying why. A log transform changes what your coefficients mean, and a reviewer who asked about normality will notice that you answered a different question.

=== step === concept
::eyebrow Where this came from
## References

- [Lumley et al. (2002), "The importance of the normality assumption in large public health data sets"](https://www.annualreviews.org/doi/10.1146/annurev.publhealth.23.100901.140546) - the paper most often cited for the result you just simulated; it argues the normality assumption is rarely the binding one at realistic sample sizes.
- [Knief and Forstmeier (2021), "Violating the normality assumption may be the lesser of two evils"](https://link.springer.com/article/10.3758/s13428-021-01587-5) - a simulation study reaching the same conclusion, and useful to cite in a response letter because it compares the cost against transforming the outcome.
- [Shapiro and Wilk (1965), "An analysis of variance test for normality"](https://doi.org/10.1093/biomet/52.3-4.591) - the original test, worth a look for how carefully its authors framed what it does and does not answer.
- [Faraway, *Linear Models with R*](https://julianfaraway.github.io/faraway/LMR/) - chapter 6 covers diagnostics, including why a QQ plot is read for shape and not for a verdict.

=== step === complete
::eyebrow Done
## What you can now defend

You can say which quantity the normality assumption is about, and correct a reviewer who asks about the wrong one. You can define coverage as something countable, and you have watched it hold at 0.956 while the errors were badly skewed. You know the mechanism that protects it, and you know the one place it offers no protection at all.

That last point matters more than it looks. Every assumption in this course fails in its own specific way, and treating them as one undifferentiated worry is what makes response letters weak.

**Next:** unequal variance, where coverage does not survive. Drag the same kind of dial and watch it fall away from 95% while R-squared sits perfectly still.

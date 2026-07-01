---
title: "Regression Modeling in R: Quiz"
description: "A short, graded check on the regression section: OLS, assumptions and residuals, leverage, multicollinearity, heteroskedasticity, and logistic regression."
keywords: "R quiz, regression, OLS, multicollinearity, logistic regression, ds-regression"
post_type: "LESSON"
curriculum_id: "6.20.9"
webr: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "9"
course_total: "9"
course_landing: "R-Regression-Modeling-Course.html"
lesson_kind: "quiz"
course_prev: "GLMs-Beyond-Logistic.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built OLS from scratch, checked its assumptions through residuals, handled leverage, multicollinearity and heteroskedasticity, and moved beyond the straight line into logistic regression and GLMs. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## What OLS minimises
Ordinary least squares chooses the line that minimises:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The sum of the residuals. ::no Positive and negative residuals would cancel; that sum is essentially zero for any fitted line.
- The sum of the squared residuals. ::ok Correct: OLS minimises the sum of squared vertical distances from points to the line.
- The largest single residual. ::no Minimising the maximum error is a different method (minimax), not OLS.
- The number of points above the line. ::no OLS balances squared distance, not a count of points.

=== step === quiz
::eyebrow Question 2 of 6
## A model assumption
Which is a standard assumption of the classical linear regression model?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The predictors must be normally distributed. ::no It is the *errors*, not the predictors, that get distributional assumptions.
- Every predictor must be statistically significant. ::no Significance is an outcome you test, not an assumption you require.
- The errors have constant variance and are independent. ::ok Correct: constant variance (homoskedasticity) and independent errors are core assumptions.
- The sample size must exceed 1000. ::no There is no fixed sample-size assumption.

=== step === quiz
::eyebrow Question 3 of 6
## Leverage
A high-leverage point is an observation that:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Sits far from the others in its predictor (x) values. ::ok Correct: extreme x values give a point the potential to pull the fitted line.
- Has the largest residual. ::no A large residual is an outlier in y; leverage is about extreme x.
- Is always an error to delete. ::no High leverage is not automatically wrong; investigate before removing.
- Has no effect on the regression. ::no High leverage points can strongly influence the slope.

=== step === quiz
::eyebrow Question 4 of 6
## Correlated predictors
When two predictors are strongly correlated with each other, the main consequence is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model cannot be fitted at all. ::no It usually fits; the coefficients just become unreliable (unless correlation is perfect).
- Unstable coefficients with inflated standard errors. ::ok Correct: multicollinearity inflates standard errors, so coefficients swing and lose interpretability. The VIF flags it.
- The R-squared drops to zero. ::no Predictive fit can stay high even with multicollinearity.
- The residuals become perfectly normal. ::no Multicollinearity does not normalise residuals.

=== step === quiz
::eyebrow Question 5 of 6
## Non-constant variance
Heteroskedasticity (error variance that changes with the fitted value) primarily:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Makes the coefficient estimates biased. ::no OLS coefficients stay unbiased; it is the standard errors that suffer.
- Has no practical consequence. ::no It quietly invalidates your p-values and confidence intervals.
- Distorts the standard errors, so p-values and intervals are wrong. ::ok Correct: use robust (sandwich) standard errors so inference stays valid.
- Turns the model into a classifier. ::no It does no such thing.

=== step === quiz
::eyebrow Question 6 of 6
## What logistic regression models
Logistic regression is the right tool for a binary outcome because it:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Models the log-odds as linear, keeping predicted probabilities between 0 and 1. ::ok Correct: the logit link maps a linear predictor to a probability in [0, 1].
- Fits a straight line directly to the 0/1 labels. ::no That is the linear-probability model, which can predict below 0 or above 1.
- Predicts a continuous dollar amount. ::no That is ordinary regression; logistic predicts a probability/class.
- Requires the outcome to be normally distributed. ::no The outcome is binary; normality is not assumed.

=== step === concept
::eyebrow Run it: fit a line and read it
## OLS in one call
Run this to fit `mpg` on weight, read the coefficients, and see how much variance the line explains.

```r
fit <- lm(mpg ~ wt, data = mtcars)
coef(fit)
summary(fit)$r.squared
```

The negative slope says heavier cars get fewer miles per gallon; the R-squared is the share of variance the line captures.

=== step === concept
::eyebrow Run it: predict a probability
## Logistic predictions stay in [0, 1]
Flag efficient cars, fit a logistic model, and look at the fitted probabilities.

```r
mtcars$efficient <- as.integer(mtcars$mpg > 20)
m <- glm(efficient ~ wt, data = mtcars, family = binomial)
round(predict(m, type = "response")[1:5], 3)
```

Every prediction is a probability between 0 and 1, which a plain linear fit could not guarantee.

=== step === complete
## Section complete
Strong work. You can fit and read a linear model, diagnose it through residuals and leverage, recognise multicollinearity and heteroskedasticity, and reach for logistic regression and GLMs when the outcome is not continuous. Next: classification fundamentals.

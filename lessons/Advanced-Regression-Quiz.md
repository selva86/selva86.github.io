---
title: "Advanced Regression and GLMs: Quiz"
description: "A graded check on the advanced regression section: robust and quantile regression, ridge/lasso shrinkage, GAMs, count and zero-inflated models, Gamma/Tweedie, beta/ordinal, and mixed models."
keywords: "R quiz, robust regression, quantile regression, ridge, lasso, elastic net, GAM, Poisson, negative binomial, zero-inflated, Tweedie, beta regression, mixed models, GLMM, ds-reg-glm-expert"
post_type: "LESSON"
curriculum_id: "6.130.14"
webr: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "14"
course_total: "14"
course_landing: "R-Advanced-Regression-Course.html"
lesson_kind: "quiz"
course_prev: "Mixed-Models-Random-Slopes-and-GLMMs.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have worked through the modern regression toolkit: robust and quantile methods that resist outliers, ridge and lasso shrinkage, flexible GAMs, count models for Poisson and negative-binomial data, zero-inflated and hurdle models, Gamma and Tweedie for amounts and losses, beta and ordinal models for bounded outcomes, and mixed models for grouped data. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## When one point tilts the line
A single gross outlier in `y` has dragged your OLS slope far from the trend the bulk of the data follows. Why does an M-estimator like `rlm` handle this better?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It deletes any point with a large residual before fitting. ::no It does not delete points; it keeps them all but weights them. Deleting on residual size is a separate, cruder approach.
- It downweights points with large residuals instead of squaring every error equally. ::ok Correct: OLS squares every residual, so one huge error dominates. An M-estimator uses a loss that grows more slowly, so extreme points pull far less.
- It minimises the largest residual rather than the sum of squares. ::no Minimising the maximum error (minimax) is even more sensitive to outliers, not less.
- It always gives the same answer as OLS but faster. ::no The whole point is a different, outlier-resistant answer, not a faster OLS.

=== step === quiz
::eyebrow Question 2 of 10
## Breakdown point
The `rlm` Huber M-estimator resisted a couple of stray outliers, but you have a dataset where nearly a third of the rows are contaminated. Which estimator is built for that, and why?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Plain OLS, because more data always averages the noise away. ::no OLS has a breakdown point of essentially 0: a single bad leverage point can ruin it, let alone a third of the data.
- A Huber M-estimator, because it caps the influence of large residuals. ::no Huber resists outliers in `y`, but its breakdown point still collapses under bad high-leverage points; a third contamination can defeat it.
- An MM-estimator, which combines a high (about 50%) breakdown point with high efficiency. ::ok Correct: MM-estimation is designed to stay reliable until nearly half the data is bad, while keeping efficiency close to OLS on clean data.
- A larger sample of the same contaminated process. ::no More data from a contaminated process just gives you more contamination, not a cleaner fit.

=== step === quiz
::eyebrow Question 3 of 10
## What quantile regression models
Ordinary regression fits the conditional **mean**. What does quantile regression (`rq`) fit instead, and when is that the point?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A chosen conditional quantile (say the median or the 90th percentile), useful when the tails behave differently from the average. ::ok Correct: `rq(y ~ x, tau = 0.9)` models the 90th percentile of `y` given `x`; it is robust to `y`-outliers and reveals effects that differ across the distribution.
- The variance of `y` as a function of `x`. ::no That is a variance/heteroskedasticity model, not what quantile regression estimates.
- The same mean as OLS, but with robust standard errors. ::no Robust standard errors still target the mean; quantile regression targets a quantile of the response itself.
- The probability that `y` exceeds a threshold. ::no That is closer to a logistic/exceedance model; quantile regression returns the quantile value, not a probability.

=== step === quiz
::eyebrow Question 4 of 10
## Ridge versus lasso
You fit both a ridge and a lasso model to the same predictors. What is the key practical difference in the coefficients they produce?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Ridge sets some coefficients to exactly zero; lasso only shrinks them. ::no It is the other way round. Lasso is the one that zeroes coefficients.
- Lasso can set coefficients to exactly zero (selecting variables); ridge shrinks all of them toward zero but keeps them. ::ok Correct: the L1 penalty of lasso produces exact zeros (a sparse model), while ridge's L2 penalty shrinks smoothly and retains every predictor.
- Both always produce identical coefficients. ::no They use different penalties (L1 vs L2) and generally give different fits.
- Neither penalises the coefficients; they just refit OLS. ::no Both add a penalty to OLS; that penalty is the whole idea of shrinkage.

=== step === quiz
::eyebrow Question 5 of 10
## When to reach for elastic net
Your predictors include several groups of strongly correlated variables. Plain lasso keeps picking one from each group and dropping the rest, somewhat arbitrarily. What does elastic net do better here?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- It blends the lasso and ridge penalties, so correlated predictors tend to be kept or dropped together (a grouping effect). ::ok Correct: mixing L1 and L2 (the `alpha` between 0 and 1) gives elastic net lasso-style selection plus ridge-style handling of correlated groups.
- It removes correlated predictors automatically before fitting. ::no It does not pre-screen predictors; it changes the penalty so the fit handles correlation more gracefully.
- It is just another name for ridge regression. ::no Ridge is the special case `alpha = 0`; elastic net is the blend, `0 < alpha < 1`.
- It guarantees every coefficient is nonzero. ::no It can still zero coefficients (it includes an L1 part); that is a feature, not something it prevents.

=== step === quiz
::eyebrow Question 6 of 10
## Reading a GAM smooth
In a GAM, `s(x)` fits a smooth term and its summary reports an **effective degrees of freedom (edf)**. What does an edf close to 1 tell you?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The smooth is strongly wiggly and clearly nonlinear. ::no A high edf signals a wiggly curve; an edf near 1 means the opposite.
- The relationship is essentially a straight line; the extra flexibility was not needed. ::ok Correct: edf measures wiggliness. An edf of about 1 means the penalised smooth collapsed to a line, so a linear term would have done the job.
- The predictor is statistically insignificant. ::no edf is about the shape (how curved), not about significance; a linear smooth can still be highly significant.
- The model failed to converge. ::no An edf near 1 is a normal, well-fit result, not a convergence failure.

=== step === quiz
::eyebrow Question 7 of 10
## Overdispersion in a count model
You fit a Poisson regression and its Pearson dispersion statistic comes back at about 2.8. What does that mean, and what should you do?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The model is a great fit; a dispersion near 3 is ideal. ::no A Poisson expects a dispersion near 1. Nearly 3 means the variance far exceeds the mean.
- The coefficients are biased and must be discarded. ::no The point estimates are usually fine; it is the standard errors that are understated.
- The counts are overdispersed, so the Poisson's standard errors are too small; switch to a negative binomial. ::ok Correct: dispersion well above 1 means the variance exceeds the mean, the Poisson underestimates uncertainty, and a negative binomial (or quasi-Poisson) restores honest standard errors.
- You should log-transform the counts and use `lm`. ::no That mishandles zeros and the count nature; a negative binomial keeps the count model and fixes the variance.

=== step === quiz
::eyebrow Question 8 of 10
## Zero-inflated or hurdle?
An outcome has far more zeros than a negative binomial expects. What is the crucial question that decides between a zero-inflated model and a hurdle model?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Whether a fully "at-risk" unit can still record a zero of its own: if yes, zero-inflated; if every zero means "did not take part", hurdle. ::ok Correct: zero-inflated allows zeros from both a structural source and the count process; a hurdle has one gate for all zeros and a strictly positive count once crossed.
- Whichever has the lower AIC, always. ::no They often tie on AIC; the generative meaning of a zero should decide, not AIC alone.
- Zero-inflated is for counts, hurdle is only for continuous outcomes. ::no Both are count models; the difference is how they generate the zeros, not the outcome type.
- Hurdle models cannot include predictors. ::no Both parts of a hurdle model take their own predictors, just like a zero-inflated model.

=== step === quiz
::eyebrow Question 9 of 10
## Gamma versus Tweedie
You are modelling insurance losses. Claim **severity** (the size of a claim, given one happened) is strictly positive and skewed; **total loss per policy** is zero for most policies and positive for a few. Which pair of models fits?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Gamma for both, since both involve money. ::no Gamma places zero probability at exactly 0, so it cannot model the wall of zero-loss policies in the total.
- Gamma for the positive severity, and Tweedie for the zero-plus-positive total loss. ::ok Correct: Gamma fits strictly positive skewed amounts; a Tweedie (compound Poisson-Gamma, power p between 1 and 2) puts mass at exactly 0 plus a Gamma-like tail, exactly the total-loss shape.
- Poisson for both, since claims are events. ::no Amounts of money are continuous, not counts; Poisson only puts weight on whole numbers.
- Tweedie for severity and Gamma for the total. ::no Reversed: severity has no zeros (Gamma), while the total has the wall of zeros that only Tweedie handles.

=== step === quiz
::eyebrow Question 10 of 10
## Reading a mixed model
A random-intercept model of test `score` by `school` reports an ICC of 0.35, and adding a random slope for `study_hours` makes the fixed `study_hours` standard error grow. Which reading is correct?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- About 35% of the variance sits between schools, and the wider slope SE is honest: once you admit schools respond differently, you know the average effect less precisely. ::ok Correct: the ICC is the between-group share of variance (and the within-school correlation), and a random slope rightly widens the fixed effect's SE rather than inflating false confidence.
- The ICC of 0.35 is the model's R-squared. ::no The ICC is the share of variance between groups, not the variance explained by predictors.
- The growing SE means the random slope is a bug and should be removed. ::no A wider SE is the correct, more honest uncertainty; keep or drop the slope based on a likelihood-ratio test, not on the SE growing.
- An ICC of 0.35 is small enough to ignore the grouping and use a plain `lm`. ::no A third of the variance between schools is substantial; ignoring it gives pseudoreplicated, over-confident standard errors.

=== step === concept
::eyebrow Run it: catch overdispersion
## A Poisson that is too confident
Fit a Poisson to some overdispersed counts, then compute the Pearson dispersion. A value well above 1 is your signal to move to a negative binomial.

```r
set.seed(1)
n <- 200
x <- runif(n, 0, 3)
y <- rnbinom(n, mu = exp(0.5 + 0.7 * x), size = 2)   # counts with extra spread
m <- glm(y ~ x, family = poisson)
disp <- sum(residuals(m, type = "pearson")^2) / m$df.residual
round(c(slope = coef(m)[[2]], dispersion = disp), 2)
```

The dispersion lands near 3.85, far above the 1 a Poisson assumes, so its standard errors are too small and a negative binomial is the honest choice.

=== step === concept
::eyebrow Run it: a robust slope holds
## One outlier, two answers
Fit OLS and a robust M-estimator to the same data with a single wild point, and compare the slopes.

```r
library(MASS)
set.seed(3)
x <- 1:20
y <- 2 + 1.5 * x + rnorm(20, 0, 1)
y[20] <- 5                       # one gross outlier
ols <- coef(lm(y ~ x))[[2]]
rob <- coef(rlm(y ~ x))[[2]]     # M-estimator downweights it
round(c(ols_slope = ols, robust_slope = rob), 2)
```

OLS is dragged down to about 1.13 by the single bad point, while the robust fit stays near the true 1.49, the outlier resistance you met at the start of this section.

=== step === complete
## Section complete
Strong work. You can now resist outliers with robust and quantile regression, control complexity with ridge, lasso and elastic net, bend the fit with GAMs, model counts with Poisson, negative-binomial, zero-inflated and hurdle models, handle amounts and losses with Gamma and Tweedie, respect bounds with beta and ordinal regression, and account for grouped data with mixed models and GLMMs. That is the full modern regression toolkit.

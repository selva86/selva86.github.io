---
title: "Reviewer says the residuals are not normal"
slug: Reviewer-Says-Residuals-Are-Not-Normal
description: "A reviewer flagged non-normal residuals in your regression. How to check normality in R, decide whether it threatens your p-values, and word your reply."
keywords: "residuals not normal reviewer comment, normality assumption peer review, shapiro test response to reviewer, reviewer says residuals not normal, non-normal residuals regression"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 31
auto_link_terms: normality objection|non-normal residuals reviewer|Shapiro-Wilk response
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Ordinary least squares needs normal residuals only for exact small-sample inference, and with a reasonable sample size the central limit theorem covers you. So most versions of this objection have the same honest answer: the departure is real, and it does not change the conclusion.</p>

## What the reviewer wrote

> The residuals do not appear to be normally distributed, which calls into question the validity of the reported p-values.

> A Shapiro-Wilk test on the model residuals is significant, so the normality assumption is violated. Please address.

> The manuscript would also benefit from some attention to model diagnostics; in particular I could not find any assessment of whether the distributional assumptions of the regression were met, and given the modest sample size this seems worth confirming before the estimates are interpreted.

## What they actually mean

The assumption is about the model residuals, not the raw outcome and not the predictors. This is worth getting right, because a lot of authors respond by testing the outcome variable, the reviewer sees that the wrong thing was tested, and the comment comes back a second time.

What the reviewer is really questioning is whether the sampling distribution of your coefficients is the one your p-values and confidence intervals assume. They are not asking whether your data are normal. Almost no real data are, and that was never the requirement.

## Why they are asking

The coefficients from least squares are unbiased no matter how the residuals are distributed. Normality is what makes the t and F reference distributions exact when the sample is small. When the residuals are non-normal, the p-values and intervals can be off, but the error shrinks as the sample grows, because the central limit theorem pulls the coefficient sampling distribution toward normality regardless of the residuals. The practical worry therefore concentrates in small samples with heavy skew or heavy tails.

There is a second reason to look. Badly non-normal residuals often point to something else: a skewed outcome that wants a transformation, an omitted curve in a predictor, or a few extreme observations. So a normality flag sometimes signals a skewed outcome or a missing nonlinearity rather than a problem with normality as such.

The mechanics of the tests and plots are covered in [Test Normality and Equal Variance in R](/Normality-and-Variance-Tests-in-R.html). This chapter is about deciding whether you have a problem and what to say.

## How to check it

Fit the model and test the residuals it produces, not the outcome column.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
shapiro.test(residuals(fit))
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(fit)
#> W = 0.92792, p-value = 0.03427
```

The p-value is below 0.05, so the test rejects normality. Two things temper that before you act on it. On 32 observations the test has very little power, and on several thousand it will reject for departures far too small to matter, so a significant result tells you about detectability rather than about whether your inference is in trouble. The more informative view is the quantile-quantile plot.

```r
qqnorm(residuals(fit), main = "Normal Q-Q plot of residuals")
qqline(residuals(fit))
```

Points that sit on the line are consistent with normality; systematic curving away at both ends is the signature of heavy tails or skew. There is no threshold that settles the question, so treat a significant Shapiro-Wilk result as a reason to inspect the plot rather than as a conclusion about your coefficients.

## What to do about it

### You are fine

The test rejected, but the departure is mild, the sample is not tiny, and least squares tolerates moderate non-normality. You can demonstrate that the inference does not depend on the assumption by re-computing the interval with a bootstrap, which assumes nothing about the residual distribution, and comparing it with the model-based one.

```r
set.seed(1)
boot_wt <- replicate(2000, {
  rows <- sample(nrow(mtcars), replace = TRUE)
  coef(lm(mpg ~ wt + hp, data = mtcars[rows, ]))["wt"]
})
round(quantile(boot_wt, c(0.025, 0.975)), 3)
#>   2.5%  97.5% 
#> -5.362 -2.584 
round(confint(fit)["wt", ], 3)
#>  2.5 % 97.5 % 
#> -5.172 -2.584
```

The bootstrap interval for the weight coefficient runs from -5.362 to -2.584; the model-based interval runs from -5.172 to -2.584. They agree to within a rounding of the lower bound and match exactly at the upper. Because the [bootstrap](/Bootstrap-in-R.html) made no normality assumption and still landed in the same place, the mild non-normality did not distort the inference. Report the check, put the quantile-quantile plot in a supplement, and say the interval is unchanged under a distribution-free method.

### It is fixable

The residuals are skewed because the outcome is skewed. A transformation of the outcome often restores normality. Ozone in the `airquality` data is strongly right-skewed, which shows through into the residuals.

```r
aq <- na.omit(airquality)
raw_fit <- lm(Ozone ~ Solar.R + Wind + Temp, data = aq)
log_fit <- lm(log(Ozone) ~ Solar.R + Wind + Temp, data = aq)
shapiro.test(residuals(raw_fit))$p.value
#> [1] 3.617786e-06
shapiro.test(residuals(log_fit))$p.value
#> [1] 0.05726116
```

On the raw scale the Shapiro-Wilk p-value is 0.0000036, a decisive rejection. On the log scale it rises to 0.057, so the residuals no longer fail the test and the quantile-quantile plot straightens out. A log transformation changes what the coefficients mean, turning them into roughly multiplicative effects, so report on the scale you interpret and back-transform the estimates for the reader. Milder skew often responds to a square-root or cube-root transformation, and a count or proportion outcome is usually better served by a generalized linear model with a matching error distribution than by transforming.

### It is a real problem

The sample is small and the residuals are badly non-normal in a way no transformation fixes, so the p-values genuinely cannot be trusted and there is no larger sample to lean on. Suppose you have 18 observations, residuals with two clear modes, and a coefficient whose p-value sits at 0.03: the exact t-based p-value is exactly the quantity the reviewer is right to distrust here.

The honest path is an inference method that does not need normal residuals. A bootstrap of the coefficients gives intervals that make no distributional assumption; a rank-based test such as [Wilcoxon or Kruskal-Wallis](/Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html) answers a simpler comparison without the assumption; robust regression helps when the trouble comes from a few extreme points. The response that fails is to report the original p-values unchanged, because those are the exact numbers the objection is about.

## How to word your response

### If you are fine

> We thank the reviewer for this point. We assessed normality of the model residuals with a Shapiro-Wilk test and a quantile-quantile plot (Supplementary Figure S2). The test indicated a mild departure (W = 0.93, p = 0.034). Because least squares is robust to moderate non-normality at this sample size, and because a bootstrap re-estimation that assumes nothing about the residual distribution produced a 95% interval for the weight coefficient almost identical to the model-based one, we have retained the original specification. The diagnostic is now described in the Methods (page X).

### If it was fixable

> The reviewer is correct that the residuals from the original model departed from normality. The outcome is strongly right-skewed, and we have re-fitted the model on the log scale, after which the residuals are consistent with normality (Shapiro-Wilk p = 0.057) and the quantile-quantile plot is close to linear. Coefficients are now reported as multiplicative effects, with back-transformed values for interpretation. The revised model and its diagnostics appear in Table 3 and Supplementary Figure S2 (page X).

### If it is a real problem

> We agree with the reviewer that the residuals depart substantially from normality and that, at our sample size, this affects the reliability of the model-based p-values. We have re-estimated the confidence intervals by bootstrap, which does not rely on the normality assumption, and report these intervals throughout. The direction of the findings is unchanged, but the intervals are wider than those originally reported, and we have adjusted the strength of our claims accordingly (Results, page X; Methods, page X).

The third response reports what changed and does not present the original p-values as though they still stood, which is the version a reviewer accepts, because it answers the objection rather than working around it.

## Practice

A reviewer writes: *"A Shapiro-Wilk test on your residuals is highly significant, so the normality assumption is clearly violated and the results are not reliable."* You fit the model and run the check:

```r
ex_fit <- lm(weight ~ Time + Diet, data = ChickWeight)
shapiro.test(residuals(ex_fit))
nrow(ChickWeight)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The Shapiro-Wilk test returns W = 0.94571 with a p-value of 1.032e-13, which reads like an emphatic rejection. The size of W matters as much as the p-value here: at 0.95 it is close to the 1.0 you would get from perfectly normal residuals, while the model has 578 observations. At that sample size the test detects departures far too small to affect the coefficients or their intervals, and a tiny, real departure is exactly what a significant test on a large sample is built to find.

A near-one W attached to a sample this large puts you in the first outcome. Inspect the quantile-quantile plot, where the centre of the distribution tracks the line and the departure is confined to moderately heavy tails, note that least squares inference is reliable at n = 578 by the central limit theorem, and report the check without changing the model. If you want to remove all doubt, add that a bootstrap interval matches the model-based one.

The mistake would be to transform the outcome or switch methods on the strength of the p-value alone. With several hundred observations, a significant Shapiro-Wilk test is what you should expect even when the residuals are close enough to normal for the model to be sound.

</details>

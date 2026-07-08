---
title: "Advanced Regression Lesson 8: Poisson and Negative Binomial Regression"
description: "Model count outcomes with Poisson regression in R: fit the log link, read coefficients as rate ratios, spot overdispersion, and switch to a negative binomial."
keywords: "Poisson regression, negative binomial, count data, overdispersion, glm, glm.nb, rate ratio, log link, dispersion parameter, MASS, R"
mathjax: true
webr: true
curriculum_id: "6.130.8"
post_type: "LESSON"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "8"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Zero-Inflated-and-Hurdle-Models.html"
course_prev: "GAMs-Choosing-Smoothness.html"
lesson_access: "free"
catalog_blurb: "How to model counts and stay honest when they vary more than expected."
---

=== step === cover
::eyebrow Lesson 8 of 13
## Poisson and Negative Binomial Regression

In the last lessons you let a smooth curve bend through your data and learned to check that it was flexible enough. Every one of those models still described a continuous measurement. Now the thing we predict changes shape entirely: it becomes a count.

Meet Amara, who runs a neighbourhood bike-repair co-op. Every evening she writes down a single number: how many bikes came in for repair that day. On a slow Tuesday it is 0. Most days it is 2 or 3. But when the roads are wet, or a weekend race rolls through town, the number jumps, 8, 13, once a frantic 21.

That daily tally is a count, and counts do not behave like the heights and temperatures you have been modelling. They are whole numbers, never negative, bunched near zero with a long tail to the right. Fit an ordinary straight line to them and it will cheerfully predict "-1.4 repairs on a cold Monday" and assume every day is equally noisy, both nonsense here.

This lesson gives counts the model they deserve. The bars below show the shape count data takes, the same lopsided pile-up Amara sees each month: a stack of low days, extra zeros, a thin tail of busy ones. The line is a model trying to trace it. By the end you will know why that first model misses at both ends, and the small change that fixes it.

By the end of this lesson you will be able to:

- Say why ordinary linear regression is the wrong tool for a count
- Fit a Poisson regression in R and read its coefficients as rate ratios
- Spot overdispersion, and switch to a negative binomial model when a Poisson is too confident

**Prerequisites:** you can fit and read [a linear model](OLS-Regression-from-Scratch.html), and you have met the GLM idea and a link function (the logit) in the [earlier regression lessons](GAMs-Choosing-Smoothness.html). Comfortable with logs and exponents (exp is always positive).

::widget count-dist {}

=== step === concept
::eyebrow Why the straight line fails
## A count is not a measurement

The outcome here, `repairs`, is a count: 0, 1, 2, 3, and so on. It has three habits that a straight line cannot respect:

- **It is never negative.** You cannot repair minus two bikes, yet a regression line happily runs below zero.
- **It moves in whole steps.** There is no such thing as 3.7 repairs.
- **Its spread grows with its average.** Quiet days (a mean near 2) barely wobble; busy rainy days (a mean near 5) swing far more. Ordinary regression assumes the noise is the same size everywhere.

Here is Amara's actual record, two months of daily counts, built right here so you can run everything on this page in interactive R:

```r
set.seed(1)
n <- 150
rain <- rbinom(n, 1, 0.4)                    # 0 = dry day, 1 = rainy day
mu   <- exp(1.0 + 0.55 * rain)               # the true average repairs per day
repairs <- rnbinom(n, mu = mu, size = 2.0)   # each day's actual count
bikes <- data.frame(rain = factor(rain, labels = c("dry", "rainy")),
                    repairs = repairs)
c(days = n, zeros = sum(bikes$repairs == 0), busiest = max(bikes$repairs))
#>    days   zeros busiest 
#>     150      27      21
```

The histogram below is those 150 numbers. Notice the pile-up at zero (27 of the 150 days), the peak at 2 to 3, and the thin tail stretching out to 21. That shape, floored at zero and skewed hard to the right, is the fingerprint of count data, and it is exactly what a straight line gets wrong.

::widget chart-plotter {"data":[{"x":2},{"x":2},{"x":1},{"x":3},{"x":3},{"x":4},{"x":3},{"x":3},{"x":4},{"x":2},{"x":0},{"x":1},{"x":1},{"x":0},{"x":0},{"x":5},{"x":5},{"x":2},{"x":2},{"x":3},{"x":3},{"x":2},{"x":3},{"x":4},{"x":1},{"x":9},{"x":0},{"x":3},{"x":2},{"x":2},{"x":0},{"x":0},{"x":0},{"x":2},{"x":3},{"x":0},{"x":5},{"x":0},{"x":1},{"x":0},{"x":16},{"x":5},{"x":5},{"x":0},{"x":2},{"x":21},{"x":5},{"x":7},{"x":6},{"x":7},{"x":8},{"x":2},{"x":1},{"x":2},{"x":3},{"x":3},{"x":0},{"x":3},{"x":2},{"x":2},{"x":1},{"x":1},{"x":0},{"x":4},{"x":6},{"x":1},{"x":2},{"x":10},{"x":4},{"x":16},{"x":3},{"x":2},{"x":1},{"x":3},{"x":7},{"x":0},{"x":3},{"x":1},{"x":2},{"x":1},{"x":0},{"x":1},{"x":4},{"x":2},{"x":3},{"x":0},{"x":2},{"x":4},{"x":0},{"x":1},{"x":3},{"x":2},{"x":7},{"x":6},{"x":5},{"x":9},{"x":3},{"x":0},{"x":6},{"x":5},{"x":11},{"x":3},{"x":0},{"x":3},{"x":2},{"x":0},{"x":4},{"x":4},{"x":3},{"x":0},{"x":2},{"x":6},{"x":1},{"x":1},{"x":4},{"x":6},{"x":5},{"x":4},{"x":2},{"x":8},{"x":5},{"x":4},{"x":3},{"x":0},{"x":9},{"x":2},{"x":0},{"x":4},{"x":0},{"x":5},{"x":3},{"x":3},{"x":1},{"x":13},{"x":0},{"x":8},{"x":2},{"x":0},{"x":7},{"x":2},{"x":1},{"x":3},{"x":4},{"x":1},{"x":1},{"x":2},{"x":3},{"x":1},{"x":0},{"x":15}],"geoms":["histogram"],"x":"repairs","y":"count","code":{"histogram":"ggplot(daily, aes(repairs)) +\n  geom_histogram(bins = 10)"}}

=== step === quiz
::eyebrow Check yourself
## Why not just fit a straight line?

Amara's assistant suggests `lm(repairs ~ rain)`, ordinary least squares. On this count outcome, what is the single most serious problem?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It can predict impossible values (negative or fractional repairs) and assumes constant spread, when the count is floored at 0 and gets noisier as it grows ::ok Exactly. The response is discrete, bounded below, and heteroskedastic by nature. That is a mismatch a straight line cannot fix; it needs a model built for counts.
- Least squares cannot handle a two-level predictor like dry versus rainy
- You must always standardize a count before modelling it ::no Standardizing changes the scale but not the nature of the outcome: it is still discrete and floored at zero, and the line can still predict negatives. Rescaling does not fix the mismatch.

=== step === concept
::eyebrow The right model
## Model the rate, on the log scale

Instead of predicting the count directly, Poisson regression predicts the *average* count, the rate, which we call \(\lambda\) ("lambda"). \(\lambda\) is the expected number of repairs on a day with given conditions: maybe 2.2 on a dry day, closer to 5 on a rainy one.

A **Poisson distribution** describes how a count scatters around that mean. The probability of seeing exactly \(k\) repairs is

\[ P(Y = k) = \frac{\lambda^{k}\, e^{-\lambda}}{k!}, \qquad k = 0, 1, 2, \dots \]

where \(Y\) is the count outcome, \(k\) is a specific value it might take, and \(e \approx 2.718\). This only ever places weight on whole numbers from zero up, exactly the values a count can be. Its single most important property is that its mean and variance are the *same* number:

\[ \mathrm{E}[Y] = \mathrm{Var}[Y] = \lambda. \]

Hold on to that, it is the promise we will later have to break.

Now we connect \(\lambda\) to the predictor. We do not model \(\lambda\) directly, because a straight line can go negative and a rate cannot. Instead we model its logarithm:

\[ \log(\lambda) = \beta_0 + \beta_1 x \quad\Longleftrightarrow\quad \lambda = e^{\beta_0 + \beta_1 x}. \]

Here \(x\) is the predictor (1 for a rainy day, 0 for dry), \(\beta_0\) is the intercept and \(\beta_1\) the slope, both on the log scale. This is the **log link**: whatever the line on the right computes, \(e^{(\cdot)}\) maps it to a positive number, so the predicted rate is always above zero. It is the same link-function idea you met in logistic regression, just a log instead of a logit.

::widget process-flow {"steps":[{"title":"Linear predictor","sub":"b0 + b1*x, any real number"},{"title":"exp() link","sub":"maps it to a positive rate"},{"title":"Rate lambda","sub":"the expected count, always positive"},{"title":"Poisson counts","sub":"the day scatters around lambda"}]}

=== step === tryit
::eyebrow Your turn
## Fit the Poisson model

`glm()` fits it in one line. The only new part versus `lm()` is telling it the response is a Poisson count. Fill in the family and run it.

```r
pois_fit <- glm(repairs ~ rain, data = bikes, family = ____)
summary(pois_fit)
```
::check {"regex":"poisson","gate":true,"difficulty":"beginner","ok":"That is the whole change from lm(): family = poisson tells glm to use the log link and the Poisson likelihood.","no":"The family for counts is poisson. Write family = poisson."}
::solution
```r
pois_fit <- glm(repairs ~ rain, data = bikes, family = poisson)
summary(pois_fit)
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.80467    0.07089  11.351  < 2e-16 ***
#> rainrainy    0.75088    0.09212   8.152 3.59e-16 ***
```

=== step === concept
::eyebrow Reading the model
## Coefficients are rate ratios

On the log scale the coefficients are hard to feel. Exponentiate them and they turn into something concrete: a multiplier on the rate.

```r
pois_fit <- glm(repairs ~ rain, data = bikes, family = poisson)
round(exp(coef(pois_fit)), 2)
#> (Intercept)   rainrainy 
#>        2.24        2.12
```

Read them like this:

- \(e^{\beta_0} = 2.24\) is the **baseline rate**: about 2.2 repairs on a dry day (when \(x = 0\)).
- \(e^{\beta_1} = 2.12\) is the **rate ratio** for rain: a rainy day brings about 2.1 *times* as many repairs as a dry one. Not "2.1 more", 2.1 times as many.

The log link is why effects multiply instead of add. Because \(\lambda = e^{\beta_0} \cdot e^{\beta_1 x}\), flipping rain from 0 to 1 multiplies the whole rate by \(e^{\beta_1}\). A coefficient of 0 gives \(e^{0} = 1\), no effect; a positive coefficient gives a multiplier above 1 (more repairs), a negative one a multiplier below 1 (fewer).

[KEY INSIGHT]
In a Poisson model you almost never report the raw coefficients. You report `exp(coef())`: each one is the factor by which the expected count changes when that predictor rises by one unit.

=== step === quiz
::eyebrow Check yourself
## What does 2.12 mean?

The rainy-day coefficient exponentiates to \(e^{\beta_1} = 2.12\). A local reporter asks Amara to say what that means in one plain sentence. Which is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- On a rainy day she can expect about 2.1 times as many repairs as on a dry day ::ok Right. The exponentiated Poisson coefficient is a multiplicative rate ratio: rainy days run at roughly 2.1 times the dry-day rate.
- On a rainy day she gets about 2.1 more repairs than on a dry day
- About 2.1 percent more repairs happen on rainy days ::no A rate ratio of 2.12 means 2.1 times as many, a 112 percent increase, not 2.1 percent. Read exp(coef) as "times as many".

=== step === concept
::eyebrow The catch
## When the Poisson gets overconfident

Remember the Poisson's defining promise: variance equals mean. That is a strong claim, and real counts break it constantly. Amara's busy days are not just higher on average, they are wildly more variable, one race weekend can triple a quiet Tuesday. When the actual variance runs bigger than the mean, we call it **overdispersion**.

You can measure it. The Pearson dispersion statistic compares the squared residuals to what a Poisson expects:

\[ \hat{\phi} = \frac{1}{\,n - p\,} \sum_{i} \frac{(y_i - \hat{\mu}_i)^2}{\hat{\mu}_i}, \]

where \(y_i\) is the observed count for day \(i\), \(\hat{\mu}_i\) is its fitted rate, \(n\) the number of days and \(p\) the number of estimated coefficients. If the Poisson fits, \(\hat{\phi} \approx 1\). Well above 1 means overdispersion.

```r
# dispersion: the average squared Pearson residual (a Poisson expects about 1)
disp <- sum(residuals(pois_fit, type = "pearson")^2) / pois_fit$df.residual
round(disp, 2)
#> [1] 2.76
```

2.76, nearly three times what a Poisson allows. The counts carry far more spread than the model believes. Why does that matter? Because the Poisson uses that too-small variance to compute its standard errors. Understated variance means understated standard errors, means p-values that look far more significant than they really are. The point estimates are fine; the confidence around them is a fantasy. Toggle the model below: the Poisson line cannot reach the long tail, and the negative binomial stretches to cover it. (The tall zero bar is a separate problem, the one the next lesson tackles.)

::widget count-dist {}

=== step === concept
::eyebrow The fix
## Negative binomial: let the variance off the leash

The negative binomial keeps the log link and the same mean structure, so your coefficients still read as rate ratios. It just adds one extra parameter, \(\theta\) ("theta"), that lets the variance grow beyond the mean:

\[ \mathrm{Var}[Y] = \mu + \frac{\mu^2}{\theta}. \]

Here \(\mu\) is the mean (the same rate \(\lambda\) as before). When \(\theta\) is small, the \(\mu^2/\theta\) term is large and the counts are heavily overdispersed; as \(\theta\) grows toward infinity that term vanishes and the negative binomial collapses back into a Poisson. So the Poisson is just the negative binomial's calm special case.

`glm.nb()` from the MASS package fits it:

```r
library(MASS)
nb_fit <- glm.nb(repairs ~ rain, data = bikes)
summary(nb_fit)
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.8047     0.1033   7.791 6.64e-15 ***
#> rainrainy     0.7509     0.1495   5.022 5.12e-07 ***
#>               Theta:  1.99
```

Look at what changed and what did not. The estimates are essentially identical, 0.75 for rain, which still exponentiates to the same 2.12 rate ratio. But the standard error for rain jumped from 0.092 to 0.150, more than 60 percent wider. That extra width is the honesty the Poisson was hiding. Rain is still clearly significant here, but its true uncertainty is much larger than the Poisson claimed, and on a borderline effect that difference is exactly what flips a "significant" result to "not". A single number confirms the negative binomial is the better description:

```r
AIC(pois_fit, nb_fit)
#>          df      AIC
#> pois_fit  2 769.7494
#> nb_fit    3 673.1145
```

Lower AIC is better, and the negative binomial wins by nearly 100.

=== step === quiz
::eyebrow Putting it together
## Which model should Amara report?

Her dispersion check came back at 2.76, and the AIC preferred the negative binomial by almost 100 (770 versus 673). What should she report, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The negative binomial: the counts are overdispersed (dispersion well above 1), so the Poisson's standard errors are too small, and the NB both fixes the uncertainty and fits far better (lower AIC) ::ok Right. A dispersion near 2.76 and a much lower AIC both say the Poisson understates the spread. Report the NB, with its honest standard errors.
- The Poisson, because both models produced the same coefficient estimates
- Either one is fine, since a dispersion of 2.76 is close enough to 1 ::no 2.76 is nearly three times 1, which is strong overdispersion, not "close enough". The large AIC gap confirms the negative binomial is the better model.

=== step === concept
::eyebrow Go deeper
## References

- [Poisson Regression | R Data Analysis Examples (UCLA OARC)](https://stats.oarc.ucla.edu/r/dae/poisson-regression/) - a full worked Poisson regression in R, from fitting to interpreting rate ratios.
- [Negative Binomial Regression | R Data Analysis Examples (UCLA OARC)](https://stats.oarc.ucla.edu/r/dae/negative-binomial-regression/) - the `glm.nb` companion, including how to decide between Poisson and NB.
- [Ver Hoef and Boveng (2007), Quasi-Poisson vs. Negative Binomial Regression, Ecology 88(11)](https://doi.org/10.1890/07-0043.1) - a clear, practical paper on modelling overdispersed counts.
- [Cameron and Trivedi (2013), Regression Analysis of Count Data, 2nd ed.](https://doi.org/10.1017/CBO9781139013567) - the standard reference for count models.
- [MASS package (Venables and Ripley)](https://cran.r-project.org/package=MASS) - documentation for `glm.nb` and negative binomial GLMs in R.

=== step === complete
## Lesson 8 complete

You can now model a count the way a count deserves: a Poisson regression on the log scale, coefficients read as rate ratios, a dispersion check to catch the Poisson's overconfidence, and a negative binomial when the spread demands it.

But sometimes the trouble is not just spread, it is the zeros themselves, a pile of days when the event simply could not happen. Next, Lesson 9: Zero-Inflated and Hurdle Models, where a two-part model handles counts with far more zeros than even a negative binomial expects.

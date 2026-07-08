---
title: "Advanced Regression Lesson 3: Quantile Regression"
catalog_blurb: "Predict the median and the tails, not just the average, when spread changes."
description: "When the spread of your data grows with x, the mean hides half the story. Fit quantile regression in R with rq(): model the median and the tails, and read the fan."
keywords: "quantile regression, rq, quantreg, check loss, pinball loss, conditional quantile, heteroskedasticity, prediction interval, median regression, R"
post_type: "LESSON"
curriculum_id: "6.130.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "1"
course_total: "1"
course_landing: "R-Advanced-Regression-Course.html"
course_next: ""
course_prev: ""
---

=== step === cover
::eyebrow Lesson 3 of 13
## Quantile Regression

Last lesson, an MM-estimator rescued the rental agency's model from a batch of bad rows. But notice what every method so far has done, ordinary and robust alike: it fits a single line through the **middle** of the data, the conditional mean. Sometimes the middle is not the thing you need to know.

Meet a compensation analyst building a pay model from a 300-person salary survey: annual `income` against `years of experience`. Among people two years in, salaries cluster tightly near **$57k**. Among 18-year veterans, they range from about **$70k to over $150k**. One average-salary line cannot answer her real questions: what is a competitive offer for a senior hire, what is a fair floor, and how much does the pay range widen with experience?

Quantile regression answers all three by fitting a line not just to the average, but to the median and the tails. Toggle the percentiles below and watch the lines **fan apart** as experience grows, the exact shape a single mean line can never show.

By the end of this lesson you will be able to:

- Explain why one mean line hides the story when the spread grows, and name what it cannot tell you
- Define a conditional quantile and the check loss that fits it (the median is just the 50th percentile)
- Fit every percentile at once in R with `rq()`, read the fanning slopes, and turn them into a prediction band
- Know when to reach for quantile regression instead of an OLS interval, and where it breaks

**Prerequisites:** you can fit and read a linear regression with `lm()` (coefficients, and a residual is the gap between actual and predicted), and you know what a percentile is. Lessons 1 and 2 of this course are useful context but not required.

::widget quantile-lines {}

=== step === concept
::eyebrow The problem
## The mean hides the fan

Let us build the analyst's survey so you can see the problem yourself. Each employee has a number of years of experience and an annual income; income rises with experience, but the **spread** of income rises too, junior salaries are packed together while senior salaries are all over the map.

```r
set.seed(1)
n <- 300
experience <- round(runif(n, 1, 20), 1)                                # years on the job
income     <- round(45 + 3.5 * experience + rnorm(n) * (4 + 1.6 * experience), 1)  # salary, in $000s
work <- data.frame(experience, income)
head(work, 4)
#>   experience income
#> 1        6.0   72.1
#> 2        8.1   73.0
#> 3       11.9   79.3
#> 4       18.3   78.1
```

Now fit ordinary least squares, the mean line, and measure the spread of income among juniors versus seniors.

```r
round(coef(lm(income ~ experience, data = work)), 2)   # the single mean line
#> (Intercept)  experience
#>       46.66        3.32
sd(work$income[work$experience < 3])    # spread among juniors (under 3 years)
#> [1] 9.64292
sd(work$income[work$experience > 17])   # spread among seniors (over 17 years)
#> [1] 35.98574
```

OLS reports one story: expected income starts near **$47k** and rises about **$3.3k** for every extra year of experience. Useful, but look at the two standard deviations. Among juniors the incomes sit within about **$9.6k** of each other; among seniors that spread nearly **quadruples to $36k**. When the spread of the outcome changes with a predictor like this, statisticians call it **heteroskedasticity**, and it is precisely what a mean line cannot represent. The single slope says nothing about a fair floor for a senior, a competitive top offer, or how much wider senior pay ranges than junior pay.

=== step === concept
::eyebrow The idea
## What a quantile actually is

To model the spread instead of hiding it, we need to talk about **quantiles**. The \(\tau\)-th quantile of a set of numbers (read \(\tau\) as "tau", a fraction between 0 and 1) is the value that a fraction \(\tau\) of the data falls below. The 0.5 quantile is the **median** (half fall below), the 0.9 quantile is the **90th percentile** (nine in ten fall below), the 0.1 quantile is the **10th percentile**.

A **conditional quantile** \(Q_\tau(y \mid x)\) is the same idea, but computed at a given value of the predictor: among everyone with a particular experience level \(x\), the income that a fraction \(\tau\) of them fall below. See it directly, the 10th, 50th and 90th percentile of income at two experience levels:

```r
round(quantile(work$income[work$experience < 3],  c(0.1, 0.5, 0.9)), 1)  # juniors
#>  10%  50%  90%
#> 43.3 57.3 66.5
round(quantile(work$income[work$experience > 17], c(0.1, 0.5, 0.9)), 1)  # seniors
#>   10%   50%   90%
#>  70.9 105.5 158.4
```

Read those two rows. For juniors the middle 80% of salaries span **$43k to $67k**, a range of about **$23k**. For seniors it is **$71k to $158k**, a range of about **$88k**, almost four times wider. Quantile regression's job is to fit a line to each of these percentiles across the whole range of experience at once, so we get the 10th-percentile line, the median line and the 90th-percentile line, instead of a single mean line.

=== step === widget
::eyebrow The mechanism
## Fitting a line to a percentile: the check loss

OLS fits its line by minimizing squared residuals. Quantile regression swaps in a different, asymmetric loss so that minimizing it lands the line on a chosen percentile. For a residual \(r_i = y_i - \hat{y}_i\) (actual income minus the line's prediction), the **check loss** (also called the pinball loss) for quantile \(\tau\) is

\[ \rho_\tau(r) \;=\; \max\bigl(\tau\, r,\; (\tau - 1)\, r\bigr), \]

and the fitted line for that quantile is the one that minimizes the total:

\[ \hat{\beta}_\tau \;=\; \arg\min_{\beta}\; \sum_{i=1}^{n} \rho_\tau\!\left(y_i - x_i^\top \beta\right). \]

Here \(\tau\) is the quantile level between 0 and 1, \(r_i\) is row \(i\)'s residual, \(x_i^\top\beta\) is the line's prediction, and \(\hat{\beta}_\tau\) are the intercept and slope fitted for quantile \(\tau\). The trick is the asymmetry. A **positive** residual (the line sits below the point, an under-prediction) costs \(\tau\, r\); a **negative** residual (an over-prediction) costs \((1-\tau)\,|r|\).

[KEY INSIGHT]
For the 90th percentile (\(\tau = 0.9\)), under-predicting costs 0.9 per unit but over-predicting costs only 0.1, a 9-to-1 penalty. So the optimizer keeps raising the line until only about 10% of points remain above it, which is exactly the definition of the 90th percentile. For \(\tau = 0.5\) the two penalties are equal at 0.5, so minimizing the check loss just minimizes the sum of absolute residuals, which lands on the median.

Toggle the percentiles below and read the line for each. Press Run to fit one by minimizing this exact loss in a few lines of R.

::widget quantile-lines {}

=== step === quiz
::eyebrow Check yourself
## Where does the 90th line sit?

You fit the \(\tau = 0.9\) line and it lands well **above** the median line. A colleague says "so it is the line drawn through the top 10% of the points." Is that the right way to describe it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, it connects the highest-paid person at each experience level ::no It is not fitted to only the top points. Every row enters the check loss; the asymmetric penalty just pulls the whole line up until the right fraction sits below it.
- No, it is the line positioned so that about 90% of ALL the points fall below it, using every row ::ok Right. The check loss uses all the data. Its 9-to-1 penalty on under-prediction raises the line until roughly 90% of points lie below it, not through the top 10% alone.
- No, it is the median line shifted up by a fixed amount ::no It is not a parallel shift. The 90th-percentile line has its own slope; on heteroskedastic data it is steeper than the median line, so the gap between them grows with x.

=== step === tryit
::eyebrow In R
## Fit every percentile at once with rq()

First, prove the mechanism is nothing more than the check loss: minimize it by hand for the 90th percentile with base R's `optim`.

```r
pinball <- function(b, tau) {
  r <- work$income - (b[1] + b[2] * work$experience)   # residuals for a candidate line
  sum(r * (tau - (r < 0)))                             # the check loss, summed
}
round(optim(c(45, 3), pinball, tau = 0.9)$par, 2)       # intercept, slope
#> [1] 55.48  4.91
```

Inside `pinball`, the one line `r * (tau - (r < 0))` is that check loss written for a whole vector at once: where a residual is positive it charges `tau * r`, where it is negative it charges `(1 - tau)` times the size of the miss, exactly the asymmetric penalty from the formula above. That hand-rolled 90th-percentile line is intercept **55.48**, slope **4.91**. In practice you reach for the `quantreg` package, whose `rq()` fits quantile regressions the way `lm()` fits OLS, and it can do several percentiles in one call. Pass the three quantiles you want to the `tau` argument. Fill in the blank.

```r
library(quantreg)
fit <- rq(income ~ experience, tau = ____, data = work)
round(coef(fit), 2)
```
::check {"regex":"0\\.1.*0\\.5.*0\\.9","gate":true,"difficulty":"intermediate","ok":"That fits the 10th, 50th and 90th percentile lines in one call. Notice the tau=0.9 column matches the 55.48 / 4.91 you found by hand.","no":"Pass all three quantiles as a vector: tau = c(0.1, 0.5, 0.9)."}
::solution
```r
library(quantreg)
fit <- rq(income ~ experience, tau = c(0.1, 0.5, 0.9), data = work)
round(coef(fit), 2)
#>             tau= 0.1 tau= 0.5 tau= 0.9
#> (Intercept)    35.26     48.6    55.48
#> experience      1.91      3.0     4.91
```

The `tau= 0.9` column is intercept **55.48**, slope **4.91**, exactly the line your `optim` call found. `rq()` is just solving that same check-loss problem, more precisely and for all three percentiles at once.

=== step === concept
::eyebrow The payoff
## Reading the fan

You now have all four moves of a quantile-regression analysis. The flow below names them; you have done the first two, and this step does the last two.

::widget process-flow {"steps":[{"title":"Choose the percentiles your decision needs","sub":"a floor, the median, a competitive top: often 0.1, 0.5, 0.9"},{"title":"Fit them together with one rq() call","sub":"pass a vector of tau values; get a line for each"},{"title":"Read how the slopes fan","sub":"non-parallel lines mean the spread changes with x"},{"title":"Predict a band for a new case","sub":"turn the fitted percentiles into a low, middle and high estimate"}]}

Look back at the three slopes: **1.91** for the 10th percentile, **3.0** for the median, **4.91** for the 90th. Each extra year of experience is worth only about **$1.9k** to the bottom earners but nearly **$4.9k** to the top earners. Because those slopes differ, the three lines are **not parallel**: they fan apart as experience grows, which is heteroskedasticity made visible. (Notice too that the median slope, 3.0, sits a little below the OLS slope of 3.32: the heavy upper tail drags the mean up more than the median, a first hint of quantile regression's robustness.)

Now answer the analyst's question. What income band should she expect for a 15-year hire?

```r
round(predict(fit, newdata = data.frame(experience = 15)), 1)
#>   tau= 0.1 tau= 0.5 tau= 0.9
#> 1     63.8     93.6    129.2
```

A fair floor is about **$64k** (10th percentile), a typical offer is **$94k** (median), and a competitive top-of-band offer is about **$129k** (90th percentile). Three numbers that a decision can actually use, none of which the single mean line could give her.

=== step === concept
::eyebrow A fair comparison
## Quantile regression vs an OLS prediction interval

"But `lm()` gives a prediction interval too," you might object. It does, so let us put them side by side. Ask each method for a central 80% band (from the 10th to the 90th percentile) at a junior (2 years) and a senior (18 years).

```r
ols <- lm(income ~ experience, data = work)
newhire <- data.frame(experience = c(2, 18))
round(predict(ols, newhire, interval = "prediction", level = 0.80), 1)   # OLS band
#>     fit  lwr   upr
#> 1  53.3 24.5  82.1
#> 2 106.4 77.6 135.2
round(predict(fit, newdata = newhire), 1)                                # quantile band
#>   tau= 0.1 tau= 0.5 tau= 0.9
#> 1     39.1     54.6     65.3
#> 2     69.6    102.6    143.9
```

The OLS interval is **57.6k wide at both experience levels**: it is forced to be the same width everywhere. It even puts a junior's floor at **$24.5k**, a salary no one in the survey earns. The quantile band adapts: **$39k to $65k** for the junior (a realistic 26k-wide range) and **$70k to $144k** for the senior (74k wide). One is a straitjacket; the other reads the data.

[KEY INSIGHT]
An OLS prediction interval assumes the errors have constant variance and are symmetric and roughly normal, so it must be one width and centered on the mean. Quantile regression assumes none of that: each percentile is fit on its own, so the band can be narrow where the data are tight and wide where they fan out, and skewed if the tails are uneven. As a bonus, the median fit (\(\tau = 0.5\)) minimizes absolute rather than squared error, so like the robust estimators of Lessons 1 and 2 it barely flinches at a lone outrageous salary.

=== step === quiz
::eyebrow Check yourself
## What the fanning slopes tell you

Your OLS slope is **3.32**, but the 90th-percentile slope is **4.91** and the 10th-percentile slope is **1.91**. What is the most complete thing you can conclude?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The top earners simply make more money than the bottom earners ::no True but shallow, and you would know that without quantile regression. The slopes describe how the GAP changes, not just its level.
- One of the three fits must be wrong, since a variable can only have one slope ::no Nothing is wrong. A predictor genuinely has a different effect at different points of the outcome's distribution; that is the whole reason quantile regression exists.
- The pay range widens with experience: each year adds far more at the top than the bottom, so the distribution fans out ::ok Exactly. Non-parallel quantile slopes mean the spread of income grows with experience (heteroskedasticity), the structure the single OLS slope of 3.32 completely hides.

=== step === concept
::eyebrow Stay honest
## When quantile regression breaks

Quantile regression is powerful, not magical. Three cautions keep you out of trouble.

[WARNING]
Because each percentile is fit separately, the lines can **cross** at extreme values of x where the data are thin, giving the nonsense of a 10th-percentile prediction above the 90th. If you see crossing, you have run out of data in that region or need methods that fit the quantiles jointly (non-crossing or smoothed quantile regression).

- **The tails are data-hungry.** Estimating the 5th or 95th percentile well needs many rows, because only a sliver of the data pins down an extreme quantile. A median fit is stable on modest samples; a 99th-percentile fit is not.
- **Each quantile is its own model.** There is no single \(R^2\) or one coefficient to report; you interpret a family of slopes. That richness is the point, but it asks more of your reader.
- **A quantile is not a guarantee.** The fitted 90th-percentile line means "about 10% exceed this," in the data you trained on. Treat it as a calibrated estimate, not a hard ceiling, especially out of sample.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Koenker and Hallock (2001), Quantile Regression, Journal of Economic Perspectives](https://doi.org/10.1257/jep.15.4.143) - the friendly, canonical introduction, by the method's originators.
- [Koenker (2017), Quantile Regression 40 Years On, Annual Review of Economics](https://doi.org/10.1146/annurev-economics-063016-103651) - a modern survey of where the method has gone.
- [quantreg vignette (CRAN)](https://cran.r-project.org/web/packages/quantreg/vignettes/rq.pdf) - the documentation for `rq()`, the function you used, with worked examples.
- [Koenker (2005), Quantile Regression, Cambridge University Press](https://doi.org/10.1017/CBO9780511754098) - the definitive text for the full theory behind the check loss.

=== step === complete
## Lesson 3 complete

You saw a single mean line hide a fan of salaries, defined the conditional quantiles that describe that spread, and learned that the check loss is the one asymmetric penalty that fits a line to any percentile. Then you fit all three at once with `rq()`, read the fanning slopes as heteroskedasticity made visible, turned them into a usable offer band, and saw why that band beats a constant-width OLS interval when the spread changes.

Next, Lesson 4: Ridge Regression and Shrinkage. So far every fit has trusted its coefficients exactly as the data reported them. When predictors are many and correlated, that trust makes the estimates wildly unstable, and you will see how deliberately shrinking the coefficients trades a little bias for a large drop in variance.

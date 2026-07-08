---
title: "Regression Modeling Lesson 8: GLMs Beyond Logistic"
catalog_blurb: "Fit the right model when your outcome is a count or a skewed amount."
description: "Logistic regression is one of a wider family. Model counts with Poisson, skewed amounts with Gamma, spot overdispersion, and match a GLM to your response in R."
keywords: "generalized linear models, GLM in R, Poisson regression, Gamma regression, log link, link function, count data, overdispersion, quasipoisson, negative binomial, rate ratio, offset, glm family"
post_type: "LESSON"
curriculum_id: "6.20.8"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "8"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: ""
course_prev: "Logistic-Regression-Done-Properly.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## GLMs Beyond Logistic

In Lesson 7, Priya stopped predicting a *number* and predicted a *yes or no*: would a given customer buy a pastry? A straight line cannot honour a yes/no, so you swapped `lm()` for `glm(family = binomial)` and let the **logit link** bend the prediction into a probability between 0 and 1.

That swap was your first step out of ordinary regression, and it hid a much bigger idea. Logistic regression is just **one member of a whole family** of models, the *generalized linear models* (GLMs). Change one setting and the same machinery models a count, or a skewed dollar amount, or a proportion. This lesson opens up the rest of that family.

The picture below is Priya's new problem: how many pastries she sells on a morning, plotted against how many people walk past the cart. Those dots are **counts**, whole numbers that never go negative, and, as you will see, a plain straight line through them is not just imperfect, it is impossible.

By the end of this lesson you will be able to:

- Name the three parts of any GLM and see `lm()` and logistic regression as two members of the same family
- Fit a **Poisson regression** for a count and read its coefficients as multiplicative rate ratios
- Spot **overdispersion** and repair it, knowing which part of the model it corrupts (and which it leaves alone)
- Fit a **Gamma regression** for a positive, right-skewed amount, and match any response to the right family and link

**Prerequisites:** Lessons 1 to 7 (you can fit `lm()`, read a coefficient table, and, from Lesson 7, fit `glm()` and interpret a coefficient after transforming it with `exp()`). You know that `exp()` and `log()` undo each other. Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":20,"y":7},{"x":22,"y":2},{"x":24,"y":1},{"x":26,"y":6},{"x":28,"y":2},{"x":30,"y":6},{"x":32,"y":3},{"x":35,"y":5},{"x":37,"y":9},{"x":38,"y":12},{"x":40,"y":3},{"x":42,"y":12},{"x":44,"y":9},{"x":45,"y":7},{"x":48,"y":10},{"x":50,"y":13},{"x":53,"y":7},{"x":55,"y":7},{"x":58,"y":8},{"x":61,"y":11},{"x":63,"y":17},{"x":65,"y":6},{"x":66,"y":19},{"x":70,"y":24},{"x":71,"y":16},{"x":72,"y":7},{"x":75,"y":12},{"x":77,"y":16},{"x":80,"y":36},{"x":83,"y":18},{"x":85,"y":22},{"x":86,"y":23},{"x":88,"y":14},{"x":90,"y":17}],"geoms":["point"],"x":"footfall","y":"pastries"}

=== step === concept
::eyebrow One family, many responses
## One family behind them all

Here is the key idea. Ordinary regression and logistic regression are not two unrelated tools; they are the same machine with a different setting turned. Every **generalized linear model** is built from exactly three parts.

1. A **random component**: the probability distribution you assume for the response. This is the "family". A symmetric spread of numbers is `Normal`; a yes/no is `Binomial`; a count is `Poisson`; a positive skewed amount is `Gamma`.
2. A **linear predictor**: the familiar weighted sum of your predictors, written \( \eta = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \cdots \). The symbol \( \eta \) (the Greek letter "eta") is just a name for that sum; it can be any number, positive or negative.
3. A **link function** \( g \): the bridge that ties the *mean of the response*, written \( \mu \) (the Greek "mu"), to that linear predictor:

\[ g(\mu) = \eta = \beta_0 + \beta_1 x_1 + \cdots \]

The link is the clever part. The linear predictor \( \eta \) roams freely from minus infinity to plus infinity, but a probability must sit in \([0,1]\) and a count must be positive. The link \( g \) does the translating so the two sides can meet.

You have already met two links without knowing the name. Ordinary regression uses the **identity link**, \( g(\mu) = \mu \): the mean *is* the linear predictor, nothing bent. Lesson 7's logistic regression used the **logit link**, \( g(\mu) = \log\!\frac{\mu}{1-\mu} \), which squeezes the line into a probability. Choosing a GLM is really just choosing these three parts, and the flow below is the whole decision.

::widget process-flow {"steps":[{"title":"Random component","sub":"the response distribution: Normal, Binomial, Poisson, Gamma"},{"title":"Linear predictor","sub":"a weighted sum of predictors: eta = b0 + b1 x1 + b2 x2 + ..."},{"title":"Link function","sub":"g ties the mean to that sum: g(mu) = eta"}]}

=== step === quiz
::eyebrow Check yourself
## What actually changes?

You move from `lm(sales ~ temp)` to `glm(bought ~ temp, family = binomial)` for a yes/no outcome. In the language of the three GLM parts, what is the essential thing that changed?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The linear predictor changed: logistic regression uses a curved sum of the predictors instead of a straight one ::no The linear predictor is still the plain straight sum \( \beta_0 + \beta_1 x \) in both models. What differs is the family (Binomial, not Normal) and the link (logit, not identity) wrapped around that same sum.
- The family and the link changed: you assumed a Binomial response and put a logit link between its mean and the same linear predictor ::ok Exactly. The weighted sum of predictors is identical; a GLM swaps the response distribution (the family) and the link function, and that is what turns a line into a probability model.
- The data changed: logistic regression needs a different, specially prepared dataset that ordinary regression cannot use ::no The data is the same table. A GLM does not transform your rows; it changes the assumed distribution of the response and the link between its mean and the predictors.

=== step === concept
::eyebrow When the response is a count
## A straight line cannot model a count

Priya's new question is a **count**: on a given morning she sells some whole number of pastries, 0, 1, 2, and up. A fresh R session starts empty, so we build her log of 250 mornings right here.

```r
set.seed(8)
n <- 250
footfall  <- round(runif(n, 20, 90))                            # people who walked past the cart that morning
pastries  <- rnbinom(n, mu = exp(0.6 + 0.03 * footfall), size = 4)  # pastries sold that day (a count)
daily <- data.frame(footfall, pastries)
head(daily)
#>   footfall pastries
#> 1       53        4
#> 2       35       13
#> 3       76       10
#> 4       66       30
#> 5       43       15
#> 6       70       24
```

Two facts about this column break ordinary regression. First, look at what a straight line predicts on a quiet morning with only 10 passers-by:

```r
straight <- lm(pastries ~ footfall, data = daily)
round(predict(straight, newdata = data.frame(footfall = 10)), 2)
#>     1
#> -2.71
```

Minus 2.71 pastries. A line extends forever in both directions, so it cheerfully predicts a negative count, which is nonsense. Second, the spread of a count is not constant. On slow mornings the pastry numbers are all small and bunched; on busy mornings they range far more widely. Compare the mean and the variance:

```r
round(c(mean = mean(daily$pastries), variance = var(daily$pastries)), 2)
#>     mean variance
#>    10.59    83.29
```

The variance is far larger than the mean, and it grows as the counts grow, exactly the fanning you can see in the plot as footfall rises. Ordinary regression assumes the opposite: one constant spread everywhere. It is the wrong tool for a count.

::widget chart-plotter {"data":[{"x":20,"y":7},{"x":22,"y":2},{"x":24,"y":1},{"x":26,"y":6},{"x":28,"y":2},{"x":30,"y":6},{"x":32,"y":3},{"x":35,"y":5},{"x":37,"y":9},{"x":38,"y":12},{"x":40,"y":3},{"x":42,"y":12},{"x":44,"y":9},{"x":45,"y":7},{"x":48,"y":10},{"x":50,"y":13},{"x":53,"y":7},{"x":55,"y":7},{"x":58,"y":8},{"x":61,"y":11},{"x":63,"y":17},{"x":65,"y":6},{"x":66,"y":19},{"x":70,"y":24},{"x":71,"y":16},{"x":72,"y":7},{"x":75,"y":12},{"x":77,"y":16},{"x":80,"y":36},{"x":83,"y":18},{"x":85,"y":22},{"x":86,"y":23},{"x":88,"y":14},{"x":90,"y":17}],"geoms":["point"],"x":"footfall","y":"pastries"}

[KEY INSIGHT]
A count is a non-negative whole number whose spread grows with its average. A straight line violates both facts: it predicts impossible negatives and assumes one constant spread. The fix is not to torture the data into a line, but to pick a family built for counts.

=== step === concept
::eyebrow Poisson regression
## The log link keeps predictions positive

The natural family for a count is the **Poisson distribution**, which describes how often independent events happen in a fixed window (pastries sold in a morning, calls to a help desk in an hour). A Poisson response is written \( Y \sim \text{Poisson}(\mu) \), where \( \mu \) is its mean, the average count. The Poisson only allows \( \mu > 0 \), so we need a link that keeps the prediction positive no matter what the linear predictor does. That link is the **log link**:

\[ \log(\mu) = \eta = \beta_0 + \beta_1 \, x \]

Undo the log by exponentiating both sides and the mean is forced positive for any \( \eta \) at all:

\[ \mu = e^{\eta} = e^{\beta_0 + \beta_1 x} \]

Since \( e^{\text{anything}} \) is always greater than 0, the impossible negative prediction can never happen again. Fitting it in R is the same `glm()` call you used for logistic regression, with `family = poisson`:

```r
fit_pois <- glm(pastries ~ footfall, family = poisson, data = daily)
round(summary(fit_pois)$coef, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.5317      0.072  7.3826        0
#> footfall      0.0301      0.001 28.8925        0
```

The coefficients live on the **log scale** (because the link is a log), so you cannot read `0.0301` as "0.03 more pastries per passer-by" the way you would in ordinary regression. To make sense of it, you undo the log, which is the whole point of the next step.

=== step === concept
::eyebrow Reading the coefficients
## Rate ratios: exp() turns log-coefficients into multipliers

Because the model is additive on the log scale, it is **multiplicative** on the count scale. Split the mean apart using the rule \( e^{a+b} = e^a \cdot e^b \):

\[ \mu = e^{\beta_0 + \beta_1 x} = e^{\beta_0} \cdot \left(e^{\beta_1}\right)^{x} \]

Read that carefully: every time \( x \) goes up by 1, the mean count is **multiplied** by \( e^{\beta_1} \). That multiplier is called the **rate ratio**. So the way to interpret a Poisson coefficient is to exponentiate it:

```r
round(exp(coef(fit_pois)), 4)
#> (Intercept)    footfall
#>      1.7019      1.0305
```

The `footfall` rate ratio is `1.0305`. One more person walking past multiplies Priya's expected pastry count by 1.0305, that is, a **3% lift** per passer-by. A single person barely matters, but the effect compounds. Ten more people is not "10 times 3%"; it is 1.0305 multiplied by itself ten times:

```r
round(exp(10 * coef(fit_pois)[["footfall"]]), 3)
#> [1] 1.351
```

So 10 extra passers-by multiply her expected pastries by **1.351**, a 35% jump. The intercept's `1.7019` is the expected count when `footfall` is 0, the baseline the multipliers build on. This is the exact same trick as Lesson 7's odds ratios: a log-scale coefficient becomes a plain multiplier once you run it through `exp()`.

=== step === tryit
::eyebrow Your turn
## Fit a Poisson model

Priya wants to model her pastry counts against footfall. Complete the `glm()` call with the family that is built for a count.

```r
# Model a count (pastries) against footfall.
fit <- glm(pastries ~ footfall, family = ____, data = daily)
round(exp(coef(fit)), 4)
```
::check {"regex":"family\\s*=\\s*poisson|poisson\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. family = poisson tells glm() to use the Poisson distribution with its log link, so the fitted mean stays positive and exp() of each coefficient reads as a rate ratio.","no":"Use family = poisson. The Poisson family is the one built for counts, and it brings the log link that keeps the predicted count positive."}
::solution
```r
fit <- glm(pastries ~ footfall, family = poisson, data = daily)
round(exp(coef(fit)), 4)
```

=== step === concept
::eyebrow The Poisson promise
## Poisson assumes the variance equals the mean

The Poisson buys its simplicity with one strong promise. A Poisson distribution has only a single parameter, \( \mu \), and that one number fixes both the average **and** the spread:

\[ \operatorname{Var}(Y) = \mu \]

In words: a Poisson response is supposed to have a variance exactly equal to its mean. But you already measured Priya's counts, mean 10.59, variance 83.29, and the variance was almost eight times the mean. That is a warning sign with a name: **overdispersion**, real counts that vary more than the Poisson promise allows. You do not have to eyeball it; the standard check is the **dispersion statistic**, the average squared Pearson residual per degree of freedom:

\[ \hat{\phi} = \frac{1}{n-p}\sum_{i=1}^{n} \frac{(y_i - \hat{\mu}_i)^2}{\hat{\mu}_i} \]

where \( y_i \) is the observed count, \( \hat{\mu}_i \) the count the model predicts for that row, \( n \) the number of rows and \( p \) the number of coefficients. If the Poisson promise held, \( \hat{\phi} \) would sit near 1.

```r
disp <- sum(residuals(fit_pois, type = "pearson")^2) / fit_pois$df.residual
round(disp, 2)
#> [1] 3.5
```

A dispersion of **3.5**, well above 1, confirms the overdispersion. Priya's mornings are lumpier than a pure Poisson: a passing tour group or a rainy spell adds swings the model does not know about.

[NOTE]
If you have just finished Lesson 5, this should feel familiar. Overdispersion is to Poisson regression what heteroskedasticity was to `lm()`: the model gets the trend roughly right, but its stated *precision* is a lie. Because the Poisson underestimates the true spread, it reports standard errors that are too small, and every p-value looks more convincing than it should.

=== step === concept
::eyebrow The fix
## Quasi-Poisson and the negative binomial

The repair mirrors Lesson 5 exactly: leave the coefficients alone, fix the standard errors. **Quasi-Poisson** does the simplest version. It keeps the same estimates but lets the variance be \( \operatorname{Var}(Y) = \phi\,\mu \), a dispersion \( \phi \) times the mean, and multiplies every standard error by \( \sqrt{\hat{\phi}} \). Here \( \sqrt{3.5} \approx 1.87 \), so the give-or-take on each coefficient grows by about that factor.

```r
fit_quasi <- glm(pastries ~ footfall, family = quasipoisson, data = daily)
round(summary(fit_quasi)$coef, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   0.5317     0.1347  3.9475    1e-04
#> footfall      0.0301     0.0019 15.4490    0e+00
```

The `footfall` estimate is **unchanged** at `0.0301`, but its standard error rose from the Poisson's `0.001` to `0.0019`, the honest, wider value. The effect is still overwhelmingly significant, just less spectacularly so.

The fuller fix is the **negative binomial**, a count distribution with a *second* parameter that models the extra spread directly (rather than just scaling it up afterwards). It lives in the `MASS` package as `glm.nb`:

```r
library(MASS)
fit_nb <- glm.nb(pastries ~ footfall, data = daily)
round(summary(fit_nb)$coef, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.4682     0.1189  3.9394    1e-04
#> footfall      0.0311     0.0019 16.2472    0e+00
```

Again the `footfall` estimate barely moves (`0.0311`) and the standard error matches quasi-Poisson's honest `0.0019`. Reach for quasi-Poisson when you only need trustworthy standard errors; reach for the negative binomial when you want a genuine model of the overdispersion (and honest predictions of how variable the counts are).

=== step === quiz
::eyebrow Check yourself
## What did overdispersion break?

Priya's Poisson model had a dispersion statistic of 3.5. She worries her whole analysis is wrong and the footfall effect must be re-estimated. What has the overdispersion actually damaged?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The footfall coefficient is biased, so the rate ratio of 1.03 is the wrong number and must be re-estimated ::no Overdispersion does not move the coefficient. The Poisson, quasi-Poisson and negative-binomial estimates were all essentially the same (0.0301, 0.0301, 0.0311). It corrupts the standard error, not the estimate.
- Nothing important: a dispersion of 3.5 is close enough to 1 that the plain Poisson model can be used as is ::no A dispersion of 3.5 is far from 1. Left uncorrected, the Poisson reports standard errors that are far too small, so its p-values and confidence intervals are overconfident.
- The standard errors, not the estimate: the plain Poisson understates them, so the fix inflates the give-or-take (quasi-Poisson or negative binomial) while the coefficient stays put ::ok Exactly. Just like heteroskedasticity in Lesson 5, overdispersion leaves the trend unbiased but makes the reported precision too optimistic. You correct the standard error and keep the coefficient.

=== step === concept
::eyebrow When the response is an amount
## A positive, right-skewed amount

Counts are not the only response that breaks a straight line. Priya's second new question is about **money**: how much does a single customer spend? That is a positive, continuous **amount**, and amounts have their own shape. Most customers spend a little, a few splurge, and nobody spends a negative sum, so the histogram of spends piles up on the left and trails off to the right. That is a **right skew**, and it is exactly what ordinary regression's symmetric, bell-shaped errors cannot represent.

The picture below is a sample of Priya's customer spends. Notice the long right tail, and that the whole thing sits above zero.

::widget chart-plotter {"data":[{"x":3.67},{"x":11.03},{"x":4.72},{"x":7.5},{"x":36.72},{"x":11.86},{"x":16.12},{"x":26.7},{"x":10.26},{"x":8.72},{"x":32.35},{"x":9.41},{"x":12.77},{"x":8.59},{"x":1.96},{"x":9.85},{"x":9.66},{"x":19.61},{"x":1.55},{"x":18.38},{"x":56.22},{"x":11.84},{"x":9.52},{"x":7.49},{"x":9.84},{"x":10.45},{"x":15.24},{"x":5.4},{"x":10.05},{"x":8.78},{"x":13.91},{"x":17.66},{"x":54.74},{"x":2.41},{"x":23.94},{"x":9.14}],"geoms":["histogram"],"x":"spend"}

=== step === concept
::eyebrow Gamma regression
## Gamma models a skewed amount

The family built for a positive, right-skewed amount is the **Gamma distribution**. It is strictly positive and skewed, so it fits the shape above without any awkward transformation. And like the Poisson, its spread grows with its mean, but faster: for a Gamma response the variance grows with the *square* of the mean,

\[ \operatorname{Var}(Y) = \phi\,\mu^2 \]

so a customer with a large expected spend also varies a lot in dollars, which is just how money behaves. We pair Gamma with the same **log link** we used for counts, so the model stays multiplicative and the predicted amount stays positive. Let us build Priya's spend log (300 customers, where `party` is the group size they came in with) and fit it:

```r
set.seed(11)
m <- 300
party <- sample(1:5, m, replace = TRUE)                           # how many people in the group
spend <- round(rgamma(m, shape = 3, rate = 3 / exp(1.4 + 0.35 * party)), 2)   # dollars that customer spent
cust <- data.frame(party, spend)

fit_gamma <- glm(spend ~ party, family = Gamma(link = "log"), data = cust)
round(summary(fit_gamma)$coef, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   1.3690      0.079 17.3212        0
#> party         0.3737     0.0237 15.7703        0
```

The coefficients are on the log scale again, so we read them exactly as before, by exponentiating into multipliers:

```r
round(exp(coef(fit_gamma)), 4)
#> (Intercept)       party
#>      3.9315      1.4531
```

Each extra person in the group multiplies expected spend by **1.4531**, a 45% increase per head, and the intercept `3.9315` is the baseline expected spend. Same `glm()`, same `exp()` interpretation as Poisson; only the family changed to match a different response.

=== step === tryit
::eyebrow Your turn
## Fit a Gamma model

Model Priya's positive, skewed `spend` against `party` size. Fill in the family, a Gamma with a log link.

```r
# Model a positive, skewed amount (spend) against party size.
fit <- glm(spend ~ party, family = ____, data = cust)
round(exp(coef(fit)), 4)
```
::check {"regex":"Gamma\\s*\\(\\s*link\\s*=\\s*[\"']log","gate":true,"difficulty":"intermediate","ok":"Right. Gamma(link = \"log\") models a positive, right-skewed amount and keeps the model multiplicative, so exp() of each coefficient is a multiplier on the dollar amount.","no":"Use family = Gamma(link = \"log\"). Gamma is the family for a positive skewed amount, and the log link keeps predictions positive and the coefficients readable as multipliers."}
::solution
```r
fit <- glm(spend ~ party, family = Gamma(link = "log"), data = cust)
round(exp(coef(fit)), 4)
```

=== step === concept
::eyebrow Counting fairly
## Rates, not raw counts: the offset

One more count wrinkle earns its own step, because it trips up almost everyone. Suppose Priya's mornings are not all the same length: some days she trades for 4 hours, others for 8. A raw count of pastries then mixes two different things, how *briskly* she sells and how *long* she was open. Comparing raw counts across unequal windows is unfair; what she really wants is a **rate**, pastries per open hour.

A GLM handles this with an **offset**: a predictor forced into the model with its coefficient fixed at exactly 1. Put \( \log(t) \) in, where \( t \) is the exposure (here the hours open), and the log link turns a count model into a rate model:

\[ \log(\mu) = \log(t) + \beta_0 + \beta_1 x \quad\Longleftrightarrow\quad \log\!\left(\frac{\mu}{t}\right) = \beta_0 + \beta_1 x \]

The right-hand form is the giveaway: you are now modelling \( \mu / t \), the count *per unit of exposure*, exactly the rate you wanted. In R it is the `offset` argument:

```r
set.seed(21)
k <- 120
hours <- round(runif(k, 3, 9), 1)                 # hours the cart was open that day
foot2 <- round(runif(k, 20, 90))                  # footfall that day
sold  <- rpois(k, exp(-1.2 + 0.025 * foot2) * hours)   # pastries sold = an hourly rate x hours open
shifts <- data.frame(hours, foot2, sold)

fit_rate  <- glm(sold ~ foot2, family = poisson, offset = log(hours), data = shifts)
round(summary(fit_rate)$coef, 4)
#>             Estimate Std. Error  z value Pr(>|z|)
#> (Intercept)  -1.1326     0.1096 -10.3368        0
#> foot2         0.0236     0.0017  14.1596        0
```

With the offset, `foot2` now describes footfall's effect on the pastries-per-hour *rate*, cleanly separated from how long the cart happened to be open. Leave the offset out and the model would wrongly credit footfall with some of the effect of simply being open longer.

[KEY INSIGHT]
Whenever your counts come from windows of different size, time, area, population, exposure, model the rate with `offset = log(exposure)`, not the raw count. It is the difference between "10 accidents" and "10 accidents per million miles".

=== step === concept
::eyebrow The whole map
## Matching the model to the response

Step back and the pattern is simple: **look at your response, then pick the family and link that fit it.** Every model in this lesson is the same `glm()` call with a different family; the response type chooses it for you.

| Your response | Example | Family | Usual link |
|---|---|---|---|
| A symmetric number | temperature, height | `gaussian` (this is `lm()`) | identity |
| A yes/no | bought / did not buy | `binomial` | logit |
| A count | pastries per day | `poisson` (or `MASS::glm.nb` if overdispersed) | log |
| A rate | pastries per open hour | `poisson` with `offset = log(exposure)` | log |
| A positive skewed amount | dollars spent, claim size | `Gamma(link = "log")` | log |
| A proportion in (0, 1) | fraction of a budget used | `betareg::betareg` | logit |

The recipe below is the same four moves every time, and once you have it, the entire GLM family is just a matter of reading your outcome and looking up the row.

::widget process-flow {"steps":[{"title":"Name the response","sub":"a count, a yes/no, a positive skewed amount, a proportion"},{"title":"Pick the family","sub":"Poisson or negative binomial, binomial, Gamma, beta"},{"title":"Pick the link","sub":"log for counts and amounts, logit for probabilities"},{"title":"Fit and read on the response scale","sub":"glm with family=, then exp() the coefficients"}]}

=== step === quiz
::eyebrow Check yourself
## Pick the family

An insurer asks you to model the **size of a paid claim** in dollars: strictly positive, heavily right-skewed, a few enormous claims stretching a long tail. Which GLM matches this response?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Poisson regression with a log link, because the log link handles the skew ::no Poisson is for a count, a whole number of events. A claim *amount* in dollars is a positive continuous quantity, not a count, and the Poisson's variance-equals-mean rule does not fit money. The log link alone is not enough; the family must match too.
- Gamma regression with a log link, because the response is a positive, right-skewed amount ::ok Exactly. Gamma is the family for a strictly positive, right-skewed amount, and its variance grows with the square of the mean, matching how large claims vary more. The log link keeps predictions positive and the coefficients readable as multipliers.
- Ordinary lm() after ignoring the skew, since with enough claims the estimates average out ::no lm() assumes symmetric, constant-spread errors and can predict negative claim amounts. A large sample does not repair the wrong family; it just makes a confidently wrong model. Match the family to the response instead.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take generalized linear models further:

- [An Introduction to Statistical Learning, ch. 4.6 "Generalized Linear Models" (free PDF)](https://www.statlearning.com/) - the gentle, worked introduction to Poisson and the GLM idea, using the same `glm()` interface.
- [Faraway, Extending the Linear Model with R (2nd ed.) - author page](https://julianfaraway.github.io/faraway/ELM/) - the standard practical R text on count, Gamma and other GLMs, with data and code.
- [MASS reference: glm.nb and negative binomial models (CRAN)](https://cran.r-project.org/package=MASS) - the package documentation for the negative-binomial fit you used for overdispersed counts.
- [Penn State STAT 504: Analysis of Discrete Data (Poisson and offsets)](https://online.stat.psu.edu/stat504/) - free, worked lessons on Poisson regression, rate models with offsets, and checking overdispersion.

=== step === complete
## Lesson 8 complete

You have opened up the whole family that logistic regression belongs to. Every one of them is the same `glm()` call: choose a **family** to match your response, choose a **link** (almost always `log` for counts and amounts, `logit` for probabilities), fit, and read the coefficients as multipliers with `exp()`. You can now model a **count** with `poisson`, catch and repair **overdispersion** with quasi-Poisson or the negative binomial (fixing the standard error, never the estimate, exactly as you did for heteroskedasticity in Lesson 5), turn counts into fair **rates** with an `offset`, and model a positive, skewed **amount** with `Gamma(link = "log")`.

That completes Regression Modeling in R: from the line that minimizes squared error, through its assumptions, its failures and its cures, all the way to a family of models for whatever your response happens to be. Next, put it all together in the section **Quiz**, then carry these tools into classification and beyond.

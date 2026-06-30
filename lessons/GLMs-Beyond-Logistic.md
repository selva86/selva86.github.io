---
title: "Regression Modeling Lesson 8: GLMs Beyond Logistic"
catalog_blurb: "Fit the right model when your outcome is a count or a skewed amount."
description: "Beyond logistic: the GLM family in R. Fit Poisson for counts, Gamma for skewed amounts, read rate ratios, spot overdispersion, match the model to the response."
keywords: "GLM in R, Poisson regression, Gamma regression, glm family, link function, log link, rate ratio, overdispersion, quasipoisson, count data, generalized linear model"
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

In Lesson 7 you modeled a yes/no: will *this* customer buy an iced coffee? Logistic regression handled it by bending a straight line through a link function so its output stayed a valid probability. Here is the secret that lesson was hiding: logistic regression is not a special trick. It is one member of a whole family, and the same move solves a much wider set of problems.

Priya has a new question, and it is not a yes/no. Some days her cart gets **complaints**, and she wants to know what drives them. A complaint count is a whole number: 0 on a calm Tuesday, 4 on a chaotic Saturday. A straight line would happily predict *minus 0.7 complaints*, which is nonsense. The fix is the same family idea, with a different distribution and a different link.

By the end of this lesson you will be able to:

- See `lm` and logistic regression as two cases of one thing, the **generalized linear model**, defined by a family + a linear predictor + a link
- Fit a **Poisson regression** for a count with `glm()` and read its coefficients as **rate ratios**
- Spot **overdispersion** and fix it, reach for **Gamma** when the response is a skewed amount, and match the right model to any response

**Prerequisites:** Lessons 1 to 7 (you can fit `lm()`, and you fit `glm(family = binomial)` and read odds ratios in [Lesson 7](Logistic-Regression-Done-Properly.html)). You can run R. Every new term, family, link, linear predictor, rate ratio, overdispersion, is defined as it appears.

::widget process-flow {"steps":[{"title":"Look at the response","sub":"is it a count, a positive amount, a yes or no, or a rate?"},{"title":"Pick the family","sub":"the distribution that matches: Poisson, Gamma, binomial, Gaussian"},{"title":"Pick the link","sub":"the function tying the average to a straight line: log, logit, identity"},{"title":"Fit with glm","sub":"same engine as lm, one family argument away"}]}

That four-step recipe is the whole lesson. By the end you will run it without thinking.

=== step === concept
::eyebrow The one idea
## Every model so far was a GLM

A **generalized linear model** (GLM) is built from three pieces, and once you see them you see that `lm` and logistic regression were GLMs all along:

1. **The linear predictor** is the familiar straight-line part, a weighted sum of your predictors: \( \eta = \beta_0 + \beta_1 x_1 + \dots + \beta_k x_k \). The Greek letter \( \eta \) ("eta") is just a name for that sum.
2. **The link function** \( g \) connects the linear predictor to \( \mu \), the **mean** (the expected value) of the response: \( g(\mu) = \eta \). The link is what lets a straight line model something that is not itself straight-line shaped.
3. **The family** is the distribution the response follows around that mean, and crucially, *how its variance behaves*.

\[ g(\mu) = \beta_0 + \beta_1 x_1 + \dots + \beta_k x_k \]

Change the family and link, and you change which kind of response you can model, with the *same* fitting machinery underneath. Here is the whole course so far, plus where we are going, in one table:

| Model | Response looks like | Family | Link \( g \) | Coefficients read as |
|---|---|---|---|---|
| Linear regression (`lm`) | any number | Gaussian | identity | added change in the mean |
| Logistic regression | yes / no | binomial | logit | odds ratios (Lesson 7) |
| Poisson regression | a count: 0, 1, 2, ... | Poisson | log | rate ratios (this lesson) |
| Gamma regression | a positive, skewed amount | Gamma | log | multipliers on the mean |

[KEY INSIGHT]
You do not learn a brand-new model for each kind of response. You learn ONE model, the GLM, and choose two settings: the family (what the response is) and the link (how to connect it to a line). Logistic regression was binomial + logit. The rest of this lesson is just other settings.

=== step === concept
::eyebrow The problem
## A count breaks a straight line

Priya logs each day: how many `customers` she served and how many `complaints` she got. The complaint count sits on integer rails, 0, 1, 2, 3, and it clearly climbs on busier days. Plot it.

::widget chart-plotter {"data":[{"x":35,"y":0},{"x":42,"y":0},{"x":48,"y":1},{"x":55,"y":0},{"x":60,"y":1},{"x":68,"y":1},{"x":72,"y":0},{"x":80,"y":1},{"x":88,"y":2},{"x":95,"y":1},{"x":102,"y":2},{"x":110,"y":1},{"x":118,"y":3},{"x":125,"y":2},{"x":130,"y":4}],"geoms":["point"],"x":"customers","y":"complaints"}

Now imagine running an ordinary least-squares line through those rails, the tool from Lesson 1. Two things go wrong, and both are fatal:

- **It predicts impossible values.** The line slopes up, so extend it down to a very quiet day and it predicts a *negative* number of complaints. A count can never be below zero.
- **It assumes the wrong spread.** `lm` assumes the scatter around the line is the same everywhere (constant variance). But counts do not behave that way: a day that averages 0.2 complaints barely varies, while a day that averages 4 swings wildly. For counts, the variance grows *with* the mean.

[KEY INSIGHT]
A count is a non-negative whole number whose variability grows as it gets larger. A straight line, which is unbounded and assumes constant variance, is the wrong shape twice over. We need a family built for counts.

=== step === concept
::eyebrow The fix for counts
## Poisson regression: model the log of the rate

The **Poisson** distribution is the natural model for counts of independent events in a fixed window (complaints in a day, calls in an hour). Its mean \( \mu \) is the expected count, and it is the family we pick. For the link we use the **log**:

\[ \log(\mu) = \beta_0 + \beta_1\,\text{customers} + \beta_2\,\text{weekend} \]

where \( \mu \) is the expected number of complaints. Why the logarithm? Because inverting it gives \( \mu = e^{\beta_0 + \beta_1\,\text{customers} + \beta_2\,\text{weekend}} \), and \( e \) raised to *anything* is positive. The model can never predict a negative count, no matter how the predictors run. That single choice cures the first problem; the Poisson family, whose variance equals its mean, cures the second.

A fresh R session starts empty, so build Priya's daily log first: 180 days, each with the day's `customers`, whether it was a `weekend`, and the resulting `complaints` count. Run this once.

```r
set.seed(2)
n <- 180
days <- data.frame(
  customers = round(runif(n, 30, 130)),    # people served that day
  weekend   = rbinom(n, 1, 0.30)           # 1 = Saturday or Sunday
)
# the true complaint rate rises with customers and on weekends; a bad-batch day adds extra spread
lograte <- -1.6 + 0.011 * days$customers + 0.6 * days$weekend
days$complaints <- rpois(n, exp(lograte) * rgamma(n, shape = 2, rate = 2))
table(complaints = days$complaints)
#> complaints
#>  0  1  2  3  4  6  7
#> 98 48 22  7  2  2  1
```

Fitting is one call, the same `glm()` you used for logistic regression, with `family = poisson` instead of `binomial`. That one word tells R to fit on the log scale with the Poisson variance.

```r
fit <- glm(complaints ~ customers + weekend, data = days, family = poisson)
round(coef(summary(fit)), 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -1.4276     0.2787 -5.1215   0.0000
#> customers     0.0097     0.0029  3.3761   0.0007
#> weekend       0.8842     0.1693  5.2223   0.0000
```

The table reads like `lm`'s, with the same crucial twist as Lesson 7: **the estimates are on the log scale, not the count scale.** The `weekend` coefficient of 0.884 means a weekend *adds* 0.884 to the log of the expected complaint count. Real (its z-value is 5.2, p essentially 0), but not something you can say to Priya yet, so we translate it back, just as you did with odds ratios.

Exactly as exponentiating a logistic coefficient gave an odds ratio, exponentiating a Poisson coefficient turns *adding on the log scale* into *multiplying on the count scale*:

\[ e^{\beta_1} = \frac{\text{expected count at } x+1}{\text{expected count at } x} \]

So \( e^{\beta_1} \) is the **rate ratio**: the factor the expected count is multiplied by for a one-unit rise in that predictor, holding the others fixed. Exponentiate the whole table with its confidence interval in one line.

```r
round(exp(cbind(RR = coef(fit), confint.default(fit))), 3)
#>                RR 2.5 % 97.5 %
#> (Intercept) 0.240 0.139  0.414
#> customers   1.010 1.004  1.015
#> weekend     2.421 1.737  3.374
```

Now it speaks plainly. A **weekend multiplies the expected complaint count by about 2.42**, well over double, with a 95% confidence interval from 1.74 to 3.37 (entirely above 1, so the weekend effect is clearly real). Each extra customer multiplies the rate by 1.010, a touch under 1% more; over ten extra customers that compounds to \( e^{10 \times 0.0097} \approx 1.10 \), about 10% more complaints. The intercept's 0.240 is the expected count on a zero-customer weekday, not meaningful here, which is the usual fate of an intercept when 0 is outside the data.

[WARNING]
A rate ratio multiplies the *expected count*, it does not add to it. "Weekend multiplies by 2.42" depends on the baseline: 2.42 times a quiet 0.3 is still under 1 complaint, but 2.42 times a busy 2.0 is nearly 5. Always combine the rate ratios back into a predicted count (next step) before you plan staffing around them.

=== step === quiz
::eyebrow Check yourself
## What does the weekend rate ratio mean?

The fitted Poisson model gives a `weekend` coefficient of **0.884** on the log scale, whose exponential is about **2.42**. Priya asks you what that 2.42 means. Which statement is correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A weekend adds 2.42 complaints to the day ::no A rate ratio multiplies, it does not add. The 2.42 scales the *expected count* by a factor; it does not bolt 2.42 complaints onto every weekend. On a quiet weekend with a baseline of 0.3 expected, the weekend effect lands you at about 0.7, not 2.7.
- A weekend multiplies the expected number of complaints by about 2.42, holding customers fixed ::ok Exactly. exp(0.884) = 2.42 is the rate ratio: at the same customer count, the model expects about 2.42 times as many complaints on a weekend. It is a multiplier on the expected count, which you would still turn into an actual predicted count for any given day.
- A weekend makes a complaint about 2.42 times more probable for each customer ::no That is the logistic (odds/probability) reading from Lesson 7, applied to the wrong model. Poisson does not model a per-customer probability of "complaint vs no complaint"; it models the expected *count* of complaints, and 2.42 multiplies that count.

=== step === tryit
::eyebrow Your turn
## Predict expected complaints

Priya wants the actual expected complaint count for four kinds of day, not the log scale. As in Lesson 7, `predict()` defaults to the link (log) scale; you must ask for `type = "response"` to get a count back. Fill in the blank, then check it.

```r
new <- data.frame(customers = c(40, 90, 90, 130),
                  weekend   = c(0,  0,  1,   1))
new$expected <- round(predict(fit, newdata = new, type = ____), 2)   # we want an expected count
new
```
::check {"regex":"[\"']response[\"']","gate":true,"difficulty":"intermediate","ok":"Right. type = response returns expected counts: 0.35 on a quiet weekday, 0.57 for a busier weekday, 1.39 once that busy day is a weekend, and 2.05 on a packed weekend. Same model, finally on a scale Priya can staff against.","no":"Ask for the response scale: type = \"response\" (in quotes). The default, type = \"link\", returns the log of the expected count, which Priya cannot use directly."}
::solution
```r
new <- data.frame(customers = c(40, 90, 90, 130),
                  weekend   = c(0,  0,  1,   1))
new$expected <- round(predict(fit, newdata = new, type = "response"), 2)
new
#>   customers weekend expected
#> 1        40       0     0.35
#> 2        90       0     0.57
#> 3        90       1     1.39
#> 4       130       1     2.05
```

=== step === concept
::eyebrow When Poisson breaks
## Overdispersion: more spread than Poisson allows

The Poisson family makes one strong promise: the variance equals the mean,

\[ \operatorname{Var}(Y) = \mu. \]

Real counts often break it. A "bad batch" day or a rude customer triggers a *cluster* of complaints, so the data scatters more than a clean Poisson would. This is **overdispersion**: \( \operatorname{Var}(Y) > \mu \). It does not bias your coefficients, but it makes the standard errors too small, so p-values look more impressive than they should. Always check for it. The diagnostic is the **dispersion statistic**, the average squared Pearson residual per degree of freedom; near 1 is healthy, well above 1 is overdispersed.

```r
pearson    <- residuals(fit, type = "pearson")
dispersion <- sum(pearson^2) / df.residual(fit)
round(dispersion, 2)
#> [1] 1.3
```

At 1.3 the data is modestly overdispersed, more spread than pure Poisson, enough to widen our error bars. The simplest fix is the **quasi-Poisson** family: it keeps the identical point estimates but inflates every standard error by \( \sqrt{1.3} \approx 1.14 \) to tell the honest story.

```r
fit_q <- glm(complaints ~ customers + weekend, data = days, family = quasipoisson)
round(coef(summary(fit_q)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  -1.4276     0.3181 -4.4878   0.0000
#> customers     0.0097     0.0033  2.9584   0.0035
#> weekend       0.8842     0.1932  4.5761   0.0000
```

The estimates are untouched (weekend is still 0.884, rate ratio 2.42), but `customers`' standard error grew from 0.0029 to 0.0033 and its p-value from 0.0007 to 0.0035. Both effects survive; we are just honestly less certain. When overdispersion is severe, the **negative binomial** model (`MASS::glm.nb`) is the standard heavier-duty alternative, and the rarer opposite, a dispersion well below 1, signals underdispersion.

=== step === concept
::eyebrow Beyond counts
## Gamma for a skewed positive amount

Counts are not the only response that breaks `lm`. Consider how many dollars a single customer spends. It is **continuous** (so not Poisson), strictly **positive**, and **right-skewed**: most tickets are small, a few are large, and the spread fans out as the average climbs. Here is a sample of Priya's tickets.

::widget chart-plotter {"data":[{"x":2.1},{"x":2.8},{"x":3.2},{"x":3.5},{"x":3.9},{"x":4.1},{"x":4.4},{"x":4.6},{"x":4.9},{"x":5.0},{"x":5.2},{"x":5.5},{"x":5.8},{"x":6.1},{"x":6.4},{"x":6.9},{"x":7.2},{"x":7.8},{"x":8.4},{"x":9.1},{"x":10.2},{"x":11.5},{"x":13.0},{"x":15.4}],"geoms":["histogram"],"x":"spend"}

That long right tail is exactly the **Gamma** family's home: a distribution for positive, skewed amounts whose variance grows with the *square* of the mean, \( \operatorname{Var}(Y) \propto \mu^2 \). Pair it with the same log link (keeping predictions positive and coefficients multiplicative), and the fit is one familiar call.

```r
set.seed(5)
m <- 200
tickets <- data.frame(
  member = rbinom(m, 1, 0.40),    # 1 = loyalty member
  hot    = rbinom(m, 1, 0.50)     # 1 = a hot day
)
# mean spend rises for members and on hot days; gamma noise makes it positive and right-skewed
mu_spend      <- exp(1.4 + 0.30 * tickets$member + 0.25 * tickets$hot)
tickets$spend <- round(rgamma(m, shape = 4, rate = 4 / mu_spend), 2)
gfit <- glm(spend ~ member + hot, data = tickets, family = Gamma(link = "log"))
round(exp(cbind(mult = coef(gfit), confint.default(gfit))), 3)
#>              mult 2.5 % 97.5 %
#> (Intercept) 4.195 3.773  4.664
#> member      1.425 1.247  1.629
#> hot         1.162 1.018  1.326
```

Because the link is again the log, the coefficients again read as multipliers on the mean. Baseline spend (a non-member on a cool day) is about **$4.20**; being a `member` multiplies the average ticket by **1.43** (about 43% more), and a `hot` day by 1.16. Same engine, same multiplicative reading, a different family chosen to fit the shape of money.

=== step === concept
::eyebrow The recipe
## Matching the model to the response

You now have the whole skill: look at the response, pick the family and link that fit it, and let `glm()` do the rest. This is the table to keep.

| If your response is... | Example for Priya | Use family | with link |
|---|---|---|---|
| any real number | tomorrow's revenue | Gaussian (plain `lm`) | identity |
| yes or no | will this person buy | binomial | logit |
| a count: 0, 1, 2, ... | complaints in a day | Poisson | log |
| an over-dispersed count | complaints with bad-batch spikes | quasi-Poisson / negative binomial | log |
| a positive, skewed amount | dollars a customer spends | Gamma | log |
| a proportion of trials | 7 refunds out of 50 sales | binomial | logit |

Powerful as it is, a GLM is honest only if you respect its limits:

- **Effects are multiplicative, not additive.** With a log or logit link you read `exp(coef)`, a multiplier; a "constant rate ratio" is not a constant change in the count. Decide from predicted values, not raw coefficients.
- **The family is an assumption about the variance, so check it.** Overdispersion for counts (the dispersion statistic), residual patterns for Gamma. The wrong family does not error out, it just lies quietly through its standard errors.
- **A GLM is still linear on the link scale.** If the true effect bends (a U-shape in temperature), no link fixes that; you need splines or a GAM, the next stop beyond this course.
- **Significance is still not size or cause.** As in Lessons 6 and 7, a tiny p-value means an effect is *real*, not large (read the rate ratio) and not causal (that lives in how the data was gathered).

=== step === quiz
::eyebrow Check yourself
## Match the response to the model

Priya wants to model the **dollar amount** each customer spends, so she can predict revenue per visit. The amount is always positive, has no fixed upper limit, and is right-skewed: most tickets are small, a few are large. Which GLM fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Poisson regression with a log link ::no Poisson is for *counts*, whole numbers like 0, 1, 2 complaints. Spend is a continuous, skewed amount ($4.92, $7.80), not a count, so the Poisson promise that the variance equals the mean does not fit it. The log link is right; the family is wrong.
- A Gamma model with a log link ::ok Right. Spend is positive, continuous and right-skewed, with variance that grows as the amount grows, exactly what the Gamma family describes. The log link keeps predictions positive and makes the coefficients read as multipliers on the mean.
- Ordinary linear regression (lm) on the raw amount ::no An ordinary line assumes constant variance and a symmetric spread, and can predict a negative dollar amount for a quiet customer. Skewed, positive money breaks both assumptions, which is precisely the case Gamma exists for.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take GLMs further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous intro; its Poisson-regression section mirrors exactly what we did here.
- [Beyond Multiple Linear Regression, Roback & Legler (free online book)](https://bookdown.org/roback/bookdown-BeyondMLR/) - a whole free book on Poisson, negative binomial and the wider GLM, with worked R.
- [UCLA OARC: Poisson regression in R](https://stats.oarc.ucla.edu/r/dae/poisson-regression/) - a careful worked example of fitting, reading rate ratios, and checking overdispersion.
- [R documentation: family()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/family.html) - the menu of every family and link `glm()` accepts, the settings you choose from.

=== step === complete
## Lesson 8 complete

You can now reach past logistic regression to the whole **generalized linear model** family. A GLM is three choices, a **family** (what the response is), a **linear predictor** (the straight-line part), and a **link** (how to connect them), and `lm` and logistic regression are just two settings of it. For a count you fit `glm(family = poisson)`, read coefficients as **rate ratios** (`exp(beta)`, a multiplier on the expected count), predict with `type = "response"`, and check for **overdispersion**, switching to quasi-Poisson or negative binomial when the variance outruns the mean. For a positive, skewed amount you reach for **Gamma** with a log link. The skill underneath all of it is one habit: look at your response, then match the family and link to it.

That completes Regression Modeling in R. You started by fitting a single line to minimize squared error and finished able to model numbers, yes/no outcomes, counts and skewed amounts, all from the one idea of a linear predictor seen through the right link. From here, the Classification and Boosting courses pick up where a linear-on-the-link model stops bending.

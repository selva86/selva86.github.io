---
title: "Advanced Regression Lesson 11: Beta and Ordinal Regression"
catalog_blurb: "How to model a proportion bounded in 0 to 1, and an ordered rating."
description: "Model bounded outcomes in R: fit beta regression for a proportion in (0,1) with betareg, and proportional-odds ordinal regression for ordered ratings with polr."
keywords: "beta regression, betareg, proportional odds, ordinal regression, polr, cumulative logit, logit link, bounded outcome, proportion, ordered categorical, GLM, R"
post_type: "LESSON"
curriculum_id: "6.130.11"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "11"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Mixed-Models-Random-Intercepts.html"
course_prev: "Gamma-and-Tweedie-Regression.html"
---

=== step === cover
::eyebrow Lesson 11 of 13
## Beta and Ordinal Regression

Last lesson your outcomes were amounts of money: strictly positive, but free to climb as high as they liked. Now the outcomes hit walls they cannot cross.

Meet Maya, a data scientist on a customer-success team. For every company that pays for her product she watches two numbers. The first is **seat utilisation**: of the licences a customer bought, what fraction are actually being used this month. That number lives between 0 and 1 and can never leave: you cannot use 120% of your seats, or minus 10%. The second is an analyst's quarterly **health rating**, one of three ordered rungs: *at risk*, then *stable*, then *healthy*. It has an order (healthy beats stable beats at risk) but no numbers: "healthy" is not "3 units" of anything.

Neither outcome fits on the open number line that ordinary regression assumes. A proportion is trapped inside an interval; a rating is trapped inside a short, ordered ladder. This lesson gives each its own model, and both turn out to lean on the same tool you met in logistic regression: the **logit link**. Toggle the panel below to **Beta** to see the shape of the first one.

By the end of this lesson you will be able to:

- Say why ordinary regression is the wrong tool for a proportion in the interval (0, 1), and fit a **beta regression** instead
- Read a beta model's coefficients as odds ratios on the mean proportion, not as amounts added
- Fit a **proportional-odds** model to an ordered rating, and read it as a cumulative odds ratio plus predicted category probabilities

**Prerequisites:** you can fit and read [a linear model](OLS-Regression-from-Scratch.html), and you have met the GLM idea, the logit link, and reading `exp(coef)` as a multiplier in [logistic regression](Logistic-Regression-Done-Properly.html) and the [count-model lesson](Count-Models-Poisson-and-Negative-Binomial.html). Comfortable with odds and log-odds (the logit is the log of the odds).

::widget glm-family-shapes {}

=== step === concept
::eyebrow Why the straight line fails
## A proportion cannot leave the interval from 0 to 1

Maya's first outcome is `active_frac`, the fraction of paid seats a customer actually used this month. Here is her book of 300 accounts, built right here so every line on this page runs in interactive R. Onboarding hours and the plan tier push utilisation up through a logit link, and the actual fraction is a genuine Beta draw around that mean, so it always lands strictly inside (0, 1):

```r
set.seed(2026)
n <- 300
onboarding <- round(runif(n, 0, 8), 1)                         # hours of guided onboarding
plan       <- factor(sample(c("basic", "pro"), n, replace = TRUE, prob = c(0.6, 0.4)))

eta <- -0.7 + 0.25 * onboarding + 0.6 * (plan == "pro")        # a linear predictor, on the logit scale
active_frac <- rbeta(n, plogis(eta) * 12, (1 - plogis(eta)) * 12)   # seats-active fraction, always in (0,1)

# The same onboarding also drives an ordered health rating; we return to it later.
z <- -1.6 + 0.45 * onboarding + rlogis(n)
health <- ordered(ifelse(z < 0, "at risk", ifelse(z < 2.4, "stable", "healthy")),
                  levels = c("at risk", "stable", "healthy"))

accounts <- data.frame(onboarding, plan, active_frac = round(active_frac, 3), health)
head(accounts, 4)
#>   onboarding  plan active_frac  health
#> 1        5.6 basic       0.691  stable
#> 2        4.5 basic       0.634 healthy
#> 3        1.1   pro       0.680 at risk
#> 4        2.3 basic       0.629 at risk
```

Plot utilisation against onboarding and two facts jump out. The cloud is **pinned between 0 and 1** (no point can escape the floor or the ceiling), and it climbs along a gentle **S**, steep in the middle and flattening as it nears either wall. A straight line respects neither.

::widget chart-plotter {"data":[{"x":6.9,"y":0.645,"fill":"basic"},{"x":2,"y":0.498,"fill":"pro"},{"x":4.6,"y":0.944,"fill":"pro"},{"x":0,"y":0.413,"fill":"pro"},{"x":2.9,"y":0.62,"fill":"pro"},{"x":0,"y":0.465,"fill":"basic"},{"x":2.5,"y":0.509,"fill":"pro"},{"x":0.5,"y":0.504,"fill":"pro"},{"x":1.5,"y":0.709,"fill":"pro"},{"x":1.1,"y":0.484,"fill":"pro"},{"x":0,"y":0.329,"fill":"basic"},{"x":4.8,"y":0.883,"fill":"pro"},{"x":0.1,"y":0.54,"fill":"pro"},{"x":3.5,"y":0.656,"fill":"basic"},{"x":0.7,"y":0.225,"fill":"pro"},{"x":7.4,"y":0.931,"fill":"basic"},{"x":2.4,"y":0.455,"fill":"basic"},{"x":5.1,"y":0.848,"fill":"pro"},{"x":7.1,"y":0.953,"fill":"basic"},{"x":1.6,"y":0.47,"fill":"pro"},{"x":5,"y":0.91,"fill":"pro"},{"x":5.8,"y":0.716,"fill":"pro"},{"x":6.9,"y":0.805,"fill":"basic"},{"x":1.6,"y":0.792,"fill":"basic"},{"x":6.3,"y":0.653,"fill":"basic"},{"x":7.7,"y":0.826,"fill":"basic"},{"x":7.4,"y":0.67,"fill":"basic"},{"x":1.6,"y":0.263,"fill":"basic"},{"x":1.7,"y":0.401,"fill":"basic"},{"x":6.1,"y":0.875,"fill":"basic"},{"x":2.7,"y":0.333,"fill":"basic"},{"x":6.3,"y":0.555,"fill":"basic"},{"x":6.6,"y":0.739,"fill":"basic"},{"x":3.3,"y":0.51,"fill":"pro"},{"x":1.4,"y":0.669,"fill":"basic"},{"x":4.7,"y":0.93,"fill":"pro"},{"x":0.4,"y":0.519,"fill":"basic"},{"x":1.3,"y":0.816,"fill":"pro"},{"x":3.5,"y":0.427,"fill":"basic"},{"x":3.7,"y":0.504,"fill":"basic"},{"x":0.3,"y":0.137,"fill":"basic"},{"x":3.3,"y":0.588,"fill":"pro"},{"x":3.1,"y":0.459,"fill":"pro"},{"x":4.5,"y":0.575,"fill":"pro"},{"x":5.1,"y":0.758,"fill":"basic"},{"x":1.6,"y":0.198,"fill":"basic"},{"x":5.9,"y":0.816,"fill":"basic"},{"x":1,"y":0.265,"fill":"basic"},{"x":3.8,"y":0.508,"fill":"basic"},{"x":0.8,"y":0.333,"fill":"basic"},{"x":6.4,"y":0.551,"fill":"pro"},{"x":1.8,"y":0.687,"fill":"pro"},{"x":2.5,"y":0.691,"fill":"pro"},{"x":7.3,"y":0.78,"fill":"pro"},{"x":1.1,"y":0.83,"fill":"pro"},{"x":4.6,"y":0.599,"fill":"basic"},{"x":0.5,"y":0.243,"fill":"basic"},{"x":1.1,"y":0.653,"fill":"pro"},{"x":0.6,"y":0.624,"fill":"pro"},{"x":5.9,"y":0.59,"fill":"pro"},{"x":1.9,"y":0.395,"fill":"basic"},{"x":3.1,"y":0.629,"fill":"basic"},{"x":7,"y":0.791,"fill":"pro"},{"x":7.9,"y":0.846,"fill":"pro"},{"x":7.9,"y":0.74,"fill":"basic"},{"x":6.6,"y":0.884,"fill":"pro"},{"x":4.7,"y":0.547,"fill":"basic"},{"x":0.3,"y":0.512,"fill":"pro"},{"x":1.4,"y":0.216,"fill":"basic"},{"x":5.7,"y":0.857,"fill":"basic"},{"x":5.2,"y":0.645,"fill":"basic"},{"x":2,"y":0.359,"fill":"basic"},{"x":1.1,"y":0.401,"fill":"basic"},{"x":5.6,"y":0.882,"fill":"basic"},{"x":6.1,"y":0.828,"fill":"pro"},{"x":7,"y":0.9,"fill":"basic"},{"x":5,"y":0.622,"fill":"basic"},{"x":7,"y":0.808,"fill":"basic"},{"x":5.2,"y":0.772,"fill":"basic"},{"x":3.5,"y":0.737,"fill":"pro"}],"geoms":["point"],"x":"onboarding","y":"active_frac","code":{"point":"ggplot(usage, aes(onboarding, active_frac, colour = group)) +\n  geom_point(size = 2) +\n  ylim(0, 1) +\n  labs(colour = \"plan\", y = \"seats active (fraction)\")"}}

Fit a straight line anyway and it breaks at the wall. Ask it for the utilisation of a heavily onboarded pro account and its 95% prediction interval runs clean **past 1.0**, predicting a real chance of using more than 100% of the seats, which is impossible:

```r
lm_fit <- lm(active_frac ~ onboarding + plan, data = accounts)
round(predict(lm_fit, data.frame(onboarding = c(0.5, 8), plan = "pro"), interval = "prediction"), 3)
#>     fit   lwr   upr
#> 1 0.509 0.252 0.767
#> 2 0.900 0.642 1.158
```

There is a second, quieter problem. A proportion's spread is not constant: an account sitting near 0.5 can swing a lot, but one already at 0.95 has almost nowhere to move, so its variance is squeezed against the ceiling. Ordinary regression assumes the noise is the same size everywhere. It is not.

=== step === concept
::eyebrow The right model
## Beta regression: a mean trapped in (0, 1), spread that shrinks at the walls

The **beta distribution** is the natural home for a continuous proportion. It only ever produces values strictly between 0 and 1, and we describe it with two numbers that map onto exactly what Maya cares about. Its **mean** \(\mu\) ("mu") is the typical proportion, and its **precision** \(\phi\) ("phi") says how tightly the values cluster around that mean. The variance follows from both:

\[ \mathrm{E}[Y] = \mu, \qquad \mathrm{Var}[Y] = \frac{\mu\,(1-\mu)}{1+\phi}, \]

where \(Y\) is the observed proportion. Look at what that variance does: the \(\mu(1-\mu)\) on top is largest at \(\mu = 0.5\) and falls to zero as \(\mu\) approaches either 0 or 1. That is the exact "squeezed at the walls" behaviour you just saw in the scatter, built into the distribution for free. A larger \(\phi\) shrinks the spread everywhere.

The second half of the model is the **link**, and it is the logit from logistic regression. We do not model \(\mu\) with a straight line, because a line runs past 0 and 1 and a proportion cannot. We model its **log-odds**:

\[ \operatorname{logit}(\mu) = \log\!\frac{\mu}{1-\mu} = \beta_0 + \beta_1 x \quad\Longleftrightarrow\quad \mu = \frac{1}{1 + e^{-(\beta_0 + \beta_1 x)}}, \]

where \(x\) is a predictor (say onboarding hours), \(\beta_0\) the intercept and \(\beta_1\) the slope, both on the log-odds scale. The linear part is free to roam from minus infinity to plus infinity, but the logit squashes it back into (0, 1), so the predicted mean utilisation is always a legal proportion. That squashing is the S-curve in the scatter.

[KEY INSIGHT]
Beta regression keeps the predicted mean inside (0, 1) with a logit link, and its variance automatically shrinks near the walls. It is the default model for a continuous proportion or rate: seat utilisation, market share, the fraction of a budget spent.

Toggle the panel to **Beta** and you can see the shape it fits: a hump that lives entirely between 0 and 1, never spilling over either edge.

::widget glm-family-shapes {}

=== step === tryit
::eyebrow Your turn
## Fit the beta model

The `betareg` package fits it in one line, and the syntax is the `response ~ predictors` formula you already know. There is no `family` to set: `betareg` uses the logit link on the mean by default. Fill in the formula so it models `active_frac` from `onboarding` and `plan`, then run it.

```r
library(betareg)
bfit <- betareg(____, data = accounts)
summary(bfit)
```
::check {"regex":"active_frac\\s*~[\\s\\S]*onboarding[\\s\\S]*plan","gate":true,"difficulty":"beginner","ok":"Right. The proportion active_frac is the response; onboarding and plan are the predictors. betareg models the log-odds of the mean with a logit link, and estimates the precision phi at the same time.","no":"The response is the proportion, active_frac, and the predictors are onboarding + plan: active_frac ~ onboarding + plan."}
::solution
```r
library(betareg)
bfit <- betareg(active_frac ~ onboarding + plan, data = accounts)
summary(bfit)
#> Coefficients (mean model with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.69013    0.06906  -9.993   <2e-16 ***
#> onboarding   0.23392    0.01486  15.738   <2e-16 ***
#> planpro      0.62476    0.06942   9.000   <2e-16 ***
#>
#> Phi coefficients (precision model with identity link):
#>       Estimate Std. Error z value Pr(>|z|)
#> (phi)  12.1107     0.9568   12.66   <2e-16 ***
```

The three mean-model coefficients are the log-odds intercept and slopes. The single `(phi)` at the bottom is the estimated precision, 12.1: one number describing how tightly the accounts hug their fitted means.

=== step === concept
::eyebrow Reading the model
## Coefficients are odds ratios on the mean, not amounts added

The estimates print on the log-odds scale, which is hard to feel. Exponentiate them and each becomes an **odds ratio** on the mean proportion, exactly as in logistic regression:

```r
library(betareg)
bfit <- betareg(active_frac ~ onboarding + plan, data = accounts)
round(exp(coef(bfit)[c("onboarding", "planpro")]), 3)
#> onboarding    planpro
#>      1.264      1.868
```

Read them through the odds, where the odds of a seat being active are \(\mu / (1-\mu)\):

- \(e^{\beta_1} = 1.264\) for `onboarding`: each extra hour of onboarding multiplies the **odds** of utilisation by about 1.264, roughly 26% higher odds per hour.
- \(e^{\beta_2} = 1.868\) for `plan`: a pro account has about **1.87 times** the odds of utilisation that an otherwise-identical basic account has.

The word "odds" matters. Because the link is a logit and not a straight line, the effect on the proportion **itself** is not a fixed amount: an extra hour moves an account sitting near 0.5 a lot, but barely nudges one already at 0.95 (it is already jammed against the ceiling). To turn the model back into a plain proportion for a specific account, ask `predict` for the response scale:

```r
library(betareg)
bfit <- betareg(active_frac ~ onboarding + plan, data = accounts)
round(predict(bfit, data.frame(onboarding = c(1, 8), plan = c("basic", "pro"))), 3)
#>     1     2
#> 0.388 0.859
```

A basic account one hour into onboarding is predicted to use about **39%** of its seats; a pro account fully onboarded (8 hours) about **86%**. Both are legal proportions, and neither the fit nor its interval can ever escape (0, 1).

[NOTE]
You might be tempted to just take `active_frac` and run `lm`, or to logit-transform it first and then use `lm`. The first spills past the walls, as you saw. The second cannot cope with an exact 0 or 1 in the data (the logit of 0 or 1 is infinite) and it models the mean of the log-odds rather than the mean proportion. Beta regression handles both cleanly and reports the mean on the scale you actually care about.

=== step === quiz
::eyebrow Check yourself
## What does 1.264 mean?

Maya's `onboarding` coefficient exponentiates to \(e^{\beta_1} = 1.264\). Her manager asks her to say, in one plain sentence, what one more hour of onboarding does. Which statement is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- One more hour of onboarding adds about 1.264 to the fraction of seats used ::no That reads it as an additive effect on the proportion, but a proportion cannot rise by 1.264 (it would leave the interval). The logit link makes the coefficient multiplicative, and on the odds, not the fraction.
- One more hour of onboarding raises the fraction of seats used by about 26 percentage points, the same everywhere ::no The 26% is on the odds, not the fraction, and the effect on the fraction is not constant: it is large near 0.5 and tiny near the walls because of the S-shaped logit link.
- One more hour of onboarding multiplies the odds of a seat being active by about 1.264, roughly 26% higher odds ::ok Right. An exponentiated logit-link coefficient is an odds ratio: 1.264 times the odds per hour. Its effect on the proportion itself depends on where the account sits on the S-curve.
- One more hour of onboarding has no interpretable effect until you exponentiate the precision phi ::no Phi controls the spread, not the mean effect. The effect of onboarding on the mean is read from exp of its own coefficient, 1.264.

=== step === concept
::eyebrow A different kind of wall
## An ordered rating is trapped in a short ladder, not a number line

Maya's second outcome is `health`, the analyst's rating: *at risk*, *stable*, *healthy*. It has a clear **order** (healthy is better than stable is better than at risk) but the rungs are not numbers, and the gaps between them are not equal or even known. Two wrong instincts:

- **Code it 1, 2, 3 and run `lm`.** This pretends the gap from at risk to stable is exactly the same size as the gap from stable to healthy, and it happily predicts nonsense like a rating of 2.7. There is no such thing as 2.7 of a rating.
- **Treat the three labels as unordered and run a multinomial model.** That is legal, but it **throws the order away**: it would let the fitted "healthy" probability jump around without any constraint that healthy sits above stable sits above at risk. You are discarding real information.

The model that respects the order is the **proportional-odds** model (also called the cumulative-logit or ordered-logistic model). Instead of one probability, it thinks in **cumulative** ones: the chance of being *at or below* each rung. With \(J\) ordered categories it models each cutoff \(k\) with a logit:

\[ \operatorname{logit}\bigl(P(Y \le k)\bigr) = \theta_k - \beta\,x, \qquad k = 1, \dots, J-1, \]

where \(Y\) is the ordered rating, the \(\theta_k\) ("theta") are ordered **cutpoints** (one threshold per boundary between rungs, \(\theta_1 < \theta_2 < \dots\)), \(x\) is a predictor, and \(\beta\) is a single slope. That one shared \(\beta\), the same for every cutoff \(k\), is the **proportional-odds assumption**: a predictor shifts the whole ladder up or down by the same amount at every boundary. Slide the predictor below and watch the stacked bands move mass smoothly from *low* up to *high*, all in step: that is proportional odds in motion.

::widget ordinal-cumlogit {}

=== step === tryit
::eyebrow Your turn
## Fit the proportional-odds model

`polr` (proportional-odds logistic regression) from the `MASS` package fits it. The one requirement is that the response is an **ordered factor**, which `health` already is (we built it with `ordered()` in the setup). Fill in the function name and run it.

```r
library(MASS)
ofit <- ____(health ~ onboarding, data = accounts, Hess = TRUE)
summary(ofit)
```
::check {"regex":"polr\\s*\\(","gate":true,"difficulty":"beginner","ok":"Right. polr() fits the proportional-odds model. Because health is an ordered factor, polr knows to use cumulative logits and to estimate one slope plus the ordered cutpoints. Hess = TRUE stores the information needed for standard errors.","no":"Use polr(): it is MASS's proportional-odds (ordered logistic) function. It needs the response to be an ordered factor, which health is."}
::solution
```r
library(MASS)
ofit <- polr(health ~ onboarding, data = accounts, Hess = TRUE)
summary(ofit)
#> Coefficients:
#>             Value Std. Error t value
#> onboarding 0.3621    0.05273   6.868
#>
#> Intercepts:
#>                Value   Std. Error t value
#> at risk|stable  1.3375  0.2389     5.5997
#> stable|healthy  3.5471  0.3138    11.3023
#>
#> Residual Deviance: 536.7476
#> AIC: 542.7476
```

One slope (`onboarding`) and two cutpoints, one per boundary between the three rungs. The cutpoints are ordered (1.34 then 3.55), which is what keeps the categories in their proper sequence.

=== step === concept
::eyebrow Reading the model
## One odds ratio, the same at every rung

`polr` prints the slope on the log-odds scale. Exponentiate it and it becomes a **cumulative odds ratio**:

```r
library(MASS)
ofit <- polr(health ~ onboarding, data = accounts, Hess = TRUE)
round(exp(coef(ofit)), 3)
#> onboarding
#>      1.436
```

Each extra hour of onboarding multiplies the odds of landing in a **better** health category (above any given cutoff) by about 1.436. The power of the proportional-odds model is in the phrase "any given cutoff": that **same 1.436** applies at the at-risk-to-stable boundary and at the stable-to-healthy boundary. One number summarises the predictor's effect across the whole ladder.

Turn the model into concrete category probabilities with `predict(type = "probs")`. Watch the mass flow up the ladder as onboarding rises:

```r
library(MASS)
ofit <- polr(health ~ onboarding, data = accounts, Hess = TRUE)
round(predict(ofit, data.frame(onboarding = c(1, 4, 7)), type = "probs"), 3)
#>   at risk stable healthy
#> 1   0.726  0.234   0.040
#> 2   0.472  0.418   0.109
#> 3   0.232  0.502   0.267
```

At one hour of onboarding an account is most likely *at risk* (73%). By four hours the weight has shifted to *stable*. By seven hours *healthy* has grown from 4% to 27%. The whole distribution slides upward, exactly the motion the widget showed.

[KEY INSIGHT]
Proportional odds buys you one slope for the whole ordinal outcome, which is simple to read and to explain. Its cost is the assumption itself: if a predictor really pushes at one boundary but not another, the single shared slope is wrong. Check it (the Brant test, or fit separate slopes and compare); if it fails, use a partial-proportional-odds or multinomial model. And if your categories are not truly ordered, do not use this at all: a plain multinomial is the honest choice.

=== step === quiz
::eyebrow Putting it together
## Which model fits the outcome?

Across this course you have built a toolkit of GLMs for outcomes that break ordinary regression. A team asks you to model the **proportion of a marketing budget that a campaign spends before it ends**, a continuous number strictly between 0 and 1, with most campaigns spending somewhere in the middle. Which model fits this outcome?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A beta regression with a logit link: the outcome is a continuous proportion bounded in (0, 1), where a linear model would predict impossible values and ignore the shrinking spread near the walls ::ok Right. A continuous proportion in (0, 1) is beta regression's home ground: the logit link keeps the mean legal and the beta variance shrinks toward 0 and 1 on its own.
- A proportional-odds model with polr ::no That is for an ordered categorical outcome with a few named rungs (at risk < stable < healthy), not a continuous number. A spend proportion is continuous, so beta regression fits it.
- A Poisson or negative-binomial regression ::no Those model counts, whole numbers of events. A budget-spend fraction is a continuous proportion, not a count, so a count model does not apply.
- An ordinary linear model on the raw proportion ::no A straight line predicts values below 0 and above 1 and assumes constant spread; a proportion violates both, which is exactly why beta regression exists.

=== step === concept
::eyebrow Go deeper
## References

- [Ferrari and Cribari-Neto (2004), Beta Regression for Modelling Rates and Proportions](https://doi.org/10.1080/0266476042000214501) - the foundational paper; introduces the mean-precision parameterisation you used here.
- [Cribari-Neto and Zeileis (2010), Beta Regression in R (Journal of Statistical Software 34:2)](https://doi.org/10.18637/jss.v034.i02) - the paper for the `betareg` package; worked examples, modelling the precision, and diagnostics.
- [McCullagh (1980), Regression Models for Ordinal Data (JRSS-B)](https://doi.org/10.1111/j.2517-6161.1980.tb01109.x) - the origin of the proportional-odds model; where the cumulative-logit idea comes from.
- [UCLA OARC, Ordinal Logistic Regression in R](https://stats.oarc.ucla.edu/r/dae/ordinal-logistic-regression/) - a practical `polr` walkthrough, including how to check the proportional-odds assumption.
- [Venables and Ripley, the MASS package](https://cran.r-project.org/package=MASS) - documentation for `polr`; see `?polr` and the accompanying "Modern Applied Statistics with S".

=== step === complete
## Lesson 11 complete

You can now model outcomes that live inside walls. When the outcome is a continuous proportion trapped in (0, 1), you know an ordinary line predicts impossible values and misreads the spread, so you reach for a **beta regression**: a logit link on the mean, a precision \(\phi\), and coefficients read as odds ratios on the mean proportion. When the outcome is an **ordered rating**, you know that numbering the rungs fakes equal gaps and that a multinomial throws the order away, so you fit a **proportional-odds** model with `polr` and read its single slope as a cumulative odds ratio that holds at every boundary, checking the assumption before you trust it.

Next, Lesson 12: Mixed Models and Random Intercepts. So far every account has been treated as independent. But real data comes in groups (accounts nested inside regions, students inside schools, repeated measures on the same person), and pretending those are independent understates your uncertainty. Mixed models let each group have its own intercept while borrowing strength from the whole, an idea called partial pooling.

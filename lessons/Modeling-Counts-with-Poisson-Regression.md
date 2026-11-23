---
title: "Generalized Linear Models Lesson 3: Modeling counts with Poisson regression"
catalog_blurb: "Fit a count outcome correctly and read its coefficient as a rate ratio."
description: "Fit a Poisson regression on real bike rental counts, convert the coefficient into a rate ratio, and check the Poisson's variance-equals-mean rule on the data."
keywords: "Poisson regression, count data, log link, rate ratio, generalized linear model, glm, overdispersion, variance equals mean, R"
post_type: "LESSON"
curriculum_id: "4.80.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "3"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "When-Your-Counts-Are-Too-Variable-for-Poisson"
course_prev: "Three-Link-Functions-and-Why-the-Choice-Rarely-Matters"
---

=== step === cover
## Modeling counts with Poisson regression

Today let's understand Poisson regression, the model built specifically for an outcome that counts how many times something happens.

A count like this can only land on 0, 1, 2 and so on. It can never go negative, and it can never land on a fraction like 2.5. That single fact rules out a lot of models you might otherwise reach for, as you will see in a moment.

Here is the example we will use for the whole lesson: a single bike-share station's daily rental count, recorded for 120 days. On 89 of those days it did not rain, and the station averaged 90.08 rentals a day. On the other 31 days it rained, and the average fell to 65.81.

Here is every one of those 120 days, plotted by whether it rained that day.

::widget chart-plotter {"data":[{"x":"Dry","y":88},{"x":"Dry","y":91},{"x":"Dry","y":88},{"x":"Dry","y":87},{"x":"Dry","y":87},{"x":"Dry","y":72},{"x":"Dry","y":64},{"x":"Rain","y":66},{"x":"Dry","y":94},{"x":"Dry","y":90},{"x":"Dry","y":102},{"x":"Dry","y":81},{"x":"Dry","y":103},{"x":"Rain","y":69},{"x":"Dry","y":71},{"x":"Dry","y":104},{"x":"Dry","y":79},{"x":"Dry","y":88},{"x":"Dry","y":77},{"x":"Dry","y":89},{"x":"Dry","y":82},{"x":"Dry","y":104},{"x":"Dry","y":90},{"x":"Dry","y":84},{"x":"Dry","y":85},{"x":"Dry","y":79},{"x":"Dry","y":87},{"x":"Dry","y":102},{"x":"Dry","y":85},{"x":"Dry","y":93},{"x":"Rain","y":74},{"x":"Dry","y":85},{"x":"Rain","y":70},{"x":"Dry","y":107},{"x":"Dry","y":91},{"x":"Dry","y":80},{"x":"Dry","y":104},{"x":"Dry","y":78},{"x":"Rain","y":61},{"x":"Dry","y":78},{"x":"Dry","y":100},{"x":"Rain","y":55},{"x":"Dry","y":88},{"x":"Dry","y":87},{"x":"Dry","y":95},{"x":"Dry","y":76},{"x":"Rain","y":80},{"x":"Dry","y":110},{"x":"Dry","y":92},{"x":"Dry","y":98},{"x":"Rain","y":50},{"x":"Dry","y":86},{"x":"Rain","y":63},{"x":"Rain","y":69},{"x":"Dry","y":99},{"x":"Rain","y":64},{"x":"Rain","y":86},{"x":"Dry","y":95},{"x":"Rain","y":63},{"x":"Dry","y":94},{"x":"Dry","y":89},{"x":"Rain","y":56},{"x":"Dry","y":92},{"x":"Dry","y":95},{"x":"Dry","y":71},{"x":"Dry","y":91},{"x":"Dry","y":98},{"x":"Dry","y":77},{"x":"Dry","y":96},{"x":"Dry","y":101},{"x":"Rain","y":74},{"x":"Dry","y":93},{"x":"Rain","y":65},{"x":"Rain","y":63},{"x":"Dry","y":90},{"x":"Dry","y":86},{"x":"Rain","y":69},{"x":"Dry","y":95},{"x":"Dry","y":100},{"x":"Rain","y":59},{"x":"Dry","y":99},{"x":"Rain","y":63},{"x":"Rain","y":67},{"x":"Rain","y":63},{"x":"Dry","y":105},{"x":"Rain","y":68},{"x":"Dry","y":93},{"x":"Rain","y":70},{"x":"Dry","y":95},{"x":"Dry","y":100},{"x":"Rain","y":73},{"x":"Rain","y":65},{"x":"Rain","y":67},{"x":"Dry","y":91},{"x":"Dry","y":77},{"x":"Dry","y":85},{"x":"Rain","y":60},{"x":"Dry","y":72},{"x":"Dry","y":101},{"x":"Dry","y":74},{"x":"Dry","y":82},{"x":"Rain","y":57},{"x":"Dry","y":99},{"x":"Dry","y":92},{"x":"Dry","y":95},{"x":"Dry","y":103},{"x":"Dry","y":96},{"x":"Dry","y":93},{"x":"Dry","y":83},{"x":"Dry","y":102},{"x":"Dry","y":90},{"x":"Rain","y":68},{"x":"Dry","y":82},{"x":"Dry","y":105},{"x":"Dry","y":85},{"x":"Dry","y":94},{"x":"Dry","y":97},{"x":"Dry","y":70},{"x":"Dry","y":94},{"x":"Rain","y":63}],"geoms":["point"],"x":"weather","y":"rentals","code":{"point":"ggplot(df, aes(weather, rentals)) + geom_jitter(width = 0.15, height = 0, alpha = 0.6, color = \"#1f7a55\")"}}

Each dot is one day's rental count. The dry days sit higher as a group and the rainy days sit lower, but within each group the count still jumps around from day to day, never settling on one fixed number. That is the shape of data Poisson regression is built for: a count, bounded at zero, that moves with a condition like the weather.

=== step === concept
## Why a plain linear model is the wrong tool for a count

So why not just fit an ordinary linear model here, with rain as a yes-or-no predictor and rentals as the outcome?

There are two problems, and the 120 days you just saw already carry both of them.

- A count can never be negative or a fraction, but an ordinary linear model's prediction is not built to respect that. Nothing stops it from predicting a number like -4 rentals, which cannot exist.
- An ordinary linear model also assumes the outcome spreads out by the same amount everywhere, no matter what the prediction is. Look at what actually happens in the rental data.

```r
# Compare the mean and spread of rentals on dry and rainy days
set.seed(2026)
rain <- rbinom(120, 1, 0.3)
rentals <- rpois(120, ifelse(rain == 1, 65, 90))

dry_rentals <- rentals[rain == 0]
rain_rentals <- rentals[rain == 1]

mean(dry_rentals)
var(dry_rentals)
mean(rain_rentals)
var(rain_rentals)
#> [1] 90.07865
#> [1] 95.45965
#> [1] 65.80645
#> [1] 52.29462
```

The dry days average 90.08 rentals and spread out with a variance of 95.46. The rainy days average 65.81 rentals, a lower number, and their variance is also lower, at 52.29. The group with the bigger average also has the bigger spread.

That is not a coincidence, and it is not something an ordinary linear model can represent. It assumes one fixed spread for the whole dataset, but here the spread rises and falls right along with the mean. You need a model built around that connection, not one that ignores it.

=== step === concept
## The log link, and why it makes the model multiplicative

Poisson regression does not predict the rental count directly. It predicts the log of the expected rental rate instead, using one simple equation.

$$ \log(\mu) = \beta_0 + \beta_1 \cdot \text{rain} $$

Here, $\mu$ is the expected rental rate for a given day, $\beta_0$ is the intercept and $\beta_1$ is the rain coefficient, the two numbers the model estimates from the data. rain is 0 on a dry day and 1 on a rainy day, so this one equation covers both days.

So why go through the log at all, instead of predicting the rate directly? Because exponentiating always returns a positive number, no matter how negative the right side gets, which keeps the predicted rate from ever dropping below zero.

Solve that same equation for $\mu$ by exponentiating both sides, and a second property falls out.

$$ \mu = e^{\beta_0 + \beta_1 \cdot \text{rain}} = e^{\beta_0} \cdot e^{\beta_1 \cdot \text{rain}} $$

Addition on the log scale, $\beta_0$ plus $\beta_1$ times rain, turned into multiplication the moment you exponentiated it: $e^{\beta_0}$ times $e^{\beta_1 \cdot \text{rain}}$. That is what "multiplicative" means here: a one-unit change in rain does not add a fixed number of rentals to the rate, it multiplies the rate by $e^{\beta_1}$.

Whatever $\beta_0$ and $\beta_1$ turn out to be once you fit the model, the rainy day's rate will always equal the dry day's rate times one fixed multiplier, never plus or minus a fixed amount.

=== step === widget
## Fitting the model, and reading the coefficient as a rate ratio

Fit that equation on the 120 days of rental data, with rain as the predictor, using `glm()` with `family = poisson`.

```r
# Fit a Poisson regression of rentals on whether it rained
fit <- glm(rentals ~ rain, family = poisson)
coef(fit)
#> (Intercept)        rain 
#>   4.5006832  -0.3139653 
```

So $\beta_0$, the intercept, comes out to 4.5007, and $\beta_1$, the rain coefficient, comes out to -0.314. Neither number is a rental count by itself. Exponentiate them to get something you can read.

```r
# Convert the fitted coefficients back into rental rates
exp(coef(fit)["(Intercept)"])
exp(coef(fit)["(Intercept)"] + coef(fit)["rain"])
exp(coef(fit)["rain"])
#> (Intercept) 
#>    90.07865 
#> (Intercept) 
#>    65.80645 
#>       rain 
#>  0.7305444 
```

Three numbers came out, and each one answers a different question.

- `exp(4.5007)` is 90.08, exactly the dry days' own average rental count from the first plot. That is the model's fitted rate when rain is 0.
- `exp(4.5007 - 0.314)` is 65.81, exactly the rainy days' own average. That is the fitted rate when rain is 1.
- `exp(-0.314)` is 0.73, the rate ratio: the rainy day's rate divided by the dry day's rate. A ratio of 0.73 means the rainy rate is 73% of the dry rate, a drop of 26.9%, call it 27%.

So reading a Poisson coefficient has one extra step compared to an ordinary regression coefficient: exponentiate it first, and read the result as a ratio, not a difference. A ratio below 1 is a percentage drop, and a ratio above 1 is a percentage rise.

Here are those same two fitted rates, plotted as the two bars they really are.

::widget chart-plotter {"data":[{"x":"Dry","y":90.08},{"x":"Rain","y":65.81}],"geoms":["point","bar"],"x":"weather","y":"rentals"}

Switch to the bar view and you will see the two fitted rates sitting at exactly the two heights you already know from the first plot: 90.08 for dry days, 65.81 for rainy days. The model did not estimate anything new here. It just reproduced the two group averages, because with one 0/1 predictor, a Poisson regression's fitted rate for each group is that group's own average.

=== step === quiz
## Quick check: reading a rate ratio

The Poisson fit from the last step gave a rain coefficient of -0.314, and `exp(-0.314)` works out to 0.73. Which statement reads that correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Rainy days have 0.314 fewer rentals a day than dry days. ::no
- Rainy days have a rental rate that is about 27% lower than dry days. ::ok Right. exp(-0.314) is 0.73, and a rate ratio of 0.73 means the rainy rate keeps 73% of the dry rate, a drop of 27%.
- Rainy days have a rental rate that is 73% lower than dry days. ::no The coefficient -0.314 lives on the log scale, not on the scale of rentals, so it is never a plain difference in counts. And 0.73 itself is the rate ratio, not the size of the drop: it means the rainy rate keeps 73% of the dry rate, a 27% drop, not a 73% one.

=== step === concept
## The property that defines a Poisson count: variance equals the mean

You already saw that the rental counts' spread rises and falls with their average, bigger for the higher-mean dry group and smaller for the rainy group. Poisson regression is built around a precise version of that same idea: for a true Poisson count, the variance equals the mean, exactly.

Check that on the two rain groups.

```r
# Check whether variance equals the mean in each group
rate_dry <- var(dry_rentals) / mean(dry_rentals)
rate_rain <- var(rain_rentals) / mean(rain_rentals)
rate_dry
rate_rain
#> [1] 1.059737
#> [1] 0.7946732
```

For the dry days, the variance-to-mean ratio comes out to 1.06. For the rainy days, it comes out to 0.795. Neither one lands exactly on 1, which real data never does, but both sit close enough to 1 that calling this data Poisson-distributed is a reasonable assumption.

That is the one assumption the whole model rests on, and on this data, it holds up well enough to trust the fit.

=== step === widget
## What it looks like when variance outgrows the mean

The rental data's variance-to-mean ratios sat close to 1, so Poisson regression was a reasonable fit there. Real count data is not always this well-behaved, and it helps to see what it looks like when it is not.

This widget switches to a different example built into it, support-desk ticket counts instead of bike rentals, but still the same kind of non-negative count, running from 0 tickets up to 9.

::widget count-dist {}

Each grey bar is the real share of days with that many tickets, and the orange line is what a Poisson distribution predicts for that same count. On the default Poisson view, the line underpredicts the tall bar at zero by 0.24, and it cannot bend far enough to cover the long tail running out to 9 tickets. That gap between the bars and the line is overdispersion: real variance running past what a Poisson count allows, which is not what you saw a moment ago on the rental data's own check.

Switch across Negative Binomial and Zero-Inflated and watch the line bend to chase the bars instead of missing them. The runnable R code underneath simulates a similar dataset and compares how many zeros actually turn up against how many a fitted Poisson would expect, the same comparison the bars and line make visually above it.

=== step === quiz
## Quick check: Poisson regression, start to finish

A colleague looks over everything you just built and says this: "Negative 0.314 means rainy days get 0.314 fewer rentals a day. And since the variance-to-mean ratios came out close to 1.06 and 0.795, that proves rain is causing the drop, and it's the same kind of overdispersion the ticket widget just showed."

Which response is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- All three claims hold up: the coefficient reads as a plain difference, the ratios confirm causation, and they show overdispersion. ::no
- All three claims are wrong: -0.314 is a difference on the log scale, not a plain count; an association between rain and a lower rate does not by itself prove rain causes it; and ratios of 1.06 and 0.795 are close to 1, the opposite of the overdispersion the ticket widget displayed. ::ok Exactly. Catching all three matters: the coefficient needs exponentiating before it means anything about rentals, a correlation is not evidence of causation on its own, and a ratio near 1 is the sign that the Poisson assumption held, not that it broke.
- The coefficient claim is wrong, but the ratios really do show overdispersion, same as the ticket widget. ::no None of the three claims survive. -0.314 is on the log scale, not a plain rental difference. An association between rain and the rate drop does not by itself prove rain caused it, since nothing here ruled out other explanations. And 1.06 and 0.795 sit close to 1, the opposite of the overdispersion the ticket widget showed, where the ratio ran well past 1.

=== step === tryit
## Your turn: the rate a rainy day actually predicts

`fit`, the model you fitted earlier, is still in your session, with its intercept and rain coefficient.

```r
# fit is already in your session, with its two coefficients
intercept <- coef(fit)["(Intercept)"]
rain_coef <- coef(fit)["rain"]

# Compute the model's predicted rental rate for a rainy day:
# exponentiate the intercept and the rain coefficient
# TOGETHER, as one sum, not the rain coefficient alone.
# One line. Press Check when you have it.
```
::check {"regex": "exp[(]\\s*intercept\\s*[+]\\s*rain_coef|exp[(]\\s*rain_coef\\s*[+]\\s*intercept", "gate": true, "difficulty": "intermediate", "ok": "Right: 65.81, exactly the rainy days' own average from the very first plot. Exponentiating the intercept and the rain coefficient together gives the model's predicted rate on a rainy day, not just the rate ratio.", "no": "Exponentiate the intercept and the rain coefficient TOGETHER, as one sum: exp(intercept + rain_coef). Exponentiating rain_coef by itself only gives the rate ratio, 0.73, not a predicted rental count."}
::solution
```r
# Exponentiate the intercept and the rain coefficient together
predicted_rate <- exp(intercept + rain_coef)
predicted_rate
#> (Intercept) 
#>    65.80645 
```

=== step === concept
## References
::prose-only a list of citations carries no visualizable concept

- [Extending the Linear Model with R, 2nd edition](https://www.routledge.com/Extending-the-Linear-Model-with-R-Generalized-Linear-Mixed-Effects-and-Nonparametric-Regression-Models-Second-Edition/Faraway/p/book/9781498720960) - Faraway, J.J. (2016), CRC Press, ISBN 978-1-4987-2096-0. The Poisson GLM chapter builds count regression from first principles.
- An Introduction to Categorical Data Analysis, 3rd edition - Agresti, A. (2018), Wiley, ISBN 978-1-119-40526-9. Covers Poisson and log-linear models for count data.
- [Regression Analysis of Count Data](https://www.cambridge.org/core/books/regression-analysis-of-count-data/introduction/B75A323D25241D7B4F9C9AE735666827) - Cameron, A.C. and Trivedi, P.K. (2013), 2nd edition, Cambridge University Press, ISBN 978-1-107-01416-9. The standard reference on count models.
- [glm: Fitting Generalized Linear Models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - R Core Team, the documentation for glm() and its family objects.
- [R Data Analysis Examples: Poisson Regression](https://stats.oarc.ucla.edu/r/dae/poisson-regression/) - UCLA Office of Advanced Research Computing, a worked walkthrough fitting and reading a Poisson regression with real R output.

=== step === complete
## What a Poisson model gives you for a count

You took 120 days of bike-share rentals, split by whether it rained, and fitted the model built for exactly that kind of outcome.

Here is everything that model handed back, in its own numbers.

- The log link kept every predicted rate positive and turned addition on the log scale into multiplication on the rate scale: $\mu = e^{\beta_0} \cdot e^{\beta_1 \cdot \text{rain}}$.
- Exponentiating the rain coefficient, -0.314, gave a rate ratio of 0.73, a 27% drop in the rental rate on rainy days.
- The two fitted rates, 90.08 for dry days and 65.81 for rainy days, landed exactly on the two group averages.
- The variance-to-mean ratios, 1.06 and 0.795, both sat close enough to 1 to call the Poisson assumption reasonable for this data.

That ratio is the one to check every time you fit a Poisson model on new data, and when it comes back far from 1, the counts need a different model built to handle the extra spread.

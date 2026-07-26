---
title: "How to Read lm() Output in R Line by Line"
slug: "Read-lm-Output-in-R"
description: "Confused by lm() output in R? This beginner guide reads every line of the summary(), from residuals and coefficients to R-squared, p-values, and the F-test."
keywords: "lm output in R, interpret lm summary, read regression output R, summary.lm, R-squared, p-value regression, coefficients table, F-statistic, residual standard error"
auto_link_terms: "lm() output|interpret lm() output|read lm output|lm summary output|summary.lm|regression output in R|regression coefficients table|residual standard error|Multiple R-squared|Adjusted R-squared|F-statistic in regression|reading regression output"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-9.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Reading lm() Output"
sidebar_order: "150"
difficulty: "Beginner"
---

<p class="lead">When you fit a model with <code>lm()</code> and call <code>summary()</code> on it, R prints a wall of numbers that can look like a foreign language. This guide reads that output one line at a time, so by the end you can glance at any regression summary and know exactly what each value means and which ones you can trust. Everything here uses base R, no extra packages.</p>

## Where should you look first in lm() output?

The first time you see a regression summary, it feels like too much at once. The trick is to stop reading it as one block and start seeing it as four stacked sections, each answering a different question. Let's fit a real model and print it so we have something concrete to point at.

We will predict a car's fuel economy (`mpg`, miles per gallon) from its weight (`wt`, in thousands of pounds) using the built-in `mtcars` data. Heavier cars burn more fuel, so we expect weight to pull mileage down.

```r title="Fit a simple model and print its summary"
fit1 <- lm(mpg ~ wt, data = mtcars)
summary(fit1)
#> 
#> Call:
#> lm(formula = mpg ~ wt, data = mtcars)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -4.5432 -2.3647 -0.1252  1.4096  6.8727 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  37.2851     1.8776  19.858  < 2e-16 ***
#> wt           -5.3445     0.5591  -9.559 1.29e-10 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 3.046 on 30 degrees of freedom
#> Multiple R-squared:  0.7528,	Adjusted R-squared:  0.7446 
#> F-statistic: 91.38 on 1 and 30 DF,  p-value: 1.294e-10
```

That is the whole printout. Press Run and it appears in your browser in a second. Now look at its shape rather than its numbers: there are four labelled areas separated by blank lines.

![The four stacked blocks of summary() output on an lm model.](screenshots/Read-lm-Output-in-R-anatomy.webp)

*Figure 1: The four stacked blocks of summary() output on an lm model.*

Here is what each block is for, reading top to bottom:

1. **Call** repeats the formula you fitted, so you can confirm R modelled what you meant.
2. **Residuals** summarise how far the predictions missed the actual values.
3. **Coefficients** is the heart of the output: the effect of each predictor, with a measure of how sure we are.
4. **Model fit** (the last three lines) tells you how good the model is overall.

We will walk through all four in that order. The rest of this guide is basically a magnified tour of this one printout.

[KEY INSIGHT]
**The printout is four stacked blocks, not one wall of numbers.** Once you read the Call, Residuals, Coefficients, and model-fit sections as separate answers to separate questions, the whole `summary()` output stops feeling intimidating.

**Try it:** Fit a model that predicts `mpg` from horsepower (`hp`) instead of weight, then pull out just its Multiple R-squared value.

```r title="Your turn: read another model's R-squared"
# Fit mpg on horsepower, then read the Multiple R-squared from its summary.
ex_hp <- lm(mpg ~ hp, data = mtcars)
# Next step: call summary(ex_hp) and find the Multiple R-squared value.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: R-squared for mpg on horsepower"
ex_hp <- lm(mpg ~ hp, data = mtcars)
summary(ex_hp)$r.squared
#> [1] 0.6024373
```

**Explanation:** `summary()` returns an object, and `$r.squared` pulls the R-squared straight out of it. Horsepower alone explains about 60 percent of the variation in mileage, a bit less than weight did.

</details>

## What is the Call line telling you?

The top block is the easiest to read and the easiest to skip, which is a mistake. The `Call` line simply echoes the formula and data you gave to `lm()`. Its job is to let you confirm, at a glance, that R fitted the model you intended.

Let's pull the Call out on its own so you see it clearly.

```r title="Show the model's Call"
fit1$call
#> lm(formula = mpg ~ wt, data = mtcars)
```

This says the response is `mpg`, the single predictor is `wt`, and the data came from `mtcars`. The tilde `~` reads as "is modelled by", so `mpg ~ wt` means "mpg is modelled by wt".

Why does this matter? Because it is your receipt. If you meant to control for horsepower and the Call shows only `wt`, you caught the mistake before drawing any conclusions. If you filtered your data first, the Call reminds you which version of the data went in.

[NOTE]
**The Call reflects the last fit, so trust it over your memory.** When you refit a model in a long session it is easy to lose track of which formula is current. Reading the Call line first, every time, saves you from interpreting the wrong model.

**Try it:** Fit a model of `mpg` on horsepower and read back its Call line to confirm the formula.

```r title="Your turn: confirm a model's formula"
# Fit mpg on hp, then print the Call to confirm the formula.
ex_call_fit <- lm(mpg ~ hp, data = mtcars)
# Next step: print ex_call_fit$call
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: read back the Call"
ex_call_fit <- lm(mpg ~ hp, data = mtcars)
ex_call_fit$call
#> lm(formula = mpg ~ hp, data = mtcars)
```

**Explanation:** The Call confirms the predictor is `hp`, not `wt`. Checking this one line prevents you from mixing up two similar models.

</details>

## How do you read the Residuals summary?

Before we judge the model, we need to know how badly it misses. A **residual** is the gap between what actually happened and what the model predicted: actual value minus predicted value. A car whose real mileage is 21 when the model guessed 19 has a residual of +2.

R does not print all 32 residuals. Instead it gives you a five-number summary: the smallest residual, the first quartile (the value a quarter of the residuals fall below), the median, the third quartile (three quarters fall below it), and the largest. Let's reproduce exactly those five numbers.

```r title="Five-number summary of the residuals"
round(quantile(residuals(fit1)), 3)
#>     0%    25%    50%    75%   100% 
#> -4.543 -2.365 -0.125  1.410  6.873 
```

Match these against the `Residuals:` line in the full summary above: `Min` is the 0 percent value (-4.543), `Median` is the 50 percent value (-0.125), and `Max` is the 100 percent value (6.873). They are the same numbers, just relabelled.

What are you checking for here? Two quick things. First, the median should sit close to zero, which means the model is not systematically guessing too high or too low. Ours is -0.125, comfortably near zero. Second, the smallest and largest residuals should be roughly balanced in size. Here the biggest miss is +6.87 (one car did much better than predicted) against -4.54 on the low side, a mild right lean but nothing alarming.

**Try it:** Find the single largest positive residual (the car that beat its prediction by the most) and which car it is.

```r title="Your turn: find the biggest positive residual"
# Store the residuals, then find the largest one and its name.
ex_res <- residuals(fit1)
# Next step: use max(ex_res) for the value and which.max(ex_res) for the car.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: largest positive residual"
ex_res <- residuals(fit1)
round(max(ex_res), 3)
#> [1] 6.873
names(which.max(ex_res))
#> [1] "Fiat 128"
```

**Explanation:** The Fiat 128 got about 6.87 more miles per gallon than a weight-only model expected. Large residuals like this flag cars the model does not explain well, often a hint that another predictor is missing.

</details>

## How do you read the Coefficients table row by row?

This block holds the actual model estimates, so we will slow down. The Coefficients table has one **row** per term (the intercept plus each predictor) and four **columns**. Let's print just the table as raw numbers so nothing is hidden.

```r title="Print the coefficients table on its own"
summary(fit1)$coefficients
#>              Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.285126   1.877627 19.857575 8.241799e-19
#> wt          -5.344472   0.559101 -9.559044 1.293959e-10
```

Read it one column at a time.

The **Estimate** column is the number you came for. For the `wt` row it is -5.34. Because weight is measured in thousands of pounds, this means: for every extra 1,000 pounds of weight, the model expects mileage to drop by about 5.34 miles per gallon. The sign matters as much as the size. Negative confirms our intuition that heavier cars go fewer miles per gallon.

The **(Intercept)** row is the predicted `mpg` when every predictor is zero, so here it is the predicted mileage of a car that weighs zero pounds: 37.29. A weightless car is impossible, so treat the intercept as the anchor point of the line rather than a real forecast. It positions the line; it is not a prediction you would ever use.

The **Std. Error** column measures how much the estimate would move if you collected the data again. A small standard error means the estimate is pinned down tightly. The slope estimate of -5.34 has a standard error of only 0.56, small next to the estimate itself, so weight's effect is measured precisely rather than being a vague guess.

The **t value** column combines the two columns before it. It asks a simple question: how big is the estimate compared to its own uncertainty? You get it by dividing the Estimate by the Std. Error.

$$t = \frac{\hat{\beta}}{SE(\hat{\beta})}$$

Where:

- \\(\hat{\beta}\\) is the estimated coefficient (the Estimate column).
- \\(SE(\hat{\beta})\\) is its standard error (the Std. Error column).

Let's confirm the t value for `wt` is really just that division.

```r title="Rebuild the t value from Estimate and Std. Error"
est_wt <- summary(fit1)$coefficients["wt", "Estimate"]
se_wt  <- summary(fit1)$coefficients["wt", "Std. Error"]
est_wt / se_wt
#> [1] -9.559044
```

That -9.56 matches the `t value` column exactly. A t value of -9.56 means the slope sits more than nine standard errors below zero, which is very far from "no effect". The last column, **Pr(>|t|)**, turns that distance into a probability, and we tackle it in the next section.

![How to read a single coefficient row from left to right.](screenshots/Read-lm-Output-in-R-coef-row.webp)

*Figure 2: How to read a single coefficient row from left to right.*

[KEY INSIGHT]
**A coefficient means nothing without its standard error.** An estimate of -5.34 could be rock solid or pure noise depending on how much it wobbles, which is why R prints the Std. Error, t value, and p-value right beside every Estimate.

**Try it:** Use the intercept and slope to predict the mileage of a car weighing 3,500 pounds (so `wt = 3.5`).

```r title="Your turn: predict mpg from the coefficients"
# Pull the intercept and slope, then combine them for wt = 3.5.
ex_b0 <- coef(fit1)[1]
ex_b1 <- coef(fit1)[2]
# Next step: compute ex_b0 + ex_b1 * 3.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: predicted mpg at wt = 3.5"
ex_b0 <- coef(fit1)[1]
ex_b1 <- coef(fit1)[2]
unname(ex_b0 + ex_b1 * 3.5)
#> [1] 18.57948
```

**Explanation:** Plugging the weight into `intercept + slope * weight` gives about 18.6 mpg. This is exactly what the regression line does for any weight you feed it. `unname()` just drops the leftover label so you see a clean number.

</details>

## What do the significance stars and codes mean?

The last column of the table, `Pr(>|t|)`, is the **p-value**. It answers a cautious question: if this predictor truly had no effect, how often would random sampling alone hand us an estimate this large? A small p-value means "almost never by luck", which is your evidence that the effect is real.

Let's read the two p-values on their own.

```r title="Show the p-values for each term"
summary(fit1)$coefficients[, "Pr(>|t|)"]
#>  (Intercept)           wt 
#> 8.241799e-19 1.293959e-10
```

Both are tiny. The `wt` p-value of 1.29e-10 is 0.000000000129, so weight almost certainly has a real link to mileage. R also refuses to print a p-value below its precision floor, so anything smaller shows as `< 2e-16`, which is why the intercept reads `< 2e-16` in the top printout even though its exact value here is about 8e-19. In the full printout R rounds these and adds a star key so you do not have to squint at exponents. Those are the **significance codes**:

- `***` means the p-value is below 0.001 (strongest evidence).
- `**` means below 0.01.
- `*` means below 0.05, the usual cutoff for "statistically significant".
- `.` means below 0.10 (borderline).
- a blank means above 0.10 (no real evidence).

Both rows earned `***`, so both are strongly supported by the data.

[WARNING]
**Stars measure evidence, not importance.** A predictor can be starred yet barely move the outcome, because a large enough sample makes even trivial effects statistically significant. Always read the Estimate alongside the stars to judge whether an effect is big enough to care about.

**Try it:** Check directly whether the `wt` p-value clears the strongest bar, below 0.001.

```r title="Your turn: test the p-value against 0.001"
# Pull the wt p-value, then compare it to the *** cutoff of 0.001.
ex_p <- summary(fit1)$coefficients["wt", "Pr(>|t|)"]
# Next step: evaluate ex_p < 0.001
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: is the p-value below 0.001?"
ex_p <- summary(fit1)$coefficients["wt", "Pr(>|t|)"]
ex_p < 0.001
#> [1] TRUE
```

**Explanation:** `TRUE` confirms the p-value is under 0.001, which is why R printed three stars next to `wt`.

</details>

## What do the last three lines mean (RSE, R-squared, F-statistic)?

The bottom three lines grade the model as a whole rather than one predictor at a time. Let's pull each number out so we can label it precisely.

```r title="Extract the model-fit statistics"
s <- summary(fit1)
s$sigma
s$r.squared
s$adj.r.squared
s$fstatistic
#> [1] 3.045882
#> [1] 0.7528328
#> [1] 0.7445939
#>    value    numdf    dendf 
#> 91.37533  1.00000 30.00000
```

Here is what each one tells you.

The **Residual standard error** (3.05, printed as `s$sigma`) is the typical size of a prediction miss, in the same units as the response. So a weight-only model is off by roughly 3 miles per gallon on an average car. The "30 degrees of freedom" beside it is the sample size minus the number of things we estimated (32 cars minus 2 coefficients).

The **Multiple R-squared** (0.7528) is the share of the variation in mileage that the model explains, on a 0 to 1 scale. About 75 percent of why cars differ in mileage is captured by weight alone. The formula behind it compares the errors your model still makes to the errors you would make with no predictor at all.

$$R^2 = 1 - \frac{\sum_{i}(y_i - \hat{y}_i)^2}{\sum_{i}(y_i - \bar{y})^2}$$

Where:

- \\(y_i\\) is the actual value for car \\(i\\).
- \\(\hat{y}_i\\) is the model's prediction for that car.
- \\(\bar{y}\\) is the average mileage across all cars.

If you are not interested in the formula, skip it. The plain-English version is enough: R-squared is the fraction of the ups and downs in the outcome that the model accounts for.

The **Adjusted R-squared** (0.7446) is Multiple R-squared with a penalty for the number of predictors. It only rises when a new predictor pulls its weight, which is why it is the fairer number for comparing models of different sizes.

The **F-statistic** (91.38) and its p-value test the whole model at once: is this model better than one with no predictors at all? A large F with a tiny p-value (1.29e-10 here) says yes. For a model with a single predictor, the F-statistic is just the t value squared, which we can check.

```r title="Confirm F equals t squared for one predictor"
t_wt <- summary(fit1)$coefficients["wt", "t value"]
t_wt^2
#> [1] 91.37533
```

That 91.38 is exactly the F-statistic. The single-predictor F-test and the slope's t-test are the same test seen from two angles.

[TIP]
**Compare models with Adjusted R-squared, not Multiple R-squared.** Multiple R-squared can only go up when you add predictors, so it always favours the bigger model. Adjusted R-squared charges a fee for each extra predictor, giving you an honest basis for choosing between models.

**Try it:** Express the residual standard error as a fraction of the average mileage, so you can judge whether a 3 mpg miss is large.

```r title="Your turn: scale the residual standard error"
# Divide the residual standard error by the mean of mpg.
ex_rse <- summary(fit1)$sigma
# Next step: compute ex_rse / mean(mtcars$mpg)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: RSE relative to mean mpg"
ex_rse <- summary(fit1)$sigma
round(ex_rse / mean(mtcars$mpg), 3)
#> [1] 0.152
```

**Explanation:** The typical miss is about 15 percent of average mileage. Scaling the error against the mean turns an abstract 3.05 into something you can actually reason about.

</details>

## How does the output change with more than one predictor?

Real models almost always use several predictors. The good news is that the output keeps the same four-block shape; it just grows an extra row in the Coefficients table for each predictor. Let's add horsepower to the weight model and read the changes.

```r title="Fit a two-predictor model and print it"
fit2 <- lm(mpg ~ wt + hp, data = mtcars)
summary(fit2)
#> 
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#> 
#> Residuals:
#>    Min     1Q Median     3Q    Max 
#> -3.941 -1.600 -0.182  1.050  5.854 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 37.22727    1.59879  23.285  < 2e-16 ***
#> wt          -3.87783    0.63273  -6.129 1.12e-06 ***
#> hp          -0.03177    0.00903  -3.519  0.00145 ** 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 2.593 on 29 degrees of freedom
#> Multiple R-squared:  0.8268,	Adjusted R-squared:  0.8148 
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12
```

There is now an `hp` row. Its estimate is -0.032, meaning each extra unit of horsepower is linked to about 0.03 fewer miles per gallon, and its two stars say that link is well supported. With one more predictor in the mix, the way you read each slope changes slightly: every coefficient is now the effect of its predictor while holding the other predictors fixed. So -3.88 for weight is the mileage drop per 1,000 pounds among cars of the same horsepower.

Notice the weight slope shrank from -5.34 to -3.88. That is not an error. Heavier cars tend to have more horsepower, so in the simple model the weight coefficient absorbed part of horsepower's effect too. Separating the two predictors gives each its own share.

The model-fit lines improved: Residual standard error fell from 3.05 to 2.59, and Adjusted R-squared rose from 0.745 to 0.815. Let's compare the two adjusted values side by side.

```r title="Compare adjusted R-squared across the two models"
round(c(simple = summary(fit1)$adj.r.squared, multiple = summary(fit2)$adj.r.squared), 4)
#>   simple multiple 
#>   0.7446   0.8148
```

Adding horsepower genuinely helped: the adjusted score went up, so the extra predictor earned its place.

[NOTE]
**Multiple R-squared can only rise when you add predictors, even useless ones.** That is why you watch Adjusted R-squared instead. If adjusted goes down after adding a variable, that variable is dead weight and you should drop it.

**Try it:** Add cylinders (`cyl`) as a third predictor and see whether Adjusted R-squared keeps climbing.

```r title="Your turn: add a third predictor"
# Fit mpg on wt, hp, and cyl, then compare its adjusted R-squared to fit2.
ex_fit3 <- lm(mpg ~ wt + hp + cyl, data = mtcars)
# Next step: compare summary(ex_fit3)$adj.r.squared with summary(fit2)$adj.r.squared
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: does cylinders help?"
ex_fit3 <- lm(mpg ~ wt + hp + cyl, data = mtcars)
round(c(two = summary(fit2)$adj.r.squared, three = summary(ex_fit3)$adj.r.squared), 4)
#>    two  three 
#> 0.8148 0.8263
```

**Explanation:** Adjusted R-squared inched up from 0.815 to 0.826, so cylinders add a little, though far less than horsepower did. A tiny gain like this is a judgment call, not an automatic keep.

</details>

## How do you go beyond summary(): confidence intervals and predictions?

The summary shows single best-guess numbers, but a good analyst also wants the range around them and a way to forecast new cases. Two base R functions handle this, and both read straight off the model you already fitted.

First, `confint()` turns each Estimate into a plausible range, called a **confidence interval**. It is the interval within which the true coefficient most plausibly sits.

```r title="Confidence intervals for the coefficients"
round(confint(fit2), 4)
#>               2.5 %  97.5 %
#> (Intercept) 33.9574 40.4972
#> wt          -5.1719 -2.5837
#> hp          -0.0502 -0.0133
```

Read the `wt` row as: the true weight effect is most plausibly between -5.17 and -2.58 mpg per 1,000 pounds. Because that whole range stays below zero, we are confident the effect is genuinely negative, which lines up with its tiny p-value. When a coefficient's interval crosses zero, that predictor is the shaky one.

Next, `predict()` forecasts the outcome for a brand-new car you describe. Let's predict mileage for a car weighing 3,200 pounds with 120 horsepower, and ask for the interval too.

```r title="Predict mpg for a new car with an interval"
new_car <- data.frame(wt = 3.2, hp = 120)
round(predict(fit2, newdata = new_car, interval = "confidence"), 2)
#>     fit   lwr   upr
#> 1 21.01 19.95 22.06
```

The model predicts about 21 mpg, and the interval says the average mileage for cars like this is most plausibly between 19.95 and 22.06.

Numbers this clean can still hide a bad fit, so the last habit is a quick look at the residuals. A residuals-versus-fitted plot should look like a shapeless cloud around zero; a clear curve or funnel means the straight-line model is missing something.

```r title="Plot residuals against fitted values"
plot(fit2, which = 1)
```

Before you trust any summary, run through this short red-flag checklist:

- **A coefficient sign that makes no sense** (weight raising mileage) hints at a data or coding error.
- **A standard error nearly as big as the estimate** means the effect is too noisy to rely on.
- **Adjusted R-squared far below Multiple R-squared** signals you have piled on predictors that do not help.
- **A residual plot with a strong curve or funnel** means a straight line is the wrong shape for this data.

[WARNING]
**Never predict far outside the range of your training data.** The model only saw cars in a certain weight and power range, so asking it about a 100-pound car or a 900-horsepower engine gives a confident number that is really a wild guess.

**Try it:** Ask for a prediction interval instead of a confidence interval for the same car, and notice how much wider it is.

```r title="Your turn: get a prediction interval"
# Reuse the new car, but switch interval to "prediction".
ex_new <- data.frame(wt = 3.2, hp = 120)
# Next step: run predict(fit2, newdata = ex_new, interval = "prediction")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: prediction interval for one car"
ex_new <- data.frame(wt = 3.2, hp = 120)
round(predict(fit2, newdata = ex_new, interval = "prediction"), 2)
#>     fit  lwr   upr
#> 1 21.01 15.6 26.41
```

**Explanation:** The point estimate is still 21, but the interval is much wider (15.6 to 26.41). A confidence interval covers the average car of this type; a prediction interval covers a single specific car, which is inherently harder to pin down.

</details>

## Practice Exercises

These pull together everything above. Each starter block runs as-is, so you can edit and rerun it until the output matches.

### Exercise 1: Pull one predictor's numbers

From a model of `mpg` on `wt` and `hp`, extract just the horsepower row's Estimate and p-value, then decide whether horsepower is significant at the 0.05 level.

```r title="Exercise 1 starter"
# Fit the two-predictor model, then index the "hp" row of the coefficients table.
cap_fit <- lm(mpg ~ wt + hp, data = mtcars)
# Get the Estimate and Pr(>|t|) for hp from summary(cap_fit)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cap_fit <- lm(mpg ~ wt + hp, data = mtcars)
round(summary(cap_fit)$coefficients["hp", c("Estimate", "Pr(>|t|)")], 5)
#> Estimate Pr(>|t|) 
#> -0.03177  0.00145
```

**Explanation:** The p-value 0.00145 is well below 0.05, so horsepower is significant. Indexing the coefficient matrix by row name and column names is the cleanest way to grab one number without eyeballing the printout.

</details>

### Exercise 2: Choose between two models

Compare model A (`mpg ~ wt`) with model B (`mpg ~ wt + hp`) on both Adjusted R-squared and Residual standard error, then say which model you would report.

```r title="Exercise 2 starter"
# Fit both models, then read adj.r.squared and sigma from each summary.
cap_A <- lm(mpg ~ wt, data = mtcars)
cap_B <- lm(mpg ~ wt + hp, data = mtcars)
# Build a small comparison of adjusted R-squared and residual standard error
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cap_A <- lm(mpg ~ wt, data = mtcars)
cap_B <- lm(mpg ~ wt + hp, data = mtcars)
data.frame(
  model = c("wt", "wt + hp"),
  adj_r2 = round(c(summary(cap_A)$adj.r.squared, summary(cap_B)$adj.r.squared), 3),
  rse = round(c(summary(cap_A)$sigma, summary(cap_B)$sigma), 3)
)
#>     model adj_r2   rse
#> 1      wt  0.745 3.046
#> 2 wt + hp  0.815 2.593
```

**Explanation:** Model B wins on both counts: higher Adjusted R-squared (0.815 versus 0.745) and lower typical error (2.59 versus 3.05). When a bigger model improves the adjusted score and shrinks the residual error, it is the one to report.

</details>

### Exercise 3: Rebuild a t value and p-value by hand

For the `wt` coefficient in `mpg ~ wt + hp`, recompute its t value from the Estimate and Std. Error, then turn that into a p-value, and confirm both match the printed table. Use `df.residual()` for the degrees of freedom and `pt()` for the t distribution.

```r title="Exercise 3 starter"
# The pieces you need are in summary(cap_m)$coefficients and df.residual(cap_m).
cap_m <- lm(mpg ~ wt + hp, data = mtcars)
cap_coef <- summary(cap_m)$coefficients
# t = Estimate / Std. Error ; p = 2 * pt(-abs(t), df = df.residual(cap_m))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cap_m <- lm(mpg ~ wt + hp, data = mtcars)
cap_coef <- summary(cap_m)$coefficients
cap_t <- cap_coef["wt", "Estimate"] / cap_coef["wt", "Std. Error"]
cap_p <- 2 * pt(-abs(cap_t), df = df.residual(cap_m))
round(c(t_value = cap_t, p_value = cap_p), 6)
#>   t_value   p_value 
#> -6.128695  0.000001
round(cap_coef["wt", c("t value", "Pr(>|t|)")], 6)
#>   t value  Pr(>|t|) 
#> -6.128695  0.000001
```

**Explanation:** The by-hand t value and p-value match the table to six decimals. The p-value is two-sided (that is the `2 *`), because we test whether the coefficient differs from zero in either direction. Reproducing these numbers is the surest way to know you understand what the table reports.

</details>

## Frequently Asked Questions

### Is a high R-squared enough to trust a model?

No. R-squared only measures how much variation the model explains on the data it was fitted to. A model can score high yet break the straight-line assumptions, so always pair R-squared with a residual plot and, ideally, a check on fresh data.

### What counts as a good R-squared value?

It depends entirely on the field. In physics an R-squared of 0.99 might be routine, while in social science or biology 0.30 can be a strong result. Judge it against typical models for your kind of data, not against a fixed target.

### Why is my intercept significant but meaningless?

The intercept is the predicted outcome when every predictor is zero, which is often impossible (a car cannot weigh zero pounds). Its p-value can still be tiny because the line has to cross the axis somewhere, but that does not make the zero-predictor scenario meaningful. Read the intercept as the line's anchor, not a real forecast.

### What is the difference between Std. Error and Residual standard error?

They measure different things. Std. Error, in the coefficients table, is the uncertainty of one estimated coefficient. Residual standard error, in the bottom block, is the typical size of the model's prediction miss across all cases. One is about a coefficient; the other is about the whole model's accuracy.

### Should I drop a predictor with a high p-value?

Usually you can, but not blindly. A high p-value means weak evidence that the predictor helps, so dropping it often simplifies the model without hurting it. Check that Adjusted R-squared does not fall much after removing it, and keep predictors you have a strong theoretical reason to include.

## Summary

Reading `lm()` output is just a matter of taking it one block at a time and knowing what question each line answers. Here is the whole tour on one card.

| Line in the output | What it answers |
|---|---|
| Call | Did R fit the formula and data I intended? |
| Residuals | How far off were the predictions, and are the misses balanced? |
| Estimate | How much does each predictor move the outcome, and in which direction? |
| Std. Error | How precise is that estimate? |
| t value | How many standard errors is the estimate from zero? |
| Pr(>|t|) and stars | Could this effect be luck, or is it well supported? |
| Residual standard error | What is the typical prediction miss, in real units? |
| Multiple R-squared | What share of the variation does the model explain? |
| Adjusted R-squared | The same, but fair for comparing models of different sizes. |
| F-statistic | Is the model useful overall, versus no predictors at all? |

When you open a new summary, this order works well: confirm the Call, sanity-check the coefficient signs, scan the p-values for which predictors are reliable, read R-squared for overall fit, and glance at the F-statistic to confirm the model earns its keep.

![A quick top-to-bottom order for reading any lm() output.](screenshots/Read-lm-Output-in-R-reading-order.webp)

*Figure 3: A quick top-to-bottom order for reading any lm() output.*

The single most useful habit is to read every Estimate together with its Std. Error and p-value, never alone. That is the difference between a number you can act on and a number that is really just noise.

## References

1. R Core Team. *summary.lm: Summarizing Linear Model Fits* (R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/summary.lm.html)
2. R Core Team. *lm: Fitting Linear Models* (R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html)
3. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, Chapter 3: Linear Regression. [Link](https://www.statlearning.com/)
4. Wickham, H., Grolemund, G. *R for Data Science*, Model Basics. [Link](https://r4ds.had.co.nz/model-basics.html)
5. Faraway, J. *Practical Regression and Anova using R*. [Link](https://cran.r-project.org/doc/contrib/Faraway-PRA.pdf)
6. R Core Team. *An Introduction to R*, Chapter 11: Statistical models in R. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
7. Robinson, D. *broom: Convert Statistical Objects into Tidy Tibbles*. [Link](https://broom.tidymodels.org/)

## Continue Learning

- [Interpret lm() Output: Every Number Explained](Interpreting-Regression-Output-Completely.html) - a deeper companion that derives each statistic with the formulas behind it.
- [Linear Regression in R](Linear-Regression.html) - the full workflow from fitting a model to checking its assumptions.
- [Logistic Regression in R](Logistic-Regression-With-R.html) - how to read model output when the outcome is yes or no instead of a number.

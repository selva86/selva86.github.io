---
title: "How to Read Logistic Regression Output in R"
slug: "Read-Logistic-Output-in-R"
description: "Confused by glm() output in R? This beginner guide reads every line of a logistic regression summary: coefficients, z-values, odds ratios, deviance, and AIC."
keywords: "logistic regression output in R, interpret glm output, read glm summary, logistic regression coefficients, odds ratio in R, log-odds, z value, null deviance, residual deviance, AIC logistic regression"
auto_link_terms: "logistic regression output in R|interpret glm output|read glm output|glm summary output|logistic regression coefficients|log-odds coefficients|odds ratio in R|null deviance|residual deviance|Fisher scoring iterations|reading logistic regression output|z value in logistic regression|binomial glm"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-10.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Reading glm() Output"
sidebar_order: "166"
difficulty: "Beginner"
---

<p class="lead">When you fit a logistic regression with <code>glm(..., family = binomial)</code> and call <code>summary()</code> on it, R prints a block of numbers that looks a lot like a linear-model summary but is not read the same way. This guide walks every line of that output, from the coefficient table down to the deviance and AIC, and shows how to turn each number into a plain statement about probability. Everything here uses base R, no extra packages.</p>

## Where should you look first in glm() output?

The hardest thing about a logistic summary is that its coefficients are not in the units you actually care about. Before we decode them, let's fit a real model and print the whole thing, so every later section has something concrete to point at. We will predict whether a car has a manual transmission (`am`, where 1 means manual and 0 means automatic) from its fuel economy (`mpg`), using the built-in `mtcars` data.

```r title="Fit a logistic model and print its summary"
fit <- glm(am ~ mpg, data = mtcars, family = binomial)
summary(fit)
#> 
#> Call:
#> glm(formula = am ~ mpg, family = binomial, data = mtcars)
#> 
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)   
#> (Intercept)  -6.6035     2.3514  -2.808  0.00498 **
#> mpg           0.3070     0.1148   2.673  0.00751 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> (Dispersion parameter for binomial family taken to be 1)
#> 
#>     Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 29.675  on 30  degrees of freedom
#> AIC: 33.675
#> 
#> Number of Fisher Scoring iterations: 5
```

That is the whole printout. Press Run and it appears in a second. Now look at its shape rather than its numbers: it is a stack of labelled sections separated by blank lines, and each one answers a different question.

![The stacked blocks of summary() output on a glm model.](screenshots/Read-Logistic-Output-in-R-anatomy.webp)

*Figure 1: The stacked blocks of summary() output on a glm model.*

Reading top to bottom, here is what each block is for:

1. **Call** repeats the formula and family you fitted, so you can confirm R modelled what you meant.
2. **Coefficients** is the heart of the output: the effect of each predictor, measured on a scale we will have to translate.
3. **Dispersion line** is a one-line technical note that, for logistic regression, never changes.
4. **Null and Residual deviance** compare your model against a do-nothing baseline.
5. **AIC** is a single score for comparing whole models.
6. **Fisher Scoring iterations** tells you the fitting routine finished cleanly.

[NOTE]
**Modern R does not print a Deviance Residuals block.** Older tutorials and screenshots show a five-number residual summary at the top of glm output, but R 4.1 and later removed it. If you were looking for it, you are not missing anything, it is simply gone.

We will walk through every block in that order. The rest of this guide is really just a magnified tour of this one printout.

[KEY INSIGHT]
**The printout is a stack of separate answers, not one wall of numbers.** Once you read the Call, the Coefficients, and the fit lines as replies to three different questions, the whole summary stops feeling intimidating.

**Try it:** Fit a model that predicts `am` from weight (`wt`) instead of fuel economy, then read its AIC.

```r title="Your turn: read another model's AIC"
# Fit am on weight, then read the AIC from the fitted object.
ex_wt <- glm(am ~ wt, data = mtcars, family = binomial)
# Next step: call AIC(ex_wt)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: AIC for am on weight"
ex_wt <- glm(am ~ wt, data = mtcars, family = binomial)
AIC(ex_wt)
#> [1] 23.17608
```

**Explanation:** `AIC()` pulls the single fit score straight out of the model. The weight model scores 23.18, lower than the fuel-economy model's 33.68, a first hint that weight predicts transmission type better. We will make that comparison properly later.

</details>

## What is the Call line telling you?

The top block is the easiest to read and the easiest to skip, which is a mistake. The `Call` line simply echoes the formula, family, and data you handed to `glm()`. Its job is to let you confirm, at a glance, that R fitted the model you intended.

Let's pull the Call out on its own so you see it clearly.

```r title="Show the model's Call"
fit$call
#> glm(formula = am ~ mpg, family = binomial, data = mtcars)
```

This says the response is `am`, the single predictor is `mpg`, and the data came from `mtcars`. The tilde `~` reads as "is modelled by", so `am ~ mpg` means "am is modelled by mpg". The part that makes this logistic rather than linear is `family = binomial`. That one argument tells R the outcome is a yes-or-no event and switches it from fitting a straight line to fitting a probability curve.

Why does this matter? Because it is your receipt. If you meant to fit a logistic model but forgot the family argument, R would quietly fit an ordinary linear model instead, and the Call line is where you would catch it.

**Try it:** Fit a model of `am` on horsepower (`hp`) and read back its Call line to confirm both the formula and the family.

```r title="Your turn: confirm a model's formula"
# Fit am on hp, then print the Call to confirm the formula and family.
ex_hp <- glm(am ~ hp, data = mtcars, family = binomial)
# Next step: print ex_hp$call
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: read back the Call"
ex_hp <- glm(am ~ hp, data = mtcars, family = binomial)
ex_hp$call
#> glm(formula = am ~ hp, family = binomial, data = mtcars)
```

**Explanation:** The Call confirms the predictor is `hp` and the family is `binomial`. Checking this one line prevents you from interpreting a model you did not mean to fit.

</details>

## How do you read the coefficients table row by row?

This block holds the actual model estimates, so we will slow right down. The Coefficients table has one **row** per term (the intercept plus each predictor) and four **columns**. Let's print just the table, rounded, so nothing is hidden behind the stars.

```r title="Print the coefficients table on its own"
round(summary(fit)$coefficients, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -6.6035     2.3514 -2.8083   0.0050
#> mpg           0.3070     0.1148  2.6735   0.0075
```

Read it one column at a time.

The **Estimate** column is the number you came for, but here is the catch that trips up everyone new to logistic regression: this number is a change in **log-odds**, not a change in probability. The odds of an event are its chance of happening divided by its chance of not happening, and the log-odds are simply the natural logarithm of those odds. For the `mpg` row the estimate is 0.307, which means each extra mile per gallon adds 0.307 to the log-odds that a car is manual. The sign is the part you can read immediately: it is positive, so more fuel-efficient cars are more likely to be manual. The size, 0.307, only becomes meaningful after we translate it in the next section.

The **(Intercept)** row is the log-odds when every predictor is zero, so here it is the log-odds of a manual transmission for a car doing zero miles per gallon. A car cannot do zero mpg, so treat the intercept as the anchor point of the curve rather than a real forecast.

The **Std. Error** column measures how much the estimate would move if you collected the data again. A small standard error means the estimate is pinned down tightly. The `mpg` estimate of 0.307 has a standard error of 0.115, comfortably smaller than the estimate itself.

The **z value** column combines the two columns before it. It asks a simple question: how big is the estimate compared to its own uncertainty? You get it by dividing the Estimate by the Std. Error.

$$z = \frac{\hat{\beta}}{SE(\hat{\beta})}$$

Where:

- \\(\hat{\beta}\\) is the estimated coefficient (the Estimate column).
- \\(SE(\hat{\beta})\\) is its standard error (the Std. Error column).

Let's confirm the z value for `mpg` is really just that division.

```r title="Rebuild the z value from Estimate and Std. Error"
est_mpg <- summary(fit)$coefficients["mpg", "Estimate"]
se_mpg  <- summary(fit)$coefficients["mpg", "Std. Error"]
est_mpg / se_mpg
#> [1] 2.673493
```

That 2.67 matches the `z value` column exactly. This is the first place logistic output differs from a linear model: `lm()` reports a `t value` here, but `glm()` reports a `z value`, because the binomial model treats the spread as known rather than estimated. In practice you read them the same way, a value far from zero means a real effect.

The last column, **Pr(>|z|)**, turns that z value into a probability, the **p-value**. It answers a cautious question: if this predictor truly had no effect, how often would random sampling alone hand us a z value this large? Let's read both p-values on their own.

```r title="Show the p-values for each term"
summary(fit)$coefficients[, "Pr(>|z|)"]
#> (Intercept)         mpg 
#> 0.004980557 0.007506579 
```

The `mpg` p-value of 0.0075 means "this would almost never happen by luck", which is your evidence the effect is real. In the full printout R rounds these and adds a star key so you do not have to squint. Those are the **significance codes**:

- `***` means the p-value is below 0.001 (strongest evidence).
- `**` means below 0.01.
- `*` means below 0.05, the usual cutoff for "statistically significant".
- `.` means below 0.10 (borderline).
- a blank means above 0.10 (no real evidence).

Both rows earned `**`, so both are well supported by the data.

[KEY INSIGHT]
**A logistic coefficient is a change in log-odds, not a change in probability.** Reading 0.307 as "a 31 percent higher chance" is the single most common mistake with glm output. The number lives on the log-odds scale, and it means nothing to a human until you convert it, which is exactly what the next section does.

**Try it:** Rebuild the z value for the intercept the same way we did for `mpg`, straight from its Estimate and Std. Error.

```r title="Your turn: rebuild the intercept z value"
# Pull the intercept row, then divide its Estimate by its Std. Error.
ex_int <- summary(fit)$coefficients["(Intercept)", ]
# Next step: compute ex_int["Estimate"] / ex_int["Std. Error"]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: intercept z value"
ex_int <- summary(fit)$coefficients["(Intercept)", ]
unname(ex_int["Estimate"] / ex_int["Std. Error"])
#> [1] -2.808289
```

**Explanation:** The intercept's z value is -2.81, matching the printed table. `unname()` just drops the leftover label so you see a clean number. Every z value in the table is this same Estimate-over-Std.-Error division.

</details>

## What do the coefficients mean as odds and probabilities?

We ended the last section with a coefficient nobody can act on: 0.307 log-odds per mpg. This section turns it into two things a human can actually say. A single coefficient lives on three connected scales, and moving between them is the core skill of reading logistic output.

![A logistic coefficient lives on three scales, running from log-odds to odds to probability.](screenshots/Read-Logistic-Output-in-R-scales.webp)

*Figure 2: A logistic coefficient lives on three scales, running from log-odds to odds to probability.*

The first jump is from log-odds to **odds**. Because the coefficient is a log-odds change, raising `e` to its power (the opposite of a logarithm) turns it into an **odds ratio**, the factor by which the odds multiply for a one-unit increase.

```r title="Convert coefficients to odds ratios"
round(exp(coef(fit)), 4)
#> (Intercept)         mpg 
#>      0.0014      1.3594 
```

The `mpg` odds ratio is 1.36. Read it as: each extra mile per gallon multiplies the odds of a manual transmission by about 1.36, a 36 percent increase in the odds. An odds ratio above 1 means the predictor raises the odds and below 1 means it lowers them; a ratio of exactly 1 would mean no effect at all. The intercept's odds ratio (0.0014) is the baseline odds at zero mpg, which, like the intercept itself, is an anchor rather than a meaningful quantity.

[TIP]
**Exponentiate the coefficients whenever you report a logistic model.** The raw log-odds are for the math; the odds ratios from `exp(coef(model))` are what you actually say out loud to a colleague or a reader.

Odds ratios are readable, but most people still think in probabilities. The link between them is the logistic equation, which says the log-odds are just a straight line built from the coefficients.

$$\log\left(\frac{p}{1-p}\right) = \beta_0 + \beta_1 x$$

Where:

- \\(p\\) is the probability the outcome is 1 (here, a manual car).
- \\(\frac{p}{1-p}\\) is the odds of that outcome.
- \\(\beta_0 + \beta_1 x\\) is the straight-line part, exactly like ordinary regression.

If you are not interested in the algebra, skip it. The practical point is that R will do the conversion for you. Asking `predict()` for the response gives you probabilities directly, one per car you describe.

```r title="Predicted probability for three fuel economies"
predict(fit, newdata = data.frame(mpg = c(15, 20, 25)), type = "response")
#>         1         2         3 
#> 0.1194021 0.3862832 0.7450109 
```

A thirsty 15 mpg car has about a 12 percent chance of being manual; a frugal 25 mpg car has about a 75 percent chance. The `type = "response"` argument is what asks for probabilities; leave it out and R hands back raw log-odds instead. To prove the machinery, we can rebuild the 20 mpg probability by hand: plug the numbers into the straight line to get the log-odds, then run them through `plogis()`, which is R's name for the logistic curve that maps any log-odds back to a probability.

```r title="Rebuild one probability by hand"
log_odds_20 <- unname(coef(fit)[1] + coef(fit)[2] * 20)
log_odds_20
#> [1] -0.4629629
plogis(log_odds_20)
#> [1] 0.3862832
```

The 0.386 matches the middle prediction above exactly. That is the whole journey in one example: the coefficients give a log-odds, `exp()` turns a coefficient into an odds ratio, and `plogis()` turns a log-odds into a probability.

Finally, just as with a linear model, you can put a range around the odds ratios rather than trusting a single point. Exponentiating a confidence interval gives you the plausible range for each odds ratio.

```r title="Confidence intervals on the odds-ratio scale"
round(exp(confint.default(fit)), 4)
#>              2.5 % 97.5 %
#> (Intercept) 0.0000 0.1360
#> mpg         1.0854 1.7025
```

The `mpg` odds ratio is most plausibly between 1.09 and 1.70. Because that whole range sits above 1, we are confident the effect is genuinely positive, which lines up with its small p-value. Whenever an odds ratio's interval straddles 1, that predictor is the shaky one.

[WARNING]
**Never read a log-odds coefficient as if it were a probability.** A coefficient of 0.307 does not mean "a 30 percent chance". It means the log-odds rise by 0.307, which works out to a 36 percent lift in the odds and a change in probability that depends entirely on where you start. Convert before you interpret.

**Try it:** Fuel economy usually changes by more than one mpg at a time. Work out the odds ratio for a 5 mpg increase.

```r title="Your turn: odds ratio for a 5 mpg jump"
# The odds ratio for a 5-unit change is exp(coefficient * 5).
# Next step: compute exp(coef(fit)["mpg"] * 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: odds ratio for 5 more mpg"
exp(coef(fit)["mpg"] * 5)
#>     mpg 
#> 4.64198 
```

**Explanation:** Multiplying the coefficient by 5 before exponentiating gives the odds ratio for a 5 mpg jump: about 4.64. Five extra miles per gallon multiply the odds of a manual transmission more than fourfold, which is a far more tangible statement than the raw 0.307.

</details>

## What do the deviance lines and AIC tell you about fit?

The bottom of the printout grades the model as a whole rather than one predictor at a time. There is no R-squared here, so these lines are how you judge overall fit. Let's start with the dispersion line, which reads `(Dispersion parameter for binomial family taken to be 1)`. For logistic regression this is fixed and never changes, so you can read past it; it only becomes interesting for other model families.

The numbers that matter are the two deviances. **Deviance** measures how badly a model misses, so smaller is better. The **Null deviance** is the deviance of a model with no predictors at all, one that only knows the overall share of manual cars. The **Residual deviance** is what is left after your predictor does its work. The gap between them is the predictor's contribution. The "degrees of freedom" printed next to each deviance line is simply the number of cars minus the parameters the model fits: 31 for the null model (32 cars minus its single intercept) and 30 once `mpg` is added (minus the intercept and the mpg slope). Let's pull all three fit numbers out.

```r title="Extract the model-fit numbers"
fit$null.deviance
fit$deviance
AIC(fit)
#> [1] 43.22973
#> [1] 29.67517
#> [1] 33.67517
```

Adding `mpg` pulled the deviance down from 43.23 to 29.68, a drop of about 13.6. The natural next question is whether a drop that size is real or could have happened by chance. A drop-in-deviance test answers exactly that, comparing your model against the null.

```r title="Test whether the predictor earns its place"
anova(fit, test = "Chisq")
#> Analysis of Deviance Table
#> 
#> Model: binomial, link: logit
#> 
#> Response: am
#> 
#> Terms added sequentially (first to last)
#> 
#> 
#>      Df Deviance Resid. Df Resid. Dev  Pr(>Chi)    
#> NULL                    31     43.230              
#> mpg   1   13.555        30     29.675 0.0002317 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `mpg` row shows a deviance drop of 13.56 with a p-value of 0.00023, so fuel economy explains a genuinely useful chunk of the variation in transmission type. If you want a single number that feels like R-squared, McFadden's pseudo R-squared is the common choice: one minus the ratio of the two deviances.

```r title="Compute McFadden's pseudo R-squared"
1 - (fit$deviance / fit$null.deviance)
#> [1] 0.3135473
```

This model gets about 0.31. Do not read pseudo R-squared like the real thing, though: McFadden values between 0.2 and 0.4 already indicate a good fit, so 0.31 is respectable. The last line of the printout, `Number of Fisher Scoring iterations: 5`, just reports that the fitting routine settled after five passes. Anything in the single digits is normal; a very large number, or a warning, is a sign the model struggled to converge.

[NOTE]
**Deviance and AIC are comparative, not absolute.** Unlike an R-squared that sits on a fixed 0-to-1 scale, a single AIC of 33.68 tells you nothing on its own. These numbers only earn their keep when you line up two models and see which one is lower.

**Try it:** You already fitted the weight model as `ex_wt` earlier, and it is still in memory. Compute its McFadden pseudo R-squared and compare it to the 0.31 above.

```r title="Your turn: pseudo R-squared for the weight model"
# ex_wt (am ~ wt) is still in memory from the first section.
# Next step: compute 1 - (ex_wt$deviance / ex_wt$null.deviance)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: pseudo R-squared for am on weight"
1 - (ex_wt$deviance / ex_wt$null.deviance)
#> [1] 0.5564145
```

**Explanation:** Weight scores 0.56, well above fuel economy's 0.31. Weight is the stronger single predictor of transmission type, which is the same story the lower AIC told us in the first section.

</details>

## How does the output change with more than one predictor?

Real models almost always use several predictors. The good news is that the output keeps the same shape; the Coefficients table simply grows an extra row. Let's add horsepower to the fuel-economy model and read what changes.

```r title="Fit a two-predictor model and print it"
fit2 <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
summary(fit2)
#> 
#> Call:
#> glm(formula = am ~ mpg + hp, family = binomial, data = mtcars)
#> 
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)  
#> (Intercept) -33.60517   15.07672  -2.229   0.0258 *
#> mpg           1.25961    0.56747   2.220   0.0264 *
#> hp            0.05504    0.02692   2.045   0.0409 *
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> (Dispersion parameter for binomial family taken to be 1)
#> 
#>     Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 19.233  on 29  degrees of freedom
#> AIC: 25.233
#> 
#> Number of Fisher Scoring iterations: 7
```

There is now an `hp` row, and every coefficient's meaning shifts slightly: each one is now the effect of its predictor while holding the other predictor fixed. So the `mpg` coefficient is the log-odds change per mpg among cars of the same horsepower.

Notice the `mpg` coefficient jumped from 0.307 in the simple model to 1.260 here. That is not a bug. Fuel economy and horsepower are linked, powerful cars tend to burn more fuel, so in the one-predictor model the `mpg` coefficient absorbed part of horsepower's effect. Once horsepower is in the model and held fixed, fuel economy's own effect comes through more strongly. The odds ratios make the new scale concrete.

```r title="Odds ratios for the two-predictor model"
round(exp(coef(fit2)), 4)
#> (Intercept)         mpg          hp 
#>      0.0000      3.5241      1.0566 
```

Holding horsepower fixed, each extra mpg now multiplies the odds of a manual transmission by 3.52, and each extra unit of horsepower multiplies them by 1.06. The model-fit lines improved too: residual deviance fell from 29.68 to 19.23, and AIC dropped from 33.68 to 25.23. Because AIC charges a penalty for each added predictor, a lower AIC after adding horsepower means the predictor genuinely earned its place.

[TIP]
**Compare nested models with AIC or a deviance test, not raw deviance alone.** Residual deviance always falls when you add a predictor, even a useless one, so it will always favour the bigger model. AIC and `anova(model1, model2, test = "Chisq")` both weigh the improvement against the cost of the extra term.

**Try it:** Add weight as a third predictor and see whether the AIC keeps dropping.

```r title="Your turn: does weight help a third time?"
# Fit am on mpg, hp, and wt, then read the AIC.
ex_fit3 <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)
# Next step: call AIC(ex_fit3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: AIC with three predictors"
ex_fit3 <- glm(am ~ mpg + hp + wt, data = mtcars, family = binomial)
AIC(ex_fit3)
#> [1] 16.76611
```

**Explanation:** AIC fell again, from 25.23 to 16.77, so weight adds real predictive value on top of fuel economy and horsepower. Each drop in AIC is evidence the larger model is worth its extra complexity.

</details>

## How do you go beyond summary(): predictions and accuracy?

The summary tells you about the coefficients, but the point of a classifier is usually to make calls on individual cases. `predict()` with `type = "response"` gives a probability for every car; turning those probabilities into yes-or-no predictions needs a cutoff, and 0.5 is the usual starting point. Comparing those predictions to the truth gives a confusion matrix.

```r title="Turn probabilities into a confusion matrix"
pred_prob <- predict(fit, type = "response")
pred_class <- ifelse(pred_prob > 0.5, 1, 0)
table(actual = mtcars$am, predicted = pred_class)
#>       predicted
#> actual  0  1
#>      0 17  2
#>      1  6  7
```

Read the table by its diagonal. The model got 17 automatics and 7 manuals right, and missed 8 cars (2 automatics it called manual, 6 manuals it called automatic). Dividing the correct calls by the total gives overall accuracy.

```r title="Overall classification accuracy"
mean(pred_class == mtcars$am)
#> [1] 0.75
```

The single-predictor model is right about 75 percent of the time. Before you trust any logistic model, run through this short red-flag checklist:

- **A coefficient sign that makes no sense** (fuel economy lowering the odds of a sporty manual) hints at a data or coding error.
- **A standard error many times larger than its estimate** is the classic sign of separation, where a predictor splits the outcome almost perfectly and the estimates blow up.
- **A probability of exactly 0 or 1 for many cases**, or coefficients in the tens or hundreds, is the same separation problem seen from a different angle.
- **A large number of Fisher Scoring iterations, or a convergence warning**, means the fitting routine struggled and the numbers may not be trustworthy.

[WARNING]
**Perfect separation breaks logistic regression quietly.** When a predictor perfectly splits the two outcomes, R can return giant coefficients with giant standard errors and no error message. Huge estimates paired with huge standard errors are the tell. The same caution applies to predicting far outside the range of your data, where a confident probability is really a wild guess.

**Try it:** Predict the probability of a manual transmission for a very frugal car doing 30 mpg.

```r title="Your turn: probability for a 30 mpg car"
# Describe a 30 mpg car and ask for the response-scale prediction.
# Next step: predict(fit, newdata = data.frame(mpg = 30), type = "response")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: probability at 30 mpg"
predict(fit, newdata = data.frame(mpg = 30), type = "response")
#>         1 
#> 0.9313311 
```

**Explanation:** The model puts a 30 mpg car's chance of being manual at about 93 percent. Note that 30 mpg sits near the top of the range in `mtcars`, so this is a reasonable extrapolation, but pushing much beyond the data would stop being trustworthy.

</details>

## Practice Exercises

These pull together everything above. Each starter block runs as-is, so you can edit and rerun it until the output matches.

### Exercise 1: Report an odds ratio with its interval

From a model of `am` on horsepower, report the odds ratio for `hp` together with its 95 percent confidence interval, then say whether horsepower is a reliable predictor on its own.

```r title="Exercise 1 starter"
# Fit am ~ hp, then exponentiate both the coefficients and their confidence interval.
cap_hp <- glm(am ~ hp, data = mtcars, family = binomial)
# Build a table of exp(coef) alongside exp(confint.default(cap_hp))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cap_hp <- glm(am ~ hp, data = mtcars, family = binomial)
round(exp(cbind(OR = coef(cap_hp), confint.default(cap_hp))), 4)
#>                 OR  2.5 %  97.5 %
#> (Intercept) 2.1741 0.3615 13.0766
#> hp          0.9919 0.9802  1.0038
```

**Explanation:** The `hp` odds ratio is 0.9919, and its interval (0.9802 to 1.0038) straddles 1. Because the interval crosses 1, horsepower alone is not a reliable predictor of transmission type, which is why you should always read an odds ratio next to its interval, never on its own.

</details>

### Exercise 2: Choose between two models

Compare model A (`am ~ mpg`) with model B (`am ~ mpg + hp`) on both residual deviance and AIC, then say which model you would report.

```r title="Exercise 2 starter"
# Fit both models, then read $deviance and AIC() from each.
cap_a <- glm(am ~ mpg, data = mtcars, family = binomial)
cap_b <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
# Build a small comparison of residual deviance and AIC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cap_a <- glm(am ~ mpg, data = mtcars, family = binomial)
cap_b <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
data.frame(
  model = c("mpg", "mpg + hp"),
  resid_dev = round(c(cap_a$deviance, cap_b$deviance), 2),
  AIC = round(c(AIC(cap_a), AIC(cap_b)), 2)
)
#>      model resid_dev   AIC
#> 1      mpg     29.68 33.68
#> 2 mpg + hp     19.23 25.23
```

**Explanation:** Model B wins on both counts: lower residual deviance (19.23 versus 29.68) and lower AIC (25.23 versus 33.68). When a bigger model lowers the AIC, the drop in deviance is worth the extra predictor, so model B is the one to report.

</details>

### Exercise 3: Rebuild a predicted probability by hand

For the two-predictor model `am ~ mpg + hp`, compute the predicted probability for a car with `mpg = 25` and `hp = 100` straight from the coefficients, then confirm it matches `predict()`. Use `plogis()` to turn the log-odds into a probability.

```r title="Exercise 3 starter"
# The pieces you need are coef(cap_m) for the intercept, mpg, and hp terms.
cap_m <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
# log-odds = intercept + mpg_coef * 25 + hp_coef * 100 ; probability = plogis(log-odds)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cap_m <- glm(am ~ mpg + hp, data = mtcars, family = binomial)
cap_lo <- unname(coef(cap_m)["(Intercept)"] + coef(cap_m)["mpg"] * 25 + coef(cap_m)["hp"] * 100)
round(plogis(cap_lo), 4)
#> [1] 0.9674
round(unname(predict(cap_m, newdata = data.frame(mpg = 25, hp = 100), type = "response")), 4)
#> [1] 0.9674
```

**Explanation:** The by-hand probability and the `predict()` result agree to four decimals, both 0.9674. Building the log-odds from the coefficients and running them through `plogis()` is exactly what `predict(type = "response")` does internally, so reproducing it is the surest sign you understand the model.

</details>

## Frequently Asked Questions

### Why does my glm summary not show a Deviance Residuals block?

It was removed. R 4.1 stopped printing the five-number deviance-residual summary at the top of `glm` output, so on any modern R the printout jumps straight from the Call to the Coefficients. Older tutorials still show it, but you are not missing anything. If you want those residuals, `residuals(model, type = "deviance")` still returns them.

### Are logistic regression coefficients the same as odds ratios?

No. The coefficients in the Estimate column are on the log-odds scale. You get the odds ratio by exponentiating them with `exp(coef(model))`. This is the most common source of misreadings, so always check which scale a number is on before you interpret it.

### Why does glm report a z value when lm reports a t value?

Because the binomial model treats the outcome's variability as known rather than estimated from the data. That changes the reference distribution for each coefficient's test from a t distribution to a standard normal one, which is why the column is labelled `z value` and the p-value column is `Pr(>|z|)`. You read them the same way you read t values.

### What counts as a good AIC or deviance value?

There is no absolute target. AIC and deviance are only meaningful when you compare models fitted to the same data, where lower is better. A single AIC of 25 is neither good nor bad on its own; it only matters that another model scores higher or lower.

### Why is one of my coefficients huge with an enormous standard error?

That is the classic signature of separation, where a predictor splits the two outcomes almost perfectly. The model tries to push that coefficient toward infinity, and both the estimate and its standard error balloon. When you see it, the fix is usually to drop or combine the offending predictor, or to use a penalized method built for separation.

## Summary

Reading `glm()` output is a matter of taking it block by block and knowing what question each line answers, plus one extra skill the linear model never needed: translating coefficients off the log-odds scale. Here is the whole tour on one card.

| Line in the output | What it answers |
|---|---|
| Call | Did R fit the formula, data, and family I intended? |
| Estimate | How much does each predictor move the log-odds, and in which direction? |
| Std. Error | How precise is that estimate? |
| z value | How many standard errors is the estimate from zero? |
| Pr(>|z|) and stars | Could this effect be luck, or is it well supported? |
| exp(coef) | The odds ratio: the readable version of the coefficient. |
| Null deviance | How badly does a no-predictor baseline miss? |
| Residual deviance | How badly does my model miss after the predictors? |
| AIC | Which of two models fits better, penalizing extra terms? |
| Fisher Scoring iterations | Did the fitting routine converge cleanly? |

When you open a new logistic summary, this order works well.

![A quick top-to-bottom order for reading any glm() output.](screenshots/Read-Logistic-Output-in-R-reading-order.webp)

*Figure 3: A quick top-to-bottom order for reading any glm() output.*

Confirm the Call, check each coefficient's sign against common sense, scan the p-values for which predictors are reliable, exponentiate to talk in odds ratios, and read the deviance and AIC to judge the model overall. The single most useful habit is to translate before you interpret: a raw log-odds coefficient is for the math, but an odds ratio or a predicted probability is what you actually report.

## References

1. R Core Team. *glm: Fitting Generalized Linear Models* (R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - the reference for every argument in the `glm()` call, including the family options.
2. R Core Team. *summary.glm: Summarizing Generalized Linear Model Fits* (R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/summary.glm.html) - documents exactly what each column and line of the summary you are reading contains.
3. R Core Team. *predict.glm: Predict Method for GLM Fits* (R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.glm.html) - explains the `type = "response"` argument that turns log-odds into probabilities.
4. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, Chapter 4: Classification. [Link](https://www.statlearning.com/) - a free, readable textbook treatment of logistic regression and how to interpret it.
5. UCLA OARC Statistics. *Logit Regression: R Data Analysis Examples*. [Link](https://stats.oarc.ucla.edu/r/dae/logit-regression/) - a worked logistic example with odds ratios, confidence intervals, and predicted probabilities.
6. Faraway, J. *Extending the Linear Model with R: Generalized Linear, Mixed Effects and Nonparametric Regression Models*. [Link](https://julianfaraway.github.io/faraway/ELM/) - a deeper reference on generalized linear models and their diagnostics.
7. R Core Team. *An Introduction to R*, Chapter 11: Statistical models in R. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the official R introduction to fitting models with formulas, including `glm()`.

## Continue Learning

- [How to Read lm() Output in R Line by Line](Read-lm-Output-in-R.html) - the same block-by-block treatment for ordinary linear regression, a useful companion to this guide.
- [Logistic Regression in R](Logistic-Regression-With-R.html) - the full workflow from fitting a logistic model to evaluating and using it.
- [Linear Regression in R](Linear-Regression.html) - where regression starts, with a numeric outcome instead of a yes-or-no one.

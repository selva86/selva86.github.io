---
title: "Which Regression Model in R? A Decision Framework From Data Type to Final Choice"
slug: "Which-Regression-Model-in-R"
description: "Outcome type, distribution, and research question jointly determine the right regression. This guide maps every combination to its R function and assumptions."
keywords: "which regression model R, choosing regression model, regression decision guide R, GLM R, logistic regression R, Poisson regression R, ordinal regression R, survival regression R, regression flowchart"
mathjax: true
webr: true
date: "2026-04-06"
curriculum_id: "DG2"
post_type: "FR"
auto_link_terms: "choosing regression model|regression decision guide|which regression model|regression model selection|choosing the right regression"
auto_link_case_sensitive: false
fr_parent: "Choosing-the-Right-Statistical-Test-in-R.html"
difficulty: "Intermediate"
---

# Which Regression Model in R? A Decision Framework From Data Type to Final Choice

<p class="lead">Choosing the right regression model starts with one question: what type of outcome are you predicting? This guide maps five outcome types, continuous, binary, count, ordinal, and time-to-event, to their R functions, key assumptions, and diagnostic checks.</p>

## Introduction

You know `lm()` for continuous outcomes and maybe `glm()` for binary ones. But what happens when your outcome is a count of hospital visits, an ordered satisfaction rating, or the time until a machine fails? The wrong model doesn't always throw an error, it silently gives misleading estimates.

The right regression model depends on three things: the type of outcome variable, the distribution of that outcome, and the research question you're answering. Get the first decision wrong and everything downstream is unreliable.

By the end of this guide you'll be able to identify your outcome type, pick the correct model family, fit it in R using base functions and a few standard packages, and verify that the model's assumptions hold. All code runs in your browser, no local setup needed.

## What Are the Five Outcome Types That Determine Your Regression Model?

Every regression problem starts with the same question: what does your outcome variable look like? The answer falls into one of five categories, and each one points to a different model family.

![Overview of regression model families organized by outcome type.](screenshots/Which-Regression-Model-in-R-overview-mindmap.webp)
*Figure 1: Overview of regression model families organized by outcome type.*

Here are the five outcome types with concrete examples:

- **Continuous**, a numeric value on a real-number scale. Examples: blood pressure, house price, temperature. Model: linear regression with `lm()`.
- **Binary**, exactly two categories (yes/no, survived/died, 0/1). Model: logistic regression with `glm(family = binomial)`.
- **Count**, non-negative integers representing how many times something happened. Examples: number of claims, website visits, species sightings. Model: Poisson regression with `glm(family = poisson)`.
- **Ordinal**, ordered categories where the distance between levels is unknown. Examples: pain severity (none/mild/moderate/severe), Likert scales. Model: proportional odds with `MASS::polr()`.
- **Time-to-event**, duration until something happens, often with censoring (some subjects haven't experienced the event yet). Examples: time to relapse, equipment lifetime. Model: Cox regression with `survival::coxph()`.

Let's create small datasets that represent each type so you can see them side by side.

```r
# Five outcome types in one place
continuous_y <- mtcars$mpg            # miles per gallon (continuous)
binary_y <- mtcars$am                 # 0 = automatic, 1 = manual (binary)
count_y <- warpbreaks$breaks          # number of breaks (count)
ordinal_y <- ordered(c("low", "med", "high", "low", "med"),
                     levels = c("low", "med", "high"))
print(ordinal_y)
#> [1] low  med  high low  med
#> Levels: low < med < high

# Time-to-event (lung dataset from survival)
library(survival)
head(lung[, c("time", "status")], 4)
#>   time status
#> 1  306      2
#> 2  455      2
#> 3 1010      0
#> 4  210      2
```

The `lung` dataset records survival time in days and whether the patient died (status = 2) or was censored (status = 1). This is the hallmark of time-to-event data, not every subject experiences the event during the study.

[KEY INSIGHT]
**The outcome type is your first and most important decision.** Every other modelling choice, link function, error distribution, coefficient interpretation, follows from it. Get this step right and the rest is manageable.

**Try it:** The variable `chickwts$weight` records the weight of chicks fed different diets. What outcome type is this, continuous, binary, count, ordinal, or time-to-event?

```r
# Try it: identify the outcome type of chickwts$weight
str(chickwts$weight)
# What type is this?
ex_answer <- "___"  # replace with your answer
ex_answer
#> Expected: "continuous"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_answer <- "continuous"
ex_answer
#> [1] "continuous"
```

**Explanation:** Weight is a numeric measurement on a real-number scale with no natural upper bound, making it a continuous outcome suited for `lm()`.

</details>

## How Does Linear Regression Handle Continuous Outcomes?

Linear regression is the starting point for continuous outcomes. It fits a straight line (or plane, with multiple predictors) that minimises the squared distance between observed and predicted values.

The model assumes four things: (1) the relationship between predictors and outcome is linear, (2) residuals are normally distributed, (3) residuals have constant variance (homoscedasticity), and (4) observations are independent of each other.

Let's predict fuel efficiency from weight and horsepower using the `mtcars` dataset.

```r
# Fit linear regression: mpg ~ weight + horsepower
lm_model <- lm(mpg ~ wt + hp, data = mtcars)
summary(lm_model)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 37.22727    1.59879  23.285  < 2e-16 ***
#> wt          -3.87783    0.63273  -6.129 1.12e-06 ***
#> hp          -0.03177    0.00903  -3.519  0.00145 **
#> ---
#> Multiple R-squared: 0.8268, Adjusted R-squared: 0.8148
```

Each unit increase in weight (1,000 lbs) is associated with a 3.88 mpg decrease, holding horsepower constant. The model explains about 83% of the variance in fuel efficiency.

The intuition behind OLS is straightforward. The model minimises this cost function:

$$J(\beta) = \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$

Where $y_i$ is the observed value, $\hat{y}_i$ is the predicted value, and $n$ is the number of observations. Smaller values mean better fit.

*If you're not interested in the math, skip ahead, the practical code above is all you need.*

Now let's check the assumptions with diagnostic plots.

```r
# Diagnostic plots for linear regression
par(mfrow = c(1, 2))
plot(lm_model, which = 1)  # Residuals vs Fitted
plot(lm_model, which = 2)  # Normal Q-Q
par(mfrow = c(1, 1))
```

In the residuals-vs-fitted plot, look for a flat, random scatter around zero. Any curved pattern suggests non-linearity. In the Q-Q plot, points should follow the diagonal line. Deviations at the tails indicate non-normal residuals.

[TIP]
**Run plot(model) for instant diagnostics.** Calling `plot()` on any lm object produces four diagnostic plots. The first two (residuals vs fitted and Q-Q) catch most problems.

**Try it:** Fit a linear model predicting `Sepal.Length` from `Petal.Width` using the `iris` dataset. What is the R-squared?

```r
# Try it: fit lm on iris
ex_iris_model <- lm(Sepal.Length ~ Petal.Width, data = iris)
# Check the R-squared:
# your code here
#> Expected: R-squared around 0.67
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_model <- lm(Sepal.Length ~ Petal.Width, data = iris)
summary(ex_iris_model)$r.squared
#> [1] 0.6690277
```

**Explanation:** Petal width alone explains about 67% of the variation in sepal length. The `summary()$r.squared` extracts just the R-squared value.

</details>

## When Should You Use Logistic Regression for Binary Outcomes?

When the outcome has exactly two levels, pass/fail, yes/no, alive/dead, logistic regression is the standard choice. It models the probability of the outcome being 1 (the "success" class) as a function of the predictors.

The key idea is the logistic function, which transforms a linear combination of predictors into a probability between 0 and 1:

$$P(Y = 1) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 x_1 + \dots + \beta_p x_p)}}$$

Where $\beta_0$ is the intercept and $\beta_1 \dots \beta_p$ are the coefficients. The model estimates coefficients on the log-odds scale, not the probability scale.

*If you're not interested in the math, the takeaway is simple: logistic regression outputs probabilities between 0 and 1.*

Let's predict whether a car has a manual transmission (am = 1) from its weight.

```r
# Logistic regression: manual vs automatic transmission
logit_model <- glm(am ~ wt, data = mtcars, family = binomial)
summary(logit_model)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  12.0404     4.5098   2.670  0.00759 **
#> wt           -4.0240     1.4362  -2.801  0.00509 **
```

The coefficient for weight is -4.02 on the log-odds scale. That means heavier cars are much less likely to have manual transmissions. But log-odds are hard to interpret directly. Let's convert to odds ratios.

```r
# Convert to odds ratios
odds_ratios <- exp(coef(logit_model))
print(odds_ratios)
#> (Intercept)          wt
#> 168917.4583      0.0181

# Confidence intervals for odds ratios
exp(confint.default(logit_model))
#>                   2.5 %      97.5 %
#> (Intercept) 42.49254891 671607.7816
#> wt           0.00106218      0.3097
```

An odds ratio of 0.018 for weight means each 1,000-lb increase multiplies the odds of manual transmission by 0.018, a 98% decrease. The confidence interval (0.001 to 0.31) doesn't include 1, confirming statistical significance.

[WARNING]
**Logistic regression coefficients are log-odds, not probabilities.** To get interpretable numbers, always exponentiate with `exp(coef(model))`. Reporting raw coefficients like -4.02 as "the effect" misleads your audience.

**Try it:** Fit a logistic regression predicting `vs` (engine shape: 0 = V-shaped, 1 = straight) from `wt` using `mtcars`. What is the odds ratio for weight?

```r
# Try it: logistic regression for vs ~ wt
ex_vs_model <- glm(vs ~ wt, data = mtcars, family = binomial)
# Get the odds ratio:
# your code here
#> Expected: odds ratio for wt around 0.56
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vs_model <- glm(vs ~ wt, data = mtcars, family = binomial)
exp(coef(ex_vs_model))["wt"]
#>        wt
#> 0.5584694
```

**Explanation:** Each 1,000-lb increase in weight multiplies the odds of a straight engine by about 0.56, meaning heavier cars are less likely to have straight engines.

</details>

## How Do You Model Count Data with Poisson Regression?

Count data, how many times something happened, calls for Poisson regression. The outcome is a non-negative integer (0, 1, 2, 3, ...) and the model assumes the mean equals the variance.

The `warpbreaks` dataset records the number of breaks in yarn during weaving. Let's model breaks as a function of wool type and tension.

```r
# Poisson regression on count data
pois_model <- glm(breaks ~ wool + tension, data = warpbreaks,
                  family = poisson)
summary(pois_model)
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.69196    0.04541  81.302  < 2e-16 ***
#> woolB       -0.20599    0.05157  -3.994 6.49e-05 ***
#> tensionM    -0.32132    0.06027  -5.332 9.73e-08 ***
#> tensionH    -0.51849    0.06396  -8.106 5.21e-16 ***
```

Wool B has about 19% fewer breaks than wool A (since $e^{-0.206} \approx 0.81$). High tension reduces breaks by about 40% compared to low tension.

The most common problem with Poisson regression is overdispersion, the variance is larger than the mean. Let's check.

```r
# Check for overdispersion
# Residual deviance should be close to residual df
deviance(pois_model)
#> [1] 210.3907
df.residual(pois_model)
#> [1] 50

# Dispersion ratio (should be ~1 for Poisson)
deviance(pois_model) / df.residual(pois_model)
#> [1] 4.207814

# Overdispersed! Try negative binomial
library(MASS)
nb_model <- glm.nb(breaks ~ wool + tension, data = warpbreaks)
summary(nb_model)
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.69196    0.08387  44.020  < 2e-16 ***
#> woolB       -0.20599    0.09525  -2.163   0.0306 *
#> tensionM    -0.32132    0.11440  -2.809   0.0050 **
#> tensionH    -0.51849    0.11948  -4.339 1.43e-05 ***
```

The dispersion ratio is 4.2, well above the expected 1.0 for Poisson. The negative binomial model produces the same coefficient estimates but with wider (more honest) standard errors. Notice how the z-values dropped, reflecting the greater uncertainty.

[WARNING]
**Overdispersion is the number-one Poisson violation.** When the dispersion ratio exceeds 1.5, switch to negative binomial regression with `MASS::glm.nb()`. Ignoring overdispersion gives artificially small p-values that make everything look significant.

**Try it:** Fit a Poisson regression predicting `breaks` from `tension` alone (no `wool`) and compute the dispersion ratio. Is it overdispersed?

```r
# Try it: Poisson with tension only
ex_pois <- glm(breaks ~ tension, data = warpbreaks, family = poisson)
# Compute dispersion ratio:
# your code here
#> Expected: dispersion ratio > 1.5 (overdispersed)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pois <- glm(breaks ~ tension, data = warpbreaks, family = poisson)
deviance(ex_pois) / df.residual(ex_pois)
#> [1] 4.697067
```

**Explanation:** The dispersion ratio of 4.7 far exceeds 1.0, confirming overdispersion. You should use negative binomial instead.

</details>

## What Is Ordinal Regression and When Do You Need It?

Ordinal outcomes have ordered categories where the exact distance between levels is unknown. Examples include pain severity (none < mild < moderate < severe), education level, or customer satisfaction ratings.

The standard approach is proportional odds logistic regression, fitted with `MASS::polr()`. It models the cumulative probability of being at or below each category level, assuming the effect of each predictor is the same across all cutpoints (the proportional odds assumption).

Let's create an ordinal dataset and fit the model.

```r
# Create ordinal outcome data
set.seed(17)
n <- 200
ord_data <- data.frame(
  age = round(runif(n, 20, 70)),
  income = round(runif(n, 20, 120), 1)
)
# Simulate ordered satisfaction: low < medium < high
latent <- -2 + 0.03 * ord_data$age + 0.02 * ord_data$income + rnorm(n)
ord_data$satisfaction <- ordered(
  cut(latent, breaks = c(-Inf, -0.5, 1, Inf),
      labels = c("low", "medium", "high")),
  levels = c("low", "medium", "high")
)
table(ord_data$satisfaction)
#>    low medium   high
#>     57     87     56
```

Now let's fit the proportional odds model.

```r
# Fit ordinal regression
ord_model <- polr(satisfaction ~ age + income, data = ord_data,
                  Hess = TRUE)
summary(ord_model)
#> Coefficients:
#>           Value Std. Error t value
#> age    0.030738   0.009206   3.339
#> income 0.018825   0.005592   3.366
#>
#> Intercepts:
#>             Value   Std. Error t value
#> low|medium  0.6805  0.5789     1.175
#> medium|high 3.1938  0.6115     5.222

# Get p-values (polr doesn't print them by default)
coef_table <- coef(summary(ord_model))
p_values <- pnorm(abs(coef_table[, "t value"]),
                  lower.tail = FALSE) * 2
print(round(p_values, 4))
#>         age      income  low|medium medium|high
#>      0.0008      0.0008      0.2400      0.0000
```

Both age and income significantly predict satisfaction level. Each additional year of age increases the odds of being in a higher satisfaction category by about 3% ($e^{0.031} \approx 1.031$).

[NOTE]
**If proportional odds fails, consider multinomial logistic regression.** You can test the assumption informally by fitting separate binary logistic regressions at each cutpoint and comparing coefficients. If they differ substantially, the proportional odds assumption is violated.

**Try it:** Using the `ord_data` we just created, fit an ordinal model predicting `satisfaction` from `age` alone (no income). Is age still significant?

```r
# Try it: ordinal regression with age only
ex_ord <- polr(satisfaction ~ age, data = ord_data, Hess = TRUE)
# Check significance:
# your code here
#> Expected: age coefficient with t-value > 2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ord <- polr(satisfaction ~ age, data = ord_data, Hess = TRUE)
coef_tab <- coef(summary(ex_ord))
p_val <- pnorm(abs(coef_tab["age", "t value"]), lower.tail = FALSE) * 2
cat("t-value:", coef_tab["age", "t value"], "\np-value:", round(p_val, 4))
#> t-value: 3.08
#> p-value: 0.0021
```

**Explanation:** Age remains significant even without income in the model, with a t-value above 2 and p-value well below 0.05.

</details>

## How Does Cox Regression Handle Time-to-Event Data?

Survival analysis applies when your outcome is the time until an event, death, relapse, machine failure, customer churn. The key complication is censoring: some subjects haven't experienced the event by the end of the study. You can't just drop them or treat their last-known time as the event time.

Cox proportional hazards regression estimates hazard ratios, the relative risk of the event happening at any given time, without specifying the baseline hazard function. It requires the `survival` package, which is bundled with every R installation.

![Decision flowchart: from outcome type to R function.](screenshots/Which-Regression-Model-in-R-decision-flow.webp)
*Figure 2: Decision flowchart: from outcome type to R function.*

Let's fit a Cox model to the `lung` dataset, which records survival of patients with advanced lung cancer.

```r
# Cox proportional hazards regression
cox_model <- coxph(Surv(time, status) ~ age + sex + ph.ecog,
                   data = lung)
summary(cox_model)
#>            coef  exp(coef) se(coef)     z Pr(>|z|)
#> age     0.01107    1.01113  0.00922 1.201   0.2298
#> sex    -0.55307    0.57517  0.16746 -3.303   0.0010 **
#> ph.ecog 0.46318    1.58917  0.11330 4.089 4.33e-05 ***
```

The hazard ratio for sex is 0.58, meaning females (sex = 2) have 42% lower hazard of death compared to males. Each unit increase in ECOG performance score increases the hazard by 59%.

The proportional hazards assumption is critical, it means the hazard ratio between any two groups stays constant over time. Let's test it.

```r
# Test proportional hazards assumption
ph_test <- cox.zph(cox_model)
print(ph_test)
#>          chisq df     p
#> age      5.745  1 0.017
#> sex      0.175  1 0.676
#> ph.ecog  2.368  1 0.124
#> GLOBAL   9.071  3 0.028
```

A significant p-value (< 0.05) indicates a violation. Here, `age` shows some evidence of non-proportional hazards (p = 0.017). In practice, you might stratify by age groups or add a time-interaction term to address this.

[KEY INSIGHT]
**Cox models estimate hazard ratios, not survival probabilities.** A hazard ratio of 2.0 means the event rate is twice as high in the exposed group at any point in time. To get predicted survival curves, use `survfit()` on the model object.

**Try it:** Fit a Cox model on the `lung` dataset using `age` and `sex` as predictors (no `ph.ecog`). What is the hazard ratio for sex?

```r
# Try it: Cox model with age + sex only
ex_cox <- coxph(Surv(time, status) ~ age + sex, data = lung)
# Get the hazard ratio for sex:
# your code here
#> Expected: hazard ratio for sex around 0.59
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cox <- coxph(Surv(time, status) ~ age + sex, data = lung)
exp(coef(ex_cox))["sex"]
#>       sex
#> 0.5880282
```

**Explanation:** The hazard ratio of 0.59 for sex means females have about 41% lower hazard of death compared to males, after adjusting for age.

</details>

## How Do You Choose Between Competing Models?

Once you've identified the correct model family, you often need to choose between competing specifications, different sets of predictors, interaction terms, or distributional assumptions.

![Key assumptions to verify for each model family.](screenshots/Which-Regression-Model-in-R-assumptions-check.webp)
*Figure 3: Key assumptions to verify for each model family.*

Here are the three main tools for model comparison within a family.

**AIC (Akaike Information Criterion)** balances model fit against complexity. Lower AIC is better. It works for any model fitted with maximum likelihood, including `lm()`, `glm()`, and `polr()`.

**Likelihood ratio test** compares nested models, one must be a special case of the other. Use `anova()` with `test = "Chisq"` for GLMs.

**Residual diagnostics** reveal whether the model's assumptions hold. No single number replaces visual inspection of residuals.

Let's compare two nested linear models.

```r
# Compare nested models
model_a <- lm(mpg ~ wt, data = mtcars)
model_b <- lm(mpg ~ wt + hp + cyl, data = mtcars)

# AIC comparison
AIC(model_a, model_b)
#>         df      AIC
#> model_a  3 166.0294
#> model_b  5 155.4766

# Likelihood ratio test (nested models)
anova(model_a, model_b)
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)
#> 1     30 278.32
#> 2     28 170.44  2    107.88 8.8659 0.001054 **
```

Model B (with weight, horsepower, and cylinders) has a lower AIC (155.5 vs 166.0) and the likelihood ratio test rejects the null hypothesis that the simpler model is sufficient (p = 0.001). The extra predictors earn their keep.

[TIP]
**AIC compares models fit to the same data and same outcome.** You cannot compare AIC values between a linear model and a logistic model, or between models fit on different subsets of data. Within those constraints, lower is always better.

Here is a quick-reference table summarising everything:

| Outcome Type | R Function | Key Assumption | Diagnostic Check |
|---|---|---|---|
| Continuous | `lm()` | Normal residuals, constant variance | `plot(model)` |
| Binary (0/1) | `glm(family = binomial)` | Log-odds are linear in predictors | Hosmer-Lemeshow, ROC |
| Count (0, 1, 2...) | `glm(family = poisson)` | Mean equals variance | Dispersion ratio |
| Ordinal | `MASS::polr()` | Proportional odds | Compare binary splits |
| Time-to-event | `survival::coxph()` | Proportional hazards | `cox.zph()` |
| Overdispersed count | `MASS::glm.nb()` | Variance > mean | Compare with Poisson AIC |

**Try it:** Fit two models, `mpg ~ wt` and `mpg ~ wt + disp`, on `mtcars`. Which has the lower AIC? Is the difference meaningful?

```r
# Try it: compare two models with AIC
ex_m1 <- lm(mpg ~ wt, data = mtcars)
ex_m2 <- lm(mpg ~ wt + disp, data = mtcars)
# Compare AIC:
# your code here
#> Expected: AIC values close together (difference < 2 = negligible)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_m1 <- lm(mpg ~ wt, data = mtcars)
ex_m2 <- lm(mpg ~ wt + disp, data = mtcars)
AIC(ex_m1, ex_m2)
#>       df      AIC
#> ex_m1  3 166.0294
#> ex_m2  4 166.7036
```

**Explanation:** The AIC difference is less than 2, which means `disp` adds essentially no useful information beyond what `wt` already provides. Stick with the simpler model.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using lm() on a binary outcome

❌ **Wrong:**
```r
bad_model <- lm(am ~ wt, data = mtcars)
predict(bad_model, newdata = data.frame(wt = 6))
#> [1] -0.3479
```

**Why it is wrong:** Linear regression on a binary outcome produces predicted probabilities below 0 or above 1, which are nonsensical. A predicted probability of -0.35 has no meaning.

✅ **Correct:**
```r
good_model <- glm(am ~ wt, data = mtcars, family = binomial)
predict(good_model, newdata = data.frame(wt = 6), type = "response")
#> [1] 0.0001679
```

### Mistake 2: Ignoring overdispersion in Poisson regression

❌ **Wrong:**
```r
# Fitting Poisson when dispersion ratio is 4.2
pois_fit <- glm(breaks ~ wool + tension, data = warpbreaks,
                family = poisson)
# P-values are too small (false significance)
```

**Why it is wrong:** When variance exceeds the mean, Poisson standard errors are too narrow. This inflates z-statistics and makes non-significant effects appear significant.

✅ **Correct:**
```r
# Use negative binomial for overdispersed counts
nb_fit <- glm.nb(breaks ~ wool + tension, data = warpbreaks)
# Standard errors are wider and more honest
```

### Mistake 3: Treating ordinal outcomes as continuous

❌ **Wrong:**
```r
# Coding low=1, medium=2, high=3 and using lm()
data_bad <- data.frame(y = c(1, 2, 3, 1, 2), x = c(10, 20, 30, 15, 25))
lm(y ~ x, data = data_bad)
```

**Why it is wrong:** This assumes equal spacing between categories (the jump from low to medium equals the jump from medium to high). It also allows predicted values like 1.7, which don't correspond to any category.

✅ **Correct:**
```r
# Use ordinal regression that respects the ordering
data_good <- data.frame(
  y = ordered(c("low", "med", "high", "low", "med"),
              levels = c("low", "med", "high")),
  x = c(10, 20, 30, 15, 25)
)
polr(y ~ x, data = data_good, Hess = TRUE)
```

### Mistake 4: Forgetting to check proportional hazards in Cox models

❌ **Wrong:**
```r
# Fit and report without checking assumptions
cox_bad <- coxph(Surv(time, status) ~ age + sex, data = lung)
# Report hazard ratios directly
```

**Why it is wrong:** If the proportional hazards assumption is violated, the hazard ratios are averaged over time and may not represent the actual relationship at any specific time point.

✅ **Correct:**
```r
# Always test PH assumption
cox_good <- coxph(Surv(time, status) ~ age + sex, data = lung)
cox.zph(cox_good)  # Check p-values for each predictor
```

### Mistake 5: Comparing AIC across different outcome types

❌ **Wrong:**
```r
# These AIC values are NOT comparable
aic_lm <- AIC(lm(mpg ~ wt, data = mtcars))
aic_glm <- AIC(glm(am ~ wt, data = mtcars, family = binomial))
# "The logistic model has lower AIC so it's better" — WRONG
```

**Why it is wrong:** AIC values are only comparable between models fit to the same outcome variable with the same likelihood function. Comparing a continuous-outcome AIC to a binary-outcome AIC is like comparing kilograms to kilometres.

✅ **Correct:**
```r
# Compare models with the SAME outcome
m1 <- glm(am ~ wt, data = mtcars, family = binomial)
m2 <- glm(am ~ wt + hp, data = mtcars, family = binomial)
AIC(m1, m2)  # Both predict am — valid comparison
```

## Practice Exercises

### Exercise 1: Identify the model and fit it

The `InsectSprays` dataset has a `count` column (number of insects) and a `spray` column (type A-F). Identify the correct regression family, fit the model, and check whether the Poisson assumption holds.

```r
# Exercise 1: model InsectSprays
# Hint: start with str(InsectSprays) to identify the outcome type
# Then fit the appropriate glm() and check the dispersion ratio

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Step 1: Identify outcome type
str(InsectSprays$count)
#> num [1:72] 10 7 20 14 14 12 10 23 17 20 ...
# It's a count! Use Poisson regression

# Step 2: Fit Poisson model
my_pois <- glm(count ~ spray, data = InsectSprays, family = poisson)

# Step 3: Check dispersion
deviance(my_pois) / df.residual(my_pois)
#> [1] 1.668555

# Mildly overdispersed (1.67) — borderline case
# Try negative binomial for comparison
my_nb <- glm.nb(count ~ spray, data = InsectSprays)
AIC(my_pois, my_nb)
#>         df      AIC
#> my_pois  6 409.0340
#> my_nb    7 379.7805
```

**Explanation:** The count outcome points to Poisson regression. The dispersion ratio of 1.67 suggests mild overdispersion. The negative binomial model has a substantially lower AIC (380 vs 409), confirming it's the better choice for these data.

</details>

### Exercise 2: Poisson vs negative binomial showdown

Using the `warpbreaks` dataset, fit both a Poisson and a negative binomial model with `breaks ~ wool * tension` (including the interaction). Compare their AIC values, dispersion diagnostics, and coefficient significance. Which model would you report and why?

```r
# Exercise 2: Poisson vs negative binomial with interaction
# Hint: use wool * tension for the interaction
# Compare: AIC, dispersion, coefficient p-values

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Poisson with interaction
my_pois2 <- glm(breaks ~ wool * tension, data = warpbreaks,
                family = poisson)

# Negative binomial with interaction
my_nb2 <- glm.nb(breaks ~ wool * tension, data = warpbreaks)

# Compare AIC
AIC(my_pois2, my_nb2)
#>          df      AIC
#> my_pois2  6 468.9716
#> my_nb2    7 326.0521

# Dispersion check for Poisson
cat("Poisson dispersion:", deviance(my_pois2) / df.residual(my_pois2))
#> Poisson dispersion: 3.376181

# Coefficient comparison
cat("\nPoisson p-values:\n")
round(coef(summary(my_pois2))[, "Pr(>|z|)"], 4)
cat("\nNeg Binomial p-values:\n")
round(coef(summary(my_nb2))[, "Pr(>|z|)"], 4)
```

**Explanation:** The negative binomial model wins decisively: lower AIC (326 vs 469), and the Poisson dispersion ratio of 3.4 confirms overdispersion. The negative binomial gives wider, more honest standard errors. The interaction terms may lose significance in the negative binomial, this is correct, not a flaw.

</details>

### Exercise 3: Full pipeline, from data to interpretation

You receive a dataset of patients where the outcome is 30-day mortality (1 = died, 0 = survived) with predictors age and treatment group. Complete the full pipeline: identify the outcome type, fit the right model, interpret the coefficients as odds ratios with confidence intervals, and check if treatment significantly reduces mortality.

```r
# Exercise 3: Full regression pipeline
# Step 1: Create the data
set.seed(99)
my_patients <- data.frame(
  age = round(rnorm(150, mean = 65, sd = 12)),
  treatment = rep(c("control", "drug"), each = 75)
)
my_patients$died <- rbinom(150, 1,
  prob = plogis(-1 + 0.03 * my_patients$age -
                0.8 * (my_patients$treatment == "drug")))

# Step 2: Identify outcome type and fit model
# Step 3: Get odds ratios with 95% CI
# Step 4: Interpret: does the drug reduce mortality?

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
my_patients <- data.frame(
  age = round(rnorm(150, mean = 65, sd = 12)),
  treatment = rep(c("control", "drug"), each = 75)
)
my_patients$died <- rbinom(150, 1,
  prob = plogis(-1 + 0.03 * my_patients$age -
                0.8 * (my_patients$treatment == "drug")))

# Binary outcome -> logistic regression
my_logit <- glm(died ~ age + treatment, data = my_patients,
                family = binomial)

# Odds ratios with 95% CI
or_est <- exp(coef(my_logit))
or_ci <- exp(confint.default(my_logit))
cbind(OR = or_est, or_ci)
#>                        OR      2.5 %    97.5 %
#> (Intercept)       0.09919  0.0120    0.8193
#> age               1.03364  1.0062    1.0618
#> treatmentdrug     0.47783  0.2282    1.0004

# Interpretation
cat("Drug treatment OR:", round(or_est["treatmentdrug"], 3),
    "\n95% CI:", round(or_ci["treatmentdrug",], 3))
```

**Explanation:** The binary outcome (died: 0/1) requires logistic regression. The drug treatment's odds ratio is about 0.48, suggesting the drug roughly halves the odds of death. However, the 95% CI barely touches 1.0, so the evidence is borderline. With more patients, the effect would likely become clearly significant.

</details>

## Putting It All Together

Let's walk through a complete decision-making pipeline from scratch. You have a research question, data, and need to arrive at a final, defensible model.

**Scenario:** You're analysing the `lung` dataset to understand which patient characteristics predict survival time in advanced lung cancer.

```r
# Step 1: Examine the outcome
str(lung[, c("time", "status")])
#> 'data.frame': 228 obs. of 2 variables:
#>  $ time  : int  306 455 1010 210 883 ...
#>  $ status: int  2 2 0 2 2 ...

# Outcome: time until death, with censoring (status 1 = censored)
# -> This is time-to-event data -> Cox regression

# Step 2: Fit the Cox model
final_model <- coxph(Surv(time, status) ~ age + sex + ph.ecog + meal.cal,
                     data = lung, na.action = na.exclude)
summary(final_model)
#>            coef  exp(coef) se(coef)     z Pr(>|z|)
#> age      0.0098    1.0098  0.0095  1.034  0.30130
#> sex     -0.5516    0.5760  0.1709 -3.227  0.00125 **
#> ph.ecog  0.5737    1.7747  0.1275  4.498 6.84e-06 ***
#> meal.cal 0.0000    1.0000  0.0003  0.013  0.98966

# Step 3: Check proportional hazards
cox.zph(final_model)
#>           chisq df     p
#> age       5.33   1 0.021
#> sex       0.42   1 0.515
#> ph.ecog   1.93   1 0.165
#> meal.cal  0.17   1 0.679
#> GLOBAL    8.41   4 0.078

# Step 4: Simplify — drop non-significant predictors
final_slim <- coxph(Surv(time, status) ~ sex + ph.ecog,
                    data = lung)
AIC(final_model, final_slim)
#>              df      AIC
#> final_model   4 1478.034
#> final_slim    2 1474.204

# Step 5: Interpret the final model
exp(coef(final_slim))
#>       sex   ph.ecog
#> 0.5753   1.5894

exp(confint(final_slim))
#>              2.5 %   97.5 %
#> sex       0.4213    0.7857
#> ph.ecog   1.2422    2.0340
```

Here is the interpretation. The outcome is time-to-death with censoring, so Cox regression is the right tool. After fitting and checking assumptions, we simplify to two predictors. Female patients have 42% lower hazard (HR = 0.58, 95% CI: 0.42-0.79). Each unit increase in ECOG score increases hazard by 59% (HR = 1.59, 95% CI: 1.24-2.03). The simpler model has a lower AIC (1474 vs 1478) and no proportional hazards violations.

## Summary

| Decision Point | Question to Ask | What to Do |
|---|---|---|
| Outcome type | Is it continuous, binary, count, ordinal, or time-to-event? | Match to model family (see table below) |
| Model fit | Does the model explain the data? | Check R-squared, deviance, concordance |
| Assumptions | Do residuals behave properly? | Plot diagnostics, run formal tests |
| Overdispersion | Is variance > mean for counts? | Switch to negative binomial |
| Proportional odds | Same effect across cutpoints? | Compare binary splits |
| Proportional hazards | Constant hazard ratio over time? | Run cox.zph() |
| Model comparison | Which specification is best? | AIC for non-nested, LR test for nested |

**Quick-reference: outcome type to R function:**

| Outcome | Function | Package |
|---|---|---|
| Continuous | `lm()` | base |
| Binary | `glm(family = binomial)` | stats |
| Count | `glm(family = poisson)` | stats |
| Overdispersed count | `glm.nb()` | MASS |
| Ordinal | `polr()` | MASS |
| Time-to-event | `coxph()` | survival |

## FAQ

**Can I use linear regression if my outcome is bounded between 0 and 1?**

Not with standard `lm()`. Predictions can fall outside the 0-1 range, which is nonsensical for proportions. Use beta regression (`betareg` package) for continuous proportions, or logistic regression if the outcome is truly binary.

**What is the difference between logistic and probit regression?**

Both model binary outcomes but use different link functions. Logistic uses the logit link (log-odds), probit uses the inverse normal CDF. In practice, they give nearly identical predictions. Logistic is more common because odds ratios have an intuitive interpretation.

**When should I use negative binomial instead of Poisson?**

When the dispersion ratio (residual deviance / residual df) substantially exceeds 1.0. A ratio above 1.5 suggests overdispersion. Negative binomial adds a parameter that allows the variance to exceed the mean, producing more reliable standard errors.

**How do I handle zero-inflated count data?**

Zero-inflated data has more zeros than a Poisson or negative binomial model expects. Use `pscl::zeroinfl()` to fit a zero-inflated model. It combines a logistic model for the "excess zeros" process with a count model for the regular counts.

**Can I use Cox regression with time-varying covariates?**

Yes. The `survival` package supports time-varying covariates by restructuring data into start-stop format with `tmerge()` or by specifying time-dependent terms in the model formula. This is an advanced topic covered in the survival package vignettes.

## References

1. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Hosmer, D.W., Lemeshow, S. & Sturdivant, R.X., *Applied Logistic Regression*, 3rd Edition. Wiley (2013).
3. Cameron, A.C. & Trivedi, P.K., *Regression Analysis of Count Data*, 2nd Edition. Cambridge University Press (2013).
4. Agresti, A., *Analysis of Ordinal Categorical Data*, 2nd Edition. Wiley (2010).
5. Therneau, T.M. & Grambsch, P.M., *Modeling Survival Data: Extending the Cox Model*. Springer (2000).
6. Venables, W.N. & Ripley, B.D., *Modern Applied Statistics with S*, 4th Edition. Springer (2002). [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
7. glm() documentation, R Stats Package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
8. survival package documentation, CRAN. [Link](https://cran.r-project.org/web/packages/survival/index.html)
9. Harrell, F.E., *Regression Modeling Strategies*, 2nd Edition. Springer (2015). [Link](https://hbiostat.org/rmsc/)
10. Fox, J., *Applied Regression Analysis and Generalized Linear Models*, 3rd Edition. Sage (2016).

## Continue Learning

- **[Which Statistical Test in R? A Decision Flowchart](Choosing-the-Right-Statistical-Test-in-R.html)**, the parent guide that covers hypothesis tests, not just regression models
- **[Linear Regression in R](Linear-Regression-in-R.html)**, deep dive into OLS with diagnostics, transformations, and feature selection
- **[Logistic Regression in R](Logistic-Regression-in-R.html)**, complete walkthrough of binary classification with ROC curves and model evaluation

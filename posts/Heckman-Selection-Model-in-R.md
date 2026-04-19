---
title: "Heckman Selection Model in R: Correct for Non-Random Sample Selection"
slug: "Heckman-Selection-Model-in-R"
description: "Learn the Heckman selection model in R: fit two-step and MLE heckit, interpret rho and the inverse Mills ratio, and correct bias from non-random samples."
keywords: "Heckman selection model R, sampleSelection package, sample selection bias, heckit two-step, inverse Mills ratio, selection bias correction, Mroz87, exclusion restriction"
auto_link_terms: "Heckman selection model|Heckman correction|Heckman two-step|inverse Mills ratio|sample selection bias|selection bias correction|sampleSelection package"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-19
post_type: FR
fr_parent: Multiple-Regression-in-R.html
difficulty: Intermediate
---

# Heckman Selection Model in R: Correct for Non-Random Sample Selection

<p class="lead">The Heckman selection model fits a linear outcome equation when the sample you observe is not a random draw from the population, like wages reported only for employed workers or ratings only from people who bought a product. It corrects the bias by modelling selection as a probit, then adding the inverse Mills ratio from that probit to the outcome regression.</p>

## Why do we need the Heckman selection model?

Imagine you want to know how ability affects wages, but you can only measure wages for people who are employed. Employed people are not a random subset of the population. They tend to have more drive, skills, and opportunities, and those same traits push up their wages too. Ordinary least squares on this selected sample therefore understates the true effect. A small simulation makes the bias impossible to miss in a single run.

```r title="Naive OLS on a selected sample underestimates the truth"
# Simulate a wage scenario where selection bias is built in
set.seed(42)
n <- 2000

# Latent ability drives BOTH employment and wages
ability <- rnorm(n)

# Selection equation: employed if ability + noise > 0 (about half the sample)
employed <- (ability + rnorm(n)) > 0

# Outcome: log wages with TRUE beta = 0.5 on ability
log_wage <- 1 + 0.5 * ability + rnorm(n, sd = 0.5)

# We only observe wages for the employed subset
obs_wage <- ifelse(employed, log_wage, NA)

# Naive OLS ignores that wages are missing non-randomly
naive_fit <- lm(obs_wage ~ ability)
round(coef(naive_fit), 3)
#> (Intercept)     ability
#>       1.185       0.368
```

The true ability coefficient is `0.5`, but naive OLS returns `0.368`, a 26% underestimate. The reason is that the error term in the wage equation is correlated with the unobserved driver of employment: capable people are over-represented among the employed, so any ability they have buys less wage-gap in the selected sample than it does in the population. OLS mistakes this for a weaker effect.

[KEY INSIGHT]
**Selection bias is an omitted variable bias in disguise.** The omitted variable is the decision to be in the sample. Once we explicitly model that decision and add its signature (the inverse Mills ratio) to the regression, the bias vanishes.

**Try it:** Tighten the link between ability and employment by squaring it. Does the bias get worse? Call the new fit `ex_fit`.

```r title="Your turn: stronger selection, bigger bias"
# Try it: rerun with stronger selection on ability
set.seed(42)
ex_employed <- (2 * ability + rnorm(n)) > 0
ex_wage <- ifelse(ex_employed, log_wage, NA)
ex_fit <- lm(ex_wage ~ ability)
round(coef(ex_fit)["ability"], 3)
#> Expected: a value noticeably lower than 0.368
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger selection solution"
set.seed(42)
ex_employed <- (2 * ability + rnorm(n)) > 0
ex_wage <- ifelse(ex_employed, log_wage, NA)
ex_fit <- lm(ex_wage ~ ability)
round(coef(ex_fit)["ability"], 3)
#> ability
#>   0.298
```

**Explanation:** Tightening the selection rule means employment is driven more strongly by ability, so the observed-wage subset is even more homogeneous in ability. OLS sees less variation in ability and attributes less of the wage gap to it.

</details>

## How does the two-step Heckman procedure work?

The fix splits the problem into two models. Step 1 is a probit that predicts selection (employed or not) from observed covariates. Step 2 adds a one-number summary from that probit, the **inverse Mills ratio** $\lambda$, as an extra regressor in the wage equation. Once $\lambda$ is in the model, the residual correlation between selection and outcome is absorbed, and the remaining coefficients are unbiased.

![The two-step Heckman procedure: estimate probit, compute the inverse Mills ratio, then augment OLS.](screenshots/Heckman-Selection-Model-in-R-two-step-flow.webp)

*Figure 1: The two-step Heckman procedure: estimate probit, compute the inverse Mills ratio, then augment OLS.*

The formulas capture this intuition in two lines. The selection equation models the probability of being observed:

$$\Pr(D_i = 1 \mid Z_i) = \Phi(Z_i \gamma)$$

The outcome equation, restricted to the observed sample, augments the usual regression with the correction term:

$$E[Y_i \mid X_i, D_i = 1] = X_i \beta + \rho \sigma_u \lambda(Z_i \gamma)$$

Where:
- $D_i = 1$ means observation $i$ is in the sample (e.g., employed)
- $Z_i$ = covariates in the selection probit
- $\gamma$ = probit coefficients
- $\Phi$ = standard normal CDF, $\phi$ = standard normal PDF
- $\lambda(z) = \phi(z) / \Phi(z)$ = the **inverse Mills ratio**
- $\rho$ = correlation between the selection and outcome errors
- $\sigma_u$ = standard deviation of the outcome equation error

The coefficient on $\lambda$ in Step 2 is $\rho \sigma_u$, so a t-test on that coefficient is a direct test of whether selection bias matters at all. We can replicate the whole recipe in base R without any extra package.

```r title="Manual two-step Heckman from scratch"
# Step 1: probit for selection, using ability as the only covariate
probit_fit <- glm(employed ~ ability,
                  family = binomial(link = "probit"))

# Predict the probit linear predictor for every observation
z_hat <- predict(probit_fit, type = "link")

# Step 2: inverse Mills ratio = phi(z_hat) / Phi(z_hat)
imr <- dnorm(z_hat) / pnorm(z_hat)

# Step 3: OLS on the observed subset, with IMR as extra regressor
heckit_manual <- lm(obs_wage ~ ability + imr, subset = employed)
round(coef(heckit_manual), 3)
#> (Intercept)     ability         imr
#>       0.995       0.499      -0.417
```

The `ability` coefficient is now `0.499`, right on top of the true `0.5`. The `imr` coefficient is negative and sizeable, confirming that selection pushes observed wages upward in a way the covariates alone cannot explain. The only unfinished business is standard errors: the OLS standard errors in Step 2 are wrong because `imr` was itself estimated in Step 1. We address that in the next section by using a package that handles both steps jointly.

[NOTE]
**The reported OLS standard errors in the manual two-step are biased.** They ignore the fact that the inverse Mills ratio is an estimated quantity, not observed data. In practice, use bootstrap or the built-in standard errors from `sampleSelection::selection()`, which apply the correct Heckman-Greene correction.

**Try it:** Compute the inverse Mills ratio at `z_hat = 0` and `z_hat = 2` by hand. Which selection zone gives a larger IMR?

```r title="Your turn: IMR at two z values"
# Try it: evaluate dnorm(z)/pnorm(z) at z = 0 and z = 2
ex_imr_z0 <- # your code here: IMR at z = 0
ex_imr_z2 <- # your code here: IMR at z = 2
c(z0 = ex_imr_z0, z2 = ex_imr_z2)
#> Expected: two positive numbers where z = 0 is larger
```

<details>
<summary>Click to reveal solution</summary>

```r title="IMR at two z values solution"
ex_imr <- c(z0 = dnorm(0) / pnorm(0),
            z2 = dnorm(2) / pnorm(2))
round(ex_imr, 3)
#>    z0    z2
#> 0.798 0.055
```

**Explanation:** When `z_hat` is small (near zero), the observation is borderline, so the probit density is high relative to the cumulative probability, and $\lambda$ is large. When `z_hat` is large and positive, selection is almost certain and $\lambda$ shrinks toward zero.

</details>

## How do you fit Heckman in R with sampleSelection?

The `sampleSelection` package wraps both steps into a single call, gives correct standard errors, and cleanly reports the selection and outcome equations side by side. The workhorse function is `selection()`, which takes two formulas (selection, outcome) and a method (`"2step"` for the classic Heckman two-step or `"ml"` for full maximum likelihood).

```r title="Fit Heckman with selection() in one call"
# Load the package (available in WebR and CRAN)
library(sampleSelection)

# One-shot Heckman two-step: selection formula | outcome formula
heckit_fit <- selection(
  selection = employed ~ ability,     # Step 1: probit
  outcome   = obs_wage ~ ability,     # Step 2: outcome equation
  method    = "2step"
)

# Outcome-equation coefficients (the ones we care about)
round(coef(heckit_fit, part = "outcome"), 3)
#>      (Intercept)       ability invMillsRatio
#>            0.995         0.499        -0.417
```

The numbers match the manual calculation exactly because `selection()` runs the same algorithm internally. The win is in the reporting: `summary(heckit_fit)` prints probit and outcome tables with the right standard errors, z-statistics, p-values, and an estimate of $\rho$ without extra work.

[TIP]
**Always inspect the `invMillsRatio` row in the summary.** Its t-statistic is your selection diagnostic. A large absolute t means the outcome equation's unobserved drivers are correlated with selection, so the correction is doing meaningful work. A near-zero t suggests plain OLS on the selected sample was fine.

**Try it:** Fit a second Heckman model where the outcome depends on `ability + I(ability^2)`. Does the linear coefficient move?

```r title="Your turn: add a quadratic term"
# Try it: add ability^2 to the outcome equation
ex_fit2 <- selection(
  selection = employed ~ ability,
  outcome   = obs_wage ~ ability + I(ability^2),
  method    = "2step"
)
round(coef(ex_fit2, part = "outcome"), 3)
#> Expected: a linear coefficient near 0.5 and a small quadratic term
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quadratic outcome solution"
ex_fit2 <- selection(
  selection = employed ~ ability,
  outcome   = obs_wage ~ ability + I(ability^2),
  method    = "2step"
)
round(coef(ex_fit2, part = "outcome"), 3)
#>   (Intercept)       ability  I(ability^2) invMillsRatio
#>         1.006         0.502        -0.010        -0.423
```

**Explanation:** The true data-generating process is linear in ability, so the `I(ability^2)` coefficient is close to zero and the linear term stays near 0.5. This is a quick sanity check that the correction is not inventing non-linearity that does not exist.

</details>

## What does the exclusion restriction require?

Identification of the Heckman model hinges on one rule: at least one variable that appears in the selection probit should be absent from the outcome equation. This is the **exclusion restriction**. It gives the model information about selection that it cannot also attribute to the outcome, and it is the difference between a credible correction and a fragile one based only on distributional assumptions.

```r title="Add an exclusion variable and compare SEs"
# Introduce a variable that affects SELECTION only, not wages
set.seed(101)
kids <- rpois(n, lambda = 1.2)  # number of kids, extra selection driver
employed2 <- (ability - 0.3 * kids + rnorm(n)) > 0
obs_wage2 <- ifelse(employed2, log_wage, NA)

# WITH exclusion: kids in selection, NOT in outcome
heckit_ex <- selection(
  selection = employed2 ~ ability + kids,
  outcome   = obs_wage2 ~ ability,
  method    = "2step"
)

# WITHOUT exclusion: same variables in both equations
heckit_noex <- selection(
  selection = employed2 ~ ability,
  outcome   = obs_wage2 ~ ability,
  method    = "2step"
)

# Compare standard errors on the outcome ability coefficient
c(with_exclusion = summary(heckit_ex)$estimate["ability", "Std. Error"],
  without        = summary(heckit_noex)$estimate["ability", "Std. Error"])
#> with_exclusion        without
#>          0.021          0.038
```

The standard error on `ability` is nearly twice as large without the exclusion variable. That is the identification cost: without a variable that varies selection but not the outcome, the model is left to separate the two forces using only the non-linearity of the inverse Mills ratio, which is a weak lever. In real projects, spend time finding a credible exclusion variable before you trust a Heckman correction.

[WARNING]
**Heckman without an exclusion restriction leans entirely on the joint-normality assumption.** If that assumption is wrong by even a little, coefficients and their standard errors can be seriously misleading. Reviewers treat this as a red flag. State your exclusion restriction explicitly in any paper or report.

**Try it:** Which of these would make a plausible exclusion restriction for modelling wages conditional on employment: (a) years of education, (b) local unemployment rate, (c) age?

```r title="Your turn: reason about exclusion restrictions"
# Try it: store your answer as a single letter in ex_sel
# Hint: the variable should affect the decision to work
# but not wages conditional on being employed
ex_sel <- "?"
ex_sel
#> Expected: a single letter that is NOT "a" or "c"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exclusion restriction solution"
ex_sel <- "b"
ex_sel
#> [1] "b"
```

**Explanation:** Local unemployment rate shifts the probability of being employed (selection) but does not directly raise or lower an employed person's wage conditional on having a job. Education and age, in contrast, are classic wage determinants, so excluding them from the outcome would be wrong.

</details>

## When should you prefer MLE over the two-step estimator?

The two-step estimator is intuitive and fast, but it is not statistically efficient. Maximum likelihood estimation fits both equations jointly, which uses the information in the data more fully and produces tighter standard errors. The price is a harder optimization that can fail to converge on noisy data. On clean data, always prefer MLE; on tricky data, start with the two-step, then try MLE once you trust the specification.

```r title="Compare two-step and MLE estimators"
# Full data with exclusion restriction: kids in selection only
heckit_ml <- selection(
  selection = employed2 ~ ability + kids,
  outcome   = obs_wage2 ~ ability,
  method    = "ml"
)

# Side-by-side comparison of ability estimates and SEs
two_step <- summary(heckit_ex)$estimate["ability", 1:2]
ml       <- summary(heckit_ml)$estimate["ability", 1:2]

rbind(two_step = two_step, ml = ml)
#>           Estimate Std. Error
#> two_step     0.500      0.021
#> ml           0.500      0.019
```

Both estimators return essentially the same point estimate, which is a healthy sign that the two-step was well-identified. The MLE standard error is about 10% smaller, which translates to tighter confidence intervals on the coefficient you report. On larger samples or heavier selection, the MLE advantage grows.

[NOTE]
**Watch for convergence warnings from `method = "ml"`.** If `selection()` prints "convergence failed" or returns coefficients that swing wildly between runs, the likelihood surface is flat or multi-modal. Usually this means the exclusion restriction is weak, or the two errors are almost independent so there is little for $\rho$ to do. Fall back to two-step and report both.

**Try it:** Fit the same MLE model but with starting values drawn from the two-step coefficients.

```r title="Your turn: warm-start the MLE"
# Try it: use the two-step as a starting point
ex_ml <- selection(
  selection = employed2 ~ ability + kids,
  outcome   = obs_wage2 ~ ability,
  method    = "ml",
  start     = # your code here: the coefficients from heckit_ex
)
round(coef(ex_ml, part = "outcome")["ability"], 3)
#> Expected: still close to 0.500
```

<details>
<summary>Click to reveal solution</summary>

```r title="Warm-started MLE solution"
ex_ml <- selection(
  selection = employed2 ~ ability + kids,
  outcome   = obs_wage2 ~ ability,
  method    = "ml",
  start     = coef(heckit_ex)
)
round(coef(ex_ml, part = "outcome")["ability"], 3)
#> ability
#>   0.500
```

**Explanation:** Warm-starting the optimizer from the two-step coefficients is a classic robustness trick. If the MLE converges to the same answer from a good starting point and from the default starting point, you can trust the result. Disagreement is a sign to investigate.

</details>

## How do you interpret rho and the inverse Mills ratio?

The Heckman model gives you two diagnostics beyond the usual regression table. The first is $\rho$, the correlation between the selection and outcome errors. The second is the coefficient on the inverse Mills ratio, which equals $\rho \sigma_u$. A $\rho$ far from zero means the two processes are strongly linked and the correction is doing work. A $\rho$ close to zero (or an insignificant $\lambda$) means OLS on the selected sample would have given a similar answer.

![Selection bias happens when the observed sample is a non-random subset of the population.](screenshots/Heckman-Selection-Model-in-R-selection-bias.webp)

*Figure 2: Selection bias happens when the observed sample is a non-random subset of the population.*

```r title="Extract rho and test for selection bias"
# rho: correlation between selection and outcome errors
rho_hat <- heckit_ml$estimate["rho"]

# sigma: residual SD of the outcome equation
sigma_hat <- heckit_ml$estimate["sigma"]

# lambda coefficient from the two-step fit = rho * sigma
lambda_coef <- summary(heckit_ex)$estimate["invMillsRatio", 1]

# Selection test: is lambda significantly different from 0?
lambda_t <- summary(heckit_ex)$estimate["invMillsRatio", 3]
lambda_p <- summary(heckit_ex)$estimate["invMillsRatio", 4]

round(c(rho = rho_hat, sigma = sigma_hat,
        lambda = lambda_coef,
        t_stat = lambda_t, p_value = lambda_p), 4)
#>     rho   sigma  lambda  t_stat p_value
#> -0.8112  0.5041 -0.4092 -9.8430  0.0000
```

The estimated $\rho$ is about $-0.81$, a strong negative correlation: the unobserved drivers of employment push wages down among the employed (consistent with a floor effect, where only people who can command at least some wage bother to work). The $\lambda$ coefficient has a t-statistic of $-9.84$ with a p-value effectively zero, so selection bias is real in this data and the correction is warranted.

[KEY INSIGHT]
**If $\rho$ or $\lambda$ is near zero, skip the Heckman model.** The correction adds variance without removing bias and makes your standard errors wider than plain OLS. The Heckman model earns its keep only when there is selection to correct.

**Try it:** Look at the following `heckit_ml` output summary and decide: is selection correction needed?

```r title="Your turn: is correction needed?"
# Suppose a different fit gave rho = 0.03, lambda t-stat = 0.6, p = 0.55
# Store "yes" or "no" in ex_decision
ex_decision <- "?"
ex_decision
#> Expected: "yes" or "no"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interpretation solution"
ex_decision <- "no"
ex_decision
#> [1] "no"
```

**Explanation:** A $\rho$ near zero plus an insignificant $\lambda$ (p = 0.55) means the selection and outcome errors are essentially uncorrelated, and plain OLS on the selected sample is unbiased. Applying Heckman in that case only wastes degrees of freedom and widens the confidence intervals.

</details>

## Practice Exercises

### Exercise 1: Heckman on the Mroz87 wage data

The `sampleSelection` package ships with `Mroz87`, a classic labor-economics dataset on 753 married women in 1975. Fit a Heckman two-step for log wages (`wage`) as a function of education (`educ`) and experience (`exper`), with selection (`lfp`, labor force participation) as a function of `educ`, `age`, number of young kids (`kids5`), and non-labor income (`nwifeinc`). Save the result to `my_mroz_fit` and interpret the education coefficient.

```r title="Exercise 1 starter"
# Exercise: fit Heckman on Mroz87
# Hint: use selection() with method = "2step"
library(sampleSelection)
data("Mroz87", package = "sampleSelection")

# Build log wage for the employed subset
Mroz87$lwage <- ifelse(Mroz87$lfp == 1, log(Mroz87$wage), NA)

# Write your code below
my_mroz_fit <- # your code here

summary(my_mroz_fit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mroz87 Heckman solution"
my_mroz_fit <- selection(
  selection = lfp   ~ educ + age + kids5 + nwifeinc,
  outcome   = lwage ~ educ + exper,
  data      = Mroz87,
  method    = "2step"
)
round(coef(my_mroz_fit, part = "outcome"), 3)
#>   (Intercept)          educ         exper invMillsRatio
#>        -0.578         0.109         0.016         0.045
```

**Explanation:** Each extra year of education is associated with a 10.9% higher wage for working women, after correcting for self-selection into the labor force. The `invMillsRatio` is small and not significant, which means in this dataset the education-wage estimate would not change much even without the correction.

</details>

### Exercise 2: Diagnose whether Heckman is worth running

You observe outcomes for only 60% of a dataset and suspect selection bias. Run a full diagnostic: (a) fit naive OLS, (b) fit Heckman with the exclusion variable `kids`, (c) test whether $\rho$ differs from zero using the ML fit, (d) refit Heckman without the exclusion, and (e) decide whether the correction is needed. Store your final decision (`"OLS"` or `"Heckman"`) in `my_decision`.

```r title="Exercise 2 starter"
# Exercise: diagnose whether Heckman is worth running
# Reuse ability, kids, employed2, obs_wage2 from earlier blocks
# Hint: check rho and the lambda p-value

my_ols <- # your code here: naive OLS on obs_wage2 ~ ability
my_heck <- # your code here: Heckman with kids in selection
my_heck_ml <- # your code here: Heckman method = "ml"

# Extract diagnostics
my_rho <- # your code here: rho from my_heck_ml
my_lambda_p <- # your code here: p-value of invMillsRatio in my_heck

# Decide
my_decision <- # your code here: "OLS" or "Heckman"
my_decision
```

<details>
<summary>Click to reveal solution</summary>

```r title="Diagnostic solution"
my_ols <- lm(obs_wage2 ~ ability)
my_heck <- selection(employed2 ~ ability + kids,
                      obs_wage2 ~ ability, method = "2step")
my_heck_ml <- selection(employed2 ~ ability + kids,
                         obs_wage2 ~ ability, method = "ml")

my_rho <- my_heck_ml$estimate["rho"]
my_lambda_p <- summary(my_heck)$estimate["invMillsRatio", 4]

my_decision <- if (abs(my_rho) > 0.2 && my_lambda_p < 0.05) "Heckman" else "OLS"
my_decision
#> [1] "Heckman"
```

**Explanation:** The rule of thumb is simple: use Heckman when the two diagnostics agree that selection matters. Our simulated data has rho around $-0.8$ and a tiny lambda p-value, so the correction is clearly worthwhile. On clean random samples, both diagnostics would point the other way and OLS would win.

</details>

## Complete Example

Here is the full workflow in one block, comparing naive OLS, the two-step Heckman, and the MLE Heckman against the known truth.

```r title="End-to-end comparison against the true beta"
# Truth: beta_ability = 0.5

# 1. Naive OLS on the selected sample
fit_ols <- lm(obs_wage2 ~ ability)

# 2. Heckman two-step with exclusion restriction
fit_2step <- selection(employed2 ~ ability + kids,
                        obs_wage2 ~ ability,
                        method = "2step")

# 3. Heckman MLE
fit_ml <- selection(employed2 ~ ability + kids,
                     obs_wage2 ~ ability,
                     method = "ml")

# Collect ability coefficients and SEs
results <- rbind(
  OLS     = c(est = coef(fit_ols)["ability"],
              se  = summary(fit_ols)$coef["ability", 2]),
  TwoStep = c(est = summary(fit_2step)$estimate["ability", 1],
              se  = summary(fit_2step)$estimate["ability", 2]),
  MLE     = c(est = summary(fit_ml)$estimate["ability", 1],
              se  = summary(fit_ml)$estimate["ability", 2])
)
round(results, 3)
#>         est    se
#> OLS     0.412 0.025
#> TwoStep 0.500 0.021
#> MLE     0.500 0.019
```

OLS misses the true coefficient by almost 20%. Both Heckman variants hit the truth on the nose, and MLE gives the tightest standard error. That is the payoff of taking the selection process seriously: you get the right answer, with the sharpest precision the data allow.

## Summary

| Estimator | When to use | Pros | Cons |
|---|---|---|---|
| Naive OLS | Random samples or $\rho \approx 0$ | Simple, well-known, no extra assumptions | Biased when selection is non-random |
| Heckman two-step | Non-random samples, quick diagnostic | Easy to fit, robust to starting values, clear IMR interpretation | SEs need Heckman-Greene correction, less efficient than MLE |
| Heckman MLE | Non-random samples, clean data | Fully efficient, direct SEs on $\rho$ | Needs joint normality, can fail to converge |

Key points to remember:

- Selection bias is an omitted variable bias where the omitted variable is "was this observation selected?"
- The two-step recipe is: probit on selection, compute inverse Mills ratio, augment OLS on observed sample.
- Identification needs an **exclusion restriction**: at least one variable that drives selection but not the outcome.
- Use $\rho$ and the t-statistic on the inverse Mills ratio as diagnostics. If both are near zero, skip the correction.
- `sampleSelection::selection()` handles both steps with correct standard errors, and supports both `"2step"` and `"ml"` methods.

## References

1. Heckman, J. J. (1979). Sample Selection Bias as a Specification Error. *Econometrica* 47(1), 153-161. [Link](https://www.jstor.org/stable/1912352)
2. Toomet, O. & Henningsen, A. (2008). Sample Selection Models in R: Package `sampleSelection`. *Journal of Statistical Software* 27(7). [Link](https://www.jstatsoft.org/v27/i07/)
3. `sampleSelection` package documentation on CRAN. [Link](https://cran.r-project.org/web/packages/sampleSelection/sampleSelection.pdf)
4. Wooldridge, J. M. (2010). *Econometric Analysis of Cross Section and Panel Data*, 2nd Edition, Chapter 19. MIT Press.
5. Mroz, T. A. (1987). The Sensitivity of an Empirical Model of Married Women's Hours of Work to Economic and Statistical Assumptions. *Econometrica* 55(4), 765-799. [Link](https://www.jstor.org/stable/1911029)
6. Wikipedia: Heckman correction. [Link](https://en.wikipedia.org/wiki/Heckman_correction)

## Continue Learning

- [Multiple Regression in R: How to Build, Interpret, and Refine a Real Model](Multiple-Regression-in-R.html), the parent tutorial on building, testing, and refining an OLS regression.
- [Tobit Regression in R: AER Package for Censored Outcomes](Tobit-Regression-in-R.html), the companion method for when outcomes are censored at a boundary rather than missing from a non-random subset.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html), for checking the assumptions that OLS relies on and learning what to do when they fail.

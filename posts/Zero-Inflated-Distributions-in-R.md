---
title: "Zero-Inflated Distributions in R: Handle Excess Zeros in Count Data"
slug: "Zero-Inflated-Distributions-in-R"
description: "Count data with excess zeros? Fit zero-inflated Poisson and negative binomial models in R with pscl::zeroinfl(). Diagnose, interpret, and compare models."
keywords: "zero-inflated poisson, ZIP model R, zeroinfl, excess zeros count data, zero-inflated negative binomial, ZINB, pscl zeroinfl, hurdle model R, count regression R, overdispersion zeros"
auto_link_terms: "zero-inflated poisson|zero-inflated negative binomial|ZIP model|ZINB model|excess zeros|zeroinfl()|hurdle model"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-17"
curriculum_id: "FR-prob-11"
post_type: "FR"
fr_parent: "Binomial-and-Poisson-Distributions-in-R.html"
difficulty: "Intermediate"
---

# Zero-Inflated Distributions in R: Handle Excess Zeros in Count Data

<p class="lead">Zero-inflated distributions model count data that has far more zeros than a plain Poisson or negative binomial would expect. You fit them in R with <code>pscl::zeroinfl()</code>, which couples a logistic model for the "always zero" process with a count model for the rest.</p>

## When do you need a zero-inflated model?

Lots of real count data is weird in one specific way: there are way more zeros than any standard model predicts. Insurance claims per policy, articles published per PhD student, fish caught per park visitor, each has a cluster of people who produce zero no matter what. The fastest check is quantitative: fit a plain Poisson, ask how many zeros it *would* predict, and compare that to what you actually see. When the gap is large, the plain Poisson is not just wrong about the zeros, it's biased across the whole fitted curve.

```r
# Simulate counts with excess zeros, then compare to a plain Poisson's expectation.
library(pscl)
set.seed(42)

n <- 500
# 60% of observations are "always zero"; the rest draw from Poisson(3)
structural <- rbinom(n, 1, 0.6)
counts     <- ifelse(structural == 1, 0, rpois(n, lambda = 3))

observed_zeros         <- sum(counts == 0)
mean_rate              <- mean(counts)
expected_zeros_poisson <- length(counts) * dpois(0, lambda = mean_rate)

cat("Observed zeros:           ", observed_zeros, "\n")
cat("Expected under Poisson:   ", round(expected_zeros_poisson, 1), "\n")
cat("Zero-excess ratio:        ", round(observed_zeros / expected_zeros_poisson, 2), "\n")
#> Observed zeros:            308
#> Expected under Poisson:    145.6
#> Zero-excess ratio:         2.12
```

The data has 308 zeros, but a plain Poisson fitted to the same mean expects only about 146. The ratio is roughly 2x, clear zero inflation. Keep that ratio in mind: anything above ~1.5 should make you reach for a zero-inflated or hurdle model rather than a vanilla Poisson fit.

[KEY INSIGHT]
**Zero inflation is a distributional diagnosis, not just "a lot of zeros."** A Poisson with mean 0.1 *should* produce mostly zeros, that's not zero inflation. What makes it inflation is that the number of zeros exceeds what the fitted count distribution predicts at its own best rate.

**Try it:** Drop the structural-zero probability from 0.6 to 0.3 and re-measure the zero-excess ratio. You should see the ratio fall but still sit clearly above 1.

```r
# Try it: rerun the simulation with 30% structural zeros.
set.seed(42)
n <- 500
ex_structural <- rbinom(n, 1, 0.3)
ex_counts     <- ifelse(ex_structural == 1, 0, rpois(n, lambda = 3))

# your code here: compute observed_zeros, expected_zeros_poisson, and their ratio

#> Expected: ratio drops to roughly 1.3–1.6 (still inflated, but less dramatic).
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
n <- 500
ex_structural <- rbinom(n, 1, 0.3)
ex_counts     <- ifelse(ex_structural == 1, 0, rpois(n, lambda = 3))

ex_obs_zeros <- sum(ex_counts == 0)
ex_exp_zeros <- length(ex_counts) * dpois(0, lambda = mean(ex_counts))
round(ex_obs_zeros / ex_exp_zeros, 2)
#> [1] 1.52
```

**Explanation:** Fewer structural zeros means less inflation. The ratio tracks the structural probability directly, it shrinks toward 1 as that probability goes to 0.

</details>

## What causes excess zeros, structural vs sampling?

A zero-inflated distribution assumes two separate mechanisms produce zeros. Some observations are **structural zeros**, they can never produce a positive count. A subscriber who doesn't own the product will report zero purchases this month *and* every other month. Other observations go through the count process and happen to draw zero, these are **sampling zeros**. A subscriber who does own the product may simply not have purchased anything this month.

Mathematically, the mixture is:

$$P(Y = 0) = \pi + (1 - \pi)\,e^{-\lambda}$$

$$P(Y = k) = (1 - \pi) \cdot \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 1, 2, 3, \ldots$$

Where:

- $\pi$ = probability an observation is a structural zero (the "zero-inflation" probability)
- $\lambda$ = Poisson mean for the count process
- $Y$ = observed count

The first term of $P(Y=0)$ is the structural-zero mass; the second is the ordinary Poisson zero. Both contribute to the zeros you see in the data.

```r
# Simulate the mixture explicitly so you can decompose the zeros.
set.seed(7)
n <- 1000
lambda <- 2
pi     <- 0.3

is_structural_zero <- rbinom(n, 1, prob = pi)
count_component    <- rpois(n, lambda = lambda)
y <- ifelse(is_structural_zero == 1, 0, count_component)

structural_zero_count <- sum(is_structural_zero == 1)
sampling_zero_count   <- sum(is_structural_zero == 0 & count_component == 0)

cat("Structural zeros:         ", structural_zero_count, "\n")
cat("Sampling zeros (Poisson): ", sampling_zero_count, "\n")
cat("Total zeros observed:     ", sum(y == 0), "\n")
#> Structural zeros:          284
#> Sampling zeros (Poisson):  98
#> Total zeros observed:      382
```

The 382 observed zeros are made up of 284 structural (about 28% of the sample) plus 98 that came from the count process drawing zero. Crucially, after the indicator collapses, you can't tell them apart by eye, the structural zero and the sampling zero look identical in `y`. That's exactly what the model has to estimate.

![Two sources of zeros](screenshots/Zero-Inflated-Distributions-in-R-two-zero-sources.webp)

*Figure 1: The mixture mechanism behind zero-inflated distributions. Every observation is either a structural zero or a draw from the count process, which may itself land on zero.*

[NOTE]
**You cannot label which zeros are structural in real data.** The model separates the two sources by fitting a logistic component for the structural probability and a count component for the rest. Both are estimated from the same observed counts.

**Try it:** Keep `pi` at 0.3 but raise `lambda` from 2 to 5. Predict what happens to the sampling zero count before you run the code, then check.

```r
# Try it: higher lambda should reduce sampling zeros.
set.seed(7)
n <- 1000
ex_pi     <- 0.3
ex_lambda <- 5

# your code here: generate the mixture and count structural vs sampling zeros.

#> Expected: sampling zeros fall to under 10; structural zeros stay near 300.
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(7)
n <- 1000
ex_pi     <- 0.3
ex_lambda <- 5

ex_struct   <- rbinom(n, 1, ex_pi)
ex_count    <- rpois(n, lambda = ex_lambda)
ex_y        <- ifelse(ex_struct == 1, 0, ex_count)

c(structural = sum(ex_struct == 1),
  sampling   = sum(ex_struct == 0 & ex_count == 0))
#> structural   sampling
#>        284          6
```

**Explanation:** At $\lambda = 5$, the Poisson puts almost no mass at zero, so the count process rarely produces a zero. Almost every zero you see is now structural.

</details>

## How do you fit zero-inflated Poisson with zeroinfl()?

The pscl package ships the `bioChemists` dataset, publication counts for 915 biochemistry PhD students in their last three years of the program, which is the canonical teaching dataset for zero-inflated models. Many students published zero articles. The predictors include gender (`fem`), marital status (`mar`), number of young children (`kid5`), PhD prestige (`phd`), and mentor productivity (`ment`).

```r
# Load bioChemists and check the zero pile-up.
data("bioChemists", package = "pscl")
str(bioChemists)
#> 'data.frame':	915 obs. of  6 variables:
#>  $ art : num  0 0 0 0 0 0 0 0 0 0 ...
#>  $ fem : Factor w/ 2 levels "Men","Women": 1 1 2 1 1 2 2 1 1 2 ...
#>  $ mar : Factor w/ 2 levels "Single","Married": 2 1 1 2 1 1 1 1 1 2 ...
#>  $ kid5: num  0 0 0 1 0 2 0 0 0 0 ...
#>  $ phd : num  2.52 2.05 3.75 1.18 3.75 ...
#>  $ ment: num  7 6 6 3 26 2 3 4 6 0 ...

table(bioChemists$art)
#>   0   1   2   3   4   5   6   7   8   9  10  11  12  16  19
#> 275 246 178 104  54  24  11   5   1   2   1   1   2   1   1
```

About 30% of the sample published zero articles, an obvious candidate for zero inflation. Now fit the ZIP model. The formula uses a pipe (`|`) separator: predictors to the left drive the count process, predictors to the right drive the zero-inflation process.

```r
# Fit ZIP with the same predictors on both components.
m_zip <- zeroinfl(art ~ fem + mar + kid5 + phd + ment |
                        fem + mar + kid5 + phd + ment,
                  data = bioChemists, dist = "poisson")

summary(m_zip)
#> 
#> Count model coefficients (poisson with log link):
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.62108    0.12089   5.138 2.78e-07 ***
#> femWomen     -0.20907    0.06348  -3.294 0.000989 ***
#> marMarried    0.10379    0.07116   1.459 0.144570
#> kid5         -0.14314    0.04713  -3.037 0.002389 **
#> phd          -0.00618    0.03109  -0.199 0.842418
#> ment          0.01810    0.00229   7.906 2.65e-15 ***
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -0.57754    0.50931  -1.134   0.2568
#> femWomen      0.10949    0.28008   0.391   0.6958
#> marMarried   -0.35403    0.31762  -1.115   0.2651
#> kid5          0.21714    0.19682   1.103   0.2698
#> phd           0.00127    0.14543   0.009   0.9930
#> ment         -0.13385    0.04526  -2.957   0.0031 **
#>
#> Log-likelihood: -1605 on 12 Df
```

The output has two blocks. The **count model** describes what drives the Poisson rate among non-structural observations: being a woman lowers the rate, young kids lower the rate, and mentor publications raise it. The **zero-inflation model** describes what makes an observation more likely to be a structural zero: only `ment` is significant, students with less-productive mentors are far more likely to be in the "will not publish at all" group. Intercepts are on the log and logit scales respectively.

[TIP]
**Use different predictors for the two components when theory warrants it.** The `|` separator lets you specify a minimal zero-inflation model (say, just `ment`) alongside a fuller count model. That often fits better and is easier to interpret.

Exponentiating the coefficients makes the count side easier to read as **incidence rate ratios (IRRs)** and the zero side as **odds ratios**.

```r
# IRRs for the count model and odds ratios for the zero-inflation model.
count_irr <- exp(coef(m_zip, model = "count"))
zero_or   <- exp(coef(m_zip, model = "zero"))

round(count_irr, 3)
#> (Intercept)    femWomen  marMarried       kid5        phd       ment
#>       1.861       0.811       1.109       0.867      0.994      1.018
round(zero_or, 3)
#> (Intercept)    femWomen  marMarried       kid5        phd       ment
#>       0.561       1.116       0.702       1.242      1.001      0.875
```

Among publishing students, women publish at 0.81x the rate of men (a 19% lower rate); each additional child under five drops the rate by 13%; each extra mentor publication adds 1.8% to the rate. On the zero side, each extra mentor publication multiplies the odds of being a structural zero by 0.875, about a 13% drop per unit, which matches the intuition that productive mentors pull students out of the "never publishes" group entirely.

**Try it:** Fit a ZIP model where the zero-inflation side uses only `ment`, while the count side keeps all five predictors. Compare the log-likelihood to `m_zip`.

```r
# Try it: sparser zero-inflation component.
ex_zip <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment,
                   data = bioChemists, dist = "poisson")

# your code here: print logLik(ex_zip) and compare with logLik(m_zip).

#> Expected: log-likelihoods are close (within ~2), so the sparser model is defensible.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_zip <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment,
                   data = bioChemists, dist = "poisson")

c(full = as.numeric(logLik(m_zip)),
  sparse = as.numeric(logLik(ex_zip)))
#>     full   sparse
#> -1605.0  -1606.8
```

**Explanation:** Dropping four non-significant zero-inflation predictors costs ~2 log-likelihood units across 4 degrees of freedom, no worse by AIC. The sparser model is the right choice here.

</details>

## How do you choose between ZIP, ZINB, and hurdle models?

Zero inflation and **overdispersion** (variance larger than the mean) are different problems that often show up together. A ZIP model handles excess zeros but still assumes the non-structural counts are Poisson, so variance equals mean. When the non-zero counts are overdispersed too, you want a **zero-inflated negative binomial (ZINB)** instead. If you suspect the zero-generating process is categorically different from the count process (think: visiting a park at all vs how many fish you caught *given* you went), a **hurdle model** may fit better.

```r
# Fit plain Poisson, ZIP, and ZINB on bioChemists and compare by AIC.
library(MASS)

m_poisson <- glm(art ~ fem + mar + kid5 + phd + ment,
                 data = bioChemists, family = poisson)
m_zinb    <- zeroinfl(art ~ fem + mar + kid5 + phd + ment |
                            fem + mar + kid5 + phd + ment,
                      data = bioChemists, dist = "negbin")

AIC(m_poisson, m_zip, m_zinb)
#>            df      AIC
#> m_poisson   6 3314.113
#> m_zip      12 3233.546
#> m_zinb     13 3170.929
```

ZINB beats ZIP by ~63 AIC points, and ZIP beats plain Poisson by ~80. The ordering is the usual one: adding a zero-inflation component buys a large chunk of fit, and allowing the count variance to exceed the mean buys another. A difference of more than 10 AIC units is "strong evidence" territory.

![Count model decision flow](screenshots/Zero-Inflated-Distributions-in-R-model-decision.webp)

*Figure 2: Decision flow for choosing between Poisson, NB, ZIP, ZINB, and hurdle models based on zero excess and overdispersion.*

A second diagnostic is the **predicted zero count**. A well-fitting model should predict about as many zeros as you observed.

```r
# Compare predicted zeros to observed.
observed_zero_n <- sum(bioChemists$art == 0)

pred_zeros_poisson <- sum(dpois(0, lambda = fitted(m_poisson)))
pred_zeros_zip     <- sum(predict(m_zip,  type = "prob")[, "0"])
pred_zeros_zinb    <- sum(predict(m_zinb, type = "prob")[, "0"])

round(c(observed = observed_zero_n,
        poisson  = pred_zeros_poisson,
        zip      = pred_zeros_zip,
        zinb     = pred_zeros_zinb), 1)
#> observed  poisson      zip     zinb
#>    275.0    213.3    275.0    275.1
```

Plain Poisson under-predicts by 60+ zeros. Both ZIP and ZINB nail the observed count, as expected, since both have an explicit zero-inflation component. AIC then breaks the tie in favor of ZINB because of the non-zero counts.

[WARNING]
**Don't pick ZIP just because you see zeros.** Fit the plain Poisson first. If its predicted zero count is close to what you observe, you don't need zero inflation at all. Zero-inflated models are more complex, harder to interpret, and can over-fit when the zero-inflation component is weakly identified.

**Try it:** Using `predict(m_zinb, type = "prob")`, find the observation with the highest estimated probability of being a structural zero. What are its covariates?

```r
# Try it: find the "most likely structural zero" row.
ex_probs <- predict(m_zinb, type = "zero")   # Pr(structural zero | x)

# your code here: identify the argmax and print its row from bioChemists.

#> Expected: a student with very few mentor publications and young kids at home.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_idx <- which.max(predict(m_zinb, type = "zero"))
ex_pred <- predict(m_zinb, type = "zero")[ex_idx]
round(ex_pred, 3)
#> [1] 0.668

bioChemists[ex_idx, ]
#>     art  fem     mar kid5  phd ment
#> 914   0 Women Married    3 3.59    0
```

**Explanation:** Highest structural-zero probability (~67%) is a woman with three young children and a mentor with zero publications, exactly the profile the model flagged via the `ment` coefficient.

</details>

## Practice Exercises

### Exercise 1: Trimmed ZINB

Fit a ZINB on `bioChemists` using **only** `ment` and `kid5` on the zero-inflation side, while keeping all five predictors on the count side. Compare its AIC to the full `m_zinb`. Which model wins and by how much? Store your trimmed model in `my_zinb_trim`.

```r
# Exercise 1
# Hint: use the | operator to separate the count and zero components.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_zinb_trim <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment + kid5,
                         data = bioChemists, dist = "negbin")
AIC(m_zinb, my_zinb_trim)
#>              df      AIC
#> m_zinb       13 3170.929
#> my_zinb_trim 9 3167.223
```

**Explanation:** Dropping three non-significant zero-inflation predictors saved four degrees of freedom and lowered AIC by ~4. Simpler wins, that's what AIC rewards.

</details>

### Exercise 2: Simulate ZINB, fit both, pick the winner

Simulate 1000 counts from a zero-inflated negative binomial process: structural probability = 0.4, non-zero counts drawn from a negative binomial with mean 5 and `size = 2` (moderate overdispersion). Fit both ZIP and ZINB on a single predictor. Use `AIC()` to pick the winner. Store the simulated counts in `my_y` and the two fits in `my_zip` and `my_zinb_fit`.

```r
# Exercise 2
# Hint: rbinom() for the structural indicator, rnbinom(mu=5, size=2) for the count component.
# Fit with zeroinfl(my_y ~ x | x, dist = "poisson") and dist = "negbin".

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(2026)
n <- 1000
x <- rnorm(n)

is_sz <- rbinom(n, 1, 0.4)
nb_y  <- rnbinom(n, size = 2, mu = exp(1.3 + 0.4 * x))
my_y  <- ifelse(is_sz == 1, 0, nb_y)

my_zip      <- zeroinfl(my_y ~ x | x, dist = "poisson")
my_zinb_fit <- zeroinfl(my_y ~ x | x, dist = "negbin")

AIC(my_zip, my_zinb_fit)
#>              df      AIC
#> my_zip        4 6214.80
#> my_zinb_fit   5 4790.44
```

**Explanation:** ZINB wins by ~1400 AIC. ZIP cannot absorb the overdispersion from `size = 2`, so it inflates its log-likelihood penalty badly. Whenever you suspect variance much larger than mean, try ZINB before settling on ZIP.

</details>

## Complete Example: Park Fishing Counts

Here's a full walkthrough, simulate, explore, fit, diagnose, interpret, on a fishing-visitor dataset. Some groups never fished (structural zero), some fished but caught nothing (sampling zero), and a few did well.

```r
# End-to-end: fishing counts at a park.
set.seed(99)
fish_n <- 250

# Predictor: whether the group had children (more kids → less fishing)
fish_groups <- data.frame(kids = rbinom(fish_n, 1, 0.5))

# Structural zero rate rises with kids present
fish_pi     <- plogis(-1 + 1.2 * fish_groups$kids)

# Count process: Poisson with mean depending on kids
fish_lambda <- exp(1.6 - 0.3 * fish_groups$kids)

fish_is_sz  <- rbinom(fish_n, 1, fish_pi)
fish_counts <- ifelse(fish_is_sz == 1, 0, rpois(fish_n, lambda = fish_lambda))
fish_groups$caught <- fish_counts

# Explore
table(fish_counts)
#> fish_counts
#>   0   1   2   3   4   5   6   7   8   9  10  12
#> 127  36  26  20  13   9  10   3   3   1   1   1

# Fit three models
fish_p    <- glm(caught ~ kids, data = fish_groups, family = poisson)
fish_zip  <- zeroinfl(caught ~ kids | kids, data = fish_groups, dist = "poisson")
fish_zinb <- zeroinfl(caught ~ kids | kids, data = fish_groups, dist = "negbin")

AIC(fish_p, fish_zip, fish_zinb)
#>           df      AIC
#> fish_p     2 1293.88
#> fish_zip   4 1059.79
#> fish_zinb  5 1061.78

# Interpret the ZIP winner
summary(fish_zip)
#> Count model (poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  1.61098    0.04844   33.25   <2e-16 ***
#> kids        -0.31440    0.07901   -3.98  6.9e-05 ***
#>
#> Zero-inflation model (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.97940    0.21763  -4.500 6.79e-06 ***
#> kids         1.16541    0.28554   4.082 4.47e-05 ***
```

ZIP wins by ~2 AIC units over ZINB, the non-zero counts are Poisson-dispersed enough that the extra parameter in ZINB isn't worth it. Both the count and zero components recover the simulation truth: the `kids` coefficient is negative on the count side and positive on the zero side, meaning families with children both fish less and are more likely to never fish at all. That's the value of the two-part model, one variable can affect both "will this happen at all?" and "how much if it does?" with different effect sizes.

## Summary

| Concept | Takeaway |
|---|---|
| When to use ZI | Observed zeros exceed what a plain Poisson/NB predicts by >1.5x |
| Two-component mixture | Structural zeros (always) + sampling zeros (Poisson/NB draws) |
| `zeroinfl()` syntax | `y ~ count_preds \| zero_preds`, `dist = "poisson"` or `"negbin"` |
| ZIP vs ZINB | Use ZINB when non-zero counts are overdispersed (AIC separates them) |
| Diagnostic check | Compare observed zeros to predicted zeros from each model |
| IRR and OR | `exp(coef())` gives incidence rate ratios (count) and odds ratios (zero) |
| Hurdle alternative | Use when zero process is conceptually separate from the count process |

## References

1. Zeileis, A., Kleiber, C., Jackman, S., *Regression Models for Count Data in R*. Journal of Statistical Software (2008). [Link](https://www.jstatsoft.org/article/view/v027i08)
2. Lambert, D., *Zero-Inflated Poisson Regression, with an Application to Defects in Manufacturing*. Technometrics (1992). [Link](https://www.jstor.org/stable/1269547)
3. pscl package, `zeroinfl` reference documentation. [Link](https://www.rdocumentation.org/packages/pscl/topics/zeroinfl)
4. UCLA OARC, *Zero-Inflated Poisson Regression (R Data Analysis Examples)*. [Link](https://stats.oarc.ucla.edu/r/dae/zip/)
5. Cameron, A. C., Trivedi, P. K., *Regression Analysis of Count Data*, 2nd ed. Cambridge University Press (2013).
6. Hartig, F., DHARMa package, *Residual diagnostics for hierarchical (multi-level / mixed) regression models*. [Link](https://cran.r-project.org/package=DHARMa)
7. R Core Team, `stats::glm` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)

## Continue Learning

1. [Binomial & Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html), the count models that zero inflation extends.
2. [Geometric & Negative Binomial Distributions in R](Geometric-and-Negative-Binomial-Distributions-in-R.html), the overdispersion-friendly count family behind ZINB.
3. [Logistic Regression With R](Logistic-Regression-With-R.html), the logit model that drives the zero-inflation component.

---
title: "Bayes Factors in R: BayesFactor Package as Alternative to p-Values"
slug: "Bayes-Factors-in-R"
description: "A Bayes factor quantifies evidence for H1 vs H0 as a ratio. Use R's BayesFactor package for ttestBF, anovaBF, regressionBF with Kass-Raftery guidance."
keywords: "bayes factor, BayesFactor package, ttestBF, anovaBF, regressionBF, bayesian alternative to p-values, Kass-Raftery scale, Jeffreys evidence scale, bayesian hypothesis testing"
auto_link_terms: "Bayes factor|Bayes factors|BayesFactor package|ttestBF()|anovaBF()|regressionBF()|Kass-Raftery scale|Jeffreys scale|bayesian alternative to p-values"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-25"
curriculum_id: "FR-infe-12"
post_type: "FR"
fr_parent: "Hypothesis-Testing-in-R.html"
difficulty: "Intermediate"
---

# Bayes Factors in R: BayesFactor Package as Alternative to p-Values

<p class="lead">A Bayes factor is a ratio that compares how well two hypotheses predict your data. Unlike a p-value, it can support either H0 or H1, and it stays interpretable as a direct measure of evidence. In R, the BayesFactor package computes it for t-tests, ANOVA, regression, correlation, and contingency tables with one function call.</p>

## How do I compute my first Bayes factor in R?

The `BayesFactor` package gives you a one-line answer to the question classical tests can't ask: how much more likely is my data under H1 than under H0? We will start with the built-in `sleep` dataset, where 10 patients were measured under two drug conditions. A paired t-test tells you whether the means differ. `ttestBF()` tells you how strongly the data prefer "they differ" over "they don't."

```r title="First Bayes factor on the sleep dataset"
library(BayesFactor)

set.seed(42)
data(sleep)

# Paired Bayes factor: does drug 2 increase sleep over drug 1?
bf_sleep <- ttestBF(x = sleep$extra[sleep$group == 2],
                    y = sleep$extra[sleep$group == 1],
                    paired = TRUE)
bf_sleep
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 17.25888 ±0%
#>
#> Against denominator:
#>   Null, mu = 0
#> ---
#> Bayes factor type: BFoneSample, JZS
```

The Bayes factor is **17.26**. That means the data are about 17 times more likely under the alternative ("the two drugs produce different sleep gains") than under the null ("they don't"). The package prints the prior used (`r=0.707`, the JZS default) and a tiny error estimate (`±0%`). Convert evidence to plain numbers with `extractBF(bf_sleep)$bf`.

**Try it:** Compute a two-sample Bayes factor on `mtcars` for whether `mpg` differs between automatic and manual transmissions (`am`). Save the result to `ex_bf_am` and print it.

```r title="Your turn: Bayes factor on mtcars mpg by am"
# Use ttestBF with the formula interface
ex_bf_am <- # your code here

ex_bf_am
#> Expected: Bayes factor around 86 to 87 (very strong evidence)
```

<details>
<summary>Click to reveal solution</summary>

```r title="mpg by am Bayes factor solution"
ex_bf_am <- ttestBF(formula = mpg ~ am, data = mtcars)
ex_bf_am
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 86.59 ±0%
```

**Explanation:** The formula `mpg ~ am` tells `ttestBF()` to compare `mpg` between the two levels of `am`. A Bayes factor near 86 means the data favor "automatic and manual cars have different fuel efficiency" by about 86-to-1, very strong evidence under the Kass-Raftery scale.

</details>

## What does the Bayes factor value mean?

A Bayes factor is the ratio of two predictions. The numerator is how likely your observed data would be if H1 (an effect exists) is true. The denominator is the same thing for H0 (no effect). Bigger ratios favor H1; smaller ratios favor H0; values near 1 mean the data are roughly equally compatible with both.

$$BF_{10} = \frac{P(\text{data} \mid H_1)}{P(\text{data} \mid H_0)}$$

Where:
- $BF_{10}$ = Bayes factor in favor of H1 over H0
- $P(\text{data} \mid H_1)$ = probability of seeing your data if H1 is true
- $P(\text{data} \mid H_0)$ = probability of seeing your data if H0 is true

Kass and Raftery (1995) suggested a rough scale for translating BF values into evidence strength.

![Bayes factor evidence scale](screenshots/Bayes-Factors-in-R-evidence-scale.webp)
*Figure 1: How Bayes factor values map to strength of evidence. Values below 1 favor the null; values above 1 favor the alternative.*

What if there really is no effect? The BF should drop below 1, telling you the data prefer H0. Let's simulate that.

```r title="Bayes factor when the null is true"
set.seed(99)
null_x <- rnorm(30, mean = 0, sd = 1)
null_y <- rnorm(30, mean = 0, sd = 1)

bf_null <- ttestBF(x = null_x, y = null_y)
bf_null
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 0.2655 ±0.01%
```

The Bayes factor is **0.27**. The reciprocal is `1 / 0.27 ≈ 3.8`, so the data are about 3.8 times more likely under H0 than under H1. This is the property that makes Bayes factors so useful: **they can quantify evidence FOR the null**. A non-significant p-value never lets you say "the null is supported"; a small BF does.

[KEY INSIGHT]
**Bayes factors let you affirm the null when the data deserve it.** Classical tests can only "fail to reject" H0, an uncomfortable double negative. With a BF of 0.27, you can say plainly: "the data prefer H0 to H1 by about 4-to-1."

**Try it:** Take the `bf_null` result above and "flip" it to express evidence in favor of H0 by computing `1 / extractBF(bf_null)$bf`. Save it to `ex_flip` and round to 2 decimals.

```r title="Your turn: flip the Bayes factor"
ex_flip <- # your code here

ex_flip
#> Expected: about 3.77
```

<details>
<summary>Click to reveal solution</summary>

```r title="Flip Bayes factor solution"
ex_flip <- round(1 / extractBF(bf_null)$bf, 2)
ex_flip
#> [1] 3.77
```

**Explanation:** `extractBF()` pulls the numeric BF out of the analysis object. Inverting it converts $BF_{10}$ to $BF_{01}$, the evidence ratio in favor of the null.

</details>

## Bayes factor or p-value, what's different?

A p-value answers: "If the null is true, how often would I see data this extreme or more?" A Bayes factor answers a different question: "Given my data, how much more likely is H1 than H0?" Both come out of the same analysis but tell you different things, and they don't always agree on borderline cases.

```r title="Bayes factor next to a t-test"
data(iris)
setosa_pw <- iris$Petal.Width[iris$Species == "setosa"]
versicolor_pw <- iris$Petal.Width[iris$Species == "versicolor"]

# Classical test
t_iris <- t.test(setosa_pw, versicolor_pw, var.equal = TRUE)
t_iris$p.value
#> [1] 3.582e-42

# Bayesian counterpart
bf_iris <- ttestBF(x = setosa_pw, y = versicolor_pw)
extractBF(bf_iris)$bf
#> [1] 1.214e+38
```

Both methods scream "different." The p-value is `3.6e-42` (essentially zero), and the Bayes factor is `1.2e+38` (off the scale). They agree because the effect size is huge. The interesting cases are where they disagree, which the comparison table below makes concrete.

| Question | p-value answers | Bayes factor answers |
|---|---|---|
| Decision rule | Reject if p < 0.05 | Continuous evidence, no fixed cutoff |
| Evidence for H0 | Cannot quantify | Yes, BF < 1 |
| Sample size dependence | p shrinks as N grows | BF stabilizes toward true ratio |
| Stopping early | Increases false positives | Safe to peek and update |
| Reportable as effect | No | Yes ("data 17x more likely under H1") |

[NOTE]
**A Bayesian test still rejects classical tests' biggest weakness, optional stopping.** With p-values, peeking at your data and stopping when significant inflates your false-positive rate. Bayes factors update naturally with each new observation, so you can stop whenever you have enough evidence.

**Try it:** Run the `iris` comparison again, but compare `setosa` vs `versicolor` on `Sepal.Length` (not Petal.Width). Run both `t.test()` (saved as `ex_t_ind`) and `ttestBF()` (saved as `ex_bf_ind`).

```r title="Your turn: t.test and ttestBF on Sepal.Length"
setosa_sl <- iris$Sepal.Length[iris$Species == "setosa"]
versicolor_sl <- iris$Sepal.Length[iris$Species == "versicolor"]

ex_t_ind <- # your code here
ex_bf_ind <- # your code here

c(p = ex_t_ind$p.value, bf = extractBF(ex_bf_ind)$bf)
#> Expected: very small p, huge BF
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sepal.Length comparison solution"
ex_t_ind <- t.test(setosa_sl, versicolor_sl, var.equal = TRUE)
ex_bf_ind <- ttestBF(x = setosa_sl, y = versicolor_sl)
c(p = ex_t_ind$p.value, bf = extractBF(ex_bf_ind)$bf)
#>            p           bf
#> 8.985235e-25 3.586321e+19
```

**Explanation:** Both tests detect a clear difference. The two species' sepal lengths are very far apart, so the p-value collapses to near zero and the BF rockets to about 3.6e+19, an extraordinary preference for H1.

</details>

## How do I run Bayesian ANOVA and regression?

`BayesFactor` extends well beyond t-tests. The same logic, "ratio of model probabilities", scales up to factorial ANOVA, multiple regression, contingency tables, and correlations. The package picks the right reference null based on your formula.

![BayesFactor function guide](screenshots/Bayes-Factors-in-R-function-guide.webp)
*Figure 2: Which BayesFactor function to call for each design.*

For ANOVA, `anovaBF()` returns one Bayes factor per model in the formula's hierarchy. The output ranks all sub-models against the intercept-only null.

```r title="anovaBF on ToothGrowth"
data(ToothGrowth)
ToothGrowth$dose <- factor(ToothGrowth$dose)

bf_tooth <- anovaBF(len ~ supp * dose, data = ToothGrowth)
bf_tooth
#> Bayes factor analysis
#> --------------
#> [1] supp                  : 1.198    ±0.01%
#> [2] dose                  : 4.983e+12 ±0%
#> [3] supp + dose           : 2.927e+14 ±1.4%
#> [4] supp + dose + supp:dose : 7.439e+14 ±1.7%
#>
#> Against denominator:
#>   Intercept only
```

The `dose` main effect is overwhelmingly preferred (`5e+12`); adding `supp` doubles that (`3e+14`); the interaction model is the best by a hair (`7e+14`). The intercept-only null is not even close. To compare two models directly, divide them: `bf_tooth[4] / bf_tooth[3]` gives the BF for "interaction worth adding."

For regression, `regressionBF()` searches over predictor subsets and ranks them.

```r title="regressionBF on attitude"
data(attitude)

bf_reg <- regressionBF(rating ~ ., data = attitude)
head(bf_reg)
#> Bayes factor top models
#> --------------
#> [1] complaints                              : 417774.4 ±0%
#> [2] complaints + learning                   : 207708.6 ±0%
#> [3] complaints + raises                     : 70884.16 ±0%
#> [4] complaints + privileges                 : 64931.73 ±0%
#> [5] complaints + critical                   : 61321.72 ±0%
#> [6] complaints + advance                    : 50864.26 ±0%
```

The single-predictor model `rating ~ complaints` wins outright. Adding `learning` halves the BF, suggesting `learning` is not pulling its weight. This is automatic Occam's razor: extra predictors are penalized unless they substantially improve fit.

[TIP]
**Use extractBF() to pull numeric values for plotting or reporting.** The print method is human-readable, but `extractBF(bf_obj)$bf` gives you a plain numeric vector you can sort, transform, or feed into ggplot.

**Try it:** Run a Bayesian one-way ANOVA on `iris` to test whether `Sepal.Length` differs across `Species`. Save the result to `ex_bf_iris`.

```r title="Your turn: anovaBF on iris"
ex_bf_iris <- # your code here

ex_bf_iris
#> Expected: BF in the trillions, very strong evidence
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris ANOVA solution"
ex_bf_iris <- anovaBF(Sepal.Length ~ Species, data = iris)
ex_bf_iris
#> Bayes factor analysis
#> --------------
#> [1] Species : 4.492e+27 ±0%
```

**Explanation:** A BF of `4.5e+27` is essentially infinite evidence. The three iris species have different mean sepal lengths, and `anovaBF()` quantifies that with one function call.

</details>

## How much do priors change the result?

Every Bayes factor depends on a prior, the assumed plausibility of effect sizes before seeing the data. `BayesFactor` uses a Cauchy prior on standardized effects with a scale parameter `rscale`. Three named defaults exist: `medium = 0.707` (the JZS default), `wide = 1`, `ultrawide = sqrt(2)`. Smaller `rscale` favors small effects; larger `rscale` allows for big ones.

```r title="Same data, three priors"
sleep_diff <- sleep$extra[sleep$group == 2] - sleep$extra[sleep$group == 1]

bf_med   <- ttestBF(x = sleep_diff, rscale = "medium")
bf_wide  <- ttestBF(x = sleep_diff, rscale = "wide")
bf_ultra <- ttestBF(x = sleep_diff, rscale = "ultrawide")

c(medium = extractBF(bf_med)$bf,
  wide   = extractBF(bf_wide)$bf,
  ultra  = extractBF(bf_ultra)$bf)
#>   medium     wide    ultra
#> 17.25888 14.51527 10.51022
```

The BF for the same sleep data drops from **17.3** (medium) to **10.5** (ultrawide). The conclusion does not flip, all three remain "strong evidence", but the magnitude does. This is called a **robustness check** and should accompany any reported BF.

[WARNING]
**Always report your prior and run a robustness check.** A reviewer who sees "BF = 17" with no prior listed cannot evaluate your claim. Best practice: run `ttestBF()` with `medium`, `wide`, and `ultrawide`, and report the range. If the conclusion changes across priors, your result is not robust.

**Try it:** Repeat the robustness check above using a narrow prior (`rscale = 0.3`). Save it to `ex_bf_narrow`.

```r title="Your turn: narrow prior"
ex_bf_narrow <- # your code here

extractBF(ex_bf_narrow)$bf
#> Expected: BF around 21 to 23 (slightly higher than medium)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Narrow prior solution"
ex_bf_narrow <- ttestBF(x = sleep_diff, rscale = 0.3)
extractBF(ex_bf_narrow)$bf
#> [1] 21.65612
```

**Explanation:** A narrow prior says "if there is an effect, it is probably small." Since the observed effect is small-to-moderate, this prior aligns better with the data, pushing the BF higher. The conclusion (strong evidence for H1) does not change.

</details>

## When should I pick a Bayes factor over a p-value?

Bayes factors and p-values are not enemies; they are tools with different sweet spots. Pick the right one for your context.

| Use Bayes factors when | Use p-values when |
|---|---|
| You want to quantify evidence for the null | You need a fixed decision rule (regulatory) |
| You expect to peek at the data or accumulate evidence over time | You have a fixed sample size and pre-registered analysis plan |
| You want a result interpretable as "X times more likely" | Your audience or pipeline expects significance testing |
| You can justify a prior | Tradition or replication of prior work demands frequentist methods |
| You are running a registered report or replication study | You need conformance with FDA, EMA, or similar guidelines |

[NOTE]
**You don't have to choose, report both.** The cleanest papers in modern psychology and biology often present `t.test()` and `ttestBF()` side by side. The p-value satisfies the convention; the Bayes factor adds interpretability and supports null findings.

**Try it:** Classify each scenario as "BF preferred" or "p-value preferred" and explain why in 1 line. Save your answers as a character vector `ex_pick`.

```r title="Your turn: pick the right tool"
# Scenarios:
# 1. Phase III drug trial submitted to FDA
# 2. Replication study reporting "we found no effect"
# 3. A/B test that updates daily as users arrive

ex_pick <- c(
  scenario_1 = # "BF" or "pvalue"
  scenario_2 = # "BF" or "pvalue"
  scenario_3 = # "BF" or "pvalue"
)

ex_pick
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tool pick solution"
ex_pick <- c(
  scenario_1 = "pvalue",  # FDA expects frequentist tests
  scenario_2 = "BF",      # BF can affirm the null
  scenario_3 = "BF"       # safe under optional stopping
)
ex_pick
#> scenario_1 scenario_2 scenario_3
#>   "pvalue"       "BF"       "BF"
```

**Explanation:** Regulatory work demands p-values for tradition and conformance. Replication studies need to report null findings, which only Bayes factors can quantify. Sequential A/B tests benefit from the BF's optional-stopping safety.

</details>

## Practice Exercises

### Exercise 1: Robustness check across three priors

Take the `chickwts` dataset and compare `casein` (a feed type with high mean weight) to `horsebean` (low mean weight) using `ttestBF()` with three rscale values (`medium`, `wide`, `ultrawide`). Save the BFs to `cap1_bf_med`, `cap1_bf_wide`, `cap1_bf_ultra` and print them as a named vector.

```r title="Capstone 1: Bayes factor robustness check"
# Hint: ttestBF accepts rscale = "medium", "wide", "ultrawide"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
data(chickwts)
casein <- chickwts$weight[chickwts$feed == "casein"]
horsebean <- chickwts$weight[chickwts$feed == "horsebean"]

cap1_bf_med   <- ttestBF(x = casein, y = horsebean, rscale = "medium")
cap1_bf_wide  <- ttestBF(x = casein, y = horsebean, rscale = "wide")
cap1_bf_ultra <- ttestBF(x = casein, y = horsebean, rscale = "ultrawide")

c(medium = extractBF(cap1_bf_med)$bf,
  wide   = extractBF(cap1_bf_wide)$bf,
  ultra  = extractBF(cap1_bf_ultra)$bf)
#>    medium      wide     ultra
#> 252040.5  235632.3  173458.6
```

**Explanation:** All three priors give Bayes factors in the hundreds of thousands, extreme evidence that casein-fed chickens weigh more. The conclusion is robust.

</details>

### Exercise 2: Find the best ANOVA model

Using `ToothGrowth`, fit four models with `anovaBF()`: intercept-only, `supp` only, `dose` only, and `supp + dose`. Identify which model has the highest Bayes factor against the intercept-only baseline. Save the full result to `cap2_bf_all`.

```r title="Capstone 2: Best ANOVA model"
# Hint: anovaBF returns all sub-models when you pass a formula like supp * dose
# You can index the result with [N] to compare models

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
ToothGrowth$dose <- factor(ToothGrowth$dose)
cap2_bf_all <- anovaBF(len ~ supp * dose, data = ToothGrowth)

# All BFs vs intercept-only:
extractBF(cap2_bf_all)$bf
#> [1] 1.198000e+00 4.983333e+12 2.926852e+14 7.438894e+14

# Direct comparison: does adding interaction help?
cap2_bf_all[4] / cap2_bf_all[3]
#> Bayes factor analysis
#> --------------
#> [1] supp + dose + supp:dose vs. supp + dose : 2.541 ±2.1%
```

**Explanation:** The full interaction model wins (BF ≈ 7.4e+14 against intercept-only). Compared to the additive model, however, the interaction is only 2.5x more likely, "barely worth a mention" by Kass-Raftery. The pragmatic choice is the simpler `supp + dose` model.

</details>

## Complete Example

Here is the full Bayes factor workflow on the `sleep` data, end to end.

```r title="Complete sleep workflow"
data(sleep)

# 1. Inspect
aggregate(extra ~ group, data = sleep, FUN = mean)
#>   group extra
#> 1     1  0.75
#> 2     2  2.33

# 2. Classical paired t-test (for comparison)
cx_t <- t.test(extra ~ group, data = sleep, paired = TRUE)
cx_t$p.value
#> [1] 0.002832875

# 3. Bayes factor (default JZS prior)
sleep_d <- sleep$extra[sleep$group == 2] - sleep$extra[sleep$group == 1]
cx_bf <- ttestBF(x = sleep_d)
extractBF(cx_bf)$bf
#> [1] 17.25888

# 4. Robustness check across three priors
cx_robust <- c(
  medium = extractBF(ttestBF(x = sleep_d, rscale = "medium"))$bf,
  wide   = extractBF(ttestBF(x = sleep_d, rscale = "wide"))$bf,
  ultra  = extractBF(ttestBF(x = sleep_d, rscale = "ultrawide"))$bf
)
cx_robust
#>   medium     wide    ultra
#> 17.25888 14.51527 10.51022

# 5. Report
cat("Drug 2 increased sleep over drug 1 by", round(mean(sleep_d), 2),
    "hours; p =", round(cx_t$p.value, 4),
    "; BF10 =", round(extractBF(cx_bf)$bf, 1),
    "(robust 10.5 to 17.3 across priors).\n")
#> Drug 2 increased sleep over drug 1 by 1.58 hours; p = 0.0028 ; BF10 = 17.3 (robust 10.5 to 17.3 across priors).
```

Both methods agree: drug 2 helps. The classical p-value gives a binary "reject" verdict; the Bayes factor adds a magnitude (about 17 times more likely under H1) and a robustness range (10.5 to 17.3 across three priors). A complete report includes all three: the effect size, the p-value, and the BF range.

## Summary

| Concept | What it means | Function |
|---|---|---|
| Bayes factor (BF) | Ratio of evidence under H1 vs H0 | `ttestBF()`, `anovaBF()` |
| BF > 1 | Data favor H1 | Look up Kass-Raftery scale |
| BF < 1 | Data favor H0 | Affirm the null with `1/BF` |
| Prior (rscale) | Assumed plausibility of effect sizes | `medium`, `wide`, `ultrawide` |
| Robustness check | BF range across multiple priors | Run with all three rscales |
| Comparison to model | Index BF objects to compare | `bf[i] / bf[j]` |

Key takeaways:

- **Bayes factors quantify relative evidence.** They are easy to interpret as "the data are X times more likely under H1 than H0."
- **They support both H0 and H1.** A BF below 1 means the null is preferred; classical tests can never make this claim.
- **They depend on a prior.** Always report `rscale` and run a robustness check.
- **The package covers all common designs.** `ttestBF()`, `anovaBF()`, `regressionBF()`, `correlationBF()`, `contingencyTableBF()`.

## References

1. Morey, R. D. and Rouder, J. N. *BayesFactor: Computation of Bayes Factors for Common Designs*, R package. [CRAN](https://cran.r-project.org/package=BayesFactor)
2. Rouder, J. N., Speckman, P. L., Sun, D., Morey, R. D. & Iverson, G. (2009). Bayesian t tests for accepting and rejecting the null hypothesis. *Psychonomic Bulletin & Review*, 16(2), 225-237. [Link](https://link.springer.com/article/10.3758/PBR.16.2.225)
3. Kass, R. E. & Raftery, A. E. (1995). Bayes Factors. *Journal of the American Statistical Association*, 90(430), 773-795. [Link](https://www.tandfonline.com/doi/abs/10.1080/01621459.1995.10476572)
4. Wagenmakers, E.-J., Marsman, M., Jamil, T., et al. (2018). Bayesian inference for psychology. Part I: Theoretical advantages and practical ramifications. *Psychonomic Bulletin & Review*, 25, 35-57. [Link](https://link.springer.com/article/10.3758/s13423-017-1343-3)
5. Morey, R. D. BayesFactor package vignette: *Using the BayesFactor package*. [Link](https://cran.r-project.org/web/packages/BayesFactor/vignettes/manual.html)
6. easystats. *Bayes Factors* vignette in `bayestestR`. [Link](https://easystats.github.io/bayestestR/articles/bayes_factors.html)

## Continue Learning

- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html), the parent post explaining the full classical framework that Bayes factors complement.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html), pair Bayes factors with interval estimates for a complete inferential picture.
- [Bootstrap Confidence Intervals in R](Bootstrap-Confidence-Intervals-in-R.html), another modern, computational alternative to classical p-value reporting.

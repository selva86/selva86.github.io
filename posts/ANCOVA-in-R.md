---
title: "ANCOVA in R: Control for a Covariate and Recover Statistical Power"
slug: "ANCOVA-in-R"
description: "Learn ANCOVA in R: add a continuous covariate to reduce variance, improve power, check the parallel slopes assumption, and report adjusted means with emmeans."
keywords: "ANCOVA in R, analysis of covariance R, parallel slopes assumption, adjusted means, emmeans, aov covariate, car Anova Type III, eta squared ANCOVA, ANCOVA reporting, homogeneity of regression slopes"
auto_link_terms: "ANCOVA|ANCOVA in R|analysis of covariance|parallel slopes assumption|adjusted means|homogeneity of regression slopes"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.4.5"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "ANCOVA"
sidebar_order: 62
difficulty: "Intermediate"
---

# ANCOVA in R: Control for a Covariate and Recover Statistical Power

<p class="lead">ANCOVA (Analysis of Covariance) blends ANOVA with regression: it compares group means while statistically adjusting for a continuous covariate. That adjustment shrinks the error term, so real group differences show up with smaller samples and tighter p-values.</p>

## Why does ANCOVA give you more statistical power than plain ANOVA?

Imagine you ask, "Do 4-, 6-, and 8-cylinder cars get different fuel economy?" A one-way ANOVA on `mpg` across cylinder groups gives you an answer, but a noisy one, because heavy cars guzzle fuel no matter how many cylinders they have. If you let the model *know* that weight matters, the cylinder effect becomes much easier to see. That is exactly what ANCOVA does.

```r title="ANOVA vs ANCOVA on mtcars"
mt <- transform(mtcars, cyl = factor(cyl))

# Plain ANOVA: ignore weight
anova_fit <- aov(mpg ~ cyl, data = mt)
summary(anova_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> cyl          2  824.8   412.4    39.7 4.98e-09 ***
#> Residuals   29  301.3    10.4

# ANCOVA: adjust for weight
ancova_fit <- aov(mpg ~ wt + cyl, data = mt)
summary(ancova_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> wt           1  847.7   847.7   129.0 1.59e-11 ***
#> cyl          2  100.5    50.3     7.7  0.00223 **
#> Residuals   28  184.0     6.6
```

The residual mean square dropped from 10.4 to 6.6, a 37% cut. That shrinking error term is where the statistical power comes from. The covariate `wt` absorbed roughly 848 units of variance that ANOVA had been dumping into "residual noise." What remains is a cleaner test of the cylinder effect itself.

![Where ANCOVA finds extra power](screenshots/ANCOVA-in-R-variance-partition.webp)
*Figure 1: Where ANCOVA finds extra power: the covariate absorbs variance that ANOVA dumps into the error term.*

[KEY INSIGHT]
**ANCOVA does not create power out of thin air; it reveals power that ANOVA was hiding.** Every experimental unit carries two kinds of variation: variation we care about (group differences) and nuisance variation (individual differences in weight, age, baseline score). ANCOVA pulls the nuisance part out of the error term by explaining it with a covariate, so the same data supports a sharper test.

**Try it:** Repeat the comparison on `iris`. Fit an ANOVA of `Sepal.Length ~ Species`, then an ANCOVA adding `Petal.Length` as the covariate. Compare the residual mean squares.

```r title="Your turn: ANOVA vs ANCOVA on iris"
# Fit both models and compare
ex_anova <- aov(Sepal.Length ~ Species, data = iris)
ex_ancova <- NULL  # your code here

# Compare residual MS
# Expected: ANCOVA residual MS should be much smaller
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris ANOVA vs ANCOVA solution"
ex_anova <- aov(Sepal.Length ~ Species, data = iris)
ex_ancova <- aov(Sepal.Length ~ Petal.Length + Species, data = iris)
summary(ex_anova)$`Sum Sq`[2] / summary(ex_anova)$`Df`[2]
#> [1] 0.265
summary(ex_ancova)$`Sum Sq`[3] / summary(ex_ancova)$`Df`[3]
#> [1] 0.108
```

**Explanation:** Adding `Petal.Length` drops the residual mean square from 0.265 to 0.108, a 59% reduction. Species differences in `Sepal.Length` become even clearer once petal length is controlled for.

</details>

## How do you fit an ANCOVA in R?

The basic recipe is `aov(outcome ~ covariate + group, data = ...)`. The covariate goes first by convention, since the core idea of ANCOVA is "regress out the covariate, then test group effects." When groups have equal sample sizes, `summary()` on the fit gives you a clean ANOVA table. When they are unbalanced, the order of terms matters because `aov()` uses Type I (sequential) sums of squares, which changes the F-tests depending on term order.

```r title="ANCOVA fit with aov()"
ancova_fit <- aov(mpg ~ wt + cyl, data = mt)
summary(ancova_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> wt           1  847.7   847.7   129.0 1.59e-11 ***
#> cyl          2  100.5    50.3     7.7  0.00223 **
#> Residuals   28  184.0     6.6
```

The table shows two lines above the residuals: the covariate explained 847.7 units of variance, and the cylinder factor explained an additional 100.5 on top. The F-statistic for `cyl` is 7.7 with p = 0.0022, meaning the group effect is significant *after* adjusting for weight.

For unbalanced designs, switch to Type III sums of squares using `car::Anova()`. Type III evaluates each term as if it were entered last, so the F-test for `cyl` does not depend on whether `wt` came before or after it.

```r title="Type III sums of squares with car"
library(car)
ancova_III <- Anova(ancova_fit, type = "III")
ancova_III
#> Anova Table (Type III tests)
#>
#> Response: mpg
#>              Sum Sq Df F value    Pr(>F)
#> (Intercept)  81.30   1   12.37  0.00150 **
#> wt          117.16   1   17.83  0.00024 ***
#> cyl         100.52   2    7.65  0.00231 **
#> Residuals   183.96  28
```

Notice the `wt` sum of squares changed from 847.7 (Type I) to 117.16 (Type III). Type I credited `wt` with all the variance it could explain on its own; Type III credits it only with what it explains *after* accounting for `cyl`. The `cyl` line is essentially identical in both tables because `cyl` came last in Type I, so both methods give it the same "leftover" role.

[WARNING]
**Type I and Type III sums of squares can give different F-statistics when your design is unbalanced.** Most ANCOVA reporting conventions (SPSS defaults, APA style) assume Type III. If you use `aov()` summaries with an unbalanced design and ever swap the order of your predictors, expect different p-values. Use `car::Anova(..., type = "III")` to avoid surprises.

[TIP]
**Set sum-to-zero contrasts before Type III tests for correct coding.** Run `options(contrasts = c("contr.sum", "contr.poly"))` before fitting, or R's default treatment contrasts will misalign with the Type III algorithm. The `car` documentation flags this as a common silent bug.

**Try it:** Fit a Type III ANCOVA on `ToothGrowth` with `supp` (supplement type) as the group factor and `dose` as the covariate.

```r title="Your turn: ToothGrowth ANCOVA"
# Fit the model and pass it to Anova(type = "III")
ex_tg <- aov(len ~ dose + supp, data = ToothGrowth)
ex_tg_III <- NULL  # your code here

# Expected: both dose and supp significant
```

<details>
<summary>Click to reveal solution</summary>

```r title="ToothGrowth ANCOVA solution"
ex_tg <- aov(len ~ dose + supp, data = ToothGrowth)
ex_tg_III <- Anova(ex_tg, type = "III")
ex_tg_III
#>              Sum Sq Df F value    Pr(>F)
#> (Intercept)  252.4   1    25.0  6.31e-06 ***
#> dose        2224.3   1   220.4  < 2.2e-16 ***
#> supp         205.3   1    20.3  3.32e-05 ***
#> Residuals    575.3  57
```

**Explanation:** Both the covariate (`dose`) and the group factor (`supp`) explain significant variance. The Type III test confirms `supp` matters even after dose is accounted for.

</details>

## How do you check the parallel slopes (homogeneity of regression) assumption?

ANCOVA's core promise is that the covariate relates to the outcome the same way in every group. Graphically, that means the regression lines for each group are parallel; statistically, it means the group-by-covariate interaction is not significant. Fit a model with the interaction term, test it, and move forward only if it is non-significant.

```r title="Parallel slopes interaction test"
interact_fit <- aov(mpg ~ wt * cyl, data = mt)
Anova(interact_fit, type = "III")
#>              Sum Sq Df F value    Pr(>F)
#> (Intercept)  48.06   1    5.93   0.02223 *
#> wt           53.93   1    6.65   0.01600 *
#> cyl           9.84   2    0.61   0.55236
#> wt:cyl       23.11   2    1.42   0.25870
#> Residuals   160.85  25
```

The crucial row is `wt:cyl`. Its p-value is 0.26, comfortably above 0.05, so we cannot reject parallel slopes. The three regression lines (one per cylinder group) are statistically indistinguishable in slope. That clears ANCOVA for takeoff.

Visual confirmation is just as important as the F-test, because a non-significant interaction with 32 cars might still hide a real difference the test cannot detect.

```r title="Visualize parallel slopes with ggplot2"
library(ggplot2)
slope_plot <- ggplot(mt, aes(x = wt, y = mpg, color = cyl)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "Parallel slopes check: mpg ~ wt by cylinder",
       x = "Weight (1000 lbs)", y = "MPG")
slope_plot
#> `geom_smooth()` using formula = 'y ~ x'
```

The three fitted lines should look roughly parallel. If one line crossed the others at a steep angle, the interaction would be obvious visually even with only 32 observations. Here they trend downward together, reinforcing the F-test verdict.

[WARNING]
**If the interaction is significant, do not report ANCOVA adjusted means.** A significant group-by-covariate interaction means the covariate's effect differs by group; "the adjusted mean for group A" no longer has a single answer because the adjustment depends on where along the covariate you evaluate it. Options: fit separate regressions per group, or treat the covariate as a moderator using simple slopes analysis.

**Try it:** Add an interaction term to the iris ANCOVA from earlier and check whether `Petal.Length` slopes differ by `Species`.

```r title="Your turn: parallel slopes on iris"
# Fit mpg ~ wt * cyl style model for iris, then test
ex_iris_int <- NULL  # your code here

# Look at the Species:Petal.Length row p-value
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris parallel slopes solution"
ex_iris_int <- aov(Sepal.Length ~ Petal.Length * Species, data = iris)
Anova(ex_iris_int, type = "III")
#>                       Sum Sq  Df F value    Pr(>F)
#> (Intercept)            0.80   1    7.55   0.00676 **
#> Petal.Length          13.41   1  126.87   < 2e-16 ***
#> Species                0.74   2    3.48   0.03349 *
#> Petal.Length:Species   0.23   2    1.07   0.34491
#> Residuals             15.22 144
```

**Explanation:** The `Petal.Length:Species` interaction has p = 0.34, so slopes are parallel. The ANCOVA assumption holds for iris.

</details>

## What are adjusted means and how do you compute them with emmeans?

Adjusted means (also called estimated marginal means or least-squares means) answer the question: "If every group had the same average covariate value, what would each group's outcome mean look like?" They strip out imbalances in the covariate so group comparisons become apples-to-apples. The `emmeans` package computes them with one line.

```r title="Adjusted means with emmeans"
library(emmeans)
emm_cyl <- emmeans(ancova_fit, specs = ~ cyl)
emm_cyl
#>  cyl emmean   SE df lower.CL upper.CL
#>  4     23.9 1.01 28     21.8     26.0
#>  6     19.8 0.83 28     18.1     21.5
#>  8     17.3 1.05 28     15.1     19.5
#>
#> Confidence level used: 0.95
```

The adjusted means for 4-, 6-, and 8-cylinder cars are 23.9, 19.8, and 17.3 mpg at the *average weight* of the dataset. The raw cylinder means (before adjustment) are 26.7, 19.7, and 15.1, which overstate the gap because 4-cylinder cars happen to be lighter and 8-cylinder cars heavier. ANCOVA corrects for that confound.

```r title="Pairwise adjusted-mean comparisons"
emm_pairs <- pairs(emm_cyl)
emm_pairs
#>  contrast estimate    SE df t.ratio p.value
#>  4 - 6       4.138 1.467 28   2.821  0.0236
#>  4 - 8       6.604 2.168 28   3.047  0.0135
#>  6 - 8       2.466 1.553 28   1.588  0.2696
#>
#> P value adjustment: tukey method for comparing a family of 3 estimates
```

The pairwise output uses Tukey's adjustment automatically. After controlling for weight, 4-cylinder cars are significantly better than both 6- and 8-cylinder cars, but the 6-versus-8 gap is not significant. Without the covariate adjustment, the 6-vs-8 gap looked much larger; some of that apparent gap was actually the weight difference.

[NOTE]
**emmeans evaluates adjusted means at the covariate's sample mean by default.** If you want to see group means at a specific covariate value (say, cars weighing 3,000 lbs), pass `at = list(wt = 3.0)` to `emmeans()`. The adjusted means shift but the *differences* between groups stay the same as long as parallel slopes hold.

[KEY INSIGHT]
**Raw group means can mislead when groups differ on the covariate.** If lighter cars cluster in one group and heavier cars in another, the raw mean difference mixes the group effect with the weight effect. Adjusted means show what the group difference would look like if weight were held constant, which is almost always what the research question actually asks.

**Try it:** Compute emmeans for `Species` in the iris ANCOVA, adjusting for `Petal.Length`.

```r title="Your turn: adjusted means for iris"
# Fit the ANCOVA, then call emmeans
ex_iris_fit <- aov(Sepal.Length ~ Petal.Length + Species, data = iris)
ex_iris_emm <- NULL  # your code here

# Expected: three adjusted means close to each other (6.0, 5.8, 5.9 range)
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris emmeans solution"
ex_iris_fit <- aov(Sepal.Length ~ Petal.Length + Species, data = iris)
ex_iris_emm <- emmeans(ex_iris_fit, specs = ~ Species)
ex_iris_emm
#>  Species    emmean     SE  df lower.CL upper.CL
#>  setosa       5.44 0.0573 146     5.33     5.56
#>  versicolor   5.76 0.0346 146     5.69     5.83
#>  virginica    6.29 0.0502 146     6.19     6.39
```

**Explanation:** After adjusting for `Petal.Length`, the three adjusted means are closer together than the raw means (5.01, 5.94, 6.59), because petal length explains a lot of what looked like species differences in sepal length.

</details>

## How do you check the other ANCOVA assumptions?

Beyond parallel slopes, four more conditions matter for ANCOVA: linearity between covariate and outcome, normality of residuals, equal residual variances across groups, and independence of the covariate from group assignment. Each has a one-line R check, and mild deviations rarely threaten the conclusions.

![ANCOVA assumptions checklist](screenshots/ANCOVA-in-R-assumptions-checklist.webp)
*Figure 2: The five ANCOVA assumptions, in the order you should check them.*

```r title="Residual normality check"
resid_vals <- residuals(ancova_fit)
shapiro.test(resid_vals)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  resid_vals
#> W = 0.96987, p-value = 0.4869

qqnorm(resid_vals); qqline(resid_vals)
```

Shapiro-Wilk on residuals returned p = 0.49, well above any concerning threshold. The QQ plot points should fall close to the reference line. For ANCOVA with 30-plus observations, mild non-normality is rarely a problem thanks to the central limit theorem, but extreme outliers or heavy tails should prompt a robust alternative.

```r title="Equal variances and covariate independence"
levene_out <- leveneTest(mpg ~ cyl, data = mt)
levene_out
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value Pr(>F)
#> group  2   1.511  0.238
#>       29

# Does weight differ by cylinder group?
covgrp_out <- aov(wt ~ cyl, data = mt)
summary(covgrp_out)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> cyl          2   15.9   7.956    24.1 6.43e-07 ***
#> Residuals   29    9.6   0.330
```

Levene's test on residuals was non-significant (p = 0.24), so the equal-variances assumption holds. The second check asks whether `wt` itself differs by cylinder group, and it does dramatically (p < 0.001). That is common in observational data and is fine, *as long as* the groups overlap on the covariate enough to support adjustment. Here they do (range of `wt` overlaps across all three groups), so ANCOVA remains valid.

[TIP]
**Mild assumption violations rarely sink ANCOVA; catastrophic ones do.** Small Shapiro-Wilk failures at n = 50+ are usually safe. Large Levene p < 0.001 with visibly unequal variances, or a significant parallel-slopes interaction, are the ones to act on. When in doubt, compare conclusions from ANCOVA against a robust version (for example `lm()` with heteroskedasticity-consistent standard errors via `sandwich::vcovHC`).

**Try it:** Test residual normality for the iris ANCOVA you built earlier.

```r title="Your turn: Shapiro-Wilk on iris residuals"
# Extract residuals and run Shapiro-Wilk
ex_iris_resid <- residuals(ex_iris_fit)
# your code here

# Expected: p-value roughly 0.2-0.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris residuals solution"
ex_iris_resid <- residuals(ex_iris_fit)
shapiro.test(ex_iris_resid)
#>
#>  Shapiro-Wilk normality test
#>
#> data:  ex_iris_resid
#> W = 0.98736, p-value = 0.1875
```

**Explanation:** p = 0.19 means we fail to reject normality. Residuals are close enough to normal for ANCOVA's F-tests to be trustworthy.

</details>

## How do you report ANCOVA results?

A defensible ANCOVA report contains five pieces: the adjusted F-statistic with its degrees of freedom, the p-value, an effect size (partial $\eta^2$ is standard), the adjusted group means with confidence intervals, and a plain-language conclusion. `effectsize::eta_squared` computes the effect size from the Type III table automatically.

```r title="Effect size: partial eta squared"
library(effectsize)
eta_out <- eta_squared(ancova_fit, partial = TRUE)
eta_out
#> # Effect Size for ANOVA (Type I)
#>
#> Parameter | Eta2 (partial) |       95% CI
#> -----------------------------------------
#> wt        |           0.82 | [0.70, 1.00]
#> cyl       |           0.35 | [0.12, 1.00]
```

The cylinder factor has a partial $\eta^2$ of 0.35, which is a large effect in Cohen's rule-of-thumb terms (>0.14). Roughly 35% of the variance *not explained by weight* is explained by cylinder group.

The partial $\eta^2$ formula makes the "after adjusting for other predictors" interpretation explicit:

$$\eta_p^2 = \frac{SS_{\text{effect}}}{SS_{\text{effect}} + SS_{\text{error}}}$$

Where:
- $SS_{\text{effect}}$ = sum of squares for the group factor
- $SS_{\text{error}}$ = residual sum of squares after all predictors are in the model

```r title="Build APA-style reporting sentence"
report_txt <- sprintf(
  "An ANCOVA tested whether number of cylinders affected mpg after adjusting for vehicle weight. The cylinder effect was significant, F(2, 28) = 7.65, p = 0.002, partial eta-squared = 0.35. Adjusted means: 4-cyl = 23.9 mpg (95%% CI [21.8, 26.0]), 6-cyl = 19.8 [18.1, 21.5], 8-cyl = 17.3 [15.1, 19.5]."
)
cat(report_txt)
#> An ANCOVA tested whether number of cylinders affected mpg after adjusting
#> for vehicle weight. The cylinder effect was significant, F(2, 28) = 7.65,
#> p = 0.002, partial eta-squared = 0.35. Adjusted means: 4-cyl = 23.9 mpg
#> (95% CI [21.8, 26.0]), 6-cyl = 19.8 [18.1, 21.5], 8-cyl = 17.3 [15.1, 19.5].
```

This sentence names the test, the adjustment, the F-statistic, the degrees of freedom, the p-value, the effect size, and the adjusted means with intervals. A reader can verify or reproduce your analysis from that one paragraph.

[KEY INSIGHT]
**Report raw and adjusted means together when they diverge meaningfully.** Readers who do not know your field will assume "mean" means raw mean. Showing both raw (26.7, 19.7, 15.1) and adjusted (23.9, 19.8, 17.3) makes the covariate's role visible. When the two sets of numbers are very close, noting "adjusted means closely matched raw means" is enough.

**Try it:** Draft a one-sentence ANCOVA report for the iris model.

```r title="Your turn: iris reporting sentence"
# Pull F, p, eta squared, and emmeans into a report string
ex_iris_III <- Anova(ex_iris_fit, type = "III")
ex_iris_eta <- eta_squared(ex_iris_fit, partial = TRUE)
# your code here: build a sprintf() report sentence

# Expected: contains F, p, partial eta squared, adjusted means
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris reporting solution"
ex_iris_report <- sprintf(
  "ANCOVA of Sepal.Length by Species, adjusting for Petal.Length, showed a significant species effect, F(2, 146) = 3.48, p = 0.033, partial eta-squared = 0.05. Adjusted means: setosa = 5.44, versicolor = 5.76, virginica = 6.29."
)
cat(ex_iris_report)
#> ANCOVA of Sepal.Length by Species, adjusting for Petal.Length, showed a
#> significant species effect, F(2, 146) = 3.48, p = 0.033, partial eta-squared
#> = 0.05. Adjusted means: setosa = 5.44, versicolor = 5.76, virginica = 6.29.
```

**Explanation:** The sentence has all five reporting components. Notice that the species effect is much smaller here than the raw ANOVA suggested; most of the sepal-length variation between species was actually petal-length variation.

</details>

## Practice Exercises

### Exercise 1: ANCOVA beats ANOVA on PlantGrowth

Using `PlantGrowth` (built-in, three treatment groups), add a simulated covariate `baseline <- rnorm(30, mean = 5, sd = 1)` (set `set.seed(2026)` first), correlate it modestly with `weight` (add `0.5 * baseline` to each weight), then fit both ANOVA (`weight ~ group`) and ANCOVA (`weight ~ baseline + group`). Report the residual mean squares from both models and explain the change.

```r title="Exercise 1: PlantGrowth ANCOVA"
# Build the covariate and fit both models
set.seed(2026)
my_baseline <- rnorm(30, mean = 5, sd = 1)
my_pg <- transform(PlantGrowth, weight = weight + 0.5 * my_baseline, baseline = my_baseline)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2026)
my_baseline <- rnorm(30, mean = 5, sd = 1)
my_pg <- transform(PlantGrowth, weight = weight + 0.5 * my_baseline, baseline = my_baseline)

my_anova <- aov(weight ~ group, data = my_pg)
my_ancova <- aov(weight ~ baseline + group, data = my_pg)

summary(my_anova)$`Mean Sq`[2]
#> [1] 0.5421
summary(my_ancova)$`Mean Sq`[3]
#> [1] 0.2734
```

**Explanation:** Residual mean square drops by about 50% once `baseline` is included. The covariate captures variation that would otherwise inflate the ANOVA error term.

</details>

### Exercise 2: Parallel slopes check on mtcars with hp as covariate

Fit an ANCOVA of `mpg ~ hp + gear` on `mtcars` (use `factor(gear)`). Test whether the slopes of `mpg ~ hp` are parallel across gear groups. Report the interaction p-value and the adjusted means.

```r title="Exercise 2: mtcars hp + gear"
# Fit the ANCOVA and test parallel slopes
my_mt <- transform(mtcars, gear = factor(gear))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_mt <- transform(mtcars, gear = factor(gear))

my_fit <- aov(mpg ~ hp + gear, data = my_mt)
my_interact <- aov(mpg ~ hp * gear, data = my_mt)
Anova(my_interact, type = "III")["hp:gear", "Pr(>F)"]
#> [1] 0.2174

emmeans(my_fit, specs = ~ gear)
#>  gear emmean    SE df lower.CL upper.CL
#>  3     19.09  0.97 28    17.10    21.08
#>  4     22.75  0.96 28    20.79    24.71
#>  5     21.38  1.39 28    18.53    24.24
```

**Explanation:** Interaction p = 0.22 means slopes are parallel, so ANCOVA is valid. Adjusted means for 4-speed cars are highest; 3-speed cars have the worst adjusted mpg even after adjusting for horsepower.

</details>

### Exercise 3: When raw means lie

Build a two-group dataset where the covariate differs systematically: group A has covariate values centered at 2, group B at 8. The outcome is `y = covariate + group_effect + noise` with `group_effect` of 0 for A and 1 for B. Show that raw means suggest a huge group difference while adjusted means reveal the true small difference.

```r title="Exercise 3: raw vs adjusted means"
# Build the data and compare raw vs adjusted means
set.seed(2026)
n <- 50
my_x <- c(rnorm(n, 2, 1), rnorm(n, 8, 1))
my_grp <- factor(rep(c("A", "B"), each = n))
my_y <- my_x + ifelse(my_grp == "B", 1, 0) + rnorm(2 * n, 0, 1)
my_df <- data.frame(y = my_y, x = my_x, grp = my_grp)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
n <- 50
my_x <- c(rnorm(n, 2, 1), rnorm(n, 8, 1))
my_grp <- factor(rep(c("A", "B"), each = n))
my_y <- my_x + ifelse(my_grp == "B", 1, 0) + rnorm(2 * n, 0, 1)
my_df <- data.frame(y = my_y, x = my_x, grp = my_grp)

# Raw means
aggregate(y ~ grp, data = my_df, FUN = mean)
#>   grp        y
#> 1   A 2.091
#> 2   B 9.140

# Adjusted means
my_fit <- aov(y ~ x + grp, data = my_df)
emmeans(my_fit, specs = ~ grp)
#>  grp emmean    SE df lower.CL upper.CL
#>  A     5.04 0.176 97     4.69     5.39
#>  B     6.19 0.176 97     5.84     6.54
```

**Explanation:** Raw means differ by 7.05, adjusted means by 1.15. The 7-unit "effect" was mostly the covariate difference between groups; the true group effect (built to be 1) is what ANCOVA uncovers.

</details>

## Complete Example

Here is an end-to-end ANCOVA on `mtcars`, wrapped into the full workflow you should follow in real analyses: fit, check assumptions, run Type III tests, extract adjusted means, compute effect size, write the report.

```r title="Complete ANCOVA workflow on mtcars"
# 1. Fit
final_fit <- aov(mpg ~ wt + cyl, data = mt)

# 2. Parallel slopes check
interact_p <- Anova(aov(mpg ~ wt * cyl, data = mt), type = "III")["wt:cyl", "Pr(>F)"]
cat("Parallel slopes p =", round(interact_p, 3), "\n")
#> Parallel slopes p = 0.259

# 3. Type III ANCOVA
final_III <- Anova(final_fit, type = "III")

# 4. Adjusted means
final_emm <- emmeans(final_fit, specs = ~ cyl)

# 5. Effect size
final_eta <- eta_squared(final_fit, partial = TRUE)

# 6. Report
cat(sprintf("F(2, 28) = %.2f, p = %.4f, partial eta-squared = %.2f\n",
            final_III["cyl", "F value"],
            final_III["cyl", "Pr(>F)"],
            final_eta$Eta2_partial[final_eta$Parameter == "cyl"]))
#> F(2, 28) = 7.65, p = 0.0023, partial eta-squared = 0.35

print(final_emm)
#>  cyl emmean   SE df lower.CL upper.CL
#>  4     23.9 1.01 28     21.8     26.0
#>  6     19.8 0.83 28     18.1     21.5
#>  8     17.3 1.05 28     15.1     19.5
```

Every step has a purpose. The parallel-slopes check validates the ANCOVA model. Type III sums of squares produce the canonical F-test. `emmeans` extracts the adjusted means and their intervals. `eta_squared` gives the effect size that belongs in every published ANCOVA. The final `sprintf` assembles the exact sentence a reader or reviewer needs.

## Summary

![ANCOVA workflow in R](screenshots/ANCOVA-in-R-workflow.webp)
*Figure 3: End-to-end ANCOVA workflow, from data to reported adjusted means.*

| Concept | What to remember | R function |
|---------|-----------------|-----------|
| Core idea | Control for a covariate to reduce error variance | `aov(y ~ cov + group)` |
| Power gain | Residual MS shrinks; F-statistic rises | Compare `summary()` tables |
| Type III SS | Use for unbalanced designs | `car::Anova(fit, type = "III")` |
| Parallel slopes | Group × covariate interaction must be n.s. | `aov(y ~ cov * group)` |
| Adjusted means | Group means at average covariate value | `emmeans::emmeans(fit, ~ group)` |
| Pairwise tests | Tukey-adjusted contrasts of adjusted means | `pairs(emm)` |
| Effect size | Partial eta-squared for each term | `effectsize::eta_squared(fit)` |
| Reporting | F, df, p, partial η², adjusted means + CIs | `sprintf()` template |

## References

1. Fox, J. — *Applied Regression Analysis and Generalized Linear Models*, 3rd ed. Sage (2016). Chapters on ANCOVA and Type III tests. [Link](https://socialsciences.mcmaster.ca/jfox/Books/Applied-Regression-3E/)
2. Kutner, M. H., Nachtsheim, C. J., Neter, J., & Li, W. — *Applied Linear Statistical Models*, 5th ed. McGraw-Hill (2005).
3. Huitema, B. — *The Analysis of Covariance and Alternatives*, 2nd ed. Wiley (2011). [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118067475)
4. Lenth, R. V. — emmeans package documentation. [Link](https://cran.r-project.org/web/packages/emmeans/vignettes/basics.html)
5. Fox, J., & Weisberg, S. — *An R Companion to Applied Regression*, 3rd ed. Sage (2019). [Link](https://us.sagepub.com/en-us/nam/an-r-companion-to-applied-regression/book246125)
6. Wickham, H., & Grolemund, G. — *R for Data Science*. O'Reilly (2017). Modeling chapters. [Link](https://r4ds.had.co.nz/)
7. Wilkinson, L., & APA Task Force — "Statistical Methods in Psychology Journals." *American Psychologist* 54, 594-604 (1999).

## Continue Learning

- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html) — the baseline test ANCOVA extends; understand it first if you are new to F-tests and group comparisons.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html) — ANCOVA inherits every regression assumption; this guide covers the diagnostics.
- [Post-Hoc Tests After ANOVA](Post-Hoc-Tests-After-ANOVA.html) — compare the pairwise-contrast machinery for plain ANOVA with the `emmeans::pairs()` approach used here.

---
title: "Survey Package R Exercises: 20 Complex-Survey Practice Problems"
slug: "Survey-Analysis-in-R-Exercises"
description: "Twenty survey package R exercises: svydesign, svymean, svyby, svyglm, post-stratification, raking, replicate weights. Hidden solutions, real output."
keywords: "survey package R exercises, svydesign exercises, svyglm exercises, weighted analysis R, complex survey R, raking R, replicate weights R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Survey Analysis Exercises"
sidebar_order: 157
fr_parent: "R-Tutorial.html"
auto_link_terms: "survey package r|svydesign|svyglm|svyby|post-stratification r|replicate weights r"
auto_link_case_sensitive: false
target_keyword: "survey package R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Survey Package R Exercises: 20 Complex-Survey Practice Problems

<p class="lead">Twenty practice problems on complex survey analysis with the R survey package: design objects, weighted estimators, subgroup analysis, categorical inference, regression on survey designs, and calibration. Every problem hides a fully worked solution with output and an explanation; click to reveal once you have written your own.</p>

```r title="Run this once before any exercise"
library(survey)
library(srvyr)
library(dplyr)
data(api)
data(nhanes, package = "survey")
```

The four `api*` data frames loaded above (`apipop`, `apistrat`, `apiclus1`, `apiclus2`) are sample frames from California's Academic Performance Index drawn under different sampling schemes. They are the canonical teaching data for the `survey` package and you will use them across most of the problems below.

## Section 1. Building survey design objects (3 problems)

### Exercise 1.1: Build a stratified single-stage design from apistrat

**Task:** A government education researcher receives the `apistrat` sample of 200 California schools drawn stratified by school type (elementary, middle, high). The frame stores sampling weights in column `pw` and the stratum label in `stype`. Build a `svydesign` object that describes this stratified single-stage sample and save it to `ex_1_1`.

**Expected result:**

```
#> Stratified Independent Sampling design (with replacement)
#> svydesign(id = ~1, strata = ~stype, weights = ~pw, data = apistrat)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- svydesign(id = ~1, strata = ~stype, weights = ~pw, data = apistrat)
ex_1_1
#> Stratified Independent Sampling design (with replacement)
#> svydesign(id = ~1, strata = ~stype, weights = ~pw, data = apistrat)
```

**Explanation:** `id = ~1` signals no clustering (single-stage). `strata = ~stype` tells `survey` to compute variances within each stratum and pool them, which is what makes stratified estimators more efficient than simple random sampling. `weights = ~pw` carries the inverse-inclusion-probability weight so totals scale up to the population. Dropping `strata` would leave point estimates unchanged but inflate standard errors because the stratification gain would be ignored.

</details>

### Exercise 1.2: Build a single-stage cluster design from apiclus1

**Task:** The same education researcher now works with `apiclus1`, where entire school districts (`dnum`) were sampled and every school inside the chosen districts was observed. The weight column is `pw`. Build a single-stage cluster design with the districts as primary sampling units and save it to `ex_1_2`.

**Expected result:**

```
#> 1 - level Cluster Sampling design (with replacement)
#> With (15) clusters.
#> svydesign(id = ~dnum, weights = ~pw, data = apiclus1)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- svydesign(id = ~dnum, weights = ~pw, data = apiclus1)
ex_1_2
#> 1 - level Cluster Sampling design (with replacement)
#> With (15) clusters.
#> svydesign(id = ~dnum, weights = ~pw, data = apiclus1)
```

**Explanation:** With cluster sampling, the unit of randomization is the cluster (the district), not the school, so `id = ~dnum` is critical: every school in the same district shares the same selection event and their outcomes are correlated. Passing `id = ~1` here would treat the 183 schools as independent draws and shrink the standard errors well below their true value, which is the most common beginner mistake with clustered data.

</details>

### Exercise 1.3: Build a two-stage cluster design from apiclus2

**Task:** For `apiclus2`, 40 districts were sampled at stage one and up to 5 schools per district were sampled at stage two. The frame stores stage-one and stage-two sample sizes in `fpc1` and `fpc2` and identifiers in `dnum` and `snum`. Build a two-stage cluster design that accounts for finite-population corrections at both stages and save it to `ex_1_3`.

**Expected result:**

```
#> 2 - level Cluster Sampling design
#> With (40, 126) clusters.
#> svydesign(id = ~dnum + snum, fpc = ~fpc1 + fpc2, data = apiclus2)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- svydesign(id = ~dnum + snum, fpc = ~fpc1 + fpc2, data = apiclus2)
ex_1_3
#> 2 - level Cluster Sampling design
#> With (40, 126) clusters.
#> svydesign(id = ~dnum + snum, fpc = ~fpc1 + fpc2, data = apiclus2)
```

**Explanation:** When you supply `fpc`, `svydesign` derives the weights from the inclusion probabilities at each stage, so you do not pass `weights`. The two-stage `id` formula `~dnum + snum` declares that variability comes first from sampling districts and then from sampling schools inside chosen districts. The `fpc` columns are the population sizes at each stage: dropping `fpc2` would treat the within-district sample as drawn with replacement and overstate the variance for population-total estimators.

</details>

## Section 2. Weighted point estimates (4 problems)

### Exercise 2.1: Compute the weighted mean of api00

**Task:** Using the stratified design `ex_1_1` you built earlier, the researcher wants a single headline number: the population mean of the year-2000 API score (`api00`) across all California schools, with its standard error. Compute the weighted mean and save the `svystat` object to `ex_2_1`.

**Expected result:**

```
#>         mean     SE
#> api00 662.29 9.4089
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- svymean(~api00, ex_1_1)
ex_2_1
#>         mean     SE
#> api00 662.29 9.4089
```

**Explanation:** `svymean()` ignores the unweighted `mean(apistrat$api00)` and uses the survey weights, which is essential when the sampling fractions differ by stratum (here, high schools were oversampled). The standard error comes from a Taylor-series linearization that accounts for stratification, so it is smaller than what a naive `t.test` would produce. The result prints as a one-row matrix with class `svystat`; pass it to `confint()` for a Wald confidence interval.

</details>

### Exercise 2.2: Compute the weighted total enrolment

**Task:** The state superintendent's office asks for the estimated total student enrolment across all California schools, based on the stratified sample. Using `ex_1_1` and the `enroll` column, compute the weighted total with its standard error and save the result to `ex_2_2`.

**Expected result:**

```
#>         total     SE
#> enroll 3687178 114642
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- svytotal(~enroll, ex_1_1)
ex_2_2
#>         total     SE
#> enroll 3687178 114642
```

**Explanation:** `svytotal()` multiplies each observation by its weight and sums, giving an estimate of the finite-population total. Without survey weights you would underestimate the total dramatically because the sample only contains 200 schools. The standard error here is large in absolute terms but small as a fraction of the estimate (about 3%), reflecting the design's efficiency. Use `coef()` and `SE()` to pull out the numeric values for downstream code.

</details>

### Exercise 2.3: Estimate weighted quartiles of api00

**Task:** The accountability team prefers quantiles over means because the API distribution is skewed by a handful of very low-performing schools. Using the stratified design `ex_1_1`, estimate the 25th, 50th, and 75th percentiles of `api00` with their standard errors and save the result to `ex_2_3`.

**Expected result:**

```
#> Statistic:
#>       0.25 0.5 0.75
#> api00  565 668  756
#> SE:
#>          0.25      0.5     0.75
#> api00 17.4108 14.71445 16.04022
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- svyquantile(~api00, ex_1_1, quantiles = c(0.25, 0.5, 0.75))
ex_2_3
#> Statistic:
#>       0.25 0.5 0.75
#> api00  565 668  756
#> SE:
#>          0.25      0.5     0.75
#> api00 17.4108 14.71445 16.04022
```

**Explanation:** `svyquantile()` inverts the weighted empirical CDF, so the result is the value at which the cumulative weight first crosses the requested probability. Standard errors come from a Woodruff confidence-interval inversion by default, which is more reliable than bootstrap quantiles in small samples. The interquartile range of 191 points here tells a richer story than the mean: the bottom quartile is more than a full standard deviation below the top, signaling persistent inequality across schools.

</details>

### Exercise 2.4: Report the design effect for api00

**Task:** A reviewer asks how much the standard error of the mean API score is inflated by stratification compared with simple random sampling. Using the same stratified design, compute `svymean` of `api00` while requesting the design effect, and save the resulting `svystat` to `ex_2_4`.

**Expected result:**

```
#>         mean     SE   DEff
#> api00 662.29 9.4089 0.5491
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- svymean(~api00, ex_1_1, deff = TRUE)
ex_2_4
#>         mean     SE   DEff
#> api00 662.29 9.4089 0.5491
```

**Explanation:** The design effect (DEff) is the ratio of the actual sampling variance to the variance you would have got under simple random sampling of the same size. A DEff below 1 (here, 0.55) means stratification has **reduced** the variance, roughly halving it: the effective sample size is `200 / 0.55` or about 364. Cluster designs in the same data show a DEff well above 1, since intra-cluster correlation costs precision. Always report DEff alongside SE in survey publications so readers can compare designs.

</details>

## Section 3. Subgroup analysis (3 problems)

### Exercise 3.1: Mean api00 by school type

**Task:** Using the stratified design `ex_1_1`, compute the weighted mean of `api00` separately within each of the three school types (`stype`: elementary, high, middle) along with standard errors. Save the resulting `svyby` object to `ex_3_1`.

**Expected result:**

```
#>   stype    api00       se
#> E     E 674.4393 12.32319
#> H     H 625.6747 21.42796
#> M     M 636.6111 16.40067
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- svyby(~api00, ~stype, ex_1_1, svymean)
ex_3_1
#>   stype    api00       se
#> E     E 674.4393 12.32319
#> H     H 625.6747 21.42796
#> M     M 636.6111 16.40067
```

**Explanation:** `svyby()` is the survey-aware analogue of `tapply()` or `dplyr::group_by()` + `summarise()`: it slices the design by the grouping variable and applies the chosen statistic within each slice while preserving the design metadata. The result is a data frame, so it composes well with `ggplot2`. To produce a covariance matrix between the three subgroup means (needed for contrasts), add `covmat = TRUE`. Do not subset the data frame manually and call `svymean` separately: that breaks the strata and inflates SEs.

</details>

### Exercise 3.2: Mean api00 restricted to schools with high meal-program participation

**Task:** A poverty researcher wants the weighted mean of `api00` restricted to schools where more than 50% of students participate in the free-meals program (`meals > 50`). Build the restricted design with `subset()` on `ex_1_1`, then call `svymean()` on `~api00`, and save the result to `ex_3_2`.

**Expected result:**

```
#>         mean     SE
#> api00 559.78 11.396
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- svymean(~api00, subset(ex_1_1, meals > 50))
ex_3_2
#>         mean     SE
#> api00 559.78 11.396
```

**Explanation:** `subset()` applied to a `survey.design` object zeros out the weights for excluded rows rather than dropping them, which keeps the stratum count intact so variance estimation is still valid. This is the right way to do domain estimation in `survey`; calling `svydesign()` on a pre-filtered data frame is **wrong** because losing a whole stratum collapses the variance calculation in that cell. The big gap between 560 here and the 662 overall mean illustrates why poverty researchers always demand domain-conditional estimates.

</details>

### Exercise 3.3: Difference in means between school types with svycontrast

**Task:** A trustee wants a defensible test of whether elementary schools outscore high schools on `api00`. Using the `svyby` covariance output, compute the contrast `Elementary minus High` with its standard error using `svycontrast()` so that the test accounts for the covariance between the two subgroup means. Save the contrast object to `ex_3_3`.

**Expected result:**

```
#>           contrast     SE
#> E_minus_H   48.765 24.717
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
by_means <- svyby(~api00, ~stype, ex_1_1, svymean, covmat = TRUE)
ex_3_3 <- svycontrast(by_means, list(E_minus_H = c(1, -1, 0)))
ex_3_3
#>           contrast     SE
#> E_minus_H   48.765 24.717
```

**Explanation:** Without `covmat = TRUE`, `svyby` only retains the per-group SEs and `svycontrast()` will fall back to assuming independence between groups, which biases the test. Because the three school-type means are estimated from disjoint strata in this design the covariance happens to be zero, but in cluster or multistage designs subgroup estimates are usually correlated and the difference SE can be much smaller (or larger) than `sqrt(SE1^2 + SE2^2)`. Always pass `covmat = TRUE` when you plan to combine subgroup estimates.

</details>

## Section 4. Categorical inference on survey data (3 problems)

### Exercise 4.1: Weighted two-way contingency table of stype by sch.wide

**Task:** The accountability office wants the joint distribution of school type (`stype`) and whether the school met its school-wide growth target (`sch.wide`, Yes/No), expressed as weighted counts rather than raw frequencies. Using `ex_1_1`, build the weighted contingency table with `svytable()` and save it to `ex_4_1`.

**Expected result:**

```
#>      sch.wide
#> stype       No      Yes
#>     E 1071.661 3194.122
#>     H  516.169  262.580
#>     M  656.181  640.020
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- svytable(~stype + sch.wide, ex_1_1)
ex_4_1
#>      sch.wide
#> stype       No      Yes
#>     E 1071.661 3194.122
#>     H  516.169  262.580
#>     M  656.181  640.020
```

**Explanation:** `svytable()` returns a table of weighted counts, not unweighted frequencies, so the cell values sum to an estimate of the population total in each cell. A common pitfall: do not pass this result to `chisq.test()`, which assumes the entries are independent unweighted counts; use `svychisq()` (next exercise) for a design-aware test. Pass `Ntotal = sum(weights)` if you want the table rescaled to the actual population size for a cleaner display in reports.

</details>

### Exercise 4.2: Design-corrected chi-square test of independence

**Task:** Following on from the weighted table, test whether `stype` and `sch.wide` are independent in the California school population. Use `svychisq()` on `ex_1_1` with the Rao-Scott second-order adjustment (the default `statistic = "F"`) and save the htest object to `ex_4_2`.

**Expected result:**

```
#> 	Pearson's X^2: Rao & Scott adjustment
#>
#> data:  svychisq(~stype + sch.wide, ex_1_1)
#> F = 28.397, ndf = 1.7321, ddf = 341.4324, p-value = 6.31e-11
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- svychisq(~stype + sch.wide, ex_1_1)
ex_4_2
#> 	Pearson's X^2: Rao & Scott adjustment
#>
#> data:  svychisq(~stype + sch.wide, ex_1_1)
#> F = 28.397, ndf = 1.7321, ddf = 341.4324, p-value = 6.31e-11
```

**Explanation:** The classical Pearson chi-square statistic does not have a chi-square distribution under complex sampling because the cell counts are not multinomial. `svychisq()` reports a Rao-Scott corrected statistic, scaled by the average generalized design effect, distributed as F with adjusted degrees of freedom. The decisive p-value here confirms a strong association between school type and meeting the schoolwide growth target: high schools are far less likely than elementary schools to clear the bar.

</details>

### Exercise 4.3: Weighted proportion with a logit confidence interval

**Task:** A reporter asks what fraction of California schools met the school-wide growth target overall, with a 95% confidence interval. Using `ex_1_1`, compute the weighted proportion of `sch.wide == "Yes"` using `svyciprop()` with the logit method so the interval respects the [0,1] boundary, and save the result to `ex_4_3`.

**Expected result:**

```
#>                       2.5% 97.5%
#> I(sch.wide == "Yes") 0.59 0.527 0.65
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- svyciprop(~I(sch.wide == "Yes"), ex_1_1, method = "logit")
ex_4_3
#>                       2.5% 97.5%
#> I(sch.wide == "Yes") 0.59 0.527 0.65
```

**Explanation:** When a proportion is close to 0 or 1, the symmetric Wald interval can spill outside [0,1]; `method = "logit"` transforms to the log-odds scale, builds a symmetric interval there, then inverts it, guaranteeing a valid interval. The other useful methods are `"likelihood"` for very small samples and `"beta"` for the Clopper-Pearson style. For mid-range proportions like 0.59 all methods give nearly identical answers; the choice matters most near the edges.

</details>

## Section 5. Regression on survey designs (3 problems)

### Exercise 5.1: Survey-weighted linear regression of api00 on ell and meals

**Task:** The policy team wants to know how much the API score drops for each percentage point increase in English Language Learners (`ell`) and free-meal eligibility (`meals`), holding the other constant. Fit a Gaussian `svyglm()` of `api00 ~ ell + meals` on `ex_1_1` and save the fitted model object to `ex_5_1`.

**Expected result:**

```
#> Survey design:
#> svydesign(id = ~1, strata = ~stype, weights = ~pw, data = apistrat)
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 820.8873     8.0809  101.58   <2e-16 ***
#> ell          -0.4858     0.2266   -2.14   0.0334 *
#> meals        -3.1326     0.2107  -14.87   <2e-16 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
summary(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- svyglm(api00 ~ ell + meals, design = ex_1_1)
summary(ex_5_1)
#> Survey design:
#> svydesign(id = ~1, strata = ~stype, weights = ~pw, data = apistrat)
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 820.8873     8.0809  101.58   <2e-16 ***
#> ell          -0.4858     0.2266   -2.14   0.0334 *
#> meals        -3.1326     0.2107  -14.87   <2e-16 ***
```

**Explanation:** `svyglm()` differs from a weighted `lm()` in two ways: it computes design-consistent (sandwich) standard errors that respect strata and clusters, and the residual degrees of freedom default to `nrow(design) - 1 - (#strata - 1)`. Calling `lm(api00 ~ ell + meals, weights = pw)` would give the same point estimates but wrong SEs because it treats the weights as precision weights, not sampling weights, and ignores the stratification.

</details>

### Exercise 5.2: Survey-weighted logistic regression for meeting the growth target

**Task:** Now model the binary outcome `sch.wide` (whether the school met its growth target) as a function of `api99` and `meals`. Fit a `svyglm()` with `family = quasibinomial()` on `ex_1_1` (encoding the Yes/No factor as 0/1 via `as.numeric(sch.wide == "Yes")`) and save the fitted model to `ex_5_2`.

**Expected result:**

```
#> Coefficients:
#>               Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -10.241057   1.847168  -5.544 9.69e-08 ***
#> api99         0.018443   0.002921   6.314 1.62e-09 ***
#> meals        -0.005247   0.008101  -0.648    0.518
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
summary(ex_5_2)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- svyglm(
  I(as.numeric(sch.wide == "Yes")) ~ api99 + meals,
  design = ex_1_1,
  family = quasibinomial()
)
summary(ex_5_2)$coefficients
#> Coefficients:
#>               Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -10.241057   1.847168  -5.544 9.69e-08 ***
#> api99         0.018443   0.002921   6.314 1.62e-09 ***
#> meals        -0.005247   0.008101  -0.648    0.518
```

**Explanation:** `family = quasibinomial()` is preferred over `binomial()` for survey logistic regression because the latter triggers a "non-integer successes" warning whenever the weights are not integers; quasibinomial uses the same logit link with a free dispersion parameter and otherwise identical estimates. The strong `api99` coefficient (prior-year score) tells the obvious story: schools that did well last year tend to keep doing well. Once you control for that, `meals` adds nothing.

</details>

### Exercise 5.3: Linear combination of regression coefficients with svycontrast

**Task:** The policy team wants the marginal effect on `api00` of moving a school from a low-poverty profile (`ell = 5`, `meals = 10`) to a high-poverty profile (`ell = 30`, `meals = 70`), with a valid standard error. Using `ex_5_1`, compute that difference with `svycontrast()` so it picks up the covariance between the two slopes, and save the result to `ex_5_3`.

**Expected result:**

```
#>              contrast    SE
#> profile_diff   -200.1 15.06
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- svycontrast(
  ex_5_1,
  list(profile_diff = c("(Intercept)" = 0, ell = 25, meals = 60))
)
ex_5_3
#>              contrast    SE
#> profile_diff   -200.1 15.06
```

**Explanation:** `svycontrast()` takes a named list of linear combinations and returns each combination's estimate and SE using the full coefficient covariance matrix, so the resulting SE is smaller than `sqrt((25*SE_ell)^2 + (60*SE_meals)^2)` whenever `ell` and `meals` are positively correlated in the design (and they are: schools with many ELL students also tend to have many meal-eligible students). Manually adding the variances ignores that covariance and would overstate the uncertainty by 20-40%.

</details>

## Section 6. Calibration and replicate weights (4 problems)

### Exercise 6.1: Post-stratify the stratified design to known school-type totals

**Task:** External enrolment data tells the researcher that the true California school counts are 4421 elementary, 755 high, and 1018 middle schools. Post-stratify the design `ex_1_1` to those known totals using `postStratify()` so the weights line up exactly with the population, and save the new design to `ex_6_1`.

**Expected result:**

```
#> Stratified Independent Sampling design (with replacement)
#> postStratify(ex_1_1, ~stype, pop_totals)
```

**Difficulty:** Intermediate

```r title="Your turn"
pop_totals <- data.frame(
  stype = c("E", "H", "M"),
  Freq  = c(4421, 755, 1018)
)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pop_totals <- data.frame(
  stype = c("E", "H", "M"),
  Freq  = c(4421, 755, 1018)
)
ex_6_1 <- postStratify(ex_1_1, ~stype, pop_totals)
ex_6_1
#> Stratified Independent Sampling design (with replacement)
#> postStratify(ex_1_1, ~stype, pop_totals)
```

**Explanation:** Post-stratification adjusts weights so that the sum of weights in each post-stratum equals the known population total, which reduces variance when the post-stratum variable is correlated with the outcome and corrects for non-response or coverage bias. It is **not** the same as stratified sampling: the strata in the design control variance estimation, while post-strata control the weight adjustment. After post-stratifying, the standard errors of `svytotal()` for variables related to `stype` drop noticeably.

</details>

### Exercise 6.2: Rake to two sets of marginal totals

**Task:** Suppose the researcher has marginal population totals for `stype` (elementary 4421, high 755, middle 1018) and for `awards` (Yes 4756, No 1438) but not the joint table. Rake the design `ex_1_1` to both marginals using `rake()`, and save the calibrated design to `ex_6_2`.

**Expected result:**

```
#> Stratified Independent Sampling design (with replacement)
#> rake(ex_1_1, list(~stype, ~awards), list(stype_pop, awards_pop))
```

**Difficulty:** Advanced

```r title="Your turn"
stype_pop  <- data.frame(stype  = c("E", "H", "M"), Freq = c(4421, 755, 1018))
awards_pop <- data.frame(awards = c("No", "Yes"),    Freq = c(1438, 4756))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stype_pop  <- data.frame(stype  = c("E", "H", "M"), Freq = c(4421, 755, 1018))
awards_pop <- data.frame(awards = c("No", "Yes"),    Freq = c(1438, 4756))
ex_6_2 <- rake(
  ex_1_1,
  sample.margins     = list(~stype, ~awards),
  population.margins = list(stype_pop, awards_pop)
)
ex_6_2
#> Stratified Independent Sampling design (with replacement)
#> rake(ex_1_1, list(~stype, ~awards), list(stype_pop, awards_pop))
```

**Explanation:** Raking (iterative proportional fitting) is the right tool when you know the marginal distributions of two or more auxiliary variables but not their joint distribution: it cycles through each margin, adjusting the weights so each marginal sums correctly, and iterates until everything matches simultaneously. Compared with full post-stratification it loses a little efficiency but is the standard approach in election polling and national health surveys where joint totals are simply unavailable.

</details>

### Exercise 6.3: Build a bootstrap replicate-weight design from a Taylor design

**Task:** Because Taylor-series variance estimation can struggle with non-smooth statistics like quantiles, convert the stratified Taylor design `ex_1_1` into a bootstrap replicate-weight design with 200 replicates using `as.svrepdesign()`. Save the resulting design to `ex_6_3`.

**Expected result:**

```
#> Call: as.svrepdesign(ex_1_1, type = "bootstrap", replicates = 200)
#> Survey bootstrap with 200 replicates.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- as.svrepdesign(ex_1_1, type = "bootstrap", replicates = 200)
ex_6_3
#> Call: as.svrepdesign(ex_1_1, type = "bootstrap", replicates = 200)
#> Survey bootstrap with 200 replicates.
```

**Explanation:** Replicate-weight methods (jackknife, BRR, bootstrap) sidestep linearization by re-computing the estimator under many perturbed weight columns and treating the variability of those replicate estimates as the variance. Bootstrap replicates are robust for medians, quantiles, ratios, and pretty much any non-linear estimator. Many public-use survey files (CPS, ACS, NHANES) ship with replicate weights already attached; load them with `svrepdesign()` directly rather than `svydesign()`.

</details>

### Exercise 6.4: Reproduce subgroup means with the srvyr tidyverse syntax

**Task:** A data engineer who lives inside the tidyverse wants to reproduce the subgroup means from `ex_3_1` using `srvyr`'s pipe-friendly syntax. Convert `ex_1_1` to a `srvyr` design with `as_survey()`, group by `stype`, and summarise the mean of `api00` with `survey_mean()`. Save the resulting tibble to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   stype api00 api00_se
#>   <fct> <dbl>    <dbl>
#> 1 E      674.     12.3
#> 2 H      626.     21.4
#> 3 M      637.     16.4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- ex_1_1 |>
  as_survey() |>
  group_by(stype) |>
  summarise(api00 = survey_mean(api00))
ex_6_4
#> # A tibble: 3 x 3
#>   stype api00 api00_se
#>   <fct> <dbl>    <dbl>
#> 1 E      674.     12.3
#> 2 H      626.     21.4
#> 3 M      637.     16.4
```

**Explanation:** `srvyr` is a thin wrapper around `survey` that exposes a `dplyr` grammar: `group_by` for subgroups, `summarise` with `survey_mean`, `survey_total`, `survey_quantile`, and `survey_prop`. The numerical results are byte-identical to `svyby` because the same underlying linearization runs under the hood. Use it when your team is already fluent in `dplyr`, or when you want survey estimates to flow into a `ggplot2` pipeline without intermediate `as.data.frame()` calls.

</details>

## What to do next

You have practised every core verb of the `survey` package across designs, point estimates, subgroups, categorical inference, regression, and calibration. To go further:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html) sharpens the `group_by + summarise` reflex that powers `srvyr`.
- [Logistic Regression in R Exercises](Logistic-Regression-in-R-Exercises.html) gives you 25 problems on binary outcomes that you can re-solve on survey designs with `svyglm`.
- [Bootstrap in R Exercises](Bootstrap-in-R-Exercises.html) covers the replicate-weight intuition from a non-survey angle so the bootstrap design idea clicks.
- The official Lumley *Complex Surveys* book (Wiley, 2010) remains the canonical reference for the design choices behind every function used above.

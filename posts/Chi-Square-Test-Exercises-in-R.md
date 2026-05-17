---
title: "Chi-Square Test Exercises in R: 20 Practice Problems with Solutions"
slug: "Chi-Square-Test-Exercises-in-R"
description: "Chi-square R exercises: 20 practice problems with runnable solutions, covering goodness-of-fit, independence, residuals, Cramer's V, and Fisher's exact."
keywords: "chi square R exercises, chi-square test exercises in R, chi-square practice problems, goodness-of-fit R, chi-square independence, Cramer's V R, Fisher exact test R, chisq.test examples"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Chi-Square Exercises (20 problems)"
sidebar_order: 145
fr_parent: "Chi-Square-Tests-in-R.html"
auto_link_terms: "chi-square test exercises|chi-square practice problems|chi-square goodness-of-fit|chi-square independence|chi-square residuals|cramer's v in r"
auto_link_case_sensitive: false
target_keyword: "chi square R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Chi-Square Test Exercises in R: 20 Practice Problems with Solutions

<p class="lead">These 20 chi-square R exercises cover goodness-of-fit, tests of independence, effect size with Cramer's V, standardized residuals, Yates' correction, Fisher's exact, and Monte Carlo p-values. Every exercise sets an expected output, asks you to save a named object, and hides a fully runnable solution with a short explanation.</p>

```r title="Run this once before any exercise"
library(tibble)
```

## Section 1. Goodness-of-fit (4 problems)

### Exercise 1.1: Test a six-sided die for fairness from raw roll counts

**Task:** A casino floor manager has rolled a six-sided die 120 times to verify it's fair and observed counts c(15, 22, 18, 24, 19, 22) for faces 1 through 6. Run a goodness-of-fit chi-square test against equal proportions (1/6 each) and save the full `chisq.test()` result object to `ex_1_1` so the p-value can be inspected.

**Expected result:**

```
#> 	Chi-squared test for given probabilities
#>
#> data:  rolls
#> X-squared = 2.7, df = 5, p-value = 0.7461
```

**Difficulty:** Beginner

[HINTS]
A fairness check weighs each face's observed count against what perfect equal chance would predict across all six faces.
Call `chisq.test()` on the count vector and supply the `p =` argument with six equal probabilities.

```r title="Your turn"
rolls <- c(15, 22, 18, 24, 19, 22)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rolls <- c(15, 22, 18, 24, 19, 22)
ex_1_1 <- chisq.test(rolls, p = rep(1/6, 6))
ex_1_1
#> 	Chi-squared test for given probabilities
#>
#> data:  rolls
#> X-squared = 2.7, df = 5, p-value = 0.7461
```

**Explanation:** `chisq.test()` switches to goodness-of-fit mode when you pass a single count vector plus a `p =` argument. The expected count for each face is `n * p = 120 / 6 = 20`. With p = 0.75 the data are very consistent with a fair die. If you omit `p`, the function defaults to equal proportions, so `chisq.test(rolls)` would produce the same result here.

</details>

### Exercise 1.2: Test Mendel's 9:3:3:1 dihybrid ratio on 556 peas

**Task:** A genetics class is checking Mendel's classic dihybrid ratio of 9:3:3:1 (round-yellow, wrinkled-yellow, round-green, wrinkled-green) from observed counts c(315, 108, 101, 32) in a sample of 556 peas. Run a goodness-of-fit test against those expected proportions and save the test result to `ex_1_2`.

**Expected result:**

```
#> 	Chi-squared test for given probabilities
#>
#> data:  peas
#> X-squared = 0.47, df = 3, p-value = 0.9254
```

**Difficulty:** Intermediate

[HINTS]
The expected proportions here are not equal, so the test needs the specific ratio you want to compare the counts against.
Hand `chisq.test()` the counts plus a `p =` argument built by dividing the integer ratio `c(9, 3, 3, 1)` by its total so it sums to 1.

```r title="Your turn"
peas <- c(315, 108, 101, 32)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
peas <- c(315, 108, 101, 32)
ex_1_2 <- chisq.test(peas, p = c(9, 3, 3, 1) / 16)
ex_1_2
#> 	Chi-squared test for given probabilities
#>
#> data:  peas
#> X-squared = 0.47, df = 3, p-value = 0.9254
```

**Explanation:** The `p` vector must sum to 1, so divide the integer ratio by its total (`16`). A p-value of 0.93 is so high that some statisticians have famously suggested Mendel's published numbers are "too clean" to be real raw data. Goodness-of-fit assumes independent observations and expected counts of at least 5, both of which hold here.

</details>

### Exercise 1.3: Extract chi-square statistic, df, and p-value as a named vector

**Task:** A junior analyst needs the chi-square statistic, degrees of freedom, and p-value from `ex_1_2` packed into a single named numeric vector for a results table. Build a length-3 vector with names "chisq", "df", and "p" by pulling `$statistic`, `$parameter`, and `$p.value` and save it to `ex_1_3`.

**Expected result:**

```
#>      chisq         df          p
#> 0.47000000 3.00000000 0.92540000
```

**Difficulty:** Beginner

[HINTS]
A fitted test object stores its statistic, degrees of freedom, and p-value as separate components you can pull out one at a time.
Build the result with `c(chisq = ..., df = ..., p = ...)`, reading `ex_1_2$statistic`, `$parameter`, and `$p.value`, and strip stray names with `unname()`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- c(chisq = unname(ex_1_2$statistic),
            df    = unname(ex_1_2$parameter),
            p     = ex_1_2$p.value)
ex_1_3
#>      chisq         df          p
#> 0.47000000 3.00000000 0.92540000
```

**Explanation:** `$statistic` and `$parameter` come back as named numeric vectors of length 1 (named "X-squared" and "df" respectively), so wrapping them in `unname()` keeps your vector's names clean. This pattern is the building block for any pipeline that loops chi-square tests and collects results into a tibble or data frame for reporting.

</details>

### Exercise 1.4: Compare store satisfaction mix against the national baseline

**Task:** A retailer surveyed 400 customers and got satisfaction counts c(Very = 180, Some = 140, Not = 80) but the national mix is 0.40, 0.40, 0.20 according to headquarters. Run a goodness-of-fit chi-square test of the store's counts against the national proportions and save the result to `ex_1_4` so the team can decide whether the store deviates.

**Expected result:**

```
#> 	Chi-squared test for given probabilities
#>
#> data:  sat
#> X-squared = 5, df = 2, p-value = 0.08208
```

**Difficulty:** Intermediate

[HINTS]
Judge the store's three-category mix against the externally supplied national baseline rather than against equal shares.
Run `chisq.test()` on the `sat` vector with `p = c(0.40, 0.40, 0.20)`.

```r title="Your turn"
sat <- c(Very = 180, Some = 140, Not = 80)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sat <- c(Very = 180, Some = 140, Not = 80)
ex_1_4 <- chisq.test(sat, p = c(0.40, 0.40, 0.20))
ex_1_4
#> 	Chi-squared test for given probabilities
#>
#> data:  sat
#> X-squared = 5, df = 2, p-value = 0.08208
```

**Explanation:** Expected counts are `400 * p = c(160, 160, 80)`. The "Very" cell contributes most of the chi-square value because the store has 20 more "Very" responses than expected. A p-value of 0.08 lands in borderline territory: not significant at 0.05 but worth flagging. With a larger sample size the same proportional gap would push the p-value lower.

</details>

## Section 2. Tests of independence (4 problems)

### Exercise 2.1: Test independence of drug and outcome in a 2x2 table

**Task:** A pharmaceutical analyst wants to know whether drug A and drug B produce different success rates in a small trial of 100 patients. Using the 2x2 matrix in the chunk below (rows = drug, columns = outcome), run `chisq.test()` without Yates' correction and save the result object to `ex_2_1` so success rates can be compared.

**Expected result:**

```
#> 	Pearson's Chi-squared test
#>
#> data:  drug_tab
#> X-squared = 5.7692, df = 1, p-value = 0.01632
```

**Difficulty:** Beginner

[HINTS]
For a two-by-two table R nudges the statistic by default, but here you want the plain, unadjusted version.
Call `chisq.test()` on `drug_tab` and set `correct = FALSE`.

```r title="Your turn"
drug_tab <- matrix(c(30, 18, 20, 32), nrow = 2,
                   dimnames = list(drug    = c("A", "B"),
                                   outcome = c("ok", "fail")))
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
drug_tab <- matrix(c(30, 18, 20, 32), nrow = 2,
                   dimnames = list(drug    = c("A", "B"),
                                   outcome = c("ok", "fail")))
ex_2_1 <- chisq.test(drug_tab, correct = FALSE)
ex_2_1
#> 	Pearson's Chi-squared test
#>
#> data:  drug_tab
#> X-squared = 5.7692, df = 1, p-value = 0.01632
```

**Explanation:** `correct = FALSE` turns off Yates' continuity correction, which R applies by default to 2x2 tables. Without correction, the chi-square statistic equals `z^2` from a two-proportion z-test, so `chisq.test(..., correct = FALSE)` matches `prop.test(..., correct = FALSE)`. Drug A's success rate (60%) versus B's (36%) gives a p-value of 0.016, comfortably below the conventional 0.05 cutoff.

</details>

### Exercise 2.2: Test whether Titanic passenger class is independent of survival

**Task:** A historian asks whether passenger class on the Titanic was related to survival. Collapse the built-in `Titanic` 4D array over Sex and Age using `margin.table()` to get a Class by Survived 4x2 table, then run `chisq.test()` and save the full result object to `ex_2_2` for further analysis later in the hub.

**Expected result:**

```
#> 	Pearson's Chi-squared test
#>
#> data:  titanic_tab
#> X-squared = 190.4, df = 3, p-value < 2.2e-16
```

**Difficulty:** Intermediate

[HINTS]
Once the four-way array has been collapsed to a single two-way table, an independence test reads it directly.
Pass the collapsed `titanic_tab` straight to `chisq.test()` with no extra arguments.

```r title="Your turn"
titanic_tab <- margin.table(Titanic, c(1, 4))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
titanic_tab <- margin.table(Titanic, c(1, 4))
ex_2_2 <- chisq.test(titanic_tab)
ex_2_2
#> 	Pearson's Chi-squared test
#>
#> data:  titanic_tab
#> X-squared = 190.4, df = 3, p-value < 2.2e-16
```

**Explanation:** `margin.table(Titanic, c(1, 4))` sums the 4-way array over dimensions 2 (Sex) and 3 (Age), leaving the Class by Survived 2-way table. Yates' correction is not applied because the table is larger than 2x2. With df = (4-1) * (2-1) = 3 and a chi-square statistic of 190, the p-value is effectively zero: class and survival are strongly associated, exactly what the lifeboat allocation pattern would predict.

</details>

### Exercise 2.3: Test wool and tension on the high-break face of warpbreaks

**Task:** A production engineer wants to know whether wool type and tension setting are independent when looms produce a high break rate. Bin `warpbreaks$breaks` into "low" (under 25) and "high" (25 or more), build the 3D table wool by tension by bin, slice the bin == "high" face, run `chisq.test()` on that 2x3 table, and save the result to `ex_2_3`.

**Expected result:**

```
#> 	Pearson's Chi-squared test
#>
#> data:  high_face
#> X-squared = 5.5043, df = 2, p-value = 0.0638
#> Warning: Chi-squared approximation may be incorrect
```

**Difficulty:** Advanced

[HINTS]
Small expected counts on this sliced face will trigger a noisy approximation message you can quietly silence.
Wrap the `chisq.test(high_face)` call inside `suppressWarnings()`.

```r title="Your turn"
bin <- cut(warpbreaks$breaks, breaks = c(-Inf, 25, Inf),
           labels = c("low", "high"))
warp_tab <- table(warpbreaks$wool, warpbreaks$tension, bin)
high_face <- warp_tab[, , "high"]
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bin <- cut(warpbreaks$breaks, breaks = c(-Inf, 25, Inf),
           labels = c("low", "high"))
warp_tab <- table(warpbreaks$wool, warpbreaks$tension, bin)
high_face <- warp_tab[, , "high"]
ex_2_3 <- suppressWarnings(chisq.test(high_face))
ex_2_3
#> 	Pearson's Chi-squared test
#>
#> data:  high_face
#> X-squared = 5.5043, df = 2, p-value = 0.0638
```

**Explanation:** A 3D table indexed by three variables can be sliced like a matrix: `tab[, , "high"]` grabs the wool by tension face for high-break looms only. Some cells will have small expected counts on this sliced face, which is why `chisq.test()` warns about the approximation. Exercise 4.2 shows how to switch to `fisher.test()` when those warnings show up.

</details>

### Exercise 2.4: Test independence of iris Species and binned Sepal.Length

**Task:** A botany student wants to know whether iris Species is related to flower size. Bin `iris$Sepal.Length` into "short" (under 5.5), "medium" (5.5 to under 6.5), and "long" (6.5 and above), build the Species by size table, run `chisq.test()` on the 3x3 table, and save the full result to `ex_2_4`.

**Expected result:**

```
#> 	Pearson's Chi-squared test
#>
#> data:  iris_tab
#> X-squared = 90.81, df = 4, p-value < 2.2e-16
```

**Difficulty:** Intermediate

[HINTS]
With the species-by-size table already built, the independence test needs nothing beyond the table itself.
Hand `iris_tab` to `chisq.test()` directly.

```r title="Your turn"
size <- cut(iris$Sepal.Length, breaks = c(-Inf, 5.5, 6.5, Inf),
            labels = c("short", "medium", "long"))
iris_tab <- table(iris$Species, size)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
size <- cut(iris$Sepal.Length, breaks = c(-Inf, 5.5, 6.5, Inf),
            labels = c("short", "medium", "long"))
iris_tab <- table(iris$Species, size)
ex_2_4 <- chisq.test(iris_tab)
ex_2_4
#> 	Pearson's Chi-squared test
#>
#> data:  iris_tab
#> X-squared = 90.81, df = 4, p-value < 2.2e-16
```

**Explanation:** Degrees of freedom equal `(3 - 1) * (3 - 1) = 4`. The p-value is essentially zero because setosa is overwhelmingly short while virginica is overwhelmingly medium or long, with versicolor straddling between. The cells driving the chi-square statistic are exactly where Species and binned size disagree most, which exercise 3.4 quantifies through per-cell contributions.

</details>

## Section 3. Effect size and residuals (4 problems)

### Exercise 3.1: Compute Cramer's V for the Titanic class by survived table

**Task:** A data scientist reporting on `ex_2_2` needs Cramer's V as the effect size measure alongside the p-value. Compute `V = sqrt(chi_square / (n * (min(rows, cols) - 1)))` using `ex_2_2$statistic` for the chi-square value and `sum(ex_2_2$observed)` for `n`, with rows = 4 and cols = 2, then save the single numeric value to `ex_3_1`.

**Expected result:**

```
#> [1] 0.294
```

**Difficulty:** Intermediate

[HINTS]
Effect size rescales the raw statistic by the sample size and the smaller table dimension so it lands between 0 and 1.
Plug `ex_2_2$statistic` and `sum(ex_2_2$observed)` for `n` into `sqrt(chisq / (n * (min(4, 2) - 1)))`, then `round()` to 3 places.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n      <- sum(ex_2_2$observed)
chisq  <- unname(ex_2_2$statistic)
ex_3_1 <- round(sqrt(chisq / (n * (min(4, 2) - 1))), 3)
ex_3_1
#> [1] 0.294
```

**Explanation:** Cramer's V rescales chi-square onto the 0-to-1 interval so it can be compared across tables of different sizes and sample sizes. By Cohen's rule of thumb for a 1-df table, V around 0.1 is small, 0.3 medium, 0.5 large. The Titanic table lands at V = 0.29, a medium-sized effect: class explains a real but not overwhelming share of the survival variation. The `vcd::assocstats()` function will print V along with phi and the contingency coefficient if you prefer not to compute it by hand.

</details>

### Exercise 3.2: Extract standardized residuals for the Titanic table

**Task:** A reviewer asks which cells of the Titanic Class by Survived table drive the chi-square result. Pull the matrix of standardized residuals from `ex_2_2$stdres`, round to two decimals, and save the rounded 4x2 matrix to `ex_3_2` so cells with |z| greater than 2 can be flagged as deviating from independence.

**Expected result:**

```
#>      Survived
#>           No   Yes
#> 1st    -9.46  9.46
#> 2nd    -1.45  1.45
#> 3rd     5.94 -5.94
#> Crew    4.41 -4.41
```

**Difficulty:** Intermediate

[HINTS]
The fitted test already holds a matrix of per-cell deviations scaled to behave like z-scores under the null.
Read `ex_2_2$stdres` and wrap it in `round(..., 2)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- round(ex_2_2$stdres, 2)
ex_3_2
#>      Survived
#>           No   Yes
#> 1st    -9.46  9.46
#> 2nd    -1.45  1.45
#> 3rd     5.94 -5.94
#> Crew    4.41 -4.41
```

**Explanation:** `$stdres` returns Pearson residuals adjusted to have asymptotic variance 1, so each cell behaves like a z-score under the null of independence. Values outside +/-2 are unusual: 1st class survived far more (z = 9.5) and 3rd class died far more (z = 5.9) than independence would predict. Use `$residuals` instead for unadjusted Pearson residuals if you want the raw `(O-E)/sqrt(E)`.

</details>

### Exercise 3.3: Inspect expected counts before trusting a small contingency test

**Task:** A statistician wants the matrix of expected counts before running chi-square on the mtcars `cyl` by `gear` contingency table to decide if the approximation is trustworthy. Run `chisq.test()` (wrap with `suppressWarnings()`), pull `$expected`, round to two decimals, and save the matrix to `ex_3_3` so cells with expected counts below 5 can be located.

**Expected result:**

```
#>      gear
#> cyl      3    4    5
#>   4   5.16 4.13 1.72
#>   6   3.28 2.62 1.09
#>   8   6.56 5.25 2.19
```

**Difficulty:** Intermediate

[HINTS]
Before trusting a test on a sparse table, look at the count each cell would hold if the variables were independent.
Run `suppressWarnings(chisq.test(cyl_gear))`, pull its `$expected` component, and `round()` to 2 decimals.

```r title="Your turn"
cyl_gear <- table(mtcars$cyl, mtcars$gear)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl_gear <- table(mtcars$cyl, mtcars$gear)
test_res <- suppressWarnings(chisq.test(cyl_gear))
ex_3_3   <- round(test_res$expected, 2)
ex_3_3
#>      gear
#> cyl      3    4    5
#>   4   5.16 4.13 1.72
#>   6   3.28 2.62 1.09
#>   8   6.56 5.25 2.19
```

**Explanation:** Five of the nine expected counts sit below 5, so the chi-square approximation is unreliable: R warns about this whenever you fit a small table. The cure is either to collapse sparse rows or columns into broader categories, or to switch to Monte Carlo simulation (exercise 4.3) or Fisher's exact (exercise 4.2). Use `$expected` to make this decision explicitly rather than guessing from row and column totals.

</details>

### Exercise 3.4: Rank cells by their contribution to the chi-square statistic

**Task:** A teaching assistant wants the per-cell contribution to the chi-square statistic for the Titanic Class by Survived table to highlight which cells dominate. Compute `(O - E)^2 / E` from `ex_2_2$observed` and `ex_2_2$expected`, round to one decimal, and save the 4x2 matrix to `ex_3_4` so the largest contributors can be ranked.

**Expected result:**

```
#>      Survived
#>          No  Yes
#> 1st    47.6 74.7
#> 2nd     1.0  1.5
#> 3rd    16.8 26.4
#> Crew    8.7 13.7
```

**Difficulty:** Advanced

[HINTS]
Each cell's share of the total statistic is its squared gap between observed and expected, scaled by the expected value.
Compute `(O - E)^2 / E` from `ex_2_2$observed` and `ex_2_2$expected`, then `round()` to 1 decimal.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
O <- ex_2_2$observed
E <- ex_2_2$expected
ex_3_4 <- round((O - E)^2 / E, 1)
ex_3_4
#>      Survived
#>          No  Yes
#> 1st    47.6 74.7
#> 2nd     1.0  1.5
#> 3rd    16.8 26.4
#> Crew    8.7 13.7
```

**Explanation:** Each cell of `(O-E)^2/E` is its share of the total chi-square statistic: the matrix sums to the reported `X-squared = 190.4`. The "1st class survived" cell contributes 74.7, the single largest piece, confirming the qualitative story that first-class passengers survived at far higher rates than independence would predict. Combine this with `$stdres` from exercise 3.2 to get both the size and direction of each deviation.

</details>

## Section 4. Small samples and alternatives (4 problems)

### Exercise 4.1: Compare the drug 2x2 result with and without Yates' correction

**Task:** A textbook author wants to show how Yates' continuity correction shifts a borderline 2x2 result. Using the same `drug_tab` matrix from exercise 2.1, run `chisq.test()` with `correct = TRUE` and with `correct = FALSE`, extract both p-values, and save them as a length-2 named numeric vector with names "yates" and "no_yates" to `ex_4_1`.

**Expected result:**

```
#>      yates   no_yates
#> 0.02637923 0.01631752
```

**Difficulty:** Intermediate

[HINTS]
Run the same two-by-two test twice, once with the continuity adjustment on and once off, and collect both tail probabilities.
Build a named vector calling `chisq.test()` with `correct = TRUE` and `correct = FALSE`, taking `$p.value` from each.

```r title="Your turn"
drug_tab <- matrix(c(30, 18, 20, 32), nrow = 2,
                   dimnames = list(drug    = c("A", "B"),
                                   outcome = c("ok", "fail")))
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
drug_tab <- matrix(c(30, 18, 20, 32), nrow = 2,
                   dimnames = list(drug    = c("A", "B"),
                                   outcome = c("ok", "fail")))
ex_4_1 <- c(yates    = chisq.test(drug_tab, correct = TRUE)$p.value,
            no_yates = chisq.test(drug_tab, correct = FALSE)$p.value)
ex_4_1
#>      yates   no_yates
#> 0.02637923 0.01631752
```

**Explanation:** Yates' continuity correction shrinks `|O - E|` by 0.5 before squaring, which pulls the chi-square statistic down and the p-value up. For a 2x2 table near the significance threshold the difference can flip the conclusion, as here: both p-values are below 0.05 but the corrected one is noticeably less significant. Most modern guides recommend `correct = FALSE` for tables with all expected counts at least 5; Yates was designed for the small-sample era before computers made `fisher.test()` cheap.

</details>

### Exercise 4.2: Switch to Fisher's exact test on a sparse 2x2 table

**Task:** A pilot trial has tiny cell counts so `chisq.test()` warns the approximation may be incorrect. Run `fisher.test()` on the inline 2x2 matrix given below (rows = treatment, columns = outcome), save the full result object to `ex_4_2`, and verify the exact p-value falls well below 0.05 even at this sample size.

**Expected result:**

```
#> 	Fisher's Exact Test for Count Data
#>
#> data:  pilot_tab
#> p-value = 0.04762
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>   1.024092      Inf
#> sample estimates:
#> odds ratio
#>        Inf
```

**Difficulty:** Intermediate

[HINTS]
When cells are too sparse for the chi-square approximation, switch to a test that computes the probability exactly.
Call `fisher.test()` on `pilot_tab`.

```r title="Your turn"
pilot_tab <- matrix(c(5, 0, 1, 4), nrow = 2,
                    dimnames = list(arm     = c("treat", "ctrl"),
                                    outcome = c("cure", "fail")))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pilot_tab <- matrix(c(5, 0, 1, 4), nrow = 2,
                    dimnames = list(arm     = c("treat", "ctrl"),
                                    outcome = c("cure", "fail")))
ex_4_2 <- fisher.test(pilot_tab)
ex_4_2
#> 	Fisher's Exact Test for Count Data
#>
#> data:  pilot_tab
#> p-value = 0.04762
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>   1.024092      Inf
#> sample estimates:
#> odds ratio
#>        Inf
```

**Explanation:** Fisher's exact computes the p-value from the hypergeometric distribution rather than relying on the chi-square approximation, so it works regardless of expected-cell counts. The odds ratio reported here is `Inf` because the table has a zero cell, making the conditional MLE infinite. Use `fisher.test()` whenever any expected count is below 5 or whenever a table has a zero margin and you still need a defensible p-value.

</details>

### Exercise 4.3: Compute a Monte Carlo p-value for the sparse cyl by gear table

**Task:** A simulation enthusiast wants a Monte Carlo p-value for the `mtcars$cyl` by `mtcars$gear` table because so many expected cells sit below 5. Set the seed to 42, run `chisq.test()` with `simulate.p.value = TRUE` and `B = 10000`, and save the full result object to `ex_4_3` so the simulated p-value can be compared with the asymptotic one.

**Expected result:**

```
#> 	Pearson's Chi-squared test with simulated p-value (based on 10000
#> 	replicates)
#>
#> data:  cyl_gear
#> X-squared = 18.036, df = NA, p-value = 0.000999
```

**Difficulty:** Advanced

[HINTS]
Instead of leaning on the reference distribution, resample many tables with the same margins to build the p-value empirically.
Call `chisq.test()` on `cyl_gear` with `simulate.p.value = TRUE` and `B = 10000`.

```r title="Your turn"
cyl_gear <- table(mtcars$cyl, mtcars$gear)
set.seed(42)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl_gear <- table(mtcars$cyl, mtcars$gear)
set.seed(42)
ex_4_3 <- chisq.test(cyl_gear, simulate.p.value = TRUE, B = 10000)
ex_4_3
#> 	Pearson's Chi-squared test with simulated p-value (based on 10000
#> 	replicates)
#>
#> data:  cyl_gear
#> X-squared = 18.036, df = NA, p-value = 0.000999
```

**Explanation:** `simulate.p.value = TRUE` resamples B random tables with the same row and column margins and counts how often the simulated chi-square statistic equals or exceeds the observed one. With `B = 10000`, the smallest p-value reportable is `1 / (B + 1) = 0.0001`. The simulated approach avoids the chi-square approximation entirely, so the result is trustworthy even with the small expected counts found in exercise 3.3. The reported `df = NA` is intentional: a Monte Carlo test does not use the chi-square reference distribution.

</details>

### Exercise 4.4: Flag cells whose expected count violates the rule of 5

**Task:** An audit team wants a logical matrix flagging which cells of a 3x3 contingency table have expected counts under 5, the standard chi-square approximation threshold. Run `chisq.test()` on the inline matrix below (wrap with `suppressWarnings()`), compare `$expected < 5` element-by-element, and save the resulting 3x3 logical matrix to `ex_4_4`.

**Expected result:**

```
#>       [,1]  [,2]  [,3]
#> [1,]  TRUE FALSE  TRUE
#> [2,]  TRUE FALSE FALSE
#> [3,]  TRUE FALSE  TRUE
```

**Difficulty:** Intermediate

[HINTS]
Fit the test, then ask of every expected-count cell whether it clears the minimum-count threshold of 5.
Run `suppressWarnings(chisq.test(audit_tab))` and compare its `$expected` component with `< 5`.

```r title="Your turn"
audit_tab <- matrix(c(2, 5, 3, 8, 12, 6, 1, 4, 2), nrow = 3)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
audit_tab <- matrix(c(2, 5, 3, 8, 12, 6, 1, 4, 2), nrow = 3)
res_4_4   <- suppressWarnings(chisq.test(audit_tab))
ex_4_4    <- res_4_4$expected < 5
ex_4_4
#>       [,1]  [,2]  [,3]
#> [1,]  TRUE FALSE  TRUE
#> [2,]  TRUE FALSE FALSE
#> [3,]  TRUE FALSE  TRUE
```

**Explanation:** Five of the nine cells fall below the 5-count threshold (column 2 holds the only cells safely above), so the asymptotic p-value will be unreliable. A common heuristic is that the chi-square approximation needs at least 80% of expected counts of 5 or more; this table fails it. Pivot to Fisher's exact or Monte Carlo simulation, or collapse columns 1 and 3 if they're semantically combinable.

</details>

## Section 5. Real-world workflows (4 problems)

### Exercise 5.1: Build a contingency table from raw row-level survey data

**Task:** A marketing analyst has 30 customer records stored as a tibble with `region` (one of "N", "S", "E", "W") and `purchase` ("yes" or "no") columns and needs a two-way frequency table before running chi-square. Use `table()` on the two columns of the `survey` tibble built below and save the resulting 4x2 table to `ex_5_1` exactly as `table()` produces it.

**Expected result:**

```
#>       purchase
#> region no yes
#>      E  3   4
#>      N  5   3
#>      S  2   6
#>      W  4   3
```

**Difficulty:** Beginner

[HINTS]
Long-format rows must be cross-tabulated into a two-way frequency layout before any test can run.
Use `table()` on the `survey$region` and `survey$purchase` columns.

```r title="Your turn"
survey <- tibble(
  region   = rep(c("N", "S", "E", "W"), times = c(8, 8, 7, 7)),
  purchase = c("yes","no","yes","no","yes","no","no","no",
               "yes","yes","no","yes","yes","no","yes","yes",
               "yes","no","yes","yes","no","no","no",
               "no","yes","no","no","yes","yes","no")
)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
survey <- tibble(
  region   = rep(c("N", "S", "E", "W"), times = c(8, 8, 7, 7)),
  purchase = c("yes","no","yes","no","yes","no","no","no",
               "yes","yes","no","yes","yes","no","yes","yes",
               "yes","no","yes","yes","no","no","no",
               "no","yes","no","no","yes","yes","no")
)
ex_5_1 <- table(survey$region, survey$purchase,
                dnn = c("region", "purchase"))
ex_5_1
#>       purchase
#> region no yes
#>      E  3   4
#>      N  5   3
#>      S  2   6
#>      W  4   3
```

**Explanation:** `table()` is the standard bridge between long-format data and the wide contingency-table layout that `chisq.test()` expects. Passing `dnn = c(...)` names the rows and columns of the resulting table so downstream printing and residual inspection stay self-documenting. If you prefer named arguments, `table(region = survey$region, purchase = survey$purchase)` works the same way. Always inspect the table before testing to catch typos in factor levels or unexpected `NA` rows.

</details>

### Exercise 5.2: Run a homogeneity test across four regions

**Task:** A growth team wants to know whether purchase rates differ across four regions, a homogeneity question (different groups, same outcome distribution) that uses the same `chisq.test()` call as independence. Given the 4x2 matrix below where rows are regions and columns are yes/no counts, run `chisq.test()` and save the full result to `ex_5_2`.

**Expected result:**

```
#> 	Pearson's Chi-squared test
#>
#> data:  region_tab
#> X-squared = 18.18, df = 3, p-value = 0.0004022
```

**Difficulty:** Intermediate

[HINTS]
A homogeneity question uses the very same machinery as an independence test, so the table goes straight in.
Pass `region_tab` to `chisq.test()` with no extra arguments.

```r title="Your turn"
region_tab <- matrix(c(50, 30, 60, 45, 50, 70, 40, 55), nrow = 4,
                     dimnames = list(region   = c("N", "S", "E", "W"),
                                     purchase = c("yes", "no")))
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
region_tab <- matrix(c(50, 30, 60, 45, 50, 70, 40, 55), nrow = 4,
                     dimnames = list(region   = c("N", "S", "E", "W"),
                                     purchase = c("yes", "no")))
ex_5_2 <- chisq.test(region_tab)
ex_5_2
#> 	Pearson's Chi-squared test
#>
#> data:  region_tab
#> X-squared = 18.18, df = 3, p-value = 0.0004022
```

**Explanation:** Independence and homogeneity differ in their sampling story: independence assumes one sample classified two ways, while homogeneity assumes one sample per group with the outcome distribution compared across groups. The arithmetic is identical, which is why R uses one function for both. With p = 0.0004 the regions do not share the same yes/no split; exercise 5.3 finds which pairs drive the result.

</details>

### Exercise 5.3: Bonferroni-adjust pairwise 2x2 chi-square p-values

**Task:** A consultant wants pairwise 2x2 chi-square tests between every pair of the four regions in `region_tab` to localize where purchase rates differ, then Bonferroni-adjust the 6 raw p-values to control the family-wise error rate. Use `combn(rownames(region_tab), 2)` to enumerate pairs, run `chisq.test()` on each 2x2 sub-table, run `p.adjust(..., method = "bonferroni")`, and save the named vector to `ex_5_3`.

**Expected result:**

```
#>      N_vs_S       N_vs_E       N_vs_W       S_vs_E       S_vs_W       E_vs_W
#> 0.0027075050 1.0000000000 0.0941748210 0.0011533230 0.4923404964 0.6121013380
```

**Difficulty:** Advanced

[HINTS]
Localize the difference by testing every region pair, then shrink each result to account for running many tests at once.
Enumerate pairs with `combn()`, test each two-by-two slice with `chisq.test()`, and feed the raw p-values to `p.adjust(method = "bonferroni")`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pairs <- combn(rownames(region_tab), 2)
raw_p <- apply(pairs, 2, function(p) {
  sub_tab <- region_tab[p, ]
  suppressWarnings(chisq.test(sub_tab, correct = FALSE)$p.value)
})
names(raw_p) <- apply(pairs, 2, paste, collapse = "_vs_")
ex_5_3 <- p.adjust(raw_p, method = "bonferroni")
ex_5_3
#>      N_vs_S       N_vs_E       N_vs_W       S_vs_E       S_vs_W       E_vs_W
#> 0.0027075050 1.0000000000 0.0941748210 0.0011533230 0.4923404964 0.6121013380
```

**Explanation:** With 6 pairwise tests and a nominal alpha of 0.05, Bonferroni multiplies each raw p-value by 6 and caps the result at 1, so significance requires raw p below 0.0083. Only the N-vs-S and S-vs-E pairs survive: S is the outlier region with the highest purchase rate. Bonferroni is conservative; if many comparisons matter, consider `method = "BH"` to control the false-discovery rate instead.

</details>

### Exercise 5.4: Assemble a publication-ready one-line chi-square summary

**Task:** A journal submission needs a one-line summary of the Titanic Class by Survived test combining the chi-square statistic, degrees of freedom, p-value, and Cramer's V for `ex_2_2`. Build a single character string formatted as `"X^2(df) = stat, p < .001, V = v"` with two-decimal rounding using `sprintf()`, and save the string to `ex_5_4`.

**Expected result:**

```
#> [1] "X^2(3) = 190.40, p < .001, V = 0.29"
```

**Difficulty:** Advanced

[HINTS]
Assemble the statistic, its degrees of freedom, the p-value, and the effect size into one formatted reporting line.
Use `sprintf("X^2(%d) = %.2f, p < .001, V = %.2f", df, stat, V)`, reading the values from `ex_2_2`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stat <- unname(ex_2_2$statistic)
df_  <- unname(ex_2_2$parameter)
n    <- sum(ex_2_2$observed)
V    <- sqrt(stat / (n * (min(4, 2) - 1)))
ex_5_4 <- sprintf("X^2(%d) = %.2f, p < .001, V = %.2f", df_, stat, V)
ex_5_4
#> [1] "X^2(3) = 190.40, p < .001, V = 0.29"
```

**Explanation:** `sprintf()` produces APA-style reporting with stable formatting that survives copy-paste into a manuscript. Hard-coding `p < .001` is acceptable because R prints `< 2.2e-16` for very small p-values: keep the literal threshold whenever the actual p drops below 0.001. Wrap this block in a function `report_chisq()` if you compute many such summaries; pair it with `report_chisq_inline()` that returns LaTeX-style `$X^2$` for R Markdown reports.

</details>

## What to do next

- Compare two means instead of categorical splits in [T-Test Exercises in R](T-Test-Exercises-in-R.html).
- Test more than two group means with [ANOVA Exercises in R](ANOVA-Exercises-in-R.html).
- Measure association between numeric variables in [Correlation Exercises in R](Correlation-Exercises-in-R.html).
- Drill the broader testing toolkit in [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html).

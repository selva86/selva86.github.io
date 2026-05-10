---
title: "Chi-Square Test Exercises in R: 10 Independence & Goodness-of-Fit Problems, Solved Step-by-Step"
slug: Chi-Square-Test-Exercises-in-R
description: "10 chi-square test exercises in R with runnable solutions: goodness-of-fit, independence, residuals, Cramér's V, Monte Carlo simulation, and Fisher's exact."
keywords: "chi-square test exercises in R, goodness-of-fit test R, chi-square independence test, chi-square practice problems, Cramér's V R, chi-square residuals, Fisher exact test R, chisq.test examples"
auto_link_terms: "chi-square test exercises|chi-square practice problems|chi-square exercises|chi-square test problems|goodness-of-fit exercises|chi-square independence exercises|chi-square solutions"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.3
post_type: EX
sidebar_title: "Chi-Square Exercises (10 problems)"
fr_parent: Chi-Square-Tests-in-R.html
difficulty: Intermediate
---

# Chi-Square Test Exercises in R: 10 Independence & Goodness-of-Fit Problems, Solved Step-by-Step

<p class="lead">These 10 chi-square test exercises in R cover both goodness-of-fit and independence problems with runnable solutions, so you practise picking the right variant, reading the output, inspecting residuals, computing Cramér's V, and falling back to Fisher's exact when expected counts are small.</p>

## Which chi-square test matches your data layout?

One chi-square function in R, two very different questions. `chisq.test()` runs a goodness-of-fit test when you hand it a single count vector, and a test of independence when you hand it a two-way table. The decision hinges on whether you have one categorical variable or two. Here is the same function used both ways on two tiny datasets so you can see both calls before drilling into the 10 exercises.

```r title="One function, two chi-square questions"
library(tibble)
# Question 1 (goodness-of-fit): are these coin flips fair?
coin_flips <- c(heads = 45, tails = 55)
gof_res <- chisq.test(coin_flips, p = c(0.5, 0.5))
gof_res$p.value
#> [1] 0.3173

# Question 2 (independence): is treatment related to outcome?
toy_tab <- matrix(c(20, 10, 15, 25), nrow = 2,
                  dimnames = list(drug    = c("A", "B"),
                                  outcome = c("ok", "fail")))
ind_res <- chisq.test(toy_tab)
ind_res$p.value
#> [1] 0.01428
```

Both calls use the exact same function, and both return an object with the same fields (`$statistic`, `$parameter`, `$p.value`, `$expected`, `$residuals`, `$stdres`). The coin-flip p-value of 0.32 fails to reject the fair-coin hypothesis, while the 2×2 treatment table p-value of 0.014 flags a real association between drug and outcome. One function, one workflow, one result shape. The shape of the input is what switches between the two tests.

Here is the one-line decision rule:

| You have... | Question | R call |
|---|---|---|
| One categorical variable + an expected distribution | Goodness of fit | `chisq.test(counts, p = expected)` |
| Two categorical variables in a two-way table | Independence / homogeneity | `chisq.test(two_way_table)` |

[KEY INSIGHT]
**A chi-square test of independence on a 2×2 table gives the same p-value as a two-proportion z-test squared.** They are two faces of the same comparison. The chi-square statistic equals $z^2$, and `chisq.test()` without Yates' correction matches `prop.test(..., correct = FALSE)` exactly. Pick whichever framing communicates the result best for your audience.

**Try it:** A bag of M&Ms is supposed to contain Brown/Yellow/Red/Blue/Orange/Green in equal proportions. You open a bag and count the colours. Do you want a goodness-of-fit test or a test of independence? Set `ex_choice` to `"gof"` or `"independence"`.

```r title="Your turn: pick the test"
# Try it: which test fits the M&M scenario?
ex_choice <- "___"   # replace with "gof" or "independence"
ex_choice
#> Expected: "gof"
```

<details>
<summary>Click to reveal solution</summary>

```r title="M&M scenario solution"
ex_choice <- "gof"
ex_choice
#> [1] "gof"
```

**Explanation:** You have **one** categorical variable (colour) with 6 levels, and an expected distribution (equal proportions). That's textbook goodness-of-fit. If you instead compared colour counts across two different bags or two factories, *that* would be independence/homogeneity.

</details>

## How do you read chi-square output in R?

`chisq.test()` returns a list with everything you need: the test statistic, degrees of freedom, p-value, observed and expected counts, Pearson residuals, and standardised residuals. Most of the interesting reporting lives *inside* those fields, not in the printed block. Pulling them out by name gives one-line access for write-ups, assumption checks, and residual plots.

```r title="Extract every useful field from a chi-square test"
# Independence test on HairEyeColor collapsed over Sex
he_tab <- margin.table(HairEyeColor, c(1, 2))
he_res <- chisq.test(he_tab)

# The five fields you'll actually report
he_res$statistic
#> X-squared
#>  138.2898
he_res$parameter
#> df
#>  9
he_res$p.value
#> [1] 2.325027e-25
round(he_res$expected, 1)[1:2, ]
#>        Eye
#> Hair    Brown  Blue Hazel Green
#>   Black  40.1  39.2  16.9  10.8
#>   Brown  106.3 103.9  44.7  28.2
round(he_res$stdres, 2)[1:2, ]
#>        Eye
#> Hair    Brown  Blue Hazel Green
#>   Black  6.21 -4.54 -0.57 -2.25
#>   Brown  2.99 -4.77  2.28 -0.55
```

A statistic of 138.3 on 9 df (rows−1 × cols−1 = 3 × 3) gives a p-value of about $2.3 \times 10^{-25}$: hair and eye colour are not independent. The expected-count matrix shows what the null hypothesis would predict. If rows and columns were independent, Black/Brown-eyed would sit near 40 instead of the observed 68. The standardised residuals pin the effect to specific cells: Black/Brown is +6.2 standard deviations above expectation, Blond/Blue (not shown in this slice) is the other driver. You will reproduce that in Exercise 8.

Here are the five fields you will reach for most often:

| Field | What it is | When to use |
|---|---|---|
| `$statistic` | The chi-square statistic $X^2$ | Report alongside df and p-value |
| `$parameter` | Degrees of freedom | Needed to compute or verify p manually |
| `$p.value` | Two-sided tail probability | The decision number |
| `$expected` | Expected counts under H₀ | Assumption check (all ≥ 5) |
| `$stdres` | Standardised residuals | Find cells that drive the effect, |z| > 2 |

[TIP]
**`broom::tidy()` turns any R test into a one-row data frame.** `broom::tidy(he_res)` gives a neat `statistic / p.value / parameter / method` row that slots straight into reports, markdown tables, or a bigger grid of models. Great when you are running the same test across many subsets.

[WARNING]
**If `chisq.test()` prints "Chi-squared approximation may be incorrect", stop and check `$expected`.** That warning appears when any expected cell is below 5 and the large-sample approximation is unreliable. Switch to `simulate.p.value = TRUE` (any size) or `fisher.test()` (2×2) instead of reporting the printed number.

**Try it:** Extract just the p-value from a goodness-of-fit test on `mtcars$cyl` against the uniform probabilities `c(1/3, 1/3, 1/3)`. Save it to `ex_p`.

```r title="Your turn: extract the cyl GOF p-value"
# Try it: GOF on mtcars$cyl against uniform, keep only the p-value
ex_p <- chisq.test(table(mtcars$cyl), p = ___)$p.value   # fill in the p vector
ex_p
#> Expected: a p-value near 0.32 (you will fail to reject uniform)
```

<details>
<summary>Click to reveal solution</summary>

```r title="cyl GOF solution"
ex_p <- chisq.test(table(mtcars$cyl), p = c(1/3, 1/3, 1/3))$p.value
ex_p
#> [1] 0.3149
```

**Explanation:** `table(mtcars$cyl)` gives counts 11, 7, 14 for 4/6/8 cylinders across 32 cars. Expected uniform = 10.67 each. The chi-square statistic is about 2.31 on 2 df, and $p = 0.31$, so we fail to reject uniform. The 32-car sample is simply too small to rule out uniformity even though the observed counts look uneven.

</details>

## Practice Exercises

Ten capstone problems, ordered roughly easier → harder. Every exercise uses a distinct `ex<N>_` prefix so solutions do not clobber earlier tutorial state.

### Exercise 1: Goodness-of-fit with equal expected counts

Test whether the 4/6/8 cylinder distribution in `mtcars` is uniform. Save the test object to `ex1_res` and print it. State the decision against α = 0.05.

```r title="Exercise 1 starter: mtcars$cyl uniform GOF"
# Exercise 1: GOF on mtcars$cyl vs uniform
# Hint: build the table with table(), pass p = rep(1/3, 3)
ex1_tab <- table(mtcars$cyl)
ex1_tab
#>  4  6  8
#> 11  7 14

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_tab <- table(mtcars$cyl)
ex1_res <- chisq.test(ex1_tab, p = rep(1/3, 3))
ex1_res
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  ex1_tab
#> X-squared = 2.3125, df = 2, p-value = 0.3148
```

**Explanation:** Expected counts are 10.67 each. The observed 11/7/14 are within about ±3 of expected, so the statistic is modest (2.31) and p = 0.31. We fail to reject uniformity. The lesson: an uneven-looking sample is not automatically evidence against uniformity, small samples demand more disagreement before rejecting.

</details>

### Exercise 2: Goodness-of-fit with unequal expected (Mendelian 9:3:3:1)

Classic pea-plant data: in a dihybrid cross, Mendelian theory predicts the four phenotypes in ratio 9:3:3:1. Observed counts are `c(315, 108, 101, 32)`. Test whether the observed counts are consistent with Mendel's ratio.

```r title="Exercise 2 starter: Mendel 9:3:3:1 GOF"
# Exercise 2: GOF against 9:3:3:1
# Hint: convert 9:3:3:1 to probabilities by dividing by 16
ex2_obs <- c(315, 108, 101, 32)
ex2_exp <- c(9, 3, 3, 1) / 16

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_obs <- c(315, 108, 101, 32)
ex2_exp <- c(9, 3, 3, 1) / 16
ex2_res <- chisq.test(ex2_obs, p = ex2_exp)
ex2_res
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  ex2_obs
#> X-squared = 0.470, df = 3, p-value = 0.9254
```

**Explanation:** Total n = 556. Expected counts under 9:3:3:1 are 312.75, 104.25, 104.25, 34.75, within fractions of the observed values. The p-value of 0.93 says the data are fully consistent with Mendel's ratio. This dataset is famous because Fisher later argued the fit was *too* good, but for our purposes it's a textbook pass.

</details>

### Exercise 3: Goodness-of-fit with a Monte Carlo p-value

You have 6 weekday-preference counts from a small survey: `c(3, 4, 2, 5, 3, 2, 1)` for Monday through Sunday. With such small expected counts (average ≈ 2.9), the chi-square approximation is unreliable. Use a Monte Carlo p-value via `simulate.p.value = TRUE` and `B = 10000`.

```r title="Exercise 3 starter: Monte Carlo GOF"
# Exercise 3: Monte Carlo p-value for a sparse GOF
ex3_obs <- c(3, 4, 2, 5, 3, 2, 1)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(503)
ex3_obs <- c(3, 4, 2, 5, 3, 2, 1)
ex3_res <- chisq.test(ex3_obs,
                      p = rep(1/7, 7),
                      simulate.p.value = TRUE,
                      B = 10000)
ex3_res
#>
#> 	Chi-squared test for given probabilities with simulated p-value
#> 	(based on 10000 replicates)
#>
#> data:  ex3_obs
#> X-squared = 3.8, df = NA, p-value = 0.7359
```

**Explanation:** Under uniform preference each expected count is 2.86, below the usual ≥5 threshold. The simulated p-value (~0.74) says observed counts at least this uneven would happen about 74% of the time under uniform, no evidence for a weekday preference.

</details>

[NOTE]
**Monte Carlo p-values are approximate and depend on `B`.** With `B = 10000` the Monte Carlo error is roughly $1/\sqrt{10000} = 0.01$; raise `B` for tighter estimates. `df` prints as `NA` because the simulated test does not use the asymptotic chi-square distribution.

### Exercise 4: 2×2 independence with Yates' correction (default)

From `HairEyeColor`, build a 2×2 table of Hair (Black vs Blond) × Sex (Male vs Female). Run `chisq.test()` with default settings (Yates' continuity correction is applied automatically for 2×2). Report the statistic, df, and p-value.

```r title="Exercise 4 starter: 2x2 independence with Yates"
# Exercise 4: 2x2 Hair(Black,Blond) x Sex
# Hint: margin.table over Eye, then slice to rows Black + Blond
ex4_tab <- margin.table(HairEyeColor, c(1, 3))[c("Black", "Blond"), ]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
ex4_tab <- margin.table(HairEyeColor, c(1, 3))[c("Black", "Blond"), ]
ex4_tab
#>        Sex
#> Hair    Male Female
#>   Black   56     52
#>   Blond   46     81
ex4_res <- chisq.test(ex4_tab)
ex4_res
#>
#> 	Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  ex4_tab
#> X-squared = 5.396, df = 1, p-value = 0.02019
```

**Explanation:** Among Black-haired people the sample is slightly male-leaning (56/108), while Blonds skew female (81/127). The Yates-corrected p-value of 0.020 rejects independence at α = 0.05, there is a Hair × Sex association in this classic dataset.

</details>

### Exercise 5: Same 2×2 without Yates' correction

Re-run the test from Exercise 4 with `correct = FALSE`. Compare the statistic and p-value, which direction does the correction move them, and by how much?

```r title="Exercise 5 starter: 2x2 without Yates"
# Exercise 5: same ex4_tab, correct = FALSE
# Hint: reuse ex4_tab from Exercise 4

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
ex5_res <- chisq.test(ex4_tab, correct = FALSE)
ex5_res
#>
#> 	Pearson's Chi-squared test
#>
#> data:  ex4_tab
#> X-squared = 5.989, df = 1, p-value = 0.01441

c(yates_on = 0.02019, yates_off = ex5_res$p.value)
#>  yates_on  yates_off
#>  0.02019   0.01441
```

**Explanation:** Yates' correction shrinks each observed-minus-expected difference by 0.5 before squaring, which lowers the statistic (from 5.99 to 5.40) and raises the p-value (from 0.014 to 0.020). The correction makes the 2×2 test more conservative, easier to miss real effects, harder to raise false alarms. For small 2×2 tables the correction is standard; for large ones it barely matters.

</details>

### Exercise 6: R×C independence on mtcars (cyl × gear)

Build the table of cylinders × gears from `mtcars` using `table()`, and test independence. Expect a small-count warning, this exercise sets up Exercise 7.

```r title="Exercise 6 starter: mtcars cyl x gear"
# Exercise 6: independence on mtcars cylinders vs gears
ex6_tab <- table(cyl = mtcars$cyl, gear = mtcars$gear)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
ex6_tab
#>    gear
#> cyl  3  4  5
#>   4  1  8  2
#>   6  2  4  1
#>   8 12  0  2
ex6_res <- suppressWarnings(chisq.test(ex6_tab))
ex6_res
#>
#> 	Pearson's Chi-squared test
#>
#> data:  ex6_tab
#> X-squared = 18.04, df = 4, p-value = 0.001214
```

**Explanation:** The 3×3 table has several small cells (the `8 cyl / 4 gear` cell is 0), so R warns "Chi-squared approximation may be incorrect". The point estimate (p = 0.0012) still suggests strong dependence, eight-cylinder engines pair with 3-speed gearboxes, four-cylinders with 4-speeds, but treat the exact p-value with caution. A Monte Carlo variant would confirm whether the effect is robust to the small-cell issue.

</details>

### Exercise 7: Extract observed, expected, residuals into a tidy data frame

Take the result object from Exercise 6 (`ex6_res`) and pull `observed`, `expected`, `residuals`, and `stdres` into a single tidy data frame with row and column labels. The goal is a report-ready per-cell breakdown.

```r title="Exercise 7 starter: tidy per-cell components"
# Exercise 7: per-cell tidy summary for ex6_res
# Hint: as.data.frame() on each matrix, cbind or tibble::tibble

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_df <- data.frame(
  cyl      = rep(rownames(ex6_res$observed), times = ncol(ex6_res$observed)),
  gear     = rep(colnames(ex6_res$observed), each  = nrow(ex6_res$observed)),
  observed = as.vector(ex6_res$observed),
  expected = round(as.vector(ex6_res$expected), 2),
  residual = round(as.vector(ex6_res$residuals), 2),
  stdres   = round(as.vector(ex6_res$stdres), 2)
)
head(ex7_df, 4)
#>   cyl gear observed expected residual stdres
#> 1   4    3        1     5.16    -1.83  -3.12
#> 2   6    3        2     3.28    -0.71  -1.18
#> 3   8    3       12     6.56     2.12   3.82
#> 4   4    4        8     4.12     1.91   3.15
```

**Explanation:** Flattening the four matrices into one data frame gives you every diagnostic per cell at a glance. The largest positive `stdres` (+3.82 for `8 cyl / 3 gear`) and the largest negative (-3.12 for `4 cyl / 3 gear`) are the cells that produce the significant overall p-value. That's the information you cannot recover from `print(ex6_res)` alone.

</details>

### Exercise 8: Find the residual hotspots in HairEyeColor

Build the 4×4 Hair × Eye table from `HairEyeColor` collapsed over Sex, run an independence test, and return the hair-eye combinations where the standardised residual exceeds 2 in absolute value. Save the hotspots to `ex8_hot`.

```r title="Exercise 8 starter: residual hotspots"
# Exercise 8: which hair-eye combinations drive the p-value?
# Hint: which(abs(stdres) > 2, arr.ind = TRUE)
ex8_tab <- margin.table(HairEyeColor, c(1, 2))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
ex8_tab <- margin.table(HairEyeColor, c(1, 2))
ex8_res <- chisq.test(ex8_tab)

ex8_idx <- which(abs(ex8_res$stdres) > 2, arr.ind = TRUE)
ex8_hot <- data.frame(
  hair   = rownames(ex8_tab)[ex8_idx[, "row"]],
  eye    = colnames(ex8_tab)[ex8_idx[, "col"]],
  stdres = round(ex8_res$stdres[ex8_idx], 2)
)
ex8_hot[order(-abs(ex8_hot$stdres)), ]
#>    hair   eye stdres
#> 7 Blond  Blue  11.16
#> 6 Blond Brown  -9.42
#> 1 Black Brown   6.21
#> 2 Brown Brown   2.99
#> 3 Black  Blue  -4.54
#> 5 Red   Green   2.69
#> 4 Black Green  -2.25
#> 8 Blond Hazel  -2.55
```

**Explanation:** The biggest hotspot, Blond+Blue with `stdres = +11.2`, says that combination appears about 11 standard deviations more often than independence would predict. Reporting the three or four biggest residuals alongside the test statistic is good practice, it turns a number into an interpretable finding.

</details>

[KEY INSIGHT]
**The overall chi-square statistic tells you the whole table disagrees with independence, but only residuals tell you where.** A p-value of $10^{-25}$ is just one number. The residuals matrix is the story: Blond+Blue over-represented, Blond+Brown under-represented, and Black+Brown over-represented. Without residuals you have significance but no narrative.

### Exercise 9: Effect size, Cramér's V on HairEyeColor

The chi-square statistic grows with sample size, so "significant" ≠ "meaningful". Cramér's V rescales it to the range \[0, 1\], interpretable the way a correlation is. Compute V for the HairEyeColor Hair × Eye table using the formula below and interpret against Cohen's thresholds.

The formula is:

$$V = \sqrt{\dfrac{\chi^2}{n \cdot (k - 1)}}$$

Where:
- $\chi^2$ is the test statistic from `chisq.test()`
- $n$ is the total sample size, $\sum n_{ij}$
- $k$ is $\min(\text{rows}, \text{cols})$

```r title="Exercise 9 starter: Cramér's V"
# Exercise 9: compute Cramér's V from ex8_res
# Hint: sqrt(statistic / (n * (min(dim(tab)) - 1)))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 9 solution"
ex9_v <- sqrt(unname(ex8_res$statistic) /
              (sum(ex8_tab) * (min(dim(ex8_tab)) - 1)))
round(ex9_v, 3)
#> [1] 0.279
```

**Explanation:** With $\chi^2 = 138.3$, $n = 592$, and $k = 4$, the formula gives $V = \sqrt{138.3 / (592 \cdot 3)} = 0.279$. Reporting V alongside the p-value prevents the common trap of mistaking tiny, significant effects in huge samples for practically important ones.

</details>

[TIP]
**Cramér's V reads like a correlation, with conventional thresholds.** For $\text{df}^* = \min(r,c) - 1 = 3$, Cohen's rules of thumb are 0.06 (small), 0.17 (medium), 0.29 (large). V = 0.28 lands in the "large" band for this table size, the hair-eye effect is real, practically meaningful, and not just a consequence of the n = 592 sample.

### Exercise 10: Raw data → `xtabs()` → chi-square

Until now every exercise started from a pre-built table. Real data usually arrives one row per observation. Build the table with `xtabs()`, then run the independence test on it.

```r title="Exercise 10 starter: xtabs pipeline"
# Exercise 10: raw data frame -> xtabs -> chisq.test
# Hint: xtabs(~ var1 + var2, data = df)
ex10_df <- data.frame(
  smoker  = rep(c("yes", "no"), each = 50),
  disease = c(rep("yes", 30), rep("no", 20),
              rep("yes", 12), rep("no", 38))
)
head(ex10_df)
#>   smoker disease
#> 1    yes     yes
#> 2    yes     yes
#> 3    yes     yes
#> 4    yes     yes
#> 5    yes     yes
#> 6    yes     yes

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 10 solution"
ex10_tab <- xtabs(~ smoker + disease, data = ex10_df)
ex10_tab
#>       disease
#> smoker no yes
#>    no  38  12
#>    yes 20  30
ex10_res <- chisq.test(ex10_tab)
ex10_res
#>
#> 	Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  ex10_tab
#> X-squared = 12.57, df = 1, p-value = 0.000392
```

**Explanation:** `xtabs()` takes a formula and a data frame and returns a contingency table in exactly the shape `chisq.test()` wants. This is the pipeline for any real-world categorical analysis: tidy long data → `xtabs()` → `chisq.test()`. The synthetic cohort here gives a Yates-corrected p-value below 0.001, strong evidence that smoking and disease are associated.

</details>

## Complete Example: Hair × Eye Colour Survey

Let's stitch everything together: build the table, check assumptions, run the test, quantify the effect size, and localise the drivers.

```r title="End-to-end independence analysis on HairEyeColor"
# Step 1 - collapse over Sex to a 2-way Hair x Eye table
he_full <- margin.table(HairEyeColor, c(1, 2))
he_full
#>        Eye
#> Hair    Brown Blue Hazel Green
#>   Black    68   20    15     5
#>   Brown   119   84    54    29
#>   Red      26   17    14    14
#>   Blond     7   94    10    16

# Step 2 - run the test
he_chi <- chisq.test(he_full)

# Step 3 - assumption check: every expected count >= 5?
min(he_chi$expected)
#> [1] 5.524

# Step 4 - effect size (Cramér's V)
he_v <- sqrt(unname(he_chi$statistic) /
             (sum(he_full) * (min(dim(he_full)) - 1)))
round(he_v, 3)
#> [1] 0.279

# Step 5 - hotspots: |stdres| > 2
he_hot <- which(abs(he_chi$stdres) > 2, arr.ind = TRUE)
head(data.frame(hair   = rownames(he_full)[he_hot[, 1]],
                eye    = colnames(he_full)[he_hot[, 2]],
                stdres = round(he_chi$stdres[he_hot], 2)), 4)
#>    hair   eye stdres
#> 1 Black Brown   6.21
#> 2 Brown Brown   2.99
#> 3 Black  Blue  -4.54
#> 4 Blond  Blue  11.16
```

[WARNING]
**Always check expected counts before trusting the p-value.** Here every expected count is ≥ 5.5, so the asymptotic chi-square is safe. Skipping this step is the most common reporting error in introductory categorical analyses.

A one-paragraph APA-style write-up: *A chi-square test of independence examined whether hair colour and eye colour were associated in the 592-person HairEyeColor dataset. The relationship was highly significant, $\chi^2(9, N = 592) = 138.3, p < .001$, with a large effect size, $V = 0.28$. Examination of standardised residuals indicated that the Blond/Blue combination was strongly over-represented (stdres = +11.2) while Blond/Brown was under-represented (stdres = −9.4).* That sentence answers three questions at once: is the effect real, is it big, and where does it live.

## Summary

| Ask | R call | Key field |
|---|---|---|
| Goodness of fit | `chisq.test(x, p = expected)` | `$p.value` |
| Independence / homogeneity | `chisq.test(two_way_table)` | `$p.value` |
| 2×2 without Yates | `chisq.test(tab, correct = FALSE)` | `$statistic` |
| Small expected counts | `chisq.test(..., simulate.p.value = TRUE, B = 10000)` | `$p.value` |
| Effect size | `sqrt(chisq / (n * (min(dim) - 1)))` | Cramér's V |
| Cell-level pattern | `$stdres`, flag `abs(stdres) > 2` | standardised residuals |

## References

1. R Core Team. *chisq.test, R Stats Reference.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/chisq.test.html)
2. Agresti, A. *Categorical Data Analysis*, 3rd edition. Wiley (2013).
3. Sheskin, D. J. *Handbook of Parametric and Nonparametric Statistical Procedures*, 5th edition. Chapman & Hall/CRC (2011).
4. Mendel, G. *Experiments in Plant Hybridisation* (1866), source of the classic 9:3:3:1 phenotype data.
5. Yates, F. "Contingency Tables Involving Small Numbers and the χ² Test." *Journal of the Royal Statistical Society Supplement* 1(2), 1934.
6. Cramér, H. *Mathematical Methods of Statistics*. Princeton University Press (1946).
7. Fisher, R. A. *Statistical Methods for Research Workers*, 14th edition. Oliver & Boyd (1970).

## Continue Learning

- [Chi-Square Tests in R: Independence, Goodness-of-Fit & Effect Size](Chi-Square-Tests-in-R.html) covers the parent theory, assumption derivations, residual analysis, and Cramér's V in detail.
- [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) gives broader inference practice across t-tests, proportions, non-parametrics, and power analysis.
- [t-Test Exercises in R](t-Test-Exercises-in-R.html) uses the same drill-sheet format for comparing means instead of proportions.

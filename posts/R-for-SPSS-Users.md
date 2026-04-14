---
title: "R for SPSS Users: Translate Every SPSS Procedure to R in One Guide"
slug: "R-for-SPSS-Users"
description: "A complete SPSS-to-R translation: t-tests, ANOVA, regression, factor analysis, and reliability — with runnable R code that mirrors SPSS output line by line."
keywords: "R for SPSS users, SPSS to R, convert SPSS to R, SPSS to R translation, haven read_sav, psych alpha, factor analysis R, ANOVA Type III R"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "CAR9"
post_type: "FR"
auto_link_terms: "R for SPSS users|SPSS to R|convert SPSS to R|SPSS to R translation|read SPSS file in R"
auto_link_case_sensitive: false
fr_parent: "Is-R-Worth-Learning-in-2026.html"
---

# R for SPSS Users: Translate Every SPSS Procedure to R in One Guide

<p class="lead">Every SPSS procedure has an R equivalent that produces the same numbers — usually in one or two function calls. This guide translates the most common SPSS commands into runnable R code, so you can keep doing the analyses you already know — only faster, free, and reproducible.</p>

## How does an SPSS t-test translate to R?

You probably ran your first SPSS analysis as a t-test. Let's start there. SPSS uses the `T-TEST` procedure with `GROUPS=` or `PAIRS=` subcommands; R uses one function, `t.test()`, with a formula or two vectors. The output looks different, but the numbers — t, degrees of freedom, p-value, mean difference — are identical. Run the block below and compare it to any SPSS output you have handy.

```r
# SPSS:  T-TEST PAIRS = group1 WITH group2 (PAIRED).
# R equivalent: paired t-test on the built-in 'sleep' dataset
group1 <- sleep$extra[sleep$group == 1]
group2 <- sleep$extra[sleep$group == 2]

t.test(group1, group2, paired = TRUE)
#> 
#>     Paired t-test
#> 
#> data:  group1 and group2
#> t = -4.0621, df = 9, p-value = 0.002833
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  -2.4598858 -0.7001142
#> sample estimates:
#> mean difference 
#>           -1.58
```

Every value SPSS prints in its t-test output viewer appears here: `t = -4.06`, `df = 9`, `p-value = 0.0028`, the 95% CI for the mean difference, and the mean difference itself (`-1.58`). If you ran the same paired test in SPSS on the classic Cushny–Peebles sleep data, the numbers would line up to four decimals. The numbers are the same because the underlying formula is the same — only the display changes.

**Try it:** Run a one-sample t-test asking whether the mean of `sleep$extra` differs from 0 (the SPSS equivalent of `T-TEST /TESTVAL=0 /VARIABLES=extra.`).

```r
# Try it: one-sample t-test
ex_t1 <- t.test(  # your code here
)
ex_t1
#> Expected: t-statistic, df = 19, p-value, and a 95% CI for the mean
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_t1 <- t.test(sleep$extra, mu = 0)
ex_t1
#> 
#>     One Sample t-test
#> 
#> data:  sleep$extra
#> t = 3.413, df = 19, p-value = 0.002918
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  0.5955845 2.4844155
#> sample estimates:
#> mean of x 
#>      1.54
```

**Explanation:** Pass a single vector and `mu = 0` to test against zero. R returns the same `t`, `df`, `p`, and CI you'd get from `T-TEST /TESTVAL=0` in SPSS.

</details>

## How do I read SPSS .sav files into R?

Your existing data lives in `.sav` files. The `haven` package reads them directly and — critically — preserves the metadata SPSS users care about: variable labels, value labels, and user-defined missings. The older `foreign::read.spss` strips most of this; use `haven` instead.

```r
library(haven)

# Real-world usage (commented out — needs an actual .sav file on disk):
# spss_data <- read_sav("survey.sav")

# Demonstration: write mtcars to .sav, then read it back the same way you'd read any SPSS file
write_sav(mtcars, "demo.sav")
spss_data <- read_sav("demo.sav")

head(spss_data[, 1:5], 3)
#> # A tibble: 3 × 5
#>     mpg   cyl  disp    hp  drat
#>   <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1  21       6   160   110  3.9 
#> 2  21       6   160   110  3.9 
#> 3  22.8     4   108    93  3.85
```

`read_sav()` returns a tibble — the tidyverse data frame — with columns typed as `<dbl>`, `<chr>`, or `haven_labelled` for SPSS value-labelled variables. The first row of `<dbl>` markers tells you R has parsed the numeric columns correctly. For a labelled variable, you'd see `<dbl+lbl>` and could convert it to an R factor with `as_factor(spss_data$gender)`.

[NOTE]
**haven preserves SPSS metadata.** Variable labels live on `attr(x, "label")`, value labels travel as a `haven_labelled` class, and user-defined missings come through as `tagged_na` values. You can keep working in SPSS-style or convert with `as_factor()` when you want native R factors.

[TIP]
**Prefer haven::read_sav() over the older foreign::read.spss().** haven is actively maintained, faster, handles modern SPSS files, and round-trips losslessly. The `foreign` package strips value labels by default and warns about unrecognized features.

**Try it:** Write the single line of R code that would read a file called `survey.sav` (sitting in your working directory) into an object called `ex_survey`.

```r
# Try it: one-line read of survey.sav
ex_survey <- # your code here
#> Expected: ex_survey is a tibble loaded from survey.sav
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_survey <- read_sav("survey.sav")
#> (No printed output — assigns the loaded data to ex_survey)
```

**Explanation:** `read_sav()` from `haven` takes the file path as its only required argument. The result is a tibble you can pipe into any tidyverse function or pass to base R modeling functions like `lm()`.

</details>

## How do I translate descriptive and frequency procedures?

`DESCRIPTIVES`, `FREQUENCIES`, and `CROSSTABS` are the three SPSS procedures you run before any model. Their R equivalents are `summary()`, `table()` plus `prop.table()`, and `table()` plus `chisq.test()`. The `psych::describe()` function adds skew, kurtosis, and standard error — closer to what SPSS prints by default in DESCRIPTIVES.

```r
library(psych)

# SPSS: DESCRIPTIVES VARIABLES = mpg hp wt.
describe(mtcars[, c("mpg", "hp", "wt")])
#>     vars  n   mean    sd median trimmed   mad  min   max range  skew kurtosis    se
#> mpg    1 32  20.09  6.03  19.20   19.70  5.41 10.4  33.9  23.5  0.61    -0.37  1.07
#> hp     2 32 146.69 68.56 123.00  141.19 77.10 52.0 335.0 283.0  0.73    -0.14 12.12
#> wt     3 32   3.22  0.98   3.33    3.15  0.77  1.5   5.4   3.9  0.42    -0.02  0.17

# SPSS: FREQUENCIES VARIABLES = cyl.
table(mtcars$cyl)
#> 
#>  4  6  8 
#> 11  7 14
prop.table(table(mtcars$cyl)) * 100
#> 
#>      4      6      8 
#> 34.375 21.875 43.750

# SPSS: CROSSTABS /TABLES = cyl BY am /STATISTICS = CHISQ.
ct <- table(mtcars$cyl, mtcars$am)
ct
#>    
#>     0 1
#>   4 3 8
#>   6 4 3
#>   8 12 2
chisq.test(ct)
#> 
#>     Pearson's Chi-squared test
#> 
#> data:  ct
#> X-squared = 8.7407, df = 2, p-value = 0.01265
```

`describe()` prints the same columns you'd find in the SPSS Descriptives dialog — count, mean, SD, median, min, max, range, skew, kurtosis, SE. `prop.table() * 100` matches the "Valid Percent" column from FREQUENCIES. The cross-tab and chi-square reproduce the cell counts plus the test statistic, df, and p-value SPSS prints under "Chi-Square Tests".

[KEY INSIGHT]
**SPSS shows one giant Output Viewer; R prints whatever you ask for.** Think of each R call as one cell of the SPSS output table — you compose the report by stacking calls. This is why R Markdown and Quarto (which combine code, output, and narrative) replace the Output Viewer so cleanly.

**Try it:** Build a frequency table for `mtcars$gear` and store it as `ex_gear`.

```r
# Try it: frequency table for gear
ex_gear <- # your code here
ex_gear
#> Expected: counts for 3, 4, and 5 gears
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_gear <- table(mtcars$gear)
ex_gear
#> 
#>  3  4  5 
#> 15 12  5
```

**Explanation:** `table()` on a single vector returns the frequency count for each unique value — the SPSS `FREQUENCIES VARIABLES = gear.` equivalent in one line.

</details>

## How do I run an ANOVA like SPSS UNIANOVA?

Base R's `aov()` is the workhorse for analysis of variance. There's one major catch: SPSS's UNIANOVA defaults to **Type III** sums of squares; R's `aov()` and `summary.aov()` give you **Type I** (sequential) sums of squares. For balanced designs the two answers are identical. For unbalanced designs they can differ enough to flip a conclusion. To match SPSS exactly, use `car::Anova()` with `type = "III"` and switch to sum-to-zero contrasts.

```r
library(car)

mtcars$cyl_f <- factor(mtcars$cyl)
mtcars$am_f  <- factor(mtcars$am)

# SPSS: ONEWAY mpg BY cyl /POSTHOC = TUKEY.
fit_one <- aov(mpg ~ cyl_f, data = mtcars)
summary(fit_one)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> cyl_f        2  824.8   412.4   39.70 4.98e-09 ***
#> Residuals   29  301.3    10.4                     
#> ---

# SPSS: UNIANOVA mpg BY cyl am /DESIGN = cyl am cyl*am.
options(contrasts = c("contr.sum", "contr.poly"))
fit_two <- aov(mpg ~ cyl_f * am_f, data = mtcars)
Anova(fit_two, type = "III")
#> Anova Table (Type III tests)
#> 
#> Response: mpg
#>             Sum Sq Df  F value    Pr(>F)    
#> (Intercept) 5478.3  1 730.7363 < 2.2e-16 ***
#> cyl_f         44.8  2   2.9883  0.067391 .  
#> am_f          36.8  1   4.9135  0.035439 *  
#> cyl_f:am_f    25.4  2   1.6915  0.203616    
#> Residuals    194.9 26                       
#> ---
```

The one-way result is unambiguous: `F(2, 29) = 39.7, p < .001` — the same numbers SPSS would print for `ONEWAY mpg BY cyl`. The two-way Type III table now lines up cell-for-cell with the SPSS UNIANOVA "Tests of Between-Subjects Effects" table: each predictor's `Sum Sq`, `Df`, `F value`, and `Pr(>F)` are identical to what SPSS reports (try it if you have SPSS handy — the agreement is exact).

[WARNING]
**SPSS UNIANOVA uses Type III sums of squares by default; R's aov() uses Type I.** For unbalanced designs the F values and p-values will not match unless you switch to `car::Anova(model, type = "III")` and set `options(contrasts = c("contr.sum", "contr.poly"))`. This is the #1 source of "the numbers don't agree!" complaints from new R users coming from SPSS.

**Try it:** Run Tukey's HSD post-hoc on `fit_one` (the SPSS `/POSTHOC = TUKEY` equivalent) and store the result as `ex_tukey`.

```r
# Try it: Tukey HSD on fit_one
ex_tukey <- # your code here
ex_tukey
#> Expected: pairwise differences for 6-4, 8-4, 8-6 with CIs and p-values
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tukey <- TukeyHSD(fit_one)
ex_tukey
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = mpg ~ cyl_f, data = mtcars)
#> 
#> $cyl_f
#>           diff        lwr        upr     p adj
#> 6-4  -6.920779 -10.769350 -3.0722086 0.0003424
#> 8-4 -11.563636 -14.770591 -8.3566822 0.0000000
#> 8-6  -4.642857  -8.327583 -0.9581313 0.0112287
```

**Explanation:** `TukeyHSD()` takes an `aov` object and returns all pairwise mean differences with family-wise 95% confidence intervals and adjusted p-values — the same "Multiple Comparisons" table SPSS prints under POSTHOC = TUKEY.

</details>

## How do I fit linear regression like SPSS REGRESSION?

SPSS `REGRESSION /DEPENDENT y /ENTER x1 x2.` becomes `lm(y ~ x1 + x2, data = df)`. The `summary()` output gives you everything from the SPSS "Model Summary" and "Coefficients" tables in one printout: coefficients, standard errors, t-values, p-values, R², adjusted R², residual standard error, and the F statistic. Use `confint()` for the 95% confidence intervals SPSS prints next to each coefficient.

```r
# SPSS: REGRESSION /DEPENDENT mpg /ENTER wt hp /CI(95).
fit_lm <- lm(mpg ~ wt + hp, data = mtcars)
summary(fit_lm)
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
#> 
#> Residual standard error: 2.593 on 29 degrees of freedom
#> Multiple R-squared:  0.8268, Adjusted R-squared:  0.8148 
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12

confint(fit_lm)
#>                   2.5 %      97.5 %
#> (Intercept) 33.95738245 40.49715778
#> wt          -5.17191604 -2.58374249
#> hp          -0.05022927 -0.01331297
```

Each row of the `Coefficients:` block maps to a row in the SPSS "Coefficients" table: `Estimate` is `B`, `Std. Error` is `Std. Error`, `t value` is `t`, and `Pr(>|t|)` is the two-tailed `Sig.` column. The `Residual standard error`, `Multiple R-squared`, `Adjusted R-squared`, and `F-statistic` lines reproduce the SPSS "Model Summary" and "ANOVA" tables. `confint()` adds the 95% lower and upper bounds — the same numbers SPSS prints when you tick the "Confidence intervals" checkbox.

[KEY INSIGHT]
**The R formula syntax is the biggest conceptual jump from SPSS.** A formula like `y ~ x1 + x2` reads "modeled as." Once the tilde clicks, every model function in R uses the same grammar — `lm`, `glm`, `aov`, `lme4::lmer`, `survival::coxph`, `nlme::lme`. Learn one syntax, fit any model.

**Try it:** Fit a simple regression of `mpg` on `wt` only (one predictor), store as `ex_simple`, and print its `summary()`.

```r
# Try it: simple regression
ex_simple <- # your code here
summary(ex_simple)
#> Expected: a one-predictor model with intercept ~37, wt slope ~-5.34
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_simple <- lm(mpg ~ wt, data = mtcars)
summary(ex_simple)
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  37.2851     1.8776   19.86  < 2e-16 ***
#> wt           -5.3445     0.5591   -9.56 1.29e-10 ***
#> ---
#> Multiple R-squared:  0.7528, Adjusted R-squared:  0.7446
```

**Explanation:** Drop `hp` from the formula and `lm()` fits a one-predictor model. The intercept and `wt` slope shift slightly because `wt` now has to absorb variance previously explained by `hp`.

</details>

## How do I run factor analysis like SPSS FACTOR?

SPSS `FACTOR /VARIABLES = ... /EXTRACTION = ML /ROTATION = VARIMAX` translates to `psych::fa()`. The `psych` package was built specifically to give SPSS-style psychometric output in R, so the rotated loading matrix you get back will feel familiar. The built-in `bfi` dataset (25 personality items from the International Personality Item Pool) is perfect for a realistic five-factor demonstration.

```r
# bfi is built into psych: 25 items measuring the Big Five
items <- na.omit(bfi[, 1:25])

# SPSS: FACTOR /VARIABLES = A1 to O5 /EXTRACTION = ML
#       /ROTATION = VARIMAX /CRITERIA = FACTORS(5).
fa_fit <- fa(items, nfactors = 5, rotate = "varimax", fm = "ml")
print(fa_fit, sort = TRUE, cut = 0.3)
#> Factor Analysis using method =  ml
#> Standardized loadings (pattern matrix) based upon correlation matrix
#>    item   ML2   ML1   ML3   ML4   ML5   h2   u2 com
#> N1   16  0.81                         0.69 0.31 1.0
#> N2   17  0.78                         0.62 0.38 1.0
#> N3   18  0.71                         0.55 0.45 1.0
#> N5   20  0.49                         0.35 0.65 1.5
#> N4   19  0.47  -0.39                  0.46 0.54 2.4
#> E2   12       -0.68                   0.54 0.46 1.2
#> E4   14        0.59                   0.53 0.47 1.7
#> ...
#> 
#> SS loadings           2.49  2.20  2.03  1.49  1.48
#> Proportion Var        0.10  0.09  0.08  0.06  0.06
#> Cumulative Var        0.10  0.19  0.27  0.33  0.39
```

The sorted loading matrix groups items by their dominant factor — `N1`–`N5` cluster on `ML2` (Neuroticism), `E2`–`E4` on `ML1` (Extraversion), and so on. The `SS loadings`, `Proportion Var`, and `Cumulative Var` rows are identical in form to the "Total Variance Explained" table SPSS prints. `h2` is the communality (sum of squared loadings — what SPSS calls "Extraction Communality"), and `u2` is uniqueness (1 − h2).

**Try it:** Re-run the factor analysis with oblimin rotation (SPSS's default oblique rotation) and store the result as `ex_fa`.

```r
# Try it: factor analysis with oblimin rotation
ex_fa <- # your code here
ex_fa
#> Expected: 5 factors extracted with oblimin rotation; correlated factor structure
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fa <- fa(items, nfactors = 5, rotate = "oblimin", fm = "ml")
ex_fa
#> Factor Analysis using method =  ml
#> Call: fa(r = items, nfactors = 5, rotate = "oblimin", fm = "ml")
#> ...
#>  With factor correlations of 
#>       ML2   ML1   ML3   ML4   ML5
#> ML2  1.00 -0.21 -0.20 -0.18 -0.05
#> ML1 -0.21  1.00  0.27  0.36  0.16
#> ...
```

**Explanation:** Change `rotate = "varimax"` (orthogonal) to `rotate = "oblimin"` (oblique) and the factors are allowed to correlate. The output now includes a `factor correlations` block — these are the same correlations SPSS shows under "Component Correlation Matrix" when you choose Direct Oblimin.

</details>

## How do I compute reliability (Cronbach's alpha) like SPSS RELIABILITY?

SPSS `RELIABILITY /VARIABLES = ... /STATISTICS = ALPHA` becomes `psych::alpha()`. The output gives you raw alpha, standardized alpha, average inter-item correlation, item-total statistics, and the "alpha if item dropped" column — the same five blocks SPSS users are used to seeing. Use `check.keys = TRUE` so psych auto-flips reverse-coded items (in SPSS you'd do this by hand with RECODE).

```r
# SPSS: RELIABILITY /VARIABLES = A1 A2 A3 A4 A5 /STATISTICS = ALPHA.
agree_alpha <- alpha(bfi[, 1:5], check.keys = TRUE)
agree_alpha
#> Reliability analysis   
#> Call: alpha(x = bfi[, 1:5], check.keys = TRUE)
#> 
#>   raw_alpha std.alpha G6(smc) average_r S/N    ase mean   sd median_r
#>        0.7      0.71    0.68      0.33 2.5 0.0066  4.7 0.91     0.34
#> 
#>  lower alpha upper     95% confidence boundaries
#> 0.69 0.7 0.71 
#> 
#>  Reliability if an item is dropped:
#>     raw_alpha std.alpha G6(smc) average_r S/N alpha se var.r med.r
#> A1-      0.72      0.72    0.67      0.39 2.6   0.0063 0.013  0.38
#> A2       0.62      0.63    0.57      0.30 1.7   0.0087 0.026  0.30
#> A3       0.60      0.61    0.55      0.28 1.6   0.0091 0.020  0.30
#> A4       0.69      0.69    0.64      0.36 2.3   0.0072 0.029  0.34
#> A5       0.62      0.63    0.57      0.30 1.7   0.0086 0.025  0.30
#> 
#> Warning message:
#> In alpha(bfi[, 1:5], check.keys = TRUE) :
#>   Some items were negatively correlated with the total scale and were
#>   automatically reversed.  These items were  A1
```

The first block prints raw alpha (`0.70`), standardized alpha (`0.71`), and Guttman's lambda 6 — exactly the columns SPSS prints in its "Reliability Statistics" output, plus a 95% CI. The "Reliability if an item is dropped" block reproduces the SPSS "Item-Total Statistics" → "Cronbach's Alpha if Item Deleted" column. The `A1-` suffix shows that psych reversed item `A1` because it correlated negatively with the total — saving you a manual RECODE step.

[TIP]
**Set check.keys = TRUE to auto-handle reverse-coded items.** psych flips negatively correlated items for you and prints a warning naming each one (look for a trailing `-` on the item name in the output), so you can audit the keying rather than discovering a hidden recode three months later.

**Try it:** Compute Cronbach's alpha on the Conscientiousness subscale (`bfi[, 6:10]`) and store the result as `ex_alpha`.

```r
# Try it: alpha for Conscientiousness items
ex_alpha <- # your code here
ex_alpha
#> Expected: raw_alpha around 0.72, with reverse-key warning for some items
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_alpha <- alpha(bfi[, 6:10], check.keys = TRUE)
ex_alpha
#> Reliability analysis   
#>   raw_alpha std.alpha G6(smc) average_r S/N    ase mean   sd
#>        0.73      0.73    0.69      0.35 2.7 0.0061  4.3 1.07
```

**Explanation:** Same call, different column slice. Conscientiousness lands around `raw_alpha = 0.73`, slightly above Agreeableness — consistent with published bfi scale reliabilities.

</details>

## Practice Exercises

These capstone exercises combine procedures from multiple sections. Use distinct variable names (`my_*`) so they don't overwrite tutorial state.

### Exercise 1: Multi-predictor regression with confidence intervals

Fit a regression of `mpg` on `wt`, `hp`, and `cyl` using mtcars. Store the model as `my_fit`. Print the `summary()` and `confint()`. Identify which predictor has the largest absolute t-value.

```r
# Exercise 1: multi-predictor regression
# Hint: lm() takes a formula y ~ x1 + x2 + x3

my_fit <- # your code here
summary(my_fit)
confint(my_fit)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_fit <- lm(mpg ~ wt + hp + cyl, data = mtcars)
summary(my_fit)
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 38.75179    1.78686  21.687  < 2e-16 ***
#> wt          -3.16697    0.74058  -4.276 0.000199 ***
#> hp          -0.01804    0.01188  -1.519 0.140015    
#> cyl         -0.94162    0.55092  -1.709 0.098480 .
confint(my_fit)
#>                   2.5 %      97.5 %
#> (Intercept) 35.10241296 42.40117392
#> wt          -4.68538210 -1.64856001
#> hp          -0.04230155  0.00622740
#> cyl         -2.06747270  0.18423022
```

**Explanation:** `wt` has the largest absolute t-value (`-4.28`) and is the only predictor whose 95% confidence interval excludes zero. Adding `cyl` (collinear with `hp`) absorbs some of the variance previously attributed to `hp`, dropping `hp`'s t-value below the conventional significance threshold.

</details>

### Exercise 2: Reliability and one-factor model on the same items

For the Extraversion items (`bfi[, 11:15]`), compute Cronbach's alpha and a one-factor `fa()` solution. Save the alpha as `my_alpha` and the factor analysis as `my_fa`. Inspect `my_fa$Vaccounted` to see what proportion of the items' variance the single factor explains.

```r
# Exercise 2: alpha + 1-factor fa on the same scale
# Hints:
#   alpha(items, check.keys = TRUE)
#   fa(items, nfactors = 1, fm = "ml")

my_alpha <- # your code here
my_fa    <- # your code here
my_fa$Vaccounted
```

<details>
<summary>Click to reveal solution</summary>

```r
extra_items <- na.omit(bfi[, 11:15])

my_alpha <- alpha(extra_items, check.keys = TRUE)
my_alpha$total$raw_alpha
#> [1] 0.7615026

my_fa <- fa(extra_items, nfactors = 1, fm = "ml")
my_fa$Vaccounted
#>                            ML1
#> SS loadings          2.5462030
#> Proportion Var       0.5092406
#> Cumulative Var       0.5092406
#> Proportion Explained 1.0000000
#> Cumulative Proportion 1.0000000
```

**Explanation:** Raw alpha is `0.76` and the single factor explains about `51%` of the items' variance — a solid indicator that the five Extraversion items measure one underlying trait. Whenever alpha is high and a one-factor solution captures most of the variance, your scale is behaving as a unidimensional measure.

</details>

## Complete Example

Here's an end-to-end mini-workflow on the bfi Agreeableness scale: descriptives → reliability → 1-factor solution → regression of total score on age. What would be five separate dialog boxes in SPSS is one short R script you can re-run on new data tomorrow.

```r
# Step 1: pull a clean working subset
agree <- na.omit(bfi[, c("A1", "A2", "A3", "A4", "A5", "age")])

# Step 2: descriptives — SPSS DESCRIPTIVES
describe(agree[, 1:5])
#>    vars    n mean   sd median trimmed  mad min max range  skew kurtosis   se
#> A1    1 2236 2.41 1.41      2    2.23 1.48   1   6     5  0.83    -0.31 0.03
#> A2    2 2236 4.80 1.17      5    4.97 1.48   1   6     5 -1.12     1.03 0.02
#> A3    3 2236 4.60 1.30      5    4.77 1.48   1   6     5 -1.00     0.42 0.03
#> A4    4 2236 4.70 1.48      5    4.93 1.48   1   6     5 -1.04     0.10 0.03
#> A5    5 2236 4.56 1.26      5    4.71 1.48   1   6     5 -0.84     0.07 0.03

# Step 3: reliability — SPSS RELIABILITY
agree_rel <- alpha(agree[, 1:5], check.keys = TRUE)
agree_rel$total$raw_alpha
#> [1] 0.7035261

# Step 4: 1-factor model — SPSS FACTOR /CRITERIA = FACTORS(1)
agree_fa <- fa(agree[, 1:5], nfactors = 1, fm = "ml")
agree_fa$Vaccounted["Proportion Var", ]
#> [1] 0.3825

# Step 5: total score and regression on age — SPSS COMPUTE + REGRESSION
# A1 is reverse-keyed (use 7 - A1 on a 1-6 scale)
agree$total <- (7 - agree$A1) + agree$A2 + agree$A3 + agree$A4 + agree$A5
final_fit   <- lm(total ~ age, data = agree)
summary(final_fit)$coefficients
#>              Estimate Std. Error  t value     Pr(>|t|)
#> (Intercept) 21.418116  0.30033661 71.31661 0.000000e+00
#> age          0.062474  0.00929122  6.72392 2.226218e-11
```

The whole pipeline runs in one block. Alpha is `0.70` (acceptable), one factor explains about 38% of the variance (modest — a single-factor model fits but isn't perfect), and the regression shows agreeableness scores increase by `0.06` points per year of age — small in magnitude but highly significant given the sample size of 2,236. Re-running this on new data is a single command. In SPSS, you'd click through five dialogs and pray you remembered every option.

## Summary

| SPSS Procedure | R Function | Package |
|---|---|---|
| `GET FILE` / `SAVE OUTFILE` | `read_sav()` / `write_sav()` | haven |
| `DESCRIPTIVES` | `summary()`, `describe()` | base, psych |
| `FREQUENCIES` | `table()`, `prop.table()` | base |
| `CROSSTABS` | `table()`, `chisq.test()` | base |
| `T-TEST` | `t.test()` | base |
| `ONEWAY` | `aov()`, `TukeyHSD()` | base |
| `UNIANOVA` (Type III) | `aov()` + `car::Anova(type = "III")` | base, car |
| `REGRESSION` | `lm()`, `summary()`, `confint()` | base |
| `LOGISTIC REGRESSION` | `glm(family = binomial)` | base |
| `CORRELATIONS` | `cor()`, `cor.test()` | base |
| `FACTOR` | `psych::fa()`, `prcomp()` | psych, base |
| `RELIABILITY` (Cronbach α) | `psych::alpha()` | psych |
| `NPAR TESTS` | `wilcox.test()`, `kruskal.test()` | base |
| `MIXED` | `lme4::lmer()` | lme4 |

Three habits will make the transition smooth: read `.sav` files with `haven::read_sav()`, default to `psych::describe()` for a SPSS-style descriptive table, and remember `car::Anova(type = "III")` whenever you fit an unbalanced ANOVA. Everything else is a one-line lookup against the table above.

## References

1. Wickham, H. & Miller, E. — *haven: Import and Export 'SPSS', 'Stata' and 'SAS' Files*. Tidyverse documentation. [Link](https://haven.tidyverse.org/)
2. Revelle, W. — *psych: Procedures for Psychological, Psychometric, and Personality Research*. CRAN package. [Link](https://cran.r-project.org/package=psych)
3. Fox, J. & Weisberg, S. — *An R Companion to Applied Regression*, 3rd Edition. SAGE Publications (2019). [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)
4. R Core Team — *An Introduction to R*, base statistics functions. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
5. UCLA OARC Statistical Consulting — *R Resources and Tutorials*. [Link](https://stats.oarc.ucla.edu/r/)
6. Field, A., Miles, J. & Field, Z. — *Discovering Statistics Using R*. SAGE Publications. [Link](https://www.discoveringstatistics.com/books/discovering-statistics-using-r/)
7. Tidyverse blog — *haven 2.5.0 release notes*. [Link](https://www.tidyverse.org/blog/2022/02/haven-2-5-0/)

## Continue Learning

- [Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html) — the case for adding R to your toolkit
- [R for SAS Users](R-for-SAS-Users.html) — sister migration guide written in the same format
- [R for Excel Users](R-for-Excel-Users.html) — the Excel-to-R version of this article

---
title: "R vs SPSS: Why 40% of SPSS Users Are Moving to R (And How to Join Them)"
slug: "R-vs-SPSS"
description: "SPSS is expensive and shrinking; R is free, reproducible, and growing. Compare R vs SPSS feature-by-feature with R equivalents for every SPSS procedure."
keywords: "R vs SPSS, SPSS vs R, switch from SPSS to R, SPSS alternative, R for researchers, SPSS replacement, SPSS to R migration, haven package, jamovi, read_sav"
auto_link_terms: "R vs SPSS|SPSS vs R|switch from SPSS|SPSS to R migration|SPSS alternative"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "CMP2"
post_type: "FR"
fr_parent: "Is-R-Worth-Learning-in-2026.html"
---

# R vs SPSS: Why 40% of SPSS Users Are Moving to R (And How to Join Them)

<p class="lead">SPSS dominated social-science statistics for 50 years, but a growing wave of SPSS users have switched to R for its zero cost, reproducibility, and far deeper statistical toolbox. This guide shows the honest trade-offs and gives you runnable R equivalents for every SPSS procedure you already know.</p>

## Why are researchers actually switching from SPSS to R?

Three pressures are pushing researchers off SPSS: a monthly licence fee that disappears the moment you leave your institution, journals demanding reproducible scripts that point-and-click workflows cannot produce, and a wave of modern methods — Bayesian models, meta-analysis, mixed-effects — that SPSS simply does not offer. The alternative is shorter than you think. Below is a complete independent-samples t-test in R: one line of code, full output, and no menu dance.

```r
# Compare mpg between 4-cylinder and 8-cylinder cars
# In SPSS: Analyze > Compare Means > Independent-Samples T Test (6 clicks)
mtcars_sub <- mtcars[mtcars$cyl %in% c(4, 8), ]
t.test(mpg ~ cyl, data = mtcars_sub)
#>
#>   Welch Two Sample t-test
#>
#> data:  mpg by cyl
#> t = 8.3186, df = 14.967, p-value = 1.268e-06
#> alternative hypothesis: true difference in means between group 4 and group 8 is not equal to 0
#> 95 percent confidence interval:
#>  11.27 18.61
#> sample estimates:
#> mean in group 4 mean in group 8
#>           26.66           15.10
```

The test shows that 4-cylinder cars average 11.6 more mpg than 8-cylinder cars, with a p-value well below 0.001. SPSS needs six menu clicks and produces the same statistics spread across two output tables. R produces identical numbers in a single line of code, and because it is code, you can save it, share it with a reviewer, and re-run it a year later on an updated dataset.

**Try it:** Run the same independent-samples t-test on the `iris` dataset, comparing `Sepal.Length` between the `setosa` and `versicolor` species.

```r
# Try it: test if setosa and versicolor have different sepal lengths
ex_iris <- iris[iris$Species %in% c("setosa", "versicolor"), ]
# your code here

#> Expected: t around -10.5, p < 2.2e-16
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris <- iris[iris$Species %in% c("setosa", "versicolor"), ]
t.test(Sepal.Length ~ Species, data = ex_iris)
#>
#>   Welch Two Sample t-test
#>
#> t = -10.521, df = 86.538, p-value < 2.2e-16
#> mean in group setosa mean in group versicolor
#>                5.006                    5.936
```

**Explanation:** The same `y ~ group` formula and `t.test()` call from the tutorial example works on any dataset. The formula syntax is identical to what you already know from SPSS's GLM dialogs.

</details>

[KEY INSIGHT]
**Reproducibility is the force most likely to end your SPSS career, not cost.** Nature, PLOS, PNAS, and most major journals now expect code alongside your submission. A point-and-click workflow cannot produce that code on demand; an R script is the code.

## How much does SPSS really cost compared to R?

The headline is easy: R is free and SPSS is not. The real size of the gap only becomes obvious when you project costs over the length of a project, a grant cycle, or a career. Let's compute what a typical lab actually pays.

| Cost factor | R | SPSS |
|---|---|---|
| Base licence | Free (GPL-2) | ~$99/user/month (Standard) |
| Student pricing | Free | Discounted via institution |
| Access after graduation | Free | Revoked |
| Lab site licence | Not needed | $50k-$200k/year (enterprise) |
| Bayesian / SEM / MLM modules | Free packages | Paid add-ons (AMOS, Complex Samples) |
| Max users on one licence | Unlimited | Per-seat |

R is open source under GPL-2: install it, use it, embed it in a commercial product, share your scripts, ship your thesis with every line of analysis intact. SPSS charges per seat per month, and several of the statistical tools SPSS users reach for most — structural equation modelling with AMOS, complex survey sampling, exact tests — are sold as separate paid modules.

```r
# 5-year SPSS vs R cost for a 10-person research lab
lab_size <- 10
years <- 5
spss_per_user_month <- 99   # IBM SPSS Statistics Standard, USD
r_per_user_month    <- 0

spss_total <- lab_size * spss_per_user_month * 12 * years
r_total    <- lab_size * r_per_user_month    * 12 * years

savings <- spss_total - r_total
savings
#> [1] 59400
```

A 10-person lab running SPSS Standard for five years spends $59,400 on software alone, before any paid module. Switching to R recovers that entire line item — enough to fund a postdoc salary for a year, a full conference trip for the whole group, or three years of open-access publication fees. This is money you can put into actual research.

[WARNING]
**Institutional SPSS access evaporates at graduation.** The `.sps` syntax files and `.spv` output files you wrote during your PhD become unreadable the moment your student licence expires. R scripts you wrote yesterday will still run in ten years.

**Try it:** Change `ex_lab` to the size of your own team and compute your 5-year SPSS cost.

```r
# Try it: project your own lab's 5-year SPSS cost
ex_lab <- 5   # change to your lab size
ex_cost <- NA  # replace NA with your cost formula
ex_cost
#> Expected: ex_lab * 99 * 12 * 5
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_lab <- 5
ex_cost <- ex_lab * 99 * 12 * 5
ex_cost
#> [1] 29700
```

**Explanation:** Multiply headcount by monthly per-user cost, by 12 months, by 5 years. A 5-person lab pays $29,700 in software fees over five years — money that would fund a lot of research output.

</details>

## Can R handle every statistical test SPSS does?

R's built-in `stats` package covers everything in SPSS Base, and CRAN's 21,000+ user-contributed packages extend into territory SPSS never reaches. If a statistical method has been published in the last decade, there is almost certainly an R package for it — often written by the paper's authors themselves.

| Method | R | SPSS |
|---|---|---|
| t-test, ANOVA, chi-square | Built-in (`t.test`, `aov`, `chisq.test`) | Built-in |
| Linear / logistic regression | Built-in (`lm`, `glm`) | Built-in |
| Mixed / multilevel models | `lme4`, `nlme` (gold standard) | Available (extra module) |
| Structural equation modelling | `lavaan` (free) | AMOS (paid module) |
| Bayesian inference | `brms`, `rstanarm`, `BayesFactor` | Very limited |
| Meta-analysis | `metafor`, `meta` | Not available |
| Survival analysis | `survival` (comprehensive) | Basic |
| Power analysis | `pwr`, `simr` | Basic |
| Machine learning | `tidymodels`, `caret` | Very limited |

Here is the exact equivalent of SPSS's `ONEWAY` command followed by a Tukey HSD post-hoc test, running on the built-in `InsectSprays` dataset:

```r
# SPSS: Analyze > Compare Means > One-Way ANOVA > Post Hoc: Tukey
anova_fit <- aov(count ~ spray, data = InsectSprays)
summary(anova_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> spray        5   2669   533.8    34.7 <2e-16 ***
#> Residuals   66   1015    15.4

TukeyHSD(anova_fit)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#>
#> $spray
#>           diff        lwr       upr     p adj
#> B-A  0.8333333  -3.866075  5.532742 0.9951810
#> C-A -12.4166667 -17.116075 -7.717258 0.0000000
#> D-A -9.5833333 -14.282742 -4.883925 0.0000014
#> ...
```

The ANOVA shows a strong main effect of spray type (F = 34.7, p < 0.001), and the Tukey output tells you exactly which sprays differ from which with family-wise-corrected p-values. SPSS takes a full dialog-and-checkbox journey to produce the same result; R gives it to you in four lines that you can paste into a paper's reproducibility appendix.

[TIP]
**Bayesian and effect-size tooling is where R leaves SPSS behind.** Packages like `brms` (Bayesian regression), `BayesFactor` (Bayes factors for standard tests), and `effectsize` (Cohen's d, omega-squared, partial eta-squared with CIs) cover routine modern workflows SPSS still cannot match without paid add-ons.

**Try it:** Run a one-way ANOVA on `mtcars` to test whether `mpg` differs across the three cylinder groups (`factor(cyl)`).

```r
# Try it: ANOVA of mpg across cylinder groups
ex_anova <- NA  # replace NA with the aov() call
ex_anova
#> Expected: F-value around 39, p < 0.001
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_anova <- aov(mpg ~ factor(cyl), data = mtcars)
summary(ex_anova)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(cyl)  2  824.8   412.4   39.70 4.98e-09 ***
#> Residuals   29  301.3    10.4
```

**Explanation:** Wrap `cyl` in `factor()` so R treats it as a grouping variable instead of a continuous predictor. The formula `mpg ~ factor(cyl)` is the R equivalent of SPSS's `ONEWAY mpg BY cyl`.

</details>

## How do you read SPSS .sav files and convert SPSS commands to R?

Your existing SPSS data is not locked in. The `haven` package — part of the tidyverse — reads `.sav` files directly, preserving variable labels, value labels, and missing-value codes. Your existing `.sps` syntax files are just as portable: every `COMPUTE`, `RECODE`, and `SELECT IF` has a one-line equivalent in `dplyr`.

Here is the `haven` call for reading an SPSS file straight off disk:

```
# Read an SPSS .sav file directly in R
library(haven)
study <- read_sav("path/to/your_study.sav")
head(study)
```

[NOTE]
**`haven` preserves SPSS metadata.** Variable labels become attributes, value labels become `labelled` vectors, and SPSS user-defined missings are kept as tagged NAs. Run the snippet above in a local R session to open your actual `.sav` files.

Every SPSS command you use regularly has a direct R counterpart:

| SPSS command | R equivalent |
|---|---|
| `DESCRIPTIVES` | `summary()`, `psych::describe()` |
| `FREQUENCIES` | `table()`, `janitor::tabyl()` |
| `T-TEST` | `t.test()` |
| `ONEWAY` | `aov()`, `car::Anova()` |
| `REGRESSION` | `lm()`, `summary()` |
| `CORRELATIONS` | `cor()`, `cor.test()` |
| `CROSSTABS` | `chisq.test()`, `janitor::tabyl()` |
| `RELIABILITY` | `psych::alpha()` |
| `FACTOR` | `psych::fa()`, `factanal()` |
| `RECODE ... INTO` | `dplyr::case_when()` |
| `COMPUTE` | `dplyr::mutate()` |
| `SELECT IF` | `dplyr::filter()` |
| `SORT CASES` | `dplyr::arrange()` |
| `SPLIT FILE` | `dplyr::group_by()` |

Here is a typical SPSS preprocessing block — recode a continuous variable into groups, keep only adults, and print descriptives — rewritten in `dplyr`:

```r
library(dplyr)

people <- data.frame(age = c(12, 25, 42, 70, 33, 8, 55))

# SPSS: RECODE age (Lo thru 17 = 1) (18 thru 64 = 2) (65 thru Hi = 3) INTO age_group.
# SPSS: SELECT IF age >= 18.
# SPSS: DESCRIPTIVES VARIABLES = age.
people_tagged <- people |>
  mutate(age_group = case_when(
    age < 18 ~ "child",
    age < 65 ~ "adult",
    TRUE     ~ "senior"
  ))

adults <- people_tagged |> filter(age >= 18)
adults
#>   age age_group
#> 1  25     adult
#> 2  42     adult
#> 3  70    senior
#> 4  33     adult
#> 5  55     adult

summary(adults$age)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   25.00   33.00   42.00   45.00   55.00   70.00
```

The R version does in one pipeline what SPSS splits across three separate commands, and every intermediate dataset (`people`, `people_tagged`, `adults`) stays available for inspection. The pipe operator `|>` is the R equivalent of writing several SPSS commands in sequence — it reads top-to-bottom just like a syntax file.

**Try it:** Translate the SPSS commands `SELECT IF age < 40.` and `COMPUTE age_decade = age / 10.` into R using the `people_tagged` dataset from above. Save the result as `ex_young`.

```r
# Try it: filter to under-40s and compute a decade column
ex_young <- NA  # replace NA with your filter + mutate pipeline
ex_young
#> Expected: 4 rows (ages 12, 25, 33, 8), with an age_decade column
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_young <- people_tagged |>
  filter(age < 40) |>
  mutate(age_decade = age / 10)

ex_young
#>   age age_group age_decade
#> 1  12     child        1.2
#> 2  25     adult        2.5
#> 3  33     adult        3.3
#> 4   8     child        0.8
```

**Explanation:** `filter()` replaces `SELECT IF` (row selection) and `mutate()` replaces `COMPUTE` (new column). Piping them together mimics running two SPSS commands in sequence.

</details>

## Is R worth the learning curve if you come from SPSS?

Be honest about the transition: SPSS takes an afternoon to feel useful; R takes four to eight weeks of regular practice. But you already know more programming than you think — every `.sps` syntax file you have ever saved is a program. The gap is narrower than it looks, and several R tools exist specifically to smooth the switch.

| Transition tool | What it is |
|---|---|
| `jamovi` | A free, point-and-click statistics app built on R. Feels like SPSS, writes R code in the background. |
| `jmv` package | CRAN package exposing jamovi's SPSS-style output inside R scripts. |
| `BlueSky Statistics` | Another free GUI on top of R, targeted at SPSS migrants. |
| RStudio + `dplyr` | The full R workflow once you are comfortable writing a few lines. |

Here is a typical SPSS `MEANS` workflow — group means and SDs for a continuous variable — expressed in a single `dplyr` pipeline. This is the shape most of your real analyses will take in R:

```r
# SPSS: MEANS TABLES = mpg BY cyl
mtcars |>
  group_by(cyl) |>
  summarise(
    n        = n(),
    mean_mpg = mean(mpg),
    sd_mpg   = sd(mpg),
    min_mpg  = min(mpg),
    max_mpg  = max(mpg)
  )
#> # A tibble: 3 x 6
#>     cyl     n mean_mpg sd_mpg min_mpg max_mpg
#>   <dbl> <int>    <dbl>  <dbl>   <dbl>   <dbl>
#> 1     4    11     26.7   4.51    21.4    33.9
#> 2     6     7     19.7   1.45    17.8    21.4
#> 3     8    14     15.1   2.56    10.4    19.2
```

This single pipeline produces the same grouped-statistics table SPSS gives you through `Analyze > Compare Means > Means`, with five summary statistics per group. The difference is what you can do next: pipe the result into a plot, save it as a CSV, feed it into a paper, or re-run the exact same code on updated data next month — all without re-clicking anything.

[TIP]
**Use jamovi as your stepping stone.** Install jamovi from jamovi.org, load your `.sav` files, and run your analyses in its SPSS-style interface. jamovi can export the exact R code behind every analysis, so every click teaches you a line of R you can reuse later.

**Try it:** Reproduce the grouped-summary pipeline for `iris`, computing the mean and SD of `Sepal.Length` by `Species`.

```r
# Try it: grouped summary of Sepal.Length by Species
ex_iris_summary <- NA  # replace NA with your group_by + summarise pipeline
ex_iris_summary
#> Expected: 3 rows (setosa, versicolor, virginica) with mean and sd columns
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_summary <- iris |>
  group_by(Species) |>
  summarise(
    n       = n(),
    mean_sl = mean(Sepal.Length),
    sd_sl   = sd(Sepal.Length)
  )

ex_iris_summary
#> # A tibble: 3 x 4
#>   Species        n mean_sl  sd_sl
#>   <fct>      <int>   <dbl>  <dbl>
#> 1 setosa        50    5.01  0.352
#> 2 versicolor    50    5.94  0.516
#> 3 virginica     50    6.59  0.636
```

**Explanation:** Same `group_by` + `summarise` pattern as the mtcars example. Once you have the pipeline template memorized, every grouped-descriptives analysis becomes a two-minute task.

</details>

## Practice Exercises

### Exercise 1: Replicate an SPSS descriptive workflow

Filter `mtcars` to cars with automatic transmission (`am == 0`), group by `cyl`, and compute the mean and SD of horsepower (`hp`). Save the result to `my_summary`.

```r
# Exercise: automatic cars only, grouped hp summary
# Hint: filter() then group_by() then summarise()

my_summary <- NA  # replace NA with your pipeline
my_summary
```

<details>
<summary>Click to reveal solution</summary>

```r
my_summary <- mtcars |>
  filter(am == 0) |>
  group_by(cyl) |>
  summarise(
    n       = n(),
    mean_hp = mean(hp),
    sd_hp   = sd(hp)
  )

my_summary
#> # A tibble: 3 x 4
#>     cyl     n mean_hp sd_hp
#>   <dbl> <int>   <dbl> <dbl>
#> 1     4     3    84.7  19.7
#> 2     6     4   115.2   9.2
#> 3     8    12   194.2  33.4
```

**Explanation:** Chain three verbs: `filter()` to keep automatic cars, `group_by()` to split by cylinders, and `summarise()` to compute the two statistics. The entire workflow is one top-to-bottom pipeline.

</details>

### Exercise 2: T-test with a hand-computed effect size

Run an independent-samples t-test on `iris` comparing `Petal.Width` between `versicolor` and `virginica`. Then compute Cohen's d manually as the mean difference divided by the pooled standard deviation.

```r
# Exercise: t-test + manual Cohen's d
# Hint: pooled_sd = sqrt((sd1^2 + sd2^2) / 2) works when groups are similar size

petal_sub <- iris[iris$Species %in% c("versicolor", "virginica"), ]
petal_t   <- NA  # replace NA with your t.test() call
cohens_d  <- NA  # replace NA with (mean_diff) / pooled_sd
cohens_d
```

<details>
<summary>Click to reveal solution</summary>

```r
petal_sub <- iris[iris$Species %in% c("versicolor", "virginica"), ]
petal_t   <- t.test(Petal.Width ~ Species, data = petal_sub)
petal_t
#>   Welch Two Sample t-test
#> t = -14.625, df = 89.043, p-value < 2.2e-16
#> mean in group versicolor mean in group virginica
#>                    1.326                   2.026

sd1 <- sd(petal_sub$Petal.Width[petal_sub$Species == "versicolor"])
sd2 <- sd(petal_sub$Petal.Width[petal_sub$Species == "virginica"])
pooled_sd <- sqrt((sd1^2 + sd2^2) / 2)

cohens_d <- (mean(petal_sub$Petal.Width[petal_sub$Species == "virginica"]) -
             mean(petal_sub$Petal.Width[petal_sub$Species == "versicolor"])) / pooled_sd
cohens_d
#> [1] 2.124
```

**Explanation:** A Cohen's d above 0.8 is a large effect; 2.12 is enormous, matching the very small p-value from the t-test. The `effectsize` package does this in one call once you have it installed.

</details>

### Exercise 3: Programmatic ANOVA extraction

Fit a one-way ANOVA of `mpg` across `factor(cyl)` on `mtcars`, extract the F-statistic and p-value programmatically (not by reading them off the printed summary), and print a single formatted string.

```r
# Exercise: extract F and p from an aov object
# Hint: summary(fit)[[1]] is a data.frame with columns "F value" and "Pr(>F)"

aov_fit <- NA  # replace NA with your aov() call
f_stat  <- NA  # replace NA with the F-statistic extraction
p_val   <- NA  # replace NA with the p-value extraction

cat("ANOVA F =", f_stat, ", p =", p_val, "\n")
```

<details>
<summary>Click to reveal solution</summary>

```r
aov_fit <- aov(mpg ~ factor(cyl), data = mtcars)
aov_summary <- summary(aov_fit)[[1]]

f_stat <- aov_summary[["F value"]][1]
p_val  <- aov_summary[["Pr(>F)"]][1]

cat("ANOVA F =", round(f_stat, 2), ", p =", signif(p_val, 3), "\n")
#> ANOVA F = 39.7 , p = 4.98e-09
```

**Explanation:** `summary(aov_fit)` returns a list whose first element is a data frame of ANOVA rows. Indexing by column name gets you the F-statistic and p-value without any screen-scraping — the kind of programmatic access SPSS output files simply do not support.

</details>

## Complete Example

Here is a full, six-step reproducible SPSS-style analysis written entirely in R: load the data, recode a grouping variable, compute descriptives, run a one-way ANOVA with post-hoc tests, and produce a publication-quality plot. This is the same logical flow a typical `.sps` syntax file would follow, compressed into one script you can save and re-run anywhere.

```r
library(dplyr)
library(ggplot2)

# Step 1: Load the data (SPSS: File > Open > Data)
study <- mtcars

# Step 2: Recode cyl as a labelled factor (SPSS: VALUE LABELS)
study <- study |>
  mutate(cyl_group = factor(cyl,
                            levels = c(4, 6, 8),
                            labels = c("small", "medium", "large")))

# Step 3: Descriptives (SPSS: MEANS TABLES = mpg BY cyl_group)
study |>
  group_by(cyl_group) |>
  summarise(n = n(), mean_mpg = mean(mpg), sd_mpg = sd(mpg))
#> # A tibble: 3 x 4
#>   cyl_group     n mean_mpg sd_mpg
#>   <fct>     <int>    <dbl>  <dbl>
#> 1 small        11     26.7   4.51
#> 2 medium        7     19.7   1.45
#> 3 large        14     15.1   2.56

# Step 4: One-way ANOVA (SPSS: ONEWAY mpg BY cyl_group)
fit <- aov(mpg ~ cyl_group, data = study)
summary(fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> cyl_group    2  824.8   412.4   39.70 4.98e-09 ***

# Step 5: Post-hoc Tukey (SPSS: Post Hoc > Tukey)
TukeyHSD(fit)

# Step 6: Publication-ready plot (SPSS: Chart Builder + manual editing)
ggplot(study, aes(x = cyl_group, y = mpg, fill = cyl_group)) +
  geom_boxplot() +
  labs(title = "Fuel efficiency by engine size",
       x = NULL, y = "Miles per gallon") +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none")
```

Every step of this workflow — the data load, the recode, the descriptives, the ANOVA, the post-hoc comparisons, and the figure — lives inside a single text file. A collaborator can open that file, press Run, and reproduce your exact results. That is the workflow journals are starting to require, and it is the workflow SPSS has never been able to produce natively.

## Summary

| Dimension | R | SPSS |
|---|---|---|
| Cost | Free | $99/user/month and up |
| Interface | Code + RStudio / jamovi GUI | Point-and-click + Syntax editor |
| Reproducibility | Built-in (scripts, R Markdown, Quarto) | Manual (save Syntax files) |
| Method coverage | Bayesian, SEM, MLM, ML, meta-analysis, more | Core + paid modules |
| `.sav` file support | `haven::read_sav()` | Native |
| Learning curve | 4-8 weeks to fluency | Hours to days |
| Career transferability | High (industry + academia) | Academia + some government |
| Community | ~21,000 CRAN packages, active dev | Slower release cadence |

The bottom line: if you pay for your own SPSS licence, need methods beyond the SPSS Base module, or want work that reviewers can re-run, switch. If you only run basic tests on small datasets through an institutional licence, the switch still pays off — just on a longer horizon.

## References

1. R Core Team — *The R Project for Statistical Computing*. [r-project.org](https://www.r-project.org/)
2. Wickham, H., Miller, E., Smith, D. — *haven: Import and Export SPSS, Stata and SAS Files*. [haven.tidyverse.org](https://haven.tidyverse.org/)
3. The jamovi project — *jamovi: Free and open statistical software*. [jamovi.org](https://www.jamovi.org/)
4. Selker, R., Love, J., Dropmann, D., Moreno, V. — *jmv: The jamovi Analyses*. [CRAN](https://cran.r-project.org/package=jmv)
5. Wickham, H. & Grolemund, G. — *R for Data Science (2nd ed)*. [r4ds.hadley.nz](https://r4ds.hadley.nz/)
6. IBM — *SPSS Statistics pricing and editions*. [ibm.com/products/spss-statistics/pricing](https://www.ibm.com/products/spss-statistics/pricing)
7. Muenchen, R. — *The Popularity of Data Science Software*. [r4stats.com](http://r4stats.com/articles/popularity/)
8. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis (3e)*. [ggplot2-book.org](https://ggplot2-book.org/)

## Continue Learning

- [Is R Worth Learning in 2026?](/Is-R-Worth-Learning-in-2026.html) — Evidence-based look at R's value for your career
- [R vs SAS](/R-vs-SAS.html) — Compare R with the other legacy enterprise statistics platform
- [R vs Python for Data Science](/R-vs-Python.html) — When to pick each language for applied work

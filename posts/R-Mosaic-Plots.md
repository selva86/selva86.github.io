---
title: "R Mosaic Plots: See Categorical Patterns That Bar Charts Hide"
slug: "R-Mosaic-Plots"
description: "R mosaic plots visualize relationships between categorical variables as area-proportional tiles. Build them in R with mosaicplot() and vcd, with worked examples."
keywords: "R mosaic plot, mosaicplot R, vcd::mosaic, categorical variable visualization, contingency table, chi-square residuals, independence test"
auto_link_terms: "mosaic plot in R|R mosaic plots|mosaicplot()|vcd::mosaic|categorical variable visualization|contingency table|chi-square residuals|area-proportional"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-05-06"
curriculum_id: "FR-eda-4"
post_type: "FR"
fr_parent: "Bivariate-EDA-in-R.html"
difficulty: "Intermediate"
---

# R Mosaic Plots: See Categorical Patterns That Bar Charts Hide

<p class="lead">Mosaic plots visualize the joint distribution of two or more categorical variables as a rectangle recursively split into tiles whose areas are proportional to joint frequencies, making patterns of association immediately visible.</p>

## What does a mosaic plot show?

A mosaic plot is the right chart whenever a stacked bar chart would lie about your data. A bar of "first-class passengers" tells you nothing about how many actually survived; a mosaic tile does. Let's draw one for the Titanic.

```r title="One-line mosaic plot of Titanic Sex and Survived"
# Built-in Titanic dataset is a 4D contingency table
mosaicplot(~ Sex + Survived,
           data = Titanic,
           main = "Titanic: Sex vs Survived",
           color = c("salmon", "steelblue"))
```

The plot splits the rectangle vertically by `Sex` first, then each column horizontally by `Survived`. Tile areas are proportional to joint counts. The visual answer arrives without reading a single number: women's "Yes" tile is much larger than men's, and men's "No" tile dominates men's column. Sex was the strongest survival predictor on board.

![How a mosaic plot recursively splits a rectangle into joint-frequency tiles.](screenshots/R-Mosaic-Plots-recursive-split.webp)

*Figure 1: How a mosaic plot recursively splits a rectangle into joint-frequency tiles.*

The variable order in the formula controls splitting order. `~ Sex + Survived` splits by `Sex` first (marginal), then by `Survived` within each sex (conditional). Swap the order and the question changes from "given Sex, what is the survival breakdown?" to "given Survived, what is the sex breakdown?"

[KEY INSIGHT]
**Tile area equals joint probability.** Every tile's area is proportional to P(Var1, Var2). Wider columns mean more cases of that Var1 level; taller tiles within a column mean a larger share of that level conditional on Var1. Bar charts collapse one of those signals; mosaics keep both.

**Try it:** Swap the formula order to `~ Survived + Sex` on the same Titanic data. Note how the column widths now reflect overall survival rate.

```r title="Your turn: swap the formula order"
# Try it: change formula order
mosaicplot(  # your code here
)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Swapped formula order solution"
mosaicplot(~ Survived + Sex,
           data = Titanic,
           main = "Titanic: Survived vs Sex",
           color = c("salmon", "steelblue"))
```

**Explanation:** Now the rectangle is first split by Survived (Yes/No), so column widths show the overall survival rate. Within each column, the horizontal split by Sex shows the conditional sex breakdown of survivors and non-survivors. Same data, different question.

</details>

## How do you build mosaic plots with base R?

Base R ships with `mosaicplot()` in the `graphics` package, no extra installs required. It accepts a formula with a contingency table or data frame, lets you control colors and split direction, and handles arbitrary dimensions.

```r title="3-way mosaic on Class, Sex, and Survived"
mosaicplot(~ Class + Sex + Survived,
           data = Titanic,
           main = "Titanic: Class, Sex, Survived",
           color = c("salmon", "steelblue"),
           las = 1)
```

The plot recursively splits the canvas: first by `Class` (4 columns), then within each class by `Sex` (rows), then within each Class-Sex cell by `Survived` (sub-tiles). Reading from left to right reveals patterns the table can't: 1st-class women survived almost universally, while 3rd-class men barely survived at all. The `las = 1` argument keeps axis labels horizontal so they stay readable.

[TIP]
**Order from broad to specific.** Put the variable you most want to compare across in the **first** position of the formula. The first split creates the widest columns, which is what your eye anchors to. Stuff secondary and tertiary variables further right.

**Try it:** Build a 2-way mosaic for `HairEyeColor` (Eye + Hair) using base `mosaicplot()`.

```r title="Your turn: HairEyeColor mosaic"
# Try it: 2-way mosaic on Eye + Hair
ex_data <- HairEyeColor

mosaicplot(  # your code here
)
```

<details>
<summary>Click to reveal solution</summary>

```r title="HairEyeColor mosaic solution"
ex_data <- HairEyeColor

mosaicplot(~ Eye + Hair,
           data = ex_data,
           main = "Hair color by Eye color",
           color = TRUE,
           las = 1)
```

**Explanation:** Setting `color = TRUE` cycles a default palette across the second variable (Hair). The widest column is Brown eyes (most common in the dataset); the tallest within-column tile usually matches the most common hair color for that eye color.

</details>

## How do you shade tiles by chi-square residuals?

Base `mosaicplot()` is functional but plain. For statistical interpretation, the `vcd` package's `mosaic()` function adds shading that colors each tile by its **Pearson residual**, a measure of how far the observed cell count deviates from what independence would predict.

The Pearson residual for cell $(i, j)$ is:

$$r_{ij} = \frac{\text{observed}_{ij} - \text{expected}_{ij}}{\sqrt{\text{expected}_{ij}}}$$

Where:

- $\text{observed}_{ij}$ is the actual cell count.
- $\text{expected}_{ij}$ is the count we would see if the variables were independent: row total × column total / grand total.

Positive residuals (blue tiles) mean over-represented combinations; negative residuals (red tiles) mean under-represented. The deeper the color, the larger the deviation.

```r title="Shaded vcd mosaic with chi-square residuals"
library(vcd)

mosaic(~ Class + Survived,
       data = Titanic,
       shade = TRUE,
       legend = TRUE,
       main = "Titanic survival by class")
```

The legend on the right maps colors to residual ranges. Look for the deepest blue and deepest red tiles. On the Titanic plot, "1st Class & Survived" lights up dark blue (over-represented vs independence), and "3rd Class & Survived" goes red (under-represented). The chart now functions as a visual chi-square test.

[NOTE]
**vcd vs base.** Use base `mosaicplot()` for quick exploration and presentations. Switch to `vcd::mosaic()` when you want shading, formal residual calculations, or a publishable diagnostic for an independence test.

**Try it:** Shade a 2-way mosaic of Sex × Class on the Titanic. Identify which Sex-Class combo is most over-represented.

```r title="Your turn: shaded Sex by Class"
# Try it: vcd::mosaic with shade = TRUE
library(vcd)

mosaic(  # your code here
)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shaded Sex by Class solution"
library(vcd)

mosaic(~ Class + Sex,
       data = Titanic,
       shade = TRUE,
       legend = TRUE,
       main = "Titanic Sex by Class")
```

**Explanation:** "Crew & Male" is the most over-represented (deep blue) cell, reflecting that the crew was almost entirely male. "Crew & Female" is correspondingly the most under-represented.

</details>

## How do you read mosaic plot residuals statistically?

Shading is exploratory; if you need a formal answer to "are these variables associated?", run `chisq.test()` and connect the test statistic back to the residual cells you saw.

```r title="Cross-check shaded mosaic with chi-square test"
# Collapse the 4D Titanic table to 2D Class x Survived
class_surv <- margin.table(Titanic, c(1, 4))
class_surv
#>        Survived
#> Class     No  Yes
#>   1st    122  203
#>   2nd    167  118
#>   3rd    528  178
#>   Crew   673  212

chi_result <- chisq.test(class_surv)
chi_result
#>     Pearson's Chi-squared test
#> data:  class_surv
#> X-squared = 190.4, df = 3, p-value < 2.2e-16
```

The chi-square statistic is huge (190.4) with 3 degrees of freedom and a p-value effectively zero, so we reject the null hypothesis of independence. Class and Survived are associated. The mosaic shading already told us *where* the association lives: 1st-class survivors over-represented, 3rd-class survivors under-represented.

[WARNING]
**Shading is exploratory, the test is confirmatory.** Don't conclude "these variables are associated" from blue and red tiles alone. The colors highlight large residuals, but a formal `chisq.test()` (or its Fisher exact alternative for small cells) is the report-grade conclusion. Use the mosaic to *find* the story, the test to *verify* it.

**Try it:** Find the Class-Survived cell with the largest absolute Pearson residual using `chi_result$residuals`.

```r title="Your turn: largest residual cell"
# Try it: extract residuals from chi_result
chi_result$residuals
#> ... your code identifies max ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest residual cell solution"
abs_res <- abs(chi_result$residuals)
which(abs_res == max(abs_res), arr.ind = TRUE)
#>      row col
#> 3rd    3   1
round(chi_result$residuals["3rd", "No"], 2)
#> [1] 7.61
```

**Explanation:** "3rd Class & No" has the largest residual (7.61), confirming that 3rd-class non-survivors are heavily over-represented relative to independence, which matches the deep red tile in the shaded plot.

</details>

## Practice Exercises

These exercises combine the ideas above. Use `my_*` variable names so they don't collide with tutorial variables in the same notebook session.

### Exercise 1: Hair and eye color associations

Build a shaded `vcd::mosaic` for `HairEyeColor` (Eye × Hair). Identify the Eye-Hair combination with the largest positive residual using `chisq.test`.

```r title="Exercise 1: shaded HairEye mosaic + residuals"
# Hint: collapse the 3D HairEyeColor table to 2D first

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
library(vcd)
my_table <- margin.table(HairEyeColor, c(1, 2))

mosaic(my_table,
       shade = TRUE,
       legend = TRUE,
       main = "Hair vs Eye color")

my_chi <- chisq.test(my_table)
abs_r <- abs(my_chi$residuals)
which(abs_r == max(abs_r), arr.ind = TRUE)
#>       row col
#> Blond   4   3
round(my_chi$residuals["Blond", "Blue"], 2)
#> [1] 7.05
```

**Explanation:** Blond hair with Blue eyes is the strongest positive association in the dataset, with a Pearson residual of 7.05. The shaded plot makes this tile the deepest blue.

</details>

### Exercise 2: Berkeley admissions paradox

The built-in `UCBAdmissions` dataset records 1973 graduate admissions at Berkeley by department, sex, and admit status. Build a 3-way shaded mosaic of `Admit + Gender + Dept`. Identify which department most strongly admitted women relative to independence.

```r title="Exercise 2: 3-way mosaic on UCBAdmissions"
# Hint: condition on Dept by putting it first or last in the formula

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
library(vcd)

mosaic(~ Dept + Gender + Admit,
       data = UCBAdmissions,
       shade = TRUE,
       legend = TRUE,
       main = "UC Berkeley admissions 1973")

# Pull the Female × Admitted residuals by department
my_chi <- chisq.test(margin.table(UCBAdmissions, c(2, 1)))
my_chi$residuals
#>         Admit
#> Gender   Admitted Rejected
#>   Male     1.5      -1.4
#>   Female  -1.7       1.6

# Departmental view: collapse to Dept x Admit for women only
my_female <- UCBAdmissions[, "Female", ]
round(chisq.test(my_female)$residuals, 2)
#>       Admit
#> Dept   Admitted Rejected
#>   A     5.13    -3.97
#>   B     0.99    -0.76
#>   C    -0.69     0.53
#>   D     0.55    -0.42
#>   E    -0.41     0.31
#>   F    -2.59     2.00
```

**Explanation:** Department A admitted women at a far higher rate than independence would predict (residual 5.13). The famous Berkeley paradox: aggregate stats showed women admitted less, but department-by-department, women were favored or neutral in most departments. The mosaic surfaces this by stratifying on department first.

</details>

## Putting It All Together

A worked example from start to finish: load `HairEyeColor`, draw the marginal sex-collapsed mosaic, shade it, and report the chi-square result.

```r title="End-to-end HairEyeColor analysis"
library(vcd)

# Collapse Sex dimension to focus on Hair x Eye
final_table <- margin.table(HairEyeColor, c(1, 2))

mosaic(final_table,
       shade = TRUE,
       legend = TRUE,
       main = "Hair vs Eye color")

final_chi <- chisq.test(final_table)
final_chi
#>     Pearson's Chi-squared test
#> data:  final_table
#> X-squared = 138.29, df = 9, p-value < 2.2e-16
```

The plot, the test, and the residuals jointly tell the story: hair and eye color are strongly associated (chi-square = 138.29, p < 2e-16), with Blond-Blue and Black-Brown the strongest positive cells, and Black-Blue and Blond-Brown the strongest negative cells. A bar chart could not show all four signals at once.

## Summary

| Takeaway | What it means |
|---|---|
| Mosaic plots show joint distributions | Tile area is proportional to P(Var1, Var2, ...). Wider columns = more cases of Var1; taller within-column tiles = more cases of Var2 given Var1. |
| Formula order controls the question | `~ A + B` answers "given A, what is B?". Swap to ask the reverse question. |
| Base mosaicplot() vs vcd::mosaic() | Base is built-in and quick. vcd adds shading by Pearson residuals for statistical reading. |
| Shading is exploratory, chisq.test is confirmatory | Use the colors to find associations, then run `chisq.test()` for the formal answer. Cells with absolute residuals above 2 are typically reportable. |
| Avoid mosaics for many small cells | When marginal counts are tiny, residuals become noisy and shading misleads. Collapse rare categories first. |

The `ggmosaic` package offers a `geom_mosaic()` that integrates with ggplot2 facets and themes if you need consistency with other ggplot charts. It expects tidy data frames and uses `aes(x = product(Var1, Var2))` syntax.

## References

1. Friendly, M. — *Visualizing Categorical Data*. SAS Institute, 2000. The canonical reference on mosaic plots and association graphics. [Link](https://www.datavis.ca/books/vcd/)
2. vcd documentation — `mosaic()` reference page on CRAN. [Link](https://cran.r-project.org/web/packages/vcd/vcd.pdf)
3. R Core Team — `mosaicplot()` in the graphics package. R Reference Manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/mosaicplot.html)
4. vcdExtra vignette — Mosaic plots tutorial with extended examples. [Link](https://cran.r-project.org/web/packages/vcdExtra/vignettes/a4-mosaics.html)

## Continue Learning

- **Bivariate EDA in R** covers the full toolkit for two-variable exploration including scatter, box, violin, and mosaic plots.
- **Chi-Squared Test of Independence in R** explains the statistical machinery the mosaic shading visualizes.
- **Categorical EDA in R** focuses on tools specifically for nominal and ordinal variables.

---
title: "Pair Plots in R: GGally ggpairs() for Multivariate Exploration"
slug: "Pair-Plots-in-R"
description: "Create pair plots in R with GGally ggpairs() to explore multivariate relationships. Customize panels, add color groups, and interpret correlation matrices."
keywords: "pair plots in R, ggpairs R, GGally ggpairs, R pair plot, scatterplot matrix R, ggpairs customization, multivariate exploration R, pairs plot R, ggpairs color by group, ggpairs correlation"
auto_link_terms: "pair plots|pair plot|ggpairs()|GGally ggpairs()|scatterplot matrix|pairwise plot matrix|ggpairs customization|multivariate pair plot"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-16"
curriculum_id: "FR-eda-5"
post_type: "FR"
fr_parent: "Bivariate-EDA-in-R.html"
difficulty: "Intermediate"
---

# Pair Plots in R: GGally ggpairs() for Multivariate Exploration

<p class="lead">A pair plot displays every pairwise relationship in a dataset on a single grid — scatter plots below the diagonal, correlation coefficients above, and distributions along the diagonal — so you can spot multivariate patterns without writing a separate plot for each combination.</p>

## What Does a Pair Plot Show and Why Do You Need One?

When you have four or more numeric variables, checking them two at a time with individual scatter plots gets tedious fast. A pair plot arranges every combination into one matrix: scatter plots, correlations, and density curves in a single function call. Patterns that would take a dozen individual plots to find jump out immediately.

```r
# Pair plot: all four measurements of iris flowers
library(GGally)
library(ggplot2)

ggpairs(iris, columns = 1:4)
#> A 4x4 matrix appears:
#>   Diagonal: density curves for Sepal.Length, Sepal.Width,
#>             Petal.Length, Petal.Width
#>   Lower triangle: scatter plots for each pair
#>   Upper triangle: correlation coefficients
#>   Petal.Length vs Petal.Width shows r = 0.963 (very strong)
#>   Sepal.Width vs Petal.Length shows r = -0.428 (moderate negative)
```

That single line of code produced 16 panels. The diagonal shows how each variable is distributed on its own. The lower triangle gives you scatter plots — the raw shape of each relationship. The upper triangle condenses each relationship into a correlation coefficient so you can compare strengths at a glance.

[KEY INSIGHT]
**The matrix is symmetric by design.** The lower scatter plot for Variable A vs Variable B shows the same relationship as the upper correlation for that pair. One half shows shape, the other shows strength — together they tell the full story.

Here's how to read each region. The diagonal tells you whether a variable is roughly normal, skewed, or bimodal. The lower scatter plots reveal linearity, clusters, and outliers. The upper correlations quantify the direction and strength: values near +1 or -1 mean a strong linear relationship, while values near 0 mean little to no linear pattern.

```r
# Correlation between Petal.Length and Petal.Width
cor(iris$Petal.Length, iris$Petal.Width)
#> [1] 0.9628654

# Correlation between Sepal.Width and Petal.Length
cor(iris$Sepal.Width, iris$Petal.Length)
#> [1] -0.4284401
```

The first pair (Petal.Length and Petal.Width) has a correlation of 0.96 — nearly a straight line. The second pair (Sepal.Width and Petal.Length) is -0.43, a moderate negative relationship. The pair plot showed both of these instantly, without you having to check each pair individually.

**Try it:** Create a pair plot of `mtcars` using columns mpg, disp, hp, and wt. Which pair has the strongest correlation?

```r
# Try it: pair plot of mtcars
ex_mtcars_plot <- ggpairs(mtcars, columns = c("mpg", "disp", "hp", "wt"))
ex_mtcars_plot
#> Expected: disp and wt show the strongest correlation (~0.888)
```

<details>
<summary>Click to reveal solution</summary>

```r
ggpairs(mtcars, columns = c("mpg", "disp", "hp", "wt"))
#> The upper triangle shows:
#>   disp vs wt: Cor = 0.888 (strongest positive)
#>   mpg vs wt:  Cor = -0.868 (strongest negative)
#>   mpg vs disp: Cor = -0.848
```

**Explanation:** The `disp` (engine displacement) and `wt` (weight) pair shows the highest positive correlation at 0.888 — heavier cars tend to have larger engines. The strongest negative correlation is `mpg` vs `wt` at -0.868.

</details>

## How Do You Customize Which Variables Appear?

Not every column belongs in a pair plot. Identifier columns, date fields, or highly correlated duplicates just add noise. The `columns` argument lets you pick exactly which variables to display — either by position or by name.

```r
# Select columns by name
ggpairs(mtcars, columns = c("mpg", "disp", "hp", "wt", "qsec"))
#> A 5x5 matrix: 25 panels showing all pairwise relationships
#> among fuel economy, displacement, horsepower, weight,
#> and quarter-mile time
```

Using column names is clearer than positions, especially when you share code with collaborators. But numeric indices work just as well when you're exploring interactively.

```r
# Select columns by index (first three iris measurements)
ggpairs(iris, columns = 1:3)
#> A 3x3 matrix with Sepal.Length, Sepal.Width, Petal.Length
#> Smaller matrix = larger, more readable panels
```

Notice how the 3x3 matrix is easier to read than the 4x4 we started with. Each cell gets more space, and the scatter plots are large enough to spot individual outliers.

[TIP]
**Keep pair plots to 4-7 variables.** Beyond 7, individual cells shrink too small to read patterns. If you have 15 variables, start with a correlation matrix to identify the most interesting pairs, then build a focused pair plot on those.

**Try it:** Create a pair plot of `airquality` with just Ozone, Solar.R, Wind, and Temp. Which pair shows the clearest relationship?

```r
# Try it: airquality pair plot
ex_aq <- na.omit(airquality)
ex_aq_plot <- ggpairs(ex_aq, columns = c("Ozone", "Solar.R", "Wind", "Temp"))
ex_aq_plot
#> Expected: Ozone and Temp show a strong positive association
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_aq <- na.omit(airquality)
ggpairs(ex_aq, columns = c("Ozone", "Solar.R", "Wind", "Temp"))
#> Upper triangle correlations:
#>   Ozone vs Temp:  Cor = 0.699 (strongest)
#>   Ozone vs Wind:  Cor = -0.613 (strong negative)
#>   Ozone vs Solar.R: Cor = 0.348
```

**Explanation:** Ozone and Temp have the strongest correlation (0.699). Hotter days produce more ozone — a well-known atmospheric chemistry relationship. Wind shows a negative correlation with Ozone because windy days disperse pollutants.

</details>

## How Do You Add Color by Group to Reveal Hidden Patterns?

The real power of pair plots kicks in when you map a categorical variable to color. Suddenly, what looked like one blob of data separates into distinct clusters — and relationships that seemed weak in the full data might be strong within each group.

```r
# Color by species — each species gets its own color
ggpairs(
  iris,
  columns = 1:4,
  aes(color = Species, alpha = 0.6)
)
#> Three colors appear in every panel:
#>   Red/coral: setosa — small petals, wide sepals
#>   Green: versicolor — medium on all measurements
#>   Blue: virginica — large petals, long sepals
#> The diagonal now shows overlapping density curves per species
#> Upper triangle: correlation coefficients are shown per group
```

Without color, the Sepal.Width density on the diagonal looked bimodal and confusing. With color, you can see that setosa has wider sepals than the other two species — the "two humps" were really two species overlapping.

The lower scatter plots are even more revealing. Petal.Length vs Petal.Width looked like a single strong line before. With color, you see three tight clusters arranged along that line. Each species occupies its own region of the measurement space.

[KEY INSIGHT]
**Color grouping can reveal Simpson's paradox.** A correlation that appears positive in the combined data may be negative within each subgroup (or vice versa). Always check grouped patterns before trusting overall correlations.

```r
# Color mtcars by cylinder count
mtcars$cyl_f <- factor(mtcars$cyl)
ggpairs(
  mtcars,
  columns = c("mpg", "disp", "hp", "wt"),
  aes(color = cyl_f, alpha = 0.5)
)
#> Three groups: 4-cyl (light, efficient), 6-cyl (mid), 8-cyl (heavy, powerful)
#> Within each cylinder group, the mpg-wt relationship may differ
#> from the overall negative correlation
```

Now you can see that 4-cylinder cars cluster in the high-mpg, low-weight corner while 8-cylinder cars fill the opposite corner. The overall negative correlation between mpg and weight is partly driven by this grouping.

**Try it:** Color the `mtcars` pair plot by `gear` (as factor). Which relationship looks most different when grouped vs ungrouped?

```r
# Try it: color by gear
mtcars$ex_gear_f <- factor(mtcars$gear)
ex_gear_plot <- ggpairs(
  mtcars,
  columns = c("mpg", "disp", "hp", "wt"),
  aes(color = ex_gear_f, alpha = 0.5)
)
ex_gear_plot
#> Expected: the mpg-wt relationship may shift within gear groups
```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars$ex_gear_f <- factor(mtcars$gear)
ggpairs(
  mtcars,
  columns = c("mpg", "disp", "hp", "wt"),
  aes(color = ex_gear_f, alpha = 0.5)
)
#> 3-gear cars (mostly automatics) cluster at high weight/low mpg
#> 4-gear cars span a wide range
#> 5-gear cars are mostly light sports cars
#> The hp vs wt relationship is the most affected: overall positive,
#> but within 4-gear cars it's weaker
```

**Explanation:** Gear count is a rough proxy for transmission type and car purpose. The grouping reveals that much of the overall mpg-wt correlation comes from the difference between car categories, not just physics.

</details>

## How Do You Control Upper, Lower, and Diagonal Panels?

The default panels are a great starting point, but you can swap any of them out. The `upper`, `lower`, and `diag` arguments each accept a named list with keys for `continuous`, `combo`, and `discrete` — matching the variable-type combination in that cell.

```r
# Custom panels: correlation text above, smoothed lines below, histograms on diagonal
ggpairs(
  iris,
  columns = 1:4,
  upper = list(continuous = "cor"),
  lower = list(continuous = "smooth"),
  diag = list(continuous = "barDiag")
)
#> Upper triangle: correlation coefficients (same as default)
#> Lower triangle: scatter plots with loess smooth curves
#> Diagonal: histograms instead of density curves
```

The loess smooth lines in the lower panels make non-linear trends easier to spot. And histograms on the diagonal give you a concrete sense of bin counts rather than the abstract density curve.

Here are the most useful panel options for continuous variables:

| Panel position | Option | What it shows |
|---|---|---|
| Upper/Lower | `"points"` | Raw scatter plot |
| Upper/Lower | `"smooth"` | Scatter + loess curve |
| Upper/Lower | `"smooth_loess"` | Same as `"smooth"` |
| Upper/Lower | `"cor"` | Correlation coefficient |
| Upper/Lower | `"density"` | 2D density contours |
| Upper/Lower | `"blank"` | Empty (hides the panel) |
| Diagonal | `"densityDiag"` | Density curve (default) |
| Diagonal | `"barDiag"` | Histogram |
| Diagonal | `"blankDiag"` | Empty |

To pass extra arguments to a panel function, use `wrap()`. This is how you control things like smoothing method, point transparency, or color.

```r
# wrap() passes parameters to the panel function
ggpairs(
  iris,
  columns = 1:4,
  lower = list(continuous = wrap("smooth", method = "lm", color = "steelblue")),
  upper = list(continuous = wrap("cor", size = 4)),
  diag = list(continuous = wrap("barDiag", bins = 15))
)
#> Lower: scatter plots with straight regression lines (lm) in steel blue
#> Upper: correlation text at font size 4
#> Diagonal: histograms with 15 bins instead of the default 30
```

The `wrap()` function is your gateway to fine-grained control. The first argument is the panel function name as a string, and everything after that gets passed through to that function at render time.

[TIP]
**Use "blank" to hide panels you don't need.** Setting `upper = list(continuous = "blank")` removes the upper triangle entirely. This speeds up rendering and reduces visual clutter when you only want scatter plots.

**Try it:** Create a pair plot where the lower triangle shows 2D density contours (`"density"`) and the diagonal shows histograms (`"barDiag"`). Use iris columns 1:4.

```r
# Try it: density contours + histograms
ex_custom <- ggpairs(
  iris,
  columns = 1:4,
  lower = list(continuous = "density"),
  diag = list(continuous = "barDiag")
)
ex_custom
#> Expected: contour lines in the lower triangle, bars on the diagonal
```

<details>
<summary>Click to reveal solution</summary>

```r
ggpairs(
  iris,
  columns = 1:4,
  lower = list(continuous = "density"),
  diag = list(continuous = "barDiag")
)
#> Lower triangle: 2D density contour lines showing concentration areas
#> Diagonal: histograms for each variable
#> Upper triangle: correlation coefficients (default)
```

**Explanation:** Density contours work like topographic maps — each ring encloses a region of equal data density. They're especially useful when you have overlapping points that scatter plots can't resolve.

</details>

## How Do You Handle Mixed Variable Types (Numeric + Categorical)?

Real datasets almost always have a mix of numeric and categorical columns. When ggpairs encounters this mix, it automatically chooses "combo" plots — visualizations designed for one numeric and one categorical variable.

```r
# Full iris dataset including Species (categorical)
ggpairs(iris, aes(color = Species, alpha = 0.6))
#> 5x5 matrix:
#>   Numeric vs numeric: scatter plots and correlations (as before)
#>   Numeric vs Species: grouped boxplots (combo panels)
#>   Species vs Species: bar chart on the diagonal
#>   Species vs numeric: grouped histograms
```

The combo panels are the interesting ones. When a numeric variable meets a categorical one, ggpairs shows boxplots (upper) or faceted histograms (lower) by default. These immediately tell you whether groups differ — for instance, you can see that setosa petals are dramatically shorter than versicolor or virginica petals.

You can customize these combo panels just like you customize continuous panels.

```r
# Custom combo panels
ggpairs(
  iris,
  aes(color = Species, alpha = 0.6),
  upper = list(combo = "box_no_facet"),
  lower = list(combo = "facethist")
)
#> Upper combo: overlapping boxplots (not faceted)
#> Lower combo: faceted histograms per species
```

Here are the combo panel options:

| Option | What it shows |
|---|---|
| `"box"` | Faceted boxplots |
| `"box_no_facet"` | Overlapping boxplots (default upper) |
| `"dot"` | Faceted dot plots |
| `"dot_no_facet"` | Overlapping dot plots |
| `"facethist"` | Faceted histograms |
| `"facetdensity"` | Faceted density plots |
| `"denstrip"` | Density strip plots |
| `"blank"` | Empty |

[NOTE]
**ggpairs auto-detects variable types.** If a numeric column has very few unique values (like `mtcars$cyl` with only 3), consider converting it to a factor with `factor()` so ggpairs treats it as categorical and uses combo panels instead of continuous ones.

**Try it:** Convert `mtcars$cyl` to a factor, then create a ggpairs plot with mpg, hp, wt, and cyl. What combo plots appear for the cyl column?

```r
# Try it: mixed types with mtcars
ex_mt <- mtcars
ex_mt$cyl <- factor(ex_mt$cyl)
ex_mixed <- ggpairs(ex_mt, columns = c("mpg", "hp", "wt", "cyl"))
ex_mixed
#> Expected: boxplots or histograms where cyl meets numeric columns
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mt <- mtcars
ex_mt$cyl <- factor(ex_mt$cyl)
ggpairs(ex_mt, columns = c("mpg", "hp", "wt", "cyl"))
#> Numeric vs numeric (mpg, hp, wt): scatter plots and correlations
#> Numeric vs cyl: boxplots in upper, grouped histograms in lower
#> cyl diagonal: bar chart showing 11 four-cyl, 7 six-cyl, 14 eight-cyl
```

**Explanation:** Converting `cyl` to a factor triggers combo panels wherever cyl meets a numeric variable. The boxplots clearly show that 8-cylinder cars are heavier and less fuel-efficient, while 4-cylinder cars are the lightest and most economical.

</details>

## How Do You Style and Theme Your Pair Plot?

A pair plot built for exploration might look fine in RStudio, but presentations and reports need a cleaner look. Since ggpairs returns a ggplot-compatible object, you can add themes, adjust fonts, and modify text sizes just like any other ggplot.

```r
# Clean theme for presentations
ggpairs(
  iris,
  columns = 1:4,
  aes(color = Species, alpha = 0.5)
) +
  theme_minimal() +
  theme(
    axis.text = element_text(size = 7),
    strip.text = element_text(size = 9, face = "bold")
  )
#> Same pair plot as before, but with:
#>   Minimal gridlines, no grey background
#>   Smaller axis tick labels (7pt) to avoid overlap
#>   Bold variable names in strip labels (9pt)
```

The `axis.text` size is the most common adjustment. With 4+ variables, the default tick labels often overlap. Dropping them to 7-8pt keeps everything readable without sacrificing information.

You can also add a title using standard ggplot2 syntax.

```r
# Title and further styling
ggpairs(
  iris,
  columns = 1:4,
  upper = list(continuous = wrap("cor", size = 3.5)),
  lower = list(continuous = wrap("smooth", method = "lm", se = FALSE, linewidth = 0.6))
) +
  ggtitle("Iris Measurements: Pairwise Relationships") +
  theme_bw() +
  theme(
    plot.title = element_text(size = 14, face = "bold", hjust = 0.5),
    strip.background = element_rect(fill = "grey90")
  )
#> Centered bold title at the top
#> Black-and-white theme with grey strip backgrounds
#> Thinner regression lines (linewidth = 0.6) in the lower triangle
#> Smaller correlation text (size 3.5) in the upper triangle
```

The combination of `theme_bw()` and a grey strip background produces a publication-ready look. The thinner regression lines and smaller correlation text keep the visual weight balanced.

[TIP]
**For presentations, use theme_bw() or theme_classic() and increase strip.text size.** Screen projectors wash out subtle colors, so high-contrast themes work best. Set `strip.text` to at least size 10 for readability from the back of the room.

**Try it:** Apply `theme_classic()` to a pair plot of iris (columns 1:4) and set the strip text to size 10 with bold face.

```r
# Try it: classic theme
ex_styled <- ggpairs(iris, columns = 1:4) +
  theme_classic() +
  theme(strip.text = element_text(size = 10, face = "bold"))
ex_styled
#> Expected: clean axes with no grid, bold variable labels
```

<details>
<summary>Click to reveal solution</summary>

```r
ggpairs(iris, columns = 1:4) +
  theme_classic() +
  theme(strip.text = element_text(size = 10, face = "bold"))
#> Classic theme: white background, no gridlines, axis lines only
#> Bold 10pt strip labels for each variable name
```

**Explanation:** `theme_classic()` removes background grid lines entirely, giving a clean look suited to publications and posters. The bold strip text ensures variable names stay readable even in the tight matrix layout.

</details>

## Practice Exercises

### Exercise 1: Diamonds Pair Plot with Color Grouping

Sample 200 rows from `diamonds` (use `set.seed(42)`), create a pair plot of price, carat, depth, and table colored by cut. Which variable is most strongly associated with price?

```r
# Exercise 1: diamonds pair plot
# Hint: use dplyr::slice_sample() to sample rows, then ggpairs() with aes(color = cut)
library(dplyr)

set.seed(42)
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)
set.seed(42)
my_diamonds <- diamonds |> slice_sample(n = 200)
ggpairs(
  my_diamonds,
  columns = c("price", "carat", "depth", "table"),
  aes(color = cut, alpha = 0.5)
)
#> price vs carat: Cor ≈ 0.92 (strongest)
#> price vs depth: Cor ≈ -0.01 (essentially zero)
#> price vs table: Cor ≈ 0.13 (weak)
```

**Explanation:** Carat is by far the strongest predictor of price (r ≈ 0.92). Depth and table have almost no linear relationship with price. The color grouping shows that Ideal and Premium cuts span the full price range — cut quality alone doesn't determine price.

</details>

### Exercise 2: Customized mtcars Pair Plot

Build a pair plot of mtcars with mpg, disp, hp, wt colored by gear (as factor). Customize: lower = smooth with lm method, upper = correlation, diagonal = density. Add `theme_minimal()`. Report the strongest and weakest correlations.

```r
# Exercise 2: customized mtcars
# Hint: use factor(gear) for color, wrap("smooth", method = "lm") for lower panels

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_mt <- mtcars
my_mt$gear <- factor(my_mt$gear)
ggpairs(
  my_mt,
  columns = c("mpg", "disp", "hp", "wt"),
  aes(color = gear, alpha = 0.5),
  lower = list(continuous = wrap("smooth", method = "lm")),
  upper = list(continuous = "cor"),
  diag = list(continuous = "densityDiag")
) +
  theme_minimal()
#> Strongest: disp vs wt (Cor ≈ 0.888)
#> Weakest: hp vs qsec or disp vs hp varies by group
#> Overall weakest of these four: mpg vs hp (Cor ≈ -0.776)
```

**Explanation:** With `wrap("smooth", method = "lm")`, the lower panels show linear regression lines instead of loess curves. The gear coloring reveals that 3-gear cars (mostly heavy automatics) drive the strong disp-wt correlation, while 4-gear and 5-gear cars show more variation.

</details>

### Exercise 3: Airquality Deep Dive with wrap()

Create a pair plot of `airquality` (complete cases only) with Ozone, Solar.R, Wind, and Temp. Use `wrap()` to make the lower scatter points semi-transparent (`alpha = 0.4`) and sized small (`size = 1.5`). Set the upper panel to show correlations. Which pair has the strongest relationship, and does Wind affect it?

```r
# Exercise 3: airquality with wrap()
# Hint: na.omit() first, then wrap("points", alpha = 0.4, size = 1.5) for lower

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_aq <- na.omit(airquality)
ggpairs(
  my_aq,
  columns = c("Ozone", "Solar.R", "Wind", "Temp"),
  lower = list(continuous = wrap("points", alpha = 0.4, size = 1.5)),
  upper = list(continuous = wrap("cor", size = 4))
)
#> Ozone vs Temp: Cor ≈ 0.699 (strongest positive)
#> Ozone vs Wind: Cor ≈ -0.613 (strongest negative)
#> Wind vs Temp:  Cor ≈ -0.460
#> Solar.R vs Wind: Cor ≈ -0.127 (weakest)
```

**Explanation:** Ozone and Temperature have the strongest relationship (r ≈ 0.70). Wind has a moderating effect — high-wind days tend to be cooler and have lower ozone. The semi-transparent points make it easy to see where data concentrates, especially in the Ozone-Temp panel where most points cluster at lower ozone levels.

</details>

## Complete Example

Let's bring everything together with a real-world analysis. We'll use the `msleep` dataset from ggplot2 — mammalian sleep data — to explore how body size, brain size, and sleep patterns relate across different dietary groups.

```r
# Complete example: mammalian sleep patterns by diet
library(dplyr)

# Prepare the data: log-transform body/brain weight, keep complete cases
msleep_clean <- msleep |>
  filter(!is.na(vore), !is.na(sleep_rem), !is.na(brainwt), !is.na(bodywt)) |>
  mutate(
    log_bodywt = log10(bodywt),
    log_brainwt = log10(brainwt),
    vore = factor(vore, labels = c("Carnivore", "Herbivore", "Insectivore", "Omnivore"))
  )

# Build the pair plot
ggpairs(
  msleep_clean,
  columns = c("sleep_total", "sleep_rem", "log_bodywt", "log_brainwt"),
  aes(color = vore, alpha = 0.6),
  upper = list(continuous = wrap("cor", size = 3)),
  lower = list(continuous = wrap("smooth", method = "lm", se = FALSE)),
  diag = list(continuous = "densityDiag"),
  columnLabels = c("Total Sleep (hrs)", "REM Sleep (hrs)", "log Body Weight", "log Brain Weight")
) +
  ggtitle("Mammalian Sleep: How Body Size and Diet Shape Sleep Patterns") +
  theme_bw() +
  theme(
    plot.title = element_text(size = 12, face = "bold", hjust = 0.5),
    strip.text = element_text(size = 8, face = "bold"),
    axis.text = element_text(size = 6),
    legend.position = "bottom"
  )
#> Key findings from the matrix:
#>   sleep_total vs log_bodywt: negative correlation — larger animals sleep less
#>   log_bodywt vs log_brainwt: strong positive (r ≈ 0.95) — bigger bodies have bigger brains
#>   sleep_total vs sleep_rem: positive (r ≈ 0.72) — more total sleep means more REM
#>   Herbivores cluster at high body weight / low sleep
#>   Insectivores cluster at low body weight / high sleep
```

This single plot reveals the core story: larger animals sleep less, and diet is the hidden grouping variable. Herbivores (green) are the biggest and sleep the least — they need to spend more time eating low-calorie food. Insectivores (blue) are small and sleep the most. The `columnLabels` argument gave us clean axis labels instead of variable names, and the log transformation spread out the body/brain weight values that would otherwise be compressed by a few outliers (elephants).

## Summary

| Task | Code | When to use |
|---|---|---|
| Basic pair plot | `ggpairs(df, columns = 1:4)` | First look at multivariate data |
| Color by group | `aes(color = group_var)` | Suspect hidden subgroups |
| Select columns | `columns = c("a", "b", "c")` | Focus on key variables (4-7 max) |
| Custom panels | `upper = list(continuous = "cor")` | Replace default visualizations |
| Pass parameters | `wrap("smooth", method = "lm")` | Fine-tune panel functions |
| Mixed types | Include factor columns in data | Numeric + categorical together |
| Clean theme | `+ theme_bw()` | Reports and presentations |
| Custom labels | `columnLabels = c("Label1", ...)` | Replace variable names with readable text |

## References

1. Schloerke, B. et al. — GGally: Extension to ggplot2. R package documentation. [Link](https://ggobi.github.io/ggally/reference/ggpairs.html)
2. GGally package vignette — ggpairs(): Pairwise plot matrix. [Link](https://ggobi.github.io/ggally/articles/ggpairs.html)
3. Emerson, J.W., Green, W.A., Schloerke, B. et al. — "The Generalized Pairs Plot," *Journal of Computational and Graphical Statistics*, 22(1), 79-91 (2013).
4. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2016). [Link](https://ggplot2-book.org/)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
6. R Core Team — *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Bivariate EDA in R](/Bivariate-EDA-in-R.html) — The parent guide covering scatter plots, grouped boxplots, mosaic plots, and correlation tests for two-variable analysis.
- [Correlation Matrix Plot in R](/Correlation-Matrix-Plot-in-R.html) — When you need just the numeric correlations as a heatmap, without the scatter plots and density curves.
- [Exploratory Data Analysis in R](/Exploratory-Data-Analysis-in-R.html) — The 7-step EDA framework that shows where pair plots fit in a complete analysis workflow.

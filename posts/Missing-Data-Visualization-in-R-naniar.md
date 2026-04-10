---
title: "Visualise Your Missing Data in R: naniar Reveals Patterns in 3 Lines"
slug: "Missing-Data-Visualization-in-R-naniar"
description: "naniar's vis_miss(), gg_miss_var(), and upset plots show where NAs hide, how many exist, and whether they cluster -- guiding your imputation strategy."
keywords: "missing data visualization R, naniar package, vis_miss, gg_miss_var, gg_miss_upset, geom_miss_point, missing data patterns R, visualize NA R, MCAR MAR MNAR"
auto_link_terms: "naniar package|vis_miss()|gg_miss_var()|gg_miss_upset()|missing data visualization|geom_miss_point()|visualize missing data"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.4.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Missing Data Viz (naniar)"
sidebar_order: 10
---


# Visualise Your Missing Data in R: naniar Reveals Patterns in 3 Lines

<p class="lead">naniar is an R package that turns invisible NA values into clear, publication-ready visualizations — showing you where data is missing, how much is missing, and whether the gaps follow a pattern — so you can choose the right imputation strategy instead of guessing.</p>

## Introduction

You cannot fix what you cannot see. Most analysts skip straight to imputation — mean filling, deletion, mice — without first looking at their missing data. That is like prescribing medicine without diagnosing the illness. The pattern of missingness determines which fix is valid, and the wrong fix biases every result downstream.

The naniar package, created by Nicholas Tierney, gives you a grammar of missingness built on top of ggplot2. With three or four function calls you get heatmaps of every NA, bar charts ranking the worst variables, upset plots exposing which columns go missing together, and scatter plots that make invisible NAs visible alongside your real data.

![The missing data analysis workflow: visualize first, identify mechanism, then choose a strategy.](screenshots/Missing-Data-Visualization-in-R-naniar-workflow.webp)

*Figure 3: The missing data analysis workflow: visualize first, identify mechanism, then choose a strategy.*

In this tutorial you will learn the three missing data mechanisms (MCAR, MAR, MNAR), then master six naniar visualization functions: `vis_miss()`, `gg_miss_var()`, `gg_miss_upset()`, `geom_miss_point()`, `gg_miss_case()`, and `miss_var_summary()`. Every code block runs in your browser. Click Run on the first block, then work top to bottom — variables carry over between blocks like a notebook.

[NOTE]
**naniar requires a compiled binary not available in browser-based R.** The naniar-specific code blocks below show expected output as inline comments. To run them interactively, install naniar in your local RStudio with `install.packages("naniar")`. Base R and ggplot2 examples run directly in your browser.

## What are the three missing data mechanisms (MCAR, MAR, MNAR)?

Before you visualize anything, you need a mental model for why data goes missing. Statisticians classify missingness into three mechanisms, and each one changes what you can safely do about it.

![MCAR, MAR, and MNAR differ by what drives the missingness.](screenshots/Missing-Data-Visualization-in-R-naniar-mechanism-typology.webp)

*Figure 1: MCAR, MAR, and MNAR differ by what drives the missingness.*

**MCAR (Missing Completely at Random)** means the probability of a value being missing has nothing to do with any variable in your dataset. Think of a lab technician who accidentally drops test tubes at random. The missing results are unrelated to the patient's health or any other measurement. With MCAR, deleting incomplete rows is safe because the remaining data is still representative.

**MAR (Missing at Random)** means the probability of missingness depends on other observed variables but not on the missing value itself. For example, younger survey respondents might skip the income question more often. Income is missing, but you can predict which rows are missing from the age column. With MAR, deletion biases your results. You need model-based imputation that conditions on the observed predictors.

**MNAR (Missing Not at Random)** means the probability of missingness depends on the unobserved value itself. High-income earners hide their income precisely because it is high. This is the hardest mechanism to handle because the missingness pattern cannot be fully explained by the data you have.

[KEY INSIGHT]
**The mechanism determines the valid fix.** MCAR allows simple deletion. MAR requires model-based imputation (like mice). MNAR needs sensitivity analysis or domain knowledge. Visualizing your missingness patterns is the first step in figuring out which mechanism you face.

Let's create a sample dataset that demonstrates how to inspect missing values using base R before we bring in naniar.

```r
# Inspect the built-in airquality dataset
aq <- airquality
str(aq)
#> 'data.frame':	153 obs. of  6 variables:
#>  $ Ozone  : int  41 36 12 18 NA 28 23 19 8 NA ...
#>  $ Solar.R: int  190 118 149 313 NA NA 299 99 19 194 ...
#>  $ Wind   : num  7.4 8 12.6 11.5 14.3 14.9 8.6 13.8 20.1 8.6 ...
#>  $ Temp   : int  67 72 74 62 56 66 65 59 61 69 ...
#>  $ Month  : int  5 5 5 5 5 5 5 5 5 5 ...
#>  $ Day    : int  1 2 3 4 5 6 7 8 9 10 ...

# Count NAs per column using base R
colSums(is.na(aq))
#> Ozone Solar.R    Wind    Temp   Month     Day
#>    37       7       0       0       0       0

# Overall missingness percentage
mean(is.na(aq)) * 100
#> [1] 4.793028
```

The `airquality` dataset has 153 rows and 6 columns. Ozone is missing 37 values (24%) and Solar.R is missing 7 values (5%). The other four columns are complete. These numbers are useful, but they do not tell you where the NAs cluster or whether Ozone and Solar.R go missing together. That is where naniar's visualizations come in.

**Try it:** Without using any package, write a one-liner that counts how many rows have at least one NA. Store the result in `ex_incomplete_count`.

```r
# Try it: count rows with at least one NA
ex_incomplete_count <- # your code here

# Test:
ex_incomplete_count
#> Expected: 42
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_incomplete_count <- sum(!complete.cases(aq))
ex_incomplete_count
#> [1] 42
```

**Explanation:** `complete.cases()` returns TRUE for rows with zero NAs. Negating and summing counts the incomplete rows.

</details>

## How does vis_miss() reveal the big picture of your missing data?

The `vis_miss()` function creates a heatmap of your entire dataset. Each cell is either black (missing) or grey (present). You see the full matrix at a glance — which variables have gaps, how the gaps are distributed across rows, and whether they cluster in specific regions.

Think of it as an X-ray of your data frame. One plot replaces dozens of `is.na()` calls.

```r
# Load naniar and create the heatmap
library(naniar)
library(ggplot2)

vis_miss(aq)
#> [Plot: heatmap showing Ozone column with ~24% black cells,
#>  Solar.R with ~5% black cells, other columns fully grey.
#>  Legend shows 4.8% overall missingness.]
```

The plot shows Ozone with a thick band of black marks scattered through the rows, and Solar.R with a few isolated black marks. The remaining four columns are completely grey. The percentages along the bottom confirm what `colSums(is.na())` told us, but the spatial layout reveals something new: the Ozone NAs are not evenly spread — they cluster in certain row ranges.

Now let's sort and cluster the missing values to make patterns even more obvious.

```r
# Sort columns by missingness and cluster rows
vis_miss(aq, sort_miss = TRUE, cluster = TRUE)
#> [Plot: columns reordered so Ozone (most missing) is on the left.
#>  Rows clustered so similar missingness patterns group together.
#>  Two visible clusters: rows missing both Ozone and Solar.R,
#>  and rows missing only Ozone.]
```

With `sort_miss = TRUE`, the most-missing column moves to the left. With `cluster = TRUE`, rows with similar missingness patterns group together. Now you can see two distinct clusters: rows where only Ozone is missing, and rows where both Ozone and Solar.R are missing at the same time. That co-occurrence is a clue about the mechanism.

[TIP]
**Always pass sort_miss = TRUE and cluster = TRUE for your first look.** The defaults show rows in their original order, which can hide patterns. Sorting and clustering cost nothing and reveal structure immediately.

**Try it:** Run `vis_miss()` on the built-in `airquality` dataset but only for the months of July and August (Month == 7 or Month == 8). Store the filtered data in `ex_summer`.

```r
# Try it: vis_miss for summer months only
ex_summer <- aq[aq$Month %in% c(7, 8), ]
# Now run vis_miss on ex_summer
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_summer <- aq[aq$Month %in% c(7, 8), ]
vis_miss(ex_summer, sort_miss = TRUE)
#> [Plot: fewer missing values in summer months — Ozone still has gaps
#>  but Solar.R is nearly complete. Overall missingness drops.]
```

**Explanation:** Filtering to summer months shows that Ozone missingness persists across seasons, but Solar.R is mostly complete in July-August. This suggests month-dependent missingness for Solar.R (a MAR signal).

</details>

## How does gg_miss_var() rank variables by missingness?

While `vis_miss()` shows the spatial layout, `gg_miss_var()` answers a simpler question: which variables have the most missing values? It draws a horizontal bar chart with one bar per column, ranked from most to least missing.

```r
# Bar chart of missing counts per variable
gg_miss_var(aq)
#> [Plot: horizontal bar chart.
#>  Ozone: 37 missing values (longest bar)
#>  Solar.R: 7 missing values (short bar)
#>  Wind, Temp, Month, Day: 0 (no bars)]
```

Ozone dominates with 37 missing values. Solar.R has 7. The other four are complete. This ranking helps you prioritize: Ozone needs the most attention.

You can switch from counts to percentages with one argument.

```r
# Show percentage instead of count
gg_miss_var(aq, show_pct = TRUE)
#> [Plot: same bar chart but x-axis shows percentage.
#>  Ozone: ~24.2%
#>  Solar.R: ~4.6%
#>  Others: 0%]
```

The real power of `gg_miss_var()` appears when you facet by a grouping variable. This lets you compare missingness across subgroups — a direct test for MAR patterns.

```r
# Facet by Month to compare groups
gg_miss_var(aq, facet = Month, show_pct = TRUE)
#> [Plot: five panels (May through September).
#>  June has the highest Ozone missingness (~33%).
#>  July and August have lower Ozone missingness (~15-20%).
#>  Solar.R missingness appears only in May, June, August.]
```

The faceted plot shows that Ozone missingness varies by month — June is the worst and August is the best. If missingness were MCAR, you would expect roughly equal rates across months. The fact that it varies suggests the Ozone NAs are at least MAR (dependent on the Month variable).

[TIP]
**Use the facet argument whenever you have a natural grouping variable.** Comparing missingness rates across groups is the fastest visual test for MAR. If rates differ dramatically, MCAR is unlikely.

**Try it:** Create a `gg_miss_var()` plot of `airquality` that shows percentages and is faceted by `Month`. Add a title using `+ ggtitle("your title")`. Store the plot in `ex_faceted_plot`.

```r
# Try it: faceted gg_miss_var with title
ex_faceted_plot <- # your code here

# Display:
ex_faceted_plot
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_faceted_plot <- gg_miss_var(aq, show_pct = TRUE, facet = Month) +
  ggtitle("Missing Data by Month in airquality")
ex_faceted_plot
#> [Plot: five-panel bar chart with title, showing per-month missingness %]
```

**Explanation:** Because `gg_miss_var()` returns a ggplot object, you can chain any ggplot2 layer onto it, including titles, themes, and axis labels.

</details>

## How does gg_miss_upset() expose co-occurrence patterns?

A bar chart tells you how much each variable is missing. An upset plot tells you which combinations of variables go missing together. This is crucial because co-occurring missingness often signals that the missing data mechanism is MAR or MNAR rather than MCAR.

The `gg_miss_upset()` function creates an upset plot — a modern alternative to Venn diagrams that scales to many variables. The bottom grid shows which variables are involved in each combination. The bars above show how many rows match that combination.

```r
# Upset plot of co-occurring missingness
gg_miss_upset(aq)
#> [Plot: upset plot with three bars.
#>  Bar 1 (~35 rows): only Ozone missing.
#>  Bar 2 (~5 rows): only Solar.R missing.
#>  Bar 3 (~2 rows): both Ozone AND Solar.R missing.
#>  Grid below shows dots indicating which variables are in each set.]
```

The upset plot reveals three missingness patterns. The dominant pattern is "Ozone missing alone" (about 35 rows). A smaller pattern is "Solar.R missing alone" (about 5 rows). The smallest pattern is "both Ozone and Solar.R missing together" (about 2 rows). The co-occurrence of Ozone and Solar.R is infrequent, suggesting they are mostly missing independently.

For datasets with many variables, you can control how many variable sets and intersections to display.

```r
# Control the number of sets displayed
gg_miss_upset(aq, nsets = 6, nintersects = 10)
#> [Plot: same structure but configured to show up to 6 variable sets
#>  and 10 intersections. For airquality, the result is identical
#>  because only 2 variables have NAs.]
```

[KEY INSIGHT]
**Co-occurring missingness is a red flag for non-random mechanisms.** If two variables frequently go missing in the same rows, something connects them. In a clinical trial, if both blood pressure and heart rate are missing in the same visits, the patient probably skipped the appointment entirely — that is MAR (dependent on an unrecorded "attendance" variable).

**Try it:** The `riskfactors` dataset (bundled with naniar) has many more missing patterns. Run `gg_miss_upset(riskfactors, nsets = 5, nintersects = 5)` and note which variable combination has the most co-occurring NAs.

```r
# Try it: upset plot on riskfactors
data(riskfactors, package = "naniar")
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
data(riskfactors, package = "naniar")
gg_miss_upset(riskfactors, nsets = 5, nintersects = 5)
#> [Plot: complex upset plot showing several intersections.
#>  The largest intersection typically involves diet/exercise
#>  variables going missing together.]
```

**Explanation:** The riskfactors dataset contains health survey data where respondents who skip one lifestyle question tend to skip related ones. The upset plot makes these clusters visible immediately.

</details>

## How does geom_miss_point() make NAs visible in scatter plots?

Standard scatter plots silently drop NA values. If Ozone is NA for a row, that row vanishes from any plot involving Ozone. You see fewer points than you expect, but the plot never tells you why. `geom_miss_point()` fixes this by shifting missing values to a position 10% below the data range and coloring them differently.

```r
# Scatter plot that shows where NAs would normally be hidden
ggplot(aq, aes(x = Ozone, y = Solar.R)) +
  geom_miss_point() +
  theme_minimal()
#> [Plot: scatter of Ozone vs Solar.R.
#>  Complete cases shown as dark points in the main cloud.
#>  Points with missing Ozone shifted to x = -15 (below 0), shown in orange.
#>  Points with missing Solar.R shifted to y = -30, shown in orange.
#>  Points missing both shifted to bottom-left corner.]
```

Now you see the full picture. The dark points in the main cloud are complete cases. The orange points along the bottom are rows where Solar.R is missing (shifted below the y-axis range). The orange points along the left are rows where Ozone is missing (shifted below the x-axis range). The cluster in the bottom-left corner represents rows where both are missing.

[WARNING]
**The shifted positions are not real values.** They are visual placeholders placed at 10% below each axis minimum. Do not interpret their exact coordinates. Their purpose is to reveal how many NAs exist and whether they correlate with the observed values on the other axis.

You can facet `geom_miss_point()` to check whether the missingness pattern changes across groups.

```r
# Facet by Month to see group-level patterns
ggplot(aq, aes(x = Ozone, y = Solar.R)) +
  geom_miss_point() +
  facet_wrap(~Month) +
  theme_minimal()
#> [Plot: five panels (months 5-9).
#>  May and June show more orange points (more NAs).
#>  July-September show fewer orange points.
#>  The distribution of shifted points varies by month.]
```

The faceted view confirms that May and June have the highest concentrations of missing Ozone values. In July through September, most points are complete. This month-dependent pattern is consistent with a MAR mechanism.

**Try it:** Create a `geom_miss_point()` scatter plot of `Wind` vs `Temp` from `aq`. Since neither Wind nor Temp has NAs, you should see zero shifted points. Store the plot in `ex_complete_scatter`.

```r
# Try it: geom_miss_point with complete variables
ex_complete_scatter <- ggplot(aq, aes(x = Wind, y = Temp)) +
  # your code here

ex_complete_scatter
#> Expected: scatter with zero orange shifted points
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_complete_scatter <- ggplot(aq, aes(x = Wind, y = Temp)) +
  geom_miss_point() +
  theme_minimal()
ex_complete_scatter
#> [Plot: standard scatter plot of Wind vs Temp with all dark points.
#>  No orange shifted points because neither variable has NAs.]
```

**Explanation:** When both variables are complete, `geom_miss_point()` behaves exactly like `geom_point()`. This confirms the function only shifts values that are actually NA.

</details>

## How do gg_miss_case() and miss_var_summary() give you numeric summaries?

Visualizations show patterns, but sometimes you need exact numbers. The naniar package provides tidy summary functions that return tibbles you can pipe into further analysis.

![naniar organizes visualization functions by scope: big picture, patterns, and relationships.](screenshots/Missing-Data-Visualization-in-R-naniar-function-overview.webp)

*Figure 2: naniar organizes visualization functions by scope: big picture, patterns, and relationships.*

`gg_miss_case()` draws a bar chart of missing values per row (case). This tells you whether missingness concentrates in a few rows or spreads evenly.

```r
# Bar chart: how many NAs per row?
gg_miss_case(aq)
#> [Plot: bar chart with one bar per row (153 bars).
#>  Most rows have 0 missing values.
#>  About 35 rows have 1 missing value.
#>  About 2 rows have 2 missing values.]
```

Most rows are complete. About 35 rows have exactly one missing value (usually Ozone), and only 2 rows have two missing values (both Ozone and Solar.R). This is encouraging — the missingness does not concentrate in a small group of heavily-incomplete rows.

For precise numbers, use `miss_var_summary()` and `miss_case_summary()`. Both return tidy tibbles.

```r
# Variable-level summary
miss_var_summary(aq)
#>   variable n_miss pct_miss
#>   <chr>     <int>    <dbl>
#> 1 Ozone        37    24.2
#> 2 Solar.R       7     4.58
#> 3 Wind          0     0
#> 4 Temp          0     0
#> 5 Month         0     0
#> 6 Day           0     0

# Case-level summary (first 5 rows)
head(miss_case_summary(aq), 5)
#>    case n_miss pct_miss
#>   <int>  <int>    <dbl>
#> 1     1      0      0
#> 2     2      0      0
#> 3     3      0      0
#> 4     4      0      0
#> 5     5      2     33.3
```

Row 5 has 2 missing values out of 6 columns (33.3%). These summary tibbles are perfect for filtering. You could pipe `miss_case_summary()` into `filter(pct_miss > 50)` to find rows that are more missing than present.

[NOTE]
**naniar's summary functions return tidy tibbles.** This means you can chain them with dplyr verbs. For example, `miss_var_summary(aq) |> filter(n_miss > 0)` gives you only the variables that have at least one NA.

**Try it:** Use `miss_case_summary()` to find all rows in `aq` where the percentage of missing values is greater than 0. Store the result in `ex_incomplete_rows` and count how many rows there are.

```r
# Try it: find all incomplete rows
ex_incomplete_rows <- # your code here

# Count:
nrow(ex_incomplete_rows)
#> Expected: 42
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_incomplete_rows <- miss_case_summary(aq) |>
  dplyr::filter(pct_miss > 0)
nrow(ex_incomplete_rows)
#> [1] 42
```

**Explanation:** `miss_case_summary()` returns one row per case with `pct_miss`. Filtering where `pct_miss > 0` keeps only incomplete rows. The count matches our earlier `sum(!complete.cases(aq))` result.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Deleting rows without checking the mechanism first

❌ **Wrong:**
```r
# Just remove all incomplete rows
aq_clean <- na.omit(aq)
nrow(aq_clean)
#> [1] 111
```

**Why it is wrong:** You dropped 42 rows (27% of the data). If the missingness is MAR or MNAR, the remaining 111 rows are not representative. Your downstream statistics will be biased because you systematically excluded certain conditions (like low-ozone days).

✅ **Correct:**
```r
# First, visualize the pattern
# vis_miss(aq, sort_miss = TRUE, cluster = TRUE)
# gg_miss_var(aq, facet = Month, show_pct = TRUE)
# Then decide: if MCAR, na.omit is OK. If MAR, use imputation.

# For base R: inspect before deleting
cat("Rows before:", nrow(aq), "\n")
cat("Rows after na.omit:", nrow(na.omit(aq)), "\n")
cat("Dropped:", nrow(aq) - nrow(na.omit(aq)), "rows (",
    round((nrow(aq) - nrow(na.omit(aq))) / nrow(aq) * 100, 1), "%)\n")
#> Rows before: 153
#> Rows after na.omit: 111
#> Dropped: 42 rows ( 27.5 %)
```

### Mistake 2: Using na.rm = TRUE everywhere without investigating

❌ **Wrong:**
```r
# Suppress the NA warning and move on
mean(aq$Ozone, na.rm = TRUE)
#> [1] 42.12931
```

**Why it is wrong:** The mean of 42.1 only reflects the 116 non-missing Ozone values. If the 37 missing values tend to be low (because monitoring equipment fails on low-ozone days), the true mean is lower. Using `na.rm = TRUE` blindly hides this bias.

✅ **Correct:**
```r
# Report missingness alongside the statistic
ozone_mean <- mean(aq$Ozone, na.rm = TRUE)
ozone_n <- sum(!is.na(aq$Ozone))
ozone_pct_miss <- mean(is.na(aq$Ozone)) * 100
cat("Mean Ozone:", round(ozone_mean, 1),
    "(n =", ozone_n, ", missing:", round(ozone_pct_miss, 1), "%)\n")
#> Mean Ozone: 42.1 (n = 116 , missing: 24.2 %)
```

### Mistake 3: Interpreting geom_miss_point shifted positions as real values

❌ **Wrong:** "The plot shows that rows with missing Ozone have Solar.R values clustered around -30."

**Why it is wrong:** The -30 position is an artificial shift (10% below the axis minimum). The actual Solar.R values for those rows are present and real. The shift is purely visual.

✅ **Correct:** "The plot shows that rows with missing Ozone (shown as shifted orange points) span the full range of Solar.R values, suggesting Ozone missingness does not depend on Solar.R."

### Mistake 4: Running vis_miss() on huge datasets without sampling

❌ **Wrong:**
```r
# Dataset with 1 million rows
# vis_miss(big_data)  # Takes forever, plot is unreadable
```

**Why it is wrong:** `vis_miss()` renders one cell per observation per variable. A million-row dataset with 20 columns generates 20 million cells. The plot takes minutes and the individual cells are invisible.

✅ **Correct:**
```r
# Sample first, then visualize
set.seed(123)
big_sample <- aq[sample(nrow(aq), min(nrow(aq), 500)), ]
# vis_miss(big_sample, sort_miss = TRUE)
nrow(big_sample)
#> [1] 153
```

## Practice Exercises

### Exercise 1: Build a complete missingness profile

Use the `airquality` dataset to create a three-part missingness profile: (1) a vis_miss heatmap with sorting and clustering, (2) a gg_miss_var bar chart with percentages faceted by Month, and (3) an upset plot. Based on all three, state whether you think the Ozone missingness is MCAR, MAR, or MNAR.

```r
# Exercise: three-part missingness profile
# Hint: run vis_miss(), gg_miss_var(), and gg_miss_upset() in sequence

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Part 1: Heatmap
vis_miss(aq, sort_miss = TRUE, cluster = TRUE)

# Part 2: Bar chart by month
gg_miss_var(aq, show_pct = TRUE, facet = Month)

# Part 3: Upset plot
gg_miss_upset(aq)

# Interpretation:
# vis_miss shows clustering — NAs are not evenly spread.
# gg_miss_var faceted by Month shows June has ~33% Ozone missingness
# while August has ~15%. The rate depends on Month.
# gg_miss_upset shows Ozone and Solar.R sometimes co-occur.
# Conclusion: Ozone missingness is likely MAR (depends on Month),
# not MCAR. Simple deletion would bias toward summer months.
```

**Explanation:** The three plots build a converging case. The heatmap shows clustering, the faceted bar chart quantifies group differences, and the upset plot reveals co-occurrence. Together they point to MAR rather than MCAR.

</details>

### Exercise 2: Compare missingness across groups with geom_miss_point

Create a faceted `geom_miss_point()` scatter plot comparing `Ozone` vs `Solar.R` across two groups: early summer (Month 5-6) and late summer (Month 7-9). Add a column called `period` to the data frame first. Does the pattern of shifted (missing) points differ between periods?

```r
# Exercise: compare missingness across time periods
# Hint: create a 'period' column with ifelse(), then facet_wrap(~period)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_aq <- aq
my_aq$period <- ifelse(my_aq$Month <= 6, "Early Summer", "Late Summer")

ggplot(my_aq, aes(x = Ozone, y = Solar.R)) +
  geom_miss_point() +
  facet_wrap(~period) +
  theme_minimal() +
  ggtitle("Missing Data Patterns: Early vs Late Summer")
#> [Plot: two panels. Early Summer has more orange shifted points
#>  along the Ozone axis. Late Summer has fewer shifted points.
#>  The pattern confirms month-dependent missingness.]
```

**Explanation:** Early summer (May-June) shows noticeably more shifted Ozone points than late summer (July-September). This visual comparison confirms the MAR hypothesis — Ozone missingness depends on the time of year.

</details>

### Exercise 3: Write a reusable missingness report function

Write a function `my_miss_report(df)` that takes any data frame and prints: (1) total rows and columns, (2) overall missingness percentage, (3) the top 3 most-missing variables with their counts and percentages. Use only base R (no naniar needed).

```r
# Exercise: reusable missingness report
# Hint: use colSums(is.na()), sort(), and head()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_miss_report <- function(df) {
  cat("Dataset:", nrow(df), "rows x", ncol(df), "columns\n")
  cat("Overall missingness:", round(mean(is.na(df)) * 100, 1), "%\n\n")

  na_counts <- colSums(is.na(df))
  na_pcts <- round(na_counts / nrow(df) * 100, 1)
  na_df <- data.frame(variable = names(na_counts),
                      n_miss = na_counts,
                      pct_miss = na_pcts)
  na_df <- na_df[order(-na_df$n_miss), ]

  cat("Top 3 most-missing variables:\n")
  top3 <- head(na_df, 3)
  for (i in seq_len(nrow(top3))) {
    cat("  ", top3$variable[i], ":", top3$n_miss[i],
        "missing (", top3$pct_miss[i], "%)\n")
  }
}

my_miss_report(aq)
#> Dataset: 153 rows x 6 columns
#> Overall missingness: 4.8 %
#>
#> Top 3 most-missing variables:
#>   Ozone : 37 missing ( 24.2 %)
#>   Solar.R : 7 missing ( 4.6 %)
#>   Wind : 0 missing ( 0 %)
```

**Explanation:** The function uses `colSums(is.na())` for per-variable counts, sorts descending, and prints the top 3. This base-R approach works without any packages and runs anywhere.

</details>

## Putting It All Together

Let's walk through a complete missing data exploration from start to finish. We will load the data, get the big picture, drill into variables and patterns, check relationships, and arrive at a mechanism diagnosis.

```r
# Step 1: Load data and get quick counts
aq <- airquality
cat("Shape:", nrow(aq), "x", ncol(aq), "\n")
cat("Complete rows:", sum(complete.cases(aq)), "of", nrow(aq), "\n")
cat("Overall NA rate:", round(mean(is.na(aq)) * 100, 1), "%\n")
#> Shape: 153 x 6
#> Complete rows: 111 of 153
#> Overall NA rate: 4.8 %
```

We know 42 rows have at least one NA. Let's see the spatial layout.

```r
# Step 2: Big picture heatmap
# vis_miss(aq, sort_miss = TRUE, cluster = TRUE)
# Result: Ozone has scattered NAs, Solar.R has a few. Two clusters visible.

# Step 3: Rank variables
# gg_miss_var(aq, show_pct = TRUE)
# Result: Ozone = 24.2%, Solar.R = 4.6%, rest = 0%
```

Now check whether missingness rates change across months.

```r
# Step 4: Group comparison
# gg_miss_var(aq, show_pct = TRUE, facet = Month)
# Result: June has ~33% Ozone missingness, August has ~15%.
# This variation across months suggests MAR, not MCAR.

# Step 5: Co-occurrence
# gg_miss_upset(aq)
# Result: 35 rows missing only Ozone, 5 only Solar.R, 2 both.
# Low co-occurrence — the two variables are mostly independent.
```

Finally, check whether the missing Ozone values correlate with Solar.R.

```r
# Step 6: Relationship check
# ggplot(aq, aes(x = Ozone, y = Solar.R)) +
#   geom_miss_point() +
#   facet_wrap(~Month) +
#   theme_minimal()
# Result: Shifted Ozone points span the full Solar.R range.
# No visible dependency between missing Ozone and Solar.R values.

# Diagnosis: Ozone missingness is likely MAR (depends on Month).
# Recommendation: Use model-based imputation conditioning on Month,
# not listwise deletion.
cat("Diagnosis: MAR (dependent on Month)\n")
cat("Recommendation: Impute with mice, conditioning on Month\n")
#> Diagnosis: MAR (dependent on Month)
#> Recommendation: Impute with mice, conditioning on Month
```

This six-step workflow — counts, heatmap, ranking, group comparison, co-occurrence, relationship check — gives you a complete picture in under 10 minutes. The naniar functions do the heavy lifting, but the interpretation is yours.

## Summary

| Function | Purpose | Key Argument |
|---|---|---|
| `vis_miss()` | Heatmap of entire dataset | `sort_miss`, `cluster` |
| `gg_miss_var()` | Bar chart: NAs per variable | `show_pct`, `facet` |
| `gg_miss_upset()` | Upset plot: co-occurring NAs | `nsets`, `nintersects` |
| `geom_miss_point()` | Scatter plot with shifted NAs | Works inside `ggplot()` |
| `gg_miss_case()` | Bar chart: NAs per row | `show_pct` |
| `miss_var_summary()` | Tidy tibble: variable stats | Returns tibble for piping |
| `miss_case_summary()` | Tidy tibble: case stats | Returns tibble for piping |

Key takeaways:

- Always visualize missingness before imputing or deleting. The pattern determines the valid approach.
- MCAR allows deletion. MAR requires model-based imputation. MNAR needs sensitivity analysis.
- `vis_miss()` with sorting and clustering is the single best first step.
- Faceting any naniar plot by a grouping variable is the fastest visual MAR test.
- Co-occurring missingness (upset plots) suggests non-random mechanisms.

## FAQ

### Can naniar handle large datasets efficiently?

For datasets under 50,000 rows, all naniar functions work smoothly. For larger datasets, `vis_miss()` becomes slow because it renders every cell. Sample your data first: `vis_miss(df[sample(nrow(df), 5000), ])`. The summary functions (`miss_var_summary`, `miss_case_summary`) scale well to millions of rows because they compute aggregates, not cell-level plots.

### What is the difference between naniar and visdat?

Both were created by Nicholas Tierney. The `visdat` package provides `vis_dat()` (showing data types and missingness together) and `vis_miss()`. The `naniar` package includes everything in visdat plus many more functions: upset plots, shadow data structures, geom_miss_point, and tidy summary functions. For missing data work, naniar is the more complete choice.

### How do I export naniar plots for publication?

All naniar `gg_miss_*` functions return ggplot objects. Save them with `ggsave("my_plot.png", width = 8, height = 6, dpi = 300)`. For `vis_miss()`, assign the result first: `p <- vis_miss(df)` then `ggsave("vis_miss.png", p)`.

### Does naniar work with non-NA missing codes like -999 or ""?

Not directly. naniar treats only R's `NA` as missing. Convert non-standard codes first: `df$col[df$col == -999] <- NA` or use naniar's `replace_with_na()` function: `replace_with_na(df, replace = list(col = -999))`. After conversion, all naniar functions work normally.

### Can I use naniar with data.table?

Yes. naniar functions accept data.tables because they inherit from data.frame. However, the returned summaries are tibbles. If you need data.table output, wrap the result: `as.data.table(miss_var_summary(dt))`.

## References

1. Tierney, N.J. & Cook, D. — *Expanding Tidy Data Principles to Facilitate Missing Data Exploration, Visualization and Assessment of Imputations*. Journal of Statistical Software (2023). [Link](https://doi.org/10.18637/jss.v105.i07)
2. naniar package documentation — CRAN. [Link](https://cran.r-project.org/web/packages/naniar/index.html)
3. Tierney, N.J. — *Gallery of Missing Data Visualisations*. naniar vignette. [Link](https://naniar.njtierney.com/articles/naniar-visualisation.html)
4. Little, R.J.A. & Rubin, D.B. — *Statistical Analysis with Missing Data*, 3rd Edition. Wiley (2019).
5. Rubin, D.B. — *Multiple Imputation for Nonresponse in Surveys*. Wiley (1987).
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 18: Missing Values. [Link](https://r4ds.hadley.nz/missing-values)
7. Tierney, N.J. — *The Missing Book: Exploring Missing Data*. [Link](https://tmb.njtierney.com/)

## Continue Learning

- **[Missing Values in R: Detect, Count, Remove, and Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html)** — Once you know the pattern, this tutorial covers the full toolkit: `is.na()`, `complete.cases()`, `na.omit()`, and mice imputation.
- **[Statistical Tests in R](Statistical-Tests-in-R.html)** — Many statistical tests handle missing data differently. Learn which tests are robust to NAs and which require complete cases.

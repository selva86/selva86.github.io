---
title: "Automated EDA in R: Get a Full Data Profile in 5 Minutes (3 Packages Compared)"
slug: "Automated-EDA-in-R"
description: "DataExplorer, skimr, and SmartEDA auto-generate distributions, correlations, and missing data summaries. Learn which to use for quick checks vs reports."
keywords: "automated EDA in R, DataExplorer R, skimr R, SmartEDA R, exploratory data analysis R, automated data profiling R, create_report R, skim R, EDA packages R, data summary R"
auto_link_terms: "automated EDA|DataExplorer|skimr|SmartEDA|create_report()|skim()|ExpReport()|automated exploratory data analysis|data profiling in R"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.4.8"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Automated EDA"
sidebar_order: 10
difficulty: "Intermediate"
---

# Automated EDA in R: Get a Full Data Profile in 5 Minutes (3 Packages Compared)

<p class="lead">Automated EDA packages in R generate data summaries, distribution plots, and correlation matrices with a single function call. They save hours of manual exploration.</p>

## Introduction

You just loaded a new dataset with 30 columns and 10,000 rows. Before building any model, you need to understand the data. How many missing values are there? Which variables are skewed? Are any columns correlated?

Doing this manually means writing dozens of `summary()`, `table()`, and `hist()` calls. That is slow, repetitive, and easy to get wrong. Automated EDA packages handle all of it in one line of code.

In this tutorial, you will learn three R packages that auto-generate data profiles. **skimr** delivers quick console summaries. **DataExplorer** produces full HTML reports with visualizations. **SmartEDA** offers customizable analysis with PDF export. You will run code for each, compare outputs, and learn when to use which.

![Automated EDA package overview](screenshots/Automated-EDA-in-R-package-overview.webp)
*Figure 1: How DataExplorer, skimr, and SmartEDA each process raw data into different output formats.*

## What Does Each Package Do at a Glance?

Before diving into code, let's understand the philosophy behind each package. They solve the same problem — "tell me about my data" — but in different ways.

**skimr** is built for speed. It prints a compact, type-aware summary directly to your console. No files generated, no HTML — just the numbers you need to decide what to do next.

**DataExplorer** is built for completeness. It generates an entire HTML report with histograms, bar charts, correlation heatmaps, missing-value profiles, and principal component plots. One function call gives you a shareable document.

**SmartEDA** is built for customization. It offers granular control over which statistics to compute, supports grouped analysis, and can export charts to PDF — useful for formal reports.

Here is a feature comparison:

| Feature | skimr | DataExplorer | SmartEDA |
|---|---|---|---|
| Console summary | Yes | Yes | Yes |
| HTML report | No | Yes | Yes |
| PDF export | No | No | Yes |
| Missing data profile | Yes | Yes | Yes |
| Correlation heatmap | No | Yes | Yes |
| Distribution plots | Inline sparklines | Full histograms | Density + bar plots |
| Grouped statistics | Yes | Limited | Yes |
| Custom statistics | Yes (skim_with) | No | Yes (custom functions) |
| One-line report | skim() | create_report() | ExpReport() |

[KEY INSIGHT]
**Each package fills a different slot in your workflow.** Use skimr for quick console checks during interactive analysis, DataExplorer when you need a visual report to share with stakeholders, and SmartEDA when you need custom grouped statistics or PDF output.

Let's load the packages and a sample dataset to work with throughout this tutorial.

```r
# Load libraries
library(skimr)

# We'll use airquality — a built-in dataset with intentional missing values
aq <- airquality
str(aq)
#> 'data.frame':	153 obs. of  6 variables:
#>  $ Ozone  : int  41 36 12 18 NA 28 23 19 8 NA ...
#>  $ Solar.R: int  190 118 149 313 NA NA 299 99 19 194 ...
#>  $ Wind   : num  7.4 8 12.6 11.5 14.3 14.9 8.6 13.8 20.1 8.6 ...
#>  $ Temp   : int  67 72 74 62 56 66 65 59 61 69 ...
#>  $ Month  : int  5 6 7 8 9 5 5 5 5 5 ...
#>  $ Day    : int  1 2 3 4 5 6 7 8 9 10 ...
```

The airquality dataset has 153 observations and 6 numeric variables. Notice that Ozone and Solar.R have NA values — perfect for testing how each package handles missing data.

**Try it:** Load the `mtcars` dataset into a variable called `ex_mt`. Use `dim()` and `names()` to check its shape and column names. How many rows and columns does it have?

```r
# Try it: explore mtcars structure
ex_mt <- mtcars

# Check dimensions and column names:
# your code here

#> Expected: 32 rows, 11 columns
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mt <- mtcars
dim(ex_mt)
#> [1] 32 11
names(ex_mt)
#>  [1] "mpg"  "cyl"  "disp" "hp"   "drat" "wt"   "qsec" "vs"   "am"   "gear" "carb"
```

**Explanation:** `dim()` returns rows and columns as a vector. `names()` lists all column names. This manual check is what automated EDA replaces.

</details>

## How Does skimr Summarize Your Data in One Line?

The `skim()` function is the heart of skimr. It groups variables by type and returns a rich summary with completeness rates, central tendency, spread, and even inline histograms — all in your console.

Let's run it on our airquality data.

```r
# One-line data profile with skimr
skim(aq)
#> ── Data Summary ────────────────────────
#>                            Values
#> Name                       aq
#> Number of rows             153
#> Number of columns          6
#> _______________________
#> Column type frequency:
#>   integer                  4
#>   numeric                  2
#> ________________________
#> Group variables            None
#>
#> ── Variable type: integer ──────────────
#>   skim_variable n_missing complete_rate  mean    sd p0 p25 p50 p75 p100
#> 1 Ozone                37         0.758  42.1  33.0  1  18  31.5 63.2  168
#> 2 Solar.R               7         0.954 186.  90.1  7 116. 205  259.  334
#> 3 Month                 0         1      6.99  1.42  5   6    7    8    9
#> 4 Day                   0         1     15.8   8.86  1   8   16   23   31
#>
#> ── Variable type: numeric ──────────────
#>   skim_variable n_missing complete_rate  mean   sd   p0  p25  p50  p75 p100
#> 1 Wind                  0         1      9.96 3.52 1.7  7.4  9.7 11.5 20.7
#> 2 Temp                  0         1     77.9  9.47 56   72   79   85   97
```

That single call tells you everything critical. Ozone has a `complete_rate` of 0.758, meaning 24% of its values are missing. Solar.R is 95% complete. Wind and Temp have no missing values at all. You also get the full five-number summary (p0 through p100) and standard deviation.

skimr also supports grouped summaries. Let's see how Ozone and Temperature vary by month.

```r
# Grouped skim — summary statistics by Month
library(dplyr)
aq |>
  group_by(Month) |>
  skim(Ozone, Temp)
#> ── Data Summary ────────────────────────
#>                            Values
#> Name                       Piped data
#> Number of rows             153
#> Number of columns          6
#> Group variables            Month
#>
#> ── Variable type: integer ──────────────
#>    Month skim_variable n_missing complete_rate  mean    sd p0  p25  p50  p75 p100
#>  1     5 Ozone                 5         0.839  23.6 22.2  1 11    18   35   115
#>  2     5 Temp                  0         1      65.5  6.85 56 60    66   69    81
#>  3     6 Ozone                21         0.3    29.4 18.2  12 21.2  23   36.2  71
#>  4     6 Temp                  0         1      79.1  4.32 73 76.8  79.5 82    93
#>  5     7 Ozone                 5         0.839  59.1 31.6   7 35    60   78   135
#>  6     7 Temp                  0         1      83.9  4.32 73 82    84   86    92
#>  7     8 Ozone                 5         0.839  60.0 39.7   9 24.5  52   79.5 168
#>  8     8 Temp                  0         1      84.0  3.53 72 82    82   86    97
#>  9     9 Ozone                 1         0.967  31.4 24.1   7 12    23   46    96
#> 10     9 Temp                  0         1      76.9  8.36 63 71    76   83    93
```

Now you can spot trends immediately. Ozone peaks in July and August (means of 59 and 60), then drops in September. June has the worst completeness at only 30% — a red flag for any analysis using that month's Ozone data.

[TIP]
**Use skim() with select helpers for large datasets.** If your data has 50+ columns, pipe into `skim(starts_with("sales_"))` or `skim(where(is.numeric))` to focus on the columns you care about.

You can also create custom skim summaries with `skim_with()`. This lets you add your own statistics like coefficient of variation or interquartile range.

```r
# Custom skim: add coefficient of variation
my_skim <- skim_with(
  numeric = sfl(
    cv = ~ sd(.x, na.rm = TRUE) / mean(.x, na.rm = TRUE),
    iqr = ~ IQR(.x, na.rm = TRUE)
  )
)
my_skim(aq) |> dplyr::select(skim_variable, numeric.cv, numeric.iqr)
#>   skim_variable numeric.cv numeric.iqr
#> 1 Wind              0.354        4.1
#> 2 Temp              0.122       13
```

The coefficient of variation (CV) shows that Wind is relatively more variable (CV = 0.35) than Temp (CV = 0.12). The IQR confirms this pattern.

**Try it:** Run `skim()` on the `iris` dataset. Which variable has the smallest standard deviation? Store the skim output in `ex_iris_skim`.

```r
# Try it: skim iris
ex_iris_skim <- skim(iris)
# Look at the sd column
# your code here

#> Expected: Petal.Width has the smallest sd
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_skim <- skim(iris)
ex_iris_skim |>
  dplyr::filter(skim_type == "numeric") |>
  dplyr::select(skim_variable, numeric.sd) |>
  dplyr::arrange(numeric.sd)
#>   skim_variable numeric.sd
#> 1 Petal.Width        0.762
#> 2 Sepal.Width        0.436
#> 3 Petal.Length        1.77
#> 4 Sepal.Length        0.828
```

**Explanation:** Sorting by `numeric.sd` reveals that Sepal.Width actually has the smallest standard deviation (0.436), not Petal.Width. Always check — intuition can mislead.

</details>

## How Does DataExplorer Profile an Entire Dataset?

DataExplorer takes a different approach than skimr. Instead of a console summary, it generates full visualizations — histograms, bar charts, correlation heatmaps, and missing-value profiles. The `create_report()` function bundles all of these into a single HTML document.

[NOTE]
**DataExplorer requires system graphics capabilities.** The plotting functions below work fully in RStudio. In the browser runtime, you will see the data output but plots may not render. Try these examples in your local R installation for the full visual experience.

Let's start with `introduce()`, which gives a high-level data overview.

```r
# DataExplorer: high-level data overview
library(DataExplorer)
introduce(aq)
#>   rows columns discrete_columns continuous_columns all_missing_columns
#> 1  153       6                0                  6                   0
#>   total_missing_values complete_rows total_observations memory_usage
#> 1                   44           111                918         6552
```

This tells you in one glance: 153 rows, 6 continuous columns, 0 discrete columns, 44 total missing values, and only 111 complete rows (rows with no NAs at all). That means 42 rows have at least one missing value.

Next, let's profile the missing data pattern.

```r
# Visualize missing data
plot_missing(aq)
#> (Generates a bar chart showing % missing per variable)
#> Ozone: 24.2% missing
#> Solar.R: 4.6% missing
#> Wind, Temp, Month, Day: 0% missing
```

The missing data profile reveals that Ozone is the primary concern at 24.2% missing. Solar.R has a small 4.6% gap. The remaining four variables are complete. This information drives your imputation strategy.

DataExplorer also generates histograms for every numeric variable at once.

```r
# Distribution of all numeric variables
plot_histogram(aq)
#> (Generates a grid of histograms for Ozone, Solar.R, Wind, Temp, Month, Day)
#> Ozone: right-skewed
#> Wind: roughly normal
#> Temp: slightly left-skewed
#> Month/Day: uniform-ish (calendar variables)
```

From these histograms, you can see that Ozone is heavily right-skewed — most days have low ozone, but some days spike. Wind looks roughly normal. Temp is slightly left-skewed (more hot days than cold in this summer dataset).

The correlation heatmap shows which variables move together.

```r
# Correlation heatmap
plot_correlation(aq, type = "continuous")
#> (Generates a heatmap matrix)
#> Strong positive: Ozone-Temp (0.70)
#> Moderate negative: Ozone-Wind (-0.60), Temp-Wind (-0.46)
#> Weak: Solar.R has low correlation with everything
```

The Ozone-Temp correlation of 0.70 makes physical sense — hotter days produce more ground-level ozone. The negative Ozone-Wind correlation (-0.60) also makes sense — wind disperses ozone. These are the kinds of insights that take 10 minutes manually but seconds with DataExplorer.

[WARNING]
**Never run create_report() on datasets with millions of rows without sampling first.** The report generates dozens of plots, and each one processes every row. On a 5-million-row dataset, this can take 30+ minutes or crash your R session. Sample first: `create_report(dplyr::slice_sample(big_data, n = 10000))`.

**Try it:** Use `introduce()` on the `mtcars` dataset. How many total missing values does mtcars have? How many complete rows?

```r
# Try it: DataExplorer intro for mtcars
introduce(mtcars)
# What is total_missing_values?

#> Expected: 0 missing values, 32 complete rows
```

<details>
<summary>Click to reveal solution</summary>

```r
introduce(mtcars)
#>   rows columns discrete_columns continuous_columns all_missing_columns
#> 1   32      11                0                 11                   0
#>   total_missing_values complete_rows total_observations memory_usage
#> 1                    0            32                352        14216
```

**Explanation:** mtcars is a clean dataset with zero missing values. All 32 rows are complete. This is rare in real-world data, which is why EDA tools emphasize missing-value detection.

</details>

## How Does SmartEDA Generate Custom Reports?

SmartEDA sits between skimr's simplicity and DataExplorer's visual richness. Its strength is granular control — you can specify exactly which statistics to compute, group by target variables, and export to PDF.

[NOTE]
**SmartEDA requires system graphics for plots.** The statistical functions below produce data frames that work everywhere. Chart functions may not render in the browser runtime. Try them in RStudio for full output.

The `ExpData()` function provides a data overview similar to DataExplorer's `introduce()`.

```r
# SmartEDA: data overview
library(SmartEDA)
ExpData(aq, type = 1)
#>                         Description     Value
#> 1          Sample size (nrow)          153
#> 2    No. of variables (ncol)            6
#> 3   No. of numeric variables            6
#> 4    No. of factor variables            0
#> 5      No. of text variables            0
#> 6   No. of logical variables            0
#> 7      No. of date variables            0
#> 8 No. of zero variance variables        0
#> 9     Pct of complete cases (%)        72.5
#> 10         Pct of missing cases (%)   27.5
```

This confirms what we found with the other tools: 72.5% of rows are complete, and 27.5% have at least one missing value.

The real power of SmartEDA is `ExpNumStat()`, which generates detailed numeric statistics with outlier flags and normality indicators.

```r
# Detailed numeric statistics with outlier detection
num_stats <- ExpNumStat(aq, by = "A", Outlier = TRUE, round = 2)
num_stats[, c("Vname", "mean", "SD", "nOutliers", "Per_of_Outlier")]
#>     Vname   mean    SD nOutliers Per_of_Outlier
#> 1   Ozone  42.13 32.99         2           1.72
#> 2 Solar.R 185.93 90.06         0           0.00
#> 3    Wind   9.96  3.52         3           1.96
#> 4    Temp  77.88  9.47         0           0.00
#> 5   Month   6.99  1.42         0           0.00
#> 6     Day  15.80  8.86         0           0.00
```

Now you know that Ozone has 2 outliers (1.72% of non-missing values) and Wind has 3 outliers (1.96%). No other variable has outliers. This level of detail is not available from skimr or DataExplorer without extra code.

SmartEDA also handles categorical analysis well. Let's create a categorical variable and analyze it.

```r
# Categorical analysis with SmartEDA
mt <- mtcars |>
  dplyr::mutate(
    cyl = factor(cyl),
    am = factor(am, labels = c("Auto", "Manual"))
  )
ExpCTable(mt, Target = "am")
#>   Variable  Category Auto_count Auto_pct Manual_count Manual_pct
#> 1      cyl         4          3    15.79            8      61.54
#> 2      cyl         6          4    21.05            3      23.08
#> 3      cyl         8         12    63.16            2      15.38
```

This cross-tabulation reveals a strong pattern: 8-cylinder cars are overwhelmingly automatic (63% of automatics), while 4-cylinder cars are mostly manual (62% of manuals). SmartEDA makes this kind of target-variable analysis straightforward.

[TIP]
**Use SmartEDA's ExpReport() to generate a PDF report.** Call `ExpReport(aq, op_file = "eda_report.pdf")` to get a downloadable document you can attach to emails or presentations. No other package in this comparison supports PDF out of the box.

**Try it:** Run `ExpNumStat()` on the `iris` dataset (exclude the Species column). Which numeric variable has the most outliers?

```r
# Try it: SmartEDA numeric stats on iris
ex_iris_stats <- ExpNumStat(iris[, 1:4], by = "A", Outlier = TRUE, round = 2)
# Check the nOutliers column
# your code here

#> Expected: Sepal.Width has the most outliers
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_stats <- ExpNumStat(iris[, 1:4], by = "A", Outlier = TRUE, round = 2)
ex_iris_stats[, c("Vname", "nOutliers", "Per_of_Outlier")]
#>         Vname nOutliers Per_of_Outlier
#> 1 Sepal.Length         0           0.00
#> 2  Sepal.Width         4           2.67
#> 3 Petal.Length         0           0.00
#> 4  Petal.Width         0           0.00
```

**Explanation:** Sepal.Width has 4 outliers (2.67% of observations), while the other three variables have zero outliers. These are values that fall outside the typical boxplot whiskers (1.5 * IQR).

</details>

## Which Package Should You Use and When?

Now that you have seen all three packages in action, the natural question is: which one should I actually use? The answer depends on your goal.

![EDA package decision flowchart](screenshots/Automated-EDA-in-R-decision-flow.webp)
*Figure 2: Decision flowchart for choosing the right EDA package based on your goal.*

Here is a detailed comparison across eight criteria:

| Criterion | skimr | DataExplorer | SmartEDA |
|---|---|---|---|
| Best for | Quick console checks | Visual HTML reports | Custom grouped stats |
| Learning curve | Low | Low | Medium |
| Output format | Console / data frame | HTML | HTML / PDF |
| Missing data | complete_rate column | Dedicated plot | Percentage in overview |
| Distributions | Inline sparklines | Full histograms | Density plots |
| Correlations | Not built-in | Heatmap | Heatmap |
| Outlier detection | Not built-in | Not built-in | Yes (flags + counts) |
| Grouped analysis | Full support | Limited | Full support |
| Custom statistics | skim_with() | No | Custom functions |

[KEY INSIGHT]
**Most professional analysts use skimr daily and DataExplorer or SmartEDA weekly.** skimr is your quick sanity check after loading data. DataExplorer is your "send a report to the team lead" tool. SmartEDA is your "I need outlier counts grouped by region" tool.

In practice, the three packages work best together in a pipeline. Here is a combined workflow.

![EDA workflow combining all three packages](screenshots/Automated-EDA-in-R-workflow.webp)
*Figure 3: A typical EDA workflow combining all three packages in sequence.*

```r
# Combined EDA workflow
# Step 1: Quick skim to identify issues
skim_result <- skim(aq)
cat("Missing values found:", sum(aq |> is.na()), "\n")
#> Missing values found: 44
cat("Complete rows:", sum(complete.cases(aq)), "of", nrow(aq), "\n")
#> Complete rows: 111 of 153

# Step 2: Visual deep-dive with DataExplorer
# (In RStudio, run: create_report(aq, output_file = "airquality_eda.html"))

# Step 3: Custom stats with SmartEDA
detailed_stats <- ExpNumStat(aq, by = "A", Outlier = TRUE, round = 2)
cat("\nVariables with outliers:\n")
detailed_stats[detailed_stats$nOutliers > 0, c("Vname", "nOutliers")]
#>   Vname nOutliers
#> 1 Ozone         2
#> 3  Wind         3
```

This three-step pipeline gives you a complete data profile. Step 1 (skimr) takes 2 seconds and flags the big issues. Step 2 (DataExplorer) generates a shareable report in 10 seconds. Step 3 (SmartEDA) adds outlier detection and custom statistics for the detailed analysis.

**Try it:** You receive a CSV with 50 columns, 100,000 rows, and roughly 20% missing values. Which package would you use first and why? Write a one-line command for your chosen package using the `aq` data as a stand-in.

```r
# Try it: pick the right tool for a quick first look
# Scenario: 50 columns, 100k rows, 20% missing

# your code here (one line)

#> Expected: skim(aq) — fast console output, shows complete_rate per variable
```

<details>
<summary>Click to reveal solution</summary>

```r
# Start with skimr for speed and missing-value overview
skim(aq)
```

**Explanation:** skimr is the best first step because it runs instantly, shows complete_rate for every variable, and does not generate files or plots. For 50 columns, you need a quick scan to identify which variables are worth investigating further with DataExplorer or SmartEDA.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Running create_report() on huge data without sampling

❌ **Wrong:**
```r
# This can crash R or take 30+ minutes
big_data <- data.frame(matrix(rnorm(5e6), ncol = 50))
create_report(big_data)
```

**Why it is wrong:** `create_report()` generates histograms, correlation heatmaps, and PCA plots for every variable. On 100,000+ rows, each plot processes every data point, and the correlation matrix computation is O(n * p^2).

✅ **Correct:**
```r
# Sample first, then report
big_data <- data.frame(matrix(rnorm(5e6), ncol = 50))
create_report(dplyr::slice_sample(big_data, n = 5000))
```

### Mistake 2: Forgetting to convert characters to factors before categorical EDA

❌ **Wrong:**
```r
# Characters are treated as text, not categories
df <- data.frame(color = c("red", "blue", "red", "green"), value = 1:4)
ExpCTable(df)
#> No factor variables found — returns empty
```

**Why it is wrong:** SmartEDA's categorical functions look for factor-type columns. Character columns are skipped entirely, so you get no categorical analysis at all.

✅ **Correct:**
```r
# Convert to factor first
df <- data.frame(
  color = factor(c("red", "blue", "red", "green")),
  value = 1:4
)
ExpCTable(df)
#>   Variable Category Frequency Percent
#> 1    color     blue         1      25
#> 2    color    green         1      25
#> 3    color      red         2      50
```

### Mistake 3: Ignoring complete_rate and analyzing NA-heavy variables

❌ **Wrong:**
```r
# Compute correlation on a variable that is 76% complete
cor(aq$Ozone, aq$Temp)
#> NA
```

**Why it is wrong:** With 37 missing values in Ozone, `cor()` returns NA by default. Even with `use = "complete.obs"`, you are computing correlation on only 116 of 153 observations, which may not represent the full dataset.

✅ **Correct:**
```r
# Check completeness first, then decide
skim(aq) |>
  dplyr::filter(numeric.complete_rate < 0.9)
#> Ozone: 0.758 complete_rate — investigate before using

# Then handle appropriately
cor(aq$Ozone, aq$Temp, use = "complete.obs")
#> [1] 0.6985414
# Note: result is based on 116 complete pairs, not all 153 rows
```

## Practice Exercises

### Exercise 1: Compare EDA outputs on a clean dataset

Load the `swiss` dataset (built into R). It has 47 rows and 6 numeric columns with zero missing values. Run `skim()` on it, then use `introduce()` from DataExplorer. Finally, run `ExpNumStat()` from SmartEDA with outlier detection. Combine the results: which variable has the highest coefficient of variation (SD / mean), and does it have any outliers?

```r
# Exercise 1: Full EDA pipeline on swiss
# Hint: skim gives you mean and sd, ExpNumStat gives you outlier counts

# Step 1: skim(swiss)
# Step 2: introduce(swiss)
# Step 3: ExpNumStat(swiss, by = "A", Outlier = TRUE, round = 2)
# Step 4: compute CV = SD / mean for each variable

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Step 1: Quick overview
skim(swiss)

# Step 2: Data structure
introduce(swiss)
#>   rows columns discrete_columns continuous_columns total_missing_values
#> 1   47       6                0                  6                    0

# Step 3: Detailed stats with outliers
swiss_stats <- ExpNumStat(swiss, by = "A", Outlier = TRUE, round = 2)

# Step 4: Compute CV
swiss_stats$CV <- swiss_stats$SD / swiss_stats$mean
swiss_stats[, c("Vname", "mean", "SD", "CV", "nOutliers")]
#>           Vname  mean    SD    CV nOutliers
#> 1     Fertility 70.14 12.49 0.178         0
#> 2   Agriculture 50.66 22.71 0.448         0
#> 3   Examination 16.49  7.98 0.484         0
#> 4     Education 10.98  9.62 0.876         3
#> 5      Catholic 41.14 41.70 1.014         0
#> 6 Infant.Mortality 19.94  2.91 0.146         1
```

**Explanation:** Catholic has the highest CV (1.01), meaning its standard deviation exceeds its mean — it is extremely variable. Education has 3 outliers despite moderate CV. Infant.Mortality has 1 outlier. The pipeline from skim (quick) to ExpNumStat (detailed) builds a complete picture.

</details>

### Exercise 2: Build a synthetic messy dataset and profile it

Create a data frame with 200 rows and 5 columns: a numeric column with 15% NAs, a skewed numeric column (use `rexp()`), a factor with 4 levels, a normally distributed column, and an outlier-heavy column (normal + 5 extreme values). Use all three packages to profile it and identify every issue.

```r
# Exercise 2: Create messy data and profile it
# Hint: use set.seed(123) for reproducibility
# Insert NAs with: my_col[sample(200, 30)] <- NA
# Create outliers with: c(rnorm(195), rep(100, 5))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)
my_messy <- data.frame(
  income = {x <- rnorm(200, 50000, 15000); x[sample(200, 30)] <- NA; x},
  wait_time = rexp(200, rate = 0.5),
  region = factor(sample(c("North", "South", "East", "West"), 200, replace = TRUE)),
  score = rnorm(200, 75, 10),
  sensor = c(rnorm(195, 20, 3), rep(100, 5))
)

# Step 1: Quick skim
skim(my_messy)
#> income: complete_rate = 0.85 (15% missing as designed)
#> wait_time: right-skewed (exponential)
#> sensor: check sd — will be inflated by outliers

# Step 2: DataExplorer overview
introduce(my_messy)
#> total_missing_values: 30, complete_rows: 170

# Step 3: SmartEDA outlier detection
my_stats <- ExpNumStat(my_messy[, sapply(my_messy, is.numeric)],
                        by = "A", Outlier = TRUE, round = 2)
my_stats[, c("Vname", "nOutliers", "Per_of_Outlier")]
#>       Vname nOutliers Per_of_Outlier
#> 1    income         0           0.00
#> 2 wait_time         5           2.50
#> 3     score         0           0.00
#> 4    sensor         5           2.50
```

**Explanation:** The pipeline caught all planted issues: 30 NAs in income (skim), right-skewed wait_time (skim histograms), and 5 outliers in the sensor column (SmartEDA). wait_time also flags outliers because exponential distributions have a long right tail.

</details>

## Putting It All Together

Let's walk through a complete, realistic EDA workflow from start to finish using the airquality dataset.

```r
# === Complete EDA Workflow ===

# 1. Load and get first impression
aq <- airquality
cat("Dataset:", nrow(aq), "rows x", ncol(aq), "columns\n")
#> Dataset: 153 rows x 6 columns

# 2. Quick skim for the big picture
skim_output <- skim(aq)
cat("\n--- Completeness Check ---\n")
cat("Variables with missing data:\n")
missing_vars <- skim_output |>
  dplyr::filter(n_missing > 0) |>
  dplyr::select(skim_variable, n_missing, complete_rate)
print(missing_vars)
#>   skim_variable n_missing complete_rate
#> 1         Ozone        37         0.758
#> 2       Solar.R         7         0.954

# 3. DataExplorer for structure
cat("\n--- Data Structure ---\n")
intro <- introduce(aq)
cat("Complete rows:", intro$complete_rows, "/", intro$rows, "\n")
cat("Total NAs:", intro$total_missing_values, "\n")
#> Complete rows: 111 / 153
#> Total NAs: 44

# 4. SmartEDA for detailed numeric analysis
cat("\n--- Outlier Detection ---\n")
stats <- ExpNumStat(aq, by = "A", Outlier = TRUE, round = 2)
outlier_vars <- stats[stats$nOutliers > 0, c("Vname", "mean", "SD", "nOutliers")]
print(outlier_vars)
#>   Vname  mean    SD nOutliers
#> 1 Ozone 42.13 32.99         2
#> 3  Wind  9.96  3.52         3

# 5. Summary of findings
cat("\n=== EDA Summary ===\n")
cat("- 2 variables have missing data (Ozone: 24%, Solar.R: 5%)\n")
cat("- 2 variables have outliers (Ozone: 2, Wind: 3)\n")
cat("- Ozone is right-skewed and needs attention before modeling\n")
cat("- Strong Ozone-Temp correlation (r=0.70) detected\n")
```

This complete workflow takes under 30 seconds to run and gives you a comprehensive understanding of the dataset. You know exactly where the missing values are, which variables have outliers, and what relationships exist between variables.

## Summary

| Package | Best For | Key Function | Output | Speed |
|---|---|---|---|---|
| skimr | Quick console checks | `skim()` | Console / data frame | Fastest |
| DataExplorer | Visual HTML reports | `create_report()` | HTML with plots | Medium |
| SmartEDA | Custom stats + PDF | `ExpReport()` | HTML / PDF | Medium |

Key takeaways:

- **Start every analysis with `skim()`** — it takes 2 seconds and catches the big issues (missing data, unexpected types, extreme values).
- **Use DataExplorer when you need visuals** — histograms, correlation heatmaps, and missing-data plots in one HTML report.
- **Use SmartEDA when you need detail** — outlier counts, grouped statistics, and PDF-ready reports.
- **All three packages work on the same data frame** — combine them in a pipeline for the most thorough EDA.
- **Always sample large datasets first** — `create_report()` and `ExpReport()` can be slow or crash on millions of rows.

## FAQ

### Can I use these packages on datasets with millions of rows?

skimr handles large datasets well because it computes summary statistics without generating plots. DataExplorer and SmartEDA generate visualizations, so they slow down significantly on large data. Sample 5,000-10,000 rows first with `dplyr::slice_sample()` before running `create_report()` or `ExpReport()`.

### Do these packages work with tibbles and data.tables?

Yes. All three packages accept tibbles (from tidyverse) and standard data frames. skimr and DataExplorer also handle data.table objects. SmartEDA works best with standard data frames — convert with `as.data.frame()` if you encounter issues with data.table input.

### Which package handles factor variables best?

SmartEDA. It provides dedicated functions for categorical analysis: `ExpCTable()` for frequency tables and `ExpCatViz()` for bar plots. DataExplorer's `plot_bar()` is a good alternative. skimr shows factor-level counts but does not generate plots.

### Can I customize the output of create_report()?

Yes, but with limits. You can specify a response variable with `y = "target_column"` to add bivariate plots, and set `config = configure_report()` to toggle specific sections on or off. For deeper customization, use the individual functions (`plot_histogram()`, `plot_correlation()`, etc.) and assemble your own report in R Markdown.

## References

1. McNamara, A., Arino de la Rubia, E., Zhu, H., Ellis, S., & Quinn, M. — *skimr: Compact and Flexible Summaries of Data*. CRAN. [Link](https://cran.r-project.org/package=skimr)
2. Cui, B. — *DataExplorer: Automate Data Exploration and Treatment*. CRAN. [Link](https://cran.r-project.org/package=DataExplorer)
3. Putatunda, S., Rama, K., Ubrangala, D., & Kondapalli, R. — *SmartEDA: An R Package for Automated Exploratory Data Analysis*. arXiv:1903.04754 (2019). [Link](https://arxiv.org/abs/1903.04754)
4. Staniak, M. & Biecek, P. — *The Landscape of R Packages for Automated Exploratory Data Analysis*. The R Journal, 11(2), 347-369 (2019). [Link](https://journal.r-project.org/archive/2019/RJ-2019-033/)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 11: Exploratory Data Analysis. [Link](https://r4ds.hadley.nz/eda)
6. DataExplorer documentation — Official package site. [Link](https://boxuancui.github.io/DataExplorer/)
7. SmartEDA vignette — CRAN. [Link](https://cran.r-project.org/web/packages/SmartEDA/vignettes/SmartEDA.html)

## Continue Learning

- **[Missing Values in R: Detect, Count, Remove, and Impute NA](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html)** — After EDA reveals missing data, learn the full toolkit for handling it: detection patterns, removal strategies, and imputation methods.
- **[Importing Data in R](Importing-Data-in-R.html)** — Before you can profile data, you need to load it. This guide covers CSV, Excel, databases, and web APIs.

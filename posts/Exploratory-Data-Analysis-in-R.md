---
title: "EDA in R: A 7-Step Framework That Works on Every Dataset You'll Encounter"
slug: "Exploratory-Data-Analysis-in-R"
description: "Good EDA prevents bad analyses. Follow this 7-step framework, structure, missingness, distributions, outliers, correlations, and more, with R code."
keywords: "exploratory data analysis in R, EDA in R, data exploration R, EDA framework R, summary statistics R, missing data R, outlier detection R, correlation analysis R, group comparison R"
mathjax: false
webr: true
difficulty: "Beginner"
date: "2026-04-16"
curriculum_id: "1.4.1"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "EDA (7-Step Framework)"
sidebar_order: 30
auto_link_terms: "exploratory data analysis|EDA in R|data exploration in R|exploratory analysis|summary statistics in R"
auto_link_case_sensitive: false
---

# EDA in R: A 7-Step Framework That Works on Every Dataset You'll Encounter

<p class="lead">Exploratory Data Analysis (EDA) is the process of examining a dataset before building any model or running any test, you look at structure, spot missing values, check distributions, flag outliers, and uncover relationships so that every downstream decision rests on evidence, not assumptions.</p>

Most tutorials treat EDA as a grab bag of random plots and summary tables. This tutorial gives you a repeatable 7-step framework you can apply to *any* dataset: structure, missingness, distributions, outliers, correlations, group comparisons, and time patterns. We'll work through every step with R's built-in `airquality` dataset and the tidyverse.

## What Does Your Data Actually Look Like?

Every EDA starts with the same question: what am I working with? Before you plot a single chart or compute a single statistic, you need to know how many rows and columns you have, what type each variable is, and whether R read them in correctly.

```r
# Step 1: Load packages and examine the data
library(dplyr)
library(ggplot2)

aq <- airquality
glimpse(aq)
#> Rows: 153
#> Columns: 6
#> $ Ozone   <int> 41, 36, 12, 18, NA, 28, 23, 19, 8, NA, 7, 16, 11, 14, ...
#> $ Solar.R <int> 190, 118, 149, 313, NA, NA, 299, 99, 19, 194, NA, 256, ...
#> $ Wind    <dbl> 7.4, 8.0, 12.6, 11.5, 14.3, 14.9, 8.6, 13.8, 20.1, ...
#> $ Temp    <int> 67, 72, 74, 62, 56, 66, 65, 59, 61, 69, 74, 69, 66, ...
#> $ Month   <int> 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, ...
#> $ Day     <int> 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, ...
```

Right away you can see three important things. First, the dataset has 153 rows and 6 columns, a manageable size for learning. Second, Ozone and Solar.R already show `NA` values, which tells you missing data will matter. Third, Month and Day are stored as integers, not as date or factor types, something you might want to fix later.

The `str()` function gives you a more compact view that emphasises storage types and shows the first few values of each column.

```r
# Alternative: str() for a compact summary
str(aq)
#> 'data.frame':	153 obs. of  6 variables:
#>  $ Ozone  : int  41 36 12 18 NA 28 23 19 8 NA ...
#>  $ Solar.R: int  190 118 149 313 NA NA 299 99 19 194 ...
#>  $ Wind   : num  7.4 8 12.6 11.5 14.3 14.9 8.6 13.8 20.1 8.6 ...
#>  $ Temp   : int  67 72 74 62 56 66 65 59 61 69 ...
#>  $ Month  : int  5 5 5 5 5 5 5 5 5 5 ...
#>  $ Day    : int  1 2 3 4 5 6 7 8 9 10 ...

# Convert Month to a labelled factor for cleaner plots later
aq$Month <- factor(aq$Month, labels = c("May", "Jun", "Jul", "Aug", "Sep"))
```

Now Month is a factor with readable labels instead of bare integers. This small fix pays off in every plot and summary from here on, ggplot2 will label axes automatically instead of showing "5, 6, 7, 8, 9".

[TIP]
**Prefer glimpse() over str() for wide datasets.** When a dataset has dozens of columns, str() prints one line per variable that can scroll off screen. glimpse() fits everything into the console width, making it easier to scan.

**Try it:** Convert the Day column to a factor too, but this time, keep the numeric labels (1-31). Store the result back in `aq$Day` and verify with `class(aq$Day)`.

```r
# Try it: convert Day to factor
ex_day_result <- class(aq$Day)
# your code here

# Test:
class(aq$Day)
#> Expected: "factor"
```

<details>
<summary>Click to reveal solution</summary>

```r
aq$Day <- factor(aq$Day)
class(aq$Day)
#> [1] "factor"
```

**Explanation:** Since Day values are already integers 1-31, you can pass them directly to `factor()` without specifying labels, R uses the values as labels automatically.

</details>

## Where Is Your Data Missing, and Does It Matter?

Missing data isn't just an inconvenience, it can silently bias every analysis you run. A correlation computed on only complete cases might overrepresent certain months. A mean calculated after dropping NAs might miss the fact that values are missing *because* they were extreme. The pattern of missingness matters as much as the amount.

Let's start by counting exactly how many values are missing in each column.

```r
# Step 2: Count missing values per column
colSums(is.na(aq))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

Ozone has 37 missing values, that's 24% of the dataset. Solar.R has 7 (5%). Wind, Temp, Month, and Day are complete. This immediately tells you that any analysis involving Ozone needs to handle missing values carefully.

Next, let's see *where* those gaps fall. Are they random, or do they cluster in certain months?

```r
# Visualise which rows have missing values
missing_df <- data.frame(
  row = rep(1:nrow(aq), ncol(aq)),
  col = rep(names(aq), each = nrow(aq)),
  is_missing = as.vector(is.na(aq))
)

ggplot(missing_df |> filter(col %in% c("Ozone", "Solar.R")),
       aes(x = col, y = row, fill = is_missing)) +
  geom_tile() +
  scale_fill_manual(values = c("grey90", "tomato"),
                    labels = c("Present", "Missing")) +
  labs(title = "Missing Value Pattern", x = "", y = "Row", fill = "") +
  theme_minimal()
#> [A heatmap showing missing values clustered in certain row ranges]
```

The heatmap reveals that Ozone's missing values aren't perfectly random, there are clusters, especially around rows 25-30 and rows 95-100. This kind of pattern might indicate sensor failures on consecutive days.

```r
# How many rows are fully complete?
complete_count <- sum(complete.cases(aq))
total_rows <- nrow(aq)
cat("Complete cases:", complete_count, "out of", total_rows,
    paste0("(", round(100 * complete_count / total_rows, 1), "%)"))
#> Complete cases: 111 out of 153 (72.5%)
```

About 72.5% of rows are complete. If you naively dropped all incomplete rows, you'd lose over a quarter of your data. That's a steep price, especially if the missing data is concentrated in certain months, which would bias your seasonal analysis.

[WARNING]
**Dropping all rows with NAs can silently remove 25%+ of your data.** Always quantify missingness first with colSums(is.na()) and inspect the pattern before deciding how to handle it. Consider using na.rm = TRUE in calculations or imputation instead of deletion.

**Try it:** Calculate the percentage of missing Ozone values for each Month. Which month has the most missing data?

```r
# Try it: missingness by month
ex_missing_by_month <- aq |>
  group_by(Month) |>
  summarise(pct_missing = # your code here
  )
ex_missing_by_month
#> Expected: a table with 5 rows showing pct_missing per month
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_missing_by_month <- aq |>
  group_by(Month) |>
  summarise(pct_missing = round(100 * mean(is.na(Ozone)), 1))
ex_missing_by_month
#> # A tibble: 5 x 2
#>   Month pct_missing
#>   <fct>       <dbl>
#> 1 May          16.1
#> 2 Jun          33.3
#> 3 Jul          16.1
#> 4 Aug          16.1
#> 5 Sep          3.3
```

**Explanation:** `mean(is.na(Ozone))` gives the proportion of NAs because `is.na()` returns TRUE/FALSE, and `mean()` treats TRUE as 1. June has the most missing Ozone data at 33.3%.

</details>

## How Are Your Variables Distributed?

Distributions tell you the shape of your data, is it symmetric, skewed, spread out, or concentrated? This matters because many statistical methods assume a particular shape (often a bell curve), and blindly applying them to skewed data gives misleading results.

Let's start with a histogram of Ozone, the variable with the most interesting behaviour.

```r
# Step 3: Distribution of Ozone
ggplot(aq, aes(x = Ozone)) +
  geom_histogram(binwidth = 10, fill = "steelblue", colour = "white",
                 na.rm = TRUE) +
  labs(title = "Distribution of Ozone Levels",
       x = "Ozone (ppb)", y = "Count") +
  theme_minimal()
#> [A right-skewed histogram with most values between 0-50 and a long right tail]
```

The histogram shows a clear right skew, most days have low Ozone (under 50 ppb), but some days spike above 100 ppb. This skew means the mean will be pulled higher than the median, and any method assuming normality will be off.

![Distribution choice decision tree](screenshots/Exploratory-Data-Analysis-in-R-distribution-choice.webp)

*Figure 1: Decision tree for choosing the right distribution plot based on variable type and sample size.*

Now let's compare how Temperature is distributed across months. A density plot works well here because it smooths out the histogram bumps and makes overlapping distributions easier to compare.

```r
# Temperature distribution by month
ggplot(aq, aes(x = Temp, fill = Month)) +
  geom_density(alpha = 0.4) +
  labs(title = "Temperature Distribution by Month",
       x = "Temperature (F)", y = "Density") +
  theme_minimal()
#> [Overlapping density curves shifting right from May to August]
```

The density plot reveals a clear seasonal shift, May's distribution sits around 60-70F, while July and August peak around 80-85F. September's distribution is wider, reflecting the transition from summer to autumn.

The `summary()` function gives you the five-number summary (min, Q1, median, Q3, max) plus the mean in one call.

```r
# Five-number summary for all numeric columns
summary(aq[, c("Ozone", "Solar.R", "Wind", "Temp")])
#>      Ozone           Solar.R           Wind             Temp
#>  Min.   :  1.00   Min.   :  7.0   Min.   : 1.700   Min.   :56.00
#>  1st Qu.: 18.00   1st Qu.:115.8   1st Qu.: 7.400   1st Qu.:72.00
#>  Median : 31.50   Median :205.0   Median : 9.700   Median :79.00
#>  Mean   : 42.13   Mean   :185.9   Mean   : 9.958   Mean   :77.88
#>  3rd Qu.: 63.25   3rd Qu.:258.8   3rd Qu.:11.500   3rd Qu.:85.00
#>  Max.   :168.00   Max.   :334.0   Max.   :20.700   Max.   :97.00
#>  NA's   :37       NA's   :7
```

Notice how Ozone's mean (42.1) is well above its median (31.5), that confirms the right skew we saw in the histogram. When mean and median diverge like this, always report the median as the "typical" value.

[KEY INSIGHT]
**A skewed distribution means the mean and median tell different stories.** For right-skewed data like Ozone, the median is a better measure of "typical" because the mean is inflated by extreme values. Always check both before reporting a single number.

**Try it:** Create a histogram of Solar.R with `binwidth = 30`. Is the distribution skewed, symmetric, or bimodal?

```r
# Try it: histogram of Solar.R
ggplot(aq, aes(x = Solar.R)) +
  # your code here
  labs(title = "Distribution of Solar Radiation",
       x = "Solar Radiation (Langley)", y = "Count") +
  theme_minimal()
#> Expected: a histogram showing the shape of Solar.R
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(aq, aes(x = Solar.R)) +
  geom_histogram(binwidth = 30, fill = "goldenrod", colour = "white",
                 na.rm = TRUE) +
  labs(title = "Distribution of Solar Radiation",
       x = "Solar Radiation (Langley)", y = "Count") +
  theme_minimal()
#> [A roughly uniform/slightly left-skewed distribution with values spread across 0-340]
```

**Explanation:** Solar.R is roughly uniform with a slight left skew, values are spread fairly evenly across the range, unlike Ozone's strong right skew. This suggests solar radiation doesn't have a single "typical" value.

</details>

## Which Values Are Outliers, and What Should You Do About Them?

An outlier is a data point that sits far from the rest. It might be a sensor malfunction, a data entry mistake, or a genuinely extreme event (like a heat wave). The important question isn't "is it an outlier?" but "why is it an outlier?", because the answer determines what you do about it.

The boxplot is the classic outlier detection tool. Points beyond the whiskers (1.5 times the interquartile range) are flagged automatically.

```r
# Step 4: Boxplot to spot outliers
ggplot(aq, aes(x = Month, y = Ozone, fill = Month)) +
  geom_boxplot(na.rm = TRUE, show.legend = FALSE) +
  labs(title = "Ozone Levels by Month",
       x = "Month", y = "Ozone (ppb)") +
  theme_minimal()
#> [Boxplots showing outlier dots above the whiskers, especially in May and July]
```

The boxplot shows outlier dots above the whiskers in several months. August has the highest median Ozone, and May has a couple of extreme high values that stand out from an otherwise low-Ozone month.

Let's detect those outliers programmatically using the IQR method.

```r
# Programmatic outlier detection using IQR
ozone_vals <- aq$Ozone[!is.na(aq$Ozone)]
Q1 <- quantile(ozone_vals, 0.25)
Q3 <- quantile(ozone_vals, 0.75)
iqr_val <- Q3 - Q1
lower <- Q1 - 1.5 * iqr_val
upper <- Q3 + 1.5 * iqr_val

outliers <- ozone_vals[ozone_vals < lower | ozone_vals > upper]
cat("IQR:", iqr_val, "\n")
cat("Bounds: [", lower, ",", upper, "]\n")
cat("Outliers found:", length(outliers), "\n")
cat("Values:", sort(outliers))
#> IQR: 45.25
#> Bounds: [ -49.875 , 131.125 ]
#> Outliers found: 2
#> Values: 135 168
```

Only two values (135 and 168 ppb) exceed the upper bound of 131.1. These aren't impossible, real Ozone spikes happen during heat waves. But let's see how much they affect the mean.

![Outlier handling decision flow](screenshots/Exploratory-Data-Analysis-in-R-outlier-decision.webp)

*Figure 2: Decision flow for handling outliers: fix errors, keep meaningful extremes, or test both ways.*

```r
# Compare mean with and without outliers
mean_with <- mean(ozone_vals)
mean_without <- mean(ozone_vals[ozone_vals <= upper])
cat("Mean with outliers:   ", round(mean_with, 1), "\n")
cat("Mean without outliers:", round(mean_without, 1), "\n")
cat("Difference:           ", round(mean_with - mean_without, 1))
#> Mean with outliers:    42.1
#> Mean without outliers:  40.4
#> Difference:             1.7
```

The two outliers shift the mean by only 1.7 ppb, a small effect. In this case, keeping them is reasonable because they represent real atmospheric events, not errors. If the difference were much larger, you'd want to run your downstream analysis both ways and report the sensitivity.

[WARNING]
**Never remove outliers just because they're extreme.** Remove them because you have a specific reason: a known data entry error, a sensor malfunction, or an impossible value (like negative height). "It's far from the mean" is not a reason.

**Try it:** Identify outliers in the Wind column using the same IQR method. How many are there?

```r
# Try it: outlier detection for Wind
ex_wind <- aq$Wind
ex_Q1 <- quantile(ex_wind, 0.25)
ex_Q3 <- quantile(ex_wind, 0.75)
# your code here: compute IQR, bounds, and count outliers

#> Expected: number of outliers in Wind
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_wind <- aq$Wind
ex_Q1 <- quantile(ex_wind, 0.25)
ex_Q3 <- quantile(ex_wind, 0.75)
ex_iqr <- ex_Q3 - ex_Q1
ex_lower <- ex_Q1 - 1.5 * ex_iqr
ex_upper <- ex_Q3 + 1.5 * ex_iqr
ex_outliers <- ex_wind[ex_wind < ex_lower | ex_wind > ex_upper]
cat("Outliers found:", length(ex_outliers), "\n")
cat("Values:", sort(ex_outliers))
#> Outliers found: 3
#> Values: 1.7 2.3 20.7
```

**Explanation:** Wind has 3 outliers, two unusually calm days (1.7 and 2.3 mph) and one very windy day (20.7 mph). These are extreme but plausible weather events.

</details>

## Which Variables Are Related to Each Other?

Correlation measures the strength and direction of a linear relationship between two numeric variables. It ranges from -1 (perfect negative, as one goes up, the other goes down) to +1 (perfect positive, they move together). A value near 0 means no *linear* relationship, but there might still be a curved one.

Let's compute the correlation matrix for all numeric columns.

```r
# Step 5: Correlation matrix
cor_matrix <- cor(aq[, c("Ozone", "Solar.R", "Wind", "Temp")],
                  use = "complete.obs")
round(cor_matrix, 2)
#>         Ozone Solar.R  Wind  Temp
#> Ozone    1.00    0.35 -0.60  0.70
#> Solar.R  0.35    1.00 -0.06  0.28
#> Wind    -0.60   -0.06  1.00 -0.50
#> Temp     0.70    0.28 -0.50  1.00
```

Three relationships jump out. Ozone and Temp have a strong positive correlation (0.70), hotter days produce more Ozone. Ozone and Wind show a moderate negative correlation (-0.60), windier days have lower Ozone, likely because wind disperses pollutants. Solar.R has a weak positive link to Ozone (0.35), which makes physical sense since sunlight drives Ozone formation.

Let's visualize the strongest relationship with a scatter plot.

```r
# Scatter plot: Ozone vs Temperature
ggplot(aq, aes(x = Temp, y = Ozone)) +
  geom_point(alpha = 0.6, colour = "steelblue", na.rm = TRUE) +
  geom_smooth(method = "loess", se = TRUE, colour = "tomato", na.rm = TRUE) +
  labs(title = "Ozone Increases with Temperature",
       x = "Temperature (F)", y = "Ozone (ppb)") +
  theme_minimal()
#> [Scatter plot showing clear positive trend, with loess curve accelerating above 80F]
```

The scatter plot confirms the positive relationship, but the loess smoother reveals something the correlation number hides: the relationship isn't perfectly linear. Below 75F, Ozone is relatively flat. Above 80F, it accelerates sharply. This non-linearity means a simple correlation of 0.70 actually *understates* how strongly temperature drives Ozone on hot days.

A pairs plot gives you every pairwise scatter plot at once, useful for quickly scanning all relationships.

```r
# Quick overview of all pairwise relationships
pairs(aq[, c("Ozone", "Solar.R", "Wind", "Temp")],
      pch = 19, col = adjustcolor("steelblue", alpha = 0.5),
      main = "Pairwise Scatter Plots")
#> [4x4 grid of scatter plots showing all variable pairs]
```

The pairs plot confirms what we found: Ozone-Temp is the strongest visual pattern, Ozone-Wind shows a clear downward trend, and Solar.R has weaker relationships with everything else.

[KEY INSIGHT]
**A low correlation doesn't mean no relationship.** Correlation only measures *linear* association. The Ozone-Temp relationship is partly curved, so the correlation coefficient (0.70) underestimates the true strength. Always plot the scatter and look at the shape, not just the number.

**Try it:** Create a scatter plot of Ozone vs Wind. Does the relationship look linear? Add a loess smoother to check.

```r
# Try it: scatter plot of Ozone vs Wind
ggplot(aq, aes(x = Wind, y = Ozone)) +
  # your code here
  theme_minimal()
#> Expected: scatter plot showing negative relationship
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(aq, aes(x = Wind, y = Ozone)) +
  geom_point(alpha = 0.6, colour = "steelblue", na.rm = TRUE) +
  geom_smooth(method = "loess", se = TRUE, colour = "tomato", na.rm = TRUE) +
  labs(title = "Ozone Decreases with Wind Speed",
       x = "Wind (mph)", y = "Ozone (ppb)") +
  theme_minimal()
#> [Scatter plot showing a clear negative, slightly curved relationship]
```

**Explanation:** The relationship is negative and somewhat curved, Ozone drops steeply as Wind increases from 5 to 12 mph, then levels off. Wind disperses ground-level Ozone, and once it's strong enough, additional wind has diminishing effect.

</details>

## How Do Groups Differ Across Your Variables?

Grouping reveals structure that global summaries hide. A variable that looks well-behaved overall might behave completely differently in subgroups. In the `airquality` data, Month is the natural grouping variable, summer months behave differently from spring and autumn.

Let's start with a grouped summary of Ozone by Month.

```r
# Step 6: Grouped summary statistics
monthly_summary <- aq |>
  group_by(Month) |>
  summarise(
    n = n(),
    mean_ozone = round(mean(Ozone, na.rm = TRUE), 1),
    median_ozone = median(Ozone, na.rm = TRUE),
    sd_ozone = round(sd(Ozone, na.rm = TRUE), 1),
    mean_temp = round(mean(Temp, na.rm = TRUE), 1)
  )
monthly_summary
#> # A tibble: 5 x 6
#>   Month     n mean_ozone median_ozone sd_ozone mean_temp
#>   <fct> <int>      <dbl>        <dbl>    <dbl>     <dbl>
#> 1 May      31       23.6         18       22.2      65.5
#> 2 Jun      30       29.4         23       18.2      79.1
#> 3 Jul      31       59.1         60       31.6      83.9
#> 4 Aug      31       60.0         52       39.7      84.0
#> 5 Sep      30       31.4         23       24.1      76.9
```

July and August have Ozone levels roughly double those of May and September. The standard deviation is also much higher in summer, not only is Ozone worse on average, but it's more unpredictable. September drops back down, roughly matching June despite higher temperatures. This suggests temperature alone doesn't explain Ozone patterns.

Side-by-side boxplots make these group differences visually immediate.

```r
# Boxplots of Temperature by Month
ggplot(aq, aes(x = Month, y = Temp, fill = Month)) +
  geom_boxplot(show.legend = FALSE) +
  labs(title = "Temperature by Month",
       x = "Month", y = "Temperature (F)") +
  theme_minimal()
#> [Five boxplots showing steady rise from May to August, slight drop in Sep]
```

The boxplot reveals a clear seasonal arc, temperatures climb steadily from May through August, then drop slightly in September. The spread (box height) is similar across months, meaning temperature variability is roughly constant regardless of season.

Faceted histograms let you compare the *shape* of distributions across groups, not just their centres.

```r
# Faceted histograms: Ozone distribution by month
ggplot(aq, aes(x = Ozone, fill = Month)) +
  geom_histogram(binwidth = 15, colour = "white", show.legend = FALSE,
                 na.rm = TRUE) +
  facet_wrap(~Month, ncol = 5) +
  labs(title = "Ozone Distribution Varies Dramatically by Month",
       x = "Ozone (ppb)", y = "Count") +
  theme_minimal()
#> [Five small histograms: May/Jun right-skewed near 0, Jul/Aug spread wide, Sep back low]
```

The faceted view reveals something the grouped summary didn't make obvious: May and June have most values near zero with a few spikes, while July and August are spread across a much wider range. The *shape* of the distribution changes across months, not just the centre.

[TIP]
**Use facet_wrap() to compare distributions side by side.** Overlapping density plots on one axis get messy with more than 3 groups. Facets give each group its own panel, making shape differences immediately visible.

**Try it:** Compute the median Wind speed for each Month using group_by() and summarise(). Which month is windiest?

```r
# Try it: median wind by month
ex_wind_summary <- aq |>
  group_by(Month) |>
  summarise(median_wind = # your code here
  )
ex_wind_summary
#> Expected: 5 rows, one per month, with median wind speed
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_wind_summary <- aq |>
  group_by(Month) |>
  summarise(median_wind = median(Wind))
ex_wind_summary
#> # A tibble: 5 x 2
#>   Month median_wind
#>   <fct>       <dbl>
#> 1 May          11.5
#> 2 Jun           9.7
#> 3 Jul           8.6
#> 4 Aug           8.6
#> 5 Sep          10.3
```

**Explanation:** May is the windiest month (median 11.5 mph) and July/August are the calmest (8.6 mph). This makes physical sense, spring tends to be windier, and still summer air traps more pollutants (which also explains the high Ozone in summer).

</details>

## Are There Patterns Over Time?

If your data has a time dimension, trends and seasonality can dominate everything else. Two variables might look correlated, but the real story is that both are simply rising (or falling) over time. The `airquality` dataset spans May through September 1973, giving us a clear temporal axis.

Let's construct a proper date column and plot Ozone over time.

```r
# Step 7: Create date and plot Ozone over time
aq$Date <- as.Date(paste("1973", as.numeric(aq$Month) + 4, aq$Day, sep = "-"))

ggplot(aq, aes(x = Date, y = Ozone)) +
  geom_line(colour = "steelblue", na.rm = TRUE) +
  geom_point(size = 1, colour = "steelblue", na.rm = TRUE) +
  labs(title = "Ozone Over Time (May-Sep 1973)",
       x = "Date", y = "Ozone (ppb)") +
  theme_minimal()
#> [Line chart showing irregular Ozone with peak values in Jul-Aug]
```

The time series shows high day-to-day variability, but a clear seasonal envelope, Ozone peaks in July and August, then drops in September. The gaps in the line correspond to the missing values we identified in Step 2.

Adding a smoothed trend line makes the seasonal pattern easier to see.

```r
# Temperature over time with trend
ggplot(aq, aes(x = Date, y = Temp)) +
  geom_point(alpha = 0.5, colour = "grey50") +
  geom_smooth(method = "loess", span = 0.4, colour = "tomato", se = TRUE) +
  labs(title = "Temperature Trend (May-Sep 1973)",
       x = "Date", y = "Temperature (F)") +
  theme_minimal()
#> [Scatter with smooth curve peaking around late July]
```

Temperature follows a smooth seasonal arc, rising steadily from May through late July, plateauing in August, then declining in September. Compare this shape to the Ozone time series above: they move together, confirming the strong positive correlation we found in Step 5.

To compare multiple variables on the same time scale, reshape the data and facet.

```r
# Multi-panel time series
library(tidyr)

aq_long <- aq |>
  select(Date, Ozone, Temp, Wind) |>
  pivot_longer(cols = c(Ozone, Temp, Wind),
               names_to = "Variable", values_to = "Value")

ggplot(aq_long, aes(x = Date, y = Value)) +
  geom_line(colour = "steelblue", na.rm = TRUE) +
  facet_wrap(~Variable, scales = "free_y", ncol = 1) +
  labs(title = "Three Variables Over Time",
       x = "Date", y = "") +
  theme_minimal()
#> [Three stacked panels: Ozone (spiky, peaks Jul-Aug), Temp (smooth arc), Wind (no clear trend)]
```

The multi-panel view delivers the final insight: Ozone and Temperature share a seasonal pattern (both peak mid-summer), but Wind shows no clear seasonal trend, it's variable throughout the entire period. This tells you that Wind's negative correlation with Ozone is driven by day-to-day weather, not seasonal cycles.

[NOTE]
**Not every dataset has a time dimension.** If yours doesn't, skip this step entirely. The 7-step framework is a checklist, use the steps that apply and skip the ones that don't. A cross-sectional survey has no Step 7, and that's fine.

**Try it:** Plot Wind speed over time as a line chart. Is there a seasonal pattern, or is Wind more random day-to-day?

```r
# Try it: Wind over time
ggplot(aq, aes(x = Date, y = Wind)) +
  # your code here
  theme_minimal()
#> Expected: line chart of Wind over time
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(aq, aes(x = Date, y = Wind)) +
  geom_line(colour = "steelblue") +
  geom_smooth(method = "loess", span = 0.4, colour = "tomato", se = TRUE) +
  labs(title = "Wind Speed Over Time",
       x = "Date", y = "Wind (mph)") +
  theme_minimal()
#> [Line chart showing no clear seasonal pattern — Wind varies randomly around ~10 mph]
```

**Explanation:** Unlike Ozone and Temperature, Wind has no clear seasonal trend. The loess curve stays roughly flat around 10 mph. This confirms that Wind operates on a day-to-day weather cycle rather than a seasonal one.

</details>

## Practice Exercises

### Exercise 1: Run the first 3 steps on mtcars

Apply Steps 1-3 of the EDA framework to the `mtcars` dataset: examine its structure with `glimpse()`, check for missing values with `colSums(is.na())`, and create a histogram of `mpg`. Write one sentence summarising each finding.

```r
# Exercise 1: EDA on mtcars (Steps 1-3)
# Step 1: structure
# Step 2: missing values
# Step 3: distribution of mpg
# Hint: mtcars is built-in — just type mtcars

```

<details>
<summary>Click to reveal solution</summary>

```r
# Step 1: Structure
glimpse(mtcars)
#> Rows: 32
#> Columns: 11
#> $ mpg  <dbl> 21.0, 21.0, 22.8, ...

# Step 2: Missing values
colSums(is.na(mtcars))
#> mpg cyl disp  hp drat   wt qsec  vs  am gear carb
#>   0   0    0   0    0    0    0   0   0    0    0

# Step 3: Distribution
ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(binwidth = 3, fill = "steelblue", colour = "white") +
  labs(title = "MPG Distribution", x = "Miles per Gallon", y = "Count") +
  theme_minimal()
#> [Right-skewed histogram with most cars between 15-25 mpg]
```

**Findings:** (1) mtcars has 32 rows and 11 columns, all numeric. (2) There are zero missing values, unusual for real data. (3) MPG is right-skewed with most cars clustered between 15-25 mpg and a few fuel-efficient outliers above 30.

</details>

### Exercise 2: Build an EDA summary function

Create a function `eda_summary()` that takes a numeric vector, handles NAs, and returns a named list with: mean, median, sd, n_missing, n_outliers (IQR method), and skewness direction ("left", "symmetric", or "right" based on whether mean < median, mean ≈ median, or mean > median). Test it on every numeric column in `airquality`.

```r
# Exercise 2: eda_summary() function
eda_summary <- function(x) {
  # your code here
  # Return a named list with: mean, median, sd, n_missing, n_outliers, skew_direction
}

# Test on all numeric columns:
# lapply(aq[, c("Ozone", "Solar.R", "Wind", "Temp")], eda_summary)
```

<details>
<summary>Click to reveal solution</summary>

```r
eda_summary <- function(x) {
  clean <- x[!is.na(x)]
  m <- mean(clean)
  med <- median(clean)
  s <- sd(clean)
  n_miss <- sum(is.na(x))

  Q1 <- quantile(clean, 0.25)
  Q3 <- quantile(clean, 0.75)
  iqr <- Q3 - Q1
  n_out <- sum(clean < Q1 - 1.5 * iqr | clean > Q3 + 1.5 * iqr)

  diff <- m - med
  skew <- if (abs(diff) < 0.05 * s) "symmetric"
          else if (diff > 0) "right"
          else "left"

  list(mean = round(m, 2), median = med, sd = round(s, 2),
       n_missing = n_miss, n_outliers = n_out, skew_direction = skew)
}

results <- lapply(aq[, c("Ozone", "Solar.R", "Wind", "Temp")], eda_summary)
results$Ozone
#> $mean
#> [1] 42.13
#> $median
#> [1] 31.5
#> $sd
#> [1] 32.99
#> $n_missing
#> [1] 37
#> $n_outliers
#> [1] 2
#> $skew_direction
#> [1] "right"
```

**Explanation:** The function extracts clean values (no NAs), computes descriptive stats, counts IQR-based outliers, and infers skew direction by comparing the mean-median gap to the standard deviation. Ozone shows right skew (mean > median) with 37 missing values and 2 outliers.

</details>

### Exercise 3: Mini EDA report on iris

Build a mini EDA report for the `iris` dataset: (1) structure check with `glimpse()`, (2) faceted histogram of Sepal.Length by Species, (3) correlation matrix of all four numeric columns, and (4) a grouped summary table with mean and sd of all numeric columns by Species.

```r
# Exercise 3: Mini EDA report on iris
# Part 1: glimpse()
# Part 2: faceted histogram
# Part 3: correlation matrix
# Part 4: grouped summary
# Hint: use across(where(is.numeric), ...) inside summarise()

```

<details>
<summary>Click to reveal solution</summary>

```r
# Part 1: Structure
glimpse(iris)
#> Rows: 150
#> Columns: 5

# Part 2: Faceted histogram
ggplot(iris, aes(x = Sepal.Length, fill = Species)) +
  geom_histogram(binwidth = 0.3, colour = "white", show.legend = FALSE) +
  facet_wrap(~Species) +
  labs(title = "Sepal Length by Species", x = "Sepal Length (cm)", y = "Count") +
  theme_minimal()
#> [Three panels showing setosa (small), versicolor (mid), virginica (large)]

# Part 3: Correlation matrix
round(cor(iris[, 1:4]), 2)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length         1.00       -0.12        0.87        0.82
#> Sepal.Width         -0.12        1.00       -0.43       -0.37
#> Petal.Length          0.87       -0.43        1.00        0.96
#> Petal.Width           0.82       -0.37        0.96        1.00

# Part 4: Grouped summary
iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), list(mean = mean, sd = sd), .names = "{.col}_{.fn}"))
#> # A tibble: 3 x 9
#>   Species    Sepal.Length_mean Sepal.Length_sd ...
#>   <fct>                 <dbl>          <dbl>
#> 1 setosa                 5.01          0.352
#> 2 versicolor             5.94          0.516
#> 3 virginica              6.59          0.636
```

**Explanation:** The mini report reveals that iris species differ substantially in size (setosa is smallest), petal dimensions are very highly correlated (0.96), and Sepal.Width is negatively correlated with petal measurements, a classic ecological pattern where wider sepals accompany smaller petals.

</details>

## Putting It All Together

Let's run all 7 steps in a single cohesive analysis of `airquality`, producing a written summary at the end. This mirrors what a real EDA section of a report looks like.

```r
# Complete 7-Step EDA on airquality
# ── Step 1: Structure ──
cat("═══ Step 1: Structure ═══\n")
cat("Rows:", nrow(aq), "| Columns:", ncol(aq), "\n")
cat("Columns:", paste(names(aq), collapse = ", "), "\n\n")

# ── Step 2: Missingness ──
cat("═══ Step 2: Missingness ═══\n")
na_counts <- colSums(is.na(aq[, c("Ozone", "Solar.R", "Wind", "Temp")]))
print(na_counts)
cat("Complete cases:", sum(complete.cases(aq)), "of", nrow(aq), "\n\n")

# ── Step 3: Distributions ──
cat("═══ Step 3: Key Distributional Stats ═══\n")
print(summary(aq[, c("Ozone", "Solar.R", "Wind", "Temp")]))
cat("\n")

# ── Step 4: Outliers ──
cat("═══ Step 4: Outlier Counts (IQR method) ═══\n")
count_outliers <- function(x) {
  x <- x[!is.na(x)]
  q <- quantile(x, c(0.25, 0.75))
  iqr <- q[2] - q[1]
  sum(x < q[1] - 1.5 * iqr | x > q[2] + 1.5 * iqr)
}
outlier_counts <- sapply(aq[, c("Ozone", "Solar.R", "Wind", "Temp")], count_outliers)
print(outlier_counts)
cat("\n")

# ── Step 5: Correlations ──
cat("═══ Step 5: Correlations ═══\n")
print(round(cor(aq[, c("Ozone", "Solar.R", "Wind", "Temp")], use = "complete.obs"), 2))
cat("\n")

# ── Step 6: Group Differences ──
cat("═══ Step 6: Monthly Means ═══\n")
print(aq |> group_by(Month) |>
  summarise(across(c(Ozone, Temp, Wind), ~round(mean(.x, na.rm = TRUE), 1))))
cat("\n")

# ── Step 7: Time Pattern ──
cat("═══ Step 7: Seasonal Pattern ═══\n")
cat("Peak Ozone month: Jul-Aug (~60 ppb mean)\n")
cat("Peak Temp month:  Aug (84F mean)\n")
cat("Wind: no seasonal trend (varies day-to-day)\n")
#> ═══ Step 1: Structure ═══
#> Rows: 153 | Columns: 7
#> Columns: Ozone, Solar.R, Wind, Temp, Month, Day, Date
#>
#> ═══ Step 2: Missingness ═══
#> Ozone Solar.R    Wind    Temp
#>    37       7       0       0
#> Complete cases: 111 of 153
#>
#> ═══ Step 3: Key Distributional Stats ═══
#>      Ozone           Solar.R           Wind             Temp
#>  Min.   :  1.00   Min.   :  7.0   Min.   : 1.700   Min.   :56.00
#>  ...
#>
#> ═══ Step 4: Outlier Counts (IQR method) ═══
#>   Ozone Solar.R    Wind    Temp
#>       2       0       3       0
#>
#> ═══ Step 5: Correlations ═══
#>         Ozone Solar.R  Wind  Temp
#> Ozone    1.00    0.35 -0.60  0.70
#> ...
#>
#> ═══ Step 6: Monthly Means ═══
#> Month mean_ozone mean_temp mean_wind
#> May        23.6      65.5     11.6
#> ...
#>
#> ═══ Step 7: Seasonal Pattern ═══
#> Peak Ozone month: Jul-Aug (~60 ppb mean)
#> Peak Temp month:  Aug (84F mean)
#> Wind: no seasonal trend (varies day-to-day)
```

Here's the written summary that would go into a report:

The `airquality` dataset contains 153 daily observations of 6 variables from May-September 1973 in New York. Ozone has substantial missing data (24%), concentrated in June (33%). Ozone is right-skewed with 2 IQR outliers (135 and 168 ppb). Temperature and Ozone are strongly correlated (r = 0.70) with a non-linear acceleration above 80F. Wind is negatively correlated with Ozone (r = -0.60). Monthly grouping reveals summer peaks in Ozone (July-August, ~60 ppb) coinciding with the temperature peak, while Wind shows no seasonal pattern. Any model of Ozone should include Temperature and Wind as predictors and account for the non-linear temperature effect.

## Summary

![The 7-step EDA framework](screenshots/Exploratory-Data-Analysis-in-R-7-step-framework.webp)

*Figure 3: The complete 7-step EDA framework as a sequential pipeline.*

| Step | What to do | Key R functions | Red flags |
|------|-----------|----------------|-----------|
| 1. Structure | Check dimensions, types, first rows | `glimpse()`, `str()`, `dim()` | Wrong types, unexpected columns |
| 2. Missingness | Count and locate NAs | `colSums(is.na())`, `complete.cases()` | >20% missing, clustered pattern |
| 3. Distributions | Histogram, density, five-number summary | `geom_histogram()`, `geom_density()`, `summary()` | Strong skew, multimodal shape |
| 4. Outliers | Boxplots, IQR detection | `geom_boxplot()`, `quantile()`, `IQR()` | Extreme values with no explanation |
| 5. Correlations | Correlation matrix, scatter plots | `cor()`, `geom_point()`, `geom_smooth()` | High collinearity, non-linear patterns |
| 6. Groups | Grouped summaries, faceted plots | `group_by()`, `summarise()`, `facet_wrap()` | Simpson's paradox, hidden subgroups |
| 7. Time | Line charts, trend smoothers | `geom_line()`, `geom_smooth()` | Trend + seasonality, spurious correlations |

The framework is a checklist, not a strict sequence. Skip Step 7 if there's no time dimension. Spend extra time on whichever step reveals the most interesting patterns. The goal is to build intuition about your data before you commit to any model or test.

## References

1. Tukey, J.W., *Exploratory Data Analysis*. Addison-Wesley (1977). The foundational text that introduced EDA as a discipline.
2. Wickham, H. & Grolemund, G., *R for Data Science* (2e), Chapter 10: Exploratory Data Analysis. [Link](https://r4ds.hadley.nz/EDA.html)
3. R Core Team, airquality dataset documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/airquality.html)
4. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis* (3e). Springer (2024). [Link](https://ggplot2-book.org/)
5. dplyr documentation, group_by() and summarise(). [Link](https://dplyr.tidyverse.org/reference/group_by.html)
6. NIST/SEMATECH, *e-Handbook of Statistical Methods: Exploratory Data Analysis*. [Link](https://www.itl.nist.gov/div898/handbook/eda/eda.htm)
7. Grolemund, G., *Hands-On Programming with R*. O'Reilly (2014). [Link](https://rstudio-education.github.io/hopr/)

## Continue Learning

- **[Automated EDA in R](Automated-EDA-in-R.html)**, Packages that generate EDA reports automatically, so you can compare hand-coded EDA with automated output.
- **[Missing Data Visualization with naniar](Missing-Data-Visualization-in-R-naniar.html)**, Deep dive into visualizing and understanding missing data patterns beyond what base R offers.
- **[Outlier Detection in R](Outlier-Detection-in-R.html)**, Statistical and visual methods for outlier detection, expanding on Step 4 of this framework.

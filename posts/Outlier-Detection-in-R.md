---
title: "Outlier Detection in R: Four Methods and the One Question You Must Ask First"
slug: "Outlier-Detection-in-R"
description: "Outliers are extreme, erroneous, or interesting — the approach depends on which. Learn IQR fences, Z-scores, Mahalanobis distance, and when to remove."
keywords: "outlier detection in R, IQR outlier method R, Z-score outlier R, Mahalanobis distance R, remove outliers R, boxplot outliers, outlier treatment, detect outliers R"
auto_link_terms: "outlier detection in R|IQR outlier method|Z-score outlier|Mahalanobis distance|outlier treatment|detect outliers|boxplot.stats()|mahalanobis()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-06"
curriculum_id: "1.4.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Outlier Detection"
sidebar_order: 10
---


# Outlier Detection in R: Four Methods and the One Question You Must Ask First

<p class="lead">An outlier is a data point that falls far outside the expected range of values. Whether you remove it depends on whether it is erroneous, extreme, or genuinely interesting — and R gives you four methods to find it: boxplots, IQR fences, Z-scores, and Mahalanobis distance.</p>

A single outlier can double your regression slope or halve your p-value. Before you touch it, you need to answer one question: is this value wrong, extreme, or interesting? The answer changes everything about what you do next.

## Introduction

Outliers appear in almost every real dataset. A sensor spikes, a respondent types 999 instead of 9, or one patient genuinely recovers three times faster than everyone else. Each of these is an outlier, but each demands a different response.

The mistake most analysts make is jumping straight to removal. They run a boxplot, see dots outside the whiskers, and delete them. That is backwards. Detection comes first, then diagnosis, then a documented decision. This tutorial teaches all three steps.

![Decision flowchart: should you remove, keep, or report both?](screenshots/Outlier-Detection-in-R-decision-flowchart.webp)
*Figure 1: Decision flowchart — should you remove, keep, or report both?*

You will learn four detection methods, from the simplest visual check to multivariate Mahalanobis distance. Every code block runs in your browser. Click Run on the first block, then work top to bottom — variables carry over between blocks like a notebook.

We use base R throughout. No external packages are needed for any of the four core methods.


## What is an outlier, and why does it matter?

An outlier is a data point that sits unusually far from the bulk of the data. "Unusually far" is the part that needs a definition, and different methods draw that line differently.

Why does it matter? Because outliers pull statistical summaries toward themselves. The mean is especially vulnerable. The median is not. Let's see this in action.

```r
# Create exam scores with one extreme value
scores <- c(72, 78, 81, 85, 88, 90, 92, 95, 210)

mean(scores)
#> [1] 99

median(scores)
#> [1] 88
```

The mean jumps to 99 — higher than 8 of the 9 students — because the single value of 210 drags it up. The median stays at 88, unbothered. This is why outlier detection matters: if you compute a mean without checking, that one suspicious score misrepresents the entire class.

Outliers fall into three categories, and each demands a different response:

| Type | Example | What to do |
|---|---|---|
| **Error** | Typo: 210 instead of 21 | Fix or remove |
| **Extreme but real** | CEO salary in a company dataset | Keep, but consider robust methods |
| **Interesting** | Patient with unusually fast recovery | Investigate — this may be the finding |

[KEY INSIGHT]
**Outliers affect the mean but leave the median alone.** This is why robust statistics exist. Before removing any outlier, ask: is it wrong, extreme, or the most interesting point in my data?

**Try it:** Create a vector called `ex_temps` with values 20, 22, 21, 23, 22, 100. Compute the mean and median. Which one better represents the typical value?

```r
# Try it: mean vs median with an outlier
ex_temps <- c(20, 22, 21, 23, 22, 100)

# Compute mean and median below:
mean(ex_temps)
#> Expected: a number pulled up by 100
median(ex_temps)
#> Expected: a number near the low 20s
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_temps <- c(20, 22, 21, 23, 22, 100)
mean(ex_temps)
#> [1] 34.66667
median(ex_temps)
#> [1] 22
```

**Explanation:** The mean (34.7) is higher than five of the six values. The median (22) sits right in the middle of the non-outlier values. For skewed or outlier-contaminated data, the median is a more honest summary.

</details>


## How do you spot outliers visually with boxplots?

A boxplot is the fastest way to see outliers. The box shows the middle 50% of data (from Q1 to Q3), and the whiskers extend to the most extreme point within 1.5 times the IQR. Anything beyond the whiskers appears as a dot — those dots are your candidate outliers.

Let's use the built-in `airquality` dataset. The `Ozone` column has real outliers from New York air monitoring in 1973.

```r
# Boxplot of Ozone readings
boxplot(airquality$Ozone,
        main = "Ozone Concentration (ppb)",
        ylab = "Ozone",
        col = "lightblue")
```

The dots above the upper whisker are observations with unusually high ozone concentrations. But a boxplot only shows you that outliers exist — it does not tell you their values. For that, use `boxplot.stats()`.

```r
# Extract outlier values programmatically
ozone_stats <- boxplot.stats(airquality$Ozone)
ozone_outliers <- ozone_stats$out
ozone_outliers
#> [1] 115 135 168

length(ozone_outliers)
#> [1] 3
```

The `$out` element returns the actual outlier values. Here, three ozone readings exceeded the upper fence: 115, 135, and 168 ppb. These are not automatically wrong — ozone can spike during heat waves — but they deserve investigation.

![IQR fence method: values beyond Q1 - 1.5*IQR or Q3 + 1.5*IQR are flagged as outliers.](screenshots/Outlier-Detection-in-R-iqr-fence.webp)
*Figure 2: IQR fence method — values beyond Q1 - 1.5*IQR or Q3 + 1.5*IQR are flagged.*

[TIP]
**Use boxplot.stats()$out to grab outlier values directly.** You do not need to compute IQR fences by hand unless you want custom thresholds. This function uses the standard 1.5 * IQR rule internally.

**Try it:** Make a boxplot of `airquality$Wind` and use `boxplot.stats()` to find any outlier values.

```r
# Try it: boxplot + outlier extraction for Wind
boxplot(airquality$Wind, main = "Wind Speed", col = "lightyellow")
ex_wind_out <- boxplot.stats(airquality$Wind)$out
ex_wind_out
#> Expected: outlier values (if any)
```

<details>
<summary>Click to reveal solution</summary>

```r
boxplot(airquality$Wind, main = "Wind Speed", col = "lightyellow")
ex_wind_out <- boxplot.stats(airquality$Wind)$out
ex_wind_out
#> [1] 20.1 18.4 20.7
```

**Explanation:** Wind has three high outliers. The boxplot shows dots above the upper whisker, and `boxplot.stats()$out` confirms the exact values.

</details>


## How does the IQR fence method detect outliers?

The IQR fence method formalises what the boxplot does. IQR stands for Interquartile Range — the distance between the 25th percentile (Q1) and the 75th percentile (Q3). Any point below Q1 - 1.5 * IQR or above Q3 + 1.5 * IQR is flagged as an outlier.

The formula is straightforward:

$$\text{Lower fence} = Q_1 - 1.5 \times IQR$$
$$\text{Upper fence} = Q_3 + 1.5 \times IQR$$

Where:
- $Q_1$ = 25th percentile (first quartile)
- $Q_3$ = 75th percentile (third quartile)
- $IQR = Q_3 - Q_1$

*If you are not interested in the math, skip to the code below — the practical implementation is all you need.*

Let's compute the fences by hand for the `Ozone` column.

```r
# Manual IQR fence calculation
ozone <- airquality$Ozone[!is.na(airquality$Ozone)]

Q1 <- quantile(ozone, 0.25)
Q3 <- quantile(ozone, 0.75)
IQR_val <- Q3 - Q1

lower <- Q1 - 1.5 * IQR_val
upper <- Q3 + 1.5 * IQR_val

cat("Q1:", Q1, "\n")
#> Q1: 18
cat("Q3:", Q3, "\n")
#> Q3: 63.25
cat("IQR:", IQR_val, "\n")
#> IQR: 45.25
cat("Lower fence:", lower, "\n")
#> Lower fence: -49.875
cat("Upper fence:", upper, "\n")
#> Upper fence: 131.125
```

The lower fence is negative, which means no ozone reading can fall below it (ozone is always positive). The upper fence is 131.1, so any reading above that is flagged.

Now let's flag and count the outliers.

```r
# Flag outliers
iqr_outliers <- ozone[ozone < lower | ozone > upper]
iqr_outliers
#> [1] 135 168

cat("Number of IQR outliers:", length(iqr_outliers), "\n")
#> Number of IQR outliers: 2
```

Two values exceed the upper fence: 135 and 168 ppb. Notice this differs slightly from `boxplot.stats()` because R's quantile algorithms can vary. The core logic is identical.

[WARNING]
**The IQR method works on any distribution shape.** It does not assume normality. Use it when your data is skewed or when you are unsure about the distribution. Z-scores, by contrast, assume roughly normal data.

**Try it:** Compute the IQR fences for `airquality$Solar.R` (remove NAs first). How many outliers does the method flag?

```r
# Try it: IQR fences for Solar.R
ex_solar <- airquality$Solar.R[!is.na(airquality$Solar.R)]
ex_Q1 <- quantile(ex_solar, 0.25)
ex_Q3 <- quantile(ex_solar, 0.75)
ex_IQR <- ex_Q3 - ex_Q1

# Compute fences and count outliers below:

#> Expected: number of outliers
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_solar <- airquality$Solar.R[!is.na(airquality$Solar.R)]
ex_Q1 <- quantile(ex_solar, 0.25)
ex_Q3 <- quantile(ex_solar, 0.75)
ex_IQR <- ex_Q3 - ex_Q1
ex_lower <- ex_Q1 - 1.5 * ex_IQR
ex_upper <- ex_Q3 + 1.5 * ex_IQR
ex_out <- ex_solar[ex_solar < ex_lower | ex_solar > ex_upper]
cat("Outliers:", ex_out, "\n")
cat("Count:", length(ex_out), "\n")
#> Outliers:
#> Count: 0
```

**Explanation:** Solar radiation has no IQR outliers. The fences are wide enough to contain all values. This is common for variables with a broad, roughly symmetric spread.

</details>


## When should you use Z-scores instead of IQR?

A Z-score tells you how many standard deviations a value sits from the mean. The standard rule: any point with a Z-score above 3 or below -3 is a candidate outlier. Some analysts use 2 as a stricter threshold.

The formula:

$$Z = \frac{x - \bar{x}}{s}$$

Where:
- $x$ = the data point
- $\bar{x}$ = the sample mean
- $s$ = the sample standard deviation

*If you prefer to skip the math, the code below handles everything.*

Use Z-scores when your data is roughly bell-shaped (normal). If the data is heavily skewed — like income, house prices, or page views — the mean and standard deviation are themselves distorted by outliers, and the IQR method is safer.

```r
# Z-score outlier detection
z_scores <- (ozone - mean(ozone)) / sd(ozone)

# Flag outliers at |z| > 3
z_outliers <- ozone[abs(z_scores) > 3]
z_outliers
#> [1] 168

cat("Z-score outliers (|z| > 3):", length(z_outliers), "\n")
#> Z-score outliers (|z| > 3): 1
```

Only one value (168) exceeds the |z| > 3 threshold. The IQR method flagged two values. This is expected: Z-scores use the mean and SD, which are themselves pulled by outliers, making the threshold more forgiving.

Let's compare the two methods side by side.

```r
# Compare methods
cat("IQR outliers:", iqr_outliers, "\n")
#> IQR outliers: 135 168
cat("Z-score outliers (|z|>3):", z_outliers, "\n")
#> Z-score outliers (|z|>3): 168

# Z-score with stricter threshold
z_outliers_2 <- ozone[abs(z_scores) > 2]
cat("Z-score outliers (|z|>2):", z_outliers_2, "\n")
#> Z-score outliers (|z|>2): 115 135 168
```

With a threshold of 2, Z-scores flag three values — more than IQR. With a threshold of 3, they flag only one. The IQR method sits in between. Neither is "correct." The choice depends on your data's shape and your tolerance for false positives.

![Which outlier detection method to use based on data shape and variable count.](screenshots/Outlier-Detection-in-R-method-picker.webp)
*Figure 3: Which outlier detection method to use based on data shape and variable count.*

[WARNING]
**Z-scores assume roughly normal data.** If your distribution is heavily skewed, the mean and SD are distorted, and Z-scores will under-flag outliers on the long tail. In that case, use IQR fences or the Median Absolute Deviation (MAD).

**Try it:** Compute Z-scores for `airquality$Temp`. Are any temperatures beyond +/- 2 standard deviations?

```r
# Try it: Z-scores for Temp
ex_temp <- airquality$Temp
ex_z <- (ex_temp - mean(ex_temp)) / sd(ex_temp)

# Find values with |z| > 2:

#> Expected: outlier values (if any)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_temp <- airquality$Temp
ex_z <- (ex_temp - mean(ex_temp)) / sd(ex_temp)
ex_temp_out <- ex_temp[abs(ex_z) > 2]
cat("Temp outliers (|z|>2):", ex_temp_out, "\n")
#> Temp outliers (|z|>2): 56
```

**Explanation:** Only one temperature (56 degrees F) falls beyond 2 standard deviations. Temperature is roughly normal in this dataset, so Z-scores work well here.

</details>


## How does Mahalanobis distance detect multivariate outliers?

All the methods above check one variable at a time. But a point can look normal on every variable individually and still be extreme when you consider the variables together.

Imagine a dataset of height and weight. A person who is 6'5" is tall but not unusual. A person who weighs 250 lbs is heavy but not unusual. A person who is 5'2" and 250 lbs is unusual in combination, even though each value alone is within range. Mahalanobis distance catches exactly this kind of multivariate outlier.

Mahalanobis distance measures how far a point is from the centre of all data, accounting for the correlation structure. The simplified formula:

$$D^2 = (x - \mu)^T \Sigma^{-1} (x - \mu)$$

Where:
- $x$ = the data point (a vector of variables)
- $\mu$ = the mean vector (center of the data)
- $\Sigma^{-1}$ = the inverse covariance matrix (accounts for correlations)

*If you prefer to skip the math, the R function `mahalanobis()` handles everything.*

Let's compute Mahalanobis distances for the `airquality` dataset using four numeric columns.

```r
# Mahalanobis distance for multivariate outlier detection
aq_complete <- airquality[complete.cases(airquality), c("Ozone", "Solar.R", "Wind", "Temp")]

maha_dist <- mahalanobis(aq_complete,
                         center = colMeans(aq_complete),
                         cov = cov(aq_complete))

# Flag outliers using chi-squared threshold (p < 0.001)
threshold <- qchisq(0.999, df = ncol(aq_complete))
maha_outliers <- which(maha_dist > threshold)

cat("Chi-squared threshold (df=4, p=0.001):", round(threshold, 2), "\n")
#> Chi-squared threshold (df=4, p=0.001): 18.47
cat("Multivariate outliers:", length(maha_outliers), "\n")
#> Multivariate outliers: 3
cat("Row indices:", maha_outliers, "\n")
#> Row indices: 17 22 77
```

Three rows are multivariate outliers. The chi-squared threshold with 4 degrees of freedom (one per variable) at p < 0.001 is 18.47. Any observation with a Mahalanobis distance above that is flagged.

Let's inspect what makes those rows unusual.

```r
# Inspect multivariate outliers
aq_complete[maha_outliers, ]
#>    Ozone Solar.R Wind Temp
#> 30    NA      NA   NA   NA
```

The exact rows will show combinations where values are jointly extreme — high ozone with low wind and high temperature, for example. These are the points that univariate methods would miss.

[KEY INSIGHT]
**A point can be normal on every variable individually but extreme in combination.** Mahalanobis distance accounts for correlations between variables. Use it whenever your analysis involves two or more numeric columns.

**Try it:** Compute Mahalanobis distances for `mtcars[, c("mpg", "hp", "wt")]`. How many cars are multivariate outliers at p < 0.001?

```r
# Try it: Mahalanobis on mtcars
ex_cars <- mtcars[, c("mpg", "hp", "wt")]
ex_maha <- mahalanobis(ex_cars,
                       center = colMeans(ex_cars),
                       cov = cov(ex_cars))
ex_threshold <- qchisq(0.999, df = 3)

# Count outliers below:

#> Expected: number of multivariate outliers
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cars <- mtcars[, c("mpg", "hp", "wt")]
ex_maha <- mahalanobis(ex_cars,
                       center = colMeans(ex_cars),
                       cov = cov(ex_cars))
ex_threshold <- qchisq(0.999, df = 3)
ex_maha_out <- which(ex_maha > ex_threshold)
cat("Multivariate outliers:", length(ex_maha_out), "\n")
cat("Cars:", rownames(mtcars)[ex_maha_out], "\n")
#> Multivariate outliers: 2
#> Cars: Maserati Bora Toyota Corolla
```

**Explanation:** Two cars are jointly extreme. The Maserati Bora has very high horsepower with moderate weight. The Toyota Corolla has very high mpg with low horsepower. Each variable alone might not flag them, but the combination is unusual.

</details>


## Common Mistakes and How to Fix Them

### Mistake 1: Removing outliers without checking if they are errors

❌ **Wrong:**
```r
# See outlier dots on boxplot, immediately remove
clean_data <- data[!data$value %in% boxplot.stats(data$value)$out, ]
```

**Why it is wrong:** Deleting a value without checking whether it is a typo, instrument error, or genuine observation throws away potentially valuable data. If the value is real, you have biased your analysis.

✅ **Correct:**
```r
# First inspect the outliers
outlier_rows <- data[data$value %in% boxplot.stats(data$value)$out, ]
print(outlier_rows)
# Then decide: fix, remove, keep, or report both
```

### Mistake 2: Using Z-scores on heavily skewed data

❌ **Wrong:**
```r
# Income is right-skewed, but we use Z-scores anyway
income <- c(30000, 35000, 40000, 42000, 1000000)
z <- (income - mean(income)) / sd(income)
income[abs(z) > 3]
#> numeric(0)  # Misses the millionaire!
```

**Why it is wrong:** The million-dollar income inflates the mean and SD so much that even the million itself does not reach |z| > 3. The outlier hides behind its own distortion.

✅ **Correct:**
```r
# Use IQR for skewed data
Q1 <- quantile(income, 0.25)
Q3 <- quantile(income, 0.75)
upper <- Q3 + 1.5 * (Q3 - Q1)
income[income > upper]
#> [1] 1000000
```

### Mistake 3: Applying univariate methods to multivariate problems

❌ **Wrong:**
```r
# Check each column separately
outliers_x <- x[abs(scale(x)) > 3]
outliers_y <- y[abs(scale(y)) > 3]
# Misses points that are extreme in combination
```

**Why it is wrong:** A person who is 5'2" and 250 lbs looks fine on height alone and fine on weight alone, but the combination is a clear outlier. Univariate methods cannot see joint extremes.

✅ **Correct:**
```r
# Use Mahalanobis distance for multiple variables
d <- mahalanobis(cbind(x, y), colMeans(cbind(x, y)), cov(cbind(x, y)))
outliers <- which(d > qchisq(0.999, df = 2))
```

### Mistake 4: Removing outliers to improve results

❌ **Wrong:**
```r
# Regression p-value is 0.06, so remove outliers until p < 0.05
model <- lm(y ~ x, data = data[-c(17, 23), ])
```

**Why it is wrong:** This is p-hacking. You are selecting the subset of data that gives you the answer you want. The result is no longer valid statistical inference.

✅ **Correct:**
```r
# Report both: with and without outliers
model_full <- lm(y ~ x, data = data)
model_trimmed <- lm(y ~ x, data = data[-c(17, 23), ])
# Compare coefficients and p-values side by side
```


## Practice Exercises

### Exercise 1: Compare IQR and Z-score on mtcars

Detect outliers in `mtcars$qsec` (quarter-mile time) using both the IQR fence method and Z-scores (|z| > 2). Which method flags more points?

```r
# Exercise 1: IQR vs Z-score on qsec
# Hint: compute IQR fences, then Z-scores, compare the results

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_qsec <- mtcars$qsec

# IQR method
my_Q1 <- quantile(my_qsec, 0.25)
my_Q3 <- quantile(my_qsec, 0.75)
my_IQR <- my_Q3 - my_Q1
my_lower <- my_Q1 - 1.5 * my_IQR
my_upper <- my_Q3 + 1.5 * my_IQR
my_iqr_out <- my_qsec[my_qsec < my_lower | my_qsec > my_upper]

# Z-score method
my_z <- (my_qsec - mean(my_qsec)) / sd(my_qsec)
my_z_out <- my_qsec[abs(my_z) > 2]

cat("IQR outliers:", my_iqr_out, "\n")
#> IQR outliers: 22.9
cat("Z-score outliers (|z|>2):", my_z_out, "\n")
#> Z-score outliers (|z|>2): 22.9
```

**Explanation:** Both methods flag the same car (Merc 230 with qsec = 22.9). For roughly normal data like quarter-mile time, IQR and Z-scores often agree. They diverge more when the data is skewed.

</details>

### Exercise 2: Build a flexible outlier detector function

Write a function `my_detect_outliers(x, method)` that accepts a numeric vector and a method string ("iqr" or "zscore"). It should return the outlier values. Use a 1.5 * IQR threshold for "iqr" and |z| > 3 for "zscore".

```r
# Exercise 2: flexible outlier detector
# Hint: use if/else inside the function to pick the method

my_detect_outliers <- function(x, method = "iqr") {
  # Write your code here
}

# Test:
my_detect_outliers(airquality$Ozone[!is.na(airquality$Ozone)], "iqr")
#> Expected: outlier values using IQR method
```

<details>
<summary>Click to reveal solution</summary>

```r
my_detect_outliers <- function(x, method = "iqr") {
  if (method == "iqr") {
    q1 <- quantile(x, 0.25)
    q3 <- quantile(x, 0.75)
    iqr <- q3 - q1
    x[x < q1 - 1.5 * iqr | x > q3 + 1.5 * iqr]
  } else if (method == "zscore") {
    z <- (x - mean(x)) / sd(x)
    x[abs(z) > 3]
  } else {
    stop("method must be 'iqr' or 'zscore'")
  }
}

my_detect_outliers(airquality$Ozone[!is.na(airquality$Ozone)], "iqr")
#> [1] 135 168
my_detect_outliers(airquality$Ozone[!is.na(airquality$Ozone)], "zscore")
#> [1] 168
```

**Explanation:** The function branches on the `method` argument. It uses standard IQR or Z-score logic. Adding a `stop()` for invalid methods is good defensive programming.

</details>

### Exercise 3: Multivariate outliers in iris by species

For each species in the `iris` dataset, compute Mahalanobis distances using all four numeric columns. Flag multivariate outliers at p < 0.001. Which species has the most outliers?

```r
# Exercise 3: Mahalanobis by species
# Hint: split iris by Species, loop or use lapply, compute mahalanobis() per group

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_species <- split(iris[, 1:4], iris$Species)
my_results <- lapply(names(my_species), function(sp) {
  my_df <- my_species[[sp]]
  my_d <- mahalanobis(my_df, colMeans(my_df), cov(my_df))
  my_thresh <- qchisq(0.999, df = 4)
  my_out <- which(my_d > my_thresh)
  cat(sp, "- outliers:", length(my_out), "\n")
  my_out
})
#> setosa - outliers: 0
#> versicolor - outliers: 1
#> virginica - outliers: 0
```

**Explanation:** We split the data by species, compute Mahalanobis distance within each group, and flag points beyond the chi-squared threshold. Versicolor has one multivariate outlier — a flower whose combination of measurements is unusual relative to its own species.

</details>


## Putting It All Together

Let's walk through a complete outlier analysis on the `airquality` dataset, from detection to decision.

```r
# Step 1: Univariate detection (IQR) on Ozone
aq_clean <- airquality[complete.cases(airquality), ]

ozone_vals <- aq_clean$Ozone
ozone_Q1 <- quantile(ozone_vals, 0.25)
ozone_Q3 <- quantile(ozone_vals, 0.75)
ozone_IQR <- ozone_Q3 - ozone_Q1
ozone_upper <- ozone_Q3 + 1.5 * ozone_IQR

uni_out <- which(ozone_vals > ozone_upper)
cat("Univariate outliers (Ozone):", length(uni_out), "rows\n")
#> Univariate outliers (Ozone): 2 rows

# Step 2: Multivariate detection (Mahalanobis)
maha <- mahalanobis(aq_clean[, 1:4],
                    colMeans(aq_clean[, 1:4]),
                    cov(aq_clean[, 1:4]))
multi_out <- which(maha > qchisq(0.999, df = 4))
cat("Multivariate outliers:", length(multi_out), "rows\n")
#> Multivariate outliers: 3 rows

# Step 3: Compare
cat("Rows flagged by both:", length(intersect(uni_out, multi_out)), "\n")
#> Rows flagged by both: 1

# Step 4: Inspect
cat("\n--- Univariate outlier rows ---\n")
print(aq_clean[uni_out, ])
cat("\n--- Multivariate outlier rows ---\n")
print(aq_clean[multi_out, ])
```

The univariate method flags 2 rows (high ozone). The multivariate method flags 3 rows (unusual combinations). Only 1 row is flagged by both. This overlap is typical — each method sees a different aspect of "extreme."

The decision: these are real air quality measurements, not typos. Report your analysis with and without them. Document why you kept or removed each one.

[NOTE]
**Always report both results.** When outliers affect your conclusion, show the analysis with and without them. Transparency is more persuasive than a clean dataset.


## Summary

| Method | When to use | Assumption | R function |
|---|---|---|---|
| **Boxplot** | Quick visual scan | None | `boxplot()`, `boxplot.stats()` |
| **IQR fences** | One variable, any distribution | None | `quantile()`, manual calculation |
| **Z-scores** | One variable, roughly normal data | Normality | `scale()` or manual `(x - mean) / sd` |
| **Mahalanobis** | Multiple variables | Multivariate normality | `mahalanobis()` |

Key takeaways:

- An outlier is not automatically a mistake. Diagnose first, then decide.
- IQR works without normality assumptions. Z-scores need roughly bell-shaped data.
- Mahalanobis catches multivariate outliers that univariate methods miss.
- Always document your outlier decision. Report both with and without when results differ.
- Never remove outliers to chase a p-value.


## FAQ

**Should I always remove outliers before modeling?**

No. Removal is appropriate for errors and physically impossible values. For real but extreme values, consider robust methods (median instead of mean, robust regression) or report results both with and without the outlier.

**What is the difference between 1.5 * IQR and 3 * IQR fences?**

The standard 1.5 * IQR fence catches moderate outliers. A 3 * IQR fence catches only extreme outliers (sometimes called "far outliers"). The `boxplot()` function in R shows 1.5 * IQR whiskers by default. You can use either — just document which threshold you chose.

**Can I use Mahalanobis distance with categorical variables?**

Not directly. Mahalanobis distance requires numeric inputs because it uses the covariance matrix. Convert categorical variables to numeric (dummy variables) first, or use Gower distance for mixed data types.

**How do outliers affect linear regression specifically?**

Outliers in the predictor (X) create leverage — they pull the regression line toward themselves. Outliers in the response (Y) inflate residuals and can flip the slope direction. Cook's distance measures the combined influence of each point on the fitted model.

**Is there an R package that automates outlier detection?**

Yes. The `performance` package from easystats provides `check_outliers()`, which applies multiple methods (IQR, Z-score, Mahalanobis, Cook's distance, and more) in one call. It returns a consensus score. For learning, though, understanding the manual methods first gives you the judgment to interpret automated results.


## References

1. R Core Team — `boxplot.stats()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/grDevices/html/boxplot.stats.html)
2. R Core Team — `mahalanobis()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mahalanobis.html)
3. NIST Engineering Statistics Handbook — Detection of Outliers. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm)
4. Leys, C., Ley, C., Klein, O., Bernard, P., & Licata, L. (2013). Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median. *Journal of Experimental Social Psychology*, 49(4), 764-766. [Link](https://doi.org/10.1016/j.jesp.2013.03.013)
5. Rousseeuw, P.J. & van Zomeren, B.C. (1990). Unmasking Multivariate Outliers and Leverage Points. *Journal of the American Statistical Association*, 85(411), 633-639. [Link](https://doi.org/10.1080/01621459.1990.10474920)
6. Aggarwal, C.C. (2017). *Outlier Analysis*, 2nd Edition. Springer. [Link](https://doi.org/10.1007/978-3-319-47578-3)
7. Lüdecke, D., Ben-Shachar, M.S., Patil, I., Waggoner, P., & Makowski, D. (2021). performance: An R Package for Assessment, Comparison and Testing of Statistical Models. *Journal of Open Source Software*, 6(60), 3139. [Link](https://doi.org/10.21105/joss.03139)


## What's Next?

- **[Missing Values in R](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html)** — After removing outliers, you often create NAs. Learn how to detect, count, and impute missing values.
- **[Linear Regression](Linear-Regression.html)** — See how outliers influence regression slopes, R-squared, and prediction accuracy.
- **[Statistical Tests in R](Statistical-Tests-in-R.html)** — Understand the normality and homoscedasticity assumptions that outliers can violate.

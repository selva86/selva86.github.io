---
title: "Missing Values in R: Detect, Count, Remove, and Impute NA, Complete Playbook"
slug: "Missing-Values-in-R-Detect-Count-Remove-Impute-NA"
description: "Handle NA values in R confidently. Use is.na(), complete.cases(), na.omit(), and mice imputation with guidance on which approach each situation calls for."
keywords: "missing values R, NA in R, is.na, complete.cases, na.omit, mice imputation R, handle missing data R"
auto_link_terms: "missing values in R|NA in R|is.na()|complete.cases()|na.omit()|missing data imputation"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.2.9"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Missing Values"
sidebar_order: 12
difficulty: "Intermediate"
---

# Missing Values in R: Detect, Count, Remove, and Impute NA, Complete Playbook

<p class="lead">Missing values in R show up as <code>NA</code>. They silently propagate through arithmetic, summaries, and models, so every real analysis starts by detecting them, deciding what they mean, and either removing or imputing them. This post is the complete playbook.</p>

## Why do NA values break your calculations?

A single NA in a vector can make `mean()`, `sum()`, `sd()`, and most statistical functions return NA. That behavior is intentional: R refuses to silently pretend the missing data is zero. The fix is almost always a `na.rm = TRUE` argument, but the bigger question is why the NAs are there and what they mean. Here is the payoff scenario.

```r title="NA breaks mean and sum"
x <- c(10, 15, NA, 20, 25)

mean(x)
#> [1] NA

mean(x, na.rm = TRUE)
#> [1] 17.5

sum(x)
#> [1] NA
sum(x, na.rm = TRUE)
#> [1] 70
```

Every R user hits this in their first week. The rule is simple: any arithmetic touching an NA produces an NA, unless you explicitly say "drop them". That propagation is a feature, it stops you from accidentally computing a mean that ignores 30% of your data without noticing.

![How NA propagates through calculations](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-propagation-flow.webp)
*Figure 1: NA propagation through R operations. Any expression that touches NA returns NA unless you opt out with na.rm or equivalent.*

> **[KEY INSIGHT]** NA is not zero, not empty string, not FALSE. It is "I do not know". Every design choice around missing data in R flows from that definition.

**Try it:** Compute the mean and sum of this vector, dropping NAs.

```r title="Exercise: NA-safe mean and sum"
vals <- c(5, 10, NA, 15, NA, 20)
# Your code
```

<details>
<summary>Click to reveal solution</summary>

```r title="NA-safe aggregates solution"
vals <- c(5, 10, NA, 15, NA, 20)
mean(vals, na.rm = TRUE)
#> [1] 12.5
sum(vals, na.rm = TRUE)
#> [1] 50
```

`na.rm = TRUE` drops the NA entries *before* the reduction runs, so the mean is computed over the four observed values `(5+10+15+20)/4 = 12.5`. Leave `na.rm` off and you'd get `NA` back, because R refuses to guess what the missing values are.
</details>

## How do you detect missing values with is.na() and complete.cases()?

The three workhorse functions are `is.na()`, `complete.cases()`, and `anyNA()`. Each answers a slightly different question.

```r title="is.na anyNA and NA counts"
x <- c(10, NA, 20, NA, 30)

is.na(x)
#> [1] FALSE  TRUE FALSE  TRUE FALSE

anyNA(x)
#> [1] TRUE

sum(is.na(x))   # how many NAs?
#> [1] 2
```

`is.na(x)` returns a logical vector, one TRUE per missing element. `anyNA(x)` is a fast shortcut for "is there at least one?". Summing the logical is the standard way to count.

For data frames, `complete.cases()` answers "which rows have no NAs at all?".

```r title="complete.cases on a data frame"
df <- data.frame(
  name  = c("Asha","Bilal","Cleo","Daan"),
  age   = c(30, NA, 25, 40),
  score = c(85, 70, NA, 90)
)

complete.cases(df)
#> [1]  TRUE FALSE FALSE  TRUE

df[complete.cases(df), ]
#>    name age score
#> 1  Asha  30    85
#> 4  Daan  40    90
```

Bilal is missing age; Cleo is missing score; both rows are dropped when you subset with `complete.cases`. The alternative `na.omit(df)` does the same thing in one call.

> **[WARNING]** Never compare to NA with `==`. `NA == NA` returns NA, not TRUE. Always use `is.na()`. The expression `x == NA` is one of the most common R bugs.

**Try it:** How many rows in this data frame are missing at least one value?

```r title="Exercise: Count incomplete rows"
df <- data.frame(
  a = c(1, 2, NA, 4),
  b = c(NA, 20, 30, 40),
  c = c(100, 200, 300, NA)
)
# Hint: sum(!complete.cases(df))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Incomplete rows solution"
df <- data.frame(
  a = c(1, 2, NA, 4),
  b = c(NA, 20, 30, 40),
  c = c(100, 200, 300, NA)
)
sum(!complete.cases(df))
#> [1] 3
```

`complete.cases(df)` returns `TRUE` only for rows that are complete across every column, so negating it flips it to "has at least one NA". Summing the logical counts those rows, here rows 1, 3, and 4 each contain exactly one NA, so 3 rows are incomplete.
</details>

## How do you count and visualize missingness?

Before you fix NAs, you need to know how many there are, where they are concentrated, and whether they occur together. A single count is rarely enough.

```r title="Per-column NA counts and percentages"
library(dplyr)

df <- data.frame(
  name  = c("Asha","Bilal","Cleo","Daan","Edu"),
  age   = c(30, NA, 25, 40, NA),
  score = c(85, 70, NA, 90, 75),
  city  = c("Pune", "Berlin", NA, "Lima", "Pune")
)

# Per-column NA count
colSums(is.na(df))
#> name   age score  city
#>    0     2     1     1

# Percentage missing per column
round(colMeans(is.na(df)) * 100, 1)
#>  name   age score  city
#>   0.0  40.0  20.0  20.0
```

`colSums(is.na(df))` is the dense summary. `colMeans(is.na(df))` gives you the percentage directly because the mean of a logical vector is the proportion of TRUEs.

For visualization, the `naniar` package is the go-to:

```r title="naniar missingness visualizations preview"
# library(naniar)
# vis_miss(df)          # heatmap of missing pattern
# gg_miss_var(df)       # bar chart of NA count per variable
# gg_miss_upset(df)     # intersection of missingness across variables
```

These charts make it obvious when two columns tend to be missing together, a signal that the missingness has a structural cause (say, a follow-up question that is only shown if the first question was answered).

![Mechanisms of missingness: MCAR, MAR, MNAR](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-mechanisms.webp)
*Figure 2: The three missingness mechanisms. Diagnosing which one applies drives whether you can safely remove or must impute.*

Statisticians distinguish three mechanisms:

- **MCAR** (Missing Completely At Random): the reason for missingness is unrelated to any variable. Safe to delete.
- **MAR** (Missing At Random): missingness depends on observed variables, not the missing values themselves. Imputation works.
- **MNAR** (Missing Not At Random): missingness depends on the missing value itself. Hard, needs modeling assumptions.

> **[NOTE]** You cannot prove MCAR statistically. You can only rule it out. In practice, assume MAR by default and verify with domain knowledge before removing rows.

**Try it:** Compute the percentage missing for each column in the `airquality` dataset.

```r title="Exercise: Airquality missing percentages"
# data(airquality)
# colMeans(is.na(airquality)) * 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Airquality missingness solution"
data(airquality)
round(colMeans(is.na(airquality)) * 100, 1)
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>    24.2     4.6     0.0     0.0     0.0     0.0
```

`is.na(airquality)` returns a logical matrix with `TRUE` wherever a value is missing. `colMeans()` averages each column, for a logical vector, the mean is the proportion of `TRUE`s, so multiplying by 100 gives the percent missing per variable. Here `Ozone` is missing 24% of the time and `Solar.R` under 5%.
</details>

## When should you remove rows with NA?

Removal, "listwise deletion" in stats jargon, is the simplest option. It works when NAs are rare, when the missingness is MCAR, and when you can afford to lose some sample size. The three main tools are `na.omit`, `complete.cases`, and `drop_na` from tidyr.

```r title="na.omit and dropna row removal"
library(tidyr)

df <- data.frame(
  x = c(1, NA, 3, 4, NA),
  y = c(10, 20, NA, 40, 50),
  z = c("a","b","c","d","e")
)

na.omit(df)
#>   x  y z
#> 1 1 10 a
#> 4 4 40 d

drop_na(df)        # same result, pipeable
#>   x  y z
#> 1 1 10 a
#> 4 4 40 d

drop_na(df, x)     # drop only rows where x is NA
#>    x  y z
#> 1  1 10 a
#> 3  3 NA c
#> 4  4 40 d
```

`drop_na()` in tidyr accepts a column selector, so you can drop rows where a specific column is NA while keeping rows that are missing elsewhere. This is much more surgical than `na.omit`.

```r title="Drop rows missing everywhere"
# Alternative: drop rows only where both x AND y are NA
library(dplyr)
df |> filter(!(is.na(x) & is.na(y)))
```

When to remove? Three rules of thumb:

- The column has **<5% missing** and the missingness looks random.
- The row is missing the **target variable** in a supervised model (you cannot learn from a row with no label).
- You have **plenty of data** and your analysis is not sensitive to a small sample reduction.

> **[TIP]** Before deleting, always compute the before/after row counts and note them in your pipeline. A 60% row drop silently turning into a 5% sample will haunt later steps.

**Try it:** Drop rows where `score` is NA but keep rows missing `age`.

```r title="Exercise: Drop rows missing score"
library(tidyr)
df <- data.frame(name = c("A","B","C"), age = c(30, NA, 25), score = c(NA, 70, 85))
# drop_na(df, score)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop by score solution"
library(tidyr)
df <- data.frame(name  = c("A","B","C"),
                 age   = c(30, NA, 25),
                 score = c(NA, 70, 85))
drop_na(df, score)
#>   name age score
#> 1    B  NA    70
#> 2    C  25    85
```

Passing `score` as a bare column name to `drop_na()` scopes the NA check to that column only, row "A" is dropped because its score is missing, but row "B" survives even though its age is NA. This surgical pattern is how you preserve rows that still hold useful information in unaffected columns.
</details>

## When should you impute instead of remove?

Imputation replaces missing values with plausible estimates. You impute when:

- The **fraction missing is large** (say >20%) and deleting would gut the sample.
- Missingness is **MAR** rather than MCAR, random deletion would bias results.
- The downstream model or visualization **requires complete cases** and you cannot afford to drop rows.
- You have enough information in other columns to **reasonably predict** the missing values.

![Decision tree: remove vs impute](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-decision-tree.webp)
*Figure 3: A decision tree for choosing between removing rows, simple imputation, and multiple imputation. Each branch has a rule of thumb you can apply.*

The simplest imputation is **mean** or **median** replacement for numeric variables, and **mode** (or "missing" category) replacement for categoricals. It is quick and works when missingness is modest.

```r title="Median imputation with ifelse"
library(dplyr)

df <- data.frame(
  age   = c(30, NA, 25, 40, NA, 28, 35),
  score = c(85, 70, NA, 90, 75, 88, NA)
)

df_imp <- df |>
  mutate(
    age   = ifelse(is.na(age),   median(age,   na.rm = TRUE), age),
    score = ifelse(is.na(score), median(score, na.rm = TRUE), score)
  )
df_imp
#>   age score
#> 1  30    85
#> 2  30    70   (age imputed to 30, the median)
#> 3  25    85   (score imputed to 85)
#> 4  40    90
#> 5  30    75
#> 6  28    88
#> 7  35    85
```

Simple imputation has one big drawback: it **underestimates variance**. Every imputed value is pushed toward the center, so downstream standard errors are too small. For small exploratory analyses this is fine. For inferential work, use multiple imputation.

> **[WARNING]** Mean imputation on the whole dataset leaks information from the test set into the training set if you do it before splitting. Always impute inside a pipeline that respects the train/test split.

**Try it:** Impute missing `x` values with the column mean.

```r title="Exercise: Mean imputation one-liner"
df <- data.frame(x = c(10, NA, 20, NA, 30))
# df$x <- ifelse(is.na(df$x), mean(df$x, na.rm = TRUE), df$x)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean imputation solution"
df <- data.frame(x = c(10, NA, 20, NA, 30))
df$x <- ifelse(is.na(df$x), mean(df$x, na.rm = TRUE), df$x)
df$x
#> [1] 10 20 20 20 30
```

`mean(df$x, na.rm = TRUE)` is `(10+20+30)/3 = 20`, and `ifelse()` substitutes that value wherever `is.na(df$x)` is TRUE while leaving observed values unchanged. Simple and fast, just remember that filling with the mean shrinks variance, which matters once you start computing standard errors.
</details>

## What imputation strategies are available in R?

From simplest to most sophisticated:

**1. Mean / median / mode**, one-liner with `ifelse` and `mean()` / `median()`. Fine for exploratory work; biased for inference.

**2. Last observation carried forward (LOCF)**, useful for time series:

```r title="Last observation carried forward"
library(zoo)
x <- c(10, NA, NA, 15, NA, 20)
na.locf(x)
#> [1] 10 10 10 15 15 20
```

**3. Linear interpolation**, also for time series:

```r title="Linear interpolation with na.approx"
library(zoo)
na.approx(c(10, NA, NA, 40))
#> [1] 10 20 30 40
```

**4. k-Nearest Neighbors imputation**, fills missing values using similar rows:

```r title="kNN imputation with VIM"
# library(VIM)
# df_imputed <- kNN(df, k = 5)
```

**5. Multiple Imputation with `mice`**, the gold standard for inference. It creates several imputed datasets, runs the analysis on each, and pools the results so standard errors correctly reflect the uncertainty added by imputation.

```r title="Multiple imputation with mice"
# library(mice)
# imp <- mice(df, m = 5, method = "pmm", seed = 123)
# fit <- with(imp, lm(score ~ age))
# summary(pool(fit))
```

`mice` uses predictive mean matching (`"pmm"`) by default, which imputes each missing value by drawing from observed values whose predicted values are close. It handles mixed variable types (numeric, factor, binary) with sensible per-type methods.

**6. Random Forest imputation**, `missForest` package. Fast and non-parametric:

```r title="missForest random forest imputation"
# library(missForest)
# df_imp <- missForest(df)$ximp
```

> **[TIP]** Start with mean/median for a quick look, then upgrade to `mice` once you know the dataset matters. For most real projects, `mice` is the right default, it is correct, it is flexible, and the output format is designed for standard regression workflows.

**Try it:** Use `na.approx` from `zoo` to linearly interpolate the missing values in this time series.

```r title="Exercise: Interpolate missing series"
library(zoo)
ts <- c(5, NA, NA, 20, 25, NA, 35)
# na.approx(ts)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interpolate series solution"
library(zoo)
ts <- c(5, NA, NA, 20, 25, NA, 35)
na.approx(ts)
#> [1]  5 10 15 20 25 30 35
```

`na.approx()` draws a straight line between each pair of observed values and fills the gap with the intermediate points. Between 5 and 20 the two missing slots become 10 and 15 (evenly spaced), and between 25 and 35 the single gap becomes 30, use this whenever the underlying process looks locally linear.
</details>

## How do you avoid creating NAs accidentally?

Many NAs in a dataset are your own fault, introduced by a type conversion, a failed parse, or a failed join. Four common causes and their fixes:

**1. Failed `as.numeric` on non-numeric strings:**

```r title="NA from failed numeric coercion"
as.numeric(c("1", "2", "three", "4"))
#> [1]  1  2 NA  4
#> Warning message: NAs introduced by coercion
```

Fix: clean the strings first with `gsub` / `stringr`, or use `readr::parse_number` which strips non-numeric characters before parsing.

**2. Failed date parse:**

```r title="NA from failed date parse"
lubridate::ymd(c("2026-04-11", "not a date"))
#> [1] "2026-04-11" NA
```

Fix: check `sum(is.na(result))` right after parsing and decide whether to log, fix, or drop.

**3. Unmatched rows in `left_join`:**

```r title="NA from unmatched left join"
library(dplyr)
a <- tibble(id = 1:3, value = c("x","y","z"))
b <- tibble(id = 1:2, extra = c(10, 20))
left_join(a, b, by = "id")
#> # A tibble: 3 x 3
#>      id value extra
#>   <int> <chr> <dbl>
#> 1     1 x        10
#> 2     2 y        20
#> 3     3 z        NA
```

Row with `id = 3` has no match in `b`, so `extra` becomes NA. This is by design, left joins preserve all left rows and fill missing with NA. If you expected all rows to match, validate with `anti_join(a, b, by = "id")` to find the unmatched ones.

**4. Division by zero or log of zero:**

```r title="Inf and NaN math edge cases"
log(0)
#> [1] -Inf
log(-1)
#> [1] NaN
0/0
#> [1] NaN
```

These produce `-Inf`, `Inf`, or `NaN`, not NA. But they behave similarly in downstream calculations. `is.finite()` is stricter than `is.na()` and catches all three.

> **[NOTE]** `NaN` (Not a Number) and `NA` are different. `is.na(NaN)` returns TRUE but `is.nan(NA)` returns FALSE. For most data cleaning, `is.na()` is what you want, it covers both.

**Try it:** Check the vector below for NA, NaN, and non-finite values using `is.na` and `is.finite`.

```r title="Exercise: Detect NA and non-finite"
vals <- c(1, NA, 2, NaN, Inf, -Inf, 5)
# is.na(vals); is.finite(vals)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Non-finite detection solution"
vals <- c(1, NA, 2, NaN, Inf, -Inf, 5)
is.na(vals)
#> [1] FALSE  TRUE FALSE  TRUE FALSE FALSE FALSE
is.finite(vals)
#> [1]  TRUE FALSE  TRUE FALSE FALSE FALSE  TRUE
```

`is.na()` returns `TRUE` for both `NA` *and* `NaN` (R treats NaN as a kind of missing), but `FALSE` for `Inf` and `-Inf`. `is.finite()` is stricter: only real, non-infinite numbers pass, this is the check you want before feeding a vector to a model that will choke on infinities.
</details>

## Practice Exercises

### Exercise 1: Summarize missingness

Given the built-in `airquality` dataset, compute a tibble with columns `variable` and `pct_missing`, sorted descending.

<details><summary>Solution</summary>

```r title="Airquality missingness summary"
library(tibble); library(dplyr)
data(airquality)
tibble(
  variable = names(airquality),
  pct_missing = round(colMeans(is.na(airquality)) * 100, 1)
) |>
  arrange(desc(pct_missing))
```

</details>

### Exercise 2: Targeted drop + impute

Drop rows where `Ozone` is missing. Then impute remaining NAs in `Solar.R` with the column median.

<details><summary>Solution</summary>

```r title="Drop Ozone NA then impute Solar.R"
library(dplyr); library(tidyr)
airquality |>
  drop_na(Ozone) |>
  mutate(Solar.R = ifelse(is.na(Solar.R), median(Solar.R, na.rm = TRUE), Solar.R))
```

</details>

### Exercise 3: Compare removal vs imputation

For the `airquality` dataset, compute the mean of `Ozone` (a) after listwise deletion of all incomplete rows, and (b) after median imputation. How much do they differ?

<details><summary>Solution</summary>

```r title="Listwise versus imputed Ozone mean"
library(dplyr)
delete_mean <- airquality |> na.omit() |> summarise(m = mean(Ozone)) |> pull(m)
impute_mean <- airquality |>
  mutate(Ozone = ifelse(is.na(Ozone), median(Ozone, na.rm = TRUE), Ozone)) |>
  summarise(m = mean(Ozone)) |> pull(m)
c(delete = delete_mean, impute = impute_mean)
```

</details>

## Complete Example

End-to-end pipeline on a messy survey dataset: detect, summarize, decide, and impute.

```r title="End-to-end survey imputation pipeline"
library(dplyr); library(tidyr); library(tibble)

# A realistic messy dataset
survey <- tibble(
  id = 1:10,
  age = c(25, NA, 35, 42, 28, NA, 31, 50, 45, 33),
  income = c(45000, 52000, NA, 78000, 48000, 55000, NA, 95000, 72000, NA),
  satisfaction = c(4, 5, NA, 3, 5, 4, 2, NA, 4, 5),
  department = c("Sales","Engineering","Sales",NA,"Marketing","Engineering","Sales","Engineering","Marketing","Sales")
)

# Step 1: diagnose
missing_summary <- tibble(
  variable = names(survey),
  n_missing = colSums(is.na(survey)),
  pct_missing = round(colMeans(is.na(survey)) * 100, 1)
)
missing_summary
#> # A tibble: 5 x 3
#>   variable     n_missing pct_missing
#>   <chr>            <dbl>       <dbl>
#> 1 id                   0         0
#> 2 age                  2        20
#> 3 income               3        30
#> 4 satisfaction         2        20
#> 5 department           1        10

# Step 2: drop rows with no satisfaction (the target variable)
clean <- survey |> drop_na(satisfaction)

# Step 3: impute remaining NAs
clean <- clean |>
  mutate(
    age    = ifelse(is.na(age),    median(age,    na.rm = TRUE), age),
    income = ifelse(is.na(income), median(income, na.rm = TRUE), income),
    department = ifelse(is.na(department), "Unknown", department)
  )

# Step 4: verify zero NAs remain
sum(is.na(clean))
#> [1] 0

clean
```

Four steps: diagnose → drop where required → impute the rest → verify. Every real missing-data workflow looks like this, whether you are using simple median imputation or `mice`.

## Summary

| Task | Function | Package |
|---|---|---|
| Test for NA | `is.na()` | base |
| Any NAs? | `anyNA()` | base |
| Count NAs | `sum(is.na())` | base |
| Complete rows only | `complete.cases()` / `na.omit()` | base |
| Drop rows with NA | `drop_na()` | tidyr |
| Column-wise percent | `colMeans(is.na())` | base |
| Visualize pattern | `vis_miss()` / `gg_miss_var()` | naniar |
| Time-series carry | `na.locf()` | zoo |
| Time-series interp | `na.approx()` | zoo |
| k-NN impute | `kNN()` | VIM |
| Multiple imputation | `mice()` + `pool()` | mice |
| Random forest impute | `missForest()` | missForest |

Four decision rules:

1. **NA propagates.** Any calculation touching NA returns NA unless you opt out.
2. **Diagnose before deciding.** Count, visualize, and think about the mechanism first.
3. **Remove sparingly.** Only when the drop is small and looks random.
4. **Impute thoughtfully.** Start with median; upgrade to `mice` when the stakes rise.

## References

- [Hadley Wickham and Garrett Grolemund, *R for Data Science, 2e*, Missing Values](https://r4ds.hadley.nz/missing-values.html)
- [Stef van Buuren, *Flexible Imputation of Missing Data*](https://stefvanbuuren.name/fimd/)
- [mice package documentation](https://amices.org/mice/)
- [naniar package documentation](https://naniar.njtierney.com/)
- [zoo package vignette on NA handling](https://cran.r-project.org/web/packages/zoo/vignettes/zoo.pdf)

## Continue Learning

- [Tidy Data in R](Tidy-Data-in-R.html), tidy data makes missing value handling much simpler.
- [dplyr filter() and select()](dplyr-filter-select.html), pair with `is.na()` for targeted row selection.
- [dplyr mutate() and rename()](dplyr-mutate-rename.html), where imputation lives in a pipeline.

---
title: "R Date & Time Exercises: 10 lubridate Practice Problems with Solutions"
slug: "R-Date-Time-Exercises"
description: "10 R date and time exercises: parse dates, calculate durations, extract components, handle time zones, and work with date sequences. Interactive solutions."
keywords: "R date exercises, lubridate exercises, R date time practice, R as.Date, R date manipulation"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.8"
post_type: "EX"
auto_link_terms: "R date exercises|lubridate exercises|R date time practice"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
---

# R Date & Time Exercises: 10 lubridate Practice Problems with Solutions

<p class="lead">Practice R date and time manipulation with 10 exercises: parse dates from strings, calculate age and duration, extract components, create sequences, and handle messy date formats. Uses both base R and lubridate.</p>

Dates are one of the trickiest data types in any language. These exercises cover the most common date operations you'll encounter in data analysis — from basic parsing to business-day calculations.

## Easy (1-4): Parse and Extract

### Exercise 1: Create and Inspect Dates

Create Date objects from strings in different formats. Extract the year, month, and day of the week.

```r
# Exercise 1: Parse dates and extract components
# Parse these date strings into Date objects:
# "2026-03-29", "March 15, 2024", "01/20/2025"
# Then extract: year, month name, day of week

```

<details>
<summary>Click to reveal solution</summary>

```r
# Base R date parsing
d1 <- as.Date("2026-03-29")                           # ISO format (default)
d2 <- as.Date("March 15, 2024", format = "%B %d, %Y") # Month name, day, year
d3 <- as.Date("01/20/2025", format = "%m/%d/%Y")      # MM/DD/YYYY

dates <- c(d1, d2, d3)
cat("Parsed dates:", format(dates), "\n\n")

# Extract components
for (d in dates) {
  d <- as.Date(d, origin = "1970-01-01")
  cat(sprintf("%s → Year: %d, Month: %s, Day of week: %s\n",
    format(d), as.integer(format(d, "%Y")),
    format(d, "%B"), format(d, "%A")))
}

# Quick reference of format codes
cat("\nCommon format codes:\n")
cat("  %Y = 4-digit year    %m = month number    %d = day\n")
cat("  %B = month name      %b = abbrev month    %A = weekday name\n")
```

</details>

### Exercise 2: Date Arithmetic

Calculate: how many days between two dates, what date is 100 days from today, and your age in days.

```r
# Exercise 2: Date math
today <- Sys.Date()

# 1. Days between Jan 1, 2026 and today
# 2. What date is 100 days from today?
# 3. What date was 1000 days ago?
# 4. Days between Christmas 2025 and Christmas 2026

```

<details>
<summary>Click to reveal solution</summary>

```r
today <- Sys.Date()
cat("Today:", format(today), "\n\n")

# 1. Days since Jan 1, 2026
jan1 <- as.Date("2026-01-01")
diff1 <- as.integer(today - jan1)
cat("Days since Jan 1, 2026:", diff1, "\n")

# 2. 100 days from today
future <- today + 100
cat("100 days from now:", format(future), "(", format(future, "%A"), ")\n")

# 3. 1000 days ago
past <- today - 1000
cat("1000 days ago:", format(past), "\n")

# 4. Between Christmases
xmas_2025 <- as.Date("2025-12-25")
xmas_2026 <- as.Date("2026-12-25")
cat("Days between Christmases:", as.integer(xmas_2026 - xmas_2025), "\n")

# Bonus: weeks and months
cat("\nWeeks since Jan 1:", round(diff1 / 7, 1), "\n")
cat("Months (approx):", round(diff1 / 30.44, 1), "\n")
```

</details>

### Exercise 3: Date Sequences

Create date sequences: every day for a week, every Monday in March 2026, and the first day of each month in 2026.

```r
# Exercise 3: Generate date sequences
# 1. Every day from March 1-7, 2026
# 2. Every Monday in March 2026
# 3. First day of each month in 2026

```

<details>
<summary>Click to reveal solution</summary>

```r
# 1. Daily sequence
daily <- seq(as.Date("2026-03-01"), as.Date("2026-03-07"), by = "day")
cat("Daily:", format(daily, "%b %d (%a)"), "\n\n")

# 2. Every Monday in March 2026
all_march <- seq(as.Date("2026-03-01"), as.Date("2026-03-31"), by = "day")
mondays <- all_march[format(all_march, "%A") == "Monday"]
cat("Mondays in March:", format(mondays, "%b %d"), "\n\n")

# 3. First of each month
month_starts <- seq(as.Date("2026-01-01"), as.Date("2026-12-01"), by = "month")
cat("Month starts:\n")
for (d in month_starts) {
  d <- as.Date(d, origin = "1970-01-01")
  cat(sprintf("  %s (%s)\n", format(d, "%B %d"), format(d, "%A")))
}
```

**Key concept:** `seq()` works with dates. `by = "day"`, `by = "week"`, `by = "month"`, `by = "quarter"` are all valid.

</details>

### Exercise 4: Parse Messy Dates

Clean a vector of dates in mixed formats and convert them all to proper Date objects.

```r
# Exercise 4: Parse messy date formats
messy_dates <- c("2024-01-15", "03/22/2024", "January 5, 2024",
                 "2024.06.30", "15-Aug-2024", "12/1/24")

# Parse ALL of these into Date objects

```

<details>
<summary>Click to reveal solution</summary>

```r
messy_dates <- c("2024-01-15", "03/22/2024", "January 5, 2024",
                 "2024.06.30", "15-Aug-2024", "12/1/24")

# Try multiple formats for each date
parse_date <- function(x) {
  formats <- c("%Y-%m-%d", "%m/%d/%Y", "%B %d, %Y",
               "%Y.%m.%d", "%d-%b-%Y", "%m/%d/%y")
  for (fmt in formats) {
    result <- tryCatch(as.Date(x, format = fmt), error = function(e) NA)
    if (!is.na(result)) return(result)
  }
  return(NA)
}

parsed <- as.Date(sapply(messy_dates, parse_date), origin = "1970-01-01")

cat("Parsing results:\n")
for (i in seq_along(messy_dates)) {
  cat(sprintf("  %-20s → %s\n", messy_dates[i], format(parsed[i])))
}

cat("\nAll parsed:", format(parsed), "\n")
cat("Any failures:", sum(is.na(parsed)), "\n")
```

**Key concept:** Real data has mixed date formats. Try multiple `format` strings and use the first that succeeds. `%y` is 2-digit year, `%Y` is 4-digit.

</details>

## Medium (5-7): Calculations and Grouping

### Exercise 5: Age Calculator

Write a function that calculates exact age in years given a birth date. Test with several dates.

```r
# Exercise 5: Calculate exact age
# Write age_years(birth_date) that returns age in decimal years
# Account for leap years properly

```

<details>
<summary>Click to reveal solution</summary>

```r
age_years <- function(birth_date, ref_date = Sys.Date()) {
  birth <- as.Date(birth_date)
  ref <- as.Date(ref_date)

  # Calculate year difference, adjust if birthday hasn't occurred yet
  years <- as.integer(format(ref, "%Y")) - as.integer(format(birth, "%Y"))

  # Has this year's birthday passed?
  birth_this_year <- as.Date(paste0(format(ref, "%Y"), format(birth, "-%m-%d")))
  if (ref < birth_this_year) years <- years - 1

  # Decimal part
  if (ref >= birth_this_year) {
    next_birthday <- as.Date(paste0(as.integer(format(ref, "%Y")) + 1, format(birth, "-%m-%d")))
    fraction <- as.numeric(ref - birth_this_year) / as.numeric(next_birthday - birth_this_year)
  } else {
    prev_birthday <- as.Date(paste0(as.integer(format(ref, "%Y")) - 1, format(birth, "-%m-%d")))
    fraction <- as.numeric(ref - prev_birthday) / as.numeric(birth_this_year - prev_birthday)
  }

  return(round(years + fraction, 2))
}

# Test
births <- c("1990-06-15", "2000-01-01", "1985-12-31", "2005-03-29")
today <- Sys.Date()

for (b in births) {
  cat(sprintf("Born %s → Age: %.2f years\n", b, age_years(b, today)))
}
```

</details>

### Exercise 6: Business Days

Calculate the number of business days (Mon-Fri, excluding weekends) between two dates.

```r
# Exercise 6: Count business days
# How many business days between March 1 and March 31, 2026?
# How many weekend days?

```

<details>
<summary>Click to reveal solution</summary>

```r
business_days <- function(start, end) {
  all_days <- seq(as.Date(start), as.Date(end), by = "day")
  weekdays <- format(all_days, "%u")  # 1=Monday, 7=Sunday
  is_weekday <- weekdays %in% c("1", "2", "3", "4", "5")

  list(
    total_days = length(all_days),
    business_days = sum(is_weekday),
    weekend_days = sum(!is_weekday),
    first_day = format(all_days[1], "%A"),
    last_day = format(all_days[length(all_days)], "%A")
  )
}

result <- business_days("2026-03-01", "2026-03-31")
cat("March 2026:\n")
cat("  Total days:", result$total_days, "\n")
cat("  Business days:", result$business_days, "\n")
cat("  Weekend days:", result$weekend_days, "\n")
cat("  Starts:", result$first_day, "\n")
cat("  Ends:", result$last_day, "\n")

# Q1 2026
q1 <- business_days("2026-01-01", "2026-03-31")
cat("\nQ1 2026 business days:", q1$business_days, "\n")
```

**Key concept:** `format(date, "%u")` gives the ISO weekday number (1=Monday, 7=Sunday). Filter for 1-5 to get business days.

</details>

### Exercise 7: Monthly Aggregation

Given daily sales data, aggregate by month and find the best month.

```r
# Exercise 7: Group daily data by month
set.seed(42)
dates <- seq(as.Date("2025-01-01"), as.Date("2025-12-31"), by = "day")
sales <- round(runif(length(dates), 500, 2000) +
               sin(seq_along(dates)/365 * 2 * pi) * 300, 0)

# 1. Create a data frame with date and sales
# 2. Add a month column
# 3. Calculate monthly totals
# 4. Find the best and worst months

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
dates <- seq(as.Date("2025-01-01"), as.Date("2025-12-31"), by = "day")
sales <- round(runif(length(dates), 500, 2000) +
               sin(seq_along(dates)/365 * 2 * pi) * 300, 0)

# 1. Data frame
df <- data.frame(date = dates, sales = sales)

# 2. Add month
df$month <- format(df$date, "%Y-%m")
df$month_name <- format(df$date, "%B")

# 3. Monthly totals
monthly <- aggregate(sales ~ month + month_name, data = df, FUN = sum)
monthly <- monthly[order(monthly$month), ]

cat("Monthly sales:\n")
for (i in 1:nrow(monthly)) {
  bar <- paste(rep("#", round(monthly$sales[i] / 1000)), collapse = "")
  cat(sprintf("  %s %-10s $%6d %s\n",
    monthly$month[i], monthly$month_name[i], monthly$sales[i], bar))
}

# 4. Best and worst
cat("\nBest month:", monthly$month_name[which.max(monthly$sales)],
    "($", max(monthly$sales), ")\n")
cat("Worst month:", monthly$month_name[which.min(monthly$sales)],
    "($", min(monthly$sales), ")\n")
```

</details>

## Hard (8-10): Real-World Date Challenges

### Exercise 8: Date-Based Cohort Analysis

Assign customers to cohorts based on their signup month, then calculate retention.

```r
# Exercise 8: Customer cohorts
set.seed(42)
n <- 100
signups <- data.frame(
  customer_id = 1:n,
  signup_date = as.Date("2025-01-01") + sample(0:364, n, replace = TRUE),
  last_active = as.Date("2025-01-01") + sample(0:400, n, replace = TRUE)
)

# 1. Assign each customer to a signup month cohort
# 2. Calculate "active days" (last_active - signup_date)
# 3. What % of each cohort was active for 90+ days?

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
n <- 100
signups <- data.frame(
  customer_id = 1:n,
  signup_date = as.Date("2025-01-01") + sample(0:364, n, replace = TRUE),
  last_active = as.Date("2025-01-01") + sample(0:400, n, replace = TRUE)
)

# Fix: last_active must be >= signup_date
signups$last_active <- pmax(signups$last_active, signups$signup_date)

# 1. Cohort = signup month
signups$cohort <- format(signups$signup_date, "%Y-%m")

# 2. Active days
signups$active_days <- as.integer(signups$last_active - signups$signup_date)

# 3. Retention by cohort
cohort_stats <- aggregate(
  cbind(active_days, customer_id) ~ cohort,
  data = signups,
  FUN = function(x) c(n = length(x), mean = round(mean(x), 0))
)

# Simpler approach
library(dplyr)
retention <- signups |>
  group_by(cohort) |>
  summarise(
    customers = n(),
    avg_active_days = round(mean(active_days), 0),
    retained_90d = sum(active_days >= 90),
    retention_pct = round(mean(active_days >= 90) * 100, 1)
  )

cat("Cohort retention analysis:\n")
print(as.data.frame(retention))
```

</details>

### Exercise 9: Time Series Date Handling

Generate a complete daily time series, fill in missing dates, and identify gaps.

```r
# Exercise 9: Fill missing dates in time series
# This data has gaps (weekends and random missing days)
set.seed(42)
raw_dates <- seq(as.Date("2026-03-01"), as.Date("2026-03-31"), by = "day")
# Remove weekends and some random days
keep <- format(raw_dates, "%u") %in% c("1","2","3","4","5") & runif(length(raw_dates)) > 0.15
observed <- data.frame(
  date = raw_dates[keep],
  value = round(rnorm(sum(keep), 100, 10), 1)
)

# 1. How many days are missing?
# 2. Create a complete daily sequence and merge
# 3. Fill missing values with the previous day's value

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
raw_dates <- seq(as.Date("2026-03-01"), as.Date("2026-03-31"), by = "day")
keep <- format(raw_dates, "%u") %in% c("1","2","3","4","5") & runif(length(raw_dates)) > 0.15
observed <- data.frame(
  date = raw_dates[keep],
  value = round(rnorm(sum(keep), 100, 10), 1)
)

cat("Observed days:", nrow(observed), "of 31\n")

# 1. Missing days
all_days <- seq(as.Date("2026-03-01"), as.Date("2026-03-31"), by = "day")
missing <- all_days[!all_days %in% observed$date]
cat("Missing days:", length(missing), "\n")
cat("Missing dates:", format(missing, "%b %d"), "\n\n")

# 2. Complete daily sequence
complete <- data.frame(date = all_days)
complete <- merge(complete, observed, by = "date", all.x = TRUE)

# 3. Forward-fill NAs
for (i in 2:nrow(complete)) {
  if (is.na(complete$value[i])) {
    complete$value[i] <- complete$value[i - 1]
  }
}

cat("Complete series (first 10):\n")
complete$filled <- ifelse(complete$date %in% observed$date, "", " (filled)")
print(head(complete, 10))
```

</details>

### Exercise 10: Holiday and Event Calculator

Build a function that calculates the dates of common holidays and events for any given year.

```r
# Exercise 10: Holiday calculator
# Write get_holidays(year) that returns dates for:
# - New Year's Day (Jan 1)
# - Valentine's Day (Feb 14)
# - US Independence Day (Jul 4)
# - Halloween (Oct 31)
# - Christmas (Dec 25)
# - Thanksgiving (4th Thursday of November)
# - Easter (harder — use an algorithm or lookup)
# Also: show which day of the week each falls on

```

<details>
<summary>Click to reveal solution</summary>

```r
get_holidays <- function(year) {
  # Fixed holidays
  holidays <- data.frame(
    name = c("New Year's Day", "Valentine's Day", "Independence Day",
             "Halloween", "Christmas"),
    date = as.Date(c(
      paste0(year, "-01-01"), paste0(year, "-02-14"),
      paste0(year, "-07-04"), paste0(year, "-10-31"),
      paste0(year, "-12-25")
    )),
    stringsAsFactors = FALSE
  )

  # Thanksgiving: 4th Thursday of November
  nov_days <- seq(as.Date(paste0(year, "-11-01")),
                  as.Date(paste0(year, "-11-30")), by = "day")
  thursdays <- nov_days[format(nov_days, "%A") == "Thursday"]
  thanksgiving <- thursdays[4]
  holidays <- rbind(holidays,
    data.frame(name = "Thanksgiving", date = thanksgiving))

  # Sort by date
  holidays <- holidays[order(holidays$date), ]
  holidays$day_of_week <- format(holidays$date, "%A")
  holidays$formatted <- format(holidays$date, "%B %d")

  return(holidays)
}

# Test for 2026
cat("=== 2026 Holidays ===\n")
h2026 <- get_holidays(2026)
for (i in 1:nrow(h2026)) {
  cat(sprintf("  %-20s %s (%s)\n",
    h2026$name[i], h2026$formatted[i], h2026$day_of_week[i]))
}

# Compare two years
cat("\n=== Christmas Day of Week ===\n")
for (y in 2024:2030) {
  xmas <- as.Date(paste0(y, "-12-25"))
  cat(sprintf("  %d: %s\n", y, format(xmas, "%A")))
}
```

**Key concept:** Fixed holidays are easy — just construct the date string. "Nth weekday of month" holidays (like Thanksgiving) require generating all days in the month and filtering. This is a common real-world date calculation.

</details>

## Summary: Skills Practiced

| Exercises | Date/Time Skills |
|-----------|-----------------|
| 1-4 (Easy) | `as.Date()`, `format()`, date arithmetic, `seq()`, parsing mixed formats |
| 5-7 (Medium) | Age calculation, business days, monthly aggregation |
| 8-10 (Hard) | Cohort analysis, time series gap filling, holiday calculation |

## Continue Learning

One more exercise set:

1. **R apply Family Exercises** — master apply, lapply, sapply, tapply

Or continue learning: **Data Wrangling with dplyr** tutorial.

# Plan: lubridate in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | lubridate in R: Parse Dates Once, Stop Fighting Time Zones Forever |
| slug | lubridate-in-R |
| description | lubridate parses dates from any format, extracts components like month() and wday(), and computes durations and intervals. Learn the functions that replace base R date handling. |
| keywords | lubridate, lubridate in R, R date parsing, ymd(), mdy(), dmy(), R time zones, duration vs period R, date arithmetic R, lubridate tutorial |
| auto_link_terms | lubridate\|lubridate in R\|ymd()\|mdy()\|dmy()\|date parsing in R\|R date arithmetic\|duration vs period |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.2.11 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | lubridate |
| sidebar_order | 12 |
| fr_parent | (not applicable — this is a C post) |

## B. Breadcrumb

Home > Data Wrangling > String & Date Manipulation > lubridate in R

## C. Full Section Outline

### Lead sentence
lubridate is a tidyverse package that parses date strings from any format, extracts components like year, month, and weekday, and performs arithmetic with durations, periods, and intervals.

### Introduction (## Introduction)
- Hook: Dates in R are painful. Base R parsing with `as.Date()` and `strptime()` requires memorizing cryptic format codes like `%Y-%m-%d`. One wrong `%` code and you get NA with no explanation.
- What lubridate offers: intuitive parsing (just match the order of year/month/day), accessor functions for components, and three time-span classes for arithmetic.
- What you'll learn: parsing any date format, extracting/modifying components, computing differences with durations/periods/intervals, handling time zones.
- Note: lubridate loads with `library(lubridate)` (part of tidyverse but not loaded by default).
- Diagram: Figure 1 (parsing family) placed here.

### Core Content Sections (5 sections, all question-form H2)

#### Section 1: ## How Does lubridate Parse Dates from Any Format?
- Theory: The parsing function name matches the order of date components. ymd() for year-month-day, mdy() for month-day-year, dmy() for day-month-year. Separators are auto-detected.
- Code block 1: Load lubridate, parse dates with ymd(), mdy(), dmy()
- Code block 2: Parse date-times with ymd_hms(), mdy_hm()
- Code block 3: parse_date_time() for mixed formats
- Callout: TIP about parse_date_time() handling heterogeneous date columns
- Mention: ms(), hm(), hms() for time-only parsing

#### Section 2: ## How Do You Extract and Modify Date Components?
- Theory: lubridate provides accessor functions that both get and set components: year(), month(), day(), hour(), minute(), second(), wday(), yday(), week().
- Diagram: Figure 2 (component extraction) placed here.
- Code block 4: Extract year, month, day, wday from a date
- Code block 5: Use month(label=TRUE) and wday(label=TRUE) for names
- Code block 6: Set/modify a component (month(date) <- 12)
- Callout: KEY INSIGHT about accessor functions being both getters and setters

#### Section 3: ## How Do You Round Dates to Useful Boundaries?
- Theory: floor_date(), ceiling_date(), round_date() snap dates to boundaries like month, week, quarter. Useful for grouping and aggregation.
- Code block 7: Round dates to month, week, quarter
- Code block 8: Practical example — group transactions by month
- Callout: TIP about using floor_date() with dplyr group_by for monthly summaries

#### Section 4: ## What Is the Difference Between Durations, Periods, and Intervals?
- Theory: This is the conceptual heart of lubridate. Duration = exact seconds (physical time). Period = clock units (human time). Interval = bounded span with start and end.
- Diagram: Figure 3 (duration vs period vs interval) placed here.
- Code block 9: Create durations with dyears(), ddays(), dhours()
- Code block 10: Create periods with years(), months(), days()
- Code block 11: Show the difference — adding period(1 year) vs duration(1 year) across a leap year
- Code block 12: Create intervals with %--%, use %within%, int_length()
- Callout: WARNING about duration vs period giving different results across DST/leap year boundaries
- Callout: KEY INSIGHT about choosing the right span type

#### Section 5: ## How Do You Handle Time Zones Without Losing Your Mind?
- Theory: with_tz() changes display (same moment, different clock). force_tz() changes the time zone label (different moment, same clock reading). OlsonNames() lists valid zones.
- Code block 13: with_tz() to convert display time zones
- Code block 14: force_tz() to re-label a time zone
- Callout: WARNING about force_tz() changing the actual moment in time

### Common Mistakes (## Common Mistakes and How to Fix Them)
1. Using as.Date() format codes with lubridate (lubridate doesn't need %Y-%m-%d)
2. Confusing with_tz() and force_tz() (one displays, the other changes)
3. Using duration arithmetic when you mean period arithmetic (adding dyears(1) to a leap year date)
4. Forgetting that month() returns integer, not name (use label=TRUE)

### Practice Exercises (## Practice Exercises)
1. Easy: Parse three dates in different formats (ymd, mdy, dmy)
2. Easy-Medium: Extract the weekday name and month name from today's date
3. Medium: Calculate someone's age in years from their birthdate using intervals
4. Medium-Hard: Given a vector of timestamps, floor each to the nearest hour and count occurrences
5. Hard: Compare duration vs period addition across a DST boundary

### Complete Example (## Putting It All Together)
End-to-end: parse a character vector of mixed-format dates, extract components, compute age, group by month, handle time zones.

### Summary (## Summary)
Table of key functions organized by task: Parsing, Extracting, Rounding, Arithmetic, Time Zones.

### FAQ (## FAQ)
1. Is lubridate part of the tidyverse? (Yes, but not loaded by default with library(tidyverse))
2. Can lubridate handle dates before 1970? (Yes, POSIXct supports negative timestamps)
3. When should I use as.Date() vs lubridate? (lubridate for any interactive/wrangling work; as.Date for simple date-only values)
4. How do I parse dates with non-English month names? (locale argument in parse_date_time())
5. What is the difference between mday() and day()? (They are aliases — both return day of month)

### References (## References)
1. Grolemund, G. & Wickham, H. — Dates and Times Made Easy with lubridate. Journal of Statistical Software (2011). [Link](https://www.jstatsoft.org/article/view/v040i03)
2. lubridate documentation — tidyverse.org. [Link](https://lubridate.tidyverse.org/)
3. CRAN vignette — Do more with dates and times in R. [Link](https://cran.r-project.org/web/packages/lubridate/vignettes/lubridate.html)
4. Wickham, H. & Grolemund, G. — R for Data Science, 2nd ed. Chapter 17: Dates and Times. [Link](https://r4ds.hadley.nz/datetimes)
5. R Core Team — DateTimeClasses documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/DateTimeClasses.html)
6. RStudio — lubridate cheatsheet. [Link](https://rstudio.github.io/cheatsheets/html/lubridate.html)
7. Spinu, V., Grolemund, G., & Wickham, H. — lubridate package on CRAN. [Link](https://cran.r-project.org/package=lubridate)

### What's Next (## What's Next?)
1. stringr in R — Learn string manipulation with the same tidyverse philosophy. [Link](/stringr-in-R.html)
2. dplyr filter & select — Combine date extraction with data filtering. [Link](/dplyr-filter-select.html)
3. Tidy Data in R — Reshape date columns into analysis-ready format. [Link](/Tidy-Data-in-R.html)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | lubridate-in-R-parsing-family.webp | Figure 1 | How lubridate parsing functions map date component order to the right function. | Introduction |
| 2 | lubridate-in-R-component-extraction.webp | Figure 2 | Extracting individual components from a date-time object. | How Do You Extract and Modify Date Components? |
| 3 | lubridate-in-R-duration-period-interval.webp | Figure 3 | Duration measures exact seconds, Period tracks clock units, Interval bounds a specific span. | What Is the Difference Between Durations, Periods, and Intervals? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load lubridate, parse dates with ymd/mdy/dmy | lubridate | date1, date2, date3 | — |
| 2 | Parse date-times with ymd_hms, mdy_hm | — | dt1, dt2 | — |
| 3 | parse_date_time() for mixed formats | — | mixed_dates, parsed | — |
| 4 | Extract year, month, day, wday | — | today | — |
| 5 | month(label=TRUE) and wday(label=TRUE) | — | — | today |
| 6 | Set/modify components | — | my_date | — |
| 7 | Round dates to boundaries | — | timestamps | — |
| 8 | Practical monthly grouping | dplyr | sales, monthly_sales | — |
| 9 | Create durations | — | dur1, dur2 | — |
| 10 | Create periods | — | per1, per2 | — |
| 11 | Duration vs period across leap year | — | leap_date, dur_result, per_result | — |
| 12 | Intervals with %--%, %within% | — | start, end, my_interval, check_date | — |
| 13 | with_tz() time zone conversion | — | utc_time, ny_time, tokyo_time | — |
| 14 | force_tz() re-labeling | — | local_time, forced | — |
| 15 | Complete example (end-to-end) | — | raw_dates, clean_df | — |

Estimated word count: ~4500-5000 words
Code blocks: 15
Diagrams: 3
Exercises: 5
Callouts: ~8 (2 TIP, 2 WARNING, 2 KEY INSIGHT, 1 NOTE)

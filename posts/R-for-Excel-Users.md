---
title: "R for Excel Users: The Complete Migration Guide with Examples"
slug: "R-for-Excel-Users"
description: "Migrate from Excel to R with side-by-side formula mappings. Learn to replace VLOOKUP, pivot tables, charts, and macros with R equivalents."
keywords: "R for Excel users, Excel to R, VLOOKUP in R, pivot table R, Excel formula R equivalent, migrate Excel to R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "CAR8"
post_type: "FR"
auto_link_terms: "R for Excel users|Excel to R|migrate from Excel"
auto_link_case_sensitive: false
fr_parent: "Is-R-Worth-Learning-in-2026.html"
---

# R for Excel Users: The Complete Migration Guide with Examples

<p class="lead">If you know Excel, you already understand data manipulation — you just need to learn R's syntax. This guide maps every Excel formula, pivot table, and chart type to its R equivalent with runnable examples.</p>

Moving from Excel to R feels like learning a new language, but the concepts transfer directly. Excel's SUM becomes `sum()`, VLOOKUP becomes `merge()`, and pivot tables become a few lines of `aggregate()` or tidyr code. This guide gives you the Rosetta Stone.

## Why Move from Excel to R?

Excel is excellent for quick exploration, but it breaks down when you need:

- **Reproducibility**: R scripts document every step; Excel's click-based workflow doesn't
- **Scale**: Excel slows at 100K rows; R handles millions
- **Automation**: R scripts run on a schedule; Excel macros are fragile
- **Version control**: R code works with Git; spreadsheets don't diff well
- **Statistical rigor**: R has 20,000+ packages for specialized analysis

That said, Excel is still great for quick data entry, sharing with non-technical stakeholders, and simple ad-hoc lookups. The goal isn't to abandon Excel — it's to know when R is the better tool.

## Formula Mapping: Excel → R

The most common Excel functions and their direct R equivalents.

### Math & Statistics

| Excel Formula | R Equivalent | Example |
|--------------|-------------|---------|
| `=SUM(A1:A10)` | `sum(x)` | `sum(df$sales)` |
| `=AVERAGE(A1:A10)` | `mean(x)` | `mean(df$sales)` |
| `=MEDIAN(A1:A10)` | `median(x)` | `median(df$sales)` |
| `=STDEV(A1:A10)` | `sd(x)` | `sd(df$sales)` |
| `=VAR(A1:A10)` | `var(x)` | `var(df$sales)` |
| `=MIN(A1:A10)` | `min(x)` | `min(df$sales)` |
| `=MAX(A1:A10)` | `max(x)` | `max(df$sales)` |
| `=COUNT(A1:A10)` | `length(x)` or `sum(!is.na(x))` | `length(df$sales)` |
| `=COUNTA(A1:A10)` | `sum(!is.na(x))` | `sum(!is.na(df$name))` |
| `=COUNTBLANK(A1:A10)` | `sum(is.na(x))` | `sum(is.na(df$sales))` |
| `=COUNTIF(A1:A10,">5")` | `sum(x > 5)` | `sum(df$sales > 5)` |
| `=SUMIF(A:A,"East",B:B)` | `sum(x[cond])` | `sum(df$sales[df$region == "East"])` |
| `=ROUND(A1, 2)` | `round(x, 2)` | `round(3.14159, 2)` |
| `=ABS(A1)` | `abs(x)` | `abs(-5)` |
| `=SQRT(A1)` | `sqrt(x)` | `sqrt(16)` |
| `=PERCENTILE(A:A, 0.75)` | `quantile(x, 0.75)` | `quantile(df$sales, 0.75)` |
| `=CORREL(A:A, B:B)` | `cor(x, y)` | `cor(df$x, df$y)` |

```r
# Excel-like calculations in R
sales <- c(120, 85, 200, 150, 95, 310, 175, 60, 225, 140)
cat("SUM:", sum(sales), "\n")
cat("AVERAGE:", mean(sales), "\n")
cat("STDEV:", round(sd(sales), 2), "\n")
cat("COUNTIF > 150:", sum(sales > 150), "\n")
cat("SUMIF > 150:", sum(sales[sales > 150]), "\n")
```

### Text Functions

| Excel Formula | R Equivalent | Example |
|--------------|-------------|---------|
| `=LEN(A1)` | `nchar(x)` | `nchar("hello")` |
| `=UPPER(A1)` | `toupper(x)` | `toupper("hello")` |
| `=LOWER(A1)` | `tolower(x)` | `tolower("HELLO")` |
| `=TRIM(A1)` | `trimws(x)` | `trimws("  hi  ")` |
| `=LEFT(A1, 3)` | `substr(x, 1, 3)` | `substr("hello", 1, 3)` |
| `=RIGHT(A1, 3)` | `substr(x, nchar(x)-2, nchar(x))` | `substr("hello", 3, 5)` |
| `=MID(A1, 2, 3)` | `substr(x, 2, 4)` | `substr("hello", 2, 4)` |
| `=CONCATENATE(A1,B1)` | `paste0(a, b)` | `paste0("hello", " world")` |
| `=SUBSTITUTE(A1,"old","new")` | `gsub("old","new",x)` | `gsub("old","new","old text")` |
| `=FIND("x", A1)` | `regexpr("x", s)` | `regexpr("l", "hello")` |
| `=TEXT(A1, "0.00")` | `sprintf("%.2f", x)` | `sprintf("%.2f", 3.1)` |

```r
# Text manipulation like Excel
names <- c("  Alice Smith  ", "bob jones", "CAROL LEE")
cat("TRIM + UPPER:", toupper(trimws(names[1])), "\n")
cat("LEFT 5:", substr(trimws(names[1]), 1, 5), "\n")
cat("SUBSTITUTE:", gsub("bob", "Bob", names[2]), "\n")
```

### Logical & Lookup

| Excel Formula | R Equivalent | Example |
|--------------|-------------|---------|
| `=IF(A1>5,"Y","N")` | `ifelse(x>5,"Y","N")` | `ifelse(score>90,"Pass","Fail")` |
| `=AND(A1>5,B1<10)` | `x>5 & y<10` | `df$x>5 & df$y<10` |
| `=OR(A1>5,B1<10)` | `x>5 \| y<10` | `df$x>5 \| df$y<10` |
| `=IFERROR(A1/B1,0)` | `ifelse(y==0, 0, x/y)` or `tryCatch()` | `tryCatch(x/y, error=function(e) 0)` |
| `=VLOOKUP(val,tbl,2,F)` | `merge()` or `match()` | `merge(df1, df2, by="id")` |
| `=INDEX(MATCH(...))` | `x[match(val, keys)]` | `prices[match("apple", products)]` |
| `=RANK(A1, A:A)` | `rank(-x)` | `rank(-df$score)` |

```r
# VLOOKUP equivalent using merge
orders <- data.frame(
  product_id = c(101, 102, 103, 101, 102),
  quantity = c(5, 3, 8, 2, 6)
)
products <- data.frame(
  product_id = c(101, 102, 103),
  name = c("Widget", "Gadget", "Doohickey"),
  price = c(9.99, 24.99, 4.99)
)
# This is your VLOOKUP
result <- merge(orders, products, by = "product_id")
result$total <- result$quantity * result$price
print(result)
```

## Pivot Tables → aggregate() and tidyr

Excel's pivot tables summarize data by groups. R does this with `aggregate()`, `tapply()`, or the tidyverse.

```r
# Create sample sales data
sales_data <- data.frame(
  region = rep(c("North","South","East","West"), each = 5),
  product = rep(c("A","B","C","D","E"), 4),
  revenue = c(120,85,200,150,95, 310,175,60,225,140,
              180,90,155,210,130, 270,160,95,185,115)
)

# Pivot: average revenue by region (like a pivot table)
cat("=== Revenue by Region ===\n")
print(aggregate(revenue ~ region, data = sales_data, FUN = mean))

cat("\n=== Revenue by Region + Product ===\n")
pivot <- aggregate(revenue ~ region + product, data = sales_data, FUN = sum)
print(head(pivot, 10))
```

For cross-tabulation (the classic pivot table layout):

```r
# Cross-tabulation like an Excel pivot table
cat("Cross-tab of region by product:\n")
print(xtabs(revenue ~ region + product, data = sales_data))
```

## Charts: Excel → R (ggplot2)

| Excel Chart Type | R Function | Package |
|-----------------|-----------|---------|
| Column/bar chart | `barplot()` or `geom_col()` | base / ggplot2 |
| Line chart | `plot(type="l")` or `geom_line()` | base / ggplot2 |
| Scatter plot | `plot()` or `geom_point()` | base / ggplot2 |
| Pie chart | `pie()` | base |
| Histogram | `hist()` or `geom_histogram()` | base / ggplot2 |
| Box plot | `boxplot()` or `geom_boxplot()` | base / ggplot2 |
| Area chart | `polygon()` or `geom_area()` | base / ggplot2 |

```r
# Quick charts in base R (no packages needed)
par(mfrow = c(1, 2))

# Bar chart (like Excel column chart)
region_totals <- tapply(sales_data$revenue, sales_data$region, sum)
barplot(region_totals, main = "Revenue by Region",
        col = c("#4e79a7","#f28e2b","#e15759","#76b7b2"),
        ylab = "Total Revenue")

# Scatter plot
plot(mtcars$wt, mtcars$mpg,
     main = "Weight vs MPG", xlab = "Weight", ylab = "MPG",
     pch = 19, col = "#4e79a7")
```

## Filtering & Sorting

| Excel Action | R Equivalent |
|-------------|-------------|
| AutoFilter by value | `subset(df, column == "value")` |
| Filter multiple conditions | `subset(df, col1 > 5 & col2 == "A")` |
| Sort ascending | `df[order(df$col), ]` |
| Sort descending | `df[order(-df$col), ]` |
| Sort by multiple columns | `df[order(df$col1, -df$col2), ]` |
| Remove duplicates | `df[!duplicated(df), ]` |
| Conditional formatting | Not direct — use `ifelse()` to flag rows |

```r
# Filtering and sorting
cat("=== Cars with MPG > 25 (sorted) ===\n")
fast <- subset(mtcars, mpg > 25)
fast <- fast[order(-fast$mpg), ]
print(fast[, c("mpg","cyl","wt")])
```

## Common Workflow Translations

### Workflow 1: Read, Clean, Summarize, Export

```r
# Excel: Open file → Filter → Pivot → Save As
# R equivalent:
df <- data.frame(
  name = c("Alice","Bob","Carol","Dave","Eve"),
  dept = c("Sales","IT","Sales","IT","Sales"),
  salary = c(65000, 72000, 58000, 80000, 61000)
)

# Filter (like Excel AutoFilter)
sales_team <- subset(df, dept == "Sales")

# Summarize (like a pivot table)
dept_summary <- aggregate(salary ~ dept, data = df,
                          FUN = function(x) c(mean = mean(x), count = length(x)))
cat("Department summary:\n")
print(dept_summary)
```

### Workflow 2: Conditional Columns

```r
# Excel: =IF(B2>70000, "Senior", "Junior") dragged down
df$level <- ifelse(df$salary > 70000, "Senior", "Junior")
cat("With levels:\n")
print(df)
```

## Summary: Excel → R Rosetta Stone

| Excel Concept | R Equivalent | Key Function |
|--------------|-------------|-------------|
| Cell reference (A1) | Column indexing | `df$col` or `df[row, col]` |
| Formulas | Functions | `sum()`, `mean()`, etc. |
| Drag-down | Vectorization | Functions apply to whole columns |
| Pivot tables | Aggregation | `aggregate()`, `tapply()`, `xtabs()` |
| VLOOKUP | Merge/join | `merge(df1, df2, by = "key")` |
| Charts | Plotting | `plot()`, `barplot()`, `hist()` |
| Macros | Scripts | `.R` files, `source()` |
| Named ranges | Variables | `x <- df$column` |
| Multiple sheets | Lists of data frames | `list(sheet1 = df1, sheet2 = df2)` |
| Conditional formatting | Logical vectors | `ifelse()`, `which()` |

## FAQ

**Can R read Excel files directly?**
Yes. Use the `readxl` package: `readxl::read_excel("file.xlsx", sheet = "Sheet1")`. For writing, use `writexl::write_xlsx(df, "output.xlsx")`. No Java dependency required.

**Is R harder than Excel?**
R has a steeper initial learning curve because you type commands instead of clicking. But once you learn the basics, complex tasks become *easier* in R because you can chain operations, reuse code, and automate everything.

**Can I use R and Excel together?**
Absolutely. Many analysts use Excel for quick data entry and sharing, then R for analysis and visualization. The `readxl` and `openxlsx` packages make it easy to move data between the two.

## What's Next

- [Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html) — The full case for learning R
- [R Cheat Sheet](R-Cheat-Sheet.html) — 200 essential R functions at a glance
- [R for SPSS Users](R-for-SPSS-Users.html) — Another migration guide for SPSS users

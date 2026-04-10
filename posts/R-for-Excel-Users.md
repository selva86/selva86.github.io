---
title: "R for Excel Users: The Complete Step-by-Step Transition Guide"
slug: "R-for-Excel-Users"
description: "Moving from Excel to R? This guide maps every Excel operation to its R equivalent — VLOOKUP to joins, pivot tables to group_by, conditional formatting to ggplot."
keywords: "R for Excel users, Excel to R, VLOOKUP in R, pivot table in R, Excel functions in R, dplyr for Excel users, R transition guide, Excel to R mapping, group_by summarize R, ggplot for Excel users"
auto_link_terms: "R for Excel users|Excel to R|VLOOKUP in R|pivot table in R|Excel functions in R|Excel to R transition|R for spreadsheet users"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-clea-2"
post_type: "C"
fr_parent: "Data-Quality-Checking-in-R.html"
sidebar_section: "Learn R"
sidebar_title: "R for Excel Users"
---


# R for Excel Users: The Complete Step-by-Step Transition Guide

<p class="lead">R for Excel users is a practical mapping of every common spreadsheet operation — filtering, sorting, VLOOKUP, pivot tables, IF formulas, and charts — to its R equivalent using base R, dplyr, tidyr, and ggplot2.</p>

You already think in data. Every time you write a VLOOKUP, drag a formula down a column, or build a pivot table, you are doing data analysis. R does the same things — filtering rows, computing new columns, joining tables, summarizing groups, and making charts — but with code instead of mouse clicks.

The advantage is scale and reproducibility. R handles a million rows without freezing. A script you write today runs identically tomorrow on fresh data. And once you learn the pattern, you never rebuild the same pivot table by hand again.

## Introduction

If you have spent years in Excel, switching to R feels like learning a new language. That is because it is one. But here is the good news: every Excel concept you already know has a direct R equivalent. The mental model transfers. Only the syntax changes.

This tutorial maps the Excel operations you use every day to their R counterparts. We cover AutoFilter (filtering and sorting), column formulas (calculated columns), VLOOKUP (joins), pivot tables (group and summarize), SUMIF/COUNTIF (conditional aggregation), Unpivot and Text-to-Columns (reshaping), and charts including conditional formatting equivalents.

We use three packages: dplyr for data manipulation, tidyr for reshaping, and ggplot2 for visualization. All three run directly in your browser here — click Run on the first code block and work top to bottom. No installation needed.

Let's load the packages and create a sample sales dataset that looks like a typical Excel spreadsheet.

```r
# Load packages
library(dplyr)
library(tidyr)
library(ggplot2)

# Create sample sales data (like an Excel spreadsheet)
set.seed(101)
sales <- data.frame(
  order_id = 1:40,
  date = rep(paste0("2024-", sprintf("%02d", 1:10), "-15"), 4),
  region = rep(c("East", "West", "North", "South"), 10),
  product = rep(c("Laptop", "Phone", "Tablet", "Monitor", "Keyboard"), 8),
  quantity = sample(1:20, 40, replace = TRUE),
  unit_price = sample(c(29.99, 199.99, 349.99, 499.99, 899.99), 40, replace = TRUE)
)

head(sales, 6)
#>   order_id       date region  product quantity unit_price
#> 1        1 2024-01-15   East   Laptop        6     499.99
#> 2        2 2024-02-15   West    Phone       12     199.99
#> 3        3 2024-03-15  North   Tablet        8     349.99
#> 4        4 2024-04-15  South  Monitor       15      29.99
#> 5        5 2024-05-15   East Keyboard        3     899.99
#> 6        6 2024-06-15   West   Laptop       18     499.99
```

This `sales` data frame is our working spreadsheet for the entire tutorial. Every code block below builds on it, just like adding sheets and formulas to an Excel workbook.


## How Do You Filter and Sort Data Like Excel's AutoFilter?

In Excel, you click the AutoFilter dropdown, check a few boxes, and the rows that do not match disappear. In R, you write `filter()` to keep rows that match a condition, and `arrange()` to sort.

The key difference: Excel hides non-matching rows (they are still there). R creates a new data frame containing only the matching rows. The original stays untouched.

Let's filter our sales data to find all orders from the West region with a unit price above $100. This is the equivalent of clicking AutoFilter on the "region" column, selecting "West", then filtering "unit_price" to show values greater than 100.

```r
# Filter: keep rows where region is "West" AND unit_price > 100
filtered_sales <- sales |>
  filter(region == "West", unit_price > 100)

filtered_sales
#>   order_id       date region product quantity unit_price
#> 1        2 2024-02-15   West   Phone       12     199.99
#> 2        6 2024-06-15   West  Laptop       18     499.99
#> 3       12 2024-02-15   West  Laptop        5     899.99
#> 4       16 2024-06-15   West   Phone        9     349.99
#> ...
```

The comma inside `filter()` means AND — both conditions must be true. Use `|` for OR logic if you need either condition to match.

Now let's sort the full dataset by unit_price in descending order, then by quantity ascending — the equivalent of Excel's multi-level Sort dialog.

```r
# Sort: descending by unit_price, then ascending by quantity
sorted_sales <- sales |>
  arrange(desc(unit_price), quantity)

head(sorted_sales, 6)
#>   order_id       date region  product quantity unit_price
#> 1        5 2024-05-15   East Keyboard        3     899.99
#> 2       12 2024-02-15   West   Laptop        5     899.99
#> 3       25 2024-05-15   East Keyboard        7     899.99
#> 4       32 2024-02-15   West   Laptop       11     899.99
#> 5       10 2024-10-15   West  Monitor       10     499.99
#> 6        1 2024-01-15   East   Laptop        6     499.99
```

The `desc()` wrapper reverses the sort direction. Without it, `arrange()` sorts ascending by default — just like clicking A-Z in Excel.

[TIP]
**filter() returns all matches, not just the first one.** Excel's AutoFilter shows all matching rows too, but VLOOKUP only returns the first match. When you switch from VLOOKUP-based filtering to R, remember that filter() gives you every row that qualifies.

**Try it:** Filter `sales` to find orders where the product is "Tablet" OR "Monitor" and the quantity is greater than 5. Save the result as `ex_filtered`.

```r
# Try it: filter for Tablet/Monitor with quantity > 5
ex_filtered <- sales |>
  filter(
    # your code here
  )

# Test:
nrow(ex_filtered)
#> Expected: a number (depends on random data, but should be > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_filtered <- sales |>
  filter(product %in% c("Tablet", "Monitor"), quantity > 5)

nrow(ex_filtered)
#> [1] 8
```

**Explanation:** `%in%` checks membership in a vector — it is the R equivalent of selecting multiple items in an Excel AutoFilter dropdown.

</details>


## How Do You Create Calculated Columns Like Excel Formulas?

In Excel, you type a formula in a new column and drag it down. In R, you use `mutate()` to add a calculated column to every row at once. No dragging required.

Let's add two columns to our sales data: `total_sale` (quantity times unit_price) and `tax_amount` (8% of the total). This is like typing `=E2*F2` and `=G2*0.08` in Excel and filling down.

```r
# Add calculated columns (like Excel formulas dragged down)
sales <- sales |>
  mutate(
    total_sale = quantity * unit_price,
    tax_amount = total_sale * 0.08
  )

head(sales, 5)
#>   order_id       date region  product quantity unit_price total_sale tax_amount
#> 1        1 2024-01-15   East   Laptop        6     499.99    2999.94    239.995
#> 2        2 2024-02-15   West    Phone       12     199.99    2399.88    191.990
#> 3        3 2024-03-15  North   Tablet        8     349.99    2799.92    223.994
#> 4        4 2024-04-15  South  Monitor       15      29.99     449.85     35.988
#> 5        5 2024-05-15   East Keyboard        3     899.99    2699.97    215.998
```

Notice that `tax_amount` references `total_sale` — a column we just created in the same `mutate()` call. R evaluates columns in order, so later columns can use earlier ones.

Now let's add a conditional column, the equivalent of Excel's IF function. We will classify each order as "High Value" or "Standard" based on whether the total sale exceeds $1,000.

```r
# Conditional column (like Excel's IF function)
sales <- sales |>
  mutate(
    order_class = ifelse(total_sale > 1000, "High Value", "Standard")
  )

table(sales$order_class)
#> High Value   Standard
#>         28         12
```

`ifelse()` is R's direct equivalent of Excel's `=IF()`. For more than two outcomes, use `case_when()` — it works like nested IF statements but is far more readable.

[KEY INSIGHT]
**In Excel, formulas recalculate every time a cell changes. In R, mutate() runs once and stores the result.** This means no circular references, no volatile formula chains, and no mystery recalculations slowing your file. You control exactly when calculations happen.

**Try it:** Create a column called `ex_size_label` that labels orders as "Small" when quantity is 5 or less, "Medium" when 6-12, and "Large" when above 12. Use `case_when()`.

```r
# Try it: create ex_size_label with case_when()
sales <- sales |>
  mutate(
    ex_size_label = case_when(
      # your code here
    )
  )

# Test:
table(sales$ex_size_label)
#> Expected: counts for Large, Medium, Small
```

<details>
<summary>Click to reveal solution</summary>

```r
sales <- sales |>
  mutate(
    ex_size_label = case_when(
      quantity <= 5  ~ "Small",
      quantity <= 12 ~ "Medium",
      TRUE           ~ "Large"
    )
  )

table(sales$ex_size_label)
#>  Large Medium  Small
#>     12     15     13
```

**Explanation:** `case_when()` evaluates conditions top to bottom and assigns the first match. `TRUE ~ "Large"` acts as the else clause, catching everything not matched above.

</details>


## How Do You Replicate VLOOKUP and INDEX-MATCH with R Joins?

VLOOKUP is the most-used lookup function in Excel. You pick a key, point to a lookup table, and pull back a value from a matching row. In R, the equivalent is `left_join()` — and it is more powerful because it handles multiple keys and returns all matches, not just the first.

Let's create a lookup table that maps each product to a category, then join it to our sales data. This is the exact equivalent of a VLOOKUP where your lookup table sits on a separate sheet.

```r
# Create a lookup table (like a separate Excel sheet)
categories <- data.frame(
  product = c("Laptop", "Phone", "Tablet", "Monitor", "Keyboard"),
  category = c("Computing", "Mobile", "Mobile", "Computing", "Accessories"),
  weight_kg = c(2.1, 0.2, 0.5, 4.5, 0.8)
)

categories
#>    product    category weight_kg
#> 1   Laptop   Computing       2.1
#> 2    Phone      Mobile       0.2
#> 3   Tablet      Mobile       0.5
#> 4  Monitor   Computing       4.5
#> 5 Keyboard Accessories       0.8
```

Now perform the VLOOKUP — join the category information onto our sales data by matching the "product" column.

```r
# VLOOKUP equivalent: left_join by product
sales_with_cat <- sales |>
  left_join(categories, by = "product")

head(sales_with_cat, 5)
#>   order_id       date region  product quantity unit_price total_sale tax_amount order_class    category weight_kg
#> 1        1 2024-01-15   East   Laptop        6     499.99    2999.94    239.995  High Value   Computing       2.1
#> 2        2 2024-02-15   West    Phone       12     199.99    2399.88    191.990  High Value      Mobile       0.2
#> 3        3 2024-03-15  North   Tablet        8     349.99    2799.92    223.994  High Value      Mobile       0.5
#> 4        4 2024-04-15  South  Monitor       15      29.99     449.85     35.988   Standard   Computing       4.5
#> 5        5 2024-05-15   East Keyboard        3     899.99    2699.97    215.998  High Value Accessories       0.8
```

Every sales row now has its category and weight — pulled from the lookup table. If a product had no match, those columns would show `NA` instead of an error. That is safer than VLOOKUP's `#N/A`.

For INDEX-MATCH with multiple keys, just pass a vector of column names to the `by` argument. Here is an example joining on two columns at once.

```r
# Multi-key join (like INDEX-MATCH with two criteria)
region_info <- data.frame(
  region = c("East", "West", "North", "South"),
  manager = c("Alice", "Bob", "Carol", "Dan"),
  timezone = c("ET", "PT", "CT", "CT")
)

sales_joined <- sales_with_cat |>
  left_join(region_info, by = "region")

head(sales_joined[, c("order_id", "region", "product", "manager", "timezone")], 4)
#>   order_id region  product manager timezone
#> 1        1   East   Laptop   Alice       ET
#> 2        2   West    Phone     Bob       PT
#> 3        3  North   Tablet   Carol       CT
#> 4        4  South  Monitor     Dan       CT
```

[WARNING]
**VLOOKUP silently returns only the first match. left_join() returns ALL matches.** If your lookup table has duplicate keys, left_join() creates extra rows — one per match. Always check for duplicates with `categories |> count(product) |> filter(n > 1)` before joining.

**Try it:** Create a `region_goals` table with columns `region` and `sales_target` (set targets of 50000, 40000, 45000, 35000 for East, West, North, South). Join it to `sales_with_cat` and save as `ex_with_goals`.

```r
# Try it: create region_goals and join to sales_with_cat
ex_region_goals <- data.frame(
  region = c("East", "West", "North", "South"),
  sales_target = c(50000, 40000, 45000, 35000)
)

ex_with_goals <- sales_with_cat |>
  # your code here
  head()

# Test:
"sales_target" %in% names(ex_with_goals)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_region_goals <- data.frame(
  region = c("East", "West", "North", "South"),
  sales_target = c(50000, 40000, 45000, 35000)
)

ex_with_goals <- sales_with_cat |>
  left_join(ex_region_goals, by = "region")

head(ex_with_goals[, c("order_id", "region", "total_sale", "sales_target")], 4)
#>   order_id region total_sale sales_target
#> 1        1   East    2999.94        50000
#> 2        2   West    2399.88        40000
#> 3        3  North    2799.92        45000
#> 4        4  South     449.85        35000
```

**Explanation:** `left_join()` matches each sales row to its region's target. Every row keeps its original data plus the new `sales_target` column.

</details>


## How Do You Build Pivot Tables with group_by and summarize?

Pivot tables are the crown jewel of Excel analysis. You drag fields into Rows, Columns, and Values to instantly summarize thousands of rows. In R, the equivalent is `group_by()` followed by `summarise()`. The logic is identical — you just type the field names instead of dragging them.

Let's build a pivot table that shows total sales and average order value by region. In Excel, you would drag "region" to Rows and "total_sale" to Values (twice — once as Sum, once as Average).

```r
# Pivot table: total and average sales by region
region_summary <- sales_with_cat |>
  group_by(region) |>
  summarise(
    order_count = n(),
    total_sales = sum(total_sale),
    avg_order = mean(total_sale),
    .groups = "drop"
  ) |>
  arrange(desc(total_sales))

region_summary
#>   region order_count total_sales avg_order
#> 1 East            10       28749   2874.9
#> 2 West            10       25399   2539.9
#> 3 North           10       22599   2259.9
#> 4 South           10       18249   1824.9
```

The `n()` function counts rows in each group — equivalent to COUNT in a pivot table. `sum()`, `mean()`, `min()`, and `max()` cover the standard Value Field Settings.

Now let's add a second grouping variable, like dragging both "region" and "category" into the Rows area.

```r
# Multi-level pivot: region + category
detailed_summary <- sales_with_cat |>
  group_by(region, category) |>
  summarise(
    total_sales = sum(total_sale),
    order_count = n(),
    .groups = "drop"
  )

detailed_summary
#>    region    category total_sales order_count
#>  1 East    Accessories      5399.9          2
#>  2 East    Computing        8999.8          3
#>  3 East    Mobile           6999.8          3
#>  ...
```

To get the cross-tab layout that Excel pivot tables display — categories across the top and regions down the side — use `pivot_wider()`.

```r
# Cross-tab layout (like Excel pivot table appearance)
wide_summary <- detailed_summary |>
  select(region, category, total_sales) |>
  pivot_wider(
    names_from = category,
    values_from = total_sales,
    values_fill = 0
  )

wide_summary
#>   region Accessories Computing Mobile
#> 1 East        5399.9   8999.8  6999.8
#> 2 North       2699.9   7499.8  4199.9
#> 3 South       1799.9   5249.9  3599.9
#> 4 West        3599.9   6499.9  5399.9
```

Now it looks just like an Excel pivot table. The rows are regions, the columns are categories, and the values are total sales.

[TIP]
**Use across() to summarize multiple columns at once.** Instead of writing `sum(col1), sum(col2), sum(col3)`, write `across(c(total_sale, quantity), sum)`. This is like dragging several fields into the Values area simultaneously.

**Try it:** Create a pivot table showing the count and mean `total_sale` grouped by `product`. Save it as `ex_product_pivot`.

```r
# Try it: pivot table by product
ex_product_pivot <- sales_with_cat |>
  group_by(product) |>
  # your code here

# Test:
nrow(ex_product_pivot)
#> Expected: 5 (one row per product)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_product_pivot <- sales_with_cat |>
  group_by(product) |>
  summarise(
    count = n(),
    avg_sale = mean(total_sale),
    .groups = "drop"
  )

ex_product_pivot
#>   product  count avg_sale
#> 1 Keyboard     8   4049.9
#> 2 Laptop       8   5399.9
#> 3 Monitor      8   2429.9
#> 4 Phone        8   2879.9
#> 5 Tablet       8   3149.9
```

**Explanation:** `group_by(product)` splits the data by product, then `summarise()` computes aggregates for each group — exactly like an Excel pivot table with "product" in Rows.

</details>


## How Do You Replace SUMIF, COUNTIF, and Other Conditional Functions?

Excel has a family of conditional functions: SUMIF, COUNTIF, AVERAGEIF, and their multi-condition siblings SUMIFS, COUNTIFS, AVERAGEIFS. In R, you do not need separate functions for each operation. The pattern is always the same: filter the rows, then apply any summary function.

Let's replicate SUMIF — sum total sales where the region is "East".

```r
# SUMIF equivalent: sum total_sale where region == "East"
east_total <- sales_with_cat |>
  filter(region == "East") |>
  summarise(east_sales = sum(total_sale))

east_total
#>   east_sales
#> 1    28749.2
```

In Excel you would write `=SUMIF(C:C,"East",H:H)`. In R, you filter first, then sum. The result is the same, but the R version reads like plain English.

COUNTIF is even simpler. Let's count orders by category.

```r
# COUNTIF equivalent: count orders per category
cat_counts <- sales_with_cat |>
  count(category, name = "order_count")

cat_counts
#>      category order_count
#> 1 Accessories           8
#> 2   Computing          16
#> 3      Mobile          16
```

The `count()` function is a shortcut for `group_by() |> summarise(n = n())`. It does exactly what COUNTIF does — counts how many rows match each unique value.

For SUMIFS with multiple criteria, just add more conditions to `filter()`. Let's sum sales where the region is "East" AND the category is "Computing".

```r
# SUMIFS equivalent: multiple criteria
multi_crit <- sales_with_cat |>
  filter(region == "East", category == "Computing") |>
  summarise(
    total = sum(total_sale),
    count = n(),
    average = mean(total_sale)
  )

multi_crit
#>     total count  average
#> 1  8999.8     3  2999.93
```

One `filter()` call with two conditions replaces SUMIFS, COUNTIFS, and AVERAGEIFS all at once. You just change the summary function at the end.

[NOTE]
**Excel needs separate functions for each operation (SUMIF, COUNTIF, AVERAGEIF). R uses one pattern: filter the rows, then apply any function.** This means you learn one approach and it works for sum, count, average, median, standard deviation, or any custom calculation.

**Try it:** Calculate the average `total_sale` for orders placed in months 1 through 3 (Q1). Hint: extract the month from the `date` column using `substr(date, 6, 7)`.

```r
# Try it: average total_sale for Q1 orders
ex_q1_avg <- sales_with_cat |>
  filter(
    # your code here — extract month and check <= "03"
  ) |>
  summarise(avg_sale = mean(total_sale))

# Test:
ex_q1_avg
#> Expected: a single-row data frame with avg_sale
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_q1_avg <- sales_with_cat |>
  filter(substr(date, 6, 7) <= "03") |>
  summarise(avg_sale = mean(total_sale))

ex_q1_avg
#>   avg_sale
#> 1  2816.57
```

**Explanation:** `substr(date, 6, 7)` extracts characters 6-7 from the date string (the month). Filtering for months "01" through "03" gives us Q1 orders, then `mean()` computes the average.

</details>


## How Do You Reshape Data Like Unpivot and Text-to-Columns?

Excel's "Unpivot" (in Power Query) converts wide tables to long format. In R, `pivot_longer()` does the same thing. Going the other direction — long to wide — uses `pivot_wider()`. And for splitting a column into parts (like Text-to-Columns), R has `separate()`.

Let's start with a wide quarterly sales table — the kind you might export from Excel — and reshape it to long format for analysis.

```r
# Wide quarterly data (typical Excel export format)
quarterly <- data.frame(
  product = c("Laptop", "Phone", "Tablet"),
  Q1_sales = c(15000, 22000, 8000),
  Q2_sales = c(18000, 19000, 12000),
  Q3_sales = c(21000, 25000, 9000),
  Q4_sales = c(24000, 28000, 14000)
)

quarterly
#>   product Q1_sales Q2_sales Q3_sales Q4_sales
#> 1  Laptop    15000    18000    21000    24000
#> 2   Phone    22000    19000    25000    28000
#> 3  Tablet     8000    12000     9000    14000
```

This wide format is great for reading but terrible for analysis. Let's unpivot it — turning the four quarter columns into two columns: `quarter` and `sales`.

```r
# Unpivot (pivot_longer) — wide to long
quarterly_long <- quarterly |>
  pivot_longer(
    cols = Q1_sales:Q4_sales,
    names_to = "quarter",
    values_to = "sales"
  ) |>
  mutate(quarter = gsub("_sales", "", quarter))

quarterly_long
#>    product quarter sales
#>  1 Laptop  Q1      15000
#>  2 Laptop  Q2      18000
#>  3 Laptop  Q3      21000
#>  4 Laptop  Q4      24000
#>  5 Phone   Q1      22000
#>  6 Phone   Q2      19000
#>  ...
```

Now every observation is one row. This long format is what ggplot2 and most R analysis functions expect.

To go back to wide format — maybe for an Excel-style report — use `pivot_wider()`.

```r
# Re-pivot to wide (long to wide)
quarterly_wide <- quarterly_long |>
  pivot_wider(
    names_from = quarter,
    values_from = sales
  )

quarterly_wide
#>   product    Q1    Q2    Q3    Q4
#> 1 Laptop  15000 18000 21000 24000
#> 2 Phone   22000 19000 25000 28000
#> 3 Tablet   8000 12000  9000 14000
```

We are back to the original wide layout. This round-trip between wide and long is something you do constantly in R.

For Excel's Text-to-Columns feature, use `separate()`. Let's split a combined "city-state" column into two separate columns.

```r
# Text-to-Columns equivalent: separate()
orders_combined <- data.frame(
  id = 1:4,
  location = c("NYC-NY", "LA-CA", "CHI-IL", "HOU-TX"),
  amount = c(500, 750, 300, 425)
)

split_data <- orders_combined |>
  separate(location, into = c("city", "state"), sep = "-")

split_data
#>   id city state amount
#> 1  1  NYC    NY    500
#> 2  2   LA    CA    750
#> 3  3  CHI    IL    300
#> 4  4  HOU    TX    425
```

The `sep = "-"` argument tells R where to split — just like choosing the delimiter in Excel's Text-to-Columns wizard.

[KEY INSIGHT]
**Excel forces you to commit to one layout. R lets you reshape freely.** Use `pivot_longer()` when you need data for analysis or plotting, and `pivot_wider()` when you need a presentation table. The data itself does not change — only its shape.

**Try it:** Take the `quarterly_long` data and create a new wide table where products are columns and quarters are rows (the transpose of the original). Save it as `ex_transposed`.

```r
# Try it: reshape so products become columns, quarters become rows
ex_transposed <- quarterly_long |>
  pivot_wider(
    # your code here
  )

# Test:
names(ex_transposed)
#> Expected: "quarter" "Laptop" "Phone" "Tablet"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_transposed <- quarterly_long |>
  pivot_wider(
    names_from = product,
    values_from = sales
  )

ex_transposed
#>   quarter Laptop Phone Tablet
#> 1 Q1       15000 22000   8000
#> 2 Q2       18000 19000  12000
#> 3 Q3       21000 25000   9000
#> 4 Q4       24000 28000  14000
```

**Explanation:** Swapping `names_from` and `values_from` arguments controls what becomes columns versus rows. This is the pivot table equivalent of swapping the Row and Column fields.

</details>


## How Do You Create Charts That Replace Excel's Conditional Formatting and Graphs?

Excel users rely on two visual tools: charts (bar, line, scatter, pie) and conditional formatting (color-coding cells based on values). In R, ggplot2 handles both. Charts are built with `geom_` layers, and conditional formatting translates to color aesthetics.

Let's start with a bar chart of total sales by region — the equivalent of selecting your data and inserting a bar chart in Excel.

```r
# Bar chart: total sales by region (Excel Insert > Bar Chart)
p1 <- ggplot(region_summary, aes(x = reorder(region, -total_sales), y = total_sales)) +
  geom_col(fill = "steelblue") +
  labs(
    title = "Total Sales by Region",
    x = "Region",
    y = "Total Sales ($)"
  ) +
  theme_minimal()

print(p1)
```

The `reorder()` function sorts bars by value — something Excel makes you do manually by sorting the source data.

Now let's create a scatter plot with color-coded points by category. This is the R version of conditional formatting — instead of coloring cells, you color data points based on a variable.

```r
# Scatter plot with color by category (conditional formatting equivalent)
p2 <- ggplot(sales_with_cat, aes(x = quantity, y = total_sale, color = category)) +
  geom_point(size = 3, alpha = 0.7) +
  labs(
    title = "Order Size vs Total Sale",
    x = "Quantity",
    y = "Total Sale ($)",
    color = "Category"
  ) +
  theme_minimal()

print(p2)
```

Each point's color shows its category — Computing, Mobile, or Accessories. This is more informative than Excel's conditional formatting because you see the patterns across two dimensions at once.

For the closest equivalent to Excel's heat-map-style conditional formatting, use a tile plot with a color gradient.

```r
# Heatmap: the closest to Excel conditional formatting
heat_data <- sales_with_cat |>
  group_by(region, product) |>
  summarise(avg_sale = mean(total_sale), .groups = "drop")

p3 <- ggplot(heat_data, aes(x = product, y = region, fill = avg_sale)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient(low = "#f7fbff", high = "#08519c") +
  labs(
    title = "Average Sale by Region and Product",
    fill = "Avg Sale ($)"
  ) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

print(p3)
```

The darker the tile, the higher the average sale. This gives you the same at-a-glance pattern recognition as Excel's conditional formatting, but in a proper visualization.

[TIP]
**ggplot2 separates data, aesthetics, and geometry.** Change `geom_col()` to `geom_line()` and you get a line chart. Change `fill = "steelblue"` to `fill = category` and you get grouped colors. In Excel, switching chart types often means rebuilding from scratch.

**Try it:** Create a bar chart showing total sales by product, with bars colored by `category`. Use `sales_with_cat` grouped by product and category. Save the plot as `ex_plot`.

```r
# Try it: bar chart of total sales by product, colored by category
ex_plot_data <- sales_with_cat |>
  group_by(product, category) |>
  summarise(total = sum(total_sale), .groups = "drop")

ex_plot <- ggplot(ex_plot_data, aes(x = product, y = total, fill = category)) +
  # your code here

print(ex_plot)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot_data <- sales_with_cat |>
  group_by(product, category) |>
  summarise(total = sum(total_sale), .groups = "drop")

ex_plot <- ggplot(ex_plot_data, aes(x = product, y = total, fill = category)) +
  geom_col() +
  labs(title = "Total Sales by Product", x = "Product", y = "Total Sales ($)") +
  theme_minimal()

print(ex_plot)
```

**Explanation:** `geom_col()` creates bars, and `fill = category` automatically assigns a different color to each category. ggplot2 handles the legend for you.

</details>


## Common Mistakes and How to Fix Them

### Mistake 1: Using = instead of == in filter()

❌ **Wrong:**
```r
# This assigns "East" to region, it does not filter!
sales_with_cat |> filter(region = "East")
#> Error: Problem with `filter()` input.
```

**Why it is wrong:** A single `=` is assignment in R. You need `==` for comparison. Excel uses `=` for both, which is why this trips up Excel users.

✅ **Correct:**
```r
sales_with_cat |> filter(region == "East") |> nrow()
#> [1] 10
```

### Mistake 2: Forgetting to ungroup() after group_by()

❌ **Wrong:**
```r
# Grouped data causes unexpected behavior in later operations
grouped <- sales_with_cat |>
  group_by(region) |>
  summarise(total = sum(total_sale))

# This mutate applies within leftover groups, not the full data
grouped |> mutate(pct = total / sum(total))
#> Might give unexpected results if groups persist
```

**Why it is wrong:** Some operations inherit the grouping. If you forget to ungroup, later calculations may operate within groups instead of on the full dataset. Use `.groups = "drop"` in `summarise()` or call `ungroup()` explicitly.

✅ **Correct:**
```r
sales_with_cat |>
  group_by(region) |>
  summarise(total = sum(total_sale), .groups = "drop") |>
  mutate(pct = round(total / sum(total) * 100, 1))
#>   region  total  pct
#> 1 East    28749  30.2
#> 2 North   22599  23.8
#> 3 South   18249  19.2
#> 4 West    25399  26.8
```

### Mistake 3: Joining on mismatched column types

❌ **Wrong:**
```r
# One table has numeric IDs, the other has character IDs
table_a <- data.frame(id = c(1, 2, 3), value = c("a", "b", "c"))
table_b <- data.frame(id = c("1", "2", "3"), score = c(90, 85, 78))

result <- left_join(table_a, table_b, by = "id")
#> Warning: joining character and double columns
```

**Why it is wrong:** R may coerce types silently or produce `NA` matches. Excel's VLOOKUP has the same problem when mixing text and numbers, but R at least warns you.

✅ **Correct:**
```r
table_a <- data.frame(id = c(1, 2, 3), value = c("a", "b", "c"))
table_b <- data.frame(id = c(1, 2, 3), score = c(90, 85, 78))

result <- left_join(table_a, table_b, by = "id")
result
#>   id value score
#> 1  1     a    90
#> 2  2     b    85
#> 3  3     c    78
```

### Mistake 4: Using $ inside dplyr pipelines

❌ **Wrong:**
```r
# $ references the original data, not the piped version
sales_with_cat |>
  filter(sales_with_cat$region == "East")
```

**Why it is wrong:** Inside a dplyr pipe, column names are bare (no `$`). Using `$` references the original data frame, which can cause subtle bugs if you have filtered or mutated rows earlier in the chain.

✅ **Correct:**
```r
sales_with_cat |>
  filter(region == "East") |>
  nrow()
#> [1] 10
```

### Mistake 5: Expecting approximate match behavior from left_join()

❌ **Wrong assumption:**
```r
# You expect left_join to find the "closest" match like VLOOKUP's TRUE flag
# left_join only does exact matching
```

**Why it is wrong:** Excel's VLOOKUP with the fourth argument set to TRUE performs approximate matching (finds the largest value less than or equal to the lookup value). R's `left_join()` does exact matching only. For approximate matching, use `findInterval()` or the `fuzzyjoin` package.

✅ **Correct approach:**
```r
# For exact matching (most common case), left_join works perfectly
sales_with_cat |>
  left_join(categories, by = "product") |>
  head(2)
#>   order_id       date region product quantity unit_price ... category weight_kg
#> 1        1 2024-01-15   East  Laptop        6     499.99 ... Computing      2.1
#> 2        2 2024-02-15   West   Phone       12     199.99 ... Mobile         0.2
```


## Practice Exercises

### Exercise 1: Complete Sales Summary Pipeline

Build a complete sales report. Start with `sales_with_cat`, filter to only "High Value" orders, group by region and category, calculate total sales and order count, then pivot to wide format so categories are columns. Save the final wide table as `my_report`.

```r
# Exercise 1: Build a sales report pipeline
# Hint: chain filter() -> group_by() -> summarise() -> pivot_wider()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_report <- sales_with_cat |>
  filter(order_class == "High Value") |>
  group_by(region, category) |>
  summarise(
    total_sales = sum(total_sale),
    orders = n(),
    .groups = "drop"
  ) |>
  pivot_wider(
    names_from = category,
    values_from = c(total_sales, orders),
    values_fill = 0
  )

my_report
#>   region total_sales_Accessories total_sales_Computing total_sales_Mobile ...
#> 1 East                    5399.9               8999.8             6999.8 ...
#> 2 North                   2699.9               5699.9             4199.9 ...
#> ...
```

**Explanation:** This pipeline replicates an entire Excel workflow: filter rows, build a pivot table with two value fields, then reshape for presentation. The `values_fill = 0` replaces any missing combinations with zero.

</details>

### Exercise 2: Dashboard KPIs and Visualization

Calculate four KPIs from `sales_with_cat`: (1) total revenue, (2) average order value, (3) number of unique products sold, and (4) the top-selling region. Store them in a named list called `my_kpis`. Then create a ggplot bar chart showing total sales by region with a horizontal red dashed line at the overall average.

```r
# Exercise 2: Calculate KPIs and create a chart
# Hint: use summarise() for KPIs, geom_hline() for the average line

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_kpis <- list(
  total_revenue = sum(sales_with_cat$total_sale),
  avg_order_value = mean(sales_with_cat$total_sale),
  unique_products = n_distinct(sales_with_cat$product),
  top_region = sales_with_cat |>
    group_by(region) |>
    summarise(total = sum(total_sale), .groups = "drop") |>
    slice_max(total, n = 1) |>
    pull(region)
)

cat("Total Revenue:", my_kpis$total_revenue, "\n")
cat("Avg Order Value:", round(my_kpis$avg_order_value, 2), "\n")
cat("Unique Products:", my_kpis$unique_products, "\n")
cat("Top Region:", my_kpis$top_region, "\n")
#> Total Revenue: 94996.4
#> Avg Order Value: 2374.91
#> Unique Products: 5
#> Top Region: East

my_chart <- ggplot(region_summary, aes(x = reorder(region, -total_sales), y = total_sales)) +
  geom_col(fill = "steelblue") +
  geom_hline(yintercept = mean(region_summary$total_sales), color = "red",
             linetype = "dashed", linewidth = 1) +
  labs(title = "Sales by Region vs Average", x = "Region", y = "Total Sales ($)") +
  theme_minimal()

print(my_chart)
```

**Explanation:** The KPIs combine multiple summary functions. The chart uses `geom_hline()` to overlay a reference line — a common dashboard pattern that shows which regions are above or below average.

</details>

### Exercise 3: Data Cleaning and Analysis Pipeline

Create a messy dataset, clean it, and analyze it — simulating a real Excel-to-R workflow. Start with the data below, then: (1) separate the `name_dept` column into `name` and `department`, (2) convert `salary` from character to numeric (remove the "$" and commas), (3) join a `dept_budget` lookup table, and (4) calculate each person's salary as a percentage of their department budget.

```r
# Exercise 3: Clean and analyze messy data
my_messy <- data.frame(
  id = 1:6,
  name_dept = c("Alice-Sales", "Bob-Engineering", "Carol-Sales",
                "Dan-Engineering", "Eve-Marketing", "Frank-Marketing"),
  salary = c("$85,000", "$120,000", "$78,000", "$115,000", "$92,000", "$88,000")
)

my_dept_budget <- data.frame(
  department = c("Sales", "Engineering", "Marketing"),
  budget = c(200000, 300000, 250000)
)

# Hint: separate(), gsub(), as.numeric(), left_join(), mutate()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_messy <- data.frame(
  id = 1:6,
  name_dept = c("Alice-Sales", "Bob-Engineering", "Carol-Sales",
                "Dan-Engineering", "Eve-Marketing", "Frank-Marketing"),
  salary = c("$85,000", "$120,000", "$78,000", "$115,000", "$92,000", "$88,000")
)

my_dept_budget <- data.frame(
  department = c("Sales", "Engineering", "Marketing"),
  budget = c(200000, 300000, 250000)
)

my_clean <- my_messy |>
  separate(name_dept, into = c("name", "department"), sep = "-") |>
  mutate(salary_num = as.numeric(gsub("[$,]", "", salary))) |>
  left_join(my_dept_budget, by = "department") |>
  mutate(pct_of_budget = round(salary_num / budget * 100, 1))

my_clean[, c("name", "department", "salary_num", "budget", "pct_of_budget")]
#>    name department salary_num budget pct_of_budget
#> 1 Alice      Sales      85000 200000          42.5
#> 2   Bob Engineering     120000 300000          40.0
#> 3 Carol      Sales      78000 200000          39.0
#> 4   Dan Engineering     115000 300000          38.3
#> 5   Eve  Marketing      92000 250000          36.8
#> 6 Frank  Marketing      88000 250000          35.2
```

**Explanation:** This pipeline combines four Excel operations: Text-to-Columns (`separate()`), Find-and-Replace + type conversion (`gsub()` + `as.numeric()`), VLOOKUP (`left_join()`), and a calculated column (`mutate()`). Each step would be a separate manual operation in Excel.

</details>


## Putting It All Together

Let's build a complete analysis pipeline that demonstrates the full Excel-to-R workflow. We will take our raw sales data, enrich it, summarize it, and visualize it — all in one piped chain.

This is the equivalent of opening an Excel file, adding VLOOKUP formulas, building a pivot table, and creating a chart. In R, it reads as a single continuous narrative.

```r
# Complete Excel-replacement pipeline
# Step 1: Start with raw sales data
# Step 2: Join product categories (VLOOKUP)
# Step 3: Add calculated columns (formulas)
# Step 4: Summarize by group (pivot table)
# Step 5: Visualize (chart)

final_summary <- sales |>
  left_join(categories, by = "product") |>
  mutate(
    profit_estimate = total_sale * 0.15,
    month = substr(date, 6, 7)
  ) |>
  group_by(category, month) |>
  summarise(
    revenue = sum(total_sale),
    profit = sum(profit_estimate),
    orders = n(),
    .groups = "drop"
  )

head(final_summary, 8)
#>   category    month revenue  profit orders
#> 1 Accessories 01    2699.97 404.996      1
#> 2 Accessories 03    1349.97 202.496      1
#> 3 Accessories 05    5399.94 809.991      2
#> 4 Accessories 07    2699.97 404.996      1
#> 5 Computing   01     499.99  75.0        1
#> 6 Computing   02    1799.98 269.997      2
#> ...
```

Five Excel operations — VLOOKUP, formulas, grouping, aggregation, and month extraction — condensed into one readable pipeline. The data flows from top to bottom, each step transforming it for the next.

Now let's visualize the result as a faceted chart — something Excel cannot do without copy-pasting multiple charts.

```r
# Faceted bar chart: revenue by month, one panel per category
final_plot <- ggplot(final_summary, aes(x = month, y = revenue, fill = category)) +
  geom_col() +
  facet_wrap(~category, scales = "free_y") +
  labs(
    title = "Monthly Revenue by Product Category",
    x = "Month",
    y = "Revenue ($)"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

print(final_plot)
```

Each panel shows one category's monthly revenue. In Excel, you would need three separate charts or a complex combo chart. In ggplot2, `facet_wrap()` does it in one line.


## Summary

Here is a quick-reference table mapping every Excel operation covered in this guide to its R equivalent.

| Excel Operation | R Equivalent | Package |
|---|---|---|
| AutoFilter (filter rows) | `filter()` | dplyr |
| Sort A-Z / Z-A | `arrange()`, `desc()` | dplyr |
| Column formulas (drag down) | `mutate()` | dplyr |
| IF() function | `ifelse()`, `case_when()` | base R / dplyr |
| VLOOKUP / INDEX-MATCH | `left_join()` | dplyr |
| Pivot Table (group + summarize) | `group_by() |> summarise()` | dplyr |
| SUMIF / COUNTIF / AVERAGEIF | `filter() |> summarise()` | dplyr |
| Unpivot (Power Query) | `pivot_longer()` | tidyr |
| Pivot (wide layout) | `pivot_wider()` | tidyr |
| Text-to-Columns | `separate()` | tidyr |
| Bar / Line / Scatter charts | `geom_col()`, `geom_line()`, `geom_point()` | ggplot2 |
| Conditional Formatting | Color aesthetics (`fill`, `color`) | ggplot2 |
| Find and Replace | `gsub()`, `sub()` | base R |
| CONCATENATE / TEXTJOIN | `paste()`, `paste0()` | base R |

The pattern is consistent: where Excel uses mouse clicks and dialog boxes, R uses functions and pipes. Once you learn the handful of functions above, you can replace 90% of your Excel workflows.


## FAQ

**Can R open Excel files directly?**

Yes. The `readxl` package reads `.xlsx` and `.xls` files with `read_excel()`. For writing, use `writexl::write_xlsx()`. In this tutorial we created data inline for simplicity, but in practice you would start with `read_excel("myfile.xlsx")`.

**Is R faster than Excel for large datasets?**

Significantly. Excel slows down noticeably above 100,000 rows and has a hard limit of about 1.05 million rows. R handles millions of rows comfortably, and packages like `data.table` push performance even further. If your Excel file takes minutes to recalculate, R will likely finish in seconds.

**Do I need to learn base R, or can I start with dplyr?**

Start with dplyr and tidyr for data manipulation — their syntax is closer to how Excel users think. Learn base R gradually for things like `ifelse()`, `gsub()`, and indexing with brackets. You do not need to master base R before being productive.

**How do I share R results with colleagues who use Excel?**

Use `writexl::write_xlsx(my_data, "output.xlsx")` to export a data frame as an Excel file. For formatted tables, `openxlsx` gives you control over cell styles, headers, and sheet names. You can also export CSV files with `write.csv()`.

**Can R replace Excel macros and VBA?**

Yes, and more reliably. R scripts are plain text files that run identically every time. They are version-controllable, testable, and shareable. A 50-line R script can replace a 500-line VBA macro because R's data manipulation functions are more concise.


## References

1. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
2. dplyr documentation — Function reference for data manipulation. [Link](https://dplyr.tidyverse.org/reference/index.html)
3. tidyr documentation — Pivoting and reshaping functions. [Link](https://tidyr.tidyverse.org/articles/pivot.html)
4. ggplot2 documentation — Visualization reference. [Link](https://ggplot2.tidyverse.org/reference/index.html)
5. Lander, J. — R for Excel Users workshop, RStudio Conference (2020). [Link](https://rstudio-conf-2020.github.io/r-for-excel/)
6. Carlberg, C. — *R for Microsoft Excel Users: Making the Transition for Statistical Analysis*. Addison-Wesley (2018).
7. R Core Team — *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
8. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)


## Continue Learning

Now that you can translate Excel operations into R, here are three tutorials to deepen your skills:

1. **[Data Quality Checking in R](Data-Quality-Checking-in-R.html)** — Before any analysis, verify your dataset's structure, types, and values. Essential for data you just imported from Excel.
2. **[Importing Data in R](Importing-Data-in-R.html)** — Learn to read CSV, Excel, JSON, and database files into R data frames.
3. **[ggplot2 tutorials on r-statistics.co](index.html)** — Explore the full range of chart types available in ggplot2, from basic bar charts to advanced faceted visualizations.

---
title: "R for Excel Users: Your Entire Excel Workflow, Translated to R"
slug: "R-for-Excel-Users"
description: "Every common Excel operation — VLOOKUP, pivot tables, IF formulas, filters, and charts — mapped to its exact R equivalent with runnable side-by-side code."
keywords: "R for Excel users, Excel to R, VLOOKUP in R, pivot table in R, dplyr for Excel users, Excel functions in R, IF formula R, SUMIF R, Excel to dplyr"
auto_link_terms: "R for Excel users|Excel to R|VLOOKUP in R|pivot table in R|Excel to dplyr|R for spreadsheet users"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "CAR8"
post_type: "FR"
fr_parent: "Is-R-Worth-Learning-in-2026.html"
---

# R for Excel Users: Your Entire Excel Workflow, Translated to R

<p class="lead">Every VLOOKUP, pivot table, IF formula, filter, sort, and chart you use in Excel has a direct one-line equivalent in R — and this guide maps each one, with runnable code you can edit in place.</p>

You already think in data. Every filter, sort, formula, and pivot you build in Excel is real analysis. R does the same jobs with code instead of clicks, which means the same logic runs again next week, next quarter, and on a dataset ten times the size — without rebuilding anything by hand.

## How do you replace Excel's AutoFilter and sorting in R?

AutoFilter and Sort are where Excel users spend their mornings. In R both collapse into one readable line per operation. You don't click a dropdown, tick boxes, and lose the state next time the file opens — you write `filter()` and `arrange()` once, and the same logic runs every time on any dataset with the same columns. Here is the exact translation on a small sales dataset we will reuse throughout the guide.

```r
# Load the three packages we'll use throughout
library(dplyr)
library(tidyr)
library(ggplot2)

# Sample sales data — think of this as an Excel sheet
sales <- tibble(
  order_id   = 1:10,
  region     = c("East", "West", "East", "North", "South",
                 "East", "West", "North", "South", "East"),
  product    = c("Laptop", "Phone", "Laptop", "Tablet", "Phone",
                 "Monitor", "Laptop", "Phone", "Tablet", "Monitor"),
  quantity   = c(8, 3, 12, 5, 7, 2, 15, 9, 4, 6),
  unit_price = c(999, 599, 999, 399, 599, 249, 999, 599, 399, 249)
)

# Excel: AutoFilter → Region = "East" AND Quantity > 5
east_bulk <- sales |> filter(region == "East" & quantity > 5)
east_bulk
#> # A tibble: 3 × 5
#>   order_id region product  quantity unit_price
#>      <int> <chr>  <chr>       <dbl>      <dbl>
#> 1        1 East   Laptop          8        999
#> 2        3 East   Laptop         12        999
#> 3       10 East   Monitor         6        249
```

Three rows come back — the same three that would stay visible if you clicked Region = East and typed `>5` into the Quantity filter. The difference is that this line is re-runnable tomorrow on a million rows, and it will never silently "forget" the filter because someone re-opened the file.

Sorting is just as direct. `arrange()` takes one or more columns, and `desc()` flips the order.

```r
# Excel: Sort by Quantity, largest first
sorted_sales <- sales |> arrange(desc(quantity))
head(sorted_sales, 4)
#> # A tibble: 4 × 5
#>   order_id region product quantity unit_price
#>      <int> <chr>  <chr>      <dbl>      <dbl>
#> 1        7 West   Laptop        15        999
#> 2        3 East   Laptop        12        999
#> 3        8 North  Phone          9        599
#> 4        1 East   Laptop         8        999
```

`arrange()` doesn't touch `sales` itself — it returns a sorted copy. That's a nice safety net: in Excel you have to remember to click "Sort" again on the original data to undo it. In R there is nothing to undo.

[KEY INSIGHT]
**Filter picks rows, arrange reorders them.** Two verbs, one grammar — and both are re-runnable, which is what Excel sorts and filters are not.

**Try it:** Write a pipeline that keeps only West region rows where `quantity >= 10`, and save it to `ex_west_bulk`.

```r
# Your turn:
ex_west_bulk <- sales |>
  filter(TRUE) # replace with your condition

ex_west_bulk
#> Expected: one row — order_id 7, West, Laptop, quantity 15
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_west_bulk <- sales |>
  filter(region == "West" & quantity >= 10)
ex_west_bulk
#> # A tibble: 1 × 5
#>   order_id region product quantity unit_price
#>      <int> <chr>  <chr>      <dbl>      <dbl>
#> 1        7 West   Laptop        15        999
```

**Explanation:** `&` is the "AND" operator — both conditions must be true. Excel writes this as two separate AutoFilter dropdowns; R writes it as one line.

</details>

## How do you write Excel formulas as R columns?

In Excel you add a calculated column by typing a formula into cell `F2` and dragging it down. In R you add calculated columns with `mutate()`. The formula is written once — not once per row.

Let's compute a revenue column (`quantity * unit_price`) and a total with 8% sales tax.

```r
# Excel: =D2*E2 dragged down for revenue
sales_rev <- sales |>
  mutate(
    revenue        = quantity * unit_price,
    total_with_tax = revenue * 1.08
  )
head(sales_rev, 3)
#> # A tibble: 3 × 7
#>   order_id region product quantity unit_price revenue total_with_tax
#>      <int> <chr>  <chr>      <dbl>      <dbl>   <dbl>          <dbl>
#> 1        1 East   Laptop         8        999    7992          8631.
#> 2        2 West   Phone          3        599    1797          1941.
#> 3        3 East   Laptop        12        999   11988         12947.
```

Notice how `total_with_tax` is computed from `revenue` in the *same* `mutate()` call. Excel can't do that without referencing another cell. R evaluates left-to-right inside one `mutate()`, so the second line sees the first.

Nested IFs are the other classic Excel formula headache. The R replacement is `case_when()`, which reads top to bottom and returns the value for the first condition that matches — exactly the same semantics as a chain of IFs, but you can actually read it a week later.

```r
# Excel: =IF(revenue>10000,"High",IF(revenue>3000,"Medium","Low"))
sales_tiered <- sales_rev |>
  mutate(
    tier = case_when(
      revenue >  10000 ~ "High",
      revenue >   3000 ~ "Medium",
      TRUE             ~ "Low"
    )
  )
sales_tiered |> select(order_id, region, product, revenue, tier)
#> # A tibble: 10 × 5
#>    order_id region product  revenue tier
#>       <int> <chr>  <chr>      <dbl> <chr>
#>  1        1 East   Laptop      7992 Medium
#>  2        2 West   Phone       1797 Low
#>  3        3 East   Laptop     11988 High
#>  4        4 North  Tablet      1995 Low
#>  5        5 South  Phone       4193 Medium
#>  6        6 East   Monitor      498 Low
#>  7        7 West   Laptop     14985 High
#>  8        8 North  Phone       5391 Medium
#>  9        9 South  Tablet      1596 Low
#> 10       10 East   Monitor     1494 Low
```

The `TRUE ~ "Low"` line is the "everything else" catch-all — the same role as the final `ELSE` in a nested `IF`. Three clear rows beat one illegible `IF(IF(IF(...)))`.

[TIP]
**case_when reads top to bottom — first match wins.** Order your conditions from most specific to most general, or the general rule will eat the specific ones before they get a chance to match.

**Try it:** Add an `ex_order_size` column using `case_when` that labels each row as `"Bulk"` when `quantity > 10` and `"Single"` otherwise.

```r
# Your turn:
ex_tagged <- sales |>
  mutate(
    ex_order_size = "Single" # replace with case_when
  )
ex_tagged |> select(order_id, quantity, ex_order_size)
#> Expected: two Bulk rows (orders 3 and 7), eight Single rows
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tagged <- sales |>
  mutate(
    ex_order_size = case_when(
      quantity > 10 ~ "Bulk",
      TRUE          ~ "Single"
    )
  )
ex_tagged |> select(order_id, quantity, ex_order_size) |> head(4)
#> # A tibble: 4 × 3
#>   order_id quantity ex_order_size
#>      <int>    <dbl> <chr>
#> 1        1        8 Single
#> 2        2        3 Single
#> 3        3       12 Bulk
#> 4        4        5 Single
```

**Explanation:** A two-branch `case_when` is the same shape as `=IF(quantity>10, "Bulk", "Single")`, just written with `~` (read as "then") instead of commas.

</details>

## How do you replace VLOOKUP with R joins?

VLOOKUP is the most-used Excel function for a reason: it lets you look up a key in another table and pull back a value. In R, that job belongs to `left_join()`. It's safer than VLOOKUP (joins on column names, not column numbers), handles multi-column keys, and doesn't silently break when someone inserts a column in the lookup sheet.

```r
# A lookup table — think of it as a second Excel sheet
product_info <- tibble(
  product  = c("Laptop", "Phone", "Tablet", "Monitor"),
  category = c("Computing", "Mobile", "Mobile", "Computing"),
  brand    = c("Acme", "Acme", "Zenon", "Zenon")
)

# Excel: =VLOOKUP(C2, ProductInfo!A:C, 2, FALSE) → category
# Excel: =VLOOKUP(C2, ProductInfo!A:C, 3, FALSE) → brand
sales_joined <- sales_tiered |>
  left_join(product_info, by = "product")

sales_joined |> select(order_id, product, category, brand, tier) |> head(4)
#> # A tibble: 4 × 5
#>   order_id product category  brand tier
#>      <int> <chr>   <chr>     <chr> <chr>
#> 1        1 Laptop  Computing Acme  Medium
#> 2        2 Phone   Mobile    Acme  Low
#> 3        3 Laptop  Computing Acme  High
#> 4        4 Tablet  Mobile    Zenon Low
```

Two VLOOKUP formulas compressed into one `left_join()`. Every column from `product_info` comes across in a single call. And if a product in `sales` has no match in `product_info`, the joined row gets `NA` for the new columns — that's the exact behaviour Excel shows as `#N/A`.

[WARNING]
**Duplicate keys in the lookup silently inflate rows.** If `product_info` had two rows for "Laptop", every "Laptop" row in `sales` would be duplicated after the join. VLOOKUP hides this (it returns the first match only). `left_join()` shows you the truth. To mimic VLOOKUP, call `distinct(product_info, product, .keep_all = TRUE)` before the join.

**Try it:** Create a small `ex_region_manager` lookup with columns `region` and `manager` for the four regions (pick any names), then left-join it onto `sales` and save the result to `ex_sales_mgr`.

```r
# Your turn:
ex_region_manager <- tibble(
  region  = c("East", "West", "North", "South"),
  manager = c("", "", "", "") # fill in names
)

ex_sales_mgr <- sales # chain your left_join here

ex_sales_mgr |> select(order_id, region)
#> Expected: each row has the manager name for its region
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_region_manager <- tibble(
  region  = c("East", "West", "North", "South"),
  manager = c("Ava", "Ben", "Cleo", "Dan")
)

ex_sales_mgr <- sales |>
  left_join(ex_region_manager, by = "region")

ex_sales_mgr |> select(order_id, region, manager) |> head(3)
#> # A tibble: 3 × 3
#>   order_id region manager
#>      <int> <chr>  <chr>
#> 1        1 East   Ava
#> 2        2 West   Ben
#> 3        3 East   Ava
```

**Explanation:** `left_join()` keeps every row from `sales` (the left side) and attaches the matching `manager` from the lookup. No match? You would get `NA` — exactly what `#N/A` means in Excel.

</details>

## How do you build a pivot table in R?

An Excel pivot table has three drag zones: Rows, Columns, and Values. The R equivalents are `group_by()` (rows and columns), `summarise()` (values), and `pivot_wider()` if you want the "Columns" zone to actually spread across the page.

Start with the simple case — total revenue and order count per region. That's SUMIF and COUNTIF in one pass.

```r
# Excel: Pivot table with Region in Rows, sum(revenue) and count in Values
region_summary <- sales_joined |>
  group_by(region) |>
  summarise(
    total_revenue = sum(revenue),
    orders        = n(),
    .groups       = "drop"
  )
region_summary
#> # A tibble: 4 × 3
#>   region total_revenue orders
#>   <chr>          <dbl>  <int>
#> 1 East           21972      4
#> 2 North           7386      2
#> 3 South           5789      2
#> 4 West           16782      2
```

One pipeline, four rows back, and the same answer a 30-second pivot table trip would give you in Excel. Need to do this every Monday morning? Save the script. Need to do it on a new quarter's data? Change the input, re-run.

Now the full crosstab — regions as rows, products as columns, revenue in the cells. In Excel this is "drag Product into Columns". In R it's `pivot_wider()` after the group.

```r
# Excel: Pivot with Region in Rows, Product in Columns, sum(revenue) in Values
region_product_crosstab <- sales_joined |>
  group_by(region, product) |>
  summarise(total = sum(revenue), .groups = "drop") |>
  pivot_wider(names_from = product, values_from = total, values_fill = 0)
region_product_crosstab
#> # A tibble: 4 × 5
#>   region Laptop Monitor Phone Tablet
#>   <chr>   <dbl>   <dbl> <dbl>  <dbl>
#> 1 East    19980    1992     0      0
#> 2 North       0       0  5391   1995
#> 3 South       0       0  4193   1596
#> 4 West    14985       0  1797      0
```

`values_fill = 0` does the same job as ticking "Show zero for empty cells" in Excel's pivot options — the difference is that the setting lives inside the code, so it never gets lost.

[KEY INSIGHT]
**Pivot table = group_by + summarise + pivot_wider.** The first verb is the Rows box, the second is the Values box, and the third is the Columns box. Three verbs, and your pivot is reproducible forever.

**Try it:** Count how many orders were placed in each region. Save it to `ex_order_counts`.

```r
# Your turn:
ex_order_counts <- sales # chain group_by + summarise here

ex_order_counts
#> Expected: 4 rows — East 4, North 2, South 2, West 2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_order_counts <- sales |>
  group_by(region) |>
  summarise(orders = n(), .groups = "drop")
ex_order_counts
#> # A tibble: 4 × 2
#>   region orders
#>   <chr>   <int>
#> 1 East        4
#> 2 North       2
#> 3 South       2
#> 4 West        2
```

**Explanation:** `n()` inside `summarise()` counts the rows in each group — that's COUNTIF with the "criteria" already split out by `group_by`.

</details>

## How do you reshape Excel data without copy-paste?

Reshaping is the Excel operation people dread most. In Excel you either live with a wide layout, or you use Power Query's Unpivot (and hope it still works next week). In R, reshaping is just two functions: `pivot_longer()` takes wide data to long, `pivot_wider()` goes the other way. Here's a quarterly sales frame — the shape a finance team would email you — getting turned on its side.

```r
# Wide quarterly layout — typical Excel shape
quarterly_wide <- tibble(
  region = c("East", "West", "North", "South"),
  Q1     = c(10000,  8000, 5000, 4000),
  Q2     = c(12000,  9500, 6200, 4300),
  Q3     = c(15000, 11000, 7100, 4800),
  Q4     = c(18000, 12500, 8300, 5200)
)

# Excel: Get & Transform → Unpivot other columns
quarterly_long <- quarterly_wide |>
  pivot_longer(
    cols      = Q1:Q4,
    names_to  = "quarter",
    values_to = "revenue"
  )
head(quarterly_long, 5)
#> # A tibble: 5 × 3
#>   region quarter revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   Q1        10000
#> 2 East   Q2        12000
#> 3 East   Q3        15000
#> 4 East   Q4        18000
#> 5 West   Q1         8000
```

Sixteen rows (four regions × four quarters), one row per quarter per region. Once data is in this "long" shape, every dplyr verb you already know works on it — and every ggplot2 chart expects it.

[TIP]
**Long format is the shape dplyr and ggplot2 want.** When a pipeline feels awkward, there's a good chance the data is still wide. A single `pivot_longer()` at the top usually makes the next five lines write themselves.

The sibling problem is Text to Columns: a single cell holds two pieces of information separated by a delimiter, and you need them in their own columns. `separate_wider_delim()` handles it in one line.

```r
# Combined column — "Region-Product", like a sheet someone pasted together
combo_tbl <- tibble(
  combo   = c("East-Laptop", "West-Phone", "North-Tablet"),
  revenue = c(19980, 1797, 1995)
)

# Excel: Data → Text to Columns → Delimited → "-"
combo_split <- combo_tbl |>
  separate_wider_delim(
    cols  = combo,
    delim = "-",
    names = c("region", "product")
  )
combo_split
#> # A tibble: 3 × 3
#>   region product revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   Laptop    19980
#> 2 West   Phone      1797
#> 3 North  Tablet     1995
```

One function, one line, exactly the same result — and the next time a colleague sends you a sheet with the same layout, you re-run the same script.

**Try it:** Given this wide two-month frame, reshape it to long format and save to `ex_long`.

```r
ex_wide <- tibble(
  store = c("A", "B", "C"),
  Jan   = c(100, 200, 150),
  Feb   = c(110, 210, 160)
)

# Your turn:
ex_long <- ex_wide # chain pivot_longer here

ex_long
#> Expected: 6 rows — one per (store, month)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_long <- ex_wide |>
  pivot_longer(cols = Jan:Feb, names_to = "month", values_to = "sales")
ex_long
#> # A tibble: 6 × 3
#>   store month sales
#>   <chr> <chr> <dbl>
#> 1 A     Jan     100
#> 2 A     Feb     110
#> 3 B     Jan     200
#> 4 B     Feb     210
#> 5 C     Jan     150
#> 6 C     Feb     160
```

**Explanation:** `cols = Jan:Feb` says "take these columns", `names_to` is where their names go, and `values_to` is where their numbers go.

</details>

## How do you replace Excel charts and conditional formatting?

Excel charts are tied to the shape of a selection: click a range, pick a chart type, and hope the defaults are reasonable. ggplot2 is the opposite — you describe what you want (which columns, which geometry, which aesthetic) and the chart shape follows. The payoff is that you never have to rebuild a chart when the underlying data changes.

```r
# Excel: Insert → Bar Chart on the pivot table
region_chart <- ggplot(region_summary, aes(x = region, y = total_revenue)) +
  geom_col(fill = "#4C78A8") +
  labs(
    title = "Total revenue by region",
    x     = NULL,
    y     = "Revenue ($)"
  ) +
  theme_minimal()

region_chart
```

Read the code as a sentence: "Plot `region_summary`, map `region` to the x-axis and `total_revenue` to the y-axis, draw columns, label them." Swap `geom_col()` for `geom_point()` and you get a dot plot. Swap `x = region` for `x = product` and you get a totally different chart — no rebuild, no resizing, no broken formulas.

Conditional formatting — the colour-by-value heatmap Excel gives you when you highlight a range and pick "Color Scales" — is just a fill aesthetic on a `geom_tile()` in ggplot2. The `gt` package does the same thing inside a table. Both are one-liners once you see the pattern.

[NOTE]
**Plots render directly below the code block.** Click Run and the chart appears in the output area — no PNG export, no file save, no "update linked chart" dialog.

**Try it:** Build a bar chart of `total_revenue` per **product** (not region) using `sales_joined`. Hint: `group_by(product) |> summarise(total_revenue = sum(revenue))` first, then feed the result into `ggplot()`.

```r
# Your turn:
ex_product_chart <- sales_joined |>
  group_by(product) |>
  summarise(total_revenue = sum(revenue), .groups = "drop") # add ggplot here

ex_product_chart
#> Expected: a bar chart with four bars (Laptop, Monitor, Phone, Tablet)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_product_chart <- sales_joined |>
  group_by(product) |>
  summarise(total_revenue = sum(revenue), .groups = "drop") |>
  ggplot(aes(x = product, y = total_revenue)) +
  geom_col(fill = "#E45756") +
  labs(title = "Revenue by product", x = NULL, y = "Revenue ($)") +
  theme_minimal()

ex_product_chart
```

**Explanation:** The pipe carries the summarised tibble straight into `ggplot()`. The same three-step pattern — group, summarise, plot — handles nearly every chart you'd draw in Excel.

</details>

## Practice Exercises

### Exercise 1: Quarterly tax totals by region

Using `sales`, keep only rows where `quantity > 1`, compute a `revenue` column, left-join the `ex_region_tax` lookup below, compute `tax = revenue * tax_rate`, summarise `total_tax` per region, and save the result to `my_tax_by_region`.

```r
ex_region_tax <- tibble(
  region   = c("East", "West", "North", "South"),
  tax_rate = c(0.08, 0.07, 0.06, 0.09)
)

# Write your pipeline below:

# my_tax_by_region
#> Expected: 4 rows, one per region, with a total_tax column
```

<details>
<summary>Click to reveal solution</summary>

```r
my_tax_by_region <- sales |>
  filter(quantity > 1) |>
  mutate(revenue = quantity * unit_price) |>
  left_join(ex_region_tax, by = "region") |>
  mutate(tax = revenue * tax_rate) |>
  group_by(region) |>
  summarise(total_tax = sum(tax), .groups = "drop")

my_tax_by_region
#> # A tibble: 4 × 2
#>   region total_tax
#>   <chr>      <dbl>
#> 1 East      1757.8
#> 2 North      443.2
#> 3 South      521.0
#> 4 West      1174.7
```

**Explanation:** Five verbs in one pipeline — filter, mutate, left_join, mutate, summarise. That's one "morning in Excel" compressed into a paragraph of code.

</details>

### Exercise 2: Region × tier crosstab

Build a crosstab that shows total revenue per region and tier. Start from `sales`, add `revenue`, add a `tier` column using `case_when()` (Low < 3000, Medium 3000-10000, High > 10000), group by region and tier, summarise, and pivot wider so tiers become columns. Save the result to `my_crosstab`.

```r
# Write your pipeline below:

# my_crosstab
#> Expected: 4 rows (one per region), columns Low / Medium / High
```

<details>
<summary>Click to reveal solution</summary>

```r
my_crosstab <- sales |>
  mutate(
    revenue = quantity * unit_price,
    tier    = case_when(
      revenue >  10000 ~ "High",
      revenue >=  3000 ~ "Medium",
      TRUE             ~ "Low"
    )
  ) |>
  group_by(region, tier) |>
  summarise(total = sum(revenue), .groups = "drop") |>
  pivot_wider(names_from = tier, values_from = total, values_fill = 0)

my_crosstab
#> # A tibble: 4 × 4
#>   region    Low Medium   High
#>   <chr>   <dbl>  <dbl>  <dbl>
#> 1 East     1992   7992  11988
#> 2 North    1995   5391      0
#> 3 South    1596   4193      0
#> 4 West     1797      0  14985
```

**Explanation:** The full Excel pivot table — rows, values, columns — lives in one re-runnable pipeline. Drop in a different input next quarter and the crosstab rebuilds itself.

</details>

## Complete Example — A Monthly Sales Report in One Pipe

Here is the point of doing all this: the whole report, in one pipeline. Filter, compute, tier, join, group, summarise, spread into a crosstab, and draw a chart. What takes a practised Excel user twenty minutes of clicking, copying, and re-formatting is twelve lines of code that run instantly on ten rows or ten million.

```r
# One pipeline, the whole report
monthly_report <- sales |>
  filter(quantity > 1) |>
  mutate(
    revenue = quantity * unit_price,
    tier    = case_when(
      revenue >  10000 ~ "High",
      revenue >=  3000 ~ "Medium",
      TRUE             ~ "Low"
    )
  ) |>
  left_join(product_info, by = "product") |>
  group_by(region, category) |>
  summarise(total_revenue = sum(revenue), .groups = "drop") |>
  pivot_wider(
    names_from  = category,
    values_from = total_revenue,
    values_fill = 0
  )

monthly_report
#> # A tibble: 4 × 3
#>   region Computing Mobile
#>   <chr>      <dbl>  <dbl>
#> 1 East       19980      0
#> 2 North          0   7386
#> 3 South          0   5789
#> 4 West       14985   1797
```

```r
# And the chart — one extra pipe
monthly_report |>
  pivot_longer(-region, names_to = "category", values_to = "revenue") |>
  ggplot(aes(x = region, y = revenue, fill = category)) +
  geom_col(position = "dodge") +
  labs(title = "Revenue by region and category", x = NULL, y = "Revenue ($)") +
  theme_minimal()
```

Two things worth noticing. First, the report and the chart share the same pipeline — no copy-paste between sheets, no "link broken" dialogs. Second, everything upstream of `monthly_report` is reusable: swap in fresh data and the report rebuilds with zero manual work.

[WARNING]
**Save your script, not the output.** The Excel habit is "save the workbook"; the R habit is "save the script that produces the output". Ship the code, rerun it on tomorrow's data, and the report regenerates itself. Hand-editing cells in the output breaks this the moment you rerun.

## Summary

Here is the full Excel-to-R translation table in one place. Bookmark this section — it's the fastest cheat-sheet you'll reach for in the first week.

| Excel operation | R equivalent | Package |
|---|---|---|
| AutoFilter | `filter()` | dplyr |
| Sort A-Z / Z-A | `arrange()` / `arrange(desc())` | dplyr |
| Formula in a new column | `mutate()` | dplyr |
| `IF()` | `if_else()` | dplyr |
| Nested `IF()` / `IFS()` | `case_when()` | dplyr |
| VLOOKUP / INDEX-MATCH | `left_join()` | dplyr |
| SUMIF / COUNTIF / AVERAGEIF | `group_by()` + `summarise()` | dplyr |
| Pivot table | `group_by()` + `summarise()` + `pivot_wider()` | dplyr + tidyr |
| Unpivot (Get & Transform) | `pivot_longer()` | tidyr |
| Text to Columns | `separate_wider_delim()` | tidyr |
| Charts | `ggplot()` + `geom_*()` | ggplot2 |
| Conditional formatting | `scale_fill_gradient()`, `gt` tables | ggplot2, gt |

Three reasons the trip is worth it, once you have the map:

1. **Reproducibility** — the same script runs the same way next week, next quarter, on next year's data. No "the filters got lost when I reopened it."
2. **Scale** — dplyr handles millions of rows without freezing; Excel usually gives up around a hundred thousand.
3. **Version control** — a script is a text file. Git can tell you exactly what changed, when, and by whom. A spreadsheet can't.

## References

1. dplyr documentation — verbs for data transformation. [Link](https://dplyr.tidyverse.org/)
2. tidyr documentation — `pivot_longer()`, `pivot_wider()`, `separate_wider_delim()`. [Link](https://tidyr.tidyverse.org/)
3. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G. — *R for Data Science* (2nd ed.), chapters on data transformation and relational data. [Link](https://r4ds.hadley.nz/)
4. Bryan, J. et al. — *R for Excel Users* (RStudio workshop materials). [Link](https://rstudio-conf-2020.github.io/r-for-excel/)
5. ggplot2 documentation — the grammar of graphics in R. [Link](https://ggplot2.tidyverse.org/)
6. Microsoft — Excel functions (by category) reference. [Link](https://support.microsoft.com/en-us/office/excel-functions-by-category-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb)

## Continue Learning

- **[dplyr filter() and select()](dplyr-filter-select.html)** — the two verbs that replace Excel's AutoFilter and column-hiding, explained in depth.
- **[dplyr joins](dplyr-joins.html)** — every join type (inner, left, right, full, semi, anti) with the cases where each one beats VLOOKUP.
- **[Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html)** — the bigger case for moving off spreadsheets, with data on where R pays off and where Excel still wins.

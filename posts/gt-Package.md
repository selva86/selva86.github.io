---
title: "gt Package: Beautiful Publication-Ready Tables in R"
slug: "gt-Package"
description: "Master the gt package in R to create beautiful, publication-ready tables. Learn formatting, styling, conditional colors, themes, and export workflows."
keywords: "gt package R, publication-ready tables R, gt table R, gt formatting, grammar of tables R, R table package, gt conditional formatting, gt styling R"
auto_link_terms: "gt package|gt()|tab_header()|fmt_number()|tab_style()|publication-ready tables|grammar of tables"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "FR-cust-3"
post_type: "FR"
fr_parent: "Publication-Quality-Figures-in-R.html"
difficulty: "Intermediate"
---

# gt Package: Beautiful Publication-Ready Tables in R

<p class="lead">The gt package gives you a "grammar of tables" — a layered system for turning any data frame into a polished, publication-ready table with formatted numbers, styled headers, conditional colors, and footnotes, all in a few lines of R code.</p>

## How Does gt() Turn a Data Frame into a Table?

Console output is fine for exploration, but reports and papers demand clean formatting. The gt package lets you pipe a data frame straight into a presentation-quality table. Let's see it in action.

```r
# Create your first gt table
library(gt)
library(dplyr)

mtcars |>
  slice(1:5) |>
  gt(rowname_col = "name") |>
  tab_header(
    title = "Motor Trend Car Data",
    subtitle = "Top 5 vehicles from the 1974 dataset"
  )
#> A formatted table with bold title "Motor Trend Car Data"
#> Rows: Mazda RX4, Mazda RX4 Wag, Datsun 710, Hornet 4 Drive, Hornet Sportabout
#> Columns: mpg, cyl, disp, hp, drat, wt, qsec, vs, am, gear, carb
```

The `gt()` function is the entry point — it takes any data frame and wraps it in a structured table object. From there, you layer on formatting with `tab_header()`, `tab_source_note()`, and other functions, just like adding layers in ggplot2.

[KEY INSIGHT]
**gt follows a layered approach like ggplot2.** Start with your data, pipe it into gt(), then chain formatting functions one at a time. Each function modifies the table without changing your underlying data.

Now let's add a source note to credit where the data came from. Source notes appear at the bottom of the table and are standard in academic publications.

```r
# Add source note and subtitle
mtcars |>
  slice(1:5) |>
  mutate(name = rownames(mtcars)[1:5]) |>
  gt() |>
  tab_header(
    title = "Motor Trend Car Data",
    subtitle = "Performance metrics for 5 classic vehicles"
  ) |>
  tab_source_note(
    source_note = "Source: Henderson and Velleman (1981), Motor Trend magazine."
  )
#> Same table as above, now with a footnote-style source line at the bottom
#> "Source: Henderson and Velleman (1981), Motor Trend magazine."
```

The `tab_source_note()` adds a citation at the table footer. You can chain multiple source notes if the data comes from several sources.

**Try it:** Create a gt table from the first 6 rows of `airquality` with the title "New York Air Quality" and subtitle "Daily measurements, May-September 1973".

```r
# Try it: build a gt table from airquality
ex_air <- airquality |>
  head(6) |>
  gt()
  # Add tab_header() with title and subtitle here

ex_air
#> Expected: a gt table with title "New York Air Quality"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_air <- airquality |>
  head(6) |>
  gt() |>
  tab_header(
    title = "New York Air Quality",
    subtitle = "Daily measurements, May-September 1973"
  )
ex_air
#> A formatted table showing Ozone, Solar.R, Wind, Temp, Month, Day
#> with the title and subtitle displayed above the column headers
```

**Explanation:** Pipe the data into `gt()`, then chain `tab_header()` with both `title` and `subtitle` arguments.

</details>

## How Do You Format Numbers, Currencies, and Percentages?

Raw numbers with many decimal places clutter your tables. The `fmt_*()` family reformats column values in place — no need to mutate your data first. These functions handle thousands separators, decimal precision, currency symbols, and percentages automatically.

Let's create a summary table and format the numbers for readability.

```r
# Format numbers with fmt_number()
summary_data <- mtcars |>
  group_by(cyl) |>
  summarise(
    avg_mpg = mean(mpg),
    avg_hp = mean(hp),
    avg_wt = mean(wt),
    count = n()
  )

summary_data |>
  gt() |>
  tab_header(title = "Average Stats by Cylinder Count") |>
  fmt_number(columns = c(avg_mpg, avg_hp), decimals = 1) |>
  fmt_number(columns = avg_wt, decimals = 2)
#> cyl  avg_mpg  avg_hp  avg_wt  count
#>   4     26.7    82.6    2.29     11
#>   6     19.7   122.3    3.12      7
#>   8     15.1   209.2    4.00     14
```

The `fmt_number()` function takes a `columns` argument (supports tidy selection) and `decimals` to control precision. Notice how different columns get different decimal places — chain multiple `fmt_number()` calls for this.

Now let's see currency and percentage formatting. These are common in business reports where you need dollar signs and percent symbols.

```r
# Format currency and percentages
sales_data <- tibble(
  product = c("Widget A", "Widget B", "Widget C"),
  revenue = c(15230.5, 8745.25, 22100.0),
  margin = c(0.234, 0.189, 0.312),
  growth = c(0.052, -0.031, 0.147)
)

sales_data |>
  gt() |>
  tab_header(title = "Q1 Sales Report") |>
  fmt_currency(columns = revenue, currency = "USD") |>
  fmt_percent(columns = c(margin, growth), decimals = 1)
#> product     revenue       margin   growth
#> Widget A    $15,230.50    23.4%     5.2%
#> Widget B    $8,745.25     18.9%    -3.1%
#> Widget C    $22,100.00    31.2%    14.7%
```

The `fmt_currency()` function adds the currency symbol, thousands separators, and two decimal places by default. The `fmt_percent()` function multiplies by 100 and appends the % sign. Both accept a `locale` argument for international formatting.

[TIP]
**Chain multiple fmt_*() calls to format different columns in one pipeline.** Each call targets specific columns and leaves the rest untouched. The order doesn't matter — gt applies all formatting when the table renders.

Sometimes your data has missing values or dates that need special handling. The `sub_missing()` function replaces `NA` with a custom string, and `fmt_date()` converts date columns to readable formats.

```r
# Handle missing values and format dates
dates_data <- tibble(
  event = c("Launch", "Review", "Update", "Maintenance"),
  date = as.Date(c("2026-01-15", "2026-03-22", NA, "2026-06-01")),
  score = c(92.5, NA, 88.1, 95.3)
)

dates_data |>
  gt() |>
  tab_header(title = "Project Timeline") |>
  fmt_date(columns = date, date_style = "day_month_year") |>
  sub_missing(columns = everything(), missing_text = "TBD")
#> event          date              score
#> Launch         15 January 2026   92.5
#> Review         22 March 2026     TBD
#> Update         TBD               88.1
#> Maintenance    01 June 2026      95.3
```

The `sub_missing()` function with `columns = everything()` catches NAs in any column. You can target specific columns and use different replacement text for each.

**Try it:** Create a tibble with three products, a `price` column, and a `discount` column (as decimals like 0.15). Format prices as EUR currency and discounts as percentages with 0 decimals.

```r
# Try it: format currency and percentages
ex_products <- tibble(
  product = c("Laptop", "Phone", "Tablet"),
  price = c(999.99, 699.50, 449.00),
  discount = c(0.15, 0.10, 0.20)
)

ex_products |>
  gt()
  # Add fmt_currency() for price (EUR) and fmt_percent() for discount here

#> Expected: prices as €999.99 and discounts as 15%, 10%, 20%
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_products <- tibble(
  product = c("Laptop", "Phone", "Tablet"),
  price = c(999.99, 699.50, 449.00),
  discount = c(0.15, 0.10, 0.20)
)

ex_products |>
  gt() |>
  fmt_currency(columns = price, currency = "EUR") |>
  fmt_percent(columns = discount, decimals = 0)
#> product   price       discount
#> Laptop    €999.99     15%
#> Phone     €699.50     10%
#> Tablet    €449.00     20%
```

**Explanation:** `fmt_currency(currency = "EUR")` adds the euro symbol. `fmt_percent(decimals = 0)` rounds to whole percentages.

</details>

## How Do You Add Headers, Spanners, and Row Groups?

Real-world tables often have hierarchical structure — columns that belong together under a shared label, or rows grouped by category. gt handles both with `tab_spanner()` for column groups and `tab_row_group()` for row groups.

Let's group related columns under a spanner label. Spanners add a second header row that visually ties columns together.

```r
# Group columns with spanners
mtcars |>
  slice(1:6) |>
  mutate(name = rownames(mtcars)[1:6]) |>
  select(name, mpg, hp, wt, qsec, gear, carb) |>
  gt() |>
  tab_header(title = "Car Performance Comparison") |>
  tab_spanner(label = "Performance", columns = c(mpg, hp)) |>
  tab_spanner(label = "Specs", columns = c(wt, qsec)) |>
  tab_spanner(label = "Drivetrain", columns = c(gear, carb)) |>
  cols_label(
    name = "Vehicle",
    mpg = "MPG",
    hp = "HP",
    wt = "Weight",
    qsec = "1/4 Mile",
    gear = "Gears",
    carb = "Carbs"
  )
#>                    Performance    Specs          Drivetrain
#> Vehicle           MPG     HP     Weight  1/4 Mile  Gears  Carbs
#> Mazda RX4         21.0   110     2.620    16.46      4      4
#> Mazda RX4 Wag     21.0   110     2.875    17.02      4      4
#> ...
```

Each `tab_spanner()` call creates a header that spans the specified columns. The `cols_label()` function renames the individual column headers underneath — use readable names instead of the raw variable names.

[TIP]
**Use md() inside labels for bold or italic formatting.** Write `cols_label(mpg = md("**Miles/Gal**"))` to render the header in bold. This works in tab_spanner() labels too.

Now let's organize rows into groups. This is useful when your table has a categorical variable that defines natural clusters.

```r
# Organize rows by group
mtcars |>
  slice(1:10) |>
  mutate(name = rownames(mtcars)[1:10]) |>
  select(name, mpg, hp, cyl) |>
  gt(rowname_col = "name") |>
  tab_header(title = "Cars Grouped by Cylinder Count") |>
  tab_row_group(label = "6 Cylinders", rows = cyl == 6) |>
  tab_row_group(label = "4 Cylinders", rows = cyl == 4) |>
  tab_row_group(label = "8 Cylinders", rows = cyl == 8)
#> 6 Cylinders
#>   Mazda RX4           21.0   110   6
#>   Mazda RX4 Wag       21.0   110   6
#>   Hornet 4 Drive      21.4   110   6
#>   Valiant             18.1   105   6
#> 4 Cylinders
#>   Datsun 710          22.8    93   4
#>   Merc 240D           24.4    62   4
#> 8 Cylinders
#>   Hornet Sportabout   18.7   175   8
#>   Duster 360          14.3   245   8
#>   ...
```

The `tab_row_group()` function filters rows using the `rows` argument (same syntax as dplyr's filter). Groups appear in the order you define them, with a bold label row separating each group.

**Try it:** Take the first 8 rows of `mtcars`, create a gt table, and add a spanner labeled "Engine" over the `cyl` and `disp` columns.

```r
# Try it: add a column spanner
ex_spanner <- mtcars |>
  slice(1:8) |>
  mutate(name = rownames(mtcars)[1:8]) |>
  select(name, mpg, cyl, disp, hp) |>
  gt()
  # Add tab_spanner() here

ex_spanner
#> Expected: "Engine" label spanning the cyl and disp columns
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_spanner <- mtcars |>
  slice(1:8) |>
  mutate(name = rownames(mtcars)[1:8]) |>
  select(name, mpg, cyl, disp, hp) |>
  gt() |>
  tab_spanner(label = "Engine", columns = c(cyl, disp))
ex_spanner
#> A table with "Engine" spanning cyl and disp,
#> mpg and hp remain ungrouped
```

**Explanation:** `tab_spanner(label = "Engine", columns = c(cyl, disp))` adds a grouped header. The columns must be adjacent in the table for the spanner to render correctly — use `cols_move()` if needed.

</details>

## How Do You Style Cells with Conditional Formatting?

Plain tables communicate data, but styled tables guide the reader's eye to what matters. The `tab_style()` function applies CSS-like formatting to specific cells, rows, or columns. You target locations with helper functions like `cells_body()`, `cells_column_labels()`, and `cells_row_groups()`.

Let's start by styling the column headers with a bold font and background color.

```r
# Style headers with colors and bold text
mtcars |>
  slice(1:5) |>
  mutate(name = rownames(mtcars)[1:5]) |>
  select(name, mpg, hp, wt) |>
  gt() |>
  tab_header(title = "Styled Car Data") |>
  tab_style(
    style = list(
      cell_fill(color = "#4682B4"),
      cell_text(color = "white", weight = "bold")
    ),
    locations = cells_column_labels(everything())
  )
#> Column headers (name, mpg, hp, wt) now display
#> with steel-blue background and white bold text
#> Data rows remain with default styling
```

The `tab_style()` function takes two main arguments: `style` (a list of cell formatting rules) and `locations` (which cells to target). The `cell_fill()`, `cell_text()`, and `cell_borders()` helpers control background color, font properties, and border styles respectively.

[WARNING]
**tab_style() targets cells by location, not by value.** To highlight cells based on their content (like "all values above 20"), pass a filtering expression to the `rows` argument in `cells_body()`.

Now let's apply conditional formatting — highlighting rows where a value exceeds a threshold. This is one of the most practical uses of `tab_style()`.

```r
# Conditional formatting: highlight high-MPG cars
mtcars |>
  slice(1:10) |>
  mutate(name = rownames(mtcars)[1:10]) |>
  select(name, mpg, hp, cyl) |>
  gt() |>
  tab_header(title = "Fuel Efficiency Highlights") |>
  tab_style(
    style = cell_fill(color = "#d4edda"),
    locations = cells_body(
      columns = mpg,
      rows = mpg > 20
    )
  ) |>
  tab_style(
    style = cell_text(color = "#dc3545", weight = "bold"),
    locations = cells_body(
      columns = hp,
      rows = hp > 200
    )
  )
#> MPG cells above 20 highlighted with light green background
#> HP cells above 200 displayed in bold red text
#> Other cells remain with default styling
```

Each `tab_style()` call is independent — you can stack multiple conditional rules. The `rows` argument accepts any logical expression that references column values, just like `dplyr::filter()`.

For continuous color scales across an entire column, use `data_color()`. This maps numeric values to a gradient, creating a heatmap effect.

```r
# Color scale across a numeric column
mtcars |>
  slice(1:8) |>
  mutate(name = rownames(mtcars)[1:8]) |>
  select(name, mpg, hp) |>
  gt() |>
  tab_header(title = "Performance Heatmap") |>
  data_color(
    columns = mpg,
    palette = c("#dc3545", "#ffc107", "#28a745")
  ) |>
  data_color(
    columns = hp,
    palette = c("#28a745", "#ffc107", "#dc3545")
  )
#> MPG column: green for high values, red for low (higher is better)
#> HP column: reversed — red for high values (higher = more power)
#> Each cell background blends along the gradient based on its value
```

The `data_color()` function maps the minimum value to the first palette color and the maximum to the last. The palette accepts any hex colors or named R colors. Note the reversed palette for HP — higher horsepower gets a warmer color to signal "more intense."

**Try it:** Take the first 6 rows of `mtcars` and highlight all cells in the `mpg` column where the value exceeds 21 with a light yellow background (`"#fff3cd"`).

```r
# Try it: conditional cell highlighting
ex_cond <- mtcars |>
  slice(1:6) |>
  mutate(name = rownames(mtcars)[1:6]) |>
  select(name, mpg, hp) |>
  gt()
  # Add tab_style() with cell_fill() targeting mpg > 21

ex_cond
#> Expected: mpg cells > 21 have yellow background
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cond <- mtcars |>
  slice(1:6) |>
  mutate(name = rownames(mtcars)[1:6]) |>
  select(name, mpg, hp) |>
  gt() |>
  tab_style(
    style = cell_fill(color = "#fff3cd"),
    locations = cells_body(columns = mpg, rows = mpg > 21)
  )
ex_cond
#> Datsun 710 (22.8) and Hornet 4 Drive (21.4) cells highlighted
#> Other mpg cells remain with default background
```

**Explanation:** The `rows = mpg > 21` inside `cells_body()` filters which rows receive the style. Only the `mpg` column is affected because we specified `columns = mpg`.

</details>

## How Do You Add Footnotes and Source Notes?

Professional tables cite their sources and clarify specific values with footnotes. gt handles both automatically — footnotes get numbered markers, and source notes appear at the table footer.

```r
# Add footnotes to specific cells and column headers
mtcars |>
  slice(1:5) |>
  mutate(name = rownames(mtcars)[1:5]) |>
  select(name, mpg, hp, wt) |>
  gt() |>
  tab_header(
    title = "Vehicle Comparison",
    subtitle = "Selected models from Motor Trend 1974"
  ) |>
  tab_footnote(
    footnote = "Miles per US gallon",
    locations = cells_column_labels(columns = mpg)
  ) |>
  tab_footnote(
    footnote = "Gross horsepower",
    locations = cells_column_labels(columns = hp)
  ) |>
  tab_footnote(
    footnote = "Lightest vehicle in this selection",
    locations = cells_body(columns = wt, rows = wt == min(wt))
  ) |>
  tab_source_note("Source: Motor Trend US magazine, 1974")
#> mpg column header shows superscript "1", hp shows "2"
#> The lightest vehicle's wt cell shows superscript "3"
#> Footer: 1. Miles per US gallon  2. Gross horsepower
#>         3. Lightest vehicle in this selection
#>         Source: Motor Trend US magazine, 1974
```

Each `tab_footnote()` auto-numbers its marker. You can target column headers with `cells_column_labels()`, specific body cells with `cells_body()`, or even the title with `cells_title()`. The `tab_source_note()` is separate and always appears last in the footer without a number.

[NOTE]
**Footnotes auto-number sequentially.** You don't control the numbering — gt assigns numbers in the order you call tab_footnote(). If you reorder the calls, the numbers change.

**Try it:** Create a gt table from the first 4 rows of `iris`, add a footnote saying "Length in centimeters" to the `Sepal.Length` column header, and add a source note crediting "Anderson, 1935".

```r
# Try it: add a footnote and source note
ex_fn <- iris |>
  head(4) |>
  gt()
  # Add tab_footnote() and tab_source_note() here

ex_fn
#> Expected: superscript "1" on Sepal.Length header
#> Footer with footnote text and source attribution
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fn <- iris |>
  head(4) |>
  gt() |>
  tab_footnote(
    footnote = "Length in centimeters",
    locations = cells_column_labels(columns = Sepal.Length)
  ) |>
  tab_source_note("Source: Anderson, 1935")
ex_fn
#> Sepal.Length header displays superscript "1"
#> Footer: 1. Length in centimeters
#>         Source: Anderson, 1935
```

**Explanation:** `cells_column_labels(columns = Sepal.Length)` targets the header cell. The source note is a separate footer element that doesn't get numbered.

</details>

## How Do You Apply Themes and Custom Styling?

The default gt table looks clean, but you'll often want a consistent look across all your tables. The `opt_stylize()` function applies pre-built themes with a single call, while `tab_options()` gives you fine-grained control over every visual detail.

```r
# Quick theming with opt_stylize()
mtcars |>
  slice(1:5) |>
  mutate(name = rownames(mtcars)[1:5]) |>
  select(name, mpg, hp, wt) |>
  gt() |>
  tab_header(title = "Styled with opt_stylize()") |>
  opt_stylize(style = 6, color = "cyan")
#> Table now has a cyan-themed design:
#> colored header row, alternating row stripes,
#> clean borders, and professional typography
```

The `opt_stylize()` function offers 6 built-in styles (1 through 6) and several color options including "blue", "cyan", "pink", "green", "red", and "gray". Style 1 is subtle, style 6 is bold. Pick one that matches your report's tone.

For full control, `tab_options()` lets you set individual properties — font family, font size, row padding, border styles, header colors, and more.

```r
# Fine-grained control with tab_options()
mtcars |>
  slice(1:6) |>
  mutate(name = rownames(mtcars)[1:6]) |>
  select(name, mpg, hp, wt) |>
  gt() |>
  tab_header(
    title = "Custom Theme Example",
    subtitle = "Fine-tuned with tab_options()"
  ) |>
  tab_options(
    heading.background.color = "#2C3E50",
    heading.title.font.size = px(18),
    column_labels.background.color = "#34495E",
    column_labels.font.weight = "bold",
    column_labels.font.size = px(13),
    row.striping.include_table_body = TRUE,
    row.striping.background_color = "#F8F9FA",
    table.border.top.style = "solid",
    table.border.top.color = "#2C3E50",
    table.font.size = px(13)
  )
#> Dark header with white text, bold column labels on charcoal background
#> Alternating light gray stripes on body rows
#> Solid dark border at the top of the table
```

That's a lot of options, and `tab_options()` supports over 100 properties. The ones above cover the most common needs: header styling, column label appearance, row striping, borders, and font sizes.

[TIP]
**Wrap your custom tab_options() in a reusable function to create a personal theme.** Call `my_theme <- function(gt_tbl) gt_tbl |> tab_options(...)`, then apply it to any table with `my_table |> my_theme()`.

Let's create that reusable theme and apply it.

```r
# Create a reusable custom theme
my_report_theme <- function(gt_tbl) {
  gt_tbl |>
    tab_options(
      heading.background.color = "#1B4F72",
      column_labels.background.color = "#2E86C1",
      column_labels.font.weight = "bold",
      row.striping.include_table_body = TRUE,
      row.striping.background_color = "#EBF5FB",
      table.font.size = px(13),
      heading.title.font.size = px(16)
    )
}

# Apply the theme to any table
mtcars |>
  slice(1:4) |>
  mutate(name = rownames(mtcars)[1:4]) |>
  select(name, mpg, hp) |>
  gt() |>
  tab_header(title = "Reusable Theme Demo") |>
  fmt_number(columns = c(mpg, hp), decimals = 1) |>
  my_report_theme()
#> Table with consistent blue theme applied from the function
#> Same theme works on any gt table by piping into my_report_theme()
```

Now every table in your report gets the same professional look with a single function call. You can keep the theme function in a shared script and source it across projects.

**Try it:** Apply `opt_stylize(style = 3, color = "green")` to a gt table from the first 4 rows of `iris`, then override the title font size to `px(20)` using `tab_options()`.

```r
# Try it: combine opt_stylize with tab_options
ex_theme <- iris |>
  head(4) |>
  gt() |>
  tab_header(title = "Themed Iris Table")
  # Add opt_stylize() and tab_options() here

ex_theme
#> Expected: green-themed table with larger title text
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_theme <- iris |>
  head(4) |>
  gt() |>
  tab_header(title = "Themed Iris Table") |>
  opt_stylize(style = 3, color = "green") |>
  tab_options(heading.title.font.size = px(20))
ex_theme
#> Green-themed table (style 3) with a larger 20px title
#> opt_stylize sets the base theme, tab_options overrides individual properties
```

**Explanation:** `opt_stylize()` applies the base theme, then `tab_options()` overrides specific properties. The order matters — place overrides after the base theme.

</details>

## Practice Exercises

### Exercise 1: Formatted Summary Table

Build a summary statistics table from `airquality`. Group by `Month`, compute the mean and standard deviation of `Ozone` (ignore NAs), format all numbers to 1 decimal place, add the title "NYC Air Quality by Month", and include a source note crediting "NY State Dept of Conservation".

```r
# Exercise 1: Build a formatted summary table
# Hint: group_by() + summarise() first, then pipe to gt()
# Use na.rm = TRUE in mean() and sd()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
airquality |>
  group_by(Month) |>
  summarise(
    avg_ozone = mean(Ozone, na.rm = TRUE),
    sd_ozone = sd(Ozone, na.rm = TRUE)
  ) |>
  gt() |>
  tab_header(title = "NYC Air Quality by Month") |>
  fmt_number(columns = c(avg_ozone, sd_ozone), decimals = 1) |>
  cols_label(
    Month = "Month",
    avg_ozone = "Mean Ozone (ppb)",
    sd_ozone = "SD Ozone"
  ) |>
  tab_source_note("Source: NY State Dept of Conservation")
#> Month  Mean Ozone (ppb)  SD Ozone
#>     5              23.6      22.2
#>     6              29.4      18.2
#>     7              59.1      31.6
#>     8              60.0      39.7
#>     9              31.4      24.1
```

**Explanation:** Summarise first, then pipe the result into gt(). `fmt_number(decimals = 1)` rounds both columns. `cols_label()` gives human-readable headers.

</details>

### Exercise 2: Styled Comparison Table

Create a table from `mtcars` (first 10 rows) with columns `name`, `mpg`, `hp`, and `cyl`. Add a spanner "Performance" over `mpg` and `hp`. Highlight `mpg` cells above 20 in green (`"#d4edda"`) and below 16 in red (`"#f8d7da"`). Apply `opt_stylize(style = 1, color = "blue")` and add a title.

```r
# Exercise 2: Build a styled comparison table
# Hint: use two tab_style() calls for conditional formatting

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
mtcars |>
  slice(1:10) |>
  mutate(name = rownames(mtcars)[1:10]) |>
  select(name, mpg, hp, cyl) |>
  gt() |>
  tab_header(title = "Vehicle Performance Comparison") |>
  tab_spanner(label = "Performance", columns = c(mpg, hp)) |>
  tab_style(
    style = cell_fill(color = "#d4edda"),
    locations = cells_body(columns = mpg, rows = mpg > 20)
  ) |>
  tab_style(
    style = cell_fill(color = "#f8d7da"),
    locations = cells_body(columns = mpg, rows = mpg < 16)
  ) |>
  opt_stylize(style = 1, color = "blue")
#> Blue-themed table with "Performance" spanner over mpg and hp
#> Green cells: Mazda RX4 (21.0), Datsun 710 (22.8), Hornet 4 Drive (21.4)
#> Red cells: Duster 360 (14.3)
```

**Explanation:** Two `tab_style()` calls with different `rows` conditions create a two-tone conditional format. `opt_stylize()` applies the base theme underneath.

</details>

### Exercise 3: Complete Report Table

Build a "report card" table. Create sample data for 6 students with columns: `student`, `subject` (Math or Science), `score`, and `grade` (A/B/C). Add row groups by subject. Format scores to 0 decimals. Color grade cells — green for A, yellow for B, red for C. Add a footnote on the score column header saying "Out of 100 points". Apply a custom theme.

```r
# Exercise 3: Build a report card table
# Hint: create the tibble first, then build the gt table layer by layer

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
report_data <- tibble(
  student = c("Alice", "Bob", "Carol", "Dave", "Eve", "Frank"),
  subject = c("Math", "Math", "Math", "Science", "Science", "Science"),
  score = c(92, 78, 85, 67, 95, 88),
  grade = c("A", "C", "B", "C", "A", "B")
)

report_data |>
  gt() |>
  tab_header(
    title = "Student Report Card",
    subtitle = "Mid-term Results 2026"
  ) |>
  tab_row_group(label = "Mathematics", rows = subject == "Math") |>
  tab_row_group(label = "Science", rows = subject == "Science") |>
  fmt_number(columns = score, decimals = 0) |>
  tab_style(
    style = cell_fill(color = "#d4edda"),
    locations = cells_body(columns = grade, rows = grade == "A")
  ) |>
  tab_style(
    style = cell_fill(color = "#fff3cd"),
    locations = cells_body(columns = grade, rows = grade == "B")
  ) |>
  tab_style(
    style = cell_fill(color = "#f8d7da"),
    locations = cells_body(columns = grade, rows = grade == "C")
  ) |>
  tab_footnote(
    footnote = "Out of 100 points",
    locations = cells_column_labels(columns = score)
  ) |>
  opt_stylize(style = 6, color = "gray")
#> Gray-themed table with row groups "Mathematics" and "Science"
#> Grade cells: green for A, yellow for B, red for C
#> Score header has footnote marker linking to "Out of 100 points"
```

**Explanation:** Three `tab_style()` calls target different grade values. `tab_row_group()` organizes students by subject. The footnote targets the score column header.

</details>

## Putting It All Together

Let's build a polished table from scratch — taking raw `mtcars` data through the complete gt pipeline: summarise, structure, format, style, annotate, and theme.

```r
# Complete example: from raw data to publication-ready table
final_tbl <- mtcars |>
  mutate(name = rownames(mtcars)) |>
  group_by(cyl) |>
  summarise(
    count = n(),
    avg_mpg = mean(mpg),
    avg_hp = mean(hp),
    avg_wt = mean(wt),
    best_mpg = max(mpg)
  ) |>
  gt() |>
  tab_header(
    title = "Vehicle Performance by Engine Size",
    subtitle = "Summary statistics from the 1974 Motor Trend dataset"
  ) |>
  tab_spanner(label = "Averages", columns = c(avg_mpg, avg_hp, avg_wt)) |>
  cols_label(
    cyl = "Cylinders",
    count = "N",
    avg_mpg = "MPG",
    avg_hp = "HP",
    avg_wt = "Weight (tons)",
    best_mpg = "Best MPG"
  ) |>
  fmt_number(columns = c(avg_mpg, avg_hp), decimals = 1) |>
  fmt_number(columns = avg_wt, decimals = 2) |>
  fmt_number(columns = best_mpg, decimals = 1) |>
  tab_style(
    style = cell_fill(color = "#d4edda"),
    locations = cells_body(columns = avg_mpg, rows = avg_mpg > 25)
  ) |>
  tab_style(
    style = cell_fill(color = "#f8d7da"),
    locations = cells_body(columns = avg_mpg, rows = avg_mpg < 16)
  ) |>
  data_color(
    columns = avg_hp,
    palette = c("#EBF5FB", "#2E86C1")
  ) |>
  tab_footnote(
    footnote = "Best fuel economy in this engine class",
    locations = cells_column_labels(columns = best_mpg)
  ) |>
  tab_source_note("Source: Henderson & Velleman (1981), Motor Trend magazine") |>
  tab_options(
    heading.background.color = "#2C3E50",
    column_labels.background.color = "#34495E",
    column_labels.font.weight = "bold",
    row.striping.include_table_body = TRUE,
    row.striping.background_color = "#F8F9FA",
    table.font.size = px(13)
  )

final_tbl
#> A polished 3-row summary table:
#>
#>   Vehicle Performance by Engine Size
#>   Summary statistics from the 1974 Motor Trend dataset
#>
#>                    Averages
#>   Cylinders  N    MPG    HP    Weight (tons)  Best MPG*
#>   4         11   26.7   82.6       2.29         33.9    (green MPG cell)
#>   6          7   19.7  122.3       3.12         21.4
#>   8         14   15.1  209.2       4.00         19.2    (red MPG cell)
#>
#>   * Best fuel economy in this engine class
#>   Source: Henderson & Velleman (1981), Motor Trend magazine
```

This pipeline demonstrates every major gt feature: structural elements (header, spanner, column labels), formatting (decimal precision), styling (conditional fills, color gradients), annotations (footnote, source note), and theming (custom options). Each layer builds on the previous one without modifying the underlying data.

## Summary

Here are the key gt functions organized by what they do:

| Purpose | Function | What It Does |
|---------|----------|-------------|
| Create | `gt()` | Turns a data frame into a gt table object |
| Title | `tab_header()` | Adds title and optional subtitle |
| Format | `fmt_number()` | Formats numeric columns (decimals, separators) |
| Format | `fmt_currency()` | Adds currency symbols and formatting |
| Format | `fmt_percent()` | Converts decimals to percentages |
| Format | `fmt_date()` | Formats date columns |
| Format | `sub_missing()` | Replaces NA values with custom text |
| Structure | `tab_spanner()` | Groups columns under a shared label |
| Structure | `tab_row_group()` | Groups rows by a condition |
| Structure | `cols_label()` | Renames column headers |
| Style | `tab_style()` | Applies CSS-like styles to targeted cells |
| Style | `cell_fill()` | Sets background color (used inside tab_style) |
| Style | `cell_text()` | Sets font properties (used inside tab_style) |
| Style | `data_color()` | Applies color scales to numeric columns |
| Annotate | `tab_footnote()` | Adds numbered footnotes to specific cells |
| Annotate | `tab_source_note()` | Adds source citation at the footer |
| Theme | `opt_stylize()` | Applies a pre-built theme (6 styles, several colors) |
| Theme | `tab_options()` | Fine-grained control over 100+ visual properties |

![gt table-building pipeline](screenshots/gt-Package-pipeline.webp)

*Figure 1: The gt table-building pipeline — raw data flows through structure, formatting, styling, annotation, and theming layers.*

## References

1. Iannone, R., Cheng, J., Schloerke, B., Hughes, E., Lauer, A., & Seo, J. — gt: Easily Create Presentation-Ready Display Tables. [Link](https://gt.rstudio.com/)
2. gt CRAN documentation. [Link](https://cran.r-project.org/package=gt)
3. Iannone, R. — Introduction to Creating gt Tables. [Link](https://gt.rstudio.com/articles/gt.html)
4. Rapp, A. — Creating Beautiful Tables in R with gt. [Link](https://gt.albert-rapp.de/)
5. Wickham, H., Çetinkaya-Rundel, M., & Grolemund, G. — R for Data Science (2e). O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
6. R Graph Gallery — gt Package Tutorial. [Link](https://r-graph-gallery.com/package/gt.html)
7. gtsummary package — Presentation-Ready Summary Tables. [Link](https://www.danieldsjoberg.com/gtsummary/)

## Continue Learning

- [Publication-Quality Figures in R](Publication-Quality-Figures-in-R.html) — The parent guide on making journal-ready ggplot2 figures with proper fonts, sizes, and color profiles.
- [ggplot2 Themes in R](ggplot2-Themes-in-R.html) — Comprehensive guide to customizing ggplot2's visual appearance with theme elements.
- [Statistical Report Writing in R](Statistical-Report-Writing-in-R.html) — Build complete reproducible reports combining narrative, code, tables, and figures.
